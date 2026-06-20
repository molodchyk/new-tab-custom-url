import { DEFAULTS, isHexColor } from "../../features/new-tab-settings/core/settings.js";

export function applyBlankTheme(targetDocument, blankTheme, customBackgroundEnabled, customBackgroundColor) {
  const root = targetDocument.documentElement;
  const theme = blankTheme || DEFAULTS.blankTheme;
  root.dataset.blankTheme = theme;

  if (customBackgroundEnabled && isHexColor(customBackgroundColor)) {
    root.dataset.customBg = "true";
    root.style.setProperty("--custom-bg", customBackgroundColor);
    return;
  }

  root.dataset.customBg = "false";
  root.style.removeProperty("--custom-bg");
}
