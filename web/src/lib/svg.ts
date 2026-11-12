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

/**
 * Drawings exported from Illustrator keep their colours in a <style> block
 * (`.st0 { fill: #fff }`). Once the drawing is inlined in a page, the page's
 * Content-Security-Policy blocks that block, so the shapes would lose their
 * fills and strokes. Copy each class rule onto the shapes as a style
 * attribute instead (allowed by the policy) and drop the <style> element.
 * Rules are applied in source order and existing inline styles still win,
 * which is the same cascade the browser would have used.
 */
function inlineClassStyles(markup: string, id: string): string {
  if (!markup.includes("<style")) return markup;
  const dom = new JSDOM(markup, { contentType: "image/svg+xml" });
  const doc = dom.window.document;
  const rules: { cls: string; decls: string }[] = [];
  for (const style of Array.from(doc.querySelectorAll("style"))) {
    const css = (style.textContent ?? "").replace(/\/\*[\s\S]*?\*\//g, "");
    for (const [, selectors, decls] of css.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      for (const sel of selectors.split(",").map((s) => s.trim())) {
        if (/^\.[\w-]+$/.test(sel))
          rules.push({ cls: sel.slice(1), decls: decls.trim() });
        else console.warn(`[svg] ${id}: unsupported selector "${sel}" ignored`);
      }
    }
    style.remove();
  }
  for (const el of Array.from(doc.querySelectorAll("[class]"))) {
    const decls = rules
      .filter((r) => el.classList.contains(r.cls))
      .map((r) => r.decls.replace(/;?$/, ";"));
    if (!decls.length) continue;
    el.setAttribute("style", decls.join("") + (el.getAttribute("style") ?? ""));
  }
  return new dom.window.XMLSerializer().serializeToString(doc.documentElement);
}

export async function sanitizedSvg(id: string): Promise<string> {
  if (!isValidSvgId(id)) throw new Error(`Invalid SVG asset id: ${id}`);
  const res = await fetch(`${ORIGIN}${id}.svg`);
  if (!res.ok) throw new Error(`SVG ${id}: HTTP ${res.status}`);
  const raw = await res.text();
  const clean = purify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ["foreignObject", "script", "a", "use", "image"],
    FORBID_ATTR: ["href", "xlink:href"],
  });
  return inlineClassStyles(clean, id);
}
