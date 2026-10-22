/* Original SVG illustrations for the Level 2 prologue and scene banners.
   Only places and objects (rain, houses, a paper boat, a storm drain, a balloon). No characters. */
(() => {
  'use strict';

  const rng = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const DEFS = (p) =>
    '<defs>' +
    '<linearGradient id="' + p + 'sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#071018"/><stop offset="1" stop-color="#25526a"/></linearGradient>' +
    '<linearGradient id="' + p + 'wet" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d2633"/><stop offset="1" stop-color="#06121a"/></linearGradient>' +
    '<radialGradient id="' + p + 'glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd36b" stop-opacity=".95"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="' + p + 'drain" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffcf4a" stop-opacity=".9"/><stop offset=".55" stop-color="#d6761c" stop-opacity=".35"/><stop offset="1" stop-color="#d6761c" stop-opacity="0"/></radialGradient>' +
    '<filter id="' + p + 'blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>' +
    '</defs>';

  const open = (p) => '<svg viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice" role="img" aria-label="">' + DEFS(p);
  const close = '</svg>';

  const clouds = (r, n = 6) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      s += '<ellipse cx="' + (r() * 800) + '" cy="' + (20 + r() * 90) + '" rx="' + (110 + r() * 120) + '" ry="' + (24 + r() * 22) + '" fill="#0b1b26" opacity="' + (0.5 + r() * 0.35).toFixed(2) + '"/>';
    }
    return s;
  };

  const puddles = (r, y0, y1, n, color) => {
    let s = '';
    for (let i = 0; i < n; i++) {
      const cy = y0 + r() * (y1 - y0);
      s += '<ellipse cx="' + (r() * 800) + '" cy="' + cy + '" rx="' + (30 + r() * 60) + '" ry="' + (4 + r() * 6) + '" fill="' + color + '" opacity=".45"/>';
    }
    return s;
  };

  const lamp = (x, base, h, p) =>
    '<circle cx="' + x + '" cy="' + (base - h) + '" r="46" fill="url(#' + p + 'glow)" opacity=".7"/>' +
    '<rect x="' + (x - 2) + '" y="' + (base - h) + '" width="4" height="' + h + '" fill="#0a1a23"/>' +
    '<circle cx="' + x + '" cy="' + (base - h) + '" r="6" fill="#ffe08a"/>';

  /* 1. The town in the rain */
  const town = () => {
    const r = rng(7);
    const p = 'a1';
    let s = open(p) + '<rect width="800" height="450" fill="url(#' + p + 'sky)"/>' + clouds(r);
    for (let i = 0; i < 11; i++) {
      const x = i * 78 - 10, w = 66 + r() * 18, hh = 60 + r() * 70;
      s += '<rect x="' + x + '" y="' + (300 - hh) + '" width="' + w + '" height="' + hh + '" fill="#0c2330"/>' +
        '<polygon points="' + x + ',' + (300 - hh) + ' ' + (x + w / 2) + ',' + (300 - hh - 28) + ' ' + (x + w) + ',' + (300 - hh) + '" fill="#0c2330"/>';
    }
    s += '<rect x="640" y="150" width="26" height="150" fill="#0c2330"/><polygon points="636,150 653,96 670,150" fill="#0c2330"/>'; // steeple
    for (let i = 0; i < 5; i++) {
      const x = 10 + i * 158, w = 132, hh = 110 + r() * 40, y = 345 - hh;
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" fill="#153646"/>' +
        '<polygon points="' + (x - 8) + ',' + y + ' ' + (x + w / 2) + ',' + (y - 50) + ' ' + (x + w + 8) + ',' + y + '" fill="#0a1f2a"/>';
      for (let k = 0; k < 2; k++) {
        const lit = r() > 0.3;
        const wx = x + 20 + k * 58;
        if (lit) s += '<rect x="' + (wx - 8) + '" y="' + (y + 18) + '" width="46" height="52" fill="url(#' + p + 'glow)" opacity=".55"/>';
        s += '<rect x="' + wx + '" y="' + (y + 26) + '" width="30" height="36" fill="' + (lit ? '#f2c230' : '#091a23') + '"/>' +
          '<line x1="' + (wx + 15) + '" y1="' + (y + 26) + '" x2="' + (wx + 15) + '" y2="' + (y + 62) + '" stroke="#0a1f2a" stroke-width="2"/>';
      }
      s += '<rect x="' + (x + w / 2 - 12) + '" y="' + (y + hh - 44) + '" width="24" height="44" fill="#08141b"/>';
    }
    s += '<rect y="345" width="800" height="105" fill="url(#' + p + 'wet)"/>' + puddles(r, 360, 440, 9, '#3f8fa8');
    s += lamp(400, 350, 130, p);
    s += '<ellipse cx="400" cy="400" rx="80" ry="8" fill="#ffd36b" opacity=".25"/>';
    return s + close;
  };

  /* 2. Kitchen table with a paper boat */
  const kitchen = () => {
    const r = rng(11);
    const p = 'a2';
    let s = open(p) + '<rect width="800" height="450" fill="#14232c"/>';
    s += '<rect y="0" width="800" height="300" fill="#1b3340"/>';
    for (let i = 0; i < 16; i++) s += '<rect x="' + (i * 52) + '" y="0" width="2" height="300" fill="#122630" opacity=".7"/>'; // wall boards
    // window with rain
    s += '<rect x="90" y="50" width="220" height="170" rx="6" fill="#0a1a23" stroke="#5b3a22" stroke-width="10"/>';
    for (let i = 0; i < 18; i++) {
      const x = 100 + r() * 200, y = 60 + r() * 120;
      s += '<line class="streak" x1="' + x + '" y1="' + y + '" x2="' + (x - 6) + '" y2="' + (y + 40) + '" stroke="#8cc3dc" stroke-width="2" opacity="' + (0.25 + r() * 0.4).toFixed(2) + '" stroke-linecap="round"/>';
    }
    s += '<line x1="200" y1="50" x2="200" y2="220" stroke="#5b3a22" stroke-width="6"/><line x1="90" y1="135" x2="310" y2="135" stroke="#5b3a22" stroke-width="6"/>';
    // hanging lamp
    s += '<line x1="560" y1="0" x2="560" y2="110" stroke="#0a1a23" stroke-width="3"/>' +
      '<ellipse cx="560" cy="140" rx="150" ry="120" fill="url(#' + p + 'glow)" opacity=".55"/>' +
      '<path d="M525 118 Q560 80 595 118 Z" fill="#8a4b22"/><circle cx="560" cy="122" r="9" fill="#fff0b8"/>';
    // table
    s += '<rect x="0" y="300" width="800" height="150" fill="#3b2415"/>' +
      '<rect x="0" y="300" width="800" height="14" fill="#6a4328"/>';
    for (let i = 0; i < 6; i++) s += '<line x1="0" y1="' + (330 + i * 20) + '" x2="800" y2="' + (330 + i * 20) + '" stroke="#2c1a0f" stroke-width="2"/>';
    s += '<ellipse cx="520" cy="330" rx="170" ry="18" fill="#ffd36b" opacity=".18"/>';
    // paper boat
    s += '<g transform="translate(470 235)">' +
      '<polygon points="-70,40 70,40 48,75 -48,75" fill="#efe6cf"/>' +
      '<polygon points="-70,40 0,-30 0,40" fill="#f7f0dc"/>' +
      '<polygon points="0,-30 70,40 0,40" fill="#d8ccab"/>' +
      '<line x1="0" y1="-30" x2="0" y2="40" stroke="#b9ab86" stroke-width="2"/>' +
      '<polygon points="-48,75 48,75 40,82 -40,82" fill="#bdae88"/></g>';
    s += '<ellipse cx="470" cy="322" rx="90" ry="9" fill="#000" opacity=".35"/>';
    // mug with steam
    s += '<rect x="650" y="270" width="40" height="46" rx="6" fill="#7a2f2a"/><path d="M690 282 q18 4 0 22" stroke="#7a2f2a" stroke-width="6" fill="none"/>' +
      '<path class="steam" d="M662 262 q-8 -14 0 -26 q8 -12 0 -24" stroke="#cfd8dc" stroke-width="3" fill="none" opacity=".35"/>';
    return s + close;
  };

  /* 3. The front door */
  const door = () => {
    const r = rng(5);
    const p = 'a3';
    let s = open(p) + '<rect width="800" height="450" fill="url(#' + p + 'sky)"/>';
    // porch & wall
    s += '<rect x="170" y="0" width="460" height="450" fill="#1a3a4a"/>';
    for (let i = 0; i < 9; i++) s += '<rect x="170" y="' + (i * 52) + '" width="460" height="3" fill="#122c39"/>';
    // door
    s += '<rect x="300" y="70" width="200" height="330" rx="6" fill="#5b3a22" stroke="#3a2414" stroke-width="8"/>' +
      '<rect x="326" y="98" width="148" height="84" rx="4" fill="#ffd36b" opacity=".9"/>' +
      '<line x1="400" y1="98" x2="400" y2="182" stroke="#3a2414" stroke-width="5"/><line x1="326" y1="140" x2="474" y2="140" stroke="#3a2414" stroke-width="5"/>' +
      '<rect x="330" y="210" width="62" height="150" rx="4" fill="#4a2f1b" stroke="#3a2414" stroke-width="3"/><rect x="408" y="210" width="62" height="150" rx="4" fill="#4a2f1b" stroke="#3a2414" stroke-width="3"/>' +
      '<circle cx="478" cy="270" r="9" fill="#e0b050"/>';
    // light through window glass spilling out
    s += '<polygon points="326,182 474,182 560,450 240,450" fill="#ffd36b" opacity=".12"/>';
    // porch light
    s += '<circle cx="540" cy="90" r="60" fill="url(#' + p + 'glow)" opacity=".7"/><rect x="532" y="80" width="16" height="22" rx="3" fill="#fff0b8"/>';
    // steps + wet ground + puddles
    s += '<rect x="130" y="400" width="540" height="20" fill="#2b4a5a"/><rect y="420" width="800" height="30" fill="url(#' + p + 'wet)"/>' + puddles(r, 424, 446, 6, '#3f8fa8');
    // doormat
    s += '<rect x="330" y="384" width="140" height="16" rx="3" fill="#7a2f2a"/>';
    // rain streaks in front
    for (let i = 0; i < 40; i++) {
      const x = r() * 800, y = r() * 420;
      s += '<line class="streak" x1="' + x + '" y1="' + y + '" x2="' + (x - 8) + '" y2="' + (y + 34) + '" stroke="#9ccbe0" stroke-width="1.6" opacity=".35"/>';
    }
    return s + close;
  };

  /* 4. The street river */
  const street = () => {
    const r = rng(23);
    const p = 'a4';
    let s = open(p) + '<rect width="800" height="450" fill="url(#' + p + 'sky)"/>' + clouds(r, 5);
    // houses on both sides, perspective
    for (let i = 0; i < 6; i++) {
      const t = i / 5, w = 150 - i * 18, hh = 150 - i * 16, x = 30 + i * 52 + (i * i) * 4, y = 300 - hh * 0.6 - i * 6;
      s += '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + hh + '" fill="' + (i % 2 ? '#153646' : '#112c3a') + '"/>' +
        '<polygon points="' + (x - 6) + ',' + y + ' ' + (x + w / 2) + ',' + (y - 40 + i * 4) + ' ' + (x + w + 6) + ',' + y + '" fill="#0a1f2a"/>' +
        '<rect x="' + (x + 16) + '" y="' + (y + 24) + '" width="' + (w * 0.22) + '" height="' + (hh * 0.22) + '" fill="' + (r() > 0.4 ? '#f2c230' : '#091a23') + '"/>';
      const x2 = 770 - w - i * 52 - (i * i) * 4;
      s += '<rect x="' + x2 + '" y="' + y + '" width="' + w + '" height="' + hh + '" fill="' + (i % 2 ? '#112c3a' : '#153646') + '"/>' +
        '<polygon points="' + (x2 - 6) + ',' + y + ' ' + (x2 + w / 2) + ',' + (y - 40 + i * 4) + ' ' + (x2 + w + 6) + ',' + y + '" fill="#0a1f2a"/>' +
        '<rect x="' + (x2 + w - 16 - w * 0.22) + '" y="' + (y + 24) + '" width="' + (w * 0.22) + '" height="' + (hh * 0.22) + '" fill="' + (r() > 0.4 ? '#f2c230' : '#091a23') + '"/>';
    }
    // road converging to a vanishing point
    s += '<polygon points="0,450 800,450 520,250 280,250" fill="#0a1b25"/>' +
      '<polygon points="0,450 120,450 330,250 280,250" fill="#12303f"/><polygon points="800,450 680,450 470,250 520,250" fill="#12303f"/>';
    // gutter river
    s += '<path d="M330 450 C360 380 380 330 396 250 L412 250 C430 330 450 390 500 450 Z" fill="#3f8fa8" opacity=".85"/>' +
      '<path d="M350 440 C375 380 392 320 402 258" stroke="#bfe6f5" stroke-width="2" fill="none" opacity=".5"/>' +
      '<path d="M455 440 C430 380 415 320 408 258" stroke="#bfe6f5" stroke-width="2" fill="none" opacity=".4"/>';
    // lamps
    s += lamp(250, 330, 120, p) + lamp(570, 330, 120, p) + lamp(150, 410, 190, p) + lamp(660, 410, 190, p);
    // boat
    s += '<g transform="translate(398 360) scale(.9)"><polygon points="-40,18 40,18 28,38 -28,38" fill="#efe6cf"/><polygon points="-40,18 0,-22 0,18" fill="#f7f0dc"/><polygon points="0,-22 40,18 0,18" fill="#d8ccab"/></g>' +
      '<ellipse cx="398" cy="402" rx="46" ry="6" fill="#bfe6f5" opacity=".4"/>';
    for (let i = 0; i < 38; i++) {
      const x = r() * 800, y = r() * 440;
      s += '<line class="streak" x1="' + x + '" y1="' + y + '" x2="' + (x - 7) + '" y2="' + (y + 30) + '" stroke="#9ccbe0" stroke-width="1.5" opacity=".3"/>';
    }
    return s + close;
  };

  /* 5. The storm drain */
  const drain = () => {
    const r = rng(31);
    const p = 'a5';
    let s = open(p) + '<rect width="800" height="450" fill="#07121a"/>';
    // curb and wet asphalt
    s += '<rect y="0" width="800" height="450" fill="#0d1f29"/>';
    for (let i = 0; i < 60; i++) s += '<circle cx="' + (r() * 800) + '" cy="' + (r() * 450) + '" r="' + (1 + r() * 2) + '" fill="#16313f" opacity=".6"/>';
    // glow from below
    s += '<ellipse cx="400" cy="235" rx="330" ry="190" fill="url(#' + p + 'drain)" class="pulse"/>';
    // grate opening
    s += '<ellipse cx="400" cy="235" rx="215" ry="120" fill="#04080b" stroke="#2c3b44" stroke-width="12"/>';
    s += '<ellipse cx="400" cy="235" rx="170" ry="92" fill="#e08a1c" opacity=".30" filter="url(#' + p + 'blur)"/>';
    // swirling water arcs
    s += '<path d="M240 235 a160 84 0 0 1 320 0" stroke="#7fc1d8" stroke-width="3" fill="none" opacity=".55" class="swirl"/>' +
      '<path d="M280 262 a120 62 0 0 0 240 0" stroke="#7fc1d8" stroke-width="3" fill="none" opacity=".45" class="swirl"/>';
    // grate bars
    for (let i = -4; i <= 4; i++) s += '<rect x="' + (400 + i * 38 - 6) + '" y="125" width="12" height="220" fill="#2c3b44" rx="4" transform="rotate(0)"/>';
    s += '<ellipse cx="400" cy="235" rx="215" ry="120" fill="none" stroke="#3a4a54" stroke-width="10"/>';
    // boat tipping at the edge
    s += '<g transform="translate(300 160) rotate(-24)"><polygon points="-44,18 44,18 30,40 -30,40" fill="#efe6cf"/><polygon points="-44,18 0,-26 0,18" fill="#f7f0dc"/><polygon points="0,-26 44,18 0,18" fill="#d8ccab"/></g>';
    for (let i = 0; i < 30; i++) {
      const x = r() * 800, y = r() * 440;
      s += '<line class="streak" x1="' + x + '" y1="' + y + '" x2="' + (x - 6) + '" y2="' + (y + 28) + '" stroke="#9ccbe0" stroke-width="1.4" opacity=".28"/>';
    }
    return s + close;
  };

  /* 6. A red balloon rising from the drain */
  const balloon = () => {
    const r = rng(3);
    const p = 'a6';
    let s = open(p) + '<rect width="800" height="450" fill="#06101a"/>';
    s += '<ellipse cx="400" cy="400" rx="260" ry="60" fill="url(#' + p + 'drain)" opacity=".8" class="pulse"/>';
    s += '<ellipse cx="400" cy="400" rx="130" ry="26" fill="#04080b" stroke="#2c3b44" stroke-width="8"/>';
    s += '<g class="rise"><path d="M400 330 C392 280 410 250 400 200" stroke="#cfc3a6" stroke-width="2" fill="none"/>' +
      '<path d="M400 190 L393 200 L407 200 Z" fill="#a01c1c"/>' +
      '<ellipse cx="400" cy="130" rx="62" ry="78" fill="#d62828"/>' +
      '<ellipse cx="380" cy="96" rx="12" ry="24" fill="#ff8a80" opacity=".55" transform="rotate(20 380 96)"/></g>';
    for (let i = 0; i < 40; i++) {
      const x = r() * 800, y = r() * 440;
      s += '<line class="streak" x1="' + x + '" y1="' + y + '" x2="' + (x - 6) + '" y2="' + (y + 28) + '" stroke="#9ccbe0" stroke-width="1.4" opacity=".25"/>';
    }
    return s + close;
  };

  const frames = { town, kitchen, door, street, drain, balloon };
  window.Art = { frame: (name) => (frames[name] ? frames[name]() : '') };
})();
