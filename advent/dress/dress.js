(function () {
  'use strict';
  var PROMO_URL = '/advent/';            // рекламная страница Адвента (заменим, когда будет готова)
  var $ = function (id) { return document.getElementById(id); };
  var A = window.XmasAudio;

  /* Вещи. Посадка — в координатах картинки Лонги 396×563: x, y (левый верх), ширина */
  var ITEMS = {
    sweater: { word: 'sweater', icon: 'sweater', layers: [['sweater', 34, 296, 336, 214]] },
    coat: { word: 'coat', icon: 'coat', layers: [['coat', 20, 290, 360, 215]] },
    socks: { word: 'socks', icon: 'socks2', plural: true, layers: [['socks', 110, 482, 100], ['socks2', 256, 478, 100]] },
    boots: { word: 'boots', icon: 'boots', plural: true, layers: [['boots', 108, 462, 104], ['boots2', 254, 458, 104]] },
    hat: { word: 'hat', icon: 'hat', layers: [['hat', 70, -62, 150]] }
  };
  var Z = ['sweater', 'coat', 'socks', 'boots', 'hat'];          // порядок слоёв на Лонги
  var SIZE = { sweater: [280, 207], coat: [393, 246], socks: [154, 123], socks2: [186, 148], boots: [169, 169], boots2: [169, 168], hat: [195, 233] };

  function heroHTML(on) {
    var h = '<img class="base" src="../tree/img/longi.png" alt="" draggable="false">';
    Z.forEach(function (k) {
      ITEMS[k].layers.forEach(function (l) {
        var s = SIZE[l[0]], hgt = l[4] || l[3] * s[1] / s[0];
        h += '<img class="layer' + (on ? ' on' : '') + '" data-k="' + k + '" src="img/' + l[0] + '.png" alt="" draggable="false" style="left:' + (l[1] / 3.96) + '%;top:' + (l[2] / 5.63) + '%;width:' + (l[3] / 3.96) + '%;height:' + (hgt / 5.63) + '%">';
      });
    });
    return h;
  }

  /* ---------------- Раскладка и зимний пейзаж ---------------- */
  var LAYOUT = {
    land: { W: 1000, H: 620, hero: [150, 92, 500], say: [430, 70], rack: [610, 92, 360, 500, 2, 3], ground: 540 },
    port: { W: 600, H: 960, hero: [118, 92, 500], say: [300, 40], rack: [20, 636, 560, 300, 3, 2], ground: 560 }
  };
  var L = null, scale = 1, stage = $('stage');
  function fir(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-6" y="-8" width="12" height="20" fill="#8f6a52"/>' +
      '<path d="M0 -120L34 -62H20L46 -22H28L58 10H-58L-28 -22H-46L-20 -62H-34Z" fill="#5d9e92"/>' +
      '<path d="M0 -120L20 -86Q8 -80 0 -88Q-8 -80 -20 -86Z M-30 -56Q-14 -50 0 -58Q14 -50 30 -56L22 -62H-22Z M-40 -16Q-18 -8 0 -18Q18 -8 40 -16L30 -22H-30Z M-52 6Q-26 14 0 4Q26 14 52 6L58 10H-58Z" fill="#fff"/></g>';
  }
  function scene() {
    var P = 1000, W = L.W + 2 * P, H = L.H + 2 * P, g = L.ground, ox = P, s = '';
    s += '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfdff1"/><stop offset="1" stop-color="#eef7fc"/></linearGradient></defs>';
    s += '<rect width="' + W + '" height="' + H + '" fill="#bfdff1"/><g transform="translate(0 ' + P + ')">';
    s += '<rect y="0" width="' + W + '" height="' + g + '" fill="url(#sky)"/>';
    s += '<circle cx="' + (ox + L.W * (L.W > 800 ? .05 : .84)) + '" cy="' + (L.H * (L.W > 800 ? .12 : .1)) + '" r="44" fill="#fff6d6" opacity=".9"/>';
    s += '<path d="M0 ' + (g - 70) + ' Q' + (ox + 100) + ' ' + (g - 170) + ' ' + (ox + L.W * .45) + ' ' + (g - 90) + ' T' + W + ' ' + (g - 110) + ' V' + (L.H + P) + ' H0Z" fill="#dcecf6"/>';
    var trees = [[.05, -60, .9], [.16, -78, .7], [.72, -70, .8], [.93, -84, .65], [1.08, -64, .9], [-.1, -70, .8]];
    trees.forEach(function (t) { s += fir(ox + L.W * t[0], g + t[1], t[2]); });
    s += '<path d="M0 ' + (g - 20) + ' Q' + (ox + L.W * .3) + ' ' + (g - 60) + ' ' + (ox + L.W * .6) + ' ' + (g - 18) + ' T' + W + ' ' + (g - 30) + ' V' + (L.H + P) + ' H0Z" fill="#fff"/>';
    s += '<ellipse cx="' + (ox + L.W * .5) + '" cy="' + (g + 40) + '" rx="' + (L.W * .7) + '" ry="20" fill="#e6f1f8" opacity=".7"/></g>';
    var sc = $('scene'); sc.setAttribute('viewBox', '0 0 ' + W + ' ' + H); sc.style.width = W + 'px'; sc.style.height = H + 'px';
    sc.style.left = -ox + 'px'; sc.style.top = -P + 'px'; sc.innerHTML = s;
  }
  function layout() {
    var iw = innerWidth, ih = innerHeight, bar = iw <= 520 ? 56 : 62;
    L = iw / ih < .85 ? LAYOUT.port : LAYOUT.land;
    stage.classList.toggle('port', L === LAYOUT.port);
    scale = Math.min(iw / L.W, (ih - bar) / L.H);
    stage.style.width = L.W + 'px'; stage.style.height = L.H + 'px';
    stage.style.transform = 'translate(' + ((iw - L.W * scale) / 2) + 'px,' + (bar + (ih - bar - L.H * scale) / 2) + 'px) scale(' + scale + ')';
    var h = $('hero'); h.style.left = L.hero[0] + 'px'; h.style.top = L.hero[1] + 'px'; h.style.height = L.hero[2] + 'px'; h.style.width = (L.hero[2] * 396 / 563) + 'px';
    var sy = $('say'); sy.style.left = L.say[0] + 'px'; sy.style.top = L.say[1] + 'px';
    var r = $('rack'), q = L.rack; r.style.left = q[0] + 'px'; r.style.top = q[1] + 'px'; r.style.width = q[2] + 'px'; r.style.height = q[3] + 'px';
    r.style.gridTemplateColumns = 'repeat(' + q[4] + ',1fr)'; r.style.gridTemplateRows = 'repeat(' + q[5] + ',1fr)';
    scene();
  }

  /* ---------------- Голос ---------------- */
  var VOICE = ['yes', 'oops', 'cold', 'lets-go'];
  Object.keys(ITEMS).forEach(function (k) { VOICE.push('put-' + k, k); });
  var clips = {}, missing = {};
  VOICE.forEach(function (k) {
    var a = new Audio(); a.preload = 'auto';
    a.addEventListener('error', function () { missing[k] = true; if (G && G.asked && k === 'put-' + G.asked) showPrompt(); });
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
  // случайный порядок, но свитер раньше куртки, носки раньше ботинок
  function makeOrder() {
    var o;
    do { o = shuffle(Object.keys(ITEMS)); } while (o.indexOf('sweater') > o.indexOf('coat') || o.indexOf('socks') > o.indexOf('boots'));
    return o;
  }
  function heroAnim(cls) {
    var h = $('hero'); h.classList.remove('yes', 'no', 'dance'); void h.offsetWidth; if (cls) h.classList.add(cls);
  }
  function setCold() {
    var h = $('hero'), left = 5 - G.done.length;
    h.classList.toggle('cold', left >= 1 && G.phase === 'play'); h.classList.remove('c1', 'c2');
    if (left <= 2) h.classList.add('c1'); else if (left <= 3) h.classList.add('c2');
  }
  function bubble(text, ms) {
    var s = $('say'); clearTimeout(sayT); s.textContent = text; s.classList.remove('hidden');
    s.style.animation = 'none'; void s.offsetWidth; s.style.animation = '';
    if (ms) sayT = setTimeout(function () { s.classList.add('hidden'); }, ms);
  }
  function phrase(k) { return 'I put on my ' + ITEMS[k].word; }
  function showPrompt() {
    var p = $('prompt'); p.classList.remove('hidden', 'ask'); void p.offsetWidth; p.classList.add('ask');
    $('p-word').textContent = phrase(G.asked);
    var ic = $('p-ic'); ic.src = 'img/' + ITEMS[G.asked].icon + '.png';
    ic.classList.toggle('hidden', !(missing['put-' + G.asked] || !A.sfx));   // пока нет озвучки — подсказка картинкой
  }
  function newGame() {
    stopVoice();
    G = { order: makeOrder(), step: 0, done: [], mistakes: 0, phase: 'play', busy: false };
    $('hero').innerHTML = heroHTML(false); heroAnim();
    var r = $('rack'); r.innerHTML = '';
    shuffle(Object.keys(ITEMS)).forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'item'; b.dataset.k = k;
      b.setAttribute('aria-label', ITEMS[k].word);
      b.innerHTML = '<img src="img/' + ITEMS[k].icon + '.png" alt="" draggable="false">';
      b.addEventListener('click', function () { pick(b); });
      r.appendChild(b);
    });
    var pr = $('progress'); pr.innerHTML = ''; for (var i = 0; i < 5; i++) pr.appendChild(document.createElement('i'));
    pr.classList.remove('hidden');
    setCold(); bubble("Brrr! It's cold!", 1800); speak('cold', function () { setTimeout(ask, 200); });
    if (!A.sfx || missing.cold) setTimeout(ask, 1500);
  }
  function ask() {
    if (!G || G.phase !== 'play' || G.asked === G.order[G.step]) return;
    G.asked = G.order[G.step]; G.busy = false;
    showPrompt(); bubble(phrase(G.asked) + '!', 0); speak('put-' + G.asked);
  }
  function repeat() { if (G && G.phase === 'play' && G.asked) { A.fx.tap(); speak('put-' + G.asked); } }
  function pick(b) {
    if (!G || G.phase !== 'play' || G.busy || !G.asked) return;
    A.unlock(); A.fx.tap();
    var k = b.dataset.k;
    if (k === G.asked) {
      G.busy = true; b.classList.add('used'); $('prompt').classList.remove('ask');
      var layers = [].slice.call(document.querySelectorAll('#hero .layer[data-k="' + k + '"]'));
      flyTo(b, layers[0], function () {
        layers.forEach(function (l, i) { setTimeout(function () { l.classList.add('on'); }, i * 120); });
        A.fx.hang(); A.fx.ok(); sparks(layers[0], 14);
        G.done.push(k); G.step++; setCold(); heroAnim('yes');
        bubble('Yes! My ' + ITEMS[k].word + '!', 1600); speak('yes');
        var pd = $('progress').children[G.step - 1]; pd.classList.add('on'); pd.style.backgroundImage = 'url(img/' + ITEMS[k].icon + '.png)';
        if (G.step === 5) setTimeout(finale, 1500); else setTimeout(ask, 1700);
      });
    } else {
      G.mistakes++; b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake');
      A.fx.oops(); heroAnim('no');
      bubble('Oops! ' + (ITEMS[k].plural ? "They're" : "It's") + ' my ' + ITEMS[k].word + '.', 1800);
      speak(['oops', k], function () { setTimeout(function () { if (G.phase === 'play') { bubble(phrase(G.asked) + '!', 0); speak('put-' + G.asked); } }, 300); });
      if (!A.sfx) setTimeout(function () { if (G.phase === 'play') bubble(phrase(G.asked) + '!', 0); }, 1900);
    }
  }
  function flyTo(src, dst, done) {
    var r = src.querySelector('img').getBoundingClientRect(), t = dst.getBoundingClientRect();
    // у слоя пока scale(.6) — берём итоговый размер
    var tw = t.width / .6, th = t.height / .6, tl = t.left - (tw - t.width) / 2, tt = t.top - (th - t.height) / 2 + th * .2;
    var f = document.createElement('div'); f.className = 'fly';
    f.style.left = r.left + 'px'; f.style.top = r.top + 'px'; f.style.width = r.width + 'px'; f.style.height = r.height + 'px'; f.style.transformOrigin = '0 0';
    var im = src.querySelector('img').cloneNode(); im.style.width = '100%'; im.style.height = '100%'; f.appendChild(im); $('fx').appendChild(f);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      f.style.transform = 'translate(' + (tl - r.left) + 'px,' + (tt - r.top) + 'px) scale(' + (tw / r.width) + ',' + (th / r.height) + ')';
      f.style.opacity = '.9';
    }); });
    setTimeout(function () { f.remove(); done(); }, 700);
  }
  function sparks(el, n) {
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < (n || 12); i++) {
      var s = document.createElement('i'); s.className = 'spark'; var an = Math.random() * Math.PI * 2, d = 30 + Math.random() * 60;
      s.style.left = cx + 'px'; s.style.top = cy + 'px'; s.style.setProperty('--x', Math.cos(an) * d + 'px'); s.style.setProperty('--y', Math.sin(an) * d + 'px');
      $('fx').appendChild(s); setTimeout(s.remove.bind(s), 750);
    }
  }
  function finale() {
    G.phase = 'done'; $('prompt').classList.add('hidden'); setCold();
    heroAnim('dance'); bubble("I'm warm! Let's go!"); speak('lets-go'); A.fx.lights(); sparks($('hero'), 30);
    setTimeout(win, 3300);
  }
  var STAR = '<svg viewBox="0 0 24 24"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.7 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z" fill="FILL" stroke="STROKE" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  function win() {
    var n = G.mistakes <= 1 ? 3 : G.mistakes <= 3 ? 2 : 1, h = '';
    for (var i = 0; i < 3; i++) {
      var on = i < n;
      h += STAR.replace('FILL', on ? '#ffd54a' : '#eee6d6').replace('STROKE', on ? '#e0a800' : '#d6ccb6').replace('<svg', on ? '<svg class="on" style="animation-delay:' + (i * .25 + .4) + 's"' : '<svg');
    }
    $('stars').innerHTML = h;
    $('win-hero').innerHTML = '<div class="hero">' + heroHTML(true) + '</div>';
    $('res').textContent = G.mistakes === 0 ? 'Без единой ошибки! Ты знаешь всю зимнюю одежду!' : 'Ошибок: ' + G.mistakes + '. Молодец!';
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

  /* ---------------- Снег, кнопки, старт ---------------- */
  var sn = $('snow');
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) for (var i = 0; i < 45; i++) {
    var f = document.createElement('i'); f.className = 'flake'; var z = 3 + Math.random() * 6;
    f.style.width = f.style.height = z + 'px'; f.style.left = Math.random() * 100 + '%';
    f.style.animationDuration = (7 + Math.random() * 9) + 's'; f.style.animationDelay = (-Math.random() * 16) + 's';
    f.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px'); sn.appendChild(f);
  }
  function syncBtns() { $('btn-music').classList.toggle('off', !A.music); $('btn-sound').classList.toggle('off', !A.sfx); }
  $('btn-music').addEventListener('click', function () { A.unlock(); A.setMusic(!A.music); if (A.music) A.start(); syncBtns(); });
  $('btn-sound').addEventListener('click', function () { A.unlock(); A.setSfx(!A.sfx); if (!A.sfx) stopVoice(); if (G && G.phase === 'play' && G.asked) showPrompt(); syncBtns(); });
  $('prompt').addEventListener('click', repeat);
  $('btn-go').addEventListener('click', function () { A.start(); show('play'); newGame(); });
  $('btn-again').addEventListener('click', function () { A.start(); show('play'); newGame(); });
  $('btn-advent').href = PROMO_URL;
  try { if (window.self !== window.top) document.body.classList.add('embedded'); } catch (e) { document.body.classList.add('embedded'); }
  $('hero').innerHTML = heroHTML(false);
  layout(); syncBtns();
  addEventListener('resize', layout);
  window.__dress = { state: function () { return G; } };
})();
