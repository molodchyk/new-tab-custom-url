import { messageOrDefault } from "../../../platform/chrome/i18n.js";

export function localizedUrlMessages() {
  return {
    convertedWindowsPath: messageOrDefault("convertedWindowsPath", "Converted a Windows path to a file:// URL."),
    convertedFileBackslashes: messageOrDefault("convertedFileBackslashes", "Converted backslashes to a file:// URL."),
    addedHttps: messageOrDefault("addedHttps", "Added https:// because no URL scheme was provided."),
    localFilesRequireToggle: messageOrDefault("localFilesRequireToggle", "Local files require Chrome's separate Allow access to file URLs toggle."),
    anotherExtensionBlocked: messageOrDefault("anotherExtensionBlocked", "Chrome may block pages from another extension."),
    schemeMayBeBlocked: (scheme) => messageOrDefault("schemeMayBeBlocked", `The ${scheme} scheme may be blocked by the browser.`, scheme),
    invalidUrlMessage: messageOrDefault("invalidUrlMessage", "Enter a valid URL, local file path, browser page, or about:blank.")
  };
}
