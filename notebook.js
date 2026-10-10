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
  const leaf = notebook.querySelector('[data-turning-leaf]');
  const front = notebook.querySelector('[data-leaf-front]');
  const back = notebook.querySelector('[data-leaf-back]');
  const castShadow = notebook.querySelector('.book-cast-shadow');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const narrowScreen = matchMedia('(max-width: 680px)');
  let animated = false, current = 0, step = 1, start = 0, frame = 0;
  let displayedProgress = 0, lastTime = 0, leafIndex = -1;
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

  function snapshot(source) {
    const copy = source.cloneNode(true);
    // The leaf is a visual snapshot. Only the original spread can receive focus.
    for (const element of [copy, ...copy.querySelectorAll('*')]) {
      element.removeAttribute('id');
      for (const attribute of [...element.attributes]) {
        if (attribute.name.startsWith('data-') || ['aria-controls', 'aria-live', 'aria-labelledby'].includes(attribute.name)) element.removeAttribute(attribute.name);
      }
    }
    return copy;
  }

  function refreshLeaf(index) {
    front.replaceChildren(snapshot(pages[index].querySelector('.paper-half--right')));
    back.replaceChildren(snapshot(pages[index + 1].querySelector('.paper-half--left')));
    leafIndex = index;
  }

  function rest(index) {
    pages.forEach((page, position) => {
      page.classList.toggle('is-visible', position === index);
      page.classList.remove('is-left-only', 'is-right-only');
    });
    leaf.classList.remove('is-turning');
    castShadow.style.setProperty('--cast-shadow', '0');
    notebook.dataset.turn = '0';
    leafIndex = -1;
    if (index !== current) selectPage(index);
  }

  function draw(progress) {
    const segment = Math.min(pages.length - 2, Math.floor(progress));
    const turn = clamp((progress - segment - .24) / .72);
    if (progress >= pages.length - 1 - .0001 || turn >= .9999) { rest(segment + 1); return; }
    if (turn <= .0001) { rest(segment); return; }
    if (leafIndex !== segment) refreshLeaf(segment);
    pages.forEach((page, index) => {
      page.classList.toggle('is-visible', index === segment || index === segment + 1);
      page.classList.toggle('is-left-only', index === segment);
      page.classList.toggle('is-right-only', index === segment + 1);
    });
    const eased = turn * turn * (3 - 2 * turn);
    const lift = Math.sin(eased * Math.PI);
    leaf.classList.add('is-turning');
    leaf.style.transform = `rotateY(${-180 * eased}deg) skewY(${lift * .16}deg) scaleY(${1 - lift * .105})`;
    leaf.style.setProperty('--leaf-shade', String(lift * .8));
    castShadow.classList.toggle('is-left', eased > .5);
    castShadow.style.setProperty('--cast-shadow', String(lift * .65));
    castShadow.style.setProperty('--shadow-width', String(.25 + .75 * Math.abs(Math.cos(eased * Math.PI))));
    notebook.dataset.turn = turn.toFixed(3);
    const active = segment + (turn >= .5 ? 1 : 0);
    if (active !== current) selectPage(active);
  }

  function targetProgress() { return clamp((scrollY - start) / step, 0, pages.length - 1); }
  function render(now) {
    frame = 0;
    if (!animated) {
      const line = header.offsetHeight + innerHeight * .3;
      const index = pages.reduce((found, page, position) => page.getBoundingClientRect().top < line ? position : found, 0);
      if (index !== current) selectPage(index);
      return;
    }
    const target = targetProgress();
    const elapsed = lastTime ? clamp(now - lastTime, 1, 64) : 16;
    lastTime = now;
    // Frame-rate-independent damping smooths wheel and trackpad input.
    displayedProgress += (target - displayedProgress) * (1 - Math.exp(-elapsed / 85));
    if (Math.abs(target - displayedProgress) < .0001) displayedProgress = target;
    draw(displayedProgress);
    if (displayedProgress !== target) frame = requestAnimationFrame(render);
    else lastTime = 0;
  }
  function scheduleRender() { if (!frame) frame = requestAnimationFrame(render); }

  function configure() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
    const wasAnimated = animated;
    const oldCurrent = current;
    const oldProgress = animated ? targetProgress() : current;
    const wasScrolled = scrollY > header.offsetHeight;
    const readingOffset = pages[oldCurrent].getBoundingClientRect().top - header.offsetHeight;
    notebook.style.setProperty('--header-height', `${header.offsetHeight}px`);
    notebook.style.removeProperty('height');
    const canAnimate = !reducedMotion.matches && !narrowScreen.matches;
    notebook.classList.toggle('is-animated', canAnimate);
    pages.forEach(page => page.classList.add('is-visible'));
    const fits = canAnimate && [...notebook.querySelectorAll('.book-spread > .paper-half')].every(half => {
      const content = half.querySelector('.page-content');
      return content.scrollHeight <= content.clientHeight + 2 && half.scrollHeight <= half.clientHeight + 2;
    });
    animated = fits;
    notebook.classList.toggle('is-animated', animated);
    notebook.dataset.mode = animated ? 'turning' : 'reading';
    controls.hidden = !animated;
    leafIndex = -1;
    leaf.classList.remove('is-turning');
    pages.forEach(page => page.classList.remove('is-left-only', 'is-right-only'));
    if (animated) {
      step = innerHeight * 1.1;
      start = scrollY + notebook.getBoundingClientRect().top - header.offsetHeight;
      notebook.style.height = `${step * (pages.length - 1) + Math.max(sticky.offsetHeight, innerHeight - header.offsetHeight)}px`;
    }
    selectPage(current);
    if (wasAnimated && animated) window.scrollTo({ top: Math.max(0, start + step * oldProgress), behavior: 'instant' });
    else if (wasAnimated !== animated && wasScrolled) navigate(oldCurrent, 'instant');
    else if (!animated && wasScrolled) window.scrollTo({ top: scrollY + pages[oldCurrent].getBoundingClientRect().top - header.offsetHeight - readingOffset, behavior: 'instant' });
    if (animated) {
      displayedProgress = targetProgress();
      draw(displayedProgress);
    } else {
      pages.forEach(page => page.classList.add('is-visible'));
      scheduleRender();
    }
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
  new MutationObserver(() => requestAnimationFrame(configure)).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  function restoreHash() {
    const index = pages.findIndex(page => `#${page.id}` === location.hash);
    if (index >= 0) navigate(index, 'instant');
  }
  window.addEventListener('hashchange', restoreHash);
  configure();
  document.fonts.ready.then(() => { configure(); restoreHash(); });
})();
