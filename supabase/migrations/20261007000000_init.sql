-- Pyssel Hemma: members, the grocery list and dinner answers.
--
-- Run once in the Supabase SQL editor (or with `supabase db push`).
-- It only creates things; it fails rather than overwrite if a table already exists.
--
-- Who gets in: the people listed in public.members, matched on the email address
-- they signed in with. Everyone else can sign in but sees no rows at all.

-- ── Members ──────────────────────────────────────────────────────────────────
-- One row per person in the house. Rows are added by hand (see members.example.sql),
-- never from the app.

create table public.members (
	id uuid primary key default gen_random_uuid(),
	email text not null unique,
	name text not null,
	-- A mascot colour. Yellow is the brand, so it is not on the list.
	colour text not null unique,
	created_at timestamptz not null default now(),
	constraint members_email_is_lowercase check (email = lower(btrim(email))),
	constraint members_name_not_empty check (char_length(btrim(name)) between 1 and 40),
	constraint members_colour_is_a_mascot check (
		colour in ('blue', 'pink', 'green', 'orange', 'purple', 'red', 'brown', 'light', 'dark')
	)
);

comment on table public.members is
	'The household. Being listed here, by sign-in email, is what grants access.';

-- The member row belonging to whoever is signed in, or null if they are not a member.
-- Security definer so it can read emails that the API roles cannot.
create function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
	select m.id
	from public.members m
	where m.email = lower((select auth.jwt() ->> 'email'))
$$;

-- Lets the sign-in form check an address before any email is sent, so the app
-- never mails a stranger. It answers yes or no and nothing else.
create function public.is_house_email(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
	select exists (
		select 1 from public.members m where m.email = lower(btrim(candidate))
	)
$$;

revoke all on function public.current_member_id() from public, anon;
revoke all on function public.is_house_email(text) from public;
grant execute on function public.current_member_id() to authenticated;
grant execute on function public.is_house_email(text) to anon, authenticated;

-- ── Grocery list ─────────────────────────────────────────────────────────────

create table public.grocery_items (
	id uuid primary key default gen_random_uuid(),
	name text not null,
	quantity text,
	-- An aisle id from src/lib/data/groceries.ts. Not constrained here, so adding
	-- an aisle in the app needs no migration; unknown ids are shown under Övrigt.
	aisle text not null default 'ovrigt',
	added_by uuid default public.current_member_id() references public.members (id) on delete set null,
	picked boolean not null default false,
	created_at timestamptz not null default now(),
	constraint grocery_items_name_length check (char_length(btrim(name)) between 1 and 80),
	constraint grocery_items_quantity_length check (quantity is null or char_length(quantity) <= 30),
	constraint grocery_items_aisle_length check (char_length(aisle) between 1 and 30)
);

create index grocery_items_created_at_idx on public.grocery_items (created_at);

-- ── Dinner ───────────────────────────────────────────────────────────────────
-- One row per member and day, only when they have answered. No row means no answer.

create table public.dinner_answers (
	-- The calendar day in Europe/Stockholm, set by the app.
	day date not null,
	member_id uuid not null default public.current_member_id() references public.members (id) on delete cascade,
	answer text not null,
	primary key (day, member_id),
	constraint dinner_answers_answer_valid check (answer in ('in', 'out'))
);

-- ── Privileges ───────────────────────────────────────────────────────────────
-- Start from nothing, then grant exactly what the app uses. This does not rely
-- on the project's default grants for new tables.

revoke all on table public.members, public.grocery_items, public.dinner_answers
	from anon, authenticated;

-- Members can see each other's name and colour, but not email addresses.
grant select (id, name, colour) on table public.members to authenticated;

grant select, insert, delete on table public.grocery_items to authenticated;
-- No update on added_by: who added a row cannot be rewritten afterwards.
grant update (name, quantity, aisle, picked) on table public.grocery_items to authenticated;

grant select, insert, update, delete on table public.dinner_answers to authenticated;

-- ── Row-level security ───────────────────────────────────────────────────────
-- (select …) around the function call lets Postgres evaluate it once per query
-- instead of once per row.

alter table public.members enable row level security;
alter table public.grocery_items enable row level security;
alter table public.dinner_answers enable row level security;

create policy "Members can see the household"
	on public.members for select to authenticated
	using ((select public.current_member_id()) is not null);

-- The grocery list is shared: any member can read, add, tick and remove.
create policy "Members can read the grocery list"
	on public.grocery_items for select to authenticated
	using ((select public.current_member_id()) is not null);

create policy "Members can add groceries as themselves"
	on public.grocery_items for insert to authenticated
	with check (added_by = (select public.current_member_id()));

create policy "Members can change groceries"
	on public.grocery_items for update to authenticated
	using ((select public.current_member_id()) is not null)
	with check ((select public.current_member_id()) is not null);

create policy "Members can remove groceries"
	on public.grocery_items for delete to authenticated
	using ((select public.current_member_id()) is not null);

-- Dinner answers are readable by all members, writable only by their owner.
create policy "Members can read dinner answers"
	on public.dinner_answers for select to authenticated
	using ((select public.current_member_id()) is not null);

create policy "Members can answer for themselves"
	on public.dinner_answers for insert to authenticated
	with check (member_id = (select public.current_member_id()));

create policy "Members can change their own answer"
	on public.dinner_answers for update to authenticated
	using (member_id = (select public.current_member_id()))
	with check (member_id = (select public.current_member_id()));

create policy "Members can withdraw their own answer"
	on public.dinner_answers for delete to authenticated
	using (member_id = (select public.current_member_id()));

-- ── Realtime ─────────────────────────────────────────────────────────────────
-- Changes to these tables are pushed to signed-in members, so the list updates
-- on everyone's phone. Realtime applies the select policies above.

alter publication supabase_realtime add table public.grocery_items, public.dinner_answers;
