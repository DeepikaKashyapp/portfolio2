# Deepika Kashyap — Portfolio

An interactive, Awwwards-style developer portfolio built with plain HTML, CSS, and JavaScript — no build step, no framework.

## Highlights

- **Preloader** — 000→100 counter with an oscilloscope trace drawing across the screen.
- **Hero "signal field"** — a canvas of stacked waveform lines (pulsar-plot style) that bulge and glow around the cursor, behind oversized split-letter typography.
- **Smooth scrolling** via [Lenis](https://github.com/darkroomengineering/lenis), with a scroll-progress bar and a nav that hides on scroll down.
- **Scroll-driven motion** via [GSAP + ScrollTrigger](https://gsap.com/): masked word reveals, an about statement that lights up word-by-word, animated stat counters.
- **Velocity-aware marquee** that speeds up, skews, and reverses with your scroll.
- **Pinned horizontal project gallery** on desktop, with an animated SVG figure per project (latency chart, CLIP embedding matches, YOLO detections, mesh SOS route, breathing चैतन्य mark).
- **Custom cursor** with contextual labels ("Code ↗", "Live ↗"), plus magnetic buttons.
- **Signal-green contact footer** with live Kanpur (IST) time.
- **Accessible by default** — skip link, keyboard-friendly menu (Esc to close), `prefers-reduced-motion` support, and every section is readable without JavaScript or if the CDN fails.

## Structure

```
.
├── index.html   # all content/markup
├── style.css    # design tokens + styles
├── script.js    # preloader, smooth scroll, canvas, cursor, scroll animations
└── README.md
```

GSAP, ScrollTrigger, and Lenis load from jsDelivr; fonts (Space Grotesk, Instrument Serif, JetBrains Mono) load from Google Fonts.

## Run locally

Just open `index.html` in a browser, or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Push to GitHub

```bash
git add .
git commit -m "Update portfolio"
git push origin main
```

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
- Colors, fonts, and spacing are controlled by CSS variables at the top of `style.css` (`:root { ... }`) — change `--accent`, `--bg`, etc. to retheme the whole site.
- Add more projects by copying an existing `<article class="project">...</article>` block inside the `#projects` section (update the `05` counts in the gallery HUD and the stats if you do). The SVG inside `.screen` is the project's figure — swap it for a screenshot `<img>` if you prefer.
- The rotating hero roles are the `roles` array in `script.js`.
- Add `data-cursor="Label"` to any link to give it a labelled cursor, and `data-magnetic` to make it magnetic.
