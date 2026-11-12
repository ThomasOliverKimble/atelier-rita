import { localePath, type Locale } from "./i18n";

type Linkable = { _type?: string | null; slug?: string | null } | null | undefined;

/** Path of a Sanity document (same rules as the old _linkResolver). */
export function linkHref(node: Linkable): string {
  if (!node?._type || node._type === "home") return "/";
  if (node._type === "project") return `/project/${node.slug}`;
  return `/${node.slug}`;
}

export const localizedHref = (locale: Locale, node: Linkable) => localePath(locale, linkHref(node));

/** Editors sometimes paste absolute links to this site: keep them on-site and localized. */
export function siteLink(locale: Locale, href: string | null | undefined): string {
  if (!href) return "";
  const m = href.match(/^https?:\/\/(?:www\.)?atelierrita\.org(\/[^?#]*)?/i);
  return m ? localePath(locale, m[1] || "/") : href;
}
