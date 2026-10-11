/* =========================================================
   Face-aware cropping
   Every photo with people carries its face boxes (found with the
   YuNet face detector, plus a few bowed heads placed by hand).
   For each <img>, we pick the object-position that keeps whole
   heads inside the frame, whatever shape the frame is, staying as
   close as possible to the crop the layout asks for (data-pos).
   ========================================================= */
(() => {
  'use strict';
  const FACES = {"c-mpu-group.webp":[[0.206,0.45,0.074,0.095],[0.574,0.499,0.049,0.068],[0.843,0.532,0.126,0.142],[0.832,0.313,0.052,0.064]],"c-mpu-smiles.webp":[[-0.001,0.106,0.08,0.149],[0.553,0.169,0.086,0.115],[0.914,0.298,0.084,0.16]],"c-mpu-student-a.webp":[[0.413,0.001,0.177,0.135],[0.152,0.001,0.06,0.086],[0.131,0.159,0.077,0.099]],"c-mpu-student-b.webp":[[0.39,0.042,0.17,0.229],[0.147,0.319,0.032,0.048],[0.679,0.168,0.04,0.061],[0.279,0.375,0.029,0.038]],"c-mpu-student-c.webp":[[0.476,0.19,0.158,0.227],[0.058,0.453,0.078,0.101]],"c-mpu-student-d.webp":[[0.427,0.409,0.128,0.172],[0.305,0.33,0.056,0.073],[0.733,0.53,0.058,0.119]],"c-ntw-class.webp":[[0.292,0.184,0.056,0.043],[0.388,0.374,0.047,0.038],[0.71,0.474,0.166,0.108]],"c-ntw-floor.webp":[[0.3,0.2,0.3,0.14],[0.0,0.5,0.3,0.12],[0.56,0.57,0.3,0.13]],"c-ntw-group.webp":[[0.776,0.645,0.031,0.05],[0.229,0.566,0.021,0.036],[0.233,0.671,0.028,0.047],[0.675,0.461,0.021,0.035],[0.631,0.639,0.029,0.05],[0.396,0.583,0.022,0.038],[0.278,0.48,0.021,0.033],[0.768,0.5,0.024,0.039],[0.307,0.694,0.029,0.046],[0.566,0.467,0.023,0.037],[0.518,0.661,0.029,0.047],[0.137,0.655,0.032,0.046],[0.591,0.61,0.024,0.04],[0.738,0.45,0.023,0.039],[0.484,0.569,0.023,0.036],[0.727,0.612,0.027,0.044],[0.696,0.578,0.024,0.04],[0.832,0.492,0.024,0.04],[0.481,0.5,0.016,0.027],[0.332,0.581,0.025,0.042],[0.141,0.513,0.026,0.039],[0.618,0.485,0.019,0.031],[0.634,0.574,0.022,0.036],[0.351,0.516,0.018,0.027],[0.413,0.677,0.027,0.043],[0.419,0.496,0.019,0.03]],"c-ntw25-poster-a.webp":[[0.676,0.181,0.088,0.093]],"c-ntw25-poster-b.webp":[[0.676,0.194,0.087,0.091]],"c-ntw26-group-b.webp":[[0.828,0.486,0.026,0.041],[0.823,0.642,0.037,0.058],[0.744,0.606,0.029,0.047],[0.121,0.64,0.032,0.05],[0.393,0.568,0.025,0.041],[0.651,0.635,0.028,0.048],[0.683,0.456,0.023,0.039],[0.548,0.443,0.024,0.04],[0.48,0.564,0.022,0.036],[0.303,0.678,0.027,0.043],[0.352,0.493,0.019,0.03],[0.471,0.481,0.019,0.031],[0.416,0.662,0.026,0.041],[0.234,0.654,0.029,0.045],[0.784,0.491,0.025,0.039],[0.219,0.55,0.022,0.036],[0.331,0.57,0.025,0.039],[0.638,0.564,0.023,0.039],[0.752,0.444,0.024,0.038],[0.594,0.604,0.024,0.038],[0.713,0.572,0.022,0.037],[0.283,0.464,0.017,0.03],[0.134,0.5,0.026,0.039],[0.515,0.657,0.027,0.044],[0.632,0.464,0.022,0.036],[0.412,0.482,0.018,0.028]],"c-ntw26-group.webp":[[0.766,0.59,0.029,0.049],[0.221,0.607,0.031,0.05],[0.836,0.612,0.031,0.05],[0.326,0.676,0.031,0.058],[0.553,0.521,0.023,0.039],[0.275,0.408,0.024,0.042],[0.565,0.401,0.025,0.042],[0.284,0.527,0.026,0.041],[0.662,0.61,0.029,0.047],[0.751,0.447,0.024,0.04],[0.796,0.405,0.024,0.041],[0.107,0.447,0.027,0.044],[0.646,0.516,0.027,0.044],[0.424,0.629,0.026,0.046],[0.371,0.533,0.025,0.041],[0.195,0.457,0.026,0.042],[0.441,0.425,0.021,0.033],[0.331,0.422,0.02,0.034],[0.154,0.414,0.022,0.036],[0.379,0.419,0.02,0.034],[0.217,0.414,0.023,0.039],[0.366,0.635,0.026,0.043],[0.614,0.42,0.021,0.035],[0.442,0.527,0.024,0.039],[0.233,0.536,0.024,0.039],[0.507,0.61,0.028,0.047],[0.496,0.416,0.023,0.038],[0.664,0.43,0.021,0.034],[0.707,0.428,0.024,0.038]],"c-unimas-group.webp":[[0.11,0.222,0.053,0.114],[0.334,0.517,0.051,0.108],[0.588,0.197,0.041,0.094],[0.47,0.536,0.046,0.101],[0.317,0.19,0.041,0.086],[0.602,0.485,0.047,0.107],[0.227,0.501,0.052,0.113],[0.234,0.2,0.041,0.09],[0.763,0.211,0.052,0.108],[0.86,0.167,0.053,0.113],[0.403,0.26,0.039,0.093],[0.413,0.16,0.037,0.079],[0.481,0.206,0.039,0.086]],"k-brandcard.webp":[[0.648,0.499,0.208,0.203]],"k-hands-red.webp":[[0.688,0.475,0.099,0.243],[0.415,0.068,0.113,0.247]],"k-portrait-tall.webp":[[0.104,0.186,0.599,0.521]],"k-portrait-wide.webp":[[0.662,0.178,0.222,0.53]],"s-bride-blue.webp":[[0.523,0.352,0.094,0.106]],"s-bride-veil-adjust.webp":[[0.464,0.355,0.221,0.197],[0.268,0.087,0.221,0.173]],"s-bride-white.webp":[[0.409,0.155,0.248,0.205]],"s-hijab-cream.webp":[[0.164,0.162,0.396,0.36]],"s-veil-adjust.webp":[[0.491,0.582,0.161,0.139]],"x-kayseri-coil.webp":[[0.166,0.072,0.235,0.32],[0.55,0.164,0.198,0.278]],"x-kayseri-cord.webp":[[0.542,0.004,0.28,0.312]],"x-kayseri-flags.webp":[[0.132,0.198,0.201,0.276],[0.411,0.258,0.196,0.268],[0.641,0.252,0.223,0.263]],"x-kayseri-room.webp":[[0.029,0.541,0.118,0.167],[0.578,0.579,0.115,0.136],[0.315,0.264,0.092,0.119],[-0.003,0.217,0.081,0.123],[0.728,0.283,0.098,0.139],[0.865,0.287,0.078,0.088],[0.622,0.329,0.054,0.079]],"x-kayseri-sign.webp":[[0.715,0.436,0.033,0.041],[0.248,0.427,0.055,0.074]],"x-kayseri-smile.webp":[[0.403,0.265,0.236,0.32],[0.242,0.37,0.065,0.085]],"c-week3-student.webp":[[0.06,0.04,0.48,0.52]],"c-ntw-teach.webp":[[0.02,0.24,0.42,0.2],[0.68,0.3,0.3,0.14]],"c-ntw-frames.webp":[[0.28,0.44,0.34,0.16]],"s-veil-silhouette.webp":[[0.02,0.02,0.46,0.42]]};

  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  const fileOf = img => (img.currentSrc || img.src || '').split('/').pop().split('?')[0];

  // a face box grown to cover the whole head: hair or hijab above, chin below
  // k = 1: the whole head (hair or hijab above, chin and neck below); k = 0: just the face
  const head = ([x, y, w, h], k = 1) => ({
    x1: Math.max(0, x - w * .3 * k), x2: Math.min(1, x + w * (1 + .3 * k)),
    y1: Math.max(0, y - h * .65 * k), y2: Math.min(1, y + h * (1 + .28 * k)), area: w * h
  });
  const union = (a, b) => a ? { x1: Math.min(a.x1, b.x1), x2: Math.max(a.x2, b.x2), y1: Math.min(a.y1, b.y1), y2: Math.max(a.y2, b.y2) } : { ...b };

  // place a window of size `win` (0..1) on one axis
  const place = (pref, win, keep, others, a1, a2) => {
    if (win >= .999) return 50;
    let s = pref / 100 * (1 - win);
    if (keep) {
      const lo = keep[a2] - win, hi = keep[a1];
      s = lo <= hi ? clamp(s, lo, hi) : (keep[a1] + keep[a2]) / 2 - win / 2;
      // a face we cannot keep should be fully out of frame, never half in
      others.forEach(o => {
        const inside = o[a2] > s && o[a1] < s + win;
        if (!inside) return;
        if (o[a1] >= keep[a2] - .0001) { const ns = o[a1] - win; if (ns >= lo - .0001) s = Math.min(s, ns); }
        else if (o[a2] <= keep[a1] + .0001) { const ns = o[a2]; if (ns <= hi + .0001) s = Math.max(s, ns); }
      });
    }
    s = clamp(s, 0, 1 - win);
    return +(s / (1 - win) * 100).toFixed(1);
  };

  const fit = img => {
    const boxes = FACES[fileOf(img)];
    if (!boxes) return;
    const W = img.naturalWidth, H = img.naturalHeight, w = img.clientWidth, h = img.clientHeight;
    if (!W || !H || !w || !h) return;
    const scale = Math.max(w / W, h / H);
    const ww = w / (W * scale), wh = h / (H * scale);
    const pref = (img.dataset.pos || '50% 50%').split(/\s+/).map(parseFloat);
    // keep the biggest faces first, as many as the frame can hold;
    // close-up portraits fall back to tighter margins around the face
    let heads = null;
    for (const k of [1, .55, 0]) {
      const hs = boxes.map(b => head(b, k)).sort((a, b) => b.area - a.area);
      if (hs[0].x2 - hs[0].x1 <= ww && hs[0].y2 - hs[0].y1 <= wh) { heads = hs; break; }
    }
    if (!heads) heads = boxes.map(b => head(b, 0)).sort((a, b) => b.area - a.area);
    let keep = null; const others = [];
    heads.forEach(hd => {
      const u = union(keep, hd);
      if (!keep || (u.x2 - u.x1 <= ww && u.y2 - u.y1 <= wh)) keep = u; else others.push(hd);
    });
    const px = place(pref[0], ww, keep, others, 'x1', 'x2');
    const py = place(isNaN(pref[1]) ? 50 : pref[1], wh, keep, others, 'y1', 'y2');
    img.style.objectPosition = px + '% ' + py + '%';
  };

  const all = () => document.querySelectorAll('img').forEach(img => {
    if (!FACES[fileOf(img)]) return;
    if (img.complete) fit(img); else img.addEventListener('load', () => fit(img), { once: true });
  });

  window.fitFaces = all;
  window.__FACES = FACES;
  window.fitFace = fit;
  let t;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(all, 120); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', all); else all();
  window.addEventListener('load', all);
})();
