# The Panel

A single-page, zero-backend app where multiple AI models (Claude, GPT, Gemini) debate a question across several rounds, then a judge model delivers a synthesized verdict.

It's one file: `index.html`. Plain HTML/CSS/JS, no build step, no server, no database. Each visitor supplies their own API keys, which are used only to call each provider directly from their browser and are never stored or transmitted anywhere else.

## Run it locally

Any static file server works. Two easy options:

```bash
# Option 1: Python
python3 -m http.server 8000
# then open http://localhost:8000

# Option 2: Node
npx serve .
```

You can also just double-click `index.html` to open it directly in a browser, though some browsers restrict certain APIs (like clipboard access) on the `file://` protocol — a local server is more reliable.

## Deploy

### Vercel
1. Push this folder to a GitHub repo (or use the Vercel CLI directly on the folder).
2. In the Vercel dashboard, "Add New Project" → import the repo.
3. Framework preset: **Other** (no build command, no output directory needed — it will serve `index.html` as-is).
4. Deploy.

Or via CLI, from this folder: `npx vercel --prod`

### Netlify
1. Drag and drop this folder onto [app.netlify.com/drop](https://app.netlify.com/drop), or connect the GitHub repo.
2. Build command: none. Publish directory: `.` (the folder containing `index.html`).
3. Deploy.

### GitHub Pages
1. Push this folder to a repo, with `index.html` at the root (or in `/docs`).
2. Repo Settings → Pages → set the source branch and folder (`/` or `/docs`).
3. GitHub will publish it at `https://<username>.github.io/<repo>/`.

## Custom domain

All three platforms support this the same basic way:
1. Add the domain in the project's dashboard (Vercel: Project → Settings → Domains. Netlify: Site → Domain settings. GitHub Pages: Settings → Pages → Custom domain).
2. The platform will show you a DNS record to add (usually a `CNAME` for a subdomain like `panel.yoursite.com`, or an `A`/`ALIAS` record for a root domain).
3. Add that record at your domain registrar. Propagation typically takes a few minutes to a few hours.
4. Once DNS resolves, the platform issues an HTTPS certificate automatically.

## Notes on the API calls

- **Anthropic** requires the `anthropic-dangerous-direct-browser-access: true` header for direct browser calls, which is already set in the code.
- **OpenAI** and **Gemini** accept direct browser calls with just the API key.
- All three calls happen client-side, straight from the visitor's browser to that provider — there is nothing in between to configure, and nothing for you to host beyond the static file itself.

## What's stored where

- **API keys** — in-memory JS variables only. Never written to `localStorage`, cookies, or sent anywhere but the provider's own API. Gone on refresh.
- **Debate history** — saved to the browser's `localStorage` under the key `panel_history`, so a returning visitor can revisit past debates on that device. Never synced anywhere.
