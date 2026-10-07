/*
 * Light and dark theme. The site follows the system setting until someone picks
 * a theme; that choice is saved in this browser. The inline script in app.html
 * applies the theme before first paint, using the same storage key.
 */

export type ThemeChoice = 'system' | 'light' | 'dark';

const KEY = 'pyssel-hemma-theme';

function systemTheme(): 'light' | 'dark' {
	return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getThemeChoice(): ThemeChoice {
	try {
		const saved = localStorage.getItem(KEY);
		return saved === 'light' || saved === 'dark' ? saved : 'system';
	} catch {
		return 'system';
	}
}

export function setThemeChoice(choice: ThemeChoice): void {
	try {
		if (choice === 'system') localStorage.removeItem(KEY);
		else localStorage.setItem(KEY, choice);
	} catch {
		// Storage can be blocked; the theme still applies for this visit.
	}
	document.documentElement.dataset.theme = choice === 'system' ? systemTheme() : choice;
}

/** Keeps a "system" choice in step with the OS. Returns a cleanup function. */
export function followSystemTheme(): () => void {
	const query = matchMedia('(prefers-color-scheme: dark)');
	const onChange = () => {
		if (getThemeChoice() === 'system') {
			document.documentElement.dataset.theme = systemTheme();
		}
	};
	query.addEventListener('change', onChange);
	return () => query.removeEventListener('change', onChange);
}
