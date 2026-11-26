'use strict';
// Mimo's hearts between fights (DESIGN.md 19, P6b: "maintain damage endured during a fight to the next one so we have a reason
// to actually eat food"). The hearts a fight ends with are kept (state.hp) and the next fight starts with them (BATTLE.start's
// heartsNow); the most Mimo can have is its level's (battle/rewards.js heartsAt). They come back by:
//   eating    in a fight («¡Come la manzana!»), or from the bag in the journal (pantry.js): each food heals its own amount
//   resting   in a bed upstairs at an inn (Alba's, Molinar's), on the cot in Remanso's boat shed, or at Escarcha's Posada
//             (peaks.js innRest): all of them, for 2 coins (on the house when you have less)
//   a level   1 ♥ back (battle/flow.js levelUpScene; a level a fight didn't show is added here)
//   losing    the safety net: you come to where you always did (Rosa's stall, or catching your breath by a boss), with all of
//             them, and nothing lost
// A chip in the top corner shows them (♥ 6/9); low (a third or less), it turns red and pulses, and says to eat. Practice at the
// yard never costs or gives hearts. Without a game (battle-test.html) nothing changes.
//   HEARTS.now() · max() · set(n) · heal(n) → hearts gained · full() · low() · rest(o) · paint()
//   HEARTS._: { after, LOW } (tests)
const HEARTS = (() => {
  const B = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = B && B._;
  let G = null;
  const S = () => (G && G.state) || null;
  const RW = () => (_ && _.RW) || null;
  const clampN = (n, a, b) => Math.max(a, Math.min(b, n));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const name = () => { const s = S(); return (s && s.mimoName) || 'Mimo'; };
  const toast = t => { try { if (typeof UI !== 'undefined' && UI.toast) UI.toast(t); } catch (e) { /* */ } };

  // ------------------------------------------------------------ the hearts
  function max() { const rw = RW(); try { return rw ? rw.heartsAt(rw.M().lvl) : 8; } catch (e) { return 8; } }
  function now() { const s = S(), m = max(); if (!s || typeof s.hp !== 'number' || !isFinite(s.hp)) return m; return clampN(Math.round(s.hp), 0, m); }
  function set(n) { const s = S(); if (!s) return; s.hp = clampN(Math.round(+n || 0), 0, max()); paint(); }
  function heal(n) { const h0 = now(); set(h0 + Math.max(0, n)); return now() - h0; }
  const full = () => set(max());
  // low: a third of them or less (at least 2), and not full
  const LOW = (h, m) => h < m && h <= Math.max(2, Math.floor(m / 3));
  const low = () => LOW(now(), max());

  // ------------------------------------------------------------ the chip in the corner
  let chip = null, last = '', css = false;
  function style() {
    if (css) return; css = true;
    const st = document.createElement('style');
    st.textContent = `#counters .hp-chip { color: #c2412f; white-space: nowrap; transition: background .3s, color .3s; }
#counters .hp-chip b { font-size: 14px; color: #2b2235; }
#counters .hp-chip i { font-style: normal; font-size: 11px; font-weight: 900; margin-left: 5px; letter-spacing: .02em; }
#counters .hp-chip.low { background: #e2574c; color: #fff; animation: hp-pulse 1.1s ease-in-out infinite; }
#counters .hp-chip.low b { color: #fff; }
#counters .hp-chip.bump { animation: hp-bump .5s; }
@keyframes hp-pulse { 50% { transform: scale(1.07); box-shadow: 0 3px 0 rgba(43,34,53,.18), 0 0 0 5px rgba(226,87,76,.32); } }
@keyframes hp-bump { 40% { transform: scale(1.18); background: #c9f2d6; } }`;
    document.head.appendChild(st);
  }
  function chipEl() {
    if (chip) return chip;
    const box = document.getElementById('counters'); if (!box) return null;
    style();
    chip = document.createElement('span'); chip.className = 'chip hp-chip hidden'; chip.id = 'chip-hp';
    chip.title = 'Mimo’s hearts. Damage carries over from fight to fight: eat from the bag (journal → Bag) or rest in a bed at an inn to get them back.';
    box.insertBefore(chip, box.firstChild);
    return chip;
  }
  function paint(bump) {
    const el = chipEl(); if (!el) return;
    const s = S(), on = !!(s && s.flags && s.flags.hatched && ((s.flags.lessons || 0) >= 1 || typeof s.hp === 'number'));
    const h = now(), m = max(), lo = on && LOW(h, m), key = [on, h, m, lo, name()].join('|');
    if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    if (key === last) return; last = key;
    el.classList.toggle('hidden', !on); el.classList.toggle('low', lo);
    el.title = `${name()}’s hearts: ${h} of ${m}. Damage carries over from fight to fight: eat from the bag (journal → Bag) or rest in a bed at an inn to get them back.`;
    el.innerHTML = `♥ <b>${h}</b>/${m}${lo ? '<i>LOW · eat!</i>' : ''}`;
  }

  // ------------------------------------------------------------ fights: start with what you have, keep what you end with
  function wrapStart() {
    if (!B || !B.start || B.start._hp) return;
    const start0 = B.start;
    B.start = function (opts = {}) {
      const s = S(), live = !!(s && s.flags && s.flags.hatched && opts && opts.renderer && !opts.practice);
      let lv0 = null;
      if (live) {
        const h = now(), m = max();
        if (opts.heartsNow === undefined && h < m) opts.heartsNow = Math.max(1, h);
        try { lv0 = RW() ? RW().M().lvl : null; } catch (e) { lv0 = null; }
      }
      const p = start0.call(this, opts);
      if (!live || !p || typeof p.then !== 'function') return p;
      return p.then(r => { try { after(r, lv0); } catch (e) { console.error('[hearts]', e); } return r; });
    };
    B.start._hp = true;
  }
  function after(r, lv0) {
    if (!r || !r.stats) return;
    const s = S(); if (!s) return;
    const m = max();
    if (r.outcome === 'lose') {                 // the safety net: a rest, and every heart back
      set(m); s.hpLowTold = 0;
      setTimeout(() => toast(`${name()} caught its breath: ♥ ${m}/${m}. Nothing lost but the fight.`), 900);
      return;
    }
    let h = typeof r.stats.hearts === 'number' ? r.stats.hearts : now();
    const rw = RW(); let ups = 0;
    try { ups = lv0 != null && rw ? Math.max(0, rw.M().lvl - lv0) : 0; } catch (e) { ups = 0; }
    h += Math.max(0, ups - (r.stats.lvHealed || 0));         // (a level the fight's own ending didn't show: its 1 ♥ back)
    set(Math.min(m, Math.max(1, h)));
    if (low()) {
      if (!s.hpLowTold) { s.hpLowTold = 1; setTimeout(() => toast(`${name()} is down to ♥ ${now()}/${m}. Eat something from the bag (journal → Bag), or rest at an inn.`), 1400); }
    } else s.hpLowTold = 0;
  }

  // ------------------------------------------------------------ resting: a bed at an inn
  let resting = false;
  async function rest(o = {}) {
    const s = S(); if (!s || resting) return false;
    const m = max();
    if (now() >= m) { toast(`${name()} isn’t tired: ♥ ${m}/${m}. Come back after a fight.`); return false; }
    resting = true;
    const price = o.price === undefined ? 2 : o.price, pay = (s.coins || 0) >= price ? price : 0;
    try {
      if (G.sim) G.sim.lock = 1;
      await UI.fade(1, 450);
      try { Sound.play('review'); } catch (e) { /* */ }
      await new Promise(res => setTimeout(res, 650));
      if (pay) s.coins = (s.coins || 0) - pay;
      full(); s.hpLowTold = 0;
      await UI.fade(0, 600);
      if (G.sim && G.sim.mimo) G.sim.mimo.happy = 1.6;
      toast(`${o.where === 'inn' || !o.where ? 'A good rest at the inn' : o.where === 'cot' ? 'A good rest on the shed’s cot' : 'A good rest'}: ♥ ${m}/${m}${pay ? ` · −${pay} coins` : ' · on the house'}`);
      paint(true);
      if (G.save) G.save();
      // (the word for the bed, in the language: the weave says «cama» / «Bett» / 床 / ベッド)
      if (o.where === 'cot' && typeof STORY !== 'undefined' && STORY.think) STORY.think('A night in the boat shed, on a cot like a real {w.bed}… good morning!', 4.5);
    } catch (e) { console.error('[hearts] rest', e); }
    if (G.sim) G.sim.lock = 0;
    resting = false;
    return true;
  }
  // the inns' guest rooms (interiors.js: three beds along the north wall upstairs); and a word when you come in hurt
  function innHook() {
    if (typeof INTERIORS === 'undefined' || !INTERIORS.hook) return;
    INTERIORS.hook({
      extras(ctx) {
        // Remanso has no inn: the boat shed's cot (interiors.js boatShed, SW corner) is its bed, for the same 2 coins
        if (ctx && ctx.door && ctx.door.kind === 'shed' && ctx.door.town === 'remanso' && ctx.room && ctx.floor === 0) {
          const hw = ctx.room.hw || 5.75, hd = ctx.room.hd || 4;
          return [{ x: -hw + 1.07, z: hd - 2.1, r: 1.5, label: now() < max() ? 'Rest (2 coins)' : 'Rest', run: () => rest({ where: 'cot', town: 'remanso' }) }];
        }
        if (!ctx || !ctx.door || ctx.door.kind !== 'inn' || !ctx.room) return [];
        if (ctx.floor !== 1) return [];
        const hd = ctx.room.hd || 3.75, label = now() < max() ? 'Rest (2 coins)' : 'Rest';
        return [-3.4, 3.4].map(x => ({ x, z: -hd + 2.0, r: 1.35, label, run: () => rest({ where: 'inn', town: ctx.door.town }) }));     // (the outer two: a guest sits by the middle one)
      },
    });
  }
  let innTold = '';
  function innTick() {
    try {
      if (typeof INTERIORS === 'undefined' || !INTERIORS.inside || !INTERIORS.current) { innTold = ''; return; }
      const d = INTERIORS.current, id = (d && d.id) || '';
      if (!d || d.kind !== 'inn' || innTold === id) return;
      innTold = id;
      if (now() < max()) setTimeout(() => toast(`The inn: rest in a bed upstairs for ♥ ${max()}/${max()} (2 coins).`), 1600);
    } catch (e) { /* */ }
  }

  // ------------------------------------------------------------ in a fight: low, with nothing to eat
  function battleHooks() {
    const T = _ && _.tac; if (!T || !T.turnHooks) return;
    T.turnHooks.push(async () => {
      const x = _.flow, F = x && x.G; if (!F || F.turn !== 1 || F.practice || F.tutorial) return;
      if (!LOW(F.hearts, F.maxHearts) || (x.bagFoods && x.bagFoods().length)) return;
      x.UI.tip(`Only ${F.hearts} ♥ and nothing in the bag to eat. You can run (Esc) and rest at an inn, or buy food at a market.`);
    });
  }

  // ------------------------------------------------------------ setup (STORY.init: the game is there)
  if (typeof STORY !== 'undefined' && STORY.init && !STORY.init._hp) {
    const init0 = STORY.init;
    STORY.init = function (game) {
      G = game;
      try { innHook(); paint(); } catch (e) { console.error('[hearts]', e); }
      // losing in town: you wake up by Rosa's stall (main.js respawn) with every heart back (the fight's own result does it too)
      if (game && game.respawn && !game.respawn._hp) { const r0 = game.respawn; game.respawn = function () { const v = r0.apply(this, arguments); try { full(); } catch (e) { /* */ } return v; }; game.respawn._hp = true; }
      setInterval(() => { try { paint(); innTick(); } catch (e) { /* */ } }, 500);
      return init0.apply(this, arguments);
    };
    STORY.init._hp = true;
  }
  wrapStart();
  battleHooks();

  return { now, max, set, heal, full, low, rest, paint, get game() { return G; }, _: { after, LOW, esc } };
})();
