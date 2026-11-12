// Loads the sanitized same-origin SVG files into [data-svg] slots when they
// near the viewport, then tags each shape so CSS can recolour it
// (_svg-inline.scss): dark fills -> "fill", near-white fills -> "knockout".

const SHAPES = "path, polyline, polygon, rect, circle, ellipse, line";

function isLight(color: string) {
  const [r, g, b] = (color.match(/[\d.]+/g) || []).map(Number);
  if (r === undefined) return false;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.85;
}

function tagPaint(root: Element) {
  const tagged = Array.from(root.querySelectorAll<SVGGraphicsElement>(SHAPES)).map((el) => {
    const cs = getComputedStyle(el);
    const paint: string[] = [];
    if (el.tagName !== "line" && cs.fill !== "none") paint.push(isLight(cs.fill) ? "knockout" : "fill");
    if (cs.stroke !== "none" && parseFloat(cs.strokeWidth) > 0) paint.push("stroke");
    return { el, paint };
  });
  const hasInk = tagged.some(({ paint }) => paint.includes("fill") || paint.includes("stroke"));
  for (const { el, paint } of tagged) {
    const final = hasInk ? paint : paint.map((p) => (p === "knockout" ? "fill" : p));
    if (final.includes("fill") || final.includes("knockout")) el.style.removeProperty("fill");
    if (final.includes("stroke")) el.style.removeProperty("stroke");
    el.dataset.paint = final.join(" ");
  }
}

async function load(slot: HTMLElement) {
  const url = slot.dataset.svg;
  if (!url || slot.dataset.loaded) return;
  slot.dataset.loaded = "";
  const res = await fetch(url);
  if (!res.ok) return;
  // Same-origin file, sanitized with DOMPurify at build time.
  const doc = new DOMParser().parseFromString(await res.text(), "image/svg+xml");
  const svg = doc.documentElement;
  if (svg.nodeName !== "svg") return;
  slot.replaceChildren(document.importNode(svg, true));
  tagPaint(slot);
}

const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      load(e.target as HTMLElement);
    }
  },
  { rootMargin: "200px" },
);

for (const slot of Array.from(document.querySelectorAll<HTMLElement>("[data-svg]"))) {
  if (slot.hasAttribute("data-eager")) load(slot);
  else io.observe(slot);
}
