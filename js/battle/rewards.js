'use strict';
// Rewards for fighting (DESIGN.md 16: "I found myself avoiding enemies because I had no motivation to fight them"). What a fight
// gives shows on the victory card (flow.js showResult) and is kept with the save:
//   coins        per graded command (flow.js: S 3 · A 2 · B 1 · C 1, and Mimo's «Lucky ears» +1 an S), per foe beaten (2), a boss
//                (10); here: the fight's own grade (S +3 · A +1) and a kind's first win (+5). Good sentences pay.
//   drops        food from the foes, now and then (each kind its own; a boss always): into the bag, and Mimo eats it in fights
//   freed words  every Hush creature beaten lets go of a word it stole (flow.js freeWord: its picture and the word fly up out of it,
//                said aloud). Picked here from the game's words with a picture (LEX w.*), new to you first, at your level (DICT's
//                bands). It counts as seen (LEX.expose, DICT.met(…, 'heard')), never as taught. The journal keeps them.
//   XP, levels   Mimo: +4% power a level, +1 ♥ every other level (8 → 14), a perk at 3, 5, 7, 9, 12 and 15; the level-up shows
//                in the fight before the card (flow.js levelUpScene). (P6b, DESIGN.md 19: "you level up after every battle? why?
//                what does leveling up do?") A slower curve: XP per sentence S 3 · A 3 · B 2 · C 2 · D 1, per foe 3, a boss 20, a
//                first win 5; a level needs 60, 90, 120… (30 + 30 × level), so the first comes after about 4 fights and each one
//                after takes longer. The card says what the level gave (+4% power, the heart: "Mimo now has 9", the perk, 1 ♥ back:
//                hearts carry over between fights, js/hearts.js, so a level never refills them), and the Bestiary tab explains it.
//   bestiary     one entry per kind (a boss has its own): when you met it, how many you've beaten, your best fight grade; its first
//                win pays +5 coins and +5 XP. The journal's Bestiary tab shows them, each with a line about it in the language.
// State, saved by main.js with the rest: state.mimoLv { lvl, xp }, state.beasts { key: { met, won, best, first } }, state.freed
// { id: times }. The game reaches this file through STORY.init (wrapped below), so main.js needs no change; with no game
// (battle-test.html) the card still shows everything and nothing is kept.
//   _.RW.mimo() → { lvl, xp, need, hearts, power, perks } · pick(foe, G) → a freed word · settle(outcome, G) → the card's rewards
//   say(w) · wire(cardEl) (its 🔊 buttons) · PERKS, DROPS, BOSS_DROPS, LORE, journalTab · _t (tests: setLevel, state)
(() => {
  const B = (window.BATTLE = window.BATTLE || {}), _ = (B._ = B._ || {});
  let GAME = null;
  if (typeof STORY !== 'undefined' && STORY.init && !STORY.init._rw) {
    const init0 = STORY.init;
    STORY.init = function (game) { GAME = game; addTab(); return init0.apply(this, arguments); };
    STORY.init._rw = true;
  }
  const ST = () => (GAME && GAME.state) || null;
  const lang = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK && CJK.isCJK(lang());
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SCORE = { S: 4, A: 3, B: 2, C: 1, D: 0 };

  // ------------------------------------------------------------ Mimo's level
  const MAX = 20, need = l => 30 + 30 * l;              // XP from level l to the next: 60, 90, 120… (P6b: was 25, 35, 45…, a level a fight)
  const XP = { S: 3, A: 3, B: 2, C: 2, D: 1 }, XP_FOE = 3, XP_BOSS = 20, XP_FIRST = 5, COIN_FIRST = 5, COIN_FIGHT = { S: 3, A: 1 };
  const PERKS = [
    { lvl: 3, id: 'lucky', name: 'Lucky ears', what: '+1 coin for every S' },
    { lvl: 5, id: 'snack', name: 'Snack pouch', what: 'food heals 1 ♥ more' },
    { lvl: 7, id: 'bounce', name: 'Big bounce', what: 'a PERFECT jump bounces on to a second foe' },
    { lvl: 9, id: 'counter', name: 'Counter punch', what: 'a PERFECT dodge counters for 2' },
    { lvl: 12, id: 'second', name: 'Second wind', what: 'once a fight, down to 1 ♥, 2 ♥ come back' },
    { lvl: 15, id: 'hunter', name: 'Word hunter', what: 'a boss frees two more words' },
  ];
  const heartsAt = l => Math.min(14, 8 + Math.floor((l - 1) / 2));
  const powerAt = l => +(1 + 0.04 * (l - 1)).toFixed(2);
  const perksAt = l => { const o = {}; for (const p of PERKS) if (l >= p.lvl) o[p.id] = true; return o; };
  let loose = { lvl: 1, xp: 0 };                         // (no game: a level that isn't kept)
  const M = () => { const s = ST(); if (!s) return loose; const m = s.mimoLv || (s.mimoLv = { lvl: 1, xp: 0 }); m.lvl = Math.max(1, Math.min(MAX, m.lvl | 0 || 1)); m.xp = Math.max(0, +m.xp || 0); return m; };
  function mimo() {
    warm();
    const m = M();
    return { lvl: m.lvl, xp: m.xp, need: need(m.lvl), hearts: heartsAt(m.lvl), power: powerAt(m.lvl), perks: perksAt(m.lvl) };
  }
  // what one level-up gives, in words for the card and the journal (name: Mimo's; heart: whether it brings one)
  function levelGifts(l, name = 'Mimo') {
    const heart = heartsAt(l) > heartsAt(l - 1), out = [`+4% power (now ${Math.round(powerAt(l) * 100)}%)`];
    if (heart) out.unshift(`+1 ♥: ${name} now has ${heartsAt(l)} hearts`);
    const p = PERKS.find(x => x.lvl === l);
    return { text: out, perk: p || null, heart };
  }
  // the next level that brings a heart, and the next perk (for the journal)
  const nextHeart = l => { for (let k = l + 1; k <= MAX; k++) if (heartsAt(k) > heartsAt(k - 1)) return k; return null; };
  const nextPerk = l => PERKS.find(p => p.lvl > l) || null;

  // ------------------------------------------------------------ freed words
  // the game's words with a picture: w.* items (kind 'word'), with text in this language and an icon ICONS can draw
  function pool() {
    const l = lang(), out = [];
    if (typeof LEX === 'undefined' || typeof ICONS === 'undefined') return out;
    const icons = new Set(ICONS.keys);
    for (const id of LEX.ids()) {
      if (!/^w\./.test(id)) continue;
      const it = LEX.item(id);
      if (!it || (it.kind && it.kind !== 'word') || !it[l] || !it.icon || !icons.has(it.icon)) continue;
      out.push(it);
    }
    return out;
  }
  // a word's dictionary headword (DICT entries link to LEX items by .lex): its band (A1 = 1…), and where DICT.met counts it
  let HW = null, HWL = null;
  function headword(id) {
    if (typeof DICT === 'undefined' || !DICT.pack) return null;
    const l = lang();
    if (HWL !== l) {
      HW = new Map(); HWL = l;
      try { const p = DICT.pack(l); if (p && p.entries) for (const e of p.entries.values()) if (e.lex && !HW.has(e.lex)) HW.set(e.lex, e); } catch (e) { /* no pack */ }
    }
    return HW.get(id) || null;
  }
  // (the dictionary takes a moment to build the first time: do it as a fight starts, not on the first KO)
  function warm() { if (HWL !== lang()) try { headword('w.tree'); } catch (e) { /* no pack */ } }
  const FREED = () => { const s = ST(); return s ? s.freed || (s.freed = {}) : (loose.freed || (loose.freed = {})); };
  const ICON_URL = {};
  function iconURL(key) {
    if (ICON_URL[key]) return ICON_URL[key];
    try { return (ICON_URL[key] = ICONS.canvas(key, 96).toDataURL('image/png')); } catch (e) { return ''; }
  }
  // the word as shown: es / pt / de with its article («el árbol»), zh / ja in the CJK.md notation through CJK
  function wordHTML(id) {
    if (isC()) return CJK.html(LEX.src(id), { lang: lang(), cap: false });      // (a word, not a sentence: «ishi», not «Ishi»)
    return esc(LEX.form(id, { article: true }));
  }
  const sayText = id => (isC() ? LEX.src(id) : LEX.form(id, { article: true }));
  // Which word a beaten foe lets go of: one you've never met first (fresh input), then the ones seen least; never one Mimo has
  // been taught (that's not news); at your level: DICT band ≤ your word band + 1 (A1 at the start). Then it's seen and heard.
  function pick(f, G) {
    if (typeof LEX === 'undefined') return null;
    const taken = new Set((G.freed || []).map(w => w.id)), fr = FREED();
    const band = G._band || (G._band = Math.max(1, Math.min(4, (typeof DICT !== 'undefined' && DICT.wordBand ? DICT.wordBand() : 0) + 1)));
    let cands = pool().filter(it => !taken.has(it.id) && !LEX.taught(it.id)).map(it => {
      const e = headword(it.id);
      return { it, e, b: e && e.band ? e.band : 1, seen: LEX.seen(it.id) ? 1 : 0, times: fr[it.id] || 0 };
    }).filter(c => c.b <= band);
    if (!cands.length) cands = pool().filter(it => !taken.has(it.id)).map(it => ({ it, e: headword(it.id), b: 1, seen: 1, times: fr[it.id] || 0 }));     // (all taught: a review)
    if (!cands.length) return null;
    cands.sort((a, b) => (a.seen - b.seen) || (a.times - b.times) || (a.b - b.b));
    const top = cands.slice(0, Math.min(5, cands.length)), c = top[Math.floor(Math.random() * top.length)], id = c.it.id;
    LEX.expose(id);
    if (c.e && typeof DICT !== 'undefined' && DICT.met) DICT.met(c.e.id, 'heard');
    fr[id] = (fr[id] || 0) + 1;
    return { id, en: c.it.en || '', icon: c.it.icon, img: iconURL(c.it.icon), html: wordHTML(id), say: sayText(id), from: f && f.species };
  }
  // say it aloud (the game's voice for the language; the battle test page has only Sound.say)
  function say(w) {
    const t = w && (w.say || w.id); if (!t) return;
    if (typeof UI !== 'undefined' && UI.speak) UI.speak(t);
    else if (typeof Sound !== 'undefined' && Sound.say) Sound.say(isC() ? CJK.chars(t, { lang: lang() }) : t, lang());
  }
  function wire(el) {
    if (!el) return;
    el.querySelectorAll('[data-rwsay]').forEach(b => {
      b.onclick = ev => { ev.stopPropagation(); say({ id: b.dataset.rwsay, say: sayText(b.dataset.rwsay) }); };
      b.onpointerdown = ev => ev.stopPropagation();
    });
  }

  // ------------------------------------------------------------ drops: food, now and then (a boss always), into the bag
  const DROPS = {
    hushling: [['w.cookie', 0.22], ['w.apple', 0.14]], hushbig: [['w.bread', 1]], moth: [['w.pear', 0.16], ['w.honey', 0.08]], beetle: [['w.pear', 0.22]],
    armadillo: [['w.orange', 0.2], ['w.bread', 0.08]], frog: [['w.fish', 0.28]], bat: [['w.orange', 0.18]], bee: [['w.honey', 0.28]], snowball: [['w.cookie', 0.2]],
    crab: [['w.fish', 0.28]], kernel: [['w.cookie', 0.12]], popcorn: [['w.cookie', 0.12]],
  };
  const BOSS_DROPS = { armadillo: ['w.cake', 'w.honey'], hill: ['w.bread'], frog: ['w.fish', 'w.cake'], bat: ['w.orange', 'w.cake'], bee: ['w.honey', 'w.cake'], snowman: ['w.cake', 'w.cookie'], colonel: ['w.cake'] };
  const isFood = id => typeof LEX !== 'undefined' && !!LEX.item(id) && !!((_.FOOD && _.FOOD[id]) || (typeof SHOP !== 'undefined' && SHOP.item && (SHOP.item(id) || {}).heal));
  function dropsOf(G) {
    const out = {}, add = id => { if (isFood(id)) out[id] = (out[id] || 0) + 1; };
    let n = 0;
    for (const f of G.foes) {
      if (!f || f.alive || f.isBoss || (f.spec && f.spec.giant) || f.species === 'colonel' || n >= 2) continue;
      for (const [id, p] of DROPS[f.species] || []) if (Math.random() < p) { add(id); n++; break; }
    }
    const b = G.bossId && typeof G.bossId === 'string' ? G.bossId : G.boss ? 'colonel' : null;
    if (b && BOSS_DROPS[b]) BOSS_DROPS[b].forEach(add);
    return out;
  }

  // ------------------------------------------------------------ the bestiary
  // one entry per kind; a boss (a giant one, the hill's big Hushling, the colonel) is its own
  function beastKey(f) {
    if (f.isBoss || (f.spec && (f.spec.giant || f.spec.queen))) return 'boss:' + f.species;
    return f.species;
  }
  const BEASTS = () => { const s = ST(); return s ? s.beasts || (s.beasts = {}) : (loose.beasts || (loose.beasts = {})); };
  function fightGrade(G) {
    const log = (G.stats && G.stats.gradeLog) || [];
    if (!log.length) return null;
    const avg = log.reduce((a, x) => a + SCORE[x.grade], 0) / log.length;
    return ['D', 'C', 'B', 'A', 'S'][Math.max(0, Math.min(4, Math.floor(avg + 0.4)))];
  }

  // ------------------------------------------------------------ settling a fight
  // Runs once a fight, before its card (flow.js showResult) or as it ends (a flight: the bestiary only). Adds the bonus coins to
  // G.stats.coins (main.js pays them out with the rest), drops into the bag, XP to Mimo, and returns what the card shows.
  function settle(outcome, G) {
    const win = outcome === 'win', played = win || outcome === 'lose';
    const sum = { outcome, coins: 0, drops: {}, xp: 0, lvlBefore: M().lvl, lvlAfter: M().lvl, newBeasts: [], firstWins: [], freed: (G.freed || []).map(w => w.id) };
    const grade = fightGrade(G), beasts = BEASTS(), kinds = new Map();
    for (const f of G.foes) {
      if (!f || f.species === 'dummy') continue;
      const key = beastKey(f), k = kinds.get(key) || { key, species: f.species, beaten: 0, color: f.color, boss: key.startsWith('boss:') };
      if (!f.alive || f.calmed) k.beaten++;
      if (f.befriended) k.friends = (k.friends || 0) + 1;     // (talked down: battle/tactics.js, or a shy one calmed)
      kinds.set(key, k);
    }
    for (const k of kinds.values()) {
      let b = beasts[k.key];
      if (!b) { b = beasts[k.key] = { met: Date.now(), won: 0, best: null }; sum.newBeasts.push(k.key); }
      b.won += k.beaten;
      if (k.friends) b.friends = (b.friends || 0) + k.friends;
      if (win && grade && (!b.best || SCORE[grade] > SCORE[b.best])) b.best = grade;
      if (win && k.beaten && !b.first) { b.first = Date.now(); sum.firstWins.push(k.key); }
    }
    if (!played) return { summary: sum };
    // coins: the fight's grade, and first wins (the rest was earned during the fight)
    const coinWhy = [];
    if (win && COIN_FIGHT[grade]) { sum.coins += COIN_FIGHT[grade]; coinWhy.push(`fight ${grade} +${COIN_FIGHT[grade]}`); }
    if (sum.firstWins.length) { sum.coins += COIN_FIRST * sum.firstWins.length; coinWhy.push(`first win${sum.firstWins.length > 1 ? 's' : ''} +${COIN_FIRST * sum.firstWins.length}`); }
    G.stats.coins += sum.coins;
    if (_.items && _.items.settle) try { _.items.settle(sum, G, coinWhy, win); } catch (e) { console.error('[rewards] items', e); }     // (a lucky charm doubles the coins: js/pantry.js)
    // drops (a win only)
    if (win) {
      sum.drops = dropsOf(G);
      const s = ST();
      if (s) { s.bag = s.bag || {}; for (const [id, n] of Object.entries(sum.drops)) s.bag[id] = (s.bag[id] || 0) + n; }
    }
    // XP: every graded sentence (better ones more), every foe beaten, a boss, first wins; half of the sentences' when you lose
    const said = (G.stats.gradeLog || []).reduce((a, x) => a + (XP[x.grade] || 0), 0);
    const beaten = G.foes.filter(f => f && (!f.alive || f.calmed) && f.species !== 'dummy').length;
    const boss = win && (G.bossId || G.boss) ? XP_BOSS : 0;
    sum.xp = win ? said + beaten * XP_FOE + boss + XP_FIRST * sum.firstWins.length : Math.round(said / 2);
    const m = M(), before = { lvl: m.lvl, xp: m.xp };
    m.xp += sum.xp;
    const ups = [];
    while (m.lvl < MAX && m.xp >= need(m.lvl)) { m.xp -= need(m.lvl); m.lvl++; ups.push(m.lvl); }
    if (m.lvl >= MAX) m.xp = Math.min(m.xp, need(MAX));
    sum.lvlAfter = m.lvl;
    return { summary: sum, coinWhy, levelUps: ups, lvlAfter: m.lvl, heartsAfter: heartsAt(m.lvl), html: cardHTML(sum, before, m, ups, G) };
  }

  // ------------------------------------------------------------ the card
  // (P6b: each level's gifts as a list, the XP still to go, and what a dropped food does)
  if (typeof document !== 'undefined' && !document.getElementById('rw-p6b-css')) {
    const st = document.createElement('style'); st.id = 'rw-p6b-css';
    st.textContent = `#battle-ui .bt-result .rw-gifts { margin: 3px 0 0; padding-left: 20px; font-size: 14px; font-weight: 800; line-height: 1.45; } #battle-ui .bt-result .rw-gifts li::marker { color: #b8650f; }
#battle-ui .bt-result .rw-next { margin-top: 3px; font-size: 13px; font-weight: 700; opacity: .65; text-align: right; }
#battle-ui .bt-result .rw-fx { font-size: 12px; font-weight: 900; color: #c2412f; background: #fff3c4; border-radius: 7px; padding: 0 5px; }`;
    document.head.appendChild(st);
  }
  const plain = html => String(html).replace(/<rt>[^<]*<\/rt>/g, '').replace(/<[^>]+>/g, '');
  function speciesWord(sp, withArt = true) {
    const L = _.LANGS && _.LANGS[lang()], S = L && L.species && L.species[sp];
    if (!S) return null;
    if (L.cjk) return S.w;
    if (!withArt) return S.w;
    const A = { es: { m: 'el', f: 'la' }, pt: { m: 'o', f: 'a' }, de: { m: 'der', f: 'die', n: 'das' } }[lang()] || {};
    return `${A[S.g] || ''} ${S.w}`.trim();
  }
  const showLang = (s, cap) => (isC() && /\[[^\]|]+\||[ぁ-ヿ㐀-鿿]/.test(s) ? CJK.html(s, { lang: lang(), cap: !!cap }) : esc(s));
  // A kind's portrait: the battle's own drawing (battle/ui.js ICON: an SVG, which as an image needs its namespace), else the
  // game's word picture (icons.js: the bat, the bee, the snowball, the crab), else a plain Hushling. Made once per kind.
  const BEAST_URL = {};
  function beastURL(sp) {
    if (BEAST_URL[sp]) return BEAST_URL[sp];
    const I = _.UI && _.UI.ICON, svgURL = v => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(/xmlns=/.test(v) ? v : v.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"'))}`;
    const draw = k => { const v = I && (typeof I[k] === 'function' ? I[k]() : I[k]); return typeof v === 'string' && v.startsWith('<svg') ? svgURL(v) : ''; };
    let url = draw(sp === 'hushbig' ? 'hushling' : sp);
    if (!url && typeof ICONS !== 'undefined' && ICONS.keys.includes(sp)) url = iconURL(sp);
    if (!url) url = draw('hushling');
    return (BEAST_URL[sp] = url);
  }
  function beastImg(key) { const url = beastURL(key.replace(/^boss:/, '')); return url ? `<img src="${url}" alt="">` : ''; }
  const KIND_EN = { hushling: 'hushling', hushbig: 'big hushling', moth: 'moth', beetle: 'beetle', armadillo: 'armadillo', frog: 'frog', bat: 'echo bat', bee: 'picky bee', snowball: 'snowball', crab: 'crab', kernel: 'kernel soldier', popcorn: 'popcorn', colonel: 'Colonel Cob' };
  const beastName = key => { const sp = key.replace(/^boss:/, ''), w = speciesWord(sp); return { w: w ? showLang(w) : esc(KIND_EN[sp] || sp), en: (key.startsWith('boss:') ? 'giant ' : '') + (KIND_EN[sp] || sp) }; };
  function cardHTML(sum, before, m, ups, G) {
    let h = '';
    // drops
    const drops = Object.entries(sum.drops);
    if (drops.length) {
      h += `<div class="rw"><span class="lbl">Dropped</span><div class="rw-drops">` + drops.map(([id, n]) => {
        const it = LEX.item(id) || {};
        const lab = _.items && _.items.label ? _.items.label(id) : _.FOOD && _.FOOD[id] ? `heals ${_.FOOD[id].heal} ♥` : '';     // (what it does: js/pantry.js)
        return `<span title="${esc(it.en || '')}${lab ? ` · ${esc(lab)}` : ''}"><img src="${iconURL(it.icon || id.slice(2))}" alt="">${wordHTML(id)}${n > 1 ? ` ×${n}` : ''}${lab && _.items ? ` <small class="rw-fx">${esc(_.items.label(id, { short: true }))}</small>` : ''}</span>`;
      }).join('') + `<small>into your bag: ${esc(G.name)} eats it in fights, or from the bag (journal → Bag)</small></div></div>`;
    }
    // XP and the level: the bar, then what each new level gave, line by line (P6b)
    const k = ups.length ? 0 : before.xp / need(before.lvl), k2 = m.xp / need(m.lvl);
    h += `<div class="rw"><div class="rw-xp"><span>${esc(G.name)} · Lv ${m.lvl}</span><div class="rw-bar"><i style="width:${Math.round(100 * Math.min(k, k2))}%"></i>`
      + `<b style="left:${Math.round(100 * Math.min(k, k2))}%;width:${Math.round(100 * Math.max(0, k2 - k))}%"></b></div><span>+${sum.xp} XP</span></div>`;
    for (const l of ups) {
      const g = levelGifts(l, G.name);
      h += `<div class="rw-lvl"><b>Level up! Lv ${l}</b><ul class="rw-gifts">${g.text.map(t => `<li>${esc(t)}</li>`).join('')}`
        + (g.perk ? `<li>New perk: <b>${esc(g.perk.name)}</b> (${esc(g.perk.what)})</li>` : '')
        + `<li>1 ♥ back${g.heart ? ' (the new heart comes in empty)' : ''}: eat or rest for the rest</li></ul></div>`;
    }
    if (!ups.length && m.lvl < MAX) h += `<div class="rw-next">${need(m.lvl) - m.xp} XP to Lv ${m.lvl + 1}</div>`;
    h += '</div>';
    // freed words: the picture, the word, the English, and its sound
    const freed = G.freed || [];
    if (freed.length) {
      h += `<div class="rw"><span class="lbl">Words the Hush let go</span><div class="rw-words">` + freed.map(w => `<div class="rw-word"><img src="${w.img}" alt=""><span><b>${w.html}</b><small>${esc(w.en)}</small></span><button data-rwsay="${esc(w.id)}" title="Hear it">🔊</button></div>`).join('')
        + `</div><small>Kept in the journal (Bestiary). They’ll start turning up in what people say.</small></div>`;
    }
    // the bestiary
    const news = [...new Set(sum.newBeasts.concat(sum.firstWins))];
    if (news.length) {
      h += '<div class="rw">' + news.map(key => {
        const n = beastName(key), isNew = sum.newBeasts.includes(key), first = sum.firstWins.includes(key);
        return `<div class="rw-beast">${beastImg(key)}${isNew ? '<span class="new">new</span>' : ''}<span>${isNew ? 'In the bestiary: ' : ''}<b>«${n.w}»</b> (${esc(n.en)})${first ? ` · first win: +${COIN_FIRST} coins, +${XP_FIRST} XP` : ''}</span></div>`;
      }).join('') + '</div>';
    }
    return h;
  }

  // ------------------------------------------------------------ the journal's Bestiary tab (filled in below)
  let tabAdded = false;
  function addTab() {
    if (tabAdded || typeof UI === 'undefined' || !_.RW || !_.RW.journalTab) return;
    tabAdded = true; UI.journalTabs = UI.journalTabs || []; UI.journalTabs.push(_.RW.journalTab);
  }

  _.RW = {
    mimo, pick, say, wire, settle, levelGifts, heartsAt, powerAt, perksAt, need, beastKey, beastImg, beastURL, beastName, speciesWord, showLang, iconURL, wordHTML,
    PERKS, DROPS, BOSS_DROPS, XP, XP_FOE, XP_BOSS, XP_FIRST, MAX, nextHeart, nextPerk, KIND_EN, addTab, get game() { return GAME; }, BEASTS, FREED, M, plain,
    _t: { setLevel(l, xp = 0) { const m = M(); m.lvl = l; m.xp = xp; return mimo(); }, state: () => ({ mimoLv: Object.assign({}, M()), beasts: JSON.parse(JSON.stringify(BEASTS())), freed: Object.assign({}, FREED()) }), pool, headword },
  };
})();

// ================================================================ the journal's Bestiary tab
// Mimo's level, hearts, power and perks; every creature you've met, each with a short line about it in the language (the English
// under it, 🔊 to hear it: more comprehensible input, built from battle words you know); and every word the Hush let go of.
(() => {
  const _ = window.BATTLE._, RW = _.RW;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lang = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = () => typeof CJK !== 'undefined' && CJK.isCJK && CJK.isCJK(lang());
  // one line per kind: [es, pt, de, zh, ja, en] (zh / ja in the CJK.md notation)
  const LORE = {
    hushling: ['El calladito roba palabras. ¡Habla, y se va!', 'O caladinho rouba palavras. Fale, e ele vai embora!', 'Der Schweigling stiehlt Wörter. Sprich, und er geht!',
      '[小默默|xiǎo mò mò] [偷|tōu] [词语|cí yǔ] 。 [说话|shuō huà] ， [它|tā] [就|jiù] [走|zǒu] ！', 'だまりっこ は [言葉|ことば] を ぬすむ 。 [話|はな]せば 、 いなく なる ！', 'The hushling steals words. Talk, and it goes away!'],
    hushbig: ['El calladón es muy grande. Su punto débil brilla.', 'O caladão é muito grande. O ponto fraco dele brilha.', 'Der Riesenschweigling ist sehr groß. Sein Schwachpunkt leuchtet.',
      '[大默默|dà mò mò] [很|hěn] [大|dà] 。 [它|tā] [的|de] [弱点|ruò diǎn] [会|huì] [发光|fā guāng] 。', '[大|おお]だまりっこ は とても [大|おお]きい 。 [弱点|じゃくてん] が [光|ひか]る 。', 'The big hushling is very big. Its weak spot glows.'],
    moth: ['La polilla flota. ¡Salta, o golpea las alas!', 'A mariposa flutua. Pula, ou bate nas asas!', 'Die Motte schwebt. Spring, oder schlag auf die Flügel!',
      '[蛾子|é zi] [会|huì] [飞|fēi] 。 [跳|tiào] ， [或者|huò zhě] [打|dǎ] [翅膀|chì bǎng] ！', '[蛾|が] は [浮|う]いて いる 。 [跳|と]んで 、 [羽|はね] を [打|う]って ！', 'The moth floats. Jump, or hit its wings!'],
    beetle: ['El escarabajo tiene un caparazón duro. ¡Golpea la cabeza!', 'O besouro tem um casco duro. Bate na cabeça!', 'Der Käfer hat einen harten Panzer. Schlag auf den Kopf!',
      '[甲虫|jiǎ chóng] [的|de] [壳|ké] [很|hěn] [硬|yìng] 。 [打|dǎ] [头|tóu] ！', 'カブトムシ の [甲羅|こうら] は かたい 。 [頭|あたま] を [打|う]って ！', 'The beetle has a hard shell. Hit its head!'],
    armadillo: ['El armadillo se hace bolita. ¡Empújalo!', 'O tatu vira uma bolinha. Empurra ele!', 'Das Gürteltier rollt sich zu einer Kugel. Schieb es!',
      '[犰狳|qiú yú] [会|huì] [缩成|suō chéng] [一个|yī gè] [球|qiú] 。 [推|tuī] [它|tā] ！', 'アルマジロ は ボール に なる 。 [押|お]して ！', 'The armadillo rolls up into a ball. Push it!'],
    frog: ['La rana salta de hoja en hoja.', 'O sapo pula de folha em folha.', 'Der Frosch hüpft von Blatt zu Blatt.',
      '[青蛙|qīng wā] [在|zài] [荷叶|hé yè] [上|shàng] [跳来跳去|tiào lái tiào qù] 。', 'カエル は [葉|は]っぱ から [葉|は]っぱ へ [跳|と]ぶ 。', 'The frog hops from pad to pad.'],
    bat: ['El murciélago repite lo que dices.', 'O morcego repete o que você fala.', 'Die Fledermaus wiederholt, was du sagst.',
      '[蝙蝠|biān fú] [会|huì] [学|xué] [你|nǐ] [说话|shuō huà] 。', 'コウモリ は あなた の [言葉|ことば] を まねる 。', 'The bat repeats what you say.'],
    bee: ['A la abeja le gustan las flores.', 'A abelha gosta de flores.', 'Die Biene mag Blumen.',
      '[蜜蜂|mì fēng] [喜欢|xǐ huan] [花|huā] 。', 'ハチ は [花|はな] が [好|す]き 。', 'The bee likes flowers.'],
    snowball: ['La bola de nieve crece y crece.', 'A bola de neve cresce e cresce.', 'Der Schneeball wird immer größer.',
      '[雪球|xuě qiú] [越来越|yuè lái yuè] [大|dà] 。', '[雪玉|ゆきだま] は どんどん [大|おお]きく なる 。', 'The snowball grows and grows.'],
    kernel: ['El grano es un soldado del Coronel.', 'O grão é um soldado do Coronel.', 'Das Korn ist ein Soldat des Obersts.',
      '[玉米粒|yù mǐ lì] [是|shì] [上校|shàng xiào] [的|de] [士兵|shì bīng] 。', 'コーン は [大佐|たいさ] の [兵|へい] だ 。', 'The kernel is one of the Colonel’s soldiers.'],
    popcorn: ['¡Pop! El grano caliente es una palomita.', 'Pop! O grão quente vira pipoca.', 'Pop! Ein heißes Korn wird zu Popcorn.',
      '[砰|pēng] ！ [热|rè] [玉米粒|yù mǐ lì] [变成|biàn chéng] [爆米花|bào mǐ huā] 。', 'ポン ！ [熱|あつ]い コーン は ポップコーン に なる 。', 'Pop! A hot kernel turns into popcorn.'],
    colonel: ['El Coronel Mazorca protege a su gente.', 'O Coronel Espiga protege o povo dele.', 'Oberst Kolben beschützt seine Leute.',
      '[玉米棒|yù mǐ bàng] [上校|shàng xiào] [保护|bǎo hù] [他|tā] [的|de] [人|rén] 。', 'トウモロコシ [大佐|たいさ] は みんな を [守|まも]る 。', 'Colonel Cob protects his people.'],
    crab: ['El cangrejo camina de lado.', 'O caranguejo anda de lado.', 'Die Krabbe läuft seitwärts.',
      '[螃蟹|páng xiè] [横着|héng zhe] [走|zǒu] 。', 'カニ は [横|よこ] に [歩|ある]く 。', 'The crab walks sideways.'],
    'boss:armadillo': ['El Gran Armadillo cuidaba la campana del molino para el Silencio.', 'O Tatuzão guardava o sino do moinho para o Silêncio.', 'Das Riesengürteltier bewachte die Glocke der Mühle für die Stille.',
      '[大|dà] [犰狳|qiú yú] [替|tì] [寂静|jì jìng] [看守|kān shǒu] [磨坊|mò fáng] [的|de] [钟|zhōng] 。', '[大|おお]アルマジロ は [静寂|せいじゃく] の ため に [風車|ふうしゃ] の [鐘|かね] を [守|まも]って いた 。', 'The Great Armadillo guarded the mill’s bell for the Hush.'],
  };
  const LI = { es: 0, pt: 1, de: 2, zh: 3, ja: 4, en: 5 };
  const loreOf = key => LORE[key] || LORE[key.replace(/^boss:/, '')] || null;
  RW.LORE = LORE;
  let css = false;
  function style() {
    if (css) return; css = true;
    const st = document.createElement('style');
    st.textContent = `.bx-mimo { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 14px; padding: 10px 12px; border-radius: 14px; background: #fff; border: 2px solid rgba(43,34,53,.15); margin-bottom: 10px; font-weight: 800; }
.bx-mimo .lv { font-size: 22px; font-weight: 900; } .bx-bar { flex: 1; min-width: 140px; height: 12px; border: 2px solid var(--ink, #2b2235); border-radius: 8px; overflow: hidden; background: #efe6ff; } .bx-bar i { display: block; height: 100%; background: linear-gradient(#8ff0e2, #21a493); }
.bx-perks { width: 100%; font-size: 13px; font-weight: 700; line-height: 1.5; } .bx-perks b { font-weight: 900; } .bx-perks .off { opacity: .45; }
.bx-h { margin: 12px 0 6px; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; opacity: .7; }
.bx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 10px; }
.bx-card { display: flex; gap: 10px; padding: 8px 10px; border-radius: 14px; background: #fff; border: 2px solid rgba(43,34,53,.15); }
.bx-card.boss { border-color: #f5b73b; background: #fffaf0; } .bx-card img { width: 52px; height: 52px; flex: none; }
.bx-card b { font-size: 17px; } .bx-card .en { font-size: 12px; opacity: .7; } .bx-card .st { font-size: 12px; font-weight: 800; margin: 2px 0; }
.bx-card .lore { font-size: 14px; font-weight: 700; line-height: 1.35; margin-top: 3px; } .bx-card .lore small { display: block; font-size: 12px; opacity: .7; font-weight: 600; }
.bx-card button { border: 2px solid var(--ink, #2b2235); border-radius: 8px; background: transparent; font-size: 11px; padding: 0 6px; margin-left: 4px; }`;
    document.head.appendChild(st);
  }
  function html(state) {
    style();
    const m = state.mimoLv || { lvl: 1, xp: 0 }, l = lang(), name = esc(state.mimoName || 'Mimo');
    const perks = RW.PERKS.map(p => `<span class="${m.lvl >= p.lvl ? '' : 'off'}">${m.lvl >= p.lvl ? '✓' : `Lv ${p.lvl}:`} <b>${esc(p.name)}</b> (${esc(p.what)})</span>`).join(' · ');
    // (P6b: the hearts as they are now, what the next levels bring, and how leveling works, in one paragraph)
    const hpNow = typeof HEARTS !== 'undefined' ? HEARTS.now() : RW.heartsAt(m.lvl), nh = RW.nextHeart(m.lvl), np = RW.nextPerk(m.lvl), X = RW.XP;
    const next = m.lvl >= RW.MAX ? 'The top level.' : `Next: Lv ${m.lvl + 1} in ${RW.need(m.lvl) - m.xp} XP${nh ? ` · a heart at Lv ${nh}` : ''}${np ? ` · ${esc(np.name)} at Lv ${np.lvl}` : ''}.`;
    let h = `<div class="bx-mimo"><span class="lv">${name} · Lv ${m.lvl}</span><div class="bx-bar" title="${m.xp} / ${RW.need(m.lvl)} XP"><i style="width:${Math.round(100 * Math.min(1, m.xp / RW.need(m.lvl)))}%"></i></div>`
      + `<span>${m.xp} / ${RW.need(m.lvl)} XP</span><span>♥ ${hpNow}/${RW.heartsAt(m.lvl)}</span><span>power ${Math.round(RW.powerAt(m.lvl) * 100)}%</span><div class="bx-perks">${perks}</div><div class="bx-perks">${next}</div></div>`
      + `<p class="note bx-how"><b>How leveling works.</b> Every fight gives ${name} XP: each sentence you say (S or A ${X.S}, B or C ${X.B}, D ${X.D}), ${RW.XP_FOE} for each foe beaten, ${RW.XP_BOSS} for a boss and ${RW.XP_FIRST} the first time you beat a kind (half the sentences’ when you lose). A level takes more XP each time (60, then 90, 120…), so the first ones come every few fights and the later ones are rarer. Each level makes ${name}’s moves 4% stronger, every other level adds a heart (8 up to 14), and perks come at levels 3, 5, 7, 9, 12 and 15. A level gives back 1 ♥, never all of them: hearts carry over from fight to fight, so eat from the bag or rest at an inn.</p>`;
    const beasts = state.beasts || {}, keys = Object.keys(beasts).sort((a, b) => (beasts[a].met || 0) - (beasts[b].met || 0));
    h += `<h4 class="bx-h">Creatures met (${keys.length})</h4>`;
    h += keys.length ? '<div class="bx-grid">' + keys.map(key => {
      const b = beasts[key], n = RW.beastName(key), lo = loreOf(key), line = lo && (lo[LI[l]] || ''), say = line || '';
      return `<div class="bx-card${key.startsWith('boss:') ? ' boss' : ''}">${RW.beastImg(key)}<div><b>${n.w}</b> <span class="en">${esc(n.en)}</span>`
        + `<div class="st">beaten ×${b.won || 0}${b.friends ? ` · befriended ×${b.friends}` : ''}${b.best ? ` · best fight ${esc(b.best)}` : ''}${b.first ? ' · first win ✓' : ''}</div>`
        + (line ? `<div class="lore">${RW.showLang(line, true)}${say ? `<button data-say="${esc(say)}" title="Hear it">🔊</button>` : ''}<small>${esc(lo[5])}</small></div>` : '') + '</div></div>';
    }).join('') + '</div>' : '<p class="empty">No creatures yet. Fight one, and it’s in here.</p>';
    // the words the Hush let go of (the journal draws the canvases and wires 🔊: data-icon, data-hear)
    const freed = state.freed || {}, ids = Object.keys(freed).filter(id => typeof LEX !== 'undefined' && LEX.item(id));
    h += `<h4 class="bx-h">Words the Hush let go (${ids.length})</h4>`;
    h += ids.length ? '<div class="words">' + ids.map(id => {
      const it = LEX.item(id), word = isC() ? CJK.html(LEX.src(id), { lang: l, cap: false }) : esc(LEX.form(id, { article: true }));
      return `<div class="wcard ${LEX.taught(id) ? 'taught' : ''}"><canvas data-icon="${esc(it.icon || '')}" width="56" height="56"></canvas><b>${word}</b><span>${esc(it.en || '')}${freed[id] > 1 ? ` · ×${freed[id]}` : ''}</span><button data-hear="${esc(id)}" title="Hear it">🔊</button></div>`;
    }).join('') + '</div>' : '<p class="empty">Beat a Hush creature and the word it stole flies free.</p>';
    return h;
  }
  RW.journalTab = {
    id: 'bestiary',
    label: state => ((state.beasts && Object.keys(state.beasts).length) || (state.freed && Object.keys(state.freed).length) || (state.mimoLv && (state.mimoLv.lvl > 1 || state.mimoLv.xp > 0)) ? 'Bestiary' : null),
    html,
  };
  RW.addTab();     // (into ui.js's UI.journalTabs: the journal shows it once there's something in it)
})();
