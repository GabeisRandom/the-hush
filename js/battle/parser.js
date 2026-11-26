'use strict';
// Command parser for the 3D battles, ported from the grey box (prototypes/battle/parser.js).
// It turns what the player typed into Mimo's actions: a verb plus a described target (rung 2),
// a body part with an optional owner (rung 3), objects (pt stones), and German charge words.
// It notes grammar slips (which weaken the move) and renders the corrected sentence Mimo says
// back. Words Mimo hasn't been taught are listed (c.untaught) and left out of what it understood.
// Push («empuja al armadillo», «empurra o tatu», «Schieb das Gürteltier!») takes a target like hit;
// eat takes food from the bag («come la manzana», «Iss den Apfel!»), and its words come from
// setFoods() (LEX items, set per battle) instead of the creature tables.
// Positions (the Mirror Lake): any description can say where the one you mean stands in the row, as
// you see it: «la rana de la izquierda», «el calladito del medio», «o sapo da direita», «den linken
// Frosch», «den Frosch in der Mitte». The position picks among the ones the rest of the description
// fits (posPick); when that already picks one, a position that doesn't fit it is a slip ('position').
// When two or more that look the same (same kind, same color) fit and nothing says which, the command
// is ambiguous: Mimo picks one itself, and the grade says so (resolve → ambiguous).
(() => {
  const B = window.BATTLE, _ = B._;
  const DIA = /[̀-ͯ]/g;
  const nrm = s => String(s).toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(DIA, '');
  const tokenize = text => String(text).replace(/[¡!¿?.,;:«»"“”„()…\-–—]/g, ' ').split(/\s+/).filter(Boolean).map(raw => ({ raw, n: nrm(raw) }));
  const capF = s => s.charAt(0).toUpperCase() + s.slice(1);
  const uniq = a => [...new Set(a)];

  // true when a and b are at most one typo apart (swap, insert, delete or replace)
  function near1(a, b) {
    if (a === b) return true;
    const la = a.length, lb = b.length;
    if (Math.abs(la - lb) > 1) return false;
    let i = 0;
    while (i < la && i < lb && a[i] === b[i]) i++;
    if (la === lb) {
      if (a.slice(i + 1) === b.slice(i + 1)) return true;
      return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
    }
    return la > lb ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
  }

  function addAdj(I, keys, lex, lx) {
    const base = { keys, key: keys[0], lex };
    if (lx.m === lx.f) I.adjs.set(nrm(lx.m), Object.assign({ g: 'mf', show: lx.m }, base));
    else { I.adjs.set(nrm(lx.m), Object.assign({ g: 'm', show: lx.m }, base)); I.adjs.set(nrm(lx.f), Object.assign({ g: 'f', show: lx.f }, base)); }
  }
  function indexLang(L) {
    if (L.I) return L.I;
    const I = { verbs: new Map(), species: new Map(), parts: new Map(), adjs: new Map(), stones: new Map(), arts: new Map(), preps: new Set(), voc: new Set(),
      fill: new Set(), adv: new Map(), stems: [], pron: new Map(), cop: new Map(), floatRel: new Set(), pos: new Map(), posStems: [], posAdv: new Map() };
    // positions: «izquierda», «meio» (es/pt: the noun after «de la / del», «da / do»); de: the adjective stems
    // (link-, mittler-, recht-) and the words after the noun («links», «rechts»; «in der Mitte» is read as a phrase)
    for (const [key, p] of Object.entries(L.positions || {})) {
      if (L.code === 'de') {
        I.posStems.push({ key, n: nrm(p.stem), show: p.stem });
        if (p.adv && !p.adv.includes(' ')) I.posAdv.set(nrm(p.adv), { key, show: p.adv });
      } else for (const w of [p.w].concat(p.alt || [])) I.pos.set(nrm(w), { key, g: p.g, show: w });
    }
    I.posStems.sort((a, b) => b.n.length - a.n.length);
    for (const [key, v] of Object.entries(L.verbs)) for (const f of v.forms) I.verbs.set(nrm(f), { key, show: f });
    for (const [key, s] of Object.entries(L.species)) {
      I.species.set(nrm(s.w), { key, g: s.g, show: s.w });
      if (s.pl && nrm(s.pl) !== nrm(s.w)) I.species.set(nrm(s.pl), { key, g: s.g, show: s.pl, pl: true });   // «Käfer» is both
      if (s.gen && nrm(s.gen) !== nrm(s.w)) I.species.set(nrm(s.gen), { key, g: s.g, show: s.gen, gen: true });   // «des Käfers»
    }
    for (const [key, p] of Object.entries(L.parts)) {
      I.parts.set(nrm(p.w), { key, g: p.g, show: p.w });
      if (p.pl && nrm(p.pl) !== nrm(p.w)) I.parts.set(nrm(p.pl), { key, g: p.g, show: p.pl, pl: true });     // «las alas», «as asas»
      for (const a of p.alt || []) I.parts.set(nrm(a), { key, g: p.g, show: a });
    }
    if (L.stones) for (const [w, s] of Object.entries(L.stones)) I.stones.set(nrm(w), { key: s.kind, g: s.g, show: w });
    if (L.stone) I.stones.set(nrm(L.stone.w), { key: 'medium', g: L.stone.g, show: L.stone.w });
    if (L.code === 'de') {
      for (const [key, a] of Object.entries(L.adjs)) I.stems.push({ key, n: nrm(a.stem), show: a.stem });
      I.stems.sort((a, b) => b.n.length - a.n.length);
      for (const [a, v] of Object.entries(L.arts)) I.arts.set(a, Object.assign({ n: a, show: a }, v));
      for (const a of L.adverbs) I.adv.set(nrm(a), { show: a });
      for (const [p, c] of Object.entries(L.prons || {})) I.pron.set(p, c);
    } else {
      for (const [key, a] of Object.entries(L.adjs)) {
        a.forms.forEach((lx, lex) => addAdj(I, [key], lex, lx));
        if (a.dim) addAdj(I, [key, 'small'], 'dim', a.dim);
        if (a.aug) addAdj(I, [key, 'big'], 'aug', a.aug);
      }
      for (const [a, v] of Object.entries(L.arts)) I.arts.set(nrm(a), Object.assign({ show: a }, v));
      for (const [w, cop] of Object.entries(L.copulas || {})) I.cop.set(nrm(w), { cop, show: w });
      for (const w of L.floatRel || []) I.floatRel.add(nrm(w));
    }
    for (const p of L.preps) I.preps.add(nrm(p));
    for (const v of L.voc) I.voc.add(nrm(v));
    for (const f of L.fillers) I.fill.add(nrm(f));
    I.conj = L.conj.map(seq => seq.map(nrm));
    I.talk = L.talk.map(t => ({ id: t.id, p: t.p.map(x => ' ' + tokenize(x).map(k => k.n).join(' ') + ' ') }));
    I.foods = new Map();
    L.I = I;
    return I;
  }
  // The food words for this battle. list: [{ id, w, pl, g, mass, alt }] in this language (from LEX.item).
  // A plural that only differs by an umlaut («Äpfel») or not at all («Käse», «Kuchen») is told apart by
  // the raw spelling or the article.
  function setFoods(L, list) {
    const I = indexLang(L), M = (I.foods = new Map());
    for (const f of list || []) {
      if (!f || !f.w) continue;
      const base = { key: f.id, id: f.id, g: f.g || 'm', mass: !!f.mass, w: f.w, plw: f.pl || null };
      const sg = Object.assign({ show: f.w }, base);
      if (f.pl && nrm(f.pl) === nrm(f.w)) { if (f.pl === f.w) sg.samePl = true; else sg.umlPl = f.pl.toLowerCase(); }
      M.set(nrm(f.w), sg);
      if (f.pl && nrm(f.pl) !== nrm(f.w)) M.set(nrm(f.pl), Object.assign({ show: f.pl, pl: true }, base));
      for (const a of f.alt || []) if (!M.has(nrm(a))) M.set(nrm(a), Object.assign({ show: a }, base));
    }
    return M;
  }

  // exact match first; a one-letter typo is forgiven on words of 5+ letters
  function look(map, n) {
    const hit = map.get(n);
    if (hit) return Object.assign({ typo: false }, hit);
    if (n.length < 5) return null;
    let found = null;
    for (const [k, v] of map) {
      if (k.length < 4 || !near1(n, k)) continue;
      if (found && found.key !== v.key) return null;
      found = Object.assign({ typo: true }, v);
    }
    return found;
  }
  const DE_ENDINGS = ['', 'e', 'en', 'er', 'es', 'em'];
  // German positions. As an adjective: link-, mittler-, recht- with an ending («den linken», «die mittlere»).
  function dePosAdj(I, n) {
    if (!I.posStems.length) return null;
    for (const s of I.posStems) if (n.startsWith(s.n) && DE_ENDINGS.includes(n.slice(s.n.length))) return { key: s.key, end: n.slice(s.n.length), show: s.show, typo: false };
    if (n.length >= 6) for (const s of I.posStems) for (const end of DE_ENDINGS) {
      const f = s.n + end;
      if (f.length >= 6 && near1(n, f) && !I.posAdv.has(n)) return { key: s.key, end, show: s.show, typo: true };
    }
    return null;
  }
  // After the noun: «links», «rechts» (a one-letter slip is forgiven), «in der Mitte». The wrong article in it is a slip
  // (issue): «in die Mitte» (case: that's into the middle), «im / in dem Mitte» (gender: die Mitte), «in Mitte»
  // (article), «Mitte» alone (prep). → { key, show, tok, len, issue } or null
  function deAdvPos(rest, i, I) {
    if (!I.posStems.length) return null;
    const t = rest[i], n = t.n, t1 = rest[i + 1], t2 = rest[i + 2];
    const a = I.posAdv.get(n) || (n.length >= 5 && !dePosAdj(I, n) ? look(I.posAdv, n) : null);
    if (a) return { key: a.key, show: a.show, tok: t, typo: !!a.typo, len: 1 };
    const mid = x => x && x.n === 'mitte';   // (no typo slack here: «Motte» is one letter away)
    if (mid(t) && !(rest[i - 1] && (rest[i - 1].n === 'in' || rest[i - 1].n === 'im'))) return { key: 'middle', show: 'Mitte', tok: t, len: 1, issue: 'prep' };
    if (n === 'im' && mid(t1)) return { key: 'middle', show: 'Mitte', tok: t1, len: 2, issue: 'gender' };
    if (n !== 'in' || !t1) return null;
    if (mid(t1)) return { key: 'middle', show: 'Mitte', tok: t1, len: 2, issue: 'article' };
    const art = I.arts.get(t1.n);
    if (art && mid(t2)) return { key: 'middle', show: 'Mitte', tok: t2, len: 3, art, issue: art.n === 'der' ? null : canBe(art, 'dat') ? 'gender' : 'case' };
    return null;
  }
  function deAdj(I, n) {
    for (const s of I.stems) if (n.startsWith(s.n) && DE_ENDINGS.includes(n.slice(s.n.length))) return { key: s.key, keys: [s.key], end: n.slice(s.n.length), show: s.show, typo: false };
    if (n.length >= 5) for (const s of I.stems) for (const end of DE_ENDINGS) {
      const f = s.n + end;
      if (f.length >= 5 && near1(n, f)) return { key: s.key, keys: [s.key], end, show: s.show, typo: true };
    }
    return null;
  }

  const skipTok = (I, t, ctx) => I.voc.has(t.n) || I.fill.has(t.n) || !!(ctx.voc && ctx.voc.has(t.n));
  // the slips that change the meaning (MAJOR) weaken a move more than the small ones
  const MAJOR = new Set(['serestar', 'case', 'particle']);
  const err = (c, kind, major) => c.errors.push({ kind, major: !!major || MAJOR.has(kind) });
  const fix = (c, kind) => c.fixes.push(kind);
  // a typo is a spelling slip; a missing accent (or an umlaut written out: «gruen», «Kaefer») is only an accent fix
  const unUml = s => s.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u');
  function spelling(c, m) {
    if (!m || !m.tok) return;
    const raw = m.tok.raw.toLowerCase(), full = m.show ? (m.show + (m.end || '')).toLowerCase() : null;   // German adjectives: stem + ending
    if (m.typo) fix(c, full && nrm(unUml(raw)) === nrm(full) ? 'accent' : 'spelling');
    else if (full && raw !== full && nrm(raw) === nrm(full)) fix(c, 'accent');
  }
  function newClause(verb, tok, m) {
    return { verb, baseVerb: verb, verbTok: tok, verbShow: m.show, verbTypo: m.typo, errors: [], fixes: [], words: [], untaught: [], unknownToks: [],
      desc: null, part: null, owner: null, stone: null, target: null, obj: null, charge: 0, adv: [], instr: null, food: null, foodU: null };
  }
  // a food word in a unit: is it the plural? («Äpfel» and «Apfel» normalize alike; «die Kuchen» is plural by its article)
  function foodOf(fm, tok) {
    const f = Object.assign({ tok }, fm);
    if (f.umlPl && tok.raw.toLowerCase() === f.umlPl) { f.pl = true; f.show = f.plw; }
    return f;
  }
  // eat needs food; anything else said about food is a mix-up («Golpea la manzana»)
  function eatUnits(c, units) {
    const foodU = units.find(u => u.food);
    if (c.verb !== 'eat') return foodU ? { fail: 'foodVerb', word: foodU.food.tok.raw } : null;
    if (!foodU) {
      const thing = units.find(u => u.noun || u.part || u.adjs.length);
      return thing ? { fail: 'notFood', word: (thing.noun || thing.part || thing.adjs[0]).tok.raw } : { fail: 'eatWhat' };
    }
    const other = units.find(u => u !== foodU && (u.noun || u.part || u.stone));
    if (other) return { fail: 'notFood', word: (other.noun || other.part || other.stone).tok.raw };
    c.food = foodU.food; c.foodU = foodU;
    return null;
  }
  function findVerb(toks, from, I) {
    for (let j = from; j < toks.length; j++) { const m = look(I.verbs, toks[j].n); if (m) return { at: j, m }; }
    return null;
  }
  const firstWord = (toks, I, ctx) => { const t = toks.find(x => !skipTok(I, x, ctx)); return t ? t.raw : null; };
  const mkUnit = () => ({ preps: [], art: null, noun: null, part: null, stone: null, food: null, adjs: [], rel: null, pron: null, pos: null, has: false, role: null });
  function merged(us) {
    if (!us.length) return null;
    const m = Object.assign(mkUnit(), { preps: us[0].preps.slice(), art: us[0].art });
    for (const u of us) { if (u.noun) m.noun = u.noun; m.adjs.push(...u.adjs); if (u.rel) m.rel = u.rel; if (u.pron) m.pron = u.pron; if (u.pos) m.pos = u.pos; if (u.implicit) m.implicit = true; if (!m.art && u.art) m.art = u.art; }
    m.described = !!(m.noun || m.adjs.length || m.rel || m.pron || m.pos);
    return m;
  }

  // ------------------------------------------------------------ where one stands in the row
  // The row as the player sees it in the wide shot (the camera looks down −z, turned 0.1 rad): left to
  // right on screen. Home spots (hx, hz), so it holds still while they hop about.
  const POS_KEYS = ['left', 'middle', 'right'];
  const screenX = f => (f.hx !== undefined ? f.hx : f.x) * 0.995 + (f.hz !== undefined ? f.hz : f.z) * 0.0998;
  const order = list => list.slice().sort((a, b) => screenX(a) - screenX(b));
  // the position words that can name f among `group` (the ones that fit the rest of what was said), in `row` (everyone):
  // the first and last of two or three are left and right, the second of three is the middle; whoever stands in the
  // middle of a row of three can be «del medio» too; alone, any word will do
  function posKeysOf(f, group, row) {
    const out = new Set(), g = order(group), n = g.length, i = g.indexOf(f);
    if (i < 0) return out;
    if (n === 1) { POS_KEYS.forEach(k => out.add(k)); return out; }
    if (i === 0) out.add('left');
    if (i === n - 1) out.add('right');
    if (n === 3 && i === 1) out.add('middle');
    const r = order(row || group);
    if (r.length === 3 && r[1] === f) out.add('middle');
    return out;
  }
  // the one a position word picks out of `cands` (two or more), or null («del medio» among two, with someone else between them)
  function posPick(cands, key, row) {
    const g = order(cands), n = g.length;
    if (!n) return null;
    if (key === 'left') return g[0];
    if (key === 'right') return g[n - 1];
    if (n === 3) return g[1];
    const r = order(row || cands);
    return r.length === 3 && g.includes(r[1]) ? r[1] : null;
  }
  // when what you said already picks f: does the position fit it too? Among those of its kind (when you named the
  // kind), or in the whole row. Returns the right word when it doesn't (null when it fits).
  function posMend(f, key, row, named) {
    const same = row.filter(x => x.species === f.species);
    const groups = named && same.length >= 2 ? [same, row] : [row];
    if (groups.some(g => posKeysOf(f, g, row).has(key))) return null;
    const fits = posKeysOf(f, groups[0], row);
    return ['left', 'right', 'middle'].find(k => fits.has(k)) || null;
  }
  // two or more that only a position can tell apart: the same kind and the same color
  const lookAlike = list => list.length > 1 && list.every(f => f.species === list[0].species && f.color === list[0].color);

  // ------------------------------------------------------------ who is meant
  function hasTrait(f, key) {
    if (key === 'big' || key === 'small') return f.size === key;
    if (key === 'asleep' || key === 'angry') return !!(f.states && f.states.has(key));
    return f.color === key;
  }
  // Filters foes by the words Mimo knows; the words it doesn't know are noted and ignored.
  function featureFilter(foes, d, ctx, c) {
    let cands = foes, used = 0;
    const note = (id, tok) => { if (!c.untaught.some(u => u.id === id)) c.untaught.push({ id, raw: tok.raw }); };
    if (d.noun) {
      const id = 'n.' + d.noun.key;
      if (ctx.knows(id)) { d.noun.known = true; cands = cands.filter(f => f.species === d.noun.key); used++; } else note(id, d.noun.tok);
    }
    for (const a of d.adjs) {
      a.known = false;
      for (const key of a.keys) {
        const id = 'a.' + key;
        if (ctx.knows(id)) { a.known = true; cands = cands.filter(f => hasTrait(f, key)); used++; } else note(id, a.tok);
      }
    }
    if (d.rel && d.rel.adj) {
      const id = 'a.' + d.rel.adj.key;
      if (ctx.knows(id)) { d.rel.adj.known = true; cands = cands.filter(f => hasTrait(f, d.rel.adj.key)); used++; } else note(id, d.rel.adj.tok);
    }
    if (d.rel && d.rel.fly) { cands = cands.filter(f => f.floating); used++; }
    if (d.pron) used++;
    return { cands, used };
  }
  // Mimo's own pick when you don't say who: the nearest foe that isn't shy, then the weakest (never one marked noAuto
  // while there's another: the Corn Society's colonel behind his closed cape, where a hit would only bounce off).
  function autoPick(foes) {
    const ok = foes.filter(f => !f.shy && !f.noAuto), pool = ok.length ? ok : foes.filter(f => !f.shy).length ? foes.filter(f => !f.shy) : foes;
    return pool.slice().sort((a, b) => (a.hx - b.hx) || (a.hp - b.hp))[0];
  }
  // The description's own words first (featureFilter), then where it stands: a position picks among the ones
  // those words fit. If they already fit only one, a position that doesn't fit it is noted (pos.fix: the right
  // word, a 'position' slip). A position Mimo hasn't learned is left out, like any other new word.
  function narrow(list, d, ctx, c) {
    const r = featureFilter(list, d, ctx, c), p = d.pos;
    if (!p) return r;
    const id = 'p.' + p.key;
    if (!ctx.knows(id)) { p.known = false; if (!c.untaught.some(u => u.id === id)) c.untaught.push({ id, raw: p.tok.raw }); return r; }
    p.known = true; r.used++;
    if (r.cands.length === 1) p.fix = posMend(r.cands[0], p.key, ctx.foes, !!d.noun);
    else if (r.cands.length > 1) { const pick = posPick(r.cands, p.key, ctx.foes); if (pick) r.cands = [pick]; else p.miss = true; }
    return r;
  }
  // Two or more look alike (same kind, same color) and nothing said which: Mimo picks one itself (the nearest),
  // and the sentence it says back has where that one stands (d.posAdd, or pos.guess when the position picked no one:
  // «la rana del medio» with frogs only on the left and right counts as not saying which, not as a slip on top).
  // (untaught: you did say where, with a word Mimo hasn't learned yet; like any new word it costs nothing, and Mimo
  // learns it from you)
  function ambiguous(cands, d, foes, extra) {
    const target = autoPick(cands), keys = posKeysOf(target, cands, foes), key = ['left', 'right', 'middle'].find(k => keys.has(k)) || null;
    const untaught = !!(d && d.pos && d.pos.known === false);
    if (d) { if (d.pos && d.pos.known) d.pos.guess = key; else if (!untaught) d.posAdd = key; }
    return Object.assign({ target, ambiguous: { n: cands.length, cands, untaught } }, extra || {});
  }
  function resolve(c, ctx) {
    const foes = ctx.foes;
    if (c.part) {
      const id = 'n.' + c.part.key, known = ctx.knows(id);
      if (!known) c.untaught.push({ id, raw: c.part.tok.raw });
      let cands = foes.filter(f => f.parts && f.parts.includes(c.part.key));
      if (c.owner && c.owner.described) {
        const r = narrow(cands, c.owner, ctx, c);
        if (r.used) { cands = r.cands; c.ownerShown = true; }
      }
      if (cands.length > 1) {   // "la cola" with two tails around: the one that matters
        const narrowL = [l => l.filter(f => !f.shy), l => l.filter(f => f.weak === c.part.key), l => l.filter(f => f.species === 'hushbig')];
        for (const fn of narrowL) { const n = fn(cands); if (n.length >= 1 && n.length < cands.length) cands = n; if (cands.length === 1) break; }
      }
      if (cands.length === 1) return { target: cands[0], part: known ? c.part.key : null, auto: !known && !c.ownerShown };
      if (lookAlike(cands)) {
        // «la cabeza» with look-alike heads all round: Mimo picks one, and says back whose («de la rana de la izquierda»)
        const s = cands[0].species;
        const d = c.ownerShown ? c.owner : (c.ownerAdd = { adjs: [], noun: ctx.knows('n.' + s) ? { key: s, known: true } : null, preps: [], described: true, pos: null });
        return ambiguous(cands, d, foes, { part: known ? c.part.key : null, auto: !known && !c.ownerShown });
      }
      return { fail: cands.length ? 'which' : (foes.some(f => f.parts && f.parts.includes(c.part.key)) ? 'none' : 'nopart') };
    }
    if (c.desc && c.desc.described) {
      const r = narrow(foes, c.desc, ctx, c);
      if (r.used) {
        if (r.cands.length === 1) return { target: r.cands[0] };
        if (lookAlike(r.cands)) return ambiguous(r.cands, c.desc, foes);
        return { fail: r.cands.length ? 'which' : 'none' };
      }
    }
    if (!foes.length) return { fail: 'none' };
    if (foes.length === 1) return { target: foes[0], auto: true };
    return { target: autoPick(foes), auto: true, multi: true };
  }
  function descWords(c, d) {
    if (!d) return;
    if (d.noun && d.noun.known) c.words.push('n.' + d.noun.key);
    for (const a of d.adjs) if (a.known) for (const k of a.keys) c.words.push('a.' + k);
    if (d.rel && d.rel.adj && d.rel.adj.known) c.words.push('a.' + d.rel.adj.key, 'r.' + d.rel.cop);
    if (d.pos && d.pos.known) c.words.push('p.' + d.pos.key);
  }

  // ------------------------------------------------------------ Spanish / Portuguese
  // A position phrase starting at token k: «de la izquierda», «del medio», «en el medio», «a la derecha» ·
  // «da esquerda», «do meio», «na direita», «à esquerda». Bare («la rana izquierda») it misses its linking word.
  // → { p (the word), link ('de' | 'en' | 'em' | 'a' | another prep | null), art (the article in it, or null), len } or null
  const POS_LINKS = new Set(['de', 'en', 'em', 'a']);
  function romPos(toks, k, I, L) {
    const at = j => toks[k + j], P = t => (t ? look(I.pos, t.n) : null), t0 = at(0);
    let p = P(t0);
    if (p) return { p: Object.assign({ tok: t0 }, p), link: null, art: null, len: 1 };
    const a0 = I.arts.get(t0.n);
    if (a0) {
      if (a0.poss || !(p = P(at(1)))) return null;
      // pt: «à esquerda» (a + a); without the grave accent «a» is only an accent away
      const grave = L.code === 'pt' && t0.n === 'a';
      return { p: Object.assign({ tok: at(1) }, p), link: a0.prep || (grave ? 'a' : null), noGrave: grave && t0.raw !== 'à' && t0.raw !== 'À', art: Object.assign({ tok: t0 }, a0), len: 2 };
    }
    if (!I.preps.has(t0.n) || !POS_LINKS.has(t0.n)) return null;
    if ((p = P(at(1)))) return { p: Object.assign({ tok: at(1) }, p), link: t0.n, art: null, len: 2 };      // «de izquierda»: the article is missing
    const a1 = at(1) && I.arts.get(at(1).n);
    if (a1 && !a1.prep && !a1.poss && (p = P(at(2)))) return { p: Object.assign({ tok: at(2) }, p), link: t0.n, art: Object.assign({ tok: at(1) }, a1), len: 3 };
    return null;
  }
  function scanRomance(toks, L, ctx) {
    const I = L.I, units = [], unknown = [];
    let cur = mkUnit();
    const push = () => { if (cur.has || cur.art || cur.preps.length) units.push(cur); cur = mkUnit(); };
    for (let k = 0; k < toks.length; k++) {
      const t = toks[k], n = t.n, t1 = toks[k + 1];
      if (n === 'que' && t1) {
        if (I.cop.has(t1.n)) {
          const t2 = toks[k + 2], adj = t2 ? look(I.adjs, t2.n) : null;
          if (!adj && t2 && I.floatRel.has(t2.n)) { cur.rel = { fly: true }; cur.has = true; k += 2; continue; }
          cur.rel = { cop: I.cop.get(t1.n).cop, copTok: t1, copShow: I.cop.get(t1.n).show, adj: adj ? Object.assign({ tok: t2 }, adj) : null };
          cur.has = true; k += adj ? 2 : 1; continue;
        }
        if (I.floatRel.has(t1.n)) { cur.rel = { fly: true }; cur.has = true; k += 1; continue; }
      }
      if (skipTok(I, t, ctx)) continue;
      // where it stands: it says which one of the ones the words before it describe («la rana roja de la izquierda»,
      // «la de la izquierda», «el calladito del medio», «la cabeza de la rana de la derecha»)
      const pp = I.pos.size ? romPos(toks, k, I, L) : null;
      if (pp) {
        const host = cur.has || cur.art ? cur : units.length ? units[units.length - 1] : cur;
        // «salta sobre la izquierda», «golpea a la izquierda»: that «la» (and «a») belong to the one you mean, and
        // «de la» is what's missing («salta sobre la de la izquierda», «golpea a la de la izquierda»)
        if (host === cur && !cur.art && !cur.has && pp.art && !pp.art.prep) {
          if (!pp.link) { cur.art = pp.art; pp.art = null; }
          else if (pp.link === 'a' && L.code === 'es' && !cur.preps.length) { cur.preps.push('a'); cur.art = pp.art; pp.art = null; pp.link = null; }
        }
        host.pos = { key: pp.p.key, g: pp.p.g, show: pp.p.show, tok: pp.p.tok, typo: pp.p.typo, link: pp.link, art: pp.art, noGrave: !!pp.noGrave };
        host.has = true;
        k += pp.len - 1;
        continue;
      }
      const art = I.arts.get(n);
      if (art) {
        if (art.prep === 'de' && cur.part) { push(); cur.role = 'owner'; }   // "la cola del rojo", "o rabo do vermelho"
        else if (cur.has) push();
        cur.art = Object.assign({ tok: t }, art);
        if (art.prep) cur.preps.push(art.prep);
        continue;
      }
      if (I.preps.has(n)) {
        if (n === 'de' && cur.part) { push(); cur.role = 'owner'; cur.preps.push('de'); continue; }
        if (cur.has) push();
        cur.preps.push(n);
        continue;
      }
      const st = I.stones.size ? look(I.stones, n) : null;
      if (st) { if (cur.has) push(); cur.stone = Object.assign({ tok: t }, st); cur.has = true; continue; }
      const pm = look(I.parts, n);
      if (pm) { if (cur.has) push(); cur.part = Object.assign({ tok: t }, pm); cur.has = true; continue; }
      const sm = look(I.species, n), smX = sm && sm.typo && (I.adjs.has(n) || (I.pos && I.pos.has(n)));     // (P7a: an exact color or place word is never a creature's typo)
      if (sm && !smX) { if (cur.noun || cur.part || cur.stone) push(); cur.noun = Object.assign({ tok: t }, sm); cur.has = true; continue; }
      const fm = I.foods.size ? look(I.foods, n) : null;
      if (fm) { if (cur.has) push(); cur.food = foodOf(fm, t); cur.has = true; continue; }
      const am = look(I.adjs, n);
      if (am) {
        if (cur.stone && (am.key === 'big' || am.key === 'small') && am.keys.length === 1) { cur.stoneAdj = Object.assign({ tok: t }, am); continue; }   // "a pedra grande"
        if (cur.part || cur.stone) { push(); cur.role = 'owner'; cur.loose = true; }
        cur.adjs.push(Object.assign({ tok: t }, am)); cur.has = true; continue;
      }
      unknown.push(t);
    }
    push();
    return { units, unknown };
  }
  function parseRomance(toks, ctx) {
    const L = ctx.L, I = L.I;
    let k = 0;
    while (k < toks.length && skipTok(I, toks[k], ctx)) k++;
    const v = findVerb(toks, k, I);
    if (!v) return { fail: 'noverb', word: firstWord(toks, I, ctx) };
    const c = newClause(v.m.key, toks[v.at], v.m);
    const pre = toks.slice(k, v.at).filter(t => !skipTok(I, t, ctx));
    if (c.verb === 'sing' || c.verb === 'climb' || c.verb === 'blow' || c.verb === 'call' || c.verb === 'light' || c.verb === 'dig') { c.unknownToks = pre; spelling(c, Object.assign({ tok: toks[v.at] }, v.m)); return c; }   // (a song reaches everyone; Mimo climbs and picks its own; a call brings the gulls, Port Brisa: no target)
    const { units, unknown } = scanRomance(toks.slice(v.at + 1), L, ctx);
    c.unknownToks = pre.concat(unknown);
    const ef = eatUnits(c, units);
    if (ef) return ef;
    if (c.verb === 'eat') { spelling(c, Object.assign({ tok: toks[v.at] }, v.m)); return c; }
    const partU = units.find(u => u.part);
    const ownerU = partU ? units.find((u, i) => u.role === 'owner' && i > units.indexOf(partU)) : null;
    const stoneU = units.find(u => u.stone);
    const rest = units.filter(u => u !== partU && u !== ownerU && u !== stoneU && (u.noun || u.adjs.length || u.rel || u.pos));
    // «la cabeza de la izquierda»: the head of the one on the left (the position goes with whose part it is)
    if (partU && partU.pos) {
      const host = ownerU || rest[0];
      if (host) { if (!host.pos) host.pos = partU.pos; } else { const u = mkUnit(); u.pos = partU.pos; u.has = true; u.implicit = true; rest.push(u); }   // (it needs no article of its own)
      partU.pos = null;
    }
    if (partU) { c.part = partU.part; c.partU = partU; c.owner = ownerU ? merged([ownerU]) : merged(rest); if (ownerU && ownerU.loose) c.looseOwner = true; }
    else c.desc = merged(rest);
    if (stoneU) { c.stone = stoneU.stone; c.stoneU = stoneU; }
    spelling(c, Object.assign({ tok: toks[v.at] }, v.m));
    return c;
  }
  // the little words around a position: «de la izquierda», «del medio» (de + el), «da esquerda» (de + a), «à direita»
  function checkPosRom(c, p) {
    if (!p || !p.known) return;
    if (p.fix) err(c, 'position');                                            // it's somewhere else: «del medio», not «de la izquierda»
    if (!p.link || !POS_LINKS.has(p.link)) err(c, 'prep');                   // «la rana izquierda» → «la rana de la izquierda»
    else if (!p.art) fix(c, 'article');                                      // «de izquierda» → «de la izquierda»
    else if (p.art.g !== 'mf' && p.art.g !== p.g) err(c, 'gender');          // «del izquierda», «da meio»
    if (p.noGrave) fix(c, 'accent');                                         // «a esquerda» → «à esquerda»
    spelling(c, p);
  }
  // «¡Canta!» / «Canta!» / «Sing!»: Mimo's song reaches every foe at once, so it takes no target (region 3, the Quarry Caves)
  function finishSing(c, ctx) {
    c.words.push('v.' + c.verb);          // (also «¡Trepa!», the Bloom Gardens: Mimo climbs a vine and drops on one it picks)
    const foes = ctx.foes;
    c.target = foes.length ? autoPick(foes) : null; c.auto = true; c.multi = foes.length > 1; c.partKey = null; c.ambiguous = null;
    if (!c.target) return { fail: 'none' };
    c.canon = c.verbShow;
    return c;
  }
  function finishRomance(c, ctx) {
    const L = ctx.L, es = L.code === 'es';
    if (c.verb === 'eat') return finishEat(c, ctx);
    if (c.verb === 'sing' || c.verb === 'climb' || c.verb === 'blow' || c.verb === 'call' || c.verb === 'light' || c.verb === 'dig') return finishSing(c, ctx);     // (blow: a gust over everyone, the Frost Peaks; call: the gulls, Port Brisa)
    if (c.verb === 'push' && c.part) return { fail: 'pushPart', word: c.part.tok.raw };   // Mimo pushes the whole creature
    c.words.push('v.' + c.verb);
    if (c.verb === 'throw') {
      if (!c.stone) return { fail: 'throwWhat' };
      const st = c.stone, sa = c.stoneU.art;
      c.obj = st.key;
      if (c.stoneU.stoneAdj && st.key === 'medium') { c.obj = c.stoneU.stoneAdj.key === 'big' ? 'heavy' : 'light'; c.stoneTwist = true; fix(c, 'twist'); }
      c.words.push(c.obj === 'medium' ? 'n.stone' : 'o.' + c.obj);
      if (sa && !sa.poss && sa.g !== 'mf' && sa.g !== st.g) err(c, 'gender');
      if (!sa) fix(c, 'article');
      spelling(c, st);
    }
    const r = resolve(c, ctx);
    if (r.fail) return r;
    c.target = r.target; c.auto = !!r.auto; c.multi = !!r.multi; c.partKey = r.part || null; c.ambiguous = r.ambiguous || null;
    const sg = L.species[c.target.species].g;
    const prepOK = ps => (es ? null : ps.some(p => p === 'em' || p === 'sobre' || p === 'cima' || p === 'contra'));
    if (c.part && c.partKey) {
      const pu = c.partU, ps = pu.preps, pg = c.part.g, ppl = !!c.part.pl, pa = pu.art, P = L.parts[c.partKey];
      if (pa && !pa.poss) {
        if (!!pa.pl !== ppl) err(c, 'number');                                    // «la alas», «a asas»
        else if (es && P.artSg && !ppl) { if (pa.g === 'f') err(c, 'stressedA'); }   // «la ala» → «el ala»
        else if (pa.g !== 'mf' && pa.g !== pg) err(c, 'gender');
      }
      if (!pa) fix(c, 'article');
      spelling(c, c.part);
      if (es) {
        if (c.verb === 'jump' && !ps.some(p => p === 'sobre' || p === 'encima' || p === 'en' || p === 'a')) err(c, 'prep');
        if (c.verb === 'hit' && ps.includes('a')) err(c, 'prep');
      } else if (!prepOK(ps)) err(c, 'prep');
      if (c.ownerShown) {
        const o = c.owner;
        if (o.art && o.art.g !== 'mf' && o.art.g !== sg) err(c, 'gender');
        if (!o.art && !o.implicit) fix(c, 'article');
        for (const a of o.adjs) if (a.known) { if (a.g !== 'mf' && a.g !== sg) err(c, 'gender'); spelling(c, a); }
        if (c.looseOwner) err(c, 'possessive');
        checkPosRom(c, o.pos);
      }
      c.words.push('n.' + c.part.key);
      descWords(c, c.owner);
    } else if (!c.auto) {
      const np = c.part ? c.owner : c.desc, ps = np.preps;
      if (np.art && np.art.g !== 'mf' && np.art.g !== sg) err(c, 'gender');
      if (!np.art && !np.rel) fix(c, 'article');
      for (const a of np.adjs) if (a.known) { if (a.g !== 'mf' && a.g !== sg) err(c, 'gender'); spelling(c, a); }
      checkPosRom(c, np.pos);
      if (np.rel && np.rel.adj && np.rel.adj.known && np.rel.adj.g !== 'mf' && np.rel.adj.g !== sg) err(c, 'gender');
      if (np.rel && np.rel.copTok) spelling(c, { tok: np.rel.copTok, show: np.rel.copShow });   // «esta» → «está»
      if (np.rel && np.rel.adj && np.rel.adj.known) spelling(c, np.rel.adj);
      if (np.noun && np.noun.known) spelling(c, np.noun);
      if (!c.part) {
        if (es) {
          // the one you hit or push takes «a»: «golpea al rojo», «empuja al armadillo»
          if ((c.verb === 'hit' || c.verb === 'push') && !ps.includes('a')) err(c, 'prep');
          if (c.verb === 'jump' && !ps.some(p => p === 'sobre' || p === 'encima' || p === 'en' || p === 'a')) err(c, 'prep');
          if (np.rel && np.rel.adj && np.rel.adj.known && !!L.adjs[np.rel.adj.key].state !== (np.rel.cop === 'estar')) err(c, 'serestar', true);
        } else if (c.verb === 'push' ? ps.length > 0 : !prepOK(ps)) err(c, 'prep');   // «empurra o tatu», with no «no»
      }
      if (c.part) c.descAsOwner = true;
      descWords(c, np);
    }
    if (c.desc && c.desc.adjs.some(a => a.known && (a.lex === 'dim' || a.lex === 'aug'))) c.inho = true;
    c.canon = renderRomance(c, L);
    return c;
  }
  function adjForm(L, a, g) {
    const A = L.adjs[a.key];
    const f = a.lex === 'dim' || a.lex === 'aug' ? A[a.lex] : (A.forms[a.lex || 0] || A.forms[0]);
    return g === 'f' ? f.f : f.m;
  }
  const RANK = (L, a) => (a.key === 'big' || a.key === 'small' ? 1 : L.adjs[a.key] && L.adjs[a.key].state ? 2 : 0);
  // the position to say in the sentence Mimo says back: the one you said (or the right one, if it was off),
  // or the one Mimo picked when nothing said which (d.posAdd)
  const posKeyOf = d => (d.pos && d.pos.known ? d.pos.fix || d.pos.guess || d.pos.key : d.posAdd || null);
  function npRomance(L, target, d) {
    if (!d) return null;
    const es = L.code === 'es', g = L.species[target.species].g;
    const art = es ? (g === 'f' ? 'la' : 'el') : (g === 'f' ? 'a' : 'o');
    if (d.rel && d.rel.adj && d.rel.adj.known) return `${art} que ${L.adjs[d.rel.adj.key].state ? 'está' : 'es'} ${adjForm(L, d.rel.adj, g)}`;
    if (d.rel && d.rel.fly) return `${art} que ${es ? 'flota' : 'flutua'}`;
    const words = [];
    if (d.noun && d.noun.known) words.push(L.species[target.species].w);
    for (const a of d.adjs.filter(x => x.known).sort((x, y) => RANK(L, x) - RANK(L, y))) words.push(adjForm(L, a, g));
    const pk = posKeyOf(d), where = pk && L.positions ? L.positions[pk].phrase : null;   // «la rana roja de la izquierda», «la del medio»
    if (where) words.push(where);
    return words.length ? `${art} ${words.join(' ')}` : null;
  }
  // pt contractions with em and de: no, na, nos, nas · do, da, dos, das (es: del)
  const PT_ART = /^(os|as|o|a) /;
  const emNP = np => { const m = np.match(PT_ART); return m ? 'n' + m[1] + ' ' + np.slice(m[0].length) : 'em ' + np; };
  const deRom = (L, np) => { if (L.code === 'es') return np.startsWith('el ') ? 'del ' + np.slice(3) : 'de ' + np; const m = np.match(PT_ART); return m ? 'd' + m[1] + ' ' + np.slice(m[0].length) : 'de ' + np; };
  // «la cola», «el ala» (a stressed «a»), «las alas», «as asas»
  function partNPRomance(L, key, show, pl) {
    const es = L.code === 'es', P = L.parts[key];
    const art = es ? (pl ? (P.g === 'f' ? 'las' : 'los') : P.artSg || (P.g === 'f' ? 'la' : 'el')) : (pl ? (P.g === 'f' ? 'as' : 'os') : (P.g === 'f' ? 'a' : 'o'));
    return `${art} ${show || (pl ? P.pl : P.w)}`;
  }
  function renderRomance(c, L) {
    const es = L.code === 'es', v = c.verbShow;
    let obj = '';
    if (c.verb === 'throw' && c.obj) obj = c.stoneTwist || !c.stone ? L.stoneShow[c.obj] : `${c.stone.g === 'f' ? 'a' : 'o'} ${c.stone.show}`;
    // keep "encima de" / "em cima de" when the player chose it
    const unitP = c.part && c.partKey ? c.partU : (c.part ? c.owner : c.desc);
    const atop = c.verb === 'jump' && unitP && unitP.preps && unitP.preps.includes(es ? 'encima' : 'cima');
    const onto = np => (atop ? (es ? 'encima ' : 'em cima ') + deRom(L, np) : es ? 'sobre ' + np : emNP(np));
    if (c.part && c.partKey) {
      const partNP = partNPRomance(L, c.partKey, c.part.show, !!c.part.pl);
      // whose: the one you named, or the one Mimo picked among look-alikes (ownerAdd); «la cabeza de la derecha» says only where
      const od = c.ownerShown ? c.owner : c.ownerAdd || null, pk = od ? posKeyOf(od) : null, bare = od && od.implicit && !od.noun && !od.adjs.length;
      const onp = od && !bare ? npRomance(L, c.target, od) : null;
      const own = onp ? ' ' + deRom(L, onp) : bare && pk ? ' ' + L.positions[pk].phrase : '';
      if (es) {
        if (c.verb === 'jump') return `${v} ${onto(partNP)}${own}`;
        return /^peg/.test(nrm(v)) ? `${v} en ${partNP}${own}` : `${v} ${partNP}${own}`;
      }
      return [v, obj, onto(partNP) + own].filter(Boolean).join(' ');
    }
    const np = c.auto ? null : npRomance(L, c.target, c.part ? c.owner : c.desc);
    if (!np) return [v, obj].filter(Boolean).join(' ');
    if (es) {
      if (c.verb === 'hit' || c.verb === 'push') return `${v} ${np.startsWith('el ') ? 'al ' + np.slice(3) : 'a ' + np}`;
      return `${v} ${onto(np)}`;
    }
    if (c.verb === 'push') return `${v} ${np}`;
    return [v, obj, onto(np)].filter(Boolean).join(' ');
  }

  // ------------------------------------------------------------ eating (all three languages)
  // «come la manzana», «come una manzana», «come pan» (a mass noun goes bare), «Iss den Apfel!», «Iss ein Brot!»,
  // «Iss vom Kuchen!». Checked like a target: article gender and number, German case, spelling; and no
  // linking word («come a la manzana», «come na maçã» are slips).
  const ROM_INDEF = new Set(['un', 'una', 'unos', 'unas', 'um', 'uma', 'uns', 'umas']);
  function finishEat(c, ctx) {
    const L = ctx.L, de = L.code === 'de', fu = c.foodU, fd = c.food, a = fu.art;
    c.words.push('v.eat');
    if (ctx.knows(fd.id)) c.words.push(fd.id); else c.untaught.push({ id: fd.id, raw: fd.tok.raw });
    if (de) {
      if (fd.samePl && a && a.n === 'die' && fd.g !== 'f') { fd.pl = true; fd.show = fd.plw || fd.show; }   // «die Kuchen»
      const some = fu.preps.includes('von');                                   // «Iss vom Kuchen!» (some of it)
      if (fu.preps.some(p => p !== 'von')) err(c, 'prep');
      c.foodCase = some ? 'dat' : 'acc';
      checkDe(c, fu, c.foodCase, fd.g, fd.pl, { bare: fd.mass || fd.pl });
      spelling(c, fd);
      c.indef = !!(a && a.indef);
    } else {
      if (a && !a.poss) {
        if (!!a.pl !== !!fd.pl) err(c, 'number');                             // «la manzanas»
        else if (a.g !== 'mf' && a.g !== fd.g) err(c, 'gender');             // «el manzana», «o maçã»
      }
      if (!a && !fd.mass && !fd.pl) fix(c, 'article');                         // «come manzana» → «come la manzana»
      if (fu.preps.some(p => p !== 'de')) err(c, 'prep');                      // «come a la manzana»
      spelling(c, fd);
      for (const ad of fu.adjs) { if (!fd.pl && ad.g !== 'mf' && ad.g !== fd.g) err(c, 'gender'); spelling(c, ad); }
      c.indef = !!(a && ROM_INDEF.has(nrm(a.show)));
    }
    for (const ad of fu.adjs) if (ctx.knows('a.' + ad.key)) c.words.push('a.' + ad.key);
    c.bare = !a && (fd.mass || !!fd.pl);
    c.canon = renderEat(c, L);
    return c;
  }
  function renderEat(c, L) {
    const v = c.verbShow, fd = c.food, fu = c.foodU || { adjs: [] }, pl = !!fd.pl, noun = pl ? fd.plw || fd.show || fd.w : fd.w;
    if (L.code === 'de') {
      const kase = c.foodCase || 'acc', gk = pl ? 'pl' : fd.g;
      const indef = c.indef && !pl;
      const art = c.bare ? null : indef ? DE_INDEF[kase][gk] : DE_ART[kase][gk];
      const end = c.bare ? deEndStrong(kase, gk) : indef ? deEndMixed(kase, gk) : deEnd(kase, gk);
      const adjs = fu.adjs.map(x => (L.adjs[x.key] ? L.adjs[x.key].stem : x.show) + end);
      if (kase === 'dat') return [v, art === 'dem' ? 'vom' : 'von', art === 'dem' ? null : art, ...adjs, noun].filter(Boolean).join(' ');
      return [v, art, ...adjs, noun].filter(Boolean).join(' ');
    }
    const es = L.code === 'es', g = fd.g;
    const art = c.bare ? '' : c.indef ? (es ? (pl ? (g === 'f' ? 'unas' : 'unos') : (g === 'f' ? 'una' : 'un')) : (pl ? (g === 'f' ? 'umas' : 'uns') : (g === 'f' ? 'uma' : 'um')))
      : es ? (pl ? (g === 'f' ? 'las' : 'los') : (g === 'f' ? 'la' : 'el')) : (pl ? (g === 'f' ? 'as' : 'os') : (g === 'f' ? 'a' : 'o'));
    const adjs = fu.adjs.map(x => (pl ? x.tok.raw : adjForm(L, x, g)));
    return [v, art, noun, ...adjs].filter(Boolean).join(' ');
  }
  // the sentence for eating one food, for the Coach and the autopilot: «¡Come la manzana!», «Iss ein Brot!»
  // food: { w, pl, g, mass }; o: { indef, bare, pl }
  function sayEat(L, food, o = {}) {
    indexLang(L);
    const fd = { w: food.w, plw: food.pl, g: food.g || 'm', pl: !!o.pl, show: food.w };
    const c = { verbShow: L.verbs.eat.show, food: fd, foodU: { adjs: [] }, indef: !!o.indef, bare: !!(o.bare && (food.mass || o.pl)), foodCase: 'acc' };
    return wrapS(L, renderEat(c, L));
  }

  // ------------------------------------------------------------ German
  // the definite article by case and gender (pl = plural), and the adjective ending after it
  const DE_ART = { nom: { m: 'der', f: 'die', n: 'das', pl: 'die' }, acc: { m: 'den', f: 'die', n: 'das', pl: 'die' }, dat: { m: 'dem', f: 'der', n: 'dem', pl: 'den' }, gen: { m: 'des', f: 'der', n: 'des', pl: 'der' } };
  // the indefinite one: ein Käfer / einen Käfer · eine Motte · ein Gürteltier / einem Gürteltier / eines Gürteltiers
  const DE_INDEF = { nom: { m: 'ein', f: 'eine', n: 'ein' }, acc: { m: 'einen', f: 'eine', n: 'ein' }, dat: { m: 'einem', f: 'einer', n: 'einem' }, gen: { m: 'eines', f: 'einer', n: 'eines' } };
  // adjective endings after der/die/das (weak): das rote Gürteltier, den roten Käfer, dem roten Gürteltier
  const deEnd = (kase, gk) => (gk === 'pl' ? 'en' : kase === 'nom' || (kase === 'acc' && gk !== 'm') ? 'e' : 'en');
  // after ein-words (mixed): ein roter Käfer, ein rotes Gürteltier, eine rote Motte, einen roten Käfer, einem roten…
  const deEndMixed = (kase, gk) => (gk === 'pl' ? 'en' : kase === 'nom' && gk === 'm' ? 'er' : (kase === 'nom' || kase === 'acc') && gk === 'n' ? 'es'
    : (kase === 'nom' || kase === 'acc') && gk === 'f' ? 'e' : 'en');
  // with no article at all (strong): «Iss frisches Brot!»
  const STRONG = { nom: { m: 'er', f: 'e', n: 'es', pl: 'e' }, acc: { m: 'en', f: 'e', n: 'es', pl: 'e' }, dat: { m: 'em', f: 'er', n: 'em', pl: 'en' }, gen: { m: 'en', f: 'er', n: 'en', pl: 'er' } };
  const deEndStrong = (kase, gk) => STRONG[kase][gk];
  const endAfter = (art, kase, gk) => (!art ? deEndStrong(kase, gk) : art.indef ? deEndMixed(kase, gk) : deEnd(kase, gk));
  const readings = art => (art && art.r ? art.r.map(x => x.split('-')) : []);   // [[case, gender], …]
  const canBe = (art, kase) => readings(art).some(([k]) => k === kase);
  function parseGerman(toks, ctx) {
    const L = ctx.L, I = L.I;
    let k = 0;
    while (k < toks.length && skipTok(I, toks[k], ctx)) k++;
    const v = findVerb(toks, k, I);
    if (!v) return { fail: 'noverb', word: firstWord(toks, I, ctx) };
    const V = L.verbs[v.m.key];
    const c = newClause(v.m.key, toks[v.at], v.m);
    const pre = toks.slice(k, v.at).filter(t => !skipTok(I, t, ctx));
    let rest = toks.slice(v.at + 1).filter(t => !skipTok(I, t, ctx));
    if (V.particle) {
      const pi = rest.map(t => t.n).lastIndexOf(V.particle);
      if (pi >= 0) { c.verb = V.as; if (pi !== rest.length - 1) err(c, 'particle', true); rest = rest.slice(0, pi).concat(rest.slice(pi + 1)); }
      else { c.verb = 'grab'; err(c, 'particle', true); }
      c.baseVerb = V.as;
    }
    if (c.verb === 'sing' || c.verb === 'climb' || c.verb === 'blow' || c.verb === 'call' || c.verb === 'light' || c.verb === 'dig') { c.unknownToks = pre; spelling(c, Object.assign({ tok: toks[v.at] }, v.m)); return c; }   // (a song reaches everyone; a climb picks its own; a call brings the gulls: no target)
    const units = [], unknown = pre.slice();
    let cur = mkUnit(), pending = null;
    // a position said before anyone it could belong to («Schlag links den Frosch!») waits for the next one
    const push = () => { if (pending && cur.has && !cur.pos && !cur.food && !cur.stone) { cur.pos = pending; pending = null; } if (cur.has || cur.art || cur.preps.length) units.push(cur); cur = mkUnit(); };
    for (let i = 0; i < rest.length; i++) {
      const t = rest[i], n = t.n;
      // where it is, after the noun: «den Frosch links / rechts», «den Frosch in der Mitte»
      const pa = deAdvPos(rest, i, I);
      if (pa) {
        // (it goes with the one you mean, not with «mit dem Stein» or a food)
        const host = [cur].concat(units.slice().reverse()).find(u => (u.has || u.art) && !u.stone && !u.food) || null;
        const pos = Object.assign({ style: 'adv' }, pa);
        // «den links Frosch», «auf den links»: the word for after the noun, where the adjective goes («den linken Frosch», «den Linken»)
        if (host === cur && cur.art && !cur.noun && !cur.adjs.length && !pos.issue) pos.issue = 'ending';
        if (host) { host.pos = pos; host.has = true; } else pending = pos;
        i += pa.len - 1;
        continue;
      }
      if (I.preps.has(n)) {
        push();
        cur.preps.push(n === 'vom' ? 'von' : n);
        if (n === 'vom') cur.art = { n: 'dem', r: ['dat-m', 'dat-n'], tok: t, contracted: true };
        continue;
      }
      const adv = I.adv.get(n);
      if (adv) { c.adv.push(Object.assign({ tok: t }, adv)); continue; }
      if (I.pron.has(n)) { push(); cur.pron = { n, c: I.pron.get(n), tok: t }; cur.has = true; push(); continue; }
      const art = I.arts.get(n);
      if (art) { if (cur.has || (cur.art && !cur.art.contracted)) push(); cur.art = Object.assign({ tok: t }, art); continue; }
      const st = look(I.stones, n);
      if (st) { if (cur.has) push(); cur.stone = Object.assign({ tok: t }, st); cur.has = true; continue; }
      const pm = look(I.parts, n);
      if (pm) { if (cur.has) push(); cur.part = Object.assign({ tok: t }, pm); cur.has = true; continue; }
      const sm = look(I.species, n), smX = sm && sm.typo && (((x => x && !x.typo)(deAdj(I, n))) || ((x => x && !x.typo)(dePosAdj(I, n))));     // (P7a: «den Roten» is red, not a typo of «Kröten»)
      if (sm && !smX) { if (cur.noun || cur.part) push(); cur.noun = Object.assign({ tok: t }, sm); cur.has = true; continue; }
      const fm = I.foods.size ? look(I.foods, n) : null;
      if (fm) { if (cur.noun || cur.part || cur.food) push(); cur.food = foodOf(fm, t); cur.has = true; continue; }
      // where it is, as an adjective: «den linken Frosch», «die mittlere Motte», «den Rechten»
      const pj = dePosAdj(I, n);
      if (pj) { if (cur.part || cur.noun || cur.food) push(); cur.pos = Object.assign({ tok: t, style: 'adj' }, pj); cur.has = true; continue; }
      const am = deAdj(I, n);
      if (am) { if (cur.part || cur.noun || cur.food) push(); cur.adjs.push(Object.assign({ tok: t }, am)); cur.has = true; continue; }
      unknown.push(t);
    }
    push();
    if (pending) {
      const host = units.slice().reverse().find(u => (u.noun || u.adjs.length) && !u.pos);
      if (host) host.pos = pending; else { const u = mkUnit(); u.pos = pending; u.has = true; units.push(u); }   // «Spring links!»: just a position
    }
    c.unknownToks = unknown;
    const ef = eatUnits(c, units);
    if (ef) return ef;
    if (c.verb === 'eat') { spelling(c, Object.assign({ tok: toks[v.at] }, v.m)); return c; }
    const partU = units.find(u => u.part);
    const instrU = units.find(u => u.preps.includes('mit'));
    // whose part: a dative («dem Roten», «der roten Motte»), a genitive («des Roten»), «von …» or «ihm / ihr»
    const ownerArt = a => !!a && (canBe(a, 'dat') || canBe(a, 'gen')) && !canBe(a, 'acc');
    const isOwner = u => u !== partU && u !== instrU && (u.pron || (u.art && u.art.n === 'des') || (partU && ((ownerArt(u.art) && !u.preps.length) || u.preps.includes('von'))));
    const ownerU = units.find(isOwner);
    const others = units.filter(u => u !== partU && u !== instrU && u !== ownerU && (u.noun || u.adjs.length || u.pos));
    // «Schlag dem Frosch links auf den Kopf»: a position on the part goes with whose part it is
    if (partU && partU.pos) { const host = ownerU || others[0]; if (host && !host.pos) host.pos = partU.pos; partU.pos = null; }
    if (partU) {
      c.part = partU.part; c.partU = partU;
      const ou = ownerU || others[0] || null;
      if (ou) {
        c.owner = merged([ou]); c.ownerU = ou;
        const a = ou.art, after = units.indexOf(ou) > units.indexOf(partU);
        // «der roten Motte» is dative before the part (Spring der Motte auf den Kopf) and genitive after it (auf den Kopf der Motte)
        c.ownerStyle = ou.pron ? 'pron' : ou.preps.includes('von') ? 'von' : !a ? 'acc' : canBe(a, 'gen') && !canBe(a, 'dat') ? 'gen'
          : canBe(a, 'gen') && canBe(a, 'dat') ? (after ? 'gen' : 'dat') : ownerArt(a) ? 'dat' : 'acc';
      }
    } else {
      c.desc = merged(ownerU ? [ownerU].concat(others) : others);
      c.descU = ownerU || others[0] || null;
    }
    if (instrU) { c.instrU = instrU; if (instrU.stone) c.instr = instrU; }
    spelling(c, Object.assign({ tok: toks[v.at] }, v.m));
    return c;
  }
  // Case and gender: the one you act on is accusative (den Käfer, die Motte, das Gürteltier), whose
  // part is dative or genitive (dem Käfer, der Motte, dem Gürteltier · des Käfers, der Motte, des
  // Gürteltiers). g: the creature's gender. The ein-words count too (einen Käfer, eine Motte, ein
  // Gürteltier · einem, einer, eines).
  // An article of the right case but the wrong gender («den Motte», «den Gürteltier») is a gender
  // slip; one of another case («der» for the one you hit, «dem Gürteltier» for the one you push) is
  // a case slip. «der Gürteltier» is neither: it treats a das-word as a der-word, so it's gender.
  // The adjective ending is checked against the article you chose (der-words, ein-words or none),
  // so «den roten Motte» counts once (gender), not twice. o.bare: no article is fine («Iss Brot!»).
  function checkDe(c, u, kase, g, pl, o = {}) {
    const gk = pl ? 'pl' : g || 'm', want = DE_ART[kase][gk], art = u.art;
    const ok = [[kase, gk]];
    if (!art && !u.pron) { if (!o.bare) err(c, 'article'); }
    else if (art && !art.poss) {
      const rd = readings(art);
      const fits = art.indef ? rd.some(([k, x]) => k === kase && x === gk) : art.n === want;
      if (!fits) {
        const sameK = rd.some(([k, x]) => k === kase && x !== 'pl'), sameG = rd.some(([k, x]) => x === gk && k !== kase);
        // «ein» for «einen Käfer» could be a neuter accusative or the masculine nominative: the case is what slipped
        err(c, sameK && !(art.indef && sameG) ? 'gender' : sameG ? 'case' : gk === 'n' && rd.some(([k]) => k === 'nom') ? 'gender' : 'case');
        // the endings that fit the article you chose (same case, or same gender), so they aren't counted twice
        for (const [k, x] of rd) if ((k === kase && (x !== 'pl' || pl)) || x === gk) ok.push([k, x]);
      }
    }
    for (const a of u.adjs) {
      if (a.known === false) continue;
      if (!ok.some(([k, x]) => a.end === endAfter(art, k, x))) err(c, 'ending');
      spelling(c, a);
    }
    if (u.noun && u.noun.known) spelling(c, u.noun);
    // where it is: an adjective takes the same endings («den linken Frosch», «die mittlere Motte»); after the noun,
    // «links / rechts / in der Mitte» (with the slip noted while reading it, if any)
    const p = o.pos !== undefined ? o.pos : u.pos;
    if (p && p.known) {
      if (p.fix) err(c, 'position');
      if (p.style === 'adj') { if (!ok.some(([k, x]) => p.end === endAfter(art, k, x))) err(c, 'ending'); spelling(c, p); }
      else { if (p.issue) err(c, p.issue); spelling(c, p); }
    }
  }
  // «ihm» (him / it, a der- or das-word), «ihr» (her / it, a die-word)
  function checkPron(c, u, g) { if (u && u.pron && (u.pron.n === 'ihr') !== (g === 'f')) err(c, 'gender'); }
  function finishGerman(c, ctx) {
    if (c.verb === 'eat') return finishEat(c, ctx);
    if (c.verb === 'sing' || c.verb === 'climb' || c.verb === 'blow' || c.verb === 'call' || c.verb === 'light' || c.verb === 'dig') return finishSing(c, ctx);     // (blow: a gust over everyone, the Frost Peaks; call: the gulls, Port Brisa)
    if (c.verb === 'push' && c.part) return { fail: 'pushPart', word: c.part.tok.raw };   // Mimo pushes the whole creature
    c.words.push('v.' + (c.verb === 'grab' ? 'attack' : c.verb));
    const r = resolve(c, ctx);
    if (r.fail) return r;
    c.target = r.target; c.auto = !!r.auto; c.multi = !!r.multi; c.partKey = r.part || null; c.ambiguous = r.ambiguous || null;
    const L = ctx.L, sg = L.species[c.target.species].g;
    if (c.part && c.partKey) {
      const pu = c.partU, P = L.parts[c.partKey];
      // «die Flügel» (both wings) or «den Flügel» (one): the article tells the number
      c.partPl = !!(c.part.pl || (P.pl && nrm(P.pl) === nrm(P.w) && pu.art && pu.art.n === 'die'));
      const want = c.partPl ? 'die' : DE_ART.acc[P.g];
      if (!pu.art) err(c, 'article');
      else if (!pu.art.poss && pu.art.n !== want) err(c, canBe(pu.art, 'acc') ? 'gender' : 'case');   // "auf dem Kopf" = staying on it, not landing on it
      spelling(c, c.part);
      if (c.verb === 'jump' && !pu.preps.includes('auf')) err(c, 'prep');
      if (c.verb === 'hit' && !pu.preps.length) fix(c, 'style');   // "Schlag den Kopf" → "Schlag auf den Kopf"
      if (c.ownerShown && c.ownerU) {
        const st = c.ownerStyle;
        if (st === 'acc' && c.verb !== 'hit') err(c, 'case');
        else if (st === 'pron') checkPron(c, c.ownerU, sg);
        else checkDe(c, c.ownerU, st === 'gen' ? 'gen' : st === 'acc' ? 'acc' : 'dat', sg, false, { pos: c.owner.pos });
      }
      c.words.push('n.' + c.part.key);
      descWords(c, c.owner);
    } else if (!c.auto) {
      const u = c.part ? c.ownerU : c.descU;
      if (u && !u.pron) {
        checkDe(c, u, 'acc', sg, false, { pos: (c.part ? c.owner : c.desc).pos });
        if (c.verb === 'jump' && !u.preps.includes('auf')) err(c, 'prep');
        if (c.verb === 'push' && u.preps.some(p => p !== 'gegen')) err(c, 'prep');   // «Schieb das Gürteltier!» (or «gegen das …»)
      }
      descWords(c, c.part ? c.owner : c.desc);
    }
    if (c.instr) {
      const iu = c.instr;
      if (!iu.art) err(c, 'article'); else if (iu.art.n !== 'dem') err(c, 'case');
      c.words.push('n.stone');
    } else if (c.instrU) c.unknownToks.push(c.instrU.art ? c.instrU.art.tok : { raw: 'mit' });
    if (c.verb === 'attack') {
      const d = c.part ? c.owner : c.desc;
      let ch = c.partKey ? 1 : 0;
      if (!c.auto && d && d.described) ch += 1 + Math.max(0, d.adjs.filter(a => a.known).length - (d.noun && d.noun.known ? 0 : 1));
      ch += c.adv.length + (c.instr ? 1 : 0);
      c.charge = Math.min(4, ch);
    }
    for (const a of c.adv) c.words.push('d.' + nrm(a.show));
    c.canon = renderGerman(c, ctx.L);
    return c;
  }
  // "den Roten", "den großen Roten", "den roten Schweigling", "die rote Motte", "der roten Motte"
  // (case: acc / dat / gen / von), in the creature's gender
  function deNP(L, target, d, kase = 'acc') {
    if (!d) return null;
    if (d.pron) return d.pron.n;
    const S = L.species[target.species], g = S.g, k = kase === 'von' ? 'dat' : kase;
    const art = kase === 'von' ? (g === 'f' ? 'von der' : 'vom') : DE_ART[k][g];
    // sizes before colors: "den großen Blauen"
    const sizeFirst = a => (a.key === 'big' || a.key === 'small' ? 0 : 1);
    const adjs = d.adjs.filter(a => a.known).sort((x, y) => sizeFirst(x) - sizeFirst(y)).map(a => L.adjs[a.key].stem + deEnd(k, g));
    const named = !!(d.noun && d.noun.known);
    // where it is: first among the adjectives («den linken roten Frosch», «den Linken»), or after the noun as you
    // said it («den Frosch links», «den Roten in der Mitte»)
    const pk = posKeyOf(d), P = pk && L.positions ? L.positions[pk] : null;
    const after = P && d.pos && d.pos.known && d.pos.style === 'adv' && (named || adjs.length);
    if (P && !after) adjs.unshift(P.stem + deEnd(k, g));
    const tail = after ? ' ' + P.adv : '';
    if (named) return [art, ...adjs, kase === 'gen' ? S.gen || S.w : S.w].join(' ') + tail;
    if (!adjs.length) return null;
    adjs[adjs.length - 1] = capF(adjs[adjs.length - 1]);
    return [art, ...adjs].join(' ') + tail;
  }
  function renderGerman(c, L) {
    const v = c.verbShow;
    const mid = [...c.adv.map(a => a.show), c.instr ? 'mit dem Stein' : ''].filter(Boolean);
    if (c.part && c.partKey) {
      const P = L.parts[c.partKey], g = L.species[c.target.species].g;
      const partNP = c.partPl ? 'die ' + (P.pl || P.w) : DE_ART.acc[P.g] + ' ' + P.w;
      // whose: the one you named, or the one Mimo picked among look-alikes («auf den Kopf des linken Frosches»)
      const added = !c.ownerShown && c.ownerAdd, st = added ? 'gen' : c.ownerStyle || 'dat', od = c.ownerShown ? c.owner : added || null;
      const own = od ? deNP(L, c.target, od, st === 'pron' ? 'acc' : st) : null;
      if (c.verb === 'attack' || c.verb === 'grab') return [v, partNP, own && st === 'gen' ? own : '', ...mid, 'an'].filter(Boolean).join(' ');
      if (!own) return `${v} auf ${partNP}`;
      if (st === 'gen' || st === 'von') return `${v} auf ${partNP} ${own}`;
      if (st === 'acc' && c.verb === 'hit') return `${v} ${own} auf ${partNP}`;
      return `${v} ${st === 'pron' ? (g === 'f' ? 'ihr' : 'ihm') : deNP(L, c.target, od, 'dat')} auf ${partNP}`;
    }
    const np = c.auto ? null : deNP(L, c.target, c.desc, 'acc');
    switch (c.verb) {
      case 'jump': return np ? `${v} auf ${np}` : v;
      case 'hit': case 'push': return np ? `${v} ${np}` : v;
      case 'attack': case 'grab': return [v, np, ...mid, 'an'].filter(Boolean).join(' ');
    }
    return v;
  }

  // ------------------------------------------------------------ shared
  function splitCombo(toks, L) {
    const I = L.I, out = [[]];
    for (let k = 0; k < toks.length; k++) {
      let used = 0;
      for (const seq of I.conj) {
        if (!seq.every((w, j) => toks[k + j] && toks[k + j].n === w)) continue;
        const next = toks[k + seq.length];
        if (seq.length === 1 && !(next && look(I.verbs, next.n))) continue;
        used = seq.length;
        break;
      }
      if (used && out[out.length - 1].length) { out.push([]); k += used - 1; continue; }
      out[out.length - 1].push(toks[k]);
    }
    return out.filter(p => p.length);
  }
  function parseTalk(text, ctx) {
    const L = ctx.L, I = L.I;
    const s = ' ' + tokenize(text).map(t => t.n).join(' ') + ' ';
    const ids = I.talk.filter(t => t.p.some(p => s.includes(p))).map(t => t.id);
    if (!ids.length) return null;
    const r = { ok: true, kind: 'talk', raw: text, ids, errors: [], fixes: [], clauses: [], words: ids.map(id => 't.' + id), untaught: [], patterns: ['talk'] };
    let canon = text.trim();
    if (L.talkAdj && ctx.shy) {
      const g = L.species[ctx.shy.species].g;
      const right = Object.keys(L.talkAdj).find(f => L.talkAdj[f] === g);
      for (const [form, fg] of Object.entries(L.talkAdj)) {
        if (fg === g || !s.includes(' ' + nrm(form) + ' ')) continue;
        canon = canon.replace(new RegExp(form, 'i'), m => (m[0] === m[0].toUpperCase() ? capF(right) : right));
        r.errors.push({ kind: 'gender', major: false });
      }
    }
    r.canon = canon;
    r.recast = r.errors.length > 0;
    return r;
  }
  const wrapS = (L, s) => (L.code === 'es' ? '¡' : '') + capF(s) + '!';

  // ctx: { L, foes: [targetable foes], knows: id => bool, voc: Set of extra names, shy: foe|null }
  function parse(text, ctx) {
    const L = ctx.L;
    indexLang(L);
    const toks = tokenize(text);
    const out = { ok: false, raw: text };
    if (!toks.length || toks.every(t => skipTok(L.I, t, ctx))) return Object.assign(out, { reason: 'empty' });
    const pieces = splitCombo(toks, L).slice(0, ctx.maxClauses || 2);     // (combos: two moves, more once Bruno has taught them: battle/tactics.js)
    const clauses = [];
    for (const p of pieces) {
      let c = L.code === 'de' ? parseGerman(p, ctx) : parseRomance(p, ctx);
      if (c.fail === 'noverb' && !clauses.length && pieces.length === 1) {
        const talk = parseTalk(text, ctx);
        if (talk) return talk;
      }
      if (c.fail) return Object.assign(out, { reason: c.fail, word: c.word });
      if (c.unknownToks.length) return Object.assign(out, { reason: 'unknown', word: c.unknownToks[0].raw });
      if (!ctx.knows('v.' + c.baseVerb)) return Object.assign(out, { reason: 'unknownVerb', word: c.verbTok.raw, id: 'v.' + c.baseVerb, verb: c.baseVerb });
      c = L.code === 'de' ? finishGerman(c, ctx) : finishRomance(c, ctx);
      if (c.fail) return Object.assign(out, { reason: c.fail, word: c.word });
      clauses.push(c);
    }
    if (!clauses.length) return Object.assign(out, { reason: 'noverb' });
    // eating takes the whole turn: «Come la manzana», on its own
    if (clauses.length > 1 && clauses.some(c => c.verb === 'eat')) return Object.assign(out, { reason: 'eatCombo' });
    const canon = wrapS(L, clauses.map(c => c.canon).join(` ${L.joiner} `));
    const errors = clauses.flatMap(c => c.errors), fixes = clauses.flatMap(c => c.fixes);
    const patterns = new Set();
    for (const c of clauses) {
      c.power = c.errors.length ? (c.errors.some(e => e.major) ? 0.6 : 0.75) : 1;
      if (c.verb === 'eat') patterns.add('eat');
      else if (c.partKey) patterns.add('part'); else patterns.add(c.auto ? 'verb' : c.verb + '+target');
      if (c.partKey && c.ownerShown) patterns.add('possessive');
      if ([c.desc, c.ownerShown ? c.owner : null].some(d => d && d.pos && d.pos.known) && !c.auto) patterns.add('position');
      if (!c.auto && c.desc && c.desc.rel && c.desc.rel.adj) patterns.add('relative');
      if (c.verb === 'throw') patterns.add('throw-' + c.obj);
      if (c.inho || (c.verb === 'throw' && c.obj !== 'medium')) patterns.add('inho-ao');
      if (c.verb === 'attack' || c.verb === 'grab') patterns.add('separable');
      if (c.charge >= 2) patterns.add('charge');
      if (c.instr) patterns.add('instrument');
    }
    if (clauses.length > 1) patterns.add('combo');
    return {
      ok: true, kind: 'command', raw: text, clauses, canon, errors, fixes, eat: clauses[0].verb === 'eat',
      // (an ambiguous one is said back too: Mimo's guess, with where it is)
      recast: errors.length > 0 || fixes.length > 0 || clauses.some(c => c.ambiguous && !c.ambiguous.untaught),
      words: uniq(clauses.flatMap(c => c.words)), untaught: clauses.flatMap(c => c.untaught), patterns: [...patterns],
    };
  }

  // Builds the sentence for an action the way a fluent speaker would say it. Used for Mimo's
  // suggestions ("¿Sobre el rojo?") and by the test autopilot, which also checks the parser accepts it.
  // o: { adjs: [keys], lex, noun (say the creature's name), rel: {adj: {key}}, part, partPl (both wings), owner: [keys],
  //      ownerNoun, ownerStyle, obj (stone kind), adv: [], instr, pos ('left' | 'middle' | 'right'), posStyle (de: 'adj' «den
  //      linken Frosch» | 'adv' «den Frosch links»), ownerPos }
  function sayClause(L, verb, target, o = {}) {
    indexLang(L);
    const K = keys => (keys || []).map(key => ({ key, keys: [key], lex: o.lex || 0, known: true }));
    const noun = on => (on ? { key: target.species, known: true } : null);
    const where = key => (key ? { key, known: true, style: o.posStyle || 'adj' } : null);
    const desc = { adjs: K(o.adjs), noun: noun(o.noun), rel: o.rel ? { cop: 'estar', adj: Object.assign({ known: true, lex: 0 }, o.rel.adj) } : null, preps: [], pos: where(o.pos) };
    desc.described = !!(desc.adjs.length || desc.noun || desc.rel || desc.pos);
    const show = L.verbs[verb] ? L.verbs[verb].show : verb === 'attack' ? 'greif' : verb;
    const c = { verb, verbShow: show, target, desc, auto: !desc.described, adv: (o.adv || []).map(s => ({ show: s })), instr: o.instr ? {} : null };
    if (o.part) {
      const P = L.parts[o.part], pl = !!(o.partPl && P.pl);
      c.part = { key: o.part, show: pl ? P.pl : P.w, g: P.g, pl }; c.partKey = o.part; c.partPl = pl;
      if ((o.owner && o.owner.length) || o.ownerNoun || o.ownerPos) {
        c.owner = { adjs: K(o.owner), noun: noun(o.ownerNoun), preps: [], described: true, pos: where(o.ownerPos) }; c.ownerShown = true; c.ownerStyle = o.ownerStyle || 'dat';
      }
      c.auto = false;
    }
    if (o.obj) { c.obj = o.obj; c.stoneTwist = true; }
    return L.code === 'de' ? renderGerman(c, L) : renderRomance(c, L);
  }
  const sayAction = (L, verb, target, o) => wrapS(L, sayClause(L, verb, target, o));

  // Mimo's recast: the right sentence, with what you missed underlined and accent fixes marked
  function recastHTML(canon, raw, escFn) {
    const toks = tokenize(raw), user = new Set(toks.map(t => t.n)), userRaw = new Set(toks.map(t => t.raw.toLowerCase()));
    return canon.split(/(\s+)/).map(w => {
      if (/^\s+$/.test(w)) return w;
      const core = w.replace(/[¡!¿?.,]/g, '');
      if (!core) return escFn(w);
      if (!user.has(nrm(core))) return `<b class="fx">${escFn(w)}</b>`;
      if (!userRaw.has(core.toLowerCase())) return `<b class="ac">${escFn(w)}</b>`;
      return escFn(w);
    }).join('');
  }

  _.P = { nrm, tokenize, near1, indexLang, setFoods, look, deAdj, parse, parseTalk, sayClause, sayAction, sayEat, wrapS, recastHTML, hasTrait, capF, MAJOR, DE_ART, DE_INDEF,
    POS_KEYS, order, posKeysOf, posPick, posMend, lookAlike,
    // (for the zh / ja parser below: picking who is meant works the same in every language)
    resolve, descWords, posKeyOf, autoPick };
})();

// ================================================================ Chinese and Japanese, part 1: reading what you typed (game/CJK.md)
// Neither language puts spaces between words, so a command becomes a row of units: toneless pinyin syllables (zh, each with
// the character or the tone you typed) or kana (ja: hiragana, from kana, from rōmaji, or a kanji as typed). Every word the
// battle knows (battle/lang.js L.zh / L.ja, plus the grammar words below) is a pattern of units, and the cheapest cover
// (cover) splits the row into words: a word typed in characters has to be the right characters (a homophone still counts,
// as a character slip), tones and long vowels may be left out, and anything left over is an unknown word.
(() => {
  const _ = window.BATTLE._;
  const CJ = () => (typeof CJK !== 'undefined' ? CJK : null);
  const isHan = c => /[㐀-鿿豈-﫿々〇]/.test(c);
  const isKana = c => /[ぁ-ゖゝゞァ-ヺー-ヾ]/.test(c);
  // the grammar words: [kind, key, notation]
  const GZ = [
    ['de', 'de', '[的|de]'], ['ba', 'ba', '[把|bǎ]'], ['yong', 'yong', '[用|yòng]'], ['yong', 'na', '[拿|ná]'], ['with', 'he', '[和|hé]'], ['with', 'gen', '[跟|gēn]'],
    ['dao', 'dao', '[到|dào]'], ['shang', 'shang', '[上|shàng]'], ['shang', 'shangmian', '[上面|shàng miàn]'], ['shang', 'shenshang', '[身上|shēn shang]'], ['shang', 'shangqu', '[上去|shàng qù]'],
    ['zai', 'zai', '[在|zài]'], ['toward', 'xiang', '[向|xiàng]'], ['toward', 'chao', '[朝|cháo]'], ['toward', 'wang', '[往|wǎng]'],
    ['asp', 'le', '[了|le]'], ['asp', 'zhe', '[着|zhe]'], ['asp', 'guo', '[过|guò]'],
    ['conj', 'ranhou', '[然后|rán hòu]'], ['conj', 'zai', '[再|zài]'], ['conj', 'jiezhe', '[接着|jiē zhe]'], ['conj', 'zhihou', '[之后|zhī hòu]'], ['conj', 'ranhou', '[然后|rán hòu] [再|zài]'],
    ['conj', 'zuihou', '[最后|zuì hòu]'],     // (combos: 先…，然后…，最后…: battle/tactics.js)
    ['first', 'xian', '[先|xiān]'], ['first', 'xian', '[首先|shǒu xiān]'], ['most', 'zui', '[最|zuì]'],
    ['det', 'zhe', '[这|zhè]'], ['det', 'na', '[那|nà]'], ['num', '1', '[一|yī]'], ['num', '2', '[两|liǎng]'], ['num', '2', '[二|èr]'], ['num', '3', '[三|sān]'],
    ['cl', '只', '[只|zhī]'], ['cl', '个', '[个|gè]'], ['cl', '颗', '[颗|kē]'], ['cl', '粒', '[粒|lì]'], ['cl', '位', '[位|wèi]'], ['cl', '条', '[条|tiáo]'], ['cl', '块', '[块|kuài]'],
    ['cl', '张', '[张|zhāng]'], ['cl', '本', '[本|běn]'], ['cl', '匹', '[匹|pǐ]'], ['cl', '片', '[片|piàn]'], ['cl', '罐', '[罐|guàn]'], ['cl', '瓶', '[瓶|píng]'],
    ['fill', '', '[请|qǐng]'], ['fill', '', '[快|kuài]'], ['fill', '', '[快点|kuài diǎn]'], ['fill', '', '[吧|ba]'], ['fill', '', '[啊|a]'], ['fill', '', '[呀|ya]'], ['fill', '', '[嘛|ma]'],
    ['fill', '', '[一下|yī xià]'], ['fill', '', '[你|nǐ]'], ['fill', '', '[去|qù]'], ['fill', '', '[赶快|gǎn kuài]'], ['fill', '', '[赶紧|gǎn jǐn]'], ['fill', '', '[马上|mǎ shàng]'], ['fill', '', '[立刻|lì kè]'],
    ['fill', '', '[现在|xiàn zài]'], ['fill', '', '[嘿|hēi]'], ['fill', '', '[喂|wèi]'], ['fill', '', '[加油|jiā yóu]'], ['fill', '', '[用力|yòng lì]'], ['fill', '', '[使劲|shǐ jìn]'],
    ['fill', '', '[狠狠|hěn hěn] [地|de]'], ['fill', '', '[狠狠|hěn hěn]'], ['fill', '', '[好|hǎo]'], ['fill', '', '[来|lái]'], ['fill', '', '[一起|yī qǐ]'],
    ['voc', '', '[米莫|Mǐ mò]'],
    // talk (and negation: Mimo doesn't take «don't» commands yet), so the cover never finds a verb inside them
    ['talk', '', '[打架|dǎ jià]'], ['talk', '', '[朋友|péng you]'], ['talk', '', '[我们|wǒ men]'], ['talk', '', '[我|wǒ]'], ['talk', '', '[是|shì]'], ['talk', '', '[想|xiǎng]'], ['talk', '', '[要|yào]'],
    ['talk', '', '[不要|bù yào]'], ['talk', '', '[怕|pà]'], ['talk', '', '[害怕|hài pà]'], ['talk', '', '[会|huì]'], ['talk', '', '[不会|bù huì]'], ['talk', '', '[伤害|shāng hài]'], ['talk', '', '[冷静|lěng jìng]'],
    ['talk', '', '[没事|méi shì]'], ['talk', '', '[做|zuò]'], ['talk', '', '[不用|bù yòng]'], ['talk', '', '[别|bié]'], ['talk', '', '[不|bù]'], ['talk', '', '[没|méi]'],
  ];
  const GJ = [
    ['p', 'wo', 'を'], ['p', 'ni', 'に'], ['p', 'de', 'で'], ['p', 'no', 'の'], ['p', 'no', 'やつ'], ['p', 'ga', 'が'], ['p', 'wa', 'は'], ['p', 'to', 'と'], ['p', 'e', 'へ'], ['p', 'mo', 'も'], ['na', 'na', 'な'],
    ['ue', 'ue', '[上|うえ]'], ['iru', 'iru', 'いる'], ['iru', 'iru', 'いて'],
    ['conj', 'sorekara', 'それから'], ['conj', 'soshite', 'そして'], ['conj', 'ato', 'あと'], ['conj', 'tsugi', '[次|つぎ]に'], ['conj', 'kara', 'から'], ['first', 'mazu', 'まず'],
    ['conj', 'saigo', '[最後|さいご]に'],     // (combos: まず…、それから…、最後に…: battle/tactics.js)
    ['det', 'kono', 'この'], ['det', 'sono', 'その'], ['det', 'ano', 'あの'],
    ['fill', '', 'ください'], ['fill', '', 'ちょうだい'], ['fill', '', 'ね'], ['fill', '', 'よ'], ['fill', '', 'ねえ'], ['fill', '', 'ほら'], ['fill', '', 'さあ'], ['fill', '', '[早|はや]く'],
    ['fill', '', 'もっと'], ['fill', '', 'ちょっと'], ['fill', '', 'お[願|ねが]い'], ['fill', '', '[今|いま]'], ['fill', '', 'すぐ'], ['fill', '', 'おい'], ['fill', '', 'よし'], ['fill', '', 'いちばん'],
    ['fill', '', '[一番|いちばん]'], ['fill', '', 'だ'], ['fill', '', 'です'], ['fill', '', 'ぞ'], ['fill', '', 'ちゃん'], ['fill', '', 'くん'], ['fill', '', 'がんばって'], ['fill', '', '[思|おも]いっきり'],
    ['fill', '', '[強|つよ]く'], ['fill', '', 'じゃあ'],
    ['voc', '', 'ミモ'],
    ['talk', '', 'けんか'], ['talk', '', 'したくない'], ['talk', '', 'しない'], ['talk', '', 'たたかいたくない'], ['talk', '', 'たたかわない'], ['talk', '', 'ともだち'], ['talk', '', '[友達|ともだち]'],
    ['talk', '', 'なかま'], ['talk', '', '[仲間|なかま]'], ['talk', '', 'こわくない'], ['talk', '', '[怖|こわ]くない'], ['talk', '', 'こわがらないで'], ['talk', '', 'だいじょうぶ'], ['talk', '', '[大丈夫|だいじょうぶ]'],
    ['talk', '', 'おちついて'], ['talk', '', 'いじめない'], ['talk', '', 'きずつけない'], ['talk', '', 'なにも'], ['talk', '', 'やめよう'], ['talk', '', 'やめて'],
  ];

  // ---------------------------------------------------------------- kana helpers (ja)
  const SMALL = 'ぁぃぅぇぉゃゅょゎ';
  const loose = k => String(k).replace(/は/g, 'わ').replace(/へ/g, 'え').replace(/を/g, 'お').replace(/ぢ/g, 'じ').replace(/づ/g, 'ず');
  // kana → morae, with っ joined to what follows and small kana to what comes before; ー on its own (a long mark)
  function morae(k) {
    const c = [...k], out = [];
    for (let i = 0; i < c.length; i++) {
      let m = c[i];
      if (m === 'っ' && i + 1 < c.length && c[i + 1] !== 'ー') m += c[++i];
      while (i + 1 < c.length && SMALL.includes(c[i + 1])) m += c[++i];
      out.push(m);
    }
    return out;
  }
  const vowelOf = m => { const C = CJ(); if (!m || !C) return ''; const r = C.romaji(m); return /[aiueo]$/.test(r) ? r.slice(-1) : ''; };
  // a long mark: ー, or a vowel that only stretches the one before it (おう, おお, うう, ああ, いい, えい, ええ)
  function isLong(m, prev) {
    if (m === 'ー') return true;
    const v = vowelOf(prev);
    return (m === 'う' && (v === 'o' || v === 'u')) || (m === 'お' && v === 'o') || (m === 'あ' && v === 'a') || (m === 'い' && (v === 'i' || v === 'e')) || (m === 'え' && v === 'e');
  }

  // ---------------------------------------------------------------- the lexicon: every word as a pattern of units
  function prep(e, l) {
    const C = CJ(), toks = C.parse(e.src, l).filter(t => t.segs);
    if (l === 'zh') {
      e.ch = []; e.syl = []; e.tone = [];
      for (const t of toks) for (const g of t.segs) {
        if (!g.han) continue;
        const ch = [...g.s], sy = String(g.r || '').split(' ');
        ch.forEach((c, k) => { e.ch.push(c); e.syl.push(C.toneless(sy[k] || '')); e.tone.push(C.toneOf(sy[k] || '')); });
      }
      return e.syl.length ? e : null;
    }
    e.segs = [];
    for (const t of toks) for (const g of t.segs) e.segs.push(g.han ? { han: true, s: g.s, k: C.toHira(g.r || '') } : { han: false, s: g.s, k: C.toHira(g.s) });
    e.kana = e.segs.map(g => g.k).join(''); e.surf = e.segs.map(g => g.s).join('');
    return e.kana ? e : null;
  }
  function index(C) {
    const add = (M, k, e) => { if (!k) return; let a = M.get(k); if (!a) M.set(k, a = []); a.push(e); };
    C.bySyl = new Map(); C.byCh = new Map(); C.byKana = new Map();
    for (const e of C.E.concat(C.foods)) {
      if (C.l === 'zh') { add(C.bySyl, e.syl[0], e); add(C.byCh, e.ch[0], e); continue; }
      add(C.byKana, loose(e.kana[0]), e);
      if (e.segs[0].han) add(C.byCh, [...e.segs[0].s][0], e); else add(C.byCh, e.segs[0].s[0], e);
    }
  }
  function lexOf(L) {
    if (L.CJ) return L.CJ;
    const l = L.code, E = [];
    const add = (cat, key, src, x) => { if (!src) return; const e = prep(Object.assign({ cat, key, src }, x || {}), l); if (e) E.push(e); };
    for (const [k, s] of Object.entries(L.species)) for (const w of [s.w].concat(s.alt || [])) add('noun', k, w);
    for (const [k, p] of Object.entries(L.positions)) for (const w of [p.w].concat(p.alt || [])) add('pos', k, w);
    for (const [k, p] of Object.entries(L.parts)) for (const w of [p.w].concat(p.alt || [])) add('part', k, w);
    for (const [k, a] of Object.entries(L.adjs)) for (const [w, style] of a.cj) add('adj', k, w, { style, state: !!a.state });
    for (const [k, v] of Object.entries(L.verbs)) for (const [w, form, obj] of v.cj) add('verb', k, w, { form, obj: obj || null });
    if (L.stone) for (const w of [L.stone.w].concat(L.stone.alt || [])) add('stone', 'stone', w);
    for (const [cat, key, w] of l === 'zh' ? GZ : GJ) add(cat, key, w);
    const C = (L.CJ = { l, E, foods: [] });
    index(C);
    return C;
  }
  // the food in this battle's bag (P.setFoods): [{ id, w, alt }] in the language
  function setFoods(L, list) {
    const C = lexOf(L), l = L.code;
    C.foods = [];
    for (const f of list || []) for (const w of [f.w].concat(f.alt || [])) { const e = prep({ cat: 'food', key: f.id, src: w, food: f }, l); if (e) C.foods.push(e); }
    index(C);
  }

  // ---------------------------------------------------------------- what you typed, as units
  // zh: { syl (toneless), tone, toneTyped, han, ch, raw }; marks[i] = ',' or '.' before unit i
  function zhUnits(text) {
    const C = CJ(), U = [], marks = [], s = String(text == null ? '' : text).normalize('NFC');
    const mark = m => { if (!marks[U.length] || m === '.') marks[U.length] = m; };
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (isHan(ch)) {
        let j = i; while (j < s.length && isHan(s[j])) j++;
        for (const p of C.lookup(s.slice(i, j), 'zh')) {
          const cs = [...p.s], sy = String(p.r || '').split(' ').filter(Boolean);
          // grp: part of a longer word the engine knows (苹果): then it's that word, never a look-alike sound of ours
          cs.forEach((c, k) => U.push({ han: true, ch: c, syl: C.toneless(sy.length === cs.length ? sy[k] : (C.lookup(c, 'zh')[0] || {}).r || ''), tone: 0, toneTyped: false, raw: c, grp: cs.length > 1 }));
        }
        i = j; continue;
      }
      if (/[A-Za-zÀ-ɏ̀-ͯ:]/.test(ch)) {
        let j = i; while (j < s.length && /[A-Za-zÀ-ɏ̀-ͯ:'1-5]/.test(s[j])) j++;
        latinZh(C, s.slice(i, j), U);
        i = j; continue;
      }
      if (/[，,、;；]/.test(ch)) mark(',');
      else if (/[。.！!？?]/.test(ch)) mark('.');
      i++;
    }
    return { U, marks };
  }
  // pinyin letters → syllables: a tone digit or an apostrophe ends a piece; marks (ā á ǎ à) give the tone
  function latinZh(C, run, U) {
    for (const m of run.matchAll(/([^1-5']+)([1-5]?)|'/g)) {
      if (!m[1]) continue;
      const letters = [];
      for (const c of m[1].normalize('NFD')) {
        if (/[̀-ͯ]/.test(c)) { const t = { '̄': 1, '́': 2, '̌': 3, '̀': 4 }[c] || 0; if (t && letters.length) letters[letters.length - 1].t = t; continue; }
        if (/[a-z]/i.test(c)) letters.push({ c: c.toLowerCase() === 'v' ? 'u' : c.toLowerCase(), t: 0 });
      }
      if (!letters.length) continue;
      const syls = C.segment(letters.map(x => x.c).join(''));
      let k = 0;
      syls.forEach((sy, n) => {
        const span = letters.slice(k, k + sy.length); k += sy.length;
        let tone = Math.max(0, ...span.map(x => x.t)), typed = tone > 0;
        if (n === syls.length - 1 && m[2]) { tone = +m[2] === 5 ? 0 : +m[2]; typed = true; }
        U.push({ han: false, syl: sy, tone, toneTyped: typed, raw: tone ? C.markTone(sy, tone) : sy });
      });
    }
  }
  // ja: { k (hiragana), han, ch, kata, roman, bad, raw }
  function jaUnits(text) {
    const C = CJ(), U = [], marks = [], s = String(text == null ? '' : text).normalize('NFC');
    const mark = m => { if (!marks[U.length] || m === '.') marks[U.length] = m; };
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (isHan(ch)) { U.push({ han: true, ch, k: '', raw: ch }); i++; continue; }
      if (isKana(ch)) { U.push({ han: false, ch, k: C.toHira(ch), kata: /[ァ-ヾ]/.test(ch), raw: ch }); i++; continue; }
      if (/[A-Za-zāīūēōâîûêô'\-]/.test(ch)) {
        let j = i; while (j < s.length && /[A-Za-zāīūēōâîûêô'\-]/.test(s[j])) j++;
        for (const c of C.toKana(s.slice(i, j), { final: true })) U.push(/[a-z]/i.test(c) ? { han: false, ch: c, k: '', bad: true, roman: true, raw: c } : { han: false, ch: c, k: C.toHira(c), roman: true, raw: c });
        i = j; continue;
      }
      if (/[、，,;；]/.test(ch)) mark(',');
      else if (/[。.！!？?]/.test(ch)) mark('.');
      i++;
    }
    return { U, marks };
  }
  const units = (L, text) => (L.code === 'zh' ? zhUnits(text) : jaUnits(text));

  // ---------------------------------------------------------------- does a word start at unit i?
  // zh → { j, homo (another character with the same sound), toneBad (a tone typed, and it's another one) } or null
  function matchZh(e, U, i) {
    const n = e.syl.length;
    if (i + n > U.length) return null;
    let homo = false, toneBad = false;
    for (let k = 0; k < n; k++) {
      const u = U[i + k];
      if (u.han) { if (u.ch === e.ch[k]) continue; if (u.syl && u.syl === e.syl[k] && !u.grp) { homo = true; continue; } return null; }
      if (u.syl !== e.syl[k]) return null;
      if (u.toneTyped && u.tone && e.tone[k] && u.tone !== e.tone[k] && !/^[一不]$/.test(e.ch[k])) toneBad = true;     // (一 and 不 change tone in speech)
    }
    return { j: i + n, homo, toneBad };
  }
  // the next mora typed at unit q (kana and rōmaji only): { m, len } or null
  function inputMora(U, q) {
    const u = U[q];
    if (!u || u.han || u.bad || !u.k) return null;
    let m = u.k, len = 1;
    if (m === 'っ' && U[q + 1] && !U[q + 1].han && U[q + 1].k && U[q + 1].k !== 'ー') { m += U[q + 1].k; len = 2; }
    while (U[q + len] && !U[q + len].han && SMALL.includes(U[q + len].k)) { m += U[q + len].k; len++; }
    return { m, len };
  }
  // a reading (hiragana) against the units from p: long vowels may be left out or spelled another way (ō = ou = oo = o).
  // last: the reading ends the word, so its last mora may only be dropped if it's ー, or う / お after an o or a u
  function matchKana(k, U, p, last) {
    const em = morae(k);
    let q = p, prev = '';
    for (let a = 0; a < em.length; a++) {
      const m = em[a], longE = a > 0 && isLong(m, prev), im = inputMora(U, q);
      if (im && loose(im.m) === loose(m)) { q += im.len; prev = m; continue; }
      if (im && longE && isLong(im.m, prev)) { q += im.len; prev = m; continue; }
      if (longE && (a < em.length - 1 || !last || /^[うおー]$/.test(m))) { prev = m; continue; }
      if (im && a > 0 && isLong(im.m, prev)) { q += im.len; a--; continue; }      // an extra long mark typed (oh, ou)
      return -1;
    }
    return q;
  }
  function matchJa(e, U, i) {
    let p = i, homo = false;
    for (let s = 0; s < e.segs.length; s++) {
      const g = e.segs[s];
      if (g.han && U[p] && U[p].han) {
        const cs = [...g.s];
        for (let k = 0; k < cs.length; k++) if (!U[p + k] || !U[p + k].han || U[p + k].ch !== cs[k]) return null;
        p += cs.length; continue;
      }
      const q = matchKana(g.k, U, p, s === e.segs.length - 1);
      if (q < 0) return null;
      p = q;
    }
    return p > i ? { j: p, homo } : null;
  }

  // ---------------------------------------------------------------- the cheapest cover
  // → pieces [{ i, j, cands: [{ e, homo, toneBad }], unk, raw }]: a word costs 1 (a homophone a little more), an unknown unit 8,
  // and no word runs across a comma or a full stop
  function cover(L, text) {
    const C = lexOf(L), { U, marks } = units(L, text), n = U.length, zh = C.l === 'zh';
    const best = new Array(n + 1).fill(Infinity), back = new Array(n + 1).fill(null);
    best[0] = 0;
    const crosses = (i, j) => { for (let k = i + 1; k < j; k++) if (marks[k]) return true; return false; };
    for (let i = 0; i < n; i++) {
      if (best[i] === Infinity) continue;
      const u = U[i], spans = new Map();
      const cands = zh ? [].concat(C.bySyl.get(u.syl) || [], u.han ? C.byCh.get(u.ch) || [] : []) : u.han ? C.byCh.get(u.ch) || [] : C.byKana.get(loose(u.k)) || [];
      for (const e of new Set(cands)) {
        const m = zh ? matchZh(e, U, i) : matchJa(e, U, i);
        if (!m || m.j <= i || crosses(i, m.j)) continue;
        let a = spans.get(m.j); if (!a) spans.set(m.j, a = []);
        a.push(Object.assign({ e }, m));
      }
      for (const [j, list] of spans) {
        const good = list.filter(x => !x.homo), seen = new Set();
        // one candidate per kind of word (蛾 and ガ are both the moth), the one typed with the right tone first
        const use = (good.length ? good : list).sort((a, b) => a.toneBad - b.toneBad).filter(x => { const k = x.e.cat + ':' + x.e.key; if (seen.has(k)) return false; seen.add(k); return true; });
        const cost = best[i] + 1 + (good.length ? 0 : 0.35);
        if (cost < best[j]) { best[j] = cost; back[j] = { i, cands: use }; }
      }
      if (best[i] + 8 < best[i + 1]) { best[i + 1] = best[i] + 8; back[i + 1] = { i, cands: [], unk: true }; }
    }
    const out = [];
    for (let j = n; j > 0; j = back[j].i) out.unshift(Object.assign({ j }, back[j]));
    // one unknown word for a run of unknown units
    const merged = [];
    for (const p of out) {
      const q = merged[merged.length - 1];
      if (p.unk && q && q.unk && !marks[p.i]) { q.j = p.j; continue; }
      merged.push(p);
    }
    for (const p of merged) { p.raw = U.slice(p.i, p.j).map(u => u.raw).join(zh && !U[p.i].han ? ' ' : ''); p.mark = marks[p.i] || null; p.han = U.slice(p.i, p.j).every(u => u.han); }
    return { pieces: merged, U, marks, end: marks[n] || null };
  }
  _.CJP = { lexOf, setFoods, units, cover, morae, loose, isHan, isKana };
})();

// ================================================================ Chinese and Japanese, part 2: the grammar, Mimo's sentence, the hooks
// cjParse reads the words part 1 found as a command, with the same result shape as the es / pt / de parser (clauses with
// a verb, a described target, a part and whose, food; errors and fixes for the grade), so flow.js runs the fight the same
// way. Who is meant is picked by the shared resolve(). The grammar ladder's checks are checkZh / checkJa; renderZh /
// renderJa write the right sentence (in the notation) that Mimo says back. P.parse, sayClause, sayAction, sayEat, wrapS,
// recastHTML and setFoods hand zh / ja to these and leave es / pt / de exactly as they were.
(() => {
  const B = window.BATTLE, _ = B._, P = _.P, X = _.CJP;
  const CJ = () => (typeof CJK !== 'undefined' ? CJK : null);
  const err = (c, kind) => c.errors.push({ kind, major: P.MAJOR.has(kind) });
  const fix = (c, kind) => c.fixes.push(kind);
  const has = (p, cat) => !!p && !p.unk && p.cands.some(x => x.e.cat === cat);
  const get = (p, cat) => (p && !p.unk ? p.cands.find(x => x.e.cat === cat && !x.toneBad) || p.cands.find(x => x.e.cat === cat) || null : null);
  const tok = p => ({ raw: p ? p.raw : '' });
  const isHead = p => has(p, 'noun') || has(p, 'part') || has(p, 'food');
  const DE = '[的|de]';
  // a character typed that only sounds right is a character slip; a tone typed wrong, a note
  function spell(c, x) { if (!x) return; if (x.homo) c.cj.spell.add('spelling'); if (x.toneBad) c.cj.spell.add('accent'); }
  const newC = (x, p) => ({ verb: x.e.key, baseVerb: x.e.key, verbTok: tok(p), verbShow: x.e.src, verbTypo: !!x.homo, errors: [], fixes: [], words: [], untaught: [], unknownToks: [],
    desc: null, part: null, owner: null, stone: null, target: null, obj: null, charge: 0, adv: [], instr: null, food: null, foodU: null, power: 1 });
  const unit = (it, extra) => Object.assign({ key: it.x.e.key, keys: [it.x.e.key], tok: tok(it.p), show: it.x.e.src, style: it.x.e.style, g: 'm', typo: false }, extra || {});
  // a description for resolve(): { noun, adjs, pos, described } (and, zh, the 这 / 那 / number and its measure word)
  function descOf(np, nounIt) {
    const d = { noun: nounIt ? { key: nounIt.x.e.key, tok: tok(nounIt.p), show: nounIt.x.e.src, g: 'm', typo: false } : null, adjs: np.adjs.map(it => unit(it)),
      pos: np.pos ? { key: np.pos.x.e.key, tok: tok(np.pos.p), show: np.pos.x.e.src, typo: false } : null, rel: null, pron: null, preps: [] };
    d.described = !!(d.noun || d.adjs.length || d.pos);
    if (np.det || np.num) d.det = { src: (np.det || np.num).x.e.src, afterPos: !!np.detAfterPos };
    return d;
  }
  // the pieces of one clause → a command clause: who, the part and whose, the food, the stone
  function build(c, np, ctx) {
    c.unknownToks = np.unk.slice();
    if (np.food) {
      const f = np.food.x.e.food;
      c.food = { id: f.id, key: f.id, tok: tok(np.food.p), w: f.w, cl: _.foodCl ? _.foodCl(f.id) : '个', g: 'm' };
    }
    if (np.part) {
      c.part = { key: np.part.x.e.key, tok: tok(np.part.p), show: np.part.x.e.src, g: 'm', pl: false, typo: false };
      c.owner = descOf(np, np.owner);
      if (!c.owner.described) c.owner = Object.assign(c.owner, { described: false });
    } else c.desc = descOf(np, np.noun);
    c.cj.np = np;
  }

  // ---------------------------------------------------------------- zh
  // a description: [这 / 那 / a number + measure word] [place 的] [state 的] [color (的)] [size] noun [的 part]
  function npZh(ps) {
    const items = [], r = { adjs: [], unk: [], errs: [], fixes: [] };
    for (const p of ps) {
      if (p.unk) { r.unk.push(p); continue; }
      if (has(p, 'de')) { const it = items[items.length - 1]; if (it) it.de = true; continue; }
      const prev = items[items.length - 1];
      let t = ['noun', 'part', 'food', 'stone', 'pos', 'adj'].find(x => has(p, x)) || null;
      if (!t && has(p, 'cl') && prev && (prev.t === 'det' || prev.t === 'num')) t = 'cl';
      if (!t) t = ['det', 'num', 'cl'].find(x => has(p, x)) || null;
      if (!t && (has(p, 'zai') || has(p, 'most') || has(p, 'fill') || has(p, 'voc'))) continue;     // (在左边的…, 最左边的…)
      if (!t) { r.unk.push(p); continue; }
      const x = get(p, t);
      items.push({ t, p, x, de: false });
    }
    let h = -1;
    for (let k = items.length - 1; k >= 0; k--) if (/^(noun|part|food)$/.test(items[k].t)) { h = k; break; }
    let head = h >= 0 ? items[h] : null, owner = null;
    if (head && head.t === 'part') { for (let k = h - 1; k >= 0; k--) if (items[k].t === 'noun') { owner = items[k]; break; } }
    else if (head && head.t === 'noun') {
      const pk = items.findIndex(it => it.t === 'part');                        // «头的青蛙»: the wrong way round
      if (pk >= 0 && pk < h) { r.errs.push('order'); owner = head; head = items[pk]; }
    }
    const nounIt = head && head.t === 'noun' ? head : owner, nounAt = nounIt ? items.indexOf(nounIt) : -1;
    items.forEach((it, k) => {
      const nx = items[k + 1];
      if (it.t === 'pos') {
        r.pos = it;
        if (nounAt >= 0 && k > nounAt) r.errs.push('order');                                 // «青蛙左边»
        else if (!it.de && !(nx && (nx.t === 'det' || nx.t === 'num'))) r.errs.push('de');  // «左边青蛙» → «左边的青蛙» (or «左边那只»)
        if (nx && (nx.t === 'det' || nx.t === 'num')) r.detAfterPos = true;
      } else if (it.t === 'adj') {
        r.adjs.push(it);
        if (it.x.e.state && !it.de && nx) r.errs.push('de');                                 // «睡着青蛙» → «睡着的青蛙»
        if (nounAt >= 0 && k > nounAt && !(head && head.t === 'part' && k > items.indexOf(head))) r.errs.push('order');   // «蛾子红色»
      } else if (it.t === 'det' || it.t === 'num') {
        r[it.t] = it;
        if (!nx || nx.t !== 'cl') r.errs.push('measure');                                   // «这青蛙» → «这只青蛙»
      } else if (it.t === 'cl') r.cl = it;
      else if (it.t === 'stone') r.stone = it;
    });
    if (!head && (r.adjs.length || r.pos) && items.length && !items[items.length - 1].de && items[items.length - 1].t !== 'cl') r.errs.push('de');   // «打红色» → «打红色的»
    if (head && head.t === 'part' && owner && items.indexOf(owner) < items.indexOf(head) && !owner.de) r.errs.push('de');              // «青蛙头» → «青蛙的头»
    if (head && head.t === 'part') r.part = head; else if (head && head.t === 'food') r.food = head; else if (head) r.noun = head;
    r.owner = owner;
    return r;
  }
  function clauseZh(ps, ctx) {
    let v = -1;
    for (let k = 0; k < ps.length; k++) {
      if (!has(ps[k], 'verb')) continue;
      const nx = ps[k + 1], other = ps[k].cands.some(x => x.e.cat !== 'verb'), later = ps.slice(k + 1).some(q => has(q, 'verb'));
      if (other && later && nx && (has(nx, 'de') || isHead(nx) || (has(nx, 'adj') && !has(nx, 'verb')))) continue;     // «大的», «大蛾子»: big, not hit
      v = k; break;
    }
    if (v < 0) { const w = ps.find(q => q.unk || !has(q, 'fill')); return { fail: 'noverb', word: w ? w.raw : '' }; }
    const vp = ps[v], vx = get(vp, 'verb'), c = newC(vx, vp);
    c.cj = { l: 'zh', verbSrc: vx.e.src, direct: vx.e.obj === 'direct', result: vx.e.obj === 'result', spell: new Set() };
    spell(c, vx);
    const pre = ps.slice(0, v), post = ps.slice(v + 1), z = c.cj;
    let ba = null, toward = null, front = null, obj = null;
    const npUntil = (list, k, stop) => { const out = []; for (; k < list.length && !stop(list[k]); k++) out.push(list[k]); return { out, k }; };
    const stopPre = q => has(q, 'yong') || has(q, 'with') || has(q, 'toward') || (has(q, 'stone') && !isHead(q));
    for (let k = 0; k < pre.length; k++) {
      const p = pre[k];
      if (has(p, 'talk')) return { fail: 'noverb', word: p.raw };
      if (has(p, 'ba')) { const r = npUntil(pre, k + 1, stopPre); ba = r.out; k = r.k - 1; continue; }
      if ((has(p, 'yong') || has(p, 'with')) && has(pre[k + 1], 'stone')) { const y = has(p, 'yong'); z.instr = { how: y ? 'yong' : 'with', p: pre[k + 1], src: get(p, y ? 'yong' : 'with').e.src }; spell(c, get(pre[k + 1], 'stone')); k++; continue; }
      if (has(p, 'stone') && !isHead(p)) { z.instr = { how: 'bare', p }; continue; }
      if (has(p, 'toward')) { const r = npUntil(pre, k + 1, stopPre); toward = r.out.filter(q => !has(q, 'shang')); k = r.k - 1; continue; }
      if (has(p, 'zai') && k === pre.length - 1 && !has(p, 'conj')) { z.zaiV = true; continue; }       // «在跳»: is jumping
      if (has(p, 'first') || has(p, 'fill')) continue;
      (front = front || []).push(p);
    }
    for (let k = 0; k < post.length; k++) {
      const p = post[k];
      if (has(p, 'talk')) return { fail: 'noverb', word: p.raw };
      const det = has(p, 'det') && post[k + 1] && (has(post[k + 1], 'cl') || isHead(post[k + 1]));      // (zhe: 这只…, not 着)
      if (has(p, 'asp') && !det && (k === 0 || k === post.length - 1)) { z.asp = z.asp || get(p, 'asp').e.key; z.aspEnd = k === post.length - 1; continue; }
      if (!obj && (has(p, 'dao') || (has(p, 'shang') && get(p, 'shang').e.key === 'shang') || (has(p, 'zai') && c.baseVerb === 'jump'))) { z.link = has(p, 'dao') ? 'dao' : has(p, 'shang') ? 'shang' : 'zai'; continue; }
      if ((has(p, 'yong') || has(p, 'with')) && has(post[k + 1], 'stone')) { const y = has(p, 'yong'); z.instr = { how: y ? 'yong' : 'with', p: post[k + 1], late: true, src: get(p, y ? 'yong' : 'with').e.src }; k++; continue; }
      if (has(p, 'shang') && obj) { z.linkAfter = true; continue; }
      if (has(p, 'fill')) { if (/一下/.test(get(p, 'fill').e.src)) z.yixia = true; continue; }
      (obj = obj || []).push(p);
    }
    z.ba = !!ba; z.toward = !!toward; z.yixia = z.yixia || ps.some(p => p.yixia);
    if (front && (ba || toward || obj)) { obj = (ba || toward || obj).concat(front); ba = toward = null; z.front = true; }
    else if (front) { obj = front; z.front = true; }
    const np = npZh(ba || toward || obj || []);
    for (const it of [np.noun, np.part, np.owner, np.food, np.pos, np.det, np.num, np.cl].concat(np.adjs)) if (it) spell(c, it.x);
    build(c, np, ctx);
    return c;
  }
  // the measure word after 这 / 那 / a number, now that we know who (or what food) it is
  function measure(c, np, L) {
    if (!np || (!np.det && !np.num) || !np.cl) return;
    const S = c.food ? null : c.target && L.species[c.target.species];
    const want = c.food ? [c.food.cl, '个', '块', '片'] : S ? S.cls || [S.cl] : null, cl = np.cl.p.han ? np.cl.p.raw : np.cl.x.e.key;
    if (!want || want.includes(cl)) { if (c.food) c.cj.clOk = cl; return; }
    if (cl === '个') { fix(c, 'style'); fix(c, 'ge'); return; }                // (个 is fine colloquially: a note)
    err(c, 'measure');
  }
  function checkZh(c, ctx) {
    const z = c.cj, np = z.np;
    if (z.zaiV || (z.asp && !(z.ba && z.asp === 'le' && z.aspEnd))) err(c, 'verbform');      // «跳了», «在跳» → «跳！»
    if (z.front) err(c, 'order');                                                            // «红蛾子打» → «打红蛾子» / «把红蛾子…»
    if (z.instr) { if (z.instr.how !== 'yong') err(c, 'yong'); if (z.instr.late) err(c, 'order'); }
    if (c.baseVerb === 'jump' && !z.direct && !c.auto && !z.link && !z.linkAfter && !z.toward) err(c, 'link');   // «跳红蛾子» → «跳到红蛾子身上»
    if (z.ba && !z.result && !z.yixia && !z.asp) { fix(c, 'style'); fix(c, 'baBare'); }
    for (const k of np.errs) err(c, k);
    measure(c, np, ctx.L);
    for (const k of z.spell) fix(c, k);
  }
  function npZhSay(L, target, d) {
    if (!d) return null;
    const S = L.species[target.species]; if (!S) return null;
    const A = L.adjs, ks = (d.adjs || []).filter(a => a.known !== false && A[a.key]);
    const color = ks.find(a => !A[a.key].state && a.key !== 'big' && a.key !== 'small'), size = ks.find(a => a.key === 'big' || a.key === 'small'), state = ks.find(a => A[a.key].state);
    const form = (a, st) => (A[a.key].cj.find(x => x[1] === st) || A[a.key].cj[0])[0];
    const noun = d.noun && d.noun.known !== false ? S.w : null, pk = P.posKeyOf(d), out = [];
    const det = d.det ? [d.det.src, `[${S.cl}|${L.clPinyin[S.cl] || 'gè'}]`] : [];
    if (pk && det.length && d.det.afterPos) out.push(L.positions[pk].w, ...det);                  // «左边那只青蛙»
    else { out.push(...det); if (pk) out.push(L.positions[pk].w, DE); }
    if (state) out.push(A[state.key].forms[0].m, DE);
    if (noun) {
      const short = color && (pk || state || color.style === 'short');
      if (color && !short) out.push(form(color, 'long'), DE);
      if (size) out.push(A[size.key].forms[0].m);
      if (color && short) out.push(form(color, 'short'));
      out.push(noun);
    } else {
      if (size) out.push(A[size.key].forms[0].m, DE);
      if (color) out.push(form(color, color.style === 'short' ? 'short' : 'long'), DE);
    }
    return out.length ? out.join(' ') : null;
  }
  const baVerb = (base, z, v) => (z.result ? v : base === 'push' ? '[推倒|tuī dǎo]' : base === 'eat' ? '[吃掉|chī diào]' : `${v} [一下|yī xià]`);
  function renderZh(c, L) {
    const z = c.cj || {}, base = c.baseVerb || c.verb, V = L.verbs[base] || L.verbs.hit, v = z.verbSrc || V.show;
    const instr = c.flies ? `${z.instr && z.instr.how === 'yong' && z.instr.src ? z.instr.src : '[用|yòng]'} ${L.stone.w} ` : '';
    if (base === 'sing' || base === 'blow' || base === 'climb' || base === 'call' || base === 'light' || base === 'dig') return v;
    if (c.food) {
      const np = z.np, k = z.clOk || c.food.cl, cl = np && (np.det || np.num) ? `${(np.det || np.num).x.e.src} [${k}|${L.clPinyin[k] || 'gè'}] ` : '';
      return z.ba ? `[把|bǎ] ${cl}${c.food.w} ${baVerb('eat', z, v)}` : `${v} ${cl}${c.food.w}`;
    }
    const jump = base === 'jump' && !z.direct;
    if (c.part && c.partKey) {
      const od = c.ownerShown ? c.owner : c.ownerAdd || null, own = od ? npZhSay(L, c.target, od) : null, pw = L.parts[c.partKey].w;
      const np = own ? (own.endsWith(DE) ? `${own} ${pw}` : `${own} ${DE} ${pw}`) : pw;
      if (jump) return `${v} [到|dào] ${np} [上|shàng]`;
      return z.ba ? `${instr}[把|bǎ] ${np} ${baVerb(base, z, v)}` : `${instr}${v} ${np}`;
    }
    const np = c.auto ? null : npZhSay(L, c.target, c.desc);
    if (!np) return `${instr}${v}`;
    if (jump) return z.link === 'shang' ? `${v} [上|shàng] ${np}` : `${v} [到|dào] ${np} [身上|shēn shang]`;
    if (z.ba) return `${instr}[把|bǎ] ${np} ${baVerb(base, z, v)}`;
    return `${instr}${v} ${np}`;
  }

  // ---------------------------------------------------------------- ja
  // a description: [この / その / あの] [place の | place にいる] [state] [size] [color] noun [の part]
  function npJa(ps) {
    const items = [], r = { adjs: [], unk: [], errs: [] };
    for (const p of ps) {
      if (p.niiru) { const it = items[items.length - 1]; if (it) it.niiru = true; continue; }
      if (p.unk) { r.unk.push(p); continue; }
      if (has(p, 'p') && get(p, 'p').e.key === 'no' && !isHead(p)) { items.push({ t: 'no', p }); continue; }
      if (has(p, 'na')) { items.push({ t: 'na', p }); continue; }
      if (has(p, 'ue')) { r.ue = true; continue; }
      if (has(p, 'iru')) { const it = items[items.length - 1]; if (it) it.niiru = true; continue; }
      const t = ['noun', 'part', 'food', 'stone', 'pos', 'adj', 'det'].find(x => has(p, x)) || null;
      if (!t && (has(p, 'fill') || has(p, 'voc'))) continue;
      if (!t) { r.unk.push(p); continue; }
      items.push({ t, p, x: get(p, t) });
    }
    let h = -1;
    for (let k = items.length - 1; k >= 0; k--) if (/^(noun|part|food)$/.test(items[k].t)) { h = k; break; }
    let head = h >= 0 ? items[h] : null, owner = null;
    const at = it => items.indexOf(it);
    if (head && head.t === 'part') {
      for (let k = h - 1; k >= 0; k--) if (items[k].t === 'noun') { owner = items[k]; break; }
      if (owner && !(items[at(owner) + 1] && items[at(owner) + 1].t === 'no')) r.errs.push('no');      // «カエル頭» → «カエルの頭»
    } else if (head && head.t === 'noun') {
      const pk = items.findIndex(it => it.t === 'part');
      if (pk >= 0 && pk < h) { r.errs.push('order'); owner = head; head = items[pk]; }                  // «頭のカエル»: the wrong way round
    }
    const nounIt = head && head.t === 'noun' ? head : owner, nounAt = nounIt ? at(nounIt) : -1;
    const isN = it => !!it && /^(noun|part|food)$/.test(it.t);
    items.forEach((it, k) => {
      const nx = items[k + 1], nn = items[k + 2];
      if (it.t === 'pos') {
        r.pos = it;
        if (!it.niiru && isN(nx)) r.errs.push('no');                                          // «左カエル» → «左のカエル»
        if (nounAt >= 0 && k > nounAt) r.errs.push('order');
      } else if (it.t === 'adj') {
        r.adjs.push(it);
        const st = it.x.e.style;
        if (st === 'bad') r.errs.push('iAdj');                                               // «緑い» → «緑の»
        else if (st === 'i' || st === 'state') {
          if ((nx && nx.t === 'no' && isN(nn)) || (nx && nx.t === 'na')) r.errs.push('iAdj');  // «赤いの蛾», «赤いな蛾» → «赤い蛾»
          else if (!nx && h < 0 && st === 'i') r.errs.push('iAdj');                            // «赤いを» → «赤いのを»
        } else if (st === 'na') { if (!isN(nx) && !(nx && nx.t === 'adj')) r.errs.push('iAdj'); }
        else if (st === 'noun') { if (isN(nx) || !nx) r.errs.push('iAdj'); }                // «赤蛾» → «赤い蛾» / «赤の蛾»
        if (nounAt >= 0 && k > nounAt && !(head && head.t === 'part' && k > at(head))) r.errs.push('order');
      } else if (it.t === 'det') r.det = it;
      else if (it.t === 'stone') r.stone = it;
    });
    if (head && head.t === 'part') r.part = head; else if (head && head.t === 'food') r.food = head; else if (head) r.noun = head;
    r.owner = owner;
    return r;
  }
  // the phrases before the verb, each with the particle that ends it (を に で が は と へ も, or none)
  function phrasesJa(list) {
    const out = [];
    let cur = [];
    for (let k = 0; k < list.length; k++) {
      const p = list[k];
      if (has(p, 'p') && get(p, 'p').e.key !== 'no') {
        // が is the moth when nothing names who yet and a particle or the end comes next («赤い蛾を»)
        if (has(p, 'noun') && !cur.some(isHead) && (k === list.length - 1 || has(list[k + 1], 'p'))) { cur.push(p); continue; }
        const key = get(p, 'p').e.key;
        if (key === 'ni' && has(list[k + 1], 'iru')) { cur.push({ niiru: true, cands: [], raw: '' }); k++; continue; }    // «左にいるカエル»
        out.push({ np: cur, part: key, pp: p }); cur = [];
        continue;
      }
      cur.push(p);
    }
    if (cur.length) out.push({ np: cur, part: null });
    return out;
  }
  function clauseJa(ps, ctx) {
    let v = -1;
    for (let k = ps.length - 1; k >= 0; k--) if (has(ps[k], 'verb')) { v = k; break; }
    if (v < 0) { const w = ps.find(q => q.unk || !has(q, 'fill')); return { fail: 'noverb', word: w ? w.raw : '' }; }
    const vp = ps[v], vx = get(vp, 'verb'), c = newC(vx, vp);
    c.cj = { l: 'ja', verbSrc: vx.e.src, form: vx.e.form, wo: vx.e.obj === 'wo', spell: new Set() };
    for (const q of ps) if (has(q, 'talk')) return { fail: 'noverb', word: q.raw };
    const post = ps.slice(v + 1).filter(p => p.unk || !(has(p, 'fill') || has(p, 'voc') || has(p, 'first')));
    const phr = phrasesJa(ps.slice(0, v)).concat(phrasesJa(post).map(x => Object.assign(x, { after: true })));
    let target = null;
    const extra = [];
    for (const ph of phr) {
      if (!ph.np.length) continue;
      const np = npJa(ph.np);
      if (np.stone && !np.noun && !np.part && !np.food && !np.adjs.length) { c.cj.instr = { part: ph.part, p: np.stone.p }; c.cj.after = c.cj.after || !!ph.after; continue; }
      if (!target) target = { ps: ph.np, part: ph.part, after: ph.after, np }; else extra.push(ph);
    }
    if (target && extra.length) target.np = npJa(target.ps.concat(...extra.map(x => x.np)));     // (two phrases about who: read them together)
    const np = target ? target.np : npJa([]);
    if (target) { c.cj.tp = target.part; c.cj.after = c.cj.after || !!target.after; c.cj.hasTarget = true; }
    build(c, np, ctx);
    return c;
  }
  function checkJa(c, ctx) {
    const j = c.cj, np = j.np;
    if (/^(dict|masu|bad)$/.test(j.form)) err(c, 'teForm');                                  // «打つ», «打ちます» → «打って»
    if (j.hasTarget && !(c.auto && !c.food)) {
      const want = c.baseVerb === 'jump' && !j.wo ? 'ni' : 'wo';
      if (j.tp === want) { /* right */ }
      else if (j.tp == null) { fix(c, 'style'); fix(c, want === 'ni' ? 'niDrop' : 'woDrop'); }   // (left out, as people do when they talk)
      else err(c, want);
    }
    if (j.instr && j.instr.part !== 'de') err(c, 'deP');                                     // «石を» / «石と» → «石で»
    if (j.after) { fix(c, 'style'); fix(c, 'order'); }                                       // (the verb usually comes last)
    for (const k of np.errs) err(c, k);
    for (const k of j.spell) fix(c, k);
  }
  function npJaSay(L, target, d) {
    if (!d) return null;
    const S = L.species[target.species]; if (!S) return null;
    const A = L.adjs, ks = (d.adjs || []).filter(a => a.known !== false && A[a.key]);
    const color = ks.find(a => !A[a.key].state && a.key !== 'big' && a.key !== 'small'), size = ks.find(a => a.key === 'big' || a.key === 'small'), state = ks.find(a => A[a.key].state);
    const form = (a, st) => (A[a.key].cj.find(x => x[1] === st) || A[a.key].cj[0])[0];
    const noun = d.noun && d.noun.known !== false ? S.w : null, pk = P.posKeyOf(d), out = [];
    if (d.det) out.push(d.det.src);
    if (pk) out.push(L.positions[pk].w, 'の');
    if (state) out.push(A[state.key].forms[0].m);
    if (size) out.push(size.style === 'na' ? form(size, 'na') : A[size.key].forms[0].m);
    if (color) { if (color.key === 'green' || color.style === 'noun') out.push(form(color, 'noun'), 'の'); else out.push(A[color.key].forms[0].m); }
    if (noun) out.push(noun);
    else if (out.length && out[out.length - 1] !== 'の') out.push('の');
    return out.length ? out.join(' ') : null;
  }
  function renderJa(c, L) {
    const j = c.cj || {}, base = c.baseVerb || c.verb, V = L.verbs[base] || L.verbs.hit;
    const v = j.verbSrc && /^(te|imp)$/.test(j.form) ? j.verbSrc : V.show;
    const instr = c.flies ? `${L.stone.w} で ` : '';
    if (base === 'sing' || base === 'blow' || base === 'climb' || base === 'call' || base === 'light' || base === 'dig') return v;
    if (c.food) return `${c.food.w} を ${v}`;
    const prt = base === 'jump' && !j.wo ? 'に' : 'を';
    if (c.part && c.partKey) {
      const od = c.ownerShown ? c.owner : c.ownerAdd || null, own = od ? npJaSay(L, c.target, od) : null, pw = L.parts[c.partKey].w;
      return `${instr}${own ? (own.endsWith(' の') ? `${own} ${pw}` : `${own} の ${pw}`) : pw} ${prt} ${v}`;
    }
    const np = c.auto ? null : npJaSay(L, c.target, c.desc);
    return np ? `${instr}${np} ${prt} ${v}` : `${instr}${v}`;
  }

  // ---------------------------------------------------------------- both
  // after the words: what Mimo does, who, the checks, and the sentence it says back
  function finish(c, ctx) {
    const L = ctx.L, zh = L.code === 'zh';
    c.verbShow = (L.verbs[c.baseVerb] || {}).show || c.verbShow;
    if (c.verb === 'sing' || c.verb === 'blow' || c.verb === 'climb' || c.verb === 'call' || c.verb === 'light' || c.verb === 'dig') {        // (blow: a gust over everyone, the Frost Peaks; climb picks its own, the Bloom Gardens; call: the gulls, Port Brisa)
      c.words.push('v.' + c.verb);
      const foes = ctx.foes;
      c.target = foes.length ? P.autoPick(foes) : null; c.auto = true; c.multi = foes.length > 1; c.partKey = null; c.ambiguous = null;
      if (!c.target) return { fail: 'none' };
      (zh ? checkZh : checkJa)(c, ctx);
      c.canon = (zh ? renderZh : renderJa)(c, L);
      return c;
    }
    if (c.verb === 'eat') {
      if (!c.food) { const np = c.cj.np, thing = np && (np.noun || np.part || np.adjs[0]); return thing ? { fail: 'notFood', word: thing.p.raw } : { fail: 'eatWhat' }; }
      c.words.push('v.eat');
      if (ctx.knows(c.food.id)) c.words.push(c.food.id); else c.untaught.push({ id: c.food.id, raw: c.food.tok.raw });
      (zh ? checkZh : checkJa)(c, ctx);
      c.canon = (zh ? renderZh : renderJa)(c, L);
      return c;
    }
    if (c.food) return { fail: 'foodVerb', word: c.food.tok.raw };
    if (c.verb === 'push' && c.part) return { fail: 'pushPart', word: c.part.tok.raw };
    c.words.push('v.' + c.verb);
    // with the stone («用石头打…», «石で…を打って»): Mimo throws it, and a thrown stone flies, so it reaches floaters too
    if (c.cj.instr) {
      if (!ctx.knows('n.stone')) c.untaught.push({ id: 'n.stone', raw: c.cj.instr.p.raw });
      else { c.words.push('n.stone'); if (c.verb === 'hit') { c.verb = 'throw'; c.obj = 'medium'; c.flies = true; } }
    }
    const r = P.resolve(c, ctx);
    if (r.fail) {
      // a rolled-up armadillo has its head and tail tucked in
      if (c.part && (r.fail === 'nopart' || r.fail === 'none') && (c.part.key === 'head' || c.part.key === 'tail') && ctx.foes.some(f => f.species === 'armadillo' && !f.flipped)) return { fail: 'tucked' };
      return r;
    }
    c.target = r.target; c.auto = !!r.auto; c.multi = !!r.multi; c.partKey = r.part || null; c.ambiguous = r.ambiguous || null;
    const d = c.part ? c.owner : c.desc;
    if (d && d.pos && d.pos.known && d.pos.fix) err(c, 'position');                          // it's somewhere else
    if (c.part && c.partKey) { c.words.push('n.' + c.part.key); P.descWords(c, c.owner); }
    else if (!c.auto) P.descWords(c, c.desc);
    (zh ? checkZh : checkJa)(c, ctx);
    c.canon = (zh ? renderZh : renderJa)(c, L);
    return c;
  }
  // talking a shy one down: one of the language's phrases, anywhere in what you said
  function talkIds(text, L) {
    const C = CJ(), ids = [];
    for (const t of L.talkCJ || []) if (t.p.some(p => C.contains(text, p, L.code))) ids.push(t.id);
    return ids;
  }
  // two commands at most: split at «然后 / 再 / それから», at a comma, and (ja) after a te-form that another verb follows
  function split(ps, l) {
    const out = [[]], hasV = list => list.some(p => has(p, 'verb'));
    for (let k = 0; k < ps.length; k++) {
      const p = ps[k], cur = out[out.length - 1];
      if (has(p, 'conj') && !has(p, 'verb') && hasV(cur) && hasV(ps.slice(k + 1))) { out.push([]); continue; }
      if (p.mark === ',' && cur.length && hasV(cur) && hasV(ps.slice(k))) out.push([]);
      out[out.length - 1].push(p);
      if (l === 'ja' && has(p, 'verb') && get(p, 'verb').e.form === 'te' && hasV(ps.slice(k + 1)) && !(ps[k + 1] && ps[k + 1].mark)) out.push([]);
    }
    return out.filter(x => x.length);
  }
  function cjParse(text, ctx) {
    const L = ctx.L, out = { ok: false, raw: text }, C = CJ();
    if (!C) return Object.assign(out, { reason: 'empty' });
    if (_.feedCJK) _.feedCJK();
    if (_.mergeZhJa && !_.zjMerged) { _.zjMerged = true; _.mergeZhJa(); }
    // a sentence in the notation (the autopilot, tests) is read as typed in the current mode: characters, or pinyin / rōmaji
    let t = String(text == null ? '' : text);
    if (/\[[^\]|]+\|[^\]]+\]|\{mimo\}/.test(t)) t = C.plain(t, { lang: L.code, cap: false });
    // the player's name for Mimo, typed in letters, is only calling it
    for (const v of ctx.voc || []) if (v && /^[a-z]{2,}$/.test(v)) t = t.replace(new RegExp(`(^|[^a-z])${v}(?=[^a-z]|$)`, 'gi'), '$1 ');
    const cv = X.cover(L, t), ps = [];
    for (const p of cv.pieces) {
      if (p.unk || !p.cands.every(x => /^(fill|voc|first)$/.test(x.e.cat))) { ps.push(p); continue; }
      if (p.cands.some(x => /一下/.test(x.e.src)) && ps.length) ps[ps.length - 1].yixia = true;     // («把青蛙打一下»: 把 with a result)
      if (p.mark && cv.pieces[cv.pieces.indexOf(p) + 1]) cv.pieces[cv.pieces.indexOf(p) + 1].mark = cv.pieces[cv.pieces.indexOf(p) + 1].mark || p.mark;   // (keep the comma)
    }
    if (!ps.length) return Object.assign(out, { reason: 'empty' });
    const talk = talkIds(t, L);
    if (talk.length && (ps.some(p => has(p, 'talk')) || !ps.some(p => has(p, 'verb')))) {
      return { ok: true, kind: 'talk', raw: text, ids: talk, errors: [], fixes: [], clauses: [], words: talk.map(id => 't.' + id), untaught: [], patterns: ['talk'], canon: String(text).trim(), recast: false };
    }
    const clauses = [];
    for (const part of split(ps, L.code).slice(0, ctx.maxClauses || 2)) {
      let c = L.code === 'zh' ? clauseZh(part, ctx) : clauseJa(part, ctx);
      if (c.fail) return Object.assign(out, { reason: c.fail, word: c.word });
      if (c.unknownToks.length) return Object.assign(out, { reason: 'unknown', word: c.unknownToks[0].raw });
      if (!ctx.knows('v.' + c.baseVerb)) return Object.assign(out, { reason: 'unknownVerb', word: c.verbTok.raw, id: 'v.' + c.baseVerb, verb: c.baseVerb });
      c = finish(c, ctx);
      if (c.fail) return Object.assign(out, { reason: c.fail, word: c.word });
      clauses.push(c);
    }
    if (!clauses.length) return Object.assign(out, { reason: 'noverb' });
    if (clauses.length > 1 && clauses.some(c => c.verb === 'eat')) return Object.assign(out, { reason: 'eatCombo' });
    const canon = clauses.map(c => c.canon).join(L.code === 'zh' ? ' ， [然后|rán hòu] ' : ' 、 それから ') + ' ！';
    const errors = clauses.flatMap(c => c.errors), fixes = clauses.flatMap(c => c.fixes), patterns = new Set();
    for (const c of clauses) {
      if (c.verb === 'eat') patterns.add('eat');
      else if (c.verb === 'sing' || c.verb === 'blow' || c.verb === 'climb' || c.verb === 'call' || c.verb === 'light' || c.verb === 'dig') patterns.add('verb');
      else if (c.partKey) patterns.add('part');
      else patterns.add(c.auto ? 'verb' : (c.flies ? 'hit' : c.verb) + '+target');
      if (c.partKey && c.ownerShown) patterns.add('possessive');
      if ([c.desc, c.ownerShown ? c.owner : null].some(d => d && d.pos && d.pos.known) && !c.auto) patterns.add('position');
      if (c.flies) patterns.add('instrument');
    }
    if (clauses.length > 1) patterns.add('combo');
    return {
      ok: true, kind: 'command', raw: text, clauses, canon, errors, fixes, eat: clauses[0].verb === 'eat',
      recast: errors.length > 0 || fixes.length > 0 || clauses.some(c => c.ambiguous && !c.ambiguous.untaught),
      words: [...new Set(clauses.flatMap(c => c.words))], untaught: clauses.flatMap(c => c.untaught), patterns: [...patterns],
    };
  }

  // ---------------------------------------------------------------- saying it: suggestions, examples, the autopilot
  function cjSay(L, verb, target, o = {}) {
    const K = keys => (keys || []).map(key => ({ key, keys: [key], known: true }));
    const desc = { adjs: K(o.adjs), noun: o.noun ? { key: target.species, known: true } : null, pos: o.pos ? { key: o.pos, known: true } : null, rel: null, preps: [] };
    desc.described = !!(desc.adjs.length || desc.noun || desc.pos);
    const v = verb === 'attack' || verb === 'grab' ? 'hit' : verb === 'throw' ? 'hit' : verb;
    const c = { verb: v, baseVerb: v, target, desc, auto: !desc.described, cj: {} };
    if (o.part) {
      c.part = { key: o.part }; c.partKey = o.part; c.auto = false;
      if ((o.owner && o.owner.length) || o.ownerNoun || o.ownerPos) {
        c.owner = { adjs: K(o.owner), noun: o.ownerNoun ? { key: target.species, known: true } : null, pos: o.ownerPos ? { key: o.ownerPos, known: true } : null, described: true };
        c.ownerShown = true;
      }
    }
    if (o.instr && v === 'hit' && L.stone) c.flies = true;
    return L.code === 'zh' ? renderZh(c, L) : renderJa(c, L);
  }
  const cjWrap = (L, s) => { s = String(s).trim(); return /[！？。]$/.test(s) ? s : s + ' ！'; };
  function cjEat(L, food, o = {}) {
    if (L.code === 'ja') return cjWrap(L, `${food.w} を [食|た]べて`);
    const cl = _.foodCl ? _.foodCl(food.id) : '个';
    return cjWrap(L, `[吃|chī] ${o.indef ? `[一|yī] [${cl}|${L.clPinyin[cl] || 'gè'}] ` : ''}${food.w}`);
  }
  // Mimo's recast: the right sentence, word by word, with what you missed underlined
  function cjRecast(canon, raw, escFn) {
    const C = CJ(), l = C.lang(), roman = C.mode(l) === 'roman';
    let out = '', first = true;
    for (const t of C.split(canon)) {
      const punct = C.parse(t, l).every(x => x.kind === 'punct');
      let h = C.html(t, { lang: l, cap: roman && first && !punct });
      if (!punct && !C.contains(raw, t, l)) h = `<b class="fx">${h}</b>`;
      out += (roman && !first && !punct ? ' ' : '') + h;
      if (!punct) first = false;
    }
    return out;
  }
  const notation = s => /\[[^\]|]+\|[^\]]+\]|[぀-ヿ㐀-鿿]/.test(String(s || ''));
  const base = { parse: P.parse, sayClause: P.sayClause, sayAction: P.sayAction, sayEat: P.sayEat, wrapS: P.wrapS, recastHTML: P.recastHTML, setFoods: P.setFoods };
  P.parse = (text, ctx) => (ctx && ctx.L && ctx.L.cjk ? cjParse(text, ctx) : base.parse(text, ctx));
  P.sayClause = (L, verb, target, o) => (L && L.cjk ? cjSay(L, verb, target, o) : base.sayClause(L, verb, target, o));
  P.sayAction = (L, verb, target, o) => (L && L.cjk ? cjWrap(L, cjSay(L, verb, target, o)) : base.sayAction(L, verb, target, o));
  P.sayEat = (L, food, o) => (L && L.cjk ? cjEat(L, food, o) : base.sayEat(L, food, o));
  P.wrapS = (L, s) => (L && L.cjk ? cjWrap(L, s) : base.wrapS(L, s));
  P.recastHTML = (canon, raw, escFn) => (CJ() && CJ().isCJK(CJ().lang()) && notation(canon) ? cjRecast(canon, raw, escFn) : base.recastHTML(canon, raw, escFn));
  P.setFoods = (L, list) => { if (L && L.cjk) { X.setFoods(L, list); return base.setFoods(L, []); } return base.setFoods(L, list); };

  // ---------------------------------------------------------------- for flow.js: "I don't know", hints, teach forms
  const IDK = new Set(['idk', 'buzhidao', 'wakaranai', 'wakarimasen', 'shiranai', 'shirimasen']);
  _.cj = {
    on: () => !!(CJ() && CJ().isCJK(CJ().lang())),
    // «?», «？», «不知道», «わからない», «idk»
    isIdk: text => { const s = String(text || '').trim(); if (/^[?？]+$/.test(s) || /^(i ?don'?t know|dunno)$/i.test(s)) return true; const C = CJ(); return !!C && IDK.has(C.canon(s)); },
    // the teach hint: the romanization with letters hidden (level 1: the first one, 2: every other one, 3: all, and the characters)
    mask: (src, level) => {
      const C = CJ(), spell = C.roman(src, { cap: false }), chars = C.mode() === 'chars';
      return [...spell].map((ch, i) => (i === 0 || (level >= 2 && i % 2 === 0) || level >= 3 || ch === ' ' ? ch : '_')).join(' ') + (chars && level >= 3 ? `  =  ${C.chars(src)}` : '');
    },
    // every form that teaches the word (the engine's, and the battle's own)
    forms: (L, id) => {
      const [kind, key] = String(id).split('.'), out = new Set();
      if (typeof LEX !== 'undefined' && LEX.item(id)) for (const f of LEX.accepted(id)) out.add(f);
      if (kind === 'v' && L.verbs[key]) L.verbs[key].cj.forEach(([w, f]) => { if (f !== 'masu' && f !== 'bad') out.add(w); });
      if (kind === 'a' && L.adjs[key]) L.adjs[key].cj.forEach(([w, st]) => { if (st !== 'bad') out.add(w); });
      if (kind === 'n') { const p = L.parts[key] || L.species[key] || (key === 'stone' ? L.stone : null); if (p) [p.w].concat(p.alt || []).forEach(w => out.add(w)); }
      if (kind === 'p' && L.positions[key]) [L.positions[key].w].concat(L.positions[key].alt || []).forEach(w => out.add(w));
      return [...out].filter(Boolean);
    },
    same: (a, b) => !!CJ() && CJ().same(a, b),
    used: (typed, src) => (CJ() ? CJ().used(typed, src) : []),
    parse: cjParse, say: cjSay,
  };
})();
