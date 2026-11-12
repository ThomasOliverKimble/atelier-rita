export const locales = ["fr", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "fr";

const strings = {
  fr: {
    label: "Fr",
    ogLang: "fr_FR",
    text: "En savoir plus",
    name: "Nom",
    type: "Type",
    programme: "Programme",
    location: "Lieu",
    client: "Client",
    numbers: "Chiffres",
    team: "Équipe",
    city: "Ville",
    year: "Année",
    nextProject: "Projet suivant",
    home: "Rita accueil",
    close: "Fermer",
    previous: "Image précédente",
    next: "Image suivante",
  },
  en: {
    label: "En",
    ogLang: "en_GB",
    text: "Read more",
    name: "Name",
    type: "Type",
    programme: "Program",
    location: "Location",
    client: "Client",
    numbers: "Numbers",
    team: "Team",
    city: "City",
    year: "Year",
    nextProject: "Next project",
    home: "Rita home",
    close: "Close",
    previous: "Previous image",
    next: "Next image",
  },
} as const;

export type StringKey = keyof (typeof strings)["fr"];

export const t = (locale: Locale, key: StringKey): string =>
  strings[locale][key];

/** A Sanity locale object (`{ fr, en }`), falling back to French like the old site. */
export type Localized<T> = { fr?: T | null; en?: T | null } | null | undefined;

export function localize<T>(
  locale: Locale,
  field: Localized<T>,
): T | undefined {
  if (!field) return undefined;
  return (field[locale] || field.fr) ?? undefined;
}

/** Prefix an internal path for the given locale (`/projects` -> `/en/projects`). */
export function localePath(locale: Locale, path: string): string {
  if (locale === defaultLocale) return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

/** The same page in the other language. */
export function alternatePath(locale: Locale, pathname: string): string {
  const bare = pathname.replace(/^\/en(?=\/|$)/, "") || "/";
  return localePath(locale, bare);
}
