<!--
	A member's mascot. Colour means person, so pass the member's colour:
	<Mascot colour={member.colour} alt={member.name} />
-->
<script lang="ts">
	import { asset } from '$app/paths';
	import type { MascotColour } from '#lib/data/household.ts';

	type Props = {
		colour: MascotColour;
		size?: number;
		alt?: string;
		/** Away, done, or otherwise out of the picture. */
		faded?: boolean;
		/** Not coloured in yet: someone the house is still waiting to hear from. */
		waiting?: boolean;
	};

	let { colour, size = 32, alt = '', faded = false, waiting = false }: Props = $props();
</script>

<img
	class="mascot"
	class:faded
	class:waiting
	src={asset(`mascot/pyssel-${colour}.svg`)}
	width={size}
	height={size}
	{alt}
/>

<style>
	.mascot {
		flex: none;
	}

	.faded {
		opacity: 0.34;
	}

	.waiting {
		filter: grayscale(1);
	}

	/* Dark colours on a dark page need a little more to stay visible. */
	:global([data-theme='dark']) .faded {
		opacity: 0.42;
	}
</style>
