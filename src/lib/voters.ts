import type { Outcome, Party } from "./constants";
import type { VoterInput } from "./csv";
import { query, withTransaction } from "./db";
import { buildVoterWhere, voterOrderBy, type VoterFilters } from "./voter-filters";

// Row types mirror the table columns (snake_case). Function inputs are camelCase.
export type VoterRow = {
  id: number;
  voter_file_id: string;
  first_name: string;
  last_name: string;
  address: string;
  precinct: string;
  age: number;
  party: Party;
  phone: string | null;
  support_score: number;
};

export const VOTER_COLUMNS =
  "v.id, v.voter_file_id, v.first_name, v.last_name, v.address, v.precinct, v.age, v.party, v.phone, v.support_score";

/**
 * Inserts new voters and updates existing ones (matched on voter_file_id) in one statement.
 * unnest() turns the parallel arrays into rows, so 5,000 voters is one round trip, not 5,000.
 */
export async function importVoters(voters: VoterInput[]): Promise<{ inserted: number; updated: number }> {
  if (voters.length === 0) return { inserted: 0, updated: 0 };

  const ids = voters.map((voter) => voter.voterFileId);
  return withTransaction(async (client) => {
    const existing = await client.query<{ count: number }>(
      "select count(*)::int as count from voters where voter_file_id = any($1)",
      [ids],
    );
    const updated = existing.rows[0].count;

    await client.query(
      `insert into voters (voter_file_id, first_name, last_name, address, house_number, street,
                           city, zip, precinct, age, party, phone, support_score)
       select * from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[], $6::text[],
                            $7::text[], $8::text[], $9::text[], $10::int[], $11::text[], $12::text[], $13::int[])
       on conflict (voter_file_id) do update set
         first_name = excluded.first_name,
         last_name = excluded.last_name,
         address = excluded.address,
         house_number = excluded.house_number,
         street = excluded.street,
         city = excluded.city,
         zip = excluded.zip,
         precinct = excluded.precinct,
         age = excluded.age,
         party = excluded.party,
         phone = excluded.phone,
         support_score = excluded.support_score,
         updated_at = now()`,
      [
        ids,
        voters.map((v) => v.firstName),
        voters.map((v) => v.lastName),
        voters.map((v) => v.address),
        voters.map((v) => v.houseNumber),
        voters.map((v) => v.street),
        voters.map((v) => v.city),
        voters.map((v) => v.zip),
        voters.map((v) => v.precinct),
        voters.map((v) => v.age),
        voters.map((v) => v.party),
        voters.map((v) => v.phone),
        voters.map((v) => v.supportScore),
      ],
    );

    return { inserted: voters.length - updated, updated };
  });
}

export async function countVoters(): Promise<number> {
  const rows = await query<{ count: number }>("select count(*)::int as count from voters");
  return rows[0].count;
}

export type VoterTableRow = VoterRow & { last_outcome: Outcome | null; last_contact_at: Date | null };

/** One page of the voter table, with each voter's latest attempt on any list, plus the filtered total. */
export async function searchVoters(filters: VoterFilters): Promise<{ total: number; rows: VoterTableRow[] }> {
  const { where, params } = buildVoterWhere(filters);
  const n = params.length;
  const [countRows, rows] = await Promise.all([
    query<{ count: number }>(`select count(*)::int as count from voters v where ${where}`, params),
    query<VoterTableRow>(
      `select ${VOTER_COLUMNS}, last.outcome as last_outcome, last.created_at as last_contact_at
       from voters v
       left join lateral (
         select c.outcome, c.created_at from contacts c
         where c.voter_id = v.id
         order by c.created_at desc, c.id desc
         limit 1
       ) last on true
       where ${where}
       order by ${voterOrderBy(filters)}
       limit $${n + 1} offset $${n + 2}`,
      [...params, filters.pageSize, (filters.page - 1) * filters.pageSize],
    ),
  ]);
  return { total: countRows[0].count, rows };
}

export async function listPrecincts(): Promise<string[]> {
  const rows = await query<{ precinct: string }>("select distinct precinct from voters order by precinct");
  return rows.map((row) => row.precinct);
}
