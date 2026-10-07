<!--
	A Pyssel icon from static/icons, by file name without the extension:
	<Icon name="home-everyday--broom" size={24} />

	The icons are illustrations, so they work from about 24px up. For plain UI
	glyphs (arrows, ticks, close) draw a stroke SVG in the component instead.
-->
<script lang="ts">
	import { asset } from '$app/paths';
	import type { IconName } from '#lib/assets.ts';

	type Props = {
		name: IconName;
		size?: number;
		/** Leave empty when the icon sits next to a text label. */
		alt?: string;
	};

	let { name, size = 24, alt = '' }: Props = $props();
</script>

<img class="icon" src={asset(`icons/${name}.svg`)} width={size} height={size} {alt} />

<style>
	.icon {
		flex: none;
		object-fit: contain;
	}
</style>
