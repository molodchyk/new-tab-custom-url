(function () {
  "use strict";

  const form = document.getElementById("options-form");
  const targetUrlInput = document.getElementById("target-url");
  const blankThemeSelect = document.getElementById("blank-theme");
  const syncEnabledInput = document.getElementById("sync-enabled");
  const messages = document.getElementById("messages");
  const resetButton = document.getElementById("reset");
  const detailsButton = document.getElementById("details");

  function setMessage(lines, tone) {
    messages.replaceChildren();
    messages.dataset.tone = tone || "neutral";

    for (const line of lines) {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      messages.append(paragraph);
    }
  }

  function selectedFocusMode() {
    const selected = form.querySelector('input[name="focusMode"]:checked');
    return selected ? selected.value : NewTabSettings.DEFAULTS.focusMode;
  }

  function setFocusMode(value) {
    const input = form.querySelector(`input[name="focusMode"][value="${value}"]`);
    if (input) input.checked = true;
  }

  function readForm() {
    const normalized = NewTabSettings.normalizeUrl(targetUrlInput.value);

    return {
      normalized,
      settings: {
        targetUrl: normalized.url,
        focusMode: selectedFocusMode(),
        blankTheme: blankThemeSelect.value,
        syncEnabled: syncEnabledInput.checked
      }
    };
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

    setMessage(["Ready to save."], "neutral");
    return true;
  }

  async function loadSettings() {
    const settings = await NewTabSettings.load();
    targetUrlInput.value = settings.targetUrl;
    blankThemeSelect.value = settings.blankTheme;
    syncEnabledInput.checked = settings.syncEnabled;
    setFocusMode(settings.focusMode);
    NewTabSettings.applyBlankTheme(settings.blankTheme);
    showUrlFeedback();
  }

  async function saveSettings(event) {
    event.preventDefault();

    const { normalized, settings } = readForm();

    if (!normalized.ok) {
      setMessage(normalized.warnings, "error");
      return;
    }

    await NewTabSettings.save(settings);
    targetUrlInput.value = settings.targetUrl;
    NewTabSettings.applyBlankTheme(settings.blankTheme);

    const lines = ["Saved."].concat(normalized.warnings);
    setMessage(lines, normalized.warnings.length > 0 ? "warning" : "success");
  }

  async function resetSettings() {
    const settings = await NewTabSettings.reset();
    targetUrlInput.value = settings.targetUrl;
    blankThemeSelect.value = settings.blankTheme;
    syncEnabledInput.checked = settings.syncEnabled;
    setFocusMode(settings.focusMode);
    NewTabSettings.applyBlankTheme(settings.blankTheme);
    setMessage(["Reset to about:blank."], "success");
  }

  function openDetails() {
    chrome.tabs.create({ url: NewTabSettings.extensionDetailsUrl() });
  }

  targetUrlInput.addEventListener("input", showUrlFeedback);
  blankThemeSelect.addEventListener("change", () => NewTabSettings.applyBlankTheme(blankThemeSelect.value));
  form.addEventListener("submit", saveSettings);
  resetButton.addEventListener("click", resetSettings);
  detailsButton.addEventListener("click", openDetails);

  loadSettings().catch((error) => {
    setMessage([error && error.message ? error.message : "Could not load settings."], "error");
  });
})();

