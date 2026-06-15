(function () {
  "use strict";

  const DEFAULTS = Object.freeze({
    targetUrl: "about:blank",
    focusMode: "page",
    blankTheme: "system",
    customBackgroundEnabled: false,
    customBackgroundColor: "#0d1117",
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

  function isHexColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || ""));
  }

  function normalizeSettings(nextSettings) {
    const next = { ...DEFAULTS, ...nextSettings };
    const normalizedUrl = normalizeUrl(next.targetUrl);
    const focusMode = next.focusMode === "address-bar" ? "address-bar" : "page";
    const blankTheme = ["system", "dark", "light"].includes(next.blankTheme) ? next.blankTheme : DEFAULTS.blankTheme;
    const customBackgroundColor = isHexColor(next.customBackgroundColor)
      ? next.customBackgroundColor
      : DEFAULTS.customBackgroundColor;

    return {
      targetUrl: normalizedUrl.ok ? normalizedUrl.url : DEFAULTS.targetUrl,
      focusMode,
      blankTheme,
      customBackgroundEnabled: Boolean(next.customBackgroundEnabled),
      customBackgroundColor,
      syncEnabled: Boolean(next.syncEnabled)
    };
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

  function applyBlankTheme(blankTheme, customBackgroundEnabled, customBackgroundColor) {
    const theme = blankTheme || DEFAULTS.blankTheme;
    document.documentElement.dataset.blankTheme = theme;

    if (customBackgroundEnabled && isHexColor(customBackgroundColor)) {
      document.documentElement.dataset.customBg = "true";
      document.documentElement.style.setProperty("--custom-bg", customBackgroundColor);
      return;
    }

    document.documentElement.dataset.customBg = "false";
    document.documentElement.style.removeProperty("--custom-bg");
  }

  function storageArea(name) {
    return chrome.storage[name];
  }

  async function getFrom(areaName) {
    return storageArea(areaName).get(SETTING_KEYS);
  }

  async function load() {
    const local = await getFrom("local");
    let synced = {};

    try {
      synced = await getFrom("sync");
    } catch (_error) {
      synced = {};
    }

    const syncEnabled = Boolean(local.syncEnabled || synced.syncEnabled);

    if (!syncEnabled) {
      return normalizeSettings({ ...DEFAULTS, ...local, syncEnabled: false });
    }

    const normalized = normalizeSettings({ ...DEFAULTS, ...local, ...synced, syncEnabled: true });

    try {
      const writeBack = chrome.storage.local.set(normalized);
      if (writeBack && typeof writeBack.catch === "function") {
        writeBack.catch(() => {});
      }
    } catch (_error) {
      // Loading should not fail just because the local cache could not be refreshed.
    }

    return normalized;
  }

  async function save(nextSettings) {
    const normalized = normalizeSettings(nextSettings);
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

  async function isFileAccessAllowed() {
    if (!chrome.extension || !chrome.extension.isAllowedFileSchemeAccess) {
      return false;
    }

    return new Promise((resolve) => {
      chrome.extension.isAllowedFileSchemeAccess(resolve);
    });
  }

  async function isIncognitoAccessAllowed() {
    if (!chrome.extension || !chrome.extension.isAllowedIncognitoAccess) {
      return false;
    }

    return new Promise((resolve) => {
      chrome.extension.isAllowedIncognitoAccess(resolve);
    });
  }

  function extensionDetailsUrl() {
    return `chrome://extensions/?id=${chrome.runtime.id}`;
  }

  window.NewTabSettings = {
    DEFAULTS,
    classifyUrl,
    applyBlankTheme,
    extensionDetailsUrl,
    isFileAccessAllowed,
    isIncognitoAccessAllowed,
    isHexColor,
    load,
    normalizeUrl,
    normalizeSettings,
    reset,
    save
  };
})();
