(function () {
  "use strict";

  const form = document.getElementById("popup-form");
  const targetUrlInput = document.getElementById("popup-target-url");
  const messages = document.getElementById("popup-messages");
  const optionsButton = document.getElementById("popup-options");
  const resetButton = document.getElementById("popup-reset");

  let currentSettings = { ...NewTabSettings.DEFAULTS };

  function setMessage(lines, tone) {
    messages.replaceChildren();
    messages.dataset.tone = tone || "neutral";

    for (const line of lines) {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      messages.append(paragraph);
    }
  }

  function showUrlFeedback() {
    const normalized = NewTabSettings.normalizeUrl(targetUrlInput.value);

    if (!normalized.ok) {
      setMessage(normalized.warnings, "error");
      return false;
    }

    if (normalized.warnings.length > 0) {
      setMessage(normalized.warnings, "warning");
      return true;
    }

    setMessage(["Ready to save."], "neutral");
    return true;
  }

  async function loadSettings() {
    currentSettings = await NewTabSettings.load();
    targetUrlInput.value = currentSettings.targetUrl;
    NewTabSettings.applyBlankTheme(
      currentSettings.blankTheme,
      currentSettings.customBackgroundEnabled,
      currentSettings.customBackgroundColor
    );
    showUrlFeedback();
  }

  async function saveSettings(event) {
    event.preventDefault();

    const normalized = NewTabSettings.normalizeUrl(targetUrlInput.value);

    if (!normalized.ok) {
      setMessage(normalized.warnings, "error");
      return;
    }

    currentSettings = await NewTabSettings.save({
      ...currentSettings,
      targetUrl: normalized.url
    });
    targetUrlInput.value = currentSettings.targetUrl;

    const lines = ["Saved."].concat(normalized.warnings);
    setMessage(lines, normalized.warnings.length > 0 ? "warning" : "success");
  }

  async function resetSettings() {
    currentSettings = await NewTabSettings.reset();
    targetUrlInput.value = currentSettings.targetUrl;
    NewTabSettings.applyBlankTheme(
      currentSettings.blankTheme,
      currentSettings.customBackgroundEnabled,
      currentSettings.customBackgroundColor
    );
    setMessage(["Reset to about:blank."], "success");
  }

  function openOptions() {
    chrome.runtime.openOptionsPage();
  }

  targetUrlInput.addEventListener("input", showUrlFeedback);
  form.addEventListener("submit", saveSettings);
  optionsButton.addEventListener("click", openOptions);
  resetButton.addEventListener("click", resetSettings);

  loadSettings().catch((error) => {
    setMessage([error && error.message ? error.message : "Could not load settings."], "error");
  });
})();
