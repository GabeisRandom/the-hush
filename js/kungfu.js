'use strict';
// Master Mei's courtyard (DESIGN.md 14.11): the secret behind the plum painting in Grandma Mei's kitchen (grandma.js).
// zh games only. The user: "you could also add a secret area for her special chinese training where she teaches you chinese
// martial arts if you are learning chinese".
// THE ROOM: a walled courtyard, her old martial-arts school (梅园武馆), floating at (−150, 300, −250) like the other rooms:
// grey flagstones and a red sparring circle, white walls with grey tile caps, a moon gate, a plum tree in bloom shedding petals,
// a rack of wooden staffs, a wooden dummy (木人桩), a drum, and her three sayings on scrolls.
// The way in: the round door behind the painting (grandma.js chapter 5, then "Go in" there). The way out: the little door back
// to her kitchen.
// Five lessons, each one output-first (you type the command, Mimo does it, she corrects you), in order:
//   1 站桩 stances: 马步 / 弓步 (and «低一点！», lower!)        2 招式 moves at the dummy: 出拳 踢腿 转身 跳 推掌
//   3 口诀 sayings: 熟能生巧 · 一心一意 · 欲速则不达, and when to say them      4 套路 the form: a sequence to the drum
//   5 比武 sparring: she calls her attack (看拳！ 扫腿！ 推！ 破绽！) and you tell Mimo the answer (转身 跳 马步 推掌) in time
// Passing the test: Mimo learns «推掌» (palm strike) with the teach box: in zh battles a push with double power
// (battle/flow.js MOVES.palm, registered here; BATTLE._.MOVES and _.VERB_EN are exposed for it). Progress: G.state.kf.
//   KUNGFU.init(game) · as a room (main.js ROOMS): .inside · .OUTSIDE · .interactables() · .update(dt, t) · .enter() · .leave() · ._ (tests)

const KUNGFU = (() => {
  const X0 = -150, Y0 = 300, Z0 = -250, HW = 8, HD = 6.5, WH = 3.0, HALF = Math.PI / 2;
  const INK = '#2b2235', RED = '#c8322a', GOLD = '#e8c35a', PAPER = '#fffaf0';
  let G = null;
  const GK = () => (typeof GRANDMA !== 'undefined' ? GRANDMA.kit : null);
  const L = () => (G && G.state && G.state.lang) || 'es';
  const isZh = () => L() === 'zh';
  const S = () => { const s = G.state; if (!s.kf) s.kf = {}; const o = s.kf; o.L = o.L || {}; return o; };
  const tick = ms => new Promise(r => setTimeout(r, ms));
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const MASTER = '[梅|Méi] [师父|shī fu]';
  const mn = () => (G && G.state && G.state.mimoName) || 'Mimo';

  // ============================================================ the moves and the sayings
  const MOVES = [
    { k: 'mabu', src: '[马步|mǎ bù]', alt: ['[扎马步|zā mǎ bù]', '[蹲|dūn] [马步|mǎ bù]'], en: 'horse stance', icon: 'kf_horse', pose: 'horse', hint: '马 horse + 步 step: sit low, as if riding a horse. The root of every style.' },
    { k: 'gongbu', src: '[弓步|gōng bù]', alt: [], en: 'bow stance', icon: 'kf_bow', pose: 'bow', hint: '弓 a bow (for arrows): the front leg bent, the back leg straight, like a drawn bow.' },
    { k: 'chuquan', src: '[出拳|chū quán]', alt: ['[打拳|dǎ quán]', '[出|chū] [拳头|quán tou]'], en: 'punch', icon: 'kf_punch', pose: 'punch', hint: '出 out + 拳 fist: send the fist out, straight from the waist.' },
    { k: 'titui', src: '[踢腿|tī tuǐ]', alt: ['[踢|tī]'], en: 'kick', icon: 'kf_kick', pose: 'kick', hint: '踢 kick + 腿 leg. 足 (a foot) is on the left of 踢.' },
    { k: 'zhuanshen', src: '[转身|zhuǎn shēn]', alt: ['[转|zhuǎn]'], en: 'turn around', icon: 'kf_turn', pose: 'turn', hint: '转 turn + 身 body: spin out of the way.' },
    { k: 'tiao', src: '[跳|tiào]', alt: ['[跳起来|tiào qǐ lái]'], en: 'jump', icon: 'kf_jump', pose: 'jump', hint: 'You know this one from battles. Here: jump over a sweep!' },
    { k: 'tuizhang', src: '[推掌|tuī zhǎng]', alt: ['[出掌|chū zhǎng]'], en: 'palm strike (push with the palm)', icon: 'kf_palm', pose: 'palm', hint: '推 push + 掌 palm. Master Mei’s favorite: soft hands, strong push.' },
  ];
  const MV = Object.fromEntries(MOVES.map(m => [m.k, m]));
  const SAYINGS = [
    { k: 'shuneng', src: '[熟能生巧|shú néng shēng qiǎo]', lit: 'familiar → becomes → skill', en: 'Practice makes perfect.', when: 'you do something again and again until it’s easy' },
    { k: 'yixin', src: '[一心一意|yī xīn yī yì]', lit: 'one heart, one mind', en: 'Put your whole heart into one thing: focus!', when: 'someone gets distracted' },
    { k: 'yusu', src: '[欲速则不达|yù sù zé bù dá]', lit: 'want speed → then → don’t arrive', en: 'More haste, less speed.', when: 'someone rushes and makes mistakes' },
  ];
  // her attacks in the sparring test, and the answer each one needs
  const ATTACKS = [
    { k: 'quan', call: '[看|kàn] [拳|quán] ！', en: 'Here comes my fist!', answer: 'zhuanshen', why: 'turn out of the way' },
    { k: 'sao', call: '[扫腿|sǎo tuǐ] ！', en: 'Leg sweep!', answer: 'tiao', why: 'jump over it' },
    { k: 'tui', call: '[推|tuī] ！', en: 'I’m pushing!', answer: 'mabu', why: 'stand firm, low' },
    { k: 'kai', call: '[破绽|pò zhàn] ！', en: 'An opening!', answer: 'tuizhang', why: 'strike back' },
  ];
  const PHRASES = [
    { id: 'ph.kf.shuneng', zh: SAYINGS[0].src, en: 'Practice makes perfect.', note: 'For anything you get good at by doing it again and again.' },
    { id: 'ph.kf.yixin', zh: SAYINGS[1].src, en: 'Wholeheartedly; with all your focus', note: '一心 one heart + 一意 one mind.' },
    { id: 'ph.kf.yusu', zh: SAYINGS[2].src, en: 'More haste, less speed.', note: 'A saying from Confucius: hurry, and you never get there.' },
    { id: 'ph.kf.jiayou', zh: '[加油|jiā yóu] ！', en: 'Come on! You can do it!', note: 'Literally “add oil”: what everyone shouts to cheer someone on.' },
  ];

  // ============================================================ pictures (paper cutouts: a cream badge with a little red figure)
  function addIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const H = ICONS.H, { shape, ell, rr, dot } = H, has = k => ICONS.keys.includes(k), add = (k, fn) => { if (!has(k)) ICONS.add(k, fn); };
    const badge = (c, p) => shape(c, p, ell(0, 0, 36, 36), '#f6e9d2');
    const fig = (c, segs, head, col = RED) => { c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = col; c.lineWidth = 6; for (const s of segs) { c.beginPath(); c.moveTo(s[0], s[1]); for (let i = 2; i < s.length; i += 2) c.lineTo(s[i], s[i + 1]); c.stroke(); } dot(c, head[0], head[1], 6.5, col); };
    add('kf_horse', (c, p) => { badge(c, p); if (p) fig(c, [[0, -12, 0, 6], [0, 6, -14, 10, -18, 24], [0, 6, 14, 10, 18, 24], [0, -6, -10, 0, -6, 4], [0, -6, 10, 0, 6, 4]], [0, -20]); });
    add('kf_bow', (c, p) => { badge(c, p); if (p) fig(c, [[4, -12, 0, 6], [0, 6, 14, 12, 16, 24], [0, 6, -10, 14, -22, 24], [2, -6, 18, -8], [2, -6, -10, 2]], [6, -20]); });
    add('kf_punch', (c, p) => { badge(c, p); shape(c, p, rr(-16, -14, 26, 28, 9), '#f5cda2'); shape(c, p, rr(8, -12, 14, 24, 6), '#f5cda2'); if (p) { [-6, 2].forEach(y => { c.beginPath(); c.moveTo(-14, y); c.lineTo(8, y); c.lineWidth = 1.6; c.strokeStyle = 'rgba(43,34,53,0.5)'; c.stroke(); }); [[-30, -8], [-34, 2], [-30, 12]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y); c.lineTo(x - 8, y); c.lineWidth = 2.4; c.strokeStyle = RED; c.stroke(); }); } });
    add('kf_kick', (c, p) => { badge(c, p); if (p) fig(c, [[-6, -12, -4, 6], [-4, 6, -10, 24], [-4, 6, 12, -2, 24, -8], [-6, -6, -18, -14], [-6, -6, 6, -16]], [-8, -20]); });
    add('kf_turn', (c, p) => { badge(c, p); if (p) { c.beginPath(); c.arc(0, 0, 20, 0.4, 5.3); c.lineWidth = 6; c.strokeStyle = RED; c.lineCap = 'round'; c.stroke(); c.fillStyle = RED; c.beginPath(); c.moveTo(18, -14); c.lineTo(30, -6); c.lineTo(16, 0); c.closePath(); c.fill(); dot(c, 0, 0, 6, INK); } });
    add('kf_jump', (c, p) => { badge(c, p); if (p) { fig(c, [[0, -16, 0, 2], [0, 2, -10, 6, -6, 14], [0, 2, 10, 6, 6, 14], [0, -10, -14, -20], [0, -10, 14, -20]], [0, -24]); c.strokeStyle = 'rgba(43,34,53,0.45)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-22, 26); c.lineTo(22, 26); c.stroke(); } });
    add('kf_palm', (c, p) => { badge(c, p); shape(c, p, rr(-12, -6, 24, 26, 7), '#f5cda2'); for (let i = 0; i < 4; i++) shape(c, p, rr(-12 + i * 6.4, -24, 5.6, 22, 3), '#f5cda2'); shape(c, p, rr(10, 0, 14, 7, 3), '#f5cda2'); if (p) [[-28, -10], [-30, 2], [-28, 14]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 5, -1.2, 1.2); c.lineWidth = 2.4; c.strokeStyle = RED; c.stroke(); }); });
    add('kf_scroll', (c, p) => { shape(c, p, rr(-18, -30, 36, 60, 2), '#f6efdc'); shape(c, p, rr(-22, -34, 44, 6, 3), '#5a3a22'); shape(c, p, rr(-22, 28, 44, 6, 3), '#5a3a22'); if (p) { c.font = '700 18px "KaiTi", "STKaiti", serif'; c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; ['熟', '能', '生'].forEach((ch, i) => c.fillText(ch, 0, -14 + i * 16)); } });
  }

  // ============================================================ the courtyard (built on the first visit)
  let ROOM = null;
  const SPOT = { spawn: { x: 0, z: HD - 1.3 }, exit: { x: 0, z: HD - 0.45 }, master: { x: 0, z: -1.9 }, mimo: { x: 0, z: 0.5 }, you: { x: 1.6, z: 2.9 },
    dummy: { x: -3.6, z: -2.4 }, dummyMimo: { x: -3.6, z: -1.2 }, drum: { x: 4.6, z: -2.2 }, spar: { x: 0, z: -0.7 }, sparMimo: { x: 0, z: 1.2 },
    scrollW: { x: -HW + 1.1, z: 0.6 }, scrollE: { x: HW - 1.1, z: 0.6 }, scrollN: { x: -2.6, z: -HD + 1.0 }, tree: { x: 5.7, z: -4.6 } };
  function stoneTex() {
    const k = GK();
    return k.canvasTex(512, 512, c => {
      c.fillStyle = '#9a9a92'; c.fillRect(0, 0, 512, 512);
      for (let j = 0; j < 8; j++) for (let i = 0; i < 6; i++) {
        const x = i * 86 + (j % 2) * 43 - 20, y = j * 64, w = 82, h = 60;
        c.fillStyle = ['#b2b0a6', '#a8a69c', '#bab8ae', '#a2a096'][(i + j * 3) % 4]; c.fillRect(x, y, w, h);
        c.fillStyle = 'rgba(60,60,55,0.12)'; for (let q = 0; q < 4; q++) c.fillRect(x + ((q * 29 + i * 7) % 70), y + ((q * 17 + j * 5) % 50), 8, 3);
      }
    });
  }
  function wallTex() {
    const k = GK();
    return k.canvasTex(512, 256, c => {
      c.fillStyle = '#f2eee4'; c.fillRect(0, 0, 512, 256);
      for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(110,100,80,${0.03 + (i % 5) * 0.01})`; c.fillRect((i * 37) % 512, (i * 91) % 256, 2 + (i % 3), 2); }
      c.fillStyle = '#6a6e72'; c.fillRect(0, 0, 512, 26); c.fillStyle = '#4e5256'; for (let x = 0; x < 512; x += 24) c.fillRect(x, 0, 12, 26);
      c.fillStyle = 'rgba(80,80,80,0.18)'; c.fillRect(0, 226, 512, 30);
    });
  }
  // the moon gate: a round opening, bamboo beyond it
  function gateTex() {
    const k = GK();
    return k.canvasTex(512, 512, c => {
      c.fillStyle = '#cfe0c6'; c.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 14; i++) { const x = 20 + i * 36 + (i % 3) * 6; c.fillStyle = i % 2 ? '#5f9a4a' : '#4f8a3e'; c.fillRect(x, 0, 12, 512); c.fillStyle = 'rgba(30,60,20,0.4)'; for (let y = 40; y < 512; y += 90) c.fillRect(x - 1, y + (i * 13) % 50, 14, 4); c.fillStyle = '#6fae52'; for (let y = 20; y < 512; y += 70) { c.beginPath(); c.ellipse(x + 18, y + (i * 23) % 40, 16, 5, -0.5, 0, Math.PI * 2); c.fill(); } }
    });
  }
  function plaqueTex() {
    const k = GK();
    return k.canvasTex(512, 160, c => {
      c.fillStyle = '#c9a24a'; c.fillRect(0, 0, 512, 160); c.fillStyle = '#1d1416'; c.fillRect(10, 10, 492, 140);
      c.fillStyle = GOLD; c.font = `700 92px ${k.FONT.zh}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('梅园武馆', 256, 84);
    });
  }
  function scrollTex(text, silk) {
    const k = GK();
    return k.canvasTex(256, 800, c => {
      c.fillStyle = silk; c.fillRect(0, 0, 256, 800); c.fillStyle = '#f6efdc'; c.fillRect(28, 60, 200, 680);
      k.vtext(c, text, 128, 90, 700, 150, INK, k.FONT.zh); k.seal(c, 180, 720, 34, '梅');
    });
  }
  function buildRoom() {
    const k0 = GK(), g = new THREE.Group(); g.name = 'kungfu-room'; g.position.set(X0, Y0, Z0); g.visible = false; G.w3d.scene.add(g);
    const k = k0.Kit(), solids = [], glows = [];
    const ft = stoneTex(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(HW / 2.5, HD / 2.5);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2 * HW, 0.3, 2 * HD), new THREE.MeshToonMaterial({ map: ft, gradientMap: TK.grad })); floor.position.y = -0.15; floor.receiveShadow = true; g.add(floor);
    const wm = new THREE.MeshToonMaterial({ map: wallTex(), gradientMap: TK.grad });
    for (const [w, x, z, ry] of [[2 * HW, 0, -HD, 0], [2 * HW, 0, HD, Math.PI], [2 * HD, -HW, 0, HALF], [2 * HD, HW, 0, -HALF]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), wm); m.position.set(x, WH / 2, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); }
    solids.push({ obox: 1, x: 0, z: -HD - 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: 0, z: HD + 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: -HW - 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 }, { obox: 1, x: HW + 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 });
    // grey tile caps along the top of the walls
    k.box(0, WH + 0.06, -HD + 0.1, 2 * HW + 0.4, 0.14, 0.5, '#4e5256').box(-HW + 0.1, WH + 0.06, 0, 0.5, 0.14, 2 * HD, '#4e5256').box(HW - 0.1, WH + 0.06, 0, 0.5, 0.14, 2 * HD, '#4e5256');
    // the red sparring circle
    const ring = new THREE.Mesh(new THREE.RingGeometry(2.05, 2.25, 48), new THREE.MeshBasicMaterial({ color: '#b3302a' })); ring.rotation.x = -HALF; ring.position.set(0, 0.012, 0.25); g.add(ring);
    // the moon gate (bamboo beyond), its plaque, two lanterns
    const gate = new THREE.Mesh(new THREE.CircleGeometry(1.35, 40), new THREE.MeshToonMaterial({ map: gateTex(), gradientMap: TK.grad })); gate.position.set(1.6, 1.45, -HD + 0.03); g.add(gate);
    g.add(TK.part(new THREE.TorusGeometry(1.38, 0.09, 8, 40), '#8a8a84', [1.6, 1.45, -HD + 0.05], null, { ink: 0.01 }));
    const pl = k0.plane(1.9, 0.6, plaqueTex()); pl.position.set(1.6, WH - 0.05, -HD + 0.06); g.add(pl);
    for (const s of [-1, 1]) k0.lantern(k, 1.6 + s * 1.85, 2.1, -HD + 0.45, 0.9, glows, 0.5);
    // the plum tree in the north-east corner, in bloom
    const T = SPOT.tree;
    k.cyl(T.x, 0.75, T.z, 0.17, 1.5, '#4a3226', { rz: 0.12 }).cyl(T.x - 0.25, 1.75, T.z + 0.1, 0.11, 1.0, '#4a3226', { rz: 0.5 }).cyl(T.x + 0.3, 1.8, T.z - 0.05, 0.1, 1.1, '#4a3226', { rz: -0.55 }).cyl(T.x - 0.05, 2.1, T.z - 0.2, 0.08, 0.9, '#4a3226', { rx: -0.4 });
    const blossoms = [];
    for (let i = 0; i < 26; i++) { const a = i * 2.39, r = 0.4 + (i % 5) * 0.18; blossoms.push([T.x + Math.cos(a) * r, 2.05 + (i % 7) * 0.12 + Math.sin(i) * 0.15, T.z + Math.sin(a) * r * 0.8]); }
    blossoms.forEach(([x, y, z], i) => k.ball(x, y, z, 0.17, 0.13, 0.17, i % 3 ? '#f2a0b8' : '#fbd0dc', { ink: 0.008 }));
    k.cyl(T.x, 0.06, T.z, 0.7, 0.12, '#8a8a84');
    solids.push({ x: T.x, z: T.z, r: 0.75 });
    // the weapon rack (wooden staffs), west wall
    const rx = -HW + 0.45;
    k.box(rx, 0.9, -2.0, 0.12, 1.8, 0.1, '#5a3a22').box(rx, 0.9, 0.0, 0.12, 1.8, 0.1, '#5a3a22').box(rx + 0.05, 1.5, -1.0, 0.1, 0.08, 2.2, '#5a3a22').box(rx + 0.05, 0.4, -1.0, 0.1, 0.08, 2.2, '#5a3a22');
    for (let i = 0; i < 5; i++) k.cyl(rx + 0.12, 1.3, -1.8 + i * 0.4, 0.03, 2.5, i % 2 ? '#a8703f' : '#c9935a', { rx: 0.08, ink: 0.006 });
    solids.push({ obox: 1, x: rx + 0.05, z: -1.0, hw: 0.25, hd: 1.15, rot: 0 });
    // the drum on its stand
    const D = SPOT.drum;
    k.cyl(D.x, 0.55, D.z, 0.06, 1.1, '#5a3a22', { rz: 0.35 }).cyl(D.x, 0.55, D.z, 0.06, 1.1, '#5a3a22', { rz: -0.35 });
    k.cyl(D.x, 1.15, D.z, 0.48, 0.62, '#b3241e', { rx: HALF });
    k.cyl(D.x, 1.15, D.z, 0.5, 0.04, '#e9dcc0', { rx: HALF, ink: 0 }).cyl(D.x, 1.15, D.z + 0.0, 0.42, 0.66, '#e9dcc0', { rx: HALF, ink: 0 });
    for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; k.ball(D.x + Math.cos(a) * 0.49, 1.15 + Math.sin(a) * 0.49, D.z + 0.3, 0.025, 0.025, 0.025, GOLD, { ink: 0 }); }
    solids.push({ x: D.x, z: D.z, r: 0.65 });
    // three scrolls: west 熟能生巧, east 一心一意, north 欲速则不达
    const s1 = k0.plane(0.66, 2.0, scrollTex('熟能生巧', '#3a5a7a')); s1.position.set(-HW + 0.05, 1.6, SPOT.scrollW.z); s1.rotation.y = HALF; g.add(s1);
    const s2 = k0.plane(0.66, 2.0, scrollTex('一心一意', '#7a3a3a')); s2.position.set(HW - 0.05, 1.6, SPOT.scrollE.z); s2.rotation.y = -HALF; g.add(s2);
    const s3 = k0.plane(0.66, 2.0, scrollTex('欲速则不达', '#4a6a4a')); s3.position.set(SPOT.scrollN.x, 1.6, -HD + 0.05); g.add(s3);
    // the way back to the kitchen (the south wall, where the camera looks in from): a stone threshold and a mat
    k.box(0, 0.03, HD - 0.25, 1.4, 0.06, 0.5, '#8a8a84').box(0, 0.015, HD - 0.95, 1.2, 0.02, 0.7, '#7a1f1a', { ink: 0 });
    // stone benches by the east wall
    k.box(HW - 0.6, 0.22, 3.2, 0.6, 0.12, 1.6, '#a8a69c').box(HW - 0.6, 0.1, 2.7, 0.4, 0.2, 0.3, '#8a8a84').box(HW - 0.6, 0.1, 3.7, 0.4, 0.2, 0.3, '#8a8a84');
    solids.push({ obox: 1, x: HW - 0.6, z: 3.2, hw: 0.35, hd: 0.85, rot: 0 });
    const baked = k0.bakeInto(g, k);
    const sprites = glows.map(q => { const s = k0.glowSprite(q.c, q.s); s.position.set(q.x, q.y, q.z); g.add(s); return s; });
    WORLD.addSolids(solids.map(s => Object.assign({}, s, { x: X0 + s.x, z: Z0 + s.z, kungfu: true })));
    WORLD.addPlatforms([{ box: [X0 - HW, X0 + HW, Z0 - HD, Z0 + HD], top: Y0, kungfu: true }]);
    ROOM = { g, baked, sprites, petals: [], fx: [] };
    ROOM.dummy = makeDummy(g);
    ROOM.master = k0.makeGrandma(g, 'master');
    const foot = TK.part(TK.G.sphere, '#1d1822', [0.1, 0.06, 0.2], [0.09, 0.07, 0.14], { ink: 0.008 }); foot.visible = false; ROOM.master.v.body.add(foot); ROOM.master.foot = foot;
    ROOM.master.st = { x: X0 + SPOT.master.x, z: Z0 + SPOT.master.z, y: Y0, yaw: 0, baseYaw: 0, talk: 0, talking: false, top: 1.95 };
    for (let i = 0; i < 14; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.05, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? '#f2a0b8' : '#fbd0dc', side: THREE.DoubleSide, transparent: true, opacity: 0.9 })); g.add(p); ROOM.petals.push({ m: p, t: Math.random() * 6 }); }
    return ROOM;
  }
  // the wooden dummy (木人桩): a post, two high arms, a middle arm, a bent leg; it shakes when it's hit
  function makeDummy(g) {
    const D = SPOT.dummy, grp = new THREE.Group(); grp.position.set(D.x, 0, D.z); g.add(grp);
    const part = TK.part, Gk = TK.G, W = '#8a5a2e';
    grp.add(part(Gk.cyl, '#6b4a2e', [0, 0.05, 0], [0.32, 0.1, 0.32], { ink: 0.008 }));
    const post = new THREE.Group(); grp.add(post);
    post.add(part(Gk.cyl, W, [0, 0.85, 0], [0.17, 1.6, 0.17], { ink: 0.01 }));
    for (const s of [-1, 1]) post.add(part(Gk.cyl, '#a8703f', [s * 0.12, 1.35, 0.25], [0.04, 0.5, 0.04], { rot: [HALF - 0.15, 0, s * 0.35], ink: 0.006 }));
    post.add(part(Gk.cyl, '#a8703f', [0, 1.05, 0.3], [0.045, 0.55, 0.045], { rot: [HALF, 0, 0], ink: 0.006 }));
    post.add(part(Gk.cyl, '#a8703f', [0.05, 0.45, 0.28], [0.05, 0.5, 0.05], { rot: [HALF - 0.6, 0, 0.1], ink: 0.006 }));
    grp.traverse(o => { if (o.isMesh) o.castShadow = true; });
    WORLD.addSolids([{ x: X0 + D.x, z: Z0 + D.z, r: 0.42, kungfu: true }]);
    return { grp, post, shake: 0 };
  }

  // ============================================================ Mimo's kung fu: paws with red wristbands, and the poses
  // (main.js animates Mimo first each frame; this runs after it, in the room's update, and only adds to it)
  let PAWS = null, FEET = null;
  const POSE = { name: null, t: 0, dur: 0, low: 0 };
  function paws() {
    if (PAWS || !G || !G.cast || !G.cast.mimo) return PAWS;
    const grp = new THREE.Group(), part = TK.part, Gk = TK.G, mk = s => { const p = new THREE.Group(); p.position.set(s * 0.3, 0.27, 0.1); p.add(part(Gk.sphere, '#fbf1df', [0, 0, 0], [0.085, 0.08, 0.085], { ink: 0.012 })); p.add(part(new THREE.TorusGeometry(0.07, 0.022, 6, 16), RED, [0, 0, -0.05], null, { ink: 0 })); grp.add(p); return p; };
    PAWS = { grp, R: mk(-1), L: mk(1) }; grp.visible = false; G.cast.mimo.body.add(grp);
    FEET = G.cast.mimo.body.children.filter(o => o.isMesh && Math.abs(o.position.y - 0.04) < 0.02 && Math.abs(Math.abs(o.position.x) - 0.13) < 0.02).map(o => ({ o, p: o.position.clone() }));
    return PAWS;
  }
  function pose(name, dur) { POSE.name = name; POSE.t = 0; POSE.dur = dur || (name === 'horse' || name === 'bow' ? 1e9 : 0.7); if (name !== 'horse') POSE.low = 0; }
  const ease = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  function poseUpdate(dt) {
    const mm = G.cast && G.cast.mimo; if (!mm) return;
    const P = paws(), b = mm.body, M = G.sim.mimo;
    b.position.set(0, 0, 0); b.rotation.x = 0; b.rotation.y = 0;
    if (FEET) FEET.forEach(f => f.o.position.copy(f.p));
    if (P) { P.R.position.set(-0.3, 0.27, 0.1); P.L.position.set(0.3, 0.27, 0.1); P.grp.visible = !!(inside && (training || POSE.name)); }
    if (!POSE.name) return;
    POSE.t += dt;
    const t = POSE.t, u = Math.min(1, t / 0.25), n = POSE.name, jab = Math.sin(Math.min(1, t / POSE.dur) * Math.PI);
    if (n === 'horse') { const lo = 1 + POSE.low * 0.35, k = ease(u); b.scale.x *= 1 + 0.28 * k * lo; b.scale.z *= 1 + 0.2 * k; b.scale.y *= 1 - 0.24 * k * lo; b.position.y = -0.03 * k * lo; if (P) { P.R.position.set(-0.27, 0.2, 0.05); P.L.position.set(0.27, 0.2, 0.05); } if (FEET) FEET.forEach(f => { f.o.position.x = f.p.x * (1 + 0.6 * k); }); }
    else if (n === 'bow') { const k = ease(u); b.rotation.x = 0.36 * k; b.position.z = 0.08 * k; b.scale.y *= 1 - 0.1 * k; if (FEET) { FEET[0].o.position.z = FEET[0].p.z + 0.12 * k; if (FEET[1]) FEET[1].o.position.z = FEET[1].p.z - 0.14 * k; } if (P) P.R.position.set(-0.2, 0.32, 0.36 * k + 0.1); }
    else if (n === 'punch') { b.rotation.y = -0.35 * jab; if (P) P.R.position.set(-0.3 + 0.2 * jab, 0.3, 0.1 + 0.5 * jab); }
    else if (n === 'kick') { b.rotation.x = -0.35 * jab; if (FEET && FEET[0]) { const f = FEET.find(q => q.p.x < 0) || FEET[0]; f.o.position.set(f.p.x + 0.05 * jab, f.p.y + 0.34 * jab, f.p.z + 0.3 * jab); } }
    else if (n === 'turn') { b.rotation.y = TAU * ease(Math.min(1, t / POSE.dur)); }
    else if (n === 'palm') { const k = jab; b.rotation.x = 0.2 * k; if (P) { P.R.position.set(-0.12, 0.32, 0.1 + 0.5 * k); P.L.position.set(0.12, 0.32, 0.1 + 0.5 * k); } }
    else if (n === 'jump') { b.rotation.y = TAU * ease(Math.min(1, t / POSE.dur)); }
    else if (n === 'tumble') { b.rotation.x = -0.9 * jab; b.position.y = 0.1 * jab; }
    if (t >= POSE.dur) { POSE.name = null; }
    if (M.hidden) POSE.name = null;
  }
  // an effect: a white ring that grows and fades (the palm strike), at a world spot, facing a direction
  function ringFX(x, y, z, yaw) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.035, 6, 24), new THREE.MeshBasicMaterial({ color: '#fffaf0', transparent: true, opacity: 0.85, depthWrite: false }));
    m.position.set(x, y, z); m.rotation.y = yaw; G.w3d.scene.add(m); ROOM.fx.push({ m, t: 0 });
  }
  // a move, done for real: Mimo's pose, the sound, what it hits (the dummy, or nothing)
  async function doMove(k, o = {}) {
    const M = G.sim.mimo, m = MV[k];
    G.sim.mimoSay(CJK.plain(m.src, { lang: 'zh' }) + '！', 1.2);
    if (k === 'tiao') { M.hop = { x0: M.x, z0: M.z, x1: M.x, z1: M.z, y0: M.y, y1: M.y, t: 0, dur: 0.6, h: 1.3 }; pose('jump', 0.6); Sound.play('jump'); }
    else if (k === 'mabu') { pose('horse'); Sound.play('land', 4); G.w3d.fx.puff(M.x, M.ry, M.z, 4, 0.14); }
    else if (k === 'gongbu') { pose('bow'); Sound.play('land', 3); }
    else if (k === 'zhuanshen') { pose('turn', 0.5); Sound.play('swoosh'); }
    else { pose(m.pose, 0.45); Sound.play(k === 'tuizhang' ? 'swoosh' : 'whiff'); if (k === 'tuizhang') ringFX(M.x + Math.sin(M.yaw) * 0.5, M.ry + 0.35, M.z + Math.cos(M.yaw) * 0.5, M.yaw); }
    await STORY.wait(0.22);
    if (o.dummy && ['chuquan', 'titui', 'tuizhang'].includes(k)) { ROOM.dummy.shake = k === 'tuizhang' ? 1.6 : 1; Sound.play('hit'); G.w3d.fx.puff(X0 + SPOT.dummy.x, Y0 + 1.0, Z0 + SPOT.dummy.z + 0.3, k === 'tuizhang' ? 6 : 3, 0.12, '#e9dcc0'); }
    await STORY.wait(0.5);
  }

  // ============================================================ Master Mei: her poses, her lines
  function masterPose(p) { if (!ROOM) return; ROOM.master.pose = p; ROOM.master.poseT = 0; }
  function animateMaster(dt, t) {
    const m = ROOM.master, st = m.st, Y = G.sim.you, M = G.sim.mimo;
    if (m.walkTo) { const w = m.walkTo, k = Math.min(1, dt * 2.6); st.x += (w.x - st.x) * k; st.z += (w.z - st.z) * k; if (Math.hypot(w.x - st.x, w.z - st.z) < 0.03) m.walkTo = null; }
    const look = m.face || (m.watch === 'mimo' ? M : Y);
    st.yaw = dampAngle(st.yaw, Math.atan2(look.x - st.x, look.z - st.z), 5, dt); st.talk = damp(st.talk, st.talking ? 1 : 0, 10, dt);
    ACTORS.animateVillager(m.v, { x: st.x - X0, y: 0, z: st.z - Z0, yaw: st.yaw, talk: st.talk, wave: false, walking: !!m.walkTo }, dt, t);
    const v = m.v, p = m.pose, pt = (m.poseT = (m.poseT || 0) + dt), jab = Math.sin(Math.min(1, pt / 0.5) * Math.PI), A = v.arms;
    v.body.scale.set(1, 1, 1); v.body.rotation.x = 0; m.foot.visible = false;
    if (p === 'salute') { A[0].rotation.set(-1.25, 0, 0.6); A[1].rotation.set(-1.25, 0, -0.6); }                 // fist in palm (抱拳礼)
    else if (p === 'horse') { v.body.scale.set(1.08, 0.88, 1.08); v.body.position.y = -0.05; A[0].rotation.set(-0.9, 0, 0.75); A[1].rotation.set(-0.9, 0, -0.75); }
    else if (p === 'bow') { v.body.rotation.x = 0.22; A[0].rotation.set(-1.5, 0, 0.1); A[1].rotation.set(-0.4, 0, -0.5); }
    else if (p === 'punch') { A[0].rotation.set(-0.6 - 1.0 * jab, 0, 0.15); }
    else if (p === 'palm' || p === 'push') { v.body.rotation.x = 0.12 * jab; A[0].rotation.set(-0.6 - 0.95 * jab, 0, 0.15); A[1].rotation.set(-0.6 - 0.95 * jab, 0, -0.15); }
    else if (p === 'kick') { v.body.rotation.x = -0.22 * jab; m.foot.visible = true; m.foot.position.set(0.1, 0.06 + 0.5 * jab, 0.2 + 0.25 * jab); }
    else if (p === 'sweep') { v.body.scale.set(1.1, 0.82, 1.1); m.foot.visible = true; const a = -1 + 2 * Math.min(1, pt / 0.5); m.foot.position.set(0.4 * Math.sin(a), 0.06, 0.35 * Math.cos(a)); }
    else if (p === 'windup') { v.body.rotation.x = -0.15; A[0].rotation.set(-0.3, 0, 0.9); }
    else if (p === 'point') { A[0].rotation.set(-1.4, 0.3, 0.2); }
  }
  const plainMaster = () => CJK.plain(MASTER, { lang: 'zh' });
  async function msay(src, en, o = {}) {
    const st = ROOM && ROOM.master && ROOM.master.st; if (!st) return;
    st.name = plainMaster(); st.id = 'kungfu:' + en; st.lines = { en, zh: src };
    await STORY.sayInline(st, o.full !== false);
  }
  const say = (src, en) => GK().panelSay(src, en, plainMaster());
  // the camera on Mimo and her (the panel docked below)
  function frameSpar() { G.cam.override = { pos: new THREE.Vector3(X0 + 3.4, Y0 + 2.6, Z0 + 4.8), look: new THREE.Vector3(X0 + 0.1, Y0 + 0.8, Z0 - 0.4), dur: 0.8 }; }
  function frameDummy() { G.cam.override = { pos: new THREE.Vector3(X0 + SPOT.dummy.x + 2.8, Y0 + 2.3, Z0 + SPOT.dummy.z + 3.6), look: new THREE.Vector3(X0 + SPOT.dummy.x + 0.3, Y0 + 0.8, Z0 + SPOT.dummy.z + 0.4), dur: 0.8 }; }
  function mimoTo(spot, face) { G.sim.mimoGo({ x: X0 + spot.x, z: Z0 + spot.z }, { x: X0 + face.x, z: Z0 + face.z }); }
  // is it this move? (another move named instead gets its own note)
  function judgeMove(text, k) {
    const K = GK(), m = MV[k];
    if (K.heardAny(text, [m.src].concat(m.alt))) return { ok: true, note: `${K.model(m.src)} · ${K.esc(m.en)}` };
    const other = MOVES.find(q => q.k !== k && K.heardAny(text, [q.src].concat(q.alt)));
    return { ok: false, note: other ? `That’s ${K.esc(other.en)} (${K.model(other.src)})!` : `${K.esc(m.en)}: ${K.model(m.src)}` };
  }
  // a typed command with a clock (seconds): { ok, timeout } (the box goes quiet when the time's up)
  async function timed(prompt, judge, o, sec) {
    const K = GK();
    const bar = `<div class="gm-timer"><i style="animation:gmtime ${sec}s linear forwards"></i></div>`;
    let timer = null;
    const p = K.typeAns(prompt + bar, judge, o);
    timer = setTimeout(() => { const R = K.RUN; if (!R || !R.wake) return; const inp = document.querySelector('#gm-panel .gm-in'); if (inp) { inp.disabled = true; inp.value = ''; } R.wake({ ok: false, timeout: true }); }, sec * 1000);
    const r = await p; clearTimeout(timer); return r;
  }
  function css() {
    if (document.getElementById('kf-css')) return;
    const s = document.createElement('style'); s.id = 'kf-css';
    s.textContent = '@keyframes gmtime { from { width: 100%; } to { width: 0%; } } #gm-panel .kf-rules td { padding: 4px 10px; text-align: left; } #gm-panel .kf-rules { margin: 0 auto; font-size: 17px; }';
    document.head.appendChild(s);
  }

  // ============================================================ the lessons
  const LESSONS = [
    { n: 1, en: 'Stances (站桩)', sub: 'horse stance 马步 · bow stance 弓步' },
    { n: 2, en: 'Moves (招式)', sub: 'punch · kick · turn · jump · palm strike, at the wooden dummy' },
    { n: 3, en: 'Sayings (口诀)', sub: '熟能生巧 · 一心一意 · 欲速则不达' },
    { n: 4, en: 'The form (套路)', sub: 'a whole sequence, to the drum' },
    { n: 5, en: 'The test: sparring (比武)', sub: 'she attacks; you tell Mimo the answer, in time' },
  ];
  async function lessonDone(n, coins) {
    const st = S(), first = !st.L[n]; st.L[n] = 1;
    if (first) { const K = GK(); if (coins) K.coinsUp(coins); UI.toast(`✓ ${LESSONS[n - 1].en}`); Sound.play('learned'); K.mimoHappy(16); }
    if (G.save) G.save();
  }
  async function lessonMenu() {
    const st = S(), opts = [];
    for (const Ls of LESSONS) { const open = Ls.n === 1 || st.L[Ls.n - 1]; if (!open) break; opts.push({ label: `${st.L[Ls.n] ? '✓ ' : ''}Lesson ${Ls.n} · ${Ls.en}`, sub: Ls.sub.replace('Mimo', mn()), value: Ls.n }); }
    G.sim.lock = 1;
    const n = await UI.choose(`${plainMaster()} · 梅园武馆`, opts);
    G.sim.lock = 0;
    if (!n) { await msay('[去|qù] [吧|ba] 。 [每天|měi tiān] [都|dōu] [要|yào] [练|liàn] ！', 'Off you go. Practice every day!'); return; }
    await lesson(n);
  }
  async function lesson(n) {
    const K = GK();
    try { await [null, L1, L2, L3, L4, L5][n](); }
    catch (e) { console.error('[kungfu] lesson ' + n, e); }
    finally { if (K.panelOpen()) K.closePanel(); K.endRun(); pose(null); POSE.name = null; G.cam.override = null; if (ROOM) { masterPose(null); ROOM.master.watch = null; ROOM.master.walkTo = { x: X0 + SPOT.master.x, z: Z0 + SPOT.master.z }; } G.sim.mimoGo(null, null); training = false; }
  }
  let training = false;
  // 1 · 站桩: 马步, 弓步, «低一点！», then she calls and you answer, quick
  async function L1() {
    const K = GK(); training = true;
    await msay('[练|liàn] [武|wǔ] [先|xiān] [练|liàn] [站|zhàn] 。 [根|gēn] [不|bù] [稳|wěn] ， [什么|shén me] [都|dōu] [不行|bù xíng] 。', 'Martial arts start with standing. Without strong roots, nothing works.');
    K.startRun(); K.openPanel('Lesson 1 · 站桩', 'Stances', { seal: '武' }); K.dots(4, 0);
    for (const k of ['mabu', 'gongbu']) { const m = MV[k]; say(`${m.src} 。`, m.en); K.wordCard(m.src, m.en, m.icon, m.hint); masterPose(m.pose); if ((await K.next()).quit) return; }
    masterPose(null);
    K.dock(true); K.dots(4, 1); frameSpar(); mimoTo(SPOT.mimo, SPOT.master); ROOM.master.watch = 'mimo';
    say('[让|ràng] {mimo} [扎|zā] [马步|mǎ bù] ！', `Tell ${mn()}: horse stance!`);
    let r = await K.typeAns(`<div class="gm-q">${K.icon('kf_horse', 'sm')} Tell ${K.esc(mn())}: horse stance!</div>`, x => judgeMove(x, 'mabu'), { show: '[马步|mǎ bù] ！', hints: [`${K.model('[马|mǎ]')} horse + ${K.model('[步|bù]')} step`] });
    if (r.quit) return;
    await doMove('mabu');
    masterPose('point'); say('[太|tài] [高|gāo] [了|le] ！ [低|dī] [一点|yī diǎn] ！', 'Too high! Lower!');
    r = await K.typeAns(`<div class="gm-q">Tell ${K.esc(mn())}: lower! ${K.model('[低|dī] [一点|yī diǎn]')}</div>`, x => (K.heardAny(x, ['[低|dī] [一点|yī diǎn]', '[低|dī] [一点儿|yī diǎn r]', '[再|zài] [低|dī]', '[低|dī]']) ? { ok: true, note: K.model('[低|dī] [一点|yī diǎn] ！') } : { ok: false, note: `Lower: ${K.model('[低|dī]')}` }),
      { show: '[低|dī] [一点|yī diǎn] ！', hints: [`${K.model('[低|dī]')} low + ${K.model('[一点|yī diǎn]')} a bit`] });
    if (r.quit) return;
    POSE.low = 1; Sound.play('land', 5); G.sim.mimoSay('…!', 1.2);
    masterPose('horse'); say('[好|hǎo] ！ [保持|bǎo chí] [住|zhù] ！ [一|yī] 、 [二|èr] 、 [三|sān] …', 'Good! Hold it! One, two, three…');
    await tick(2200);
    K.dots(4, 2); masterPose('bow');
    say('[现在|xiàn zài] ， [弓步|gōng bù] ！', 'Now: bow stance!');
    r = await K.typeAns(`<div class="gm-q">${K.icon('kf_bow', 'sm')} Bow stance!</div>`, x => judgeMove(x, 'gongbu'), { show: '[弓步|gōng bù] ！', hints: [`${K.model('[弓|gōng]')} a bow`] });
    if (r.quit) return;
    await doMove('gongbu');
    K.dots(4, 3); masterPose(null);
    say('[我|wǒ] [喊|hǎn] ， [你|nǐ] [告诉|gào su] {mimo} 。 [快|kuài] ！', `I call it, you tell ${mn()}. Quick!`);
    for (const k of shuffle(['mabu', 'gongbu', 'mabu', 'gongbu'])) {
      const m = MV[k]; masterPose(m.pose); say(`${m.src} ！`, `${m.en}!`); K.sayIt(m.src);
      r = await timed(`<div class="gm-q">${K.icon(m.icon, 'sm')}</div>`, x => judgeMove(x, k), { show: `${m.src} ！`, quiet: true, wait: 300 }, 10);
      if (r.quit) return;
      if (r.timeout) { say('[太|tài] [慢|màn] [了|le] ！', 'Too slow!'); await tick(900); continue; }
      await doMove(k);
    }
    K.closePanel(); K.endRun(); G.cam.override = null; masterPose('salute');
    await msay('[很|hěn] [好|hǎo] 。 [根|gēn] [稳|wěn] [了|le] ， [树|shù] [才|cái] [能|néng] [长|zhǎng] [高|gāo] 。', 'Very good. Strong roots, and the tree can grow tall.');
    await lessonDone(1, 5);
  }
  // 2 · 招式: five moves, then at the wooden dummy: she shows a picture, you name the move
  async function L2() {
    const K = GK(); training = true;
    await msay('[现在|xiàn zài] [学|xué] [招式|zhāo shì] 。 [看|kàn] [好|hǎo] [了|le] ！', 'Now the moves. Watch closely!');
    K.startRun(); K.openPanel('Lesson 2 · 招式', 'Moves', { seal: '武' }); K.dots(3, 0);
    for (const k of ['chuquan', 'titui', 'zhuanshen', 'tiao', 'tuizhang']) { const m = MV[k]; say(`${m.src} 。`, m.en); K.wordCard(m.src, m.en, m.icon, m.hint); masterPose(m.pose === 'turn' || m.pose === 'jump' ? 'salute' : m.pose); if ((await K.next()).quit) return; }
    masterPose(null);
    K.dock(true); K.dots(3, 1); frameDummy(); mimoTo(SPOT.dummyMimo, SPOT.dummy); ROOM.master.walkTo = { x: X0 + SPOT.dummy.x + 1.6, z: Z0 + SPOT.dummy.z + 0.6 }; ROOM.master.watch = 'mimo';
    say('[我|wǒ] [给|gěi] [你|nǐ] [看|kàn] [图|tú] ， [你|nǐ] [告诉|gào su] {mimo} [做|zuò] [什么|shén me] 。', `I show you a picture; you tell ${mn()} what to do.`);
    for (const k of ['chuquan', 'titui', 'tuizhang', 'zhuanshen', 'tiao']) {
      const m = MV[k];
      const r = await K.typeAns(`<div class="gm-q">${K.icon(m.icon, 'lg')}<small>What move is this? Tell ${K.esc(mn())}!</small></div>`, x => judgeMove(x, k), { show: `${m.src} ！`, hints: [K.esc(m.en)], quiet: true, wait: 300 });
      if (r.quit) return;
      await doMove(k, { dummy: true });
      say(['[好|hǎo] [拳|quán] ！', '[腿|tuǐ] [不错|bú cuò] ！', '[漂亮|piào liang] ！ [这|zhè] [是|shì] [我|wǒ] [的|de] [绝招|jué zhāo] 。', '[转|zhuǎn] [得|de] [快|kuài] ！', '[跳|tiào] [得|de] [高|gāo] ！'][['chuquan', 'titui', 'tuizhang', 'zhuanshen', 'tiao'].indexOf(k)],
        ['Good punch!', 'Nice kick!', 'Beautiful! That’s my secret move.', 'Quick turn!', 'High jump!'][['chuquan', 'titui', 'tuizhang', 'zhuanshen', 'tiao'].indexOf(k)]);
      await tick(900);
    }
    K.dots(3, 2);
    say('[快|kuài] ！ [一个|yī gè] [接|jiē] [一个|yī gè] ！', 'Fast! One after another!');
    for (const k of shuffle(['chuquan', 'titui', 'tuizhang', 'chuquan', 'titui'])) {
      const m = MV[k];
      const r = await timed(`<div class="gm-q">${K.icon(m.icon, 'lg')}</div>`, x => judgeMove(x, k), { show: `${m.src} ！`, quiet: true, wait: 250 }, 10);
      if (r.quit) return;
      if (r.timeout) { say('[慢|màn] [了|le] ！ [一心一意|yī xīn yī yì] ！', 'Too slow! Focus!'); await tick(800); continue; }
      await doMove(k, { dummy: true });
    }
    K.closePanel(); K.endRun(); G.cam.override = null; masterPose('salute');
    await msay('[好|hǎo] ！ [手|shǒu] [到|dào] ， [脚|jiǎo] [到|dào] ， [心|xīn] [也|yě] [到|dào] 。', 'Good! Hands there, feet there, and the heart there too.');
    await lessonDone(2, 5);
  }
  // 3 · 口诀: the three sayings on the scrolls, what they mean, and when you'd say each one
  async function L3() {
    const K = GK();
    await msay('[练|liàn] [武|wǔ] [也|yě] [要|yào] [练|liàn] [心|xīn] 。 [墙|qiáng] [上|shang] [的|de] [字|zì] ， [你|nǐ] [看|kàn] [懂|dǒng] [了|le] [吗|ma] ？', 'Training the body means training the mind too. Can you read the words on the walls?');
    K.startRun(); K.openPanel('Lesson 3 · 口诀', 'Sayings', { seal: '心' }); K.dots(3, 0);
    for (const s of SAYINGS) {
      say(`${s.src} 。`, s.en);
      PANEL().body.innerHTML = `<div class="gm-row">${K.icon('kf_scroll', 'lg')}<div>${K.zhHTML(s.src, 'gm-mid')}<div class="gm-read">${K.esc(CJK.roman(s.src, { lang: 'zh', cap: false }))} <button class="gm-sayb">🔊</button></div></div></div>`
        + `<div class="gm-mean" style="justify-content:center">${K.esc(s.en)}</div><div class="gm-hint">Word by word: ${K.esc(s.lit)}. You say it when ${K.esc(s.when)}.</div>`;
      K.paintIcons(PANEL().body); PANEL().body.querySelector('.gm-sayb').onclick = () => K.sayIt(s.src); K.sayIt(s.src);
      if ((await K.next()).quit) return;
    }
    K.dots(3, 1); say('[哪个|nǎ ge] [是|shì] [什么|shén me] [意思|yì si] ？', 'Which one means what?');
    if ((await K.match('<div class="gm-q">Match each saying to its meaning</div>', SAYINGS.map(s => ({ left: K.zhHTML(s.src, 'gm-zh'), right: K.esc(s.en) })))).quit) return;
    K.dots(3, 2);
    const SIT = [
      { k: 'shuneng', src: '{mimo} [踢|tī] [了|le] [一百|yī bǎi] [次|cì] ， [现在|xiàn zài] [踢|tī] [得|de] [很|hěn] [好|hǎo] 。 [这|zhè] [叫|jiào] [什么|shén me] ？', en: `${mn()} kicked a hundred times, and now kicks really well. What do we call that?` },
      { k: 'yixin', src: '{mimo} [练|liàn] [拳|quán] [的|de] [时候|shí hou] ， [一直|yī zhí] [在|zài] [看|kàn] [蝴蝶|hú dié] 。 [师父|shī fu] [会|huì] [说|shuō] [什么|shén me] ？', en: `${mn()} keeps watching a butterfly instead of practicing. What would the master say?` },
      { k: 'yusu', src: '[你|nǐ] [打字|dǎ zì] [太|tài] [快|kuài] ， [错|cuò] [了|le] [三|sān] [次|cì] 。 [这|zhè] [叫|jiào] [什么|shén me] ？', en: 'You typed too fast and got it wrong three times. What do we call that?' },
    ];
    for (const q of shuffle(SIT.slice())) {
      const s = SAYINGS.find(x => x.k === q.k);
      say(q.src, q.en);
      const r = await K.typeAns(`<div class="gm-q">Which saying? (Type it: the IME helps)</div>`, x => {
        if (K.isOnly(x, [s.src]) || K.heard(x, s.src)) return { ok: true, note: `${K.model(s.src)}: ${K.esc(s.en)}` };
        const sim = CJK.similar(K.bare(x), s.src, 'zh'), other = SAYINGS.find(o => o !== s && (K.heard(x, o.src) || CJK.similar(K.bare(x), o.src, 'zh') > 0.8));
        if (other) return { ok: false, note: `That one means: ${K.esc(other.en)}` };
        return { ok: false, retry: sim > 0.6, note: sim > 0.6 ? 'Close! Check each syllable.' : `It’s the one for when ${K.esc(s.when)}.` };
      }, { show: s.src, hints: [K.esc(s.en)] });
      if (r.quit) return;
    }
    K.closePanel(); K.endRun(); masterPose('salute');
    await msay('[记住|jì zhu] ： [熟能生巧|shú néng shēng qiǎo] 。 [每天|měi tiān] [练|liàn] [一点|yī diǎn] ， [比|bǐ] [一|yī] [天|tiān] [练|liàn] [十|shí] [个|gè] [小时|xiǎo shí] [好|hǎo] 。', 'Remember: practice makes perfect. A little every day beats ten hours in one day.');
    ['ph.kf.shuneng', 'ph.kf.yixin', 'ph.kf.yusu'].forEach(GK().teachPhrase);
    await lessonDone(3, 5);
  }
  // 4 · 套路: a form to the drum: study it, do it with the pictures, then from memory
  const FORM = ['mabu', 'chuquan', 'chuquan', 'titui', 'tuizhang'];
  async function L4() {
    const K = GK(); training = true;
    await msay('[把|bǎ] [招式|zhāo shì] [连|lián] [起来|qǐ lái] ， [就是|jiù shì] [套路|tào lù] 。 [这|zhè] [是|shì] [梅园|Méi yuán] [拳|quán] [的|de] [第一|dì yī] [套|tào] 。', 'Moves linked together make a form. This is the first form of Plum Garden Fist.');
    K.startRun(); K.openPanel('Lesson 4 · 套路', 'The form', { seal: '武' }); K.dots(3, 0);
    say('[先|xiān] [记住|jì zhu] 。', 'First, learn it by heart.');
    PANEL().body.innerHTML = `<div class="gm-row" style="gap:8px">${FORM.map((k, i) => `<span class="gm-step">${K.icon(MV[k].icon, 'sm')}${K.zhHTML(MV[k].src)}<small>${i + 1}</small></span>`).join('<b>→</b>')}</div><div class="gm-hint">Horse stance, punch, punch, kick, palm strike.</div>`;
    K.paintIcons(PANEL().body);
    if ((await K.next()).quit) return;
    K.dock(true); frameSpar(); mimoTo(SPOT.mimo, SPOT.master); ROOM.master.watch = 'mimo';
    for (const round of [1, 2]) {
      K.dots(3, round);
      say(round === 1 ? '[跟着|gēn zhe] [鼓|gǔ] ， [一|yī] [招|zhāo] [一|yī] [招|zhāo] [来|lái] ！' : '[这次|zhè cì] [不|bù] [看|kàn] [图|tú] ！', round === 1 ? 'With the drum, one move at a time!' : 'This time, no pictures!');
      for (let i = 0; i < FORM.length; i++) {
        const k = FORM[i], m = MV[k]; Sound.play('hit');
        const strip = `<div class="gm-row" style="gap:6px">${FORM.map((q, j) => `<span class="gm-step${j < i ? ' done' : j === i ? ' now' : ''}">${round === 1 || j < i ? K.icon(MV[q].icon, 'sm') : '?'}</span>`).join('')}</div>`;
        let miss = 0, r;
        for (;;) {
          r = await timed(`<div class="gm-q">${strip}</div>`, x => judgeMove(x, k), { show: `${m.src} ！`, quiet: true, wait: 200, tries: 9 }, 12);
          if (r.quit) return;
          if (r.ok || r.r) break;
          miss++; say(miss > 1 ? '[欲速则不达|yù sù zé bù dá] 。 [慢|màn] [一点|yī diǎn] 。' : '[一心一意|yī xīn yī yì] ！', miss > 1 ? 'More haste, less speed. Slow down.' : 'Focus!');
          if (miss >= 3) break;
        }
        await doMove(k);
      }
      say('[好|hǎo] ！', 'Good!'); await tick(800);
    }
    K.closePanel(); K.endRun(); G.cam.override = null; masterPose('salute');
    await msay('[熟能生巧|shú néng shēng qiǎo] 。 [下次|xià cì] [你|nǐ] [就|jiù] [不用|bù yòng] [想|xiǎng] [了|le] 。', 'Practice makes perfect. Next time you won’t even need to think.');
    await lessonDone(4, 6);
  }
  // 5 · 比武: she calls her attack, you tell Mimo the answer before she lands it
  async function L5(o = {}) {
    const K = GK(), st = S(); training = true;
    await msay('[最后|zuì hòu] [一|yī] [课|kè] ： [比武|bǐ wǔ] 。 [我|wǒ] [不会|bù huì] [手下留情|shǒu xià liú qíng] [的|de] ！', 'The last lesson: sparring. I won’t go easy on you!');
    K.startRun(); K.openPanel('The test · 比武', 'Sparring', { seal: '武' }); K.dots(3, 0);
    say('[我|wǒ] [喊|hǎn] [什么|shén me] ， [你|nǐ] [就|jiù] [让|ràng] {mimo} [怎么|zěn me] [做|zuò] 。', `When I call out an attack, you tell ${mn()} the answer.`);
    PANEL().body.innerHTML = `<table class="kf-rules">${ATTACKS.map(a => `<tr><td>${K.zhHTML(a.call, 'gm-zh')}</td><td>${K.esc(a.en)}</td><td>→</td><td>${K.icon(MV[a.answer].icon, 'sm')}${K.zhHTML(MV[a.answer].src, 'gm-zh')}</td><td>${K.esc(a.why)}</td></tr>`).join('')}</table>`;
    K.paintIcons(PANEL().body);
    if ((await K.next()).quit) return;
    K.dock(true); frameSpar(); mimoTo(SPOT.sparMimo, SPOT.spar); ROOM.master.walkTo = { x: X0 + SPOT.spar.x, z: Z0 + SPOT.spar.z }; ROOM.master.watch = 'mimo';
    await tick(900);
    // a practice pass (no clock), then the test (the clock on)
    K.dots(3, 1);
    for (const a of ATTACKS) { const r = await exchange(a, 0); if (r.quit) return; }
    K.dots(3, 2);
    let won = 0, n = 0;
    const seq = shuffle(ATTACKS.concat(shuffle(ATTACKS.slice()).slice(0, 2)));
    say('[现在|xiàn zài] [是|shì] [真|zhēn] [的|de] ！', 'Now it’s for real!'); await tick(900);
    for (const a of seq) { const r = await exchange(a, 9); if (r.quit) return; n++; if (r.ok) won++; }
    K.closePanel(); K.endRun(); G.cam.override = null;
    if (won < 4) {
      masterPose(null);
      await msay(`[你|nǐ] [赢|yíng] [了|le] ${['[零|líng]', '[一|yī]', '[两|liǎng]', '[三|sān]'][won]} [次|cì] 。 [不|bù] [够|gòu] ！ [再|zài] [来|lái] ！ [熟能生巧|shú néng shēng qiǎo] 。`, `You won ${won} of ${n}. Not enough! Again! Practice makes perfect.`);
      return;
    }
    masterPose('salute');
    await msay(`[你|nǐ] [赢|yíng] [了|le] ${['', '', '', '', '[四|sì]', '[五|wǔ]', '[六|liù]'][won]} [次|cì] ！ [好|hǎo] ！ {mimo} [出师|chū shī] [了|le] ！`, `You won ${won} of ${n}! Well done! ${mn()} has finished the training!`);
    if (!st.done) await graduate();
  }
  // one exchange: her wind-up and call, your answer (sec: the clock, 0 for none), what happens
  async function exchange(a, sec) {
    const K = GK(), m = MV[a.answer], M = G.sim.mimo;
    masterPose('windup'); say(a.call, a.en); K.sayIt(a.call); Sound.play('shout');
    const judge = x => judgeMove(x, a.answer), o = { show: `${m.src} ！`, quiet: true, wait: 150, hints: [`${K.esc(a.why)}: ${K.model(m.src)}`] };
    const prompt = `<div class="gm-q">${K.zhHTML(a.call, 'gm-mid')}<small>Tell ${K.esc(mn())}!</small></div>`;
    const r = sec ? await timed(prompt, judge, o, sec) : await K.typeAns(prompt, judge, o);
    if (r.quit) return r;
    const ok = !!r.ok || (!r.timeout && !!r.r && r.r.ok);
    masterPose(a.k === 'quan' ? 'punch' : a.k === 'sao' ? 'sweep' : a.k === 'tui' ? 'push' : 'salute');
    if (ok) {
      await doMove(a.answer);
      if (a.k === 'kai') { const s = ROOM.master.st; Sound.play('hit'); s.z -= 0.35; G.w3d.fx.puff(s.x, Y0 + 0.4, s.z + 0.3, 5, 0.14); say('[好|hǎo] ！', 'Good!'); }
      else { Sound.play('whiff'); say('[躲|duǒ] [得|de] [好|hǎo] ！', 'Nice dodge!'); }
    } else {
      await STORY.wait(0.3); pose('tumble', 0.6); Sound.play('poof'); G.w3d.fx.puff(M.x, M.ry + 0.2, M.z, 6, 0.16); G.sim.mimoSay('!', 1);
      say(r.timeout ? '[太|tài] [慢|màn] [了|le] ！' : '[不对|bú duì] ！', r.timeout ? 'Too slow!' : `Wrong! (${a.why}: ${CJK.plain(m.src, { lang: 'zh' })})`);
    }
    await tick(900); masterPose(null);
    if (ROOM.master.st.z < Z0 + SPOT.spar.z - 0.1) ROOM.master.walkTo = { x: X0 + SPOT.spar.x, z: Z0 + SPOT.spar.z };
    return { ok };
  }
  // the end of the training: Mimo learns «推掌» (the teach box), the move for zh battles, the phrases, coins
  async function graduate() {
    const K = GK(), st = S();
    await msay('[我|wǒ] [的|de] [推掌|tuī zhǎng] ， [送给|sòng gěi] {mimo} 。 [遇到|yù dào] [小默默|xiǎo mò mò] ， [就|jiù] [用|yòng] [它|tā] ！', `My palm strike is ${mn()}’s now. When you meet the Hushlings, use it!`);
    if (typeof LEX !== 'undefined' && LEX.item('v.palm') && !LEX.taught('v.palm')) {
      const s = ROOM.master.st;
      await STORY.teachWord('v.palm', { look: { x: s.x, z: s.z }, title: `${mn()} wants to remember Master Mei’s move. What is it called?` });
    }
    st.done = 1; st.L[5] = 1;
    K.teachPhrase('ph.kf.jiayou');
    K.coinsUp(15); K.mimoHappy(28); Sound.play('fanfare');
    await UI.card(`<div class="tag">${K.esc(plainMaster())} · 梅园武馆</div><canvas width="130" height="130"></canvas><div class="big">${CJK.html('[推掌|tuī zhǎng]', { lang: 'zh' })}</div>`
      + `<div class="sub">Palm strike: ${K.esc(mn())}’s new move in battles. A push with twice the power: «${CJK.html('[推掌|tuī zhǎng] [那|nà] [只|zhī] [青蛙|qīng wā] ！', { lang: 'zh' })}» <b>E</b></div>`, { kind: 'reveal', icon: 'kf_palm' });
    await msay('[加油|jiā yóu] ！ [有|yǒu] [空|kòng] [就|jiù] [来|lái] [练练|liàn lian] 。', 'Keep it up! Come and practice whenever you have time.');
    if (G.save) G.save();
  }
  const PANEL = () => document.getElementById('gm-panel') && { body: document.querySelector('#gm-panel .gm-body') };
  // the first time: she's somehow already here, in white
  async function firstVisit() {
    const st = S(), K = GK(); st.met = 1;
    STORY.think('Wait… she’s already here, and in white practice clothes. How did she get here first?', 4.5);
    await STORY.wait(1.4); masterPose('salute');
    await msay('[其实|qí shí] ， [我|wǒ] [年轻|nián qīng] [的|de] [时候|shí hou] [是|shì] [武术|wǔ shù] [冠军|guàn jūn] 。 [这里|zhè lǐ] [是|shì] [我|wǒ] [的|de] [武馆|wǔ guǎn] 。', 'The truth is, when I was young I was a martial-arts champion. This is my training hall.');
    await msay('[在|zài] [这里|zhè lǐ] ， [别|bié] [叫|jiào] [我|wǒ] [奶奶|nǎi nai] 。 [叫|jiào] [我|wǒ] [梅|Méi] [师父|shī fu] ！', 'In here, don’t call me grandma. Call me Master Mei!');
    K.startRun(); K.openPanel('梅园武馆', 'Master Mei’s courtyard', { dock: true, seal: '武' });
    say('[叫|jiào] [我|wǒ] [什么|shén me] ？', 'What do you call me?');
    const r = await K.typeAns('<div class="gm-q">Say it: Master Mei</div>', x => (K.heardAny(x, ['[师父|shī fu]', '[梅|Méi] [师父|shī fu]']) ? { ok: true, note: K.model(`${MASTER} ！`) } : { ok: false, note: `Master: ${K.model('[师父|shī fu]')}` }), { show: `${MASTER} ！`, hints: [`${K.model('[梅|Méi]')} + ${K.model('[师父|shī fu]')} (master)`] });
    K.closePanel(); K.endRun();
    if (r.quit) return;
    masterPose(null);
    await msay('[很|hěn] [好|hǎo] 。 [我|wǒ] [看|kàn] {mimo} [很|hěn] [有|yǒu] [天分|tiān fèn] 。 [我们|wǒ men] [开始|kāi shǐ] [吧|ba] ！', `Good. I can see ${mn()} has talent. Let’s begin!`);
    if (G.save) G.save();
    await lessonMenu();
  }

  // ============================================================ in and out (a room: main.js ROOMS); the way in is grandma.js's round door
  let inside = false, busy = false;
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; Y.vx = Y.vz = Y.vy = 0; Y.onGround = true;
    M.x = x + Math.cos(yaw) * 0.95; M.z = z - Math.sin(yaw) * 0.95; M.station = null; M.look = null; M.hop = null; M.wander = null;
    [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3);
    G.sim.snap();
  }
  async function enter(o = {}) {
    if (!G || inside || busy || !isZh() || !GK()) return;
    busy = true;
    try {
      css(); addIcons();
      Sound.play('wood');
      await UI.fade(1, 420);
      GK().hideRoom();
      if (!ROOM) buildRoom();
      inside = true; ROOM.g.visible = true; paws();
      G.w3d.setInterior({ fog: '#1e2420', near: 26, far: 70 });
      const sp = SPOT.spawn; teleport(X0 + sp.x, Z0 + sp.z, Math.PI); G.cam.snap(Math.PI, 0.55, 11);
      const m = ROOM.master; m.st.x = X0 + SPOT.master.x; m.st.z = Z0 + SPOT.master.z; m.walkTo = null; masterPose(null);
      await UI.fade(0, 420);
    } catch (e) { console.error('[kungfu] enter', e); }
    busy = false;
    const st = S();
    if (!st.visited) { st.visited = true; UI.chapter('Master Mei’s courtyard', '梅园武馆'); }
    if (G.save) G.save();
    if (o.quiet) return;
    if (!st.met || o.first) await firstVisit();
    else await msay('[来|lái] [了|le] ？ [先|xiān] [扎|zā] [个|gè] [马步|mǎ bù] ！', 'Here again? Horse stance first!');
  }
  function resetMimo() {
    POSE.name = null; training = false;
    const mm = G.cast && G.cast.mimo; if (mm) { mm.body.position.set(0, 0, 0); mm.body.rotation.x = 0; mm.body.rotation.y = 0; }
    if (FEET) FEET.forEach(f => f.o.position.copy(f.p)); if (PAWS) PAWS.grp.visible = false;
  }
  async function leave() {
    if (!G || !inside || busy) return;
    busy = true;
    try {
      Sound.play('wood');
      await UI.fade(1, 380);
      inside = false; if (ROOM) ROOM.g.visible = false; resetMimo();
    } catch (e) { console.error('[kungfu] leave', e); }
    busy = false;
    await GK().enterFrom();
  }
  function roomItems() {
    const list = []; if (!inside || busy || !ROOM) return list;
    const A = (p, r, label, run) => list.push({ x: X0 + p.x, z: Z0 + p.z, y: Y0, r, label, run });
    A(SPOT.exit, 1.3, 'Leave', leave);
    const m = ROOM.master.st; list.push({ x: m.x, z: m.z + 1.3, y: Y0, r: 2.2, label: 'Talk', run: lessonMenu });
    const card = s => ({ tag: 'A scroll on the wall', lines: [{ text: s.src, en: `${s.en} (word by word: ${s.lit})`, look: { face: '#f6efdc', edge: '#5a3a22' } }] });
    A(SPOT.scrollW, 1.4, 'Read', () => SIGNS.read(card(SAYINGS[0]))); A(SPOT.scrollE, 1.4, 'Read', () => SIGNS.read(card(SAYINGS[1]))); A(SPOT.scrollN, 1.4, 'Read', () => SIGNS.read(card(SAYINGS[2])));
    A({ x: SPOT.drum.x - 0.9, z: SPOT.drum.z + 0.5 }, 1.2, 'Drum', async () => { Sound.play('hit'); G.w3d.fx.puff(X0 + SPOT.drum.x, Y0 + 1.2, Z0 + SPOT.drum.z + 0.4, 3, 0.1); });
    return list;
  }
  function keepIn() {
    const lim = (v, c, h) => Math.max(c - h, Math.min(c + h, v)), M = G.sim.mimo, Y = G.sim.you;
    if (!M.hidden && (Math.abs(M.x - X0) > HW - 0.3 || Math.abs(M.z - Z0) > HD - 0.3 || M.y < Y0 - 1)) { M.hop = null; M.wander = null; M.x = lim(M.x, X0, HW - 0.7); M.z = lim(M.z, Z0, HD - 0.7); M.y = M.ry = Y0; }
    if (M.wander && (Math.abs(M.wander.x - X0) > HW - 0.7 || Math.abs(M.wander.z - Z0) > HD - 0.7)) { M.wander.x = lim(M.wander.x, X0, HW - 0.8); M.wander.z = lim(M.wander.z, Z0, HD - 0.8); }
    if (Y.y < Y0 - 2 || Math.abs(Y.x - X0) > HW + 0.5 || Math.abs(Y.z - Z0) > HD + 0.5) { const sp = SPOT.spawn; teleport(X0 + sp.x, Z0 + sp.z, Math.PI); }
  }
  function roomUpdate(dt, t) {
    if (!inside || !ROOM) return;
    keepIn(); animateMaster(dt, t); poseUpdate(dt);
    const D = ROOM.dummy; if (D.shake > 0) { D.shake = Math.max(0, D.shake - dt * 2.2); D.post.rotation.z = Math.sin(t * 34) * 0.07 * D.shake; D.post.rotation.x = Math.sin(t * 27) * 0.04 * D.shake; } else D.post.rotation.set(0, 0, 0);
    for (const p of ROOM.petals) { p.t += dt * 0.35; const k = p.t % 1, a = p.t * 3.1 + p.m.id; p.m.position.set(SPOT.tree.x - 0.6 + Math.sin(a) * 0.8 - k * 1.6, 2.6 - k * 2.55, SPOT.tree.z + Math.cos(a * 0.7) * 0.6 + k * 1.2); p.m.rotation.set(a, a * 0.7, 0); p.m.material.opacity = 0.9 * Math.min(1, (1 - k) * 4); }
    for (let i = ROOM.fx.length - 1; i >= 0; i--) { const f = ROOM.fx[i]; f.t += dt; const k = f.t / 0.5; f.m.scale.setScalar(1 + k * 2.5); f.m.material.opacity = 0.85 * (1 - k); if (k >= 1) { G.w3d.scene.remove(f.m); f.m.material.dispose(); ROOM.fx.splice(i, 1); } }
    ROOM.sprites.forEach((s, i) => { s.material.opacity = 0.36 + 0.08 * Math.sin(t * 5.1 + i * 2.1); });
    if (G.sim.lock && !STORY.busy && !GK().panelOpen() && !busy) { G.sim.lock = 0; G.cam.override = null; }
  }

  // ============================================================ the move in zh battles: «推掌» (palm strike), a push with double power
  // battle/lang.js-style registration (appended verbs read through L.zh.verbs' cj forms; the parser indexes each language once,
  // so the index is dropped), and the move itself in flow.js's MOVES (exposed as BATTLE._.MOVES). zh only: no other language
  // has the verb, and Mimo only knows it after the training.
  function registerBattle() {
    const B = window.BATTLE && window.BATTLE._;
    const it = { id: 'v.palm', kind: 'verb', zh: '[推掌|tuī zhǎng]', en: 'palm strike', icon: 'kf_palm', battle: true, alt: { zh: ['[出掌|chū zhǎng]'] } };
    if (typeof LEX !== 'undefined' && !LEX.item('v.palm')) LEX.register([it]);
    if (!B || !B.LANGS || !B.LANGS.zh || !B.MOVES || !B.MOVES.push) return false;
    const Lz = B.LANGS.zh;
    if (!Lz.verbs.palm) Lz.verbs.palm = { show: '[推掌|tuī zhǎng]', forms: ['[推掌|tuī zhǎng]', '[出掌|chū zhǎng]'], en: 'palm strike', cj: [['[推掌|tuī zhǎng]', 'ok'], ['[出掌|chū zhǎng]', 'ok']] };
    if (Lz.tips && !Lz.tips.palm) Lz.tips.palm = 'Palm strike («[推掌|tuī zhǎng]», Master Mei’s move): a push with twice the power. Say who: «[推掌|tuī zhǎng] [那|nà] [只|zhī] [青蛙|qīng wā] ！». Like a push, it can’t reach a moth in the air.';
    delete Lz.I; delete Lz.CJ;
    if (!B.MOVES.palm) B.MOVES.palm = c => { c.power = (c.power || 1) * 2; return B.MOVES.push(c); };
    if (B.VERB_EN && !B.VERB_EN.palm) B.VERB_EN.palm = 'palm strike';
    if (B.ITEMS && !B.ITEMS.some(x => x.id === 'v.palm')) B.ITEMS.push(LEX.item('v.palm') || it);
    return true;
  }

  // ============================================================ the courtyard's song: a training montage (Sound.addSong, if audio.js has it)
  // 104 bpm, E minor pentatonic: a breakbeat with toms, a slap-bass riff, woodblocks, a dizi-like flute on the hook, the
  // guzheng sweeping in, a gong to open each half and claps in the second.
  function addSong() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit || (Sound.songs || []).includes('kungfu')) return;
    const K = Sound.kit;
    const BASS = K.mel('E2/2 r/1 E2/1 G2/2 A2/2 r/2 B2/2 D3/2 B2/2');
    const LEAD = K.mel('B4/2 D5 E5/4 D5/2 B4 A4/4 | G4/2 A4 B4/4 r/8 | E5/2 G5 A5/4 G5/2 E5 D5/4 | E5/12 r/4 | B5/2 A5 G5 E5 D5/4 E5 | G5/4 E5/2 D5 B4/8 | A4/2 B4 D5 E5 G5/4 A5 | B5/8 r/8');
    const ROOTS = K.N('E2 C2 D2 B1');
    Sound.addSong('kungfu', { bpm: 104, len: 128, swing: 0.06, vol: 0.34, verb: 0.12, echo: 0.1, echoSteps: 3, play(i, t, s16) {
      const bar = (i >> 4) & 7, st = i & 15, half = bar > 3, root = ROOTS[bar & 3] - 40;
      if (st === 0 || st === 3 || st === 8 || (st === 10 && bar & 1)) K.kick(t, st === 0 ? 0.95 : 0.7);
      if (st === 4 || st === 12) { K.snare(t, 0.5); if (half) K.clap(t, 0.6); }
      K.hat(t, st % 4 === 0 ? 0.5 : st % 2 ? 0.22 : 0.35, st === 14);
      if (half && st % 4 === 2) K.woodblock(t, st % 8 === 2, 0.6);
      if (bar === 7 && st >= 12) K.tom(t, [220, 180, 150, 120][st - 12], 0.7);
      if (st === 0 && (bar === 0 || bar === 4)) K.luo(t, false, 0.8);
      if (st === 14 && bar === 3) K.luo(t, true, 0.6);
      const b = BASS[st]; if (b) K.slap(b[0] + root, t, 0.8);
      const n = LEAD[i]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'flute', 0.9);
      if (st === 12 && (bar === 1 || bar === 5)) K.gliss([64, 67, 69, 71, 74, 76, 79], t, 0.6, 0.028);
      if (st % 8 === 0) K.zheng(52 + root + (st ? 7 : 0), t, 0.5, s16 * 4);
    } });
  }

  // ============================================================ tests (KUNGFU._.t; the game never calls them: they drive grandma.js's panel)
  const TESTS = {
    async enterNow(o = {}) { STORY.run(() => enter(Object.assign({ quiet: true }, o))); for (let i = 0; i < 80 && !(inside && !busy); i++) { await window.__g.go(0.05); await tick(40); } return inside; },
    async lesson(n, o = {}) { STORY.run(() => lesson(n)); await tick(300); return GRANDMA._.t.drive(o); },
    async first(o = {}) { STORY.run(() => firstVisit()); await tick(300); return GRANDMA._.t.drive(o); },
    frame(name) { const F = { yard: [[X0 + 0.5, Y0 + 5.2, Z0 + 10.5], [X0 + 0.2, Y0 + 0.8, Z0 - 1.6]], spar: [[X0 + 3.4, Y0 + 2.6, Z0 + 4.8], [X0 + 0.1, Y0 + 0.8, Z0 - 0.4]], dummy: [[X0 + SPOT.dummy.x + 2.8, Y0 + 2.3, Z0 + SPOT.dummy.z + 3.6], [X0 + SPOT.dummy.x + 0.3, Y0 + 0.8, Z0 + SPOT.dummy.z + 0.4]] }[name];
      G.cam.override = { pos: new THREE.Vector3(...F[0]), look: new THREE.Vector3(...F[1]), dur: 0.01 }; },
    pose, masterPose, doMove,
  };

  // ============================================================ the game side
  function init(game) {
    G = game;
    try { registerBattle(); } catch (e) { console.error('[kungfu] battle', e); }
    addIcons(); addSong();
    if (typeof LEX !== 'undefined') LEX.register(PHRASES.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', zh: p.zh, en: p.en, note: p.note, region: 'Master Mei’s courtyard', register: 'casual', icon: 'kf_scroll' })));
    try { if (typeof CJK !== 'undefined') CJK.addSource(MOVES.flatMap(m => [m.src].concat(m.alt)).concat(SAYINGS.map(s => s.src), ATTACKS.map(a => a.call), PHRASES.map(p => p.zh), [MASTER])); } catch (e) { console.error('[kungfu]', e); }
  }
  // (registered at load as well: battles may start before init in tests)
  try { registerBattle(); } catch (e) { /* (battle files not loaded on this page) */ }
  return {
    init,
    get inside() { return inside; },
    get OUTSIDE() { return inside && typeof GRANDMA !== 'undefined' ? GRANDMA._.outsideSpot() : null; },
    interactables() { return inside ? roomItems() : []; },
    update(dt, t) { roomUpdate(dt, t); },
    curiosities() { return []; },
    target() { if (!inside || !ROOM) return null; const m = ROOM.master.st; return { x: m.x, z: m.z + 1.3, hint: '{mimo} points at Master Mei.' }; },
    get busy() { return busy || (GK() ? GK().panelOpen() : false); },
    enter, leave,
    ROOM_AT: { x: X0, y: Y0, z: Z0 },
    _: { S: () => S(), MOVES, SAYINGS, ATTACKS, PHRASES, LESSONS, SPOT, judgeMove, lesson, firstVisit, graduate, exchange, registerBattle, get ROOM() { return ROOM; }, get POSE() { return POSE; }, t: TESTS },
  };
})();
