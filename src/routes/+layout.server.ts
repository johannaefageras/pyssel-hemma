import type { LayoutServerLoad } from './$types';

// Hands the session cookies to +layout.ts, which builds the Supabase client
// for server-side rendering from them.
export const load: LayoutServerLoad = ({ cookies }) => {
	return { cookies: cookies.getAll() };
};
