# Atelier Rita

Website ([atelierrita.org](https://www.atelierrita.org)) and Sanity Studio back office.

| Folder | What | Stack |
|---|---|---|
| `web/` | Public site, French at `/`, English at `/en` | Astro 7, static HTML, ~4.5 KB of vanilla TypeScript |
| `studio/` | Content back office (`backoffice--rita.sanity.studio`) | Sanity Studio 6 |

## Getting started

```bash
nvm use            # Node 24
pnpm install
pnpm dev           # site on http://localhost:4321
pnpm dev:studio    # Studio on http://localhost:3333
```

Other commands:

| Command | Does |
|---|---|
| `pnpm build` | Static production build into `web/dist/` |
| `pnpm check` | Type-checks the site (`astro check`) and the Studio (`tsc`) |
| `pnpm types` | Re-extracts the Studio schema and regenerates `web/src/lib/sanity.types.ts` from the GROQ queries in `web/src/lib/queries.ts` |
| `node web/scripts/budget.mjs` | Fails if any built page exceeds 25 KB HTML or 8 KB JS (gzip) |

Run `pnpm types` after changing a schema or a query, and commit the generated types.

## How the site works

- **Fully static.** Every page is pre-rendered at build time. Production has no server code, so nothing runs per visit.
- **Data.** `web/src/lib/queries.ts` asks Sanity only for the fields the templates render. Asset records (file names, hashes, upload metadata) are never sent to visitors.
- **Images.** These are served straight from the Sanity CDN with a `srcset` (`web/src/lib/image.ts`), respecting the editor's crop and hotspot.
- **SVG drawings.** These are fetched at build time, sanitized with DOMPurify, and emitted as static files under `/svg/` (`web/src/pages/svg/[id].svg.ts`). Cards load them when scrolled near and recolour them with CSS.
- **Interactions.** Each one is a small script in `web/src/scripts/`:

  | Script | Interaction |
  |---|---|
  | `header.ts` | Logo shrink on scroll |
  | `home.ts` | Card flip |
  | `modal.ts` | Draggable panels |
  | `slider.ts` | Slider |
  | `projects.ts` | Index table sort |

  Scripts that must run before first paint live in `web/src/inline/`: the accent colour, the header setup and the home card shuffle. Their hashes are added to the page's Content Security Policy automatically.
- **Layout variables.** The `--gridder-*` column widths are pure CSS (`web/src/styles/_grid.scss`).

## Deployment (Vercel)

Two Vercel projects point at this repository, both with **Root Directory = `web`**.

| Project | Domain | Environment variables | Output |
|---|---|---|---|
| Production | `www.atelierrita.org` | `SANITY_READ_TOKEN` (optional while the dataset is public) | Static files |
| Preview | `preview.atelierrita.org` (or its `*.vercel.app` URL) | `PREVIEW=true`, `SANITY_READ_TOKEN` (Viewer token) | One server function, drafts |

On the Preview project, enable **Vercel Deployment Protection**. Security headers are in `web/vercel.json`: the production domain refuses to be framed, and the preview domain may only be framed by the Studio.

### Publishing content

Edits appear on the live site after a rebuild. Set this up once:

1. Vercel, Production project, Settings, Git, **Deploy Hooks**: create a hook on `main` and copy its URL.
2. sanity.io/manage, project `ra5yjexn`, API, **Webhooks**: create a webhook.
   - **URL:** the deploy hook URL.
   - **Dataset:** `production`.
   - **Trigger on:** create, update, delete.
   - **Filter:** `_type in ["home", "projects", "project", "atelier", "settings"]`.
   - **HTTP method:** POST.
   - **Drafts:** off.

A full build takes about 10 seconds, so a published change is live in about a minute.

### Live preview in the Studio

The Studio's **Live preview** tab (Presentation tool) loads the Preview deployment.

- `/api/preview` turns preview on only after `@sanity/preview-url-secret` validates the one-time secret the Studio creates. It then sets a signed, one-hour cookie and redirects only to a path on the same site.
- `/api/exit-preview` turns it off.
- The Studio reads the preview origin from `SANITY_STUDIO_PREVIEW_URL` (see `studio/.env.example`). It uses `http://localhost:4321` when the Studio runs locally.

To try preview locally:

```bash
cd web && PREVIEW=true SANITY_READ_TOKEN=<viewer token> pnpm dev
```

## Recommended follow-ups (outside the code)

- **Make the `production` dataset private** (sanity.io/manage, Datasets) once `SANITY_READ_TOKEN` is set on both Vercel projects. Today anyone can list all of its assets.
- **Delete unused assets** in the Studio's Media tab. The library holds about 270 files, many unused.
- **Fix one bad link in the Atelier content.** One press link has a sentence instead of a URL in its `href` ("Dialectique féconde sur l'Ile de Nantes…").
- **Set a default share image.** The home page has no SEO image, so shares of `/` have no picture. Set one in the Home document's SEO tab.

## Supply chain

`pnpm-workspace.yaml` refuses package versions published less than two days ago and pins patched versions of vulnerable transitive build tools. CI runs `pnpm audit --audit-level high`, the type checks, the build and the page-weight budget on every pull request.
