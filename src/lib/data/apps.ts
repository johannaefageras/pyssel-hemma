/*
 * The app registry: one entry per mini-app on the home screen.
 *
 * `slug` is the route. An app with `built: false` is served by the catch-all
 * placeholder in src/routes/[app]; give it a folder of its own under src/routes
 * and flip the flag when it exists. `icon` is a file name in static/icons.
 */

import type { IconName } from '#lib/assets.ts';

export type HouseApp = {
	slug: string;
	name: string;
	icon: IconName;
	built: boolean;
	/** One line for the placeholder page. */
	blurb: string;
};

export const apps: HouseApp[] = [
	{
		slug: 'inkop',
		name: 'Inköp',
		icon: 'home-everyday--grocery-bag',
		built: true,
		blurb: 'Den gemensamma inköpslistan.'
	},
	{
		slug: 'kylskapet',
		name: 'Kylskåpet',
		// There is no fridge icon in the set yet; the cooking pot stands in.
		icon: 'home-everyday--cooking-pot',
		built: false,
		blurb: 'Fota kylen och få förslag på vad du kan laga.'
	},
	{
		slug: 'att-gora',
		name: 'Att göra',
		icon: 'tasks-planning--clipboard',
		built: false,
		blurb: 'Dina egna och husets att göra-listor.'
	},
	{
		slug: 'stadning',
		name: 'Städning',
		icon: 'home-everyday--broom',
		built: false,
		blurb: 'Städschemat och vems tur det är.'
	},
	{
		slug: 'tvattstuga',
		name: 'Tvättstuga',
		icon: 'home-everyday--washing-machine',
		built: false,
		blurb: 'Boka en tid i tvättstugan.'
	},
	{
		slug: 'utlagg',
		name: 'Utlägg',
		icon: 'money-admin--receipt',
		built: false,
		blurb: 'Gemensamma utlägg och vem som är skyldig vem.'
	},
	{
		slug: 'filmkvall',
		name: 'Filmkväll',
		icon: 'circus-funfair--popcorn',
		built: false,
		blurb: 'Film- och serieförslag som fler än en står ut med.'
	},
	{
		slug: 'vaxter',
		name: 'Växter',
		icon: 'home-everyday--potted-plant',
		built: false,
		blurb: 'Vattning och skötsel av husets växter.'
	},
	{
		slug: 'husboken',
		name: 'Husboken',
		icon: 'study-knowledge--books',
		built: false,
		blurb: 'Wifi, sopdagar och hur torktumlaren egentligen fungerar.'
	}
];

export function appBySlug(slug: string): HouseApp | undefined {
	return apps.find((app) => app.slug === slug);
}
