/*
 * Who eats at home tonight. One row per member and day in public.dinner_answers,
 * and only when they have answered: no row means no answer yet.
 */

import type { Supabase } from '#lib/supabase/client.ts';

export type DinnerAnswer = 'in' | 'out' | null;

/** Local time, HH:MM. A constant until the house wants to change it from the app. */
export const DINNER_TIME = '19:00';

/** Member id to answer for one day. Members without an entry have not answered. */
export async function fetchDinnerAnswers(
	supabase: Supabase,
	day: string
): Promise<Record<string, DinnerAnswer>> {
	const { data, error } = await supabase
		.from('dinner_answers')
		.select('member_id, answer')
		.eq('day', day);
	if (error) throw new Error(`Could not read dinner answers: ${error.message}`);

	return Object.fromEntries(data.map((row) => [row.member_id, row.answer]));
}

/** Saves the signed-in member's answer. Passing null withdraws it. */
export async function saveDinnerAnswer(
	supabase: Supabase,
	day: string,
	memberId: string,
	answer: DinnerAnswer
): Promise<void> {
	const { error } =
		answer === null
			? await supabase.from('dinner_answers').delete().eq('day', day).eq('member_id', memberId)
			: await supabase.from('dinner_answers').upsert({ day, member_id: memberId, answer });
	if (error) throw new Error(`Could not save the dinner answer: ${error.message}`);
}
