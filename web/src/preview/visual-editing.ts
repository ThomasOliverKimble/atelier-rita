// Injected only into the preview deployment's pages (see astro.config.mjs).
// Loads Sanity's overlay when the page is shown inside the Studio.
if (window.self !== window.top) {
  import("@sanity/visual-editing").then(({ enableVisualEditing }) => {
    enableVisualEditing({
      zIndex: 1000,
      // pages are server-rendered: a reload picks up the edited draft
      refresh: () => new Promise<void>((resolve) => {
        location.reload();
        resolve();
      }),
    });
  });
}
