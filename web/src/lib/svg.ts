import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";
import { dataset, projectId } from "./sanity";

// Replaces the old /api/svg-proxy. SVGs are fetched once at build time,
// only from this project's own dataset, sanitized, and emitted as static
// same-origin files the cards fetch lazily.

const ORIGIN = `https://cdn.sanity.io/images/${projectId}/${dataset}/`;
const ID = /^[a-f0-9]{40}-\d+x\d+$/;

export const isValidSvgId = (id: string) => ID.test(id);

const { window } = new JSDOM("");
const purify = createDOMPurify(window);

export async function sanitizedSvg(id: string): Promise<string> {
  if (!isValidSvgId(id)) throw new Error(`Invalid SVG asset id: ${id}`);
  const res = await fetch(`${ORIGIN}${id}.svg`);
  if (!res.ok) throw new Error(`SVG ${id}: HTTP ${res.status}`);
  const raw = await res.text();
  return purify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["foreignObject", "script", "a", "use", "image"],
    FORBID_ATTR: ["href", "xlink:href"],
  });
}
