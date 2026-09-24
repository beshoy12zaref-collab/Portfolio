# Beshoy Zaref — Portfolio

Personal portfolio website for Beshoy Zaref, Video Editor & Motion Designer.
It is a static site (HTML + CSS + JavaScript) — no build step and no server code.

## Project structure

```
portfolio/
├── index.html          ← the page (GitHub Pages opens this first)
├── assets/
│   ├── images/         ← portrait photo
│   ├── icons/          ← software icons + INFINITY FRAME logos
│   ├── style.css       ← all styles and animations
│   └── script.js       ← reels carousel, AI cards, mobile menu, hero canvas
└── README.md
```

All paths are relative (for example `assets/images/portrait.jpg`), so the site works
from any GitHub Pages URL, including `https://USERNAME.github.io/REPO-NAME/`.

## Deploy to GitHub Pages

1. Sign in at https://github.com and click **New** (the green button) to create a repository.
   - **Repository name:** anything you like, e.g. `portfolio`.
     (Name it `USERNAME.github.io` if you want the site at `https://USERNAME.github.io/` with no extra path.)
   - Set it to **Public**, then click **Create repository**.
2. On the new repository page, click **uploading an existing file**
   (or **Add file → Upload files**).
3. Unzip the downloaded ZIP on your computer. Open the `portfolio` folder and drag
   **everything inside it** — `index.html`, `README.md` and the `assets` folder —
   into the upload area.
   `index.html` must end up at the top level of the repository, not inside a `portfolio/` subfolder.
4. Click **Commit changes**.
5. Go to **Settings → Pages** (left sidebar).
6. Under **Build and deployment → Source**, choose **Deploy from a branch**.
7. Under **Branch**, choose **main** and **/ (root)**, then click **Save**.
8. Wait 1–2 minutes and refresh the Settings → Pages screen. Your link appears at the top:
   `https://USERNAME.github.io/REPO-NAME/`

## Updating the site

Edit or replace files in the repository (Add file → Upload files, or the pencil icon on a file)
and commit. GitHub Pages redeploys automatically within a minute or two.

- Replace the portrait: upload a new file named `assets/images/portrait.jpg`.
- Edit reel titles or AI cards: change the `reels` and `aiCards` lists at the top of `assets/script.js`.
- Change text: edit `index.html`.

## Notes

- File names are case-sensitive on GitHub Pages (`Portrait.jpg` ≠ `portrait.jpg`).
- Fonts load from Google Fonts, so the page needs an internet connection to show the exact typography.
- The contact form is not connected to an email service yet — it is a visual form only.
- To preview locally, double-click `index.html`.
