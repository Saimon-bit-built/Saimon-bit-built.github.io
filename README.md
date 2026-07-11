# [YOUR TAG] — Valorant Coaching Site

3D interactive coaching site: Three.js background scene (floating glassy shapes, mouse parallax, scroll drift), scroll-reveal sections, animated stats, coaching plans, booking links. No build step — plain HTML/CSS/JS with Three.js from a CDN.

## Preview locally

Open `index.html` in a browser (internet required for the Three.js CDN).

## Drop your media here

| Folder | What goes in it |
|---|---|
| `assets/brand/` | Logo, wordmark, brand colors |
| `assets/clips/` | Highlight clips (`.mp4`, ideally under ~20 MB each for GitHub Pages) — or use YouTube links instead |
| `assets/images/` | Photos, rank/tournament screenshots |

## Content to replace (search for `[` in index.html)

- `[YOUR TAG]` / `[YOUR NAME / TAG]` — your gamer tag and name
- `[PEAK RANK]` — e.g. Radiant, Immortal 3
- Stats bar numbers (`data-count` values in the HTML)
- Timeline achievements (years, titles, descriptions)
- Plan prices `$[XX]`
- `[DISCORD INVITE OR PROFILE LINK]`, `[TWITTER/X LINK]`

## Deploy free (GitHub Pages)

1. Create a GitHub repo.
2. ```
   git init
   git add .
   git commit -m "Valorant coaching site"
   git remote add origin https://github.com/<username>/<repo>.git
   git push -u origin master
   ```
3. GitHub → Settings → Pages → Deploy from branch → master / (root).

Netlify drag-and-drop (https://app.netlify.com/drop) also works.
