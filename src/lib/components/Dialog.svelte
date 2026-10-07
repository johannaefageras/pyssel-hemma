<!--
	A modal dialog on the native <dialog> element: thick ink border, big yellow shadow.

	<Dialog bind:open title="Du">…</Dialog>

	Escape and the close button both close it and set `open` back to false.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		open?: boolean;
		title: string;
		children: Snippet;
	};

	let { open = $bindable(false), title, children }: Props = $props();

	const id = $props.id();
	let element: HTMLDialogElement | undefined = $state();

	$effect(() => {
		if (!element) return;
		if (open && !element.open) element.showModal();
		if (!open && element.open) element.close();
	});
</script>

<dialog bind:this={element} aria-labelledby={id} onclose={() => (open = false)}>
	<div class="top">
		<h2 {id}>{title}</h2>
		<button type="button" class="close" aria-label="Stäng" onclick={() => (open = false)}>
			<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
				<path d="M4.5 4.5l11 11m0-11l-11 11" />
			</svg>
		</button>
	</div>
	{@render children()}
</dialog>

<style>
	dialog {
		width: min(500px, calc(100% - 32px));
		padding: 22px;
		border: 3px solid var(--ink);
		border-radius: var(--radius-dialog);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-dialog);
	}

	dialog::backdrop {
		background: hsl(0 0% 0% / 0.45);
	}

	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 12px;
	}

	h2 {
		font-size: 1.75rem;
		line-height: 1.1;
		letter-spacing: -0.045em;
	}

	.close {
		display: grid;
		flex: none;
		place-items: center;
		width: var(--tap);
		height: var(--tap);
		margin-right: -10px;
		padding: 0;
		border: 0;
		border-radius: var(--radius-button);
		background: none;
	}

	.close svg {
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
	}
</style>
