# Feedback Notes

This document preserves the critical product feedback supplied before the
initial scaffold. The source material covered Chrome Web Store pages and reviews
for New Tab Redirect, Change New Tab, Custom New Tab, and the lightweight New
Tab extension by maxmilton.

## Main User Complaints

### Local Files

Users repeatedly complained that `file://` pages stopped working, showed a blank
page, or required unclear setup after Chrome updates. Several reviews mention
Chrome 118 and the separate `Allow access to file URLs` toggle.

Product requirement:

- support `file://` URLs
- normalize Windows paths such as `C:\page.html`
- detect local-file targets before redirecting
- show direct instructions when file access is off
- do not imply the extension can enable the browser permission itself

### Focus Behavior

Some users want `Ctrl+T` to keep the address bar ready for immediate typing.
Others want focus inside the loaded page, such as a search box or app field.
Many older complaints specifically mention cursor placement, address-bar
highlighting, and the "Always update tab, not redirect" behavior.

Product requirement:

- provide two explicit modes: page focus and address-bar workflow
- avoid promising perfect address-bar selection because the browser controls
  parts of that behavior
- document the limitation in support material and store copy

### Reliability After Browser Updates

Users complained that extensions stopped working after Chrome, ChromeOS, Edge,
or other Chromium browser updates. Examples included blank pages, URL settings
not sticking, extensions being disabled, and local-file behavior changing.

Product requirement:

- keep the implementation small and easy to audit
- avoid unnecessary APIs and permissions
- validate the manifest and source before release
- maintain a clear changelog when browser behavior changes

### Settings Sync and Storage

One review mentioned a sync setting not working across browsers. Others said a
new URL did not save or that the extension reverted to an old URL.

Product requirement:

- make sync optional
- mirror synced settings locally so new tabs can load quickly
- provide a reset button
- keep storage keys simple and versionable

### Permissions and Trust

Users complained about intrusive permissions, "manage apps" prompts, suspected
search hijacking, random popups, and malware or trojan warnings. One Custom New
Tab review explicitly claimed that a "no tracking" listing conflicted with
PostHog tracking.

Product requirement:

- request only `storage`
- do not request host permissions
- do not inject content scripts
- do not make remote calls
- do not include analytics, ads, affiliate links, or popups
- keep the privacy policy short and explicit

### White Flash and Dark Mode

Multiple users complained about being "flashbanged" by a white page during
redirects or when using `about:blank` in dark environments.

Product requirement:

- set the new-tab background immediately
- provide dark, light, and system blank-page themes
- prefer an internal blank page for `about:blank` so it can respect theme

### Performance and Size

Users praised lightweight alternatives and criticized larger redirect extensions
for doing a simple job with too much weight. Some reviews described slow loading,
flicker, or a delay before typing.

Product requirement:

- no framework
- no build step required for the extension runtime
- no remote assets
- keep options simple

### URL Formatting and Setup Confusion

Users missed that URLs needed a full scheme such as `https://`. Others found
option labels confusing and asked for tooltips or simpler setup.

Product requirement:

- auto-add `https://` when the user enters a bare domain
- convert common Windows file paths to `file:///`
- show warnings before save
- keep the options page direct and low on jargon

### Favicon and Tab Identity

A Custom New Tab review said a configured site's favicon appeared to persist on
unrelated Google tabs.

Product requirement:

- do not add unnecessary extension favicon behavior
- keep the redirect page minimal so the target page can own its title and icon
- track favicon reports as a release-blocking issue if reproduced

### Uninstall and Reset

One user said uninstalling did not cleanly reset the behavior until they
reinstalled and cleared the URL.

Product requirement:

- provide a visible reset button
- document that removing the extension restores Chrome's default new-tab page
- keep no external state outside Chrome extension storage

### Incognito and Browser Variants

Reviews mentioned Edge, Brave, Comet Browser, Vivaldi, ChromeOS, and incognito.
Some praised Chromium browser support while others reported browser-specific
breakage.

Product requirement:

- support Chrome first
- avoid Chrome-only assumptions when possible
- state that incognito requires the browser's "Allow in incognito" extension
  setting
- treat Edge, Brave, Vivaldi, and other Chromium browsers as compatibility
  targets, not guarantees

### Full New-Tab Page Features

Feedback on the maxmilton New Tab extension included requests for keyboard
navigation through searched tabs and customizable links. Other users questioned
whether an open-tabs list is useful when the tab bar is already visible.

Product decision:

- do not build a dashboard in the initial version
- do not add bookmarks, tab search, recent tabs, widgets, or custom links
- revisit these only if the product direction changes from URL utility to full
  new-tab workspace

## Positioning

The strongest opportunity is not "more new-tab features." It is a trustworthy,
boring utility:

> Set your new tab to any URL or local file. Tiny, private, no tracking.

## Non-Goals

- no analytics
- no ads
- no homepage takeover
- no search engine changes
- no broad site access
- no content injection
- no large dashboard
- no promise to bypass Chrome security restrictions

