'use strict';
// Grandpa Shige's shogi bench (SIDES.md: the card or board-game grandpa at the game corner). Japanese games only.
// The user: "both of these should have their own unique and extensive side plots that give plenty of rich side content to
// people replaying the game in a new language" (SIDES.md, full parity).
//
// WHO: シゲ (Shige), a retired carpenter in his seventies who carved his own shogi pieces from boxwood. A folding fan (扇子) he
//   snaps shut when he thinks. Calm, dry, stubborn. Every summer evening for forty years he played 縁台将棋 (bench shogi,
//   outdoors) with his rival and best friend テツ (Tetsu, Natsu's grandpa: matsuri.js), until one evening Tetsu said «待った»
//   (take that back!), Shige wouldn't allow it («待ったなし»), and neither has spoken since. Now he plays against an empty
//   seat, and the Hush sits there instead. Original characters.
// WHERE: the shared game corner (−47.6, −162.6): a long wooden bench (縁台) with a thick shogi board on it, a paper lantern
//   on a post, a mosquito-coil pig (蚊遣り豚), barley tea, and a hanging board: 待ったなし (a readable sign).
// THE GAME: 5五将棋 (minishogi, Shigenobu Kanai's 1970 variant): a 5×5 board, six pieces each (玉 金 銀 角 飛 歩), real
//   captures, drops (持ち駒, 打), promotion (成・不成; the far rank is the promotion zone), 二歩 and 打ち歩詰め. You announce every
//   move the Japanese way, square then piece: «２四歩» (に よん ふ), «同 角» (どう かく), «２二銀打», «２一歩成».
// CHAPTERS (gated like every side character: Rosa's welcome, the big Hushling on the hill, bells 1, 2, 3):
//   1 駒 the pieces: names and moves in kanji with readings: 王将・玉将 飛車 角行 金将 銀将 桂馬 香車 歩兵; set up the small board
//   2 棋譜 announcing moves: the files (1–5, right to left) and ranks (一–五), squares, moves, 同; a few moves of an opening
//   3 持ち駒・成り captures and drops (打つ), promotion (成る・不成; と金 成銀 馬 龍), and the 二歩 rule
//   4 詰将棋と礼儀 mate puzzles (王手, 詰み) and manners: お願いします, 参りました, ありがとうございました; 待ったなし and the quarrel
//   5 本番 a real game against him, the Hush at the board; then Tetsu comes, and two old friends sit down again
// Rewards: Phrasebook entries (ph.sg.*), Shige's 扇子 for Mimo (a side item: no head slot), the carved 歩 (key item), coins.
// Song (Sound.addSong): 'ja_shogi' «縁台ファイブ», jazz-funk in 5/4 with a vibraphone and the snap of pieces on the board.
// API: SHOGI.init(game) · .build(scene, env) → { colliders, group, people, update } · .update(dt, t, you) · .mapMark(dpr) ·
//   .quest() · .busy · .fanOn() · ._ (the engine E, the reader, tests: ._.t). State: G.state.sg.

const SHOGI = (() => {
  let G = null;
  const L = () => (G && G.state && G.state.lang) || 'es';
  const isOn = () => L() === 'ja';
  const shown = () => !!(G && G.state && G.state.lang === 'ja' && G.state.flags && G.state.flags.hatched);
  const flags = () => (G && G.state && G.state.flags) || {};
  const cj = () => typeof CJK !== 'undefined';
  const cmode = () => (cj() ? CJK.mode('ja') : 'roman');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const J = (src, o) => (cj() ? CJK.html(String(src), Object.assign({ lang: 'ja' }, o || {})) : esc(src));
  const JP = (src, o) => (cj() ? CJK.plain(String(src), Object.assign({ lang: 'ja' }, o || {})) : String(src));
  const JR = src => (cj() ? CJK.roman(String(src), { lang: 'ja' }) : String(src));
  const JC = src => JP(src, { mode: 'chars' });
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const wait = s => (typeof STORY !== 'undefined' && STORY.wait ? STORY.wait(s) : new Promise(r => setTimeout(r, s * 1000)));
  const sfx = (n, ...a) => { try { Sound.play(n, ...a); } catch (e) { /* no audio yet */ } };
  const FONT = '"Yu Gothic UI", "Yu Gothic", "Meiryo", "Hiragino Kaku Gothic ProN", "Noto Sans CJK JP", sans-serif';
  const BRUSH = '"Yu Mincho", "YuMincho", "Hiragino Mincho ProN", "MS Mincho", "Noto Serif CJK JP", serif';
  const S = () => { const s = G.state; if (!s.sg) s.sg = {}; const o = s.sg; o.ch = o.ch || {}; o.grade = o.grade || {}; o.rec = o.rec || { played: 0, won: 0, lost: 0, drawn: 0 }; return o; };
  const sayVoice = src => { try { if (typeof UI !== 'undefined' && UI.speak) UI.speak(src); else Sound.say(JC(src), 'ja'); } catch (e) { /* no voice */ } };

  // ================================================================ the engine: 5五将棋 (minishogi)
  // The board: idx = r·5 + c. r 0 is rank 一 (the top: Shige's side), c 0 is file 5 (the left, from your side), so
  // file = 5 − c and rank = r + 1. Side 0 is you (先手, positive codes, moving up); side 1 is Shige (後手, negative, moving down).
  // Piece codes: 1 玉/王, 2 金, 3 銀, 4 角, 5 飛, 6 歩; promoted = code + 8: 11 成銀, 12 馬, 13 龍, 14 と. Hands: hand[side][base].
  const E = (() => {
    const KI = 1, GO = 2, SI = 3, BI = 4, RO = 5, PA = 6, PROM = 8;
    const base = t => (t > PROM ? t - PROM : t), promotable = t => t === SI || t === BI || t === RO || t === PA;
    const row = i => (i / 5) | 0, col = i => i % 5, at = (r, c) => r * 5 + c, ok = (r, c) => r >= 0 && r < 5 && c >= 0 && c < 5;
    const owner = v => (v > 0 ? 0 : 1), sgn = s => (s === 0 ? 1 : -1);
    const GOLD = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0]], DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]], ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    const STEPS = { 1: DIAG.concat(ORTH), 2: GOLD, 3: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 1]], 6: [[-1, 0]], 11: GOLD, 14: GOLD, 12: ORTH, 13: DIAG };
    const SLIDES = { 4: DIAG, 5: ORTH, 12: DIAG, 13: ORTH };
    const zone = (s, i) => (s === 0 ? row(i) === 0 : row(i) === 4);
    // the starting position (Kanai's 5五将棋): your back rank 玉 金 銀 角 飛 from the left (file 5) to the right (file 1),
    // your pawn in front of the king (5四); Shige's the same, turned round (his king on 1一, his pawn on 1二)
    function start() {
      const b = new Int8Array(25);
      [KI, GO, SI, BI, RO].forEach((t, c) => { b[at(4, c)] = t; b[at(0, 4 - c)] = -t; });
      b[at(3, 0)] = PA; b[at(1, 4)] = -PA;
      return { b, hand: [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]], turn: 0, ply: 0, hist: [] };
    }
    // a position from a picture: rows top to bottom, '.' empty, upper case yours, lower case his, '+' before a promoted
    // piece; letters K G S B R P. hands: { 0: 'GP', 1: '' }
    function fromRows(rows, turn = 0, hands = {}) {
      const b = new Int8Array(25), T = { K: KI, G: GO, S: SI, B: BI, R: RO, P: PA };
      rows.forEach((line, r) => { let c = 0; for (let i = 0; i < line.length; i++) { let ch = line[i], pr = 0; if (ch === ' ') continue; if (ch === '+') { pr = PROM; ch = line[++i]; } if (ch !== '.') { const t = T[ch.toUpperCase()] + pr; b[at(r, c)] = ch === ch.toUpperCase() ? t : -t; } c++; } });
      const hand = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];
      for (const s of [0, 1]) for (const ch of (hands[s] || '')) hand[s][T[ch.toUpperCase()]]++;
      return { b, hand, turn, ply: 0, hist: [] };
    }
    const clone = p => ({ b: new Int8Array(p.b), hand: [p.hand[0].slice(), p.hand[1].slice()], turn: p.turn, ply: p.ply, hist: p.hist.slice() });
    const key = p => p.b.join(',') + '|' + p.hand[0].join('') + p.hand[1].join('') + p.turn;
    const kingAt = (p, s) => { for (let i = 0; i < 25; i++) if (p.b[i] === (s === 0 ? KI : -KI)) return i; return -1; };
    // does the piece v on `from` attack square `sq`?
    function hits(p, from, v, sq) {
      const s = owner(v), t = Math.abs(v), d = sgn(s), dr = row(sq) - row(from), dc = col(sq) - col(from);
      for (const [a, b2] of STEPS[t] || []) if (a * d === dr && b2 === dc) return true;
      for (const [a, b2] of SLIDES[t] || []) {
        let r = row(from) + a, c = col(from) + b2;
        while (ok(r, c)) { const i = at(r, c); if (i === sq) return true; if (p.b[i]) break; r += a; c += b2; }
      }
      return false;
    }
    function attacked(p, sq, by) { for (let i = 0; i < 25; i++) { const v = p.b[i]; if (v && owner(v) === by && hits(p, i, v, sq)) return true; } return false; }
    const inCheck = (p, s = p.turn) => { const k = kingAt(p, s); return k >= 0 && attacked(p, k, 1 - s); };
    // every move for the side to move, before checking its own king's safety
    function gen(p) {
      const me = p.turn, d = sgn(me), out = [], b = p.b;
      const add = (f, to, t, cap) => {
        if (promotable(t) && (zone(me, f) || zone(me, to))) { out.push({ f, t: to, p: t, pr: true, cap }); if (!(t === PA && zone(me, to))) out.push({ f, t: to, p: t, pr: false, cap }); }
        else out.push({ f, t: to, p: t, pr: false, cap });
      };
      for (let i = 0; i < 25; i++) {
        const v = b[i]; if (!v || owner(v) !== me) continue;
        const t = Math.abs(v), r0 = row(i), c0 = col(i);
        for (const [a, b2] of STEPS[t] || []) { const r = r0 + a * d, c = c0 + b2; if (!ok(r, c)) continue; const w = b[at(r, c)]; if (w && owner(w) === me) continue; add(i, at(r, c), t, w); }
        for (const [a, b2] of SLIDES[t] || []) { let r = r0 + a, c = c0 + b2; while (ok(r, c)) { const w = b[at(r, c)]; if (w && owner(w) === me) break; add(i, at(r, c), t, w); if (w) break; r += a; c += b2; } }
      }
      for (const t of [GO, SI, BI, RO, PA]) {
        if (!p.hand[me][t]) continue;
        for (let i = 0; i < 25; i++) {
          if (b[i]) continue;
          if (t === PA) { if (zone(me, i)) continue; let two = false; for (let r = 0; r < 5; r++) if (b[at(r, col(i))] === d * PA) two = true; if (two) continue; }      // (no pawn on the last rank; 二歩)
          out.push({ f: -1, t: i, p: t, pr: false, cap: 0, drop: true });
        }
      }
      return out;
    }
    function make(p, m) {
      const me = p.turn, d = sgn(me);
      if (m.drop) { p.b[m.t] = d * m.p; p.hand[me][m.p]--; }
      else { p.b[m.f] = 0; p.b[m.t] = d * (m.pr ? m.p + PROM : m.p); if (m.cap) p.hand[me][base(Math.abs(m.cap))]++; }
      p.turn = 1 - me; p.ply++;
    }
    function unmake(p, m) {
      p.turn = 1 - p.turn; p.ply--; const me = p.turn, d = sgn(me);
      if (m.drop) { p.b[m.t] = 0; p.hand[me][m.p]++; }
      else { p.b[m.f] = d * m.p; p.b[m.t] = m.cap || 0; if (m.cap) p.hand[me][base(Math.abs(m.cap))]--; }
    }
    // the legal moves: your king never left in check, and no pawn drop that mates on the spot (打ち歩詰め)
    function legal(p) {
      const me = p.turn, out = [];
      for (const m of gen(p)) {
        make(p, m);
        let good = !inCheck(p, me);
        if (good && m.drop && m.p === PA && inCheck(p, p.turn)) good = anyLegal(p);
        unmake(p, m);
        if (good) out.push(m);
      }
      return out;
    }
    function anyLegal(p) { const me = p.turn; for (const m of gen(p)) { make(p, m); const safe = !inCheck(p, me); unmake(p, m); if (safe) return true; } return false; }
    // a move in the game (not in a search): keeps the history for 千日手 (the same position four times: a draw)
    function play(p, m) { make(p, m); p.hist.push(key(p)); return p; }
    function status(p) {
      const moves = legal(p), check = inCheck(p);
      if (!moves.length) return { over: true, winner: 1 - p.turn, why: check ? 'mate' : 'stuck', check, moves };
      const k = key(p); if (p.hist.filter(h => h === k).length >= 4) return { over: true, winner: -1, why: 'repetition', check, moves };
      return { over: false, check, moves };
    }
    // ---- the evaluation (for the side to move): material on the board and in hand, the kings' guards, pawns going forward
    const VAL = { 1: 0, 2: 450, 3: 400, 4: 550, 5: 650, 6: 100, 11: 460, 12: 760, 13: 860, 14: 460 };
    const HANDV = { 2: 520, 3: 470, 4: 620, 5: 720, 6: 120 };
    function evaluate(p) {
      let s = 0;
      for (let i = 0; i < 25; i++) { const v = p.b[i]; if (!v) continue; const w = owner(v) === 0 ? 1 : -1, t = Math.abs(v); s += w * (VAL[t] + (t === PA || t === SI ? (owner(v) === 0 ? 4 - row(i) : row(i)) * 6 : 0)); }
      for (const t of [2, 3, 4, 5, 6]) s += (p.hand[0][t] - p.hand[1][t]) * HANDV[t];
      for (const side of [0, 1]) {
        const k = kingAt(p, side); if (k < 0) continue; let g = 0, a = 0;
        for (const [dr, dc] of STEPS[1]) { const r = row(k) + dr, c = col(k) + dc; if (!ok(r, c)) continue; const v = p.b[at(r, c)]; if (v && owner(v) === side) g++; if (attacked(p, at(r, c), 1 - side)) a++; }
        s += (side === 0 ? 1 : -1) * (g * 14 - a * 22);
      }
      return p.turn === 0 ? s : -s;
    }
    const MATE = 100000;
    const order = ms => ms.sort((a, b) => ((b.cap ? VAL[Math.abs(b.cap)] * 10 - VAL[b.p] : 0) + (b.pr ? 300 : 0) - (b.drop ? 50 : 0)) - ((a.cap ? VAL[Math.abs(a.cap)] * 10 - VAL[a.p] : 0) + (a.pr ? 300 : 0) - (a.drop ? 50 : 0)));
    // the captures that follow, so a search never stops halfway through an exchange (a piece left hanging at the horizon)
    function quiet(p, alpha, beta, ctx, d) {
      ctx.nodes++;
      const stand = evaluate(p); if (d <= 0 || ctx.nodes > ctx.max) return stand;
      if (stand >= beta) return stand; if (stand > alpha) alpha = stand;
      const me = p.turn, caps = order(gen(p).filter(m => m.cap));
      for (const m of caps) { make(p, m); if (inCheck(p, me)) { unmake(p, m); continue; } const v = -quiet(p, -beta, -alpha, ctx, d - 1); unmake(p, m); if (v >= beta) return v; if (v > alpha) alpha = v; }
      return alpha;
    }
    function search(p, depth, alpha, beta, ply, ctx) {
      ctx.nodes++;
      const moves = legal(p);
      if (!moves.length) return -MATE + ply;
      if (depth <= 0 && inCheck(p) && ply < 6) depth = 1;          // (in check at the horizon: look one more move)
      if (depth <= 0 || ctx.nodes > ctx.max) return ctx.nodes > ctx.max ? evaluate(p) : quiet(p, alpha, beta, ctx, 4);
      order(moves);
      let best = -Infinity;
      for (const m of moves) { make(p, m); const v = -search(p, depth - 1, -beta, -alpha, ply + 1, ctx); unmake(p, m); if (v > best) best = v; if (v > alpha) alpha = v; if (alpha >= beta) break; }
      return best;
    }
    // Shige's move: every move searched to `depth` plies, then a little noise (he isn't the same every game, and a kind
    // teacher now and then lets a chance go). Returns the move with .score (his view).
    function bestMove(p, o = {}) {
      const depth = o.depth || 2, noise = o.noise !== undefined ? o.noise : 40, R = o.rand || Math.random, ctx = { nodes: 0, max: o.max || 60000 };
      const moves = legal(p); if (!moves.length) return null;
      order(moves);
      const scored = moves.map(m => { make(p, m); const v = -search(p, depth - 1, -Infinity, Infinity, 1, ctx); unmake(p, m); return { m, v, n: v + (R() * 2 - 1) * noise + (!m.pr && promotable(m.p) && m.f >= 0 && (zone(p.turn, m.f) || zone(p.turn, m.t)) && m.p !== SI ? -200 : 0) }; });
      scored.sort((a, b) => b.n - a.n);
      const r = scored[0].m; r.score = scored[0].v; r.nodes = ctx.nodes;
      return r;
    }
    // ---- 詰将棋: can the side to move mate within `plies` (odd), checking every move? → the first such move, or null
    function mateMove(p, plies) {
      for (const m of legal(p)) {
        make(p, m);
        let win = false;
        if (inCheck(p)) {
          const rep = legal(p);
          if (!rep.length) win = !(m.drop && m.p === PA);
          else if (plies >= 3) win = rep.every(r => { make(p, r); const w = !!mateMove(p, plies - 2); unmake(p, r); return w; });
        }
        unmake(p, m);
        if (win) return m;
      }
      return null;
    }
    const allMates = (p, plies) => legal(p).filter(m => { make(p, m); let w = false; if (inCheck(p)) { const rep = legal(p); w = !rep.length || (plies >= 3 && rep.every(r => { make(p, r); const x = !!mateMove(p, plies - 2); unmake(p, r); return x; })); } unmake(p, m); return w; });
    return { KI, GO, SI, BI, RO, PA, PROM, STEPS, SLIDES, base, promotable, row, col, at, owner, zone, start, fromRows, clone, key, kingAt, attacked, inCheck, gen, legal, make, unmake, play, status, evaluate, bestMove, mateMove, allMates, VAL };
  })();

  // ================================================================ 棋譜 (kifu): writing a move down, and reading one typed in
  // A move is written the KIF way: the square (its file as a full-width digit, its rank as a kanji numeral), the piece, then
  // 打 on every drop, 成 or 不成 when it could promote; 同 when it lands where the last move did; 右 左 上 引 寄 直 when two of
  // the same piece could go there. src: notation (CJK.md; a digit can't take a reading, so it stays bare); say: the reading
  // in kana («に よん ふ»), for rōmaji and the hints.
  const FWD = '０１２３４５', KAN = ['', '一', '二', '三', '四', '五'], RD = ['', 'いち', 'に', 'さん', 'よん', 'ご'];
  const PNAME = { 1: ['玉', 'ぎょく'], 2: ['金', 'きん'], 3: ['銀', 'ぎん'], 4: ['角', 'かく'], 5: ['飛', 'ひ'], 6: ['歩', 'ふ'], 11: ['成銀', 'なりぎん'], 12: ['馬', 'うま'], 13: ['龍', 'りゅう'], 14: ['と', 'と'] };
  const pSrc = (t, side) => (t === 1 && side === 1 ? '[王|おう]' : t === 14 ? 'と' : `[${PNAME[t][0]}|${PNAME[t][1]}]`);      // (Shige's king is 王, yours 玉)
  const pSay = (t, side) => (t === 1 && side === 1 ? 'おう' : PNAME[t][1]);
  const pChar = (t, side) => (t === 1 && side === 1 ? '王' : PNAME[t][0]);
  const fileOf = i => 5 - E.col(i), rankOf = i => E.row(i) + 1;
  const sqSrc = i => `${FWD[fileOf(i)]} [${KAN[rankOf(i)]}|${RD[rankOf(i)]}]`;
  const RDK = ['', '[一|いち]', '[二|に]', '[三|さん]', '[四|よん]', '[五|ご]'];      // (bracketed: rōmaji reads a bare さん as the honorific «-san»)
  const sqSay = i => `${RDK[fileOf(i)]} ${RDK[rankOf(i)]}`;
  const sqTxt = i => FWD[fileOf(i)] + KAN[rankOf(i)];
  const REL = { あがる: 'up', ひく: 'back', よる: 'side', みぎ: 'right', ひだり: 'left', すぐ: 'straight' };
  // two of the same piece could land there: which one (上 forward, 引 back, 寄 sideways; else 右 or 左, seen from the mover)
  function relOf(m, p) {
    if (m.drop) return null;
    const me = p.turn, others = E.legal(p).filter(o => !o.drop && o.t === m.t && o.p === m.p && o.f !== m.f);
    if (!others.length) return null;
    const dir = f => { const dr = (E.row(m.t) - E.row(f)) * (me === 0 ? -1 : 1); return dr > 0 ? 'up' : dr < 0 ? 'back' : 'side'; };
    const mine = dir(m.f);
    if (others.every(o => dir(o.f) !== mine)) return mine === 'up' ? ['[上|あがる]', 'あがる'] : mine === 'back' ? ['[引|ひく]', 'ひく'] : ['[寄|よる]', 'よる'];
    const x = f => (me === 0 ? -fileOf(f) : fileOf(f));        // (bigger = further to the mover's right: yours is file 1's side)
    if (others.every(o => x(o.f) < x(m.f))) return ['[右|みぎ]', 'みぎ'];
    if (others.every(o => x(o.f) > x(m.f))) return ['[左|ひだり]', 'ひだり'];
    return ['[直|すぐ]', 'すぐ'];
  }
  // a move → { src, say } (p: the position before it; last: the square the move before it landed on)
  function kifu(m, p, last) {
    const me = p.turn, rel = relOf(m, p);
    let src, say;
    if (!m.drop && last === m.t) { src = '[同|どう] ' + pSrc(m.p, me); say = 'どう ' + pSay(m.p, me); }
    else { src = sqSrc(m.t) + ' ' + pSrc(m.p, me); say = sqSay(m.t) + ' ' + pSay(m.p, me); }
    if (rel) { src += ' ' + rel[0]; say += ' ' + rel[1]; }
    if (m.drop) { src += ' [打|うつ]'; say += ' うつ'; }
    else if (m.pr) { src += ' [成|なり]'; say += ' なり'; }
    else if (E.promotable(m.p) && (E.zone(me, m.f) || E.zone(me, m.t))) { src += ' [不成|ならず]'; say += ' ならず'; }
    return { src, say };
  }
  const ro = say => esc(JR(say).toLowerCase());
  // a move as HTML: always in characters (it's what a kifu looks like), its reading after it in rōmaji mode
  const kHTML = (k, o = {}) => `<span class="kf">${J(k.src, { mode: 'chars', cap: false, ruby: o.ruby })}</span>` + (cmode() === 'roman' || o.ro ? ` <i class="ro">${ro(k.say)}</i>` : '');
  const sqHTML = i => kHTML({ src: sqSrc(i), say: sqSay(i) });

  // ---- reading: the typed text (kana, rōmaji, kanji, digits, any mix) → tokens → a move
  const KT = [['ぎょくしょう', 'p1'], ['おうしょう', 'p1'], ['ぎょく', 'p1'], ['おうて', 'check'], ['おう', 'p1'], ['おお', 'p1'],
    ['きんしょう', 'p2'], ['ぎんしょう', 'p3'], ['なりぎん', 'p11'], ['きん', 'p2'], ['ぎん', 'p3'], ['かくぎょう', 'p4'], ['かく', 'p4'],
    ['ひしゃ', 'p5'], ['ふひょう', 'p6'], ['ときん', 'p14'], ['りゅうおう', 'p13'], ['りゅうま', 'p12'], ['りゅう', 'p13'], ['うま', 'p12'],
    ['けいま', 'kei'], ['けい', 'kei'], ['きょうしゃ', 'kyo'], ['きょう', 'kyo'],
    ['ならず', 'np'], ['ならない', 'np'], ['なります', 'pr'], ['なる', 'pr'], ['なり', 'pr'], ['なった', 'pr'], ['なって', 'pr'],
    ['うちます', 'dr'], ['うつ', 'dr'], ['うち', 'dr'], ['うって', 'dr'], ['うった', 'dr'], ['どう', 'same'], ['つみ', 'mate'],
    ['みぎ', 'right'], ['ひだり', 'left'], ['あがる', 'up'], ['あがり', 'up'], ['ひく', 'back'], ['ひき', 'back'], ['よる', 'side'], ['より', 'side'], ['すぐ', 'straight'],
    ['いち', 'n1'], ['さん', 'n3'], ['よん', 'n4'], ['ろく', 'n6'], ['なな', 'n7'], ['しち', 'n7'], ['はち', 'n8'], ['きゅう', 'n9'],
    ['に', 'n2'], ['し', 'n4'], ['ご', 'n5'], ['く', 'n9'], ['ひ', 'p5'], ['ふ', 'p6'], ['と', 'p14'], ['お', 'p1'],
    ['です', ''], ['ます', ''], ['の', ''], ['を', ''], ['へ', ''], ['で', ''], ['が', ''], ['は', ''], ['ね', ''], ['よ', ''], ['ー', ''], ['っ', ''], ['、', ''], ['。', ''], ['！', ''], ['？', ''], ['・', '']]
    .sort((a, b) => b[0].length - a[0].length);
  const HT = { 一: 'n1', 二: 'n2', 三: 'n3', 四: 'n4', 五: 'n5', 六: 'n6', 七: 'n7', 八: 'n8', 九: 'n9', 王: 'p1', 玉: 'p1', 金: 'p2', 銀: 'p3', 角: 'p4', 飛: 'p5', 歩: 'p6',
    馬: 'p12', 龍: 'p13', 竜: 'p13', 全: 'p11', 成: 'pr', 不: 'not', 打: 'dr', 同: 'same', 右: 'right', 左: 'left', 上: 'up', 引: 'back', 寄: 'side', 直: 'straight',
    詰: 'mate', 手: 'te', 桂: 'kei', 香: 'kyo', 将: '', 行: '', 車: '', 兵: '' };
  function toks(text) {
    if (!cj()) return { list: [], bad: String(text || '') };
    const s = String(text || '').normalize('NFKC').replace(/[▲△☗☖()（）]/g, ' ');
    const U = CJK.typed(s, 'ja').U, raw = [], bad = [];
    let kana = '';
    const flush = () => { let i = 0; while (i < kana.length) { const hit = KT.find(([w]) => kana.startsWith(w, i)); if (hit) { if (hit[1]) raw.push(hit[1]); i += hit[0].length; } else { bad.push(kana[i]); i++; } } kana = ''; };
    for (const u of U) {
      if (u.k) { kana += u.k; continue; }
      flush();
      if (u.digit) { for (const ch of String(u.raw)) if (/[0-9]/.test(ch)) raw.push('n' + ch); }
      else if (u.han) { const t = HT[u.ch]; if (t === undefined) bad.push(u.ch); else if (t) raw.push(t); }
    }
    flush();
    // the pairs: 王手 → check, 不成 → 不成, 成 + a piece → the promoted piece (成銀), 龍馬 → 馬, 龍王 → 龍, と金 → と, 桂馬 → 桂
    const L = [];
    for (let i = 0; i < raw.length; i++) {
      const a = raw[i], b = raw[i + 1], prev = L[L.length - 1];
      if (a === 'p1' && b === 'te') { L.push('check'); i++; continue; }
      if (a === 'te') continue;
      if (a === 'not') { L.push('np'); if (b === 'pr') i++; continue; }
      if (a === 'pr' && b && /^p[2-6]$/.test(b) && (!prev || prev[0] === 'n' || prev === 'same') && E.promotable(+b.slice(1))) { L.push('p' + (+b.slice(1) + 8)); i++; continue; }
      if (a === 'p13' && (b === 'p12' || b === 'p1')) { L.push(b === 'p12' ? 'p12' : 'p13'); i++; continue; }
      if (a === 'p14' && b === 'p2') { L.push('p14'); i++; continue; }
      if (a === 'kei' && b === 'p12') { L.push('kei'); i++; continue; }
      L.push(a);
    }
    return { list: L, bad: bad.join('') };
  }
  // the first piece named in the text: a code (1–14), 'kei' or 'kyo', or null
  const pieceIn = text => { const t = toks(text).list.find(x => x[0] === 'p' || x === 'kei' || x === 'kyo'); return t ? (t[0] === 'p' ? +t.slice(1) : t) : null; };
  // the first square named in the text (two numbers): its index, or -1
  const squareIn = text => { const L = toks(text).list, i = L.findIndex((x, k) => x[0] === 'n' && L[k + 1] && L[k + 1][0] === 'n'); if (i < 0) return -1; const f = +L[i].slice(1), r = +L[i + 1].slice(1); return f >= 1 && f <= 5 && r >= 1 && r <= 5 ? E.at(r - 1, 5 - f) : -1; };
  // a typed move → { to, pc, drop, prom (true, false or null), rel, check, same } or { err }
  function parseMove(text, last) {
    const { list: L, bad } = toks(text);
    if (!L.length) return { err: 'empty', bad };
    const num = t => (t && t[0] === 'n' ? +t.slice(1) : 0);
    let i, to, same = false;
    if (L[0] === 'same') { same = true; i = 1; if (last == null || last < 0) return { err: 'nolast' }; to = last; }
    else if (num(L[0]) && num(L[1])) { const f = num(L[0]), r = num(L[1]); if (f > 5 || r > 5) return { err: 'range' }; to = E.at(r - 1, 5 - f); i = 2; if (L[2] === 'same') { same = true; i = 3; } }
    else return { err: 'square', bad };
    const pt = L[i];
    if (pt === 'kei' || pt === 'kyo') return { err: 'big' };
    if (!pt || pt[0] !== 'p') return { err: 'piece', to };
    const pc = +pt.slice(1); i++;
    let drop = false, prom = null, check = false; const rel = [];
    for (; i < L.length; i++) {
      const a = L[i];
      if (a === 'dr') drop = true; else if (a === 'pr') prom = true; else if (a === 'np') prom = false; else if (a === 'check') check = true;
      else if (['right', 'left', 'up', 'back', 'side', 'straight'].includes(a)) rel.push(a);
      else if (a !== 'mate') return { err: 'extra', to, pc };
    }
    return { to, pc, drop, prom, rel, check, same, bad };
  }
  // why a reading isn't a legal move here
  function whyNot(r, p) {
    const me = p.turn, d = me === 0 ? 1 : -1, b = p.b, occ = b[r.to];
    let onBoard = 0; for (let i = 0; i < 25; i++) if (b[i] === d * r.pc) onBoard++;
    const inHand = r.pc <= 6 && p.hand[me][r.pc] > 0;
    if (occ && E.owner(occ) === me) return 'own';
    if (r.drop && !inHand) return r.pc > 8 ? 'dropprom' : 'nohand';
    if (!onBoard && !inHand) return 'none';
    if ((r.drop || !onBoard) && occ) return 'dropocc';
    if ((r.drop || !onBoard) && r.pc === 6) { if (E.zone(me, r.to)) return 'lastrank'; for (let rr = 0; rr < 5; rr++) if (b[E.at(rr, E.col(r.to))] === d * 6) return 'nifu'; }
    const pseudo = E.gen(p).filter(m => m.t === r.to && m.p === r.pc && (!r.drop || m.drop));
    if (pseudo.length) return pseudo.some(m => m.drop && m.p === 6) && !E.inCheck(p, me) ? 'uchifu' : 'check';
    return 'reach';
  }
  // the move a reading means here → { m, forced } or { err } or { ask: 'prom' | 'which', ms }
  function resolveMove(r, p) {
    let ms = E.legal(p).filter(m => m.t === r.to && m.p === r.pc);
    if (r.drop) ms = ms.filter(m => m.drop); else if (ms.some(m => !m.drop)) ms = ms.filter(m => !m.drop);
    if (!ms.length) return { err: whyNot(r, p) };
    if (r.prom === true) { const k = ms.filter(m => m.pr); if (!k.length) return { err: ms.some(m => m.drop) ? 'dropprom' : 'cantprom' }; ms = k; }
    else if (r.prom === false) { const k = ms.filter(m => !m.pr); if (!k.length) return { err: 'mustprom' }; ms = k; }
    if (new Set(ms.map(m => m.f)).size > 1 && r.rel.length) { const k = ms.filter(m => { const w = relOf(m, p); return w && r.rel.includes(REL[w[1]]); }); if (k.length) ms = k; }
    if (new Set(ms.map(m => m.f)).size > 1) return { ask: 'which', ms };
    if (ms.length > 1) return { ask: 'prom', ms };
    return { m: ms[0], forced: r.prom === null && ms[0].pr };
  }
  const WHY = {
    empty: 'Say the square, then the piece: «２四歩» is に よん ふ.',
    square: 'Start with the square: its file (1–5, counted from the right) and its rank (一–五, from the top). «２四歩» is に よん ふ.',
    range: 'This little board only goes up to 5: files 1–5, ranks 一–五.',
    piece: 'And which piece? Say it after the square: 玉 金 銀 角 飛 歩 (or と 成銀 馬 龍).',
    nolast: '同 means “on the same square as the last move”, and there isn’t one yet.',
    big: 'The 桂馬 and the 香車 only live on the big 9×9 board.',
    extra: 'Something extra at the end: after the piece come only 打, 成 or 不成 (and 右 左 上 引 寄 when two could go).',
    own: 'One of your own pieces is already on that square.',
    none: 'You don’t have that piece (any more).',
    nohand: 'You don’t have that piece in hand (持ち駒).',
    dropocc: 'You can only drop (打つ) a piece on an empty square.',
    reach: 'Your piece can’t reach that square from where it stands.',
    check: 'That would leave your king in check (王手).',
    nifu: '二歩 (にふ): you already have a pawn on that file. Two on one file is a foul.',
    lastrank: 'A pawn can’t be dropped on the far rank: it could never move again.',
    uchifu: '打ち歩詰め: you may not give mate by dropping a pawn.',
    cantprom: 'That move can’t promote: only a move into or out of the far rank can.',
    mustprom: 'A pawn on the far rank has to promote: say 成.',
    dropprom: 'A piece is always dropped unpromoted (and can’t promote as it drops).',
  };
  // a typed move, all the way → { m, k (its kifu), notes, clean, check } or { err (text), code } or { ask, ms }
  function readMove(text, p, last) {
    const r = parseMove(text, last);
    if (r.err) return { err: WHY[r.err] || 'Hmm?', code: r.err };
    const z = resolveMove(r, p);
    if (z.err) return { err: WHY[z.err] || 'Hmm?', code: z.err };
    if (z.ask) return Object.assign(z, { r });
    const m = z.m, k = kifu(m, p, last), notes = []; let clean = true;
    if (z.forced) { notes.push('a pawn on the far rank must promote: say 成 (なり)'); clean = false; }
    if (!r.same && last === m.t && !m.drop) { notes.push('it lands where the last move did: shogi says 同 (どう) there'); clean = false; }
    if (r.same && last !== m.t) clean = false;
    return { m, k, notes, clean, check: r.check };
  }

  // ================================================================ the pieces (chapter 1), the promoted ones (chapter 3)
  // code: the engine's (桂馬 and 香車 only exist on the big board: 'kei' / 'kyo'); ch: the character on the piece
  const PIECES = [
    { id: 'ou', code: 1, full: '[王将|おうしょう]', alt: ['[玉将|ぎょくしょう]', '[王|おう]', '[玉|ぎょく]'], ch: '王', en: 'the king (“king general”)', how: 'one step in any direction', line: 'sg.p.ou' },
    { id: 'hi', code: 5, full: '[飛車|ひしゃ]', alt: ['[飛|ひ]'], ch: '飛', en: 'the rook (“flying chariot”)', how: 'any distance in a straight line: forward, back, left or right', line: 'sg.p.hi' },
    { id: 'kaku', code: 4, full: '[角行|かくぎょう]', alt: ['[角|かく]'], ch: '角', en: 'the bishop (“angle mover”)', how: 'any distance diagonally', line: 'sg.p.kaku' },
    { id: 'kin', code: 2, full: '[金将|きんしょう]', alt: ['[金|きん]'], ch: '金', en: 'the gold general', how: 'one step any way except diagonally back', line: 'sg.p.kin' },
    { id: 'gin', code: 3, full: '[銀将|ぎんしょう]', alt: ['[銀|ぎん]'], ch: '銀', en: 'the silver general', how: 'one step forward or diagonally; never sideways or straight back', line: 'sg.p.gin' },
    { id: 'kei', code: 'kei', full: '[桂馬|けいま]', alt: [], ch: '桂', en: 'the knight (“laurel horse”)', how: 'jumps two forward and one to the side (big board only)', line: 'sg.p.kei', big: true },
    { id: 'kyo', code: 'kyo', full: '[香車|きょうしゃ]', alt: [], ch: '香', en: 'the lance (“incense chariot”)', how: 'any distance straight forward, never back (big board only)', line: 'sg.p.kyo', big: true },
    { id: 'fu', code: 6, full: '[歩兵|ふひょう]', alt: ['[歩|ふ]'], ch: '歩', en: 'the pawn (“foot soldier”)', how: 'one step straight forward', line: 'sg.p.fu' },
  ];
  const PIECE = Object.fromEntries(PIECES.map(p => [p.id, p]));
  const PROMS = [
    { from: 6, to: 14, ja: 'と[金|きん]', alt: ['と'], en: 'tokin, a promoted pawn', how: 'moves like a gold' },
    { from: 3, to: 11, ja: '[成銀|なりぎん]', alt: [], en: 'a promoted silver', how: 'moves like a gold' },
    { from: 4, to: 12, ja: '[馬|うま]', alt: ['[龍馬|りゅうま]'], en: 'the horse, a promoted bishop', how: 'a bishop that can also step one square straight' },
    { from: 5, to: 13, ja: '[龍|りゅう]', alt: ['[龍王|りゅうおう]'], en: 'the dragon, a promoted rook', how: 'a rook that can also step one square diagonally' },
  ];
  // where a piece could go from (r0, c0) on an empty board (yours, moving up): for the chapter 1 diagrams
  function reachOf(code, r0, c0) {
    const out = [], ok = (r, c) => r >= 0 && r < 5 && c >= 0 && c < 5;
    if (code === 'kei') { for (const c of [c0 - 1, c0 + 1]) if (ok(r0 - 2, c)) out.push(E.at(r0 - 2, c)); return out; }
    if (code === 'kyo') { for (let r = r0 - 1; r >= 0; r--) out.push(E.at(r, c0)); return out; }
    for (const [a, b] of E.STEPS[code] || []) if (ok(r0 + a, c0 + b)) out.push(E.at(r0 + a, c0 + b));
    for (const [a, b] of E.SLIDES[code] || []) { let r = r0 + a, c = c0 + b; while (ok(r, c)) { out.push(E.at(r, c)); r += a; c += b; } }
    return [...new Set(out)];
  }

  // ================================================================ the Phrasebook (LEX kind 'phrase'; ja) and the key items
  const R_SG = 'Shogi (将棋)';
  const PH = [
    { id: 'ph.sg.onegai', ja: 'お[願|ねが]い します 。', en: 'Please. (Let’s have a good game.)', note: 'Said with a small bow before every game of shogi, by both players. The same words work for asking almost any favor.', sit: 'You sit down across the board from Shige. The game is about to begin.' },
    { id: 'ph.sg.mairimashita', ja: '[参|まい]りました 。', en: 'I resign. (“I’m beaten.”)', note: 'In shogi the loser ends the game: a bow, and 参りました. Saying it well is part of playing well.', sit: 'Your king can’t escape any more. End the game the shogi way.' },
    { id: 'ph.sg.arigatou', ja: 'ありがとう ございました 。', en: 'Thank you (for the game).', note: 'The past tense: thanks for what we just did. Both players say it, with a bow.', sit: 'The game is over. Thank Shige for it.' },
    { id: 'ph.sg.oute', ja: '[王手|おうて] ！', en: 'Check!', note: '王手, “king hand”: a move that attacks the king. Nobody has to say it, but friends at a bench always do.', sit: 'Your rook attacks Shige’s king. Say it!' },
    { id: 'ph.sg.tsumi', ja: '[詰|つ]み です 。', alt: ['[詰|つ]み 。'], en: 'That’s checkmate.', note: '詰み: the king is caught. A mate puzzle is a 詰将棋 (つめしょうぎ).', sit: 'His king has nowhere left to go.' },
    { id: 'ph.sg.mattanashi', ja: '[待|ま]った なし', en: 'No take-backs.', note: '待った! means “wait, let me take that back!”. In shogi it isn’t allowed: 待ったなし. People say it about life, too.', sit: 'Shige points at the board hanging over his bench. What does it say?' },
    { id: 'ph.sg.naru', ja: '[成|な]ります 。', alt: ['[成|な]る 。'], en: 'I’ll promote.', note: '成る (なる): to become. A piece that enters the far rank may turn over and become stronger.', sit: 'Your silver reaches the far rank. Tell Shige you’re promoting it.' },
    { id: 'ph.sg.douzo', ja: 'どうぞ 。', en: 'Go ahead. / Your move.', note: 'Handing something over (a turn, a seat, a cup of tea): どうぞ.', sit: 'You’ve made your move. Hand the turn to Shige.' },
    { id: 'ph.sg.naruhodo', ja: 'なるほど 。', en: 'I see! / That makes sense.', note: 'What you say when something clicks.', sit: 'Shige explains why his silver can’t step sideways. It clicks!' },
    { id: 'ph.sg.sashimashou', ja: '[将棋|しょうぎ] を [指|さ]しましょう 。', alt: ['[指|さ]しましょう 。'], en: 'Let’s play shogi.', note: 'Shogi is 指す (さす), “pointed”; go is 打つ (うつ), “struck”. A game is 一局 (いっきょく).', sit: 'You want a game with Shige. Invite him!' },
    { id: 'ph.sg.mouikkyoku', ja: 'もう [一局|いっきょく] 、 お[願|ねが]い します 。', alt: ['もう [一局|いっきょく] ！'], en: 'One more game, please.', note: '局 (きょく) counts games of shogi and go: 一局, 二局…', sit: 'The game is over, and you want another!' },
    { id: 'ph.sg.iishoubu', ja: 'いい [勝負|しょうぶ] でした 。', en: 'That was a good game.', note: '勝負 (しょうぶ): a match, a contest. A kind thing to say, win or lose.', sit: 'A close game just ended. Say something kind about it.' },
  ];
  PH.forEach(p => { p.region = R_SG; p.register = 'polite'; p.icon = 'sgSensu'; });
  const PHI = Object.fromEntries(PH.map(p => [p.id, p]));
  const ITEMS = [{ id: 'k.sgFu', kind: 'key', ja: '[歩|ふ]', en: 'Shige’s first carved pawn (boxwood, a little crooked)', icon: 'sgFu' }];

  // ================================================================ what they say (CJK.md notation). Shige: an old carpenter, few words,
  // plain speech (わし for “I”, あんた for “you”, never gendered). Tetsu: Natsu's grandpa (matsuri.js), his old rival. Natsu: 9.
  const T2 = (ja, en) => ({ ja: [ja], en: [en] });
  const LT = {
    // meeting him: he plays alone, against the empty seat
    'sg.alone': T2('… [王手|おうて] 。 … [返事|へんじ] は なし 、 か 。', '…Check. …No answer, eh.'),
    'sg.hi': T2('ん ？ [見|み]ない [顔|かお] だ な 。 わし は シゲ 。', 'Hm? A face I don’t know. I’m Shige.'),
    'sg.what': T2('これ は [将棋|しょうぎ] 。 [小|ちい]さい [盤|ばん] だろう ？ ５ [五|ご] [将棋|しょうぎ] と いう 。', 'This is shogi. A small board, eh? It’s called five-five shogi.'),
    'sg.carve': T2('[盤|ばん] も [駒|こま] も 、 わし が [彫|ほ]った 。 [昔|むかし] は [大工|だいく] だった から な 。', 'I carved the board and the pieces myself. I used to be a carpenter.'),
    'sg.seat': T2('その [席|せき] か ？ … [昔|むかし] は 、 [友|とも] が [座|すわ]って いた 。', 'That seat? …A friend used to sit there.'),
    'sg.teach': T2('[指|さ]して みる か ？ [教|おし]えて やる 。', 'Want to try a game? I’ll teach you.'),
    'sg.ok': T2('よし 。 まず は [駒|こま] の [名前|なまえ] から だ 。', 'Good. First, the pieces’ names.'),
    'sg.wait': T2('[今日|きょう] は ここ まで だ 。 また [来|こ]い 。', 'That’s all for today. Come again.'),
    // chapter 1: the pieces
    'sg.c1.a': T2('[将棋|しょうぎ] の [駒|こま] に は 、 [名前|なまえ] が [書|か]いて ある 。', 'Shogi pieces have their names written on them.'),
    'sg.c1.b': T2('[一|ひと]つ ずつ [見|み]せる 。 [名前|なまえ] を [言|い]って みろ 。', 'I’ll show you one at a time. Say each name.'),
    'sg.p.ou': T2('[王将|おうしょう] 。 [王|おう] を [取|と]られたら [負|ま]け だ 。', 'The king. Lose it and you lose the game.'),
    'sg.p.ou2': T2('[上|うえ] の [者|もの] が [王将|おうしょう] 、 [下|した] の [者|もの] が [玉将|ぎょくしょう] を [持|も]つ 。 あんた は [玉|ぎょく] だ 。', 'The senior player takes 王将, the junior 玉将. So yours is 玉.'),
    'sg.p.hi': T2('[飛車|ひしゃ] 。 まっすぐ 、 どこ まで も [飛|と]んで いく 。', 'The rook. Straight, as far as it likes.'),
    'sg.p.kaku': T2('[角行|かくぎょう] 、 [角|かく] と [呼|よ]ぶ 。 ななめ に どこ まで も 。', 'The bishop: we call it 角. Diagonally, as far as it likes.'),
    'sg.p.kin': T2('[金将|きんしょう] 、 [金|きん] だ 。 [後|うし]ろ の ななめ だけ は [行|い]けない 。', 'The gold. Only the diagonals behind are closed to it.'),
    'sg.p.gin': T2('[銀将|ぎんしょう] 、 [銀|ぎん] 。 [横|よこ] と まっすぐ [後|うし]ろ に は [行|い]けない 。', 'The silver. It can’t go sideways or straight back.'),
    'sg.p.kei': T2('[桂馬|けいま] 。 [大|おお]きい [盤|ばん] に しか いない 。 ぴょん と [跳|と]ぶ 。', 'The knight. Only on the big board. It jumps: hop!'),
    'sg.p.kyo': T2('[香車|きょうしゃ] も [大|おお]きい [盤|ばん] だけ だ 。 [前|まえ] へ まっすぐ 。 [戻|もど]れない 。', 'The lance, big board only too. Straight ahead, and it can’t come back.'),
    'sg.p.fu': T2('[歩兵|ふひょう] 、 [歩|ふ] だ 。 [一歩|いっぽ] ずつ 、 [前|まえ] へ 。', 'The pawn. One step at a time, forward.'),
    'sg.c1.which': T2('[今|いま] は 、 [動|うご]き だけ [見|み]せる 。 どの [駒|こま] だ ？', 'Now I’ll show only the moves. Which piece is it?'),
    'sg.c1.set': T2('さあ 、 [並|なら]べよう 。 ここ に は [何|なに] が [来|く]る ？', 'Now let’s set them up. What goes here?'),
    'sg.c1.end': T2('よし 。 [駒|こま] の [名前|なまえ] は もう [大丈夫|だいじょうぶ] だ 。', 'Good. You know the pieces’ names now.'),
    // chapter 2: saying moves
    'sg.c2.a': T2('[将棋|しょうぎ] で は 、 [指|さ]した [手|て] を [声|こえ] に [出|だ]して [言|い]う 。', 'In shogi, you say your moves out loud.'),
    'sg.c2.b': T2('[数字|すうじ] [二|ふた]つ と 、 [駒|こま] の [名前|なまえ] だ 。', 'Two numbers, then the piece’s name.'),
    'sg.c2.files': T2('[横|よこ] は [右|みぎ] から １ ２ ３ ４ ５ 。 [縦|たて] は [上|うえ] から [一|いち] [二|に] [三|さん] [四|よん] [五|ご] 。', 'Across, from the right: 1 2 3 4 5. Down, from the top: 一 二 三 四 五.'),
    'sg.c2.yon': T2('[四|よん] は 「 し 」 じゃ なくて 、 「 よん 」 と [読|よ]む 。', 'Read 四 as よん, not し.'),
    'sg.c2.sq': T2('この [場所|ばしょ] は ？', 'What’s this square?'),
    'sg.c2.where': T2('あんた の [玉|ぎょく] は どこ だ ？', 'Where’s your king?'),
    'sg.c2.say': T2('[今|いま] の [手|て] を [言|い]って みろ 。', 'Say the move you just made.'),
    'sg.c2.dou': T2('[同|おな]じ [場所|ばしょ] で [取|と]り[返|かえ]す とき は 、 「 [同|どう] 」 と [言|い]う 。', 'When you take back on the same square, you say 同.'),
    'sg.c2.free': T2('[次|つぎ] は [好|す]きな [手|て] を [指|さ]して 、 [言|い]って みろ 。', 'Now play any move you like, and say it.'),
    'sg.c2.end': T2('うまい 。 もう [棋譜|きふ] が [読|よ]める な 。', 'Nicely done. You can read a game record now.'),
    // chapter 3: captures, drops, promotion
    'sg.c3.a': T2('[取|と]った [駒|こま] は 、 あんた の [持|も]ち[駒|ごま] に なる 。', 'A piece you capture becomes one of your pieces in hand.'),
    'sg.c3.b': T2('これ が [将棋|しょうぎ] の いちばん おもしろい ところ だ 。 [持|も]ち[駒|ごま] は 、 [空|あ]いて いる ところ に [打|う]てる 。', 'This is the best part of shogi: you can drop a piece in hand on any empty square.'),
    'sg.c3.utsu': T2('[打|う]つ とき は 、 [最後|さいご] に 「 [打|うつ] 」 と [言|い]う 。', 'When you drop, finish with 打.'),
    'sg.c3.naru': T2('いちばん [奥|おく] の [段|だん] に [入|はい]ったら 、 [駒|こま] を [裏返|うらがえ]して 「 [成|な]る 」 。 [強|つよ]く なる 。', 'When a piece enters the far rank, you turn it over: it promotes, and it gets stronger.'),
    'sg.c3.tokin': T2('[歩|ふ] が [成|な]る と 、 と[金|きん] 。 [金|きん] と [同|おな]じ [動|うご]き だ 。', 'A pawn promotes to と金: it moves like a gold.'),
    'sg.c3.must': T2('[歩|ふ] は [奥|おく] まで [行|い]ったら 、 [必|かなら]ず [成|な]る 。 [動|うご]けなく なる から な 。', 'A pawn that reaches the end must promote, or it could never move again.'),
    'sg.c3.narazu': T2('[成|な]らない とき は 、 「 [不成|ならず] 」 と [言|い]う 。', 'If you don’t promote, say 不成.'),
    'sg.c3.nifu': T2('[同|おな]じ [列|れつ] に [自分|じぶん] の [歩|ふ] が [二|ふた]つ … それ は [二歩|にふ] 。 [反則|はんそく] だ 。', 'Two of your own pawns on one file… that’s 二歩, a foul.'),
    'sg.c3.names': T2('[成|な]った [駒|こま] に は 、 [新|あたら]しい [名前|なまえ] が ある 。', 'Promoted pieces get new names.'),
    'sg.c3.end': T2('よし 。 これ で ルール は [全部|ぜんぶ] だ 。', 'Good. Those are all the rules.'),
    // chapter 4: the sign, the friend, manners, mate puzzles
    'sg.c4.sign': T2('あの [札|ふだ] が [読|よ]める か ？', 'Can you read that board up there?'),
    'sg.c4.matta': T2('[一度|いちど] [指|さ]した [手|て] は 、 [戻|もど]せない 。 [将棋|しょうぎ] も 、 [人生|じんせい] も な 。', 'A move once played can’t be taken back. In shogi, and in life.'),
    'sg.c4.tetsu': T2('[昔|むかし] 、 テツ と いう [友|とも] が いた 。 [四十年|よんじゅうねん] 、 [毎晩|まいばん] この [縁台|えんだい] で [指|さ]した 。', 'I had a friend called Tetsu. For forty years we played on this bench, every evening.'),
    'sg.c4.night': T2('ある [晩|ばん] 、 テツ が 「 [待|ま]った ！ 」 と [言|い]った 。 わし は 「 [待|ま]った なし だ 」 と [言|い]った 。', 'One evening Tetsu said, «Wait! Let me take it back!» I said, «No take-backs.»'),
    'sg.c4.since': T2('それ から 、 [一度|いちど] も [話|はな]して いない 。', 'We haven’t spoken since.'),
    'sg.c4.rei': T2('[将棋|しょうぎ] は 、 [礼|れい] に [始|はじ]まり 、 [礼|れい] に [終|お]わる 。', 'Shogi begins with a bow and ends with a bow.'),
    'sg.c4.tsume': T2('[詰将棋|つめしょうぎ] を やろう 。 [王手|おうて] 、 [王手|おうて] で [王|おう] を [詰|つ]ませる パズル だ 。', 'Let’s do mate puzzles: check after check until the king is caught.'),
    'sg.c4.one': T2('[一手|いって] で [詰|つ]む 。 さあ 、 [言|い]って みろ 。', 'Mate in one. Go on, say it.'),
    'sg.c4.three': T2('[今度|こんど] は [三手|さんて] だ 。 わし が [逃|に]げる 。', 'Now, mate in three. I’ll run.'),
    'sg.c4.mate': T2('[詰|つ]み だ 。 [見事|みごと] 。', 'Mate. Splendid.'),
    'sg.c4.end': T2('[次|つぎ] は [本番|ほんばん] だ 。 わし と [一局|いっきょく] 。 [夕方|ゆうがた] に [来|こ]い 。', 'Next, the real thing: a game with me. Come in the evening.'),
    // chapter 5: the game
    'sg.c5.a': T2('[来|き]た か 。 [座|すわ]れ 。', 'You came. Sit.'),
    'sg.c5.koma': T2('[駒落|こまお]ち に する か ？ わし が [駒|こま] を [減|へ]らして やる 。', 'Shall I play with a handicap? I’ll take some of my pieces off.'),
    'sg.c5.bow': T2('お[願|ねが]い します 。', 'Onegai shimasu. (Let’s have a good game.)'),
    'sg.c5.hush1': T2('…', '…'),
    'sg.c5.back': T2('… [声|こえ] が [聞|き]こえた 。 ありがとう 。', '…I heard your voice. Thank you.'),
    'sg.c5.seat': T2('あの [席|せき] に 、 [静|しず]けさ が [座|すわ]って いた 。', 'The silence was sitting in that seat.'),
    'sg.c5.since': T2('テツ が [来|こ]なく なって から 、 ずっと だ 。 [一人|ひとり] で [指|さ]す [将棋|しょうぎ] は 、 [音|おと] が しない 。', 'Ever since Tetsu stopped coming. Shogi played alone makes no sound.'),
    'sg.c5.why': T2('わし が [指|さ]す の は 、 [勝|か]つ ため じゃ ない 。 [誰|だれ] か と [向|む]き[合|あ]う ため だ 。', 'I don’t play to win. I play to sit across from someone.'),
    'sg.c5.go': T2('さあ 、 [続|つづ]き だ 。', 'Now. Let’s carry on.'),
    'sg.c5.lost': T2('… [参|まい]りました 。', '…I resign.'),
    'sg.c5.won': T2('ここ まで だ な 。 いい [将棋|しょうぎ] だった 。', 'That’s the end of it. That was good shogi.'),
    'sg.c5.draw': T2('[千日手|せんにちて] だ 。 [引|ひ]き[分|わ]け 。', 'The same position over and over: a draw.'),
    'sg.c5.thanks': T2('ありがとう ございました 。', 'Thank you for the game.'),
    'sg.c5.natsu': T2('シゲ じいちゃん ！ おじいちゃん 、 [連|つ]れて きた よ ！', 'Grandpa Shige! I brought my grandpa!'),
    'sg.c5.tetsu1': T2('… シゲ 。 [久|ひさ]しぶり だ な 。', '…Shige. It’s been a long time.'),
    'sg.c5.shige1': T2('テツ …', 'Tetsu…'),
    'sg.c5.tetsu2': T2('あの [晩|ばん] は 、 [待|ま]った なんて [言|い]って 、 すまなかった 。', 'That evening… saying «wait» like that. I’m sorry.'),
    'sg.c5.shige2': T2('いや 。 わし も [意地|いじ] を [張|は]った 。 すまん 。', 'No. I was stubborn too. I’m sorry.'),
    'sg.c5.tetsu3': T2('[一局|いっきょく] 、 どう だ ？', 'One game, how about it?'),
    'sg.c5.shige3': T2('… お[願|ねが]い します 。', '…Onegai shimasu.'),
    'sg.c5.yay': T2('やった ！ なかなおり ！', 'Yay! You two made up!'),
    'sg.c5.gift': T2('あんた の おかげ だ 。 これ を {mimo} に 。 わし の [扇子|せんす] だ 。 「 [一歩|いっぽ] 」 と [書|か]いて ある 。', 'This is thanks to you. This is for {mimo}: my fan. It says «one step».'),
    'sg.c5.fu': T2('それ と 、 これ 。 わし が [初|はじ]めて [彫|ほ]った [歩|ふ] だ 。', 'And this. The first pawn I ever carved.'),
    'sg.c5.bye': T2('[一歩|いっぽ] ずつ だ 。 また [指|さ]そう 。', 'One step at a time. Let’s play again.'),
    // the game's chatter
    'sg.chat1': T2('[駒|こま] は [黄楊|つげ] の [木|き] で [彫|ほ]る 。 [固|かた]くて 、 いい [音|おと] が する 。', 'I carve the pieces from boxwood. It’s hard, and it makes a good sound.'),
    'sg.chat2': T2('[夏|なつ] の [夜|よる] は 、 [蚊取|かと]り[線香|せんこう] と [麦茶|むぎちゃ] と [将棋|しょうぎ] だ 。', 'Summer nights mean a mosquito coil, barley tea and shogi.'),
    'sg.chat3': T2('[負|ま]けて も いい 。 [参|まい]りました と [言|い]える [者|もの] は 、 [強|つよ]く なる 。', 'Losing is fine. Whoever can say «I resign» gets stronger.'),
    'sg.chat4': T2('テツ の やつ 、 [太鼓|たいこ] は うまい が 、 [将棋|しょうぎ] は まだまだ だ 。', 'That Tetsu: great on the drum, but his shogi has a long way to go.'),
    'sg.chat5': T2('[一歩|いっぽ] ずつ だ 。 [将棋|しょうぎ] も 、 [言葉|ことば] も な 。', 'One step at a time. In shogi, and in words.'),
  };
  // his short replies, in the panel: [notation, English]
  const SAY = {
    praise: [['うむ 。', 'Mm.'], ['いい ぞ 。', 'Good.'], ['そう だ 。', 'That’s it.'], ['[見事|みごと] 。', 'Splendid.']],
    again: [['ちがう な 。 もう [一度|いちど] 。', 'Not that. Again.'], ['おしい 。', 'Close.']],
    yourCap: [['ほう 。', 'Oh?'], ['やる な 。', 'Not bad.'], ['む … [痛|いた]い 。', 'Hm… that hurts.']],
    hisCap: [['いただき 。', 'I’ll take that.'], ['[甘|あま]い 。', 'Careless.'], ['[取|と]った 。', 'Got it.']],
    check: [['[王手|おうて] 。', 'Check.']],
    move: [['ふむ …', 'Hmm…'], ['そう [来|く]る か 。', 'So that’s your move.'], ['なるほど 。', 'I see.'], ['では 、 こう だ 。', 'Then, like this.']],
    good: [['いい [手|て] だ 。', 'A good move.']],
  };
  const lineOf = key => { const v = LT[key]; return v ? { ja: v.ja[0], en: v.en[0] } : { ja: '', en: key }; };

  // ================================================================ icons (the journal, the panels)
  function registerIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const has = k => ICONS.keys && ICONS.keys.includes(k), add = (k, fn) => { if (!has(k)) ICONS.add(k, fn); };
    const piece = (h, c, p, col) => h.shape(c, p, h.poly([[0, -36], [22, -24], [28, 32], [-28, 32], [-22, -24]]), col || '#f2d59b');
    add('sgShige', (c, p, h) => {        // Shige: bald, a white fringe, thin white brows, a calm smile; the closed fan by his cheek
      h.shape(c, p, h.ell(0, 6, 25, 28), '#e8b48a');
      h.shape(c, p, cc => { cc.moveTo(-26, 4); cc.quadraticCurveTo(-30, -14, -20, -18); cc.lineTo(-18, 6); cc.closePath(); }, '#ece8e0');
      h.shape(c, p, cc => { cc.moveTo(26, 4); cc.quadraticCurveTo(30, -14, 20, -18); cc.lineTo(18, 6); cc.closePath(); }, '#ece8e0');
      h.shape(c, p, h.rr(24, -30, 7, 44, 3), '#3a5a8a');
      if (!p) return;
      c.beginPath(); c.moveTo(-14, -2); c.lineTo(-4, -4); c.moveTo(14, -2); c.lineTo(4, -4); c.lineWidth = 2.4; c.strokeStyle = '#d8d4cc'; c.stroke();
      c.beginPath(); c.arc(-9, 5, 3.5, Math.PI * 1.1, Math.PI * 1.9, true); c.moveTo(12, 5); c.arc(9, 5, 3.5, 0.1, Math.PI * 0.9, true); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke();
      c.beginPath(); c.arc(0, 14, 6, 0.25, Math.PI - 0.25); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke();
      [[-12, 22], [12, 22]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x - 3, y - 2); c.lineTo(x + 3, y); c.lineWidth = 1.2; c.strokeStyle = '#c9a08a'; c.stroke(); });
    });
    add('sgFu', (c, p, h) => {           // a carved pawn: 歩 in black on boxwood
      piece(h, c, p);
      if (p) { c.font = `900 34px ${BRUSH}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = h.INK; c.fillText('歩', 0, 4); }
    });
    add('sgSensu', (c, p, h) => {        // the folding fan, open: white paper on bamboo ribs, «一歩» and a red seal
      h.shape(c, p, cc => { cc.moveTo(0, 30); cc.arc(0, 30, 50, Math.PI * 1.18, Math.PI * 1.82); cc.closePath(); }, '#fffaf0');
      if (!p) return;
      for (let i = 0; i <= 8; i++) { const a = Math.PI * (1.18 + 0.64 * i / 8); c.beginPath(); c.moveTo(0, 30); c.lineTo(Math.cos(a) * 18, 30 + Math.sin(a) * 18); c.lineWidth = 2; c.strokeStyle = '#a8784e'; c.stroke(); c.beginPath(); c.moveTo(Math.cos(a) * 18, 30 + Math.sin(a) * 18); c.lineTo(Math.cos(a) * 50, 30 + Math.sin(a) * 50); c.lineWidth = 0.8; c.strokeStyle = 'rgba(43,34,53,0.18)'; c.stroke(); }
      c.font = `900 15px ${BRUSH}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = h.INK; c.fillText('一', -6, -6); c.fillText('歩', -6, 9);
      c.fillStyle = '#d6332a'; c.fillRect(8, 6, 7, 7);
    });
    add('sgBoard', (c, p, h) => {        // the little board: 5×5, two pieces
      h.shape(c, p, h.rr(-34, -30, 68, 60, 4), '#e9c27a');
      if (!p) return;
      c.lineWidth = 1; c.strokeStyle = 'rgba(43,34,53,0.55)'; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-34 + i * 13.6, -30); c.lineTo(-34 + i * 13.6, 30); c.moveTo(-34, -30 + i * 12); c.lineTo(34, -30 + i * 12); c.stroke(); }
      h.shape(c, 1, h.poly([[-7, 6], [-1, 3], [-1, 14], [-13, 14], [-13, 3]]), '#f6e2b5', 1.2); h.shape(c, 1, h.poly([[13, -18], [7, -15], [7, -26], [19, -26], [19, -15]]), '#f6e2b5', 1.2);
    });
  }

  // ================================================================ places (plain data): the bench at the game corner
  // The bench runs east–west across the corner; Shige sits on its west end facing east, the other seat is the east end.
  const SITE = { x: -47.6, z: -162.6 };
  const BENCH = { len: 2.3, wid: 0.78, h: 0.42 };
  const SEAT = { sg: { x: SITE.x - 0.86, z: SITE.z, yaw: Math.PI / 2 }, rv: { x: SITE.x + 0.86, z: SITE.z, yaw: -Math.PI / 2 } };
  const SPOT = { post: { x: SITE.x - 1.6, z: SITE.z - 0.66 }, pig: { x: SITE.x - 1.25, z: SITE.z + 0.66 }, you: { x: SITE.x + 0.5, z: SITE.z + 1.4 },
    natsu: { x: SITE.x + 2.45, z: SITE.z + 0.8 }, tetsu: { x: SITE.x + 1.8, z: SITE.z + 0.15 } };
  const NAMES = { sg: 'シゲ さん', gp: 'テツ さん', kid: 'ナツ' };
  const SHIGE_LOOK = { skin: '#e2b088', hair: '#e6b68e', shirt: '#7d9cba', sleeve: '#7d9cba', pants: '#6f8ba6', shoes: '#b58a5a', old: true, brow: '#f4f2ee', collar: '#5d7c9a', wide: 0.94 };
  const TETSU_LOOK = { skin: '#e8b48a', hair: '#e8e4dc', shirt: '#fbfbf6', sleeve: '#2f3f7a', vest: '#2f3f7a', pants: '#2b2235', shoes: '#3a2b26', old: true, wide: 1.1, brow: '#d8d4cc' };
  const HUSH_LOOK = { skin: '#9a9fae', hair: '#6b7080', shirt: '#7a7f8e', pants: '#6b7080', shoes: '#5a5f6b' };
  const sstep = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

  // ================================================================ 3D: the bench, the board, the lantern, the pig, the people
  const K = () => ZHF.Kit();
  const tex = (w, h, draw) => ZHF.canvasTex(w, h, c => draw(c, w, h));
  // a shogi piece's pentagon (pointing up), centered on (x, y), w × h
  function penta(c, x, y, w, h) { c.beginPath(); c.moveTo(x, y - h * 0.5); c.lineTo(x + w * 0.38, y - h * 0.3); c.lineTo(x + w * 0.5, y + h * 0.5); c.lineTo(x - w * 0.5, y + h * 0.5); c.lineTo(x - w * 0.38, y - h * 0.3); c.closePath(); }
  // one piece, drawn on a canvas: code (1–14), side (0 yours: points up; 1 his: turned round); o: { gray, blank, read, alpha }
  function drawPiece(c, x, y, s, code, side, o = {}) {
    c.save(); c.translate(x, y); if (side === 1) c.rotate(Math.PI);
    const w = s * 0.8, h = s * 0.9;
    penta(c, 0, 0, w, h);
    const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, o.gray ? '#c9c6c0' : '#f8e4b0'); g.addColorStop(1, o.gray ? '#a9a6a0' : '#e6c27a');
    c.fillStyle = g; c.fill(); c.lineWidth = Math.max(1.5, s * 0.035); c.strokeStyle = '#2b2235'; c.stroke();
    if (!o.blank && code) {
      const red = code > 8 && !o.ch, two = code === 11 && !o.ch, ch = o.ch || pChar(code, side), a = o.alpha === undefined ? 1 : o.alpha, sayK = o.say || pSay(code, side);
      c.globalAlpha = a; c.fillStyle = red ? '#c8322a' : '#1d1418'; c.textAlign = 'center'; c.textBaseline = 'middle';
      const read = o.read && !two ? (cmode() === 'roman' ? JR(sayK).toLowerCase() : sayK) : '';
      if (two) { c.font = `900 ${Math.round(s * 0.3)}px ${BRUSH}`; c.fillText('成', 0, -s * 0.13); c.fillText('銀', 0, s * 0.2); }
      else { c.font = `900 ${Math.round(s * (read ? 0.44 : 0.5))}px ${BRUSH}`; c.fillText(ch, 0, read ? -s * 0.03 : s * 0.05); }
      if (read) { c.font = `700 ${Math.round(s * 0.15)}px ${cmode() === 'roman' ? '"Segoe UI", sans-serif' : FONT}`; c.fillStyle = red ? '#a8322a' : '#4a3a2a'; c.fillText(read, 0, s * 0.31); }
      c.globalAlpha = 1;
    } else if (o.blank) { c.font = `900 ${Math.round(s * 0.4)}px ${FONT}`; c.fillStyle = 'rgba(43,34,53,.45)'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('？', 0, s * 0.05); }
    c.restore();
  }
  // the 3D board's top: the grid and the pieces as they stand (redrawn when the position changes)
  const BT = { tex: null, key: '' };
  function boardTop(p) {
    if (!BT.tex) BT.tex = tex(320, 320, () => {});
    const k = p ? E.key(p) : 'empty'; if (k === BT.key) return BT.tex; BT.key = k;
    const cv = BT.tex.image, c = cv.getContext('2d'), W = 320, m = 16, cell = (W - 2 * m) / 5;
    c.fillStyle = '#ecc77e'; c.fillRect(0, 0, W, W);
    for (let i = 0; i < 9; i++) { c.strokeStyle = 'rgba(160,110,50,.18)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 20 + i * 36 + Math.sin(i) * 6); c.bezierCurveTo(100, 10 + i * 36, 220, 30 + i * 36, W, 18 + i * 36); c.stroke(); }
    c.strokeStyle = '#2b2235'; c.lineWidth = 2; for (let i = 0; i <= 5; i++) { c.beginPath(); c.moveTo(m + i * cell, m); c.lineTo(m + i * cell, W - m); c.moveTo(m, m + i * cell); c.lineTo(W - m, m + i * cell); c.stroke(); }
    if (p) for (let i = 0; i < 25; i++) { const v = p.b[i]; if (v) drawPiece(c, m + (E.col(i) + 0.5) * cell, m + (E.row(i) + 0.5) * cell, cell * 0.92, Math.abs(v), E.owner(v)); }
    BT.tex.needsUpdate = true; return BT.tex;
  }
  // the folding fan (扇子): Shige's, «一歩» on white paper (his hand, and {mimo}'s gift)
  let FANT = null;
  const fanTex = () => FANT || (FANT = tex(256, 160, (c, W, H) => {
    const cx = W / 2, cy = H - 8, R = 146, r0 = 40, a0 = Math.PI * 1.08, a1 = Math.PI * 1.92;
    c.clearRect(0, 0, W, H);
    c.beginPath(); c.arc(cx, cy, R, a0, a1); c.arc(cx, cy, r0, a1, a0, true); c.closePath(); c.fillStyle = '#fffaf0'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#2b2235'; c.stroke();
    for (let i = 1; i < 12; i++) { const a = a0 + (a1 - a0) * i / 12; c.beginPath(); c.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); c.lineWidth = 1.5; c.strokeStyle = 'rgba(43,34,53,.22)'; c.stroke(); }
    c.beginPath(); for (let i = 0; i <= 12; i++) { const a = a0 + (a1 - a0) * i / 12; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); } c.lineWidth = 5; c.strokeStyle = '#a8784e'; c.stroke();
    c.font = `900 50px ${BRUSH}`; c.fillStyle = '#1d1418'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('一歩', cx - 6, cy - 90);
    c.fillStyle = '#d6332a'; c.fillRect(cx + 50, cy - 74, 15, 15);
  }));
  // an open fan whose rivet sits at the group's origin, opening upward (local +y), w wide
  function openFan(w) { const g = new THREE.Group(), h = w * 0.625, m = ZHF.plane(w, h, fanTex(), { alpha: true, double: true }); m.position.y = h / 2 - w * 0.02; m.castShadow = false; g.add(m); return g; }
  // the 待ったなし board on the lantern post
  const plaqueTex = () => tex(256, 96, (c, W, H) => {
    c.fillStyle = '#c9a26a'; c.fillRect(0, 0, W, H); c.strokeStyle = '#7a5236'; c.lineWidth = 8; c.strokeRect(4, 4, W - 8, H - 8);
    for (let i = 0; i < 5; i++) { c.strokeStyle = 'rgba(122,82,54,.25)'; c.lineWidth = 2; c.beginPath(); c.moveTo(10, 20 + i * 15); c.lineTo(W - 10, 16 + i * 16); c.stroke(); }
    let px = 58; c.font = `900 ${px}px ${BRUSH}`; while (c.measureText('待ったなし').width > W - 40 && px > 20) { px -= 2; c.font = `900 ${px}px ${BRUSH}`; }
    c.fillStyle = '#1d1418'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('待ったなし', W / 2, H / 2 + 3);
  });
  function towel(p, col = '#fffaf2', stripe = '#d6332a') {           // (Tetsu's twisted towel headband, as in matsuri.js)
    const k = K(), r = 0.25;
    k.add(ZHF.GEO.tor, col, 0, 0.09, 0, r * 1.05, r * 1.05, 0.7, Math.PI / 2, 0, 0, { ink: 0.006 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; k.box(Math.sin(a) * r * 1.05, 0.09, Math.cos(a) * r * 1.05, 0.03, 0.05, 0.02, stripe, { ry: a, rz: 0.6, ink: 0 }); }
    k.ball(0.06, 0.13, -r * 0.98, 0.05, 0.035, 0.03, col, { ink: 0.006 });
    const g = new THREE.Group(); ZHF.bake(g, k); p.head.add(g); return g;
  }
  function makeShige() {
    const p = ZHF.person(SHIGE_LOOK, { sit: true, seatY: 0.07 });
    const k = K(), hy = p.hipY, th = 0.62, ind = '#4a6a8a';         // his jinbei (甚平): the crossed collar, the ties
    k.rod([-0.13, hy + th * 0.98, 0.17], [0.05, hy + th * 0.42, 0.262], 0.022, ind, { ink: 0 }).rod([0.13, hy + th * 0.98, 0.17], [-0.03, hy + th * 0.5, 0.26], 0.022, ind, { ink: 0 });
    k.box(0.1, hy + th * 0.58, 0.262, 0.07, 0.016, 0.01, ind, { ink: 0 }).box(0.13, hy + th * 0.55, 0.262, 0.016, 0.06, 0.01, ind, { ink: 0 });
    const g = new THREE.Group(); ZHF.bake(g, k); p.body.add(g);
    // a bald crown, two white tufts over the ears, bushy white brows
    const kh = K(); for (const s of [-1, 1]) kh.ball(s * 0.235, 0.0, -0.06, 0.06, 0.08, 0.1, '#ece8e0', { ink: 0.008 }).box(s * 0.09, 0.09, 0.235, 0.085, 0.03, 0.02, '#f4f2ee', { rz: s * -0.2, ink: 0 });
    const gh = new THREE.Group(); ZHF.bake(gh, kh); p.head.add(gh);
    // the fan in his hand: closed (a slim stick), or open (fanning himself)
    const hand = p.arms[1].userData.hand, kf = K(); kf.box(0, -0.1, 0.02, 0.028, 0.24, 0.04, '#3a5a8a', { ink: 0.004 });
    p.fanShut = new THREE.Group(); ZHF.bake(p.fanShut, kf); hand.add(p.fanShut);
    p.fanOpen = openFan(0.36); p.fanOpen.position.set(0, -0.02, 0.04); p.fanOpen.rotation.set(0.3, 0, 0); p.fanOpen.visible = false; hand.add(p.fanOpen);
    p.id = 'sg'; p.nameSrc = NAMES.sg; p.story = true; p.noTurn = true; p.pose = 'cards';
    return p;
  }
  function makeTetsu(sit) {
    const p = ZHF.person(TETSU_LOOK, sit ? { sit: true, seatY: 0.07 } : {}); towel(p);
    p.id = 'gp'; p.nameSrc = NAMES.gp; p.story = true; p.noTurn = !!sit; if (sit) p.pose = 'cards'; return p;
  }
  // the Hush in the empty seat: a gray, see-through sitter
  function makeHush() {
    const p = ZHF.person(HUSH_LOOK, { sit: true, seatY: 0.07 });
    p.root.traverse(o => { if (o.isMesh && o.material) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = 0.32; o.material.depthWrite = false; o.castShadow = false; } });
    p.pose = 'sulk'; p.noTurn = true; return p;
  }
  let B = null;
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    const root = new THREE.Group(); root.name = 'shogi'; root.visible = false; scene.add(root);
    const colliders = [], solid = c => { c.x0 = c.x; c.z0 = c.z; colliders.push(c); return c; };
    const T = SITE, ty = gy(T.x, T.z), top = ty + BENCH.h, k = K(), wood = '#a07a4e', slat = '#c49a62';
    // the bench (縁台): five slats on two rails, four legs and two stretchers
    for (let i = 0; i < 5; i++) k.box(T.x, top - 0.02, T.z - 0.32 + i * 0.16, BENCH.len, 0.04, 0.14, slat, { ink: 0.006 });
    for (const s of [-1, 1]) k.box(T.x, top - 0.07, T.z + s * 0.28, BENCH.len - 0.12, 0.06, 0.05, wood, { ink: 0.006 });
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const x = T.x + a * (BENCH.len / 2 - 0.14), z = T.z + b * 0.28, g0 = gy(x, z) - 0.05; k.box(x, (g0 + top - 0.04) / 2, z, 0.07, top - 0.04 - g0, 0.07, wood, { ink: 0.008 }); }
    for (const a of [-1, 1]) k.box(T.x + a * (BENCH.len / 2 - 0.14), ty + 0.12, T.z, 0.05, 0.05, 0.56, wood, { ink: 0.005 });
    // the cushions (座布団): Shige's indigo; the other seat's faded red one, always set out
    k.box(SEAT.sg.x, top + 0.025, SEAT.sg.z, 0.5, 0.05, 0.5, '#3f4f8a', { ink: 0.008 });
    k.box(SEAT.rv.x, top + 0.025, SEAT.rv.z, 0.5, 0.05, 0.5, '#b0584f', { ink: 0.008 });
    // the board (盤): thick wood on four stubby legs; its top is a canvas (the pieces as they stand); the piece stands
    const BH = 0.12, bTop = top + 0.06 + BH;
    k.box(T.x, top + 0.06 + BH / 2, T.z, 0.42, BH, 0.42, '#d9ac62', { ink: 0.01 });
    for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) k.box(T.x + a * 0.15, top + 0.03, T.z + b * 0.15, 0.06, 0.06, 0.06, '#b8904a', { ink: 0.004 });
    for (const s of [-1, 1]) k.box(T.x + s * 0.36, top + 0.07, T.z - s * 0.26, 0.15, 0.03, 0.15, '#c49a52', { ink: 0.004 }).box(T.x + s * 0.36, top + 0.03, T.z - s * 0.26, 0.04, 0.05, 0.04, wood, { ink: 0 });
    // barley tea (麦茶) in a glass and a kettle (やかん), by Shige
    k.cyl(T.x - 0.56, top + 0.06, T.z - 0.27, 0.035, 0.11, '#c98a3a', { ink: 0.004 }).cyl(T.x - 0.56, top + 0.117, T.z - 0.27, 0.036, 0.006, '#fff4dc', { ink: 0 });
    k.cyl(T.x - 0.5, top + 0.065, T.z + 0.3, 0.085, 0.11, '#c9c9c1', { ink: 0.006 }).ball(T.x - 0.5, top + 0.12, T.z + 0.3, 0.07, 0.04, 0.07, '#c9c9c1', { ink: 0.005 }).ball(T.x - 0.5, top + 0.165, T.z + 0.3, 0.018, 0.015, 0.018, '#2b2235', { ink: 0 })
      .rod([T.x - 0.43, top + 0.06, T.z + 0.3], [T.x - 0.36, top + 0.13, T.z + 0.3], 0.014, '#c9c9c1', { ink: 0.004 }).add(ZHF.GEO.tor, '#5a5f6b', T.x - 0.5, top + 0.15, T.z + 0.3, 0.075, 0.075, 0.12, 0, Math.PI / 2, 0, { ink: 0 });
    // the lantern post, its arm, and the 待ったなし board under the arm
    const P = SPOT.post, py = gy(P.x, P.z), L0 = { x: P.x + 0.42, y: py + 1.78, z: P.z + 0.16 };
    k.rod([P.x, py - 0.05, P.z], [P.x, py + 2.25, P.z], 0.045, wood, { ink: 0.01 }).rod([P.x, py + 2.12, P.z], [L0.x + 0.03, py + 2.12, L0.z + 0.01], 0.024, wood).rod([L0.x, py + 2.12, L0.z], [L0.x, L0.y + 0.24, L0.z], 0.006, '#2b2235', { ink: 0 });
    ZHF.bake(root, k);
    const board = ZHF.plane(0.4, 0.4, boardTop(E.start())); board.position.set(T.x, bTop + 0.003, T.z); board.rotation.set(-Math.PI / 2, Math.PI / 2, 0, 'YXZ'); root.add(board);
    const plaque = ZHF.plane(0.5, 0.19, plaqueTex(), { double: true }); plaque.position.set(P.x + 0.05, py + 1.45, P.z + 0.06); plaque.rotation.y = 0.55; root.add(plaque);
    // the paper lantern: plain by day; lit (glowing) for the evening game and after
    const lantern = new THREE.Group(), kd = K(), kl = K();
    for (const kk of [kd, kl]) { kk.add(ZHF.GEO.cyl, '#2b2235', L0.x, L0.y + 0.21, L0.z, 0.08, 0.05, 0.08, 0, 0, 0, { ink: 0 }).add(ZHF.GEO.cyl, '#2b2235', L0.x, L0.y - 0.21, L0.z, 0.08, 0.04, 0.08, 0, 0, 0, { ink: 0 }); }
    kd.add(ZHF.GEO.ball, '#f4ead2', L0.x, L0.y, L0.z, 0.16, 0.21, 0.16, 0, 0, 0, { ink: 0.008 });
    kl.add(ZHF.GEO.ball, '#ffe6a8', L0.x, L0.y, L0.z, 0.16, 0.21, 0.16, 0, 0, 0, { glow: true });
    const day = new THREE.Group(), lit = new THREE.Group(); ZHF.bake(day, kd); ZHF.bake(lit, kl); lit.visible = false; lantern.add(day, lit); root.add(lantern);
    // the mosquito-coil pig (蚊遣り豚): terracotta, its open snout toward the bench, a curl of smoke
    const G0 = SPOT.pig, pgy = gy(G0.x, G0.z), pigYaw = Math.atan2(T.x - G0.x, T.z - G0.z) + 0.5, kp = K();
    kp.frame(G0.x, pgy, G0.z, pigYaw).ball(0, 0.15, 0, 0.13, 0.115, 0.16, '#c7744a', { ink: 0.01 }).cyl(0, 0.15, 0.165, 0.085, 0.06, '#c7744a', { rx: Math.PI / 2, ink: 0.006 })
      .cyl(0, 0.15, 0.197, 0.066, 0.008, '#2b2235', { rx: Math.PI / 2, ink: 0 });
    for (const s of [-1, 1]) { kp.cone(s * 0.075, 0.255, 0.08, 0.035, 0.07, '#c7744a', { rx: 0.5, ink: 0.004 }); for (const z of [-0.09, 0.08]) kp.cyl(s * 0.07, 0.035, z, 0.03, 0.07, '#b8663e', { ink: 0.004 }); kp.ball(s * 0.05, 0.19, 0.13, 0.012, 0.012, 0.01, '#2b2235', { ink: 0 }); }
    kp.free(); const pig = new THREE.Group(); ZHF.bake(pig, kp); root.add(pig);
    const smoke = []; for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(ZHF.GEO.ball, new THREE.MeshBasicMaterial({ color: '#d8d8dc', transparent: true, opacity: 0.4, depthWrite: false })); m.scale.setScalar(0.03); root.add(m); smoke.push({ m, t: i / 5 }); }
    const mouth = { x: G0.x + Math.sin(pigYaw) * 0.2, y: pgy + 0.17, z: G0.z + Math.cos(pigYaw) * 0.2 };
    solid({ obox: 1, x: T.x, z: T.z, hw: BENCH.len / 2 + 0.05, hd: BENCH.wid / 2, rot: 0 }); solid({ x: P.x, z: P.z, r: 0.16 }); solid({ x: G0.x, z: G0.z, r: 0.2 });
    // the people: Shige on his cushion; Tetsu across from him (after chapter 5); the Hush (chapter 5's evening)
    const people = [], seatY = top + 0.05;
    const sg = makeShige(); Object.assign(sg, { x: SEAT.sg.x, z: SEAT.sg.z, y: seatY }); sg.yaw = sg.baseYaw = SEAT.sg.yaw; root.add(sg.root); people.push(sg);
    const tt = makeTetsu(true); Object.assign(tt, { x: SEAT.rv.x, z: SEAT.rv.z, y: seatY }); tt.yaw = tt.baseYaw = SEAT.rv.yaw; tt.root.visible = false; tt.hidden = true; root.add(tt.root);
    const hush = makeHush(); Object.assign(hush, { x: SEAT.rv.x, z: SEAT.rv.z, y: seatY }); hush.yaw = hush.baseYaw = SEAT.rv.yaw; hush.root.visible = false; hush.hidden = true; root.add(hush.root);
    B = { root, colliders, people, sg, tt, hush, board, lantern: { day, lit }, smoke, mouth, gy, ty, top, bTop, seatY, game: E.start(), extra: [] };
    return { colliders, group: root, people, update };
  }

  // ---------------- {mimo}'s fan (扇子): open, tucked behind its right ear and fanning out beside its head (the fox mask, if
  // worn, sits on its left)
  let FAN = null;
  const fanOn = () => !!(G && isOn() && G.state.sg && G.state.sg.fan && G.state.sg.fanOn);
  function wearables() {
    if (!G || !G.cast || !G.cast.mimo || !G.cast.mimo.body) return;
    if (!FAN && G.state.sg && G.state.sg.fan) { FAN = openFan(0.3); FAN.position.set(-0.29, 0.39, 0.0); FAN.rotation.set(-0.1, -0.3, 0.75, 'YXZ'); FAN.visible = false; G.cast.mimo.body.add(FAN); }
    if (FAN) FAN.visible = fanOn() && !(G.sim && G.sim.mimo && G.sim.mimo.hidden);
  }

  // ================================================================ every frame
  const IDLE = { t: 3, fan: 0, slam: 0, who: 0, over: 0 };
  function update(dt, t, you) {
    if (!B) return;
    const on = shown() && !(G.indoors && G.indoors()), Y = G.sim.you, d = Math.hypot(Y.x - SITE.x, Y.z - SITE.z), near = on && d < 150;
    B.root.visible = near;
    for (const c of B.colliders) { c.x = c.x0 + (on ? 0 : 1e5); c.z = c.z0; }
    B.sg.hidden = !on;
    const st = on ? S() : null, friends = !!(st && st.ch[5]);
    if (!SC.on) { B.tt.root.visible = friends; B.tt.hidden = !on || !friends; }
    wearables();
    if (on) ZHF.music.want('sg', 'ja_shogi', PB.open ? 0.3 : 0.24 * (1 - sstep(5, 16, d)), { cut: PB.open ? 15000 : 3000, duck: PB.open ? 0.15 : undefined });
    else ZHF.music.want('sg', null, 0);
    ZHF.music.frame(t);
    if (!near) return;
    const lit = SC.lit || friends;
    B.lantern.lit.visible = lit; B.lantern.day.visible = !lit;
    // the pig's smoke: a curl that rises, drifts and fades
    for (const s of B.smoke) { s.t = (s.t + dt * 0.22) % 1; const u = s.t; s.m.position.set(B.mouth.x + Math.sin(u * 7 + t * 0.6) * 0.05 * u, B.mouth.y + u * 0.55, B.mouth.z + u * 0.12); s.m.scale.setScalar(0.025 + u * 0.05); s.m.material.opacity = 0.42 * (1 - u); }
    // Shige (and, after chapter 5, Tetsu) at the bench: a game goes on by itself; now and then he fans himself
    const scene = typeof STORY !== 'undefined' && STORY.busy, sg = B.sg;
    if (!scene && !PB.open && !SC.on) {
      if ((IDLE.t -= dt) <= 0) {
        IDLE.t = 5 + Math.random() * 4;
        if (IDLE.over > 0) { B.game = E.start(); IDLE.over = 0; IDLE.who = 0; }
        else if (Math.random() < 0.3 && !IDLE.fan) { IDLE.fan = 2.6; }
        else {
          const g = B.game, m = E.bestMove(g, { depth: 1, noise: 90, max: 4000 });
          if (!m || g.ply > 70) IDLE.over = 1;
          else {
            E.play(g, m); boardTop(g);
            const who = friends && g.turn === 0 ? B.tt : sg; who.pose = 'slam'; who.slamT = 0.45; (who === sg ? B.tt : sg).nod = 0.4;
            if (d < 12) sfx('wood');
            if (E.status(g).over) IDLE.over = 1;
          }
        }
      }
    }
    if (IDLE.fan > 0 && !SC.on) { IDLE.fan -= dt; sg.pose = 'think'; sg.fanOpen.visible = true; sg.fanShut.visible = false; if (IDLE.fan <= 0) sg.pose = 'cards'; }
    else if (!SC.fan) { sg.fanOpen.visible = false; sg.fanShut.visible = true; if (sg.pose === 'think' && !SC.on) sg.pose = 'cards'; }
    else { sg.fanOpen.visible = true; sg.fanShut.visible = false; }
    for (const p of [sg, B.tt, B.hush]) { if (p.pose === 'slam' && !(p.slamT > 0)) p.pose = 'cards'; if (p.root.visible) ZHF.animate(p, dt, t, you); }
    if (sg.fanOpen.visible && sg.pose === 'think') sg.arms[1].rotation.z += Math.sin(t * 9) * 0.22;      // (fanning himself)
    for (const p of B.extra) if (p.root.visible) ZHF.animate(p, dt, t, null);
  }

  // ================================================================ typed answers (CJK.typed / wordOf / matchAt, as LEX.heard does)
  function findWord(U, src, p = 0) {
    const w = CJK.wordOf(src, 'ja'); if (!w.segs || !w.segs.length) return null;
    for (let i = p; i < U.length; i++) { const m = CJK.matchAt(w, U, i, 'ja'); if (m) return { i, j: m.j, short: !!m.short }; }
    return null;
  }
  const PUNCT = /^[「」『』。、！？…・〜ー\-—,.!?～]+$/;
  const SOFT = /^(を|は|が|ね|よ|わ|って|です|。)$/;
  const partsOf = src => String(src).split(' ').map(t => t.replace(/\*/g, '')).filter(t => t && !PUNCT.test(t) && !/^\{.*\}$/.test(t) && !SOFT.test(t));
  function saysSeq(U, parts) { let p = 0; for (const part of parts) { const m = findWord(U, part, p); if (!m) return false; p = m.j; } return true; }
  // one of these answers (notation)? → its index, or -1
  function heardAny(text, list) {
    if (!cj()) return -1;
    const s = String(text || '').normalize('NFKC'), U = CJK.typed(s, 'ja').U; if (!U.length) return -1;
    for (let k = 0; k < list.length; k++) { const c = list[k]; if (!c) continue; if (CJK.same(s, c, 'ja')) return k; const ps = partsOf(c); if (ps.length && saysSeq(U, ps)) return k; }
    return -1;
  }
  const idk = t => /^\s*(\?+|？+|idk|i\s*don.?t\s*know|わからない|wakaranai|しらない|shiranai)\s*$/i.test(String(t || ''));
  // a hint in the mode: rōmaji letters or characters, the rest as dots / blanks (n: 1 … 3)
  function hintOf(src, n) {
    if (cmode() === 'roman') { const s = JR(src); let k = 0; return s.split('').map(c => (/[a-zāīūēō]/i.test(c) ? (k++ === 0 || n >= 3 || (n >= 2 && k % 2) ? c : '·') : c)).join(''); }
    return [...JC(src)].map((c, i) => (i === 0 || n >= 3 || (n >= 2 && i % 2 === 0) || /[、。！？「」]/.test(c) ? c : '＿')).join('');
  }

  // ================================================================ the board panel (ZHF's #zf overlay): the board, Shige, a typed answer
  const CSS = `
#zf .zf-panel.sg-ja .zf-head { background: linear-gradient(90deg, #f3e3c3, #fffaf0); }
#zf .zf-panel.sg-ja .zf-card .kind { color: #8a5a2a; }
#zf .zf-panel.sg-ja button.go { background: #8a5a2a; } #zf .zf-panel.sg-ja button.go:hover { background: #a06a35; }
#zf .zf-panel.sg-ja .zf-head .dots i { border-color: #8a5a2a; } #zf .zf-panel.sg-ja .zf-head .dots i.f { background: #8a5a2a; }
#zf .zf-panel.sg-ja .zf-card input, #zf .zf-panel.sg-ja .zf-bub, #zf .zf-panel.sg-ja .zf-card .hint, #zf .zf-panel.sg-ja .zf-card .gl { font-family: ${FONT}; }
#zf .zf-panel.sg-ja button.rd.on { background: #ffe9a8; }
#zf .sg-body { display: grid; grid-template-columns: auto minmax(300px, 1fr); gap: 16px; padding: 12px 18px 16px; align-items: start; max-height: calc(100vh - 70px); overflow: auto; }
#zf .sg-cv { width: min(430px, calc(100vh - 150px) * 0.8); height: auto; display: block; border-radius: 12px; cursor: pointer; touch-action: manipulation; }
#zf .sg-info { font: 700 13px "Segoe UI", sans-serif; opacity: .8; min-height: 20px; text-align: center; margin-top: 4px; }
#zf .sg-side { display: flex; flex-direction: column; gap: 10px; min-width: 0; }
#zf .sg-who { display: flex; gap: 10px; align-items: flex-start; }
#zf .sg-who canvas { width: 72px; height: 72px; border-radius: 50%; border: 3px solid #2b2235; background: #fff; display: block; }
#zf .sg-who .nm { font: 800 13px Bahnschrift, sans-serif; text-align: center; margin-top: 3px; }
#zf .sg-who .zf-bub { flex: 1; min-height: 64px; }
#zf .sg-kifu { font: 700 15px ${FONT}; background: #fbf6e7; border: 2px dashed rgba(43,34,53,.25); border-radius: 10px; padding: 6px 10px; max-height: 108px; overflow: auto; line-height: 1.7; }
#zf .sg-kifu span { margin-right: 10px; white-space: nowrap; }
#zf .zf-panel.sg-ja .ro { font: italic 600 12.5px "Segoe UI", sans-serif; opacity: .75; }
#zf .sg-big { font: 900 50px ${BRUSH}; line-height: 1.15; text-align: center; }
#zf .sg-big ruby rt { font: 700 14px ${FONT}; }
#zf .sg-note { font: 600 14px "Segoe UI", sans-serif; opacity: .85; line-height: 1.45; }
#zf .sg-btns { display: flex; gap: 8px; flex-wrap: wrap; }
@media (max-width: 860px) { #zf .sg-body { grid-template-columns: 1fr; } #zf .sg-cv { width: min(92vw, 400px); margin: 0 auto; } }
`;
  const css = () => ZHF.css('sg-css', CSS);
  const PB = { open: false, q: null, pos: null, last: -1, lastMove: null, kifu: [], sel: null, targets: [], hi: [], dots: [], arrow: null, ghost: null, hide: null, blank: null,
    fade: 0, read: true, onClick: null, pick: false, special: null, noHover: false, zone: false, hover: -1, anim: null, handSlots: [], res: null, cur: null, fast: false, quit: false };
  const CV = { W: 490, H: 610, x0: 45, y0: 104, cell: 80 };
  const sqXY = i => ({ x: CV.x0 + (E.col(i) + 0.5) * CV.cell, y: CV.y0 + (E.row(i) + 0.5) * CV.cell });
  const HAND_ORDER = [5, 4, 2, 3, 6];
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function arrow(c, a, b, col, dash) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x), L = Math.hypot(b.x - a.x, b.y - a.y) - 26;
    c.save(); c.translate(a.x, a.y); c.rotate(ang); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 7; c.lineCap = 'round'; if (dash) c.setLineDash([10, 9]);
    c.beginPath(); c.moveTo(14, 0); c.lineTo(L - 6, 0); c.stroke(); c.setLineDash([]); c.beginPath(); c.moveTo(L + 8, 0); c.lineTo(L - 12, -13); c.lineTo(L - 12, 13); c.closePath(); c.fill(); c.restore();
  }
  function draw() {
    if (!PB.open || !PB.q) return;
    const c = PB.q.ctx, { W, H, x0, y0, cell } = CV, p = PB.pos, now = performance.now() / 1000;
    c.clearRect(0, 0, W, H);
    // the two piece stands (駒台): Shige's at the top, yours at the bottom
    for (const side of [1, 0]) { const y = side === 0 ? 528 : 8; roundRect(c, x0, y, 400, 70, 10); c.fillStyle = '#dcb67c'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#2b2235'; c.stroke();
      c.font = '800 11px "Segoe UI", sans-serif'; c.fillStyle = 'rgba(43,34,53,.55)'; c.textAlign = 'right'; c.textBaseline = 'middle'; c.fillText(side === 0 ? 'your 持ち駒' : 'Shige’s 持ち駒', x0 + 392, y + (side === 0 ? 61 : 9)); }
    // the board, its highlights, its lines, its numbers
    c.fillStyle = '#ecc77e'; c.fillRect(x0 - 6, y0 - 6, 5 * cell + 12, 5 * cell + 12); c.lineWidth = 3; c.strokeStyle = '#2b2235'; c.strokeRect(x0 - 6, y0 - 6, 5 * cell + 12, 5 * cell + 12);
    const fill = (i, col) => { c.fillStyle = col; c.fillRect(x0 + E.col(i) * cell, y0 + E.row(i) * cell, cell, cell); };
    if (PB.zone) for (let k = 0; k < 5; k++) { fill(E.at(0, k), 'rgba(200,50,42,.12)'); }
    if (PB.lastMove) { if (PB.lastMove.f >= 0) fill(PB.lastMove.f, 'rgba(110,170,80,.22)'); fill(PB.lastMove.t, 'rgba(110,170,80,.4)'); }
    if (PB.sel && PB.sel.sq >= 0) fill(PB.sel.sq, 'rgba(255,210,63,.6)');
    for (const i of PB.hi) fill(i, `rgba(255,140,40,${0.3 + 0.22 * Math.sin(now * 5)})`);
    if (PB.hover >= 0 && !PB.noHover) fill(PB.hover, 'rgba(255,255,255,.3)');
    c.strokeStyle = '#2b2235'; c.lineWidth = 1.6;
    for (let i = 0; i <= 5; i++) { c.beginPath(); c.moveTo(x0 + i * cell, y0); c.lineTo(x0 + i * cell, y0 + 5 * cell); c.moveTo(x0, y0 + i * cell); c.lineTo(x0 + 5 * cell, y0 + i * cell); c.stroke(); }
    c.fillStyle = '#2b2235'; c.font = `800 18px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let k = 0; k < 5; k++) { c.fillText(FWD[5 - k], x0 + (k + 0.5) * cell, y0 - 17); c.fillText(KAN[k + 1], x0 + 5 * cell + 22, y0 + (k + 0.5) * cell); }
    // the pieces (sliding in when one just moved), the chapter 1 piece of the moment, the move dots, the arrows
    const anim = PB.anim, u = anim ? Math.min(1, (performance.now() - anim.t0) / 260) : 1;
    if (p) for (let i = 0; i < 25; i++) {
      const v = p.b[i]; if (!v) continue;
      let { x, y } = sqXY(i); if (anim && anim.t === i && u < 1) { const e = u * (2 - u); x = anim.x0 + (x - anim.x0) * e; y = anim.y0 + (y - anim.y0) * e; }
      const blank = !!(PB.blank && PB.blank.has(i)), faded = !!(PB.hide && PB.hide.has(i));
      drawPiece(c, x, y, cell * 0.92, Math.abs(v), E.owner(v), { read: PB.read, blank, gray: faded && PB.fade > 0.3, alpha: faded ? 1 - PB.fade : 1 });
    }
    if (PB.special) { const { x, y } = sqXY(PB.special.sq); drawPiece(c, x, y, cell * 0.92, 2, 0, { ch: PB.special.ch, say: PB.special.say, read: PB.read }); }
    for (const i of PB.dots) { const { x, y } = sqXY(i); c.beginPath(); c.arc(x, y, 10, 0, TAU); c.fillStyle = 'rgba(200,50,42,.78)'; c.fill(); }
    for (const i of PB.targets) { const { x, y } = sqXY(i); c.beginPath(); c.arc(x, y, 8, 0, TAU); c.fillStyle = 'rgba(33,164,147,.75)'; c.fill(); }
    // the pieces in hand
    PB.handSlots = [];
    if (p) for (const side of [0, 1]) { let k = 0; for (const t of HAND_ORDER) { const n = p.hand[side][t]; if (!n) continue; const x = x0 + 40 + k * 74, y = side === 0 ? 560 : 44; k++;
      if (side === 0 && PB.sel && PB.sel.hand === t) { c.beginPath(); c.arc(x, y, 31, 0, TAU); c.fillStyle = 'rgba(255,210,63,.6)'; c.fill(); }
      if (side === 0 && PB.hiHand === t) { c.beginPath(); c.arc(x, y, 31, 0, TAU); c.fillStyle = `rgba(255,140,40,${0.3 + 0.22 * Math.sin(now * 5)})`; c.fill(); }
      drawPiece(c, x, y, 58, t, side, { read: PB.read });
      if (n > 1) { c.font = '900 15px "Segoe UI", sans-serif'; c.fillStyle = '#2b2235'; c.textAlign = 'left'; c.fillText('×' + n, x + 25, y + (side ? -18 : 20)); }
      if (side === 0) PB.handSlots.push({ t, x, y }); } }
    const handAt = t => { const s = PB.handSlots.find(h => h.t === t); return s || { x: x0 + 200, y: 560 }; };
    if (PB.arrow) arrow(c, PB.arrow.f >= 0 ? sqXY(PB.arrow.f) : handAt(PB.arrow.hand), sqXY(PB.arrow.t), 'rgba(200,50,42,.85)');
    if (PB.ghost) arrow(c, PB.ghost.f >= 0 ? sqXY(PB.ghost.f) : handAt(PB.ghost.hand), sqXY(PB.ghost.t), 'rgba(33,140,130,.85)', true);
  }
  function loop() { if (!PB.open) return; try { draw(); } catch (e) { console.error('[shogi] draw', e); } requestAnimationFrame(loop); }
  function hitAt(e) {
    const cv = PB.q.cv, r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * CV.W / r.width, y = (e.clientY - r.top) * CV.H / r.height, { x0, y0, cell } = CV;
    if (x >= x0 && x < x0 + 5 * cell && y >= y0 && y < y0 + 5 * cell) return { sq: E.at(Math.floor((y - y0) / cell), Math.floor((x - x0) / cell)) };
    for (const s of PB.handSlots) if (Math.abs(x - s.x) < 32 && Math.abs(y - s.y) < 34) return { hand: s.t, sq: -1 };
    return null;
  }
  const info = html => { if (PB.q) PB.q.info.innerHTML = html || ''; };
  function onClick(e) {
    const h = hitAt(e); if (!h) return;
    if (PB.onClick) { PB.onClick(h); return; }
    if (!PB.pick || !PB.pos) return;
    const p = PB.pos, me = p.turn;
    if (h.hand) { PB.sel = { hand: h.hand, sq: -1 }; PB.targets = [...new Set(E.legal(p).filter(m => m.drop && m.p === h.hand).map(m => m.t))]; PB.ghost = null; return; }
    if (PB.sel && PB.targets.includes(h.sq)) { PB.ghost = { f: PB.sel.hand ? -1 : PB.sel.sq, hand: PB.sel.hand, t: h.sq }; PB.targets = []; info('Now say that move out loud: the square, then the piece. Enter.'); PB.q.input.focus(); return; }
    const v = p.b[h.sq];
    if (v && E.owner(v) === me) { PB.sel = { sq: h.sq }; PB.targets = [...new Set(E.legal(p).filter(m => m.f === h.sq).map(m => m.t))]; PB.ghost = null; return; }
    PB.sel = null; PB.targets = []; PB.ghost = null;
  }
  function onMove(e) { const h = hitAt(e), i = h && h.sq >= 0 ? h.sq : -1; if (i === PB.hover) return; PB.hover = i; if (!PB.noHover) info(i >= 0 ? sqHTML(i) + (cmode() === 'roman' ? '' : ` <i class="ro">${ro(sqSay(i))}</i>`) : ''); }
  function panelOpen(o = {}) {
    css();
    const html = `<div class="zf-head"><b>${esc(o.title || '将棋')}</b><span class="t">${esc(o.sub || '')}</span><span class="dots"></span><button type="button" class="rd" title="Readings on the pieces">読み</button><button type="button" class="stop">Stop <kbd>Esc</kbd></button></div>
<div class="sg-body"><div><canvas class="sg-cv" width="${CV.W}" height="${CV.H}"></canvas><div class="sg-info"></div></div>
<div class="sg-side"><div class="sg-who"><div><canvas width="96" height="96"></canvas><div class="nm"></div></div><div class="zf-bub"></div></div>
<div class="zf-card"><div class="kind"></div><div class="gl"></div>
<form autocomplete="off"><input spellcheck="false"><button type="submit" class="go">Say it</button></form><div class="hint"></div>
<div class="row"><button type="button" class="idk">Hint (?)</button><button type="button" class="resign hidden">参りました</button><span class="keys">Tab: a hint · Esc: stop</span></div></div>
<div class="sg-kifu hidden"></div></div></div>`;
    PB.quit = false;
    const panel = ZHF.open(html, e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); PB.quit = true; if (PB.res) PB.res('quit'); }
      else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); if (PB.cur && PB.cur.hint) PB.cur.hint(); }
    }, 'zf-drill sg-ja');
    const q = s => panel.querySelector(s);
    PB.q = { panel, cv: q('.sg-cv'), ctx: q('.sg-cv').getContext('2d'), info: q('.sg-info'), bub: q('.zf-bub'), card: q('.zf-card'), kind: q('.kind'), gl: q('.gl'), form: q('form'), input: q('input'), hint: q('.hint'),
      idk: q('.idk'), resign: q('.resign'), keys: q('.keys'), kifu: q('.sg-kifu'), dots: q('.dots'), rd: q('.rd') };
    ZHF.face(q('.sg-who canvas'), 'sgShige'); q('.sg-who .nm').innerHTML = J(NAMES.sg); ZHF.ime(PB.q.input);
    q('.stop').onclick = () => { PB.quit = true; if (PB.res) PB.res('quit'); };
    Object.assign(PB, { open: true, pos: o.pos || null, last: -1, lastMove: null, kifu: [], sel: null, targets: [], hi: [], hiHand: 0, dots: [], arrow: null, ghost: null, hide: null, blank: null, fade: 0,
      read: o.read !== undefined ? o.read : true, onClick: null, pick: false, special: null, noHover: false, zone: false, hover: -1, anim: null });
    PB.q.rd.classList.toggle('on', PB.read); PB.q.rd.onclick = () => { PB.read = !PB.read; PB.q.rd.classList.toggle('on', PB.read); };
    PB.q.cv.addEventListener('click', onClick); PB.q.cv.addEventListener('mousemove', onMove); PB.q.cv.addEventListener('mouseleave', () => { PB.hover = -1; if (!PB.noHover) info(''); });
    requestAnimationFrame(loop);
    return PB.q;
  }
  function panelClose() { PB.open = false; PB.cur = null; PB.res = null; PB.onClick = null; ZHF.close(); }
  const setDots = (n, i) => { if (PB.q) PB.q.dots.innerHTML = Array.from({ length: n }, (_, k) => `<i class="${k < i ? 'f' : ''} ${k === i ? 'now' : ''}"></i>`).join(''); };
  // (Shige's line, by the weave like every line, DESIGN.md 17.3: mixed, whole in Japanese as the weave rises; its English on
  // request, EN on the bubble)
  function bub(ja, en) {
    if (!PB.q) return;
    if (ZHF.sayBub) ZHF.sayBub(PB.q.bub, ja, en ? enM(en) : '', PB.q.input, J); else PB.q.bub.innerHTML = ja ? J(ja) : '';
    if (ja && cmode() === 'chars') try { CJK.seen(ja, { lang: 'ja' }); } catch (e) { /* */ }
  }
  const bubKey = key => { const L0 = lineOf(key); bub(L0.ja, L0.en); };      // (CJK fills {mimo} itself: ミモ)
  function setPos(p, o = {}) { PB.pos = p; PB.last = o.last === undefined ? -1 : o.last; PB.lastMove = null; PB.sel = null; PB.targets = []; PB.hi = []; PB.hiHand = 0; PB.dots = []; PB.arrow = null; PB.ghost = null; PB.special = null; PB.blank = null; PB.hide = null; PB.anim = null; if (o.kifu !== false) { PB.kifu = []; renderKifu(); } }
  function renderKifu() { const el = PB.q && PB.q.kifu; if (!el) return; el.classList.toggle('hidden', !PB.kifu.length); el.innerHTML = PB.kifu.map(e => `<span>${e.who ? '☖' : '☗'}${kHTML(e.k)}</span>`).join(' '); el.scrollTop = 1e4; }
  // a move on the panel's board (k: its kifu, written before it was played); who: 0 you, 1 Shige
  function applyMove(m, k, who) {
    const p = PB.pos, from = m.f >= 0 ? sqXY(m.f) : (PB.handSlots.find(h => h.t === m.p) || { x: CV.x0 + 200, y: who ? 44 : 560 });
    E.play(p, m); PB.last = m.t; PB.lastMove = m; PB.kifu.push({ k, who }); PB.anim = { t: m.t, x0: from.x, y0: from.y, t0: performance.now() };
    PB.sel = null; PB.targets = []; PB.ghost = null; PB.arrow = null; PB.hi = []; PB.hiHand = 0;
    sfx('wood'); renderKifu(); if (SC.sync) boardTop(p);
  }
  // Shige's line in the panel, then wait for Enter (or a click on the button)
  function next(label) {
    const Q = PB.q; Q.kind.textContent = ''; Q.gl.innerHTML = ''; Q.card.classList.remove('ok'); Q.hint.className = 'hint plain'; Q.hint.innerHTML = '';
    Q.input.value = ''; Q.input.placeholder = label || '▶ Enter: carry on';
    setTimeout(() => Q.input.focus(), 40);
    return new Promise(res => {
      PB.res = v => { PB.res = null; PB.cur = null; res(v); };
      const go = () => PB.res && PB.res('next');
      PB.cur = { answer: '', roman: '', submit: go, hint() {}, idk() {} };
      Q.form.onsubmit = e => { e.preventDefault(); go(); }; Q.idk.onclick = go;
      if (PB.fast) setTimeout(go, 0);
    });
  }
  async function talk(key, vars) { bubKey(key); if (vars && vars.say) sayVoice(lineOf(key).ja); return next(); }
  // One typed question in the panel → { ok, clean, text, val } or 'quit'. o: { kind, gl (html), check(text) → { ok, clean, said
  // (html), note, why (html), val, retry (no miss counted) }, answer / roman (what tests type), hints: [html…] (Tab or the button
  // shows the next; the last is the answer itself), onHint(n), placeholder, pick (piece selection by click), after (html) }
  function ask(o) {
    const Q = PB.q;
    Q.kind.textContent = o.kind || ''; Q.gl.innerHTML = o.gl || ''; Q.card.classList.remove('ok');
    Q.input.value = ''; Q.input.placeholder = o.placeholder || (cmode() === 'chars' ? 'type in rōmaji (Space: kanji), then Enter' : 'say it in Japanese (rōmaji)…');
    Q.hint.className = 'hint plain'; Q.hint.innerHTML = o.help || '';
    Q.resign.classList.toggle('hidden', !o.resign);
    PB.pick = !!o.pick; PB.sel = null; PB.targets = []; PB.ghost = null;
    setTimeout(() => Q.input.focus(), 40);
    let tries = 0, hintN = 0, shown = false;
    return new Promise(res => {
      PB.res = v => { PB.res = null; PB.cur = null; PB.pick = false; res(v); };
      const done = (r, said, note) => {
        Q.card.classList.add('ok'); sfx('review'); Q.hint.className = 'hint plain'; Q.hint.innerHTML = '✓ ' + (said || '') + (note ? ' · ' + note : '') + (o.after ? ' · ' + o.after : '');
        const v = { ok: true, clean: r.clean !== false && !tries && !hintN && !shown, text: r.text, val: r.val };
        const fin = () => PB.res && PB.res(v); if (PB.fast) fin(); else setTimeout(fin, o.pause || 950);
      };
      const submit = text => {
        const t = String(text || '').trim(); if (!t || !PB.res || Q.card.classList.contains('ok')) return;
        if (idk(t)) { PB.cur.hint(); return; }
        const r = o.check(t) || {};
        if (r.ok) { try { if (r.src) CJK.used(t, r.src, { lang: 'ja' }); } catch (e) { /* */ } done(Object.assign(r, { text: t }), r.said, r.note); return; }
        if (r.retry) { Q.hint.className = 'hint'; Q.hint.innerHTML = r.why || ''; Q.input.select(); return; }
        tries++; sfx('wrong'); Q.card.classList.remove('shake'); void Q.card.offsetWidth; Q.card.classList.add('shake');
        const last = o.hints && o.hints.length ? o.hints[o.hints.length - 1] : '';
        Q.hint.className = 'hint'; Q.hint.innerHTML = (r.why || 'Not quite. Try again! (Tab: a hint)') + (tries >= 2 && last ? `<br>${last}` : '');
        if (tries >= 2 && last) { shown = true; if (o.onHint) o.onHint(99); }
        Q.input.select();
      };
      PB.cur = { answer: o.answer || '', roman: o.roman || o.answer || '', submit, finish: (r, said, note) => done(r, said, note),
        hint() { if (!o.hints || !o.hints.length) return; const h = o.hints[Math.min(hintN, o.hints.length - 1)]; hintN++; if (hintN >= o.hints.length) shown = true; Q.hint.className = 'hint'; Q.hint.innerHTML = h; if (o.onHint) o.onHint(hintN); Q.input.focus(); },
        idk() { this.hint(); } };
      Q.form.onsubmit = e => { e.preventDefault(); submit(Q.input.value); };
      Q.idk.onclick = () => PB.cur && PB.cur.hint();
      Q.resign.onclick = () => { Q.hint.className = 'hint'; Q.hint.innerHTML = `To resign, bow and say it: ${J('[参|まい]りました 。', { ruby: 'always' })} <i class="ro">mairimashita</i>`; Q.input.focus(); };
    });
  }
  // a piece's name: o.code (1–14, 'kei', 'kyo'), o.src (its name: the answer); any of its names will do
  function askName(o) {
    const nameOK = v => v === o.code;
    return ask(Object.assign({ answer: JC(o.src), roman: JR(o.src),
      hints: [`${esc(hintOf(o.src, 1))}`, `${esc(hintOf(o.src, 2))}`, `It’s ${J(o.src, { ruby: 'always' })} <i class="ro">${esc(JR(o.src).toLowerCase())}</i>`],
      check: t => { const v = pieceIn(t); if (nameOK(v)) return { ok: true, said: J(o.src, { ruby: 'always' }) + (o.note ? '' : '') }; if (v) return { why: `That’s another piece${v === 'kei' || v === 'kyo' ? '' : ': ' + J(pSrc(v, 0), { mode: 'chars' })}. Look again!` }; return { why: 'Say the piece’s name.' }; } }, o));
  }
  // a square's name (two numbers): o.sq
  function askSquare(o) {
    const k = { src: sqSrc(o.sq), say: sqSay(o.sq) };
    return ask(Object.assign({ answer: JC(k.src), roman: JR(k.say), hints: ['The file first (1–5, counted from the right), then the rank (一–五, from the top).', `It’s ${kHTML(k, { ro: true })}`],
      check: t => { const i = squareIn(t); if (i === o.sq) return { ok: true, said: kHTML(k, { ro: true }) }; if (i >= 0) return { why: `That’s ${kHTML({ src: sqSrc(i), say: sqSay(i) }, { ro: true })}. The file (across) first, then the rank (down).` }; return { why: 'Two numbers: the file, then the rank («３三» is さん さん).' }; } }, o));
  }
  // a move: o.want (a move to say), or o.ok(m) (any move it accepts), o.hint (the move the hints point to); → the ask's result
  // (val: { m, k }) — the move isn't played here
  function askMove(o) {
    const p = PB.pos, target = o.want || o.hint || null, k = target ? kifu(target, p, PB.last) : null;
    const hints = o.hints || (k ? [target.f >= 0 ? 'The square comes first: where does the piece land? Then the piece’s name.' : 'A drop: the square, the piece, then 打 (うつ).', `It’s ${kHTML(k, { ro: true })}`] : []);
    return ask(Object.assign({ answer: k ? JC(k.src) : '', roman: k ? JR(k.say) : '', hints,
      check: t => {
        if (o.resign && heardAny(t, ['[参|まい]りました 。', 'まいりました']) >= 0) return { ok: true, said: J('[参|まい]りました 。'), val: { resign: true } };
        const r = readMove(t, PB.pos, PB.last);
        if (r.ask === 'prom') return { retry: true, why: `Promote or not? Say it again with ${J('[成|なり]', { ruby: 'always' })} or ${J('[不成|ならず]', { ruby: 'always' })} at the end.` };
        if (r.ask === 'which') {
          PB.hi = [...new Set(r.ms.map(m => m.f))];
          PB.onClick = h => { const m = r.ms.find(x => x.f === h.sq); if (!m) return; PB.onClick = null; PB.hi = []; const kk = kifu(m, PB.pos, PB.last); if (o.want && !same(m, o.want)) return; if (o.ok && !o.ok(m)) return; PB.cur && PB.cur.finish({ clean: true, val: { m, k: kk } }, kHTML(kk)); };
          return { retry: true, why: 'Two of your pieces could go there: click the one you mean (or add 右 or 左: right or left).' };
        }
        if (r.err) return { why: esc(r.err) };
        if (o.want && !same(r.m, o.want)) return { why: o.wrongWhy || 'That’s a real move, but not this one. Look at the arrow!' };
        if (o.ok && !o.ok(r.m)) return { why: o.wrongWhy || 'Not that one.' };
        return { ok: true, clean: r.clean, said: kHTML(r.k, { ro: true }), note: r.notes.join('; '), val: { m: r.m, k: r.k, check: r.check } };
      } }, o));
  }
  const same = (a, b) => a.t === b.t && a.f === b.f && !!a.pr === !!b.pr && !!a.drop === !!b.drop && a.p === b.p;
  const enM = s => String(s).replace(/\{mimo\}/g, mimoN());
  const mimoN = () => (G && G.state.mimoName) || 'Mimo';
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  // a phrase from the Phrasebook: first seen (echo: its reading shown, its note), or from memory (recall: only the situation)
  function askPhrase(id, o = {}) {
    const ph = PHI[id], list = [ph.ja].concat(ph.alt || []);
    return ask(Object.assign({ kind: o.recall ? 'From memory · what do you say?' : 'New · type it to learn it',
      gl: o.recall ? `<div class="sg-note" style="font-size:17px;font-weight:800">${esc(enM(o.sit || ph.sit))}</div>` : `<div class="sg-big" style="font-size:32px">${J(ph.ja, { ruby: 'always' })}</div><div class="sg-note">“${esc(ph.en)}” · ${esc(ph.note)}</div>`,
      answer: JC(ph.ja), roman: JR(ph.ja), placeholder: o.recall ? undefined : JP(ph.ja),
      hints: [esc(hintOf(ph.ja, 1)), esc(hintOf(ph.ja, 2)), `It’s ${J(ph.ja, { ruby: 'always' })} <i class="ro">${esc(JR(ph.ja))}</i>`],
      check: t => { const k = heardAny(t, list); return k >= 0 ? { ok: true, said: J(list[k]), src: list[k] } : { why: 'Not quite. Try again! (Tab: a hint)' }; } }, o))
      .then(r => { if (r !== 'quit' && r.ok) teach(id); return r; });
  }

  // ================================================================ the Phrasebook: into LEX (stage 3, its own review pushed far off)
  function phrases() {
    if (typeof LEX === 'undefined' || !LEX.register) return;
    LEX.register(PH.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', ja: p.ja, en: p.en, note: p.note, region: p.region, register: p.register, icon: p.icon, alt: { ja: p.alt || [] } })));
    LEX.register(ITEMS.filter(it => !LEX.item(it.id)).map(it => Object.assign({}, it)));
  }
  function teach(id) {
    if (typeof LEX === 'undefined' || !LEX.item(id) || LEX.lang !== 'ja') return;
    const s = LEX.st(id), t = Date.now() / 1000; LEX.expose(id);
    if (s.stage < 3) s.stage = 3; s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 30 * 86400; s.last = t;
  }
  function keepFar() {
    if (typeof LEX === 'undefined' || LEX.lang !== 'ja') return;
    const t = Date.now() / 1000;
    for (const p of PH) { if (!LEX.item(p.id)) continue; const s = LEX.st(p.id); if (s.stage >= 2 && s.due < t + 86400) { s.due = t + 30 * 86400; s.str = Math.max(s.str || 0, 30 * 86400); } }
  }
  const teachAll = ids => { ids.forEach(teach); const n = ids.filter(id => PHI[id]).length; if (n) UI.toast(`${n === 1 ? 'A new phrase' : n + ' new phrases'} in your Phrasebook (journal)`); };
  const GRN = ['S', 'A', 'B', 'C', 'D'];
  const gradeOf = list => { const n = list.length || 1, k = list.filter(Boolean).length / n; return k >= 0.999 ? 'S' : k >= 0.8 ? 'A' : k >= 0.6 ? 'B' : k >= 0.4 ? 'C' : 'D'; };
  const best = (a, b) => (!a ? b : !b ? a : GRN.indexOf(a) <= GRN.indexOf(b) ? a : b);

  // ================================================================ the scenes: lines, shots, standing places
  const SC = { on: false, lit: false, fan: false, sync: false, hush: false };
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const shot = (p, l) => { G.cam.override = { pos: V3(p[0], p[1], p[2]), look: V3(l[0], l[1], l[2]) }; };
  const lock = on => { if (G) G.sim.lock = on ? 1 : 0; };
  const you = text => STORY.you(text), think = (text, s) => STORY.think(text, s);
  function say(p, key) {
    if (!p || typeof STORY === 'undefined') return Promise.resolve();
    const L0 = typeof key === 'string' ? lineOf(key) : { ja: key[0], en: key[1] };
    p.name = JP(p.nameSrc || ''); p.lines = { en: L0.en, ja: L0.ja }; p.top = p.top || 2.1;
    return STORY.sayInline(p, true);
  }
  const sgSay = key => say(B.sg, key);
  function placeYou(at, look) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = at.x; Y.z = at.z; Y.yaw = Math.atan2(look.x - at.x, look.z - at.z);
    const sx = Math.cos(Y.yaw) * 0.85, sz = -Math.sin(Y.yaw) * 0.85;
    M.x = at.x + sx + Math.sin(Y.yaw) * 0.3; M.z = at.z + sz + Math.cos(Y.yaw) * 0.3; M.station = null; M.wander = null; M.look = { x: look.x, z: look.z };
    [Y.x, Y.z] = WORLD.pushOut(Y.x, Y.z, 0.4); [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3); G.sim.snap();
  }
  const standBy = () => placeYou(SPOT.you, SITE);
  const shotBench = () => shot([SITE.x + 1.7, B.ty + 1.85, SITE.z + 3.3], [SITE.x - 0.35, B.ty + 0.75, SITE.z]);
  const shotShige = () => shot([SITE.x + 0.45, B.ty + 1.4, SITE.z + 1.85], [SEAT.sg.x, B.ty + 1.0, SEAT.sg.z]);
  const shotSign = () => shot([SPOT.post.x + 1.5, B.ty + 1.7, SPOT.post.z + 1.7], [SPOT.post.x + 0.05, B.ty + 1.45, SPOT.post.z + 0.05]);
  const shotWide = () => shot([SITE.x + 0.9, B.ty + 2.3, SITE.z + 4.9], [SITE.x + 0.35, B.ty + 0.85, SITE.z - 0.1]);
  const shotMimo = () => { const R = G.cast.mimo.root, P = R.position, a = R.rotation.y, fx = Math.sin(a), fz = Math.cos(a); shot([P.x + fx * 1.7 - fz * 0.55, P.y + 0.85, P.z + fz * 1.7 + fx * 0.55], [P.x, P.y + 0.45, P.z]); };
  const standAside = () => placeYou({ x: SITE.x - 1.05, z: SITE.z + 1.6 }, SITE);
  async function scene(fn) {
    lock(true); SC.on = true;
    try { await fn(); } catch (e) { console.error('[shogi] scene', e); }
    finally { G.cam.override = null; lock(false); SC.on = false; SC.fan = false; if (G.sim.mimo) G.sim.mimo.look = null; G.fx.hush = 0; if (G.save) G.save(); }
  }
  const coins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; sfx('chest'); UI.toast(`${why}: +${n} coins`); };
  const bag = id => { G.state.bag = G.state.bag || {}; G.state.bag[id] = 1; const it = ITEMS.find(i => i.id === id); if (it) UI.toast(`Key item: ${JP(it.ja)} (${it.en})`); };
  const mimoHop = () => { const M = G.sim.mimo; M.happy = 1.5; M.glow = 1; try { G.w3d.fx.sparkle(M.x, M.ry + 0.8, M.z, 14, ['#ffd23f', '#fffaf0']); } catch (e) { /* */ } };
  const Q = { quit: true };

  // ================================================================ meeting Shige
  async function meet() {
    const st = S();
    await scene(async () => {
      standBy(); shotBench();
      const sg = B.sg; sg.pose = 'slam'; sg.slamT = 0.45; sfx('wood'); await wait(0.5); await sgSay('sg.alone');
      shotShige(); await sgSay('sg.hi'); await sgSay('sg.what'); SC.fan = true; sg.pose = 'think'; await sgSay('sg.carve'); SC.fan = false; sg.pose = 'cards';
      await you('Who usually sits across from you?');
      await sgSay('sg.seat'); await sgSay('sg.teach');
      await you('Shogi? I’d love to learn!');
      await sgSay('sg.ok');
      st.met = true;
    });
    if (!CH[0].gate(flags())) { think(`Shige: «${JP(lineOf('sg.wait').ja)}» (come back ${CH[0].wait})`, 4); return; }
    const go = await UI.choose(`${JP(NAMES.sg)}: «${JP('[始|はじ]めよう 。')}» (Let’s begin.)`, [{ label: `Chapter 1: ${CH[0].title}`, sub: CH[0].sub(), value: 1 }, { label: 'Later', value: 0 }]);
    if (go) await chapter1();
  }

  // ---- a chapter: a short scene at the bench, the lesson in the panel, the grade, the rewards
  async function runChapter(n, lessonFn, o) {
    const st = S(), first = !st.ch[n];
    if (o.before) await scene(async () => { standBy(); shotBench(); for (const k of o.before) await sgSay(k); });
    lock(true); SC.on = true;
    let r = null;
    try { r = await lessonFn(); } catch (e) { console.error('[shogi] chapter', n, e); } finally { if (PB.open) panelClose(); SC.on = false; lock(false); G.fx.hush = 0; }
    if (!r || r.quit) return null;
    st.ch[n] = true; const g = gradeOf(r.clean); st.grade[n] = best(st.grade[n], g);
    teachAll(o.teach || []);
    if (o.after) await scene(async () => { standBy(); shotShige(); for (const k of o.after) await sgSay(k); });
    if (first) coins(o.coins || 6, `${o.name}, grade ${g}`); else UI.toast(`Grade ${g} (best: ${st.grade[n]})`);
    if (G.save) G.save();
    return r;
  }

  // ================================================================ chapter 1: the pieces (駒)
  function showPiece(pc, o = {}) {
    const p = E.fromRows(['.....', '.....', '.....', '.....', '.....'], 0, {}), sq = pc.id === 'kyo' || pc.id === 'kei' ? E.at(4, 2) : E.at(2, 2);
    setPos(p);
    if (typeof pc.code === 'number') { p.b[sq] = pc.code; if (o.blank) PB.blank = new Set([sq]); }
    else PB.special = { sq, ch: o.blank ? '？' : pc.ch, say: o.blank ? ' ' : (pc.id === 'kei' ? 'けい' : 'きょう') };
    PB.dots = reachOf(pc.code, E.row(sq), E.col(sq));
  }
  async function lesson1() {
    const clean = [], total = PIECES.length + 6 + 6 + 2;
    panelOpen({ title: '駒 · The pieces', sub: 'Shige’s bench', read: true });
    setPos(E.start());
    bubKey('sg.c1.a'); if ((await next()) === 'quit') return Q;
    let r = await askPhrase('ph.sg.sashimashou', { kind: 'New · invite him to a game' }); if (r === 'quit') return Q; clean.push(r.clean);
    bubKey('sg.c1.b'); if ((await next()) === 'quit') return Q;
    // each piece alone in the middle of the board, its moves as red dots: say its name
    for (let i = 0; i < PIECES.length; i++) {
      const pc = PIECES[i]; setDots(total, i + 1); showPiece(pc); bubKey(pc.line);
      r = await askName({ kind: `New · ${pc.en}`, gl: `<div class="sg-big">${J(pc.full, { ruby: 'always', mode: 'chars' })}</div><div class="sg-note">${esc(pc.how)}. ${pc.big ? '' : 'Its short name is the character on the piece. '}Say its name.</div>`,
        code: pc.code, src: pc.full, placeholder: JP(pc.full) });
      if (r === 'quit') return Q; clean.push(r.clean);
      if (pc.id === 'ou') {
        bubKey('sg.p.ou2'); if ((await next()) === 'quit') return Q;
        r = await askPhrase('ph.sg.naruhodo', { kind: 'New · it clicks' }); if (r === 'quit') return Q; clean.push(r.clean);
      }
    }
    // which piece moves like this? (only the dots; the piece is blank)
    bubKey('sg.c1.which');
    const quiz = shuffle(['hi', 'kaku', 'kin', 'gin', 'fu', 'kei'].map(id => PIECE[id]));
    for (let i = 0; i < quiz.length; i++) {
      const pc = quiz[i]; setDots(total, PIECES.length + 2 + i); showPiece(pc, { blank: true });
      r = await askName({ kind: 'From memory · which piece moves like this?', gl: '<div class="sg-note">The red dots are where it can go, moving up the board from your side.</div>', code: pc.code, src: pc.full, placeholder: '…' });
      if (r === 'quit') return Q; clean.push(r.clean);
    }
    // set the board up: what goes on each of your squares? (Shige's side shows it, turned round)
    bubKey('sg.c1.set');
    const p = E.start(); setPos(p); const mine = [20, 21, 22, 23, 24, 15]; PB.blank = new Set(mine);
    for (const [k, sq] of shuffle(mine.slice()).entries()) {
      setDots(total, PIECES.length + 8 + k); PB.hi = [sq];
      const code = Math.abs(p.b[sq]), src = code === 1 ? '[玉将|ぎょくしょう]' : PIECES.find(x => x.code === code).full;
      r = await askName({ kind: 'Set up · what goes here?', gl: '<div class="sg-note">Shige’s pieces are set out the same way, turned round. What stands on your orange square?</div>', code, src, placeholder: '…' });
      if (r === 'quit') return Q; clean.push(r.clean); PB.blank.delete(sq); PB.hi = [];
    }
    setDots(total, total); bubKey('sg.c1.end'); if ((await next()) === 'quit') return Q;
    return { clean };
  }
  const chapter1 = () => runChapter(1, lesson1, { name: 'The shogi pieces', teach: ['ph.sg.sashimashou', 'ph.sg.naruhodo'] });

  // ================================================================ chapter 2: saying moves (棋譜)
  const mv = (p, f, t, o = {}) => E.legal(p).find(m => m.f === f && m.t === t && !!m.pr === !!o.pr && !!m.drop === !!o.drop && (o.p === undefined || m.p === o.p));
  const dropMv = (p, piece, t) => E.legal(p).find(m => m.drop && m.p === piece && m.t === t);
  async function lesson2() {
    const clean = [], total = 14; let r;
    panelOpen({ title: '棋譜 · Saying moves', sub: 'Shige’s bench' });
    setPos(E.start()); PB.noHover = true;
    for (const k of ['sg.c2.a', 'sg.c2.b', 'sg.c2.files', 'sg.c2.yon']) { bubKey(k); if ((await next()) === 'quit') return Q; }
    // the squares
    bubKey('sg.c2.sq');
    for (const [k, sq] of [12, 8, 21, 4].entries()) {
      setDots(total, k); PB.hi = [sq];
      r = await askSquare({ kind: 'Squares · name it', sq, gl: '<div class="sg-note">The orange square: its file (across, counted from the right), then its rank (down, from the top).</div>' });
      if (r === 'quit') return Q; clean.push(r.clean);
    }
    PB.hi = [];
    bubKey('sg.c2.where'); setDots(total, 4);
    r = await askSquare({ kind: 'Squares · where is it?', sq: 20, gl: `<div class="sg-note">Where is your ${J('[玉|ぎょく]', { mode: 'chars', ruby: 'always' })}? Say its square.</div>` }); if (r === 'quit') return Q; clean.push(r.clean);
    setDots(total, 5);
    r = await askSquare({ kind: 'Squares · where is it?', sq: 4, gl: `<div class="sg-note">And Shige’s ${J('[王|おう]', { mode: 'chars', ruby: 'always' })}?</div>` }); if (r === 'quit') return Q; clean.push(r.clean);
    PB.noHover = false;
    // moves: the arrow shows one; say it. Then Shige takes, and you take back: 同
    const p = E.fromRows(['rbs.k', '..g.p', '.....', 'P.S..', 'KG.RB'], 0, {}); setPos(p);
    bubKey('sg.c2.say'); setDots(total, 6);
    let m = mv(p, 17, 12); PB.arrow = { f: 17, t: 12 };
    r = await askMove({ kind: 'Moves · say it', want: m, gl: '<div class="sg-note">The arrow: your silver steps up. Say the square it lands on, then the piece.</div>' }); if (r === 'quit') return Q; clean.push(r.clean);
    applyMove(r.val.m, r.val.k, 0);
    await wait(PB.fast ? 0 : 0.6);
    m = mv(p, 7, 12); const k1 = kifu(m, p, PB.last); applyMove(m, k1, 1); bub('[同|どう] [金|きん] 。', 'Dō kin. (“Gold, same square.”)');
    if ((await next()) === 'quit') return Q;
    bubKey('sg.c2.dou'); if ((await next()) === 'quit') return Q;
    setDots(total, 7); m = mv(p, 24, 12); PB.arrow = { f: 24, t: 12 };
    r = await askMove({ kind: 'Moves · take back', want: m, gl: '<div class="sg-note">Your bishop takes back on the same square. Say it the shogi way.</div>' }); if (r === 'quit') return Q; clean.push(r.clean);
    applyMove(r.val.m, r.val.k, 0);
    // now any move: Shige answers each one; hand him the turn with どうぞ
    bubKey('sg.c2.free');
    for (let i = 0; i < 3; i++) {
      if (E.status(p).over) break;
      if (p.turn === 1) { await wait(PB.fast ? 0 : 0.6); const sm = E.bestMove(E.clone(p), { depth: 1, noise: 60, max: 8000 }); if (!sm) break; const ks = kifu(sm, p, PB.last); applyMove(sm, ks, 1); bub(ks.src + ' 。', `«${JC(ks.src)}»`); }
      if (E.status(p).over) break;
      setDots(total, 8 + i * 2);
      const hm = E.bestMove(E.clone(p), { depth: 2, noise: 0, max: 12000 });
      r = await askMove({ kind: 'Your move · any move you like', pick: true, hint: hm, ok: () => true, gl: '<div class="sg-note">Click a piece to see where it can go, if you like. Then say your move.</div>',
        hints: hm ? ['Click one of your pieces: its green dots are where it can go.', `This one would do: ${kHTML(kifu(hm, p, PB.last), { ro: true })}`] : [] });
      if (r === 'quit') return Q; clean.push(r.clean); applyMove(r.val.m, r.val.k, 0);
      if (i === 0) { setDots(total, 9); r = await askPhrase('ph.sg.douzo', { kind: 'New · your turn, Shige' }); if (r === 'quit') return Q; clean.push(r.clean); }
    }
    setDots(total, total); bubKey('sg.c2.end'); if ((await next()) === 'quit') return Q;
    return { clean };
  }
  const chapter2 = () => runChapter(2, lesson2, { name: 'Saying moves', teach: ['ph.sg.douzo'] });

  // ================================================================ chapter 3: captures and drops (持ち駒, 打つ), promotion (成る・不成)
  async function lesson3() {
    const clean = [], total = 14; let r, p, m;
    panelOpen({ title: '持ち駒・成り · Drops and promotion', sub: 'Shige’s bench' });
    const step = async (k, o) => { setDots(total, k); r = await askMove(o); if (r === 'quit') return false; clean.push(r.clean); return true; };
    // a capture: the piece changes sides
    p = E.fromRows(['....k', '.....', '..s..', '.....', 'K...B'], 0, {}); setPos(p);
    bubKey('sg.c3.a'); if ((await next()) === 'quit') return Q;
    m = mv(p, 24, 12); PB.arrow = { f: 24, t: 12 };
    if (!await step(0, { kind: 'Capture · take it', want: m, gl: '<div class="sg-note">Your bishop takes his silver. Say the move (where it lands, then the piece).</div>' })) return Q;
    applyMove(r.val.m, r.val.k, 0); p.turn = 0; PB.last = -1;
    bubKey('sg.c3.b'); if ((await next()) === 'quit') return Q;
    bubKey('sg.c3.utsu'); if ((await next()) === 'quit') return Q;
    // a drop, where Shige says
    m = dropMv(p, 3, E.at(1, 3)); PB.hi = [E.at(1, 3)]; PB.hiHand = 3;
    bub('その [銀|ぎん] を 、 ２ [二|に] に [打|う]って みろ 。', 'Drop that silver on ２二.');
    if (!await step(1, { kind: 'Drop · 打つ', want: m, gl: `<div class="sg-note">Drop the silver from your hand on ${kHTML({ src: sqSrc(E.at(1, 3)), say: sqSay(E.at(1, 3)) }, { ro: true })}: the square, the piece, then ${J('[打|うつ]', { ruby: 'always' })}.</div>` })) return Q;
    applyMove(r.val.m, r.val.k, 0); PB.hi = []; bub('[王手|おうて] か 。 やる な 。', 'Check, eh. Not bad.'); if ((await next()) === 'quit') return Q;
    // promotion: a pawn must; a silver may (成) or may not (不成)
    p = E.fromRows(['....k', '..P..', '.....', '.....', 'K....'], 0, {}); setPos(p); PB.zone = true;
    bubKey('sg.c3.naru'); if ((await next()) === 'quit') return Q;
    bubKey('sg.c3.tokin'); m = mv(p, 7, 2, { pr: true }); PB.arrow = { f: 7, t: 2 };
    if (!await step(2, { kind: 'Promotion · 成る', want: m, gl: `<div class="sg-note">Your pawn steps into the far rank (the red row). Say the move with ${J('[成|なり]', { ruby: 'always' })} at the end.</div>` })) return Q;
    applyMove(r.val.m, r.val.k, 0); bubKey('sg.c3.must'); if ((await next()) === 'quit') return Q;
    p = E.fromRows(['....k', '..S..', '.....', '.....', 'K....'], 0, {}); setPos(p); PB.zone = true;
    bub('[今度|こんど] は [銀|ぎん] だ 。 [成|な]る か ？', 'Now a silver. Will you promote it?');
    setDots(total, 3); r = await askPhrase('ph.sg.naru', { kind: 'New · tell him first' }); if (r === 'quit') return Q; clean.push(r.clean);
    m = mv(p, 7, 2, { pr: true }); PB.arrow = { f: 7, t: 2 };
    if (!await step(4, { kind: 'Promotion · 成銀', want: m, gl: `<div class="sg-note">Promote the silver: it becomes a ${J('[成銀|なりぎん]', { ruby: 'always' })}, which moves like a gold.</div>` })) return Q;
    applyMove(r.val.m, r.val.k, 0); await wait(PB.fast ? 0 : 0.5);
    bubKey('sg.c3.narazu');
    p = E.fromRows(['k....', '...S.', '.....', '.....', '....K'], 0, {}); setPos(p); PB.zone = true;
    m = mv(p, 8, 3, { pr: false }); PB.arrow = { f: 8, t: 3 };
    if (!await step(5, { kind: 'Promotion · 不成', want: m, gl: `<div class="sg-note">This time it stays a silver (it keeps its step diagonally back). Say it with ${J('[不成|ならず]', { ruby: 'always' })}.</div>` })) return Q;
    applyMove(r.val.m, r.val.k, 0); PB.zone = false;
    // 二歩
    p = E.fromRows(['....k', '.....', '.....', '..P..', 'K....'], 0, { 0: 'P' }); setPos(p); PB.hiHand = 6; PB.hi = [E.at(2, 2)];
    bubKey('sg.c3.nifu');
    setDots(total, 6);
    r = await ask({ kind: 'Rules · can you?', gl: `<div class="sg-note">Can you drop your pawn on ${kHTML({ src: sqSrc(E.at(2, 2)), say: sqSay(E.at(2, 2)) }, { ro: true })}? Your other pawn is on the same file. Say why not.</div>`,
      answer: '二歩', roman: 'nifu', hints: [`Two pawns: ${J('[二歩|にふ]', { ruby: 'always' })} <i class="ro">nifu</i>`],
      check: t => (heardAny(t, ['[二歩|にふ]', 'だめ', '[反則|はんそく]', 'できない', 'いいえ']) >= 0 ? { ok: true, said: J('[二歩|にふ] 。 [反則|はんそく] 。') } : { why: 'Hm? Is it allowed? (Tab: a hint)' }) });
    if (r === 'quit') return Q; clean.push(r.clean); PB.hi = [];
    const legalDrop = E.legal(p).find(x => x.drop && x.p === 6 && E.col(x.t) === 3);
    if (!await step(7, { kind: 'Drop · somewhere allowed', ok: x => x.drop && x.p === 6, hint: legalDrop, pick: true, wrongWhy: 'Drop the pawn from your hand: the square, 歩, 打.',
      gl: '<div class="sg-note">Now drop it somewhere it’s allowed (any file but 3), and say it.</div>' })) return Q;
    applyMove(r.val.m, r.val.k, 0);
    // the promoted pieces' names
    bubKey('sg.c3.names'); if ((await next()) === 'quit') return Q;
    for (const [k, pr] of PROMS.entries()) {
      setDots(total, 8 + k);
      const q = E.fromRows(['.....', '.....', '.....', '.....', '.....'], 0, {}), sq = E.at(2, 2); setPos(q); q.b[sq] = pr.to; PB.dots = reachOf(pr.to, 2, 2);
      r = await askName({ kind: `New · ${pr.en}`, gl: `<div class="sg-big">${J(pr.ja, { ruby: 'always', mode: 'chars' })}</div><div class="sg-note">${esc(pr.how)} (the red dots). Say its name.</div>`, code: pr.to, src: pr.ja, placeholder: JP(pr.ja) });
      if (r === 'quit') return Q; clean.push(r.clean);
    }
    setDots(total, total); bubKey('sg.c3.end'); if ((await next()) === 'quit') return Q;
    return { clean };
  }
  const chapter3 = () => runChapter(3, lesson3, { name: 'Drops and promotion', teach: ['ph.sg.naru'] });

  // ================================================================ chapter 4: mate puzzles (詰将棋) and manners; the sign and the friend
  // (each puzzle checked by E.allMates: P1 the head gold, P2 the rook promotes to a dragon, P3 a rook drop then the gold)
  const PUZ = [
    { rows: ['....k', '.....', '....P', '.....', 'K....'], hand: 'G', plies: 1, gl: 'Mate in one. You have a gold in hand. (This one has a famous name: 頭金, “the gold on the head”.)' },
    { rows: ['k....', '.R...', '..R..', '.....', 'K....'], hand: '', plies: 1, gl: 'Mate in one. One of your rooks can reach the far rank… and become a dragon.' },
    { rows: ['...k.', '.s...', '.p.G.', '...B.', 'K....'], hand: 'R', plies: 3, gl: 'Mate in three: you, Shige, you. Every one of your moves must be check (王手). You have a rook in hand.' },
  ];
  async function lesson4() {
    const clean = [], total = 14; let r;
    panelOpen({ title: '詰将棋と礼儀 · Mate puzzles and manners', sub: 'Shige’s bench' });
    setPos(E.start());
    // the sign
    bubKey('sg.c4.sign'); setDots(total, 0);
    r = await ask({ kind: 'Read it · the board on the lantern post', gl: `<div class="sg-big" style="background:#c9a26a;border:4px solid #7a5236;border-radius:8px;padding:6px 10px">${J('[待|ま]った なし', { mode: 'chars', ruby: 'always' })}</div>`,
      answer: JC('[待|ま]った なし'), roman: JR('[待|ま]った なし'), hints: [esc(hintOf('[待|ま]った なし', 2)), `It says ${J('[待|ま]った なし', { ruby: 'always' })} <i class="ro">matta nashi</i>`],
      check: t => (heardAny(t, ['[待|ま]った なし', 'まったなし']) >= 0 ? { ok: true, said: J('[待|ま]った なし'), src: '[待|ま]った なし' } : { why: 'Read it out: the kana are what you hear.' }) });
    if (r === 'quit') return Q; clean.push(r.clean);
    for (const k of ['sg.c4.matta', 'sg.c4.tetsu', 'sg.c4.night', 'sg.c4.since']) { bubKey(k); if ((await next()) === 'quit') return Q; }
    // manners: the bow, the resignation, the thanks; check, and mate
    bubKey('sg.c4.rei'); if ((await next()) === 'quit') return Q;
    const IDS = ['ph.sg.onegai', 'ph.sg.mairimashita', 'ph.sg.arigatou', 'ph.sg.oute', 'ph.sg.tsumi', 'ph.sg.mattanashi'];
    for (const [k, id] of IDS.slice(0, 5).entries()) { setDots(total, 1 + k); r = await askPhrase(id); if (r === 'quit') return Q; clean.push(r.clean); }
    bub('[今|いま] は 、 [見|み]ないで 。', 'Now, without looking.');
    for (const [k, id] of shuffle(IDS.slice(0, 3)).entries()) { setDots(total, 6 + k); r = await askPhrase(id, { recall: true }); if (r === 'quit') return Q; clean.push(r.clean); }
    // 詰将棋
    bubKey('sg.c4.tsume'); if ((await next()) === 'quit') return Q;
    for (const [k, z] of PUZ.entries()) {
      const p = E.fromRows(z.rows, 0, { 0: z.hand }); setPos(p);
      bubKey(z.plies === 1 ? 'sg.c4.one' : 'sg.c4.three'); setDots(total, 9 + k);
      let mates = E.allMates(p, z.plies);
      r = await askMove({ kind: `詰将棋 · mate in ${z.plies === 1 ? 'one' : 'three'}`, ok: x => mates.some(y => same(x, y)), hint: mates[0], pick: true, wrongWhy: z.plies === 1 ? 'That isn’t mate: his king can still get away. Try another!' : 'That doesn’t catch him in three. Every move must be check!',
        gl: `<div class="sg-note">${esc(z.gl)}</div>` });
      if (r === 'quit') return Q; clean.push(r.clean); applyMove(r.val.m, r.val.k, 0);
      if (z.plies === 3) {
        await wait(PB.fast ? 0 : 0.7);
        const rep = pick(E.legal(p)), kr = kifu(rep, p, PB.last); applyMove(rep, kr, 1); bub(kr.src + ' 。', `«${JC(kr.src)}»: he runs.`);
        mates = E.allMates(p, 1); setDots(total, 12);
        r = await askMove({ kind: '詰将棋 · and now, mate', ok: x => mates.some(y => same(x, y)), hint: mates[0], pick: true, wrongWhy: 'Not mate yet. Look where his king could still go.', gl: '<div class="sg-note">He ran. Finish it: mate in one.</div>' });
        if (r === 'quit') return Q; clean.push(r.clean); applyMove(r.val.m, r.val.k, 0);
      }
      bubKey('sg.c4.mate'); if ((await next()) === 'quit') return Q;
    }
    setDots(total, total); bubKey('sg.c4.end'); if ((await next()) === 'quit') return Q;
    return { clean };
  }
  const chapter4 = () => runChapter(4, lesson4, { name: 'Mate puzzles and manners', coins: 8, teach: ['ph.sg.onegai', 'ph.sg.mairimashita', 'ph.sg.arigatou', 'ph.sg.oute', 'ph.sg.tsumi', 'ph.sg.mattanashi'] });

  // ================================================================ chapter 5: the evening game (本番), the Hush, the friend
  const HC = { even: { depth: 2, noise: 25, label: '平手 (an even game)' }, kaku: { depth: 2, noise: 45, label: '角落ち (without his bishop)' }, hisha: { depth: 1, noise: 60, label: '飛車落ち (without his rook)' } };
  async function chooseHandicap() {
    return UI.choose(`${JP(NAMES.sg)}: «${JP('[駒落|こまお]ち に する か ？')}» (Shall I take some pieces off?)`, [
      { label: `${JP('[飛車落|ひしゃお]ち')}: he plays without his rook`, sub: 'the gentlest game (the stronger player moves first)', value: 'hisha' },
      { label: `${JP('[角落|かくお]ち')}: he plays without his bishop`, sub: 'a little harder (he moves first)', value: 'kaku' },
      { label: `${JP('[平手|ひらて]')}: an even game`, sub: 'all his pieces; you move first', value: 'even' }]);
  }
  function startPos(hc) { const p = E.start(); if (hc === 'kaku') { p.b[E.at(0, 1)] = 0; p.turn = 1; } if (hc === 'hisha') { p.b[E.at(0, 0)] = 0; p.turn = 1; } return p; }
  async function shigeMove(o) {
    const p = PB.pos;
    await wait(PB.fast ? 0 : 0.7 + Math.random() * 0.9);
    const m = E.bestMove(E.clone(p), { depth: o.depth || 2, noise: o.noise === undefined ? 30 : o.noise, max: 40000 }); if (!m) return;
    const k = kifu(m, p, PB.last); applyMove(m, k, 1);
    const extra = E.inCheck(p, 0) ? pick(SAY.check) : m.cap ? pick(SAY.hisCap) : Math.random() < 0.3 ? pick(SAY.move) : null;
    bub(k.src + ' 。' + (extra ? ' ' + extra[0] : ''), `«${JC(k.src)}»${cmode() === 'roman' ? ' (' + JR(k.say).toLowerCase() + ')' : ''}${extra ? '. ' + extra[1] : ''}`);
  }
  // a real game in the panel → { result: 'win' | 'lose' | 'draw' | 'quit', clean, resigned }
  async function playGame(o) {
    const p = PB.pos, clean = []; let mine = 0;
    for (;;) {
      const s = E.status(p);
      if (s.over) return { result: s.winner === 0 ? 'win' : s.winner === 1 ? 'lose' : 'draw', clean, why: s.why };
      if (p.ply > 150) return { result: 'draw', clean, why: 'long' };
      if (p.turn === 1) { await shigeMove(o); if (PB.quit) return { result: 'quit', clean }; continue; }
      const hm = E.bestMove(E.clone(p), { depth: 2, noise: 0, max: 20000 }), hk = hm ? kifu(hm, p, PB.last) : null;
      const r = await askMove({ kind: s.check ? 'Your move · you’re in check (王手)!' : 'Your move · say it', pick: true, hint: hm, ok: () => true, resign: true,
        gl: '<div class="sg-note">Click a piece to see where it can go, then say your move: the square, the piece (and 打, 成 or 不成). Out of moves? Bow and say 参りました.</div>',
        hints: hm ? ['Perhaps this piece (orange)…', '…to the arrow’s square.', `Say ${kHTML(hk, { ro: true })}`] : [],
        onHint: n => { if (!hm) return; if (hm.f >= 0) PB.hi = [hm.f]; else PB.hiHand = hm.p; if (n >= 2) PB.arrow = { f: hm.f, t: hm.t, hand: hm.p }; } });
      if (r === 'quit') return { result: 'quit', clean };
      if (r.val.resign) return { result: 'lose', resigned: true, clean };
      clean.push(r.clean); applyMove(r.val.m, r.val.k, 0); mine++;
      if (r.val.m.cap && !E.status(p).over) bub(...pick(SAY.yourCap));
      if (o.onYourMove) { const x = await o.onYourMove(mine); if (x === 'quit') return { result: 'quit', clean }; }
    }
  }
  // the end of a game: whoever lost says 参りました; both say ありがとうございました → [clean…] or 'quit'
  async function endGame(g) {
    const clean = [];
    if (g.result === 'win') { bubKey('sg.c5.lost'); if ((await next()) === 'quit') return 'quit'; }
    else if (g.result === 'lose') {
      if (!g.resigned) { bub('', 'Your king is caught. End it the shogi way: bow, and say it.'); const r = await askPhrase('ph.sg.mairimashita', { recall: true, kind: 'Manners · the end of the game' }); if (r === 'quit') return 'quit'; clean.push(r.clean); }
      bubKey('sg.c5.won'); if ((await next()) === 'quit') return 'quit';
    } else { bubKey('sg.c5.draw'); if ((await next()) === 'quit') return 'quit'; }
    bubKey('sg.c5.thanks');
    const r2 = await askPhrase('ph.sg.arigatou', { recall: true, kind: 'Manners · after the game', sit: 'He bows: «ありがとうございました». Bow back and say it too.' }); if (r2 === 'quit') return 'quit'; clean.push(r2.clean);
    return clean;
  }
  // the Hush sits down in the empty seat: the lantern gutters, the characters fade from the pieces, Shige goes still.
  // Read the board aloud to him (name three of the pieces) and it lets go.
  async function hushBeat() {
    const p = PB.pos;
    B.hush.root.visible = true; B.hush.hidden = false; SC.hush = true;
    PB.hide = new Set(); for (let i = 0; i < 25; i++) if (p.b[i]) PB.hide.add(i);
    for (let i = 0; i <= 16; i++) { PB.fade = i / 16 * 0.92; G.fx.hush = i / 16 * 0.45; await wait(PB.fast ? 0 : 0.05); }
    bubKey('sg.c5.hush1'); PB.q.bub.innerHTML += '<i>Shige stares at the board and says nothing. The lantern gutters, and the characters on the pieces are fading away…</i>';
    if ((await next('▶ Enter')) === 'quit') return 'quit';
    const occ = [...PB.hide], k0 = occ.find(i => p.b[i] === -1), rest = shuffle(occ.filter(i => i !== k0 && Math.abs(p.b[i]) !== 1)).slice(0, 2), list = [k0].concat(rest).filter(i => i !== undefined);
    for (const sq of list) {
      PB.hi = [sq]; const v = p.b[sq], code = Math.abs(v), side = E.owner(v);
      const r = await askName({ kind: 'The Hush · read the board aloud', gl: `<div class="sg-note">The characters are fading. Read the board for him: what stands on the orange square, ${kHTML({ src: sqSrc(sq), say: sqSay(sq) }, { ro: true })}?</div>`, code, src: pSrc(code, side), placeholder: '…' });
      if (r === 'quit') return 'quit'; HB.clean.push(r.clean);
      PB.hide.delete(sq); PB.hi = []; sfx('chirp');
    }
    for (let i = 16; i >= 0; i--) { PB.fade = i / 16 * 0.92; G.fx.hush = i / 16 * 0.45; await wait(PB.fast ? 0 : 0.03); }
    PB.hide = null; PB.fade = 0; G.fx.hush = 0; B.hush.root.visible = false; B.hush.hidden = true; SC.hush = false;
    for (const k of ['sg.c5.back', 'sg.c5.seat', 'sg.c5.since', 'sg.c5.why', 'sg.c5.go']) { bubKey(k); if ((await next()) === 'quit') return 'quit'; }
    return 'ok';
  }
  const HB = { clean: [], done: false };
  async function chapter5() {
    const st = S(), first = !st.ch[5];
    SC.lit = true;
    await scene(async () => { standBy(); shotBench(); UI.chapter(JP('[本番|ほんばん]'), 'Shige’s bench · the evening game'); await wait(1.2); await sgSay('sg.c5.a'); await sgSay('sg.c5.koma'); });
    const hc = await chooseHandicap(); if (!hc) { SC.lit = false; return; }
    lock(true); SC.on = true; SC.sync = true;
    let clean = [], g = null, quit = false;
    HB.clean = []; HB.done = false;
    try {
      panelOpen({ title: '本番 · The evening game', sub: HC[hc].label });
      const p = startPos(hc); setPos(p); boardTop(p);
      bubKey('sg.c5.bow');
      let r = await askPhrase('ph.sg.onegai', { recall: true, kind: 'Manners · before the game', sit: 'He bows over the board: «お願いします». Bow back and say it too.' }); if (r === 'quit') { quit = true; return; } clean.push(r.clean);
      g = await playGame(Object.assign({}, HC[hc], { onYourMove: async n => { if (n === 4 && !HB.done) { HB.done = true; return hushBeat(); } return null; } }));
      if (g.result === 'quit') { quit = true; return; }
      clean = clean.concat(g.clean);
      if (!HB.done) { HB.done = true; if ((await hushBeat()) === 'quit') { quit = true; return; } }
      const e = await endGame(g); if (e === 'quit') { quit = true; return; } clean = clean.concat(e, HB.clean);
      r = await askPhrase('ph.sg.iishoubu', { kind: 'New · a kind word' }); if (r === 'quit') { quit = true; return; } clean.push(r.clean);
    } catch (e) { console.error('[shogi] chapter 5', e); quit = true; }
    finally { if (PB.open) panelClose(); SC.on = false; SC.sync = false; lock(false); G.fx.hush = 0; if (B) { B.hush.root.visible = false; B.hush.hidden = true; boardTop(B.game); } if (quit) SC.lit = false; }
    if (quit) return;
    st.rec.played++; st.rec[g.result === 'win' ? 'won' : g.result === 'lose' ? 'lost' : 'drawn']++;
    await reunion();
    st.ch[5] = true; const gr = gradeOf(clean); st.grade[5] = best(st.grade[5], gr); SC.lit = false;
    teachAll(['ph.sg.iishoubu']);
    if (first) coins(16 + (g.result === 'win' ? 4 : 0), `The evening game, grade ${gr}`); else UI.toast(`Grade ${gr} (best: ${st.grade[5]})`);
    if (G.save) G.save();
  }
  // Natsu brings her grandpa; two old friends make up; Shige's thanks
  async function reunion() {
    const st = S(), tS = makeTetsu(false), gy = B.gy;
    Object.assign(tS, { x: SPOT.tetsu.x, z: SPOT.tetsu.z, y: gy(SPOT.tetsu.x, SPOT.tetsu.z) }); tS.yaw = tS.baseYaw = Math.atan2(SEAT.sg.x - tS.x, SEAT.sg.z - tS.z); tS.faceAt = { x: SEAT.sg.x, z: SEAT.sg.z }; B.root.add(tS.root); B.extra.push(tS);
    let nk = null;
    try { if (typeof MATSURI !== 'undefined' && MATSURI._ && MATSURI._.makeNatsu) { nk = MATSURI._.makeNatsu(false); Object.assign(nk, { x: SPOT.natsu.x, z: SPOT.natsu.z, y: gy(SPOT.natsu.x, SPOT.natsu.z) }); nk.yaw = nk.baseYaw = Math.atan2(SEAT.sg.x - nk.x, SEAT.sg.z - nk.z); nk.nameSrc = NAMES.kid; B.root.add(nk.root); B.extra.push(nk); } } catch (e) { nk = null; }
    SC.lit = true;
    await scene(async () => {
      standAside(); shotWide();
      if (nk) { nk.pose = 'wave'; await say(nk, 'sg.c5.natsu'); nk.pose = 'idle'; }
      await say(tS, 'sg.c5.tetsu1'); B.sg.headTurn = 0.6; await sgSay('sg.c5.shige1');
      await say(tS, 'sg.c5.tetsu2'); await sgSay('sg.c5.shige2'); await say(tS, 'sg.c5.tetsu3'); B.sg.nod = 0.6; await sgSay('sg.c5.shige3'); B.sg.headTurn = 0;
      if (nk) { nk.pose = 'cheer'; await say(nk, 'sg.c5.yay'); nk.pose = 'idle'; }
      await UI.fade(1, 350); tS.root.visible = false; B.tt.root.visible = true; B.tt.hidden = false; await UI.fade(0, 350);
      shotShige(); SC.fan = true; B.sg.pose = 'hold'; await sgSay('sg.c5.gift');
      st.fan = true; st.fanOn = true; wearables(); shotMimo(); mimoHop(); UI.toast(`${mimoN()} wears Shige’s fan, «一歩», behind its ear!`); await wait(1.4);
      SC.fan = false; B.sg.pose = 'cards'; shotShige(); await sgSay('sg.c5.fu'); bag('k.sgFu');
      await sgSay('sg.c5.bye');
    });
    for (const p of [tS, nk]) if (p) { B.root.remove(p.root); B.extra = B.extra.filter(x => x !== p); }
  }
  // after chapter 5: a game whenever you like; say もう一局 for another
  async function freeGame() {
    const st = S(); let again = true;
    while (again) {
      again = false;
      const hc = await chooseHandicap(); if (!hc) return;
      lock(true); SC.on = true; SC.sync = true; SC.lit = true; let g = null;
      try {
        panelOpen({ title: '一局 · A game with Shige', sub: HC[hc].label });
        const p = startPos(hc); setPos(p); boardTop(p);
        bubKey('sg.c5.bow'); const r = await askPhrase('ph.sg.onegai', { recall: true, kind: 'Manners · before the game' }); if (r === 'quit') return;
        g = await playGame(HC[hc]); if (g.result === 'quit') return;
        if ((await endGame(g)) === 'quit') return;
        st.rec.played++; st.rec[g.result === 'win' ? 'won' : g.result === 'lose' ? 'lost' : 'drawn']++;
        bub('', `Games with Shige: ${st.rec.won} won · ${st.rec.lost} lost · ${st.rec.drawn} drawn. Another? Say it (or Esc).`);
        const r2 = await askPhrase('ph.sg.mouikkyoku', { kind: 'Another game?' });
        if (r2 !== 'quit') { again = true; teach('ph.sg.mouikkyoku'); }
      } finally { if (PB.open) panelClose(); SC.on = false; SC.sync = false; SC.lit = false; lock(false); if (B) boardTop(B.game); if (G.save) G.save(); }
    }
  }

  // ================================================================ the music (Sound.addSong; nothing in audio.js changes)
  // 'ja_shogi' «縁台ファイブ» (Endai Five, the bench's theme): jazz-funk in 5/4 (twenty sixteenths a bar, felt 2 + 3), 100 bpm, D dorian.
  //   A dry funk kit (kick on 1 and 3, snare on 2 and 5, ghosted side-sticks), a finger bass walking the 2 + 3, wah-guitar chops on
  //   the offbeats, a soft pad; a vibraphone with its motor turning sings the tune, and in the B section a koto answers it. The
  //   board's own sounds: a piece snapped down (パチン: woodblock + clave) at the end of each phrase, and the chess clock's tick-tock.
  //   Intro 2 (two pieces snapped down, the clock, a bass pickup) · A 8 (Dm9 G13 Dm9 G13 B♭maj7 A7 Dm9 A7♯9) · B 4 (Gm9 C13 Fmaj7
  //   A7sus4: the koto answers) · a 2-bar break, «thinking time» (just the clock, the kick and the bass; a vibes run back in).
  function addSongs() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const K0 = Sound.kit, N = s => K0.N(s), BAR = 20;
    const snap = (t, v = 1) => { K0.woodblock(t, true, 0.9 * v); K0.clave(t + 0.03, 0.5 * v); };
    const CHV = { Dm9: N('F3 A3 C4 E4'), G13: N('F3 B3 E4'), Bb: N('D3 F3 A3'), A7: N('G3 C#4 E4'), A7s9: N('G3 C4 C#4'), Gm9: N('F3 Bb3 D4 A4'), C13: N('E3 Bb3 D4 A4'), F: N('E3 A3 C4'), A7sus: N('G3 D4 E4') };
    const ROOT = { Dm9: 38, G13: 43, Bb: 46, A7: 45, A7s9: 45, Gm9: 43, C13: 36, F: 41, A7sus: 45 };
    const PROG = ['Dm9', 'G13', 'Dm9', 'G13', 'Bb', 'A7', 'Dm9', 'A7s9', 'Gm9', 'C13', 'F', 'A7sus'];
    const VIB = K0.mel('A5/2 C6/2 D6/4 r/2 F6/2 E6/2 D6/2 C6/4 | B5/2 D6/2 E6/6 r/2 D6/2 B5/2 A5/4 | A5/2 C6/2 D6/4 r/2 F6/2 G6/2 A6/4 G6/2 | F6/3 E6/3 D6/2 B5/2 D6/10 | D6/2 F6/2 A6/4 G6/2 F6/2 D6/4 C6/2 A5/2 | G5/2 A5/2 D6/4 E6/4 C#6/8 | D6/2 E6/2 F6/2 A6/4 G6/2 F6/2 E6/2 D6/4 | E6/4 r/2 C6/2 A5/12'
      + ' | Bb5/2 D6/2 F6/6 r/10 | E6/2 G6/2 A6/6 r/10 | A6/3 G6/3 F6/2 E6/2 C6/10 | D6/4 C#6/4 E6/4 r/8');
    const KOTO = K0.mel('r/20 r/20 r/20 r/20 r/20 r/20 r/20 r/20 | r/10 A5/2 G5/2 F5/2 D5/4 | r/10 G5/2 E5/2 D5/2 C5/4 | r/20 | r/12 E5/2 G5/2 A5/2 C6/2');
    const BL = [[0, 0, 3], [3, 12, 1], [6, 7, 2], [8, 0, 2], [11, 10, 1], [12, 0, 2], [15, 5, 1], [16, 7, 2]];
    Sound.addSong('ja_shogi', { bpm: 100, len: 320, from: 40, swing: 0.06, vol: 0.34, verb: 0.12, echo: 0.1, echoSteps: 3,
      play(i, t, s16) {
        const bar = Math.floor(i / BAR), s = i % BAR;
        if (bar < 2) {                    // the intro: two pieces snapped down, the clock, a bass pickup
          if (s === 0) snap(t, 1); if (bar === 1 && s === 10) snap(t, 0.8);
          if (s % 4 === 0 && s) K0.tick(t, (s / 4) % 2 === 0, 0.8);
          if (bar === 1) { const n = { 12: 45, 14: 48, 16: 50, 18: 52 }[s]; if (n) K0.fbass(n, t, s16 * 1.8, 0.9); }
          return;
        }
        if (bar >= 14) {                  // the break: thinking time (the clock, a pedal, the kick), a vibes run back in
          if (s % 4 === 0) K0.tick(t, (s / 4) % 2 === 0, 0.9);
          if (s === 0 || s === 8) K0.kick(t, 0.6);
          if (s === 0) K0.fbass(38, t, s16 * 7, 0.8);
          if (bar === 14 && s === 12) snap(t, 0.7);
          if (bar === 15 && s >= 15) K0.vibe([62, 64, 65, 67, 69][s - 15], t, 0.5, 0.8);
          return;
        }
        const pb = bar - 2, ch = PROG[pb], root = ROOT[ch], nextRoot = ROOT[PROG[(pb + 1) % PROG.length]];
        if (s === 0 || s === 8) K0.kick(t, 0.8); if (s === 3 || s === 14) K0.kick(t, 0.5);
        if (s === 4 || s === 16) K0.snare(t, 0.5); if (s === 7 || s === 11 || s === 18) K0.sidestick(t, 0.35);
        if (s % 2 === 0) K0.hat(t, s % 4 === 0 ? 0.5 : 0.35); else K0.hat(t, 0.16);
        if (s === 19 && pb % 2) K0.hat(t, 0.4, true);
        if (s === 0 && (pb === 0 || pb === 8)) K0.crash(t, 0.5);
        if (s === 12 && pb % 4 === 3) snap(t, 0.8);
        const b = BL.find(x => x[0] === s); if (b) K0.fbass(root + b[1], t, s16 * b[2] * 0.9, b[1] ? 0.75 : 0.95);
        if (s === 19) K0.fbass(nextRoot - 1, t, s16 * 0.8, 0.6);
        if (s === 2 || s === 6 || s === 10 || s === 13 || s === 17) K0.wahgtr(CHV[ch].map(m => m + 12), t, s === 13 ? 0.5 : 0.7, s16 * 1.2);
        if (s === 0) CHV[ch].forEach(m => K0.warmpad(m, t, s16 * 19, 0.5));
        const n = VIB[pb * BAR + s]; if (n) K0.vibe(n[0], t, Math.min(1.4, n[1] * s16 * 1.1), pb >= 8 ? 1 : 0.9);
        const k = KOTO[pb * BAR + s]; if (k) K0.koto(k[0], t, 0.8, 0.6);
      } });
  }

  // ================================================================ the menu
  const CH = [
    { n: 1, title: 'The pieces', sub: () => 'their names in kanji (王将 飛車 角行 金将 銀将 桂馬 香車 歩兵) and how they move', gate: f => !!f.rosa, wait: 'after Rosa’s welcome', run: () => chapter1(), again: 'The pieces again' },
    { n: 2, title: 'Saying moves', sub: () => 'squares by number: «２四歩» is に よん ふ; and 同', gate: f => !!f.boss, wait: 'after the big Hushling on the hill', run: () => chapter2(), again: 'Saying moves again' },
    { n: 3, title: 'Drops and promotion', sub: () => '持ち駒 and 打つ; 成る or 不成; と金 成銀 馬 龍; 二歩', gate: f => (f.bells || 0) >= 1, wait: 'after the first bell', run: () => chapter3(), again: 'Drops and promotion again' },
    { n: 4, title: 'Mate puzzles and manners', sub: () => '詰将棋 (王手, 詰み); お願いします, 参りました, ありがとうございました', gate: f => (f.bells || 0) >= 2, wait: 'after the second bell', run: () => chapter4(), again: 'Mate puzzles again' },
    { n: 5, title: 'The evening game', sub: () => 'a real game against Shige', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell', run: () => chapter5(), again: 'Play a game with Shige' },
  ];
  let talking = false;
  async function sgTalk() { if (talking) return; talking = true; try { await sgTalk0(); } finally { talking = false; } }
  async function sgTalk0() {
    const st = S(), f = flags();
    if (!st.met) return meet();
    const nx = CH.find(c => !st.ch[c.n]), opts = [];
    if (nx) opts.push(nx.gate(f) ? { label: `Chapter ${nx.n}: ${nx.title}`, sub: nx.sub(), value: 'next' } : { label: `Chapter ${nx.n}: ${nx.title}`, sub: `later: ${nx.wait}`, value: 'wait' });
    for (const c of CH) if (st.ch[c.n] && c.again) opts.push({ label: c.again, sub: c.n === 5 ? `${st.rec.won} won · ${st.rec.lost} lost · ${st.rec.drawn} drawn` : st.grade[c.n] ? `best grade: ${st.grade[c.n]}` : '', value: 'again' + c.n });
    opts.push({ label: 'Chat', value: 'chat' });
    if (st.fan) opts.push({ label: `${mimoN()}’s fan: ${fanOn() ? 'put it away' : 'tuck it behind its ear'}`, value: 'fan' });
    const v = await UI.choose(`${JP(NAMES.sg)}: «${JP('[一局|いっきょく] 、 どう だ ？')}» (A game, then?)`, opts);
    if (v === 'next') return nx.run();
    if (v === 'wait') return scene(async () => { standBy(); shotShige(); await sgSay('sg.wait'); });
    if (v === 'again5') return freeGame();
    if (v && v.startsWith('again')) return CH[+v.slice(5) - 1].run();
    if (v === 'chat') { st.chat = (st.chat || 0) + 1; const lines = st.ch[5] ? ['sg.chat1', 'sg.chat2', 'sg.chat3', 'sg.chat4', 'sg.chat5'] : ['sg.chat1', 'sg.chat2', 'sg.chat3']; return scene(async () => { standBy(); shotShige(); await sgSay(lines[st.chat % lines.length]); }); }
    if (v === 'fan') { st.fanOn = !fanOn(); sfx('pip'); UI.toast(st.fanOn ? `${mimoN()} tucks the fan behind its ear.` : 'Fan put away.'); if (G.save) G.save(); }
  }

  // ================================================================ talking to him (STORY.extra), the quest, the sign, the map
  const PROVIDER = {
    interactables() {
      if (!B || !shown() || ZHF.overlayOpen || PB.open || SC.on || (G.indoors && G.indoors())) return [];
      const Y = G.sim.you; if (Math.hypot(Y.x - SITE.x, Y.z - SITE.z) > 14) return [];
      return [{ x: SEAT.sg.x + 0.2, z: SEAT.sg.z + 0.5, y: B.ty, r: 1.9, label: 'Talk', run: sgTalk }];
    },
    tick(dt, Y) {
      if (!B || !shown()) return;
      const st = S();
      if (!st.seen0 && Math.hypot(Y.x - SITE.x, Y.z - SITE.z) < 9) { st.seen0 = true; think(`An old man in a summer jinbei sits on a bench across from an empty cushion and snaps a piece down on a little board: «${JP('パチン')}»`, 4.5); }
    },
  };
  function quest() {
    const y = s => s.sg || {}, ch = (s, n) => !!(y(s).ch && y(s).ch[n]), at = () => ({ x: SEAT.sg.x + 0.2, z: SEAT.sg.z + 0.5 });
    const step = (n, text, why, hint) => ({ get text() { const c = CH[n - 1]; return c && !c.gate(flags()) ? text : text.replace(/ \(after [^)]*\)$/, ''); }, why, done: s => ch(s, n), target: at, hint });
    return {
      id: 'sg', kind: 'side', title: 'Grandpa Shige’s shogi bench', giver: 'Shige, the old carpenter at the game corner',
      started: s => s.lang === 'ja' && !!y(s).met,
      steps: [
        step(1, 'Learn the shogi pieces with Shige (駒)', 'Their names in kanji, and how each one moves.', '{mimo} hops forward one square at a time, like a pawn.'),
        step(2, 'Saying moves (after the big Hushling on the hill)', 'Squares are numbers: «２四歩» is に よん ふ. And 同.', '{mimo} counts on its paws: ichi, ni, san…'),
        step(3, 'Drops and promotion (after the first bell)', 'Captured pieces change sides: 打つ, 成る, 不成, 二歩.', '{mimo} flips over, like a promoted piece.'),
        step(4, 'Mate puzzles and manners (after the second bell)', '詰将棋, 王手, 詰み; お願いします, 参りました, ありがとうございました.', '{mimo} bows very low.'),
        step(5, 'An evening game with Shige (after the third bell)', 'A real game of 5五将棋, and the empty seat across from him.', '{mimo} sits on the empty cushion, waiting.'),
      ],
      story: [
        { when: s => !!y(s).met, text: 'At the game corner, old Shige, a retired carpenter, plays shogi on a bench against an empty seat. He carved the board and every piece himself.' },
        { when: s => ch(s, 1), text: 'Shige taught you the pieces: 王将 and 玉将, 飛車, 角行, 金将, 銀将, 歩兵 (and the big board’s 桂馬 and 香車).' },
        { when: s => ch(s, 2), text: 'You learned to say moves the shogi way: the file, the rank, the piece. «２四歩» is に よん ふ; «同角» when you take back.' },
        { when: s => ch(s, 3), text: 'Captured pieces become yours to drop (打つ); pieces that reach the far rank promote (成る): と金, 成銀, 馬, 龍.' },
        { when: s => ch(s, 4), text: 'Mate puzzles, and shogi’s manners. And the story of the sign, 待ったなし: Shige and his best friend Tetsu haven’t spoken since one «待った!».' },
        { when: s => ch(s, 5), text: 'The evening game: the Hush sat in the empty seat until you read the board aloud. Then Natsu brought her grandpa Tetsu, and two old friends sat down again. {mimo} wears Shige’s fan, «一歩».' },
      ],
    };
  }
  const MARK = {};
  function mapMark(dpr) {
    if (!G || !B || !shown() || (G.indoors && G.indoors())) return null;
    if (!MARK[dpr]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = '#c49a52'; c.strokeStyle = '#2b2235'; c.lineWidth = 1.4; penta(c, s / 2, s / 2 + 0.5, s - 4, s - 3); c.fill(); c.stroke();
      c.fillStyle = '#1d1418'; c.font = `900 9px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('将', s / 2, s / 2 + 2);
      MARK[dpr] = cv;
    }
    return { x: SEAT.sg.x, z: SEAT.sg.z, img: MARK[dpr] };
  }

  // ================================================================ every notation string (the IME's dictionary; checked against CJK.md)
  const EXTRA = ['[始|はじ]めよう 。', '[一局|いっきょく] 、 どう だ ？', '[駒落|こまお]ち に する か ？', '[平手|ひらて]', '[角落|かくお]ち', '[飛車落|ひしゃお]ち', 'パチン', '[本番|ほんばん]',
    '[二歩|にふ]', '[反則|はんそく]', '[二歩|にふ] 。 [反則|はんそく] 。', 'だめ', 'できない', 'いいえ', '[待|ま]った なし', '[詰将棋|つめしょうぎ]', '[持|も]ち[駒|ごま]', '[棋譜|きふ]', '[将棋|しょうぎ]', '[扇子|せんす]', '[縁台|えんだい]',
    '[蚊遣|かや]り[豚|ぶた]', '[麦茶|むぎちゃ]', '[王将|おうしょう]', '[玉将|ぎょくしょう]', '[成|なり]', '[不成|ならず]', '[打|うつ]', '[同|どう]', '[王手|おうて]', '[参|まい]りました 。', 'まいりました', '[今|いま] は 、 [見|み]ないで 。',
    'その [銀|ぎん] を 、 ２ [二|に] に [打|う]って みろ 。', '[王手|おうて] か 。 やる な 。', '[今度|こんど] は [銀|ぎん] だ 。 [成|な]る か ？', '[同|どう] [金|きん] 。', '[王|おう]', '[玉|ぎょく]', '[一歩|いっぽ]', '[桂|けい]', '[香|きょう]'];
  function sources() {
    const out = [].concat(EXTRA, Object.values(NAMES), Object.values(LT).map(v => v.ja[0]), PH.map(p => p.ja), PH.flatMap(p => p.alt || []), ITEMS.map(i => i.ja),
      PIECES.flatMap(p => [p.full, ...p.alt]), PROMS.flatMap(p => [p.ja, ...p.alt]), Object.values(SAY).flat().map(x => x[0]), Object.keys(PNAME).map(t => pSrc(+t, 0)), ['[王|おう]'],
      Array.from({ length: 25 }, (_, i) => sqSrc(i)));
    return out.filter(Boolean);
  }
  function cjCheck() {
    if (!cj()) return [];
    const bad = [];
    for (const s of sources()) { const p = CJK.validate(s, 'ja'); if (p.length) bad.push({ src: s, problems: p }); }
    return bad;
  }

  // ================================================================ start
  function init(game) {
    G = game; ZHF.bind(game);
    if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v;
    registerIcons(); phrases();
    try { if (cj()) { CJK.addSource(sources(), 'ja'); if (CJK.addNames) CJK.addNames(['シゲ']); } } catch (e) { console.warn('[shogi] cjk', e); }
    try { addSongs(); } catch (e) { console.error('[shogi] songs', e); }
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'sg')) QUESTS.LIST.push(quest());
    if (typeof SIGNS !== 'undefined' && SIGNS.add) {
      const P = SPOT.post, look = { face: '#c9a26a', edge: '#7a5236' };
      SIGNS.add({ id: 'sg-plaque', x: P.x + 0.55, z: P.z + 0.45, r: 1.3, when: () => shown(),
        card: () => ({ tag: 'A board on the lantern post by Shige’s bench', lines: [{ text: '[待|ま]った なし', en: 'No take-backs. (Once a move is played, it stays played.)', look }] }) });
    }
    setInterval(() => { if (shown()) keepFar(); }, 30000);
  }

  // ================================================================ tests (the game never calls these): SHOGI._.t
  const TEST = {
    fast(on = true) { PB.fast = on; },
    setup(fl) { Object.assign(G.state.flags, { hatched: true, rosa: true }, fl || {}); if (typeof Sound !== 'undefined') Sound.music = false; return S(); },
    // answer whatever the panel is asking (o.roman: in rōmaji; o.wrong: a wrong answer first)
    panel(roman) {
      if (PB.cur && PB.cur.submit) { const a = (roman ? String(PB.cur.roman || '').toLowerCase() : PB.cur.answer) || 'x'; PB.cur.submit(a); return 'panel: ' + a; }
      return null;
    },
    drive(o = {}) { return ZHF.drive(Object.assign({ panel: () => TEST.panel(o.roman), busy: () => PB.open || SC.on }, o)); },
    run(n) { STORY.run(() => (n === 0 ? meet() : n === 6 ? freeGame() : CH[n - 1].run())); },
    get PB() { return PB; }, get B() { return B; }, get SC() { return SC; }, get HB() { return HB; },
  };
  return {
    init, build, update, quest, mapMark, fanOn,
    get busy() { return PB.open || SC.on; },
    _: { E, S: () => S(), LT, PH, PIECES, PROMS, PUZ, NAMES, SITE, SEAT, SPOT, toks, parseMove, readMove, kifu, pieceIn, squareIn, sqSrc, heardAny, sources, cjCheck, CH,
      meet, chapter1, chapter2, chapter3, chapter4, chapter5, freeGame, reunion, hushBeat, playGame, panelOpen, panelClose, setPos, boardTop, PROVIDER, t: TEST },
  };
})();
