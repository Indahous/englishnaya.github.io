(function () {
  'use strict';
  var RED = '#e4605c', TEAL = '#3b7a74', W = '#fffdf3', Y = '#f4e39e', P = '#f2a4cf', G = '#7fb069', BR = '#b9783f';

  /* ---------- Иллюстрации окошек (viewBox 100×100) ---------- */
  var ART = {
    1: '<path d="M50 14l22 26H60l18 22H64l16 20H20l16-20H22l18-22H28z" fill="' + W + '"/><rect x="45" y="80" width="10" height="9" rx="2" fill="' + BR + '"/><path d="M50 12l3 6h6l-5 4 2 6-6-4-6 4 2-6-5-4h6z" fill="' + Y + '"/><circle cx="42" cy="48" r="3" fill="' + P + '"/><circle cx="58" cy="62" r="3" fill="' + Y + '"/><circle cx="40" cy="70" r="3" fill="' + P + '"/>',
    2: '<rect x="44" y="12" width="12" height="9" rx="2" fill="' + Y + '"/><path d="M50 21v7" stroke="' + Y + '" stroke-width="3"/><circle cx="50" cy="56" r="29" fill="' + W + '"/><path d="M26 50q24 14 48 0M24 62q26 14 52 0" stroke="' + RED + '" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/><circle cx="40" cy="42" r="3" fill="' + Y + '"/><circle cx="60" cy="42" r="3" fill="' + Y + '"/><circle cx="50" cy="73" r="3" fill="' + Y + '"/><ellipse cx="40" cy="44" rx="5" ry="9" fill="#fff" opacity=".5" transform="rotate(25 40 44)"/>',
    3: '<rect x="14" y="52" width="40" height="34" rx="3" fill="' + W + '"/><rect x="31" y="52" width="6" height="34" fill="' + RED + '"/><rect x="14" y="52" width="40" height="6" fill="' + P + '" opacity=".0"/><path d="M34 52c-12-14-18-2-8 0zM34 52c12-14 18-2 8 0z" fill="' + RED + '"/><rect x="46" y="30" width="38" height="56" rx="3" fill="' + P + '"/><rect x="62" y="30" width="6" height="56" fill="' + W + '"/><path d="M65 30c-12-14-18-2-8 0zM65 30c12-14 18-2 8 0z" fill="' + W + '"/>',
    4: '<circle cx="50" cy="26" r="13" fill="' + BR + '"/><path d="M38 38h24l22-6 4 8-22 12 8 28-10 4-8-18-8 18-10-4 8-28L12 40l4-8z" fill="' + BR + '" transform="translate(0 4)"/><circle cx="45" cy="24" r="2" fill="#fff"/><circle cx="55" cy="24" r="2" fill="#fff"/><path d="M45 30q5 4 10 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="50" cy="50" r="2.6" fill="' + W + '"/><circle cx="50" cy="60" r="2.6" fill="' + W + '"/><path d="M38 16q12-6 24 0" stroke="' + W + '" stroke-width="3" fill="none" stroke-linecap="round" opacity=".0"/><path d="M14 38q4 4 8 0M78 38q4 4 8 0M36 82q3 4 8 0M56 82q3 4 8 0" stroke="' + W + '" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    5: '<path d="M22 66c0-30 12-44 28-44s28 14 28 44z" fill="' + RED + '"/><rect x="18" y="62" width="64" height="16" rx="8" fill="' + W + '"/><path d="M26 70h48" stroke="#d9d4be" stroke-width="2" stroke-dasharray="3 4"/><circle cx="50" cy="20" r="8" fill="' + W + '"/><path d="M34 40l8 8M44 32l10 10M56 28l10 10" stroke="' + W + '" stroke-width="3" stroke-linecap="round" opacity=".8"/>',
    6: '<path d="M34 16h24v36l22 14c6 4 4 14-4 14H48c-9 0-14-6-14-14z" fill="' + W + '"/><rect x="30" y="12" width="32" height="14" rx="5" fill="' + TEAL + '"/><path d="M34 40h24M34 52h24" stroke="' + RED + '" stroke-width="4"/><path d="M68 72q6 0 8 6" stroke="' + RED + '" stroke-width="4" fill="none" stroke-linecap="round"/>',
    7: '<circle cx="50" cy="44" r="30" fill="#e8f6f5" stroke="' + W + '" stroke-width="3"/><path d="M30 78q20-10 40 0l4 8H26z" fill="' + RED + '"/><rect x="32" y="74" width="36" height="6" fill="' + Y + '"/><path d="M50 56l-6 14h12z" fill="' + G + '"/><path d="M50 40l-8 18h16z" fill="' + G + '" /><path d="M50 28l-6 14h12z" fill="' + G + '"/><circle cx="40" cy="38" r="2" fill="#fff"/><circle cx="62" cy="48" r="2" fill="#fff"/><circle cx="56" cy="30" r="2" fill="#fff"/><circle cx="38" cy="54" r="2" fill="#fff"/><ellipse cx="38" cy="30" rx="4" ry="9" fill="#fff" opacity=".7" transform="rotate(30 38 30)"/>',
    8: '<path d="M50 14c-18 0-24 16-24 34 0 12-6 18-10 24h68c-4-6-10-12-10-24 0-18-6-34-24-34z" fill="' + Y + '"/><circle cx="50" cy="12" r="5" fill="' + Y + '"/><circle cx="50" cy="78" r="8" fill="' + BR + '"/><path d="M34 34q-4 10-2 24" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/><path d="M16 72h68" stroke="' + BR + '" stroke-width="4" stroke-linecap="round"/><path d="M40 26q10-6 20 0" stroke="' + RED + '" stroke-width="5" fill="none" stroke-linecap="round" opacity=".0"/>',
    9: '<g stroke="' + W + '" stroke-width="5" stroke-linecap="round" fill="none"><path d="M50 12v76M17 31l66 38M17 69l66-38"/><path d="M42 18l8 8 8-8M42 82l8-8 8 8M20 44l11 3-3-11M80 56l-11-3 3 11M20 56l11-3-3 11M80 44l-11 3 3-11"/></g><circle cx="50" cy="50" r="6" fill="' + P + '"/>',
    10: '<g fill="none" stroke-linecap="round"><path d="M28 80V34q0-18 18-18t18 18" stroke="' + W + '" stroke-width="11"/><path d="M28 70V34q0-18 18-18t18 18" stroke="' + RED + '" stroke-width="11" stroke-dasharray="9 9" /><path d="M54 84V46q0-16 16-16t16 16" stroke="' + W + '" stroke-width="10" transform="translate(-8 0)"/><path d="M54 74V46q0-16 16-16t16 16" stroke="' + RED + '" stroke-width="10" stroke-dasharray="9 9" transform="translate(-8 0)"/></g>',
    11: '<g fill="' + G + '"><path d="M50 60C32 62 16 54 14 42c12-6 26-2 36 18z"/><path d="M50 60c18 2 34-6 36-18-12-6-26-2-36 18z"/><path d="M50 56C38 46 36 30 46 18c12 10 10 26 4 38z" /></g><path d="M50 60C34 58 26 52 22 46M50 60c16-2 24-8 28-14M50 56V26" stroke="#4f8a45" stroke-width="2" fill="none"/><circle cx="42" cy="66" r="8" fill="' + W + '"/><circle cx="58" cy="66" r="8" fill="' + W + '"/><circle cx="50" cy="74" r="8" fill="' + W + '"/><circle cx="42" cy="66" r="6" fill="' + RED + '"/><circle cx="58" cy="66" r="6" fill="' + RED + '"/><circle cx="50" cy="74" r="6" fill="' + RED + '"/>'
  };
  /* цвета окошек: 1 красное, 2 зелёное… как в образце (чередование) */
  var COL = { 1: RED, 2: TEAL, 3: RED, 4: TEAL, 5: TEAL, 6: RED, 7: TEAL, 8: RED, 9: RED, 10: TEAL, 11: RED };
  var NUMCOL = { 1: Y, 2: Y, 3: Y, 4: Y, 5: Y, 6: Y, 7: Y, 8: '#fff', 9: '#fff', 10: Y, 11: Y };

  /* «Марка» — квадрат с зубчиками по краю */
  function stamp() {
    var s = 100, r = 3.4, n = 10, step = s / n, d = 'M0 0';
    var i;
    for (i = 0; i < n; i++) d += 'L' + (i * step + step / 2 - r) + ' 0A' + r + ' ' + r + ' 0 0 0 ' + (i * step + step / 2 + r) + ' 0';
    d += 'L' + s + ' 0';
    for (i = 0; i < n; i++) d += 'L' + s + ' ' + (i * step + step / 2 - r) + 'A' + r + ' ' + r + ' 0 0 0 ' + s + ' ' + (i * step + step / 2 + r);
    d += 'L' + s + ' ' + s;
    for (i = n - 1; i >= 0; i--) d += 'L' + (i * step + step / 2 + r) + ' ' + s + 'A' + r + ' ' + r + ' 0 0 0 ' + (i * step + step / 2 - r) + ' ' + s;
    d += 'L0 ' + s;
    for (i = n - 1; i >= 0; i--) d += 'L0 ' + (i * step + step / 2 + r) + 'A' + r + ' ' + r + ' 0 0 0 0 ' + (i * step + step / 2 - r);
    return d + 'Z';
  }
  var STAMP = stamp();

  var cal = document.getElementById('cal');
  for (var n = 1; n <= 11; n++) {
    var open = n === 1;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot cell-' + n + (open ? ' open' : ' locked');
    b.setAttribute('aria-label', open ? 'Окошко 1: игра «Найди пару»' : 'Окошко ' + n + ': скоро');
    if (!open) b.setAttribute('aria-disabled', 'true');
    b.innerHTML =
      '<svg class="tile" viewBox="0 0 100 100" aria-hidden="true"><path d="' + STAMP + '" fill="#fff"/>' +
      '<rect x="6" y="6" width="88" height="88" rx="4" fill="' + COL[n] + '"/>' +
      '<rect x="9.5" y="9.5" width="81" height="81" rx="2" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1" stroke-dasharray="2 2"/>' +
      '<g class="art" transform="translate(14 10) scale(.72)">' + ART[n] + '</g>' +
      '<text x="14" y="30" font-family="Playfair Display,Georgia,serif" font-weight="900" font-size="26" fill="' + NUMCOL[n] + '" stroke="' + COL[n] + '" stroke-width="2" paint-order="stroke">' + n + '</text></svg>' +
      (open ? '<span class="play">Играть</span>' : '<span class="soon">Скоро</span>');
    cal.appendChild(b);
    if (open) b.addEventListener('click', openGame);
  }

  /* ---------- Снег ---------- */
  var snow = document.getElementById('snow');
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (var i = 0; i < 26; i++) {
      var f = document.createElement('span');
      f.className = 'flake';
      f.textContent = i % 3 ? '❄' : '❅';
      f.style.left = Math.random() * 100 + '%';
      f.style.fontSize = (10 + Math.random() * 16) + 'px';
      f.style.animationDuration = (9 + Math.random() * 12) + 's';
      f.style.animationDelay = (-Math.random() * 20) + 's';
      f.style.setProperty('--dx', (Math.random() * 80 - 40) + 'px');
      snow.appendChild(f);
    }
  }
  var header = document.getElementById('header'), last = 0;
  window.addEventListener('scroll', function () {
    var cur = window.pageYOffset || 0;
    header.style.transform = (cur > last && cur > 50) ? 'translateY(-100%)' : 'translateY(0)';
    last = cur <= 0 ? 0 : cur;
  });

  /* ---------- Игра «Найди пару» ---------- */
  var WORDS = ['windy', 'snowy', 'sunny', 'rainy'];
  var TIME = 90;               // секунд на игру
  var $ = function (id) { return document.getElementById(id); };
  var modal = $('modal'), board = $('board'), hint = $('hint'), over = $('over');
  var A = window.LeafAudio;
  var G = null, soundOn = true;
  try { soundOn = localStorage.getItem('advent-sound') !== '0'; } catch (e) {}
  $('b-sound').setAttribute('aria-pressed', soundOn);

  /* Озвучка: файлы advent/voice/windy.mp3 и т.д. Если файла нет — игра просто идёт без голоса */
  var clips = {};
  function say(key) {
    if (!soundOn) return;
    try {
      var a = clips[key] || (clips[key] = new Audio('voice/' + key + '.mp3'));
      a.onerror = function () { clips[key] = { play: function () {}, pause: function () {} }; };
      a.currentTime = 0;
      var p = a.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function sfx(name) { if (soundOn && A && A[name]) { try { A[name](); } catch (e) {} } }

  var BACK = '<svg viewBox="0 0 100 125" preserveAspectRatio="xMidYMid slice"><rect width="100" height="125" fill="' + TEAL + '"/><rect x="6" y="6" width="88" height="113" rx="6" fill="none" stroke="#fff" stroke-opacity=".5" stroke-dasharray="3 3"/>' +
    '<g stroke="#fff" stroke-width="3.4" stroke-linecap="round" fill="none"><path d="M50 36v52M28 49l44 26M28 75l44-26"/><path d="M43 41l7 7 7-7M43 83l7-7 7 7M31 56l9 2-2-9M69 69l-9-2 2 9M31 69l9-2-2 9M69 56l-9 2 2-9"/></g><circle cx="50" cy="62" r="5" fill="' + P + '"/>' +
    '<g fill="#fff" opacity=".6"><circle cx="16" cy="18" r="2"/><circle cx="84" cy="20" r="2.4"/><circle cx="18" cy="104" r="2.4"/><circle cx="82" cy="106" r="2"/><circle cx="84" cy="62" r="1.6"/><circle cx="15" cy="62" r="1.6"/></g></svg>';

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function fmt(s) { s = Math.max(0, s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  function newGame() {
    stop();
    over.classList.add('hidden');
    var deck = shuffle(WORDS.concat(WORDS));
    G = { deck: deck, open: [], tries: 0, pairs: 0, left: TIME, busy: false, started: false, timer: null, done: false };
    board.innerHTML = '';
    deck.forEach(function (w, i) {
      var c = document.createElement('button');
      c.type = 'button'; c.className = 'card'; c.dataset.i = i; c.dataset.w = w;
      c.setAttribute('aria-label', 'Карточка ' + (i + 1));
      c.innerHTML = '<span class="face back">' + BACK + '</span><span class="face front"><img src="img/card-' + w + '.png" alt="' + w + '" draggable="false"></span>';
      c.addEventListener('click', function () { flip(c); });
      board.appendChild(c);
    });
    $('s-time').textContent = fmt(TIME); $('s-tries').textContent = '0'; $('s-pairs').textContent = '0/4';
    $('s-time').parentNode.classList.remove('low');
    hint.textContent = 'Find the pairs';
  }
  function stop() { if (G && G.timer) { clearInterval(G.timer); G.timer = null; } }

  function tick() {
    G.left--;
    $('s-time').textContent = fmt(G.left);
    if (G.left <= 10) $('s-time').parentNode.classList.add('low');
    if (G.left <= 0) lose();
  }

  function flip(c) {
    if (!G || G.busy || G.done || c.classList.contains('up')) return;
    if (A && soundOn) { try { A.unlock && A.unlock(); A.start && A.start(); } catch (e) {} }
    if (!G.started) { G.started = true; G.timer = setInterval(tick, 1000); }
    c.classList.add('up'); G.open.push(c);
    sfx('tap'); say(c.dataset.w);
    if (G.open.length < 2) return;
    G.tries++; $('s-tries').textContent = G.tries;
    var a = G.open[0], b = G.open[1];
    G.busy = true;
    if (a.dataset.w === b.dataset.w) {
      setTimeout(function () {
        a.classList.add('matched'); b.classList.add('matched');
        G.pairs++; $('s-pairs').textContent = G.pairs + '/4';
        hint.textContent = 'You found a pair!'; sfx('catch'); say('pair');
        G.open = []; G.busy = false;
        if (G.pairs === 4) setTimeout(win, 900);
      }, 450);
    } else {
      setTimeout(function () {
        a.classList.add('shake'); b.classList.add('shake'); sfx('oops');
        setTimeout(function () {
          a.classList.remove('up', 'shake'); b.classList.remove('up', 'shake');
          G.open = []; G.busy = false; hint.textContent = 'Try again!';
        }, 450);
      }, 700);
    }
  }

  var STAR = '<svg viewBox="0 0 24 24"><path d="M12 2l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.7 5.7 21.4l1.5-7.1L1.8 9.4 9 8.6z" fill="FILL" stroke="STROKE" stroke-width="1.2" stroke-linejoin="round"/></svg>';
  function showOver(title, stars, text) {
    $('o-title').textContent = title;
    var html = '';
    for (var i = 0; i < 3; i++) {
      var on = i < stars;
      html += STAR.replace('FILL', on ? '#ffd54a' : '#e3dfc8').replace('STROKE', on ? '#e0a800' : '#c9c4a6').replace('<svg', on ? '<svg class="on" style="animation-delay:' + (i * .25) + 's"' : '<svg');
    }
    $('o-stars').innerHTML = html;
    $('o-text').textContent = text;
    over.classList.remove('hidden');
  }
  function win() {
    stop(); G.done = true;
    var stars = G.tries <= 6 ? 3 : G.tries <= 9 ? 2 : 1;
    sfx('win'); say('win');
    showOver('You win!', stars, 'Время: ' + fmt(TIME - G.left) + ' · Попыток: ' + G.tries);
    confetti();
  }
  function lose() {
    stop(); G.done = true;
    sfx('oops'); say('lose');
    showOver('Время вышло', 0, 'Найдено пар: ' + G.pairs + ' из 4. Попробуем ещё раз?');
  }

  function confetti() {
    var cv = $('confetti'), r = cv.getBoundingClientRect(), ctx = cv.getContext('2d');
    cv.width = r.width; cv.height = r.height;
    var cols = [RED, TEAL, Y, P, '#fff'], ps = [];
    for (var i = 0; i < 90; i++) ps.push({ x: Math.random() * cv.width, y: -Math.random() * cv.height * .5, vx: Math.random() * 2 - 1, vy: 2 + Math.random() * 3, s: 5 + Math.random() * 6, c: cols[i % 5], a: Math.random() * 6 });
    var t0 = performance.now();
    (function loop(t) {
      ctx.clearRect(0, 0, cv.width, cv.height);
      ps.forEach(function (p) { p.x += p.vx; p.y += p.vy; p.a += .1; ctx.fillStyle = p.c; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
      if (t - t0 < 3500 && !over.classList.contains('hidden')) requestAnimationFrame(loop); else ctx.clearRect(0, 0, cv.width, cv.height);
    })(t0);
  }

  function openGame() { modal.classList.remove('hidden'); document.body.classList.add('lock'); newGame(); $('x').focus(); }
  function closeGame() { stop(); if (G) G.done = true; modal.classList.add('hidden'); document.body.classList.remove('lock'); }
  $('x').addEventListener('click', closeGame);
  $('o-close').addEventListener('click', closeGame);
  $('o-again').addEventListener('click', newGame);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeGame(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeGame(); });
  $('b-sound').addEventListener('click', function () {
    soundOn = !soundOn; this.setAttribute('aria-pressed', soundOn);
    try { localStorage.setItem('advent-sound', soundOn ? '1' : '0'); } catch (e) {}
    if (A && A.setSfx) { try { A.setSfx(soundOn); } catch (e) {} }
  });
  window.__advent = { open: openGame, state: function () { return G; } };
})();
