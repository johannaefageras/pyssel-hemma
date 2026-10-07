<!--
	The top bar inside an app: back to home, the app's icon and name, and you.

	<AppBar title="Inköp" icon="home-everyday--grocery-bag" count={8} />
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { IconName } from '#lib/assets.ts';
	import Icon from './Icon.svelte';
	import ProfileButton from './ProfileButton.svelte';
	import Tag from './Tag.svelte';

	type Props = {
		title: string;
		icon: IconName;
		count?: number;
		/** What the count means, for screen readers: "8 kvar". */
		countLabel?: string;
	};

	let { title, icon, count, countLabel }: Props = $props();
</script>

<header class="app-bar">
	<div class="side">
		<a class="text-button back" href={resolve('/(app)')}>
			<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
				<path d="M14 8H2.5M7 3.5L2.5 8 7 12.5" />
			</svg>
			Hem
		</a>
	</div>
	<div class="heading">
		<Icon name={icon} size={36} />
		<h1>{title}</h1>
		{#if count !== undefined}
			<Tag aria-label={countLabel}>{count}</Tag>
		{/if}
	</div>
	<div class="side end">
		<ProfileButton />
	</div>
</header>

<style>
	.app-bar {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px var(--gutter);
		border-bottom: var(--rule-heavy);
	}

	/* Equal sides keep the heading centred whatever sits in them. */
	.side {
		display: flex;
		flex: 1 1 0;
	}

	.end {
		justify-content: flex-end;
	}

	.back {
		font-weight: 700;
	}

	.back svg {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}

	.heading {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	h1 {
		font-size: var(--text-xl);
		font-weight: 700;
		letter-spacing: -0.05em;
		line-height: 1;
	}
</style>
