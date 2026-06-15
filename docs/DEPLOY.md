# Deploy to Chrome Web Store

Step-by-step guide (English + Bangla).

---

## Prerequisites / পূর্বশর্ত

| Item | EN | BN |
|------|----|----|
| Developer account | $5 one-time fee, [register here](https://chrome.google.com/webstore/devconsole) | $৫ এককালীন ফি, Developer Dashboard |
| This project built | Node.js 18+ | Node.js ইনস্টল |

---

## Step 1 — Production build / প্রোডাকশন বিল্ড

```bash
npm install
npm run prepublish
```

This runs:

1. `npm run build` → creates `dist/` and `release/crx-chrome-screenshot-pro-<version>.zip`
2. `npm run package:verify` → checks manifest, version, no dev artifacts

**BN:** `prepublish` চালালে বিল্ড ও যাচাই একসাথে হবে।

---

## Step 2 — Local test / লোকাল টেস্ট

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select the `dist/` folder
4. Test:
   - Popup → Visible Area capture
   - Popup → Full Page on an https website (e.g. wikipedia.org)
   - Editor → crop, tools, copy, download
   - No errors on `chrome://extensions` → Errors

**BN:** আপলোডের আগে `dist/` দিয়ে সব ফিচার টেস্ট করুন।

---

## Step 3 — Privacy policy URL / প্রাইভেসি পলিসি URL

Chrome Web Store requires a **public privacy policy URL**.

1. Edit `docs/privacy-policy.html` — replace `your-email@example.com` with your support email
2. Host the file publicly. Options:

| Host | How |
|------|-----|
| **GitHub Pages** | Push repo → Settings → Pages → serve `docs/` folder → URL: `https://<user>.github.io/<repo>/privacy-policy.html` |
| **Google Sites** | New site → embed or link HTML content |
| **Any static host** | Upload `privacy-policy.html` to your domain |

3. Paste that URL into the Developer Dashboard → **Privacy** tab

**BN:** Chrome নিজে policy host করে না — আপনাকে একটি public লিংক দিতে হবে।

---

## Step 4 — Store screenshots / স্ক্রিনশট

Add images to `store-assets/` (see [store-assets/README.md](../store-assets/README.md)).

Upload in Dashboard → **Store listing** → Screenshots.

Minimum: **1** screenshot. Recommended: **3–5**.

---

## Step 5 — Upload ZIP / ZIP আপলোড

1. Go to [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. **New item** (first publish) or select existing item (update)
3. Upload: `release/crx-chrome-screenshot-pro-<version>.zip`  
   (version number matches `package.json`, e.g. `1.0.1`)
4. Wait for upload to parse manifest

**BN:** ZIP-এর ভিতরে সরাসরি `manifest.json` থাকতে হবে — `release/` ফোল্ডারটি আপলোড করবেন না, শুধু `.zip` ফাইল।

---

## Step 6 — Fill store listing / লিস্টিং পূরণ

Use copy from [STORE_LISTING.md](./STORE_LISTING.md):

- Name, short & detailed description (English recommended for review)
- Category: Productivity
- Single purpose statement
- Permission justifications
- Privacy policy URL from Step 3
- Icons: use `public/icons/icon-128.png` (128×128)
- Screenshots from Step 4

---

## Step 7 — Submit for review / রিভিউয়ের জন্য জমা

1. Resolve all dashboard warnings (red items)
2. Click **Submit for review**
3. Review typically takes **1–3 business days** (sometimes longer)

**BN:** সব লাল warning ঠিক করে তারপর Submit করুন।

---

## Step 8 — After publish / প্রকাশের পর

- Share your store link: `https://chrome.google.com/webstore/detail/...`
- Monitor reviews and crash reports in the Dashboard

---

## Updating a published version / আপডেট

1. Bump version in `package.json` (e.g. `1.0.0` → `1.0.1`)
2. Run `npm run prepublish`
3. Upload new ZIP in Dashboard → **Package**
4. Submit for review again

Version in ZIP must be **higher** than the live version.

---

## Resubmit after rejection / রিজেক্টের পর আবার জমা

If Chrome rejects for **unused permissions** (e.g. `storage`):

1. Remove the unused permission from [`manifest.config.ts`](../manifest.config.ts)
2. Bump `package.json` version (e.g. `1.0.0` → `1.0.1`)
3. Run `npm run prepublish`
4. Upload new ZIP: `release/crx-chrome-screenshot-pro-1.0.1.zip`
5. In Developer Dashboard → **Privacy practices**:
   - Remove justification for the removed permission (`storage`)
   - Remove host/content-script justification if content scripts were removed
   - Keep: `activeTab`, `tabs`, `scripting` only
6. Re-host updated [`privacy-policy.html`](./privacy-policy.html) if permissions changed
7. Submit for review (fix the violation; appeal is usually not needed)

**BN:** unused permission সরিয়ে নতুন ভার্সন ZIP আপলোড করুন; Privacy ফর্ম থেকে সেই permission-এর justification মুছুন।

---

## Troubleshooting / সমস্যা সমাধান

| Problem | Solution |
|---------|----------|
| `package:verify` fails on localhost | You built with dev server running into dist — run `npm run build` fresh |
| Full page disabled in popup | Normal on `chrome://`, extension pages, Web Store — use a regular https site |
| Permission review questions | Use justifications from [STORE_LISTING.md](./STORE_LISTING.md) |
| ZIP rejected | Ensure `manifest.json` is at ZIP root, not inside a subfolder |

---

## File reference

| Path | Purpose |
|------|---------|
| `manifest.config.ts` | Source manifest (edit this, not `dist/manifest.json`) |
| `dist/` | Production build output |
| `release/*.zip` | Upload to Chrome Web Store |
| `docs/privacy-policy.html` | Host for privacy URL |
| `docs/STORE_LISTING.md` | Dashboard copy-paste text |
