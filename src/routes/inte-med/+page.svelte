<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '#lib/components/Button.svelte';
	import Mascot from '#lib/components/Mascot.svelte';
	import Masthead from '#lib/components/Masthead.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	async function signOut() {
		await data.supabase.auth.signOut();
		// A full page load, so nothing from the old session lingers.
		window.location.assign(resolve('/login'));
	}
</script>

<svelte:head>
	<title>Inte med · Pyssel Hemma</title>
</svelte:head>

<Masthead />

<main>
	<Mascot colour="light" size={96} />
	<h1 class="title">Den här adressen hör inte till huset.</h1>
	<p class="muted">
		{#if data.email}Du är inloggad som <strong>{data.email}</strong>.{/if}
		Be någon i huset lägga till dig, eller logga in med en annan adress.
	</p>
	<Button onclick={signOut}>Logga ut</Button>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		padding: 72px var(--gutter) 24px;
		text-align: center;
	}

	p {
		max-width: 32ch;
		line-height: 1.5;
	}

	strong {
		color: var(--ink);
		overflow-wrap: anywhere;
	}
</style>
