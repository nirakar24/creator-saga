# Creator Saga site — launch checklist

Static site in `public_html/` (upload that folder's contents to the host). All switchable settings live in
`public_html/assets/config.js`; nothing in it is secret.

## Must do before running ads

1. **Calendly** — create a 30-min "Content Strategy Call" event, then set `calendlyUrl`.
   Add these as invitee questions in Calendly (they are not asked on the site, to keep booking short):
   - What best describes you? (Creator or personal brand / Podcast / Coach or educator / Business or agency)
   - How often do you publish now? (Rarely or inconsistently / 1–2 per week / 3–5 per week / Daily or more)
   - Biggest challenge? (Editing and production / Consistency and workflow / Content strategy and packaging / Growing the audience)
   - What content do you already have? (Existing long-form videos / Short-form raw footage / Need help planning and producing content)
   - Monthly budget range (optional; confirm currency and ranges for your market)
   Also set availability, time zone, reminders, and confirmation email. Until `calendlyUrl` is set, every booking button
   uses the existing Typeform (`fallbackBookingUrl`), so nothing is a dead link — but `booking_completed` is only tracked with Calendly.
2. **Test a real booking end to end** on the live domain and confirm `booking_completed` appears in GA4 DebugView / Meta Events Manager.
3. **Analytics** — set `ga4Id` and `metaPixelId`. A consent notice appears automatically once either is set.
   In GA4, mark `booking_completed` (and `inquiry_submitted`) as key events. In Meta, `booking_completed` is sent as the standard `Schedule` event.
4. **Legal** — have `/privacy-policy/` and `/terms/` reviewed for your jurisdictions; add registered business name and a contact email if required.

## Needs your approval (built, currently hidden)

| Item | Where | What's needed |
|---|---|---|
| 70M+ views / 1.3M+ followers, client follower counts | comment in `index.html` | Source, time period, agency-wide vs per-client |
| Client logos (ChessBase India, Puneri Paltan, CSQ Podcast, Chess Saga) | `img/logo1-4` | Written permission per client |
| Client identification in portfolio | `/work/` | Videos are described without names; logos are visible inside the footage — confirm each client is OK with portfolio use |
| Case studies | `_templates/case-study.html` | At least one documented, approved case study |
| Team section | comment in `about/index.html` | Names, roles, approved photos (the original headshots are no longer in `img/`) |
| VSL | `config.js → vsl` | Recorded founder video (MP4 on a CDN), poster, WebVTT captions |
| Contact email / social links | footer | Approved details, if you want them public |

## Optional

- **Inquiry form** on `/contact/`: set `INQUIRY_TO` and `INQUIRY_FROM` in `public_html/contact.php`, then `inquiryEndpoint: "/contact.php"`.
  Requires PHP `mail()` on the host. Not tested locally (no PHP available) — submit a test inquiry after enabling.
- **Meta Conversions API**: needs a server-side endpoint or a CAPI gateway; `booking_completed` already carries an `event_id` for deduplication.
- **More portfolio clips**: aim for 6–8. Copy a `<figure class="clip">` block; make web versions with
  `ffmpeg -i in.mp4 -vf scale=720:-2 -c:v libx264 -crf 30 -preset slow -c:a aac -b:a 96k -movflags +faststart out.mp4`.
- Old files no longer used by the new pages: `public_html/style.css`, `animate.js`, `img/banner-bg.*`, `img/step*.webp`, `videos/*.gif`.
  Originals in `videos/*.mp4` are kept; the site serves the compressed copies in `media/`. The old homepage is backed up in `_backup/`.

## Tracked events

`landing_page_view`, `vsl_start`, `vsl_progress` (25/50/75/100), `portfolio_video_play`, `primary_cta_click`,
`booking_flow_open`, `booking_completed`, `inquiry_submitted`. All also go to `window.dataLayer` (GTM-ready).
`qualified_call` and `client_won` belong in your CRM, not the website.
UTM parameters are kept for the session and passed to Calendly, the Typeform link, and the inquiry form.
