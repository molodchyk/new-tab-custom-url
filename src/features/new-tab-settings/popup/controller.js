import { DEFAULTS, normalizeUrl } from "../core/settings.js";
import { localizedUrlMessages } from "../ui/copy.js";
import { localizeDocument, messageOrDefault } from "../../../platform/chrome/i18n.js";
import { loadSettings, resetSettings, saveSettings } from "../../../platform/chrome/storage.js";
import { openOptionsPage } from "../../../platform/chrome/tabs.js";
import { applyBlankTheme } from "../../../platform/dom/theme.js";

export function initPopup(root = document) {
  localizeDocument(root);

  const form = root.getElementById("popup-form");
  const targetUrlInput = root.getElementById("popup-target-url");
  const messages = root.getElementById("popup-messages");
  const optionsButton = root.getElementById("popup-options");
  const resetButton = root.getElementById("popup-reset");
  const urlMessages = localizedUrlMessages();

  let currentSettings = { ...DEFAULTS };

  function setMessage(lines, tone) {
    messages.replaceChildren();
    messages.dataset.tone = tone || "neutral";

    for (const line of lines) {
      const paragraph = root.createElement("p");
      paragraph.textContent = line;
      messages.append(paragraph);
    }
  }

  function showUrlFeedback() {
    const normalized = normalizeUrl(targetUrlInput.value, urlMessages);

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

  async function loadInitialSettings() {
    currentSettings = await loadSettings();
    targetUrlInput.value = currentSettings.targetUrl;
    applyBlankTheme(
      root,
      currentSettings.blankTheme,
      currentSettings.customBackgroundEnabled,
      currentSettings.customBackgroundColor
    );
    showUrlFeedback();
  }

  async function saveFormSettings(event) {
    event.preventDefault();

    const normalized = normalizeUrl(targetUrlInput.value, urlMessages);

    if (!normalized.ok) {
      setMessage(normalized.warnings, "error");
      return;
    }

    currentSettings = await saveSettings({
      ...currentSettings,
      targetUrl: normalized.url
    });
    targetUrlInput.value = currentSettings.targetUrl;

    const lines = [messageOrDefault("saved", "Saved.")].concat(normalized.warnings);
    setMessage(lines, normalized.warnings.length > 0 ? "warning" : "success");
  }

  async function resetFormSettings() {
    currentSettings = await resetSettings();
    targetUrlInput.value = currentSettings.targetUrl;
    applyBlankTheme(
      root,
      currentSettings.blankTheme,
      currentSettings.customBackgroundEnabled,
      currentSettings.customBackgroundColor
    );
    setMessage([messageOrDefault("resetToDefault", "Reset to Chrome's default new tab page.")], "success");
  }

  targetUrlInput.addEventListener("input", showUrlFeedback);
  form.addEventListener("submit", saveFormSettings);
  optionsButton.addEventListener("click", openOptionsPage);
  resetButton.addEventListener("click", resetFormSettings);

  loadInitialSettings().catch((error) => {
    setMessage([error && error.message ? error.message : messageOrDefault("couldNotLoadSettings", "Could not load settings.")], "error");
  });
}
