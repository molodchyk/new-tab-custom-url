export function message(name, substitutions) {
  const i18n = globalThis.chrome?.i18n;

  if (!i18n?.getMessage) {
    return "";
  }

  return i18n.getMessage(name, substitutions);
}

export function messageOrDefault(name, fallback, substitutions) {
  return message(name, substitutions) || fallback;
}

export function localizeDocument(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((element) => {
    const localized = message(element.dataset.i18n);
    if (localized) element.textContent = localized;
  });

  root.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const localized = message(element.dataset.i18nPlaceholder);
    if (localized) element.setAttribute("placeholder", localized);
  });

  root.querySelectorAll("[data-i18n-title]").forEach((element) => {
    const localized = message(element.dataset.i18nTitle);
    if (localized) element.textContent = localized;
  });
}
