<script lang="ts">
	import AppBar from '#lib/components/AppBar.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{data.app.name} · Pyssel Hemma</title>
</svelte:head>

<AppBar title={data.app.name} icon={data.app.icon} />

<main>
	<Icon name={data.app.icon} size={120} />
	<h2 class="title">Inte byggd än.</h2>
	<p class="muted">{data.app.blurb}</p>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 72px var(--gutter) 24px;
		text-align: center;
	}

	p {
		max-width: 28ch;
		line-height: 1.5;
	}
</style>
