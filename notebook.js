(() => {
  const notebook = document.querySelector('[data-notebook]');
  if (!notebook) return;
  const pages = [...notebook.querySelectorAll('[data-notebook-page]')];
  pages.forEach(page => { page.tabIndex = -1; });
  const slots = [...notebook.querySelectorAll('[data-paper-slot]')];
  const tabs = [...notebook.querySelectorAll('[data-notebook-tab]')];
  const header = document.querySelector('.notebook-header');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 599px)');
  const nativeTimeline = CSS.supports('animation-timeline: view()');
  let metrics = [], current = 0, frame = 0, headerHeight = 0;
  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));

  function selectPage(index) {
    current = index;
    notebook.dataset.activePage = String(index);
    tabs.forEach((tab, position) => {
      if (position === index) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });
  }

  function render() {
    frame = 0;
    const readingLine = scrollY + headerHeight + Math.min(innerHeight * .35, 300);
    const active = metrics.reduce((found, metric, index) => metric.top <= readingLine ? index : found, 0);
    if (active !== current) selectPage(active);
    if (nativeTimeline || reducedMotion.matches) return;

    // The fallback follows the same linear view timeline as CSS. There are no
    // scroll thresholds, queued flips, wheel interception or continuous loops.
    const opening = narrow.matches ? 26 : 58;
    const closing = narrow.matches ? -3 : -9;
    metrics.forEach((metric, index) => {
      if (index === 0) return;
      const progress = clamp((scrollY + innerHeight - metric.top) / (innerHeight + metric.height));
      const angle = progress <= .1 ? opening : progress <= .46
        ? opening * (1 - (progress - .1) / .36)
        : closing * clamp((progress - .46) / .32);
      const shade = progress <= .1 ? .7 : progress <= .46
        ? .7 - .58 * (progress - .1) / .36
        : .12 + .18 * clamp((progress - .46) / .32);
      pages[index].style.transform = `rotateX(${angle.toFixed(4)}deg)`;
      pages[index].style.setProperty('--paper-shade', shade.toFixed(4));
    });
  }
  function scheduleRender() { if (!frame) frame = requestAnimationFrame(render); }

  function measure(preservePosition = true) {
    const oldOffset = metrics.length ? scrollY - metrics[current].top : 0;
    const wasScrolled = scrollY > headerHeight;
    headerHeight = header.offsetHeight;
    // Read the untransformed slots, never the moving paper. Cached geometry
    // avoids layout reads in the animation or scroll event handlers.
    metrics = slots.map(slot => ({ top: scrollY + slot.getBoundingClientRect().top, height: slot.offsetHeight }));
    notebook.classList.toggle('is-unfolding', !reducedMotion.matches);
    notebook.classList.toggle('has-scroll-timeline', nativeTimeline);
    notebook.classList.toggle('has-js-scroll', !nativeTimeline && !reducedMotion.matches);
    notebook.dataset.mode = reducedMotion.matches ? 'reading' : 'unfolding';
    pages.forEach(page => {
      page.inert = false;
      page.removeAttribute('aria-hidden');
      if (nativeTimeline || reducedMotion.matches) {
        page.style.removeProperty('transform');
        page.style.removeProperty('--paper-shade');
      }
    });
    if (preservePosition && wasScrolled) window.scrollTo({ top: Math.max(0, metrics[current].top + oldOffset), behavior: 'instant' });
    scheduleRender();
  }

  function navigate(index, behavior = reducedMotion.matches ? 'instant' : 'smooth', moveFocus = false) {
    const safeIndex = clamp(index, 0, pages.length - 1);
    const top = Math.max(0, metrics[safeIndex].top - headerHeight - 24);
    if (moveFocus) pages[safeIndex].focus({ preventScroll: true });
    window.scrollTo({ top, behavior });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', event => {
      event.preventDefault();
      history.replaceState(null, '', tab.hash);
      navigate(index, undefined, event.detail === 0);
    });
  });
  window.addEventListener('scroll', scheduleRender, { passive: true });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => measure(), 100);
  });
  reducedMotion.addEventListener('change', () => measure());
  new MutationObserver(() => requestAnimationFrame(() => measure())).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  new ResizeObserver(() => {
    if (metrics.some((metric, index) => metric.height !== slots[index].offsetHeight)) measure();
  }).observe(notebook);

  function restoreHash() {
    const index = pages.findIndex(page => `#${page.id}` === location.hash);
    if (index >= 0) navigate(index, 'instant');
  }
  window.addEventListener('hashchange', restoreHash);
  measure(false);
  selectPage(0);
  document.fonts.ready.then(() => { measure(); restoreHash(); });
})();
