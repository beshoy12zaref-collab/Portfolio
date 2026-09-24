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
└── assets/
    ├── css/style.css
    ├── js/script.js
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

## Contact form

The form sends messages through FormSubmit (formsubmit.co) to beshoy12zaref@gmail.com. The first live submission triggers a one-time activation email from FormSubmit — click it once and messages will arrive normally after that.

## Notes

- File names are case-sensitive on GitHub Pages.
- Fonts (Anton, Bebas Neue, Inter) load from Google Fonts.
- To preview locally, double-click `index.html`.
- After you edit and commit files on GitHub, the site redeploys automatically within a minute or two.
