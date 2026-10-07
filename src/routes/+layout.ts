/*
 * Creates the Supabase client every page uses, as `data.supabase`.
 *
 * In the browser it is one long-lived client that talks to Supabase directly.
 * During server-side rendering it is a fresh client per request, built from
 * the cookies passed down by +layout.server.ts.
 */

import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';
import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import type { Database } from '#lib/supabase/database.types.ts';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	// Re-run when someone signs in or out; see +layout.svelte.
	depends('supabase:auth');

	const supabase = isBrowser()
		? createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
				global: { fetch }
			})
		: createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
				global: { fetch },
				cookies: { getAll: () => data.cookies }
			});

	// Verifies the token's signature; a cookie on its own proves nothing.
	const { data: verified, error } = await supabase.auth.getClaims();
	const claims = error ? null : (verified?.claims ?? null);

	return { supabase, claims };
};
