'use strict';
// The pantry (DESIGN.md 19, P6b: "give items unique effects and different amount of health that they give you"): what every food
// heals, and what some of them do besides, in one table the shops, the bag, the battle and the drops all read.
//   heal      ♥ it gives back, in a fight or from the bag (a hot meal: every heart)
//   effects   in a fight (pantry FX):
//     quick   tea, juice, soda, coffee, candy: it takes no turn, so the foes don't get to move after it
//     power   chocolate (energy), spring rolls (spicy): Mimo's next hit does +1
//     guard   cheese: the next hit on you or Mimo is blocked
//     calm    honey: angry foes calm down (an angry one hits for 2)
//     full    noodles, soup: every heart back
//     lucky   the lucky charm (the hat stall in Molinar's market, 8 coins): carried into a fight you win, it doubles the coins
//             (used up then); it isn't eaten
// Drinks are drunk, not eaten: «bebe / toma el té», «bebe o suco», «trink den Tee», «喝茶», «お茶 を 飲んで» (extra forms of v.eat,
// in battle and out). Out of a fight, the journal's Bag tab feeds Mimo: you tell it «¡Come la manzana!» (a click while it doesn't
// know «come» yet), for the hearts; the effects are for fights. The inns' keepers serve juice and tea, and rent a bed (hearts.js).
//   PANTRY.TABLE · FX · info(id) → { heal, fx, drink } · label(id, o) (English: "+2 ♥ · Quick: …") · isFood(id) · feed(id) (tests)
//   BATTLE._.items: the battle's hooks (hit, hurt, skipFoes, settle, label), called from battle/flow.js and battle/rewards.js
const PANTRY = (() => {
  const B = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = B && B._;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lang = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK && CJK.isCJK(lang());
  const fold = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  let G = null;

  // ================================================================ the table
  const FX = {
    quick: { tag: 'Quick', glyph: '⚡', what: 'it takes no turn: the foes don’t get to move after it' },
    power: { tag: 'Energy', glyph: '✊', what: 'Mimo’s next hit does +1' },
    spicy: { tag: 'Spicy', glyph: '🌶', what: 'Mimo’s next hit does +1' },
    guard: { tag: 'Sturdy', glyph: '🛡', what: 'the next hit on you or Mimo is blocked' },
    calm: { tag: 'Sweet', glyph: '🍯', what: 'angry foes calm down (an angry one hits for 2 ♥)' },
    full: { tag: 'Hot meal', glyph: '🍲', what: 'every heart back' },
    lucky: { tag: 'Lucky', glyph: '🍀', what: 'carry it into a fight: win, and your coins are doubled (then it’s used up)' },
  };
  const ALL = 99;            // (a hot meal: more than Mimo ever has, so every heart comes back)
  const TABLE = {
    'w.cookie': { heal: 1 }, 'w.apple': { heal: 1 }, 'w.pear': { heal: 1 }, 'w.orange': { heal: 2 },
    'w.candy': { heal: 1, fx: 'quick' }, 'w.chocolate': { heal: 1, fx: 'power' }, 'w.icecream': { heal: 2 },
    'w.juice': { heal: 1, fx: 'quick', drink: true }, 'w.soda': { heal: 1, fx: 'quick', drink: true },
    'w.tea': { heal: 1, fx: 'quick', drink: true }, 'w.coffee': { heal: 1, fx: 'quick', drink: true },
    'w.bread': { heal: 2 }, 'w.cheese': { heal: 2, fx: 'guard' }, 'w.honey': { heal: 2, fx: 'calm' }, 'w.fish': { heal: 2 },
    'w.cake': { heal: 4 }, 'w.jiaozi': { heal: 3 }, 'w.baozi': { heal: 2 }, 'w.wonton': { heal: 4 },
    'w.noodles': { heal: ALL, fx: 'full' }, 'w.soup': { heal: ALL, fx: 'full' },
    'w.springroll': { heal: 1, fx: 'spicy' },
    'w.charm': { heal: 0, fx: 'lucky' },
  };
  const info = id => TABLE[id] || null;
  const healOf = id => { const t = TABLE[id]; if (t) return t.heal || 0; const it = typeof SHOP !== 'undefined' && SHOP.item ? SHOP.item(id) : null; return (it && it.heal) || 0; };
  const isFood = id => healOf(id) > 0;
  const healText = h => (h >= ALL ? 'all ♥' : `+${h} ♥`);
  // "+2 ♥ · Sturdy: the next hit on you or Mimo is blocked" (o.short: "+2 ♥ · 🛡 Sturdy"; o.glyph: "+2♥ 🛡")
  function label(id, o = {}) {
    const t = TABLE[id], h = healOf(id), F = t && t.fx ? FX[t.fx] : null;
    if (!h && !F) return '';
    if (o.glyph) return [h ? (h >= ALL ? 'all♥' : `+${h}♥`) : '', F ? F.glyph : ''].filter(Boolean).join(' ');
    const parts = [];
    if (h) parts.push(healText(h));
    if (F && t.fx !== 'full') parts.push(o.short ? `${F.glyph} ${F.tag}` : `${F.tag}: ${F.what}`);
    else if (F && o.short) parts[0] = `${F.glyph} ${healText(h)}`;
    return parts.join(' · ');
  }

  // ================================================================ the shops and the battle read it
  function patchItems() {
    if (typeof SHOP !== 'undefined' && SHOP.ITEMS) for (const it of SHOP.ITEMS) { const t = TABLE[it.id]; if (t && it.heal !== t.heal) it.heal = t.heal; }
    if (_ && _.FOOD) for (const [id, t] of Object.entries(TABLE)) if (t.heal > 0 && _.FOOD[id]) _.FOOD[id].heal = t.heal;
  }
  if (typeof SHOP !== 'undefined' && SHOP.extend && !SHOP.extend._pantry) {
    const ext0 = SHOP.extend;
    SHOP.extend = function () { const r = ext0.apply(this, arguments); try { patchItems(); } catch (e) { console.error('[pantry]', e); } return r; };
    SHOP.extend._pantry = true;
  }

  // ---------------------------------------------------------------- the lucky charm: a word, a picture, the hat stall
  const CHARM = { id: 'w.charm', kind: 'word', es: 'amuleto', pt: 'amuleto', de: 'Glücksbringer', zh: '[护身符|hù shēn fú]', ja: 'お[守|まも]り', en: 'lucky charm', enPl: 'lucky charms',
    g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'amuletos', pt: 'amuletos', de: 'Glücksbringer', zh: '[护身符|hù shēn fú]', ja: 'お[守|まも]り' }, icon: 'charm',
    alt: { es: ['amuleto de la suerte'], pt: ['amuleto da sorte', 'talismã'], de: ['Talisman'], zh: ['[幸运符|xìng yùn fú]'], ja: ['おまもり'] } };
  function charmSetup() {
    if (typeof ICONS !== 'undefined' && ICONS.add && !ICONS.keys.includes('charm')) ICONS.add('charm', (c, p, h) => {
      // a four-leaf clover on a little cord
      if (p) { c.beginPath(); c.moveTo(0, -36); c.quadraticCurveTo(-10, -30, 0, -14); c.lineWidth = 2.4; c.strokeStyle = '#c0563c'; c.stroke(); }
      for (const [x, y] of [[-11, -6], [11, -6], [-11, 14], [11, 14]]) h.shape(c, p, h.ell(x, y, 12, 11), '#5cb04c');
      h.shape(c, p, h.ell(0, 4, 6, 6), '#8fd06a');
      if (p) { h.dot(c, -13, -9, 3, 'rgba(255,255,255,0.5)'); c.beginPath(); c.moveTo(0, 10); c.quadraticCurveTo(4, 24, 12, 32); c.lineWidth = 3; c.strokeStyle = '#3f7f35'; c.stroke(); h.dot(c, 0, -14, 3.4, '#f2c14e'); }
    });
    if (typeof SHOP === 'undefined' || !SHOP.extend || (SHOP.item && SHOP.item('w.charm'))) return;
    SHOP.extend({
      words: [CHARM],
      items: [['w.charm', 8, 0, 'hats']],
      goods: { es: { 'w.charm': [['amuleto', 'amuletos', 'm']] }, pt: { 'w.charm': [['amuleto', 'amuletos', 'm'], ['talismã', 'talismãs', 'm']] }, de: { 'w.charm': [['Glücksbringer', 'Glücksbringer', 'm'], ['Talisman', 'Talismane', 'm']] } },
      en: { 'w.charm': ['lucky charm', 'lucky charms'] },
      enWords: 'charm charms lucky amulet amulets talisman',
      cj: { 'w.charm': { zh: ['[护身符|hù shēn fú]', '[幸运符|xìng yùn fú]'], cl: '个', cls: ['张'], ja: ['お[守|まも]り', 'おまもり'] } },
    });
  }

  // ---------------------------------------------------------------- drinks are drunk: more forms of v.eat
  const DRINK = {
    es: { forms: ['bebe', 'toma', 'tómate', 'bébete', 'beba', 'tome'], show: 'bebe' },
    pt: { forms: ['bebe', 'toma', 'beba', 'tome'], show: 'bebe' },
    de: { forms: ['trink', 'trinke'], show: 'trink' },
    zh: { cj: [['[喝|hē]', 'ok'], ['[喝掉|hē diào]', 'ok', 'result']], show: '[喝|hē]' },
    ja: { cj: [['[飲|の]んで', 'te'], ['[飲|の]め', 'imp'], ['[飲|の]む', 'dict'], ['[飲|の]みます', 'masu']], show: '[飲|の]んで' },
  };
  const isDrink = id => !!(TABLE[id] && TABLE[id].drink);
  function drinkSetup() {
    const L = _ && _.LANGS; if (!L) return;
    for (const [l, d] of Object.entries(DRINK)) {
      const V = L[l] && L[l].verbs && L[l].verbs.eat; if (!V) continue;
      for (const f of d.forms || []) if (!V.forms.includes(f)) { V.forms.push(f); if (L[l].I && L[l].I.verbs && _.P) L[l].I.verbs.set(_.P.nrm(f), { key: 'eat', show: f }); }
      if (d.cj && V.cj) { let add = false; for (const e of d.cj) if (!V.cj.some(x => x[0] === e[0])) { V.cj.push(e); if (!V.forms.includes(e[0])) V.forms.push(e[0]); add = true; } if (add) delete L[l].CJ; }
    }
    // the overworld hears them too (the Bag's «¡Bebe el té!»)
    const it = typeof LEX !== 'undefined' && LEX.item('v.eat');
    if (it) { it.alt = it.alt || {}; for (const [l, d] of Object.entries(DRINK)) { const add = (d.forms || []).concat((d.cj || []).map(e => e[0])); it.alt[l] = Array.from(new Set([...(it.alt[l] || []), ...add])); } }
    // the eat sentence says the drink's verb for a drink («¡Bebe el té!», «喝茶！»)
    if (_.P && _.P.sayEat && !_.P.sayEat._pantry) {
      const se0 = _.P.sayEat;
      _.P.sayEat = function (Lg, food, o) {
        // (a word that's the same in the plural, a plate of «fideos», «jiaozi»: said as the plural, «¡Come los fideos!», not «el fideos»)
        if (food && Lg && !Lg.cjk && !(o && (o.pl || o.bare)) && food.pl && food.w && fold(food.pl) === fold(food.w)) o = Object.assign({}, o || {}, { pl: true });
        const s = se0.call(this, Lg, food, o);
        try {
          if (!food || !isDrink(food.id) || !Lg || !DRINK[Lg.code]) return s;
          const from = Lg.verbs.eat.show, to = DRINK[Lg.code].show;
          if (Lg.cjk) return String(s).replace(from, to);
          return String(s).replace(new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), m => (m[0] === m[0].toUpperCase() ? to.charAt(0).toUpperCase() + to.slice(1) : to));
        } catch (e) { return s; }
      };
      _.P.sayEat._pantry = true;
    }
  }
  // the sentence for feeding it (outside a fight too): «¡Come la manzana!», «Iss den Apfel!», «[喝|hē] [茶|chá] ！»
  function eatSentence(id) {
    const l = lang(), Lg = _ && _.LANGS && _.LANGS[l], it = typeof LEX !== 'undefined' && LEX.item(id);
    if (!Lg || !it || !it[l] || !_.P) return '';
    const own = (_.FOOD_WORDS || {})[id], fw = own && own[l];
    const food = { id, w: fw ? fw.w : it[l], pl: fw ? fw.pl : it.pl && it.pl[l], g: fw ? fw.g : (it.g && it.g[l]) || 'm', mass: !!(SHOP.item && SHOP.item(id) && SHOP.item(id).mass) };
    try { return _.P.sayEat(Lg, food, {}); } catch (e) { return ''; }
  }

  // ================================================================ in a fight
  const X = () => _ && _.flow;
  function pop(text, color, dy = 0.55) { const x = X(); if (!x || !x.G.running) return; x.UI.pop(x.ST.worldOf(x.A.mimo, 'top').add(new THREE.Vector3(-0.2, dy, 0)), text, x.G.t, { color: color || '#fff3a0', size: 28, rise: 0.5, life: 1.6 }); }
  function battleSetup() {
    if (!_) return;
    // per fight: what the last food left Mimo with
    if (_.tac && _.tac.beginHooks) _.tac.beginHooks.push(opts => {
      const F = X().G;
      F.p6 = { quick: false, power: 0, powerTag: '', guard: 0, charm: !F.practice && !!(opts && opts.bag && opts.bag['w.charm'] > 0) };
      F.lvHealed = 0;
    });
    // the first turn: the lucky charm says it's there
    if (_.tac && _.tac.turnHooks) _.tac.turnHooks.push(async () => {
      const x = X(), F = x.G;
      if (F.turn === 1 && F.p6 && F.p6.charm && !F.p6.charmTold) { F.p6.charmTold = true; pop('🍀 ×2 coins', '#9df0b4', 0.3); }
    });
    // eating: the effect starts (the sounds and the hearts are flow.js's)
    _.fx = _.fx || {};
    const on0 = _.fx.on;
    _.fx.on = function (ev, F) {
      if (on0) on0.call(this, ev, F);
      if (!ev || ev.type !== 'eat' || !F || F.practice || !F.p6) return;
      try { eaten(ev.id, F); } catch (e) { console.error('[pantry] eat', e); }
    };
    // the bag over the fight: each food with what it does
    if (_.UI && _.UI.bag && !_.UI.bag._pantry) {
      const bag0 = _.UI.bag;
      _.UI.bag = function (list) {
        const out = (list || []).map(x => {
          const id = 'w.' + x.key, lab = label(id), gl = label(id, { glyph: true });
          if (!lab) return x;
          const en = String(x.en || '').split(':')[0];
          return Object.assign({}, x, { en: `${en}: ${lab}`, html: `${x.html} <b class="p6-fx">${esc(gl)}</b>` });
        });
        return bag0.call(this, out);
      };
      _.UI.bag._pantry = true;
      const st = document.createElement('style');
      st.textContent = '#battle-ui .bt-food .p6-fx { font: 900 12px "Segoe UI", sans-serif; color: #c2412f; background: #fff3c4; border-radius: 7px; padding: 0 5px; margin-left: 2px; white-space: nowrap; }';
      document.head.appendChild(st);
    }
  }
  function eaten(id, F) {
    const t = TABLE[id]; if (!t || !t.fx) return;
    const x = X(), later = (s, fn) => x.wait(s).then(() => { if (F.running) fn(); });
    switch (t.fx) {
      case 'quick': F.p6.quick = true; later(1.1, () => pop('⚡ Quick! No turn used', '#ffd166')); break;
      case 'power': case 'spicy': F.p6.power++; F.p6.powerTag = t.fx === 'spicy' ? 'SPICY +1' : 'ENERGY +1'; later(1.1, () => pop(`${FX[t.fx].glyph} next hit +1`, '#ffb36b')); break;
      case 'guard': F.p6.guard = 1; later(1.1, () => pop('🛡 Sturdy: the next hit is blocked', '#9fd3ff')); break;
      case 'calm': {
        const angry = F.foes.filter(f => f.alive && !f.gone && f.states && f.states.has('angry'));
        later(1.1, () => {
          if (!angry.length) { pop('🍯 Sweet!', '#ffd166'); return; }
          for (const f of angry) { f.states.delete('angry'); x.UI.pop(x.ST.worldOf(f, 'top'), '🍯 calm', F.t, { color: '#ffd166', size: 26, rise: 0.4, life: 1.4 }); x.setMood(f, 'happy', 1.2); }
          x.refreshLabels();
        });
        break;
      }
      default: break;
    }
  }
  // the hooks flow.js and rewards.js call (each only when this file is here)
  const items = {
    // a hit's damage: a spicy or energy snack adds 1 to the next real hit (flow.js hurtAmount)
    hit(d, c) {
      const F = X() && X().G; if (!F || !F.p6 || !F.p6.power || !(d > 0) || (c && c.bounce) || F.practice) return d;
      F.p6.power--; if (c && !c.tacSub) c.tacSub = F.p6.powerTag || '+1';
      return d + 1;
    },
    // a hit on you or Mimo that landed: cheese blocks it (flow.js dodgeResult); 0 = no hearts lost
    hurt(dmg, f, tgt) {
      const x = X(), F = x && x.G; if (!F || !F.p6 || !F.p6.guard || F.practice) return dmg;
      F.p6.guard = 0;
      x.UI.pop(x.ST.worldOf(tgt, 'top'), 'BLOCKED 🛡', F.t, { color: '#9fd3ff', size: 32 });
      x.emit('block', { foe: f, kind: 'guard' });
      tgt.flash = 0.15; x.setMood(tgt, 'happy', 0.6);
      return 0;
    },
    // the foes' turn after a quick drink: they don't get one (flow.js foePhase)
    skipFoes() {
      const F = X() && X().G; if (!F || !F.p6 || !F.p6.quick) return false;
      F.p6.quick = false;
      return true;
    },
    // the coins at the end of a won fight: a lucky charm doubles them, and is used up (battle/rewards.js settle)
    settle(sum, F, why, win) {
      if (!win || !F || !F.p6 || !F.p6.charm || F.practice || !F.stats) return;
      const extra = F.stats.coins || 0; if (extra <= 0) return;
      F.stats.coins += extra; sum.coins += extra;
      F.stats.used['w.charm'] = (F.stats.used['w.charm'] || 0) + 1;
      why.push(`lucky charm ×2 +${extra}`);
      F.p6.charm = false;
    },
    // a food whose effect is worth it at full hearts (flow.js lets it go down, and its preview says what it does): "⚡ Quick"
    fightFx(id) { const t = TABLE[id]; return t && ['quick', 'power', 'spicy', 'guard', 'calm'].includes(t.fx) ? `${FX[t.fx].glyph} ${FX[t.fx].tag}` : null; },
    label, info, healOf,
  };
  if (_) _.items = items;

  // ================================================================ the journal's Bag: hearts, food, and feeding Mimo
  const S = () => (G && G.state) || null;
  function nameOf(id, n) {
    const it = typeof LEX !== 'undefined' && LEX.item(id); if (!it) return { html: esc(id), plain: id };
    const known = LEX.taught(id) || LEX.seen(id);
    if (!known || !it[lang()]) return { html: esc(n > 1 && it.enPl ? it.enPl : it.en || id), plain: it.en || id };
    if (isC()) return { html: CJK.html(LEX.src(id), { lang: lang(), cap: false }), plain: LEX.form(id) };
    const w = LEX.form(id, { pl: n > 1 });
    return { html: esc(w), plain: w };
  }
  function bagHTML(state) {
    const H = typeof HEARTS !== 'undefined' ? HEARTS : null, h = H ? H.now() : 0, m = H ? H.max() : 0, nm = esc(state.mimoName || 'Mimo');
    const bag = state.bag || {}, ids = Object.keys(bag).filter(id => bag[id] > 0);
    const foods = ids.filter(isFood).sort((a, b) => healOf(a) - healOf(b)), other = ids.filter(id => !isFood(id));
    const lo = H && H.low();
    let s = `<div class="p6-head${lo ? ' low' : ''}"><span class="p6-row">${'<i>♥</i>'.repeat(h)}${'<i class="gone">♥</i>'.repeat(Math.max(0, m - h))}</span><b>${nm}: ${h}/${m} ♥</b><span class="p6-coins">🪙 ${state.coins || 0} coins</span></div>`;
    s += `<p class="note">Hearts carry over from fight to fight. Food gives them back, in a fight or here; a bed upstairs at an inn gives them all back (2 coins). The ⚡ 🛡 🍯 ✊ 🌶 effects work in fights. You earn coins in fights (more for better sentences) and spend them at the markets, by asking for things.</p>`;
    if (!ids.length) return s + '<p class="empty">Your bag is empty.</p>';
    const verbKnown = typeof LEX !== 'undefined' && LEX.taught('v.eat');
    s += '<div class="words p6-bag">' + foods.concat(other).map(id => {
      const it = (typeof LEX !== 'undefined' && LEX.item(id)) || { en: id }, n = bag[id], nmw = nameOf(id, n), t = TABLE[id], F = t && t.fx ? FX[t.fx] : null, heal = healOf(id);
      const what = heal ? `<span class="p6-heal">${healText(heal)}</span>${F && t.fx !== 'full' ? ` <span class="p6-tag" title="${esc(F.what)}">${F.glyph} ${F.tag}</span>` : F ? ` <span class="p6-tag">${F.glyph} ${F.tag}</span>` : ''}`
        : F ? `<span class="p6-tag">${F.glyph} ${F.tag}</span>` : '';
      const why = F ? `<small class="p6-what">${t.fx === 'lucky' ? esc(FX.lucky.what) : t.fx === 'full' ? 'every heart back' : 'in a fight: ' + esc(F.what)}</small>` : '';
      const btn = heal ? (h >= m ? `<button class="p6-feed" disabled title="${nm} is full">Full ♥</button>` : `<button class="p6-feed" data-feed="${esc(id)}">${t && t.drink ? '🥤' : '🍴'} Feed ${nm}</button>`) : '';
      return `<div class="wcard taught p6-card" data-card="${esc(id)}"><canvas data-icon="${esc(it.icon || '')}" width="56" height="56"></canvas><b>${n} × ${nmw.html}</b><span>${esc(it.en || '')}</span>${what ? `<div class="p6-what-row">${what}</div>` : ''}${why}${btn}<div class="p6-form" hidden></div></div>`;
    }).join('') + '</div>';
    if (foods.length && !verbKnown) s += `<p class="note">${nm} learns «${esc(typeof LEX !== 'undefined' ? LEX.form('v.eat') : 'come')}» (eat) the first time it’s hurt in a fight with food in the bag. Until then, Feed just feeds it.</p>`;
    return s;
  }
  let css = false;
  function style() {
    if (css) return; css = true;
    const st = document.createElement('style');
    st.textContent = `.p6-head { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; padding: 8px 12px; border-radius: 14px; background: #fff; border: 2px solid rgba(43,34,53,.15); margin-bottom: 8px; font-weight: 800; }
.p6-head.low { border-color: #e2574c; background: #fff1ef; }
.p6-head .p6-row { font-size: 20px; letter-spacing: 1px; color: #e2574c; } .p6-head .p6-row .gone { color: rgba(43,34,53,.16); }
.p6-head i { font-style: normal; } .p6-head b { font-size: 16px; } .p6-coins { margin-left: auto; }
.p6-bag .wcard { gap: 3px; } .p6-what-row { font-size: 13px; font-weight: 800; }
.p6-heal { color: #c2412f; } .p6-tag { background: #fff3c4; border-radius: 8px; padding: 0 6px; white-space: nowrap; }
.p6-what { font-size: 11px !important; opacity: .75 !important; text-align: center; line-height: 1.25; }
.p6-feed { border: 2px solid var(--ink) !important; border-radius: 9px !important; background: var(--teal) !important; color: #fff; font-weight: 800; font-size: 12px !important; padding: 2px 9px !important; margin-top: 3px !important; }
.p6-feed[disabled] { background: transparent !important; color: var(--ink); opacity: .5; }
.p6-form { display: flex; flex-direction: column; gap: 4px; width: 100%; margin-top: 4px; }
.p6-form[hidden] { display: none; }
.p6-form .p6-ask { font-size: 12px; font-weight: 700; text-align: center; }
.p6-form form { display: flex; gap: 4px; } .p6-form input { flex: 1; min-width: 0; font: 600 14px "Segoe UI", sans-serif; padding: 3px 6px; border: 2px solid var(--ink); border-radius: 8px; outline: none; }
.p6-form button { border: 2px solid var(--ink); border-radius: 8px; background: var(--ink); color: var(--paper); font-weight: 800; font-size: 12px; padding: 2px 8px; margin: 0; }
.p6-form .p6-msg { font-size: 12px; min-height: 15px; text-align: center; } .p6-form .p6-msg.bad { color: #c2412f; font-weight: 700; }`;
    document.head.appendChild(st);
  }
  // Feed: Mimo knows «come» → you tell it («¡Come la manzana!»; ? shows how); it doesn't yet → it just eats
  function bagWire(el, state) {
    style();
    el.querySelectorAll('[data-feed]').forEach(b => b.onclick = () => {
      const id = b.dataset.feed, card = b.closest('.p6-card'), form = card && card.querySelector('.p6-form');
      if (typeof LEX === 'undefined' || !LEX.taught('v.eat') || !form) { feed(id, { said: eatSentence(id) }); refresh(state); return; }
      b.hidden = true; form.hidden = false;
      const model = eatSentence(id), modelPlain = isC() ? CJK.plain(model, { lang: lang() }) : model, typeHint = isC() && CJK.mode(lang()) === 'chars' ? CJK.roman(model, { lang: lang() }) : modelPlain;
      form.innerHTML = `<div class="p6-ask">Tell ${esc(state.mimoName || 'Mimo')}:</div><form><input autocomplete="off" spellcheck="false" placeholder="${esc(TABLE[id] && TABLE[id].drink ? 'drink it…' : 'eat it…')}"><button type="submit">Say it</button></form><div class="p6-msg">? = how do I say it</div>`;
      const inp = form.querySelector('input'), msg = form.querySelector('.p6-msg');
      if (typeof CJK !== 'undefined' && CJK.attachIME) try { CJK.attachIME(inp); } catch (e) { /* */ }
      inp.addEventListener('keydown', e => { if (e.isComposing || e.keyCode === 229) { e.stopPropagation(); return; } if (e.key === 'Escape') { e.preventDefault(); form.hidden = true; b.hidden = false; } e.stopPropagation(); });
      inp.addEventListener('keyup', e => e.stopPropagation());
      inp.addEventListener('focus', () => { if (typeof Input !== 'undefined') Input.typing = true; });
      inp.addEventListener('blur', () => { if (typeof Input !== 'undefined') Input.typing = false; });
      form.querySelector('form').addEventListener('submit', e => {
        e.preventDefault();
        const text = inp.value.trim(); if (!text) return;
        if (/^\s*[?？]+\s*$/.test(text)) { msg.className = 'p6-msg'; msg.innerHTML = `Try: <b>${isC() ? CJK.html(model, { lang: lang(), ruby: 'always' }) : esc(model)}</b>`; inp.value = ''; inp.placeholder = typeHint; try { UI.speak(isC() ? model : model.replace(/[¡!¿?]/g, '')); } catch (er) { /* */ } inp.focus(); return; }
        const c = feedCheck(id, text);
        if (c.ok) { try { LEX.attempt('v.eat', { ok: true, ms: 4000, mode: 'talk' }); LEX.attempt(id, { ok: true, ms: 4000, mode: 'talk' }); } catch (er) { /* */ } if (typeof Input !== 'undefined') Input.typing = false; feed(id, { said: text, typed: true }); refresh(state); return; }
        msg.className = 'p6-msg bad';
        msg.innerHTML = !c.verb ? `Say what to do: «${esc(LEX.form('v.eat'))}»${TABLE[id] && TABLE[id].drink ? ` (a drink: «${esc(isC() ? CJK.plain(DRINK[lang()].show, { lang: lang() }) : DRINK[lang()].show)}»)` : ''}. ? shows how.` : `Say what to ${TABLE[id] && TABLE[id].drink ? 'drink' : 'eat'}: «${esc(nameOf(id, 1).plain)}». ? shows how.`;
        try { Sound.play('wrong'); } catch (er) { /* */ }
        inp.select();
      });
      setTimeout(() => inp.focus(), 30);
    });
  }
  function refresh(state) { try { if (G && G.journalOpen) UI.journal(true, state); } catch (e) { /* */ } }
  // does what you typed feed it? the verb (eat or drink) and the food, anywhere in the sentence
  function feedCheck(id, text) {
    const verb = LEX.heard('v.eat', text);
    let food = LEX.heard(id, text);
    if (!food && !isC()) { const it = LEX.item(id), pl = it && it.pl && it.pl[lang()]; if (pl) food = fold(text).split(/[^\p{L}]+/u).some(w => w && w === fold(pl)); }
    return { verb, food, ok: !!(verb && food) };
  }
  // Mimo eats one, out of a fight: the hearts (the effects are for fights)
  function feed(id, o = {}) {
    const s = S(); if (!s || !s.bag || !(s.bag[id] > 0)) return false;
    const H = typeof HEARTS !== 'undefined' ? HEARTS : null, heal = healOf(id); if (!heal || !H) return false;
    s.bag[id]--; if (!s.bag[id]) delete s.bag[id];
    const got = H.heal(heal);
    try { Sound.play(TABLE[id] && TABLE[id].drink ? 'pip' : 'babble'); setTimeout(() => { try { Sound.play('review'); } catch (e) { /* */ } }, 350); } catch (e) { /* */ }
    if (G && G.sim && G.sim.mimo) G.sim.mimo.happy = 1.4;
    const nm = s.mimoName || 'Mimo', said = o.said ? `«${isC() ? CJK.plain(o.said, { lang: lang() }) : o.said}» ` : '';
    try { UI.toast(`${said}${nm} ${TABLE[id] && TABLE[id].drink ? 'drinks' : 'eats'} it: +${got} ♥ (${H.now()}/${H.max()})`); } catch (e) { /* */ }
    H.paint(true);
    if (G && G.save) G.save();
    return got;
  }

  // ================================================================ the shops' shelves: what each thing does
  function shelfHook() {
    if (typeof SHOP === 'undefined') return;
    SHOP.onPaint = SHOP.onPaint || [];
    SHOP.onPaint.push((V, els) => {
      if (!els || !els.shelf) return;
      els.shelf.querySelectorAll('.sh-item[data-id]').forEach(b => {
        const lab = label(b.dataset.id, { short: true });
        if (lab && !b.querySelector('.sh-fx')) b.insertAdjacentHTML('beforeend', `<small class="sh-fx" title="${esc(label(b.dataset.id))}">${esc(lab)}</small>`);
      });
    });
    const st = document.createElement('style');
    st.textContent = '#shop .sh-item .sh-fx { display: block; margin-top: 2px; font-size: 12px; font-weight: 800; opacity: 1; color: #c2412f; background: #fff3c4; border-radius: 8px; padding: 0 6px; }';
    document.head.appendChild(st);
  }

  // ================================================================ the inns: the keeper serves juice and tea, and rents a bed
  const INN_NAME = { es: 'La posada', pt: 'A pousada', de: 'Das Gasthaus', zh: '[客栈|kè zhàn]', ja: '[宿|やど]', en: 'The inn' };
  const INN_WHERE = { es: 'en la posada', pt: 'na pousada', de: 'im Gasthaus', zh: '[客栈|kè zhàn] [里|lǐ]', ja: '[宿|やど]', en: 'the inn' };
  const INN_WELCOME = {
    es: (c, k) => ['¡Hola! ¡Pasa, pasa! Tengo ', ...k.goods(c.stall, ' y '), '. ¿Qué te sirvo?'], pt: (c, k) => ['Olá! Pode entrar! Tenho ', ...k.goods(c.stall, ' e '), '. O que vai ser?'],
    de: (c, k) => ['Willkommen! Ich habe ', ...k.goods(c.stall, ' und '), '. Was darf’s sein?'], en: (c, k) => ['Hello! Come on in! I’ve got ', ...k.goods(c.stall, ' and '), '. What can I get you?'],
    zh: (c, k) => ['[欢迎|huān yíng] ！ [我们|wǒ men] [有|yǒu]', ...k.goods(c.stall, '[和|hé]'), '。 [您|nín] [要|yào] [什么|shén me] ？'],
    ja: (c, k) => ['いらっしゃいませ ！', ...k.goods(c.stall, 'と'), 'が あります よ 。 なに に します か ？'],
  };
  let innShop = false;
  function innStall() {
    if (innShop || typeof SHOP === 'undefined' || !SHOP.extend || !SHOP.item || !SHOP.item('w.juice') || !SHOP.item('w.tea')) return innShop;
    try {
      SHOP.extend({ stalls: { inn: { name: INN_NAME, where: INN_WHERE, welcome: INN_WELCOME, goods: ['w.juice', 'w.tea'] } } });
      innShop = true;
    } catch (e) { console.error('[pantry] inn', e); }
    return innShop;
  }
  // (the town life's corner stores and Grandma Mei's add juice and tea to the shop at their first visit: ask them first)
  function shopWords() {
    try { if (typeof TOWNLIFE !== 'undefined' && TOWNLIFE._ && TOWNLIFE._.ensureShop) TOWNLIFE._.ensureShop(); } catch (e) { /* */ }
    return innStall();
  }
  async function innKeeper(ctx) {
    const s = S(), p = ctx.person, nm = (p && p.name) || 'The innkeeper', H = typeof HEARTS !== 'undefined' ? HEARTS : null;
    const hurt = H && H.now() < H.max();
    const opts = [{ label: 'A bed for the night', sub: hurt ? `Rest upstairs: ♥ ${H.max()}/${H.max()} · 2 coins` : `${s.mimoName || 'Mimo'} isn’t tired right now (♥ ${H ? H.now() + '/' + H.max() : 'full'})`, value: 'rest' }];
    if (shopWords()) opts.push({ label: 'Something to drink', sub: 'juice or tea, ordered in the language', value: 'drink' });
    opts.push({ label: 'Just chat', value: 'chat' });
    const v = await UI.choose(`${nm}, the innkeeper`, opts);
    if (v === 'rest' && H) { await H.rest({ where: 'inn' }); return; }
    if (v === 'drink') {
      if (p) p.talking = true; s.teaching = true;
      let r = null;
      try { r = await SHOP.open({ lang: s.lang, stall: { id: 'inn', keeper: { id: 'inn_' + ((ctx.door && ctx.door.town) || 'alba'), name: nm } }, coins: s.coins || 0, bag: Object.assign({}, s.bag || {}), mimoName: s.mimoName, asked: s.shopAsked || [] }); }
      catch (e) { console.error('[pantry] inn shop', e); }
      if (r) { s.coins = r.coins; s.bag = r.bag || s.bag; if (r.asked) s.shopAsked = r.asked; }
      s.teaching = false; if (p) p.talking = false;
      if (G && G.save) G.save();
      return;
    }
    if (v === 'chat' && ctx.chat) return ctx.chat();
  }
  function innHook() {
    if (typeof INTERIORS === 'undefined' || !INTERIORS.hook) return;
    INTERIORS.hook({
      talk(ctx) {
        if (!ctx || !ctx.door || ctx.door.kind !== 'inn' || ctx.floor !== 0 || !ctx.p) return null;
        const p = ctx.p; if (!(p.job === 'wipe' || (p.def && p.def.job === 'wipe') || (p.at && p.job === undefined && /Marisa|Bernardo/.test((p.api && p.api.name) || '')))) return null;
        return () => innKeeper(Object.assign({}, ctx, { person: p.api, chat: () => INTERIORS.chat(p) }));
      },
    });
  }

  // ================================================================ setup
  try { charmSetup(); } catch (e) { console.error('[pantry] charm', e); }
  try { patchItems(); } catch (e) { console.error('[pantry]', e); }
  try { drinkSetup(); } catch (e) { console.error('[pantry] drinks', e); }
  try { battleSetup(); } catch (e) { console.error('[pantry] battle', e); }
  try { shelfHook(); } catch (e) { console.error('[pantry] shelf', e); }
  if (typeof UI !== 'undefined') UI.bagTab = { html: state => { style(); return bagHTML(state); }, wire: bagWire };
  if (typeof STORY !== 'undefined' && STORY.init && !STORY.init._pantry) {
    const init0 = STORY.init;
    STORY.init = function (game) { G = game; try { innHook(); patchItems(); } catch (e) { console.error('[pantry]', e); } return init0.apply(this, arguments); };
    STORY.init._pantry = true;
  }

  // ---------------------------------------------------------------- zh / ja: every notation string here, checked (CJK.md)
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return [];
    const out = [], chk = (where, src, l) => { const p = CJK.validate(src, l); if (p.length) out.push({ where, src, problems: p }); };
    for (const l of ['zh', 'ja']) {
      chk('charm', CHARM[l], l); (CHARM.alt[l] || []).forEach(a => chk('charm alt', a, l));
      chk('inn name', INN_NAME[l], l); chk('inn where', INN_WHERE[l], l);
      (DRINK[l].cj || []).forEach(e => chk('drink', e[0], l)); chk('drink show', DRINK[l].show, l);
    }
    return out;
  }

  return { TABLE, FX, ALL, info, label, healOf, isFood, isDrink, eatSentence, feed, feedCheck, check, items, get game() { return G; }, _: { bagHTML, innKeeper, innStall } };
})();
