export function openTab(url) {
  if (globalThis.chrome?.tabs?.create) {
    globalThis.chrome.tabs.create({ url });
    return;
  }

  globalThis.window?.open?.(url, "_blank", "noopener");
}

export function openOptionsPage() {
  globalThis.chrome?.runtime?.openOptionsPage?.();
}

export function navigateCurrentTabOrReplace(url) {
  if (!globalThis.chrome?.tabs?.getCurrent || !globalThis.chrome?.tabs?.update) {
    globalThis.window.location.replace(url);
    return;
  }

  globalThis.chrome.tabs.getCurrent((tab) => {
    if (globalThis.chrome.runtime.lastError || !tab || typeof tab.id !== "number") {
      globalThis.window.location.replace(url);
      return;
    }

    globalThis.chrome.tabs.update(tab.id, { url }, () => {
      if (globalThis.chrome.runtime.lastError) {
        globalThis.window.location.replace(url);
      }
    });
  });
}
