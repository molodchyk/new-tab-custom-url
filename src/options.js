(function () {
  "use strict";

  const form = document.getElementById("options-form");
  const targetUrlInput = document.getElementById("target-url");
  const blankThemeSelect = document.getElementById("blank-theme");
  const customBackgroundEnabledInput = document.getElementById("custom-background-enabled");
  const customBackgroundColorInput = document.getElementById("custom-background-color");
  const syncEnabledInput = document.getElementById("sync-enabled");
  const fileAccessStatus = document.getElementById("file-access-status");
  const incognitoAccessStatus = document.getElementById("incognito-access-status");
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
        customBackgroundEnabled: customBackgroundEnabledInput.checked,
        customBackgroundColor: customBackgroundColorInput.value,
        syncEnabled: syncEnabledInput.checked
      }
    };
  }

  function applyCurrentTheme() {
    NewTabSettings.applyBlankTheme(
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

    setMessage(["Ready to save."], "neutral");
    return true;
  }

  async function loadSettings() {
    const settings = await NewTabSettings.load();
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

  async function saveSettings(event) {
    event.preventDefault();

    const { normalized, settings } = readForm();

    if (!normalized.ok) {
      setMessage(normalized.warnings, "error");
      return;
    }

    await NewTabSettings.save(settings);
    targetUrlInput.value = settings.targetUrl;
    applyCurrentTheme();

    const lines = ["Saved."].concat(normalized.warnings);
    setMessage(lines, normalized.warnings.length > 0 ? "warning" : "success");
  }

  async function resetSettings() {
    const settings = await NewTabSettings.reset();
    targetUrlInput.value = settings.targetUrl;
    blankThemeSelect.value = settings.blankTheme;
    customBackgroundEnabledInput.checked = settings.customBackgroundEnabled;
    customBackgroundColorInput.value = settings.customBackgroundColor;
    syncEnabledInput.checked = settings.syncEnabled;
    setFocusMode(settings.focusMode);
    applyCurrentTheme();
    setMessage(["Reset to about:blank."], "success");
    refreshAccessStatus();
  }

  function openDetails() {
    if (chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: NewTabSettings.extensionDetailsUrl() });
      return;
    }

    window.open(NewTabSettings.extensionDetailsUrl(), "_blank", "noopener");
  }

  async function refreshAccessStatus() {
    const fileAccessAllowed = await NewTabSettings.isFileAccessAllowed();
    const incognitoAllowed = await NewTabSettings.isIncognitoAccessAllowed();

    fileAccessStatus.textContent = fileAccessAllowed
      ? "File URLs: allowed"
      : "File URLs: off. Enable in Extension Details for local files.";
    fileAccessStatus.dataset.state = fileAccessAllowed ? "ok" : "warn";

    incognitoAccessStatus.textContent = incognitoAllowed
      ? "Incognito: allowed"
      : "Incognito: off. Enable in Extension Details for private windows.";
    incognitoAccessStatus.dataset.state = incognitoAllowed ? "ok" : "warn";
  }

  targetUrlInput.addEventListener("input", showUrlFeedback);
  blankThemeSelect.addEventListener("change", applyCurrentTheme);
  customBackgroundEnabledInput.addEventListener("change", applyCurrentTheme);
  customBackgroundColorInput.addEventListener("input", applyCurrentTheme);
  form.addEventListener("submit", saveSettings);
  resetButton.addEventListener("click", resetSettings);
  detailsButton.addEventListener("click", openDetails);

  loadSettings().catch((error) => {
    setMessage([error && error.message ? error.message : "Could not load settings."], "error");
  });
})();
