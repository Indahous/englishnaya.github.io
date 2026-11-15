(function () {
  'use strict';
  var WORDS = ['we', 'go', 'do', 'to', 'I', 'my', 'he', 'you', 'one', 'two'];
  var PTS = [4, 3, 2, 1, -1, -2, -3];
  var $ = function (id) { return document.getElementById(id); };
  var NS = 'http://www.w3.org/2000/svg';
  var CX = 400, CY = 540, GR = 320;       // стеклянный шар автомата

  /* ---------------- Звуки (WebAudio, без файлов) ---------------- */
  var ctx = null, soundOn = true;
  try { soundOn = localStorage.getItem('bg-sound') !== '0'; } catch (e) {}
  function ac() {
    if (!ctx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ctx = new AC(); }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, t, d, vol, type, f2) {
    var c = ac(); if (!c || !soundOn) return;
    var o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + t;
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + d);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .01); g.gain.exponentialRampToValueAtTime(.001, t0 + d);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + d + .05);
  }
  var SFX = {
    pick: function () { tone(500, 0, .18, .25, 'sine', 160); tone(900, .02, .08, .12, 'triangle'); },
    drop: function () { for (var i = 0; i < 5; i++) tone(220 - i * 18, i * .09, .12, .18, 'triangle', 120); },
    clunk: function () { tone(140, 0, .18, .35, 'square', 60); tone(90, .05, .2, .25, 'sine', 50); },
    plus: function (n) { var base = 523.25; for (var i = 0; i < Math.min(4, n); i++) tone(base * Math.pow(1.26, i), i * .09, .4, .25, 'triangle'); tone(1568, Math.min(4, n) * .09, .5, .15, 'sine'); },
    minus: function (n) { tone(330, 0, .25, .3, 'sawtooth', 200); tone(220, .2, .4, .3, 'sawtooth', 110); },
    tap: function () { tone(880, 0, .08, .15, 'triangle'); },
    win: function () { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f, i) { tone(f, i * .13, .8, .25, 'triangle'); }); }
  };

  /* ---------------- Автомат (SVG) ---------------- */
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e); return e;
  }
  var gGums, gHandle;
  function buildMachine() {
    var m = $('machine');
    m.innerHTML =
      '<defs>' +
      '<radialGradient id="glass" cx="38%" cy="30%" r="80%"><stop offset="0" stop-color="#eef8fd"/><stop offset=".7" stop-color="#cfe7f6"/><stop offset="1" stop-color="#a9d0ea"/></radialGradient>' +
      '<linearGradient id="red" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#cf312f"/><stop offset=".35" stop-color="#ee5650"/><stop offset="1" stop-color="#c32b2b"/></linearGradient>' +
      '<linearGradient id="redTop" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f26a62"/><stop offset="1" stop-color="#da3c38"/></linearGradient>' +
      '<radialGradient id="ball" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#d9e1e7"/></radialGradient>' +
      '<linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9edf0"/><stop offset="1" stop-color="#9aa5ad"/></linearGradient>' +
      '<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset="1" stop-color="#eeb92d"/></linearGradient>' +
      '<clipPath id="globeClip"><circle cx="' + CX + '" cy="' + CY + '" r="' + (GR - 6) + '"/></clipPath>' +
      '</defs>' +
      '<ellipse cx="400" cy="1062" rx="330" ry="26" fill="rgba(60,30,40,.18)"/>';
    // стеклянный шар
    el('circle', { cx: CX, cy: CY, r: GR, fill: 'url(#glass)', stroke: '#86b6d9', 'stroke-width': 5 }, m);
    // блики на стекле (позади жвачек)
    el('path', { d: 'M150 470 Q175 330 300 270', fill: 'none', stroke: '#fff', 'stroke-width': 16, 'stroke-linecap': 'round', opacity: .75 }, m);
    el('path', { d: 'M640 640 Q620 740 560 790', fill: 'none', stroke: '#fff', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: .5 }, m);
    var g = el('g', { 'clip-path': 'url(#globeClip)' }, m); gGums = el('g', { id: 'gums' }, g);
    // крышка
    m.insertAdjacentHTML('beforeend',
      '<g id="cap">' +
      '<path d="M165 238 Q175 150 400 142 Q625 150 635 238 Z" fill="url(#redTop)" stroke="#a52623" stroke-width="5" stroke-linejoin="round"/>' +
      '<path d="M215 215 Q260 170 360 160" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".45"/>' +
      '<rect x="360" y="118" width="80" height="34" rx="8" fill="#d63a36" stroke="#a52623" stroke-width="5"/>' +
      '<circle cx="400" cy="102" r="46" fill="url(#redTop)" stroke="#a52623" stroke-width="5"/>' +
      '<ellipse cx="384" cy="86" rx="16" ry="9" fill="#fff" opacity=".6" transform="rotate(-25 384 86)"/>' +
      '<ellipse cx="400" cy="246" rx="262" ry="40" fill="url(#redTop)" stroke="#a52623" stroke-width="5"/>' +
      '<path d="M170 246 Q400 296 630 246" fill="none" stroke="#a52623" stroke-width="4" opacity=".35"/>' +
      '</g>' +
      // основание
      '<g id="base">' +
      '<path d="M170 850 H630 L690 1000 Q700 1050 640 1052 H160 Q100 1050 110 1000 Z" fill="url(#red)" stroke="#a52623" stroke-width="5" stroke-linejoin="round"/>' +
      '<ellipse cx="400" cy="852" rx="238" ry="34" fill="url(#redTop)" stroke="#a52623" stroke-width="5"/>' +
      '<path d="M135 1000 Q150 1022 200 1022 H600 Q650 1022 665 1000" fill="none" stroke="#a52623" stroke-width="4" opacity=".5"/>' +
      '<rect x="196" y="890" width="112" height="116" rx="14" fill="#d93a36" stroke="#a52623" stroke-width="4"/>' +
      '<rect x="492" y="890" width="112" height="116" rx="14" fill="#d93a36" stroke="#a52623" stroke-width="4"/>' +
      '<circle cx="262" cy="910" r="9" fill="url(#steel)" stroke="#6d787f" stroke-width="2"/><circle cx="538" cy="910" r="9" fill="url(#steel)" stroke="#6d787f" stroke-width="2"/>' +
      '<circle cx="400" cy="912" r="68" fill="url(#steel)" stroke="#69747b" stroke-width="5"/>' +
      '<circle cx="400" cy="912" r="52" fill="#c9d1d7" stroke="#7f8b92" stroke-width="3"/>' +
      '<path d="M352 880 Q380 856 430 858" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".6"/>' +
      '<g id="handle"><rect x="340" y="896" width="120" height="32" rx="16" fill="url(#gold)" stroke="#b78a14" stroke-width="4"/><circle cx="400" cy="912" r="25" fill="url(#gold)" stroke="#b78a14" stroke-width="4"/><ellipse cx="392" cy="903" rx="8" ry="4.5" fill="#fff" opacity=".7"/></g>' +
      '<path d="M322 1052 V1016 Q322 984 400 984 Q478 984 478 1016 V1052 Z" fill="#43110f" stroke="#a52623" stroke-width="6" stroke-linejoin="round"/>' +
      '<path d="M336 1048 V1018 Q336 996 400 996 Q464 996 464 1018 V1048 Z" fill="#6a1c18"/>' +
      '<rect id="chute" x="336" y="1000" width="128" height="48" fill="none"/>' +
      '</g>');
    gHandle = $('handle');
  }

  /* раскладка жвачек: как можно крупнее, "кучей" внутри шара (простая релаксация кругов) */
  function pack(N) {
    var R = GR - 20, PY = 553, TOP = 298, BOT = 814;
    for (var r = 70; r >= 28; r -= 2) {
      for (var attempt = 0; attempt < 6; attempt++) {
        var pts = [], lim = R - r, i, j;
        for (i = 0; i < N; i++) { var an = Math.random() * 6.283, d = Math.sqrt(Math.random()) * lim; pts.push({ x: CX + Math.cos(an) * d, y: PY + Math.sin(an) * d, r: r }); }
        var ok = false;
        for (var it = 0; it < 500; it++) {
          var maxOv = 0;
          for (i = 0; i < N; i++) for (j = i + 1; j < N; j++) {
            var dx = pts[j].x - pts[i].x, dy = pts[j].y - pts[i].y, dd = Math.hypot(dx, dy) || .01, need = 2 * r * 1.015;
            if (dd < need) { var push = (need - dd) / 2; maxOv = Math.max(maxOv, need - dd); dx /= dd; dy /= dd; pts[i].x -= dx * push; pts[i].y -= dy * push; pts[j].x += dx * push; pts[j].y += dy * push; }
          }
          for (i = 0; i < N; i++) { var ex = pts[i].x - CX, ey = pts[i].y - PY, ed = Math.hypot(ex, ey); if (ed > lim) { pts[i].x = CX + ex / ed * lim; pts[i].y = PY + ey / ed * lim; } pts[i].y = Math.max(TOP + r, Math.min(BOT - r, pts[i].y)); }
          if (maxOv < .6) { ok = true; break; }
        }
        if (ok) return pts;
      }
    }
    return [];
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function dealWords(N) {
    var arr = [], per = Math.ceil(N / WORDS.length);
    for (var i = 0; i < per; i++) arr = arr.concat(WORDS);
    // чтобы в автомате было ровно по столько же каждого слова, обрезаем лишнее случайно
    arr = shuffle(arr).slice(0, N);
    return arr;
  }

  /* ---------------- Состояние ---------------- */
  var S = null;
  var gumNodes = [];
  function fitText(word, r) {
    var k = word.length === 1 ? 1.15 : word.length === 2 ? .98 : .8;
    return Math.round(r * k);
  }
  function drawGums() {
    gGums.innerHTML = ''; gumNodes = [];
    S.balls.forEach(function (b, i) {
      var g = el('g', { class: 'gum', tabindex: 0, role: 'button', 'aria-label': 'Жвачка: ' + b.word, 'data-i': i }, gGums);
      var inner = el('g', { class: 'gb' }, g);
      el('circle', { cx: b.x, cy: b.y, r: b.r, fill: 'url(#ball)', stroke: '#c3ccd3', 'stroke-width': 3 }, inner);
      el('ellipse', { cx: b.x - b.r * .38, cy: b.y - b.r * .46, rx: b.r * .24, ry: b.r * .13, fill: '#fff', transform: 'rotate(-35 ' + (b.x - b.r * .38) + ' ' + (b.y - b.r * .46) + ')' }, inner);
      var t = el('text', { x: b.x, y: b.y + fitText(b.word, b.r) * .36, 'text-anchor': 'middle', 'font-size': fitText(b.word, b.r) }, inner);
      t.textContent = b.word;
      g.addEventListener('click', function () { take(i); });
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); take(i); } });
      gumNodes.push(g);
    });
  }

  function startGame(n1, n2, total) {
    var pos = pack(total), words = dealWords(total);
    S = { names: [n1, n2], scores: [0, 0], turn: 0, total: total, balls: pos.map(function (p, i) { p.word = words[i]; p.used = false; return p; }), hist: [], busy: false, left: total };
    buildMachine(); drawGums(); render();
    $('screen-setup').classList.add('hidden'); $('screen-end').classList.add('hidden'); $('screen-game').classList.remove('hidden'); $('tools').classList.remove('hidden');
    document.body.dataset.screen = 'game';
    $('btn-undo').disabled = true;
  }

  function render() {
    for (var i = 0; i < 2; i++) {
      $('nm' + i).textContent = S.names[i]; $('sc' + i).textContent = S.scores[i];
      $('sc' + i).classList.toggle('neg', S.scores[i] < 0);
      $('card' + i).classList.toggle('active', S.turn === i);
    }
    $('left').textContent = S.left;
    $('btn-undo').disabled = !S.hist.length || S.busy;
  }

  /* ---------------- Анимации ---------------- */
  function tween(ms, fn, done, ease) {
    var t0 = performance.now();
    (function f(now) {
      var k = Math.min(1, (now - t0) / ms); fn(ease ? ease(k) : k);
      if (k < 1) requestAnimationFrame(f); else if (done) done();
    })(t0);
  }
  var easeIn = function (k) { return k * k; };
  var easeInOut = function (k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; };

  function take(i) {
    if (!S || S.busy) return;
    var b = S.balls[i]; if (b.used) return;
    ac(); S.busy = true; render();
    var pts = PTS[Math.floor(Math.random() * PTS.length)];
    var who = S.turn;
    b.used = true; S.left--; S.hist.push({ i: i, who: who, pts: pts });
    SFX.pick();
    var g = gumNodes[i], inner = g.querySelector('.gb'); g.style.pointerEvents = 'none'; inner.style.transition = 'none';
    // вперёд-вниз: шарик скатывается к выходу и скрывается за основанием
    var ty = 900 - b.y, tx = CX - b.x;
    g.parentNode.appendChild(g);
    tween(650, function (k) {
      var a = k;
      g.setAttribute('transform', 'translate(' + (tx * a) + ' ' + (ty * a) + ')');
    }, null, easeIn);
    tween(700, function (k) { gHandle.setAttribute('transform', 'rotate(' + (k * 180) + ' 400 912)'); }, function () { gHandle.setAttribute('transform', 'rotate(0 400 912)'); }, easeInOut);
    setTimeout(SFX.drop, 250);
    setTimeout(function () { g.style.display = 'none'; SFX.clunk(); showPrize(b.word, pts, who); }, 760);
  }

  var prizeTimer = null, prizeClose = null;
  function showPrize(word, pts, who) {
    var pz = $('prize'), inn = $('prize-in');
    $('pz-word').textContent = word;
    var badge = $('pz-badge'); badge.textContent = (pts > 0 ? '+' : '−') + Math.abs(pts); badge.className = 'badge ' + (pts > 0 ? 'pos' : 'neg');
    $('pz-cheer').textContent = pts >= 3 ? 'Super!' : pts > 0 ? 'Good!' : pts === -1 ? 'Oh!' : 'Oops!';
    $('pz-who').textContent = S.names[who] + ': ' + (pts > 0 ? '+' : '−') + Math.abs(pts);
    pz.classList.remove('hidden');
    // вылет из лотка
    var ch = $('chute').getBoundingClientRect(), r = inn.getBoundingClientRect();
    var dx = (ch.left + ch.width / 2) - (r.left + r.width / 2), dy = (ch.top + ch.height / 2) - (r.top + r.height / 2);
    if (inn.animate) inn.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.12)', opacity: .2 }, { transform: 'none', opacity: 1 }], { duration: 650, easing: 'cubic-bezier(.2,1.3,.4,1)' });
    // очки
    S.scores[who] += pts;
    var sc = $('sc' + who);
    setTimeout(function () {
      render(); sc.classList.remove('bump'); void sc.offsetWidth; sc.classList.add('bump');
      var f = document.createElement('span'); f.className = 'float ' + (pts > 0 ? 'pos' : 'neg'); f.textContent = (pts > 0 ? '+' : '−') + Math.abs(pts);
      $('card' + who).appendChild(f); setTimeout(function () { f.remove(); }, 1500);
      if (pts > 0) SFX.plus(pts); else SFX.minus(-pts);
    }, 500);
    prizeClose = function () {
      clearTimeout(prizeTimer); prizeClose = null; pz.classList.add('hidden');
      S.turn = 1 - who; S.busy = false; render();
      if (S.left === 0) setTimeout(finish, 500);
    };
    prizeTimer = setTimeout(function () { if (prizeClose) prizeClose(); }, 3600);
  }
  $('prize').addEventListener('click', function () { if (prizeClose) prizeClose(); });
  document.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') && prizeClose) { e.preventDefault(); prizeClose(); } });

  /* ---------------- Отмена, ход вручную, финал ---------------- */
  function undo() {
    if (!S || S.busy || !S.hist.length) return;
    $('screen-end').classList.add('hidden'); document.body.dataset.screen = 'game';
    var h = S.hist.pop(), b = S.balls[h.i]; b.used = false; S.left++;
    S.scores[h.who] -= h.pts; S.turn = h.who;
    var g = gumNodes[h.i]; g.removeAttribute('transform'); g.style.display = ''; g.style.pointerEvents = ''; g.style.opacity = 0;
    g.parentNode.insertBefore(g, g.parentNode.firstChild);
    tween(300, function (k) { g.style.opacity = k; }, function () { g.style.opacity = ''; });
    SFX.tap(); render();
  }
  $('btn-undo').addEventListener('click', undo);
  [0, 1].forEach(function (i) {
    $('card' + i).addEventListener('click', function () { if (S && !S.busy && S.turn !== i) { S.turn = i; SFX.tap(); render(); } });
  });

  function finish() {
    var a = S.scores[0], b = S.scores[1];
    $('fn0').textContent = S.names[0]; $('fn1').textContent = S.names[1]; $('fs0').textContent = a; $('fs1').textContent = b;
    var cards = document.querySelectorAll('.fc'); cards[0].classList.toggle('lead', a >= b); cards[1].classList.toggle('lead', b >= a);
    if (a === b) { $('end-title').textContent = 'Ничья!'; $('end-winner').textContent = 'Вы оба молодцы!'; }
    else { $('end-title').textContent = 'Ура!'; $('end-winner').textContent = 'Победитель: ' + S.names[a > b ? 0 : 1]; }
    $('screen-end').classList.remove('hidden'); document.body.dataset.screen = 'end';
    SFX.win(); confetti();
  }
  function confetti() {
    var cv = $('confetti'), c = cv.getContext('2d'); cv.width = innerWidth; cv.height = innerHeight;
    var cols = ['#e4423d', '#3a7872', '#f4e39e', '#f2a4cf', '#4fc3f7', '#fff'], ps = [];
    for (var i = 0; i < 160; i++) ps.push({ x: Math.random() * cv.width, y: -Math.random() * cv.height, vx: Math.random() * 2 - 1, vy: 2 + Math.random() * 3.5, s: 7 + Math.random() * 8, c: cols[i % cols.length], a: Math.random() * 6 });
    var t0 = performance.now();
    (function loop(t) {
      c.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.a += .1; c.fillStyle = p.c; c.save(); c.translate(p.x, p.y); c.rotate(p.a); c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); c.restore(); });
      if (t - t0 < 5000 && document.body.dataset.screen === 'end') requestAnimationFrame(loop); else c.clearRect(0, 0, cv.width, cv.height);
    })(t0);
  }

  /* ---------------- Настройка и кнопки ---------------- */
  var total = 20;
  try { var sv = JSON.parse(localStorage.getItem('bg-names') || 'null'); if (sv) { $('name1').value = sv[0] || $('name1').value; $('name2').value = sv[1] || $('name2').value; if (sv[2] === 30) setCount(30); } } catch (e) {}
  function setCount(n) {
    total = n;
    [].forEach.call(document.querySelectorAll('.seg button'), function (b) { var on = +b.dataset.n === n; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  }
  [].forEach.call(document.querySelectorAll('.seg button'), function (b) { b.addEventListener('click', function () { setCount(+b.dataset.n); }); });
  function names() {
    var a = $('name1').value.trim() || 'Игрок 1', b = $('name2').value.trim() || 'Игрок 2';
    try { localStorage.setItem('bg-names', JSON.stringify([a, b, total])); } catch (e) {}
    return [a, b];
  }
  $('setup').addEventListener('submit', function (e) { e.preventDefault(); ac(); var n = names(); startGame(n[0], n[1], total); });
  $('btn-again').addEventListener('click', function () { startGame(S.names[0], S.names[1], S.total); });
  $('btn-names').addEventListener('click', backToSetup);
  function backToSetup() {
    $('screen-end').classList.add('hidden'); $('screen-game').classList.add('hidden'); $('tools').classList.add('hidden');
    $('screen-setup').classList.remove('hidden'); document.body.dataset.screen = 'setup';
  }
  $('btn-restart').addEventListener('click', function () {
    if (!S || S.busy) return;
    if (S.hist.length && !confirm('Начать заново? Счёт обнулится.')) return;
    startGame(S.names[0], S.names[1], S.total);
  });
  function syncSound() { $('btn-sound').setAttribute('aria-pressed', soundOn); }
  $('btn-sound').addEventListener('click', function () { soundOn = !soundOn; try { localStorage.setItem('bg-sound', soundOn ? '1' : '0'); } catch (e) {} syncSound(); if (soundOn) { ac(); SFX.tap(); } });
  syncSound();
  var root = document.documentElement;
  if (!(root.requestFullscreen || root.webkitRequestFullscreen)) $('btn-full').classList.add('hidden');
  $('btn-full').addEventListener('click', function () {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
    } catch (e) {}
  });
  window.__bg = { state: function () { return S; }, take: take, pack: pack };
})();
