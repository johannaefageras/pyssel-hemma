# Pyssel Hemma

A platform of small apps for one household, in the Pyssel design: sign-in for
the people who live here, a home screen, a shared grocery list and "who eats at
home tonight". "Pyssel Hemma" is a working name.

SvelteKit 3, Svelte 5 (runes), TypeScript, plain CSS, Supabase. No Tailwind, no UI library.

## Run it

Node 22 or newer, and a Supabase project set up as described below.

```sh
npm install
cp .env.example .env    # then fill in the two values
npm run dev
```

To try it on a phone on the same wifi: `npm run dev -- --host`, then open the
Network address Vite prints.

```sh
npm run check     # svelte-check and TypeScript
npm run build     # production build (needs .env too)
npm run format    # prettier
```

## Set up Supabase

Do these once, in the Supabase dashboard. Nothing here needs a secret key.

1. **Keys.** Copy `.env.example` to `.env` and fill in the project URL and the
   publishable key (Project Settings, API Keys). Both are public by design.
2. **Tables.** Open the SQL editor and run the files in `supabase/migrations`
   one at a time, in name order: first `20261007000000_init.sql`, then
   `20261008000000_password_login.sql`. The first creates three tables with
   row-level security and adds the two shared ones to Realtime. The second
   adds the rule for password sign-in.
3. **Members.** Copy `supabase/members.example.sql` to `supabase/members.sql`
   (git ignores it), put in the real names and sign-in addresses, and run it in
   the SQL editor. Being on this list is what grants access.
4. **Sign-in email.** Under Authentication, Emails, paste the body of
   `supabase/email-template.html` into both **Confirm sign up** and
   **Magic link or OTP**. The first is sent the first time an address signs
   in, the second every time after. Without this the email has no code in it.
5. **Site URL.** Under Authentication, URL Configuration, set Site URL to where
   the app runs: `http://localhost:5173` while developing, the real address
   later. The link in the email is built from it.
6. **Leave "Confirm email" on.** It is on by default. Access is granted by
   email address, so an address must be proven before it counts.
7. **Leave "require current password" off**, if your project has that setting
   for password changes. Signing in with a code is how a forgotten password is
   replaced, and that member no longer knows the current one.

Two things to know before the rest of the house joins:

- **Email delivery.** Supabase's built-in mail service only delivers to
  addresses in your own Supabase team, and only two messages an hour. That is
  enough to sign in yourself. For the others, add a custom SMTP provider under
  Authentication, Emails (Resend, Brevo, Postmark and similar have free tiers).
- **Closing the door.** Once everyone has signed in once, you can turn off
  "Allow new users to sign up" under Authentication, Sign In / Providers. Strangers
  already see nothing, but this also stops them from requesting sign-in emails.

To add or remove someone later, insert or delete their row in `public.members`.

## How access works

- **Who you are** is the email address you proved by typing the emailed code.
- **A password is optional.** A member can choose one under their name once
  signed in, and then use either. A forgotten password needs no reset flow:
  sign in with a code and choose a new one.
- **A password only counts after a code.** Anyone can ask Supabase to create
  an account for any address with a password of their choosing. So the
  database treats a password session as a member only if that member chose a
  password in the app, from a code session, and the password session began
  after that. `supabase/migrations/20261008000000_password_login.sql` explains it.
- **Whether you get in** is decided in the database: every table has row-level
  security that checks the signed-in address against `public.members`. A
  signed-in address that is not listed can read and write nothing.
- **The app's own checks** (`src/hooks.server.ts`, `src/routes/(app)/+layout.ts`)
  only decide which page to show. They are not what protects the data.
- Members see each other's name and colour. Email addresses stay in the
  database and are never sent to the browser.

## What is real and what is not yet

| Part                             | State                                                  |
| -------------------------------- | ------------------------------------------------------ |
| Tokens, fonts, components        | Real                                                   |
| Light and dark theme             | Real, saved per browser                                |
| Sign-in by emailed code          | Real                                                   |
| Sign-in by password              | Real, optional per member                              |
| Members and their colours        | Real, from `public.members`                            |
| Dinner answer                    | Real, one row per member and day                       |
| Grocery list                     | Real: add, tick and clear, shared by everyone          |
| Live updates between phones      | Wired to Supabase Realtime, not yet tried on a project |
| Sorting a new item into an aisle | A keyword lookup; the Claude call is not wired up      |
| The other eight apps             | A placeholder page each                                |
| Dinner time                      | A constant, 19:00, in `src/lib/data/dinner.ts`         |

The schema, the security rules and the whole sign-in and data flow were tested
against a local Postgres with a stand-in for Supabase's auth and API. Two
things can only be tried on the real project: that the email arrives with the
code, and that a change on one phone shows up on another without a reload. If
Realtime is off, the app still catches up whenever it comes back to the front.

## Structure

```text
src/
  app.html                 Page shell; sets the theme before first paint
  env.ts                   The two environment variables, validated at start
  hooks.server.ts          Session cookies, and the gate in front of every page
  lib/
    styles/
      tokens.css           Colours (HSL), type sizes, radii, borders, shadows
      fonts.css            F37 Ginger Soft and Mono Soft
      base.css             Reset and the few global classes (.display, .eyebrow, .text-button …)
    components/            Button, Tag, Card, Field, Dialog, AppTile, and the bars and rows built from them
    data/
      household.ts         Members
      apps.ts              The app registry behind the home screen
      groceries.ts         Grocery items, aisles, parsing what was typed
      dinner.ts            Dinner answers
    supabase/
      database.types.ts    The tables as TypeScript
      client.ts            The typed client
    assets.ts              IconName, typed from static/icons
    day.ts                 "Today" in the house's time zone
    theme.ts               Theme choice and storage
  routes/
    +layout.ts             Creates the Supabase client every page uses
    login/                 Sign-in: a code by email, or a password
    inte-med/              Signed in, but not on the members list
    (app)/                 Members only
      +layout.ts           Loads the household
      +layout.svelte       Live updates
      +page.svelte         Home
      inkop/               Grocery list
      losenord/            Choose or change a password
      [app]/               Placeholder for apps without a route of their own
    +error.svelte          404 and other errors
static/
  fonts/ icons/ mascot/    Copied from the pyssel project
supabase/
  migrations/              The schema and security rules, to run in name order
  members.example.sql      Template for the household
  email-template.html      The sign-in email
```

Imports from `src/lib` use the `#lib` alias and need the file extension:
`import { houseDay } from '#lib/day.ts'`.

## How data moves

Each page loads its data in `+page.ts` through `data.supabase` and names what
it depends on, for example `depends('app:groceries')`. A change is shown at
once (the page keeps a writable `$derived` copy), saved, and then the page's
data is loaded again with `invalidate('app:groceries')`, so the screen always
ends up matching the database. Realtime events and returning to the app call
the same `invalidate`.

To add a table: write a migration with row-level security, add the table to
`database.types.ts`, put its queries in a file under `src/lib/data/`, and if it
is shared, add it to the Realtime publication and to `(app)/+layout.svelte`.

## Design rules

These came out of the mocks and are worth keeping.

- **Colour means person.** Each member owns one mascot colour. Yellow is the
  brand. Apps are told apart by their icon, not by a hue.
- **The loud treatment is rare.** Ink border plus hard shadow is for real
  buttons, dialogs, and the one card that needs you. A screen should have two
  or three of them, not ten.
- **Lists are plain.** Rows get a hairline (`--rule`) and nothing else.
- **Icons are illustrations.** They work from about 24px up. Arrows, ticks and
  close buttons are stroke SVGs drawn in the component.
- **Swedish headlines need air.** `.display` uses line-height 1.14, not
  Pyssel's 1.01, or Å Ä Ö collide with the line above.
- **No lone lowercase l in the mono face.** It reads as 1. Write "2 liter".

## Adding an app

1. Add or edit its entry in `src/lib/data/apps.ts`. `icon` is type-checked
   against the files in `static/icons`.
2. Create `src/routes/(app)/<slug>/+page.svelte`. It takes over from the
   placeholder automatically. Start with `<AppBar title icon />`.
3. Set `built: true`.

## Next steps

1. **Claude.** A server endpoint that sorts a new grocery item into an aisle
   (Haiku is plenty), with `guessAisle` as the instant fallback. Then the
   fridge photo to recipe app.
2. **An adapter.** `adapter-auto` is fine locally; pick one when you know where
   it will be hosted, and set the two environment variables there.
3. **Install to home screen.** A web manifest and icons, so the others in the
   house actually open it.

## Fonts

F37 Ginger is a commercial typeface. The files in `static/fonts` come from the
pyssel project. Check that the web licence covers this site's domain as well.
