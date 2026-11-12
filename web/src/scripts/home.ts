// Home cards: flip on hover, turning away from the side the pointer came in
// from. On small/touch screens the first tap flips, the second follows the link.

import { isMobile } from "./media";

const cards = Array.from(document.querySelectorAll<HTMLElement>(".card--home"));

function flip(card: HTMLElement, clientX: number, active: boolean) {
  const r = card.getBoundingClientRect();
  card.style.setProperty("--flip-deg", clientX - r.left > r.width / 2 ? "-180deg" : "180deg");
  card.classList.toggle("is-active", active);
}

// Smooth flips: cards close to the viewport are kept on their own GPU layer
// (`.is-near` -> will-change), so a flip only rotates an already-rasterised
// texture instead of repainting large photos and SVG drawings every frame.
// Limiting it to nearby cards keeps graphics memory low.
const near = new IntersectionObserver(
  (entries) => {
    for (const e of entries) (e.target as HTMLElement).classList.toggle("is-near", e.isIntersecting);
  },
  { rootMargin: "50% 0px" },
);

for (const card of cards) {
  if (!card.classList.contains("has-verso")) continue;
  near.observe(card);

  card.addEventListener("mouseenter", (e) => !isMobile.matches && flip(card, e.clientX, true));
  card.addEventListener("mouseleave", (e) => !isMobile.matches && flip(card, e.clientX, false));

  let taps = 0;
  card.querySelector("a")?.addEventListener("click", (e) => {
    if (!isMobile.matches) return;
    taps += 1;
    if (taps === 1) {
      e.preventDefault();
      flip(card, e.clientX, true);
    } else {
      taps = 0;
    }
  });
}
