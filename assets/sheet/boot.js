
/* Boot: wire the component to the page. */
var C = new Component(), H = C.renderVals(), TK = 'sheet:tr';
var NEWSLETTER = 'https://olegpustovit.substack.com/api/v1/free?nojs=true';

function ss(op, k, v) { try { if (op === 'get') return sessionStorage.getItem(k); if (op === 'set') sessionStorage.setItem(k, v); else sessionStorage.removeItem(k); } catch (e) {} return null; }

/* The newsletter form posts to Substack. Substack does not send CORS headers,
   so the response is opaque: a resolved request means it was delivered. */
H.subscribe = function (e) {
  var f = e && e.currentTarget && e.currentTarget.closest('[data-form]'); if (!f) return;
  var inp = f.querySelector('input'), msg = f.querySelector('[data-stmsg]'), lab = f.querySelector('[data-sublabel]'), v = (inp.value || '').trim();
  if (f.getAttribute('data-state') === 'sending') return;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) { f.setAttribute('data-state', 'error'); msg.textContent = 'Enter a full email address, like you@domain.com.'; inp.focus(); return; }
  f.setAttribute('data-state', 'sending'); msg.textContent = 'Sending'; lab.textContent = 'Sending';
  var body = new URLSearchParams(); body.set('email', v); body.set('first_url', location.href); body.set('current_url', location.href);
  fetch(NEWSLETTER, { method: 'POST', mode: 'no-cors', body: body }).then(function () {
    f.setAttribute('data-state', 'done'); msg.textContent = 'Almost done. Confirm from the email Substack just sent.'; lab.textContent = 'Subscribed';
  }, function () {
    f.setAttribute('data-state', 'error'); msg.textContent = 'Could not reach Substack. Try again, or subscribe at olegpustovit.substack.com.'; lab.textContent = 'Subscribe';
  });
};

/* Copy chip on code figures. */
H.copyCode = function (e) {
  var b = e && e.currentTarget, fig = b && b.closest('figure'); if (!fig) return;
  var lines = fig.querySelectorAll('pre .cl'), out = [];
  for (var i = 0; i < lines.length; i++) out.push(lines[i].textContent);
  var done = function () { b.classList.add('ok'); b.textContent = 'Copied'; setTimeout(function () { b.classList.remove('ok'); b.textContent = 'Copy'; }, 1800); };
  try { navigator.clipboard.writeText(out.join('\n')).then(done, function () {}); } catch (err) {}
};

/* Enter submits the newsletter form. */
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Enter' || !e.target.closest) return;
  var f = e.target.closest('[data-form]'), b = f && f.querySelector('[data-on="subscribe"]');
  if (b) { e.preventDefault(); H.subscribe({ currentTarget: b }); }
});

document.addEventListener('click', function (e) {
  var el = e.target.closest && e.target.closest('[data-on]');
  if (el) {
    var fn = H[el.getAttribute('data-on')];
    if (fn) { e.preventDefault(); fn({ currentTarget: el, target: e.target }); }
    return;
  }
  leave(e);
});

/* Page transitions between pages reuse the in-page wipe: the out phase covers
   the screen, the browser navigates under the cover, and the next page plays
   the in phase. */
var KINDS = ['rings', 'bands', 'split', 'dither', 'columns', 'field', 'cells'];
function leave(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
  if (a.target && a.target !== '_self') return;
  if (a.hasAttribute('download')) return;
  var u = new URL(a.href, location.href);
  if (u.origin !== location.origin) return;
  if (!/^https?:$/.test(u.protocol)) return;
  if (/\.(xml|cast|svg|png|jpe?g|webp|gif|pdf|txt|zip)$/i.test(u.pathname)) return;
  if (u.pathname === location.pathname && u.search === location.search) {
    if (!u.hash) return;
    var t = document.getElementById(decodeURIComponent(u.hash.slice(1)));
    if (!t) return;
    e.preventDefault();
    if (C.still() || window.innerHeight > 1600 || C._tr) { t.scrollIntoView(); history.pushState(null, '', u.hash); return; }
    start(t, function () { history.pushState(null, '', u.hash); });
    return;
  }
  if (C.still() || C._tr) return;
  e.preventDefault();
  start(null, function () { location.href = u.href; });
}
function start(target, after) {
  var n = (parseInt(ss('get', TK + 'n'), 10) || 0) + 1, m = C._mouse, kind = KINDS[(n - 1) % KINDS.length], seed = (n * 7919) % 97;
  ss('set', TK + 'n', String(n));
  var tr = { phase: 'out', start: performance.now(), kind: kind, seed: seed, ox: m ? m.x : innerWidth / 2, oy: m ? m.y : innerHeight / 2 };
  tr.el = { scrollIntoView: function () {
    if (target) { target.scrollIntoView(); if (after) after(); return; }
    ss('set', TK, JSON.stringify({ kind: kind, seed: seed, ox: tr.ox, oy: tr.oy }));
    tr.hold = true; after();
  } };
  C._tr = tr;
}
/* Hold the cover while the next page loads. */
var drawWipe = C.drawWipe;
C.drawWipe = function (ts) {
  var tr = this._tr;
  if (tr && tr.hold && tr.phase === 'in') tr.start = ts + 1e9;
  drawWipe.call(this, ts);
  if (document.documentElement.classList.contains('tr-in') && this._tr && this._tr.phase === 'in') document.documentElement.classList.remove('tr-in');
};
window.addEventListener('pageshow', function (e) {
  if (!e.persisted) return;
  C._tr = null; document.documentElement.classList.remove('tr-in');
  var cv = document.querySelector('canvas[data-wipe]'); if (cv) { cv.width = 1; cv.height = 1; }
});
(function () {
  var raw = ss('get', TK); ss('del', TK);
  if (!raw) { document.documentElement.classList.remove('tr-in'); return; }
  try {
    var p = JSON.parse(raw);
    if (C.still()) { document.documentElement.classList.remove('tr-in'); return; }
    C._tr = { phase: 'in', start: performance.now() + 60, kind: p.kind, seed: p.seed, ox: p.ox, oy: p.oy, el: { scrollIntoView: function () {} } };
  } catch (err) { document.documentElement.classList.remove('tr-in'); }
})();

/* Terminal recordings: the design's recording frame hosts asciinema-player. */
var AP = null;
function player() {
  if (AP) return AP;
  AP = new Promise(function (ok, no) {
    var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = '/lib/asciinema-player/asciinema-player.css'; document.head.appendChild(l);
    var s = document.createElement('script'); s.src = '/lib/asciinema-player/asciinema-player.min.js'; s.onload = function () { ok(window.AsciinemaPlayer); }; s.onerror = no; document.head.appendChild(s);
  });
  return AP;
}
function clock(t) { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }
function mountRec(fig) {
  if (fig.__p) return; fig.__p = 1;
  var host = fig.querySelector('.lines'), btn = fig.querySelector('.play'), tm = fig.querySelector('[data-rectime]');
  var auto = fig.hasAttribute('data-autoplay') && !C.still();
  player().then(function (AP2) {
    host.textContent = '';
    var opt = { fit: 'both', controls: false, autoPlay: auto, loop: fig.hasAttribute('data-loop'), preload: true, theme: 'sheet', terminalFontFamily: "'Pragmasevka', ui-monospace, monospace" };
    if (fig.getAttribute('data-start')) opt.poster = fig.getAttribute('data-start');
    if (fig.getAttribute('data-speed')) opt.speed = parseFloat(fig.getAttribute('data-speed'));
    if (fig.getAttribute('data-idle')) opt.idleTimeLimit = parseFloat(fig.getAttribute('data-idle'));
    var p = AP2.create(fig.getAttribute('data-cast'), host, opt);
    fig.__player = p;
    var set = function (on) { fig.classList.toggle('is-playing', on); if (btn) btn.setAttribute('aria-label', on ? 'Pause recording' : 'Play recording'); };
    p.addEventListener('play', function () { set(true); });
    p.addEventListener('playing', function () { set(true); });
    p.addEventListener('pause', function () { set(false); });
    p.addEventListener('ended', function () { set(false); });
    if (auto) set(true);
    if (tm && p.getCurrentTime) setInterval(function () { Promise.resolve(p.getCurrentTime()).then(function (t) { if (typeof t !== 'number') return; var s2 = clock(t); if (tm.textContent !== s2) tm.textContent = s2; }, function () {}); }, 250);
  }, function () { host.textContent = 'Could not load the terminal player.'; });
}
H.playRec = function (e) {
  var fig = e.currentTarget.closest('.rec'); if (!fig) return;
  mountRec(fig);
  player().then(function () {
    var go = function () {
      var p = fig.__player; if (!p) return setTimeout(go, 50);
      if (fig.classList.contains('is-playing')) p.pause(); else p.play();
    };
    go();
  });
};
var recs = document.querySelectorAll('figure.rec[data-cast]');
if (recs.length) {
  if ('IntersectionObserver' in window) {
    var ob = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { ob.unobserve(en.target); mountRec(en.target); } }); }, { rootMargin: '200px 0px' });
    recs.forEach(function (r) { ob.observe(r); });
  } else recs.forEach(mountRec);
}

C.componentDidMount();
})();
