# Screenshot Pro – Capture & Annotate

A fast, private browser extension for screenshot capture and annotation. Built with React 19, TypeScript, Vite, and Manifest V3.

## Features

- **Visible Area** — capture what you see in the current tab
- **Full Page** — capture entire scrollable pages (http/https websites only)
- Selection-first editor workflow
- Annotation tools: crop, text, arrow, rectangle, circle, highlight, blur
- Undo/redo, zoom, pan (including Ctrl/Cmd + drag)
- Copy to clipboard and download (PNG, JPG, WEBP)
- Keyboard shortcuts sheet (`?` or info button in toolbar)
- Fully local — no accounts, analytics, or cloud sync

## Development

```bash
npm install
npm run dev
```

Load the `dist/` folder as an unpacked extension in `chrome://extensions` (Developer mode).

After changing code, reload the extension and refresh open tabs to avoid stale content scripts.

## Build

```bash
npm run build
```

Production output:

- `dist/` — load unpacked or inspect built manifest
- `release/crx-screenshot-pro-<version>.zip` — upload to Chrome Web Store

## Verify before publish

```bash
npm run package:verify
```

Runs a production build and checks the ZIP for dev artifacts, manifest version, and version consistency.

## Deploy to Chrome Web Store

See [docs/DEPLOY.md](docs/DEPLOY.md) for the full step-by-step guide.

Quick checklist:

1. `npm run prepublish`
2. Host [docs/privacy-policy.html](docs/privacy-policy.html) and copy the public URL
3. Add screenshots to `store-assets/` (see [store-assets/README.md](store-assets/README.md))
4. Upload `release/crx-screenshot-pro-*.zip` to the [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
5. Paste listing text from [docs/STORE_LISTING.md](docs/STORE_LISTING.md)

## Privacy

All processing happens locally in your browser. No data is sent to external servers. See [docs/privacy-policy.html](docs/privacy-policy.html).
