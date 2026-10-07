<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	/*
	 * Keeps every phone in step. A change to one of the tables arrives over
	 * Supabase Realtime, and the pages that depend on it load their data again.
	 * Pages declare what they depend on with depends('app:groceries') and so on.
	 */
	onMount(() => {
		const { supabase } = data;

		const channel = supabase
			.channel('house')
			.on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_items' }, () =>
				invalidate('app:groceries')
			)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'dinner_answers' }, () =>
				invalidate('app:dinner')
			)
			.subscribe();

		// Phones drop the connection while the app is in the background, so catch
		// up whenever it comes back to the front. This also covers Realtime being off.
		const catchUp = () => {
			if (document.visibilityState !== 'visible') return;
			invalidate('app:groceries');
			invalidate('app:dinner');
		};
		document.addEventListener('visibilitychange', catchUp);

		return () => {
			document.removeEventListener('visibilitychange', catchUp);
			supabase.removeChannel(channel);
		};
	});
</script>

{@render children()}
