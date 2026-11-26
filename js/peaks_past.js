'use strict';
// The Frost Peaks, long ago (DESIGN.md 20 "T3b"): Escarcha about 40 years back, the winter after the concert, its clocks brand new.
// TIME dresses it (time_peaks.js PEAKT.DRESS.past): the clockmaker's bench out in the snow (a vise, a clock face, gears), a crate of
// new clocks, the mule driver's wagon and his mule at the gate, a bonfire on the square, the weather keeper's stand, the town hall's
// alarm bell on its post, goats, a shelter for travelers, a new signpost, and a boy's small footprints from the inn up to a dark ice
// cave in the crag beside the tower (the White Hollow). Today's Escarcha people (peaks.js) are hidden.
// The people of then (TIME's person kit): the clockmaker (Tobías's master), young Tobías (her apprentice), the innkeeper, little Pili
// (today's innkeeper), young Inés (the town hall's clerk), young Teo (the weather keeper) and the mule driver. Each language names
// its own (PKPTXT.CAST).
// The main path (PEAKT.PSTEPS): the clockmaker tells that night with both pasts, the card, «Cuando llegué, nevaba» → the mule driver
//   («caminaba solo»), little Pili («comió sopa») and young Inés («Era medianoche cuando sonó la alarma») each tell a piece → the
//   whole story to the clockmaker («Cuando el niño salió de la posada, nevaba mucho») → the White Hollow (peaks_past_dungeon.js) →
//   the Blizzard Owl (peaks_time_boss.js) → the echo → Noa.
// Side quests (QUESTS.LIST): «Young Tobías’s first clock» (cross-time: his cuckoo clock's frozen door, then its plaque, «Lo terminaste
//   cuando nevaba»; it hangs over the workshop door long ago, today, and tomorrow, where it's the only clock still ticking), «The
//   weather book» (young Teo's blank page: «Aquella noche hacía mucho viento» / «Un niño se perdió y la relojera lo encontró»),
//   «Little Pili’s sled» (a memory for Mimo, then «El trineo estaba detrás de la posada»).
const PK_PAST = (() => {
  if (typeof TIME === 'undefined' || typeof PEAKT === 'undefined' || !PEAKT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M = PEAKT, T = () => PKPTXT;
  const G = () => A.G;
  const lang = () => A.lang();
  const st = () => M.st('past');
  const wait = s => STORY.wait(s);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are (checked with PEAKT._.t.probe in every world)
  const AT = {
    master: { x: 206.2, z: -266.2, yaw: 0 }, tobias: { x: 211.4, z: -266.4, yaw: -0.5 }, inn: { x: 217.4, z: -258.8, yaw: -1.57 },
    pili: { x: 215.2, z: -254.0, yaw: -2.2 }, ines: { x: 196.6, z: -264.6, yaw: 1.57 }, teo: { x: 207.4, z: -259.6, yaw: -2.4 }, driver: { x: 192.6, z: -254.6, yaw: 2.6 },
  };
  const BENCH = { x: 201.6, z: -266.8 }, CRATE = { x: 199.6, z: -267.4 }, TOOLS = { x: 212.6, z: -267.6 }, WAGON = { x: 190.2, z: -253.4 }, MULE = { x: 191.8, z: -251.8 };
  const BARREL = { x: 217.9, z: -253.2 }, POST = { x: 195.6, z: -261.0 }, STAND = { x: 204.2, z: -260.6 }, FIRE = { x: 210.6, z: -256.6 }, PEN = { x: 186.2, z: -251.2 };
  const BASKET = { x: 226.2, z: -259.6 }, SHELF = { x: 213.0, z: -269.4 }, SHELTER = { x: 187.0, z: -265.2 }, SIGN = { x: 186.6, z: -255.6 }, ROCK = { x: 228.6, z: -269.8 };
  const HOOK = { x: 204.4, z: -268.05 }, DRIFT = { x: 221.4, z: -262.6 }, CUCKOO = { x: 209.6, z: -268.05, look: { x: 209.6, z: -266.9 } };
  const CAVE = M.CAVE, VY = M.VY;
  const C = () => T().CAST;
  const LOOK = {
    master: { skin: '#e6b48c', hair: '#8a7a6e', hairdo: 'bun', dress: '#5a4a6a', apron: '#8a5a3a', glasses: true, hat: 'scarf', hatColor: '#c9453a', prop: 'lantern', h: 1.0 },
    tobias: { skin: '#e6b48c', hair: '#5a3a26', hairdo: 'short', dress: '#6b4a30', apron: '#c9b490', vest: '#3f3a4a', h: 1.02 },
    inn: { skin: '#efc29a', hair: '#3a2b26', hairdo: 'bun', dress: '#b84a5a', apron: '#f4efe2', shawl: true, h: 0.98 },
    pili: { kid: true, skin: '#a8714a', hair: '#1f1a18', hairdo: 'braids', ribbon: '#f2e6c9', dress: '#b84a5a', apron: '#f2e6c9', hat: 'beret', hatColor: '#d9493b', h: 0.68 },
    ines: { skin: '#efc29a', hair: '#3a2b26', hairdo: 'bun', dress: '#5a3f7a', shawl: true, glasses: true, h: 1.0 },
    teo: { skin: '#d9a27a', hair: '#5a3a26', hairdo: 'short', beard: true, dress: '#5f7a4a', vest: '#4a4436', hat: 'cap', hatColor: '#e0743c', h: 1.02 },
    driver: { skin: '#c98e62', hair: '#2e2420', hairdo: 'short', stache: true, hair2: '#2e2420', dress: '#7a5a3e', vest: '#3f4a5a', hat: 'flat', hatColor: '#4a3a2a', wide: 1.12, h: 1.02 },
  };
  const ln = key => T().LINES[key];
  const PEOPLE = Object.keys(AT).map(id => ({ id, get name() { return C()[id]; }, look: LOOK[id], at: AT[id], lines: [], run: () => talk(id) }));
  const who = id => M.who('past', id);
  const HEARD = M.HEARD;
  const heardN = () => HEARD.filter(k => st().heard && st().heard[k]).length;

  // ------------------------------------------------------------ the dressing: one merged mesh (and its ink hull) for the props
  let built = null;
  const kit = () => PAST.API.Kit();
  function props(k) {
    const KG = PAST.API.KG;
    let y = gy(BENCH.x, BENCH.z);
    // the clockmaker's bench out in the snow: a vise, a clock face waiting for its hands, gears, files, a pot of varnish
    k.box(BENCH.x, y + 0.82, BENCH.z, 1.9, 0.12, 0.8, '#8a5f3e').box(BENCH.x, y + 0.88, BENCH.z, 1.9, 0.04, 0.8, '#f4f8fb', { ink: 0 });
    for (const sx of [-0.85, 0.85]) for (const sz of [-0.32, 0.32]) k.box(BENCH.x + sx, y + 0.4, BENCH.z + sz, 0.1, 0.8, 0.1, '#6b4a30', { ink: 0.008 });
    k.box(BENCH.x - 0.7, y + 1.0, BENCH.z, 0.22, 0.2, 0.18, '#4a4f5a').box(BENCH.x - 0.7, y + 1.14, BENCH.z, 0.32, 0.06, 0.1, '#5d6470', { ink: 0.006 });
    k.add(KG.cyl, BENCH.x + 0.1, y + 0.92, BENCH.z, 0.32, 0.03, 0.32, '#f8f2e4', { ink: 0.008 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; k.box(BENCH.x + 0.1 + Math.sin(a) * 0.26, y + 0.945, BENCH.z + Math.cos(a) * 0.26, 0.02, 0.01, 0.05, '#2b2235', { ry: a, ink: 0 }); }
    for (const [dx, dz, r] of [[0.6, -0.2, 0.12], [0.75, 0.15, 0.08], [0.5, 0.22, 0.06]]) k.add(KG.cyl6, BENCH.x + dx, y + 0.91, BENCH.z + dz, r, 0.025, r, '#c9a24a', { ink: 0.005 });
    k.rod([BENCH.x - 0.3, y + 0.9, BENCH.z + 0.28], [BENCH.x + 0.05, y + 0.9, BENCH.z + 0.3], 0.012, '#8f8a80', 0);
    k.add(KG.cyl, BENCH.x + 0.82, y + 0.97, BENCH.z - 0.28, 0.07, 0.12, 0.07, '#8a4a2a', { ink: 0.005 });
    // a crate of brand-new clocks, an old hourglass on top
    y = gy(CRATE.x, CRATE.z);
    k.box(CRATE.x, y + 0.3, CRATE.z, 0.9, 0.6, 0.6, '#a8703f', { ry: 0.2 });
    for (let i = 0; i < 3; i++) k.add(KG.cyl, CRATE.x - 0.25 + i * 0.25, y + 0.66, CRATE.z, 0.11, 0.03, 0.11, '#f8f2e4', { rx: Math.PI / 2 - 0.3, ink: 0.006 });
    k.add(KG.cone, CRATE.x + 0.3, y + 0.72, CRATE.z + 0.1, 0.07, 0.12, 0.07, '#e8d9a8', { ink: 0.004 }).add(KG.cone, CRATE.x + 0.3, y + 0.86, CRATE.z + 0.1, 0.07, -0.12, 0.07, '#e8d9a8', { ink: 0.004 });
    // young Tobías's toolbox on a stool, by his bench
    y = gy(TOOLS.x, TOOLS.z);
    k.add(KG.cyl6, TOOLS.x, y + 0.25, TOOLS.z, 0.22, 0.5, 0.22, '#8a5f3e', { ink: 0.008 }).box(TOOLS.x, y + 0.6, TOOLS.z, 0.6, 0.2, 0.32, '#5a6a8a').box(TOOLS.x, y + 0.74, TOOLS.z, 0.4, 0.05, 0.04, '#3a3550', { ink: 0 });
    // the mule driver's wagon, sacks of chestnuts on it, and his mule with a cowbell
    y = gy(WAGON.x, WAGON.z);
    k.box(WAGON.x, y + 0.72, WAGON.z, 1.9, 0.22, 1.1, '#8a5f3e').box(WAGON.x, y + 0.95, WAGON.z - 0.55, 1.9, 0.3, 0.06, '#7a5236', { ink: 0.006 }).box(WAGON.x, y + 0.95, WAGON.z + 0.55, 1.9, 0.3, 0.06, '#7a5236', { ink: 0.006 });
    for (const sx of [-0.62, 0.62]) for (const sz of [-0.62, 0.62]) k.add(KG.cyl, WAGON.x + sx, y + 0.38, WAGON.z + sz, 0.36, 0.08, 0.36, '#5a3a24', { rx: Math.PI / 2, ink: 0.01 });
    for (let i = 0; i < 4; i++) k.add(KG.sphere, WAGON.x - 0.5 + i * 0.34, y + 1.02, WAGON.z + (i % 2 ? 0.2 : -0.2), 0.24, 0.2, 0.22, '#c8b48a', { ink: 0.01 });
    k.rod([WAGON.x + 0.95, y + 0.7, WAGON.z - 0.35], [WAGON.x + 1.9, y + 0.8, WAGON.z + 0.9], 0.04, '#6b4a30', 0.006).rod([WAGON.x + 0.95, y + 0.7, WAGON.z + 0.35], [WAGON.x + 2.2, y + 0.8, WAGON.z + 0.4], 0.04, '#6b4a30', 0.006);
    y = gy(MULE.x, MULE.z);
    k.add(KG.sphere, MULE.x, y + 1.05, MULE.z, 0.42, 0.36, 0.62, '#7a5a42', { ry: 0.3 });
    k.add(KG.sphere, MULE.x + 0.2, y + 1.45, MULE.z + 0.55, 0.16, 0.2, 0.3, '#7a5a42', { ry: 0.3, rx: -0.5, ink: 0.012 });
    for (const s of [-1, 1]) k.add(KG.cone4, MULE.x + 0.2 + s * 0.08, y + 1.75, MULE.z + 0.5, 0.04, 0.28, 0.03, '#6a4a34', { rz: s * 0.25, ink: 0.006 });
    for (const [lx, lz] of [[-0.18, -0.35], [0.18, -0.35], [-0.12, 0.38], [0.24, 0.32]]) k.add(KG.cyl6, MULE.x + lx, y + 0.42, MULE.z + lz, 0.06, 0.84, 0.06, '#5a4232', { ink: 0.008 });
    k.add(KG.half, MULE.x + 0.24, y + 1.18, MULE.z + 0.62, 0.08, -0.12, 0.08, '#c9a24a', { ink: 0.006 });
    // by the inn: a barrel of apples and a stool by the doorstep; a pot of porridge on the bench (its steam is a sprite)
    y = gy(BARREL.x, BARREL.z);
    k.add(KG.cyl, BARREL.x, y + 0.42, BARREL.z, 0.34, 0.84, 0.34, '#8a5f3e').add(KG.cyl, BARREL.x, y + 0.84, BARREL.z, 0.32, 0.02, 0.32, '#c9453a', { ink: 0 });
    k.add(KG.cyl6, BARREL.x - 0.7, y + 0.25, BARREL.z - 0.3, 0.18, 0.5, 0.18, '#a8703f', { ink: 0.006 });
    // the town hall's alarm bell on its post, its rope hanging
    y = gy(POST.x, POST.z);
    k.rod([POST.x, y, POST.z], [POST.x, y + 2.7, POST.z], 0.07, '#6b4a30', 0.01).box(POST.x + 0.3, y + 2.6, POST.z, 0.7, 0.08, 0.08, '#6b4a30', { ink: 0.006 });
    k.add(KG.cone, POST.x + 0.55, y + 2.3, POST.z, 0.2, 0.32, 0.2, '#c9a24a', { ink: 0.008 }).rod([POST.x + 0.55, y + 2.15, POST.z], [POST.x + 0.55, y + 1.1, POST.z], 0.015, '#d8c8a0', 0);
    // the weather keeper's stand: a lectern with the weather book open, an inkwell, a thermometer on the weather house's post
    y = gy(STAND.x, STAND.z);
    k.rod([STAND.x, y, STAND.z], [STAND.x, y + 1.0, STAND.z], 0.05, '#6b4a30', 0.008).box(STAND.x, y + 1.08, STAND.z, 0.6, 0.06, 0.42, '#8a5f3e', { rx: -0.35 }).box(STAND.x, y + 1.13, STAND.z + 0.02, 0.5, 0.02, 0.34, '#f8f2e4', { rx: -0.35, ink: 0 });
    k.add(KG.cyl, STAND.x + 0.36, y + 1.12, STAND.z, 0.05, 0.08, 0.05, '#2b2235', { ink: 0.004 });
    k.box(205.8 + 0.12, gy(205.8, -258.8) + 1.3, -258.8 + 0.12, 0.06, 0.4, 0.03, '#f4efe2', { ink: 0.004 }).box(205.8 + 0.12, gy(205.8, -258.8) + 1.2, -258.8 + 0.14, 0.02, 0.18, 0.02, '#c9453a', { ink: 0 });
    // goats in a little pen beside the bakery, a sheepskin coat on the fence
    y = gy(PEN.x, PEN.z);
    for (const [ax, az, bx, bz] of [[-1.1, -1.0, 1.1, -1.0], [1.1, -1.0, 1.1, 1.0], [1.1, 1.0, -1.1, 1.0], [-1.1, 1.0, -1.1, -1.0]]) { k.rod([PEN.x + ax, y + 0.55, PEN.z + az], [PEN.x + bx, y + 0.55, PEN.z + bz], 0.04, '#8a5f3e', 0.006); k.rod([PEN.x + ax, y, PEN.z + az], [PEN.x + ax, y + 0.7, PEN.z + az], 0.05, '#6b4a30', 0.006); }
    for (const [gx, gz, ry, col] of [[-0.4, -0.2, 0.6, '#f4efe2'], [0.45, 0.35, -1.0, '#c8b49a']]) {
      k.add(KG.sphere, PEN.x + gx, y + 0.5, PEN.z + gz, 0.26, 0.24, 0.38, col, { ry }).add(KG.sphere, PEN.x + gx + Math.sin(ry) * 0.4, y + 0.72, PEN.z + gz + Math.cos(ry) * 0.4, 0.13, 0.15, 0.17, col, { ry, ink: 0.008 });
      for (const [lx, lz] of [[-0.12, -0.2], [0.12, -0.2], [-0.12, 0.2], [0.12, 0.2]]) k.add(KG.cyl6, PEN.x + gx + lx, y + 0.17, PEN.z + gz + lz, 0.04, 0.34, 0.04, '#5a4a3a', { ink: 0.004 });
    }
    k.box(PEN.x + 1.1, y + 0.5, PEN.z + 0.1, 0.06, 0.5, 0.8, '#d8c0a0', { ink: 0.006 });
    // a basket of pine cones under a pine
    y = gy(BASKET.x, BASKET.z);
    k.add(KG.half, BASKET.x, y + 0.3, BASKET.z, 0.36, -0.3, 0.36, '#a8703f', { ink: 0.008 });
    for (let i = 0; i < 5; i++) k.add(KG.cone4, BASKET.x + (i % 3 - 1) * 0.15, y + 0.32, BASKET.z + (i > 2 ? 0.12 : -0.08), 0.07, 0.14, 0.07, '#6b4a30', { ink: 0.004 });
    // a display shelf of new clocks by the workshop's east end, each with its weights and its little plaque
    y = gy(SHELF.x, SHELF.z);
    k.box(SHELF.x, y + 0.9, SHELF.z, 0.5, 1.8, 1.6, '#8a5f3e').box(SHELF.x + 0.05, y + 1.2, SHELF.z, 0.42, 0.05, 1.5, '#a8703f', { ink: 0 }).box(SHELF.x + 0.05, y + 0.6, SHELF.z, 0.42, 0.05, 1.5, '#a8703f', { ink: 0 });
    for (const [h, dz] of [[1.42, -0.45], [1.42, 0.15], [0.82, -0.3], [0.82, 0.35]]) { k.box(SHELF.x + 0.12, y + h, SHELF.z + dz, 0.26, 0.36, 0.3, '#6b4a30', { ink: 0.006 }).add(KG.cyl, SHELF.x + 0.26, y + h + 0.05, SHELF.z + dz, 0.1, 0.02, 0.1, '#f8f2e4', { rz: Math.PI / 2, ink: 0 }); k.add(KG.cone4, SHELF.x + 0.2, y + h - 0.3, SHELF.z + dz + 0.06, 0.03, 0.1, 0.03, '#5a3a24', { ink: 0 }); }
    // a stone shelter for travelers by the gate: a candlestick, a box of matches
    y = gy(SHELTER.x, SHELTER.z);
    k.box(SHELTER.x, y + 0.9, SHELTER.z - 0.7, 1.8, 1.8, 0.3, '#8f8a80').box(SHELTER.x - 0.75, y + 0.9, SHELTER.z, 0.3, 1.8, 1.4, '#8f8a80').box(SHELTER.x + 0.75, y + 0.9, SHELTER.z, 0.3, 1.8, 1.4, '#8f8a80');
    k.box(SHELTER.x, y + 1.9, SHELTER.z - 0.1, 2.0, 0.18, 1.6, '#6b4a30', { rx: 0.15 }).box(SHELTER.x, y + 2.02, SHELTER.z - 0.1, 2.0, 0.08, 1.6, '#f4f8fb', { rx: 0.15, ink: 0 });
    k.box(SHELTER.x, y + 0.45, SHELTER.z - 0.3, 1.0, 0.1, 0.5, '#a8703f').add(KG.cyl, SHELTER.x - 0.2, y + 0.58, SHELTER.z - 0.3, 0.05, 0.16, 0.05, '#c9a24a', { ink: 0.004 }).add(KG.cyl, SHELTER.x - 0.2, y + 0.72, SHELTER.z - 0.3, 0.025, 0.14, 0.025, '#f4efe2', { ink: 0 });
    k.box(SHELTER.x + 0.2, y + 0.53, SHELTER.z - 0.3, 0.14, 0.05, 0.08, '#c9453a', { ink: 0.003 });
    // a new signpost at the gate
    y = gy(SIGN.x, SIGN.z);
    k.rod([SIGN.x, y, SIGN.z], [SIGN.x, y + 2.0, SIGN.z], 0.06, '#6b4a30', 0.008).box(SIGN.x + 0.45, y + 1.75, SIGN.z, 1.0, 0.24, 0.06, '#e8d9b6', { ink: 0.006 }).add(KG.cone4, SIGN.x + 1.05, y + 1.75, SIGN.z, 0.14, 0.18, 0.04, '#e8d9b6', { rz: -Math.PI / 2, ink: 0.006 });
    // a boulder green with lichen, by the path up to the tower
    y = gy(ROCK.x, ROCK.z);
    k.add(KG.ball6, ROCK.x, y + 0.5, ROCK.z, 0.9, 0.7, 0.8, '#8d8f97', { ry: 0.4 }).add(KG.ball6, ROCK.x - 0.3, y + 0.95, ROCK.z + 0.2, 0.45, 0.18, 0.4, '#8fa87a', { ink: 0.006 });
    // a cloak and a shawl on a hook by the workshop door, still wet with snow
    y = VY;
    k.box(HOOK.x, y + 2.1, HOOK.z + 0.06, 0.4, 0.05, 0.06, '#6b4a30', { ink: 0.004 }).box(HOOK.x - 0.08, y + 1.55, HOOK.z + 0.1, 0.3, 1.0, 0.08, '#3f4a5a', { ink: 0.006 }).box(HOOK.x + 0.14, y + 1.75, HOOK.z + 0.13, 0.22, 0.6, 0.06, '#c9453a', { ink: 0.006 });
    // the White Hollow's mouth: a mound of snowy rock in the crag beside the tower, icicles over a dark arch
    y = gy(CAVE.x, CAVE.z);
    const fy = Math.atan2(CAVE.look.x - CAVE.x, CAVE.look.z - CAVE.z), fx = Math.sin(fy), fz = Math.cos(fy), rx = Math.cos(fy), rz = -Math.sin(fy);
    for (let i = 0; i < 9; i++) { const a = (i / 8 - 0.5) * 2.4, r = 1.6; k.add(KG.ball6, CAVE.x + rx * Math.sin(a) * r - fx * Math.cos(a) * 0.6, y + 0.6 + (i % 3) * 0.35, CAVE.z + rz * Math.sin(a) * r - fz * Math.cos(a) * 0.6, 0.9, 0.9 + (i % 2) * 0.4, 0.8, i % 2 ? '#c6ced8' : '#d6dde6', { ry: i, ink: 0.015 }); }
    k.add(KG.ball6, CAVE.x - fx * 0.9, y + 2.0, CAVE.z - fz * 0.9, 1.5, 0.8, 1.2, '#eef3f8', { ink: 0.012 });
    for (let i = 0; i < 7; i++) { const s = (i / 6 - 0.5) * 1.8; k.add(KG.cone, CAVE.x + rx * s + fx * 0.25, y + 2.0, CAVE.z + rz * s + fz * 0.25, 0.07, -0.4 - (i % 3) * 0.18, 0.07, '#dff2fb', { ink: 0.004 }); }
    // the boy's small footprints, from the inn up the path toward the hollow
    const pts = [[219.0, -258.6], [220.2, -260.4], [221.2, -262.2], [222.4, -264.2], [223.8, -265.8], [225.6, -266.6], [227.6, -267.4], [229.6, -268.2], [231.6, -269.2], [233.4, -270.6]];
    pts.forEach(([x, z], i) => { for (const s of [-1, 1]) k.add(KG.sphere, x + s * 0.12, gy(x, z) + 0.015, z + (i % 2) * 0.1, 0.07, 0.01, 0.11, '#9aa6b4', { ink: 0 }); });
  }
  // the weathervane on the town hall's roof (it turns), the bonfire's glow and sparks, steam, the sled under its drift, Tobías's
  // unfinished cuckoo clock on his toolbox
  function vane() {
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG, hall = PEAKS.bld('hall');
    k.rod([0, 0, 0], [0, 1.0, 0], 0.03, '#3d4250', 0.004).add(KG.cone4, 0.32, 1.0, 0, 0.1, 0.36, 0.04, '#c9a24a', { rz: -Math.PI / 2, ink: 0.004 }).box(-0.25, 1.0, 0, 0.4, 0.2, 0.02, '#c9a24a', { ink: 0.004 });
    k.build(g, { shadow: false });
    const ridge = PEAKS.roofTop && PEAKS.gableRise ? PEAKS.roofTop(hall) + PEAKS.gableRise(hall) : 8.4;
    g.position.set(hall.x, VY + ridge - 0.05, hall.z); g.name = 'pk-past-vane';
    return g;
  }
  function cuckooModel(old, w) {
    // a small house-shaped clock: roof, face, a little door with the bird behind it, pine-cone weights on chains
    const g = new THREE.Group(), k = kit(), KG = PAST.API.KG, wood = old ? (w === 'future' ? '#8a8690' : '#6b4630') : '#8a5f3e', roof = old ? (w === 'future' ? '#7a7680' : '#5a3a24') : '#6b4a30';
    k.box(0, 0, 0, 0.62, 0.62, 0.22, wood).add(KG.tri || KG.cone4, 0, 0.42, 0, 0.42, 0.26, 0.26, roof, { ink: 0.008 });
    k.add(KG.cyl, 0, -0.02, 0.12, 0.18, 0.02, 0.18, w === 'future' ? '#d8d4dc' : '#f8f2e4', { rx: Math.PI / 2, ink: 0.004 }).box(0, 0.22, 0.12, 0.14, 0.12, 0.02, '#3a2a20', { ink: 0 });
    for (const s of [-1, 1]) { k.rod([s * 0.14, -0.31, 0.05], [s * 0.14, -0.75, 0.05], 0.008, '#8f8a80', 0); k.add(KG.cone4, s * 0.14, -0.82, 0.05, 0.06, -0.14, 0.06, w === 'future' ? '#7a7680' : '#5a3a24', { ink: 0.004 }); }
    k.build(g, { shadow: false });
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.14, 0.01), new THREE.MeshBasicMaterial({ color: '#2b2235' })); hand.position.set(0, 0.04, 0.14); g.add(hand);
    const pend = new THREE.Group(); pend.position.set(0, -0.3, 0.02); g.add(pend);
    const pk = kit(); pk.rod([0, 0, 0], [0, -0.36, 0], 0.01, '#c9a24a', 0).add(KG.cyl, 0, -0.4, 0, 0.06, 0.02, 0.06, '#c9a24a', { rx: Math.PI / 2, ink: 0.003 }); pk.build(pend, { shadow: false });
    const bird = new THREE.Group(); bird.position.set(0, 0.22, 0.04); g.add(bird);
    const bk = kit(); bk.add(KG.sphere, 0, 0, 0, 0.05, 0.05, 0.07, old && w === 'future' ? '#b8b4c0' : '#e8b83a', { ink: 0.004 }).add(KG.cone, 0, 0.01, 0.08, 0.015, 0.04, 0.015, '#e8843a', { rx: Math.PI / 2, ink: 0 }); bk.build(bird, { shadow: false });
    return { g, hand, pend, bird, out: 0, t: 0 };
  }
  function build() {
    if (built) return built;
    const scene = G().w3d.scene, mk = (name, fn) => { const g = new THREE.Group(); g.name = 'pk-past-' + name; const k = kit(); fn(k); k.build(g); g.visible = false; scene.add(g); return g; };
    built = { props: mk('props', props), vane: vane(), solids: [] };
    scene.add(built.vane); built.vane.visible = false;
    const glow = (col, s, o) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: col, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s); sp.visible = false; scene.add(sp); return sp; };
    // the bonfire on the square: logs and its flames (sprites), sparks rising
    const fk = kit(), KG = PAST.API.KG, fy = gy(FIRE.x, FIRE.z), fg = new THREE.Group(); fg.name = 'pk-past-fire';
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; fk.add(KG.ball6, FIRE.x + Math.cos(a) * 0.62, fy + 0.12, FIRE.z + Math.sin(a) * 0.62, 0.2, 0.16, 0.2, '#8f8a80', { ink: 0.006 }); }
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI; fk.rod([FIRE.x + Math.cos(a) * 0.45, fy + 0.1, FIRE.z + Math.sin(a) * 0.45], [FIRE.x - Math.cos(a) * 0.45, fy + 0.3, FIRE.z - Math.sin(a) * 0.45], 0.07, '#5a3a24', 0.006); }
    fk.build(fg); fg.visible = false; scene.add(fg); built.fireG = fg;
    built.flames = [0, 1, 2].map(i => ({ s: glow(i ? '#ff9a4a' : '#ffd27a', 1.2 + i * 0.4, 0.7), ph: i * 2.1 }));
    built.sparks = [0, 1, 2, 3, 4].map(i => ({ s: glow('#ffb35a', 0.18, 0.9), ph: i * 1.3 }));
    built.steam = [0, 1].map(i => ({ s: glow('#f4efe2', 0.5, 0.25), ph: i * 2.6 }));
    built.steam.forEach(o => { o.s.material.blending = THREE.NormalBlending; });
    // the drift behind the inn (little Pili's sled is under it until Mimo blows it away)
    const dk = kit(), dg = new THREE.Group(), dy = gy(DRIFT.x, DRIFT.z); dg.name = 'pk-past-drift';
    for (let i = 0; i < 6; i++) dk.add(KG.sphere, DRIFT.x + (i - 2.5) * 0.34, dy + 0.3 + (i % 2) * 0.12, DRIFT.z + (i % 3 - 1) * 0.2, 0.55, 0.45, 0.5, i % 2 ? '#f4f8fb' : '#e6eef5', { ink: 0.012 });
    dk.build(dg); dg.visible = false; scene.add(dg); built.drift = dg;
    const sk = kit(), sg = new THREE.Group(); sg.name = 'pk-past-sled';
    sk.box(DRIFT.x, dy + 0.22, DRIFT.z, 1.1, 0.06, 0.5, '#c9453a').rod([DRIFT.x - 0.55, dy + 0.05, DRIFT.z - 0.22], [DRIFT.x + 0.55, dy + 0.05, DRIFT.z - 0.22], 0.025, '#5d6470', 0.004).rod([DRIFT.x - 0.55, dy + 0.05, DRIFT.z + 0.22], [DRIFT.x + 0.55, dy + 0.05, DRIFT.z + 0.22], 0.025, '#5d6470', 0.004);
    sk.rod([DRIFT.x + 0.55, dy + 0.22, DRIFT.z], [DRIFT.x + 1.1, dy + 0.4, DRIFT.z], 0.012, '#8f8a80', 0);
    sk.build(sg); sg.visible = false; scene.add(sg); built.sled = sg;
    // the White Hollow's dark mouth, in the front of the mound
    { const cy = gy(CAVE.x, CAVE.z), fy = Math.atan2(CAVE.look.x - CAVE.x, CAVE.look.z - CAVE.z);
      const arch = new THREE.Mesh(new THREE.CircleGeometry(1.0, 18, 0, Math.PI), new THREE.MeshBasicMaterial({ color: '#0d1a24' }));
      arch.position.set(CAVE.x + Math.sin(fy) * 0.62, cy + 0.02, CAVE.z + Math.cos(fy) * 0.62); arch.rotation.y = fy; arch.scale.set(1, 1.35, 1); arch.visible = false; arch.name = 'pk-past-arch'; scene.add(arch); built.arch = arch; }
    // young Tobías's cuckoo clock, unfinished, on his toolbox (once finished it hangs on the wall: the 'peaks.cuckoo' effect)
    built.ck = cuckooModel(false, 'past'); built.ck.g.position.set(TOOLS.x, gy(TOOLS.x, TOOLS.z) + 1.25, TOOLS.z); built.ck.g.rotation.y = 0.6; built.ck.g.visible = false; built.ck.g.name = 'pk-past-cuckoo-table'; scene.add(built.ck.g);
    const add = (x, z, r) => built.solids.push({ x: OFF, z: OFF, _x: x, _z: z, r, time: true });
    add(BENCH.x, BENCH.z, 0.7); add(BENCH.x + 0.6, BENCH.z, 0.5); add(CRATE.x, CRATE.z, 0.45); add(TOOLS.x, TOOLS.z, 0.3); add(WAGON.x - 0.5, WAGON.z, 0.75); add(WAGON.x + 0.5, WAGON.z, 0.75); add(MULE.x, MULE.z, 0.6);
    add(BARREL.x, BARREL.z, 0.38); add(POST.x, POST.z, 0.15); add(STAND.x, STAND.z, 0.25); add(FIRE.x, FIRE.z, 0.75); add(PEN.x, PEN.z, 1.25); add(BASKET.x, BASKET.z, 0.35);
    add(SHELF.x, SHELF.z - 0.45, 0.5); add(SHELF.x, SHELF.z + 0.45, 0.5); add(SHELTER.x - 0.75, SHELTER.z, 0.35); add(SHELTER.x + 0.75, SHELTER.z, 0.35); add(SHELTER.x, SHELTER.z - 0.7, 0.4);
    add(SIGN.x, SIGN.z, 0.12); add(ROCK.x, ROCK.z, 0.85); add(CAVE.x, CAVE.z, 1.1);
    built.driftSolid = { x: OFF, z: OFF, _x: DRIFT.x, _z: DRIFT.z, r: 0.8, time: true };
    WORLD.extra.push(...built.solids, built.driftSolid);
    return built;
  }
  const solidsOn = on => { if (!built) return; built.solids.forEach(c => { c.x = on ? c._x : OFF; c.z = on ? c._z : OFF; }); const d = on && !st().sledFound; built.driftSolid.x = d ? built.driftSolid._x : OFF; built.driftSolid.z = d ? built.driftSolid._z : OFF; };
  function show(on) {
    const B = build(), s = st();
    B.props.visible = on; B.vane.visible = on; B.fireG.visible = on; B.arch.visible = on;
    B.flames.forEach(f => { f.s.visible = on; }); B.sparks.forEach(f => { f.s.visible = on; }); B.steam.forEach(f => { f.s.visible = on; });
    B.drift.visible = on && !s.sledFound; B.sled.visible = on && !!s.sledFound && !s.sledDone;
    B.ck.g.visible = on && !TIME.flag('past', 'pkCuckoo');
    solidsOn(on);
  }

  // ------------------------------------------------------------ every frame: the fire, the steam, the weathervane, the cuckoo
  function update(dt, t) {
    const B = built; if (!B) return;
    const fy = gy(FIRE.x, FIRE.z);
    B.flames.forEach((f, i) => { f.s.position.set(FIRE.x + Math.sin(t * 3 + f.ph) * 0.06, fy + 0.5 + i * 0.22 + Math.sin(t * 7 + f.ph) * 0.05, FIRE.z); f.s.material.opacity = 0.55 + 0.2 * Math.sin(t * 9 + f.ph) + 0.1 * Math.sin(t * 17); });
    B.sparks.forEach(o => { const k = ((t * 0.55 + o.ph) % 2.2) / 2.2; o.s.position.set(FIRE.x + Math.sin(t * 2 + o.ph * 3) * 0.3 * k, fy + 0.6 + k * 3.2, FIRE.z + Math.cos(t * 1.7 + o.ph) * 0.3 * k); o.s.material.opacity = 0.9 * (1 - k); });
    B.steam.forEach(o => { const k = ((t * 0.4 + o.ph) % 1.6) / 1.6; o.s.position.set(BARREL.x - 0.7 + Math.sin(t + o.ph) * 0.1, gy(BARREL.x, BARREL.z) + 0.6 + k * 1.2, BARREL.z - 0.3); o.s.material.opacity = 0.28 * (1 - k); o.s.scale.setScalar(0.3 + k * 0.5); });
    B.vane.rotation.y = Math.sin(t * 0.35) * 1.4 + Math.sin(t * 1.3) * 0.2;
    const ck = B.ck; if (ck.g.visible) { ck.pend.rotation.z = 0; ck.bird.position.z = 0.04; }
  }

  // ------------------------------------------------------------ talking to the people of then (the main path first; side quests come
  // through STORY.talkHooks below, as a little menu)
  const say1 = (id, key) => { const p = who(id); if (!p) return Promise.resolve(); M.lock(true); M.frame2(p); return M.say(p, ln(key)).finally(() => M.lock(false)); };
  const chats = {};
  const cycle = (id, keys) => { chats[id] = ((chats[id] || 0) + 1) % keys.length; return say1(id, keys[chats[id]]); };
  function talk(id) {
    const s = st(), heard = s.heard || {};
    switch (id) {
      case 'master': return !s.met ? masterScene() : !s.joined ? (heardN() >= 3 ? storyAsk() : say1('master', 'master.again')) : TIME.flag('past', 'pkCave') ? cycle('master', ['master.done', 'master.chat1', 'master.chat2']) : cycle('master', ['master.cave', 'master.chat1', 'master.chat2']);
      case 'driver': case 'pili': case 'ines': return !heard[id] ? heardScene(id) : id === 'pili' && s.sledFound && !s.sledDone ? sledScene() : cycle(id, id === 'driver' ? ['driver.chat', 'driver.after'] : id === 'pili' ? ['pili.chat', 'pili.after'] : ['ines.chat', 'ines.after']);
      case 'tobias': if (!s.tobiasMet) { s.tobiasMet = true; G().save(); return say1('tobias', 'tobias.hello'); } return cycle('tobias', ['tobias.chat1', 'tobias.chat2']);
      case 'inn': return cycle('inn', ['inn.hello', 'inn.chat1', 'inn.chat2']);
      case 'teo': if (!s.teoMet) { s.teoMet = true; G().save(); return say1('teo', 'teo.hello'); } return say1('teo', 'teo.chat');
      default: return null;
    }
  }
  // the main path, 1: the clockmaker tells that night (both pasts), the card, and asks you: «Cuando llegué, nevaba»
  async function masterScene() {
    const s = st(), Mm = () => who('master'); if (!Mm()) return;
    if (!s.demo) {
      M.lock(true);
      try { M.frame2(Mm()); await wait(0.4); await M.say(Mm(), ln('master.hello')); await M.demo(Mm(), T().DEMO['master.demo'], T().MARKS['master.demo']); } finally { M.lock(false); }
      await M.card(T().CARDS.twopasts);
      s.demo = true; G().save();
    }
    M.lock(true); try { M.frame2(Mm()); await M.say(Mm(), ln('master.ask')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.arrived, { tips: T().TIPS }); if (!r) { M.think('{master} is waiting: what was the weather like when you arrived?', 4.5); return; }
    TIME.grade('pk.arrived', r.letter); s.arrived = r.letter;
    M.lock(true); try { M.frame2(Mm()); await M.say(Mm(), ln('master.task')); s.met = true; G().save(); } finally { M.lock(false); }
    M.think('{driver} is by the gate, little {pili} at the inn, {ines} at the town hall.', 5.5);
  }
  // the main path, 2: each of the three tells a piece of that night, then asks you to tell it back
  async function heardScene(id) {
    const s = st(), P = () => who(id); if (!P()) return;
    if (!s.met) { await say1(id, id + '.hello'); M.think('Someone at the workshop knows the whole story. Ask the clockmaker first.', 4.5); return; }
    M.lock(true);
    try { M.frame2(P(), id === 'ines' ? -1 : 1); await wait(0.3); await M.say(P(), ln(id + '.hello')); await M.demo(P(), T().DEMO[id + '.demo'], T().MARKS[id + '.demo']); await M.say(P(), ln(id + '.q')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS[id], { tips: T().TIPS }); if (!r) { M.think(`{${id}} is waiting for you to tell it back.`, 4); return; }
    TIME.grade('pk.heard.' + id, r.letter);
    M.lock(true); try { const P2 = P(); M.frame2(P2); await M.say(P2, ln(id + '.after')); (s.heard || (s.heard = {}))[id] = r.letter; G().save(); } finally { M.lock(false); }
    const n = heardN();
    M.think(n >= 3 ? 'That’s the whole night. Back to {master}, at the workshop: tell her the story.' : `That night, piece by piece (${n}/3).`, 5);
  }
  // the main path, 3: the whole story, then she leads you to the White Hollow
  async function storyAsk() {
    const s = st(), Mm = () => who('master'); if (!Mm()) return;
    M.lock(true); try { M.frame2(Mm()); await wait(0.3); await M.say(Mm(), ln('master.story')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.story, { tips: T().TIPS }); if (!r) { M.think('{master} is waiting: when the boy left the inn, what was it like?', 4.5); return; }
    TIME.grade('pk.story', r.letter);
    M.lock(true); try { M.frame2(Mm()); await M.say(Mm(), ln('master.go')); s.joined = true; G().save(); } finally { M.lock(false); }
    try { const y = gy(CAVE.x, CAVE.z); M.shot(V(CAVE.x - 6, y + 4.6, CAVE.z + 7), V(CAVE.x, y + 1.4, CAVE.z), 1.0); await wait(1.6); } finally { G().cam.override = null; }
    M.think('The White Hollow: up the path to the tower’s ledge, the dark cave in the crag beside it.', 5.5);
  }

  // ------------------------------------------------------------ side quest: «Young Tobías’s first clock» (the Past changes today and tomorrow)
  async function cuckooScene() {
    const s = st(), Tb = () => who('tobias'); if (!Tb()) return;
    if (!s.ckAsked) {
      M.lock(true); try { M.frame2(Tb()); await wait(0.3); await M.say(Tb(), ln('cuckoo.ask')); await M.demo(Tb(), T().DEMO['tobias.demo'], T().MARKS['tobias.demo']); s.ckAsked = true; G().save(); } finally { M.lock(false); }
    }
    if (!s.ckBlown) {
      const r = await M.ask(M.memTask(T().MEM.cuckoo), { icon: 'blow' }); if (!r) { M.think('Young {tobias}’s clock is still frozen shut. {mimo} could blow on it, as a memory.', 4.5); return; }
      TIME.grade('pk.cuckooBlow', r.letter);
      const g = G(), ck = built.ck, p = ck.g.position;
      M.lock(true);
      try {
        M.shot(V(p.x + 2.4, p.y + 1.2, p.z + 2.6), V(p.x, p.y, p.z));
        g.sim.mimoGo({ x: p.x + 0.9, z: p.z + 0.8 }, { x: p.x, z: p.z }); await wait(0.9);
        try { if (PEAKS.mimoBlow) await PEAKS.mimoBlow({ x: p.x, z: p.z }, 0.9); else snd('blow'); } catch (e) { snd('blow'); }
        g.w3d.fx.puff(p.x, p.y, p.z + 0.15, 10, 0.2, '#f4f8fb'); await wait(0.4);
        await STORY.tween(0.3, k => { ck.bird.position.z = 0.04 + k * 0.12; }); snd('pip'); await wait(0.3); snd('pip');
        await STORY.tween(0.3, k => { ck.bird.position.z = 0.16 - k * 0.12; });
        s.ckBlown = true; g.save(); g.sim.mimoGo(null, null);
        const Tb2 = Tb(); M.frame2(Tb2); await M.say(Tb2, ln('cuckoo.next'));
      } finally { M.lock(false); }
    }
    const r2 = await M.ask(T().TASKS.cuckoo, { tips: T().TIPS }); if (!r2) { M.think('Young {tobias} is waiting: when did he finish it?', 4); return; }
    TIME.grade('pk.cuckoo', r2.letter);
    M.lock(true);
    try {
      const Tb3 = Tb(); M.frame2(Tb3); await M.say(Tb3, ln('cuckoo.done'));
      s.ckDone = r2.letter; TIME.flag('past', 'pkCuckoo', true); built.ck.g.visible = false; TIME.refresh();
      const y = VY; M.shot(V(CUCKOO.x + 1.8, y + 2.6, CUCKOO.z + 4.2), V(CUCKOO.x, y + 2.3, CUCKOO.z)); await wait(0.9);
      try { if (typeof PKMUSIC !== 'undefined') PKMUSIC.play('pk_cuckoo', 4); } catch (e) { /* */ }
      snd('chime'); await wait(1.2);
      G().state.coins = (G().state.coins || 0) + 8; UI.toast('+8 coins'); snd('chest'); G().save();
    } finally { M.lock(false); }
    M.think('Over the workshop door… Will it still be there, today? Tomorrow?', 5);
  }
  // the clock over the workshop door, long ago (new), today (older, still singing) and tomorrow (gray, but still ticking)
  function cuckooPiece(w) {
    const c = cuckooModel(w !== 'past', w); c.g.position.set(CUCKOO.x, VY + 2.35, CUCKOO.z + 0.14); c.g.name = 'pk-cuckoo-' + w;
    let next = 3 + Math.random() * 4;
    return { obj: c.g, update(dt, t) {
      c.pend.rotation.z = Math.sin(t * 3.2) * 0.32; c.hand.rotation.z = -t * 0.4;
      if ((next -= dt) <= 0) { next = 12 + Math.random() * 8; c.out = 1.6; }
      if (c.out > 0) { c.out -= dt; c.bird.position.z = 0.04 + Math.min(1, Math.min(c.out, 1.6 - c.out) * 4) * 0.12; }
    } };
  }
  const cuckooLook = w => async () => {
    const l = lang(), N = T().NAMES.plaque, text = M.plainT(N[l] || N.en);
    if (w === 'past') { M.lookAt('w.ml_cuckoo', `Young {tobias}’s first {w.ml_cuckoo}, over the workshop door. On its {w.pkp_plaque}: «${text}»`, 6); return; }
    if (w === 'now') {
      M.lookAt('w.ml_cuckoo', `An old {w.ml_cuckoo} over the workshop door, its wood dark with years. On the {w.pkp_plaque}: «${text}» It still sings every hour.`, 7);
      try { if (typeof PKMUSIC !== 'undefined') PKMUSIC.play('pk_cuckoo', 4); } catch (e) { /* */ }
      const n = M.st('now'); if (!n.cuckoo) { n.cuckoo = true; G().save(); }
      return;
    }
    M.lookAt('w.ml_cuckoo', `Gray with frost, like everything here… but its pendulum still swings. Tobías’s first {w.ml_cuckoo}, the only clock in Escarcha that never stopped. «${text}»`, 7.5);
    const f = M.st('future'); if (!f.cuckooSeen) { f.cuckooSeen = true; G().save(); }
  };
  TIME.effect('peaks.cuckoo', { region: 'peaks', when: () => !!TIME.flag('past', 'pkCuckoo'),
    show: { past: () => cuckooPiece('past'), now: () => cuckooPiece('now'), future: () => cuckooPiece('future') },
    act: { past: { x: CUCKOO.look.x, z: CUCKOO.look.z, r: 1.2, label: 'Look', run: cuckooLook('past') }, now: { x: CUCKOO.look.x, z: CUCKOO.look.z, r: 1.2, label: 'Look', run: cuckooLook('now') },
      future: { x: CUCKOO.look.x, z: CUCKOO.look.z, r: 1.2, label: 'Look', run: cuckooLook('future') } } });
  // today: Tobías knows the clock (his Talk has no id: he's matched by where he stands)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'now' || !TIME.open('peaks') || it.who || !TIME.flag('past', 'pkCuckoo')) return null;
    const tp = M.todayP('tobias'); if (!tp || Math.hypot(it.x - tp.x, it.z - tp.z) > 0.8) return null;
    return [{ label: 'Your first clock', run: async () => {
      const p = M.todayApi('tobias', 'Tobías'); if (!p) return;
      M.lock(true); try { p.talking = true; M.frame2(p); await M.say(p, ln('now.tobias')); } finally { p.talking = false; M.lock(false); }
      const n = M.st('now'); if (!n.cuckoo) { n.cuckoo = true; G().save(); }
    } }];
  });

  // ------------------------------------------------------------ side quest: «The weather book» (young Teo's)
  async function bookScene() {
    const s = st(), Te = () => who('teo'); if (!Te()) return;
    if (!s.bookAsked) {
      M.lock(true); try { M.frame2(Te()); await wait(0.3); await M.demo(Te(), T().DEMO['teo.demo'], T().MARKS['teo.demo']); await M.say(Te(), ln('book.ask')); s.bookAsked = true; G().save(); } finally { M.lock(false); }
    }
    if (!s.book1) {
      const r = await M.ask(T().TASKS.book1, { tips: T().TIPS }); if (!r) { M.think('{teo} is waiting: what was the weather like that night?', 4); return; }
      TIME.grade('pk.book1', r.letter); s.book1 = r.letter; G().save();
      M.lock(true); try { const T2 = Te(); M.frame2(T2); await M.say(T2, ln('book.next')); } finally { M.lock(false); }
    }
    const r2 = await M.ask(T().TASKS.book2, { tips: T().TIPS }); if (!r2) { M.think('{teo} is waiting: what happened that night?', 4); return; }
    TIME.grade('pk.book2', r2.letter); s.bookDone = r2.letter;
    M.lock(true); try { const T3 = Te(); M.frame2(T3); await M.say(T3, ln('book.thanks')); G().state.coins = (G().state.coins || 0) + 5; UI.toast('+5 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ side quest: «Little Pili’s sled»
  async function sledAsk() {
    const s = st(), Pi = () => who('pili'); if (!Pi()) return;
    M.lock(true); try { M.frame2(Pi()); await wait(0.3); await M.say(Pi(), ln('sled.ask')); await M.demo(Pi(), T().DEMO['sled.demo'], T().MARKS['sled.demo']); s.sledAsked = true; G().save(); } finally { M.lock(false); }
    M.think('A sled lost in the snow… There’s a big drift behind the inn.', 5);
  }
  async function sledDrift() {
    const s = st(); if (!s.sledAsked) { M.lookAt('w.pkp_snowdrift', 'A big {w.pkp_snowdrift} behind the inn. Something red pokes out of it.', 4.5); return; }
    const r = await M.ask(M.memTask(T().MEM.snow), { icon: 'blow' }); if (!r) return;
    TIME.grade('pk.sledBlow', r.letter);
    const g = G(), B = built;
    M.lock(true);
    try {
      const y = gy(DRIFT.x, DRIFT.z); M.shot(V(DRIFT.x + 3.4, y + 2.6, DRIFT.z + 3.2), V(DRIFT.x, y + 0.4, DRIFT.z));
      g.sim.mimoGo({ x: DRIFT.x + 1.2, z: DRIFT.z + 1.0 }, DRIFT); await wait(0.9);
      try { if (PEAKS.mimoBlow) await PEAKS.mimoBlow({ x: DRIFT.x, z: DRIFT.z }, 1.0); else snd('blow'); } catch (e) { snd('blow'); }
      g.w3d.fx.puff(DRIFT.x, y + 0.4, DRIFT.z, 18, 0.45, '#f4f8fb');
      await STORY.tween(0.6, k => { B.drift.scale.setScalar(Math.max(0.01, 1 - k)); B.drift.position.y = -k * 0.3; });
      B.drift.visible = false; B.sled.visible = true; s.sledFound = true; solidsOn(true); g.save(); snd('chime'); await wait(0.6); g.sim.mimoGo(null, null);
    } finally { M.lock(false); }
    M.think('Little {pili}’s {w.pkp_sled}! Tell her where it was.', 4.5);
  }
  async function sledScene() {
    const s = st(), Pi = () => who('pili'); if (!Pi()) return;
    M.lock(true); try { M.frame2(Pi()); await M.say(Pi(), ln('sled.found')); } finally { M.lock(false); }
    const r = await M.ask(T().TASKS.sled, { tips: T().TIPS }); if (!r) return;
    TIME.grade('pk.sled', r.letter); s.sledDone = r.letter; if (built) built.sled.visible = false;
    M.lock(true); try { const P2 = Pi(); M.frame2(P2); await M.say(P2, ln('sled.thanks')); G().state.coins = (G().state.coins || 0) + 5; UI.toast('+5 coins'); snd('chest'); G().save(); } finally { M.lock(false); }
  }

  // ------------------------------------------------------------ the Talk menus: side quests (the main path's scenes play straight off a Talk)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || TIME.world() !== 'past' || TIME.regionNow() !== 'peaks') return null;
    const s = st();
    if (it.who === 'past:tobias' && s.tobiasMet && !s.ckDone) return [{ label: 'Your first clock', sub: '◆ side quest', run: cuckooScene }];
    if (it.who === 'past:teo' && s.teoMet && !s.bookDone) return [{ label: 'The weather book', sub: '◆ side quest', run: bookScene }];
    if (it.who === 'past:pili' && s.heard && s.heard.pili && !s.sledAsked) return [{ label: 'Your sled', sub: '◆ side quest', run: sledAsk }];
    return null;
  });

  // ------------------------------------------------------------ E: the White Hollow, the drift, and the things you can look at
  const LOOKS = [
    { id: 'w.pkp_vise', at: { x: BENCH.x, z: BENCH.z + 1.15 }, line: 'The clockmaker’s bench, out in the cold: a {w.pkp_vise}, a {w.pkp_file}, a pot of {w.pkp_varnish}, and a {w.pkp_dial} waiting for its hands.' },
    { id: 'w.pkp_hourglass', at: { x: CRATE.x - 0.4, z: CRATE.z + 1.1 }, line: 'A crate of brand-new clocks for the village, and an old {w.pkp_hourglass} on top, to check them by.' },
    { id: 'w.pkp_toolbox', at: { x: TOOLS.x + 0.9, z: TOOLS.z + 0.7 }, line: 'Young {tobias}’s {w.pkp_toolbox}: a {w.pkp_pocketknife}, a jar of {w.pkp_glue}, and a {w.pkp_wristwatch} with no strap.' },
    { id: 'w.pkp_wagon', at: { x: WAGON.x, z: WAGON.z - 1.4 }, line: '{driver}’s {w.pkp_wagon}, and {mule} the {w.pkp_mule}, with a {w.pkp_cowbell} round her neck.' },
    { id: 'w.pkp_barrel', at: { x: BARREL.x - 1.1, z: BARREL.z + 0.6 }, line: 'A {w.pkp_barrel} of apples by the inn’s {w.pkp_doorstep}, and a {w.pkp_stool} for whoever waits.' },
    { id: 'w.pkp_cupboard', at: { x: 217.6, z: -256.4 }, line: 'Through the inn’s window: a {w.pkp_cupboard} full of bowls, and {w.pkp_ember:pl} glowing in the {w.pkp_fireplace}.' },
    { id: 'w.pkp_bellrope', at: { x: POST.x + 0.9, z: POST.z + 0.6 }, line: 'The town hall’s {w.pkp_alarm} bell on its post, and a {w.pkp_horn} for calling the search. The bell’s {w.pkp_bellrope} is frayed from pulling.' },
    { id: 'w.pkp_weathervane', at: { x: 198.8, z: -266.6 }, line: 'A brand-new {w.pkp_weathervane} on the town hall’s roof. Under its clock, a chalk mark: «12», {w.pkp_midnight}, the hour the {w.pkp_alarm} rang.' },
    { id: 'w.pkp_thermometer', at: { x: STAND.x - 0.2, z: STAND.z + 0.7 }, line: '{teo}’s {w.pkp_weatherbook} on its stand, an {w.pkp_inkwell} beside it, and a {w.pkp_thermometer} nailed to the post.', book: true },
    { id: 'w.pkp_trail', at: { x: 221.6, z: -262.0 }, line: 'Small footprints from the inn toward the tower… a {w.pkp_trail} the {w.pkp_snowflake:pl} are already filling.' },
    { id: 'w.pkp_cliff', at: { x: 242.0, z: -269.4 }, line: 'From the {w.pkp_ledge}, the {w.pkp_cliff} drops away into the {w.pkp_blizzard}.' },
    { id: 'w.pkp_bonfire', at: { x: FIRE.x + 0.2, z: FIRE.z + 1.4 }, line: 'A {w.pkp_bonfire} in a ring of stones: {w.pkp_spark:pl} fly up into the dark, and {w.pkp_ashes} ring its edge.' },
    { id: 'w.pkp_goat', at: { x: PEN.x + 0.6, z: PEN.z - 1.9 }, line: 'Two {w.pkp_goat:pl} in a pen beside the bakery, and a {w.pkp_sheepskin} hung on the fence to dry.' },
    { id: 'w.pkp_pinecone', at: { x: BASKET.x - 0.2, z: BASKET.z - 1.0 }, line: 'A basket of {w.pkp_pinecone:pl} under a {w.pkp_pine}. The clockmaker carves her clocks’ {w.pkp_weight:pl} to look like them.' },
    { id: 'w.pkp_shelf', at: { x: SHELF.x + 0.9, z: SHELF.z + 1.0 }, line: 'A {w.pkp_shelf} of new clocks, each with a {w.pkp_chain}, and a little {w.pkp_plaque} with its {w.pkp_date}.' },
    { id: 'w.pkp_shelter', at: { x: SHELTER.x + 1.4, z: SHELTER.z + 1.2 }, line: 'A stone {w.pkp_shelter} for travelers: a {w.pkp_candlestick}, a box of {w.pkp_match:pl}, a {w.pkp_wick} to trim.' },
    { id: 'w.pkp_signpost', at: { x: SIGN.x + 0.8, z: SIGN.z + 0.2 }, line: 'A brand-new {w.pkp_signpost} at the gate: «Escarcha». Put up the day after that night, so nobody misses the village in a storm again.' },
    { id: 'w.pkp_hare', at: { x: 224.6, z: -251.6 }, line: 'Tracks at the village’s edge: a {w.pkp_hare}, a {w.pkp_deer}… and a {w.pkp_hawk} circling over the {w.pkp_slope}.' },
    { id: 'w.pkp_sparrow', at: { x: 213.8, z: -249.4 }, line: '{w.pkp_sparrow:pl} huddled under the post office’s roof, puffed up against the {w.pkp_chill}.' },
    { id: 'w.pkp_boulder', at: { x: ROCK.x - 0.6, z: ROCK.z + 2.0 }, line: 'A {w.pkp_boulder} by the path, green with {w.pkp_lichen}.' },
    { id: 'w.pkp_cloak', at: { x: HOOK.x, z: HOOK.z + 1.1 }, line: 'A {w.pkp_cloak} and a {w.pkp_shawl} on a hook by the workshop door, still wet with snow from the {w.pkp_search}.' },
  ];
  // Looks said from elsewhere (the cave's mouth): listed so PEAKT's cover() sees their words
  const SEEN = [{ id: 'w.pkp_icecave', line: 'A dark {w.pkp_icecave} in the {w.pkp_crag} beside the tower, its mouth hung with {w.pkp_icicle:pl}. The boy’s footprints lead in.' }];
  function interactables() {
    const s = st(), out = [];
    out.push({ x: CAVE.look.x, z: CAVE.look.z, r: 1.9, label: s.joined ? 'Go in' : 'Look', run: async () => {
      if (!s.joined) { M.lookAt(SEEN[0].id, SEEN[0].line, 5.5); return; }
      if (typeof PK_PCAVE !== 'undefined' && PK_PCAVE) await PK_PCAVE.enter();
    } });
    if (!s.sledFound) out.push({ x: DRIFT.x + 1.0, z: DRIFT.z + 1.0, r: 1.5, label: s.sledAsked ? `Tell ${M.mimoName()}` : 'Look', run: sledDrift });
    for (const L0 of LOOKS) out.push({ x: L0.at.x, z: L0.at.z, r: 1.25, label: 'Look', run: async () => {
      if (L0.book && st().bookDone) { const l = lang(), N = T().NAMES.page; M.lookAt(L0.id, `{teo}’s {w.pkp_weatherbook}, open at that night’s page: «${M.plainT(N[l] || N.en)}»`, 7); return; }
      M.lookAt(L0.id, L0.line, 5.5);
    } });
    return out;
  }
  function nextId() { const s = st(); return !s.met ? 'master' : heardN() < 3 ? 'heard' : !s.joined ? 'master' : 'cave'; }
  const HINTS = { master: '{mimo} points at the woman in a leather apron, by the workshop.', cave: '{mimo} looks up the path at the dark hollow beside the tower.',
    driver: '{mimo} points at a man with a mule, by the gate.', pili: '{mimo} points at a little girl by the inn.', ines: '{mimo} points at a woman by the town hall.', teo: '{mimo} points at a man by the weather house.', tobias: '{mimo} points at the young apprentice.', drift: '{mimo} sniffs a big drift behind the inn.' };
  function target(id) {
    if (id === 'cave') return (typeof PK_PCAVE !== 'undefined' && PK_PCAVE && PK_PCAVE.inside && PK_PCAVE.target()) || { x: CAVE.look.x, z: CAVE.look.z, hint: HINTS.cave };
    if (id === 'heard') { const s = st(), n = HEARD.find(k => !(s.heard && s.heard[k])); if (!n) return target('master'); id = n; }
    if (id === 'drift') return { x: DRIFT.x, z: DRIFT.z, hint: HINTS.drift };
    const p = who(id); if (p) return { x: p.x, z: p.z, hint: HINTS[id] || '{mimo} points.' };
    const a = AT[id]; return a ? { x: a.x, z: a.z, hint: HINTS[id] || '' } : null;
  }
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('pk_past') ? 'pk_past' : 'past');

  // ------------------------------------------------------------ the side quests (QUESTS.LIST: they start as the story reaches them)
  if (typeof QUESTS !== 'undefined') {
    const pS = s => M.sp(s), nS = s => M.sn(s), fS = s => M.sf(s);
    const pastAt = id => () => M.via('past', () => target(id));
    if (!QUESTS.LIST.some(q => q.id === 'pk.cuckoo')) QUESTS.LIST.push({ id: 'pk.cuckoo', kind: 'side',
      get title() { return M.fillEn('Young {tobias}’s first clock'); }, get giver() { return M.fillEn('young {tobias}, the apprentice (the Frost Peaks, long ago)'); },
      started: s => !!pS(s).tobiasMet,
      steps: [
        { get text() { return M.fillEn('In the Past: help young {tobias} finish his cuckoo clock'); }, get why() { return M.fillEn(`Its little door froze. Tell {mimo} what it did, as a memory (${M.sx('mem')}), then tell him when he finished it: both pasts.`); },
          done: s => !!pS(s).ckDone, target: pastAt('tobias'), hint: HINTS.tobias },
        { text: 'Today: look over the workshop door', why: 'A clock finished long ago… is it still there?',
          done: s => !!nS(s).cuckoo, target: () => M.via('now', () => ({ x: CUCKOO.look.x, z: CUCKOO.look.z, hint: '{mimo} points at a little clock over the workshop door.' })), hint: '{mimo} points at a little clock over the workshop door.' },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'pk.book')) QUESTS.LIST.push({ id: 'pk.book', kind: 'side',
      get title() { return M.fillEn('The weather book'); }, get giver() { return M.fillEn('young {teo}, the weather keeper (the Frost Peaks, long ago)'); },
      started: s => !!pS(s).teoMet,
      steps: [
        { get text() { return M.fillEn('In the Past: fill in that night’s page of {teo}’s weather book'); }, get why() { return M.fillEn(`What the weather was like (the imperfect) and what happened (the preterite): ${M.sx('story')}.`); },
          done: s => !!pS(s).bookDone, target: pastAt('teo'), hint: HINTS.teo },
      ] });
    if (!QUESTS.LIST.some(q => q.id === 'pk.sled')) QUESTS.LIST.push({ id: 'pk.sled', kind: 'side',
      get title() { return M.fillEn('Little {pili}’s sled'); }, get giver() { return M.fillEn('little {pili}, by the inn (the Frost Peaks, long ago)'); },
      started: s => !!pS(s).sledAsked,
      steps: [
        { text: 'Find the sled in the snow behind the inn', get why() { return M.fillEn(`Under a drift, maybe. Tell {mimo} what it did, as a memory: ${M.sx('mem')}.`); }, done: s => !!pS(s).sledFound, target: pastAt('drift'), hint: HINTS.drift },
        { get text() { return M.fillEn('Tell little {pili} where her sled was'); }, why: 'Where something was is part of the scene: the imperfect.', done: s => !!pS(s).sledDone, target: pastAt('pili'), hint: HINTS.pili },
      ] });
    void fS;
  }

  // ------------------------------------------------------------ the dressing's hooks (TIME calls them: time.js "TIME dresses it")
  Object.assign(M.DRESS.past, {
    people: PEOPLE,
    on(api) { show(true); M.hideToday(api); },
    off() { show(false); },
    entered() { show(true); },
    late: (api, dt) => { if (typeof PK_PCAVE !== 'undefined' && PK_PCAVE && PK_PCAVE.inside) PK_PCAVE.late(dt); },
    update(api, dt, t) { update(dt, t); },
    interactables: () => interactables(),
    target: () => target(nextId()),
  });

  return { AT, PEOPLE, who, build, show, LOOKS, SEEN, CUCKOO, DRIFT, cuckooModel,
    target: id => target(id), song: () => song(), init: () => {}, changed: () => {},
    _: { talk: id => talk(id), masterScene, heardScene, storyAsk, cuckooScene, bookScene, sledAsk, sledDrift, sledScene, get built() { return built; } } };
})();
