<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '#lib/components/Button.svelte';
	import Field from '#lib/components/Field.svelte';
	import Masthead from '#lib/components/Masthead.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	// Three screens: ask for a code, type the code, or sign in with a password.
	// The link in the sign-in email opens this page on the second one, filled in.
	const step = $derived(
		form?.step ?? (data.prefill ? 'code' : data.mode === 'password' ? 'password' : 'email')
	);
	const email = $derived(form?.email ?? data.prefill?.email ?? '');
</script>

<svelte:head>
	<title>Logga in · Pyssel Hemma</title>
</svelte:head>

<Masthead />

<!--
	Plain forms on purpose, without use:enhance. Signing in ends with a full page
	load, so every part of the app starts from the new session.
-->
<main>
	{#if step === 'email'}
		<section class="greeting">
			<p class="eyebrow">Logga in</p>
			<h1 class="display">Hej.<br /><span class="marker">Vem är du?</span></h1>
		</section>

		<form method="POST" action="?/send">
			<Field
				label="E-postadress"
				name="email"
				type="email"
				autocomplete="email"
				autocapitalize="none"
				required
				value={email}
			/>
			<Button type="submit" variant="primary">Skicka kod</Button>
		</form>

		{#if form?.message}
			<p class="error" role="alert">{form.message}</p>
		{:else}
			<p class="muted">Du får en kod på mejlen. Inget lösenord behövs.</p>
		{/if}

		<a class="text-button" href="{resolve('/login')}?med=losenord">Logga in med lösenord</a>
	{:else if step === 'code'}
		<section class="greeting">
			<p class="eyebrow">Logga in</p>
			<h1 class="display">Kolla mejlen.<br /><span class="marker">Skriv koden.</span></h1>
		</section>

		<p class="muted">
			Om <strong>{email}</strong> hör till huset har vi skickat en kod dit.
		</p>

		<form method="POST" action="?/verify">
			<input type="hidden" name="email" value={email} />
			<Field
				label="Kod"
				name="token"
				inputmode="numeric"
				autocomplete="one-time-code"
				pattern="[0-9 ]*"
				maxlength={12}
				required
				value={data.prefill?.code ?? ''}
			/>
			<Button type="submit" variant="primary">Logga in</Button>
		</form>

		{#if form?.message}
			<p class="error" role="alert">{form.message}</p>
		{/if}

		<a class="text-button" href={resolve('/login')}>Byt adress eller be om en ny kod</a>
	{:else}
		<section class="greeting">
			<p class="eyebrow">Logga in</p>
			<h1 class="display">Hej igen.<br /><span class="marker">Lösenordet?</span></h1>
		</section>

		<form method="POST" action="?/password">
			<Field
				label="E-postadress"
				name="email"
				type="email"
				autocomplete="username"
				autocapitalize="none"
				required
				value={email}
			/>
			<Field
				label="Lösenord"
				name="password"
				type="password"
				autocomplete="current-password"
				required
			/>
			<Button type="submit" variant="primary">Logga in</Button>
		</form>

		{#if form?.message}
			<p class="error" role="alert">{form.message}</p>
		{:else}
			<p class="muted">Glömt det? Logga in med kod och välj ett nytt.</p>
		{/if}

		<a class="text-button" href={resolve('/login')}>Logga in med kod</a>
	{/if}
</main>

<style>
	/* Fills the screen below the masthead, with the content in the middle of it. */
	main {
		display: flex;
		flex: 1;
		flex-direction: column;
		justify-content: center;
		gap: 16px;
		padding: 26px var(--gutter) 24px;
	}

	.greeting {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-bottom: 4px;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	/* Field is a flex child that grows in a row; in this column it should not. */
	form :global(.field) {
		flex: none;
	}

	p {
		line-height: 1.5;
	}

	strong {
		color: var(--ink);
		overflow-wrap: anywhere;
	}

	.text-button {
		align-self: flex-start;
	}
</style>
