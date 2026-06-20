import { DEFAULTS, normalizeSettings } from "../../features/new-tab-settings/core/settings.js";

const SETTING_KEYS = Object.keys(DEFAULTS);

function storageArea(name) {
  const area = globalThis.chrome?.storage?.[name];

  if (!area) {
    throw new Error(`Chrome ${name} storage is unavailable.`);
  }

  return area;
}

async function getFrom(areaName) {
  return storageArea(areaName).get(SETTING_KEYS);
}

export async function loadSettings() {
  const local = await getFrom("local");
  let synced = {};

  try {
    synced = await getFrom("sync");
  } catch (_error) {
    synced = {};
  }

  const syncEnabled = Boolean(local.syncEnabled || synced.syncEnabled);

  if (!syncEnabled) {
    return normalizeSettings({ ...DEFAULTS, ...local, syncEnabled: false });
  }

  const normalized = normalizeSettings({ ...DEFAULTS, ...local, ...synced, syncEnabled: true });

  try {
    const writeBack = storageArea("local").set(normalized);
    if (writeBack && typeof writeBack.catch === "function") {
      writeBack.catch(() => {});
    }
  } catch (_error) {
    // Loading should not fail just because the local cache could not be refreshed.
  }

  return normalized;
}

export async function saveSettings(nextSettings) {
  const normalized = normalizeSettings(nextSettings);
  const localMirror = { ...normalized };

  await storageArea("local").set(localMirror);

  if (normalized.syncEnabled) {
    await storageArea("sync").set(normalized);
  } else {
    await storageArea("sync").remove(SETTING_KEYS);
  }

  return normalized;
}

export async function resetSettings() {
  await storageArea("local").remove(SETTING_KEYS);
  await storageArea("sync").remove(SETTING_KEYS);
  return { ...DEFAULTS };
}
