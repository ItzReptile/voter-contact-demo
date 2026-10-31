import type { Outcome } from "./constants";
import { query } from "./db";

export type Totals = {
  voters: number;
  voters_on_lists: number;
  attempts: number;
  conversations: number;
  // Distinct voters who gave a 1 or 2 in any conversation.
  supporters: number;
};

export type PrecinctStats = {
  precinct: string;
  voters: number;
  voters_attempted: number;
  attempts: number;
  conversations: number;
  supporters: number;
};

export async function getTotals(): Promise<Totals> {
  const rows = await query<Totals>(
    `select (select count(*)::int from voters) as voters,
            (select count(distinct voter_id)::int from list_voters) as voters_on_lists,
            (select count(*)::int from contacts) as attempts,
            (select count(*)::int from contacts where outcome = 'reached') as conversations,
            (select count(distinct voter_id)::int from contacts where support <= 2) as supporters`,
  );
  return rows[0];
}

export async function getOutcomeCounts(): Promise<Record<Outcome, number>> {
  const rows = await query<{ outcome: Outcome; count: number }>(
    "select outcome, count(*)::int as count from contacts group by outcome",
  );
  const counts: Record<Outcome, number> = { reached: 0, not_home: 0, moved: 0, wrong_number: 0 };
  for (const row of rows) counts[row.outcome] = row.count;
  return counts;
}

export async function getPrecinctStats(): Promise<PrecinctStats[]> {
  return query<PrecinctStats>(
    `select v.precinct,
            count(distinct v.id)::int as voters,
            count(distinct c.voter_id)::int as voters_attempted,
            count(c.id)::int as attempts,
            (count(c.id) filter (where c.outcome = 'reached'))::int as conversations,
            (count(distinct c.voter_id) filter (where c.support <= 2))::int as supporters
     from voters v
     left join contacts c on c.voter_id = v.id
     group by v.precinct
     order by v.precinct`,
  );
}

/** The campaign's local time zone: "a day" on the dashboard is a day here. */
export const CAMPAIGN_TIME_ZONE = "America/Detroit";

export type DayCounts = { day: string } & Record<Outcome, number>;

/** Attempts per day by outcome for the last `days` days, including days with none. */
export async function getAttemptsByDay(days = 14): Promise<DayCounts[]> {
  return query<DayCounts>(
    `with days as (
       select generate_series(
         (now() at time zone $2)::date - ($1::int - 1),
         (now() at time zone $2)::date,
         interval '1 day'
       )::date as day
     )
     select to_char(d.day, 'YYYY-MM-DD') as day,
            (count(c.id) filter (where c.outcome = 'reached'))::int as reached,
            (count(c.id) filter (where c.outcome = 'not_home'))::int as not_home,
            (count(c.id) filter (where c.outcome = 'moved'))::int as moved,
            (count(c.id) filter (where c.outcome = 'wrong_number'))::int as wrong_number
     from days d
     left join contacts c on (c.created_at at time zone $2)::date = d.day
     group by d.day
     order by d.day`,
    [days, CAMPAIGN_TIME_ZONE],
  );
}

/** Support IDs recorded in conversations, 1-5. */
export async function getSupportCounts(): Promise<Record<number, number>> {
  const rows = await query<{ support: number; count: number }>(
    "select support, count(*)::int as count from contacts where support is not null group by support",
  );
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const row of rows) counts[row.support] = row.count;
  return counts;
}
