// Scroll-driven record shelf: covers spin past like a cover-flow, the active
// record slides its vinyl out and spins, and a line of text lights up word by word.
(() => {
  const shelf = document.querySelector('[data-shelf]');
  if (!shelf) return;

  const head = shelf.querySelector('[data-shelf-head]');
  const records = [...shelf.querySelectorAll('[data-record]')];
  const discs = records.map((r) => r.querySelector('[data-disc]'));
  const quoteEl = shelf.querySelector('[data-quote-out]');
  const nowEl = shelf.querySelector('.shelf__now');
  const nowTitle = shelf.querySelector('[data-now-title]');
  const nowMeta = shelf.querySelector('[data-now-meta]');
  const n = records.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = (t) => t * t * t * (t * (t * 6 - 15) + 10); // smootherstep
  const range = (v, a, b) => clamp((v - a) / (b - a), 0, 1);

  // Pre-split each quote into word spans once.
  const quotes = records.map((r) => r.dataset.quote.split(/\s+/));
  let shownQuote = -1;
  let shownNow = -1;
  let words = [];

  function showQuote(i) {
    if (i === shownQuote) return;
    const first = shownQuote === -1;
    shownQuote = i;
    const swap = () => {
      quoteEl.innerHTML = '';
      words = quotes[i].map((w, k) => {
        const s = document.createElement('span');
        s.className = 'w';
        s.textContent = w;
        quoteEl.append(s, k < quotes[i].length - 1 ? ' ' : '');
        return s;
      });
      quoteEl.classList.remove('is-swapping');
      render(true);
    };
    if (first) return swap();
    quoteEl.classList.add('is-swapping');
    setTimeout(swap, 220);
  }

  function showNow(i) {
    if (i === shownNow) return;
    const first = shownNow === -1;
    shownNow = i;
    const swap = () => {
      nowTitle.textContent = records[i].dataset.title;
      nowMeta.textContent = records[i].dataset.meta;
      nowEl.classList.remove('is-swapping');
    };
    if (first) return swap();
    nowEl.classList.add('is-swapping');
    setTimeout(swap, 220);
  }

  let target = 0;
  let current = 0;
  let raf = 0;
  let size = 300;
  let lastFill = -1;

  function measure() {
    size = records[0].offsetWidth || 300;
    readTarget();
    current = target;
    render(true);
  }

  function readTarget() {
    const rect = shelf.getBoundingClientRect();
    const total = Math.max(1, shelf.offsetHeight - innerHeight);
    target = clamp(-rect.top / total, 0, 1);
  }

  const INTRO = 0.08; // portion of the run where the heading fades away

  function render(force) {
    const p = current;
    const intro = ease(range(p, 0, INTRO));

    // Which record is "playing" and how far along its segment we are.
    const q = range(p, INTRO, 1) * n;
    const i = Math.min(n - 1, Math.floor(q));
    const f = i === n - 1 ? clamp(q - i, 0, 1) : q - i;
    const move = i < n - 1 ? ease(range(f, 0.72, 1)) : 0;
    const a = i + move;
    const fill = range(f, 0.04, i < n - 1 ? 0.62 : 0.7);

    head.style.opacity = (1 - intro).toFixed(3);
    head.style.transform = `translate3d(0, ${(-50 * intro).toFixed(1)}px, 0)`;

    const spacing = size * 0.78;
    const spin = reduce.matches ? 0 : p * 1400;

    records.forEach((rec, j) => {
      const d = j - a;
      const ad = Math.abs(d);
      const sign = Math.sign(d);
      const out = clamp(1 - ad * 1.8, 0, 1) * intro;
      const x = d * spacing + sign * Math.min(1, ad) * size * 0.32 - out * size * 0.2;
      const z = -Math.min(ad, 2) * size * 0.55;
      const ry = -clamp(d, -1.4, 1.4) * 40;
      // Before the intro ends the covers sit closer together, flat on a shelf.
      const gather = 1 - intro;
      const fx = x * (1 - gather * 0.35);
      const fy = gather * size * 0.06;
      rec.style.transform = `translate3d(${fx.toFixed(1)}px, ${fy.toFixed(1)}px, ${z.toFixed(1)}px) rotateY(${(ry * (1 - gather * 0.5)).toFixed(2)}deg)`;
      rec.style.zIndex = String(100 - Math.round(ad * 10));
      rec.style.filter = ad > 0.5 ? `brightness(${(1 - Math.min(ad, 1.5) * 0.28).toFixed(3)})` : '';
      discs[j].style.setProperty('--out', `${(out * 52).toFixed(2)}%`);
      discs[j].style.setProperty('--spin', `${(spin * out).toFixed(1)}deg`);
    });

    const playing = Math.round(a);
    const lit01 = playing === i ? fill : 0;
    showNow(playing);
    showQuote(playing);
    if (force || Math.abs(lit01 - lastFill) > 0.001) {
      lastFill = lit01;
      const lit = Math.round(lit01 * words.length);
      words.forEach((w, k) => w.classList.toggle('is-lit', k < lit));
    }
  }

  function tick() {
    const k = reduce.matches ? 1 : 0.14;
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.0002) current = target;
    render(false);
    raf = current === target ? 0 : requestAnimationFrame(tick);
  }

  function onScroll() {
    readTarget();
    if (!raf) raf = requestAnimationFrame(tick);
  }

  measure();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', measure);
  document.fonts?.ready.then(measure);
})();
