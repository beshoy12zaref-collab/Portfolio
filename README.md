# Beshoy Zaref — Portfolio

Personal portfolio website for Beshoy Zaref, Video Editor & Motion Designer.
It's a static site (HTML, CSS and JavaScript) with no build step.

Sections: Hero · Showreel · Long Form · Reels · AI Skills · About · Contact

## Project structure

```
portfolio/
├── index.html          ← the page (GitHub Pages opens this first)
├── assets/
│   ├── images/         ← portrait photo
│   ├── icons/          ← software icons + INFINITY FRAME logos
│   ├── style.css       ← all styles, animations and responsive rules
│   └── script.js       ← Long Form, Reels, AI Skills cards, video modal, menu, contact form, hero canvas
└── README.md
```

Every path is relative, for example `assets/images/portrait.jpg`. The site works at any GitHub Pages URL, including `https://USERNAME.github.io/REPO-NAME/`.

## Deploy to GitHub Pages

1. Sign in at https://github.com and click **New** to create a repository.
   - **Repository name:** anything, e.g. `portfolio`.
     If you want the site at `https://USERNAME.github.io/` with no extra path, name it `USERNAME.github.io` instead.
   - Choose **Public**, then click **Create repository**.
2. On the empty repository page, click **uploading an existing file**. You can also use **Add file → Upload files**.
3. Unzip the ZIP on your computer and open the `portfolio` folder. Drag **everything inside it** into the upload area: `index.html`, `README.md` and the `assets` folder.
   `index.html` must sit at the top level of the repository, not inside a `portfolio/` subfolder.
4. Click **Commit changes**.
5. Open **Settings → Pages** in the left sidebar.
6. Under **Build and deployment → Source**, choose **Deploy from a branch**.
7. Under **Branch**, choose **main** and **/ (root)**, then click **Save**.
8. Wait 1–2 minutes, then refresh the Settings → Pages page. Your live link appears at the top:
   `https://USERNAME.github.io/REPO-NAME/`

## Showreel

Clicking the Showreel frame opens the YouTube video `jtzYctPIu3E` in a lightbox.
To use a different video, change `SHOWREEL_YT_ID` near the bottom of `assets/script.js` to the new video's ID (the part after `youtu.be/`).
In the video's YouTube settings, **Allow embedding** must be on.

## Adding your videos

1. Create a folder `assets/videos/` in the repository and upload your `.mp4` files there. Upload poster images to `assets/images/`.
2. In `assets/script.js`, fill in `src` and `poster` in the `LONG_FORM` and `AI_SKILLS` lists, for example:
   `{title:'Brand Film', cat:'Brand Film', src:'assets/videos/brand-film.mp4', poster:'assets/images/brand-film.jpg'}`
   An item with an empty `src` shows "Video coming soon".
3. To change reel titles, edit the `reels` list at the top of `assets/script.js`.

GitHub rejects single files larger than 100 MB, so compress videos first. For long videos, a YouTube or Vimeo embed or an external video host is usually a better fit.

## Contact form

The form sends messages through FormSubmit (formsubmit.co) to beshoy12zaref@gmail.com.
FormSubmit emails you an activation link the first time the live site sends a message. Click that link once, and messages will arrive after that.

## Notes

- File names are case-sensitive on GitHub Pages, so `Portrait.jpg` and `portrait.jpg` are different files.
- Fonts (Anton, Bebas Neue, Inter) load from Google Fonts.
- To preview locally, double-click `index.html`.
- After you edit and commit files on GitHub, the site redeploys automatically within a minute or two.
