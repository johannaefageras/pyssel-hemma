<script lang="ts">
	import { invalidate } from '$app/navigation';
	import AppBar from '#lib/components/AppBar.svelte';
	import Button from '#lib/components/Button.svelte';
	import CheckRow from '#lib/components/CheckRow.svelte';
	import Field from '#lib/components/Field.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { appBySlug } from '#lib/data/apps.ts';
	import {
		addGrocery,
		aisles,
		clearPicked,
		guessAisle,
		parseDraft,
		remaining,
		setPicked,
		type GroceryItem
	} from '#lib/data/groceries.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const app = appBySlug('inkop')!;

	// A writable derived: it follows the loaded data and can be overridden locally,
	// so a tap shows at once and the database confirms it a moment later.
	let items = $derived(data.items);
	let draft = $state('');
	let failed = $state(false);
	let pending = 0;

	const left = $derived(remaining(items));
	const picked = $derived(items.length - left);
	const memberById = $derived(new Map(data.members.map((member) => [member.id, member])));

	// Only aisles with something in them, in shop order.
	const groups = $derived(
		aisles
			.map((aisle) => ({ aisle, items: items.filter((item) => item.aisle === aisle.id) }))
			.filter((group) => group.items.length > 0)
	);

	/** Saves a change, then reloads the list so it matches the database either way. */
	async function save(change: () => Promise<void>) {
		failed = false;
		try {
			await change();
		} catch {
			failed = true;
		}
		await invalidate('app:groceries');
	}

	function add(event: SubmitEvent) {
		event.preventDefault();
		if (!draft.trim()) return;

		const { name, quantity } = parseDraft(draft);
		const aisle = guessAisle(name);
		const shown: GroceryItem = {
			id: `pending-${pending++}`,
			name,
			quantity,
			aisle,
			addedBy: data.me.id,
			picked: false
		};
		items = [...items, shown];
		draft = '';
		save(() => addGrocery(data.supabase, { name, quantity, aisle }));
	}

	function toggle(target: GroceryItem) {
		// Not in the database yet; it will be in a moment.
		if (target.id.startsWith('pending-')) return;

		const next = !target.picked;
		items = items.map((item) => (item.id === target.id ? { ...item, picked: next } : item));
		save(() => setPicked(data.supabase, target.id, next));
	}

	function clear() {
		items = items.filter((item) => !item.picked);
		save(() => clearPicked(data.supabase));
	}
</script>

<svelte:head>
	<title>{app.name} · Pyssel Hemma</title>
</svelte:head>

<AppBar title={app.name} icon={app.icon} count={left || undefined} countLabel="{left} kvar" />

<main>
	{#each groups as group (group.aisle.id)}
		<section aria-labelledby="aisle-{group.aisle.id}">
			<h2 class="eyebrow muted" id="aisle-{group.aisle.id}">
				<Icon name={group.aisle.icon} size={24} />
				{group.aisle.name}
			</h2>
			<ul>
				{#each group.items as item (item.id)}
					<li>
						<CheckRow
							label={item.name}
							detail={item.quantity ?? undefined}
							checked={item.picked}
							member={memberById.get(item.addedBy ?? '')}
							ontoggle={() => toggle(item)}
						/>
					</li>
				{/each}
			</ul>
		</section>
	{:else}
		<div class="empty">
			<Icon name={app.icon} size={120} />
			<h2 class="title">Listan är tom.</h2>
			<p class="muted">Skriv det första som saknas här nedanför.</p>
		</div>
	{/each}

	{#if picked > 0}
		<button type="button" class="text-button clear" onclick={clear}>
			Rensa plockade ({picked})
		</button>
	{/if}

	{#if failed}
		<p class="error" role="alert">Det gick inte att spara. Kolla nätet och försök igen.</p>
	{/if}
</main>

<form class="add-bar" onsubmit={add}>
	<Field
		label="Lägg till vara"
		hideLabel
		placeholder="Havremjölk 2 liter, ägg …"
		autocomplete="off"
		enterkeyhint="done"
		bind:value={draft}
	/>
	<Button type="submit" variant="primary">Lägg till</Button>
</form>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding: 6px var(--gutter) 20px;
	}

	h2.eyebrow {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 0 4px;
	}

	.clear {
		align-self: flex-start;
		margin-top: 4px;
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 56px 0 24px;
		text-align: center;
	}

	/* Pinned to the bottom, within thumb reach. The heavy rule mirrors the top bar. */
	.add-bar {
		position: sticky;
		bottom: 0;
		display: flex;
		align-items: flex-end;
		gap: 10px;
		margin-top: auto;
		padding: 14px var(--gutter) calc(17px + env(safe-area-inset-bottom));
		border-top: var(--rule-heavy);
		background: var(--paper);
	}
</style>
