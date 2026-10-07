-- Pyssel Hemma: sign-in with a password, as an option next to the emailed code.
--
-- Run once in the Supabase SQL editor, after 20261007000000_init.sql.
--
-- Why this needs a database rule at all. Access is granted by email address.
-- A code proves that someone can read the mail sent to an address. A password
-- on its own does not: anyone can ask Supabase to create an account for any
-- address with a password of their choosing, and if the owner of that address
-- later confirms it by signing in with a code, that password would open the
-- same account.
--
-- So a password session only counts as a member when both of these hold:
--   1. the member has chosen a password in the app, from a session that was
--      started with a code (that also replaces any password the account had), and
--   2. the password session was started after that moment, so a session opened
--      earlier with an older password stays shut out.

alter table public.members
	add column password_login_since timestamptz;

comment on column public.members.password_login_since is
	'When the member last chose a password from a code session. Null means password sign-in is off for this address. Password sessions started before this moment are not treated as a member.';

-- Was the current session started with a password? Supabase lists how a
-- session was authenticated in the token's "amr" claim, as objects
-- ({"method": "password", "timestamp": 1790000000}) or as plain strings.
create function public.signed_in_with_password()
returns boolean
language sql
stable
set search_path = ''
as $$
	select coalesce(
		(select auth.jwt() -> 'amr') @> '[{"method": "password"}]'::jsonb
			or (select auth.jwt() -> 'amr') @> '["password"]'::jsonb,
		false
	)
$$;

-- When the password was given in the current session. Null if the session was
-- not started with a password, or the token does not say when.
create function public.password_session_started_at()
returns timestamptz
language sql
stable
set search_path = ''
as $$
	select to_timestamp(max((entry ->> 'timestamp')::double precision))
	from jsonb_array_elements(
		case
			when jsonb_typeof((select auth.jwt() -> 'amr')) = 'array' then (select auth.jwt() -> 'amr')
			else '[]'::jsonb
		end
	) as entry
	where jsonb_typeof(entry) = 'object'
		and entry ->> 'method' = 'password'
		and entry ->> 'timestamp' ~ '^[0-9]+(\.[0-9]+)?$'
$$;

-- Replaces the version from the first migration: same match on the sign-in
-- address, plus the password rule. Every security policy goes through this
-- function, so the rule applies to all tables at once.
create or replace function public.current_member_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
	select m.id
	from public.members m
	where m.email = lower((select auth.jwt() ->> 'email'))
		and (
			not public.signed_in_with_password()
			or (
				m.password_login_since is not null
				-- The token gives the time in whole seconds, so compare from the start
				-- of the second. No further slack: any allowance here would let in a
				-- session opened just before the member chose their password. A token
				-- that gives no time for the password is let through.
				and coalesce(
					public.password_session_started_at() >= date_trunc('second', m.password_login_since),
					true
				)
			)
		)
$$;

-- Called by the app right after a member has saved a password.
create function public.enable_password_login()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
	if public.signed_in_with_password() then
		-- A member changing their password while signed in with it: password
		-- sign-in is already on, and this session must keep working.
		if public.current_member_id() is not null then
			return;
		end if;
		raise exception 'Password sign-in can only be turned on after signing in with an emailed code'
			using errcode = '42501';
	end if;

	-- From a code session: on from now. Running it again moves the moment
	-- forward, which shuts out every password session started before it.
	update public.members
	set password_login_since = now()
	where email = lower((select auth.jwt() ->> 'email'));

	if not found then
		raise exception 'Not a member' using errcode = '42501';
	end if;
end
$$;

revoke all on function public.signed_in_with_password() from public;
revoke all on function public.password_session_started_at() from public;
revoke all on function public.enable_password_login() from public, anon;
grant execute on function public.signed_in_with_password() to anon, authenticated;
grant execute on function public.password_session_started_at() to anon, authenticated;
grant execute on function public.enable_password_login() to authenticated;
