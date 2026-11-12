// Floating panels: open/close, random placement that avoids the logo,
// drag by the background handle, click to bring to front, Escape closes.
// Replaces Modal.tsx, Draggable.tsx and the pubsub-js messaging.

import { isMobile } from "./media";

let topZ = 99;
let lastTrigger: HTMLElement | null = null;

const modals = Array.from(
  document.querySelectorAll<HTMLElement>("[data-modal]"),
);

function setPos(el: HTMLElement, x: number, y: number) {
  el.dataset.x = String(x);
  el.dataset.y = String(y);
  el.style.setProperty("--x", `${x}px`);
  el.style.setProperty("--y", `${y}px`);
}

function placeRandomly(el: HTMLElement) {
  if (isMobile.matches) return;
  const box = el.getBoundingClientRect();
  const logo = document
    .querySelector("header .rita-logo")
    ?.getBoundingClientRect();
  let x = Math.random() * (innerWidth - box.width);
  let y = Math.random() * (innerHeight - box.height);
  if (logo) {
    const right = logo.left + logo.width;
    const bottom = logo.top + logo.height;
    const margin = Math.random() * 20;
    const overlaps =
      x < right &&
      x + box.width > logo.left &&
      y < bottom &&
      y + box.height > logo.top;
    if (overlaps) {
      if (right + box.width < innerWidth) x = right + margin;
      else if (bottom + box.height < innerHeight) y = bottom + margin;
    }
  }
  setPos(el, x, y);
}

const bringToFront = (el: HTMLElement) => (el.style.zIndex = String(++topZ));
const isOpen = (el: HTMLElement) => el.classList.contains("modal--open");

function syncTriggers(el: HTMLElement) {
  document
    .querySelectorAll(`[data-modal-toggle="${el.id}"]`)
    .forEach((b) => b.setAttribute("aria-expanded", String(isOpen(el))));
}

export function open(el: HTMLElement) {
  if (isOpen(el)) return;
  // atelier on small/touch screens: one panel at a time
  const group = el.dataset.group;
  if (group && isMobile.matches) {
    modals.filter((m) => m !== el && m.dataset.group === group).forEach(close);
  }
  bringToFront(el);
  el.classList.add("modal--open");
  syncTriggers(el);
}

export function close(el: HTMLElement) {
  if (!isOpen(el)) return;
  el.classList.remove("modal--open");
  syncTriggers(el);
  // next opening lands somewhere new, like before
  requestAnimationFrame(() => placeRandomly(el));
  dispatchEvent(new Event("rita:layout"));
  if (lastTrigger && el.contains(document.activeElement)) lastTrigger.focus();
}

for (const el of modals) {
  placeRandomly(el);
  el.addEventListener("pointerdown", () => bringToFront(el));
  el.querySelector("[data-modal-close]")?.addEventListener("click", () =>
    close(el),
  );

  const handle = el.querySelector<HTMLElement>(".modal__handle")!;
  let drag: { sx: number; sy: number; ox: number; oy: number } | null = null;
  handle.addEventListener("pointerdown", (e) => {
    if (isMobile.matches || e.target !== handle) return;
    e.preventDefault();
    drag = {
      sx: e.clientX,
      sy: e.clientY,
      ox: Number(el.dataset.x) || 0,
      oy: Number(el.dataset.y) || 0,
    };
    handle.setPointerCapture(e.pointerId);
    handle.dataset.dragging = "";
  });
  handle.addEventListener("pointermove", (e) => {
    if (drag)
      setPos(el, drag.ox + e.clientX - drag.sx, drag.oy + e.clientY - drag.sy);
  });
  const end = (e: PointerEvent) => {
    if (!drag) return;
    drag = null;
    delete handle.dataset.dragging;
    if (handle.hasPointerCapture(e.pointerId))
      handle.releasePointerCapture(e.pointerId);
  };
  handle.addEventListener("pointerup", end);
  handle.addEventListener("pointercancel", end);
}

// Panels that open by themselves (home news) pop up shortly after the page
// shows, once per browser session: after the first time they stay closed,
// including when coming back to the page.
const SEEN = "rita-news-seen";
for (const el of modals) {
  const delay = el.dataset.autoOpen;
  if (!delay) continue;
  let seen = false;
  try {
    seen = sessionStorage.getItem(SEEN) === "1";
  } catch {}
  if (seen) continue;
  setTimeout(() => {
    open(el);
    try {
      sessionStorage.setItem(SEEN, "1");
    } catch {}
  }, Number(delay));
}

document.addEventListener("click", (e) => {
  const trigger = (e.target as Element).closest<HTMLElement>(
    "[data-modal-toggle]",
  );
  if (!trigger) return;
  const el = document.getElementById(trigger.dataset.modalToggle!);
  if (!el) return;
  lastTrigger = trigger;
  if (isOpen(el)) close(el);
  else open(el);
});

// One listener for the page. Escape closes every open panel (old behaviour).
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") modals.forEach(close);
});

addEventListener("resize", () =>
  modals.filter((m) => !isOpen(m)).forEach(placeRandomly),
);
