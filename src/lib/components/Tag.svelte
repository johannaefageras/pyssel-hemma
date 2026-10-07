<!--
	Yellow labels in the mono face.

	<Tag>12</Tag>                          a count chip
	<Tag variant="sticker">Din tur</Tag>   a tilted sticker, like HEMMA in the wordmark
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = {
		variant?: 'count' | 'sticker';
		/** Degrees. Stickers only; the wordmark uses -3. */
		tilt?: number;
		children: Snippet;
	} & HTMLAttributes<HTMLSpanElement>;

	let { variant = 'count', tilt = -3, class: className, children, ...rest }: Props = $props();
</script>

<span
	class={['tag', variant, className]}
	style:rotate={variant === 'sticker' ? `${tilt}deg` : undefined}
	{...rest}
>
	{@render children()}
</span>

<style>
	.tag {
		display: inline-block;
		flex: none;
		border-radius: var(--radius-chip);
		background: var(--accent);
		color: var(--on-accent);
		font-family: var(--font-label);
		white-space: nowrap;
	}

	.count {
		min-width: 23px;
		padding: 3px 5px;
		font-size: var(--text-xs);
		font-weight: 700;
		line-height: 1.2;
		text-align: center;
	}

	.sticker {
		padding: 5px 6px 4px;
		font-size: var(--text-2xs);
		font-weight: 800;
		letter-spacing: 0.09em;
		line-height: 1;
		text-transform: uppercase;
	}
</style>
