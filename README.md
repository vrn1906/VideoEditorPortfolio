# Varun Prajapati — portfolio and studio

The original charcoal and amber portfolio design, with an embedded video gallery and a matching password-protected studio at `/admin`. Both pages and the API run on Vercel. This project has no ChatGPT hosting dependency.

## Features

- 24 existing videos imported from both portfolios without duplicate video IDs.
- YouTube/Shorts/Instagram links, thumbnail previews, embedded playback, format/style/client filters, client profiles, and optional brand integrations.
- Automatic client and brand metadata when providers permit it; manual image uploads for unavailable metadata.
- Immediate view retrieval when publishing a new video, shared totals in the public portfolio and admin, animation with reduced-motion support, and clear count coverage.
- Private YouTube API connection, secure cookie sessions, password changes, CSRF checks, and login rate limiting.
- Existing Formspree contact form preserved: `https://formspree.io/f/mbdqkppj`.

## Vercel setup

Use the existing Vercel project `portfolio` connected to `vrn1906/VideoEditorPortfolio`. The production domain is `varunprajapati-portfolio.vercel.app`.

1. In the project's Storage tab, create/connect a Neon Postgres database using the Free plan. Confirm the provider terms yourself. Vercel should add `DATABASE_URL`; select the appropriate deployment environments. Use a separate database/branch for previews so preview edits do not change production work.
2. Add server environment variables `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH`. Run `node scripts/hash-password.mjs` locally to generate the hash without putting the password into a command or Git. There are no default production credentials.
3. Optionally add `YOUTUBE_API_KEY`, or connect it privately in the admin after deployment. Restrict it to YouTube Data API v3; HTTP referrer restrictions do not work for a server-side key.
4. Deploy the branch to preview, verify login and persistence, then merge to `main` for production. `vercel.json` configures Vite, `dist`, both routes, and the server function. Remove any old project-level build/output overrides if they conflict.

The first database request creates the tables and imports the saved videos/settings exactly once. Future deployments preserve saved work. Uploaded JPG/PNG/WebP images (up to 3 MB each) are stored in Postgres. Back up your database before destructive changes.

## Local development and checks

Use Node.js 22 or newer, then run:

```sh
npm ci
cp .env.example .env.local
# Fill .env.local with a development database and admin configuration.
npm run dev
npm test
npm run build
```

The integration suite uses an isolated in-memory Postgres emulator and mocked official YouTube statistics; it never edits the live website. It verifies initial import, private auth, CSRF, persistence, brand resolution, instant count updates, duplicate rejection, upload storage, secret privacy, and logout.

## Provider limitations

YouTube counts depend on the official API key and provider availability. Freshly added counts bypass the portfolio-wide refresh cooldown. Older counts refresh when a visitor loads the site, with a six-hour per-video interval and a one-minute global cooldown. Saved verified counts remain visible during an outage; unavailable counts are excluded, not fabricated. Instagram often blocks metadata and view counts, so the studio supports manual thumbnails/profile images. Private posts and videos whose owners disable embedding cannot play inside any third-party website.

Contact messages still go directly to the existing Formspree form. Changing the displayed contact email in the admin does not change the Formspree account's delivery settings.
