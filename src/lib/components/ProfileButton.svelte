<!--
	Your mascot in the top-right corner. Opens a dialog with the theme choice,
	a link to the password page, and sign-out. Renders nothing when no member is signed in, so the bars can
	include it on every page.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { getThemeChoice, setThemeChoice, type ThemeChoice } from '#lib/theme.ts';
	import Button from './Button.svelte';
	import Dialog from './Dialog.svelte';
	import Mascot from './Mascot.svelte';

	const me = $derived(page.data.me);

	let open = $state(false);
	let theme = $state<ThemeChoice>('system');

	const choices: { value: ThemeChoice; label: string; hint: string }[] = [
		{ value: 'system', label: 'Följ systemet', hint: 'Som telefonen' },
		{ value: 'light', label: 'Ljust', hint: 'Vitt papper' },
		{ value: 'dark', label: 'Mörkt', hint: 'Svart papper' }
	];

	onMount(() => {
		theme = getThemeChoice();
	});

	function choose(choice: ThemeChoice) {
		theme = choice;
		setThemeChoice(choice);
	}

	async function signOut() {
		await page.data.supabase?.auth.signOut();
		// A full page load, so nothing from the old session lingers.
		window.location.assign(resolve('/login'));
	}
</script>

{#if me}
	<Button square aria-label="Du: {me.name}" onclick={() => (open = true)}>
		<Mascot colour={me.colour} size={28} />
	</Button>

	<Dialog bind:open title={me.name}>
		<fieldset>
			<legend>Utseende</legend>
			{#each choices as choice (choice.value)}
				<label>
					<input
						type="radio"
						name="theme"
						value={choice.value}
						checked={theme === choice.value}
						onchange={() => choose(choice.value)}
					/>
					{choice.label}
					<small>{choice.hint}</small>
				</label>
			{/each}
		</fieldset>

		<div class="account">
			<a class="text-button" href={resolve('/(app)/losenord')} onclick={() => (open = false)}>
				Lösenord
			</a>
			<Button onclick={signOut}>Logga ut</Button>
		</div>
	</Dialog>
{/if}

<style>
	fieldset {
		min-width: 0;
		margin: 0;
		padding: 0;
		border: 0;
	}

	legend {
		margin-bottom: 4px;
		padding: 0;
		font-family: var(--font-label);
		font-size: var(--text-sm);
		font-weight: 700;
	}

	label {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: var(--tap);
		border-bottom: 1px solid var(--rule);
	}

	input {
		width: 18px;
		height: 18px;
		margin: 0;
		accent-color: var(--ink);
	}

	small {
		margin-left: auto;
		color: var(--muted);
		font-family: var(--font-label);
		font-size: var(--text-xs);
	}

	.account {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		/* Room for the button's hard shadow. */
		padding: 18px 3px 3px 0;
	}
</style>
