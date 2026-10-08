# Handoff

Written 8 October 2026, after three working sessions. It describes where the
project stands, why it is built the way it is, what has and has not been
verified, and what to do next. The README covers how to run and set up the
app; this file covers everything a newcomer would otherwise have to ask.

## Status in one screen

Pyssel Hemma is a private web app for one household of seven: sign-in, a home
screen, a shared grocery list, and "who eats at home tonight". Eight more apps
are planned and exist as placeholder pages. "Pyssel Hemma" is a working name.

| Area                                  | State                                                      |
| ------------------------------------- | ---------------------------------------------------------- |
| Design system (tokens, components)    | Done                                                       |
| Home screen, grocery list             | Done, on real database tables                              |
| Sign-in by emailed code               | Done                                                       |
| Sign-in by password (optional)        | Done                                                       |
| Database schema and security rules    | Written, two migration files                               |
| Run against the real Supabase project | **Not verified.** Everything was tested against a stand-in |
| Live updates between phones           | Wired up, **never exercised**                              |
| Automated tests in the repository     | **None.** The test harness was not kept (see Verification) |
| Deployment, domain, install-to-phone  | Not started                                                |
| Git                                   | On GitHub, **public**, one commit, MIT licence file        |

The single most useful next action is to run the app against the real
Supabase project and walk through the checklist under "First run on the real
project" below.

## What is where

| Thing            | Location                                                                     |
| ---------------- | ---------------------------------------------------------------------------- |
| This project     | `~/Projects/Sites/pyssel-hemma`                                              |
| Repository       | <https://github.com/johannaefageras/pyssel-hemma> (public)                   |
| Design source    | `~/Projects/Sites/pyssel` (the Pyssel icon gallery; Vite, vanilla JS)        |
| Screen mocks     | A private design canvas, <https://claude.ai/artifact/DrF3NnmPsu1kwK9zYf3cBc> |
| Supabase project | URL and publishable key are in `.env` (not in git)                           |
| The real members | `supabase/members.sql` (git-ignored; holds email addresses)                  |

The mocks show the home screen and grocery list in light and dark. The built
app has since moved on from them in three ways: the made-up counts on tiles
are gone, housemates who have not answered dinner are grey rather than marked
with a question mark, and sign-in screens were never mocked.

Fonts, mascots and all 250 icons in `static/` were copied from `pyssel/public`.
They are copies, not links: a new icon drawn for Pyssel has to be copied over.

## Setup state, as far as the files show

Checked from the project folder on 8 October. What happened in the Supabase
dashboard cannot be seen from here, so those rows are unknown.

| Step                                                                 | State                 |
| -------------------------------------------------------------------- | --------------------- |
| `npm install`                                                        | Done                  |
| `.env` with `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Present               |
| `supabase/members.sql` created from the example                      | Present               |
| `20261007000000_init.sql` run in the SQL editor                      | Unknown               |
| `supabase/members.sql` run in the SQL editor                         | Unknown               |
| `20261008000000_password_login.sql` run in the SQL editor            | Unknown               |
| Email template pasted into both templates                            | Unknown               |
| Site URL set                                                         | Unknown               |
| Custom SMTP for the other six housemates                             | Unknown, probably not |

The README's "Set up Supabase" section has the steps. Two SQL facts to check
state by, in the SQL editor:

```sql
-- Both migrations applied? Expect three tables and the password column.
select table_name from information_schema.tables where table_schema = 'public';
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'members';

-- Members loaded? Expect seven rows.
select name, colour, password_login_since is not null as has_password from public.members;
```

## Stack

Installed versions at handoff:

| Package                  | Version |
| ------------------------ | ------- |
| `@sveltejs/kit`          | 3.0.1   |
| `svelte`                 | 5.57.2  |
| `vite`                   | 8.3.3   |
| `typescript`             | 6.0.3   |
| `@supabase/supabase-js`  | 2.117.3 |
| `@supabase/ssr`          | 0.12.7  |
| `@sveltejs/adapter-auto` | 8.0.0   |

Plain CSS with custom properties, no Tailwind, no UI library. Prettier is the
only linter. Node 22 or newer.

### SvelteKit 3 is not SvelteKit 2

Most tutorials, and most of what an AI model knows, describe SvelteKit 2. These
are the differences this project ran into. Each cost a failed type-check to find.

- **The alias is `#lib`, not `$lib`,** and TypeScript imports need the file
  extension: `import { houseDay } from '#lib/day.ts'`. It is a Node subpath
  import, declared under `imports` in `package.json`.
- **Environment variables** are declared in `src/env.ts` with `defineEnvVars`
  and imported from `$app/env/public`. `$env/static/public` still resolves but
  warns that it is deprecated.
- **The build validates environment variables.** `npm run build` fails without
  `.env`, with the message written in `src/env.ts`. A host needs the two
  variables at build time as well as at run time.
- **Hook types** come from `@sveltejs/kit/hooks`, not `@sveltejs/kit`.
- **`handleError` receives `{ kind, error, event }`,** where `kind` is `app`,
  `framework`, `validation` or `unknown`, and returns only what it overrides.
- **`resolve()` takes route ids,** and a route group is part of the id. Home is
  `resolve('/(app)')`, an app page is `resolve('/(app)/[app]', { app })`. The
  generated URL has no `(app)` in it.
- **`asset()` is typed from the `static` folder** and takes no leading slash.
  `src/lib/assets.ts` turns that into an `IconName` type, so a misspelt icon
  name fails the type-check.
- **Config lives in `vite.config.ts`.** There is no `svelte.config.js`.
- **A form POST with `Accept: */*` is answered as JSON,** not with a redirect.
  Browsers send `text/html`, so this only matters for scripts and tests.
- **`App.PageData` fields must be optional,** or every `+page.server.ts` load is
  required to return them. See the comment in `src/app.d.ts`.

## How a request flows

```text
browser
  │
  ▼
src/hooks.server.ts          builds a Supabase client from the cookies,
  │                          verifies the token (getClaims), refreshes it if
  │                          it ran out, redirects to /login without a session
  ▼
src/routes/+layout.server.ts passes the cookies down
  ▼
src/routes/+layout.ts        creates data.supabase: one long-lived client in
  │                          the browser, a fresh one per request on the server
  ▼
src/routes/(app)/+layout.ts  loads the household; sends a signed-in address
  │                          that is not a member to /inte-med
  ▼
+page.ts                     loads the page's data through data.supabase
```

Three places decide who gets through, and only the last one protects data:

1. `hooks.server.ts` requires a session for everything except `/login`.
2. `(app)/+layout.ts` requires that session to belong to a member.
3. Row-level security in Postgres decides every read and write.

The first two only choose which page to show. Anyone with the publishable key
can call Supabase directly and skip them, which is why the rules live in the
database.

### How data moves on a page

Every page follows the same pattern, and new pages should too:

1. `+page.ts` loads through `data.supabase` and names what it depends on:
   `depends('app:groceries')`.
2. The page keeps a writable `$derived` copy (`let items = $derived(data.items)`).
3. A change is applied to that copy at once, then saved, then
   `invalidate('app:groceries')` reloads from the database whether the save
   worked or not. The screen always ends up matching the database.
4. `(app)/+layout.svelte` calls the same `invalidate` when a Realtime event
   arrives and when the app returns to the foreground.

Saving happens in the browser, straight to Supabase, not through a server
action. Sign-in and the password page are the exceptions: they are plain HTML
forms with server actions, so they work without JavaScript and end in a full
page load.

Queries live in `src/lib/data/*.ts`, one file per subject. Pages do not build
queries themselves.

## Sign-in and access

This is the part with the most decisions in it.

### The model

- **Identity is an email address,** proven by typing a six-digit code that was
  emailed to it.
- **Access is a row in `public.members`** with that address. The table is
  edited by hand in SQL, never from the app.
- **Everyone else can sign in and sees nothing.** There is no separate
  allow-list for accounts; the allow-list is the members table.
- **Colour means person.** Each member has one of nine mascot colours, unique in
  the table. Yellow is the brand and is not handed out. Nine colours is also
  the ceiling on household size until someone draws more mascots.

### Why a code and not a magic link

Two reasons, both about how the app will be used:

- On a phone, a link opens in the browser. An app added to the home screen
  keeps its session separately, so the member would be signed in to the wrong
  place.
- Some mail services open every link in a message to scan it. That uses up a
  one-time link before the member taps it.

The email still contains a link, but it only opens `/login` with the address
and code filled in. Nothing is checked until the member presses the button, so
a scanner fetching it does no harm. The template is `supabase/email-template.html`.

### Sign-in by code, step by step

1. `/login`, action `send`: asks the database whether the address is a member
   (`is_house_email`). Only if it is, calls `signInWithOtp`.
2. The page shows the code form with the same sentence either way, so it does
   not reveal who lives in the house.
3. Action `verify`: `verifyOtp({ email, token, type: 'email' })`, which sets the
   session cookies, then redirects home.

### Passwords

A password is optional, per member. A member signs in with a code, taps their
mascot, opens "Lösenord" (`/losenord`) and chooses one. After that either
works. A forgotten password has no reset flow: sign in with a code and choose a
new one.

Saving a password does three things in order (`(app)/losenord/+page.server.ts`):
sets it on the account, calls `enable_password_login()`, and signs out the
account's other sessions.

**The rule that makes this safe.** Supabase lets anyone create an account for
any address with a password of their choosing. With "Confirm email" on, that
account cannot sign in. But if the real owner later confirms the address by
signing in with a code, it is the same account, and the stranger's password
would now open it. So `current_member_id()`, which every policy goes through,
treats a password session as a member only when both hold:

1. `members.password_login_since` is set, which only `enable_password_login()`
   does, and only from a session that was started with a code.
2. The password session started at or after that moment.

The second condition matters because Supabase cannot recall an access token
once issued; it stays valid for up to an hour. Without it, a session opened
with the stranger's password shortly before the member chose their own would
become a member's session the moment password sign-in was switched on.

How a session was started is read from the token's `amr` claim.

**Consequences worth knowing:**

- Accounts created with a password in the Supabase dashboard will not get in
  with that password. The sign-in form says so: sign in with a code and choose
  a password.
- Choosing a password again from a code session moves the moment forward, which
  shuts out every earlier password session for that member. Changing it while
  signed in with a password does not, so that the current session keeps working.
- The comparison is exact to the second, with no allowance for clock difference
  between Supabase's auth server and its database. An allowance was tried and
  removed: thirty seconds of slack let exactly the session through that the rule
  exists to stop.

### What the database exposes

| Object                          | Who can use it | What it does                                                    |
| ------------------------------- | -------------- | --------------------------------------------------------------- |
| `members`                       | members        | Read `id`, `name`, `colour` only. No writes.                    |
| `grocery_items`                 | members        | Read, add, remove; update `name`, `quantity`, `aisle`, `picked` |
| `dinner_answers`                | members        | Read all; write only their own row                              |
| `current_member_id()`           | signed in      | The caller's member id, or null                                 |
| `is_house_email(text)`          | anyone         | True or false for an address                                    |
| `signed_in_with_password()`     | anyone         | Reads the caller's own token                                    |
| `password_session_started_at()` | anyone         | Reads the caller's own token                                    |
| `enable_password_login()`       | signed in      | Switches password sign-in on for the caller                     |

Details that are easy to miss:

- Email addresses, `created_at` and `password_login_since` are not granted to
  the API at all. `select *` on `members` fails with "permission denied"; that
  is intended. Select the three columns by name.
- `grocery_items.added_by` is filled in by the database and cannot be updated,
  so who added an item cannot be rewritten.
- `grocery_items.aisle` is free text on purpose. Adding an aisle in the app
  needs no migration, and an id the app does not know is shown under Övrigt.
- Both migrations revoke everything first and then grant what is used. They do
  not rely on the project's default grants.
- A member who is deleted keeps their groceries on the list without a mascot;
  their dinner answers are deleted with them.

## Design system

The look is Pyssel's: ink outlines, slightly crooked corners, hard offset
shadows, a mono face for labels, one yellow accent. Tokens are in
`src/lib/styles/tokens.css`, in HSL, each resolving to the exact hex used in
`pyssel`. The dark theme overrides roles under `:root[data-theme='dark']`.

Rules that came out of the mocks. They are the reason the app stays calm with
thirty rows on screen:

- **The loud treatment is rare.** Ink border plus hard shadow is for real
  buttons, dialogs, and the one card that needs attention. Two or three per
  screen.
- **Lists are plain.** A hairline under each row, nothing else.
- **Colour means person,** so apps are told apart by icon, never by hue.
- **Icons are illustrations.** They work from about 24px up. Arrows, ticks and
  close buttons are stroke SVGs drawn inside the component.
- **Dark and black fills vanish in dark mode.** The icons' black outlines
  disappear against the dark tiles, so an icon has to read by its fills.
- **Swedish headlines need air.** `.display` uses line-height 1.14 and −0.055em
  tracking. Pyssel's own 1.01 and −0.065em make Å Ä Ö hit the line above.
- **No lone lowercase l in the mono face.** It reads as 1. `parseDraft` in
  `groceries.ts` rewrites "2 l" to "2 liter" for that reason.

Components, all in `src/lib/components/`, each with a usage comment at the top:

| Component            | Use                                                                    |
| -------------------- | ---------------------------------------------------------------------- |
| `Button`             | The loud button; `variant="primary"`, `pressed` for toggles, `square`  |
| `Tag`                | Yellow count chip, or a tilted sticker                                 |
| `Card`               | Quiet container; `variant="well"`, `active` for the one that needs you |
| `Field`              | Labelled input; the label can be hidden but is always present          |
| `Dialog`             | Modal on the native `<dialog>`                                         |
| `AppTile`            | An app on the home screen                                              |
| `CheckRow`           | A tickable list row with a mascot                                      |
| `Icon`, `Mascot`     | Images from `static/`; `Mascot` has `faded` and `waiting` states       |
| `Masthead`, `AppBar` | Top bars: brand on home, back-and-title inside an app                  |
| `ProfileButton`      | Your mascot; opens theme, password link and sign-out                   |

Interface text is Swedish. Code, comments and file names are English, except
route names, which are the Swedish words people will see in the address bar.

| Route                  | Meaning                                |
| ---------------------- | -------------------------------------- |
| `/inkop`               | Groceries                              |
| `/losenord`            | Password                               |
| `/inte-med`            | "Not in": signed in but not a member   |
| `/login?med=losenord`  | Sign-in, opened on the password form   |
| `/login?email=…&kod=…` | Sign-in, code filled in from the email |

## Verification

### What was checked

Everything below ran in a temporary cloud workspace, not on the development
machine and not against the real Supabase project.

- **Type-check, lint, production build:** clean at handoff (`npm run check`,
  `npm run lint`, `npm run build`).
- **Database, 57 checks.** Both migrations ran in a real Postgres (PGlite) set
  up with the roles, `auth` helper functions, default grants and Realtime
  publication a Supabase project starts with. Each statement ran as the `anon`
  or `authenticated` role with token claims set, the way Supabase's API does
  it. Covered: anonymous, signed-in non-member and member access to every
  table; column-level limits; the dinner "own row only" rules; constraints;
  and 20 checks on the password rule, including malformed `amr` claims.
- **The app end to end, 33 checks.** A production build ran against a stand-in
  for Supabase: its auth endpoints reimplemented, and its data API as a thin
  layer over the same Postgres, so the real migrations and security rules
  decided every response. A headless browser drove it. Covered: sign-in by
  code and by the emailed link; a stranger's address; two members sharing
  dinner answers and groceries; a non-member held at `/inte-med` and reading
  nothing with their token; rate-limit and wrong-code messages; choosing a
  password and signing in with it; an account created in a member's name
  before the member ever signed in; server-side session refresh; sign-out.
- **Dev server:** sign-in and a write over `http://localhost`, and that the
  session cookie survives plain http on a network address.
- **Screens:** compared against the mocks at 390px wide, light and dark, plus
  320px and a desktop width.

### What was not

- **The real Supabase project.** No request from this code has reached it as
  far as this document knows.
- **Real email.** Whether the code arrives, and which template Supabase uses
  for a first sign-in. The setup assumes "Confirm sign up" for the first time
  and "Magic link or OTP" after; that comes from a community answer, not from
  the documentation.
- **Realtime.** The subscription in `(app)/+layout.svelte` is standard client
  code but has never received an event. If it does not work, the app still
  catches up whenever it returns to the foreground.
- **The `amr` claim on a live token.** The password rule depends on Supabase
  writing `{"method": "password", "timestamp": …}` there. That shape is taken
  from the client library's types. If the claim is missing or shaped
  differently, the database does not recognise a password session as one, and
  the rule silently does nothing: sign-in still works, so nothing looks wrong.
  Step 5 of the first-run checklist checks this.
- **A real phone.** Not Safari, not an installed home-screen app, not the
  on-screen keyboard over the pinned add bar.
- **A screen reader.** The markup uses real buttons, labels and headings, but
  nobody has listened to it.

### The test harness is not in the repository

The two test suites and the Supabase stand-in were written in the temporary
workspace and were not copied into the project. They are worth rebuilding
before the next change to sign-in or to the security rules. What they were:

- `db.mjs`: PGlite, a Supabase-like baseline (roles `anon`, `authenticated`,
  `service_role`; `auth.jwt()`, `auth.uid()`; default grants; the
  `supabase_realtime` publication), then every file in `supabase/migrations`
  in name order, then `members.example.sql`. A helper ran one statement as a
  role with claims: `set local role …` plus
  `set_config('request.jwt.claims', …, true)` inside a transaction.
- `rls.test.mjs`: the 57 checks, using Node's `assert`.
- `server.mjs`: an HTTP server implementing `/auth/v1/otp`, `verify`, `signup`,
  `token` (password and refresh grants), `user`, `logout`, a JWKS endpoint with
  ES256-signed tokens, and a small PostgREST-alike (`select`, `eq` filters,
  `order`, insert, upsert, patch, delete, `rpc`, exact counts).
- `e2e.cjs`: the 33 checks, with Playwright.

Dev dependencies needed: `@electric-sql/pglite` and `playwright`.

## First run on the real project

Do these in order, once the setup steps in the README are done. Each one
confirms something that has only been tested against the stand-in.

1. **Sign in with a code.** Use an address that is in your Supabase team, since
   the built-in mail service delivers to no one else. Confirm the email
   contains the code and the link. If the email has no code in it, the template
   was pasted into the wrong one of the two.
2. **Home shows seven mascots** and your name. If you land on `/inte-med`, the
   address you signed in with is not in `members`, or is not lowercase there.
3. **Add, tick and clear groceries. Answer dinner.** Reload; it should all still
   be there.
4. **Realtime.** Open the app in two browsers as two members. A change in one
   should appear in the other within a second or two, without a reload. If it
   only appears after switching tabs, Realtime is not delivering; check that
   both tables are listed under Database, Publications, `supabase_realtime`.
5. **Choose a password, sign out, sign in with it.** Then run the script below.
   Signing in successfully is not enough: it also succeeds when the rule is
   doing nothing.
6. **Try an address that is not a member.** The sign-in page should behave
   identically and no email should be sent.

### Checking the password rule on a live token

Save this as `check-amr.mjs` in the project folder, run it, and delete it. It
signs in with a password the way the app does, prints how the token describes
the session, asks the database what it makes of that token, and signs out
again. It has been run against the stand-in only. The password ends up in the
shell's history, so use one you are about to change.

```js
// node --env-file=.env check-amr.mjs you@example.com 'your password'
const [email, password] = process.argv.slice(2);
const url = process.env.PUBLIC_SUPABASE_URL;
const headers = {
	apikey: process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,
	'content-type': 'application/json'
};

const signIn = await fetch(`${url}/auth/v1/token?grant_type=password`, {
	method: 'POST',
	headers,
	body: JSON.stringify({ email, password })
});
const { access_token } = await signIn.json();
if (!access_token) throw new Error(`Sign-in failed (${signIn.status})`);
headers.authorization = `Bearer ${access_token}`;

const claims = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64url').toString());
console.log('amr in the token:', claims.amr);

for (const fn of ['signed_in_with_password', 'password_session_started_at', 'current_member_id']) {
	const res = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: 'POST', headers, body: '{}' });
	console.log(`${fn}:`, await res.json());
}

await fetch(`${url}/auth/v1/logout?scope=local`, { method: 'POST', headers });
```

What to expect, for a member who has chosen a password in the app:

| Line                          | Expected                                     | If not                                                                                 |
| ----------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------- |
| `amr in the token`            | `[ { method: 'password', timestamp: 17… } ]` | The claim has another shape; the next two lines show whether the database copes        |
| `signed_in_with_password`     | `true`                                       | **The rule is off.** Fix `signed_in_with_password()` before anyone relies on passwords |
| `password_session_started_at` | The time you ran the script                  | `null` means no usable timestamp: sessions older than the password are not shut out    |
| `current_member_id`           | Your member id                               | `null` here with `true` above is the "Lösenord är inte påslaget" case                  |

The two small functions at the top of `20261008000000_password_login.sql` are
the only place that reads the claim, so a different shape is a change to those
two and nothing else.

## Known gaps and sharp edges

Things that are true today and that someone will otherwise rediscover.

**Access and security**

- `is_house_email` answers yes or no to anyone who has the publishable key,
  which is public. It reveals whether an address is a member and nothing else.
  It exists so the app never emails a stranger.
- While "Allow new users to sign up" is on, anyone can call Supabase directly
  and make it send a sign-in email to any address. The app's own form will
  not, but the API will. Turn sign-ups off once all seven have signed in once.
- "Confirm email" must stay on. Access is by address, so an address has to be
  proven. The password rule covers the worst case if it is turned off, but that
  case was reasoned through rather than tested.
- If the project has a "require current password" setting for password changes
  and it is on, the forgotten-password path stops working.
- The app has no rate limiting of its own. It relies on Supabase's.
- Signing in by code leaves three `…-code-verifier` cookies behind. They come
  from the client library's default flow and are harmless.

**Email**

- Supabase's built-in mail service delivers only to addresses in the project's
  own team, two messages an hour. The other six housemates cannot sign in until
  custom SMTP is configured. The sign-in form has a specific message for this.

**Data**

- `src/lib/supabase/database.types.ts` is written by hand. It will drift if a
  migration changes a table and the file is not updated. It can be generated
  with the Supabase CLI instead; the command is in the file's header.
- `dinner_answers` grows by up to seven rows a day and nothing removes old ones.
- "Today" for dinner is the calendar day in Europe/Stockholm (`src/lib/day.ts`).
  At midnight the answers reset. Dinner time is a constant, 19:00, in
  `src/lib/data/dinner.ts`.
- An item just added to the grocery list cannot be ticked for the fraction of a
  second before the database has given it an id.
- Sorting a new item into an aisle is a keyword lookup (`guessAisle`). Unknown
  words land in Övrigt. This is the intended first job for Claude.

**Design and assets**

- Two icons are stand-ins: the cooking pot is used for both the Kylskåpet tile
  and the Skafferi aisle. A list of about twenty icons worth drawing (fridge,
  pantry jar, meat, fish, vacuum cleaner and so on) was agreed in conversation
  and is not written down elsewhere; the two above are the only ones the
  current code needs.
- **The font files are in a public repository.** F37 Ginger is a commercial
  typeface, and both files in `static/fonts` were part of the first commit,
  next to an MIT licence file that cannot apply to them. A web font licence
  usually does not allow publishing the files for download; the licence itself
  has not been read. The two ways out are to make the repository private, or
  to take the fonts out of it and its history, which is still simple with one
  commit. Taking them out means a host that builds from git no longer gets
  them, so private is the easier of the two.
- Whether the web licence covers a second domain has not been checked either.
- The MIT licence file also covers the 250 icons and the mascots as it stands.
  If that is not the intention, say so in `LICENSE` or the README.
- The dialog closes with Escape or its button, not by tapping outside it.

**Project hygiene**

- One commit (`31e213d`, "Initial commit") on `main`, pushed to GitHub. `.env`
  and `supabase/members.sql` are ignored and were checked not to be in it.
  This file was written after that commit and is not in it.
- The repository is public, and this file describes the project's weak spots
  plainly. Nothing in it is a secret, and the migrations already show how
  access works, but read "Known gaps" once with that in mind before committing.
- No tests, no CI.
- Two files from the project template could not be written to the folder by the
  tool that created the project, and are missing: `.npmrc` containing
  `engine-strict=true`, and `.vscode/extensions.json` recommending
  `svelte.svelte-vscode`. Neither is needed.
- `adapter-auto` is still configured. It works locally and picks a host
  automatically on some platforms; no host has been chosen.

## Decisions still open

- **Name and domain.** `pyssel.se` is taken. Candidates discussed, none checked
  for availability: `pyssel.app` with the house app on `hemma.`,
  `hemmapyssel.se`, `smapyssel.se`, `mittpyssel.se`, `pysslet.se`. Renaming is
  a search-and-replace for "Pyssel Hemma", the `Hemma` sticker in `Masthead`,
  the storage key in `theme.ts` and `app.html`, and the Site URL in Supabase.
- **Hosting.** Not discussed.
- **Which app comes next.** The original advice was to build whatever annoys
  the house most (laundry booking, chores, shared expenses) before the more
  entertaining ones. The fridge-photo-to-recipe app was the first idea and is
  the first one that needs Claude.

## Suggested order from here

1. Run the first-run checklist above. Fix what it turns up.
2. Decide what to do about the font files in the public repository (see
   "Design and assets" above).
3. Custom SMTP, then invite the house.
4. Put the test harness into the repository.
5. Pick a host and an adapter; set the two environment variables there; set
   the Site URL to the real address.
6. A web manifest and icons, so the app can be added to a phone's home screen.
7. A server endpoint that asks Claude (Haiku is enough) which aisle a new item
   belongs to, with `guessAisle` as the immediate answer and fallback. This
   needs a secret API key, the first one in the project: declare it in
   `src/env.ts` without `public: true` and read it only in server code.
8. The next app. The steps are in the README under "Adding an app" and "How
   data moves".
