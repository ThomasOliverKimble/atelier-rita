// Runs before first paint: pick the session description and publish --vw and
// --header-h so the page never jumps. Scroll behaviour lives in
// scripts/header.ts.
(() => {
  const h = document.querySelector("[data-header]");
  const d = h.querySelectorAll("[data-description]");
  if (d.length) {
    let i = Number(sessionStorage.getItem("rita-desc-index"));
    if (!sessionStorage.getItem("rita-desc-index")) {
      i = Math.floor(Math.random() * 100000);
      sessionStorage.setItem("rita-desc-index", String(i));
    }
    d.forEach((el, k) => (el.hidden = k !== i % d.length));
  }
  document.documentElement.style.setProperty("--vw", document.documentElement.clientWidth + "px");
  document.documentElement.style.setProperty("--header-h", h.getBoundingClientRect().height + "px");
})();
