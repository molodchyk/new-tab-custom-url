# Feedback Notes

This document preserves the critical product feedback supplied before the
initial scaffold. The source material covered Chrome Web Store pages and reviews
for New Tab Redirect, Change New Tab, Custom New Tab, New Tab Override, Joshua
Hemphill's New Tab Redirect, and the lightweight New Tab extension by maxmilton.

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

New Tab Override exists specifically to preserve address-bar focus by avoiding a
normal redirect. Users praised that when it works, but other users still wanted
page focus by default.

Product requirement:

- provide two explicit modes: address-bar typing and loaded-page typing
- avoid promising perfect address-bar selection because the browser controls
  parts of that behavior
- document the limitation in support material and store copy

### Redirect Versus Injection

New Tab Override uses a background-load and content-injection method instead of
a normal redirect. Its listing says this avoids losing address-bar focus. Review
feedback shows the tradeoff is material:

- it needs the scary "read and change all your data" permission
- users questioned that permission directly
- search pages could break, with Enter inserting a new line instead of running
  the search
- pages could fetch incompletely, load slowly, or miss images
- local files still failed for some users
- `chrome://` and `chrome-extension://` URLs remained blocked by browser
  security rules

Product requirement:

- do not mirror or inject arbitrary target pages
- do not request broad website access to solve focus behavior
- prefer simple redirect or tab-update behavior with explicit limitations
- keep trust and page correctness above clever focus workarounds

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

Joshua Hemphill's New Tab Redirect received positive feedback for source-code
availability, no background scripts, and no unnecessary permissions. That is a
useful trust signal to match.

Product requirement:

- request only `storage` and the narrow `file:///*` host permission needed for
  Chrome's local-file access toggle
- do not request website host permissions
- do not inject content scripts
- do not make remote calls
- do not include analytics, ads, affiliate links, or popups
- keep the privacy policy short and explicit
- keep the source public and easy to inspect
- avoid background scripts unless a concrete feature requires one

### White Flash and Dark Mode

Multiple users complained about being "flashbanged" by a white page during
redirects or when using `about:blank` in dark environments.

Joshua Hemphill's New Tab Redirect received praise for avoiding the flashbang,
but a user still asked for configurable redirect background color.

Product requirement:

- set the new-tab background immediately
- provide dark, light, and system blank-page themes
- prefer an internal blank page for `about:blank` so it can respect theme
- consider a configurable intermediate-page background color if users still see
  a flash during redirect

Extension UI decision:

- apply the same dark, light, and system choices to extension-owned pages such
  as options, popup, and fallback screens
- do not imply the extension can restyle the user's configured destination page

### Performance and Size

Users praised lightweight alternatives and criticized larger redirect extensions
for doing a simple job with too much weight. Some reviews described slow loading,
flicker, or a delay before typing.

Joshua Hemphill's New Tab Redirect was praised as clean and easy, but one review
still mentioned an approximately half-second delay when opening a new tab.

Product requirement:

- no framework
- no build step required for the extension runtime
- no remote assets
- keep options simple
- measure new-tab time before release, especially storage lookup plus redirect

### URL Formatting and Setup Confusion

Users missed that URLs needed a full scheme such as `https://`. Others found
option labels confusing and asked for tooltips or simpler setup.

New Tab Override had reviews asking where to set the webpage, while Joshua
Hemphill's New Tab Redirect had positive feedback for toolbar access but also a
bug report that the popup became too tiny to use.

Product requirement:

- auto-add `https://` when the user enters a bare domain
- convert common Windows file paths to `file:///`
- show warnings before save
- keep the options page direct and low on jargon
- make settings reachable from both the extension toolbar action and options
  page if a toolbar action is added
- test popup sizing if a popup UI is added

### Custom Tab Title

One Joshua Hemphill New Tab Redirect review requested a feature to rename the
tab title for the target page, for example showing a personal label instead of
the target site's default title.

Product decision:

- do not include custom tab-title rewriting in the initial version
- revisit only if it can be done without content injection, broad permissions,
  or misleading users about which page is loaded

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

Newer feedback again praised Edge and Brave support, especially where those
browsers make the native new-tab page hard to replace.

Product requirement:

- support Chrome first
- avoid Chrome-only assumptions when possible
- state that Chrome does not allow New Tab override extensions to replace
  incognito new tabs
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
