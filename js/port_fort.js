'use strict';
// The Sea Fort (DESIGN.md 17.1, region 6): Port Brisa's dungeon, on its islet in the bay. Four rooms, one per floor, built like the
// Ice Clock Tower's: high up and out of sight at y = 300 (port.js FORT_ROOMS: (−282/−256, −206/−180), each at least 26 from every
// other room), walls facing in (the camera looks in from outside, like a dollhouse), one room at a time, and every action a
// sentence to Mimo («tell Mimo»; once a verb has worked on a thing in a room, E repeats it). Each solved puzzle chimes (BFX.solved())
// and the way on visibly opens, with a prompt.
//   0 the Courtyard:  crabs jump you (a fight: from behind!); the inner gate's portcullis hangs from a capstan: push it round
//                     («¡empuja!») and the portcullis rises
//   1 the Cistern:    the lever for the stair grate is on a ledge across the flooded floor: swim over («¡nada!») and pull it; the
//                     grate slides up
//   2 the Signal Loft: crabs (a fight); the rope ladder up is rolled up on a high beam, by the gulls' window: call them («¡llama!»)
//                     and they pull it down
//   3 the Bell Tower: the giant crab sleeps round the harbor bell. Call the gulls to wake it («¡llama!»), the boss fight
//                     (opts.boss 'crab': hit it from behind, and a call turns it round), Noa's page (she sailed to the south-east coast, to the Sunken
//                     Ruins), then ring the bell yourself («¡golpea la campana!», or «¡llama!»: the gulls pull its rope): the sixth bell.
//                     Outside, the whole city answers, and Tere rows you back to the ferry pier.
//   PORTFORT.init(game) · enter() · leave() · update(dt, t) · interactables() · target() · inside · OUTSIDE (the gate)
// Progress lives in state.fort; flags.portFree and flags.bells = 6 when the bell rings (port_play.js's sync lifts the gray).
const PORTFORT = (() => {
  let G = null, built = false;
  const { part, G: GEO } = TK;
  const Y0 = 300, HW = 7, HD = 6, WH = 5.6, INK = '#2b2235';
  const RM = PORT.FORT_ROOMS;
  const ROOMS = [
    { id: 'court', name: 'The Courtyard', sub: 'The Sea Fort · the gate', x: RM[0].x, z: RM[0].z },
    { id: 'cistern', name: 'The Cistern', sub: 'The Sea Fort · below the stairs', x: RM[1].x, z: RM[1].z },
    { id: 'loft', name: 'The Signal Loft', sub: 'The Sea Fort · the gulls’ window', x: RM[2].x, z: RM[2].z },
    { id: 'belfry', name: 'The Bell Tower', sub: 'The Sea Fort · the top', x: RM[3].x, z: RM[3].z },
  ];
  const OUTSIDE = { x: PORT.SPOT.fortGate.x + 1.6, z: PORT.SPOT.fortGate.z, yaw: Math.PI / 2 };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const S = () => G.state.fort || (G.state.fort = {});
  const ex = w => (UI.lang === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const verbs = () => ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing', 'v.climb', 'v.blow', 'v.call'].filter(id => LEX.item(id));
  const has = id => !!LEX.item(id);
  const lang = () => G.state.lang || 'es';
  const cjk = l => l === 'zh' || l === 'ja';
  let inside = false, cur = -1, quick = {};
  const rooms = [];
  const Kit = () => GARDENS.Kit(), KG = () => GARDENS.GEO;
  const FIGHT_AT = { get biome() { const b = typeof BATTLE !== 'undefined' && BATTLE._; return b && b.arenaBuilders && b.arenaBuilders.harbor ? 'harbor' : 'lake'; }, x: PORT.FORT.x, z: PORT.FORT.z };     // (the harbor: port_battle.js's arena, once it's loaded)
  const solved = () => { try { if (typeof BFX !== 'undefined' && BFX.solved) BFX.solved(); else Sound.play('chest'); } catch (e) { /* (no sound) */ } };

  // ---------------------------------------------------------------- lines (T(en, es, pt, de, zh, ja)) and Noa's page
  const T = PORT.T;
  const FL = {
    // the giant crab, woken (heard whole in the language: it tells you its own weak spot)
    'k.wake': T('Who’s pecking me?! This {w.bell} is mine! And from the front, I’m made of iron!', '¡¿Quién me picotea?! ¡Esta campana es mía! ¡Y por delante soy de hierro!', 'Quem está me bicando?! Este sino é meu! E pela frente eu sou de ferro!', 'Wer pickt mich da?! Diese Glocke gehört mir! Und von vorne bin ich aus Eisen!',
      '[谁|shéi] [在|zài] [啄|zhuó] [我|wǒ] ？ ！ [这|zhè] [口|kǒu] [钟|zhōng] [是|shì] [我|wǒ] [的|de] ！ [从|cóng] [前面|qián miàn] [看|kàn] ， [我|wǒ] [是|shì] [铁|tiě] [做|zuò] [的|de] ！', 'だれ だ 、 わし を つつく の は ？ ！ この [鐘|かね] は わし の もの だ ！ [前|まえ] から は 、 わし は [鉄|てつ] で できて いる ぞ ！'),
    'k.after': T('Ow, ow… What a bad dream! I was so sleepy, and so gray… The {w.bell}? Ring it! It was never mine.', '¡Ay, ay… qué sueño tan feo! Tenía tanto sueño, y estaba tan gris… ¿La campana? ¡Tóquenla! Nunca fue mía.', 'Ai, ai… que sonho feio! Eu estava com tanto sono, e tão cinza… O sino? Toquem! Ele nunca foi meu.', 'Au, au… was für ein böser Traum! Ich war so müde und so grau… Die Glocke? Läutet sie! Sie war nie meine.',
      '[哎哟|āi yō] ， [哎哟|āi yō] … [好|hǎo] [可怕|kě pà] [的|de] [梦|mèng] ！ [我|wǒ] [又|yòu] [困|kùn] [又|yòu] [灰|huī] … [钟|zhōng] ？ [你们|nǐ men] [敲|qiāo] [吧|ba] ！ [它|tā] [从来|cóng lái] [不|bù] [是|shì] [我|wǒ] [的|de] 。', 'いたた … ひどい [夢|ゆめ] だった ！ とても [眠|ねむ]くて 、 [灰色|はいいろ] で … [鐘|かね] ？ [鳴|な]らして くれ ！ わし の もの で は なかった 。'),
  };
  const PAGE = {
    es: ['Desde lo alto del {w.fort} vi salir el barco grande hacia la costa del sureste. Los marineros dicen que allá hay ruinas medio enterradas en la arena, y una campana que nadie oye desde hace cien años. Me voy en el próximo barco.'],
    pt: ['Do alto do {w.fort} eu vi o navio grande sair para a costa sudeste. Os marinheiros dizem que lá tem ruínas meio enterradas na areia, e um sino que ninguém ouve há cem anos. Vou no próximo navio.'],
    de: ['Oben von der {w.fort} habe ich das große Schiff zur Südostküste fahren sehen. Die Seeleute sagen, dort gibt es Ruinen, halb im Sand begraben, und eine Glocke, die seit hundert Jahren niemand gehört hat. Ich fahre mit dem nächsten Schiff.'],
    zh: ['[我|wǒ] [从|cóng] {w.fort} [顶上|dǐng shang] [看见|kàn jiàn] [大船|dà chuán] [开往|kāi wǎng] [东南|dōng nán] [海岸|hǎi àn] 。 [水手们|shuǐ shǒu men] [说|shuō] ， [那里|nà lǐ] [有|yǒu] [一半|yī bàn] [埋|mái] [在|zài] [沙子|shā zi] [里|lǐ] [的|de] [遗迹|yí jì] ， [还有|hái yǒu] [一|yī] [口|kǒu] [钟|zhōng] ， [一百|yī bǎi] [年|nián] [没有|méi yǒu] [人|rén] [听到|tīng dào] [过|guo] 。 [我|wǒ] [坐|zuò] [下|xià] [一|yī] [班|bān] [船|chuán] [去|qù] 。'],
    ja: ['{w.fort} の [上|うえ] から 、 [大|おお]きな [船|ふね] が [南東|なんとう] の [海岸|かいがん] へ [出|で]て いく の を [見|み]た 。 [船乗|ふなの]り たち の [話|はなし] で は 、 そこ に は [砂|すな] に [半分|はんぶん] うまった [遺跡|いせき] と 、 [百年|ひゃくねん] だれ も [聞|き]いて いない [鐘|かね] が ある そう だ 。 [次|つぎ] の [船|ふね] で [行|い]く 。'],
    en: ['From the top of the {w.fort} I watched the big ship leave for the south-east coast. The sailors say there are ruins down there, half buried in the sand, and a bell nobody has heard for a hundred years. I’m going on the next ship.'],
  };
  if (typeof LINES !== 'undefined' && !LINES['page.port']) LINES['page.port'] = PAGE;
  const sayT = (p, Tl, o) => PORT.sayT(p, Tl, o);
  // the giant crab's line, heard whole (STORY.demoLine): what's shown in it
  const WAKE_MARK = { es: [['por delante', 'from the front'], ['de hierro', 'made of iron']], pt: [['pela frente', 'from the front'], ['de ferro', 'made of iron']],
    de: [['von vorne', 'from the front'], ['aus Eisen', 'made of iron']], zh: [['[从|cóng] [前面|qián miàn]', 'from the front'], ['[铁|tiě]', 'iron']], ja: [['[前|まえ] から', 'from the front'], ['[鉄|てつ]', 'iron']] };

  // ---------------------------------------------------------------- materials: walls of old sea stone, a floor of flags, salt and seaweed
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const stone = tex(256, 256, c => {
      const R = rng(61); c.fillStyle = '#a99d86'; c.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) { const off = (y % 2) * 26; c.fillStyle = ['#b3a78f', '#9f937b', '#bcb098', '#a39780'][(x + y * 3) % 4]; c.fillRect(x * 52 + off - 52 + 2, y * 32 + 2, 48, 28); c.fillRect(x * 52 + off + 208 - 256 + 2, y * 32 + 2, 48, 28); }
      c.fillStyle = 'rgba(80,110,90,0.35)'; for (let k = 0; k < 26; k++) { c.beginPath(); c.ellipse(R() * 256, 200 + R() * 56, 6 + R() * 16, 3 + R() * 6, 0, 0, TAU); c.fill(); }      // (seaweed and salt low on the wall)
      c.strokeStyle = 'rgba(60,50,40,0.35)'; c.lineWidth = 3; for (let y = 0; y <= 256; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
    }, 3, 1.4);
    const floor = tex(256, 256, c => {
      c.fillStyle = '#8f8676'; c.fillRect(0, 0, 256, 256);
      const R = rng(9); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = ['#9a9180', '#857c6c', '#a29988', '#8b8272'][(x * 3 + y) % 4]; c.fillRect(x * 64 + 3, y * 64 + 3, 58, 58); }
      c.fillStyle = 'rgba(255,255,255,0.12)'; for (let k = 0; k < 60; k++) c.fillRect(R() * 256, R() * 256, 2 + R() * 4, 2 + R() * 4);
    }, 3, 3);
    MAT = { stone: new THREE.MeshToonMaterial({ map: stone, gradientMap: TK.grad }), floor: new THREE.MeshToonMaterial({ map: floor, gradientMap: TK.grad }), hole: new THREE.MeshBasicMaterial({ color: '#141a24' }),
      water: new THREE.MeshToonMaterial({ color: '#3f8fb0', gradientMap: TK.grad, transparent: true, opacity: 0.86, emissive: new THREE.Color('#0d3040') }) };
    return MAT;
  }
  const grp = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const glow = (color, s, o = 0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.setScalar(s); sp.renderOrder = 2; return sp; };
  const unsolid = o => { if (!o) return; const s = o.solid || o; s.x = s.z = 1e5; };
  // a window in the back wall, with the sea outside (a painted card)
  function seaWindow(g, x, z, w = 1.8, h = 1.3, y = Y0 + 3.1) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 184; const c = cv.getContext('2d');
    const sky = c.createLinearGradient(0, 0, 0, 120); sky.addColorStop(0, '#8cc4ec'); sky.addColorStop(1, '#e6f4fb'); c.fillStyle = sky; c.fillRect(0, 0, 256, 120);
    c.fillStyle = '#3f8fc0'; c.fillRect(0, 112, 256, 72); c.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 14; i++) c.fillRect((i * 37) % 250, 124 + (i % 4) * 14, 14, 2);
    c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(60, 40, 26, 8, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(190, 30, 20, 6, 0, 0, TAU); c.fill();
    c.strokeStyle = '#4a4f58'; c.lineWidth = 3; for (const [gx, gy] of [[120, 60], [150, 74]]) { c.beginPath(); c.moveTo(gx - 9, gy); c.quadraticCurveTo(gx - 4, gy - 6, gx, gy); c.quadraticCurveTo(gx + 4, gy - 6, gx + 9, gy); c.stroke(); }
    const win = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), fog: false })); win.position.set(x, y, z); g.add(win);
    const k = Kit(); k.box(x, y - h / 2 - 0.06, z + 0.08, w + 0.3, 0.12, 0.24, '#7a6a52', { ink: 0.012 }).box(x, y + h / 2 + 0.06, z + 0.08, w + 0.3, 0.12, 0.24, '#7a6a52', { ink: 0.012 });
    for (const s of [-1, 1]) k.box(x + s * (w / 2 + 0.08), y, z + 0.08, 0.14, h + 0.2, 0.24, '#7a6a52', { ink: 0.012 });
    k.build(g);
  }

  // ---------------------------------------------------------------- the rooms' shell: stone walls facing in, beams, the way back down
  function shell(R, g) {
    const M = mats();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, 0.4, HD * 2), M.floor); floor.position.set(R.x, Y0 - 0.2, R.z); floor.receiveShadow = true; g.add(floor);
    [[0, -HD, 0, HW * 2], [0, HD, Math.PI, HW * 2], [-HW, 0, Math.PI / 2, HD * 2], [HW, 0, -Math.PI / 2, HD * 2]].forEach(([dx, dz, ry, w]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), M.stone); m.position.set(R.x + dx, Y0 + WH / 2, R.z + dz); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    });
    const k = Kit(), GG = KG(), RR = rng(Math.round(-R.x * 7 + 3));
    for (const x of [-4.6, 4.6]) k.box(R.x + x, Y0 + 2.4, R.z - HD + 0.3, 0.4, 4.8, 0.4, '#5f5446', { ink: 0.02 });
    k.box(R.x, Y0 + 4.9, R.z - HD + 0.35, HW * 2 - 0.4, 0.36, 0.42, '#5a3a24', { ink: 0.02 });
    for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.3), Y0 + 4.9, R.z, 0.38, 0.36, HD * 2 - 0.6, '#5a3a24', { ink: 0.02 });
    // gray seaweed in the corners, a few shells, ropes coiled by the walls
    for (let i = 0; i < 9; i++) { const x = R.x + (RR() < 0.5 ? -1 : 1) * (HW - 0.7 - RR() * 1.4), z = R.z + (RR() < 0.5 ? -1 : 1) * (HD - 0.7 - RR() * 1.0); k.add(GG.sphere, x, Y0 + 0.08, z, 0.3 + RR() * 0.3, 0.08, 0.25 + RR() * 0.2, RR() < 0.5 ? '#8a8f86' : '#9a9a90', { ink: 0.008 }); }
    for (let i = 0; i < 2; i++) { const x = R.x + (i ? 5.4 : -5.6), z = R.z + 3.6 - i * 1.4; k.add(GG.cyl, x, Y0 + 0.1, z, 0.42, 0.2, 0.42, '#c9b48e', { ink: 0.01 }).add(GG.cyl, x, Y0 + 0.24, z, 0.3, 0.1, 0.3, '#b8a27e', { ink: 0 }); }
    k.build(g);
    // the way back down: a hatch at the front, by the left
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.2), M.hole); door.rotation.x = -Math.PI / 2; door.position.set(R.x - 4.5, Y0 + 0.012, R.z + HD - 0.7); g.add(door);
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - HD - 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 }, { obox: 1, x: R.x, z: R.z + HD + 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 },
      { obox: 1, x: R.x - HW - 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }, { obox: 1, x: R.x + HW + 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }]);
    WORLD.addPlatforms([{ box: [R.x - HW, R.x + HW, R.z - HD, R.z + HD], top: Y0 }]);
  }
  // a doorway in the back wall (dark), with whatever bars it
  function doorway(g, x, w = 1.7, h = 2.5) { const d = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mats().hole); d.position.set(x, Y0 + h / 2, rooms[g.ri].R.z - HD + 0.03); g.add(d); return d; }

  // ---------------------------------------------------------------- build the four rooms (on first entry)
  function build() {
    if (built) return; built = true;
    const scene = G.w3d.scene, GG = KG();
    ROOMS.forEach((R, i) => { const g = new THREE.Group(); g.visible = false; g.ri = i; scene.add(g); rooms[i] = { R, g }; shell(R, g); });
    // 0 · the Courtyard: the capstan, and the portcullis over the inner gate
    {
      const room = rooms[0], R = room.R, g = room.g, k = Kit();
      room.gate = { x: R.x + 2.6, z: R.z - HD + 0.4 };
      doorway(g, room.gate.x, 2.0, 2.8);
      k.box(room.gate.x, Y0 + 3.05, R.z - HD + 0.18, 2.6, 0.5, 0.4, '#6f6556', { ink: 0.015 });
      seaWindow(g, R.x - 2.2, R.z - HD + 0.04, 1.6, 1.1);
      // a cannon, crates, a coil of chain
      k.add(GG.cyl, R.x - 4.4, Y0 + 0.55, R.z - 2.6, 0.34, 1.9, 0.34, '#3a3f48', { rx: Math.PI / 2 - 0.2, ink: 0.015 }).box(R.x - 4.4, Y0 + 0.3, R.z - 2.2, 0.9, 0.5, 1.2, '#6b4a30', { ink: 0.015 });
      for (const [dx, dz] of [[5.2, 2.4], [5.6, 1.4], [5.0, 1.0]]) k.box(R.x + dx, Y0 + 0.42, R.z + dz, 0.84, 0.84, 0.84, '#b8955a', { ry: dx, ink: 0.012 });
      k.build(g);
      WORLD.extra.push({ obox: 1, x: R.x - 4.4, z: R.z - 2.4, hw: 0.6, hd: 1.1, rot: 0 }, { obox: 1, x: R.x + 5.3, z: R.z + 1.6, hw: 0.8, hd: 1.0, rot: 0 });
      // the portcullis (it rises when the capstan turns)
      const pc = grp(g, room.gate.x, Y0, R.z - HD + 0.25), pk = Kit();
      for (let i = 0; i < 6; i++) pk.add(GG.cyl6, -0.9 + i * 0.36, 1.4, 0, 0.06, 2.8, 0.06, '#3a3f48', { ink: 0.008 });
      for (const y of [0.5, 1.4, 2.3]) pk.box(0, y, 0, 2.0, 0.08, 0.08, '#3a3f48', { ink: 0.006 });
      pk.build(pc); room.port = pc;
      room.portSolid = { obox: 1, x: room.gate.x, z: R.z - HD + 0.4, hw: 1.1, hd: 0.3, rot: 0 }; WORLD.extra.push(room.portSolid);
      // the capstan: a drum on a post, four bars (it turns when pushed)
      room.cap = { x: R.x - 0.6, z: R.z - 0.6 };
      const cg = grp(g, room.cap.x, Y0, room.cap.z), ck = Kit();
      ck.add(GG.cyl, 0, 0.55, 0, 0.5, 1.1, 0.5, '#7a5a3a', { ink: 0.015 }).add(GG.cyl, 0, 1.12, 0, 0.6, 0.12, 0.6, '#5a3a24', { ink: 0.01 });
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; ck.box(Math.cos(a) * 0.95, 0.85, Math.sin(a) * 0.95, 1.2, 0.12, 0.12, '#8a6440', { ry: -a, ink: 0.01 }); }
      ck.build(cg); room.capG = cg;
      WORLD.extra.push({ x: room.cap.x, z: room.cap.z, r: 0.75 });
      // the chain from the capstan up over a pulley to the portcullis
      const kc = Kit(); kc.rod(GG.cyl6, [room.cap.x, Y0 + 1.0, room.cap.z], [room.gate.x - 0.4, Y0 + 4.3, R.z - HD + 0.5], 0.035, '#5a5e66', 0.004).add(GG.cyl, room.gate.x - 0.4, Y0 + 4.3, R.z - HD + 0.5, 0.22, 0.12, 0.22, '#3a3f48', { rx: Math.PI / 2, ink: 0.008 }); kc.build(g);
    }
    // 1 · the Cistern: water over the right half, the lever on a ledge at the far right, the grate over the stairs at the back left
    {
      const room = rooms[1], R = room.R, g = room.g, k = Kit();
      room.pool = { x: R.x + 2.8, z: R.z + 0.4, w: 6.6, d: 8.6 };
      const water = new THREE.Mesh(new THREE.PlaneGeometry(room.pool.w, room.pool.d), mats().water); water.rotation.x = -Math.PI / 2; water.position.set(room.pool.x, Y0 + 0.04, room.pool.z); g.add(water); room.water = water;
      for (const s of [-1, 1]) k.box(room.pool.x - room.pool.w / 2 - 0.12, Y0 + 0.12, room.pool.z, 0.24, 0.24, room.pool.d, '#6f6556', { ink: 0.01 }).box(room.pool.x, Y0 + 0.12, room.pool.z + s * (room.pool.d / 2 + 0.12), room.pool.w, 0.24, 0.24, '#6f6556', { ink: 0.01 });
      WORLD.extra.push({ obox: 1, x: room.pool.x, z: room.pool.z, hw: room.pool.w / 2, hd: room.pool.d / 2, rot: 0 });
      // the lever on its ledge across the water
      room.lever = { x: R.x + 6.0, z: R.z - 3.8 };
      k.box(room.lever.x, Y0 + 0.5, room.lever.z, 1.4, 1.0, 1.4, '#7d7262', { ink: 0.015 });
      const lv = grp(g, room.lever.x, Y0 + 1.0, room.lever.z), lk = Kit();
      lk.box(0, 0.05, 0, 0.5, 0.12, 0.36, '#3a3f48', { ink: 0.008 }).add(GG.cyl6, 0, 0.42, 0, 0.05, 0.74, 0.05, '#5a5e66', { ink: 0.006 }).add(GG.sphere, 0, 0.82, 0, 0.11, 0.11, 0.11, '#e2574c', { ink: 0.008 });
      lk.build(lv); lv.rotation.z = 0.6; room.leverG = lv;
      // the stairs behind a grate, at the back left
      room.stairs = { x: R.x - 3.8, z: R.z - HD + 0.4 };
      doorway(g, room.stairs.x, 1.7, 2.6);
      for (let i = 0; i < 4; i++) k.box(room.stairs.x, Y0 + 0.15 + i * 0.3, R.z - HD + 1.4 - i * 0.28, 1.6, 0.3, 0.28, '#8a8070', { ink: 0.012 });
      const gr = grp(g, room.stairs.x, Y0, R.z - HD + 0.3), gk = Kit();
      for (let i = 0; i < 5; i++) gk.add(GG.cyl6, -0.7 + i * 0.35, 1.3, 0, 0.05, 2.6, 0.05, '#3a3f48', { ink: 0.006 });
      for (const y of [0.6, 1.9]) gk.box(0, y, 0, 1.7, 0.07, 0.07, '#3a3f48', { ink: 0.006 });
      gk.build(gr); room.grate = gr;
      room.grateSolid = { obox: 1, x: room.stairs.x, z: R.z - HD + 0.5, hw: 0.95, hd: 0.3, rot: 0 }; WORLD.extra.push(room.grateSolid);
      for (let i = 0; i < 3; i++) k.add(GG.cyl, R.x - 5.6 + i * 0.9, Y0 + 0.5, R.z + 3.8, 0.4, 1.0, 0.4, '#8a5a3a', { ink: 0.012 });
      seaWindow(g, R.x + 1.4, R.z - HD + 0.04, 1.4, 0.9, Y0 + 3.6);
      k.build(g);
      WORLD.extra.push({ obox: 1, x: R.x - 4.7, z: R.z + 3.8, hw: 1.4, hd: 0.5, rot: 0 });
    }
    // 2 · the Signal Loft: signal flags, the gulls' round window, the rope ladder rolled up on the high beam
    {
      const room = rooms[2], R = room.R, g = room.g, k = Kit();
      room.nest = { x: R.x + 3.4, z: R.z - HD + 0.5 };
      // the round window where the gulls sit (a painted card in a ring)
      seaWindow(g, room.nest.x, R.z - HD + 0.04, 1.5, 1.5, Y0 + 3.2);
      k.add(GG.cyl, room.nest.x, Y0 + 3.2, R.z - HD + 0.12, 0.95, 0.2, 0.95, '#7a6a52', { rx: Math.PI / 2, ink: 0.015 });
      for (let i = 0; i < 3; i++) k.add(GG.sphere, room.nest.x - 0.5 + i * 0.5, Y0 + 2.35, R.z - HD + 0.4, 0.16, 0.12, 0.26, '#f4efe2', { ink: 0.008 });
      // signal flags on a line, a brass telescope on a stand, a chart table
      for (let i = 0; i < 7; i++) k.box(R.x - 5 + i * 1.1, Y0 + 4.2 - Math.sin(i / 6 * Math.PI) * 0.4, R.z - HD + 0.5, 0.6, 0.6, 0.03, ['#e2574c', '#f2c94c', '#4c7fd8', '#f4efe2', '#5fb257', '#2b2235', '#e2574c'][i], { ink: 0.006 });
      k.add(GG.cyl6, R.x - 3.6, Y0 + 0.6, R.z - 2.4, 0.06, 1.2, 0.06, '#5a3a24', { ink: 0.006 }).add(GG.cyl, R.x - 3.6, Y0 + 1.3, R.z - 2.4, 0.09, 0.9, 0.09, '#d9a43c', { rz: 1.2, ink: 0.008 });
      k.box(R.x - 1.2, Y0 + 0.75, R.z + 2.6, 2.4, 0.12, 1.4, '#8a6440', { ink: 0.012 }).box(R.x - 1.2, Y0 + 0.82, R.z + 2.6, 1.8, 0.02, 1.0, '#f4e3c4', { ink: 0 });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.add(GG.cyl6, R.x - 1.2 + sx * 1.05, Y0 + 0.37, R.z + 2.6 + sz * 0.55, 0.05, 0.74, 0.05, '#5a3a24', { ink: 0 });
      // the high beam, and the hatch above it
      room.ladder = { x: R.x + 0.4, z: R.z - 3.6 };
      k.box(room.ladder.x, Y0 + 4.6, room.ladder.z, 2.4, 0.3, 0.4, '#5a3a24', { ink: 0.02 });
      const hatch = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.4), mats().hole); hatch.rotation.x = Math.PI / 2; hatch.position.set(room.ladder.x, Y0 + WH - 0.02, room.ladder.z); g.add(hatch);
      k.build(g);
      WORLD.extra.push({ obox: 1, x: R.x - 1.2, z: R.z + 2.6, hw: 1.25, hd: 0.75, rot: 0 }, { x: R.x - 3.6, z: R.z - 2.4, r: 0.35 });
      // the rope ladder: rolled up on the beam until the gulls pull it down (scaled in y from the top)
      const lg = grp(g, room.ladder.x, Y0 + 4.5, room.ladder.z), lk = Kit();
      for (const s of [-0.4, 0.4]) lk.add(GG.cyl6, s, -2.25, 0, 0.04, 4.5, 0.04, '#c9a46a', { ink: 0.004 });
      for (let i = 0; i < 9; i++) lk.box(0, -0.3 - i * 0.48, 0, 0.86, 0.06, 0.1, '#8a6440', { ink: 0.006 });
      lk.build(lg); lg.scale.y = 0.06; room.ladderG = lg;
      const roll = grp(g, room.ladder.x, Y0 + 4.4, room.ladder.z), rk = Kit(); rk.add(GG.cyl, 0, 0, 0, 0.22, 1.0, 0.22, '#c9a46a', { rz: Math.PI / 2, ink: 0.008 }); rk.build(roll); room.roll = roll;
    }
    // 3 · the Bell Tower: the harbor bell in its frame, the giant crab asleep beside it, the sky all round
    {
      const room = rooms[3], R = room.R, g = room.g, k = Kit();
      seaWindow(g, R.x - 4.0, R.z - HD + 0.04, 1.8, 1.3); seaWindow(g, R.x + 4.2, R.z - HD + 0.04, 1.8, 1.3);
      const bx = R.x + 0.6, bz = R.z - 2.4;
      for (const s of [-1, 1]) k.add(GG.cyl6, bx + s * 1.6, Y0 + 2.2, bz, 0.18, 4.4, 0.18, '#6b4a30', { ink: 0.02 });
      k.box(bx, Y0 + 4.45, bz, 3.8, 0.34, 0.4, '#5a3a24', { ink: 0.02 });
      k.build(g);
      WORLD.extra.push({ obox: 1, x: bx, z: bz, hw: 1.9, hd: 0.55, rot: 0 });
      const piv = grp(g, bx, Y0 + 4.3, bz), bell = new THREE.Group(); piv.add(bell);
      const lp = [[0.86, -1.92], [0.84, -1.8], [0.56, -1.2], [0.42, -0.4], [0.24, 0]].map(([x, y]) => new THREE.Vector2(x, y));      // (bottom up: the faces turn outward)
      const bellMat = new THREE.MeshToonMaterial({ color: '#8f8c9a', gradientMap: TK.grad });
      const bm = new THREE.Mesh(new THREE.LatheGeometry(lp, 24), bellMat); bm.castShadow = true; bell.add(bm);
      bell.add(part(GEO.sphere, '#5f5c6a', [0, -1.85, 0], [0.16, 0.16, 0.16], { ink: 0.01 }));
      const rope = part(GEO.cyl, '#c9a46a', [0.0, -2.6, 0.0], [0.04, 1.6, 0.04], { ink: 0 }); bell.add(rope);
      room.bell = { piv, bell, mat: bellMat, x: bx, z: bz, swing: 0 };
      // the giant crab (BATTLE's model if there is one), asleep beside the bell, an old admiral's hat on its shell
      let boss = null;
      if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) { try { boss = BATTLE.buildFoe('crab', 'red', { size: 'big', giant: true, mood: 'asleep' }); } catch (e) { console.warn('[portfort] boss model', e); boss = null; } }
      if (boss) { boss.scale.setScalar(2.4); boss.position.set(R.x - 2.6, Y0, R.z - 1.6); boss.rotation.y = 0.5; g.add(boss); }
      else { boss = grp(g, R.x - 2.6, Y0, R.z - 1.6); const sk = Kit(); sk.add(GG.sphere, 0, 0.7, 0, 1.1, 0.55, 0.8, '#d9604c', { ink: 0.03 }); sk.build(boss); }
      const hat = new THREE.Group(), hk = Kit();
      hk.add(GG.sphere, 0, 0, 0, 0.62, 0.26, 0.22, '#2b2b3a', { ink: 0.012 }).box(0, 0.02, 0.0, 1.2, 0.08, 0.26, '#2b2b3a', { ink: 0.01 }).add(GG.sphere, 0, 0.1, 0.2, 0.08, 0.08, 0.04, '#e6b54a', { ink: 0 });
      hk.build(hat); hat.position.set(R.x - 2.74, Y0 + 1.68, R.z - 1.86); hat.rotation.y = 0.5; g.add(hat); room.hat = hat;
      room.boss = boss; room.bossSolid = { x: R.x - 2.6, z: R.z - 1.6, r: 1.5 }; WORLD.extra.push(room.bossSolid);
      // Noa's page (it flutters down after the fight)
      room.page = grp(g, R.x + 4.6, Y0, R.z + 1.8); room.page.visible = false;
      room.page.add(part(GEO.box, '#8a5f3e', [0, 0.65, 0], [0.16, 1.3, 0.16], { ink: 0 }));
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ color: '#fffaf0', side: THREE.DoubleSide })); sheet.position.set(0, 1.05, 0.1); sheet.rotation.z = 0.08; room.page.add(sheet);
      const pg = glow('#fff3b0', 1.3, 0.5); pg.position.set(0, 1.05, 0.15); room.page.add(pg); room.pageGlow = pg;
    }
    applyState();
  }
  // after a load: each room as the saved progress says
  function applyState() {
    const st = S(), r0 = rooms[0], r1 = rooms[1], r2 = rooms[2], r3 = rooms[3];
    if (st.cap) { r0.port.position.y = Y0 + 2.7; unsolid(r0.portSolid); }
    if (st.lever) { r1.leverG.rotation.z = -0.6; r1.grate.position.y = Y0 + 2.5; unsolid(r1.grateSolid); r1.water.position.y = Y0 - 0.12; }
    if (st.ladder) { r2.ladderG.scale.y = 1; r2.roll.visible = false; }
    if (st.boss) { if (r3.boss) r3.boss.visible = false; r3.hat.visible = false; unsolid(r3.bossSolid); r3.page.visible = !st.page; }
    if (st.bell) r3.bell.mat.color.set('#e6b54a');
  }

  // ---------------------------------------------------------------- telling Mimo (the verb is the key, as in the mill and the ice tower)
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${G.state.mimoName} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  // t: { kind, verb (or verbs: [the ones that work]), icon, title, hint, right(verb), at() }
  async function tell(t) {
    const ok = (t.verbs || [t.verb]).filter(has);
    let verb = quick[t.kind] || null, ms = 0;
    if (!verb) {
      const r = await UI.command({ name: G.state.mimoName, icon: t.icon, title: t.title, verbs: verbs(), answer: ok[0] });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); G.sim.mimo.tiltT = 1.4; STORY.think('{mimo} tilts its head. ' + t.hint, 4.5); return; }
      verb = r.verb; ms = r.ms;
      if (ok.includes(verb)) quick[t.kind] = verb;
    }
    if (ok.includes(verb) || LEX.taught(verb)) learnUse(verb, ms);
    if (!ok.includes(verb)) { await wrong(t, verb); return; }
    await t.right(verb);
  }
  async function wrong(t, verb) {
    const M = G.sim.mimo, at = t.at ? t.at() : { x: G.sim.you.x, z: G.sim.you.z };
    G.sim.mimoGo({ x: at.x + 1.1, z: at.z + 1.1 }, at); await wait(0.6);
    const say = s => STORY.think(s, 3.5);
    if (verb === 'v.jump') { M.hop = { t: 0 }; Sound.play('jump'); say('{mimo} hops up and down. Nothing happens.'); }
    else if (verb === 'v.hit') { Sound.play('hit'); M.sad = 1.2; say('{mimo} bonks it. Ouch! Old sea stone is hard.'); }
    else if (verb === 'v.throw') { Sound.play('whiff'); say('{mimo} throws a shell at it. Clink. Nothing.'); }
    else if (verb === 'v.push') { Sound.play('land', 6); say('{mimo} pushes with all its might. It doesn’t budge.'); }
    else if (verb === 'v.swim') say('{mimo} looks for water to swim in. Not here.');
    else if (verb === 'v.sing') { Sound.play('sing'); say('{mimo} sings. The fort echoes… but nothing changes.'); }
    else if (verb === 'v.blow') { Sound.play('blow'); say('{mimo} blows and blows. Only a little seaweed flutters.'); }
    else if (verb === 'v.climb') say('{mimo} looks for something to climb. Not here.');
    else if (verb === 'v.call') { Sound.play('chirp'); say('{mimo} calls. A gull answers from far off… but nothing changes here.'); }
    else if (verb === 'v.eat') say('{mimo} sniffs it… and decides it isn’t food.');
    G.sim.mimoGo(null, null);
  }
  async function mimoArc(to, y1, dur = 0.7) {
    const M = G.sim.mimo, root = G.cast.mimo.root, p0 = root.position.clone();
    M.hidden = true;
    await tween(dur, k => { root.position.set(lerp(p0.x, to.x, k), lerp(p0.y, y1, k) + Math.sin(k * Math.PI) * 1.3, lerp(p0.z, to.z, k)); });
    Sound.play('pip');
  }
  async function mimoLand() {
    const M = G.sim.mimo, Y = G.sim.you, root = G.cast.mimo.root, p0 = root.position.clone(), to = { x: Y.x + 1.1, z: Y.z + 0.6 };
    await tween(0.55, k => { root.position.set(lerp(p0.x, to.x, k), lerp(p0.y, Y0, k) + Math.sin(k * Math.PI) * 0.8, lerp(p0.z, to.z, k)); });
    M.x = to.x; M.z = to.z; M.y = M.ry = Y0; M.hidden = false; M.land = 0; Sound.play('land', 4);
  }
  // the gulls (a little flock of their own, in here): in through the window, to a spot, and away
  let flock = null;
  function ensureFlock() {
    if (flock) return flock;
    const { merge, M4 } = TK, n = 5, sph = new THREE.SphereGeometry(1, 8, 6), box = new THREE.BoxGeometry(1, 1, 1);
    const body = merge([{ geo: sph, m: M4(0, 0, 0, 0.16, 0.14, 0.34), color: '#fdf8ee' }, { geo: sph, m: M4(0, 0.08, 0.3, 0.11), color: '#fdf8ee' }, { geo: new THREE.ConeGeometry(1, 1, 6), m: M4(0, 0.07, 0.44, 0.03, 0.12, 0.03, 0, Math.PI / 2), color: '#f2b43c' }]);
    const wing = merge([{ geo: box, m: M4(0.31, 0, 0, 0.62, 0.03, 0.26), color: '#e9edf0' }, { geo: box, m: M4(0.6, 0.004, -0.02, 0.1, 0.035, 0.22), color: '#4a4f58' }]);
    // (their own material: never one TK.toon shares with an instanced mesh that has instance colors)
    const mat = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad, vertexColors: true });
    const Bm = new THREE.InstancedMesh(body, mat, n), Wg = new THREE.InstancedMesh(wing, mat, n * 2);
    Bm.frustumCulled = Wg.frustumCulled = false; Bm.visible = Wg.visible = false; G.w3d.scene.add(Bm, Wg);
    return (flock = { Bm, Wg, n, list: Array.from({ length: n }, (_, i) => ({ ph: i * 1.3, r: 0.5 + (i % 3) * 0.25 })), at: null, t: 0, m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), v: new THREE.Vector3(), s: new THREE.Vector3(1, 1, 1), l: new THREE.Matrix4() });
  }
  // fly from a window to a spot ({ x, y, z }) and circle it for `sec`, then away
  async function gullsTo(from, at, sec) {
    const f = ensureFlock(); f.Bm.visible = f.Wg.visible = true;
    const pos = f.list.map(() => ({ x: from.x, y: from.y, z: from.z }));
    const frame = (k, center, spread) => {
      f.list.forEach((o, i) => {
        const a = f.t * 2.2 + o.ph, x = lerp(pos[i].x, center.x + Math.cos(a) * o.r * spread, k), y = lerp(pos[i].y, center.y + Math.sin(f.t * 3 + i) * 0.15, k), z = lerp(pos[i].z, center.z + Math.sin(a) * o.r * spread, k);
        const yaw = a + Math.PI / 2, flap = Math.sin(f.t * 14 + i) * 0.6;
        f.m.compose(f.v.set(x, y, z), f.q.setFromEuler(f.e.set(0, yaw, 0)), f.s.set(1, 1, 1)); f.Bm.setMatrixAt(i, f.m);
        for (const sd of [1, -1]) { f.l.makeRotationZ(sd > 0 ? flap : Math.PI - flap).setPosition(sd * 0.1, 0.06, 0); f.Wg.setMatrixAt(i * 2 + (sd > 0 ? 0 : 1), f.l.premultiply(f.m)); }
      });
      f.Bm.instanceMatrix.needsUpdate = f.Wg.instanceMatrix.needsUpdate = true;
    };
    for (let k = 0; k < 6; k++) setTimeout(() => Sound.play('chirp'), k * 260);
    await tween(1.1, k => { f.t += 1 / 60; frame(k, at, 1); });
    await tween(sec, () => { f.t += 1 / 60; frame(1, at, 1); });
    f.list.forEach((o, i) => { pos[i] = { x: at.x, y: at.y, z: at.z }; });
    return () => (async () => { await tween(0.9, k => { f.t += 1 / 60; frame(k, { x: from.x, y: from.y + 0.5, z: from.z }, 1 - k); }); f.Bm.visible = f.Wg.visible = false; })();
  }

  // ---------------------------------------------------------------- what you can press E on, room by room
  function interactables() {
    const list = [], st = S(), room = rooms[cur]; if (!room) return list;
    const R = room.R, name = G.state.mimoName, y = Y0;
    const say = kind => (quick[kind] ? `«${ex(LEX.form(quick[kind]))}»` : `Tell ${name}`);
    list.push({ x: R.x - 4.5, z: R.z + HD - 0.9, y, r: 1.6, label: cur === 0 ? 'Leave the fort' : 'Go back down', run: () => (cur === 0 ? leave() : go(cur - 1, 'above')) });
    if (cur === 0) {
      if (!st.cap) list.push({ x: room.cap.x + 1.2, z: room.cap.z + 1.2, y, r: 2.6, label: say('cap'), run: () => tell({ kind: 'cap', verb: 'v.push', icon: 'push', at: () => room.cap,
        title: `The inner gate is barred by a portcullis. Its chain runs over a pulley down to a big wooden capstan. What should ${name} do?`, hint: 'A capstan turns when you lean on its bars…', right: turnCapstan }) });
      else list.push({ x: room.gate.x, z: room.gate.z + 1.3, y, r: 2.2, label: 'Go through the gate', run: () => go(1) });
    }
    if (cur === 1) {
      if (!st.lever) list.push({ x: room.pool.x - room.pool.w / 2 - 0.7, z: room.pool.z - 1.0, y, r: 2.6, label: say('pool'), run: () => tell({ kind: 'pool', verb: 'v.swim', icon: 'swim', at: () => ({ x: room.pool.x - room.pool.w / 2, z: room.pool.z }),
        title: `The stairs are behind a grate. Its lever is on a ledge across the flooded floor. What should ${name} do?`, hint: 'Lalo, at the lake, showed {mimo} how to cross water…', right: swimLever }) });
      else list.push({ x: room.stairs.x, z: room.stairs.z + 1.6, y, r: 2.0, label: 'Go up the stairs', run: () => go(2) });
    }
    if (cur === 2) {
      if (!st.ladder) list.push({ x: room.ladder.x, z: room.ladder.z + 1.9, y, r: 2.6, label: say('ladder'), run: () => tell({ kind: 'ladder', verb: 'v.call', icon: 'gull', at: () => ({ x: room.ladder.x, z: room.ladder.z + 1 }),
        title: `The rope ladder up to the top is rolled up on a beam, much too high. Gulls are sitting in the round window. What should ${name} do?`, hint: 'The gulls came down for Marino when he… did what?', right: callLadder }) });
      else list.push({ x: room.ladder.x, z: room.ladder.z + 0.9, y, r: 2.0, label: 'Climb up', run: () => go(3) });
    }
    if (cur === 3) {
      if (!st.boss) list.push({ x: room.bossSolid.x + 1.6, z: room.bossSolid.z + 2.2, y, r: 2.8, label: say('wake'), run: () => tell({ kind: 'wake', verbs: ['v.call', 'v.hit', 'v.throw', 'v.push', 'v.sing', 'v.blow'], icon: 'crab', at: () => room.bossSolid,
        title: `A giant crab is asleep round the harbor bell, wearing an old admiral’s hat. Gulls circle outside the window. What should ${name} do?`, hint: 'Something has to wake it up…', right: wakeBoss }) });
      else if (!st.page) list.push({ x: room.page.position.x, z: room.page.position.z + 0.6, y, r: 2.0, label: 'Read', run: readPage });
      else if (!st.bell) list.push({ x: room.bell.x, z: room.bell.z + 2.2, y, r: 2.8, label: say('bell'), run: () => tell({ kind: 'bell', verbs: ['v.hit', 'v.call', 'v.throw'], icon: 'bell', at: () => ({ x: room.bell.x, z: room.bell.z + 1.4 }),
        title: `The harbor bell hangs silent, its rope swinging. What should ${name} do?`, hint: 'A bell rings when something strikes it… or when someone pulls its rope.', right: ringBell }) });
    }
    return list;
  }
  // where the compass points inside: the next thing to do in this room
  function target() {
    const st = S(), room = rooms[cur]; if (!room) return null;
    const at = (o, hint) => (o ? { x: o.x, z: o.z, hint } : null);
    if (cur === 0) return !st.cap ? at(room.cap, '{mimo} points at the big wooden capstan.') : at(room.gate, '{mimo} points at the open gate!');
    if (cur === 1) return !st.lever ? at(room.lever, '{mimo} looks across the water at the lever.') : at(room.stairs, '{mimo} points up the stairs!');
    if (cur === 2) return !st.ladder ? at(room.ladder, '{mimo} looks up at the rolled-up ladder… and at the gulls.') : at(room.ladder, '{mimo} points up the ladder!');
    if (cur === 3) return !st.boss ? at(room.bossSolid, '{mimo} stares at the giant crab.') : !st.page ? at(room.page.position, '{mimo} points at the page.') : at(room.bell, '{mimo} looks at the bell.');
    return null;
  }

  // ---------------------------------------------------------------- the actions
  async function turnCapstan() {
    const room = rooms[0], st = S(), M = G.sim.mimo, R = room.R;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x + 1.2, Y0 + 4.0, R.z + 6.2), look: V(R.x + 1.0, Y0 + 1.4, R.z - 2.4), dur: 0.8 };
    G.sim.mimoGo({ x: room.cap.x + 1.0, z: room.cap.z + 0.4 }, room.cap); await wait(0.7);
    for (let k = 0; k < 2; k++) { Sound.play('land', 8 + k * 3); M.hop = { t: 0 }; await wait(0.3); }
    Sound.play('gears');
    await tween(2.2, u => { room.capG.rotation.y = -u * Math.PI * 1.5; room.port.position.y = Y0 + u * 2.7; if (Math.random() < 0.1) Sound.play('click'); });
    unsolid(room.portSolid); solved();
    st.cap = true; G.cam.override = null; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    UI.toast('Clank, clank! The capstan turns, and the portcullis rises.');
  }
  async function swimLever() {
    const room = rooms[1], st = S(), M = G.sim.mimo, root = G.cast.mimo.root, Lv = room.lever, R = room.R;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x + 0.6, Y0 + 4.2, R.z + 6.8), look: V(R.x + 3.4, Y0 + 0.6, R.z - 1.4), dur: 0.8 };
    const sx = room.pool.x - room.pool.w / 2 - 0.3, sz = room.pool.z - 1.0;
    G.sim.mimoGo({ x: sx - 0.4, z: sz }, Lv); await wait(0.6);
    M.hidden = true; Sound.play('jump');
    const p0 = root.position.clone(), wy = Y0 + 0.02, end = { x: Lv.x - 0.9, z: Lv.z + 0.6 };
    await tween(1.6, k => { root.position.set(lerp(p0.x, end.x, k), wy - 0.1 + Math.sin(k * 24) * 0.04, lerp(p0.z, end.z, k)); root.rotation.set(0.35, Math.atan2(end.x - p0.x, end.z - p0.z), 0); if (Math.random() < 0.25) G.w3d.fx.puff(root.position.x, wy + 0.05, root.position.z, 2, 0.12, '#dff2fb'); });
    root.rotation.set(0, 0, 0);
    await tween(0.4, k => { root.position.y = lerp(wy, Y0 + 1.0, k) + Math.sin(k * Math.PI) * 0.4; });
    Sound.play('pip');
    await tween(0.5, k => { room.leverG.rotation.z = lerp(0.6, -0.6, k); }); Sound.play('click'); Sound.play('gears');
    await tween(1.3, k => { room.grate.position.y = Y0 + k * 2.5; room.water.position.y = Y0 + 0.04 - k * 0.16; });
    unsolid(room.grateSolid); solved();
    // back across, and out
    await tween(1.4, k => { root.position.set(lerp(end.x, p0.x, k), wy - 0.1 + Math.sin(k * 24) * 0.04, lerp(end.z, p0.z, k)); });
    M.x = p0.x; M.z = p0.z; M.y = M.ry = Y0; M.hidden = false; Sound.play('land', 4);
    st.lever = true; G.cam.override = null; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    UI.toast('Clunk! The grate over the stairs slides up.');
  }
  async function callLadder() {
    const room = rooms[2], st = S(), M = G.sim.mimo, R = room.R, L = room.ladder;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x - 1.2, Y0 + 3.6, R.z + 5.6), look: V(L.x + 0.8, Y0 + 3.4, L.z), dur: 0.8 };
    G.sim.mimoGo({ x: L.x - 0.6, z: L.z + 1.8 }, { x: L.x, z: L.z }); await wait(0.5);
    M.hop = { t: 0 }; Sound.play('chirp');
    const away = await gullsTo({ x: room.nest.x, y: Y0 + 3.2, z: room.nest.z + 0.4 }, { x: L.x, y: Y0 + 4.6, z: L.z + 0.2 }, 0.8);
    Sound.play('whiff');
    await tween(0.9, k => { room.ladderG.scale.y = lerp(0.06, 1, k * k); room.roll.scale.setScalar(1 - k); });
    room.roll.visible = false; Sound.play('land', 6); solved();
    await away();
    st.ladder = true; G.cam.override = null; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    UI.toast('The gulls pull the rope ladder down. The way to the top is open!');
  }
  async function wakeBoss(verb) {
    const room = rooms[3], st = S(), R = room.R, b = room.boss;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x + 1.8, Y0 + 3.4, R.z + 5.8), look: V(R.x - 2.2, Y0 + 1.8, R.z - 1.6), dur: 0.8 };
    G.sim.mimoGo({ x: R.x - 1.0, z: R.z + 1.2 }, room.bossSolid); await wait(0.6);
    if (verb === 'v.call') { const away = await gullsTo({ x: R.x - 4.0, y: Y0 + 3.1, z: R.z - HD + 0.4 }, { x: R.x - 2.6, y: Y0 + 2.3, z: R.z - 1.6 }, 1.2); Sound.play('hit'); away(); }
    else { Sound.play(verb === 'v.sing' ? 'sing' : verb === 'v.blow' ? 'blow' : 'hit'); await wait(0.6); }
    if (b && b.userData) b.userData.mood = 'alert';
    Sound.play('screech');
    await tween(0.7, k => { if (b) b.rotation.z = Math.sin(k * Math.PI * 6) * 0.08; });
    G.w3d.fx.puff(R.x - 2.6, Y0 + 1.8, R.z - 1.6, 14, 0.35, '#c9d3dc');
    const CN = { es: 'el Gran Cangrejo', pt: 'o Caranguejão', de: 'die Riesenkrabbe', zh: '大螃蟹', ja: '大ガニ', en: 'the Great Crab' };
    const crab = { id: 'giantcrab', name: CN[lang()] || CN.en, x: R.x - 2.6, y: Y0 + 1.6, z: R.z - 1.6, top: 2.6 };
    await sayT(crab, FL['k.wake'], { demo: WAKE_MARK });      // (heard whole, its weak spot in it: «por delante… de hierro»)
    await STORY.you('From the front it’s made of iron… then hit it from behind, {mimo}! And if the {w.gull:pl} make it turn round…');
    G.cam.override = null; G.sim.lock = 0;
    const r = await G.fight({ foes: [{ kind: 'crab', color: 'red', size: 'big', giant: 2.2, hp: 28 }, { kind: 'crab', color: 'blue', size: 'small' }, { kind: 'crab', color: 'yellow', size: 'small' }], place: FIGHT_AT, boss: 'crab' });
    if (!r || r.outcome !== 'win') {
      if (b && b.userData) b.userData.mood = 'asleep';
      STORY.think(r && r.outcome === 'lose' ? 'Ouch… The giant crab curls back round the bell and dozes off. Catch your breath, then try again.' : 'The giant crab curls back round the bell.', 5);
      return;
    }
    st.boss = true;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x + 1.8, Y0 + 3.4, R.z + 5.8), look: V(R.x - 2.2, Y0 + 1.8, R.z - 1.6), dur: 0.01 };
    if (b && b.userData) b.userData.mood = 'happy';
    await sayT(crab, FL['k.after']);
    // it scuttles off sideways, out of the window, its hat left behind on the floor
    Sound.play('swoosh');
    await tween(1.1, k => { if (b) { b.position.x = R.x - 2.6 - k * 5; b.rotation.z = Math.sin(k * 30) * 0.05; } room.hat.position.y = lerp(Y0 + 1.68, Y0 + 0.1, Math.min(1, k * 1.6)); });
    if (b) b.visible = false; unsolid(room.bossSolid);
    G.w3d.fx.puff(R.x - 6, Y0 + 1.2, R.z - 1.6, 16, 0.4, '#c9d3dc'); Sound.play('learned');
    await wait(0.4);
    room.page.visible = true; Sound.play('page');
    G.cam.override = null; G.sim.lock = 0;
    await STORY.you('Something fluttered down from the rafters. A page from Noa’s notebook!');
    G.save();
  }
  async function readPage() {
    const room = rooms[3], st = S();
    Sound.play('page');
    await UI.page('page.port', 'w.fort');
    st.page = true; room.page.visible = false;
    if (!G.state.pages.includes('page.port')) G.state.pages.push('page.port');
    await STORY.you('Noa sailed to the Sunken Ruins, on the south-east coast… We’re right behind you, Noa! First: the {w.bell}.');
    G.save();
  }
  async function ringBell(verb) {
    const room = rooms[3], bl = room.bell, st = S(), M = G.sim.mimo, R = room.R;
    G.sim.lock = 1;
    G.cam.override = { pos: V(bl.x + 4.2, Y0 + 2.8, bl.z + 6.0), look: V(bl.x, Y0 + 2.6, bl.z), dur: 0.8 };
    if (verb === 'v.call') { const away = await gullsTo({ x: R.x + 4.2, y: Y0 + 3.1, z: R.z - HD + 0.4 }, { x: bl.x, y: Y0 + 1.6, z: bl.z + 0.3 }, 0.6); away(); }
    else if (verb === 'v.throw') {
      G.sim.mimoGo({ x: bl.x + 0.6, z: bl.z + 3.0 }, bl); await wait(0.7);
      const ball = part(GEO.sphere, '#f4e3d0', [0, 0, 0], [0.12, 0.08, 0.1], { ink: 0.01 }); G.w3d.scene.add(ball);
      const p0 = V(M.x, Y0 + 0.9, M.z), p1 = V(bl.x, Y0 + 3.0, bl.z + 0.3);
      M.hop = { t: 0 }; Sound.play('whiff');
      await tween(0.5, k => { ball.position.set(lerp(p0.x, p1.x, k), lerp(p0.y, p1.y, k) + Math.sin(k * Math.PI) * 1.2, lerp(p0.z, p1.z, k)); });
      G.w3d.scene.remove(ball);
    } else {
      G.sim.mimoGo({ x: bl.x + 0.5, z: bl.z + 1.5 }, bl); await wait(0.6);
      await mimoArc({ x: bl.x + 0.4, z: bl.z + 0.8 }, Y0 + 2.4, 0.6);
      Sound.play('hit');
    }
    bl.mat.color.set('#e6b54a');
    for (let k = 0; k < 3; k++) { Sound.play('bigbell'); bl.swing = 0.4; G.w3d.fx.sparkle(bl.x, Y0 + 3.0, bl.z + 0.4, 18, ['#ffd166', '#fff3a0', '#ffffff']); await wait(1.0); }
    if (verb === 'v.hit' || (verb !== 'v.call' && verb !== 'v.throw')) await mimoLand();
    st.bell = true;
    await wait(0.4);
    G.cam.override = null; G.sim.lock = 0;
    await finale();
  }
  // outside again: the harbor bell rings over the bay, the whole city answers, the color comes back: the sixth bell of eight.
  // Then Tere, awake now, rows you back to the ferry pier.
  async function finale() {
    await UI.fade(1, 700);
    hideAll(); inside = false; G.w3d.setInterior(null);
    const f = G.state.flags, SP = PORT.SPOT;
    f.portFree = true; f.bells = Math.max(6, f.bells || 0);
    const pst = G.state.port || (G.state.port = {}); pst.boatAt = 'pier';
    const B = PORT.built;
    if (B) { B.setBoat(SP.boatPier, 0); B.setBell(true); }
    if (PORT.sync) PORT.sync();
    if (PORT.liftPatch) PORT.liftPatch('port', false);
    teleport(SP.pierEnd.x, SP.pierEnd.z, -Math.PI / 2);
    if (B) for (const p of B.people) p.look = { x: PORT.FORT.x, z: PORT.FORT.z };
    G.sim.lock = 1;
    G.cam.override = { pos: V(-232.0, 6.5, -79.5), look: V(PORT.FORT.x, PORT.FORT.y + 10, PORT.FORT.z), dur: 0.01 };
    G.cam.snap(-Math.PI / 2, 0.3, 9);
    await UI.fade(0, 900);
    for (let k = 0; k < 6; k++) { Sound.play('bigbell'); if (B) B.ringBell(); if (k > 1) Sound.play('chime'); if (B && B.gullsTo && k === 1) B.gullsTo({ x: PORT.FORT.x, y: PORT.FORT.y + 13, z: PORT.FORT.z, r: 3.5 }, 13); await wait(1.0); }
    await UI.chapter('The sixth bell', '6 of 8 · Port Brisa sings again');
    if (B && B.gullsTo) B.gullsTo(null);
    G.cam.override = null; G.sim.lock = 0;
    if (B) for (const p of B.people) p.look = null;
    const tere = B && B.objects.tere;
    if (tere && PORT.sayT) { const at = { id: 'tere', name: 'Tere', x: B.boat.x, y: 0.4, z: B.boat.z, top: 1.8, set() {} }; await PORT.sayT(at, PORT.LINES['te.free']); }
    await STORY.you('Listen… the whole city is answering the {w.bell}! Six bells down, two to go. Tere rowed us back: let’s tell Dora.');
    G.save();
  }

  // ---------------------------------------------------------------- moving between rooms, in and out
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    // (a wander spot or station left in the room behind would make Mimo «poof» straight back there)
    Y.x = x; Y.z = z; Y.yaw = yaw; M.x = x + 1.1; M.z = z + 0.8; M.hidden = false; M.wander = null; M.station = null; M.look = null; G.sim.snap();
  }
  function show(i) { rooms.forEach((r, k) => { r.g.visible = k === i; }); cur = i; quick = {}; }
  function hideAll() { rooms.forEach(r => { r.g.visible = false; }); cur = -1; quick = {}; }
  async function enter() {
    build();
    await UI.fade(1, 450);
    inside = true; G.w3d.setInterior({ fog: '#d5dfe4', near: 14, far: 40 });
    show(0); const R = ROOMS[0]; teleport(R.x - 4.5, R.z + 3.6, Math.PI); G.cam.snap(Math.PI, 0.66, 10.5);
    await UI.fade(0, 450);
    const st = S();
    if (!st.seen0) {
      st.seen0 = true; UI.chapter('The Sea Fort', 'Port Brisa · the harbor bell is at the very top');
      if (!st.ambush0) {
        await wait(1.2);
        Sound.play('screech');
        await STORY.you('{w.crab:pl}! Lots of them… Remember Omar, {mimo}: from behind!');
        const r = await G.fight({ foes: [{ kind: 'crab', color: 'red', size: 'small' }, { kind: 'crab', color: 'green', size: 'small' }, { kind: 'hushling', color: 'blue', size: 'small' }], place: FIGHT_AT });
        if (r && r.outcome === 'win') st.ambush0 = true;
        else { st.seen0 = false; await leave(); return; }
        STORY.think('The inner gate is barred by a portcullis… and its chain runs down to that big capstan.', 4.5);
      }
    }
    G.save();
  }
  async function leave() {
    await UI.fade(1, 450);
    hideAll(); inside = false; G.w3d.setInterior(null);
    teleport(OUTSIDE.x, OUTSIDE.z, OUTSIDE.yaw); G.cam.snap(Math.PI / 2, 0.28, 8.5);
    await UI.fade(0, 450);
  }
  async function go(i, from = 'below') {
    await UI.fade(1, 350);
    show(i);
    const R = ROOMS[i], room = rooms[i];
    if (from === 'above') {           // back down from the room above: arrive by its way up
      const at = i === 0 ? { x: room.gate.x - 0.4, z: room.gate.z + 1.6 } : i === 1 ? { x: room.stairs.x + 0.4, z: room.stairs.z + 1.8 } : { x: room.ladder.x - 0.8, z: room.ladder.z + 1.6 };
      teleport(at.x, at.z, 0);
    } else teleport(R.x - 4.5, R.z + 3.6, Math.PI);
    G.cam.snap(Math.PI, 0.66, 10.5);
    await UI.fade(0, 350);
    const st = S();
    if (!st['seen' + i]) {
      st['seen' + i] = true; UI.chapter(R.name, R.sub);
      if (i === 2 && !st.ambush2) {        // the Signal Loft: crabs come scuttling out from under the chart table
        await wait(1.2);
        Sound.play('screech');
        await STORY.you('More {w.crab:pl}! And a big one… From behind, {mimo}!');
        const r = await G.fight({ foes: [{ kind: 'crab', color: 'yellow', size: 'big' }, { kind: 'crab', color: 'blue', size: 'small' }, { kind: 'moth', color: 'red', size: 'small' }], place: FIGHT_AT });
        if (r && r.outcome === 'win') st.ambush2 = true;
        else { st['seen' + i] = false; await go(i - 1, 'above'); return; }
        STORY.think('The rope ladder is rolled up on that high beam… and gulls are watching from the round window.', 4.5);
      }
      if (i === 1) STORY.think('Water covers half the floor. The lever for the stair grate is over there, on the ledge…', 4.5);
      if (i === 3) STORY.think('The top! The harbor bell… and something huge, asleep beside it.', 4.5);
    }
    G.save();
  }

  // ---------------------------------------------------------------- per frame (while inside)
  function update(dt, t) {
    if (!inside || cur < 0) return;
    const room = rooms[cur];
    if (G.sim.lock && !STORY.busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    if (cur === 1 && room.water) room.water.material.opacity = 0.82 + Math.sin(t * 1.4) * 0.04;
    if (cur === 3) {
      const bl = room.bell; bl.swing = damp(bl.swing, 0, 1.0, dt); bl.piv.rotation.x = Math.sin(t * 3.4) * bl.swing;
      if (room.boss && room.boss.visible && room.boss.userData.animate) room.boss.userData.animate(dt, t, 0);
      if (room.page.visible) room.pageGlow.material.opacity = 0.35 + 0.2 * Math.sin(t * 3);
    }
  }
  // the bestiary's line for the boss, and its drops (rewards.js keeps both open for the regions to add to)
  const BOSS_LORE = ['El Gran Cangrejo dormía en la campana del puerto. Por delante es de hierro; por detrás, no.', 'O Caranguejão dormia no sino do porto. Pela frente ele é de ferro; por trás, não.',
    'Die Riesenkrabbe schlief an der Hafenglocke. Von vorne ist sie aus Eisen, von hinten nicht.',
    '[大|dà] [螃蟹|páng xiè] [睡|shuì] [在|zài] [港口|gǎng kǒu] [的|de] [钟|zhōng] [旁边|páng biān] 。 [它|tā] [前面|qián miàn] [是|shì] [铁|tiě] [做|zuò] [的|de] ， [后面|hòu miàn] [不|bú] [是|shì] 。',
    '[大|おお]ガニ は [港|みなと] の [鐘|かね] の そば で [眠|ねむ]って いた 。 [前|まえ] は [鉄|てつ] で 、 [後|うし]ろ は ちがう 。',
    'The Great Crab slept round the harbor bell. From the front it’s iron; from behind, it isn’t.'];
  function init(game) {
    G = game;
    try {
      const RW = BATTLE._ && BATTLE._.RW;
      if (RW && RW.LORE && !RW.LORE['boss:crab']) RW.LORE['boss:crab'] = BOSS_LORE;
      if (RW && RW.BOSS_DROPS && !RW.BOSS_DROPS.crab) RW.BOSS_DROPS.crab = ['w.fish', 'w.cake'];
    } catch (e) { /* (no bestiary) */ }
  }
  return { init, enter, leave, update, interactables, target, ROOMS, OUTSIDE, LINES: FL, PAGE, BOSS_LORE, WAKE_MARK,
    get inside() { return inside; }, get room() { return cur; }, _: { S, build, go, show, rooms, turnCapstan, swimLever, callLadder, wakeBoss, readPage, ringBell, finale } };
})();
