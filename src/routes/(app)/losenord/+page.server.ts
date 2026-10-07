/*
 * Choosing or changing a password. It is optional: the emailed code always
 * works, and is also the way back in for someone who has forgotten theirs.
 *
 * Saving does three things, in this order:
 *   1. sets the password on the account, replacing any it had before,
 *   2. turns password sign-in on for this member in the database,
 *   3. signs out the account's other sessions.
 * Step 2 is what makes a password session count as a member at all; see
 * supabase/migrations/20261008000000_password_login.sql for why.
 */

import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

const MIN_LENGTH = 8;

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const form = await request.formData();
		// Not trimmed: a password may begin or end with a space.
		const password = String(form.get('password') ?? '');
		const again = String(form.get('again') ?? '');

		if (password.length < MIN_LENGTH) {
			return fail(400, { message: `Lösenordet behöver vara minst ${MIN_LENGTH} tecken.` });
		}
		if (password !== again) {
			return fail(400, { message: 'De två lösenorden är inte lika.' });
		}

		const { error } = await supabase.auth.updateUser({ password });
		if (error) {
			const messages: Record<string, string> = {
				same_password: 'Det är redan ditt lösenord.',
				weak_password: 'Lösenordet är för svagt. Välj ett längre eller ovanligare.',
				// Supabase can be set to demand a fresh sign-in or the current password.
				reauthentication_needed: 'Logga ut, logga in med kod och försök igen.',
				reauth_nonce_missing: 'Logga ut, logga in med kod och försök igen.'
			};
			return fail(400, {
				message: messages[error.code ?? ''] ?? 'Det gick inte att spara lösenordet. Försök igen.'
			});
		}

		const enabled = await supabase.rpc('enable_password_login');
		if (enabled.error) {
			return fail(500, {
				message:
					'Lösenordet sparades men kunde inte slås på. Logga ut, logga in med kod och försök igen.'
			});
		}

		// Anyone else holding a session for this account is out. Not fatal if it fails.
		await supabase.auth.signOut({ scope: 'others' });

		return { saved: true };
	}
};
