# Deepika Kashyap — Portfolio

A personal portfolio site built with plain HTML, CSS, and JavaScript (no build step, no framework required).

## Structure

```
.
├── index.html   # all content/markup
├── style.css    # design system + styles
├── script.js    # typing effect, mobile nav, scroll reveal
└── README.md
```

## Run locally

Just open `index.html` in a browser, or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Push to GitHub

```bash
cd portfolio
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/DeepikaKashyapp/portfolio.git
git push -u origin main
```

(Create the empty repo first at https://github.com/new — name it `portfolio` or anything you like, do **not** initialize it with a README/license so the push above doesn't conflict.)

## Deploy

### Option A — Vercel (recommended, matches your other live links)
1. Go to https://vercel.com and sign in with GitHub.
2. Click **Add New → Project**, select your `portfolio` repo.
3. Framework preset: **Other** (it's static, no build command needed).
4. Click **Deploy**. You'll get a live URL like `https://portfolio-yourname.vercel.app`.
5. Optional: Project Settings → Domains, to set a custom domain.

### Option B — Netlify
1. Go to https://app.netlify.com, sign in with GitHub.
2. **Add new site → Import an existing project**, pick the `portfolio` repo.
3. Build command: leave blank. Publish directory: `/` (root).
4. Click **Deploy site**.

### Option C — GitHub Pages (free, no separate account needed)
1. Push the repo to GitHub (see above).
2. Go to the repo → **Settings → Pages**.
3. Under "Build and deployment", set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Save — your site will be live at `https://DeepikaKashyapp.github.io/portfolio/` in a minute or two.

## Customizing

- All text content lives in `index.html`.
- Colors, fonts, and spacing are controlled by CSS variables at the top of `style.css` (`:root { ... }`) — change `--accent`, `--bg`, etc. to retheme the whole site.
- Add more projects by copying an existing `<article class="project">...</article>` block inside the `#projects` section.
