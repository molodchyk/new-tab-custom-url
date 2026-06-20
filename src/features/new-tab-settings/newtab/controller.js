import { classifyUrl, normalizeUrl } from "../core/settings.js";
import { localizedUrlMessages } from "../ui/copy.js";
import { extensionDetailsUrl, isFileAccessAllowed } from "../../../platform/chrome/extensionAccess.js";
import { localizeDocument, messageOrDefault } from "../../../platform/chrome/i18n.js";
import { loadSettings } from "../../../platform/chrome/storage.js";
import { navigateCurrentTabOrReplace, openOptionsPage, openTab } from "../../../platform/chrome/tabs.js";
import { applyBlankTheme } from "../../../platform/dom/theme.js";

export function initNewTabPage(root = document) {
  localizeDocument(root);

  const statusPanel = root.getElementById("status");
  const statusTitle = root.getElementById("status-title");
  const statusMessage = root.getElementById("status-message");
  const openOptionsButton = root.getElementById("open-options");
  const openDetailsButton = root.getElementById("open-details");
  const urlMessages = localizedUrlMessages();

  function showStatus(title, message) {
    statusTitle.textContent = title;
    statusMessage.textContent = message;
    statusPanel.hidden = false;
  }

  function navigate(url, focusMode) {
    const kind = classifyUrl(url);
    const shouldUseTabUpdate = focusMode === "address-bar" || kind === "browser-internal";

    if (shouldUseTabUpdate) {
      navigateCurrentTabOrReplace(url);
      return;
    }

    globalThis.window.location.replace(url);
  }

  async function boot() {
    openOptionsButton.addEventListener("click", openOptionsPage);
    openDetailsButton.addEventListener("click", () => openTab(extensionDetailsUrl()));

    const settings = await loadSettings();
    applyBlankTheme(
      root,
      settings.blankTheme,
      settings.customBackgroundEnabled,
      settings.customBackgroundColor
    );

    const normalized = normalizeUrl(settings.targetUrl, urlMessages);

    if (!normalized.ok) {
      showStatus(messageOrDefault("invalidUrlTitle", "Invalid URL"), normalized.warnings[0]);
      return;
    }

    const url = normalized.url;
    const kind = classifyUrl(url);

    if (kind === "blank") {
      root.body.classList.add("blank");
      return;
    }

    if (kind === "local-file" && !(await isFileAccessAllowed())) {
      showStatus(
        messageOrDefault("localFileAccessOffTitle", "Local File Access Is Off"),
        messageOrDefault("localFileAccessOffBody", "Enable Allow access to file URLs in this extension's Chrome details page, then open a new tab again.")
      );
      return;
    }

    navigate(url, settings.focusMode);
  }

  boot().catch((error) => {
    showStatus(
      messageOrDefault("newTabErrorTitle", "New Tab Error"),
      error && error.message ? error.message : messageOrDefault("newTabErrorBody", "The configured page could not be opened.")
    );
  });
}
