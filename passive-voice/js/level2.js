/* WHO DID IT? — Level 2: Derry
   Prologue + 5 scenes with different mechanics. Uses window.Core (shared helpers),
   window.Art (original SVG art) and window.LEVEL2 (content). */
(() => {
  'use strict';

  const C = window.Core;
  const D = window.LEVEL2;
  const A = window.Art;
  const { $, el, shuffle, rand, sfx } = C;

  const TOTAL = D.scenes.length;
  const store = C.store('whodidit-l2-v1');
  const fresh = () => ({ intro: false, scene: 0, fear: 0, mistakes: 0, popped: 0, clippings: 0, blackouts: 0, stars: [], log: [] });
  let S = fresh();
  const save = () => store.save(S);

  const screens = {
    intro: $('#screen-l2-intro'),
    game: $('#screen-l2-game'),
    final: $('#screen-l2-final')
  };
  const stage = $('#l2-stage');

  let locked = false;
  let sc = null;            // current scene runtime { i, mistakes, ctrl, balloons, done }
  let wired = false;
  let lightningTimer = null;

  /* ---------- Atmosphere: rain, lightning, ambience ---------- */
  const flash = () => {
    const l = $('#lightning');
    l.classList.remove('flash');
    void l.offsetWidth;
    l.classList.add('flash');
    setTimeout(() => sfx.thunder(), 450);
  };
  const scheduleLightning = () => {
    clearTimeout(lightningTimer);
    lightningTimer = setTimeout(() => { flash(); scheduleLightning(); }, rand(22000, 42000));
  };
  const atmosphere = (on) => {
    document.body.classList.toggle('l2-mode', on);
    if (on) {
      C.rainFx.start($('#rain'));
      sfx.rainOn();
      scheduleLightning();
    } else {
      C.rainFx.stop();
      sfx.rainOff();
      clearTimeout(lightningTimer);
    }
  };

  const show = (name) => {
    Object.entries(screens).forEach(([k, n]) => n.classList.toggle('hidden', k !== name));
    window.scrollTo(0, 0);
  };

  /* ---------- Fear meter (a paper boat floating toward the drain) ---------- */
  const setFear = (v) => {
    S.fear = Math.max(0, Math.min(100, Math.round(v)));
    $('#l2-boat').style.left = 'calc((100% - 56px) * ' + (S.fear / 100).toFixed(3) + ')';
    $('#l2-fearnum').textContent = S.fear;
    $('#l2-gutter').setAttribute('aria-valuenow', S.fear);
    document.documentElement.style.setProperty('--fear', (S.fear / 100).toFixed(2));
    save();
  };

  const say = (text, kind) => {
    const fb = $('#l2-fb');
    if (!fb) return;
    fb.textContent = text;
    fb.className = 'feedback' + (kind ? ' ' + kind : '');
  };

  const blackout = () => {
    locked = true;
    S.blackouts += 1;
    sfx.dark();
    const b = $('#l2-blackout');
    b.classList.remove('hidden');
    setTimeout(() => {
      b.classList.add('hidden');
      locked = false;
      setFear(55);
      say('The light is back. Slow down: check was / were and the past participle.', 'bad');
    }, 1900);
  };
  const fearUp = (n) => {
    setFear(S.fear + n);
    if (S.fear >= 100) blackout();
  };

  /* ---------- Case map + clippings ---------- */
  const PINS = [[46, 48], [124, 102], [206, 54], [262, 140], [160, 198]];
  const renderMap = () => {
    const done = S.scene;
    let g = '<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Map of Derry with five scenes">' +
      '<defs><linearGradient id="mp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#17394a"/><stop offset="1" stop-color="#0a1a23"/></linearGradient></defs>' +
      '<rect width="320" height="240" rx="8" fill="url(#mp)"/>' +
      '<path d="M0 118 C60 90 90 150 160 128 S270 96 320 124" stroke="#3f8fa8" stroke-width="10" fill="none" opacity=".35"/>' +
      '<text x="12" y="116" font-size="9" fill="#7fb5c9" opacity=".7" font-style="italic">the Canal</text>' +
      '<polyline points="' + PINS.map((p) => p.join(',')).join(' ') + '" fill="none" stroke="#f2c230" stroke-width="2" stroke-dasharray="5 5" opacity=".55"/>';
    PINS.forEach((p, i) => {
      const isDone = i < done;
      const isNow = i === done && done < TOTAL;
      const fill = isDone ? '#f2c230' : (isNow ? '#d62828' : '#33424b');
      g += '<g>' + (isNow ? '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="18" fill="#d62828" opacity=".25" class="pin-pulse"/>' : '') +
        '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="13" fill="' + fill + '" stroke="#0a1a23" stroke-width="3"/>' +
        '<text x="' + p[0] + '" y="' + (p[1] + 4) + '" font-size="12" font-weight="700" text-anchor="middle" fill="' + (isDone ? '#1b1307' : '#fff') + '">' + (i + 1) + '</text>';
      const stars = S.stars[i];
      g += '<text x="' + p[0] + '" y="' + (p[1] + 28) + '" font-size="8.5" text-anchor="middle" fill="#cfd8dc">' + D.scenes[i].place.replace('Kitchen, ', '').replace('The Rainy Streets of Derry', 'Rainy streets').replace('The ', '') + '</text>';
      if (isDone && stars) g += '<text x="' + p[0] + '" y="' + (p[1] - 18) + '" font-size="10" text-anchor="middle" fill="#f2c230">' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</text>';
      g += '</g>';
    });
    $('#l2-map').innerHTML = g + '</svg>';
  };
  const renderClippings = () => {
    $('#l2-clipcount').textContent = S.clippings;
    const ul = $('#l2-cliplist');
    ul.innerHTML = '';
    D.secrets.slice(0, S.clippings).forEach((t) => ul.appendChild(el('li', null, t)));
  };

  /* ---------- Scene context given to every scene ---------- */
  const ctx = {
    locked: () => locked,
    say,
    right() { sfx.ok(); setFear(S.fear - 5); },
    wrong(entry, amount, why) {
      if (sc) sc.mistakes += 1;
      S.mistakes += 1;
      S.log.push({ scene: sc ? sc.i + 1 : 0, text: entry.text, picked: entry.picked, answer: entry.answer, why: why || '' });
      sfx.bad();
      say(why, 'bad');
      fearUp(amount == null ? 20 : amount);
    },
    complete() { completeScene(); }
  };

  const completeScene = () => {
    if (!sc || sc.done) return;
    sc.done = true;
    if (sc.balloons) sc.balloons.stop();
    const stars = sc.mistakes <= 1 ? 3 : (sc.mistakes <= 3 ? 2 : 1);
    S.stars[sc.i] = stars;
    S.scene = sc.i + 1;
    save();
    sfx.win();
    renderMap();
    const last = S.scene >= TOTAL;
    const box = $('#l2-done');
    box.innerHTML = '';
    const panel = el('div', 'complete');
    panel.appendChild(el('div', 'stamp', 'SOLVED'));
    const stp = el('div', 'stars', '★'.repeat(stars) + '☆'.repeat(3 - stars));
    stp.setAttribute('aria-label', stars + ' of 3 stars');
    panel.appendChild(stp);
    panel.appendChild(el('p', 'complete-note', D.scenes[sc.i].note));
    const next = el('button', 'btn btn-primary', last ? 'Open the case file →' : 'Next scene →');
    next.type = 'button';
    next.id = 'l2-next';
    next.addEventListener('click', () => { if (last) finish(); else startScene(S.scene); });
    panel.appendChild(next);
    box.appendChild(panel);
    next.focus({ preventScroll: true });
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };

  /* ---------- Balloon rewards ---------- */
  const onBalloonPop = () => {
    S.popped += 1;
    const order = shuffle(['hint', 'calm', 'clip']);
    let line = '';
    for (const r of order) {
      if (r === 'hint' && sc && sc.ctrl && sc.ctrl.hint && sc.ctrl.hint()) { line = 'Bonus: a hint is glowing on the screen.'; break; }
      if (r === 'calm' && S.fear > 0) { setFear(S.fear - 25); line = 'Bonus: the paper boat drifts away from the drain.'; break; }
      if (r === 'clip' && S.clippings < D.secrets.length) { S.clippings += 1; renderClippings(); line = 'Bonus: a new Derry Daily News clipping.'; break; }
    }
    save();
    C.toast('<strong>The balloon has been popped.</strong>' + (line ? '<br>' + line : ''));
  };

  /* ---------- Scene runner ---------- */
  const startScene = (i) => {
    if (i >= TOTAL) { finish(); return; }
    if (sc) { if (sc.balloons) sc.balloons.stop(); if (sc.ctrl && sc.ctrl.destroy) sc.ctrl.destroy(); }
    const meta = D.scenes[i];
    sc = { i, mistakes: 0, ctrl: null, balloons: null, done: false };
    locked = false;
    show('game');
    setFear(S.fear);
    renderMap();
    renderClippings();

    stage.innerHTML = '';
    const banner = el('div', 'scene-banner');
    banner.innerHTML = A.frame(meta.banner);
    if (meta.banner === 'balloon') { const sv = banner.querySelector('svg'); if (sv) sv.setAttribute('preserveAspectRatio', 'xMidYMin slice'); }
    const head = el('div', 'scene-banner-title');
    head.appendChild(el('span', 'kicker', 'SCENE ' + (i + 1) + ' OF ' + TOTAL + ' · ' + meta.place.toUpperCase()));
    head.appendChild(el('h2', null, meta.name));
    banner.appendChild(head);
    stage.appendChild(banner);
    stage.appendChild(el('p', 'case-sub', meta.instr));
    const host = el('div', 'scene-host');
    host.id = 'l2-host';
    stage.appendChild(host);
    const fb = el('p', 'feedback');
    fb.id = 'l2-fb';
    fb.setAttribute('role', 'status');
    stage.appendChild(fb);
    const done = el('div');
    done.id = 'l2-done';
    stage.appendChild(done);

    sc.ctrl = SCENES[i](host, ctx);
    sc.balloons = C.balloons({
      layer: $('#balloon-layer'),
      max: 2,
      active: () => sc && !sc.done && !locked && !screens.game.classList.contains('hidden'),
      onPop: onBalloonPop
    });
    window.scrollTo(0, 0);
  };

  /* ================= SCENE 1: Fold the Page ================= */
  const sentenceFrom = (arr) => {
    const t = arr.join(' ').replace(/\s+([?.,])/g, '$1');
    return t.charAt(0).toUpperCase() + t.slice(1) + (t.endsWith('?') ? '' : '.');
  };

  const scene1 = (host, c) => {
    const rounds = D.s1;
    let r = 0, asm = null, alive = true;
    host.innerHTML = '';
    const legend = el('div', 'legend');
    [['s', 'Subject'], ['v', 'Verb'], ['o', 'Object'], ['io', 'Indirect object']].forEach(([k, t]) => {
      const sp = el('span', 'lg role-' + k, t);
      legend.appendChild(sp);
    });
    host.appendChild(legend);
    const sheet = el('div', 'sheet');
    host.appendChild(sheet);
    const result = el('div', 'sheet passive hidden');
    host.appendChild(result);
    const asmHost = el('div', 's1-asm');
    host.appendChild(asmHost);
    const nextWrap = el('div', 's1-next');
    host.appendChild(nextWrap);

    const round = () => {
      const R = rounds[r];
      sheet.className = 'sheet';
      sheet.innerHTML = '';
      sheet.appendChild(el('span', 'sheet-tag', 'ACTIVE ' + (r + 1) + '/' + rounds.length));
      R.active.forEach((p) => sheet.appendChild(el('span', 'sp role-' + p.r, p.t)));
      result.classList.add('hidden');
      nextWrap.innerHTML = '';
      c.say('Build the passive sentence: start with the object.');
      asm = C.assembler(asmHost, {
        answer: R.answer,
        roles: R.roles,
        distractors: R.distractors,
        enabled: () => alive && !c.locked(),
        onHint: (t) => c.say(t),
        onRight: () => { c.right(); c.say('Correct. Keep going.', 'good'); },
        onWrong: ({ piece, why }) => c.wrong({ text: R.active.map((p) => p.t).join(' '), picked: piece.text, answer: R.answer.join(' ') }, 20, why),
        onDone: () => {
          sheet.classList.add('folded');
          result.classList.remove('hidden');
          result.innerHTML = '';
          result.appendChild(el('span', 'sheet-tag', 'PASSIVE'));
          result.appendChild(document.createTextNode(sentenceFrom(R.answer)));
          c.say(R.note, 'good');
          if (r + 1 >= rounds.length) {
            setTimeout(() => { if (alive) c.complete(); }, 700);
          } else {
            const b = el('button', 'btn btn-primary', 'Fold the next page →');
            b.type = 'button';
            b.addEventListener('click', () => { r += 1; round(); });
            nextWrap.appendChild(b);
            b.focus({ preventScroll: true });
          }
        }
      });
    };
    round();
    return { hint: () => asm && asm.hint(), destroy() { alive = false; } };
  };

  /* ================= SCENE 2: Can It Be Passive? ================= */
  const scene2 = (host, c) => {
    let queue = shuffle(D.s2);
    const total = D.s2.length;
    let solved = 0, streak = 0, alive = true;
    host.innerHTML = '';
    const info = el('div', 'deck-info');
    const count = el('span', null, '');
    const streakEl = el('span', 'streak', '');
    info.appendChild(count);
    info.appendChild(streakEl);
    host.appendChild(info);
    const zone = el('div', 'card-zone');
    const card = el('div', 'sort-card');
    const cardBtn = el('button', 'sc-btn');
    cardBtn.type = 'button';
    cardBtn.setAttribute('aria-label', 'Sentence card. Drag it onto a box, or use the buttons below.');
    card.appendChild(cardBtn);
    zone.appendChild(card);
    host.appendChild(zone);
    const bins = el('div', 'bins');
    const mk = (yes, title, sub) => {
      const b = el('button', 'bin ' + (yes ? 'bin-yes' : 'bin-no'));
      b.type = 'button';
      b.dataset.yes = yes ? '1' : '0';
      b.appendChild(el('strong', null, title));
      b.appendChild(el('span', null, sub));
      b.appendChild(el('kbd', null, yes ? '←' : '→'));
      bins.appendChild(b);
      return b;
    };
    const binYes = mk(true, 'PASSIVE POSSIBLE', 'the verb has an object');
    const binNo = mk(false, 'NO PASSIVE', 'the verb has no object');
    host.appendChild(bins);

    const cur = () => queue[0];
    const paint = () => {
      count.textContent = 'Card ' + Math.min(solved + 1, total) + ' of ' + total;
      streakEl.textContent = streak >= 2 ? 'Streak: ' + streak : '';
      const k = cur();
      if (!k) return;
      cardBtn.innerHTML = '';
      const idx = k.text.indexOf(k.verb);
      cardBtn.appendChild(document.createTextNode(k.text.slice(0, idx)));
      cardBtn.appendChild(el('mark', null, k.verb));
      cardBtn.appendChild(document.createTextNode(k.text.slice(idx + k.verb.length)));
      card.classList.remove('shake', 'enter');
      void card.offsetWidth;
      card.classList.add('enter');
    };

    const answer = (yes) => {
      if (!alive || c.locked() || !cur()) return;
      const k = cur();
      if (yes === k.yes) {
        queue.shift();
        solved += 1;
        streak += 1;
        c.right();
        let msg = k.yes ? 'Yes! Passive: ' + k.passive : 'Right. ' + k.why;
        if (streak > 0 && streak % 3 === 0) { setFear(S.fear - 10); msg += '  Streak bonus: the boat drifts back.'; }
        c.say(msg, 'good');
        if (!queue.length) { count.textContent = 'All sorted'; cardBtn.textContent = ''; card.classList.add('hidden'); setTimeout(() => { if (alive) c.complete(); }, 900); return; }
        paint();
      } else {
        streak = 0;
        queue.push(queue.shift());
        card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        c.wrong({ text: k.text, picked: yes ? 'passive possible' : 'no passive', answer: k.yes ? 'passive possible' : 'no passive' }, 15, k.why);
        paint();
      }
    };

    bins.addEventListener('click', (e) => {
      const b = e.target.closest('.bin');
      if (b) answer(b.dataset.yes === '1');
    });
    C.bindDrag(cardBtn, card, {
      enabled: () => alive && !c.locked(),
      targetSel: '.bin',
      onDrop: (t) => answer(t.dataset.yes === '1'),
      onTap: () => c.say('Drag the card onto a box, or press a box (← / →).')
    });
    const onKey = (e) => {
      if (!alive || screens.game.classList.contains('hidden')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); answer(true); }
      if (e.key === 'ArrowRight') { e.preventDefault(); answer(false); }
    };
    document.addEventListener('keydown', onKey);

    c.say('Is a passive sentence possible? Does the verb have an object?');
    paint();
    return {
      hint() {
        const k = cur();
        if (!k) return false;
        const b = k.yes ? binYes : binNo;
        b.classList.add('glint');
        setTimeout(() => b.classList.remove('glint'), 2600);
        return true;
      },
      destroy() { alive = false; document.removeEventListener('keydown', onKey); }
    };
  };

  /* ================= SCENE 3: The Gutter Race ================= */
  const SVGNS = 'http://www.w3.org/2000/svg';
  const scene3 = (host, c) => {
    const Q = D.s3;
    let j = 0, alive = true, curT = 0, busy = false;
    host.innerHTML = '';
    const sent = el('div', 's3-sentence');
    const opts = el('div', 's3-opts');
    host.appendChild(sent);
    host.appendChild(opts);

    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 800 230');
    svg.setAttribute('class', 's3-map');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'A paper boat floating along a gutter toward a storm drain');
    svg.innerHTML =
      '<defs><radialGradient id="s3d" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffcf4a" stop-opacity=".9"/><stop offset="1" stop-color="#d6761c" stop-opacity="0"/></radialGradient></defs>' +
      '<rect width="800" height="230" rx="10" fill="#0b1c26"/>' +
      '<path id="s3p" d="M30 175 C120 60 210 205 320 130 S520 35 610 105 S720 175 745 150" fill="none" stroke="#3f8fa8" stroke-width="22" stroke-linecap="round" opacity=".75"/>' +
      '<path d="M30 175 C120 60 210 205 320 130 S520 35 610 105 S720 175 745 150" fill="none" stroke="#bfe6f5" stroke-width="2" stroke-dasharray="3 12" opacity=".55" stroke-linecap="round" class="flow"/>' +
      '<circle cx="765" cy="148" r="42" fill="url(#s3d)" class="pulse"/>' +
      '<circle cx="765" cy="148" r="22" fill="#04080b" stroke="#3a4a54" stroke-width="5"/>' +
      '<g stroke="#3a4a54" stroke-width="4"><line x1="756" y1="132" x2="756" y2="164"/><line x1="765" y1="128" x2="765" y2="168"/><line x1="774" y1="132" x2="774" y2="164"/></g>';
    host.appendChild(svg);
    const path = svg.querySelector('#s3p');
    const len = path.getTotalLength();
    const FR = [0.12, 0.31, 0.5, 0.69, 0.88];
    FR.forEach((f, k) => {
      const p = path.getPointAtLength(len * f);
      const g = document.createElementNS(SVGNS, 'g');
      g.setAttribute('class', 's3-node');
      g.dataset.k = k;
      g.innerHTML = '<circle cx="' + p.x + '" cy="' + p.y + '" r="10" fill="#0b1c26" stroke="#f2c230" stroke-width="3"/>' +
        '<text x="' + p.x + '" y="' + (p.y + 34) + '" text-anchor="middle" font-size="13" fill="#cfd8dc">' + Q[k].place + '</text>';
      svg.appendChild(g);
    });
    const boat = document.createElementNS(SVGNS, 'g');
    boat.innerHTML = '<g class="wob"><polygon points="-22,6 22,6 15,20 -15,20" fill="#efe6cf"/><polygon points="-22,6 0,-18 0,6" fill="#f7f0dc"/><polygon points="0,-18 22,6 0,6" fill="#d8ccab"/></g>';
    svg.appendChild(boat);

    const placeBoat = (t) => {
      const p = path.getPointAtLength(len * t);
      const q = path.getPointAtLength(len * Math.min(1, t + 0.01));
      const ang = Math.max(-18, Math.min(18, Math.atan2(q.y - p.y, q.x - p.x) * 57.3 * 0.5));
      boat.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + (p.y - 6).toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
    };
    const sail = (to, ms, cb) => {
      const from = curT;
      const t0 = performance.now();
      busy = true;
      sfx.whoosh();
      const step = (now) => {
        if (!alive) return;
        const k = Math.min(1, (now - t0) / ms);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        curT = from + (to - from) * e;
        placeBoat(curT);
        if (k < 1) requestAnimationFrame(step); else { busy = false; if (cb) cb(); }
      };
      requestAnimationFrame(step);
    };
    placeBoat(FR[0]);
    curT = FR[0];

    const markNode = () => {
      svg.querySelectorAll('.s3-node').forEach((n) => n.classList.toggle('now', Number(n.dataset.k) === j));
    };

    const ask = () => {
      const q = Q[j];
      markNode();
      sent.innerHTML = '';
      sent.appendChild(el('span', 's3-place', q.place.toUpperCase()));
      sent.appendChild(document.createTextNode(q.before + ' '));
      const blank = el('span', 'blank', '   ');
      blank.id = 's3-blank';
      sent.appendChild(blank);
      sent.appendChild(document.createTextNode(' ' + q.after + ' '));
      sent.appendChild(el('span', 's3-base', '(' + q.base + ')'));
      opts.innerHTML = '';
      shuffle(q.options).forEach((o) => {
        const b = el('button', 'opt', o.t);
        b.type = 'button';
        b.dataset.t = o.t;
        b.addEventListener('click', () => choose(o, b));
        opts.appendChild(b);
      });
      c.say('Which form keeps the boat afloat?');
    };

    const choose = (o, b) => {
      if (!alive || c.locked() || busy || b.disabled) return;
      const q = Q[j];
      if (o.ok) {
        c.right();
        $('#s3-blank').textContent = o.t;
        $('#s3-blank').classList.add('filled');
        opts.querySelectorAll('.opt').forEach((x) => { x.disabled = true; });
        b.classList.add('right');
        c.say('Correct: ' + q.before + ' ' + o.t + ' ' + q.after, 'good');
        const last = j + 1 >= Q.length;
        sail(last ? 0.985 : FR[j + 1], last ? 1400 : 1000, () => {
          if (!alive) return;
          if (last) {
            boat.querySelector('.wob').classList.add('sink');
            setTimeout(() => { if (alive) c.complete(); }, 900);
          } else {
            j += 1;
            ask();
          }
        });
      } else {
        b.disabled = true;
        b.classList.add('wrong');
        const wob = boat.querySelector('.wob');
        wob.classList.remove('shake'); void wob.getBoundingClientRect(); wob.classList.add('shake');
        c.wrong({ text: q.before + ' ___ ' + q.after + ' (' + q.base + ')', picked: o.t, answer: q.answer }, 20, o.why);
      }
    };
    ask();
    return {
      hint() {
        const left = Array.from(opts.querySelectorAll('.opt')).filter((x) => !x.disabled && x.dataset.t !== Q[j].answer);
        if (!left.length) return false;
        const b = left[0];
        b.disabled = true;
        b.classList.add('wrong');
        return true;
      },
      destroy() { alive = false; }
    };
  };

  /* ================= SCENE 4: The Flashlight ================= */
  const scene4 = (host, c) => {
    const S4 = D.s4;
    const totalErr = S4.reduce((n, line) => n + line.filter((w) => typeof w === 'object').length, 0);
    let found = 0, alive = true, whisperTimer = null, wi = 0;
    host.innerHTML = '';
    const wrap = el('div', 'dark-wrap dim');
    const text = el('div', 'dark-text');
    wrap.appendChild(text);
    host.appendChild(wrap);
    const bar = el('div', 's4-bar');
    const cnt = el('span', 's4-found', '0 / ' + totalErr + ' mistakes found');
    const bright = el('button', 'btn btn-small btn-ghost', 'Brighter');
    bright.type = 'button';
    bright.setAttribute('aria-pressed', 'false');
    bar.appendChild(cnt);
    bar.appendChild(bright);
    host.appendChild(bar);
    const whisper = el('p', 'whisper');
    host.appendChild(whisper);

    const setLight = (x, y) => {
      wrap.style.setProperty('--lx', x + 'px');
      wrap.style.setProperty('--ly', y + 'px');
    };
    wrap.addEventListener('pointermove', (e) => {
      const r = wrap.getBoundingClientRect();
      setLight(e.clientX - r.left, e.clientY - r.top);
    });

    const words = [];
    S4.forEach((line) => {
      const p = el('p', 'dark-line');
      const plain = line.map((w) => (typeof w === 'object' ? w.w : w)).join(' ');
      line.forEach((w) => {
        const isErr = typeof w === 'object';
        const b = el('button', 'w', isErr ? w.w : w);
        b.type = 'button';
        if (isErr) b.dataset.err = '1';
        b.addEventListener('focus', () => {
          const r = wrap.getBoundingClientRect(), br = b.getBoundingClientRect();
          setLight(br.left - r.left + br.width / 2, br.top - r.top + br.height / 2);
        });
        b.addEventListener('click', () => {
          if (!alive || c.locked() || b.classList.contains('fixed')) return;
          if (isErr) {
            b.textContent = w.fix;
            b.classList.add('fixed');
            b.classList.remove('glint');
            found += 1;
            cnt.textContent = found + ' / ' + totalErr + ' mistakes found';
            c.right();
            c.say('Found it: “' + w.fix.replace('.', '') + '”. ' + w.why, 'good');
            if (found >= totalErr) {
              wrap.classList.remove('dim');
              setTimeout(() => { if (alive) c.complete(); }, 900);
            }
          } else {
            b.classList.remove('miss'); void b.offsetWidth; b.classList.add('miss');
            c.wrong({ text: plain, picked: w, answer: 'that word is correct' }, 12, '“' + w.replace(/[.,]/g, '') + '” is correct. Look at was / were, the past participle, and the tense.');
          }
        });
        p.appendChild(b);
        p.appendChild(document.createTextNode(' '));
        words.push(b);
      });
      text.appendChild(p);
    });

    bright.addEventListener('click', () => {
      const on = wrap.classList.toggle('dim') === false;
      bright.setAttribute('aria-pressed', String(on));
      bright.textContent = on ? 'Back to the dark' : 'Brighter';
    });

    const whisp = () => {
      if (!alive) return;
      whisper.textContent = D.s4whispers[wi % D.s4whispers.length];
      wi += 1;
      whisper.classList.remove('show'); void whisper.offsetWidth; whisper.classList.add('show');
      sfx.drip();
    };
    whisperTimer = setInterval(whisp, 9000);
    setTimeout(whisp, 2500);

    setLight(180, 70);
    c.say('Move your light over the text. Click a word you think is wrong.');
    return {
      hint() {
        const b = words.find((x) => x.dataset.err && !x.classList.contains('fixed'));
        if (!b) return false;
        b.classList.add('glint');
        const r = wrap.getBoundingClientRect(), br = b.getBoundingClientRect();
        setLight(br.left - r.left + br.width / 2, br.top - r.top + br.height / 2);
        return true;
      },
      destroy() { alive = false; clearInterval(whisperTimer); }
    };
  };

  /* ================= SCENE 5: The Interrogation ================= */
  const PROMPTS = [
    'Ask who made the boat.',
    'Ask where the boat was taken.',
    'Say what was heard in the drain.'
  ];
  const scene5 = (host, c) => {
    const K = D.s5keep, B = D.s5build;
    let a = 0, b = 0, alive = true, asm = null, part = 1;
    host.innerHTML = '';
    const head = el('div', 'deck-info');
    const title = el('span', null, '');
    head.appendChild(title);
    host.appendChild(head);
    const body = el('div', 's5-body');
    host.appendChild(body);

    const partA = () => {
      part = 1;
      const k = K[a];
      title.textContent = 'Part 1 · Sentence ' + (a + 1) + ' of ' + K.length;
      body.innerHTML = '';
      const card = el('div', 'keep-card');
      const idx = k.text.lastIndexOf(' by ');
      if (idx >= 0) {
        card.appendChild(document.createTextNode(k.text.slice(0, idx + 1)));
        card.appendChild(el('mark', null, k.text.slice(idx + 1).replace(/\.$/, '')));
        card.appendChild(document.createTextNode('.'));
      } else {
        card.textContent = k.text;
      }
      body.appendChild(card);
      body.appendChild(el('p', 'tiny', 'Should the highlighted “by …” phrase stay in the sentence?'));
      const row = el('div', 'keep-row');
      const mk = (keep, label) => {
        const x = el('button', 'btn ' + (keep ? 'btn-primary' : 'btn-ghost') + ' keepbtn', label);
        x.type = 'button';
        x.dataset.keep = keep ? '1' : '0';
        x.addEventListener('click', () => {
          if (!alive || c.locked()) return;
          if (keep === k.keep) {
            c.right();
            c.say(k.why, 'good');
            row.querySelectorAll('button').forEach((y) => { y.disabled = true; });
            setTimeout(() => {
              if (!alive) return;
              a += 1;
              if (a >= K.length) partB(); else partA();
            }, 1300);
          } else {
            c.wrong({ text: k.text, picked: keep ? 'keep by-phrase' : 'drop by-phrase', answer: k.keep ? 'keep by-phrase' : 'drop by-phrase' }, 15, k.why);
          }
        });
        row.appendChild(x);
      };
      mk(true, 'KEEP “by …”');
      mk(false, 'DROP “by …”');
      body.appendChild(row);
      c.say('Keep “by + agent” only if it is important or surprising.');
    };

    const partB = () => {
      part = 2;
      const R = B[b];
      title.textContent = 'Part 2 · Final statement ' + (b + 1) + ' of ' + B.length;
      body.innerHTML = '';
      body.appendChild(el('p', 'prompt', PROMPTS[b]));
      const asmHost = el('div');
      body.appendChild(asmHost);
      c.say('Build the sentence from the torn pieces.');
      asm = C.assembler(asmHost, {
        answer: R.answer,
        distractors: R.distractors,
        enabled: () => alive && !c.locked(),
        onHint: (t) => c.say(t),
        onRight: () => { c.right(); c.say('Correct. Keep going.', 'good'); },
        onWrong: ({ piece, why }) => c.wrong({ text: PROMPTS[b], picked: piece.text, answer: R.sentence }, 20, why),
        onDone: () => {
          c.say(R.sentence, 'good');
          setTimeout(() => {
            if (!alive) return;
            b += 1;
            if (b >= B.length) c.complete(); else partB();
          }, 1300);
        }
      });
    };

    partA();
    return {
      hint() {
        if (part === 1) {
          const k = K[a];
          const x = body.querySelector('.keepbtn[data-keep="' + (k.keep ? '1' : '0') + '"]');
          if (!x || x.disabled) return false;
          x.classList.add('glint');
          setTimeout(() => x.classList.remove('glint'), 2600);
          return true;
        }
        return asm ? asm.hint() : false;
      },
      destroy() { alive = false; }
    };
  };

  const SCENES = [scene1, scene2, scene3, scene4, scene5];

  /* ---------- Prologue (click through the frames) ---------- */
  let frameIdx = 0;
  const renderFrame = () => {
    const f = D.prologue[frameIdx];
    const art = $('#cut-art');
    art.innerHTML = A.frame(f.art);
    art.classList.remove('kb'); void art.offsetWidth; art.classList.add('kb');
    $('#cut-kicker').textContent = 'PROLOGUE · ' + (frameIdx + 1) + ' / ' + D.prologue.length + ' · ' + f.kicker;
    const t = $('#cut-text');
    t.textContent = f.text;
    t.classList.remove('fade'); void t.offsetWidth; t.classList.add('fade');
    $('#cut-dots').innerHTML = D.prologue.map((_, i) => '<i class="' + (i === frameIdx ? 'on' : '') + '"></i>').join('');
    const last = frameIdx === D.prologue.length - 1;
    $('#cut-next').textContent = last ? 'Begin →' : 'Next →';
    if (f.art === 'drain') { sfx.thunder(); flash(); }
    if (f.art === 'balloon') sfx.drip();
  };
  const showPrologue = () => {
    show('intro');
    frameIdx = 0;
    renderFrame();
    $('#cut-next').focus({ preventScroll: true });
  };
  const nextFrame = () => {
    sfx.unlock();
    if (frameIdx >= D.prologue.length - 1) { endPrologue(); return; }
    frameIdx += 1;
    renderFrame();
  };
  const endPrologue = () => {
    S.intro = true;
    save();
    if (S.scene >= TOTAL) finish(); else startScene(S.scene);
  };

  /* ---------- Final screen ---------- */
  const finish = () => {
    if (sc) { if (sc.balloons) sc.balloons.stop(); if (sc.ctrl && sc.ctrl.destroy) sc.ctrl.destroy(); sc = null; }
    S.scene = TOTAL;
    save();
    const story = $('#l2-story');
    story.innerHTML = '';
    D.story.forEach((t) => story.appendChild(el('p', 'story-line', t)));
    const stats = $('#l2-stats');
    stats.innerHTML = '';
    const starTotal = S.stars.reduce((n, x) => n + (x || 0), 0);
    [['Stars', starTotal + '/' + TOTAL * 3], ['Mistakes', S.mistakes], ['Blackouts', S.blackouts], ['Balloons popped', S.popped], ['Clippings', S.clippings + '/' + D.secrets.length]]
      .forEach(([k, v]) => { const li = el('li'); li.innerHTML = k + ': <b>' + v + '</b>'; stats.appendChild(li); });
    const log = $('#l2-log');
    log.innerHTML = '';
    if (!S.log.length) {
      log.appendChild(el('li', null, 'No mistakes recorded.'));
    } else {
      S.log.slice(0, 60).forEach((m) => {
        const li = el('li');
        li.appendChild(el('b', null, 'Scene ' + m.scene + ': '));
        li.appendChild(document.createTextNode('“' + m.text + '” — chosen: “' + m.picked + '”; correct: “' + m.answer + '”. ' + m.why));
        log.appendChild(li);
      });
    }
    show('final');
  };

  /* ---------- Skip / restart ---------- */
  const skipLevel = () => {
    if (!window.confirm('Skip the rest of Level 2?')) return;
    finish();
  };
  const restart = (withPrologue) => {
    const keepIntro = S.intro;
    S = fresh();
    S.intro = withPrologue ? false : keepIntro;
    store.clear();
    save();
    locked = false;
    if (sc) { if (sc.balloons) sc.balloons.stop(); if (sc.ctrl && sc.ctrl.destroy) sc.ctrl.destroy(); sc = null; }
    C.$('#toast').classList.add('hidden');
    setFear(0);
    if (withPrologue || !S.intro) showPrologue(); else startScene(0);
  };

  /* ---------- Wiring ---------- */
  const syncMute = () => {
    const b = $('#l2-btn-mute');
    b.textContent = 'Sound: ' + (sfx.muted ? 'off' : 'on');
    b.setAttribute('aria-pressed', String(sfx.muted));
  };
  const wire = () => {
    if (wired) return;
    wired = true;
    document.addEventListener('pointerdown', () => { if (document.body.classList.contains('l2-mode')) sfx.unlock(); }, true);
    $('#cut-next').addEventListener('click', nextFrame);
    $('#cut-art').addEventListener('click', nextFrame);
    $('#cut-skip').addEventListener('click', () => { sfx.unlock(); endPrologue(); });
    $('#l2-btn-note').addEventListener('click', () => {
      const p = $('#l2-note');
      const open = p.classList.toggle('hidden') === false;
      $('#l2-btn-note').setAttribute('aria-expanded', String(open));
    });
    $('#l2-btn-mute').addEventListener('click', () => { sfx.setMuted(!sfx.muted); syncMute(); if (!sfx.muted) sfx.ok(); });
    $('#l2-btn-skip').addEventListener('click', skipLevel);
    $('#l2-btn-restart').addEventListener('click', () => { if (window.confirm('Restart Level 2 from Scene 1?')) restart(false); });
    $('#l2-again').addEventListener('click', () => restart(false));
    $('#l2-replay').addEventListener('click', () => { S.intro = false; showPrologue(); });
  };

  const hideLevel1 = () => {
    if (window.Level1 && window.Level1.stop) window.Level1.stop();
    ['#screen-intro', '#screen-game', '#screen-final'].forEach((id) => { const n = $(id); if (n) n.classList.add('hidden'); });
    const t = $('#toast');
    if (t) t.classList.add('hidden');
  };

  const start = () => {
    hideLevel1();
    wire();
    S = store.load(fresh());
    syncMute();
    atmosphere(true);
    setFear(S.fear);
    if (!S.intro) showPrologue();
    else if (S.scene >= TOTAL) finish();
    else startScene(S.scene);
  };

  window.Level2 = { start, finish, state: () => S };
})();
