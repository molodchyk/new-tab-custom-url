# Release Notes

## 1.0.1

- Adds the narrow `file:///*` host permission so Chrome can expose its
  user-controlled local-file access toggle.
- Marks incognito as unsupported because Chrome does not allow New Tab override
  extensions to replace incognito new tabs.
- Changes the default and reset target to `chrome://new-tab-page/`.
- Migrates source into feature-first modules with thin app entry points and
  Chrome platform boundaries.
- Adds an English `_locales` baseline for future localization.
- Updates packaging so `dist/` keeps only the latest zip.
- Adds release validation for manifest/package version alignment, release notes,
  StorePilot files, source imports, locale keys, media dimensions, and stale
  zips.

## 1.0.0

- Initial Chrome Web Store release.
