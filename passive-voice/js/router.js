/* Tiny router: ?level=2 (or #level2) opens Level 2 directly. Everything else starts at Level 1. */
(() => {
  'use strict';
  let wanted = null;
  try {
    const p = new URLSearchParams(window.location.search);
    wanted = p.get('level');
  } catch (e) { /* ignore */ }
  if (!wanted && /^#level-?2$/i.test(window.location.hash)) wanted = '2';
  if (wanted === '2' && window.Level2) window.Level2.start();
})();
