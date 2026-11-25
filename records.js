// Record row (cover flow): the selected record faces you, the rest fold away on
// both sides and stack up at the edges. Drag it with the mouse or a finger, use
// a horizontal trackpad swipe or the arrow keys; it settles with a spring.
// Picking a record opens its info section, which is hidden until then.
(() => {
  const shelf = document.querySelector('[data-shelf]');
  if (!shelf) return;

  const row = shelf.querySelector('[data-row]');
  const nowEl = shelf.querySelector('.shelf__now');
  const nowTitle = shelf.querySelector('[data-now-title]');
  const nowMeta = shelf.querySelector('[data-now-meta]');
  const quoteEl = shelf.querySelector('[data-quote-out]');
  const originals = [...row.querySelectorAll('[data-record]')];
  const tracks = [...document.querySelectorAll('.track')];
  const n = originals.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mod = (v, m) => ((v % m) + m) % m;

  // Critically damped spring, stepped at a fixed rate for stability.
  class Spring {
    constructor(value, response) { this.value = this.target = value; this.v = 0; this.response = response; }
    set(x) { this.value = this.target = x; this.v = 0; }
    get settled() { return this.value === this.target && this.v === 0; }
    step(dt) {
      if (this.settled) return;
      const w = (2 * Math.PI) / this.response;
      for (let t = dt; t > 0; t -= 1 / 240) {
        const h = Math.min(t, 1 / 240);
        this.v += (-w * w * (this.value - this.target) - 2 * w * this.v) * h;
        this.value += this.v * h;
      }
      if (Math.abs(this.value - this.target) < 4e-4 && Math.abs(this.v) < 4e-3) { this.value = this.target; this.v = 0; }
    }
  }

  // Repeat the covers so the row is full on both sides, as on a real shelf.
  const copies = Math.max(1, Math.ceil(12 / n));
  const M = n * copies;
  const slots = [];
  for (let c = 0; c < copies; c++) {
    originals.forEach((rec, j) => {
      const el = c === 0 ? rec : rec.cloneNode(true);
      if (c > 0) { el.setAttribute('aria-hidden', 'true'); el.tabIndex = -1; row.append(el); }
      el.dataset.slot = String(c * n + j);
      el.draggable = false;
      el.querySelectorAll('img').forEach((img) => { img.draggable = false; });
      slots.push({ el, shade: el.querySelector('.record__shade') });
    });
  }
  const wrap = (d) => d - M * Math.round(d / M); // shortest signed distance around the loop
  const indexAt = (p) => mod(Math.round(p), M) % n;

  /* ---------- Info sections: hidden until a record is picked ---------- */
  function openSection(id, scroll = true) {
    const target = tracks.find((t) => t.id === id);
    if (!target) return false;
    tracks.forEach((t) => t.classList.toggle('is-open', t === target));
    if (location.hash !== `#${id}`) history.replaceState(null, '', `#${id}`);
    if (scroll) target.scrollIntoView({ behavior: reduce.matches ? 'auto' : 'smooth', block: 'start' });
    const j = originals.findIndex((r) => r.getAttribute('href') === `#${id}`);
    if (j >= 0 && indexAt(pos.target) !== j) goToIndex(j);
    return true;
  }

  // Any in-page link to a section (top nav, links inside the page) opens it too.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || row.contains(a)) return;
    if (openSection(a.getAttribute('href').slice(1))) e.preventDefault();
  });
  addEventListener('hashchange', () => openSection(location.hash.slice(1)));

  /* ---------- Layout ---------- */
  let g = 300, spread = 0, stack = 0;
  function measure() {
    g = originals[0].offsetWidth || 300;
    spread = g * 0.66;
    stack = g * (row.clientWidth > 760 ? 0.36 : 0.26);
  }

  function flow(e) {
    const a = Math.abs(e), sg = Math.sign(e);
    const r = Math.min(a, 1);
    const i = Math.max(0, a - 1);
    const o = Math.max(0, i - 2);
    const s = i - o + 0.6 * (1 - Math.exp(-o / 0.6)); // covers bunch up past the third
    return {
      x: sg * (r * spread + Math.sin(Math.PI * r) * g * 0.05 + s * stack),
      yaw: -sg * r * 60,
      scale: 1 - r * 0.14 - Math.min(o, 1) * 0.04,
      shade: r * 0.38 + Math.min(i, 2) * 0.12 + 0.38 * Math.min(1, (o / Math.max(0.5, M / 2 - 3)) * 1.6),
      alpha: clamp((M / 2 - a) * 2, 0, 1),
      z: 1000 - Math.round(a),
    };
  }

  /* ---------- State + rendering ---------- */
  const pos = new Spring(0, 0.5);
  let shown = -1;

  function showNow(i) {
    if (i === shown) return;
    const first = shown === -1;
    shown = i;
    const swap = () => {
      nowTitle.textContent = originals[i].dataset.title;
      nowMeta.textContent = originals[i].dataset.meta;
      nowEl.classList.remove('is-swapping');
    };
    if (first) return swap();
    nowEl.classList.add('is-swapping');
    setTimeout(swap, 160);
  }

  // Each record's line lights up word by word once it settles at the front.
  const quotes = originals.map((r) => (r.dataset.quote || '').split(/\s+/).filter(Boolean));
  let shownQuote = -1, litTimer = 0, swapTimer = 0;
  function showQuote(i) {
    if (i === shownQuote) return;
    shownQuote = i;
    clearInterval(litTimer);
    clearTimeout(swapTimer);
    quoteEl.classList.add('is-swapping');
    swapTimer = setTimeout(() => {
      quoteEl.textContent = '';
      const words = quotes[i].map((w, k) => {
        const s = document.createElement('span');
        s.className = 'w';
        s.textContent = w;
        quoteEl.append(s, k < quotes[i].length - 1 ? ' ' : '');
        return s;
      });
      quoteEl.classList.remove('is-swapping');
      if (reduce.matches) return words.forEach((w) => w.classList.add('is-lit'));
      let k = 0;
      litTimer = setInterval(() => {
        if (k >= words.length) return clearInterval(litTimer);
        words[k++].classList.add('is-lit');
      }, 70);
    }, 200);
  }

  function place() {
    slots.forEach((s, k) => {
      const e = wrap(k - pos.value);
      const f = flow(e);
      s.el.style.transform = `translate3d(${f.x.toFixed(2)}px, 0, 0) perspective(${(g * 2.6).toFixed(0)}px) rotateY(${f.yaw.toFixed(3)}deg) scale(${f.scale.toFixed(4)})`;
      s.el.style.opacity = f.alpha.toFixed(3);
      s.el.style.pointerEvents = f.alpha < 0.2 ? 'none' : '';
      s.el.style.zIndex = String(f.z);
      s.shade.style.opacity = f.shade.toFixed(3);
      s.el.classList.toggle('is-front', Math.abs(e) < 0.5);
    });
    showNow(indexAt(pos.target));
    if (!dragging && Math.abs(pos.value - Math.round(pos.value)) < 0.12) showQuote(indexAt(pos.value));
  }

  let raf = 0, lastT = 0;
  function tick(t) {
    const dt = lastT ? Math.min(1 / 30, (t - lastT) / 1000) : 1 / 60;
    lastT = t;
    if (reduce.matches) pos.set(pos.target); else pos.step(dt);
    place();
    raf = pos.settled && !dragging ? 0 : requestAnimationFrame(tick);
  }
  const wake = () => { if (!raf) { lastT = 0; raf = requestAnimationFrame(tick); } };
  const goTo = (p) => { pos.target = Math.round(p); wake(); };
  function goToIndex(j) {
    let best = Infinity;
    for (let s = j; s < M; s += n) { const d = wrap(s - pos.target); if (Math.abs(d) < Math.abs(best)) best = d; }
    goTo(pos.target + best);
  }

  /* ---------- Drag with mouse or finger ---------- */
  let dragging = false, pointerId = null, startX = 0, startY = 0, startPos = 0, moved = false;
  let samples = [];

  row.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX; startY = e.clientY;
    samples = [{ x: e.clientX, t: performance.now() }];
    moved = false;
  });
  addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    if (!dragging) {
      const dx = e.clientX - startX;
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(e.clientY - startY)) return;
      dragging = moved = true;
      startX = e.clientX;
      startPos = pos.value;
      row.setPointerCapture?.(e.pointerId);
      shelf.classList.add('is-dragging');
    }
    const t = performance.now();
    samples.push({ x: e.clientX, t });
    while (samples.length > 2 && t - samples[0].t > 100) samples.shift();
    pos.set(startPos - (e.clientX - startX) / spread);
    wake();
  });
  const endDrag = (e) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    if (!dragging) return;
    dragging = false;
    shelf.classList.remove('is-dragging');
    const a = samples[0], b = samples[samples.length - 1];
    const vel = b.t > a.t && performance.now() - b.t < 70 ? ((b.x - a.x) / (b.t - a.t)) * 1000 : 0;
    const coast = ((vel / 1000) * 0.996) / (1 - 0.996); // where a flick would glide to
    goTo(pos.value - clamp(coast / spread, -3, 3));
  };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  // Picking a record (without dragging) brings it to the front and opens its info.
  row.addEventListener('click', (e) => {
    const el = e.target.closest('[data-record]');
    if (!el) return;
    e.preventDefault();
    if (moved) { moved = false; return; }
    goTo(pos.target + wrap(Number(el.dataset.slot) - pos.target));
    openSection(el.getAttribute('href').slice(1));
  });

  row.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    goTo(pos.value + e.deltaX / spread);
  }, { passive: false });

  shelf.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { goTo(pos.target + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { goTo(pos.target - 1); e.preventDefault(); }
  });
  originals.forEach((rec, j) => rec.addEventListener('focus', () => { if (indexAt(pos.target) !== j) goToIndex(j); }));

  measure();
  place();
  addEventListener('resize', () => { measure(); place(); });
  // Arriving with a section in the URL (e.g. from another page) opens it.
  if (location.hash) requestAnimationFrame(() => openSection(location.hash.slice(1)));
})();
