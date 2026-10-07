<!--
	The Pyssel button: ink border, crooked corners, hard shadow.

	This is the loud treatment. Use it for the one or two real actions on a
	screen; for quiet actions use variant="text" or the .text-button class.

	<Button variant="primary" onclick={save}>Spara</Button>
	<Button pressed={isIn} onclick={toggle}>Jag äter hemma</Button>
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	type Props = {
		variant?: 'default' | 'primary' | 'text';
		/** For toggles. Sets aria-pressed and fills the button with the accent. */
		pressed?: boolean;
		/** Square, for a single icon or mascot. Give it an aria-label. */
		square?: boolean;
		children: Snippet;
	} & HTMLButtonAttributes;

	let {
		variant = 'default',
		pressed,
		square = false,
		type = 'button',
		class: className,
		children,
		...rest
	}: Props = $props();
</script>

<button
	{type}
	class={[variant === 'text' ? 'text-button' : 'button', variant, { square }, className]}
	aria-pressed={pressed}
	{...rest}
>
	{@render children()}
</button>

<style>
	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: var(--tap);
		padding: 11px 16px;
		border: var(--border-ink);
		border-radius: var(--radius-button);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-button);
		font-size: var(--text-sm);
		font-weight: 700;
		line-height: 1.25;
		transition:
			transform 0.1s,
			box-shadow 0.1s;
	}

	.button:hover:not(:disabled) {
		transform: translate(-1px, -1px);
		box-shadow: var(--shadow-button-hover);
	}

	.button:active:not(:disabled) {
		transform: translate(2px, 2px);
		box-shadow: none;
	}

	.primary {
		background: var(--primary);
		color: var(--on-primary);
	}

	.button[aria-pressed='true'] {
		background: var(--accent);
		color: var(--on-accent);
	}

	.square {
		width: var(--tap);
		height: var(--tap);
		padding: 0;
	}
</style>
