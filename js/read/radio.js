'use strict';
// RADIO: the radio (DESIGN.md 15.4). Shows at natural speed, two voices where it fits: news that follows your progress
// (content lines carry `when: { bells: 1 }`), the weather, a cooking show, a call-in show, a kids' story hour. The words stay
// hidden until you answer the show's question, or ask for them; then DICT.log('listen', band, grade) (or 'read', if you
// looked at the words first, or the computer has no voice for the language: READER.listen decides).
// WHERE: one in the library (library.js puts RADIO.model() on its side table) and one in public: on Alba's inn's terrace, on
// the blue-parasol table by its door (the main street, SPOT below; registered in SIDES.md). No new solids.
//   RADIO.init(game) · RADIO.outdoor(dt, t, you) (READ.update) · RADIO.tune(where) · RADIO.model() → { g, update(dt, t, on) }
//   RADIO.mapMarks(dpr) · RADIO.playingAt ('library' | 'inn' | null) · RADIO._ (tests)

const RADIO = (() => {
  // (the inn's door is at (−3.1, −130), facing the main street, west; its blue-parasol terrace table is at (−4.1, −127.4), its top
  // 0.79 up: the radio stands on it, between the two mugs, facing the street)
  const SPOT = { x: -3.82, z: -127.42, yaw: -Math.PI / 2 };
  const STATION = { es: 'Radio Alba 98.6', pt: 'Rádio Alba 98,6', de: 'Radio Alba 98,6', zh: '[阿尔巴|Ā ěr bā] [电台|diàn tái] 98.6', ja: 'ラジオ アルバ 98.6', en: 'Radio Alba 98.6' };
  const KIND = { news: '📰', weather: '⛅', cooking: '🍲', callin: '☎', kids: '📖', music: '🎵' };
  let G = null, OUT = null, playingAt = null;
  const on = () => READ.on('radio');
  const station = () => READ.plain(STATION[READ.lang] || STATION.en);

  // ------------------------------------------------------------ the radio itself: a wooden box with a cloth grille, a dial, two knobs
  function grilleTex() {
    return ZHF.canvasTex(256, 160, c => {
      c.fillStyle = '#d9c9a0'; c.fillRect(0, 0, 256, 160);
      c.strokeStyle = 'rgba(90,60,30,.35)'; c.lineWidth = 2; for (let x = 0; x < 256; x += 6) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 160); c.stroke(); } for (let y = 0; y < 160; y += 6) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
      c.strokeStyle = '#6b4a2e'; c.lineWidth = 8; c.beginPath(); c.arc(128, 80, 58, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); c.beginPath(); c.arc(128, 80, 38, Math.PI * 1.15, Math.PI * 1.85); c.stroke();
    });
  }
  function dialTex() {
    return ZHF.canvasTex(256, 64, c => {
      c.fillStyle = '#f6e7b4'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#5a3a22'; c.font = '700 18px "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      [88, 92, 96, 100, 104, 108].forEach((f, i) => c.fillText(String(f), 24 + i * 42, 22));
      for (let i = 0; i < 26; i++) c.fillRect(14 + i * 9, 40, 2, i % 2 ? 6 : 12);
      c.fillStyle = '#c2412f'; c.fillRect(24 + 2.65 * 42 - 2, 30, 4, 30);
    });
  }
  function model() {
    const g = new THREE.Group(), k = ZHF.Kit();
    k.box(0, 0.2, 0, 0.62, 0.4, 0.3, '#8a5a32').box(0, 0.42, 0, 0.66, 0.05, 0.33, '#6b4a2e');
    k.add(ZHF.GEO.half, '#8a5a32', 0, 0.42, 0, 0.31, 0.12, 0.15, 0, 0, 0, { ink: 0.01 });
    for (const x of [-0.2, 0.2]) k.cyl(x, 0.09, 0.16, 0.045, 0.03, '#3a2a22', { rx: Math.PI / 2, ink: 0.004 });
    k.rod([0.22, 0.45, -0.05], [0.4, 0.95, -0.12], 0.008, '#c9c9c9', { ink: 0 }).ball(0.4, 0.95, -0.12, 0.018, 0.018, 0.018, '#c9c9c9', { ink: 0 });
    ZHF.bake(g, k);
    const grille = ZHF.plane(0.42, 0.22, grilleTex()); grille.position.set(0, 0.24, 0.152); g.add(grille);
    const dial = ZHF.plane(0.34, 0.07, dialTex()); dial.position.set(0, 0.09, 0.152); g.add(dial);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffcf7a', transparent: true, opacity: 0, depthWrite: false })); glow.scale.setScalar(0.55); glow.position.set(0, 0.1, 0.2); g.add(glow);
    const notes = [0, 1, 2].map(i => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex(), transparent: true, opacity: 0, depthWrite: false })); s.scale.setScalar(0.16); g.add(s); return s; });
    return {
      g, glow,
      update(dt, t, playing) {
        glow.material.opacity = playing ? 0.5 + 0.15 * Math.sin(t * 6) : 0.12;
        notes.forEach((s, i) => { const ph = (t * 0.6 + i / 3) % 1; s.material.opacity = playing ? Math.sin(ph * Math.PI) * 0.9 : 0; s.position.set(Math.sin(ph * 5 + i) * 0.18, 0.5 + ph * 0.55, 0.05); });
      },
    };
  }
  let NOTE = null;
  function noteTex() {
    if (NOTE) return NOTE;
    NOTE = ZHF.canvasTex(64, 64, c => { c.fillStyle = '#2b2235'; c.beginPath(); c.ellipse(22, 46, 11, 8, -0.4, 0, Math.PI * 2); c.fill(); c.fillRect(30, 10, 5, 36); c.beginPath(); c.moveTo(35, 10); c.quadraticCurveTo(52, 16, 48, 30); c.quadraticCurveTo(46, 22, 35, 20); c.fill(); });
    return NOTE;
  }

  // ------------------------------------------------------------ outside: on the inn's terrace table (town.js's blue-parasol table, by its door)
  function buildOutside() {
    if (!G || typeof ZHF === 'undefined' || typeof TOWN === 'undefined') return null;
    const g = new THREE.Group(); g.name = 'radio-inn'; const GY = TOWN.GY || 0.25;
    g.position.set(SPOT.x, GY + 0.79, SPOT.z); g.rotation.y = SPOT.yaw; G.w3d.scene.add(g);
    const r = model(); r.g.rotation.y = 0.25; r.g.scale.setScalar(0.78); g.add(r.g);
    return { g, r, solids: [], at: { x: SPOT.x - 1.35, z: SPOT.z } };
  }
  function outdoor(dt, t, you) {
    if (!G) return;
    const live = on() && !!(G.state && G.state.flags && G.state.flags.hatched);
    if (!OUT && !live) return;
    if (!OUT) { try { OUT = buildOutside() || { broken: true }; } catch (e) { console.error('[radio]', e); OUT = { broken: true }; } }
    if (OUT.broken) return;
    const town = G.town && G.town.group, vis = live && !(G.indoors && G.indoors()) && (!town || town.visible);
    OUT.g.visible = vis;
    for (const sd of OUT.solids) { if (!WORLD.extra.includes(sd)) WORLD.extra.push(sd); if (!sd.home) sd.home = { x: sd.x, z: sd.z }; sd.x = vis ? sd.home.x : 1e5; sd.z = vis ? sd.home.z : 1e5; }
    if (vis) OUT.r.update(dt, t, playingAt === 'inn');
  }
  const PROVIDER = {
    interactables() {
      if (!G || !OUT || OUT.broken || !on() || !G.state.flags.hatched) return [];
      return [{ x: OUT.at.x, z: OUT.at.z, r: 1.5, label: 'Listen', run: () => tune('inn') }];
    },
  };

  // ------------------------------------------------------------ tune in: pick a show, listen, answer
  function onNow(shows) {
    const s = G && G.state ? G.state.time || 0 : 0;
    return shows.length ? shows[Math.floor(s / 150) % shows.length] : null;          // (a new show "on air" every 2½ minutes of play)
  }
  // (EXTRA: other programs on the station, listed first; each provider's menu(where) → [{ label, sub, run(where) }]. D1's quiz show)
  const EXTRA = [];
  async function tune(where) {
    const shows = READ.list('radio'), extra = [];
    for (const P of EXTRA) { try { extra.push(...(P.menu(where) || [])); } catch (e) { console.error('[radio] extra', e); } }
    if (!shows.length && !extra.length) return;
    const now = onNow(shows), st = READ.S().shows;
    const order = shows.length ? [now].concat(shows.filter(x => x !== now)) : [];
    const was = G.sim.lock; G.sim.lock = 1;
    let show;
    try {
      show = await UI.choose(`📻 ${station()}: what’s on?`, extra.map(x => ({ label: x.label, sub: x.sub, value: x })).concat(order.map((x, i) => ({
        label: `${KIND[x.kind] || '📻'} ${READ.plain(x.title)} · ${READ.BAND(x.band)}`,
        sub: `${x.en || ''}${i === 0 ? ' · on now' : ''}${st[x.id] ? ` · heard${st[x.id].grades && st[x.id].grades.length ? ' (' + READ.best(st[x.id].grades) + ')' : ''}` : ''}`, value: x }))));
    } finally { G.sim.lock = was; }
    if (!show) return;
    if (typeof Sound !== 'undefined') try { Sound.play('click'); } catch (e) { /* */ }
    if (show.run) { playingAt = where; try { return await show.run(where); } finally { playingAt = null; } }
    playingAt = where;
    let res = null;
    try { res = await READER.listen(show, { station: station(), icon: KIND[show.kind] || '📻' }); }
    finally { playingAt = null; }
    const r = READ.record('shows', show.id, { t: Date.now() }); r.n = (r.n || 0) + 1;
    if (res && res.grades) r.grades = (r.grades || []).concat(res.grades.filter(Boolean)).slice(-8);
    READ.save();
    return res;
  }

  // ------------------------------------------------------------ the mini-map: a little radio at the inn's table
  const MARK = {};
  function mapMarks(dpr) {
    if (!G || !OUT || OUT.broken || !on()) return [];
    const k = String(dpr);
    if (!MARK[k]) {
      const cv = document.createElement('canvas'), s = 16; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = '#8a5a32'; c.strokeStyle = '#2b2235'; c.lineWidth = 1.2; c.beginPath(); c.rect(2, 5, 12, 9); c.fill(); c.stroke();
      c.fillStyle = '#d9c9a0'; c.beginPath(); c.arc(6.4, 9.5, 2.6, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(10, 5); c.lineTo(13, 1.5); c.stroke();
      MARK[k] = cv;
    }
    return [{ x: SPOT.x, z: SPOT.z, img: MARK[k] }];
  }

  function init(game) {
    G = game;
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
  }
  return {
    init, outdoor, tune, model, mapMarks, STATION, SPOT, extra: EXTRA,
    get playingAt() { return playingAt; },
    _: { onNow, buildOutside, get OUT() { return OUT; } },
  };
})();
