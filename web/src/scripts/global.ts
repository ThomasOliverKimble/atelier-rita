// Drop the blurred LQIP background once each image has loaded (what
// next/image's placeholder did), with one capturing listener for the page.
const clear = (img: HTMLImageElement) => img.style.removeProperty("background");

document.addEventListener(
  "load",
  (e) => {
    if (e.target instanceof HTMLImageElement) clear(e.target);
  },
  true,
);
for (const img of Array.from(document.images)) if (img.complete) clear(img);
