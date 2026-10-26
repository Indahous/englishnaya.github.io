/* Ёжик собирает урожай! — для детей 3–6 лет.
   Голос и надпись сверху: «I have two apples». Нужно собрать в корзинку ровно столько яблок или грибов.
   Управление: нажать на предмет или перетащить его в корзинку. Проигрыша нет. */
(() => {
  'use strict';

  const A = window.LeafAudio;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

  const NUM = ['', 'one', 'two', 'three', 'four', 'five'];
  const KINDS = {
    apple:    { one: 'apple',    many: 'apples',    imgs: ['img/apple-red.png', 'img/apple-yellow.png', 'img/apple-green.png'], ru: 'яблоки' },
    mushroom: { one: 'mushroom', many: 'mushrooms', imgs: ['img/mush-1.png', 'img/mush-2.png'], ru: 'грибы' }
  };
  /* Порядок раундов фиксированный: числа от 1 до 5, яблоки и грибы вперемешку */
  const ROUNDS = [
    { kind: 'apple', n: 1 }, { kind: 'mushroom', n: 2 }, { kind: 'apple', n: 3 }, { kind: 'mushroom', n: 1 },
    { kind: 'apple', n: 4 }, { kind: 'mushroom', n: 3 }, { kind: 'apple', n: 5 }, { kind: 'mushroom', n: 5 }
  ];
  const phrase = (r) => 'I have ' + NUM[r.n] + ' ' + (r.n === 1 ? KINDS[r.kind].one : KINDS[r.kind].many);
  const phraseKey = (r) => (r.n === 1 ? KINDS[r.kind].one : KINDS[r.kind].many) + '-' + r.n; // apple-1, apples-2, mushrooms-3 ...
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2 15,9 22,9.3 16.5,14 18.2,21 12,17.2 5.8,21 7.5,14 2,9.3 9,9" stroke-linejoin="round"/></svg>';
  const STACK_POS = [[20, 30, -18], [40, 27, 6], [57, 31, 16], [30, 35, -6], [47, 36, 10]];

  /* ---------- Озвучка (записанные фразы: voice/apples-2.mp3, voice/mushroom-1.mp3, voice/count-3.mp3 …) ---------- */
  const VOICE = {};
  const voiceEl = (key) => {
    if (!VOICE[key]) { const a = new Audio('voice/' + key + '.mp3'); a.preload = 'auto'; a.addEventListener('error', () => { a.__bad = true; }); VOICE[key] = a; }
    return VOICE[key];
  };
  let currentVoice = null;
  const speak = (key) => {
    if (!A.sfx) return;
    const a = voiceEl(key);
    if (!a || a.__bad) return;
    try {
      if (currentVoice && currentVoice !== a) currentVoice.pause();
      a.currentTime = 0; currentVoice = a;
      const pr = a.play();
      if (pr && pr.catch) pr.catch(() => { /* автозапуск мог быть заблокирован */ });
    } catch (e) { /* озвучка необязательна */ }
  };
  const stopVoice = () => { try { if (currentVoice) currentVoice.pause(); } catch (e) { /* ignore */ } };
  const preload = () => { ROUNDS.forEach((r) => voiceEl(phraseKey(r))); for (let i = 1; i <= 5; i++) voiceEl('count-' + i); };

  /* ---------- Экраны и состояние ---------- */
  const screens = { rules: $('#screen-rules'), play: $('#screen-play'), win: $('#screen-win') };
  const show = (name) => {
    Object.entries(screens).forEach(([k, n]) => n.classList.toggle('hidden', k !== name));
    document.body.dataset.screen = name;
    $('#target').classList.toggle('hidden', name !== 'play');
    $('#phrase').classList.toggle('hidden', name !== 'play');
  };
  const G = { round: 0, got: 0, flying: 0, phase: 'idle', timers: [], lastProgress: 0, hintTimer: 0, drag: null, suppress: false, W: 200, fs: 80, lift: 28, fw: 0, fh: 0, animTimer: 0 };
  const later = (fn, ms) => { const t = setTimeout(fn, ms); G.timers.push(t); return t; };
  const clearTimers = () => { G.timers.forEach(clearTimeout); G.timers = []; clearInterval(G.hintTimer); clearTimeout(G.animTimer); };

  /* ---------- Ёжик с корзинкой и мимикой ---------- */
  const faceSvg = () => {
    const e = [[162, 162, 9.5, 12.5], [288, 162, 9.5, 12.5]], ink = '#1d1526';
    let s = '<svg class="face" viewBox="0 0 446 560" aria-hidden="true">';
    s += '<g class="brows" style="stroke:#b88c4c"><path d="M148 139 Q157 130 167 134"/><path d="M284 135 Q295 131 304 140"/></g>';
    s += '<g class="eyes">' + e.map((p) => '<g class="eye"><ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="' + p[3] + '" fill="' + ink + '"/><ellipse cx="' + (p[0] + 1.5) + '" cy="' + (p[1] - 2) + '" rx="' + (p[2] * 0.42) + '" ry="' + (p[3] * 0.45) + '" fill="#fff"/></g>').join('') + '</g>';
    s += '<g class="eyes-happy" style="stroke:' + ink + '">' + e.map((p) => '<path d="M' + (p[0] - 11) + ' ' + (p[1] + 5) + ' Q' + p[0] + ' ' + (p[1] - 14) + ' ' + (p[0] + 11) + ' ' + (p[1] + 5) + '"/>').join('') + '</g>';
    s += '<path class="m-smile" d="M204 198 Q228 212 253 198"/>';
    s += '<g class="m-happy"><path d="M206 195 Q229 232 252 195 Z" fill="#8a3b3b" stroke="#8a3b3b" stroke-width="3" stroke-linejoin="round"/><ellipse cx="229" cy="212" rx="10" ry="5.5" fill="#ee8f8f"/></g>';
    s += '<ellipse class="m-o" cx="229" cy="206" rx="8.5" ry="11.5" fill="#8a3b3b"/></svg>';
    return s;
  };
  const heroMarkup = (withStack) =>
    '<div class="basket b-back"><img src="img/basket.png" alt=""></div>' +
    '<div class="sprite-pos" style="--bot:0.23"><div class="sprite" style="--cw:0.95"><div class="hero-box"><img class="hero-img" src="img/hedgehog-face.png" alt="">' + faceSvg() + '</div></div></div>' +
    (withStack ? '<div class="stack"></div>' : '') +
    '<div class="basket b-front"><img src="img/basket.png" alt=""></div>';
  const setAnim = (name, ms) => {
    const hero = $('#hero');
    if (!hero) return;
    clearTimeout(G.animTimer);
    hero.dataset.anim = name || '';
    if (ms) G.animTimer = setTimeout(() => { hero.dataset.anim = ''; }, ms);
  };
  const bumpBasket = () => {
    document.querySelectorAll('#hero .basket, #hero .stack').forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
  };

  /* ---------- Размеры ---------- */
  const layout = () => {
    const field = $('#field');
    const r = field.getBoundingClientRect();
    G.fw = r.width; G.fh = r.height;
    const vmin = Math.min(window.innerWidth, window.innerHeight);
    G.W = Math.max(88, Math.min(clamp(vmin * 0.30, 110, 230), G.fh * 0.34));
    G.fs = clamp(vmin * 0.145, 54, 104);
    G.lift = Math.max(12, G.fh * 0.035);
    const root = document.documentElement.style;
    root.setProperty('--W', G.W + 'px'); root.setProperty('--FS', G.fs + 'px'); root.setProperty('--lift', G.lift + 'px');
  };
  const heroRect = () => $('#hero').getBoundingClientRect();
  const mouthPoint = () => {
    const hr = heroRect();
    return { x: hr.left + hr.width / 2, y: hr.bottom - G.W * 1.0 + G.W * 0.30 };
  };

  /* ---------- Раскладка предметов на поляне ---------- */
  const placeItems = (list) => {
    const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar')) || 92;
    const phr = $('#phrase').getBoundingClientRect();
    const fieldTop = $('#field').getBoundingClientRect().top;
    let top = Math.max(bar + 6, phr.bottom) + 10 - fieldTop;
    // на узких вертикальных экранах фон растягивается по высоте: предметы кладём только на землю (луг), а не в небо
    if (window.innerHeight > window.innerWidth * 1.1) {
      const sc = Math.max(window.innerWidth / 1600, window.innerHeight / 900);
      top = Math.max(top, window.innerHeight - (900 - 470) * sc - fieldTop);
    }
    const fs = G.fs, fw = G.fw, fh = G.fh;
    const hx = fw / 2, hTop = fh - G.lift - G.W * 1.45;
    const spots = [];
    const ok = (x, y, d) => {
      if (x < 4 || y < top || x > fw - fs - 4 || y > fh - fs - 6) return false;
      // зона ёжика
      if (x + fs > hx - G.W * 0.62 && x < hx + G.W * 0.62 && y + fs > hTop) return false;
      return spots.every((s) => Math.hypot(s.x - x, s.y - y) >= d);
    };
    list.forEach((it) => {
      let d = fs * 1.02, tries = 0, x = 0, y = 0;
      for (;;) {
        x = rnd(4, fw - fs - 4); y = rnd(top, fh - fs - 6);
        if (ok(x, y, d)) break;
        if (++tries > 250) { d *= 0.9; tries = 0; if (d < fs * 0.5) { x = rnd(4, fw - fs - 4); y = rnd(top, fh - fs - 6); break; } }
      }
      spots.push({ x, y }); it.x = x; it.y = y;
    });
  };

  const spawnRound = (r) => {
    const meadow = $('#meadow');
    meadow.innerHTML = '';
    const other = r.kind === 'apple' ? 'mushroom' : 'apple';
    const list = [];
    const need = Math.min(7, r.n + 2);
    const pickImgs = (k, c) => { const a = shuffle(KINDS[k].imgs); return Array.from({ length: c }, (_, i) => a[i % a.length]); };
    pickImgs(r.kind, need).forEach((img) => list.push({ kind: r.kind, img }));
    pickImgs(other, 3).forEach((img) => list.push({ kind: other, img }));
    placeItems(list);
    shuffle(list).forEach((it, i) => {
      const b = el('button', 'fruit', '<img src="' + it.img + '" alt="">');
      b.type = 'button';
      b.dataset.kind = it.kind;
      b.style.left = it.x + 'px'; b.style.top = it.y + 'px';
      b.style.setProperty('--d', (i * 0.3 % 2.4) + 's');
      b.setAttribute('aria-label', it.kind === 'apple' ? 'Яблоко' : 'Гриб');
      b.addEventListener('pointerdown', (e) => onDown(e, b));
      b.addEventListener('pointermove', (e) => onMove(e, b));
      b.addEventListener('pointerup', (e) => onUp(e, b));
      b.addEventListener('pointercancel', (e) => onUp(e, b, true));
      b.addEventListener('click', () => {
        if (G.suppress) { G.suppress = false; return; }
        attempt(b, false);
      });
      meadow.appendChild(b);
    });
  };

  /* ---------- Игра ---------- */
  const setStars = (n) => { $('#t-stars').innerHTML = STAR.repeat(ROUNDS.length); Array.from($('#t-stars').children).forEach((s, i) => s.classList.toggle('on', i < n)); };

  const startGame = () => {
    stopGame();
    show('play');
    $('#hero').innerHTML = heroMarkup(true);
    layout();
    startRound(0);
  };
  const stopGame = () => {
    clearTimers(); stopVoice();
    G.phase = 'idle';
  };

  const startRound = (i) => {
    G.round = i; G.got = 0; G.flying = 0; G.phase = 'intro';
    const r = ROUNDS[i];
    const stack = $('#hero .stack'); if (stack) { stack.classList.remove('clear'); stack.innerHTML = ''; }
    layout();
    $('#ph-text').textContent = phrase(r);
    const ph = $('#phrase'); ph.classList.remove('pop'); void ph.offsetWidth; ph.classList.add('pop');
    $('#t-round').textContent = (i + 1) + '/' + ROUNDS.length;
    setStars(i);
    A.setIntensity(i);
    spawnRound(r);
    later(() => speak(phraseKey(r)), 450);
    later(() => { if (G.phase === 'intro') G.phase = 'play'; G.lastProgress = performance.now(); }, 800);
    clearInterval(G.hintTimer);
    G.hintTimer = setInterval(() => {
      if (G.phase !== 'play') return;
      const idle = performance.now() - G.lastProgress;
      const cands = Array.from(document.querySelectorAll('.fruit')).filter((n) => n.dataset.kind === ROUNDS[G.round].kind && !n.classList.contains('flying'));
      document.querySelectorAll('.fruit').forEach((n) => n.classList.remove('hint'));
      if (idle > 9000 && cands.length) cands[0].classList.add('hint');
    }, 1000);
  };

  /* ---------- Перетаскивание ---------- */
  const inBasketZone = (cx, cy) => {
    const hr = heroRect();
    const px = hr.width * 0.2, py = hr.height * 0.18;
    return cx > hr.left - px && cx < hr.right + px && cy > hr.top - py && cy < hr.bottom + py;
  };
  const onDown = (e, item) => {
    if ((G.phase !== 'play' && G.phase !== 'intro') || item.classList.contains('flying')) return;
    A.unlock();
    try { item.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    G.drag = { item, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, moved: false, id: e.pointerId };
  };
  const onMove = (e, item) => {
    const d = G.drag;
    if (!d || d.item !== item || d.id !== e.pointerId) return;
    d.dx = e.clientX - d.sx; d.dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(d.dx, d.dy) > 9) { d.moved = true; item.classList.remove('back'); item.classList.add('dragging'); }
    if (d.moved) item.style.transform = 'translate(' + d.dx + 'px,' + d.dy + 'px) scale(1.12)';
  };
  const onUp = (e, item, cancelled) => {
    const d = G.drag;
    if (!d || d.item !== item) return;
    G.drag = null;
    if (!d.moved) return; // обычное нажатие — обработает click
    G.suppress = true;
    setTimeout(() => { G.suppress = false; }, 60);
    item.classList.remove('dragging');
    if (cancelled) return snapBack(item);
    const r = item.getBoundingClientRect();
    if (inBasketZone(r.left + r.width / 2, r.top + r.height / 2)) attempt(item, true);
    else snapBack(item);
  };
  const snapBack = (item) => {
    item.classList.add('back');
    item.style.transform = '';
    setTimeout(() => item.classList.remove('back'), 450);
  };

  /* ---------- Сбор ---------- */
  const spark = (x, y, n) => {
    const fx = $('#fx');
    for (let i = 0; i < n; i++) {
      const s = el('div', 'spark', STAR);
      const a = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 70;
      s.style.left = x + 'px'; s.style.top = y + 'px';
      s.style.setProperty('--dx', Math.cos(a) * dist + 'px'); s.style.setProperty('--dy', Math.sin(a) * dist + 'px');
      fx.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  };

  const attempt = (item, dragged) => {
    if (G.phase !== 'play' && G.phase !== 'intro') { if (dragged) snapBack(item); return; }
    if (item.classList.contains('flying') || item.classList.contains('gone')) return;
    const r = ROUNDS[G.round];
    G.lastProgress = performance.now();
    document.querySelectorAll('.fruit').forEach((n) => n.classList.remove('hint'));
    if (item.dataset.kind !== r.kind) return wrong(item, dragged);
    if (G.got + G.flying >= r.n) { if (dragged) snapBack(item); return; }
    collect(item, dragged);
  };

  const wrong = (item, dragged) => {
    A.oops();
    if (dragged) snapBack(item);
    item.classList.remove('wobble'); void item.offsetWidth; item.classList.add('wobble');
    setTimeout(() => item.classList.remove('wobble'), 650);
    setAnim('nope', 700);
    later(() => { if (G.phase === 'play') speak(phraseKey(ROUNDS[G.round])); }, 800);
  };

  const collect = (item, dragged) => {
    G.flying++;
    item.classList.add('flying');
    item.classList.remove('dragging', 'back');
    const img = item.querySelector('img');
    const ir = img.getBoundingClientRect();
    const mp = mouthPoint();
    const cur = dragged ? 1.12 : 1;
    const m = new DOMMatrixReadOnly(getComputedStyle(item).transform);
    const dx = mp.x - (ir.left + ir.width / 2) + m.e;
    const dy = mp.y - (ir.top + ir.height / 2) + m.f;
    const s = clamp((G.W * 0.27) / G.fs, 0.3, 1.2);
    item.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
    A.tap();
    later(() => {
      G.flying--; G.got++;
      const src = img.getAttribute('src');
      item.classList.add('gone');
      later(() => item.remove(), 400);
      const stack = $('#hero .stack');
      const pos = STACK_POS[(G.got - 1) % STACK_POS.length];
      const im = el('img'); im.src = src; im.alt = '';
      im.style.left = pos[0] + '%'; im.style.top = pos[1] + '%'; im.style.transform = 'rotate(' + pos[2] + 'deg)';
      stack.appendChild(im);
      bumpBasket();
      A.catch();
      spark(mp.x, mp.y, 6);
      speak('count-' + G.got);
      G.lastProgress = performance.now();
      if (G.got >= ROUNDS[G.round].n) roundDone();
    }, 540);
  };

  const roundDone = () => {
    G.phase = 'celebrate';
    const r = ROUNDS[G.round];
    setStars(G.round + 1);
    const hr = heroRect();
    later(() => { A.roundDone(); setAnim('cheer', 1500); spark(hr.left + hr.width / 2, hr.top + hr.height * 0.35, 14); }, 450);
    later(() => speak(phraseKey(r)), 1100);
    later(() => {
      document.querySelectorAll('.fruit').forEach((n) => n.classList.add('gone'));
      const st = $('#hero .stack'); if (st) st.classList.add('clear');
    }, 3300);
    later(() => {
      if (G.round + 1 < ROUNDS.length) startRound(G.round + 1); else win();
    }, 3800);
  };

  /* ---------- Победа ---------- */
  let confettiRaf = 0;
  const confetti = () => {
    const cv = $('#confetti'), cx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = ['#f2a4cf', '#f4b942', '#ee8b4a', '#8fc36a', '#ffffff', '#9ec0de'];
    const ps = Array.from({ length: 130 }, () => ({ x: Math.random() * innerWidth, y: -rnd(0, innerHeight * 0.8), vx: rnd(-40, 40), vy: rnd(90, 220), s: rnd(7, 14), r: rnd(0, 6), vr: rnd(-4, 4), c: cols[Math.floor(Math.random() * cols.length)] }));
    let last = performance.now();
    const t0 = last;
    cancelAnimationFrame(confettiRaf);
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      cx.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach((p) => {
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt;
        if (p.y > innerHeight + 20 && now - t0 < 6000) { p.y = -20; p.x = Math.random() * innerWidth; }
        cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; cx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.6); cx.restore();
      });
      if (now - t0 < 9000 && !screens.win.classList.contains('hidden')) confettiRaf = requestAnimationFrame(tick);
      else cx.clearRect(0, 0, innerWidth, innerHeight);
    };
    confettiRaf = requestAnimationFrame(tick);
  };
  const win = () => {
    clearTimers(); stopVoice();
    G.phase = 'win';
    const wh = $('#win-hero');
    wh.innerHTML = heroMarkup(true);
    const st = wh.querySelector('.stack');
    const imgs = ['img/apple-red.png', 'img/mush-1.png', 'img/apple-green.png', 'img/mush-2.png', 'img/apple-yellow.png'];
    imgs.forEach((src, i) => { const im = el('img'); im.src = src; im.alt = ''; im.style.left = STACK_POS[i][0] + '%'; im.style.top = STACK_POS[i][1] + '%'; im.style.transform = 'rotate(' + STACK_POS[i][2] + 'deg)'; st.appendChild(im); });
    $('#win-stars').innerHTML = STAR.repeat(3);
    show('win');
    A.win();
    confetti();
  };

  /* ---------- Кнопки ---------- */
  const syncTools = () => {
    $('#btn-music').setAttribute('aria-pressed', String(A.music));
    $('#btn-sound').setAttribute('aria-pressed', String(A.sfx));
  };
  $('#btn-music').addEventListener('click', () => { A.setMusic(!A.music); if (A.music) A.start(); syncTools(); });
  $('#btn-sound').addEventListener('click', () => { A.setSfx(!A.sfx); if (!A.sfx) stopVoice(); syncTools(); if (A.sfx) A.tap(); });
  $('#btn-go').addEventListener('click', () => { A.start(); A.tap(); startGame(); });
  $('#btn-again').addEventListener('click', () => { A.tap(); startGame(); });
  $('#target').addEventListener('click', () => { A.unlock(); if (G.phase === 'play') speak(phraseKey(ROUNDS[G.round])); });
  $('#phrase').addEventListener('click', () => { A.unlock(); if (G.phase === 'play') speak(phraseKey(ROUNDS[G.round])); });
  const relayout = () => {
    if (G.phase === 'idle' || G.phase === 'win') return;
    layout();
    // раскладка на поляне пересчитывается только при новом раунде; на повороте экрана подтягиваем предметы внутрь поля
    document.querySelectorAll('.fruit').forEach((n) => {
      const x = clamp(parseFloat(n.style.left), 4, Math.max(4, G.fw - G.fs - 4)), y = clamp(parseFloat(n.style.top), 4, Math.max(4, G.fh - G.fs - 6));
      n.style.left = x + 'px'; n.style.top = y + 'px';
    });
  };
  window.addEventListener('resize', relayout);
  window.addEventListener('orientationchange', () => setTimeout(relayout, 200));

  preload();
  syncTools();
  show('rules');
  setStars(0);

  // для автотестов
  window.__harvest = { state: () => ({ phase: G.phase, round: G.round, got: G.got, rounds: ROUNDS.length, phrase: $('#ph-text').textContent }) };
})();
