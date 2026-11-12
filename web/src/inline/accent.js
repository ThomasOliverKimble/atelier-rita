// Accent colour, chosen before first paint (no flash). Same rules as the old
// PageContext: random on the first page and on every visit to home, kept for
// the rest of the session otherwise. A new pick never repeats the colour
// shown last, including the last one from a previous visit.
(() => {
  try {
    const colors = JSON.parse(document.getElementById("rita-colors").textContent);
    const home = document.documentElement.dataset.home === "";
    let c = JSON.parse(sessionStorage.getItem("rita-accent") || "null");
    if (!c || home) {
      let last = c && c.hex;
      try {
        last = last || localStorage.getItem("rita-accent-last");
      } catch {}
      const pool = colors.length > 1 ? colors.filter((x) => x.hex !== last) : colors;
      c = pool[Math.floor(Math.random() * pool.length)];
      if (c) {
        sessionStorage.setItem("rita-accent", JSON.stringify(c));
        try {
          localStorage.setItem("rita-accent-last", c.hex);
        } catch {}
      }
    }
    if (c) {
      const s = document.documentElement.style;
      s.setProperty("--color-accent", c.hex || "red");
      s.setProperty("--color-accent-rgb", (c.rgb || [255, 0, 0]).join(", "));
    }
  } catch {}
})();
