/*
 * Environment variables. SvelteKit reads this file, validates the values when
 * the app starts, and exposes them through `$app/env/public`.
 *
 * Both values are safe to ship to the browser: the publishable key only lets a
 * visitor do what the row-level security rules allow. Never put a secret key
 * (sb_secret_… or service_role) here.
 */

import { defineEnvVars } from '@sveltejs/kit/env';

const hint = 'Copy .env.example to .env and fill it in (Supabase: Project Settings, API Keys).';

export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: {
		public: true,
		description: 'The project URL, like https://abcdefgh.supabase.co',
		schema: (value) => {
			if (!value) throw new Error(`PUBLIC_SUPABASE_URL is not set. ${hint}`);
			if (!URL.canParse(value)) throw new Error('PUBLIC_SUPABASE_URL is not a valid URL.');
			return value.replace(/\/+$/, '');
		}
	},
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
		public: true,
		description: 'The publishable key (sb_publishable_…), or the legacy anon key',
		schema: (value) => {
			if (!value) throw new Error(`PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set. ${hint}`);
			if (value.startsWith('sb_secret_')) {
				throw new Error(
					'PUBLIC_SUPABASE_PUBLISHABLE_KEY holds a secret key. Use the publishable one.'
				);
			}
			return value;
		}
	}
});
