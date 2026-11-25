// Record shelf: the covers sit on a ring that fans out on both sides of the
// one in front. Spin it by scrolling, dragging/swiping, clicking any cover,
// the arrow buttons or the arrow keys. The record in front slides its vinyl
// out and spins, and its line of text lights up word by word.
(() => {
  const shelf = document.querySelector('[data-shelf]');
  if (!shelf) return;

  const stage = shelf.querySelector('.shelf__stage');
  const ring = shelf.querySelector('[data-ring]');
  const originals = [...ring.querySelectorAll('[data-record]')];
  const quoteEl = shelf.querySelector('[data-quote-out]');
  const nowEl = shelf.querySelector('.shelf__now');
  const nowTitle = shelf.querySelector('[data-now-title]');
  const nowMeta = shelf.querySelector('[data-now-meta]');
  const n = originals.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // Repeat the covers so the ring is full on both sides, like a real shelf.
  const copies = Math.max(1, Math.ceil(12 / n));
  const M = n * copies;
  const slots = [];
  for (let c = 0; c < copies; c++) {
    originals.forEach((rec, j) => {
      const el = c === 0 ? rec : rec.cloneNode(true);
      if (c > 0) {
        el.setAttribute('aria-hidden', 'true');
        el.tabIndex = -1;
        ring.append(el);
      }
      el.dataset.slot = String(c * n + j);
      el.dataset.index = String(j);
      el.draggable = false;
      el.querySelectorAll('img').forEach((img) => { img.draggable = false; });
      slots.push({ el, disc: el.querySelector('[data-disc]'), index: j, spin: 0 });
    });
  }

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mod = (v, m) => ((v % m) + m) % m;
  const wrap = (d) => mod(d + M / 2, M) - M / 2; // shortest signed distance on the ring
  const indexAt = (p) => mod(Math.round(p), M) % n;

  let target = 0;
  let current = 0;
  let size = 300;
  let radius = 600;

  function measure() {
    size = originals[0].offsetWidth || 300;
    radius = (size * 1.22) / (2 * Math.sin(Math.PI / M));
    lastProg = scrollProgress();
  }

  /* ---------- Text: caption + word-by-word quote ---------- */
  const quotes = originals.map((r) => r.dataset.quote.split(/\s+/));
  let shownNow = -1;
  let shownQuote = -1;
  let litTimer = 0;
  let swapTimer = 0;

  function showNow(i) {
    if (i === shownNow) return;
    const first = shownNow === -1;
    shownNow = i;
    const swap = () => {
      nowTitle.textContent = originals[i].dataset.title;
      nowMeta.textContent = originals[i].dataset.meta;
      nowEl.classList.remove('is-swapping');
    };
    if (first) return swap();
    nowEl.classList.add('is-swapping');
    setTimeout(swap, 200);
  }

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

  /* ---------- Rendering ---------- */
  let raf = 0;
  let lastT = 0;
  let visible = true;

  function render(dt) {
    const settled = Math.abs(current - Math.round(current)) < 0.12;
    slots.forEach((s, k) => {
      const d = wrap(k - current);
      const ad = Math.abs(d);
      const theta = (d * 360) / M;
      const rad = (theta * Math.PI) / 180;
      const x = radius * Math.sin(rad);
      const z = radius * (Math.cos(rad) - 1);
      const out = clamp(1 - ad * 1.7, 0, 1);
      const shift = -out * size * 0.2; // keep sleeve + disc centred together
      const face = clamp((Math.cos(rad) + 0.15) / 0.45, 0, 1);
      s.el.style.transform = `translate3d(${(x + shift).toFixed(1)}px, 0, ${z.toFixed(1)}px) rotateY(${(theta * 0.85).toFixed(2)}deg)`;
      s.el.style.opacity = face.toFixed(3);
      s.el.style.visibility = face < 0.01 ? 'hidden' : '';
      s.el.style.zIndex = String(1000 - Math.round(ad * 10));
      s.el.style.filter = ad > 0.4 ? `brightness(${(1 - Math.min(ad, 3) * 0.17).toFixed(3)})` : '';
      s.el.classList.toggle('is-front', ad < 0.5);
      if (!reduce.matches && settled && out > 0.5) s.spin = (s.spin + dt * 0.2) % 360;
      s.disc.style.setProperty('--out', `${(out * 50).toFixed(2)}%`);
      s.disc.style.setProperty('--spin', `${s.spin.toFixed(1)}deg`);
    });
    showNow(indexAt(target));
    if (settled) showQuote(indexAt(current));
  }

  function tick(t) {
    const dt = lastT ? Math.min(50, t - lastT) : 16;
    lastT = t;
    const k = 1 - Math.pow(1 - (reduce.matches ? 0.3 : 0.12), dt / 16.7);
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.0005) current = target;
    render(dt);
    raf = visible ? requestAnimationFrame(tick) : 0;
  }

  function wake() {
    if (!raf) { lastT = 0; raf = requestAnimationFrame(tick); }
  }

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(stage);

  /* ---------- Snapping ---------- */
  let snapTimer = 0;
  function snapSoon(delay = 160) {
    clearTimeout(snapTimer);
    snapTimer = setTimeout(() => { if (!dragging) target = Math.round(target); }, delay);
  }

  function goToIndex(j) {
    let best = target;
    let bestD = Infinity;
    for (let s = j; s < M; s += n) {
      const d = wrap(s - target);
      if (Math.abs(d) < Math.abs(bestD)) { bestD = d; best = target + d; }
    }
    target = Math.round(best);
    wake();
  }

  /* ---------- Scroll ---------- */
  function scrollProgress() {
    const rect = shelf.getBoundingClientRect();
    const total = Math.max(1, shelf.offsetHeight - innerHeight);
    return clamp(-rect.top / total, 0, 1);
  }
  let lastProg = 0;
  addEventListener('scroll', () => {
    const p = scrollProgress();
    const delta = p - lastProg;
    lastProg = p;
    if (!delta) return;
    target += delta * (n - 1) * 1.15;
    snapSoon(140);
    wake();
  }, { passive: true });

  /* ---------- Drag / swipe ---------- */
  let dragging = false;
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startTarget = 0;
  let lastX = 0;
  let lastMoveT = 0;
  let velocity = 0;
  let moved = false;

  ring.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    pointerId = e.pointerId;
    startX = lastX = e.clientX;
    startY = e.clientY;
    startTarget = target;
    lastMoveT = performance.now();
    velocity = 0;
    moved = false;
  });

  addEventListener('pointermove', (e) => {
    if (e.pointerId !== pointerId) return;
    const dx = e.clientX - startX;
    if (!dragging) {
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(e.clientY - startY)) return;
      dragging = moved = true;
      ring.setPointerCapture?.(e.pointerId);
      shelf.classList.add('is-dragging');
    }
    const now = performance.now();
    const v = (e.clientX - lastX) / Math.max(8, now - lastMoveT);
    velocity = velocity * 0.6 + v * 0.4;
    lastX = e.clientX;
    lastMoveT = now;
    target = startTarget - dx / (size * 0.9);
    wake();
  });

  const endDrag = (e) => {
    if (e.pointerId !== pointerId) return;
    pointerId = null;
    if (!dragging) return;
    dragging = false;
    shelf.classList.remove('is-dragging');
    const fling = clamp((-velocity * 180) / (size * 0.9), -1.5, 1.5);
    target = Math.round(target + fling);
    wake();
  };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  // A click on a side cover brings it to the front; a click on the front one opens it.
  ring.addEventListener('click', (e) => {
    const el = e.target.closest('[data-record]');
    if (!el) return;
    if (moved) { e.preventDefault(); moved = false; return; }
    const d = wrap(Number(el.dataset.slot) - current);
    if (Math.abs(d) > 0.5) {
      e.preventDefault();
      target = Math.round(target + wrap(Number(el.dataset.slot) - target));
      wake();
    }
  });

  /* ---------- Wheel (horizontal trackpad swipe) ---------- */
  ring.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    target += e.deltaX / (size * 1.6);
    snapSoon(180);
    wake();
  }, { passive: false });

  /* ---------- Buttons + keyboard ---------- */
  shelf.querySelector('[data-prev]')?.addEventListener('click', () => { target = Math.round(target) - 1; wake(); });
  shelf.querySelector('[data-next]')?.addEventListener('click', () => { target = Math.round(target) + 1; wake(); });

  shelf.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { target = Math.round(target) + 1; e.preventDefault(); wake(); }
    if (e.key === 'ArrowLeft') { target = Math.round(target) - 1; e.preventDefault(); wake(); }
  });

  originals.forEach((rec, j) => rec.addEventListener('focus', () => { if (indexAt(target) !== j) goToIndex(j); }));

  measure();
  render(16);
  wake();
  addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
})();
