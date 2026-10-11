/* =========================================================
   NORINDA K. SU'UT — interactions
   GSAP 3.13 (ScrollTrigger, SplitText, DrawSVG, CustomEase, Draggable, Inertia) + Lenis
   ========================================================= */
(() => {
  'use strict';

  const { gsap } = window;
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase, Draggable, InertiaPlugin);
  CustomEase.create('weave', '0.76, 0, 0.24, 1');

  const doc = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const page = document.body.dataset.page;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ---------------- smooth scroll ---------------- */
  let lenis = null;
  if (!reduce) {
    lenis = new Lenis({ duration: 1.1, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.__lenis = lenis;
  }
  const scrollToTarget = target => {
    if (lenis) lenis.scrollTo(target, { offset: -20, duration: 1.6 });
    else (typeof target === 'string' ? $(target) : target)?.scrollIntoView();
  };

  /* ---------------- stitched drawing helper (dashed path revealed by a solid mask) ---------------- */
  let maskId = 0;
  const stitchify = (svg, sel) => {
    const paths = $$(sel, svg);
    if (!paths.length) return [];
    const vb = svg.viewBox.baseVal;
    const id = 'nm' + (++maskId);
    let defs = svg.querySelector('defs');
    if (!defs) { defs = document.createElementNS(NS, 'defs'); svg.prepend(defs); }
    const mask = document.createElementNS(NS, 'mask');
    mask.setAttribute('id', id);
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', vb.x - 40); mask.setAttribute('y', vb.y - 40);
    mask.setAttribute('width', vb.width + 80); mask.setAttribute('height', vb.height + 80);
    const drawers = paths.map(p => {
      const c = p.cloneNode(true);
      c.removeAttribute('class');
      c.setAttribute('stroke', '#fff'); c.setAttribute('stroke-width', '9'); c.setAttribute('stroke-dasharray', 'none'); c.setAttribute('fill', 'none');
      mask.appendChild(c);
      p.setAttribute('mask', `url(#${id})`);
      return c;
    });
    defs.appendChild(mask);
    gsap.set(drawers, { drawSVG: '0%' });
    return drawers;
  };

  /* ---------------- cursor ---------------- */
  const initCursor = () => {
    if (!fine || reduce) return;
    const cur = $('.cursor'), disc = $('.cursor-disc');
    if (!cur) return;
    doc.classList.add('has-cursor');
    const cx = gsap.quickTo(cur, 'x', { duration: .15, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .15, ease: 'power3' });
    const dx = gsap.quickTo(disc, 'x', { duration: .5, ease: 'power3' }), dy = gsap.quickTo(disc, 'y', { duration: .5, ease: 'power3' });
    gsap.set([cur, disc], { x: innerWidth / 2, y: innerHeight / 2 });
    window.addEventListener('pointermove', e => { cx(e.clientX); cy(e.clientY); dx(e.clientX); dy(e.clientY); });
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) { disc.textContent = t.dataset.cursor; gsap.to(disc, { scale: 1, duration: .45, ease: 'back.out(2)' }); cur.classList.add('is-hidden'); return; }
      if (e.target.closest('a, button, label, input, textarea, select')) cur.classList.add('is-link');
    });
    document.addEventListener('pointerout', e => {
      const t = e.target.closest('[data-cursor]');
      if (t && !t.contains(e.relatedTarget)) { gsap.to(disc, { scale: 0, duration: .3 }); cur.classList.remove('is-hidden'); }
      const l = e.target.closest('a, button, label, input, textarea, select');
      if (l && !l.contains(e.relatedTarget)) cur.classList.remove('is-link');
    });
  };

  /* ---------------- magnetic ---------------- */
  const initMagnetic = () => {
    if (!fine || reduce) return;
    $$('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: .8, ease: 'elastic.out(1, .45)' });
      const yTo = gsap.quickTo(el, 'y', { duration: .8, ease: 'elastic.out(1, .45)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .3); yTo((e.clientY - r.top - r.height / 2) * .4);
      });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
  };

  /* ---------------- nav ---------------- */
  const initNav = () => {
    const nav = $('.nav');
    if (!nav) return;
    const here = location.pathname.split('/').pop() || 'index.html';
    $$('.nav__links a').forEach(a => { if (a.getAttribute('href') === here) a.setAttribute('aria-current', 'page'); });
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: self => {
        const y = self.scroll();
        nav.classList.toggle('is-scrolled', y > 30);
        nav.classList.toggle('is-hidden', y > 300 && self.direction === 1 && !nav.matches(':focus-within'));
      }
    });
  };

  /* ---------------- gauze cells: loader and page transitions ---------------- */
  const cells = $('.cells');
  let cols = 0, rows = 0;
  const buildCells = () => {
    const size = 120;
    cols = Math.ceil(innerWidth / size); rows = Math.ceil(innerHeight / size);
    cells.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    cells.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    cells.replaceChildren(...Array.from({ length: cols * rows }, () => document.createElement('i')));
  };
  const openCells = (from = 'center', delay = 0) => gsap.fromTo(cells.children, { scale: 1.02 }, {
    scale: 0, duration: .6, ease: 'power3.inOut', delay,
    stagger: { grid: [rows, cols], from, amount: .55 },
    onComplete: () => { cells.classList.remove('is-active'); gsap.set(cells, { visibility: 'hidden' }); }
  });
  const closeCells = (x, y) => new Promise(resolve => {
    gsap.set(cells, { visibility: 'visible' });
    cells.classList.add('is-active');
    const idx = Math.min(cols * rows - 1, Math.floor(y / innerHeight * rows) * cols + Math.floor(x / innerWidth * cols));
    gsap.fromTo(cells.children, { scale: 0 }, { scale: 1.02, duration: .5, ease: 'power3.in', stagger: { grid: [rows, cols], from: idx, amount: .45 }, onComplete: resolve });
  });

  const initTransitions = () => {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) {
        if (url.hash) { e.preventDefault(); scrollToTarget(url.hash); history.replaceState(null, '', url.hash); }
        return;
      }
      e.preventDefault();
      sessionStorage.setItem('nks-nav', '1');
      lenis && lenis.stop();
      closeCells(e.clientX, e.clientY).then(() => { location.href = url.href; });
    });
    window.addEventListener('pageshow', e => { if (e.persisted) { gsap.set(cells.children, { scale: 0 }); gsap.set(cells, { visibility: 'hidden' }); lenis && lenis.start(); } });
  };

  const preload = () => {
    const internal = sessionStorage.getItem('nks-nav') === '1' || sessionStorage.getItem('nks-seen') === '1';
    sessionStorage.removeItem('nks-nav');
    sessionStorage.setItem('nks-seen', '1');
    const loader = $('.loader');
    const tl = gsap.timeline();
    if (internal || reduce || !loader) {
      if (loader) gsap.set(loader, { autoAlpha: 0 });
      tl.add(openCells('center', .05));
      return tl;
    }
    const letters = $$('.loader__mono span', loader);
    gsap.set(letters, { yPercent: 110 });
    gsap.set('.loader svg', { scaleX: 0, transformOrigin: 'left center' });
    gsap.set('.loader__count', { autoAlpha: 0, y: 10 });
    tl.to(letters, { yPercent: 0, duration: .9, ease: 'power4.out', stagger: .08 }, .15)
      .to('.loader svg', { scaleX: 1, duration: 1.2, ease: 'weave' }, .4)
      .to('.loader__count', { autoAlpha: 1, y: 0, duration: .6 }, .8)
      .to(letters, { yPercent: -110, duration: .6, ease: 'power3.in', stagger: .05 }, 2.0)
      .to(['.loader svg', '.loader__count'], { autoAlpha: 0, duration: .4 }, 2.0)
      .add(openCells('center'), 2.35);
    return tl;
  };

  /* ---------------- hero: the gauze you can stitch ---------------- */
  class Gauze {
    constructor(section) {
      this.sec = section;
      this.cv = $('canvas', section);
      this.ctx = this.cv.getContext('2d');
      this.g = 14;
      this.stitches = [];
      this.stars = [];
      this.last = null;
      this.lastKey = '';
      this.flip = 1;
      this.idle = 0;
      this.touched = false;
      this.running = true;
      this.sprite = this.makeSprite();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      section.addEventListener('pointermove', e => {
        const r = this.sec.getBoundingClientRect();
        this.idle = 0; this.touched = true;
        this.lay(e.clientX - r.left, e.clientY - r.top);
      });
      section.addEventListener('pointerleave', () => { this.last = null; });
      section.addEventListener('pointerdown', e => {
        if (e.target.closest('a, button')) return;
        const r = this.sec.getBoundingClientRect();
        this.star(e.clientX - r.left, e.clientY - r.top);
      });
      this.tick = this.tick.bind(this);
      gsap.ticker.add(this.tick);
    }
    resize() {
      const r = this.sec.getBoundingClientRect();
      this.w = r.width; this.h = r.height;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.cv.width = Math.round(this.w * dpr); this.cv.height = Math.round(this.h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.grid = this.makeGrid(dpr);
    }
    makeGrid(dpr) {
      const c = document.createElement('canvas');
      c.width = this.cv.width; c.height = this.cv.height;
      const x = c.getContext('2d');
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = this.g;
      for (let i = 0, px = 0; px <= this.w; px += g, i++) {
        x.strokeStyle = i % 4 === 0 ? 'rgba(31,58,143,.13)' : 'rgba(31,58,143,.065)';
        x.beginPath(); x.moveTo(px + .5, 0); x.lineTo(px + .5, this.h); x.stroke();
      }
      for (let i = 0, py = 0; py <= this.h; py += g, i++) {
        x.strokeStyle = i % 4 === 0 ? 'rgba(31,58,143,.13)' : 'rgba(31,58,143,.065)';
        x.beginPath(); x.moveTo(0, py + .5); x.lineTo(this.w, py + .5); x.stroke();
      }
      // fade the weave towards the edges, like light through gauze
      x.globalCompositeOperation = 'destination-in';
      const grd = x.createRadialGradient(this.w * .55, this.h * .42, 0, this.w * .55, this.h * .42, Math.max(this.w, this.h) * .72);
      grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(.55, 'rgba(0,0,0,.75)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = grd; x.fillRect(0, 0, this.w, this.h);
      return c;
    }
    makeSprite() {
      // one flat gold strip, the way keringkam thread lies on the gauze
      const c = document.createElement('canvas');
      c.width = 64; c.height = 22;
      const x = c.getContext('2d');
      const grd = x.createLinearGradient(0, 0, 64, 22);
      grd.addColorStop(0, '#8d6a24'); grd.addColorStop(.42, '#f6e2a6'); grd.addColorStop(.6, '#d2ad5c'); grd.addColorStop(1, '#9c7731');
      x.fillStyle = grd;
      x.beginPath(); x.moveTo(1, 11); x.lineTo(32, 1); x.lineTo(63, 11); x.lineTo(32, 21); x.closePath(); x.fill();
      x.strokeStyle = 'rgba(110,80,25,.55)'; x.lineWidth = 1; x.stroke();
      return c;
    }
    lay(x, y) {
      const g = this.g;
      if (!this.last) { this.last = { x, y }; return; }
      let dx = x - this.last.x, dy = y - this.last.y, d = Math.hypot(dx, dy);
      const step = g * .85;
      let guard = 0;
      while (d >= step && guard++ < 80) {
        const t = step / d;
        const nx = this.last.x + dx * t, ny = this.last.y + dy * t;
        const sx = Math.round(nx / g) * g, sy = Math.round(ny / g) * g;
        const key = sx + ',' + sy;
        if (key !== this.lastKey) {
          this.flip *= -1;
          this.stitches.push({ x: sx, y: sy, a: Math.atan2(dy, dx) + this.flip * .62, t: 0, life: 2.4 + Math.random() * .9, s: .9 + Math.random() * .25, glint: Math.random() < .12 });
          this.lastKey = key;
        }
        this.last = { x: nx, y: ny };
        dx = x - nx; dy = y - ny; d = Math.hypot(dx, dy);
      }
      if (this.stitches.length > 520) this.stitches.splice(0, this.stitches.length - 520);
    }
    star(x, y) {
      const g = this.g;
      this.stars.push({ x: Math.round(x / g) * g, y: Math.round(y / g) * g, t: 0 });
      if (this.stars.length > 40) this.stars.shift();
    }
    autopilot(time) {
      // when nobody is stitching, a thread wanders slowly through the open gauze
      const t = time * .32;
      const x = this.w * (.535 + .075 * Math.sin(t * 1.1));
      const y = this.h * (.72 + .11 * Math.sin(t * 2.2 + .6));
      this.lay(x, y);
    }
    drawStar(st) {
      const ctx = this.ctx, g = this.g;
      const k = Math.min(1, st.t / .55);
      const ease = 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
      ctx.save();
      ctx.translate(st.x, st.y);
      ctx.scale(ease, ease);
      ctx.rotate(st.t * .05);
      ctx.strokeStyle = '#c39a45';
      ctx.lineWidth = 2.4;
      ctx.setLineDash([3.5, 2.5]);
      for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4, len = i % 2 ? g * 1.05 : g * 1.75;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len); ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.fillStyle = '#1f3a8f';
      ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    tick(time, dt) {
      if (!this.running) return;
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.w, this.h);
      ctx.drawImage(this.grid, 0, 0, this.w, this.h);
      this.idle += dt;
      if (!reduce && this.idle > (this.touched ? 6000 : 900)) this.autopilot(time);
      const sec = Math.min(dt, 50) / 1000;
      const L0 = this.g * 1.25;
      for (let i = this.stitches.length - 1; i >= 0; i--) {
        const s = this.stitches[i];
        s.t += sec;
        const k = s.t / s.life;
        if (k >= 1) { this.stitches.splice(i, 1); continue; }
        const appear = Math.min(1, s.t / .16);
        const alpha = k < .55 ? 1 : 1 - (k - .55) / .45;
        const L = L0 * s.s * (.5 + .5 * appear);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.a);
        ctx.drawImage(this.sprite, -L / 2, -L * .18, L, L * .36);
        if (s.glint && k < .5) {
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = (1 - k * 2) * .8;
          ctx.fillStyle = '#fff6d8';
          ctx.beginPath(); ctx.arc(0, 0, 1.6 + 2 * (1 - k * 2), 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
      this.stars.forEach(st => { st.t += sec; this.drawStar(st); });
    }
  }

  let heroIntro = null, gauze = null;
  const initHero = () => {
    const hero = $('[data-hero]');
    if (!hero) return;
    gauze = new Gauze(hero);
    const frame = $('[data-frame]', hero);
    const name = $('.hero__name', hero);
    const split = SplitText.create($$('.hero__name .row > span', hero), { type: 'chars', charsClass: 'char' });
    const v2 = $('.frame__v2', hero);
    const fw = () => Math.min(Math.max(320, innerWidth * .25), 470);
    const fl = () => innerWidth - innerWidth * .09 - fw();
    const fh = () => hero.offsetHeight * .66;
    const ft = () => hero.offsetHeight * .17;
    gsap.set(frame, { left: fl(), top: ft(), width: fw(), height: fh(), right: 'auto', rotation: -2.5 });

    // intro
    gsap.set(split.chars, { yPercent: 110 });
    gsap.set($$('[data-hero-in]', hero), { y: 24, autoAlpha: 0 });
    gsap.set($('.frame__wood', frame), { scale: .86, autoAlpha: 0 });
    gsap.set($$('.frame__peg', frame), { scale: 0 });
    gsap.set($('.frame__hem', frame), { autoAlpha: 0 });
    gsap.set($('.frame__gauze', frame), { clipPath: 'inset(50% 50% 50% 50%)' });
    gsap.set($('.frame__tag', frame), { xPercent: -100, autoAlpha: 0 });
    gsap.set($('.frame__caption', frame), { autoAlpha: 0 });
    gsap.set('.nav', { yPercent: -100 });
    gsap.set(hero.querySelector('.hero__canvas'), { autoAlpha: 0 });

    heroIntro = gsap.timeline({ paused: true })
      .to(hero.querySelector('.hero__canvas'), { autoAlpha: 1, duration: 1.2 }, 0)
      .to(split.chars, { yPercent: 0, duration: 1.2, ease: 'power4.out', stagger: .045 }, .05)
      .to('.nav', { yPercent: 0, duration: 1, ease: 'power3.out' }, .4)
      .to($('.frame__wood', frame), { scale: 1, autoAlpha: 1, duration: 1.1, ease: 'power3.out' }, .2)
      .to($$('.frame__peg', frame), { scale: 1, duration: .8, ease: 'back.out(3)', stagger: .08 }, .7)
      .to($('.frame__hem', frame), { autoAlpha: 1, duration: .6 }, .6)
      .to($('.frame__gauze', frame), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'weave' }, .75)
      .to($('.frame__tag', frame), { xPercent: 0, autoAlpha: 1, duration: .8, ease: 'power3.out' }, 1.4)
      .to($('.frame__caption', frame), { autoAlpha: 1, duration: .6 }, 1.5)
      .to($$('[data-hero-in]', hero), { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: .1 }, .8);

    // scroll: the frame opens to fill the screen
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: hero, start: 'top top', end: '+=140%', pin: true, scrub: 1, invalidateOnRefresh: true,
        onToggle: self => { gauze.running = self.isActive || self.progress < .5; },
        onUpdate: self => { gauze.running = self.progress < .6; }
      }
    });
    tl.fromTo(frame, { left: fl, top: ft, width: fw, height: fh, rotation: -2.5 }, { left: 0, top: 0, width: () => hero.offsetWidth, height: () => hero.offsetHeight, rotation: 0, duration: 1, ease: 'power2.inOut' }, 0)
      .to($$('.frame__wood, .frame__peg, .frame__hem, .frame__tag, .frame__caption', frame), { autoAlpha: 0, duration: .3 }, .1)
      .fromTo($('.frame__gauze', frame), { top: 28, left: 28, right: 28, bottom: 28 }, { top: 0, left: 0, right: 0, bottom: 0, duration: .5 }, .1)
      .to($('.hero__inner', hero), { y: -90, autoAlpha: 0, duration: .45 }, 0)
      .to(hero.querySelector('.hero__canvas'), { autoAlpha: 0, duration: .5 }, .05)
      .to(v2, { opacity: 1, duration: .3, onStart: () => { v2.play().catch(() => {}); } }, .55)
      .to($('.frame__statement', frame), { opacity: 1, duration: .25 }, .78)
      .fromTo($('.frame__statement h2', frame), { y: 60 }, { y: 0, duration: .35, ease: 'power3.out' }, .78)
      .to({}, { duration: .3 });
    setTimeout(() => { v2.preload = 'auto'; v2.load(); }, 2500);
  };

  /* ---------------- generic reveals ---------------- */
  const veilDelay = el => (page !== 'home' && el.getBoundingClientRect().top < innerHeight) ? .7 : 0;
  const initReveals = () => {
    $$('[data-lines]').forEach(el => {
      const delay = veilDelay(el);
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true,
        onSplit: self => gsap.from(self.lines, { yPercent: 110, duration: 1.15, ease: 'power4.out', stagger: .1, delay, scrollTrigger: { trigger: el, start: 'top 86%', once: true } })
      });
    });
    $$('[data-fade]').forEach(el => gsap.from(el, { y: 36, autoAlpha: 0, duration: 1.1, ease: 'power3.out', delay: veilDelay(el) + .1, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
    $$('[data-stagger]').forEach(el => gsap.from(el.children, { y: 36, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .09, delay: veilDelay(el) + .2, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
    $$('[data-reveal]').forEach(el => {
      const media = el.querySelector('img, video');
      const tl = gsap.timeline({ delay: veilDelay(el), scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      tl.fromTo(el, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'weave' });
      if (media) tl.fromTo(media, { scale: 1.3 }, { scale: 1, duration: 1.6, ease: 'power3.out' }, 0);
    });
    $$('[data-chars]').forEach(el => {
      const s = SplitText.create(el, { type: 'words', wordsClass: 'w' });
      gsap.fromTo(s.words, { opacity: .14 }, { opacity: 1, ease: 'none', stagger: .1, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: .5 } });
    });
  };

  /* ---------------- services: image follows the pointer ---------------- */
  const initServices = () => {
    const list = $('[data-svc]');
    const float = $('.svc-float');
    if (!list || !float || !fine) return;
    const imgs = $$('img', float);
    const xTo = gsap.quickTo(float, 'x', { duration: .7, ease: 'power3' });
    const yTo = gsap.quickTo(float, 'y', { duration: .7, ease: 'power3' });
    const rTo = gsap.quickTo(float, 'rotation', { duration: .9, ease: 'power3' });
    let lastX = 0, current = -1;
    list.addEventListener('pointermove', e => {
      xTo(e.clientX + 36); yTo(e.clientY - 190);
      rTo(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * .6)); lastX = e.clientX;
    });
    $$('.svc', list).forEach(row => row.addEventListener('pointerenter', () => {
      const i = +row.dataset.img;
      if (i !== current) {
        imgs.forEach((im, k) => im.classList.toggle('is-on', k === i));
        gsap.fromTo(imgs[i], { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.25 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: .7, ease: 'power3.out' });
        current = i;
      }
      gsap.to(float, { autoAlpha: 1, scale: 1, duration: .5, ease: 'power3.out' });
    }));
    list.addEventListener('pointerleave', () => { gsap.to(float, { autoAlpha: 0, scale: .6, duration: .45 }); current = -1; });
    window.fitFaces && window.fitFaces();
  };

  /* ---------------- work rail: drag with inertia ---------------- */
  const initRail = () => {
    const rail = $('[data-rail]');
    if (!rail) return;
    const track = $('.work__track', rail);
    const bar = $('.work__progress i');
    const minX = () => Math.min(0, rail.offsetWidth - track.scrollWidth);
    const update = () => { const p = minX() ? gsap.getProperty(track, 'x') / minX() : 0; gsap.set(bar, { scaleX: .08 + .92 * gsap.utils.clamp(0, 1, p) }); };
    const skew = gsap.quickTo(track, 'skewX', { duration: .5, ease: 'power3' });
    const drag = Draggable.create(track, {
      type: 'x', inertia: true, edgeResistance: .85, bounds: { minX: minX(), maxX: 0 }, dragClickables: true,
      onDrag() { update(); skew(gsap.utils.clamp(-6, 6, -this.deltaX * .4)); },
      onThrowUpdate() { update(); skew(0); },
      onRelease() { skew(0); }
    })[0];
    window.addEventListener('resize', () => { drag.applyBounds({ minX: minX(), maxX: 0 }); update(); });
    const step = () => (track.children[0]?.offsetWidth || 340) + 34;
    const go = dir => {
      const x = gsap.utils.clamp(minX(), 0, gsap.getProperty(track, 'x') - dir * step() * 2);
      gsap.to(track, { x, duration: 1, ease: 'power3.out', onUpdate: () => { drag.update(); update(); } });
    };
    $('[data-next]')?.addEventListener('click', () => go(1));
    $('[data-prev]')?.addEventListener('click', () => go(-1));
    // cards fall into place as the section arrives
    gsap.from($$('.card', track), { y: 120, rotation: (i) => (i % 2 ? 8 : -8), autoAlpha: 0, duration: 1.2, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: rail, start: 'top 85%', once: true } });
    update();
  };

  /* ---------------- ribbons ---------------- */
  const initRibbons = () => {
    $$('[data-ribbon]').forEach(t => {
      const dir = +t.dataset.ribbon || 1;
      [...t.childNodes].forEach(n => t.appendChild(n.cloneNode(true)));
      let w = t.scrollWidth / 2, x = dir > 0 ? 0 : -w;
      window.addEventListener('resize', () => { w = t.scrollWidth / 2; });
      gsap.ticker.add(() => {
        const v = lenis ? lenis.velocity : 0;
        x -= dir * (1.1 + Math.min(Math.abs(v) * .18, 9));
        if (x <= -w) x += w;
        if (x > 0) x -= w;
        gsap.set(t, { x });
      });
    });
    const ribbons = $('.ribbons');
    if (ribbons) gsap.from($$('.ribbon', ribbons), { scaleX: 0, duration: 1.2, ease: 'weave', stagger: .15, scrollTrigger: { trigger: ribbons, start: 'top 85%', once: true } });
  };

  /* ---------------- lessons: stacked cards ---------------- */
  const initStack = () => {
    const lessons = $$('[data-stack] .lesson');
    if (!lessons.length) return;
    lessons.forEach((l, i) => {
      l.style.top = `calc(12vh + ${i * 20}px)`;
      if (i < lessons.length - 1) {
        gsap.fromTo(l, { scale: 1, filter: 'brightness(1)' }, { scale: .92, filter: 'brightness(.9)', ease: 'none', scrollTrigger: { trigger: lessons[i + 1], start: 'top bottom', end: 'top 15%', scrub: true } });
      }
      gsap.from($$('.lesson__imgs figure', l), { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.2, ease: 'weave', stagger: .15, scrollTrigger: { trigger: l, start: 'top 75%', once: true } });
    });
  };

  /* ---------------- route: Kuching to Kayseri ---------------- */
  const initRoute = () => {
    const route = $('[data-route]');
    if (!route) return;
    const svg = $('svg', route);
    const arc = $('.route__arc', svg);
    const [drawer] = stitchify(svg, '.route__arc');
    const dot = $('.route__dot', svg);
    const len = arc.getTotalLength();
    const km = $('[data-km]', route);
    const state = { p: 0 };
    gsap.set([$('.route__a', svg), $('.route__b', svg)], { autoAlpha: 0, y: 10 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: route, start: 'top 70%', once: true } });
    tl.to($('.route__a', svg), { autoAlpha: 1, y: 0, duration: .6 })
      .to(drawer, { drawSVG: '100%', duration: 2.4, ease: 'power2.inOut' }, .3)
      .to(state, {
        p: 1, duration: 2.4, ease: 'power2.inOut',
        onUpdate: () => {
          const pt = arc.getPointAtLength(state.p * len);
          dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y);
          km.textContent = Math.round(state.p * 8600).toLocaleString('en');
        }
      }, .3)
      .to($('.route__b', svg), { autoAlpha: 1, y: 0, duration: .6 }, 2.5);
  };

  /* ---------------- timeline ---------------- */
  const initTimeline = () => {
    const tl = $('[data-timeline]');
    if (!tl) return;
    gsap.to($('.timeline__line i', tl), { scaleX: 1, ease: 'none', scrollTrigger: { trigger: tl, start: 'top 85%', end: 'bottom 55%', scrub: .6 } });
    gsap.from($$('.event', tl), { y: 40, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: .12, scrollTrigger: { trigger: tl, start: 'top 80%', once: true } });
  };

  /* ---------------- quotes ---------------- */
  const initQuotes = () => {
    const sec = $('[data-quotes]');
    if (!sec) return;
    const items = $$('.quote', sec);
    const counter = $('[data-q-i]', sec);
    let i = 0, lang = 'ms', split = null, busy = false, hover = false, inView = false;
    const render = (n, animate = true) => {
      const q = $('q', items[n]);
      if (split) { split.revert(); split = null; }
      q.textContent = q.dataset[lang];
      split = SplitText.create(q, { type: 'words,chars', charsClass: 'c' });
      if (animate) gsap.from(split.chars, { yPercent: 60, autoAlpha: 0, duration: .8, ease: 'power3.out', stagger: .012 });
      gsap.fromTo($('cite', items[n]), { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: .7, delay: .3 });
    };
    const show = n => {
      if (busy || n === i) return;
      busy = true;
      const out = split ? split.chars : $('q', items[i]);
      gsap.to(out, {
        yPercent: -50, autoAlpha: 0, duration: .45, ease: 'power2.in', stagger: .006,
        onComplete: () => {
          items[i].classList.remove('is-on');
          gsap.set(out, { clearProps: 'all' });
          i = (n + items.length) % items.length;
          items[i].classList.add('is-on');
          counter.textContent = i + 1;
          render(i);
          busy = false;
        }
      });
    };
    render(0, false);
    $('[data-q-next]', sec).addEventListener('click', () => show((i + 1) % items.length));
    $('[data-q-prev]', sec).addEventListener('click', () => show((i - 1 + items.length) % items.length));
    $$('[data-lang]', sec).forEach(b => b.addEventListener('click', () => {
      if (b.dataset.lang === lang) return;
      lang = b.dataset.lang;
      $$('[data-lang]', sec).forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      render(i);
    }));
    sec.addEventListener('pointerenter', () => { hover = true; });
    sec.addEventListener('pointerleave', () => { hover = false; });
    ScrollTrigger.create({ trigger: sec, start: 'top 75%', end: 'bottom 25%', onToggle: self => { inView = self.isActive; }, onEnter: () => render(i) });
    setInterval(() => { if (inView && !hover && !document.hidden) show((i + 1) % items.length); }, 7000);
  };

  /* ---------------- footer ---------------- */
  const initFooter = () => {
    const word = $('[data-footer-word]');
    if (!word) return;
    gsap.to(word, { backgroundSize: '100% 100%', ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top 85%', end: 'bottom bottom', scrub: .6 } });
    const sw = SplitText.create(word, { type: 'chars' });
    gsap.from(sw.chars, { yPercent: 80, autoAlpha: 0, duration: 1.2, ease: 'power4.out', stagger: .05, scrollTrigger: { trigger: word, start: 'top 95%', once: true } });
  };

  /* ---------------- enquiry form ---------------- */
  const initForm = () => {
    $$('[data-enquiry]').forEach(form => {
      form.addEventListener('submit', e => {
        e.preventDefault();
        let ok = true;
        $$('[required]', form).forEach(input => {
          const field = input.closest('.field');
          const valid = input.value.trim() !== '';
          field.classList.toggle('is-invalid', !valid);
          if (!valid && ok) { input.focus(); ok = false; }
        });
        if (!ok) return;
        const name = ($('[name="name"]', form).value || '').trim().split(' ')[0];
        $('[data-done-name]', form).textContent = name || 'there';
        form.classList.add('is-sent');
        gsap.from($('.form__done', form), { y: 30, autoAlpha: 0, duration: .9, ease: 'power3.out' });
        ScrollTrigger.refresh();
      });
    });
  };

  /* ---------------- work page: filters + lightbox ---------------- */
  const initGallery = () => {
    const gallery = $('[data-gallery]');
    if (!gallery) return;
    const tiles = $$('.tile', gallery);
    $$('[data-filter]').forEach(b => b.addEventListener('click', () => {
      $$('[data-filter]').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
      const f = b.dataset.filter;
      gsap.to(tiles, { autoAlpha: 0, y: 24, duration: .3, onComplete: () => {
        tiles.forEach(t => t.classList.toggle('is-out', !(f === 'all' || t.dataset.kind === f)));
        ScrollTrigger.refresh();
        const shown = tiles.filter(t => !t.classList.contains('is-out'));
        gsap.fromTo(shown, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .05 });
        window.fitFaces && window.fitFaces();
      } });
    }));
    const lb = $('.lightbox');
    if (!lb) return;
    let idx = 0, lastFocus = null;
    const visible = () => tiles.filter(t => !t.classList.contains('is-out'));
    const fill = t => {
      const img = $('img', t);
      $('[data-l="img"]', lb).src = img.src;
      $('[data-l="img"]', lb).alt = img.alt;
      $('[data-l="title"]', lb).textContent = t.dataset.title;
      $('[data-l="text"]', lb).textContent = t.dataset.text;
      $('[data-l="meta"]', lb).textContent = t.dataset.meta;
    };
    const open = t => {
      lastFocus = document.activeElement;
      idx = visible().indexOf(t);
      fill(t);
      lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
      lenis && lenis.stop();
      gsap.to(lb, { opacity: 1, duration: .4 });
      gsap.fromTo($('[data-l="img"]', lb), { scale: .92, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: .7, ease: 'power3.out' });
      gsap.fromTo($('.lightbox__side', lb), { xPercent: 100 }, { xPercent: 0, duration: .7, ease: 'weave' });
      setTimeout(() => $('.lightbox__close', lb).focus(), 60);
    };
    const close = () => {
      gsap.to(lb, { opacity: 0, duration: .4, onComplete: () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); lastFocus && lastFocus.focus(); } });
    };
    const step = d => {
      const v = visible();
      idx = (idx + d + v.length) % v.length;
      gsap.to($('[data-l="img"]', lb), { autoAlpha: 0, x: -d * 40, duration: .25, onComplete: () => {
        fill(v[idx]);
        gsap.fromTo($('[data-l="img"]', lb), { autoAlpha: 0, x: d * 40 }, { autoAlpha: 1, x: 0, duration: .45, ease: 'power3.out' });
      } });
    };
    tiles.forEach(t => {
      t.addEventListener('click', () => open(t));
      t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(t); } });
    });
    $('.lightbox__close', lb).addEventListener('click', close);
    $('[data-l-prev]', lb).addEventListener('click', () => step(-1));
    $('[data-l-next]', lb).addEventListener('click', () => step(1));
    document.addEventListener('keydown', e => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    });
  };

  /* ---------------- faq ---------------- */
  const initFaq = () => {
    $$('.faq__item').forEach(item => {
      const btn = $('.faq__q', item), ans = $('.faq__a', item);
      btn.addEventListener('click', () => {
        const isOpen = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', isOpen);
        gsap.to(ans, { height: isOpen ? 'auto' : 0, duration: .7, ease: 'weave', onComplete: () => ScrollTrigger.refresh() });
      });
    });
  };

  /* ---------------- boot ---------------- */
  const boot = () => {
    // the browser may already have jumped to a #hash; start every page from the top, then glide there
    window.scrollTo(0, 0);
    lenis && lenis.scrollTo(0, { immediate: true, force: true });
    buildCells();
    gsap.set(cells.children, { scale: 1.02 });
    initTransitions();
    initCursor();
    initMagnetic();
    initNav();
    initHero();
    initServices();
    initRail();
    initRibbons();
    initStack();
    initRoute();
    initTimeline();
    initQuotes();
    initFooter();
    initForm();
    initGallery();
    initFaq();
    initReveals();
    window.fitFaces && window.fitFaces();

    window.scrollTo(0, 0);
    const intro = preload();
    const start = () => {
      lenis && lenis.start();
      heroIntro && heroIntro.play();
      if (page !== 'home') gsap.from('.nav', { yPercent: -100, duration: .9, ease: 'power3.out' });
      const hash = window.__hash || location.hash;
      if (hash && hash.length > 1 && $(hash)) { setTimeout(() => scrollToTarget(hash), 350); history.replaceState(null, '', hash); }
    };
    gsap.delayedCall(Math.max(.1, intro.duration() - .55), start);
    window.__nksReady = true;
  };

  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
  fontsReady.then(boot);
  window.addEventListener('load', () => { ScrollTrigger.refresh(); window.fitFaces && window.fitFaces(); });
})();
