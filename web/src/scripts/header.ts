// Header behaviour (replaces GSAP ScrollTrigger, useScroll, useGridShrinkRange,
// useDeviceDetect and the Gridder measuring loop).
//
// Home page: the logo follows the scroll position, from --logo-start at the
// top to --logo-end once the page has scrolled (start - end) / logo ratio
// pixels, and grows back when scrolling up again. Elsewhere it stays small.
// --header-h is the height of the header in its resting state, so the page
// content never jumps while the logo animates.

import { isMobile } from "./media";

const LOGO_RATIO = 744 / 191;

const header = document.querySelector<HTMLElement>("[data-header]")!;
const logo = header.querySelector<HTMLElement>(".rita-logo")!;
const logoCol = header.querySelector<HTMLElement>("[data-logo-col]")!;
const navCol = header.querySelector<HTMLElement>("[data-nav-col]")!;
const root = document.documentElement;
const isHome = document.body.classList.contains("is-home");

let shrunk = header.classList.contains("is-shrunk");
// Home page: once the menu has fully appeared it stays, also back at the top
// of the page where the logo is large again (see .has-nav in _header.scss).
let stuck = false;

function applyColumns() {
  header.classList.toggle("is-shrunk", shrunk);
  header.classList.toggle("has-nav", stuck);
  logoCol.classList.toggle("col-span-1", shrunk);
  logoCol.classList.toggle("col-span-2", !shrunk);
  navCol.classList.toggle("opacity-0", !shrunk && !stuck);
  navCol.classList.toggle("pointer-events-none", !shrunk && !stuck);
  const mobile = isMobile.matches;
  navCol.classList.toggle("relative", mobile && shrunk);
  navCol.classList.toggle("absolute", mobile && !shrunk);
  navCol.classList.toggle("inset-0", mobile && !shrunk);
}

/**
 * Header height at rest (home: large logo at the top). Measured synchronously
 * with the resting state applied for one read, so nothing is painted.
 */
function measureHeader() {
  if (!isHome) {
    root.style.setProperty(
      "--header-h",
      `${header.getBoundingClientRect().height}px`,
    );
    return;
  }
  const was = { shrunk, p: logo.style.getPropertyValue("--logo-p") };
  shrunk = false;
  applyColumns();
  logo.style.setProperty("--logo-p", "0");
  root.style.setProperty(
    "--header-h",
    `${header.getBoundingClientRect().height}px`,
  );
  shrunk = was.shrunk;
  applyColumns();
  logo.style.setProperty("--logo-p", was.p);
}

let range = 0;
function measureRange() {
  const p = logo.style.getPropertyValue("--logo-p");
  const wasShrunk = header.classList.contains("is-shrunk");
  header.classList.remove("is-shrunk");
  logo.style.setProperty("--logo-p", "0");
  const start = logo.offsetWidth;
  logo.style.setProperty("--logo-p", "1");
  const end = logo.offsetWidth;
  logo.style.setProperty("--logo-p", p);
  header.classList.toggle("is-shrunk", wasShrunk);
  range = Math.max(0, (start - end) / LOGO_RATIO);
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const y = window.scrollY;
    const p = range > 0 ? Math.min(1, y / range) : 1;
    logo.style.setProperty("--logo-p", String(p));
    // description -> nav swap, finished a third of the way through the shrink
    const swap = range > 0 ? Math.min(1, (3 * y) / range) : 1;
    header.style.setProperty("--swap", String(swap));
    const next = p >= 1;
    const sticks = stuck || (y > 0 && swap >= 1);
    if (next !== shrunk || sticks !== stuck) {
      shrunk = next;
      stuck = sticks;
      applyColumns();
    }
  });
}

if (isHome) {
  measureRange();
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

applyColumns();
isMobile.addEventListener("change", applyColumns);

let resizeTimer: number | undefined;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  root.style.setProperty("--vw", `${root.clientWidth}px`);
  resizeTimer = window.setTimeout(() => {
    if (isHome) {
      measureRange();
      onScroll();
    }
    measureHeader();
  }, 100);
});
document.fonts?.ready.then(measureHeader);
addEventListener("rita:layout", measureHeader);
