// Native scroll-snap slider (replaces react-slick). Prev/next buttons glide
// with slick's old timing; swipe, trackpad and arrow keys are native.
// Keeps the caption in sync and reveals "next project" on project pages as
// the last image scrolls in.

import { isMobile } from "./media";

const DURATION = 500;
// one-image step for swipes and wheel: quicker than the prev/next glide
const STEP = 320;

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
  // Only the scroll from the image before last onto the last one counts: on
  // a wide screen a short carousel leaves that space empty from the start,
  // and the link must still wait for the end of the carousel.
  const related = endTarget?.querySelector<HTMLElement>(".related");
  const reveal = () => {
    if (!endTarget || !related) return;
    const last = slides[slides.length - 1];
    const beforeLast = slides[slides.length - 2];
    const imagesRight = last.offsetLeft + last.offsetWidth - track.scrollLeft;
    const free = track.clientWidth - imagesRight;
    const travelled = beforeLast ? track.scrollLeft - beforeLast.offsetLeft : free;
    const shown = Math.min(free, travelled);
    const r = isMobile.matches ? 0 : Math.max(0, Math.min(1, shown / (related.offsetWidth || 1)));
    endTarget.style.setProperty("--reveal", r.toFixed(3));
  };
  let revealFrame = 0;
  const queueReveal = () => {
    cancelAnimationFrame(revealFrame);
    revealFrame = requestAnimationFrame(reveal);
  };

  let frame = 0;
  let animating = false;
  const goTo = (i: number, duration = DURATION) => {
    index = Math.max(0, Math.min(slides.length - 1, i));
    render();
    const target = Math.min(slides[index].offsetLeft, track.scrollWidth - track.clientWidth);
    const from = track.scrollLeft;
    const start = performance.now();
    cancelAnimationFrame(frame);
    animating = true;
    track.classList.add("is-animating");
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
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

  // Horizontal gestures (trackpad swipe, shift + wheel) page the carousel:
  // each gesture moves exactly one image in its direction, right away. The
  // rest of that gesture, including the trackpad's momentum, is ignored, so
  // it can never overshoot and spring back. A new swipe during the momentum
  // tail (a clear jump in speed) counts as a new gesture.
  // Vertical gestures are left alone: on small screens they scroll the page.
  // Listening on the whole carousel area (including the "Projet suivant"
  // panel) matters: on desktop the invisible prev/next halves sit on top of
  // the track and would otherwise swallow the gesture.
  let locked = false;
  let lockedAt = 0;
  let lastSpeed = 0;
  let pending = 0;
  let quiet: number | undefined;
  (page ?? root).addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey) return;
      const dx = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      if (Math.abs(dx) <= Math.abs(e.shiftKey ? 0 : e.deltaY)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? track.clientWidth : 1;
      const speed = Math.abs(dx * unit);

      clearTimeout(quiet);
      quiet = window.setTimeout(() => {
        locked = false;
        pending = 0;
      }, 160);

      const now = performance.now();
      const newSwipe = locked && now - lockedAt > 250 && speed > lastSpeed * 1.6 + 4;
      lastSpeed = speed;
      if (locked && !newSwipe) return;

      pending += dx * unit;
      if (Math.abs(pending) < 12) return;
      locked = true;
      lockedAt = now;
      const dir = Math.sign(pending);
      pending = 0;
      goTo(index + dir, STEP);
    },
    { passive: false },
  );

  // Once a free scroll (trackpad swipe and its momentum, shift + wheel, arrow
  // keys) comes to rest, glide so the nearest image starts at the left edge:
  // an image is never left cut off. Phones and small screens use native CSS
  // snapping instead (see _slider.scss).
  const cssSnaps = matchMedia("(max-width: 1080px), (hover: none)");
  const sync = () => {
    if (animating) return;
    const nearest = current();
    const target = Math.min(slides[nearest].offsetLeft, track.scrollWidth - track.clientWidth);
    const distance = Math.abs(track.scrollLeft - target);
    if (!cssSnaps.matches && distance > 1) {
      goTo(nearest, Math.min(STEP, 160 + distance * 0.4));
    } else {
      index = nearest;
      render();
    }
  };

  let settle: number | undefined;
  track.addEventListener(
    "scroll",
    () => {
      queueReveal();
      clearTimeout(settle);
      settle = window.setTimeout(sync, 140);
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
