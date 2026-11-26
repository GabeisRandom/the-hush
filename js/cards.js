'use strict';
// Grandpa Chen's card table: 斗地主 (Fight the Landlord), the most played "Chinese poker" (DESIGN.md 14.11). zh games only.
// The user: "a grandpa who plays a lot of chinese poker" … "both of these should have their own unique and extensive side
// plots that give plenty of rich side content to people replaying the game in a new language".
//
// WHERE: on Alba's west side, the corner by the west street where es games have Don Fello's dominoes (DOMINO hides itself
// outside es, and world.js already keeps that yard bare). Under a scholar tree: a square card table, folding stools, a
// birdcage on a branch, a thermos, a radio, a bag of sunflower seeds, and a sign: 观棋不语真君子. Table at (−47.6, −162.6).
// WHO: 陈爷爷 Grandpa Chen «炸弹王» (the Bomb King: he saves his bombs for the end), calm, full of sayings; and his friend of
// forty years, 胡爷爷 Grandpa Hu, loud, a bluffer («胡说八道！», Chen says: Hu talks nonsense). The third stool is yours.
// HOW IT PLAYS: you bid and call every play out loud (typed), graded S–D the output-first way: 叫地主 / 不叫, the card names
// (三 … 十, J Q K A, 二, 小王, 大王), 对五, 三个五, 三带一, 三带一对, 顺子, 连对, 飞机, 四带二, 炸弹, 王炸, and 不要 / 过 / 要不起;
// down to two cards or one, you say so (我只剩一张了！). Select cards and call them, or just call them: 对五 finds your fives.
// Points are sunflower seeds (瓜子), never money; Grandpa Chen slips you a few coins when you win.
// CHAPTERS (gated by the story, like the other side characters: Rosa's welcome, the big Hushling, bells 1, 2, 3):
//   1 认牌 Know your cards: card names and numbers, which beats which, and 比大小 (War) with Grandpa Hu
//   2 叫地主 First games: the landlord against two farmers, bidding, singles and pairs, passing, 报单; a short game
//   3 炸弹！ Bombs: 三带一, 顺子, 连对, 飞机, 炸弹, 王炸; the full game; win as the landlord → Grandpa Chen's lucky cap for Mimo
//   4 老对手 Old rivals: their forty-year score book, sayings (姜还是老的辣, 一山还比一山高), the grudge match
//   5 输得起 A good loser: Hu loses, goes quiet, and the Hush creeps in; your words bring him back; why Chen plays
// API: CARDS.init(game) · CARDS.build(scene, env) → { colliders, group, people, update } · CARDS.capOn() (main.js: the straw hat
// steps aside) · CARDS.quest() · CARDS._ (the engine, the parser, tests: CARDS._.t). State: G.state.zc. Phrases: ph.zc.*.

const CARDS = (() => {
  // ================================================================ the cards (pure: no DOM, no THREE)
  // id 0..53: 0–51 → rank 3 + (id >> 2) (3–10; J 11, Q 12, K 13, A 14; 2 is 15), suit id & 3; 52 the small joker (16), 53 the big (17)
  const rk = id => (id < 52 ? 3 + (id >> 2) : id === 52 ? 16 : 17);
  const SUIT = ['♠', '♥', '♣', '♦'];
  const LABEL = r => (r <= 10 ? String(r) : { 11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: '小王', 17: '大王' }[r]);
  const RNAME = { 3: '[三|sān]', 4: '[四|sì]', 5: '[五|wǔ]', 6: '[六|liù]', 7: '[七|qī]', 8: '[八|bā]', 9: '[九|jiǔ]', 10: '[十|shí]', 11: 'J', 12: 'Q', 13: 'K', 14: 'A',
    15: '[二|èr]', 16: '[小王|xiǎo wáng]', 17: '[大王|dà wáng]' };
  const REN = { 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'jack', 12: 'queen', 13: 'king', 14: 'ace', 15: 'two', 16: 'small joker', 17: 'big joker' };
  const RPL = { 3: 'threes', 4: 'fours', 5: 'fives', 6: 'sixes', 7: 'sevens', 8: 'eights', 9: 'nines', 10: 'tens', 11: 'jacks', 12: 'queens', 13: 'kings', 14: 'aces', 15: 'twos' };
  const counts = ids => { const c = new Array(18).fill(0); for (const id of ids) c[rk(id)]++; return c; };
  const run = rs => rs.every((r, i) => i === 0 || r === rs[i - 1] + 1);
  const sortHand = ids => ids.slice().sort((a, b) => rk(b) - rk(a) || a - b);
  // what a set of cards is: { t, r (main rank: the lowest of a run), n (links in a run), w (wings: 0, 1 singles, 2 pairs) } or null
  function classify(ids) {
    const n = ids.length; if (!n) return null;
    const c = counts(ids), ranks = []; for (let r = 3; r <= 17; r++) if (c[r]) ranks.push(r);
    const of = k => ranks.filter(r => c[r] === k);
    if (n === 1) return { t: 'single', r: ranks[0], n: 1, w: 0 };
    if (n === 2) { if (c[16] && c[17]) return { t: 'rocket', r: 17, n: 1, w: 0 }; return ranks.length === 1 ? { t: 'pair', r: ranks[0], n: 1, w: 0 } : null; }
    if (n === 3) return ranks.length === 1 ? { t: 'trio', r: ranks[0], n: 1, w: 0 } : null;
    if (n === 4) { if (ranks.length === 1) return { t: 'bomb', r: ranks[0], n: 1, w: 0 }; return of(3).length === 1 ? { t: 'trio', r: of(3)[0], n: 1, w: 1 } : null; }
    if (n === 5 && of(3).length === 1 && of(2).length === 1 && !c[16] && !c[17]) return { t: 'trio', r: of(3)[0], n: 1, w: 2 };
    if (n >= 5 && ranks.length === n && run(ranks) && ranks[n - 1] <= 14) return { t: 'straight', r: ranks[0], n, w: 0 };
    if (n >= 6 && n % 2 === 0 && ranks.length === n / 2 && ranks.every(r => c[r] === 2) && run(ranks) && ranks[ranks.length - 1] <= 14) return { t: 'chain', r: ranks[0], n: n / 2, w: 0 };
    if (n === 6 && of(4).length === 1) return { t: 'four', r: of(4)[0], n: 1, w: 1 };
    if (n === 8 && of(4).length === 1 && of(2).length === 2) return { t: 'four', r: of(4)[0], n: 1, w: 2 };
    for (let k = Math.floor(n / 3); k >= 2; k--) for (let s = 3; s + k - 1 <= 14; s++) {
      let ok = true; for (let r = s; r < s + k; r++) if (c[r] < 3) { ok = false; break; }
      if (!ok) continue;
      const rest = n - 3 * k;
      if (rest === 0) return { t: 'plane', r: s, n: k, w: 0 };
      if (rest === k) return { t: 'plane', r: s, n: k, w: 1 };
      if (rest === 2 * k) { const left = c.slice(); for (let r = s; r < s + k; r++) left[r] -= 3; let pairs = true; for (let r = 3; r <= 17; r++) if (left[r] % 2 || (left[r] && r >= 16)) pairs = false; if (pairs) return { t: 'plane', r: s, n: k, w: 2 }; }
    }
    return null;
  }
  function beats(a, b) {
    if (!a) return false; if (!b) return true;
    if (a.t === 'rocket') return true; if (b.t === 'rocket') return false;
    if (a.t === 'bomb' && b.t !== 'bomb') return true;
    if (a.t !== b.t || a.n !== b.n || a.w !== b.w) return false;
    return a.r > b.r;
  }
  const byRank = hand => { const m = {}; for (const id of hand) (m[rk(id)] = m[rk(id)] || []).push(id); return m; };
  // the lowest k wing singles (kw 1) or pairs (kw 2), not from the excluded ranks; spares bombs and jokers while it can
  function wings(hand, excl, k, kw) {
    const B = byRank(hand), out = [];
    for (const pass of [0, 1, 2]) {
      for (let r = 3; r <= 17 && out.length < k * kw; r++) {
        if (excl.includes(r) || !B[r]) continue;
        const have = B[r].length - out.filter(id => rk(id) === r).length;
        if (have < kw) continue;
        if (pass === 0 && (have !== kw || r >= 15)) continue;        // first: exact singles / pairs, no 2s or jokers
        if (pass === 1 && (have === 4 || r >= 16)) continue;           // then: break a trio, use a 2
        if (out.length && out.some(id => rk(id) === r)) continue;
        out.push(...B[r].filter(id => !out.includes(id)).slice(0, kw));
      }
      if (out.length >= k * kw) break;
    }
    return out.length >= k * kw ? out.slice(0, k * kw) : null;
  }
  // every play from this hand that beats prev (or every lead, prev null); allow: the types this game uses (a Set) or null
  function plays(hand, prev, allow) {
    const B = byRank(hand), c = r => (B[r] ? B[r].length : 0), out = [], seen = new Set();
    const ok = t => !allow || allow.has(t);
    const push = ids => { if (!ids) return; const key = ids.slice().sort((a, b) => a - b).join(','); if (seen.has(key)) return; seen.add(key); const cl = classify(ids); if (cl && ok(cl.t) && (!prev || beats(cl, prev))) out.push(Object.assign({ ids }, cl)); };
    const want = prev && prev.t !== 'bomb' && prev.t !== 'rocket' ? prev : null, only = t => !prev || (want && want.t === t);
    for (let r = 3; r <= 17; r++) {
      if (c(r) >= 1 && only('single')) push(B[r].slice(0, 1));
      if (c(r) >= 2 && only('pair')) push(B[r].slice(0, 2));
      if (c(r) >= 3 && only('trio')) {
        if (!want || want.w === 0) push(B[r].slice(0, 3));
        if ((!want || want.w === 1) && ok('trio1')) { const w = wings(hand, [r], 1, 1); if (w) push(B[r].slice(0, 3).concat(w)); }
        if ((!want || want.w === 2) && ok('trio2')) { const w = wings(hand, [r], 1, 2); if (w) push(B[r].slice(0, 3).concat(w)); }
      }
      if (c(r) === 4 && only('four') && ok('four')) { for (const kw of [1, 2]) if (!want || want.w === kw) { const w = wings(hand, [r], 2, kw); if (w) push(B[r].slice().concat(w)); } }
    }
    if (only('straight')) for (let len = 5; len <= 12; len++) { if (want && want.n !== len) continue; for (let s = 3; s + len - 1 <= 14; s++) { let k = true; for (let r = s; r < s + len; r++) if (!c(r)) { k = false; break; } if (k) { const ids = []; for (let r = s; r < s + len; r++) ids.push(B[r][0]); push(ids); } } }
    if (only('chain')) for (let len = 3; len <= 10; len++) { if (want && want.n !== len) continue; for (let s = 3; s + len - 1 <= 14; s++) { let k = true; for (let r = s; r < s + len; r++) if (c(r) < 2) { k = false; break; } if (k) { const ids = []; for (let r = s; r < s + len; r++) ids.push(...B[r].slice(0, 2)); push(ids); } } }
    if (only('plane')) for (let len = 2; len <= 6; len++) { if (want && want.n !== len) continue; for (let s = 3; s + len - 1 <= 14; s++) {
      let k = true; for (let r = s; r < s + len; r++) if (c(r) < 3) { k = false; break; } if (!k) continue;
      const ids = [], rs = []; for (let r = s; r < s + len; r++) { ids.push(...B[r].slice(0, 3)); rs.push(r); }
      if (!want || want.w === 0) push(ids.slice());
      for (const kw of [1, 2]) if (!want || want.w === kw) { const w = wings(hand, rs, len, kw); if (w) push(ids.concat(w)); }
    } }
    if (ok('bomb')) for (let r = 3; r <= 15; r++) if (c(r) === 4) push(B[r].slice());
    if (ok('rocket') && c(16) && c(17)) push([B[16][0], B[17][0]]);
    return out;
  }

  // ================================================================ the computer players
  // A hand split the simple way (the rocket, bombs, planes, straights, pairs in a row, trios, pairs, singles): how many turns
  // it needs, roughly. The players weigh each play by what it leaves (fewer turns, fewer lonely low cards, high cards kept).
  function split(hand) {
    const c = counts(hand), G = [];
    if (c[16] && c[17]) { G.push('rocket'); c[16] = c[17] = 0; }
    for (let r = 3; r <= 15; r++) if (c[r] === 4) { G.push('bomb'); c[r] = 0; }
    for (let s = 3; s <= 13; s++) { let e = s; while (e <= 14 && c[e] >= 3) e++; if (e - s >= 2) { for (let r = s; r < e; r++) c[r] -= 3; G.push('plane'); } }
    for (let guard = 0; guard < 6; guard++) {        // straights: the longest run of single-ish cards, at least five
      let best = null;
      for (let s = 3; s <= 10; s++) { let e = s; while (e <= 14 && c[e] >= 1) e++; if (e - s >= 5 && (!best || e - s > best[1] - best[0])) best = [s, e]; }
      if (!best) break;
      for (let r = best[0]; r < best[1]; r++) c[r]--; G.push('straight');
    }
    for (let s = 3; s <= 12; s++) { let e = s; while (e <= 14 && c[e] >= 2) e++; if (e - s >= 3) { for (let r = s; r < e; r++) c[r] -= 2; G.push('chain'); } }
    let trios = 0, singles = 0, pairs = 0, lowSingles = 0;
    for (let r = 3; r <= 17; r++) { if (c[r] === 3) trios++; else if (c[r] === 2) pairs++; else if (c[r] === 1) { singles++; if (r < 11) lowSingles++; } }
    const kick = Math.min(trios, singles + pairs);        // (a trio carries a single or a pair along)
    return { turns: G.length + trios + pairs + singles - kick, low: lowSingles, groups: G };
  }
  const highOf = ids => ids.reduce((a, id) => a + (rk(id) >= 15 ? (rk(id) >= 16 ? 1.4 : 0.9) : rk(id) === 14 ? 0.35 : 0), 0);
  function costOf(rest) { if (!rest.length) return -100; const s = split(rest); return s.turns + s.low * 0.25; }
  // a computer player's choice: { ids, cl } or null (pass). me: { seat, nerve (bombs), noise, brave }; T: the table
  function choose(T, seat, me) {
    const hand = T.hands[seat], prev = T.last && T.last.seat !== seat ? T.last.cl : null, allow = T.allow;
    const enemy = s => (T.landlord === seat ? s !== seat : s === T.landlord);
    const enemyLow = Math.min(...[0, 1, 2].filter(s => s !== seat && enemy(s)).map(s => T.hands[s].length));
    const friend = T.last && T.last.seat !== seat && !enemy(T.last.seat);
    const list = plays(hand, prev, allow);
    const finish = list.find(p => p.ids.length === hand.length);
    if (finish) return finish;
    const jitter = () => (Math.random() - 0.5) * (me.noise || 0);
    let best = null, bestS = 1e9;
    for (const p of list) {
      const rest = hand.filter(id => !p.ids.includes(id));
      let s = costOf(rest) + highOf(p.ids) * (prev ? 0.55 : 0.8) - p.ids.length * 0.04 + jitter();
      if (p.t === 'bomb' || p.t === 'rocket') s += enemyLow <= 2 || rest.length <= 3 ? -0.5 : 4.5 - (me.nerve || 0);
      if (!prev) { if (enemyLow === 1 && p.t === 'single' && p.r < 15) s += 2.5; if (enemyLow === 2 && p.t === 'pair') s += 1.5; s += p.r * 0.02; }
      else if (p.t === prev.t && p.r - prev.r > 4 && enemyLow > 3) s += 0.4;     // (don't climb too high for a small play)
      if (s < bestS) { bestS = s; best = p; }
    }
    if (!prev) return best || (list[0] || null);
    // following: maybe pass
    let passS = costOf(hand) + jitter();
    if (friend) passS -= enemyLow <= 1 ? 0 : 3.2;                   // (let your partner's play stand)
    if (enemyLow <= 2 && !friend) passS += 3;                         // (an enemy about to go out: stop them)
    if (T.last && T.last.seat === T.landlord && !friend && T.hands[T.landlord].length <= 4) passS += 1.5;
    if (me.brave && !friend) passS += 0.8;
    return best && bestS < passS ? best : null;
  }
  // bidding: how strong a hand is for the landlord
  function strength(hand) { const c = counts(hand); let s = c[17] * 3 + c[16] * 2.5 + c[15] * 1.4 + c[14] * 0.5; for (let r = 3; r <= 15; r++) if (c[r] === 4) s += 3; return s - split(hand).turns * 0.35; }

  // ================================================================ a deal
  function deck() { const a = Array.from({ length: 54 }, (_, i) => i); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  // cfg.short: 8 cards each and 3 under the table (the first games); else the real thing: 17 each and 3
  function deal(cfg) {
    const d = deck(), n = cfg.short ? 8 : 17;
    return { hands: [0, 1, 2].map(s => sortHand(d.slice(s * n, s * n + n))), bottom: d.slice(3 * n, 3 * n + 3) };
  }

  // ================================================================ calling your plays (typed; graded the output-first way)
  // The words a call is made of (the notation), matched in what you typed through CJK.typed / matchAt, longest first:
  // characters must be the words' own; pinyin goes by syllable; tones are optional (a wrong one is noted).
  const VOC = [
    ['[要不起|yào bù qǐ]', 'pass'], ['[不要|bù yào]', 'pass'], ['[过|guò]', 'pass'], ['[不出|bù chū]', 'pass'],
    ['[叫地主|jiào dì zhǔ]', 'bid', 2], ['[不叫|bù jiào]', 'nobid'], ['[我叫|wǒ jiào]', 'bid', 1], ['[叫|jiào]', 'bid', 1],
    ['[王炸|wáng zhà]', 'type', 'rocket'], ['[火箭|huǒ jiàn]', 'type', 'rocket'], ['[对王|duì wáng]', 'type', 'rocket'],
    ['[炸弹|zhà dàn]', 'type', 'bomb'], ['[炸|zhà]', 'type', 'bomb'], ['[四个|sì gè]', 'type', 'four4'], ['[四张|sì zhāng]', 'type', 'four4'],
    ['[三带一对|sān dài yī duì]', 'type', 'trio2'], ['[三带二|sān dài èr]', 'type', 'trio2'], ['[三带一|sān dài yī]', 'type', 'trio1'],
    ['[四带二|sì dài èr]', 'type', 'four'], ['[飞机|fēi jī]', 'type', 'plane'], ['[连对|lián duì]', 'type', 'chain'], ['[顺子|shùn zi]', 'type', 'straight'],
    ['[对子|duì zi]', 'type', 'pair'], ['[一对|yī duì]', 'type', 'pair'], ['[对|duì]', 'type', 'pair'],
    ['[三个|sān gè]', 'type', 'trio'], ['[三张|sān zhāng]', 'type', 'trio'],
    ['[单张|dān zhāng]', 'type', 'single'], ['[一张|yī zhāng]', 'type', 'single'], ['[一个|yī gè]', 'type', 'single'], ['[单|dān]', 'type', 'single'],
    ['[两张|liǎng zhāng]', 'nw', 1], ['[两个|liǎng gè]', 'nw', 1], ['[两对|liǎng duì]', 'nw', 2],
    ['[带|dài]', 'with'], ['[到|dào]', 'to'], ['[剩|shèng]', 'left'], ['[报单|bào dān]', 'ann', 1], ['[报双|bào shuāng]', 'ann', 2],
    ['[大王|dà wáng]', 'rank', 17], ['[大鬼|dà guǐ]', 'rank', 17], ['[小王|xiǎo wáng]', 'rank', 16], ['[小鬼|xiǎo guǐ]', 'rank', 16],
    ['[三|sān]', 'rank', 3], ['[四|sì]', 'rank', 4], ['[五|wǔ]', 'rank', 5], ['[六|liù]', 'rank', 6], ['[七|qī]', 'rank', 7], ['[八|bā]', 'rank', 8],
    ['[九|jiǔ]', 'rank', 9], ['[十|shí]', 'rank', 10], ['[勾|gōu]', 'rank', 11], ['[圈|quān]', 'rank', 12], ['[凯|kǎi]', 'rank', 13], ['[尖|jiān]', 'rank', 14],
    ['[二|èr]', 'rank', 15], ['[两|liǎng]', 'rank', 15], ['[一|yī]', 'one'], ['[翅膀|chì bǎng]', 'f'], ['[地主|dì zhǔ]', 'f'],
    ['[我|wǒ]', 'f'], ['[出|chū]', 'f'], ['[了|le]', 'f'], ['[只|zhǐ]', 'f'], ['[还|hái]', 'f'], ['[张|zhāng]', 'f'], ['[个|gè]', 'f'], ['[牌|pái]', 'f'], ['[从|cóng]', 'f'], ['[吧|ba]', 'f'],
  ];
  let VW = null;
  const vocab = () => VW || (VW = VOC.map(([src, kind, val]) => ({ src, kind, val, w: CJK.wordOf(src, 'zh') })).sort((a, b) => b.w.syl.length - a.w.syl.length));
  const LETTER = { j: 11, q: 12, k: 13, a: 14 };
  function tokens(text) {
    const { U } = CJK.typed(String(text == null ? '' : text), 'zh'), toks = [];
    let unknown = 0, tone = false, digits = false;
    for (let i = 0; i < U.length;) {
      const u = U[i];
      if (u.digit) { const r = u.n >= 3 && u.n <= 10 ? u.n : u.n === 2 ? 15 : u.n === 1 ? 14 : 0; if (r) { toks.push({ kind: 'rank', val: r }); digits = true; } else unknown++; i++; continue; }
      let hit = null;
      for (const v of vocab()) { const m = CJK.matchAt(v.w, U, i, 'zh'); if (m) { hit = { v, m }; break; } }
      if (hit) { toks.push({ kind: hit.v.kind, val: hit.v.val, src: hit.v.src }); if (hit.m.toneBad) tone = true; i = hit.m.j; continue; }
      if (!u.han && LETTER[u.syl]) { toks.push({ kind: 'rank', val: LETTER[u.syl], letter: true }); i++; continue; }
      unknown++; i++;
    }
    return { toks, unknown, tone, digits, n: U.length };
  }
  // what a call says: { pass, bid, type, ranks (before 带), wtype / wr (after 带), ann (cards left), tone, digits, unknown }
  function readCall(text) {
    const raw = String(text == null ? '' : text);
    if (/^\s*pass\W*$/i.test(raw)) return { pass: 'pass', english: true, ranks: [], wr: [] };
    const T = tokens(raw), C = { ranks: [], wr: [], tone: T.tone, digits: T.digits, unknown: T.unknown, n: T.n, words: 0 };
    let after = false, to = false;
    for (const t of T.toks) {
      if (t.kind === 'f' || t.kind === 'one') { if (t.kind === 'one' && C.left) C.cnt = 1; continue; }
      C.words++;
      if (t.kind === 'pass') C.pass = t.src;
      else if (t.kind === 'bid') { C.bid = t.val; }
      else if (t.kind === 'nobid') C.nobid = true;
      else if (t.kind === 'left') C.left = true;
      else if (t.kind === 'ann') C.ann = t.val;
      else if (t.kind === 'with') after = true;
      else if (t.kind === 'nw') { if (C.left) C.cnt = 2; else { C.wtype = t.val === 2 ? 'pair' : 'single'; after = true; } }
      else if (t.kind === 'to') to = true;
      else if (t.kind === 'type') { if (C.left && t.val === 'single') C.cnt = 1; else if (after) C.wtype = t.val === 'pair' ? 'pair' : 'single'; else if (!C.type) C.type = t.val; }
      else if (t.kind === 'rank') {
        if (C.left && t.val === 15) C.cnt = 2;
        else if (after) C.wr.push(t.val);
        else if (to && C.ranks.length) { const a = C.ranks[C.ranks.length - 1]; for (let r = a + 1; r <= t.val; r++) C.ranks.push(r); C.range = true; to = false; }
        else C.ranks.push(t.val);
      }
    }
    if (C.ann) C.cnt = C.ann;
    return C;
  }
  // the combo a call names ({ t, w }; w null: any wings), or null
  function callType(C) {
    const wl = C.wtype ? (C.wtype === 'pair' ? 2 : 1) : null;
    switch (C.type) {
      case 'single': case 'pair': return { t: C.type, w: 0 };
      case 'trio': return { t: 'trio', w: wl !== null ? wl : C.wr.length ? 1 : 0 };
      case 'trio1': return { t: 'trio', w: 1 }; case 'trio2': return { t: 'trio', w: 2 };
      case 'four': return { t: 'four', w: wl !== null ? wl : null };
      case 'four4': case 'bomb': return { t: 'bomb', w: 0 }; case 'rocket': return { t: 'rocket', w: 0 };
      case 'straight': case 'chain': return { t: C.type, w: 0 };
      case 'plane': return { t: 'plane', w: wl !== null ? wl : C.wr.length ? 1 : null };
    }
    return null;
  }
  // no combo word: what the ranks alone say (五五 a pair, 三四五六七 a straight, 五五五七 a trio and a single…)
  function fromRanks(rs) {
    if (!rs.length) return null;
    const c = {}; rs.forEach(r => { c[r] = (c[r] || 0) + 1; });
    const keys = Object.keys(c).map(Number).sort((a, b) => a - b);
    if (keys.length === 2 && c[16] === 1 && c[17] === 1) return { t: 'rocket', w: 0, r: 17 };
    if (keys.length === 1) { const t = ['single', 'pair', 'trio', 'bomb'][rs.length - 1]; return t ? { t, w: 0, r: keys[0] } : null; }
    if (keys.every(r => c[r] === 1) && keys.length >= 5 && run(keys)) return { t: 'straight', w: 0, r: keys[0], n: keys.length };
    if (keys.every(r => c[r] === 2) && keys.length >= 3 && run(keys)) return { t: 'chain', w: 0, r: keys[0], n: keys.length };
    const tri = keys.filter(r => c[r] === 3);
    if (tri.length === 1 && (rs.length === 4 || (rs.length === 5 && keys.length === 2))) return { t: 'trio', w: rs.length - 3, r: tri[0], wr: keys.filter(r => r !== tri[0]) };
    return null;
  }
  // the cards a call means, from this hand, against prev → { ids } or { err: 'what' | 'none' | 'beat' | 'kind', r }
  function resolve(C, hand, prev, allow) {
    const ct = callType(C), inf = ct ? null : fromRanks(C.ranks), t = ct ? ct.t : inf && inf.t;
    if (!t) return { err: 'what' };
    if (inf && C.wr.length && inf.t === 'trio' && inf.w === 0) { inf.w = C.wr.length >= 2 && C.wr[0] === C.wr[1] ? 2 : 1; inf.wr = [...new Set(C.wr)]; }
    const B = byRank(hand), have = r => (B[r] ? B[r].length : 0);
    const w = ct ? ct.w : inf.w, all = plays(hand, prev, allow), mine = plays(hand, null, allow);
    const fit = p => p.t === t && (w === null || w === undefined || p.w === w);
    let pool = all.filter(fit), any = mine.filter(fit);
    const rs = ct ? C.ranks : (inf.n ? C.ranks : [inf.r]);
    if (rs.length) {
      if (['single', 'pair', 'trio', 'bomb', 'four'].includes(t)) { const r = rs[0]; pool = pool.filter(p => p.r === r); any = any.filter(p => p.r === r); if (!pool.length) return { err: any.length ? 'beat' : 'none', r }; }
      else { const lo = Math.min(...rs), hi = Math.max(...rs), match = p => p.r === lo && (rs.length === 1 || p.r + p.n - 1 === hi); pool = pool.filter(match); any = any.filter(match); if (!pool.length) return { err: any.length ? 'beat' : 'none' }; }
    }
    // wings named (三个五带一个七): the main part's cards, plus those
    const wr = ct ? C.wr : (inf.wr || []);
    if (wr.length && pool.length && (t === 'trio' || t === 'plane' || t === 'four')) {
      const p0 = pool[0], kw = p0.w || (C.wtype === 'pair' ? 2 : 1), main = p0.ids.filter(id => { const r = rk(id); return t === 'four' ? r === p0.r : r >= p0.r && r < p0.r + p0.n; }).slice(0, t === 'four' ? 4 : 3 * p0.n);
      const ws = []; for (const r of wr) { const left = (B[r] || []).filter(id => !main.includes(id) && !ws.includes(id)); if (left.length < kw) return { err: 'none', r }; ws.push(...left.slice(0, kw)); }
      const ids = main.concat(ws), cl = classify(ids);
      if (!cl || cl.t !== t) return { err: 'kind' };
      if (prev && !beats(cl, prev)) return { err: 'beat' };
      return { ids };
    }
    if (!pool.length) return { err: any.length ? 'beat' : (all.length || !prev ? 'kind' : 'beat') };
    pool.sort((a, b) => a.r - b.r || a.n - b.n || a.ids.length - b.ids.length);      // (the lowest, the shortest: say 三到十 for a longer straight)
    return { ids: pool[0].ids };
  }
  // the call a player would make for a play (the notation): the card for a single, 对五, 三个五, 三带一, 顺子, 炸弹, 王炸…
  function natural(cl) {
    if (!cl) return '[不要|bù yào]';
    switch (cl.t) {
      case 'single': return RNAME[cl.r];
      case 'pair': return '[对|duì] ' + RNAME[cl.r];
      case 'trio': return cl.w === 0 ? '[三个|sān gè] ' + RNAME[cl.r] : cl.w === 1 ? '[三带一|sān dài yī]' : '[三带一对|sān dài yī duì]';
      case 'straight': return '[顺子|shùn zi]'; case 'chain': return '[连对|lián duì]'; case 'plane': return '[飞机|fēi jī]';
      case 'four': return '[四带二|sì dài èr]'; case 'bomb': return '[炸弹|zhà dàn]'; case 'rocket': return '[王炸|wáng zhà]';
    }
    return '';
  }
  // the play in English: "a pair of fives", "a straight, 3 to 7"…
  function enOf(cl) {
    if (!cl) return 'a pass';
    const R = cl.r, top = cl.r + cl.n - 1;
    switch (cl.t) {
      case 'single': return R >= 16 ? 'the ' + REN[R] : 'a ' + REN[R];
      case 'pair': return 'a pair of ' + RPL[R]; case 'trio': return ['three ', 'three ', 'three '][cl.w] + RPL[R] + ['', ' and a single', ' and a pair'][cl.w];
      case 'straight': return `a straight, ${LABEL(R)} to ${LABEL(top)}`; case 'chain': return `pairs in a row, ${LABEL(R)} to ${LABEL(top)}`;
      case 'plane': return `an airplane, ${LABEL(R)}${LABEL(R)}${LABEL(R)} to ${LABEL(top)}${LABEL(top)}${LABEL(top)}${cl.w ? ' with wings' : ''}`;
      case 'four': return 'four ' + RPL[R] + (cl.w === 2 ? ' and two pairs' : ' and two singles'); case 'bomb': return 'a bomb: four ' + RPL[R]; case 'rocket': return 'the rocket: both jokers';
    }
    return '';
  }
  const GR = ['S', 'A', 'B', 'C', 'D'], gi = g => GR.indexOf(g), capG = (g, m) => GR[Math.max(gi(g), gi(m))];
  // how well a call names the play made: { g: 'S' … 'D', why (English, with the model), model (the natural call) }
  function gradeCall(C, cl) {
    const model = natural(cl), P = s => ZHF.P(s), why = [];
    let g = 'S';
    const ct = callType(C);
    if (ct) {
      const sameT = ct.t === cl.t && (ct.w === null || ct.w === cl.w);
      if (!sameT) { g = 'C'; why.push(`that’s ${enOf(cl)}: «${P(model)}»`); }
      else if (['single', 'pair'].includes(cl.t) || (cl.t === 'trio' && cl.w === 0) || cl.t === 'bomb' && C.type === 'four4') {
        if (!C.ranks.length && cl.t !== 'bomb') { g = 'A'; why.push(`say which: «${P(model)}»`); }
        else if (C.ranks.length && C.ranks[0] !== cl.r) { g = 'C'; why.push(`those are ${RPL[cl.r] || REN[cl.r]}: «${P(model)}»`); }
      } else if (C.ranks.length && !C.ranks.includes(cl.r)) { g = 'B'; why.push(`not quite those cards, but OK: «${P(model)}»`); }
    } else {
      const inf = fromRanks(C.ranks);
      if (cl.t === 'single' && C.ranks.length === 1 && C.ranks[0] === cl.r) g = 'S';
      else if (inf && inf.t === cl.t && (inf.r === cl.r)) { g = 'B'; why.push(`name the combo: «${P(model)}»`); }
      else { g = 'C'; why.push(`call it «${P(model)}»`); }
    }
    if (C.digits) { g = capG(g, 'B'); why.push('say the numbers in Chinese'); }
    if (C.tone) { g = capG(g, 'A'); why.push('tones: ' + ZHF.R(model)); }
    return { g, why: why.join(' · '), model };
  }
  function gradePass(C, could) {
    if (C.english) return { g: 'C', why: 'say it in Chinese: «' + ZHF.P('[不要|bù yào]') + '» or «' + ZHF.P('[过|guò]') + '»', model: '[不要|bù yào]' };
    const model = could ? '[不要|bù yào]' : '[要不起|yào bù qǐ]';
    return { g: C.tone ? 'A' : 'S', why: C.tone ? 'tones: ' + ZHF.R(C.pass) : (!could && C.pass !== '[要不起|yào bù qǐ]' ? 'also: «' + ZHF.P('[要不起|yào bù qǐ]') + '» (can’t beat it)' : ''), model };
  }

  // ================================================================ the table: an overlay in the game's paper look
  const CSS = `
#zf .zc { display: grid; grid-template-rows: auto 1fr auto; height: min(730px, calc(100vh - 16px)); }
#zf .zc-top { display: flex; align-items: center; gap: 12px; padding: 7px 14px; border-bottom: 2px dashed rgba(43,34,53,.2); background: linear-gradient(90deg, #fff1e6, #fffaf0); }
#zf .zc-top .t b { font: 800 21px Bahnschrift, "Segoe UI", sans-serif; display: block; line-height: 1.1; } #zf .zc-top .t span { font-size: 12px; font-weight: 700; opacity: .65; }
#zf .zc-pills { margin-left: auto; display: flex; gap: 8px; align-items: center; }
#zf .zc-pill { display: flex; flex-direction: column; align-items: center; min-width: 70px; padding: 1px 10px 3px; border: 2.5px solid #2b2235; border-radius: 14px; background: #fff; }
#zf .zc-pill small { font-size: 10px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; opacity: .6; } #zf .zc-pill b { font: 900 20px Bahnschrift, sans-serif; line-height: 1.05; }
#zf .zc-pill.x b { color: #c8322a; }
#zf .zc-btns { display: flex; gap: 6px; } #zf .zc-btns button { font-size: 12px; padding: 3px 8px; }
#zf .zc-mid { position: relative; display: grid; grid-template-columns: 138px 1fr 138px; gap: 8px; padding: 8px 10px 6px; min-height: 0; }
#zf .zc-seat { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-weight: 800; text-align: center; min-width: 0; }
#zf .zc-seat canvas { width: 64px; height: 64px; border-radius: 50%; background: #fff; border: 2.5px solid #2b2235; transition: box-shadow .2s; }
#zf .zc-seat.turn canvas { box-shadow: 0 0 0 4px #ffd166, 0 0 0 7px #2b2235; }
#zf .zc-seat .nm { font-size: 15px; line-height: 1.25; }
#zf .zc-role { font-size: 12px; padding: 0 8px; border-radius: 99px; border: 2px solid #2b2235; background: #f4efe2; } #zf .zc-role.lord { background: #c8322a; color: #fff; } #zf .zc-role.farm { background: #e8c35a; }
#zf .zc-backs { display: flex; justify-content: center; padding-left: 6px; min-height: 24px; } #zf .zc-back { width: 13px; height: 22px; margin-left: -6px; border-radius: 3px; background: repeating-linear-gradient(45deg, #c8322a 0 3px, #a82820 3px 6px); border: 1.5px solid #2b2235; }
#zf .zc-seat .n { font: 900 15px Bahnschrift, sans-serif; }
#zf .zc-table { position: relative; border-radius: 22px; background: #2f6f4f; box-shadow: inset 0 0 0 3px #2b2235, inset 0 0 0 11px #275d42, 0 5px 0 rgba(43,34,53,.2); min-height: 260px; }
#zf .zc-under { position: absolute; top: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 4px; align-items: center; }
#zf .zc-under small { color: #fffaf0; font-weight: 800; font-size: 11px; opacity: .8; margin-right: 6px; }
#zf .zc-trick { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 3px; }
#zf .zc-trick .cards { display: flex; padding-left: 14px; } #zf .zc-trick .lab { color: #fffaf0; font: 700 13px ${ZHF.SANS}; text-shadow: 0 1px 0 #1d3a2a; max-width: 230px; text-align: center; line-height: 1.35; }
#zf .zc-trick.L { left: 16px; top: 38%; } #zf .zc-trick.R { right: 16px; top: 38%; } #zf .zc-trick.Y { left: 50%; bottom: 14px; transform: translateX(-50%); }
#zf .zc-trick.pass .lab { font-size: 16px; color: #ffe9a8; }
#zf .zc-c { position: relative; width: 42px; height: 60px; border-radius: 7px; background: #fffdf6; border: 2px solid #2b2235; box-shadow: 0 2px 0 rgba(43,34,53,.3); margin-left: -14px;
  display: flex; flex-direction: column; align-items: flex-start; padding: 2px 4px; font: 900 17px Bahnschrift, "Segoe UI", sans-serif; color: #2b2235; flex: 0 0 auto; line-height: 1; }
#zf .zc-c.red { color: #c8322a; } #zf .zc-c i { font-style: normal; font-size: 14px; }
#zf .zc-c.jk { font: 900 14px ${ZHF.SANS}; align-items: center; justify-content: center; letter-spacing: 0; } #zf .zc-c.jk b { font-size: 19px; }
#zf .zc-c.back { background: repeating-linear-gradient(45deg, #c8322a 0 4px, #a82820 4px 8px); }
#zf .zc-c.new { animation: zc-drop .3s cubic-bezier(.3,1.5,.5,1); } @keyframes zc-drop { from { opacity: 0; transform: translateY(-18px) scale(1.2); } }
#zf .zc-mult { position: absolute; right: 14px; top: 10px; color: #ffe9a8; font: 900 18px Bahnschrift, sans-serif; }
#zf .zc-say { position: absolute; z-index: 4; max-width: 260px; background: #fff; border: 2.5px solid #2b2235; border-radius: 14px; padding: 4px 11px 5px; font-weight: 800; font-size: 18px; line-height: 1.45;
  box-shadow: 0 3px 0 rgba(43,34,53,.18); pointer-events: none; opacity: 0; transition: opacity .15s; }
#zf .zc-say.on { opacity: 1; } #zf .zc-say i { display: block; font-size: 12px; font-weight: 600; opacity: .7; line-height: 1.3; }
#zf .zc-say.L { left: 120px; top: 6px; } #zf .zc-say.R { right: 120px; top: 6px; } #zf .zc-say.Y { left: 50%; transform: translateX(-50%); bottom: 4px; background: #fffaf0; color: #13786b; }
#zf .zc-low { display: grid; grid-template-columns: 96px 1fr 320px; gap: 10px; align-items: end; padding: 4px 12px 10px; border-top: 2px dashed rgba(43,34,53,.2); }
#zf .zc-hand { display: flex; justify-content: center; align-items: flex-end; padding: 18px 6px 4px; min-height: 100px; overflow: hidden; }
#zf .zc-hand .zc-c { width: 50px; height: 72px; margin-left: var(--ml, -20px); cursor: pointer; transition: transform .1s, box-shadow .1s; }
#zf .zc-hand .zc-c:first-child { margin-left: 0; }
#zf .zc-hand .zc-c.sel { transform: translateY(-14px); box-shadow: 0 0 0 3px #ffd166, 0 0 0 5px #2b2235; }
#zf .zc-hand .zc-c small { position: absolute; top: 36px; left: 3px; font: 700 12px ${ZHF.SANS}; color: #2b2235; opacity: .8; line-height: 1.1; }
#zf .zc-under .zc-c { margin-left: 3px; }
#zf .zc-hand .zc-c small rt { font-size: 9px; }
#zf .zc-act { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
#zf .zc-status { font-size: 14px; font-weight: 700; line-height: 1.35; min-height: 38px; } #zf .zc-status b { color: #c8322a; }
#zf .zc-call { display: flex; flex-direction: column; gap: 5px; background: #fff; border: 2.5px solid #2b2235; border-radius: 14px; padding: 7px 9px; box-shadow: 0 0 0 4px #ffd166; }
#zf .zc-call.off { opacity: .55; box-shadow: none; } #zf .zc-call label { font-size: 13px; font-weight: 800; }
#zf .zc-call .row { display: flex; gap: 6px; } #zf .zc-call input { font-size: 19px; padding: 3px 8px; }
#zf .zc-call .hint { font-size: 12.5px; font-weight: 700; color: #c8322a; min-height: 0; line-height: 1.4; }
#zf .zc-call .hint .m { color: #2b2235; font-size: 15px; }
#zf .zc-grade { position: absolute; left: 50%; top: 46%; transform: translate(-50%, -50%) rotate(-4deg); z-index: 5; font: 900 34px Bahnschrift, sans-serif; color: #fff; border: 3px solid #2b2235; border-radius: 16px; padding: 0 16px; opacity: 0; transition: opacity .2s; pointer-events: none; }
#zf .zc-grade.on { opacity: 1; } #zf .zc-grade.S { background: #e0a020; } #zf .zc-grade.A { background: #21a493; } #zf .zc-grade.B { background: #3f7fc9; } #zf .zc-grade.C { background: #8a5ab0; } #zf .zc-grade.D { background: #8a8f9e; }
#zf .zc-modal { position: absolute; inset: 0; z-index: 8; display: grid; place-items: center; background: rgba(255,250,240,.78); }
#zf .zc-modalin { width: min(620px, calc(100% - 30px)); max-height: calc(100% - 30px); overflow: auto; background: #fffaf0; border: 3px solid #2b2235; border-radius: 20px; padding: 14px 22px 16px; box-shadow: 0 0 0 6px #fff, 0 12px 0 5px rgba(43,34,53,.18); text-align: center; }
#zf .zc-modalin .tag { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .6; }
#zf .zc-modalin .big { font: 900 36px ${ZHF.SANS}; color: #c8322a; line-height: 1.3; } #zf .zc-modalin .big.win { color: #13786b; }
#zf .zc-modalin .why { font-size: 15px; font-weight: 700; margin: 4px 0 8px; } #zf .zc-modalin ul { text-align: left; font-size: 14px; line-height: 1.5; padding-left: 18px; margin: 6px 0 10px; }
#zf .zc-modalin .row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 8px; }
#zf .zc-modalin .gr { display: flex; gap: 6px; justify-content: center; margin: 6px 0; }
@media (max-width: 860px) { #zf .zc-mid { grid-template-columns: 84px 1fr 84px; } #zf .zc-low { grid-template-columns: 1fr; } #zf .zc-low > .zc-seat { display: none; } #zf .zc-say.L { left: 70px; } #zf .zc-say.R { right: 70px; } }
`;
  const NAMES = { chen: '[陈|Chén] [爷爷|yé ye]', hu: '[胡|Hú] [爷爷|yé ye]', kid: '[龙龙|Lóng long]' };
  const ICON = { chen: 'zcChen', hu: 'zcHu', kid: 'zcKid', you: 'zcYou' };
  const AIS = { chen: { noise: 0.2, nerve: 1.0, bid: 6.4 }, hu: { noise: 0.85, nerve: 2.2, brave: true, bid: 5.4 }, kid: { noise: 1.7, nerve: 0.5, bid: 4.5 } };
  const SIDE = ['Y', 'R', 'L'];
  const H = (s, o) => ZHF.H(s, o), Pl = s => ZHF.P(s), esc = ZHF.esc;
  const TB = { open: false, T: null, fast: false, resolveYou: null, sel: new Set(), ui: null, say: [null, null, null], pause: false };
  const pause = ms => (TB.fast ? Promise.resolve() : ZHF.tick(ms));
  function cardHTML(id, cls = '', label = false) {
    const r = rk(id);
    if (r >= 16) return `<div class="zc-c jk ${r === 17 ? 'red' : ''} ${cls}" data-id="${id}"><b>${r === 17 ? '大' : '小'}</b>王${label ? `<small>${H(RNAME[r])}</small>` : ''}</div>`;
    const s = id & 3, red = s === 1 || s === 3;
    return `<div class="zc-c ${red ? 'red' : ''} ${cls}" data-id="${id}">${LABEL(r)}<i>${SUIT[s]}</i>${label ? `<small>${H(RNAME[r])}</small>` : ''}</div>`;
  }
  function ensureUI() {
    ZHF.css('zc-css', CSS);
    const html = `<div class="zc">
  <div class="zc-top"><div class="t"><b>${H('[斗地主|dòu dì zhǔ]')}</b><span class="sub"></span></div>
    <div class="zc-pills"><div class="zc-pill"><small>Your seeds</small><b class="seeds">0</b></div><div class="zc-pill x"><small>Score ×</small><b class="mult">1</b></div></div>
    <div class="zc-btns"><button type="button" data-k="rules">Rules <kbd>F1</kbd></button><button type="button" data-k="pause">Pause <kbd>Esc</kbd></button></div></div>
  <div class="zc-mid">
    <div class="zc-seat s2"><canvas width="96" height="96"></canvas><div class="nm"></div><div class="zc-role"></div><div class="zc-backs"></div><div class="n"></div></div>
    <div class="zc-table"><div class="zc-under"></div><div class="zc-mult"></div><div class="zc-trick L"></div><div class="zc-trick R"></div><div class="zc-trick Y"></div><div class="zc-grade"></div></div>
    <div class="zc-seat s1"><canvas width="96" height="96"></canvas><div class="nm"></div><div class="zc-role"></div><div class="zc-backs"></div><div class="n"></div></div>
    <div class="zc-say L"></div><div class="zc-say R"></div>
  </div>
  <div class="zc-low">
    <div class="zc-seat s0"><canvas width="96" height="96"></canvas><div class="nm">You</div><div class="zc-role"></div></div>
    <div class="zc-hand"></div>
    <div class="zc-act"><div class="zc-status"></div>
      <form class="zc-call" autocomplete="off"><label></label><div class="row"><input class="zf-in" spellcheck="false"><button type="submit" class="go">Say it</button><button type="button" class="help" title="What could I say?">?</button></div><div class="hint"></div></form></div>
  </div>
  <div class="zc-say Y"></div>
  <div class="zc-modal hidden"><div class="zc-modalin"></div></div>
</div>`;
    const panel = ZHF.open(html, onKey, 'zc-panel');
    const q = s => panel.querySelector(s);
    TB.ui = { panel, sub: q('.sub'), seeds: q('.seeds'), mult: q('.mult'), seat: [q('.s0'), q('.s1'), q('.s2')], say: [q('.zc-say.Y'), q('.zc-say.R'), q('.zc-say.L')],
      under: q('.zc-under'), trick: [q('.zc-trick.Y'), q('.zc-trick.R'), q('.zc-trick.L')], grade: q('.zc-grade'), hand: q('.zc-hand'), status: q('.zc-status'),
      call: q('.zc-call'), label: q('.zc-call label'), input: q('.zc-call input'), hint: q('.zc-call .hint'), help: q('.zc-call .help'), modal: q('.zc-modal'), modalIn: q('.zc-modalin') };
    const U = TB.ui;
    ZHF.ime(U.input);
    U.call.addEventListener('submit', e => { e.preventDefault(); submitYou(U.input.value); });
    U.help.onclick = () => { showHelp(); U.input.focus(); };
    U.hand.addEventListener('click', e => { const c = e.target.closest('.zc-c'); if (!c || !TB.T || TB.T.phase !== 'play' || TB.T.turn !== 0) return; const id = +c.dataset.id; if (TB.sel.has(id)) TB.sel.delete(id); else TB.sel.add(id); drawHand(); previewSel(); U.input.focus(); });
    panel.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { b.blur(); if (b.dataset.k === 'rules') rulesCard(); else openPause(); });
    return U;
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (TB.modalClose) TB.modalClose(); else openPause(); }
    else if (e.key === 'F1') { e.preventDefault(); e.stopPropagation(); rulesCard(); }
    else if (e.key === 'Enter' && TB.modalClose && document.activeElement !== TB.ui.input) { e.preventDefault(); TB.modalClose(); }
  }
  function modal(html, buttons) {
    const U = TB.ui; U.modalIn.innerHTML = html + `<div class="row">${buttons.map((b, i) => `<button type="button" class="${i === 0 ? 'go' : ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div>`;
    U.modal.classList.remove('hidden');
    return new Promise(res => {
      const done = i => { U.modal.classList.add('hidden'); TB.modalClose = null; res(buttons[i] ? buttons[i].value : null); setTimeout(() => U.input.focus(), 30); };
      U.modalIn.querySelectorAll('button[data-i]').forEach(b => b.onclick = () => done(+b.dataset.i));
      TB.modalClose = () => done(0);
      setTimeout(() => { const b = U.modalIn.querySelector('button.go'); if (b) b.focus(); }, 40);
    });
  }
  function rulesCard() {
    if (!TB.ui || TB.modalClose) return;
    const T = TB.T, short = T && T.cfg.short;
    modal(`<div class="tag">How 斗地主 works</div><div class="big">${H('[一|yī] [个|gè] [地主|dì zhǔ] ， [两|liǎng] [个|gè] [农民|nóng mín]')}</div>
<ul><li>One <b>landlord</b> (${H('[地主|dì zhǔ]')}) against two <b>farmers</b> (${H('[农民|nóng mín]')}), who team up. Bid with ${H('[叫地主|jiào dì zhǔ]')} or ${H('[不叫|bù jiào]')}: the landlord takes the three cards under the table and leads.</li>
<li>Low to high: 3 4 5 6 7 8 9 10 J Q K A <b>2</b>, the small joker ${H('[小王|xiǎo wáng]')}, the big joker ${H('[大王|dà wáng]')}.</li>
<li>Beat the last play with the same kind, higher, or pass: ${H('[不要|bù yào]')} · ${H('[过|guò]')} · ${H('[要不起|yào bù qǐ]')} (can’t). Two passes, and the last player leads anything.</li>
<li>${short ? 'This short game: singles, pairs ' + H('[对|duì]') + ', three of a kind ' + H('[三个|sān gè]') + ', bombs and the rocket.' : 'Plays: single, pair ' + H('[对|duì] [五|wǔ]') + ', three ' + H('[三个|sān gè] [五|wǔ]') + ', ' + H('[三带一|sān dài yī]') + ' / ' + H('[三带一对|sān dài yī duì]') + ', straight ' + H('[顺子|shùn zi]') + ' (5+), pairs in a row ' + H('[连对|lián duì]') + ' (3+), airplane ' + H('[飞机|fēi jī]') + ', ' + H('[四带二|sì dài èr]') + '.'}</li>
<li>${H('[炸弹|zhà dàn]')} (four of a kind) beats anything but a bigger bomb; ${H('[王炸|wáng zhà]')} (both jokers) beats everything. Each doubles the score.</li>
<li>Down to two cards, or one, say so: ${H('[我|wǒ] [只|zhǐ] [剩|shèng] [一|yī] [张|zhāng] [了|le] ！')} First to play out every card wins.</li>
<li><b>Calling:</b> select cards and say them, or just say them (${H('[对|duì] [五|wǔ]')} finds your fives). Tones are optional. <b>?</b> shows what you could say.</li></ul>`, [{ label: 'Back to the game', value: 1 }]);
  }
  async function openPause() {
    if (!TB.ui || TB.modalClose) return;
    const v = await modal(`<div class="tag">Paused</div><div class="big">${H('[休息|xiū xi] [一|yī] [下|xià]')}</div><div class="why">Take a break. Leaving now ends the game (no seeds won or lost).</div>`, [{ label: 'Keep playing', value: 'go' }, { label: 'Leave the table', value: 'quit' }]);
    if (v === 'quit' && TB.T) { TB.T.quit = true; if (TB.resolveYou) TB.resolveYou({ quit: true }); }
  }
  // --- drawing
  function drawSeats() {
    const T = TB.T, U = TB.ui;
    for (let s = 0; s < 3; s++) {
      const el = U.seat[s], who = T.who[s];
      if (!el._drawn) { ZHF.face(el.querySelector('canvas'), ICON[who] || 'zcYou'); el._drawn = true; }
      el.querySelector('.nm').innerHTML = s === 0 ? 'You' : H(NAMES[who]);
      const role = el.querySelector('.zc-role');
      role.className = 'zc-role ' + (T.landlord < 0 ? '' : T.landlord === s ? 'lord' : 'farm');
      role.innerHTML = T.landlord < 0 ? '…' : T.landlord === s ? H('[地主|dì zhǔ]') : H('[农民|nóng mín]');
      el.classList.toggle('turn', T.turn === s && !T.over);
      if (s > 0) { el.querySelector('.zc-backs').innerHTML = '<i class="zc-back"></i>'.repeat(Math.min(10, T.hands[s].length)); el.querySelector('.n').textContent = T.hands[s].length + (T.hands[s].length === 1 ? ' card' : ' cards'); }
    }
    U.seeds.textContent = (TB.seeds[0] > 0 ? '+' : '') + TB.seeds[0];
    U.mult.textContent = T.mult;
    U.under.innerHTML = '<small>under the table</small>' + T.bottom.map(id => T.landlord < 0 ? '<div class="zc-c back"></div>' : cardHTML(id)).join('');
  }
  function drawHand() {
    const T = TB.T, U = TB.ui, lab = T.cfg.labels !== false, n = T.hands[0].length;
    const avail = Math.max(200, (U.hand.clientWidth || 520) - 20), step = Math.max(14, Math.min(46, (avail - 50) / Math.max(1, n - 1)));
    U.hand.style.setProperty('--ml', (step - 50).toFixed(1) + 'px');
    U.hand.innerHTML = sortHand(T.hands[0]).map(id => cardHTML(id, (TB.sel.has(id) ? 'sel ' : '') + (T.fresh && T.fresh.includes(id) ? 'new' : ''), lab)).join('');
  }
  function drawTrick(s, cl, ids, pass) {
    const el = TB.ui.trick[s];
    el.className = 'zc-trick ' + SIDE[s] + (pass ? ' pass' : '');
    if (!cl && !pass) { el.innerHTML = ''; return; }
    el.innerHTML = pass ? `<div class="lab">${H(pass)}</div>` : `<div class="cards">${sortHand(ids).map(id => cardHTML(id, 'new')).join('')}</div><div class="lab">${H(natural(cl))}</div>`;
  }
  function bubble(s, zh, en, ms) {
    const el = TB.ui.say[s]; if (!el) return;
    // (by the weave like every line, DESIGN.md 17.3: mixed, the English with the words you know in Chinese, whole in Chinese as
    // the weave rises; never the English under it)
    let html = H(zh);
    try { if (en && typeof STORY !== 'undefined' && STORY.mixHTML) html = STORY.mixHTML(zh, en, { key: 'zc:' + en }).html; } catch (e) { /* (as written) */ }
    el.innerHTML = html; el.classList.add('on');
    try { CJK.seen(zh, { lang: 'zh' }); } catch (e) { /* */ }
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), ms || 2600);
  }
  function badge(g) { const el = TB.ui.grade; el.className = 'zc-grade on ' + g; el.textContent = g; clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 900); try { Sound.play(g === 'S' ? 'perfect' : g === 'D' ? 'wrong' : 'click'); } catch (e) { /* */ } }
  function status(html) { TB.ui.status.innerHTML = html; }
  function callBox(on, label) { const U = TB.ui; U.call.classList.toggle('off', !on); U.input.disabled = !on; U.label.textContent = label || ''; if (on) { U.input.value = ''; setTimeout(() => U.input.focus(), 30); } }
  function hint(html) { TB.ui.hint.innerHTML = html || ''; }
  function shake() { const c = TB.ui.call; c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); try { Sound.play('wrong'); } catch (e) { /* */ } }
  function previewSel() {
    const T = TB.T; if (!T || T.turn !== 0 || T.phase !== 'play') return;
    const ids = [...TB.sel]; if (!ids.length) { hint(''); return; }
    const cl = classify(ids), prev = T.last && T.last.seat !== 0 ? T.last.cl : null;
    hint(!cl ? 'Those cards don’t make a play together.' : prev && !beats(cl, prev) ? `That’s ${enOf(cl)}: it doesn’t beat ${enOf(prev)}.` : `<span class="m">${esc(enOf(cl))}</span>: now say it!`);
  }
  function showHelp() {
    const T = TB.T; if (!T) return;
    T.helped = (T.helped || 0) + 1;
    let list = [];
    if (T.phase === 'bid') list = ['[叫地主|jiào dì zhǔ]', '[不叫|bù jiào]'];
    else if (T.phase === 'ann') list = [T.annN === 1 ? '[我|wǒ] [只|zhǐ] [剩|shèng] [一|yī] [张|zhāng] [了|le] ！' : '[我|wǒ] [还|hái] [剩|shèng] [两|liǎng] [张|zhāng] ！'];
    else if (T.phase === 'play') {
      const prev = T.last && T.last.seat !== 0 ? T.last.cl : null, ps = plays(T.hands[0], prev, T.allow);
      const pick = []; const seenT = new Set();
      for (const p of ps.sort((a, b) => (a.t === 'bomb' || a.t === 'rocket') - (b.t === 'bomb' || b.t === 'rocket') || b.ids.length - a.ids.length || a.r - b.r)) { const k = p.t + p.w; if (seenT.has(k) && p.t !== 'single' && p.t !== 'pair') continue; seenT.add(k); pick.push(natural(p)); if (pick.length >= 4) break; }
      list = pick.slice(0, 4); if (prev) list.push(ps.length ? '[不要|bù yào]' : '[要不起|yào bù qǐ]');
    }
    hint('You could say: ' + list.map(s => `<span class="m">${H(s, { ruby: 'always' })}</span>`).join(' · '));
  }

  // --- talking at the table
  const annSrc = n => (n === 1 ? '[我|wǒ] [只|zhǐ] [剩|shèng] [一|yī] [张|zhāng] [了|le] ！' : '[我|wǒ] [还|hái] [剩|shèng] [两|liǎng] [张|zhāng] ！');
  function aiSay(s, ev, extra) {
    const who = TB.T.who[s], B = (BANTER[who] || BANTER.chen)[ev]; if (!B || !B.length) return;
    const [zh, en] = ZHF.pick(B); bubble(s, extra ? extra[0] + ' ' + zh : zh, extra ? extra[1] + ' ' + en : en);
  }
  function errText(r, C, prev) {
    if (r.err === 'what') return `Say what you play: a card (${H('[五|wǔ]', { ruby: 'always' })}), ${H('[对|duì] [五|wǔ]', { ruby: 'always' })}, ${H('[三个|sān gè] [五|wǔ]', { ruby: 'always' })}, ${H('[顺子|shùn zi]', { ruby: 'always' })}, ${H('[炸弹|zhà dàn]', { ruby: 'always' })}… or ${H('[不要|bù yào]', { ruby: 'always' })} to pass.`;
    if (r.err === 'none') return r.r ? `You don’t have that: no ${esc(C.type === 'pair' ? 'pair of ' + (RPL[r.r] || REN[r.r]) : C.type === 'trio' || C.type === 'four4' || C.type === 'bomb' ? 'set of ' + (RPL[r.r] || REN[r.r]) : REN[r.r])} in your hand.` : 'You don’t have those cards.';
    if (r.err === 'beat') return prev ? `That doesn’t beat ${esc(enOf(prev))}. Something higher, or ${H('[不要|bù yào]', { ruby: 'always' })}.` : 'You can’t play that.';
    return prev ? `To beat ${esc(enOf(prev))} you need the same kind, higher (or a bomb). Or pass: ${H('[不要|bù yào]', { ruby: 'always' })}.` : `You can’t make that from your hand${TB.T && TB.T.allow ? ' (this short game has singles, pairs, threes and bombs)' : ''}.`;
  }
  // --- you
  function yourTurn(phase) { const T = TB.T; T.phase = phase; T.turn = 0; drawSeats(); return new Promise(res => { TB.resolveYou = res; }); }
  function submitYou(text) {
    const T = TB.T; if (!T || !TB.resolveYou || T.turn !== 0) return;
    const t = String(text || '').trim(); if (!t) return;
    if (ZHF.idk(t)) { showHelp(); TB.ui.input.value = ''; return; }
    const C = readCall(t), done = v => { const r = TB.resolveYou; TB.resolveYou = null; TB.ui.input.value = ''; r(Object.assign({ said: t }, v)); };
    if (T.phase === 'bid') {
      if (C.nobid) return done({ bid: 0, g: C.tone ? 'A' : 'S', model: '[不叫|bù jiào]' });
      if (C.bid) return done({ bid: 1, g: C.bid === 2 ? (C.tone ? 'A' : 'S') : 'A', model: '[叫地主|jiào dì zhǔ]', why: C.bid === 2 ? '' : 'the whole call: «' + Pl('[叫地主|jiào dì zhǔ]') + '»' });
      if (C.pass) return done({ bid: 0, g: 'B', model: '[不叫|bù jiào]', why: 'at the bidding it’s «' + Pl('[不叫|bù jiào]') + '»' });
      shake(); hint(`Bid: ${H('[叫地主|jiào dì zhǔ]', { ruby: 'always' })} (be the landlord) or ${H('[不叫|bù jiào]', { ruby: 'always' })} (no bid).`); return;
    }
    if (T.phase === 'ann') {
      if (C.cnt === T.annN) return done({ g: C.tone ? 'A' : 'S' });
      T.annTries = (T.annTries || 0) + 1; shake();
      hint((C.cnt ? `You have ${T.annN === 1 ? 'one card' : 'two cards'} left: ` : 'Tell them how many cards you have left: ') + H(annSrc(T.annN), { ruby: 'always' }));
      if (T.annTries >= 3) done({ g: 'D' });
      return;
    }
    const prev = T.last && T.last.seat !== 0 ? T.last.cl : null;
    if (C.pass) {
      if (!prev) { shake(); hint('You lead, so you can’t pass: play anything! Pick cards and call them, or just say one.'); return; }
      return done({ pass: true, grade: gradePass(C, plays(T.hands[0], prev, T.allow).length > 0) });
    }
    let ids = [...TB.sel], cl = null;
    if (ids.length) {
      cl = classify(ids);
      if (!cl || (T.allow && !T.allow.has(cl.t))) { shake(); hint('Those cards don’t make a play' + (cl ? ' in this game' : '') + '. Click them to put them back, or just say your play.'); return; }
      if (prev && !beats(cl, prev)) { shake(); hint(`That doesn’t beat ${esc(enOf(prev))}.`); return; }
      if (!C.words) { shake(); hint('Now say it out loud: ' + H(natural(cl), { ruby: 'always' })); return; }
    } else {
      const r = resolve(C, T.hands[0], prev, T.allow);
      if (r.err) { shake(); hint(errText(r, C, prev)); return; }
      ids = r.ids; cl = classify(ids);
    }
    done({ ids, cl, grade: gradeCall(C, cl) });
  }
  async function yourAnnounce(n) {
    const T = TB.T; T.annN = n; T.annTries = 0;
    status(`You have <b>${n === 1 ? 'one card' : 'two cards'}</b> left: tell them!`);
    callBox(true, 'Announce it:'); hint(T.cfg.hints ? 'Say: ' + H(annSrc(n), { ruby: 'always' }) : '');
    const a = await yourTurn('ann'); callBox(false);
    if (a.quit) { T.quit = true; return; }
    T.grades.push({ g: a.g, said: a.said, model: annSrc(n) }); badge(a.g); bubble(0, annSrc(n), n === 1 ? 'I’m down to one card!' : 'I’ve got two left!');
    if (a.g === 'D') hint('It’s ' + H(annSrc(n), { ruby: 'always' }));
  }
  // --- bidding: in turn, 叫地主 or 不叫; the first to bid is the landlord; nobody: deal again
  async function bidding(T) {
    T.phase = 'bid';
    const first = T.cfg.firstBid !== undefined ? T.cfg.firstBid : Math.floor(Math.random() * 3);
    status('Bidding: who wants to be the landlord?');
    for (let k = 0; k < 3; k++) {
      const s = (first + k) % 3; T.turn = s; drawSeats();
      if (s === 0) {
        callBox(true, 'Bid: be the landlord?'); hint(T.cfg.hints ? `Say ${H('[叫地主|jiào dì zhǔ]', { ruby: 'always' })} to be the landlord, or ${H('[不叫|bù jiào]', { ruby: 'always' })}.` : '');
        const a = await yourTurn('bid'); callBox(false);
        if (a.quit) { T.quit = true; return -1; }
        T.grades.push({ g: a.g, said: a.said, model: a.model }); badge(a.g); bubble(0, a.model, a.bid ? 'I’ll be the landlord!' : 'No bid.');
        hint(a.why ? '✓ … ' + a.why : '');
        if (a.bid) return 0;
      } else {
        await pause(700);
        const me = AIS[T.who[s]] || AIS.chen, st = strength(T.hands[s]) * (T.cfg.short ? 1.9 : 1) + (Math.random() - 0.5) * 1.4;
        const yes = T.cfg.lord !== undefined ? T.cfg.lord === s : st >= me.bid;
        aiSay(s, yes ? 'bid' : 'nobid');
        if (yes) return s;
      }
      await pause(450);
    }
    return -1;
  }
  // --- one game
  function newT(cfg) {
    return { cfg, who: cfg.who || ['you', 'chen', 'hu'], allow: cfg.short ? new Set(['single', 'pair', 'trio', 'bomb', 'rocket']) : null, hands: [[], [], []], bottom: [],
      landlord: -1, turn: 0, last: null, mult: 1, bombs: 0, plays: [0, 0, 0], grades: [], phase: 'deal', over: false, quit: false };
  }
  async function oneGame(T) {
    const U = TB.ui;
    for (let tries = 0; ; tries++) {
      const d = deal(T.cfg); Object.assign(T, { hands: d.hands, bottom: d.bottom, landlord: -1, last: null, mult: 1, bombs: 0, plays: [0, 0, 0] }); TB.sel.clear();
      for (let s = 0; s < 3; s++) drawTrick(s, null);
      T.fresh = T.hands[0].slice(); drawHand(); T.fresh = null; drawSeats(); status('Dealing…'); hint(''); callBox(false);
      try { Sound.play('page'); } catch (e) { /* */ }
      await pause(600);
      const lord = tries >= 2 && T.cfg.lord === undefined ? Math.floor(Math.random() * 3) : await bidding(T);
      if (T.quit) return;
      if (lord >= 0) { T.landlord = lord; break; }
      bubble(1, '[没人|méi rén] [叫|jiào] 。 [重新|chóng xīn] [发牌|fā pái] ！', 'Nobody bid. Deal again!'); await pause(1300);
    }
    const L = T.landlord;
    T.hands[L] = sortHand(T.hands[L].concat(T.bottom));
    if (L === 0) { T.fresh = T.bottom.slice(); drawHand(); T.fresh = null; }
    drawSeats(); if (L > 0) aiSay(L, 'lord');
    status(L === 0 ? 'You’re the <b>landlord</b>: the three cards are yours, and you lead. Win alone against both!' : `${H(NAMES[T.who[L]])} is the <b>landlord</b>. You and ${H(NAMES[T.who[3 - L]])} are farmers: team up!`);
    await pause(1200);
    T.turn = L; T.last = null; T.phase = 'play';
    while (!T.over && !T.quit) {
      const s = T.turn;
      if (T.last && T.last.seat === s) { for (let k = 0; k < 3; k++) drawTrick(k, null); T.last = null; }
      const prev = T.last ? T.last.cl : null;
      drawSeats();
      let act;
      if (s === 0) {
        TB.sel.clear(); drawHand();
        status(prev ? `Your turn: beat <b>${esc(enOf(prev))}</b> (${H(natural(prev))}), or pass.` : 'Your lead: play anything.');
        callBox(true, prev ? 'Call your play, or pass:' : 'Call your play (pick cards, or just say them):');
        hint(T.cfg.hints ? 'Stuck? <b>?</b> shows what you could say.' : '');
        act = await yourTurn('play'); callBox(false);
        if (act.quit) { T.quit = true; break; }
        const g = act.pass ? act.grade : act.grade;
        T.grades.push({ g: g.g, said: act.said, model: g.model }); badge(g.g);
        hint(g.why ? (gi(g.g) <= 1 ? '✓ ' : '') + g.why : '');
        bubble(0, act.pass ? (g.model) : natural(act.cl), act.pass ? 'Pass.' : enOf(act.cl));
      } else {
        status(`${H(NAMES[T.who[s]])} is thinking…`); await pause(600 + Math.random() * 500);
        if (T.quit) break;
        const me0 = AIS[T.who[s]] || AIS.chen, p = choose(T, s, T.cfg.easy ? Object.assign({}, me0, { noise: (me0.noise || 0) + 0.9, nerve: (me0.nerve || 0) + 1.2, brave: false }) : me0);
        act = p ? { ids: p.ids, cl: classify(p.ids) } : { pass: true, could: plays(T.hands[s], prev, T.allow).length > 0 };
      }
      if (act.pass) {
        drawTrick(s, null, null, s === 0 ? act.grade.model : act.could ? '[不要|bù yào]' : '[要不起|yào bù qǐ]');
        if (s > 0) aiSay(s, act.could ? 'pass' : 'cant');
      } else {
        T.hands[s] = T.hands[s].filter(id => !act.ids.includes(id)); T.last = { seat: s, cl: act.cl, ids: act.ids }; T.plays[s]++;
        const boom = act.cl.t === 'bomb' || act.cl.t === 'rocket';
        if (boom) { T.mult *= 2; T.bombs++; U.panel.querySelector('.zc-table').classList.remove('shake'); void U.panel.offsetWidth; U.panel.querySelector('.zc-table').classList.add('shake'); }
        drawTrick(s, act.cl, act.ids);
        if (s > 0) { const ev = boom ? act.cl.t : prev ? 'beat' : null; if (ev && Math.random() < (boom ? 1 : 0.35)) aiSay(s, ev, [natural(act.cl), '']); else bubble(s, natural(act.cl), enOf(act.cl)); }
        else if (boom && T.who.includes('hu')) setTimeout(() => { if (TB.T === T) aiSay(T.who.indexOf('hu'), 'youBomb'); }, 700);
        try { Sound.play(boom ? 'hit' : 'wood'); } catch (e) { /* */ }
        drawHand(); drawSeats();
        const left = T.hands[s].length;
        if (left === 0) { T.over = true; T.winner = s; break; }
        if (left <= 2) { if (s === 0) await yourAnnounce(left); else { await pause(350); aiSay(s, left === 1 ? 'left1' : 'left2'); } }
      }
      await pause(s === 0 ? 350 : 650);
      T.turn = (s + 1) % 3;
    }
    if (T.quit) return;
    // the score: spring (春天) doubles it once more
    const lordWon = T.winner === L;
    const spring = lordWon ? T.plays.every((n, s) => s === L || n === 0) : T.plays[L] <= 1;
    if (spring) T.mult *= 2;
    const v = (T.cfg.base || 2) * T.mult, d = [0, 1, 2].map(s => (s === L ? (lordWon ? 2 * v : -2 * v) : (lordWon ? -v : v)));
    TB.seeds = TB.seeds.map((x, s) => x + d[s]);
    const youWon = L === 0 ? lordWon : !lordWon;
    T.result = { youWon, lordWon, landlord: L, spring, mult: T.mult, bombs: T.bombs, delta: d, winner: T.winner, grades: T.grades, asLord: L === 0 };
    for (let s = 1; s < 3; s++) { const won = s === L ? lordWon : !lordWon; aiSay(s, won ? 'win' : 'lose'); }
    drawSeats(); status(youWon ? '<b>You won!</b>' : 'You lost this one.');
    try { Sound.play(youWon ? 'fanfare' : 'lose'); } catch (e) { /* */ }
    await pause(1300);
  }
  async function resultCard(T, g, cfg) {
    const R = T.result, cnt = { S: 0, A: 0, B: 0, C: 0, D: 0 }; R.grades.forEach(x => { cnt[x.g]++; });
    const best = R.grades.filter(x => x.g === 'S' && x.said).slice(-1)[0];
    const title = R.youWon ? (R.asLord ? H('[地主|dì zhǔ] [赢|yíng] [了|le] ！') : H('[农民|nóng mín] [赢|yíng] [了|le] ！')) : (R.lordWon ? H('[地主|dì zhǔ] [赢|yíng] [了|le] 。') : H('[农民|nóng mín] [赢|yíng] [了|le] 。'));
    const html = `<div class="tag">${cfg.games > 1 ? `Game ${g + 1} of ${cfg.games}` : 'The game'}</div><div class="big ${R.youWon ? 'win' : ''}">${title}</div>
<div class="why">${R.youWon ? 'You won' : 'You lost'}${R.asLord ? ' as the landlord' : ' as a farmer'}${R.spring ? ` · ${H('[春天|chūn tiān]')}! (a shutout: ×2)` : ''}${R.bombs ? ` · ${R.bombs} bomb${R.bombs > 1 ? 's' : ''} (×${Math.pow(2, R.bombs)})` : ''}</div>
<div class="why">Sunflower seeds ${H('[瓜子|guā zǐ]')}: you ${R.delta[0] >= 0 ? '+' : ''}${R.delta[0]} · ${H(NAMES[T.who[1]])} ${R.delta[1] >= 0 ? '+' : ''}${R.delta[1]} · ${H(NAMES[T.who[2]])} ${R.delta[2] >= 0 ? '+' : ''}${R.delta[2]}</div>
<div class="gr">${Object.entries(cnt).filter(([, n]) => n).map(([k, n]) => `<span class="zf-badge ${k}">${k} ×${n}</span>`).join('')}</div>
${best ? `<div class="why">Your best call: «${esc(best.said)}»</div>` : ''}`;
    if (!TB.fast) await modal(html, [{ label: cfg.games > 1 && g + 1 < cfg.games ? 'Next game' : 'Done', value: 1 }]);
  }
  // a session at the table: cfg { who: ['you', 'chen', 'hu'], short, games, base, hints, sub, lord (who bids) } →
  // { outcome: 'win' | 'lose' | 'quit', results, seeds: [you, right, left], best (the seat with the most seeds) }
  async function runTable(cfg) {
    if (TB.open) return { outcome: 'quit' };
    TB.open = true; TB.seeds = [0, 0, 0]; const results = [];
    try {
      ensureUI(); TB.ui.sub.innerHTML = cfg.sub || '';
      for (let g = 0; g < (cfg.games || 1); g++) {
        const T = newT(cfg); TB.T = T;
        await oneGame(T);
        if (T.quit) return { outcome: 'quit', results, seeds: TB.seeds.slice() };
        results.push(T.result);
        await resultCard(T, g, cfg);
      }
      const best = [0, 1, 2].reduce((a, s) => (TB.seeds[s] > TB.seeds[a] ? s : a), 0);
      const won = (cfg.games || 1) > 1 ? best === 0 && TB.seeds[0] > Math.max(TB.seeds[1], TB.seeds[2]) - 0.5 : results[0].youWon;
      return { outcome: won ? 'win' : 'lose', results, seeds: TB.seeds.slice(), best };
    } catch (e) { console.error('[cards] table', e); return { outcome: 'quit', results, seeds: TB.seeds.slice() }; }
    finally { TB.open = false; TB.T = null; TB.resolveYou = null; TB.modalClose = null; ZHF.close(); }
  }

  // ================================================================ what they say (CJK.md notation; never about your gender)
  const BANTER = {
    chen: {
      bid: [['[叫地主|jiào dì zhǔ] 。', 'I’ll be the landlord.']], nobid: [['[不叫|bù jiào] 。', 'No bid.']],
      lord: [['[我|wǒ] [是|shì] [地主|dì zhǔ] 。 [来|lái] [吧|ba] 。', 'I’m the landlord. Come on, then.']],
      beat: [['[管上|guǎn shàng] 。', 'Topped.'], ['[压|yā] [住|zhù] ！', 'Covered!']], pass: [['[不要|bù yào] 。', 'Pass.'], ['[过|guò] 。', 'Pass.']], cant: [['[要不起|yào bù qǐ] 。', 'Can’t beat it.']],
      bomb: [['[炸弹王|Zhà dàn wáng] [来|lái] [了|le] ！', 'The Bomb King is here!']], rocket: [['[老|lǎo] [天|tiān] [爷|yé] … [王炸|wáng zhà] ！', 'Heavens… the rocket!']],
      left2: [['[我|wǒ] [还|hái] [剩|shèng] [两|liǎng] [张|zhāng] 。', 'I’ve got two left.']], left1: [['[我|wǒ] [只|zhǐ] [剩|shèng] [一|yī] [张|zhāng] [了|le] 。', 'I’m down to one.']],
      win: [['[姜|jiāng] [还是|hái shì] [老|lǎo] [的|de] [辣|là] 。', 'Old ginger is spicier.']],
      lose: [['[一|yī] [山|shān] [还|hái] [比|bǐ] [一|yī] [山|shān] [高|gāo] 。', 'There’s always a higher mountain.'], ['[风水|fēng shuǐ] [轮流|lún liú] [转|zhuàn] 。', 'Luck goes round.']],
    },
    hu: {
      bid: [['[叫地主|jiào dì zhǔ] ！ [我|wǒ] [的|de] [牌|pái] [太|tài] [好|hǎo] [了|le] ！', 'I’ll be the landlord! My cards are too good!']], nobid: [['[不叫|bù jiào] 。 [臭|chòu] [牌|pái] ！', 'No bid. Stinky cards!']],
      lord: [['[我|wǒ] [是|shì] [地主|dì zhǔ] ！ [你们|nǐ men] [都|dōu] [是|shì] [我|wǒ] [的|de] [农民|nóng mín] ！', 'I’m the landlord! You’re all my farmers!']],
      beat: [['[管上|guǎn shàng] ！', 'Topped!'], ['[看|kàn] [我|wǒ] [的|de] ！', 'Watch this!']], pass: [['[不要|bù yào] ！', 'Pass!'], ['[过|guò] ！', 'Pass!']], cant: [['[要不起|yào bù qǐ] … [哎|āi] 。', 'Can’t beat it… sigh.']],
      bomb: [['[炸弹|zhà dàn] ！ [哈哈|hā ha] ！', 'Bomb! Ha ha!']], rocket: [['[王炸|wáng zhà] ！ [谁|shéi] [敢|gǎn] [管|guǎn] ？', 'Rocket! Who dares top that?']],
      left2: [['[我|wǒ] [还|hái] [剩|shèng] [两|liǎng] [张|zhāng] ！', 'Two left!']], left1: [['[我|wǒ] [只|zhǐ] [剩|shèng] [一|yī] [张|zhāng] [了|le] ！', 'Only one left!']],
      win: [['[我|wǒ] [赢|yíng] [了|le] ！ [我|wǒ] [赢|yíng] [了|le] ！', 'I won! I won!']], lose: [['[哎呀|āi yā] ！ [臭|chòu] [牌|pái] ！', 'Argh! Stinky cards!'], ['[再|zài] [来|lái] [一|yī] [局|jú] ！', 'One more game!']],
      youBomb: [['[哎哟|āi yō] ！', 'Ouch!']],
    },
    kid: {
      bid: [['[叫地主|jiào dì zhǔ] ！ [我|wǒ] [是|shì] [龙|lóng] ！', 'I bid! I’m a dragon!']], nobid: [['[不叫|bù jiào] …', 'No bid…']], lord: [['[我|wǒ] [是|shì] [地主|dì zhǔ] ！', 'I’m the landlord!']],
      beat: [['[嘿嘿|hēi hei] ！', 'Hee hee!']], pass: [['[不要|bù yào] 。', 'Pass.']], cant: [['[要不起|yào bù qǐ] …', 'Can’t beat it…']],
      bomb: [['[龙|lóng] [炸弹|zhà dàn] ！', 'Dragon bomb!']], rocket: [['[王炸|wáng zhà] ！', 'Rocket!']],
      left2: [['[我|wǒ] [还|hái] [剩|shèng] [两|liǎng] [张|zhāng] ！', 'Two left!']], left1: [['[我|wǒ] [只|zhǐ] [剩|shèng] [一|yī] [张|zhāng] [了|le] ！', 'One left!']],
      win: [['[我|wǒ] [赢|yíng] [了|le] ！', 'I won!']], lose: [['[我|wǒ] … [输|shū] [了|le] …', 'I… lost…']],
    },
  };
  const T2 = (zh, en) => ({ zh: [zh], en: [en] });
  const LT = {
    'zc.hu.slam': T2('[炸弹|zhà dàn] ！ [哈哈|hā ha] ！', 'Bomb! Ha ha!'),
    'zc.chen.calm': T2('[老|Lǎo] [胡|Hú] ， [那|nà] [是|shì] [三个|sān gè] [五|wǔ] ， [不是|bù shì] [炸弹|zhà dàn] 。', 'Lao Hu, that’s three fives. Not a bomb.'),
    'zc.hu.oops': T2('[哎呀|āi yā] ， [我|wǒ] [数|shǔ] [错|cuò] [了|le] 。', 'Oops, I counted wrong.'),
    'zc.chen.hi': T2('[你好|nǐ hǎo] ！ [我|wǒ] [姓|xìng] [陈|Chén] 。 [大家|dà jiā] [叫|jiào] [我|wǒ] [陈|Chén] [爷爷|yé ye] 。', 'Hello! My surname is Chen. Everyone calls me Grandpa Chen.'),
    'zc.hu.hi': T2('[我|wǒ] [是|shì] [胡|Hú] [爷爷|yé ye] ！ [打牌|dǎ pái] [我|wǒ] [最|zuì] [厉害|lì hai] ！', 'I’m Grandpa Hu! Nobody plays cards better than me!'),
    'zc.chen.nonsense': T2('[胡说|hú shuō] [八道|bā dào] ！', 'Nonsense!'),
    'zc.chen.game': T2('[我们|wǒ men] [在|zài] [打|dǎ] [斗地主|dòu dì zhǔ] 。 [三|sān] [个|gè] [人|rén] [玩|wán] 。', 'We’re playing Dou Dizhu: Fight the Landlord. It’s a game for three.'),
    'zc.chen.seat': T2('[这|zhè] [个|gè] [凳子|dèng zi] [是|shì] [你|nǐ] [的|de] 。 [可是|kě shì] [先|xiān] [认识|rèn shi] [牌|pái] ！', 'That stool is yours. But first, get to know the cards!'),
    'zc.chen.mimo': T2('[嘘|xū] ！ [观棋|guān qí] [不语|bù yǔ] [真|zhēn] [君子|jūn zǐ] 。', 'Shh! A true gentleman watches the game in silence.'),
    'zc.chen.l1': T2('[最|zuì] [小|xiǎo] [的|de] [是|shì] [三|sān] ， [最|zuì] [大|dà] [的|de] [是|shì] [大王|dà wáng] 。 [二|èr] [比|bǐ] A [大|dà] ！', 'The smallest is the three, the biggest is the big joker. And the two beats the ace!'),
    'zc.hu.war': T2('[来|lái] ， [比|bǐ] [大小|dà xiǎo] ！ [谁|shéi] [的|de] [牌|pái] [大|dà] ， [谁|shéi] [赢|yíng] 。', 'Come on, let’s play War! Whoever’s card is bigger wins.'),
    'zc.hu.warLost': T2('[哎呀|āi yā] ！ [你|nǐ] [的|de] [手气|shǒu qì] [真|zhēn] [好|hǎo] ！', 'Argh! You’re on a lucky streak!'),
    'zc.hu.warWon': T2('[哈哈|hā ha] ！ [我|wǒ] [的|de] [牌|pái] [大|dà] ！ [我|wǒ] [的|de] [手气|shǒu qì] [最|zuì] [好|hǎo] ！', 'Ha ha! My cards are bigger! I’ve got the luck!'),
    'zc.chen.l1done': T2('[不错|bù cuò] ！ [你|nǐ] [认识|rèn shi] [牌|pái] [了|le] 。 [下次|xià cì] [教|jiāo] [你|nǐ] [叫地主|jiào dì zhǔ] 。', 'Not bad! You know the cards now. Next time I’ll teach you to bid for the landlord.'),
    'zc.chen.waitBoss': T2('[先|xiān] [去|qù] [帮|bāng] [布鲁诺|Bù lǔ nuò] [吧|ba] 。 [山上|shān shang] [那|nà] [个|gè] [大|dà] [家伙|jiā huo] … [回来|huí lái] [再|zài] [玩|wán] 。', 'Go and help Bruno first. That big fellow on the hill… then come back and play.'),
    'zc.chen.waitBell': T2('[钟|zhōng] [响|xiǎng] [了|le] [以后|yǐ hòu] ， [再|zài] [来|lái] [找|zhǎo] [我|wǒ] 。', 'Come and find me after the next bell rings.'),
    'zc.chen.rules2': T2('[一|yī] [个|gè] [地主|dì zhǔ] ， [两|liǎng] [个|gè] [农民|nóng mín] 。 [农民|nóng mín] [一起|yī qǐ] [打|dǎ] [地主|dì zhǔ] ！', 'One landlord, two farmers. The farmers fight the landlord together!'),
    'zc.chen.rules2b': T2('[谁|shéi] [先|xiān] [出|chū] [完|wán] [牌|pái] ， [谁|shéi] [赢|yíng] 。', 'Whoever plays out all their cards first wins.'),
    'zc.hu.short': T2('[先|xiān] [玩|wán] [短|duǎn] [的|de] 。 [每|měi] [人|rén] [八|bā] [张|zhāng] [牌|pái] ！', 'A short one first: eight cards each!'),
    'zc.chen.win2': T2('[好|hǎo] ！ [你|nǐ] [会|huì] [打|dǎ] [斗地主|dòu dì zhǔ] [了|le] ！', 'Good! Now you can play Fight the Landlord!'),
    'zc.hu.again': T2('[哈哈|hā ha] ！ [再|zài] [来|lái] [一|yī] [局|jú] ？', 'Ha ha! One more game?'),
    'zc.chen.l3': T2('[今天|jīn tiān] [教|jiāo] [你|nǐ] [大|dà] [牌|pái] ： [顺子|shùn zi] ， [飞机|fēi jī] ， [炸弹|zhà dàn] ！', 'Today I’ll teach you the big plays: straights, airplanes, bombs!'),
    'zc.chen.bombking': T2('[大家|dà jiā] [叫|jiào] [我|wǒ] [炸弹王|Zhà dàn wáng] 。 [炸弹|zhà dàn] [要|yào] [留|liú] [到|dào] [最后|zuì hòu] ！', 'They call me the Bomb King. Save your bombs for the end!'),
    'zc.chen.full': T2('[现在|xiàn zài] [玩|wán] [真|zhēn] [的|de] ： [每|měi] [人|rén] [十七|shí qī] [张|zhāng] 。 [当|dāng] [地主|dì zhǔ] ， [赢|yíng] [一|yī] [次|cì] ！', 'Now the real thing: seventeen cards each. Be the landlord, and win once!'),
    'zc.chen.cap': T2('[这|zhè] [顶|dǐng] [帽子|mào zi] [跟|gēn] [了|le] [我|wǒ] [四十|sì shí] [年|nián] 。 [送|sòng] [给|gěi] {mimo} ， [带来|dài lái] [好|hǎo] [运气|yùn qi] ！', 'This cap has been with me forty years. It’s for {mimo}: it brings good luck!'),
    'zc.hu.cap': T2('[哎|āi] ！ [我|wǒ] [要|yào] [了|le] [十|shí] [年|nián] ， [他|tā] [都|dōu] [不|bù] [给|gěi] [我|wǒ] ！', 'Hey! I asked for that cap for ten years, and he never gave it to me!'),
    'zc.chen.lordAgain': T2('[当|dāng] [一|yī] [次|cì] [地主|dì zhǔ] ， [赢|yíng] [一|yī] [次|cì] 。 [再|zài] [来|lái] ！', 'Be the landlord once, and win once. Again!'),
    'zc.hu.book': T2('[看|kàn] [这|zhè] [个|gè] [本子|běn zi] ！ [四十|sì shí] [年|nián] ， [每|měi] [一|yī] [局|jú] [我们|wǒ men] [都|dōu] [记|jì] [下来|xià lái] [了|le] 。', 'Look at this notebook! Forty years, and we wrote down every single game.'),
    'zc.chen.tie': T2('[他|tā] [赢|yíng] [了|le] [三千|sān qiān] [局|jú] ， [我|wǒ] [也|yě] [赢|yíng] [了|le] [三千|sān qiān] [局|jú] 。', 'He’s won three thousand games. So have I.'),
    'zc.hu.decide': T2('[今天|jīn tiān] [我们|wǒ men] [比|bǐ] [一|yī] [比|bǐ] ！ [你|nǐ] [当|dāng] [第三|dì sān] [个|gè] [人|rén] 。', 'Today we settle it! You’ll be the third player.'),
    'zc.chen.match': T2('[打|dǎ] [三|sān] [局|jú] 。 [瓜子|guā zǐ] [最|zuì] [多|duō] [的|de] [人|rén] [赢|yíng] 。', 'Three games. Whoever ends up with the most sunflower seeds wins.'),
    'zc.chen.mountain': T2('[一|yī] [山|shān] [还|hái] [比|bǐ] [一|yī] [山|shān] [高|gāo] ！ [我们|wǒ men] [两|liǎng] [个|gè] [老头|lǎo tóu] [都|dōu] [输|shū] [了|le] ！', 'There’s always a higher mountain! Both of us old men lost!'),
    'zc.chen.ginger': T2('[姜|jiāng] [还是|hái shì] [老|lǎo] [的|de] [辣|là] ！', 'Old ginger is spicier!'),
    'zc.hu.hmph': T2('[哼|hēng] ！ [下次|xià cì] [我|wǒ] [一定|yī dìng] [赢|yíng] 。', 'Hmph! I’ll win next time, for sure.'),
    'zc.hu.won': T2('[哈哈|hā ha] ！ [我|wǒ] [赢|yíng] [了|le] ！ [写|xiě] [下来|xià lái] ！ [写|xiě] [下来|xià lái] ！', 'Ha ha! I won! Write it down! Write it down!'),
    'zc.chen.sigh': T2('[好|hǎo] [吧|ba] ， [好|hǎo] [吧|ba] 。 [我|wǒ] [写|xiě] 。', 'All right, all right. I’ll write it down.'),
    'zc.hu.gray': T2('[我|wǒ] … [输|shū] [了|le] … [不|bù] [想|xiǎng] [说话|shuō huà] [了|le] …', 'I… lost… I don’t want to talk anymore…'),
    'zc.chen.worried': T2('[老|Lǎo] [胡|Hú] ？ [你|nǐ] [怎么|zěn me] [了|le] ？ [你|nǐ] [的|de] [脸|liǎn] [都|dōu] [灰|huī] [了|le] ！', 'Lao Hu? What’s wrong? Your face has gone gray!'),
    'zc.chen.helpHu': T2('[快|kuài] ， [跟|gēn] [他|tā] [说话|shuō huà] ！ [别|bié] [让|ràng] [寂静|Jì jìng] [拿走|ná zǒu] [他|tā] [的|de] [话|huà] ！', 'Quick, talk to him! Don’t let the Hush take his words!'),
    'zc.hu.back': T2('… [再|zài] [来|lái] [一|yī] [局|jú] ！ [这|zhè] [次|cì] [我|wǒ] [一定|yī dìng] [赢|yíng] ！', '…One more game! This time I’ll win for sure!'),
    'zc.chen.why': T2('[我|wǒ] [儿子|ér zi] [去|qù] [了|le] [大|dà] [城市|chéng shì] 。 [家里|jiā lǐ] [太|tài] [安静|ān jìng] [了|le] 。', 'My son went off to the big city. The house got too quiet.'),
    'zc.chen.why2': T2('[老|Lǎo] [胡|Hú] [每天|měi tiān] [带|dài] [着|zhe] [一|yī] [副|fù] [牌|pái] [来|lái] [找|zhǎo] [我|wǒ] 。 [打牌|dǎ pái] [要|yào] [说话|shuō huà] ， [寂静|Jì jìng] [就|jiù] [进|jìn] [不|bù] [来|lái] 。', 'Lao Hu came round every day with a deck of cards. At cards you have to talk, so the Hush couldn’t get in.'),
    'zc.chen.lesson5': T2('[牌品|pái pǐn] [看|kàn] [人品|rén pǐn] 。 [输|shū] [了|le] [也|yě] [要|yào] [笑|xiào] 。', 'How you play shows who you are. Even when you lose, you smile.'),
    'zc.chen.thanks': T2('[谢谢|xiè xie] [你|nǐ] 。 [你|nǐ] [是|shì] [我们|wǒ men] [牌桌|pái zhuō] [上|shang] [的|de] [好|hǎo] [朋友|péng you] 。', 'Thank you. You’re a true friend of our card table.'),
    'zc.chen.grandson': T2('[我|wǒ] [孙子|sūn zi] [龙龙|Lóng long] [在|zài] [钟楼|zhōng lóu] [那边|nà biān] 。 [他|tā] [天天|tiān tiān] [说|shuō] [龙|lóng] ！', 'My grandson Longlong is over by the bell tower. He talks about dragons all day long!'),
    'zc.chen.idle1': T2('[打牌|dǎ pái] [要|yào] [记|jì] [牌|pái] 。 [谁|shéi] [出|chū] [了|le] [什么|shén me] ， [都|dōu] [要|yào] [记住|jì zhù] 。', 'At cards, remember the cards. Who played what: remember it all.'),
    'zc.chen.idle2': T2('[喝|hē] [杯|bēi] [茶|chá] [吧|ba] 。 [不|bù] [着急|zháo jí] 。', 'Have a cup of tea. No rush.'),
    'zc.hu.idle1': T2('[我|wǒ] [有|yǒu] [两|liǎng] [个|gè] [炸弹|zhà dàn] ！ … [骗|piàn] [你|nǐ] [的|de] 。', 'I’ve got two bombs! …Just kidding.'),
    'zc.hu.idle2': T2('[瓜子|guā zǐ] ？ [来|lái] ， [吃|chī] [一|yī] [把|bǎ] ！', 'Sunflower seeds? Here, have a handful!'),
    'zc.chen.bird': T2('[这|zhè] [是|shì] [我|wǒ] [的|de] [小|xiǎo] [鸟|niǎo] ， [叫|jiào] [小|Xiǎo] [黄|Huáng] 。 [它|tā] [唱歌|chàng gē] [比|bǐ] [老|Lǎo] [胡|Hú] [好听|hǎo tīng] 。', 'That’s my little bird, Xiao Huang. He sings better than Lao Hu.'),
  };
  // the Phrasebook (LEX kind 'phrase'): what the table teaches
  const R_ZC = 'At the 斗地主 table';
  const PH = [
    { id: 'ph.zc.jiao', zh: '[叫地主|jiào dì zhǔ] ！', en: 'I’ll be the landlord! (bidding)', note: 'At the bidding: the landlord takes the three cards under the table and plays alone against the other two.', sit: 'Your cards are great: bid to be the landlord!', icon: 'zcCards' },
    { id: 'ph.zc.bujiao', zh: '[不叫|bù jiào] 。', en: 'No bid.', note: 'Pass at the bidding: you’d rather be a farmer.', sit: 'Your cards are bad: don’t bid.', icon: 'zcCards' },
    { id: 'ph.zc.duiwu', zh: '[对|duì] [五|wǔ] ！', en: 'A pair of fives!', note: 'A pair is 对子. Call it with 对 and the card: 对五, 对K, 对二. A single card is just its name: 五, K, 大王.', sit: 'You play your two fives. Call it!', ex: [['[对|duì] K ！', 'A pair of kings!']], icon: 'zcCards' },
    { id: 'ph.zc.buyao', zh: '[不要|bù yào] 。', en: 'Pass (I don’t want it).', note: 'When you could play but choose not to. 过 (guò) means the same.', sit: 'Your partner played a high card. Let it stand: pass.', ex: [['[过|guò] 。', 'Pass.']], icon: 'zcCards' },
    { id: 'ph.zc.yaobuqi', zh: '[要不起|yào bù qǐ] 。', en: 'Can’t beat that.', note: 'When nothing in your hand beats the cards on the table.', sit: 'They played a pair of twos. You have nothing bigger. Say so!', icon: 'zcCards' },
    { id: 'ph.zc.shengyi', zh: '[我|wǒ] [只|zhǐ] [剩|shèng] [一|yī] [张|zhāng] [了|le] ！', en: 'I’ve only got one card left!', note: 'Down to one card, you must say so (报单). Two left: 我还剩两张！', sit: 'You just played, and you have one card left. Tell everyone!', icon: 'zcCards' },
    { id: 'ph.zc.sandaiyi', zh: '[三带一|sān dài yī]', en: 'three of a kind plus one', note: 'Three of a kind with one extra card: 555 + 7. With a pair: 三带一对 (555 + 77).', sit: 'You play three fives and a seven. Call it!', ex: [['[三带一对|sān dài yī duì]', 'three of a kind plus a pair']], icon: 'zcCards' },
    { id: 'ph.zc.shunzi', zh: '[顺子|shùn zi]', en: 'a straight', note: 'Five or more cards in a row: 3 4 5 6 7. No twos or jokers in it.', sit: 'You play 8 9 10 J Q. Call it!', icon: 'zcCards' },
    { id: 'ph.zc.liandui', zh: '[连对|lián duì]', en: 'pairs in a row', note: 'Three or more pairs in a row: 33 44 55.', sit: 'You play 66 77 88. Call it!', icon: 'zcCards' },
    { id: 'ph.zc.feiji', zh: '[飞机|fēi jī]', en: 'an airplane', note: 'Two or more trios in a row (333 444), alone or with wings: one card or one pair per trio.', sit: 'You play 999 101010 with two singles as wings. Call it!', icon: 'zcCards' },
    { id: 'ph.zc.zhadan', zh: '[炸弹|zhà dàn] ！', en: 'A bomb!', note: 'Four of a kind. It beats anything but a bigger bomb, and it doubles the score.', sit: 'You slam down four nines. Call it!', icon: 'zcCards' },
    { id: 'ph.zc.wangzha', zh: '[王炸|wáng zhà] ！', en: 'The rocket! (both jokers)', note: 'The big and small joker together: nothing beats it. It doubles the score too.', sit: 'You throw down both jokers!', icon: 'zcCards' },
    { id: 'ph.zc.guanqi', zh: '[观棋|guān qí] [不语|bù yǔ] [真|zhēn] [君子|jūn zǐ] 。', en: 'A true gentleman watches the game in silence.', note: 'The sign on Grandpa Chen’s tree. Said to anyone who gives hints while watching a game (chess, cards…).', sit: 'Mimo keeps chirping hints while you play. Remind it of the rule!', register: 'casual', icon: 'zcCards' },
    { id: 'ph.zc.jiang', zh: '[姜|jiāng] [还是|hái shì] [老|lǎo] [的|de] [辣|là] 。', en: 'Old ginger is spicier (experience wins).', note: 'Grandpa Chen says it every time he wins.', sit: 'Grandpa Chen, seventy-two, just beat everyone. What does he say?', icon: 'zcCards' },
    { id: 'ph.zc.yishan', zh: '[一|yī] [山|shān] [还|hái] [比|bǐ] [一|yī] [山|shān] [高|gāo] 。', en: 'There’s always a higher mountain.', note: 'However good you are, someone is better. Said with a smile, after losing.', sit: 'You thought you were the best, and someone beat you. Say it!', icon: 'zcCards' },
    { id: 'ph.zc.hushuo', zh: '[胡说|hú shuō] [八道|bā dào] ！', en: 'Nonsense!', note: 'Literally «talk wildly, say eight ways». It starts with Grandpa Hu’s surname, 胡, which Grandpa Chen finds very funny.', sit: 'Grandpa Hu says he has two bombs. You don’t believe him!', register: 'slang', icon: 'zcCards' },
    { id: 'ph.zc.meiguanxi', zh: '[没|méi] [关系|guān xi] ！ [下次|xià cì] [再|zài] [来|lái] ！', en: 'It’s OK! Next time!', note: 'What you say to someone who just lost.', sit: 'Your friend just lost a game. Cheer them up!', icon: 'zcCards' },
    { id: 'ph.zc.shengbai', zh: '[胜败|shèng bài] [乃|nǎi] [兵家|bīng jiā] [常事|cháng shì] 。', en: 'Winning and losing are all part of the game.', note: 'Literally: victory and defeat are a soldier’s everyday business. An old saying to comfort someone who lost.', sit: 'Grandpa Hu lost and won’t talk. Tell him losing is normal!', icon: 'zcCards' },
    { id: 'ph.zc.paipin', zh: '[牌品|pái pǐn] [看|kàn] [人品|rén pǐn] 。', en: 'How you play cards shows who you are.', note: 'A good loser, a gracious winner: that’s good 牌品.', sit: 'Someone throws the cards when they lose. Remind them!', icon: 'zcCards' },
  ];
  PH.forEach(p => { p.region = p.region || R_ZC; p.register = p.register || 'casual'; });
  const PHI = Object.fromEntries(PH.map(p => [p.id, p]));
  function registerIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const has = k => ICONS.keys.includes(k), H0 = ICONS.H;
    const face = (c, p, h, o) => {
      h.shape(c, p, h.ell(0, 4, 26, 28), o.skin);
      if (o.under) o.under(c, p, h);
      if (!p) return;
      h.dot(c, -9, 3, 3.4, h.INK); h.dot(c, 9, 3, 3.4, h.INK); h.dot(c, -8, 2, 1.2, '#fff'); h.dot(c, 10, 2, 1.2, '#fff');
      h.dot(c, -16, 13, 4.5, 'rgba(255,140,154,0.55)'); h.dot(c, 16, 13, 4.5, 'rgba(255,140,154,0.55)');
      c.beginPath(); c.arc(0, 14, 6, 0.2, Math.PI - 0.2); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke();
      if (o.over) o.over(c, p, h);
    };
    if (!has('zcChen')) ICONS.add('zcChen', (c, p, h) => face(c, p, h, { skin: '#f0c7a0',
      under: (c2, p2, h2) => { h2.shape(c2, p2, cc => { cc.moveTo(-28, -6); cc.bezierCurveTo(-30, -36, 30, -36, 28, -6); cc.closePath(); }, '#6b6f78'); h2.shape(c2, p2, h2.rr(-30, -10, 48, 7, 3), '#5a5e67'); },
      over: (c2, p2, h2) => { [-1, 1].forEach(s => { c2.beginPath(); c2.arc(s * 9, 3, 7, 0, TAU); c2.lineWidth = 1.8; c2.strokeStyle = h2.INK; c2.stroke(); }); c2.fillStyle = '#e8e4dc'; c2.fillRect(-12, -4, 7, 2); c2.fillRect(5, -4, 7, 2); } }));
    if (!has('zcHu')) ICONS.add('zcHu', (c, p, h) => face(c, p, h, { skin: '#e8b48a',
      under: (c2, p2, h2) => { h2.shape(c2, p2, h2.ell(-24, -2, 6, 12), '#e8e4dc'); h2.shape(c2, p2, h2.ell(24, -2, 6, 12), '#e8e4dc'); },
      over: (c2) => { c2.fillStyle = '#e8e4dc'; c2.beginPath(); c2.ellipse(0, 10, 10, 3, 0, 0, TAU); c2.fill(); } }));
    if (!has('zcKid')) ICONS.add('zcKid', (c, p, h) => face(c, p, h, { skin: '#f5cda2',
      under: (c2, p2, h2) => { h2.shape(c2, p2, cc => { cc.moveTo(-30, 2); cc.bezierCurveTo(-32, -42, 32, -42, 30, 2); cc.quadraticCurveTo(0, -18, -30, 2); cc.closePath(); }, '#d6332a'); [-1, 1].forEach(s => h2.shape(c2, p2, cc => { cc.moveTo(s * 12, -28); cc.lineTo(s * 20, -46); cc.lineTo(s * 6, -32); cc.closePath(); }, '#ffcf3f')); } }));
    if (!has('zcYou')) ICONS.add('zcYou', (c, p, h) => face(c, p, h, { skin: '#f5cda2',
      under: (c2, p2, h2) => h2.shape(c2, p2, cc => { cc.moveTo(-28, 0); cc.bezierCurveTo(-30, -40, 30, -40, 28, 0); cc.quadraticCurveTo(10, -20, -28, 0); cc.closePath(); }, '#4a2f27') }));
    if (!has('zcCards')) ICONS.add('zcCards', (c, p, h) => {
      [[-16, 4, -0.3, '#fffdf6'], [0, 0, 0, '#fffdf6'], [16, 4, 0.3, '#fffdf6']].forEach(([x, y, a, col], i) => { c.save(); c.translate(x, y); c.rotate(a); h.shape(c, p, h.rr(-14, -22, 28, 40, 4), col); if (p) { c.font = '900 14px Bahnschrift, sans-serif'; c.fillStyle = i === 1 ? '#c8322a' : h.INK; c.fillText(['3', 'A', '2'][i], -10, -8); } c.restore(); });
    });
    void H0;
  }

  // ================================================================ the place (plain data) and the 3D corner
  // Don Fello's corner in es games (DOMINO is hidden in zh, and world.js keeps its yard bare in every language)
  // (the tree stands behind the table, seen from the street: its shade falls on neither grandpa; the cage hangs toward the table)
  const SITE = { T: { x: -47.6, z: -162.6 }, TREE: { x: -48.3, z: -165.75 }, SIDE: { x: -46.05, z: -164.0 } };
  { const dx = SITE.T.x - SITE.TREE.x, dz = SITE.T.z - SITE.TREE.z, l = Math.hypot(dx, dz); SITE.DIR = { x: dx / l, z: dz / l }; SITE.BOARD = { x: SITE.TREE.x + SITE.DIR.x * 0.27, z: SITE.TREE.z + SITE.DIR.z * 0.27 }; SITE.SY = Math.atan2(dx, dz); }
  const SEAT = { you: { x: SITE.T.x, z: SITE.T.z + 1.02, yaw: Math.PI }, chen: { x: SITE.T.x + 1.02, z: SITE.T.z, yaw: -Math.PI / 2 },
    hu: { x: SITE.T.x - 1.02, z: SITE.T.z, yaw: Math.PI / 2 }, mimo: { x: SITE.T.x, z: SITE.T.z - 1.02, yaw: 0 } };
  const LOOK = {
    chen: { skin: '#f0c7a0', hair: '#e8e4dc', hat: 'flat', hatCol: '#6b6f78', shirt: '#f4efe2', vest: '#5a6b4f', pants: '#3f4a5a', glasses: true, old: true },
    hu: { skin: '#e8b48a', hair: '#e8e4dc', bald: true, shirt: '#fbfbf6', sleeve: '#e8b48a', belly: true, pants: '#4a3f35', old: true, mustache: true, wide: 1.08 },
  };
  const grayOf = h => { const c = new THREE.Color(h), l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; return '#' + new THREE.Color(l * 0.86 + 0.08, l * 0.86 + 0.08, l * 0.9 + 0.1).getHexString(); };
  const grayLook = L => Object.fromEntries(Object.entries(L).map(([k, v]) => [k, typeof v === 'string' && v[0] === '#' ? grayOf(v) : v]));
  let G = null, BUILT = null;
  const S = () => { const s = G.state; if (!s.zc) s.zc = {}; const o = s.zc; o.ch = o.ch || {}; o.rec = o.rec || { played: 0, won: 0, lord: 0, lordWon: 0, best: 0 }; return o; };
  const shown = () => !!(G && G.state && G.state.lang === 'zh' && G.state.flags && G.state.flags.hatched);
  const flags = () => (G && G.state && G.state.flags) || {};
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    const root = new THREE.Group(); root.name = 'cards'; scene.add(root); root.visible = false;
    const colliders = [], solid = c => { c.x0 = c.x; c.z0 = c.z; colliders.push(c); return c; };
    const T = SITE.T, ty = gy(T.x, T.z), k = ZHF.Kit();
    // the table: a square folding table with a green cloth, and four folding stools (马扎)
    const top = ty + 0.56;
    k.box(T.x, top, T.z, 1.12, 0.05, 1.12, '#a8784e').box(T.x, top + 0.035, T.z, 1.02, 0.02, 1.02, '#3f7f5f', { ink: 0.006 });
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => { const x = T.x + a * 0.48, z = T.z + b * 0.48; k.box(x, (gy(x, z) + top) / 2, z, 0.05, top - gy(x, z), 0.05, '#7a5236', { ink: 0.01 }); });
    for (const sp of Object.values(SEAT)) {
      const y0 = gy(sp.x, sp.z); k.frame(sp.x, y0, sp.z, sp.yaw);
      k.box(0, 0.31, 0, 0.36, 0.025, 0.3, '#3f6fb5', { ink: 0.008 });
      for (const s of [-1, 1]) { k.rod([s * 0.15, 0.02, -0.13], [s * 0.15, 0.3, 0.13], 0.012, '#8a8f9e', { ink: 0.004 }); k.rod([s * 0.15, 0.02, 0.13], [s * 0.15, 0.3, -0.13], 0.012, '#8a8f9e', { ink: 0.004 }); }
      k.free();
    }
    // on the table: the deck, a few cards face up, two little tea cups, a paper bag of sunflower seeds, a pile of shells
    k.box(T.x - 0.18, top + 0.075, T.z - 0.15, 0.1, 0.05, 0.14, '#c8322a', { ink: 0.005 });
    [[0.05, 0.08, 0.3], [0.16, 0.02, -0.4], [-0.02, -0.06, 1.2]].forEach(([dx, dz, a]) => k.box(T.x + dx, top + 0.052, T.z + dz, 0.1, 0.006, 0.14, '#fffdf6', { ry: a, ink: 0.004 }));
    [[0.34, -0.36], [-0.36, 0.34]].forEach(([dx, dz]) => k.cyl(T.x + dx, top + 0.085, T.z + dz, 0.045, 0.08, '#f4f1ea', { ink: 0.006 }));
    k.box(T.x + 0.32, top + 0.11, T.z + 0.3, 0.16, 0.15, 0.1, '#d9b27a', { ink: 0.008, ry: 0.4 });
    for (let i = 0; i < 18; i++) { const a = i * 2.4, r = 0.08 + (i % 5) * 0.03; k.ball(T.x - 0.3 + Math.cos(a) * r, top + 0.05, T.z - 0.32 + Math.sin(a) * r, 0.025, 0.008, 0.012, i % 3 ? '#2b2235' : '#e8dcc0', { ink: 0, ay: a }); }
    // the scholar tree (槐树): a leaning trunk, three branches, a round crown with pale flowers; a branch over the table
    const TR = SITE.TREE, tg = gy(TR.x, TR.z), DX = SITE.DIR.x, DZ = SITE.DIR.z, crown = [TR.x - DX * 0.5, tg + 3.7, TR.z - DZ * 0.5];
    k.rod([TR.x, tg - 0.2, TR.z], [TR.x - DX * 0.15, tg + 2.6, TR.z - DZ * 0.15], 0.22, '#7a5a42', { ink: 0.02 });
    const brs = [[-DZ * 1.5 - DX * 0.6, 3.3, DX * 1.5 - DZ * 0.6], [DZ * 1.5 - DX * 0.4, 3.5, -DX * 1.5 - DZ * 0.4], [-DX * 1.3, 3.9, -DZ * 1.3], [DX * 1.95, 2.85, DZ * 1.95]];
    brs.forEach(b => k.rod([TR.x - DX * 0.15, tg + 2.5, TR.z - DZ * 0.15], [TR.x + b[0], tg + b[1], TR.z + b[2]], 0.09, '#7a5a42', { ink: 0.014 }));
    bake(root, k);
    const ck = ZHF.Kit(), R = rng(7171), greens = ['#5f9a45', '#6aa84f', '#4f8a3c', '#78b35a'];
    ck.ball(crown[0], crown[1], crown[2], 2.0, 1.2, 2.0, greens[0], { ink: 0.025 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, r = 1.6 + R() * 0.6; ck.ball(crown[0] + Math.cos(a) * r, crown[1] - 0.2 + R() * 0.5, crown[2] + Math.sin(a) * r, 0.9 + R() * 0.4, 0.6 + R() * 0.3, 0.9 + R() * 0.4, greens[i % 4], { ink: 0.02 }); }
    for (let i = 0; i < 26; i++) { const a = R() * TAU, r = R() * 2.4; ck.ball(crown[0] + Math.cos(a) * r, crown[1] + 0.3 + R() * 0.7 - r * 0.15, crown[2] + Math.sin(a) * r, 0.12, 0.1, 0.12, i % 2 ? '#f4f0d0' : '#e8e2b0', { ink: 0 }); }
    bake(root, ck);
    colliders.push(solid({ x: TR.x, z: TR.z, r: 0.32 }), solid({ x: T.x, z: T.z, r: 0.66 }));
    // the birdcage on the low branch (Chen's bird, 小黄), half covered with a blue cloth
    const cage = new THREE.Group(), cx = TR.x + DX * 1.95, cz = TR.z + DZ * 1.95, cy = tg + 2.0; cage.position.set(cx, cy, cz); root.add(cage);
    const kc = ZHF.Kit();
    kc.cyl(0, 0, 0, 0.2, 0.03, '#8a5f3e').add(ZHF.GEO.half, '#c9a26a', 0, 0.38, 0, 0.2, 0.14, 0.2, 0, 0, 0, { ink: 0.008 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; kc.rod([Math.cos(a) * 0.19, 0, Math.sin(a) * 0.19], [Math.cos(a) * 0.19, 0.4, Math.sin(a) * 0.19], 0.008, '#c9a26a', { ink: 0 }); }
    kc.rod([0, 0.52, 0], [0, 0.85, 0], 0.01, '#5b3a22', { ink: 0 }).rod([-0.16, 0.14, 0], [0.16, 0.14, 0], 0.01, '#8a5f3e', { ink: 0 });
    kc.add(ZHF.GEO.half, '#3f6fb5', -0.04, 0.12, 0, 0.215, 0.32, 0.215, 0, 0, 0.5, { ink: 0.006 });
    bake(cage, kc);
    const bird = new THREE.Group(); bird.position.set(0.04, 0.2, 0); cage.add(bird);
    const kbd = ZHF.Kit(); kbd.ball(0, 0, 0, 0.06, 0.05, 0.08, '#ffd23f', { ink: 0.008 }).cone(0, 0.01, 0.09, 0.015, 0.04, '#e8892e', { rx: Math.PI / 2, ink: 0 }).ball(0.025, 0.03, 0.05, 0.008, 0.008, 0.008, '#2b2235', { ink: 0 }).ball(-0.025, 0.03, 0.05, 0.008, 0.008, 0.008, '#2b2235', { ink: 0 });
    bake(bird, kbd);
    // the side stool: a red thermos, two jars of tea, the transistor radio (the music comes out of it)
    const SD = SITE.SIDE, sy = gy(SD.x, SD.z), ks = ZHF.Kit();
    ks.box(SD.x, sy + 0.2, SD.z, 0.42, 0.4, 0.42, '#a8784e', { ink: 0.012 });
    ks.cyl(SD.x - 0.1, sy + 0.62, SD.z - 0.06, 0.07, 0.42, '#c8322a', { ink: 0.008 }).cyl(SD.x - 0.1, sy + 0.86, SD.z - 0.06, 0.05, 0.06, '#e8c35a', { ink: 0.006 });
    for (let i = 0; i < 3; i++) ks.ball(SD.x - 0.1 + 0.071, sy + 0.5 + i * 0.12, SD.z - 0.06, 0.012, 0.02, 0.02, '#ffd166', { ink: 0 });
    [[0.08, -0.12], [0.1, 0.06]].forEach(([dx, dz]) => ks.cyl(SD.x + dx, sy + 0.5, SD.z + dz, 0.045, 0.18, '#cfe6c4', { ink: 0.005 }).cyl(SD.x + dx, sy + 0.45, SD.z + dz, 0.043, 0.06, '#7f9a4a', { ink: 0 }));
    ks.box(SD.x + 0.02, sy + 0.47, SD.z + 0.14, 0.26, 0.15, 0.08, '#5a3a2a', { ink: 0.008 }).box(SD.x - 0.04, sy + 0.47, SD.z + 0.181, 0.1, 0.1, 0.005, '#d9d2c4', { ink: 0 }).cyl(SD.x + 0.08, sy + 0.47, SD.z + 0.185, 0.025, 0.01, '#e8c35a', { rx: Math.PI / 2, ink: 0 }).rod([SD.x + 0.12, sy + 0.54, SD.z + 0.14], [SD.x + 0.22, sy + 0.9, SD.z + 0.1], 0.006, '#8a8f9e', { ink: 0 });
    bake(root, ks);
    colliders.push(solid({ x: SD.x, z: SD.z, r: 0.3 }));
    // the sign on the trunk: 观棋不语真君子
    const BD = SITE.BOARD, by = gy(BD.x, BD.z);
    const tex = ZHF.canvasTex(96, 384, c => { c.fillStyle = '#e6c890'; c.fillRect(0, 0, 96, 384); c.strokeStyle = '#7a5236'; c.lineWidth = 8; c.strokeRect(4, 4, 88, 376); ZHF.vtext(c, '观棋不语真君子', 48, 22, 362, 60, '#2b2235'); });
    const SY = SITE.SY, sign = ZHF.plane(0.24, 0.96, tex); sign.position.set(BD.x, by + 1.45, BD.z); sign.rotation.set(0, SY, 0); root.add(sign);
    const back = sign.clone(); back.material = sign.material; back.rotation.set(0, SY + Math.PI, 0); back.position.set(BD.x - Math.sin(SY) * 0.02, by + 1.45, BD.z - Math.cos(SY) * 0.02); root.add(back);
    // the two grandpas, seated, a fan of cards in hand; Hu's gray double (the Hush, chapter 5)
    const people = [];
    const seat = (id, look) => {
      const sp = SEAT[id], p = ZHF.person(look, { sit: true, seatY: 0.32 });
      p.id = id; p.nameSrc = NAMES[id]; p.x = sp.x; p.z = sp.z; p.y = gy(sp.x, sp.z); p.yaw = p.baseYaw = sp.yaw; p.pose = 'cards'; p.noTurn = true; p.story = true;
      const fan = new THREE.Group(), kf = ZHF.Kit(); for (let i = 0; i < 5; i++) kf.box(-0.06 + i * 0.03, 0.06, 0, 0.07, 0.1, 0.004, i % 2 ? '#fffdf6' : '#f4efe2', { rz: 0.5 - i * 0.25, ink: 0.003 }); bake(fan, kf);
      fan.position.set(0.05, -0.02, 0.08); p.arms[1].userData.hand.add(fan); p.fan = fan;
      root.add(p.root); return p;
    };
    const chen = seat('chen', LOOK.chen), hu = seat('hu', LOOK.hu), huGray = seat('hu', grayLook(LOOK.hu));
    huGray.root.visible = false; huGray.gray = true;
    people.push(chen, hu);
    BUILT = { root, colliders, people, chen, hu, huGray, cage, bird, top, ty, gy, sign };
    return { colliders, group: root, people, update };
  }
  // Mimo's lucky cap (Grandpa Chen's old flat cap), between its ears like the straw hat
  let CAP = null;
  function cap() {
    if (CAP || !G || !G.cast || !G.cast.mimo || !G.cast.mimo.body) return CAP;
    const g = new THREE.Group(); g.position.set(0, 0.56, -0.02); g.rotation.set(-0.18, 0, 0.1);
    const k = ZHF.Kit(); k.add(ZHF.GEO.half, '#6b6f78', 0, 0, 0, 0.24, 0.13, 0.25, -0.1, 0, 0, { ink: 0.01 }); k.box(0, 0.012, 0.22, 0.24, 0.016, 0.13, '#5a5e67', { rx: 0.12, ink: 0.006 }); k.ball(0, 0.12, 0, 0.02, 0.016, 0.02, '#5a5e67', { ink: 0 });
    ZHF.bake(g, k); g.visible = false; G.cast.mimo.body.add(g); CAP = g; return g;
  }
  const capOn = () => !!(G && G.state && G.state.lang === 'zh' && G.state.zc && G.state.zc.cap && !G.state.zc.capOff);
  function bake(group, k) { return ZHF.bake(group, k); }

  // ---------------- the music: «茶馆摇摆» (Teahouse Swing), a slow swung jazz-hop out of Grandpa Chen's radio:
  // brushes and a ride, a walking upright, Rhodes comping on the 7th chords, a muted trumpet answered by an erhu, radio crackle
  (function addSong() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const K = Sound.kit;
    const CHO = K.CH('G2: F3 A3 Bb3 D4, C3: E3 Bb3 D4 G4, F2: E3 A3 C4 G4, D3: F#3 C4 Eb4 A4, G2: F3 Bb3 D4 F4, C3: Bb3 E4 G4 A4, A2: G3 C4 E4 G4, D3: F#3 C4 E4 A4');
    // a walking line, four notes a bar (chord tones and approach notes)
    const WALK = [[43, 46, 50, 47], [48, 52, 55, 53], [41, 45, 48, 51], [50, 54, 57, 55], [43, 50, 46, 47], [48, 46, 45, 44], [45, 52, 50, 49], [50, 48, 47, 42]];
    const TUNE = K.mel('r/4 D5/2 F5/2 G5/3 F5/1 D5/4 | r/2 C5/2 D5/2 F5/2 E5/4 C5/4 | r/4 A4/2 C5/2 D5/4 C5/2 A4/2 | F4/6 r/2 r/8 | r/4 Bb4/2 D5/2 F5/3 G5/1 F5/4 | E5/4 D5/2 C5/2 Bb4/8 | r/2 A4/2 C5/2 E5/2 G5/4 E5/4 | D5/8 r/8', 0);
    const ERHU = K.mel('r/16 | r/16 | r/16 | r/8 A5/2 G5/2 F5/2 D5/2 | r/16 | r/8 C6/4 A5/4 | r/16 | r/4 G5/2 F5/2 D5/8', 0);
    Sound.addSong('zh_cards', { bpm: 88, len: 128, swing: 0.3, vol: 0.32, verb: 0.16, echo: 0.1, echoSteps: 3, tone: 6200,
      play(i, t, s16) {
        const bar = (i >> 4) & 7, st = i & 15, c = CHO[bar];
        if (st === 0 || st === 10) K.kick(t, st ? 0.32 : 0.45);
        if (st % 4 === 0) K.ride(t, st % 8 === 0 ? 0.55 : 0.4); if (st % 4 === 3) K.ride(t, 0.3);
        if (st === 4 || st === 12) K.brush(t, 1, 0.22); if (st === 14 && bar % 2) K.rim(t, 0.5);
        if (st % 4 === 0) K.upright(WALK[bar][st >> 2], t, 0.9, s16 * 3.5);
        if (st === 3 || st === 10) c.slice(1).forEach((m, k) => K.epiano(m, t + k * 0.008, s16 * (st === 3 ? 2.5 : 4), 0.55, 0.7));
        const n = TUNE[i % 128]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'mute', 0.8);
        const e = ERHU[i % 128]; if (e) K.lead(e[0], t, e[1] * s16, 'erhu', 0.55);
        K.crackle(t, s16, 0.5);
        if (i % 128 === 126) { K.clap(t, 0.5); K.woodblock(t + s16, true, 0.6); }      // (a card slapped on the table)
      } });
  })();

  // ================================================================ every frame
  let slamT = 4, birdT = 0;
  function update(dt, t, you) {
    if (!BUILT) return;
    const on = shown() && !(G.indoors && G.indoors()), Y = G.sim.you, near = on && Math.hypot(Y.x - SITE.T.x, Y.z - SITE.T.z) < 150;
    BUILT.root.visible = near;
    for (const c of BUILT.colliders) { c.x = c.x0 + (on ? 0 : 1e5); c.z = c.z0; }
    for (const p of [BUILT.chen, BUILT.hu, BUILT.huGray]) p.hidden = !on || !p.root.visible;
    BUILT.huGray.hidden = true;
    if (CAP || (G && G.cast)) { const c = cap(); if (c) c.visible = capOn(); }
    if (on) {
      ZHF.music.want('cards', TB.open ? 'zh_cards' : 'zh_cards', TB.open ? 0.3 : 0.26 * (1 - smoothstep(4, 15, Math.hypot(Y.x - SITE.SIDE.x, Y.z - SITE.SIDE.z))), { cut: TB.open ? 15000 : 2600, duck: TB.open ? 0.15 : undefined });
    } else ZHF.music.want('cards', null, 0);
    ZHF.music.frame(t);
    if (!near) return;
    const scene = typeof STORY !== 'undefined' && STORY.busy;
    // a card slapped down now and then; the other one nods; the bird hops
    if (!scene && (slamT -= dt) <= 0) {
      slamT = 4 + Math.random() * 5;
      const p = Math.random() < 0.55 ? BUILT.hu : BUILT.chen, o = p === BUILT.hu ? BUILT.chen : BUILT.hu;
      if (p.root.visible) { p.pose = 'slam'; p.slamT = 0.45; o.nod = 0.4; if (Math.hypot(Y.x - SITE.T.x, Y.z - SITE.T.z) < 12) try { Sound.play('wood'); } catch (e) { /* */ } }
    }
    for (const p of [BUILT.chen, BUILT.hu, BUILT.huGray]) { if (p.pose === 'slam' && !(p.slamT > 0)) p.pose = 'cards'; ZHF.animate(p, dt, t, you); }
    if ((birdT -= dt) <= 0) { birdT = 0.6 + Math.random() * 2.4; BUILT.bird.rotation.y = (Math.random() - 0.5) * 2; BUILT.bird.position.y = 0.2 + (Math.random() < 0.3 ? 0.04 : 0); }
    BUILT.cage.rotation.z = Math.sin(t * 0.8) * 0.03;
  }

  // ================================================================ the scenes
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const say = (who, key, vars) => ZHF.say(BUILT[who], ZHF.lineOf(LT, key, vars));
  const you = text => STORY.you(text), think = (text, s) => STORY.think(text, s);
  const lock = on => { if (G) G.sim.lock = on ? 1 : 0; };
  function shot(k = 0) {
    const T = SITE.T, y = BUILT.ty;
    const P = [[T.x + 2.6, y + 2.3, T.z + 3.6, T.x - 0.4, y + 0.7, T.z - 0.4], [T.x + 2.4, y + 1.6, T.z - 1.4, T.x - 1.0, y + 0.9, T.z + 0.1], [T.x - 2.6, y + 1.7, T.z + 1.2, T.x + 0.9, y + 0.9, T.z - 0.1]][k];
    G.cam.override = { pos: V3(P[0], P[1], P[2]), look: V3(P[3], P[4], P[5]) };
  }
  function standBy() {      // you and Mimo by the table (your stool's side), facing it
    const Y = G.sim.you, M = G.sim.mimo, sp = SEAT.you;
    if (Math.hypot(Y.x - sp.x, Y.z - sp.z) > 3) { Y.x = sp.x + 0.4; Y.z = sp.z + 0.9; }
    Y.yaw = Math.atan2(SITE.T.x - Y.x, SITE.T.z - Y.z);
    M.x = SEAT.mimo.x + 0.1; M.z = SEAT.mimo.z - 0.7; M.station = null; M.wander = null; M.look = { x: SITE.T.x, z: SITE.T.z };
    G.sim.snap();
  }
  async function scene(fn) {
    lock(true);
    try { await fn(); } catch (e) { console.error('[cards] scene', e); }
    finally { G.cam.override = null; lock(false); if (G.sim.mimo) G.sim.mimo.look = null; G.fx.hush = 0; if (BUILT) { BUILT.hu.root.visible = true; BUILT.huGray.root.visible = false; } if (G.save) G.save(); }
  }
  const coins = n => { G.state.coins = (G.state.coins || 0) + n; try { Sound.play('chest'); } catch (e) { /* */ } UI.toast(`Grandpa Chen slips you ${n} coins: «${Pl('[买|mǎi] [冰淇淋|bīng qí lín] [吃|chī] ！')}» (buy yourself an ice cream!)`); };
  function teachAll(ids) { for (const id of ids) ZHF.teach(id); }

  // ---------------- chapter 1: meeting them; the card school; War with Grandpa Hu
  async function meet() {
    const st = S();
    await scene(async () => {
      standBy(); shot(0);
      BUILT.hu.pose = 'slam'; BUILT.hu.slamT = 0.5; try { Sound.play('hit'); } catch (e) { /* */ }
      await say('hu', 'zc.hu.slam');
      await say('chen', 'zc.chen.calm');
      await say('hu', 'zc.hu.oops');
      shot(1); BUILT.chen.headTurn = -0.6;
      await say('chen', 'zc.chen.hi');
      shot(2); await say('hu', 'zc.hu.hi');
      await say('chen', 'zc.chen.nonsense');
      UI.toast(`«${Pl('[胡说|hú shuō] [八道|bā dào]')}»: “nonsense”. It starts with 胡, Grandpa Hu’s surname!`);
      shot(0); await say('chen', 'zc.chen.game');
      G.sim.mimo.happy = 1.2; G.sim.mimoSay('!', 1.2); try { Sound.play('chirp'); } catch (e) { /* */ }
      await say('chen', 'zc.chen.mimo');
      ZHF.teach('ph.zc.guanqi');
      await say('chen', 'zc.chen.seat');
      BUILT.chen.headTurn = 0;
      st.met = true;
    });
    const go = await UI.choose(`${Pl(NAMES.chen)}: «${Pl('[开始|kāi shǐ] [吗|ma] ？')}» (Shall we start?)`, [{ label: 'Card school now', sub: 'the cards’ names in Chinese, which beats which, and War with Grandpa Hu', value: 1 }, { label: 'Later', sub: 'talk to Grandpa Chen when you’re ready', value: 0 }]);
    if (go) await chapter1();
  }
  const SCH = { cur: null };
  // A small panel of its own: Grandpa Chen, a row of cards, a box. o.steps: [{ kind, cards (ranks), say: [zh, en], answer: ranks
  // or a phrase }] → { done, clean } or { quit }
  async function cardSchool(steps, title, whoKey) {
    const html = `<div class="zf-head"><b>${esc(title)}</b><span class="t"></span><span class="dots"></span><button type="button" class="stop">Stop <kbd>Esc</kbd></button></div>
<div class="zf-lbody"><div class="zf-who"><canvas width="116" height="116"></canvas><div class="nm">${H(NAMES[whoKey])}</div><div class="zf-bub"></div></div>
<div class="zf-card"><div class="kind"></div><div class="zc-row" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;padding:8px 0 4px"></div><div class="gl"></div>
<form autocomplete="off"><input spellcheck="false"><button type="submit" class="go">Say it</button></form><div class="hint"></div>
<div class="row"><button type="button" class="idk">I don’t know (?)</button><span>Tab: a hint · Esc: stop</span></div></div></div>`;
    let quit = false, cur = null;
    const panel = ZHF.open(html, e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); quit = true; cur && cur('quit'); } else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); SCH.cur && SCH.cur.hint(); } });
    ZHF.css('zc-css', CSS);
    const q = s => panel.querySelector(s), E = { dots: q('.dots'), bub: q('.zf-bub'), card: q('.zf-card'), kind: q('.kind'), row: q('.zc-row'), gl: q('.gl'), form: q('form'), input: q('input'), hint: q('.hint'), idk: q('.idk') };
    ZHF.face(q('.zf-who canvas'), ICON[whoKey]); ZHF.ime(E.input);
    q('.stop').onclick = () => { quit = true; cur && cur('quit'); };
    const big = (r, name, id) => `<div style="display:flex;flex-direction:column;align-items:center;gap:6px"><div style="transform:scale(1.35);transform-origin:bottom;margin:14px 6px 0">${cardHTML(id !== undefined ? id : r >= 16 ? (r === 16 ? 52 : 53) : (r - 3) * 4 + (r % 2 ? 1 : 0))}</div>${name ? `<b style="font:800 22px ${ZHF.SANS};color:#c8322a">${H(RNAME[r], { ruby: 'always' })}</b>` : ''}</div>`;
    const clean = [];
    try {
      for (let i = 0; i < steps.length && !quit; i++) {
        const s = steps[i];
        E.dots.innerHTML = steps.map((_, k) => `<i class="${k < i ? 'f' : ''} ${k === i ? 'now' : ''}"></i>`).join('');
        if (s.say) { if (ZHF.sayBub) ZHF.sayBub(E.bub, s.say[0], s.say[1], E.input); else E.bub.innerHTML = H(s.say[0]); }     // (by the weave; its English on request: EN)
        E.kind.textContent = s.kindText || ''; E.card.classList.remove('ok');
        E.row.innerHTML = (s.cards || []).map((r, k) => big(r, s.show, s.ids ? s.ids[k] : undefined)).join('');
        E.gl.innerHTML = s.gl || ''; E.input.value = ''; E.input.placeholder = s.placeholder || 'type it…';
        E.hint.className = 'hint plain'; E.hint.innerHTML = s.help || '';
        if (s.voice) setTimeout(() => ZHF.sayVoice(s.voice), 200);
        setTimeout(() => E.input.focus(), 40);
        let tries = 0, shownAns = false;
        const ansText = s.answerSrc ? s.answerSrc : s.answer.map(r => RNAME[r]).join(' ');
        const r = await new Promise(res => {
          cur = v => { cur = null; SCH.cur = null; res(v); };
          const check = text => {
            const t = String(text || '').trim(); if (!t) return;
            if (!shownAns && ZHF.idk(t)) { SCH.cur.idk(); return; }
            let ok, tone = false;
            if (s.answerSrc) { const m = ZHF.saysAny(t, [s.answerSrc].concat(s.alts || [])); ok = m >= 0; if (ok) tone = ZHF.says(t, [s.answerSrc].concat(s.alts || [])[m]).toneBad; }
            else { const T0 = tokens(t), rs = T0.toks.filter(x => x.kind === 'rank').map(x => x.val); ok = rs.length === s.answer.length && rs.every((v, k) => v === s.answer[k]); tone = T0.tone; }
            if (ok) {
              E.card.classList.add('ok'); try { Sound.play('review'); CJK.used(t, ansText, { lang: 'zh' }); } catch (e) { /* */ }
              E.hint.className = 'hint plain'; E.hint.innerHTML = '✓ ' + H(ansText) + (tone ? ' · tones: ' + esc(ZHF.R(ansText)) : '') + (s.after ? ' · ' + s.after : '');
              const fin = () => cur && cur({ ok: true, clean: !tries && !shownAns }); if (TB.fast) fin(); else setTimeout(fin, 1000); return;
            }
            tries++; try { Sound.play('wrong'); } catch (e) { /* */ }
            E.card.classList.remove('shake'); void E.card.offsetWidth; E.card.classList.add('shake');
            E.hint.className = 'hint'; E.hint.innerHTML = tries >= 2 || shownAns ? 'It’s ' + H(ansText, { ruby: 'always' }) + ' (' + esc(ZHF.R(ansText)) + ')' : (s.miss || 'Not quite. Try again! (Tab: a hint)');
            E.input.select();
          };
          SCH.cur = { answer: ZHF.P(ansText, { mode: 'chars' }), roman: ZHF.R(ansText), submit: check,
            idk() { shownAns = true; E.hint.className = 'hint'; E.hint.innerHTML = 'Here: ' + H(ansText, { ruby: 'always' }) + '. Type it!'; ZHF.sayVoice(ansText); E.input.focus(); },
            hint() { E.hint.className = 'hint'; E.hint.innerHTML = esc(ZHF.hintOf(ansText, 2)); } };
          E.form.onsubmit = e => { e.preventDefault(); check(E.input.value); };
          E.idk.onclick = () => SCH.cur && SCH.cur.idk();
        });
        if (r === 'quit' || quit) return { quit: true };
        clean.push(r.clean);
        if (s.then) s.then();
      }
      return { done: true, clean };
    } finally { SCH.cur = null; ZHF.close(); }
  }
  async function chapter1() {
    const groups = [[3, 4, 5], [6, 7, 8], [9, 10], [11, 12, 13, 14], [15], [16, 17]];
    const steps = groups.map((g, i) => ({ kindText: 'New · say their names', cards: g, show: true, answer: g, voice: g.map(r => RNAME[r]).join(' '),
      say: [['[三|sān] [四|sì] [五|wǔ] … [跟|gēn] [我|wǒ] [说|shuō] 。', 'Three, four, five… say them after me.'], ['[六|liù] [七|qī] [八|bā] 。', 'Six, seven, eight.'], ['[九|jiǔ] ， [十|shí] 。', 'Nine, ten.'],
        ['J ， Q ， K ， A 。 [有人|yǒu rén] [说|shuō] [勾|gōu] ， [圈|quān] ， [凯|kǎi] ， [尖|jiān] 。', 'J, Q, K, A. Some people say gōu, quān, kǎi, jiān.'], ['[二|èr] ！ [二|èr] [比|bǐ] A [大|dà] 。', 'Two! The two beats the ace.'], ['[小王|xiǎo wáng] ， [大王|dà wáng] ： [最|zuì] [大|dà] [的|de] [牌|pái] ！', 'The small joker, the big joker: the biggest cards!']][i],
      gl: i === 3 ? 'Type the letters (J Q K A), or the old names: 勾 gōu · 圈 quān · 凯 kǎi · 尖 jiān' : i === 0 ? 'Type them in order: in pinyin («san si wu») or in characters. Tones are optional.' : '',
      placeholder: g.map(r => ZHF.P(RNAME[r])).join(' ') }));
    const pool = ZHF.shuffle([3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 12]).slice(0, 6);
    pool.forEach((r, i) => steps.push({ kindText: 'From memory · what’s this card?', cards: [r], show: false, answer: [r], say: i === 0 ? ['[现在|xiàn zài] ， [不|bù] [看|kàn] 。 [这|zhè] [是|shì] [什么|shén me] ？', 'Now, without looking. What’s this one?'] : null, placeholder: 'its name…' }));
    const cmp = [[14, 15], [13, 16], [10, 11]];
    cmp.forEach(([a, b], i) => steps.push({ kindText: 'Which is bigger?', cards: Math.random() < 0.5 ? [a, b] : [b, a], show: false, answer: [Math.max(a, b)], miss: 'That’s the smaller one!',
      say: i === 0 ? ['[哪|nǎ] [个|gè] [大|dà] ？ [说|shuō] [大|dà] [的|de] [那|nà] [张|zhāng] 。', 'Which one is bigger? Say the bigger card.'] : null, placeholder: 'the bigger card…', after: ['The two beats the ace!', 'Jokers beat everything.', 'J comes right after 10.'][i] }));
    let r;
    await scene(async () => { standBy(); shot(1); await say('chen', 'zc.chen.l1'); });
    r = await cardSchool(steps, 'Know your cards · 认牌', 'chen');
    if (r.quit) { think(`Grandpa Chen shrugs: «${Pl('[慢慢|màn màn] [来|lái] 。')}» (take your time).`, 3.5); return; }
    // War (比大小) with Grandpa Hu: three rounds, you call your card, then who wins
    await scene(async () => { standBy(); shot(2); await say('hu', 'zc.hu.war'); });
    const d = ZHF.shuffle(Array.from({ length: 54 }, (_, i) => i)), war = [];
    for (let k = 0; war.length < 3 && k < 50; k += 2) if (rk(d[k]) !== rk(d[k + 1])) war.push([d[k], d[k + 1]]);
    const wsteps = [];
    let score = 0;
    war.forEach(([a, b], i) => {
      wsteps.push({ kindText: `War · round ${i + 1}: your card. Call it!`, cards: [rk(a)], ids: [a], show: false, answer: [rk(a)], say: i === 0 ? ['[翻|fān] [牌|pái] ！ [你|nǐ] [的|de] [是|shì] [什么|shén me] ？', 'Flip! What’s yours?'] : ['[再|zài] [来|lái] ！', 'Again!'], placeholder: 'your card’s name…' });
      const mine = rk(a) > rk(b);
      wsteps.push({ kindText: `War · round ${i + 1}: Grandpa Hu’s card. Whose is bigger?`, cards: [rk(a), rk(b)], ids: [a, b], show: false, answerSrc: mine ? '[我|wǒ] [的|de] [大|dà] ！' : '[你|nǐ] [的|de] [大|dà] 。',
        alts: mine ? ['[我|wǒ] [赢|yíng] [了|le]'] : ['[你|nǐ] [赢|yíng] [了|le]'], say: ['[我|wǒ] [的|de] [是|shì] … ！', 'Mine is…!'],
        gl: `Yours (left) and Grandpa Hu’s (right). Say ${H('[我|wǒ] [的|de] [大|dà] ！', { ruby: 'always' })} (mine’s bigger) or ${H('[你|nǐ] [的|de] [大|dà] 。', { ruby: 'always' })} (yours is).`,
        placeholder: 'mine or yours?', then: () => { if (mine) score++; } });
    });
    r = await cardSchool(wsteps, 'War with Grandpa Hu · 比大小', 'hu');
    if (r.quit) return;
    const st = S(); st.ch[1] = true; st.war = score;
    await scene(async () => {
      standBy(); shot(0);
      await say('hu', score >= 2 ? 'zc.hu.warLost' : 'zc.hu.warWon');
      await say('chen', 'zc.chen.l1done');
    });
    coins(3);
    if (!CH[1].gate(flags())) think('Grandpa Chen will teach the real game after you’ve dealt with the big Hushling on the hill.', 5);
  }

  // ---------------- chapter 2: the first games (a short game: 8 cards each)
  async function chapter2() {
    const st = S();
    if (!st.l2) {
      await scene(async () => { standBy(); shot(0); await say('chen', 'zc.chen.rules2'); await say('chen', 'zc.chen.rules2b'); });
      const r = await ZHF.lesson({ title: 'At the table · 叫地主', sub: 'Grandpa Chen’s card school', who: { nameSrc: NAMES.chen, icon: 'zcChen' },
        intro: { zh: '[打牌|dǎ pái] [的|de] [时候|shí hou] [要|yào] [说话|shuō huà] ！', en: 'When you play cards, you have to talk!' },
        items: ['ph.zc.jiao', 'ph.zc.bujiao', 'ph.zc.duiwu', 'ph.zc.buyao', 'ph.zc.yaobuqi', 'ph.zc.shengyi'].map(id => PHI[id]),
        outro: { zh: '[好|hǎo] ！ [我们|wǒ men] [玩|wán] [吧|ba] ！', en: 'Good! Let’s play!' } });
      if (r.quit) return;
      st.l2 = true; if (G.save) G.save();
    }
    await scene(async () => { standBy(); shot(2); await say('hu', 'zc.hu.short'); });
    const res = await runTable({ short: true, hints: true, sub: 'A short game: 8 cards each · singles, pairs, threes, bombs' });
    record(res);
    await scene(async () => {
      standBy(); shot(0);
      if (res.outcome === 'win') { st.ch[2] = true; await say('chen', 'zc.chen.win2'); }
      else if (res.outcome === 'lose') { await say('hu', 'zc.hu.again'); think('Win one short game to finish the chapter. Talk to Grandpa Chen to play again.', 5); }
    });
    if (st.ch[2] && !st.paid2) { st.paid2 = true; coins(4); }
  }
  // ---------------- chapter 3: bombs, the full game; win as the landlord → the lucky cap
  async function chapter3() {
    const st = S();
    if (!st.l3) {
      await scene(async () => { standBy(); shot(0); await say('chen', 'zc.chen.l3'); await say('chen', 'zc.chen.bombking'); });
      const r = await ZHF.lesson({ title: 'The big plays · 炸弹', sub: 'Grandpa Chen’s card school', who: { nameSrc: NAMES.chen, icon: 'zcChen' },
        intro: { zh: '[看|kàn] [好|hǎo] [了|le] 。', en: 'Watch closely.' }, items: ['ph.zc.sandaiyi', 'ph.zc.shunzi', 'ph.zc.liandui', 'ph.zc.feiji', 'ph.zc.zhadan', 'ph.zc.wangzha'].map(id => PHI[id]),
        outro: { zh: '[记住|jì zhù] ： [炸弹|zhà dàn] [要|yào] [留|liú] [到|dào] [最后|zuì hòu] 。', en: 'Remember: save your bombs for the end.' } });
      if (r.quit) return;
      st.l3 = true; if (G.save) G.save();
      await scene(async () => { standBy(); shot(0); await say('chen', 'zc.chen.full'); });
    } else await scene(async () => { standBy(); shot(0); await say('chen', 'zc.chen.lordAgain'); });
    const res = await runTable({ sub: 'The real game: 17 cards each · win as the landlord (or win twice)', hints: true, easy: true });
    record(res);
    if (res.outcome === 'win') st.fw = (st.fw || 0) + 1;
    const won = res.outcome === 'win' && ((res.results[0] && res.results[0].asLord) || st.fw >= 2);
    if (won) await capScene();
    else if (res.outcome !== 'quit') await scene(async () => { standBy(); shot(0); await say(res.outcome === 'win' ? 'chen' : 'hu', res.outcome === 'win' ? 'zc.chen.lordAgain' : 'zc.hu.again'); think(res.outcome === 'win' ? 'A win! But Grandpa Chen wants to see you win as the landlord: bid with 叫地主.' : 'Next time: bid with 叫地主 when you have twos, jokers or a bomb.', 5); });
  }
  async function capScene() {
    const st = S(), M = G.sim.mimo;
    await scene(async () => {
      standBy(); shot(1);
      await say('chen', 'zc.chen.win2');
      await say('chen', 'zc.chen.cap');
      st.cap = true; st.capOff = false; st.ch[3] = true; const c = cap(); if (c) c.visible = true;
      if (G.state.ny && G.state.ny.band) G.state.ny.bandOff = true;        // (one gift on Mimo's head at a time)
      M.happy = 2; M.glow = 1; G.sim.emit('learned', {}); try { G.w3d.fx.sparkle(M.x, M.ry + 0.9, M.z, 16); } catch (e) { /* */ }
      UI.toast(`${G.state.mimoName} wears Grandpa Chen’s lucky cap now!`);
      shot(2); await say('hu', 'zc.hu.cap');
      await say('chen', 'zc.chen.nonsense');
    });
    coins(6);
  }
  // ---------------- chapter 4: the old rivals, the score book, the grudge match (3 games)
  async function chapter4() {
    const st = S();
    if (!st.l4) {
      await scene(async () => { standBy(); shot(2); await say('hu', 'zc.hu.book'); shot(1); await say('chen', 'zc.chen.tie'); shot(2); await say('hu', 'zc.hu.decide'); shot(0); await say('chen', 'zc.chen.match'); });
      const r = await ZHF.lesson({ title: 'Table talk · 说话', sub: 'what the old men say', who: { nameSrc: NAMES.chen, icon: 'zcChen' },
        intro: { zh: '[打牌|dǎ pái] [也|yě] [要|yào] [会|huì] [说|shuō] [话|huà] 。', en: 'Playing cards also means knowing what to say.' },
        items: ['ph.zc.jiang', 'ph.zc.yishan', 'ph.zc.hushuo'].map(id => PHI[id]), outro: { zh: '[来|lái] ！ [比|bǐ] [一|yī] [比|bǐ] ！', en: 'Come on! Let’s settle it!' } });
      if (r.quit) return;
      st.l4 = true; if (G.save) G.save();
    }
    const res = await runTable({ games: 3, sub: 'The grudge match: three games, the most seeds wins' });
    record(res);
    if (res.outcome === 'quit') return;
    st.ch[4] = true; st.match = res.seeds;
    await scene(async () => {
      standBy(); shot(0);
      if (res.best === 0) { await say('chen', 'zc.chen.mountain'); ZHF.teach('ph.zc.yishan'); }
      else if (res.best === 1) { await say('chen', 'zc.chen.ginger'); shot(2); await say('hu', 'zc.hu.hmph'); }
      else { shot(2); await say('hu', 'zc.hu.won'); shot(1); await say('chen', 'zc.chen.sigh'); }
    });
    coins(8);
  }
  // ---------------- chapter 5: a good loser (Hu goes quiet and gray; your words bring him back), why Chen plays
  async function chapter5() {
    const st = S(), M = G.sim.mimo, hu = BUILT.hu, gray = BUILT.huGray;
    const BEATS = [
      { src: '[没|méi] [关系|guān xi] ！ [下次|xià cì] [再|zài] [来|lái] ！', alts: ['[没|méi] [关系|guān xi]', '[下次|xià cì] [再|zài] [来|lái]'], en: 'It’s OK! Next time!', title: 'Grandpa Hu stares at his cards, gray. Cheer him up: it’s OK, next time!', hush: 0.42 },
      { src: '[胜败|shèng bài] [乃|nǎi] [兵家|bīng jiā] [常事|cháng shì] 。', alts: [], en: 'Winning and losing are all part of the game.', title: 'Grandpa Chen whispers the old saying to you. Say it to Grandpa Hu!', hush: 0.25, pre: true },
      { src: '[再|zài] [来|lái] [一|yī] [局|jú] ！', alts: [], en: 'One more game!', title: 'His eyes flicker. Ask him for one more game!', hush: 0 },
    ];
    let ok = true;
    await scene(async () => {
      standBy(); shot(0);
      BUILT.chen.pose = 'slam'; BUILT.chen.slamT = 0.5; try { Sound.play('hit'); } catch (e) { /* */ }
      await ZHF.say(BUILT.chen, { zh: '[王炸|wáng zhà] ！ [我|wǒ] [赢|yíng] [了|le] 。', en: 'Rocket! I win.' });
      // Hu loses again, and goes quiet; the gray comes in
      hu.root.visible = false; gray.root.visible = true; gray.pose = 'sulk'; G.fx.hush = 0.6; M.scared = 3;
      try { Sound.play('poof'); } catch (e) { /* */ }
      await ZHF.say(gray, ZHF.lineOf(LT, 'zc.hu.gray'));
      shot(1); await say('chen', 'zc.chen.worried'); await say('chen', 'zc.chen.helpHu');
      shot(2);
      for (const b of BEATS) {
        if (b.pre) { ZHF.teach('ph.zc.shengbai'); await ZHF.say(BUILT.chen, { zh: '[说|shuō] ： ' + b.src, en: 'Say: “' + b.en + '”' }); }
        let said = false;
        for (let tries = 0; !said; tries++) {
          const r = await ZHF.ask({ title: b.title, model: b.src, modelEn: b.en, icon: 'zcHu', hint: tries ? `(Try «${Pl(b.src)}»)` : '' });
          if (!r) { ok = false; return; }
          if (ZHF.saysAny(r.text, [b.src].concat(b.alts)) >= 0) said = true; else { try { Sound.play('wrong'); } catch (e) { /* */ } M.tiltT = 1.2; }
        }
        try { Sound.play('review'); G.w3d.fx.sparkle(gray.x, gray.y + 1.2, gray.z, 10); } catch (e) { /* */ }
        G.fx.hush = b.hush;
      }
      hu.root.visible = true; gray.root.visible = false; hu.pose = 'cards'; G.fx.hush = 0; M.scared = 0; M.happy = 2;
      try { Sound.play('learned'); G.w3d.fx.sparkle(hu.x, hu.y + 1.2, hu.z, 24); } catch (e) { /* */ }
      await say('hu', 'zc.hu.back');
      shot(1);
      await say('chen', 'zc.chen.why'); await say('chen', 'zc.chen.why2'); await say('chen', 'zc.chen.lesson5');
      await you('At cards you have to talk… so the Hush can’t get in. Win or lose, keep talking.');
      await say('chen', 'zc.chen.thanks'); await say('chen', 'zc.chen.grandson');
      teachAll(['ph.zc.meiguanxi', 'ph.zc.shengbai', 'ph.zc.paipin']);
      st.ch[5] = true;
    });
    if (ok && st.ch[5]) coins(10);
  }
  // ---------------- the menu at the table
  const CH = [
    { n: 1, title: 'Know your cards', sub: 'the cards’ names, which beats which, War', gate: f => !!f.rosa, wait: 'after Rosa’s welcome', run: chapter1 },
    { n: 2, title: 'First games', sub: 'bidding, pairs, passing: a short game', gate: f => !!f.boss, wait: 'after the big Hushling on the hill', key: 'zc.chen.waitBoss', run: chapter2 },
    { n: 3, title: 'Bombs!', sub: 'straights, airplanes, bombs: the real game', gate: f => (f.bells || 0) >= 1, wait: 'after the first bell', key: 'zc.chen.waitBell', run: chapter3 },
    { n: 4, title: 'Old rivals', sub: 'the score book and the grudge match', gate: f => (f.bells || 0) >= 2, wait: 'after the second bell', key: 'zc.chen.waitBell', run: chapter4 },
    { n: 5, title: 'A good loser', sub: 'why Grandpa Chen plays', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell', key: 'zc.chen.waitBell', run: chapter5 },
  ];
  function record(res) {
    const R = S().rec;
    for (const g of (res && res.results) || []) { R.played++; if (g.youWon) R.won++; if (g.asLord) { R.lord++; if (g.youWon) R.lordWon++; } }
    if (res && res.seeds) R.best = Math.max(R.best || 0, res.seeds[0]);
  }
  let talking = false;
  async function chenTalk() {
    if (talking) return; talking = true;
    try { await chenTalk0(); } finally { talking = false; }
  }
  async function chenTalk0() {
    const st = S(), f = flags();
    if (!st.met) return meet();
    const next = CH.find(c => !st.ch[c.n]), opts = [], mimo = G.state.mimoName;
    if (next) opts.push(next.gate(f) ? { label: `Chapter ${next.n}: ${next.title}`, sub: next.sub, value: 'next' } : { label: `Chapter ${next.n}: ${next.title}`, sub: `later: ${next.wait}`, value: 'wait' });
    if (st.ch[2]) opts.push({ label: 'Play a game', sub: st.ch[3] ? 'the real game: 17 cards each' : 'a short game: 8 cards each', value: 'play' });
    if (st.ch[3]) opts.push({ label: 'Play a short game', sub: '8 cards each', value: 'short' });
    if (st.ch[1]) opts.push({ label: 'Card school again', sub: 'names, which beats which', value: 'school' });
    opts.push({ label: 'The rules of 斗地主', value: 'rules' });
    if (st.rec.played) opts.push({ label: 'Your record at the table', sub: `${st.rec.won} won of ${st.rec.played} · ${st.rec.lordWon} as the landlord`, value: 'rec' });
    if (st.cap) opts.push({ label: st.capOff ? `Put the lucky cap back on ${mimo}` : `Take ${mimo}’s lucky cap off`, value: 'cap' });
    const v = await UI.choose(`${Pl(NAMES.chen)}: «${Pl('[来|lái] [玩|wán] [吗|ma] ？')}» (Want to play?)`, opts);
    if (v === 'next') return next.run();
    if (v === 'wait') { await scene(async () => { standBy(); shot(0); await say('chen', next.key || 'zc.chen.waitBell'); }); return; }
    if (v === 'play' || v === 'short') { const res = await runTable(v === 'short' || !st.ch[3] ? { short: true, sub: 'A short game: 8 cards each' } : { sub: 'The real game: 17 cards each' }); record(res); if (res.outcome === 'win') coins(res.results[0] && res.results[0].asLord ? 3 : 2); else if (res.outcome === 'lose') think('«' + Pl('[风水|fēng shuǐ] [轮流|lún liú] [转|zhuàn]') + '» (luck goes round), says Grandpa Chen.', 4); return; }
    if (v === 'school') return chapter1Again();
    if (v === 'rules') return UI.card(`<div class="tag">${H('[斗地主|dòu dì zhǔ]')} · Fight the Landlord</div><div class="note" style="text-align:left;font-size:15px;line-height:1.5">One landlord (${H('[地主|dì zhǔ]')}) against two farmers (${H('[农民|nóng mín]')}). Bid with ${H('[叫地主|jiào dì zhǔ]')} or ${H('[不叫|bù jiào]')}. 3 is the lowest card, then up to K, A, <b>2</b>, ${H('[小王|xiǎo wáng]')}, ${H('[大王|dà wáng]')}. Beat the last play with the same kind, higher, or pass: ${H('[不要|bù yào]')}. ${H('[炸弹|zhà dàn]')} (four of a kind) beats anything but a bigger bomb, ${H('[王炸|wáng zhà]')} beats everything; each doubles the score. First to play out every card wins. Points are sunflower seeds, ${H('[瓜子|guā zǐ]')}.</div><div class="sub">E to close</div>`);
    if (v === 'rec') return UI.card(`<div class="tag">Your record at Grandpa Chen’s table</div><div class="big">${st.rec.won} – ${st.rec.played - st.rec.won}</div><div class="note">${st.rec.played} games · ${st.rec.lord} as the landlord (${st.rec.lordWon} won)${st.match ? ` · the grudge match: you ${st.match[0]}, Chen ${st.match[1]}, Hu ${st.match[2]} seeds` : ''}</div><div class="sub">E to close</div>`);
    if (v === 'cap') { st.capOff = !st.capOff; if (!st.capOff && G.state.ny && G.state.ny.band) G.state.ny.bandOff = true; try { Sound.play('click'); } catch (e) { /* */ } UI.toast(st.capOff ? 'Cap off.' : `${mimo} wears the lucky cap again.`); if (G.save) G.save(); }
  }
  async function chapter1Again() {
    const groups = ZHF.shuffle([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17]).slice(0, 8);
    await cardSchool(groups.map(r => ({ kindText: 'From memory · what’s this card?', cards: [r], show: false, answer: [r], placeholder: 'its name…' })), 'Card school · 认牌', 'chen');
  }
  async function huTalk() {
    const st = S(); if (!st.met) return meet();
    st.huN = (st.huN || 0) + 1;
    await scene(async () => { standBy(); shot(2); await say('hu', st.huN % 2 ? 'zc.hu.idle1' : 'zc.hu.idle2'); if (st.huN % 2) await say('chen', 'zc.chen.nonsense'); });
  }

  // ================================================================ what you can press E on (story.js STORY.extra), and a first look
  const PROVIDER = {
    interactables() {
      if (!BUILT || !shown() || TB.open || ZHF.overlayOpen || (G.indoors && G.indoors())) return [];
      const Y = G.sim.you; if (Math.abs(Y.x - SITE.T.x) > 12 || Math.abs(Y.z - SITE.T.z) > 12) return [];
      const L = [], add = (x, z, r, label, run) => L.push({ x, z, y: BUILT.gy(x, z), r, label, run });
      const wish = id => typeof NEWYEAR !== 'undefined' && NEWYEAR.wishFor && NEWYEAR.wishFor(id);      // (newyear.js's red-envelope round: its "New Year wish" goes first)
      if (!wish('chen')) add(SEAT.chen.x + 0.45, SEAT.chen.z, 2.0, 'Talk', chenTalk);
      if (!wish('hu')) add(SEAT.hu.x - 0.45, SEAT.hu.z, 1.6, 'Talk', huTalk);
      add(SEAT.you.x, SEAT.you.z + 0.35, 1.5, 'Sit down', chenTalk);
      const cg = BUILT.cage.position; add(cg.x, cg.z, 1.3, 'Look', async () => { await scene(async () => { standBy(); shot(0); await say('chen', 'zc.chen.bird'); }); });
      add(SITE.SIDE.x, SITE.SIDE.z, 1.1, 'Look', async () => think('A red thermos of hot water, two jars of green tea, and an old radio playing jazz. Grandpa Chen’s whole kitchen.', 5));
      return L;
    },
    tick(dt, Y) {
      if (!BUILT || !shown()) return;
      const st = S();
      if (!st.seen && Math.hypot(Y.x - SITE.T.x, Y.z - SITE.T.z) < 9) { st.seen = true; think(`Two old men slapping cards down on a little table. «${Pl('[炸弹|zhà dàn] ！')}» «${Pl('[胡说|hú shuō] [八道|bā dào] ！')}»`, 4.5); }
    },
  };
  // ================================================================ the quest (quests.js LIST: zh games only)
  function quest() {
    const z = s => s.zc || {}, ch = (s, n) => !!(z(s).ch && z(s).ch[n]), at = () => ({ x: SEAT.chen.x + 0.5, z: SEAT.chen.z });
    // (the "(after …)" note only while the chapter is still locked)
    const step = (n, text, why, hint) => ({ get text() { const c = CH[n - 1]; return c && !c.gate(flags()) ? text : text.replace(/ \(after [^)]*\)$/, ''); }, why, done: s => ch(s, n), target: at, hint });
    return {
      id: 'zc', kind: 'side', title: 'Grandpa Chen’s card table', giver: 'Grandpa Chen, at the card table on Alba’s west side',
      started: s => s.lang === 'zh' && !!z(s).met,
      steps: [
        step(1, 'Learn the cards with Grandpa Chen (认牌)', 'Every card has a name: 三 to 十, J Q K A, 二, and the jokers 小王 and 大王. In 斗地主 the two beats the ace.', '{mimo} points at the old man in the flat cap.'),
        step(2, 'Play your first game of 斗地主 (after the big Hushling on the hill)', 'One landlord against two farmers. Bid with 叫地主, call your plays (对五!), and pass with 不要.', '{mimo} hops onto the empty stool.'),
        step(3, 'Learn the bombs, and win as the landlord (after the first bell)', 'Straights, airplanes, bombs and the rocket: the real game, 17 cards each. Grandpa Chen wants to see you win as the landlord (two wins of any kind will do, too).', '{mimo} points at the deck on the table.'),
        step(4, 'The grudge match: Chen against Hu (after the second bell)', 'Forty years of games in one notebook, and they’re tied. Three games settle it, and you’re the third player.', '{mimo} looks from one grandpa to the other.'),
        step(5, 'A good loser (after the third bell)', 'Grandpa Chen has something to tell you about why he plays.', '{mimo} tugs you toward the card table.'),
      ],
      story: [
        { when: s => !!z(s).met, text: 'On Alba’s west side, under a scholar tree, Grandpa Chen and Grandpa Hu play 斗地主 every day, and argue about it. A sign on the tree says 观棋不语真君子: watchers stay quiet.' },
        { when: s => ch(s, 2), text: 'You played your first 斗地主: one landlord against two farmers, every play called out loud.' },
        { when: s => !!z(s).cap, text: 'You won as the landlord, and Grandpa Chen gave {mimo} his lucky flat cap. Grandpa Hu has wanted it for ten years.' },
        { when: s => ch(s, 4), text: 'The grudge match: three games for forty years of bragging rights. «一山还比一山高», as Grandpa Chen says.' },
        { when: s => ch(s, 5), text: 'Grandpa Hu lost and went quiet, and the gray came in. Your words brought him back. Grandpa Chen told you why they play: at cards you have to talk, so the Hush can’t get in.' },
      ],
    };
  }

  // ================================================================ start
  function sources() { return [LT, BANTER, PH.map(p => [p.zh, (p.ex || []).map(e => e[0])]), VOC.map(v => v[0]), Object.values(RNAME), Object.values(NAMES)]; }
  function cjCheck() { return ZHF.check('cards', sources()); }
  function init(game) {
    G = game; ZHF.bind(game);
    ZHF.registerLines(LT); registerIcons(); ZHF.phrases(PH);
    try { if (typeof CJK !== 'undefined') CJK.addSource(sources(), 'zh'); } catch (e) { console.warn('[cards] cjk', e); }
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'zc')) QUESTS.LIST.push(quest());
    if (typeof SIGNS !== 'undefined' && SIGNS.add) SIGNS.add({ id: 'zc-sign', x: SITE.BOARD.x + SITE.DIR.x * 0.6, z: SITE.BOARD.z + SITE.DIR.z * 0.6, r: 1.4, when: () => shown(), card: () => ({ tag: 'A sign on Grandpa Chen’s tree', lines: [{ text: '[观棋|guān qí] [不语|bù yǔ] [真|zhēn] [君子|jūn zǐ]', en: 'A true gentleman watches the game in silence.', look: { face: '#e6c890', edge: '#7a5236' } }] }) });
    setInterval(() => { if (shown()) ZHF.keepFar(PH.map(p => p.id)); }, 30000);
  }
  // ================================================================ tests (the game never calls these)
  const TEST = {
    fast(on = true) { TB.fast = on; ZHF.LES.fast = on; },
    get T() { return TB.T; }, get TB() { return TB; }, get SCH() { return SCH; },
    say(text) { if (TB.ui) TB.ui.input.value = text; submitYou(text); return TB.T ? { phase: TB.T.phase, turn: TB.T.turn, hint: TB.ui && TB.ui.hint.textContent } : null; },
    // your turn, played by the computer's choice, called with the natural call (no cards selected: the parser finds them)
    auto() {
      const T = TB.T; if (!T || T.turn !== 0 || !TB.resolveYou) return null;
      const sayS = src => this.say(TEST.roman ? ZHF.R(src) : ZHF.P(src, { mode: 'chars' }));
      if (T.phase === 'bid') return sayS(TEST.bid || strength(T.hands[0]) >= 6 ? '[叫地主|jiào dì zhǔ]' : '[不叫|bù jiào]');
      if (T.phase === 'ann') return sayS(annSrc(T.annN));
      const p = choose(T, 0, { noise: 0.3, nerve: 1 }), src = p ? natural(classify(p.ids)) : '[不要|bù yào]', text = TEST.roman ? ZHF.R(src) : ZHF.P(src, { mode: 'chars' });
      const before = T.hands[0].length, r = this.say(text);
      return { text, played: before - (TB.T ? TB.T.hands[0].length : before), r };
    },
    // a whole session on autopilot (fast: no waits; microtasks only, so it runs in a hidden tab)
    async play(cfg = {}, max = 60000) {
      TEST.fast(); const P = runTable(Object.assign({ hints: true }, cfg)); const log = [];
      for (let i = 0; i < max && TB.open; i++) { await null; if (TB.resolveYou) log.push(TEST.auto()); }
      const r = await P; return { r, n: log.length, log: log.slice(0, 80) };
    },
    setup(fl) { Object.assign(G.state.flags, { hatched: true, rosa: true }, fl || {}); G.state.lang = 'zh'; },
  };
  return {
    init, build, update, quest, capOn, interactables: () => [],
    get busy() { return TB.open; },
    _: { classify, beats, plays, choose, split, strength, deal, readCall, tokens, resolve, gradeCall, gradePass, natural, enOf, RNAME, LT, BANTER, PH, SITE, SEAT, NAMES,
      runTable, chapter1, chapter2, chapter3, chapter4, chapter5, chenTalk, meet, cjCheck, sources, S: () => S(), get BUILT() { return BUILT; }, t: TEST, PROVIDER, CH },
  };
})();
