/*
 * The grocery list: the public.grocery_items table, plus the aisles and the
 * small amount of text handling done when a new item is typed in.
 */

import type { IconName } from '#lib/assets.ts';
import type { Supabase } from '#lib/supabase/client.ts';

export type AisleId = 'frukt-gront' | 'mejeri' | 'brod' | 'skafferi' | 'hushall' | 'ovrigt';

export type Aisle = {
	id: AisleId;
	name: string;
	icon: IconName;
};

export type GroceryItem = {
	id: string;
	name: string;
	/** Free text, like "6 st" or "2 liter". */
	quantity: string | null;
	aisle: AisleId;
	/** Member id, or null if that member has since left the house. */
	addedBy: string | null;
	picked: boolean;
};

/** In shop order, which is also the order the groups are shown in. */
export const aisles: Aisle[] = [
	{ id: 'frukt-gront', name: 'Frukt & grönt', icon: 'fruits-vegetables--carrot' },
	{ id: 'mejeri', name: 'Mejeri & ägg', icon: 'food-drink--cheese' },
	{ id: 'brod', name: 'Bröd', icon: 'food-drink--croissant' },
	// No pantry icon in the set yet; the cooking pot stands in.
	{ id: 'skafferi', name: 'Skafferi', icon: 'home-everyday--cooking-pot' },
	{ id: 'hushall', name: 'Hushåll', icon: 'home-everyday--broom' },
	{ id: 'ovrigt', name: 'Övrigt', icon: 'home-everyday--grocery-bag' }
];

function isAisleId(value: string): value is AisleId {
	return aisles.some((aisle) => aisle.id === value);
}

// ── Reading and writing ────────────────────────────────────────────────────

export async function fetchGroceries(supabase: Supabase): Promise<GroceryItem[]> {
	const { data, error } = await supabase
		.from('grocery_items')
		.select('id, name, quantity, aisle, added_by, picked')
		.order('created_at');
	if (error) throw new Error(`Could not read the grocery list: ${error.message}`);

	return data.map((row) => ({
		id: row.id,
		name: row.name,
		quantity: row.quantity,
		// The database does not constrain aisles, so an id this version of the
		// app does not know (yet) is shown under Övrigt.
		aisle: isAisleId(row.aisle) ? row.aisle : 'ovrigt',
		addedBy: row.added_by,
		picked: row.picked
	}));
}

/** How many items are still to buy. Used for the count on the home screen. */
export async function countRemaining(supabase: Supabase): Promise<number> {
	const { count, error } = await supabase
		.from('grocery_items')
		.select('id', { count: 'exact', head: true })
		.eq('picked', false);
	if (error) throw new Error(`Could not count the grocery list: ${error.message}`);
	return count ?? 0;
}

/** Adds an item. The database records who added it. */
export async function addGrocery(
	supabase: Supabase,
	item: Pick<GroceryItem, 'name' | 'quantity' | 'aisle'>
): Promise<void> {
	const { error } = await supabase.from('grocery_items').insert(item);
	if (error) throw new Error(`Could not add the item: ${error.message}`);
}

export async function setPicked(supabase: Supabase, id: string, picked: boolean): Promise<void> {
	const { error } = await supabase.from('grocery_items').update({ picked }).eq('id', id);
	if (error) throw new Error(`Could not update the item: ${error.message}`);
}

export async function clearPicked(supabase: Supabase): Promise<void> {
	const { error } = await supabase.from('grocery_items').delete().eq('picked', true);
	if (error) throw new Error(`Could not clear the list: ${error.message}`);
}

export function remaining(items: GroceryItem[]): number {
	return items.filter((item) => !item.picked).length;
}

// ── Typing in a new item ───────────────────────────────────────────────────

const UNITS = 'st|kg|hg|g|liter|l|dl|cl|ml|pkt|paket|förp|burk|burkar|påse|påsar|flaska|flaskor';
const AMOUNT = `(\\d+(?:[.,]\\d+)?)\\s*(${UNITS})?`;
const TRAILING = new RegExp(`^(.+?)\\s+${AMOUNT}$`, 'i');
const LEADING = new RegExp(`^${AMOUNT}\\s+(\\p{L}.*)$`, 'iu');

/**
 * Splits what was typed into a name and an optional quantity:
 * "bananer 6 st", "6 bananer" and "havremjölk 2 l" all work.
 */
export function parseDraft(draft: string): { name: string; quantity: string | null } {
	const text = draft.trim().replace(/\s+/g, ' ');
	let name = text;
	let amount: string | undefined;
	let unit: string | undefined;

	const trailing = TRAILING.exec(text);
	const leading = trailing ? null : LEADING.exec(text);
	if (trailing) [, name, amount, unit] = trailing;
	else if (leading) [, amount, unit, name] = leading;

	// A lone "l" reads as 1 in the mono face the quantity is set in.
	if (unit?.toLowerCase() === 'l') unit = 'liter';

	return {
		name: name.charAt(0).toUpperCase() + name.slice(1),
		quantity: amount ? [amount, unit?.toLowerCase()].filter(Boolean).join(' ') : null
	};
}

/*
 * Sorting a new item into an aisle is the job for Claude: one small Haiku call
 * from a server endpoint, with this lookup as the instant fallback. Until that
 * endpoint exists the lookup is all there is, and unknown words land in Övrigt.
 */
const keywords: Record<Exclude<AisleId, 'ovrigt'>, string[]> = {
	'frukt-gront': [
		'banan',
		'tomat',
		'vitlök',
		'gurk',
		'äpple',
		'lök',
		'potatis',
		'morot',
		'morötter',
		'sallad',
		'citron',
		'paprika',
		'avokado',
		'svamp',
		'broccoli',
		'ingefära',
		'frukt',
		'bär'
	],
	mejeri: ['mjölk', 'ägg', 'smör', 'fil', 'yoghurt', 'ost', 'grädde', 'kvarg', 'crème'],
	brod: ['bröd', 'limpa', 'fralla', 'frallor', 'knäcke', 'tortilla', 'bulle', 'bullar'],
	skafferi: [
		'pasta',
		'ris',
		'linser',
		'bönor',
		'kaffe',
		'te',
		'mjöl',
		'socker',
		'salt',
		'olja',
		'krossade',
		'buljong',
		'havregryn',
		'müsli',
		'nötter',
		'krydd'
	],
	hushall: [
		'diskmedel',
		'disksvamp',
		'toalettpapper',
		'toapapper',
		'soppås',
		'tvättmedel',
		'hushållspapper',
		'tvål',
		'schampo',
		'folie',
		'bakplåtspapper'
	]
};

/* Short keywords are matched strictly, or "te" would catch "tejp" and "ost" "rostbiff". */
function matches(word: string, keyword: string): boolean {
	if (keyword.length <= 2) return word === keyword;
	if (keyword.length === 3) return word === keyword || word.endsWith(keyword);
	return word.includes(keyword);
}

export function guessAisle(name: string): AisleId {
	const words = name.trim().toLowerCase().split(/\s+/);
	// Mejeri and hushåll go first so "havremjölk" and "disksvamp" land where they should.
	const order: Exclude<AisleId, 'ovrigt'>[] = [
		'mejeri',
		'hushall',
		'frukt-gront',
		'brod',
		'skafferi'
	];
	for (const aisle of order) {
		if (keywords[aisle].some((keyword) => words.some((word) => matches(word, keyword)))) {
			return aisle;
		}
	}
	return 'ovrigt';
}
