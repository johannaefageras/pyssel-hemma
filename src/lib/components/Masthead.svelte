<!--
	The home screen's top bar: brand mascot, wordmark, the HEMMA sticker, and you.
-->
<script lang="ts">
	import Mascot from './Mascot.svelte';
	import ProfileButton from './ProfileButton.svelte';
	import Tag from './Tag.svelte';
</script>

<header class="masthead">
	<div class="brand">
		<span class="brand-mascot"><Mascot colour="yellow" size={38} /></span>
		<span class="wordmark">Pyssel</span>
		<Tag variant="sticker">Hemma</Tag>
	</div>
	<ProfileButton />
</header>

<style>
	.masthead {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px var(--gutter);
		border-bottom: var(--rule-heavy);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.brand-mascot {
		rotate: -6deg;
	}

	.wordmark {
		font-size: var(--text-xl);
		font-weight: 700;
		letter-spacing: -0.06em;
		line-height: 1;
	}
</style>
