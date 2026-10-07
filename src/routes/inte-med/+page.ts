import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

// Shown to someone who is signed in with an address that is not on the members
// list. If they have been added since, send them on to the app.
export const load: PageLoad = async ({ parent }) => {
	const { supabase, claims } = await parent();

	const { data: memberId } = await supabase.rpc('current_member_id');
	if (memberId) redirect(303, '/');

	return { email: typeof claims?.email === 'string' ? claims.email : null };
};
