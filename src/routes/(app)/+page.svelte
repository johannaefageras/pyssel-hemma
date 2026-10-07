<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AppTile from '#lib/components/AppTile.svelte';
	import Button from '#lib/components/Button.svelte';
	import Card from '#lib/components/Card.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import Mascot from '#lib/components/Mascot.svelte';
	import Masthead from '#lib/components/Masthead.svelte';
	import Tag from '#lib/components/Tag.svelte';
	import { apps } from '#lib/data/apps.ts';
	import { DINNER_TIME, saveDinnerAnswer, type DinnerAnswer } from '#lib/data/dinner.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const me = $derived(data.me);

	// A writable derived: it follows the loaded data and can be overridden locally,
	// so a tap shows at once and the database confirms it a moment later.
	let answers = $derived(data.answers);
	let failed = $state(false);

	const myAnswer = $derived(answers[me.id] ?? null);
	const eating = $derived(data.members.filter((member) => answers[member.id] === 'in').length);
	const away = $derived(data.members.filter((member) => answers[member.id] === 'out').length);

	// Everyone else, those eating first and those away last. You sit at the far end.
	const rank = { in: 0, unanswered: 1, out: 2 };
	const others = $derived(
		data.members
			.filter((member) => member.id !== me.id)
			.map((member) => ({ member, answer: answers[member.id] ?? null }))
			.sort((a, b) => rank[a.answer ?? 'unanswered'] - rank[b.answer ?? 'unanswered'])
	);

	const dinnerTime = DINNER_TIME.replace(/:00$/, '');

	// The headline asks the one thing the house needs from you right now.
	const headline = $derived(myAnswer === null ? 'Äter du hemma?' : 'Allt är lugnt.');

	// What each tile shows. Only apps that exist have something to report.
	const status = $derived<Record<string, { count?: number; sticker?: string }>>({
		inkop: { count: data.groceriesLeft }
	});

	async function answer(choice: Exclude<DinnerAnswer, null>) {
		const next = myAnswer === choice ? null : choice;
		answers = { ...answers, [me.id]: next };
		failed = false;
		try {
			await saveDinnerAnswer(data.supabase, data.day, me.id, next);
		} catch {
			failed = true;
		}
		// Back in step with the database, whether the save worked or not.
		await invalidate('app:dinner');
	}

	function label(answer: DinnerAnswer): string {
		if (answer === 'in') return 'äter hemma';
		if (answer === 'out') return 'borta';
		return 'har inte svarat';
	}
</script>

<svelte:head>
	<title>Pyssel Hemma</title>
</svelte:head>

<Masthead />

<main>
	<section class="greeting">
		<p class="eyebrow">{data.dateLabel}</p>
		<h1 class="display">
			Hej {me.name}.<br /><span class="marker">{headline}</span>
		</h1>
	</section>

	<section class="block" aria-labelledby="dinner-title">
		<Card variant="well" class="dinner">
			<div class="dinner-top">
				<Icon name="home-everyday--cutlery" size={40} />
				<div>
					<h2 class="title" id="dinner-title">Middag i kväll</h2>
					<p class="meta">
						Kl {dinnerTime} · {eating} äter{#if away}&nbsp;· {away} borta{/if}
					</p>
				</div>
			</div>

			<ul class="people">
				{#each others as { member, answer } (member.id)}
					<li>
						<Mascot
							colour={member.colour}
							alt="{member.name} {label(answer)}"
							faded={answer === 'out'}
							waiting={answer === null}
						/>
					</li>
				{/each}
				<li class="me">
					<Mascot colour={me.colour} alt="Du {label(myAnswer)}" faded={myAnswer === 'out'} />
					{#if myAnswer === null}<Tag class="unanswered" aria-hidden="true">?</Tag>{/if}
				</li>
			</ul>

			<div class="choices">
				<Button
					variant={myAnswer === null ? 'primary' : 'default'}
					pressed={myAnswer === 'in'}
					onclick={() => answer('in')}
				>
					Jag äter hemma
				</Button>
				<Button pressed={myAnswer === 'out'} onclick={() => answer('out')}>Inte i kväll</Button>
			</div>

			{#if failed}
				<p class="error" role="alert">Det gick inte att spara. Kolla nätet och försök igen.</p>
			{/if}
		</Card>
	</section>

	<section class="block" aria-labelledby="apps-title">
		<h2 class="eyebrow muted" id="apps-title">Allt i huset</h2>
		<nav class="tiles" aria-labelledby="apps-title">
			{#each apps as app (app.slug)}
				<AppTile
					href={resolve('/(app)/[app]', { app: app.slug })}
					icon={app.icon}
					label={app.name}
					count={status[app.slug]?.count}
					sticker={status[app.slug]?.sticker}
				/>
			{/each}
		</nav>
	</section>
</main>

<style>
	main {
		display: flex;
		flex-direction: column;
		padding-bottom: calc(16px + env(safe-area-inset-bottom));
	}

	.greeting {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 26px var(--gutter) 20px;
	}

	.block {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 0 var(--gutter);
	}

	.block + .block {
		padding-top: 26px;
	}

	.block :global(.dinner) {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.dinner-top {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.dinner-top div {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.people {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
	}

	.people li {
		position: relative;
	}

	.people .me {
		margin-left: auto;
	}

	.people :global(.unanswered) {
		position: absolute;
		top: -7px;
		right: -9px;
		min-width: 18px;
		padding: 2px 4px;
		border: 1.5px solid var(--on-accent);
		font-size: 0.6875rem;
		font-weight: 800;
		line-height: 1;
	}

	.choices {
		display: flex;
		gap: 10px;
		/* Room for the buttons' hard shadow inside the card. */
		padding-bottom: 3px;
	}

	.choices :global(.button) {
		flex: 1 1 0;
		padding-inline: 8px;
	}

	.tiles {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 10px;
	}

	/* Very narrow phones: two columns, as in the Pyssel gallery. */
	@media (max-width: 339px) {
		.tiles {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
