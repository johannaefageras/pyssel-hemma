import type { HandleClientError } from '@sveltejs/kit/hooks';

// The browser's counterpart to handleError in hooks.server.ts: something thrown
// unexpectedly while moving between pages, such as the network dropping.
export const handleError: HandleClientError = ({ kind, error }) => {
	if (kind === 'unknown') {
		console.error(error);
		return { message: 'Något gick fel. Kolla nätet och försök igen.' };
	}
	if (kind === 'framework' && error.status === 404) {
		return { message: 'Den sidan finns inte.' };
	}
};
