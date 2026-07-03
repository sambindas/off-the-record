# Off the Record

Pick your sites. Browse them normally. They never appear in your browser history —
every page, every link, erased the instant it's written.

A Chrome and Firefox (Manifest V3) extension.

## What it does

Add a base URL like `abc.com` to your list and every visit to that domain is
removed from browser history the moment it's recorded — every path, every link,
including single-page apps that navigate with `history.pushState`. Prefix with
`*.` (e.g. `*.abc.com`) to also cover subdomains.

Unlike Incognito, you browse normally: logins, sessions, and cookies all work.
Only your history stays clean. Unlike mass-deleting history later, there's
nothing to remember to do.

## How it works

Browsers don't offer an API to *prevent* a history entry from being written, so
the extension deletes entries the instant they appear, through overlapping
detection channels:

- `history.onVisited` — full page loads
- `tabs.onUpdated` + `webNavigation.onHistoryStateUpdated` / `onReferenceFragmentUpdated` /
  `onCommitted` — single-page-app navigations and hash changes
- Each hit is scrubbed immediately and again 1.5 s later (SPA entries can be
  written after the navigation event fires)
- A 5-minute alarm sweep catches anything recorded while the extension was
  inactive

## Install

**From source (Chrome):** `chrome://extensions` → Developer mode → Load unpacked → select this folder.

**From source (Firefox):** `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → select `manifest.json`.

## Privacy

No data is collected, stored, or transmitted — see [PRIVACY.md](PRIVACY.md).
No network requests, no analytics, no third-party code.

## Project layout

- `manifest.json` — shared manifest (Firefox reads `background.scripts`, Chrome reads `background.service_worker`)
- `manifest.chrome.json` — Chrome Web Store variant (Firefox-only keys stripped)
- `background.js` — detection and deletion logic
- `popup.html/js` — one-click block for the current site
- `options.html/js/css` — manage the site list
- `icons/make_icons.py` — regenerates the icon set (`python3 icons/make_icons.py`, needs Pillow)

## License

[MIT](LICENSE)
