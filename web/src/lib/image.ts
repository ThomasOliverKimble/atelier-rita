import type { SanityImageCrop, SanityImageHotspot } from "./sanity.types";

export type SanityImg = {
  url: string | null;
  ext?: string | null;
  w: number | null;
  h: number | null;
  lqip?: string | null;
  crop?: SanityImageCrop | null;
  hotspot?: SanityImageHotspot | null;
} | null;

const WIDTHS = [320, 480, 640, 828, 1080, 1440, 1920, 2560];

export const isSvg = (img: SanityImg): boolean =>
  img?.ext === "svg" || /\.svg($|\?)/i.test(img?.url ?? "");

/** Pixel size after the editor's crop (what the browser will actually show). */
export function croppedSize(img: SanityImg, fallback = 1000) {
  const { top = 0, bottom = 0, left = 0, right = 0 } = img?.crop ?? {};
  return {
    width: img?.w ? Math.round(img.w * (1 - left - right)) : fallback,
    height: img?.h ? Math.round(img.h * (1 - top - bottom)) : fallback,
  };
}

function rect(img: NonNullable<SanityImg>): string | undefined {
  const c = img.crop;
  if (!c || !img.w || !img.h) return undefined;
  const { top = 0, bottom = 0, left = 0, right = 0 } = c;
  if (!top && !bottom && !left && !right) return undefined;
  const x = Math.round(left * img.w);
  const y = Math.round(top * img.h);
  const w = Math.round(img.w * (1 - left - right));
  const h = Math.round(img.h * (1 - top - bottom));
  return `${x},${y},${w},${h}`;
}

/** Build a Sanity CDN URL at a given width (auto WebP/AVIF, never upscaled). */
export function imageUrl(img: NonNullable<SanityImg>, width: number): string {
  const url = new URL(img.url ?? "");
  const r = rect(img);
  if (r) url.searchParams.set("rect", r);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", "75");
  url.searchParams.set("fit", "max");
  url.searchParams.set("auto", "format");
  return url.toString();
}

export function srcset(img: NonNullable<SanityImg>, maxWidth = 2560): string {
  const natural = croppedSize(img).width;
  const widths = WIDTHS.filter((w) => w <= Math.min(maxWidth, natural));
  if (!widths.length) widths.push(Math.min(maxWidth, natural));
  return widths.map((w) => `${imageUrl(img, w)} ${w}w`).join(", ");
}

/** Hotspot is relative to the full image; object-position needs it relative to the crop. */
export function objectPosition(img: SanityImg): string | undefined {
  const hs = img?.hotspot;
  if (hs?.x == null || hs?.y == null) return undefined;
  const { top = 0, bottom = 0, left = 0, right = 0 } = img?.crop ?? {};
  const x = (hs.x - left) / (1 - left - right);
  const y = (hs.y - top) / (1 - top - bottom);
  return `${+(x * 100).toFixed(2)}% ${+(y * 100).toFixed(2)}%`;
}

/** Stable id for an asset, used for the static sanitized SVG file name. */
export function assetId(url: string): string {
  return url
    .split("/")
    .pop()!
    .replace(/\.svg$/, "");
}

/** Same-origin URL of the sanitized copy emitted by pages/svg/[id].svg.ts. */
export const svgPath = (id: string) => `/svg/${id}.svg`;
