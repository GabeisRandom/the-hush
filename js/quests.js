'use strict';
// Quests (DESIGN.md 12.4): the main story and the side quests, as data. A step is done when its
// test passes on the game state, so saves need nothing extra. The tracked quest drives the goal
// line, the compass and Mimo's hints (Q). A new side quest is just a new entry in LIST.
// Texts are English with weave slots ({w.key}, {c.key}), {mimo} for Mimo's name and {n} for a count.
// DESIGN.md 16 (playtest 4): the main quest is the focus, always.
//   - tracked() is the main quest unless the player picked a side quest in the quest log (track(id, 'user')); a module asking
//     for its own side quest (track(id)) is ignored, and a save whose side quest took focus by itself goes back to the main one.
//   - The HUD tracker always says MAIN (gold) or SIDE (blue); with a side quest tracked, the main quest's next step stays in a
//     smaller line under it. The compass and the mini-map follow the tracked quest, plus the main quest's goal.
//   - Every main task ends with a "Task complete" stamp and a chime; a step with report: '<who>' is "Report to <who>": the
//     compass points at them, and talking to them (QUESTS.reportDue(who)) plays a short scene that says what's next. A report
//     step that a save has already gone past (a later step is done) is skipped.

const QUESTS = (() => {
  let G = null;
  const S = () => G.state;
  const npcAt = id => { const n = G.sim.npc(id); return n ? { x: n.x, z: n.z } : null; };
  const personAt = id => { const p = G.molinar && G.molinar.people && G.molinar.people.find(q => q.id === id); return p ? { x: p.x, z: p.z } : null; };   // Molinar's people (molinar.js)
  const lakeAt = id => { const p = G.lake && G.lake.people && G.lake.people.find(q => q.id === id); return p ? { x: p.x, z: p.z } : null; };        // Remanso's (lake.js)
  // the nearest villager in Remanso you can «Ask» (before anyone has told you where Marina is)
  const askerNear = () => { const Y = G.sim.you, L = (G.lake && G.lake.people || []).filter(p => p.answers && !p.hushed && !p.story && p.x); return L.length ? nearest(L.map(p => ({ x: p.x, z: p.z })), Y.x, Y.z) : null; };
  const nearest = (list, x, z) => list.reduce((b, p) => (!b || Math.hypot(p.x - x, p.z - z) < Math.hypot(b.x - x, b.z - z) ? p : b), null);
  const picked = s => (s.pickedRing || []).length + (s.picked || []).length;     // s.picked: old saves
  const cleared = s => (s.cleared || []).length;
  const RING = { x: 30, z: 36 };
  // the «where is…?» questions as you'd ask them in the save's language (zh / ja: CJK.md's notation, shown in the mode)
  const ASKQ = { marina: { es: '¿Dónde está Marina?', pt: 'Onde está a Marina?', de: 'Wo ist Marina?', zh: '[玛丽娜|Mǎ lì nà] [在|zài] [哪里|nǎ lǐ] ？', ja: 'マリーナ さん は どこ です か ？' },
    oar: { es: '¿Dónde está el remo?', pt: 'Onde está o remo?', de: 'Wo ist das Ruder?', zh: '[船桨|chuán jiǎng] [在|zài] [哪里|nǎ lǐ] ？', ja: 'オール は どこ です か ？' } };
  const askQ = k => { const l = (G && G.state && G.state.lang) || 'es', q = ASKQ[k][l] || ASKQ[k].es; return (l === 'zh' || l === 'ja') && typeof CJK !== 'undefined' ? CJK.plain(q, { lang: l }) : q; };

  const LIST = [
    { id: 'main', kind: 'main', title: 'Find Noa',
      started: s => !!s.flags.hatched,
      steps: [
        { text: 'Follow the path {c.north}, through the {c.forest}',
          why: 'You came to visit Noa, with a surprise for her: an egg. Her last {w.letter} was half erased, and she wasn’t at the station to meet you. Her {c.village} is past the {c.forest}.',
          done: s => !!(s.flags.guide || s.flags.rosa),
          target: () => { const Y = G.sim.you, p = WORLD.L.path.find(([, z]) => z < Y.z - 7); return p ? { x: p[0], z: p[1] } : WORLD.L.gate; },
          hint: '{mimo} hops up the path. Noa’s {c.village} is {c.north}, past the trees.' },
        { text: 'Follow Bruno to Alba',
          why: 'Bruno, from Alba, found you on the road. Hushlings have made it dangerous, so he’s walking you to town.',
          done: s => !!(s.flags.escorted || s.flags.rosa), target: () => npcAt('bruno'),
          hint: '{mimo} points up the road at Bruno. Stay close to him!' },
        { text: 'Ask Rosa, at the fruit stall, about Noa',
          why: 'Bruno said Rosa, at the fruit stall, knows everyone in Alba. She’s Noa’s neighbor.',
          done: s => !!s.flags.rosa, target: () => npcAt('rosa'),
          hint: '{mimo} points at a woman by a fruit stall. That must be Rosa!' },
        { text: 'Train with Bruno by the bell tower',
          why: 'Noa went to the old {w.tower} in the {c.north}, where the {c.silence} began. Bruno can make {mimo} strong enough for the way there.',
          done: s => (s.flags.lessons || 0) >= 2, target: () => npcAt('bruno'), word: 'w.tower',
          hint: '{mimo} points at the bell tower. Bruno should be there.' },
        { text: 'Chase 3 groups of Hushlings out of the {c.field} east of Alba ({n}/3)', n: s => Math.min(3, cleared(s)),
          why: 'They carry the Hush toward Alba, and the road {c.north} runs past them. Words scare them off. Walk up to a group in the {c.field} and fight it: every group you beat out there counts.',
          done: s => cleared(s) >= 3,
          target: () => { const s = S(), Y = G.sim.you; return nearest(WORLD.L.fieldGroups.map((g, i) => ({ x: g.x, z: g.z, i })).filter(g => !(s.cleared || []).includes(g.i)), Y.x, Y.z); },
          hint: '{mimo}’s ears go flat. Hushlings, out in the {c.field} to the east.' },
        { report: 'bruno', text: '💬 Report to Bruno at Alba’s east gate',
          why: 'The {c.field} is free! Bruno came out to the east gate to watch. Tell him how it went: he knows what comes next.',
          done: s => !!(s.flags.rep_field || s.flags.boss), target: () => npcAt('bruno'),
          hint: '{mimo} points back toward Alba’s east gate. Bruno is waiting there!' },
        { text: 'Beat the big Hushling on the {c.hill}, north-east of the {c.field}',
          why: 'A big Hushling sits on the road {c.north}, in a patch of gray. The way to the {w.tower} goes right past it. Bruno will come and help.',
          done: s => !!s.flags.boss, target: () => WORLD.L.boss,
          hint: '{mimo} stares at the gray {c.hill}. The big one is up there.' },
        // Chapter 1: the eight bells (DESIGN.md 14.1–14.2)
        { get text() { const f = G && G.state && G.state.flags; return f && !f.boulder && f.farmerSeen ? 'Go east to Molinar: get the big rock out of the pass' : 'Go east to Molinar, the town of mills'; },
          why: 'The old {w.tower}’s door is shut. Bruno says the clockmaker in Molinar knows why, and Noa went to see him too. On the way, a huge rock blocks the pass through the hills: watch the farmer pushing her cart.',
          done: s => !!s.flags.molinar,
          target: () => { const s = S(), Y = G.sim.you; if (!s.flags.boulder && Y.x < WORLD.L.boulder.x - 3) return Y.x < 40 ? WORLD.L.eastGate : WORLD.L.boulder; return WORLD.L.molinarGate; },
          hint: '{mimo} points down the road to the east, past the windmills.' },
        { text: 'Find the clockmaker in Molinar',
          why: 'He knows about the old {w.tower}, and Noa came to see him.',
          done: s => !!s.flags.ciro, target: () => personAt('ciro') || WORLD.L.molinar,
          hint: '{mimo} points at a shop with a big clock on its sign.' },
        { text: 'Free the Great Mill, and ring Molinar’s bell',
          why: 'Eight bells used to answer the great clock in the old {w.tower}. The Hush silenced them, and the tower’s door shut. Molinar’s bell hangs at the top of the Great Mill, and the mill is full of Hushlings.',
          done: s => !!s.flags.millFree,
          target: () => (typeof MILL !== 'undefined' && MILL.inside && MILL.target()) || (G.molinar && G.molinar.landmarks && (G.molinar.landmarks.millDoor || G.molinar.landmarks.mill)) || { x: 240, z: -170 },
          hint: '{mimo} looks up. The bell is at the very top of the mill.' },
        { report: 'ciro', text: '💬 Report to Ciro the clockmaker in Molinar',
          why: 'Molinar’s bell rings again! Ciro will want to hear it from you, and he knows where the next {w.bell} is.',
          done: s => !!s.flags.ciroBell, target: () => personAt('ciro') || WORLD.L.molinar,
          hint: '{mimo} points at the shop with the big clock on its sign. Ciro!' },
        // Region 2: the Mirror Lake (DESIGN.md 14.5)
        { text: 'Go west to the Mirror Lake ({n}/8 bells rung)', n: s => s.flags.bells || 0,
          why: 'With all eight bells ringing, the old {w.tower}’s door will open. Ciro says the next bell is at the Mirror Lake, west of Alba, where it floats on the {w.water}.',
          done: s => !!s.flags.remanso,
          target: () => {
            const s = S(), Y = G.sim.you, C = WORLD.L.crossing, K = typeof LAKE !== 'undefined' && LAKE.landmarks, dock = (K && K.riverDockEast) || C.east;
            if (Y.x > C.x + 1 && !s.flags.raftWest) return Y.x > -50 ? { x: -53, z: -150 } : dock; return { x: -146, z: -151 };
          },
          hint: '{mimo} points west, past Alba’s west gate. There’s a river on the way.' },
        { get text() { const f = S().flags; return f.marina ? 'Find Marina in Remanso' : f.askedMarina ? 'Find Marina in Remanso: now you know where she is' : `Find Marina in Remanso. Ask a villager where she is: «${askQ('marina')}»`; },
          why: 'Marina is the head of Remanso: she knows everything about the lake and its bell. But nobody said where she lives, so ask someone (they have «Ask» over them).',
          done: s => !!s.flags.marina, target: () => (S().flags.askedMarina ? lakeAt('marina') : askerNear()),
          hint: '{mimo} shrugs. It has no idea where she is. Ask a villager!' },
        // Region 2, milestone 2 (isle.js): Bartolo's words, the ferry, the old lighthouse, the second bell
        { text: 'Help Bartolo: find his things, and tell him where they are ({n}/3)', n: s => ['oar', 'lantern', 'rope'].filter(id => s.lakeQ && s.lakeQ.told && s.lakeQ.told[id]).length,
          why: 'The lake’s bell floats by the island, and only Bartolo rows there. But the Hush took his words, and his {w.oar}, his {w.lantern} and his {w.rope} are lost somewhere in Remanso. He can only point. Find them, or ask someone where they are, then tell him in a sentence: each right one gives him a word back.',
          done: s => !!s.flags.bartolo, target: () => (typeof ISLE !== 'undefined' ? ISLE.quest.bartolo() : lakeAt('bartolo')),
          get hint() { return `{mimo} sniffs the air… Bartolo’s things must be near the water. Or ask someone: «${askQ('oar')}»`; } },
        { text: 'Take Bartolo’s ferry to the {w.island}',
          why: 'Bartolo can talk again, and his ferry is ready. The lake’s {w.bell} floats beside the {w.island}, by the old lighthouse.',
          done: s => !!s.flags.isleLanded, target: () => (typeof ISLE !== 'undefined' ? ISLE.quest.ferry() : lakeAt('bartolo')),
          hint: '{mimo} hops up and down by the ferry. All aboard!' },
        { text: 'Climb the old lighthouse, and light its lamp',
          why: 'The lighthouse has been dark since the Hush came. From the top, its light reaches the whole lake… and the {w.bell}.',
          done: s => !!(s.isle && s.isle.lamp), target: () => (typeof ISLE !== 'undefined' ? ISLE.quest.lighthouse() : null),
          hint: '{mimo} looks up at the dark lighthouse. The way is up!' },
        { text: 'Ring the lake’s {w.bell}',
          why: 'A giant frog sat by the {w.bell}, keeping it silent. Beat it, then make the {w.bell} ring.',
          done: s => !!s.flags.lakeFree, target: () => (typeof ISLE !== 'undefined' ? ISLE.quest.bell() : null),
          hint: '{mimo} stares at the {w.bell} out on the water.' },
        // Region 3 (the next agent's): it waits for flags.quarry, set on arriving at the Quarry Caves
        { text: 'Go north to the Quarry Caves ({n}/8 bells rung)', n: s => s.flags.bells || 0,
          why: 'Noa’s page says she went north, to the {w.mountain:pl} and the quarry. Bartolo says the next {w.bell} is in the Quarry Caves, under the {w.mountain:pl}.',
          done: s => !!s.flags.quarry, target: () => { const Y = G.sim.you; return Y.x < -60 ? { x: -53, z: -150 } : { x: 9, z: -255 }; },
          hint: '{mimo} points north, past Alba and the old quarter.' },
      ],
      story: [
        { when: s => !!s.flags.hatched, text: 'Your pen pal Noa lives in a land up {c.north}. You took the {w.train} to visit her, with a surprise: an egg from the pet shop back home, whose creature learns to talk just by listening. Her last {w.letter} was strange, half its words gone. Noa wasn’t at the last stop, and the egg hatched early: {mimo}.' },
        { when: s => !!s.flags.hushwave, text: 'In the {c.forest}, a gray wave rolled over the trees and the birds went quiet. Something here is swallowing sounds.' },
        { when: s => !!s.flags.guide, text: 'On the road out of the {c.forest}, Bruno from Alba found you. Little gray Hushlings have been creeping onto the road, and words scare them off. He taught {mimo} its first moves and walked you to town.' },
        { when: s => !!s.flags.rosa, text: 'In Alba, Rosa knew Noa’s handwriting. Noa left three weeks ago for the old {w.tower} in the {c.north}, where the {c.silence} began. People here call it the Hush.' },
        { when: s => (s.flags.lessons || 0) >= 2, text: 'Bruno trained {mimo} some more: colors, so it knows which Hushling to go after.' },
        { when: s => cleared(s) >= 3, text: 'The {c.field} east of Alba is free again.' },
        { when: s => !!s.flags.boss, text: 'You beat the big Hushling on the {c.hill}, and the color came back. From the top you could see the old {w.tower}.' },
        { when: s => !!s.flags.ch1, text: 'But the {w.tower}’s door is shut. Bruno sent you east, to the clockmaker in Molinar.' },
        { when: s => !!s.flags.boulder, text: 'In the Windmill Hills, a farmer showed {mimo} a new word, and {mimo} pushed the rock out of the pass.' },
        { when: s => !!s.flags.ciro, text: 'Ciro the clockmaker told you about the eight bells. They used to answer the great clock in the old {w.tower}. The Hush silenced them all, and the tower’s door shut. Ring all eight again, and it will open. Molinar’s bell is in the Great Mill.' },
        { when: s => !!s.flags.millFree, text: 'In the Great Mill, {mimo} pushed sacks and cogs, broke a crate, knocked a latch and stomped a button, then beat the giant armadillo curled under the bell. Noa had been up there too: from the top she saw a light in the old {w.tower}’s window. Someone lives there. Then {mimo} rang the bell, and Molinar’s sails turned again. One bell of eight.' },
        { when: s => !!s.flags.marina, text: 'At the Mirror Lake, Lalo taught {mimo} to swim, and {mimo} pulled you over the Reed River on a raft. In Remanso you had to ask your way to Marina. The second bell floats by the island, but only Bartolo the ferryman can row there, and the Hush took his words.' },
        { when: s => !!s.flags.bartolo, text: 'Bartolo’s {w.oar}, {w.lantern} and {w.rope} were lost around Remanso, and he could only point. Each time you told him where one was, a word came back to him, until he could say it all: “Let’s go to the {w.island}!”' },
        { when: s => !!s.flags.lakeFree, text: 'In the old lighthouse, {mimo} swam across the flooded hall, pulled the right lever, broke the jar with the key and lit the lamp. Its light found a giant frog sitting by the {w.bell}… After the fight, a page from Noa: she went north, to the {w.mountain:pl} and the quarry. Then {mimo} rang the {w.bell}, and the lake’s color came back. Two bells of eight.' },
      ] },
    { id: 'bread', kind: 'side', title: 'Marta’s special {w.bread}', giver: 'Marta, the baker in Alba',
      started: s => !!s.flags.quest,
      steps: [
        { text: 'Pick {c.three} glowing {w.mushroom:pl} at the ring in the {c.forest} ({n}/3)', n: s => Math.min(3, picked(s)),
          why: 'Her special {w.bread} needs the glowing ones. They grow in a ring in the {c.forest}, south of Alba, and they sparkle.',
          done: s => picked(s) >= 3, word: 'w.mushroom',
          target: () => { const s = S(), Y = G.sim.you; if (Math.hypot(Y.x - RING.x, Y.z - RING.z) > 9) return RING; return nearest(WORLD.ring.map((r, i) => ({ x: r.x, z: r.z, i })).filter(r => !(s.pickedRing || []).includes(r.i)), Y.x, Y.z) || RING; },
          hint: '{mimo} sniffs the air… the glowing ring is that way!' },
        { text: 'Bring the {w.mushroom:pl} to Marta in Alba',
          why: 'She’s waiting at her bakery.',
          done: s => s.flags.quest === 'done', target: () => npcAt('baker'), word: 'w.bread',
          hint: '{mimo} licks its lips. Back to Marta’s bakery!' },
      ] },
  ];

  const byId = id => LIST.find(q => q.id === id);
  // the step you're on: the first one not done. A "Report to…" step that a save has gone past (a later step is done) is skipped.
  function current(q) {
    const s = S(), steps = q.steps;
    let last = -1;
    for (let i = steps.length - 1; i >= 0; i--) if (!steps[i].report && steps[i].done(s)) { last = i; break; }
    for (let i = 0; i < steps.length; i++) { const st = steps[i]; if (st.report && i < last) continue; if (!st.done(s)) return st; }
    return null;
  }
  const stepAt = q => { const st = current(q); return st ? q.steps.indexOf(st) : q.steps.length; };
  const active = () => LIST.filter(q => q.started(S()) && current(q));
  const fill = (text, st) => text.replace(/\{n\}/g, st && st.n ? st.n(S()) : '');
  const plain = t => UI.weavePlain(t).replace(/\s*\(\d+\/\d+[^)]*\)/, '').replace(/^💬\s*/, '');
  const keyOf = a => esc(((typeof KEYS !== 'undefined' && KEYS.map[a]) || []).map(c => KEYS.name(c))[0] || '—');
  const mainQ = () => { const m = byId('main'); return m && G && m.started(S()) && current(m) ? m : null; };
  // what the HUD, the compass, the mini-map and Q follow: the main quest, unless you picked a side quest in the quest log
  function tracked() {
    const s = S();
    if (s.track && s.track !== 'main' && s.trackUser === s.track) { const q = byId(s.track); if (q && q.started(s) && current(q)) return q; }
    return mainQ();
  }
  // track(id, 'user') is the quest log's Track button. A module asking for its own side quest (no 'user') is ignored: side
  // quests never take focus by themselves (DESIGN.md 16). track('main') always works.
  function track(id, how) {
    const s = S(), q = byId(id);
    if (!q || q.kind === 'main') { s.track = 'main'; s.trackUser = null; return true; }
    if (how !== 'user') return false;
    s.track = id; s.trackUser = id; return true;
  }
  // The goal line: [html, kind]. A MAIN / SIDE tag and the quest's name, then the step. Under a side quest, the main quest's
  // next step in a smaller line, so the story is never out of sight.
  function objective() {
    const q = tracked(), st = q && current(q);
    if (!st) return ['', 'main'];
    const side = q.kind !== 'main', m = side ? mainQ() : null, ms = m && current(m);
    let h = `<span class="qhead"><span class="qtag">${side ? '◆ SIDE' : '★ MAIN'}</span><span class="qname">${UI.weave(q.title)}</span></span><span class="qstep">${UI.weave(fill(st.text, st))}</span>`;
    if (ms) h += `<span class="qmain"><b>★ MAIN</b> ${UI.weave(fill(ms.text, ms))}</span>`;
    return [h, side ? 'side' : 'main'];
  }
  function target() { const q = tracked(), st = q && current(q); return st && st.target ? st.target() : null; }
  // Compass and mini-map markers: the tracked goal first, then the main quest's (when a side quest is tracked). Other side
  // quests don't put pins on the map: they wait in the quest log.
  function marks() {
    const t = tracked(), m = mainQ(), out = [];
    const add = (q, isT) => { const st = q && current(q), p = st && st.target && st.target(); if (p && isFinite(p.x) && isFinite(p.z)) out.push({ x: p.x, z: p.z, kind: q.kind === 'main' ? 'main' : 'side', tracked: isT }); };
    add(t, true); if (m && m !== t) add(m, false);
    return out;
  }
  function hint() { const q = tracked(), st = q && current(q); return st ? st.hint || '' : ''; }
  function word() { const q = tracked(), st = q && current(q); return st ? st.word || null : null; }
  // the main quest's current step, when it's "Report to <who>" (the people's Talk runs the report scene then)
  function reportDue(who) { const m = mainQ(), st = m && current(m); return st && st.report === who ? st : null; }

  // ------------------------------------------------------------ the HUD's moments: the "Task complete" stamp and the tips
  let quiet = true, tipT = 0, pendingSide = null, stampOn = false;
  const stampQ = [];
  const el = (id, cls) => { let e = document.getElementById(id); if (!e) { e = document.createElement('div'); e.id = id; if (cls) e.className = cls; document.body.appendChild(e); } return e; };
  // a main task done: a rubber stamp in the middle of the screen, a chime, and what's next (after any chapter card or fade)
  function stamps() {
    if (!stampQ.length || stampOn) return;
    const ch = document.getElementById('chapter'), fd = document.getElementById('fade');
    if ((ch && ch.classList.contains('on')) || (fd && +(fd.style.opacity || 0) > 0.05)) return;
    const it = stampQ.shift(), m = mainQ(), st = m && current(m), e = el('qstamp');
    e.innerHTML = `<div class="st">✓ TASK COMPLETE</div><div class="tx">${esc(it.text)}</div>` + (st ? `<div class="nx"><b>Next</b> ${UI.weave(fill(st.text, st))}</div>` : '');
    e.classList.remove('on', 'out'); void e.offsetWidth; e.classList.add('on');
    stampOn = true;
    if (typeof Sound !== 'undefined') { Sound.play('chest'); setTimeout(() => Sound.play('chime'), 420); }
    setTimeout(() => e.classList.add('out'), 3400);
    setTimeout(() => { e.classList.remove('on', 'out'); stampOn = false; }, 3900);
  }
  // (it hangs just under the tracker, whatever the tracker's height: placed again every look while it's up)
  function placeTip() { const e = document.getElementById('qtip'), o = document.getElementById('objective'); if (!e || !o) return; const r = o.getBoundingClientRect(); e.style.top = ((o.classList.contains('on') && r.bottom > 0 ? r.bottom : 96) + 12) + 'px'; }
  function showTip(html, sec) { const e = el('qtip'); e.innerHTML = html + '<small>(it goes away by itself)</small>'; e.classList.add('on'); tipT = sec; placeTip(); }
  function hideTip() { const e = document.getElementById('qtip'); if (e) e.classList.remove('on'); tipT = 0; }
  // The first time quests matter (the main quest has begun and nothing else is going on): what the tracker is, and the keys.
  // The first side quest: they're optional, and they wait in the quest log.
  function tips() {
    const s = S(), f = s.flags;
    if (tipT > 0) { placeTip(); tipT -= 0.25; if (tipT <= 0 || (G && G.journalOpen)) hideTip(); return; }
    if ((typeof STORY !== 'undefined' && (STORY.busy || STORY.line)) || s.teaching || (G && G.journalOpen)) return;
    const J = keyOf('journal'), Q = keyOf('look');
    if (!f.tipQuests && mainQ()) {
      f.tipQuests = true;
      showTip(`<b>This is your quest tracker.</b> <span class="t-main">★ MAIN</span> is the story, always shown here. <span class="t-side">◆ SIDE</span> quests are extras you can pick. <kbd>${J}</kbd> opens the quest log · <kbd>${Q}</kbd>: ${esc(s.mimoName || 'Mimo')} shows the way.`, 16);
      return;
    }
    if (f.tipQuests && !f.tipSide && pendingSide) {
      f.tipSide = true; const q = pendingSide; pendingSide = null;
      showTip(`<b><span class="t-side">◆ New side quest:</span> ${esc(plain(q.title))}.</b> Side quests are optional. They wait in the quest log (<kbd>${J}</kbd>): track one there to follow it. Your main quest stays in the corner.`, 13);
    }
  }
  function sideStarted(q) {
    UI.toast(`◆ New side quest: ${plain(q.title)} (in the quest log)`);
    if (!S().flags.tipSide) pendingSide = q;
  }
  // Toasts and stamps when a quest starts, a step is done, or a quest is complete. Runs a few times a second (main.js).
  function tick() {
    const s = S(), first = !s.qlog || quiet;
    quiet = false;                                              // (the first look after loading: catch up quietly)
    s.qlog = s.qlog || {};
    if (s.track && s.track !== 'main' && s.trackUser !== s.track) { s.track = 'main'; s.trackUser = null; }     // (a side quest that took focus by itself, in an older save)
    for (const q of LIST) {
      if (!q.started(s)) continue;
      const at = stepAt(q), was = s.qlog[q.id];
      if (was === at) continue;
      s.qlog[q.id] = at;
      if (first) continue;
      if (was === undefined) { if (q.kind === 'main') UI.toast(`New quest: ${plain(q.title)}`); else sideStarted(q); continue; }
      if (at < was) continue;                                    // (an older save's steps moved: nothing to celebrate)
      const fin = q.steps.slice(was, at).filter(st => st.done(s));     // (a skipped "Report to…" isn't done)
      if (q.kind === 'main') {
        for (const st of fin) if (st.report) UI.toast(`✓ ${plain(fill(st.text, st))}`);
        const big = fin.filter(st => !st.report);
        if (big.length) stampQ.push({ text: plain(fill(big[big.length - 1].text, big[big.length - 1])) });
      } else for (const st of fin) UI.toast(`◆ ✓ ${plain(fill(st.text, st))}`);
      if (at >= q.steps.length) { UI.toast(`${q.kind === 'main' ? 'Quest' : 'Side quest'} complete: ${plain(q.title)}`); if (s.track === q.id) track('main'); }
    }
    stamps(); tips();
  }
  // ------------------------------------------------------------ the quest log (the journal's Quests tab)
  // The main quest first, then the side quests grouped by where they are, then what's complete.
  const PLACES = [['Molinar', /Molinar/i], ['Remanso and the lake', /Remanso|\blake\b/i], ['Alba', /Alba|plaza|bell tower|duck pond|corner store|colmado|bakery|corn maze|gravekeeper|black cat/i]];
  const placeOf = q => { const t = `${q.giver || ''} ${q.title || ''}`; for (const [name, re] of PLACES) if (re.test(t)) return name; return 'Around the world'; };
  function card(q, t) {
    const s = S(), st = current(q), isT = q === t, side = q.kind !== 'main';
    let h = `<div class="quest ${side ? 'side' : 'main'} ${st ? '' : 'complete'} ${isT ? 'tracked' : ''}"><div class="qhead"><span class="qkind">${side ? '◆ Side quest' : '★ Main quest'}</span><b>${UI.weave(q.title)}</b>`;
    if (st) h += isT ? `<span class="qon">Tracking ✓</span>${side ? '<button data-track="main" class="qback">Back to the main quest</button>' : ''}` : `<button data-track="${q.id}">${side ? 'Track' : 'Track the main quest'}</button>`;
    else h += '<span class="qdone">Complete!</span>';
    h += '</div>';
    if (q.giver) h += `<div class="qgiver">From ${esc(q.giver)}</div>`;
    if (st) h += `<div class="qnow">${side ? '◆' : '★'} ${UI.weave(fill(st.text, st))}</div><div class="qwhy">${UI.weave(st.why || '')}</div>`;
    const done = q.steps.filter(x => x.done(s));          // (a skipped "Report to…" isn't done: it isn't listed)
    const shown = side ? done : done.slice(-6);
    if (shown.length) h += '<ul class="qsteps">' + (done.length > shown.length ? `<li class="more">… and ${done.length - shown.length} earlier steps</li>` : '') + shown.map(x => `<li>✓ ${UI.weave(fill(x.text, x)).replace(/\s*\(\d+\/\d+\)/, '')}</li>`).join('') + '</ul>';
    const story = (q.story || []).filter(p => p.when(s));
    if (story.length) h += `<div class="qstory"><h4>The story so far</h4>${story.map(p => `<p>${UI.weave(p.text)}</p>`).join('')}</div>`;
    return h + '</div>';
  }
  function html() {
    const s = S(), t = tracked(), main = byId('main'), started = LIST.filter(q => q.started(s));
    const sides = started.filter(q => q.kind !== 'main' && current(q)).sort((a, b) => (b === t) - (a === t)), done = started.filter(q => !current(q));
    let h = '';
    if (main && main.started(s) && current(main)) h += '<h3 class="qsec main">★ Main quest <small>the story · always in the corner of the screen</small></h3>' + card(main, t);
    h += `<h3 class="qsec side">◆ Side quests <small>optional · ${sides.length}</small></h3>`;
    if (sides.length) {
      h += '<p class="qnote">Press <b>Track</b> to follow one on the compass and the map. Your main quest stays in the corner, in a smaller line.</p>';
      const groups = {}; for (const q of sides) (groups[placeOf(q)] = groups[placeOf(q)] || []).push(q);
      for (const name of ['Alba', 'Molinar', 'Remanso and the lake', 'Around the world']) if (groups[name]) h += `<h4 class="qgroup">${esc(name)}</h4>` + groups[name].map(q => card(q, t)).join('');
    } else h += '<p class="empty">None yet. People you meet will ask for help, and their side quests wait here.</p>';
    if (done.length) h += `<h3 class="qsec done">✓ Complete <small>${done.length}</small></h3>` + done.map(q => `<div class="qdone-row">✓ ${q.kind === 'main' ? '★' : '◆'} ${UI.weave(q.title)}</div>`).join('');
    return h || '<p class="empty">No quests yet.</p>';
  }
  // the look of it all (the tracker, the stamp, the tips, the log): gold for main, blue for side
  if (typeof document !== 'undefined' && !document.getElementById('quests-css')) {
    const st = document.createElement('style'); st.id = 'quests-css';
    st.textContent = `
#objective { padding: 7px 12px 8px 13px; border-left: 5px solid #e6a92e; max-width: 400px; }
#objective.side { border-left-color: #3b7ddd; }
#objective::before, #objective.side::before { content: none; }
#objective .qhead { display: flex; align-items: center; gap: 7px; margin-bottom: 2px; }
#objective .qtag { font: 800 10.5px "Segoe UI", sans-serif; letter-spacing: .09em; padding: 1px 8px; border-radius: 99px; color: #fff; background: #d6981e; white-space: nowrap; }
#objective.side .qtag { background: #3b7ddd; }
#objective .qname { font-size: 11.5px; font-weight: 700; opacity: .62; }
#objective .qstep { display: block; font-size: 14.5px; line-height: 1.3; }
#objective .qmain { display: block; margin-top: 5px; padding-top: 4px; border-top: 1.5px dashed rgba(43,34,53,.18); font-size: 11.5px; font-weight: 700; color: #8a5d0c; }
#objective .qmain b { font-size: 9.5px; letter-spacing: .08em; color: #fff; background: #d6981e; border-radius: 99px; padding: 0 6px; margin-right: 3px; }
#compass .m.side { color: #3b7ddd; }
#qstamp { position: fixed; left: 50%; top: 31%; transform: translate(-50%, -50%); z-index: 14; pointer-events: none; text-align: center; display: none; width: min(560px, 92vw); }
#qstamp.on { display: block; }
#qstamp.out { opacity: 0; transition: opacity .45s; }
#qstamp .st { display: inline-block; font: 900 30px Bahnschrift, "Segoe UI", sans-serif; letter-spacing: .07em; color: #b97c0a; border: 4px solid #c98a10; border-radius: 12px; padding: 4px 18px; background: rgba(255,250,240,.96); transform: rotate(-4deg); box-shadow: 0 4px 0 rgba(43,34,53,.22); animation: qstamp .42s cubic-bezier(.2,1.7,.4,1); }
#qstamp .tx { margin-top: 12px; font-weight: 800; font-size: 16px; background: rgba(43,34,53,.86); color: #fffaf0; padding: 6px 16px; border-radius: 99px; display: inline-block; }
#qstamp .nx { margin-top: 7px; font-weight: 700; font-size: 14px; background: rgba(255,250,240,.94); color: #2b2235; padding: 5px 14px; border-radius: 99px; display: inline-block; box-shadow: 0 3px 0 rgba(43,34,53,.15); }
#qstamp .nx b { font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: #fff; background: #d6981e; border-radius: 99px; padding: 1px 7px; margin-right: 4px; }
@keyframes qstamp { 0% { transform: rotate(-4deg) scale(2.1); opacity: .2; } 100% { transform: rotate(-4deg) scale(1); opacity: 1; } }
#qtip { position: fixed; left: 14px; top: 90px; z-index: 6; max-width: 360px; background: #2b2235; color: #fffaf0; padding: 10px 14px 8px; border-radius: 12px; font-size: 13.5px; font-weight: 600; line-height: 1.4; box-shadow: 0 4px 0 rgba(43,34,53,.25); display: none; pointer-events: none; }
#qtip.on { display: block; }
#qtip::before { content: ""; position: absolute; left: 26px; top: -8px; border: 8px solid transparent; border-bottom-color: #2b2235; border-top: 0; }
#qtip kbd { font: 700 11px "Segoe UI", sans-serif; border: 1.5px solid #fffaf0; border-radius: 4px; padding: 0 4px; }
#qtip .t-main { color: #ffd166; font-weight: 800; } #qtip .t-side { color: #8fbaff; font-weight: 800; }
#qtip small { display: block; margin-top: 4px; font-size: 10.5px; opacity: .55; }
body.on-title #qtip, body.on-title #qstamp, body.in-battle #qtip, body.in-battle #qstamp { display: none !important; }
.qsec { margin: 4px 0 8px; font: 800 15px Bahnschrift, "Segoe UI", sans-serif; letter-spacing: .04em; color: #9a6a12; }
.qsec.side { margin-top: 18px; color: #1f5fb8; } .qsec.done { margin-top: 18px; color: rgba(43,34,53,.6); }
.qsec small { font: 600 11px "Segoe UI", sans-serif; letter-spacing: 0; opacity: .7; margin-left: 6px; }
.qnote { margin: -2px 0 10px; font-size: 12.5px; opacity: .7; }
.qgroup { margin: 12px 0 6px; font-size: 11px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: #1f5fb8; opacity: .75; }
.quest.main { border-color: rgba(230,169,46,.55); }
.quest.side.tracked { border-color: #3b7ddd; box-shadow: 0 3px 0 rgba(59,125,221,.25); }
.quest.side .qnow { color: #1f5fb8; }
.quest .qon { font-size: 12px; font-weight: 800; color: #9a6a12; margin-left: auto; } .quest.side .qon { color: #1f5fb8; }
.quest .qback { margin-left: 6px; }
.qsteps li.more { list-style: none; opacity: .55; }
.qdone-row { font-size: 13px; font-weight: 600; opacity: .6; padding: 3px 2px; }`;
    (document.head || document.documentElement).appendChild(st);
  }
  return { init(game) { G = game; quiet = true; }, LIST, tracked, track, objective, target, marks, hint, word, tick, html, current, reportDue,
    _: { stamps, showTip, hideTip, get stampQ() { return stampQ; }, mainQ } };
})();

// ============================================================ Region 3, the Quarry Caves (caves.js, mine.js): the main quest's steps
// (Appended for region 3.) At QUESTS.init the steps below go into 'Find Noa' right after the lake's «Go north to the Quarry
// Caves» step (whose way there and hint this section points up the quarry road, from the East Field), or at the end if
// there's none. Flags: camp / quarry (arriving), cande, the miners in state.caves.helped, mineOpen, caveFree (the gong, bell 3).
(() => {
  const init0 = QUESTS.init;
  QUESTS.init = function (game) { init0.call(this, game); try { addCaves(game); } catch (e) { console.error('[quests: caves]', e); } };
  function addCaves(G) {
    if (typeof CAVES === 'undefined') return;
    const main = QUESTS.LIST.find(q => q.id === 'main'); if (!main || main.steps.some(s => s.caves)) return;
    const S = () => G.state, helped = s => CAVES.MINERS.filter(m => s.caves && s.caves.helped && s.caves.helped[m.id]).length;
    const inMine = () => typeof MINE !== 'undefined' && MINE.inside;
    // (the examples in the save's language: zh / ja in the mode's text)
    const L = () => (G.state && G.state.lang) || 'es', pl = t => ((L() === 'zh' || L() === 'ja') && typeof CJK !== 'undefined' ? CJK.plain(t, { lang: L() }) : t);
    const steps = [
      { caves: true, text: 'Find whoever runs the miners’ camp',
        why: 'The camp at the quarry’s mouth is gray and silent. Someone must know what happened, and where the {w.bell} is.',
        done: s => !!s.flags.cande, target: () => CAVES.target(), hint: '{mimo} points at a woman in a red shirt, by the cabin with the birdcage.' },
      { caves: true, text: 'Help the miners find their words: say how each one is ({n}/6)', n: s => helped(s),
        get why() { return `The Hush took the miners’ words, so they can’t say what’s wrong. Look at each one, listen to the words the Hush left them, and tell Cande how they are in a sentence, the way she showed you: «${pl(CAVES.modelOf('tired', 'm', L()))}», «${pl(CAVES.modelOf('cold', 'f', L()))}»… The right sentence gets them the right help, and gives them their words back.`; },
        done: s => helped(s) >= 6, target: () => CAVES.target(), hint: '{mimo} tugs your sleeve toward a gray miner. How does that one look?' },
      { caves: true, text: 'Open the mine: Pío the canary sings… and {mimo} can too',
        why: 'Gray Hush stone seals the mine’s mouth. Only a voice can wake the dark {w.crystal:pl} around it. Pío, Cande’s canary, is the only one still singing.',
        done: s => !!s.flags.mineOpen, target: () => CAVES.target(), hint: '{mimo} listens to the canary on the porch… then looks at the dark mine.' },
      { caves: true, text: 'Ring the mine’s {w.gong}: the third {w.bell}',
        why: 'The {w.gong} hangs in the Gong Hall, at the very bottom of the mine. It’s dark down there, echo bats copy whatever you say, and something big sleeps by the {w.gong}.',
        done: s => !!s.flags.caveFree, target: () => (inMine() && MINE.target ? MINE.target() : CAVES.landmarks.mouthFront), hint: '{mimo} peers into the dark. Down, down, down: the {w.gong} is at the bottom.' },
      { caves: true, report: 'cande', text: '💬 Report to Cande at the miners’ camp',
        why: 'The {w.gong} rings again! Cande will want to hear it from you, and she knows where Noa went next.',
        done: s => !!s.flags.candeThird, target: () => (CAVES.person && CAVES.person('cande')) || CAVES.target(), hint: '{mimo} points at Cande, by the cabin with the birdcage.' },
      // (region 4's way there: the Bloom Gardens section below adds the rest of its steps right after this one)
      { caves: true, gardensWay: true, text: 'Go to the Bloom Gardens, south of Molinar ({n}/8 bells rung)', n: s => s.flags.bells || 0,
        why: 'Noa went on to the Bloom Gardens, in a warm valley: beekeepers, flowers and greenhouses. Cande says the fourth {w.bell} must be there. The garden road leaves Molinar by its south way out.',
        done: s => !!(s.flags.flora || s.flags.gardenGate), target: () => (typeof GARDENS !== 'undefined' ? GARDENS.wayIn() : null),
        hint: '{mimo} sniffs the air… flowers! East to Molinar, through the square, and out the south way.' },
    ];
    // the lake's pointer north: the way there is up the quarry road, from the East Field
    const k = main.steps.findIndex(s => /Quarry Caves/.test(s.text || '') && !s.caves);
    if (k >= 0) {
      const st = main.steps[k], done0 = st.done;
      st.target = () => CAVES.wayIn();
      st.hint = '{mimo} points east, then north: out of Alba’s east gate, across the field, and up the quarry road into the {w.mountain:pl}.';
      st.done = s => !!(done0(s) || s.flags.camp);
      main.steps.splice(k + 1, 0, ...steps);
    } else main.steps.push(Object.assign({ caves: true, text: 'Go north to the Quarry Caves ({n}/8 bells rung)', n: s => s.flags.bells || 0,
      why: 'The next {w.bell} is in the Quarry Caves, up the quarry road north of the East Field.', done: s => !!s.flags.camp, target: () => CAVES.wayIn(),
      hint: '{mimo} points east, then north: across the field and up the quarry road.' }), ...steps);
    main.story.push(
      { when: s => !!s.flags.cande, text: 'Up the quarry road, at the miners’ camp, Cande the camp boss told you the mine’s {w.gong} is its {w.bell}. When it went silent, the dark came out of the tunnels and took the miners’ words.' },
      { when: s => helped(s) >= 6, text: 'You looked at each miner and said how they were: tired, cold, hungry, scared, a headache, sad. Cande got each one the right help, and their words came back.' },
      { when: s => !!s.flags.mineOpen, text: 'Pío the canary taught {mimo} to sing. {mimo} sang at the mine’s mouth, the {w.crystal:pl} lit up, and the gray stone crumbled away.' },
      { when: s => !!s.flags.caveFree, text: 'Deep in the mine, {mimo} sang the dark {w.crystal:pl} awake, found Chepe, who was lost, and beat the giant echo bat by never saying the same thing twice. Noa’s page: she went on to the Bloom Gardens. Then the {w.gong} rang out: three bells of eight.' });
  }
})();

// ============================================================ Region 4, the Bloom Gardens (gardens.js, greenhouse.js): the main quest's steps
// (Appended for region 4.) At QUESTS.init the steps below go into 'Find Noa' right after the caves' «Go to the Bloom Gardens»
// step (gardensWay), or at the end if there's none. Flags: flora (Flora at the gate), gardenGate (Mimo climbed over and lifted
// the latch), gardens (arriving), melisa, the judges in state.gardens.liked / .judged, showDone and greenOpen (the show is
// saved; the great greenhouse's door opens), gardensFree (the gardeners' bell, bell 4). The last step, «The fifth bell: the
// Frost Peaks» (peaksPointer), is done on flags.peaks, which region 5 sets when you arrive there.
(() => {
  const init0 = QUESTS.init;
  QUESTS.init = function (game) { init0.call(this, game); try { addGardens(game); } catch (e) { console.error('[quests: gardens]', e); } };
  function addGardens(G) {
    if (typeof GARDENS === 'undefined') return;
    const main = QUESTS.LIST.find(q => q.id === 'main'); if (!main || main.steps.some(s => s.gardens)) return;
    const st = s => (s.gardens || {}), liked = s => ['tomasa', 'polo', 'lola'].filter(id => st(s).liked && st(s).liked[id]).length, judged = s => ['big', 'pretty', 'sweet'].filter(k => st(s).judged && st(s).judged[k]).length;
    const inGreen = () => typeof GREENHOUSE !== 'undefined' && GREENHOUSE.inside;
    // (the examples in the save's language: zh / ja in the mode's text)
    const L = () => (G.state && G.state.lang) || 'es', pl = t => ((L() === 'zh' || L() === 'ja') && typeof CJK !== 'undefined' ? CJK.plain(t, { lang: L() }) : t);
    const steps = [
      { gardens: true, text: 'Open the garden gate: {mimo} has to climb over',
        why: 'The gate into the Bloom Gardens is locked from inside, and nobody answers. Flora climbs the rose trellis to peek over, but at the top it’s too thin for her. {mimo} is small and light…',
        done: s => !!s.flags.gardenGate, target: () => GARDENS.target(), hint: '{mimo} watches Flora go up the trellis… and looks at you.' },
      { gardens: true, text: 'Find whoever runs the flower show',
        why: 'The valley is full of flowers, but everyone is gray and still. Flora says Melisa, the head beekeeper, will know what to do.',
        done: s => !!s.flags.melisa, target: () => GARDENS.target(), hint: '{mimo} points at a woman in a beekeeper’s hat, by the green.' },
      { gardens: true, text: 'Help the judges: say what each one likes ({n}/3)', n: s => liked(s),
        get why() { return `The Hush came on show day, and the three judges went gray. They can’t say what they like, so look at each one, listen to the words the Hush left them, and tell Melisa in a sentence, the way she showed you: «${pl(GARDENS.likes.model('sunflower', L(), { to: 'other', g: 'f', name: 'Tomasa', neg: false }))}». And maybe someone doesn’t like something…`; },
        done: s => liked(s) >= 3, target: () => GARDENS.target(), hint: '{mimo} tugs your sleeve toward a gray judge. What do they like?' },
      { gardens: true, text: 'Judge the flower show: which is bigger, prettier, sweeter? ({n}/3)', n: s => judged(s),
        get why() { const C = GARDENS.compare.CONTESTS.big; return `The judges can talk again, but they can’t decide! Compare the two entries on each table in a sentence: «${pl(C.model[L()] || C.model.es)}».`; },
        done: s => judged(s) >= 3, target: () => GARDENS.target(), hint: '{mimo} looks from one entry to the other… which one wins?' },
      { gardens: true, text: 'Ring the gardeners’ {w.bell} at the top of the great {w.greenhouse}',
        why: 'At the end of every flower show, the gardeners ring their {w.bell} in the dome of the great {w.greenhouse}. Something big buzzes in there.',
        done: s => !!s.flags.gardensFree, target: () => (inGreen() && GREENHOUSE.target ? GREENHOUSE.target() : GARDENS.landmarks.door), hint: '{mimo} looks up at the glass dome. The {w.bell} is at the very top.' },
      { gardens: true, report: 'melisa', text: '💬 Report to Melisa in the Bloom Gardens',
        why: 'The gardeners’ {w.bell} rings again! Melisa will want to hear it from you, and she knows where Noa went next.',
        done: s => !!s.flags.melisaFourth, target: () => (GARDENS.person && GARDENS.person('melisa')) || GARDENS.target(), hint: '{mimo} points at Melisa, in her beekeeper’s hat.' },
      { gardens: true, peaksPointer: true, text: 'The fifth {w.bell}: the Frost Peaks ({n}/8 bells rung)', n: s => s.flags.bells || 0,
        why: 'Noa’s page from the great greenhouse: she went on to the Frost Peaks, the snowy mountains to the north-east, where there’s an old clock workshop.',
        done: s => !!s.flags.peaks, target: () => { const P = (typeof PEAKS !== 'undefined' && PEAKS) || (typeof FROST !== 'undefined' && FROST) || null; return P && P.wayIn ? P.wayIn() : null; },
        hint: '{mimo} shivers a little and points north-east, toward the snowy mountains.' },
    ];
    const k = main.steps.findIndex(s => s.gardensWay);
    if (k >= 0) main.steps.splice(k + 1, 0, ...steps);
    else main.steps.push(Object.assign({ gardens: true, text: 'Go to the Bloom Gardens, south of Molinar ({n}/8 bells rung)', n: s => s.flags.bells || 0,
      why: 'The next {w.bell} is in the Bloom Gardens, in the warm valley south of Molinar.', done: s => !!(s.flags.flora || s.flags.gardenGate), target: () => GARDENS.wayIn(),
      hint: '{mimo} points east, to Molinar, then south.' }), ...steps);
    main.story.push(
      { when: s => !!s.flags.gardenGate, text: 'South of Molinar, the gate into the Bloom Gardens was locked from inside. Flora, a young gardener stuck outside, kept climbing the rose trellis to peek over. {mimo} watched her, climbed over the hedge itself and lifted the latch.' },
      { when: s => !!s.flags.melisa, text: 'Melisa, the head beekeeper, told you the Hush came on the day of the flower show. The judges went gray, and the great {w.greenhouse}’s door, where the gardeners’ {w.bell} hangs, was wrapped in gray vines.' },
      { when: s => liked(s) >= 3, text: 'You looked at each judge and told Melisa what they liked: Tomasa loves sunflowers, Lola loves {w.honey}, and Polo doesn’t like roses at all (they make him sneeze). Their words came back.' },
      { when: s => !!s.flags.showDone, text: 'Then you helped them judge: the red rose is bigger than the white one, the yellow tulip prettier than the red one, and the lavender {w.honey} sweeter than the rose {w.honey}. The show was saved, and the gray vines fell from the {w.greenhouse} door.' },
      { when: s => !!s.flags.gardensFree, text: 'In the great {w.greenhouse}, {mimo} climbed, pushed, swam and sang its way up to the dome, and you calmed and beat the Queen Bee. Noa’s page: she went on to the Frost Peaks. Then the gardeners’ {w.bell} rang out: four bells of eight.' });
  }
})();

// ============================================================ Region 5, the Frost Peaks (peaks.js, icetower.js): the main quest's steps
// (Appended for region 5.) At QUESTS.init the steps below go into 'Find Noa' right after region 4's «The fifth bell: the Frost
// Peaks» step (peaksPointer, done on flags.peaks; this section points its way up the quarry road and out of the miners' camp),
// or, if there's none, after a pointer step of its own. Flags: peaks (arriving on the pass), liaSeen, drift, tobias, the clocks
// in state.peaks.set, clocksSet, towerOpen, peaksFree (the workshop's bell, bell 5). The last step is region 6's placeholder.
(() => {
  const init0 = QUESTS.init;
  QUESTS.init = function (game) { init0.call(this, game); try { addPeaks(game); } catch (e) { console.error('[quests: peaks]', e); } };
  function addPeaks(G) {
    if (typeof PEAKS === 'undefined') return;
    const main = QUESTS.LIST.find(q => q.id === 'main'); if (!main || main.steps.some(s => s.peaks)) return;
    const setN = s => PEAKS.CLOCKS.filter(c => s.peaks && s.peaks.set && s.peaks.set[c.id]).length;
    const inTower = () => typeof ICETOWER !== 'undefined' && ICETOWER.inside;
    // (the examples in the save's language: zh / ja in the mode's text)
    const L = () => (G.state && G.state.lang) || 'es', pl = t => ((L() === 'zh' || L() === 'ja') && typeof CJK !== 'undefined' ? CJK.plain(t, { lang: L() }) : t);
    const tm = (h, m) => pl(PEAKS.modelOf({ kind: 'time', h, m }, L()));
    const steps = [
      { peaks: true, text: 'Get past the snowdrift on the Frost Pass',
        why: 'Halfway up the pass, a wall of {w.snow} blocks the road to the village. Lía, the clockmaker’s apprentice, is stuck on this side of it, by a stone hut, blowing on her pinwheel.',
        done: s => !!s.flags.drift, target: () => PEAKS.target(), hint: '{mimo} points up the pass, at a kid with a pinwheel by the stone hut.' },
      { peaks: true, text: 'Find the clockmaker’s workshop in Escarcha',
        why: 'Lía says her master, Tobías, knows everything about clocks. His workshop is the big house with a gear on it, at the top of the village.',
        done: s => !!s.flags.tobias, target: () => PEAKS.target(), hint: '{mimo} points at the big house with a gear on its front.' },
      { peaks: true, text: 'Set Escarcha’s frozen clocks: say the time each one should show ({n}/6)', n: s => setN(s),
        get why() { return `When the Hush came, every {w.clock} in Escarcha stopped at a different time, and its people froze with it. Read each sign, then say the time out loud in a sentence, the way Tobías showed you: «${tm(7, 0)}», «${tm(1, 0)}»… The town hall’s calendar wants the day, and Teo’s weather house the weather. The right one starts the {w.clock} again.`; },
        done: s => setN(s) >= 6, target: () => PEAKS.target(), hint: '{mimo} tugs your sleeve toward a frozen {w.clock}. What does its sign say?' },
      { peaks: true, text: 'Ring the workshop’s {w.bell}, at the top of the Ice Clock Tower: the fifth {w.bell}',
        why: 'The Ice Clock Tower stands on a ledge above the village. Its door is buried in {w.snow}, and inside everything is frozen: fog, gears, ice mills. The {w.bell} hangs at the very top.',
        done: s => !!s.flags.peaksFree, target: () => (inTower() && ICETOWER.target ? ICETOWER.target() : PEAKS.target()), hint: '{mimo} looks up at the tower of ice. The {w.bell} is at the very top!' },
      { peaks: true, report: 'tobias', text: '💬 Report to Tobías in Escarcha',
        why: 'The workshop’s {w.bell} rings again! Tobías will want to hear it from you, and he knows where Noa went next.',
        done: s => !!s.flags.tobiasFifth, target: () => (PEAKS.person && PEAKS.person('tobias')) || PEAKS.target(), hint: '{mimo} points at Tobías, by his workshop with the gear on it.' },
      { peaks: true, text: 'The sixth {w.bell}: Port Brisa (coming soon!)',
        why: 'Noa went down to Port Brisa, the big port by the sea, far to the south-west. Tobías says the sixth {w.bell} must be there.',
        done: () => false, target: () => null, hint: '{mimo} sniffs the air… salt? The sea, somewhere far away.' },
    ];
    const way = '{mimo} points north, up the quarry road. Through the miners’ camp, then out its east side, between the bunkhouse and the canteen.';
    const k = main.steps.findIndex(s => s.peaksPointer || (/Frost Peaks/.test(s.text || '') && !s.peaks));
    if (k >= 0) {
      const st = main.steps[k], done0 = st.done;
      st.target = () => PEAKS.wayIn(); st.hint = way;
      st.done = s => !!(done0(s) || s.flags.peaks || s.flags.drift);
      main.steps.splice(k + 1, 0, ...steps);
    } else main.steps.push(Object.assign({ peaks: true, peaksPointer: true, text: 'The fifth {w.bell}: the Frost Peaks ({n}/8 bells rung)', n: s => s.flags.bells || 0,
      why: 'The next {w.bell} is in the Frost Peaks, the snowy mountains north-east of here, past the miners’ camp.', done: s => !!(s.flags.peaks || s.flags.drift), target: () => PEAKS.wayIn(), hint: way }), ...steps);
    main.story.push(
      { when: s => !!s.flags.drift, text: 'Up the Frost Pass, behind the miners’ camp, Lía, the clockmaker’s apprentice, showed {mimo} a new word with her pinwheel. Then {mimo} blew the snowdrift off the road.' },
      { when: s => !!s.flags.tobias, text: 'In Escarcha, time had stopped: every {w.clock} froze at a different time, and its people with it. Tobías the clockmaker, Ciro’s old teacher, asked you to set the clocks by saying the time.' },
      { when: s => !!s.flags.clocksSet, text: 'You read each sign and said the time, the day and the weather out loud. Each {w.clock} started again, and its people woke up.' },
      { when: s => !!s.flags.peaksFree, text: 'In the Ice Clock Tower, {mimo} blew away the fog, spun the ice mills, set the great {w.clock} and beat the giant snowman by the {w.bell}. Noa’s page: she went down to Port Brisa, by the sea. Then the workshop’s {w.bell} rang out: five bells of eight.' });
  }
})();
// ============================================================ Region 6, Port Brisa (port.js, port_play.js, port_fort.js): the main quest's steps
// (Appended for region 6.) At QUESTS.init the peaks' last step, "The sixth bell: Port Brisa (coming soon!)", becomes the real way
// there (portPointer: done on flags.portRoad, set on the road south of Remanso once the fog has lifted), and the steps below follow
// it. Flags: portRoad, nico (Marino), portGate (the drawbridge), port (arriving), dora, the sailors in state.port.asked, askedAll,
// doraTold, ticket, fortLanded, portFree (the harbor bell, bell 6), portSixth (the report). The last step, «The seventh bell: the
// Sunken Ruins» (ruinsPointer), is done on flags.ruins, which region 7 sets when the big ship lands you there (RUINS.arrive()).
// Two side quests: Omar's crabs (port.crabs) and the travelers' words (port.travel).
(() => {
  const init0 = QUESTS.init;
  QUESTS.init = function (game) { init0.call(this, game); try { addPort(game); } catch (e) { console.error('[quests: port]', e); } };
  function addPort(G) {
    if (typeof PORT === 'undefined' || !PORT.init) return;
    const main = QUESTS.LIST.find(q => q.id === 'main'); if (!main || main.steps.some(s => s.port)) return;
    const st = s => s.port || {}, asked = s => ['greta', 'rui', 'wei', 'yuki', 'omar'].filter(id => st(s).asked && st(s).asked[id]).length;
    const inFort = () => typeof PORTFORT !== 'undefined' && PORTFORT.inside;
    const T = () => PORT.target();
    const steps = [
      { port: true, text: 'Get across the moat: the drawbridge is up',
        why: 'Port Brisa’s walls stand behind a moat, and the drawbridge is up. Abel, the bridge keeper, has gone gray and is fast asleep in his booth. Marino, a harbor kid on the bank, is calling the {w.gull:pl}…',
        done: s => !!s.flags.portGate, target: T, hint: '{mimo} points at the kid by the moat, the one with all the {w.gull:pl} round him.' },
      { port: true, text: 'Find the harbor master: Dora, by the blue-and-white house on the quay',
        why: 'The whole city is gray and quiet. Marino says Dora, the harbor master, knows everything that happens in Port Brisa.',
        done: s => !!s.flags.dora, target: T, hint: '{mimo} points down the main street, toward the quay and the sea.' },
      { port: true, text: 'Ask the sailors who saw Noa: a good question each ({n}/5)', n: s => asked(s),
        why: 'Dora says lots of people come and go in the harbor. The sailors are gray, but a good question gives a sailor their words back. Before each one, Marino asks a question first: listen to how he asks it, then ask the sailor.',
        done: s => asked(s) >= 5 || !!s.flags.askedAll, target: T, hint: '{mimo} tugs your sleeve toward a gray sailor. What would you ask them?' },
      { port: true, text: '💬 Tell Dora what the sailors said',
        why: 'Yuki rowed Noa out to the sea {w.fort}, to see the old {w.bell}. Then the fog came. Dora will know how to get out there.',
        done: s => !!s.flags.doraTold, target: T, hint: '{mimo} points back at Dora, on the quay.' },
      { port: true, text: 'Get a boat ticket at Eloy’s blue booth: ask when the boat leaves, then ask for a ticket',
        get why() { const l = (G.state && G.state.lang) || 'es', m = PORT.buy && PORT.buy.MODEL[l], pl = t => ((l === 'zh' || l === 'ja') && typeof CJK !== 'undefined' ? CJK.plain(t, { lang: l }) : t); return `The fort {w.boat} goes from the end of the ferry pier, and Eloy sells the {w.ticket:pl}. Ask him when the boat leaves, then ask for a ticket the way Dora showed you${m ? `: «${pl(m)}»` : ''}.`; },
        done: s => !!s.flags.ticket, target: T, hint: '{mimo} points at the little blue booth on the quay.' },
      { port: true, text: 'Call the fort boat from the end of the ferry pier, and sail to the sea fort',
        why: 'The fort’s boat is tied up out at the fort, and Tere, its skipper, is gray. Eloy says it won’t come by itself: someone has to call it.',
        done: s => !!s.flags.fortLanded, target: T, hint: '{mimo} runs down the ferry pier and looks out at the fort.' },
      { port: true, text: 'Ring the harbor {w.bell} at the top of the sea fort: the sixth {w.bell}',
        why: 'The harbor {w.bell} hangs at the top of the old sea fort. The Hush came in with the fog, and the {w.crab:pl} came up out of the {w.sea}. Something big lives up by the {w.bell}…',
        done: s => !!s.flags.portFree, target: () => (inFort() && PORTFORT.target ? PORTFORT.target() : T()), hint: '{mimo} looks up at the fort’s tower. The {w.bell} is at the very top!' },
      { port: true, report: 'dora', text: '💬 Report to Dora on the quay',
        why: 'The harbor {w.bell} rings again! Dora will want to hear it from you, and she knows where Noa went next.',
        done: s => !!s.flags.portSixth, target: T, hint: '{mimo} points at Dora, on the quay.' },
      { port: true, ruinsPointer: true, text: 'The seventh {w.bell}: ask Quino at the long pier how to get to the Sunken Ruins ({n}/8 bells rung)', n: s => s.flags.bells || 0,
        get why() { const l = (G.state && G.state.lang) || 'es', Q = PORT.ask && PORT.ask.QS.how_ruins, m = Q && Q.model[l], pl = t => ((l === 'zh' || l === 'ja') && typeof CJK !== 'undefined' ? CJK.plain(t, { lang: l }) : t); return `Noa’s page from the sea fort: she sailed on the big ship to the Sunken Ruins, in a canyon of red sand on the south-east coast. Quino, the big ship’s boatman, is at the long pier: ask him how to get there, the way Dora showed you${m ? `: «${pl(m)}»` : ''}. Your {w.ticket} gets you on board.`; },
        done: s => !!s.flags.ruins, target: () => (PORT.person && PORT.person('quino')) || PORT.SPOT.quino, hint: '{mimo} points at the big ship at the long pier.' },
    ];
    const way = '{mimo} points west, then south: out of Alba’s west gate, over the Reed River to Remanso, then down the road south from the village.';
    const k = main.steps.findIndex(s => /Port Brisa \(coming soon/.test(s.text || '') || s.portPointer);
    const pointer = { port: true, portPointer: true, text: 'The sixth {w.bell}: Port Brisa, down the road south of Remanso ({n}/8 bells rung)', n: s => s.flags.bells || 0,
      why: 'Noa went down to Port Brisa, the big port city by the sea, south of the Mirror Lake. Tobías says the sixth {w.bell} must be there. The road leaves Remanso southward; the fog on it lifted with the fifth {w.bell}.',
      done: s => !!(s.flags.portRoad || s.flags.nico || s.flags.portGate), target: () => PORT.wayIn(), hint: way };
    if (k >= 0) main.steps.splice(k, 1, pointer, ...steps);
    else main.steps.push(pointer, ...steps);
    main.story.push(
      { when: s => !!s.flags.portGate, text: 'South of Remanso, Port Brisa’s drawbridge was up. Marino, a harbor kid, showed {mimo} a new word: he called the {w.gull:pl}, and they came. {mimo} called them down onto the sleeping bridge keeper’s roof, and Abel woke up and lowered the bridge.' },
      { when: s => !!s.flags.askedAll, text: 'Dora, the harbor master, sent you to the gray sailors. Marino showed you how to ask, and each good question gave a sailor their words back: Noa drew Greta’s boat, asked old Rui about the harbor {w.bell}, ate Wei’s soup… and Yuki rowed her out to the sea {w.fort}.' },
      { when: s => !!s.flags.ticket, text: 'At the blue booth you asked Eloy when the boat leaves, and bought a {w.ticket} by asking for one.' },
      { when: s => !!s.flags.portFree, text: 'At the sea {w.fort}, {mimo} called the boat, and you climbed to the top. You beat the giant {w.crab} by the {w.bell}, from behind. Noa’s page: she sailed to the Sunken Ruins, on the south-east coast. Then the harbor {w.bell} rang out: six bells of eight.' });
    // side quests (never tracked by themselves: you pick them in the quest log)
    const crabsN = s => Math.min(3, st(s).crabs || 0), travN = s => ['amaia', 'nuno', 'ilse'].filter(id => st(s).trav && st(s).trav[id]).length;
    if (!QUESTS.LIST.some(q => q.id === 'port.crabs')) QUESTS.LIST.push({ id: 'port.crabs', kind: 'side', title: 'Omar’s {w.crab:pl}', giver: 'Omar, on the beach in Port Brisa',
      started: s => !!(st(s).asked && st(s).asked.omar),
      steps: [
        { text: 'Chase three {w.crab} gangs away from the harbor ({n}/3)', n: crabsN,
          why: 'Omar is too scared to come down off his crates. The {w.crab:pl} walk sideways, with their shells and claws to the front: hit them from behind, and say so.',
          done: s => crabsN(s) >= 3 || !!st(s).crabsDone,
          target: () => { const Y = G.sim.you; let b = null; for (const r of WORLD.L.roamers) if (r.area === 'port' && (!b || Math.hypot(r.x - Y.x, r.z - Y.z) < Math.hypot(b.x - Y.x, b.z - Y.z))) b = r; return b ? { x: b.x, z: b.z } : null; },
          hint: '{mimo} creeps along sideways, like a {w.crab}…' },
        { text: 'Tell Omar the {w.crab:pl} are gone', why: 'Omar is still up on his crates on the beach.', done: s => !!st(s).crabsDone,
          target: () => (PORT.person && PORT.person('omar')) || PORT.SPOT.omar, hint: '{mimo} points at Omar, up on his crates.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'port.travel')) QUESTS.LIST.push({ id: 'port.travel', kind: 'side', title: 'The travelers’ words', giver: 'Dora, the harbor master in Port Brisa',
      started: s => !!s.flags.dora,
      steps: [
        { text: 'Ask the three gray travelers by the harbor a good question each ({n}/3)', n: travN,
          why: 'Three travelers are waiting for the big ship with their suitcases, gray and silent. Ask each one a good question, like the sailors: where they come from, where they’re going, what they’re doing.',
          done: s => travN(s) >= 3,
          target: () => { const Y = G.sim.you; const left = ['amaia', 'nuno', 'ilse'].filter(id => !(st(G.state).trav || {})[id]).map(id => PORT.person && PORT.person(id)).filter(Boolean); return left.length ? left.reduce((b, p) => (!b || Math.hypot(p.x - Y.x, p.z - Y.z) < Math.hypot(b.x - Y.x, b.z - Y.z) ? p : b), null) : null; },
          hint: '{mimo} looks at the suitcases by the quay.' },
      ] });
  }
})();

// ============================================================ Region 8, the Gray Marsh (marsh.js, marsh_chapel.js): the main quest's steps
// (Appended for region 8.) At QUESTS.init the steps below go into 'Find Noa' right after a «The eighth bell: the Gray Marsh»
// pointer (marshPointer; region 7 may leave one), which this section points up through the Old Quarter to the old north road's
// gate (done on flags.marsh); or, if there's none, a pointer of its own goes before the Old Tower's steps (placed again once every
// QUESTS.init wrap has run, so region 7's steps come first whenever they're added). Side quests marsh.shadows, marsh.drill. Flags: marsh (through
// the gate), marshFog, bwJump, candil, the pairs in state.marsh.told, marshPairs, marshLantern, the stone lanterns in
// state.marsh.lamps, marshLamps, chapelOpen, marshFree (the eighth bell: CHAPEL_D's finale), luceroEighth (the report). The Old
// Tower's steps (oldtower.js) come after these.
(() => {
  const init0 = QUESTS.init;
  QUESTS.init = function (game) { init0.call(this, game); try { addMarsh(game); } catch (e) { console.error('[quests: marsh]', e); } };
  function addMarsh(G) {
    if (typeof MARSH === 'undefined') return;
    const main = QUESTS.LIST.find(q => q.id === 'main'); if (!main || main.steps.some(s => s.marsh)) return;
    const st = s => s.marsh || {}, told = s => MARSH.PAIRS.filter(p => st(s).told && st(s).told[p.id]).length, lamps = s => (st(s).lamps || []).filter(Boolean).length;
    const inChapel = () => typeof CHAPEL_D !== 'undefined' && CHAPEL_D.inside;
    const L = () => (G.state && G.state.lang) || 'es', pl = t => ((L() === 'zh' || L() === 'ja') && typeof CJK !== 'undefined' ? CJK.plain(t, { lang: L() }) : t);
    const tgt = () => MARSH.target();
    const steps = [
      { marsh: true, text: 'Get through the Hush {w.fog} on the old north road',
        get why() { return `A wall of gray {w.fog} lies across the road into the marsh. Lucero, the lamplighter of Candil, talks to her lantern to make it shine: «${pl(TEAM.model('v.light', 'one', L()))}». Watch her.`; },
        done: s => !!s.flags.marshFog, target: tgt, hint: '{mimo} squints at the gray {w.fog}… and at Lucero’s lantern.' },
      { marsh: true, text: 'Cross the broken boardwalk to Candil, with Lucero and Bruno',
        get why() { return `The boardwalk over the black water is broken in three places. Lucero shows you how to tell several people at once: «${pl(TEAM.model('v.jump', 'you', L()))}» (you all), «${pl(TEAM.model('v.jump', 'we', L()))}» (let’s, you too).`; },
        done: s => !!s.flags.bwJump, target: tgt, hint: '{mimo} hops along the boardwalk. Lucero is waiting at the gaps.' },
      { marsh: true, text: 'Wake Candil: tell each pair what to do, both at once ({n}/3)', n: s => told(s),
        get why() { return `The people of Candil are gray and stuck in the middle of their work, two by two. They can’t talk, but they still hear. Tell each pair what to do, to both of them at once: «${pl(TEAM.frame('you', L()))}».`; },
        done: s => !!s.flags.marshPairs || told(s) >= 3, target: tgt, hint: '{mimo} tugs your sleeve toward a gray pair. What were they doing?' },
      { marsh: true, text: 'Light Candil’s great lantern, all together',
        get why() { return `Every night, everyone in Candil lights the great lantern together, you too now: «${pl(TEAM.model('v.light', 'we', L()))}».`; },
        done: s => !!s.flags.marshLantern, target: tgt, hint: '{mimo} looks up at the cold great lantern in the middle of the village.' },
      { marsh: true, text: 'Light the stone lanterns on the causeway ({n}/4)', n: s => lamps(s),
        why: 'The pilgrims’ causeway runs through the fog to the drowned {w.chapel}. Each stone lantern you light pushes the {w.fog} back. {w.shadow:pl} prowl there: say which creature each one is, or light it first.',
        done: s => !!s.flags.marshLamps || lamps(s) >= 4, target: tgt, hint: '{mimo} points down the causeway, at a dark stone lantern.' },
      { marsh: true, text: 'Open the drowned {w.chapel}’s door, all together',
        get why() { return `Grandma Nieves rang the {w.chapel}’s {w.bell} every night. Its door is stuck in the mud: it takes everyone, you too. «${pl(TEAM.model('v.push', 'we', L()))}»`; },
        done: s => !!s.flags.chapelOpen, target: tgt, hint: '{mimo} looks at the old door at the end of the jetty.' },
      { marsh: true, text: 'Ring the drowned {w.chapel}’s {w.bell}: the eighth {w.bell}',
        why: 'The {w.bell} hangs at the top of the {w.chapel}’s belfry. Inside, the water is black and the {w.shadow:pl} are thick. Something big is waiting by the {w.bell}.',
        done: s => !!s.flags.marshFree, target: () => (inChapel() && CHAPEL_D.target ? CHAPEL_D.target() : MARSH.SPOT.chapelDoor), hint: '{mimo} looks at the dark water inside. The {w.bell} is up at the top.' },
      { marsh: true, report: 'lucero', text: '💬 Report to Lucero in Candil',
        why: 'The eighth {w.bell} is ringing! Lucero will want to hear it from you, and from Candil you can see the old {w.tower}’s door.',
        done: s => !!s.flags.luceroEighth, target: () => { const l = MARSH.luc && MARSH.luc(); return l ? { x: l.x, z: l.z } : MARSH.SPOT.lucero; }, hint: '{mimo} points at Lucero, by the great lantern in Candil.' },
    ];
    const way = '{mimo} points north: out of Alba’s north gate, through the Old Quarter, and right at the old theater, to the old north road’s gate.';
    const pointer = { marsh: true, marshPointer: true, text: 'The eighth {w.bell}: the Gray Marsh, past the old north road’s gate ({n}/8 bells rung)', n: s => s.flags.bells || 0,
      why: 'Noa went north, to the Gray Marsh at the old {w.tower}’s feet, where the Hush is thickest. The last {w.bell} is there. The old north road starts at the chained gate past the Old Quarter.',
      done: s => !!s.flags.marsh, target: () => MARSH.wayIn(), hint: way };
    // where they go: after a pointer to the marsh that region 7 left (marshPointer, or a step naming the Gray Marsh that isn't a
    // report: it's adopted, done on flags.marsh too), else ours, just before the Old Tower's steps (or at the end). Placed again
    // once every QUESTS.init wrap has run (a microtask), so region 7's steps, added by a later wrap, still come first.
    function place() {
      const rest = main.steps.filter(s => !s.marsh), k = rest.findIndex(s => s.marshPointer || (/Gray Marsh/.test(s.text || '') && !s.report));
      let at, block;
      if (k >= 0) {
        const p = rest[k];
        if (!p.marshAdopted) { const done0 = p.done; p.target = () => MARSH.wayIn(); p.hint = way; p.marshPointer = p.marshAdopted = true; p.done = s => !!(done0(s) || s.flags.marsh); }
        at = k + 1; block = steps;
      } else { at = rest.findIndex(s => s.oldtower); if (at < 0) at = rest.length; block = [pointer, ...steps]; }
      rest.splice(at, 0, ...block);
      main.steps.length = 0; main.steps.push(...rest);
    }
    place();
    Promise.resolve().then(() => { try { place(); } catch (e) { console.error('[quests: marsh] place', e); } });
    main.story.push(
      { when: s => !!s.flags.marsh, text: 'Past the Old Quarter, Bruno was waiting at the old north road’s gate. A lantern came out of the mist: Lucero, the lamplighter of Candil, unlocked it. Beyond lay the Gray Marsh, at the old {w.tower}’s feet.' },
      { when: s => !!s.flags.marshFog, text: 'Lucero talked to her lantern, and it shone. {mimo} learned the word by watching her, and lit the gray {w.fog} off the road.' },
      { when: s => !!s.flags.bwJump, text: 'On the broken boardwalk, Lucero showed you how to tell several people at once: one for you two, another for all of us, you too.' },
      { when: s => !!s.flags.marshLantern, text: 'In Candil, you told each gray pair what to do, both at once: the twins pushed their punt, the kids skipped stones, grandma Nieves and Marisol sang. Then everyone lit the great lantern together, and Candil’s color came back.' },
      { when: s => !!s.flags.chapelOpen, text: 'You lit the four stone lanterns on the pilgrims’ causeway through the {w.fog} and the {w.shadow:pl}, and all of you pushed the drowned {w.chapel}’s door open.' },
      { when: s => !!s.flags.marshFree, text: 'In the drowned {w.chapel}, {mimo} lit the dark, and you beat the Great Shadow that wore every creature’s shape. Noa’s page: the old {w.tower}’s door is open. Then the {w.chapel}’s {w.bell} rang out: eight bells of eight.' });
    // side quests (they never take the tracker by themselves)
    if (!QUESTS.LIST.some(q => q.id === 'marsh.shadows')) QUESTS.LIST.push({ id: 'marsh.shadows', kind: 'side', title: 'The shadow puppets', giver: 'Lolo and Mati, the kids in Candil (the Gray Marsh)',
      started: s => !!(st(s).told && st(s).told.kids),
      steps: [{ text: 'Guess the creatures in the kids’ shadow puppets ({n}/4)', n: s => Math.min(4, (st(s).puppets || 0)),
        why: 'With a lantern and their hands, Lolo and Mati make shadows of creatures on the wall of their hut. Say what each one is: the {w.shadow:pl} in the marsh are the same game, only bigger.',
        done: s => (st(s).puppets || 0) >= 4, target: () => (MARSH.person && MARSH.person('lolo')) || MARSH.SPOT.kids[0], hint: '{mimo} looks at the wall of the kids’ hut… a shadow is moving on it!' }] });
    if (!QUESTS.LIST.some(q => q.id === 'marsh.drill')) QUESTS.LIST.push({ id: 'marsh.drill', kind: 'side', title: 'Bruno’s team drill', giver: 'Bruno, in Candil (the Gray Marsh)',
      started: s => !!s.flags.candil,
      steps: [{ text: 'Practice team moves with Bruno: give team orders in a drill ({n}/3)', n: s => Math.min(3, st(s).drillBest || 0),
        get why() { return `Bruno wants to fight side by side. In a drill against his straw dummies, tell him and {mimo} together («${pl(TEAM.model('v.jump', 'you', L()))}») or everyone, you too («${pl(TEAM.model('v.jump', 'we', L()))}»).`; },
        done: s => (st(s).drillBest || 0) >= 3, target: () => { const b = G.sim.npc('bruno'); return b ? { x: b.x, z: b.z } : MARSH.SPOT.brunoCandil; }, hint: '{mimo} points at Bruno. He’s stretching, ready to train.' }] });
  }
})();
// ============================================================ Region 7, the Sunken Ruins (ruins.js, ruins_scenes.js, ruins_temple.js): the main quest's steps
// (Appended for region 7.) At QUESTS.init the steps below go into 'Find Noa' right after Port Brisa's «The seventh bell» step
// (ruinsPointer, done on flags.ruins: the big ship lands you, RUINS.arrive()), or, if there's none, after a pointer of their own.
// The last one is a «The eighth bell: the Gray Marsh» pointer (marshPointer: region 8's section adopts it and puts its steps after
// it). Flags: ruins, ruinsDig, ruinsSlide, ruinsChief, ruinsThings, ruinsWall, ruinsDoor, ruinsFree (the temple's bell, bell 7),
// ruinsReport; progress in state.ruins (found, given, panels, suns, shards) and state.ruinsT (the temple). Side quest ruins.jar.
(() => {
  const init0 = QUESTS.init;
  QUESTS.init = function (game) { init0.call(this, game); try { addRuins(game); } catch (e) { console.error('[quests: ruins]', e); } };
  function addRuins(G) {
    if (typeof RUINS === 'undefined' || !RUINS.init) return;
    const main = QUESTS.LIST.find(q => q.id === 'main'); if (!main || main.steps.some(s => s.ruins)) return;
    const L = () => (G.state && G.state.lang) || 'es', pl = t => ((L() === 'zh' || L() === 'ja') && typeof CJK !== 'undefined' ? CJK.plain(t, { lang: L() }) : t);
    const T = () => RUINS.target();
    const inTemple = () => typeof RUINS_TEMPLE !== 'undefined' && RUINS_TEMPLE.inside;
    const steps = [
      { ruins: true, text: 'Get up the gully: a slide of {w.sand} blocks the way to the camp',
        why: 'The ship left you in a cove of red rock. Up the gully, a slide of {w.sand} buries the path to the archaeologists’ camp. Fermín, a digger, has been at it for three days. Watch him dig.',
        done: s => !!s.flags.ruinsSlide, target: T, hint: '{mimo} points up the gully, at the man with the shovel.' },
      { ruins: true, text: 'Find Elvira, the head archaeologist, at the dig camp',
        why: 'Fermín says the whole camp went strange and gray in the storm. Elvira, the head of the dig, is under the striped canopy.',
        done: s => !!s.flags.ruinsChief, target: T, hint: '{mimo} points at the striped canopy in the middle of the camp.' },
      { ruins: true, text: 'Dig up the camp’s lost things and give each one back, saying whose it is ({n}/4)', n: s => RUINS.thingsN(s),
        get why() { const m = RUINS.yoursModel ? pl(RUINS.yoursModel('alarm', L(), 'dario')) : ''; return `The storm buried everyone’s things under little mounds of {w.sand}. Dig them up, then give each one back and say whose it is, the way Elvira gave Fermín his hat${m ? `: «${m}»` : ''}.`; },
        done: s => !!s.flags.ruinsThings, target: T, hint: '{mimo} sniffs at a little mound of {w.sand}… or at someone gray who lost something.' },
      { ruins: true, text: 'Read the Wall of Days in the old town, with Salomé ({n}/6)', n: s => RUINS.panelsN(s),
        why: 'Salomé can read again! The Wall of Days, on the old town’s west side, tells the day of the bell keeper who rang the temple’s {w.bell}, in six carved panels.',
        done: s => !!s.flags.ruinsWall, target: T, hint: '{mimo} points at the carved wall in the old town.' },
      { ruins: true, text: 'Open the Door of Days: tell it your own morning ({n}/3 suns)', n: s => RUINS.sunsN(s),
        get why() { const l = L(), m = ['getup', 'wash', 'dress'].map(k => pl(RUINS.routineModel(k, l, 1))).join(' '); return `The {w.temple}’s door only opens for someone who tells it their own morning, like the bell keeper’s on the Wall: three things you do. «${m}»`; },
        done: s => !!s.flags.ruinsDoor, target: T, hint: '{mimo} points at the carved door at the north end of the canyon.' },
      { ruins: true, text: 'Ring the {w.temple}’s {w.bell}, deep under the {w.sand}: the seventh {w.bell}',
        why: 'Behind the Door of Days, the sunken {w.temple} goes down and down: the {w.sand} hall, the drowned hall, the bell keeper’s own room, and the {w.bell} at the bottom. Something big sleeps under it.',
        done: s => !!s.flags.ruinsFree, target: () => (inTemple() && RUINS_TEMPLE.target ? RUINS_TEMPLE.target() : T()), hint: '{mimo} looks down the dark steps. The {w.bell} is at the very bottom.' },
      { ruins: true, report: 'elvira', text: '💬 Report to Elvira at the dig camp',
        why: 'The {w.temple}’s {w.bell} rings again! Elvira will want to hear it from you, and she saw a girl with a notebook come through here.',
        done: s => !!s.flags.ruinsReport, target: () => (RUINS.person && RUINS.person('elvira')) || T(), hint: '{mimo} points at Elvira, under the striped canopy.' },
      { ruins: true, marshPointer: true, text: 'The eighth {w.bell}: the Gray Marsh, past the old north road’s gate ({n}/8 bells rung)', n: s => s.flags.bells || 0,
        why: 'Noa’s page from the {w.temple}: she went north, to the Gray Marsh at the foot of the Old Tower. Quino’s ship sails you back to Port Brisa; the old north road starts past the Old Quarter, behind Alba’s cemetery.',
        done: s => !!(s.flags.marsh || s.flags.marshFog), target: () => { const Y = G.sim.you; if (RUINS.inBox(Y.x, Y.z, 4)) return (RUINS.person && RUINS.person('quino')) || RUINS.LANDING; return typeof MARSH !== 'undefined' && MARSH.wayIn ? MARSH.wayIn() : null; },
        hint: '{mimo} points back down the gully, at the ship… and then far to the north.' },
    ];
    const k = main.steps.findIndex(s => s.ruinsPointer || (/Sunken Ruins/.test(s.text || '') && !s.ruins));
    if (k >= 0) main.steps.splice(k + 1, 0, ...steps);
    else main.steps.push(Object.assign({ ruins: true, ruinsPointer: true, text: 'The seventh {w.bell}: the big ship from Port Brisa to the Sunken Ruins ({n}/8 bells rung)', n: s => s.flags.bells || 0,
      why: 'The seventh {w.bell} is in the Sunken Ruins, a desert canyon down the coast. Quino’s ship sails there from Port Brisa’s long pier.', done: s => !!s.flags.ruins, target: () => RUINS.wayIn(), hint: '{mimo} points at the big ship at the long pier.' }), ...steps);
    main.story.push(
      { when: s => !!s.flags.ruinsSlide, text: 'Quino’s ship sailed out of a sea cave into a cove of red rock. Up the gully, Fermín the digger showed {mimo} a new word with his shovel, and {mimo} dug the slide of {w.sand} away in two minutes.' },
      { when: s => !!s.flags.ruinsChief, text: 'At the dig camp, everyone was gray. Elvira, the head archaeologist, had {mimo} dig up Fermín’s hat and gave it back to him, saying whose it was.' },
      { when: s => !!s.flags.ruinsThings, text: 'You dug up the camp’s lost things and gave each one back, saying whose it was. Darío got up, Nadia dried her face, Salomé put on her glasses, Gaspar combed his hair.' },
      { when: s => !!s.flags.ruinsWall, text: 'With Salomé you read the Wall of Days: the bell keeper got up with the sun, washed at the fountain, combed her hair… and rang the {w.bell}, every day.' },
      { when: s => !!s.flags.ruinsDoor, text: 'You told the Door of Days your own morning, three things you do, and it sank into the {w.sand}.' },
      { when: s => !!s.flags.ruinsFree, text: 'Down in the sunken {w.temple}, {mimo} dug, swam, and you told the bell keeper’s tiles what she did. You beat the Great Worm by the {w.bell}. Noa’s page: she went north, to the Gray Marsh. Then the {w.temple}’s {w.bell} rang out: seven bells of eight.' });
    // a side quest (never tracked by itself: you pick it in the quest log)
    const sh = s => (RUINS.shardsN ? RUINS.shardsN(s) : 0);
    if (!QUESTS.LIST.some(q => q.id === 'ruins.jar')) QUESTS.LIST.push({ id: 'ruins.jar', kind: 'side', title: 'Tula’s {w.jar}', giver: 'Tula, the kid at the dig camp (the Sunken Ruins)',
      started: s => !!(s.ruins && s.ruins.tula),
      steps: [
        { text: 'Dig up the four pieces of Tula’s {w.jar}: mounds with a little red flag ({n}/4)', n: s => Math.min(4, sh(s)),
          why: 'The storm broke Tula’s {w.jar} and the {w.sand} swallowed the pieces. She stuck little red flags where she thinks they are, all over the canyon.',
          done: s => sh(s) >= 4, target: () => { const Y = G.sim.you, left = RUINS.SHARDS.filter(p => !(G.state.ruins && G.state.ruins.shards || []).includes(p.id)); let b = null; for (const p of left) if (!b || Math.hypot(p.x - Y.x, p.z - Y.z) < Math.hypot(b.x - Y.x, b.z - Y.z)) b = p; return b; },
          hint: '{mimo} spots a little red flag sticking out of the {w.sand}.' },
        { text: 'Give the pieces back to Tula', why: 'Tula is waiting at the camp, by her little table.', done: s => !!(s.ruins && s.ruins.tulaDone),
          target: () => (RUINS.person && RUINS.person('tula')) || RUINS.SPOT.tula, hint: '{mimo} points at Tula, at the camp.' },
      ] });
  }
})();
