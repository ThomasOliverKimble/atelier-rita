// Accent colour, chosen before first paint (no flash). Same rules as the old
// PageContext: random on the first page and on every visit to home, kept for
// the rest of the session otherwise.
(() => {
  try {
    const colors = JSON.parse(document.getElementById("rita-colors").textContent);
    const home = document.documentElement.dataset.home === "";
    let c = JSON.parse(sessionStorage.getItem("rita-accent") || "null");
    if (!c || home) {
      c = colors[Math.floor(Math.random() * colors.length)];
      if (c) sessionStorage.setItem("rita-accent", JSON.stringify(c));
    }
    if (c) {
      const s = document.documentElement.style;
      s.setProperty("--color-accent", c.hex || "red");
      s.setProperty("--color-accent-rgb", (c.rgb || [255, 0, 0]).join(", "));
    }
  } catch {}
})();
