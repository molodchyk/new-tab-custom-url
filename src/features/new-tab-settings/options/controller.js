import { DEFAULTS, normalizeUrl } from "../core/settings.js";
import { localizedUrlMessages } from "../ui/copy.js";
import { extensionDetailsUrl, isFileAccessAllowed } from "../../../platform/chrome/extensionAccess.js";
import { localizeDocument, messageOrDefault } from "../../../platform/chrome/i18n.js";
import { loadSettings, resetSettings, saveSettings } from "../../../platform/chrome/storage.js";
import { openTab } from "../../../platform/chrome/tabs.js";
import { applyBlankTheme } from "../../../platform/dom/theme.js";

export function initOptionsPage(root = document) {
  localizeDocument(root);

  const form = root.getElementById("options-form");
  const targetUrlInput = root.getElementById("target-url");
  const blankThemeSelect = root.getElementById("blank-theme");
  const customBackgroundEnabledInput = root.getElementById("custom-background-enabled");
  const customBackgroundColorInput = root.getElementById("custom-background-color");
  const syncEnabledInput = root.getElementById("sync-enabled");
  const fileAccessStatus = root.getElementById("file-access-status");
  const incognitoAccessStatus = root.getElementById("incognito-access-status");
  const messages = root.getElementById("messages");
  const resetButton = root.getElementById("reset");
  const detailsButton = root.getElementById("details");
  const urlMessages = localizedUrlMessages();

  function setMessage(lines, tone) {
    messages.replaceChildren();
    messages.dataset.tone = tone || "neutral";

    for (const line of lines) {
      const paragraph = root.createElement("p");
      paragraph.textContent = line;
      messages.append(paragraph);
    }
  }

  function selectedFocusMode() {
    const selected = form.querySelector('input[name="focusMode"]:checked');
    return selected ? selected.value : DEFAULTS.focusMode;
  }

  function setFocusMode(value) {
    const input = form.querySelector(`input[name="focusMode"][value="${value}"]`);
    if (input) input.checked = true;
  }

  function readForm() {
    const normalized = normalizeUrl(targetUrlInput.value, urlMessages);

    return {
      normalized,
      settings: {
        targetUrl: normalized.url,
        focusMode: selectedFocusMode(),
        blankTheme: blankThemeSelect.value,
        customBackgroundEnabled: customBackgroundEnabledInput.checked,
        customBackgroundColor: customBackgroundColorInput.value,
        syncEnabled: syncEnabledInput.checked
      }
    };
  }

  function applyCurrentTheme() {
    applyBlankTheme(
      root,
      blankThemeSelect.value,
      customBackgroundEnabledInput.checked,
      customBackgroundColorInput.value
    );
  }

  function showUrlFeedback() {
    const { normalized } = readForm();

    if (!normalized.ok) {
      setMessage(normalized.warnings, "error");
      return false;
    }

    if (normalized.warnings.length > 0) {
      setMessage(normalized.warnings, "warning");
      return true;
    }

    setMessage([messageOrDefault("readyToSave", "Ready to save.")], "neutral");
    return true;
  }

  async function refreshAccessStatus() {
    const fileAccessAllowed = await isFileAccessAllowed();

    fileAccessStatus.textContent = fileAccessAllowed
      ? messageOrDefault("fileUrlsAllowed", "File URLs: allowed")
      : messageOrDefault("fileUrlsOff", "File URLs: off. Enable in Extension Details for local files.");
    fileAccessStatus.dataset.state = fileAccessAllowed ? "ok" : "warn";

    incognitoAccessStatus.textContent =
      messageOrDefault("incognitoUnsupported", "Incognito new tabs: not supported by Chrome for New Tab override extensions.");
    incognitoAccessStatus.dataset.state = "warn";
  }

  async function loadInitialSettings() {
    const settings = await loadSettings();
    targetUrlInput.value = settings.targetUrl;
    blankThemeSelect.value = settings.blankTheme;
    customBackgroundEnabledInput.checked = settings.customBackgroundEnabled;
    customBackgroundColorInput.value = settings.customBackgroundColor;
    syncEnabledInput.checked = settings.syncEnabled;
    setFocusMode(settings.focusMode);
    applyCurrentTheme();
    showUrlFeedback();
    refreshAccessStatus();
  }

  async function saveFormSettings(event) {
    event.preventDefault();

    const { normalized, settings } = readForm();

    if (!normalized.ok) {
      setMessage(normalized.warnings, "error");
      return;
    }

    const savedSettings = await saveSettings(settings);
    targetUrlInput.value = savedSettings.targetUrl;
    applyCurrentTheme();

    const lines = [messageOrDefault("saved", "Saved.")].concat(normalized.warnings);
    setMessage(lines, normalized.warnings.length > 0 ? "warning" : "success");
  }

  async function resetFormSettings() {
    const settings = await resetSettings();
    targetUrlInput.value = settings.targetUrl;
    blankThemeSelect.value = settings.blankTheme;
    customBackgroundEnabledInput.checked = settings.customBackgroundEnabled;
    customBackgroundColorInput.value = settings.customBackgroundColor;
    syncEnabledInput.checked = settings.syncEnabled;
    setFocusMode(settings.focusMode);
    applyCurrentTheme();
    setMessage([messageOrDefault("resetToDefault", "Reset to Chrome's default new tab page.")], "success");
    refreshAccessStatus();
  }

  targetUrlInput.addEventListener("input", showUrlFeedback);
  blankThemeSelect.addEventListener("change", applyCurrentTheme);
  customBackgroundEnabledInput.addEventListener("change", applyCurrentTheme);
  customBackgroundColorInput.addEventListener("input", applyCurrentTheme);
  form.addEventListener("submit", saveFormSettings);
  resetButton.addEventListener("click", resetFormSettings);
  detailsButton.addEventListener("click", () => openTab(extensionDetailsUrl()));

  loadInitialSettings().catch((error) => {
    setMessage([error && error.message ? error.message : messageOrDefault("couldNotLoadSettings", "Could not load settings.")], "error");
  });
}
