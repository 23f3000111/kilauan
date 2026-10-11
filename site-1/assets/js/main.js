/* =========================================================
   KILAUAN — interactions
   GSAP 3.13 (ScrollTrigger, SplitText, DrawSVG, CustomEase) + Lenis
   ========================================================= */
(() => {
  'use strict';

  const { gsap } = window;
  gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase);
  CustomEase.create('silk', '0.65, 0.01, 0.05, 0.99');
  CustomEase.create('drape', '0.76, 0, 0.24, 1');

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
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
    window.__lenis = lenis;
  }
  const scrollToTarget = (target, immediate = false) => {
    if (lenis) lenis.scrollTo(target, { offset: -30, immediate, duration: 1.6 });
    else (typeof target === 'string' ? $(target) : target)?.scrollIntoView();
  };

  /* ---------------- helpers ---------------- */
  const starPath = (cx, cy, R, r2, ri) => {
    let d = '';
    for (let i = 0; i < 16; i++) {
      const a = (-90 + i * 22.5) * Math.PI / 180;
      const r = i % 2 ? ri : (i % 4 === 0 ? R : r2);
      d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2);
    }
    return d + 'Z';
  };

  // gold gradient that runs continuously across split characters
  const goldSplit = (el) => {
    el.classList.remove('gold-text');
    el.classList.add('gold-chars');
    const split = SplitText.create(el, { type: 'chars', charsClass: 'char' });
    const layout = () => {
      const w = el.scrollWidth || 1000;
      el.style.setProperty('--gw', (w * 2.4).toFixed(0) + 'px');
      split.chars.forEach(c => c.style.setProperty('--cx', c.offsetLeft + 'px'));
    };
    layout();
    el.style.setProperty('--shift', '0px');
    const loop = gsap.to(el, { '--shift': () => (el.scrollWidth * 2.4) + 'px', duration: 9, ease: 'none', repeat: -1 });
    window.addEventListener('resize', layout);
    return { chars: split.chars, loop };
  };

  // stitched drawings: a dashed "stitch" path revealed by an animated solid mask
  let maskId = 0;
  const stitchify = (svg, sel = '.st') => {
    const paths = $$(sel, svg);
    if (!paths.length) return [];
    const vb = svg.viewBox.baseVal;
    const id = 'stm' + (++maskId);
    let defs = svg.querySelector('defs');
    if (!defs) { defs = document.createElementNS(NS, 'defs'); svg.prepend(defs); }
    const mask = document.createElementNS(NS, 'mask');
    mask.setAttribute('id', id);
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('x', vb.x - 20); mask.setAttribute('y', vb.y - 20);
    mask.setAttribute('width', vb.width + 40); mask.setAttribute('height', vb.height + 40);
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('mask', `url(#${id})`);
    const drawers = paths.map(p => {
      const c = p.cloneNode(true);
      c.removeAttribute('class');
      c.setAttribute('fill', 'none');
      c.setAttribute('stroke', '#fff');
      c.setAttribute('stroke-width', '7');
      c.setAttribute('stroke-linecap', 'round');
      mask.appendChild(c);
      g.appendChild(p);
      return c;
    });
    defs.appendChild(mask);
    svg.appendChild(g);
    gsap.set(drawers, { drawSVG: '0%' });
    return drawers;
  };

  // hanging gold fringe, after the fan-shaped tassels on the Kilauan card
  const buildFringe = (svg, { spacing = 34, r = 12, sway = true } = {}) => {
    const w = Math.max(200, Math.round(svg.getBoundingClientRect().width || svg.parentElement.offsetWidth));
    const h = 54;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.innerHTML = '';
    const n = Math.floor(w / spacing);
    const off = (w - (n - 1) * spacing) / 2;
    const band = document.createElementNS(NS, 'path');
    let d1 = `M0 2`, d2 = `M0 9`;
    for (let x = 0; x <= w + spacing; x += spacing / 2) {
      const up = Math.round(x / (spacing / 2)) % 2 === 0;
      d1 += ` L${x.toFixed(1)} ${up ? 2 : 9}`;
      d2 += ` L${x.toFixed(1)} ${up ? 9 : 2}`;
    }
    band.setAttribute('d', d1 + ' ' + d2);
    band.setAttribute('fill', 'none');
    band.setAttribute('stroke', 'currentColor');
    band.setAttribute('stroke-width', '1');
    band.setAttribute('class', 'fringe__band');
    svg.appendChild(band);
    const fans = [];
    for (let i = 0; i < n; i++) {
      const cx = off + i * spacing;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'fan');
      g.setAttribute('transform', `translate(${cx.toFixed(1)} 10)`);
      let ribs = '';
      [18, 40, 62, 90, 118, 140, 162].forEach(a => {
        const t = a * Math.PI / 180;
        ribs += `M0 1.5L${(r * Math.cos(t)).toFixed(2)} ${(1.5 + r * Math.sin(t)).toFixed(2)}`;
      });
      g.innerHTML =
        `<path d="M${-r} 1.5A${r} ${r} 0 0 0 ${r} 1.5Z" fill="url(#g-gold)" stroke="#7e5f25" stroke-width=".6"/>` +
        `<path d="${ribs}" stroke="#7e5f25" stroke-width=".55" fill="none" opacity=".8"/>` +
        `<circle cx="0" cy="0" r="1.8" fill="#b0893f"/>`;
      svg.appendChild(g);
      fans.push(g);
    }
    if (sway && !reduce) {
      fans.forEach((f, i) => {
        gsap.to(f, { rotation: gsap.utils.random(3, 6), transformOrigin: '50% 0%', duration: gsap.utils.random(1.6, 2.6), ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.04 });
      });
    }
    return fans;
  };

  /* ---------------- cursor ---------------- */
  const initCursor = () => {
    if (!fine || reduce) return;
    const dot = $('.cursor'), ring = $('.cursor-ring'), label = $('.cursor-label');
    if (!dot) return;
    doc.classList.add('has-cursor');
    const dx = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3' });
    const dy = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3' });
    const rx = gsap.quickTo(ring, 'x', { duration: .55, ease: 'power3' });
    const ry = gsap.quickTo(ring, 'y', { duration: .55, ease: 'power3' });
    gsap.set([dot, ring], { x: innerWidth / 2, y: innerHeight / 2 });
    window.addEventListener('pointermove', e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); });
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor]');
      if (t) { label.textContent = t.dataset.cursor; ring.classList.add('is-label'); dot.classList.add('is-hidden'); return; }
      if (e.target.closest('a, button, [role="button"], label, input, select, textarea')) ring.classList.add('is-link');
    });
    document.addEventListener('pointerout', e => {
      const t = e.target.closest('[data-cursor]');
      if (t && !t.contains(e.relatedTarget)) { ring.classList.remove('is-label'); dot.classList.remove('is-hidden'); }
      const l = e.target.closest('a, button, [role="button"], label, input, select, textarea');
      if (l && !l.contains(e.relatedTarget)) ring.classList.remove('is-link');
    });
    document.addEventListener('pointerleave', () => gsap.to([dot, ring], { autoAlpha: 0, duration: .3 }));
    document.addEventListener('pointerenter', () => gsap.to([dot, ring], { autoAlpha: 1, duration: .3 }));
  };

  /* ---------------- magnetic ---------------- */
  const initMagnetic = () => {
    if (!fine || reduce) return;
    $$('[data-magnetic]').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: .8, ease: 'elastic.out(1, .4)' });
      const yTo = gsap.quickTo(el, 'y', { duration: .8, ease: 'elastic.out(1, .4)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - r.left - r.width / 2) * .32);
        yTo((e.clientY - r.top - r.height / 2) * .42);
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
        nav.classList.toggle('is-scrolled', y > 40);
        nav.classList.toggle('is-hidden', y > 240 && self.direction === 1 && !nav.matches(':focus-within'));
      }
    });
  };

  /* ---------------- veil: preloader & transitions ---------------- */
  const veil = $('.veil');
  const sheet = $('.veil__sheet');
  const edge = $('.veil__edge path');
  const edgeState = { c: 0 };
  const drawEdge = () => edge && edge.setAttribute('d', `M0 0 H1440 V0 Q720 ${edgeState.c.toFixed(1)} 0 0 Z`);

  const liftVeil = (delay = 0) => {
    const tl = gsap.timeline({ delay, onComplete: () => { veil.classList.remove('is-active'); gsap.set(veil, { visibility: 'hidden' }); } });
    tl.to(sheet, { yPercent: -122, duration: 1.25, ease: 'silk' }, 0)
      .to(edgeState, { c: 150, duration: .62, ease: 'power2.in', onUpdate: drawEdge }, 0)
      .to(edgeState, { c: 0, duration: .63, ease: 'power2.out', onUpdate: drawEdge }, .62);
    return tl;
  };

  const coverVeil = () => new Promise(resolve => {
    gsap.set(veil, { visibility: 'visible' });
    veil.classList.add('is-active');
    gsap.set($('.veil__mark'), { autoAlpha: 0 });
    edgeState.c = 0; drawEdge();
    gsap.timeline({ onComplete: resolve })
      .fromTo(sheet, { yPercent: -122 }, { yPercent: 0, duration: .9, ease: 'drape' }, 0)
      .to(edgeState, { c: -120, duration: .45, ease: 'power2.in', onUpdate: drawEdge }, 0)
      .to(edgeState, { c: 0, duration: .45, ease: 'power2.out', onUpdate: drawEdge }, .45);
  });

  const initTransitions = () => {
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      const samePage = url.pathname === location.pathname;
      if (samePage) {
        if (url.hash) { e.preventDefault(); scrollToTarget(url.hash); history.replaceState(null, '', url.hash); }
        return;
      }
      e.preventDefault();
      sessionStorage.setItem('kil-nav', '1');
      if (lenis) lenis.stop();
      coverVeil().then(() => { location.href = url.href; });
    });
    window.addEventListener('pageshow', e => {
      if (e.persisted) { gsap.set(sheet, { yPercent: -122 }); gsap.set(veil, { visibility: 'hidden' }); lenis && lenis.start(); }
    });
  };

  const preload = () => {
    const internal = sessionStorage.getItem('kil-nav') === '1' || sessionStorage.getItem('kil-seen') === '1';
    sessionStorage.removeItem('kil-nav');
    sessionStorage.setItem('kil-seen', '1');
    const mark = $('.veil__mark');
    if (internal || reduce) {
      gsap.set(mark, { autoAlpha: 0 });
      return liftVeil(.05);
    }
    const star = $('.veil__star'), fill = $('.veil__star-fill');
    const word = $('.veil__word span');
    const g = goldSplit(word);
    gsap.set(star, { drawSVG: '0%' });
    gsap.set(g.chars, { yPercent: 110, autoAlpha: 0 });
    gsap.set('.veil__note', { autoAlpha: 0, y: 10 });
    const tl = gsap.timeline();
    tl.to(star, { drawSVG: '100%', duration: 1.3, ease: 'power2.inOut' })
      .to($('.veil__mark svg'), { rotation: 90, duration: 1.8, ease: 'power3.inOut' }, 0)
      .to(fill, { opacity: 1, duration: .6 }, .9)
      .to(g.chars, { yPercent: 0, autoAlpha: 1, duration: .8, stagger: .045, ease: 'power3.out' }, .55)
      .to('.veil__note', { autoAlpha: 1, y: 0, duration: .6 }, 1.0)
      .to(mark, { y: -40, autoAlpha: 0, duration: .6, ease: 'power2.in' }, 2.15)
      .add(liftVeil(), 2.45);
    return tl;
  };

  /* ---------------- generic reveals ---------------- */
  // elements already on screen when the page opens wait for the veil to lift
  const veilDelay = el => (page !== 'home' && el.getBoundingClientRect().top < innerHeight) ? .85 : 0;
  const initReveals = () => {
    $$('[data-lines]').forEach(el => {
      const delay = veilDelay(el);
      SplitText.create(el, {
        type: 'lines', mask: 'lines', linesClass: 'line', autoSplit: true,
        onSplit: self => gsap.from(self.lines, {
          yPercent: 108, duration: 1.15, ease: 'power4.out', stagger: .09, delay,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true }
        })
      });
    });
    $$('[data-fade]').forEach(el => {
      gsap.from(el, { y: 36, autoAlpha: 0, duration: 1.1, ease: 'power3.out', delay: veilDelay(el) + .1, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-stagger]').forEach(el => {
      gsap.from(el.children, { y: 34, autoAlpha: 0, duration: .9, ease: 'power3.out', stagger: .09, delay: veilDelay(el) + .2, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
    $$('[data-reveal]').forEach(el => {
      const media = el.querySelector('img, video');
      const tl = gsap.timeline({ delay: veilDelay(el), scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
      tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.35, ease: 'silk' });
      if (media) tl.fromTo(media, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: 'power3.out' }, 0);
    });
    $$('[data-parallax]').forEach(el => {
      const amt = parseFloat(el.dataset.parallax) || -10;
      gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: 'none', scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-sign]').forEach(el => {
      gsap.to(el, { clipPath: 'inset(0 0% 0 0)', duration: 2.2, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    $$('[data-tilt]').forEach(el => {
      if (!fine || reduce) return;
      const rx = gsap.quickTo(el, 'rotationX', { duration: .8, ease: 'power3' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: .8, ease: 'power3' });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - .5) * 14);
        rx(-((e.clientY - r.top) / r.height - .5) * 14);
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  };

  /* ---------------- hero (home) ---------------- */
  let heroIntro = null;
  const initHero = () => {
    const hero = $('[data-hero]');
    if (!hero) return;
    const frameWrap = $('[data-hero-frame]', hero);
    const sheer = $('.hero__sheer', hero);
    const video = $('video', hero);
    const fans = buildFringe($('[data-fringe="hero"]', hero), { spacing: 30, r: 11 });
    const mark = $('[data-hero-mark]', hero);
    const g = goldSplit(mark);
    const tagline = $('[data-hero-lines]', hero);
    const tagSplit = SplitText.create(tagline, { type: 'lines', mask: 'lines', linesClass: 'line' });

    gsap.set(frameWrap, { y: 70, autoAlpha: 0 });
    gsap.set(sheer, { yPercent: 0 });
    gsap.set(video, { scale: 1.3 });
    gsap.set(fans, { rotation: -80, autoAlpha: 0, transformOrigin: '50% 0%' });
    gsap.set(g.chars, { yPercent: 70, autoAlpha: 0 });
    gsap.set(tagSplit.lines, { yPercent: 110 });
    gsap.set($$('[data-hero-fade], .hero__intro .kicker', hero), { y: 24, autoAlpha: 0 });
    gsap.set($('[data-hero-seal]', hero), { scale: 0, rotation: -120 });
    gsap.set($('[data-hero-detail]', hero), { clipPath: 'inset(0% 0% 0% 100%)' });
    gsap.set('.nav', { yPercent: -160, autoAlpha: 0 });

    heroIntro = gsap.timeline({ paused: true })
      .to('.nav', { yPercent: 0, autoAlpha: 1, duration: 1.1, ease: 'power3.out' }, .5)
      .to(frameWrap, { y: 0, autoAlpha: 1, duration: 1.3, ease: 'power3.out' }, 0)
      .to(sheer, { yPercent: -102, duration: 1.6, ease: 'silk' }, .35)
      .to(video, { scale: 1, duration: 2.2, ease: 'power3.out' }, .35)
      .to(fans, { rotation: 0, autoAlpha: 1, duration: 1.4, ease: 'elastic.out(1, .35)', stagger: { each: .025, from: 'center' } }, 1.0)
      .to(g.chars, { yPercent: 0, autoAlpha: 1, duration: 1.3, ease: 'power4.out', stagger: .07 }, .55)
      .to($('.hero__intro .kicker', hero), { y: 0, autoAlpha: 1, duration: .9, ease: 'power3.out' }, .7)
      .to(tagSplit.lines, { yPercent: 0, duration: 1.2, ease: 'power4.out', stagger: .12 }, .8)
      .to($$('[data-hero-fade]', hero), { y: 0, autoAlpha: 1, duration: 1, ease: 'power3.out', stagger: .12 }, 1.15)
      .to($('[data-hero-seal]', hero), { scale: 1, rotation: 0, duration: 1.4, ease: 'back.out(1.6)' }, 1.3)
      .to($('[data-hero-detail]', hero), { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'silk' }, 1.1);

    // scroll: the hero drifts apart as you leave it
    gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
      .to(mark, { yPercent: -22, ease: 'none' }, 0)
      .to(frameWrap, { y: -90, ease: 'none' }, 0)
      .to($('[data-hero-detail]', hero), { y: -200, ease: 'none' }, 0)
      .to($('.hero__intro', hero), { y: -60, autoAlpha: .2, ease: 'none' }, 0);

    // pointer: a gentle depth shift
    if (fine && !reduce) {
      const items = [
        [frameWrap, 16, 10], [$('[data-hero-detail]', hero), 30, 18], [$('[data-hero-seal]', hero), 24, 14], [mark, -10, -4]
      ].map(([el, x, y]) => ({ x: gsap.quickTo(el, 'x', { duration: 1.2, ease: 'power3' }), y: gsap.quickTo(el, 'yPercent', { duration: 1.2, ease: 'power3' }), ax: x, ay: y, el }));
      hero.addEventListener('pointermove', e => {
        const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
        items.forEach(i => { i.x(nx * i.ax); });
      });
    }
  };

  /* ---------------- marquee ---------------- */
  const initMarquee = () => {
    const track = $('[data-marquee]');
    if (!track) return;
    const group = track.querySelector('.marquee__group');
    let guard = 0;
    while (track.scrollWidth < innerWidth * 2.4 && guard++ < 8) track.appendChild(group.cloneNode(true));
    const w = group.offsetWidth;
    let x = 0, dir = 1;
    const skew = gsap.quickTo(track, 'skewX', { duration: .6, ease: 'power3' });
    gsap.ticker.add(() => {
      const v = lenis ? lenis.velocity : 0;
      if (Math.abs(v) > .2) dir = v > 0 ? 1 : -1;
      x -= dir * (.55 + Math.min(Math.abs(v) * .12, 6));
      if (x <= -w) x += w;
      if (x > 0) x -= w;
      gsap.set(track, { x });
      skew(gsap.utils.clamp(-7, 7, -v * .35));
    });
  };

  /* ---------------- intro statement ---------------- */
  const initScrubWords = () => {
    $$('[data-scrub-words]').forEach(el => {
      const split = SplitText.create(el, { type: 'words', wordsClass: 'word' });
      gsap.to(split.words, {
        opacity: 1, ease: 'none', stagger: .1,
        scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 52%', scrub: .6 }
      });
    });
  };

  /* ---------------- forms: selayah → selendang ---------------- */
  const initForms = () => {
    const sec = $('[data-forms]');
    if (!sec) return;
    const q = s => $(s, sec);
    const fab = q('.fab'), border = q('.fab-border'), hem = q('.fab-hem');
    const wl = q('.dim-w-line'), wt1 = q('.dim-w-t1'), wt2 = q('.dim-w-t2'), wtx = q('.dim-w-text');
    const hl = q('.dim-h-line'), ht1 = q('.dim-h-t1'), ht2 = q('.dim-h-t2'), htx = q('.dim-h-text');
    const S = 3.4, state = { t: 0 };
    const set = (el, o) => Object.entries(o).forEach(([k, v]) => el.setAttribute(k, typeof v === 'number' ? v.toFixed(1) : v));
    const render = () => {
      const t = state.t;
      const cw = 55 + 22 * t, ch = 95 + 61 * t;
      const w = cw * S, h = ch * S, x = 210 - w / 2, y = 40;
      set(fab, { x, y, width: w, height: h });
      set(hem, { x, y, width: w, height: h });
      set(border, { x: x + 10, y: y + 10, width: w - 20, height: h - 20 });
      set(wl, { x1: x, x2: x + w }); set(wt1, { x1: x, x2: x }); set(wt2, { x1: x + w, x2: x + w });
      wtx.textContent = Math.round(cw) + ' cm';
      const dx = x + w + 22;
      set(hl, { x1: dx, x2: dx, y1: y, y2: y + h }); set(ht1, { x1: dx - 6, x2: dx + 6, y2: y, y1: y }); set(ht2, { x1: dx - 6, x2: dx + 6, y1: y + h, y2: y + h });
      const tx = dx + 20, ty = y + h / 2;
      set(htx, { x: tx, y: ty, transform: `rotate(90 ${tx.toFixed(1)} ${ty.toFixed(1)})` });
      htx.textContent = Math.round(ch) + ' cm';
    };
    render();
    const texts = $$('[data-form]', sec), photos = $$('[data-form-photo]', sec);
    gsap.set(texts[1], { autoAlpha: 0, y: 60 });
    gsap.set(photos[1], { clipPath: 'inset(100% 0% 0% 0%)' });
    const tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: 'top top', end: 'bottom bottom', scrub: .9 } });
    tl.to(state, { t: 1, duration: 1, ease: 'power2.inOut', onUpdate: render }, .25)
      .to(texts[0], { autoAlpha: 0, y: -60, duration: .25 }, .5)
      .to(texts[1], { autoAlpha: 1, y: 0, duration: .25 }, .66)
      .to(photos[1], { clipPath: 'inset(0% 0% 0% 0%)', duration: .45, ease: 'power2.inOut' }, .5)
      .to($('figcaption', photos[0]), { autoAlpha: 0, duration: .15 }, .5)
      .fromTo($('img', photos[1]), { scale: 1.25 }, { scale: 1, duration: .6, ease: 'none' }, .5)
      .to(q('.forms__progress i'), { scaleX: 1, duration: 1.5, ease: 'none' }, 0)
      .set({}, {}, 1.5);
  };

  /* ---------------- collection: horizontal rail ---------------- */
  const initCollection = () => {
    const sec = $('[data-collection]');
    if (!sec) return;
    const track = $('.collection__track', sec);
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    const tween = gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: $('.collection__pin', sec), scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    gsap.to($('.collection__count i', sec), { scaleX: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), scrub: true, invalidateOnRefresh: true } });
    $$('.piece', sec).forEach(p => {
      const img = $('img', p);
      gsap.fromTo(img, { xPercent: -7 }, { xPercent: 7, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      gsap.from(p, { rotation: 4, y: 80, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: p, containerAnimation: tween, start: 'left 95%', once: true } });
    });
  };

  /* ---------------- craft: sticky stack ---------------- */
  const initCraft = () => {
    const figs = $$('.craft__frame figure');
    const steps = $$('.step');
    if (!figs.length || !steps.length) return;
    let current = 0;
    gsap.set(figs, { clipPath: 'inset(100% 0% 0% 0%)', zIndex: 1 });
    gsap.set(figs[0], { clipPath: 'inset(0% 0% 0% 0%)', zIndex: 2 });
    const show = i => {
      if (i === current) return;
      const down = i > current;
      figs.forEach((f, k) => gsap.set(f, { zIndex: k === i ? 3 : (k === current ? 2 : 1) }));
      gsap.fromTo(figs[i], { clipPath: down ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.15, ease: 'silk', overwrite: true });
      gsap.fromTo($('img', figs[i]), { scale: 1.28 }, { scale: 1, duration: 1.6, ease: 'power3.out', overwrite: true });
      current = i;
    };
    steps.forEach((s, i) => {
      ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: self => self.isActive && show(i) });
      gsap.from(s.children, { y: 40, autoAlpha: 0, duration: 1, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: s, start: 'top 70%', once: true } });
    });
    gsap.to('.craft__thread i', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.craft__steps', start: 'top 55%', end: 'bottom 75%', scrub: true } });
  };

  /* ---------------- motifs ---------------- */
  const initMotifs = () => {
    const tiles = $$('.motif');
    if (!tiles.length) return;
    tiles.forEach((tile, i) => {
      const svg = $('.motif__art', tile);
      const drawers = stitchify(svg);
      gsap.to(drawers, { drawSVG: '100%', duration: 1.8, ease: 'power2.inOut', stagger: .12, delay: (i % 3) * .15, scrollTrigger: { trigger: tile, start: 'top 82%', once: true } });
      if (!reduce) tile.addEventListener('pointerenter', () => {
        gsap.fromTo(drawers, { drawSVG: '0%' }, { drawSVG: '100%', duration: 1.1, ease: 'power2.inOut', stagger: .06, overwrite: true });
      });
    });
  };

  /* ---------------- heritage timeline thread ---------------- */
  const initTimeline = () => {
    const tl = $('[data-timeline]');
    if (!tl) return;
    const svg = $('.timeline__thread svg', tl);
    let drawer;
    const build = () => {
      const h = tl.offsetHeight;
      svg.setAttribute('viewBox', `0 0 40 ${h}`);
      svg.innerHTML = '';
      let d = 'M20 0';
      const seg = 140;
      for (let y = 0; y < h; y += seg) {
        const s = (y / seg) % 2 ? -1 : 1;
        d += ` C${20 + 14 * s} ${y + seg * .33} ${20 + 14 * s} ${y + seg * .66} 20 ${Math.min(h, y + seg)}`;
      }
      const base = document.createElementNS(NS, 'path');
      base.setAttribute('d', d); base.setAttribute('fill', 'none'); base.setAttribute('stroke', 'rgba(61,14,25,.12)'); base.setAttribute('stroke-width', '1.5');
      const st = document.createElementNS(NS, 'path');
      st.setAttribute('d', d); st.setAttribute('class', 'st'); st.setAttribute('fill', 'none'); st.setAttribute('stroke', '#b0893f'); st.setAttribute('stroke-width', '2.6'); st.setAttribute('stroke-dasharray', '7 5');
      svg.appendChild(base); svg.appendChild(st);
      drawer = stitchify(svg)[0];
    };
    build();
    gsap.to(drawer, { drawSVG: '100%', ease: 'none', scrollTrigger: { trigger: tl, start: 'top 60%', end: 'bottom 60%', scrub: true } });
    $$('.era', tl).forEach(era => {
      gsap.from($('.era__knot', era), { scale: 0, rotation: -180, duration: 1, ease: 'back.out(2)', scrollTrigger: { trigger: era, start: 'top 60%', once: true } });
      gsap.from($('.era__text', era).children, { y: 40, autoAlpha: 0, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: era, start: 'top 75%', once: true } });
    });
  };

  /* ---------------- care icons ---------------- */
  const initCare = () => {
    $$('[data-care]').forEach((item, i) => {
      const paths = $$('.ci', item);
      gsap.set(paths, { drawSVG: '0%' });
      gsap.to(paths, { drawSVG: '100%', duration: 1.4, ease: 'power2.inOut', stagger: .15, delay: i * .12, scrollTrigger: { trigger: item, start: 'top 85%', once: true } });
      gsap.from(item.querySelectorAll('h3, p'), { y: 30, autoAlpha: 0, duration: 1, stagger: .08, delay: i * .12, ease: 'power3.out', scrollTrigger: { trigger: item, start: 'top 85%', once: true } });
      if (!reduce) item.addEventListener('pointerenter', () => gsap.fromTo(paths, { drawSVG: '0%' }, { drawSVG: '100%', duration: .9, ease: 'power2.inOut', stagger: .08, overwrite: true }));
    });
  };

  /* ---------------- footer ---------------- */
  const initFooter = () => {
    const f = $('[data-fringe="footer"]');
    if (f) {
      const fans = buildFringe(f, { spacing: 36, r: 13 });
      gsap.from(fans, { rotation: -70, autoAlpha: 0, transformOrigin: '50% 0%', duration: 1.4, ease: 'elastic.out(1, .35)', stagger: { each: .015, from: 'start' }, scrollTrigger: { trigger: '.footer', start: 'top 90%', once: true } });
    }
    const mark = $('[data-footer-mark]');
    if (mark) {
      const g = goldSplit(mark);
      gsap.from(g.chars, { yPercent: 100, autoAlpha: 0, duration: 1.4, ease: 'power4.out', stagger: .06, scrollTrigger: { trigger: mark, start: 'top 95%', once: true } });
    }
  };

  /* ---------------- collection page: filters + drawer ---------------- */
  const initCatalog = () => {
    const grid = $('[data-catalog]');
    if (!grid) return;
    const items = $$('.piece', grid);
    const count = $('[data-count]');
    $$('[data-filter]').forEach(chip => chip.addEventListener('click', () => {
      $$('[data-filter]').forEach(c => c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'));
      const f = chip.dataset.filter;
      const show = items.filter(i => f === 'all' || i.dataset.kind === f);
      const hide = items.filter(i => !show.includes(i));
      gsap.to(items, { autoAlpha: 0, y: 30, duration: .35, ease: 'power2.in', onComplete: () => {
        hide.forEach(i => i.classList.add('is-out'));
        show.forEach(i => i.classList.remove('is-out'));
        if (count) count.textContent = show.length;
        ScrollTrigger.refresh();
        gsap.fromTo(show, { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out', stagger: .06 });
      } });
    }));

    const drawer = $('.drawer');
    if (!drawer) return;
    const panel = $('.drawer__panel', drawer), scrim = $('.drawer__scrim', drawer);
    const fill = data => {
      $('[data-d="img"]', drawer).src = data.img;
      $('[data-d="img"]', drawer).alt = data.alt;
      $('[data-d="name"]', drawer).textContent = data.name;
      $('[data-d="form"]', drawer).textContent = data.form;
      $('[data-d="desc"]', drawer).textContent = data.desc;
      const specs = $('[data-d="specs"]', drawer);
      specs.replaceChildren(...data.specs.map(([k, v]) => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        li.textContent = k; span.textContent = v; li.appendChild(span);
        return li;
      }));
      $('[data-d="cta"]', drawer).href = 'bespoke.html?piece=' + encodeURIComponent(data.name) + '#enquire';
    };
    let lastFocus = null;
    const open = item => {
      lastFocus = document.activeElement;
      fill(JSON.parse(item.dataset.piece));
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      lenis && lenis.stop();
      gsap.timeline()
        .to(scrim, { opacity: 1, duration: .5 }, 0)
        .to(panel, { x: 0, xPercent: 0, duration: .9, ease: 'silk' }, 0)
        .fromTo($$('.drawer__info > *', drawer), { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: .05, duration: .7, ease: 'power3.out' }, .35)
        .fromTo($('.drawer__img img', drawer), { scale: 1.2 }, { scale: 1, duration: 1.2, ease: 'power3.out' }, .2);
      setTimeout(() => $('.drawer__close', drawer).focus(), 50);
    };
    const close = () => {
      gsap.timeline({ onComplete: () => { drawer.classList.remove('is-open'); drawer.setAttribute('aria-hidden', 'true'); lenis && lenis.start(); lastFocus && lastFocus.focus(); } })
        .to(panel, { xPercent: 104, duration: .7, ease: 'drape' }, 0)
        .to(scrim, { opacity: 0, duration: .5 }, .1);
    };
    gsap.set(panel, { xPercent: 104 });
    items.forEach(item => {
      item.addEventListener('click', e => { e.preventDefault(); open(item); });
      item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(item); } });
    });
    scrim.addEventListener('click', close);
    $('.drawer__close', drawer).addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && drawer.classList.contains('is-open')) close(); });
    // open a piece directly from a link like collection.html#selayah-merah
    const wanted = window.__hash || location.hash;
    const fromHash = wanted && items.find(i => i.id === wanted.slice(1));
    if (fromHash) setTimeout(() => open(fromHash), 1400);
  };

  /* ---------------- faq ---------------- */
  const initFaq = () => {
    $$('.faq__item').forEach(item => {
      const btn = $('.faq__q', item), ans = $('.faq__a', item);
      btn.addEventListener('click', () => {
        const isOpen = item.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', isOpen);
        gsap.to(ans, { height: isOpen ? 'auto' : 0, duration: .7, ease: 'drape', onComplete: () => ScrollTrigger.refresh() });
      });
    });
  };

  /* ---------------- enquiry form ---------------- */
  const initForm = () => {
    const form = $('[data-enquiry]');
    if (!form) return;
    const params = new URLSearchParams(location.search);
    const piece = params.get('piece');
    if (piece) { const m = $('[name="message"]', form); if (m && !m.value) m.value = `I'd like to ask about the ${piece}.`; }
    form.addEventListener('submit', e => {
      e.preventDefault();
      let ok = true;
      $$('[required]', form).forEach(input => {
        const field = input.closest('.field');
        const valid = input.value.trim() !== '' && (input.type !== 'email' || /\S+@\S+\.\S+/.test(input.value));
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
  };

  /* ---------------- boot ---------------- */
  const boot = () => {
    // the browser may already have jumped to a #hash; start every page from the top, then glide there
    window.scrollTo(0, 0);
    lenis && lenis.scrollTo(0, { immediate: true, force: true });
    initTransitions();
    initCursor();
    initMagnetic();
    initNav();
    initHero();
    initMarquee();
    initScrubWords();
    initForms();
    initCollection();
    initCraft();
    initMotifs();
    initTimeline();
    initCare();
    initFooter();
    initCatalog();
    initFaq();
    initForm();
    initReveals();

    window.scrollTo(0, 0);
    window.fitFaces && window.fitFaces();
    const intro = preload();
    const startPage = () => {
      lenis && lenis.start();
      if (heroIntro) heroIntro.play();
      const hash = window.__hash || location.hash;
      if (hash && hash.length > 1 && $(hash)) {
        if (page !== 'collection') setTimeout(() => scrollToTarget(hash), 300);
        history.replaceState(null, '', hash);
      }
    };
    // play the hero as the veil is lifting
    intro.eventCallback('onComplete', null);
    const liftAt = intro.duration() - 1.0;
    gsap.delayedCall(Math.max(.1, liftAt), startPage);
    window.__kilReady = true;
  };

  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 2500))]) : Promise.resolve();
  fontsReady.then(boot);
  window.addEventListener('load', () => { ScrollTrigger.refresh(); window.fitFaces && window.fitFaces(); });
})();
