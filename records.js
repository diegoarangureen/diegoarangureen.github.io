// Record ring: the covers sit around a tilted circle with the selected one at
// the front. Drag/swipe, click any cover or use the arrow keys to spin it; it
// settles with a spring. The centre of the ring links to the selected section.
(() => {
  const shelf = document.querySelector('[data-shelf]');
  if (!shelf) return;

  const stage = shelf.querySelector('.shelf__stage');
  const ring = shelf.querySelector('[data-ring]');
  const centre = shelf.querySelector('.shelf__centre');
  const nowEl = shelf.querySelector('.shelf__now');
  const nowTitle = shelf.querySelector('[data-now-title]');
  const nowMeta = shelf.querySelector('[data-now-meta]');
  const openLink = shelf.querySelector('[data-open]');
  const originals = [...ring.querySelectorAll('[data-record]')];
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

  // Repeat the covers so the ring is full.
  const copies = Math.max(1, Math.ceil(12 / n));
  const M = n * copies;
  const slots = [];
  for (let c = 0; c < copies; c++) {
    originals.forEach((rec, j) => {
      const el = c === 0 ? rec : rec.cloneNode(true);
      if (c > 0) { el.setAttribute('aria-hidden', 'true'); el.tabIndex = -1; ring.append(el); }
      el.dataset.slot = String(c * n + j);
      el.draggable = false;
      el.querySelectorAll('img').forEach((img) => { img.draggable = false; });
      slots.push({ el, shade: el.querySelector('.record__shade') });
    });
  }
  const wrap = (d) => d - M * Math.round(d / M); // shortest signed distance on the ring
  const indexAt = (p) => mod(Math.round(p), M) % n;

  /* ---------- Layout ---------- */
  const TILT = (56 * Math.PI) / 180;
  let g = 300, R = 0, far = 0, zoom = 1, ringY = 0;

  function measure() {
    const W = stage.clientWidth;
    const H = stage.clientHeight || innerHeight;
    g = originals[0].offsetWidth || 300;
    R = (g * 1.06) / (2 * Math.sin(Math.PI / M));
    far = R * 4.2;
    const half = Math.hypot(R + g / 2, g / 2);
    const proj = (z) => far / (far - z * Math.cos(TILT));
    const down = half * Math.sin(TILT) * proj(half);
    const up = half * Math.sin(TILT) * proj(-half);
    let wide = 0;
    for (let a = 0; a <= Math.PI; a += Math.PI / 36) wide = Math.max(wide, Math.abs(half * Math.sin(a)) * proj(half * Math.cos(a)));
    const top = 72, bottom = 40;
    const avail = H - top - bottom;
    zoom = Math.min((W >= 700 ? W - 24 : W * 1.4) / (2 * wide), avail / (down + up));
    ringY = top + (avail - (down + up) * zoom) / 2 + up * zoom - H / 2; // relative to the stage centre

    // The centre text fits inside the hole of the ring.
    const hole = Math.min(W - 40, (R - g * 0.75) * zoom * 2);
    centre.style.setProperty('--hole', `${Math.max(140, hole).toFixed(1)}px`);
    centre.style.top = `${(H / 2 + ringY).toFixed(1)}px`;
  }

  /* ---------- State ---------- */
  const pos = new Spring(0, 0.5);
  let shown = -1;

  function showNow(i) {
    if (i === shown) return;
    const first = shown === -1;
    shown = i;
    const swap = () => {
      nowTitle.textContent = originals[i].dataset.title;
      nowMeta.textContent = originals[i].dataset.meta;
      openLink.href = originals[i].getAttribute('href');
      openLink.querySelector('span').textContent = originals[i].dataset.title;
      nowEl.classList.remove('is-swapping');
    };
    if (first) return swap();
    nowEl.classList.add('is-swapping');
    setTimeout(swap, 160);
  }

  function place() {
    slots.forEach((s, k) => {
      const e = wrap(k - pos.value);
      const a = Math.abs(e);
      const c = (e * 2 * Math.PI) / M;
      const depth = R * Math.cos(c);
      const k3 = (far / (far - depth * Math.cos(TILT))) * zoom;
      const x = R * Math.sin(c) * k3;
      const y = ringY + depth * Math.sin(TILT) * k3;
      s.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotateZ(${((-e * 360) / M).toFixed(3)}deg) scale(${k3.toFixed(4)})`;
      s.el.style.zIndex = String(1000 - Math.round(a * 10));
      s.shade.style.opacity = (Math.min(a, 1) * 0.14 + Math.max(0, a - 1) * 0.045).toFixed(3);
      s.el.classList.toggle('is-front', a < 0.5);
    });
    showNow(indexAt(pos.target));
  }

  /* ---------- Loop ---------- */
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

  /* ---------- Drag / swipe ---------- */
  let dragging = false, pointerId = null, startX = 0, startY = 0, startPos = 0, moved = false;
  let samples = [];
  const perSlot = () => ((2 * Math.PI * R) / M) * zoom;

  ring.addEventListener('pointerdown', (e) => {
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
      ring.setPointerCapture?.(e.pointerId);
      shelf.classList.add('is-dragging');
    }
    const t = performance.now();
    samples.push({ x: e.clientX, t });
    while (samples.length > 2 && t - samples[0].t > 100) samples.shift();
    pos.set(startPos - (e.clientX - startX) / perSlot());
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
    goTo(pos.value - clamp(coast / perSlot(), -3, 3));
  };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  // Click a cover to bring it to the front; click the front one to open its section.
  ring.addEventListener('click', (e) => {
    const el = e.target.closest('[data-record]');
    if (!el) return;
    if (moved) { e.preventDefault(); moved = false; return; }
    const slot = Number(el.dataset.slot);
    if (Math.abs(wrap(slot - pos.value)) > 0.5) {
      e.preventDefault();
      goTo(pos.target + wrap(slot - pos.target));
    }
  });

  ring.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    goTo(pos.value + e.deltaX / perSlot());
  }, { passive: false });

  shelf.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { goTo(pos.target + 1); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { goTo(pos.target - 1); e.preventDefault(); }
  });
  originals.forEach((rec, j) => rec.addEventListener('focus', () => {
    if (indexAt(pos.target) === j) return;
    let best = Infinity;
    for (let s = j; s < M; s += n) { const d = wrap(s - pos.target); if (Math.abs(d) < Math.abs(best)) best = d; }
    goTo(pos.target + best);
  }));

  measure();
  place();
  addEventListener('resize', () => { measure(); place(); });
  document.fonts?.ready.then(() => { measure(); place(); });
})();
