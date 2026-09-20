# Kids Daily Islamic Lessons — deployable site

Static site (prerendered pages) + one serverless function for feedback. Made by @Taifur.

## Deploy on Vercel (free tier is enough)
1. Put this folder in a GitHub repo, then import the repo in Vercel. Framework preset: **Other**. No build command. The output directory is set in `vercel.json` (`public`).
2. Add your domain in Vercel > Settings > Domains.
3. Before your first deploy run once (Node 18+):
   `node scripts/set-domain.mjs https://yourdomain.com --ga G-XXXXXXXXXX --gsc YOUR_SEARCH_CONSOLE_TOKEN`
   (`--ga` and `--gsc` are optional and can be added later. This replaces the placeholder domain in every page, the sitemap and robots.txt.)

## Feedback email (your address stays private)
1. Create a free account at resend.com and make an API key.
2. In Vercel > Settings > Environment Variables add: `RESEND_API_KEY`, `FEEDBACK_TO` (the email that receives feedback; stored only here, never in code), `SITE_ORIGIN` (`https://yourdomain.com`), and optionally `FEEDBACK_FROM` (a sender on a domain verified in Resend; without it Resend's test sender only delivers to the email you signed up to Resend with).
3. Redeploy. Replies go straight to the visitor because their email is set as Reply-To.

## Analytics (no ads, consent based)
1. Create a Google Analytics 4 property and pass its Measurement ID (G-...) with `--ga` (or edit `public/config.js`).
2. Tracking loads only after a visitor accepts analytics in the cookie banner. Visitors who decline are not counted.
3. GA4 shows users, sessions, average engagement time per page (Reports > Engagement > Pages and screens) and where visitors came from (Acquisition > Traffic acquisition). Custom events: `pdf_download`, `feedback_sent`.
4. Optional cookieless extra: enable Vercel Web Analytics in the Vercel dashboard.

## Google search (SEO)
1. In Search Console add your domain, verify with the HTML tag token (`--gsc`), and submit `https://yourdomain.com/sitemap.xml`.
2. Each lesson has its own URL, title, description, canonical link and structured data. `robots.txt` and `sitemap.xml` are included.
3. Ranking takes weeks. Links from masjids, madrasas and parenting groups help most.

## Security
CSP (scripts only from this site + Google Tag), HSTS, no framing, nosniff, referrer and permissions policies are in `vercel.json`. The feedback API checks same-origin, JSON only, size, field rules, header-injection characters, honeypot, minimum fill time and a per-IP limit; user text is HTML-escaped in the email; no secrets are in the code. The in-memory rate limit is per warm server instance, so also add a rate-limit rule in Vercel Firewall.

## Before you publish
Have a qualified scholar or teacher check the Bangla pronunciation, the wudu/salah guide and the hadith references. The privacy page is a plain summary, not legal advice.
