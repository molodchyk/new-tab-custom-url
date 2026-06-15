(function () {
  "use strict";

  const statusPanel = document.getElementById("status");
  const statusTitle = document.getElementById("status-title");
  const statusMessage = document.getElementById("status-message");
  const openOptionsButton = document.getElementById("open-options");
  const openDetailsButton = document.getElementById("open-details");

  function showStatus(title, message) {
    statusTitle.textContent = title;
    statusMessage.textContent = message;
    statusPanel.hidden = false;
  }

  function openExtensionOptions() {
    chrome.runtime.openOptionsPage();
  }

  function openExtensionDetails() {
    if (chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: NewTabSettings.extensionDetailsUrl() });
      return;
    }

    window.open(NewTabSettings.extensionDetailsUrl(), "_blank", "noopener");
  }

  function navigateWithTabUpdate(url) {
    if (!chrome.tabs || !chrome.tabs.getCurrent || !chrome.tabs.update) {
      window.location.replace(url);
      return;
    }

    chrome.tabs.getCurrent((tab) => {
      if (chrome.runtime.lastError || !tab || typeof tab.id !== "number") {
        window.location.replace(url);
        return;
      }

      chrome.tabs.update(tab.id, { url }, () => {
        if (chrome.runtime.lastError) {
          window.location.replace(url);
        }
      });
    });
  }

  function navigate(url, focusMode) {
    const kind = NewTabSettings.classifyUrl(url);
    const shouldUseTabUpdate = focusMode === "address-bar" || kind === "browser-internal";

    if (shouldUseTabUpdate) {
      navigateWithTabUpdate(url);
      return;
    }

    window.location.replace(url);
  }

  async function boot() {
    openOptionsButton.addEventListener("click", openExtensionOptions);
    openDetailsButton.addEventListener("click", openExtensionDetails);

    const settings = await NewTabSettings.load();
    NewTabSettings.applyBlankTheme(
      settings.blankTheme,
      settings.customBackgroundEnabled,
      settings.customBackgroundColor
    );

    const normalized = NewTabSettings.normalizeUrl(settings.targetUrl);

    if (!normalized.ok) {
      showStatus("Invalid URL", normalized.warnings[0]);
      return;
    }

    const url = normalized.url;
    const kind = NewTabSettings.classifyUrl(url);

    if (kind === "blank") {
      document.body.classList.add("blank");
      return;
    }

    if (kind === "local-file" && !(await NewTabSettings.isFileAccessAllowed())) {
      showStatus(
        "Local File Access Is Off",
        "Enable Allow access to file URLs in this extension's Chrome details page, then open a new tab again."
      );
      return;
    }

    navigate(url, settings.focusMode);
  }

  boot().catch((error) => {
    showStatus("New Tab Error", error && error.message ? error.message : "The configured page could not be opened.");
  });
})();
