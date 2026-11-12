# Atelier Rita

Website and content back office for [Atelier Rita](https://www.atelierrita.org), an architecture practice in Paris working on housing and rehabilitation.

The site is a portfolio: a home page of project cards, a sortable index of every project, one page per project, and a page about the studio. It exists in French (`/`) and English (`/en`). Content is edited by the studio in a Sanity back office; the public site is plain static HTML with a few kilobytes of JavaScript.

```
.
├── web/      the public website (Astro, static)
└── studio/   the back office (Sanity Studio)
```

## The website

| Page | URL | What it shows |
|---|---|---|
| Home | `/` | News popup, a grid of photo and drawing cards in random order, credits |
| Index | `/projects` | All projects as a sortable table; hovering a row shows its cover |
| Project | `/project/<slug>` | Image carousel with captions, title, "En savoir plus" panel with the project text and technical sheet, link to the next project |
| Atelier | `/atelier` | Studio photos carousel and draggable text panels (about, team, press...) |

Every page also exists under `/en/...`. The language switch in the header links to the same page in the other language.

### Behaviour worth knowing

- **Accent colour.** One of the colours from Settings is picked at random when a visit starts, and again each time the visitor returns to the home page.
- **Logo.** On the home page "Rita" is drawn as wide as three columns and shrinks to one column as the page scrolls. It grows back when scrolling to the top. The site description in the top right gives way to the menu as the page scrolls.
- **Home cards.** Photos and drawings are shuffled on every visit, and two drawings are never placed side by side. Cards linked to a project flip on hover to show its type, year, city and client. On phones the first tap flips, the second opens the project.
- **Drawings.** SVG drawings are recoloured to match the accent colour, and only loaded when scrolled close to.
- **News popup.** Appears half a second after the home page opens, once per browser session.
- **Panels.** News, project text and atelier texts open as panels placed at random (never over the logo), draggable by their background, brought to the front on click, closed with the cross or the Escape key.
- **Carousels.** Scroll with a trackpad or mouse wheel, click the left or right half of the images, or swipe on a phone. At the end of a project's carousel the "next project" link slides in.

## Where content comes from

The back office has one document per page plus a Settings document. What editors change there appears on the site after publishing (see [Publishing](#publishing)).

| In the Studio | Controls |
|---|---|
| **Réglages** | Site name, the accent **Couleurs**, the rotating **Descriptions du site** (top right of the home page), the menu (**Naviguation Primary**) |
| **Home** | The **cards** of the grid (an image, optionally linked to a project or to any URL), the **Actualités** shown in the news popup, SEO title and description |
| **Projets Index** | Which projects appear on the Index page, **in which order**. This order also decides the "next project" link |
| **Project** | One per project: title, cover, **Images slider** (with captions), **Texte**, type, programme, client, équipe, ville, code postal, chiffres, année, extra lines of the **fiche technique**, SEO |
| **Atelier** | The photos of the carousel (with captions) and the **Textes** panels (a title and a rich text each) |

Text fields have a French and an English version. When the English one is empty the French text is shown.

## Working on it locally

Requirements: Node 24 (`nvm use`) and pnpm (`corepack enable`).

```bash
pnpm install
pnpm dev           # website on http://localhost:4321
pnpm dev:studio    # back office on http://localhost:3333
```

| Command | Does |
|---|---|
| `pnpm build` | Builds the static site into `web/dist/` |
| `pnpm check` | Type-checks the website and the Studio |
| `pnpm types` | Regenerates `web/src/lib/sanity.types.ts` after a schema or query change (commit the result) |
| `node web/scripts/budget.mjs` | Checks every built page against the weight budget (25 KB HTML, 8 KB JS, gzipped) |

The website reads published content from the public Sanity API, so it runs without any key. The Studio must run on **port 3333**: it is the local address the Sanity project accepts (CORS), and you need to be a member of the project to sign in.

## How the website is built

```
Sanity (content) ──build──▶ Astro ──▶ static HTML, CSS, a few small scripts ──▶ Vercel CDN
```

- **Static pages.** Every page is rendered at build time (`web/src/pages`, shared layouts in `web/src/routes`). Production runs no server code.
- **Lean data.** `web/src/lib/queries.ts` asks Sanity only for the fields the pages display, never full asset records (file names, hashes and upload details stay private).
- **Images** load from the Sanity image CDN in the size each screen needs, respecting the crop and focal point set by editors (`web/src/lib/image.ts`).
- **Drawings** are downloaded at build time, sanitised, and published as static files under `/svg/` (`web/src/pages/svg/[id].svg.ts`).
- **Interactions** are small plain TypeScript files in `web/src/scripts/`: `header.ts` (logo, menu), `home.ts` (card flips), `modal.ts` (panels), `slider.ts` (carousels), `projects.ts` (index sort), `svg.ts` (drawings). The few lines that must run before the page is painted (accent colour, header size, card shuffle, page fade) are in `web/src/inline/`.
- **Styles** are SCSS in `web/src/styles/` with Tailwind utility classes. The grid column widths used across the layout are computed in CSS (`_grid.scss`).

Result: about 4.5 KB of JavaScript for the whole site and under 20 KB of HTML for the home page (both gzipped).

## Deployment

The site is hosted on Vercel and rebuilt on every push to `main`.

**Production project** (Vercel, import this repository):

| Setting | Value |
|---|---|
| Root Directory | `web` |
| Framework | Astro (detected) |
| Install / build commands | from `web/vercel.json` |
| Node.js | 24.x (from `web/package.json`) |
| Environment variables | `ENABLE_EXPERIMENTAL_COREPACK=1` (so Vercel uses the repository's pnpm version); `SANITY_READ_TOKEN` only if the dataset is made private |

Security and cache headers live in `web/vercel.json`. On `www.atelierrita.org` the site refuses to be embedded in other sites; on any other domain (Vercel preview URLs) it is marked `noindex` and can only be embedded by the Studio.

### Publishing

Editors publish in the Studio; the site updates after a rebuild, which takes about a minute. To make that automatic:

1. Vercel, project Settings, Git, **Deploy Hooks**: create a hook for `main`, copy its URL.
2. [sanity.io/manage](https://www.sanity.io/manage), project `ra5yjexn`, API, **Webhooks**: add a webhook with that URL, dataset `production`, triggered on create, update and delete, filter `_type in ["home", "projects", "project", "atelier", "settings"]`, method POST.

Without the webhook, redeploy from the Vercel dashboard after publishing.

### Live preview in the Studio (optional)

The Studio's **Live preview** tab shows unpublished drafts. It needs a second Vercel project from the same repository (Root Directory `web`) with the environment variables `PREVIEW=true` and `SANITY_READ_TOKEN` (a Viewer token), and Vercel Deployment Protection turned on. Set its URL in the Studio as `SANITY_STUDIO_PREVIEW_URL` (see `studio/.env.example`).

That deployment turns preview on at `/api/preview` only with the one-time secret the Studio generates, and keeps it on for an hour with a signed cookie.

## Troubleshooting

| Problem | Cause and fix |
|---|---|
| A published change does not appear | The site has not been rebuilt: redeploy on Vercel, or set up the webhook above |
| Studio says "Connect this Studio to your project" | It is not running on `localhost:3333`, the address allowed in the project's CORS settings |
| Studio says "Request access" | Your Sanity account is not a member of the project: ask an administrator to invite you |
| `pnpm install` refuses a package version | `pnpm-workspace.yaml` only installs versions published at least two days ago (supply-chain protection); wait or pin an older version |
| A page fails the weight budget in CI | Something added too much HTML or JavaScript; check `node web/scripts/budget.mjs` locally |

## To do outside the code

- Make the Sanity `production` dataset private once `SANITY_READ_TOKEN` is set on Vercel (today anyone can list its files).
- Remove unused images from the Studio media library (about 270 files, many unused).
- One press link on the Atelier page contains a sentence instead of a URL.
- Add a default share image in Home, SEO.

## Credits

Design: [Jean-Baptiste Parré](http://jbparre.com/). Original development: [Ahmed Ghazi](https://ahmedghazi.com/). Production: [AHA](https://www.aha-paris.com). Illustration of the Rita card: [Zoé Bourhis](https://www.instagram.com/zoe.bourhis/).
