import type { AstroGlobal } from "astro";

export const PREVIEW_COOKIE = "rita-preview";

const encoder = new TextEncoder();

async function key(): Promise<CryptoKey> {
  const secret = process.env.SANITY_READ_TOKEN || import.meta.env.SANITY_READ_TOKEN;
  if (!secret) throw new Error("SANITY_READ_TOKEN is required for preview");
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

const b64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));

/** Signed, expiring cookie value (the cookie can't be forged without the token). */
export async function signPreview(ttlSeconds = 3600): Promise<string> {
  const exp = String(Math.floor(Date.now() / 1000) + ttlSeconds);
  const sig = await crypto.subtle.sign("HMAC", await key(), encoder.encode(exp));
  return `${exp}.${b64(sig)}`;
}

async function verifyPreview(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  try {
    const raw = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
    return crypto.subtle.verify("HMAC", await key(), raw, encoder.encode(exp));
  } catch {
    return false;
  }
}

/** True only on the preview deployment, for a request carrying a valid preview cookie. */
export async function isDraft(astro: AstroGlobal): Promise<boolean> {
  if (process.env.PREVIEW !== "true" || astro.isPrerendered) return false;
  return verifyPreview(astro.cookies.get(PREVIEW_COOKIE)?.value);
}
