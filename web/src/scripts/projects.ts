// Index table: sortable columns and the hover thumbnail. Each row carries
// its cover <figure> in a <template>, so nothing downloads until hovered.

const table = document.querySelector<HTMLElement>(".content--projects");
if (table) {
  const tbody = table.querySelector<HTMLElement>(".tbody")!;
  const rows = Array.from(tbody.querySelectorAll<HTMLElement>(".tr"));
  const locale = document.documentElement.lang;
  let sortKey: string | null = null;
  let dir: 1 | -1 = 1;

  table.querySelectorAll<HTMLButtonElement>(".th").forEach((th) => {
    th.addEventListener("click", () => {
      const key = th.dataset.key!;
      if (sortKey === key) dir = dir === 1 ? -1 : 1;
      else {
        sortKey = key;
        dir = 1;
      }
      table.querySelectorAll<HTMLElement>(".th").forEach((other) => {
        const on = other === th;
        other.classList.toggle("is-active", on && dir === 1);
        other.setAttribute("aria-sort", on ? (dir === 1 ? "ascending" : "descending") : "none");
      });
      const value = (r: HTMLElement) => (r.dataset[key] ?? "").trim();
      const sorted = [...rows].sort(
        (a, b) => dir * value(a).localeCompare(value(b), locale, { numeric: true, sensitivity: "base" }),
      );
      tbody.append(...sorted);
    });
  });

  const slot = table.querySelector<HTMLElement>(".thumbnail");
  const show = (row: HTMLElement) => {
    const src = row.querySelector<HTMLTemplateElement>("template");
    if (slot && src) slot.replaceChildren(src.content.cloneNode(true));
  };
  if (slot) {
    rows.forEach((row) => {
      row.addEventListener("mouseenter", () => show(row));
      row.addEventListener("focusin", () => show(row));
    });
  }
}
