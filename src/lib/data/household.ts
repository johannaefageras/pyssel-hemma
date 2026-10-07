/*
 * The household. Colour means person: each member owns one mascot colour and
 * keeps it everywhere. Yellow is the brand mascot, so it is not handed out.
 *
 * Members live in the public.members table and are edited there, with SQL.
 * See supabase/members.example.sql.
 */

import type { Supabase } from '#lib/supabase/client.ts';

export const mascotColours = [
	'yellow',
	'blue',
	'pink',
	'green',
	'orange',
	'purple',
	'red',
	'brown',
	'light',
	'dark'
] as const;

export type MascotColour = (typeof mascotColours)[number];

export type Member = {
	id: string;
	name: string;
	colour: MascotColour;
};

function isMascotColour(value: string): value is MascotColour {
	return (mascotColours as readonly string[]).includes(value);
}

/**
 * Everyone in the house, and which of them is signed in.
 * `me` is null when the signed-in address is not on the members list.
 */
export async function fetchHousehold(
	supabase: Supabase
): Promise<{ members: Member[]; me: Member | null }> {
	const [list, mine] = await Promise.all([
		supabase.from('members').select('id, name, colour').order('name'),
		supabase.rpc('current_member_id')
	]);
	if (list.error) throw new Error(`Could not read members: ${list.error.message}`);
	if (mine.error) throw new Error(`Could not read the current member: ${mine.error.message}`);

	const members = list.data.map((row) => ({
		id: row.id,
		name: row.name,
		// The table only allows mascot colours; this guards against a renamed file.
		colour: isMascotColour(row.colour) ? row.colour : 'light'
	}));

	return { members, me: members.find((member) => member.id === mine.data) ?? null };
}
