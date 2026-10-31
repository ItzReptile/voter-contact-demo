import type { ListKind, Outcome } from "./constants";
import { query, UserError, withTransaction } from "./db";
import { buildSegmentWhere, listOrderBy, type Segment } from "./segments";
import { VOTER_COLUMNS, type VoterRow } from "./voters";

export type ListSummary = {
  id: number;
  name: string;
  kind: ListKind;
  segment: Segment;
  created_at: Date;
  volunteer_id: number | null;
  volunteer_name: string | null;
  size: number;
  voters_attempted: number;
  attempts: number;
  conversations: number;
};

export type ListVoterRow = VoterRow & {
  position: number;
  attempts: number;
  last_outcome: Outcome | null;
  last_support: number | null;
  last_notes: string | null;
  last_contact_at: Date | null;
};

/** How many voters a segment matches, plus the first few in list order. */
export async function previewSegment(
  segment: Segment,
  kind: ListKind,
  sampleSize = 10,
): Promise<{ count: number; sample: VoterRow[] }> {
  const { where, params } = buildSegmentWhere(segment, kind);
  const [countRows, sample] = await Promise.all([
    query<{ count: number }>(`select count(*)::int as count from voters v where ${where}`, params),
    query<VoterRow>(
      `select ${VOTER_COLUMNS} from voters v where ${where}
       order by ${listOrderBy(kind)} limit $${params.length + 1}`,
      [...params, sampleSize],
    ),
  ]);
  return { count: countRows[0].count, sample };
}

/**
 * Creates a list and snapshots the voters who match the segment right now, numbered in
 * walk or call order. Later imports and contacts don't change who is on it.
 */
export async function createList(input: { name: string; kind: ListKind; segment: Segment }): Promise<number> {
  const { where, params } = buildSegmentWhere(input.segment, input.kind);

  return withTransaction(async (client) => {
    const list = await client.query<{ id: number }>(
      "insert into lists (name, kind, segment) values ($1, $2, $3) returning id",
      [input.name, input.kind, input.segment],
    );
    const listId = list.rows[0].id;

    const added = await client.query(
      `insert into list_voters (list_id, voter_id, position)
       select $${params.length + 1}, v.id, row_number() over (order by ${listOrderBy(input.kind)})
       from voters v
       where ${where}`,
      [...params, listId],
    );
    if (added.rowCount === 0) throw new UserError("No voters match this segment.");

    return listId;
  });
}

const SUMMARY_SQL = `
  select l.id, l.name, l.kind, l.segment, l.created_at, l.volunteer_id,
         vol.name as volunteer_name,
         (select count(*)::int from list_voters lv where lv.list_id = l.id) as size,
         stats.voters_attempted, stats.attempts, stats.conversations
  from lists l
  left join volunteers vol on vol.id = l.volunteer_id
  cross join lateral (
    select count(distinct c.voter_id)::int as voters_attempted,
           count(*)::int as attempts,
           (count(*) filter (where c.outcome = 'reached'))::int as conversations
    from contacts c
    where c.list_id = l.id
  ) stats`;

export async function getListSummaries(): Promise<ListSummary[]> {
  return query<ListSummary>(`${SUMMARY_SQL} order by l.created_at desc, l.id desc`);
}

export async function getListSummary(listId: number): Promise<ListSummary | null> {
  const rows = await query<ListSummary>(`${SUMMARY_SQL} where l.id = $1`, [listId]);
  return rows[0] ?? null;
}

export async function getListsForVolunteer(volunteerId: number): Promise<ListSummary[]> {
  return query<ListSummary>(`${SUMMARY_SQL} where l.volunteer_id = $1 order by l.created_at desc`, [volunteerId]);
}

/** Voters on a list in order, each with their latest attempt on this list. */
export async function getListVoters(listId: number, options: { remainingOnly?: boolean } = {}): Promise<ListVoterRow[]> {
  return query<ListVoterRow>(
    `select ${VOTER_COLUMNS}, lv.position,
            (select count(*)::int from contacts c
             where c.list_id = lv.list_id and c.voter_id = lv.voter_id) as attempts,
            last.outcome as last_outcome, last.support as last_support,
            last.notes as last_notes, last.created_at as last_contact_at
     from list_voters lv
     join voters v on v.id = lv.voter_id
     left join lateral (
       select c.outcome, c.support, c.notes, c.created_at
       from contacts c
       where c.list_id = lv.list_id and c.voter_id = lv.voter_id
       order by c.created_at desc, c.id desc
       limit 1
     ) last on true
     where lv.list_id = $1
       and (not $2 or last.outcome is distinct from 'reached')
     order by lv.position`,
    [listId, options.remainingOnly ?? false],
  );
}

export type CanvassVoter = VoterRow & { position: number };

/**
 * The volunteer view works one voter at a time: the next voter in list order, after
 * `afterPosition` (for skipping), who has no attempt on this list yet.
 */
export async function getCanvassState(
  listId: number,
  afterPosition = 0,
): Promise<{ next: CanvassVoter | null; remaining: number }> {
  const notAttempted =
    "not exists (select 1 from contacts c where c.list_id = lv.list_id and c.voter_id = lv.voter_id)";
  const [next, counts] = await Promise.all([
    query<CanvassVoter>(
      `select ${VOTER_COLUMNS}, lv.position
       from list_voters lv join voters v on v.id = lv.voter_id
       where lv.list_id = $1 and lv.position > $2 and ${notAttempted}
       order by lv.position
       limit 1`,
      [listId, afterPosition],
    ),
    query<{ remaining: number }>(
      `select count(*)::int as remaining from list_voters lv where lv.list_id = $1 and ${notAttempted}`,
      [listId],
    ),
  ]);
  return { next: next[0] ?? null, remaining: counts[0].remaining };
}

export async function assignList(listId: number, volunteerId: number | null): Promise<void> {
  const rows = await query<{ id: number }>("update lists set volunteer_id = $2 where id = $1 returning id", [
    listId,
    volunteerId,
  ]);
  if (rows.length === 0) throw new UserError("List not found.");
}
