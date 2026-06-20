import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const manifestPath = path.join(root, "manifest.json");
const packagePath = path.join(root, "package.json");
const defaultLocalePath = path.join(root, "_locales/en/messages.json");
const distPath = path.join(root, "dist");
const iconFiles = [
  "assets/icon-16.png",
  "assets/icon-32.png",
  "assets/icon-48.png",
  "assets/icon-128.png"
];
const storePilotFiles = [
  "_locales/en/messages.json",
  "store-listing/chrome-web-store/listing/en.md",
  "store-listing/chrome-web-store/media/icon-128.png",
  "store-listing/chrome-web-store/media/promo/small-promo.png",
  "store-listing/chrome-web-store/media/promo/marquee-promo.png",
  "docs/chrome-web-store-category.md",
  "docs/chrome-web-store-additional-fields.md",
  "docs/chrome-web-store-privacy-form.md",
  "docs/code-structure.md",
  "docs/release-notes.md"
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

async function collectFiles(relativePath, extensions) {
  const absolutePath = path.join(root, relativePath);

  if (!existsSync(absolutePath)) return [];

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(relativePath, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(entryPath, extensions);
    }

    return extensions.includes(path.extname(entry.name)) ? [entryPath.replace(/\\/g, "/")] : [];
  }));

  return nested.flat();
}

async function collectDirectories(relativePath) {
  const absolutePath = path.join(root, relativePath);

  if (!existsSync(absolutePath)) return [];

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const childDirectories = entries.filter((entry) => entry.isDirectory());
  const nested = await Promise.all(childDirectories.map((entry) => collectDirectories(path.join(relativePath, entry.name))));

  return [relativePath.replace(/\\/g, "/"), ...nested.flat()];
}

function assertRelativeReferenceExists(fromFile, reference) {
  if (!reference.startsWith(".")) return;

  const target = path.normalize(path.join(path.dirname(fromFile), reference));

  if (!existsSync(path.join(root, target))) {
    fail(`Missing referenced file from ${fromFile}: ${reference}`);
  }
}

async function readPngSize(relativePath) {
  const data = await readFile(path.join(root, relativePath));
  const pngSignature = "89504e470d0a1a0a";

  if (data.subarray(0, 8).toString("hex") !== pngSignature) {
    fail(`Not a PNG file: ${relativePath}`);
    return null;
  }

  return {
    width: data.readUInt32BE(16),
    height: data.readUInt32BE(20)
  };
}

async function assertPngSize(relativePath, expectedSizes) {
  const size = await readPngSize(relativePath);
  if (!size) return;

  const matches = expectedSizes.some((expected) => expected.width === size.width && expected.height === size.height);

  if (!matches) {
    const expectedText = expectedSizes.map((expected) => `${expected.width}x${expected.height}`).join(" or ");
    fail(`Unexpected image size for ${relativePath}: ${size.width}x${size.height}; expected ${expectedText}`);
  }
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const packageMetadata = JSON.parse(await readFile(packagePath, "utf8"));
const defaultLocale = JSON.parse(await readFile(defaultLocalePath, "utf8"));

function assertLocaleMessage(key, context) {
  if (!defaultLocale[key]?.message) {
    fail(`Missing locale message ${key} referenced by ${context}.`);
  }
}

function assertManifestMessageReference(value, fieldName) {
  const match = /^__MSG_([A-Za-z0-9_]+)__$/.exec(value || "");

  if (!match) {
    fail(`Manifest ${fieldName} must use a __MSG_*__ locale reference.`);
    return;
  }

  assertLocaleMessage(match[1], `manifest ${fieldName}`);
}

if (manifest.manifest_version !== 3) {
  fail("manifest_version must be 3.");
}

if (manifest.version !== packageMetadata.version) {
  fail(`Manifest version (${manifest.version}) must match package.json version (${packageMetadata.version}).`);
}

if (manifest.default_locale !== "en") {
  fail("Manifest default_locale must be en when _locales/en/messages.json is present.");
}

assertManifestMessageReference(manifest.name, "name");
assertManifestMessageReference(manifest.short_name, "short_name");
assertManifestMessageReference(manifest.description, "description");
assertManifestMessageReference(manifest.action?.default_title, "action.default_title");

const permissions = manifest.permissions || [];
const unexpectedPermissions = permissions.filter((permission) => permission !== "storage");

if (unexpectedPermissions.length > 0) {
  fail(`Unexpected permissions: ${unexpectedPermissions.join(", ")}`);
}

const hostPermissions = manifest.host_permissions || [];
const expectedHostPermissions = ["file:///*"];
const unexpectedHostPermissions = hostPermissions.filter((permission) => !expectedHostPermissions.includes(permission));
const missingHostPermissions = expectedHostPermissions.filter((permission) => !hostPermissions.includes(permission));

if (unexpectedHostPermissions.length > 0) {
  fail(`Unexpected host permissions: ${unexpectedHostPermissions.join(", ")}`);
}

if (missingHostPermissions.length > 0) {
  fail(`Missing host permissions: ${missingHostPermissions.join(", ")}`);
}

if (manifest.incognito !== "not_allowed") {
  fail("Incognito must stay not_allowed because Chrome cannot override New Tab pages in incognito windows.");
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

for (const relativePath of storePilotFiles) {
  assertExists(relativePath);
}

await assertPngSize("store-listing/chrome-web-store/media/icon-128.png", [{ width: 128, height: 128 }]);
await assertPngSize("store-listing/chrome-web-store/media/promo/small-promo.png", [{ width: 440, height: 280 }]);
await assertPngSize("store-listing/chrome-web-store/media/promo/marquee-promo.png", [{ width: 1400, height: 560 }]);

const sourceFiles = await collectFiles("src", [".js"]);
const htmlFiles = await collectFiles("src", [".html"]);
const cssFiles = await collectFiles("src", [".css"]);
const sourceDirectories = await collectDirectories("src");
const screenshotFiles = await collectFiles("store-listing/chrome-web-store/media/screenshots", [".png", ".jpg", ".jpeg"]);

if (screenshotFiles.length < 1 || screenshotFiles.length > 5) {
  fail(`Chrome Web Store screenshots must include 1 to 5 files; found ${screenshotFiles.length}.`);
}

for (const relativePath of screenshotFiles) {
  if (path.extname(relativePath).toLowerCase() === ".png") {
    await assertPngSize(relativePath, [
      { width: 1280, height: 800 },
      { width: 640, height: 400 }
    ]);
  }
}

for (const relativePath of sourceFiles) {
  assertExists(relativePath);
  const source = await readFile(path.join(root, relativePath), "utf8");
  const suspiciousRemotePattern = /\b(fetch|XMLHttpRequest|navigator\.sendBeacon|WebSocket|EventSource|importScripts)\b/;
  const importPattern = /import\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g;
  const messagePattern = /messageOrDefault\(\s*["']([^"']+)["']/g;
  const lineCount = source.split(/\r?\n/).length;
  const maxLines = /\/app\/[^/]+\/index\.js$/.test(relativePath) ? 150 : 600;

  if (suspiciousRemotePattern.test(source)) {
    fail(`Potential remote call API found in ${relativePath}.`);
  }

  if (lineCount > maxLines) {
    fail(`Source file exceeds ${maxLines} lines: ${relativePath} has ${lineCount}.`);
  }

  for (const match of source.matchAll(importPattern)) {
    assertRelativeReferenceExists(relativePath, match[1]);
  }

  for (const match of source.matchAll(messagePattern)) {
    assertLocaleMessage(match[1], relativePath);
  }
}

for (const relativePath of htmlFiles) {
  assertExists(relativePath);
  const source = await readFile(path.join(root, relativePath), "utf8");
  const remoteAssetPattern = /<(script|link|img|iframe)\b[^>]+(?:src|href)=["']https?:\/\//i;
  const localAssetPattern = /<(script|link|img|iframe)\b[^>]+(?:src|href)=["']([^"']+)["']/gi;
  const dataI18nPattern = /data-i18n(?:-[a-z]+)?=["']([^"']+)["']/g;

  if (remoteAssetPattern.test(source)) {
    fail(`Remote asset reference found in ${relativePath}.`);
  }

  for (const match of source.matchAll(localAssetPattern)) {
    assertRelativeReferenceExists(relativePath, match[1]);
  }

  for (const match of source.matchAll(dataI18nPattern)) {
    assertLocaleMessage(match[1], relativePath);
  }
}

for (const relativePath of cssFiles) {
  const source = await readFile(path.join(root, relativePath), "utf8");
  const importPattern = /@import\s+["']([^"']+)["']/g;
  const lineCount = source.split(/\r?\n/).length;

  if (lineCount > 500) {
    fail(`CSS file exceeds 500 lines: ${relativePath} has ${lineCount}.`);
  }

  for (const match of source.matchAll(importPattern)) {
    assertRelativeReferenceExists(relativePath, match[1]);
  }
}

for (const relativePath of sourceDirectories) {
  const entries = await readdir(path.join(root, relativePath), { withFileTypes: true });
  const directFileCount = entries.filter((entry) => entry.isFile()).length;

  if (directFileCount > 15) {
    fail(`Folder density exceeds 15 direct files: ${relativePath} has ${directFileCount}.`);
  }
}

const privacyForm = await readFile(path.join(root, "docs/chrome-web-store-privacy-form.md"), "utf8");
const releaseNotes = await readFile(path.join(root, "docs/release-notes.md"), "utf8");
const requiredPrivacyKeys = [
  "single_purpose:",
  "permission.storage:",
  "host_permission:",
  "remote_code:",
  "privacy_policy_url:",
  "data_usage.personally_identifiable_information:",
  "data_usage.web_history:",
  "data_usage.website_content:",
  "certification.no_sell_or_transfer:",
  "certification.no_unrelated_use:",
  "certification.no_creditworthiness:"
];

for (const key of requiredPrivacyKeys) {
  if (!privacyForm.includes(key)) {
    fail(`Missing Chrome Web Store privacy key: ${key}`);
  }
}

const releaseHeadings = [...releaseNotes.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1].trim());

if (releaseHeadings[0] !== manifest.version) {
  fail(`Top release-notes section must match manifest version ${manifest.version}.`);
}

if (existsSync(distPath)) {
  const distEntries = await readdir(distPath, { withFileTypes: true });
  const zipFiles = distEntries.filter((entry) => entry.isFile() && entry.name.endsWith(".zip")).map((entry) => entry.name);
  const expectedZip = `new-tab-custom-url-${manifest.version}.zip`;

  if (zipFiles.length > 1 || (zipFiles.length === 1 && zipFiles[0] !== expectedZip)) {
    fail(`dist should contain only the latest package zip (${expectedZip}); found ${zipFiles.join(", ") || "none"}.`);
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
