import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyUrl,
  normalizeSettings,
  normalizeUrl
} from "../../src/features/new-tab-settings/core/settings.js";
import { localizedUrlMessages } from "../../src/features/new-tab-settings/ui/copy.js";
import { loadSettings } from "../../src/platform/chrome/storage.js";
import { applyBlankTheme } from "../../src/platform/dom/theme.js";

function installStorageFixture() {
  const storage = {
    local: {},
    sync: {}
  };

  globalThis.chrome = {
    runtime: { id: "extension-id" },
    storage: {
      local: {
        get: async (keys) => Object.fromEntries(keys.map((key) => [key, storage.local[key]]).filter((entry) => entry[1] !== undefined)),
        set: async (values) => {
          Object.assign(storage.local, values);
        },
        remove: async (keys) => {
          for (const key of keys) delete storage.local[key];
        }
      },
      sync: {
        get: async (keys) => Object.fromEntries(keys.map((key) => [key, storage.sync[key]]).filter((entry) => entry[1] !== undefined)),
        set: async (values) => {
          Object.assign(storage.sync, values);
        },
        remove: async (keys) => {
          for (const key of keys) delete storage.sync[key];
        }
      }
    }
  };

  return storage;
}

test.afterEach(() => {
  delete globalThis.chrome;
});

test("normalizes bare domains to https URLs", () => {
  const result = normalizeUrl("example.com/path");

  assert.equal(result.ok, true);
  assert.equal(result.url, "https://example.com/path");
  assert.match(result.warnings.join(" "), /Added https/);
});

test("normalizes empty URLs to the Chrome default new tab page", () => {
  const result = normalizeUrl("");

  assert.equal(result.ok, true);
  assert.equal(result.url, "chrome://new-tab-page/");
  assert.equal(result.warnings.length, 0);
});

test("normalizes Windows paths to file URLs", () => {
  const result = normalizeUrl("C:\\Users\\me\\start.html");

  assert.equal(result.ok, true);
  assert.equal(result.url, "file:///C:/Users/me/start.html");
  assert.match(result.warnings.join(" "), /Local files require/);
});

test("normalizes URLs with localized warning messages", () => {
  globalThis.chrome = {
    i18n: {
      getMessage(name) {
        return {
          addedHttps: "localized https warning"
        }[name] || "";
      }
    }
  };

  const result = normalizeUrl("example.com/path", localizedUrlMessages());

  assert.equal(result.ok, true);
  assert.equal(result.warnings[0], "localized https warning");
});

test("classifies browser and extension URLs", () => {
  assert.equal(classifyUrl("about:blank"), "blank");
  assert.equal(classifyUrl("chrome://apps"), "browser-internal");
  assert.equal(classifyUrl("chrome-extension://abc/page.html"), "extension-page");
});

test("normalizes settings to supported values", () => {
  const normalized = normalizeSettings({
    targetUrl: "localhost:3000",
    focusMode: "weird",
    blankTheme: "neon",
    customBackgroundEnabled: true,
    customBackgroundColor: "red",
    syncEnabled: 1
  });

  assert.equal(normalized.targetUrl, "http://localhost:3000/");
  assert.equal(normalized.focusMode, "address-bar");
  assert.equal(normalized.blankTheme, "system");
  assert.equal(normalized.customBackgroundEnabled, true);
  assert.equal(normalized.customBackgroundColor, "#0d1117");
  assert.equal(normalized.syncEnabled, true);
});

test("applies custom background color", () => {
  const style = new Map();
  const documentFixture = {
    documentElement: {
      dataset: {},
      style: {
        setProperty(name, value) {
          style.set(name, value);
        },
        removeProperty(name) {
          style.delete(name);
        }
      }
    }
  };

  applyBlankTheme(documentFixture, "dark", true, "#112233");

  assert.equal(documentFixture.documentElement.dataset.blankTheme, "dark");
  assert.equal(documentFixture.documentElement.dataset.customBg, "true");
  assert.equal(style.get("--custom-bg"), "#112233");
});

test("loads synced settings in a fresh local profile", async () => {
  const storage = installStorageFixture();

  storage.sync = {
    targetUrl: "https://example.com/",
    focusMode: "address-bar",
    blankTheme: "dark",
    customBackgroundEnabled: true,
    customBackgroundColor: "#123456",
    syncEnabled: true
  };

  const loaded = await loadSettings();

  assert.equal(loaded.targetUrl, "https://example.com/");
  assert.equal(loaded.focusMode, "address-bar");
  assert.equal(loaded.syncEnabled, true);
  assert.equal(storage.local.targetUrl, "https://example.com/");
});
