// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { JwtPayload } from '@supabase/supabase-js';
import type { Member } from '#lib/data/household.ts';
import type { Supabase } from '#lib/supabase/client.ts';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: Supabase;
			/** The verified claims of the signed-in user's token, or null. */
			claims: JwtPayload | null;
		}
		// What `page.data` may hold, for components that read it through $app/state.
		// All optional: a load function only has to return what it adds. Pages get
		// exact types from their own `data` prop instead.
		interface PageData {
			/** Set by src/routes/+layout.ts, so present on every page. */
			supabase?: Supabase;
			claims?: JwtPayload | null;
			/** Set by src/routes/(app)/+layout.ts, so present on every page in that folder. */
			me?: Member;
			members?: Member[];
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
