'use strict';
// Don Fello's domino table: a Spanish-only side quest (Spanish games only: G.state.lang === 'es'; everything is hidden otherwise).
// On Alba's west side, under a flamboyán tree, outside Doña Nena's colmado (a Dominican corner store), old Don Rafael «Fello»
// Peña («El Martillo»: he slams his tiles) plays dominoes with his regulars, Doña Nena and Yunior, the colmado's delivery guy.
// The chair across from him is empty: his partner of forty years, Don Chago, went hushed after a mistake in a final, and
// sits alone by the wall. The quest («La mesa de Don Fello»), five chapters gated like every side character (Rosa's
// welcome, the big Hushling, bells 1, 2, 3; a chapter you've started stays open, so old saves carry on where they were):
//   1. La escuelita: meet them; Don Fello's lessons 1–2 of Dominican Spanish (greetings, the table calls), typed back (echo,
//      then recall from a situation). Phrases are kind 'phrase', region 'República Dominicana'.
//   2. La silla vacía: beat Doña Nena and Yunior at partnership dominoes (you and Mimo across from each other); the story of
//      the empty chair; lesson 3, Don Chago's favourite expressions.
//   3. Las palabras de Chago: give Chago his words back (you say them to him), then beat Don Fello and Don Chago, back
//      together. Prize: Fello's lucky tile (the double six, a key item), which Doña Nena strings around Mimo's neck.
//   4. El colmado (new, 2026-11-13): lesson 4 (the barrio), lesson 5 with Doña Nena (the colmado's words), then you mind her
//      counter for an afternoon: Maritza sent by her mom («fiao»), Doña Carmen (prices, «la ñapa»), Toño («un morir
//      soñando»), Doña Fefa on the phone («ahorita»; send Yunior). The Hush kills the radio; «¡Súbele!», «¡Vamos pa'l
//      coro!», «¿Qué lo que?» bring the street back, and everybody dances bachata under the flamboyán.
//   5. La final del barrio (new): lesson 6 with Chago (the words of a final), then the barrio's first tournament since the
//      final Chago lost. The Hush sends a pair, Don Nadie and Doña Nada, who play in silence; you play with Chago as your
//      partner (Fello keeps score) and call the score in Spanish between hands. Win, and your words chase them off.
//      Prize: la copa del barrio (a key item), coins.
// After that: rematches against either pair, to 50, 100 or 200, with your record kept. The song: «Bachata del Flamboyán»
// (dm_bachata), on the colmado's radio once chapter 4 is done.
//
// Dominoes, Dominican style (the house rules, as Dominican sources describe them; see RULES): the double-six set, two pairs,
// 7 tiles each, play to the right (counterclockwise); the first hand opens with the double six, later hands with whoever won
// the last one; «¡Paso!» when you can't play; «¡Dominó!» when you play your last tile: your pair scores the pips left in the
// rivals' hands; «¡Capicúa!» (the last tile fits both ends): +25, but only if you call it; «pase corrido» (you play and all
// three others pass): +10; «¡Tranque!» (nobody can play): the player who locked it counts against the player on their right,
// the lower count wins the rivals' pips (a tie: nobody scores); first pair to 100 (or 200) wins; losers with 0: «¡pollona!».
// Before each hand somebody «da agua» (shuffles the tiles face down, like stirring water): the pair that lost the last hand.
//
// One global, DOMINO:
//   DOMINO.init(game)                      after main built the world: words, phrases, icons, lines, the quest (QUESTS.LIST)
//   DOMINO.build(scene, { terrainAt })     → { colliders (WORLD.addSolids format, live: moved away outside Spanish games),
//                                               group, people (live { x, z, y, top, r, name, talking, hushed }), update(dt, t, you|null), stats() }
//   DOMINO.interactables()                 → [{ x, z, y, r, label, run }] (nothing outside Spanish games)
//   DOMINO.busy                            true while the board or a lesson is open (state.teaching is set too: the world waits)
//   DOMINO.enabled()                       a Spanish game, after the hatching
//   DOMINO.quest()                         the quests.js entry (init adds it)
//   plain data for world.js (optional):    DOMINO.keepClear(x, z, pad), DOMINO.bareAt(x, z), DOMINO.site
// Progress lives in state.domino; the prize in state.flags.luckyTile and state.bag['k.luckyTile'].
// Needs THREE (r128), core.js, toonkit.js, lexicon.js, lines.js and icons.js at load; UI, STORY, QUESTS, WORLD and Sound at run time.

const DOMINO = (() => {
  // ================================================================ the rules (pure: no DOM, no THREE)
  const TILE = [];                                   // id → [a, b] with a ≤ b; 28 tiles, the double six is the last
  for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) TILE.push([a, b]);
  const NT = TILE.length;
  const TA = TILE.map(t => t[0]), TB = TILE.map(t => t[1]), PIP = TILE.map(t => t[0] + t[1]);
  const DBL = TILE.map(t => t[0] === t[1]), MASK = TILE.map(t => (1 << t[0]) | (1 << t[1]));
  const IDOF = new Array(49); TILE.forEach(([a, b], i) => { IDOF[a * 7 + b] = IDOF[b * 7 + a] = i; });
  const tid = (a, b) => IDOF[a * 7 + b], D66 = tid(6, 6);
  const has = (id, n) => TA[id] === n || TB[id] === n;
  const other = (id, n) => (TA[id] === n ? TB[id] : TA[id]);
  const team = s => s & 1, partner = s => (s + 2) & 3, nextSeat = s => (s + 1) & 3;   // seats: 0 you (south), 1 east, 2 your partner (north), 3 west
  const pipsOf = h => { let n = 0; for (const id of h) n += PIP[id]; return n; };
  const RULES = { capicua: 25, pase: 10 };
  const tileName = id => `${TA[id]}|${TB[id]}`;

  function shuffleInPlace(a, rnd) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // dar agua: the tiles face down, swirled, then 7 each
  function deal(rnd) { const a = shuffleInPlace(Array.from({ length: NT }, (_, i) => i), rnd); return [0, 1, 2, 3].map(s => a.slice(s * 7, s * 7 + 7)); }
  // one hand: hands (4 × 7 ids), ends L/R (−1 before the lead), what's out (per number, how many of its 7 tiles are on the table),
  // voids (per seat: numbers they showed they don't have, by passing), the pase corrido bonus per pair, display chains and a log
  function newHand(hands, leader, first) {
    return { hands: hands.map(h => h.slice()), L: -1, R: -1, center: -1, turn: leader, leader, first: !!first, passes: 0, last: -1,
      out: new Int8Array(7), played: new Uint8Array(NT), voids: [0, 0, 0, 0], bonus: [0, 0], chains: [[], []], log: [], over: null };
  }
  // a cheap copy for the AI's simulations (no display chains, no log)
  function cloneLite(H) {
    return { hands: H.hands.map(h => h.slice()), L: H.L, R: H.R, center: H.center, turn: H.turn, leader: H.leader, first: H.first, passes: H.passes, last: H.last,
      out: H.out.slice(), played: H.played.slice(), voids: H.voids.slice(), bonus: H.bonus.slice(), chains: null, log: null, over: null };
  }
  // the legal moves: { id, side } (side −1: the lead, 0: the left end, 1: the right end). With both ends the same number,
  // either side is the same move (the AI gets one; the board offers both only when `both`)
  function legal(H, s, both) {
    const h = H.hands[s], out = [];
    if (H.over) return out;
    if (H.center < 0) {
      if (H.first) { if (h.includes(D66)) out.push({ id: D66, side: -1 }); return out; }     // the first hand opens with the double six
      for (const id of h) out.push({ id, side: -1 });
      return out;
    }
    for (const id of h) {
      const l = has(id, H.L), r = has(id, H.R);
      if (l) out.push({ id, side: 0 });
      if (r && (both || H.L !== H.R || !l)) out.push({ id, side: 1 });
    }
    return out;
  }
  function play(H, s, mv) {
    const id = mv.id, h = H.hands[s], i = h.indexOf(id);
    if (H.over || H.turn !== s || i < 0) throw new Error(`[domino] not a legal play: seat ${s}, tile ${tileName(id)}`);
    if (H.center >= 0 && !(mv.side === 0 ? has(id, H.L) : mv.side === 1 ? has(id, H.R) : false)) throw new Error(`[domino] ${tileName(id)} doesn't fit that end`);
    if (H.center < 0 && H.first && id !== D66) throw new Error('[domino] the first hand opens with the double six');
    const before = [H.L, H.R];
    h.splice(i, 1);
    H.played[id] = 1; H.out[TA[id]]++; if (!DBL[id]) H.out[TB[id]]++;
    if (H.center < 0) { H.center = id; H.L = TA[id]; H.R = TB[id]; H.first = false; }
    else if (mv.side === 0) { const to = other(id, H.L); if (H.chains) H.chains[0].push({ id, from: H.L, to, seat: s }); H.L = to; }
    else { const to = other(id, H.R); if (H.chains) H.chains[1].push({ id, from: H.R, to, seat: s }); H.R = to; }
    if (H.log) H.log.push({ seat: s, id, side: mv.side, before });
    H.last = s; H.passes = 0;
    if (!h.length) {         // ¡dominó! (a capicúa when the last tile, not a double, fit both ends)
      H.over = { kind: 'domino', seat: s, id, capicua: before[0] >= 0 && !DBL[id] && has(id, before[0]) && has(id, before[1]) };
      return H;
    }
    if (H.out[H.L] === 7 && H.out[H.R] === 7) { H.over = { kind: 'tranque', seat: s, id }; return H; }     // nobody holds either number: locked
    H.turn = nextSeat(s);
    return H;
  }
  // «¡Paso!»: everyone now knows you have neither end's number. Three passes in a row back to whoever played last: a pase corrido
  function pass(H, s) {
    if (H.over || H.turn !== s) throw new Error('[domino] not your turn to pass');
    H.voids[s] |= (1 << H.L) | (1 << H.R);
    if (H.log) H.log.push({ seat: s, pass: true, before: [H.L, H.R] });
    H.passes++;
    H.turn = nextSeat(s);
    if (H.passes === 3 && H.turn === H.last) {
      H.bonus[team(H.last)] += RULES.pase;
      if (H.log) H.log.push({ seat: H.last, pase: RULES.pase });
      return RULES.pase;
    }
    return 0;
  }
  // The hand's result. o.called === false: the player who dominated with a capicúa didn't call it (it isn't paid).
  //   domino: the winner's pair scores the pips left in the two rivals' hands (+25 for a called capicúa); they lead next
  //   tranque: the player who locked it (T) against the player on T's right (R): the lower count wins the other pair's pips,
  //            and leads next; a tie scores nothing and the same player leads again
  function result(H, o = {}) {
    const ov = H.over, counts = H.hands.map(pipsOf);
    let wt = -1, pts = 0, next = H.leader, vs = -1, paid = false;
    if (ov.kind === 'domino') {
      wt = team(ov.seat); pts = counts[nextSeat(ov.seat)] + counts[(ov.seat + 3) & 3]; next = ov.seat;
      paid = ov.capicua && o.called !== false;
      if (paid) pts += RULES.capicua;
    } else {
      const T = ov.seat, R = nextSeat(T); vs = R;
      if (counts[T] < counts[R]) { wt = team(T); pts = counts[R] + counts[partner(R)]; next = T; }
      else if (counts[T] > counts[R]) { wt = team(R); pts = counts[T] + counts[partner(T)]; next = R; }
    }
    return { kind: ov.kind, seat: ov.seat, id: ov.id, vs, team: wt, pts, capicua: ov.kind === 'domino' && ov.capicua, paid, counts, bonus: H.bonus.slice(), next };
  }
  // a match: two pairs, first to the target
  const newMatch = target => ({ target, scores: [0, 0], hands: 0, next: -1, over: null, log: [] });
  function startHand(M, rnd, hands) {
    hands = hands || deal(rnd);
    const first = M.hands === 0;
    return newHand(hands, first ? hands.findIndex(h => h.includes(D66)) : M.next, first);
  }
  function endHand(M, r) {
    M.hands++;
    M.scores[0] += r.bonus[0]; M.scores[1] += r.bonus[1];
    if (r.team >= 0) M.scores[r.team] += r.pts;
    M.next = r.next; M.log.push(r);
    const a = M.scores[0] >= M.target, b = M.scores[1] >= M.target;
    if (a || b) {
      const win = a && b ? (r.team >= 0 ? r.team : M.scores[0] >= M.scores[1] ? 0 : 1) : a ? 0 : 1;
      M.over = { team: win, pollona: M.scores[1 - win] === 0, scores: M.scores.slice() };
    }
    return M.over;
  }

  // ================================================================ the players
  // What a seat knows: its own hand, the table, the ends, everyone's tile count and who passed on what (voids).
  // The expected pips in seat q's hand as seen from seat s (each unknown tile spread over the seats that could hold it)
  function expectedPips(H, s, q) {
    const own = H.hands[s];
    let sum = 0;
    for (let t = 0; t < NT; t++) {
      if (H.played[t] || own.includes(t)) continue;
      let tot = 0, mine = 0;
      for (let k = 0; k < 4; k++) { const c = H.hands[k].length; if (k === s || !c || (MASK[t] & H.voids[k])) continue; tot += c; if (k === q) mine = c; }
      if (tot) sum += PIP[t] * mine / tot;
    }
    return sum;
  }
  // The table sense every decent player has: dump heavy tiles and doubles early, keep a tile for next turn, leave ends you're
  // strong in, don't hang your own double («ahorcar»), shut out the next rival when they've shown they can't follow, don't shut
  // out your partner, and only lock the game when you count less than the player on your right.
  const WEIGHTS = {
    roll:   { heavy: 1, dbl: 5, keep: 3, ctrl: 1.5, hang: 10, track: 1, shut: 7, shutP: 6, lockGood: 25, lockBad: 35, lockMargin: 0, noise: 1.5 },
    mimo:   { heavy: 1, dbl: 5, keep: 3, ctrl: 1.5, hang: 10, track: 1, shut: 7, shutP: 6, lockGood: 25, lockBad: 35, lockMargin: 0, noise: 2.5 },
    chago:  { heavy: 1, dbl: 5, keep: 3, ctrl: 1.8, hang: 12, track: 1, shut: 8, shutP: 6, lockGood: 25, lockBad: 35, lockMargin: 1, noise: 1 },
    nena:   { heavy: 1, dbl: 3, keep: 2, ctrl: 1, hang: 0, track: 0, lockGood: 8, lockBad: 8, lockMargin: 0, noise: 7 },
    yunior: { heavy: 1.6, dbl: 1, keep: 0.5, ctrl: 0, hang: 0, track: 0, lockGood: 0, lockBad: 0, lockMargin: 0, noise: 10, wild: 0.3 },
  };
  function heurScore(H, s, m, W, rnd) {
    const h = H.hands[s], id = m.id;
    if (h.length === 1) return 1e6;
    let L = H.L, R = H.R;
    if (m.side < 0) { L = TA[id]; R = TB[id]; } else if (m.side === 0) L = other(id, L); else R = other(id, R);
    let sc = PIP[id] * W.heavy + (DBL[id] ? W.dbl : 0);
    const suit = [0, 0, 0, 0, 0, 0, 0];
    let fit = 0, left = 0;
    for (const t of h) {
      if (t === id) continue;
      left += PIP[t]; suit[TA[t]]++; if (!DBL[t]) suit[TB[t]]++;
      if (has(t, L) || has(t, R)) fit++;
    }
    sc += Math.min(fit, 2) * W.keep + (suit[L] + (L === R ? 0 : suit[R])) * W.ctrl;
    const outA = n => H.out[n] + (has(id, n) ? 1 : 0);
    if (outA(L) === 7 && outA(R) === 7) sc += left < expectedPips(H, s, nextSeat(s)) - W.lockMargin ? W.lockGood : -W.lockBad;
    if (W.hang) for (const t of h) if (t !== id && DBL[t]) { const n = TA[t]; if (outA(n) >= 6 && L !== n && R !== n) sc -= W.hang; }
    if (W.track) {
      const vN = H.voids[nextSeat(s)], vP = H.voids[partner(s)];
      if (((vN >> L) & 1) && ((vN >> R) & 1)) sc += W.shut;
      if (((vP >> L) & 1) && ((vP >> R) & 1)) sc -= W.shutP;
    }
    if (W.noise) sc += (rnd() - 0.5) * W.noise;
    return sc;
  }
  function bestHeur(H, s, moves, W, rnd) {
    let best = moves[0], bs = -Infinity;
    for (const m of moves) { const v = heurScore(H, s, m, W, rnd); if (v > bs) { bs = v; best = m; } }
    return best;
  }
  // Don Fello: he counts. For each move he deals the unknown tiles many ways that fit everything the table has shown (who
  // holds how many, who passed on what), plays each deal out to the end, and keeps the move that does best on average
  // (points, and the match: a hand that wins it, or loses it, counts extra).
  function sampleHands(H, s, unknown, need, rnd) {
    const ok = (t, q, cap) => q !== s && cap[q] > 0 && !(MASK[t] & H.voids[q]);
    const order = unknown.map(t => { let e = 0; for (let q = 0; q < 4; q++) if (ok(t, q, need)) e++; return { t, e, r: rnd() }; });
    for (let tries = 0; tries < 8; tries++) {
      order.sort((a, b) => a.e - b.e || a.r - b.r);
      const hands = [[], [], [], []], cap = need.slice();
      let good = true;
      for (const { t } of order) {
        let tot = 0; for (let q = 0; q < 4; q++) if (ok(t, q, cap)) tot += cap[q];
        if (!tot) { good = false; break; }
        let x = rnd() * tot, pick = -1;
        for (let q = 0; q < 4 && pick < 0; q++) if (ok(t, q, cap)) { x -= cap[q]; if (x < 0) pick = q; }
        if (pick < 0) for (let q = 3; q >= 0 && pick < 0; q--) if (ok(t, q, cap)) pick = q;
        hands[pick].push(t); cap[pick]--;
      }
      if (good) return hands;
      for (const o of order) o.r = rnd();
    }
    const hands = [[], [], [], []], cap = need.slice();            // (the passes didn't fit: shouldn't happen; deal plainly)
    for (const t of shuffleInPlace(unknown.slice(), rnd)) for (let q = 0; q < 4; q++) if (q !== s && cap[q] > 0) { hands[q].push(t); cap[q]--; break; }
    return hands;
  }
  function rollout(G, rnd) {
    let guard = 0;
    while (!G.over && guard++ < 200) {
      const q = G.turn, mv = legal(G, q, false);
      if (!mv.length) pass(G, q); else play(G, q, mv.length === 1 ? mv[0] : bestHeur(G, q, mv, WEIGHTS.roll, rnd));
    }
    return G;
  }
  function valueFor(G, s, M) {
    const r = result(G), my = team(s);
    let v = r.bonus[my] - r.bonus[1 - my] + (r.team === my ? r.pts : r.team >= 0 ? -r.pts : 0);
    if (M) {
      const mine = M.scores[my] + r.bonus[my] + (r.team === my ? r.pts : 0), theirs = M.scores[1 - my] + r.bonus[1 - my] + (r.team === 1 - my ? r.pts : 0);
      if (mine >= M.target && theirs < M.target) v += 60; else if (theirs >= M.target && mine < M.target) v -= 60;
    }
    return v;
  }
  function pimc(H, s, moves, samples, rnd, M) {
    const cand = [], seen = new Set();
    for (const m of moves) {
      let L = H.L, R = H.R;
      if (m.side < 0) { L = TA[m.id]; R = TB[m.id]; } else if (m.side === 0) L = other(m.id, L); else R = other(m.id, R);
      const k = m.id + ':' + Math.min(L, R) + ',' + Math.max(L, R);
      if (!seen.has(k)) { seen.add(k); cand.push(m); }
    }
    if (cand.length === 1) return cand[0];
    const unknown = [];
    for (let t = 0; t < NT; t++) if (!H.played[t] && !H.hands[s].includes(t)) unknown.push(t);
    const need = [0, 1, 2, 3].map(q => (q === s ? 0 : H.hands[q].length));
    const val = new Float64Array(cand.length);
    for (let k = 0; k < samples; k++) {
      const dealt = sampleHands(H, s, unknown, need, rnd);
      for (let i = 0; i < cand.length; i++) {
        const G = cloneLite(H);
        for (let q = 0; q < 4; q++) if (q !== s) G.hands[q] = dealt[q].slice();
        play(G, s, cand[i]);
        val[i] += valueFor(rollout(G, rnd), s, M);
      }
    }
    let bi = 0;
    for (let i = 1; i < cand.length; i++) if (val[i] > val[bi] + 1e-9 || (Math.abs(val[i] - val[bi]) < 1e-9 && PIP[cand[i].id] > PIP[cand[bi].id])) bi = i;
    return cand[bi];
  }
  const CFG = { felloSamples: 140, chagoSamples: 60, hintSamples: 50, hushSamples: 40 };       // (Chago counts too, a little less; 0: he plays by feel. The Hush's pair: hush)
  // pick a move for a kind of player: 'fello' (counts everything), 'chago', 'mimo', 'nena', 'yunior' (plays fast and loose),
  // 'random', or 'hint' (what Mimo would whisper to you)
  function policyMove(kind, H, s, moves, rnd, M) {
    if (moves.length === 1) return moves[0];
    if (kind === 'random') return moves[Math.floor(rnd() * moves.length)];
    if (kind === 'fello') return pimc(H, s, moves, CFG.felloSamples, rnd, M);
    if (kind === 'hint') return pimc(H, s, moves, CFG.hintSamples, rnd, M);
    if (kind === 'chago' && CFG.chagoSamples) return pimc(H, s, moves, CFG.chagoSamples, rnd, M);
    if (kind === 'hush') return CFG.hushSamples ? pimc(H, s, moves, CFG.hushSamples, rnd, M) : bestHeur(H, s, moves, WEIGHTS.roll, rnd);
    const W = WEIGHTS[kind] || WEIGHTS.mimo;
    if (W.wild && rnd() < W.wild) return moves[Math.floor(rnd() * moves.length)];
    return bestHeur(H, s, moves, W, rnd);
  }
  // headless matches, for tests: pols = a kind per seat [you, east, partner, west]
  function simMatch(pols, target, rnd) {
    const M = newMatch(target), st = { hands: 0, capicuas: 0, tranques: 0, ties: 0, pases: 0 };
    let guard = 0;
    while (!M.over && guard++ < 200) {
      const H = startHand(M, rnd);
      while (!H.over) {
        const s = H.turn, mv = legal(H, s, false);
        if (!mv.length) { if (pass(H, s)) st.pases++; } else play(H, s, policyMove(pols[s], H, s, mv, rnd, M));
      }
      const r = result(H);
      if (r.kind === 'tranque') { st.tranques++; if (r.team < 0) st.ties++; }
      if (r.capicua) st.capicuas++;
      endHand(M, r); st.hands++;
    }
    return Object.assign({ winner: M.over ? M.over.team : -1, scores: M.scores.slice(), pollona: !!(M.over && M.over.pollona) }, st);
  }
  function simMany(n, pols, target = 100, seed = 1) {
    const rnd = rng(seed), out = { n, wins: [0, 0], pollonas: [0, 0], hands: 0, capicuas: 0, tranques: 0, ties: 0, pases: 0, ms: 0 };
    const t0 = performance.now();
    for (let i = 0; i < n; i++) {
      // swap the pairs' seats every other match (who sits where changes who leads after whom)
      const flip = i % 2 === 1, p = flip ? [pols[1], pols[0], pols[3], pols[2]] : pols;
      const r = simMatch(p, target, rnd), w = flip ? 1 - r.winner : r.winner;
      out.wins[w]++; if (r.pollona) out.pollonas[w]++;
      out.hands += r.hands; out.capicuas += r.capicuas; out.tranques += r.tranques; out.ties += r.ties; out.pases += r.pases;
    }
    out.ms = Math.round(performance.now() - t0);
    out.rate = +(out.wins[0] / n).toFixed(3);
    out.handsPerMatch = +(out.hands / n).toFixed(2);
    return out;
  }
  // exact-rules checks (deterministic): returns [{ name, ok, got }]
  function selfTest() {
    const T = [];
    const ok = (name, cond, got) => T.push({ name, ok: !!cond, got });
    const ids = s => s.split(' ').map(x => tid(+x[0], +x[2]));
    // the set
    ok('28 tiles, 7 of each number', NT === 28 && [0, 1, 2, 3, 4, 5, 6].every(n => TILE.filter(t => t[0] === n || t[1] === n).length === 7), NT);
    ok('168 pips in the set', TILE.reduce((a, t) => a + t[0] + t[1], 0) === 168);
    // the first hand opens with the double six
    { const hands = [ids('0-0 0-1 0-2 0-3 0-4 0-5 0-6'), ids('1-1 1-2 1-3 1-4 1-5 1-6 2-2'), ids('2-3 2-4 2-5 2-6 3-3 3-4 3-5'), ids('3-6 4-4 4-5 4-6 5-5 5-6 6-6')];
      const M = newMatch(100), H = startHand(M, null, hands), mv = legal(H, H.turn, true);
      ok('first hand: the double-six holder leads', H.turn === 3, H.turn);
      ok('first hand: only the double six is legal', mv.length === 1 && mv[0].id === D66, mv.map(m => tileName(m.id))); }
    // a capicúa: ends 3 and 5, last tile 3|5
    { const H = newHand([ids('3-5'), ids('1-1 1-2'), ids('2-2'), ids('0-0')], 0, false);
      H.center = tid(3, 6); H.L = 3; H.R = 5; H.played[H.center] = 1; H.out[3] = 1; H.out[6] = 1;
      play(H, 0, { id: tid(3, 5), side: 0 }); const r = result(H);
      ok('capicúa detected', H.over.kind === 'domino' && H.over.capicua, H.over);
      ok('capicúa paid: rivals\' pips + 25', r.team === 0 && r.pts === (2 + 3 + 0) + 25, r.pts);
      const r2 = result(H, { called: false });
      ok('an uncalled capicúa isn\'t paid', r2.pts === 5 && !r2.paid, r2.pts); }
    // not a capicúa: the last tile fits one end only; and a double never is
    { const H = newHand([ids('3-4'), ids('1-1'), ids('2-2'), ids('0-0')], 0, false);
      H.center = tid(3, 6); H.L = 3; H.R = 6; H.played[H.center] = 1; H.out[3] = 1; H.out[6] = 1;
      play(H, 0, { id: tid(3, 4), side: 0 });
      ok('one end only: dominó, no capicúa', H.over.kind === 'domino' && !H.over.capicua, H.over); }
    { const H = newHand([ids('5-5'), ids('1-1'), ids('2-2'), ids('0-0')], 0, false);
      H.center = tid(5, 6); H.L = 5; H.R = 5; H.played[H.center] = 1; H.out[5] = 1; H.out[6] = 1;
      play(H, 0, { id: tid(5, 5), side: 0 });
      ok('a double is never a capicúa', H.over.kind === 'domino' && !H.over.capicua, H.over); }
    // the domino scores only the rivals' tiles (the partner's don't count)
    { const H = newHand([ids('0-1'), ids('6-6 5-5'), ids('4-4 4-5'), ids('3-3')], 0, false);
      H.center = tid(1, 2); H.L = 1; H.R = 2; H.played[H.center] = 1; H.out[1] = 1; H.out[2] = 1;
      play(H, 0, { id: tid(0, 1), side: 0 }); const r = result(H);
      ok('dominó: the rivals\' pips (22 + 6)', r.team === 0 && r.pts === 28 && r.next === 0, r); }
    // the tranque: the locker against the player on their right
    const lockHand = (h0, h1, h2, h3) => {      // ends 6 and 6 with five sixes out, seat 0 plays 6-x making them 6/6 with all sixes out
      const H = newHand([ids(h0), ids(h1), ids(h2), ids(h3)], 0, false);
      const sixes = [tid(6, 0), tid(6, 1), tid(6, 2), tid(6, 3), tid(6, 6)];
      sixes.forEach(t => { H.played[t] = 1; H.out[TA[t]]++; if (!DBL[t]) H.out[TB[t]]++; });
      H.center = tid(6, 6); H.L = 6; H.R = 4;
      return H;
    };
    { const H = lockHand('4-6 0-0', '5-5 1-1', '2-2', '5-6 3-3');      // seat 0 plays 4|6 on the right (4): ends 6 and 6, all sevens sixes out once 5-6 is gone… (seat 3 still holds 5-6)
      play(H, 0, { id: tid(4, 6), side: 1 });
      ok('not locked while a six is still in a hand', !H.over, H.over); }
    { const H = lockHand('4-6 0-1', '5-5 1-1', '2-2', '3-3 0-0'); H.played[tid(5, 6)] = 1; H.out[5]++; H.out[6]++;
      play(H, 0, { id: tid(4, 6), side: 1 }); const r = result(H);
      ok('tranque detected when no six is left anywhere', H.over && H.over.kind === 'tranque' && H.over.seat === 0, H.over);
      ok('tranque: the locker (1) beats the player on the right (12): wins the rivals\' 12 + 6', r.team === 0 && r.pts === 18 && r.vs === 1 && r.next === 0, r); }
    { const H = lockHand('4-6 3-4', '0-1', '2-2', '3-3 0-0'); H.played[tid(5, 6)] = 1; H.out[5]++; H.out[6]++;
      play(H, 0, { id: tid(4, 6), side: 1 }); const r = result(H);
      ok('tranque: the locker (7) loses to the player on the right (1): they win the locker\'s pair\'s 7 + 4', r.team === 1 && r.pts === 11 && r.next === 1, r); }
    { const H = lockHand('4-6 0-2', '1-1', '2-2', '3-3'); H.played[tid(5, 6)] = 1; H.out[5]++; H.out[6]++;
      play(H, 0, { id: tid(4, 6), side: 1 }); const r = result(H);
      ok('tranque tie: nobody scores, the same player leads again', r.team === -1 && r.pts === 0 && r.next === H.leader, r); }
    // pase corrido: you play, the three others pass
    { const H = newHand([ids('1-2 2-2'), ids('0-0'), ids('0-1'), ids('0-3')], 0, false);
      H.center = tid(4, 5); H.L = 4; H.R = 5; H.played[H.center] = 1; H.out[4] = 1; H.out[5] = 1;
      H.hands[0] = ids('4-2 2-2 6-6'); play(H, 0, { id: tid(2, 4), side: 0 });       // ends 2 and 5
      let b = pass(H, 1); b += pass(H, 2); b += pass(H, 3);
      ok('pase corrido: +10 for the pair that played', b === RULES.pase && H.bonus[0] === RULES.pase && H.turn === 0, H.bonus);
      ok('passes mark voids', (H.voids[1] >> 2 & 1) && (H.voids[1] >> 5 & 1), H.voids); }
    // a match: scores add up, the next hand's leader, pollona
    { const M = newMatch(100);
      endHand(M, { team: 0, pts: 60, bonus: [10, 0], next: 2 }); endHand(M, { team: 0, pts: 35, bonus: [0, 0], next: 0 });
      ok('match to 100: won at 105 with the rivals at 0 is a pollona', M.over && M.over.team === 0 && M.over.pollona && M.scores[0] === 105, M); }
    // whole random hands conserve the set and always end
    { const rnd = rng(7); let fine = true;
      for (let k = 0; k < 300 && fine; k++) {
        const M = newMatch(100), H = startHand(M, rnd);
        while (!H.over) { const s = H.turn, mv = legal(H, s, false); if (!mv.length) pass(H, s); else play(H, s, mv[Math.floor(rnd() * mv.length)]); }
        const inHands = H.hands.reduce((a, h) => a + h.length, 0), onTable = H.played.reduce((a, b) => a + b, 0);
        if (inHands + onTable !== 28) fine = false;
        if (H.over.kind === 'tranque') for (let s = 0; s < 4; s++) if (H.hands[s].some(t => has(t, H.L) || has(t, H.R))) fine = false;
      }
      ok('300 random hands: 28 tiles kept, a tranque only when nobody can play', fine); }
    return T;
  }

  // ================================================================ words, phrases, icons
  const NEW_WORDS = [
    { id: 'w.domino', kind: 'word', es: 'dominó', pt: 'dominó', de: 'Domino', en: 'dominoes', g: { es: 'm', pt: 'm', de: 'n' }, icon: 'domino', alt: { es: ['domino'] } },
    { id: 'w.tile', kind: 'word', es: 'ficha', pt: 'peça', de: 'Dominostein', en: 'tile', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'fichas', pt: 'peças', de: 'Dominosteine' }, icon: 'tile' },
    { id: 'w.coffee', kind: 'word', es: 'café', pt: 'café', de: 'Kaffee', en: 'coffee', g: { es: 'm', pt: 'm', de: 'm' }, icon: 'coffee', alt: { es: ['cafecito', 'un cafecito', 'el cafecito'] } },
    { id: 'w.radio', kind: 'word', es: 'radio', pt: 'rádio', de: 'Radio', en: 'radio', g: { es: 'm', pt: 'm', de: 'n' }, icon: 'radio', alt: { es: ['la radio'] } },
    { id: 'w.colmado', kind: 'word', es: 'colmado', pt: 'mercadinho', de: 'Laden', en: 'corner store', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'colmados', pt: 'mercadinhos', de: 'Läden' }, icon: 'colmado' },
    // the prize (a key item, not a word to teach): «la ficha de la suerte»
    { id: 'k.luckyTile', kind: 'key', es: 'ficha de la suerte', pt: 'peça da sorte', de: 'Glücksstein', en: 'Lucky tile', g: { es: 'f', pt: 'f', de: 'm' }, icon: 'luckyTile' },
    // chapter 5's prize: the tournament's cup
    { id: 'k.copa', kind: 'key', es: 'copa del barrio', pt: 'taça do bairro', de: 'Pokal des Viertels', en: 'The neighborhood cup', g: { es: 'f', pt: 'f', de: 'm' }, icon: 'dmCopa' },
  ];
  // Dominican Spanish, as it's really said. keys: what counts as saying it (normalized: no accents, case or punctuation; a
  // word or two around it is fine). register 'slang' or 'casual' (the journal's Phrasebook groups by it)
  const R_DO = 'República Dominicana';
  const PHRASES = [
    // lesson 1: greetings
    { id: 'ph.queloque', es: '¿Qué lo que?', en: 'What’s up?', register: 'slang', keys: ['que lo que', 'klk', 'ke lo ke'],
      note: 'The classic Dominican greeting between friends. Texted as «KLK».' },
    { id: 'ph.dimelo', es: '¡Dímelo!', en: 'Hey, what’s up! (lit. “tell me”)', register: 'slang', keys: ['dimelo'],
      note: 'A greeting on its own, or the answer to «¿Qué lo que?». «¡Dímelo, mi pana!»' },
    { id: 'ph.tato', es: 'Ta to’', en: 'It’s all good', register: 'slang', keys: ['ta to', 'tato', 'ta todo'],
      note: 'From «está todo (bien)». The answer to «¿Cómo tú tá?», or: no worries, deal.' },
    { id: 'ph.mipana', es: 'mi pana', en: 'my buddy', register: 'slang', keys: ['mi pana', 'pana'],
      note: 'A friend, a pal. Heard all over the Caribbean.' },
    // lesson 2: the table
    { id: 'ph.paso', es: '¡Paso!', en: 'I pass!', register: 'casual', keys: ['paso', 'pase', 'no tengo'],
      note: 'Say it (and knock on the table) when no tile of yours fits.' },
    { id: 'ph.capicua', es: '¡Capicúa!', en: 'Capicúa! (won on both ends)', register: 'casual', keys: ['capicua', 'capicu', 'kapicua'],
      note: 'Shout it when your last tile fits both ends of the line. A capicúa nobody calls doesn’t get paid!' },
    { id: 'ph.tranque', es: '¡Tranque!', en: 'Locked! (nobody can play)', register: 'casual', keys: ['tranque', 'tranco', 'trancado', 'trancao', 'se tranco'],
      note: 'When nobody can play, the game is «trancado»: time to count.' },
    { id: 'ph.domino', es: '¡Dominó!', en: 'Domino! (out of tiles)', register: 'casual', keys: ['domino', 'domine'],
      note: 'When you play your last tile.' },
    { id: 'ph.agua', es: '¡Dale agua!', en: 'Shuffle them! (lit. “give it water”)', register: 'casual', keys: ['dale agua', 'darle agua', 'dar agua', 'agua'],
      note: 'Shuffling the tiles face down, swirling them like water. The pair that lost the last hand does it.' },
    { id: 'ph.unchin', es: 'un chin', en: 'a little bit', register: 'slang', keys: ['un chin', 'chin', 'un chinchin', 'chinchin'],
      note: '«Dame un chin de café»: give me a little coffee. (Ask for «un chin» of food and you still get a lot!)' },
    // lesson 3: Don Chago's words
    { id: 'ph.diache', es: '¡Diache!', en: 'Darn! / Wow!', register: 'slang', keys: ['diache'],
      note: 'Surprise or annoyance, without swearing (a softer «¡diablo!»).' },
    { id: 'ph.vaina', es: '¡Qué vaina!', en: 'Oh, man! / What a thing!', register: 'slang', keys: ['que vaina', 'vaina'],
      note: '«Vaina» is a thing, stuff… almost anything. «¡Qué vaina!»: what a mess, what a deal.' },
    { id: 'ph.tiguere', es: '¡Qué tíguere!', en: 'What a sharp one!', register: 'slang', keys: ['tiguere', 'tiguerazo', 'tigueron'],
      note: 'A «tíguere» is street-smart, clever, a little sly. From a domino master it’s a big compliment.' },
    { id: 'ph.jevi', es: '¡Qué jevi!', en: 'How cool!', register: 'slang', keys: ['jevi', 'jebi'],
      note: 'From English “heavy”. «Ta jevi»: it’s cool.' },
    // lesson 4: around the barrio
    { id: 'ph.chevere', es: '¡Chévere!', en: 'Great! / Cool!', register: 'casual', keys: ['chevere'],
      note: 'Heard all over the Caribbean. «¡Qué chévere!»' },
    { id: 'ph.coro', es: '¡Vamos pa’l coro!', en: 'Let’s go to the party!', register: 'slang', keys: ['coro'],
      note: 'A «coro» is a get-together with friends, a party. «Hacer coro»: to hang out.' },
    { id: 'ph.guagua', es: 'la guagua', en: 'the bus', register: 'casual', keys: ['guagua'],
      note: 'In the Caribbean (and the Canary Islands) the bus is a «guagua».' },
    { id: 'ph.deunavez', es: '¡De una vez!', en: 'Right away!', register: 'casual', keys: ['de una vez', 'de una'],
      note: '«Voy de una vez»: I’m going right now.' },
    { id: 'ph.mirones', es: 'Los mirones son de cera.', en: 'Onlookers are made of wax (watch quietly!)', register: 'casual', keys: ['mirones son de cera', 'los mirones', 'mirones'],
      note: 'A domino saying: people watching the game don’t talk and don’t give hints.' },
    // lesson 5: the colmado (Doña Nena teaches)
    { id: 'ph.quetedoy', es: '¿Qué te doy?', en: 'What can I get you?', register: 'casual', keys: ['que te doy', 'que le doy', 'que te despacho', 'que le despacho'],
      note: 'At the colmado’s counter, that’s how you start (literally “what do I give you?”). To an older customer: «¿Qué le doy?».' },
    { id: 'ph.funda', es: 'una funda', en: 'a (plastic) bag', register: 'casual', keys: ['funda', 'fundita', 'una fundita'],
      note: 'In the Dominican Republic a bag is «una funda» (elsewhere «una bolsa»). «Una funda de pan»: a bag of bread rolls.' },
    { id: 'ph.fiao', es: 'fiao', en: 'on credit (on the tab)', register: 'slang', keys: ['fiao', 'fiado', 'me lo fia', 'fiamelo'],
      note: 'From «fiado». Neighbors buy «fiao» and pay at the end of the month; the colmado writes it down in its notebook, «la libreta».' },
    { id: 'ph.napa', es: 'la ñapa', en: 'a little extra, for free', register: 'casual', keys: ['napa', 'la napa', 'de napa'],
      note: 'Buy a few things and the shopkeeper adds a little something for free: a candy, one more plantain… That’s «la ñapa».' },
    { id: 'ph.morir', es: 'un morir soñando', en: 'a “die dreaming” (orange juice and milk)', register: 'casual', keys: ['morir sonando', 'un morir'],
      note: 'The Dominican drink: orange juice, milk, sugar and lots of ice. The trick: pour the juice slowly into the cold milk, so it doesn’t curdle.' },
    { id: 'ph.ahorita', es: 'ahorita', en: 'in a little while (not right now!)', register: 'casual', keys: ['ahorita', 'ahoritica', 'ahoritita'],
      note: '«Ahorita» means “in a little while”: maybe five minutes, maybe an hour! For “right now”, say «ahora mismo».' },
    // lesson 6: the words of a final (Don Chago teaches)
    { id: 'ph.comovamos', es: '¿Cómo vamos?', en: 'What’s the score? (lit. “how are we going?”)', register: 'casual', keys: ['como vamos', 'cuantos van', 'como va', 'como estamos'],
      note: 'The answer: your pair’s points first. «Vamos sesenta a cuarenta»: we have 60, they have 40.' },
    { id: 'ph.anota', es: '¡Anota!', en: 'Write it down! (score it)', register: 'casual', keys: ['anota', 'anotalo', 'anote', 'apunta', 'apuntalo'],
      note: 'The «anotador» keeps the score in chalk. When your pair wins a hand: «¡Anota!».' },
    { id: 'ph.tupuedes', es: '¡Tú puedes!', en: 'You can do it!', register: 'casual', keys: ['tu puedes', 'tu puede', 'usted puede', 'si se puede', 'si puedes'],
      note: 'Said fast, the Dominican way, it sounds like «¡Tú puede’!»: the final s often disappears.' },
    { id: 'ph.senas', es: '¡Sin señas!', en: 'No signals!', register: 'casual', keys: ['sin senas', 'nada de senas', 'sin sena', 'no se vale senas'],
      note: 'Partners may not signal each other: no winks, no coughs, no taps. Your partner learns your hand only from the tiles you play: «las fichas hablan» (the tiles talk).' },
    { id: 'ph.pollona', es: '¡Pollona!', en: 'A shutout! (the rivals scored nothing)', register: 'slang', keys: ['pollona', 'una pollona'],
      note: 'Winning a match while the rivals are still at zero. Getting a «pollona» is the biggest embarrassment at the table!' },
    { id: 'ph.nae', es: 'Na’ e’ na’', en: 'It’s nothing (no big deal)', register: 'slang', keys: ['na e na', 'nada es nada', 'na es na'],
      note: 'From «nada es nada», said the Dominican way: the d and the s drop out. After a mistake it means: don’t worry about it.' },
    // learned in chapter 4's scene (not a lesson): turning the radio up
    { id: 'ph.subele', es: '¡Súbele!', en: 'Turn it up!', register: 'casual', keys: ['subele', 'subelo', 'subanle', 'sube el radio', 'sube la radio', 'sube la musica'],
      note: '«¡Súbele al radio!»: turn up the radio. (In the Dominican Republic people usually say «el radio».)' },
  ];
  const PHR = {}; PHRASES.forEach(p => { PHR[p.id] = p; });
  const LESSONS = [
    { n: 1, title: 'Saludos', en: 'Greetings', intro: 'dm.fello.l1', ids: ['ph.queloque', 'ph.dimelo', 'ph.tato', 'ph.mipana'] },
    { n: 2, title: 'En la mesa', en: 'At the table', intro: 'dm.fello.l2', ids: ['ph.paso', 'ph.capicua', 'ph.tranque', 'ph.domino', 'ph.agua', 'ph.unchin'] },
    { n: 3, title: 'Las palabras de Chago', en: 'Chago’s words', intro: 'dm.fello.l3', ids: ['ph.diache', 'ph.vaina', 'ph.tiguere', 'ph.jevi'] },
    { n: 4, title: 'Por el barrio', en: 'Around the barrio', intro: 'dm.fello.l4', ids: ['ph.chevere', 'ph.coro', 'ph.guagua', 'ph.deunavez', 'ph.mirones'] },
    { n: 5, title: 'En el colmado', en: 'At the colmado', intro: 'dm.nena.l5', teacher: 'nena', ids: ['ph.quetedoy', 'ph.funda', 'ph.fiao', 'ph.napa', 'ph.morir', 'ph.ahorita'] },
    { n: 6, title: 'Las palabras de la final', en: 'The words of a final', intro: 'dm.chago.l6', teacher: 'chago', ids: ['ph.comovamos', 'ph.anota', 'ph.tupuedes', 'ph.senas', 'ph.pollona', 'ph.nae'] },
  ];
  const TEACHER = { fello: ['dmFello', 'Don Fello'], nena: ['dmNena', 'Doña Nena'], chago: ['dmChago', 'Don Chago'] };
  // how each phrase is said in a little scene (the lesson's example), and a situation to say it from memory
  const USE = {
    'ph.queloque': { ex: ['Yunior: «¿Qué lo que, Doña Nena?»', 'Doña Nena: «¡Dímelo, mi amor!»'], sit: 'Yunior walks up to the table. Greet him the Dominican way.' },
    'ph.dimelo': { ex: ['Don Fello: «¿Qué lo que?»', 'Yunior: «¡Dímelo!»'], sit: 'Doña Nena says «¿Qué lo que?». Answer her!' },
    'ph.tato': { ex: ['Doña Nena: «¿Cómo tú tá?» (How are you?)', 'Don Fello: «¡Ta to’!»'], sit: 'Don Fello asks «¿Cómo tú tá?» (How are you?). Tell him it’s all good.' },
    'ph.mipana': { ex: ['Yunior: «¡Dímelo, mi pana!»'], sit: 'Call Yunior your buddy: «¡Dímelo, …!»' },
    'ph.paso': { ex: ['(knock, knock) Doña Nena: «Paso.»'], sit: 'It’s your turn and no tile of yours fits. What do you say?' },
    'ph.capicua': { ex: ['Don Fello slams his last tile: it fits both ends. «¡CAPICÚA!»'], sit: 'Your last tile fits both ends of the line! Shout it!' },
    'ph.tranque': { ex: ['Don Fello: «¡Tranque! A contar.» (Locked! Let’s count.)'], sit: 'After your tile, nobody can play anymore. Call it!' },
    'ph.domino': { ex: ['Yunior plays his last tile: «¡Dominó!»'], sit: 'You play your last tile (it only fits one end). Call it!' },
    'ph.agua': { ex: ['Don Fello: «Yunior, ¡dale agua!» (Yunior swirls the tiles.)'], sit: 'Time to shuffle the tiles. Tell Yunior to do it!' },
    'ph.unchin': { ex: ['Don Fello: «Nena, dame un chin de café.»'], sit: 'Ask Doña Nena for a little coffee: «Dame … de café».' },
    'ph.diache': { ex: ['Yunior drops his tiles on the floor: «¡Diache!»'], sit: 'Yunior plays a double six right where you needed it. React!' },
    'ph.vaina': { ex: ['The radio stops in the middle of a song. Doña Nena: «¡Qué vaina!»'], sit: 'It starts to rain in the middle of the game. Oh, man!' },
    'ph.tiguere': { ex: ['Don Fello wins with a trick. Yunior: «¡Qué tíguere!»'], sit: 'Don Fello wins with a very clever play. Call him a sharp one!' },
    'ph.jevi': { ex: ['Yunior shows off his motorbike: «¿Viste? ¡Qué jevi!»'], sit: 'Yunior shows you his shiny new motorbike. How cool!' },
    'ph.chevere': { ex: ['Doña Nena: «Hoy el café es gratis.» Yunior: «¡Chévere!»'], sit: 'Doña Nena gives you a free coffee. Great!' },
    'ph.coro': { ex: ['Saturday night. Yunior: «¡Vamos pa’l coro!»'], sit: 'Everybody’s going to the get-together tonight. Say: let’s go to the party!' },
    'ph.guagua': { ex: ['Doña Nena: «Me voy al mercado en la guagua.»'], sit: 'You want to go to Molinar, but you have no car. What do you take?' },
    'ph.deunavez': { ex: ['Don Fello: «¿Jugamos?» Yunior: «¡De una vez!»'], sit: 'Don Fello asks «¿Jugamos?» (Shall we play?). Say: right away!' },
    'ph.mirones': { ex: ['Yunior whispers a hint to Doña Nena. Don Fello: «¡Los mirones son de cera!»'], sit: 'Yunior is watching your game and whispering hints. Remind him of the rule!' },
    'ph.quetedoy': { ex: ['Doña Nena: «¡Buenas! ¿Qué te doy?»', 'Yunior: «Un pan de agua, Doña Nena.»'], sit: 'A customer walks up to the counter. Ask what you can get them.' },
    'ph.funda': { ex: ['Doña Nena: «¿Te lo pongo en una funda?» (Shall I put it in a bag?)'], sit: 'A customer has bread and sugar and nothing to carry them in. What do you give them?' },
    'ph.fiao': { ex: ['Don Fello: «Nena, anótame el café. Fiao.»', 'Doña Nena: «¿Fiao otra vez, Fello?»'], sit: 'A neighbor has no money today and will pay at the end of the month. How are they buying?' },
    'ph.napa': { ex: ['Doña Carmen: «¿Y la ñapa?»', 'Doña Nena gives her a candy: «¡Ahí está la ñapa!»'], sit: 'You give a customer a little something extra, for free. What is it called?' },
    'ph.morir': { ex: ['Toño: «Dame un morir soñando bien frío.»'], sit: 'It’s hot. Order the Dominican drink of orange juice and milk.' },
    'ph.ahorita': { ex: ['Doña Nena: «Yunior, ¿cuándo vas?» Yunior: «¡Ahorita!» (…and he’s still sitting there.)'], sit: 'Someone asks when you’ll do it, and you mean “in a little while”.' },
    'ph.comovamos': { ex: ['Chago: «Fello, ¿cómo vamos?»', 'Don Fello: «Vamos sesenta a cuarenta.»'], sit: 'You lost track of the score. Ask how it stands.' },
    'ph.anota': { ex: ['Chago plays his last tile: «¡Dominó! ¡Fello, anota!»'], sit: 'Your pair just won the hand. Tell the scorekeeper to write it down!' },
    'ph.tupuedes': { ex: ['Doña Nena to Chago: «¡Tú puedes, Chago!»'], sit: 'Your partner is nervous before the final. Encourage them!' },
    'ph.senas': { ex: ['Yunior winks at Doña Nena across the table. Don Fello: «¡Sin señas!»'], sit: 'A rival winks at their partner during the game. Call it out!' },
    'ph.pollona': { ex: ['The rivals end the match with zero points. Yunior: «¡POLLONA!»'], sit: 'You won the match and the rivals never scored a point. Shout it!' },
    'ph.nae': { ex: ['Chago drops a tile: «¡Ay, perdón!» Don Fello: «Na’ e’ na’.»'], sit: 'Your partner makes a little mistake and says sorry. Tell them it’s nothing.' },
    'ph.subele': { ex: ['Yunior: «¡Súbele al radio, que esa bachata está buena!»'], sit: 'The radio is too quiet. Tell Yunior to turn it up!' },
  };
  const normKey = s => norm(String(s).replace(/['’]/g, ' '));
  PHRASES.forEach(p => { p.keys = p.keys.map(normKey); });
  // does what you typed say the phrase?
  function saysPhrase(id, text) { const P = PHR[id]; if (!P) return false; const n = ' ' + normKey(text) + ' '; return P.keys.some(k => n.includes(' ' + k + ' ')); }
  function registerLang() {
    if (typeof LEX === 'undefined') return;
    LEX.register(NEW_WORDS.filter(w => !LEX.item(w.id)));
    if (typeof WORDS !== 'undefined' && Array.isArray(WORDS)) NEW_WORDS.forEach(w => { if (w.kind === 'word' && !WORDS.some(x => x.id === w.id)) WORDS.push(LEX.item(w.id)); });
    // (the mesa and the silla: interiors.js has them; in case it isn't loaded)
    if (!LEX.item('w.table')) LEX.register([{ id: 'w.table', kind: 'word', es: 'mesa', pt: 'mesa', de: 'Tisch', en: 'table', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'mesas', pt: 'mesas', de: 'Tische' }, icon: 'table' }]);
    if (!LEX.item('w.chair')) LEX.register([{ id: 'w.chair', kind: 'word', es: 'silla', pt: 'cadeira', de: 'Stuhl', en: 'chair', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'sillas', pt: 'cadeiras', de: 'Stühle' }, icon: 'chair' }]);
    LEX.register(PHRASES.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', es: p.es, en: p.en, note: p.note, region: R_DO, register: p.register,
      icon: p.icon || 'domino', alt: { es: p.keys.slice() } })));
  }
  function registerIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const has = k => ICONS.keys.includes(k);
    const tileFace = (c, p, h, x, y, a, b, s = 1, gold = false) => {       // a domino tile standing up: a over b, centred on (x, y)
      h.shape(c, p, h.rr(x - 13 * s, y - 26 * s, 26 * s, 52 * s, 6 * s), gold ? '#ffd65a' : '#fbf7ea');
      if (!p) return;
      c.beginPath(); c.moveTo(x - 9 * s, y); c.lineTo(x + 9 * s, y); c.lineWidth = 1.6; c.strokeStyle = h.INK; c.stroke();
      const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] };
      [[a, -13], [b, 13]].forEach(([n, dy]) => (P[n] || []).forEach(([px, py]) => h.dot(c, x + px * 6 * s, y + dy * s + py * 6.5 * s, 2.6 * s, gold ? '#8a4b12' : h.INK)));
    };
    if (!has('domino')) ICONS.add('domino', (c, p, h) => { tileFace(c, p, h, -12, 4, 6, 3, 0.95); c.save(); c.translate(14, -4); c.rotate(0.28); tileFace(c, p, h, 0, 0, 5, 5, 0.95); c.restore(); });
    if (!has('tile')) ICONS.add('tile', (c, p, h) => tileFace(c, p, h, 0, 0, 4, 2, 1.15));
    if (!has('luckyTile')) ICONS.add('luckyTile', (c, p, h) => {
      tileFace(c, p, h, 0, 2, 6, 6, 1.15, true);
      if (p) [[-26, -26, 5], [27, -20, 6], [24, 28, 4]].forEach(([x, y, r]) => { c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? r * 0.35 : r; c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fillStyle = '#fff3a0'; c.fill(); });
    });
    if (!has('coffee')) ICONS.add('coffee', (c, p, h) => {
      h.shape(c, p, h.ell(0, 22, 30, 7), '#f4efe2');
      h.shape(c, p, cc => { cc.moveTo(-20, -6); cc.lineTo(20, -6); cc.lineTo(15, 18); cc.quadraticCurveTo(0, 24, -15, 18); cc.closePath(); }, '#fbf7ea');
      h.shape(c, p, cc => { cc.arc(22, 4, 8, -1.3, 1.3); }, null);
      if (p) { h.shape(c, 1, h.ell(0, -6, 20, 4), '#6b3b1f', 1.6); [-8, 4].forEach((x, i) => { c.beginPath(); c.moveTo(x, -14); c.bezierCurveTo(x - 6, -22, x + 6, -28, x, -36 - i * 2); c.lineWidth = 2.4; c.strokeStyle = 'rgba(43,34,53,0.5)'; c.stroke(); }); }
    });
    if (!has('radio')) ICONS.add('radio', (c, p, h) => {
      h.shape(c, p, h.rr(-32, -14, 64, 40, 7), '#d9573f');
      h.shape(c, p, h.rr(-26, -40, 3, 28, 1), '#8a8f9e');
      if (p) { h.shape(c, 1, h.ell(-12, 6, 12, 12), '#2b2235', 1.6); for (let i = 0; i < 3; i++) h.dot(c, -12 + (i - 1) * 6, 6, 2, '#8a8f9e'); h.shape(c, 1, h.rr(6, -6, 20, 10, 2), '#fff3c4', 1.4); h.dot(c, 16, 14, 4, '#2b2235'); }
    });
    if (!has('colmado')) ICONS.add('colmado', (c, p, h) => {
      h.shape(c, p, h.rr(-32, -16, 64, 46, 3), '#3fb8af');
      h.shape(c, p, h.rr(-36, -30, 72, 16, 3), '#ffd166');
      if (p) {
        h.shape(c, 1, h.rr(-24, -4, 26, 20, 2), '#3a2f3d', 1.6);
        [-18, -11, -4].forEach(x => { c.beginPath(); c.moveTo(x, -4); c.lineTo(x, 16); c.lineWidth = 1.6; c.strokeStyle = '#fffaf0'; c.stroke(); });
        h.shape(c, 1, h.rr(8, -2, 14, 32, 2), '#8d5733', 1.6);
        for (let i = 0; i < 6; i++) h.shape(c, 1, h.rr(-36 + i * 12, -14, 12, 6, 0), i % 2 ? '#e2453a' : '#fffaf0', 1);
      }
    });
    // little portraits for the board's seats (paper cutouts, like the word pictures)
    const face = (c, p, h, o) => {
      h.shape(c, p, h.ell(0, 4, 26, 28), o.skin);
      if (o.under) o.under(c, p, h);
      if (!p) return;
      h.dot(c, -9, 2, 3.4, h.INK); h.dot(c, 9, 2, 3.4, h.INK); h.dot(c, -8, 1, 1.2, '#fff'); h.dot(c, 10, 1, 1.2, '#fff');
      h.dot(c, -17, 12, 4.5, 'rgba(255,140,154,0.55)'); h.dot(c, 17, 12, 4.5, 'rgba(255,140,154,0.55)');
      if (o.mouth !== false) { c.beginPath(); c.arc(0, 13, 6, 0.2, Math.PI - 0.2); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke(); }
      if (o.over) o.over(c, p, h);
    };
    if (!has('dmFello')) ICONS.add('dmFello', (c, p, h) => face(c, p, h, { skin: '#9a6440', mouth: false,
      under: (c2, p2, h2) => { h2.shape(c2, p2, h2.rr(-34, -22, 68, 8, 3), '#e8d9a8'); h2.shape(c2, p2, h2.rr(-20, -40, 40, 20, 6), '#e8d9a8'); h2.shape(c2, p2, h2.rr(-20, -26, 40, 5, 1), '#5b3a22'); },
      over: c2 => { c2.fillStyle = '#f4f1ea'; c2.beginPath(); c2.ellipse(-7, 12, 9, 4, 0.3, 0, TAU); c2.ellipse(7, 12, 9, 4, -0.3, 0, TAU); c2.fill(); } }));
    if (!has('dmChago')) ICONS.add('dmChago', (c, p, h) => face(c, p, h, { skin: '#8a5a3c',
      under: (c2, p2, h2) => h2.shape(c2, p2, h2.ell(2, -20, 28, 11, 0.12), '#3a3040'),
      over: (c2, p2, h2) => { [-1, 1].forEach(s => { c2.beginPath(); c2.arc(s * 9, 2, 7, 0, TAU); c2.lineWidth = 1.8; c2.strokeStyle = h2.INK; c2.stroke(); }); } }));
    if (!has('dmNena')) ICONS.add('dmNena', (c, p, h) => face(c, p, h, { skin: '#a8714a',
      under: (c2, p2, h2) => { h2.shape(c2, p2, cc => { cc.moveTo(-30, -2); cc.bezierCurveTo(-34, -44, 34, -44, 30, -2); cc.closePath(); }, '#e86a9a'); if (p2) [-14, -4, 6].forEach((x, i) => h2.shape(c2, 1, h2.rr(x, -12, 8, 7, 3), ['#7fd1e8', '#ffd166', '#9cc45a'][i], 1.2)); } }));
    if (!has('dmYunior')) ICONS.add('dmYunior', (c, p, h) => face(c, p, h, { skin: '#c98e62',
      under: (c2, p2, h2) => { h2.shape(c2, p2, cc => { cc.moveTo(-26, -8); cc.bezierCurveTo(-28, -40, 28, -40, 26, -8); cc.closePath(); }, '#d6453a'); h2.shape(c2, p2, h2.rr(-38, -14, 16, 6, 3), '#d6453a'); } }));
    if (!has('dmYou')) ICONS.add('dmYou', (c, p, h) => face(c, p, h, { skin: '#f5cda2',
      under: (c2, p2, h2) => h2.shape(c2, p2, cc => { cc.moveTo(-28, 0); cc.bezierCurveTo(-30, -40, 30, -40, 28, 0); cc.quadraticCurveTo(10, -20, -28, 0); cc.closePath(); }, '#4a2f27') }));
    if (!has('dmMimo')) ICONS.add('dmMimo', (c, p, h) => {
      [-1, 1].forEach(s => h.shape(c, p, h.ell(s * 11, -30, 7, 18, s * 0.15), '#fbf1df'));
      h.shape(c, p, h.ell(0, 6, 28, 26), '#fbf1df');
      if (p) { [-1, 1].forEach(s => h.shape(c, 1, h.ell(s * 11, -30, 3.5, 12, s * 0.15), '#ff9b88', 1)); h.dot(c, -9, 2, 3.4, h.INK); h.dot(c, 9, 2, 3.4, h.INK); h.dot(c, -17, 10, 4.5, 'rgba(255,140,154,0.55)'); h.dot(c, 17, 10, 4.5, 'rgba(255,140,154,0.55)'); h.shape(c, 1, h.ell(0, -16, 4, 4), '#2fd0c2', 1.2); }
    });
    // chapter 4's neighbors, chapter 5's gray pair, and the cup
    if (!has('dmMaritza')) ICONS.add('dmMaritza', (c, p, h) => face(c, p, h, { skin: '#b07a52',
      under: (c2, p2, h2) => { [-1, 1].forEach(s => h2.shape(c2, p2, h2.ell(s * 25, -24, 11, 11), '#2e2420')); h2.shape(c2, p2, cc => { cc.moveTo(-26, -6); cc.bezierCurveTo(-28, -38, 28, -38, 26, -6); cc.closePath(); }, '#2e2420'); if (p2) [-1, 1].forEach(s => h2.shape(c2, 1, h2.ell(s * 25, -36, 6, 4, s * 0.4), '#ffd166', 1.2)); } }));
    if (!has('dmCarmen')) ICONS.add('dmCarmen', (c, p, h) => face(c, p, h, { skin: '#6f4630',
      under: (c2, p2, h2) => { h2.shape(c2, p2, h2.ell(0, -36, 13, 10), '#d9d4cc'); h2.shape(c2, p2, cc => { cc.moveTo(-27, -4); cc.bezierCurveTo(-29, -36, 29, -36, 27, -4); cc.closePath(); }, '#d9d4cc'); },
      over: (c2, p2, h2) => { [-1, 1].forEach(s => { c2.beginPath(); c2.arc(s * 9, 2, 7, 0, TAU); c2.lineWidth = 1.8; c2.strokeStyle = h2.INK; c2.stroke(); }); } }));
    if (!has('dmTono')) ICONS.add('dmTono', (c, p, h) => face(c, p, h, { skin: '#9a6440', mouth: false,
      under: (c2, p2, h2) => { h2.shape(c2, p2, cc => { cc.moveTo(-26, -8); cc.bezierCurveTo(-28, -40, 28, -40, 26, -8); cc.closePath(); }, '#f2a03a'); h2.shape(c2, p2, h2.rr(22, -14, 16, 6, 3), '#f2a03a'); },
      over: c2 => { c2.fillStyle = '#1e1a1a'; c2.beginPath(); c2.ellipse(-6, 12, 8, 3.5, 0.25, 0, TAU); c2.ellipse(6, 12, 8, 3.5, -0.25, 0, TAU); c2.fill(); } }));
    const grayFace = (c, p, h, hat) => {
      h.shape(c, p, h.ell(0, 4, 26, 28), '#9a98a6');
      hat(c, p, h);
      if (!p) return;
      c.strokeStyle = 'rgba(43,34,53,0.7)'; c.lineWidth = 2.4; c.beginPath(); c.moveTo(-13, 3); c.lineTo(-5, 3); c.moveTo(5, 3); c.lineTo(13, 3); c.moveTo(-6, 15); c.lineTo(6, 15); c.stroke();
    };
    if (!has('dmNadie')) ICONS.add('dmNadie', (c, p, h) => grayFace(c, p, h, (c2, p2, h2) => { h2.shape(c2, p2, h2.rr(-34, -20, 68, 8, 3), '#4a4652'); h2.shape(c2, p2, h2.rr(-20, -40, 40, 22, 6), '#4a4652'); }));
    if (!has('dmNada')) ICONS.add('dmNada', (c, p, h) => grayFace(c, p, h, (c2, p2, h2) => h2.shape(c2, p2, cc => { cc.moveTo(-30, -2); cc.bezierCurveTo(-34, -44, 34, -44, 30, -2); cc.closePath(); }, '#55525e')));
    if (!has('dmCopa')) ICONS.add('dmCopa', (c, p, h) => {
      h.shape(c, p, h.rr(-20, 26, 40, 9, 2), '#8a5f3e');
      h.shape(c, p, h.rr(-5, 8, 10, 20, 2), '#e0a020');
      h.shape(c, p, cc => { cc.moveTo(-26, -30); cc.lineTo(26, -30); cc.quadraticCurveTo(26, 10, 0, 12); cc.quadraticCurveTo(-26, 10, -26, -30); cc.closePath(); }, '#ffd65a');
      [-1, 1].forEach(s => h.shape(c, p, cc => { cc.arc(s * 27, -16, 9, s > 0 ? -1.4 : 1.7, s > 0 ? 1.4 : 4.6); }, null));
      if (p) { h.shape(c, 1, h.rr(-8, -24, 16, 28, 3), '#fbf7ea', 1.4); c.beginPath(); c.moveTo(-6, -10); c.lineTo(6, -10); c.lineWidth = 1.2; c.strokeStyle = h.INK; c.stroke(); [[-3, -19], [3, -15], [-3, -5], [3, -1]].forEach(([x, y]) => h.dot(c, x, y, 1.8, h.INK)); }
    });
  }

  // ================================================================ lines (lines.js's format: es/pt/de [simpler, richer], en with weave slots)
  // Everyday talk is A1–A2; Dominican slang is written as it's said, with an English gloss in the English versions. Nobody
  // assumes the player's gender («joven», «mi pana», «mi amor» are for anyone).
  const LT = {
    'dm.fello.hi': { es: ['¡Diache! ¿Y tú quién eres?', '¡Diache! ¿Y tú quién eres? Nunca te he visto por aquí.'],
      en: ['«¡Diache!» (Well, darn!) And who are you?', '«¡Diache!» (Well, darn!) And who are you? I’ve never seen you around here.'] },
    'dm.fello.name': { es: ['Yo soy Don Fello. ¡Y esto es {w.domino}!', 'Me llamo Rafael Peña, pero todos me dicen Don Fello. Y en la {w.table}, «El Martillo».'],
      en: ['I’m Don Fello. And this is {w.domino}!', 'My name is Rafael Peña, but everybody calls me Don Fello. And at the {w.table}, “El Martillo”: the Hammer.'] },
    'dm.nena.hi': { es: ['Y yo soy Doña Nena. Este es mi {w.colmado}.', 'Y yo soy Doña Nena. Este es mi {w.colmado}. ¿Quieres un {w.coffee}? Está calientito.'],
      en: ['And I’m Doña Nena. This is my {w.colmado}.', 'And I’m Doña Nena. This is my {w.colmado}. Want a {w.coffee}? It’s nice and hot.'] },
    'dm.yunior.hi': { es: ['¡Klk! Yo soy Yunior.', '¡Klk, mi pana! Yo soy Yunior, el delivery del {w.colmado}. ¡El más rápido del pueblo!'],
      en: ['«¡Klk!» (What’s up!) I’m Yunior.', '«¡Klk, mi pana!» (What’s up, buddy!) I’m Yunior, the {w.colmado}’s delivery guy. The fastest in town!'] },
    'dm.fello.earn': { es: ['¿Jugar en mi {w.table}? Primero tienes que hablar como un dominicano.', '¿Jugar en mi {w.table}? ¡Ja! Primero tienes que hablar como un dominicano… y ganarles a Nena y a Yunior.'],
      en: ['Play at my {w.table}? First you have to talk like a Dominican.', 'Play at my {w.table}? Ha! First you have to talk like a Dominican… and beat Nena and Yunior.'] },
    'dm.fello.school': { es: ['Yo te enseño. ¡Gratis!', 'Yo te enseño. ¡Gratis! Bueno… casi gratis. Me debes un {w.coffee}.'],
      en: ['I’ll teach you. For free!', 'I’ll teach you. For free! Well… almost free. You owe me a {w.coffee}.'] },
    'dm.fello.l1': { es: ['Primero, los saludos. Así se saluda en mi barrio.', 'Primero, los saludos. En mi barrio nadie dice «hola» y ya. Escucha bien.'],
      en: ['First, greetings. This is how we say hi in my neighborhood.', 'First, greetings. In my neighborhood nobody just says “{w.hello}.” Listen up.'] },
    'dm.fello.l2': { es: ['Ahora, las palabras de la {w.table}. Sin estas, no juegas.', 'Ahora, las palabras de la {w.table}. Cuando juegas, hay que hablar. ¡Fuerte!'],
      en: ['Now, the words of the {w.table}. Without them, you don’t play.', 'Now, the words of the {w.table}. When you play, you have to talk. Loud!'] },
    'dm.fello.l3': { es: ['Estas son las palabras de Chago. Él las decía todo el día.', 'Estas son las palabras de Chago. Él las decía todo el día… Apréndelas bien.'],
      en: ['These are Chago’s words. He said them all day long.', 'These are Chago’s words. He said them all day long… Learn them well.'] },
    'dm.fello.l4': { es: ['¿Más? ¡Así me gusta! Estas son para la calle.', '¿Quieres más? ¡Así me gusta! Estas son para la calle, para el barrio.'],
      en: ['More? That’s what I like! These are for the street.', 'You want more? That’s what I like! These are for the street, for the neighborhood.'] },
    'dm.fello.done': { es: ['¡Eso! Ya hablas como un tíguere.', '¡Eso! Ya casi hablas como un tíguere. Casi.'],
      en: ['That’s it! Now you talk like a «tíguere» (a sharp one).', 'That’s it! You almost talk like a «tíguere» (a sharp one). Almost.'] },
    'dm.fello.vsReg': { es: ['Tú y tu… ¿qué es eso? ¿Un conejito? Bueno: contra Nena y Yunior. ¡A cien!', 'Tú y tu… ¿qué es eso? ¿Un conejito? Bueno. Ustedes dos contra Nena y Yunior. A cien puntos. ¡Dale agua!'],
      en: ['You and your… what is that? A little bunny? OK: against Nena and Yunior. To a hundred!', 'You and your… what is that? A little bunny? Fine. You two against Nena and Yunior. To a hundred points. «¡Dale agua!» (Shuffle!)'] },
    'dm.yunior.lost': { es: ['¡Diache! ¡Nos ganaron!', '¡Diache! ¡Nos ganaron! Doña Nena, eso fue culpa tuya.'],
      en: ['«¡Diache!» They beat us!', '«¡Diache!» They beat us! Doña Nena, that was your fault.'] },
    'dm.nena.lost': { es: ['¿Mi culpa? ¡Qué vaina contigo, Yunior!', '¿Mi culpa? ¡Qué vaina contigo, Yunior! Tú juegas como un loco.'],
      en: ['My fault? «¡Qué vaina!» (Oh, come on!) Yunior!', 'My fault? «¡Qué vaina contigo!» (Oh, come on!) Yunior, you play like a madman.'] },
    'dm.fello.notbad': { es: ['Hmm. No está mal. Nada mal.', 'Hmm. No está mal… nada mal. Tú sabes contar {w.tile:pl}.'],
      en: ['Hmm. Not bad. Not bad at all.', 'Hmm. Not bad… not bad at all. You know how to count {w.tile:pl}.'] },
    'dm.yunior.won': { es: ['¡Ja! ¡Otra vez será, mi pana!', '¡Ja! ¡Otra vez será, mi pana! Ve a practicar.'],
      en: ['Ha! Next time, «mi pana» (buddy)!', 'Ha! Better luck next time, «mi pana» (buddy)! Go practice.'] },
    'dm.fello.chair1': { es: ['¿Ves esa {w.chair} vacía? Es de Chago. Mi frente.', '¿Ves esa {w.chair} vacía? Es de Chago. Mi frente, mi compañero. Cuarenta años jugando juntos.'],
      en: ['See that empty {w.chair}? It’s Chago’s. My «frente» (partner).', 'See that empty {w.chair}? It’s Chago’s. My «frente», my partner. Forty years playing together.'] },
    'dm.fello.chair2': { es: ['Un día perdimos la final. Chago se equivocó, y la gente se rió.', 'Un día perdimos la final del barrio. Chago se equivocó con una {w.tile}… y la gente se rió de él.'],
      en: ['One day we lost the final. Chago made a mistake, and people laughed.', 'One day we lost the neighborhood final. Chago made a mistake with one {w.tile}… and people laughed at him.'] },
    'dm.fello.chair3': { es: ['Dejó de hablar. Y después vino lo gris.', 'Después de eso, dejó de hablar. Tenía miedo de equivocarse otra vez. Y después vino lo gris.'],
      en: ['He stopped talking. And then the gray came.', 'After that, he stopped talking. He was afraid of making another mistake. And then the gray came.'] },
    'dm.fello.chair4': { es: ['Ahora se sienta allí, solo. Aprende sus palabras. Tal vez se acuerda.', 'Ahora se sienta allí, solo, todos los días. Chago hablaba como nadie. Si aprendes sus palabras… tal vez se acuerda.'],
      en: ['Now he sits over there, alone. Learn his words. Maybe he’ll remember.', 'Now he sits over there, alone, every day. Chago talked like nobody else. If you learn his words… maybe he’ll remember.'] },
    'dm.fello.goChago': { es: ['Ve con Chago. Háblale con sus palabras.', 'Anda, ve con Chago. Háblale con sus palabras. Yo no puedo… a mí no me mira.'],
      en: ['Go to Chago. Talk to him with his words.', 'Go on, go to Chago. Talk to him with his own words. I can’t… he won’t even look at me.'] },
    'dm.chago.h1': { es: ['¿Qué… lo… que…?'], en: ['«¿Qué… lo… que…?»'] },
    'dm.chago.h2': { es: ['Ca… pi… cúa… Yo jugaba {w.domino}…'], en: ['«Ca… pi… cúa…» I used to play {w.domino}…'] },
    'dm.chago.h3': { es: ['Me equivoqué… en la final… Perdimos por mí…'], en: ['I made a mistake… in the final… We lost because of me…'] },
    'dm.chago.h4': { es: ['¿Ta to’…? ¿De verdad… ta to’?'], en: ['«¿Ta to’…?» (It’s all good?) Really… «ta to’»?'] },
    'dm.chago.h5': { es: ['¿Un tíguere? ¿Yo? ¡JA! ¡Diache! ¡Puedo hablar!'], en: ['A «tíguere»? Me? HA! «¡Diache!» I can talk!'] },
    'dm.chago.fello': { es: ['¿Dónde está Fello? ¡Tengo que jugar!', '¿Dónde está Fello? ¡Ese viejo me debe una revancha!'],
      en: ['Where’s Fello? I have to play!', 'Where’s Fello? That old man owes me a rematch!'] },
    'dm.fello.reunion': { es: ['¿Chago? ¡¿CHAGO?! ¡Mi frente!'], en: ['Chago? CHAGO?! My «frente»!'] },
    'dm.fello.forgive': { es: ['Esa final no importa, hermano. Todos nos equivocamos.', 'Esa final no me importa, hermano. Todos nos equivocamos. Lo importante es seguir jugando… y seguir hablando.'],
      en: ['That final doesn’t matter, brother. Everyone makes mistakes.', 'That final doesn’t matter to me, brother. Everyone makes mistakes. What matters is to keep playing… and keep talking.'] },
    'dm.fello.final': { es: ['Y ahora… ¡a jugar! Ustedes contra nosotros. Si ganan, les doy mi {w.tile} de la suerte.', 'Y ahora… ¡a jugar! Tú y tu conejito contra Chago y yo. Si nos ganan, te doy mi {w.tile} de la suerte.'],
      en: ['And now… let’s play! You two against us. If you win, I’ll give you my lucky {w.tile}.', 'And now… let’s play! You and your bunny against Chago and me. If you beat us, I’ll give you my lucky {w.tile}.'] },
    'dm.fello.beaten': { es: ['¡Diache! Me ganaste… ¡Eres un tíguere del {w.domino}!', '¡Diache! Cuarenta años jugando… y me gana alguien con un conejito. ¡Eres un tíguere del {w.domino}!'],
      en: ['«¡Diache!» You beat me… You’re a {w.domino} «tíguere»!', '«¡Diache!» Forty years of playing… and I get beaten by someone with a bunny. You’re a {w.domino} «tíguere»!'] },
    'dm.chago.tiguere': { es: ['¡Un tíguere, sí señor!'], en: ['A «tíguere», yes indeed!'] },
    'dm.fello.gift': { es: ['Toma. Mi {w.tile} de la suerte: el doble seis. Cuarenta años en mi bolsillo.'], en: ['Here. My lucky {w.tile}: the double six. Forty years in my pocket.'] },
    'dm.nena.necklace': { es: ['Y yo le pongo un hilito… ¡para el conejito! Para que le dé suerte.'], en: ['And I’ll put a little string on it… for the bunny! So it brings luck.'] },
    'dm.yunior.coro': { es: ['¡Esto hay que celebrarlo! ¡Vamos pa’l coro!', '¡Esto hay que celebrarlo! ¡Súbele al {w.radio}! ¡Vamos pa’l coro!'],
      en: ['We have to celebrate! «¡Vamos pa’l coro!» (Let’s party!)', 'We have to celebrate this! Turn up the {w.radio}! «¡Vamos pa’l coro!» (Let’s party!)'] },
    'dm.fello.notyet': { es: ['¡Ja! Todavía no, joven. Pero juegas con corazón.', '¡Ja! Todavía no, joven. Pero juegas con corazón. Vuelve cuando quieras.'],
      en: ['Ha! Not yet, young one. But you play with heart.', 'Ha! Not yet, young one. But you play with heart. Come back anytime.'] },
    'dm.fello.short': { es: ['Mira… si quieres, jugamos a cincuenta. ¡Pa’ que no llores!'], en: ['Look… if you want, we play to fifty. So you don’t cry!'] },
    'dm.fello.klk': { es: ['¿Qué lo que?'], en: ['«¿Qué lo que?» (What’s up?)'] },
    'dm.fello.eso': { es: ['¡Eso! Así se habla.'], en: ['That’s it! That’s how you talk.'] },
    'dm.fello.idle1': { es: ['¿Otra partida? La {w.table} está lista.', '¿Otra partida? La {w.table} está lista, y Chago tiene hambre de revancha.'],
      en: ['Another game? The {w.table} is ready.', 'Another game? The {w.table} is ready, and Chago is hungry for a rematch.'] },
    'dm.fello.idle2': { es: ['En el {w.domino}, el que cuenta, gana.', 'En el {w.domino}, el que cuenta las {w.tile:pl}, gana. Siempre.'],
      en: ['In {w.domino}, whoever counts, wins.', 'In {w.domino}, whoever counts the {w.tile:pl} wins. Always.'] },
    'dm.nena.idle1': { es: ['¿Un {w.coffee}? Aquí siempre hay {w.coffee}.', '¿Un cafecito? En este {w.colmado} siempre hay {w.coffee}… y {w.domino}.'],
      en: ['A {w.coffee}? There’s always {w.coffee} here.', 'A little {w.coffee}? In this {w.colmado} there’s always {w.coffee}… and {w.domino}.'] },
    'dm.nena.idle2': { es: ['Fello juega bien, pero habla demasiado.', 'Fello juega muy bien, pero habla demasiado. ¡Y golpea la {w.table} como un martillo!'],
      en: ['Fello plays well, but he talks too much.', 'Fello plays very well, but he talks too much. And he hits the {w.table} like a hammer!'] },
    'dm.yunior.idle1': { es: ['¿Viste mi motor? ¡Qué jevi!, ¿verdad?', '¿Viste mi motor? ¡Qué jevi!, ¿verdad? Con él llevo pan y hielo por todo el pueblo.'],
      en: ['Did you see my motorbike? «¡Qué jevi!» (So cool!), right?', 'Did you see my motorbike? «¡Qué jevi!» (So cool!), right? I take bread and ice all over town on it.'] },
    'dm.yunior.idle2': { es: ['Don Fello no pierde nunca. ¡Es un tíguere!', 'Don Fello casi nunca pierde. ¡Ese viejo es un tíguere!'],
      en: ['Don Fello never loses. He’s a «tíguere» (a sharp one)!', 'Don Fello almost never loses. That old man is a «tíguere» (a sharp one)!'] },
    'dm.chago.idle1': { es: ['¡Diache, qué bueno es hablar!', '¡Diache, qué bueno es hablar otra vez! Gracias, de verdad.'],
      en: ['«¡Diache!» It’s so good to talk!', '«¡Diache!» It’s so good to talk again! Thank you, really.'] },
    'dm.chago.idle2': { es: ['Si me equivoco, ¿qué? ¡Ta to’!', 'Ahora, si me equivoco… ¿qué? ¡Ta to’! Lo importante es jugar.'],
      en: ['If I make a mistake, so what? «¡Ta to’!» (It’s all good!)', 'Now, if I make a mistake… so what? «¡Ta to’!» (It’s all good!) What matters is playing.'] },
    'dm.fello.notReady': { es: ['¡Todavía no! Primero, las clases.'], en: ['Not yet! First, the lessons.'] },
    'dm.fello.chagoHint': { es: ['¿Contra mí? Sin mi frente no juego.', '¿Contra mí? Sin mi frente no juego. Chago tiene que volver a la {w.table}.'],
      en: ['Against me? Without my «frente» (partner) I don’t play.', 'Against me? I don’t play without my «frente» (partner). Chago has to come back to the {w.table}.'] },
    'dm.nena.first': { es: ['¿Quieres jugar? Habla con Don Fello. Es su {w.table}.'], en: ['Want to play? Talk to Don Fello. It’s his {w.table}.'] },
    // the chapters' gates and friendly games
    'dm.fello.busy': { es: ['¡Diache! Ahora estamos jugando, joven. ¡Vuelve después!'], en: ['«¡Diache!» We’re in the middle of a game, young one. Come back later!'] },
    'dm.fello.later': { es: ['¡Todavía no! Primero, tu aventura. La mesa no se va.', '¡Todavía no, joven! Primero, tu aventura. Esta {w.table} no se va pa’ ningún lado.'], en: ['Not yet! Your adventure first. The table isn’t going anywhere.', 'Not yet, young one! Your adventure first. This {w.table} isn’t going anywhere.'] },
    'dm.fello.friendly': { es: ['¿Una partidita amistosa? ¡A cincuenta!'], en: ['A friendly little game? To fifty!'] },
    'dm.fello.chagoLater': { es: ['Chago necesita tiempo. Pero ya tienes sus palabras… guárdalas bien.'], en: ['Chago needs time. But you have his words now… keep them safe.'] },
    'dm.nena.l5': { es: ['Estas son las palabras del colmado. ¡Aprende rápido, que vienen clientes!'], en: ['These are the words of the colmado. Learn fast, customers are coming!'] },
    'dm.chago.l6': { es: ['Las palabras de una final. Yo me las sé… aunque una vez se me olvidaron.'], en: ['The words of a final. I know them… even though I forgot them once.'] },
    // chapter 4: el colmado
    'dm4.nena.go': { es: ['¡Ay, mi amor! Tengo que ir al mercado de Molinar en la guagua. ¿Me cuidas el colmado esta tarde?'], en: ['Oh, dear! I have to go to the market in Molinar on the bus. Will you mind the colmado for me this afternoon?'] },
    'dm4.fello.laugh': { es: ['¡Ja! ¿Tú, detrás del mostrador? Esto lo tengo que ver.'], en: ['Ha! You, behind the counter? This I have to see.'] },
    'dm4.nena.teach': { es: ['Primero, las palabras del colmado. Ven acá.'], en: ['First, the words of the colmado. Come here.'] },
    'dm4.nena.bye': { es: ['Yunior hace los deliveries. ¡Y no le fíes a Fello, que nunca paga! ¡Ja!'], en: ['Yunior does the deliveries. And don’t give Fello credit, he never pays! Ha!'] },
    'dm4.fello.pay': { es: ['¡Oye! ¡Yo pago… a fin de mes!'], en: ['Hey! I pay… at the end of the month!'] },
    'dm4.mar.hi': { es: ['¡Buenas! Me manda mi mamá.'], en: ['Hi! My mom sent me.'] },
    'dm4.mar.want': { es: ['Un pan de agua y un chin de azúcar… Mi mamá dice que es fiao.'], en: ['A bread roll and a little sugar… My mom says it’s on the tab.'] },
    'dm4.mar.bag': { es: ['¿Y me lo das en una funda?'], en: ['And can you give it to me in a bag?'] },
    'dm4.mar.bye': { es: ['¡Gracias! ¡Bendición, Don Fello!'], en: ['Thanks! «¡Bendición!» (Bless me), Don Fello!'] },
    'dm4.fello.bless': { es: ['¡Dios te bendiga, mi niña!'], en: ['God bless you, my girl!'] },
    'dm4.car.hi': { es: ['Buenas tardes. ¿A cómo está el plátano?'], en: ['Good afternoon. How much are the plantains?'] },
    'dm4.car.three': { es: ['Dame tres, por favor.'], en: ['Give me three, please.'] },
    'dm4.car.napa': { es: ['¿Y la ñapa? En este colmado siempre hay ñapa.'], en: ['And «la ñapa»? In this colmado there’s always a little extra.'] },
    'dm4.car.bye': { es: ['¡Ay, qué buena gente! Nena tiene suerte.'], en: ['Oh, what a good soul! Nena is lucky.'] },
    'dm4.ton.hi': { es: ['¡Diache, qué calor! Dame algo frío, por favor.'], en: ['«¡Diache!» It’s so hot! Give me something cold, please.'] },
    'dm4.ton.yes': { es: ['¡Eso! Un morir soñando bien frío.'], en: ['That’s it! A nice cold morir soñando.'] },
    'dm4.ton.rico': { es: ['¡Qué rico! ¿Cuánto te debo?'], en: ['Delicious! How much do I owe you?'] },
    'dm4.ton.bye': { es: ['Toma. ¡Dile a Nena que su colmado está en buenas manos!'], en: ['Here. Tell Nena her colmado is in good hands!'] },
    'dm4.fefa': { es: ['¿Aló? ¿Colmado? Es Doña Fefa. Mándame un pan y una funda de hielo, por favor.'], en: ['«¿Aló?» (Hello?) Colmado? It’s Doña Fefa. Send me a bread roll and a bag of ice, please.'] },
    'dm4.fefa2': { es: ['Ahorita, mi amor.'], en: ['«Ahorita», dear. (In a little while.)'] },
    'dm4.yun.go': { es: ['¡De una vez! ¡Klk!'], en: ['Right away! See you!'] },
    'dm4.yun.when': { es: ['¿Ahora mismo?'], en: ['Right now?'] },
    'dm4.yun.cafe': { es: ['¿Ahorita? ¡Entonces primero, un cafecito!'], en: ['«Ahorita»? Then a little coffee first!'] },
    'dm4.fello.ahorita': { es: ['¡Ja! Un «ahorita» dominicano puede durar toda la tarde.'], en: ['Ha! A Dominican «ahorita» can last all afternoon.'] },
    'dm4.yun.voy': { es: ['¡Ta bien, ta bien! ¡Ya voy!'], en: ['OK, OK! I’m going!'] },
    'dm5.quiet': { es: ['……'], en: ['(silence)'] },
    'dm4.fel.hush': { es: ['¿Y ese silencio? ¡El radio se murió!'], en: ['What’s this silence? The radio died!'] },
    'dm4.chago.hush': { es: ['Lo gris… viene por la calle. ¡Hay que hacer ruido!'], en: ['The gray… it’s coming up the street. We have to make noise!'] },
    'dm4.yun.back': { es: ['¡Ya llegué! ¿Súbele? ¡Súbele!'], en: ['I’m back! Turn it up? Turn it up!'] },
    'dm4.all.dimelo': { es: ['¡Dímelo!'], en: ['«¡Dímelo!» (Hey, what’s up!)'] },
    'dm4.nena.back': { es: ['¡Diache! Me voy un ratito y me hacen un coro. ¡Qué jevi!'], en: ['Wow! I leave for a little while and you throw a party. How cool!'] },
    'dm4.nena.pay': { es: ['Toma, tu sueldo de la tarde. ¡Ahora eres de la casa!'], en: ['Here, your pay for the afternoon. Now you’re one of the family!'] },
    // chapter 5: la final del barrio
    'dm5.fello.torneo': { es: ['¡Llegó el día! El torneo del barrio. El primero desde aquella final…'], en: ['The day is here! The neighborhood tournament. The first one since that final…'] },
    'dm5.fello.chago': { es: ['Y este año, Chago juega contigo. Yo anoto los tantos.'], en: ['And this year, Chago plays with you. I keep the score.'] },
    'dm5.chago.fear': { es: ['Yo no sé, Fello… ¿Y si me equivoco otra vez? ¿Y si la gente se ríe?'], en: ['I don’t know, Fello… What if I make a mistake again? What if people laugh?'] },
    'dm5.chago.teach': { es: ['Antes del torneo, te enseño cómo se habla en una final.'], en: ['Before the tournament, I’ll teach you how people talk in a final.'] },
    'dm5.fello.who': { es: ['¿Y ustedes? ¿Quiénes son?'], en: ['And you two? Who are you?'] },
    'dm5.yun.who': { es: ['Diache… no dicen nada. Ni «klk».'], en: ['Wow… they don’t say a thing. Not even «klk».'] },
    'dm5.chago.know': { es: ['Yo los conozco. Son el silencio de aquella final: Don Nadie y Doña Nada.'], en: ['I know them. They’re the silence from that final: Don Nadie and Doña Nada (Mr. Nobody and Mrs. Nothing).'] },
    'dm5.chago.truth': { es: ['Aquella vez tenía capicúa… y no la canté. Me quedé callado. Por eso perdimos.'], en: ['Back then I had a capicúa… and I didn’t call it. I kept quiet. That’s why we lost.'] },
    'dm5.chago.ok': { es: ['…¡Sí puedo! ¡Vamos a jugar!'], en: ['…Yes, I can! Let’s play!'] },
    'dm5.fello.rules': { es: ['A cien. Yo anoto. ¡Dale agua!'], en: ['To a hundred. I keep score. Shuffle!'] },
    'dm5.fello.rules50': { es: ['A cincuenta. Yo anoto. ¡Dale agua!'], en: ['To fifty. I keep score. Shuffle!'] },
    'dm5.fello.revancha': { es: ['¡Diache! Pero esto no se acaba aquí. ¡Revancha cuando quieras!'], en: ['«¡Diache!» But this isn’t over. A rematch whenever you like!'] },
    'dm5.fello.back': { es: ['Ahí siguen, callados. ¿La revancha?'], en: ['They’re still sitting there, silent. The rematch?'] },
    'dm5.fello.won': { es: ['¡SE ACABÓ! ¡Ganaron!'], en: ['IT’S OVER! You won!'] },
    'dm5.chago.call': { es: ['¡FELLO! ¡ANOTA!'], en: ['FELLO! WRITE IT DOWN!'] },
    'dm5.fello.how': { es: ['¿Cómo quedó? ¡Dilo duro, pa’ que todo el barrio oiga!'], en: ['What’s the final score? Say it loud, so the whole barrio hears!'] },
    'dm5.chago.free': { es: ['¡Diache! Me equivoqué mil veces hoy… ¡y lo dije en voz alta! Ya no le tengo miedo al silencio.'], en: ['«¡Diache!» I made a thousand mistakes today… and I said them out loud! I’m not afraid of the silence anymore.'] },
    'dm5.fello.copa': { es: ['La copa del barrio. Es de ustedes dos… y del conejito.'], en: ['The neighborhood cup. It belongs to you two… and the bunny.'] },
    'dm5.nena.gracias': { es: ['Y el barrio te da las gracias. ¡Toma!'], en: ['And the barrio says thank you. Here!'] },
    'dm5.yun.coro': { es: ['¡Klk! ¡A bailar bachata!'], en: ['«¡Klk!» Let’s dance bachata!'] },
    // the neighbors, after chapter 4
    'dm.mar.idle1': { es: ['¡Bendición! ¿Juegas conmigo?'], en: ['«¡Bendición!» (Bless me!) Will you play with me?'] },
    'dm.mar.idle2': { es: ['Mi mamá dice que tú eres de la casa.'], en: ['My mom says you’re one of the family.'] },
    'dm.car.idle1': { es: ['En este barrio todos nos conocemos. ¡Y todos hablamos!'], en: ['In this barrio we all know each other. And we all talk!'] },
    'dm.car.idle2': { es: ['¿Ya probaste el mangú de Nena? ¡Con los tres golpes!'], en: ['Have you tried Nena’s mangú (mashed plantains)? With «los tres golpes» (salami, fried cheese and eggs)!'] },
    'dm.ton.idle1': { es: ['Un morir soñando y una partida de dominó: ¡eso es vida!'], en: ['A morir soñando and a game of dominoes: that’s the life!'] },
    'dm.ton.idle2': { es: ['¡Qué calor! Pero debajo del flamboyán se está bien.'], en: ['So hot! But under the flamboyán it’s nice.'] },
  };
  // the hushed partner: what the Hush left of his words (*starred* words survive; the rest goes ▬)
  const CHAGO_HUSHED = { es: '*Dominó*… *Fello*… yo *perdí*… la *final*… todos se *rieron*…', en: '*Dominoes*… *Fello*… I *lost*… the *final*… everyone *laughed*…' };
  // what people say across the board (short; Spanish with the English under it)
  const BANTER = {
    fello: {
      play: [['¡Toma!', 'Take that!'], ['Tíralo, si te atreves.', 'Play it, if you dare.'], ['Yo te tengo leído.', 'I’ve got you read.'], ['¡Ahí está!', 'There it is!'], ['Aquí se juega en serio.', 'We play for real here.']],
      pass: [['Paso… por ahora.', 'I pass… for now.'], ['¡Paso!', 'I pass!']], d66: [['¡El doble seis! La ficha de autoridad.', 'The double six! The boss tile.']],
      lock: [['¡Tranque! A contar.', 'Locked! Let’s count.']], domino: [['¡Dominó! ¿Qué te pareció?', 'Domino! How’d you like that?']], capicua: [['¡Capicúaaa! ¡Eso es arte!', 'Capicúa! That’s art!']],
      youPass: [['¡Ja! ¡Pasaste!', 'Ha! You passed!'], ['A contar fichas, joven.', 'Count the tiles, young one.']], youCapi: [['¡Diache! ¡Capicúa! Tú tienes ciencia.', 'Darn! Capicúa! You know your stuff.']],
      missCapi: [['¡Era capicúa! La capicúa que no se canta, no se cobra.', 'That was a capicúa! A capicúa you don’t call doesn’t get paid.']],
      win: [['¡Esa mano es mía!', 'That hand is mine!']], lose: [['Hmm. Suerte de principiante.', 'Hmm. Beginner’s luck.'], ['¡Qué vaina!', 'Oh, man!']],
      mirones: [['¡Los mirones son de cera!', 'Onlookers are made of wax!']], shuffle: [['¡Dale agua!', 'Shuffle!']], pase: [['¡Pase corrido! Diez pa’ mí.', 'Pase corrido! Ten for me.']],
    },
    chago: {
      play: [['Ahí va.', 'There it goes.'], ['¡Diache!', 'Darn!'], ['Esa es buena.', 'That’s a good one.']], pass: [['Paso.', 'I pass.']], lock: [['¡Tranque!', 'Locked!']],
      domino: [['¡Dominó, Fello!', 'Domino, Fello!']], capicua: [['¡Capicúa! ¡Como en los viejos tiempos!', 'Capicúa! Like the old days!']], win: [['¡Ta to’!', 'It’s all good!']], lose: [['¡Qué vaina!', 'Oh, man!']],
      youPass: [['Paso, paso… les pasa a todos.', 'Passing… happens to everyone.']], shuffle: [['Yo le doy agua.', 'I’ll shuffle.']],
    },
    nena: {
      play: [['Ahí.', 'There.'], ['Esta va aquí, mi amor.', 'This one goes here, dear.'], ['Un chin de paciencia…', 'A little patience…']], pass: [['Paso, mi amor.', 'I pass, dear.']],
      lock: [['¡Tranque!', 'Locked!']], domino: [['¡Dominó!', 'Domino!']], capicua: [['¡Capicúa!', 'Capicúa!']], win: [['¡Chévere!', 'Great!']], lose: [['¡Ay, qué vaina!', 'Oh, what a thing!']],
      youPass: [['Tranquilo, mi amor.', 'Easy, dear.']], shuffle: [['Yo doy agua.', 'I’ll shuffle.']],
    },
    yunior: {
      play: [['¡Toma!', 'Take that!'], ['¡De una vez!', 'Right away!'], ['¡Qué jevi!', 'So cool!'], ['¡Klk!', 'What’s up!']], pass: [['¡Diache, paso!', 'Darn, I pass!']],
      lock: [['¡Tranque, tranque!', 'Locked, locked!']], domino: [['¡Dominó, mi pana!', 'Domino, buddy!']], capicua: [['¡CAPICÚA! ¡Qué jevi!', 'CAPICÚA! So cool!']], win: [['¡Ta to’!', 'It’s all good!']], lose: [['¡Diache!', 'Darn!']],
      youPass: [['¡Klk! ¡Pasaste!', 'Ha! You passed!']], shuffle: [['¡Yo le doy agua, de una vez!', 'I’ll shuffle, right away!']],
    },
  };
  // the Hush's pair never says a word: every line is silence
  { const quiet = [['……', '(silence)']], gray = { play: quiet, pass: [['……', '(a gray knock)']], lock: quiet, domino: quiet, capicua: quiet, win: quiet, lose: quiet, youPass: quiet, shuffle: [['……', '(they swirl the tiles without a sound)']] };
    BANTER.nadie = gray; BANTER.nada = gray; }
  const lang = () => (typeof UI !== 'undefined' && UI.lang) || 'es';
  function lineOf(key) {
    const L = LT[key]; if (!L) return { text: key, en: key, weave: key };
    const tier = typeof LEX !== 'undefined' ? LEX.tier() : 1, arr = L[lang()] || L.es, i = Math.min(arr.length, Math.max(1, tier)) - 1, en = L.en || [''];
    return { text: arr[i], en: en[Math.min(en.length - 1, i)], weave: en[en.length - 1] };
  }
  function registerLines() { if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v; }

  // ================================================================ the place (plain data, ready before any scene exists)
  // The table at (−47.6, −162.6), on the slope west of the infill house; the colmado on the rise behind it, facing the table;
  // the flamboyán between them and the way in from the west street; Chago's bench by the colmado's left corner.
  const SITE = (() => {
    const T = { x: -47.6, z: -162.6 };
    const B = { x: -51.4, z: -166.6, w: 5.4, d: 3.4, h: 3.0 };
    B.rot = Math.atan2(T.x - B.x, T.z - B.z);
    const c = Math.cos(B.rot), s = Math.sin(B.rot);
    const bw = (lx, lz) => ({ x: B.x + lx * c + lz * s, z: B.z - lx * s + lz * c });       // the colmado's frame (+z: its front) → world
    const SEATS = {        // around the table, each facing it: N is Don Fello's; S (nearest the way in) is Chago's empty chair
      N: { x: T.x, z: T.z - 1.18, yaw: 0 }, S: { x: T.x, z: T.z + 1.18, yaw: Math.PI },
      E: { x: T.x + 1.18, z: T.z, yaw: -Math.PI / 2 }, W: { x: T.x - 1.18, z: T.z, yaw: Math.PI / 2 },
    };
    const BENCH = Object.assign(bw(-3.9, 2.4), { yaw: B.rot - 2.2 });
    return { T, B, bw, SEATS, BENCH, TREE: { x: -50.2, z: -161.0 }, MOTO: Object.assign(bw(3.9, 0.6), { yaw: B.rot + Math.PI / 2 }),
      BOARD: Object.assign(bw(-3.25, 0.7), { yaw: B.rot - 0.9 }), COOLER: bw(2.6, 2.1), CRATES: bw(-1.75, 2.1), DOOR: bw(1.6, 2.0), COUNTER: bw(-0.7, 2.2), RADIO: bw(-1.5, 1.95) };
  })();
  const near = (o, x, z, r) => Math.hypot(o.x - x, o.z - z) < r;
  // (for world.js, optional: keep trees and flowers off the colmado and the table)
  function keepClear(x, z, pad = 0) {
    if (Math.abs(x - SITE.T.x) > 12 || Math.abs(z - SITE.T.z) > 12) return false;
    return near(SITE.T, x, z, 3.2 + pad) || near(SITE.B, x, z, 3.6 + pad) || near(SITE.TREE, x, z, 1.2 + pad) || near(SITE.BENCH, x, z, 1.2 + pad) || near(SITE.MOTO, x, z, 1.4 + pad);
  }
  // (for world.js, optional: the packed-earth yard between the table and the colmado's porch, 0..1; no tall grass there)
  const YARD = (() => { const f = SITE.bw(0, 2.4); return [SITE.T.x, SITE.T.z, f.x, f.z]; })();
  function bareAt(x, z) {
    if (Math.abs(x - SITE.T.x) > 9 || Math.abs(z - SITE.T.z) > 9) return 0;
    const [ax, az, bx, bz] = YARD, dx = bx - ax, dz = bz - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1);
    return 1 - smoothstep(2.4, 3.5, Math.hypot(x - (ax + dx * t), z - (az + dz * t)));
  }

  // ================================================================ 3D helpers: pieces → one vertex-colored mesh plus one ink hull
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z), UPV = V3(0, 1, 0);
  const GEO = {
    box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl6: new THREE.CylinderGeometry(1, 1, 1, 7),
    ball: new THREE.SphereGeometry(1, 10, 7), blob: new THREE.IcosahedronGeometry(1, 1), cone: new THREE.ConeGeometry(1, 1, 8),
    disc: new THREE.CylinderGeometry(1, 1, 1, 16), tor: new THREE.TorusGeometry(1, 0.18, 6, 14),
  };
  // the dithered fade (like the towns'): what's between the camera and you, or right at the camera, melts away. The camera
  // comes from viewMatrix (three r128 sends cameraPosition only to lit materials, and the ink hulls are basic)
  const U = { uFocus: { value: V3(0, -1e4, 0) }, uFade: { value: 1 } };
  function patch(o) {
    return sh => {
      const CC = o.fade && TK.camCut;        // (the colmado's awning and sign go with the house the camera's inside: toonkit.js)
      Object.assign(sh.uniforms, U, CC ? CC.U : {}, { rimAmt: { value: o.rim || 0 } });
      let vs = 'varying vec3 vWP;\n' + sh.vertexShader;
      if (o.off) vs = vs.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${TK.fl(o.off)};`);
      vs = vs.replace('#include <project_vertex>', '#include <project_vertex>\n  vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.vertexShader = vs;
      let fs = 'uniform vec3 uFocus;\nuniform float uFade;\nuniform float rimAmt;\nvarying vec3 vWP;\n' + (CC ? CC.decl : '') + sh.fragmentShader;
      if (o.fade) fs = fs.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        ${CC ? CC.test : ''}
        { vec3 camW = -vec3(dot(viewMatrix[0].xyz, viewMatrix[3].xyz), dot(viewMatrix[1].xyz, viewMatrix[3].xyz), dot(viewMatrix[2].xyz, viewMatrix[3].xyz));
          vec3 seg = uFocus - camW; float segL = max(length(seg), 0.001); vec3 dir = seg / segL;
          vec3 rel = vWP - camW; float along = dot(rel, dir); float axis = length(rel - dir * along);
          float occl = step(0.0, along) * step(along, segL - 0.9) * (1.0 - smoothstep(1.3, 2.7, axis)) * smoothstep(0.4, 1.2, vWP.y - uFocus.y + 1.5);
          float nearCam = 1.0 - smoothstep(1.5, 3.4, length(rel));
          if (uFade > 0.5 && nearCam > 0.8) discard;
          float fadeAmt = uFade * max(occl * 0.9, nearCam);
          if (fadeAmt > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < fadeAmt) discard; }`);
      if (o.rim) fs = fs.replace('#include <tonemapping_fragment>', 'float rimF = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\ngl_FragColor.rgb += vec3(1.0, 0.95, 0.82) * rimAmt * smoothstep(0.6, 0.95, rimF);\n#include <tonemapping_fragment>');
      sh.fragmentShader = fs;
    };
  }
  const MATS = {};
  function toonM(o = {}) {
    const k = 't' + JSON.stringify(Object.assign({}, o, { map: o.map ? o.map.uuid : null }));
    if (MATS[k]) return MATS[k];
    const m = new THREE.MeshToonMaterial({ color: o.color || '#ffffff', gradientMap: TK.grad, vertexColors: !!o.vc, map: o.map || null, transparent: !!o.transparent, side: o.side || THREE.FrontSide });
    if (o.poly) { m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -o.poly; }
    if (o.transparent) m.depthWrite = false;
    m.onBeforeCompile = patch(o); m.customProgramCacheKey = () => 'domino' + k;
    return (MATS[k] = m);
  }
  function inkM(o = {}) {
    const k = 'i' + JSON.stringify(o);
    if (MATS[k]) return MATS[k];
    const m = new THREE.MeshBasicMaterial({ color: '#2b2235', side: THREE.BackSide });
    m.onBeforeCompile = patch(o); m.customProgramCacheKey = () => 'domino' + k;
    return (MATS[k] = m);
  }
  function Kit() {
    const P = [], stack = [new THREE.Matrix4()];
    const k = {
      P,
      push(x, y, z, ry = 0) { stack.push(stack[stack.length - 1].clone().multiply(new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromAxisAngle(UPV, ry), V3(1, 1, 1)))); return k; },
      pop() { if (stack.length > 1) stack.pop(); return k; },
      add(geo, color, x, y, z, sx, sy, sz, rx = 0, ry = 0, rz = 0, ink = 0.022) {
        P.push({ geo, color, m: stack[stack.length - 1].clone().multiply(TK.M4(x, y, z, sx, sy, sz, ry, rx, rz)), ink }); return k;
      },
      box(x, y, z, w, h, d, color, o = {}) { return k.add(GEO.box, color, x, y, z, w, h, d, o.rx || 0, o.ry || 0, o.rz || 0, o.ink !== undefined ? o.ink : 0.022); },
      cyl(x, y, z, r, h, color, o = {}) { return k.add(o.geo || GEO.cyl, color, x, y, z, r, h, o.rz2 || r, o.rx || 0, o.ry || 0, o.rz || 0, o.ink !== undefined ? o.ink : 0.018); },
      ball(x, y, z, sx, sy, sz, color, o = {}) { return k.add(o.geo || GEO.ball, color, x, y, z, sx, sy, sz, o.rx || 0, o.ry || 0, o.rz || 0, o.ink !== undefined ? o.ink : 0.018); },
      // a box from point a to point b (in the current frame), t thick
      beam(a, b, t, color, o = {}) {
        const d = V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
        const q = new THREE.Quaternion().setFromUnitVectors(UPV, d.clone().normalize());
        const m = new THREE.Matrix4().compose(V3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, V3(t, L, o.t2 || t));
        P.push({ geo: o.geo || GEO.box, color, m: stack[stack.length - 1].clone().multiply(m), ink: o.ink !== undefined ? o.ink : 0.018 }); return k;
      },
    };
    return k;
  }
  const BB = new Map();
  const bbOf = g => { let r = BB.get(g); if (!r) { g.computeBoundingBox(); r = { size: g.boundingBox.getSize(V3(0, 0, 0)), ctr: g.boundingBox.getCenter(V3(0, 0, 0)) }; BB.set(g, r); } return r; };
  // pieces → { geo (positions, normals, vertex colors), hull (the pieces with ink, each blown up by its ink in world units) }
  function bake(P) {
    const parts = [], hulls = [], _p = V3(0, 0, 0), _q = new THREE.Quaternion(), _s = V3(0, 0, 0);
    for (const p of P) {
      const g = (p.geo.index ? p.geo.toNonIndexed() : p.geo.clone()).applyMatrix4(p.m);
      parts.push({ g, c: new THREE.Color(p.color) });
      if (p.ink > 0) {
        const { size, ctr } = bbOf(p.geo); p.m.decompose(_p, _q, _s);
        const k = [size.x * Math.abs(_s.x), size.y * Math.abs(_s.y), size.z * Math.abs(_s.z)].map(v => (v > 1e-5 ? (v + 2 * p.ink) / v : 1));
        const hm = p.m.clone().multiply(new THREE.Matrix4().makeTranslation(ctr.x, ctr.y, ctr.z)).multiply(new THREE.Matrix4().makeScale(k[0], k[1], k[2])).multiply(new THREE.Matrix4().makeTranslation(-ctr.x, -ctr.y, -ctr.z));
        hulls.push((p.geo.index ? p.geo.toNonIndexed() : p.geo.clone()).applyMatrix4(hm));
      }
    }
    const merge = (list, withColor) => {
      let n = 0; for (const it of list) n += (withColor ? it.g : it).attributes.position.count;
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = withColor ? new Float32Array(n * 3) : null;
      let o = 0;
      for (const it of list) {
        const g = withColor ? it.g : it, cnt = g.attributes.position.count;
        pos.set(g.attributes.position.array, o * 3); if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
        if (withColor) for (let i = 0; i < cnt; i++) { col[(o + i) * 3] = it.c.r; col[(o + i) * 3 + 1] = it.c.g; col[(o + i) * 3 + 2] = it.c.b; }
        o += cnt;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      geo.computeBoundingSphere();
      return geo;
    };
    return { geo: merge(parts, true), hull: hulls.length ? merge(hulls, false) : null };
  }
  function inked(P, o = {}) {
    const { geo, hull } = bake(P), g = new THREE.Group();
    const m = new THREE.Mesh(geo, o.mat || toonM({ vc: 1, rim: 0.2, fade: o.fade !== false })); m.castShadow = o.shadow !== false; m.receiveShadow = true; g.add(m);
    if (hull) { const h = new THREE.Mesh(hull, inkM({ fade: o.fade !== false })); h.castShadow = false; g.add(h); }
    g.userData.mesh = m;
    return g;
  }

  // ---------------------------------------------------------------- the dominoes on the 3D table: one mesh, an atlas of the 7 faces
  const ATLAS = (() => {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 64;
    const c = cv.getContext('2d');
    const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [-1, 0], [-1, 1], [1, -1], [1, 0], [1, 1]] };
    for (let i = 0; i < 8; i++) {
      const x0 = i * 64;
      c.fillStyle = '#fbf7ea'; c.fillRect(x0, 0, 64, 64);
      if (i === 7) continue;
      c.fillStyle = 'rgba(43,34,53,0.55)'; c.fillRect(x0, 0, 64, 4);                  // (the line across the middle of the tile)
      for (const [px, py] of P[i] || []) { c.beginPath(); c.arc(x0 + 32 + px * 17, 34 + py * 16, 6.2, 0, TAU); c.fillStyle = '#2b2235'; c.fill(); }
    }
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4;
    return tex;
  })();
  const U3 = 0.075;            // half a tile, in world units (the tiles are a little big, so you can see them)
  // list: [{ x, y, z, ry, stand, top, bot }] (world; stand: upright, back to the table). → one BufferGeometry with uvs into ATLAS
  function tilesGeo(list) {
    const pos = [], nor = [], uv = [];
    const cell = (i, u, v) => [(i * 64 + 2 + u * 60) / 512, 1 - (2 + v * 60) / 64];
    const quad = (m, a, b, c, d, n, ci, flip) => {      // corners in the tile's frame, uv from cell ci
      const pts = [a, b, c, d].map(p => V3(...p).applyMatrix4(m)), nn = V3(...n).transformDirection(m);
      const uvs = flip ? [cell(ci, 1, 1), cell(ci, 0, 1), cell(ci, 0, 0), cell(ci, 1, 0)] : [cell(ci, 0, 0), cell(ci, 1, 0), cell(ci, 1, 1), cell(ci, 0, 1)];
      for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(pts[i].x, pts[i].y, pts[i].z); nor.push(nn.x, nn.y, nn.z); uv.push(...uvs[i]); }
    };
    const W = U3 * 0.96, L = U3 * 1.96, Hh = 0.032;
    for (const t of list) {
      const m = new THREE.Matrix4().compose(V3(t.x, t.y + (t.stand ? L / 2 : 0), t.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(t.stand ? -Math.PI / 2 + 0.12 : 0, t.ry || 0, 0, 'YXZ')), V3(1, 1, 1));
      const x = W / 2, z = L / 2, y0 = t.stand ? 0 : 0, y1 = Hh;
      // the body (blank ivory): four sides and the bottom
      quad(m, [-x, y0, z], [x, y0, z], [x, y1, z], [-x, y1, z], [0, 0, 1], 7);
      quad(m, [x, y0, -z], [-x, y0, -z], [-x, y1, -z], [x, y1, -z], [0, 0, -1], 7);
      quad(m, [x, y0, z], [x, y0, -z], [x, y1, -z], [x, y1, z], [1, 0, 0], 7);
      quad(m, [-x, y0, -z], [-x, y0, z], [-x, y1, z], [-x, y1, -z], [-1, 0, 0], 7);
      // the face: two halves (top half at −z), or the plain back for a tile standing in someone's hand
      if (t.stand) quad(m, [-x, y1, z], [x, y1, z], [x, y1, -z], [-x, y1, -z], [0, 1, 0], 7);
      else { quad(m, [-x, y1, 0], [x, y1, 0], [x, y1, -z], [-x, y1, -z], [0, 1, 0], t.top, false); quad(m, [x, y1, 0], [-x, y1, 0], [-x, y1, z], [x, y1, z], [0, 1, 0], t.bot, false); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeBoundingSphere();
    return g;
  }
  // Where each tile of the line goes (shared by the board and the 3D table): units of half a tile, origin at the table's centre,
  // +y down (toward you). Tiles run out from the first one both ways; a double lies across the line; at the edge the line
  // turns a corner (down on the right, up on the left) and runs back. Each: { id, x, y, rot (deg: 0 upright, −90 lying with
  // its top half on the left), top, bot, seat, k (the order it was played) }; ends: where the next tile would go on each side.
  function snake(H, Wu, order) {
    const out = [], ends = [null, null];
    if (H.center < 0) return { tiles: out, ends };
    const c = H.center, cd = DBL[c];
    out.push(cd ? { id: c, x: 0, y: 0, rot: 0, top: TA[c], bot: TB[c], k: 0 } : { id: c, x: 0, y: 0, rot: -90, top: TA[c], bot: TB[c], k: 0 });
    const bound = Wu / 2 - 0.4;
    for (const side of [0, 1]) {
      const vdir = side ? 1 : -1;
      let dir = side ? 1 : -1, x = dir * (cd ? 0.5 : 1), y = 0;
      const place = (t, kk) => {
        const len = DBL[t.id] ? 1 : 2;
        if (Math.abs(x + dir * len) > bound) {            // the corner: this tile hangs off the end, then the line runs back
          const cx = x - dir * 0.5, cy = y + vdir * 1.5;
          out.push(vdir > 0 ? { id: t.id, x: cx, y: cy, rot: 0, top: t.from, bot: t.to, seat: t.seat, k: kk } : { id: t.id, x: cx, y: cy, rot: 0, top: t.to, bot: t.from, seat: t.seat, k: kk });
          y += vdir * 2; x -= dir; dir = -dir;
          return;
        }
        if (DBL[t.id]) { out.push({ id: t.id, x: x + dir * 0.5, y, rot: 0, top: t.from, bot: t.to, seat: t.seat, k: kk }); x += dir; }
        else { out.push({ id: t.id, x: x + dir, y, rot: -90, top: dir > 0 ? t.from : t.to, bot: dir > 0 ? t.to : t.from, seat: t.seat, k: kk }); x += dir * 2; }
      };
      (H.chains ? H.chains[side] : []).forEach(t => place(t, order ? order.get(t) : 0));
      // the next spot on this side (for a tile that isn't a double)
      ends[side] = Math.abs(x + dir * 2) > bound ? { x: x - dir * 0.5, y: y + vdir * 1.5, rot: 0 } : { x: x + dir, y, rot: -90 };
    }
    return { tiles: out, ends };
  }

  // ---------------------------------------------------------------- the people: drawn like the townsfolk, every body part of
  // every person in one instanced mesh per part (plus an ink hull), so the four of them cost about fifteen draw calls
  const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 13);
  const PART = {
    lathe: { geo: lathe([[0, 0], [0.38, 0.02], [0.37, 0.3], [0.28, 0.68], [0.2, 0.9], [0.1, 0.97], [0, 0.98]]), ink: 0.02 },
    head: { geo: new THREE.SphereGeometry(1, 14, 10), ink: 0.02 },
    ball: { geo: new THREE.SphereGeometry(1, 8, 6), ink: 0.03 },
    cap: { geo: new THREE.SphereGeometry(1, 12, 5, 0, TAU, 0, Math.PI * 0.5), ink: 0.02 },
    cyl: { geo: new THREE.CylinderGeometry(1, 1, 1, 8), ink: 0.03 },
    box: { geo: new THREE.BoxGeometry(1, 1, 1), ink: 0.03 },
    eye: { geo: new THREE.SphereGeometry(1, 6, 4), ink: 0, basic: '#2b2235' },
    hl: { geo: new THREE.SphereGeometry(1, 5, 3), ink: 0, basic: '#ffffff' },
    blush: { geo: new THREE.SphereGeometry(1, 6, 4), ink: 0, blush: true },
    ring: { geo: new THREE.TorusGeometry(1, 0.12, 5, 16), ink: 0, basic: '#2b2235' },
  };
  const grayOf = hex => { const c = new THREE.Color(hex), l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; return c.lerp(new THREE.Color(l * 0.86, l * 0.86, l * 0.95), 0.88); };
  function Rig() {
    const leaves = Object.fromEntries(Object.keys(PART).map(k => [k, []]));
    let who = null;
    const leaf = (parent, part, color, pos, scale, rot) => {
      const n = new THREE.Object3D(); if (pos) n.position.set(...pos); if (scale) n.scale.set(...scale); if (rot) n.rotation.set(...rot);
      parent.add(n); leaves[part].push({ n, color, c0: color ? new THREE.Color(color) : null, cg: color ? grayOf(color) : null, who }); return n;
    };
    const node = (parent, pos, rot) => { const n = new THREE.Object3D(); if (pos) n.position.set(...pos); if (rot) n.rotation.set(...rot); parent.add(n); return n; };
    function meshes(group) {
      const list = [];
      for (const [name, L] of Object.entries(leaves)) {
        if (!L.length) continue;
        const P = PART[name];
        const mat = P.basic ? new THREE.MeshBasicMaterial({ color: P.basic }) : P.blush ? new THREE.MeshBasicMaterial({ color: '#ff8c9a', transparent: true, opacity: 0.5, depthWrite: false }) : toonM({ rim: 0.32 });
        const im = new THREE.InstancedMesh(P.geo, mat, L.length);
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = P.ink > 0; im.name = 'dm-folk-' + name;
        if (!P.basic && !P.blush) L.forEach((l, i) => im.setColorAt(i, l.c0));
        group.add(im); list.push({ im, L, colored: !P.basic && !P.blush });
        if (P.ink) { const h = new THREE.InstancedMesh(P.geo, inkM({ off: P.ink }), L.length); h.instanceMatrix = im.instanceMatrix; h.frustumCulled = false; h.name = 'dm-folk-' + name + '-ink'; group.add(h); list.push({ im: h, L: null }); }
      }
      const tmp = new THREE.Color();
      return {
        list,
        sync() { for (const { im, L } of list) { if (!L) continue; for (let i = 0; i < L.length; i++) im.setMatrixAt(i, L[i].n.matrixWorld); im.instanceMatrix.needsUpdate = true; } },
        recolor(person) {        // a person's gray (the Hush) changed: their colors drift between their own and gray
          for (const { im, L, colored } of list) {
            if (!L || !colored) continue;
            let any = false;
            for (let i = 0; i < L.length; i++) if (L[i].who === person) { im.setColorAt(i, tmp.copy(L[i].c0).lerp(L[i].cg, person.gray)); any = true; }
            if (any && im.instanceColor) im.instanceColor.needsUpdate = true;
          }
        },
      };
    }
    return { leaf, node, meshes, leaves, set who(p) { who = p; } };
  }
  // one person: d = { skin, hair, dress, sleeve, pants, shoes, apron, hairdo: bald|short|bun, hat: fedora|scarf|capBack|beret, stache, beard, glasses, legs, h, w, pleats, rolos }
  function makePerson(rig, d) {
    const { leaf, node } = rig, w = d.w || 1, root = new THREE.Object3D(), body = node(root);
    root.scale.setScalar(d.h || 1);
    const R = { root, body, legs: null, feet: [], arms: [], head: null, eyes: [], hls: [], mouth: null, tileHand: null };
    if (d.legs) {
      leaf(body, 'lathe', d.dress, [0, 0.36, 0], [w, 0.64, w]);
      R.legs = [-1, 1].map(s => { const hip = node(body, [s * 0.12 * w, 0.4, 0]); leaf(hip, 'cyl', d.pants || '#3a4466', [0, -0.18, 0], [0.085, 0.36, 0.085]); R.feet.push(leaf(hip, 'ball', d.shoes || '#5b3a22', [0, -0.36, 0.05], [0.1, 0.075, 0.15])); return hip; });
    } else {
      leaf(body, 'lathe', d.dress, null, [w, 1, w]);
      R.feet = [-1, 1].map(s => leaf(body, 'ball', d.shoes || '#5b3a22', [s * 0.13 * w, 0.04, 0.12], [0.1, 0.07, 0.14]));
    }
    if (d.apron) leaf(body, 'ball', d.apron, [0, 0.42, 0.26 * w], [0.24 * w, 0.3, 0.08]);
    if (d.pleats) { [-1, 1].forEach(s => leaf(body, 'box', d.pleats, [s * 0.09 * w, 0.68, 0.24 * w], [0.025, 0.36, 0.02], [0.22, 0, 0])); leaf(body, 'box', d.pleats, [0.12 * w, 0.78, 0.22 * w], [0.08, 0.07, 0.02], [0.3, 0, 0]); }
    if (d.number) leaf(body, 'box', d.number, [0, 0.66, 0.255 * w], [0.14, 0.12, 0.02], [0.22, 0, 0]);
    R.arms = [-1, 1].map(s => {
      const sh = node(body, [s * 0.25 * w, 0.84, 0.05], [-0.5, 0, -s * 0.2]);
      leaf(sh, 'cyl', d.sleeve || d.dress, [0, -0.14, 0], [0.07, 0.28, 0.07]);
      const hand = node(sh, [0, -0.3, 0]); leaf(hand, 'ball', d.skin, null, [0.07, 0.07, 0.07]);
      sh.userData.hand = hand; return sh;
    });
    const head = R.head = node(body, [0, 0.98, 0]);
    leaf(head, 'head', d.skin, [0, 0.2, 0], [0.28, 0.27, 0.27]);
    if (d.hairdo === 'bald') leaf(head, 'cap', d.hair, [0, 0.14, -0.06], [0.285, 0.2, 0.26], [-1.1, 0, 0]);
    else leaf(head, 'cap', d.hair, [0, 0.22, -0.02], [0.29, 0.29, 0.29], [-0.5, 0, 0]);
    if (d.hairdo === 'bun') leaf(head, 'ball', d.hair, [0, 0.42, -0.2], [0.12, 0.12, 0.12]);
    R.eyes = [-1, 1].map(s => { const e = node(head, [s * 0.1, 0.21, 0.24]); leaf(e, 'eye', null, null, [0.04, 0.06, 0.025]); R.hls.push(leaf(e, 'hl', null, [0.013, 0.023, 0.022], [0.017, 0.017, 0.017])); return e; });
    R.blush = [-1, 1].map(s => leaf(head, 'blush', null, [s * 0.17, 0.09, 0.23], [0.05, 0.0275, 0.015], [0, s * 0.4, 0]));
    R.mouth = leaf(head, 'eye', null, [0, 0.07, 0.27], [0.035, 0.012, 0.01]);
    if (d.stache) for (const s of [-1, 1]) leaf(head, 'ball', d.stache, [s * 0.055, 0.105, 0.255], [0.07, 0.03, 0.03], [0, 0, -s * 0.3]);
    if (d.beard) leaf(head, 'ball', d.beard, [0, 0.03, 0.12], [0.21, 0.17, 0.16]);
    if (d.glasses) for (const s of [-1, 1]) leaf(head, 'ring', null, [s * 0.1, 0.19, 0.265], [0.066, 0.066, 0.066]);
    const hat = node(head, [0, 0.4, 0]);
    if (d.hat === 'fedora') { leaf(hat, 'cyl', d.hatColor, [0, -0.04, 0], [0.42, 0.025, 0.42]); leaf(hat, 'cyl', d.hatColor, [0, 0.06, 0], [0.215, 0.18, 0.2]); leaf(hat, 'cyl', d.band || '#4a3a33', [0, 0.0, 0], [0.22, 0.045, 0.205]); }
    else if (d.hat === 'scarf') {
      leaf(hat, 'cap', d.hatColor, [0, -0.2, -0.01], [0.31, 0.32, 0.31], [-0.25, 0, 0]); leaf(hat, 'ball', d.hatColor, [0, -0.33, -0.27], [0.08, 0.08, 0.08]);
      if (d.rolos) d.rolos.forEach((col, i) => leaf(hat, 'cyl', col, [(i - 1) * 0.1, -0.1, 0.24], [0.045, 0.1, 0.045], [0, 0, Math.PI / 2]));
    } else if (d.hat === 'capBack') { leaf(hat, 'cap', d.hatColor, [0, -0.08, 0], [0.3, 0.22, 0.3]); leaf(hat, 'cyl', d.hatColor, [0, -0.08, -0.26], [0.16, 0.02, 0.12]); }
    else if (d.hat === 'beret') leaf(hat, 'ball', d.hatColor, [0.04, -0.07, -0.02], [0.3, 0.09, 0.3], [0, 0, 0.2]);
    // a domino in the right hand (Don Fello slams it down)
    R.tileHand = leaf(R.arms[1].userData.hand, 'box', '#fbf7ea', [0, -0.05, 0.05], [0.05, 0.1, 0.022]);
    return R;
  }

  // ================================================================ the game side
  let G = null;                   // the game (main.js): { sim, w3d, cam, cast, state, save }
  const st = () => { const s = G.state; return s.domino || (s.domino = {}); };
  const shown = () => !!(G && G.state && G.state.lang === 'es' && G.state.flags && G.state.flags.hatched);
  const wait = s => (typeof STORY !== 'undefined' && STORY.wait ? STORY.wait(s) : new Promise(r => setTimeout(r, s * 1000)));
  let built = null;               // what build() made
  const EXTRA = ['maritza', 'carmen', 'tono', 'nadie', 'nada'];        // (people who only appear from chapter 4 or 5 on)
  // A scene that moves people around sets lock (nobody snaps back to their places), hush (the gray, 0..1), music (the radio's
  // bachata, 0..1), radioOff (no notes over the radio) and noAmb (no game in the background)
  const SC = { lock: false, hush: 0, music: 0, radioOff: false, noAmb: false };
  // where the neighbors hang out once chapter 4 is done, and the spots the scenes use
  const HANG = { maritza: { x: SITE.TREE.x - 0.9, z: SITE.TREE.z + 1.0, face: SITE.T }, carmen: { bench: true }, tono: Object.assign(SITE.bw(2.7, 3.05), { face: SITE.T }) };
  // (walks go through waypoints clear of the flamboyán's trunk, Chago's bench, the table and the chairs)
  const SPOTS = {
    gate: { x: -55.5, z: -159.5 },                  // where people come in from the west street
    wp1: { x: -51.6, z: -160.9 }, wp2: { x: -51.0, z: -162.4 }, south: { x: -47.6, z: -159.6 }, east: { x: -45.4, z: -162.6 },
    cust: SITE.bw(-0.7, 3.15), clerk: SITE.bw(1.0, 3.2), window: SITE.bw(-0.7, 2.0),
    you5: { x: SITE.T.x + 0.15, z: SITE.T.z + 1.75 }, anotador: SITE.bw(-2.6, 3.3),
    spec: { nena: SITE.bw(1.6, 3.4), yunior: { x: -46.4, z: -165.1 }, maritza: { x: -50.1, z: -163.5 }, tono: { x: -45.3, z: -164.0 } },
    party: { maritza: { x: -50.1, z: -163.5 }, carmen: { x: -50.65, z: -162.62 }, tono: { x: -45.43, z: -165.1 }, nena: { x: -46.9, z: -165.35 } },
  };

  // ================================================================ build: the colmado, the table, the flamboyán, the people
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    const root = new THREE.Group(); root.name = 'domino'; scene.add(root);
    const inner = new THREE.Group(); inner.name = 'domino-inner'; root.add(inner);
    Object.defineProperty(inner, 'visible', { get: () => shown(), set() {}, configurable: true });     // (outside Spanish games none of it exists)
    const { T, B, SEATS } = SITE;
    const colliders = [];
    const solid = c => { c.x0 = c.x; c.z0 = c.z; colliders.push(c); return c; };
    const k = Kit();
    // ---------------- the colmado: a little turquoise corner store on the rise, facing the table
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => SITE.bw(a * (B.w / 2 + 0.2), b * (B.d / 2 + 0.6)));
    const gys = corners.map(p => gy(p.x, p.z)), fy = Math.max(...gys) + 0.06, low = Math.min(...gys);
    const { w, d, h } = B, fz = d / 2;
    k.push(B.x, 0, B.z, B.rot);
    k.box(0, (low - 0.5 + fy) / 2, 0.25, w + 0.3, fy - low + 0.5, d + 0.8, '#b9ac98');                    // the foundation (and a little porch)
    k.box(0, fy + h / 2, 0, w, h, d, '#3fb8af');
    k.box(0, fy + 0.18, 0, w + 0.06, 0.36, d + 0.06, '#2f8f86', { ink: 0.015 });
    k.box(0, fy + h + 0.09, 0, w + 0.22, 0.18, d + 0.22, '#ffd166');
    k.box(0, fy + h + 0.3, -0.2, w - 0.2, 0.26, d - 0.6, '#d9d2c4', { ink: 0.015 });                       // a water tank on the roof
    k.cyl(1.4, fy + h + 0.62, -0.5, 0.38, 0.6, '#2b2f3a');
    [-1, 1].forEach(s => k.box(s * (w / 2 - 0.12), fy + h / 2, fz - 0.1, 0.3, h, 0.24, '#ffd166', { ink: 0.015 }));
    // the service window: dark inside, shelves of colorful things, iron bars, a wooden counter, and the radio on it
    k.box(-0.7, fy + 1.55, fz + 0.01, 2.5, 1.3, 0.04, '#3a2f3d', { ink: 0 });
    const goods = ['#e2453a', '#ffd166', '#4f9a5a', '#3d7fd1', '#f2a03a', '#fffaf0', '#c9553f', '#9cc45a'];
    for (let r = 0; r < 3; r++) {
      k.box(-0.7, fy + 1.05 + r * 0.42, fz + 0.04, 2.4, 0.04, 0.1, '#8a5f3e', { ink: 0 });
      for (let i = 0; i < 9; i++) { const hh = 0.14 + ((i * 7 + r * 3) % 5) * 0.03; k.box(-1.75 + i * 0.26, fy + 1.07 + r * 0.42 + hh / 2, fz + 0.05, 0.16, hh, 0.06, goods[(i + r * 3) % goods.length], { ink: 0 }); }
    }
    for (let i = 0; i < 9; i++) k.cyl(-1.9 + i * 0.3, fy + 1.58, fz + 0.1, 0.018, 1.25, '#fffaf0', { ink: 0.008, geo: GEO.cyl6 });
    k.box(-0.7, fy + 0.93, fz + 0.24, 2.7, 0.1, 0.5, '#a8673a');
    k.box(-0.7, fy + 0.45, fz + 0.06, 2.7, 0.86, 0.06, '#e8f6f3', { ink: 0.012 });
    k.box(-0.7, fy + 0.45, fz + 0.1, 2.7, 0.14, 0.02, '#e2453a', { ink: 0 });
    // the radio: «el radio», as they say there
    k.box(-1.5, fy + 1.12, fz + 0.3, 0.42, 0.26, 0.16, '#d9573f');
    k.cyl(-1.6, fy + 1.12, fz + 0.385, 0.08, 0.02, '#2b2235', { rx: Math.PI / 2, ink: 0 });
    k.box(-1.38, fy + 1.16, fz + 0.385, 0.12, 0.06, 0.02, '#fff3c4', { ink: 0 });
    k.beam([-1.66, fy + 1.24, fz + 0.28], [-1.86, fy + 1.66, fz + 0.24], 0.012, '#8a8f9e', { ink: 0 });
    // a little cup of coffee on the counter, and the door with its strip curtain
    k.cyl(-0.2, fy + 1.03, fz + 0.3, 0.05, 0.09, '#fffaf0', { ink: 0.008 });
    k.box(1.6, fy + 1.05, fz + 0.015, 0.98, 2.1, 0.04, '#2a2232', { ink: 0 });
    const strips = ['#e2453a', '#ffd166', '#3d7fd1', '#4f9a5a', '#fffaf0', '#e86a9a'];
    for (let i = 0; i < 6; i++) k.box(1.2 + i * 0.16, fy + 1.0, fz + 0.04, 0.12, 1.95, 0.01, strips[i], { ink: 0 });
    k.box(1.6, fy + 2.15, fz + 0.03, 1.12, 0.1, 0.06, '#ffd166', { ink: 0.01 });
    { const sp = SITE.bw(1.6, 2.62), g0 = gy(sp.x, sp.z), top = (g0 + fy) / 2; k.box(1.6, (g0 - 0.25 + top) / 2, 2.62, 1.2, top - g0 + 0.25, 0.5, '#b9ac98', { ink: 0.012 }); }   // the step down
    // on the porch: the ice cooler by the door, and crates of plantains, oranges and avocados under the window
    k.box(2.45, fy + 0.42, fz + 0.36, 0.8, 0.84, 0.5, '#f4f1ea'); k.box(2.45, fy + 0.88, fz + 0.36, 0.84, 0.1, 0.54, '#3d7fd1'); k.box(2.45, fy + 0.5, fz + 0.615, 0.44, 0.16, 0.01, '#3d7fd1', { ink: 0 });
    [[-2.25, 0, '#9cc45a'], [-1.65, 0, '#f2a03a'], [-1.95, 0.4, '#5f8f3a']].forEach(([x, yy, fruit]) => {
      k.box(x, fy + yy + 0.19, fz + 0.36, 0.56, 0.38, 0.44, '#c9955a', { ink: 0.015 });
      for (let i = 0; i < 6; i++) k.ball(x + ((i % 3) - 1) * 0.15, fy + yy + 0.4, fz + 0.36 + ((i / 3) | 0) * 0.17 - 0.085, 0.08, 0.075, 0.08, fruit, { ink: 0.008 });
    });
    // the zinc awning over the front, on two posts, ridged
    const aw0 = [0, fy + 2.85, fz], aw1 = [0, fy + 2.45, fz + 1.35];
    k.beam([-(w / 2 + 0.15), aw0[1], aw0[2] + 0.02], [-(w / 2 + 0.15), aw1[1], aw1[2]], 0.05, '#9aa7b0', { t2: 0.05, ink: 0 });
    for (let i = 0; i < 14; i++) {
      const x = -(w / 2 + 0.1) + i * (w + 0.2) / 13;
      k.beam([x, aw0[1] + 0.03, aw0[2] + 0.02], [x, aw1[1] + 0.03, aw1[2]], 0.05, i % 2 ? '#aab6be' : '#8796a0', { t2: 0.03, ink: 0 });
    }
    k.box(0, (aw0[1] + aw1[1]) / 2, (aw0[2] + aw1[2]) / 2, w + 0.3, 0.04, 1.42, '#9aa7b0', { rx: Math.atan2(0.4, 1.35), ink: 0.015 });
    [-1, 1].forEach(s => k.cyl(s * (w / 2 + 0.05), (fy + aw1[1]) / 2 - 0.15, aw1[2] - 0.05, 0.05, aw1[1] - fy + 0.1, '#7a5236'));
    // plantains hanging under the awning (a green bunch and a yellow one)
    [[-2.25, '#7fb04a'], [-1.95, '#f2c94c']].forEach(([x, col]) => {
      k.cyl(x, fy + 2.32, fz + 0.75, 0.012, 0.35, '#5b3a22', { ink: 0 });
      for (let i = 0; i < 7; i++) { const a = i * 0.9; k.ball(x + Math.cos(a) * 0.06, fy + 2.02 + (i % 3) * 0.05, fz + 0.75 + Math.sin(a) * 0.06, 0.035, 0.13, 0.035, col, { rz: Math.cos(a) * 0.5, rx: Math.sin(a) * 0.5, ink: 0.008 }); }
    });
    k.pop();
    colliders.push(solid({ obox: 1, x: B.x + Math.sin(B.rot) * 0.3, z: B.z + Math.cos(B.rot) * 0.3, hw: w / 2 + 0.15, hd: d / 2 + 0.6, rot: B.rot }));
    // ---------------- the table, and four plastic chairs
    const tgs = [[-0.6, -0.6], [0.6, -0.6], [0.6, 0.6], [-0.6, 0.6]].map(([a, b]) => gy(T.x + a, T.z + b));
    const ty = Math.max(...tgs) + 0.74;
    k.box(T.x, ty, T.z, 1.32, 0.07, 1.32, '#b98a52');
    [[0, -0.66], [0, 0.66]].forEach(([a, b]) => k.box(T.x + a, ty + 0.05, T.z + b, 1.36, 0.06, 0.06, '#8a5f3e', { ink: 0.01 }));
    [[-0.66, 0], [0.66, 0]].forEach(([a, b]) => k.box(T.x + a, ty + 0.05, T.z + b, 0.06, 0.06, 1.36, '#8a5f3e', { ink: 0.01 }));
    [[-0.55, -0.55], [0.55, -0.55], [0.55, 0.55], [-0.55, 0.55]].forEach(([a, b], i) => { const g0 = gy(T.x + a, T.z + b) - 0.05; k.box(T.x + a, (g0 + ty) / 2, T.z + b, 0.07, ty - g0, 0.07, '#7a5236', { ink: 0.012 }); });
    colliders.push(solid({ x: T.x, z: T.z, r: 0.78 }));
    // the little coffee cups: Fello's, and a cold one in front of the empty chair
    k.cyl(T.x + 0.38, ty + 0.08, T.z - 0.42, 0.045, 0.08, '#fffaf0', { ink: 0.008 });
    k.cyl(T.x - 0.36, ty + 0.08, T.z + 0.44, 0.045, 0.08, '#fffaf0', { ink: 0.008 });
    const chairs = {};
    for (const [key, sp] of Object.entries(SEATS)) {
      const back = 0.12, cx = sp.x - Math.sin(sp.yaw) * back, cz = sp.z - Math.cos(sp.yaw) * back, y = gy(cx, cz), col = key === 'N' ? '#d9493b' : '#f4f1ea';
      k.push(cx, y, cz, sp.yaw);
      k.box(0, 0.45, 0, 0.48, 0.05, 0.46, col, { ink: 0.012 });
      k.box(0, 0.74, -0.24, 0.48, 0.5, 0.05, col, { rx: -0.12, ink: 0.012 });
      [[-0.2, -0.19], [0.2, -0.19], [0.2, 0.19], [-0.2, 0.19]].forEach(([a, b]) => k.cyl(a, 0.22, b, 0.022, 0.45, col, { ink: 0.008, geo: GEO.cyl6 }));
      k.pop();
      chairs[key] = { x: cx, z: cz, y };
    }
    // ---------------- the flamboyán: a leaning trunk, three branches, and a wide flat crown, flame red on top
    const TR = SITE.TREE, tgy = gy(TR.x, TR.z), lean = { x: (T.x - TR.x) * 0.12, z: (T.z - TR.z) * 0.12 };
    const top = [TR.x + lean.x, tgy + 2.5, TR.z + lean.z];
    k.beam([TR.x, tgy - 0.2, TR.z], top, 0.21, '#9a7458', { geo: GEO.cyl6, ink: 0.02 });
    const crownC = { x: lerp(TR.x, T.x, 0.42), z: lerp(TR.z, T.z, 0.42) }, cy = tgy + 4.1;
    const brs = [[-1.5, 0.3], [1.4, 0.9], [0.4, -1.6]].map(([a, b]) => [crownC.x + a, cy - 0.4, crownC.z + b]);
    brs.forEach(b => k.beam(top, b, 0.11, '#9a7458', { geo: GEO.cyl6, ink: 0.015 }));
    k.add(GEO.ball, '#6f8a3a', TR.x, tgy + 0.02, TR.z, 0.5, 0.06, 0.5, 0, 0, 0, 0);       // (a ring of fallen leaves at its foot)
    colliders.push(solid({ x: TR.x, z: TR.z, r: 0.38 }));
    const crown = Kit(), RC = rng(2213);
    // (a flamboyán in bloom: a wide umbrella of flame-red flowers, the feathery green showing through)
    const greens = ['#4f9a45', '#5fae4f', '#3f8a3a', '#68b351'], flames = ['#e8452c', '#f26b38', '#ff7a33', '#d93a2b'];
    crown.add(GEO.blob, greens[0], crownC.x, cy, crownC.z, 2.0, 0.6, 2.0, 0, 0, 0, 0.03);
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU + RC() * 0.4, r = 2.0 + RC() * 0.6, s = 1.1 + RC() * 0.5;
      crown.add(GEO.blob, i % 3 === 0 ? greens[i % 4] : flames[i % 4], crownC.x + Math.cos(a) * r, cy - 0.12 + RC() * 0.3, crownC.z + Math.sin(a) * r, s * 1.15, s * 0.42, s, 0, RC() * TAU, 0, 0.03);
    }
    for (let i = 0; i < 30; i++) {
      const a = RC() * TAU, r = Math.sqrt(RC()) * 3.1, s = 0.38 + RC() * 0.34, under = i % 3 === 0;
      crown.add(GEO.blob, flames[i % 4], crownC.x + Math.cos(a) * r, under ? cy - 0.45 - RC() * 0.15 : cy + 0.32 + RC() * 0.25 - r * 0.06, crownC.z + Math.sin(a) * r, s * 1.2, s * 0.6, s, 0, RC() * TAU, 0, 0.02);
    }
    // ---------------- Chago's bench, the chalkboard with the house rules, Yunior's motorbike, the bunting
    { const Bn = SITE.BENCH, y = gy(Bn.x, Bn.z); k.push(Bn.x, y, Bn.z, Bn.yaw);
      k.box(0, 0.44, 0, 1.4, 0.07, 0.42, '#a8673a'); k.box(0, 0.74, -0.2, 1.4, 0.3, 0.05, '#a8673a', { rx: -0.15 });
      [[-0.6, 0], [0.6, 0]].forEach(([a]) => k.box(a, 0.22, 0, 0.08, 0.44, 0.36, '#7a5236', { ink: 0.012 }));
      k.pop(); colliders.push(solid({ obox: 1, x: Bn.x, z: Bn.z, hw: 0.72, hd: 0.25, rot: Bn.yaw })); }
    // (the house rules in bold chalk, as big as seven lines allow on the easel; E «Read» shows them big: rulesCard. During
    // the tournament it's the scoreboard: chalk(score))
    const chalk = (c, score) => {
      const F = 'Bahnschrift, "Segoe UI", sans-serif';
      c.fillStyle = '#2f3b33'; c.fillRect(0, 0, 512, 512);
      c.fillStyle = '#f4f1ea'; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (score) {
        c.font = `900 70px ${F}`; c.fillText('TORNEO', 256, 62); c.font = `700 38px ${F}`; c.fillStyle = '#ffd166'; c.fillText('del barrio · a ' + score.to, 256, 112);
        [[score.us, score.a, 210], [score.them, score.b, 360]].forEach(([nm, n, y]) => {
          c.fillStyle = '#f4f1ea'; c.textAlign = 'left'; c.font = `700 34px ${F}`; c.fillText(nm, 30, y - 36);
          c.textAlign = 'right'; c.font = `900 96px ${F}`; c.fillText(String(n), 482, y + 26);
          c.strokeStyle = 'rgba(244,241,234,0.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(30, y + 82); c.lineTo(482, y + 82); c.stroke();
        });
      } else {
        c.font = `900 72px ${F}`; c.fillText('REGLAS', 256, 62); c.font = `700 40px ${F}`; c.fillStyle = '#ffd166'; c.fillText('de la mesa', 256, 114);
        c.fillStyle = '#f4f1ea'; c.font = `700 37px ${F}`; c.textAlign = 'left';
        ['Capicúa ........ 25', 'Pase corrido .. 10', 'Tranque: con el', '   de la derecha', 'A 100 (o a 200)', 'Los mirones son', '   ¡de cera!'].forEach((s, i) => c.fillText(s, 30, 172 + i * 47));
      }
      c.strokeStyle = 'rgba(244,241,234,0.4)'; c.lineWidth = 4; c.strokeRect(14, 14, 484, 484);
    };
    const boardTex = TK.canvasTex(512, 512, c => chalk(c, null));
    boardTex.anisotropy = 4;
    { const Bd = SITE.BOARD, y = gy(Bd.x, Bd.z); k.push(Bd.x, y, Bd.z, Bd.yaw);
      [[-0.68, 0.1], [0.68, 0.1]].forEach(([a, b]) => k.beam([a, 0, b + 0.12], [a * 0.84, 1.65, b - 0.06], 0.05, '#8a5f3e'));     // (outside the board's edges: across it they hid the rules' first letters)
      k.beam([0, 0, -0.42], [0, 1.5, -0.05], 0.05, '#8a5f3e');
      k.box(0, 1.08, 0.02, 1.08, 1.08, 0.04, '#5b3a22', { rx: -0.12 });
      k.pop();
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.98), toonM({ map: boardTex, fade: 1 }));
      pl.position.set(Bd.x + Math.sin(Bd.yaw) * 0.045, y + 1.08, Bd.z + Math.cos(Bd.yaw) * 0.045); pl.rotation.set(-0.12, Bd.yaw, 0, 'YXZ'); inner.add(pl);
      colliders.push(solid({ x: Bd.x, z: Bd.z, r: 0.45 })); }
    { const Mo = SITE.MOTO, y = gy(Mo.x, Mo.z); k.push(Mo.x, y, Mo.z, Mo.yaw);
      [-0.55, 0.55].forEach(z => { k.cyl(0, 0.3, z, 0.28, 0.1, '#2b2235', { rz: Math.PI / 2, ink: 0.012 }); k.cyl(0, 0.3, z, 0.12, 0.12, '#b9c0c8', { rz: Math.PI / 2, ink: 0 }); });
      k.box(0, 0.55, 0.05, 0.3, 0.3, 0.9, '#d9493b'); k.box(0, 0.78, -0.12, 0.28, 0.1, 0.5, '#2b2235');
      k.beam([0, 0.6, 0.45], [0, 1.05, 0.62], 0.06, '#8a8f9e'); k.box(0, 1.06, 0.62, 0.6, 0.04, 0.05, '#2b2235');
      k.box(0, 1.0, -0.48, 0.5, 0.42, 0.42, '#ffd166'); k.box(0, 1.0, -0.69, 0.3, 0.12, 0.01, '#d9493b', { ink: 0 });     // the delivery box
      k.pop(); colliders.push(solid({ obox: 1, x: Mo.x, z: Mo.z, hw: 0.3, hd: 0.9, rot: Mo.yaw })); }
    // bunting from the awning's corners to the flamboyán
    { const flags = ['#d9493b', '#3d7fd1', '#ffd166', '#fffaf0', '#4f9a5a'];
      const corner = s => { const p = SITE.bw(s * (w / 2 + 0.05), fz + 1.3); return [p.x, fy + 2.45, p.z]; };
      [[corner(-1), [brs[0][0], brs[0][1] - 0.3, brs[0][2]]], [corner(1), [brs[1][0], brs[1][1] - 0.3, brs[1][2]]]].forEach(([a, b]) => {
        const n = 9;
        for (let i = 0; i <= n; i++) {
          const t0 = i / n, sag = Math.sin(t0 * Math.PI) * 0.5, p = [lerp(a[0], b[0], t0), lerp(a[1], b[1], t0) - sag, lerp(a[2], b[2], t0)];
          if (i < n) { const t1 = (i + 1) / n, q = [lerp(a[0], b[0], t1), lerp(a[1], b[1], t1) - Math.sin(t1 * Math.PI) * 0.5, lerp(a[2], b[2], t1)]; k.beam(p, q, 0.012, '#5b3a22', { ink: 0 }); }
          if (i > 0 && i < n) k.add(GEO.cone, flags[i % flags.length], p[0], p[1] - 0.13, p[2], 0.09, 0.22, 0.015, Math.PI, Math.atan2(b[0] - a[0], b[2] - a[2]) + Math.PI / 2, 0, 0);
        }
      }); }
    const statics = inked(k.P); statics.name = 'dm-statics'; inner.add(statics);
    const crownMesh = inked(crown.P, { shadow: true }); crownMesh.name = 'dm-crown'; inner.add(crownMesh);
    // the sign over the window (drawn at twice the old size: crisper, and the goods line bigger)
    const signTex = TK.canvasTex(1024, 192, (c) => {
      c.save(); c.scale(2, 2);
      c.fillStyle = '#fffaf0'; c.fillRect(0, 0, 512, 96);
      c.fillStyle = '#d9493b'; c.fillRect(0, 0, 512, 10); c.fillRect(0, 86, 512, 10);
      // a little flag in the corner: blue and red quarters, a white cross
      const fx = 14, fy0 = 22, fw = 60, fh = 42;
      c.fillStyle = '#1f4fa0'; c.fillRect(fx, fy0, fw / 2, fh / 2); c.fillRect(fx + fw / 2, fy0 + fh / 2, fw / 2, fh / 2);
      c.fillStyle = '#d9493b'; c.fillRect(fx + fw / 2, fy0, fw / 2, fh / 2); c.fillRect(fx, fy0 + fh / 2, fw / 2, fh / 2);
      c.fillStyle = '#ffffff'; c.fillRect(fx + fw / 2 - 4, fy0, 8, fh); c.fillRect(fx, fy0 + fh / 2 - 4, fw, 8);
      c.fillStyle = '#2b2235'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '900 40px Bahnschrift, "Segoe UI", sans-serif'; c.fillText('COLMADO DOÑA NENA', 292, 43);
      c.font = '800 24px Bahnschrift, "Segoe UI", sans-serif'; c.fillStyle = '#1f6f68'; c.fillText('Café · Pan · Hielo · ¡Dominó!', 292, 73);
      c.restore();
    });
    signTex.anisotropy = 4;
    { const p = SITE.bw(-0.7, fz + 0.035), sign = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 0.75), toonM({ map: signTex, fade: 1 }));
      sign.position.set(p.x, fy + 2.5, p.z); sign.rotation.y = B.rot; inner.add(sign); }
    // a mural on the side wall, painted by hand: a big domino and «¡Aquí se juega dominó!»
    const muralTex = TK.canvasTex(256, 160, (c) => {
      c.fillStyle = '#3fb8af'; c.fillRect(0, 0, 256, 160);
      c.save(); c.translate(64, 82); c.rotate(-0.18);
      c.fillStyle = '#fffaf0'; c.strokeStyle = '#2b2235'; c.lineWidth = 5; c.beginPath(); c.roundRect ? c.roundRect(-30, -58, 60, 116, 12) : c.rect(-30, -58, 60, 116); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-22, 0); c.lineTo(22, 0); c.stroke();
      c.fillStyle = '#d9493b'; [[-12, -40], [-12, -28], [-12, -16], [12, -40], [12, -28], [12, -16]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 5.5, 0, TAU); c.fill(); });
      c.fillStyle = '#1f4fa0'; [[-12, 16], [12, 16], [0, 29], [-12, 42], [12, 42]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 5.5, 0, TAU); c.fill(); });
      c.restore();
      c.fillStyle = '#fffaf0'; c.strokeStyle = '#2b2235'; c.lineWidth = 5; c.textAlign = 'center'; c.font = '900 25px Bahnschrift, "Segoe UI", sans-serif';
      [['¡Aquí se', 52], ['juega', 84], ['dominó!', 116]].forEach(([s, y]) => { c.strokeText(s, 178, y); c.fillText(s, 178, y); });
    });
    { const p = SITE.bw(-w / 2 - 0.025, -0.1), mural = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 1.75), toonM({ map: muralTex, fade: 1 }));
      mural.position.set(p.x, fy + 1.55, p.z); mural.rotation.y = B.rot - Math.PI / 2; inner.add(mural); }
    // chapter 5: the tournament's banner on the roof's edge (up from the day of the tournament on), and the cup in the window
    const bannerTex = TK.canvasTex(1024, 176, (c) => {
      c.fillStyle = '#fffaf0'; c.fillRect(0, 0, 1024, 176);
      for (let i = 0; i < 16; i++) { c.fillStyle = ['#1f4fa0', '#d9493b'][i % 2]; c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64 + 64, 0); c.lineTo(i * 64 + 32, 26); c.closePath(); c.fill(); }
      c.fillStyle = '#2b2235'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = '900 64px Bahnschrift, "Segoe UI", sans-serif'; c.fillText('¡GRAN TORNEO DE DOMINÓ!', 512, 84);
      c.font = '800 34px Bahnschrift, "Segoe UI", sans-serif'; c.fillStyle = '#d9493b'; c.fillText('del barrio · bajo el flamboyán', 512, 140);
    });
    bannerTex.anisotropy = 4;
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.72), toonM({ map: bannerTex, fade: 1 }));
    { const p = SITE.bw(0, fz + 0.14); banner.position.set(p.x, fy + h + 0.62, p.z); banner.rotation.y = B.rot; banner.visible = false; inner.add(banner); }
    const cupK = Kit(); { const p = SITE.bw(0.35, fz + 0.3); cupK.push(p.x, fy + 0.98, p.z, B.rot);
      cupK.box(0, 0.03, 0, 0.16, 0.06, 0.16, '#8a5f3e'); cupK.cyl(0, 0.11, 0, 0.025, 0.12, '#e0a020'); cupK.cyl(0, 0.25, 0, 0.09, 0.17, '#ffd65a', { rz2: 0.09 });
      [-1, 1].forEach(s => cupK.add(GEO.tor, '#ffd65a', s * 0.1, 0.27, 0, 0.05, 0.05, 0.05, 0, Math.PI / 2, 0, 0.006)); cupK.pop(); }
    const cup = inked(cupK.P, { shadow: false }); cup.name = 'dm-cup'; cup.visible = false; inner.add(cup);
    // ---------------- the yard: packed earth and fallen flamboyán petals under the table; Chago's gray stain
    const yardTex = TK.canvasTex(256, 256, (c) => {
      const g = c.createRadialGradient(128, 128, 10, 128, 128, 126); g.addColorStop(0, 'rgba(176,136,92,0.95)'); g.addColorStop(0.72, 'rgba(176,136,92,0.85)'); g.addColorStop(1, 'rgba(176,136,92,0)');
      c.fillStyle = g; c.fillRect(0, 0, 256, 256);
      const R2 = rng(77);
      for (let i = 0; i < 260; i++) { const a = R2() * TAU, r = Math.sqrt(R2()) * 110; c.fillStyle = `rgba(${120 + R2() * 40},${92 + R2() * 30},${60 + R2() * 20},0.35)`; c.fillRect(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 2 + R2() * 3, 2 + R2() * 2); }
      for (let i = 0; i < 70; i++) { const a = R2() * TAU, r = Math.sqrt(R2()) * 112; c.fillStyle = ['#e8452c', '#f26b38', '#d93a2b'][i % 3]; c.beginPath(); c.ellipse(128 + Math.cos(a) * r, 128 + Math.sin(a) * r, 3.2, 1.8, R2() * 3, 0, TAU); c.fill(); }
    });
    const decal = (cx, cz, rad, tex, segs = 18, rings = 6) => {
      const pos = [], uv = [], idx = [];
      for (let r = 0; r <= rings; r++) for (let s = 0; s <= segs; s++) {
        const a = (s / segs) * TAU, rr = (r / rings) * rad, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
        pos.push(x, gy(x, z) + 0.035, z); uv.push(0.5 + Math.cos(a) * rr / rad / 2, 0.5 + Math.sin(a) * rr / rad / 2);
      }
      for (let r = 0; r < rings; r++) for (let s = 0; s < segs; s++) { const a = r * (segs + 1) + s, b = a + segs + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m = new THREE.Mesh(g, toonM({ map: tex, transparent: true, poly: 2 })); m.receiveShadow = true; m.renderOrder = 1;
      return m;
    };
    inner.add(decal(T.x - 0.6, T.z - 0.2, 3.3, yardTex));
    const grayTex = TK.canvasTex(128, 128, c => { const g = c.createRadialGradient(64, 64, 6, 64, 64, 62); g.addColorStop(0, 'rgba(158,156,168,0.85)'); g.addColorStop(0.45, 'rgba(158,156,168,0.6)'); g.addColorStop(1, 'rgba(158,156,168,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 128); });
    const stain = decal(SITE.BENCH.x, SITE.BENCH.z, 3.4, grayTex, 16, 4); stain.renderOrder = 2; inner.add(stain);
    // ---------------- the dominoes on the table (one mesh, redrawn when a tile is played)
    const tilesMesh = new THREE.Mesh(new THREE.BufferGeometry(), toonM({ map: ATLAS, rim: 0.1 }));
    tilesMesh.castShadow = true; tilesMesh.receiveShadow = true; tilesMesh.name = 'dm-tiles'; tilesMesh.visible = false; inner.add(tilesMesh);     // (hidden while it's empty: an empty geometry in view crashed the first frame)
    // ---------------- the radio's music: little notes floating up
    const noteTex = TK.canvasTex(64, 64, c => { c.font = '900 50px "Segoe UI Symbol", sans-serif'; c.textAlign = 'center'; c.fillStyle = '#2b2235'; c.fillText('♪', 32, 50); });
    const notes = [0, 1, 2].map(i => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex, transparent: true, opacity: 0, depthWrite: false })); s.scale.setScalar(0.32); inner.add(s); return { s, t: i * 1.1 }; });
    const radioAt = (() => { const p = SITE.bw(-1.5, fz + 0.3); return V3(p.x, fy + 1.3, p.z); })();
    // ---------------- the people
    const rig = Rig(), folk = new THREE.Object3D(); folk.name = 'dm-folk-nodes';
    const LOOKS = {
      fello: { skin: '#8a5a3c', hair: '#f4f1ea', hairdo: 'bald', stache: '#f4f1ea', glasses: true, dress: '#f6efd9', pleats: '#e3d6b2', legs: true, pants: '#3a4466', shoes: '#5b3a22', hat: 'fedora', hatColor: '#efe3bf', band: '#4a3a33', h: 1.0, w: 1.12 },
      nena: { skin: '#a8714a', hair: '#2e2420', dress: '#f2b13c', apron: '#fdf8ee', shoes: '#c9553f', hat: 'scarf', hatColor: '#e86a9a', rolos: ['#7fd1e8', '#ffd166', '#9cc45a'], h: 0.95, w: 1.12 },
      yunior: { skin: '#c98e62', hair: '#2e2420', dress: '#3d7fd1', number: '#fffaf0', legs: true, pants: '#2f3b5a', shoes: '#f4f1ea', hat: 'capBack', hatColor: '#d6453a', h: 1.02, w: 0.95 },
      chago: { skin: '#7a4f35', hair: '#e9e6df', hairdo: 'bald', beard: '#e9e6df', glasses: true, dress: '#c9553f', legs: true, pants: '#5b4a3a', shoes: '#3a2b26', hat: 'beret', hatColor: '#3a3040', h: 0.98, w: 1.0 },
      // chapter 4's neighbors
      maritza: { skin: '#b07a52', hair: '#2e2420', hairdo: 'bun', dress: '#f2b13c', shoes: '#e86a9a', h: 0.7, w: 0.92 },
      carmen: { skin: '#6f4630', hair: '#d9d4cc', hairdo: 'bun', glasses: true, dress: '#7fb3d9', apron: '#f4f1ea', shoes: '#3a2b26', h: 0.92, w: 1.12 },
      tono: { skin: '#9a6440', hair: '#1e1a1a', stache: '#1e1a1a', dress: '#4f9a5a', legs: true, pants: '#5b4a3a', shoes: '#3a2b26', hat: 'capBack', hatColor: '#f2a03a', h: 1.04, w: 1.08 },
      // chapter 5: the Hush's pair, gray from hat to shoes
      nadie: { skin: '#9a98a6', hair: '#6d6a78', hairdo: 'bald', dress: '#5d5966', legs: true, pants: '#3f3c46', shoes: '#2f2c36', hat: 'fedora', hatColor: '#4a4652', band: '#2f2c36', h: 1.06, w: 1.0 },
      nada: { skin: '#a3a1ae', hair: '#5d5a68', hairdo: 'bun', dress: '#6a6673', shoes: '#2f2c36', hat: 'scarf', hatColor: '#55525e', h: 1.0, w: 1.05 },
    };
    const NAMES = { fello: 'Don Fello', nena: 'Doña Nena', yunior: 'Yunior', chago: 'Don Chago', maritza: 'Maritza', carmen: 'Doña Carmen', tono: 'Toño', nadie: 'Don Nadie', nada: 'Doña Nada' };
    const people = {};
    for (const id of ['fello', 'nena', 'yunior', 'chago', 'maritza', 'carmen', 'tono', 'nadie', 'nada']) {
      const extra = EXTRA.includes(id), callado = id === 'nadie' || id === 'nada';
      const api = { id: 'dm.' + id, key: id, name: NAMES[id], x: 0, z: 0, y: 0, top: 1.05, r: id === 'maritza' ? 0.34 : 0.42, talking: false, hushed: id === 'chago' || callado, domino: true, kid: id === 'maritza', hidden: extra };
      const S = { x: 0, z: 0, yaw: 0, gy: 0, sit: !extra, seat: 0.48, talk: 0, look: 0, slam: -1, sip: 0, walk: 0, gray: id === 'chago' || callado ? 1 : 0, grayShown: -1, phase: Math.random() * 6, mood: 0,
        h: LOOKS[id].h || 1, away: extra, callado, at: extra ? 'away' : null };
      rig.who = S; S.R = makePerson(rig, LOOKS[id]); folk.add(S.R.root);
      if (callado) S.R.blush.forEach(b => b.scale.setScalar(0.0001));
      people[id] = { api, S, id };
    }
    const meshes = rig.meshes(inner);
    // where everyone is: Fello, Nena and Yunior at the table; Chago on his bench until he's back
    function seatAt(P, key) { const sp = SEATS[key], c = chairs[key]; P.S.x = sp.x; P.S.z = sp.z; P.S.yaw = sp.yaw; P.S.gy = c.y; P.S.sit = true; P.S.seat = 0.48; P.S.at = key; P.S.away = false; }
    function benchAt(P) { const Bn = SITE.BENCH; P.S.x = Bn.x + Math.sin(Bn.yaw) * 0.08; P.S.z = Bn.z + Math.cos(Bn.yaw) * 0.08; P.S.yaw = Bn.yaw; P.S.gy = gy(Bn.x, Bn.z); P.S.sit = true; P.S.seat = 0.47; P.S.at = 'bench'; P.S.away = false; }
    // standing somewhere (a spot { x, z } and a point to face, or a yaw)
    function standAt(P, sp, face, tag) { P.S.x = sp.x; P.S.z = sp.z; P.S.yaw = face === undefined ? P.S.yaw : typeof face === 'number' ? face : Math.atan2(face.x - sp.x, face.z - sp.z); P.S.gy = gy(sp.x, sp.z); P.S.sit = false; P.S.at = tag || 'stand'; P.S.away = false; P.S.walkTo = null; }
    function awayAt(P) { P.S.away = true; P.S.at = 'away'; P.S.walkTo = null; P.S.party = false; }
    seatAt(people.fello, 'N'); seatAt(people.nena, 'E'); seatAt(people.yunior, 'W'); benchAt(people.chago);
    built = { root, inner, people, meshes, folk, tilesMesh, chairs, ty, fy, notes, radioAt, stain, colliders, statics, crownMesh, seatAt, benchAt, standAt, awayAt, gy, amb: null, ambT: 2, playing: null,
      banner, cup, boardTex, chalk: score => { const cv = boardTex.image, c = cv && cv.getContext && cv.getContext('2d'); if (!c) return; chalk(c, score); boardTex.needsUpdate = true; } };
    function stats() {
      let tris = 0, calls = 0;
      inner.traverse(o => { if (o.isMesh && o.visible !== false) { const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0) / 3; tris += n * (o.isInstancedMesh ? o.count : 1); calls++; } });
      return { tris: Math.round(tris), calls, solids: colliders.length };
    }
    return { colliders, group: root, people: Object.values(people).map(p => p.api), update: (dt, t, you) => update(dt, t, you), stats };
  }

  // ---------------------------------------------------------------- per frame (main calls it while the place is near)
  const SEAT_OF = { S: 0, E: 1, N: 2, W: 3 }, KEY_OF = ['S', 'E', 'N', 'W'];
  let syncedShown = null, hushPushed = false, approachDone = false;
  function syncShown() {
    const on = shown();
    if (on === syncedShown) return on;
    syncedShown = on;
    for (const c of built.colliders) { c.x = c.x0 + (on ? 0 : 1e5); c.z = c.z0; }       // (live solids: away outside Spanish games)
    return on;
  }
  // everyone where they belong now (only moves people who aren't there yet, and never someone walking)
  function placeDefault(dm) {
    const P = built.people, b = built;
    [['fello', 'N'], ['nena', 'E'], ['yunior', 'W']].forEach(([id, k]) => { const p = P[id]; if (p.S.at !== k && !p.S.walkTo) { b.seatAt(p, k); p.S.party = false; } });
    const ch = P.chago;
    if (!ch.S.walkTo) { if (dm.healed && ch.S.at !== 'S') b.seatAt(ch, 'S'); if (!dm.healed && ch.S.at !== 'bench') b.benchAt(ch); }
    for (const id of EXTRA) {
      const p = P[id]; if (p.S.walkTo) continue;
      const spot = dm.c4 && HANG[id];
      if (!spot) { if (p.S.at !== 'away') b.awayAt(p); continue; }
      if (p.S.at !== 'hang') { if (spot.bench) b.benchAt(p); else b.standAt(p, spot, spot.face); p.S.at = 'hang'; p.S.party = false; }
    }
  }
  // walk someone along a few points (game time); resolves when they're there
  function walkPath(p, pts, speed) {
    return new Promise(res => {
      const step = i => { if (i >= pts.length) { res(); return; } p.S.walkTo = { x: pts[i].x, z: pts[i].z, then: () => step(i + 1) }; p.S.walkSpeed = speed || (fastNow() ? 6 : 1.25); p.S.sit = false; p.S.away = false; p.S.at = 'walk'; };
      step(0);
    });
  }
  // the radio's bachata through zhfolk's deck (it ducks the area music). main only updates the table while you're near and
  // outdoors, so a watchdog lets the deck go when the updates stop
  let musLast = 0, musOn = false, musDog = null;
  function musicWant(lvl, t) {
    if (typeof ZHF === 'undefined' || !ZHF.music) return;
    ZHF.music.want('dm', lvl > 0.001 ? 'dm_bachata' : null, lvl, { duck: lvl > 0.01 ? Math.max(0.1, 1 - lvl * 2.4) : 1 });
    ZHF.music.frame(t); musLast = performance.now(); musOn = lvl > 0.001;
    if (!musDog) musDog = setInterval(() => { if (musOn && performance.now() - musLast > 600) { musOn = false; try { ZHF.music.want('dm', null, 0); } catch (e) { /* */ } } }, 300);
  }
  function update(dt, t, you) {
    if (!built) return;
    const on = syncShown(), P = built.people;
    for (const id in P) { const p = P[id], hide = !on || p.S.away; p.api.x = p.S.x + (hide ? 1e5 : 0); p.api.z = p.S.z; p.api.hidden = hide; }
    if (!on || !G) { if (hushPushed && G) { G.fx.hush = 0; hushPushed = false; } musicWant(0, t); return; }
    tickFar(dt);
    const dm = st(), Y = G.sim.you;
    U.uFocus.value.set(Y.x, Y.ry + 1.0, Y.z);
    // everyone at their places (Chago on his bench and gray until you help him, then at the table; the neighbors after
    // chapter 4), unless a scene has them
    const ch = P.chago;
    if (!SC.lock) placeDefault(dm);
    built.banner.visible = !!(dm.c5s || dm.c5); built.cup.visible = !!dm.c5;
    const grayWant = dm.healed ? 0 : dm.chagoBeat ? BEATS[Math.min(BEATS.length, dm.chagoBeat) - 1].gray : 1;      // (each word you give back brings some color back)
    ch.S.gray = ch.S.walkTo ? ch.S.gray : damp(ch.S.gray, grayWant, 1.5, dt);
    ch.api.hushed = ch.S.gray > 0.5;
    built.stain.visible = ch.S.gray > 0.05;
    if (built.stain.material) built.stain.material.opacity = ch.S.gray;
    for (const id in P) { const S = P[id].S; if (Math.abs(S.gray - S.grayShown) > 0.01) { S.grayShown = S.gray; built.meshes.recolor(S); } }
    // near the hushed man the color drains and the music slows (as near Alba's hushed)
    const dc = Math.hypot(Y.x - ch.S.x, Y.z - ch.S.z), hz = ch.S.gray * 0.72 * (1 - smoothstep(2.2, 8.5, dc));
    SC.hushNow = damp(SC.hushNow || 0, SC.hush || 0, 1.6, dt);
    const hzAll = Math.max(DOMINO_UI.open ? 0 : hz, SC.hushNow);
    if (hzAll > 0.01) { G.fx.hush = Math.max(G.fx.hush || 0, hzAll); hushPushed = true; }
    else if (hushPushed) { G.fx.hush = 0; hushPushed = false; }
    animatePeople(dt, t, you);
    if (!SC.noAmb) ambient(dt, t, you);
    // the radio's notes (none while the Hush has it), and its bachata once chapter 4 is done (louder as you come near)
    SC.notes = damp(SC.notes === undefined ? 1 : SC.notes, SC.radioOff ? 0 : 1, 3, dt);
    built.notes.forEach((n, i) => {
      n.t += dt; const k = (n.t % 3.3) / 3.3, s = n.s;
      s.position.set(built.radioAt.x + Math.sin(n.t * 2 + i) * 0.15, built.radioAt.y + k * 1.1, built.radioAt.z + Math.cos(n.t * 1.7 + i) * 0.1);
      s.material.opacity = Math.sin(k * Math.PI) * 0.85 * SC.notes; s.material.rotation = Math.sin(n.t * 3) * 0.3;
    });
    let lvl = SC.music || 0;
    if (!SC.lock && !SC.music && dm.c4 && !DOMINO_UI.open) lvl = 0.3 * (1 - smoothstep(3, 13, Math.hypot(Y.x - built.radioAt.x, Y.z - built.radioAt.z)));
    musicWant(lvl, t);
    // first time you come near: the slap of a domino on wood
    if (!dm.heard && you && !approachDone && Math.hypot(you.x - SITE.T.x, you.z - SITE.T.z) < 15 && !STORY.busy && !STORY.line && !G.state.teaching && !G.journalOpen) {
      approachDone = true; dm.heard = true;
      slamFx(P.fello, 1);
      STORY.think('That sound… someone’s slamming dominoes on a table!', 4.5);
    }
    // standing by the empty chair (before Chago's back): a passing thought, once
    if (!dm.healed && !dm.chairSeen && you && !STORY.busy && !STORY.line && !G.state.teaching && Math.hypot(you.x - built.chairs.S.x, you.z - built.chairs.S.z) < 1.5) {
      dm.chairSeen = true; STORY.think('An empty {w.chair}… a little cup of {w.coffee} in front of it, gone cold.', 4.5);
    }
    built.folk.updateMatrixWorld(true);
    built.meshes.sync();
  }
  // everyone sits (Chago may walk to the table), turns to you when you come close, talks, sips coffee; Don Fello slams
  function animatePeople(dt, t, you) {
    const P = built.people, gy = built.gy;
    for (const id in P) {
      const { S, api } = P[id], R = S.R;
      if (S.walkTo) {       // walking (Chago back to the table; the neighbors and the gray pair in the new chapters)
        const dx = S.walkTo.x - S.x, dz = S.walkTo.z - S.z, dd = Math.hypot(dx, dz), v = (S.walkSpeed || 1.1) * dt;
        if (dd < 0.06) { const W = S.walkTo; S.walkTo = null; if (W.then) W.then(); else built.seatAt(P[id], 'S'); }
        else { S.x += dx / dd * Math.min(v, dd); S.z += dz / dd * Math.min(v, dd); S.yaw = dampAngle(S.yaw, Math.atan2(dx, dz), 8, dt); S.gy = gy(S.x, S.z); S.sit = false; S.phase += dt * 7; }
      }
      if (S.faceTo && !S.walkTo) S.yaw = dampAngle(S.yaw, Math.atan2(S.faceTo.x - S.x, S.faceTo.z - S.z), 6, dt);
      const legsSeat = S.sit && R.legs ? 0.3 : 0;
      R.root.position.set(S.x, S.gy + (S.sit ? S.seat - legsSeat - 0.02 : 0) + (S.hopT > 0 ? Math.abs(Math.sin(S.hopT * 9)) * 0.12 : 0), S.z); R.root.rotation.y = S.yaw;
      R.root.scale.setScalar(S.away ? 1e-4 : S.h || 1);
      if (S.hopT > 0) S.hopT -= dt;
      api.y = S.gy + (S.sit ? S.seat - 0.5 : 0); api.top = (S.sit ? 1.05 : 1.5) * (R.root.scale.y || 1);
      const dY = you ? Math.hypot(you.x - S.x, you.z - S.z) : 99, hush = S.gray > 0.5 && !S.callado;
      S.talk = damp(S.talk, api.talking ? 1 : 0, 10, dt);
      const walking = !!S.walkTo;
      R.body.scale.set(1, (S.sit ? 0.82 : 1) * (hush ? 1 : 1 + Math.sin(t * 2.2 + S.phase) * 0.014), 1);
      R.body.position.y = (hush ? 0 : S.talk * Math.abs(Math.sin(t * 13)) * 0.03) + (walking ? Math.abs(Math.sin(S.phase)) * 0.05 : 0) + (S.party ? Math.abs(Math.sin(t * 7 + S.phase)) * 0.06 : 0);
      R.body.rotation.x = hush ? 0.3 : (S.sit ? 0.06 : 0);
      R.body.rotation.z = hush ? 0 : Math.sin(t * 1.2 + S.phase) * 0.02 + (S.party ? Math.sin(t * 7 + S.phase) * 0.08 : 0);
      if (R.legs) R.legs.forEach((hip, i) => { hip.rotation.x = S.sit ? -1.25 + (id === 'yunior' && i === 0 && !hush ? Math.abs(Math.sin(t * 9)) * 0.12 : 0) : walking ? Math.sin(S.phase + i * Math.PI) * 0.6 : S.party ? Math.sin(t * 7 + S.phase + i * Math.PI) * 0.25 : 0; });
      else R.feet.forEach((f, i) => { const s = i ? 1 : -1; if (S.sit) f.position.set(s * 0.13, -0.56, 0.36); else f.position.set(s * 0.13, 0.04, 0.12); });
      // the arms: holding tiles over the table; Fello's slam; a sip of coffee; the hushed hang theirs
      let aL = [-1.1, 0, 0.32], aR = [-1.0, 0, -0.32];
      if (!S.sit) { const sw = walking ? Math.sin(S.phase) * 0.45 : 0; aL = [-0.18 - sw, 0, 0.14]; aR = [-0.18 + sw, 0, -0.14]; }
      if (S.wave > 0) { S.wave -= dt; aR = [-2.7 + Math.sin(t * 12) * 0.25, 0, -0.35]; }
      if (hush) { aL = [-0.25, 0, 0.12]; aR = [-0.25, 0, -0.12]; }
      else if (S.slam >= 0) {
        S.slam += dt; const k = S.slam;
        if (k < 0.35) aR = [lerp(-1.0, -2.55, easeInOut(k / 0.35)), 0, -0.3];
        else if (k < 0.47) aR = [lerp(-2.55, -0.85, (k - 0.35) / 0.12), 0, -0.2];
        else if (k < 0.9) aR = [-0.85, 0, -0.2];
        else S.slam = -1;
        if (k >= 0.45 && !S.slammed) { S.slammed = true; if (S.onSlam) { const f = S.onSlam; S.onSlam = null; f(); } }
      } else if (S.sip > 0) { S.sip -= dt; aR = [-2.1 + Math.sin(S.sip * 3) * 0.1, 0, -0.55]; }
      else if (S.place > 0) { S.place -= dt; aR = [-0.75, 0, -0.1]; }
      if (S.party) { aL = [-2.6 + Math.sin(t * 7 + S.phase) * 0.3, 0, 0.5]; aR = [-2.6 - Math.sin(t * 7 + S.phase) * 0.3, 0, -0.5]; }
      R.arms[0].rotation.set(...aL); R.arms[1].rotation.set(...aR);
      { const noTile = hush || S.party || !S.sit || EXTRA.includes(id) && !S.callado; if (R.tileHand) R.tileHand.scale.set(noTile ? 0.001 : 0.05, noTile ? 0.001 : 0.1, noTile ? 0.001 : 0.022); }
      // the head: turns to you when you're close (or talking to you); the hushed stare at the ground
      let hy = 0, hx = 0;
      if (hush) { hy = -0.35; hx = 0.35; }
      else if (you && (dY < 5.5 || api.talking)) { const yawTo = Math.atan2(you.x - S.x, you.z - S.z); hy = clamp(angDiff(S.yaw, yawTo), -1.3, 1.3); hx = -0.05; }
      else hy = Math.sin(t * 0.37 + S.phase * 3) * 0.35;
      S.look = damp(S.look, hy, 6, dt);
      R.head.rotation.set(hx, S.look, 0);
      R.mouth.scale.set(0.035, S.talk > 0.3 ? 0.012 + Math.abs(Math.sin(t * 16)) * 0.035 : 0.012, 0.01);
      const blink = ((t + S.phase) % 4.1) < 0.12;
      R.eyes.forEach(e => { e.scale.y = S.callado ? 0.2 : blink || hush ? 0.35 : 1; });
      R.hls.forEach(h => h.scale.setScalar(hush || S.callado ? 0.001 : 0.017));
    }
  }
  function slamFx(P, vol) {
    if (!G) return;
    const Y = G.sim.you, d = Math.hypot(Y.x - P.S.x, Y.z - P.S.z);
    if (d < 18 && !DOMINO_UI.open) { Sound.play('land', clamp(15 - d, 3, 13) * vol); if (d < 9) Sound.play('crack'); }
    G.w3d.fx.puff(SITE.T.x, built.ty + 0.05, SITE.T.z - 0.2, 3, 0.08);
  }
  // A game goes on at the table while you're around: a real hand, played by whoever is sitting there (Chago's seat stays
  // out until he's back). Don Fello slams his tiles; after the hand, a pause, and somebody gives the tiles water.
  function ambient(dt, t, you) {
    const B = built, P = B.people, dm = st();
    if (DOMINO_UI.open) return;
    const seatedKeys = ['S', 'E', 'N', 'W'].filter(k => Object.values(P).some(p => p.S.at === k && !p.S.away && !p.S.walkTo));
    void dm;
    if (!B.amb || B.amb.done) {
      B.ambT -= dt;
      if (B.ambT > 0 || seatedKeys.length < 2) return;
      const rnd = Math.random, H = newHand(deal(rnd), 2, false);
      B.amb = { H, seats: seatedKeys.map(k => SEAT_OF[k]), next: 1.5, done: false };
      drawTable(); return;
    }
    const A = B.amb, H = A.H;
    A.next -= dt;
    if (A.next > 0) return;
    // the next seated player plays (skipping the empty seat); nobody can: the hand's over
    let tries = 0;
    while (tries++ < 4 && !A.seats.includes(H.turn)) H.turn = nextSeat(H.turn);
    const s = H.turn, mv = legal(H, s, false);
    const who = Object.values(P).find(p => p.S.at === KEY_OF[s]);
    if (!mv.length) {
      H.passes++; H.turn = nextSeat(s);
      if (H.passes >= A.seats.length) { A.done = true; B.ambT = 5; }
      A.next = 1.2;
      return;
    }
    const m = policyMove(who && who.id === 'fello' ? 'mimo' : 'nena', H, s, mv, Math.random, null);     // (the background game: plain table sense, no counting, so it costs nothing)
    const doIt = () => { if (A.H !== H || H.over || H.turn !== s) return; play(H, s, m); drawTable(); if (H.over) { A.done = true; B.ambT = 6; } };
    if (who && who.id === 'fello') { who.S.slam = 0; who.S.slammed = false; who.S.onSlam = () => { doIt(); slamFx(who, 1); }; }
    else { if (who) who.S.place = 0.5; doIt(); if (who && you && Math.hypot(you.x - SITE.T.x, you.z - SITE.T.z) < 6) Sound.play('click'); }
    A.next = 2.6 + Math.random() * 2.4;
    if (who && who.id !== 'fello' && Math.random() < 0.15) who.S.sip = 1.4;
  }
  // the 3D table: the line in the middle, and each seated player's tiles standing in front of them
  function drawTable() {
    const B = built, A = B.amb, list = [];
    if (A) {
      const lay = snake(A.H, 15);
      for (const tl of lay.tiles) list.push({ x: SITE.T.x + tl.x * U3, y: B.ty + 0.036, z: SITE.T.z + tl.y * U3, ry: -tl.rot * Math.PI / 180, top: tl.top, bot: tl.bot });
      for (const key of ['S', 'E', 'N', 'W']) {
        const s = SEAT_OF[key], sp = SITE.SEATS[key], n = A.seats.includes(s) ? A.H.hands[s].length : 0;
        const fx = Math.sin(sp.yaw), fz = Math.cos(sp.yaw), rx = Math.cos(sp.yaw), rz = -Math.sin(sp.yaw);
        for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * U3 * 1.08; list.push({ x: sp.x + fx * 0.62 + rx * o, y: B.ty + 0.036, z: sp.z + fz * 0.62 + rz * o, ry: sp.yaw + Math.PI, stand: true }); }
      }
    }
    B.tilesMesh.geometry.dispose();
    B.tilesMesh.geometry = list.length ? tilesGeo(list) : new THREE.BufferGeometry();
    B.tilesMesh.visible = list.length > 0;
  }

  // ================================================================ the board and the lessons (an overlay in the game's paper look)
  const DOMINO_UI = { open: false, mode: null };
  const CSS = `
#dmn { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; font-family: "Trebuchet MS", "Segoe UI", system-ui, sans-serif; color: #2b2235; -webkit-font-smoothing: antialiased; }
#dmn.hidden, #dmn .hidden { display: none !important; }
#dmn * { box-sizing: border-box; }
#dmn .dm-shade { position: absolute; inset: 0; background: rgba(30,22,40,.42); }
#dmn .dm-panel { position: relative; width: min(1120px, calc(100vw - 16px)); height: min(700px, calc(100vh - 16px)); background: #fffaf0; border: 3px solid #2b2235; border-radius: 20px;
  box-shadow: 0 0 0 6px #fff, 0 12px 0 5px rgba(43,34,53,.22); overflow: hidden; }
#dmn .dm-board { display: grid; grid-template-rows: auto 1fr auto; }
#dmn button { font: inherit; font-weight: 800; font-size: 14px; color: #2b2235; background: #fffaf0; border: 2.5px solid #2b2235; border-radius: 12px; padding: 4px 11px; cursor: pointer; box-shadow: 0 3px 0 rgba(43,34,53,.18); }
#dmn button:hover { background: #fff3c4; }
#dmn button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(43,34,53,.18); }
#dmn button.go { background: #21a493; color: #fff; } #dmn button.go:hover { background: #26b8a5; }
#dmn button.warn { background: #c2412f; color: #fff; }
#dmn kbd { font: 800 11px "Segoe UI", sans-serif; border: 1.5px solid currentColor; border-radius: 5px; padding: 0 4px; margin-left: 3px; }
#dmn .dm-top { display: flex; align-items: center; gap: 12px; padding: 8px 14px; border-bottom: 2px dashed rgba(43,34,53,.2); }
#dmn .dm-title b { font: 800 21px Bahnschrift, "Segoe UI", sans-serif; display: block; line-height: 1.1; }
#dmn .dm-title span { font-size: 12px; font-weight: 700; opacity: .65; }
#dmn .dm-score { margin: 0 auto; display: flex; align-items: center; gap: 8px; }
#dmn .dm-pill { display: flex; flex-direction: column; align-items: center; min-width: 96px; padding: 1px 12px 3px; border: 2.5px solid #2b2235; border-radius: 14px; background: #fff; box-shadow: 0 3px 0 rgba(43,34,53,.15); }
#dmn .dm-pill small { font-size: 10px; font-weight: 800; letter-spacing: .07em; text-transform: uppercase; opacity: .6; }
#dmn .dm-pill b { font: 900 24px Bahnschrift, "Segoe UI", sans-serif; line-height: 1; }
#dmn .dm-us b { color: #13786b; } #dmn .dm-them b { color: #c2412f; }
#dmn .dm-to { font-size: 12px; font-weight: 800; opacity: .6; text-align: center; line-height: 1.1; }
#dmn .dm-btns { display: flex; gap: 6px; }
#dmn .dm-btns button { font-size: 12px; padding: 3px 8px; }
#dmn .dm-mid { position: relative; display: grid; grid-template-columns: 112px 1fr 112px; grid-template-rows: 62px 1fr; gap: 6px; padding: 6px 10px 4px; min-height: 0; }
#dmn .dm-seat { display: flex; align-items: center; gap: 8px; font-weight: 800; min-width: 0; }
#dmn .dm-seat.pn { grid-column: 2; grid-row: 1; justify-content: center; }
#dmn .dm-seat.pw { grid-column: 1; grid-row: 2; flex-direction: column; justify-content: center; }
#dmn .dm-seat.pe { grid-column: 3; grid-row: 2; flex-direction: column; justify-content: center; }
#dmn .dm-seat canvas { width: 50px; height: 50px; flex: 0 0 auto; border-radius: 50%; background: #fff; border: 2.5px solid #2b2235; transition: box-shadow .2s; }
#dmn .dm-seat.turn canvas { box-shadow: 0 0 0 4px #ffd166, 0 0 0 7px #2b2235; }
#dmn .dm-seat .nm { font-size: 14px; line-height: 1.1; text-align: center; } #dmn .dm-seat .nm small { display: block; font-size: 11px; opacity: .6; font-weight: 700; }
#dmn .dm-backs { display: flex; gap: 3px; } #dmn .dm-seat.pw .dm-backs, #dmn .dm-seat.pe .dm-backs { flex-direction: column; }
#dmn .dm-back { width: 12px; height: 22px; border-radius: 3px; background: #2f8f86; border: 2px solid #2b2235; }
#dmn .dm-seat.pw .dm-back, #dmn .dm-seat.pe .dm-back { width: 22px; height: 12px; }
#dmn .dm-table { grid-column: 2; grid-row: 2; position: relative; border-radius: 18px; background: #8a5a30; box-shadow: inset 0 0 0 3px #2b2235, 0 5px 0 rgba(43,34,53,.2); min-height: 0; }
#dmn .dm-table.slam { animation: dm-slam .25s; }
@keyframes dm-slam { 30% { transform: translateY(3px) scale(.995); } }
#dmn .dm-felt { position: absolute; inset: 10px; border-radius: 12px; overflow: hidden; box-shadow: inset 0 0 0 2px rgba(43,34,53,.45);
  background: repeating-linear-gradient(90deg, rgba(120,72,30,.07) 0 3px, transparent 3px 23px), linear-gradient(180deg, #ddae6e, #cf9a58); }
#dmn .dt { position: absolute; width: var(--u); height: calc(var(--u) * 2); padding: 0; border-radius: calc(var(--u) * .22); background: #fbf7ea; border: 2px solid #2b2235;
  box-shadow: 0 2px 0 rgba(43,34,53,.28); display: flex; flex-direction: column; overflow: hidden; }
#dmn .dt .h { position: relative; flex: 1 1 0; display: block; } #dmn .dt .h + .h { border-top: 1.5px solid rgba(43,34,53,.55); }
#dmn .dt .p { position: absolute; width: 22%; height: 22%; border-radius: 50%; background: #2b2235; transform: translate(-50%, -50%); }
#dmn .dt.last { box-shadow: 0 0 0 3px #e2574c, 0 2px 0 rgba(43,34,53,.28); }
#dmn .dt.drop { animation: dm-drop .35s cubic-bezier(.3,1.5,.5,1); }
@keyframes dm-drop { from { opacity: 0; transform: var(--rot) translateY(-26px) scale(1.5); } }
#dmn .dt.back { background: #2f8f86; }
#dmn .dm-ghost { position: absolute; width: var(--u); height: calc(var(--u) * 2); border: 2.5px dashed #2b2235; border-radius: calc(var(--u) * .22); background: rgba(255,250,240,.6);
  display: grid; place-items: center; font: 900 calc(var(--u) * .7) Bahnschrift, sans-serif; cursor: pointer; animation: dm-pulse .9s ease-in-out infinite; }
#dmn .dm-ghost.on { background: #fff3c4; border-style: solid; }
#dmn .dm-ghost span { transform: rotate(calc(-1 * var(--deg))); display: block; text-align: center; line-height: 1; }
#dmn .dm-ghost small { display: block; font-size: 60%; }
@keyframes dm-pulse { 50% { opacity: .65; } }
#dmn .dm-swirl { position: absolute; width: 22px; height: 40px; border-radius: 5px; background: #2f8f86; border: 2px solid #2b2235; animation: dm-swirl 1.1s ease-in-out infinite; }
@keyframes dm-swirl { 0% { transform: translate(0,0) rotate(0deg); } 33% { transform: translate(18px,-12px) rotate(70deg); } 66% { transform: translate(-14px,10px) rotate(160deg); } 100% { transform: translate(0,0) rotate(270deg); } }
#dmn .dm-say { position: absolute; z-index: 4; max-width: 250px; background: #fff; border: 2.5px solid #2b2235; border-radius: 14px; padding: 4px 11px 5px; font-weight: 800; font-size: 17px; line-height: 1.2;
  box-shadow: 0 3px 0 rgba(43,34,53,.18); pointer-events: none; opacity: 0; transition: opacity .15s; }
#dmn .dm-say.on { opacity: 1; }
#dmn .dm-say i { display: block; font-size: 12px; font-weight: 600; opacity: .7; }
#dmn .dm-say.pn { left: calc(50% + 60px); top: 4px; } #dmn .dm-say.pe { right: 118px; top: 32%; } #dmn .dm-say.pw { left: 118px; top: 32%; } #dmn .dm-say.ps { left: 50%; transform: translateX(-50%); bottom: 6px; }
#dmn .dm-say.you { background: #fffaf0; color: #13786b; }
#dmn .dm-track { position: absolute; right: 120px; top: 70px; z-index: 3; background: rgba(255,250,240,.96); border: 2.5px solid #2b2235; border-radius: 12px; padding: 6px 9px; font-size: 12px; font-weight: 700; }
#dmn .dm-track > b { display: block; font-size: 12px; margin-bottom: 3px; }
#dmn .dm-track .tr { display: flex; align-items: center; gap: 6px; margin: 2px 0; }
#dmn .dm-track .mini { position: relative; width: 16px; height: 16px; border: 1.5px solid #2b2235; border-radius: 3px; background: #fbf7ea; }
#dmn .dm-track .mini .h { position: absolute; inset: 0; } #dmn .dm-track .mini .p { position: absolute; width: 24%; height: 24%; border-radius: 50%; background: #2b2235; transform: translate(-50%,-50%); }
#dmn .dm-track .bar { display: block; width: 70px; height: 8px; border-radius: 99px; background: rgba(43,34,53,.12); overflow: hidden; } #dmn .dm-track .bar b { display: block; height: 100%; background: #c2412f; }
#dmn .dm-track small { display: block; opacity: .6; font-weight: 600; margin-top: 3px; }
#dmn .dm-bottom { position: relative; display: grid; grid-template-columns: 150px 1fr 290px; align-items: center; gap: 10px; padding: 8px 12px 12px; border-top: 2px dashed rgba(43,34,53,.2); }
#dmn .dm-seat.ps { flex-direction: row; }
#dmn .dm-hand { display: flex; gap: 9px; justify-content: center; align-items: flex-end; min-height: 96px; padding-bottom: 14px; }
#dmn .dm-hand .dt { position: relative; cursor: pointer; transition: transform .12s, box-shadow .12s; }
#dmn .dm-hand .dt.ok { box-shadow: 0 0 0 3px #21a493, 0 3px 0 rgba(43,34,53,.25); }
#dmn .dm-hand .dt.no { opacity: .5; cursor: default; }
#dmn .dm-hand .dt.sel { transform: translateY(-10px); box-shadow: 0 0 0 4px #ffd166, 0 0 0 6px #2b2235, 0 8px 0 rgba(43,34,53,.2); }
#dmn .dm-hand .dt.hint::after { content: "♪"; position: absolute; top: -22px; left: 50%; transform: translateX(-50%); font: 900 16px "Segoe UI Symbol", sans-serif; color: #13786b; }
#dmn .dm-hand .dt small { position: absolute; bottom: -17px; left: 50%; transform: translateX(-50%); font: 800 11px "Segoe UI", sans-serif; opacity: .55; }
#dmn .dm-act { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
#dmn .dm-status { font-size: 14px; font-weight: 700; line-height: 1.32; min-height: 38px; }
#dmn .dm-status b { color: #c2412f; } #dmn .dm-status .k { opacity: .6; font-size: 12px; display: block; }
#dmn .dm-call { display: flex; flex-direction: column; gap: 5px; background: #fff; border: 2.5px solid #2b2235; border-radius: 14px; padding: 7px 9px; box-shadow: 0 0 0 4px #ffd166; }
#dmn .dm-call label { font-size: 13px; font-weight: 800; }
#dmn .dm-call .row { display: flex; gap: 6px; }
#dmn .dm-call input { flex: 1; min-width: 0; font: 600 18px "Segoe UI", sans-serif; padding: 3px 8px; border: 2.5px solid #2b2235; border-radius: 10px; outline: none; }
#dmn .dm-call input:focus { box-shadow: 0 0 0 3px rgba(33,164,147,.35); }
#dmn .dm-call .bt { display: flex; gap: 6px; flex-wrap: wrap; }
#dmn .dm-call .hint { font-size: 12px; font-weight: 700; color: #c2412f; min-height: 0; }
#dmn .shake { animation: dm-shake .35s; }
@keyframes dm-shake { 20% { transform: translateX(-8px); } 45% { transform: translateX(7px); } 70% { transform: translateX(-4px); } }
#dmn .dm-tools { display: flex; gap: 6px; } #dmn .dm-tools button { font-size: 12px; padding: 2px 8px; }
#dmn .dm-card { position: absolute; inset: 0; z-index: 6; display: grid; place-items: center; background: rgba(255,250,240,.72); }
#dmn .dm-cardin { width: min(600px, calc(100% - 30px)); max-height: calc(100% - 30px); overflow: auto; background: #fffaf0; border: 3px solid #2b2235; border-radius: 20px; padding: 14px 22px 16px;
  box-shadow: 0 0 0 6px #fff, 0 12px 0 5px rgba(43,34,53,.18); text-align: center; }
#dmn .dm-cardin .tag { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .6; }
#dmn .dm-cardin .big { font: 900 40px Bahnschrift, "Segoe UI", sans-serif; color: #c2412f; line-height: 1.1; }
#dmn .dm-cardin .big.win { color: #13786b; }
#dmn .dm-cardin .why { font-size: 15px; font-weight: 700; margin: 4px 0 8px; }
#dmn .dm-cardin .en { font-size: 13px; font-style: italic; opacity: .7; }
#dmn .dm-cardin .hands { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 14px; margin: 8px 0; text-align: left; }
#dmn .dm-cardin .hh { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 800; min-height: 34px; }
#dmn .dm-cardin .hh .dt { position: relative; }
#dmn .dm-cardin .hh .n { margin-left: auto; font: 900 16px Bahnschrift, sans-serif; }
#dmn .dm-cardin .hh.us .n { color: #13786b; } #dmn .dm-cardin .hh.them .n { color: #c2412f; }
#dmn .dm-cardin .pts { font: 900 22px Bahnschrift, sans-serif; margin: 6px 0 2px; }
#dmn .dm-cardin .sc { font-size: 13px; font-weight: 700; opacity: .75; margin-bottom: 10px; }
#dmn .dm-cardin .row { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
#dmn .dm-cardin ul { text-align: left; font-size: 14px; line-height: 1.4; padding-left: 18px; margin: 6px 0 10px; }
#dmn .dm-cardin ul li { margin: 3px 0; } #dmn .dm-cardin q { quotes: "«" "»"; color: #c2412f; font-weight: 800; }
#dmn .dm-badge { display: inline-block; font: 900 15px Bahnschrift, sans-serif; color: #fff; background: #c2412f; border: 2.5px solid #2b2235; border-radius: 99px; padding: 1px 12px; transform: rotate(-3deg); margin: 4px; }
/* the lessons */
#dmn .dm-les { display: grid; grid-template-rows: auto auto; height: auto; max-height: min(700px, calc(100vh - 16px)); }
#dmn .dm-lhead { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-bottom: 2px dashed rgba(43,34,53,.2); }
#dmn .dm-lhead b { font: 800 21px Bahnschrift, "Segoe UI", sans-serif; } #dmn .dm-lhead .t { font-weight: 800; opacity: .7; }
#dmn .dm-lhead .dots { margin-left: auto; display: flex; gap: 4px; } #dmn .dm-lhead .dots i { width: 11px; height: 11px; border-radius: 50%; border: 2px solid #21a493; } #dmn .dm-lhead .dots i.f { background: #21a493; } #dmn .dm-lhead .dots i.now { box-shadow: 0 0 0 3px #ffd166; }
#dmn .dm-lbody { display: grid; grid-template-columns: 240px 1fr; gap: 18px; padding: 18px 24px; min-height: 0; overflow: auto; }
#dmn .dm-teacher { display: flex; flex-direction: column; align-items: center; gap: 10px; }
#dmn .dm-teacher canvas { width: 120px; height: 120px; border-radius: 50%; border: 3px solid #2b2235; background: #fff; }
#dmn .dm-teacher .nm { font: 800 15px Bahnschrift, sans-serif; }
#dmn .dm-lsay { position: relative; background: #fff; border: 2.5px solid #2b2235; border-radius: 16px; padding: 8px 12px; font-size: 15px; font-weight: 700; line-height: 1.35; box-shadow: 0 3px 0 rgba(43,34,53,.15); }
#dmn .dm-lsay::before { content: ""; position: absolute; left: 50%; top: -12px; margin-left: -9px; border: 9px solid transparent; border-top: 0; border-bottom: 12px solid #2b2235; }
#dmn .dm-lsay i { display: block; font-size: 12.5px; font-weight: 600; opacity: .7; margin-top: 3px; }
#dmn .dm-lsay .dm-enb { float: right; font: 800 11px "Segoe UI", sans-serif; color: #2b2235; background: #fffaf0; border: 2px solid #2b2235; border-radius: 8px; padding: 0 6px; margin: 0 0 2px 8px; cursor: pointer; }
#dmn .dm-lcard { background: #fff; border: 3px solid #2b2235; border-radius: 18px; padding: 14px 20px 16px; box-shadow: 0 5px 0 rgba(43,34,53,.15); display: flex; flex-direction: column; gap: 8px; align-self: start; }
#dmn .dm-lcard .kind { font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #13786b; }
#dmn .dm-lcard .ph { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
#dmn .dm-lcard .ph b { font: 900 42px Bahnschrift, "Segoe UI", sans-serif; color: #c2412f; line-height: 1.05; }
#dmn .dm-lcard .ph button { font-size: 14px; padding: 1px 8px; }
#dmn .dm-lcard .gl { font-size: 18px; font-weight: 800; }
#dmn .dm-lcard .note { font-size: 14px; opacity: .78; line-height: 1.4; }
#dmn .dm-lcard .ex { font: 16px/1.5 "Segoe Print", "Ink Free", cursive; background: #fbf6e7; border-radius: 10px; padding: 6px 12px; }
#dmn .dm-lcard .sit { font-size: 19px; font-weight: 800; line-height: 1.35; }
#dmn .dm-lcard form { display: flex; gap: 8px; }
#dmn .dm-lcard input { flex: 1; min-width: 0; font: 600 22px "Segoe UI", sans-serif; padding: 6px 10px; border: 2.5px solid #2b2235; border-radius: 12px; outline: none; }
#dmn .dm-lcard input:focus { box-shadow: 0 0 0 3px rgba(33,164,147,.35); }
#dmn .dm-lcard .hint { font: 800 18px Consolas, monospace; letter-spacing: .08em; color: #c2412f; min-height: 22px; }
#dmn .dm-lcard .hint.plain { font: 700 14px "Trebuchet MS", sans-serif; letter-spacing: 0; color: #2b2235; opacity: .7; }
#dmn .dm-lcard .row { display: flex; gap: 8px; align-items: center; font-size: 12px; font-weight: 700; } #dmn .dm-lcard .row span { opacity: .6; }
#dmn .dm-lcard.ok { box-shadow: 0 0 0 4px #21a493, 0 5px 0 rgba(43,34,53,.15); }
body.dm-open #objective, body.dm-open #counters, body.dm-open #help, body.dm-open #compass, body.dm-open #minimap, body.dm-open .bubble, body.dm-open #thought, body.dm-open .prompt { display: none !important; }
@media (max-width: 860px) { #dmn .dm-mid { grid-template-columns: 70px 1fr 70px; } #dmn .dm-bottom { grid-template-columns: 1fr; } #dmn .dm-seat.ps { display: none; } #dmn .dm-lbody { grid-template-columns: 1fr; } #dmn .dm-teacher { flex-direction: row; } #dmn .dm-say.pe { right: 74px; } #dmn .dm-say.pw { left: 74px; } #dmn .dm-track { right: 76px; } }
`;
  const PIPXY = { 0: [], 1: [[50, 50]], 2: [[27, 27], [73, 73]], 3: [[27, 27], [50, 50], [73, 73]], 4: [[27, 27], [73, 27], [27, 73], [73, 73]], 5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]], 6: [[27, 24], [27, 50], [27, 76], [73, 24], [73, 50], [73, 76]] };
  const halfHTML = n => `<i class="h">${PIPXY[n].map(([x, y]) => `<b class="p" style="left:${x}%;top:${y}%"></b>`).join('')}</i>`;
  const tileHTML = (top, bot, cls, style) => `<div class="dt ${cls || ''}" style="${style || ''}">${halfHTML(top)}${halfHTML(bot)}</div>`;
  const miniTile = id => tileHTML(TA[id], TB[id], '', '--u:14px');
  let ui = null;
  function ensureUI() {
    if (ui) return ui;
    if (!document.getElementById('dmn-css')) { const s = document.createElement('style'); s.id = 'dmn-css'; s.textContent = CSS; document.head.appendChild(s); }
    const root = document.createElement('div'); root.id = 'dmn'; root.className = 'hidden';
    root.innerHTML = `<div class="dm-shade"></div>
<div class="dm-panel dm-board">
  <div class="dm-top"><div class="dm-title"><b>La mesa de Don Fello</b><span class="dm-sub"></span></div>
    <div class="dm-score"><div class="dm-pill dm-us"><small>Nosotros</small><b>0</b></div><div class="dm-to">a<br><b>100</b></div><div class="dm-pill dm-them"><small>Ellos</small><b>0</b></div></div>
    <div class="dm-btns"><button type="button" data-k="track">Fichas <kbd>T</kbd></button><button type="button" data-k="rules">Reglas <kbd>R</kbd></button><button type="button" data-k="pause">Pausa <kbd>Esc</kbd></button></div></div>
  <div class="dm-mid">
    <div class="dm-seat pn"><canvas width="96" height="96"></canvas><div><div class="nm"></div><div class="dm-backs"></div></div></div>
    <div class="dm-seat pw"><canvas width="96" height="96"></canvas><div class="nm"></div><div class="dm-backs"></div></div>
    <div class="dm-table"><div class="dm-felt"></div></div>
    <div class="dm-seat pe"><canvas width="96" height="96"></canvas><div class="nm"></div><div class="dm-backs"></div></div>
    <div class="dm-say pn"></div><div class="dm-say pe"></div><div class="dm-say pw"></div>
    <div class="dm-track hidden"></div>
  </div>
  <div class="dm-bottom">
    <div class="dm-seat ps"><canvas width="96" height="96"></canvas><div class="nm"></div></div>
    <div class="dm-hand"></div>
    <div class="dm-act"><div class="dm-status"></div>
      <form class="dm-call hidden" autocomplete="off"><label></label><div class="row"><input spellcheck="false"><button type="submit" class="go">Say it</button></div><div class="bt"></div><div class="hint"></div></form>
      <div class="dm-tools"><button type="button" data-k="hint">Pista <kbd>H</kbd></button></div></div>
    <div class="dm-say ps you"></div>
  </div>
  <div class="dm-card hidden"><div class="dm-cardin"></div></div>
</div>
<div class="dm-panel dm-les hidden">
  <div class="dm-lhead"><b>La escuelita de Don Fello</b><span class="t"></span><span class="dots"></span><button type="button" class="stop">Stop <kbd>Esc</kbd></button></div>
  <div class="dm-lbody">
    <div class="dm-teacher"><canvas width="120" height="120"></canvas><div class="nm">Don Fello</div><div class="dm-lsay"></div></div>
    <div class="dm-lcard"><div class="kind"></div><div class="ph"><b></b><button type="button" class="say" title="Hear it">🔊</button></div><div class="gl"></div><div class="note"></div><div class="ex"></div><div class="sit"></div>
      <form autocomplete="off"><input spellcheck="false"><button type="submit" class="go">Say it</button></form>
      <div class="hint"></div><div class="row"><button type="button" class="idk">I don’t know (?)</button><span>Tab: a hint · Esc: stop the lesson</span></div></div>
  </div>
</div>`;
    document.body.appendChild(root);
    const q = s => root.querySelector(s);
    ui = { root, board: q('.dm-board'), les: q('.dm-les'), sub: q('.dm-sub'), us: q('.dm-us b'), them: q('.dm-them b'), to: q('.dm-to b'),
      seat: [q('.dm-seat.ps'), q('.dm-seat.pe'), q('.dm-seat.pn'), q('.dm-seat.pw')], say: [q('.dm-say.ps'), q('.dm-say.pe'), q('.dm-say.pn'), q('.dm-say.pw')],
      table: q('.dm-table'), felt: q('.dm-felt'), track: q('.dm-track'), hand: q('.dm-hand'), status: q('.dm-status'),
      call: q('.dm-call'), callLabel: q('.dm-call label'), callIn: q('.dm-call input'), callBt: q('.dm-call .bt'), callHint: q('.dm-call .hint'),
      card: q('.dm-card'), cardIn: q('.dm-cardin'),
      L: { t: q('.dm-lhead .t'), dots: q('.dm-lhead .dots'), stop: q('.dm-lhead .stop'), face: q('.dm-teacher canvas'), say: q('.dm-lsay'), card: q('.dm-lcard'), kind: q('.dm-lcard .kind'),
        ph: q('.dm-lcard .ph'), phB: q('.dm-lcard .ph b'), hear: q('.dm-lcard .say'), gl: q('.dm-lcard .gl'), note: q('.dm-lcard .note'), ex: q('.dm-lcard .ex'), sit: q('.dm-lcard .sit'),
        form: q('.dm-lcard form'), input: q('.dm-lcard input'), hint: q('.dm-lcard .hint'), idk: q('.dm-lcard .idk') } };
    root.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { const k = b.dataset.k; b.blur(); if (k === 'track') { B.track = !B.track; render(); } else if (k === 'rules') boardRules(); else if (k === 'pause') openPause(); else if (k === 'hint') showHint(); });
    ui.call.addEventListener('submit', e => { e.preventDefault(); callSubmit(ui.callIn.value, true); });
    ui.L.form.addEventListener('submit', e => { e.preventDefault(); if (LES.submit) LES.submit(ui.L.input.value); });
    ui.L.idk.onclick = () => { if (LES.idk) LES.idk(); };
    ui.L.stop.onclick = () => { if (LES.quit) LES.quit(); };
    ui.L.hear.onclick = () => { if (LES.say) Sound.say(LES.say, 'es'); ui.L.input.focus(); };
    return ui;
  }
  function openOverlay(mode) {
    ensureUI();
    DOMINO_UI.open = true; DOMINO_UI.mode = mode;
    ui.root.classList.remove('hidden');
    ui.board.classList.toggle('hidden', mode !== 'board'); ui.les.classList.toggle('hidden', mode !== 'lesson');
    document.body.classList.add('dm-open');
    if (G) { G.state.teaching = true; G.prompt = null; }
    Input.typing = true;
    addEventListener('keydown', onKey, true);
  }
  function closeOverlay() {
    if (!ui) return;
    ui.root.classList.add('hidden'); ui.card.classList.add('hidden');
    DOMINO_UI.open = false; DOMINO_UI.mode = null;
    document.body.classList.remove('dm-open');
    removeEventListener('keydown', onKey, true);
    Input.typing = false;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (G) { G.state.teaching = false; G.cam.override = null; }
  }
  // ---------------------------------------------------------------- the board's state
  const NAME = { you: 'Tú', fello: 'Don Fello', chago: 'Don Chago', nena: 'Doña Nena', yunior: 'Yunior', nadie: 'Don Nadie', nada: 'Doña Nada' };
  const FACE = { you: 'dmYou', mimo: 'dmMimo', fello: 'dmFello', chago: 'dmChago', nena: 'dmNena', yunior: 'dmYunior', nadie: 'dmNadie', nada: 'dmNada' };
  const KIND = { fello: 'fello', chago: 'chago', nena: 'nena', yunior: 'yunior', mimo: 'mimo', you: 'hint', nadie: 'hush', nada: 'hush' };
  const B = { M: null, H: null, seats: null, sel: 0, choosing: null, turn: null, call: null, card: null, paused: false, forfeit: false, fast: false, auto: false,
    hintId: -1, track: false, lastPlayed: -1, dropId: -1, shuffling: false, bub: [null, null, null, null], stats: null, log: [], gray: null, cfg: null };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  function banter(key, ev) { const b = BANTER[key] && BANTER[key][ev]; return b ? pick(b) : null; }
  function say(s, line, sec = 2.6) {
    if (!line || !ui) return;
    const el = ui.say[s], tok = {};
    B.bub[s] = tok;
    // (by the weave like every line, DESIGN.md 17.3: mixed, the English with the words you know in Spanish, whole in Spanish as
    // the weave rises; never the English under it)
    let html = esc(line[0]);
    try { if (line[0] && line[1] && typeof STORY !== 'undefined' && STORY.mixHTML) html = STORY.mixHTML(line[0], line[1], { key: 'dm:' + line[1] }).html; } catch (e) { /* (as written) */ }
    el.innerHTML = html;
    el.classList.add('on');
    wait(B.fast ? 0.01 : sec).then(() => { if (B.bub[s] === tok) { el.classList.remove('on'); B.bub[s] = null; } });
  }
  const sayKey = (s, ev, sec) => { const k = B.seats[s].key; if (k === 'mimo') { say(s, [ev === 'pass' ? '…' : pick(['!', '♪', '♪!']), ''], sec); Sound.play('chirp'); } else say(s, banter(k, ev), sec); };
  const oppSay = ev => { const s = Math.random() < 0.5 ? 1 : 3, k = B.seats[s].key; if (BANTER[k] && BANTER[k][ev]) sayKey(s, ev); else if (BANTER[B.seats[4 - s].key] && BANTER[B.seats[4 - s].key][ev]) sayKey(4 - s, ev); };
  function sortedHand() { return B.H ? B.H.hands[0].slice().sort((a, b) => (TB[b] - TB[a]) || (TA[b] - TA[a])) : []; }
  // ---------------------------------------------------------------- drawing
  function render() {
    if (!ui || !B.M) return;
    const M = B.M, H = B.H;
    ui.sub.textContent = B.seats ? `Tú y ${B.seats[2].name} contra ${B.seats[1].name} y ${B.seats[3].name}` + (B.gray !== null ? ` · el silencio ${'▮'.repeat(Math.round(B.gray * 5))}${'▯'.repeat(5 - Math.round(B.gray * 5))}` : '') : '';
    ui.board.style.filter = B.gray ? `grayscale(${(B.gray * 0.9).toFixed(2)})` : '';
    ui.us.textContent = M.scores[0]; ui.them.textContent = M.scores[1]; ui.to.textContent = M.target;
    for (let s = 0; s < 4; s++) {
      const el = ui.seat[s], info = B.seats[s], n = H ? H.hands[s].length : 7;
      el.classList.toggle('turn', !!(H && !H.over && H.turn === s));
      el.querySelector('.nm').innerHTML = `${esc(info.name)}<small>${s === 0 ? 'you' : s === 2 ? 'tu frente (partner)' : 'rival'}</small>`;
      const backs = el.querySelector('.dm-backs'); if (backs) backs.innerHTML = '<span class="dm-back"></span>'.repeat(n);
    }
    renderTable(); renderHand(); renderTrack();
  }
  function renderTable() {
    const felt = ui.felt, fw = felt.clientWidth || 700, fh = felt.clientHeight || 330, H = B.H;
    const u = clamp(Math.floor(Math.min(fw / 34, fh / 13)), 12, 26), Wu = fw / u, cx = fw / 2, cy = fh / 2;
    let html = '';
    if (B.shuffling) for (let i = 0; i < 16; i++) { const a = i * 2.4, r = 30 + (i % 4) * 22; html += `<span class="dm-swirl" style="left:${cx + Math.cos(a) * r - 11}px;top:${cy + Math.sin(a) * r * 0.6 - 20}px;animation-delay:${-i * 0.13}s"></span>`; }
    else if (H) {
      const lay = snake(H, Wu);
      for (const t of lay.tiles) {
        const cls = (t.id === B.lastPlayed ? 'last ' : '') + (t.id === B.dropId ? 'drop' : '');
        html += tileHTML(t.top, t.bot, cls, `--u:${u}px;left:${cx + t.x * u - u / 2}px;top:${cy + t.y * u - u}px;--rot:rotate(${t.rot}deg);transform:var(--rot)`);
      }
      if (B.choosing) lay.ends.forEach((e, side) => {
        const val = side ? H.R : H.L, on = B.choosing.side === side;
        html += `<div class="dm-ghost ${on ? 'on' : ''}" data-side="${side}" style="--u:${u}px;--deg:${e.rot}deg;left:${cx + e.x * u - u / 2}px;top:${cy + e.y * u - u}px;transform:rotate(${e.rot}deg)"><span>${side ? '→' : '←'}<small>${val}</small></span></div>`;
      });
    }
    felt.innerHTML = html;
    felt.querySelectorAll('.dm-ghost').forEach(g => g.onclick = () => chooseSide(+g.dataset.side));
    B.dropId = -1;
  }
  function renderHand() {
    const hand = sortedHand(), T = B.turn, okIds = new Set(T ? T.moves.map(m => m.id) : []);
    const u = clamp(Math.floor(Math.min((ui.hand.clientWidth || 560) / 11, 40)), 22, 40);
    ui.hand.innerHTML = hand.map((id, i) => {
      const cls = (T ? (okIds.has(id) ? 'ok' : 'no') : '') + (T && i === B.sel ? ' sel' : '') + (id === B.hintId ? ' hint' : '');
      return `<button type="button" class="dt ${cls}" data-id="${id}" style="--u:${u}px" title="${TA[id]}|${TB[id]}">${halfHTML(TA[id])}${halfHTML(TB[id])}<small>${i + 1}</small></button>`;
    }).join('');
    ui.hand.querySelectorAll('[data-id]').forEach(b => b.onclick = () => { const id = +b.dataset.id; b.blur(); B.sel = hand.indexOf(id); pickTile(id); });
    // what to do now
    const H = B.H; let s = '';
    if (B.choosing) s = `It fits both ends! <b>←</b> on the left (a <b>${H.L}</b>) or <b>→</b> on the right (a <b>${H.R}</b>)?<span class="k">or click a dashed spot · Esc: pick another tile</span>`;
    else if (T) s = H.center < 0 ? (H.first ? 'You have the double six: it opens the game! <span class="k">Enter to play it</span>' : 'Your lead: play any tile. <span class="k">←/→ choose · Enter play · 1–7 · H: a hint from your partner</span>')
      : `Your turn: play a tile with a <b>${H.L}</b>${H.L !== H.R ? ` or a <b>${H.R}</b>` : ''}.<span class="k">←/→ choose · Enter play · 1–7 · H: a hint</span>`;
    else if (H && !H.over && H.turn !== 0) s = `${esc(B.seats[H.turn].name)} is thinking…`;
    if (!B.call) ui.status.innerHTML = s;
  }
  function renderTrack() {
    ui.track.classList.toggle('hidden', !B.track || !B.H);
    if (!B.track || !B.H) return;
    const H = B.H, mine = [0, 1, 2, 3, 4, 5, 6].map(n => H.hands[0].filter(t => has(t, n)).length);
    ui.track.innerHTML = '<b>Fichas jugadas</b>' + [0, 1, 2, 3, 4, 5, 6].map(n => `<div class="tr"><span class="mini">${halfHTML(n)}</span><span class="bar"><b style="width:${(H.out[n] / 7) * 100}%"></b></span><span>${H.out[n]}/7</span><span style="opacity:.55">· ${mine[n]} yours</span></div>`).join('')
      + '<small>On the table, of each number’s 7 tiles</small>';
  }
  const shakeTable = () => { ui.table.classList.remove('slam'); void ui.table.offsetWidth; ui.table.classList.add('slam'); };
  // ---------------------------------------------------------------- your turn: pick a tile (and an end, if it fits both)
  function humanTurn() {
    return new Promise(res => {
      const H = B.H, moves = legal(H, 0, true);
      if (!moves.length) {
        callBox({ label: 'No tile of yours fits. Knock and say it!', placeholder: 'paso', buttons: [['¡Paso! (knock)', 'paso']], check: t => (saysPhrase('ph.paso', t) ? 'paso' : null),
          hint: 'Type «¡Paso!» (I pass)', phrase: 'ph.paso', auto: 'paso' }).then(r => res(r ? { pass: true, typed: r.typed } : null));
        return;
      }
      B.turn = { res, moves };
      const hand = sortedHand(), i = hand.findIndex(id => moves.some(m => m.id === id)); B.sel = Math.max(0, i);
      render();
    });
  }
  function pickTile(id) {
    const T = B.turn; if (!T || B.call) return;
    const ms = T.moves.filter(m => m.id === id), H = B.H;
    if (!ms.length) { Sound.play('wrong'); ui.status.innerHTML = H.center < 0 ? 'The first hand opens with the double six!' : `That one doesn’t fit: you need a <b>${H.L}</b>${H.L !== H.R ? ` or a <b>${H.R}</b>` : ''}.`; return; }
    if (ms.length === 1) return finishTurn(ms[0]);
    if (H.L === H.R) return finishTurn(ms.find(m => m.side === (H.chains[0].length <= H.chains[1].length ? 0 : 1)) || ms[0]);
    B.choosing = { id, moves: ms, side: 0 }; render();
  }
  function chooseSide(side) { const C = B.choosing; if (!C) return; const m = C.moves.find(x => x.side === side); if (m) finishTurn(m); }
  function finishTurn(m) { const T = B.turn; if (!T) return; B.turn = null; B.choosing = null; B.hintId = -1; T.res({ move: m }); }
  function showHint() {
    if (!B.turn || !B.H) return;
    const m = policyMove('hint', B.H, 0, B.turn.moves, Math.random, B.M);
    B.hintId = m.id; B.sel = sortedHand().indexOf(m.id); render();
    if (B.seats[2].key === 'mimo') { say(2, ['♪!', `${B.seats[2].name} points at a tile`], 2); Sound.play('chirp'); } else say(2, ['Esa… mira.', `${B.seats[2].name} nods at a tile`], 2);
    if (!B.hintTold && B.seats[1].key === 'fello') { B.hintTold = true; say(1, ['¡Eh! Los mirones son de cera…', 'Hey! Onlookers are made of wax…']); }
  }
  // ---------------------------------------------------------------- the calls you make out loud (typed, or the button)
  function callBox(o) {
    if (B.auto || B.fast) return Promise.resolve(o.auto !== undefined ? { v: o.auto, typed: false } : null);
    return new Promise(res => {
      B.call = { o, res };
      ui.call.classList.remove('hidden'); ui.call.classList.remove('shake');
      ui.callLabel.textContent = o.label; ui.callIn.value = ''; ui.callIn.placeholder = o.placeholder || ''; ui.callHint.textContent = '';
      ui.callBt.innerHTML = (o.buttons || []).map(([t], i) => `<button type="button" data-i="${i}">${esc(t)}</button>`).join('');
      ui.callBt.querySelectorAll('button').forEach(b => b.onclick = () => { b.blur(); finishCall({ v: o.buttons[+b.dataset.i][1], typed: false }); });
      ui.status.innerHTML = '';
      setTimeout(() => { if (B.call && B.call.o === o) ui.callIn.focus(); }, 40);
    });
  }
  // check(text) → a value (said), null (not said: shows o.hint), or { v, minor, note, why } (v null: not said, with why).
  // o.model: after two misses it shows, and saying it then grades D (o.grade: the result carries S–D)
  function callSubmit(text, typed) {
    const C = B.call; if (!C) return;
    const o = C.o, t = String(text || '').trim();
    let v = t ? o.check(t) : null, minor = false, note = '', why = '';
    if (v && typeof v === 'object') { minor = !!v.minor; note = v.note || ''; why = v.why || ''; v = v.v === undefined ? null : v.v; }
    if (v === null && !t && o.optional) v = o.auto;
    if (v === null) {
      C.miss = (C.miss || 0) + 1;
      ui.call.classList.remove('shake'); void ui.call.offsetWidth; ui.call.classList.add('shake');
      ui.callHint.textContent = (why ? why + ' ' : '') + (o.model && C.miss >= 2 ? `Try: «${o.model}»` : o.hint || '');
      Sound.play('wrong'); ui.callIn.select(); return;
    }
    const grade = !t ? null : (C.miss || 0) >= 2 ? 'D' : ['S', 'A', 'B', 'C'][Math.min(3, (C.miss || 0) + (minor ? 1 : 0))];
    finishCall({ v, typed: !!t, text: t, grade: o.grade ? grade : null, note });
  }
  function finishCall(r) {
    const C = B.call; if (!C) return;
    B.call = null; ui.call.classList.add('hidden'); ui.callIn.blur();
    if (r && r.typed) {
      say(0, [r.text, r.grade ? `${r.grade}${r.note ? ' · ' + r.note : ''}` : ''], r.grade ? 3 : 2.2); if (C.o.phrase) phUsed(C.o.phrase);
      Sound.play(r.grade === 'S' ? 'perfect' : 'review');
      if (B.cfg && B.cfg.onCall) try { B.cfg.onCall(r); } catch (e) { console.error('[domino] onCall', e); }
    }
    C.res(r);
  }
  // ---------------------------------------------------------------- cards inside the board (hand result, match result, pause, rules)
  function card(html, o = {}) {
    if (B.fast && o.fastOk !== false) return Promise.resolve(o.dflt !== undefined ? o.dflt : 'ok');
    return new Promise(res => {
      ui.cardIn.innerHTML = html; ui.card.classList.remove('hidden');
      const done = v => { B.card = null; ui.card.classList.add('hidden'); res(v); };
      B.card = { ok: () => done(o.dflt !== undefined ? o.dflt : 'ok'), esc: o.esc ? () => done(o.esc) : null, done };
      ui.cardIn.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { b.blur(); done(b.dataset.v); });
    });
  }
  const RULES_HTML = `<div class="tag">Las reglas de la mesa</div><div class="big" style="font-size:30px">Dominican dominoes</div><ul>
<li>Double-six set, four players, two pairs. Your <q>frente</q> (partner) sits across from you. 7 tiles each.</li>
<li>Before each hand somebody <q>da agua</q>: swirls the tiles face down, like stirring water. The pair that lost the last hand does it.</li>
<li>The first hand opens with the double six. After that, whoever won the last hand leads with any tile.</li>
<li>Play goes to the right. Match a number at either end. Can’t play? Knock and say <q>¡Paso!</q></li>
<li><q>¡Dominó!</q> Your last tile: your pair scores every pip left in your rivals’ hands.</li>
<li><q>¡Capicúa!</q> Your last tile fits both ends: +25, but a capicúa you don’t call doesn’t get paid!</li>
<li>Pase corrido: you play and all three others pass: +10 for your pair.</li>
<li><q>¡Tranque!</q> Nobody can play. Whoever locked it counts against the player on their right: the lower count wins the rivals’ pips. A tie: nobody scores.</li>
<li>First pair to 100 (or 200) wins. Rivals still at 0: <q>¡pollona!</q></li>
<li>Count the tiles! <b>T</b> shows how many of each number are out. And <q>los mirones son de cera</q>: onlookers keep quiet.</li></ul>`;
  async function boardRules() { if (B.card) return; const wasPaused = B.paused; B.paused = true; await card(RULES_HTML + '<div class="row"><button type="button" class="go" data-v="ok">Back to the game <kbd>Enter</kbd></button></div>', { fastOk: false }); B.paused = wasPaused; }
  async function openPause() {
    if (B.card || !B.M) return;
    B.paused = true;
    let v = await card(`<div class="tag">Pausa</div><div class="big" style="font-size:32px">Un momentico…</div><div class="why">The table waits for you.</div>
<div class="row"><button type="button" class="go" data-v="go">Keep playing <kbd>Esc</kbd></button><button type="button" data-v="rules">Rules</button><button type="button" class="warn" data-v="quit">Give up the match</button></div>`, { fastOk: false, dflt: 'go', esc: 'go' });
    if (v === 'rules') { await card(RULES_HTML + '<div class="row"><button type="button" class="go" data-v="ok">Back <kbd>Enter</kbd></button></div>', { fastOk: false }); v = 'go'; }
    if (v === 'quit') {
      v = await card('<div class="tag">Give up?</div><div class="big" style="font-size:30px">¿Te rindes?</div><div class="why">It counts as a loss. You can always come back for another game.</div><div class="row"><button type="button" data-v="go">No, keep playing <kbd>Esc</kbd></button><button type="button" class="warn" data-v="quit">Yes, give up</button></div>', { fastOk: false, dflt: 'go', esc: 'go' });
      if (v === 'quit') { forfeitNow(); return; }
    }
    B.paused = false;
  }
  function forfeitNow() {
    B.forfeit = true; B.paused = false;
    if (B.turn) { const T = B.turn; B.turn = null; T.res(null); }
    if (B.call) { const C = B.call; B.call = null; ui.call.classList.add('hidden'); C.res(null); }
  }
  async function pauseGate() { let guard = 0; while (B.paused && !B.forfeit && guard++ < 1e6) await wait(0.1); }
  // ---------------------------------------------------------------- the keys while the board or a lesson is up
  function onKey(e) {
    if (!DOMINO_UI.open) return;
    const k = e.code, inInput = e.target && e.target.tagName === 'INPUT';
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (DOMINO_UI.mode === 'lesson') {
      if (k === 'Escape') { stop(); if (LES.quit) LES.quit(); }
      else if (k === 'Tab') { stop(); if (LES.hint) LES.hint(); }
      else if (!inInput && ['Enter', 'Space', 'KeyE'].includes(k) && LES.next) { stop(); LES.next(); }
      else e.stopPropagation();
      return;
    }
    if (B.card) {
      if (['Enter', 'Space', 'KeyE', 'NumpadEnter'].includes(k)) { stop(); B.card.ok(); }
      else if (k === 'Escape') { stop(); (B.card.esc || B.card.ok)(); }
      else e.stopPropagation();
      return;
    }
    if (inInput) { if (k === 'Escape') { stop(); openPause(); } else e.stopPropagation(); return; }
    if (k === 'Escape') { stop(); if (B.choosing) { B.choosing = null; render(); } else openPause(); return; }
    if (k === 'KeyT') { stop(); B.track = !B.track; render(); return; }
    if (k === 'KeyR') { stop(); boardRules(); return; }
    if (k === 'KeyH') { stop(); showHint(); return; }
    if (!B.turn) { stop(); return; }
    if (B.choosing) {
      if (k === 'ArrowLeft' || k === 'KeyA' || k === 'Digit1') { stop(); chooseSide(0); }
      else if (k === 'ArrowRight' || k === 'KeyD' || k === 'Digit2') { stop(); chooseSide(1); }
      else stop();
      return;
    }
    const hand = sortedHand();
    if (k === 'ArrowLeft' || k === 'KeyA') { stop(); B.sel = (B.sel + hand.length - 1) % hand.length; render(); }
    else if (k === 'ArrowRight' || k === 'KeyD') { stop(); B.sel = (B.sel + 1) % hand.length; render(); }
    else if (['Enter', 'Space', 'KeyE', 'ArrowUp', 'KeyW', 'NumpadEnter'].includes(k)) { stop(); if (hand[B.sel] !== undefined) pickTile(hand[B.sel]); }
    else if (/^(Digit|Numpad)[1-7]$/.test(k)) { stop(); const i = +k.slice(-1) - 1; if (hand[i] !== undefined) { B.sel = i; pickTile(hand[i]); } }
    else e.stopPropagation();
  }
  // ---------------------------------------------------------------- a match
  function doPlay(s, mv) {
    const H = B.H;
    play(H, s, mv);
    B.lastPlayed = mv.id; B.dropId = mv.id;
    const key = B.seats[s].key;
    if (key === 'fello') { Sound.play('land', 12); Sound.play('crack'); shakeTable(); } else Sound.play(key === 'yunior' && Math.random() < 0.4 ? 'wood' : 'click');
    if (H.over) return;
    if (mv.id === D66 && key === 'fello') say(s, banter('fello', 'd66'));
    else if (Math.random() < (key === 'fello' ? 0.4 : 0.22)) sayKey(s, 'play');
  }
  function doPass(s, typed) {
    const H = B.H, bonus = pass(H, s), key = B.seats[s].key;
    Sound.play('wood'); setTimeout(() => Sound.play('wood'), 130);
    if (s !== 0 || !typed) sayKey(s, 'pass');
    if (s === 0 && Math.random() < 0.5) oppSay('youPass');
    if (bonus) {
      const L = H.last, lk = B.seats[L].key;
      setTimeout(() => { if (lk === 'fello') say(L, banter('fello', 'pase')); else say(L, ['¡Pase corrido!', `Everyone passed: +${bonus}`]); }, 0);
      Sound.play('review');
    }
    return key;
  }
  async function shuffleStep(loser) {
    // the pair that lost the last hand gives the tiles water (the first hand: the rivals)
    const t = loser < 0 ? 1 : loser;
    if (t === 0 && !B.auto && !B.fast) {
      const r = await callBox({ label: 'Your pair lost the last hand: you give the tiles water. Say it (or just press Enter)!', placeholder: '¡Dale agua!', buttons: [['Dar agua (shuffle)', 'agua']],
        check: x => (saysPhrase('ph.agua', x) ? 'agua' : null), optional: true, auto: 'agua', hint: 'Type «¡Dale agua!», or leave it empty', phrase: 'ph.agua' });
      if (!r) return;
    } else if (t === 1) { const s = B.M.hands % 2 ? 3 : 1; sayKey(s, 'shuffle'); }
    B.shuffling = true; render(); Sound.play('page');
    await wait(B.fast ? 0 : 0.6); Sound.play('page'); await wait(B.fast ? 0 : 0.6);
    B.shuffling = false;
  }
  async function lastCall(H) {
    const capi = H.over.capicua;
    const r = await callBox({ label: 'That was your last tile! Call it out:', placeholder: '¡Dominó! (…or is it a capicúa?)', buttons: [['¡Dominó!', 'domino'], ['¡Capicúa!', 'capicua']],
      check: t => (saysPhrase('ph.capicua', t) ? 'capicua' : saysPhrase('ph.domino', t) ? 'domino' : null), auto: capi ? 'capicua' : 'domino',
      hint: 'Type «¡Dominó!», or «¡Capicúa!» if your last tile fit both ends', phrase: capi ? 'ph.capicua' : 'ph.domino' });
    if (!r) return true;
    if (!r.typed) say(0, [r.v === 'capicua' ? '¡Capicúa!' : '¡Dominó!', ''], 2.2);
    if (capi && r.v === 'capicua') { Sound.play('perfect'); oppSay('youCapi'); if (B.seats[1].key !== 'fello') say(1, ['¡Capicúa!', 'Capicúa!']); return true; }
    if (capi) { const s = B.seats[1].key === 'fello' ? 1 : 3; say(s, B.seats[s].key === 'fello' ? banter('fello', 'missCapi') : ['¡Era capicúa! Y no la cantaste…', 'It was a capicúa! And you didn’t call it…'], 4); return false; }
    if (r.v === 'capicua') say(1, ['¿Capicúa? ¡Eso no es capicúa!', 'Capicúa? That’s no capicúa!'], 3);
    return true;
  }
  async function tranqueCall() {
    await callBox({ label: 'Nobody can play anymore! Call it out:', placeholder: '¡Tranque!', buttons: [['¡Tranque!', 'tranque']], check: t => (saysPhrase('ph.tranque', t) ? 'tranque' : null),
      auto: 'tranque', hint: 'Type «¡Tranque!» (locked!)', phrase: 'ph.tranque' }).then(r => { if (r && !r.typed) say(0, ['¡Tranque!', ''], 2); });
  }
  function handCardHTML(H, r) {
    const M = B.M, nm = s => esc(B.seats[s].name), pair = t => (t === 0 ? `Tú y ${esc(B.seats[2].name)}` : `${nm(1)} y ${nm(3)}`);
    let big, why, en = '';
    if (r.kind === 'domino') {
      big = r.capicua ? (r.paid ? '¡Capicúa!' : '¡Dominó!') : '¡Dominó!';
      why = `${r.seat === 0 ? 'You' : nm(r.seat)} played the last tile${r.capicua ? (r.paid ? ', on both ends!' : ': it was a capicúa, but nobody called it…') : '.'}`;
    } else {
      const T = r.seat, R = r.vs;
      big = r.team < 0 ? '¡Tranque! Empate' : '¡Tranque!';
      why = `${T === 0 ? 'You' : nm(T)} locked the game with ${r.counts[T]}. ${R === 0 ? 'You' : nm(R)} (on the right) ${R === 0 ? 'have' : 'has'} ${r.counts[R]}: `
        + (r.team < 0 ? 'a tie, nobody scores.' : `${r.team === team(T) ? (T === 0 ? 'you win' : nm(T) + ' wins') : (R === 0 ? 'you win' : nm(R) + ' wins')} it for ${r.team === 0 ? 'your pair' : 'their pair'}.`);
    }
    const hands = [0, 2, 1, 3].map(s => `<div class="hh ${team(s) === 0 ? 'us' : 'them'}">${nm(s)} ${H.hands[s].map(miniTile).join('') || '<span style="opacity:.5">—</span>'}<span class="n">${r.counts[s]}</span></div>`).join('');
    const pts = r.team < 0 ? 'Nobody scores' : `${pair(r.team)} +${r.pts}`;
    const extra = (r.paid ? `<div class="en">(${r.pts - RULES.capicua} in their tiles + 25 for the capicúa)</div>` : '') + (r.bonus[0] || r.bonus[1] ? `<div class="en">Pase corrido: ${r.bonus[0] ? `you +${r.bonus[0]}` : ''}${r.bonus[0] && r.bonus[1] ? ' · ' : ''}${r.bonus[1] ? `them +${r.bonus[1]}` : ''}</div>` : '');
    return `<div class="tag">Mano ${M.hands} · ${r.kind === 'domino' ? 'every pip left in the rivals’ hands counts' : 'the locker against the player on the right'}</div><div class="big ${r.team === 0 ? 'win' : ''}">${big}</div><div class="why">${why}</div>`
      + `<div class="hands">${hands}</div><div class="pts">${pts}</div>${extra}<div class="sc">Nosotros ${M.scores[0]} · Ellos ${M.scores[1]} · a ${M.target}</div>`
      + `<div class="row"><button type="button" class="go" data-v="ok">${M.over ? 'See who won ▸' : 'Next hand ▸'} <kbd>Enter</kbd></button></div>`;
  }
  // play one whole match on the board. cfg: { opp: 'regulars' | 'final', target }. Resolves { outcome: 'win' | 'lose' | 'forfeit', scores, pollona, stats }
  async function runMatch(cfg) {
    const opp = cfg.opp === 'final' ? ['fello', 'chago'] : cfg.opp === 'hush' ? ['nadie', 'nada'] : ['nena', 'yunior'];
    const mimo = (G && G.state.mimoName) || 'Mimo', pk = cfg.partner || 'mimo';
    B.seats = [{ key: 'you', name: 'Tú' }, { key: opp[0], name: NAME[opp[0]] }, { key: pk, name: pk === 'mimo' ? mimo : NAME[pk] }, { key: opp[1], name: NAME[opp[1]] }].map(x => Object.assign(x, { kind: KIND[x.key], face: FACE[x.key] }));
    const M = B.M = newMatch(cfg.target || 100);
    CFG.chagoSamples = cfg.rusty ? 0 : 60; CFG.hushSamples = cfg.easy ? 0 : 40;
    B.cfg = cfg; B.gray = cfg.gray === undefined ? null : cfg.gray;
    Object.assign(B, { forfeit: false, paused: false, H: null, turn: null, call: null, card: null, choosing: null, hintId: -1, hintTold: false, track: B.track, stats: { hands: 0, won: 0, capicuas: 0, calls: 0 } });
    openOverlay('board');
    for (let s = 0; s < 4; s++) { const cv = ui.seat[s].querySelector('canvas'); if (cv) ICONS.draw(cv, B.seats[s].face); }
    ui.say.forEach(el => el.classList.remove('on'));
    if (G) { const T = SITE.T, ty = built ? built.ty : 1.3; G.cam.override = { pos: V3(T.x + 3.4, ty + 2.4, T.z + 3.8), look: V3(T.x, ty, T.z) }; }
    render();
    let loser = -1, guard = 0;
    while (!M.over && !B.forfeit && guard++ < 100) {
      await shuffleStep(loser);
      if (B.forfeit) break;
      const H = B.H = startHand(M, Math.random);
      B.lastPlayed = -1; B.hintId = -1;
      render();
      if (M.hands === 0) { const s = H.turn; say(s, B.seats[s].key === 'fello' ? banter('fello', 'd66') : ['¡Sale el doble seis!', 'The double six opens!']); }
      let plies = 0;
      while (!H.over && !B.forfeit && plies++ < 200) {
        await pauseGate();
        if (B.forfeit) break;
        const s = H.turn;
        if (s === 0 && !B.auto) {
          const act = await humanTurn();
          if (B.forfeit || !act) break;
          if (act.pass) doPass(0, act.typed); else doPlay(0, act.move);
        } else {
          await wait(B.fast ? 0 : (B.seats[s].key === 'fello' ? 0.75 : 0.5) + Math.random() * 0.5);
          await pauseGate(); if (B.forfeit) break;
          const mv = legal(H, s, false);
          if (!mv.length) doPass(s); else doPlay(s, policyMove(B.seats[s].kind, H, s, mv, Math.random, M));
        }
        render();
      }
      if (B.forfeit || !H.over) break;
      let called = true;
      if (H.over.kind === 'domino' && H.over.seat === 0) called = await lastCall(H);
      else if (H.over.kind === 'tranque' && H.over.seat === 0) await tranqueCall();
      else if (H.over.kind === 'domino') { const k = B.seats[H.over.seat].key; if (H.over.capicua) { say(H.over.seat, k === 'mimo' ? ['♪♪♪!', `${B.seats[2].name}: capicúa!`] : banter(k, 'capicua')); Sound.play('perfect'); } else { sayKey(H.over.seat, 'domino'); Sound.play('chest'); } }
      else sayKey(H.over.seat, 'lock');
      if (B.forfeit) break;
      if (H.over.kind === 'tranque') Sound.play('hit');
      const r = result(H, { called });
      endHand(M, r);
      loser = r.team < 0 ? -1 : 1 - r.team;
      B.stats.hands++; if (r.team === 0) B.stats.won++; if (r.paid && r.seat === 0) B.stats.capicuas++;
      if (r.team === 1) { const k1 = B.seats[1].key; if (Math.random() < 0.6) sayKey(r.next === 3 ? 3 : 1, 'win'); else if (k1 === 'fello') say(1, banter('fello', 'win')); }
      else if (r.team === 0) oppSay('lose');
      render();
      await wait(B.fast ? 0 : 0.9);
      await card(handCardHTML(H, r));
      if (cfg.afterHand && !B.forfeit) { try { await cfg.afterHand(r, M, H); } catch (e) { console.error('[domino] afterHand', e); } render(); }
    }
    const outcome = B.forfeit ? 'forfeit' : M.over ? (M.over.team === 0 ? 'win' : 'lose') : 'forfeit';
    if (M.over) {
      const won = M.over.team === 0;
      Sound.play(won ? 'fanfare' : 'lose');
      await card(`<div class="tag">${M.target} puntos</div><div class="big ${won ? 'win' : ''}">${won ? '¡Ganaron!' : 'Perdieron…'}</div>`
        + `<div class="why">${won ? `You and ${esc(B.seats[2].name)} won` : `${esc(B.seats[1].name)} and ${esc(B.seats[3].name)} won`}, ${M.scores[won ? 0 : 1]} to ${M.scores[won ? 1 : 0]}.</div>`
        + (M.over.pollona ? `<div><span class="dm-badge">¡POLLONA!</span></div><div class="en">${won ? 'They never scored a point!' : 'You never scored a point… it happens!'}</div>` : '')
        + `<div class="sc">${B.stats.hands} hands · you won ${B.stats.won}${B.stats.capicuas ? ` · ${B.stats.capicuas} capicúa${B.stats.capicuas > 1 ? 's' : ''} called` : ''}</div>`
        + '<div class="row"><button type="button" class="go" data-v="ok">Back to the table ▸ <kbd>Enter</kbd></button></div>');
    }
    const out = { outcome, scores: M.scores.slice(), target: M.target, pollona: !!(M.over && M.over.pollona), stats: Object.assign({}, B.stats) };
    B.M = null; B.H = null; B.cfg = null; B.gray = null; if (ui) ui.board.style.filter = '';
    closeOverlay();
    return out;
  }

  // ================================================================ Dominican Spanish: the lessons (echo, then recall) and reviews
  const PH_STEPS = [90, 600, 3600, 6 * 3600, 86400, 3 * 86400, 7 * 86400, 21 * 86400];
  const nowS = () => Date.now() / 1000;
  function phSt(id) { const d = st(); d.ph = d.ph || {}; return d.ph[id] || (d.ph[id] = { lv: 0, due: 0, ok: 0, miss: 0 }); }
  // the phrase in LEX (the journal's Phrasebook lists stage ≥ 2): known, and kept far from LEX's own review queue (these
  // are reviewed here, at the table)
  function lexStage(id, stage) {
    if (typeof LEX === 'undefined' || !LEX.item(id) || LEX.lang !== 'es') return;
    const s = LEX.st(id), t = nowS(); LEX.expose(id);
    if (s.stage < stage) s.stage = stage;
    if (s.stage >= 2) { s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 30 * 86400; }
    s.last = t;
  }
  function phDone(id, clean) { const p = phSt(id); p.lv = clean ? Math.max(p.lv, 1) : 0; p.due = nowS() + PH_STEPS[p.lv]; lexStage(id, 3); }
  function phReview(id, ok) {
    const p = phSt(id);
    if (ok) { p.ok++; p.lv = Math.min(PH_STEPS.length - 1, p.lv + 1); } else { p.miss++; p.lv = Math.max(0, p.lv - 1); }
    p.due = nowS() + PH_STEPS[p.lv]; lexStage(id, 3);
  }
  function phUsed(id) { if (!G || !learned(id)) return; const p = phSt(id); if (nowS() >= p.due - 60) phReview(id, true); }
  const lessonDone = n => !!(G && st().lessons && st().lessons[n]);
  const learned = id => { const L = LESSONS.find(l => l.ids.includes(id)); return !!(L && lessonDone(L.n)) || !!(G && st().phScene && st().phScene[id]); };
  function duePhrases() { const d = st(); if (!d.ph) return []; const t = nowS(); return Object.keys(d.ph).filter(id => PHR[id] && learned(id) && d.ph[id].due <= t).sort((a, b) => d.ph[a].due - d.ph[b].due); }
  function keepLexDuesFar() {
    if (!G || G.state.lang !== 'es' || typeof LEX === 'undefined' || LEX.lang !== 'es') return;
    const t = nowS(), S0 = (LEX.toJSON().S || {}).es || {};
    for (const p of PHRASES) { const s = S0[p.id]; if (s && s.stage >= 2 && s.due < t + 86400) { s.due = t + 30 * 86400; s.str = Math.max(s.str || 0, 30 * 86400); } }
  }
  const LES = {};           // the lesson card's handlers (submit, idk, hint, quit, next, say)
  const hintOf = (s, n) => [...s].map((ch, i) => (!/[a-záéíóúñü]/i.test(ch) || i === 0 || n >= 3 || (n >= 2 && i % 2 === 0) ? ch : '_')).join('');
  function lessonCard(o) {
    // o: { L (lesson), i, of, mode: 'echo' | 'recall', id }. Resolves { ok, hints, idk } or 'quit'
    const P0 = PHR[o.id], U0 = USE[o.id], E = ui.L;
    return new Promise(res => {
      let hints = 0, shown = o.mode === 'echo', idk = false;
      E.t.textContent = `Lección ${o.L.n} · ${o.L.title} (${o.L.en})`;
      E.dots.innerHTML = Array.from({ length: o.of }, (_, k) => `<i class="${k < o.i ? 'f' : ''} ${k === o.i ? 'now' : ''}"></i>`).join('');
      E.card.classList.remove('ok');
      E.kind.textContent = o.mode === 'echo' ? 'New · type it to learn it' : 'From memory · what do you say?';
      E.phB.textContent = P0.es; LES.say = P0.es.replace(/[¿?¡!«».]/g, '');
      E.ph.classList.toggle('hidden', !shown);
      E.gl.textContent = o.mode === 'echo' ? `“${P0.en}”` : ''; E.gl.classList.toggle('hidden', o.mode !== 'echo');
      E.note.textContent = o.mode === 'echo' ? P0.note : ''; E.note.classList.toggle('hidden', o.mode !== 'echo');
      E.ex.innerHTML = o.mode === 'echo' ? (U0.ex || []).map(esc).join('<br>') : ''; E.ex.classList.toggle('hidden', o.mode !== 'echo');
      E.sit.textContent = o.mode === 'recall' ? U0.sit : ''; E.sit.classList.toggle('hidden', o.mode !== 'recall');
      E.idk.classList.toggle('hidden', o.mode === 'echo');
      E.input.value = ''; E.input.placeholder = o.mode === 'echo' ? P0.es : 'type it in Spanish…';
      const showHint = () => { E.hint.className = 'hint' + (hints ? '' : ' plain'); E.hint.textContent = hints ? hintOf(P0.es, hints) : (o.mode === 'echo' ? 'Type it just like that (accents and ¿¡ don’t matter)' : 'Tab: a hint · ?: show me'); };
      showHint();
      if (o.mode === 'echo') setTimeout(() => Sound.say(LES.say, 'es'), 150);
      setTimeout(() => E.input.focus(), 40);
      const finish = r => { Object.keys(LES).forEach(k => { LES[k] = null; }); res(r); };
      LES.submit = text => {
        const t = String(text || '').trim(); if (!t) return;
        if (o.mode === 'recall' && !shown && /^\s*\?+\s*$|^(idk|no se|no lo se|i dont know)$/i.test(norm(t) || t)) { LES.idk(); return; }
        if (saysPhrase(o.id, t)) {
          E.card.classList.add('ok'); Sound.play(o.mode === 'echo' ? 'learned' : 'review');
          E.ph.classList.remove('hidden'); E.hint.className = 'hint plain'; E.hint.textContent = '✓ ' + P0.es + '  ·  ' + P0.en;
          E.input.blur();
          LES.submit = null; LES.idk = null; LES.hint = null;
          LES.next = () => finish({ ok: true, hints, idk });
          if (B.fast) LES.next(); else wait(1.1).then(() => { if (LES.next) LES.next(); });
          return;
        }
        // another phrase from the lessons? say which one it is
        const other = PHRASES.find(p => p.id !== o.id && saysPhrase(p.id, t));
        Sound.play('wrong'); E.card.classList.remove('shake'); void E.card.offsetWidth; E.card.classList.add('shake');
        if (other) { E.hint.className = 'hint plain'; E.hint.textContent = `That’s «${other.es}» (${other.en}). Try again!`; }
        else if (o.mode === 'echo' || shown) { E.hint.className = 'hint plain'; E.hint.textContent = `Not quite: copy «${P0.es}»`; }
        else { hints = Math.min(3, hints + 1); showHint(); }
        E.input.select();
      };
      LES.idk = () => { if (shown) return; shown = true; idk = true; hints = 3; E.ph.classList.remove('hidden'); E.gl.textContent = `“${P0.en}”`; E.gl.classList.remove('hidden'); E.input.value = ''; E.input.placeholder = P0.es; E.hint.className = 'hint plain'; E.hint.textContent = 'Here it is! Type it.'; Sound.say(LES.say, 'es'); E.input.focus(); };
      LES.hint = () => { if (shown) return; hints = Math.min(3, hints + 1); showHint(); E.input.focus(); };
      LES.quit = () => finish('quit');
      LES.next = null;
    });
  }
  // the teacher's line, by the weave like every line (DESIGN.md 17.3): mixed (the English with the words you know in Spanish), whole
  // in Spanish as the weave rises; its English only on request (EN), never under it by default. o.note: the English is a note to
  // you, not the line's meaning (an example to say back: the example as it is, the note shown)
  function teacherSay(es, en, o = {}) {
    const E = ui.L;
    if (!es || o.note) { E.say.innerHTML = esc(es || '') + (en ? `<i>${esc(en)}</i>` : ''); return; }
    let html = esc(es);
    try { if (en && typeof STORY !== 'undefined' && STORY.mixHTML) html = STORY.mixHTML(es, en, { key: 'dmL:' + en }).html; } catch (e) { /* (as written) */ }
    E.say.innerHTML = (en ? '<button type="button" class="dm-enb" title="This line in English">EN</button>' : '') + html + (en ? `<i class="hidden">${esc(en)}</i>` : '');
    const b = E.say.querySelector('.dm-enb'), tr = E.say.querySelector('i');
    if (b) b.onclick = ev => { ev.stopPropagation(); tr.classList.toggle('hidden'); if (E.input) E.input.focus(); };
  }
  // one lesson: each phrase echoed (seen and typed), then all of them recalled from situations, in a new order
  async function runLesson(n) {
    const L = LESSONS[n - 1]; if (!L) return false;
    const TT = TEACHER[L.teacher || 'fello'];
    openOverlay('lesson'); ICONS.draw(ui.L.face, TT[0]);
    { const nm = ui.les.querySelector('.dm-teacher .nm'), hd = ui.les.querySelector('.dm-lhead b'); if (nm) nm.textContent = TT[1]; if (hd) hd.textContent = { nena: 'El colmado de Doña Nena', chago: 'Don Chago enseña' }[L.teacher] || 'La escuelita de Don Fello'; }
    const intro = lineOf(L.intro); teacherSay(intro.text.replace(/\{w\.(\w+)(:pl)?\}/g, (_, k, pl) => LEX.form('w.' + k, { pl: !!pl })), UI.weavePlain(intro.en, { english: true }));
    const before = {}; L.ids.forEach(id => { before[id] = typeof LEX !== 'undefined' && LEX.lang === 'es' ? LEX.st(id).stage : 0; });
    const quit = () => { L.ids.forEach(id => { if (LEX.lang === 'es' && before[id] < 2 && LEX.st(id).stage >= 2) LEX.st(id).stage = Math.max(1, before[id]); }); closeOverlay(); return false; };
    const total = L.ids.length * 2;
    for (let i = 0; i < L.ids.length; i++) {
      const id = L.ids[i];
      if (i > 0) teacherSay(...(USE[id].ex[0] ? [USE[id].ex[0].replace(/^[^:]+:\s*/, ''), 'Listen, and say it back.', { note: true }] : ['', '']));
      const r = await lessonCard({ L, i, of: total, mode: 'echo', id });
      if (r === 'quit') return quit();
      lexStage(id, 2);
    }
    teacherSay('¡Eso! Ahora, sin mirar.', 'That’s it! Now, without looking.');
    const order = shuffleInPlace(L.ids.slice(), Math.random), clean = {};
    for (let i = 0; i < order.length; i++) {
      const id = order[i];
      let r = await lessonCard({ L, i: L.ids.length + i, of: total, mode: 'recall', id });
      if (r === 'quit') return quit();
      clean[id] = !r.hints && !r.idk;
      if (!clean[id]) teacherSay('Bien. Esa la repasamos otra vez.', 'Good. We’ll go over that one again.');
      else teacherSay(pick(['¡Eso!', '¡Así se habla!', '¡Ta to’!', '¡Diache, qué rápido!']), pick(['That’s it!', 'That’s how you talk!', 'All good!']));
    }
    const d = st(); d.lessons = d.lessons || {}; d.lessons[n] = true;
    L.ids.forEach(id => phDone(id, clean[id]));
    const done = lineOf('dm.fello.done');
    teacherSay(done.text, UI.weavePlain(done.en, { english: true }));
    const E = ui.L;
    E.kind.textContent = `Lesson ${n} done!`; E.ph.classList.remove('hidden'); E.phB.textContent = '¡Ta to’!'; LES.say = 'Ta to';
    E.gl.classList.remove('hidden'); E.gl.textContent = L.ids.map(id => PHR[id].es).join(' · ');
    E.note.classList.remove('hidden'); E.note.textContent = 'They’re in your journal’s Phrasebook now. Don Fello will quiz you on them now and then.';
    [E.ex, E.sit, E.idk].forEach(x => x.classList.add('hidden')); E.hint.className = 'hint plain'; E.hint.textContent = 'Enter: back to the table';
    E.input.value = ''; E.input.placeholder = '(Enter)'; E.card.classList.add('ok'); Sound.play('chest');
    if (!B.fast) await new Promise(res => { LES.next = () => { LES.next = null; LES.submit = null; LES.quit = null; res(); }; LES.submit = () => LES.next(); LES.quit = () => LES.next(); setTimeout(() => E.input.focus(), 40); });
    closeOverlay();
    if (G) G.save();
    return true;
  }

  // ================================================================ the scenes
  const PP = id => built && built.people[id];
  function speak(id, key) {
    const p = PP(id); if (!p) return Promise.resolve();
    const L = lineOf(key), W = LEX.weave();
    p.api.lines = { en: L.weave || L.en }; p.api.lines[lang()] = L.text;
    return STORY.sayInline(p.api);
  }
  const you = text => STORY.you(text);
  const think = (text, s) => STORY.think(text, s);
  function frame(pos, look) { G.cam.override = { pos: V3(pos.x, pos.y, pos.z), look: V3(look.x, look.y, look.z) }; }
  const shotTable = () => { const T = SITE.T, ty = built.ty; frame({ x: T.x + 1.6, y: ty + 2.0, z: T.z + 5.2 }, { x: T.x, y: ty + 0.4, z: T.z - 0.6 }); };
  async function meetScene() {
    const d = st();
    d.heard = true;
    shotTable();
    await speak('fello', 'dm.fello.hi');
    await you('{w.hello}! I’m new in Alba. What are you playing?');
    await speak('fello', 'dm.fello.name');
    await speak('nena', 'dm.nena.hi');
    await speak('yunior', 'dm.yunior.hi');
    await you('Can {mimo} and I play too?');
    G.sim.mimo.happy = 1.2; G.sim.mimoSay('!', 1.2); Sound.play('chirp');
    await speak('fello', 'dm.fello.earn');
    await speak('fello', 'dm.fello.school');
    d.met = true; G.cam.override = null;
    ['w.domino', 'w.tile', 'w.colmado', 'w.coffee'].forEach(id => LEX.expose(id));
    G.save();
    const go = await UI.choose('Don Fello: «¿Empezamos?» (Shall we start?)', [{ label: 'Lesson 1 now: Saludos', sub: 'greetings, the Dominican way', value: 1 }, { label: 'Later', sub: 'talk to Don Fello when you’re ready', value: 0 }]);
    if (go === 1) await lessonFlow(1);
  }
  async function lessonFlow(n) {
    const ok = await runLesson(n);
    if (!ok) { think('Don Fello shrugs. «Cuando quieras.» (Whenever you like.)', 3.5); return false; }
    if (n === 2 && !st().regulars) think(chOpen(2) ? 'Lessons 1 and 2 done! Now Don Fello will let you play against Nena and Yunior.' : 'Lessons 1 and 2 done! The real match comes later (chapter 2: after the big Hushling on the hill). A friendly game is fine anytime.', 5.5);
    if (n === 3 && !st().healed) think('Chago’s words: «¡Diache!», «¡Qué vaina!», «¡Qué tíguere!»… Let’s go talk to him.', 5);
    return true;
  }
  // now and then, Don Fello quizzes you on a phrase that's due (one per visit at most)
  let lastQuiz = 0;
  async function greetReview() {
    const due = duePhrases(); if (!due.length || nowS() - lastQuiz < 150) return;
    lastQuiz = nowS();
    const id = due[0], P0 = PHR[id];
    const greet = id === 'ph.dimelo' || id === 'ph.tato';
    if (greet) await speak('fello', 'dm.fello.klk');
    const r = await UI.command({ name: G.state.mimoName, icon: 'dmFello', title: greet ? 'Don Fello: «¿Qué lo que?». Answer him!' : `Don Fello quizzes you: ${USE[id].sit}`, verbs: [], hint: '',
      placeholder: 'say it in Spanish…', model: P0.es, modelEn: P0.en });
    if (!r || r.cancelled) return;
    const ok = greet ? saysPhrase('ph.dimelo', r.text) || saysPhrase('ph.tato', r.text) : saysPhrase(id, r.text);
    phReview(id, ok);
    if (ok) { Sound.play('review'); await speak('fello', 'dm.fello.eso'); }
    else { Sound.play('wrong'); think(`Don Fello wags a finger: «${P0.es}» (${P0.en}).`, 4.5); }
  }
  // ---------------------------------------------------------------- the five chapters. Done-ness comes from the state the
  // quest always kept (so old saves map straight on), and a chapter you've started stays open whatever its gate says
  const CHS = [
    { n: 1, title: 'La escuelita', sub: 'Dominican greetings and the calls of the table', gate: f => !!f.rosa, wait: 'after Rosa’s welcome' },
    { n: 2, title: 'La silla vacía', sub: 'beat Doña Nena and Yunior; the empty chair', gate: f => !!f.boss, wait: 'after the big Hushling on the hill' },
    { n: 3, title: 'Las palabras de Chago', sub: 'give Chago his words back; the big game', gate: f => (f.bells || 0) >= 1, wait: 'after the first bell' },
    { n: 4, title: 'El colmado', sub: 'mind Doña Nena’s counter for an afternoon', gate: f => (f.bells || 0) >= 2, wait: 'after the second bell' },
    { n: 5, title: 'La final del barrio', sub: 'the tournament, with Don Chago as your partner', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell' },
  ];
  function chDone(n) {
    const d = st(), L = lessonDone;
    return n === 1 ? L(1) && L(2) : n === 2 ? !!(d.regulars && d.story && L(3)) : n === 3 ? !!(d.healed && d.won) : n === 4 ? !!d.c4 : n === 5 ? !!d.c5 : false;
  }
  function chStarted(n) {
    const d = st();
    return n === 1 ? !!d.met : n === 2 ? !!(d.regulars || d.story || lessonDone(3)) : n === 3 ? !!(d.chagoBeat || d.healed || d.won || d.finalLosses) : n === 4 ? !!d.c4s : n === 5 ? !!d.c5s : false;
  }
  const chOpen = n => chDone(n) || chStarted(n) || (CHS[n - 1].gate((G && G.state.flags) || {}) && (n === 1 || chDone(n - 1)));
  const mimoName = () => (G && G.state.mimoName) || 'Mimo';
  // what's next inside a chapter: { sub (for the menu), run }
  function chStep(n) {
    const d = st();
    if (n === 1) { const L = LESSONS[lessonDone(1) ? 1 : 0]; return { sub: `Lesson ${L.n}: ${L.title} (${L.en})`, run: () => lessonFlow(L.n) }; }
    if (n === 2) {
      if (!d.regulars) return { sub: `You & ${mimoName()} vs. Doña Nena & Yunior`, run: playFlow };
      if (!d.story) return { sub: 'the empty chair', run: chairStory };
      return { sub: 'Lesson 3: Las palabras de Chago', run: () => lessonFlow(3) };
    }
    if (n === 3) {
      if (!d.healed) return { sub: 'talk to Don Chago with his own words', run: () => speak('fello', 'dm.fello.goChago') };
      return { sub: 'the big game: vs. Don Fello & Don Chago', run: playFlow };
    }
    if (n === 4) return { sub: d.c4s ? 'back to the colmado’s counter' : 'mind Doña Nena’s counter for an afternoon', run: chapter4 };
    return { sub: d.c5intro ? 'the rematch: vs. Don Nadie & Doña Nada' : 'the barrio’s tournament', run: chapter5 };
  }
  const STEPS_TXT = () => {
    const d = st();
    if (!lessonDone(1) || !lessonDone(2)) return 'Lessons first';
    if (!d.regulars) return chOpen(2) ? `You & ${mimoName()} vs. Doña Nena & Yunior` : 'a friendly game, to 50';
    if (!d.healed) return 'a friendly game, to 50';
    if (!d.won) return 'The big game: vs. Don Fello & Don Chago';
    return 'Any game you like';
  };
  async function felloTalk() {
    const d = st();
    if (!d.met) { if (!chOpen(1)) return speak('fello', 'dm.fello.busy'); return meetScene(); }
    await greetReview();
    const opts = [], next = CHS.find(c => !chDone(c.n));
    if (next) opts.push(chOpen(next.n) ? { label: `Chapter ${next.n}: ${next.title}`, sub: chStep(next.n).sub, value: 'next' } : { label: `Chapter ${next.n}: ${next.title}`, sub: `later: ${next.wait}`, value: 'wait' });
    const done = LESSONS.filter(L => lessonDone(L.n));
    if (done.length) opts.push({ label: 'Practice a lesson again', sub: done.map(L => L.title).join(' · '), value: 'lesson' });
    if (lessonDone(1) && lessonDone(2)) opts.push({ label: 'Play dominoes', sub: STEPS_TXT(), value: 'play' });
    if (d.regulars && !d.healed && d.story) opts.push({ label: 'Ask about the empty chair', sub: 'Chago', value: 'chair' });
    if (d.necklace) opts.push({ label: d.necklaceOff ? `Put the lucky tile back on ${mimoName()}` : `Take the lucky tile off ${mimoName()}`, sub: 'Don Fello’s double six, on a string', value: 'necklace' });
    opts.push({ label: 'The house rules', sub: 'how this table plays', value: 'rules' });
    if (d.record) opts.push({ label: 'Your record at this table', sub: `${d.record.wins || 0} won · ${d.record.losses || 0} lost`, value: 'record' });
    const v = await UI.choose('Don Fello: «¿Qué vamos a hacer?» (What are we doing?)', opts);
    if (v === 'next') return chStep(next.n).run();
    if (v === 'wait') return speak('fello', 'dm.fello.later');
    if (v === 'lesson') {
      const which = done.length === 1 ? done[0].n : await UI.choose('Which lesson?', done.map(L => ({ label: `${L.n}. ${L.title}`, sub: L.ids.map(id => PHR[id].es).join(' · '), value: L.n })));
      if (which) return runLesson(which);
    } else if (v === 'play') return playFlow();
    else if (v === 'chair') return chairStory();
    else if (v === 'necklace') { d.necklaceOff = !d.necklaceOff; UI.toast(d.necklaceOff ? 'Lucky tile off.' : `${mimoName()} wears the lucky tile again!`); G.save(); }
    else if (v === 'rules') return rulesCard();
    else if (v === 'record') return recordCard();
  }
  async function friendlyGame() {
    const go = await UI.choose('Don Fello: «¿Una partidita amistosa?» (A friendly little game?)', [{ label: 'Sí: vs. Doña Nena & Yunior, to 50', sub: 'just for fun (your record counts)', value: 1 }, { label: 'Later', value: 0 }]);
    if (!go) return;
    await speak('fello', 'dm.fello.friendly');
    const res = await runMatch({ opp: 'regulars', target: 50 });
    record(res); G.save();
    if (res.outcome === 'win') await speak('yunior', 'dm.yunior.lost'); else if (res.outcome === 'lose') await speak('yunior', 'dm.yunior.won');
  }
  async function rulesCard() {
    await UI.card(`<div class="tag">Las reglas de la mesa</div><div class="note" style="text-align:left;font-size:15px;line-height:1.45">Double six, two pairs (your «frente» sits across), 7 tiles each. The first hand opens with the double six; then the last hand’s winner leads.<br>«¡Paso!» if you can’t play · «¡Dominó!» last tile: the rivals’ pips are yours · «¡Capicúa!» (fits both ends) +25, only if you call it · pase corrido +10 · «¡Tranque!»: the locker against the player on the right, the lower count wins · first to 100: rivals at 0 is a «pollona».</div><div class="sub">E to close</div>`);
  }
  async function recordCard() {
    const r = st().record || {};
    await UI.card(`<div class="tag">Tu récord en la mesa</div><div class="big">${r.wins || 0} – ${r.losses || 0}</div><div class="note">Matches won and lost · ${r.hands || 0} hands won · ${r.capicuas || 0} capicúas called · ${r.pollonas || 0} pollonas</div><div class="sub">E to close</div>`);
  }
  function record(res, cfg) {
    const d = st(), R = d.record || (d.record = { wins: 0, losses: 0, hands: 0, capicuas: 0, pollonas: 0 });
    if (res.outcome === 'win') R.wins++; else R.losses++;
    R.hands += res.stats.won || 0; R.capicuas += res.stats.capicuas || 0; if (res.outcome === 'win' && res.pollona) R.pollonas++;
    void cfg;
  }
  async function playFlow() {
    const d = st();
    if (!lessonDone(1) || !lessonDone(2)) { await speak('fello', 'dm.fello.notReady'); return; }
    if (!d.regulars) {
      if (!chOpen(2)) return friendlyGame();        // (chapter 2's real match waits for its gate)
      await speak('fello', 'dm.fello.vsReg');
      const res = await runMatch({ opp: 'regulars', target: 100 });
      record(res);
      if (res.outcome === 'win') {
        d.regulars = true; G.save();
        await speak('yunior', 'dm.yunior.lost'); await speak('nena', 'dm.nena.lost'); await speak('fello', 'dm.fello.notbad');
        return chairStory();
      }
      G.save();
      await speak('yunior', 'dm.yunior.won');
      if (res.outcome !== 'forfeit') think('Hmm. Count the tiles (T on the board), and dump the heavy ones early…', 4.5);
      return;
    }
    if (!d.healed) {
      if (!d.story) return chairStory();
      if (lessonDone(3) && !chOpen(3)) { await speak('fello', 'dm.fello.chagoLater'); return friendlyGame(); }
      await speak('fello', lessonDone(3) ? 'dm.fello.goChago' : 'dm.fello.chagoHint');
      if (!lessonDone(3)) { const go = await UI.choose('Learn Chago’s words now?', [{ label: 'Lesson 3: Las palabras de Chago', sub: '¡Diache! · ¡Qué vaina! · ¡Qué tíguere! · ¡Qué jevi!', value: 3 }, { label: 'Later', value: 0 }]); if (go === 3) await lessonFlow(3); }
      return;
    }
    if (!d.won) {
      let target = 100;
      // (lost twice: Chago, still a bit rusty after all that silence, stops counting, and Fello offers a shorter game)
      const rusty = (d.finalLosses || 0) >= 2;
      if (rusty) { await speak('fello', 'dm.fello.short'); const t = await UI.choose('Don Fello and Don Chago: how far?', [{ label: 'A cien (to 100)', sub: 'the real thing', value: 100 }, { label: 'A cincuenta (to 50)', sub: 'a shorter game', value: 50 }]); if (!t) return; target = t; }
      else await speak('fello', 'dm.fello.final');
      const res = await runMatch({ opp: 'final', target, rusty });
      record(res);
      if (res.outcome === 'win') return winScene(res);
      d.finalLosses = (d.finalLosses || 0) + (res.outcome === 'lose' ? 1 : 0); G.save();
      return speak('fello', 'dm.fello.notyet');
    }
    // after the quest: any pairing, any length
    const opp = await UI.choose('Who do you want to play?', [{ label: 'Don Fello & Don Chago', sub: 'the masters (hard)', value: 'final' }, { label: 'Doña Nena & Yunior', sub: 'the regulars (easier)', value: 'regulars' }]);
    if (!opp) return;
    const target = await UI.choose('How far?', [{ label: 'A cien (to 100)', value: 100 }, { label: 'A doscientos (to 200)', sub: 'the full Dominican game', value: 200 }, { label: 'A cincuenta (to 50)', sub: 'a quick one', value: 50 }]);
    if (!target) return;
    await speak('fello', 'dm.fello.idle1');
    const res = await runMatch({ opp, target });
    record(res); G.save();
    if (res.outcome === 'win') { if (opp === 'final') await speak('chago', 'dm.chago.tiguere'); else await speak('yunior', 'dm.yunior.lost'); }
    else if (res.outcome === 'lose') await speak(opp === 'final' ? 'fello' : 'yunior', opp === 'final' ? 'dm.fello.idle2' : 'dm.yunior.won');
  }
  async function chairStory() {
    const d = st(), c = built.chairs.S;
    frame({ x: c.x + 2.4, y: built.ty + 1.7, z: c.z + 2.6 }, { x: c.x, y: built.ty, z: c.z - 0.4 });
    await speak('fello', 'dm.fello.chair1');
    await speak('fello', 'dm.fello.chair2');
    const ch = PP('chago'); frame({ x: (ch.S.x + c.x) / 2 + 2.2, y: built.ty + 2.0, z: (ch.S.z + c.z) / 2 + 3.4 }, { x: ch.S.x, y: ch.S.gy + 0.8, z: ch.S.z });
    await speak('fello', 'dm.fello.chair3');
    await speak('fello', 'dm.fello.chair4');
    await you('The Hush takes the words of people who stop using them… Don Chago, I’ll help you find yours.');
    d.story = true; G.cam.override = null; G.save();
    if (!lessonDone(3)) { const go = await UI.choose('Learn Chago’s words now?', [{ label: 'Lesson 3: Las palabras de Chago', sub: '¡Diache! · ¡Qué vaina! · ¡Qué tíguere! · ¡Qué jevi!', value: 3 }, { label: 'Later', value: 0 }]); if (go === 3) await lessonFlow(3); }
  }
  // what the Hush left of Chago's words
  function blankOut(s, seed) {
    const R = rng(seed);
    return s.split(' ').map(w => { if (/^\*.*\*[.,…!?]*$/.test(w)) return w.replace(/\*/g, ''); if (/^[….]+$/.test(w)) return w; const m = w.match(/^(.*?)([.,…!?;:]*)$/); return R() < 0.55 ? '▬' + m[2] : w; }).join(' ');
  }
  function hushedLine() {
    const p = PP('chago'); if (!p) return Promise.resolve();
    const W = LEX.weave(), es = blankOut(CHAGO_HUSHED.es, 41), en = blankOut(CHAGO_HUSHED.en, 41);
    p.api.lines = { en, es }; if (W < 0.62) p.api.lines.es = es;
    G.sim.mimo.scared = Math.max(G.sim.mimo.scared || 0, 2.5);
    return STORY.sayInline(p.api);
  }
  const BEATS = [
    { id: 'ph.queloque', title: 'Don Chago stares at the ground. Greet him the Dominican way!', reply: 'dm.chago.h1', gray: 0.8 },
    { id: 'ph.capicua', title: 'Something flickers in his eyes. Say the word he loved to shout at the table!', reply: 'dm.chago.h2', gray: 0.6 },
    { id: 'ph.tato', pre: 'dm.chago.h3', title: 'He thinks the loss was his fault. Tell him it’s all good!', reply: 'dm.chago.h4', gray: 0.35 },
    { id: 'ph.tiguere', title: 'He was the sharpest player on the street. Tell him so!', reply: 'dm.chago.h5', gray: 0 },
  ];
  async function chagoTalk() {
    const d = st(), ch = PP('chago');
    if (d.healed) return speak('chago', pick(['dm.chago.idle1', 'dm.chago.idle2']));
    await hushedLine();
    if (!d.story) { think(d.regulars ? 'He doesn’t look up. Maybe Don Fello knows what happened to him.' : 'He doesn’t look up. Gray all over, like the hushed in Alba…', 4.5); return; }
    if (!lessonDone(3)) { think('Don Fello said Chago loved certain words. He can teach them to me (lesson 3).', 4.5); return; }
    if (!chOpen(3)) { think('He doesn’t look up… not yet. His words will keep. (Chapter 3: after the first bell.)', 5); return; }
    // help him find his words: say them to him, one by one
    frame({ x: ch.S.x + Math.sin(ch.S.yaw + 0.9) * 3.2, y: ch.S.gy + 1.9, z: ch.S.z + Math.cos(ch.S.yaw + 0.9) * 3.2 }, { x: ch.S.x, y: ch.S.gy + 0.8, z: ch.S.z });
    for (let i = d.chagoBeat || 0; i < BEATS.length; i++) {
      const b = BEATS[i], P0 = PHR[b.id];
      if (b.pre) await speak('chago', b.pre);
      let r;
      for (let tries = 0; ; tries++) {
        r = await UI.command({ name: G.state.mimoName, icon: 'dmChago', title: b.title, verbs: [], hint: tries ? `(Try «${P0.es}»)` : '', placeholder: 'say it in Spanish…', model: P0.es, modelEn: P0.en });
        if (!r || r.cancelled) { G.cam.override = null; G.save(); return; }        // (where you got to is kept)
        if (saysPhrase(b.id, r.text)) break;
        Sound.play('wrong'); G.sim.mimo.tiltT = 1.2;
        await STORY.wait(0.3);
      }
      Sound.play('review'); phUsed(b.id);
      d.chagoBeat = i + 1; G.save();                    // (his color drifts back toward this beat's gray: update() eases it)
      G.w3d.fx.sparkle(ch.S.x, ch.S.gy + 1.2, ch.S.z, 8);
      await STORY.wait(0.6);
      await speak('chago', b.reply);
    }
    // his words are back: he laughs, gets up, and goes back to the table
    d.healed = true; ch.S.gray = 0; G.save();
    Sound.play('learned'); G.w3d.fx.sparkle(ch.S.x, ch.S.gy + 1.2, ch.S.z, 24); G.sim.mimo.happy = 2;
    await speak('chago', 'dm.chago.fello');
    shotTable();
    ch.S.walkTo = { x: SITE.SEATS.S.x, z: SITE.SEATS.S.z };
    for (let k = 0; k < 120 && ch.S.walkTo; k++) await STORY.wait(0.1);
    if (ch.S.walkTo) { ch.S.walkTo = null; built.seatAt(ch, 'S'); }
    await speak('fello', 'dm.fello.reunion');
    await speak('fello', 'dm.fello.forgive');
    await you('Mistakes and all. That’s how you keep your words.');
    await speak('fello', 'dm.fello.final');
    G.cam.override = null; G.save();
  }
  async function winScene(res) {
    const d = st(), M = G.sim.mimo;
    d.won = true; G.save();
    shotTable();
    await speak('fello', 'dm.fello.beaten');
    await speak('chago', 'dm.chago.tiguere');
    await speak('fello', 'dm.fello.gift');
    G.state.flags.luckyTile = true; G.state.bag = G.state.bag || {}; G.state.bag['k.luckyTile'] = 1;
    Sound.play('chest');
    await UI.card(`<div class="tag">Key item</div><canvas width="140" height="140"></canvas><div class="big">la ficha de la suerte</div><div class="sub">Don Fello’s lucky tile: the double six. Forty years in his pocket. E</div>`, { icon: 'luckyTile' });
    await speak('nena', 'dm.nena.necklace');
    d.necklace = true; M.happy = 2; M.glow = 1; G.sim.emit('learned', {}); G.w3d.fx.sparkle(M.x, M.ry + 0.8, M.z, 18);
    UI.toast(`${G.state.mimoName} wears Don Fello’s lucky tile now!`);
    await speak('yunior', 'dm.yunior.coro');
    G.cam.override = null; G.save();
    // el coro: everybody dances a little
    Object.values(built.people).forEach(p => { p.S.party = true; });
    STORY.wait(14).then(() => Object.values(built.people).forEach(p => { p.S.party = false; }));
    if (res && res.pollona) UI.toast('¡Pollona! They never scored a point.');
  }
  // ================================================================ chapters 4 and 5: el colmado, la final del barrio
  // (typed calls in scenes go through the Día de Muertos call bar, MUI.hud, themed Dominican: graded S–D, no fail states)
  const coins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; Sound.play('chest'); UI.toast(`${why}: +${n} coins`); };
  const fastNow = () => B.fast || (typeof MUI !== 'undefined' && MUI.fast);
  const lockYou = v => { if (G) G.sim.lock = v ? 1 : 0; };
  function teleport(p, face) {
    const Y = G.sim.you, M = G.sim.mimo, yaw = Math.atan2(face.x - p.x, face.z - p.z);
    Y.x = p.x; Y.z = p.z; Y.yaw = yaw; Y.vx = Y.vz = Y.vy = 0; Y.onGround = true;
    M.x = p.x + Math.cos(yaw) * 0.95; M.z = p.z - Math.sin(yaw) * 0.95; M.station = null; M.look = null; M.hop = null; M.wander = null;
    try { [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3); } catch (e) { /* */ } G.sim.snap();
  }
  const camAt = (a, ay, b, by) => frame({ x: a.x, y: built.fy + ay, z: a.z }, { x: b.x, y: built.fy + by, z: b.z });
  const shotCounter = () => camAt(SITE.bw(5.0, 5.0), 2.4, SITE.bw(-0.5, 2.9), 1.0);
  const shotYard = () => camAt(SITE.bw(3.6, 11.2), 4.0, SITE.bw(-0.4, 4.0), 0.7);
  const N_ = s => normKey(s);
  const hasW = (t, list) => { const n = ' ' + N_(t) + ' '; return list.some(k => n.includes(' ' + N_(k) + ' ')); };
  // numbers in Spanish, words or digits, in the order said: «ciento cinco a sesenta» → [105, 60]
  const NUMW = { cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15,
    dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiun: 21, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25,
    veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50, sesenta: 60, setenta: 70, ochenta: 80, noventa: 90, cien: 100, ciento: 100, doscientos: 200, doscientas: 200 };
  function numbersIn(text) {
    const toks = String(text).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    const nums = []; let cur = null, digits = false;
    for (const w of toks) {
      if (/^\d+$/.test(w)) { if (cur !== null) nums.push(cur); cur = null; nums.push(+w); digits = true; continue; }
      const v = NUMW[w];
      if (v !== undefined) { cur = (cur || 0) + v; continue; }
      if (w === 'y' && cur !== null) continue;
      if (cur !== null) { nums.push(cur); cur = null; }
    }
    if (cur !== null) nums.push(cur);
    return { nums, digits };
  }
  const UNITS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
    'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  const TENS = { 3: 'treinta', 4: 'cuarenta', 5: 'cincuenta', 6: 'sesenta', 7: 'setenta', 8: 'ochenta', 9: 'noventa' };
  function spell(n) {
    if (n < 30) return UNITS[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' y ' + UNITS[n % 10] : '');
    if (n === 100) return 'cien';
    if (n < 200) return 'ciento ' + spell(n - 100);
    if (n === 200) return 'doscientos';
    return n < 300 ? 'doscientos ' + spell(n - 200) : String(n);
  }
  const numCheck = n => t => { const r = numbersIn(t); if (!r.nums.length) return { ok: false, why: 'Say the number in Spanish.' }; if (!r.nums.includes(n)) return { ok: false, why: `It’s ${n}: «${spell(n)}».` };
    return r.digits ? { ok: true, minor: true, note: `in words: «${spell(n)}»` } : { ok: true }; };
  const scoreCheck = (a, b) => t => {
    const r = numbersIn(t);
    if (r.nums.length < 2) return { ok: false, why: 'Both scores: your pair’s first, then theirs.' };
    const [x, y] = r.nums;
    if (x === a && y === b) return r.digits ? { ok: true, minor: true, note: `in words: «${spell(a)} a ${spell(b)}»` } : { ok: true };
    if (x === b && y === a) return { ok: false, why: 'Your pair’s points go first!' };
    return { ok: false, why: `Read it off the scoreboard: ${a} for you, ${b} for them.` };
  };
  const phOk = id => t => ({ ok: saysPhrase(id, t) });
  // one typed call on the bar: → 'S'…'D' or 'quit' (and the grade is kept for the chapter's card)
  let grades = null;
  async function hudSay(o) {
    if (typeof MUI === 'undefined' || !MUI.hud) return 'S';
    if (!MUI.hud.open_) MUI.hud.open(o.head || 'El barrio', { theme: 'dr' });
    const g = await MUI.hud.call({ icon: o.icon, title: o.title, sub: o.sub || '', model: o.model, modelEn: o.modelEn, check: o.check, help: o.help, bar: o.bar });
    if (g === 'quit') return g;
    if (grades) grades.push(g);
    if (o.id) phUsed(o.id);
    if (!fastNow()) await wait(0.5);
    return g;
  }
  const phSay = (id, o) => hudSay(Object.assign({ model: PHR[id].es, modelEn: PHR[id].en, check: phOk(id), id }, o));
  const gradeLine = list => { const c = {}; (list || []).forEach(g => { c[g] = (c[g] || 0) + 1; }); return ['S', 'A', 'B', 'C', 'D'].filter(g => c[g]).map(g => `${g}×${c[g]}`).join(' · '); };
  // a phone voice (Doña Fefa): a bubble at the window
  function phone(key) { const L = lineOf(key), w = SPOTS.window; const p = { id: 'dm.fefa', name: 'Doña Fefa (al teléfono)', x: w.x, z: w.z, y: built.fy + 0.9, top: 0.5, r: 0.3, lines: { en: L.weave || L.en } }; p.lines[lang()] = L.text; return STORY.sayInline(p); }
  // → true when they got there (or were set down there after sec seconds); false when another walk or the scene's end
  // cancelled it (then nothing that waited on it should move them)
  async function walkGame(p, pts, sec = 14) {
    const tok = {}; let done = false; p.S.walkTok = tok;
    walkPath(p, pts).then(() => { done = true; });
    for (let k = 0; k < sec * 10 && !done && p.S.walkTok === tok && SC.lock; k++) await wait(0.1);
    if (p.S.walkTok !== tok || !SC.lock) return false;
    if (!done) { const last = pts[pts.length - 1]; p.S.walkTo = null; p.S.x = last.x; p.S.z = last.z; p.S.gy = built.gy(last.x, last.z); }
    return true;
  }
  const hudOpen = title => { if (typeof MUI !== 'undefined' && MUI.hud) MUI.hud.open(title, { theme: 'dr' }); };
  const hudClose = () => { if (typeof MUI !== 'undefined' && MUI.hud && MUI.hud.open_) MUI.hud.close(); };
  const custIn = async id => { const p = PP(id); built.standAt(p, SPOTS.gate, SPOTS.wp1); p.S.faceTo = null; await walkGame(p, [SPOTS.wp1, SPOTS.cust]); p.S.faceTo = SPOTS.window; p.S.at = 'cust'; };
  const custOut = id => { const p = PP(id); p.S.faceTo = null; walkGame(p, [SPOTS.wp1, SPOTS.gate]).then(ok => { if (ok) built.awayAt(p); }); };
  function endScene() {
    SC.lock = false; SC.hush = 0; SC.music = 0; SC.radioOff = false; SC.noAmb = false;
    Object.values(built.people).forEach(p => { p.S.party = false; p.S.faceTo = null; p.S.walkTo = null; p.S.walkTok = null; });
    hudClose();
    if (G) { G.cam.override = null; lockYou(false); }
    try { built.chalk(null); } catch (e) { /* */ }
    grades = null;
  }
  function party(on, ids) { (ids || Object.keys(built.people)).forEach(id => { const p = built.people[id]; if (p && !p.S.away && !p.S.callado) p.S.party = on; }); if (on && G.sim.mimo) G.sim.mimo.happy = 2.5; }

  // ---------------------------------------------------------------- chapter 4: el colmado
  const CUSTOMERS = [
    async function maritza() {
      await custIn('maritza'); await speak('maritza', 'dm4.mar.hi');
      if ((await hudSay({ icon: 'dmMaritza', title: 'Maritza’s at the counter. Ask what you can get her!', model: '¿Qué te doy?', modelEn: 'What can I get you?', id: 'ph.quetedoy',
        check: t => (hasW(t, ['que te doy', 'que te despacho']) ? { ok: true } : hasW(t, ['que le doy', 'que le despacho']) ? { ok: true, minor: true, note: 'to a kid, «te» is friendlier' } : { ok: false }) })) === 'quit') return 'quit';
      await speak('maritza', 'dm4.mar.want');
      if ((await phSay('ph.fiao', { icon: 'dmMaritza', title: 'Her mom will pay at the end of the month. Tell her it’s fine: on the tab!', model: '¡Ta to’! Fiao.', modelEn: 'All good! On the tab.' })) === 'quit') return 'quit';
      await speak('maritza', 'dm4.mar.bag');
      if ((await phSay('ph.funda', { icon: 'dmMaritza', title: 'Give her a bag for her things.', model: 'Toma, una funda.', modelEn: 'Here, a bag.' })) === 'quit') return 'quit';
      Sound.play('page'); G.sim.mimo.happy = 1.2;
      await speak('maritza', 'dm4.mar.bye'); await speak('fello', 'dm4.fello.bless');
      think('Dominican kids greet their elders with «¡Bendición!» (bless me!), and the elders answer «¡Dios te bendiga!».', 5.5);
      custOut('maritza');
    },
    async function carmen() {
      await custIn('carmen'); await speak('carmen', 'dm4.car.hi');
      if ((await hudSay({ icon: 'dmCarmen', title: 'Plantains are ten pesos each (it says so on the crate). Tell her the price.', model: 'A diez pesos.', modelEn: 'Ten pesos (each).', check: numCheck(10) })) === 'quit') return 'quit';
      await speak('carmen', 'dm4.car.three');
      if ((await hudSay({ icon: 'dmCarmen', title: 'Three plantains at ten pesos each. How much is that?', model: 'Son treinta pesos.', modelEn: 'That’s thirty pesos.', check: numCheck(30) })) === 'quit') return 'quit';
      await speak('carmen', 'dm4.car.napa');
      if ((await phSay('ph.napa', { icon: 'dmCarmen', title: 'Give her a little something extra, for free: a candy. («Usted»: she’s an elder.)', model: '¡Aquí tiene la ñapa!', modelEn: 'Here’s your little extra!' })) === 'quit') return 'quit';
      Sound.play('review'); G.w3d.fx.sparkle(SPOTS.cust.x, built.fy + 1.2, SPOTS.cust.z, 8);
      await speak('carmen', 'dm4.car.bye');
      custOut('carmen');
    },
    async function tono() {
      await custIn('tono'); await speak('tono', 'dm4.ton.hi');
      if ((await phSay('ph.morir', { icon: 'dmTono', title: 'Offer him the Dominican drink of orange juice and milk.', model: '¿Un morir soñando?', modelEn: 'A morir soñando?' })) === 'quit') return 'quit';
      await speak('tono', 'dm4.ton.yes');
      const M = G.sim.mimo; M.happy = 2; G.w3d.fx.sparkle(SPOTS.window.x, built.fy + 1.3, SPOTS.window.z, 14);
      think('{mimo} pours the orange juice slowly into the cold milk, with ice and sugar… stirring, so it doesn’t curdle!', 4.5);
      await wait(1.6);
      await speak('tono', 'dm4.ton.rico');
      if ((await hudSay({ icon: 'dmTono', title: 'A morir soñando is fifty pesos. Tell him.', model: 'Son cincuenta pesos.', modelEn: 'That’s fifty pesos.', check: numCheck(50) })) === 'quit') return 'quit';
      await speak('tono', 'dm4.ton.bye');
      custOut('tono');
    },
    async function fefa() {
      Sound.play('click'); await wait(0.25); Sound.play('click');
      think('¡Riiing! The colmado’s phone…', 2.5); await wait(1);
      await phone('dm4.fefa');
      if ((await hudSay({ icon: 'dmNena', title: 'Doña Fefa wants an order brought over. Ask her for when.', model: '¿Para cuándo?', modelEn: 'For when?', help: '«para» = for · «cuándo» = when',
        check: t => ({ ok: hasW(t, ['para cuando', 'cuando']) }) })) === 'quit') return 'quit';
      await phone('dm4.fefa2');
      if ((await hudSay({ icon: 'dmYunior', title: 'Send Yunior: tell him to take it to Doña Fefa.', model: '¡Yunior, llévaselo a Doña Fefa!', modelEn: 'Yunior, take it to her, to Doña Fefa!',
        help: '«lleva» + «se» (to her) + «lo» (it): «llévaselo»',
        check: t => (hasW(t, ['llevaselo', 'llevaselos', 'llevale', 'llevaselas']) ? { ok: true } : hasW(t, ['lleva', 'llevalo', 'llevalos']) ? { ok: true, minor: true, note: 'all of it, to her: «llévaselo»' } : { ok: false, why: 'Use «llevar» (to take): «¡Llévaselo!»' }) })) === 'quit') return 'quit';
      await speak('yunior', 'dm4.yun.when');
      if ((await phSay('ph.ahorita', { icon: 'dmYunior', title: 'Doña Fefa said when? Tell Yunior the very word she used.', model: 'Ahorita.', modelEn: 'In a little while.' })) === 'quit') return 'quit';
      await speak('yunior', 'dm4.yun.cafe'); await speak('fello', 'dm4.fello.ahorita');
      await speak('yunior', 'dm4.yun.voy');
      const y = PP('yunior'); built.standAt(y, { x: y.S.x, z: y.S.z }, SPOTS.gate); walkGame(y, [SPOTS.wp2, SPOTS.wp1, SPOTS.gate]).then(ok => { if (ok) built.awayAt(y); });
    },
  ];
  async function chapter4() {
    const d = st(); d.c4s = true; G.save();
    if (!lessonDone(4)) { if (!(await runLesson(4))) return; }
    grades = d.g4 = d.g4 || [];
    try {
      SC.lock = true; lockYou(true);
      if (!d.c4go) {
        shotTable();
        await speak('nena', 'dm4.nena.go'); await speak('fello', 'dm4.fello.laugh');
        if ((await phSay('ph.deunavez', { head: 'El colmado de Doña Nena', icon: 'dmNena', title: 'Tell Doña Nena you’ll do it, right away!', model: '¡De una vez!', modelEn: 'Right away!' })) === 'quit') return;
        hudClose();
        d.c4go = true; G.save();
        await speak('nena', 'dm4.nena.teach');
      }
      if (!lessonDone(5)) { if (!(await runLesson(5))) return; }
      // Doña Nena takes the bus; you take the counter
      const nena = PP('nena');
      if (!d.c4n) { shotTable(); await speak('nena', 'dm4.nena.bye'); await speak('fello', 'dm4.fello.pay'); }
      built.standAt(nena, { x: nena.S.x, z: nena.S.z }, SPOTS.gate); nena.S.wave = 1.4; walkGame(nena, [SPOTS.east, SPOTS.south, SPOTS.gate]).then(ok => { if (ok) built.awayAt(nena); });
      teleport(SPOTS.clerk, SPOTS.cust); shotCounter();
      hudOpen('El colmado de Doña Nena');
      for (let k = d.c4n || 0; k < CUSTOMERS.length; k++) {
        if ((await CUSTOMERS[k]()) === 'quit') { d.c4n = k; G.save(); return; }
        d.c4n = k + 1; G.save();
        await wait(1.2);
      }
      // the Hush comes up the street: the radio dies
      hudClose(); shotYard();
      SC.radioOff = true; SC.hush = 0.55; Sound.play('hit');
      think('The radio crackles… and goes quiet. A gray chill creeps up the street.', 4.5); await wait(2.2);
      await speak('fello', 'dm4.fel.hush'); await speak('chago', 'dm4.chago.hush');
      const yun = PP('yunior'); built.standAt(yun, SPOTS.gate, SPOTS.wp1); await walkGame(yun, [SPOTS.wp1, SPOTS.cust]); yun.S.faceTo = SPOTS.window;
      await speak('yunior', 'dm4.yun.back');
      hudOpen('¡Que no se apague el barrio!');
      if ((await phSay('ph.subele', { icon: 'dmYunior', title: 'New: «¡Súbele!» means “turn it up!” Tell Yunior to turn up the radio!', model: '¡Súbele al radio!', modelEn: 'Turn up the radio!', help: '«súbele» = turn it up · «al radio» = the radio' })) === 'quit') return;
      yun.S.wave = 1; Sound.play('land', 8); SC.radioOff = false; SC.music = 0.3; SC.hush = 0.35;
      d.phScene = d.phScene || {}; d.phScene['ph.subele'] = true; lexStage('ph.subele', 3);
      if ((await phSay('ph.coro', { icon: 'dmFello', title: 'The neighbors stayed home in the gray. Call them out to the party!', model: '¡Vamos pa’l coro!', modelEn: 'Let’s go party!' })) === 'quit') return;
      // the street comes out (and Doña Nena, back from the market, with them)
      const pty = SPOTS.party, W = [SPOTS.wp1, SPOTS.wp2], E = [SPOTS.south, SPOTS.east];
      await Promise.all([['maritza', W], ['carmen', W], ['tono', E], ['nena', E]].map(([id, via], k) => { const p = PP(id); built.standAt(p, SPOTS.gate, via[0]); return wait(k * 0.7).then(() => walkGame(p, via.concat([pty[id]]))).then(ok => { if (ok) p.S.faceTo = SITE.T; }); }));
      if ((await phSay('ph.queloque', { icon: 'dmTono', title: 'Greet the whole street, the Dominican way!', model: '¿Qué lo que?', modelEn: 'What’s up?' })) === 'quit') return;
      hudClose();
      await speak('tono', 'dm4.all.dimelo');
      SC.hush = 0; SC.music = 0.45; party(true); Sound.play('learned'); G.w3d.fx.sparkle(SITE.T.x, built.ty + 1, SITE.T.z, 24);
      await wait(fastNow() ? 0 : 4);
      party(false, ['nena']); nena.S.faceTo = SPOTS.clerk;
      await speak('nena', 'dm4.nena.back'); await speak('nena', 'dm4.nena.pay');
      coins(12, 'Doña Nena pays you for the afternoon');
      d.c4 = true; G.save();
      UI.toast(`Chapter 4 done! Your calls: ${gradeLine(d.g4)}`);
      party(true); await wait(fastNow() ? 0 : 5);
    } finally { endScene(); }
  }

  // ---------------------------------------------------------------- chapter 5: la final del barrio
  function hushSeats() {
    const P = built.people;
    built.standAt(P.fello, SPOTS.anotador, SITE.T); built.standAt(P.nena, SPOTS.spec.nena, SITE.T); built.standAt(P.yunior, SPOTS.spec.yunior, SITE.T);
    built.seatAt(P.chago, 'N');
    ['maritza', 'tono'].forEach(id => built.standAt(P[id], SPOTS.spec[id], SITE.T)); built.benchAt(P.carmen);
  }
  async function callados(arrive) {
    const P = built.people;
    if (arrive) {
      built.standAt(P.nadie, SPOTS.gate, SPOTS.wp1); built.standAt(P.nada, SPOTS.gate, SPOTS.wp1);
      await Promise.all([walkGame(P.nadie, [SPOTS.wp1, SPOTS.wp2, SITE.SEATS.W]).then(ok => { if (ok) built.seatAt(P.nadie, 'W'); }),
        wait(0.8).then(() => walkGame(P.nada, [SPOTS.south, SPOTS.east, SITE.SEATS.E])).then(ok => { if (ok) built.seatAt(P.nada, 'E'); })]);
    } else { built.seatAt(P.nadie, 'W'); built.seatAt(P.nada, 'E'); }
  }
  async function calladosGo(dust) {
    const P = built.people;
    for (const id of ['nadie', 'nada']) {
      const p = P[id];
      if (dust) { G.w3d.fx.sparkle(p.S.x, p.S.gy + 1, p.S.z, 26, ['#9a98a6', '#c9c7d1', '#6d6a78']); G.w3d.fx.puff(p.S.x, p.S.gy + 0.8, p.S.z, 8, 0.4); built.awayAt(p); }
      else { built.standAt(p, { x: p.S.x, z: p.S.z }, SPOTS.gate); walkGame(p, [SPOTS.south, SPOTS.gate]).then(ok => { if (ok) built.awayAt(p); }); }
    }
    if (dust) Sound.play('crack');
  }
  async function chapter5() {
    const d = st(); d.c5s = true; G.save();
    grades = d.g5 = d.g5 || [];
    try {
      SC.lock = true; lockYou(true);
      if (!d.c5intro) {
        shotTable();
        await speak('fello', 'dm5.fello.torneo'); await speak('fello', 'dm5.fello.chago'); await speak('chago', 'dm5.chago.fear');
        if (!lessonDone(6)) { await speak('chago', 'dm5.chago.teach'); if (!(await runLesson(6))) return; }
      }
      // the yard fills up; the Hush's pair comes up the street and sits down without a word
      hushSeats(); teleport(SPOTS.you5, SITE.T); shotTable();
      SC.radioOff = true; SC.hush = 0.42; SC.noAmb = true;
      if (!d.c5intro) {
        think('The radio dies. The flamboyán’s flowers go gray… Two gray figures walk up and sit at the table without a word.', 5);
        await callados(true);
        await speak('fello', 'dm5.fello.who'); await speak('nadie', 'dm5.quiet');
        await speak('yunior', 'dm5.yun.who'); await speak('chago', 'dm5.chago.know'); await speak('chago', 'dm5.chago.truth');
        if ((await phSay('ph.tupuedes', { head: 'La final del barrio', icon: 'dmChago', title: 'Chago is scared. Tell him he can do it!', model: '¡Tú puedes!', modelEn: 'You can do it!' })) === 'quit') return;
        hudClose();
        await speak('chago', 'dm5.chago.ok');
        d.c5intro = true; G.save();
      } else { await callados(false); await speak('fello', 'dm5.fello.back'); }      // (the rematch: they're already sitting there, silent)
      let target = 100, easy = false;
      if ((d.c5losses || 0) >= 2) {
        const t = await UI.choose('Don Fello: «¿A cuánto?» (To how many?)', [{ label: 'A cien (to 100)', sub: 'the real final', value: 100 }, { label: 'A cincuenta (to 50)', sub: 'shorter, and the gray pair plays by feel', value: 50 }]);
        if (!t) { calladosGo(false); return; }
        target = t; easy = t === 50;
      }
      await speak('fello', target === 50 ? 'dm5.fello.rules50' : 'dm5.fello.rules');
      // the final: you and Chago against the silence. Between hands: what you call out pushes the silence back
      const evs = { fear: false, senas: false, nae: false, k: 0 };
      const sync = () => { SC.hush = B.gray * 0.6; SC.music = 0.32 * clamp(1 - B.gray * 1.5, 0, 1); render(); };
      const lift = g => { B.gray = clamp(B.gray - ({ S: 0.12, A: 0.1, B: 0.07, C: 0.05, D: 0.03 }[g] || 0.08), 0, 0.95); sync(); };
      built.chalk({ to: target, us: 'Chago y tú', them: 'Nadie y Nada', a: 0, b: 0 });
      const ask = async (label, check, model, id) => {
        const r = await callBox({ label, placeholder: 'say it in Spanish…', check: t => { const c = check(t); return c.ok ? { v: 'ok', minor: c.minor, note: c.note } : { v: null, why: c.why || '' }; },
          model, hint: 'Tab is your friend… or try the model after two misses.', grade: true, auto: 'ok', phrase: id, buttons: [] });
        if (!r) return;
        const g = r.grade || 'S'; if (grades) grades.push(g); lift(g);
      };
      const res = await runMatch({ opp: 'hush', partner: 'chago', target, easy, gray: 0.35,
        onCall: () => { B.gray = clamp(B.gray - 0.04, 0, 0.95); sync(); },
        afterHand: async (r, M) => {
          built.chalk({ to: M.target, us: 'Chago y tú', them: 'Nadie y Nada', a: M.scores[0], b: M.scores[1] });
          if (r.team === 1) B.gray = clamp(B.gray + 0.16, 0, 0.95); else if (r.team === 0) B.gray = clamp(B.gray - 0.08, 0, 0.95);
          sync();
          if (M.over) return;
          const a = M.scores[0], b = M.scores[1];
          if (!evs.fear) { evs.fear = true; say(2, ['Ay… ¿y si me equivoco?', 'Oh… what if I get it wrong?'], 4); return ask('Chago is nervous. Tell him he can do it!', phOk('ph.tupuedes'), '¡Tú puedes!', 'ph.tupuedes'); }
          if (!evs.senas && M.hands >= 2) { evs.senas = true; say(1, ['……', '(Don Nadie taps the table twice, staring at Doña Nada)'], 4); return ask('Don Nadie is signaling his partner! Call it out!', phOk('ph.senas'), '¡Sin señas!', 'ph.senas'); }
          if (!evs.nae && r.team === 1) { evs.nae = true; say(2, ['¡Diache! Fue mi culpa…', 'Darn! That was my fault…'], 4); return ask('Chago blames himself. Tell him it’s no big deal!', phOk('ph.nae'), 'Na’ e’ na’', 'ph.nae'); }
          if (r.team === 0 && (evs.k++ % 2 === 0)) return ask('Your pair won the hand! Tell Don Fello, the scorekeeper, to write it down.', phOk('ph.anota'), '¡Anota!', 'ph.anota');
          return ask(`Don Fello (keeping score): «¿Cómo vamos?» Call the score: yours first.`, scoreCheck(a, b), `Vamos ${spell(a)} a ${spell(b)}.`);
        } });
      if (res.outcome !== 'win') {
        teleport(SPOTS.you5, SITE.T); shotTable(); SC.hush = 0.3;
        calladosGo(false);
        if (res.outcome === 'lose') d.c5losses = (d.c5losses || 0) + 1;
        G.save();
        await speak('fello', 'dm5.fello.revancha');
        return;
      }
      await finale(res);
    } finally { endScene(); }
  }
  // the win: the gray pair won't go quietly. Your voice, then the whole street's
  async function finale(res) {
    const d = st(), a = res.scores[0], b = res.scores[1];
    teleport(SPOTS.you5, SITE.T); shotTable();
    built.chalk({ to: res.target, us: 'Chago y tú', them: 'Nadie y Nada', a, b });
    await speak('fello', 'dm5.fello.won');
    const P = built.people; ['nadie', 'nada'].forEach(id => built.standAt(P[id], { x: P[id].S.x, z: P[id].S.z }, SITE.T));
    SC.hush = 0.7; SC.music = 0; SC.radioOff = true; Sound.play('hit');
    think('Don Nadie and Doña Nada stand up. The gray swells… the whole street goes quiet. Chago freezes, just like back then.', 5);
    await wait(1.5);
    hudOpen('La final del barrio');
    if (res.pollona && (await phSay('ph.pollona', { icon: 'dmChago', title: 'They never scored a single point! Shout it!', model: '¡Pollona!', modelEn: 'A shutout!' })) === 'quit') return;
    if ((await phSay('ph.tupuedes', { icon: 'dmChago', title: 'Chago freezes, like at the old final. Give him your voice!', model: '¡Tú puedes, Chago!', modelEn: 'You can do it, Chago!' })) === 'quit') return;
    hudClose(); SC.hush = 0.5;
    await speak('chago', 'dm5.chago.call'); await speak('fello', 'dm5.fello.how');
    hudOpen('La final del barrio');
    if ((await hudSay({ icon: 'dmFello', title: 'Call the final score, loud, for the whole barrio: yours first!', model: `¡Ganamos ${spell(a)} a ${spell(b)}!`, modelEn: `We won ${a} to ${b}!`, check: scoreCheck(a, b) })) === 'quit') return;
    SC.hush = 0.35;
    if ((await phSay('ph.subele', { icon: 'dmYunior', title: 'The radio is still quiet. Tell Yunior to turn it up!', model: '¡Súbele al radio!', modelEn: 'Turn up the radio!' })) === 'quit') return;
    SC.radioOff = false; SC.music = 0.3; SC.hush = 0.2; P.yunior.S.wave = 1; Sound.play('land', 8);
    if ((await phSay('ph.coro', { icon: 'dmNena', title: 'Now everybody: to the party!', model: '¡Vamos pa’l coro!', modelEn: 'Let’s go party!' })) === 'quit') return;
    hudClose();
    calladosGo(true); SC.hush = 0; SC.music = 0.45; party(true); Sound.play('learned'); G.w3d.fx.sparkle(SITE.T.x, built.ty + 1.2, SITE.T.z, 30);
    await wait(2.5);
    party(false, ['chago', 'fello']);
    await speak('chago', 'dm5.chago.free');
    await speak('fello', 'dm5.fello.copa');
    G.state.bag = G.state.bag || {}; G.state.bag['k.copa'] = 1; Sound.play('chest');
    await UI.card(`<div class="tag">Key item</div><canvas width="140" height="140"></canvas><div class="big">la copa del barrio</div><div class="sub">The neighborhood’s domino cup, for you, Don Chago and ${esc(mimoName())}. It stays in the colmado’s window. E</div>`, { icon: 'dmCopa' });
    await speak('nena', 'dm5.nena.gracias'); coins(20, 'The barrio thanks you');
    d.c5 = true; G.save();
    UI.toast(`Chapter 5 done! Your calls: ${gradeLine(d.g5)}`);
    await speak('yunior', 'dm5.yun.coro'); party(true); await wait(fastNow() ? 0 : 6);
  }

  async function folkTalk(id) {
    const d = st();
    if (!d.met) return felloTalk();
    const L = { nena: ['dm.nena.idle1', 'dm.nena.idle2'], yunior: ['dm.yunior.idle1', 'dm.yunior.idle2'], maritza: ['dm.mar.idle1', 'dm.mar.idle2'], carmen: ['dm.car.idle1', 'dm.car.idle2'], tono: ['dm.ton.idle1', 'dm.ton.idle2'] }[id];
    d.talkN = d.talkN || {}; const n = d.talkN[id] = (d.talkN[id] || 0) + 1;
    return speak(id, L[n % L.length]);
  }
  // ================================================================ what you can press E on (story.js adds these to its list outside)
  function interactables() {
    if (!G || !built || !shown() || DOMINO_UI.open || SC.lock) return [];
    const Y = G.sim.you;
    if (Math.abs(Y.x - SITE.T.x) > 14 || Math.abs(Y.z - SITE.T.z) > 14) return [];
    const d = st(), P = built.people, gy = built.gy, list = [];
    const add = (x, z, r, label, run, y) => list.push({ x, z, y: y !== undefined ? y : gy(x, z), r, label, run });
    add(P.fello.S.x, P.fello.S.z, 3.0, 'Talk', felloTalk, P.fello.api.y);
    add(P.nena.S.x, P.nena.S.z, 1.45, 'Talk', () => folkTalk('nena'), P.nena.api.y);       // (small: from the empty chair's side, Don Fello is the one you talk to)
    add(P.yunior.S.x, P.yunior.S.z, 1.45, 'Talk', () => folkTalk('yunior'), P.yunior.api.y);
    if (!P.chago.S.walkTo) add(P.chago.S.x, P.chago.S.z, d.healed ? 1.45 : 2.4, 'Talk', chagoTalk, P.chago.api.y);
    for (const id of ['maritza', 'carmen', 'tono']) if (!P[id].S.away && !P[id].S.walkTo) add(P[id].S.x, P[id].S.z, 1.4, 'Talk', () => folkTalk(id), P[id].api.y);
    add(SITE.COUNTER.x, SITE.COUNTER.z, 1.7, 'Look', async () => think(d.c4 ? 'Doña Nena’s {w.colmado}: {w.coffee}, {w.bread}, ice, plantains… and «el radio», playing bachata. You know every word behind this counter now.' : 'Doña Nena’s {w.colmado}: {w.coffee}, {w.bread}, ice, plantains… and «el radio», playing merengue.', 5), built.fy);
    if (d.c5) add(SITE.bw(0.35, SITE.B.d / 2 + 1.3).x, SITE.bw(0.35, SITE.B.d / 2 + 1.3).z, 1.2, 'Look', async () => think('La copa del barrio, in the colmado’s window: «Chago, ' + mimoName() + ' y tú», scratched on its base.', 5), built.fy);
    if ((d.c5s || d.c5) && typeof SIGNS !== 'undefined' && SIGNS.read) { const b = SITE.bw(1.6, SITE.B.d / 2 + 2.6); add(b.x, b.z, 1.3, 'Read', () => SIGNS.read({ tag: 'A banner on the colmado’s roof', lines: [{ text: '¡Gran torneo de dominó!', en: 'The big domino tournament!', look: { edge: '#1f4fa0' } }, { text: 'del barrio · bajo el flamboyán', en: 'the neighborhood’s · under the flamboyán', look: { edge: '#d9493b' } }] })); }
    add(SITE.BOARD.x, SITE.BOARD.z, 1.5, 'Read', rulesCard);
    // the colmado's sign over the window, and the mural on its side wall (signs.js: the words big, a 🔊, the English)
    if (typeof SIGNS !== 'undefined' && SIGNS.read) {
      const s = SITE.bw(-2.4, SITE.B.d / 2 + 2.3), m = SITE.bw(-SITE.B.w / 2 - 2.2, -0.1);
      add(s.x, s.z, 1.5, 'Read', () => SIGNS.read({ tag: 'The sign over the colmado’s window', lines: [{ text: 'Colmado Doña Nena', en: 'Doña Nena’s corner shop', look: { edge: '#d9493b' } },
        { text: 'Café · Pan · Hielo · ¡Dominó!', en: 'coffee · bread · ice · dominoes!', look: { edge: '#d9493b', ink: '#1f6f68' } }] }));
      add(m.x, m.z, 1.4, 'Read', () => SIGNS.read({ tag: 'A mural on the wall', lines: [{ text: '¡Aquí se juega dominó!', en: 'Dominoes are played here!', look: { face: '#3fb8af', edge: '#2b2235', ink: '#fffaf0' } }] }));
    }
    add(SITE.MOTO.x, SITE.MOTO.z, 1.5, 'Look', async () => think('Yunior’s motorbike, with a delivery box on the back. «¡Qué jevi!»', 4));
    return list;
  }

  // ================================================================ the quest (a quests.js LIST entry: Spanish games only)
  function quest() {
    const d = s => s.domino || {}, L = (s, n) => !!(d(s).lessons && d(s).lessons[n]);
    const pos = id => () => { const p = built && built.people[id]; return p ? { x: p.S.x, z: p.S.z } : { x: SITE.T.x, z: SITE.T.z }; };
    // (a step's text says when its chapter opens, until it's open)
    const gated = (n, o) => Object.defineProperty(o, 'text', { get() { return G && chOpen(n) ? o.raw.replace(/ \(after [^)]*\)$/, '') : o.raw; }, enumerable: true });
    return {
      id: 'domino', kind: 'side', title: 'Don Fello’s {w.domino} {w.table}', giver: 'Don Fello, outside Doña Nena’s colmado (west Alba)',
      started: s => s.lang === 'es' && !!d(s).met,
      steps: [
        { text: 'Learn to talk at the {w.table}: Don Fello’s lessons ({n}/2)', n: s => (L(s, 1) ? 1 : 0) + (L(s, 2) ? 1 : 0), word: 'w.domino',
          why: 'Nobody sits at Don Fello’s {w.table} without the right words: the Dominican greetings, and the calls of the game.',
          done: s => L(s, 1) && L(s, 2), target: pos('fello'), hint: '{mimo} points at the old man in the straw hat. Talk to Don Fello for a lesson.' },
        gated(2, { raw: 'Beat Doña Nena and Yunior at {w.domino}, with {mimo} (after the big Hushling on the hill)', word: 'w.tile',
          why: 'You and {mimo} sit across from each other, as partners. The first pair to 100 points wins.',
          done: s => !!d(s).regulars, target: pos('fello'), hint: '{mimo} hops onto the empty {w.chair}. Ask Don Fello for a game!' }),
        { text: 'Learn Don Chago’s words (lesson 3)',
          why: 'Don Fello’s partner of forty years, Don Chago, went quiet after a mistake in a final, and the Hush took his words. Don Fello says: learn Chago’s favourite expressions, and maybe he’ll remember.',
          done: s => L(s, 3), target: pos('fello'), hint: '{mimo} looks at Don Fello. He knows Chago’s words.' },
        gated(3, { raw: 'Help Don Chago find his words (after the first bell)',
          why: 'Don Chago sits alone by the {w.colmado}, gray and silent. Say his own words to him, in Spanish.',
          done: s => !!d(s).healed, target: pos('chago'), hint: '{mimo} tiptoes toward the gray old man on the bench.' }),
        { text: 'Beat Don Fello and Don Chago',
          why: 'The two partners are back together, and they want a real game. If you win, Don Fello gives you his lucky {w.tile}.',
          done: s => !!d(s).won, target: pos('fello'), hint: '{mimo} is already sitting at the {w.table}, ready to play.' },
        gated(4, { raw: 'Mind Doña Nena’s {w.colmado} for an afternoon (after the second bell)',
          why: 'Doña Nena has to take the bus to the market. Learn the colmado’s words, then serve the neighbors: «¿Qué te doy?», «fiao», «la ñapa», «un morir soñando»…',
          done: s => !!d(s).c4, target: pos('nena'), hint: '{mimo} sniffs the air by the {w.colmado}’s window: fresh bread!' }),
        gated(5, { raw: 'La final del barrio: the tournament, with Don Chago as your partner (after the third bell)',
          why: 'The barrio’s first domino tournament since the final Chago lost. Call the score between hands, and keep your partner talking.',
          done: s => !!d(s).c5, target: pos('fello'), hint: '{mimo} stares at the tournament banner on the {w.colmado}’s roof.' }),
      ],
      story: [
        { when: s => !!d(s).met, text: 'On Alba’s west side, under a flamboyán tree, old Don Fello plays {w.domino} outside Doña Nena’s {w.colmado}, with Yunior, the delivery guy. One {w.chair} at the {w.table} is always empty.' },
        { when: s => !!d(s).regulars, text: 'You and {mimo} beat Doña Nena and Yunior. Then Don Fello told you about the empty {w.chair}: his partner Chago made one mistake in a final, people laughed, and he stopped talking. Then the gray came.' },
        { when: s => !!d(s).healed, text: 'You talked to Chago with his own words: «¿Qué lo que?», «¡Capicúa!», «¡Ta to’!», «¡Qué tíguere!». His words came back, and he’s at the {w.table} again, next to his old partner.' },
        { when: s => !!d(s).won, text: 'You beat Don Fello and Don Chago! Don Fello gave you his lucky {w.tile}, the double six, and Doña Nena hung it around {mimo}’s neck. Then everybody went «pa’l coro».' },
        { when: s => !!d(s).c4, text: 'You minded Doña Nena’s {w.colmado} for an afternoon: Maritza bought «fiao», Doña Carmen got her «ñapa», Toño his «morir soñando», and Doña Fefa’s order went out «ahorita». When the Hush killed the radio, «¡Súbele!» and «¡Vamos pa’l coro!» brought the street back, and everybody danced bachata.' },
        { when: s => !!d(s).c5, text: 'La final del barrio: Don Nadie and Doña Nada, the Hush’s silent pair, sat down at the {w.table}. You played with Chago as your partner and called every score out loud. Chago finally told the truth about the old final (he had a capicúa and never called it), and this time he shouted. The gray pair blew away like dust, and the neighborhood cup sits in the {w.colmado}’s window.' },
      ],
    };
  }

  // ================================================================ Mimo's necklace: the lucky tile on a string (shown once it's yours)
  function necklace() {
    if (!G || !G.cast || !G.cast.mimo || !G.cast.mimo.body || G.cast.mimo.body.getObjectByName('dm-necklace')) return;
    const g = new THREE.Group(); g.name = 'dm-necklace';
    // (a ring around the body under the face, its front dipping; the tile hangs from the front, on Mimo's belly)
    const string = new THREE.Mesh(new THREE.TorusGeometry(0.335, 0.009, 5, 32), new THREE.MeshBasicMaterial({ color: '#3a2b26' }));
    string.rotation.x = Math.PI / 2 + 0.22; string.position.set(0, 0.25, 0); g.add(string);
    const face = TK.canvasTex(32, 64, c => {
      c.fillStyle = '#ffd65a'; c.fillRect(0, 0, 32, 64); c.fillStyle = '#8a4b12'; c.fillRect(0, 31, 32, 2);
      [[9, 9], [9, 17], [9, 25], [23, 9], [23, 17], [23, 25]].forEach(([x, y]) => [0, 32].forEach(o => { c.beginPath(); c.arc(x, y + o + 3, 3, 0, TAU); c.fill(); }));
    });
    const tile = TK.part(new THREE.BoxGeometry(0.085, 0.145, 0.026), '#ffd65a', [0, 0.1, 0.305], null, { ink: 0.008, rot: [-0.28, 0, 0] });
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.077, 0.136), new THREE.MeshBasicMaterial({ map: face })); fp.position.set(0, 0, 0.0135); tile.add(fp);
    g.add(tile);
    Object.defineProperty(g, 'visible', { get: () => shown() && !!(G.state.domino && G.state.domino.necklace && !G.state.domino.necklaceOff), set() {}, configurable: true });
    G.cast.mimo.body.add(g);
  }

  // ================================================================ the song: «Bachata del Flamboyán» (dm_bachata), on the colmado's radio
  // A bachata with a funk mambo. 126 bpm, A minor (Am Dm G C F Dm E E7). A: the requinto (the lead guitar) runs sixteenths
  // over the chord, the segunda strums the offbeats, the bongó plays its martillo with the open tones on beat four, the güira
  // scrapes eighths (long on 2 and 4), the bass rocks root, syncopated fifth, root, pickup. B (the mambo): the bongocero takes
  // the bell, the bass turns to slap, a wah guitar chops the offbeats, claps land on the «tap» (beat four), and the requinto
  // plays the hook in parallel thirds, the bachata way. No other song in the game has guitars leading like this.
  (function addSong() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const K = Sound.kit;
    const ROOT = [45, 38, 43, 48, 41, 38, 40, 40], FIFTH = [52, 45, 50, 55, 48, 45, 47, 47];
    const TONES = [[69, 72, 76], [69, 74, 77], [67, 71, 74], [67, 72, 76], [65, 69, 72], [69, 74, 77], [64, 68, 71], [64, 68, 74]];
    const RUN = [[0, 1, 2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1], [2, 1, 0, 1, 2, 3, 2, 1, 0, 1, 2, 1, 0, -1, 0, 1]];
    const HOOK = K.mel('E5/2 E5/2 D5/2 C5/2 D5/4 E5/4 | F5/2 E5/2 D5/2 C5/2 A4/8 | B4/2 C5/2 D5/4 G5/4 F5/2 D5/2 | E5/6 D5/2 C5/4 r/4 | A5/2 G5/2 F5/2 E5/2 F5/4 A5/4 | G5/2 F5/2 E5/2 D5/2 F5/8 | E5/2 D5/2 C5/2 B4/2 G#4/4 B4/4 | E5/4 D5/4 B4/4 G#4/4');
    // the harmony under a hook note: the nearest chord tone at least a minor third below (else a third below)
    const harm = (m, bar) => { let best = -99; for (const x of TONES[bar]) for (const o of [-24, -12, 0, 12]) { const c = x + o; if (m - c >= 3 && c > best) best = c; } return m - best <= 5 ? best : m - 3; };
    Sound.addSong('dm_bachata', { bpm: 126, len: 256, swing: 0.06, vol: 0.34, verb: 0.14, echo: 0.12, echoSteps: 3, play(i, t, s16) {
      const bar = (i >> 4) & 7, s = i & 15, Bm = i >= 128, T = TONES[bar], R = ROOT[bar], nR = ROOT[(bar + 1) & 7];
      if (!(s & 1)) K.scrape(t, s16 * (s === 4 || s === 12 ? 1.7 : 0.7), s === 4 || s === 12 ? 0.85 : 0.45, 4200, 60);
      if (!Bm) { if (!(s & 1)) K.conga(t, s === 12 || s === 14 ? 'hi' : s === 0 ? 'slap' : 'mute', s >= 12 ? 0.75 : 0.45); }
      else if (!(s & 3)) K.cowbell(t, s === 0 ? 0.7 : 0.5, s === 8);
      if (s === 0 || s === 8) K.kick(t, Bm ? 0.7 : 0.5);
      if (Bm && s === 12) K.claps(t, 0.55);
      if (!Bm) {
        if (s === 0) K.roundbass(R, t, s16 * 3, 1); else if (s === 6) K.roundbass(FIFTH[bar] - 12, t, s16 * 2, 0.8);
        else if (s === 8) K.roundbass(R, t, s16 * 3, 0.9); else if (s === 14) K.roundbass(nR + (nR > R ? -1 : 1), t, s16 * 1.5, 0.7);
      } else { const SL = { 0: [R, 1], 3: [R + 12, 0.6], 6: [FIFTH[bar] - 12, 0.85], 8: [R, 0.9], 10: [R + 12, 0.55], 11: [R + 10, 0.5], 14: [nR + (nR > R ? -1 : 1), 0.75] }[s]; if (SL) K.slap(SL[0], t, SL[1]); }
      if (s === 2 || s === 6 || s === 10 || s === 14) { if (!Bm) K.strum(T.map(m => m - 12), t, 0.35, s16 * 1.2, 1.2, !!(s & 4)); else K.wahgtr(T.map(m => m - 12), t, 0.7, s16 * 1.3); }
      if (!Bm) { const k = RUN[bar & 1][s], m = k < 0 ? T[0] - 5 : k === 3 ? T[0] + 12 : T[k]; K.string(m, t, s % 4 === 0 ? 0.8 : 0.55, s16 * 1.4, 1.7); }
      else { const n = HOOK[i - 128]; if (n) { K.string(n[0], t, 0.85, n[1] * s16 * 1.1, 1.6); K.string(harm(n[0], bar), t + 0.006, 0.6, n[1] * s16 * 1.1, 1.4); } }
      if (Bm && bar === 7 && s === 0) K.vox(64, t, s16 * 8, 0.5, 'o', 'a');
      if (i === 0 || i === 128) K.crash(t, 0.5);
    } });
  })();

  // ================================================================ start
  function init(game) {
    G = game;
    registerLang(); registerLines(); registerIcons();
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'domino')) QUESTS.LIST.push(quest());
    try { necklace(); } catch (e) { console.warn('[domino] necklace', e); }
  }
  // (at load: the words, phrases, lines and pictures exist before any scene)
  try { registerLang(); registerLines(); registerIcons(); } catch (e) { console.warn('[domino] register', e); }
  let farT = 0;
  const tickFar = dt => { if ((farT -= dt) <= 0) { farT = 30; keepLexDuesFar(); } };

  return {
    init, build, interactables, quest,
    enabled: () => shown(),
    get busy() { return DOMINO_UI.open; },
    keepClear, bareAt, site: SITE, rules: RULES,
    // tests and tools
    _: {
      TILE, TA, TB, PIP, DBL, tid, D66, newHand, newMatch, startHand, endHand, deal, legal, play, pass, result, snake, cloneLite,
      policyMove, pimc, heurScore, expectedPips, simMatch, simMany, selfTest, CFG, WEIGHTS,
      PHRASES, PHR, LESSONS, USE, LT, BANTER, saysPhrase, lineOf, normKey,
      B, LES, runMatch, runLesson, lessonFlow, meetScene, felloTalk, chagoTalk, chairStory, winScene, playFlow, folkTalk, greetReview, duePhrases, phSt, phReview,
      render, callSubmit, pickTile, chooseSide, showHint, openPause, forfeitNow, tickFar, keepLexDuesFar,
      // the chapters (2026-11-13)
      CHS, chDone, chStarted, chOpen, chStep, chapter4, chapter5, finale, friendlyGame, numbersIn, spell, numCheck, scoreCheck, SC, SPOTS, HANG, placeDefault, walkPath, endScene, TEACHER,
      get ui() { return ui; }, get built() { return built; }, get G() { return G; }, st: () => st(), UIstate: DOMINO_UI, ensureUI,
    },
  };
})();
