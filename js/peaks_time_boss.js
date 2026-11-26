'use strict';
// The Frost Peaks' two time bosses (DESIGN.md 20 "T3b"): plug-ins on battle/flow.js (BATTLE._.plugins), fought through TIME.fight so the
// world's tense rules apply (battle/timebattle.js). Both work with the verbal dodges (battle/react.js: their attacks open ↑ / ↓ windows)
// and with «y» chains (battle/chain.js: a chain's every clause lands, crits and all; a broken chain lands nothing).
//   'owl_blizzard', the Blizzard Owl (the White Hollow, long ago): a huge white owl wrapped in its own storm, which kept the night a
//     boy got lost inside it. Phase 1: commands told as memories land («{mimo} sopló…», «{mimo} saltó…»; blowing is two hits: it
//     scatters the storm); the present only confuses {mimo}. Four hits and the storm is gone: it can't remember the night, and asks
//     three things, which you answer with both pasts (PKPTXT.TASKS owl1 «Era medianoche cuando el niño se perdió», owl2 «La relojera lo
//     encontró», owl3 «Cuando la relojera llegó, el niño tenía frío»). It remembers, and gives back Elio's echo.
//   'gray_cuckoo', the Gray Cuckoo (tomorrow's tower): the great clock's cuckoo, frozen half out of its door. Tomorrow nobody takes
//     orders, only advice: «Yo que tú, saltaría sobre el cuco» (es; pt «No seu lugar, eu pularia…», de «An deiner Stelle würde ich…
//     springen», zh «要是我是你，我会跳…», ja «わたしだったら、跳びます» / «跳んだほうがいいです»), chains too («…saltaría y golpearía»).
//     Three hits and it hides in its clock and calls an hour, «¡Cucú! ¡Cucú! ¡Cucú!»: guess what time it would have been when it
//     stopped («Serían las tres»), twice; then it asks what you'd do in its place («Yo que tú, cantaría otra vez»), and sings.
// Each has its own song (peaks_time_music.js: 'boss_pk_owl', 'boss_pk_cuckoo'), bestiary line, icon and voice. Neither takes your last heart.
//   PKBOSS.fightOwl() · PKBOSS.fightCuckoo() · PKBOSS.fightAdvice(opts) (any fight in tomorrow's tower: advice works as a command)
//   PKBOSS.letter('past' | 'future') · PKBOSS.advice(text, lang) (the advice → command reading, for tests)
const PKBOSS = (() => {
  const BT = typeof BATTLE !== 'undefined' ? BATTLE : null, _ = BT && BT._;
  const Q = () => (typeof PEAKT !== 'undefined' ? PEAKT : null);
  const lang = () => (Q() ? Q().lang() : 'es');
  const isC = () => lang() === 'zh' || lang() === 'ja';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fillM = s => (Q() ? Q().fillMimo(s, lang()) : String(s || '').replace(/\{mimo\}/g, 'Mimo'));
  const lineOf = (TAB, key) => { const T = (TAB || {})[key] || {}, l = lang(); return [fillM(T[l] || T.en || ''), Q() ? Q().fillEn(T.en || '') : String(T.en || '')]; };
  const RANK = 'SABCD';
  const LETTERS = { past: [], future: [] };
  function letter(w) { const L0 = LETTERS[w] || []; if (!L0.length) return 'B'; const avg = L0.reduce((a, x) => a + RANK.indexOf(x), 0) / L0.length; return RANK[Math.max(0, Math.min(4, Math.round(avg)))]; }
  const playSong = name => { try { if (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(name)) Sound.setSong(name); } catch (e) { /* */ } };
  const isTense = (c, ts) => !!(c && c.tb && ts.includes(c.tb.tense));
  const PT = () => (typeof PKPTXT !== 'undefined' ? PKPTXT : null), FT = () => (typeof PKFTXT !== 'undefined' ? PKFTXT : null);

  // ------------------------------------------------------------ the models: a round white owl; a gray clock-house with its cuckoo
  function glowSp(col, s, o) { const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: col, transparent: true, opacity: o, depthWrite: false })); gl.scale.setScalar(s); return gl; }
  function anchorsOf(body, list) { const a = {}; list.forEach(([n, p]) => { const o = new THREE.Object3D(); o.position.set(...p); body.add(o); a[n] = o; }); return a; }
  function owlModel() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const k = PAST.API.Kit(), KG = PAST.API.KG;
    k.add(KG.sphere, 0, 1.1, 0, 1.0, 1.1, 0.9, '#f4f8fb').add(KG.sphere, 0, 0.95, 0.42, 0.72, 0.82, 0.52, '#e2ebf3', { ink: 0.01 });
    for (const s of [-1, 1]) {
      k.add(KG.cyl, s * 0.38, 1.55, 0.78, 0.3, 0.06, 0.3, '#ffd24a', { rx: Math.PI / 2, ink: 0.012 }).add(KG.cyl, s * 0.38, 1.55, 0.82, 0.13, 0.04, 0.13, '#2b2235', { rx: Math.PI / 2, ink: 0 });
      k.add(KG.cone4, s * 0.55, 2.2, 0.2, 0.12, 0.45, 0.1, '#e6eef5', { rz: -s * 0.35, ink: 0.01 });
      k.add(KG.sphere, s * 0.95, 1.0, -0.05, 0.3, 0.78, 0.62, '#d8e4ee', { rz: s * 0.25, ink: 0.012 });
      k.add(KG.cone, s * 0.25, 0.1, 0.38, 0.08, 0.22, 0.08, '#c9a24a', { rx: Math.PI / 2, ink: 0.006 });
    }
    k.add(KG.cone, 0, 1.33, 0.92, 0.08, 0.22, 0.08, '#e8a03a', { rx: Math.PI / 2 + 0.4, ink: 0.006 });
    for (let i = 0; i < 6; i++) k.add(KG.cone4, (i - 2.5) * 0.18, 0.7 + (i % 2) * 0.12, 0.86, 0.05, 0.1, 0.03, '#c6d4e0', { rx: Math.PI, ink: 0 });
    const inner = new THREE.Group(); body.add(inner); k.build(inner);
    const gl = glowSp('#cfe8ff', 4.2, 0.35); gl.position.y = 1.1; root.add(gl);
    const anchors = anchorsOf(body, [['top', [0, 2.5, 0]], ['mid', [0, 1.1, 0.5]], ['head', [0, 1.6, 0.5]], ['face', [0, 1.5, 0.9]], ['feet', [0, 0.05, 0]]]);
    return { root, body, inner, gl, anchors, kind: 'owl_blizzard', scale: 1, radius: 1.1, height: 2.5, parts: [], labelH: 3.0, hover: 0, L: {} };
  }
  function poseOwl(h, F, t) {
    const storm = FXO ? FXO.storm : 1;
    h.body.position.y = Math.sin(t * 1.6) * 0.06; h.inner.rotation.y = Math.sin(t * 0.7) * 0.18;
    h.inner.rotation.z = FXO && FXO.phase === 2 ? Math.sin(t * 2.4) * 0.07 : 0;
    h.gl.material.opacity = 0.18 + 0.3 * storm + 0.06 * Math.sin(t * 3);
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }
  const poseOwlIdle = (root, t) => { const b = root && root.children[0]; if (b) { b.position.y = Math.sin(t * 1.2) * 0.04; b.rotation.y = Math.sin(t * 0.4) * 0.1; } };
  function cuckooModel() {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const k = PAST.API.Kit(), KG = PAST.API.KG, wood = '#8a8690', dark = '#5e5a66';
    k.box(0, 1.2, 0, 2.2, 2.4, 1.1, wood).box(0, 2.62, 0, 2.5, 0.12, 1.3, dark, { ink: 0.01 });
    for (const s of [-1, 1]) k.box(s * 0.68, 2.95, 0, 1.5, 0.12, 1.4, dark, { rz: -s * 0.62, ink: 0.012 });
    k.add(KG.cyl, 0, 1.25, 0.56, 0.62, 0.05, 0.62, '#c8c4ce', { rx: Math.PI / 2, ink: 0.01 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; k.box(Math.sin(a) * 0.52, 1.25 + Math.cos(a) * 0.52, 0.6, 0.05, 0.12, 0.02, '#3a3640', { rz: -a, ink: 0 }); }
    k.box(0, 2.15, 0.56, 0.5, 0.45, 0.04, '#2b2730', { ink: 0 });
    for (const s of [-1, 1]) { k.rod([s * 0.5, 0, 0.3], [s * 0.5, -0.9, 0.3], 0.03, '#6a6670', 0); k.add(KG.cone4, s * 0.5, -1.05, 0.3, 0.16, -0.36, 0.16, dark, { ink: 0.006 }); }
    const inner = new THREE.Group(); body.add(inner); k.build(inner);
    const hands = new THREE.Group(); hands.position.set(0, 1.25, 0.62); body.add(hands);
    const hk = PAST.API.Kit(); hk.box(0, 0.18, 0, 0.06, 0.36, 0.02, '#2b2235', { ink: 0 }).box(0.12, 0.06, 0.01, 0.24, 0.05, 0.02, '#2b2235', { ink: 0 }); hk.build(hands, { shadow: false });
    const bird = new THREE.Group(); bird.position.set(0, 2.15, 0.6); body.add(bird);
    const bk = PAST.API.Kit();
    bk.add(KG.sphere, 0, 0, 0.1, 0.26, 0.24, 0.34, '#b8b4c0').add(KG.sphere, 0, 0.22, 0.32, 0.18, 0.18, 0.18, '#c8c4ce', { ink: 0.01 }).add(KG.cone, 0, 0.22, 0.56, 0.05, 0.16, 0.05, '#d8a05a', { rx: Math.PI / 2, ink: 0.004 });
    for (const s of [-1, 1]) { bk.add(KG.ball6, s * 0.08, 0.28, 0.46, 0.035, 0.035, 0.02, '#2b2235', { ink: 0 }); bk.add(KG.sphere, s * 0.22, 0.02, 0.05, 0.08, 0.16, 0.24, '#a8a4b0', { rz: s * 0.4, ink: 0.008 }); }
    bk.build(bird);
    const pend = new THREE.Group(); pend.position.set(0, 0.05, 0.2); body.add(pend);
    const pk = PAST.API.Kit(); pk.rod([0, 0, 0], [0, -1.1, 0], 0.03, '#a8a4b0', 0).add(KG.cyl, 0, -1.2, 0, 0.22, 0.05, 0.22, '#a8a4b0', { rx: Math.PI / 2, ink: 0.006 }); pk.build(pend, { shadow: false });
    const gl = glowSp('#c8c4e0', 3.6, 0.2); gl.position.y = 1.4; root.add(gl);
    const anchors = anchorsOf(body, [['top', [0, 3.3, 0]], ['mid', [0, 1.4, 0.6]], ['head', [0, 2.4, 0.9]], ['face', [0, 2.4, 1.1]], ['feet', [0, 0.05, 0]]]);
    return { root, body, inner, gl, anchors, hands, bird, pend, kind: 'gray_cuckoo', scale: 1, radius: 1.2, height: 3.1, parts: [], labelH: 3.6, hover: 0, L: {} };
  }
  function poseCuckoo(h, F, t) {
    const out = FXC ? FXC.out : 0.5;
    h.bird.position.z = 0.6 + out * 0.55; h.bird.rotation.x = -out * 0.2 + Math.sin(t * 5) * 0.04 * out;
    h.pend.rotation.z = FXC && FXC.phase >= 2 ? Math.sin(t * 2.6) * 0.35 : Math.sin(t * 0.9) * 0.05;
    h.hands.rotation.z = FXC && FXC.phase >= 2 ? -t * 0.6 : 0;
    h.gl.material.opacity = 0.16 + 0.06 * Math.sin(t * 2);
    if (F && F.sx) h.body.scale.set(F.sx, F.sy || 1, F.sx);
  }

  // ------------------------------------------------------------ advice, tomorrow: «Yo que tú, saltaría…» read as Mimo's move
  // (the advice frame comes off, each conditional / advised verb becomes the plain command, and the parser reads that with the realm's
  // tense set aside, so chains, targets and crits work as in any fight; r.advice says it was advice, r.raw keeps what you typed)
  const ES_IRR = { haría: 'haz', pondría: 'pon', saldría: 'sal', tendría: 'ten', vendría: 'ven', diría: 'di', subiría: 'sube', iría: 've' };
  const PT_IRR = { subiria: 'sobe', faria: 'faz', diria: 'diz', poria: 'põe', iria: 'vai', traria: 'traz' };
  const DE_IMP = { springen: 'spring', schlagen: 'schlag', schieben: 'schieb', anschieben: 'schieb', pusten: 'puste', wegpusten: 'puste', anpusten: 'puste', blasen: 'blas', wegblasen: 'blas', klettern: 'kletter', singen: 'sing', essen: 'iss', werfen: 'wirf', hauen: 'hau', hüpfen: 'hüpf', treten: 'tritt', rufen: 'ruf', graben: 'grab', trinken: 'trink' };
  const JA_TE = [
    ['跳びます', '跳んで'], ['とびます', 'とんで'], ['tobimasu', 'tonde'], ['跳んだ', '跳んで'], ['とんだ', 'とんで'], ['tonda', 'tonde'],
    ['打ちます', '打って'], ['うちます', 'うって'], ['uchimasu', 'utte'], ['打った', '打って'], ['うった', 'うって'], ['utta', 'utte'],
    ['叩きます', '叩いて'], ['たたきます', 'たたいて'], ['tatakimasu', 'tataite'], ['叩いた', '叩いて'], ['たたいた', 'たたいて'], ['tataita', 'tataite'],
    ['押します', '押して'], ['おします', 'おして'], ['oshimasu', 'oshite'], ['押した', '押して'], ['おした', 'おして'], ['oshita', 'oshite'],
    ['吹きます', '吹いて'], ['ふきます', 'ふいて'], ['fukimasu', 'fuite'], ['吹いた', '吹いて'], ['ふいた', 'ふいて'], ['fuita', 'fuite'],
    ['登ります', '登って'], ['のぼります', 'のぼって'], ['noborimasu', 'nobotte'], ['登った', '登って'], ['のぼった', 'のぼって'], ['nobotta', 'nobotte'],
    ['歌います', '歌って'], ['うたいます', 'うたって'], ['utaimasu', 'utatte'], ['歌った', '歌って'], ['うたった', 'うたって'], ['utatta', 'utatte'],
    ['投げます', '投げて'], ['なげます', 'なげて'], ['nagemasu', 'nagete'], ['投げた', '投げて'], ['なげた', 'なげて'], ['nageta', 'nagete'],
    ['食べます', '食べて'], ['たべます', 'たべて'], ['tabemasu', 'tabete'], ['食べた', '食べて'], ['たべた', 'たべて'], ['tabeta', 'tabete'],
  ];
  function advice(text, l) {
    let t = String(text || '').trim(), frame = false, verbs = 0;
    const mimo = Q() ? Q().mimoName() : 'Mimo', vocRe = new RegExp('^\\s*(' + [mimo, 'mimo', '米莫', 'ミモ', 'mi ?mo'].map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\s*[,，、]?\\s*', 'i');
    t = t.replace(vocRe, '');
    if (l === 'es' || l === 'pt') {
      const F = l === 'es' ? /^[¡!¿]?\s*(yo que t[uú]|yo en tu lugar|en tu lugar|si yo fuera t[uú])\s*,?\s*/i : /^[!]?\s*(no seu lugar|no teu lugar|se eu fosse voc[eê]|se eu fosse tu)\s*,?\s*(eu\s+)?/i;
      if (F.test(t)) { t = t.replace(F, ''); frame = true; }
      const F2 = l === 'es' ? /^(ser[ií]a mejor|deber[ií]as|tendr[ií]as que|podr[ií]as)\s+/i : /^(seria melhor|voc[eê] deveria|tu deverias|deveria|voc[eê] poderia)\s+/i;
      let inf = false; if (F2.test(t)) { t = t.replace(F2, ''); frame = true; inf = true; }
      if (l === 'pt') t = t.replace(/^eu\s+/i, '');
      const IRR = l === 'es' ? ES_IRR : PT_IRR;
      // the conditional (and, after «sería mejor», the infinitive) → the command; an «y» chain keeps its every verb
      t = t.replace(/\b([a-záéíóúâêôãõçñü]+?)([aei])r(?:ía|ia)\b/gi, (m, st, v) => { const lw = m.toLowerCase(); verbs++; if (IRR[lw]) return IRR[lw]; return st + (v === 'a' ? 'a' : 'e'); });
      if (inf) t = t.replace(/\b([a-záéíóúâêôãõçñü]{2,}?)([aei])r\b/gi, (m, st, v) => { const lw = m.toLowerCase(); if (['por', 'ser', 'ver', 'ir'].includes(lw)) return m; verbs++; if (l === 'es' && lw === 'subir') return 'sube'; if (l === 'pt' && lw === 'subir') return 'sobe'; return st + (v === 'a' ? 'a' : 'e'); });
    } else if (l === 'de') {
      const F = /^(an deiner stelle|wenn ich du w[äa]re|ich an deiner stelle|es w[äa]re besser|du solltest|du k[öo]nntest)\s*,?\s*/i;
      if (F.test(t)) { t = t.replace(F, ''); frame = true; }
      t = t.replace(/\b(w[üu]rde|w[üu]rdest|sollte|solltest)\b\s*(ich|du)?\s*/gi, () => { frame = true; return ''; }).replace(/\b(ich|du)\s+/gi, '').replace(/\bzu\s+(?=\S+\s*$)/i, '');
      // each clause: its infinitive (at the end) goes first, as the command
      t = t.split(/\s+und\s+(?:dann\s+)?/i).map(cl => {
        const w = cl.trim().replace(/[.!]+$/, '').split(/\s+/); if (!w.length) return cl;
        const last = (w[w.length - 1] || '').toLowerCase(), imp = DE_IMP[last.replace(/ae/g, 'ä').replace(/ue/g, 'ü')] || DE_IMP[last];
        if (!imp) return cl; verbs++;
        return [imp].concat(w.slice(0, -1)).join(' ');
      }).join(' und ');
    } else if (l === 'zh') {
      const F = /^(要是我是你|如果我是你|我要是你|换了我|要是我|yao ?shi wo shi ni|ru ?guo wo shi ni|yàoshi wǒ shì nǐ|rúguǒ wǒ shì nǐ)\s*[,，]?\s*/i;
      if (F.test(t)) { t = t.replace(F, ''); frame = true; }
      t = t.replace(/^(我会|我就会|我就|我|wo ?hui|wǒ ?huì|wo)\s*/i, m => { if (/会|hui|huì/i.test(m)) frame = true; return ''; });
      t = t.replace(/(最好|zui ?hao|zuì ?hǎo)\s*/gi, () => { frame = true; return ''; }).replace(/(^|[，,]\s*(然后|ran ?hou|ránhòu)?\s*)(会|hui|huì)\s*/gi, '$1');
      verbs = frame ? 1 : 0;
    } else if (l === 'ja') {
      const F = /^(わたし|私|ぼく|僕|watashi|boku)?\s*(だったら|なら|dattara|nara)\s*[、,]?\s*/i;
      if (F.test(t)) { t = t.replace(F, ''); frame = true; }
      if (/(ほう|方)\s*が\s*(いい|良い)|hou ?ga ?ii/i.test(t)) { frame = true; t = t.replace(/\s*(ほう|方)\s*が\s*(いい|良い)\s*(です|でしょう)?/g, '').replace(/\s*hou ?ga ?ii\s*(desu)?/gi, ''); }
      for (const [a, b] of JA_TE) if (t.includes(a)) { t = t.split(a).join(b); verbs++; }
      t = t.replace(/\s*(です|desu)\s*[。.!！]?$/i, '');
    }
    return { text: t.trim(), advice: frame || verbs > 0, frame, verbs };
  }
  let ADV_ON = false, PK_FIGHT = false;
  // German: {mimo} blows *on* things («die Eule anpusten», «hat … angepustet», «pustete … an»); the battle's verb table knows
  // «pusten» / «blasen», so the separable forms are read as those (what you typed stays in the bubble)
  const deBlow = t => String(t).replace(/\b(an|weg)(gepustet|geblasen)\b/gi, '$2').replace(/\b(an|weg)(pusten|blasen)\b/gi, '$2')
    .replace(/\b(pustete|pustet|puste|blies|bläst|blas)\b([^,.;!?]*?)\s+(an|weg)\b(?=\s*(?:und\b|,|\.|!|$))/gi, '$1$2');
  function hookParse() {
    if (!_ || !_.P || _.P.pkAdvice) return;
    const P = _.P, p0 = P.parse;
    P.parse = function (text, ctx) {
      if (PK_FIGHT && ctx && ctx.L && ctx.L.code === 'de' && !ctx.pkInner) {
        const t2 = deBlow(text);
        if (t2 !== text) { const r0 = P.parse.call(this, t2, Object.assign({}, ctx, { pkDe: true })); if (r0 && r0.raw === t2) r0.raw = text; return r0; }
      }
      if (!ADV_ON || !ctx || !ctx.L || ctx.pkInner) return p0.call(this, text, ctx);
      const a = advice(String(text), ctx.L.code);
      if (!a.advice) return p0.call(this, text, ctx);
      const r = p0.call(this, a.text, Object.assign({}, ctx, { tbSkip: true, pkInner: true }));
      if (r && r.ok) { r.raw = text; r.advice = a.frame ? 'frame' : 'bare'; }
      return r;
    };
    P.pkAdvice = true;
  }

  // ------------------------------------------------------------ the battle's hooks: species, models, labels, the bestiary
  function hook() {
    if (!_) return;
    const SP = { owl_blizzard: PT() ? PT().SPECIES : null, gray_cuckoo: FT() ? FT().SPECIES : null };
    for (const [id, table] of Object.entries(SP)) if (table) for (const [lg, sp] of Object.entries(table)) { const Lg = _.LANGS && _.LANGS[lg]; if (Lg && Lg.species && !Lg.species[id]) { Lg.species[id] = Object.assign({}, sp); delete Lg.I; delete Lg.CJ; } }
    const Mo = _.M;
    if (Mo && !Mo.pkHooked) {
      Mo.pkHooked = true; const b0 = Mo.build, p0 = Mo.pose, br0 = Mo.brighten, k0 = Mo.kindOf;
      Mo.kindOf = k => (String(k || '') === 'owl_blizzard' ? 'owl_blizzard' : String(k || '') === 'gray_cuckoo' ? 'gray_cuckoo' : k0(k));
      Mo.build = o => (o && o.kind === 'owl_blizzard' ? owlModel() : o && o.kind === 'gray_cuckoo' ? cuckooModel() : b0(o));
      Mo.pose = (h, F, t, dt) => (h && h.kind === 'owl_blizzard' ? poseOwl(h, F, t, dt) : h && h.kind === 'gray_cuckoo' ? poseCuckoo(h, F, t, dt) : p0(h, F, t, dt));
      Mo.brighten = (h, k) => (h && (h.kind === 'owl_blizzard' || h.kind === 'gray_cuckoo') ? undefined : br0(h, k));
    }
    const U = _.UI;
    if (U && U.label && !U.pkHooked) { U.pkHooked = true; const lb0 = U.label; U.label = function (f, html) { return lb0.call(this, f, f && (f.species === 'owl_blizzard' || f.species === 'gray_cuckoo') ? bossLabel(f) : html); }; }
    if (_.RW && _.RW.LORE) {
      if (PT() && !_.RW.LORE['boss:owl_blizzard']) _.RW.LORE['boss:owl_blizzard'] = PT().LORE;
      if (FT() && !_.RW.LORE['boss:gray_cuckoo']) _.RW.LORE['boss:gray_cuckoo'] = FT().LORE;
    }
    if (_.RW && _.RW.KIND_EN) { _.RW.KIND_EN.owl_blizzard = 'the Blizzard Owl'; _.RW.KIND_EN.gray_cuckoo = 'the Gray Cuckoo'; }
    if (_.UI && _.UI.ICON) {
      if (!_.UI.ICON.owl_blizzard) _.UI.ICON.owl_blizzard = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><ellipse cx="32" cy="36" rx="20" ry="22" fill="#f4f8fb" stroke="#2b2235" stroke-width="3"/><path d="M14 18 L22 26 M50 18 L42 26" stroke="#2b2235" stroke-width="3"/><circle cx="24" cy="30" r="7" fill="#ffd24a" stroke="#2b2235" stroke-width="2.4"/><circle cx="40" cy="30" r="7" fill="#ffd24a" stroke="#2b2235" stroke-width="2.4"/><circle cx="24" cy="30" r="2.6" fill="#2b2235"/><circle cx="40" cy="30" r="2.6" fill="#2b2235"/><path d="M29 38 L32 43 L35 38 Z" fill="#e8a03a" stroke="#2b2235" stroke-width="2"/></svg>';
      if (!_.UI.ICON.gray_cuckoo) _.UI.ICON.gray_cuckoo = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path d="M10 26 L32 8 L54 26 Z" fill="#5e5a66" stroke="#2b2235" stroke-width="3"/><rect x="14" y="26" width="36" height="30" fill="#8a8690" stroke="#2b2235" stroke-width="3"/><circle cx="32" cy="44" r="8" fill="#c8c4ce" stroke="#2b2235" stroke-width="2.4"/><circle cx="32" cy="22" r="6" fill="#b8b4c0" stroke="#2b2235" stroke-width="2.4"/><path d="M37 22 L44 21 L37 25 Z" fill="#d8a05a" stroke="#2b2235" stroke-width="1.6"/></svg>';
    }
    _.plugins = _.plugins || {}; _.plugins.owl_blizzard = PO; _.plugins.gray_cuckoo = PC;
    try { if (typeof BFX !== 'undefined' && BFX.VOICES) { if (!BFX.VOICES.owl_blizzard) BFX.VOICES.owl_blizzard = { m: 55, vow: ['u', 'o', 'u'], len: 0.14, gap: 0.06 }; if (!BFX.VOICES.gray_cuckoo) BFX.VOICES.gray_cuckoo = { m: 76, vow: ['u', 'u', 'o'], len: 0.1, gap: 0.08 }; } } catch (e) { /* (no battle sounds) */ }
    hookParse();
  }
  function bossLabel(f) {
    const l = lang(), owl = f.species === 'owl_blizzard', N = owl ? (PT() ? PT().NAMES.boss : {}) : (FT() ? FT().NAMES.boss : {});
    const name = isC() && typeof CJK !== 'undefined' ? CJK.html(N[l] || N.en || '', { lang: l }) : esc(N[l] || N.en || '');
    const FX = owl ? FXO : FXC, max = owl ? 4 : 3, left = FX ? Math.max(0, max - FX.hits) : max, p2 = FX && FX.phase >= 2, qs = owl ? 3 : 3;
    return `<div class="bt-chips"><span class="bt-chip name">${name}</span></div><div class="bt-hpbar"><i style="width:${Math.round(100 * (p2 ? (qs - FX.answered) / qs : left / max))}%"></i><span>${p2 ? '?' : (owl ? '❄ ' : '⏰ ') + left}</span></div>`;
  }
  // an answer in the box, graded as yours (not a command): PEAKT.grade with the world's task
  async function answerAsk(K, T0, tips) {
    const Pp = _ && _.P; if (!Pp || !Q()) return null;
    const parse0 = Pp.parse, lg = lang(); let tip = null;
    const was = ADV_ON; ADV_ON = false;
    Pp.parse = function (text, ctx) {
      const g = Q().grade(T0, text, lg, tips);
      if (g.ok) return { ok: true, kind: 'answer', raw: text, grade: g, clauses: [] };
      if (g.kind !== 'none' && g.why) tip = g.why;
      return parse0.call(this, text, ctx);
    };
    try {
      const frame = Q().plainT(fillM((T0.frame || {})[lg] || '')), chips = ((T0.chips || {})[lg] || []).map(([x, e]) => `${Q().plainT(x)} (${e})`).join(' · ');
      const r = await K.askOrFlee('command', { hint: `«${frame}»${chips ? ' · ___ = ' + chips : ''}` });
      if (r && r.kind !== 'answer' && tip) r.tip = tip;
      return r;
    } finally { Pp.parse = parse0; ADV_ON = was; }
  }
  // a wave thrown at you or {mimo} (a gust, a snow roll, a peck, the pendulum): where it's coming from, then dodge it out loud
  function waveSprite(text, col) {
    const cv = document.createElement('canvas'), c = cv.getContext('2d'), font = '900 64px "Segoe UI", "Yu Gothic UI", "Microsoft YaHei", sans-serif';
    c.font = font; cv.width = Math.min(1024, Math.ceil(c.measureText(text).width) + 56); cv.height = 104;
    c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 14; c.strokeStyle = col[0]; c.strokeText(text, cv.width / 2, 54); c.fillStyle = col[1]; c.fillText(text, cv.width / 2, 54);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false, depthWrite: false }));
    sp.scale.set(0.55 * cv.width / cv.height, 0.55, 1); sp.renderOrder = 12; return sp;
  }
  async function wave(K, FX, TAB, keys, col) {
    const { G: BG, A: AC, ST } = K, f = FX.f;
    if (BG.hearts <= 1) return;
    const high = Math.random() < 0.5, tgt = Math.random() < 0.5 ? AC.mimo : AC.you, key = high ? keys[0] : keys[1];
    const dw = BG.L && BG.L.dodgeWords ? BG.L.dodgeWords(BG.tier) : null, [cry, cryEn] = lineOf(TAB, key);
    const dTxt = isC() && typeof CJK !== 'undefined' ? CJK.plain(cry, { lang: lang() }) : cry, where = (dw && (high ? dw.high : dw.low)) || (high ? '↑' : '↓');
    ST.shot('action', f, tgt, { yaw: 0.04, up: 0.7 });
    K.say(f, `${dTxt} … ${where}`, { cls: 'foe shout boss', en: `${cryEn} ${high ? 'up high' : 'down low'}`, dur: K.readTime(dTxt + where) + 2.0 });
    K.emit('shout', { text: dTxt, high, foe: f, boss: true }); K.dodgeHint(true);
    await K.wait(K.readTime(dTxt + where) + 0.15);
    K.emit('windup', { foe: f, high, boss: true });
    const Tm = BG.t + 0.8, keyc = high ? 'ArrowDown' : 'ArrowUp';
    const tp = K.timingWindow(Tm, keyc, () => ST.worldOf(tgt, 'mid'), { onPress: code => K.dodgeMove(tgt, code) });
    const spr = waveSprite(dTxt.replace(/[!！¡]/g, '').trim().slice(0, 18) || '…', col), a = ST.worldOf(f, 'face'), b = ST.worldOf(tgt, high ? 'top' : 'feet');
    ST.prop(spr); spr.position.copy(a);
    await K.along(0.8, u => { spr.position.lerpVectors(a, b, u * 1.06); spr.position.y += Math.sin(u * Math.PI) * (high ? 0.45 : 0.12); spr.material.rotation = Math.sin(u * 12) * 0.15; });
    const grade = await tp;
    ST.dropProp(spr);
    K.dodgeResult(f, tgt, grade, 1, {});
    if (BG.hearts < 1) { BG.hearts = 1; K.UI.hearts(BG.hearts, BG.maxHearts, BG.name); }
    await K.wait(0.4);
  }
  // how many hits a command lands: each clause that counts (blowing: two), none if its chain broke
  function landed(r, counts) {
    if (!r || r.kind !== 'command' || !r.clauses) return 0;
    if (r.chain && r.chain.broken) return 0;
    let n = 0; for (const c of r.clauses) if (counts(c)) n += c.verb === 'blow' ? 2 : 1;
    return n;
  }

  // ------------------------------------------------------------ the Blizzard Owl (the Past)
  let FXO = null;
  const fo = key => lineOf(PT() && PT().FIGHT, key);
  const sayO = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fo(key); K.say(st0, t, { cls, en, dur }); };
  const PO = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'owl_blizzard'); if (!f) { FXO = null; return; }
      FXO = { f, hits: 0, phase: 1, turn: 0, answered: 0, storm: 1, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.past = [];
      playSong('boss_pk_owl');
    },
    floor: f => (f && f.species === 'owl_blizzard' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXO) return 'flee';
      const f = FXO.f, TAC = _ && _.tac;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 11 });
      sayO(K, f, 'intro', 3.2); K.emit('boss', { foe: f });
      await K.wait(3.0);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXO.phase === 1) {
          if (FXO.turn === 0) { sayO(K, FXO.coachSt, 'coach', 4.6, 'coach'); await K.wait(3.4); }
          if (TAC && TAC.turn) { try { await TAC.turn(); } catch (e) { console.error('[pkboss] tac turn', e); } }
          const r = await K.askOrFlee('command');
          FXO.turn++;
          const past = !!(r && r.clauses && r.clauses.some(c => isTense(c, ['pret', 'impf'])));
          await K.perform(r);
          const n = past ? landed(r, c => isTense(c, ['pret', 'impf'])) : 0;
          if (n > 0) {
            FXO.hits = Math.min(4, FXO.hits + n); FXO.storm = Math.max(0, 1 - FXO.hits / 4);
            ST.star(ST.worldOf(f, 'head'), '#e6f4ff', 1.1); K.emit('knockdown'); K.refreshLabels();
            const blew = r.clauses.some(c => c.verb === 'blow');
            sayO(K, f, blew ? 'clear' : 'ouch', 1.9, 'foe boss'); await K.wait(1.0);
          } else if (r && r.kind === 'command' && !past) { sayO(K, FXO.coachSt, 'now', 2.6, 'coach'); await K.wait(1.4); }
          if (FXO.hits >= 4) { await owlDazed(K); continue; }
          await wave(K, FXO, PT() && PT().FIGHT, ['gust', 'roll'], ['#e6f4ff', '#4a6f9a']);
          if (TAC && TAC.afterFoes) { try { await TAC.afterFoes(); } catch (e) { console.error('[pkboss] tac after', e); } }
        } else {
          const T0 = PT().TASKS[['owl1', 'owl2', 'owl3'][FXO.answered]];
          const r = await answerAsk(K, T0, PT().TIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.past.push(L0); UI.toast(`${L0} · ${r.grade.why}${r.grade.tip ? ' · ' + r.grade.tip : ''}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXO.answered++; K.refreshLabels();
            if (FXO.answered >= 3) { await owlGives(K); return 'win'; }
            sayO(K, f, FXO.answered === 1 ? 'q2' : 'q3', 3.8); await K.wait(3.0);
          } else {
            const [t, en] = fo('answer'); K.say(FXO.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.4 }); await K.wait(2.2);
          }
        }
      }
    },
    async foePhase(K) { if (FXO && FXO.phase === 1) await wave(K, FXO, PT() && PT().FIGHT, ['gust', 'roll'], ['#e6f4ff', '#4a6f9a']); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function owlDazed(K) {
    const { A: AC, ST } = K, f = FXO.f;
    FXO.phase = 2; FXO.storm = 0; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 }); ST.shake(0.25, 0.3); Sound.play('pip');
    await K.wait(0.8);
    sayO(K, f, 'dazed', 4.6); await K.wait(4.0);
    sayO(K, FXO.coachSt, 'answer', 3.2, 'coach'); await K.wait(1.8);
  }
  async function owlGives(K) {
    const { A: AC, ST } = K, f = FXO.f;
    sayO(K, f, 'remember', 3.2); Sound.play('chime'); await K.wait(2.6);
    sayO(K, f, 'win', 4.8); ST.shot('focus', AC.mimo, f, { up: 0.8, dist: 9 });
    await K.wait(3.6);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the Gray Cuckoo (the Future)
  let FXC = null;
  const fc = key => lineOf(FT() && FT().FIGHT, key);
  const sayC = (K, st0, key, dur, cls = 'foe shout boss') => { const [t, en] = fc(key); K.say(st0, t, { cls, en, dur }); };
  const HOURS = [2, 3, 4, 5, 6];
  const PC = {
    setup(K) {
      const { G: BG } = K, f = BG.foes.find(x => x.species === 'gray_cuckoo'); if (!f) { FXC = null; return; }
      FXC = { f, hits: 0, phase: 1, turn: 0, answered: 0, hour: 3, lastHour: 0, out: 0.4, coachSt: { kind: 'noa', x: -3.2, y: 1.6, z: -2.6, talk: 0, flash: 0 } };
      f.isBoss = true; LETTERS.future = [];
      playSong('boss_pk_cuckoo');
    },
    floor: f => (f && f.species === 'gray_cuckoo' ? 1 : 0),
    async main(K) {
      const { G: BG, A: AC, ST } = K; if (!FXC) return 'flee';
      const f = FXC.f;
      BG.winLine = null; f.x = f.hx; f.z = f.hz; f.hidden = false;
      await K.intro({ foes: false });
      K.refreshLabels();
      ST.shot('focus', AC.mimo, f, { up: 1.2, dist: 11.5 });
      sayC(K, f, 'intro', 3.4); K.emit('boss', { foe: f });
      // (no plans in this fight, only advice and guesses: the Future's plan rung and queue stay out of it; the rung shows advice)
      const rung = html => { try { if (K.UI && K.UI.rung) K.UI.rung(html); } catch (e) { /* */ } };
      const SX = Q() ? Q().sx : () => '';
      rung(`The Gray Cuckoo · give advice: <b>${esc(SX('advice2'))}</b>`);
      await K.wait(3.0);
      for (;;) {
        BG.turn++; K.refreshLabels();
        if (FXC.phase === 1) {
          if (FXC.turn === 0) { sayC(K, FXC.coachSt, 'coach', 4.8, 'coach'); await K.wait(3.6); }
          const r = await K.askOrFlee('command');
          FXC.turn++;
          if (r && r.kind === 'command' && r.advice) {
            await K.perform(r);
            const n = landed(r, () => true);
            if (n > 0) { FXC.hits = Math.min(3, FXC.hits + n); ST.star(ST.worldOf(f, 'head'), '#fff3a0', 1.1); K.emit('knockdown'); K.refreshLabels(); sayC(K, f, 'ouch', 1.9, 'foe boss'); await K.wait(1.0); }
          } else if (r && r.kind === 'command') {
            // an order or a plan: nobody takes orders tomorrow, and {mimo} waits for advice
            const plan = !!(r.clauses && r.clauses.some(c => isTense(c, ['fut'])));
            K.mimoReact && K.mimoReact('confused');
            sayC(K, FXC.coachSt, plan ? 'plan' : 'order', 3.4, 'coach'); await K.wait(2.0);
          }
          if (FXC.hits >= 3) { await cuckooHides(K); continue; }
          await wave(K, FXC, FT() && FT().FIGHT, ['peck', 'swing'], ['#e8e4f4', '#5a5470']);
        } else if (FXC.phase === 2) {
          // it calls the hour it stopped at: count, and guess
          let h = HOURS[(Math.random() * HOURS.length) | 0]; if (h === FXC.lastHour) h = HOURS[(HOURS.indexOf(h) + 1 + ((Math.random() * 3) | 0)) % HOURS.length]; FXC.hour = h; FXC.lastHour = h;
          ST.shot('focus', AC.you, f, { up: 1.0, dist: 9.5 });
          for (let i = 0; i < h; i++) { FXC.out = 1; Sound.play('pip'); try { if (typeof PKMUSIC !== 'undefined') PKMUSIC.cuckoo(); } catch (e) { /* */ } const [t0] = fc('hoot'); K.say(f, t0, { cls: 'foe boss', dur: 0.6 }); await K.wait(0.55); FXC.out = 0.3; await K.wait(0.25); }
          sayC(K, f, FXC.answered ? 'q2' : 'dazed', 3.8); await K.wait(2.6);
          const T0 = FT().hourTask(h);
          rung(`The Gray Cuckoo · guess the hour: <b>${esc(SX('hour'))}</b>`);
          const r = await answerAsk(K, T0, FT().TIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.future.push(L0); UI.toast(`${L0} · ${r.grade.why}${r.grade.tip ? ' · ' + r.grade.tip : ''}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.0 }); await K.wait(1.2);
            FXC.answered++; ST.star(ST.worldOf(f, 'head'), '#fff3a0', 1.2); K.refreshLabels();
            if (FXC.answered >= 2) { FXC.phase = 3; K.refreshLabels(); sayC(K, f, 'ask', 4.4); await K.wait(3.4); }
          } else {
            const [t, en] = fc('guess'); K.say(FXC.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.4 }); await K.wait(1.8);
            await wave(K, FXC, FT() && FT().FIGHT, ['peck', 'swing'], ['#e8e4f4', '#5a5470']);
          }
        } else {
          // what would you do, in its place? (advice for the cuckoo itself: sing again)
          rung(`The Gray Cuckoo · advise it: <b>${esc(Q() ? Q().plainT(fillM((FT().TASKS.cuckoo.model || {})[lang()] || '')) : '')}</b>`);
          const r = await answerAsk(K, FT().TASKS.cuckoo, FT().TIPS);
          if (r && r.kind === 'answer') {
            const L0 = r.grade.letter; LETTERS.future.push(L0); UI.toast(`${L0} · ${r.grade.why}${r.grade.tip ? ' · ' + r.grade.tip : ''}`);
            K.say(AC.you, r.raw, { cls: 'you', dur: 2.2 }); await K.wait(1.4);
            FXC.answered++; K.refreshLabels();
            await cuckooSings(K); return 'win';
          }
          const [t, en] = fc('advise'); K.say(FXC.coachSt, r && r.tip ? r.tip : t, { cls: 'coach', en: r && r.tip ? '' : en, dur: 3.4 }); await K.wait(2.2);
        }
      }
    },
    async foePhase(K) { if (FXC && FXC.phase === 1) await wave(K, FXC, FT() && FT().FIGHT, ['peck', 'swing'], ['#e8e4f4', '#5a5470']); },
    async end(K, outcome) {
      if (outcome === 'flee') await K.fleeScene(); else if (outcome === 'lose' && K.loseScene) await K.loseScene();
      else if (outcome === 'win') await K.wait(0.6);
    },
  };
  async function cuckooHides(K) {
    const { A: AC, ST } = K, f = FXC.f;
    FXC.phase = 2; FXC.out = 0; K.refreshLabels();
    ST.shot('focus', AC.you, f, { up: 0.8, dist: 8.5 }); ST.shake(0.2, 0.25); Sound.play('crunch');
    await K.wait(0.8);
    sayC(K, FXC.coachSt, 'guess', 3.4, 'coach'); await K.wait(2.0);
  }
  async function cuckooSings(K) {
    const { A: AC, ST } = K, f = FXC.f;
    FXC.out = 1; sayC(K, f, 'remember', 3.2); Sound.play('chime'); await K.wait(2.4);
    try { if (typeof PKMUSIC !== 'undefined') PKMUSIC.play('pk_cuckoo', 4); } catch (e) { /* */ }
    sayC(K, f, 'win', 4.8); ST.shot('focus', AC.mimo, f, { up: 1.0, dist: 9.5 });
    await K.wait(3.6);
    f.hp = 0; f.alive = false; K.refreshLabels();
    await K.wait(0.6);
  }

  // ------------------------------------------------------------ the fights (through TIME.fight: the world's tense, its realm)
  async function fightOwl() {
    hook();
    const C = Q() ? Q().CAVE : { x: 235, z: -273.8 };
    PK_FIGHT = true;
    try { return await TIME.fight({ boss: 'owl_blizzard', foes: [{ kind: 'owl_blizzard', color: 'white', size: 'big', giant: 1.1, hp: 40 }], place: { x: C.x, z: C.z, biome: 'snow' }, tb: { scene: () => false } }); } finally { PK_FIGHT = false; }
  }
  async function fightAdvice(opts) { hook(); ADV_ON = true; PK_FIGHT = true; try { return await TIME.fight(opts); } finally { ADV_ON = false; PK_FIGHT = false; } }
  // a fight in the Past's tense (the White Hollow's ambush): only the German reading of «angepustet» on top
  async function fightMemories(opts) { hook(); PK_FIGHT = true; try { return await TIME.fight(opts); } finally { PK_FIGHT = false; } }
  async function fightCuckoo() {
    const D = Q() ? Q().DOOR : { x: 240, z: -273.4 };
    return fightAdvice({ boss: 'gray_cuckoo', foes: [{ kind: 'gray_cuckoo', color: 'white', size: 'big', giant: 1, hp: 40 }], place: { x: D.x, z: D.z, biome: 'cellar' }, tb: { noGlimpse: true, noQueue: true } });
  }
  try { hook(); } catch (e) { console.error('[pkboss] hooks', e); }
  return { init: () => { try { hook(); } catch (e) { console.error('[pkboss] hooks', e); } }, hook, fightOwl, fightCuckoo, fightAdvice, fightMemories, letter, owlModel, cuckooModel, poseOwlIdle, advice, PO, PC,
    get FXO() { return FXO; }, get FXC() { return FXC; }, get adviceOn() { return ADV_ON; } };
})();
