export const DEFAULTS = Object.freeze({
  targetUrl: "chrome://new-tab-page/",
  focusMode: "address-bar",
  blankTheme: "system",
  customBackgroundEnabled: false,
  customBackgroundColor: "#0d1117",
  syncEnabled: false
});

const INTERNAL_PROTOCOLS = new Set([
  "about:",
  "chrome:",
  "edge:",
  "brave:",
  "vivaldi:"
]);
const DEFAULT_URL_MESSAGES = Object.freeze({
  convertedWindowsPath: "Converted a Windows path to a file:// URL.",
  convertedFileBackslashes: "Converted backslashes to a file:// URL.",
  addedHttps: "Added https:// because no URL scheme was provided.",
  localFilesRequireToggle: "Local files require Chrome's separate Allow access to file URLs toggle.",
  anotherExtensionBlocked: "Chrome may block pages from another extension.",
  schemeMayBeBlocked: (scheme) => `The ${scheme} scheme may be blocked by the browser.`,
  invalidUrlMessage: "Enter a valid URL, local file path, browser page, or about:blank."
});

function hasScheme(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value);
}

function isWindowsPath(value) {
  return /^[a-z]:[\\/]/i.test(value);
}

function normalizeFileSlashes(value) {
  return value.replace(/\\/g, "/");
}

export function isHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || ""));
}

export function normalizeSettings(nextSettings) {
  const next = { ...DEFAULTS, ...nextSettings };
  const normalizedUrl = normalizeUrl(next.targetUrl);
  const focusMode = ["address-bar", "page"].includes(next.focusMode) ? next.focusMode : DEFAULTS.focusMode;
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

export function normalizeUrl(input, messages = DEFAULT_URL_MESSAGES) {
  const warnings = [];
  let value = String(input || "").trim();

  if (!value) {
    return { ok: true, url: DEFAULTS.targetUrl, warnings };
  }

  if (isWindowsPath(value)) {
    value = `file:///${normalizeFileSlashes(value)}`;
    warnings.push(messages.convertedWindowsPath);
  } else if (/^file:\\/i.test(value)) {
    value = value.replace(/^file:\\+/i, "file:///");
    value = normalizeFileSlashes(value);
    warnings.push(messages.convertedFileBackslashes);
  } else if (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?([/?#]|$)/i.test(value)) {
    value = `http://${value}`;
  } else if (!hasScheme(value)) {
    value = `https://${value}`;
    warnings.push(messages.addedHttps);
  }

  try {
    const parsed = new URL(value);

    if (parsed.protocol === "file:") {
      warnings.push(messages.localFilesRequireToggle);
    }

    if (parsed.protocol === "chrome-extension:") {
      warnings.push(messages.anotherExtensionBlocked);
    }

    if (!INTERNAL_PROTOCOLS.has(parsed.protocol) && parsed.protocol !== "file:" && parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      warnings.push(messages.schemeMayBeBlocked(parsed.protocol));
    }

    return { ok: true, url: parsed.href, warnings };
  } catch (_error) {
    return {
      ok: false,
      url: "",
      warnings: [messages.invalidUrlMessage]
    };
  }
}

export function classifyUrl(url) {
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
