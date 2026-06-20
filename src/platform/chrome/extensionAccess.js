export async function isFileAccessAllowed() {
  const extensionApi = globalThis.chrome?.extension;

  if (!extensionApi?.isAllowedFileSchemeAccess) {
    return false;
  }

  return new Promise((resolve) => {
    extensionApi.isAllowedFileSchemeAccess(resolve);
  });
}

export function extensionDetailsUrl() {
  return `chrome://extensions/?id=${globalThis.chrome?.runtime?.id || ""}`;
}
