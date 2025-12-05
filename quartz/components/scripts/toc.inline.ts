function toggleToc(this: HTMLElement) {
  this.classList.toggle("collapsed");
  this.setAttribute(
    "aria-expanded",
    this.getAttribute("aria-expanded") === "true" ? "false" : "true"
  );
  const content = this.nextElementSibling as HTMLElement | undefined;
  if (!content) return;
  content.classList.toggle("collapsed");
}

function setupToc() {
  for (const toc of document.getElementsByClassName("toc")) {
    const button = toc.querySelector<HTMLElement>(".toc-header");
    const content = toc.querySelector<HTMLElement>(".toc-content");
    if (!button || !content) return;
    button.addEventListener("click", toggleToc);
    window.addCleanup(() => button.removeEventListener("click", toggleToc));
  }
}

function updateToc() {
  const headers = document.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]");
  const windowHeight = window.innerHeight;

  headers.forEach((header) => {
    const slug = header.id;
    const tocEntryElements = document.querySelectorAll(`a[data-for="${slug}"]`);
    if (tocEntryElements.length === 0) return;

    const rect = header.getBoundingClientRect();
    const inView = rect.bottom < windowHeight;
    tocEntryElements.forEach((el) => el.classList.toggle("in-view", inView));
  });
}

let ticking = false;
function onScrollOrUpdate() {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateToc();
      ticking = false;
    });
    ticking = true;
  }
}

document.addEventListener("nav", () => {
  setupToc();

  window.addEventListener("scroll", onScrollOrUpdate, { passive: true });
  window.addEventListener("resize", onScrollOrUpdate);

  document.addEventListener("click", (evt) => {
    const anchor = (evt.target as HTMLElement).closest("a[href^='#']");
    if (!anchor) return;
    requestAnimationFrame(() => requestAnimationFrame(updateToc));
  });

  window.addEventListener("hashchange", () => requestAnimationFrame(updateToc));

  updateToc();
});
