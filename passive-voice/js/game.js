/* WHO DID IT? — Level 1: The Library
   Plain JS, no dependencies. Sounds are synthesised with WebAudio (no audio files). */
(() => {
  'use strict';

  const L = window.LEVEL1;
  const KEY = 'whodidit-l1-v1';
  const TOTAL = L.headlines.length;

  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const shuffle = (a) => {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [r[i], r[j]] = [r[j], r[i]];
    }
    return r;
  };
  const rand = (a, b) => a + Math.random() * (b - a);

  /* ---------- State + persistence ---------- */
  const fresh = () => ({ done: 0, fear: 0, mistakes: 0, popped: 0, clippings: 0, blackouts: 0 });
  let S = fresh();

  const load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) S = Object.assign(fresh(), JSON.parse(raw));
    } catch (e) { /* storage unavailable: play without saving */ }
  };
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
  };
  const clearSave = () => {
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  };

  /* ---------- Sound (WebAudio) ---------- */
  const sfx = (() => {
    let ctx = null;
    let muted = false;
    try { muted = localStorage.getItem(KEY + '-mute') === '1'; } catch (e) { /* ignore */ }

    const ensure = () => {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) ctx = new AC();
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    };
    const tone = (f, d, type = 'sine', v = 0.14, slide = 0, delay = 0) => {
      if (muted) return;
      const c = ensure();
      if (!c) return;
      const t = c.currentTime + delay;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.setValueAtTime(f, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, f + slide), t + d);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(v, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(c.destination);
      o.start(t);
      o.stop(t + d + 0.05);
    };
    const noise = (d, v = 0.4) => {
      if (muted) return;
      const c = ensure();
      if (!c) return;
      const len = Math.floor(c.sampleRate * d);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource();
      src.buffer = buf;
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 900;
      const g = c.createGain();
      g.gain.value = v;
      src.connect(hp).connect(g).connect(c.destination);
      src.start();
    };
    return {
      get muted() { return muted; },
      setMuted(m) {
        muted = m;
        try { localStorage.setItem(KEY + '-mute', m ? '1' : '0'); } catch (e) { /* ignore */ }
      },
      unlock: ensure,
      ok() { tone(660, 0.12, 'triangle', 0.12); tone(880, 0.18, 'triangle', 0.1, 0, 0.09); },
      bad() { tone(150, 0.28, 'sawtooth', 0.1, -70); },
      pop() { noise(0.14, 0.55); tone(240, 0.1, 'square', 0.08, -150); },
      win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.1, 0, i * 0.12)); },
      dark() { tone(70, 1.8, 'sine', 0.2, -25); tone(52, 1.8, 'sawtooth', 0.05, -10); }
    };
  })();

  /* ---------- Elements ---------- */
  const screens = { intro: $('#screen-intro'), game: $('#screen-game'), final: $('#screen-final') };
  const slotsEl = $('#slots');
  const trayEl = $('#tray');
  const fbEl = $('#feedback');
  const completeEl = $('#complete');
  const boardEl = $('#board');
  const toastEl = $('#toast');

  let current = null;   // current puzzle model
  let selectedId = null;
  let locked = false;
  let toastTimer = null;
  let balloonTimer = null;
  let balloon = null;

  const showScreen = (name) => {
    Object.entries(screens).forEach(([k, n]) => n.classList.toggle('hidden', k !== name));
    window.scrollTo(0, 0);
    if (name !== 'game') removeBalloon();
  };

  /* ---------- Fear meter ---------- */
  const setFear = (v) => {
    S.fear = Math.max(0, Math.min(100, Math.round(v)));
    $('#fear-fill').style.width = S.fear + '%';
    $('#fear-fill').style.backgroundPosition = (S.fear * 1.0) + '% 0';
    $('#fear-num').textContent = S.fear;
    $('#fear-track').setAttribute('aria-valuenow', S.fear);
    document.documentElement.style.setProperty('--fear', (S.fear / 100).toFixed(2));
    save();
  };

  const say = (text, kind) => {
    fbEl.textContent = text;
    fbEl.className = 'feedback' + (kind ? ' ' + kind : '');
  };

  const toast = (html, ms = 3600) => {
    toastEl.innerHTML = html;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add('hidden'), ms);
  };

  /* ---------- Board ---------- */
  const renderBoard = (target, flashIndex) => {
    target.innerHTML = '';
    L.headlines.forEach((h, i) => {
      const done = i < S.done;
      const n = el('div', 'note' + (done ? '' : ' blank') + (i === flashIndex ? ' new' : ''), done ? h.answer.join(' ').replace(/\s+([?.,])/g, '$1') + (h.answer[0] === 'Why' ? '?' : '.') : '?');
      target.appendChild(n);
    });
  };
  const renderClippings = () => {
    $('#clip-count').textContent = S.clippings;
    const ul = $('#clip-list');
    ul.innerHTML = '';
    L.secrets.slice(0, S.clippings).forEach((t) => ul.appendChild(el('li', null, t)));
  };

  /* ---------- Puzzle ---------- */
  const buildPuzzle = (idx) => {
    const h = L.headlines[idx];
    const pieces = h.answer.map((t, i) => ({ id: 'a' + i, text: t, slot: i, trap: null }))
      .concat(h.distractors.map((d, i) => ({ id: 'd' + i, text: d.text, slot: -1, trap: d })));
    let order = shuffle(pieces);
    // avoid a shuffle that is already the solved order
    if (order.slice(0, h.answer.length).every((p, i) => p.slot === i)) order = shuffle(pieces);
    return { idx, h, pieces: order, placed: new Array(h.answer.length).fill(null), finished: false, balloonShown: false };
  };

  const renderPuzzle = () => {
    const { h, idx } = current;
    $('#case-num').textContent = idx + 1;
    $('#case-total').textContent = TOTAL;
    completeEl.classList.add('hidden');
    selectedId = null;
    say('Drag a piece into the first slot, or click a piece and then a slot.');

    slotsEl.innerHTML = '';
    h.answer.forEach((_, i) => {
      const s = el('button', 'slot empty');
      s.type = 'button';
      s.dataset.i = i;
      s.setAttribute('aria-label', 'Slot ' + (i + 1));
      s.appendChild(el('span', 'n', String(i + 1)));
      s.addEventListener('click', () => onSlotClick(i));
      slotsEl.appendChild(s);
    });

    trayEl.innerHTML = '';
    current.pieces.forEach((p, k) => {
      const wrap = el('div', 'piece');
      wrap.dataset.id = p.id;
      const b = el('button', 'chunk t' + ((k % 4) + 1), p.text);
      b.type = 'button';
      wrap.appendChild(b);
      bindPiece(wrap, b, p);
      trayEl.appendChild(wrap);
    });
    scheduleBalloon();
  };

  const startPuzzle = () => {
    if (S.done >= TOTAL) { finish(); return; }
    current = buildPuzzle(S.done);
    locked = false;
    setFear(S.fear);
    renderBoard(boardEl);
    renderClippings();
    renderPuzzle();
  };

  const pieceEl = (id) => trayEl.querySelector('.piece[data-id="' + id + '"]');
  const findPiece = (id) => current.pieces.find((p) => p.id === id);

  const select = (id) => {
    if (locked || current.finished) return;
    sfx.unlock();
    selectedId = selectedId === id ? null : id;
    trayEl.querySelectorAll('.chunk').forEach((b) => b.classList.remove('selected'));
    if (selectedId) {
      pieceEl(selectedId).querySelector('.chunk').classList.add('selected');
      say('Now choose the slot for “' + findPiece(selectedId).text + '”.');
    }
  };

  const onSlotClick = (i) => {
    if (locked || current.finished) return;
    if (current.placed[i]) return;
    if (!selectedId) { say('Pick a torn piece first (click it), then click a slot. Or drag it.'); return; }
    place(selectedId, i);
  };

  const place = (id, i) => {
    if (locked || current.finished || current.placed[i]) return;
    const piece = findPiece(id);
    if (!piece) return;
    const slot = slotsEl.children[i];
    const pe = pieceEl(id);

    if (piece.slot === i) {
      current.placed[i] = id;
      slot.classList.remove('empty', 'shake');
      slot.classList.add('filled');
      slot.textContent = '';
      slot.appendChild(el('span', 'n', String(i + 1)));
      slot.appendChild(document.createTextNode(piece.text));
      slot.disabled = true;
      pe.classList.add('used');
      selectedId = null;
      setFear(S.fear - 5);
      sfx.ok();
      if (current.placed.every(Boolean)) {
        completeHeadline();
      } else {
        say('Correct. Keep going.', 'good');
      }
    } else {
      S.mistakes += 1;
      selectedId = null;
      trayEl.querySelectorAll('.chunk').forEach((b) => b.classList.remove('selected'));
      const chunk = pe.querySelector('.chunk');
      chunk.classList.remove('bounce');
      void chunk.offsetWidth;
      chunk.classList.add('bounce');
      slot.classList.remove('shake');
      void slot.offsetWidth;
      slot.classList.add('shake');
      setTimeout(() => { chunk.classList.remove('bounce'); slot.classList.remove('shake'); }, 450);
      sfx.bad();
      say(piece.trap ? piece.trap.why : 'Good piece, wrong place. Think about the word order of the headline.', 'bad');
      setFear(S.fear + 20);
      if (S.fear >= 100) blackout();
    }
  };

  const completeHeadline = () => {
    current.finished = true;
    removeBalloon();
    clearTimeout(balloonTimer);
    S.done += 1;
    save();
    sfx.win();
    // remove leftover traps from the tray
    trayEl.querySelectorAll('.piece:not(.used)').forEach((p) => p.classList.add('leaving'));
    setTimeout(() => trayEl.querySelectorAll('.piece.leaving').forEach((p) => p.classList.add('used')), 420);
    say('', '');
    renderBoard(boardEl, S.done - 1);
    $('#complete-note').textContent = current.h.note;
    $('#btn-next').textContent = S.done >= TOTAL ? 'Open the case file →' : 'Next headline →';
    completeEl.classList.remove('hidden');
    $('#btn-next').focus({ preventScroll: true });
  };

  /* ---------- Blackout ---------- */
  const blackout = () => {
    locked = true;
    S.blackouts += 1;
    sfx.dark();
    $('#blackout').classList.remove('hidden');
    setTimeout(() => {
      $('#blackout').classList.add('hidden');
      locked = false;
      setFear(55);
      say('The lights are back. Mr. Nobody is getting stronger — think about is / are and the past participle.', 'bad');
    }, 1900);
  };

  /* ---------- Drag & drop (pointer events: mouse, touch, pen) ---------- */
  let suppressClick = false;
  const bindPiece = (wrap, btn, piece) => {
    let sx = 0, sy = 0, pid = null, dragging = false, ghost = null, overSlot = null;

    const clearOver = () => { if (overSlot) overSlot.classList.remove('drop'); overSlot = null; };
    const cleanup = () => {
      if (ghost) { ghost.remove(); ghost = null; }
      clearOver();
      wrap.style.opacity = '';
      dragging = false;
      pid = null;
    };

    btn.addEventListener('pointerdown', (e) => {
      if (locked || current.finished) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      sx = e.clientX; sy = e.clientY; pid = e.pointerId; dragging = false;
      try { btn.setPointerCapture(pid); } catch (err) { /* ignore */ }
    });
    btn.addEventListener('pointermove', (e) => {
      if (pid === null || e.pointerId !== pid) return;
      if (!dragging && Math.hypot(e.clientX - sx, e.clientY - sy) > 8) {
        dragging = true;
        sfx.unlock();
        ghost = wrap.cloneNode(true);
        ghost.classList.add('ghost');
        ghost.style.width = wrap.offsetWidth + 'px';
        document.body.appendChild(ghost);
        wrap.style.opacity = '0.35';
      }
      if (dragging) {
        ghost.style.left = e.clientX + 'px';
        ghost.style.top = e.clientY + 'px';
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const s = under && under.closest ? under.closest('.slot.empty') : null;
        if (s !== overSlot) { clearOver(); overSlot = s; if (s) s.classList.add('drop'); }
      }
    });
    btn.addEventListener('pointerup', (e) => {
      if (pid === null || e.pointerId !== pid) return;
      if (dragging) {
        const target = overSlot;
        cleanup();
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 0);
        if (target) place(piece.id, Number(target.dataset.i));
      } else {
        cleanup();
      }
    });
    btn.addEventListener('pointercancel', cleanup);
    btn.addEventListener('click', () => { if (!suppressClick) select(piece.id); });
  };

  /* ---------- Red balloon ---------- */
  const BALLOON_SVG =
    '<svg viewBox="0 0 70 112" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M35 98 C31 104 39 106 35 112" stroke="#cfc3a6" stroke-width="1.5" fill="none"/>' +
    '<path d="M35 92 L30 100 L40 100 Z" fill="#a01c1c"/>' +
    '<ellipse cx="35" cy="48" rx="31" ry="43" fill="#d62828"/>' +
    '<ellipse cx="24" cy="30" rx="7" ry="12" fill="#ff8a80" opacity="0.55" transform="rotate(20 24 30)"/>' +
    '</svg>';

  const removeBalloon = () => {
    clearTimeout(balloonTimer);
    if (balloon) {
      cancelAnimationFrame(balloon.raf);
      balloon.node.remove();
      balloon = null;
    }
  };

  const scheduleBalloon = () => {
    removeBalloon();
    // one balloon per puzzle, appears after a short random delay
    balloonTimer = setTimeout(spawnBalloon, rand(5000, 11000));
  };

  const spawnBalloon = () => {
    if (!current || current.finished || current.balloonShown || screens.game.classList.contains('hidden')) return;
    current.balloonShown = true;
    const layer = $('#balloon-layer');
    const node = el('button', 'balloon');
    node.type = 'button';
    node.setAttribute('aria-label', 'Red balloon. Pop it.');
    node.innerHTML = BALLOON_SVG;
    layer.appendChild(node);

    const W = window.innerWidth, H = window.innerHeight;
    const dir = Math.random() < 0.5 ? 1 : -1;
    const baseY = rand(H * 0.3, H * 0.6);
    const speed = rand(34, 48);            // px per second: slow drift
    const phase = rand(0, Math.PI * 2);
    let x = dir === 1 ? -90 : W + 20;
    const t0 = performance.now();
    let last = t0;
    const b = { node, raf: 0 };
    balloon = b;

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      x += dir * speed * dt;
      const t = (now - t0) / 1000;
      const y = baseY + Math.sin(t * 0.9 + phase) * 26 - t * 4;     // gentle bob, slowly rising
      const rot = Math.sin(t * 0.7 + phase) * 7;
      node.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + rot.toFixed(1) + 'deg)';
      if ((dir === 1 && x > window.innerWidth + 40) || (dir === -1 && x < -120) || y < -140) {
        removeBalloon();
        return;
      }
      b.raf = requestAnimationFrame(frame);
    };
    b.raf = requestAnimationFrame(frame);

    node.addEventListener('click', () => {
      const r = node.getBoundingClientRect();
      popBalloon(r.left + r.width / 2, r.top + r.height * 0.45);
    });
  };

  const popBalloon = (cx, cy) => {
    removeBalloon();
    sfx.unlock();
    sfx.pop();
    S.popped += 1;
    for (let i = 0; i < 14; i++) {
      const s = el('span', 'scrap');
      s.style.left = cx + 'px';
      s.style.top = cy + 'px';
      document.body.appendChild(s);
      const ang = (Math.PI * 2 * i) / 14 + rand(-0.2, 0.2);
      const dist = rand(50, 130);
      s.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + Math.cos(ang) * dist + 'px,' + (Math.sin(ang) * dist + 40) + 'px) rotate(' + rand(120, 420) + 'deg)', opacity: 0 }
      ], { duration: rand(550, 900), easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => s.remove();
    }

    // reward
    const trapPieces = current && !current.finished
      ? current.pieces.filter((p) => p.trap && !pieceEl(p.id).classList.contains('used') && !pieceEl(p.id).classList.contains('leaving'))
      : [];
    const options = [];
    if (trapPieces.length) options.push('trim');
    if (S.fear > 0) options.push('calm');
    if (S.clippings < L.secrets.length) options.push('clip');
    const reward = options.length ? options[Math.floor(Math.random() * options.length)] : null;

    let line = '';
    if (reward === 'trim') {
      const p = trapPieces[Math.floor(Math.random() * trapPieces.length)];
      const pe = pieceEl(p.id);
      pe.classList.add('leaving');
      setTimeout(() => pe.classList.add('used'), 420);
      if (selectedId === p.id) selectedId = null;
      line = 'Bonus: one wrong piece floats away.';
    } else if (reward === 'calm') {
      setFear(S.fear - 25);
      line = 'Bonus: the fear meter drops.';
    } else if (reward === 'clip') {
      S.clippings += 1;
      renderClippings();
      line = 'Bonus: a secret clipping is added to the board.';
    }
    save();
    toast('<strong>The balloon has been popped.</strong>' + (line ? '<br>' + line : ''));
  };

  /* ---------- Finish / stats ---------- */
  const finish = () => {
    removeBalloon();
    renderBoard($('#board-final'));
    const stats = $('#stats');
    stats.innerHTML = '';
    [
      ['Mistakes', S.mistakes],
      ['Blackouts', S.blackouts],
      ['Balloons popped', S.popped],
      ['Secret clippings', S.clippings + '/' + L.secrets.length]
    ].forEach(([k, v]) => {
      const li = el('li');
      li.innerHTML = k + ': <b>' + v + '</b>';
      stats.appendChild(li);
    });
    showScreen('final');
  };

  /* ---------- Wiring ---------- */
  const startGame = () => {
    sfx.unlock();
    showScreen('game');
    startPuzzle();
  };

  const resetAll = () => {
    S = fresh();
    clearSave();
    removeBalloon();
    toastEl.classList.add('hidden');
    document.documentElement.style.setProperty('--fear', '0');
  };

  const initIntro = () => {
    const box = $('#intro-text');
    L.intro.forEach((t) => box.appendChild(el('p', null, t)));
    $('#grammar-badge').textContent = 'Grammar focus: ' + L.grammar;
    const inProgress = S.done > 0 && S.done < TOTAL;
    $('#btn-start').textContent = inProgress ? 'Continue (headline ' + (S.done + 1) + ' of ' + TOTAL + ')' : 'Start the investigation';
    $('#btn-new').classList.toggle('hidden', !(S.done > 0));
  };

  const syncMute = () => {
    const b = $('#btn-mute');
    b.textContent = 'Sound: ' + (sfx.muted ? 'off' : 'on');
    b.setAttribute('aria-pressed', String(sfx.muted));
  };

  load();
  initIntro();
  syncMute();
  setFear(S.fear);

  $('#btn-start').addEventListener('click', () => {
    if (S.done >= TOTAL) { resetAll(); }
    startGame();
  });
  $('#btn-new').addEventListener('click', () => {
    resetAll();
    initIntro();
    startGame();
  });
  $('#btn-next').addEventListener('click', () => {
    if (S.done >= TOTAL) finish(); else startPuzzle();
  });
  $('#btn-again').addEventListener('click', () => {
    resetAll();
    initIntro();
    startGame();
  });
  $('#btn-restart').addEventListener('click', () => {
    if (window.confirm('Restart Level 1 from the beginning?')) {
      resetAll();
      initIntro();
      startGame();
    }
  });
  $('#btn-mute').addEventListener('click', () => {
    sfx.setMuted(!sfx.muted);
    syncMute();
    if (!sfx.muted) sfx.ok();
  });
  $('#btn-note').addEventListener('click', () => {
    const p = $('#note-panel');
    const open = p.classList.toggle('hidden') === false;
    $('#btn-note').setAttribute('aria-expanded', String(open));
  });

  // Flashlight follows the pointer (cheap: one rAF-throttled CSS variable update)
  let ticking = false;
  window.addEventListener('pointermove', (e) => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--mx', e.clientX + 'px');
      document.documentElement.style.setProperty('--my', e.clientY + 'px');
      ticking = false;
    });
  }, { passive: true });
})();
