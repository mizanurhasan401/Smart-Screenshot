# Chrome Screenshot Pro

A fast, private Chrome extension for screenshot capture and annotation. Built with React 19, TypeScript, Vite, and Manifest V3.

## Features

- Capture entire screen, application window, or current browser tab
- Selection-first editor workflow
- Annotation tools: crop, text, arrow, rectangle, circle, highlight, blur
- Undo/redo, zoom, pan
- Copy to clipboard and download (PNG, JPG, WEBP)
- Fully local — no accounts, analytics, or cloud sync

## Development

```bash
npm install
npm run dev
```

Load the `dist/` folder as an unpacked extension in `chrome://extensions`.

## Build

```bash
npm run build
```

Production build outputs to `dist/`. A zip package is also created in `release/`.

## Privacy

All processing happens locally in your browser. No data is sent to external servers.
