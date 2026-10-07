/*
 * Signing in. The main way needs no password: the member types their email
 * address, gets a six-digit code by email, and types the code in. A member who
 * has chosen a password (under their name, once signed in) can use that instead.
 *
 * A code rather than a magic link, for two reasons. A link opens in the phone's
 * browser, while the app, once added to the home screen, keeps its session
 * somewhere else. And some mail services open every link in a message to scan
 * it, which uses a magic link up before the member gets to it.
 *
 * The email does carry a link, but only to this page with the code filled in
 * (see supabase/email-template.html). Nothing happens until the button is pressed.
 */

import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ url }) => {
	// A "+" in an address arrives as a space when the link is not encoded.
	const email = (url.searchParams.get('email') ?? '').trim().replace(/ /g, '+').toLowerCase();
	const code = (url.searchParams.get('kod') ?? '').replace(/\D/g, '').slice(0, 10);

	return {
		prefill: email && code ? { email, code } : null,
		// /login?med=losenord opens the password form.
		mode: url.searchParams.get('med') === 'losenord' ? ('password' as const) : ('code' as const)
	};
};

function field(form: FormData, name: string): string {
	const value = form.get(name);
	return typeof value === 'string' ? value.trim() : '';
}

export const actions: Actions = {
	/** Step one: send a code to the address, if it belongs to the house. */
	send: async ({ request, locals: { supabase } }) => {
		const email = field(await request.formData(), 'email').toLowerCase();

		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { step: 'email' as const, email, message: 'Skriv en e-postadress.' });
		}

		const lookup = await supabase.rpc('is_house_email', { candidate: email });
		if (lookup.error) {
			return fail(503, {
				step: 'email' as const,
				email,
				message: 'Det gick inte att nå servern. Försök igen om en stund.'
			});
		}

		if (lookup.data) {
			const { error } = await supabase.auth.signInWithOtp({ email });
			if (error) {
				const tooSoon = error.status === 429;
				// Supabase's built-in mail service only delivers to the project's own team.
				const notAllowed = error.code === 'email_address_not_authorized';
				return fail(tooSoon ? 429 : 502, {
					step: 'email' as const,
					email,
					message: tooSoon
						? 'Du har nyss fått en kod. Vänta en minut innan du ber om en ny.'
						: notAllowed
							? 'Mejl kan inte skickas till den här adressen än. Huset behöver ställa in en egen mejltjänst (SMTP) i Supabase.'
							: 'Det gick inte att skicka koden. Försök igen om en stund.'
				});
			}
		}

		// The same answer whether or not the address is a member's, so the form
		// does not reveal who lives in the house.
		return { step: 'code' as const, email };
	},

	/** Step two: check the code. Success sets the session cookies. */
	verify: async ({ request, locals: { supabase } }) => {
		const form = await request.formData();
		const email = field(form, 'email').toLowerCase();
		const token = field(form, 'token').replace(/\s+/g, '');

		if (!email) redirect(303, '/login');
		if (!/^\d{6,10}$/.test(token)) {
			return fail(400, { step: 'code' as const, email, message: 'Koden består av siffror.' });
		}

		const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
		if (error) {
			return fail(400, {
				step: 'code' as const,
				email,
				message: 'Koden stämmer inte eller har gått ut. Be om en ny.'
			});
		}

		redirect(303, '/');
	},

	/** The other way in: email address and password. */
	password: async ({ request, locals: { supabase } }) => {
		const form = await request.formData();
		const email = field(form, 'email').toLowerCase();
		// Not trimmed: a password may begin or end with a space.
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, {
				step: 'password' as const,
				email,
				message: 'Fyll i både adress och lösenord.'
			});
		}

		const { error } = await supabase.auth.signInWithPassword({ email, password });
		if (error) {
			const tooMany = error.status === 429;
			// One answer for a wrong password, an unknown address and an unconfirmed
			// account alike, so the form does not reveal which it was.
			return fail(tooMany ? 429 : 400, {
				step: 'password' as const,
				email,
				message: tooMany
					? 'För många försök. Vänta en stund, eller logga in med kod.'
					: 'Fel adress eller lösenord.'
			});
		}

		// The password was right, but the database only treats a password session as
		// a member once that member has chosen a password in the app (see the
		// password sign-in migration). If this is a member who has not, say so
		// instead of leaving them on the "not a member" page.
		const { data: memberId } = await supabase.rpc('current_member_id');
		if (!memberId) {
			const { data: isHouse } = await supabase.rpc('is_house_email', { candidate: email });
			if (isHouse) {
				// Only this session; the member's other devices stay signed in.
				await supabase.auth.signOut({ scope: 'local' });
				return fail(403, {
					step: 'password' as const,
					email,
					message:
						'Lösenord är inte påslaget för den här adressen. Logga in med kod, tryck på din figur och välj ett lösenord.'
				});
			}
		}

		redirect(303, '/');
	}
};
