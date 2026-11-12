import type { APIRoute } from "astro";
import { createClient } from "@sanity/client";
import { validatePreviewUrl } from "@sanity/preview-url-secret";
import { apiVersion, dataset, projectId } from "../lib/sanity";
import { PREVIEW_COOKIE, signPreview } from "../lib/draft";

export const prerender = false;

// Called by the Studio's Presentation tool. Only a request carrying the
// short-lived secret the Studio just created in the dataset is accepted
// (fixes audit 1.1), and only a same-site path is used for the redirect
// (fixes audit 1.2).
export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const token = process.env.SANITY_READ_TOKEN;
  if (!token) return new Response("Preview is not configured", { status: 500 });

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    token,
    useCdn: false,
  });
  // a lookup failure (bad token, network) is treated as an invalid secret
  const result = await validatePreviewUrl(client, request.url).catch(() => ({
    isValid: false,
    redirectTo: "/",
  }));
  const { isValid, redirectTo = "/" } = result;
  if (!isValid) return new Response("Invalid secret", { status: 401 });

  const path =
    redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : "/";
  cookies.set(PREVIEW_COOKIE, await signPreview(), {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none", // the Studio shows the site in a cross-site iframe
    maxAge: 60 * 60,
  });
  return redirect(path, 307);
};
