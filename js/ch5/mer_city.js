'use strict';
// Chapter 5, «Meridiana» (CH5-W1; DESIGN.md 21.22): the city, a room module in main.js's ROOMS, in a layer of its own at y 600 (nothing
// else uses it; the y-300 registry is untouched). The city is a set of district pads over the unwalkable far west (x −450…−270,
// z −100…62): only the pad you're in is shown, its ground is a WORLD platform that answers only while you're in it, and its solids are
// its own (WORLD.pushOut is wrapped while you're inside). Each pad has a sky, haze, light, a skyline and a song of its own.
//   MER.pad(id, def)          a district (later waves add theirs): { x, z, w, d, sky, fog, song, indoor }
//   MER.go(id, at, o)         into a pad (from anywhere: Alba's platform, another pad, a load); MER.leave(to)
//   MER.items(id, fn)         a provider of interactables on a pad: fn() → [{ x, z (pad coords), r, label, run, y? }]
//   MER.person(id, pad, at)   one of the cast (mer_text.js CAST) standing on a pad; MER.say / fam / you / think
//   MER.tram.ride(to)         the tram between the pads' stops; MER.noise: the overworld noise (mer_noise.js fights)
//   ownMap / mapMarks / mapDots / areaAt (minimap.js), inside / OUTSIDE / interactables / update / target / song (main.js ROOMS)
// State: G.state.ch5 = { v, news, tix, rode, arrived, inCity, at: { pad, x, z, yaw }, card, flags… } (the scenes own the rest).
const MER = (() => {
  if (typeof THREE === 'undefined' || typeof WORLD === 'undefined' || typeof MERB === 'undefined' || !MERB) return null;
  const Y0 = 600;
  let G = null, inside = false, cur = null, busy = false, lightsWas = null, skyM = null, birds = null;
  const PADS = {}, BUILT = {}, ITEMS = {}, PEOPLE = {}, MAPS = {};
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const lang = () => (G && G.state && G.state.lang) || 'es';
  const isCl = l => l === 'zh' || l === 'ja';
  const X = () => MERTXT;
  const plainT = (s, l = lang()) => (isCl(l) && typeof CJK !== 'undefined' ? CJK.plain(String(s || ''), { lang: l }) : String(s || ''));
  const snd = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* (no audio yet) */ } };
  const S = () => { const s = G.state; return s.ch5 || (s.ch5 = { v: 1 }); };
  const save = () => { try { G.save(); } catch (e) { /* */ } };
  function pad(id, def) { PADS[id] = Object.assign({ id, y: Y0, w: 80, d: 70 }, def); return PADS[id]; }
  // wave 1's pads (later waves add theirs at (−330, 20), (−250, …): the platform box below covers x −470…−200, z −110…62)
  pad('centro', { x: -400, z: -60, w: 84, d: 72, sky: ['#5fa8e8', '#f6dfb8'], fog: ['#ecdcc0', 90, 420], song: 'mer_centro' });
  pad('casa', { x: -320, z: 25, w: 18, d: 14, indoor: true, fog: ['#3a2c26', 18, 60], song: 'mer_home' });
  pad('uni', { x: -400, z: 25, w: 90, d: 72, sky: ['#6aaee8', '#f2e4c4'], fog: ['#e8e2cc', 90, 420], song: 'mer_uni' });
  pad('puerto', { x: -320, z: -60, w: 90, d: 72, sky: ['#5aa6e2', '#f0e6cc'], fog: ['#e2e8e4', 100, 460], song: 'mer_market' });
  const P = () => (cur && PADS[cur]) || null;
  const toW = (id, lx, lz) => { const p = PADS[id]; return { x: p.x + lx, z: p.z + lz }; };
  // the text in the save's language, plain (the builders' signs)
  const T = { sign: k => plainT(X().pick(X().SIGNS[k] || {}, lang())), stop: k => plainT(X().pick(X().STOPS[k] || {}, lang())) };
  function built(id) {
    if (BUILT[id]) return BUILT[id];
    const p = PADS[id]; if (!p) return null;
    const o = MERB.build(id, p, T); if (!o) return null;
    o.root.visible = false; G.w3d.scene.add(o.root);
    o.solids = o.solids || []; o.extra = [];          // (extra: people's solids, moved with them)
    return (BUILT[id] = o);
  }
  // ------------------------------------------------------------ the ground and the walls (only while you're in the city)
  function groundY(x, z) { const p = P(), b = p && BUILT[cur]; if (!b) return null; const lx = x - p.x, lz = z - p.z; if (Math.abs(lx) > p.w / 2 + 6 || Math.abs(lz) > p.d / 2 + 6) return null; return p.y + (b.ground ? b.ground(lx, lz) : 0); }
  WORLD.addPlatforms([{ box: [-470, -200, -110, 62], top: Y0, fn: (x, z) => (inside ? groundY(x, z) : null) }]);
  function pushOne(c, x, z, r) {
    if (c.obox) {
      const cs = Math.cos(c.rot || 0), sn = Math.sin(c.rot || 0);
      let lx = (x - c.x) * cs - (z - c.z) * sn, lz = (x - c.x) * sn + (z - c.z) * cs;
      const qx = clamp(lx, -c.hw, c.hw), qz = clamp(lz, -c.hd, c.hd), dx = lx - qx, dz = lz - qz, d = Math.hypot(dx, dz);
      if (d >= r) return [x, z];
      if (d > 1e-4) { lx = qx + dx / d * r; lz = qz + dz / d * r; } else if (c.hw - Math.abs(lx) < c.hd - Math.abs(lz)) lx = Math.sign(lx || 1) * (c.hw + r); else lz = Math.sign(lz || 1) * (c.hd + r);
      return [c.x + lx * cs + lz * sn, c.z - lx * sn + lz * cs];
    }
    const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
    if (d < m && d > 1e-4) return [c.x + dx / d * m, c.z + dz / d * m];
    return [x, z];
  }
  const p0 = WORLD.pushOut;
  WORLD.pushOut = function (x, z, r) {
    if (!inside || !cur || !BUILT[cur]) return p0.call(this, x, z, r);
    const b = BUILT[cur], p = P();
    for (const c of b.solids) { if (Math.abs(x - c.x) > 16 || Math.abs(z - c.z) > 16) continue; [x, z] = pushOne(c, x, z, r); }
    for (const c of b.extra) { if (Math.abs(x - c.x) > 4 || Math.abs(z - c.z) > 4) continue; [x, z] = pushOne(c, x, z, r); }
    const wk = b.walk || [-p.w / 2 + 2, p.w / 2 - 2, -p.d / 2 + 2, p.d / 2 - 2];
    return [clamp(x, p.x + wk[0], p.x + wk[1]), clamp(z, p.z + wk[2], p.z + wk[3])];
  };
  // ------------------------------------------------------------ the sky (a dome that follows the camera), the light, the haze
  function sky() {
    if (skyM) return skyM;
    const u = { uTop: { value: new THREE.Color('#5fa8e8') }, uHor: { value: new THREE.Color('#f6dfb8') }, uSun: { value: V(0.3, 0.9, 0.2).normalize() } };
    skyM = new THREE.Mesh(new THREE.SphereGeometry(460, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: u,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; varying vec3 vDir; void main(){ float h = clamp(vDir.y, 0.0, 1.0); vec3 col = mix(uHor, uTop, pow(h, 0.55)); col += vec3(1.0, 0.92, 0.7) * pow(max(dot(vDir, uSun), 0.0), 9.0) * 0.35; gl_FragColor = vec4(col, 1.0); }' }));
    skyM.renderOrder = -1; skyM.frustumCulled = false; skyM.visible = false; skyM.userData.u = u; G.w3d.scene.add(skyM);
    return skyM;
  }
  function lights(on) {
    const sc = G.w3d.scene, hemi = sc.children.find(o => o.isHemisphereLight), sun = sc.children.find(o => o.isDirectionalLight);
    if (on) { if (!lightsWas) lightsWas = { hc: hemi && hemi.color.clone(), hg: hemi && hemi.groundColor.clone(), sc: sun && sun.color.clone() }; }
    else if (lightsWas) { if (hemi) { hemi.color.copy(lightsWas.hc); hemi.groundColor.copy(lightsWas.hg); } if (sun) sun.color.copy(lightsWas.sc); lightsWas = null; }
    return { hemi, sun };
  }
  // ------------------------------------------------------------ in and out
  function showOnly(id) { for (const [k, b] of Object.entries(BUILT)) b.root.visible = k === id; }
  // into a pad: at = { x, z, yaw } in the pad's own coordinates (or a spot name of the build's), o: { quiet, world: true (at is in world coordinates) }
  function go(id, at, o = {}) {
    const p = PADS[id]; if (!p) return false;
    const b = built(id); if (!b) return false;
    try { if (G.indoorMod && G.indoorMod() && G.indoorMod() !== api && G.indoorMod().leave) G.indoorMod().leave(); } catch (e) { /* */ }
    inside = true; cur = id; showOnly(id);
    const s = sky(); s.visible = !p.indoor;
    if (!p.indoor) { s.userData.u.uTop.value.set(p.sky[0]); s.userData.u.uHor.value.set(p.sky[1]); }
    G.w3d.setInterior({ fog: p.fog[0], near: p.fog[1], far: p.fog[2] });
    lights(true);
    const sp = typeof at === 'string' ? (b.spots[at] || {}) : (at || b.spots.entry || b.spots.stop || { x: 0, z: 0 });
    const wx = o.world ? sp.x : p.x + (sp.x || 0), wz = o.world ? sp.z : p.z + (sp.z || 0), yaw = sp.yaw !== undefined ? sp.yaw : Math.PI;
    const Y = G.sim.you; Y.x = wx; Y.z = wz; Y.yaw = yaw; Y.y = groundY(wx, wz) || p.y;
    const M = G.sim.mimo; M.x = wx + Math.sin(yaw + 2.4) * 1.1; M.z = wz + Math.cos(yaw + 2.4) * 1.1; M.wander = null; M.station = null;
    G.sim.snap(); G.cam.snap(yaw, 0.3, p.indoor ? 7.5 : 8.5);
    const st = S(); st.inCity = true; st.at = { pad: id, x: wx - p.x, z: wz - p.z, yaw };
    (st.seen = st.seen || {})[id] = true;
    if (!o.quiet) save();
    return true;
  }
  // out of the city (to Alba's platform, by train): the outdoors come back
  function leave(to) {
    if (!inside) return;
    inside = false; showOnly(null); if (skyM) skyM.visible = false;
    G.w3d.setInterior(null); lights(false); G.fx.birds = null;
    G.cam.override = null;
    const st = S(); st.inCity = false;
    if (to === 'alba') { const Y = G.sim.you; Y.x = 2.2; Y.z = 62.2; Y.yaw = Math.PI; G.sim.mimo.x = 3.2; G.sim.mimo.z = 61.2; G.sim.snap(); G.cam.snap(Math.PI, 0.28, 8.5); save(); }
  }
  // ------------------------------------------------------------ the cast: people standing on a pad (finale.js FIN.person rigs)
  function person(id, padId, at, o = {}) {
    const C = X().CAST[id] || { name: { en: id }, look: {} }, b = built(padId), p = PADS[padId]; if (!b) return null;
    const key = padId + ':' + (o.key || id);
    if (PEOPLE[key]) { place(PEOPLE[key], at); PEOPLE[key].g.visible = o.hidden ? false : true; return PEOPLE[key]; }
    const look = Object.assign({}, C.look, o.look || {});
    const Pp = FIN.person(id, look, b.root, { x: at.x, y: 0, z: at.z, yaw: at.yaw || 0 });
    Pp.pad = padId; Pp.key = key; Pp.cast = id; Pp.look = look;
    Object.defineProperty(Pp.api, 'name', { get: () => plainT(X().name(id, lang())), set() {}, configurable: true });
    Pp.api.look = look;
    Pp.solid = { x: 1e5, z: 1e5, r: o.r || (look.kid ? 0.34 : 0.42) }; b.extra.push(Pp.solid);
    PEOPLE[key] = Pp; place(Pp, at);
    if (o.hidden) Pp.g.visible = false;
    return Pp;
  }
  // place someone at pad coordinates (the rig lives in the pad's group; its api in world coordinates, for bubbles and distances)
  function place(Pp, at) {
    const p = PADS[Pp.pad], b = BUILT[Pp.pad], lx = at.x, lz = at.z, gy = b && b.ground ? b.ground(lx, lz) : 0;
    Pp.g.position.set(lx, gy, lz); if (at.yaw !== undefined) { Pp.api.yaw = at.yaw; Pp.g.rotation.y = at.yaw; }
    Pp.api.x = p.x + lx; Pp.api.z = p.z + lz; Pp.api.y = p.y + gy;
    if (Pp.solid) { Pp.solid.x = Pp.g.visible === false ? 1e5 : Pp.api.x; Pp.solid.z = Pp.g.visible === false ? 1e5 : Pp.api.z; }
  }
  function show(Pp, on) { if (!Pp) return; Pp.g.visible = !!on; if (Pp.solid) { Pp.solid.x = on ? Pp.api.x : 1e5; Pp.solid.z = on ? Pp.api.z : 1e5; } }
  const faceTo = (Pp, x, z) => { Pp.api.yaw = Math.atan2(x - Pp.api.x, z - Pp.api.z); Pp.g.rotation.y = Pp.api.yaw; };
  // lines: the weave's (mixed, whole in the language as it rises); the family's: whole English; yours: English with Mimo's words
  const fillM = (t, l) => (FIN && FIN.fillMimo ? FIN.fillMimo(t, l) : String(t || ''));
  function say(Pp, k, o = {}) {
    const a = Pp && (Pp.api || Pp); if (!a) return Promise.resolve();
    const x = X().line(k, lang()), l = lang();
    a.lines = { en: String(x.en || '').replace(/\{mimo\}/g, (G.state.mimoName || 'Mimo')), [l]: fillM(x.t || '', l) };
    return STORY.sayInline(a, o.whole ? 'tl' : undefined);
  }
  // (whole English: MERTXT.en fills in the city's words in the save's language: {dins}, {hola}…)
  const enOf = k => String(X().en(k, lang()) || k).replace(/\{mimo\}/g, G.state.mimoName || 'Mimo');
  function fam(Pp, k) { const a = Pp && (Pp.api || Pp); if (!a) return Promise.resolve(); a.lines = { en: enOf(k) }; return STORY.sayInline(a); }
  const you = k => STORY.you(enOf(k));
  const think = (k, d) => STORY.think(enOf(k), d);
  const lock = on => { G.sim.lock = on ? 1 : 0; if (!on) G.cam.override = null; };
  const wait = s => STORY.wait(s);
  // a camera shot in pad coordinates: [x, y, z] from, [x, y, z] at
  function shot(f, at, dur = 0.9) { const p = P(); if (!p) return; G.cam.override = { pos: V(p.x + f[0], p.y + f[1], p.z + f[2]), look: V(p.x + at[0], p.y + at[1], p.z + at[2]), dur }; }
  // a card to read (the language; EN on request): T = { tag: {…}, es: '…', en: '…' }
  async function card(T0) {
    const l = lang(), txt = plainT(X().pick(T0, l)), esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const body = isCl(l) && typeof CJK !== 'undefined' ? CJK.html(X().pick(T0, l), { lang: l }) : esc(txt);
    snd('page');
    await UI.card(`<div class="tag">${esc(plainT(X().pick(T0.tag || {}, l)))}</div><div class="caption">${body}</div><div class="row"><button data-act="say" data-text="${esc(txt)}">🔊</button><button data-act="en">EN</button></div><div class="en">${esc(T0.en || '')}</div><div class="sub">E to close</div>`, { kind: 'page' });
    try { if (typeof DICT !== 'undefined' && DICT.log) DICT.log('read', 4, 1); } catch (e) { /* */ }
  }
  // a TALK scene (mer_text.js MERTXT.scene) with one of the cast; the register chip under their name; resolves TALK.play's result
  async function talk(id, Pp, o = {}) {
    const sc = X().scene(id, lang(), o); if (!sc || typeof TALK === 'undefined') return { quit: true };
    const reg = (X().SC[id] || {}).reg, person = Pp ? Object.assign(Pp.api, { look: Pp.look }) : null;
    const st = S();
    // (the first time it matters, a one-line tip in the talk itself: what the chip under a name means)
    let note = o.note; if (reg && !st.regTip) { st.regTip = true; note = '💬 ' + enOf('tip.reg'); }
    const pr = TALK.play(sc, { person, who: null, note });
    try { chip(reg); } catch (e) { /* */ }
    const r = await pr;
    if (person) person.talking = false;
    return r;
  }
  // the register chip under the speaker's name in the talk panel
  function chip(reg) {
    const sub = document.querySelector('#talk .tk-sub'); if (!sub || !reg || typeof REG === 'undefined') return;
    const l = lang(), txt = plainT(REG.chip(reg, l)), cls = reg === 'formal' ? 'f' : 'c';
    if (!document.getElementById('mer-css')) { const s = document.createElement('style'); s.id = 'mer-css'; s.textContent = '.mer-reg{display:inline-block;margin-left:6px;padding:0 7px;border-radius:99px;font:800 11px "Segoe UI",sans-serif;letter-spacing:.03em;vertical-align:1px}.mer-reg.f{background:#3f7fc4;color:#fff}.mer-reg.c{background:#f2c94c;color:#2b2235}'; document.head.appendChild(s); }
    const old = sub.querySelector('.mer-reg'); if (old) old.remove();
    const el = document.createElement('span'); el.className = 'mer-reg ' + cls; el.textContent = '💬 ' + txt; el.title = reg === 'formal' ? 'Say it formally here' : 'Casual is fine here'; sub.appendChild(el);
  }
  // ------------------------------------------------------------ what you can press E on (the pad's signs, the providers' things)
  function items(id, fn) { (ITEMS[id] = ITEMS[id] || []).push(fn); }
  function interactables() {
    if (!inside || !cur || busy || STORY.busy) return [];
    const p = P(), b = BUILT[cur], out = [];
    const W = (it) => { const gy = it.y !== undefined ? it.y : (b.ground ? b.ground(it.x, it.z) : 0); out.push(Object.assign({}, it, { x: p.x + it.x, z: p.z + it.z, y: p.y + gy })); };
    for (const s of b.signs || []) W({ x: s.x, z: s.z, r: 1.7, label: 'Read', run: () => readSign(s.k) });
    for (const fn of ITEMS[cur] || []) { try { for (const it of fn() || []) if (it) W(it); } catch (e) { console.error('[mer] items', e); } }
    return out;
  }
  async function readSign(k) { const T0 = X().SIGNS[k]; if (!T0) return; await card(Object.assign({ tag: { en: 'A sign', es: 'Un letrero', pt: 'Uma placa', de: 'Ein Schild', zh: '[牌子|pái zi]', ja: '[看板|かんばん]' } }, T0)); }
  // ------------------------------------------------------------ every frame, inside
  const TICKS = [];
  let atT = 0;
  function update(dt, t) {
    if (!inside || !cur) return;
    const p = P(), b = BUILT[cur], Y = G.sim.you;
    if (G.sim.lock && !STORY.busy && !busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    if (skyM && skyM.visible) skyM.position.copy(G.w3d.camera.position);
    MERB.U.uFocus.value.set(Y.x, (Y.ry !== undefined ? Y.ry : Y.y) + 1.0, Y.z);
    // the light: noon outdoors (a warm sun, a blue sky's fill), lamplight indoors
    const L = lights(true);
    if (L.hemi) { if (p.indoor) { L.hemi.intensity = 0.42; L.hemi.color.set('#ffe9cc'); L.hemi.groundColor.set('#6a4a3a'); } else { L.hemi.intensity = 0.58; L.hemi.color.set('#e8f2ff'); L.hemi.groundColor.set('#a89878'); } }
    if (L.sun) { L.sun.intensity = p.indoor ? 0.25 : 0.82; L.sun.color.set(p.indoor ? '#ffd9a0' : '#fff1d6'); }
    G.fx.birds = p.indoor ? 0 : 0.18;
    try { if (b.anim) b.anim(dt, t); } catch (e) { /* */ }
    // the people: a little bob as they talk, turning to you when you're near
    for (const Pp of Object.values(PEOPLE)) {
      if (Pp.pad !== cur || !Pp.g.visible) continue;
      const a = Pp.api, near = Math.hypot(Y.x - a.x, Y.z - a.z) < 4;
      Pp.body.position.y = a.talking ? Math.abs(Math.sin(t * 12 + Pp.ph)) * 0.05 : 0;
      if ((near || a.talking) && !Pp.still) Pp.g.rotation.y = dampAngle(Pp.g.rotation.y, Math.atan2(Y.x - a.x, Y.z - a.z), 4, dt);
    }
    for (const fn of TICKS) { try { fn(dt, t, cur); } catch (e) { console.error('[mer] tick', e); } }
    // where you are, for a load (the save itself puts you on Alba's platform: OUTSIDE)
    if ((atT -= dt) <= 0) { atT = 1; S().at = { pad: cur, x: Y.x - p.x, z: Y.z - p.z, yaw: Y.yaw }; }
  }
  const tick = fn => TICKS.push(fn);
  // ------------------------------------------------------------ the mini-map: each pad's picture (drawn once), people, marks
  const KM = 3;
  function ownMap() {
    if (!inside || !cur) return null;
    const p = P(), b = BUILT[cur]; if (!b || !b.map) return null;
    if (!MAPS[cur]) { const cv = document.createElement('canvas'); cv.width = Math.ceil(p.w * KM); cv.height = Math.ceil(p.d * KM); const c = cv.getContext('2d'); try { b.map(c, KM); } catch (e) { console.error('[mer] map', e); } MAPS[cur] = cv; }
    return { cv: MAPS[cur], X0: p.x - p.w / 2, Z0: p.z - p.d / 2, K: KM, bg: p.indoor ? '#5a4436' : '#cfe3ec' };
  }
  const MARKS = [];
  function mapMarks(dpr) { const out = []; for (const fn of MARKS) { try { out.push(...(fn(cur, dpr) || [])); } catch (e) { /* */ } } return out; }
  function mapDots() {
    const out = [];
    for (const Pp of Object.values(PEOPLE)) if (Pp.pad === cur && Pp.g.visible) out.push({ x: Pp.api.x, z: Pp.api.z, kind: Pp.story ? 'story' : 'folk' });
    try { if (typeof DIN !== 'undefined' && DIN && DIN.dots) out.push(...DIN.dots(cur)); } catch (e) { /* */ }
    return out;
  }
  const areaAt = () => (inside && cur ? { id: 'mer-' + cur, name: T.stop(cur) + ' · ' + plainT(X().pick(X().NAMES.city, lang())), color: (X().STOPS[cur] || {}).color || '#d9734a' } : null);
  // ------------------------------------------------------------ the quest's target (mer_scenes.js steps point here, in pad coordinates)
  function target() { return null; }
  // the song: the pad's (mer_music.js), unless a scene holds another (MER.songOverride)
  const hasSong = n => typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes(n);
  function song() { if (!inside) return null; if (api.songOverride && hasSong(api.songOverride)) return api.songOverride; const p = P(), n = p && (typeof p.song === 'function' ? p.song() : p.song); return n && hasSong(n) ? n : null; }
  // ------------------------------------------------------------ the tram (MER.tram.ride): pick a stop, a short ride, the doors open
  const tram = {
    stops: () => Object.keys(PADS).filter(id => !PADS[id].indoor && (S().stops || {})[id] !== false && (BUILT[id] || true) && (id === 'centro' || (S().stopsOpen || {})[id])),
    async ride(to) {
      if (busy) return; busy = true; lock(true);
      try {
        const l = lang();
        if (!to) {
          const opts = tram.stops().filter(id => id !== cur).map(id => ({ label: T.stop(id), sub: (X().STOPS[id] || {}).en !== T.stop(id) ? (X().STOPS[id] || {}).en : '', value: id }));
          to = opts.length ? await UI.choose(plainT(X().line('tram.where', l).t) || 'Where to?', opts) : null;
        }
        if (!to || to === cur) return;
        await UI.fade(1, 420);
        go(to, 'stop', { quiet: true });
        const b = BUILT[to], at = b.spots.tramAt, p = PADS[to];
        if (!b.tram) { b.tram = MERB.tram('2 · ' + T.stop(to)); b.root.add(b.tram); }
        const tr = b.tram; tr.visible = true; tr.rotation.y = at.ry;
        const dir = V(Math.cos(at.ry), 0, -Math.sin(at.ry)), from = { x: at.x - dir.x * 30, z: at.z - dir.z * 30 };
        tr.position.set(from.x, 0, from.z);
        shot([at.x + Math.sin(at.ry + 0.9) * 13, 4.2, at.z + Math.cos(at.ry + 0.9) * 13], [at.x, 1.6, at.z], 0.01);
        const cast = G.cast || {}, hide = on => { try { cast.hero.root.visible = !on; cast.heroShadow.visible = !on; cast.mimo.root.visible = !on; cast.mimoShadow.visible = !on; } catch (e) { /* */ } };
        hide(true);
        await UI.fade(0, 380);
        snd('bell');
        await STORY.tween(2.6, k => { const e = 1 - Math.pow(1 - k, 3); tr.position.set(from.x + (at.x - from.x) * e, 0, from.z + (at.z - from.z) * e); });
        const sp = { api: { x: p.x + at.x, y: p.y + 3.4, z: p.z + at.z, top: 0.2, name: plainT(X().name('speaker', l)) } };
        await say(sp, 'tram.ann.' + to, { whole: true });          // (an announcement: whole in the language, EN on request: listening)
        hide(false);
        const st = b.spots.stop; const Y = G.sim.you; Y.x = p.x + st.x; Y.z = p.z + st.z; Y.yaw = st.yaw; G.sim.mimo.x = Y.x + 1; G.sim.mimo.z = Y.z + 0.6; G.sim.snap(); G.cam.snap(st.yaw, 0.3, 8.5);
        G.cam.override = null;
        snd('bell');
        STORY.tween(2.2, k => { tr.position.set(at.x + dir.x * 34 * k * k, 0, at.z + dir.z * 34 * k * k); }).then(() => { tr.visible = false; });
        (S().rides = (S().rides || 0) + 1);
        save();
        try { DICT.log('listen', 3, 1); } catch (e) { /* */ }
      } finally { lock(false); busy = false; }
    },
  };
  // ------------------------------------------------------------ init: the steps, the hooks, a load inside the city, the test seeds
  const SEED = (typeof location !== 'undefined' && (location.search.match(/[?&]ch5=(start|news|tix|city|street|home|uni|enroll|lecture|market|done)\b/) || [])[1]) || null;
  const OUTER = {
    // (outside: a save made in the city reopens there; the seeds)
    tick() {
      if (!G || inside || busy) return;
      const st = G.state.ch5;
      if (st && st.inCity && st.at && PADS[st.at.pad]) { go(st.at.pad, { x: st.at.x, z: st.at.z, yaw: st.at.yaw }, { quiet: true }); return; }
    },
  };
  function init(game) {
    G = game;
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(OUTER)) STORY.extra.push(OUTER); }
    try { if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['メリディアナ', 'ヘレン', 'マーティン', 'オリー', 'アンセルモ', 'オルテガ', 'イバラ', 'ロシオ', 'イバン', 'ラモン', 'マリ', 'ピラール', 'ルピタ', 'セレスティーノ', 'クカ']); } catch (e) { /* */ }
    for (const fn of INITS) { try { fn(game); } catch (e) { console.error('[mer] init', e); } }
    if (SEED && !init.seeded) { init.seeded = true; let done = false, wt = 0; STORY.extra.push({ tick(dt) { if (done || (wt += dt || 0.016) < 1.2) return; done = true; try { api.seed(SEED); } catch (e) { console.error('[mer] seed', e); } } }); }
  }
  // tests, in a running game (window.__g steps the frames): every pad in and out, its save, and a reload's way back in; a second of
  // frames on each with nothing turning NaN. MER._.padTests() → { pass, fail, fails }
  async function padTests() {
    const out = { pass: 0, fail: 0, fails: [] }, ok = (c, m) => { if (c) out.pass++; else { out.fail++; out.fails.push(m); } };
    const step = async s => { if (typeof window !== 'undefined' && window.__g && window.__g.go) await window.__g.go(s); };
    const keep = JSON.parse(JSON.stringify(S())), back = cur, Y = G.sim.you, M = G.sim.mimo;
    for (const id of Object.keys(PADS)) {
      const p = PADS[id];
      ok(go(id, null, { quiet: true }) && inside && cur === id, `${id}: go in`);
      await step(1);
      ok([Y.x, Y.y, Y.z, M.x, M.z].every(Number.isFinite), `${id}: a NaN after a second of frames`);
      ok(Math.abs(Y.x - p.x) <= p.w / 2 + 1 && Math.abs(Y.z - p.z) <= p.d / 2 + 1, `${id}: you're off the pad (${Y.x.toFixed(1)}, ${Y.z.toFixed(1)})`);
      ok(Math.abs(Y.y - p.y) < 6, `${id}: the ground is at ${Y.y.toFixed(2)}, the pad at ${p.y}`);
      save(); const at = Object.assign({}, S().at);
      ok(at.pad === id && S().inCity, `${id}: the save doesn't say where you are`);
      leave('alba');
      ok(!inside && Math.hypot(Y.x - 2.2, Y.z - 62.2) < 1, `${id}: leaving didn't bring you to Alba's platform`);
      S().inCity = true; S().at = at; OUTER.tick();
      ok(inside && cur === id && Math.hypot(Y.x - (p.x + at.x), Y.z - (p.z + at.z)) < 0.6, `${id}: a reload didn't bring you back to your spot`);
    }
    const st = S(); for (const k of Object.keys(st)) delete st[k]; Object.assign(st, keep);
    if (back) go(back, st.at && st.at.pad === back ? { x: st.at.x, z: st.at.z, yaw: st.at.yaw } : null, { quiet: true }); else leave();
    return out;
  }
  const INITS = [];
  if (typeof STORY !== 'undefined' && STORY.init && !STORY.init._mer) {
    const i0 = STORY.init;
    STORY.init = function (game) { const v = i0.apply(this, arguments); try { init(game); } catch (e) { console.error('[mer] init', e); } return v; };
    STORY.init._mer = true;
  }
  const api = {
    Y0, PADS, BUILT, PEOPLE, pad, go, leave, built, person, place, show, faceTo, say, fam, you, think, lock, wait, shot, card, talk, chip, items, tick, tram, toW,
    interactables, update, target, song, areaAt, ownMap, mapMarks, mapDots, MARKS, INITS, songOverride: null, S: () => S(), save, plainT, lang,
    get inside() { return inside; }, get cur() { return cur; }, get busy() { return busy; }, set busy(v) { busy = !!v; },
    // (saved while inside: you're on Alba's platform in the save; the city's own spot is in state.ch5.at, and a load takes you back there)
    get OUTSIDE() { return { x: 2.2, z: 62.2, yaw: Math.PI }; },
    leaveRoom() { leave(); },
    seed() {},
    _: { pushOne, groundY, MAPS, SEED, OUTER, padTests },
  };
  // (main.js's indoorMod: a leave() call from another room takes you out quietly)
  api.leave = to => leave(to);
  return api;
})();
