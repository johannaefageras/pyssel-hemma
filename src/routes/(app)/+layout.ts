/*
 * Everything in this folder is for members only. The hook already requires a
 * session; this adds the household, and turns away a signed-in address that is
 * not on the members list.
 */

import { redirect } from '@sveltejs/kit';
import { fetchHousehold } from '#lib/data/household.ts';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent }) => {
	const { supabase } = await parent();
	const { members, me } = await fetchHousehold(supabase);

	if (!me) redirect(303, '/inte-med');

	return { members, me };
};
