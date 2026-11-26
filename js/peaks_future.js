'use strict';
// The Frost Peaks, tomorrow (DESIGN.md 20 "T3b"): Escarcha snowed in. Every clock stopped at three, all at the same moment (today's
// clock faces, the tower's too), the snow hangs still in the air over the village, and its people froze where they stood, each stuck
// on a problem, gray until somebody gives them advice or guesses what they can't. TIME dresses it (time_peaks.js PEAKT.DRESS.future):
// drifts against every wall, a baker buried at his door, a teacher's coat folded on a bench, the mail's timetable, a cat's pawprints
// across the square, an old man's bench (a thermos, a flashlight, a heater), the children's half-built igloo, a snowman with no nose,
// the mayor's notice board, and the tower's door snowed in and padlocked. Today's Escarcha people (peaks.js) are hidden.
// The people of tomorrow (TIME's person kit): Lía (fifteen, the only one still talking), old Tobías, Rafa, Clara, Nando, Pili, old Inés
// (the mayor now) and old Teo. Each language names its own (PKFTXT.CAST).
// The main path (PEAKT.FSTEPS): Lía shows advice and guesses (the card), «Yo que tú, tomaría chocolate caliente» → wake four: Rafa
//   («Yo que tú, quitaría la nieve»), Clara («… me pondría el abrigo»), Nando («Serían las tres»: his timetable), Pili («Iría a la
//   panadería»: the pawprints) → old Tobías («Yo que tú, iría a la torre»): the key → the Ice Clock Tower (peaks_future_dungeon.js) →
//   the Gray Cuckoo (peaks_time_boss.js) → the echo → Noa.
// Side quests (QUESTS.LIST): «A warning from tomorrow» (cross-time: old Tobías says the gears froze because the belfry stands open; tell
//   today's Tobías «Sería mejor cerrar las contraventanas de la torre»: red shutters go up today, old and faded tomorrow, and tomorrow's
//   tower has no ice on its gears), «Notes for the village meeting» (wake old Inés, then answer three neighbors' notes with advice),
//   «Old Teo's snowman» (wake him with the carrot, then a scarf and buttons).
const PK_FUT = (() => {
  if (typeof TIME === 'undefined' || typeof PEAKT === 'undefined' || !PEAKT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = PEAKT, T = () => PKFTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('future');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF;
  const VY = M.VY, LY = M.LY, P0 = PEAKS;

  // ------------------------------------------------------------ where things are (checked with PEAKT._.t.probe in every world)
  const AT = {
    lia: { x: 207.6, z: -254.4, yaw: -1.83 }, tobias: { x: 206.2, z: -266.4, yaw: 0 },
    rafa: { x: 194.4, z: -249.55, yaw: 1.57 }, clara: { x: 197.75, z: -248.4, yaw: 3.14 }, nando: { x: 215.05, z: -248.8, yaw: 3.14 },
    pili: { x: 216.9, z: -257.85, yaw: -1.57 }, ines: { x: 196.1, z: -264.35, yaw: 1.57 }, teo: { x: 203.2, z: -258.4, yaw: -2.36 },
  };
  const WAKE = M.WAKE, ALL = ['rafa', 'clara', 'nando', 'pili', 'ines', 'teo', 'tobias'];
  const SNOWMAN = { x: 201.8, z: -259.8 }, BENCH = { x: 199.9, z: -248.3 }, TABLE = { x: 212.0, z: -248.4 }, GEN = { x: 217.9, z: -246.4 };
  const CAT0 = { x: 193.7, z: -252.6 }, CAT1 = { x: 216.2, z: -258.9 }, BASKET = { x: 217.4, z: -253.7 }, TBENCH = { x: 203.0, z: -267.3 }, TCLOCK = { x: 206.2, z: -265.55 };
  const WOOD = { x: 199.8, z: -268.9 }, KIDS = { x: 210.4, z: -250.4 }, BOARD = { x: 198.0, z: -261.4 }, SHUT = { x: 236.4, z: -270.2 };
  const DOORF = { x: 240, z: -271.6 };
  const TOWER = { x: 240, z: -278 };
  const C = () => T().CAST;
  const LOOK = {
    lia: { skin: '#e6b48c', hair: '#5a3020', hairdo: 'braids', dress: '#e0743c', vest: '#3f4a6a', hat: 'beret', hatColor: '#d9493b', shawl: '#ffd84a', h: 0.94 },
    tobias: { skin: '#e6b48c', hair: '#f4f0ea', hairdo: 'bald', beard: true, hair2: '#f4f0ea', dress: '#6b4a30', apron: '#c9b490', glasses: true, prop: 'cane', h: 0.93 },
    rafa: { skin: '#e6b48c', hair: '#c8c2ba', hairdo: 'short', dress: '#f4efe2', apron: '#f8f4ea', stache: true, hair2: '#c8c2ba', hat: 'cap', hatColor: '#f4efe2', wide: 1.12 },
    clara: { skin: '#efc29a', hair: '#b8a89a', hairdo: 'bun', dress: '#a8506a', glasses: true, shawl: '#e0a43c' },
    nando: { skin: '#c98e62', hair: '#8a8580', hairdo: 'short', dress: '#2f5f8a', hat: 'cap', hatColor: '#2f5f8a', shawl: '#c9453a', stache: true, hair2: '#8a8580' },
    pili: { skin: '#a8714a', hair: '#6a5a52', hairdo: 'braids', dress: '#b84a5a', apron: '#f2e6c9', shawl: '#f2e6c9' },
    ines: { skin: '#efc29a', hair: '#f0ece4', hairdo: 'bun', dress: '#5a3f7a', shawl: '#d9493b', glasses: true, h: 0.92 },
    teo: { skin: '#d9a27a', hair: '#f4f0ea', hairdo: 'bald', beard: true, hair2: '#f4f0ea', dress: '#5f7a4a', vest: '#4a4436', hat: 'cap', hatColor: '#e0743c', prop: 'cane', h: 0.92 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('future', id);
  const woke = id => !!(st().woke && st().woke[id]) || (id === 'tobias' && !!st().tobias);
  const wokeN = (list = ALL) => list.filter(woke).length;
  const free = () => !!TIME.flag('future', 'pkFree');
  const shut = () => !!TIME.flag('now', 'pkShutters');

  // ------------------------------------------------------------ the color comes back as they wake (0.12 gray … 1 healed)
  function k() { return Math.min(1, 0.12 + 0.5 * wokeN() / ALL.length + (free() ? 0.38 : 0)); }
  // the frozen: each person's own material, gray until woken (uGray 1 → 0 as they wake): quarry_future.js's way
  const FROZEN = {};
  function frozenMat(P) {
    const id = P.def.id; if (FROZEN[id]) return FROZEN[id];
    const body = P.body.children[0]; if (!body || !body.material) return null;
    const m = body.material.clone(), u = { uGray: { value: woke(id) || free() ? 0 : 1 } };
    m.onBeforeCompile = sh => {
      sh.uniforms.uGray = u.uGray;
      sh.fragmentShader = 'uniform float uGray;\n' + sh.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\n  { float l = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15)); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(l * 0.86, l * 0.88, l * 0.97), uGray); }');
    };
    m.customProgramCacheKey = () => 'pkFrozen';
    body.material = m;
    return (FROZEN[id] = { m, u });
  }
  // Clara's coat, once she's taken the advice: a coat over her sweater
  function coatOn(P) {
    if (!P || P.coat) return;
    const kk = kit(), KG = PAST.API.KG; kk.add(KG.body, 0, 0, 0, 1.07, 1.0, 1.07, '#4f7fb0', { ink: 0.02 }).add(KG.torus, 0, 0.86, 0, 0.27, 0.27, 0.6, '#e0a43c', { rx: Math.PI / 2 });
    const g = new THREE.Group(); kk.build(g, { shadow: false }); P.body.add(g); P.coat = g;
  }
  function dressPeople() {
    const list = TIME.people && TIME.people.all['peaks:future']; if (!list) return;
    for (const P of list) {
      if (P.def.id === 'lia') continue;
      const F = frozenMat(P); if (F && F.tw == null) F.u.uGray.value = woke(P.def.id) || free() ? 0 : 1;
      if (P.def.id === 'clara' && (woke('clara') || free())) coatOn(P);
    }
  }

  // ------------------------------------------------------------ the dressing: one merged mesh (and its ink hull) for the props
  let built = null;
  const kit = () => PAST.API.Kit();
  function props(k0) {
    const KG = PAST.API.KG;
    let y;
    // snow banked against every wall (low mounds, away from the doors), and heaped round the square's edge
    const R = (() => { let s = 91; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    for (const b of P0.BUILDINGS) {
      const f = P0.frontOf(b, 0.3), tx = Math.cos(b.rot), tz = -Math.sin(b.rot);
      for (const s of [-1, 1]) for (let j = 0; j < 2; j++) {
        const along = s * (1.6 + j * (b.w / 2 - 1.8) * 0.9), x = f.x + tx * along, z = f.z + tz * along;
        k0.add(KG.sphere, x, VY + 0.12, z, 0.8 + R() * 0.4, 0.32 + R() * 0.18, 0.5, j ? '#e6eef5' : '#f4f8fb', { ry: -b.rot, ink: 0.01 });
      }
    }
    for (const [x, z, s] of [[188.6, -254.2, 1.2], [189.2, -262.8, 1.0], [224.6, -261.8, 1.3], [223.8, -252.4, 1.1], [209.6, -263.4, 0.9], [200.6, -263.6, 0.8], [221.6, -247.0, 1.2], [203.6, -245.6, 1.0]])
      k0.add(KG.sphere, x, gy(x, z) + 0.15, z, s, s * 0.38, s * 0.8, '#eef3f8', { ry: x, ink: 0.012 });
    // the bench by the school (Clara's coat lies on it until she takes the advice)
    y = gy(BENCH.x, BENCH.z);
    k0.box(BENCH.x, y + 0.45, BENCH.z, 1.6, 0.1, 0.5, '#8a8076').box(BENCH.x, y + 0.52, BENCH.z, 1.6, 0.05, 0.5, '#f4f8fb', { ink: 0 });
    for (const s of [-0.65, 0.65]) k0.box(BENCH.x + s, y + 0.22, BENCH.z, 0.1, 0.44, 0.4, '#6b6560', { ink: 0.006 });
    // the mail's timetable on its post, Nando's bag at its foot (a parcel, a postcard)
    y = gy(TABLE.x, TABLE.z);
    k0.rod([TABLE.x, y, TABLE.z], [TABLE.x, y + 1.9, TABLE.z], 0.06, '#6b6560', 0.008).box(TABLE.x, y + 1.6, TABLE.z - 0.05, 0.9, 0.7, 0.05, '#e8e0cc', { ink: 0.006 });
    for (let i = 0; i < 4; i++) k0.box(TABLE.x - 0.1, y + 1.78 - i * 0.14, TABLE.z - 0.09, 0.6, 0.03, 0.01, '#5a5660', { ink: 0 });
    k0.add(KG.sphere, TABLE.x + 0.5, y + 0.25, TABLE.z - 0.5, 0.32, 0.26, 0.24, '#7a5a3e', { ink: 0.008 }).box(TABLE.x + 0.45, y + 0.5, TABLE.z - 0.55, 0.3, 0.2, 0.22, '#c8a878', { ry: 0.4, ink: 0.006 }).box(TABLE.x + 0.62, y + 0.55, TABLE.z - 0.42, 0.16, 0.02, 0.11, '#f4efe2', { ry: -0.3, ink: 0.003 });
    // the post office's radio: a dead generator by its east wall, a cable up to a bent antenna on the roof
    y = gy(GEN.x, GEN.z);
    const post = P0.bld('post'), ridge = P0.roofTop(post) + P0.gableRise(post);
    k0.box(GEN.x, y + 0.35, GEN.z, 0.9, 0.7, 0.6, '#6a7078').box(GEN.x, y + 0.72, GEN.z, 0.92, 0.06, 0.62, '#f4f8fb', { ink: 0 }).add(KG.cyl, GEN.x + 0.3, y + 0.45, GEN.z + 0.31, 0.12, 0.04, 0.12, '#3a3d4a', { rx: Math.PI / 2, ink: 0.004 });
    k0.rod([GEN.x - 0.3, y + 0.6, GEN.z], [215.6, VY + ridge - 0.6, -245.4], 0.02, '#2b2235', 0).rod([215.6, VY + ridge - 0.7, -245.4], [215.6, VY + ridge + 1.6, -245.4], 0.035, '#8f8a80', 0.004);
    k0.rod([215.6, VY + ridge + 1.6, -245.4], [216.3, VY + ridge + 2.2, -245.0], 0.025, '#8f8a80', 0.004).rod([215.3, VY + ridge + 1.2, -245.4], [215.9, VY + ridge + 1.3, -245.4], 0.02, '#8f8a80', 0);
    // the cat's pawprints, from the inn's door across the square to the bakery; its collar on the inn door's latch
    for (let i = 0; i < 26; i++) {
      const t = i / 25, x = lerp(217.2, 194.4, t), z = lerp(-256.2, -251.8, t) + Math.sin(t * 9) * 0.35;
      for (const [dx, dz] of [[0.08, 0.06], [-0.06, 0.12]]) k0.add(KG.sphere, x + dx * (i % 2 ? 1 : -1), gy(x, z) + 0.012, z + dz, 0.05, 0.01, 0.05, '#8a8e9a', { ink: 0 });
    }
    k0.add(KG.torus, 218.15, VY + 1.02, -255.5, 0.09, 0.09, 0.09, '#c9453a', { ry: Math.PI / 2, ink: 0.004 }).box(218.15, VY + 1.12, -255.5, 0.04, 0.04, 0.2, '#8f8a80', { ink: 0 });
    // the basket by the inn's door: medicine, socks, slippers, a hot-water bottle, a pillow
    y = gy(BASKET.x, BASKET.z);
    k0.add(KG.cyl, BASKET.x, y + 0.2, BASKET.z, 0.32, 0.4, 0.32, '#a8703f', { ink: 0.008 }).add(KG.sphere, BASKET.x - 0.08, y + 0.44, BASKET.z, 0.22, 0.1, 0.18, '#f4efe2', { ink: 0.006 });
    k0.add(KG.sphere, BASKET.x + 0.12, y + 0.48, BASKET.z + 0.1, 0.12, 0.08, 0.16, '#c9453a', { ink: 0.004 }).box(BASKET.x - 0.1, y + 0.5, BASKET.z - 0.12, 0.08, 0.14, 0.06, '#e8e4dc', { ink: 0.003 });
    // old Tobías's little bench: a thermos, a flashlight, a small heater; his own clock on its stand, under his hand
    y = gy(TBENCH.x, TBENCH.z);
    k0.box(TBENCH.x, y + 0.5, TBENCH.z, 1.2, 0.08, 0.5, '#8a5f3e').box(TBENCH.x, y + 0.56, TBENCH.z, 1.2, 0.04, 0.5, '#f4f8fb', { ink: 0 });
    for (const s of [-0.5, 0.5]) k0.box(TBENCH.x + s, y + 0.25, TBENCH.z, 0.08, 0.5, 0.42, '#6b4a30', { ink: 0.006 });
    k0.add(KG.cyl, TBENCH.x - 0.35, y + 0.72, TBENCH.z, 0.07, 0.3, 0.07, '#5d8a6a', { ink: 0.005 }).add(KG.cyl, TBENCH.x, y + 0.62, TBENCH.z + 0.08, 0.04, 0.2, 0.04, '#3a3d4a', { rz: Math.PI / 2, ink: 0.004 });
    k0.box(TBENCH.x + 0.4, y + 0.74, TBENCH.z, 0.32, 0.3, 0.22, '#c9453a', { ink: 0.005 }).box(TBENCH.x + 0.4, y + 0.74, TBENCH.z + 0.12, 0.24, 0.2, 0.01, '#3a3d4a', { ink: 0 });
    y = gy(TCLOCK.x, TCLOCK.z);
    k0.rod([TCLOCK.x, y, TCLOCK.z], [TCLOCK.x, y + 0.85, TCLOCK.z], 0.05, '#6b4a30', 0.006).box(TCLOCK.x, y + 1.05, TCLOCK.z, 0.36, 0.42, 0.22, '#6b4630', { ink: 0.006 });
    k0.add(KG.cyl, TCLOCK.x, y + 1.08, TCLOCK.z - 0.12, 0.13, 0.02, 0.13, '#d8d4dc', { rx: Math.PI / 2, ink: 0.003 }).box(TCLOCK.x + 0.03, y + 1.11, TCLOCK.z - 0.135, 0.012, 0.08, 0.005, '#2b2235', { rz: -0.4, ink: 0 });
    // a stack of logs for the winter, buried up to the top
    y = gy(WOOD.x, WOOD.z);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) k0.add(KG.cyl6, WOOD.x - 0.6 + i * 0.38 + r * 0.19, y + 0.18 + r * 0.32, WOOD.z, 0.17, 1.1, 0.17, i % 2 ? '#8a6a4a' : '#7a5a3e', { rx: Math.PI / 2, ink: 0.006 });
    k0.add(KG.sphere, WOOD.x, y + 0.55, WOOD.z + 0.1, 1.0, 0.55, 0.75, '#f4f8fb', { ink: 0.01 });
    // the children's corner: half an igloo, skis leaning on it, a skate, goggles; the slide, buried
    y = gy(KIDS.x, KIDS.z);
    k0.add(KG.half, KIDS.x, y, KIDS.z, 1.1, 0.9, 1.1, '#eef3f8', { ink: 0.012 });
    for (let i = 0; i < 6; i++) k0.box(KIDS.x + Math.cos(i * 0.5 + 2.4) * 1.15, y + 0.35 + (i % 2) * 0.3, KIDS.z + Math.sin(i * 0.5 + 2.4) * 1.15, 0.36, 0.26, 0.3, '#f8fbfd', { ry: i * 0.5, ink: 0.006 });
    for (const s of [-0.12, 0.12]) k0.box(KIDS.x + 1.2 + s, y + 0.8, KIDS.z - 0.8, 0.08, 1.6, 0.03, '#d9493b', { rz: 0.25, ink: 0.004 });
    k0.box(KIDS.x - 1.0, y + 0.06, KIDS.z - 1.0, 0.3, 0.1, 0.1, '#3f4a6a', { ry: 0.6, ink: 0.004 }).add(KG.torus, KIDS.x - 0.6, y + 0.05, KIDS.z - 1.3, 0.12, 0.12, 0.12, '#3a3d4a', { ink: 0 });
    k0.box(KIDS.x + 1.8, y + 0.4, KIDS.z + 1.0, 0.6, 0.06, 2.0, '#4f7fb0', { rx: 0.42, ink: 0.006 }).add(KG.sphere, KIDS.x + 1.8, y + 0.5, KIDS.z + 0.8, 0.6, 0.45, 1.0, '#f4f8fb', { ink: 0.01 });
    // the mayor's notice board, in front of the town hall
    y = gy(BOARD.x, BOARD.z);
    for (const s of [-0.55, 0.55]) k0.rod([BOARD.x, y, BOARD.z + s], [BOARD.x, y + 1.9, BOARD.z + s], 0.05, '#6b4a30', 0.006);
    k0.box(BOARD.x, y + 1.45, BOARD.z, 0.06, 0.8, 1.3, '#8a5f3e', { ink: 0.008 }).box(BOARD.x + 0.04, y + 1.95, BOARD.z, 0.2, 0.1, 1.4, '#f4f8fb', { ink: 0 });
    for (const [dy, dz, c] of [[0.15, -0.35, '#f4efe2'], [0.12, 0.3, '#f2e6c9'], [-0.2, -0.05, '#f4efe2']]) k0.box(BOARD.x + 0.05, y + 1.45 + dy, BOARD.z + dz, 0.01, 0.3, 0.26, c, { ink: 0.002 });
    // on the bakery's sill: a mug with its lid on, frozen solid
    k0.add(KG.cyl, 193.3, VY + 1.25, -253.1, 0.08, 0.16, 0.08, '#d8d4cc', { ink: 0.004 }).add(KG.cyl, 193.3, VY + 1.34, -253.1, 0.085, 0.02, 0.085, '#8f8a80', { ink: 0 });
  }
  // the snowman (old Teo's): its body, then its carrot nose, scarf and buttons as they come
  function snowmanModel() {
    const g = new THREE.Group(), KG = PAST.API.KG, y = gy(SNOWMAN.x, SNOWMAN.z);
    g.position.set(SNOWMAN.x, y, SNOWMAN.z); g.rotation.y = 0.97; g.name = 'pk-fut-snowman';
    const kb = kit(); kb.add(KG.sphere, 0, 0.6, 0, 0.7, 0.62, 0.7, '#f8fbfd', { ink: 0.014 }).add(KG.sphere, 0, 1.42, 0, 0.5, 0.46, 0.5, '#f4f8fb', { ink: 0.012 }).add(KG.sphere, 0, 2.05, 0, 0.36, 0.34, 0.36, '#f8fbfd', { ink: 0.01 });
    for (const s of [-1, 1]) kb.add(KG.ball6, s * 0.12, 2.12, 0.31, 0.045, 0.045, 0.03, '#2b2235', { ink: 0 }).rod([s * 0.45, 1.5, 0], [s * 0.95, 1.85, 0.05], 0.025, '#6b4a30', 0.004);
    kb.build(g, { shadow: false });
    const part = fn => { const p = new THREE.Group(); g.add(p); const kk = kit(); fn(kk); kk.build(p, { shadow: false }); p.visible = false; return p; };
    const nose = part(kk => kk.add(KG.cone, 0, 2.03, 0.42, 0.05, 0.28, 0.05, '#e0743c', { rx: Math.PI / 2, ink: 0.004 }));
    const scarf = part(kk => kk.add(KG.torus, 0, 1.78, 0, 0.36, 0.36, 0.5, '#c9453a', { rx: Math.PI / 2, ink: 0.006 }).box(0.18, 1.55, 0.38, 0.14, 0.4, 0.04, '#c9453a', { rz: 0.15, ink: 0.004 }));
    const buttons = part(kk => { for (let i = 0; i < 3; i++) kk.add(KG.ball6, 0, 1.25 + i * 0.2, 0.46 - Math.abs(i - 1) * 0.02, 0.05, 0.05, 0.03, '#2b2235', { ink: 0 }); });
    return { g, nose, scarf, buttons };
  }
  // Copo, Pili's cat: curled by the bakery's warm wall, then at Pili's feet
  function catModel() {
    const g = new THREE.Group(), KG = PAST.API.KG, kk = kit(); g.name = 'pk-fut-cat';
    kk.add(KG.sphere, 0, 0.16, 0, 0.22, 0.15, 0.3, '#f8f6f2', { ink: 0.008 }).add(KG.sphere, 0, 0.3, 0.22, 0.13, 0.12, 0.12, '#f8f6f2', { ink: 0.008 });
    for (const s of [-1, 1]) kk.add(KG.cone4, s * 0.07, 0.43, 0.22, 0.04, 0.09, 0.03, '#f8f6f2', { ink: 0.004 }).add(KG.ball6, s * 0.045, 0.32, 0.33, 0.018, 0.022, 0.01, '#2b2235', { ink: 0 });
    kk.add(KG.sphere, 0.08, 0.2, -0.18, 0.1, 0.08, 0.12, '#a8a4ae', { ink: 0.004 }).rod([0, 0.12, -0.28], [0.22, 0.1, -0.1], 0.03, '#f8f6f2', 0.004);
    kk.build(g, { shadow: false });
    return g;
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'pk-fut-' + name; const k0 = kit(); fn(k0); k0.build(g); g.visible = false; scene.add(g); return g; };
    const KG = PAST.API.KG;
    built = { props: mk('props', props), solids: [] };
    // Clara's coat on the bench (gone once she wears it)
    built.coat = mk('coat', k0 => { const y = gy(BENCH.x, BENCH.z); k0.box(BENCH.x + 0.2, y + 0.6, BENCH.z, 0.8, 0.12, 0.42, '#4f7fb0', { ry: 0.1 }).box(BENCH.x - 0.35, y + 0.3, BENCH.z + 0.24, 0.16, 0.55, 0.1, '#4f7fb0', { rz: 0.3, ink: 0.006 }); });
    // the drift Rafa is stuck in, at the bakery's door
    built.rdrift = mk('rafa-drift', k0 => { const a = AT.rafa, y = gy(a.x, a.z); for (let i = 0; i < 7; i++) { const an = i / 7 * TAU; k0.add(KG.sphere, a.x + Math.cos(an) * 0.55, y + 0.35, a.z + Math.sin(an) * 0.55, 0.5, 0.45 + (i % 2) * 0.12, 0.45, i % 2 ? '#f4f8fb' : '#e6eef5', { ink: 0.01 }); } });
    // old Inés's heavy box (in her arms, frozen; at her feet once she's asked for help)
    built.box = mk('ines-box', k0 => { k0.box(0, 0, 0, 0.55, 0.42, 0.42, '#a8703f').box(0, 0.22, 0, 0.56, 0.03, 0.43, '#f4efe2', { ink: 0 }); });
    // the snowman, the cat
    built.snow = snowmanModel(); scene.add(built.snow.g); built.snow.g.visible = false;
    built.cat = catModel(); scene.add(built.cat); built.cat.visible = false;
    // the tower's door, tomorrow: snowed in, chained and padlocked (Lía has the key)
    built.door = mk('door', k0 => {
      const z = -273.45, y = LY;
      for (let i = 0; i < 9; i++) k0.add(KG.sphere, 240 + (i - 4) * 0.42, y + 0.4 + (4 - Math.abs(i - 4)) * 0.16, z + 0.3 + (i % 3) * 0.12, 0.72, 0.55 + (i % 2) * 0.2, 0.55, i % 2 ? '#f4f8fb' : '#e6eef5', { ink: 0.02 });
      for (const s of [-1, 1]) k0.rod([240 - 0.75, y + 2.4, z - 0.4], [240 + 0.75, y + 0.9, z - 0.4], 0.04, '#7a7680', 0.004).rod([240 + s * 0.75, y + 2.4, z - 0.42], [240 - s * 0.75, y + 0.9, z - 0.42], 0.04, '#7a7680', 0.004);
      k0.box(240, y + 1.55, z - 0.36, 0.3, 0.34, 0.12, '#6a6470', { ink: 0.006 }).add(KG.torus, 240, y + 1.78, z - 0.36, 0.1, 0.12, 0.1, '#8a8690', { ink: 0.004 });
    });
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    add(BENCH.x - 0.5, BENCH.z, 0.35); add(BENCH.x + 0.5, BENCH.z, 0.35); add(TABLE.x, TABLE.z, 0.15); add(GEN.x, GEN.z, 0.5); add(BASKET.x, BASKET.z, 0.32);
    add(TBENCH.x - 0.35, TBENCH.z, 0.35); add(TBENCH.x + 0.35, TBENCH.z, 0.35); add(TCLOCK.x, TCLOCK.z, 0.22); add(WOOD.x - 0.4, WOOD.z, 0.55); add(WOOD.x + 0.4, WOOD.z, 0.55);
    add(KIDS.x, KIDS.z, 1.15); add(KIDS.x + 1.8, KIDS.z + 0.9, 0.55); add(BOARD.x, BOARD.z - 0.55, 0.12); add(BOARD.x, BOARD.z + 0.55, 0.12); add(SNOWMAN.x, SNOWMAN.z, 0.72);
    built.rafaSolid = { x: OFF, z: OFF, _x: AT.rafa.x, _z: AT.rafa.z, r: 0.95, time: true };
    built.doorSolid = { x: OFF, z: OFF, _x: 240, _z: -273.0, r: 1.25, time: true };
    WORLD.extra.push(...built.solids, built.rafaSolid, built.doorSolid);
    return built;
  }
  const solidsOn = on => {
    if (!built) return;
    built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; });
    const r = on && !woke('rafa') && !free(); built.rafaSolid.x = r ? built.rafaSolid._x : OFF; built.rafaSolid.z = r ? built.rafaSolid._z : OFF;
    const d = on && !st().open; built.doorSolid.x = d ? built.doorSolid._x : OFF; built.doorSolid.z = d ? built.doorSolid._z : OFF;
  };
  function placeBox() {
    const B = built, a = AT.ines, up = !woke('ines') && !free();
    if (up) { B.box.position.set(a.x + 0.42, VY + 0.62, a.z); B.box.rotation.y = 0; }
    else { B.box.position.set(a.x + 0.55, VY + 0.21, a.z + 0.75); B.box.rotation.y = 0.4; }
  }
  function placeCat() { const at = woke('pili') || free() ? CAT1 : CAT0; built.cat.position.set(at.x, gy(at.x, at.z), at.z); built.cat.rotation.y = woke('pili') || free() ? -2.2 : 0.6; }
  function showSnowman() { const S = built.snow, s = st(); S.nose.visible = woke('teo'); S.scarf.visible = !!s.snow2; S.buttons.visible = !!s.snowDone; }
  function show(on) {
    const B = build(), s = st();
    B.props.visible = on; B.snow.g.visible = on; B.cat.visible = on;
    B.coat.visible = on && !woke('clara') && !free();
    B.rdrift.visible = on && !woke('rafa') && !free();
    B.box.visible = on; B.door.visible = on && !s.open;
    if (on) { placeBox(); placeCat(); showSnowman(); }
    solidsOn(on);
  }

  // ------------------------------------------------------------ time stands still: today's clocks stopped at three (the tower's
  // too), the snow hanging in the air over the village. Kept every frame (peaks.js's sync() puts today's back whenever the save
  // changes); put back as Chapter 1 left them when you leave
  function clockList() { const B = P0.built; if (!B || !B.objects) return []; return Object.values(B.objects.clocks || {}).concat(B.objects.tower && B.objects.tower.clk ? [B.objects.tower.clk] : []); }
  const TH3 = 3 / 12 * TAU;
  function keepStill() {
    const B = P0.built; if (!B) return;
    const fr = free();
    if (!fr) clockList().forEach(S => { S.run = false; if (Math.abs(S.th - TH3) > 1e-4 || S.tm !== 0) { S.spin = 0; S.setTime(3, 0, true); } });
    const k0 = fr ? 0 : 1; if (B.state.freezeT !== k0) B.freezeTo(k0);
  }
  function todayClocks() {
    const B = P0.built; if (!B || !B.objects) return;
    const g = G(), set = (g.state.peaks && g.state.peaks.set) || {};
    for (const cl of P0.CLOCKS) {
      const S = B.objects.clocks[cl.id]; if (!S) continue;
      S.spin = 0;
      if (cl.kind === 'time') { if (set[cl.id]) { S.setTime(cl.h, cl.m, true); S.run = true; } else { S.setTime(cl.froze[0], cl.froze[1], true); S.run = false; } }
      else { S.setTime(9, 41, true); S.run = false; }
    }
    const tc = B.objects.tower && B.objects.tower.clk; if (tc) { tc.setTime(11, 55, true); tc.run = !!(g.state.flags && g.state.flags.peaksFree); }
    B.freezeTo(1 - P0.CLOCKS.filter(c => set[c.id]).length / P0.CLOCKS.length);
  }
  function timeStill(on) {
    if (on) { if (free()) clockList().forEach(S => { S.spin = 0; S.setTime(3, 0, true); S.run = true; }); keepStill(); }
    else todayClocks();
  }

  // ------------------------------------------------------------ every frame (after TIME's people turn to you): the frozen stay as they
  // froze; the gray goes as they wake; the clocks stay stopped until the cuckoo sings
  function late(dt) {
    if (!built) return;
    const list = TIME.people && TIME.people.all['peaks:future'], fr = free();
    if (list) for (const P of list) {
      if (P.def.id === 'lia' || woke(P.def.id) || fr) continue;
      P.g.rotation.y = P.api.yaw; P.body.position.y = 0; P.body.rotation.z = 0;
    }
    for (const F of Object.values(FROZEN)) if (F.tw != null) { F.tw = Math.max(0, F.tw - dt * 0.7); F.u.uGray.value = F.tw; if (F.tw <= 0) F.tw = null; }
    keepStill();
  }
  function update(dt, t) {
    const B = built; if (!B) return;
    if (B.cat.visible) { const s = 1 + Math.sin(t * 2.2) * 0.04; B.cat.scale.set(1, s, 1); }
  }

  // ------------------------------------------------------------ talking to the people of tomorrow (the main path first; side quests come
  // through STORY.talkHooks below, as a little menu)
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const chats = {};
  // (each list from its first line, again whenever someone's list changes: Lía's «every clock is running» comes first once it's so)
  const cycle = (id, keys) => { const c = chats[id], k = !c || c.first !== keys[0] ? 0 : (c.k + 1) % keys.length; chats[id] = { first: keys[0], k }; return say1(id, keys[k]); };
  function talk(id) {
    const s = st();
    if (id === 'lia') {
      if (!s.met) return liaScene();
      if (free()) return cycle('lia', ['lia.done', 'lia.chat1', 'lia.chat2', 'lia.chat3']);
      if (s.open) return cycle('lia', ['lia.chat1', 'lia.chat2', 'lia.chat3']);
      return say1('lia', WAKE.every(woke) ? 'lia.ready' : 'lia.again');
    }
    if (!woke(id)) return wakeScene(id);
    if (id === 'tobias') return shut() ? cycle('tobias', ['tobias.shut', 'tobias.chat']) : say1('tobias', 'tobias.chat');
    return say1(id, id + '.chat');
  }
  // the main path, 1: Lía shows advice and guesses (the card), then asks you for some
  async function liaScene() {
    const s = st(), L0 = () => who('lia'); if (!L0()) return;
    if (!s.demo) {
      M.lock(true);
      try { M.frame2(L0()); await wait(0.4); await M.say(L0(), ln('lia.hello')); await M.demo(L0(), T().DEMO['lia.demo'], T().MARKS['lia.demo']); } finally { M.lock(false); }
      await M.card(T().CARDS.advice, true);
      s.demo = true; G().save();
    }
    M.lock(true); try { M.frame2(L0()); await M.say(L0(), ln('lia.ask')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.lia, { tips: T().TIPS }); if (!r) { M.think('{lia} is waiting: what would you do in her place?', 4.5); return; }
    TIME.grade('pk.lia', r.letter); s.lia = r.letter;
    M.lock(true); try { M.frame2(L0()); await M.say(L0(), ln('lia.cocoa')); await M.say(L0(), ln('lia.wake')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('Gray people all over the village, each stuck on a problem. Look for a clue near each one, then give advice, or guess.', 6);
  }
  // the main path, 2: a frozen villager; advice (or a guess) in tomorrow's words wakes them
  async function wakeScene(id) {
    const s = st(), p = who(id); if (!p) return;
    if (!free()) { M.lock(true); try { M.frame2(p); await wait(0.3); await M.hushed(p, ln(id + '.frozen')); } finally { M.lock(false); } }
    if (!s.met) { M.think('Gray, frozen… as if stuck on something. Someone in the square is still talking. Ask her.', 5.5); return; }
    if (id === 'tobias' && !WAKE.every(woke)) { M.think('{tobias} is stuck on the biggest problem of all. Wake the village first.', 5); return; }
    const r = await M.ask(T().TASKS[id], { tips: T().TIPS, icon: 'star' });
    if (!r) { M.think(id === 'nando' || id === 'pili' ? 'Still gray. A guess would wake them: look around for a clue.' : 'Still gray. Good advice would wake them: look around for a clue.', 4.5); return; }
    TIME.grade('pk.wake.' + id, r.letter);
    s.woke = s.woke || {}; s.woke[id] = r.letter; if (id === 'tobias') s.tobias = r.letter; G().save();
    await wakeUp(id);
    if (id === 'tobias') { await openScene(); return; }
    if (WAKE.includes(id) && WAKE.every(woke)) {
      const L0 = who('lia');
      if (L0) { M.lock(true); try { M.frame2(L0); await M.say(L0, ln('lia.ready')); } finally { M.lock(false); } }
      M.think('Old {tobias}, at the workshop. He froze with his hand on his own clock.', 5);
    } else if (WAKE.includes(id)) M.think(`Escarcha is waking up (${wokeN(WAKE)}/4).`, 3.5);
  }
  async function wakeUp(id) {
    const g = G(), P = M.person('future', id), F = P && frozenMat(P), B = build();
    M.lock(true);
    try {
      if (F) F.tw = 1;
      snd('learned'); if (P) g.w3d.fx.sparkle(P.api.x, (P.api.y || 0) + 1.3, P.api.z, 22, ['#ffd166', '#fff3a0', '#bfe4ff']);
      if (id === 'rafa') { const a = AT.rafa; g.w3d.fx.puff(a.x, VY + 0.5, a.z, 16, 0.45, '#f4f8fb'); await STORY.tween(0.8, kk => { B.rdrift.scale.set(1, Math.max(0.01, 1 - kk), 1); }); B.rdrift.visible = false; B.rdrift.scale.set(1, 1, 1); solidsOn(true); }
      if (id === 'clara') { B.coat.visible = false; coatOn(P); snd('swoosh'); }
      if (id === 'ines') { snd('wood'); placeBox(); }
      if (id === 'teo') { showSnowman(); snd('pip'); }
      if (id === 'pili') {
        const c = B.cat, a = { x: c.position.x, z: c.position.z }; c.rotation.y = Math.atan2(CAT1.x - a.x, CAT1.z - a.z);
        await STORY.tween(1.6, kk => { const x = lerp(a.x, CAT1.x, kk), z = lerp(a.z, CAT1.z, kk); c.position.set(x, gy(x, z) + Math.abs(Math.sin(kk * 30)) * 0.08, z); });
        placeCat(); snd('pip');
      }
      await wait(id === 'pili' ? 0.3 : 1.0);
      const p = who(id); M.frame2(p); await M.say(p, ln(id + '.awake'));
      if (id === 'ines' || id === 'teo') { G().state.coins = (G().state.coins || 0) + 3; UI.toast('+3 coins'); }
      g.save();
    } finally { M.lock(false); }
  }
  // the main path, 3: old Tobías awake: his advice for the tower, and the key (Lía unlocks the door, the drift goes)
  async function openScene() {
    const s = st(), g = G(), B = build();
    M.lock(true);
    try {
      const Tb = who('tobias'); if (Tb) { M.frame2(Tb); await M.demo(Tb, T().DEMO['tobias.demo'], T().MARKS['tobias.demo']); }
      M.shot(V(DOORF.x - 5.4, LY + 4.4, DOORF.z + 6.8), V(240, LY + 1.4, -273.6), 1.0); await wait(1.1);
      snd('wood'); await wait(0.3); snd('crunch'); g.w3d.fx.puff(240, LY + 0.8, -273.2, 22, 0.55, '#f4f8fb');
      await STORY.tween(0.8, kk => { B.door.scale.set(1, Math.max(0.01, 1 - kk), 1); B.door.position.y = (LY + 1) * kk * 0.3; });
      B.door.visible = false; B.door.scale.set(1, 1, 1); B.door.position.y = 0;
      s.open = true; solidsOn(true); g.save(); snd('chime');
      g.cam.override = null;
      const L0 = who('lia'); if (L0) { M.frame2(L0); await M.say(L0, ln('lia.tower')); }
    } finally { g.cam.override = null; M.lock(false); }
    M.think('The tower’s door is open: up the path to the ledge, and in.', 5);
  }

  // ------------------------------------------------------------ side quest: «A warning from tomorrow» (the Future changes today)
  async function warnScene() {
    const s = st(), Tb = () => who('tobias'); if (!Tb()) return;
    M.lock(true); try { M.frame2(Tb()); await wait(0.3); await M.say(Tb(), ln('tobias.warn')); s.warned = true; TIME.flag('future', 'pkWarn', true); G().save(); } finally { M.lock(false); }
    M.think('A warning from tomorrow. Today’s {tobias}, at his workshop, should hear it, as advice.', 5.5);
  }
  async function warnToday(p) {
    const r = await M.ask(T().TASKS.warn, { tips: T().TIPS }); if (!r) return;
    TIME.grade('pk.warn', r.letter);
    M.lock(true);
    try {
      p.talking = true; M.frame2(p); await M.say(p, ln('now.tobias.warn'));
      TIME.flag('now', 'pkShutters', true); M.st('now').shutters = r.letter; TIME.refresh(); G().save();
      M.shot(V(TOWER.x - 15, LY + 13, TOWER.z + 19), V(TOWER.x, LY + 18.4, TOWER.z), 1.2); await wait(1.5);
      snd('wood'); await wait(0.25); snd('wood'); snd('chime'); await wait(0.9);
    } finally { p.talking = false; G().cam.override = null; M.lock(false); }
    M.think('Shutters on the belfry, today… What will tomorrow’s tower look like now?', 5);
  }
  // the shutters: new and red today, old and faded tomorrow (still closed, still holding)
  function shutterMesh(old) {
    const g = new THREE.Group(), kk = kit(), red = old ? '#9a6a64' : '#c9453a', frame = old ? '#6b625e' : '#7a3a2a', y = 16.8 + 1.8, r = 3.25;
    for (let i = 0; i < 4; i++) {
      const an = i / 4 * TAU, cx = Math.sin(an) * r, cz = Math.cos(an) * r, tx = Math.cos(an), tz = -Math.sin(an);
      for (const s of [-1, 1]) {
        const lx = cx + tx * s * 0.92, lz = cz + tz * s * 0.92;
        kk.box(lx, y, lz, 1.78, 2.7, 0.1, red, { ry: an, ink: 0.01 });
        for (let j = 0; j < 7; j++) kk.box(lx + Math.sin(an) * 0.06, y - 1.1 + j * 0.36, lz + Math.cos(an) * 0.06, 1.6, 0.05, 0.04, frame, { ry: an, ink: 0 });
      }
      kk.box(cx + Math.sin(an) * 0.08, y, cz + Math.cos(an) * 0.08, 0.08, 2.7, 0.06, frame, { ry: an, ink: 0 });
    }
    kk.build(g, { shadow: false });
    g.position.set(TOWER.x, LY, TOWER.z); g.name = 'pk-shutters-' + (old ? 'old' : 'new');
    return { obj: g };
  }
  TIME.effect('peaks.shutters', { region: 'peaks', when: () => shut(),
    show: { now: () => shutterMesh(false), future: () => shutterMesh(true) },
    act: { now: { x: SHUT.x, z: SHUT.z, r: 1.4, label: 'Look', run: async () => { M.lookAt('w.pkf_shutter', 'New red {w.pkf_shutter:pl} on the {w.pkf_belfry}, closed against the wind. {tobias} and {lia} put them up today.', 6); } },
      future: { x: SHUT.x, z: SHUT.z, r: 1.4, label: 'Look', run: async () => { M.lookAt('w.pkf_shutter', 'Up on the {w.pkf_belfry}: old {w.pkf_shutter:pl}, their red gone gray with years… but closed, and holding. No snow got in.', 6.5); const s = st(); if (!s.shutSeen) { s.shutSeen = true; G().save(); } } } } });
  // today: Tobías hears the warning (his Talk has no id: he's matched by where he stands)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || !TIME.open('peaks') || it.who || !TIME.flag('future', 'pkWarn')) return null;
    const tp = M.todayP('tobias'); if (!tp || Math.hypot(it.x - tp.x, it.z - tp.z) > 0.8) return null;
    const p = M.todayApi('tobias', 'Tobías'); if (!p) return null;
    if (!shut()) return [{ label: 'A warning from tomorrow', sub: '◆ side quest', run: () => warnToday(p) }];
    return [{ label: 'The shutters', run: async () => { M.lock(true); try { p.talking = true; M.frame2(p); await M.say(p, ln('now.tobias.shut')); } finally { p.talking = false; M.lock(false); } } }];
  });

  // ------------------------------------------------------------ side quest: «Notes for the village meeting» (old Inés, the mayor)
  async function boardScene() {
    const s = st(), I = () => who('ines'); if (!I()) return;
    if (!s.boardAsked) { M.lock(true); try { M.frame2(I()); await wait(0.3); await M.say(I(), ln('ines.board')); s.boardAsked = true; G().save(); } finally { M.lock(false); } }
    s.board = s.board || [];
    for (let i = 0; i < 3; i++) {
      if (s.board[i]) continue;
      M.lock(true); try { M.frame2(I()); await M.say(I(), ln('board.n' + (i + 1))); } finally { M.lock(false); }
      const r = await M.ask(T().TASKS['board' + (i + 1)], { tips: T().TIPS }); if (!r) { M.think('{ines} is waiting: what would you advise?', 4); return; }
      TIME.grade('pk.board' + (i + 1), r.letter); s.board[i] = r.letter; G().save();
      M.lock(true); try { const I2 = I(); M.frame2(I2); await M.say(I2, ln('board.ok')); } finally { M.lock(false); }
    }
    M.lock(true); try { const I3 = I(); M.frame2(I3); await M.say(I3, ln('board.done')); s.boardDone = true; G().state.coins = (G().state.coins || 0) + 6; UI.toast('+6 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ side quest: «Old Teo's snowman»
  async function snowScene() {
    const s = st(), Te = () => who('teo'); if (!Te()) return;
    if (!s.snowAsked) { M.lock(true); try { M.frame2(Te()); await wait(0.3); await M.say(Te(), ln('snow.ask')); s.snowAsked = true; G().save(); } finally { M.lock(false); } }
    if (!s.snow2) {
      const r = await M.ask(T().TASKS.snow2, { tips: T().TIPS }); if (!r) { M.think('{teo} is waiting: what would be better, for its neck?', 4); return; }
      TIME.grade('pk.snow2', r.letter); s.snow2 = r.letter; showSnowman(); snd('swoosh'); G().save();
      M.lock(true); try { const T2 = Te(); M.frame2(T2); await M.say(T2, ln('snow.next')); } finally { M.lock(false); }
    }
    const r3 = await M.ask(T().TASKS.snow3, { tips: T().TIPS }); if (!r3) { M.think('{teo} is waiting: what would you put on its belly?', 4); return; }
    TIME.grade('pk.snow3', r3.letter); s.snowDone = r3.letter; showSnowman(); snd('pip');
    M.lock(true); try { const T3 = Te(); M.frame2(T3); await M.say(T3, ln('snow.done')); G().state.coins = (G().state.coins || 0) + 5; UI.toast('+5 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ the Talk menus (tomorrow)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'future' || TIME.regionNow() !== 'peaks') return null;
    const s = st(), out = [];
    if (it.who === 'future:tobias' && woke('tobias') && !s.warned) out.push({ label: 'Why did the gears freeze?', sub: '◆ side quest', run: warnScene });
    if (it.who === 'future:ines' && (woke('ines') || free()) && !s.boardDone) out.push({ label: 'The village meeting', sub: '◆ side quest', run: boardScene });
    if (it.who === 'future:teo' && woke('teo') && !s.snowDone) out.push({ label: 'Your snowman', sub: '◆ side quest', run: snowScene });
    return out.length ? out : null;
  });

  // ------------------------------------------------------------ E: the tower's door, and the things you can look at
  const LOOKS = [
    { id: 'w.pkf_coat', at: { x: BENCH.x, z: BENCH.z - 1.15 }, line: () => (woke('clara') || free() ? 'The bench by the school, and a {w.pkf_sleeve}-shaped dent in the snow where the {w.pkf_coat} lay.' : 'A {w.pkf_coat}, folded on the bench beside {clara}. One {w.pkf_sleeve} hangs down into the snow.') },
    { id: 'w.pkf_timetable', at: { x: TABLE.x, z: TABLE.z - 1.1 }, line: () => 'The mail’s {w.pkf_timetable}, held up by one {w.pkf_pin}: «Down the mountain: every day at three». A {w.pkf_parcel} and a {w.pkf_postcard} still wait in the bag at its foot.' },
    { id: 'w.pkf_antenna', at: { x: 218.2, z: -248.0 }, line: () => 'The post office’s radio: a bent {w.pkf_antenna} on the roof, a {w.pkf_cable} down to a dead {w.pkf_generator}. No {w.pkf_signal}. On its last strip of paper, a {w.pkf_message}: «Road closed».' },
    { id: 'w.pkf_pawprint', at: { x: 214.6, z: -255.4 }, line: () => (woke('pili') || free() ? 'The {w.pkf_pawprint:pl} across the square, filling up with snow. {cat} is home.' : 'Little {w.pkf_pawprint:pl} in the snow, from the inn’s door across the square… toward the bakery’s warm chimney. A cat’s {w.pkf_collar} hangs on the door’s {w.pkf_latch}, a few white {w.pkf_whiskers} caught in it.') },
    { id: 'w.pkf_thermos', at: { x: TBENCH.x, z: TBENCH.z + 1.2 }, line: () => 'Old {tobias}’s little bench: a {w.pkf_thermos}, a {w.pkf_flashlight} with no {w.pkf_battery}, and a little {w.pkf_heater}… with nobody to switch it on.' },
    { id: 'w.pkf_windowpane', at: { x: 217.0, z: -260.4 }, line: () => 'Through the inn’s frosted {w.pkf_windowpane}: a cold {w.pkf_radiator}, an {w.pkf_armchair}, and a {w.pkf_rockingchair} stopped in mid-rock.' },
    { id: 'w.pkf_medicine', at: { x: 216.4, z: -253.2 }, line: () => 'A basket by the inn’s door: {w.pkf_medicine} for a {w.pkf_fever}, wool {w.pkf_sock:pl}, {w.pkf_slipper:pl}, {w.pkf_pajamas}, a {w.pkf_pillow} and a {w.pkf_hotwaterbottle}… for someone sick upstairs.' },
    { id: 'w.pkf_quilt', at: { x: 195.9, z: -267.6 }, line: () => 'In the town hall’s window: a {w.pkf_quilt}, a {w.pkf_cushion}, and a {w.pkf_yarn} whose {w.pkf_thread} trails off to the floor. Someone was knitting when it all stopped.' },
    { id: 'w.pkf_forecast', at: { x: 207.0, z: -259.9 }, line: () => '{teo}’s weather board. The {w.pkf_forecast}: «More snow». The {w.pkf_temperature}: ten {w.pkf_degree:pl} below zero. Under it, in chalk: «{w.pkf_thaw}?»' },
    { id: 'w.pkf_eaves', at: { x: 216.6, z: -268.6 }, line: () => 'Icicles hang from the little house’s {w.pkf_eaves}. Its {w.pkf_gutter} is a solid bar of ice, and so is the {w.pkf_pipe} down the wall.' },
    { id: 'w.pkf_log', at: { x: WOOD.x, z: WOOD.z + 1.3 }, line: () => 'A stack of {w.pkf_log:pl} for the winter, {w.pkf_buried} up to the top.' },
    { id: 'w.pkf_igloo', at: { x: KIDS.x - 0.4, z: KIDS.z - 1.8 }, line: () => 'The children’s corner: half an {w.pkf_igloo}, a pair of {w.pkf_ski:pl}, one {w.pkf_skate}, some {w.pkf_goggles}… and the {w.pkf_slide}, buried to its top.' },
    { id: 'w.pkf_mug', at: { x: 194.2, z: -253.0 }, line: () => 'On the bakery’s sill: a {w.pkf_mug} of {w.pkf_cocoa} with its {w.pkf_lid} on, frozen solid. Through the window, {w.pkf_toast} and {w.pkf_butter}: a breakfast nobody ate.' },
    { id: 'w.pkf_meeting', at: { x: BOARD.x + 0.9, z: BOARD.z }, line: () => 'The {w.pkf_mayor}’s notice board: «Village {w.pkf_meeting}, Friday». Three notes are pinned under it, asking for advice.' },
  ];
  // Looks said from elsewhere (the tower's door): listed so PEAKT's cover() sees their words
  const SEEN = [{ id: 'w.pkf_padlock', line: 'The tower’s door, snowed in: chains across it, a {w.pkf_padlock} as big as a fist, both {w.pkf_hinge:pl} white with frost. Old {tobias} keeps the key.' }];
  function interactables() {
    const s = st(), out = [];
    out.push({ x: DOORF.x, z: DOORF.z, y: LY, r: 2.6, label: s.open ? 'Go in' : 'Look', run: async () => {
      if (!s.open) { M.lookAt(SEEN[0].id, SEEN[0].line, 6); return; }
      if (typeof PK_FTOWER !== 'undefined' && PK_FTOWER) await PK_FTOWER.enter();
    } });
    for (const L0 of LOOKS) out.push({ x: L0.at.x, z: L0.at.z, r: 1.25, label: 'Look', run: async () => {
      M.lookAt(L0.id, L0.line(), 5.5);
      if (L0.id === 'w.pkf_meeting' && (woke('ines') || free()) && !st().boardDone) M.think('Old {ines} is waiting for answers. Ask her about the meeting.', 4);
    } });
    return out;
  }
  function nextId() { const s = st(); return !s.met ? 'lia' : WAKE.some(x => !woke(x)) ? 'frozen' : !woke('tobias') ? 'tobias' : 'door'; }
  const HINTS = { lia: '{mimo} points at someone in the square… the only one with any color.', frozen: '{mimo} tugs your sleeve toward someone gray.', door: '{mimo} looks up the path at the tower’s door.',
    tobias: '{mimo} points at the old clockmaker, gray by the workshop.', rafa: '{mimo} points at a gray baker, half buried at the bakery’s door.', clara: '{mimo} points at a gray woman shivering by the school.',
    nando: '{mimo} points at a gray postman by the post office.', pili: '{mimo} points at a gray innkeeper at the inn’s door.', ines: '{mimo} points at a very old woman by the town hall, a box in her arms.',
    teo: '{mimo} points at an old man by a snowman with no nose.' };
  function target(id) {
    if (id === 'door') return (typeof PK_FTOWER !== 'undefined' && PK_FTOWER && PK_FTOWER.inside && PK_FTOWER.target()) || { x: DOORF.x, z: DOORF.z, hint: HINTS.door };
    if (id === 'frozen') { const n = WAKE.find(x => !woke(x)); if (!n) return target(woke('tobias') ? 'door' : 'tobias'); id = n; }
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || HINTS.frozen };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('pk_future') ? 'pk_future' : 'future');
  // the village wakes for good once the cuckoo sings again (the tower calls this): the clocks run, the snow falls, the color comes back
  function freed() {
    TIME.flag('future', 'pkFree', true);
    for (const F of Object.values(FROZEN)) if (F.u.uGray.value > 0) F.tw = F.u.uGray.value;
    const list = TIME.people && TIME.people.all['peaks:future']; if (list) for (const P of list) if (P.def.id !== 'lia') { const F = frozenMat(P); if (F && F.u.uGray.value > 0) F.tw = F.u.uGray.value; if (P.def.id === 'clara') coatOn(P); }
    if (TIME.world() === 'future') { clockList().forEach(S => { S.spin = 0; S.setTime(3, 0, true); S.run = true; }); const B = P0.built; if (B) B.freezeTo(0); show(true); }
    TIME.refresh();
  }

  // ------------------------------------------------------------ the side quests (QUESTS.LIST: they start as the story reaches them)
  if (typeof QUESTS !== 'undefined') {
    const fS = s => M.sf(s), nS = s => M.sn(s);
    const futAt = id => () => M.via('future', () => target(id));
    const wk = (s, id) => !!(fS(s).woke && fS(s).woke[id]) || !!(s && s.worlds && s.worlds.flags && s.worlds.flags.future && s.worlds.flags.future.pkFree);
    const warnEx = () => { const l = lang(), m = (T().TASKS.warn.model || {})[l] || ''; return `«${M.plainT(m).replace(/\s*[.。]\s*$/, '')}»`; };
    if (!QUESTS.LIST.some(q => q.id === 'pk.warn')) QUESTS.LIST.push({ id: 'pk.warn', kind: 'side',
      title: 'A warning from tomorrow', get giver() { return M.fillEn('old {tobias}, at the workshop (the Frost Peaks, tomorrow)'); },
      started: s => !!fS(s).warned,
      steps: [
        { get text() { return M.fillEn('Today: tell {tobias} to close the tower’s shutters'); }, get why() { return M.fillEn(`A warning from tomorrow, given as advice: ${warnEx()}. Today’s Tobías is at his workshop.`); },
          done: s => !!nS(s).shutters, target: () => M.via('now', () => { const p = M.todayP('tobias'); return p ? { x: p.x, z: p.z, hint: '{mimo} points at Tobías, by his workshop.' } : null; }), hint: '{mimo} points toward the workshop.' },
        { text: 'Tomorrow: look up at the belfry', why: 'The shutters went up today… What does tomorrow’s tower look like now?', done: s => !!fS(s).shutSeen,
          target: () => M.via('future', () => ({ x: SHUT.x, z: SHUT.z, hint: '{mimo} looks up at the top of the tower.' })), hint: '{mimo} looks up at the tower.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'pk.board')) QUESTS.LIST.push({ id: 'pk.board', kind: 'side',
      get title() { return M.fillEn('Notes for the village meeting'); }, get giver() { return M.fillEn('old {ines}, the mayor (the Frost Peaks, tomorrow)'); },
      started: s => !!fS(s).met,
      steps: [
        { get text() { return M.fillEn('In the Future: wake old {ines}, by the town hall'); }, get why() { return M.fillEn(`She froze under a heavy box, too proud to ask for help. Advise her: ${M.sx('advice')}.`); },
          done: s => wk(s, 'ines'), target: futAt('ines'), hint: HINTS.ines },
        { get text() { return 'Answer the neighbors’ notes with advice (' + ((fS(G().state).board || []).filter(Boolean).length) + '/3)'; }, get why() { return M.fillEn(`Three notes on the mayor’s board, three problems. What would you do? ${M.sx('advice')}.`); },
          done: s => !!fS(s).boardDone, target: futAt('ines'), hint: HINTS.ines },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'pk.snow')) QUESTS.LIST.push({ id: 'pk.snow', kind: 'side',
      get title() { return M.fillEn('Old {teo}’s snowman'); }, get giver() { return M.fillEn('old {teo}, by the weather house (the Frost Peaks, tomorrow)'); },
      started: s => !!fS(s).met,
      steps: [
        { get text() { return M.fillEn('In the Future: wake old {teo}: his snowman has no nose'); }, get why() { return M.fillEn(`There’s a carrot in his pocket. Advise him: ${M.sx('advice')}.`); },
          done: s => wk(s, 'teo'), target: futAt('teo'), hint: HINTS.teo },
        { get text() { return M.fillEn('Help {teo} finish it: a scarf, and buttons'); }, get why() { return M.fillEn(`What would be better? ${M.sx('advice')}.`); },
          done: s => !!fS(s).snowDone, target: futAt('teo'), hint: HINTS.teo },
      ] });
  }

  // ------------------------------------------------------------ the dressing's hooks (TIME calls them: time.js "TIME dresses it")
  Object.assign(M.DRESS.future, {
    people: PEOPLE,
    k: () => k(),
    on(api) { show(true); M.hideToday(api); dressPeople(); timeStill(true); },
    off() { show(false); timeStill(false); },
    entered() { show(true); dressPeople(); },
    late: (api, dt) => { late(dt); if (typeof PK_FTOWER !== 'undefined' && PK_FTOWER && PK_FTOWER.inside) PK_FTOWER.late(dt); },
    update(api, dt, t) { update(dt, t); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, WAKE, ALL, PEOPLE, LOOKS, SEEN, SNOWMAN, k, woke, wokeN, who, build, show, freed, timeStill, dressPeople, shutterMesh,
    target: id => target(id), song: () => song(), init: () => {}, changed: () => {},
    _: { talk: id => talk(id), liaScene, wakeScene, wakeUp, openScene, warnScene, warnToday, boardScene, snowScene, get built() { return built; } } };
})();
