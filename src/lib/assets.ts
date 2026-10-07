import type { AssetPath } from '$app/types';

type NameIn<Path, Folder extends string> = Path extends `${Folder}/${infer Name}.svg`
	? Name
	: never;

/**
 * Every icon in static/icons, by file name without the extension. SvelteKit
 * generates the list from the folder, so a misspelt icon name is a type error
 * and the editor autocompletes the rest.
 */
export type IconName = NameIn<AssetPath, 'icons'>;
