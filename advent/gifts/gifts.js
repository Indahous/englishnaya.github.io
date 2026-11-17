(function () {
  'use strict';
  var PROMO_URL = '/advent/';            // рекламная страница Адвента (заменим, когда будет готова)
  var TOYS = ['doll', 'bear', 'ball', 'car'];
  var NAME = { doll: 'a doll', bear: 'a teddy bear', ball: 'a ball', car: 'a car' };
  var $ = function (id) { return document.getElementById(id); };
  var A = window.XmasAudio;

  /* ---------------- Раскладка ---------------- */
  var LAYOUT = {
    land: { W: 1000, H: 620, win: [92, 92], tree: [400, 34, 300], gifts: [[345, 592], [495, 592], [645, 592], [795, 592]], gw: 130, longi: [36, 252, 330], say: [70, 206], room: 470, R: 112, glow: [550, 220, 230, 260] },
    port: { W: 600, H: 960, win: [-400, 0], tree: [28, 46, 290], gifts: [[160, 690], [440, 690], [160, 935], [440, 935]], gw: 172, longi: [356, 104, 300], say: [236, 40], room: 430, R: 125, glow: [173, 210, 190, 230] }
  };
  var L = null, scale = 1, stage = $('stage'), PAD = 1500;
  function layout() {
    var iw = innerWidth, ih = innerHeight, bar = iw <= 520 ? 56 : 62;
    L = iw / ih < .85 ? LAYOUT.port : LAYOUT.land;
    scale = Math.min(iw / L.W, (ih - bar) / L.H);
    stage.classList.toggle('port', L === LAYOUT.port);
    stage.style.width = L.W + 'px'; stage.style.height = L.H + 'px';
    stage.style.transform = 'translate(' + ((iw - L.W * scale) / 2) + 'px,' + (bar + (ih - bar - L.H * scale) / 2) + 'px) scale(' + scale + ')';
    var t = L.tree, th = t[2] * 700 / 600;
    [$('tree'), $('slots')].forEach(function (el) { el.style.left = t[0] + 'px'; el.style.top = t[1] + 'px'; el.style.width = t[2] + 'px'; el.style.height = th + 'px'; });
    var w = document.querySelector('.window'); w.style.left = L.win[0] + 'px'; w.style.top = L.win[1] + 'px';
    var lg = $('longi'); lg.style.left = L.longi[0] + 'px'; lg.style.top = L.longi[1] + 'px'; lg.style.height = L.longi[2] + 'px';
    var sy = $('say'); sy.style.left = L.say[0] + 'px'; sy.style.top = L.say[1] + 'px';
    document.querySelector('.room').style.height = (L.H - L.room + PAD) + 'px';
    var d = $('dark').style; d.setProperty('--r', L.R + 'px');
    d.setProperty('--tx', (L.glow[0] + PAD) + 'px'); d.setProperty('--ty', (L.glow[1] + PAD) + 'px'); d.setProperty('--tw', L.glow[2] + 'px'); d.setProperty('--th', L.glow[3] + 'px');
    placeGifts();
    if (G) moveLight(G.lx, G.ly, true); else moveLight(L.W / 2, L.H * .55, true);
  }
  function placeGifts() {
    document.querySelectorAll('.gift').forEach(function (g, i) {
      var p = L.gifts[i]; g.style.left = p[0] + 'px'; g.style.top = p[1] + 'px'; g.style.width = L.gw + 'px';
    });
  }

  /* ---------------- Голос ---------------- */
  var VOICE = ['yes', 'no', 'thank-you'];
  TOYS.forEach(function (t) { VOICE.push('find-' + t, 'its-' + t); });
  var clips = {}, missing = {};
  VOICE.forEach(function (k) {
    var a = new Audio(); a.preload = 'auto';
    a.addEventListener('error', function () { missing[k] = true; if (G && G.asked && k === 'find-' + G.asked) showPrompt(); });
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

  /* ---------------- Фонарик ---------------- */
  var dark = $('dark'), torch = $('torch'), seenT = null, unseeT = null;
  function moveLight(x, y, quiet) {
    x = Math.max(0, Math.min(L.W, x)); y = Math.max(0, Math.min(L.H, y));
    dark.style.setProperty('--x', (x + PAD) + 'px'); dark.style.setProperty('--y', (y + PAD) + 'px');
    torch.style.left = x + 'px'; torch.style.top = (y + L.R * .72) + 'px';
    var tilt = (x - L.W / 2) / L.W * 30; torch.style.transform = 'rotate(' + tilt + 'deg)';
    if (G) { G.lx = x; G.ly = y; }
    if (!quiet) checkGifts();
  }
  function giftCenter(i) { var p = L.gifts[i], h = L.gw * 437 / 360; return [p[0], p[1] - h * .5]; }
  function checkGifts() {
    if (!G || G.phase !== 'play') return;
    var best = -1, bd = 1e9;
    for (var i = 0; i < 4; i++) {
      var c = giftCenter(i), d = Math.hypot(c[0] - G.lx, c[1] - G.ly);
      if (d < bd) { bd = d; best = i; }
    }
    if (bd < L.R * .62) {
      clearTimeout(unseeT);
      if (G.seen !== best && G.pending !== best) {
        G.pending = best; clearTimeout(seenT);
        seenT = setTimeout(function () { reveal(best); }, 220);
      }
    } else {
      clearTimeout(seenT); G.pending = -1;
      if (G.seen >= 0 && bd > L.R * .8) { clearTimeout(unseeT); unseeT = setTimeout(hideSeen, 250); }
    }
  }
  function reveal(i) {
    if (!G || G.phase !== 'play') return;
    hideSeen(); G.pending = -1; G.seen = i;
    var g = gifts[i]; g.classList.add('seen'); A.fx.tap();
    speak('its-' + G.map[i]);
  }
  function hideSeen() { if (G && G.seen >= 0) { gifts[G.seen].classList.remove('seen'); G.seen = -1; } }

  // своя обработка касаний: перетаскивание двигает фонарик, короткое нажатие — выбор
  var vp = $('viewport'), down = null;
  function toStage(e) { var r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale]; }
  vp.addEventListener('pointerdown', function (e) {
    if (!G || G.phase !== 'play') return;
    A.unlock();
    var p = toStage(e), gi = giftAt(p);
    down = { x: e.clientX, y: e.clientY, t: Date.now(), gift: gi, wasSeen: gi >= 0 && G.seen === gi, id: e.pointerId };
    if (e.pointerType !== 'mouse' || gi < 0) moveLight(p[0], p[1] - (e.pointerType === 'touch' ? 0 : 0));
    try { vp.setPointerCapture(e.pointerId); } catch (er) {}
  });
  vp.addEventListener('pointermove', function (e) {
    if (!G || G.phase !== 'play') return;
    if (e.pointerType === 'mouse' || down) { var p = toStage(e); moveLight(p[0], p[1]); }
  });
  vp.addEventListener('pointerup', function (e) {
    if (!down) return;
    var d = down; down = null;
    if (!G || G.phase !== 'play') return;
    var moved = Math.hypot(e.clientX - d.x, e.clientY - d.y), quick = Date.now() - d.t < 600;
    if (d.gift < 0 || moved > 14 || !quick) return;
    var gi = d.gift;
    if (G.seen === gi || d.wasSeen) choose(gi);
    else { var c = giftCenter(gi); moveLight(c[0], c[1], true); clearTimeout(seenT); reveal(gi); }
  });
  vp.addEventListener('pointercancel', function () { down = null; });
  function giftAt(p) {
    for (var i = 0; i < 4; i++) {
      var q = L.gifts[i], w = L.gw, h = w * 437 / 360;
      if (p[0] > q[0] - w / 2 && p[0] < q[0] + w / 2 && p[1] > q[1] - h - 10 && p[1] < q[1]) return i;
    }
    return -1;
  }

  /* ---------------- Игра ---------------- */
  var G = null, gifts = [], sayT = null;
  var HUE = [0, 75, 160, 250];
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function longi(cls) { var l = $('longi'); l.classList.remove('yes', 'no', 'dance'); void l.offsetWidth; if (cls) l.classList.add(cls); }
  function bubble(text, ms) {
    var s = $('say'); clearTimeout(sayT); s.textContent = text; s.classList.remove('hidden');
    s.style.animation = 'none'; void s.offsetWidth; s.style.animation = '';
    if (ms) sayT = setTimeout(function () { s.classList.add('hidden'); }, ms);
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function buildGifts() {
    var box = $('gifts'); box.innerHTML = ''; gifts = [];
    for (var i = 0; i < 4; i++) {
      var g = document.createElement('div'); g.className = 'gift'; g.setAttribute('role', 'button'); g.setAttribute('aria-label', 'Подарок ' + (i + 1));
      g.innerHTML = '<img class="toy" alt="" draggable="false"><img class="box" src="img/gift.png" alt="" draggable="false" style="filter:hue-rotate(' + HUE[i] + 'deg) drop-shadow(0 8px 6px rgba(0,0,0,.3))"><span class="cap"></span>';
      box.appendChild(g); gifts.push(g);
    }
    placeGifts();
  }
  function setRound() {
    G.map = shuffle(TOYS.slice());
    gifts.forEach(function (g, i) {
      g.className = 'gift'; g.querySelector('.toy').src = 'img/' + G.map[i] + '.png';
      g.querySelector('.cap').textContent = "It's " + NAME[G.map[i]];
    });
    G.seen = -1; G.pending = -1; G.asked = G.order[G.round]; G.phase = 'play'; G.busy = false;
    dark.classList.remove('off'); stage.classList.add('night'); torch.classList.remove('hide');
    showPrompt(); speak('find-' + G.asked);
  }
  function showPrompt() {
    var p = $('prompt'); p.classList.remove('hidden', 'ask'); void p.offsetWidth; p.classList.add('ask');
    $('p-word').textContent = 'Find ' + NAME[G.asked];
    var ic = $('p-toy'); ic.src = 'img/' + G.asked + '.png';
    // пока нет озвучки — показываем картинку игрушки, чтобы малыш мог играть
    ic.classList.toggle('hidden', !(missing['find-' + G.asked] || !A.sfx));
  }
  function repeat() { if (G && G.phase === 'play') { A.fx.tap(); speak('find-' + G.asked); } }

  function newGame() {
    stopVoice();
    G = { order: shuffle(TOYS.slice()), round: 0, mistakes: 0, lx: L.W / 2, ly: L.H * .55, found: [] };
    buildGifts();
    var pr = $('progress'); pr.innerHTML = ''; for (var i = 0; i < 4; i++) pr.appendChild(document.createElement('i'));
    pr.classList.remove('hidden'); $('say').classList.add('hidden'); longi();
    moveLight(L.W / 2, L.H * .55, true);
    setRound();
    bubble("Let's find the toys!", 2200);
  }
  function choose(i) {
    if (G.busy) return;
    var toy = G.map[i], g = gifts[i];
    if (toy === G.asked) {
      G.busy = true; G.phase = 'found'; hideSeen();
      g.classList.add('open', 'done'); dark.classList.add('off'); stage.classList.remove('night'); torch.classList.add('hide');
      $('prompt').classList.remove('ask');
      A.fx.ok(); A.fx.star(); sparks(g, 18); longi('yes'); bubble("Yes! It's " + NAME[toy] + '!', 2200);
      speak(['yes', 'its-' + toy]);
      var dot = $('progress').children[G.round]; dot.classList.add('on'); dot.style.backgroundImage = 'url(img/' + toy + '.png)';
      G.found.push(toy); G.round++;
      setTimeout(G.round < 4 ? setRound : finale, 2800);
    } else {
      G.mistakes++; g.classList.remove('shake'); void g.offsetWidth; g.classList.add('shake');
      A.fx.oops(); longi('no'); bubble("No, it's " + NAME[toy] + '.', 1700);
      speak(['no', 'its-' + toy], function () { if (G.phase === 'play') setTimeout(function () { speak('find-' + G.asked); }, 300); });
    }
  }
  function finale() {
    G.phase = 'done'; $('prompt').classList.add('hidden');
    dark.classList.add('off'); stage.classList.remove('night'); torch.classList.add('hide');
    G.map = G.found.slice();
    gifts.forEach(function (g, i) { g.className = 'gift done'; g.querySelector('.toy').src = 'img/' + G.found[i] + '.png'; g.querySelector('.cap').textContent = cap(NAME[G.found[i]].replace(/^an? /, '')); });
    gifts.forEach(function (g, i) { setTimeout(function () { g.classList.add('open'); sparks(g, 10); A.fx.hang(); }, 200 + i * 250); });
    setTimeout(function () { longi('dance'); bubble('Thank you! I love my toys!'); speak('thank-you'); A.fx.lights(); }, 1300);
    setTimeout(win, 4300);
  }
  function sparks(el, n) {
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < (n || 12); i++) {
      var s = document.createElement('i'); s.className = 'spark'; var an = Math.random() * Math.PI * 2, d = 30 + Math.random() * 60;
      s.style.left = cx + 'px'; s.style.top = cy + 'px'; s.style.setProperty('--x', Math.cos(an) * d + 'px'); s.style.setProperty('--y', Math.sin(an) * d + 'px');
      $('fx').appendChild(s); setTimeout(s.remove.bind(s), 750);
    }
  }
  var STAR = '<svg viewBox="0 0 24 24"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.7 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z" fill="FILL" stroke="STROKE" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  function win() {
    var n = G.mistakes <= 1 ? 3 : G.mistakes <= 3 ? 2 : 1, h = '';
    for (var i = 0; i < 3; i++) {
      var on = i < n;
      h += STAR.replace('FILL', on ? '#ffd54a' : '#eee6d6').replace('STROKE', on ? '#e0a800' : '#d6ccb6').replace('<svg', on ? '<svg class="on" style="animation-delay:' + (i * .25 + .5) + 's"' : '<svg');
    }
    $('stars').innerHTML = h;
    $('found').innerHTML = G.found.map(function (t, i) { return '<img src="img/' + t + '.png" alt="' + NAME[t] + '" style="animation-delay:' + i * .12 + 's">'; }).join('');
    $('res').textContent = G.mistakes === 0 ? 'Без единой ошибки! Ты нашёл все игрушки!' : 'Ошибок: ' + G.mistakes + '. Молодец!';
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
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) for (var i = 0; i < 30; i++) {
    var f = document.createElement('i'); f.className = 'flake'; var z = 2 + Math.random() * 5;
    f.style.width = f.style.height = z + 'px'; f.style.left = Math.random() * 100 + '%'; f.style.opacity = .5;
    f.style.animationDuration = (9 + Math.random() * 10) + 's'; f.style.animationDelay = (-Math.random() * 18) + 's';
    f.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px'); sn.appendChild(f);
  }
  function syncBtns() { $('btn-music').classList.toggle('off', !A.music); $('btn-sound').classList.toggle('off', !A.sfx); }
  $('btn-music').addEventListener('click', function () { A.unlock(); A.setMusic(!A.music); if (A.music) A.start(); syncBtns(); });
  $('btn-sound').addEventListener('click', function () { A.unlock(); A.setSfx(!A.sfx); if (!A.sfx) stopVoice(); if (G && G.phase === 'play') showPrompt(); syncBtns(); });
  $('prompt').addEventListener('click', repeat);
  $('btn-go').addEventListener('click', function () { A.start(); show('play'); newGame(); });
  $('btn-again').addEventListener('click', function () { A.start(); show('play'); newGame(); });
  $('btn-advent').href = PROMO_URL;
  try { if (window.self !== window.top) document.body.classList.add('embedded'); } catch (e) { document.body.classList.add('embedded'); }
  XTree.build($('tree'), $('slots'), '../tree/img/');
  layout(); buildGifts(); syncBtns();
  addEventListener('resize', layout);
  window.__gifts = { missing: missing, clips: clips, state: function () { return G; }, center: giftCenter, scale: function () { return scale; } };
})();
