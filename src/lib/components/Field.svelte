<!--
	A labelled text input.

	<Field label="Lägg till vara" hideLabel placeholder="Havremjölk, ägg …" bind:value />

	The label is always there for screen readers; hideLabel only hides it visually.
-->
<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = {
		label: string;
		hideLabel?: boolean;
		value?: string;
	} & Omit<HTMLInputAttributes, 'value'>;

	let {
		label,
		hideLabel = false,
		value = $bindable(''),
		type = 'text',
		class: className,
		...rest
	}: Props = $props();

	const id = $props.id();
</script>

<div class={['field', className]}>
	<label for={id} class={{ 'sr-only': hideLabel }}>{label}</label>
	<input {id} {type} bind:value {...rest} />
</div>

<style>
	.field {
		display: flex;
		flex: 1 1 0;
		flex-direction: column;
		gap: 8px;
		min-width: 0;
	}

	label {
		font-family: var(--font-label);
		font-size: var(--text-sm);
		font-weight: 700;
	}

	input {
		width: 100%;
		min-height: var(--tap);
		padding: 10px 12px;
		border: var(--border-control);
		border-radius: var(--radius-card);
		background: var(--surface);
		color: var(--ink);
		/* 16px or larger, or iOS zooms the page when the field takes focus. */
		font-size: var(--text-md);
		appearance: none;
	}

	input::placeholder {
		color: var(--muted);
		opacity: 1;
	}

	input:focus-visible {
		outline-offset: 3px;
	}
</style>
