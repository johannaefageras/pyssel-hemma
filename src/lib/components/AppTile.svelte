<!--
	One app on the home screen: icon, mono label, and optionally a count chip or
	a sticker. A tile with a sticker is the one that needs you, so it also gets
	the active border.

	<AppTile href="/inkop" icon="home-everyday--grocery-bag" label="Inköp" count={8} />
	<AppTile href="/stadning" icon="home-everyday--broom" label="Städning" sticker="Din tur" />
-->
<script lang="ts">
	import type { IconName } from '#lib/assets.ts';
	import Icon from './Icon.svelte';
	import Tag from './Tag.svelte';

	type Props = {
		href: string;
		icon: IconName;
		label: string;
		count?: number;
		sticker?: string;
	};

	let { href, icon, label, count, sticker }: Props = $props();

	const active = $derived(Boolean(sticker));
</script>

<a {href} class={['tile', { active }]}>
	<Icon name={icon} size={60} />
	<span class="label">{label}</span>
	{#if sticker}
		<Tag variant="sticker" tilt={3} class="tile-sticker">{sticker}</Tag>
	{:else if count}
		<Tag class="tile-count">{count}</Tag>
	{/if}
</a>

<style>
	.tile {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		padding: 20px 6px 12px;
		border: var(--border-quiet);
		border-radius: var(--radius-card);
		background: var(--surface);
		text-decoration: none;
		transition: border-color 0.15s;
	}

	.tile:hover {
		border-color: var(--ink);
	}

	.active {
		border: var(--border-ink);
		box-shadow: var(--shadow-active);
	}

	.label {
		max-width: 100%;
		overflow-wrap: anywhere;
		font-family: var(--font-label);
		font-size: var(--text-xs);
		line-height: 1.25;
		text-align: center;
	}

	.active .label {
		font-weight: 700;
	}

	.tile :global(.tile-count) {
		position: absolute;
		top: 6px;
		right: 6px;
	}

	.tile :global(.tile-sticker) {
		position: absolute;
		top: -8px;
		right: -6px;
	}
</style>
