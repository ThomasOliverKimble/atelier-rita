// Page-change animation. Browsers with cross-document View Transitions
// (Chrome, Edge, Safari) crossfade between pages natively; there the
// `pagereveal` event carries the transition. Everywhere else (Firefox), and
// on a first visit, the page content fades in instead.
(() => {
  const root = document.documentElement;
  root.classList.add("page-fade");
  addEventListener("pagereveal", (e) => {
    if (e.viewTransition) root.classList.remove("page-fade");
  });
})();
