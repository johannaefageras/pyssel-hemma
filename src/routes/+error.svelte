<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Mascot from '#lib/components/Mascot.svelte';
</script>

<svelte:head>
	<title>{page.status} · Pyssel Hemma</title>
</svelte:head>

<main>
	<Mascot colour="yellow" size={96} />
	<p class="eyebrow muted">{page.status}</p>
	<h1 class="title">{page.error?.message ?? 'Något gick fel.'}</h1>
	<a class="text-button" href={resolve('/(app)')}>Till hemskärmen</a>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 96px var(--gutter) 24px;
		text-align: center;
	}
</style>
