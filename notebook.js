(() => {
  const notebook = document.querySelector('[data-notebook]');
  if (!notebook) return;
  const pages = [...notebook.querySelectorAll('[data-notebook-page]')];
  const tabs = [...notebook.querySelectorAll('[data-notebook-tab]')];
  const header = document.querySelector('.notebook-header');
  const sticky = notebook.querySelector('.notebook-sticky');
  const stack = notebook.querySelector('.notebook-stack');
  const controls = notebook.querySelector('[data-page-controls]');
  const previous = notebook.querySelector('[data-page-previous]');
  const next = notebook.querySelector('[data-page-next]');
  const counter = notebook.querySelector('[data-page-counter]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const compact = matchMedia('(max-width: 359px), (max-height: 649px)');
  let engine, animated = false, configuring = false, current = 0, destination = 0;
  let step = 1, start = 0, frame = 0;
  const clamp = (value, low = 0, high = pages.length - 1) => Math.max(low, Math.min(high, value));

  function selectPage(index) {
    current = index;
    notebook.dataset.activePage = String(index);
    tabs.forEach((tab, position) => {
      if (position === index) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
    });
    // Move focus outside a page before making it unavailable to the keyboard.
    if (animated && pages.some((page, position) => position !== index && page.contains(document.activeElement))) {
      tabs[index].focus({ preventScroll: true });
    }
    pages.forEach((page, position) => {
      page.inert = animated && position !== index;
      if (page.inert) page.setAttribute('aria-hidden', 'true');
      else page.removeAttribute('aria-hidden');
    });
    previous.disabled = index === 0;
    next.disabled = index === pages.length - 1;
    counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(pages.length).padStart(2, '0')}`;
  }

  // Portrait folds use temporary visual copies. Keep them out of navigation,
  // translation targets and the accessibility tree, with no duplicate IDs.
  new MutationObserver(records => {
    for (const record of records) for (const node of record.addedNodes) {
      if (!(node instanceof HTMLElement) || !node.matches('.stf__item') || pages.includes(node)) continue;
      node.inert = true;
      node.setAttribute('aria-hidden', 'true');
      for (const element of [node, ...node.querySelectorAll('*')]) {
        element.removeAttribute('id');
        for (const attribute of [...element.attributes]) {
          if (attribute.name.startsWith('data-') || ['aria-controls', 'aria-live', 'aria-labelledby'].includes(attribute.name)) element.removeAttribute(attribute.name);
        }
      }
    }
  }).observe(stack, { childList: true, subtree: true });

  function scrollProgress() { return clamp((scrollY - start) / step); }
  function advance() {
    if (!animated || configuring || engine.getState() !== 'read' || destination === current) return;
    // Finish a physical fold before following the latest destination. Repeated
    // input never restarts the same sheet or queues obsolete turns.
    if (destination > current) engine.flipNext('bottom');
    else engine.flipPrev('bottom');
  }
  function render() {
    frame = 0;
    if (configuring) return;
    if (animated) {
      destination = Math.round(scrollProgress());
      advance();
    } else {
      const line = header.offsetHeight + innerHeight * .3;
      const index = pages.reduce((found, page, position) => page.getBoundingClientRect().top < line ? position : found, 0);
      if (index !== current) selectPage(index);
    }
  }
  function scheduleRender() { if (!frame) frame = requestAnimationFrame(render); }

  function configure() {
    if (configuring) return;
    configuring = true;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    const wasAnimated = animated;
    const oldProgress = animated ? scrollProgress() : current;
    const oldCurrent = current;
    const wasScrolled = scrollY > header.offsetHeight;
    const readingOffset = pages[current].getBoundingClientRect().top - header.offsetHeight;
    if (engine) {
      const renderer = engine.getRender();
      renderer.finishAnimation();
      renderer.setLeftPage(null);
      renderer.setRightPage(null);
      renderer.setBottomPage(null);
      renderer.setFlippingPage(null);
      renderer.clearShadow();
      engine.clear();
    }
    notebook.classList.remove('is-animated');
    notebook.style.removeProperty('height');
    notebook.style.setProperty('--header-height', `${header.offsetHeight}px`);
    stack.removeAttribute('style');
    pages.forEach(page => {
      page.className = 'notebook-page';
      page.removeAttribute('style');
      page.inert = false;
      page.removeAttribute('aria-hidden');
    });
    const canAnimate = !!window.St && !reducedMotion.matches && !compact.matches;
    notebook.classList.toggle('is-measuring', canAnimate);
    const fits = canAnimate && pages.every(page => {
      const content = page.querySelector('.paper-content');
      return content.scrollHeight <= content.clientHeight + 2 && page.scrollHeight <= page.clientHeight + 2;
    });
    notebook.classList.remove('is-measuring');
    animated = fits;
    notebook.classList.toggle('is-animated', animated);
    notebook.dataset.mode = animated ? 'turning' : 'reading';
    controls.hidden = !animated;
    if (animated) {
      const width = stack.clientWidth;
      const height = stack.clientHeight;
      if (!engine) {
        engine = new St.PageFlip(stack, {
          width, height, size: 'fixed', usePortrait: true, autoSize: false,
          showCover: false, drawShadow: true, maxShadowOpacity: .22,
          flippingTime: 760, useMouseEvents: false, mobileScrollSupport: true,
          showPageCorners: false,
        });
        engine.on('flip', event => { if (!configuring) selectPage(event.data); });
        engine.on('changeState', event => {
          notebook.dataset.turning = event.data === 'flipping' ? 'true' : 'false';
          if (event.data === 'read') scheduleRender();
        });
        engine.loadFromHTML(pages);
      } else {
        Object.assign(engine.getSettings(), { width, height });
        engine.updateFromHtml(pages);
        engine.update();
      }
      // The library pairs the last odd page as a hard cover; this notebook
      // consists of three soft paper sheets, including the final one.
      pages.forEach((_, index) => engine.getPage(index).setDensity('soft'));
      stack.style.minWidth = '0';
      engine.turnToPage(oldCurrent);
      step = innerHeight * .9;
      start = scrollY + notebook.getBoundingClientRect().top - header.offsetHeight;
      notebook.style.height = `${step * (pages.length - 1) + Math.max(sticky.offsetHeight, innerHeight - header.offsetHeight)}px`;
    }
    selectPage(oldCurrent);
    configuring = false;
    if (wasAnimated && animated) window.scrollTo({ top: Math.max(0, start + step * oldProgress), behavior: 'instant' });
    else if (wasAnimated !== animated && wasScrolled) navigate(oldCurrent, 'instant');
    else if (!animated && wasScrolled) window.scrollTo({ top: scrollY + pages[oldCurrent].getBoundingClientRect().top - header.offsetHeight - readingOffset, behavior: 'instant' });
    scheduleRender();
  }

  function navigate(index, behavior = reducedMotion.matches ? 'instant' : 'smooth') {
    const safeIndex = clamp(index);
    const top = animated ? start + step * safeIndex : scrollY + pages[safeIndex].getBoundingClientRect().top - header.offsetHeight - 12;
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
    resizeTimer = setTimeout(configure, 150);
  });
  reducedMotion.addEventListener('change', configure);
  new MutationObserver(() => requestAnimationFrame(configure)).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  function restoreHash() {
    const index = pages.findIndex(page => `#${page.id}` === location.hash);
    if (index >= 0) navigate(index, 'instant');
  }
  window.addEventListener('hashchange', restoreHash);
  document.fonts.ready.then(() => { configure(); restoreHash(); });
})();
