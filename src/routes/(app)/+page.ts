import { fetchDinnerAnswers } from '#lib/data/dinner.ts';
import { countRemaining } from '#lib/data/groceries.ts';
import { houseDateLabel, houseDay } from '#lib/day.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, depends }) => {
	depends('app:dinner', 'app:groceries');

	const { supabase } = await parent();
	const now = new Date();
	const day = houseDay(now);

	const [answers, groceriesLeft] = await Promise.all([
		fetchDinnerAnswers(supabase, day),
		countRemaining(supabase)
	]);

	return {
		// Worked out here so the server render and the browser agree on the date.
		dateLabel: houseDateLabel(now),
		day,
		answers,
		groceriesLeft
	};
};
