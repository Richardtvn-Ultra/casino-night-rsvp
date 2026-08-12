# Casino Night RSVP

A one-page RSVP site for the BPMS Casino Night year-end function, plus a
password-protected `/admin` page for viewing and exporting responses.

- `public/` — the site (RSVP page, admin page, styles, fonts)
- `functions/` — Cloudflare Pages Functions (the backend API)
- `schema.sql` — the D1 database table
- `wrangler.toml` — Cloudflare project config

## One-time setup

You'll need Node.js installed. All commands below run from this folder
(`casino-night-rsvp/`).

```bash
npx wrangler login
```

This opens a browser to connect your Cloudflare account.

### 1. Create the database

```bash
npx wrangler d1 create casino_rsvp_db
```

This prints a `database_id`. Copy it into `wrangler.toml`, replacing
`REPLACE_WITH_YOUR_DATABASE_ID`.

### 2. Create the table

```bash
npx wrangler d1 execute casino_rsvp_db --remote --file=schema.sql
```

### 3. Set the admin password

Pick a password only you and your wife will use to view RSVPs:

```bash
npx wrangler pages secret put ADMIN_PASSWORD --project-name=casino-night-rsvp
```

It will prompt you to type the password (input is hidden). If it complains the
project doesn't exist yet, do step 4 first, then come back and run this.

### 4. Deploy

```bash
npx wrangler pages deploy public --project-name=casino-night-rsvp
```

Wrangler will print a `*.pages.dev` URL when it's done — that's your live
site. The RSVP form is at `/`, the responses view is at `/admin`.

Every time you make changes, re-run the deploy command from step 4.

## Local testing (optional)

```bash
npx wrangler d1 execute casino_rsvp_db --local --file=schema.sql
npx wrangler pages dev
```

This runs the site on your machine with a local copy of the database, so you
can try it out before deploying. When prompted for `ADMIN_PASSWORD` locally,
you can set it by creating a `.dev.vars` file in this folder containing:

```
ADMIN_PASSWORD=whatever-you-want-for-testing
```

(`.dev.vars` is for local testing only — it's not deployed and should not be
committed to git.)

## Editing the event details

Date, time, venue and wording live directly in `public/index.html` near the
top (`<section class="hero">`) — just edit the text and redeploy.

## Custom domain

If you want this on your own domain instead of `*.pages.dev`, add it under
your Cloudflare Pages project → **Custom domains** in the dashboard.
