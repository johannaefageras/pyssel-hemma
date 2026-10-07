<script lang="ts">
	import '#lib/styles/tokens.css';
	import '#lib/styles/fonts.css';
	import '#lib/styles/base.css';

	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { followSystemTheme } from '#lib/theme.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	onMount(() => followSystemTheme());

	// Keep the page in step with the session in this browser.
	onMount(() => {
		const { data: listener } = data.supabase.auth.onAuthStateChange((event, session) => {
			// Signed out, here or in another tab: start over from the sign-in page
			// with a full page load, so nothing from the old session lingers.
			if (event === 'SIGNED_OUT') {
				window.location.assign(resolve('/login'));
				return;
			}
			// A new or refreshed session: load the layouts again so they use it.
			if (session?.expires_at !== data.claims?.exp) invalidate('supabase:auth');
		});
		return () => listener.subscription.unsubscribe();
	});
</script>

<div class="app">
	{@render children()}
</div>

<style>
	/* Phone first. On a wider screen the app stays a phone-width column. */
	.app {
		display: flex;
		flex-direction: column;
		max-width: 30rem;
		min-height: 100dvh;
		margin-inline: auto;
	}
</style>
