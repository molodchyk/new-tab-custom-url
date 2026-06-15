import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";

async function loadSettingsModule() {
  const source = await readFile(path.join(process.cwd(), "src/settings.js"), "utf8");
  const style = new Map();
  const context = {
    URL,
    chrome: {
      runtime: { id: "extension-id" },
      storage: {
        local: {},
        sync: {}
      }
    },
    document: {
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
    },
    window: {}
  };

  vm.runInNewContext(source, context, { filename: "settings.js" });
  return { settings: context.window.NewTabSettings, document: context.document, style };
}

test("normalizes bare domains to https URLs", async () => {
  const { settings } = await loadSettingsModule();
  const result = settings.normalizeUrl("example.com/path");

  assert.equal(result.ok, true);
  assert.equal(result.url, "https://example.com/path");
  assert.match(result.warnings.join(" "), /Added https/);
});

test("normalizes Windows paths to file URLs", async () => {
  const { settings } = await loadSettingsModule();
  const result = settings.normalizeUrl("C:\\Users\\me\\start.html");

  assert.equal(result.ok, true);
  assert.equal(result.url, "file:///C:/Users/me/start.html");
  assert.match(result.warnings.join(" "), /Local files require/);
});

test("classifies browser and extension URLs", async () => {
  const { settings } = await loadSettingsModule();

  assert.equal(settings.classifyUrl("about:blank"), "blank");
  assert.equal(settings.classifyUrl("chrome://apps"), "browser-internal");
  assert.equal(settings.classifyUrl("chrome-extension://abc/page.html"), "extension-page");
});

test("normalizes settings to supported values", async () => {
  const { settings } = await loadSettingsModule();
  const normalized = settings.normalizeSettings({
    targetUrl: "localhost:3000",
    focusMode: "weird",
    blankTheme: "neon",
    customBackgroundEnabled: true,
    customBackgroundColor: "red",
    syncEnabled: 1
  });

  assert.equal(normalized.targetUrl, "http://localhost:3000/");
  assert.equal(normalized.focusMode, "page");
  assert.equal(normalized.blankTheme, "system");
  assert.equal(normalized.customBackgroundEnabled, true);
  assert.equal(normalized.customBackgroundColor, "#0d1117");
  assert.equal(normalized.syncEnabled, true);
});

test("applies custom background color", async () => {
  const { settings, document, style } = await loadSettingsModule();

  settings.applyBlankTheme("dark", true, "#112233");

  assert.equal(document.documentElement.dataset.blankTheme, "dark");
  assert.equal(document.documentElement.dataset.customBg, "true");
  assert.equal(style.get("--custom-bg"), "#112233");
});
