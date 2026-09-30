# Beshoy Zaref — Portfolio

Personal portfolio website for Beshoy Zaref, Video Editor & Motion Designer.
It's a static site (HTML, CSS and JavaScript) with no build step.

Sections: Hero · Showreel · Long Form · Reels · AI Skills · About · Contact

## Project structure

```
portfolio/
├── index.html
├── .nojekyll
├── README.md
├── admin/                  ← private admin dashboard (see "Admin dashboard" below)
│   ├── index.html
│   ├── admin.css
│   └── admin.js
└── assets/
    ├── css/style.css
    ├── js/
    │   ├── script.js
    │   ├── supabase-config.js   ← Supabase project URL + publishable key
    │   ├── portfolio-data.js    ← loads live Supabase content on the public site
    │   └── analytics.js         ← anonymous page-view logging
    ├── images/       ← portrait photo
    ├── icons/        ← software icons + INFINITY FRAME logos
    ├── thumbnails/    ← optional custom poster images for Long Form / AI Skills cards
    └── videos/        ← optional local video files
```

Every reference in the page uses a relative path starting with `./assets/...`, never `/assets/...` or a Windows path, so the site works at the root of a GitHub Pages site **and** inside a project subdirectory.

## Deploy to GitHub Pages

1. Sign in at https://github.com and click **New** to create a repository (Public).
2. On the empty repository page, click **uploading an existing file** (or **Add file → Upload files**).
3. Unzip the ZIP, open the `portfolio` folder, and drag **everything inside it** into the upload area: `index.html`, `.nojekyll`, `README.md` and the `assets` folder. `index.html` must sit at the top level of the repository, not inside a `portfolio/` subfolder.
4. Click **Commit changes**.
5. Open **Settings → Pages**, and under **Build and deployment → Source** choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
6. Wait 1–2 minutes, then refresh the Settings → Pages page for your live link.

## Showreel

Clicking the Showreel frame opens the YouTube video `jtzYctPIu3E` in a lightbox — the branded frame is never replaced by a plain YouTube embed. To use a different video, change `SHOWREEL_YT_ID` near the bottom of `assets/js/script.js`. In that video's YouTube Studio settings, **Allow embedding** must be on.

## Adding Long Form / Reels / AI Skills videos

- **Long Form and AI Skills** (landscape 16:9): edit the `LONG_FORM` and `AI_SKILLS` lists near the top of `assets/js/script.js`. Set `src` to a video URL or a local path such as `./assets/videos/project-1.mp4`, and `poster` to a thumbnail such as `./assets/thumbnails/project-1.jpg`.
- **Reels** (vertical 9:16): edit the `reels` list at the top of the same file for titles/categories.

## How the mobile video frames are sized

Every video frame (Showreel, Long Form, Reels, AI Skills) is sized purely with CSS `aspect-ratio` — `16/9` for the landscape frames, `9/16` for Reels — with no fixed or minimum pixel height, so each one keeps its true proportion at any screen width instead of being stretched, squashed, or forced to a fixed size:

- Showreel and Long Form: always `16:9`, full width of the content column.
- AI Skills: also `16:9` — a landscape frame, never treated like a Reel.
- Reels: always `9:16`, in a horizontally-swipeable row. On mobile each card is sized with `clamp(210px, 68vw, 280px)` — never full-screen width or height — so the next card peeks in from the edge, matching the desktop carousel's organization.

A CSS `@supports not (aspect-ratio: …)` rule is the fallback for the rare browser that doesn't support `aspect-ratio` at all; it reconstructs the same ratio with the classic padding-bottom technique, and only ever activates on a non-supporting browser — it never changes anything for everyone else. `html, body` also have `max-width: 100%; overflow-x: hidden` so nothing can force the page to scroll sideways.

## Interactive grid background

Showreel, Long Form and Reels (`#showreel`, `#longform`, `#reels`) share **one continuous** grid surface, and Contact (`#contact`) has its own — both a subtle, decorative square-grid background drawn on `<canvas>` behind the content, in `assets/js/interactive-grid.js` and the "INTERACTIVE GRID BACKGROUND" section of `assets/css/style.css`. It never touches the Hero (which keeps its own separate `#pixelCanvas`), AI Skills, About, the video modal, the nav, or the admin dashboard.

- **Continuity:** Showreel/Long Form/Reels are wrapped in one `#gridSurface` container in `index.html`, and a single canvas is sized to that wrapper's full height (not per-section), so the grid lines and seeded orange cells are computed once across all three sections — there's no restart, offset, or seam at either section boundary. Contact stays a spatially separate canvas/section (other panels sit between it and Reels) but uses the same cell size, seeding algorithm, and opacity values.
- **Look (calmer, retuned):** a faint dark-grey grid at ~8% line opacity with a small, deterministic, seeded scattering of burnt-orange (`--accent`) cells at ~3–7% idle opacity. On a pointer device, only the nearest ring or two of cells around the cursor (≈75px radius) brighten, up to ~16% opacity at the closest cell, with no scaling/pulsing/flashing — opacity fades in smoothly over ~600–700ms and eases back out over ~1000–1300ms, so cells feel like they gently emerge and slowly settle rather than blink.
- **Non-interactive:** the canvas is `position:absolute; inset:0` (never changes layout size) and `pointer-events:none`, so it can never intercept a click, tap, or scroll — every button, card, link and the Reels carousel's native touch-scroll work exactly as before.
- **Determinism:** which cells get the faint orange fill is decided by a tiny seeded PRNG keyed on the surface's namespace plus each cell's grid coordinates, so the same cells light up after every reload or resize — never reshuffled, and interaction only ever modulates opacity of cells already in the fixed seeded/nearby set.
- **Mobile/touch:** the grid stays static during normal scrolling and the Reels carousel's touch-scroll (there's no scroll-driven drift anymore); a single tap gives an optional, minimal, brief reveal near the tap point that eases back out over the same slow fade-out — dragging a finger doesn't feed the effect at all.
- **Reduced motion / no canvas:** with `prefers-reduced-motion: reduce`, each surface renders the same static grid once (lines + the seeded orange cells, idle opacities only) with no pointer-follow or fades of any kind. If canvas isn't supported (or JS fails), a CSS-only static grid (same subtlety, `repeating-linear-gradient` lines plus a few fixed faint orange squares) is the fallback layer and is simply never hidden.
- **Performance:** one shared `requestAnimationFrame` loop drives every canvas (not one loop per surface), gated by `document.visibilityState` and an `IntersectionObserver` per surface so an off-screen surface does no work; the canvas backing store is capped at `devicePixelRatio` 1.5; resize handling is `requestAnimationFrame`-debounced.

## Contact form

The form sends messages through [Web3Forms](https://web3forms.com) to beshoy12zaref@gmail.com, using the public access key already embedded in `assets/js/script.js` (`handleForm()`). Web3Forms access keys are designed to be public/client-side — this is not a secret. Submission is a `fetch()` AJAX call; the page never reloads or redirects, and the green success message only appears once Web3Forms confirms `success: true`. On failure, the existing form values are preserved and an error message with a `mailto:` fallback is shown instead.

## Admin dashboard

A private admin dashboard at `admin/index.html` lets you manage projects, site text, media and view basic analytics — backed by your existing Supabase project. It's plain HTML/CSS/JS, no build step, and works on GitHub Pages exactly like the public site: because Pages serves static files, `/admin/` resolves to `admin/index.html` with no server-side routing needed.

**One-time setup required in your Supabase dashboard (do this before using the admin panel):**

1. Open your Supabase project → **Authentication → Users** → **Add user**, and create a user with email `beshoy12zaref@gmail.com` and a password you choose. The admin panel has **no sign-up form on purpose** — accounts are never created from the site itself, only from the Supabase dashboard by you.
2. Confirm Row Level Security (RLS) is already enabled on `projects`, `site_content` and `page_views` with policies that allow the authenticated admin to read/write, and allow anonymous (public) reads where the public site needs them (visible projects, site content) and anonymous inserts on `page_views` (for analytics). This project's code never disables or bypasses RLS — it only makes normal authenticated/anonymous requests and expects your existing policies to govern access.
3. Confirm the `portfolio-media` storage bucket exists (used for thumbnail uploads from the admin panel).

Only the Supabase **publishable** key (safe for the browser) is used anywhere in this project, in `assets/js/supabase-config.js`. No `service_role` key, database password, or any other secret is stored in any file.

**Logging in:** go to `https://<your-username>.github.io/<repo>/admin/`, sign in with the email/password you created in step 1. On success, the app double-checks the signed-in session's email is exactly `beshoy12zaref@gmail.com` before showing the dashboard — any other account is immediately signed out with an error, and every dashboard screen re-checks this on load and whenever the session changes.

**What each section does:**
- **Dashboard** — quick counts, and a one-time **Import Current Portfolio** button (shown only while your `projects` table is empty) that copies the site's current default content into Supabase so you have a starting point to edit.
- **Projects** — search/filter, add/edit/delete, drag-and-drop reorder within a section, a visibility toggle, and thumbnail upload (JPEG/PNG/WEBP/GIF, ≤10MB) directly to the `portfolio-media` bucket.
- **Site Content** — editable text for the hero line, about/contact copy, email, Instagram link, and each section's heading/description.
- **Media** — browse, copy public URLs, and delete files in the `portfolio-media` bucket.
- **Analytics** — total/unique/today/7-day/30-day views, mobile vs. desktop split, top referrers, and a simple bar chart, all computed from the `page_views` table.

### `site_content` schema and convention

The real `site_content` table is:

```sql
create table site_content (
  id text primary key,
  content jsonb,
  updated_at timestamptz
);
```

**Convention used throughout this codebase:** a single row, `id = 'site'`, whose `content` column is one JSON object holding every editable field, keyed exactly by the Site Content form's `data-key` attributes:

```json
{
  "hero_intro": "…", "about_heading": "…", "about_paragraph": "…",
  "contact_heading": "…", "contact_paragraph": "…", "email": "…",
  "instagram_url": "…", "showreel_heading": "…", "longform_heading": "…",
  "longform_description": "…", "reels_heading": "…", "reels_description": "…",
  "aiskills_heading": "…", "aiskills_description": "…"
}
```

Both `assets/js/portfolio-data.js` (public site read) and `admin/admin.js` (admin read/write) select/upsert this one row by `id = 'site'` and agree on this exact key set. A save merges into the existing `content` object (fields left blank in the form keep their last saved value; nothing is silently dropped) rather than replacing it wholesale. Reads stay defensive — a field value can be a plain string or an object like `{"text": "..."}`, and a missing/malformed field is simply skipped, never thrown.

**Known limitation:** `contact_paragraph` is editable in the dashboard but is intentionally **not** applied to the public site. The current markup has no dedicated element for it — the only paragraph inside `#contact .rv` is the contact form's own live status message (`#formStatus`), and applying `contact_paragraph` there would silently overwrite that status text. Add a dedicated element in `index.html`'s contact section and a matching `setText(...)` call in `portfolio-data.js` if you want this field to render live.

**Changelog (this fix):** corrected two bugs that kept dashboard edits from reaching the public site — (1) `site_content` reads/writes previously assumed a `key`/`value` table shape that doesn't match the real `id`/`content` schema above, so Site Content saves/loads silently did nothing; (2) the Showreel section only ever applied the live row's `video_url` (title, description, thumbnail, visibility and Long Form/Reels/AI Skills add/remove/reorder/edit now all reflect fully on refresh). Also added a consistent thumbnail treatment (cinematic overlay, desktop hover zoom, graceful fallback to the original placeholder on a broken image) across Showreel, Long Form, Reels and AI Skills.

### Analytics privacy

`page_views` rows contain only `page_path`, `referrer`, `device_type` (`mobile`/`desktop` heuristic), `visitor_id` (a random UUID stored in the visitor's `localStorage`), and `created_at`. No names, emails, exact locations, IP addresses, or device fingerprints are ever collected. One row is logged per browser tab session (guarded with `sessionStorage`).

## Deploying the admin folder to GitHub Pages

Upload the `admin/` folder along with everything else in step 3 of "Deploy to GitHub Pages" above — drag it into the upload area alongside `index.html`, `.nojekyll`, `README.md` and `assets`. No extra configuration is needed; GitHub Pages serves `admin/index.html` at `/admin/` automatically.

## Notes

- File names are case-sensitive on GitHub Pages.
- Fonts (Anton, Bebas Neue, Inter) load from Google Fonts.
- To preview locally, double-click `index.html`.
- After you edit and commit files on GitHub, the site redeploys automatically within a minute or two.
- The admin panel's Supabase calls (login, project CRUD, uploads, analytics) were built and reviewed against the exact schema and API described above but could not be tested live against your real Supabase project in the build environment. Please verify login, adding/editing/deleting a project, thumbnail upload, and Site Content saving once against your live project before relying on it.
