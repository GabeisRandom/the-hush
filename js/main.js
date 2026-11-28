'use strict';
// Boots the slice: title → Noa's letters → the last stop → the Quiet Forest → Alba.
// Test hooks live on window.__g.

(() => {
  const canvas = $('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const w3d = buildWorld3D(renderer);
  const sim = new Sim();
  const scene = w3d.scene, camera = w3d.camera;
  if (typeof CULL !== 'undefined' && CULL) CULL.attach(renderer, scene);      // (the world's render skips sub-pixel parts and hairline outlines: cull.js)
  const { toon, part, G } = TK;

  // ------------------------------------------------------------ the cast and the story props
  const cast = {
    hero: ACTORS.hero(), mimo: ACTORS.mimo(), egg: ACTORS.egg(), npcs: {},
    heroShadow: ACTORS.blobShadow(scene, 0.42), mimoShadow: ACTORS.blobShadow(scene, 0.32),
  };
  scene.add(cast.hero.root, cast.mimo.root);
  cast.mimo.root.visible = false; cast.mimoShadow.visible = false;
  // the straw hat from Rita's stall in Molinar (state.flags.hat): it sits between Mimo's ears
  const mimoHat = (() => {
    const h = new THREE.Group(); h.position.set(0, 0.57, -0.03); h.rotation.set(-0.22, 0, 0.12);
    h.add(part(new THREE.CylinderGeometry(0.32, 0.34, 0.03, 20), '#e8c46a', [0, 0, 0], null, { ink: 0.01 }));     // brim
    h.add(part(new THREE.CylinderGeometry(0.13, 0.16, 0.14, 16), '#e8c46a', [0, 0.08, 0], null, { ink: 0.01 }));  // crown
    h.add(part(new THREE.CylinderGeometry(0.162, 0.162, 0.04, 16), '#d9493b', [0, 0.03, 0], null, { ink: 0 }));   // band
    h.visible = false; cast.mimo.body.add(h);
    return h;
  })();
  // the story's people in Alba (and Bruno, who starts out on the road: placeBruno() below)
  const P = WORLD.L.people;
  [['rosa', 'rosa', ...P.rosa], ['kid', 'kid', ...P.kid], ['baker', 'baker', ...P.baker], ['bruno', 'coach', WORLD.L.guide.x, WORLD.L.guide.z, 0]].forEach(([id, kind, x, z, yaw]) => {
    sim.addNpc(id, kind, x, z, yaw);
    const v = ACTORS.villager(kind); scene.add(v.root); cast.npcs[id] = v;
  });
  // Bruno waits on the road out of the forest until he's walked you to town; then he's at his yard.
  function placeBruno() {
    const B = sim.npc('bruno'), f = state.flags, inTown = f.escorted || f.rosa;
    const [x, z, yaw] = inTown ? P.brunoYard : [WORLD.L.guide.x, WORLD.L.guide.z, 0];
    B.x = x; B.z = z; B.baseYaw = B.yaw = yaw; B.y = sim.ground(x, z);
    if (f.escort && !f.escorted) { B.x = sim.you.x + 2; B.z = sim.you.z - 3; B.y = sim.ground(B.x, B.z); }   // mid-walk: next to you
    const solid = WORLD.extra.find(c => c.npc === 'bruno'); if (solid) { solid.x = B.x; solid.z = B.z; }
  }
  // The town of Alba: houses, streets, townsfolk (town.js). Its solids join the world's.
  const town = typeof TOWN !== 'undefined' && TOWN.build ? (() => { try { return TOWN.build(scene, { terrainAt: WORLD.terrainAt }); } catch (e) { console.error('[town]', e); return null; } })() : null;
  if (town && town.colliders) WORLD.addSolids(town.colliders);
  if (town && town.platforms && WORLD.addPlatforms) WORLD.addPlatforms(town.platforms);   // the pond's footbridge
  // Chapter 1, region 1: the Windmill Hills and the market town of Molinar (molinar.js), built the same way
  const molinar = typeof MOLINAR !== 'undefined' && MOLINAR.build ? (() => { try { return MOLINAR.build(scene, { terrainAt: WORLD.terrainAt }); } catch (e) { console.error('[molinar]', e); return null; } })() : null;
  if (molinar && molinar.colliders) WORLD.addSolids(molinar.colliders);
  if (molinar && molinar.platforms && WORLD.addPlatforms) WORLD.addPlatforms(molinar.platforms);   // the Great Mill's plinth
  if (molinar && molinar.moving) WORLD.extra.push(...molinar.moving);                              // Marga's cart (it moves)
  // Chapter 1, region 2: the Reed River, the Mirror Lake and Remanso (lake.js), built the same way
  const lake = typeof LAKE !== 'undefined' && LAKE.build ? (() => { try { return LAKE.build(scene, { terrainAt: WORLD.terrainAt }); } catch (e) { console.error('[lake]', e); return null; } })() : null;
  if (lake && lake.colliders) WORLD.addSolids(lake.colliders);
  if (lake && lake.platforms && WORLD.addPlatforms) WORLD.addPlatforms(lake.platforms);           // the boardwalks and docks
  if (lake && lake.moving) WORLD.extra.push(...lake.moving);
  // the corn maze by the old road (cornmaze.js): the field, built the same way (its hall under the scarecrow is a room)
  const corn = typeof CORN !== 'undefined' && CORN.build ? (() => { try { return CORN.build(scene, { terrainAt: WORLD.terrainAt }); } catch (e) { console.error('[corn]', e); return null; } })() : null;
  if (corn && corn.colliders) WORLD.addSolids(corn.colliders);
  // north of Alba (cemetery.js): the Old Quarter, the brick roads, the old theater, the cemetery
  const cem = typeof CEMETERY !== 'undefined' && CEMETERY.build ? (() => { try { return CEMETERY.build(scene, { terrainAt: WORLD.terrainAt }); } catch (e) { console.error('[cemetery]', e); return null; } })() : null;
  if (cem && cem.colliders) WORLD.addSolids(cem.colliders);
  if (cem && cem.platforms && WORLD.addPlatforms) WORLD.addPlatforms(cem.platforms);
  // Region 3, the Quarry Caves (caves.js): the quarry road north from the field, the miners' camp, the mountains
  const caves = typeof CAVES !== 'undefined' && CAVES.build ? (() => { try { return CAVES.build(scene, { terrainAt: WORLD.terrainAt }); } catch (e) { console.error('[caves]', e); return null; } })() : null;
  if (caves && caves.colliders) WORLD.addSolids(caves.colliders);
  if (caves && caves.moving) WORLD.extra.push(...caves.moving);          // (the mist's barrier across the road, until the lake's bell)
  // Region 4, the Bloom Gardens (gardens.js): the garden road south of Molinar, the hedge and its gate, the valley, the flower show
  const gardens = typeof GARDENS !== 'undefined' && GARDENS.build ? (() => { try { return GARDENS.build(scene, { terrainAt: WORLD.terrainAt }); } catch (e) { console.error('[gardens]', e); return null; } })() : null;
  if (gardens && gardens.colliders) WORLD.addSolids(gardens.colliders);
  if (gardens && gardens.moving) WORLD.extra.push(...gardens.moving);    // (the mist on the ridge road until the gong, and the gate's leaves)
  // Region 5, the Frost Peaks (peaks.js): the pass east out of the miners' camp, the village of Escarcha and its clocks, the Ice Clock Tower
  const peaks = typeof PEAKS !== 'undefined' && PEAKS.build ? (() => { try { return PEAKS.build(scene, { terrainAt: WORLD.terrainAt }); } catch (e) { console.error('[peaks]', e); return null; } })() : null;
  if (peaks && peaks.colliders) WORLD.addSolids(peaks.colliders);
  if (peaks && peaks.moving) WORLD.extra.push(...peaks.moving);          // (the blizzard across the pass, the snowdrift, the drift at the tower's door)
  // Region 6, Port Brisa (port.js): the road south from Remanso, the moat and the drawbridge, the walled city, the harbor, the sea fort
  const port = typeof PORT !== 'undefined' && PORT.build ? (() => { try { return PORT.build(scene, { terrainAt: WORLD.terrainAt }); } catch (e) { console.error('[port]', e); return null; } })() : null;
  if (port && port.colliders) WORLD.addSolids(port.colliders);
  if (port && port.platforms && WORLD.addPlatforms) WORLD.addPlatforms(port.platforms);   // (the piers, the fort's dock, the drawbridge)
  if (port && port.moving) WORLD.extra.push(...port.moving);             // (the fog across the road until the fifth bell)
  // Region 8, the Gray Marsh (marsh.js): the old north road past its gate, the basin at the Old Tower's feet, Candil, the drowned chapel
  const marsh = typeof MARSH !== 'undefined' && MARSH.build ? (() => { try { return MARSH.build(scene, { terrainAt: WORLD.terrainAt }); } catch (e) { console.error('[marsh]', e); return null; } })() : null;
  if (marsh && marsh.colliders) WORLD.addSolids(marsh.colliders);
  if (marsh && marsh.platforms && WORLD.addPlatforms) WORLD.addPlatforms(marsh.platforms);   // (the boardwalk and its gaps' planks, the dock, the chapel's jetty)
  if (marsh && marsh.moving) WORLD.extra.push(...marsh.moving);          // (the gate, the fog banks, the punt)
  // Region 7, the Sunken Ruins (ruins.js, ruins_scenes.js): the red canyon down the coast, by ship from Port Brisa; the dig camp, the old town, the temple
  const ruins = typeof RUINS !== 'undefined' && RUINS.build ? (() => { try { return RUINS.build(scene, { terrainAt: WORLD.terrainAt }); } catch (e) { console.error('[ruins]', e); return null; } })() : null;
  if (ruins && ruins.colliders) WORLD.addSolids(ruins.colliders);
  if (ruins && ruins.platforms && WORLD.addPlatforms) WORLD.addPlatforms(ruins.platforms);   // (the pier)
  if (ruins && ruins.moving) WORLD.extra.push(...ruins.moving);          // (the sand slide, the Door of Days)
  // More of the world, each a self-contained module (DESIGN.md 14.7): town life (the smokers' slang, the swearer, corner
  // stores, side quests), the kids' games and the chess hustlers, and the language's own character: es Don Fello's
  // dominó table, pt Kauã's phonk, de Adi the postman (each hides itself in the other languages)
  const buildMod = (M, tag) => { if (!M || !M.build) return null; try { const b = M.build(scene, { terrainAt: WORLD.terrainAt }); if (b && b.colliders && b.colliders.length) WORLD.addSolids(b.colliders); return b; } catch (e) { console.error('[' + tag + ']', e); return null; } };
  const townlife = buildMod(typeof TOWNLIFE !== 'undefined' && TOWNLIFE, 'townlife');
  const minigames = buildMod(typeof MINIGAMES !== 'undefined' && MINIGAMES, 'minigames');
  const domino = buildMod(typeof DOMINO !== 'undefined' && DOMINO, 'domino');
  const phonk = buildMod(typeof PHONK !== 'undefined' && PHONK, 'phonk');
  const adolf = buildMod(typeof ADOLF !== 'undefined' && ADOLF, 'adolf');
  const signs = buildMod(typeof SIGNS !== 'undefined' && SIGNS, 'signs');      // (signs.js: every sign readable, E to read it)
  const romance = buildMod(typeof ROMANCE !== 'undefined' && ROMANCE, 'romance');      // (romance.js: Morgana and Dante, DESIGN.md 14.9)
  const cards = buildMod(typeof CARDS !== 'undefined' && CARDS, 'cards');            // (cards.js: Grandpa Chen's 斗地主 table, zh only)
  const newyear = buildMod(typeof NEWYEAR !== 'undefined' && NEWYEAR, 'newyear');    // (newyear.js: Longlong, the New Year kid, and the festival, zh only)
  const muertos = buildMod(typeof MUERTOS !== 'undefined' && MUERTOS, 'muertos');    // (muertos.js: Xochi and the Día de Muertos, es only)
  const matsuri = buildMod(typeof MATSURI !== 'undefined' && MATSURI, 'matsuri');    // (matsuri.js: Natsu and the summer festival, 夏祭り, ja only)
  const carnaval = buildMod(typeof CARNAVAL !== 'undefined' && CARNAVAL, 'carnaval');    // (carnaval.js: Malu and the street Carnaval, pt only)
  const weihnacht = buildMod(typeof WEIHNACHT !== 'undefined' && WEIHNACHT, 'weihnacht');    // (weihnacht.js: Fiete and the Weihnachtsmarkt, de only)
  const lucha = buildMod(typeof LUCHA !== 'undefined' && LUCHA, 'lucha');    // (lucha.js: Doña Toña's tortilla stand, es only; LUCHA itself is the Arenita room below)
  const familia = buildMod(typeof FAMILIA !== 'undefined' && FAMILIA, 'familia');    // (familia.js: Vó Dita and the family group chat, pt only)
  const shogi = buildMod(typeof SHOGI !== 'undefined' && SHOGI, 'shogi');    // (shogi.js: Grandpa Shige's shogi bench at the game corner, ja only)
  const doener = buildMod(typeof DOENER !== 'undefined' && DOENER, 'doener');    // (doener.js: the Yıldız Grill's storefront on house 10, de only; DOENER itself is the shop room below)
  const MODS = [townlife, minigames, domino, phonk, adolf, romance, cards, newyear, muertos, matsuri, carnaval, weihnacht, lucha, familia, shogi, doener];
  // The hushed townsfolk drain the color around them (DESIGN.md 14.6): a gray stain on the ground where
  // they stand, and near them the screen grays and the music slows and dims (hushNear, in frame()).
  const hushedFolk = [];
  {
    const tex = TK.canvasTex(128, 128, c => {
      const g = c.createRadialGradient(64, 64, 6, 64, 64, 62);
      g.addColorStop(0, 'rgba(158,156,168,0.85)'); g.addColorStop(0.45, 'rgba(158,156,168,0.6)'); g.addColorStop(1, 'rgba(158,156,168,0)');
      c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    });
    const geo = new THREE.PlaneGeometry(10, 10), mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
    [town, molinar, lake, caves, gardens, peaks, port, marsh, ruins].forEach(grp => { if (grp && grp.people) grp.people.forEach(p => {
      if (!p.hushed) return;
      const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.renderOrder = 2; scene.add(m);
      hushedFolk.push({ p, m, grp });
    }); });
  }
  function hushNear(Y) {
    let a = 0;
    for (const f of hushedFolk) {
      const on = f.p.hushed && (!f.grp.group || f.grp.group.visible) && !indoors();
      f.m.visible = on;
      if (!on) continue;
      f.m.position.set(f.p.x, WORLD.groundAt(f.p.x, f.p.z) + 0.07, f.p.z);
      a = Math.max(a, 0.72 * (1 - smoothstep(2.2, 8.5, Math.hypot(f.p.x - Y.x, f.p.z - Y.z))));
    }
    return a;
  }
  // the raft over the Reed River rests by whichever bank you left it at (story.js rideRaft moves it)
  const placeRaft = () => {
    const r = lake && lake.objects && lake.objects.raft, K = LAKE.landmarks; if (!r || !K.raftHome) return;
    const at = state.flags.raftWest ? K.raftAway : K.raftHome; r.position.x = at.x; r.position.z = at.z;
  };
  // The boulder in the pass: the road to Molinar stays shut until Mimo pushes it («¡empuja!», DESIGN.md 14.2).
  // Pushed, it rolls down the road and settles by the roadside.
  const boulder = (() => {
    const B = WORLD.L.boulder, g = new THREE.Group(); scene.add(g);
    const rock = part(G.ico1, '#a19a8d', [0, 1.5, 0], [2.15, 1.75, 2.0], { ink: 0.03 }); g.add(rock);
    g.add(part(G.sphere, '#6f9a4a', [0.3, 3.0, -0.2], [1.15, 0.32, 0.95], { ink: 0 }));      // moss on top
    g.add(part(G.ico1, '#8f887c', [-1.6, 0.4, 1.3], [0.7, 0.5, 0.6], { ink: 0.02 }));         // a few stones at its foot
    g.add(part(G.ico1, '#8f887c', [1.5, 0.3, -1.5], [0.5, 0.4, 0.5], { ink: 0.02 }));
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    const solid = { x: B.x, z: B.z, r: B.r, id: 'boulder' }; WORLD.extra.push(solid);
    const place = (x, z) => { g.position.set(x, WORLD.terrainAt(x, z), z); solid.x = x; solid.z = z; };
    place(B.x, B.z);
    return { g, rock, solid, place, rest: { x: B.x + 7.5, z: B.z + 4.8 } };
  })();
  async function pushBoulder() {
    const B = boulder, M = sim.mimo, from = { x: B.g.position.x, z: B.g.position.z };
    sim.mimoGo({ x: from.x - 2.7, z: from.z + 0.3 }, { x: from.x, z: from.z });
    await STORY.wait(1.1);
    // it rocks a little, Mimo shoves… and it goes
    for (let k = 0; k < 3; k++) {
      Sound.play('land', 8 + k * 3); M.hop = { t: 0 };
      await STORY.tween(0.32, t => { B.g.position.x = from.x + Math.sin(t * Math.PI) * (0.18 + k * 0.08); B.g.rotation.z = -Math.sin(t * Math.PI) * (0.05 + k * 0.03); });
      await STORY.wait(0.18);
    }
    w3d.fx.puff(from.x - 1.8, WORLD.terrainAt(from.x, from.z), from.z, 10, 0.3);
    const to = B.rest; let lastX = from.x;
    await STORY.tween(1.7, k => {
      const e = 1 - Math.pow(1 - k, 2.4), x = lerp(from.x, to.x, e), z = lerp(from.z, to.z, e * e);
      B.place(x, z); B.g.rotation.z -= (x - lastX) / 1.9; lastX = x;
      if (Math.random() < 0.25) w3d.fx.puff(x, WORLD.terrainAt(x, z), z, 2, 0.16);
    });
    Sound.play('land', 18); w3d.fx.puff(to.x, WORLD.terrainAt(to.x, to.z), to.z, 14, 0.38);
    sim.mimoGo(null, null);
  }
  // Noa's notebook pages, pinned to little posts
  const pageMeshes = {};
  const pageTex = TK.canvasTex(128, 160, (c) => { c.fillStyle = '#fffaf0'; c.fillRect(0, 0, 128, 160); c.strokeStyle = 'rgba(43,34,53,0.35)'; c.lineWidth = 3; for (let y = 34; y < 150; y += 18) { c.beginPath(); c.moveTo(14, y); c.lineTo(114 - (y % 36), y); c.stroke(); } c.fillStyle = '#e05a4b'; c.beginPath(); c.arc(64, 14, 7, 0, TAU); c.fill(); });
  STORY.PAGES.forEach(p => {
    const g = new THREE.Group(); g.position.set(p.x, WORLD.terrainAt(p.x, p.z), p.z); scene.add(g);
    g.add(part(G.box, '#8a5f3e', [0, 0.65, 0], [0.16, 1.3, 0.16], { ink: 0 }));
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ map: pageTex, side: THREE.DoubleSide }));
    sheet.position.set(0, 1.05, 0.1); sheet.rotation.z = 0.08; g.add(sheet);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3b0', transparent: true, opacity: 0.4, depthWrite: false })); glow.scale.setScalar(1.2); glow.position.set(0, 1.05, 0.15); g.add(glow);
    g.rotation.y = Math.atan2(sim.you.x - p.x, sim.you.z - p.z);
    pageMeshes[p.key] = { g, glow };
  });
  // the chest in Noa's secret glade
  const chest = (() => {
    const g = new THREE.Group(); g.position.set(-23.2, WORLD.terrainAt(-23.2, 46.2), 46.2); g.rotation.y = 0.5; scene.add(g);
    g.add(part(G.box, '#b8743f', [0, 0.31, 0], [1.2, 0.62, 0.8], { ink: 0.015 }));
    [-0.4, 0.4].forEach(x => g.add(part(G.box, '#e6c34e', [x, 0.32, 0], [0.12, 0.64, 0.82], { ink: 0 })));
    const lidPivot = new THREE.Group(); lidPivot.position.set(0, 0.62, -0.4); g.add(lidPivot);
    const lid = part(new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16, 1, false, 0, Math.PI), '#a8673a', [0, 0, 0.4], null, { rot: [0, 0, Math.PI / 2], ink: 0.015 }); lidPivot.add(lid);
    WORLD.extra.push({ obox: 1, x: -23.2, z: 46.2, hw: 0.65, hd: 0.45, rot: 0.5 });
    return { g, lidPivot, open: false };
  })();
  cast.chestOpen = () => { chest.open = true; };
  // the hushed fox, and a little bird frozen mid-song at the lookout (gray: the Hush took their voices)
  const gray = c => toon(c, { rim: 0.1 });
  {
    const f = new THREE.Group(); f.position.set(-30.5, WORLD.terrainAt(-30.5, 13), 13); f.rotation.y = 0.9; scene.add(f);
    f.add(part(G.sphere, '#9a9aa6', [0, 0.55, 0], [0.32, 0.3, 0.55], { mat: gray('#9a9aa6') }));
    f.add(part(G.sphere, '#9a9aa6', [0, 0.85, 0.5], [0.26, 0.24, 0.26], { mat: gray('#9a9aa6') }));
    f.add(part(new THREE.ConeGeometry(0.12, 0.3, 8), '#8c8c98', [0, 0.8, 0.78], null, { rot: [Math.PI / 2, 0, 0], mat: gray('#8c8c98') }));
    [-1, 1].forEach(s => f.add(part(new THREE.ConeGeometry(0.09, 0.26, 6), '#8c8c98', [s * 0.13, 1.1, 0.46], null, { mat: gray('#8c8c98') })));
    [[-0.15, 0.25], [0.15, 0.25], [-0.15, -0.3], [0.15, -0.3]].forEach(([x, z]) => f.add(part(G.cyl, '#8c8c98', [x, 0.2, z], [0.06, 0.42, 0.06], { mat: gray('#8c8c98') })));
    f.add(part(G.sphere, '#b6b6c0', [0, 0.68, -0.72], [0.18, 0.18, 0.5], { rot: [0.6, 0, 0], mat: gray('#b6b6c0') }));
    WORLD.extra.push({ x: -30.5, z: 13, r: 0.7 });
  }
  {
    const b = new THREE.Group(); b.position.set(26.2, WORLD.terrainAt(26.2, -12.2), -12.2); scene.add(b);
    b.add(part(G.cyl, '#8a7a6a', [0, 0.55, 0], [0.18, 1.1, 0.18], { mat: gray('#8a7a6a') }));
    b.add(part(G.sphere, '#a9a9b4', [0, 1.28, 0], [0.16, 0.14, 0.2], { mat: gray('#a9a9b4') }));
    b.add(part(G.sphere, '#a9a9b4', [0, 1.42, 0.12], [0.1, 0.1, 0.1], { mat: gray('#a9a9b4') }));
    b.add(part(new THREE.ConeGeometry(0.04, 0.12, 6), '#9a9aa6', [0, 1.41, 0.25], null, { rot: [Math.PI / 2, 0, 0], mat: gray('#9a9aa6') }));
    WORLD.extra.push({ x: 26.2, z: -12.2, r: 0.35 });
  }

  // ------------------------------------------------------------ Hushlings roaming the fields, and the big one on the hill
  function foeModel(spec) {
    if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) { try { const m = BATTLE.buildFoe(spec.kind, spec.color, { size: spec.size, shadow: spec.shadow }); if (m) return m; } catch (e) { console.warn('[foes]', e); } }     // (shadow: the Gray Marsh's shadows, marsh_battle.js)
    const g = new THREE.Group(), s = /big/.test(spec.kind) ? 1.8 : spec.size === 'big' ? 1.25 : 0.95;
    const tint = { red: '#d06a6a', blue: '#6f86d6', green: '#6fae7a', yellow: '#d8c062' }[spec.color] || '#9a8fb0';
    g.add(part(G.sphere, '#8c84a6', [0, 0.42 * s, 0], [0.45 * s, 0.42 * s, 0.45 * s]));
    g.add(part(new THREE.ConeGeometry(0.3 * s, 0.5 * s, 10), tint, [0, 0.88 * s, -0.04], null));
    [-1, 1].forEach(k => { const e = new THREE.Mesh(G.sphere, new THREE.MeshBasicMaterial({ color: '#2b2235' })); e.scale.set(0.05 * s, 0.025 * s, 0.03 * s); e.position.set(k * 0.15 * s, 0.5 * s, 0.4 * s); g.add(e); });
    return g;
  }
  // A roamer's cheap look (DESIGN.md 17.6: one lake gang cost about 274 draw calls). Each foe out here is BATTLE.buildFoe's battle
  // model: dozens of little parts, each with its ink hull. Past a few steps it's drawn instead as a handful of skinned meshes, one
  // per material: the parts that never move by themselves are merged once per kind (and size) and ride on the model's own moving
  // parts as bones, so the copy moves just as the model does (it still animates, unseen). Parts that blink in and out (the eyes)
  // stay as they are, and close by it's the full model again. (The merged originals sit on layer 31, which no camera draws.)
  const FOE_LITE = (() => {
    const HIDE = 31, NEAR = 16, FAR = 20, SIGS = new Map(), MATS = new Map(), I4 = new THREE.Matrix4(), MP = THREE.Material.prototype;
    let budget = 0;          // (models set up per frame: one, so a gang coming into view never stalls a frame)
    const nodesOf = g => { const a = []; g.traverse(o => a.push(o)); return a; };
    const shown = (o, top) => { for (let p = o; p; p = p.parent) { if (!p.visible) return false; if (p === top) return true; } return true; };
    const hex = c => (c && c.isColor ? c.getHexString() : '');
    const val = v => (typeof v === 'number' || typeof v === 'boolean' ? v : v && v.isColor ? v.getHexString() : v && v.toArray ? v.toArray().join(',') : v && v.uuid ? v.uuid : typeof v);
    // what a material's shader hook does, run on a dummy shader: an ink hull's push (baked into the copy), the uniforms it sets (like
    // felt's rim: part of its key), or something else that moves vertices (that part then keeps its own mesh)
    function hookOf(m) {
      if (!m.onBeforeCompile || m.onBeforeCompile === MP.onBeforeCompile) return { k: '' };
      const sh = { uniforms: {}, vertexShader: '#include <begin_vertex>', fragmentShader: '#include <tonemapping_fragment>' };
      try { m.onBeforeCompile(sh); } catch (e) { return { bad: true }; }
      const hull = /transformed = position \+ normal \* (-?[\d.]+(?:e-?\d+)?)\s*;/.exec(sh.vertexShader);
      if (hull && m.side === THREE.BackSide) return { k: 'hull', w: parseFloat(hull[1]) };
      if (sh.vertexShader !== '#include <begin_vertex>') return { bad: true };
      return { k: Object.keys(sh.uniforms).map(u => u + '=' + val(sh.uniforms[u].value)).join(',') + '|' + sh.fragmentShader };
    }
    // the parts that can share one draw: the same look (every setting that reaches the shader), the same shadows, the same order
    function keyOf(o) {
      const m = o.material, h = hookOf(m);
      if (h.bad) return null;
      const look = h.k === 'hull' ? ['hull', hex(m.color), m.side, m.fog, m.transparent, m.opacity]
        : [m.type, hex(m.color), hex(m.emissive), m.map ? m.map.uuid : '', m.gradientMap ? m.gradientMap.uuid : '', m.side, m.transparent, m.opacity, m.vertexColors, m.depthWrite, m.depthTest, m.fog,
          m.alphaTest, m.blending, m.wireframe, m.flatShading, m.customProgramCacheKey && m.customProgramCacheKey !== MP.customProgramCacheKey ? m.customProgramCacheKey() : '', h.k];
      return { key: look.join('|') + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + o.renderOrder, hull: h.k === 'hull', w: h.w || 0 };
    }
    // the same material, for skinned meshes (ink hulls: plain ink, their push is in the copy's shape)
    function skinMat(m, k) {
      let s = MATS.get(k.key);
      if (s) return s;
      if (k.hull) s = new THREE.MeshBasicMaterial({ color: m.color, side: m.side, fog: m.fog, transparent: m.transparent, opacity: m.opacity });
      else { s = m.clone(); s.onBeforeCompile = m.onBeforeCompile; s.customProgramCacheKey = m.customProgramCacheKey; }
      s.skinning = true;
      MATS.set(k.key, s);
      return s;
    }
    // which nodes move or blink: a spare model of the kind, run through its moods and paces
    function probe(g, nodes) {
      const n = nodes.length, M0 = new Float32Array(n * 16), V0 = nodes.map(o => o.visible), dynT = new Set(), dynV = new Set();
      nodes.forEach((o, i) => { o.updateMatrix(); M0.set(o.matrix.elements, i * 16); });
      const ud = g.userData; let t = 0;
      for (const mood of ['idle', 'alert']) for (const sp of [0, 1.2, 2.6]) {
        ud.mood = mood;
        for (let s = 0; s < 40; s++) {
          t += 0.1; ud.animate(0.1, t, sp);
          for (let i = 0; i < n; i++) {
            const o = nodes[i];
            if (o.visible !== V0[i]) dynV.add(i);
            if (dynT.has(i)) continue;
            o.updateMatrix(); const e = o.matrix.elements;
            for (let k = 0; k < 16; k++) if (Math.abs(e[k] - M0[i * 16 + k]) > 1e-5) { dynT.add(i); break; }
          }
        }
      }
      ud.mood = 'idle'; ud.animate(0, 0, 0);
      return { dynT, dynV };
    }
    // one material's parts, merged: each vertex in its moving part's space (a bone), the hulls pushed out as their shader would
    function bake(S, cls) {
      const { tmp, tn, P } = S;
      tmp.updateMatrixWorld(true);
      const at = new Map(tn.map((o, i) => [o, i])), bones = [0], boneAt = new Map([[0, 0]]);
      const boneOf = o => { for (let p = o; p && p !== tmp; p = p.parent) { const i = at.get(p); if (P.dynT.has(i)) { if (!boneAt.has(i)) { boneAt.set(i, bones.length); bones.push(i); } return boneAt.get(i); } } return 0; };
      const gInv = new THREE.Matrix4().copy(tmp.matrixWorld).invert(), rel = new THREE.Matrix4(), toG = new THREE.Matrix4(), nm = new THREE.Matrix3();
      const v = new THREE.Vector3(), w = new THREE.Vector3(), n = new THREE.Vector3(), box = new THREE.Box3();
      const geos = cls.map(c => {
        let nv = 0, ni = 0;
        for (const i of c.list) { const gi = tn[i].geometry; nv += gi.attributes.position.count; ni += gi.index ? gi.index.count : gi.attributes.position.count; }
        const uvs = !!(c.mat.map || c.mat.alphaMap), pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = uvs ? new Float32Array(nv * 2) : null;
        const si = new Uint16Array(nv * 4), sw = new Float32Array(nv * 4), ind = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
        let ov = 0, oi = 0; box.makeEmpty();
        for (const i of c.list) {
          const o = tn[i], gi = o.geometry, P0 = gi.attributes.position, N0 = gi.attributes.normal, U0 = gi.attributes.uv, X0 = gi.index, b = boneOf(o), bone = b ? tn[bones[b]] : tmp;
          rel.copy(bone.matrixWorld).invert().multiply(o.matrixWorld); toG.copy(gInv).multiply(o.matrixWorld); nm.getNormalMatrix(rel);
          for (let k = 0; k < P0.count; k++) {
            v.fromBufferAttribute(P0, k); if (N0) n.fromBufferAttribute(N0, k); else n.set(0, 1, 0);
            if (c.k.hull) v.addScaledVector(n, c.k.w);
            box.expandByPoint(w.copy(v).applyMatrix4(toG));
            v.applyMatrix4(rel); pos[(ov + k) * 3] = v.x; pos[(ov + k) * 3 + 1] = v.y; pos[(ov + k) * 3 + 2] = v.z;
            n.applyMatrix3(nm).normalize(); nor[(ov + k) * 3] = n.x; nor[(ov + k) * 3 + 1] = n.y; nor[(ov + k) * 3 + 2] = n.z;
            if (uv && U0) { uv[(ov + k) * 2] = U0.getX(k); uv[(ov + k) * 2 + 1] = U0.getY(k); }
            si[(ov + k) * 4] = b; sw[(ov + k) * 4] = 1;
          }
          if (X0) for (let k = 0; k < X0.count; k++) ind[oi + k] = X0.getX(k) + ov; else for (let k = 0; k < P0.count; k++) ind[oi + k] = ov + k;
          // a mirrored part (a left wing: three turns its faces round for it, by its own matrix): its triangles turned round here instead
          if (o.matrixWorld.determinant() < 0) for (let k = oi, e = oi + (X0 ? X0.count : P0.count); k + 2 < e; k += 3) { const q = ind[k + 1]; ind[k + 1] = ind[k + 2]; ind[k + 2] = q; }
          ov += P0.count; oi += X0 ? X0.count : P0.count;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
        geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
        geo.setIndex(new THREE.BufferAttribute(ind, 1));
        geo.boundingSphere = box.getBoundingSphere(new THREE.Sphere()); geo.boundingSphere.radius += 1.2;     // (in the model's space, with room for its moves)
        return geo;
      });
      return { bones, geos };
    }
    // a model's cheap copy (null: it keeps its full model): the spare of its kind is probed and baked once, then shared
    function make(g, spec) {
      if (!spec || typeof BATTLE === 'undefined' || !BATTLE.buildFoe) return null;
      const nodes = nodesOf(g), sk = [spec.kind, spec.size || 'small', spec.shadow ? 1 : 0, nodes.length].join('|');
      let S = SIGS.get(sk);
      if (S === undefined) {
        S = null;
        const tmp = BATTLE.buildFoe(spec.kind, spec.color, { size: spec.size, shadow: spec.shadow }), tn = tmp && nodesOf(tmp);
        if (tn && tn.length === nodes.length && tmp.userData.animate) S = { tmp, tn, P: probe(tmp, tn), sets: new Map() };
        SIGS.set(sk, S);
      }
      if (!S) return null;
      const at = new Map(nodes.map((o, i) => [o, i]));
      const blinks = o => { for (let p = o; p && p !== g; p = p.parent) if (S.P.dynV.has(at.get(p))) return true; return false; };
      const byKey = new Map();
      for (let i = 0; i < nodes.length; i++) {
        const o = nodes[i], t = S.tn[i];
        if (!!o.isMesh !== !!(t && t.isMesh) || (o.isMesh && o.geometry.attributes.position.count !== t.geometry.attributes.position.count)) return null;     // (not built the same: leave it)
        if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || !shown(o, g) || blinks(o)) continue;
        if (o.geometry.morphAttributes && Object.keys(o.geometry.morphAttributes).length) continue;
        const k = keyOf(o); if (!k) continue;
        let c = byKey.get(k.key); if (!c) byKey.set(k.key, c = { k, mat: o.material, list: [] });
        c.list.push(i);
      }
      const cls = [...byKey.values()]; if (!cls.length) return null;
      const hash = cls.map(c => c.list.join(',')).join(';');
      let set = S.sets.get(hash); if (!set) S.sets.set(hash, set = bake(S, cls));
      const bones = set.bones.map(i => nodes[i]), skel = new THREE.Skeleton(bones, bones.map(() => new THREE.Matrix4()));
      const skinned = cls.map((c, j) => {
        const o = nodes[c.list[0]], s = new THREE.SkinnedMesh(set.geos[j], skinMat(c.mat, c.k));
        s.bind(skel, I4); s.castShadow = o.castShadow; s.receiveShadow = o.receiveShadow; s.renderOrder = o.renderOrder; s.visible = false; s.name = 'foe-lite';
        g.add(s); return s;
      });
      return { on: false, merged: cls.flatMap(c => c.list).map(i => nodes[i]), sprites: nodes.filter(o => o.isSprite), skinned };
    }
    // every frame, for a gang that's drawn: the full model up close, the copy past FAR (back to full inside NEAR)
    function frame(grp, d) {
      grp.mark.layers.set(grp.alert > 0.01 ? 0 : HIDE);       // (the «!»: nothing to draw while it's clear)
      grp.members.forEach((m, k) => {
        const ud = m.userData;
        if (!('lite' in ud)) { if (d <= FAR || budget <= 0) return; budget--; ud.lite = null; try { ud.lite = make(m, grp.home.foes[k]); } catch (e) { console.warn('[foes] lite', e); } }
        const L = ud.lite; if (!L) return;
        const on = L.on ? d > NEAR : d > FAR;
        if (on !== L.on) { L.on = on; for (const o of L.merged) o.layers.set(on ? HIDE : 0); for (const s of L.skinned) s.visible = on; }
        for (const s of L.sprites) s.layers.set(s.material.opacity > 0.002 ? 0 : HIDE);      // (a weak spot's glow, a «zzz»: drawn only while they show)
      });
    }
    return { frame, newFrame() { budget = 1; }, _: { SIGS, MATS, make, probe } };
  })();
  const markTex =TK.canvasTex(64, 64, c => { c.font = '900 52px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#e0503f'; c.strokeStyle = '#fffaf0'; c.lineWidth = 6; c.strokeText('!', 32, 52); c.fillText('!', 32, 52); });
  function makeGroup(G0, gi) {
    const root = new THREE.Group(); scene.add(root);
    const n = Math.min(3, G0.foes.length);
    const gap = G0.foes.some(f => f.kind === 'moth') ? 1.5 : 1.15;     // (a moth's wings are wide)
    const members = G0.foes.slice(0, n).map((spec, k) => { const m = foeModel(spec); m.position.x = (k - (n - 1) / 2) * gap; root.add(m); return m; });
    const mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex, transparent: true, opacity: 0, depthWrite: false }));
    mark.scale.setScalar(0.9); mark.position.y = 2.2; root.add(mark);
    return { gi, home: G0, x: G0.x, z: G0.z, yaw: 0, root, members, mark, t: Math.random() * 9, wander: null, alert: 0 };
  }
  // the field's quest groups, and the roamers everywhere else (they come back after a while)
  const groups = WORLD.L.fieldGroups.map(makeGroup);
  const roamers = WORLD.L.roamers.map((G0, ri) => Object.assign(makeGroup(G0, ri), { roam: true, away: 0 }));
  const roamerBeaten = ri => { const r = roamers[ri]; if (r) { r.away = 240; r.x = r.home.x; r.z = r.home.z; } };
  const boss = (() => { const m = foeModel({ kind: 'hushling_big', color: 'red' }); m.position.set(WORLD.L.boss.x, WORLD.terrainAt(WORLD.L.boss.x, WORLD.L.boss.z), WORLD.L.boss.z); scene.add(m); return m; })();
  // Hushlings that jump out on the road (shown by the story: -1 is the one Bruno's first lesson is about)
  const ambushes = [{ x: WORLD.L.guide.x + 2.5, z: WORLD.L.guide.z - 3.5, foes: [{ kind: 'hushling', color: 'green', size: 'small' }] }].concat(WORLD.L.ambush).map(A => {
    const root = new THREE.Group(); root.visible = false; scene.add(root);
    const gap = A.foes.some(f => f.kind === 'moth') ? 1.5 : 1.2;
    const members = A.foes.slice(0, 3).map((spec, k) => { const m = foeModel(spec); m.position.x = (k - (A.foes.length - 1) / 2) * gap; root.add(m); return m; });
    root.position.set(A.x, WORLD.terrainAt(A.x, A.z), A.z);
    return { root, members, pop: 0 };
  });
  function showAmbush(i, on) {
    const a = ambushes[i + 1]; if (!a) return;
    a.root.visible = on; a.pop = 0;
    if (on) { w3d.fx.puff(a.root.position.x, a.root.position.y, a.root.position.z, 10, 0.3, '#c8c6d8'); a.root.rotation.y = Math.atan2(sim.you.x - a.root.position.x, sim.you.z - a.root.position.z); }
  }
  function updateAmbushes(dt, t) {
    ambushes.forEach(a => {
      if (!a.root.visible) return;
      a.pop = Math.min(1, a.pop + dt * 4); a.root.scale.setScalar(easeOutBack(a.pop, 2));
      a.members.forEach((m, k) => { if (m.userData.animate) { m.userData.mood = 'alert'; m.userData.animate(dt, t + k * 0.7, 0); } });
    });
  }
  // The old tower, far north on the skyline, where the Hush began and Noa went: always in view
  // once you're out of the forest, so you know where the story is headed.
  const tower = (() => {
    const T = WORLD.L.tower;
    let g = null;
    if (typeof INTERLUDE !== 'undefined' && INTERLUDE.buildTower) { try { g = INTERLUDE.buildTower(); } catch (e) { console.warn('[tower]', e); } }
    if (!g) {        // a plain stand-in
      g = new THREE.Group();
      g.add(part(new THREE.CylinderGeometry(9, 13, 10, 9), '#6f6a78', [0, 5, 0], null, { ink: 0 }));
      g.add(part(new THREE.CylinderGeometry(3.2, 3.8, 26, 12), '#7d7889', [0, 22, 0], null, { ink: 0 }));
      g.add(part(new THREE.ConeGeometry(4.2, 6, 12), '#4f4a5e', [0, 38, 0], null, { ink: 0 }));
    }
    g.position.set(T.x, 6, T.z); g.scale.setScalar(2.3); scene.add(g);     // big: a landmark you can see from Alba and the field (further off since the map grew north)
    return g;
  })();
  let grace = 0;
  function updateFoes(dt, t) {
    const Y = sim.you, S = state, lessons = S.flags.lessons || 0;
    FOE_LITE.newFrame();
    groups.concat(roamers).forEach(g => {
      if (g.roam) { g.away -= dt; g.root.visible = g.away <= 0 && lessons >= (g.home.area === 'field' ? 2 : 1) && (g.home.area !== 'hills' || !!S.flags.boss) && (g.home.area !== 'lake' || !!S.flags.millFree) && (g.home.area !== 'quarry' || (typeof CAVES !== 'undefined' && CAVES.lakeFree(S))) && (g.home.area !== 'gardens' || !!S.flags.gardenGate) && (g.home.area !== 'peaks' || (typeof PEAKS !== 'undefined' && PEAKS.open(S))) && (g.home.area !== 'port' || (typeof PORT !== 'undefined' && !!PORT.crabsOn && PORT.crabsOn(S))) && (!/^marsh/.test(g.home.area) || (typeof MARSH !== 'undefined' && MARSH.roamOk(g.home.area, S))) && (g.home.area !== 'ruins' || (typeof RUINS !== 'undefined' && !!RUINS.roamOk && RUINS.roamOk(S))); }
      else g.root.visible = !(S.cleared || []).includes(g.gi) && lessons >= 2;
      if ((typeof PAST !== 'undefined' && PAST.inside) || (typeof TIME !== 'undefined' && TIME.world && TIME.world() !== 'now')) g.root.visible = false;      // (the Past and the Future: none of today's Hushlings in another world, time.js)
      if (!g.root.visible) return;
      // far away: don't draw or move them (each one is dozens of little meshes, and the trees hide them anyway)
      if (Math.abs(Y.x - g.x) > 70 || Math.abs(Y.z - g.z) > 70) { g.root.visible = false; return; }
      const d = Math.hypot(Y.x - g.x, Y.z - g.z), H = g.home, spot = H.spot || 7;     // (P7b: a group can see farther, chase faster, keep to a boardwalk: js/lake_frogs.js)
      g.alert = damp(g.alert, d < spot + 1 ? 1 : 0, 5, dt);
      let tx, tz, speed = 1.2;
      if (d < spot && grace <= 0) { tx = Y.x; tz = Y.z; speed = H.chase || 2.6; }          // spotted you: they waddle over
      else { if (!g.wander || (g.t -= dt) <= 0) { const a = Math.random() * TAU; g.wander = { x: g.home.x + Math.cos(a) * 3, z: g.home.z + Math.sin(a) * 3 }; g.t = 2 + Math.random() * 3; } tx = g.wander.x; tz = g.wander.z; }
      const dx = tx - g.x, dz = tz - g.z, dd = Math.hypot(dx, dz);
      if (dd > 0.3) { const nx = g.x + (dx / dd) * speed * dt, nz = g.z + (dz / dd) * speed * dt; if (!H.canGo || H.canGo(nx, nz)) { g.x = nx; g.z = nz; } g.yaw = dampAngle(g.yaw, Math.atan2(dx, dz), 6, dt); }
      g.root.position.set(g.x, H.yAt ? H.yAt(g.x, g.z) : WORLD.terrainAt(g.x, g.z), g.z); g.root.rotation.y = g.yaw;
      g.members.forEach((m, k) => {
        if (m.userData.animate) { m.userData.mood = g.alert > 0.5 ? 'alert' : 'idle'; m.userData.animate(dt, t + k * 0.7, dd > 0.3 ? speed : 0); }
        else { m.position.y = Math.abs(Math.sin(t * 6 + k * 1.7)) * 0.18; m.scale.y = 1 + Math.sin(t * 12 + k) * 0.04; }
      });
      g.mark.material.opacity = g.alert; g.mark.position.y = 2.2 + Math.sin(t * 6) * 0.08;
      FOE_LITE.frame(g, d);       // (past a few steps, each foe's cheap copy)
      if (d < 1.5 && grace <= 0 && canFight(g.roam ? 1 : 2)) {
        grace = 99;     // (no one else jumps you meanwhile; a short breather once it's over, however it ended)
        STORY.run(() => g.roam ? STORY.roamerBattle(g.gi) : STORY.fieldBattle(g.gi)).then(() => { if (grace > 2.5) grace = 2.5; });
      }
    });
    boss.visible = !S.flags.boss && Math.abs(Y.x - boss.position.x) < 110 && Math.abs(Y.z - boss.position.z) < 110;
    if (boss.visible) {
      const bd = Math.hypot(Y.x - boss.position.x, Y.z - boss.position.z);
      boss.rotation.y = dampAngle(boss.rotation.y, Math.atan2(Y.x - boss.position.x, Y.z - boss.position.z), 2, dt);
      if (boss.userData.animate) { boss.userData.mood = bd < 14 ? 'alert' : 'idle'; boss.userData.animate(dt, t, 0); } else boss.scale.y = 1 + Math.sin(t * 2) * 0.03;
      if (S.flags.lessons && Math.hypot(Y.x - boss.position.x, Y.z - boss.position.z) < 6.5 && canFight()) STORY.run(() => STORY.bossScene()); }
    grace -= dt;
  }
  const canFight = (need = 2) => !STORY.busy && !STORY.line && !state.teaching && mode === 'explore' && (state.flags.lessons || 0) >= need;

  // ------------------------------------------------------------ battles: the world pauses, BATTLE draws its own arena
  let mode = 'explore';
  const SFX = { hit: 'hit', perfect: 'perfect', miss: 'whiff', dodge: 'jump', counter: 'perfect', hurt: 'hurt', win: 'fanfare', lose: 'lose', shout: 'shout', 'teach-ok': 'learned', 'teach-wrong': 'wrong', type: 'type',
    // the attack grades (how right the sentence was) and a moth knocked out of the air
    'grade-s': 'chest', 'grade-a': 'review', 'grade-b': 'pip', 'grade-c': 'click', 'grade-d': 'whimper', knockdown: 'poof',
    // the armadillo rolling at you and curling back up, eating, healing, coins
    roll: 'swoosh', rollback: 'pip', eat: 'babble', heal: 'review', coins: 'learned',
    // the frogs: croaking, tongue lashes, splashing you from the water, hopping pads; Mimo unsure which one you meant
    croak: 'pip', tongue: 'swoosh', splash: 'poof', hop: 'jump', which: 'click',
    // Bruno's straw dummies (practice: nothing hurts) and the practice card
    drop: ['land', 9], straw: 'page', swing: 'swoosh', whoosh: 'swoosh', 'dodge-missed': 'wrong', 'round-done': 'review', 'practice-card': 'page', again: 'click', done: 'click',
    // the Corn Society's colonel: stomping out, his squads marching, the husk cape, bounces, popcorn
    stomp: ['land', 13], boss: 'shout', march: 'chug', peel: 'swoosh', cape: 'wood', bounce: 'jump', burst: 'poof', heat: 'swoosh', pop: 'crack', surrender: 'whimper',
    // the Quarry Caves: echo bats screeching, your command echoed back at you, Mimo's song, a bat dizzy from it
    screech: 'screech', echo: 'echo', sing: 'sing', dazed: 'chime',
    // the Bloom Gardens: a picky bee's buzz, Mimo climbing a vine, a bee talked down
    buzz: 'buzz', climb: 'climb', befriend: 'review',
    // the Frost Peaks: Mimo's gust, a snowball packing on snow or losing it
    blow: 'blow', grow: 'grow', shrink: 'shrink' };
  const playSfx = s => { if (Array.isArray(s)) Sound.play(...s); else if (s) Sound.play(s); };
  // a fight's song: the language's boss theme while BATTLE.boss() says a boss fight is on (BATTLE.bossOf(opts) as it starts),
  // else the battle theme ('battle' plays Sound.lang's); the battle theme too if this language has no boss theme. fightSong
  // holds it from the first fade to the last, so the area music can't take over while the screen fades.
  let fightSong = null;
  function battleSong(opts) {
    let boss = null;
    try { boss = typeof BATTLE !== 'undefined' && (opts ? BATTLE.bossOf && BATTLE.bossOf(opts) : BATTLE.boss && BATTLE.boss()); } catch (e) { boss = null; }
    // (P6d, js/boss_music.js) each boss its own theme; an ordinary fight that turns tough (Mimo at 30% of the hearts or less,
    // or 3+ foes standing) switches to the language's boss theme, and frame() keeps it to the end
    if (typeof BOSS_MUSIC !== 'undefined') {
      if (boss) return BOSS_MUSIC.songFor(boss, state.lang) || 'battle';
      return !opts && BOSS_MUSIC.tough() && Sound.songs && Sound.songs.includes('boss_' + state.lang) ? 'boss_' + state.lang : 'battle';
    }
    const name = boss === 'hooded' && Sound.songs && Sound.songs.includes('boss_hooded') ? 'boss_hooded' : 'boss_' + state.lang;     // (the Old Tower's hooded figure: his own theme, oldtower_boss.js)
    return boss && Sound.songs && Sound.songs.includes(name) ? name : 'battle';
  }
  async function fight(opts) {
    if (typeof BATTLE === 'undefined') { UI.toast('Battles are still being built!'); return { outcome: 'flee' }; }
    Sound.play('swoosh'); song = fightSong = battleSong(opts); Sound.setSong(song); Sound.hush = 0;     // no Hush muffle on the battle theme
    await UI.fade(1, 260);
    mode = 'battle'; document.body.classList.add('in-battle');
    const p = BATTLE.start({ renderer, lang: state.lang, foes: opts.foes, place: opts.place || { x: sim.you.x, z: sim.you.z }, tutorial: opts.tutorial, mimoName: state.mimoName,
      practice: opts.practice, focus: opts.focus, coach: opts.coach, boss: opts.boss,       // (Bruno's training yard; the Corn Society's Colonel)
      realm: opts.realm, tb: opts.tb,       // (the time realms: 'past' | 'future', and a realm boss's options: battle/timebattle.js)
      bag: Object.assign({}, state.bag || {}), items: typeof SHOP !== 'undefined' && SHOP.ITEMS ? SHOP.ITEMS : undefined,      // food heals in battle («¡come la manzana!»)
      onEvent: e => playSfx(SFX[e.type]) });
    await UI.fade(0, 260);
    const r = await p;
    // coins earned (more for better grades), and the food Mimo ate
    if (r && r.stats) {
      if (r.stats.coins && r.outcome !== 'flee') state.coins = (state.coins || 0) + r.stats.coins;     // (your good sentences count even if you lose; running away doesn't pay)
      for (const [id, n] of Object.entries(r.stats.used || {})) { state.bag[id] = Math.max(0, (state.bag[id] || 0) - n); if (!state.bag[id]) delete state.bag[id]; }
    }
    await UI.fade(1, 260);
    mode = 'explore'; document.body.classList.remove('in-battle'); song = fightSong = null; grace = 2.5;
    resize();
    await UI.fade(0, 320);
    save();
    return r || { outcome: 'flee' };
  }
  // Cutaways: a short scene somewhere else (the old tower), drawn by INTERLUDE. Leaves the screen
  // faded to black at the end; the caller fades back in.
  // o.onPause: for beats that stop partway (the train journey stops so you can read Noa's letters)
  async function cutaway(beat, captions, o = {}) {
    if (typeof INTERLUDE === 'undefined' || !INTERLUDE.play) return;
    await UI.fade(1, 500);
    mode = 'cutaway'; document.body.classList.add('in-battle');
    const tune = beat !== 'journey' && Sound.songs && Sound.songs.includes('oldtower') ? 'oldtower' : 'title';     // (the old tower's own theme for its scenes; the train ride keeps the title's)
    Sound.setSong(tune); song = tune;
    let p;
    try { p = INTERLUDE.play({ renderer, beat, captions: captions || undefined, onPause: o.onPause }); } catch (e) { console.error(e); }
    await UI.fade(0, 500);
    try { await p; } catch (e) { console.error(e); }
    await UI.fade(1, 500);
    mode = 'explore'; document.body.classList.remove('in-battle'); song = state.flags.hatched || tune !== 'title' ? null : 'title'; resize();     // (null: the frame picks the place's song again)
  }

  // ------------------------------------------------------------ the camera: free orbit that drifts behind you; cutscenes can take over
  const v3c = new THREE.Vector3(), v3d = new THREE.Vector3();
  // (cutscene moves turn the view by yaw and pitch: { yaw, pitch } of a look from p toward l)
  const smooth01 = u => u * u * (3 - 2 * u);
  const aimOf = (p, l) => { const dx = l.x - p.x, dy = l.y - p.y, dz = l.z - p.z, h = Math.hypot(dx, dz); return { yaw: Math.atan2(dx, dz), pitch: Math.atan2(dy, h || 1e-6) }; };
  const blendAim = (a, b, u) => ({ yaw: a.yaw + angDiff(a.yaw, b.yaw) * u, pitch: a.pitch + (b.pitch - a.pitch) * u });
  const aimCamera = a => { const c = Math.cos(a.pitch); camera.lookAt(v3d.set(camera.position.x + Math.sin(a.yaw) * c, camera.position.y + Math.sin(a.pitch), camera.position.z + Math.cos(a.yaw) * c)); };
  // Things the camera shouldn't end up behind or inside: every town's buildings (and the station house,
  // and the train when it's in), as boxes with a height. The camera slides in toward you when one gets
  // between you (a spring arm), then eases back out.
  const CAM_BLOCK = (() => {
    const list = [], TALL = { tower: 16, mill: 16, lighthouse: 12 };
    const add = (b, h) => { if (b && b.w && b.d) list.push({ x: b.x, z: b.z, hw: b.w / 2 + 0.3, hd: b.d / 2 + 0.3, c: Math.cos(b.rot || 0), s: Math.sin(b.rot || 0), y0: WORLD.terrainAt(b.x, b.z) - 0.5, h, r: Math.hypot(b.w, b.d) / 2 + 0.3 }); };
    [typeof TOWN !== 'undefined' && TOWN.layout, typeof MOLINAR !== 'undefined' && MOLINAR.layout, typeof LAKE !== 'undefined' && LAKE.layout, typeof CEMETERY !== 'undefined' && CEMETERY.layout,
      typeof CAVES !== 'undefined' && CAVES.layout,           // (the miners' camp's cabins)
      typeof GARDENS !== 'undefined' && GARDENS.layout,       // (the Bloom Gardens' cottages and greenhouses)
      typeof PEAKS !== 'undefined' && PEAKS.layout,           // (Escarcha's chalets)
      typeof PORT !== 'undefined' && PORT.layout,             // (Port Brisa's houses and walls)
      typeof MARSH !== 'undefined' && MARSH.layout,           // (Candil's stilt huts, the drowned chapel)
      typeof RUINS !== 'undefined' && RUINS.layout]           // (the dig camp's tents and canopy, the temple's top)
      .forEach(Lx => { if (Lx && Lx.buildings) Lx.buildings.forEach(b => add(b, TALL[b.kind] || (b.floors || 1) * 3 + 3)); });
    const SH = WORLD.L.stationHouse; add({ x: SH.x, z: SH.z, w: SH.w, d: SH.d }, 5.4);
    const GMl = typeof MOLINAR !== 'undefined' && MOLINAR.layout && MOLINAR.layout.greatMill;     // the Great Mill's tower
    if (GMl) add({ x: GMl.x, z: GMl.z, w: GMl.half * 1.6, d: GMl.half * 1.6, rot: 0 }, 18);
    const LH = typeof LAKE !== 'undefined' && LAKE.layout.island;      // the old lighthouse, out on its island
    if (LH) add({ x: LH.x, z: LH.z, w: 3.4, d: 3.4, rot: 0 }, 10.5);
    return list;
  })();
  // The Old Tower's crag (DESIGN.md 17.8): oldtower.js's stair, landing and ring of solids lead you in among its big rocks, so they
  // keep the camera out as the buildings do. Each rock is a unit dodecahedron under a matrix (interlude.js buildTower's userData.crag);
  // the arm tests against the ball round it, a little past its corners and ink.
  const ROCK_R = 1.1, _ra = new THREE.Vector3(), _rb = new THREE.Vector3();
  const CAM_ROCKS = (() => {
    const list = [], ms = tower.userData && tower.userData.crag;
    if (!ms) return list;
    tower.updateMatrixWorld(true);
    for (const m of ms) { const W = tower.matrixWorld.clone().multiply(m), c = new THREE.Vector3().setFromMatrixPosition(W); list.push({ inv: W.clone().invert(), x: c.x, z: c.z, r: W.getMaxScaleOnAxis() * ROCK_R }); }
    return list;
  })();
  // the building the camera ends up inside (backed up against a wall, the arm can't keep it out): its walls vanish by themselves
  // (seen from inside), and toonkit.js camCut makes the rest of it go too, windows, frames, shutters, doors and awnings (playtest 4)
  function camInside() {
    if (!TK.camCut) return;
    const c = camera.position; let hit = null;
    if ((!indoors() || (typeof PAST !== 'undefined' && PAST.inside) || (typeof TIME !== 'undefined' && TIME.inside)) && !titleOn) for (const b of CAM_BLOCK) {     // (the Past is Alba itself: its houses hide round the camera too; so is any world time.js dresses)
      if (Math.abs(c.x - b.x) > b.r || Math.abs(c.z - b.z) > b.r || c.y < b.y0 || c.y > b.y0 + b.h) continue;
      const ox = (c.x - b.x) * b.c - (c.z - b.z) * b.s, oz = (c.x - b.x) * b.s + (c.z - b.z) * b.c;
      if (Math.abs(ox) < b.hw - 0.2 && Math.abs(oz) < b.hd - 0.2) { hit = b; break; }
    }
    if (hit !== TK.camCut.on) TK.camCut.set(hit);
  }
  // how far along from the target (0) to the camera (1) the first blocker is (1: nothing in the way)
  function camHit(tx, ty, tz, x, y, z) {
    let best = 1;
    const dx = x - tx, dy = y - ty, dz = z - tz, reach = Math.hypot(dx, dz) + 2;
    const test = b => {
      if (Math.abs(b.x - tx) > reach + b.r || Math.abs(b.z - tz) > reach + b.r) return;
      const ox = (tx - b.x) * b.c - (tz - b.z) * b.s, oz = (tx - b.x) * b.s + (tz - b.z) * b.c;
      const ddx = dx * b.c - dz * b.s, ddz = dx * b.s + dz * b.c;
      let t0 = 0, t1 = best;
      for (const [o, d, lo, hi] of [[ox, ddx, -b.hw, b.hw], [oz, ddz, -b.hd, b.hd], [ty, dy, b.y0, b.y0 + b.h]]) {
        if (Math.abs(d) < 1e-6) { if (o < lo || o > hi) return; continue; }
        const a = (lo - o) / d, c = (hi - o) / d;
        t0 = Math.max(t0, Math.min(a, c)); t1 = Math.min(t1, Math.max(a, c));
        if (t0 > t1) return;
      }
      if (t0 > 0.02) best = Math.min(best, t0);     // (from inside a box, e.g. a doorway: ignore it)
    };
    CAM_BLOCK.forEach(test);
    if (w3d.train.blockers) w3d.train.blockers().forEach(test);
    // the crag's rocks: the segment against each one's ball, in the rock's own space (where it's a unit dodecahedron)
    for (const b of CAM_ROCKS) {
      if (Math.abs(b.x - tx) > reach + b.r || Math.abs(b.z - tz) > reach + b.r) continue;
      const A = _ra.set(tx, ty, tz).applyMatrix4(b.inv), D = _rb.set(x, y, z).applyMatrix4(b.inv).sub(A);
      const qa = D.dot(D), qb = 2 * A.dot(D), qc = A.dot(A) - ROCK_R * ROCK_R;
      if (qc <= 0 || qa < 1e-9) continue;          // (you're inside its ball: as a doorway, ignore it)
      const disc = qb * qb - 4 * qa * qc; if (disc < 0) continue;
      const t0 = (-qb - Math.sqrt(disc)) / (2 * qa);
      if (t0 > 0.02 && t0 < best) best = t0;
    }
    return best;
  }
  const cam = {
    yaw: Math.PI, pitch: 0.28, dist: 8.5, tx: 2, ty: 1.5, tz: 61, idle: 9, override: null, arm: 1,
    basis() { return { fx: Math.sin(this.yaw), fz: Math.cos(this.yaw), rx: -Math.cos(this.yaw), rz: Math.sin(this.yaw) }; },
    snap(yaw, pitch, dist) { this.yaw = yaw; this.pitch = pitch; this.dist = dist; this.tx = sim.you.x; this.tz = sim.you.z; this.ty = sim.you.ry + 1.35; this._rel = null; },
    // Cutscene shots: cam.override = { pos, look, dur?, back? }. From wherever the camera is, an eased move to the shot
    // over `dur` seconds (0.8 by default), the view turning by yaw and pitch (sliding a look-at point past the camera
    // flipped it: the "glitch" in Rosa's pan to the tower); when the shot ends, an eased glide back to the play camera over
    // `back` seconds (1.0; a scene that wants a cut sets cam.back = 0). The override's pos/look can move while it plays.
    update(dt, inp) {
      const Y = sim.you;
      if (this.override) {
        const o = this.override;
        if (!this._shot || this._shot.o !== o) this._shot = { o, t: 0, p0: camera.position.clone(), a0: aimOf(camera.position, camera.getWorldDirection(v3c).add(camera.position)) };
        const S = this._shot; S.t += dt;
        const u = smooth01(Math.min(1, S.t / (o.dur || 0.8)));
        camera.position.lerpVectors(S.p0, o.pos, u);
        aimCamera(blendAim(S.a0, aimOf(o.pos, o.look), u));
        this.back = o.back !== undefined ? o.back : 1.0; this._look = null;
        return;
      }
      if (this._shot) {        // a shot just ended: glide back from where it left the camera (a cut if back is 0)
        this._rel = this.back > 0 ? { t: 0, dur: this.back, p0: camera.position.clone(), a0: aimOf(camera.position, camera.getWorldDirection(v3c).add(camera.position)) } : null;
        this._shot = null;
      }
      if (inp.camX || inp.camY) this.idle = 0; else this.idle += dt;
      this.yaw -= inp.camX * 0.006;
      this.pitch = clamp(this.pitch + inp.camY * 0.004, 0.04, 1.15);
      this.dist = clamp(this.dist * (1 + inp.zoom * 0.09), 4.5, 16);
      if (this.idle > 1.6 && Y.speed > 2 && Math.abs(angDiff(this.yaw, Y.yaw)) < 2.3) this.yaw = dampAngle(this.yaw, Y.yaw, 0.9, dt);
      this.tx = damp(this.tx, Y.x, 9, dt); this.tz = damp(this.tz, Y.z, 9, dt); this.ty = damp(this.ty, Y.ry + 1.35, 5, dt);
      const cp = Math.cos(this.pitch);
      let x = this.tx - Math.sin(this.yaw) * this.dist * cp, z = this.tz - Math.cos(this.yaw) * this.dist * cp, y = this.ty + Math.sin(this.pitch) * this.dist;
      y = Math.max(y, WORLD.terrainAt(x, z) + 0.8);
      if (typeof TIME !== 'undefined' && TIME.landTop) y = Math.max(y, TIME.landTop(x, z) + 0.8);     // (and over another world's dunes and drifts, time_land.js)
      // the spring arm: slide in (at once) when something's in the way, ease back out when it clears
      const len = Math.hypot(x - this.tx, y - this.ty, z - this.tz), hit = camHit(this.tx, this.ty, this.tz, x, y, z);
      const want = hit < 1 ? Math.min(1, Math.max(1.4 / len, hit - 0.35 / len)) : 1;
      this.arm = want < this.arm ? want : damp(this.arm, want, 2.5, dt);
      if (this.arm < 0.999) {
        x = this.tx + (x - this.tx) * this.arm; y = this.ty + (y - this.ty) * this.arm; z = this.tz + (z - this.tz) * this.arm;
        y = Math.max(y, WORLD.terrainAt(x, z) + 0.6);
        if (typeof TIME !== 'undefined' && TIME.landTop) y = Math.max(y, TIME.landTop(x, z) + 0.6);
      }
      if (this._rel && this.back > 0) {     // the glide back after a cutscene (you can already move; it follows)
        const R = this._rel; R.t += dt;
        const u = smooth01(Math.min(1, R.t / R.dur));
        camera.position.lerpVectors(R.p0, v3c.set(x, y, z), u);
        aimCamera(blendAim(R.a0, aimOf(camera.position, v3d.set(this.tx, this.ty, this.tz)), u));
        if (u >= 1) this._rel = null;
        return;
      }
      this._rel = null;
      camera.position.set(x, y, z); camera.lookAt(this.tx, this.ty, this.tz);
    },
  };

  // ------------------------------------------------------------ game state and saves
  // Three save slots (lrpg.slot.1–3). The save from before slots existed moves into slot 1.
  // Tests (?skip=1) save to slot 9, which the title screen never shows.
  const SLOTS = 3, OLD_KEY = 'lrpg.slice.v1', slotKey = n => 'lrpg.slot.' + n;
  let slot = 1;
  const loadSlot = n => { try { return JSON.parse(localStorage.getItem(slotKey(n))); } catch (e) { return null; } };
  (function migrate() { try { const old = localStorage.getItem(OLD_KEY); if (old) { if (!localStorage.getItem(slotKey(1))) localStorage.setItem(slotKey(1), old); localStorage.removeItem(OLD_KEY); } } catch (e) { /* storage blocked */ } })();
  const fresh = () => ({ lang: 'es', mimoName: 'Mimo', flags: {}, pages: [], picked: [], pickedRing: [], cleared: [], time: 0, teaching: false, track: 'main', qlog: {}, coins: 0, bag: {} });
  let state = fresh();
  const game = { sim, w3d, cast, cam, get state() { return state; }, prompt: null, journalOpen: false, save, fight, cutaway,
    hasCutaway: beat => typeof INTERLUDE !== 'undefined' && (INTERLUDE.beats ? INTERLUDE.beats.includes(beat) : beat !== 'journey'),
    fx: { hush: 0, birds: null },          // scenes can push the Hush effect and the birdsong
    showAmbush, town, molinar, lake, corn, cemetery: cem, townlife, minigames, domino, phonk, adolf, romance, cards, newyear, muertos, matsuri, carnaval, weihnacht, lucha, familia, shogi, doener, caves, gardens, peaks, port, marsh, roamerBeaten, pushBoulder,
    boulderAway() { boulder.place(boulder.rest.x, boulder.rest.z); },
    // after losing in town: you wake up next to Rosa's stall
    respawn() { const [rx, rz] = P.rosa; sim.you.x = rx + 2; sim.you.z = rz + 2.5; sim.you.yaw = Math.PI; sim.mimo.x = rx + 3; sim.mimo.z = rz + 3.2; sim.snap(); cam.snap(Math.PI, 0.28, 8.5); grace = 3; } };
  function save() {
    if (!state.flags.hatched) return;
    const Y = sim.you, room = indoorMod(), at = room && room.OUTSIDE ? room.OUTSIDE : { x: Y.x, z: Y.z, yaw: Y.yaw };      // (saved indoors: you'll be at its door)
    try { localStorage.setItem(slotKey(slot), JSON.stringify({ v: 1, savedAt: Date.now(), state: Object.assign({}, state, { teaching: false }), you: { x: at.x, z: at.z, yaw: at.yaw }, lex: LEX.toJSON(), chest: chest.open })); } catch (e) { /* storage blocked */ }
    UI.savedChip();
  }
  // What the title screen shows for a save: the language, Mimo's name, where you are, words, time.
  function slotInfo(n) { return infoOf(loadSlot(n), n); }
  function infoOf(d, n) {
    if (!d || !d.state) return null;
    const st = d.state, f = st.flags || {}, cleared = (st.cleared || []).length;
    const tw = st.worlds && st.worlds.world, twR = { alba: 'Alba' }[st.worlds && st.worlds.region] || (st.worlds && st.worlds.region) || 'Alba';     // (time.js: the world the save is in)
    const where = f.futureDone ? (tw === 'past' ? `The Past: ${twR}, long ago` : tw === 'future' ? `The Future: ${twR}, tomorrow` : 'After Chapter 3: the time cracks are open')
      : f.futureIn ? 'The Future: Alba, if nobody speaks up'
      : f.pastDone ? 'The Past: through the Future’s door' : f.pastIn ? 'The Past: Alba, long ago' : f.towerLost ? 'The Old Tower: the tear into the Past' : f.oldDoor ? 'The Old Tower'
      : f.luceroEighth ? 'The Gray Marsh: on to the Old Tower' : f.marshFree ? 'The Gray Marsh: report to Lucero' : f.chapelOpen ? 'The Gray Marsh: the drowned chapel' : f.marshLantern ? 'The Gray Marsh: the causeway' : f.candil ? 'The Gray Marsh: Candil' : f.marsh ? 'The Gray Marsh' : f.portSixth ? 'Port Brisa: the big ship south' : f.portFree ? 'Port Brisa: report to Dora' : f.fortLanded ? 'Port Brisa: the sea fort' : f.ticket ? 'Port Brisa: call the fort boat' : f.dora ? 'Port Brisa: the sailors' : f.portGate ? 'Port Brisa' : f.portRoad ? 'The Brisa Road' : f.peaksFree ? 'On to Port Brisa' :f.towerOpen ? 'The Frost Peaks: the Ice Clock Tower' : f.tobias ? 'The Frost Peaks: Escarcha’s clocks' : f.peaks ? 'The Frost Peaks' : f.gardensFree ? 'On to the Frost Peaks' : f.greenOpen ? 'The Bloom Gardens: the great greenhouse' : f.melisa ? 'The Bloom Gardens: the flower show' : f.gardens ? 'The Bloom Gardens'
      : f.caveFree ? 'On to the Bloom Gardens' : f.mineOpen ? 'The Quarry Caves: down the mine' : f.camp ? 'The Quarry Caves: the miners’ camp'
      : f.lakeFree ? 'North, to the Quarry Caves' : f.isleLanded ? 'The lighthouse on the Mirror Lake' : f.bartolo ? 'Remanso: the ferry to the island' : f.bartoloQuest ? 'Remanso: Bartolo’s lost things'
      : f.marina ? 'Remanso, on the Mirror Lake' : f.remanso ? 'Remanso: find Marina' : f.millFree ? 'West, to the Mirror Lake'
      : f.ciro ? 'Molinar: the Great Mill' : f.molinar ? 'Molinar, the town of mills' : f.boulder ? 'The Windmill Hills' : f.ch1 ? 'East, to the Windmill Hills'
      : f.boss ? 'Alba, after the hill' : (f.lessons || 0) >= 2 ? (cleared >= 3 ? 'The big one on the hill' : `The field east of Alba (${cleared}/3)`)
      : f.rosa ? 'Alba: find Bruno by the bell tower' : f.z_exit ? 'Arriving in Alba' : 'The Quiet Forest';
    const S = (d.lex && d.lex.S && d.lex.S[st.lang]) || {}, words = Object.values(S).filter(s => s.stage >= 2).length;
    const min = Math.round((st.time || 0) / 60), time = min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;
    const when = d.savedAt ? new Date(d.savedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
    return { n, lang: st.lang, script: st.script, name: st.mimoName || 'Mimo', where, words, time, when, savedAt: d.savedAt || 0 };
  }
  // Save files (the title's Load game: ⬇ / ⬆). Saves live in this browser's storage; a file copy backs one up or carries it to another
  // computer or to the online copy. The file: { game: 'The Hush', file: 'save', v: 1, exportedAt, save: <the slot's JSON> }
  const SAVE_LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  function exportSlot(n) {
    try {
      const raw = localStorage.getItem(slotKey(n)); if (!raw) return null;
      const d = JSON.parse(raw), i = infoOf(d, n) || {};
      const blob = new Blob([JSON.stringify({ game: 'The Hush', file: 'save', v: 1, exportedAt: new Date().toISOString(), save: d })], { type: 'application/json' });
      const name = `the-hush-save-${n}-${i.lang || 'xx'}-${new Date().toISOString().slice(0, 10)}.json`;
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      return name;
    } catch (e) { console.error('[saves] export', e); return null; }
  }
  function readSave(text) {
    const no = { ok: false, why: 'That file isn’t a save from The Hush.' };
    let d; try { d = JSON.parse(text); } catch (e) { return no; }
    if (d && d.file === 'save' && d.save) d = d.save;
    const st = d && d.state;
    if (!st || typeof st !== 'object' || !SAVE_LANGS.includes(st.lang) || !st.flags || typeof st.flags !== 'object') return no;
    return { ok: true, data: d, info: infoOf(d, 0) };
  }
  function importSlot(n, d) {
    if (!(n >= 1 && n <= SLOTS) || !d || !d.state) return null;
    try { localStorage.setItem(slotKey(n), JSON.stringify(d)); } catch (e) { console.error('[saves] import', e); return null; }
    return slotInfo(n);
  }
  // Save, then back to the title screen (to switch saves).
  function quitToTitle() { save(); try { Sound.fadeOut(0.35); } catch (e) { /* (no audio) */ } setTimeout(() => { location.href = location.pathname; }, 380); }     // (the music fades out instead of being cut off mid-note, P6d)
  // Saving by hand (P, Ctrl+S or the journal's Save): the game also saves itself after every big moment; either way a
  // little "Saved" chip shows in the corner, so you can see it happen
  function saveNow() {
    if (!state.flags.hatched) { UI.toast('You can save once Mimo has hatched.'); return; }
    save();
    UI.toast(`Saved · slot ${slot > SLOTS ? 'test' : slot} · ${new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`);
  }
  UI.onSaveNow = saveNow;
  function applyLang(l) { state.lang = l; LEX.lang = l; UI.lang = l; Sound.lang = l; w3d.drawSign(SIGN[l]); }    // (Sound.lang: the battle theme fits the language)
  // zh / ja (CJK.md): the mode lives in state.script; the station sign takes plain text in it (never Spanish, never brackets)
  if (typeof CJK !== 'undefined') { CJK.bind(game); const ds = w3d.drawSign; w3d.drawSign = t => ds(CJK.isCJK(state.lang) ? CJK.text(t === undefined ? SIGN : { [state.lang]: t }, state.lang, 'Last stop') : t); }
  STORY.init(game); QUESTS.init(game);
  const inMill = () => typeof MILL !== 'undefined' && MILL.inside;
  // Indoors anywhere: the Great Mill, a house (interiors.js), the Corn Society's hall (cornmaze.js). Each
  // has `inside`, `OUTSIDE` (the spot to save while in there), `interactables()` and `update(dt, t)`.
  const ROOMS = [typeof MILL !== 'undefined' && MILL, typeof INTERIORS !== 'undefined' && INTERIORS, typeof CORN !== 'undefined' && CORN,
    typeof ROMANCE !== 'undefined' && ROMANCE.OUTSIDE && ROMANCE,
    typeof ISLE !== 'undefined' && ISLE, typeof MINE !== 'undefined' && MINE, typeof GREENHOUSE !== 'undefined' && GREENHOUSE,
    typeof ICETOWER !== 'undefined' && ICETOWER,
    typeof PORTFORT !== 'undefined' && PORTFORT,             // (port_fort.js: Port Brisa's sea fort)
    typeof CHAPEL_D !== 'undefined' && CHAPEL_D,             // (marsh_chapel.js: the Gray Marsh's drowned chapel)
    typeof RUINS_TEMPLE !== 'undefined' && RUINS_TEMPLE,     // (ruins_temple.js: the Sunken Ruins' temple, four halls down)
    typeof OLDTOWER !== 'undefined' && OLDTOWER,             // (oldtower.js: the Old Tower's nine floors)
    typeof APSTAGE !== 'undefined' && APSTAGE,               // (alba_past_stage.js: under the old theater's stage long ago, and two homes of then; before PAST)
    typeof MPMILL !== 'undefined' && MPMILL,                 // (molinar_past_mill.js: the Great Mill being built, Molinar long ago; before PAST, FUTURE and TIME)
    typeof MFMILL !== 'undefined' && MFMILL,                 // (molinar_future_mill.js: the silent Great Mill, Molinar tomorrow; before PAST, FUTURE and TIME)
    typeof ALBA_FUT_HALL !== 'undefined' && ALBA_FUT_HALL,   // (alba_future_hall.js: the old theater tomorrow, the bakery and the new library; before PAST, FUTURE and TIME)
    typeof QPDEEP !== 'undefined' && QPDEEP,                 // (quarry_past_dungeon.js: the old deep gallery, the Quarry Caves long ago; before PAST, FUTURE and TIME)
    typeof QFDEEP !== 'undefined' && QFDEEP,                 // (quarry_future_dungeon.js: the collapsed deep mine, the Quarry Caves tomorrow; before PAST, FUTURE and TIME)
    typeof LK_PGROT !== 'undefined' && LK_PGROT,             // (lake_past_dungeon.js: the frogs' grotto, the Mirror Lake long ago; before PAST, FUTURE and TIME)
    typeof LK_FGROT !== 'undefined' && LK_FGROT,             // (lake_future_dungeon.js: the drowned grotto, the Mirror Lake tomorrow; before PAST, FUTURE and TIME)
    typeof GD_PHOUSE !== 'undefined' && GD_PHOUSE,           // (gardens_past_dungeon.js: the new greenhouse inside, the Bloom Gardens long ago; before PAST, FUTURE and TIME)
    typeof GD_FHOUSE !== 'undefined' && GD_FHOUSE,           // (gardens_future_dungeon.js: the greenhouse tomorrow, the Bloom Gardens tomorrow; before PAST, FUTURE and TIME)
    typeof PK_PCAVE !== 'undefined' && PK_PCAVE,             // (peaks_past_dungeon.js: the White Hollow, the Frost Peaks long ago; before PAST, FUTURE and TIME)
    typeof PK_FTOWER !== 'undefined' && PK_FTOWER,           // (peaks_future_dungeon.js: the Ice Clock Tower tomorrow, the Frost Peaks tomorrow; before PAST, FUTURE and TIME)
    typeof PT_PSHIP !== 'undefined' && PT_PSHIP,             // (port_past_dungeon.js: aboard La Golondrina, Port Brisa long ago; before PAST, FUTURE and TIME)
    typeof PT_FOFFICE !== 'undefined' && PT_FOFFICE,         // (port_future_dungeon.js: the harbor office tomorrow, Port Brisa tomorrow; before PAST, FUTURE and TIME)
    typeof RU_PTEMPLE !== 'undefined' && RU_PTEMPLE,         // (ruins_past_dungeon.js: the temple the day it was first opened, the Sunken Ruins long ago; before PAST, FUTURE and TIME)
    typeof RU_FTEMPLE !== 'undefined' && RU_FTEMPLE,         // (ruins_future_dungeon.js: the sunken temple half underwater, the Sunken Ruins tomorrow; before PAST, FUTURE and TIME)
    typeof MH_PHOUSE !== 'undefined' && MH_PHOUSE,           // (marsh_past_dungeon.js: the Lantern House, Candil long ago; before PAST, FUTURE and TIME)
    typeof MH_FCHAPEL !== 'undefined' && MH_FCHAPEL,         // (marsh_future_dungeon.js: the Stone Chapel, the Gray Marsh tomorrow; before PAST, FUTURE and TIME)
    typeof FINSTAGE !== 'undefined' && FINSTAGE,             // (finale_stage.js: the old theater's stage in all three times at once, Chapter 4's finale)
    typeof FBREALM !== 'undefined' && FBREALM,               // (fb_realm.js: inside the Hush, the final battle's trials and its heart, FB1)
    typeof MER !== 'undefined' && MER,                       // (js/ch5/mer_city.js: Meridiana, Chapter 5: the city's districts, a layer of its own at y 600)
    typeof PAST !== 'undefined' && PAST,               // (past.js: the Past, Alba re-dressed as long ago; a room in this sense)
    typeof FUTURE !== 'undefined' && FUTURE,                 // (future.js: the Future, Alba re-dressed as tomorrow; a room in this sense)
    typeof TIME !== 'undefined' && TIME,                     // (time.js: another world of a region with no room of its own; after PAST and FUTURE, and a world's dungeons go before all three)
    typeof SCHOOL !== 'undefined' && SCHOOL,
    typeof ANIME !== 'undefined' && ANIME,
    typeof GRANDMA !== 'undefined' && GRANDMA, typeof KUNGFU !== 'undefined' && KUNGFU, typeof LUCHA !== 'undefined' && LUCHA, typeof DOENER !== 'undefined' && DOENER,
    typeof ACADEMY !== 'undefined' && ACADEMY,               // (js/exam/academy.js: the Academy of Alba's exam hall, house 8, every language with exams)
    // (js/life/townhall.js: Alba's town hall and post office, house 11, every language with LIFE content)
    typeof TOWNHALL !== 'undefined' && TOWNHALL,
    typeof LIBRARY !== 'undefined' && LIBRARY].filter(Boolean);       // (js/read/library.js: Alba's library, house 12, in every language with books)       // (doener.js: the Yıldız Grill, de; romance.js: Morgana's attic, a room like the corn hall; isle.js: the old lighthouse; mine.js: the Quarry Caves' mine; icetower.js: the Frost Peaks' Ice Clock Tower; school.js: the script school, zh / ja; anime.js: Otoha and Susumu's house, ja; grandma.js: Grandma Mei's restaurant, every language; kungfu.js: her courtyard, zh)
  const inIsle = () => typeof ISLE !== 'undefined' && ISLE.inside;
  const inMine = () => typeof MINE !== 'undefined' && MINE.inside;
  const inGreen = () => typeof GREENHOUSE !== 'undefined' && GREENHOUSE.inside;      // (gardens.js's dungeon: the great greenhouse)
  const inIce = () => typeof ICETOWER !== 'undefined' && ICETOWER.inside;           // (peaks.js's dungeon: the Ice Clock Tower)
  const indoorMod = () => ROOMS.find(m => m.inside) || null;
  const indoors = () => !!indoorMod();
  game.indoorMod = indoorMod; game.indoors = indoors;
  if (typeof MILL !== 'undefined') MILL.init(game);
  if (typeof ISLE !== 'undefined' && ISLE.init) { try { ISLE.init(game); } catch (e) { console.error('[isle]', e); } }     // (the lake's milestone 2: Bartolo, the ferry, the lighthouse, the second bell)
  if (typeof INTERIORS !== 'undefined' && INTERIORS.init) { try { INTERIORS.init(game); } catch (e) { console.error('[interiors]', e); } }
  if (typeof CORN !== 'undefined' && CORN.init) { try { CORN.init(game); } catch (e) { console.error('[corn]', e); } }
  if (typeof CEMETERY !== 'undefined' && CEMETERY.init) { try { CEMETERY.init(game); } catch (e) { console.error('[cemetery]', e); } }
  // (town life, the minigames and the three language characters: their words, phrases, lines and quests)
  for (const [M, tag] of [[typeof TOWNLIFE !== 'undefined' && TOWNLIFE, 'townlife'], [typeof MINIGAMES !== 'undefined' && MINIGAMES, 'minigames'],
    [typeof DOMINO !== 'undefined' && DOMINO, 'domino'], [typeof PHONK !== 'undefined' && PHONK, 'phonk'], [typeof ADOLF !== 'undefined' && ADOLF, 'adolf'],
    [typeof SIGNS !== 'undefined' && SIGNS, 'signs'], [typeof ROMANCE !== 'undefined' && ROMANCE, 'romance'],
    [typeof CARDS !== 'undefined' && CARDS, 'cards'], [typeof NEWYEAR !== 'undefined' && NEWYEAR, 'newyear'], [typeof MUERTOS !== 'undefined' && MUERTOS, 'muertos'], [typeof MATSURI !== 'undefined' && MATSURI, 'matsuri'], [typeof CARNAVAL !== 'undefined' && CARNAVAL, 'carnaval'], [typeof WEIHNACHT !== 'undefined' && WEIHNACHT, 'weihnacht'], [typeof LUCHA !== 'undefined' && LUCHA, 'lucha'], [typeof FAMILIA !== 'undefined' && FAMILIA, 'familia'], [typeof SHOGI !== 'undefined' && SHOGI, 'shogi'], [typeof DOENER !== 'undefined' && DOENER, 'doener']])
    if (M && M.init) { try { M.init(game); } catch (e) { console.error('[' + tag + ']', e); } }
  // Region 3, the Quarry Caves (caves.js: Cande, the miners, Pío, the mine's mouth; mine.js: the mine itself)
  if (typeof CAVES !== 'undefined' && CAVES.init) { try { CAVES.init(game); } catch (e) { console.error('[caves]', e); } }
  if (typeof MINE !== 'undefined' && MINE.init) { try { MINE.init(game); } catch (e) { console.error('[mine]', e); } }
  // Region 4, the Bloom Gardens (gardens.js: Flora and the gate, Melisa, the flower show; greenhouse.js: the great greenhouse)
  if (typeof GARDENS !== 'undefined' && GARDENS.init) { try { GARDENS.init(game); } catch (e) { console.error('[gardens]', e); } }
  if (typeof GREENHOUSE !== 'undefined' && GREENHOUSE.init) { try { GREENHOUSE.init(game); } catch (e) { console.error('[greenhouse]', e); } }
  // Region 5, the Frost Peaks (peaks.js: Lía, the snowdrift, Tobías, Escarcha's clocks; icetower.js: the Ice Clock Tower)
  if (typeof PEAKS !== 'undefined' && PEAKS.init) { try { PEAKS.init(game); } catch (e) { console.error('[peaks]', e); } }
  if (typeof ICETOWER !== 'undefined' && ICETOWER.init) { try { ICETOWER.init(game); } catch (e) { console.error('[icetower]', e); } }
  // Region 6, Port Brisa (port_play.js: Marino and the drawbridge, Dora, the sailors, the ticket, the fort boat; port_fort.js: the sea fort)
  if (typeof PORT !== 'undefined' && PORT.init) { try { PORT.init(game); } catch (e) { console.error('[port]', e); } }
  if (typeof PORTFORT !== 'undefined' && PORTFORT.init) { try { PORTFORT.init(game); } catch (e) { console.error('[portfort]', e); } }
  // Region 8, the Gray Marsh (marsh.js: Lucero, the fog, the boardwalk, Candil, the lanterns; marsh_chapel.js: the drowned chapel)
  if (typeof MARSH !== 'undefined' && MARSH.init) { try { MARSH.init(game); } catch (e) { console.error('[marsh]', e); } }
  if (typeof CHAPEL_D !== 'undefined' && CHAPEL_D.init) { try { CHAPEL_D.init(game); } catch (e) { console.error('[chapel]', e); } }
  // Region 7, the Sunken Ruins (ruins_scenes.js: the ship, Fermín and the slide, Elvira, the lost things, the Wall of Days, the Door of Days; ruins_temple.js: the temple)
  if (typeof RUINS !== 'undefined' && RUINS.init) { try { RUINS.init(game); } catch (e) { console.error('[ruins]', e); } }
  if (typeof RUINS_TEMPLE !== 'undefined' && RUINS_TEMPLE.init) { try { RUINS_TEMPLE.init(game); } catch (e) { console.error('[ruins temple]', e); } }
  // The Old Tower, the end of Chapter 1 (oldtower.js: the door, the climb; oldtower_boss.js: the top, the hooded figure, the fall)
  if (typeof OLDTOWER !== 'undefined' && OLDTOWER.init) { try { OLDTOWER.init(game); } catch (e) { console.error('[oldtower]', e); } }
  // Chapter 2, the Past (past.js, past_scenes.js: Alba long ago, re-dressed; through the tear in the Old Tower's door)
  if (typeof PAST !== 'undefined' && PAST.init) { try { PAST.init(game); } catch (e) { console.error('[past]', e); } }
  // Chapter 3, the Future (future.js, future_scenes.js: Alba tomorrow, re-dressed; FUTURE.enter() when the Past ends)
  if (typeof FUTURE !== 'undefined' && FUTURE.init) { try { FUTURE.init(game); } catch (e) { console.error('[future]', e); } }
  // the three worlds (time.js: the time cracks, the cross-time effects, each world's rules; time_alba.js: Alba's)
  if (typeof TIME !== 'undefined' && TIME.init) { try { TIME.init(game); } catch (e) { console.error('[time]', e); } }
  // Alba long ago after Chapter 2 (alba_past.js: Chapter 4's opening, the people of then, the rooms under the stage, the Prompter)
  if (typeof ALBA_PAST !== 'undefined' && ALBA_PAST && ALBA_PAST.init) { try { ALBA_PAST.init(game); } catch (e) { console.error('[alba past]', e); } }
  // Chapter 4's finale (finale.js: the tower's door, the rise, the clock at eight; finale_stage.js: the stage; finale_credits.js)
  if (typeof FIN !== 'undefined' && FIN && FIN.init) { try { FIN.init(game); } catch (e) { console.error('[finale]', e); } }
  // the script school (school.js, zh / ja only: Teacher Lin's calligraphy house, Mori-sensei's terakoya)
  if (typeof SCHOOL !== 'undefined' && SCHOOL.init) { try { SCHOOL.init(game); } catch (e) { console.error('[school]', e); } }
  // the anime siblings (anime.js + dance.js, ja only: Otoha's songs, Susumu's facts and his dance machine; ANIME.init inits DANCE)
  if (typeof ANIME !== 'undefined' && ANIME.init) { try { ANIME.init(game); } catch (e) { console.error('[anime]', e); } }
  // Grandma Mei's Chinese restaurant in Alba (grandma.js, every language; zh: her side plot) and her secret courtyard (kungfu.js, zh)
  if (typeof GRANDMA !== 'undefined' && GRANDMA.init) { try { GRANDMA.init(game); } catch (e) { console.error('[grandma]', e); } }
  if (typeof KUNGFU !== 'undefined' && KUNGFU.init) { try { KUNGFU.init(game); } catch (e) { console.error('[kungfu]', e); } }
  // free talk (js/talk/, DESIGN.md 15.3: "Talk freely", small talk, the phone, the journal's level page and People), hidden in a
  // language with no dictionary pack or conversations yet
  for (const [M, tag] of [[typeof TALK !== 'undefined' && TALK, 'talk'], [typeof PHONE !== 'undefined' && PHONE, 'phone'], [typeof METER !== 'undefined' && METER, 'meter']])
    if (M && M.init) { try { M.init(game); } catch (e) { console.error('[' + tag + ']', e); } }
  // reading and listening (js/read/, DESIGN.md 15.4: Alba's library, Noa's diary, the radio, overheard talk), hidden in a language
  // with no dictionary pack or content yet
  if (typeof READ !== 'undefined' && READ.init) { try { READ.init(game); } catch (e) { console.error('[read]', e); } }
  // flashcards from Mimo's words (flashcards.js, P6a: the journal's Flashcards tab and their key, F)
  if (typeof FLASH !== 'undefined' && FLASH.init) { try { FLASH.init(game); } catch (e) { console.error('[flash]', e); } }
  // language tests (js/exam/, DESIGN.md 21.2: the Academy of Alba, the level exams, the letter, the certificates; EXAM.init inits ACADEMY)
  if (typeof EXAM !== 'undefined' && EXAM.init) { try { EXAM.init(game); } catch (e) { console.error('[exam]', e); } }
  // life in Alba (js/life/, D2: the town hall and post office, pen pals, part-time jobs, town debates; LIFE.init inits them all)
  if (typeof LIFE !== 'undefined' && LIFE.init) { try { LIFE.init(game); } catch (e) { console.error('[life]', e); } }
  // the corner mini-map (minimap.js, like Lantern Delve's): reads the world, the towns, the quests and the foes
  game.foeMarks = () => groups.concat(roamers).filter(g => g.root.visible).map(g => ({ x: g.x, z: g.z, alert: g.alert }))
    .concat(boss.visible ? [{ x: boss.position.x, z: boss.position.z, alert: Math.hypot(sim.you.x - boss.position.x, sim.you.z - boss.position.z) < 14 ? 1 : 0 }] : []);
  if (typeof MINIMAP !== 'undefined') { try { MINIMAP.init(game); } catch (e) { console.error('[minimap]', e); } }
  UI.onSay = () => { const L = STORY.line; if (L && L.say && !UI.speak(L.say)) UI.toast('No voice for this language is installed on this PC'); };
  UI.onWrong = () => Sound.play('wrong');
  UI.onJournalClose = () => toggleJournal(false);
  UI.onQuitToTitle = quitToTitle;

  // ------------------------------------------------------------ the loop
  const v3 = new THREE.Vector3();
  function screen(x, y, z) { v3.set(x, y, z).project(camera); return { x: (v3.x * 0.5 + 0.5) * innerWidth, y: (-v3.y * 0.5 + 0.5) * innerHeight, on: v3.z < 1 && Math.abs(v3.x) < 1.15 && Math.abs(v3.y) < 1.15 }; }
  function anchor(who) {
    if (who === 'you' || who === 'hero') return screen(sim.you.x, sim.you.ry + 2.15, sim.you.z);
    if (who === 'mimo') return screen(sim.mimo.x, sim.mimo.ry + 1.4, sim.mimo.z);
    const n = sim.npc(who); if (n) return screen(n.x, n.y + 2.1 * (ACTORS.PRESETS[n.kind].h || 1), n.z);
    return null;
  }
  function toggleJournal(open) { game.journalOpen = open; Input.typing = false; UI.journal(open, state); Sound.play('page'); }
  let song = null, questT = 0, titleOn = false;
  // Everyone's solid: you bump into the townsfolk instead of walking through them. The ones near you get
  // a small round solid each frame (in WORLD.extra), and the story's villagers' solids follow them around.
  const crowd = [];
  function updateCrowd() {
    for (const c of crowd) { const i = WORLD.extra.indexOf(c); if (i >= 0) WORLD.extra.splice(i, 1); }
    crowd.length = 0;
    const Y = sim.you;
    if (!indoors()) for (const grp of [town, molinar, lake, cem, caves, gardens, peaks, port, marsh, ruins]) {
      if (!grp || !grp.people || (grp.group && !grp.group.visible)) continue;
      for (const p of grp.people) if (Math.abs(p.x - Y.x) < 9 && Math.abs(p.z - Y.z) < 9 && !p.swimming && !p.hidden) crowd.push({ x: p.x, z: p.z, r: p.kid || p.kind === 'kid' ? 0.34 : 0.42, person: true });
    }
    // (the modules' people: hidden ones are parked far away or flagged)
    if (!indoors()) for (const grp of MODS) {
      if (!grp || !grp.people) continue;
      for (const p of grp.people) if (!p.hidden && Math.abs(p.x - Y.x) < 9 && Math.abs(p.z - Y.z) < 9) crowd.push({ x: p.x, z: p.z, r: p.r || (p.kid ? 0.34 : 0.42), person: true });
    }
    WORLD.extra.push(...crowd);
    for (const e of WORLD.extra) if (e.npc) { const n = sim.npc(e.npc); if (n) { e.x = n.x; e.z = n.z; } }
  }
  function frame(dt) {
    const inp = Input.read();
    if (mode === 'explore') updateCrowd();
    state.time += dt;
    if (typeof TIME !== 'undefined' && TIME.clock) { try { TIME.clock(dt); } catch (e) { console.error('[time] clock', e); } }     // (play time per language band, DESIGN.md 18.2)
    if (mode === 'battle') {
      BATTLE.update(dt, inp); BATTLE.render();
      if (fightSong === 'battle') { const w = battleSong(); if (w !== 'battle') { song = fightSong = w; Sound.setSong(w); } }     // (a boss fight from here on: never back down to the battle theme)
      return;
    }
    if (mode === 'cutaway') { INTERLUDE.update(dt, inp); INTERLUDE.render(); return; }
    if (inp.save && mode === 'explore' && !titleOn && !state.teaching) saveNow();
    if (inp.journal && state.flags.hatched && !STORY.line && !state.teaching) toggleJournal(!game.journalOpen);
    else if (game.journalOpen && inp.cancel) toggleJournal(false);
    const frozen = game.journalOpen || !!STORY.line || state.teaching || sim.lock > 0 || titleOn;
    sim.update(dt, frozen ? NO_INPUT : inp, cam.basis());
    if (!game.journalOpen) STORY.update(dt, frozen && !STORY.line ? Object.assign({}, NO_INPUT) : inp);
    // the weave walks slowly toward what you've shown you know (lexicon.js tick: at most +0.01 a minute of play)
    if (state.flags.hatched && !titleOn && !game.journalOpen) LEX.tick(dt);
    for (const e of sim.events) {
      switch (e.type) {
        case 'jump': Sound.play('jump'); break;
        case 'land': Sound.play('land', e.hard); w3d.fx.puff(sim.you.x, sim.you.ry, sim.you.z, e.hard > 10 ? 9 : 5, 0.22); break;
        case 'step': if (sim.you.y > WORLD.terrainAt(sim.you.x, sim.you.z) + 0.3 && !(typeof TIME !== 'undefined' && TIME.landAt && TIME.landAt(sim.you.x, sim.you.z))) Sound.play('wood'); else Sound.play('step', e.run, WORLD.mapAt(e.x, e.z, 3) > 0.5, e.wet); if (e.run) w3d.fx.puff(sim.you.x, sim.you.ry, sim.you.z, 1, 0.14); break;     // (on a land's dune or drift, time_land.js: soft steps, not boards)
        case 'mimo-land': Sound.play('pip'); if (e.big) w3d.fx.puff(sim.mimo.x, sim.mimo.ry, sim.mimo.z, 3, 0.12); break;
        case 'mimo-jump': Sound.play('chirp'); break;
        case 'mimo-talk': Sound.play('babble'); break;
        case 'poof': Sound.play('poof'); w3d.fx.puff(sim.mimo.x, sim.mimo.ry, sim.mimo.z, 10, 0.25); break;
        case 'learned': Sound.play('learned'); w3d.fx.sparkle(sim.mimo.x, sim.mimo.ry + 0.8, sim.mimo.z, 18); break;
        case 'reviewed': Sound.play('review'); w3d.fx.sparkle(sim.mimo.x, sim.mimo.ry + 0.8, sim.mimo.z, 8); break;
        case 'rescued': Sound.play('chirp'); w3d.fx.puff(sim.you.x, sim.you.ry, sim.you.z, 8, 0.22); cam.snap(sim.you.yaw, cam.pitch, cam.dist); UI.toast(`You were stuck where nobody can stand, so ${UI.mimoName || 'Mimo'} pulled you back to dry land.`); break;
      }
    }
    sim.events.length = 0;
    cam.update(dt, frozen ? NO_INPUT : inp); camInside();
    const Y = sim.you, M = sim.mimo;
    w3d.update(dt, { x: Y.x, y: Y.ry, z: Y.z }, cam, new THREE.Vector3(M.x, M.ry, M.z));
    const t = w3d.time.value;
    ACTORS.animateHero(cast.hero, Y, dt, t);
    if (!M.hidden) ACTORS.animateMimo(cast.mimo, M, dt, t);
    mimoHat.visible = !!state.flags.hat && !(typeof ADOLF !== 'undefined' && ADOLF.capOn && ADOLF.capOn())     // (Adi's postman's cap goes on instead)
      && !(typeof SCHOOL !== 'undefined' && SCHOOL.hatOn && SCHOOL.hatOn())                                      // (or the script school's brush hat)
      && !(typeof CARDS !== 'undefined' && CARDS.capOn && CARDS.capOn()) && !(typeof NEWYEAR !== 'undefined' && NEWYEAR.hatOn && NEWYEAR.hatOn())    // (zh: Grandpa Chen's lucky cap, Longlong's dragon headband)
      && !(typeof MUERTOS !== 'undefined' && MUERTOS.hatOn && MUERTOS.hatOn())    // (es: Xochi's cempasúchil crown)
      && !(typeof LUCHA !== 'undefined' && LUCHA.hatOn && LUCHA.hatOn())    // (es: La Campana's mini lucha mask)
      && !(typeof MATSURI !== 'undefined' && MATSURI.hatOn && MATSURI.hatOn())    // (ja: Natsu's fox mask)
      && !(typeof CARNAVAL !== 'undefined' && CARNAVAL.hatOn && CARNAVAL.hatOn())    // (pt: Malu's tiara de estrelinhas)
      && !(typeof WEIHNACHT !== 'undefined' && WEIHNACHT.hatOn && WEIHNACHT.hatOn())    // (de: Oma Hilde's Pudelmütze)
      && !(typeof DOENER !== 'undefined' && DOENER.hatOn && DOENER.hatOn());   // (de: the Yıldız Grill's cap)
    sim.npcs.forEach(n => ACTORS.animateVillager(cast.npcs[n.id], n, dt, t));
    // the story's people (Rosa, Nico, Marta, Bruno: ~25 draw calls each) aren't drawn from far off, the way the towns hide past 150
    // (and only what this hid comes back: the Past and the Future park and hide them themselves)
    for (const n of sim.npcs) {
      const v = cast.npcs[n.id]; if (!v) continue;
      const far = Math.hypot(n.x - camera.position.x, n.z - camera.position.z) > 150, u = v.root.userData;
      if (far && v.root.visible) { v.root.visible = false; u.farHid = true; } else if (!far && u.farHid) { u.farHid = false; v.root.visible = true; }
    }
    cast.heroShadow.position.set(Y.x, WORLD.groundAt(Y.x, Y.z, Y.y) + 0.03, Y.z); cast.heroShadow.scale.setScalar(clamp(1 - (Y.ry - WORLD.groundAt(Y.x, Y.z, Y.y)) * 0.15, 0.4, 1));
    cast.mimoShadow.position.set(M.x, WORLD.groundAt(M.x, M.z, M.y) + 0.03, M.z);
    updateFoes(dt, t); updateAmbushes(dt, t);
    if (town && town.update) {   // the town isn't drawn (or animated) from deep in the forest, where the trees hide it anyway
      town.group.visible = Math.hypot(Y.x - WORLD.L.town.x, Y.z - WORLD.L.town.z) < 150;
      // Hugo the sweeper's hair grows back as the story goes on: the first boss, Molinar, each bell, Remanso… (DESIGN.md 14.8)
      if (town.hair) {
        const f = state.flags, b = f.bells || 0, n = [f.boss, f.ciro, b >= 1, f.marina, b >= 2, b >= 3].filter(Boolean).length;
        town.hair('hugo', n / 6, clamp((b - 3) / 5, 0, 1));
      }
      if (town.group.visible) town.update(dt, t, titleOn ? null : { x: Y.x, z: Y.z, y: Y.ry });   // (on the title nobody stops to wave at you)
    }
    { const room = indoorMod(); if (room && room.update) room.update(dt, t); }      // (the mill, a house, the Corn Society's hall)
    if (corn && corn.update) {   // the corn maze: drawn from the road and the town (not from a room)
      corn.group.visible = !indoors() && Math.hypot(Y.x - 34, Y.z + 92) < 170;
      if (corn.group.visible) corn.update(dt, t, titleOn ? null : { x: Y.x, z: Y.z, y: Y.ry });
    }
    if (cem && cem.update) {   // north of Alba: drawn from Alba's north streets on
      cem.group.visible = (!indoors() || (typeof PAST !== 'undefined' && PAST.inside)) && Math.hypot(Y.x + 35, Y.z + 240) < 175;     // (the Past: the Old Quarter as it was)
      if (cem.group.visible) cem.update(dt, t, titleOn ? null : { x: Y.x, z: Y.z, y: Y.ry });
    }
    if (caves && caves.update) {   // the quarry's mountains (seen from Alba) and the camp (its own nearer cut-off, in update)
      caves.group.visible = (!indoors() || (typeof TIME !== 'undefined' && indoorMod() === TIME)) && Math.hypot(Y.x - 88, Y.z + 266) < 300;     // (the camp stands in every world: time_quarry.js dresses it long ago and tomorrow)
      if (caves.group.visible) caves.update(dt, t, titleOn ? null : { x: Y.x, z: Y.z, y: Y.ry });
    }
    if (gardens && gardens.update) {   // the Bloom Gardens: drawn within 150 of the valley (its update hides it further off)
      if (indoors()) gardens.group.visible = false;
      else gardens.update(dt, t, titleOn ? null : { x: Y.x, z: Y.z, y: Y.ry });
    }
    if (peaks && peaks.update) {   // the Frost Peaks: on the skyline from the field and Molinar; the pass and the village nearer (its own cut-off, in update)
      peaks.group.visible = (!indoors() || (typeof TIME !== 'undefined' && indoorMod() === TIME)) && Math.hypot(Y.x - 205, Y.z + 258) < 320;     // (Escarcha stands in every world: time_peaks.js dresses it long ago and tomorrow)
      if (peaks.group.visible) { peaks.update(dt, t, titleOn ? null : { x: Y.x, z: Y.z, y: Y.ry }); if (peaks.fog && !titleOn) peaks.fog(Y, scene.fog); }
    }
    if (port && port.update) {   // Port Brisa: drawn within 175 of the city (from the lake's south shore and the road), not from Alba or indoors
      port.group.visible = !indoors() && Math.hypot(Y.x + 201, Y.z + 82) < 175;
      if (port.group.visible) { try { port.update(dt, t, titleOn ? null : { x: Y.x, z: Y.z, y: Y.ry }); } catch (e) { console.error('[port]', e); port.update = null; } }
    }
    if (marsh && marsh.update) {   // the Gray Marsh: drawn within 230 of the basin (its update hides it further off), not indoors
      if (indoors()) marsh.group.visible = false;
      else { try { marsh.update(dt, t, titleOn ? null : { x: Y.x, z: Y.z, y: Y.ry }); } catch (e) { console.error('[marsh]', e); marsh.update = null; } }
    }
    if (ruins && ruins.update) {   // the Sunken Ruins: drawn within 170 of the canyon (it's only reached by ship), not indoors
      ruins.group.visible = !indoors() && Math.hypot(Y.x - 142, Y.z - 16) < 170;
      if (ruins.group.visible) { try { ruins.update(dt, t, titleOn ? null : { x: Y.x, z: Y.z, y: Y.ry }); if (ruins.fog && !titleOn) ruins.fog(Y, scene.fog); } catch (e) { console.error('[ruins]', e); ruins.update = null; } }
    }
    {   // town life, the kids' games and hustlers, and the language's own character (each knows when to hide itself)
      const you = titleOn ? null : { x: Y.x, z: Y.z, y: Y.ry };
      if (townlife && townlife.update) { townlife.group.visible = !indoors(); if (townlife.group.visible) townlife.update(dt, t, you); }
      if (minigames && minigames.update) minigames.update(dt, t, you);
      if (domino && domino.update) { domino.group.visible = !indoors() && Math.hypot(Y.x + 47.6, Y.z + 162.6) < 150; if (domino.group.visible) domino.update(dt, t, you); }
      if (phonk && phonk.update) phonk.update(dt, t, you);        // (every frame: it runs the headphone leak and its own visibility)
      if (adolf && adolf.update) adolf.update(dt, t, you);
      if (signs && signs.update) { try { signs.update(dt, t, you); } catch (e) { console.error('[signs]', e); signs.update = null; } }
      if (romance && romance.update) romance.update(dt, t, you);        // (every frame: it hides itself indoors and where it doesn't belong)
      if (cards && cards.update) { try { cards.update(dt, t, you); } catch (e) { console.error('[cards]', e); cards.update = null; } }          // (zh: the card table; hides itself elsewhere)
      if (newyear && newyear.update) { try { newyear.update(dt, t, you); } catch (e) { console.error('[newyear]', e); newyear.update = null; } }  // (zh: Longlong and the festival)
      if (muertos && muertos.update) { try { muertos.update(dt, t, you); } catch (e) { console.error('[muertos]', e); muertos.update = null; } }  // (es: Xochi and the Día de Muertos)
      if (lucha && lucha.update) { try { lucha.update(dt, t, you); } catch (e) { console.error('[lucha]', e); lucha.update = null; } }  // (es: Doña Toña's stand; Mimo's mini mask)
      if (matsuri && matsuri.update) { try { matsuri.update(dt, t, you); } catch (e) { console.error('[matsuri]', e); matsuri.update = null; } }  // (ja: Natsu and the summer festival)
      if (shogi && shogi.update) { try { shogi.update(dt, t, you); } catch (e) { console.error('[shogi]', e); shogi.update = null; } }  // (ja: Grandpa Shige's shogi bench; Mimo's fan)
      if (carnaval && carnaval.update) { try { carnaval.update(dt, t, you); } catch (e) { console.error('[carnaval]', e); carnaval.update = null; } }  // (pt: Malu and the street Carnaval)
      if (familia && familia.update) { try { familia.update(dt, t, you); } catch (e) { console.error('[familia]', e); familia.update = null; } }  // (pt: Vó Dita, the family group chat, the Sunday lunch)
      if (weihnacht && weihnacht.update) { try { weihnacht.update(dt, t, you); } catch (e) { console.error('[weihnacht]', e); weihnacht.update = null; } }  // (de: Fiete and the Weihnachtsmarkt)
      if (doener && doener.update) { try { doener.update(dt, t, you); } catch (e) { console.error('[doener]', e); doener.update = null; } }  // (de: the Yıldız Grill's storefront; Mimo's cap and nazar)
      if (typeof SCHOOL !== 'undefined' && SCHOOL.outdoor) { try { SCHOOL.outdoor(dt, t); } catch (e) { console.error('[school]', e); SCHOOL.outdoor = null; } }     // (the school's signs, zh / ja only; Mimo's brush hat)
      if (typeof ANIME !== 'undefined' && ANIME.outdoor && !titleOn) { try { ANIME.outdoor(dt, t); } catch (e) { console.error('[anime]', e); ANIME.outdoor = null; } }     // (the siblings' house in ja games, the concert's stage, Mimo's headband)
      if (typeof GRANDMA !== 'undefined' && GRANDMA.outdoor) { try { GRANDMA.outdoor(dt, t); } catch (e) { console.error('[grandma]', e); GRANDMA.outdoor = null; } }     // (the restaurant's lanterns and signs, every language; Mimo's apron)
      if (typeof TALK !== 'undefined' && TALK.update) { try { TALK.update(dt); } catch (e) { console.error('[talk]', e); TALK.update = null; } }     // (free talk: "has time to talk" nudges, Mimo's gifts)
      if (typeof PHONE !== 'undefined' && PHONE.update) { try { PHONE.update(dt); } catch (e) { console.error('[phone]', e); PHONE.update = null; } }     // (the phone: threads on story events, the 📱 chip)
      if (typeof READ !== 'undefined' && READ.update && !titleOn) { try { READ.update(dt, t, you); } catch (e) { console.error('[read]', e); READ.update = null; } }     // (reading and listening: the library's door, Noa's diary pages, the radio, overheard talk)
      if (typeof EXAM !== 'undefined' && EXAM.update && !titleOn) { try { EXAM.update(dt, t, you); } catch (e) { console.error('[exam]', e); EXAM.update = null; } }     // (the Academy's front, the letter when your level is ready)
      // (life in Alba: the town hall's front, pen pals' letters arriving, the jobs' work days, the month's debate)
      if (typeof LIFE !== 'undefined' && LIFE.update && !titleOn) { try { LIFE.update(dt, t, you); } catch (e) { console.error('[life]', e); LIFE.update = null; } }
    }
    if (lake && lake.update) {   // the river, the lake and Remanso: drawn from Alba's west gate on
      lake.group.visible = !indoors() && (Math.hypot(Y.x + 165, Y.z + 150) < 175 || Math.hypot(Y.x - WORLD.L.island.x, Y.z - WORLD.L.island.z) < 175);     // (or out at Lighthouse Island, far across the grown lake)
      if (lake.group.visible) lake.update(dt, t, titleOn ? null : { x: Y.x, z: Y.z, y: Y.ry });
    }
    if (lake && typeof ISLE !== 'undefined' && ISLE.outdoor && !titleOn) { try { ISLE.outdoor(dt, t); } catch (e) { console.error('[isle]', e); } }     // (the lake follows the story: Bartolo, the ferry, the frogs, the bell)
    if (molinar && molinar.update) {   // the hills and Molinar: drawn from the field on (their windmills are landmarks)
      molinar.group.visible = Math.hypot(Y.x - 175, Y.z + 150) < 170;
      if (molinar.group.visible) molinar.update(dt, t, titleOn ? null : { x: Y.x, z: Y.z, y: Y.ry });
    }
    if (tower.userData.animate) tower.userData.animate(t);
    if (typeof OLDTOWER !== 'undefined' && OLDTOWER.outdoor && !titleOn) { try { OLDTOWER.outdoor(dt, t); } catch (e) { console.error('[oldtower]', e); } }     // (its door and yard; the fall into the Past)
    if (typeof FIN !== 'undefined' && FIN && FIN.tick && !titleOn) { try { FIN.tick(dt, t); } catch (e) { console.error('[finale]', e); } }     // (the finale: the rise's and the credits' own screens, Elio, his dad and Noa in Alba)
    if (chest.open) chest.lidPivot.rotation.x = damp(chest.lidPivot.rotation.x, -1.9, 7, dt);
    Object.entries(pageMeshes).forEach(([k, p]) => { const found = state.pages.includes(k); p.glow.material.opacity = found ? 0 : 0.3 + 0.2 * Math.sin(t * 3); });
    w3d.ring.active = state.flags.quest === 'asked' && (state.pickedRing || []).length + (state.picked || []).length < 3;
    // the Hush: colors drain, sound goes muffled, birds stop (scenes can push it: game.fx)
    const h = Math.max(w3d.hush, game.fx.hush, titleOn ? 0 : hushNear(Y)), f = WORLD.forestAt(Y.x, Y.z);
    canvas.style.filter = h > 0.02 && !titleOn ? `saturate(${1 - 0.6 * h}) brightness(${1 - 0.06 * h})` : '';
    $('hushfx').style.opacity = h * 0.9;
    Sound.hush = h; Sound.birds = game.fx.birds !== null ? game.fx.birds : state.flags.hatched ? (1 - smoothstep(0.1, 0.5, f)) * (1 - h) * 0.75 : 0;
    // each region has its own song: the forest, Alba, the Windmill Hills and Molinar, the Reed Meadows and Remanso, the Great
    // Mill. In a house you hear its town's song (by the door you came in through).
    const room = indoorMod(), at = room && !inMill() && room.OUTSIDE ? room.OUTSIDE : Y, fa = room ? 0 : f;
    const finSong = typeof FIN !== 'undefined' && FIN && FIN.song ? FIN.song() : null;      // (Chapter 4's finale: the rise, the clock, the stage, the credits)
    const want = !state.flags.hatched ? 'title' : finSong ? finSong : inMill() ? 'mill' : inIsle() ? (Sound.songs && Sound.songs.includes('isle') ? 'isle' : 'mill')
      : inMine() ? (Sound.songs && Sound.songs.includes('mine') ? 'mine' : 'mill') : inGreen() ? (Sound.songs && Sound.songs.includes('greenhouse') ? 'greenhouse' : 'mill')
      : typeof SCHOOL !== 'undefined' && SCHOOL.inside && Sound.songs && Sound.songs.includes('school') ? 'school'      // (the script school: its own study song, zh or ja)
      : typeof GRANDMA !== 'undefined' && GRANDMA.inside && Sound.songs && Sound.songs.includes('restaurant') ? 'restaurant'      // (Grandma Mei's restaurant: lo-fi with a guzheng)
      : typeof KUNGFU !== 'undefined' && KUNGFU.inside && Sound.songs && Sound.songs.includes('kungfu') ? 'kungfu'                // (her courtyard: a training montage)
      : typeof LUCHA !== 'undefined' && LUCHA.inside && Sound.songs && Sound.songs.includes('lu_campana') ? 'lu_campana'      // (La Campana's Arenita: arena funk)
      : typeof DOENER !== 'undefined' && DOENER.inside && Sound.songs && Sound.songs.includes('de_doener') ? 'de_doener'      // (the Yıldız Grill's radio: a saz riff over boom-bap)
      : typeof MER !== 'undefined' && MER && MER.inside && MER.song() ? MER.song()      // (Meridiana, Chapter 5: each district's own song, js/ch5/mer_music.js)
      : typeof OLDTOWER !== 'undefined' && OLDTOWER.inside ? OLDTOWER.song()      // (the Old Tower: the climb; the clock room's music box)
      : typeof TIME !== 'undefined' && TIME.world && TIME.world() !== 'now' ? TIME.song()      // (the Past and the Future: each region's song for that world, time.js; Alba's are past.js's and future.js's)
      : typeof PAST !== 'undefined' && PAST.inside ? PAST.song()      // (the Past: Alba long ago; the festival)
      : typeof FUTURE !== 'undefined' && FUTURE.inside ? FUTURE.song()      // (the Future: gray Alba; under the Great Silence)
      : typeof CHAPEL_D !== 'undefined' && CHAPEL_D.inside ? CHAPEL_D.song()      // (the Gray Marsh's drowned chapel: its own song)
      : typeof RUINS !== 'undefined' && RUINS.songAt && RUINS.songAt(at.x, at.z) ? RUINS.songAt(at.x, at.z)      // (the Sunken Ruins' canyon; inside its temple, the temple's song)
      : (fa > 0.3 || at.z > -28) ? 'forest'
      : (typeof MARSH !== 'undefined' && MARSH.songAt && MARSH.songAt(at.x, at.z))          // (the Gray Marsh, past the old north road's gate)
      || (typeof CEMETERY !== 'undefined' && CEMETERY.songAt && CEMETERY.songAt(at.x, at.z)) || (typeof CAVES !== 'undefined' && CAVES.songAt(at.x, at.z)) || (typeof GARDENS !== 'undefined' && GARDENS.songAt(at.x, at.z))
      || (typeof PEAKS !== 'undefined' && PEAKS.songAt(at.x, at.z))          // (the Frost Peaks; inside the Ice Clock Tower, its clockwork song)
      || (typeof PORT !== 'undefined' && PORT.songAt && PORT.songAt(at.x, at.z))          // (Port Brisa: the city and the bay; inside the sea fort, its own song)
      || (at.x > 85 ? 'molinar' : at.x < -60 ? 'lake' : 'village');
    if (want !== song && !fightSong) { song = want; Sound.setSong(want); }      // (not while a fight's song holds: its fades)
    if (titleOn) TITLE.update(dt, t);       // the title's crane shot, and Mimo perched on the logo
    if (typeof PAST !== 'undefined' && PAST.late && !titleOn) { try { PAST.late(dt); } catch (e) { console.error('[past]', e); } }     // (the Past: its light and sky, today's people set aside; a save loaded in or out of it)
    if (typeof TIME !== 'undefined' && TIME.late && !titleOn) { try { TIME.late(dt); } catch (e) { console.error('[time]', e); } }     // (the worlds: the cracks, the cross-time effects, a save loaded in another world)
    if (typeof ALBA_PAST !== 'undefined' && ALBA_PAST && ALBA_PAST.late && !titleOn) { try { ALBA_PAST.late(dt); } catch (e) { console.error('[alba past]', e); } }     // (Noa at the pond's crack; the rooms under the stage keep their own light over the Past's)
    if (typeof ALBA_FUT !== 'undefined' && ALBA_FUT && ALBA_FUT.late && !titleOn) { try { ALBA_FUT.late(dt); } catch (e) { console.error('[alba future]', e); } }     // (tomorrow's Old Quarter and the gray theater; the people of tomorrow)
    renderer.render(scene, camera);
    // UI on top
    const L = STORY.line;
    UI.drawLine(L);
    if (L) {
      const at = L.at;   // a spot (or a townsperson: y and top are theirs) instead of an actor
      const ay = at && (at.top !== undefined ? (at.y !== undefined ? at.y : WORLD.terrainAt(at.x, at.z)) + at.top + 0.3 : WORLD.terrainAt(at.x, at.z) + 2.3);
      // (when whoever's talking is off screen, say during a pan to the tower, the line docks at the bottom instead of vanishing)
      let bp = at ? screen(at.x, ay, at.z) : anchor(L.who);
      const docked = !bp || !bp.on;
      if (docked) bp = { x: innerWidth / 2, y: innerHeight - 92, on: true };
      $('bubble').classList.toggle('docked', docked);
      UI.place($('bubble'), bp, docked ? 0 : -6);
    }
    const th = STORY.thought;
    $('thought').classList.toggle('on', !!th && !L);
    if (th) { if ($('thought')._html !== th.html) { $('thought')._html = th.html; $('thought').innerHTML = th.html; } UI.place($('thought'), anchor('you'), -4); }
    // the quests: goal line, compass, toasts
    if ((questT -= dt) <= 0 && state.flags.hatched) { questT = 0.25; QUESTS.tick(); const [html, kind] = QUESTS.objective(); UI.objective(html, kind); }
    UI.compass(state.flags.hatched && !cam.override && !state.teaching && !game.journalOpen && (inMill() || inIsle() || inMine() || inGreen() || inIce() || (typeof OLDTOWER !== 'undefined' && OLDTOWER.inside) || (typeof CHAPEL_D !== 'undefined' && CHAPEL_D.inside) || (typeof FUTURE !== 'undefined' && FUTURE.inside) || (typeof PAST !== 'undefined' && PAST.inside) || (typeof TIME !== 'undefined' && TIME.inside) || !indoors()), cam.yaw, Y, state.flags.hatched ? QUESTS.marks() : []);     // (no compass in a house)
    if (typeof MINIMAP !== 'undefined') MINIMAP.update(dt);
    const ms = M.say && !M.hidden ? M.say.text : null;
    $('bubble-mimo').classList.toggle('on', !!ms);
    if (ms) { $('bubble-mimo').textContent = ms; UI.place($('bubble-mimo'), anchor('mimo')); }
    const pr = !frozen && game.prompt;
    $('prompt').classList.toggle('on', !!pr);
    if (pr) { $('prompt').querySelector('span').textContent = pr.label; UI.place($('prompt'), screen(pr.x, (pr.y !== undefined ? pr.y : WORLD.terrainAt(pr.x, pr.z)) + 2.0, pr.z)); }   // (rooms float high up: their things carry y)
    if (pr) { const kb = $('prompt').querySelector('kbd'), kn = KEYS.name((KEYS.map.interact || ['KeyE'])[0]); if (kb && kb.textContent !== kn) kb.textContent = kn; }     // (the key is your own binding: Settings can move "use" off E; P6c)
    UI.counters(state.pages.filter(k => STORY.PAGES.some(p => p.key === k)).length, LEX.taughtList().filter(id => id.startsWith('w.')).length);   // (the forest's 5 pages; later ones are in the journal)
    { const c = state.coins || 0, chip = $('chip-coins'); chip.classList.toggle('hidden', !c && !state.flags.boss); if (chip._c !== c) { chip._c = c; $('count-coins').textContent = c; } }
    if ((state._autosave = (state._autosave || 0) + dt) > 30) { state._autosave = 0; save(); }
  }
  function resize() { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); }
  addEventListener('resize', resize); resize();
  let last = performance.now(), running = false;
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); requestAnimationFrame(loop); }

  // ------------------------------------------------------------ start
  addEventListener('keydown', e => {
    Sound.start();
    if (Input.typing) return;
    if (e.code === 'KeyM') { Sound.music = !Sound.music; UI.toast(Sound.music ? 'Music on' : 'Music off'); }
  });
  addEventListener('pointerdown', () => Sound.start());
  $('music').addEventListener('click', () => { Sound.start(); Sound.music = !Sound.music; $('music').classList.toggle('on', Sound.music); $('music').blur(); });
  // The title page (title.js). Meanwhile the hero waits, unseen, in the middle of Alba, so the town is
  // drawn, animated and shadowed around them for the crane shot over it.
  async function showTitle() {
    titleOn = true; document.body.classList.add('on-title');
    sim.you.x = -10; sim.you.z = -137; sim.snap();
    cast.hero.root.visible = cast.heroShadow.visible = false;
    const slots = Array.from({ length: SLOTS }, (_, i) => ({ n: i + 1, info: slotInfo(i + 1) }));
    const choice = await TITLE.show({ scene, camera, cam, slots, onDelete: n => { try { localStorage.removeItem(slotKey(n)); } catch (e) { /* blocked */ } return slotInfo(n); },
      onExport: exportSlot, onImport: importSlot, readSave });
    await UI.fade(1, 600);
    TITLE.close(); titleOn = false; document.body.classList.remove('on-title');
    cast.hero.root.visible = cast.heroShadow.visible = true;
    return choice;
  }
  async function boot() {
    w3d.drawSign(SIGN.es);
    UI.helpBar();
    renderer.render(scene, camera);
    if (!running) { running = true; requestAnimationFrame(t => { last = t; loop(t); }); }
    const q = new URLSearchParams(location.search);
    const choice = q.get('skip') ? { mode: 'skip', lang: q.get('lang') || 'es', script: q.get('script'), slot: 9 }     // (zh / ja: &script=chars)
      : q.get('new') ? { mode: 'new', lang: q.get('lang') || 'es', script: q.get('script'), slot: 9 }      // tests: the whole opening, saved to slot 9
      : q.get('cont') ? { mode: 'continue', slot: 9 }                              // tests: carry on from the test save
      : await showTitle();
    slot = choice.slot || 1;
    const saved = choice.mode === 'continue' ? loadSlot(slot) : null;
    if (choice.mode === 'continue' && saved) {
      state = Object.assign(fresh(), saved.state); applyLang(state.lang); LEX.fromJSON(saved.lex); UI.mimoName = state.mimoName;
      sim.you.x = saved.you.x; sim.you.z = saved.you.z; sim.you.yaw = saved.you.yaw; sim.mimo.hidden = false; sim.mimo.x = sim.you.x + 1; sim.mimo.z = sim.you.z + 1; sim.snap();
      cast.mimo.root.visible = cast.mimoShadow.visible = true; if (saved.chest) chest.open = true;
      (state.picked || []).forEach(i => w3d.hideShroom(WORLD.shrooms[i]));
      (state.pickedRing || []).forEach(i => w3d.hideRing(i));
      placeBruno();
      if (state.flags.boss) w3d.liftHush(WORLD.L.hush.findIndex(h => h.boss), true);
      if (state.flags.boulder) game.boulderAway();
      placeRaft();
      if (molinar && molinar.setMillHushed) molinar.setMillHushed(!state.flags.millFree, true);     // (the mill's color and turning sails come back with a save made after its bell)
      state.coins = state.coins || 0; state.bag = state.bag || {};
      w3d.train.gone(); cam.snap(sim.you.yaw, 0.28, 8.5);
      await UI.fade(0, 700);
      return;
    }
    LEX.reset(); state = fresh(); if (choice.lang === 'zh' || choice.lang === 'ja') state.script = choice.script === 'chars' ? 'chars' : 'roman';
    applyLang(choice.lang); UI.mimoName = state.mimoName; placeBruno(); placeRaft();
    if (choice.mode === 'skip') {     // tests: start right after the hatching
      state.flags.hatched = true; state.mimoName = 'Mimo'; sim.mimo.hidden = false; sim.mimo.x = 3; sim.mimo.z = 60.5; sim.snap();
      cast.mimo.root.visible = cast.mimoShadow.visible = true; w3d.train.gone(); cam.snap(Math.PI, 0.28, 8.5);
      LETTERS.forEach((_, i) => UI.letter && LETTERS[i].body.join(' ').replace(/\{(w\.[a-z_]+)\}/g, (_, id) => LEX.expose(id)));
      await UI.fade(0, 300); return;
    }
    await STORY.prologue();
  }
  boot();

  window.__g = {
    sim, w3d, cast, cam, renderer, LEX, STORY, Input, game, get state() { return state; },
    step(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) frame(dt); },
    hold(force, seconds, dt = 1 / 60) { Input.force = force; this.step(Math.round(seconds / dt), dt); Input.force = null; },
    teleport(x, z, yaw) { sim.you.x = x; sim.you.z = z; if (yaw !== undefined) sim.you.yaw = yaw; sim.mimo.x = x + 1.1; sim.mimo.z = z + 1.1; sim.snap(); cam.snap(yaw !== undefined ? yaw : cam.yaw, cam.pitch, cam.dist); },
    async shot(name) { frame(1 / 60); const data = renderer.domElement.toDataURL('image/png'); const r = await fetch('/shot', { method: 'POST', body: JSON.stringify({ name, data }) }); return r.json(); },
    save, toggleJournal,
    // tests: step while letting story scripts continue between frames (they resume in microtasks)
    async go(sec) { const n = Math.round(sec * 60); for (let i = 0; i < n; i++) { frame(1 / 60); if (i % 2 === 0) await null; } },
    async press() { for (let k = 0; k < 400 && STORY.line && !STORY.line.full; k++) { frame(1 / 60); await null; } Input.force = { interact: true }; frame(1 / 60); Input.force = null; for (let k = 0; k < 4; k++) { await null; frame(1 / 60); } },
    lineNow() { const L = STORY.line; return L ? { who: L.who, name: L.name, text: L.parts ? L.parts.map(p => p.s + (p.gl ? ' (' + p.gl + ')' : '')).join('') : L.text, en: L.en, under: !!L.under } : null; },
    async untilLine(sec = 12) { for (let i = 0; i < sec * 60 && !STORY.line; i++) { frame(1 / 60); await null; } return this.lineNow(); },
  };
})();
