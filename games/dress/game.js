/* Ёжик идёт гулять! — для детей 3–6 лет.
   Герой собирается на осеннюю прогулку. Наверху слово (Coat / Boots / Umbrella) — нужно найти эту вещь и надеть на героя.
   Управление: нажать на вещь или перетащить её на героя. Проигрыша нет. */
(() => {
  'use strict';

  const A = window.LeafAudio;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

  /* Положение одежды на героях (в процентах от картинки героя) */
  const HEROES = {
    hedgehog: { name: 'Ёжик',    img: 'img/hedgehog.png', ar: 446 / 560, hi: 'Привет! Я Ёжик! Помоги мне одеться на прогулку!',
      coat: { l: 11, t: 42.5, w: 78 }, bootL: { l: 28.3, w: 23, b: -2.2 }, bootR: { l: 54.2, w: 23, b: -2.2 }, umbrella: { l: 76, w: 32 },
      fit: { body: 'img/hedgehog-clean.png', footL: 'img/hedgehog-footL.png', footR: 'img/hedgehog-footR.png', dim: [446, 560],
        eyes: { type: 'draw', ink: '#1d1526', pts: [[162, 162, 9.5, 12.5], [288, 162, 9.5, 12.5]] },
        brows: { col: '#b88c4c', paths: ['M148 139 Q157 130 167 134', 'M284 135 Q295 131 304 140'] },
        mouth: { ink: '#8a8566', smile: 'M204 198 Q228 212 253 198', happy: 'M206 195 Q229 232 252 195 Z', tongue: [229, 212, 10, 5.5], o: [229, 206, 8.5, 11.5] },
        arms: 'svg' } },
    fox:      { name: 'Лисичка', img: 'img/fox.png',      ar: 451 / 600, hi: 'Привет! Я Лисичка! Помоги мне одеться на прогулку!',
      coat: { l: 0.2, t: 43.7, w: 66 }, bootL: { l: 16.7, w: 15.3, b: -1 }, bootR: { l: 35.8, w: 15.3, b: -1 }, umbrella: { l: -11, w: 26 },
      fit: { body: 'img/fox-clean.png', footL: 'img/fox-footL.png', footR: 'img/fox-footR.png', dim: [451, 600],
        eyes: { type: 'draw', ink: '#16212b', pts: [[87, 191, 8.5, 16], [200, 192, 8.5, 16]] },
        brows: { col: '#8a4a2a', ifs: true, paths: ['M72 160 Q88 150 103 160', 'M185 161 Q200 151 215 161'] },
        mouth: { ink: '#16212b', smile: 'M142 222 Q157 239 173 222', happy: 'M143 221 Q158 252 174 221 Z', tongue: [158, 238, 9, 5], o: [157, 233, 8, 11] },
        arms: { img: 'img/fox-armL.png', side: 'L', px: 105, py: 305, vars: '--rL:0deg;--uL1:70deg;--uL2:48deg;--nL:28deg' } } },
    squirrel: { name: 'Белочка', img: 'img/squirrel.png', ar: 553 / 560, hi: 'Привет! Я Белочка! Помоги мне одеться на прогулку!',
      coat: { l: -4.2, t: 41.4, w: 60 }, bootL: { l: 8.7, w: 13.6, b: -1 }, bootR: { l: 23.1, w: 13.6, b: -1 }, umbrella: { l: -16, w: 24 },
      fit: { body: 'img/squirrel-clean.png', footL: 'img/squirrel-footL.png', footR: 'img/squirrel-footR.png', dim: [553, 560],
        eyes: { type: 'lid', fill: '#fbf6e1', ink: '#241f1c', pts: [[80, 131, 37, 41], [210, 142, 37, 42]], hp: [[80, 138, 15], [209, 151, 15]] },
        brows: { col: '#a9763f', ifs: true, paths: ['M50 94 Q76 80 104 92', 'M186 108 Q214 94 240 108'] },
        mouth: { ink: '#2a2523', smile: 'M112 193 Q125 209 140 197 Q155 209 168 193', happy: 'M115 195 Q140 233 166 195 Z', tongue: [140, 217, 10, 5], o: [140, 209, 8, 11] },
        arms: null } }
  };
  const ITEMS = ['coat', 'bootL', 'bootR', 'umbrella'];
  const ROUNDS = [
    { key: 'coat',     word: 'Coat',     say: 'Надень пальто!',   need: ['coat'],            icon: 'coat',     ms: 2700 },
    { key: 'boots',    word: 'Boots',    say: 'Надень сапожки!',  need: ['bootL', 'bootR'],  icon: 'bootL',    ms: 2550 },
    { key: 'umbrella', word: 'Umbrella', say: 'Возьми зонтик!',   need: ['umbrella'],        icon: 'umbrella', ms: 2150 }
  ];
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="12,2 15,9 22,9.3 16.5,14 18.2,21 12,17.2 5.8,21 7.5,14 2,9.3 9,9" stroke-linejoin="round"/></svg>';

  /* ---------- Озвучка (записанные фразы) ---------- */
  const VOICE = {};
  ROUNDS.forEach((r) => { const a = new Audio('voice/' + r.key + '.mp3'); a.preload = 'auto'; VOICE[r.key] = a; });
  let currentVoice = null;
  const speak = (key) => {
    if (!A.sfx) return;
    const a = VOICE[key];
    if (!a) return;
    try {
      if (currentVoice && currentVoice !== a) currentVoice.pause();
      a.currentTime = 0; currentVoice = a;
      const pr = a.play();
      if (pr && pr.catch) pr.catch(() => { /* автозапуск мог быть заблокирован */ });
    } catch (e) { /* озвучка необязательна */ }
  };
  const stopVoice = () => { try { if (currentVoice) currentVoice.pause(); } catch (e) { /* ignore */ } };

  /* ---------- Состояние ---------- */
  const screens = { pick: $('#screen-pick'), rules: $('#screen-rules'), play: $('#screen-play'), win: $('#screen-win') };
  const show = (name) => {
    Object.entries(screens).forEach(([k, n]) => n.classList.toggle('hidden', k !== name));
    document.body.dataset.screen = name;
    $('#target').classList.toggle('hidden', name !== 'play');
  };
  const G = { hero: null, round: 0, worn: {}, phase: 'idle', timers: [], lastProgress: 0, hintTimer: 0, H: 340, drag: null, suppress: false };
  const later = (fn, ms) => { const t = setTimeout(fn, ms); G.timers.push(t); return t; };
  const clearTimers = () => { G.timers.forEach(clearTimeout); G.timers = []; clearInterval(G.hintTimer); };

  /* ---------- Герой ---------- */
  const buildHero = (key, H, allWorn) => {
    const h = HEROES[key];
    const box = el('div', 'hero-box');
    box.style.setProperty('--HH', H + 'px');
    box.style.setProperty('--ar', h.ar);
    const on = allWorn ? ' on' : '';
    const fit = h.fit;
    let FACE = '', ARMS = '';
    if (fit) {
      const [fw, fh] = fit.dim, e = fit.eyes, m = fit.mouth, br = fit.brows;
      const mi = m.ink;
      FACE = '<svg class="face" viewBox="0 0 ' + fw + ' ' + fh + '" aria-hidden="true">';
      FACE += '<g class="brows' + (br.ifs ? ' ifs' : '') + '" style="stroke:' + br.col + '">' + br.paths.map((d) => '<path d="' + d + '"/>').join('') + '</g>';
      if (e.type === 'draw') {
        FACE += '<g class="eyes">' + e.pts.map((p) => '<g class="eye"><ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="' + p[3] + '" fill="' + e.ink + '"/><ellipse cx="' + (p[0] + 1.5) + '" cy="' + (p[1] - 2) + '" rx="' + (p[2] * 0.42) + '" ry="' + (p[3] * 0.45) + '" fill="#fff"/></g>').join('') + '</g>';
      } else {
        FACE += '<g class="lids">' + e.pts.map((p) => '<ellipse class="lid" cx="' + p[0] + '" cy="' + p[1] + '" rx="' + p[2] + '" ry="' + p[3] + '" fill="' + e.fill + '"/>').join('') + '</g>';
      }
      const hp = e.type === 'draw' ? e.pts.map((p) => [p[0], p[1], 11]) : e.hp;
      FACE += '<g class="eyes-happy" style="stroke:' + e.ink + '">' + hp.map((p) => '<path d="M' + (p[0] - p[2]) + ' ' + (p[1] + 5) + ' Q' + p[0] + ' ' + (p[1] - 14) + ' ' + (p[0] + p[2]) + ' ' + (p[1] + 5) + '"/>').join('') + '</g>';
      FACE += '<path class="m-smile" d="' + m.smile + '" style="stroke:' + mi + '"/>';
      FACE += '<g class="m-happy"><path d="' + m.happy + '" fill="#8a3b3b" stroke="#8a3b3b" stroke-width="3" stroke-linejoin="round"/><ellipse cx="' + m.tongue[0] + '" cy="' + m.tongue[1] + '" rx="' + m.tongue[2] + '" ry="' + m.tongue[3] + '" fill="#ee8f8f"/></g>';
      FACE += '<ellipse class="m-o" cx="' + m.o[0] + '" cy="' + m.o[1] + '" rx="' + m.o[2] + '" ry="' + m.o[3] + '" fill="#8a3b3b"/></svg>';
      const ARM = (side, px) => '<g class="arm arm' + side + '" style="transform-origin:' + px + 'px 300px">' +
        '<path class="skin" d="M-13 -4 Q-13 -8 0 -8 Q13 -8 13 -4 L10.5 74 Q0 79 -10.5 74 Z" transform="translate(' + px + ' 300)"/>' +
        '<g class="sleeve" transform="translate(' + px + ' 300)"><path class="slv" d="M-15 -6 Q-15 -12 0 -12 Q15 -12 15 -6 L14 62 Q0 67 -14 62 Z"/><path class="cuff" d="M-14.5 54 L14.5 54 L14 70 Q0 75 -14 70 Z"/></g>' +
        '<circle class="hand" cx="' + px + '" cy="386" r="13"/></g>';
      if (fit.arms === 'svg') ARMS = '<svg class="arms" viewBox="0 0 ' + fw + ' ' + fh + '" aria-hidden="true">' + ARM('L', 92) + ARM('R', 354) + '</svg>';
      else if (fit.arms) ARMS = '<svg class="arms behind" viewBox="0 0 ' + fw + ' ' + fh + '" style="' + fit.arms.vars + '" aria-hidden="true"><g class="arm arm' + fit.arms.side + '" style="transform-origin:' + fit.arms.px + 'px ' + fit.arms.py + 'px"><image href="' + fit.arms.img + '" x="0" y="0" width="' + fw + '" height="' + fh + '"/></g></svg>';
    }
    const bb = (b) => (b.b !== undefined ? b.b : -1);
    box.classList.toggle('fit', !!fit);
    box.innerHTML =
      '<img class="hero-img" src="' + (fit ? fit.body : h.img) + '" alt="">' +
      '<img class="w w-coat' + on + '" src="img/coat-' + key + '.png" alt="" style="left:' + h.coat.l + '%;top:' + h.coat.t + '%;width:' + h.coat.w + '%">' +
      '<img class="w w-bootL' + on + '" src="img/bootL-' + key + '.png" alt="" style="left:' + h.bootL.l + '%;bottom:' + bb(h.bootL) + '%;width:' + h.bootL.w + '%">' +
      (fit ? '<img class="foot footL" src="' + fit.footL + '" alt="">' : '') +
      '<img class="w w-bootR' + on + '" src="img/bootR-' + key + '.png" alt="" style="left:' + h.bootR.l + '%;bottom:' + bb(h.bootR) + '%;width:' + h.bootR.w + '%">' +
      (fit ? '<img class="foot footR" src="' + fit.footR + '" alt="">' : '') +
      FACE +
      ARMS +
      '<img class="w w-umbrella' + on + '" src="img/umbrella-' + key + '.png" alt="" style="left:' + h.umbrella.l + '%;bottom:0;width:' + h.umbrella.w + '%">';
    return box;
  };
  const heroBox = () => $('#stage .hero-box');
  const setAnim = (name, ms) => {
    const b = heroBox();
    if (!b) return;
    b.dataset.anim = name || '';
    if (ms) later(() => { if (b.dataset.anim === name) b.dataset.anim = ''; }, ms);
  };

  /* ---------- Выбор героя и правила ---------- */
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
  const showRules = () => {
    const h = HEROES[G.hero];
    $('#rules-img').src = h.img;
    $('#rules-hi').textContent = h.hi;
    document.querySelectorAll('.step-pic .dg').forEach((n) => { n.src = 'img/coat-' + G.hero + '.png'; });
    document.querySelectorAll('.step-pic .dh').forEach((n) => { n.src = h.img; });
    document.querySelectorAll('.step-pic .rain-pic').forEach((n) => { n.src = 'img/umbrella-' + G.hero + '.png'; });
    document.querySelectorAll('.mini-target img').forEach((n) => { n.src = 'img/coat-' + G.hero + '.png'; });
    show('rules');
  };

  /* ---------- Размеры ---------- */
  const layout = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar')) || 92;
    const vmin = Math.min(vw, vh);
    const IS = clamp(Math.min(vmin * 0.2, (vw - 60) / 4.4, (vh * 0.3 - 30) / 1.28), 66, 150);
    document.documentElement.style.setProperty('--IS', IS + 'px');
    const shelfH = IS * 1.28 + 30;
    const stageH = vh - bar - shelfH - 8;
    const h = HEROES[G.hero || 'hedgehog'];
    G.H = clamp(Math.min(stageH * 0.97, (vw * 0.62) / h.ar), 120, 560);
    const b = heroBox();
    if (b) b.style.setProperty('--HH', G.H + 'px');
  };

  /* ---------- Игра ---------- */
  const startGame = () => {
    stopGame();
    document.body.classList.remove('finale');
    show('play');
    G.worn = {}; G.round = 0;
    const stage = $('#stage');
    stage.innerHTML = '';
    layout();
    const box = buildHero(G.hero, G.H, false);
    stage.appendChild(box);
    buildItems();
    layout();
    startRound(0);
  };
  const stopGame = () => {
    clearTimers(); stopVoice();
    G.phase = 'idle';
    const p = $('#popup'); if (p) p.classList.add('hidden');
    document.body.classList.remove('finale');
  };

  const buildItems = () => {
    const box = $('#items');
    box.innerHTML = '';
    shuffle(ITEMS).forEach((id) => {
      const b = el('button', 'item', '<img src="img/' + id + '-' + G.hero + '.png" alt="">');
      b.type = 'button';
      b.dataset.id = id;
      b.setAttribute('aria-label', { coat: 'Пальто', bootL: 'Левый сапожок', bootR: 'Правый сапожок', umbrella: 'Зонтик' }[id]);
      b.addEventListener('pointerdown', (e) => onDown(e, b));
      b.addEventListener('pointermove', (e) => onMove(e, b));
      b.addEventListener('pointerup', (e) => onUp(e, b));
      b.addEventListener('pointercancel', (e) => onUp(e, b, true));
      b.addEventListener('click', () => {
        if (G.suppress) { G.suppress = false; return; }
        attempt(id, b);
      });
      box.appendChild(b);
    });
  };

  const setStars = (n) => { $('#t-stars').innerHTML = STAR.repeat(ROUNDS.length); Array.from($('#t-stars').children).forEach((s, i) => s.classList.toggle('on', i < n)); };
  const popup = (html, ms) => {
    const p = $('#popup');
    p.innerHTML = html;
    p.classList.remove('hidden');
    p.style.animation = 'none'; void p.offsetWidth; p.style.animation = '';
    if (ms) later(() => p.classList.add('hidden'), ms);
  };
  const iconFor = (r) => 'img/' + r.icon + '-' + G.hero + '.png';

  const startRound = (i) => {
    G.round = i; G.phase = 'intro';
    const r = ROUNDS[i];
    $('#t-leaf').src = iconFor(r);
    $('#t-word').textContent = r.word;
    $('#t-round').textContent = (i + 1) + '/' + ROUNDS.length;
    setStars(i);
    const t = $('#target'); t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop');
    A.setIntensity(i);
    popup('<p class="p-small">' + r.say + '</p><div class="p-word">' + r.word + '</div><img src="' + iconFor(r) + '" alt="">', 2300);
    later(() => speak(r.key), 350);
    later(() => { G.phase = 'play'; G.lastProgress = performance.now(); }, 900);
    clearInterval(G.hintTimer);
    G.hintTimer = setInterval(() => {
      if (G.phase !== 'play') return;
      const idle = performance.now() - G.lastProgress;
      document.querySelectorAll('.item').forEach((n) => {
        const need = ROUNDS[G.round].need.includes(n.dataset.id) && !G.worn[n.dataset.id];
        n.classList.toggle('hint', need && idle > 9000);
      });
    }, 1000);
    document.querySelectorAll('.item').forEach((n) => n.classList.remove('hint'));
  };

  /* ---------- Перетаскивание ---------- */
  const heroRect = () => {
    const r = heroBox().getBoundingClientRect();
    const px = r.width * 0.18, py = r.height * 0.12;
    return { l: r.left - px, r: r.right + px, t: r.top - py, b: r.bottom + py };
  };
  const onDown = (e, item) => {
    if (G.phase === 'finale' || G.phase === 'celebrate' || item.classList.contains('flying')) return;
    A.unlock();
    try { item.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    G.drag = { item, sx: e.clientX, sy: e.clientY, dx: 0, dy: 0, moved: false, id: e.pointerId };
  };
  const onMove = (e, item) => {
    const d = G.drag;
    if (!d || d.item !== item || d.id !== e.pointerId) return;
    d.dx = e.clientX - d.sx; d.dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(d.dx, d.dy) > 9) { d.moved = true; item.classList.remove('back'); item.classList.add('dragging'); }
    if (d.moved) item.style.transform = 'translate(' + d.dx + 'px,' + d.dy + 'px) scale(1.1)';
  };
  const onUp = (e, item, cancelled) => {
    const d = G.drag;
    if (!d || d.item !== item) return;
    G.drag = null;
    if (!d.moved) return; // это обычное нажатие — его обработает click
    G.suppress = true;
    setTimeout(() => { G.suppress = false; }, 60);
    item.classList.remove('dragging');
    if (cancelled) return snapBack(item);
    const r = item.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const hr = heroRect();
    if (cx > hr.l && cx < hr.r && cy > hr.t && cy < hr.b) attempt(item.dataset.id, item, true);
    else snapBack(item);
  };
  const snapBack = (item) => {
    item.classList.add('back');
    item.style.transform = '';
    setTimeout(() => item.classList.remove('back'), 450);
  };

  /* ---------- Надевание ---------- */
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

  const attempt = (id, item, dragged) => {
    if (G.phase !== 'play' && G.phase !== 'intro') { if (dragged) snapBack(item); return; }
    if (G.worn[id] || item.classList.contains('flying')) return;
    const r = ROUNDS[G.round];
    G.lastProgress = performance.now();
    document.querySelectorAll('.item').forEach((n) => n.classList.remove('hint'));
    if (r.need.includes(id)) wear(id, item, dragged); else wrong(item, dragged);
  };

  const wrong = (item, dragged) => {
    A.oops();
    if (dragged) snapBack(item);
    item.classList.remove('wobble'); void item.offsetWidth; item.classList.add('wobble');
    setTimeout(() => item.classList.remove('wobble'), 650);
    setAnim('nope', 600);
    later(() => { if (G.phase === 'play') speak(ROUNDS[G.round].key); }, 700);
  };

  const wear = (id, item, dragged) => {
    G.worn[id] = true;
    item.classList.add('flying');
    item.classList.remove('dragging', 'back');
    const box = heroBox();
    const layer = box.querySelector('.w-' + id);
    const img = item.querySelector('img');
    const ir = img.getBoundingClientRect();
    const tr = layer.getBoundingClientRect();
    const cur = dragged ? 1.1 : 1;
    const m = new DOMMatrixReadOnly(getComputedStyle(item).transform);
    const dx = (tr.left + tr.width / 2) - (ir.left + ir.width / 2) + m.e;
    const dy = (tr.top + tr.height / 2) - (ir.top + ir.height / 2) + m.f;
    const s = clamp((tr.width / ir.width) * cur, 0.3, 4);
    item.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')';
    A.tap();
    later(() => {
      layer.classList.add('on');
      item.classList.add('used');
      item.classList.remove('flying');
      item.style.transform = '';
      const hr = layer.getBoundingClientRect();
      spark(hr.left + hr.width / 2, hr.top + hr.height / 2, 9);
      A.catch();
      setAnim('lift', 450);
      G.lastProgress = performance.now();
      const r = ROUNDS[G.round];
      if (r.need.every((n) => G.worn[n])) roundDone();
    }, 540);
  };

  const roundDone = () => {
    G.phase = 'celebrate';
    const r = ROUNDS[G.round];
    setStars(G.round + 1);
    const hr = heroBox().getBoundingClientRect();
    later(() => { A.roundDone(); setAnim('cheer', 800); spark(hr.left + hr.width / 2, hr.top + hr.height * 0.4, 14); speak(r.key); }, 250);
    later(() => {
      if (G.round + 1 < ROUNDS.length) startRound(G.round + 1); else finale();
    }, 250 + r.ms + 500);
  };

  const finale = () => {
    G.phase = 'finale';
    document.body.classList.add('finale');
    clearInterval(G.hintTimer);
    later(() => { heroBox().classList.add('walkout'); A.win(); }, 700);
    later(() => win(), 3000);
  };

  /* ---------- Победа ---------- */
  let confettiRaf = 0;
  const confetti = () => {
    const cv = $('#confetti'), cx = cv.getContext('2d');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = ['#f2a4cf', '#f4b942', '#ee8b4a', '#8fc36a', '#ffffff', '#9ec0de'];
    const rnd = (a, b) => a + Math.random() * (b - a);
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
    document.body.classList.remove('finale');
    G.phase = 'win';
    const wh = $('#win-hero');
    wh.innerHTML = '';
    wh.appendChild(buildHero(G.hero, clamp(innerHeight * 0.3, 150, 250), true));
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
  $('#btn-rules-back').addEventListener('click', () => { A.tap(); show('pick'); });
  $('#btn-again').addEventListener('click', () => { A.tap(); startGame(); });
  $('#btn-other').addEventListener('click', () => { A.tap(); stopGame(); show('pick'); });
  $('#target').addEventListener('click', () => { A.unlock(); if (G.phase === 'play' || G.phase === 'intro') speak(ROUNDS[G.round].key); });
  window.addEventListener('resize', () => { if (G.phase !== 'idle' && G.phase !== 'win') layout(); });
  window.addEventListener('orientationchange', () => setTimeout(() => { if (G.phase !== 'idle' && G.phase !== 'win') layout(); }, 200));

  buildCards();
  syncTools();
  show('pick');

  // для автотестов
  window.__dress = { state: () => ({ phase: G.phase, round: G.round, worn: Object.assign({}, G.worn), hero: G.hero }) };
})();
