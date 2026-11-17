(function () {
  'use strict';
  var PROMO_URL = '/advent/';            // рекламная страница Адвента (заменим, когда будет готова)
  var COLORS = ['red', 'yellow', 'green', 'blue'];
  var HEX = { red: '#e0605a', yellow: '#e7b622', green: '#3fa58b', blue: '#4a90c8' };
  var $ = function (id) { return document.getElementById(id); };
  var A = window.XmasAudio;
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------------- Ёлка (SVG) ---------------- */
  var TIERS = [
    { ty: 410, tw: 170, by: 600, bw: 268, n: 7 },
    { ty: 285, tw: 120, by: 465, bw: 222, n: 6 },
    { ty: 165, tw: 70, by: 335, bw: 172, n: 5 },
    { ty: 60, tw: 0, by: 215, bw: 118, n: 4 }
  ];
  function tierPath(t) {
    var c = 300, xl = c - t.bw + 6, xr = c + t.bw - 6, seg = (xr - xl) / t.n, my = t.ty + (t.by - t.ty) * .72;
    var d = 'M' + (c - t.tw) + ' ' + t.ty +
      'Q' + (c - t.bw * .62) + ' ' + my + ' ' + (c - t.bw - 12) + ' ' + (t.by - 10) +
      'Q' + (c - t.bw - 16) + ' ' + (t.by + 4) + ' ' + xl + ' ' + (t.by + 2);
    for (var i = 1; i <= t.n; i++) d += 'A' + (seg * .56) + ' ' + (seg * .5) + ' 0 0 0 ' + (xl + seg * i).toFixed(1) + ' ' + (t.by + 2);
    d += 'Q' + (c + t.bw + 16) + ' ' + (t.by + 4) + ' ' + (c + t.bw + 12) + ' ' + (t.by - 10) +
      'Q' + (c + t.bw * .62) + ' ' + my + ' ' + (c + t.tw) + ' ' + t.ty + 'Z';
    return d;
  }
  var GARLANDS = [[200, 185, 300, 240, 400, 180, 5], [175, 300, 300, 362, 435, 295, 6], [130, 440, 300, 505, 470, 430, 7], [112, 565, 300, 625, 492, 560, 8]];
  var BULB = ['#ff6b6b', '#ffd23f', '#4fc3f7', '#ff8fd0', '#7ee081'];
  var SLOTS = [[300, 112], [238, 222], [362, 222], [192, 342], [300, 350], [408, 342], [228, 474], [372, 474]];
  var BALL_W = 60;
  function starPath(cx, cy, r) {
    var d = '', i;
    for (i = 0; i < 10; i++) { var rr = i % 2 ? r * .5 : r, an = Math.PI / 5 * i - Math.PI / 2; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(an)).toFixed(1) + ' ' + (cy + rr * Math.sin(an)).toFixed(1); }
    return d + 'Z';
  }
  function buildTree() {
    var s = '<defs>' +
      '<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" result="n"/>' +
      '<feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  3.2 0 0 0 -2.05" result="w"/>' +
      '<feComposite in="w" in2="SourceGraphic" operator="in" result="sp"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sp"/></feMerge></filter>' +
      '<filter id="blur6" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="6"/></filter>' +
      '<clipPath id="potclip"><path d="M248 592L352 592L344 678Q300 688 256 678Z"/></clipPath>' +
      '</defs>';
    // горшок
    s += '<path d="M248 592L352 592L344 678Q300 688 256 678Z" fill="#ec9a8c" stroke="#b9584f" stroke-width="4" stroke-linejoin="round"/>' +
      '<g clip-path="url(#potclip)" stroke="#f9cfc5" stroke-width="5"><path d="M240 618H360M240 640H360M240 662H360"/></g>' +
      '<rect x="236" y="584" width="128" height="20" rx="7" fill="#e7887b" stroke="#b9584f" stroke-width="4"/>';
    // ярусы (снизу вверх), с тенью от верхнего яруса
    TIERS.forEach(function (t, i) {
      if (i > 0) s += '<path d="' + tierPath(t) + '" fill="#7fb5a8" opacity=".5" transform="translate(0 9)"/>';
      s += '<path d="' + tierPath(t) + '" fill="#acd8cd" filter="url(#grain)"/>' +
        '<path d="' + tierPath(t) + '" fill="none" stroke="#3f7f78" stroke-width="4.5" stroke-linejoin="round"/>';
    });
    // блёстки
    var rnd = mulberry(11), dots = '';
    for (var k = 0; k < 170; k++) {
      var y = 80 + rnd() * 510, half = y < 215 ? (y - 60) / 155 * 110 : y < 335 ? 100 + (y - 215) / 120 * 70 : y < 465 ? 150 + (y - 335) / 130 * 70 : 200 + (y - 465) / 135 * 65;
      var x = 300 + (rnd() * 2 - 1) * half * .9;
      dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (rnd() * 1.6 + .8).toFixed(1) + '" fill="#fff" opacity="' + (.5 + rnd() * .5).toFixed(2) + '"/>';
    }
    s += '<g>' + dots + '</g>';
    // гирлянды
    var bi = 0;
    GARLANDS.forEach(function (g) {
      s += '<path d="M' + g[0] + ' ' + g[1] + 'Q' + g[2] + ' ' + g[3] + ' ' + g[4] + ' ' + g[5] + '" fill="none" stroke="#e7c27a" stroke-width="3" stroke-linecap="round"/>';
      for (var j = 1; j <= g[6]; j++) {
        var t = j / (g[6] + 1), x = (1 - t) * (1 - t) * g[0] + 2 * (1 - t) * t * g[2] + t * t * g[4], y = (1 - t) * (1 - t) * g[1] + 2 * (1 - t) * t * g[3] + t * t * g[5];
        var col = BULB[bi % BULB.length];
        s += '<circle class="bulb-glow" cx="' + x.toFixed(1) + '" cy="' + (y + 6).toFixed(1) + '" r="13" fill="' + col + '" filter="url(#blur6)" style="transition-delay:' + (bi * 60) + 'ms"/>' +
          '<rect x="' + (x - 2.5).toFixed(1) + '" y="' + (y - 1).toFixed(1) + '" width="5" height="4" fill="#b9934a"/>' +
          '<ellipse class="bulb" data-c="' + col + '" cx="' + x.toFixed(1) + '" cy="' + (y + 7).toFixed(1) + '" rx="5" ry="7" fill="#fff8e6" stroke="#cdb383" stroke-width="1.5" style="animation-delay:' + (bi % 5 * .23) + 's"/>';
        bi++;
      }
    });
    // звезда (появится в конце)
    s += '<g id="topstar" class="topstar" style="display:none"><path d="' + starPath(300, 46, 44) + '" fill="#f6cf4a" stroke="#c9952a" stroke-width="4" stroke-linejoin="round"/>' +
      '<path d="' + starPath(300, 46, 26) + '" fill="#fbe38a" opacity=".7"/></g>';
    s += '<rect id="star-target" x="256" y="2" width="88" height="88" fill="none"/>';
    $('tree').innerHTML = s;
  }
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  /* ---------------- Раскладка сцены ---------------- */
  var LAYOUT = {
    land: { W: 1000, H: 620, tree: [290, 66, 400], longi: [70, 262, 340], say: [96, 214], box: [706, 318, 282, 252], light: [853, 450], room: 512 },
    port: { W: 600, H: 960, tree: [55, 50, 490], longi: [4, 628, 300], say: [20, 590], box: [190, 628, 404, 312], light: [400, 760], room: 600 }
  };
  var L = null;
  function layout() {
    var iw = window.innerWidth, ih = window.innerHeight, bar = iw <= 520 ? 56 : 62;
    L = iw / ih < .85 ? LAYOUT.port : LAYOUT.land;
    var st = $('stage'), s = Math.min(iw / L.W, (ih - bar) / L.H);
    st.style.width = L.W + 'px'; st.style.height = L.H + 'px';
    st.style.transform = 'translate(' + ((iw - L.W * s) / 2) + 'px,' + (bar + (ih - bar - L.H * s) / 2) + 'px) scale(' + s + ')';
    var t = L.tree, th = t[2] * 700 / 600;
    [$('tree'), $('slots')].forEach(function (el) { el.style.left = t[0] + 'px'; el.style.top = t[1] + 'px'; el.style.width = t[2] + 'px'; el.style.height = th + 'px'; });
    var lg = $('longi'); lg.style.left = L.longi[0] + 'px'; lg.style.top = L.longi[1] + 'px'; lg.style.height = L.longi[2] + 'px';
    var sy = $('say'); sy.style.left = L.say[0] + 'px'; sy.style.top = L.say[1] + 'px';
    var bx = $('box'); bx.style.left = L.box[0] + 'px'; bx.style.top = L.box[1] + 'px'; bx.style.width = L.box[2] + 'px'; bx.style.height = L.box[3] + 'px';
    var lb = $('light-btn'); lb.style.left = L.light[0] + 'px'; lb.style.top = L.light[1] + 'px';
    document.querySelector('.room').style.height = (L.H - L.room) + 'px';
  }

  /* ---------------- Голос ---------------- */
  var VOICE = ['its-red', 'its-yellow', 'its-green', 'its-blue', 'ask-red', 'ask-yellow', 'ask-green', 'ask-blue', 'yes', 'star', 'light', 'wow'];
  var clips = {}, missing = {};
  VOICE.forEach(function (k) {
    var a = new Audio(); a.preload = 'auto';
    a.addEventListener('error', function () { missing[k] = true; if (G && G.asked && 'ask-' + G.asked === k) showWord(); });
    a.src = 'voice/' + k + '.mp3'; clips[k] = a;
  });
  var vTok = 0;
  function speak(keys, done) {
    var tok = ++vTok; keys = [].concat(keys);
    if (!A.sfx) { if (done) setTimeout(done, 300); return; }
    var i = 0;
    (function next() {
      if (tok !== vTok) return;
      if (i >= keys.length) { A.duck(false); if (done) done(); return; }
      var k = keys[i++], a = clips[k];
      if (!a || missing[k]) return next();
      A.duck(true);
      var fin = function () { a.removeEventListener('ended', fin); setTimeout(next, 40); };
      a.addEventListener('ended', fin);
      try { a.currentTime = 0; var p = a.play(); if (p && p.catch) p.catch(function () { missing[k] = true; fin(); }); } catch (e) { fin(); }
    })();
  }
  function stopVoice() { vTok++; VOICE.forEach(function (k) { try { clips[k].pause(); } catch (e) {} }); A.duck(false); }

  /* ---------------- Игра ---------------- */
  var G = null, sayT = null;
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function longi(cls) { var l = $('longi'); l.className = 'longi'; void l.offsetWidth; if (cls) l.classList.add(cls); }
  function bubble(text, ms) {
    var s = $('say'); clearTimeout(sayT); s.textContent = text; s.classList.remove('hidden');
    s.style.animation = 'none'; void s.offsetWidth; s.style.animation = '';
    if (ms) sayT = setTimeout(function () { s.classList.add('hidden'); }, ms);
  }
  function showWord() {
    var w = $('p-word'); w.textContent = G.asked;
    // пока нет озвучки цвета — слово окрашено, чтобы ребёнок мог играть
    w.style.color = missing['ask-' + G.asked] || !A.sfx ? HEX[G.asked] : '';
  }

  function newGame() {
    stopVoice();
    G = { box: shuffle(['red', 'red', 'yellow', 'yellow', 'green', 'green', 'blue', 'blue']), placed: 0, mistakes: 0, asked: null, last: null, phase: 'play', busy: false };
    buildTree();
    var sl = $('slots'); sl.innerHTML = '';
    SLOTS.forEach(function (p, i) {
      var d = document.createElement('div'); d.className = 'slot'; d.id = 'slot' + i;
      d.style.left = (p[0] / 6) + '%'; d.style.top = (p[1] / 7) + '%'; d.style.width = (BALL_W / 6) + '%';
      d.innerHTML = '<span class="ghost"></span>'; sl.appendChild(d);
    });
    var bi = $('box-in'); bi.innerHTML = '';
    G.box.forEach(function (c, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ball'; b.dataset.c = c;
      b.setAttribute('aria-label', 'Шарик ' + (i + 1));
      b.innerHTML = '<img src="img/ball-' + c + '.png" alt="" draggable="false">';
      makeDraggable(b);
      bi.appendChild(b);
    });
    var pr = $('progress'); pr.innerHTML = ''; for (var i = 0; i < 8; i++) pr.appendChild(document.createElement('i'));
    pr.classList.remove('hidden');
    $('light-btn').classList.add('hidden'); $('say').classList.add('hidden'); longi();
    setNext();
    setTimeout(ask, 500);
  }
  function setNext() {
    document.querySelectorAll('.slot').forEach(function (s, i) { s.classList.toggle('next', i === G.placed && G.phase === 'play'); });
  }
  function ask() {
    if (!G || G.phase !== 'play') return;
    var left = []; document.querySelectorAll('.ball:not(.gone)').forEach(function (b) { left.push(b.dataset.c); });
    var opts = left.filter(function (c) { return c !== G.last; }); if (!opts.length) opts = left;
    G.asked = opts[Math.floor(Math.random() * opts.length)];
    var p = $('prompt'); p.classList.remove('hidden', 'ask'); void p.offsetWidth; p.classList.add('ask');
    showWord(); speak('ask-' + G.asked); G.busy = false;
  }
  function repeat() { if (G && G.phase === 'play' && G.asked) { A.fx.tap(); speak('ask-' + G.asked); } }

  function flyTo(srcEl, dstEl, done) {
    var r = srcEl.getBoundingClientRect(), t = dstEl.getBoundingClientRect();
    var img = srcEl.querySelector('img,svg').cloneNode(true);
    var f = document.createElement('div'); f.className = 'fly';
    f.style.left = r.left + 'px'; f.style.top = r.top + 'px'; f.style.width = r.width + 'px'; f.style.height = r.height + 'px';
    img.style.width = '100%'; img.style.height = '100%'; f.appendChild(img); $('fx').appendChild(f);
    f.style.transformOrigin = '0 0';
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      f.style.transform = 'translate(' + (t.left - r.left) + 'px,' + (t.top - r.top) + 'px) scale(' + (t.width / r.width) + ')';
    }); });
    setTimeout(function () { f.remove(); done(); }, 720);
  }
  function sparks(el, n) {
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < (n || 12); i++) {
      var s = document.createElement('i'); s.className = 'spark'; var an = Math.random() * Math.PI * 2, d = 30 + Math.random() * 50;
      s.style.left = cx + 'px'; s.style.top = cy + 'px'; s.style.setProperty('--x', Math.cos(an) * d + 'px'); s.style.setProperty('--y', Math.sin(an) * d + 'px');
      $('fx').appendChild(s); setTimeout(s.remove.bind(s), 750);
    }
  }

  function pick(b, el) {
    if (!G || G.busy) { if (el) giveBack(el, b); return; }
    A.unlock();
    if (G.phase === 'star' && b.classList.contains('star')) return placeStar(b, el);
    if (G.phase !== 'play' || b.classList.contains('gone')) { if (el) giveBack(el, b); return; }
    A.fx.tap();
    var c = b.dataset.c;
    if (c === G.asked) {
      G.busy = true; var slot = $('slot' + G.placed); b.classList.add('gone'); b.classList.remove('lifted');
      $('prompt').classList.remove('ask');
      flyTo(el || b, slot, function () {
        slot.innerHTML = '<img src="img/ball-' + c + '.png" alt="' + c + ' ball" draggable="false">';
        slot.classList.remove('next'); A.fx.hang(); A.fx.ok(); sparks(slot);
        $('progress').children[G.placed].classList.add('on'); $('progress').children[G.placed].style.background = HEX[c];
        G.placed++; G.last = c; longi('yes'); bubble('Yes! ' + c.charAt(0).toUpperCase() + c.slice(1) + '!', 1500);
        speak(['yes', 'its-' + c]);
        setNext();
        if (G.placed === 8) setTimeout(starPhase, 1500); else setTimeout(ask, 1700);
      });
      if (el) el.remove();
    } else {
      G.busy = true; G.mistakes++;
      if (el) giveBack(el, b, 380);
      setTimeout(function () { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }, el ? 380 : 0);
      A.fx.oops(); longi('no'); bubble("No, it's " + c + '.', 1600);
      speak('its-' + c);
      setTimeout(function () { b.classList.remove('shake'); if (G.phase === 'play') { G.busy = false; speak('ask-' + G.asked); } }, 2000);
    }
  }

  /* ---------------- Тап и «удержание»: шарик можно нести пальцем/мышкой ---------------- */
  function giveBack(el, b, ms) {
    var r = b.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
    el.style.transition = 'transform ' + (ms || 320) + 'ms cubic-bezier(.3,1.3,.5,1)';
    el.style.transform = 'translate(' + (r.left + r.width / 2 - w / 2) + 'px,' + (r.top + r.height / 2 - h / 2) + 'px) scale(1)';
    setTimeout(function () { el.remove(); b.classList.remove('lifted'); }, (ms || 320) + 20);
  }
  function overTree(x, y) {
    var r = $('tree').getBoundingClientRect(), padX = r.width * .05;
    return x > r.left - padX && x < r.right + padX && y > r.top && y < r.bottom;
  }
  function makeDraggable(b) {
    var st = null;
    function place(e) {
      var el = st.el, w = el.offsetWidth, h = el.offsetHeight, lift = e.pointerType === 'touch' ? h * .75 : 0;
      st.cx = e.clientX; st.cy = e.clientY - lift;
      el.style.transform = 'translate(' + (st.cx - w / 2) + 'px,' + (st.cy - h / 2) + 'px) scale(1.18)';
      var on = overTree(st.cx, st.cy);
      if (on !== st.over) { st.over = on; document.body.classList.toggle('over-tree', on); }
    }
    b.addEventListener('pointerdown', function (e) {
      if (!G || G.busy || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (G.phase === 'play' ? b.classList.contains('gone') : !b.classList.contains('star')) return;
      st = { id: e.pointerId, x0: e.clientX, y0: e.clientY, on: false, el: null, over: false };
      try { b.setPointerCapture(e.pointerId); } catch (_) {}
    });
    b.addEventListener('pointermove', function (e) {
      if (!st || e.pointerId !== st.id) return;
      if (!st.on) {
        if (Math.hypot(e.clientX - st.x0, e.clientY - st.y0) < 8) return;
        st.on = true; A.unlock();
        var r = b.getBoundingClientRect(), el = document.createElement('div'); el.className = 'drag';
        el.style.width = r.width + 'px'; el.style.height = r.height + 'px';
        el.appendChild(b.querySelector('img,svg').cloneNode(true)); $('fx').appendChild(el);
        el.querySelector('img,svg').style.cssText = 'width:100%;height:100%;display:block';
        st.el = el; b.classList.add('lifted'); document.body.classList.add('dragging');
      }
      place(e);
    });
    function end(e, cancel) {
      if (!st || e.pointerId !== st.id) return;
      var s = st; st = null;
      document.body.classList.remove('dragging', 'over-tree');
      try { b.releasePointerCapture(e.pointerId); } catch (_) {}
      if (!s.on) { if (!cancel) pick(b); return; }
      if (!cancel && overTree(s.cx, s.cy)) pick(b, s.el); else giveBack(s.el, b);
    }
    b.addEventListener('pointerup', function (e) { end(e, false); });
    b.addEventListener('pointercancel', function (e) { end(e, true); });
    b.addEventListener('click', function (e) { if (e.detail === 0) pick(b); });   // клавиатура
  }

  function starPhase() {
    G.phase = 'star'; G.busy = false; $('prompt').classList.add('hidden');
    var bi = $('box-in'); bi.innerHTML = '';
    var b = document.createElement('button'); b.type = 'button'; b.className = 'ball star'; b.setAttribute('aria-label', 'Звезда');
    b.innerHTML = '<svg viewBox="0 0 100 100"><path d="' + starPath(50, 52, 44) + '" fill="#f6cf4a" stroke="#c9952a" stroke-width="4" stroke-linejoin="round"/><path d="' + starPath(50, 52, 26) + '" fill="#fbe38a" opacity=".7"/></svg>';
    b.style.gridColumn = '2 / span 2'; b.style.maxWidth = '110px';
    makeDraggable(b);
    bi.appendChild(b);
    longi('yes'); bubble('Put the star on top!');
    speak('star');
  }
  function placeStar(b, el) {
    G.busy = true; A.fx.tap();
    flyTo(el || b, $('star-target'), function () {
      b.remove(); var s = $('topstar'); s.style.display = ''; s.classList.add('on'); A.fx.star(); sparks($('star-target'), 18);
      G.phase = 'light'; longi('yes'); bubble("Let's light the tree!");
      speak('light');
      setTimeout(function () { $('light-btn').classList.remove('hidden'); G.busy = false; }, 700);
    });
    if (el) { el.remove(); b.style.visibility = 'hidden'; }
  }
  function lightUp() {
    if (!G || G.phase !== 'light' || G.busy) return;
    G.busy = true; G.phase = 'done'; A.unlock();
    $('light-btn').classList.add('hidden'); $('say').classList.add('hidden');
    var tree = $('tree'), bulbs = tree.querySelectorAll('.bulb');
    tree.classList.add('lit'); A.fx.lights();
    bulbs.forEach(function (e, i) { setTimeout(function () { e.setAttribute('fill', e.dataset.c); e.setAttribute('stroke', 'none'); }, i * 60); });
    setTimeout(function () {
      longi('dance'); bubble('Wow! Merry Christmas!');
      speak('wow'); sparks($('tree'), 30);
    }, 900);
    setTimeout(win, 4200);
  }

  var STAR = '<svg viewBox="0 0 24 24"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.7 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z" fill="FILL" stroke="STROKE" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  function win() {
    var n = G.mistakes <= 1 ? 3 : G.mistakes <= 3 ? 2 : 1, h = '';
    for (var i = 0; i < 3; i++) {
      var on = i < n;
      h += STAR.replace('FILL', on ? '#ffd54a' : '#eee6d6').replace('STROKE', on ? '#e0a800' : '#d6ccb6').replace('<svg', on ? '<svg class="on" style="animation-delay:' + (i * .25 + .2) + 's"' : '<svg');
    }
    $('stars').innerHTML = h;
    $('res').textContent = G.mistakes === 0 ? 'Без единой ошибки! Ты знаешь все цвета!' : 'Ошибок: ' + G.mistakes + '. Молодец!';
    show('win'); A.fx.win(); confetti();
  }
  function show(name) {
    document.body.dataset.screen = name;
    $('screen-rules').classList.toggle('hidden', name !== 'rules');
    $('screen-win').classList.toggle('hidden', name !== 'win');
  }
  function confetti() {
    var cv = $('confetti'), ctx = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
    var cols = ['#ec6561', '#3a7872', '#f4e39e', '#f2a4cf', '#4fc3f7', '#fff'], ps = [];
    for (var i = 0; i < 140; i++) ps.push({ x: Math.random() * cv.width, y: -Math.random() * cv.height, vx: Math.random() * 2 - 1, vy: 2 + Math.random() * 3, s: 6 + Math.random() * 7, c: cols[i % cols.length], a: Math.random() * 6 });
    var t0 = performance.now();
    (function loop(t) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.a += .1; ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (t - t0 < 4500 && document.body.dataset.screen === 'win') requestAnimationFrame(loop); else ctx.clearRect(0, 0, cv.width, cv.height);
    })(t0);
  }

  /* ---------------- Снег, кнопки ---------------- */
  var sn = $('snow');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) for (var i = 0; i < 40; i++) {
    var f = document.createElement('i'); f.className = 'flake'; var z = 3 + Math.random() * 6;
    f.style.width = f.style.height = z + 'px'; f.style.left = Math.random() * 100 + '%';
    f.style.animationDuration = (8 + Math.random() * 10) + 's'; f.style.animationDelay = (-Math.random() * 18) + 's';
    f.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px'); sn.appendChild(f);
  }
  function syncBtns() { $('btn-music').classList.toggle('off', !A.music); $('btn-sound').classList.toggle('off', !A.sfx); }
  $('btn-music').addEventListener('click', function () { A.unlock(); A.setMusic(!A.music); if (A.music) A.start(); syncBtns(); });
  $('btn-sound').addEventListener('click', function () { A.unlock(); A.setSfx(!A.sfx); if (!A.sfx) stopVoice(); if (G && G.asked) showWord(); syncBtns(); });
  $('prompt').addEventListener('click', repeat);
  $('light-btn').addEventListener('click', lightUp);
  $('btn-go').addEventListener('click', function () { A.start(); show('play'); newGame(); });
  $('btn-again').addEventListener('click', function () { A.start(); show('play'); newGame(); });
  $('btn-advent').href = PROMO_URL;
  window.addEventListener('resize', layout);
  try { if (window.self !== window.top) document.body.classList.add('embedded'); } catch (e) { document.body.classList.add('embedded'); }
  syncBtns(); buildTree(); layout();
  window.__tree = { state: function () { return G; }, missing: missing };
})();
