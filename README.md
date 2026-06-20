# New Tab: Custom URL

A small Chrome extension for setting the new tab page to a custom URL, local
file, browser internal page, or a quiet blank page.

The product goal is intentionally narrow: do the basic new-tab redirect job
without analytics, ads, remote calls, broad host permissions, or a dashboard.

## Feedback-Driven Scope

The initial product requirements are based on review feedback from existing
new-tab extensions. The recurring pain points are captured in
[`docs/feedback.md`](docs/feedback.md).

This first version focuses on:

- a tiny Manifest V3 extension
- storage permission plus file-only host access for local-file new tabs
- no tracking and no remote requests
- URL normalization, including `example.com` to `https://example.com`
- local file guidance for `file://` URLs
- a focus mode toggle for address-bar typing versus loaded-page typing
- dark, light, and system theme for extension-owned pages
- optional custom background color for blank and redirect screens
- toolbar popup access for quick URL changes
- clear reset controls before uninstall

## Load Unpacked

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this repository folder.
5. Open the extension options page and set a target URL.

For local files, Chrome requires the separate extension details toggle named
`Allow access to file URLs`.

The default and reset target is `chrome://new-tab-page/`. Users can still set
`about:blank` when they want a quiet blank page.

Chrome does not let extensions replace the New Tab page in incognito windows.

## Development

This repo has no runtime dependencies.

```bash
npm run generate:icons
npm run validate
npm test
npm run package
npm run release:check
```

The validation script checks the manifest, referenced files, permission scope,
and accidental remote-call patterns in extension scripts.

## Release Routine

Before pushing a Chrome Web Store release:

1. Bump `manifest.json` and `package.json` to the same version.
2. Add a matching top section in `docs/release-notes.md`.
3. Run `npm run release:check`.
4. Confirm `dist/` contains only the latest versioned zip.

## Chrome Web Store Automation

StorePilot-ready files live under:

- `store-listing/chrome-web-store/listing/en.md`
- `store-listing/chrome-web-store/media/icon-128.png`
- `store-listing/chrome-web-store/media/promo/small-promo.png`
- `store-listing/chrome-web-store/media/promo/marquee-promo.png`
- `_locales/en/messages.json`
- `docs/chrome-web-store-additional-fields.md`
- `docs/chrome-web-store-category.md`
- `docs/chrome-web-store-privacy-form.md`
- `docs/code-structure.md`
- `docs/release-notes.md`

## Privacy

See [`PRIVACY.md`](PRIVACY.md). In short: no analytics, no ads, no remote
network calls, and no data sale.

## Open Source

This extension is open source under the GPL-3.0 license.

Source: <https://github.com/molodchyk/new-tab-custom-url>

## Support

If this extension saves you time and you want to support its development:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-FFDD00?logo=buymeacoffee&logoColor=000)](https://buymeacoffee.com/molodchyk)
[![Patreon](https://img.shields.io/badge/Patreon-support-F96854?logo=patreon&logoColor=fff)](https://www.patreon.com/OMolodchyk)
