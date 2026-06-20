# Code Structure

This extension follows the shared browser extension modularization playbook.

## Runtime Surfaces

- `src/app/newtab/` owns the manifest New Tab override page and thin module entry.
- `src/app/options/` owns the options page shell and thin module entry.
- `src/app/popup/` owns the toolbar popup shell and thin module entry.
- `src/app/shared/` owns shared design tokens and small cross-surface styles.

## Feature Modules

- `src/features/new-tab-settings/core/settings.js` owns URL normalization,
  target classification, supported option values, and settings normalization.
- `src/features/new-tab-settings/newtab/controller.js` owns the new-tab redirect
  flow and local-file access messaging.
- `src/features/new-tab-settings/options/controller.js` owns options form state
  and browser access status rendering.
- `src/features/new-tab-settings/popup/controller.js` owns quick URL edits from
  the toolbar popup.

## Platform Boundaries

- `src/platform/chrome/storage.js` owns `chrome.storage.local` and
  `chrome.storage.sync` access.
- `src/platform/chrome/extensionAccess.js` owns file URL access detection and
  extension details URL construction.
- `src/platform/chrome/tabs.js` owns tab creation, options opening, and current
  tab navigation.
- `src/platform/chrome/i18n.js` owns Chrome i18n lookups and DOM localization.
- `src/platform/dom/theme.js` owns DOM theme application.

## Localization

- `_locales/en/messages.json` is the English baseline for manifest strings,
  extension-page UI, and runtime feedback messages.
- Extension pages keep readable English fallback text in HTML, then apply
  localized text through `data-i18n`, `data-i18n-title`, and
  `data-i18n-placeholder` attributes at startup.
- The URL normalization core remains pure; UI controllers pass localized copy
  into it through `src/features/new-tab-settings/ui/copy.js`.

## Storage Ownership

All keys are user configuration owned by the `new-tab-settings` feature.

| Key | Area | Shape | Notes |
| --- | --- | --- | --- |
| `targetUrl` | local, optional sync | string URL | Defaults to `chrome://new-tab-page/`. |
| `focusMode` | local, optional sync | `address-bar` or `page` | Controls redirect method where Chrome allows it. |
| `blankTheme` | local, optional sync | `system`, `dark`, or `light` | Legacy key name for the extension-owned page theme. |
| `customBackgroundEnabled` | local, optional sync | boolean | Enables a custom blank/intermediate background. |
| `customBackgroundColor` | local, optional sync | `#rrggbb` string | Ignored when invalid. |
| `syncEnabled` | local, optional sync | boolean | Determines whether settings are mirrored to sync storage. |

There is no migration from older key names. The reset path removes all current
keys from both local and sync storage.
