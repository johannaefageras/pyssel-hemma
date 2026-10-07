import { error } from '@sveltejs/kit';
import { appBySlug } from '#lib/data/apps.ts';
import type { PageLoad } from './$types';

/*
 * The placeholder for apps in the registry that have no route of their own yet.
 * A real route (src/routes/inkop) always wins over this catch-all.
 */
export const load: PageLoad = ({ params }) => {
	const app = appBySlug(params.app);
	if (!app) error(404, 'Den sidan finns inte.');
	return { app };
};
