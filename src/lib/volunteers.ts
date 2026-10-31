import { DatabaseError } from "pg";
import { z } from "zod";
import { query, UserError } from "./db";

export type VolunteerRow = {
  id: number;
  name: string;
  lists: number;
  attempts: number;
  conversations: number;
};

export const volunteerNameSchema = z
  .string()
  .trim()
  .min(1, "Enter a name")
  .max(80, "Names are limited to 80 characters");

export async function listVolunteers(): Promise<VolunteerRow[]> {
  return query<VolunteerRow>(
    `select vol.id, vol.name,
            (select count(*)::int from lists l where l.volunteer_id = vol.id) as lists,
            (select count(*)::int from contacts c where c.volunteer_id = vol.id) as attempts,
            (select count(*)::int from contacts c
             where c.volunteer_id = vol.id and c.outcome = 'reached') as conversations
     from volunteers vol
     order by vol.name`,
  );
}

export async function getVolunteer(id: number): Promise<{ id: number; name: string } | null> {
  const rows = await query<{ id: number; name: string }>("select id, name from volunteers where id = $1", [id]);
  return rows[0] ?? null;
}

export async function addVolunteer(name: string): Promise<number> {
  try {
    const rows = await query<{ id: number }>("insert into volunteers (name) values ($1) returning id", [name]);
    return rows[0].id;
  } catch (error) {
    // 23505 = unique_violation
    if (error instanceof DatabaseError && error.code === "23505") {
      throw new UserError(`${name} is already a volunteer.`);
    }
    throw error;
  }
}
