// Record shelf, two acts driven by scroll:
//  1. A cover-flow row: the front record faces you, the rest fold away on both
//     sides and stack up at the edges. Drag/swipe it, click any cover or use
//     the arrow keys; it settles with a spring.
//  2. Keep scrolling and the row lifts into a ring of covers. Inside the ring a
//     few lines light up as you scroll, then the page carries on.
(() => {
  const shelf = document.querySelector('[data-shelf]');
  if (!shelf) return;

  const stage = shelf.querySelector('.shelf__stage');
  const head = shelf.querySelector('[data-shelf-head]');
  const ring = shelf.querySelector('[data-ring]');
  const floor = shelf.querySelector('[data-floor]');
  const caption = shelf.querySelector('.shelf__caption');
  const nowEl = shelf.querySelector('.shelf__now');
  const nowTitle = shelf.querySelector('[data-now-title]');
  const nowMeta = shelf.querySelector('[data-now-meta]');
  const pagesBox = shelf.querySelector('[data-pages]');
  const originals = [...ring.querySelectorAll('[data-record]')];
  const n = originals.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const mod = (v, m) => ((v % m) + m) % m;
  const range = (v, a, b) => clamp((v - a) / (b - a), 0, 1);
  const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);

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

  // Repeat the covers so the shelf is full on both sides.
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
      slots.push({ el, disc: el.querySelector('[data-disc]'), shade: el.querySelector('.record__shade'), spin: 0 });
    });
  }
  const wrap = (d) => d - M * Math.round(d / M); // shortest signed distance on the ring
  const indexAt = (p) => mod(Math.round(p), M) % n;

  // Split the ring pages into words for the scroll-driven fill.
  const pages = [...pagesBox.querySelectorAll('[data-page]')].map((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    const spans = words.map((w, k) => {
      const s = document.createElement('span');
      s.className = 'w';
      s.textContent = w;
      el.append(s, k < words.length - 1 ? ' ' : '');
      return s;
    });
    return { el, spans, lines: 1, start: 0, held: 0, lit: -1 };
  });

  /* ---------- State ---------- */
  const pos = new Spring(0, 0.5);
  const scroll = new Spring(scrollY, 0.18);
  let climb = 0; // 0 = row, 1 = ring
  let cameraKey = NaN;
  let shown = -1;

  /* ---------- Layout ---------- */
  let W = 0, H = 0, g = 300, spread = 0, stack = 0;
  let R = 0, far = 0, zoom = 1, ringY = 0, captionShift = 0;
  let pre = 0, sectionTop = 0, lineRun = 0;
  const TILT = (56 * Math.PI) / 180;

  function measure() {
    W = stage.clientWidth;
    H = stage.clientHeight || innerHeight;
    g = originals[0].offsetWidth || 300;
    spread = g * 0.66;
    stack = g * (W > 760 ? 0.36 : 0.26);

    // Ring geometry, zoomed to fit between the top bar and the caption.
    R = (g * 1.06) / (2 * Math.sin(Math.PI / M));
    far = R * 4.2;
    const half = Math.hypot(R + g / 2, g / 2);
    const proj = (z) => far / (far - z * Math.cos(TILT));
    const down = half * Math.sin(TILT) * proj(half);
    const up = half * Math.sin(TILT) * proj(-half);
    let wide = 0;
    for (let a = 0; a <= Math.PI; a += Math.PI / 36) wide = Math.max(wide, Math.abs(half * Math.sin(a)) * proj(half * Math.cos(a)));
    const capH = caption.offsetHeight || 60;
    const top = 76;
    const avail = H - capH - 40 - top;
    zoom = Math.min(1, (W >= 700 ? W - 48 : W * 1.4) / (2 * wide), avail / (down + up));
    ringY = top + (avail - (down + up) * zoom) / 2 + up * zoom - H / 2; // relative to the stage centre

    // Caption sits under the row, then slides under the ring.
    caption.style.transform = '';
    captionShift = H / 2 + ringY + down * zoom + 14 - caption.offsetTop;

    // Text inside the ring.
    const textW = Math.min(W - 40, (R - g / 2) * zoom * 2 * 0.8);
    pagesBox.style.setProperty('--words-w', `${textW.toFixed(1)}px`);
    pagesBox.style.setProperty('--words-fs', `${clamp(textW / 13.5, 16, 34).toFixed(1)}px`);
    pagesBox.style.top = `${(H / 2 + ringY).toFixed(1)}px`;

    // Scroll run: the climb, then each page's lines, then a short hold.
    lineRun = H * 0.3;
    shelf.style.height = '';
    pre = Math.min(shelf.getBoundingClientRect().top + scrollY, H * 0.22);
    let run = 1.16 * H;
    pages.forEach((p, k) => {
      p.lines = Math.max(1, new Set(p.spans.map((s) => Math.round(s.offsetTop))).size);
      if (k > 0) run += 0.24 * H;
      p.start = run;
      run += (p.lines + 3 / 7) * lineRun;
      p.held = run;
    });
    run += 0.12 * H;
    if (!reduce.matches) shelf.style.height = `${Math.round(run + H)}px`;
    shelf.classList.toggle('is-static', reduce.matches);
    sectionTop = shelf.getBoundingClientRect().top + scrollY;
    scroll.set(scrollY);
    cameraKey = NaN;
  }

  /* ---------- Cover-flow placement ---------- */
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

  function camera(y) {
    if (reduce.matches) { climb = 0; return; }
    const o = y - sectionTop; // px scrolled past the section top
    climb = smoother(range(o + pre, 0, pre + 1.1 * H));
    const lift = range(climb, 0, 0.34);
    head.style.opacity = (1 - lift).toFixed(3);
    head.style.transform = lift ? `translate3d(0, ${(-56 * lift).toFixed(1)}px, 0)` : '';
    floor.style.opacity = range(climb, 0.35, 1).toFixed(3);
    caption.style.transform = climb ? `translate3d(0, ${(captionShift * climb).toFixed(1)}px, 0)` : '';

    pages.forEach((p, k) => {
      const fadeIn = k === 0 ? range(climb, 0.86, 1) : range(o, p.start - 0.12 * H, p.start);
      const fadeOut = k === pages.length - 1 ? 0 : range(o, p.held, p.held + 0.12 * H);
      p.el.style.opacity = (fadeIn * (1 - fadeOut)).toFixed(3);
      p.el.style.transform = `translate3d(0, ${((1 - fadeIn) * 12 - fadeOut * 12).toFixed(1)}px, 0)`;
      const fill = clamp((o - p.start) / (p.lines * lineRun), 0, 1) * p.spans.length;
      if (Math.abs(fill - p.lit) > 0.01) {
        p.lit = fill;
        p.spans.forEach((s, j) => s.style.setProperty('--lit', clamp(fill - j, 0, 1).toFixed(2)));
      }
    });
  }

  function place(dt) {
    const w = climb;
    const settled = pos.settled && !dragging;
    slots.forEach((s, k) => {
      const e = wrap(k - pos.value);
      const a = Math.abs(e);
      const f = flow(e);
      let { x, yaw, scale, alpha, shade } = f;
      let y = 0, roll = 0;
      if (w > 0) {
        // Ring: the front record at the bottom, the rest around a tilted circle.
        const c = (e * 2 * Math.PI) / M;
        const depth = R * Math.cos(c);
        const k3 = (far / (far - depth * Math.cos(TILT * w))) * (1 + (zoom - 1) * w);
        x = f.x + (R * Math.sin(c) * k3 - f.x) * w;
        y = (ringY + depth * Math.sin(TILT) * k3) * w;
        yaw = f.yaw * (1 - w);
        roll = ((-e * 360) / M) * w;
        scale = (f.scale + (1 - f.scale) * w) * (1 + (k3 - 1) * w);
        alpha = f.alpha + (1 - f.alpha) * w * w;
        shade = f.shade + (Math.min(a, 1) * 0.14 + Math.max(0, a - 1) * 0.045 - f.shade) * w;
      }
      s.el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) perspective(${(g * 2.6).toFixed(0)}px) rotateY(${yaw.toFixed(3)}deg) rotateZ(${roll.toFixed(3)}deg) scale(${scale.toFixed(4)})`;
      s.el.style.opacity = alpha.toFixed(3);
      s.el.style.pointerEvents = alpha < 0.2 ? 'none' : '';
      s.el.style.zIndex = String(w > 0.9 ? 1000 + (k % 2) : f.z);
      s.shade.style.opacity = shade.toFixed(3);
      s.el.classList.toggle('is-front', a < 0.5);
      const out = clamp(1 - a * 2, 0, 1) * (1 - w);
      if (!reduce.matches && settled && out > 0.5) s.spin = (s.spin + dt * 0.012) % 360;
      s.disc.style.setProperty('--out', `${(out * 34).toFixed(2)}%`);
      s.disc.style.setProperty('--spin', `${s.spin.toFixed(1)}deg`);
    });
    showNow(indexAt(pos.target));
  }

  /* ---------- Loop ---------- */
  let raf = 0, lastT = 0, visible = true;
  function tick(t) {
    const dt = lastT ? Math.min(1 / 30, (t - lastT) / 1000) : 1 / 60;
    lastT = t;
    pos.step(dt);
    if (reduce.matches) scroll.set(scrollY); else scroll.step(dt);
    if (scroll.value !== cameraKey) { cameraKey = scroll.value; camera(scroll.value); }
    place(dt * 1000);
    raf = visible ? requestAnimationFrame(tick) : 0;
  }
  const wake = () => { if (!raf) { lastT = 0; raf = requestAnimationFrame(tick); } };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) wake(); }).observe(stage);

  addEventListener('scroll', () => {
    // Jump straight there on long jumps (anchor links) so nothing lags behind.
    if (Math.abs(scrollY - scroll.value) > H * 1.5) scroll.set(scrollY); else scroll.target = scrollY;
    wake();
  }, { passive: true });

  /* ---------- Drag / swipe ---------- */
  let dragging = false, pointerId = null, startX = 0, startY = 0, startPos = 0, moved = false;
  let samples = [];
  const perSlot = () => spread * (1 - climb) + ((2 * Math.PI * R) / M) * zoom * climb;

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
    pos.target = Math.round(pos.value - clamp(coast / perSlot(), -3, 3));
    wake();
  };
  addEventListener('pointerup', endDrag);
  addEventListener('pointercancel', endDrag);

  // Click a side cover to bring it to the front; click the front one to open it.
  ring.addEventListener('click', (e) => {
    const el = e.target.closest('[data-record]');
    if (!el) return;
    if (moved) { e.preventDefault(); moved = false; return; }
    const slot = Number(el.dataset.slot);
    if (Math.abs(wrap(slot - pos.value)) > 0.5) {
      e.preventDefault();
      pos.target = Math.round(pos.target + wrap(slot - pos.target));
      wake();
    }
  });

  ring.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    pos.target = Math.round(pos.value + e.deltaX / perSlot());
    wake();
  }, { passive: false });

  shelf.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { pos.target = Math.round(pos.target) + 1; e.preventDefault(); wake(); }
    if (e.key === 'ArrowLeft') { pos.target = Math.round(pos.target) - 1; e.preventDefault(); wake(); }
  });
  originals.forEach((rec, j) => rec.addEventListener('focus', () => {
    if (indexAt(pos.target) === j) return;
    let best = Infinity;
    for (let s = j; s < M; s += n) { const d = wrap(s - pos.target); if (Math.abs(d) < Math.abs(best)) best = d; }
    pos.target = Math.round(pos.target + best);
    wake();
  }));

  measure();
  camera(scrollY);
  place(16);
  wake();
  let key = `${innerWidth}x${innerHeight}`;
  addEventListener('resize', () => {
    const k = `${innerWidth}x${innerHeight}`;
    if (k === key) return;
    key = k;
    measure();
    wake();
  });
  document.fonts?.ready.then(() => { measure(); wake(); });
  reduce.addEventListener('change', () => { measure(); wake(); });
})();
