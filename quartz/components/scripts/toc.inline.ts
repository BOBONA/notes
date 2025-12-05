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

  // find the last header whose bottom is above the viewport bottom (scrolled past)
  let lastPastSlug: string = "";
  const headerRects = Array.from(headers).map(h => ({ id: h.id, rect: h.getBoundingClientRect() }));
  headerRects.forEach(({ id, rect }) => {
    if (rect.bottom < windowHeight) lastPastSlug = id;
  });

  // clear all
  document.querySelectorAll('a[data-for]').forEach(el => el.classList.remove('in-view'));

  // add to any header that is visible (intersects viewport) OR is the last past header
  headerRects.forEach(({ id, rect }) => {
    const visible = rect.top < windowHeight && rect.bottom > 0; // partially or fully visible
    if (visible || id === lastPastSlug) {
      document.querySelectorAll(`a[data-for="${id}"]`).forEach(el => el.classList.add('in-view'));
    }
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
