import { defineQuery } from "groq";
import { fetchQuery } from "./sanity";
import type {
  ATELIER_QUERY_RESULT,
  HOME_QUERY_RESULT,
  PROJECT_QUERY_RESULT,
  PROJECT_SLUGS_QUERY_RESULT,
  PROJECTS_QUERY_RESULT,
  SETTINGS_QUERY_RESULT,
} from "./sanity.types";

// Fragments project only what the templates render. Never `asset->{...}`:
// that would publish original file names, hashes and upload metadata.
//
// Typegen needs every fragment written out literally inside defineQuery,
// so they are interpolated as plain strings.

const IMAGE = `{
  "url": asset->url,
  "ext": asset->extension,
  "w": asset->metadata.dimensions.width,
  "h": asset->metadata.dimensions.height,
  "lqip": asset->metadata.lqip,
  crop,
  hotspot,
  alt,
  caption
}`;

const LINK = `{ _type, "slug": slug.current }`;

const BLOCKS = `[]{
  ...,
  markDefs[]{
    ...,
    _type == "linkInternal" => { "link": link->${LINK} }
  }
}`;

const LOCALE_BLOCKS = `{ "fr": fr${BLOCKS}, "en": en${BLOCKS} }`;

const SEO = `seo{ metaTitle, metaDescription, "image": metaImage.asset->url }`;

const PROJECT_ROW = `{
  _id,
  "slug": slug.current,
  title,
  type,
  programme,
  year,
  city,
  zip,
  numbers,
  client,
  "cover": imageCover${IMAGE}
}`;

export const SETTINGS_QUERY = defineQuery(`*[_type == "settings"][0]{
  siteName,
  "colors": colors[]{ hex, "rgb": [rgb.r, rgb.g, rgb.b] },
  siteDescriptions,
  navPrimary[]{ _key, _type, label, "link": link->${LINK} }
}`);

export const HOME_QUERY = defineQuery(`*[_type == "home"][0]{
  title,
  ${SEO},
  items[]{
    _key,
    "image": image${IMAGE},
    link,
    "project": project->{ "slug": slug.current, title, type, year, city, client }
  },
  news[]{ _key, title, date, "text": text${LOCALE_BLOCKS}, link }
}`);

export const PROJECTS_QUERY = defineQuery(`*[_type == "projects"][0]{
  title,
  ${SEO},
  "items": items[]->${PROJECT_ROW}
}`);

export const PROJECT_SLUGS_QUERY = defineQuery(
  `*[_type == "project" && defined(slug.current)].slug.current`,
);

export const PROJECT_QUERY =
  defineQuery(`*[_type == "project" && slug.current == $slug][0]{
  _id,
  "slug": slug.current,
  title,
  type,
  programme,
  year,
  city,
  zip,
  numbers,
  client,
  team,
  ${SEO},
  "text": text${LOCALE_BLOCKS},
  metas[]{ _key, key, "value": value${LOCALE_BLOCKS} },
  images[]${IMAGE}
}`);

export const ATELIER_QUERY = defineQuery(`*[_type == "atelier"][0]{
  title,
  ${SEO},
  images[]${IMAGE},
  items[]{ _key, key, "value": value${LOCALE_BLOCKS} }
}`);

export const getSettings = (draft = false) =>
  fetchQuery<SETTINGS_QUERY_RESULT>(SETTINGS_QUERY, {}, draft);
export const getHome = (draft = false) =>
  fetchQuery<HOME_QUERY_RESULT>(HOME_QUERY, {}, draft);
export const getProjects = (draft = false) =>
  fetchQuery<PROJECTS_QUERY_RESULT>(PROJECTS_QUERY, {}, draft);
export const getProjectSlugs = () =>
  fetchQuery<PROJECT_SLUGS_QUERY_RESULT>(PROJECT_SLUGS_QUERY);
export const getProject = (slug: string, draft = false) =>
  fetchQuery<PROJECT_QUERY_RESULT>(PROJECT_QUERY, { slug }, draft);
export const getAtelier = (draft = false) =>
  fetchQuery<ATELIER_QUERY_RESULT>(ATELIER_QUERY, {}, draft);

export type HomeItem = NonNullable<
  NonNullable<HOME_QUERY_RESULT>["items"]
>[number];
export type ProjectRow = NonNullable<
  NonNullable<PROJECTS_QUERY_RESULT>["items"]
>[number];
export type Project = NonNullable<PROJECT_QUERY_RESULT>;
export type Settings = NonNullable<SETTINGS_QUERY_RESULT>;
