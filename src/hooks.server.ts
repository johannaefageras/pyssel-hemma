/*
 * Runs for every request. It builds a Supabase client that reads and writes the
 * session cookies, verifies who is signed in, and keeps everything except the
 * sign-in pages behind that check.
 *
 * This is the outer gate only. What a signed-in person may read or change is
 * decided by the row-level security rules in supabase/migrations.
 */

import { dev } from '$app/env';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';
import { createServerClient } from '@supabase/ssr';
import { redirect } from '@sveltejs/kit';
import type { Handle, HandleServerError } from '@sveltejs/kit/hooks';
import type { Database } from '#lib/supabase/database.types.ts';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_PUBLISHABLE_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet, headers) => {
					for (const { name, value, options } of cookiesToSet) {
						event.cookies.set(name, value, {
							...options,
							// SvelteKit requires a path on every cookie; '/' is the usual behaviour.
							path: '/',
							// SvelteKit marks cookies Secure everywhere except http://localhost, and
							// a phone drops Secure cookies sent over plain http. While developing,
							// follow the protocol instead, so `npm run dev -- --host` works on a
							// phone on the same wifi. A production build always sets Secure.
							...(dev ? { secure: event.url.protocol === 'https:' } : {})
						});
					}
					// Tells caches not to store a response that carries a session.
					// setHeaders refuses to set a header twice, which is fine here.
					try {
						event.setHeaders(headers);
					} catch {
						// Already set earlier in this request.
					}
				}
			}
		}
	);

	// getClaims checks the token's signature, which reading the cookie alone does not.
	const { data, error } = await event.locals.supabase.auth.getClaims();
	event.locals.claims = error ? null : (data?.claims ?? null);

	const { pathname } = event.url;
	// The sign-in page is the only one reachable without a session.
	if (!event.locals.claims && pathname !== '/login') redirect(303, '/login');
	if (event.locals.claims && pathname === '/login') redirect(303, '/');

	return resolve(event, {
		// supabase-js needs these two headers when a server-side fetch is replayed in the browser.
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};

// Errors that reach the page. Something thrown unexpectedly, such as the
// database being unreachable, is logged here and shown as a sentence a
// housemate can read. Errors raised on purpose with error(…) keep their message.
export const handleError: HandleServerError = ({ kind, error }) => {
	if (kind === 'unknown') {
		console.error(error);
		return { message: 'Något gick fel. Försök igen om en stund.' };
	}
	if (kind === 'framework' && error.status === 404) {
		return { message: 'Den sidan finns inte.' };
	}
};
