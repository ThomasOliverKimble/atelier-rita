// Native scroll-snap slider (replaces react-slick). Prev/next buttons glide
// with slick's old timing; swipe, trackpad and arrow keys are native.
// Keeps the caption in sync and reveals "next project" on project pages as
// the last image scrolls in.

import { isMobile } from "./media";

const DURATION = 500;

// cubic-bezier(0.53, 0, 0.36, 1), the old slick cssEase
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const a = (a1: number, a2: number) => 1 - 3 * a2 + 3 * a1;
  const b = (a1: number, a2: number) => 3 * a2 - 6 * a1;
  const c = (a1: number) => 3 * a1;
  const calc = (t: number, a1: number, a2: number) => ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t;
  const slope = (t: number, a1: number, a2: number) => 3 * a(a1, a2) * t * t + 2 * b(a1, a2) * t + c(a1);
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const s = slope(t, x1, x2);
      if (s === 0) break;
      t -= (calc(t, x1, x2) - x) / s;
    }
    return calc(t, y1, y2);
  };
}
const ease = bezier(0.53, 0, 0.36, 1);

for (const root of Array.from(document.querySelectorAll<HTMLElement>("[data-slider]"))) {
  const track = root.querySelector<HTMLElement>(".slider-track")!;
  const slides = Array.from(track.querySelectorAll<HTMLElement>(".ss-slider__slide"));
  if (!slides.length) continue;
  const page = root.closest<HTMLElement>(".slider");
  const caption = page?.querySelector<HTMLElement>("[data-slider-caption]");
  const endTarget = root.closest<HTMLElement>("[data-slider-ends]");
  let index = 0;

  const fitTail = () => {
    const last = slides[slides.length - 1];
    track.style.setProperty("--track-tail", `${Math.max(0, track.clientWidth - last.offsetWidth)}px`);
  };

  const current = () => {
    const x = track.scrollLeft;
    let best = 0;
    slides.forEach((s, i) => {
      if (Math.abs(s.offsetLeft - x) < Math.abs(slides[best].offsetLeft - x)) best = i;
    });
    return best;
  };

  const render = () => {
    if (caption) caption.textContent = slides[index].dataset.caption ?? "";
  };

  // "Projet suivant" (project pages, desktop): revealed in step with the
  // scroll, by exactly the empty space opening up to the right of the last
  // image, so it never covers an image and retreats as soon as the visitor
  // scrolls back. --reveal goes from 0 (hidden) to 1 (fully shown).
  const related = endTarget?.querySelector<HTMLElement>(".related");
  const reveal = () => {
    if (!endTarget || !related) return;
    const last = slides[slides.length - 1];
    const imagesRight = last.offsetLeft + last.offsetWidth - track.scrollLeft;
    const free = track.clientWidth - imagesRight;
    const r = isMobile.matches ? 0 : Math.max(0, Math.min(1, free / (related.offsetWidth || 1)));
    endTarget.style.setProperty("--reveal", r.toFixed(3));
  };
  let revealFrame = 0;
  const queueReveal = () => {
    cancelAnimationFrame(revealFrame);
    revealFrame = requestAnimationFrame(reveal);
  };

  // after a free swipe/trackpad scroll, the slide nearest the left edge wins
  const sync = () => {
    if (animating) return;
    index = current();
    render();
  };

  let frame = 0;
  let animating = false;
  const goTo = (i: number) => {
    index = Math.max(0, Math.min(slides.length - 1, i));
    render();
    const target = Math.min(slides[index].offsetLeft, track.scrollWidth - track.clientWidth);
    const from = track.scrollLeft;
    const start = performance.now();
    cancelAnimationFrame(frame);
    animating = true;
    track.classList.add("is-animating");
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / DURATION);
      track.scrollLeft = from + (target - from) * ease(p);
      if (p < 1) frame = requestAnimationFrame(step);
      else {
        track.scrollLeft = target;
        track.classList.remove("is-animating");
        animating = false;
      }
    };
    frame = requestAnimationFrame(step);
  };

  root.querySelector("[data-slider-prev]")?.addEventListener("click", () => goTo(index - 1));
  root.querySelector("[data-slider-next]")?.addEventListener("click", () => goTo(index + 1));

  // Wheel and trackpad scroll the carousel sideways. Listening on the whole
  // carousel (including the "Projet suivant" panel) matters: on desktop the
  // invisible prev/next halves sit on top of the track and would otherwise
  // swallow the gesture. A vertical mouse wheel
  // also scrolls sideways; at either end the page gets the wheel back.
  (page ?? root).addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const max = track.scrollWidth - track.clientWidth;
      if ((track.scrollLeft <= 0 && delta < 0) || (track.scrollLeft >= max - 1 && delta > 0)) return;
      e.preventDefault();
      cancelAnimationFrame(frame);
      animating = false;
      track.classList.remove("is-animating");
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? track.clientWidth : 1;
      track.scrollLeft += delta * unit;
    },
    { passive: false },
  );

  let settle: number | undefined;
  track.addEventListener(
    "scroll",
    () => {
      queueReveal();
      clearTimeout(settle);
      settle = window.setTimeout(sync, 80);
    },
    { passive: true },
  );

  const ro = new ResizeObserver(() => {
    fitTail();
    queueReveal();
  });
  ro.observe(track);
  ro.observe(slides[slides.length - 1]);
  fitTail();
  render();
  reveal();
  isMobile.addEventListener("change", reveal);
}
