/* =========================================================
   Chat assistant for Norinda K. Su'ut / Kilauan
   A guided, rule-based assistant that runs entirely in the browser:
   classes, lessons, shows, pieces for sale, information and about us.
   Configure per site with window.CHAT_CONFIG before this file loads.
   ========================================================= */
(() => {
  'use strict';

  const C = Object.assign({
    name: 'Assistant',
    brand: 'Kilauan',
    avatar: 'assets/img/k-portrait-tall.webp',
    img: 'assets/img/',
    greeting: '',
    links: {}
  }, window.CHAT_CONFIG || {});
  const IG = 'https://www.instagram.com/keringkam_mas/';
  const FB = 'https://www.facebook.com/norinda.suut';
  // with pieceParam, enquiry links carry the piece name: page.html?piece=...#anchor
  const withPiece = (href, name) => {
    if (!C.pieceParam) return href;
    const [base, hash] = href.split('#');
    return base + (base.includes('?') ? '&' : '?') + 'piece=' + encodeURIComponent(name) + (hash ? '#' + hash : '');
  };
  // 'join' (class sign-ups) falls back to the general enquiry link
  const link = k => C.links[k] || (k === 'join' && C.links.enquiry) || '#';
  const STORE = 'cb-log-' + C.brand.toLowerCase().replace(/[^a-z]/g, '');

  /* ---------------- knowledge ---------------- */
  const PRODUCTS = [
    { id: 'selayah-merah', name: 'Selayah Merah', kind: 'Selayah', img: 'k-red-detail-a.webp', keys: ['selayah merah', 'red selayah', 'selayah red'], desc: 'Red gauze with scattered gold flowers inside a climbing vine border.', size: 'About 55 × 95 cm, worn over the head to the shoulders' },
    { id: 'selayah-hitam', name: 'Selayah Hitam', kind: 'Selayah', img: 'k-blackgold.webp', keys: ['selayah hitam', 'black selayah', 'selayah black'], desc: 'Black gauze with climbing flowers and an open lattice in gold.', size: 'About 55 × 95 cm, worn over the head to the shoulders' },
    { id: 'selendang-merah', name: 'Selendang Merah', kind: 'Selendang', img: 'k-red-detail-b.webp', keys: ['selendang merah', 'red selendang', 'selendang red'], desc: 'Small gold stars across red gauze, with a flowing border at the hem.', size: 'About 77 × 156 cm, draped from the head to the waist' },
    { id: 'selendang-hitam', name: 'Selendang Hitam', kind: 'Selendang', img: 'k-selendang-black.webp', keys: ['selendang hitam', 'black selendang', 'selendang black'], desc: 'A lattice border with gold stars scattered beside it.', size: 'About 77 × 156 cm, draped from the head to the waist' },
    { id: 'framed', name: 'Framed keringkam', kind: 'For the home', img: 'c-sampler-frame.webp', keys: ['frame', 'bingkai', 'wall'], desc: 'A gauze panel worked in gold and framed to hang.', size: 'Made to suit your wall' },
    { id: 'runner', name: 'Table runner', kind: 'For the home', img: 's-gold-paisley.webp', keys: ['runner', 'table'], desc: 'Embroidered to the length of your own table.', size: 'Made to your table length' },
    { id: 'cushion', name: 'Cushion cover', kind: 'For the home', img: 's-lace-pillow.webp', keys: ['cushion', 'kusyen', 'pillow', 'bantal'], desc: 'Gold-stitched covers for the room you keep for guests.', size: 'Standard or custom sizes' },
    { id: 'bookmark', name: 'Bookmark', kind: 'Gift', img: 's-gold-ribbon.webp', keys: ['bookmark', 'penanda buku'], desc: 'A small piece of keringkam for a favourite book.', size: 'Bookmark size' }
  ];

  const EVENTS = [
    { icon: 'chalkboard-teacher', title: 'March 2024', text: 'A weekly keringkam class, from the basics to the tali air border.' },
    { icon: 'graduation-cap', title: 'June 2025', text: 'National Training Week courses at UNIMAS City Campus, Kuching, and UNIMAS Samarahan.' },
    { icon: 'student', title: 'June 2025', text: 'MPU 3442 students finish their samplers and plan a project in Lubok Antu.' },
    { icon: 'airplane-tilt', title: '2025', text: 'A study visit to Kayseri University in Türkiye.' },
    { icon: 'users-three', title: 'July 2026', text: 'A two-day class with UNIMAS Business School.' }
  ];

  const LESSONS = [
    { icon: 'scissors', title: 'Week one, the basics:', text: 'the materials, hemming the edges, threading the flat gold strip and mounting the gauze on the pedangan frame.' },
    { icon: 'needle', title: 'Week two, the right technique:', text: 'neat, even stitches placed by counting the threads.' },
    { icon: 'path', title: 'Week three, the tali air border:', text: 'the flowing water-channel border.' },
    { icon: 'seal-check', title: 'Finished:', text: 'a sampler of your own to keep.' }
  ];

  const CHIPS = [
    { icon: 'graduation-cap', label: 'Classes', key: 'classes' },
    { icon: 'book-open-text', label: 'Lessons', key: 'lessons' },
    { icon: 'ticket', label: 'Shows and events', key: 'shows' },
    { icon: 'shopping-bag', label: 'Products for sale', key: 'products' },
    { icon: 'info', label: 'Information', key: 'information' },
    { icon: 'user-circle', label: 'About us', key: 'about' },
    { icon: 'envelope-simple', label: 'Contact', key: 'contact' }
  ];

  const KW = {
    greet: ['hi', 'hello', 'hey', 'salam', 'assalamualaikum', 'hai', 'helo', 'morning', 'pagi', 'petang', 'selamat'],
    thanks: ['thank', 'thanks', 'terima kasih', 'tq', 'thx', 'tqvm'],
    classes: ['class', 'kelas', 'workshop', 'bengkel', 'course', 'kursus', 'learn', 'belajar', 'training', 'ntw', 'unimas', 'teach', 'ajar', 'join', 'daftar', 'register', 'sertai'],
    lessons: ['lesson', 'pelajaran', 'week', 'minggu', 'syllabus', 'technique', 'teknik', 'basic', 'asas', 'what will i learn'],
    shows: ['show', 'exhibition', 'pameran', 'event', 'acara', 'festival', 'expo', 'talk', 'ceramah', 'kayseri', 'turkey', 'turkiye', 'turki', 'visit', 'lawatan'],
    products: ['product', 'produk', 'buy', 'beli', 'sale', 'jual', 'shop', 'kedai', 'order', 'tempah', 'pesan', 'selayah', 'selendang', 'veil', 'shawl', 'tudung', 'runner', 'cushion', 'kusyen', 'bookmark', 'frame', 'bingkai', 'gift', 'hadiah', 'collection', 'koleksi', 'piece', 'available'],
    price: ['price', 'harga', 'cost', 'how much', 'berapa harga', 'rm', 'budget', 'mahal', 'murah', 'quote'],
    time: ['how long', 'berapa lama', 'months', 'bulan', 'ready', 'siap', 'deadline', 'when can'],
    custom: ['custom', 'design', 'sendiri', 'colour', 'color', 'warna', 'motif', 'personal', 'commission', 'bespoke'],
    care: ['care', 'jaga', 'wash', 'basuh', 'cuci', 'fold', 'lipat', 'store', 'simpan', 'clean', 'perfume', 'sunlight', 'rosak', 'damage', 'preserve'],
    keringkam: ['what is keringkam', 'apa itu', 'history', 'sejarah', 'brooke', 'gold thread', 'benang', 'tikam', 'timbus', 'tradition', 'origin'],
    about: ['about', 'siapa', 'who', 'norinda', 'artisan', 'story', 'kisah', 'cerita', 'kilauan', 'brand', 'founder', 'owner', 'pemilik'],
    contact: ['contact', 'hubungi', 'whatsapp', 'phone', 'telefon', 'call', 'email', 'emel', 'instagram', 'facebook', 'reach', 'dm', 'mesej'],
    delivery: ['delivery', 'deliver', 'shipping', 'ship', 'pos', 'poslaju', 'courier', 'hantar', 'penghantaran', 'overseas'],
    location: ['where', 'mana', 'location', 'lokasi', 'kuching', 'sarawak', 'address', 'alamat', 'samarahan', 'based'],
    information: ['info', 'information', 'maklumat', 'faq', 'question', 'soalan']
  };
  const PRIORITY = ['price', 'time', 'delivery', 'custom', 'care', 'lessons', 'classes', 'shows', 'products', 'keringkam', 'about', 'contact', 'location', 'information', 'thanks', 'greet'];

  /* ---------------- replies ---------------- */
  const enquire = { icon: 'paper-plane-tilt', label: 'Send an enquiry', href: link('enquiry') };
  const igAct = { icon: 'instagram-logo', label: 'Message on Instagram', href: IG, ext: true };

  const R = {
    greet: () => ({ text: [C.greeting || `Salam and welcome! I'm the ${C.brand} assistant. Ask me about classes, lessons, shows, pieces for sale, care or our story.`] }),
    thanks: () => ({ text: ["You're welcome! Is there anything else I can help with?"] }),
    classes: () => ({
      text: ['Norinda teaches keringkam from the very basics, so complete beginners are welcome.'],
      list: [
        { icon: 'graduation-cap', title: 'National Training Week, June 2025.', text: 'Free courses at UNIMAS City Campus, Kuching, and UNIMAS Samarahan.' },
        { icon: 'users-three', title: 'Two-day class, July 2026.', text: 'Run with UNIMAS Business School.' },
        { icon: 'student', title: 'University and weekly classes.', text: 'Students finish samplers of their own.' }
      ],
      after: ['Would you like a place in the next class, or a session for your group?'],
      acts: [{ icon: 'paper-plane-tilt', label: 'Ask about the next class', href: link('join') }, { icon: 'arrow-up-right', label: 'See classes', href: link('classes') }]
    }),
    lessons: () => ({
      text: ['Classes build up week by week:'],
      list: LESSONS,
      acts: [{ icon: 'arrow-up-right', label: 'See the lessons', href: link('lessons') }, { icon: 'graduation-cap', label: 'Join a class', href: link('join') }]
    }),
    shows: () => ({
      text: ["Here's where Norinda has shared keringkam recently:"],
      list: EVENTS,
      after: ['New shows, exhibitions and classes are announced on Instagram first.'],
      acts: [{ icon: 'instagram-logo', label: 'Follow @keringkam_mas', href: IG, ext: true }, { icon: 'arrow-up-right', label: 'See events', href: link('events') }]
    }),
    products: kind => {
      const list = kind ? PRODUCTS.filter(p => p.kind.toLowerCase() === kind) : PRODUCTS;
      return {
        text: [kind ? `Here are the ${kind === 'selayah' ? 'selayah veils' : 'selendang shawls'}. Each one is made to order and stitched by hand.` : 'Every piece is made to order and stitched by hand. Tap a piece to ask about it.'],
        cards: list,
        after: ['Prices depend on the size and the motifs, so Norinda quotes each piece personally.'],
        acts: [{ icon: 'shopping-bag', label: 'Shop the pieces', href: link('shop') }, enquire]
      };
    },
    product: p => ({
      text: [`**${p.name}**, ${p.kind.toLowerCase()}.`, p.desc],
      photo: p.img,
      list: [
        { icon: 'ruler', text: p.size },
        { icon: 'needle', text: 'Flat gold thread, stitched by hand' },
        { icon: 'hourglass-medium', text: 'Usually one to six months to make' },
        { icon: 'tag', text: 'Price on request' }
      ],
      acts: [{ icon: 'paper-plane-tilt', label: 'Enquire about this piece', href: withPiece(link('enquiry'), p.name) }, { icon: 'shopping-bag', label: 'See more pieces', key: 'products' }]
    }),
    price: p => ({
      text: ['Each piece is quoted personally, because the size, the colour of the gauze and the density of the motifs all change the work involved.', p ? `Send an enquiry about the **${p.name}** and Norinda will reply with a quote.` : 'Send an enquiry with the piece you have in mind and Norinda will reply with a quote.'],
      acts: [enquire, igAct]
    }),
    time: () => ({
      text: ['Depending on the size of the piece and how dense the motifs are, a selayah or selendang can take **one to six months**.', 'If you have a wedding or engagement date, it helps to ask early.'],
      acts: [enquire]
    }),
    custom: () => ({
      text: ["Yes, every piece is made to order. Here's how a commission works:"],
      list: [
        { icon: 'chat-circle-dots', text: 'Talk through the occasion and the date' },
        { icon: 'palette', text: 'Choose the form, the gauze colour and the motifs' },
        { icon: 'needle', text: 'Norinda stitches it by hand, one pierce at a time' },
        { icon: 'gift', text: 'It arrives with its own care card' }
      ],
      acts: [{ icon: 'paper-plane-tilt', label: 'Start a commission', href: link('enquiry') }]
    }),
    care: () => ({
      text: ['Keringkam is delicate, but with the right care it lasts for generations:'],
      list: [
        { icon: 'drop-slash', text: 'Do not wash or dry-clean it.' },
        { icon: 'scroll', text: 'Roll it around acid-free paper instead of folding it.' },
        { icon: 'sun', text: 'Keep it away from sunlight, moisture, perfume and cosmetics.' },
        { icon: 'hand', text: 'Handle it with clean, dry hands.' }
      ],
      acts: [{ icon: 'arrow-up-right', label: 'Read the care guide', href: link('care') }]
    }),
    keringkam: () => ({
      text: ['**Keringkam** is gold or silver thread embroidery on sheer gauze, made by the Malay women of Sarawak. Its history is traced to the Brooke era, when it was worn by the upper class.', 'It comes in two forms: the **selayah**, a veil of about 55 × 95 cm, and the **selendang**, a shawl of about 77 × 156 cm. Both are worn at weddings, engagements and the completion of the Al-Quran.'],
      acts: [{ icon: 'shopping-bag', label: 'See the pieces', key: 'products' }, { icon: 'user-circle', label: 'About us', key: 'about' }]
    }),
    information: () => ({
      text: ['What would you like to know?'],
      acts: [
        { icon: 'sparkle', label: 'What is keringkam?', key: 'keringkam' },
        { icon: 'hand-heart', label: 'Caring for a piece', key: 'care' },
        { icon: 'hourglass-medium', label: 'How long it takes', key: 'time' },
        { icon: 'tag', label: 'Prices', key: 'price' },
        { icon: 'package', label: 'Delivery', key: 'delivery' },
        { icon: 'palette', label: 'Custom orders', key: 'custom' }
      ]
    }),
    about: () => ({
      text: ["**Norinda K. Su'ut** is a keringkam master artisan, cultural bearer and heritage advocate from Sarawak.", C.brand === 'Kilauan' ? 'Kilauan, "where heritage shimmers", is her keringkam label. Every piece is stitched by Norinda herself.' : 'She stitches every piece by hand, and teaches keringkam so the next generation can carry it on.'],
      photo: 'k-portrait-wide.webp',
      acts: [{ icon: 'arrow-up-right', label: 'Read her story', href: link('about') }, { icon: 'instagram-logo', label: 'Follow on Instagram', href: IG, ext: true }]
    }),
    contact: () => ({
      text: ['The quickest way to reach Norinda is a message on Instagram or Facebook. You can also send an enquiry on this site.'],
      acts: [igAct, { icon: 'facebook-logo', label: 'Facebook', href: FB, ext: true }, enquire]
    }),
    delivery: () => ({
      text: ['Delivery depends on where you are. Mention your town or country when you enquire, and Norinda will let you know the options.'],
      acts: [enquire]
    }),
    location: () => ({
      text: ['Norinda is based in Sarawak, Malaysia. Her classes have been held at UNIMAS in Kuching and Samarahan.'],
      acts: [{ icon: 'graduation-cap', label: 'Classes', key: 'classes' }, { icon: 'envelope-simple', label: 'Contact', key: 'contact' }]
    }),
    fallback: () => ({
      text: ["I'm not sure about that one yet. I can help with classes, lessons, shows, pieces for sale, care and Norinda's story, or you can ask Norinda directly."],
      acts: [igAct]
    })
  };

  const resolve = key => {
    const [id, arg] = key.split(':');
    const p = arg && PRODUCTS.find(x => x.id === arg);
    if (id === 'product' && p) return R.product(p);
    if (id === 'price') return R.price(p);
    if (id === 'products') return R.products(arg);
    return (R[id] || R.fallback)();
  };

  /* ---------------- understanding free text ---------------- */
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const hit = (text, tokens, kw) => kw.includes(' ') ? text.includes(kw) : tokens.some(t => kw.length < 4 ? t === kw : t.startsWith(kw));
  const detect = raw => {
    const text = norm(raw);
    const tokens = text.split(' ');
    const score = {};
    for (const [id, words] of Object.entries(KW)) score[id] = words.reduce((n, w) => n + (hit(text, tokens, w) ? 1 : 0), 0);
    const product = PRODUCTS.find(p => p.keys.some(k => text.includes(k)));
    if (score.price) return 'price' + (product ? ':' + product.id : '');
    if (score.time) return 'time';
    if (product && !score.classes && !score.care) return 'product:' + product.id;
    if (score.products && !score.classes && !score.lessons) {
      if (tokens.includes('selayah') && !tokens.includes('selendang')) return 'products:selayah';
      if (tokens.includes('selendang') && !tokens.includes('selayah')) return 'products:selendang';
    }
    if (/^(what|apa)\b.*\bkeringkam\b/.test(text) || text === 'keringkam') return 'keringkam';
    let best = null;
    for (const id of PRIORITY) if (score[id] && (!best || score[id] > score[best])) best = id;
    return best || 'fallback';
  };

  /* ---------------- dom helpers ---------------- */
  const NS = 'http://www.w3.org/2000/svg';
  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    kids.flat(Infinity).forEach(c => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
    return el;
  };
  const icon = name => {
    const s = document.createElementNS(NS, 'svg');
    s.setAttribute('aria-hidden', 'true');
    const u = document.createElementNS(NS, 'use');
    u.setAttribute('href', '#i-' + name);
    s.appendChild(u);
    return s;
  };
  const rich = str => str.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map(part => part.startsWith('**') ? h('b', null, part.slice(2, -2)) : part);

  /* ---------------- ui ---------------- */
  let panel, body, input, launcher, tip, isOpen = false, busy = false;
  const log = (() => { try { return JSON.parse(sessionStorage.getItem(STORE)) || []; } catch (e) { return []; } })();
  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify(log.slice(-40))); } catch (e) { /* storage unavailable */ } };
  const face = () => h('span', { class: 'cb-row__face' }, h('img', { src: C.avatar, alt: '' }));
  const scrollDown = () => { body.scrollTop = body.scrollHeight; };

  const renderUser = text => {
    body.append(h('div', { class: 'cb-row cb-row--user' }, h('div', { class: 'cb-msg cb-msg--user' }, text)));
    scrollDown();
  };
  const renderBot = (key, animate) => {
    const r = resolve(key);
    const b = h('div', { class: 'cb-msg cb-msg--bot' });
    (r.text || []).forEach(t => b.append(h('p', null, rich(t))));
    if (r.photo) b.append(h('div', { class: 'cb-photo' }, h('img', { src: C.img + r.photo, alt: '', loading: 'lazy' })));
    if (r.list) b.append(h('ul', { class: 'cb-list' }, r.list.map(li => h('li', null, icon(li.icon), h('span', null, li.title ? [h('b', null, li.title), ' ', li.text] : rich(li.text))))));
    if (r.cards) b.append(h('div', { class: 'cb-cards', 'data-lenis-prevent': true }, r.cards.map(p => h('div', { class: 'cb-card' },
      h('img', { src: C.img + p.img, alt: p.name, loading: 'lazy' }),
      h('b', null, p.name), h('span', null, p.kind),
      h('button', { type: 'button', onclick: () => send(`Tell me about the ${p.name}`, 'product:' + p.id) }, icon('chat-circle-dots'), 'Ask')))));
    (r.after || []).forEach(t => b.append(h('p', null, rich(t))));
    if (r.acts) b.append(h('div', { class: 'cb-acts' }, r.acts.map(a => a.key
      ? h('button', { class: 'cb-act', type: 'button', onclick: () => send(a.label, a.key) }, icon(a.icon), a.label)
      : h('a', { class: 'cb-act', href: a.href, target: a.ext ? '_blank' : null, rel: a.ext ? 'noopener' : null, onclick: a.ext ? null : () => setTimeout(close, 60) }, icon(a.icon), a.label))));
    const row = h('div', { class: 'cb-row' }, face(), b);
    body.append(row);
    if (animate && window.gsap) gsap.from(row, { y: 16, autoAlpha: 0, duration: .5, ease: 'power3.out' });
    scrollDown();
    if (animate && window.fitFaces) window.fitFaces();
  };

  const send = (text, key) => {
    if (busy) return;
    const clean = String(text).trim();
    if (!clean) return;
    const intent = key || detect(clean);
    renderUser(clean);
    log.push({ u: clean });
    busy = true;
    const typing = h('div', { class: 'cb-row' }, face(), h('div', { class: 'cb-msg cb-msg--bot cb-typing', 'aria-label': 'Typing' }, h('i'), h('i'), h('i')));
    body.append(typing);
    scrollDown();
    const delay = 520 + Math.min(900, clean.length * 12);
    setTimeout(() => {
      typing.remove();
      renderBot(intent, true);
      log.push({ b: intent });
      save();
      busy = false;
    }, delay);
  };

  const open = () => {
    if (isOpen) return;
    isOpen = true;
    if (tip) { tip.remove(); tip = null; }
    try { sessionStorage.setItem('cb-tip-seen', '1'); } catch (e) { /* ignore */ }
    launcher.classList.add('is-hidden');
    launcher.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    if (window.gsap) gsap.fromTo(panel, { autoAlpha: 0, scale: .9, y: 30 }, { autoAlpha: 1, scale: 1, y: 0, duration: .55, ease: 'back.out(1.5)' });
    else { panel.style.visibility = 'visible'; panel.style.opacity = 1; }
    scrollDown();
    setTimeout(() => input.focus(), 120);
  };
  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    launcher.classList.remove('is-hidden');
    launcher.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    if (window.gsap) gsap.to(panel, { autoAlpha: 0, scale: .92, y: 24, duration: .35, ease: 'power2.in' });
    else { panel.style.visibility = 'hidden'; panel.style.opacity = 0; }
    launcher.focus({ preventScroll: true });
  };
  const reset = () => {
    log.length = 0; save();
    body.replaceChildren();
    renderBot('greet', true);
    log.push({ b: 'greet' }); save();
  };

  const build = () => {
    launcher = h('button', { class: 'cb-launch', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'cb-panel', onclick: open },
      h('span', { class: 'cb-launch__pulse' }),
      h('span', { class: 'cb-launch__face' }, h('img', { src: C.avatar, alt: '' }), h('i', { class: 'cb-launch__dot' })),
      h('span', null, C.launchLabel || 'Ask us anything', h('small', null, 'Classes, pieces, shows')));

    body = h('div', { class: 'cb-body', 'data-lenis-prevent': true, 'aria-live': 'polite' });
    input = h('input', { class: 'cb-input', type: 'text', placeholder: 'Type a question…', 'aria-label': 'Type your question', autocomplete: 'off', maxlength: '300' });
    const form = h('form', { class: 'cb-form', onsubmit: e => { e.preventDefault(); const v = input.value; input.value = ''; send(v); } },
      input, h('button', { class: 'cb-send', type: 'submit', 'aria-label': 'Send' }, icon('paper-plane-right')));
    const chips = h('div', { class: 'cb-chips', 'data-lenis-prevent': true },
      CHIPS.map(c => h('button', { class: 'cb-chip', type: 'button', onclick: () => send(c.label, c.key) }, icon(c.icon), c.label)));

    panel = h('div', { class: 'cb-panel', id: 'cb-panel', role: 'dialog', 'aria-modal': 'false', 'aria-label': C.name, 'aria-hidden': 'true' },
      h('div', { class: 'cb-head' },
        h('span', { class: 'cb-head__face' }, h('img', { src: C.avatar, alt: '' })),
        h('div', null, h('div', { class: 'cb-head__name' }, C.name), h('div', { class: 'cb-head__status' }, h('i'), 'Automated assistant, replies instantly')),
        h('div', { class: 'cb-head__btns' },
          h('button', { type: 'button', 'aria-label': 'Start over', title: 'Start over', onclick: reset }, icon('arrow-left')),
          h('button', { type: 'button', 'aria-label': 'Close chat', onclick: close }, icon('x')))),
      h('div', { class: 'cb-band', 'aria-hidden': 'true' }),
      body, chips, form,
      h('p', { class: 'cb-note' }, 'Automated answers. For orders, Norinda replies personally on Instagram.'));

    document.body.append(launcher, panel);

    if (log.length) log.forEach(m => m.u ? renderUser(m.u) : renderBot(m.b, false));
    else { renderBot('greet', false); log.push({ b: 'greet' }); save(); }

    document.addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen) close(); });
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-chat], [data-chat-ask], [data-chat-product]');
      if (!t) return;
      e.preventDefault();
      open();
      if (t.dataset.chatProduct) {
        const p = PRODUCTS.find(x => x.id === t.dataset.chatProduct);
        if (p) setTimeout(() => send(`Tell me about the ${p.name}`, 'product:' + p.id), 450);
      } else if (t.dataset.chatAsk) {
        setTimeout(() => send(t.dataset.chatAsk, t.dataset.chatKey || null), 450);
      }
    });

    // the tip shows once per session and tidies itself away
    const hideTip = () => {
      const t = tip; tip = null;
      if (!t) return;
      if (window.gsap) gsap.to(t, { y: 14, autoAlpha: 0, duration: .4, ease: 'power2.in', onComplete: () => t.remove() });
      else t.remove();
    };
    let seen = false;
    try { seen = sessionStorage.getItem('cb-tip-seen') === '1'; } catch (e) { /* ignore */ }
    if (!seen) setTimeout(() => {
      if (isOpen) return;
      try { sessionStorage.setItem('cb-tip-seen', '1'); } catch (e) { /* ignore */ }
      tip = h('div', { class: 'cb-tip', role: 'status' }, h('b', null, C.tipTitle || 'Salam! Need a hand?'), C.tipText || 'Ask me about classes, shows or the pieces for sale.',
        h('button', { class: 'cb-tip__close', type: 'button', 'aria-label': 'Dismiss', onclick: hideTip }, icon('x')));
      document.body.append(tip);
      if (window.gsap) gsap.from(tip, { y: 20, autoAlpha: 0, scale: .9, duration: .6, ease: 'back.out(1.6)' });
      setTimeout(hideTip, 14000);
    }, 6000);
  };

  window.Chat = { open, close, ask: (text, key) => { open(); setTimeout(() => send(text, key), 450); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
