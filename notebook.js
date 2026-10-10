(() => {
  const notebook = document.querySelector('[data-notebook]');
  if (!notebook) return;

  const pages = [...notebook.querySelectorAll('[data-notebook-page]')];
  const tabs = [...notebook.querySelectorAll('[data-notebook-tab]')];
  const header = document.querySelector('.notebook-header');
  const sticky = notebook.querySelector('.notebook-sticky');
  const controls = notebook.querySelector('[data-page-controls]');
  const previous = notebook.querySelector('[data-page-previous]');
  const next = notebook.querySelector('[data-page-next]');
  const counter = notebook.querySelector('[data-page-counter]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let animated = false;
  let current = 0;
  let step = 1;
  let start = 0;
  let frame = 0;

  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));

  function selectPage(index) {
    current = index;
    notebook.dataset.activePage = String(index);
    tabs.forEach((tab, position) => {
      if (position === index) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });
    pages.forEach((page, position) => {
      page.inert = animated && position !== index;
      if (animated && position !== index) page.setAttribute('aria-hidden', 'true');
      else page.removeAttribute('aria-hidden');
    });
    previous.disabled = index === 0;
    next.disabled = index === pages.length - 1;
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
  }

  function render() {
    frame = 0;
    if (!animated) {
      const readingLine = header.offsetHeight + innerHeight * .3;
      const index = pages.reduce((found, page, position) => page.getBoundingClientRect().top < readingLine ? position : found, 0);
      selectPage(index);
      return;
    }
    const progress = clamp((scrollY - start) / step, 0, pages.length - 1);
    pages.forEach((page, index) => {
      // A pause on each sheet precedes its turn. The browser retains native scrolling.
      const turn = index === pages.length - 1 ? 0 : clamp((progress - index - .28) / .68);
      const eased = turn * turn * (3 - 2 * turn);
      page.style.transform = `rotateY(${-172 * eased}deg)`;
      page.style.visibility = turn >= .99 ? 'hidden' : 'visible';
      page.style.setProperty('--page-shade', String(Math.sin(eased * Math.PI) * .7));
      page.style.zIndex = String(pages.length - index);
    });
    const index = Math.min(pages.length - 1, Math.floor(progress + .38));
    if (index !== current) selectPage(index);
  }

  function scheduleRender() {
    if (!frame) frame = requestAnimationFrame(render);
  }

  function resetPage(page) {
    page.style.removeProperty('transform');
    page.style.removeProperty('visibility');
    page.style.removeProperty('z-index');
    page.style.removeProperty('--page-shade');
  }

  function configure() {
    const wasAnimated = animated;
    const oldCurrent = current;
    notebook.style.setProperty('--header-height', `${header.offsetHeight}px`);
    notebook.style.removeProperty('height');
    pages.forEach(resetPage);
    notebook.classList.add('is-animated');
    // Only pin the book when all content fits. Short screens use complete flowing sheets.
    const fits = pages.every(page => {
      const content = page.querySelector('.page-content');
      return content.scrollHeight <= content.clientHeight + 2 && page.scrollHeight <= page.clientHeight + 2;
    });
    animated = !reducedMotion.matches && fits;
    notebook.classList.toggle('is-animated', animated);
    notebook.dataset.mode = animated ? 'turning' : 'reading';
    controls.hidden = !animated;
    if (animated) {
      step = innerHeight * 1.05;
      start = scrollY + notebook.getBoundingClientRect().top - header.offsetHeight;
      notebook.style.height = `${step * (pages.length - 1) + Math.max(sticky.offsetHeight, innerHeight - header.offsetHeight)}px`;
    }
    selectPage(current);
    // Preserve the reader's sheet if a resize changes the layout mode.
    if (wasAnimated !== animated && scrollY > header.offsetHeight) navigate(oldCurrent, 'instant');
    render();
  }

  function navigate(index, behavior = reducedMotion.matches ? 'instant' : 'smooth') {
    const safeIndex = clamp(index, 0, pages.length - 1);
    const top = animated ? start + step * safeIndex : scrollY + pages[safeIndex].getBoundingClientRect().top - header.offsetHeight - 14;
    window.scrollTo({ top: Math.max(0, top), behavior });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', event => {
      event.preventDefault();
      history.replaceState(null, '', tab.hash);
      navigate(index);
    });
  });
  previous.addEventListener('click', () => navigate(current - 1));
  next.addEventListener('click', () => navigate(current + 1));
  window.addEventListener('scroll', scheduleRender, { passive: true });
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(configure, 120);
  });
  reducedMotion.addEventListener('change', configure);
  // Translated text can take more space; measure it before deciding whether to pin.
  new MutationObserver(() => requestAnimationFrame(configure)).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  function restoreHash() {
    const index = pages.findIndex(page => `#${page.id}` === location.hash);
    if (index >= 0) navigate(index, 'instant');
  }
  window.addEventListener('hashchange', restoreHash);
  configure();
  document.fonts.ready.then(() => { configure(); restoreHash(); });
})();
