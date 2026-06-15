import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const manifestPath = path.join(root, "manifest.json");
const sourceFiles = [
  "src/settings.js",
  "src/newtab.js",
  "src/options.js",
  "src/popup.js"
];
const htmlFiles = [
  "src/newtab.html",
  "src/options.html",
  "src/popup.html"
];
const iconFiles = [
  "assets/icon-16.png",
  "assets/icon-32.png",
  "assets/icon-48.png",
  "assets/icon-128.png"
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function assertExists(relativePath) {
  if (!existsSync(path.join(root, relativePath))) {
    fail(`Missing required file: ${relativePath}`);
  }
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

if (manifest.manifest_version !== 3) {
  fail("manifest_version must be 3.");
}

if (manifest.name !== "New Tab: Custom URL") {
  fail("Manifest name must stay aligned with the chosen extension name.");
}

const permissions = manifest.permissions || [];
const unexpectedPermissions = permissions.filter((permission) => permission !== "storage");

if (unexpectedPermissions.length > 0) {
  fail(`Unexpected permissions: ${unexpectedPermissions.join(", ")}`);
}

if (manifest.host_permissions && manifest.host_permissions.length > 0) {
  fail("Host permissions should not be requested.");
}

if (manifest.background) {
  fail("Background scripts are out of scope unless a concrete feature requires one.");
}

if (manifest.content_scripts && manifest.content_scripts.length > 0) {
  fail("Content scripts are out of scope for this utility.");
}

const newTabPath = manifest.chrome_url_overrides?.newtab;

if (!newTabPath) {
  fail("Missing chrome_url_overrides.newtab.");
} else {
  assertExists(newTabPath);
}

if (manifest.options_page) {
  assertExists(manifest.options_page);
}

if (!manifest.action?.default_popup) {
  fail("Toolbar action must expose the settings popup.");
} else {
  assertExists(manifest.action.default_popup);
}

for (const relativePath of iconFiles) {
  assertExists(relativePath);
}

for (const relativePath of sourceFiles) {
  assertExists(relativePath);
  const source = await readFile(path.join(root, relativePath), "utf8");
  const suspiciousRemotePattern = /\b(fetch|XMLHttpRequest|navigator\.sendBeacon|WebSocket|EventSource|importScripts)\b/;

  if (suspiciousRemotePattern.test(source)) {
    fail(`Potential remote call API found in ${relativePath}.`);
  }
}

for (const relativePath of htmlFiles) {
  assertExists(relativePath);
  const source = await readFile(path.join(root, relativePath), "utf8");
  const remoteAssetPattern = /<(script|link|img|iframe)\b[^>]+(?:src|href)=["']https?:\/\//i;

  if (remoteAssetPattern.test(source)) {
    fail(`Remote asset reference found in ${relativePath}.`);
  }
}

if (failures.length > 0) {
  console.error("Validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Extension validation passed.");
