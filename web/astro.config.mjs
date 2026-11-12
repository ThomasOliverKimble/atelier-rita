// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const SITE = "https://www.atelierrita.org";

// PREVIEW=true builds the draft-preview deployment used by the Studio's
// Presentation tool: server-rendered, reads drafts with a token, exposes
// /api/preview and /api/exit-preview. Production is a plain static build.
const isPreview = process.env.PREVIEW === "true";

/** @returns {import("astro").AstroIntegration} */
function previewRoutes() {
  return {
    name: "rita-preview",
    hooks: {
      "astro:config:setup": ({ injectRoute, injectScript }) => {
        injectRoute({ pattern: "/api/preview", entrypoint: "./src/preview/enable.ts" });
        injectRoute({ pattern: "/api/exit-preview", entrypoint: "./src/preview/disable.ts" });
        injectScript("page", `import "/src/preview/visual-editing.ts";`);
      },
    },
  };
}

const adapter = isPreview ? (await import("@astrojs/vercel")).default() : undefined;

export default defineConfig({
  site: SITE,
  output: isPreview ? "server" : "static",
  adapter,
  trailingSlash: "never",
  build: { format: "file", inlineStylesheets: "auto" },
  i18n: {
    locales: ["fr", "en"],
    defaultLocale: "fr",
    routing: { prefixDefaultLocale: false },
  },
  prefetch: { prefetchAll: false, defaultStrategy: "hover" },
  markdown: { syntaxHighlight: false },
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' https://cdn.sanity.io data:",
        "font-src 'self'",
        isPreview ? "connect-src 'self' https://*.sanity.io wss://*.sanity.io" : "connect-src 'self'",
        "base-uri 'self'",
        "form-action 'none'",
        "object-src 'none'",
      ],
      // <style>/<link> stay hash/self-locked; only style="" attributes
      // (CSS custom properties set per card/figure) are allowed inline.
      styleDirective: {
        resources: ["'self'", { resource: "'unsafe-inline'", kind: "attribute" }],
      },
    },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: "fr", locales: { fr: "fr-FR", en: "en-GB" } },
      filter: (page) => !page.includes("/api/"),
    }),
    ...(isPreview ? [previewRoutes()] : []),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
