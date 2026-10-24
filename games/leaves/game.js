/* Помоги Ёжику поймать листья! — для малышей 0–5 лет.
   Листья падают, нужно поймать листья цвета, названного вверху (английское слово).
   Управление: мышь / палец (корзинка едет за курсором), стрелки, или просто нажать на лист. Проигрыша нет. */
(() => {
  'use strict';

  const A = window.LeafAudio;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

  const COLORS = {
    red:    { word: 'Red',    ru: 'красные',   img: 'img/leaf-red.png' },
    yellow: { word: 'Yellow', ru: 'жёлтые',    img: 'img/leaf-yellow.png' },
    green:  { word: 'Green',  ru: 'зелёные',   img: 'img/leaf-green.png' },
    orange: { word: 'Orange', ru: 'оранжевые', img: 'img/leaf-orange.png' }
  };
  const COLOR_KEYS = Object.keys(COLORS);
  const HEROES = {
    hedgehog: { name: 'Ёжик',     img: 'img/hedgehog.png', cw: 0.95, bot: 0.23, hi: 'Привет! Я Ёжик!' },
    fox:      { name: 'Лисичка',  img: 'img/fox.png',      cw: 0.90, bot: 0.22, hi: 'Привет! Я Лисичка!' },
    squirrel: { name: 'Белочка',  img: 'img/squirrel.png', cw: 1.05, bot: 0.36, hi: 'Привет! Я Белочка!' }
  };
  const PER_ROUND = 5, ROUNDS = COLOR_KEYS.length;
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2 15,9 22,9.3 16.5,14 18.2,21 12,17.2 5.8,21 7.5,14 2,9.3 9,9" stroke-linejoin="round"/></svg>';
  const STACK_POS = [[20, 30, -18], [40, 27, 6], [57, 31, 16], [30, 35, -6], [47, 36, 10]];

  /* ---------- Озвучка слов (английский голос браузера) ---------- */
  let voice = null;
  const pickVoice = () => {
    if (!('speechSynthesis' in window)) return;
    const vs = window.speechSynthesis.getVoices() || [];
    voice = vs.find((v) => /^en[-_]US/i.test(v.lang) && /female|samantha|zira|google us|aria|jenny/i.test(v.name))
      || vs.find((v) => /^en[-_]US/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
  };
  if ('speechSynthesis' in window) { pickVoice(); window.speechSynthesis.onvoiceschanged = pickVoice; }
  const speak = (word) => {
    if (!A.sfx || !('speechSynthesis' in window)) return;
    try {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US'; u.rate = 0.75; u.pitch = 1.2; u.volume = 1;
      if (voice) u.voice = voice;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch (e) { /* озвучка необязательна */ }
  };

  /* ---------- Экраны ---------- */
  const screens = { pick: $('#screen-pick'), rules: $('#screen-rules'), play: $('#screen-play'), win: $('#screen-win') };
  const show = (name) => {
    Object.entries(screens).forEach(([k, n]) => n.classList.toggle('hidden', k !== name));
    document.body.dataset.screen = name;
    $('#target').classList.toggle('hidden', name !== 'play');
  };

  const G = {
    hero: null, order: [], round: 0, target: null, caught: 0, phase: 'idle', running: false,
    leaves: [], heroX: 0, targetX: 0, vx: 0, fw: 0, fh: 0, W: 200, ls: 100, lift: 28, mouthY: 0, catchHalf: 80, groundY: 0,
    spawnT: 0, last: 0, raf: 0, lastProgress: 0, timers: [], animTimer: 0, id: 0
  };
  const keys = { left: false, right: false };
  const later = (fn, ms) => { const t = setTimeout(fn, ms); G.timers.push(t); return t; };
  const clearTimers = () => { G.timers.forEach(clearTimeout); G.timers = []; };

  /* ---------- Выбор героя ---------- */
  const buildCards = () => {
    const box = $('#cards');
    box.innerHTML = '';
    Object.entries(HEROES).forEach(([key, h], i) => {
      const b = el('button', 'card');
      b.type = 'button';
      b.style.setProperty('--d', (i * 0.5) + 's');
      b.innerHTML = '<span class="pic"><img src="' + h.img + '" alt=""></span><span>' + h.name + '</span>';
      b.setAttribute('aria-label', 'Выбрать героя: ' + h.name);
      b.addEventListener('click', () => {
        A.start(); A.pick();
        b.classList.add('chosen');
        G.hero = key;
        later(() => { b.classList.remove('chosen'); showRules(); }, 450);
      });
      box.appendChild(b);
    });
  };

  /* ---------- Правила ---------- */
  const showRules = () => {
    const h = HEROES[G.hero];
    $('#rules-img').src = h.img;
    $('#rules-hi').textContent = h.hi;
    show('rules');
  };

  /* ---------- Герой с корзинкой ---------- */
  const heroMarkup = (key, withStack) => {
    const h = HEROES[key];
    return '<div class="basket b-back"><img src="img/basket.png" alt=""></div>' +
      '<div class="sprite-pos" style="--bot:' + h.bot + '"><div class="sprite" style="--cw:' + h.cw + '"><img src="' + h.img + '" alt=""></div></div>' +
      (withStack ? '<div class="stack"></div>' : '') +
      '<div class="basket b-front"><img src="img/basket.png" alt=""></div>';
  };
  const setAnim = (name, ms) => {
    const hero = $('#hero');
    if (!hero) return;
    clearTimeout(G.animTimer);
    hero.dataset.anim = name || '';
    G.animLock = !!ms;
    if (ms) G.animTimer = setTimeout(() => { G.animLock = false; hero.dataset.anim = ''; }, ms);
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
    G.ls = clamp(vmin * 0.16, 64, 124);
    G.lift = Math.max(12, G.fh * 0.035);
    const root = document.documentElement.style;
    root.setProperty('--W', G.W + 'px'); root.setProperty('--LS', G.ls + 'px'); root.setProperty('--lift', G.lift + 'px');
    const basketTop = G.fh - G.lift - G.W * 1.0;
    G.mouthY = basketTop + G.W * 0.30;
    G.catchHalf = G.W * 0.38;
    G.groundY = G.fh - G.lift * 0.4 - G.ls * 0.35;
    G.heroX = clamp(G.heroX || G.fw / 2, G.W * 0.45, G.fw - G.W * 0.45);
    G.targetX = clamp(G.targetX || G.heroX, G.W * 0.45, G.fw - G.W * 0.45);
  };

  /* ---------- Старт игры ---------- */
  const startGame = () => {
    stopGame();
    show('play');
    const field = $('#field');
    field.querySelectorAll('.hero').forEach((n) => n.remove());
    const hero = el('div', 'hero', heroMarkup(G.hero, true));
    hero.id = 'hero';
    field.appendChild(hero);
    G.leaves = []; $('#leaves').innerHTML = '';
    G.heroX = 0; G.targetX = 0; G.vx = 0;
    layout();
    G.heroX = G.targetX = G.fw / 2;
    G.order = shuffle(COLOR_KEYS);
    G.round = 0;
    G.running = true;
    G.last = performance.now();
    G.raf = requestAnimationFrame(frame);
    startRound(0);
  };
  const stopGame = () => {
    G.running = false; cancelAnimationFrame(G.raf); clearTimers(); clearTimeout(G.animTimer);
    G.phase = 'idle';
    const p = $('#popup'); if (p) p.classList.add('hidden');
  };

  const buildStars = () => { $('#t-stars').innerHTML = STAR.repeat(PER_ROUND); };
  const setStars = (n) => { Array.from($('#t-stars').children).forEach((s, i) => s.classList.toggle('on', i < n)); };

  const popup = (html, ms) => {
    const p = $('#popup');
    p.innerHTML = html;
    p.classList.remove('hidden');
    p.style.animation = 'none'; void p.offsetWidth; p.style.animation = '';
    if (ms) later(() => p.classList.add('hidden'), ms);
  };

  const startRound = (i) => {
    G.round = i; G.caught = 0; G.target = G.order[i]; G.phase = 'intro';
    G.leaves.forEach((L) => L.el.remove()); G.leaves = [];
    const c = COLORS[G.target];
    $('#t-leaf').src = c.img; $('#t-word').textContent = c.word; $('#t-round').textContent = (i + 1) + '/' + ROUNDS;
    buildStars(); setStars(0);
    const t = $('#target'); t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop');
    const stack = $('#hero .stack'); if (stack) stack.innerHTML = '';
    A.setIntensity(i);
    popup('<p class="p-small">Лови ' + c.ru + ' листья!</p><div class="p-word">' + c.word + '</div><img src="' + c.img + '" alt="">', 2400);
    later(() => speak(c.word), 350);
    later(() => { speak(c.word); }, 1500);
    later(() => { G.phase = 'play'; G.spawnT = 0; G.lastProgress = performance.now(); spawnLeaf(true); G.spawnT = rand(1.0, 1.5); }, 2500);
  };

  /* ---------- Листья ---------- */
  const spawnLeaf = (forceTarget) => {
    const needTarget = !G.leaves.some((l) => l.state === 'fall' && l.color === G.target && !l.dead);
    let color;
    if (forceTarget || needTarget || Math.random() < 0.5) color = G.target;
    else { const others = COLOR_KEYS.filter((k) => k !== G.target); color = others[Math.floor(Math.random() * others.length)]; }
    const scale = clamp(G.fh / 700, 0.75, 1.3);
    const base = [66, 78, 90, 100][G.round] * scale;
    const node = el('button', 'leaf', '<img src="' + COLORS[color].img + '" alt=""><span class="tag">' + COLORS[color].word + '</span>');
    node.type = 'button';
    node.setAttribute('aria-label', 'Лист: ' + COLORS[color].word);
    node.dataset.color = color;
    $('#leaves').appendChild(node);
    const L = {
      id: ++G.id, el: node, color, state: 'fall', dead: false,
      baseX: rand(G.ls * 0.7, G.fw - G.ls * 0.7), x: 0, y: -G.ls * 0.6, prevY: -G.ls * 0.6,
      vy: base * rand(0.9, 1.15), vyBase: 0, ay: 0, vx: 0, t: rand(0, 3), freq: rand(0.9, 1.5), ph: rand(0, 6.28), amp: rand(14, 34) * (G.ls / 100),
      rot: 0, sc: 1
    };
    L.vyBase = L.vy;
    node.addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); onLeafDown(L); });
    G.leaves.push(L);
    place(L);
    return L;
  };

  const place = (L) => {
    L.el.style.transform = 'translate3d(' + (L.x - G.ls / 2).toFixed(1) + 'px,' + (L.y - G.ls / 2).toFixed(1) + 'px,0) rotate(' + L.rot.toFixed(1) + 'deg) scale(' + L.sc.toFixed(3) + ')';
  };

  const onLeafDown = (L) => {
    if (G.phase !== 'play' || L.state !== 'fall' || L.dead) return;
    A.unlock();
    if (L.color === G.target) startFly(L, 0.45); else wrongLeaf(L);
  };

  const startFly = (L, dur) => {
    L.state = 'fly'; L.fx0 = L.x; L.fy0 = L.y; L.ft = 0; L.fdur = dur; L.arc = dur > 0.3 ? G.ls * 0.5 : 0; L.rot0 = L.rot;
    L.el.classList.remove('glow'); L.el.style.zIndex = 6;
  };

  const wrongLeaf = (L) => {
    L.dead = true;
    A.oops();
    setAnim('nope', 560);
    L.el.classList.add('showtag'); setTimeout(() => L.el.classList.remove('showtag'), 1500);
    L.el.classList.remove('glow');
    L.vy = -250 * clamp(G.fh / 700, 0.8, 1.3); L.ay = 640; L.vx = (Math.random() < 0.5 ? -1 : 1) * rand(70, 130);
  };

  const finishCatch = (L) => {
    L.el.remove(); G.leaves = G.leaves.filter((x) => x !== L);
    G.caught += 1; G.lastProgress = performance.now();
    const stack = $('#hero .stack');
    if (stack && G.caught <= STACK_POS.length) {
      const p = STACK_POS[G.caught - 1];
      const im = el('img'); im.src = COLORS[G.target].img; im.alt = '';
      im.style.left = p[0] + '%'; im.style.top = p[1] + '%'; im.style.transform = 'rotate(' + p[2] + 'deg)';
      stack.appendChild(im);
    }
    bumpBasket(); setAnim('cheer', 720); A.catch(); speak(COLORS[G.target].word);
    setStars(G.caught);
    if (G.caught >= PER_ROUND) roundDone();
  };

  const roundDone = () => {
    G.phase = 'between';
    G.leaves.forEach((L) => { L.el.classList.add('gone'); const e = L.el; setTimeout(() => e.remove(), 450); });
    G.leaves = [];
    A.roundDone();
    const last = G.round + 1 >= ROUNDS;
    popup('<p class="p-small">' + (last ? 'Это был последний цвет!' : 'Молодец!') + '</p><div class="p-stars">' + STAR.repeat(3) + '</div>', 2100);
    later(() => { if (last) win(); else startRound(G.round + 1); }, 2300);
  };

  /* ---------- Главный цикл ---------- */
  const frame = (now) => {
    if (!G.running) return;
    const dt = Math.min(0.05, (now - G.last) / 1000);
    G.last = now;
    update(dt, now);
    G.raf = requestAnimationFrame(frame);
  };

  const update = (dt, now) => {
    if (keys.left) G.targetX -= 760 * dt;
    if (keys.right) G.targetX += 760 * dt;
    G.targetX = clamp(G.targetX, G.W * 0.45, G.fw - G.W * 0.45);
    const prev = G.heroX;
    G.heroX += clamp((G.targetX - G.heroX) * (1 - Math.exp(-dt * 11)), -1900 * dt, 1900 * dt);
    const v = (G.heroX - prev) / Math.max(dt, 0.001);
    G.vx += (v - G.vx) * 0.25;
    const hero = $('#hero');
    if (hero) {
      hero.style.transform = 'translate3d(' + (G.heroX - G.W / 2).toFixed(1) + 'px,0,0)';
      if (!G.animLock) { const m = G.vx > 150 ? 'r' : (G.vx < -150 ? 'l' : ''); if (hero.dataset.anim !== m) hero.dataset.anim = m; }
    }

    if (G.phase === 'play') {
      G.spawnT -= dt;
      const falling = G.leaves.filter((l) => l.state === 'fall' && !l.dead).length;
      if (G.spawnT <= 0 && falling < 5) { spawnLeaf(false); G.spawnT = rand(1.1, 1.8); }
      // подсказка: мягкое свечение нужного листа, если долго нет успехов
      if (now - G.lastProgress > 9000) {
        const cands = G.leaves.filter((l) => l.state === 'fall' && l.color === G.target && !l.dead);
        if (cands.length) { cands.sort((a, b) => b.y - a.y); cands[0].el.classList.add('glow'); }
      }
    }

    G.leaves.slice().forEach((L) => {
      if (L.state === 'fall') {
        L.t += dt; L.prevY = L.y;
        L.vy += L.ay * dt;
        if (L.ay && L.vy >= L.vyBase) { L.vy = L.vyBase; L.ay = 0; }
        L.y += L.vy * dt;
        L.baseX += L.vx * dt; L.vx *= Math.pow(0.35, dt);
        L.baseX = clamp(L.baseX, G.ls * 0.4, G.fw - G.ls * 0.4);
        L.x = L.baseX + Math.sin(L.t * L.freq + L.ph) * L.amp;
        L.rot = Math.sin(L.t * L.freq + L.ph + 1.3) * 24;
        if (!L.dead && G.phase === 'play' && L.prevY < G.mouthY && L.y >= G.mouthY && Math.abs(L.x - G.heroX) <= G.catchHalf) {
          if (L.color === G.target) startFly(L, 0.22); else wrongLeaf(L);
        } else if (L.y > G.groundY) {
          L.state = 'land'; L.el.classList.remove('glow'); L.el.classList.add('landed');
          const e = L.el; setTimeout(() => e.remove(), 900);
        }
      } else if (L.state === 'fly') {
        L.ft += dt / L.fdur;
        const t = Math.min(1, L.ft), e = t * t * (3 - 2 * t);
        const tx = G.heroX, ty = G.mouthY + G.W * 0.12;
        L.x = L.fx0 + (tx - L.fx0) * e;
        L.y = L.fy0 + (ty - L.fy0) * e - Math.sin(Math.PI * t) * L.arc;
        L.rot = L.rot0 * (1 - e) + 12 * e; L.sc = 1 - 0.58 * e;
        if (t >= 1) finishCatch(L);
      }
      if (L.el.isConnected) place(L);
    });
    G.leaves = G.leaves.filter((l) => l.state !== 'land' || l.el.isConnected);
  };

  /* ---------- Ввод ---------- */
  const setTargetFromEvent = (e) => {
    const r = $('#field').getBoundingClientRect();
    G.targetX = clamp(e.clientX - r.left, G.W * 0.45, G.fw - G.W * 0.45);
  };
  const field = $('#field');
  field.addEventListener('pointerdown', (e) => { A.unlock(); setTargetFromEvent(e); field.style.cursor = 'grabbing'; });
  field.addEventListener('pointerup', () => { field.style.cursor = ''; });
  field.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' || e.buttons) setTargetFromEvent(e); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { keys.left = true; if (G.running) e.preventDefault(); }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { keys.right = true; if (G.running) e.preventDefault(); }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
  });
  window.addEventListener('resize', () => { if (G.running) { layout(); } });
  window.addEventListener('orientationchange', () => setTimeout(() => { if (G.running) layout(); }, 200));

  /* ---------- Победа ---------- */
  let confettiRaf = 0;
  const confetti = () => {
    const cv = $('#confetti'), cx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = ['#f2a4cf', '#f4b942', '#ee8b4a', '#8fc36a', '#ffffff', '#e9724c'];
    const ps = Array.from({ length: 140 }, () => ({ x: Math.random() * innerWidth, y: -rand(0, innerHeight * 0.8), vx: rand(-40, 40), vy: rand(90, 220), s: rand(7, 14), r: rand(0, 6), vr: rand(-4, 4), c: cols[Math.floor(Math.random() * cols.length)] }));
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
    stopGame();
    $('#win-hero').innerHTML = heroMarkup(G.hero, false);
    $('#win-stars').innerHTML = STAR.repeat(ROUNDS);
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
  $('#btn-sound').addEventListener('click', () => { A.setSfx(!A.sfx); syncTools(); if (A.sfx) A.tap(); });
  $('#btn-go').addEventListener('click', () => { A.start(); A.tap(); startGame(); });
  $('#btn-rules-back').addEventListener('click', () => { A.tap(); show('pick'); });
  $('#btn-again').addEventListener('click', () => { A.tap(); startGame(); });
  $('#btn-other').addEventListener('click', () => { A.tap(); stopGame(); show('pick'); });

  buildCards();
  syncTools();
  show('pick');

  // для автотестов
  window.__leaves = { state: () => ({ phase: G.phase, round: G.round, target: G.target, caught: G.caught, hero: G.hero, leaves: G.leaves.map((l) => ({ color: l.color, state: l.state, dead: l.dead })) }) };
})();
