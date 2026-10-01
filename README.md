# Deepika Kashyap — Portfolio

A playful, interactive developer portfolio built with plain HTML, CSS and JavaScript. No build step, no framework.

## What's inside

- **Boot intro:** a quick terminal "boot sequence" over colourful stripes (once per visit; click or press a key to skip).
- **3D avatar:** a stylized Three.js version of me, built in code. She follows the cursor, blinks, waves, talks when clicked, cheers on a new game high score, and gets lit by her laptop screen in dark mode. Falls back to an SVG illustration if WebGL isn't available.
- **Light and dark themes:** follows the system setting, with a toggle that spreads the new theme in a circle and remembers the choice.
- **Multi-colour "syntax highlighting" palette:** each colour has a job, and each project and section has its own.
- **Bouncy hero letters, draggable stickers, magnetic buttons, custom cursor, scroll-speed marquee.**
- **Stacked project cards:** case studies (Problem → Built → My part → Result) with an animated figure each.
- **Git-log experience timeline** and a **VS Code-style skills editor** (hover a tool to see where it was used).
- **Playground:** *Deploy Dash*, a one-button runner game (jump bugs, merge conflicts and 404s, collect skills and coffee), plus an interactive terminal (`help`, `projects`, `theme dark`, `play`, and one hidden `sudo` command).
- **Accessible:** skip link, keyboard-friendly menu, tabs and terminal, `prefers-reduced-motion` support, and everything readable without JavaScript or if the CDN fails.

## Structure

```
.
├── index.html       # all content/markup
├── style.css        # design tokens (both themes) + styles
├── script.js        # theme, boot intro, smooth scroll, animations, cursor, stickers
├── js/
│   ├── avatar.js    # the 3D avatar (Three.js)
│   ├── game.js      # Deploy Dash
│   ├── terminal.js  # interactive terminal
│   └── confetti.js  # tiny confetti effect
├── og.png           # social share preview image
└── README.md
```

GSAP, ScrollTrigger, Lenis and Three.js load from jsDelivr; fonts (Bricolage Grotesque, Geist, Geist Mono) from Google Fonts.

## Run locally

Serve the folder (opening the file directly works too, but a server is closer to production):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Add your résumé

Drop your PDF in the project root as `resume.pdf`. The "Résumé (PDF)" button in the contact section appears automatically once the file exists.

## Deploy

### Option A — Vercel (recommended, matches your other live links)
1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New → Project**, select your `portfolio2` repo.
3. Framework preset: **Other** (it's static, no build command needed).
4. Click **Deploy**. You'll get a live URL like `https://portfolio-yourname.vercel.app`.
5. Optional: Project Settings → Domains, to set a custom domain.

### Option B — Netlify
1. Go to https://app.netlify.com, sign in with GitHub.
2. **Add new site → Import an existing project**, pick the `portfolio2` repo.
3. Build command: leave blank. Publish directory: `/` (root).
4. Click **Deploy site**.

### Option C — GitHub Pages (free, no separate account needed)
1. Push the repo to GitHub (see above).
2. Go to the repo → **Settings → Pages**.
3. Under "Build and deployment", set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Save — your site will be live at `https://DeepikaKashyapp.github.io/portfolio2/` in a minute or two.

## Customizing

- All text content lives in `index.html`.
- Colours, fonts and spacing are CSS variables at the top of `style.css`. Light values are on `:root`; dark values are repeated in the two dark-theme blocks below it.
- Add a project by copying an `<article class="pcard">` block inside `#stackCards` and picking a colour with `style="--c:var(--blue);--on-c:var(--on-blue)"`.
- The avatar's speech-bubble lines are the `lines` array in `script.js`; game skill facts are `SKILLS` in `js/game.js`; terminal commands are in `js/terminal.js`.
- After deploying, change `og:image` in `index.html` to the full URL (e.g. `https://your-site.vercel.app/og.png`) so link previews show the image.
