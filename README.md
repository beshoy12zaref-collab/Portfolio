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

Every reference in the page uses a relative path starting with `./assets/...`, never `/assets/...` or a Windows path. That means the site works at the root of a GitHub Pages site **and** inside a project subdirectory, for example `https://USERNAME.github.io/REPO-NAME/`.

## Deploy to GitHub Pages

1. Sign in at https://github.com and click **New** to create a repository.
   - Name it anything, e.g. `portfolio` — or `USERNAME.github.io` if you want the site at `https://USERNAME.github.io/` with no extra path.
   - Choose **Public**, then click **Create repository**.
2. On the empty repository page, click **uploading an existing file** (or **Add file → Upload files**).
3. Unzip the ZIP on your computer, open the `portfolio` folder, and drag **everything inside it** into the upload area: `index.html`, `.nojekyll`, `README.md` and the `assets` folder.
   `index.html` must sit at the top level of the repository, not inside a `portfolio/` subfolder. (`.nojekyll` has no visible name in Finder/Explorer other than a leading dot — make sure it's included; it stops GitHub Pages' Jekyll build step from ignoring files that start with `_` or `.`.)
4. Click **Commit changes**.
5. Open **Settings → Pages** in the left sidebar.
6. Under **Build and deployment → Source**, choose **Deploy from a branch**.
7. Under **Branch**, choose **main** and **/ (root)**, then click **Save**.
8. Wait 1–2 minutes, then refresh the Settings → Pages page. Your live link appears at the top.

## Showreel

Clicking the Showreel frame opens the YouTube video `jtzYctPIu3E` in a lightbox — the branded frame itself is never replaced by a plain YouTube embed. To use a different video, change `SHOWREEL_YT_ID` near the bottom of `assets/js/script.js` to the new video's ID (the part after `youtu.be/`). In that video's YouTube Studio settings, **Allow embedding** must be turned on, or the lightbox will show an error instead of the video.

## Adding Long Form / Reels / AI Skills videos

- **Long Form and AI Skills** (landscape 16:9): edit the `LONG_FORM` and `AI_SKILLS` lists near the top of `assets/js/script.js`. Set `src` to a video URL or a local path such as `./assets/videos/project-1.mp4`, and `poster` to a thumbnail such as `./assets/thumbnails/project-1.jpg`. Leaving `src` empty shows "Video coming soon".
- **Reels** (vertical 9:16): edit the `reels` list at the top of the same file to change titles/categories. The reel cards currently use the branded placeholder look by design; wire a real preview the same way once you have clips ready.

GitHub rejects single files over 100 MB, so compress local videos first, or link to YouTube/Vimeo/an external host instead.

## Contact form

The form sends messages through FormSubmit (formsubmit.co) to beshoy12zaref@gmail.com. The first time the live site sends a message, FormSubmit emails an activation link — click it once and messages will arrive normally after that.

## Notes on the mobile fix in this build

Earlier builds could show the Showreel, Long Form, Reels and AI Skills frames as a collapsed thin line on some real Android browsers, even though the frames looked correct in desktop dev tools. The frames sized themselves purely with the CSS `aspect-ratio` property, and their visible content (thumbnail, play button, labels) was positioned with `position: absolute`, which doesn't contribute to a parent's height. Certain Android browser engines — notably older WebView-based in-app browsers — either don't support `aspect-ratio`, or fail to apply it correctly to a flex/grid child, and the frame collapsed to zero height while remaining clickable.

This build adds, for every frame (Showreel, Long Form cards, AI Skills cards, Reels cards, and the video lightbox):
- an explicit `min-height` floor that guarantees visible height even if `aspect-ratio` fails silently, sized so it never adds visible empty space at the tested widths (360–430px, tablet, desktop);
- an `@supports not (aspect-ratio: …)` fallback using the classic `padding-bottom` percentage technique for browsers that don't support `aspect-ratio` at all.

No colors, borders, radii, spacing, typography, icons, or animations were changed — only these two safety nets were added. `html, body` also got an explicit `max-width: 100%; overflow-x: hidden` to guard against any sideways scroll on mobile.

## Notes

- File names are case-sensitive on GitHub Pages, so `Portrait.jpg` and `portrait.jpg` are different files.
- Fonts (Anton, Bebas Neue, Inter) load from Google Fonts.
- To preview locally, double-click `index.html`.
- After you edit and commit files on GitHub, the site redeploys automatically within a minute or two.
