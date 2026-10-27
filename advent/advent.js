(function () {
  'use strict';
  var RED = '#ec6561', TEAL = '#3a7872', W = '#fffdf3', Y = '#f4e39e', P = '#f2a4cf', G = '#7fb069', BR = '#b9783f';

  var AA = window.ADVENT_ART, EDGE = AA.wavy(2.6, 9);

  var cal = document.getElementById('cal');
  for (var n = 1; n <= 11; n++) {
    var open = n === 1;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot cell-' + n + (open ? ' open' : ' locked');
    b.setAttribute('aria-label', open ? 'Окошко 1: игра «Найди пару»' : 'Окошко ' + n + ': скоро');
    if (!open) b.setAttribute('aria-disabled', 'true');
    b.innerHTML =
      '<svg class="tile" viewBox="0 0 100 100" aria-hidden="true"><path d="' + EDGE + '" fill="' + AA.ART[n].bg + '"/>' +
      '<g class="art">' + AA.ART[n].svg + '</g></svg>' +
      (open ? '<span class="play ' + AA.ART[n].pos + '">Играть</span>' : '<span class="soon ' + AA.ART[n].pos + '">Скоро</span>');
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
