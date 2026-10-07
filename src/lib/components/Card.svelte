<!--
	The quiet container: thin grey border, crooked corners.

	<Card>…</Card>                  a card on the page
	<Card variant="well">…</Card>   a sunken panel, for a block that groups controls
	<Card active>…</Card>           the one card that needs attention: ink border, yellow shadow

	Lists do not go in cards. Rows get a hairline (var(--rule)) and nothing else.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = {
		variant?: 'card' | 'well';
		active?: boolean;
		children: Snippet;
	} & HTMLAttributes<HTMLDivElement>;

	let { variant = 'card', active = false, class: className, children, ...rest }: Props = $props();
</script>

<div class={['card', variant, { active }, className]} {...rest}>
	{@render children()}
</div>

<style>
	.card {
		padding: 14px;
		border: var(--border-quiet);
		border-radius: var(--radius-card);
		background: var(--surface);
	}

	.well {
		background: var(--well);
	}

	.active {
		border: var(--border-ink);
		box-shadow: var(--shadow-active);
	}
</style>
