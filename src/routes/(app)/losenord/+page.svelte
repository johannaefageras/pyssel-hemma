<script lang="ts">
	import AppBar from '#lib/components/AppBar.svelte';
	import Button from '#lib/components/Button.svelte';
	import Field from '#lib/components/Field.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const email = $derived(typeof data.claims?.email === 'string' ? data.claims.email : '');
</script>

<svelte:head>
	<title>Lösenord · Pyssel Hemma</title>
</svelte:head>

<AppBar title="Lösenord" icon="money-admin--key" />

<main>
	{#if form?.saved}
		<h2 class="title">Sparat.</h2>
		<p class="muted">Nästa gång kan du logga in med lösenord eller med kod, vilket du vill.</p>
	{:else}
		<p class="muted">
			Du behöver inget lösenord: koden på mejlen fungerar alltid. Men vill du ha ett kan du välja
			det här, och byta det när du vill.
		</p>

		<form method="POST">
			<!-- Lets a password manager file the new password under the right address. -->
			<input
				class="sr-only"
				type="email"
				autocomplete="username"
				value={email}
				readonly
				tabindex={-1}
			/>
			<Field
				label="Nytt lösenord"
				name="password"
				type="password"
				autocomplete="new-password"
				minlength={8}
				required
			/>
			<Field
				label="En gång till"
				name="again"
				type="password"
				autocomplete="new-password"
				minlength={8}
				required
			/>
			<Button type="submit" variant="primary">Spara lösenord</Button>
		</form>

		{#if form?.message}
			<p class="error" role="alert">{form.message}</p>
		{:else}
			<p class="muted">Minst åtta tecken. Andra enheter där du är inloggad loggas ut.</p>
		{/if}
	{/if}
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		gap: 16px;
		padding: 26px var(--gutter) 24px;
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
</style>
