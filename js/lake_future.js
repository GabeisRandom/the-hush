'use strict';
// The Mirror Lake, tomorrow (DESIGN.md 18.10 "T2a"): Remanso if nobody speaks up. TIME dresses it (time_lake.js LAKET.DRESS.future):
// gray and still (TIME's look 'future', k() from 0.12 up as people wake), mist on the water, the north-west bay drained round the
// little island (LAKET.landOn('future'): gray mud, the old rowboat on its side, a buoy stuck in the mud), the ferry rusted and half
// sunk at its dock (TIME.effect 'lake.ferry'), a gray seal over the grotto's arch, torn gray lanterns over the pier.
// Today's villagers (one instanced rig), the ferry, the ducks and the rowboat are set aside, their solids parked.
// The people of tomorrow (TIME's person kit; today's people, older, where they stand today): Lalo (grown up, the only one still
// talking) by the rusted ferry; frozen gray: old Bartolo on the ferry dock, Marina by her yellow house, old Pepe on the pier, Lucho
// (a teenager now) with a paper boat, Delia by her torn net, Vicente by his slipway. A promise in tomorrow's words wakes each one,
// and the color comes back.
// The main path (LAKET.FSTEPS): Lalo shows the irregular future and asks if you'll come tomorrow («Sí, vendré mañana»); wake
// Marina, Vicente, Delia and old Bartolo («¡Vendremos todos!», «Harás una barca nueva», «Tendrán redes», «Saldrá mañana»); the
// seal on the arch cracks; the drowned grotto (lake_future_dungeon.js); the Gray Toad (lake_time_boss.js); the echo; report to Noa.
// Side quests (QUESTS.LIST): «A warning from tomorrow» (cross-time: today's Bartolo starts teaching Lalo the ferry; tomorrow it
// sails again, with Lalo at the helm), «Lucho's paper boat», «The lake party».
const LK_FUT = (() => {
  if (typeof TIME === 'undefined' || typeof LAKET === 'undefined' || !LAKET) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = LAKET, T = () => LFTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('future');
  const wait = s => STORY.wait(s);
  const DECK = 0.55;
  const WY = () => (typeof WORLD !== 'undefined' && WORLD.L && WORLD.L.water != null ? WORLD.L.water : -0.35);
  // the four the main path needs; Lucho and old Pepe wake too, for their own sakes (and the color)
  const WAKE = ['marina', 'vicente', 'delia', 'bartolo'], ALL = ['marina', 'vicente', 'delia', 'bartolo', 'lucho', 'pepe'];

  // ------------------------------------------------------------ where things are (today's people stand on the same spots: lake.js)
  const AT = {
    lalo: { x: -186.4, z: -152.6, yaw: -1.49, y: DECK }, bartolo: { x: -189.4, z: -150.2, yaw: -1.95, y: DECK },
    marina: { x: -182.0, z: -157.75, yaw: 0, y: DECK }, pepe: { x: -175.3, z: -151.0, yaw: Math.PI, y: DECK },
    lucho: { x: -169.6, z: -151.3, yaw: Math.PI, y: DECK }, delia: { x: -158.9, z: -145.8, yaw: -Math.PI / 2 }, vicente: { x: -155.6, z: -164.6, yaw: Math.PI },
  };
  const FERRY = { x: -193.9, z: -152 };
  const SIGN = { x: -155.4, z: -154.0, yaw: Math.PI / 2 };                 // on the beach where the main pier starts, facing the village
  const FERRY_LOOK = { x: -190.0, z: -153.7, r: 1.5 }, SIGN_LOOK = { x: -154.5, z: -153.5, r: 1.4 };
  const BOAT = { x: -168.5, z: -151.0, wx: -168.6, wz: -149.2 };          // Lucho's paper boat: on the pier, then on the water
  const NET = { x: -157.0, z: -143.3 };
  const POLES = [{ x: -160.6, z: -150.88 }, { x: -176.6, z: -150.88 }];    // the lantern string over the main pier (on two of its posts)
  const SPOTS = { mud: { x: -189.0, z: -142.0 }, crack: { x: -196.0, z: -131.5 }, boat: { x: -206.6, z: -145.8 }, post: { x: -190.4, z: -134.6 },
    reeds: { x: -198.9, z: -134.2 }, net: { x: -156.4, z: -142.6 }, lantern: { x: -165.4, z: -151.6 } };

  // ------------------------------------------------------------ the people of tomorrow (TIME's person kit; their Talk runs below)
  const C = () => T().CAST;
  const LOOK = {
    lalo: { skin: '#b07a52', hair: '#2e2420', hairdo: 'short', dress: '#e0603c', vest: '#2f6f8a', hat: 'cap', hatColor: '#e8403a', h: 1.0 },
    bartolo: { skin: '#c98e62', hair: '#d8d4cc', hairdo: 'bald', beard: true, hair2: '#ece8e0', dress: '#3f5f7a', hat: 'flat', hatColor: '#5a5a66', prop: 'cane', h: 0.98 },
    marina: { skin: '#a8714a', hair: '#d8d4cc', hairdo: 'bun', dress: '#2f8f8a', apron: '#f2c94c', shawl: '#c9443a', glasses: true, h: 0.96 },
    pepe: { skin: '#f5cda2', hair: '#e0ddd6', hairdo: 'bald', beard: true, hair2: '#ece8e0', dress: '#e6b84a', vest: '#3f5f7a', hat: 'straw', h: 0.95 },
    lucho: { skin: '#a8714a', hair: '#2e2420', hairdo: 'short', dress: '#f2c94c', vest: '#3f6fb5', hat: 'cap', hatColor: '#d9483b', h: 0.9 },
    delia: { skin: '#8a5a3c', hair: '#cfc8c0', hairdo: 'bun', dress: '#c0563c', apron: '#e8e2d6', hat: 'scarf', hatColor: '#3f6fb5', glasses: true },
    vicente: { skin: '#8a5a3c', hair: '#cfcac2', hairdo: 'short', dress: '#8a5f3e', apron: '#c9a66b', hat: 'cap', hatColor: '#2f6f6a', stache: true, hair2: '#e0ddd6', h: 1.03 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('future', id);
  const woke = id => !!(st().woke && st().woke[id]);
  const wokeN = (list = ALL) => list.filter(woke).length;
  const freed = () => !!TIME.flag('future', 'lkFree');
  const taught = () => !!TIME.flag('now', 'lkTaught');

  // ------------------------------------------------------------ the color comes back as they wake (0.12 gray … 1 healed)
  function k() { return Math.min(1, 0.12 + 0.5 * wokeN() / ALL.length + (freed() ? 0.38 : 0)); }
  // the frozen: each person's own material, gray until woken (uGray 1 → 0 as they wake)
  const FROZEN = {};
  function frozenMat(P) {
    const id = P.def.id; if (FROZEN[id]) return FROZEN[id];
    const body = P.body.children[0]; if (!body || !body.material) return null;
    const m = body.material.clone(), u = { uGray: { value: woke(id) ? 0 : 1 } };
    m.onBeforeCompile = sh => {
      sh.uniforms.uGray = u.uGray;
      sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.84, l * 0.85, l * 0.93), uGray); }');
    };
    m.customProgramCacheKey = () => 'lkFrozen';
    body.material = m;
    return (FROZEN[id] = { m, u });
  }
  function dressPeople() {
    const list = TIME.people && TIME.people.all['lake:future']; if (!list) return;
    for (const P of list) { if (P.def.id === 'lalo') continue; const F = frozenMat(P); if (F && F.tw == null) F.u.uGray.value = woke(P.def.id) ? 0 : 1; }
  }

  // ------------------------------------------------------------ the dressing: one merged mesh (and its ink hull) per group
  let built = null;
  const kit = () => PAST.API.Kit();
  // the ferry, in its own group (so it can list): 'rust' (half sunk, eaten by rust) or 'sound' (painted, afloat)
  function ferryObj(kind) {
    const KG = PAST.API.KG, g = new THREE.Group(), k = kit(), rust = kind === 'rust';
    const hull = rust ? '#4f3d33' : '#3f6fb5', top = rust ? '#7d7068' : '#f4efe4', deck = rust ? '#5e554c' : '#c9a170', cabin = rust ? '#8a7d72' : '#f4efe4', roof = rust ? '#5a3a2a' : '#c9443a';
    k.box(0, 0.05, 0, 6.4, 0.55, 3.2, hull).box(0, 0.36, 0, 6.2, 0.08, 3.0, deck, { ink: 0.006 });
    for (const s of [-1, 1]) k.box(0, 0.62, s * 1.5, 6.2, 0.1, 0.1, top, { ink: 0.006 });
    for (const s of [-1, 1]) for (let i = -2; i <= 2; i++) if (!(rust && s < 0 && i === 1)) k.box(i * 1.45, 0.5, s * 1.5, 0.08, 0.3, 0.08, top, { ink: 0 });
    k.box(2.6, 0.05, 0, 0.3, 0.58, 3.25, top, { ink: 0.006 }).box(-2.6, 0.05, 0, 0.3, 0.58, 3.25, top, { ink: 0.006 });
    k.box(-1.3, 0.95, 0, 1.4, 1.1, 1.6, cabin, { ink: 0.01 }).box(-1.3, 1.56, 0, 1.7, 0.1, 1.9, roof, { ink: 0.008 }).box(-0.58, 1.05, 0, 0.02, 0.4, 0.9, rust ? '#4a4a52' : '#9fd0e8', { ink: 0 });
    if (rust) {
      for (const [x, y, z, s] of [[1.6, 0.1, 1.62, 0.5], [-0.4, 0.05, 1.62, 0.7], [2.2, 0.2, -1.62, 0.4], [-2.0, 0.15, 1.62, 0.45], [-1.3, 1.2, 0.82, 0.35], [0.6, 0.38, 0.4, 0.6]])
        k.add(KG.ball6, x, y, z, s, s * 0.45, 0.05, ['#8a4a2a', '#a0562e', '#7a3f26'][Math.round(s * 10) % 3], { ink: 0 });
      k.rod([1.8, 0.4, -0.6], [2.4, 1.0, -0.9], 0.04, '#5a4a3a', 0.004);       // (a broken rail, sticking up)
    } else {
      k.add(KG.torus, -0.58, 1.0, 0.75, 0.22, 0.22, 0.22, '#e2453a', { ry: Math.PI / 2, ink: 0.004 }).add(KG.torus, -0.58, 1.0, 0.75, 0.15, 0.15, 0.15, '#f4efe4', { ry: Math.PI / 2, ink: 0 });
      k.rod([2.3, 0.4, 0], [2.3, 2.2, 0], 0.03, '#8a5f3e', 0.004).box(2.6, 2.0, 0, 0.6, 0.36, 0.02, '#ffd84a', { ink: 0.004 });
    }
    k.build(g); g.name = 'lake-fut-ferry-' + kind;
    const wy = WY();
    g.position.set(FERRY.x, rust ? wy - 0.12 : wy + 0.02, FERRY.z);
    if (rust) { g.rotation.z = 0.07; g.rotation.x = -0.16; g.rotation.y = 0.06; }
    return g;
  }
  // the sign by the ferry dock: 'closed' (gray, a ferry crossed out, «until tomorrow» scribbled under) or the ferry school's
  const signText = () => { const l = lang(), N = T().NAMES.sign; return M.plainT(N[l] || N.en); };
  function signObj(kind) {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG, gray = kind === 'closed';
    k.add(KG.cyl, 0, 0.7, -0.05, 0.07, 1.4, 0.07, gray ? '#77737a' : '#8a5f3e').box(0, 1.35, 0, 1.5, 0.62, 0.06, gray ? '#9a96a0' : '#f4efe4', { ink: 0.008 });
    k.build(g);
    const tex = TK.canvasTex(256, 104, (c, w, h) => {
      c.fillStyle = gray ? '#a8a4ae' : kind === 'new' ? '#fbf6ea' : '#f4efe4'; c.fillRect(0, 0, w, h);
      if (gray) {
        c.strokeStyle = '#4a4752'; c.lineWidth = 5; c.beginPath(); c.moveTo(70, 62); c.lineTo(186, 62); c.lineTo(170, 80); c.lineTo(86, 80); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(110, 62); c.lineTo(110, 38); c.lineTo(146, 38); c.lineTo(146, 62); c.stroke();
        c.strokeStyle = '#6a3a3a'; c.lineWidth = 7; c.beginPath(); c.moveTo(60, 22); c.lineTo(196, 92); c.moveTo(196, 22); c.lineTo(60, 92); c.stroke();
        c.strokeStyle = '#3b3842'; c.lineWidth = 2; c.beginPath(); for (let x = 150; x < 240; x += 9) { c.moveTo(x, 96); c.quadraticCurveTo(x + 3, 90, x + 7, 96); } c.stroke();
      } else {
        c.fillStyle = '#2f6f9a'; c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        let s = signText(), sz = 30; while (sz > 14 && c.measureText(s).width > w - 20) { sz -= 2; c.font = `bold ${sz}px sans-serif`; }
        c.fillText(s, w / 2, 40);
        c.strokeStyle = '#c9443a'; c.lineWidth = 4; c.beginPath(); c.moveTo(88, 76); c.lineTo(168, 76); c.lineTo(156, 90); c.lineTo(100, 90); c.closePath(); c.stroke();
        c.beginPath(); c.moveTo(124, 76); c.lineTo(124, 62); c.lineTo(140, 70); c.closePath(); c.stroke();
      }
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.44, 0.56), new THREE.MeshBasicMaterial({ map: tex }));
    face.position.set(0, 1.35, 0.035); g.add(face);
    g.position.set(SIGN.x, gy(SIGN.x, SIGN.z), SIGN.z); g.rotation.y = SIGN.yaw; g.name = 'lake-sign-' + kind;
    return g;
  }
  const both = (...objs) => { const g = new THREE.Group(); objs.forEach(o => g.add(o)); return g; };
  // the lantern string over the main pier: torn and gray (built with the props), or the party's (an effect)
  function lanternString(k, party) {
    const KG = PAST.API.KG, [a, b] = POLES, y = DECK + 2.7, n = 8, cols = ['#e2453a', '#ffd84a', '#3f7fc9', '#5fae4f', '#f28c38', '#c45ab8'];
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n, sag = t => Math.sin(t * Math.PI) * 0.5;
      k.rod([lerp(a.x, b.x, t0), y - sag(t0), a.z], [lerp(a.x, b.x, t1), y - sag(t1), a.z], 0.012, party ? '#3a3028' : '#5e5b66', 0);
      if (i === 0) continue;
      const x = lerp(a.x, b.x, t0), yy = y - sag(t0), torn = !party && i % 3 === 1, c = party ? cols[i % cols.length] : ['#a9a6b0', '#9a97a2', '#b4b1ba'][i % 3];
      k.rod([x, yy, a.z], [x, yy - (torn ? 0.5 : 0.22), a.z], 0.008, '#3a3028', 0);
      k.add(KG.sphere, x, yy - (torn ? 0.75 : 0.45), a.z, 0.2, torn ? 0.16 : 0.26, 0.2, c, { ink: 0.006, rz: torn ? 0.5 : 0 });
    }
  }
  function lanternsObj() { const g = new THREE.Group(), kk = kit(); lanternString(kk, true); kk.build(g); g.name = 'lake-fut-lanterns'; return g; }
  function sealMesh() {
    const tex = TK.canvasTex(128, 176, (c, w, h) => {
      const g = c.createRadialGradient(w / 2, h * 0.55, 4, w / 2, h * 0.55, h * 0.55); g.addColorStop(0, 'rgba(126,122,138,0.96)'); g.addColorStop(1, 'rgba(72,70,84,0.88)');
      c.fillStyle = g; c.beginPath(); c.moveTo(6, h); c.lineTo(6, h * 0.36); c.quadraticCurveTo(w / 2, -h * 0.1, w - 6, h * 0.36); c.lineTo(w - 6, h); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(30,28,40,0.9)'; c.lineWidth = 4; c.stroke();
      c.strokeStyle = 'rgba(200,198,214,0.5)'; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(w / 2, h * 0.6, 10 + i * 9, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    });
    const A0 = M.ARCH, m = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 2.45), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    m.position.set(A0.x + Math.sin(A0.yaw) * 0.44, 1.32, A0.z + Math.cos(A0.yaw) * 0.44); m.rotation.y = A0.yaw; m.name = 'lake-fut-seal'; m.visible = false; G().w3d.scene.add(m);
    return m;
  }
  function props(k) {
    const KG = PAST.API.KG;
    // the lantern poles on the pier's north edge, Delia's net on its frame (gray, half mended), a gray barrel or two
    for (const p of POLES) k.add(KG.cyl, p.x, DECK + 1.45, p.z, 0.07, 2.9, 0.07, '#6f6a72');
    { const y = gy(NET.x, NET.z); for (const s of [-1, 1]) k.add(KG.cyl, NET.x + s * 0.9, y + 0.7, NET.z, 0.05, 1.4, 0.05, '#77737a');
      k.box(NET.x, y + 1.38, NET.z, 1.9, 0.05, 0.05, '#77737a', { ink: 0.004 });
      for (let i = 0; i < 7; i++) k.box(NET.x - 0.75 + i * 0.25, y + 0.85 - (i % 3) * 0.06, NET.z, 0.012, 1.0 - (i % 3) * 0.12, 0.012, '#a7a4ae', { ink: 0 });
      for (let j = 0; j < 5; j++) k.box(NET.x - 0.05 * (j % 2), y + 0.5 + j * 0.18, NET.z, 1.6 - (j === 2 ? 0.7 : 0), 0.012, 0.012, '#a7a4ae', { ink: 0 }); }
    { const x = -158.2, z = -148.6, s = 0.8, y = gy(x, z); k.add(KG.cyl, x, y + 0.36 * s, z, 0.28 * s, 0.72 * s, 0.28 * s, '#85818a', { ink: 0.008 }); }
  }
  function mistPoints() {
    const n = 80, pos = new Float32Array(n * 3), seed = [], c = M.CEN;
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, r = 3 + Math.random() * 38; seed.push({ x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r, y: 0.2 + Math.random() * 2.6, ph: Math.random() * 6.3, sp: 0.12 + Math.random() * 0.25 }); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: TK.sparkTex, color: '#c4c2ce', size: 0.6, transparent: true, opacity: 0.5, depthWrite: false }));
    pts.frustumCulled = false; pts.visible = false; pts.name = 'lake-fut-mist'; G().w3d.scene.add(pts);
    return { pts, pos, seed };
  }
  function paperBoat() {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG;
    k.box(0, 0.04, 0, 0.38, 0.07, 0.16, '#f6f3ea', { ink: 0.004 }).add(KG.cone4, 0, 0.15, 0, 0.13, 0.17, 0.06, '#fdfbf4', { ink: 0.004 })
      .box(0.21, 0.07, 0, 0.06, 0.05, 0.1, '#f0ede2', { rz: -0.6, ink: 0.003 }).box(-0.21, 0.07, 0, 0.06, 0.05, 0.1, '#f0ede2', { rz: 0.6, ink: 0.003 });
    k.build(g); g.name = 'lake-fut-paperboat'; g.position.set(BOAT.x, DECK + 0.02, BOAT.z); g.visible = false; G().w3d.scene.add(g);
    return { g, t: st().boat ? 1 : -1 };
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'lake-fut-' + name; const kk = kit(); fn(kk); kk.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), old: mk('lanterns-old', kk => lanternString(kk, false)), seal: sealMesh(), mist: mistPoints(), boat: paperBoat(), solids: [] };
    const add = (x, z, r) => built.solids.push({ x: A.OFF, z: A.OFF, _x: x, _z: z, r, time: true });
    for (const p of POLES) add(p.x, p.z, 0.14);
    add(NET.x - 0.9, NET.z, 0.12); add(NET.x + 0.9, NET.z, 0.12); add(-158.2, -148.6, 0.26);
    WORLD.extra.push(...built.solids);
    return built;
  }
  const solidsOn = on => { if (built) built.solids.forEach(c => { c.x = on ? c._x : A.OFF; c.z = on ? c._z : A.OFF; }); };
  function show(on) {
    const B = build(), s = st(), party = !!TIME.flag('future', 'lkParty');
    B.props.visible = on; B.old.visible = on && !party;
    B.seal.visible = on && !s.open && !freed();
    B.mist.pts.visible = on; B.boat.g.visible = on;
    solidsOn(on);
  }

  // ------------------------------------------------------------ talking to the people of tomorrow (the main path first; side quests come
  // through STORY.talkHooks below, as a little menu)
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  function talk(id) {
    const s = st();
    if (id === 'lalo') return !s.met ? laloScene() : !s.open && wokeN(WAKE) < 4 ? say1('lalo', 'lalo.again') : taught() ? say1('lalo', 'lalo.captain') : freed() ? say1('lalo', 'lalo.after') : say1('lalo', 'lalo.open');
    if (!woke(id)) return wakeScene(id);
    if (id === 'marina' && TIME.flag('future', 'lkParty')) return say1('marina', 'marina.partyDone');
    if (id === 'lucho' && s.boat) return say1('lucho', 'lucho.boat');
    return say1(id, id + '.awake');
  }
  // the main path, 1: Lalo shows the irregular future, asks if you'll come tomorrow (about yourself), then tells about the village
  async function laloScene() {
    const s = st(), L0 = () => who('lalo'); if (!L0()) return;
    if (!s.demo) {
      M.lock(true);
      try { M.frame2(L0()); await wait(0.4); await M.say(L0(), ln('lalo.hello')); await M.demo(L0(), T().DEMO['d.lalo1'], T().MARKS['d.lalo1']); } finally { M.lock(false); }
      await M.card(T().CARDS.fut, true); s.demo = true; G().save();
    }
    M.lock(true); try { M.frame2(L0()); await M.demo(L0(), T().DEMO['q.lalo'], T().MARKS['q.lalo']); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.come, { tips: T().TIPS });
    if (!r) { M.think('{lalo} is still waiting: will you come tomorrow? (Talk to him again.)', 5); return; }
    TIME.grade('lk.come', r.letter);
    M.lock(true);
    try {
      M.frame2(L0()); await M.say(L0(), ln('lalo.ferry')); await M.demo(L0(), T().DEMO['d.lalo2'], T().MARKS['d.lalo2']);
      await M.say(L0(), ln('lalo.wake')); await M.say(L0(), ln('lalo.seal')); s.met = true; G().save();
    } finally { M.lock(false); }
    M.think('Gray people all over Remanso: Marina by her yellow house, {vicente} by his shed, {delia} by her net, old Bartolo on the ferry dock. Promise each of them a tomorrow.', 7);
  }
  // the main path, 2: a frozen person; a promise in tomorrow's words wakes them
  async function wakeScene(id) {
    const s = st(), p = who(id); if (!p) return;
    M.lock(true); try { M.frame2(p); await wait(0.3); await M.hushed(p, ln(id + '.frozen')); } finally { M.lock(false); }
    if (!s.met) { M.think('Gray, frozen… as if waiting for something. Someone by the old ferry is still talking. Ask him.', 5.5); return; }
    const r = await M.ask(T().TASKS[id], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think('Still gray. A promise about tomorrow would wake them.', 4); return; }
    TIME.grade('lk.wake.' + id, r.letter);
    s.woke = s.woke || {}; s.woke[id] = r.letter; G().save();
    await wakeUp(id);
    if (WAKE.every(woke) && !s.open) await sealCracks();
    else if (WAKE.includes(id)) M.think(`${wokeN(WAKE)} of 4 awake. Who else is gray?`, 3.5);
    else if (id === 'lucho') M.think('No wind on tomorrow’s lake for Lucho’s paper boat… {mimo} could give it a push. A plan!', 5);
  }
  async function wakeUp(id) {
    const g = G(), P = M.person('future', id), F = P && frozenMat(P);
    M.lock(true);
    try {
      if (F) F.tw = 1;
      snd('learned'); if (P) g.w3d.fx.sparkle(P.api.x, (P.api.y || 0) + 1.3, P.api.z, 22, ['#ffd166', '#fff3a0', '#9ff5e8']);
      await wait(1.2);
      const p = who(id); M.frame2(p); await M.say(p, ln(id + '.awake'));
    } finally { M.lock(false); }
  }
  async function sealCracks() {
    const s = st(), B = build(), g = G(), A0 = M.ARCH, sn = Math.sin(A0.yaw), c = Math.cos(A0.yaw);
    M.lock(true);
    try {
      M.shot(V(A0.x + sn * 7.5 + c * 2.6, 3.2, A0.z + c * 7.5 - sn * 2.6), V(A0.x, 1.3, A0.z), 1.0); await wait(1.1);
      snd('crack'); g.w3d.fx.puff(B.seal.position.x, 1.4, B.seal.position.z, 18, 0.45, '#b8b6c4'); await wait(0.3);
      await STORY.tween(0.6, kk => { B.seal.material.opacity = 1 - kk; B.seal.scale.setScalar(1 + kk * 0.2); });
      B.seal.visible = false; B.seal.material.opacity = 1; B.seal.scale.setScalar(1); s.open = true; g.save();
      snd('chime'); await wait(0.6);
      const L0 = who('lalo'); if (L0) { M.frame2(L0); await M.say(L0, ln('lalo.open')); }
    } finally { M.lock(false); }
    M.think('The grotto on the little island is open. Walk the sandbar from the end of the pier, or cross the gray mud.', 6);
  }

  // ------------------------------------------------------------ side quest: «A warning from tomorrow» (the Future changes today)
  async function warnScene() {
    const s = st(), Bt = who('bartolo'); if (!Bt) return;
    M.lock(true);
    try { M.frame2(Bt); await wait(0.3); await M.say(Bt, ln('bartolo.why')); await M.demo(Bt, T().DEMO['d.warn'], T().MARKS['d.warn']); s.warned = true; TIME.flag('future', 'lkWarn', true); G().save(); } finally { M.lock(false); }
    M.think('A warning from tomorrow, word for word. Today’s Bartolo, on the ferry dock, should hear it.', 5.5);
  }
  const todayP = id => { const lk = G() && G().lake; return (lk && lk.people && lk.people.find(p => p.id === id)) || null; };
  const asP = (p, id, name) => ({ id, name, x: p.x, y: p.y != null ? p.y : gy(p.x, p.z), z: p.z, top: 1.7, talking: false });
  async function warnToday(Bp) {
    const n = M.st('now');
    const r = await M.ask(T().TASKS.warn, { tips: T().TIPS }); if (!r) return;
    TIME.grade('lk.warn', r.letter);
    M.lock(true);
    try {
      Bp.talking = true; await M.say(asP(Bp, 'bartolo', 'Bartolo'), ln('bartolo.heard'));
      TIME.flag('now', 'lkTaught', true); TIME.refresh(); n.taught = true; G().save();
      M.shot(V(SIGN.x + 3.4, 2.4, SIGN.z + 2.2), V(SIGN.x, 1.4, SIGN.z), 1.0); await wait(1.0);
      G().w3d.fx.sparkle(SIGN.x, 1.8, SIGN.z, 14, ['#ffd166', '#fff3a0']); snd('chime'); await wait(0.9);
    } finally { Bp.talking = false; M.lock(false); }
    M.think('Bartolo will teach Lalo the ferry, starting today… What will that change tomorrow?', 5);
  }
  // the ferry, and the sign by its dock: rusted and «closed» tomorrow; once today's Bartolo starts teaching Lalo, the ferry school's
  // sign stands by the dock today, and tomorrow the ferry is painted and afloat, Lalo at the helm
  TIME.effect('lake.ferry', { region: 'lake', when: () => taught(),
    before: { future: () => ({ obj: both(ferryObj('rust'), signObj('closed')), solids: [{ x: SIGN.x, z: SIGN.z, r: 0.18 }] }) },
    show: { future: () => ({ obj: both(ferryObj('sound'), signObj('school')), solids: [{ x: SIGN.x, z: SIGN.z, r: 0.18 }] }), now: () => ({ obj: signObj('new'), solids: [{ x: SIGN.x, z: SIGN.z, r: 0.18 }] }) },
    act: { future: Object.assign({ label: 'Look', run: async () => {
      M.think(`The ferry, painted blue and white, bobbing at its dock. On the sign: «${signText()}». Bartolo taught Lalo, years ago: now Lalo runs it.`, 7);
      const s = st(); if (!s.ferrySeen) { s.ferrySeen = true; G().save(); } } }, FERRY_LOOK),
      now: Object.assign({ label: 'Look', run: async () => M.think(`A new sign where the pier starts: «${signText()}». Bartolo has started teaching Lalo, every afternoon.`, 6) }, SIGN_LOOK) } });
  // the party's lanterns over the pier (tomorrow)
  TIME.effect('lake.lanterns', { region: 'lake', when: () => !!TIME.flag('future', 'lkParty'), show: { future: () => lanternsObj() } });

  // ------------------------------------------------------------ side quest: «Lucho's paper boat» (a plan for {mimo})
  async function boatTask() {
    const s = st();
    if (!s.planCard) { s.planCard = true; await M.card(T().CARDS.plan, true); }
    const r = await M.ask(T().PLAN.boat, { icon: 'push', tips: T().TIPS, hint: 'A plan: {mimo} does it once you say it.' }); if (!r) return;
    TIME.grade('lk.boat', r.letter);
    const g = G(), sim = g.sim, B = build();
    M.lock(true);
    try {
      M.shot(V(BOAT.x + 3.2, 2.4, BOAT.z + 2.8), V(BOAT.x, 0.3, BOAT.z - 1.0));
      sim.mimoGo({ x: BOAT.x + 0.8, z: BOAT.z - 0.1 }, BOAT); await wait(0.9); snd('pip');
      s.boat = true; B.boat.t = 0; g.save(); await wait(1.5); snd('learned');
      g.w3d.fx.sparkle(BOAT.wx, WY() + 0.3, BOAT.wz, 12, ['#fff3c8', '#9ff5e8']);
      sim.mimoGo(null, null);
      const Lu = who('lucho'); if (Lu) { M.frame2(Lu); await M.say(Lu, ln('lucho.boat')); }
      g.state.coins = (g.state.coins || 0) + 4; UI.toast('+4 coins'); g.save();
    } finally { M.lock(false); }
  }
  TIME.spot('lake.paperboat', { region: 'lake', world: 'future', x: BOAT.x + 0.4, z: BOAT.z - 0.3, r: 1.4, label: () => `Tell ${M.mimoName()}`,
    when: () => woke('lucho') && !st().boat, run: () => boatTask() });

  // ------------------------------------------------------------ side quest: «The lake party» (will you come, and what will you do)
  async function partyScene() {
    const s = st(), Mr = () => who('marina'); if (!Mr()) return;
    M.lock(true); try { M.frame2(Mr()); await wait(0.3); await M.say(Mr(), ln('marina.party')); await M.demo(Mr(), T().DEMO['d.party'], T().MARKS['d.party']); } finally { M.lock(false); }
    if (!s.party1) {
      M.lock(true); try { M.frame2(Mr()); await M.demo(Mr(), T().DEMO['q.party1'], T().MARKS['q.party1']); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS.party1, { tips: T().TIPS }); if (!r) { M.think('Marina is waiting: will you come?', 4); return; }
      TIME.grade('lk.party1', r.letter); s.party1 = r.letter; G().save();
    }
    M.lock(true); try { M.frame2(Mr()); await M.demo(Mr(), T().DEMO['q.party2'], T().MARKS['q.party2']); } finally { M.lock(false); }
    const r2 = await M.ask(T().TASKS.party2, { tips: T().TIPS }); if (!r2) { M.think('Marina is waiting: what will you do at the party?', 4); return; }
    TIME.grade('lk.party2', r2.letter);
    M.lock(true);
    try {
      s.party = true; TIME.flag('future', 'lkParty', true); TIME.refresh(); show(true); G().save();
      M.shot(V(-170, 3.4, -145.8), V(-170, 2.4, -151), 1.0); await wait(0.9);
      snd('chime'); G().w3d.fx.sparkle(-170, 3.0, -150.9, 30, ['#ffd166', '#e2453a', '#9ff5e8', '#fff3a0']); await wait(0.8);
      M.frame2(Mr()); await M.say(Mr(), ln('marina.partyDone'));
      G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); G().save();
    } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ things to look at (each word said aloud and glossed)
  const LOOKS_AT = ['mud', 'crack', 'boat', 'post', 'reeds', 'net', 'lantern'];
  LOOKS_AT.forEach(kk => TIME.spot('lake.flook.' + kk, { region: 'lake', world: 'future', x: SPOTS[kk].x, z: SPOTS[kk].z, r: 1.5, label: 'Look',
    when: kk === 'lantern' ? () => !TIME.flag('future', 'lkParty') : undefined, run: async () => M.look(T().LOOKS['look.' + kk]) }));
  TIME.spot('lake.flook.ferry', { region: 'lake', world: 'future', x: FERRY_LOOK.x, z: FERRY_LOOK.z, r: FERRY_LOOK.r, label: 'Look', when: () => !taught(), run: async () => M.look(T().LOOKS['look.ferry']) });
  TIME.spot('lake.flook.sign', { region: 'lake', world: 'future', x: SIGN_LOOK.x, z: SIGN_LOOK.z, r: SIGN_LOOK.r, label: 'Look', when: () => !taught(), run: async () => M.look(T().LOOKS['look.sign']) });

  // ------------------------------------------------------------ the Talk menus (tomorrow), and today's Bartolo and Lalo
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'future' || TIME.regionNow() !== 'lake') return null;
    const s = st();
    if (it.who === 'future:bartolo' && woke('bartolo') && !s.warned && !taught()) return [{ label: 'Why did the ferry rust?', sub: '◆ side quest', run: warnScene }];
    if (it.who === 'future:marina' && woke('marina') && !TIME.flag('future', 'lkParty')) return [{ label: 'The lake party', sub: '◆ side quest', run: partyScene }];
    if (it.who === 'future:lucho' && woke('lucho') && !s.boat) return [{ label: 'Your paper boat', sub: '◆ side quest', run: async () => { await say1('lucho', 'lucho.awake'); M.think('No wind… Stand by the paper boat on the pier and tell {mimo} its plan.', 5); } }];
    return null;
  });
  // today: their Talks have no id (story.js), so they're matched by where they stand
  const nearToday = (it, id) => { const p = todayP(id); return p && Math.hypot(it.x - p.x, it.z - p.z) < 0.8 ? p : null; };
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || it.label !== 'Talk' || it.who || !TIME.open('lake')) return null;
    const Bp = nearToday(it, 'bartolo');
    if (Bp && TIME.flag('future', 'lkWarn') && !taught()) return [{ label: 'A warning from tomorrow', sub: '◆ side quest', run: () => warnToday(Bp) }];
    if (Bp && taught()) return [{ label: 'The ferry lessons', run: async () => { M.lock(true); try { Bp.talking = true; await M.say(asP(Bp, 'bartolo', 'Bartolo'), ln('bartolo.teaching')); } finally { Bp.talking = false; M.lock(false); } } }];
    const Lp = nearToday(it, 'lalo');
    if (Lp && taught()) return [{ label: 'The ferry lessons', run: async () => { M.lock(true); try { Lp.talking = true; await M.say(asP(Lp, 'lalo', 'Lalo'), ln('lalo.learning')); } finally { Lp.talking = false; M.lock(false); } } }];
    return null;
  });

  // ------------------------------------------------------------ E, the compass, every frame
  function interactables() {
    const s = st(), out = [];
    out.push({ x: M.DOOR.x, z: M.DOOR.z, r: 1.9, label: s.open || freed() ? 'Go in' : 'Look', run: async () => {
      if (!(s.open || freed())) { M.think(s.met ? 'The grotto’s mouth, sealed with something gray and cold. When the village wakes up, it will crack.' : 'The grotto’s mouth is sealed with something gray and cold. Someone by the old ferry is still talking.', 5); return; }
      if (typeof LK_FGROT !== 'undefined' && LK_FGROT) await LK_FGROT.enter();
    } });
    return out;
  }
  const HINTS = { lalo: '{mimo} points at someone by the rusted ferry… the only one with any color.', door: '{mimo} looks across the gray mud, at the little island’s grotto.',
    frozen: '{mimo} tugs your sleeve toward someone gray.', marina: '{mimo} points at a gray old woman by the yellow house.', vicente: '{mimo} points at a gray man by the boat builder’s shed.',
    delia: '{mimo} points at a gray woman by a torn net.', bartolo: '{mimo} points at a gray old man on the ferry dock.', lucho: '{mimo} points at a gray teenager on the pier.',
    pepe: '{mimo} points at a gray old fisherman on the pier.', boat: '{mimo} sniffs the paper boat on the pier.' };
  function target(id) {
    if (id === 'door') return (typeof LK_FGROT !== 'undefined' && LK_FGROT && LK_FGROT.inside && LK_FGROT.target()) || { x: M.DOOR.x, z: M.DOOR.z, hint: HINTS.door };
    if (id === 'frozen') { const n = WAKE.find(x => !woke(x)); if (!n) return target('door'); id = n; }
    if (id === 'boat') return { x: BOAT.x, z: BOAT.z, hint: HINTS.boat };
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || HINTS.frozen };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const nextId = () => { const s = st(); return !s.met ? 'lalo' : WAKE.some(x => !woke(x)) ? 'frozen' : 'door'; };
  // the area's song: 'lk_future' (lake_time_music.js), which brings its drums in as Remanso wakes (it reads k())
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('lk_future') ? 'lk_future' : 'future');
  // the lake's color comes back for good once the Gray Toad stops (the drowned grotto calls this)
  function freedScene() { TIME.flag('future', 'lkFree', true); const B = build(); B.seal.visible = false; TIME.refresh(); G().save(); }

  // ------------------------------------------------------------ every frame: the frozen stand still, the mist drifts, the paper boat
  function late(dt) {
    const B = built; if (!B) return;
    const list = TIME.people && TIME.people.all['lake:future'];
    if (list) for (const P of list) { if (P.def.id === 'lalo' || woke(P.def.id)) continue; P.g.rotation.y = P.api.yaw; P.body.position.y = 0; P.body.rotation.z = 0; }
    for (const F of Object.values(FROZEN)) if (F.tw != null) { F.tw = Math.max(0, F.tw - dt * 0.7); F.u.uGray.value = F.tw; if (F.tw <= 0) F.tw = null; }
    const t = G().w3d.time.value, kk = k(), D = B.mist;
    if (D.pts.visible) { D.pts.material.opacity = 0.5 * (1 - kk * 0.9); D.seed.forEach((p, i) => { D.pos[i * 3] = p.x + Math.sin(t * p.sp + p.ph) * 1.6; D.pos[i * 3 + 1] = p.y + Math.sin(t * p.sp * 0.5 + p.ph) * 0.3; D.pos[i * 3 + 2] = p.z + Math.cos(t * p.sp * 0.7 + p.ph) * 1.6; }); D.pts.geometry.attributes.position.needsUpdate = true; }
    const Bo = B.boat, g = Bo.g; if (!g.visible) return;
    if (!st().boat) { g.position.set(BOAT.x, DECK + 0.02, BOAT.z); g.rotation.set(0, 0.3, 0); return; }
    if (Bo.t < 0) Bo.t = 1;
    if (Bo.t < 1) { Bo.t = Math.min(1, Bo.t + dt * 0.8); const e = Bo.t; g.position.set(lerp(BOAT.x, BOAT.wx, e), lerp(DECK + 0.02, WY() + 0.01, e) + Math.sin(e * Math.PI) * 0.35, lerp(BOAT.z, BOAT.wz, e)); g.rotation.z = Math.sin(e * Math.PI) * 0.4; return; }
    const a = t * 0.12; g.position.set(BOAT.wx - 1.2 + Math.cos(a) * 1.4, WY() + 0.01 + Math.sin(t * 1.7) * 0.02, BOAT.wz + Math.sin(a) * 0.6); g.rotation.set(Math.sin(t * 1.3) * 0.06, -a, Math.sin(t * 1.1) * 0.05);
  }

  // ------------------------------------------------------------ the side quests (QUESTS.LIST: they start as the story reaches them)
  if (typeof QUESTS !== 'undefined') {
    const fS = s => M.sf(s);
    const futAt = id => () => M.via('future', () => target(id));
    const wk = (s, id) => !!(fS(s).woke && fS(s).woke[id]);
    const fl = (s, w, kk) => !!(s && s.worlds && s.worlds.flags && s.worlds.flags[w] && s.worlds.flags[w][kk]);
    if (!QUESTS.LIST.some(q => q.id === 'lk.warn')) QUESTS.LIST.push({ id: 'lk.warn', kind: 'side',
      title: 'A warning from tomorrow', giver: 'Old Bartolo, on the ferry dock (the Mirror Lake, tomorrow)',
      started: s => wk(s, 'bartolo'),
      steps: [
        { text: 'In the Future: ask old Bartolo why the ferry rusted', why: 'Old Bartolo is awake again. He knows why nobody crosses the lake any more.', done: s => !!fS(s).warned || fl(s, 'now', 'lkTaught'), target: futAt('bartolo'), hint: HINTS.bartolo },
        { text: 'Today: tell Bartolo the warning from tomorrow, word for word', why: 'A warning is a piece of tomorrow you bring home. Today’s Bartolo is on the ferry dock (if his ferry is out at the island, wave him back first).',
          done: s => fl(s, 'now', 'lkTaught'), target: () => M.via('now', () => { const Bp = todayP('bartolo'); return Bp ? { x: Bp.x, z: Bp.z, hint: '{mimo} points at Bartolo, by his ferry.' } : null; }), hint: '{mimo} points toward the ferry dock.' },
        { text: 'Tomorrow: look at the ferry', why: 'Bartolo is teaching Lalo the ferry today… What does tomorrow look like now?', done: s => !!fS(s).ferrySeen,
          target: () => M.via('future', () => ({ x: FERRY_LOOK.x, z: FERRY_LOOK.z, hint: '{mimo} points at the ferry.' })), hint: '{mimo} points at the ferry.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'lk.boat')) QUESTS.LIST.push({ id: 'lk.boat', kind: 'side',
      get title() { return M.fillEn('{lucho}’s paper boat'); }, get giver() { return M.fillEn('{lucho}, on the pier (the Mirror Lake, tomorrow)'); },
      started: s => !!fS(s).met,
      steps: [
        { get text() { return M.fillEn('In the Future: wake {lucho} with a promise'); }, get why() { return M.fillEn('{lucho}, a teenager now, stands frozen on the pier with a paper boat that won’t sail.'); }, done: s => wk(s, 'lucho'), target: futAt('lucho'), hint: HINTS.lucho },
        { get text() { return M.fillEn('No wind: give {mimo} a plan for the paper boat'); }, get why() { return M.fillEn(`There’s no wind on tomorrow’s lake. Say what {mimo} will do: ${M.sx('plan')}.`); }, done: s => !!fS(s).boat, target: futAt('boat'), hint: HINTS.boat },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'lk.party')) QUESTS.LIST.push({ id: 'lk.party', kind: 'side',
      title: 'The lake party', giver: 'Marina, by her yellow house (the Mirror Lake, tomorrow)',
      started: s => wk(s, 'marina'),
      steps: [
        { text: 'Plan the lake party with Marina: will you come, and what will you do there?', get why() { return M.fillEn(`Marina wants a party on the water, like the old days. Answer in tomorrow’s words: ${M.sx('promise')}…`); },
          done: s => fl(s, 'future', 'lkParty'), target: futAt('marina'), hint: HINTS.marina },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks (TIME calls them: time.js "TIME dresses it")
  Object.assign(M.DRESS.future, {
    people: PEOPLE,
    k: () => k(),
    on(api) { show(true); M.landOn('future'); M.hideToday(api, { ducks: true, boats: true }); M.parkToday(true); M.liftPeople('future', PEOPLE.map(p => ({ id: p.id, at: p.at }))); dressPeople(); },
    off() { show(false); M.landOn(null); M.parkToday(false); },
    entered() { show(true); M.landOn('future'); M.liftPeople('future', PEOPLE.map(p => ({ id: p.id, at: p.at }))); dressPeople(); },
    late: (api, dt) => { M.showLake(dt * Math.min(1, 0.1 + k())); late(dt); if (typeof LK_FGROT !== 'undefined' && LK_FGROT && LK_FGROT.inside) LK_FGROT.late(dt); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, WAKE, ALL, FERRY, SIGN, BOAT, PEOPLE, k, woke, wokeN, who, target: id => target(id), song: () => song(), freed: () => freedScene(), show, build, dressPeople, init: () => {}, changed: () => {},
    _: { talk: id => talk(id), laloScene, wakeScene, sealCracks, warnScene, warnToday, boatTask, partyScene, get built() { return built; } } };
})();
