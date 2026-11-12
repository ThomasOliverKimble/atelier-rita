import {
  createClient,
  type QueryParams,
  type SanityClient,
} from "@sanity/client";

export const projectId = "ra5yjexn";
export const dataset = "production";
export const apiVersion = "2025-01-01";
export const studioUrl = "https://backoffice--rita.sanity.studio";

// Server-only. Needed for builds once the dataset is private, and for drafts
// on the preview deployment. Never exposed to the browser (no PUBLIC_ prefix).
const token = process.env.SANITY_READ_TOKEN || import.meta.env.SANITY_READ_TOKEN;

const published = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: !token,
  perspective: "published",
});

let drafts: SanityClient | undefined;
function draftClient(): SanityClient {
  if (!token)
    throw new Error("SANITY_READ_TOKEN is required to preview drafts");
  drafts ??= published.withConfig({
    useCdn: false,
    perspective: "drafts",
    stega: { enabled: true, studioUrl },
  });
  return drafts;
}

// A static build renders every page in one process: memoise identical
// queries (settings, the project list) so each runs once per build.
const cache = new Map<string, Promise<unknown>>();

export function fetchQuery<T>(
  query: string,
  params: QueryParams = {},
  draft = false,
): Promise<T> {
  if (draft) return draftClient().fetch<T>(query, params);
  const key = query + JSON.stringify(params);
  let hit = cache.get(key) as Promise<T> | undefined;
  if (!hit) {
    hit = published.fetch<T>(query, params);
    cache.set(key, hit);
  }
  return hit;
}
