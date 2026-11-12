import type { APIRoute, GetStaticPaths } from "astro";
import { assetId, isSvg } from "../../lib/image";
import {
  getAtelier,
  getHome,
  getProject,
  getProjectSlugs,
} from "../../lib/queries";
import { isValidSvgId, sanitizedSvg } from "../../lib/svg";

export const getStaticPaths = (async () => {
  const [home, atelier, slugs] = await Promise.all([
    getHome(),
    getAtelier(),
    getProjectSlugs(),
  ]);
  const projects = await Promise.all(slugs.filter((s): s is string => Boolean(s)).map((s) => getProject(s)));
  const images = [
    ...(home?.items ?? []).map((i) => i.image),
    ...(atelier?.images ?? []),
    ...projects.flatMap((p) => p?.images ?? []),
  ];
  const ids = new Set(images.filter(isSvg).map((img) => assetId(img!.url!)));
  return [...ids].map((id) => ({ params: { id } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const id = params.id ?? "";
  if (!isValidSvgId(id)) return new Response(null, { status: 404 });
  return new Response(await sanitizedSvg(id), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
