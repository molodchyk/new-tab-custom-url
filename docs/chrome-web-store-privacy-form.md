# Chrome Web Store Privacy Form

[privacy]
single_purpose:
New Tab: Custom URL has one purpose: it lets the user choose what page opens
when Chrome creates a new tab.

permission.storage:
Used to save the user's configured new-tab URL, focus mode, extension theme,
custom background color, and optional Chrome sync preference. The extension does
not use this permission to collect browsing history, page content, or personal
data.

host_permission:
The extension requests `file:///*` only so Chrome can expose its separate
`Allow access to file URLs` toggle and let users choose a local file as their
new-tab page. It does not request website host permissions, inject content
scripts, read page content, or make remote calls.

remote_code:
no

privacy_policy_url:
https://github.com/molodchyk/new-tab-custom-url/blob/main/PRIVACY.md

data_usage.personally_identifiable_information:
no

data_usage.web_history:
no

data_usage.website_content:
no

data_usage.user_activity:
no

certification.no_sell_or_transfer:
yes

certification.no_unrelated_use:
yes

certification.no_creditworthiness:
yes
