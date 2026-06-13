(function () {
  "use strict";

  const DEFAULTS = Object.freeze({
    targetUrl: "about:blank",
    focusMode: "page",
    blankTheme: "system",
    syncEnabled: false
  });

  const SETTING_KEYS = Object.keys(DEFAULTS);
  const INTERNAL_PROTOCOLS = new Set([
    "about:",
    "chrome:",
    "edge:",
    "brave:",
    "vivaldi:"
  ]);

  function hasScheme(value) {
    return /^[a-z][a-z0-9+.-]*:/i.test(value);
  }

  function isWindowsPath(value) {
    return /^[a-z]:[\\/]/i.test(value);
  }

  function normalizeFileSlashes(value) {
    return value.replace(/\\/g, "/");
  }

  function normalizeUrl(input) {
    const warnings = [];
    let value = String(input || "").trim();

    if (!value) {
      return { ok: true, url: "about:blank", warnings };
    }

    if (isWindowsPath(value)) {
      value = `file:///${normalizeFileSlashes(value)}`;
      warnings.push("Converted a Windows path to a file:// URL.");
    } else if (/^file:\\/i.test(value)) {
      value = value.replace(/^file:\\+/i, "file:///");
      value = normalizeFileSlashes(value);
      warnings.push("Converted backslashes to a file:// URL.");
    } else if (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?([/?#]|$)/i.test(value)) {
      value = `http://${value}`;
    } else if (!hasScheme(value)) {
      value = `https://${value}`;
      warnings.push("Added https:// because no URL scheme was provided.");
    }

    try {
      const parsed = new URL(value);

      if (parsed.protocol === "file:") {
        warnings.push("Local files require Chrome's separate Allow access to file URLs toggle.");
      }

      if (parsed.protocol === "chrome-extension:") {
        warnings.push("Chrome may block pages from another extension.");
      }

      if (!INTERNAL_PROTOCOLS.has(parsed.protocol) && parsed.protocol !== "file:" && parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        warnings.push(`The ${parsed.protocol} scheme may be blocked by the browser.`);
      }

      return { ok: true, url: parsed.href, warnings };
    } catch (_error) {
      return {
        ok: false,
        url: "",
        warnings: ["Enter a valid URL, local file path, or about:blank."]
      };
    }
  }

  function classifyUrl(url) {
    try {
      const parsed = new URL(url);

      if (parsed.protocol === "file:") return "local-file";
      if (parsed.protocol === "about:" && parsed.pathname === "blank") return "blank";
      if (parsed.protocol === "chrome-extension:") return "extension-page";
      if (INTERNAL_PROTOCOLS.has(parsed.protocol)) return "browser-internal";
      if (parsed.protocol === "http:" || parsed.protocol === "https:") return "web";
      return "other";
    } catch (_error) {
      return "invalid";
    }
  }

  function applyBlankTheme(blankTheme) {
    const theme = blankTheme || DEFAULTS.blankTheme;
    document.documentElement.dataset.blankTheme = theme;
  }

  function storageArea(name) {
    return chrome.storage[name];
  }

  async function getFrom(areaName) {
    return storageArea(areaName).get(SETTING_KEYS);
  }

  async function load() {
    const local = await getFrom("local");
    const syncEnabled = Boolean(local.syncEnabled);

    if (!syncEnabled) {
      return { ...DEFAULTS, ...local, syncEnabled };
    }

    try {
      const synced = await getFrom("sync");
      return { ...DEFAULTS, ...local, ...synced, syncEnabled };
    } catch (_error) {
      return { ...DEFAULTS, ...local, syncEnabled: false };
    }
  }

  async function save(nextSettings) {
    const normalized = { ...DEFAULTS, ...nextSettings };
    const localMirror = { ...normalized };

    await chrome.storage.local.set(localMirror);

    if (normalized.syncEnabled) {
      await chrome.storage.sync.set(normalized);
    } else {
      await chrome.storage.sync.remove(SETTING_KEYS);
    }

    return normalized;
  }

  async function reset() {
    await chrome.storage.local.remove(SETTING_KEYS);
    await chrome.storage.sync.remove(SETTING_KEYS);
    return { ...DEFAULTS };
  }

  function extensionDetailsUrl() {
    return `chrome://extensions/?id=${chrome.runtime.id}`;
  }

  window.NewTabSettings = {
    DEFAULTS,
    classifyUrl,
    applyBlankTheme,
    extensionDetailsUrl,
    load,
    normalizeUrl,
    reset,
    save
  };
})();

