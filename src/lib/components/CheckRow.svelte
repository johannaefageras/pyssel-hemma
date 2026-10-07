<!--
	A tickable list row: box, name, optional detail in mono, and who added it.
	The whole row is the button, so the tap target is full width.

	Rows are deliberately plain. A hairline below, no border, no shadow: with
	thirty of them on a screen, anything more gets loud.

	<CheckRow label="Bananer" detail="6 st" member={member} checked={false} ontoggle={…} />
-->
<script lang="ts">
	import type { Member } from '#lib/data/household.ts';
	import Mascot from './Mascot.svelte';

	type Props = {
		label: string;
		detail?: string;
		checked: boolean;
		/** Whoever added the row. */
		member?: Member;
		ontoggle: () => void;
	};

	let { label, detail, checked, member, ontoggle }: Props = $props();
</script>

<button type="button" class="row" aria-pressed={checked} onclick={ontoggle}>
	<span class="box">
		{#if checked}
			<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
				<path d="M2.5 7.5l3 3 6-7" />
			</svg>
		{/if}
	</span>
	<span class="label">{label}</span>
	{#if detail}
		<span class="meta">{detail}</span>
	{/if}
	{#if member}
		<Mascot colour={member.colour} size={24} alt="Tillagd av {member.name}" faded={checked} />
	{/if}
</button>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		min-height: var(--tap);
		padding: 0;
		border: 0;
		border-bottom: 1px solid var(--rule);
		background: none;
		font-size: var(--text-md);
		line-height: 1.25;
		text-align: left;
	}

	.row:focus-visible {
		outline-offset: 0;
	}

	.box {
		display: grid;
		flex: none;
		place-items: center;
		width: 22px;
		height: 22px;
		border: var(--border-control);
		border-radius: var(--radius-chip);
		background: var(--surface);
	}

	.box svg {
		fill: none;
		stroke: var(--on-accent);
		stroke-width: 2.4;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.label {
		flex: 1 1 0;
		min-width: 0;
		overflow-wrap: anywhere;
	}

	[aria-pressed='true'] .box {
		border: var(--border-ink);
		background: var(--accent);
	}

	[aria-pressed='true'] .label {
		color: var(--muted);
		text-decoration: line-through;
	}
</style>
