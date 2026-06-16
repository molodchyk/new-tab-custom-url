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
- storage-only permission
- no tracking and no remote requests
- URL normalization, including `example.com` to `https://example.com`
- local file guidance for `file://` URLs
- a focus mode toggle for address-bar workflow versus page workflow
- dark-aware blank/intermediate page behavior
- optional custom background color for blank and intermediate redirect screens
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

## Development

This repo has no runtime dependencies.

```bash
npm run generate:icons
npm run validate
npm test
npm run package
```

The validation script checks the manifest, referenced files, permission scope,
and accidental remote-call patterns in extension scripts.

## Chrome Web Store Automation

StorePilot-ready files live under:

- `store-listing/chrome-web-store/listing/en.md`
- `store-listing/chrome-web-store/media/icon-128.png`
- `store-listing/chrome-web-store/media/promo/small-promo.png`
- `store-listing/chrome-web-store/media/promo/marquee-promo.png`
- `docs/chrome-web-store-privacy-form.md`

## Privacy

See [`PRIVACY.md`](PRIVACY.md). In short: no analytics, no ads, no remote
network calls, and no data sale.

## Support

If this extension saves you time and you want to support its development:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-FFDD00?logo=buymeacoffee&logoColor=000)](https://buymeacoffee.com/molodchyk)
[![Patreon](https://img.shields.io/badge/Patreon-support-F96854?logo=patreon&logoColor=fff)](https://www.patreon.com/OMolodchyk)
