
class Component extends DCLogic {
  componentDidMount() {
    var self = this;
    this._n = 0; this._gens = {}; this._mouse = null;
    this._onMove = function (e) { self._mouse = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', this._onMove);
    var loop = function (ts) {
      self._raf = requestAnimationFrame(loop);
      try { self.frame(ts || performance.now()); } catch (err) {}
    };
    this._raf = requestAnimationFrame(loop);
  }
  componentWillUnmount() { cancelAnimationFrame(this._raf); window.removeEventListener('mousemove', this._onMove); }
  still() {
    if ((this.props.animate ?? true) === false) return true;
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  go(id) {
    var root = this._root; if (!root) return;
    var el = id === 'top' ? root : root.querySelector('#' + id);
    if (!el) return;
    if (this.still() || window.innerHeight > 1600 || this._tr) { el.scrollIntoView(); return; }
    var K = ['rings', 'bands', 'split', 'dither', 'columns', 'field', 'cells'], n = this._tk = (this._tk || 0) + 1, m = this._mouse;
    this._tr = { phase: 'out', start: performance.now(), el: el, kind: K[(n - 1) % K.length], seed: (n * 7919) % 97, ox: m ? m.x : 0, oy: m ? m.y : 0 };
  }
  palette() {
    var ink = '#1c1c1c';
    if ((this.props.inks ?? 'six') === 'mono') return [null, ink, ink, ink, ink, ink, ink, ink];
    return [null, ink, '#f26522', '#f0b41c', '#2a5fd0', '#2ea7de', '#1e9a3c', '#6a3fa3'];
  }
  hash(x, y) { var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); }
  noise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var a = this.hash(xi, yi), b = this.hash(xi + 1, yi), c = this.hash(xi, yi + 1), d = this.hash(xi + 1, yi + 1);
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  fit(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return null;
    var pw = Math.round(w * dpr), ph = Math.round(h * dpr);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    var ctx = cv.getContext('2d');
    if (!ctx) return null;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }
  newRow(g, prev) {
    var cols = g.cols, row = new Uint8Array(cols), x;
    function R() { g.s = (g.s * 1664525 + 1013904223) >>> 0; return g.s / 4294967296; }
    if (g.mode === 'text') {
      g.k = (g.k || 0) + 1;
      if (g.k % 2 === 0 || R() < 0.13) return row;
      var end = cols - 2 - Math.floor(R() * cols * 0.45);
      x = 2 + (R() < 0.15 ? 3 : 0);
      while (x < end) { var len = 1 + Math.floor(R() * 6); for (var j = 0; j < len && x < end; j++, x++) row[x] = 1; x++; }
      if (R() < 0.12 && x < cols) row[x] = 2;
      return row;
    }
    for (x = 0; x < cols; x++) {
      var up = prev ? prev[x] : 0, l = prev && x > 0 ? prev[x - 1] : 0, r = prev && x < cols - 1 ? prev[x + 1] : 0;
      var ca = prev ? ((l > 0) !== ((up > 0) || (r > 0))) : R() < 0.5;
      var fx = x / cols, dens = 0.05 + 0.8 * fx * fx;
      if (up > 0 && R() < 0.86) { row[x] = up; continue; }
      if ((ca || R() < 0.04) && R() < dens) {
        var q = R();
        if (fx < 0.45) row[x] = q < 0.9 ? 1 : 2;
        else row[x] = q < 0.5 ? 1 : 2 + Math.floor(R() * 6);
      }
    }
    return row;
  }
  drawGen(key, cv, mode, ts, force) {
    var f = this.fit(cv);
    if (!f) return;
    var cell = 8, cols = Math.max(4, Math.floor(f.w / cell)), rows = Math.max(4, Math.ceil(f.h / cell));
    var g = this._gens[key];
    if (!g || g.mode !== mode || g.cols !== cols || g.rows !== rows) {
      g = this._gens[key] = { mode: mode, cols: cols, rows: rows, grid: [], s: 20261013 + key.length * 977 + mode.length * 131, off: 0, last: 0, drawn: false };
      if (mode !== 'terrain') for (var i = 0; i < rows; i++) g.grid.push(this.newRow(g, g.grid[i - 1]));
    }
    var still = this.still();
    var adv = !g.drawn || (!still && ts - g.last >= 130);
    if (!adv && !force) return;
    if (g.drawn && adv) {
      if (mode === 'terrain') g.off += 0.35;
      else { g.grid.shift(); g.grid.push(this.newRow(g, g.grid[g.grid.length - 1])); }
    }
    if (adv) g.last = ts; g.drawn = true;
    var ctx = f.ctx, pal = this.palette(), x, y, gw = cols * cell;
    ctx.fillStyle = '#e9e8e3'; ctx.fillRect(0, 0, f.w, f.h);
    if (mode === 'terrain') {
      var mono = (this.props.inks ?? 'six') === 'mono';
      var tp = mono ? ['#e9e8e3', '#d2d1cc', '#b4b3ae', '#8b8a86', '#5c5b58', '#1c1c1c'] : ['#f3f5f3', '#b9dcf4', '#74b4ea', '#b3ecae', '#62c935', '#dcbcea'];
      for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
        var bx = Math.floor(x / 2) * 2;
        var v = this.noise(bx * 0.11, (y + g.off) * 0.04) * 0.6 + this.noise(x * 0.33 + 9, (y + g.off) * 0.13) * 0.4 + (y / rows - 0.5) * 0.3;
        var idx = v < 0.3 ? 0 : v < 0.4 ? 1 : v < 0.52 ? 2 : v < 0.6 ? 3 : v < 0.76 ? 4 : (this.hash(x, Math.floor(y + g.off)) > 0.8 ? 5 : 4);
        ctx.fillStyle = tp[idx]; ctx.fillRect(x * cell, y * cell, cell, cell);
      }
      return;
    }
    for (y = 0; y < rows; y++) { var row = g.grid[y]; if (!row) continue; for (x = 0; x < cols; x++) if (row[x]) { ctx.fillStyle = pal[row[x]]; ctx.fillRect(x * cell, y * cell, cell, cell); } }
    ctx.fillStyle = 'rgba(28,28,28,0.2)';
    for (x = 0; x <= cols; x++) ctx.fillRect(x * cell, 0, 1, f.h);
    for (y = 0; y <= rows; y++) ctx.fillRect(0, y * cell, gw, 1);
  }
  cover(ctx, w, h, p, cell, seed) {
    var cols = Math.ceil(w / cell), rows = Math.ceil(h / cell), pal = this.palette();
    for (var y = 0; y < rows; y++) for (var x = 0; x < cols; x++) {
      var thr = (y / rows) * 0.7 + this.hash(x * 1.7 + seed, y * 2.3) * 0.3;
      if (p <= thr) continue;
      var q = this.hash(x + 31, y + 17 + seed);
      ctx.fillStyle = q > 0.86 ? pal[2] : (q > 0.42 ? '#1c1c1c' : '#e9e8e3');
      ctx.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
    }
  }
  tbuf(w, h, c) {
    var cols = Math.ceil(w / c), rows = Math.ceil(h / c), b = this._tb;
    if (!b || b.cols !== cols || b.rows !== rows) { var cv = document.createElement('canvas'); cv.width = cols; cv.height = rows; var cx = cv.getContext('2d'); b = this._tb = { cv: cv, cx: cx, img: cx.createImageData(cols, rows), cols: cols, rows: rows }; }
    return b;
  }
  tblit(ctx, b, c) { b.cx.putImageData(b.img, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(b.cv, 0, 0, b.cols * c, b.rows * c); }
  trans(k, ctx, w, h, p, tr) {
    var H = this.hash.bind(this), N = this.noise.bind(this), cl = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
    var INK = [28, 28, 28], OR = [242, 101, 34], PAP = [244, 243, 238], PD = [214, 213, 207];
    var COL = [[240, 180, 28], [42, 95, 208], [46, 167, 222], [30, 154, 60], [106, 63, 163], OR];
    var c, b, d, x, y, i, col, cols, rows;
    if (k === 'cells') { this.cover(ctx, w, h, p * 1.05, 36, tr.seed); return; }
    if (k === 'split') {
      if (!tr.rects) {
        var R = [], S = tr.seed, rr = function (a) { S = (S * 1664525 + 1013904223) >>> 0; return S / 4294967296; };
        var split = function (x0, y0, W, Hh, dpt) {
          if (dpt >= 6 || Math.max(W, Hh) < 90 || (dpt > 1 && rr() < 0.2)) { R.push({ x: x0, y: y0, w: W, h: Hh, t: Math.min(0.68, dpt * 0.05 + rr() * 0.45), dir: Math.floor(rr() * 4), q: rr() }); return; }
          var r = [1 / 3, 1 / 2, 2 / 3, 1 / 2][Math.floor(rr() * 4)];
          if (W > Hh) { split(x0, y0, W * r, Hh, dpt + 1); split(x0 + W * r, y0, W * (1 - r), Hh, dpt + 1); }
          else { split(x0, y0, W, Hh * r, dpt + 1); split(x0, y0 + Hh * r, W, Hh * (1 - r), dpt + 1); }
        };
        split(0, 0, w, h, 0); tr.rects = R;
      }
      for (i = 0; i < tr.rects.length; i++) {
        var L = tr.rects[i], q = (p - L.t) / 0.3;
        if (q <= 0) continue;
        q = q >= 1 ? 1 : 1 - Math.pow(1 - q, 3);
        col = L.q < 0.42 ? INK : L.q < 0.6 ? OR : L.q < 0.74 ? PD : L.q < 0.8 ? PAP : COL[Math.floor(L.q * 97) % 5];
        ctx.fillStyle = 'rgb(' + col + ')';
        var X = L.x, Y = L.y, W2 = L.w, H2 = L.h;
        if (L.dir === 0) W2 *= q; else if (L.dir === 1) { X += L.w * (1 - q); W2 *= q; } else if (L.dir === 2) H2 *= q; else { Y += L.h * (1 - q); H2 *= q; }
        if (q < 1 && L.q > 0.8) { var n = 6, s2; for (s2 = 0; s2 < n; s2++) ctx.fillRect(L.x, L.y + s2 * L.h / n, L.w * q, L.h / n * q); }
        else ctx.fillRect(Math.floor(X), Math.floor(Y), Math.ceil(W2) + 1, Math.ceil(H2) + 1);
        if (q >= 1) { ctx.fillStyle = 'rgb(' + INK + ')'; ctx.fillRect(L.x, L.y, L.w, 1.5); ctx.fillRect(L.x, L.y, 1.5, L.h); }
      }
      return;
    }
    c = k === 'bands' ? 6 : k === 'columns' ? 10 : k === 'dither' ? 5 : k === 'rings' ? 20 : 14;
    b = this.tbuf(w, h, c); d = b.img.data; cols = b.cols; rows = b.rows;
    var bay = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], s = tr.seed;
    var bid = 0, bl = 0, ox = (tr.ox || w / 2) / c, oy = (tr.oy || h / 2) / c;
    var md = Math.max(ox, cols - ox, oy, rows - oy);
    for (y = 0; y < rows; y++) {
      if (k === 'bands' && --bl <= 0) { bid++; bl = 1 + Math.floor(Math.pow(H(bid, 3 + s), 2.2) * 14); }
      for (x = 0; x < cols; x++) {
        col = null;
        if (k === 'bands') {
          var pr = cl((p * 1.05 - H(bid, 5 + s) * 0.45) / 0.55); pr = 1 - Math.pow(1 - pr, 3);
          var edge = pr * (cols + 14) - (H(x >> 1, y + s) > 0.5 ? 0 : 5) - x;
          if (edge > 0) {
            var per = 2 + Math.floor(H(bid, 6 + s) * 5), bc = COL[Math.floor(H(bid, 9 + s) * 6)], bc2 = H(bid, 2 + s) < 0.35 ? INK : PD;
            col = edge < 3 ? INK : (H(Math.floor(x / 24), bid + s) < 0.3 ? bc2 : bc);
            if (edge >= 3 && x % per === 0 && col !== INK) col = [(col[0] + 510) / 3 | 0, (col[1] + 510) / 3 | 0, (col[2] + 510) / 3 | 0];
          }
        } else if (k === 'columns') {
          var len = cl((p * 1.1 - H(x, 7 + s) * 0.5 - (x / cols) * 0.2) / 0.4) * (rows + 2);
          if (y < len) {
            var runH = 2 + Math.floor(H(x, 1 + s) * 5), rq = H(x * 3.1 + Math.floor(y / runH), 4 + s);
            col = y > len - 1.5 ? OR : rq < 0.78 ? INK : rq < 0.88 ? PAP : COL[Math.floor(rq * 41) % 6];
          }
        } else if (k === 'dither') {
          var th = (bay[(x & 3) + ((y & 3) << 2)] + 0.5) / 16, v = N(x * 0.018 + s, y * 0.03) * 0.72 + th * 0.26;
          if (p * 1.02 > v) {
            var B = N(x * 0.012 + 3.1 + s, y * 0.02), Rr = N(x * 0.015 + 11.7, y * 0.017 + s), par = (x + y) & 1;
            col = par ? PD : PAP;
            if (B > 0.55 && (B - 0.55) * 6 > th) col = par ? COL[1] : (B > 0.68 ? INK : COL[2]);
            if (Rr > 0.6 && (Rr - 0.6) * 6 > th) col = (x & 1) === 0 && (y & 1) === 0 ? OR : (par ? INK : PAP);
            if (p * 1.02 - v < 0.03) col = INK;
          }
        } else if (k === 'rings') {
          var dd = Math.max(Math.abs(x + 0.5 - ox), Math.abs(y + 0.5 - oy)), f = dd / md + H(x, y + s) * 0.06;
          if (p * 1.1 > f) { var ring = Math.floor(dd); col = p * 1.1 - f < 0.035 ? PAP : (ring % 5 === 0 ? OR : INK); }
        } else {
          var fy = y / rows, tv = (1 - fy) * 0.62 + N(x * 0.06 + s, y * 0.08) * 0.36;
          if (p * 1.02 > tv) {
            var mix = fy + (N(x * 0.06, y * 0.08 + s) - 0.5) * 0.8, vv;
            if (mix > 0.5) { vv = N(x * 0.55 + 3, Math.floor(y / 4) * 0.22 + s); col = vv < 0.34 ? [244, 247, 244] : vv < 0.46 ? [203, 240, 198] : vv < 0.58 ? [164, 228, 156] : [98, 190, 36]; }
            else { vv = N(Math.floor(x / 3) * 0.3 + s, y * 0.5); col = vv < 0.34 ? [244, 247, 248] : vv < 0.46 ? [203, 228, 246] : vv < 0.58 ? [160, 205, 241] : [112, 176, 232]; if (H(Math.floor(x / 3), y + s) > 0.965) col = [226, 204, 238]; }
            if (p * 1.02 - tv < 0.025) col = INK;
          }
        }
        i = (y * cols + x) * 4;
        if (col) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; } else d[i + 3] = 0;
      }
    }
    this.tblit(ctx, b, c);
  }
  drawWipe(ts) {
    var tr = this._tr, cv = this._els.wipe;
    if (!tr || !cv) return;
    var D = 680, t = (ts - tr.start) / D;
    if (t >= 1 && tr.phase === 'out') { tr.el.scrollIntoView(); tr.phase = 'in'; tr.start = ts + 90; t = 0; }
    else if (t >= 1 && tr.phase === 'in') { this._tr = null; cv.width = 1; cv.height = 1; return; }
    var e = t < 0 ? 0 : t > 1 ? 1 : (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2), w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    var ctx = cv.getContext('2d'); ctx.clearRect(0, 0, w, h);
    this.trans(tr.kind, ctx, w, h, tr.phase === 'out' ? e : 1 - e, tr);
  }
  mapBlocks(art) {
    var ar = art.getBoundingClientRect(), H = Math.max(1, ar.height), m = this._mb;
    if (m && m.H === H && this._n - m.n < 90) return m;
    var els = art.querySelectorAll('p, .ph2, .ph3, figure, .tbl, .steps li, .dl li, .legend, .pnav, .tagl'), B = [], S = [], i;
    for (i = 0; i < els.length; i++) {
      var e = els[i], cl = e.classList, t = 'p', r = e.getBoundingClientRect();
      if (!r.height || e.closest('.mstrip')) continue;
      if (cl.contains('ph2')) t = 'h2'; else if (cl.contains('ph3')) t = 'h3';
      else if (cl.contains('code')) t = 'code'; else if (cl.contains('rec')) t = 'rec'; else if (cl.contains('fig')) t = 'fig';
      else if (cl.contains('tbl')) t = 'tbl'; else if (cl.contains('legend') || cl.contains('pnav') || cl.contains('tagl')) t = 'meta';
      B.push({ t: t, y: r.top - ar.top, h: r.height, k: i });
    }
    var ss = art.querySelectorAll('section[data-sec]');
    for (i = 0; i < ss.length; i++) {
      var hn = ss[i].querySelector('.hn'), hd = ss[i].querySelector('.ph2 span:last-child, .ph3 span:last-child');
      S.push({ y: ss[i].getBoundingClientRect().top - ar.top, n: hn ? hn.textContent : '', title: hd ? hd.textContent : '' });
    }
    return this._mb = { H: H, n: this._n, B: B, S: S };
  }
  mapSec(mb, y) { var s = null; for (var i = 0; i < mb.S.length; i++) if (mb.S[i].y <= y + 2) s = mb.S[i]; return s || { n: '00', title: 'Introduction' }; }
  drawMap(cv, mb, ts, sY, vh, still) {
    var f = this.fit(cv); if (!f) return;
    var horiz = cv.hasAttribute('data-horiz'), ctx = f.ctx, W = f.w, Hh = f.h, c = horiz ? 3 : 4;
    var nu = Math.floor((horiz ? W : Hh) / c), nv = Math.floor((horiz ? Hh : W) / c), s = nu / mb.H, H = this.hash.bind(this);
    var INK = '#1c1c1c', GR = '#b3b2ac', OR = '#f26522', PAP = '#e9e8e3', tick = still ? 0 : Math.floor(ts / 140);
    ctx.fillStyle = PAP; ctx.fillRect(0, 0, W, Hh);
    var put = function (u, v, col) { if (u < 0 || u >= nu || v < 1 || v >= nv) return; ctx.fillStyle = col; if (horiz) ctx.fillRect(u * c, v * c, c - 1, c - 1); else ctx.fillRect(v * c, u * c, c - 1, c - 1); };
    var w0 = sY * s, w1 = (sY + vh) * s, hv = cv.__hov;
    for (var b = 0; b < mb.B.length; b++) {
      var B = mb.B[b], u0 = Math.floor(B.y * s), u1 = Math.max(u0 + 1, Math.round((B.y + B.h) * s)), u, v, j;
      for (u = u0; u < u1; u++) {
        var ink = u < w1 ? INK : GR, inW = u >= Math.floor(w0) && u < w1, last = u === u1 - 1;
        if (B.t === 'h2') { for (v = 1; v < nv; v++) put(u, v, OR); continue; }
        if (B.t === 'h3') { for (v = 1; v < Math.floor(nv * 0.62); v++) put(u, v, OR); continue; }
        if (B.t === 'code' || B.t === 'rec') {
          for (v = 1; v < nv - 2; v++) put(u, v, u < w1 ? INK : '#77766f');
          if (B.t === 'rec' && last) put(u, nv - 4, OR);
          else if ((u - u0) % 2) { v = 3; var e2 = 3 + Math.floor(H(u, B.k) * (nv - 8)); while (v < e2) { var l2 = 1 + Math.floor(H(u + v, B.k + 3) * 4); for (j = 0; j < l2 && v < e2; j++, v++) put(u, v, H(v, u + B.k) > 0.93 ? OR : '#8f8e89'); v++; } }
          continue;
        }
        if (B.t === 'fig') {
          for (v = 1; v < nv - 1; v++) {
            var edge = u === u0 || last || v === 1 || v === nv - 2;
            var q = H(Math.floor(v / 3) + B.k, Math.floor((u - u0) / 2) + (inW ? tick : 0) * 0.0001);
            if (edge) put(u, v, ink); else if (q > 0.62) put(u, v, q > 0.93 ? OR : ink);
          }
          continue;
        }
        if (B.t === 'tbl') { for (v = 1; v < nv - 1; v++) if (u === u0 || v % 7 < (u === u0 ? 7 : 1 + Math.floor(H(v >> 3, u) * 5))) put(u, v, ink); continue; }
        if (B.t === 'meta') { for (v = 1; v < nv - 1; v += 3) put(u, v, ink); continue; }
        v = B.t === 'li' ? 4 : 2;
        var end = last ? Math.floor(nv * (0.3 + 0.5 * H(B.k, u))) : nv - 2 - Math.floor(H(u, B.k) * 4);
        if (B.t === 'li' && u === u0) put(u, 2, ink);
        while (v < end) { var len = 1 + Math.floor(H(u * 1.3 + v, B.k) * 5); for (j = 0; j < len && v < end; j++, v++) put(u, v, ink); v++; }
        if (inW && !still && H(u * 3.7, tick + B.k) > 0.8) put(u, 2 + Math.floor(H(u, tick) * (nv - 4)), OR);
      }
    }
    var a = Math.max(0, Math.min(nu, w0)) * c, z = Math.max(0, Math.min(nu, w1)) * c;
    ctx.fillStyle = OR;
    if (horiz) { ctx.fillRect(a, 0, z - a, 2); } else { ctx.fillRect(0, a, 3, z - a); }
    ctx.fillStyle = INK;
    if (horiz) { ctx.fillRect(a, 0, 1, Hh); ctx.fillRect(z - 1, 0, 1, Hh); }
    else { ctx.fillRect(0, a, W, 1); ctx.fillRect(0, z - 1, W, 1); ctx.fillRect(W - 10, a, 10, 3); ctx.fillRect(W - 10, z - 3, 10, 3); }
    if (hv != null) {
      ctx.fillStyle = OR; var hp = hv * (horiz ? W : Hh);
      if (horiz) ctx.fillRect(hp - 1, 0, 2, Hh); else { ctx.fillRect(0, hp - 1, W, 2); }
    }
  }
  bindMap(cv) {
    if (cv.__b) return; cv.__b = 1;
    var self = this, drag = false;
    var at = function (e) { var r = cv.getBoundingClientRect(), h = cv.hasAttribute('data-horiz'); return Math.max(0, Math.min(1, h ? (e.clientX - r.left) / r.width : (e.clientY - r.top) / r.height)); };
    var jump = function (fr) {
      var art = self._els && self._els.art, mb = self._mb; if (!art || !mb) return;
      var vh = window.innerHeight, d = art.getBoundingClientRect().top + fr * mb.H - vh / 2;
      window.scrollBy(0, d);
    };
    cv.addEventListener('pointerdown', function (e) { drag = true; try { cv.setPointerCapture(e.pointerId); } catch (err) {} cv.__hov = at(e); jump(cv.__hov); });
    cv.addEventListener('pointermove', function (e) { cv.__hov = at(e); if (drag) jump(cv.__hov); });
    cv.addEventListener('pointerup', function () { drag = false; });
    cv.addEventListener('pointerleave', function () { if (!drag) cv.__hov = null; });
  }
  maps(ts, vh, live, still) {
    var E = this._els, art = E.art; if (!art || !E.map.length) return;
    var mb = this.mapBlocks(art), ar = art.getBoundingClientRect(), sY = live ? -ar.top + 49 : 0, vv = live ? vh - 49 : 900, i;
    var hov = null, key;
    for (i = 0; i < E.map.length; i++) { this.bindMap(E.map[i]); if (E.map[i].__hov != null) hov = E.map[i].__hov * mb.H; }
    var sec = this.mapSec(mb, hov != null ? hov : sY + vv * 0.3);
    key = Math.round(sY) + '|' + (hov != null ? Math.round(hov) : -1) + '|' + (still ? 0 : Math.floor(ts / 140)) + '|' + mb.H;
    if (key !== this._mk) { this._mk = key; for (i = 0; i < E.map.length; i++) this.drawMap(E.map[i], mb, ts, sY, vv, still); }
    for (i = 0; i < E.mapsec.length; i++) if (E.mapsec[i].textContent !== sec.title) E.mapsec[i].textContent = sec.title;
    for (i = 0; i < E.mapn.length; i++) if (E.mapn[i].textContent !== sec.n) E.mapn[i].textContent = sec.n;
  }
  collect() {
    var root = document.querySelector('[data-root]');
    if (!root) return;
    function all(sel) { return Array.prototype.slice.call(root.querySelectorAll(sel)); }
    this._root = root;
    this._els = { io: all('.io'), par: all('[data-par]'), nav: all('[data-nav]'), tick: all('[data-tick]'), sec: all('[data-sec]'), secno: all('[data-secno]'), tc: all('[data-tc]'), scr: all('[data-scr]'), mq: all('[data-mq]'), hrow: all('[data-hrow]'), hero: root.querySelector('[data-hero]'), prog: root.querySelector('[data-prog]'), ph: root.querySelector('[data-ph]'), phb: root.querySelector('[data-phb]'), hno: root.querySelector('[data-hno]'), hgen: root.querySelector('canvas[data-hgen]'),
      fill: root.querySelector('[data-fill]'), pct: root.querySelector('[data-pct]'), mode: root.querySelector('[data-mode]'), gen: root.querySelector('canvas[data-gen]'), map: all('canvas[data-map]'), mapsec: all('[data-mapsec]'), mapn: all('[data-mapn]'), pct2: all('[data-pct2]'), art: root.querySelector('article.post'), wipe: root.querySelector('canvas[data-wipe]') };
  }
  frame(ts) {
    this._n++;
    if (!this._els || this._n % 90 === 1) this.collect();
    var E = this._els; if (!E) return;
    var vh = window.innerHeight, live = vh < 1600, still = this.still(), root = this._root, i, r;
    var rr = root.getBoundingClientRect(), total = Math.max(1, rr.height - vh), sp = live ? Math.max(0, Math.min(1, -rr.top / total)) : 0;
    if (E.fill) E.fill.style.transform = 'scaleY(' + sp.toFixed(4) + ')';
    var pct = ('00' + Math.round(sp * 100)).slice(-3);
    if (E.pct && E.pct.textContent !== pct) E.pct.textContent = pct;
    for (i = 0; i < E.pct2.length; i++) if (E.pct2[i].textContent !== pct) E.pct2[i].textContent = pct;
    if (E.prog) E.prog.style.transform = 'scaleX(' + sp.toFixed(4) + ')';
    if (!still) {
      var fr = Math.floor(ts / 1000 * 24), z2 = function (v) { return (v < 10 ? '0' : '') + v; }, tc = z2(Math.floor(fr / 86400) % 24) + ':' + z2(Math.floor(fr / 1440) % 60) + ':' + z2(Math.floor(fr / 24) % 60) + ':' + z2(fr % 24);
      for (i = 0; i < E.tc.length; i++) if (E.tc[i].textContent !== tc) E.tc[i].textContent = tc;
    }
    var hp = still ? 0 : (ts % 12000) / 12000, hi = Math.min(2, Math.floor(hp * 3));
    if (E.phb) E.phb.style.transform = 'scaleX(' + hp.toFixed(4) + ')';
    if (hi !== this._hi) { this._hi = hi; for (i = 0; i < E.hrow.length; i++) E.hrow[i].classList.toggle('on', i === hi); if (E.hno) E.hno.textContent = '0' + (hi + 1); }
    if (E.hgen && E.hgen.getBoundingClientRect().bottom > 0) this.drawGen('hero', E.hgen, 'automaton', ts);
    var CH = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/+';
    for (i = 0; i < E.scr.length; i++) {
      var se = E.scr[i], sd = se.__s;
      if (sd === 2) continue;
      if (!sd) { var host = se.closest('.io'); if (host && !host.classList.contains('in')) continue; se.__s = sd = { t: se.textContent, st: ts + (i % 5) * 70 }; if (still || !live) { se.__s = 2; continue; } }
      var el2 = ts - sd.st, n2 = sd.t.length, done = Math.floor(el2 / 34), out = '';
      if (el2 < 0) continue;
      if (done >= n2) { se.textContent = sd.t; se.__s = 2; continue; }
      for (var c = 0; c < n2; c++) { var chh = sd.t.charAt(c); out += (c < done || chh === ' ') ? chh : CH.charAt(Math.floor(this.hash(c + i, Math.floor(ts / 50)) * CH.length)); }
      se.textContent = out;
    }
    var sc = live && !still ? -rr.top : 0;
    for (i = 0; i < E.mq.length; i++) E.mq[i].style.transform = 'translate3d(' + (-((sc * 0.5 + i * 140) % 900)).toFixed(1) + 'px,0,0)';
    for (i = 0; i < E.io.length; i++) { var el = E.io[i]; if (el.classList.contains('in')) continue; if (!live || still || sp > 0.985 || el.getBoundingClientRect().top < vh * 0.86) el.classList.add('in'); }
    for (i = 0; i < E.par.length; i++) {
      var pe = E.par[i], f = parseFloat(pe.getAttribute('data-par')) || 0;
      r = pe.getBoundingClientRect();
      var off = live && !still ? Math.max(-60, Math.min(60, (r.top + r.height / 2 - vh / 2) * f)) : 0;
      pe.style.translate = '0 ' + off.toFixed(1) + 'px';
    }
    var cur = '', idx = 0;
    for (i = 0; i < E.sec.length; i++) if (E.sec[i].getBoundingClientRect().top < vh * 0.5) { cur = E.sec[i].getAttribute('data-sec'); idx = i + 1; }
    if (!live) { cur = root.getAttribute('data-home') || 'projects'; idx = 1; }
    if (cur !== this._cur) {
      this._cur = cur;
      for (i = 0; i < E.nav.length; i++) E.nav[i].classList.toggle('on', E.nav[i].getAttribute('data-nav') === cur);
      for (i = 0; i < E.tick.length; i++) E.tick[i].classList.toggle('on', E.tick[i].getAttribute('data-tick') === cur);
      for (i = 0; i < E.secno.length; i++) E.secno[i].textContent = String(idx);
    }
    var mode = (E.gen && E.gen.getAttribute('data-fixed')) || (cur === 'experiments' ? 'terrain' : cur === 'writings' ? 'text' : 'automaton');
    if (E.gen) {
      if (!this._mode) this._mode = mode;
      if (mode !== this._mode && !this._sw) { if (still) this._mode = mode; else this._sw = { from: this._mode, to: mode, start: ts }; }
      var sw = this._sw, m = this._mode, p = 0;
      if (sw) { var t = (ts - sw.start) / 900; if (t >= 1) { this._mode = sw.to; this._sw = null; m = this._mode; } else { m = t < 0.5 ? sw.from : sw.to; p = (t < 0.5 ? t * 2 : (1 - t) * 2); p = 1 - Math.pow(1 - p, 2); } }
      this.drawGen('spine' + m, E.gen, m, ts, !!sw || this._lastM !== m);
      this._lastM = m;
      if (sw && p > 0) { var f2 = this.fit(E.gen); if (f2) this.cover(f2.ctx, f2.w, f2.h, p * 1.05, 24, 5); }
      var name = m.charAt(0).toUpperCase() + m.slice(1);
      if (E.mode && E.mode.textContent !== name) E.mode.textContent = name;
    }
    this.maps(ts, vh, live, still);
    this.kit(ts);
    this.drawWipe(ts);
  }
  kit(ts) {
    var root = this._root; if (!root || !root.hasAttribute('data-kitroot')) return;
    if (!this._kc || this._n % 90 === 1) this._kc = { g: root.querySelectorAll('canvas[data-kg]'), t: root.querySelectorAll('canvas[data-kt]') };
    var i, Kc = this._kc, still = this.still();
    for (i = 0; i < Kc.g.length; i++) this.drawGen('kit' + i, Kc.g[i], Kc.g[i].getAttribute('data-kg'), ts);
    if (!still && this._n % 2) return;
    for (i = 0; i < Kc.t.length; i++) {
      var cv = Kc.t[i], f = this.fit(cv); if (!f) continue;
      var t = still ? 0.3 : ((ts + i * 450) % 3400) / 3400, p = t < 0.42 ? t / 0.42 : t < 0.58 ? 1 : Math.max(0, 1 - (t - 0.58) / 0.42);
      p = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      if (!cv.__tr) cv.__tr = { seed: ((i + 1) * 7919) % 97, ox: f.w * 0.3, oy: f.h * 0.4 };
      f.ctx.clearRect(0, 0, f.w, f.h);
      this.trans(cv.getAttribute('data-kt'), f.ctx, f.w, f.h, p, cv.__tr);
    }
  }
  renderVals() {
    var self = this;
    if (!this._h) this._h = {
      goTop: function () { self.go('top'); }, goP: function () { self.go('projects'); }, goE: function () { self.go('experiments'); }, goW: function () { self.go('writings'); }, goC: function () { self.go('contact'); },
      copyMail: function (e) { var b = e && e.currentTarget; try { navigator.clipboard.writeText('oleg@olegpustovit.com'); } catch (err) {} if (b) { b.classList.add('ok'); b.lastChild.textContent = 'Copied'; setTimeout(function () { b.classList.remove('ok'); b.lastChild.textContent = 'Copy address'; }, 1800); } },
      subscribe: function (e) {
        var f = e && e.currentTarget && e.currentTarget.closest('[data-form]'); if (!f) return;
        var inp = f.querySelector('input'), msg = f.querySelector('[data-stmsg]'), lab = f.querySelector('[data-sublabel]'), v = (inp.value || '').trim();
        if (f.getAttribute('data-state') === 'sending') return;
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { f.setAttribute('data-state', 'error'); msg.textContent = 'Enter a full email address, like you@domain.com.'; inp.focus(); return; }
        f.setAttribute('data-state', 'sending'); msg.textContent = 'Sending'; lab.textContent = 'Sending';
        setTimeout(function () { f.setAttribute('data-state', 'done'); msg.textContent = 'Almost done. Confirm from the email Substack just sent.'; lab.textContent = 'Subscribed'; }, 900);
      },

      cycle: function () { var c = self._cur; self.go(c === 'projects' ? 'experiments' : c === 'experiments' ? 'writings' : c === 'writings' ? 'contact' : c === 'contact' ? 'top' : 'projects'); }
    };
    return this._h;
  }
}
