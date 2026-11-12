// Random order per visit, decided before first paint: shuffle the photos,
// shuffle the drawings, then drop drawings into distinct gaps between photos
// so two drawings are never side by side (same algorithm as the old
// ContentHome, applied to server-rendered cards).
(() => {
  const grid = document.querySelector("[data-home-grid]");
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const cards = Array.from(grid.children);
  const imgs = shuffle(cards.filter((c) => c.dataset.kind === "img"));
  const svgs = shuffle(cards.filter((c) => c.dataset.kind === "svg"));
  const n = imgs.length;
  const slots = shuffle([...Array(n + 1).keys()])
    .slice(0, Math.min(svgs.length, n + 1))
    .sort((a, b) => a - b);
  const out = [];
  let s = 0;
  for (let i = 0; i <= n; i++) {
    if (slots[s] === i) out.push(svgs[s++]);
    if (i < n) out.push(imgs[i]);
  }
  grid.replaceChildren(...out);
})();
