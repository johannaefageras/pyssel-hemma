import { fetchGroceries } from '#lib/data/groceries.ts';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, depends }) => {
	depends('app:groceries');

	const { supabase } = await parent();
	return { items: await fetchGroceries(supabase) };
};
