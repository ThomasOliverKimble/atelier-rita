import type { APIRoute } from "astro";
import { getAtelier, getHome, getProjects } from "../lib/queries";

const SITE = "https://www.atelierrita.org";
const line = (title: string, path: string, description?: string | null) =>
  `- [${title}](${SITE}${path})${description ? `: ${description}` : ""}\n`;

export const GET: APIRoute = async () => {
  const [home, projects, atelier] = await Promise.all([getHome(), getProjects(), getAtelier()]);
  let out = "# Atelier Rita\n\n";
  if (home?.seo?.metaDescription) out += `> ${home.seo.metaDescription}\n\n`;
  out += "## Pages\n\n";
  out += line(home?.seo?.metaTitle || "Accueil", "/", home?.seo?.metaDescription);
  out += line(projects?.seo?.metaTitle || "Index", "/projects", projects?.seo?.metaDescription);
  out += line(atelier?.seo?.metaTitle || "Atelier", "/atelier", atelier?.seo?.metaDescription);
  out += "\n## Projets\n\n";
  for (const p of projects?.items ?? []) {
    if (p.slug) out += line(p.title?.fr || p.slug, `/project/${p.slug}`);
  }
  out += "\n## English\n\n";
  out += line("Home", "/en");
  out += line("Index", "/en/projects");
  out += line("Studio", "/en/atelier");
  return new Response(out, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
