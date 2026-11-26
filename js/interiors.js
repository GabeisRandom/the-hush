'use strict';
// Every house you can see, you can walk into ("make the player able to enter any of the houses … bigger on the
// inside than they are on the outside", and "make it so you can basically talk to anyone"). Built like the Great
// Mill's rooms (mill.js): each room floats high above the far south-west woods, out of sight, and only the room
// you're in is drawn. Walls are planes facing inward, so the camera looks in like a dollhouse, and whatever hangs
// on a wall the camera is behind folds away with it. w3d.setInterior() hides the sky; you go in and out with a fade.
// A room is built the first time you walk in (the last few stay cached), seeded by its door's id (homes: see below;
// the shops and halls about 10 × 8.5 to 12.5 × 9.5), in the town's style (Alba: pastel cottage; Molinar: whitewash, beams and terracotta; Remanso: painted boards), now
// and then with a second room up the stairs or behind an inner door. People live there (Talk: a line about the
// home, through the weave), and furniture is a vocabulary chance: Look shows its word in the language, glossed,
// and Mimo gets curious about it. Twelve new words: bed, table, chair, window, door, lamp, book, clock, cup, plate,
// rug, oven.
//   INTERIORS.init(game) · .doors(game) → [{ id, town, x, z, yaw, kind, locked, floors, rooms }] · .enter(doorId) · .leave()
//   .update(dt, t) · .interactables() (inside: the way out, people, Look) · .doorPrompts(x, z) (outside: "Go in")
//   .curiosities() · .reviewSpot(id, x, z) · .inside · .current · .OUTSIDE (the door you came in by) · .song
//   .unlock(id) · .lock(id) · .isLocked(id) · .WORDS · .stats()
// A room costs about 10 draw calls and 15–45k triangles: furniture merged per material with one ink hull, and the
// people and everything that moves (clock hands, pendulums, gears, a rocking chair) in one skinned mesh.
// Needs THREE (r128), core.js, toonkit.js, lexicon.js, icons.js, ui.js, world.js; reads TOWN, MOLINAR and LAKE if loaded.
//
// Playtest 4 (DESIGN.md 16: "do it like animal crossing. either decorate the space or make the space more compact"):
// homes are compact now (about 8 × 6.5 to 10 × 7.5, upstairs 7.5 × 6) and full: every home has a profile
// (INTERIORS.home(id, { theme, people, pets, up, … }), written in interiors_alba.js / _molinar.js / _remanso.js) with
// its own resident (a name, a look, a personality, lines in every language) and a theme that lays the room out
// (INTERIORS.theme(name, { size, ground, up }), interiors_themes.js: a painter's studio, a fisher's cottage…).
// INTERIORS.kit hands the themes the building helpers. Side quests (interiors_quests.js) plug in through
// INTERIORS.hook({ talk, extras, mark, props }): they take over a resident's Talk, add things to press E on, put a
// ◆ over whoever has something for you, and draw their own small props (a lost key, a drawing on a wall).

const INTERIORS = (() => {
  // ============================================================ where the rooms float, and small helpers
  const X0 = -272, Y0 = 300, Z0 = 0;          // past the south-west woods: no colliders, no story zones, outside every region's draw range
  const CACHE = 4;                            // rooms kept built (the others are rebuilt from their seed when you come back)
  const RAY = new THREE.Vector3(-0.45, -0.82, -0.35).normalize();   // the sunlight's direction (world3d.js's sun): shafts agree with the shadows
  const INK = '#2b2235';
  const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _c = new THREE.Color(), _m3 = new THREE.Matrix3();
  let G = null;
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) || 1; };
  const pick = (a, R) => a[Math.floor(R() * a.length) % a.length];
  const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
  const mix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
  const shuffle = (a, R) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const langNow = () => (typeof UI !== 'undefined' && UI.lang) || 'es';
  const exclaim = w => (langNow() === 'es' ? '¡' : '') + cap(w) + (cjkI(langNow()) && CJK.mode(langNow()) === 'chars' ? '！' : '!');

  // ============================================================ the words: furniture is a vocabulary chance
  const NEW_WORDS = [
    { id: 'w.bed', es: 'cama', pt: 'cama', de: 'Bett', en: 'bed', g: { es: 'f', pt: 'f', de: 'n' }, pl: { es: 'camas', pt: 'camas', de: 'Betten' }, icon: 'bed' },
    { id: 'w.table', es: 'mesa', pt: 'mesa', de: 'Tisch', en: 'table', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'mesas', pt: 'mesas', de: 'Tische' }, icon: 'table' },
    { id: 'w.chair', es: 'silla', pt: 'cadeira', de: 'Stuhl', en: 'chair', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'sillas', pt: 'cadeiras', de: 'Stühle' }, icon: 'chair' },
    { id: 'w.window', es: 'ventana', pt: 'janela', de: 'Fenster', en: 'window', g: { es: 'f', pt: 'f', de: 'n' }, pl: { es: 'ventanas', pt: 'janelas', de: 'Fenster' }, icon: 'window' },
    { id: 'w.door', es: 'puerta', pt: 'porta', de: 'Tür', en: 'door', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'puertas', pt: 'portas', de: 'Türen' }, icon: 'door' },
    { id: 'w.lamp', es: 'lámpara', pt: 'luminária', de: 'Lampe', en: 'lamp', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'lámparas', pt: 'luminárias', de: 'Lampen' }, icon: 'lamp',
      alt: { pt: ['abajur', 'o abajur', 'um abajur', 'lâmpada', 'a lâmpada', 'uma lâmpada'] } },
    { id: 'w.book', es: 'libro', pt: 'livro', de: 'Buch', en: 'book', g: { es: 'm', pt: 'm', de: 'n' }, pl: { es: 'libros', pt: 'livros', de: 'Bücher' }, icon: 'book' },
    { id: 'w.clock', es: 'reloj', pt: 'relógio', de: 'Uhr', en: 'clock', g: { es: 'm', pt: 'm', de: 'f' }, pl: { es: 'relojes', pt: 'relógios', de: 'Uhren' }, icon: 'clock' },
    { id: 'w.cup', es: 'taza', pt: 'xícara', de: 'Tasse', en: 'cup', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'tazas', pt: 'xícaras', de: 'Tassen' }, icon: 'cup' },
    { id: 'w.plate', es: 'plato', pt: 'prato', de: 'Teller', en: 'plate', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'platos', pt: 'pratos', de: 'Teller' }, icon: 'plate' },
    { id: 'w.rug', es: 'alfombra', pt: 'tapete', de: 'Teppich', en: 'rug', g: { es: 'f', pt: 'm', de: 'm' }, pl: { es: 'alfombras', pt: 'tapetes', de: 'Teppiche' }, icon: 'rug',
      alt: { es: ['tapete', 'el tapete', 'un tapete'] } },
    { id: 'w.oven', es: 'horno', pt: 'forno', de: 'Ofen', en: 'oven', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'hornos', pt: 'fornos', de: 'Öfen' }, icon: 'oven' },
  ];
  NEW_WORDS.forEach(w => { if (!LEX.item(w.id)) LEX.register([Object.assign({ kind: 'word' }, w)]); });
  // zh / ja (CJK.md's notation; cl = the zh measure word or the ja counter). These are the game's forms for the twelve:
  // they're filled into whichever item is registered (domino.js may register table and chair first, without zh / ja;
  // romance.js's fill for book, cup and window only runs while they're missing, so it matches these and does nothing).
  const WORDS_CJ = {
    'w.bed': { zh: '[床|chuáng]', ja: 'ベッド', cl: { zh: '[张|zhāng]', ja: '[台|だい]' } },
    'w.table': { zh: '[桌子|zhuō zi]', ja: 'テーブル', cl: { zh: '[张|zhāng]', ja: '[台|だい]' }, alt: { zh: ['[桌|zhuō]', '[餐桌|cān zhuō]'], ja: ['[机|つくえ]'] } },
    'w.chair': { zh: '[椅子|yǐ zi]', ja: '[椅子|いす]', cl: { zh: '[把|bǎ]', ja: '[脚|きゃく]' } },
    'w.window': { zh: '[窗户|chuāng hu]', ja: '[窓|まど]', cl: { zh: '[扇|shàn]' }, alt: { zh: ['[窗|chuāng]'] } },
    'w.door': { zh: '[门|mén]', ja: 'ドア', cl: { zh: '[扇|shàn]' }, alt: { ja: ['[戸|と]', '[扉|とびら]'] } },
    'w.lamp': { zh: '[灯|dēng]', ja: 'ランプ', cl: { zh: '[盏|zhǎn]' }, alt: { zh: ['[台灯|tái dēng]', '[电灯|diàn dēng]'], ja: ['ライト', 'スタンド'] } },
    'w.book': { zh: '[书|shū]', ja: '[本|ほん]', cl: { zh: '[本|běn]', ja: '[冊|さつ]' } },
    'w.clock': { zh: '[钟|zhōng]', ja: '[時計|とけい]', cl: { zh: '[个|gè]', ja: '[台|だい]' }, alt: { zh: ['[时钟|shí zhōng]', '[挂钟|guà zhōng]', '[钟表|zhōng biǎo]'] } },
    'w.cup': { zh: '[杯子|bēi zi]', ja: 'カップ', cl: { zh: '[个|gè]', ja: '[個|こ]' }, alt: { ja: ['マグカップ'] } },
    'w.plate': { zh: '[盘子|pán zi]', ja: '[皿|さら]', cl: { zh: '[个|gè]', ja: '[枚|まい]' }, alt: { zh: ['[碟子|dié zi]'], ja: ['お[皿|さら]'] } },
    'w.rug': { zh: '[地毯|dì tǎn]', ja: 'じゅうたん', cl: { zh: '[块|kuài]', ja: '[枚|まい]' }, alt: { ja: ['[絨毯|じゅうたん]', 'ラグ', 'カーペット'] } },
    'w.oven': { zh: '[烤炉|kǎo lú]', ja: 'オーブン', cl: { zh: '[个|gè]', ja: '[台|だい]' }, alt: { zh: ['[烤箱|kǎo xiāng]', '[炉子|lú zi]'], ja: ['[窯|かま]', 'かまど'] } },
  };
  for (const [id, c] of Object.entries(WORDS_CJ)) {
    const it = LEX.item(id); if (!it) continue;
    for (const l of ['zh', 'ja']) {
      if (!it[l]) it[l] = c[l];
      if (c.cl && c.cl[l] && !(it.cl && it.cl[l])) it.cl = Object.assign({}, it.cl, { [l]: c.cl[l] });
      if (c.alt && c.alt[l] && !(it.alt && it.alt[l])) it.alt = Object.assign({}, it.alt, { [l]: c.alt[l] });
      if (it.pl && !it.pl[l]) it.pl[l] = it[l];          // (zh / ja have no plural: {w.key:pl} shows the word)
    }
  }
  // the journal's word cards list WORDS (words.js): the new ones join it
  if (typeof WORDS !== 'undefined' && Array.isArray(WORDS)) NEW_WORDS.forEach(w => { if (!WORDS.some(x => x.id === w.id)) WORDS.push(LEX.item(w.id)); });
  const WORD_IDS = NEW_WORDS.map(w => w.id);

  // their pictures, in icons.js's paper-cutout rule (drawn twice: pass 0 the paper border, pass 1 colors and ink)
  if (typeof ICONS !== 'undefined') {
    const add = (k, fn) => { if (!ICONS.keys.includes(k)) ICONS.add(k, fn); };
    const line = (c, pts, w, col) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineWidth = w; c.strokeStyle = col; c.stroke(); };
    add('bed', (c, p, h) => {
      h.shape(c, p, h.rr(-38, -26, 10, 52, 4), '#a8703f'); h.shape(c, p, h.rr(29, -4, 8, 30, 3), '#a8703f');
      h.shape(c, p, h.rr(-31, 0, 63, 14, 4), '#fdf8ee'); h.shape(c, p, h.rr(-8, -6, 40, 17, 5), '#e86a7a');
      h.shape(c, p, h.ell(-19, -5, 11, 7), '#ffffff');
      if (p) line(c, [[-8, 3], [32, 3]], 1.5, 'rgba(43,34,53,.35)');
    });
    add('table', (c, p, h) => {
      h.shape(c, p, h.rr(-28, 4, 7, 30, 2), '#8a5f3e'); h.shape(c, p, h.rr(21, 4, 7, 30, 2), '#8a5f3e');
      h.shape(c, p, h.rr(-40, -6, 80, 12, 4), '#c8925a');
      h.shape(c, p, h.rr(-6, -28, 12, 22, 4), '#5aa0d8');
      h.shape(c, p, h.ell(-5, -33, 6, 6), '#ff8fb1'); h.shape(c, p, h.ell(6, -31, 5, 5), '#ffd84a');
    });
    add('chair', (c, p, h) => {
      h.shape(c, p, h.rr(-22, -38, 9, 72, 3), '#a8703f'); h.shape(c, p, h.rr(15, 0, 7, 34, 2), '#a8703f');
      h.shape(c, p, h.rr(-22, -4, 44, 10, 3), '#c8925a'); h.shape(c, p, h.rr(-14, -13, 34, 9, 4), '#e86a7a');
      if (p) for (const y of [-28, -18]) line(c, [[-13, y], [-22, y]], 2, INK);
    });
    add('window', (c, p, h) => {
      h.shape(c, p, h.rr(-30, -32, 60, 62, 5), '#fdf8ee');
      for (const [x, y] of [[-24, -26], [3, -26], [-24, 1], [3, 1]]) h.shape(c, p, h.rr(x, y, 21, 23, 2), '#8fd3ec', 1.6);
      h.shape(c, p, h.poly([[-38, -34], [-26, -34], [-30, 34], [-40, 34]]), '#e86a7a'); h.shape(c, p, h.poly([[38, -34], [26, -34], [30, 34], [40, 34]]), '#e86a7a');
      if (p) h.dot(c, -16, -18, 4, 'rgba(255,255,255,.7)');
    });
    add('door', (c, p, h) => {
      h.shape(c, p, h.rr(-26, -40, 52, 76, 8), '#fdf8ee'); h.shape(c, p, h.rr(-20, -34, 40, 70, 6), '#8d5733');
      if (p) { h.shape(c, 1, h.rr(-13, -26, 26, 24, 3), null, 1.6); h.shape(c, 1, h.rr(-13, 4, 26, 24, 3), null, 1.6); h.dot(c, 12, 2, 3.5, '#e6b84a'); }
    });
    add('lamp', (c, p, h) => {
      h.shape(c, p, h.ell(0, 32, 18, 6), '#8a5f3e'); h.shape(c, p, h.rr(-3, -12, 6, 42, 2), '#5b3a22');
      h.shape(c, p, h.poly([[-22, -10], [22, -10], [13, -38], [-13, -38]]), '#ffd56a');
      if (p) for (const [x, y] of [[-30, -18], [30, -18], [-26, 2], [26, 2]]) line(c, [[x, y], [x * 1.25, y * 1.1]], 2, '#e6a23a');
    });
    add('book', (c, p, h) => {
      h.shape(c, p, h.rr(18, -28, 9, 58, 2), '#fffaf0'); h.shape(c, p, h.rr(-26, -32, 46, 64, 4), '#d9483b');
      h.shape(c, p, h.rr(-26, -8, 46, 8, 1), '#f2c14e');
      if (p) line(c, [[-18, -24], [12, -24]], 2, 'rgba(255,255,255,.55)');
    });
    add('clock', (c, p, h) => {
      h.shape(c, p, h.ell(0, 0, 34, 34), '#3a5a7a'); h.shape(c, p, h.ell(0, 0, 27, 27), '#fdf8ee');
      if (p) { for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; h.dot(c, Math.sin(a) * 21, -Math.cos(a) * 21, i % 3 ? 1.6 : 2.6, INK); } line(c, [[0, 0], [0, -17]], 3, INK); line(c, [[0, 0], [11, 6]], 3, INK); h.dot(c, 0, 0, 3, '#d6453a'); }
    });
    add('cup', (c, p, h) => {
      h.shape(c, p, h.ell(0, 26, 34, 8), '#fdf8ee');
      h.shape(c, p, h.ell(24, 2, 11, 12), '#5aa0d8');
      h.shape(c, p, k => { k.moveTo(-24, -14); k.lineTo(24, -14); k.quadraticCurveTo(22, 24, 0, 24); k.quadraticCurveTo(-22, 24, -24, -14); k.closePath(); }, '#5aa0d8');
      if (p) { h.dot(c, 26, 2, 5, '#fffaf0'); h.shape(c, 1, h.ell(0, -14, 24, 5), '#7a4a2a', 1.6); line(c, [[-8, -24], [-4, -34], [-8, -42]], 2, 'rgba(43,34,53,.4)'); line(c, [[6, -24], [10, -34], [6, -42]], 2, 'rgba(43,34,53,.4)'); }
    });
    add('plate', (c, p, h) => {
      h.shape(c, p, h.ell(0, 4, 38, 24), '#fdf8ee');
      if (p) { h.shape(c, 1, h.ell(0, 4, 29, 17), null, 2); c.lineWidth = 3; c.strokeStyle = '#3f6fb5'; c.beginPath(); c.ellipse(0, 4, 34, 20.5, 0, 0, TAU); c.stroke(); h.dot(c, -10, -2, 4, 'rgba(255,255,255,.9)'); }
    });
    add('rug', (c, p, h) => {
      h.shape(c, p, h.rr(-38, -22, 76, 44, 6), '#c9553f'); h.shape(c, p, h.rr(-29, -14, 58, 28, 4), '#f2c14e', 1.6);
      h.shape(c, p, h.poly([[0, -11], [16, 0], [0, 11], [-16, 0]]), '#3f6fb5', 1.6);
      if (p) for (let i = -2; i <= 2; i++) { line(c, [[-38, i * 8], [-46, i * 8]], 2, INK); line(c, [[38, i * 8], [46, i * 8]], 2, INK); }
    });
    add('oven', (c, p, h) => {
      h.shape(c, p, h.rr(-32, -30, 64, 62, 6), '#3a3436'); h.shape(c, p, h.rr(-24, -6, 48, 30, 4), '#5a5258');
      h.shape(c, p, h.rr(-15, 0, 30, 14, 3), '#ff9d3a', 1.6);
      if (p) { for (const x of [-18, -6, 6, 18]) h.dot(c, x, -19, 3.5, '#e6b84a'); line(c, [[-16, -2], [16, -2]], 3, '#c9c4bb'); }
    });
  }

  // ============================================================ what the people say (the home is the theme)
  // { en, es, pt, de }: en with {w.*}/{c.*} slots (words.js and its CHUNKS only); es/pt/de with the same {w.*} slots and
  // no {c.*}, never starting with a slot. Latin American Spanish, Brazilian Portuguese, standard German; A1; nobody
  // assumes the player's gender. who: adult / elder / kid / cat; need: what the room must have for the line to fit.
  const LN = (who, need, en, es, pt, de, town) => ({ who: who.split(' '), need: need ? need.split(' ') : [], town, en, es, pt, de });
  const POOL = [
    LN('adult elder', '', 'Come in, come in! This is my {w.house}.', '¡Pasa, pasa! Esta es mi {w.house}.', 'Entra, entra! Esta é a minha {w.house}.', 'Komm rein, komm rein! Das ist mein {w.house}.'),
    LN('adult elder', '', 'Do you like my {w.house}? It’s small, but cozy.', '¿Te gusta mi {w.house}? Es pequeña, pero muy acogedora.', 'Você gosta da minha {w.house}? É pequena, mas é aconchegante.', 'Gefällt dir mein {w.house}? Es ist klein, aber gemütlich.'),
    LN('adult elder kid', '', 'From outside, my {w.house} looks small, right? Hee hee.', 'Desde afuera, mi {w.house} parece pequeña, ¿verdad? Je, je.', 'Lá de fora, minha {w.house} parece pequena, né? Hehe.', 'Von draußen sieht mein {w.house} klein aus, oder? Hihi.'),
    LN('adult elder', 'chair', 'Sit down, {c.please}! The chair is very comfy.', '¡Siéntate, por favor! La silla es muy cómoda.', 'Senta, por favor! A cadeira é muito confortável.', 'Setz dich, bitte! Der Stuhl ist sehr bequem.'),
    LN('adult elder', 'table cup', 'Coffee? The cup is on the table.', '¿Un cafecito? La taza está en la mesa.', 'Um cafezinho? A xícara está na mesa.', 'Einen Kaffee? Die Tasse steht auf dem Tisch.'),
    LN('adult elder', 'table', 'There’s a {w.letter} on the table. It’s from my sister!', 'Hay una {w.letter} en la mesa. ¡Es de mi hermana!', 'Tem uma {w.letter} na mesa. É da minha irmã!', 'Auf dem Tisch liegt ein {w.letter}. Er ist von meiner Schwester!'),
    LN('adult elder', 'upstairs', 'My bedroom is upstairs.', 'Mi cuarto está arriba.', 'Meu quarto fica lá em cima.', 'Mein Schlafzimmer ist oben.'),
    LN('adult elder', 'plants', '{c.look} at my plants! I give them {w.water} every morning.', '¡Mira mis plantas! Les doy {w.water} cada mañana.', 'Olha as minhas plantas! Eu dou {w.water} pra elas toda manhã.', 'Schau mal, meine Pflanzen! Ich gebe ihnen jeden Morgen {w.water}.'),
    LN('adult elder', 'window', 'The window is open, but no {w.bird} sings anymore.', 'La ventana está abierta, pero ya no canta ningún {w.bird}.', 'A janela está aberta, mas nenhum {w.bird} canta mais.', 'Das Fenster ist offen, aber kein {w.bird} singt mehr.'),
    LN('adult elder', 'clock', 'The clock is old, but it still works.', 'El reloj es viejo, pero todavía funciona.', 'O relógio é velho, mas ainda funciona.', 'Die Uhr ist alt, aber sie geht noch.'),
    LN('adult elder', 'lamp', 'The lamp is on. It’s nice and warm in here.', 'La lámpara está prendida. Aquí adentro está calientito.', 'A luminária está acesa. Aqui dentro está quentinho.', 'Die Lampe ist an. Hier drin ist es schön warm.'),
    LN('adult elder kid', 'books', 'I read a book every night. This one is about a {w.fox}!', 'Leo un libro cada noche. ¡Este habla de un {w.fox}!', 'Eu leio um livro toda noite. Esse é sobre uma {w.fox}!', 'Ich lese jeden Abend ein Buch. In diesem geht es um einen {w.fox}!'),
    LN('adult', 'chair', 'We have {c.three} chairs, and we’re four. Hmm…', 'Tenemos tres sillas, y somos cuatro. Mmm…', 'A gente tem três cadeiras, e somos quatro. Hum…', 'Wir haben drei Stühle, und wir sind vier. Hm…'),
    LN('adult elder', 'cat', 'Close the door, {c.please}! The cat wants to go out.', '¡Cierra la puerta, por favor! El gato quiere salir.', 'Fecha a porta, por favor! O gato quer sair.', 'Mach bitte die Tür zu! Die Katze will raus.'),
    LN('adult elder kid', 'cat rug', 'The cat sleeps on the rug. Always!', 'El gato duerme en la alfombra. ¡Siempre!', 'O gato dorme no tapete. Sempre!', 'Die Katze schläft auf dem Teppich. Immer!'),
    LN('adult elder', '', 'Since the Hush, the {c.village} is so quiet. But here at home, we still talk!', 'Desde el Silencio, el pueblo está muy callado. ¡Pero aquí, en casa, todavía hablamos!', 'Desde o Silêncio, a vila está muito quieta. Mas aqui em casa a gente ainda conversa!', 'Seit der Stille ist das Dorf so ruhig. Aber hier zu Hause reden wir noch!'),
    LN('adult elder', '', 'Want an {w.apple}? They’re from my garden.', '¿Quieres una {w.apple}? Son de mi jardín.', 'Quer uma {w.apple}? São do meu quintal.', 'Möchtest du einen {w.apple}? Die sind aus meinem Garten.'),
    LN('elder', '', 'Eat a little {w.bread}! It’s fresh.', '¡Come un poco de {w.bread}! Está fresquito.', 'Come um pouco de {w.bread}! Está fresquinho.', 'Iss ein bisschen {w.bread}! Es ist ganz frisch.'),
    LN('adult elder', 'stove', 'I cook every day. Today: soup!', 'Cocino todos los días. ¡Hoy hay sopa!', 'Eu cozinho todo dia. Hoje tem sopa!', 'Ich koche jeden Tag. Heute gibt es Suppe!'),
    LN('adult elder', 'oven', 'The oven is hot. Careful!', 'El horno está caliente. ¡Cuidado!', 'O forno está quente. Cuidado!', 'Der Ofen ist heiß. Vorsicht!'),
    LN('adult elder', 'fire', 'The fire is nice, right? Come, warm up.', 'Qué rico el fuego, ¿no? Ven, caliéntate.', 'Que gostoso esse fogo, né? Vem se esquentar.', 'Schön, das Feuer, oder? Komm, wärm dich auf.'),
    LN('adult elder', 'rug', 'This rug is from my grandma. It’s very old.', 'Esta alfombra es de mi abuela. Es muy viejita.', 'Este tapete é da minha avó. É bem velhinho.', 'Dieser Teppich ist von meiner Oma. Er ist sehr alt.'),
    LN('adult elder', '', 'You know Noa? Then you have friends here!', '¿Conoces a Noa? ¡Entonces aquí tienes amigos!', 'Você conhece a Noa? Então aqui você tem amigos!', 'Du kennst Noa? Dann hast du hier Freunde!', 'alba'),
    LN('adult elder kid', '', 'Our {w.house} stands in the {w.water}. Listen to the waves!', 'Nuestra {w.house} está sobre el {w.water}. ¡Escucha las olas!', 'A nossa {w.house} fica em cima da {w.water}. Escuta as ondas!', 'Unser {w.house} steht im {w.water}. Hör mal, die Wellen!', 'stilt'),
    LN('adult elder', 'table', 'My grandpa made this table from an old boat.', 'Mi abuelo hizo esta mesa con un barco viejo.', 'Meu avô fez esta mesa com um barco velho.', 'Mein Opa hat diesen Tisch aus einem alten Boot gemacht.', 'remanso'),
    LN('kid', '', 'Fish for dinner. Again!', 'Pescado para la cena. ¡Otra vez!', 'Peixe no jantar. De novo!', 'Fisch zum Abendessen. Schon wieder!', 'remanso'),
    LN('adult elder', '', 'Can you hear the wind in the sails? That’s the sound of my {c.village}.', '¿Oyes el viento en las aspas? Así suena mi pueblo.', 'Está ouvindo o vento nas pás? É o som da minha vila.', 'Hörst du den Wind in den Flügeln? So klingt mein Dorf.', 'molinar'),
    LN('kid', 'bed', 'My bed is very big! Look!', '¡Mi cama es muy grande! ¡Mira!', 'Minha cama é muito grande! Olha!', 'Mein Bett ist sehr groß! Schau!'),
    LN('kid', 'bed', 'Do you want to play? My toys are under the bed.', '¿Quieres jugar? Mis juguetes están debajo de la cama.', 'Quer brincar? Meus brinquedos estão debaixo da cama.', 'Willst du spielen? Meine Spielsachen sind unter dem Bett.'),
    LN('kid', 'drawing', 'I drew a {w.star}! It’s on the wall.', '¡Dibujé una {w.star}! Está en la pared.', 'Eu desenhei uma {w.star}! Está na parede.', 'Ich habe einen {w.star} gemalt! Er hängt an der Wand.'),
    LN('kid', '', 'And who’s this little one? So cute!', '¿Y este bichito? ¡Qué lindo!', 'E esse bichinho? Que fofo!', 'Und was ist das für ein Tierchen? So süß!'),
    LN('kid', 'fire', 'My grandma tells stories by the fire.', 'Mi abuela cuenta cuentos junto al fuego.', 'Minha avó conta histórias perto do fogo.', 'Meine Oma erzählt am Feuer Geschichten.'),
    LN('kid', '', 'I’m not sleepy! Okay… a little.', '¡No tengo sueño! Bueno… un poquito.', 'Eu não tô com sono! Tá bom… um pouquinho.', 'Ich bin nicht müde! Na gut… ein bisschen.'),
    LN('kid', 'window', 'My window has the best view. I can see the {w.tower}!', 'Mi ventana tiene la mejor vista. ¡Desde aquí se ve la {w.tower}!', 'Da minha janela tem a melhor vista. Dá pra ver a {w.tower}!', 'Von meinem Fenster sieht man am besten. Da hinten ist der {w.tower}!', 'alba'),
    LN('elder', '', 'When I was young, this {w.house} was full of music.', 'Cuando yo era joven, esta {w.house} estaba llena de música.', 'Quando eu era jovem, esta {w.house} vivia cheia de música.', 'Als ich jung war, war dieses {w.house} voller Musik.'),
    LN('elder', 'upstairs', 'My grandchildren sleep upstairs. Shh…', 'Mis nietos duermen arriba. Shh…', 'Meus netos dormem lá em cima. Shh…', 'Meine Enkel schlafen oben. Pst…'),
    LN('elder', '', 'Sit with me a while. My legs are tired.', 'Siéntate un rato conmigo. Tengo las piernas cansadas.', 'Senta um pouco comigo. Minhas pernas estão cansadas.', 'Setz dich ein bisschen zu mir. Meine Beine sind müde.'),
    LN('elder', 'clock', 'Every night I wind the clock. Tick, tock…', 'Cada noche le doy cuerda al reloj. Tic, tac…', 'Toda noite eu dou corda no relógio. Tique-taque…', 'Jeden Abend ziehe ich die Uhr auf. Tick, tack…'),
    LN('adult', 'baby', 'Shh! The baby is sleeping.', '¡Shh! El bebé está durmiendo.', 'Shh! O bebê está dormindo.', 'Pst! Das Baby schläft.'),
    LN('cat', '', 'Meow.', 'Miau.', 'Miau.', 'Miau.'),
    LN('cat', '', 'Mrrrow? Purrr…', '¿Miau? Rrrr…', 'Miau? Rrrr…', 'Miau? Schnurr…'),
  ];
  const kitchenLine = right => Object.assign(LN('adult elder', '', `Hungry? The kitchen is on the ${right ? 'right' : 'left'}.`, `¿Tienes hambre? La cocina está a la ${right ? 'derecha' : 'izquierda'}.`,
    `Tá com fome? A cozinha fica à ${right ? 'direita' : 'esquerda'}.`, `Hast du Hunger? Die Küche ist ${right ? 'rechts' : 'links'}.`), {
    zh: `[饿|è] [了|le] [吗|ma] ？ [厨房|chú fáng] [在|zài] ${right ? '[右边|yòu biān]' : '[左边|zuǒ biān]'} 。`,
    ja: `おなか 、 すきました か ？ [台所|だいどころ] は ${right ? '[右|みぎ]' : '[左|ひだり]'} です よ 。` });
  // the special buildings' people
  const SAY = {
    teoGran: LN('elder', '', 'Teo brings me {w.bread} every day. Such a sweet boy!', 'Teo me trae {w.bread} todos los días. ¡Qué niño tan bueno!', 'O Teo me traz {w.bread} todo dia. Que menino bom!', 'Teo bringt mir jeden Tag {w.bread}. So ein lieber Junge!'),
    bakeOven: LN('adult', '', 'The {w.bread} is in the oven. It smells good, right?', 'El {w.bread} está en el horno. Huele rico, ¿no?', 'O {w.bread} está no forno. Que cheiro bom, né?', 'Das {w.bread} ist im Ofen. Riecht gut, oder?'),
    bakeEarly: LN('adult', '', 'We start at five in the morning. Yawn!', 'Empezamos a las cinco de la mañana. ¡Qué sueño!', 'A gente começa às cinco da manhã. Que sono!', 'Wir fangen um fünf Uhr morgens an. Gähn!'),
    bakeFlour: LN('adult', '', 'Flour everywhere! On the table, on the floor, on me…', '¡Harina por todas partes! En la mesa, en el piso, en mí…', 'Farinha pra todo lado! Na mesa, no chão, em mim…', 'Überall Mehl! Auf dem Tisch, auf dem Boden, auf mir…'),
    bakeBuy: LN('adult kid', '', 'I always buy my {w.bread} here. It’s the best!', 'Siempre compro el {w.bread} aquí. ¡Es el mejor!', 'Eu sempre compro o {w.bread} aqui. É o melhor!', 'Ich kaufe mein {w.bread} immer hier. Es ist das beste!'),
    innTable: LN('adult', '', 'A table? Sit wherever you like!', '¿Una mesa? ¡Siéntate donde quieras!', 'Uma mesa? Senta onde você quiser!', 'Einen Tisch? Setz dich, wo du willst!'),
    innSoup: LN('adult elder', '', 'The soup here is very good. And the {w.bread}, mmm!', 'La sopa de aquí es muy buena. Y el {w.bread}, ¡mmm!', 'A sopa daqui é muito boa. E o {w.bread}, hmm!', 'Die Suppe hier ist sehr gut. Und das {w.bread}, mmm!'),
    innUp: LN('adult', '', 'I’m sleeping upstairs tonight. My room has a big window.', 'Esta noche duermo arriba. Mi cuarto tiene una ventana grande.', 'Hoje eu durmo lá em cima. Meu quarto tem uma janela grande.', 'Heute schlafe ich oben. Mein Zimmer hat ein großes Fenster.'),
    innTrain: LN('adult', '', 'I came by {w.train}. Long trip! Now, a cup of tea.', 'Vine en {w.train}. ¡Qué viaje tan largo! Ahora, una taza de té.', 'Eu vim de {w.train}. Que viagem longa! Agora, uma xícara de chá.', 'Ich bin mit dem {w.train} gekommen. Lange Reise! Jetzt eine Tasse Tee.'),
    innBeds: LN('adult', '', 'The beds are clean, and the blankets are warm.', 'Las camas están limpias y las cobijas, calientitas.', 'As camas estão limpas, e os cobertores estão quentinhos.', 'Die Betten sind sauber, und die Decken sind warm.'),
    teachWords: LN('adult', '', 'Today we’re learning the words for the {w.house}: table, chair, bed…', 'Hoy aprendemos las palabras de la {w.house}: la mesa, la silla, la cama…', 'Hoje a gente aprende as palavras da {w.house}: a mesa, a cadeira, a cama…', 'Heute lernen wir die Wörter für das {w.house}: der Tisch, der Stuhl, das Bett…'),
    teachHush: LN('adult', '', 'Quiet, class! We have a visitor.', '¡Silencio, clase! Tenemos visita.', 'Silêncio, turma! Temos visita.', 'Ruhe, Klasse! Wir haben Besuch.'),
    kidDesk: LN('kid', '', 'This is my desk. And this is my book!', 'Este es mi pupitre. ¡Y este es mi libro!', 'Esta é a minha carteira. E este é o meu livro!', 'Das ist mein Platz. Und das ist mein Buch!'),
    kidBoard: LN('kid', '', 'The teacher draws a {w.house} on the board. I draw a {w.star}!', 'La maestra dibuja una {w.house} en el pizarrón. ¡Yo dibujo una {w.star}!', 'A professora desenha uma {w.house} no quadro. Eu desenho uma {w.star}!', 'Die Lehrerin malt ein {w.house} an die Tafel. Ich male einen {w.star}!'),
    kidRecess: LN('kid', '', 'Recess is soon. Then we play outside!', 'Pronto es el recreo. ¡Luego jugamos afuera!', 'Daqui a pouco é o recreio. Depois a gente brinca lá fora!', 'Gleich ist Pause. Dann spielen wir draußen!'),
    clockTick: LN('kid adult', '', 'So many clocks! Can you hear them? Tick, tock, tick, tock…', '¡Cuántos relojes! ¿Los oyes? Tic, tac, tic, tac…', 'Quantos relógios! Está ouvindo? Tique-taque, tique-taque…', 'So viele Uhren! Hörst du sie? Tick, tack, tick, tack…'),
    clockTower: LN('kid adult', '', 'This clock is from the old {w.tower}. It stopped long ago.', 'Este reloj es de la vieja {w.tower}. Se paró hace mucho.', 'Este relógio é da {w.tower} velha. Parou faz tempo.', 'Diese Uhr ist aus dem alten {w.tower}. Sie steht schon lange still.'),
    clockHelp: LN('kid', '', 'Ciro is outside. I’m his helper! I clean the gears.', 'Ciro está afuera. ¡Yo soy su ayudante! Limpio los engranajes.', 'O Ciro está lá fora. Eu sou a ajudante dele! Eu limpo as engrenagens.', 'Ciro ist draußen. Ich bin seine Helferin! Ich putze die Zahnräder.'),
    millSails: LN('adult', '', 'The sails turn, and the {w.stone} grinds the wheat. Then: flour!', 'Las aspas giran y la {w.stone} muele el trigo. ¡Y sale harina!', 'As pás giram e a {w.stone} mói o trigo. E sai farinha!', 'Die Flügel drehen sich, und der {w.stone} mahlt den Weizen. Dann: Mehl!'),
    farmCheese: LN('adult', '', 'Marga is out with her cart. I make the cheese!', 'Marga anda afuera con su carreta. ¡Yo hago el queso!', 'A Marga está lá fora com a carroça. Eu faço o queijo!', 'Marga ist draußen mit ihrem Karren. Ich mache den Käse!'),
    shedBoat: LN('adult kid', '', 'Vicente builds boats. This one is for the lake… one day!', 'Vicente hace barcos. Este es para el lago… ¡algún día!', 'O Vicente faz barcos. Este aqui é pro lago… um dia!', 'Vicente baut Boote. Das hier ist für den See… eines Tages!'),
  };
  // zh / ja (CJK.md's notation), the households' own voices: grown-ups talk to you politely in ja (です / ます), kids
  // casually, and nobody genders you. A line kids share with grown-ups has a casual jaKid that kids say instead (talk()).
  // {w.*} slots work as in es/pt/de. POOL's rows are found by the start of their English: [en start, zh, ja, jaKid].
  const POOL_CJ = [
    ['Come in, come in!', '[进来|jìn lái] [吧|ba] ， [进来|jìn lái] [吧|ba] ！ [这|zhè] [是|shì] [我|wǒ] [的|de] {w.house} 。', 'どうぞ 、 [入|はい]って ください ！ ここ が わたし の {w.house} です 。'],
    ['Do you like my', '[你|nǐ] [喜欢|xǐ huan] [我|wǒ] [的|de] {w.house} [吗|ma] ？ [不|bù] [大|dà] ， [可是|kě shì] [很|hěn] [温馨|wēn xīn] 。', 'わたし の {w.house} 、 どう です か ？ [小|ちい]さい けど 、 あったかい です よ 。'],
    ['From outside,', '[我|wǒ] [的|de] {w.house} [从|cóng] [外面|wài miàn] [看|kàn] [挺|tǐng] [小|xiǎo] [的|de] ， [对|duì] [吧|ba] ？ [嘻嘻|xī xī] 。',
      '[外|そと] から [見|み]る と 、 わたし の {w.house} は [小|ちい]さく [見|み]える でしょう ？ ふふ 。', 'うち の {w.house} 、 [外|そと] から [見|み]る と [小|ちい]さい でしょ ？ えへへ 。'],
    ['Sit down,', '[请|qǐng] [坐|zuò] ！ [这|zhè] [把|bǎ] [椅子|yǐ zi] [很|hěn] [舒服|shū fu] 。', 'どうぞ 、 [座|すわ]って ください ！ この [椅子|いす] 、 とても [楽|らく] です よ 。'],
    ['Coffee?', '[喝|hē] [杯|bēi] [咖啡|kā fēi] [吗|ma] ？ [杯子|bēi zi] [在|zài] [桌子|zhuō zi] [上|shàng] 。', 'コーヒー 、 いかが です か ？ カップ は テーブル の [上|うえ] です 。'],
    ['There’s a {w.letter}', '[桌子|zhuō zi] [上|shàng] [有|yǒu] [一|yī] [封|fēng] {w.letter} 。 [是|shì] [我|wǒ] [姐姐|jiě jie] [寄|jì] [来|lái] [的|de] ！', 'テーブル の [上|うえ] に {w.letter} が あります 。 [姉|あね] から です ！'],
    ['My bedroom is upstairs', '[我|wǒ] [的|de] [卧室|wò shì] [在|zài] [楼上|lóu shàng] 。', 'わたし の [部屋|へや] は [二階|にかい] です 。'],
    ['{c.look} at my plants', '[看|kàn] ， [我|wǒ] [的|de] [花草|huā cǎo] ！ [我|wǒ] [每天|měi tiān] [早上|zǎo shang] [给|gěi] [它们|tā men] [浇|jiāo] {w.water} 。', '[見|み]て ください 、 この [植物|しょくぶつ]たち ！ [毎朝|まいあさ] 、 {w.water} を あげて います 。'],
    ['The window is open', '[窗户|chuāng hu] [开|kāi] [着|zhe] ， [可是|kě shì] [再|zài] [也|yě] [没有|méi yǒu] {w.bird} [唱歌|chàng gē] [了|le] 。', '[窓|まど] は [開|あ]いて いる のに 、 もう {w.bird} が [歌|うた]いません 。'],
    ['The clock is old', '[这个|zhè ge] [钟|zhōng] [很|hěn] [旧|jiù] [了|le] ， [可是|kě shì] [还|hái] [在|zài] [走|zǒu] 。', 'この [時計|とけい] は [古|ふる]い けど 、 まだ [動|うご]きます 。'],
    ['The lamp is on', '[灯|dēng] [开|kāi] [着|zhe] 。 [屋里|wū lǐ] [很|hěn] [暖和|nuǎn huo] 。', 'ランプ が ついて います 。 [部屋|へや] の [中|なか] は あったかい です ね 。'],
    ['I read a book every night', '[我|wǒ] [每天|měi tiān] [晚上|wǎn shang] [看|kàn] [书|shū] 。 [这|zhè] [本|běn] [讲|jiǎng] [的|de] [是|shì] [一|yī] [只|zhī] {w.fox} ！',
      '[毎晩|まいばん] 、 [本|ほん] を [読|よ]みます 。 これ は {w.fox} の [話|はなし] です よ ！', '[毎晩|まいばん] 、 [本|ほん] を [読|よ]む ん だ 。 これ は {w.fox} の お[話|はなし] ！'],
    ['We have {c.three} chairs', '[我们|wǒ men] [有|yǒu] [三|sān] [把|bǎ] [椅子|yǐ zi] ， [可是|kě shì] [我们|wǒ men] [是|shì] [四|sì] [个|gè] [人|rén] 。 [怎么|zěn me] [办|bàn] [呢|ne] …', '[椅子|いす] は [三|みっ]つ なのに 、 うち は [四人|よにん] です 。 うーん …'],
    ['Close the door', '[请|qǐng] [关|guān] [上|shàng] [门|mén] ！ [猫|māo] [想|xiǎng] [出去|chū qù] 。', 'ドア を [閉|し]めて ください ！ [猫|ねこ] が [出|で]たがって います 。'],
    ['The cat sleeps on the rug', '[猫|māo] [睡|shuì] [在|zài] [地毯|dì tǎn] [上|shàng] 。 [天天|tiān tiān] [都|dōu] [这样|zhè yàng] ！',
      '[猫|ねこ] は じゅうたん の [上|うえ] で [寝|ね]ます 。 いつも です よ ！', '[猫|ねこ] は じゅうたん の [上|うえ] で [寝|ね]る の 。 いつも だ よ ！'],
    ['Since the Hush', '[寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [村子|cūn zi] [里|lǐ] [好|hǎo] [安静|ān jìng] 。 [可是|kě shì] [在|zài] [家|jiā] [里|lǐ] ， [我们|wǒ men] [还|hái] [在|zài] [说话|shuō huà] ！',
      '[静寂|せいじゃく] が [来|き]て から 、 [村|むら] は とても [静|しず]か です 。 でも [家|いえ] で は 、 まだ [話|はな]して います よ ！'],
    ['Want an {w.apple}', '[要|yào] [不要|bù yào] [一|yī] [个|gè] {w.apple} ？ [是|shì] [我|wǒ] [院子|yuàn zi] [里|lǐ] [种|zhòng] [的|de] 。', 'よかったら 、 {w.apple} を どうぞ 。 うち の [庭|にわ] の です よ 。'],
    ['Eat a little', '[吃|chī] [点|diǎn] {w.bread} [吧|ba] ！ [刚|gāng] [出炉|chū lú] [的|de] 。', 'さあ 、 {w.bread} を どうぞ ！ [焼|や]きたて です よ 。'],
    ['I cook every day', '[我|wǒ] [每天|měi tiān] [做饭|zuò fàn] 。 [今天|jīn tiān] [做|zuò] [汤|tāng] ！', '[毎日|まいにち] 、 [料理|りょうり] を します 。 [今日|きょう] は スープ です ！'],
    ['The oven is hot', '[烤炉|kǎo lú] [很|hěn] [烫|tàng] 。 [小心|xiǎo xīn] ！', 'オーブン は [熱|あつ]い です 。 [気|き] を つけて ください ！'],
    ['The fire is nice', '[火|huǒ] [真|zhēn] [舒服|shū fu] ， [是|shì] [吧|ba] ？ [来|lái] ， [烤烤|kǎo kao] [火|huǒ] 。', '[火|ひ] は いい です ね 。 さあ 、 あたたまって ください 。'],
    ['This rug is from my grandma', '[这|zhè] [块|kuài] [地毯|dì tǎn] [是|shì] [我|wǒ] [奶奶|nǎi nai] [的|de] 。 [很|hěn] [老|lǎo] [了|le] 。', 'この じゅうたん は [祖母|そぼ] の です 。 とても [古|ふる]い ん です よ 。'],
    ['You know Noa?', '[你|nǐ] [认识|rèn shi] [诺娅|Nuò yà] ？ [那|nà] [你|nǐ] [在|zài] [这里|zhè lǐ] [有|yǒu] [朋友|péng you] [啦|la] ！', 'ノア さん を [知|し]って いる ん です か ？ それ なら 、 ここ に も [友達|ともだち] が います よ ！'],
    ['Our {w.house} stands in the', '[我们|wǒ men] [的|de] {w.house} [建|jiàn] [在|zài] {w.water} [上|shàng] 。 [听|tīng] ， [是|shì] [波浪|bō làng] [的|de] [声音|shēng yīn] ！',
      'うち の {w.house} は {w.water} の [上|うえ] に [建|た]って います 。 [波|なみ] の [音|おと] を [聞|き]いて ください ！', 'うち の {w.house} は {w.water} の [上|うえ] に ある ん だ よ 。 [波|なみ] の [音|おと] 、 [聞|き]いて ！'],
    ['My grandpa made this table', '[这|zhè] [张|zhāng] [桌子|zhuō zi] [是|shì] [我|wǒ] [爷爷|yé ye] [用|yòng] [旧|jiù] [船|chuán] [做|zuò] [的|de] 。', 'この テーブル は 、 [祖父|そふ] が [古|ふる]い [舟|ふね] で [作|つく]りました 。'],
    ['Fish for dinner', '[晚饭|wǎn fàn] [吃|chī] [鱼|yú] 。 [又|yòu] [吃|chī] [鱼|yú] ！', '[晩|ばん]ごはん は [魚|さかな] 。 また だ よ ！'],
    ['Can you hear the wind in the sails', '[你|nǐ] [听到|tīng dào] [风|fēng] [吹|chuī] [风车|fēng chē] [的|de] [声音|shēng yīn] [了|le] [吗|ma] ？ [那|nà] [就是|jiù shì] [我们|wǒ men] [村子|cūn zi] [的|de] [声音|shēng yīn] 。',
      '[風車|ふうしゃ] の [羽根|はね] に [吹|ふ]く [風|かぜ] 、 [聞|き]こえます か ？ それ が わたし の [町|まち] の [音|おと] です 。'],
    ['My bed is very big', '[我|wǒ] [的|de] [床|chuáng] [好|hǎo] [大|dà] ！ [你|nǐ] [看|kàn] ！', 'この ベッド 、 すっごく [大|おお]きい ん だ よ ！ [見|み]て ！'],
    ['Do you want to play?', '[你|nǐ] [想|xiǎng] [玩|wán] [吗|ma] ？ [我|wǒ] [的|de] [玩具|wán jù] [在|zài] [床|chuáng] [底下|dǐ xia] 。', 'いっしょ に [遊|あそ]ぶ ？ おもちゃ は ベッド の [下|した] だ よ 。'],
    ['I drew a {w.star}', '[我|wǒ] [画|huà] [了|le] [一|yī] [颗|kē] {w.star} ！ [就|jiù] [在|zài] [墙|qiáng] [上|shàng] 。', 'ね 、 {w.star} を [描|か]いた よ ！ [壁|かべ] に [貼|は]って ある の 。'],
    ['And who’s this little one', '[这个|zhè ge] [小|xiǎo] [家伙|jiā huo] [是|shì] [谁|shéi] [呀|ya] ？ [好|hǎo] [可爱|kě ài] ！', 'この [子|こ] 、 だれ ？ かわいい ！'],
    ['My grandma tells stories', '[我|wǒ] [奶奶|nǎi nai] [在|zài] [火|huǒ] [边|biān] [讲|jiǎng] [故事|gù shi] 。', 'おばあちゃん が [火|ひ] の そば で お[話|はなし] を して くれる の 。'],
    ['I’m not sleepy!', '[我|wǒ] [不|bù] [困|kùn] ！ [好|hǎo] [吧|ba] … [有|yǒu] [一点|yī diǎn] [困|kùn] 。', '[眠|ねむ]く ない もん ！ まあ … ちょっと だけ 。'],
    ['My window has the best view', '[我|wǒ] [的|de] [窗户|chuāng hu] [风景|fēng jǐng] [最|zuì] [好|hǎo] 。 [能|néng] [看到|kàn dào] {w.tower} ！', 'この [窓|まど] から の [眺|なが]め が いちばん ！ {w.tower} が [見|み]える よ ！'],
    ['When I was young', '[我|wǒ] [年轻|nián qīng] [的|de] [时候|shí hou] ， [这|zhè] [座|zuò] {w.house} [里|lǐ] [总是|zǒng shì] [有|yǒu] [音乐|yīn yuè] 。', 'わたし が [若|わか]い [頃|ころ] 、 この {w.house} は [音楽|おんがく] で いっぱい でした 。'],
    ['My grandchildren sleep upstairs', '[我|wǒ] [的|de] [孙子|sūn zi] [孙女|sūn nǚ] [在|zài] [楼上|lóu shàng] [睡觉|shuì jiào] 。 [嘘|xū] …', '[孫|まご]たち が [二階|にかい] で [寝|ね]て います 。 しー …'],
    ['Sit with me a while', '[陪|péi] [我|wǒ] [坐|zuò] [一会|yī huì] [吧|ba] 。 [我|wǒ] [的|de] [腿|tuǐ] [累|lèi] [了|le] 。', '[少|すこ]し 、 いっしょ に [座|すわ]りましょう 。 [足|あし] が [疲|つか]れて しまって 。'],
    ['Every night I wind the clock', '[我|wǒ] [每天|měi tiān] [晚上|wǎn shang] [给|gěi] [钟|zhōng] [上|shàng] [发条|fā tiáo] 。 [滴答|dī dā] ， [滴答|dī dā] …', '[毎晩|まいばん] 、 [時計|とけい] の ねじ を [巻|ま]きます 。 チク タク …'],
    ['Shh! The baby', '[嘘|xū] ！ [宝宝|bǎo bao] [在|zài] [睡觉|shuì jiào] 。', 'しー ！ [赤|あか]ちゃん が [寝|ね]て います 。'],
    ['Meow.', '[喵|miāo] 。', 'ニャー 。'],
    ['Mrrrow?', '[喵|miāo] ？ [呼噜|hū lu] [呼噜|hū lu] …', 'ニャ ？ ゴロゴロ …'],
  ];
  // the special buildings' people: [zh, ja, jaKid]. Alma (the clockmaker's) and Rodri (the boat shed) are kids: casual.
  const SAY_CJ = {
    teoGran: ['[特奥|Tè ào] [每天|měi tiān] [给|gěi] [我|wǒ] [送|sòng] {w.bread} 。 [真|zhēn] [是|shì] [个|gè] [好|hǎo] [孩子|hái zi] ！', 'テオ くん が [毎日|まいにち] {w.bread} を [届|とど]けて くれる ん です 。 ほんとう に いい [子|こ] です よ ！'],
    bakeOven: ['{w.bread} [在|zài] [烤炉|kǎo lú] [里|lǐ] 。 [好|hǎo] [香|xiāng] [吧|ba] ？', '{w.bread} は オーブン の [中|なか] です 。 いい [匂|にお]い でしょう ？'],
    bakeEarly: ['[我们|wǒ men] [早上|zǎo shang] [五|wǔ] [点|diǎn] [就|jiù] [开始|kāi shǐ] [干活|gàn huó] 。 [好|hǎo] [困|kùn] ！', '[朝|あさ] の [五時|ごじ] に [始|はじ]めます 。 ふあ … [眠|ねむ]い です ！'],
    bakeFlour: ['[到处|dào chù] [都|dōu] [是|shì] [面粉|miàn fěn] ！ [桌子|zhuō zi] [上|shàng] ， [地|dì] [上|shàng] ， [我|wǒ] [身上|shēn shang] …', 'どこ も かしこ も [小麦粉|こむぎこ] ！ テーブル に も 、 [床|ゆか] に も 、 わたし に も …'],
    bakeBuy: ['[我|wǒ] [总是|zǒng shì] [在|zài] [这里|zhè lǐ] [买|mǎi] {w.bread} 。 [这里|zhè lǐ] [的|de] [最|zuì] [好|hǎo] [吃|chī] ！', '{w.bread} は いつも ここ で [買|か]います 。 いちばん おいしい ん です よ ！',
      '{w.bread} は いつも ここ で [買|か]う ん だ 。 いちばん おいしい よ ！'],
    innTable: ['[要|yào] [桌子|zhuō zi] [吗|ma] ？ [随便|suí biàn] [坐|zuò] ！', 'お[席|せき] です か ？ お[好|す]き な [所|ところ] に どうぞ ！'],
    innSoup: ['[这里|zhè lǐ] [的|de] [汤|tāng] [很|hěn] [好喝|hǎo hē] 。 [还有|hái yǒu] [这里|zhè lǐ] [的|de] {w.bread} ， [真|zhēn] [香|xiāng] ！', 'ここ の スープ は とても おいしい です 。 それ に {w.bread} も ！ うーん ！'],
    innUp: ['[今晚|jīn wǎn] [我|wǒ] [睡|shuì] [楼上|lóu shàng] 。 [我|wǒ] [的|de] [房间|fáng jiān] [有|yǒu] [一|yī] [扇|shàn] [大|dà] [窗户|chuāng hu] 。', '[今夜|こんや] は [二階|にかい] に [泊|と]まります 。 [部屋|へや] に [大|おお]きな [窓|まど] が ある ん です よ 。'],
    innTrain: ['[我|wǒ] [是|shì] [坐|zuò] {w.train} [来|lái] [的|de] 。 [路|lù] [好|hǎo] [远|yuǎn] ！ [现在|xiàn zài] [先|xiān] [喝|hē] [杯|bēi] [茶|chá] 。', '{w.train} で [来|き]ました 。 [長|なが]い [旅|たび] でした ！ さて 、 お[茶|ちゃ] を [一杯|いっぱい] 。'],
    innBeds: ['[床|chuáng] [很|hěn] [干净|gān jìng] ， [被子|bèi zi] [也|yě] [很|hěn] [暖和|nuǎn huo] 。', 'ベッド は きれい で 、 [毛布|もうふ] も あったかい です 。'],
    teachWords: ['[今天|jīn tiān] [我们|wǒ men] [学|xué] {w.house} [里|lǐ] [的|de] [词|cí] ： [桌子|zhuō zi] ， [椅子|yǐ zi] ， [床|chuáng] …', '[今日|きょう] は {w.house} の [言葉|ことば] を [勉強|べんきょう] します 。 テーブル 、 [椅子|いす] 、 ベッド …'],
    teachHush: ['[同学们|tóng xué men] ， [安静|ān jìng] ！ [我们|wǒ men] [有|yǒu] [客人|kè rén] [来|lái] [了|le] 。', 'みなさん 、 [静|しず]か に ！ お[客|きゃく]さん です よ 。'],
    kidDesk: ['[这|zhè] [是|shì] [我|wǒ] [的|de] [课桌|kè zhuō] 。 [这|zhè] [是|shì] [我|wǒ] [的|de] [书|shū] ！', 'これ が [机|つくえ] 。 それ から 、 これ が [本|ほん] ！'],
    kidBoard: ['[老师|lǎo shī] [在|zài] [黑板|hēi bǎn] [上|shàng] [画|huà] [了|le] [一|yī] [座|zuò] {w.house} 。 [我|wǒ] [画|huà] [了|le] [一|yī] [颗|kē] {w.star} ！', '[先生|せんせい] は [黒板|こくばん] に {w.house} を [描|か]いてる 。 こっち は {w.star} ！'],
    kidRecess: ['[马上|mǎ shàng] [就|jiù] [下课|xià kè] [了|le] 。 [然后|rán hòu] [我们|wǒ men] [去|qù] [外面|wài miàn] [玩|wán] ！', 'もう すぐ [休|やす]み [時間|じかん] ！ [外|そと] で [遊|あそ]ぶ ん だ ！'],
    clockTick: ['[好多|hǎo duō] [钟|zhōng] ！ [你|nǐ] [听见|tīng jiàn] [了|le] [吗|ma] ？ [滴答|dī dā] ， [滴答|dī dā] ， [滴答|dī dā] …', '[時計|とけい] が いっぱい ！ [聞|き]こえる ？ チク タク 、 チク タク …'],
    clockTower: ['[这个|zhè ge] [钟|zhōng] [是|shì] [从|cóng] [古|gǔ] {w.tower} [上|shàng] [拿|ná] [下来|xià lái] [的|de] 。 [很|hěn] [久|jiǔ] [以前|yǐ qián] [就|jiù] [停|tíng] [了|le] 。', 'この [時計|とけい] は [古|ふる]い {w.tower} の だ よ 。 ずっと [前|まえ] に [止|と]まっちゃった 。'],
    clockHelp: ['[西罗|Xī luó] [在|zài] [外面|wài miàn] 。 [我|wǒ] [是|shì] [他|tā] [的|de] [小|xiǎo] [帮手|bāng shǒu] ！ [我|wǒ] [擦|cā] [齿轮|chǐ lún] 。', 'シロ さん は [外|そと] に いる よ 。 わたし 、 お[手伝|てつだ]い な の ！ [歯車|はぐるま] を みがく の 。'],
    millSails: ['[风车|fēng chē] [一|yī] [转|zhuàn] ， {w.stone} [就|jiù] [磨|mò] [麦子|mài zi] 。 [然后|rán hòu] [就|jiù] [有|yǒu] [面粉|miàn fěn] [了|le] ！', '[羽根|はね] が [回|まわ]る と 、 {w.stone} が [小麦|こむぎ] を ひきます 。 そして 、 [小麦粉|こむぎこ] ！'],
    farmCheese: ['[玛尔加|Mǎ ěr jiā] [推|tuī] [着|zhe] [车|chē] [出去|chū qù] [了|le] 。 [奶酪|nǎi lào] [是|shì] [我|wǒ] [做|zuò] [的|de] ！', 'マルガ さん は [荷車|にぐるま] と [出|で]かけて います 。 チーズ は わたし が [作|つく]る ん です よ ！'],
    shedBoat: ['[维森特|Wéi sēn tè] [会|huì] [造|zào] [船|chuán] 。 [这|zhè] [条|tiáo] [是|shì] [给|gěi] [湖|hú] [上|shàng] [用|yòng] [的|de] … [总|zǒng] [有|yǒu] [一|yī] [天|tiān] ！', 'ビセンテ さん は [舟|ふね] を [作|つく]る ん だ 。 これ は [湖|みずうみ] [用|よう] … いつか ね ！'],
  };
  const withCJ = (L, zh, ja, jaKid) => Object.assign(L, { zh, ja }, jaKid ? { jaKid } : {});
  for (const [start, zh, ja, jaKid] of POOL_CJ) { const L = POOL.find(q => q.en.startsWith(start) && !q.zh); if (L) withCJ(L, zh, ja, jaKid); else console.warn('[interiors] no line starts with', start); }
  for (const [k, [zh, ja, jaKid]] of Object.entries(SAY_CJ)) if (SAY[k]) withCJ(SAY[k], zh, ja, jaKid);

  // ============================================================ the doors: every house in Alba, Molinar and Remanso
  // Alba's houses carry their seed, so their door slot is worked out exactly as town.js draws it (or read from doorAt
  // once built). Molinar's and Remanso's layouts don't list door slots: their built houses (molinar._dev / lake._dev)
  // are read when the game has them, else the door is taken as the middle of the front.
  const LOCKED = { 'alba-noa': 'Noa’s door is locked, and the shutters are closed. Nobody’s home…', 'remanso-marina': '' };
  const LAKE_FLOORS = { marina: 2, L1: 2, S1: 2 };
  let DOORS = null, doorsExact = false;
  const spotOf = (b, lx, lz) => { const c = Math.cos(b.rot || 0), s = Math.sin(b.rot || 0); return { x: b.x + lx * c + lz * s, z: b.z - lx * s + lz * c }; };
  function buildDoors(g) {
    const out = [];
    let exact = true;
    const push = (d, b, lx, lz, o = {}) => {
      const p = o.at || spotOf(b, lx, lz);
      const yaw = o.yaw !== undefined ? o.yaw : (b.rot || 0), fx = Math.sin(yaw), fz = Math.cos(yaw);
      const prompt = o.prompt || { x: p.x, z: p.z, r: 1.6 };
      const outAt = o.out || { x: p.x + fx * 0.25, z: p.z + fz * 0.25 };
      out.push(Object.assign({ x: p.x, z: p.z, yaw, prompt, out: Object.assign({ yaw }, outAt), floors: 1, colors: {} }, d));
    };
    if (typeof TOWN !== 'undefined' && TOWN.layout) {
      let n = 0;
      for (const b of TOWN.layout.buildings) {
        if (b.kind === 'house') {
          let lx = 0;
          if (!b.doorAt) { const R = rng(Math.floor(b.seed * 1e6) + 3), slots = Math.max(2, Math.min(4, Math.floor((b.w - 0.6) / 1.6))), ds = Math.floor(R() * slots); lx = -b.w / 2 + (b.w / slots) * (ds + 0.5); }
          push({ id: 'alba-house-' + String(++n).padStart(2, '0'), town: 'alba', kind: 'house', style: 'alba', floors: b.floors || 1, blue: !!b.blue,
            colors: { wall: b.wall, roof: b.roof, door: b.door, shutter: b.shutter } }, b, lx, b.d / 2 + 1.1, b.doorAt ? { at: { x: b.doorAt.x, z: b.doorAt.z } } : {});
        } else if (['noa', 'bakery', 'inn', 'school'].includes(b.kind)) {
          push({ id: 'alba-' + b.kind, town: 'alba', kind: b.kind, style: 'alba', floors: b.kind === 'inn' ? 2 : 1, colors: { wall: b.wall, roof: b.roof } }, b, 0, b.d / 2 + 1.1);
        }
      }
    }
    if (typeof MOLINAR !== 'undefined' && MOLINAR.layout) {
      const dev = g && g.molinar && g.molinar._dev, H = (dev && dev.HOUSES) || [], cen = MOLINAR.layout.center || { x: 215, z: -150 };
      if (!dev) exact = false;
      let n = 0, m = 0;
      for (const b of MOLINAR.layout.buildings) {
        if (b.kind === 'house') {
          const h = H.find(q => Math.abs(q.x - b.x) < 0.01 && Math.abs(q.z - b.z) < 0.01);
          let o = {};
          if (h && h.doorAt) o = { at: { x: h.doorAt.x, z: h.doorAt.z } };
          else if (h && h.seed !== undefined) { const R = rng(Math.floor(h.seed * 1e6) + 7), slots = clamp(Math.floor((b.w - 0.6) / 1.65), 2, 4), ds = Math.floor(R() * slots); o = { at: spotOf(b, -b.w / 2 + (b.w / slots) * (ds + 0.5), b.d / 2 + 1.1) }; }
          push({ id: 'molinar-house-' + String(++n).padStart(2, '0'), town: 'molinar', kind: 'house', style: 'molinar', floors: (h && h.floors) || 1,
            colors: h ? { wall: h.wall, band: h.band, roof: h.roof, door: h.door, shutter: h.shutter } : {} }, b, 0, b.d / 2 + 1.1, o);
        } else if (b.kind === 'clock') {
          // Ciro stands right in his doorway (a story person): his door's prompt and the way back out are beside him
          const side = spotOf(b, 1.0, b.d / 2 + 0.72);
          push({ id: 'molinar-clockmaker', town: 'molinar', kind: 'clockmaker', style: 'molinar', floors: 2, colors: { band: '#3a5a7a', door: '#3a5a7a' } }, b, 0, b.d / 2 + 1.0,
            { prompt: { x: side.x, z: side.z, r: 1.25 }, out: side });
        } else if (b.kind === 'inn' || b.kind === 'bakery') {
          push({ id: 'molinar-' + b.kind, town: 'molinar', kind: b.kind, style: 'molinar', floors: b.kind === 'inn' ? 2 : 1,
            colors: b.kind === 'inn' ? { band: '#c0563c', door: '#8d5733' } : { band: '#d9a03a', door: '#8d5733' } }, b, 0, b.d / 2 + 1.1);
        } else if (b.kind === 'millhouse') {
          const yaw = Math.atan2(b.x - cen.x, b.z - cen.z) + Math.PI, r = b.w / 2;
          push({ id: 'molinar-millhouse-' + (++m), town: 'molinar', kind: 'millhouse', style: 'molinar', colors: { band: '#3f6fb5', door: '#8d5733' } }, b, 0, 0,
            { yaw, at: { x: b.x + Math.sin(yaw) * (r + 1.1), z: b.z + Math.cos(yaw) * (r + 1.1) } });
        } else if (b.kind === 'farmhouse') {
          push({ id: 'molinar-farmhouse', town: 'molinar', kind: 'farmhouse', style: 'molinar', colors: { band: '#3f6fb5', door: '#4f7f4a', shutter: '#4f7f4a' } }, b, 0, b.d / 2 + 1.1);
        }
      }
    }
    if (typeof LAKE !== 'undefined' && LAKE.layout) {
      const dev = g && g.lake && g.lake._dev, H = (dev && dev.HOUSES) || [], LM = LAKE.landmarks || {};
      if (!dev) exact = false;
      for (const b of LAKE.layout.buildings) {
        const h = H.find(q => q.id === b.id);
        let o = {};
        if (h && h.doorAt) o = { at: { x: h.doorAt.x, z: h.doorAt.z } };
        else if (h && h.doorX !== undefined) o = { at: spotOf(b, h.doorX, b.d / 2 + 0.7) };
        if (b.id === 'marina' && LM.marinaDoor) o = { at: { x: LM.marinaDoor.x, z: LM.marinaDoor.z } };
        const kind = b.id === 'marina' ? 'marina' : b.kind === 'shed' ? 'shed' : 'house';
        push({ id: 'remanso-' + b.id, town: 'remanso', kind, style: 'lake', stilt: b.kind === 'stilt', floors: (h && h.floors) || LAKE_FLOORS[b.id] || 1,
          colors: h ? { wall: h.wall, door: h.door, shutter: h.shutter, roof: h.roof } : {} }, b, 0, b.d / 2 + 0.7, o);
      }
    }
    // a second room: upstairs in two-floor houses, the inn and the clockmaker's; behind an inner door now and then
    for (const d of out) {
      d.second = null;
      if (d.kind === 'inn' || d.kind === 'clockmaker' || ((d.kind === 'house' || d.kind === 'marina') && d.floors > 1)) d.second = 'up';
      else if (d.kind === 'house' && rng(hash(d.id + ':back'))() < 0.3) d.second = 'back';
      d.rooms = d.second ? 2 : 1;
    }
    doorsExact = exact;
    return out;
  }
  function allDoors(g) { if (!DOORS || !doorsExact) { DOORS = buildDoors(g || G); if (g || G) doorsExact = true; } return DOORS; }
  const doorById = id => allDoors().find(d => d.id === id) || null;
  // locks: Noa's house (the story opens it) and Marina's (she stands at her door); the story can lock or unlock any door
  const ST = () => { const s = G && G.state; if (!s) return { open: [], shut: [], seen: [] }; return s.interiors || (s.interiors = { open: [], shut: [], seen: [] }); };
  function isLocked(id) { const s = ST(); if ((s.shut || []).includes(id)) return true; return id in LOCKED && !(s.open || []).includes(id); }
  // another module can take a door over (school.js: Alba's house 09 is the script school in zh / ja games): no "Go in" here then
  const CLAIMS = [];
  const claimed = id => CLAIMS.some(f => { try { return !!f(id); } catch (e) { return false; } });
  function unlock(id) { const s = ST(); s.open = s.open || []; s.shut = (s.shut || []).filter(q => q !== id); if (!s.open.includes(id)) s.open.push(id); }
  function lock(id) { const s = ST(); s.shut = s.shut || []; s.open = (s.open || []).filter(q => q !== id); if (!s.shut.includes(id)) s.shut.push(id); }
  // the list (story.js reads it every frame, the minimap twice a second): one object per door, its lock refreshed.
  // x, z: where you stand to go in (the prompt's spot: beside Ciro at the clockmaker's, since he stands in his doorway)
  let PUB = null;
  function doors(game) {
    if (game && !G) G = game;
    const all = allDoors(game);
    if (!PUB || PUB.src !== all) { PUB = all.map(d => ({ id: d.id, town: d.town, kind: d.kind, x: d.prompt.x, z: d.prompt.z, yaw: d.yaw, floors: d.floors, rooms: d.rooms, locked: false, quiet: false, lockedText: '' })); PUB.src = all; }
    for (const p of PUB) { const locked = isLocked(p.id); p.locked = locked; p.quiet = locked && !LOCKED[p.id]; p.lockedText = locked ? LOCKED[p.id] || '' : ''; }
    return PUB;
  }

  // ============================================================ materials (the town's toon look: rim light, ink hulls, a dithered fade for
  // things between the camera and you) — plus the fold: a vertex's aWall (1 N, 2 E, 3 S, 4 W) collapses it while the camera is behind that wall
  const U = { uTime: { value: 0 }, uFocus: { value: new THREE.Vector3(0, -1e4, 0) }, uFade: { value: 1 }, uHide: { value: new THREE.Vector4(0, 0, 0, 0) } };
  const RIM = 'float rimF = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\ngl_FragColor.rgb += vec3(1.0, 0.95, 0.82) * rimAmt * smoothstep(0.6, 0.95, rimF);\n';
  // (the camera from viewMatrix, which every material gets: three r128 only sends cameraPosition to lit materials,
  // so the ink hulls (MeshBasicMaterial) would see it at the origin and never fade)
  const FADE = `
    { vec3 camW = -vec3(dot(viewMatrix[0].xyz, viewMatrix[3].xyz), dot(viewMatrix[1].xyz, viewMatrix[3].xyz), dot(viewMatrix[2].xyz, viewMatrix[3].xyz));
      vec3 seg = uFocus - camW; float segL = max(length(seg), 0.001); vec3 dir = seg / segL;
      vec3 rel = vWP - camW; float along = dot(rel, dir); float axis = length(rel - dir * along);
      float occl = step(0.0, along) * step(along, segL - 0.8) * (1.0 - smoothstep(0.8, 1.7, axis)) * smoothstep(1.2, 1.9, vWP.y - uFocus.y + 1.4);
      float nearCam = 1.0 - smoothstep(1.4, 3.2, length(rel));
      if (uFade > 0.5 && nearCam > 0.8) discard;      // (all the way gone right by the camera: a few leftover dots read as specks)
      float fadeAmt = uFade * max(occl * 0.88, nearCam);
      if (fadeAmt > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < fadeAmt) discard; }`;
  function patched(m, o, key) {
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U); if (o.rim) sh.uniforms.rimAmt = { value: o.rim };
      let vs = 'uniform float uTime;\nuniform vec4 uHide;\nvarying vec3 vWP;\n' + (o.wall ? 'attribute float aWall;\n' : '') + (o.flick ? 'attribute float aFlick;\n' : '') + sh.vertexShader;
      let body = '';
      if (o.flick) body += `
        transformed.x += sin(uTime * 9.0 + position.y * 6.0 + position.z * 3.0) * 0.03 * aFlick;
        transformed.y += (0.5 + 0.5 * sin(uTime * 12.0 + position.x * 5.0 + position.z * 2.0)) * 0.07 * aFlick;`;
      // (aWall over 10: the same wall, but no shadow: the walls' trim and caps)
      if (o.wall) body += `
        { float wi = mod(aWall, 10.0); float hw = wi < 0.5 ? 0.0 : wi < 1.5 ? uHide.x : wi < 2.5 ? uHide.y : wi < 3.5 ? uHide.z : uHide.w; transformed *= 1.0 - hw; }`;
      if (o.depth) body += `
        if (aWall > 9.5) transformed *= 0.0;`;
      vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>' + body);
      vs = vs.replace('#include <project_vertex>', '#include <project_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.vertexShader = vs;
      let fs = 'uniform vec3 uFocus;\nuniform float uFade;\nvarying vec3 vWP;\n' + (o.rim ? 'uniform float rimAmt;\n' : '') + sh.fragmentShader;
      if (o.fade) fs = fs.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>' + FADE);
      if (o.rim) fs = fs.replace('#include <tonemapping_fragment>', RIM + '#include <tonemapping_fragment>');
      sh.fragmentShader = fs;
    };
    m.customProgramCacheKey = () => 'int-' + key;
    return m;
  }
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    // (the rig folds too: a clock's hands go away with the wall it hangs on)
    const rig = patched(new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad, vertexColors: true, skinning: true }), { rim: 0.3, wall: 1 }, 'rig');
    MAT = {
      furn: patched(new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad, vertexColors: true }), { rim: 0.16, wall: 1, fade: 1 }, 'furn'),
      ink: patched(new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }), { wall: 1, fade: 1 }, 'ink'),
      glow: patched(new THREE.MeshBasicMaterial({ vertexColors: true }), { wall: 1, flick: 1 }, 'glow'),
      shaft: patched(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }), { wall: 1 }, 'shaft'),
      depth: patched(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }), { wall: 1, depth: 1 }, 'depth'),
      rig, rigInk: patched(new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide, skinning: true }), { wall: 1 }, 'rigInk'),
      byKey: {},
    };
    return MAT;
  }
  // a toon material with a texture (walls, floors, pictures, the blackboard), shared by every room that looks the same
  function texMat(key, tex, color, o) {
    const M = mats(), k = key + '|' + color;
    if (M.byKey[k]) return M.byKey[k];
    const m = new THREE.MeshToonMaterial({ color, gradientMap: TK.grad, map: tex, alphaTest: o.alpha ? 0.5 : 0 });
    return (M.byKey[k] = o.wall || o.fade ? patched(m, o, 'tex' + (o.wall ? 'W' : '') + (o.fade ? 'F' : '') + (o.alpha ? 'A' : '')) : m);
  }

  // ------------------------------------------------------------ canvas textures: wallpapers, plaster, boards, floors
  const TEX = {};
  function tex(key, w, h, draw, rep = true) {
    if (TEX[key]) return TEX[key];
    const t = TK.canvasTex(w, h, draw); if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    return (TEX[key] = t);
  }
  const grain = (c, n, col, R) => { c.fillStyle = col; for (let i = 0; i < n; i++) c.fillRect(R() * 256, R() * 256, 1 + R() * 3, 1 + R() * 2); };
  // the wall textures cover 2 m × 2 m; a material color tints them per room
  function wallTex(kind) {
    return tex('wall-' + kind, 256, 256, c => {
      const R = rng(hash(kind));
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, 256, 256);
      if (kind === 'stripes') { for (let x = 0; x < 256; x += 64) { c.fillStyle = '#ede5da'; c.fillRect(x, 0, 30, 256); c.fillStyle = '#e4bfc0'; c.fillRect(x + 44, 0, 4, 256); } }
      else if (kind === 'flowers') {
        for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
          const x = 32 + i * 64 + (j % 2) * 32, y = 32 + j * 64;
          c.fillStyle = '#d5e6c8'; c.beginPath(); c.ellipse(x - 9, y + 9, 6, 3, -0.7, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + 9, y + 9, 6, 3, 0.7, 0, TAU); c.fill();
          c.fillStyle = '#f1c9d0'; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; c.beginPath(); c.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 4.4, 0, TAU); c.fill(); }
          c.fillStyle = '#f3dd8e'; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill();
        }
      } else if (kind === 'dots') { c.fillStyle = '#e8dccd'; for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(16 + i * 32 + (j % 2) * 16, 16 + j * 32, 5, 0, TAU); c.fill(); } }
      else if (kind === 'diamonds') {
        c.strokeStyle = '#e6ddd0'; c.lineWidth = 3;
        for (let i = -4; i <= 8; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64 + 256, 256); c.stroke(); c.beginPath(); c.moveTo(i * 64, 256); c.lineTo(i * 64 + 256, 0); c.stroke(); }
        c.fillStyle = '#dccbe6'; for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(i * 64 + 32, j * 64, 4, 0, TAU); c.fill(); }
      } else if (kind === 'vines') {
        for (let i = 0; i < 4; i++) {
          const x0 = 32 + i * 64; c.strokeStyle = '#d3e4c6'; c.lineWidth = 3; c.beginPath();
          for (let y = 0; y <= 256; y += 8) c.lineTo(x0 + Math.sin(y / 256 * TAU * 2) * 9, y); c.stroke();
          c.fillStyle = '#c8deb8'; for (let y = 16; y < 256; y += 32) { const x = x0 + Math.sin(y / 256 * TAU * 2) * 9; c.beginPath(); c.ellipse(x + (y % 64 ? 8 : -8), y, 7, 3.5, y % 64 ? 0.5 : -0.5, 0, TAU); c.fill(); }
        }
      } else if (kind === 'plaster') {
        c.fillStyle = '#f6f1e7'; for (let i = 0; i < 70; i++) { c.globalAlpha = 0.5; c.beginPath(); c.ellipse(R() * 256, R() * 256, 8 + R() * 22, 5 + R() * 12, R() * 3, 0, TAU); c.fill(); }
        c.globalAlpha = 1; grain(c, 260, 'rgba(120,100,80,0.06)', R);
      } else if (kind === 'boards') {
        for (let i = 0; i < 8; i++) { c.fillStyle = ['#ffffff', '#f2f2f2', '#f8f8f8', '#ececec'][i % 4]; c.fillRect(0, i * 32, 256, 32); c.fillStyle = 'rgba(40,40,60,0.28)'; c.fillRect(0, i * 32, 256, 3); }
        c.fillStyle = 'rgba(40,40,60,0.12)'; for (let i = 0; i < 6; i++) c.fillRect(R() * 256, Math.floor(R() * 8) * 32 + 3, 3, 29);
      } else if (kind === 'planks') {          // rough boards for the shed
        for (let i = 0; i < 6; i++) { c.fillStyle = ['#ffffff', '#efe9e0', '#f6f2ea'][i % 3]; c.fillRect(i * 43, 0, 43, 256); c.fillStyle = 'rgba(60,40,30,0.3)'; c.fillRect(i * 43, 0, 3, 256); }
        grain(c, 300, 'rgba(90,60,40,0.08)', R);
      }
      if (kind !== 'boards' && kind !== 'planks' && kind !== 'plaster') grain(c, 120, 'rgba(120,100,90,0.05)', R);
    });
  }
  // floors: planks, checker tiles, terracotta, lake boards (the texture covers T m; set per kind in FLOORS)
  const FLOORS = { planks: 2.4, checkTeal: 2.4, checkRose: 2.4, terracotta: 2.0, lake: 2.4, stone: 3.0 };
  function floorTex(kind) {
    return tex('floor-' + kind, 256, 256, c => {
      const R = rng(hash(kind) + 7);
      if (kind === 'planks' || kind === 'lake') {
        const cols = kind === 'lake' ? ['#a7957e', '#9e8c75', '#ae9c85', '#a39079'] : ['#d6a067', '#cc965e', '#dba970', '#d29b62'];
        for (let i = 0; i < 8; i++) {
          const x = i * 32; let y = -R() * 128;
          while (y < 256) { const L = 90 + R() * 110; c.fillStyle = pick(cols, R); c.fillRect(x, y, 32, L); c.fillStyle = 'rgba(80,50,30,0.45)'; c.fillRect(x, y, 32, 2); y += L; }
          c.fillStyle = 'rgba(80,50,30,0.5)'; c.fillRect(x, 0, 2, 256);
        }
        grain(c, 260, 'rgba(90,60,40,0.10)', R);
      } else if (kind === 'checkTeal' || kind === 'checkRose') {
        const A = '#f3ead8', B = kind === 'checkTeal' ? '#8fbdb0' : '#e3a9a9';
        for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { c.fillStyle = (i + j) % 2 ? A : B; c.fillRect(i * 32, j * 32, 32, 32); }
        c.fillStyle = 'rgba(60,50,40,0.18)'; for (let i = 0; i <= 8; i++) { c.fillRect(i * 32 - 1, 0, 2, 256); c.fillRect(0, i * 32 - 1, 256, 2); }
      } else if (kind === 'terracotta') {
        c.fillStyle = '#e8d8c2'; c.fillRect(0, 0, 256, 256);
        for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { c.fillStyle = pick(['#c96f4a', '#c26a46', '#cf7a54', '#bd6442', '#c87250'], R); c.fillRect(i * 64 + 3, j * 64 + 3, 58, 58); c.fillStyle = 'rgba(255,240,220,0.12)'; c.fillRect(i * 64 + 8, j * 64 + 8, 20, 6); }
        grain(c, 200, 'rgba(90,40,20,0.10)', R);
      } else if (kind === 'stone') {
        c.fillStyle = '#9a9488'; c.fillRect(0, 0, 256, 256);
        for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) { c.fillStyle = pick(['#b8b1a3', '#aea795', '#c1baab'], R); const off = (j % 2) * 42; c.fillRect(i * 85 + off - 85 + 3, j * 64 + 3, 79, 58); c.fillRect(i * 85 + off + 3, j * 64 + 3, 79, 58); }
        grain(c, 200, 'rgba(40,40,40,0.10)', R);
      }
    });
  }

  // ------------------------------------------------------------ the picture atlas (one per language: some pictures have words on them)
  // (8 × 4 cells of 256 px: the first 16 are the old ones; the rest hang in the themed homes)
  const ATLAS = {}, CELLS = ['tower', 'hills', 'lake', 'vase', 'grandma', 'cat', 'sampler', 'calendar', 'star', 'drawhouse', 'map', 'bakeboard', 'menu', 'abc', 'family', 'blueprint',
    'stars', 'moon', 'sea', 'fishprint', 'notes', 'poster', 'flowers2', 'dino', 'sunkid', 'boat', 'mill', 'world', 'abstract', 'dog', 'birdprint', 'baby'];
  const ACOLS = 8, AROWS = 4;
  const cellUV = name => { const i = Math.max(0, CELLS.indexOf(name)), cx = i % ACOLS, cy = Math.floor(i / ACOLS); return [cx / ACOLS, 1 - (cy + 1) / AROWS, (cx + 1) / ACOLS, 1 - cy / AROWS]; };
  // (the words on them: the atlas paints these, and the Read cards show them)
  const PIC_WORDS = {
    sampler: { es: ['Hogar,', 'dulce hogar'], pt: ['Lar,', 'doce lar'], de: ['Trautes', 'Heim'] },
    board: { es: 'Hoy', pt: 'Hoje', de: 'Heute' }, menu: { es: ['Menú', 'Sopa', 'Pan', 'Queso', 'Té'], pt: ['Cardápio', 'Sopa', 'Pão', 'Queijo', 'Chá'], de: ['Speisekarte', 'Suppe', 'Brot', 'Käse', 'Tee'] },
    abc: { es: 'Ñ ñ', pt: 'Ç ç', de: 'Ä Ö Ü ß' }, loc: { es: 'es-MX', pt: 'pt-BR', de: 'de-DE' },
  };
  // zh / ja (CJK.md notation; painted as plain text in the mode, read with their readings on the Read cards)
  Object.assign(PIC_WORDS.sampler, { zh: ['[甜蜜|tián mì] [的|de]', '[家|jiā]'], ja: ['わが[家|や] が', '[一番|いちばん]'] });
  Object.assign(PIC_WORDS.board, { zh: '[今天|jīn tiān]', ja: '[今日|きょう]' });
  Object.assign(PIC_WORDS.menu, { zh: ['[菜单|cài dān]', '[汤|tāng]', '[面包|miàn bāo]', '[奶酪|nǎi lào]', '[茶|chá]'], ja: ['メニュー', 'スープ', 'パン', 'チーズ', 'お[茶|ちゃ]'] });
  Object.assign(PIC_WORDS.abc, { zh: 'Ü ü', ja: 'あ ア' }); Object.assign(PIC_WORDS.loc, { zh: 'zh-CN', ja: 'ja-JP' });
  const cjkI = lg => typeof CJK !== 'undefined' && CJK.isCJK(lg);
  const tx = (v, lg) => (Array.isArray(v) ? v.map(x => tx(x, lg)) : cjkI(lg) && typeof v === 'string' ? CJK.plain(v, { lang: lg }) : v);     // (canvas: plain text)
  const picWord = (id, fb, lg = langNow()) => { const it = LEX.item(id); return it && it[lg] ? (cjkI(lg) ? tx(it[lg], lg) : cap(it[lg])) : fb; };
  // zh / ja calendar dates in the notation: zh 11 [月|yuè] 12 [日|rì] (digits, as a Chinese calendar has them); ja in kanji with
  // the readings Japanese bends (四月 しがつ, 一日 ついたち, 二十日 はつか …)
  const KAN = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'], kan = n => (n < 10 ? KAN[n] : (n >= 20 ? KAN[Math.floor(n / 10)] : '') + '十' + KAN[n % 10]);
  const JA_MON = 'いち に さん し ご ろく しち はち く じゅう じゅういち じゅうに'.split(' ');
  const JA_DAY = ('ついたち ふつか みっか よっか いつか むいか なのか ようか ここのか とおか じゅういちにち じゅうににち じゅうさんにち じゅうよっか じゅうごにち じゅうろくにち '
    + 'じゅうしちにち じゅうはちにち じゅうくにち はつか にじゅういちにち にじゅうににち にじゅうさんにち にじゅうよっか にじゅうごにち にじゅうろくにち にじゅうしちにち にじゅうはちにち '
    + 'にじゅうくにち さんじゅうにち さんじゅういちにち').split(' ');
  const cjMonth = (lg, m) => (lg === 'zh' ? `${m} [月|yuè]` : `[${kan(m)}月|${JA_MON[m - 1]}がつ]`);
  const cjDate = (lg, m, d) => cjMonth(lg, m) + ' ' + (lg === 'zh' ? `${d} [日|rì]` : `[${kan(d)}日|${JA_DAY[d - 1]}]`);
  // the themed homes' pictures (no words on any of them): a star chart, the moon, the sea, a fish print, sheet music, a
  // concert poster, flowers, kids' drawings (a dinosaur, a sun), a sailboat, a windmill, a world map, a painter's colors,
  // a dog's portrait, a bird print, a baby's photo
  function drawCell2(c, name, h) {
    const { ink, fillInk, ellP, rect } = h, bg = col => { c.fillStyle = col; c.fillRect(0, 0, 256, 256); };
    const crayon = (col, w = 7) => { c.lineWidth = w; c.lineJoin = c.lineCap = 'round'; c.strokeStyle = col; c.stroke(); };
    if (name === 'stars') {
      bg('#1f2a5a'); const S = [[40, 62], [82, 40], [122, 72], [100, 112], [58, 122], [170, 50], [204, 92], [182, 142], [212, 192], [150, 204], [72, 196], [40, 168]];
      c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 2; c.beginPath(); [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0], [5, 6], [6, 7], [7, 8], [8, 9], [10, 11]].forEach(([a, b]) => { c.moveTo(...S[a]); c.lineTo(...S[b]); }); c.stroke();
      S.forEach(([x, y], i) => { c.fillStyle = i % 3 ? '#fff6d0' : '#ffd84a'; c.beginPath(); c.arc(x, y, i % 3 ? 3.5 : 6, 0, TAU); c.fill(); });
      for (let k = 0; k < 40; k++) { c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect((k * 97) % 256, (k * 61) % 256, 2, 2); }
      c.strokeStyle = '#c99a3e'; c.lineWidth = 8; c.beginPath(); c.arc(128, 128, 120, 0, TAU); c.stroke();
    } else if (name === 'moon') {
      bg('#2f3a6a'); for (let k = 0; k < 5; k++) { const x = 30 + k * 49; ellP(x, 128, 19, 19); fillInk('#fdf3c8', 3); if (k !== 2) { ellP(x + (k < 2 ? -1 : 1) * (8 + Math.abs(k - 2) * 5), 128, 19, 19); c.fillStyle = '#2f3a6a'; c.fill(); } }
      for (let k = 0; k < 30; k++) { c.fillStyle = '#fff6d0'; c.fillRect((k * 73) % 256, (k * 37) % 70 + 10, 2, 2); c.fillRect((k * 53) % 256, 190 + (k * 29) % 56, 2, 2); }
    } else if (name === 'sea') {
      bg('#bfe6f4'); c.fillStyle = '#3f8fc9'; c.fillRect(0, 150, 256, 106);
      for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(0, 160 + k * 18); for (let x = 0; x <= 256; x += 32) c.quadraticCurveTo(x + 16, 150 + k * 18, x + 32, 160 + k * 18); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.55)'; c.stroke(); }
      ellP(196, 64, 26, 26); fillInk('#ffd84a', 3); c.beginPath(); c.moveTo(70, 148); c.lineTo(120, 148); c.lineTo(110, 160); c.lineTo(80, 160); c.closePath(); fillInk('#d9483b', 3);
      c.beginPath(); c.moveTo(95, 146); c.lineTo(95, 92); c.lineTo(122, 140); c.closePath(); fillInk('#fdf8ee', 3);
      for (const [x, y] of [[40, 60], [70, 48]]) { c.beginPath(); c.moveTo(x - 10, y); c.quadraticCurveTo(x - 5, y - 6, x, y); c.quadraticCurveTo(x + 5, y - 6, x + 10, y); ink(3); }
    } else if (name === 'fishprint') {
      bg('#f3ead6'); c.save(); c.translate(128, 130);
      c.beginPath(); c.moveTo(-90, 0); c.quadraticCurveTo(-20, -60, 60, -6); c.lineTo(100, -40); c.lineTo(96, 40); c.lineTo(60, 6); c.quadraticCurveTo(-20, 60, -90, 0); fillInk('#4f8fb0', 4);
      ellP(-58, -8, 8, 8); fillInk('#fdf8ee', 2); ellP(-58, -8, 3, 3); c.fillStyle = INK; c.fill();
      for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(-20 + k * 20, 0, 14, -1, 1); c.lineWidth = 2; c.strokeStyle = 'rgba(43,34,53,.45)'; c.stroke(); }
      c.restore(); c.lineWidth = 10; c.strokeStyle = '#8a5f3e'; c.strokeRect(5, 5, 246, 246);
    } else if (name === 'notes') {
      bg('#fbf6e7'); c.strokeStyle = 'rgba(43,34,53,.55)'; c.lineWidth = 2;
      for (let s = 0; s < 3; s++) for (let l = 0; l < 5; l++) { c.beginPath(); c.moveTo(18, 40 + s * 70 + l * 9); c.lineTo(238, 40 + s * 70 + l * 9); c.stroke(); }
      for (let k = 0; k < 15; k++) { const s = Math.floor(k / 5), x = 40 + (k % 5) * 42, y = 40 + s * 70 + ((k * 7) % 5) * 9 - 4; ellP(x, y + 4, 7, 5, -0.4); c.fillStyle = INK; c.fill(); c.beginPath(); c.moveTo(x + 6, y + 3); c.lineTo(x + 6, y - 24); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); }
    } else if (name === 'poster') {
      bg('#2f2a4a'); for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(128, 120); c.lineTo(128 + Math.cos(k * 0.9) * 200, 120 + Math.sin(k * 0.9) * 200); c.lineWidth = 18; c.strokeStyle = k % 2 ? 'rgba(255,120,90,.35)' : 'rgba(255,214,80,.3)'; c.stroke(); }
      c.save(); c.translate(128, 132); c.rotate(-0.5); ellP(0, 30, 40, 36); fillInk('#e0743c', 4); ellP(0, -18, 30, 28); fillInk('#e0743c', 4); ellP(0, 20, 12, 12); c.fillStyle = INK; c.fill();
      rect(-6, -110, 12, 100); fillInk('#7a4f2e', 3); rect(-12, -128, 24, 22); fillInk('#5e4130', 3); c.restore();
      c.fillStyle = '#ffd84a'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(40 + k * 90, 224, 8, 0, TAU); c.fill(); }
    } else if (name === 'flowers2') {
      bg('#e7f0dc'); for (let k = 0; k < 6; k++) { const x = 30 + k * 40, y = 120 + (k % 2) * 40; c.beginPath(); c.moveTo(x, 256); c.quadraticCurveTo(x - 10, y + 60, x, y); c.lineWidth = 5; c.strokeStyle = '#4f9a45'; c.stroke();
        for (let p = 0; p < 6; p++) { ellP(x + Math.cos(p) * 14, y + Math.sin(p) * 14, 11, 11); fillInk(['#ff8fb1', '#ffd84a', '#ff6b5a', '#b9a2ff', '#ffffff', '#f29a3a'][k], 2); } ellP(x, y, 8, 8); fillInk('#e0743c', 2); }
    } else if (name === 'dino') {
      bg('#ffffff'); c.fillStyle = '#9cd67a'; c.fillRect(0, 210, 256, 46);
      c.beginPath(); c.moveTo(40, 190); c.quadraticCurveTo(60, 110, 130, 120); c.quadraticCurveTo(150, 60, 190, 70); c.quadraticCurveTo(220, 80, 205, 100); c.quadraticCurveTo(170, 110, 175, 150); c.quadraticCurveTo(170, 200, 120, 196); c.quadraticCurveTo(80, 200, 40, 190); crayon('#3fa04f');
      for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(80 + k * 20, 122); c.lineTo(88 + k * 20, 104); c.lineTo(96 + k * 20, 122); crayon('#f29a3a', 5); }
      c.fillStyle = INK; c.beginPath(); c.arc(192, 82, 4, 0, TAU); c.fill(); c.beginPath(); c.moveTo(95, 196); c.lineTo(95, 220); c.moveTo(150, 194); c.lineTo(150, 220); crayon('#3fa04f');
    } else if (name === 'sunkid') {
      bg('#ffffff'); c.beginPath(); c.arc(128, 110, 46, 0, TAU); c.fillStyle = '#ffd84a'; c.fill(); crayon('#f29a3a', 6);
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(128 + Math.cos(a) * 60, 110 + Math.sin(a) * 60); c.lineTo(128 + Math.cos(a) * 88, 110 + Math.sin(a) * 88); crayon('#f29a3a', 6); }
      c.fillStyle = INK; c.beginPath(); c.arc(112, 102, 5, 0, TAU); c.arc(144, 102, 5, 0, TAU); c.fill(); c.beginPath(); c.arc(128, 116, 18, 0.3, Math.PI - 0.3); crayon(INK, 4);
      c.fillStyle = '#7fc4e0'; c.fillRect(0, 222, 256, 34);
    } else if (name === 'boat') {
      bg('#cfe8f2'); c.fillStyle = '#4aa8d8'; c.fillRect(0, 170, 256, 86);
      c.beginPath(); c.moveTo(60, 172); c.lineTo(196, 172); c.lineTo(176, 198); c.lineTo(80, 198); c.closePath(); fillInk('#c9553f', 4);
      c.beginPath(); c.moveTo(128, 168); c.lineTo(128, 50); c.lineTo(190, 160); c.closePath(); fillInk('#fdf8ee', 4); c.beginPath(); c.moveTo(122, 160); c.lineTo(122, 70); c.lineTo(78, 160); c.closePath(); fillInk('#f2c14e', 4);
      c.lineWidth = 10; c.strokeStyle = '#c99a3e'; c.strokeRect(5, 5, 246, 246);
    } else if (name === 'mill') {
      bg('#cfe6f4'); c.beginPath(); c.moveTo(0, 200); c.quadraticCurveTo(128, 160, 256, 200); c.lineTo(256, 256); c.lineTo(0, 256); fillInk('#e6c65a', 3);
      c.beginPath(); c.moveTo(100, 200); c.lineTo(110, 100); c.lineTo(146, 100); c.lineTo(156, 200); fillInk('#fdf8ee', 4); c.beginPath(); c.moveTo(104, 102); c.lineTo(128, 74); c.lineTo(152, 102); fillInk('#c9643f', 4);
      for (let k = 0; k < 4; k++) { c.save(); c.translate(128, 104); c.rotate(k * Math.PI / 2 + 0.3); rect(-7, -86, 14, 80); fillInk('#e8dcc0', 2); c.restore(); }
      c.lineWidth = 10; c.strokeStyle = '#8a5f3e'; c.strokeRect(5, 5, 246, 246);
    } else if (name === 'world') {
      bg('#f0e2bd'); c.strokeStyle = 'rgba(122,82,54,.35)'; c.lineWidth = 2; for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(0, k * 42); c.lineTo(256, k * 42); c.stroke(); c.beginPath(); c.moveTo(k * 42, 0); c.lineTo(k * 42, 256); c.stroke(); }
      const blob = (pts, col) => { c.beginPath(); c.moveTo(...pts[0]); for (let k = 1; k < pts.length; k++) c.quadraticCurveTo(pts[k][0], pts[k][1], (pts[k][0] + pts[(k + 1) % pts.length][0]) / 2, (pts[k][1] + pts[(k + 1) % pts.length][1]) / 2); c.closePath(); fillInk(col, 3); };
      blob([[30, 50], [80, 30], [100, 70], [70, 110], [40, 100]], '#9cc27a'); blob([[70, 130], [100, 120], [96, 200], [76, 216]], '#b9c96a'); blob([[130, 40], [210, 36], [230, 90], [170, 100], [140, 80]], '#9cc27a'); blob([[150, 120], [190, 120], [196, 180], [160, 190]], '#c9b06a'); blob([[200, 190], [236, 196], [226, 226]], '#9cc27a');
      c.setLineDash([6, 6]); c.beginPath(); c.moveTo(60, 70); c.quadraticCurveTo(140, 10, 180, 70); c.lineTo(176, 150); c.lineWidth = 3; c.strokeStyle = '#d9483b'; c.stroke(); c.setLineDash([]);
    } else if (name === 'abstract') {
      bg('#fbf6e7'); [['#d9483b', 60, 70, 50], ['#3f6fb5', 170, 90, 60], ['#ffd84a', 110, 170, 54], ['#4f9a5a', 200, 200, 30]].forEach(([col, x, y, r]) => { ellP(x, y, r, r * 0.8, x / 50); c.globalAlpha = 0.85; c.fillStyle = col; c.fill(); c.globalAlpha = 1; });
      c.beginPath(); c.moveTo(20, 230); c.bezierCurveTo(80, 120, 160, 260, 240, 140); crayon(INK, 6);
      c.lineWidth = 10; c.strokeStyle = '#3a3040'; c.strokeRect(5, 5, 246, 246);
    } else if (name === 'dog') {
      bg('#cfe3d0'); ellP(128, 236, 84, 60); fillInk('#c98a4a', 4); ellP(128, 128, 60, 54); fillInk('#e0b070', 4);
      for (const s of [-1, 1]) { ellP(128 + s * 56, 130, 20, 40, s * 0.3); fillInk('#8a5a3c', 4); ellP(128 + s * 22, 118, 7, 9); c.fillStyle = INK; c.fill(); }
      ellP(128, 150, 14, 10); fillInk(INK, 2); c.beginPath(); c.arc(128, 162, 12, 0.3, Math.PI - 0.3); ink(3); ellP(128, 178, 8, 10); fillInk('#ff8fb1', 2);
      c.lineWidth = 10; c.strokeStyle = '#c99a3e'; c.strokeRect(5, 5, 246, 246);
    } else if (name === 'birdprint') {
      bg('#f6efe0'); c.beginPath(); c.moveTo(30, 200); c.quadraticCurveTo(128, 170, 230, 196); c.lineWidth = 6; c.strokeStyle = '#7a5236'; c.stroke();
      ellP(130, 140, 46, 34, -0.3); fillInk('#f2c14e', 4); ellP(166, 110, 24, 22); fillInk('#f2c14e', 4); c.beginPath(); c.moveTo(186, 108); c.lineTo(206, 114); c.lineTo(186, 120); fillInk('#e0743c', 2);
      ellP(170, 106, 4, 4); c.fillStyle = INK; c.fill(); c.beginPath(); c.moveTo(90, 150); c.lineTo(50, 172); c.lineTo(96, 164); fillInk('#e0a83a', 3);
    } else if (name === 'baby') {
      bg('#f6e3e8'); c.fillStyle = '#fff6f8'; c.fillRect(16, 16, 224, 224); ellP(128, 210, 76, 50); fillInk('#bfe0f4', 4); ellP(128, 124, 50, 48); fillInk('#f5cda2', 4);
      for (const s of [-1, 1]) { c.beginPath(); c.arc(128 + s * 18, 120, 6, Math.PI * 1.1, Math.PI * 1.9); ink(3); ellP(128 + s * 30, 140, 8, 5); c.fillStyle = 'rgba(255,140,154,.55)'; c.fill(); }
      c.beginPath(); c.arc(128, 144, 8, 0.2, Math.PI - 0.2); ink(3); c.beginPath(); c.moveTo(118, 78); c.quadraticCurveTo(128, 64, 136, 78); ink(3);
    }
  }
  function atlas() {
    const lg = langNow(), ak = lg + (cjkI(lg) ? ':' + CJK.mode(lg) : '');       // (zh / ja: one per mode too)
    if (ATLAS[ak]) return ATLAS[ak];
    const T = PIC_WORDS;
    const word = (id, fb) => picWord(id, fb, lg);
    const t = TK.canvasTex(256 * ACOLS, 256 * AROWS, c => {
      const ink = (w = 4) => { c.lineWidth = w; c.strokeStyle = INK; c.stroke(); };
      const fillInk = (col, w) => { c.fillStyle = col; c.fill(); ink(w); };
      const ellP = (x, y, rx, ry, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); };
      const rect = (x, y, w, h) => { c.beginPath(); c.rect(x, y, w, h); };
      const hand = (txt, x, y, size, col = INK, font = '"Segoe Print", "Ink Free", cursive') => { c.font = `700 ${size}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = col; c.fillText(txt, x, y); };
      CELLS.forEach((name, i) => {
        c.save(); c.translate((i % ACOLS) * 256, Math.floor(i / ACOLS) * 256);
        c.beginPath(); c.rect(0, 0, 256, 256); c.clip();
        if (name === 'tower') {        // the old tower at dusk
          const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#5a4a8a'); g.addColorStop(0.6, '#e8907a'); g.addColorStop(1, '#f6c48a'); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
          c.beginPath(); c.moveTo(0, 210); c.quadraticCurveTo(70, 170, 140, 200); c.quadraticCurveTo(200, 222, 256, 190); c.lineTo(256, 256); c.lineTo(0, 256); fillInk('#6a6a8a', 3);
          c.beginPath(); c.moveTo(108, 210); c.lineTo(114, 80); c.lineTo(142, 80); c.lineTo(148, 210); fillInk('#4f4a5e', 4);
          c.beginPath(); c.moveTo(100, 82); c.lineTo(128, 40); c.lineTo(156, 82); fillInk('#3e3a4e', 4);
          ellP(128, 110, 7, 10); fillInk('#ffd56a', 2); c.fillStyle = '#fff6d0'; for (let k = 0; k < 14; k++) { c.beginPath(); c.arc((k * 73) % 256, (k * 37) % 90 + 8, 1.6, 0, TAU); c.fill(); }
        } else if (name === 'hills') {   // the windmill hills
          c.fillStyle = '#bfe4f4'; c.fillRect(0, 0, 256, 256);
          c.beginPath(); c.moveTo(0, 170); c.quadraticCurveTo(90, 110, 180, 160); c.quadraticCurveTo(220, 180, 256, 150); c.lineTo(256, 256); c.lineTo(0, 256); fillInk('#7fbf6a', 3);
          c.beginPath(); c.moveTo(0, 215); c.quadraticCurveTo(120, 180, 256, 220); c.lineTo(256, 256); c.lineTo(0, 256); fillInk('#e6c65a', 3);
          c.beginPath(); c.moveTo(150, 140); c.lineTo(158, 80); c.lineTo(176, 80); c.lineTo(184, 140); fillInk('#fdf8ee', 3);
          c.beginPath(); c.moveTo(154, 82); c.lineTo(167, 66); c.lineTo(180, 82); fillInk('#c9643f', 3);
          for (let k = 0; k < 4; k++) { c.save(); c.translate(167, 86); c.rotate(k * Math.PI / 2 + 0.4); rect(-5, -48, 10, 44); fillInk('#e8dcc0', 2); c.restore(); }
          ellP(60, 50, 22, 22); fillInk('#ffe28a', 3);
        } else if (name === 'lake') {    // the mirror lake and its lighthouse
          c.fillStyle = '#cdeaf4'; c.fillRect(0, 0, 256, 140); c.fillStyle = '#4aa8d8'; c.fillRect(0, 140, 256, 116);
          c.beginPath(); c.moveTo(150, 150); c.quadraticCurveTo(185, 110, 230, 150); fillInk('#7fbf6a', 3);
          rect(184, 70, 18, 64); fillInk('#fdf8ee', 3); rect(184, 92, 18, 12); fillInk('#d9483b', 2); rect(180, 58, 26, 14); fillInk('#ffd56a', 3);
          c.beginPath(); c.moveTo(40, 190); c.lineTo(110, 190); c.lineTo(98, 206); c.lineTo(52, 206); c.closePath(); fillInk('#d9483b', 3);
          c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 3; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(20 + k * 40, 230); c.lineTo(44 + k * 40, 230); c.stroke(); }
        } else if (name === 'vase') {    // flowers in a jug
          c.fillStyle = '#f3e6c8'; c.fillRect(0, 0, 256, 256);
          for (let k = 0; k < 7; k++) { const a = -1.2 + k * 0.4, x = 128 + Math.sin(a) * 70, y = 110 - Math.cos(a) * 50; c.beginPath(); c.moveTo(128, 150); c.lineTo(x, y); c.lineWidth = 4; c.strokeStyle = '#4f9a45'; c.stroke(); ellP(x, y, 17, 17); fillInk(['#ff8fb1', '#ffd84a', '#ff6b5a', '#b9a2ff'][k % 4], 3); ellP(x, y, 6, 6); fillInk('#e0743c', 2); }
          c.beginPath(); c.moveTo(96, 140); c.lineTo(160, 140); c.lineTo(170, 230); c.lineTo(86, 230); c.closePath(); fillInk('#3f7fc9', 4);
        } else if (name === 'grandma' || name === 'cat') {   // portraits
          c.fillStyle = name === 'cat' ? '#bcd8ea' : '#e8d4b4'; c.fillRect(0, 0, 256, 256);
          if (name === 'grandma') {
            ellP(128, 250, 90, 70); fillInk('#7a5ab0', 4); ellP(128, 128, 56, 60); fillInk('#f5cda2', 4);
            c.beginPath(); c.arc(128, 112, 58, Math.PI * 1.05, Math.PI * 1.95); c.lineTo(186, 120); ink(); c.fillStyle = '#ece8e0'; c.fill(); ink(4);
            ellP(128, 58, 22, 18); fillInk('#ece8e0', 4);
            for (const s of [-1, 1]) { ellP(128 + s * 20, 128, 14, 14); ink(3); c.fillStyle = INK; c.beginPath(); c.arc(128 + s * 20, 128, 4, 0, TAU); c.fill(); ellP(128 + s * 34, 150, 9, 5); c.fillStyle = 'rgba(255,140,154,0.55)'; c.fill(); }
            c.beginPath(); c.arc(128, 152, 14, 0.2, Math.PI - 0.2); ink(3);
          } else {
            ellP(128, 230, 80, 60); fillInk('#e8a050', 4); ellP(128, 128, 62, 54); fillInk('#e8a050', 4);
            for (const s of [-1, 1]) { c.beginPath(); c.moveTo(128 + s * 54, 104); c.lineTo(128 + s * 40, 50); c.lineTo(128 + s * 18, 86); fillInk('#e8a050', 4); }
            for (const s of [-1, 1]) { c.beginPath(); c.arc(128 + s * 22, 122, 9, Math.PI * 1.1, Math.PI * 1.9); ink(4); c.beginPath(); c.moveTo(128 + s * 30, 146); c.lineTo(128 + s * 70, 140); ink(2); }
            ellP(128, 140, 6, 4); fillInk('#f2a0a8', 2);
          }
          c.lineWidth = 10; c.strokeStyle = '#c99a3e'; c.strokeRect(5, 5, 246, 246);
        } else if (name === 'sampler') { // "home, sweet home", stitched
          c.fillStyle = '#f7f0dc'; c.fillRect(0, 0, 256, 256);
          c.setLineDash([6, 5]); c.lineWidth = 3; c.strokeStyle = '#d9483b'; c.strokeRect(16, 16, 224, 224); c.setLineDash([]);
          const s = tx(T.sampler[lg] || T.sampler.es, lg); hand(s[0], 128, 72, 34, '#3f6fb5'); hand(s[1], 128, 112, 30, '#3f6fb5');
          c.beginPath(); c.moveTo(98, 200); c.lineTo(98, 160); c.lineTo(128, 136); c.lineTo(158, 160); c.lineTo(158, 200); c.closePath(); fillInk('#f2c14e', 3); rect(120, 176, 16, 24); fillInk('#d9483b', 2);
          for (const x of [56, 200]) { c.beginPath(); c.moveTo(x, 196); c.bezierCurveTo(x - 22, 176, x - 8, 158, x, 172); c.bezierCurveTo(x + 8, 158, x + 22, 176, x, 196); fillInk('#e86a7a', 2); }
        } else if (name === 'calendar') {
          c.fillStyle = '#fffaf0'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#d9483b'; c.fillRect(0, 0, 256, 70);
          let month = '', day = new Date().getDate(); try { month = cjkI(lg) ? tx(cjMonth(lg, new Date().getMonth() + 1), lg) : new Date().toLocaleString(T.loc[lg] || 'es-MX', { month: 'long' }); } catch (e) { month = ''; }
          hand(cap(month || '·'), 128, 38, 34, '#fffaf0', 'Bahnschrift, "Segoe UI", sans-serif'); hand(String(day), 128, 152, 100, INK, 'Bahnschrift, "Segoe UI", sans-serif');
          for (let k = 0; k < 6; k++) { c.fillStyle = '#c9c4bb'; c.beginPath(); c.arc(30 + k * 39, 12, 6, 0, TAU); c.fill(); }
        } else if (name === 'star' || name === 'drawhouse') {   // a kid's crayon drawings
          c.fillStyle = '#ffffff'; c.fillRect(0, 0, 256, 256); c.lineJoin = 'round';
          if (name === 'star') { c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 40 : 96; c.lineTo(128 + Math.cos(a) * r, 134 + Math.sin(a) * r); } c.closePath(); c.fillStyle = '#ffd84a'; c.fill(); c.lineWidth = 7; c.strokeStyle = '#f29a3a'; c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(112, 128, 6, 0, TAU); c.arc(146, 128, 6, 0, TAU); c.fill(); c.beginPath(); c.arc(129, 146, 14, 0.3, Math.PI - 0.3); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); }
          else { c.fillStyle = '#7fbf6a'; c.fillRect(0, 200, 256, 56); c.lineWidth = 6; c.strokeStyle = '#d9483b'; c.beginPath(); c.moveTo(60, 120); c.lineTo(128, 60); c.lineTo(196, 120); c.stroke(); c.strokeStyle = '#3f6fb5'; c.strokeRect(74, 120, 108, 84); c.strokeStyle = '#8d5733'; c.strokeRect(112, 150, 30, 54); c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(210, 46, 24, 0, TAU); c.fill(); }
        } else if (name === 'map') {     // Alba, the road east to Molinar, the lake west, the tower north
          c.fillStyle = '#efe0bc'; c.fillRect(0, 0, 256, 256);
          ellP(52, 150, 40, 30); fillInk('#7fc4e0', 3);
          c.setLineDash([8, 6]); c.lineWidth = 4; c.strokeStyle = '#a8673a'; c.beginPath(); c.moveTo(70, 150); c.lineTo(128, 150); c.lineTo(206, 150); c.moveTo(128, 150); c.lineTo(128, 236); c.stroke(); c.setLineDash([]);
          for (const [x, y, col] of [[128, 150, '#c9553f'], [206, 150, '#e8dcc0'], [52, 150, '#f2c94c']]) { ellP(x, y, 12, 12); fillInk(col, 3); }
          c.beginPath(); c.moveTo(122, 50); c.lineTo(126, 18); c.lineTo(134, 18); c.lineTo(138, 50); fillInk('#4f4a5e', 3);
          c.lineWidth = 3; c.strokeStyle = '#d9483b'; c.beginPath(); c.arc(130, 36, 22, 0, TAU); c.stroke();
        } else if (name === 'bakeboard' || name === 'menu') {   // chalkboards with words (bold and as big as they fit; E «Read» shows them big)
          c.fillStyle = '#7a5236'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#2f3a33'; c.fillRect(12, 12, 232, 232);
          const chalk = 'Bahnschrift, "Segoe UI", sans-serif';
          const fitTo = (txt, maxW, px) => { let s = px; c.font = `800 ${s}px ${chalk}`; while (s > 12 && c.measureText(txt).width > maxW) { s -= 1; c.font = `800 ${s}px ${chalk}`; } return s; };
          c.textBaseline = 'middle';
          if (name === 'bakeboard') {
            const hoy = tx(T.board[lg] || 'Hoy', lg); c.textAlign = 'center'; c.fillStyle = '#fdf8ee'; fitTo(hoy, 200, 54); c.fillText(hoy, 128, 50);
            [[word('w.bread', 'Pan'), '4'], [word('w.cake', 'Pastel'), '9'], [word('w.cookie', 'Galleta'), '1']].forEach(([w, p], k) => { c.textAlign = 'left'; fitTo(w, 140, 38); c.fillStyle = '#fdf8ee'; c.fillText(w, 26, 112 + k * 46); c.textAlign = 'right'; c.font = `800 34px ${chalk}`; c.fillStyle = '#ffd84a'; c.fillText(p + ' ●', 230, 112 + k * 46); });
          } else {
            const m = tx(T.menu[lg] || T.menu.es, lg); c.textAlign = 'center'; c.fillStyle = '#fdf8ee'; fitTo(m[0], 216, 46); c.fillText(m[0], 128, 46);
            m.slice(1).forEach((w, k) => { c.fillStyle = k % 2 ? '#ffd84a' : '#fdf8ee'; fitTo(w, 200, 36); c.fillText(w, 128, 100 + k * 40); });
          }
        } else if (name === 'abc') {     // the alphabet poster
          c.fillStyle = '#fffaf0'; c.fillRect(0, 0, 256, 256);
          const L = 'ABCDEFGHI'; for (let k = 0; k < 9; k++) hand(L[k] + L[k].toLowerCase(), 46 + (k % 3) * 82, 46 + Math.floor(k / 3) * 56, 34, ['#d9483b', '#3f6fb5', '#4f9a5a'][k % 3], 'Bahnschrift, "Segoe UI", sans-serif');
          hand(T.abc[lg] || 'Ñ ñ', 128, 222, 38, '#8a5ab0', 'Bahnschrift, "Segoe UI", sans-serif');
        } else if (name === 'family') {  // a photo: two grown-ups and a kid
          c.fillStyle = '#d8c8a8'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#efe6d0'; c.fillRect(14, 14, 228, 228);
          for (const [x, s, col] of [[80, 1, '#5a86b8'], [176, 1, '#c9553f'], [128, 0.7, '#f2c14e']]) { ellP(x, 236 - 40 * s, 40 * s, 70 * s); fillInk(col, 3); ellP(x, 236 - 120 * s, 26 * s, 28 * s); fillInk('#f0c7a0', 3); }
        } else if (name === 'blueprint') {   // a boat's plan, or a clock's gears
          c.fillStyle = '#3f6fb5'; c.fillRect(0, 0, 256, 256); c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 3;
          c.beginPath(); c.moveTo(30, 110); c.quadraticCurveTo(128, 190, 226, 110); c.lineTo(30, 110); c.stroke();
          for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(30 + k * 33, 110); c.lineTo(30 + k * 33, 110 + Math.sin(k / 6 * Math.PI) * 40); c.stroke(); }
          for (const [x, y, r] of [[80, 196, 26], [134, 206, 16]]) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.lineTo(x + Math.cos(a) * (r + 7), y + Math.sin(a) * (r + 7)); c.stroke(); } }
        } else drawCell2(c, name, { ink, fillInk, ellP, rect, hand });
        c.restore();
      });
    });
    t.anisotropy = 4;
    return (ATLAS[ak] = t);
  }
  // the school's blackboard: the words for the house, in chalk (one per language)
  const BOARDS = {};
  function boardTex() {
    const lg = langNow(), bk = lg + (cjkI(lg) ? ':' + CJK.mode(lg) : '');
    if (BOARDS[bk]) return BOARDS[bk];
    const title = tx({ es: 'La casa', pt: 'A casa', de: 'Das Haus', zh: '[房子|fáng zi]', ja: '[家|いえ]' }[lg] || 'La casa', lg);
    const t = TK.canvasTex(1024, 384, c => {
      c.fillStyle = '#2f4a3c'; c.fillRect(0, 0, 1024, 384);
      c.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 40; i++) c.fillRect((i * 97) % 1024, (i * 53) % 384, 90, 16);
      const chalk = 'Bahnschrift, "Segoe UI", sans-serif';          // (bold chalk letters you can read from the back of the class)
      c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = '#fdf8ee'; c.font = `800 72px ${chalk}`; c.fillText(title, 50, 64);
      c.strokeStyle = '#fdf8ee'; c.lineWidth = 4; c.beginPath(); c.moveTo(50, 110); c.lineTo(370, 110); c.stroke();
      const ids = ['w.table', 'w.chair', 'w.bed', 'w.window', 'w.door', 'w.lamp'];
      ids.forEach((id, k) => { const t = LEX.form(id, { article: true }); let s = 52; c.font = `800 ${s}px ${chalk}`; while (s > 20 && c.measureText(t).width > 320) { s -= 2; c.font = `800 ${s}px ${chalk}`; } c.fillStyle = k % 2 ? '#ffe9a8' : '#fdf8ee'; c.fillText(t, 60 + Math.floor(k / 3) * 360, 172 + (k % 3) * 72); });
      c.strokeStyle = '#fdf8ee'; c.lineWidth = 5; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(780, 210); c.lineTo(870, 130); c.lineTo(960, 210); c.stroke(); c.strokeRect(800, 210, 140, 110); c.strokeRect(855, 262, 30, 58); c.strokeRect(812, 226, 30, 26);
      c.beginPath(); c.arc(960, 70, 30, 0, TAU); c.stroke();
    });
    t.anisotropy = 4;
    return (BOARDS[bk] = t);
  }

  // ============================================================ the kit: pieces in a local frame → merged meshes (town.js's way)
  const prism = (() => { const a = [-0.5, 0, -0.5], b = [-0.5, 0, 0.5], c = [-0.5, 1, 0], d = [0.5, 0, -0.5], e = [0.5, 0, 0.5], f = [0.5, 1, 0];
    const tris = [a, b, c, d, f, e, a, d, e, a, e, b, b, e, f, b, f, c, a, c, f, a, f, d];
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(tris.flat(), 3)); g.computeVertexNormals(); return g; })();
  const GEO = {
    box: TK.G.box, plane: new THREE.PlaneGeometry(1, 1), prism,
    cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl6: new THREE.CylinderGeometry(1, 1, 1, 6), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
    cyl16: new THREE.CylinderGeometry(1, 1, 1, 16), cyl24: new THREE.CylinderGeometry(1, 1, 1, 24),
    taper: new THREE.CylinderGeometry(0.72, 1, 1, 12), bowl: new THREE.CylinderGeometry(1, 0.72, 1, 12),
    halfDisc: new THREE.CylinderGeometry(1, 1, 1, 16, 1, false, Math.PI / 2, Math.PI),
    cone: new THREE.ConeGeometry(1, 1, 10), cone6: new THREE.ConeGeometry(1, 1, 6),
    ball: new THREE.SphereGeometry(1, 12, 8), ball6: new THREE.SphereGeometry(1, 8, 6), half: new THREE.SphereGeometry(1, 14, 6, 0, TAU, 0, Math.PI / 2),
    ico0: TK.G.ico0, ico1: TK.G.ico1,
    torus: new THREE.TorusGeometry(1, 0.22, 6, 16), thin: new THREE.TorusGeometry(1, 0.1, 4, 20), arch: new THREE.TorusGeometry(1, 0.16, 6, 14, Math.PI),
  };
  const NI = new Map(), BBX = new Map();
  const ni = g => { let r = NI.get(g); if (!r) { r = g.index ? g.toNonIndexed() : g; NI.set(g, r); } return r; };
  const bbOf = g => { let r = BBX.get(g); if (!r) { g.computeBoundingBox(); r = { size: g.boundingBox.getSize(new THREE.Vector3()), ctr: g.boundingBox.getCenter(new THREE.Vector3()) }; BBX.set(g, r); } return r; };
  // the ink hull: a piece blown up by `ink` world units around its own center (exact for boxes, close for round things)
  function hullMatrix(geo, m, ink) {
    const { size, ctr } = bbOf(geo), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(); m.decompose(p, q, s);
    const f = ['x', 'y', 'z'].map(k => { const L = Math.abs(size[k] * s[k]); return L > 1e-4 ? (L + 2 * ink) / L : 1; });
    return m.clone().multiply(new THREE.Matrix4().makeTranslation(ctr.x, ctr.y, ctr.z)).multiply(new THREE.Matrix4().makeScale(f[0], f[1], f[2])).multiply(new THREE.Matrix4().makeTranslation(-ctr.x, -ctr.y, -ctr.z));
  }
  function Kit() {
    const B = { solid: [], glow: [], decal: [], board: [] };
    let F = new THREE.Matrix4(), FR = 0, FW = 0;
    const autoInk = (geo, sx, sy, sz) => { const s = bbOf(geo).size; const d = [s.x * sx, s.y * sy, s.z * sz].filter(v => v > 1e-3); return clamp(Math.min(...d) * 0.1, 0.006, 0.024); };
    const k = {
      B,
      get rot() { return FR; }, get wall() { return FW; },
      frame(x, y, z, rot = 0, wall = 0) { F = new THREE.Matrix4().makeRotationY(rot).setPosition(x, y, z); FR = rot; FW = wall; return k; },
      world(x, y, z) { return new THREE.Vector3(x, y, z).applyMatrix4(F); },
      add(geo, x, y, z, sx, sy, sz, color, o = {}) {
        const m = F.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), _q.setFromEuler(_e.set(o.rx || 0, o.ry || 0, o.rz || 0, 'YXZ')), new THREE.Vector3(sx, sy, sz)));
        const b = o.b || 'solid';
        B[b].push({ geo, m, color, ink: b === 'solid' ? (o.ink === undefined ? autoInk(geo, sx, sy, sz) : o.ink) : 0, wall: (o.wall !== undefined ? o.wall : FW) + (o.ns ? 10 : 0), flick: o.flick || 0, c2: o.c2, cell: o.cell });
        return k;
      },
      box(x, y, z, w, h, d, color, o) { return k.add(GEO.box, x, y, z, w, h, d, color, o); },
      post(x, y, z, w, h, d, color, o) { return k.add(GEO.box, x, y + h / 2, z, w, h, d, color, o); },
      cyl(x, y, z, r, h, color, o = {}) { return k.add(o.geo || GEO.cyl, x, y + h / 2, z, r, h, o.rz2 || r, color, o); },
      ball(x, y, z, r, color, o = {}) { return k.add(o.geo || GEO.ball, x, y, z, r, o.ry2 || r, o.rz2 || r, color, o); },
      beam(x1, y1, z1, x2, y2, z2, t, color, o = {}) {
        const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1, L = Math.hypot(dx, dy, dz) || 1e-4;
        const m = F.clone().multiply(new THREE.Matrix4().compose(new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2),
          new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L)), new THREE.Vector3(t, L, o.t2 || t)));
        const b = o.b || 'solid';
        B[b].push({ geo: o.geo || GEO.box, m, color, ink: b === 'solid' ? (o.ink === undefined ? clamp(t * 0.1, 0.005, 0.02) : o.ink) : 0, wall: (o.wall !== undefined ? o.wall : FW) + (o.ns ? 10 : 0), flick: 0 });
        return k;
      },
      // flat things facing +z: a glowing pane, a picture from the atlas, the blackboard
      glow(x, y, z, w, h, color, o = {}) { return k.add(GEO.plane, x, y, z, w, h, 1, color, Object.assign({ b: 'glow' }, o)); },
      decal(x, y, z, w, h, cell, o = {}) { return k.add(GEO.plane, x, y, z, w, h, 1, '#ffffff', Object.assign({ b: 'decal', cell: cellUV(cell) }, o)); },
    };
    return k;
  }
  // bake a bucket: positions, normals, vertex colors (c2: a second color for the bottom of a piece), the fold, flicker, atlas uvs
  function bake(list, o = {}) {
    const L = o.hull ? list.filter(p => p.ink > 0) : list;
    let n = 0; for (const p of L) n += ni(p.geo).attributes.position.count;
    if (!n) return null;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = o.hull ? null : new Float32Array(n * 3), wall = new Float32Array(n);
    const flick = o.flick ? new Float32Array(n) : null, uv = o.uv ? new Float32Array(n * 2) : null, c2 = new THREE.Color();
    let at = 0;
    for (const p of L) {
      const g = ni(p.geo), PA = g.attributes.position, NA = g.attributes.normal, UA = g.attributes.uv, cnt = PA.count;
      const m = o.hull ? hullMatrix(p.geo, p.m, p.ink) : p.m, bb = p.c2 ? bbOf(p.geo) : null;
      _m3.getNormalMatrix(m); if (col) { _c.set(p.color); if (p.c2) c2.set(p.c2); }
      for (let i = 0; i < cnt; i++) {
        const j = at + i;
        _v.fromBufferAttribute(PA, i);
        if (col) {
          if (p.c2) { const t = clamp((_v.y - (bb.ctr.y - bb.size.y / 2)) / (bb.size.y || 1), 0, 1); col[j * 3] = lerp(c2.r, _c.r, t); col[j * 3 + 1] = lerp(c2.g, _c.g, t); col[j * 3 + 2] = lerp(c2.b, _c.b, t); }
          else { col[j * 3] = _c.r; col[j * 3 + 1] = _c.g; col[j * 3 + 2] = _c.b; }
        }
        _v.applyMatrix4(m); pos[j * 3] = _v.x; pos[j * 3 + 1] = _v.y; pos[j * 3 + 2] = _v.z;
        _v.fromBufferAttribute(NA, i).applyMatrix3(_m3).normalize(); nor[j * 3] = _v.x; nor[j * 3 + 1] = _v.y; nor[j * 3 + 2] = _v.z;
        wall[j] = p.wall;
        if (flick) flick[j] = p.flick;
        if (uv) { const c = p.cell || [0, 0, 1, 1]; uv[j * 2] = c[0] + UA.getX(i) * (c[2] - c[0]); uv[j * 2 + 1] = c[1] + UA.getY(i) * (c[3] - c[1]); }
      }
      at += cnt;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    if (col) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('aWall', new THREE.BufferAttribute(wall, 1));
    if (flick) geo.setAttribute('aFlick', new THREE.BufferAttribute(flick, 1));
    if (uv) geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeBoundingSphere();
    return geo;
  }
  // sun shafts: quads with a color per corner (additive), folded with their window's wall
  function shaftGeo(quads) {
    const n = quads.length * 6, pos = new Float32Array(n * 3), col = new Float32Array(n * 3), wall = new Float32Array(n);
    let j = 0;
    for (const q of quads) for (const i of [0, 1, 2, 0, 2, 3]) { const p = q.p[i], c = q.c[i]; pos.set([p.x, p.y, p.z], j * 3); col.set(c, j * 3); wall[j] = q.wall; j++; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); geo.setAttribute('aWall', new THREE.BufferAttribute(wall, 1));
    geo.computeBoundingSphere();
    return geo;
  }

  // ============================================================ the rig: people and moving things as bones of one skinned mesh
  const PG = (() => {
    const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 13);
    return {
      lathe: lathe([[0, 0], [0.38, 0.02], [0.37, 0.3], [0.28, 0.68], [0.2, 0.9], [0.1, 0.97], [0, 0.98]]),
      head: new THREE.SphereGeometry(1, 14, 10), ball: new THREE.SphereGeometry(1, 8, 6), cap: new THREE.SphereGeometry(1, 12, 5, 0, TAU, 0, Math.PI * 0.5),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 8), cone: new THREE.ConeGeometry(1, 1, 8), box: new THREE.BoxGeometry(1, 1, 1),
      eye: new THREE.SphereGeometry(1, 6, 4), ring: new THREE.TorusGeometry(1, 0.12, 5, 16), arc: new THREE.TorusGeometry(1, 0.32, 5, 10, Math.PI),
      disc: new THREE.CylinderGeometry(1, 1, 1, 20),
    };
  })();
  function Rig() {
    const bones = [], parts = [];
    const root = new THREE.Bone(); bones.push(root);
    // (wall: the wall this bone hangs on, 1–4, or its parent's)
    function bone(parent, pos, rot, order, wall) {
      const b = new THREE.Bone();
      if (pos) b.position.set(pos[0], pos[1], pos[2]);
      if (order) b.rotation.order = order;
      if (rot) b.rotation.set(rot[0], rot[1], rot[2]);
      b.userData.wall = wall !== undefined ? wall : (parent && parent.userData.wall) || 0;
      (parent || root).add(b); bones.push(b); return b;
    }
    function part(b, geo, color, pos, scale, rot, ink) {
      const m = new THREE.Matrix4().compose(new THREE.Vector3(...(pos || [0, 0, 0])), new THREE.Quaternion().setFromEuler(new THREE.Euler(...(rot || [0, 0, 0]))), new THREE.Vector3(...(scale || [1, 1, 1])));
      parts.push({ b, geo, color, m, ink: ink === undefined ? 0.02 : ink });
    }
    function bake() {
      root.updateMatrixWorld(true);
      const idx = new Map(bones.map((b, i) => [b, i]));
      const build = hull => {
        const L = hull ? parts.filter(p => p.ink > 0) : parts;
        let n = 0; for (const p of L) n += ni(p.geo).attributes.position.count;
        const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), wl = new Float32Array(n);
        let at = 0;
        for (const p of L) {
          const g = ni(p.geo), PA = g.attributes.position, NA = g.attributes.normal, cnt = PA.count, bi = idx.get(p.b);
          wl.fill(p.b.userData.wall || 0, at, at + cnt);          // (the wall a bone hangs on: its parts fold away with it)
          const local = hull ? hullMatrix(p.geo, p.m, p.ink) : p.m, m = p.b.matrixWorld.clone().multiply(local);
          _m3.getNormalMatrix(m); _c.set(p.color || '#ffffff');
          for (let i = 0; i < cnt; i++) {
            const j = at + i;
            _v.fromBufferAttribute(PA, i).applyMatrix4(m); pos[j * 3] = _v.x; pos[j * 3 + 1] = _v.y; pos[j * 3 + 2] = _v.z;
            _v.fromBufferAttribute(NA, i).applyMatrix3(_m3).normalize(); nor[j * 3] = _v.x; nor[j * 3 + 1] = _v.y; nor[j * 3 + 2] = _v.z;
            col[j * 3] = _c.r; col[j * 3 + 1] = _c.g; col[j * 3 + 2] = _c.b;
            si[j * 4] = bi; sw[j * 4] = 1;
          }
          at += cnt;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
        if (!hull) geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
        geo.setAttribute('aWall', new THREE.BufferAttribute(wl, 1));
        geo.computeBoundingSphere();
        return geo;
      };
      const skel = new THREE.Skeleton(bones);            // the bones' inverses, from this rest pose (the rig still sits at the origin)
      const mesh = new THREE.SkinnedMesh(build(false), mats().rig), ink = new THREE.SkinnedMesh(build(true), mats().rigInk);
      mesh.add(root); mesh.bind(skel); ink.bind(skel, mesh.bindMatrix);
      mesh.castShadow = true; mesh.frustumCulled = ink.frustumCulled = false;
      return { mesh, ink, skel };
    }
    return { root, bone, part, bake, get count() { return parts.length; } };
  }
  // ------------------------------------------------------------ a person, the way town.js draws its townsfolk. d: { skin, hair, hairdo
  // (bun | pony | long | pigtails | curly | bald), dress, apron, legs, pants, shoes, hat (straw | cap | beret | scarf | chef | flat), hatColor,
  // beard, stache, glasses, h, w, eyes ('happy') }; at: { x, y, z, yaw, sit }; o.prop: book | pin | cloth | spoon | chalk | pack
  function makePerson(rig, d, at, parent, o = {}) {
    const { bone, part } = rig, w = d.w || 1, sit = at.sit || 0;
    const C = { skin: d.skin, hair: d.hair, dress: d.dress, apron: d.apron, pants: d.pants || '#3a4466', shoes: d.shoes || '#5b3a22', hat: d.hatColor || '#e8c57a' };
    const root = bone(parent, [at.x, at.y || 0, at.z], [0, at.yaw || 0, 0]); root.scale.setScalar(d.h || 1);
    const body = bone(root);
    const P = { root, body, legs: null, arms: [], head: null, eyes: null, mouth: null, sit, h: d.h || 1 };
    if (d.legs) {
      part(body, PG.lathe, C.dress, [0, 0.36, 0], [w, 0.64, w]);
      P.legs = [-1, 1].map(s => { const hip = bone(body, [s * 0.12 * w, 0.4, 0]); part(hip, PG.cyl, C.pants, [0, -0.18, 0], [0.085, 0.36, 0.085]); part(hip, PG.ball, C.shoes, [0, -0.36, 0.05], [0.1, 0.075, 0.15]); return hip; });
    } else {
      part(body, PG.lathe, C.dress, null, [w, 1, w]);
      for (const s of [-1, 1]) part(body, PG.ball, C.shoes, sit === 1 ? [s * 0.13, -0.56, 0.36] : [s * 0.13 * w, 0.04, 0.12], [0.1, 0.07, 0.14]);
    }
    if (d.apron) part(body, PG.ball, C.apron, [0, 0.42, 0.26 * w], [0.24 * w, 0.3, 0.08]);
    P.arms = [-1, 1].map(s => {
      const sh = bone(body, [s * 0.25 * w, 0.84, 0.05], [-0.5, 0, -s * 0.2]);
      part(sh, PG.cyl, C.dress, [0, -0.14, 0], [0.07, 0.28, 0.07]);
      const hand = bone(sh, [0, -0.3, 0]); part(hand, PG.ball, C.skin, null, [0.07, 0.07, 0.07]); sh.userData.hand = hand;
      return sh;
    });
    const head = P.head = bone(body, [0, 0.98, 0]);
    part(head, PG.head, C.skin, [0, 0.2, 0], [0.28, 0.27, 0.27]);
    if (d.hairdo !== 'bald') part(head, PG.cap, C.hair, [0, 0.22, -0.02], [0.29, 0.29, 0.29], [-0.5, 0, 0]);
    else part(head, PG.cap, C.hair, [0, 0.14, -0.06], [0.285, 0.2, 0.26], [-1.1, 0, 0]);
    if (d.hairdo === 'bun') part(head, PG.ball, C.hair, [0, 0.42, -0.2], [0.12, 0.12, 0.12]);
    if (d.hairdo === 'pony') { part(head, PG.ball, C.hair, [0, 0.3, -0.27], [0.08, 0.08, 0.08]); part(head, PG.ball, C.hair, [0, 0.14, -0.33], [0.08, 0.17, 0.08], [0.3, 0, 0]); }
    if (d.hairdo === 'long') part(head, PG.ball, C.hair, [0, 0.1, -0.1], [0.28, 0.3, 0.2]);
    if (d.hairdo === 'pigtails') for (const s of [-1, 1]) part(head, PG.ball, C.hair, [s * 0.27, 0.12, -0.08], [0.09, 0.14, 0.09]);
    if (d.hairdo === 'curly') for (let i = 0; i < 6; i++) { const a = -1.3 + i * 0.52; part(head, PG.ball, C.hair, [Math.sin(a) * 0.27, 0.28 + Math.cos(i) * 0.04, Math.cos(a) * -0.12], [0.11, 0.11, 0.11]); }
    const eyes = P.eyes = bone(head, [0, 0.21, 0.24]);
    for (const s of [-1, 1]) {
      if (d.eyes === 'happy') part(eyes, PG.arc, INK, [s * 0.1, -0.01, 0.015], [0.035, 0.035, 0.035], null, 0);
      else { part(eyes, PG.eye, INK, [s * 0.1, 0, 0], [0.04, 0.06, 0.025], null, 0); part(eyes, PG.eye, '#ffffff', [s * 0.1 + 0.013, 0.023, 0.022], [0.017, 0.017, 0.017], null, 0); }
      part(head, PG.eye, mix(C.skin, '#ff8c9a', 0.55), [s * 0.17, 0.09, 0.23], [0.05, 0.0275, 0.015], [0, s * 0.4, 0], 0);
    }
    const mouth = P.mouth = bone(head, [0, 0.07, 0.27]); part(mouth, PG.eye, INK, null, [0.035, 0.012, 0.01], null, 0);
    if (d.stache) for (const s of [-1, 1]) part(head, PG.ball, C.hair, [s * 0.05, 0.11, 0.255], [0.06, 0.025, 0.03], [0, 0, -s * 0.35]);
    if (d.beard) part(head, PG.ball, C.hair, [0, 0.03, 0.12], [0.21, 0.17, 0.16]);
    if (d.glasses) for (const s of [-1, 1]) part(head, PG.ring, INK, [s * 0.1, 0.19, 0.265], [0.068, 0.068, 0.068], null, 0);
    const hat = bone(head, [0, 0.4, 0]);
    if (d.hat === 'straw') { part(hat, PG.cyl, C.hat, null, [0.5, 0.035, 0.5]); part(hat, PG.cap, C.hat, [0, 0.01, 0], [0.22, 0.2, 0.22]); part(hat, PG.cyl, '#e05a4b', [0, 0.05, 0], [0.225, 0.05, 0.225]); }
    else if (d.hat === 'cap') { part(hat, PG.cap, C.hat, [0, -0.08, 0], [0.3, 0.22, 0.3]); part(hat, PG.cyl, C.hat, [0, -0.08, 0.26], [0.16, 0.02, 0.12]); }
    else if (d.hat === 'beret') part(hat, PG.ball, C.hat, [0.04, -0.07, -0.02], [0.3, 0.09, 0.3], [0, 0, 0.2]);
    else if (d.hat === 'scarf') { part(hat, PG.cap, C.hat, [0, -0.2, -0.01], [0.31, 0.32, 0.31], [-0.25, 0, 0]); part(hat, PG.ball, C.hat, [0, -0.32, -0.27], [0.08, 0.08, 0.08]); }
    else if (d.hat === 'chef') { part(hat, PG.cyl, '#ffffff', [0, 0.02, 0], [0.22, 0.14, 0.22]); part(hat, PG.ball, '#ffffff', [0, 0.16, 0], [0.27, 0.16, 0.27]); }
    else if (d.hat === 'flat') { part(hat, PG.cap, C.hat, [0, -0.1, 0.02], [0.31, 0.14, 0.33]); part(hat, PG.cyl, C.hat, [0, -0.1, 0.27], [0.15, 0.02, 0.1]); }
    else if (d.hat === 'captain') { part(hat, PG.cyl, C.hat, [0, -0.02, 0], [0.27, 0.12, 0.27]); part(hat, PG.cyl, INK, [0, -0.08, 0.2], [0.16, 0.02, 0.12]); part(hat, PG.cyl, '#e6b84a', [0, 0.0, 0.23], [0.06, 0.04, 0.02], [Math.PI / 2, 0, 0], 0); }
    else if (d.hat === 'bandana') { part(hat, PG.cap, C.hat, [0, -0.13, -0.01], [0.3, 0.2, 0.3], [-0.35, 0, 0]); part(hat, PG.ball, C.hat, [0, -0.2, -0.29], [0.07, 0.05, 0.05]); }
    else if (d.hat === 'beanie') { part(hat, PG.cap, C.hat, [0, -0.1, -0.01], [0.3, 0.26, 0.3], [-0.2, 0, 0]); part(hat, PG.ball, '#fdf8ee', [0, 0.14, -0.06], [0.07, 0.07, 0.07]); }
    else if (d.hat === 'flower') part(hat, PG.ball, C.hat, [0.2, -0.1, 0.1], [0.07, 0.07, 0.05], null, 0.006);
    if (d.loupe) part(hat, PG.cyl, '#c99a3e', [0.12, -0.12, 0.2], [0.07, 0.06, 0.07], [Math.PI / 2, 0, 0]);
    if (d.scarf) part(body, PG.cyl, d.scarf, [0, 0.9, 0], [0.24 * w, 0.08, 0.22], null, 0.008);
    // things held
    const hR = P.arms[0].userData.hand, hL = P.arms[1].userData.hand;
    if (o.prop === 'book') part(body, PG.box, o.propColor || '#d9483b', [0, 0.58, 0.36], [0.28, 0.2, 0.05], [-0.7, 0, 0], 0.012);
    if (o.prop === 'cloth') part(hR, PG.box, '#fdf8ee', [0, -0.06, 0.04], [0.16, 0.04, 0.12], null, 0.008);
    if (o.prop === 'spoon') { part(hR, PG.cyl, '#a8784e', [0, -0.12, 0.08], [0.018, 0.34, 0.018], [0.8, 0, 0], 0.006); }
    if (o.prop === 'chalk') part(hR, PG.cyl, '#7a5236', [0, -0.3, 0.02], [0.018, 0.62, 0.018], null, 0.006);
    if (o.prop === 'pin') part(body, PG.cyl, '#d8b080', [0, 0.62, 0.42], [0.04, 0.5, 0.04], [0, 0, Math.PI / 2], 0.008);
    if (o.prop === 'pack') part(body, PG.box, '#7a5a3a', [0, 0.6, -0.27], [0.34, 0.4, 0.2], null, 0.012);
    if (o.prop === 'tool') part(hR, PG.box, '#9aa0ad', [0, -0.08, 0.06], [0.04, 0.16, 0.04], null, 0.006);
    // (the themed homes' props)
    if (o.prop === 'brush') { part(hR, PG.cyl, '#c8925a', [0, -0.12, 0.06], [0.014, 0.28, 0.014], [0.6, 0, 0], 0.004); part(hR, PG.ball, o.propColor || '#d9483b', [0, -0.25, 0.14], [0.025, 0.04, 0.025], [0.6, 0, 0], 0.003); }
    if (o.prop === 'guitar') { part(body, PG.ball, o.propColor || '#e0743c', [0.05, 0.5, 0.3], [0.2, 0.24, 0.07], [0, 0, 0.9], 0.01); part(body, PG.box, '#5e4130', [-0.2, 0.68, 0.32], [0.05, 0.44, 0.03], [0, 0, 0.9], 0.006); part(body, PG.ball, INK, [0.03, 0.52, 0.36], [0.06, 0.06, 0.01], null, 0); }
    if (o.prop === 'violin') { part(body, PG.ball, '#a8592f', [0.16, 0.86, 0.18], [0.11, 0.16, 0.05], [0.5, 0, -0.9], 0.008); part(hR, PG.cyl, '#d8b080', [0, -0.1, 0.1], [0.01, 0.5, 0.01], [0, 0, 1.2], 0.003); }
    if (o.prop === 'knit') { part(body, PG.ball, o.propColor || '#e86a7a', [0, 0.52, 0.3], [0.1, 0.1, 0.1], null, 0.006); for (const s of [-1, 1]) part(body, PG.cyl, '#c8925a', [s * 0.06, 0.6, 0.32], [0.008, 0.26, 0.008], [0.4, 0, s * 0.6], 0.003); part(body, PG.box, o.propColor || '#e86a7a', [0, 0.46, 0.33], [0.16, 0.1, 0.02], null, 0.004); }
    if (o.prop === 'can') { part(hR, PG.cyl, o.propColor || '#4f8a7a', [0, -0.12, 0.08], [0.07, 0.12, 0.07], null, 0.006); part(hR, PG.cyl, o.propColor || '#4f8a7a', [0, -0.08, 0.2], [0.012, 0.16, 0.012], [1.1, 0, 0], 0.004); }
    if (o.prop === 'baby') { part(body, PG.ball, '#bfe0f4', [0, 0.66, 0.26], [0.17, 0.12, 0.12], [0, 0, 0.3], 0.008); part(body, PG.ball, '#f5cda2', [0.13, 0.72, 0.27], [0.07, 0.07, 0.07], null, 0.006); }
    if (o.prop === 'rod') part(hR, PG.cyl, '#8a5f3e', [0, -0.05, 0.4], [0.012, 0.9, 0.012], [1.25, 0, 0], 0.004);
    if (o.prop === 'letter') part(hR, PG.box, '#fdf8ee', [0, -0.08, 0.06], [0.16, 0.11, 0.01], [0.3, 0, 0], 0.004);
    if (o.prop === 'cup') { part(hR, PG.cyl, o.propColor || '#5aa0d8', [0, -0.06, 0.07], [0.05, 0.08, 0.05], null, 0.005); }
    if (o.prop === 'camera') { part(body, PG.box, '#3a3436', [0, 0.82, 0.27], [0.18, 0.12, 0.1], null, 0.006); part(body, PG.cyl, '#5a5258', [0, 0.82, 0.34], [0.045, 0.06, 0.045], [Math.PI / 2, 0, 0], 0.004); }
    if (o.prop === 'broom') { part(hR, PG.cyl, '#c8925a', [0, -0.1, 0.05], [0.015, 1.1, 0.015], [0.2, 0, 0], 0.004); part(hR, PG.cone, '#e6c65a', [0, -0.68, 0.0], [0.1, 0.22, 0.05], [0.2, 0, 0], 0.006); }
    if (o.prop === 'paper') part(body, PG.box, '#f4f0e6', [0, 0.6, 0.34], [0.3, 0.22, 0.01], [-0.7, 0, 0], 0.004);
    void hL;
    return P;
  }
  // a cat: asleep (curled up) or sitting up; P.head turns, P.tail sways, P.body breathes
  function makeCat(rig, color, at, pose) {
    const { bone, part } = rig, belly = mix(color, '#ffffff', 0.55);
    const root = bone(null, [at.x, at.y || 0, at.z], [0, at.yaw || 0, 0]);
    const body = bone(root), P = { root, body, head: null, tail: null, eyes: null, pose, cat: true };
    if (pose === 'sleep') {
      part(body, PG.ball, color, [0, 0.12, 0], [0.24, 0.13, 0.27]);
      const head = P.head = bone(body, [0.06, 0.13, 0.21], [0.2, 0.35, 0]);
      part(head, PG.ball, color, null, [0.13, 0.11, 0.12]);
      for (const s of [-1, 1]) { part(head, PG.cone, color, [s * 0.07, 0.1, -0.01], [0.045, 0.08, 0.035], [0, 0, -s * 0.25]); part(head, PG.box, INK, [s * 0.05, 0.02, 0.112], [0.045, 0.008, 0.01], null, 0); }
      part(head, PG.eye, '#f2a0a8', [0, -0.01, 0.12], [0.015, 0.012, 0.01], null, 0);
      for (const s of [-1, 1]) part(body, PG.ball, belly, [s * 0.08, 0.04, 0.26], [0.05, 0.04, 0.06]);
      const tail = P.tail = bone(body, [-0.16, 0.06, -0.14]);
      part(tail, PG.cyl, color, [0.06, 0, 0.17], [0.042, 0.36, 0.042], [Math.PI / 2, 0, 0.9]);
    } else {
      part(body, PG.ball, color, [0, 0.2, -0.03], [0.16, 0.2, 0.16]); part(body, PG.ball, belly, [0, 0.21, 0.07], [0.1, 0.14, 0.08]);
      for (const s of [-1, 1]) part(body, PG.ball, belly, [s * 0.06, 0.03, 0.1], [0.045, 0.035, 0.06]);
      const head = P.head = bone(body, [0, 0.43, 0.05]);
      part(head, PG.ball, color, null, [0.13, 0.12, 0.12]);
      for (const s of [-1, 1]) part(head, PG.cone, color, [s * 0.075, 0.11, -0.01], [0.045, 0.08, 0.035], [0, 0, -s * 0.25]);
      const eyes = P.eyes = bone(head, [0, 0.02, 0.1]);
      for (const s of [-1, 1]) { part(eyes, PG.eye, INK, [s * 0.048, 0, 0], [0.022, 0.032, 0.012], null, 0); part(eyes, PG.eye, '#ffffff', [s * 0.048 + 0.007, 0.012, 0.01], [0.008, 0.008, 0.008], null, 0); }
      part(head, PG.eye, '#f2a0a8', [0, -0.03, 0.115], [0.015, 0.012, 0.01], null, 0);
      for (const s of [-1, 1]) part(head, PG.box, INK, [s * 0.1, -0.035, 0.1], [0.12, 0.006, 0.006], [0, 0, s * 0.15], 0);
      const tail = P.tail = bone(body, [0, 0.05, -0.17]);
      part(tail, PG.cyl, color, [0.1, 0.06, -0.05], [0.04, 0.3, 0.04], [0.3, 0, -1.1]);
    }
    return P;
  }
  // a dog: sitting up or lying down; P.tail wags, P.head turns, the ears flop (pets in the themed homes)
  function makeDog(rig, color, at, pose, o = {}) {
    const { bone, part } = rig, belly = mix(color, '#ffffff', 0.45), ear = o.ear || shade(color, 0.7), s = o.s || 1;
    const root = bone(null, [at.x, at.y || 0, at.z], [0, at.yaw || 0, 0]); root.scale.setScalar(s);
    const body = bone(root), P = { root, body, head: null, tail: null, eyes: null, pose, dog: true };
    const lie = pose === 'lie';
    part(body, PG.ball, color, lie ? [0, 0.17, -0.02] : [0, 0.28, -0.06], lie ? [0.2, 0.15, 0.34] : [0.19, 0.25, 0.22], lie ? null : [-0.5, 0, 0]);
    part(body, PG.ball, belly, lie ? [0, 0.14, 0.12] : [0, 0.3, 0.07], lie ? [0.14, 0.1, 0.2] : [0.12, 0.17, 0.1]);
    for (const sx of [-1, 1]) {
      part(body, PG.ball, belly, lie ? [sx * 0.1, 0.05, 0.36] : [sx * 0.08, 0.04, 0.13], [0.06, 0.05, 0.09]);
      if (!lie) part(body, PG.cyl, color, [sx * 0.08, 0.13, 0.11], [0.045, 0.22, 0.045]);
      part(body, PG.ball, color, lie ? [sx * 0.16, 0.08, -0.22] : [sx * 0.14, 0.1, -0.12], [0.08, 0.08, 0.12]);
    }
    const head = P.head = bone(body, lie ? [0, 0.27, 0.3] : [0, 0.56, 0.06]);
    part(head, PG.ball, color, null, [0.15, 0.14, 0.14]); part(head, PG.ball, belly, [0, -0.04, 0.12], [0.08, 0.065, 0.09]); part(head, PG.ball, INK, [0, -0.01, 0.2], [0.035, 0.028, 0.025], null, 0);
    for (const sx of [-1, 1]) { const e = bone(head, [sx * 0.12, 0.06, -0.02], [0, 0, sx * 0.25]); part(e, PG.ball, ear, [0, -0.08, 0], [0.05, 0.11, 0.035], null, 0.006); P['ear' + sx] = e; }
    const eyes = P.eyes = bone(head, [0, 0.05, 0.12]);
    for (const sx of [-1, 1]) { part(eyes, PG.eye, INK, [sx * 0.06, 0, 0], [0.022, 0.03, 0.012], null, 0); part(eyes, PG.eye, '#ffffff', [sx * 0.06 + 0.007, 0.011, 0.01], [0.008, 0.008, 0.008], null, 0); }
    if (o.collar) part(head, PG.cyl, o.collar, [0, -0.12, -0.02], [0.12, 0.035, 0.12], null, 0.005);
    if (o.coat) part(body, PG.ball, o.coat, lie ? [0, 0.22, -0.02] : [0, 0.34, -0.08], lie ? [0.205, 0.12, 0.26] : [0.195, 0.16, 0.2], lie ? null : [-0.5, 0, 0], 0.006);
    const tail = P.tail = bone(body, lie ? [0, 0.2, -0.34] : [0, 0.14, -0.24]);
    part(tail, PG.cyl, color, [0, 0.08, -0.04], [0.035, 0.2, 0.035], [-0.6, 0, 0]);
    return P;
  }
  // a parrot on its perch (or a canary in a cage, o.small): P.body bobs, P.head turns
  function makeBird(rig, at, o = {}) {
    const { bone, part } = rig, c1 = o.color || '#3fae5a', c2 = o.wing || '#2f7fc9', s = o.small ? 0.45 : 1;
    const root = bone(null, [at.x, at.y || 0, at.z], [0, at.yaw || 0, 0]); root.scale.setScalar(s);
    const body = bone(root), P = { root, body, head: null, tail: null, eyes: null, bird: true };
    part(body, PG.ball, c1, [0, 0.16, 0], [0.1, 0.15, 0.09], [0.25, 0, 0]);
    for (const sx of [-1, 1]) part(body, PG.ball, c2, [sx * 0.08, 0.15, -0.02], [0.03, 0.11, 0.07], [0.25, 0, 0], 0.005);
    part(body, PG.box, c2, [0, 0.04, -0.12], [0.06, 0.16, 0.02], [0.6, 0, 0], 0.005);
    const head = P.head = bone(body, [0, 0.33, 0.02]);
    part(head, PG.ball, o.face || c1, null, [0.075, 0.075, 0.075]);
    part(head, PG.cone, o.beak || '#f2c14e', [0, -0.01, 0.08], [0.025, 0.06, 0.025], [Math.PI / 2 + 0.4, 0, 0], 0.004);
    const eyes = P.eyes = bone(head, [0, 0.015, 0.05]);
    for (const sx of [-1, 1]) part(eyes, PG.eye, INK, [sx * 0.045, 0, 0], [0.014, 0.016, 0.01], null, 0);
    return P;
  }
  // a turtle in its basin: the head pokes out now and then
  function makeTurtle(rig, at) {
    const { bone, part } = rig, root = bone(null, [at.x, at.y || 0, at.z], [0, at.yaw || 0, 0]), body = bone(root), P = { root, body, head: null, tail: null, eyes: null, turtle: true };
    part(body, PG.cap, '#5f8a3a', [0, 0.04, 0], [0.18, 0.12, 0.22]); part(body, PG.cap, '#7fa84a', [0, 0.06, 0], [0.12, 0.1, 0.15], null, 0);
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) part(body, PG.ball, '#a8c27a', [x * 0.13, 0.03, z * 0.13], [0.04, 0.025, 0.05]);
    const head = P.head = bone(body, [0, 0.06, 0.2]); part(head, PG.ball, '#a8c27a', [0, 0, 0.04], [0.05, 0.045, 0.06]);
    const eyes = P.eyes = bone(head, [0, 0.02, 0.07]); for (const sx of [-1, 1]) part(eyes, PG.eye, INK, [sx * 0.025, 0, 0], [0.01, 0.012, 0.008], null, 0);
    return P;
  }

  // ============================================================ the furniture (drawn in the kit's frame: front = +z, floor at y = 0). Each
  // returns its footprint for the solid ({ hw, hd } or { r }, or solid: false), and what Look says (look: a word id) and where the tag sits
  const W8 = { cream: '#fdf8ee', white: '#ffffff', brass: '#e6b84a', iron: '#3a3436', steel: '#9aa0ad', bread: '#d99a4e', crust: '#b8743a' };
  function cupOn(k, x, y, z, color) {
    k.cyl(x, y, z, 0.075, 0.012, W8.cream, { geo: GEO.cyl16, ink: 0.004 });
    k.cyl(x, y + 0.012, z, 0.048, 0.06, color, { geo: GEO.bowl, ink: 0.004 });
    k.add(GEO.thin, x + 0.055, y + 0.045, z, 0.022, 0.022, 0.022, color, { ink: 0 });
  }
  function plateOn(k, x, y, z, rim = '#3f6fb5', r = 0.13) {
    k.cyl(x, y, z, r, 0.016, W8.cream, { geo: GEO.cyl16, ink: 0.004 });
    k.add(GEO.thin, x, y + 0.018, z, r * 0.78, r * 0.78, r * 0.78, rim, { rx: Math.PI / 2, ink: 0 });
  }
  function loafAt(k, x, y, z, s, ry = 0) {
    k.add(GEO.ball, x, y + s * 0.42, z, s * 0.62, s * 0.48, s, W8.bread, { ry, ink: 0.007 });
    for (let i = -1; i <= 1; i++) k.box(x + Math.sin(ry) * i * s * 0.45, y + s * 0.86, z + Math.cos(ry) * i * s * 0.45, s * 0.5, s * 0.04, s * 0.08, '#f2d29a', { ry: ry + 0.6, ink: 0 });
  }
  function vaseAt(k, x, y, z, color, R) {
    k.cyl(x, y, z, 0.07, 0.2, color, { geo: GEO.taper, ink: 0.005 });
    for (let i = 0; i < 5; i++) { const a = i * 1.26 + R() * 0.5, rr = 0.06 + R() * 0.04; k.beam(x, y + 0.18, z, x + Math.cos(a) * rr, y + 0.38 + R() * 0.08, z + Math.sin(a) * rr, 0.012, '#4f9a45', { ink: 0 }); k.ball(x + Math.cos(a) * rr, y + 0.4 + R() * 0.08, z + Math.sin(a) * rr, 0.045, pick(['#ff8fb1', '#ffd84a', '#ff6b5a', '#ffffff', '#b9a2ff'], R), { geo: GEO.ico0, ink: 0.004 }); }
  }
  function candleAt(k, x, y, z, color = W8.cream) {
    k.cyl(x, y, z, 0.035, 0.03, W8.brass, { geo: GEO.cyl8, ink: 0.004 }).cyl(x, y + 0.03, z, 0.022, 0.13, color, { geo: GEO.cyl6, ink: 0.003 });
    k.add(GEO.cone6, x, y + 0.2, z, 0.022, 0.06, 0.022, '#ffcf5a', { b: 'glow', flick: 0.12 });
  }
  function jarAt(k, x, y, z, R, s = 1) {
    const h = (0.14 + R() * 0.1) * s, r = (0.055 + R() * 0.03) * s;
    k.cyl(x, y, z, r, h, pick(['#9fd3c7', '#f2c14e', '#e86a7a', '#c9e0a8', '#d9b48a', '#b9a2ff'], R), { geo: GEO.cyl8, ink: 0.004 });
    k.cyl(x, y + h, z, r * 1.08, 0.035, pick(['#d9483b', '#3f6fb5', '#fdf8ee', '#c99a3e'], R), { geo: GEO.cyl8, ink: 0.003 });
  }
  function booksRow(k, x0, x1, y, z, R, depth = 0.18) {   // books standing on a shelf, from x0 to x1, now and then one leaning
    let x = x0;
    while (x < x1 - 0.05) {
      const t = 0.04 + R() * 0.04, h = 0.17 + R() * 0.12, lean = R() < 0.12 && x + 0.18 < x1;
      const col = pick(['#d9483b', '#3f6fb5', '#4f9a5a', '#f2c14e', '#7a5ab0', '#e0743c', '#2f8f86', '#8a5f3e'], R);
      if (lean) { k.box(x + 0.07, y + h / 2 * 0.95, z, t, h, depth, col, { rz: -0.45, ink: 0.004 }); x += 0.16; }
      else { k.post(x + t / 2, y, z, t, h, depth, col, { ink: 0.004 }); x += t + 0.006; }
    }
  }
  function plantAt(k, x, y, z, s, R, o = {}) {
    const pot = o.pot || pick(['#c46a3a', '#b85a3a', '#3f6fb5', '#e8e2d6', '#4f8a7a'], R);
    k.cyl(x, y, z, 0.17 * s, 0.26 * s, pot, { geo: GEO.bowl });
    k.cyl(x, y + 0.24 * s, z, 0.15 * s, 0.03 * s, '#5b3a22', { ink: 0 });
    if (o.tall) {
      k.cyl(x, y + 0.25 * s, z, 0.03 * s, 0.9 * s, '#7a5236', { geo: GEO.cyl6, ink: 0.004 });
      for (let i = 0; i < 6; i++) { const a = i * 1.05 + R(), r = 0.18 * s; k.add(GEO.ico1, x + Math.cos(a) * r, y + (0.95 + (i % 3) * 0.22) * s, z + Math.sin(a) * r, 0.24 * s, 0.2 * s, 0.24 * s, pick(['#4f9a45', '#5fae4f', '#3f8a3f'], R)); }
    } else {
      for (let i = 0; i < 5; i++) { const a = i * 1.26 + R() * 0.4, r = 0.1 * s; k.add(GEO.ico1, x + Math.cos(a) * r, y + (0.36 + R() * 0.12) * s, z + Math.sin(a) * r, 0.14 * s, 0.12 * s, 0.14 * s, pick(['#4f9a45', '#5fae4f', '#6ab653'], R)); }
      if (o.flowers || R() < 0.5) { const fc = pick(['#ff8fb1', '#ffd84a', '#ff6b5a', '#ffffff', '#b9a2ff'], R); for (let i = 0; i < 4; i++) { const a = i * 1.6 + R(); k.ball(x + Math.cos(a) * 0.12 * s, y + 0.5 * s, z + Math.sin(a) * 0.12 * s, 0.045 * s, fc, { geo: GEO.ico0, ink: 0.004 }); } }
    }
  }
  // --- beds, tables, chairs
  function bed(k, o) {
    const w = o.w || 1.0, L = o.L || 2.1, wood = o.wood || '#a8703f', H = 0.42, quilt = o.quilt || '#e86a7a', sheet = o.sheet || W8.cream;
    k.post(0, 0, -L / 2 + 0.07, w + 0.14, o.head || 1.05, 0.14, wood);
    k.add(GEO.halfDisc, 0, o.head || 1.05, -L / 2 + 0.07, w / 2 + 0.07, 0.14, w / 2 + 0.07, wood, { rx: Math.PI / 2 });
    k.post(0, 0, L / 2 - 0.06, w + 0.14, 0.7, 0.12, wood);
    for (const s of [-1, 1]) k.post(s * (w / 2 + 0.02), 0, 0, 0.08, 0.36, L - 0.2, shade(wood, 0.85), { ink: 0.006 });
    k.box(0, H, 0, w, 0.24, L - 0.2, sheet);
    k.box(0, H + 0.14, 0.2, w + 0.06, 0.08, L - 0.62, quilt);
    for (const s of [-1, 1]) k.box(s * (w / 2 + 0.04), H - 0.03, 0.2, 0.04, 0.32, L - 0.62, quilt, { ink: 0.006 });
    k.box(0, H + 0.17, -L / 2 + 0.66, w + 0.08, 0.1, 0.22, sheet);
    if (o.patch) for (let i = 0; i < 6; i++) k.box((i % 2 - 0.5) * w * 0.45, H + 0.185, -0.35 + Math.floor(i / 2) * 0.45, w * 0.36, 0.01, 0.34, i % 3 ? o.patch : shade(quilt, 1.15), { ink: 0 });
    const n = w > 1.3 ? 2 : 1;
    for (let i = 0; i < n; i++) k.ball((n > 1 ? (i - 0.5) * w * 0.5 : 0), H + 0.24, -L / 2 + 0.36, w * (n > 1 ? 0.22 : 0.34), W8.white, { ry2: 0.09, rz2: 0.17, ink: 0.008 });
    if (o.toys) { k.box(-w / 2 + 0.15, 0.06, L / 2 - 0.5, 0.14, 0.12, 0.14, '#d9483b', { ry: 0.4, ink: 0.005 }); k.ball(w / 2 - 0.1, 0.08, L / 2 - 0.35, 0.08, '#3f6fb5', { ink: 0.005 }); }
    return { hw: w / 2 + 0.1, hd: L / 2, h: 0.8, look: 'w.bed', lookY: 1.05, feat: 'bed' };
  }
  function table(k, o, room) {
    const w = o.w || 1.8, d = o.d || 1.0, h = o.h || 0.78, wood = o.wood || '#c8925a', R = room.R;
    if (o.round) {
      k.cyl(0, h - 0.07, 0, w / 2, 0.07, wood, { geo: GEO.cyl24 }).cyl(0, 0, 0, 0.07, h - 0.07, shade(wood, 0.8), { geo: GEO.cyl8 }).cyl(0, 0, 0, w * 0.22, 0.05, shade(wood, 0.8), { geo: GEO.cyl16 });
      if (o.cloth) k.cyl(0, h - 0.01, 0, w / 2 - 0.05, 0.012, o.cloth, { geo: GEO.cyl24, ink: 0 });
    } else {
      k.box(0, h - 0.04, 0, w, 0.08, d, wood);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (w / 2 - 0.1), 0, sz * (d / 2 - 0.1), 0.09, h - 0.08, 0.09, shade(wood, 0.82), { ink: 0.006 });
      if (o.cloth) { k.box(0, h + 0.006, 0, w * 0.36, 0.012, d + 0.12, o.cloth, { ink: 0 }); for (const s of [-1, 1]) k.box(0, h - 0.1, s * (d / 2 + 0.065), w * 0.36, 0.22, 0.012, o.cloth, { ink: 0 }); }
    }
    const top = h;
    if (o.items !== false) {
      if (o.flour) {
        for (let i = 0; i < 3; i++) k.box(-w * 0.25 + i * w * 0.24, top + 0.005, (i % 2 - 0.5) * d * 0.3, 0.42, 0.01, 0.3, '#fbf8f0', { ry: i, ink: 0 });
        for (let i = 0; i < 4; i++) k.add(GEO.ball, -w * 0.3 + i * w * 0.2, top + 0.06, (i % 2 ? 0.15 : -0.12) * d, 0.13, 0.08, 0.12, '#f3e1c0', { ink: 0.006 });
        k.cyl(w * 0.32, top + 0.05, 0, 0.04, 0.42, '#d8b080', { rz: Math.PI / 2, geo: GEO.cyl8, ink: 0.005 });
        k.cyl(-w * 0.36, top, -d * 0.2, 0.17, 0.12, '#e8e2d6', { geo: GEO.bowl, ink: 0.006 });
      } else {
        const seats = o.round ? 3 : 4;
        for (let i = 0; i < seats; i++) {
          let px, pz;
          if (o.round) { const a = i / seats * TAU + 0.4; px = Math.cos(a) * w * 0.3; pz = Math.sin(a) * w * 0.3; }
          else { px = (i % 2 - 0.5) * w * 0.5; pz = (i < 2 ? -1 : 1) * d * 0.27; }
          plateOn(k, px, top, pz, room.P.rim);
          if (R() < 0.5) cupOn(k, px + 0.2, top, pz, pick(room.P.fab, R));
        }
        if (o.round) candleAt(k, 0, top, 0); else { vaseAt(k, 0, top, 0, pick(room.P.fab, R), R); if (R() < 0.6) { k.cyl(w * 0.3, top, 0, 0.14, 0.08, '#c9955a', { geo: GEO.bowl, ink: 0.005 }); for (let i = 0; i < 3; i++) k.ball(w * 0.3 + (i - 1) * 0.06, top + 0.11, (i % 2) * 0.04, 0.05, i % 2 ? '#e2453a' : '#f2c14e', { geo: GEO.ball6, ink: 0.004 }); } }
      }
    }
    return { hw: o.round ? undefined : w / 2, hd: o.round ? undefined : d / 2, r: o.round ? w / 2 + 0.05 : undefined, h: top, look: o.look === undefined ? 'w.table' : o.look, lookY: top + 0.45, feat: 'table' };
  }
  function chair(k, o) {
    const c = o.color || '#a8703f', seat = 0.46, dk = shade(c, 0.82);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * 0.18, 0, sz * 0.18, 0.05, seat, 0.05, dk, { ink: 0.005 });
    k.box(0, seat + 0.03, 0, 0.44, 0.06, 0.44, c);
    if (o.cushion) k.box(0, seat + 0.08, 0.01, 0.38, 0.05, 0.38, o.cushion, { ink: 0.005 });
    for (const sx of [-1, 1]) k.post(sx * 0.18, seat, -0.19, 0.05, 0.5, 0.05, dk, { ink: 0.005 });
    k.box(0, seat + 0.42, -0.19, 0.4, 0.12, 0.04, c, { ink: 0.006 }); k.box(0, seat + 0.22, -0.19, 0.4, 0.06, 0.03, c, { ink: 0.005 });
    return { r: 0.3, h: 0.95, look: o.look === undefined ? 'w.chair' : o.look, lookY: 1.2, feat: 'chair', seat: seat + 0.04 };
  }
  function stool(k, o) { const c = o.color || '#a8673a'; k.cyl(0, 0, 0, 0.2, 0.46, c, { geo: GEO.cyl8 }).cyl(0, 0.46, 0, 0.22, 0.05, shade(c, 1.1), { geo: GEO.cyl16, ink: 0.005 }); return { r: 0.25, seat: 0.5, solid: o.solid }; }
  function armchair(k, o) {
    const c = o.color || '#5aa0d8', dk = shade(c, 0.85);
    k.post(0, 0.12, 0, 0.82, 0.32, 0.78, c).box(0, 0.5, 0.03, 0.62, 0.12, 0.66, shade(c, 1.08));
    k.post(0, 0.12, -0.33, 0.82, 0.9, 0.18, dk).add(GEO.halfDisc, 0, 1.02, -0.33, 0.41, 0.18, 0.12, dk, { rx: Math.PI / 2 });
    for (const s of [-1, 1]) k.post(s * 0.37, 0.12, 0.02, 0.16, 0.5, 0.74, dk);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * 0.33, 0, sz * 0.3, 0.06, 0.12, 0.06, '#5b3a22', { ink: 0.004 });
    return { hw: 0.45, hd: 0.42, h: 1.1, seat: 0.56, look: 'w.chair', lookY: 1.3, feat: 'chair' };
  }
  // the rocking chair: parts on its own bone (it rocks when someone sits in it)
  function rockingChair(room, x, z, yaw, color) {
    const rig = room.rig, b = rig.bone(null, [x, 0, z], [0, yaw, 0], 'YXZ'), c = color || '#a8703f', dk = shade(c, 0.82);
    for (const s of [-1, 1]) {
      rig.part(b, PG.box, dk, [s * 0.22, 0.04, 0], [0.05, 0.05, 0.9], [0, 0, 0], 0.006);
      rig.part(b, PG.box, dk, [s * 0.22, 0.25, 0.18], [0.05, 0.42, 0.05], null, 0.006); rig.part(b, PG.box, dk, [s * 0.22, 0.6, -0.2], [0.05, 1.1, 0.05], [-0.12, 0, 0], 0.006);
      rig.part(b, PG.box, c, [s * 0.24, 0.66, 0.02], [0.06, 0.05, 0.5], null, 0.006);
    }
    rig.part(b, PG.box, c, [0, 0.46, 0.02], [0.48, 0.06, 0.46], null, 0.008);
    rig.part(b, PG.box, room.P.fab[0], [0, 0.51, 0.03], [0.4, 0.05, 0.4], null, 0.006);
    for (let i = 0; i < 4; i++) rig.part(b, PG.box, c, [0, 0.62 + i * 0.16, -0.2 - i * 0.02], [0.44, 0.05, 0.04], [-0.12, 0, 0], 0.005);
    room.solids.push({ x, z, r: 0.42 });
    addLook(room, 'w.chair', x, z, yaw, { hd: 0.4, lookY: 1.3 });
    room.feats.add('chair');
    return b;
  }
  // --- the kitchen: a stove with its oven, a counter, the hearth
  function stove(k, o, room) {
    const st = room.door.style, body = st === 'molinar' ? '#f3ede2' : st === 'lake' ? '#3a3436' : '#efe6d0', top = '#2b2830';
    k.post(0, 0.06, 0, 0.92, 0.8, 0.62, body);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * 0.4, 0, sz * 0.26, 0.07, 0.08, 0.07, top, { ink: 0.004 });
    k.box(0, 0.88, 0, 0.98, 0.06, 0.68, top);
    for (const s of [-1, 1]) k.add(GEO.thin, s * 0.22, 0.915, 0.04, 0.13, 0.13, 0.13, '#5a5258', { rx: Math.PI / 2, ink: 0 });
    k.box(0, 0.42, 0.315, 0.7, 0.5, 0.04, st === 'lake' ? '#4a4448' : '#d9cdb4', { ink: 0.006 });
    k.glow(0, 0.46, 0.338, 0.36, 0.16, '#ff9d3a', { c2: '#c2412f' });
    k.box(0, 0.7, 0.35, 0.5, 0.035, 0.035, W8.steel, { ink: 0.004 });
    for (let i = 0; i < 4; i++) k.ball(-0.33 + i * 0.22, 0.79, 0.32, 0.03, W8.brass, { geo: GEO.ball6, ink: 0.003 });
    // a soup pot on one ring, a kettle on the other; the pipe up the wall
    k.cyl(-0.22, 0.91, 0.04, 0.17, 0.2, '#c9783a', { geo: GEO.cyl16 }).cyl(-0.22, 1.11, 0.04, 0.175, 0.025, '#a35e2a', { geo: GEO.cyl16, ink: 0.004 }).ball(-0.22, 1.15, 0.04, 0.03, '#2b2830', { ink: 0.003 });
    k.ball(0.22, 1.02, 0.04, 0.12, '#3f6fb5', { ry2: 0.1 }).add(GEO.cone6, 0.36, 1.06, 0.04, 0.025, 0.14, 0.025, '#3f6fb5', { rz: -1.0, ink: 0.004 });
    k.cyl(0, 0.94, -0.26, 0.07, room.WH - 0.94, '#2b2830', { geo: GEO.cyl8, ink: 0.006, wall: o.wall || 0 });
    room.steam.push(k.world(-0.22, 1.2, 0.04));
    return { hw: 0.5, hd: 0.35, h: 1.1, look: 'w.oven', lookY: 0.9, feat: 'stove', feats: ['oven'] };
  }
  function counter(k, o, room) {
    const L = o.len || 2.4, st = room.door.style, R = room.R;
    const cab = st === 'molinar' ? '#f3ede2' : st === 'lake' ? mix(room.P.paper, '#ffffff', 0.4) : mix(room.P.wains, '#ffffff', 0.15), top = st === 'molinar' ? '#c96f4a' : '#c8925a';
    k.post(0, 0.06, 0, L, 0.8, 0.58, cab).box(0, 0.89, 0.02, L + 0.06, 0.06, 0.64, top);
    k.post(0, 0, 0.02, L - 0.04, 0.06, 0.5, shade(cab, 0.6), { ink: 0 });
    const n = Math.max(2, Math.round(L / 0.6));
    for (let i = 0; i < n; i++) { const x = -L / 2 + (i + 0.5) * L / n; k.box(x, 0.47, 0.295, L / n - 0.1, 0.6, 0.02, shade(cab, 0.93), { ink: 0.004 }); k.ball(x + (i % 2 ? -1 : 1) * (L / n / 2 - 0.12), 0.62, 0.31, 0.025, W8.brass, { ink: 0 }); }
    if (st === 'molinar') for (let i = 0; i < Math.floor(L / 0.2); i++) for (let j = 0; j < 2; j++) k.box(-L / 2 + 0.1 + i * 0.2, 1.02 + j * 0.2, -0.28, 0.18, 0.18, 0.015, (i + j) % 2 ? '#3f6fb5' : '#fdf8ee', { ink: 0, wall: o.wall || 0 });
    // things on it: a cutting board with vegetables, jars, a bowl of fruit, a basin
    k.box(-L * 0.3, 0.93, 0.02, 0.42, 0.03, 0.28, '#d8b080', { ink: 0.004 });
    k.ball(-L * 0.3 - 0.08, 0.98, 0.0, 0.05, '#e2453a', { ink: 0.004 }).add(GEO.cone6, -L * 0.3 + 0.1, 0.97, 0.04, 0.03, 0.18, 0.03, '#e88a2a', { rz: Math.PI / 2, ink: 0.004 });
    for (let i = 0; i < 3; i++) jarAt(k, L * 0.12 + i * 0.13, 0.92, -0.15, R, 0.9);
    k.cyl(L * 0.36, 0.92, 0.05, 0.16, 0.09, pick(room.P.fab, R), { geo: GEO.bowl, ink: 0.005 });
    for (let i = 0; i < 3; i++) k.ball(L * 0.36 + (i - 1) * 0.07, 1.03, 0.05 + (i % 2) * 0.04, 0.055, '#e2453a', { geo: GEO.ball6, ink: 0.004 });
    room.fruit = room.fruit || k.world(L * 0.36, 1.0, 0.05);
    return { hw: L / 2 + 0.03, hd: 0.32, h: 1.0, look: null, feat: 'kitchen' };
  }
  function fireplace(k, o, room) {
    const WH = room.WH, st = room.door.style, R = room.R;
    const brick = st === 'molinar' ? '#f3ede2' : '#b5654a', mantel = st === 'molinar' ? '#5e4130' : W8.cream, breast = st === 'molinar' ? '#f6f1e7' : mix(room.P.paper, '#ffffff', 0.1);
    k.post(0, 0, 0.25, 2.1, 0.12, 0.85, '#9a9488');
    for (const s of [-1, 1]) k.post(s * 0.8, 0.12, 0, 0.5, 1.12, 0.6, brick);
    k.post(0, 0.98, 0, 1.2, 0.26, 0.6, brick);
    k.post(0, 0.12, -0.1, 1.12, 0.86, 0.4, '#2b2228', { ink: 0 });
    k.box(0, 1.29, 0.03, 2.3, 0.1, 0.72, mantel);
    k.post(0, 1.34, -0.12, 1.7, WH - 1.34, 0.36, breast, { wall: o.wall || 0 });
    if (st !== 'molinar') for (let i = 0; i < 6; i++) k.box((i % 3 - 1) * 0.7 + (Math.floor(i / 3) % 2) * 0.35, 0.3 + Math.floor(i / 3) * 0.42, 0.31, 0.36, 0.12, 0.02, shade(brick, 0.82), { ink: 0 });
    // logs and the fire
    k.cyl(-0.12, 0.16, 0.06, 0.08, 0.7, '#7a5236', { rz: Math.PI / 2, ry: 0.3, geo: GEO.cyl8, ink: 0.005 }).cyl(0.12, 0.16, 0.12, 0.08, 0.7, '#6b4a33', { rz: Math.PI / 2, ry: -0.4, geo: GEO.cyl8, ink: 0.005 });
    for (let i = 0; i < 5; i++) k.add(GEO.cone6, -0.3 + i * 0.15, 0.45 + (i % 2) * 0.06, 0.08, 0.1 + (i % 2) * 0.03, 0.34 + (i % 3) * 0.1, 0.07, i % 2 ? '#ffd56a' : '#ff8a3a', { b: 'glow', flick: 1, c2: '#ff5a2a' });
    k.glow(0, 0.4, -0.29, 1.0, 0.6, '#5a2a1a', { c2: '#ff7a3a' });
    // on the mantel: candles, a little clock, a photo
    candleAt(k, -0.85, 1.34, 0.1); candleAt(k, 0.85, 1.34, 0.1);
    k.post(0.38, 1.34, 0.05, 0.3, 0.26, 0.12, '#8a5f3e', { ink: 0.005 }).add(GEO.cyl16, 0.38, 1.49, 0.12, 0.09, 0.02, 0.09, W8.cream, { rx: Math.PI / 2, ink: 0 });
    k.box(0.38, 1.52, 0.135, 0.012, 0.07, 0.01, INK, { ink: 0 }).box(0.41, 1.49, 0.135, 0.06, 0.012, 0.01, INK, { ink: 0 });
    k.post(-0.38, 1.34, 0.08, 0.22, 0.26, 0.04, '#c99a3e', { ink: 0.004 }); k.decal(-0.38, 1.47, 0.105, 0.17, 0.2, 'family');
    room.fire = k.world(0, 0.6, 0.15);
    return { hw: 1.15, hd: 0.5, h: 1.6, look: null, feat: 'fire', feats: ['clock'] };
  }
  // Molinar's hearth: a raised brick hearth under a big whitewashed hood, a pot hanging over the fire, copper pans
  function hood(k, o, room) {
    const WH = room.WH;
    k.post(0, 0, 0.05, 2.0, 0.42, 1.0, '#c96f4a').box(0, 0.44, 0.05, 2.06, 0.05, 1.06, '#a85a3a');
    k.post(0, 1.6, -0.05, 2.1, 0.6, 0.9, '#f6f1e7').add(GEO.cone4 || GEO.cone, 0, 2.2, -0.05, 1.0, 0.7, 0.62, '#f6f1e7');
    k.post(0, 2.6, -0.25, 1.0, WH - 2.6, 0.5, '#f6f1e7', { wall: o.wall || 0 });
    k.box(0, 1.62, 0.42, 2.14, 0.08, 0.06, '#5e4130');
    k.cyl(-0.15, 0.47, 0.05, 0.08, 0.6, '#7a5236', { rz: Math.PI / 2, ry: 0.3, geo: GEO.cyl8, ink: 0.005 });
    for (let i = 0; i < 4; i++) k.add(GEO.cone6, -0.25 + i * 0.16, 0.72, 0.08, 0.09, 0.3, 0.07, i % 2 ? '#ffd56a' : '#ff8a3a', { b: 'glow', flick: 1, c2: '#ff5a2a' });
    k.beam(0, 1.58, 0.05, 0, 1.05, 0.05, 0.02, INK, { ink: 0 });
    k.cyl(0, 0.82, 0.05, 0.22, 0.24, '#3a3436', { geo: GEO.bowl });
    for (let i = 0; i < 3; i++) k.cyl(-0.7 + i * 0.7, 1.66, 0.42, 0.12 - i * 0.02, 0.05, '#c9783a', { geo: GEO.cyl16, ink: 0.004 });
    room.fire = k.world(0, 0.8, 0.1); room.steam.push(k.world(0, 1.1, 0.05));
    return { hw: 1.05, hd: 0.55, h: 1.6, look: null, feat: 'fire', feats: ['stove'] };
  }
  // Remanso's iron pot-bellied stove
  function potStove(k, o, room) {
    k.post(0, 0, 0.1, 1.2, 0.08, 1.2, '#9a9488');
    k.cyl(0, 0.18, 0, 0.36, 0.7, '#3a3436', { geo: GEO.cyl16 }).ball(0, 0.88, 0, 0.36, '#3a3436', { geo: GEO.half }).cyl(0, 0.08, 0, 0.3, 0.12, '#2b2830', { geo: GEO.cyl16, ink: 0.005 });
    k.glow(0, 0.45, 0.36, 0.3, 0.22, '#ffb04a', { c2: '#e0502a' });
    k.cyl(0, 1.1, 0, 0.08, room.WH - 1.1, '#2b2830', { geo: GEO.cyl8, ink: 0.005, wall: o.wall || 0 });
    k.ball(0.18, 1.18, 0.05, 0.12, '#c9783a', { ry2: 0.1 });
    room.fire = k.world(0, 0.5, 0.3); room.steam.push(k.world(0.18, 1.3, 0.05));
    return { r: 0.5, h: 1.2, look: 'w.oven', lookY: 1.1, feat: 'fire', feats: ['oven'] };
  }
  // --- storage and the rest
  function bookcase(k, o, room) {
    const w = o.w || 1.1, h = o.h || 1.9, d = 0.36, c = o.color || room.P.wood, R = room.R;
    k.post(0, 0, -d / 2 + 0.02, w, h, 0.04, shade(c, 0.7), { ink: 0 });
    for (const s of [-1, 1]) k.post(s * (w / 2 - 0.03), 0, 0, 0.06, h, d, c);
    k.box(0, h + 0.03, 0.01, w + 0.08, 0.06, d + 0.04, c);
    const n = 4;
    for (let i = 0; i < n; i++) { const y = 0.06 + i * (h - 0.06) / n; k.box(0, y, 0, w - 0.06, 0.04, d, c, { ink: 0.005 }); booksRow(k, -w / 2 + 0.07, w / 2 - (R() < 0.4 ? 0.3 : 0.07), y + 0.02, 0.0, R, d - 0.06); }
    return { hw: w / 2 + 0.02, hd: d / 2 + 0.02, h, look: 'w.book', lookY: h * 0.7, feat: 'books' };
  }
  function wardrobe(k, o, room) {
    const w = o.w || 1.2, h = 2.0, d = 0.56, c = o.color || mix(room.P.wains, '#ffffff', 0.2);
    k.post(0, 0.08, 0, w, h - 0.08, d, c).box(0, h + 0.04, 0.01, w + 0.12, 0.1, d + 0.08, shade(c, 0.9));
    for (const s of [-1, 1]) { k.box(s * w / 4, h / 2 + 0.04, d / 2 + 0.01, w / 2 - 0.12, h - 0.4, 0.02, shade(c, 0.92), { ink: 0.004 }); k.ball(s * 0.07, h / 2, d / 2 + 0.04, 0.03, W8.brass, { ink: 0.003 }); }
    for (const sx of [-1, 1]) k.post(sx * (w / 2 - 0.08), 0, 0, 0.1, 0.08, d - 0.1, shade(c, 0.7), { ink: 0.004 });
    return { hw: w / 2 + 0.04, hd: d / 2, h, look: null };
  }
  function dresser(k, o, room) {   // a low chest of drawers; a lamp, a vase, a photo on top; a plate rack on the wall above
    const w = o.w || 1.3, h = 0.86, d = 0.5, c = o.color || room.P.wood, R = room.R;
    k.post(0, 0.06, 0, w, h - 0.06, d, c).box(0, h + 0.02, 0, w + 0.06, 0.05, d + 0.06, shade(c, 1.08));
    for (let i = 0; i < 3; i++) { const y = 0.22 + i * 0.24; k.box(0, y, d / 2 + 0.01, w - 0.12, 0.2, 0.02, shade(c, 0.92), { ink: 0.004 }); for (const s of [-1, 1]) k.ball(s * w * 0.22, y, d / 2 + 0.035, 0.025, W8.brass, { ink: 0 }); }
    tableLampAt(k, -w * 0.3, h + 0.045, 0, room); vaseAt(k, w * 0.3, h + 0.045, 0.02, pick(room.P.fab, R), R);
    if (o.rack !== false) {
      const y0 = 1.5, wall = o.wall || 0;
      for (const y of [y0, y0 + 0.5]) k.box(0, y, -d / 2 + 0.07, w, 0.04, 0.14, shade(c, 0.95), { wall });
      for (const y of [y0, y0 + 0.5]) for (let i = 0; i < 4; i++) k.add(GEO.cyl16, -w / 2 + 0.2 + i * (w - 0.4) / 3, y + 0.14, -d / 2 + 0.06, 0.12, 0.016, 0.12, W8.cream, { rx: Math.PI / 2 - 0.2, ink: 0.004, wall });
      for (const y of [y0, y0 + 0.5]) for (let i = 0; i < 4; i++) k.add(GEO.thin, -w / 2 + 0.2 + i * (w - 0.4) / 3, y + 0.14, -d / 2 + 0.07, 0.095, 0.095, 0.095, room.P.rim, { rx: -0.2, ink: 0, wall });
    }
    return { hw: w / 2 + 0.03, hd: d / 2 + 0.03, h, look: 'w.plate', lookY: 1.8, feat: 'plate', feats: ['lamp'] };
  }
  function tableLampAt(k, x, y, z, room) {
    k.cyl(x, y, z, 0.07, 0.04, W8.brass, { geo: GEO.cyl8, ink: 0.004 }).cyl(x, y + 0.04, z, 0.018, 0.26, W8.brass, { geo: GEO.cyl6, ink: 0.003 });
    k.add(GEO.taper, x, y + 0.36, z, 0.15, 0.18, 0.15, '#ffe2a0', { b: 'glow', c2: '#ffc870' });
    room.feats.add('lamp');
  }
  function nightstand(k, o, room) {
    const c = o.color || room.P.wood;
    k.post(0, 0.04, 0, 0.5, 0.52, 0.42, c).box(0, 0.58, 0, 0.54, 0.04, 0.46, shade(c, 1.08)).box(0, 0.36, 0.22, 0.38, 0.16, 0.02, shade(c, 0.9), { ink: 0.004 });
    tableLampAt(k, -0.08, 0.6, -0.02, room);
    if (o.book) k.box(0.13, 0.62, 0.06, 0.16, 0.04, 0.22, pick(room.P.fab, room.R), { ry: 0.3, ink: 0.004 });
    if (o.cup) cupOn(k, 0.14, 0.6, -0.08, pick(room.P.fab, room.R));
    return { hw: 0.27, hd: 0.23, h: 1.0, look: 'w.lamp', lookY: 1.25, feat: 'lamp' };
  }
  function sideTable(k, o, room) {   // a little round table with a teapot and cups (Look: the cup)
    const c = o.color || room.P.wood;
    k.cyl(0, 0.56, 0, 0.3, 0.05, c, { geo: GEO.cyl16 }).cyl(0, 0, 0, 0.04, 0.56, shade(c, 0.85), { geo: GEO.cyl6 }).cyl(0, 0, 0, 0.16, 0.04, shade(c, 0.85), { geo: GEO.cyl8 });
    const col = pick(room.P.fab, room.R);
    k.ball(-0.08, 0.7, 0, 0.1, col, { ry2: 0.085 }).add(GEO.cone6, 0.04, 0.72, 0, 0.022, 0.13, 0.022, col, { rz: -1.0, ink: 0.004 }).ball(-0.08, 0.79, 0, 0.035, col, { ink: 0.003 });
    cupOn(k, 0.12, 0.61, 0.1, col); cupOn(k, 0.06, 0.61, -0.14, col);
    return { r: 0.33, h: 0.75, look: 'w.cup', lookY: 1.0, feat: 'cup' };
  }
  function floorLamp(k, o, room) {
    k.cyl(0, 0, 0, 0.18, 0.04, '#5b3a22', { geo: GEO.cyl16 }).cyl(0, 0.04, 0, 0.025, 1.4, '#5b3a22', { geo: GEO.cyl6, ink: 0.004 });
    k.add(GEO.taper, 0, 1.56, 0, 0.26, 0.32, 0.26, '#ffe2a0', { b: 'glow', c2: '#ffc870' });
    k.add(GEO.thin, 0, 1.4, 0, 0.26, 0.26, 0.26, '#c99a3e', { rx: Math.PI / 2, ink: 0 });
    room.feats.add('lamp');
    return { r: 0.22, h: 1.7, look: 'w.lamp', lookY: 1.9, feat: 'lamp' };
  }
  // a lamp hanging from the dark above: a cord, a shade, a warm glow under it
  // (o.look: where you'd stand to Look at it, when it doesn't hang over a table)
  function hangLamp(room, x, z, y = 2.55, color, o = {}) {
    const k = room.kit; k.frame(x, 0, z, 0, 0);
    k.cyl(0, y + 0.2, 0, 0.012, room.WH + 1.5 - y, INK, { geo: GEO.cyl6, ink: 0, ns: 1 });
    k.ball(0, y + 0.12, 0, 0.3, color || '#3f6fb5', { geo: GEO.half, ry2: 0.2 });
    k.ball(0, y + 0.06, 0, 0.09, '#fff3c0', { b: 'glow' });
    k.add(GEO.thin, 0, y + 0.12, 0, 0.3, 0.3, 0.3, shade(color || '#3f6fb5', 0.7), { rx: Math.PI / 2, ink: 0 });
    room.feats.add('lamp');
    if (o.look) room.looks.push({ id: 'w.lamp', x: o.look.x, z: o.look.z, r: 1.1, ax: x, ay: y + 0.5, az: z });
  }
  function roundRug(k, o, room) {
    const r = o.r || 1.1, cols = o.cols || [room.P.fab[1], room.P.fab[2], room.P.fab[3]], sx = o.sx || 1;
    k.add(GEO.cyl24, 0, 0.012, 0, r * sx, 0.024, r, cols[0], { ink: 0.008 });
    k.add(GEO.cyl24, 0, 0.026, 0, r * 0.72 * sx, 0.02, r * 0.72, cols[1], { ink: 0 });
    k.add(GEO.cyl24, 0, 0.038, 0, r * 0.42 * sx, 0.02, r * 0.42, cols[2], { ink: 0 });
    room.feats.add('rug');
    return { solid: false, look: 'w.rug', lookY: 0.5, hd: r * 0.6, front: 0.35, feat: 'rug', lookR: 1.0 };
  }
  function rectRug(k, o, room) {
    const w = o.w || 2.4, d = o.d || 1.6, a = o.cols ? o.cols[0] : room.P.fab[4], b = o.cols ? o.cols[1] : room.P.fab[5], c = o.cols ? o.cols[2] : room.P.fab[6];
    k.box(0, 0.012, 0, w, 0.024, d, a, { ink: 0.008 }).box(0, 0.028, 0, w - 0.3, 0.012, d - 0.3, b, { ink: 0 }).box(0, 0.036, 0, w - 0.55, 0.012, d - 0.55, a, { ink: 0 });
    for (let i = -1; i <= 1; i++) k.box(i * (w - 0.6) / 3, 0.044, 0, 0.32, 0.012, 0.32, c, { ry: Math.PI / 4, ink: 0 });
    for (const s of [-1, 1]) for (let i = 0; i < 8; i++) k.box(s * (w / 2 + 0.06), 0.008, -d / 2 + 0.1 + i * (d - 0.2) / 7, 0.12, 0.012, 0.035, W8.cream, { ink: 0 });
    room.feats.add('rug');
    return { solid: false, look: o.look === undefined ? 'w.rug' : o.look, lookY: 0.4, hd: d / 2, front: 0.25, feat: 'rug', lookR: 1.0 };
  }
  function bench(k, o, room) {
    const w = o.w || 1.4, c = o.color || room.P.wood;
    k.box(0, 0.44, 0, w, 0.06, 0.4, c);
    for (const s of [-1, 1]) k.post(s * (w / 2 - 0.12), 0, 0, 0.07, 0.42, 0.34, shade(c, 0.85), { ink: 0.005 });
    if (o.cushion) k.box(0, 0.5, 0, w - 0.2, 0.06, 0.32, o.cushion, { ink: 0.005 });
    return { hw: w / 2, hd: 0.2, h: 0.5, look: null, seat: 0.5 };
  }
  function coatRack(k, o, room) {
    k.cyl(0, 0, 0, 0.18, 0.04, '#5b3a22', { geo: GEO.cyl8 }).cyl(0, 0, 0, 0.03, 1.8, '#5b3a22', { geo: GEO.cyl6, ink: 0.004 });
    for (let i = 0; i < 3; i++) { const a = i * 2.1; k.beam(0, 1.62, 0, Math.cos(a) * 0.16, 1.72, Math.sin(a) * 0.16, 0.02, '#5b3a22', { ink: 0 }); }
    k.add(GEO.taper, 0.12, 1.25, 0.05, 0.16, 0.5, 0.1, pick(room.P.fab, room.R), { ink: 0.006 });
    k.add(GEO.half, -0.1, 1.72, 0.04, 0.13, 0.08, 0.13, pick(['#3a3040', '#e8c57a', '#d9483b'], room.R), { ink: 0.005 });
    return { r: 0.22, h: 1.8, look: null };
  }
  function plantItem(k, o, room) { plantAt(k, 0, 0, 0, o.s || 1.1, room.R, o); room.feats.add('plants'); return { r: 0.22 * (o.s || 1.1), h: 1, look: null, solid: o.solid }; }
  function sacks(k, o, room) {
    const n = o.n || 3, R = room.R;
    for (let i = 0; i < n; i++) { const x = (i % 3 - 1) * 0.5, z = Math.floor(i / 3) * 0.45, y = i >= 3 ? 0.45 : 0; k.ball(x, y + 0.36, z, 0.3, '#efe4cc', { ry2: 0.36, rz2: 0.26, ink: 0.008 }).ball(x, y + 0.72, z, 0.09, '#e3d6b8', { ry2: 0.07, ink: 0.005 }); k.cyl(x, y + 0.56, z, 0.17, 0.04, '#c9553f', { geo: GEO.cyl8, ink: 0 }); void R; }
    return { hw: 0.8, hd: 0.35, h: 0.9, look: null };
  }
  function barrelAt(k, x, y, z, s = 1, lying = false) {
    const o = lying ? { rz: Math.PI / 2, geo: GEO.cyl8 } : { geo: GEO.cyl8 };
    if (lying) { k.add(GEO.cyl8, x, y + 0.38 * s, z, 0.38 * s, 0.9 * s, 0.38 * s, '#9a6a3f', { rz: Math.PI / 2 }); for (const hx of [-0.3, 0.3]) k.add(GEO.cyl8, x + hx * s, y + 0.38 * s, z, 0.4 * s, 0.07 * s, 0.4 * s, '#4a3a33', { rz: Math.PI / 2, ink: 0 }); k.add(GEO.cyl8, x + 0.46 * s, y + 0.38 * s, z, 0.24 * s, 0.03, 0.24 * s, '#7a5236', { rz: Math.PI / 2, ink: 0 }); return; }
    k.cyl(x, y, z, 0.38 * s, 0.9 * s, '#9a6a3f', o); for (const hy of [0.18, 0.72]) k.cyl(x, y + hy * s, z, 0.4 * s, 0.07 * s, '#4a3a33', { geo: GEO.cyl8, ink: 0 });
  }
  // --- on the walls (the frame sits on the wall at the given height; front = into the room)
  function windowItem(k, o, room) {
    const w = o.w || 1.2, h = o.h || 1.1, trim = o.trim || room.P.trim, R = room.R, st = room.door.style;
    if (o.round) {
      k.add(GEO.cyl24, 0, 0, 0.02, w / 2 + 0.1, 0.06, w / 2 + 0.1, trim, { rx: Math.PI / 2 });
      k.add(GEO.cyl24, 0, 0, 0.055, w / 2, 0.01, w / 2, '#fff3cf', { rx: Math.PI / 2, b: 'glow', c2: '#cfeeff' });
      k.box(0, 0, 0.07, w, 0.05, 0.03, trim, { ink: 0 }).box(0, 0, 0.07, 0.05, w, 0.03, trim, { ink: 0 });
    } else {
      k.glow(0, 0, 0.025, w, h, '#fff6d8', { c2: '#cdeeff' });
      for (const s of [-1, 1]) { k.box(s * (w / 2 + 0.05), 0, 0.04, 0.1, h + 0.2, 0.08, trim); k.box(0, s * (h / 2 + 0.05), 0.04, w + 0.2, 0.1, 0.08, trim); }
      k.box(0, 0, 0.05, 0.05, h, 0.04, trim, { ink: 0 }).box(0, 0, 0.05, w, 0.05, 0.04, trim, { ink: 0 });
      k.box(0, -h / 2 - 0.1, 0.12, w + 0.36, 0.06, 0.24, trim);
      if (o.curtains !== false && st !== 'molinar') {
        const cc = o.curtain || room.P.fab[2];
        for (const s of [-1, 1]) k.box(s * (w / 2 + 0.16), 0.02, 0.1, 0.3, h + 0.34, 0.05, cc, { ink: 0.006 });
        k.box(0, h / 2 + 0.2, 0.1, w + 0.66, 0.16, 0.06, shade(cc, 0.9), { ink: 0.006 });
      }
      if (st === 'molinar') for (const s of [-1, 1]) k.box(s * (w / 2 + 0.28), 0, 0.05, 0.42, h + 0.1, 0.05, room.P.shutter, { ink: 0.006 });
      if (o.sill || R() < 0.45) plantAt(k, (R() - 0.5) * w * 0.5, -h / 2 - 0.07, 0.13, 0.55, R, { flowers: true });
    }
    if (o.sun) room.sunWindows.push({ w: o.round ? w * 0.7 : w, h: o.round ? w * 0.7 : h, c: k.world(0, 0, 0.03), u: k.world(1, 0, 0.03).sub(k.world(0, 0, 0.03)), wall: k.wall });
    room.feats.add('window');
    return { look: 'w.window', lookY: 0.3, front: 1.0 };
  }
  // Remanso's things: a fishing net with its floats, crossed oars, a life ring (on a wall)
  function fishNet(k, o) {
    const w = o.w || 1.8, h = o.h || 1.1, NC = '#5d6b70';
    for (let i = 0; i <= 6; i++) { const x = -w / 2 + i * w / 6; k.beam(x, 0, 0.04, x + (i % 2 ? 0.06 : -0.06), -h + Math.sin(i / 6 * Math.PI) * 0.15, 0.06, 0.016, NC, { ink: 0 }); }
    for (let j = 1; j <= 4; j++) { const y = -j * h / 4; k.beam(-w / 2, y, 0.05, w / 2, y - Math.sin(j / 4 * Math.PI) * 0.1, 0.05, 0.016, NC, { ink: 0 }); }
    k.box(0, 0.04, 0.03, w + 0.12, 0.05, 0.05, '#8a5f3e', { ink: 0.005 });
    for (let i = 0; i < 5; i++) k.ball(-w / 2 + 0.2 + i * (w - 0.4) / 4, -0.02, 0.09, 0.08, ['#d9483b', '#f2c94c', '#fdf8ee'][i % 3], { ink: 0.005 });
    return { look: null };
  }
  function oars(k) {
    for (const s of [-1, 1]) { k.beam(-s * 0.7, -0.7, 0.06, s * 0.6, 0.6, 0.06, 0.05, '#c9a66b'); k.add(GEO.ball, s * 0.72, 0.72, 0.06, 0.12, 0.3, 0.03, '#c9a66b', { rz: -s * Math.PI / 4 }); }
    return { look: null };
  }
  function lifeRing(k) {
    k.add(GEO.torus, 0, 0, 0.08, 0.32, 0.32, 0.5, '#fdf8ee', { ink: 0.008 });
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; k.add(GEO.torus, Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0.08, 0.09, 0.09, 0.42, '#d9483b', { rz: a, ink: 0 }); }
    return { look: null };
  }
  function picture(k, o, room) {
    const w = o.w || 0.7, h = o.h || 0.6, frame = o.frame || pick(['#c99a3e', '#8a5f3e', '#3a3040', W8.cream], room.R);
    k.box(0, 0, 0.02, w + 0.1, h + 0.1, 0.04, frame, { ink: 0.006 });
    k.decal(0, 0, 0.045, w, h, o.cell);
    if (o.cell === 'star' || o.cell === 'drawhouse') room.feats.add('drawing');
    return { look: null, read: PIC_READ.includes(o.cell) ? o.cell : null };        // (pictures with words on them: E «Read»)
  }
  function wallShelf(k, o, room) {   // one or two boards on brackets, with jars, books, plates
    const L = o.len || 1.0, R = room.R, c = o.color || room.P.wood, levels = o.levels || 1;
    for (let j = 0; j < levels; j++) {
      const y = j * 0.48;
      k.box(0, y, 0.12, L, 0.04, 0.24, c);
      for (const s of [-1, 1]) k.box(s * (L / 2 - 0.1), y - 0.1, 0.06, 0.04, 0.18, 0.12, shade(c, 0.85), { ink: 0.004 });
      const what = o.what || pick(['jars', 'books', 'plates', 'jars'], R);
      if (what === 'books') { booksRow(k, -L / 2 + 0.06, L / 2 - 0.06, y + 0.02, 0.12, R, 0.16); room.feats.add('books'); }
      else if (what === 'plates') { for (let i = 0; i < Math.floor(L / 0.28); i++) k.add(GEO.cyl16, -L / 2 + 0.16 + i * 0.28, y + 0.15, 0.08, 0.12, 0.016, 0.12, W8.cream, { rx: Math.PI / 2 - 0.25, ink: 0.004 }); room.feats.add('plate'); }
      else if (what === 'bottles') { for (let i = 0; i < Math.floor(L / 0.16); i++) { const col = pick(['#4f9a5a', '#7a3f5a', '#c99a3e', '#3f6fb5'], R); k.cyl(-L / 2 + 0.1 + i * 0.16, y + 0.02, 0.12, 0.05, 0.2, col, { geo: GEO.cyl8, ink: 0.004 }).cyl(-L / 2 + 0.1 + i * 0.16, y + 0.22, 0.12, 0.02, 0.08, col, { geo: GEO.cyl6, ink: 0.003 }); } }
      else if (what === 'mugs') { for (let i = 0; i < Math.floor(L / 0.18); i++) { k.cyl(-L / 2 + 0.1 + i * 0.18, y + 0.02, 0.12, 0.055, 0.12, '#e6a23a', { geo: GEO.cyl8, ink: 0.004 }); k.add(GEO.thin, -L / 2 + 0.16 + i * 0.18, y + 0.08, 0.12, 0.035, 0.035, 0.035, '#e6a23a', { ry: Math.PI / 2, ink: 0 }); } }
      else if (what === 'clocks') { for (let i = 0; i < Math.floor(L / 0.3); i++) { k.add(GEO.cyl16, -L / 2 + 0.17 + i * 0.3, y + 0.14, 0.12, 0.11, 0.06, 0.11, pick(['#c99a3e', '#8a5f3e', '#3a5a7a'], R), { rx: Math.PI / 2 - 0.15, ink: 0.004 }).add(GEO.cyl16, -L / 2 + 0.17 + i * 0.3, y + 0.15, 0.155, 0.085, 0.01, 0.085, W8.cream, { rx: Math.PI / 2 - 0.15, ink: 0 }); } room.feats.add('clock'); }
      else { for (let i = 0; i < Math.floor(L / 0.16); i++) jarAt(k, -L / 2 + 0.1 + i * 0.16, y + 0.02, 0.12, R); }
    }
    return { look: o.what === 'books' ? 'w.book' : o.what === 'plates' ? 'w.plate' : null, lookY: 0.2, front: 0.9 };
  }
  // a wall clock: a case, a face, ticks, and hands (bones) that show the time, ticking; now and then a pendulum or a cuckoo
  function clockItem(k, o, room) {
    const r = o.r || 0.24, R = room.R, shape = o.shape || pick(['round', 'round', 'square', 'oct', 'cuckoo'], R), col = o.color || pick(['#8a5f3e', '#c99a3e', '#3a5a7a', '#5e4130', '#c9553f', '#4f8a7a'], R);
    let cz = 0.06;
    if (shape === 'round') k.add(GEO.cyl24, 0, 0, 0.04, r + 0.06, 0.08, r + 0.06, col, { rx: Math.PI / 2 });
    else if (shape === 'oct') k.add(GEO.cyl8, 0, 0, 0.04, r + 0.08, 0.08, r + 0.08, col, { rx: Math.PI / 2, rz: Math.PI / 8 });
    else if (shape === 'square') k.box(0, 0, 0.04, r * 2 + 0.14, r * 2 + 0.14, 0.08, col);
    else { // a cuckoo clock: a little house with a roof, pine cones on chains
      k.box(0, -0.04, 0.08, r * 2 + 0.2, r * 2 + 0.36, 0.16, col);
      k.add(GEO.prism, 0, r + 0.12, 0.08, r * 2 + 0.44, 0.34, 0.24, shade(col, 0.75), { rx: Math.PI / 2 });
      k.box(0, r + 0.02, 0.17, 0.14, 0.14, 0.02, '#2b2228', { ink: 0 });
      for (const s of [-1, 1]) { k.beam(s * 0.1, -r - 0.2, 0.08, s * 0.1, -r - 0.62, 0.08, 0.01, INK, { ink: 0 }); k.add(GEO.cone6, s * 0.1, -r - 0.72, 0.08, 0.05, 0.16, 0.05, '#7a5236', { rx: Math.PI, ink: 0.004 }); }
      cz = 0.16;
    }
    k.add(GEO.cyl24, 0, 0, cz + 0.02, r, 0.02, r, W8.cream, { rx: Math.PI / 2, ink: 0 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; k.box(Math.sin(a) * r * 0.8, Math.cos(a) * r * 0.8, cz + 0.035, 0.02 * (r / 0.24), (i % 3 ? 0.04 : 0.08) * (r / 0.24), 0.01, INK, { rz: -a, ink: 0 }); }
    const rig = room.rig, at = k.world(0, 0, cz + 0.04), rot = k.rot;
    const wl = k.wall, mk = (len, wid, color, z) => { const b = rig.bone(null, [at.x, at.y, at.z], [0, rot, 0], undefined, wl); rig.part(b, PG.box, color, [0, len / 2 - 0.02, z], [wid, len, 0.012], null, 0); return b; };
    const hour = mk(r * 0.5, r * 0.09, INK, 0.0), minute = mk(r * 0.78, r * 0.06, INK, 0.012), sec = mk(r * 0.85, r * 0.025, '#d6453a', 0.024);
    rig.part(sec, PG.disc, '#d6453a', [0, 0, 0.03], [r * 0.07, 0.01, r * 0.07], [Math.PI / 2, 0, 0], 0);
    const off = o.offset !== undefined ? o.offset : (R() < 0.3 ? R() * 43200 : 0), hands = { hour, minute, sec, off };
    let pend = null;
    if (o.pendulum) {
      const pv = k.world(0, -r - 0.1, 0.05); pend = rig.bone(null, [pv.x, pv.y, pv.z], [0, rot, 0], undefined, wl);
      rig.part(pend, PG.box, W8.brass, [0, -0.32, 0], [0.025, 0.6, 0.02], null, 0.004); rig.part(pend, PG.disc, W8.brass, [0, -0.66, 0.0], [0.09, 0.03, 0.09], [Math.PI / 2, 0, 0], 0.006);
      k.box(0, -r - 0.42, -0.0, 0.34, 0.74, 0.06, shade(col, 0.8), { ink: 0.006 });
    }
    let bird = null;
    if (shape === 'cuckoo') { const bp = k.world(0, r + 0.02, 0.14); bird = { b: rig.bone(null, [bp.x, bp.y, bp.z], [0, rot, 0], undefined, wl), base: bp, dir: k.world(0, 0, 1).sub(k.world(0, 0, 0)), t: 2 + R() * 6 }; rig.part(bird.b, PG.ball, '#f2c14e', null, [0.05, 0.045, 0.06], null, 0.005); rig.part(bird.b, PG.cone, '#e88a2a', [0, 0, 0.06], [0.015, 0.04, 0.015], [Math.PI / 2, 0, 0], 0); }
    room.clocks.push({ hands, pend, bird, swing: 0.9 + R() * 0.5, phase: R() * 6 });
    room.feats.add('clock');
    return { look: 'w.clock', lookY: 0.1, front: 1.0 };
  }
  // a grandfather clock: a tall case, a face up top, a pendulum swinging behind its little window
  function grandClock(k, o, room) {
    const col = o.color || pick(['#7a4f2e', '#5e4130', '#8a5f3e'], room.R), H = 2.15;
    k.post(0, 0, 0, 0.62, 0.3, 0.42, shade(col, 0.85)).post(0, 0.3, 0, 0.5, 1.3, 0.36, col).post(0, 1.6, 0, 0.62, 0.5, 0.42, col);
    k.add(GEO.prism, 0, H - 0.05, 0, 0.7, 0.22, 0.46, shade(col, 0.8)).ball(0, H + 0.2, 0, 0.05, W8.brass, { ink: 0.003 });
    k.box(0, 0.95, 0.185, 0.3, 0.9, 0.02, '#2b2228', { ink: 0 });
    k.add(GEO.cyl24, 0, 1.85, 0.22, 0.2, 0.02, 0.2, W8.cream, { rx: Math.PI / 2, ink: 0 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; k.box(Math.sin(a) * 0.16, 1.85 + Math.cos(a) * 0.16, 0.235, 0.015, i % 3 ? 0.03 : 0.06, 0.01, INK, { rz: -a, ink: 0 }); }
    const rig = room.rig, at = k.world(0, 1.85, 0.24), rot = k.rot;
    const wl = k.wall, mk = (len, wid, color, z) => { const b = rig.bone(null, [at.x, at.y, at.z], [0, rot, 0], undefined, wl); rig.part(b, PG.box, color, [0, len / 2 - 0.015, z], [wid, len, 0.01], null, 0); return b; };
    const hands = { hour: mk(0.1, 0.02, INK, 0), minute: mk(0.15, 0.014, INK, 0.01), sec: mk(0.16, 0.006, '#d6453a', 0.02), off: 0 };
    const pv = k.world(0, 1.36, 0.21), pend = rig.bone(null, [pv.x, pv.y, pv.z], [0, rot, 0], undefined, wl);
    rig.part(pend, PG.box, W8.brass, [0, -0.3, 0], [0.02, 0.56, 0.015], null, 0); rig.part(pend, PG.disc, W8.brass, [0, -0.6, 0], [0.09, 0.025, 0.09], [Math.PI / 2, 0, 0], 0.005);
    room.clocks.push({ hands, pend, swing: 0.16, period: 2.0, phase: room.R() * 6, big: true });
    room.feats.add('clock');
    return { hw: 0.32, hd: 0.22, h: H, look: 'w.clock', lookY: 2.2 };
  }
  // the door you came in by (south wall): its frame, the door in the house's own color, a mat
  function frontDoor(k, o, room) {
    const st = room.door.style, c = o.color || room.P.door, trim = room.P.trim;
    k.box(0, 1.12, 0.02, 1.28, 2.34, 0.06, trim);
    k.box(0, 1.08, 0.05, 1.06, 2.16, 0.06, c);
    for (const y of [0.55, 1.45]) k.box(0, y, 0.085, 0.8, 0.62, 0.02, shade(c, 0.86), { ink: 0.004 });
    if (st === 'lake') k.add(GEO.cyl16, 0, 1.62, 0.09, 0.15, 0.02, 0.15, '#cdeeff', { rx: Math.PI / 2, b: 'glow' });
    else k.glow(0, 2.42, 0.03, 0.9, 0.22, '#fff3cf', { c2: '#ffe7a8' });
    k.ball(-0.38, 1.05, 0.1, 0.04, W8.brass, { ink: 0.003 });
    if (o.mat !== false) { k.frame(k.world(0, 0, 0).x, 0, k.world(0, 0, 0).z, k.rot, 0); k.box(0, 0.012, 0.62, 1.2, 0.024, 0.7, o.matColor || '#b9784a', { ink: 0.006 }); k.box(0, 0.026, 0.62, 0.95, 0.01, 0.45, shade(o.matColor || '#b9784a', 1.18), { ink: 0 }); }
    return { look: null };
  }
  // an inner door on a side wall (a back room, or a closet): Look teaches the word
  function innerDoor(k, o, room) {
    const c = o.color || room.P.door, trim = room.P.trim;
    k.box(0, 1.1, 0.02, 1.2, 2.28, 0.06, trim).box(0, 1.06, 0.05, 0.98, 2.12, 0.06, c);
    for (const y of [0.55, 1.45]) k.box(0, y, 0.085, 0.72, 0.6, 0.02, shade(c, 0.86), { ink: 0.004 });
    k.ball(0.35, 1.05, 0.1, 0.04, W8.brass, { ink: 0.003 });
    return { look: 'w.door', lookY: 2.3, front: 1.0, feat: 'door' };
  }
  // the stairs up, along a side wall, into a dark opening at the top (mill.js's way); the way up is a prompt at their foot
  function stairsUp(room, side) {      // side: -1 west wall, +1 east wall; rises toward the north from the south wall
    // (as many steps as the wall's height allows: the compact homes' walls are lower, and the doorway at the top stays under the cut)
    const { hw, hd } = room, k = room.kit, x = side * (hw - 0.56), rise = 0.29, run = 0.3, n = clamp(Math.floor((room.WH - 1.6) / rise), 5, 8), z0 = hd - 0.75, wood = room.P.wood, wall = side < 0 ? 4 : 2;
    const dh = Math.min(1.9, room.WH - n * rise - 0.2);
    k.frame(0, 0, 0, 0, 0);
    for (let i = 0; i < n; i++) { const z = z0 - i * run; k.post(x, 0, z - run / 2, 1.06, (i + 1) * rise, run, i % 2 ? wood : shade(wood, 1.08)); }
    const zt = z0 - n * run;
    k.beam(x - side * 0.56, 0.3, z0 + 0.1, x - side * 0.56, n * rise + 0.25, zt, 0.08, shade(wood, 0.8), { ink: 0.006 });
    for (let i = 0; i <= n; i += 2) { const z = z0 - i * run; k.post(x - side * 0.5, i * rise, z, 0.05, 0.85, 0.05, shade(wood, 0.8), { ink: 0.004 }); }
    k.beam(x - side * 0.5, rise + 0.85, z0, x - side * 0.5, n * rise + 0.85, zt + run, 0.06, wood, { ink: 0.005 });
    // the dark doorway at the top, in the wall
    k.frame(side * (hw - 0.012), n * rise, zt - 0.45, side < 0 ? Math.PI / 2 : -Math.PI / 2, wall);
    k.glow(0, dh / 2, 0, 1.0, dh, '#1b130e').box(-0.55, dh / 2, 0.03, 0.1, dh + 0.1, 0.06, room.P.trim).box(0.55, dh / 2, 0.03, 0.1, dh + 0.1, 0.06, room.P.trim).box(0, dh + 0.05, 0.03, 1.2, 0.1, 0.06, room.P.trim);
    room.solids.push({ obox: 1, x, z: (z0 + zt) / 2, hw: 0.55, hd: (z0 - zt) / 2 + 0.05, rot: 0 });
    room.feats.add('upstairs');
    const foot = { x: x - side * 1.1, z: z0 - 0.15 };
    room.exits.push({ x: foot.x, z: foot.z, r: 1.3, label: 'Go upstairs', go: 'up' });
    room.spawns.down = { x: foot.x - side * 0.3, z: foot.z - 0.5, yaw: side < 0 ? Math.PI / 2 : -Math.PI / 2 };
    return { x, z0, zt };
  }
  // the top of the stairs, upstairs: an opening in the floor with a railing, in a south corner
  function stairHole(room, side) {
    const { hw, hd } = room, k = room.kit, cx = side * (hw - 1.0), cz = hd - 1.4, w = 1.2, d = 2.2, wood = room.P.wood;
    k.frame(cx, 0, cz, 0, 0);
    k.glow(0, 0.01, 0, w, d, '#1b130e', { rx: -Math.PI / 2 });
    for (let i = 0; i < 4; i++) k.post(0, -0.3 - i * 0.29, d / 2 - 0.2 - i * 0.3, w - 0.06, 0.29, 0.3, i % 2 ? wood : shade(wood, 1.08), { ink: 0.004 });
    for (const s of [-1, 1]) k.box(s * (w / 2 + 0.03), 0.03, 0, 0.06, 0.06, d, shade(wood, 0.8), { ink: 0.004 });
    k.box(0, 0.03, -d / 2 - 0.03, w + 0.12, 0.06, 0.06, shade(wood, 0.8), { ink: 0.004 });
    const ix = -side * (w / 2 + 0.03);
    for (let i = 0; i <= 4; i++) k.post(ix, 0, -d / 2 + i * d / 4, 0.05, 0.9, 0.05, shade(wood, 0.8), { ink: 0.004 });
    for (let i = 0; i <= 2; i++) k.post(-w / 2 + i * w / 2, 0, -d / 2 - 0.03, 0.05, 0.9, 0.05, shade(wood, 0.8), { ink: 0.004 });
    k.box(ix, 0.92, 0, 0.07, 0.06, d, wood, { ink: 0.005 }).box(0, 0.92, -d / 2 - 0.03, w + 0.1, 0.06, 0.07, wood, { ink: 0.005 });
    room.solids.push({ obox: 1, x: cx, z: cz, hw: w / 2 + 0.06, hd: d / 2 + 0.06, rot: 0 });
    const at = { x: cx - side * (w / 2 + 0.75), z: cz - 0.2 };
    room.exits.push({ x: at.x, z: at.z, r: 1.25, label: 'Go downstairs', go: 'down' });
    room.spawns.up = { x: at.x - side * 0.2, z: at.z - 0.6, yaw: Math.PI };
  }
  // --- the bakery, the inn, the school, the clockmaker's, the mill, the boat shed
  function breadOven(k, o, room) {
    const brick = '#b5654a', dk = '#94503a';
    k.post(0, 0, 0, 2.0, 0.9, 1.5, brick);
    k.add(GEO.half, 0, 0.9, -0.05, 0.95, 0.85, 0.72, brick);
    k.add(GEO.halfDisc, 0, 0.62, 0.755, 0.42, 0.04, 0.42, '#2b2228', { rx: Math.PI / 2, ink: 0 });
    k.add(GEO.arch, 0, 0.62, 0.77, 0.47, 0.47, 0.6, dk, { ink: 0.006 });
    k.box(0, 0.6, 0.77, 0.9, 0.06, 0.12, dk, { ink: 0.006 });
    for (let i = 0; i < 4; i++) k.add(GEO.cone6, -0.24 + i * 0.16, 0.68, 0.62, 0.07, 0.22 + (i % 2) * 0.08, 0.06, i % 2 ? '#ffd56a' : '#ff8a3a', { b: 'glow', flick: 0.7, c2: '#ff5a2a' });
    k.glow(0, 0.78, 0.74, 0.7, 0.3, '#7a2a1a', { c2: '#ff9a4a' });
    for (let i = 0; i < 8; i++) k.box((i % 4 - 1.5) * 0.48, 0.18 + Math.floor(i / 4) * 0.34, 0.76, 0.4, 0.12, 0.02, dk, { ink: 0 });
    k.cyl(0.55, 1.5, -0.45, 0.14, room.WH - 1.5, '#9a9488', { geo: GEO.cyl8, ink: 0.006, wall: o.wall || 0 });
    for (let i = 0; i < 3; i++) loafAt(k, -0.6 + i * 0.6, 0.9, 0.55, 0.16, 0.2 * i);
    room.feats.add('oven');
    return { hw: 1.0, hd: 0.78, h: 1.8, look: 'w.oven', lookY: 1.9, feat: 'oven' };
  }
  function breadRack(k, o, room) {
    const w = o.w || 2.0, c = '#a8703f', R = room.R;
    for (const s of [-1, 1]) k.post(s * (w / 2 - 0.04), 0, 0, 0.08, 2.3, 0.5, c);
    for (let j = 0; j < 4; j++) {
      const y = 0.3 + j * 0.55; k.box(0, y, 0, w, 0.05, 0.5, c);
      for (let i = 0; i < Math.floor(w / 0.32); i++) { if (j === 3 && i % 2) continue; if (R() < 0.5 && j > 0) k.cyl(-w / 2 + 0.2 + i * 0.32, y + 0.1, 0, 0.05, 0.42, W8.bread, { rx: Math.PI / 2, ry: 0.3, geo: GEO.cyl8, ink: 0.005 }); else loafAt(k, -w / 2 + 0.2 + i * 0.32, y + 0.03, 0, 0.14, R() * 3); }
    }
    return { hw: w / 2, hd: 0.27, h: 2.3, look: 'w.bread', lookY: 1.8 };
  }
  function shopCounter(k, o, room) {
    const L = o.len || 3.0, c = o.color || '#c8925a', R = room.R;
    k.post(0, 0, 0, L, 0.95, 0.7, shade(c, 0.95)).box(0, 0.98, 0, L + 0.1, 0.06, 0.8, c);
    for (let i = 0; i < Math.floor(L / 0.7); i++) k.box(-L / 2 + 0.35 + i * 0.7, 0.48, 0.36, 0.56, 0.7, 0.02, shade(c, 0.85), { ink: 0.004 });
    if (o.goods === 'bread') {
      for (let i = 0; i < Math.floor(L / 0.8); i++) { const x = -L / 2 + 0.45 + i * 0.8; k.cyl(x, 1.01, 0, 0.26, 0.12, '#c9955a', { geo: GEO.bowl, ink: 0.006 }); for (let j = 0; j < 3; j++) loafAt(k, x + (j - 1) * 0.12, 1.08, (j % 2) * 0.06, 0.1, j); }
      k.cyl(L / 2 - 0.3, 1.01, 0.05, 0.18, 0.12, '#fdf8ee', { geo: GEO.cyl16, ink: 0.005 }).cyl(L / 2 - 0.3, 1.13, 0.05, 0.16, 0.14, '#f6a6c1', { geo: GEO.cyl16, ink: 0.006 }).ball(L / 2 - 0.3, 1.3, 0.05, 0.04, '#e2453a', { ink: 0.003 });
    } else if (o.goods === 'watches') {
      k.box(0, 1.04, 0, L - 0.1, 0.02, 0.6, '#cfe6ee', { ink: 0 });
      for (let i = 0; i < 6; i++) { const x = -L / 2 + 0.4 + i * (L - 0.8) / 5; k.add(GEO.cyl16, x, 1.06, (i % 2 - 0.5) * 0.25, 0.07, 0.015, 0.07, W8.brass, { ink: 0.003 }).add(GEO.cyl16, x, 1.07, (i % 2 - 0.5) * 0.25, 0.055, 0.01, 0.055, W8.cream, { ink: 0 }); }
    }
    if (o.till) k.post(-L / 2 + 0.35, 1.01, -0.05, 0.36, 0.2, 0.3, '#5e4130', { ink: 0.006 }).ball(-L / 2 + 0.75, 1.06, 0.1, 0.05, W8.brass, { ry2: 0.03, ink: 0.003 });
    void R;
    return { hw: L / 2 + 0.05, hd: 0.4, h: 1.1, look: null };
  }
  function bar(k, o, room) {
    const L = o.len || 5.0, c = '#7a4f2e';
    k.post(0, 0, 0, L, 1.0, 0.72, shade(c, 1.05)).box(0, 1.04, 0, L + 0.14, 0.08, 0.84, '#5e4130');
    for (let i = 0; i < Math.floor(L / 0.8); i++) k.box(-L / 2 + 0.4 + i * 0.8, 0.5, 0.37, 0.62, 0.76, 0.02, shade(c, 0.82), { ink: 0.004 });
    k.box(0, 0.06, 0.37, L, 0.04, 0.03, W8.brass, { ink: 0 });
    for (let i = 0; i < 3; i++) { const x = -L / 2 + 0.8 + i * 0.25; k.cyl(x, 1.08, -0.2, 0.03, 0.26, W8.brass, { geo: GEO.cyl8, ink: 0.003 }).ball(x, 1.36, -0.2, 0.04, '#2b2830', { ink: 0.003 }); }
    for (let i = 0; i < 5; i++) { const x = -L / 2 + 1.8 + i * 0.55; k.cyl(x, 1.08, 0.12, 0.06, 0.14, '#e6a23a', { geo: GEO.cyl8, ink: 0.004 }).cyl(x, 1.22, 0.12, 0.065, 0.02, '#fffaf0', { geo: GEO.cyl8, ink: 0 }); }
    return { hw: L / 2 + 0.07, hd: 0.42, h: 1.1, look: null };
  }
  function schoolDesk(k, o, room) {
    const c = o.color || '#c8925a';
    k.box(0, 0.7, 0, 0.92, 0.05, 0.56, c, { rx: -0.08 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * 0.4, 0, sz * 0.22, 0.05, 0.68, 0.05, '#4a3a33', { ink: 0.004 });
    k.box(0, 0.74, 0.05, 0.28, 0.03, 0.2, pick(['#d9483b', '#3f6fb5', '#4f9a5a', '#f2c14e'], room.R), { ry: 0.2, ink: 0.004 });
    k.cyl(0.32, 0.73, -0.12, 0.012, 0.16, '#f2c14e', { rz: Math.PI / 2, geo: GEO.cyl6, ink: 0.003 });
    return { hw: 0.46, hd: 0.28, h: 0.75, look: null };
  }
  function teacherDesk(k, o, room) {
    const c = '#8a5f3e';
    k.post(0, 0, 0, 1.7, 0.78, 0.8, c).box(0, 0.8, 0, 1.8, 0.05, 0.9, shade(c, 1.12));
    k.box(0.45, 0.42, 0.405, 0.6, 0.5, 0.02, shade(c, 0.88), { ink: 0.004 });
    k.ball(-0.6, 0.9, 0.1, 0.07, '#e2453a', { ink: 0.004 }).add(GEO.ico0, -0.58, 0.98, 0.1, 0.03, 0.02, 0.02, '#5cb04c', { ink: 0 });
    booksRow(k, -0.25, 0.25, 0.825, -0.2, room.R, 0.2);
    tableLampAt(k, 0.62, 0.825, -0.2, room);
    return { hw: 0.9, hd: 0.45, h: 0.9, look: 'w.lamp', lookY: 1.6 };
  }
  function blackboard(k, o, room) {
    const w = o.w || 4.4, h = o.h || 1.7;
    k.box(0, 0, 0.02, w + 0.16, h + 0.16, 0.05, '#7a5236');
    k.add(GEO.plane, 0, 0, 0.05, w, h, 1, '#ffffff', { b: 'board' });
    k.box(0, -h / 2 - 0.1, 0.1, w * 0.8, 0.05, 0.14, '#7a5236', { ink: 0.005 });
    for (let i = 0; i < 4; i++) k.box(-0.8 + i * 0.25, -h / 2 - 0.06, 0.12, 0.1, 0.025, 0.025, i % 2 ? '#ffe9a8' : W8.white, { ry: 0.3 * i, ink: 0 });
    k.box(0.9, -h / 2 - 0.05, 0.12, 0.24, 0.06, 0.08, '#3a3040', { ink: 0.004 });
    return { look: null, read: 'blackboard', readR: 2.0, readAt: 1.6 };
  }
  function globe(k, o, room) {
    k.cyl(0, 0, 0, 0.16, 0.05, '#5e4130', { geo: GEO.cyl8 }).cyl(0, 0.05, 0, 0.025, 0.9, '#5e4130', { geo: GEO.cyl6, ink: 0.004 });
    k.ball(0, 1.18, 0, 0.26, '#4aa8d8', { ink: 0.008 });
    for (let i = 0; i < 6; i++) { const a = i * 1.1, b = (i % 3 - 1) * 0.5; k.add(GEO.ico0, Math.cos(a) * Math.cos(b) * 0.25, 1.18 + Math.sin(b) * 0.25, Math.sin(a) * Math.cos(b) * 0.25, 0.09, 0.06, 0.09, '#7fbf6a', { ink: 0 }); }
    k.add(GEO.thin, 0, 1.18, 0, 0.31, 0.31, 0.31, W8.brass, { ry: 0.5, ink: 0 });
    return { r: 0.22, h: 1.5, look: null };
  }
  function workbench(k, o, room) {
    const L = o.len || 2.2, c = '#8a5f3e', R = room.R;
    k.box(0, 0.86, 0, L, 0.08, 0.86, shade(c, 1.1));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.post(sx * (L / 2 - 0.1), 0, sz * 0.33, 0.1, 0.82, 0.1, c, { ink: 0.005 });
    k.box(0, 0.25, 0, L - 0.2, 0.05, 0.7, c, { ink: 0.005 });
    if (o.gears) {
      for (let i = 0; i < 7; i++) k.add(GEO.cyl8, -L / 2 + 0.3 + R() * (L - 0.6), 0.91, (R() - 0.5) * 0.6, 0.04 + R() * 0.05, 0.015, 0.04 + R() * 0.05, pick([W8.brass, '#c9783a', W8.steel], R), { ink: 0.003 });
      k.post(L / 2 - 0.35, 0.9, -0.25, 0.08, 0.5, 0.08, '#3a3040', { ink: 0.004 }).beam(L / 2 - 0.35, 1.4, -0.25, L / 2 - 0.6, 1.5, 0.05, 0.04, '#3a3040', { ink: 0.004 });
      k.add(GEO.thin, L / 2 - 0.62, 1.42, 0.08, 0.14, 0.14, 0.14, W8.brass, { rx: 1.2, ink: 0 }).add(GEO.cyl16, L / 2 - 0.62, 1.42, 0.08, 0.13, 0.01, 0.13, '#cfeef8', { rx: 1.2, b: 'glow' });
      cupOn(k, -L / 2 + 0.3, 0.9, 0.25, '#3f6fb5');
      room.feats.add('lamp'); room.feats.add('cup');
      return { hw: L / 2, hd: 0.45, h: 1.0, look: 'w.cup', lookY: 1.4 };
    }
    k.box(-L / 2 + 0.3, 0.98, 0.3, 0.2, 0.16, 0.14, '#3a3040', { ink: 0.005 }).box(0.3, 0.92, 0.1, 0.5, 0.04, 0.08, '#d8b080', { ry: 0.3, ink: 0.004 });
    k.box(-0.2, 0.92, -0.2, 0.06, 0.05, 0.36, '#5b3a22', { ry: 0.6, ink: 0.004 }).box(-0.05, 0.94, -0.15, 0.16, 0.04, 0.05, W8.steel, { ry: 0.6, ink: 0.003 });
    return { hw: L / 2, hd: 0.45, h: 1.0, look: null };
  }
  // a big gear on a wall (a bone turning about the wall's normal)
  function gear(room, k, x, y, r, speed, color) {
    const at = k.world(x, y, 0.08), rig = room.rig, b = rig.bone(null, [at.x, at.y, at.z], [0, k.rot, 0], undefined, k.wall);
    const c = color || '#c99a3e', n = Math.max(8, Math.round(r * 14));
    rig.part(b, PG.disc, c, null, [r, 0.08, r], [Math.PI / 2, 0, 0], 0.01);
    rig.part(b, PG.disc, shade(c, 0.75), [0, 0, 0.05], [r * 0.25, 0.08, r * 0.25], [Math.PI / 2, 0, 0], 0.006);
    for (let i = 0; i < n; i++) { const a = i / n * TAU; rig.part(b, PG.box, c, [Math.cos(a) * (r + 0.05), Math.sin(a) * (r + 0.05), 0], [0.11, 0.1, 0.08], [0, 0, a], 0.006); }
    for (let i = 0; i < 4; i++) rig.part(b, PG.box, shade(c, 0.85), [0, 0, 0.045], [0.06, r * 1.7, 0.02], [0, 0, i * Math.PI / 4], 0);
    room.spin.push({ b, speed });
  }
  function boat(k, o, room) {
    const L = 5.0, B = 1.7, wood = '#b98a55', R = room.R;
    for (const s of [-1, 1]) { k.post(s * 1.5, 0, 0, 0.12, 0.62, 1.4, '#7a5236'); k.beam(s * 1.5, 0, -0.6, s * 1.5, 0.62, 0, 0.08, '#7a5236'); k.beam(s * 1.5, 0, 0.6, s * 1.5, 0.62, 0, 0.08, '#7a5236'); }
    k.box(0, 0.68, 0, L, 0.14, 0.16, shade(wood, 0.8));
    for (let i = 0; i < 9; i++) {
      const x = -L / 2 + 0.4 + i * (L - 0.8) / 8, f = Math.sin((i + 0.5) / 9 * Math.PI), half = 0.25 + f * B / 2, h = 0.3 + f * 0.5;
      for (const s of [-1, 1]) k.beam(x, 0.72, 0, x, 0.72 + h, s * half, 0.07, wood, { t2: 0.06, ink: 0.005 });
    }
    for (let j = 0; j < 3; j++) for (const s of [-1, 1]) k.beam(-L / 2 + 0.6, 0.85 + j * 0.16, s * (0.3 + j * 0.18), L / 2 - 0.6 - j * 0.3, 0.85 + j * 0.16, s * (0.3 + j * 0.18), 0.05, j % 2 ? wood : shade(wood, 1.1), { t2: 0.16, ink: 0.004 });
    k.add(GEO.cone, L / 2 - 0.2, 1.0, 0, 0.18, 0.6, 0.12, shade(wood, 0.8), { rz: -Math.PI / 2 });
    void R;
    return { hw: L / 2 + 0.1, hd: B / 2 + 0.2, h: 1.6, look: null };
  }
  function millstones(k, o, room) {
    k.cyl(0, 0, 0, 1.45, 0.45, '#8a5f3e', { geo: GEO.cyl16 });
    k.cyl(0, 0.45, 0, 0.95, 0.22, '#aaa397', { geo: GEO.cyl16 }).cyl(0, 0.67, 0, 0.9, 0.2, '#b8b1a3', { geo: GEO.cyl16 });
    k.add(GEO.cone, 0, 1.55, 0, 0.55, 0.7, 0.55, '#a8703f', { rx: Math.PI });
    k.beam(-0.4, 0.87, 0.4, -0.5, 1.6, 0.5, 0.06, '#7a5236'); k.beam(0.4, 0.87, -0.4, 0.5, 1.6, -0.5, 0.06, '#7a5236');
    for (let i = 0; i < 5; i++) k.box(Math.cos(i) * 1.1, 0.46, Math.sin(i) * 1.1, 0.3, 0.01, 0.2, '#fbf8f0', { ry: i, ink: 0 });
    return { r: 1.5, h: 1.9, look: 'w.stone', lookY: 1.2, lookR: 1.5 };
  }

  // ============================================================ a room: its shell, where things go, and its people
  const STYLE = {
    alba: { fog: '#2a2230', wall: null, floor: 'planks', song: 'village' },
    molinar: { fog: '#2b2019', wall: 'plaster', floor: 'terracotta', song: 'molinar' },
    lake: { fog: '#1e2a33', wall: 'boards', floor: 'lake', song: 'lake' },
  };
  const FABRIC = ['#e86a7a', '#5aa0d8', '#f2c14e', '#7fbf6a', '#b98ad8', '#f29a5a', '#4fb3a9', '#d9534f'];
  function paletteOf(door, R) {
    const c = door.colors || {}, fab = shuffle(FABRIC.slice(), R);
    if (door.style === 'alba') {
      const base = c.wall || pick(['#f6ead6', '#f3e1c4', '#f4d8c8', '#ece4f3', '#dcecd8', '#f8e6ae', '#e7eef4'], R);
      const acc = c.shutter || pick(['#4f8a4a', '#3e7fb0', '#b84a3a', '#2f6f6a', '#8a5ab0', '#d9a03a'], R);
      return { paper: mix(base, '#ffffff', 0.2), wains: mix(acc, '#ffffff', 0.35), trim: '#fdf8ee', cap: mix(base, '#e8dccc', 0.4), wood: pick(['#c8925a', '#b98552', '#d0a06a'], R),
        door: c.door || '#8d5733', shutter: acc, rim: pick(['#3f6fb5', '#d9483b', '#4f9a5a'], R), fab, pattern: pick(['stripes', 'flowers', 'dots', 'diamonds', 'vines'], R), floor: pick(['planks', 'planks', 'checkTeal', 'checkRose'], R) };
    }
    if (door.style === 'molinar') {
      const band = c.band || pick(['#3f6fb5', '#d9a03a', '#c0563c', '#4f8a4a', '#5a86b8'], R);
      return { paper: '#fbf8f1', wains: band, trim: '#5e4130', cap: '#5e4130', wood: pick(['#7a5236', '#8a5f3e', '#6b4a33'], R), door: c.door || '#8d5733', shutter: c.shutter || band, rim: '#3f6fb5', fab, pattern: 'plaster', floor: 'terracotta', band };
    }
    const wall = c.wall || pick(['#7f97a6', '#9fb4b0', '#b9a58a', '#8ea0b4', '#c9b9a0'], R);
    return { paper: mix(wall, '#ffffff', 0.35), wains: shade(wall, 0.8), trim: '#f4efe4', cap: '#f4efe4', wood: '#9a7a5a', door: c.door || '#2f8f8a', shutter: c.shutter || '#f2c94c', rim: '#d9483b', fab, pattern: 'boards', floor: 'lake' };
  }
  // Sizes (playtest 4: compact, and full). Homes: their theme's size (S 8 × 6.5, M 9 × 7, L 10 × 7.5), the room upstairs
  // 7.5 × 6, a back room 7 × 5.5. The special buildings shrank too (they were 14–16 wide): each is laid out for its size.
  const SIZES = { S: [8, 6.5], M: [9, 7], L: [10, 7.5], XL: [10.5, 8] }, UP_SIZE = [7.5, 6], BACK_SIZE = [7, 5.5];
  function specOf(door, floor, R) {
    const k = door.kind, up = floor > 0, S = (W, D, WH, tpl) => ({ W, D, WH, tpl });
    if (k === 'bakery') return S(11.5, 8.5, 4.0, bakery);
    if (k === 'inn') return up ? S(10.5, 7.5, 3.8, guestRoom) : S(12.5, 9.5, 4.2, tavern);
    if (k === 'school') return S(12, 9, 4.2, classroom);
    if (k === 'clockmaker') return up ? S(10, 8, 5.4, workshop) : S(11, 8.5, 4.6, clockShop);
    if (k === 'millhouse') return S(10, 8.5, 5.0, millRoom);
    if (k === 'shed') return S(11.5, 8, 4.2, boatShed);
    if (k === 'noa') return S(9, 7.5, 3.8, noaRoom);
    // homes (houses, the farmhouse, Marina's): the profile's theme decides; a door with no profile gets the cozy one
    const prof = door._prof, th = THEMES[prof.theme] || THEMES.cozy || {};
    if (up) { const sz = door.second === 'back' ? BACK_SIZE : UP_SIZE; return S(sz[0], sz[1], 3.4, compactUp); }
    const sz = SIZES[prof.size || th.size || 'M'] || SIZES.M;
    return S(sz[0], sz[1], door.second === 'up' ? 3.75 : door.style === 'molinar' ? 3.7 : 3.5, compactGround);
  }
  // where a thing with depth d stands against wall w (1 N, 2 E, 3 S, 4 W), at t along it (x on N/S, z on E/W), facing into the room
  function wallAt(room, w, t, d = 0) {
    const { hw, hd } = room, e = d / 2 + 0.02;
    return w === 1 ? { x: t, z: -hd + e, rot: 0 } : w === 3 ? { x: t, z: hd - e, rot: Math.PI } : w === 2 ? { x: hw - e, z: t, rot: -Math.PI / 2 } : { x: -hw + e, z: t, rot: Math.PI / 2 };
  }
  const wallOf = (room, x, z) => { const { hw, hd } = room, d = [z + hd, hw - x, hd - z, x + hw], m = Math.min(...d); return m < 1.0 ? d.indexOf(m) + 1 : 0; };
  // a thing on the floor at (x, z), turned rot; o.fold: it stands against a wall and folds away with it
  function put(room, fn, x, z, rot = 0, o = {}) {
    const k = room.kit, wall = o.fold ? (typeof o.fold === 'number' ? o.fold : wallOf(room, x, z)) : 0;
    k.frame(x, 0, z, rot, wall);
    const m = fn(k, Object.assign({ wall: wall || wallOf(room, x, z) }, o), room) || {};
    m.x = x; m.z = z; m.rot = rot;
    if (m.solid !== false && o.solid !== false) {
      if (m.hw) room.solids.push({ obox: 1, x, z, hw: m.hw, hd: m.hd, rot });
      else if (m.r) room.solids.push({ x, z, r: m.r });
    }
    if (m.look && o.look !== false) addLook(room, m.look, x, z, rot, m);
    if (m.feat) room.feats.add(m.feat);
    (m.feats || []).forEach(f => room.feats.add(f));
    return m;
  }
  // a thing on wall w at t along it and height y (it folds away with the wall)
  function onWall(room, fn, w, t, y, o = {}) {
    const a = wallAt(room, w, t, 0), k = room.kit; k.frame(a.x, y, a.z, a.rot, w);
    const m = fn(k, Object.assign({ wall: w }, o), room) || {};
    if (m.look && o.look !== false) addLook(room, m.look, a.x, a.z, a.rot, Object.assign({}, m, { hd: 0, front: m.front || 1.0, lookY: y + (m.lookY || 0) }));
    if (m.read && room.reads) { const f = m.readAt || 1.2; room.reads.push({ cell: m.read, x: a.x + Math.sin(a.rot) * f, z: a.z + Math.cos(a.rot) * f, r: m.readR || 1.3 }); }
    if (m.feat) room.feats.add(m.feat);
    return m;
  }
  // a Look: where you stand to look (in front of it), and where its tag floats
  function addLook(room, id, x, z, rot, m) {
    const f = (m.hd || 0) + (m.front !== undefined ? m.front : 0.65);
    room.looks.push({ id, x: x + Math.sin(rot) * f, z: z + Math.cos(rot) * f, r: m.lookR || 1.25, ax: x, ay: m.lookY !== undefined ? m.lookY : (m.h || 1) + 0.3, az: z });
  }
  const spot = (room, type, x, z, yaw, o = {}) => { room.spots.push(Object.assign({ type, x, z, yaw }, o)); };
  // the shell: the floor, the four walls (planes facing in, textured, tinted), their trim and caps, and the solids that keep you in
  function shell(room) {
    const { W, D, WH, hw, hd, P } = room, st = room.door.style, k = room.kit;
    // the floor: a slab, its texture in world units
    const fk = room.floorKind, T = FLOORS[fk] || 2.4;
    const fg = new THREE.BoxGeometry(W, 0.5, D); fg.translate(0, -0.25, 0);
    { const p = fg.attributes.position, n = fg.attributes.normal, uv = fg.attributes.uv; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, x / T, -z / T); else if (Math.abs(n.getX(i)) > 0.5) uv.setXY(i, z / T, y / T); else uv.setXY(i, x / T, y / T); } }
    room.floorGeo = fg;
    // the walls: L → R as seen from inside, so each faces into the room
    const ends = [[[-hw, -hd], [hw, -hd]], [[hw, -hd], [hw, hd]], [[hw, hd], [-hw, hd]], [[-hw, hd], [-hw, -hd]]];
    const pos = [], nor = [], uv = [], NRM = [[0, 0, 1], [-1, 0, 0], [0, 0, -1], [1, 0, 0]], TW = 2;
    ends.forEach(([L, R2], i) => {
      const len = Math.hypot(R2[0] - L[0], R2[1] - L[1]);
      const v = [[L[0], 0, L[1], 0, 0], [R2[0], 0, R2[1], len / TW, 0], [R2[0], WH, R2[1], len / TW, WH / TW], [L[0], WH, L[1], 0, WH / TW]];
      for (const j of [0, 1, 2, 0, 2, 3]) { pos.push(v[j][0], v[j][1], v[j][2]); nor.push(...NRM[i]); uv.push(v[j][3], v[j][4]); }
    });
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); wg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    room.wallGeo = wg;
    // trim along each wall (each piece folds away with its wall)
    for (let w = 1; w <= 4; w++) {
      const len = w % 2 ? W : D, a = wallAt(room, w, 0, 0); k.frame(a.x, 0, a.z, a.rot, w);
      if (st === 'alba') {
        k.box(0, 0.5, 0.02, len, 1.0, 0.04, P.wains, { ink: 0, ns: 1 });
        for (let s = -len / 2 + 0.55; s < len / 2 - 0.3; s += 0.9) k.box(s + 0.2, 0.52, 0.045, 0.62, 0.62, 0.02, shade(P.wains, 0.9), { ink: 0, ns: 1 });
        k.box(0, 1.02, 0.05, len, 0.07, 0.08, P.trim, { ink: 0.006, ns: 1 }).box(0, 0.07, 0.04, len, 0.14, 0.06, shade(P.wains, 0.75), { ink: 0, ns: 1 });
        k.box(0, WH - 0.08, 0.05, len, 0.16, 0.08, P.trim, { ink: 0.006, ns: 1 });
      } else if (st === 'molinar') {
        k.box(0, 0.4, 0.015, len, 0.8, 0.03, P.band, { ink: 0, ns: 1 }).box(0, 0.82, 0.02, len, 0.05, 0.04, shade(P.band, 0.7), { ink: 0, ns: 1 });
        if (!(room.plainWalls || []).includes(w) && !room.prof) for (let s = -len / 2 + 2.4; s < len / 2 - 1.2; s += 2.8) k.post(s, 0, 0.07, 0.2, WH, 0.14, P.trim, { ink: 0.008, ns: 1 });     // (the compact homes keep their walls free for furniture)
        k.box(0, WH - 0.12, 0.09, len, 0.24, 0.18, P.trim, { ink: 0.008, ns: 1 });
      } else {
        k.box(0, 0.15, 0.03, len, 0.3, 0.06, shade(P.wains, 0.85), { ink: 0, ns: 1 }).box(0, WH - 0.08, 0.04, len, 0.16, 0.08, P.trim, { ink: 0.006, ns: 1 });
        for (let s = -len / 2 + 2.2; s < len / 2 - 1.0; s += 3.0) k.box(s, WH - 0.5, 0.06, 0.08, 0.6, 0.1, P.trim, { ink: 0.004, ns: 1 });
      }
      // the wall's cut edge on top (the dollhouse look), and its corner post
      k.box(0, WH + 0.06, -0.1, len + 0.4, 0.12, 0.3, P.cap, { ink: 0.012, ns: 1 });
      k.post(len / 2 - 0.08, 0, 0.0, st === 'molinar' ? 0.26 : 0.14, WH, st === 'molinar' ? 0.26 : 0.14, st === 'alba' ? P.trim : P.cap, { ink: 0.006, ns: 1 });
    }
    // the walls as solids, the floor as a platform
    room.solids.push({ obox: 1, x: 0, z: -hd - 0.3, hw: hw + 0.6, hd: 0.35, rot: 0 }, { obox: 1, x: 0, z: hd + 0.3, hw: hw + 0.6, hd: 0.35, rot: 0 },
      { obox: 1, x: -hw - 0.3, z: 0, hw: 0.35, hd: hd + 0.6, rot: 0 }, { obox: 1, x: hw + 0.3, z: 0, hw: 0.35, hd: hd + 0.6, rot: 0 });
  }
  // the way in (south wall): the door, a mat, the prompt to leave and where you appear
  function entrance(room, x = 0, o = {}) {
    const { hd } = room;
    onWall(room, frontDoor, 3, x, 0, o);
    room.exits.push({ x, z: hd - 0.75, r: 1.15, label: o.label || 'Leave', go: o.go || 'out' });
    room.spawns[o.spawn || 'out'] = { x, z: hd - 1.95, yaw: Math.PI };
    room.curios.push({ id: 'w.door', x, z: hd - 0.3 });
    room.feats.add('door');
  }
  // sunny windows: shafts from the panes down to the floor (only where the sun can come in: the east and south walls)
  function shafts(room) {
    const out = [], tY = -RAY.y;
    for (const w of room.sunWindows) {
      const up = new THREE.Vector3(0, 1, 0), u = w.u.clone().normalize();
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => w.c.clone().addScaledVector(u, a * w.w / 2).addScaledVector(up, b * w.h / 2));
      const floor = corners.map(p => p.clone().addScaledVector(RAY, p.y / tY).setY(0.05));
      if (floor.some(p => Math.abs(p.x) > room.hw - 0.2 || Math.abs(p.z) > room.hd - 0.2)) continue;
      const TOP = [0.2, 0.17, 0.11], BOT = [0.04, 0.032, 0.02], FL = [0.13, 0.11, 0.07];
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; out.push({ p: [corners[i], corners[j], floor[j], floor[i]], c: [TOP, TOP, BOT, BOT], wall: w.wall }); }
      out.push({ p: floor, c: [FL, FL, FL, FL], wall: w.wall });
    }
    room.shafts = out;
  }

  // ------------------------------------------------------------ homes: profiles and themes (playtest 4)
  // INTERIORS.home(id, profile): who lives at a door and how it looks. profile: { theme, size?, label (en: "the painter’s
  // studio"), people: [person], pets: [pet], up: { people, pets } (the room upstairs or at the back), <lang>: { …overrides } }.
  // person: { id, name, role (grandma grandpa woman man kid), look (makePerson's), at (a spot type, or a list, or
  // fn(state)), job, prop, propColor, lines: [{ en, es, pt, de, zh, ja }], when: fn(state) }.
  // pet: { id, kind (cat dog parrot canary turtle), name, color, pose, at, lines }.
  // INTERIORS.theme(name, { size, label, ground(Z, room), up(Z, room) }): lays a room out in canonical coordinates (the
  // way up / to the back on the east wall's south half, the door in the middle of the south wall); Z mirrors it.
  const HOMES = {}, THEMES = {}, HOOKS = [];
  const GENERIC = { theme: 'cozy', generic: true };
  const HOME_KINDS = ['house', 'farmhouse', 'marina'];
  function profileOf(door) {
    const p = HOMES[door.id]; if (!p) return null;
    const o = p[langNow()]; return o ? Object.assign({}, p, o) : p;
  }
  // the zone helpers a theme draws with (canonical: +x is east; mirrored rooms flip x, east ↔ west, and turns)
  function zones(room) {
    const { hw, hd } = room, sx = room.sx;
    const W = w => (sx < 0 && (w === 2 || w === 4) ? 6 - w : w), X = x => sx * x, Y = r => (sx < 0 ? -r : r);
    const Z = {
      sx, hw, hd, room, R: room.R, P: room.P, WH: room.WH, F: FURN,
      second: room.floor === 0 ? room.door.second : null, back: room.floor > 0 && room.door.second === 'back',
      put(fn, x, z, rot = 0, o = {}) { return put(room, fn, X(x), z, Y(rot), o); },
      N(fn, x, d = 0.5, o = {}) { return put(room, fn, X(x), -hd + d / 2 + 0.03, 0, Object.assign({ fold: 1 }, o)); },
      S(fn, x, d = 0.5, o = {}) { return put(room, fn, X(x), hd - d / 2 - 0.03, Math.PI, Object.assign({ fold: 3 }, o)); },
      E(fn, z, d = 0.5, o = {}) { return put(room, fn, X(hw - d / 2 - 0.03), z, Y(-Math.PI / 2), Object.assign({ fold: W(2) }, o)); },
      W(fn, z, d = 0.5, o = {}) { return put(room, fn, X(-hw + d / 2 + 0.03), z, Y(Math.PI / 2), Object.assign({ fold: W(4) }, o)); },
      wall(w, t, y, fn, o = {}) { return onWall(room, fn, W(w), w === 1 || w === 3 ? X(t) : t, y, o); },
      spot(type, x, z, yaw, o = {}) { const q = Object.assign({}, o); delete q.type; delete q.yaw; delete q.dx; delete q.dz; spot(room, type, X(x), z, Y(yaw), q); },
      lamp(x, z, y = 2.6, color, o = {}) { hangLamp(room, X(x), z, Math.min(y, room.WH - 0.5), color, o.look ? Object.assign({}, o, { look: { x: X(o.look.x), z: o.look.z } }) : o); },
      at(x, z, rot = 0, wall = 0, y = 0) { return room.kit.frame(X(x), y, z, Y(rot), wall ? W(wall) : 0); },
      solid(x, z, r) { room.solids.push({ x: X(x), z, r }); },
      box(x, z, bw, bd, rot = 0) { room.solids.push({ obox: 1, x: X(x), z, hw: bw, hd: bd, rot: Y(rot) }); },
      mark(name, x, z, y = 0) { room.marks[name] = { x: X(x), z, y }; },
      look(id, x, z, rot, m) { addLook(room, id, X(x), z, Y(rot), m); },
      curio(id, x, z) { room.curios.push({ id, x: X(x), z }); },
      anim(fn) { room.anims.push(fn); },
      rig: room.rig, bone(x, y, z, rot = 0, wall = 0) { return room.rig.bone(null, [X(x), y, z], [0, Y(rot), 0], 'YXZ', wall ? W(wall) : 0); },
      X, Y, Wm: W,
    };
    return Z;
  }
  // the ground floor of a home: the door, the way up or to the back (canonical east wall, south half), then the theme
  function compactGround(room) {
    const th = THEMES[room.prof.theme] || THEMES.cozy, Z = zones(room);
    entrance(room, 0);
    if (Z.second === 'up') stairsUp(room, Z.sx);
    else if (Z.second === 'back') {
      const w = Z.Wm(2), z = room.hd - 1.9, fx = Z.X(room.hw - 0.95);
      onWall(room, innerDoor, w, z, 0, { look: false });
      room.exits.push({ x: fx, z, r: 1.15, label: 'Go in', go: 'back' });
      room.spawns.front = { x: fx - Z.sx * 0.4, z, yaw: Z.sx < 0 ? Math.PI / 2 : -Math.PI / 2 };
      room.curios.push({ id: 'w.door', x: Z.X(room.hw - 0.2), z });
    }
    if (th.ground) th.ground(Z, room);
  }
  // the room upstairs (the stairs come up in the canonical south-west corner) or at the back (its door in the south wall)
  function compactUp(room) {
    const th = THEMES[room.prof.theme] || THEMES.cozy, Z = zones(room);
    if (Z.back) entrance(room, 0, { label: 'Go back', go: 'front', spawn: 'back' });
    else stairHole(room, -Z.sx);
    const up = th.up || (THEMES.cozy && THEMES.cozy.up);
    if (up) up(Z, room);
  }
  function home(id, prof) { HOMES[id] = prof; }
  function theme(name, def) { THEMES[name] = def; }
  function hook(h) { if (h && !HOOKS.includes(h)) HOOKS.push(h); }

  // ------------------------------------------------------------ the templates
  // (the old roomy homeGround / bedroom templates are gone: homes are laid out by their theme, interiors_themes.js)
  function bakery(room) {
    const { hw, hd, P } = room;
    entrance(room, 0);
    // (11.5 × 8.5: two ovens and a log pile, two bread racks, the sacks in the corner; the kneading table; two shop counters by the door)
    put(room, breadOven, -4.55, -hd + 0.82, 0, { fold: 1 }); put(room, breadOven, -1.85, -hd + 0.82, 0, { fold: 1 });
    { const k = room.kit; k.frame(-3.2, 0, -hd + 0.35, 0, 0); for (let i = 0; i < 9; i++) k.cyl((i % 3 - 1) * 0.13, 0.08 + Math.floor(i / 3) * 0.15, 0, 0.07, 0.5, '#7a5236', { rx: Math.PI / 2, geo: GEO.cyl8, ink: 0.004 }); }
    put(room, breadRack, 0.4, -hd + 0.3, 0, { w: 2.0, fold: 1 }); put(room, breadRack, 2.55, -hd + 0.3, 0, { w: 2.0, fold: 1 });
    put(room, sacks, hw - 1.05, -hd + 0.6, 0, { n: 5 });
    put(room, table, -2.0, -0.7, 0, { w: 2.3, d: 1.1, flour: true });
    put(room, shopCounter, -3.1, 1.75, 0, { len: 3.6, goods: 'bread', till: true }); put(room, shopCounter, 3.1, 1.75, 0, { len: 3.6, goods: 'bread' });
    hangLamp(room, -3.1, 1.75, 2.7, '#d0663f'); hangLamp(room, 3.1, 1.75, 2.7, '#d0663f'); hangLamp(room, -2.0, -0.7, 2.7, '#d0663f');
    onWall(room, picture, 3, -2.7, 1.9, { cell: 'bakeboard', w: 1.0, h: 1.0, frame: '#7a5236' });
    onWall(room, windowItem, 2, 0.4, 2.2, { sun: true }); onWall(room, windowItem, 4, 0.4, 2.2, {});
    onWall(room, windowItem, 3, 3.1, 2.1, { sun: true, w: 1.3 });
    onWall(room, clockItem, 4, -2.3, 2.7, { r: 0.28 });
    onWall(room, wallShelf, 2, -2.2, 1.6, { len: 1.2, what: 'jars', levels: 2 });
    put(room, plantItem, -hw + 0.5, hd - 0.55, 0, { tall: true }); put(room, plantItem, hw - 0.5, hd - 0.55, 0, {});
    put(room, roundRug, 0, 3.0, 0, { r: 0.9 });
    // the baker kneads behind the table; a customer waits at the counter
    const baker = room.door.town === 'molinar' ? { name: 'Encarna', look: { skin: '#e6b48c', hair: '#3a2b26', hairdo: 'bun', dress: '#f2e6d0', apron: '#ffffff', hat: 'chef', w: 1.1 } }
      : { name: 'Lidia', look: { skin: '#f0c7a0', hair: '#c98a4a', hairdo: 'pony', dress: '#f2e6d0', apron: '#ffffff', hat: 'chef' } };
    room.cast.push({ role: 'woman', name: baker.name, pid: 'baker', look: baker.look, at: { x: -2.0, z: -1.65, yaw: 0 }, job: 'knead', lines: [SAY.bakeOven, SAY.bakeFlour, SAY.bakeEarly] });
    room.cast.push({ role: room.door.town === 'molinar' ? 'kid' : 'man', name: room.door.town === 'molinar' ? 'Paz' : 'Gonzalo', at: { x: -2.6, z: 2.7, yaw: Math.PI }, job: 'stand', lines: [SAY.bakeBuy] });
    if (room.door.town === 'molinar') room.cast.push({ role: 'cat', name: 'Canela', at: { x: hw - 1.05, z: -hd + 0.6, yaw: -0.4, y: 0.9 }, pose: 'sleep' });
  }
  function tavern(room) {
    const { hw, hd, R, P } = room;
    entrance(room, 0);
    // (12.5 × 9.5: the counter along the back, the fire on the east wall, three round tables, the stairs up the west wall)
    put(room, bar, -2.9, -hd + 1.6, 0, { len: 4.6 });
    onWall(room, wallShelf, 1, -4.1, 1.5, { len: 1.6, what: 'jars', levels: 2 }); onWall(room, wallShelf, 1, -1.8, 1.5, { len: 1.6, what: 'mugs', levels: 2 });
    { const k = room.kit; k.frame(-hw + 0.7, 0, -hd + 0.7, 0, 0); k.post(0, 0, 0, 0.9, 0.3, 1.0, '#5e4130'); barrelAt(k, 0, 0.3, -0.2, 0.75, true); barrelAt(k, 0, 0.3, 0.3, 0.75, true); room.solids.push({ obox: 1, x: -hw + 0.7, z: -hd + 0.7, hw: 0.5, hd: 0.55, rot: 0 }); }
    onWall(room, picture, 1, 0.9, 2.0, { cell: 'menu', w: 0.9, h: 0.9, frame: '#7a5236' });
    // the fire on the east wall: a rug, two armchairs
    put(room, fireplace, hw - 0.5, -1.6, -Math.PI / 2, { fold: 2 });
    put(room, roundRug, hw - 2.3, -1.6, 0, { r: 1.2 });
    put(room, armchair, hw - 2.5, -2.85, Math.PI * 0.35, { color: '#b84a3a' }); put(room, armchair, hw - 2.5, -0.35, Math.PI * 0.65, { color: '#3f6fb5' });
    put(room, sideTable, hw - 1.25, 0.6, 0, {});
    // tables
    const T = [[-3.3, 0.9], [-0.6, -0.5], [2.9, 2.9]];
    const seats = [];
    T.forEach(([x, z], i) => {
      put(room, table, x, z, 0, { round: true, w: 1.25, cloth: i % 2 ? '#fdf8ee' : '#e86a7a', look: i === 0 ? 'w.table' : null });
      for (let j = 0; j < 3; j++) { const a = j / 3 * TAU + 0.5 + i, cx = x + Math.cos(a) * 1.0, cz = z + Math.sin(a) * 1.0, yaw = Math.atan2(x - cx, z - cz); const m = put(room, chair, cx, cz, yaw, { color: '#8a5f3e', look: i === 2 && j === 0 ? 'w.chair' : null }); seats.push({ x: cx, z: cz, yaw, seat: m.seat, t: i }); }
      hangLamp(room, x, z, 2.8, '#e6a23a');
    });
    hangLamp(room, -2.9, -hd + 1.6, 2.9, '#e6a23a');
    stairsUp(room, -1);
    onWall(room, windowItem, 2, 2.6, 2.2, { sun: true }); onWall(room, windowItem, 3, -3.0, 2.2, { sun: true }); onWall(room, windowItem, 3, 3.4, 2.2, { sun: true });
    onWall(room, clockItem, 3, 1.5, 2.8, { shape: 'cuckoo', r: 0.22 });
    onWall(room, picture, 4, -3.2, 2.4, { cell: 'hills', w: 1.0, h: 0.75 });
    put(room, plantItem, hw - 0.5, hd - 0.55, 0, { tall: true }); put(room, plantItem, -1.6, hd - 0.5, 0, {});
    // the innkeeper wipes the bar; guests: one eating, one reading by the fire, a traveler
    const town = room.door.town;
    room.cast.push({ role: town === 'molinar' ? 'man' : 'woman', name: town === 'molinar' ? 'Bernardo' : 'Marisa', at: { x: -2.4, z: -hd + 0.8, yaw: 0 }, job: 'wipe', prop: 'cloth', lines: [SAY.innTable, SAY.innSoup] });
    const s1 = seats.find(s => s.t === 0), s2 = seats.find(s => s.t === 2);
    room.cast.push({ role: 'grandpa', at: { x: s1.x, z: s1.z, yaw: s1.yaw, sit: 1, y: s1.seat }, job: 'sit', lines: [SAY.innSoup] });
    room.cast.push({ role: 'woman', name: town === 'molinar' ? 'Ximena' : 'Adela', at: { x: s2.x, z: s2.z, yaw: s2.yaw, sit: 1, y: s2.seat }, job: 'sit', prop: 'pack', lines: [SAY.innTrain, SAY.innUp] });
    room.cast.push({ role: 'grandma', at: { x: hw - 2.5, z: -2.85, yaw: Math.PI * 0.35, sit: 1, y: 0.56 }, job: 'read', prop: 'book', lines: null });
    void R; void P;
  }
  function guestRoom(room) {
    const { hw, hd, P } = room;
    // (10.5 × 7.5: three guest beds, a chest at the foot of each, a washstand, the stairs coming up in a corner)
    [-3.4, 0.0, 3.4].forEach((x, i) => {
      put(room, bed, x, -hd + 1.07, 0, { w: 1.05, quilt: P.fab[i], wood: P.wood, head: 0.95, look: i === 1 ? 'w.bed' : undefined });
      { const k = room.kit; k.frame(x, 0, -hd + 2.5, 0, 0); k.post(0, 0, 0, 0.9, 0.45, 0.5, shade(P.wood, 0.9)).box(0, 0.47, 0, 0.94, 0.05, 0.54, P.wood); room.solids.push({ obox: 1, x, z: -hd + 2.5, hw: 0.47, hd: 0.27, rot: 0 }); }
    });
    for (const x of [-1.7, 1.7]) put(room, nightstand, x, -hd + 0.27, 0, {});
    for (const x of [-1.7, 1.7]) onWall(room, windowItem, 1, x, 2.4, { w: 0.8, h: 0.75, curtains: true });
    { const k = room.kit; k.frame(hw - 0.35, 0, 0.9, -Math.PI / 2, 0); k.post(0, 0, 0, 1.0, 0.8, 0.5, P.wood).cyl(0, 0.82, 0, 0.3, 0.14, '#fdf8ee', { geo: GEO.bowl }).cyl(0.3, 0.82, -0.1, 0.1, 0.3, '#5aa0d8', { geo: GEO.taper }); room.solids.push({ obox: 1, x: hw - 0.35, z: 0.9, hw: 0.28, hd: 0.52, rot: 0 }); }
    onWall(room, windowItem, 2, -1.4, 2.2, { sun: true });
    put(room, rectRug, 0.4, 0.9, 0, { w: 4.6, d: 1.4 });
    put(room, plantItem, hw - 0.5, hd - 0.55, 0, { tall: true });
    onWall(room, picture, 3, 1.4, 2.1, { cell: 'lake', w: 0.8, h: 0.6 });
    put(room, coatRack, 2.6, hd - 0.4, 0, {});
    stairHole(room, -1);
    room.cast.push({ role: 'man', name: room.door.town === 'molinar' ? 'Hernán' : 'Lorenzo', at: { x: 0.6, z: -hd + 2.0, yaw: Math.PI, sit: 1, y: 0.5 }, job: 'sit', prop: 'pack', lines: [SAY.innBeds, SAY.innTrain] });
  }
  function classroom(room) {
    const { hw, hd, R, P } = room;
    entrance(room, 0);
    // (12 × 9: the blackboard, the teacher's desk and the globe, eight desks either side of an aisle, a reading corner)
    onWall(room, blackboard, 1, 0.6, 1.95, { w: 3.8, h: 1.55 });
    onWall(room, clockItem, 1, 0.6, 3.45, { r: 0.24, shape: 'round' });
    put(room, teacherDesk, -3.5, -hd + 1.7, 0, {});
    put(room, globe, -5.2, -hd + 1.1, 0, {});
    const desks = [];
    for (const x of [-4.1, -1.8, 1.8, 4.1]) for (const z of [-0.4, 1.6]) { put(room, schoolDesk, x, z, 0, { color: P.wood }); const m = put(room, chair, x, z + 0.62, Math.PI, { color: pick(['#3f6fb5', '#d9483b', '#4f9a5a', '#f2c14e'], R), look: x === 1.8 && z === -0.4 ? 'w.chair' : null }); desks.push({ x, z: z + 0.62, seat: m.seat }); }
    onWall(room, windowItem, 2, -1.8, 2.2, { sun: true }); onWall(room, windowItem, 2, 1.6, 2.2, { sun: true });
    onWall(room, windowItem, 4, 2.4, 2.2, {}); onWall(room, windowItem, 3, -3.6, 2.2, { sun: true }); onWall(room, windowItem, 3, 3.6, 2.2, { sun: true });
    onWall(room, picture, 4, -1.5, 2.3, { cell: 'abc', w: 1.0, h: 1.0, frame: '#3f6fb5' }); onWall(room, picture, 4, -3.4, 2.4, { cell: 'map', w: 0.9, h: 0.9 });
    put(room, bookcase, -hw + 0.2, 0.5, Math.PI / 2, { w: 1.2, h: 1.5, fold: 4 });
    // the reading corner: a rug, cushions, a little shelf
    put(room, roundRug, hw - 1.4, hd - 1.4, 0, { r: 1.0 });
    { const k = room.kit; for (let i = 0; i < 3; i++) { k.frame(hw - 1.4 + Math.cos(i * 2.1) * 0.6, 0, hd - 1.4 + Math.sin(i * 2.1) * 0.6, 0, 0); k.ball(0, 0.12, 0, 0.28, P.fab[i], { ry2: 0.12 }); } }
    { const k = room.kit; k.frame(-hw + 1.6, 0, hd - 0.3, Math.PI, 3); for (let i = 0; i < 6; i++) { k.post(-1.2 + i * 0.48, 0, 0, 0.44, 0.9, 0.36, P.wood, { ink: 0.005 }); k.box(-1.2 + i * 0.48, 0.5, 0.1, 0.3, 0.3, 0.2, pick(FABRIC, R), { ink: 0.005 }); } room.solids.push({ obox: 1, x: -hw + 1.6, z: hd - 0.3, hw: 1.45, hd: 0.2, rot: 0 }); }
    put(room, plantItem, hw - 0.5, -hd + 0.55, 0, { tall: true });
    put(room, coatRack, 1.5, hd - 0.4, 0, {});
    // the teacher points at the board; four kids at their desks
    room.cast.push({ role: 'woman', name: 'Irene', look: { skin: '#e6b48c', hair: '#4a2f27', hairdo: 'bun', dress: '#4f9a5a', glasses: true }, at: { x: 3.0, z: -hd + 1.0, yaw: -0.25 }, job: 'point', prop: 'chalk', lines: [SAY.teachWords, SAY.teachHush] });
    const kids = shuffle(desks.slice(), R).slice(0, 4), lines = [[SAY.kidDesk], [SAY.kidBoard], [SAY.kidRecess], [SAY.kidDesk, SAY.kidRecess]];
    kids.forEach((d, i) => room.cast.push({ role: 'kid', at: { x: d.x, z: d.z, yaw: Math.PI, sit: 1, y: d.seat }, job: 'desk', lines: lines[i] }));
  }
  function clockShop(room) {
    const { hw, hd, R } = room;
    entrance(room, 0);
    // (11 × 8.5: the workbench, two grandfather clocks, the watch counter, the stairs up the east wall, clocks everywhere)
    put(room, workbench, -1.2, -hd + 1.85, 0, { len: 2.2, gears: true });
    put(room, grandClock, -hw + 0.45, -hd + 0.3, 0, { fold: 1 }); put(room, grandClock, 1.6, hd - 0.3, Math.PI, { fold: 3 });
    put(room, shopCounter, -3.3, 1.3, 0, { len: 2.6, goods: 'watches', till: true });
    stairsUp(room, 1);
    // clocks everywhere
    const N = [[-4.4, 2.3, 0.3], [-3.1, 3.3, 0.22], [0.5, 3.1, 0.32], [1.7, 2.2, 0.24], [2.8, 3.4, 0.2], [3.8, 2.4, 0.28], [4.9, 3.4, 0.2]];
    N.forEach(([x, y, r], i) => onWall(room, clockItem, 1, x, y, { r, pendulum: i % 3 === 1, shape: i === 4 ? 'cuckoo' : undefined, look: i === 2 ? undefined : false }));
    [[-3.0, 2.6, 0.26], [-1.2, 3.4, 0.2], [0.8, 3.0, 0.28]].forEach(([z, y, r]) => onWall(room, clockItem, 4, z, y, { r, look: false }));
    [[-3.0, 2.6, 0.24], [-1.7, 3.4, 0.18]].forEach(([z, y, r]) => onWall(room, clockItem, 2, z, y, { r, look: false }));
    [[-3.2, 2.8, 0.24], [3.4, 2.7, 0.28]].forEach(([x, y, r]) => onWall(room, clockItem, 3, x, y, { r, shape: x > 0 ? 'cuckoo' : undefined, look: false }));
    onWall(room, wallShelf, 4, 2.3, 1.5, { len: 1.4, what: 'clocks', levels: 2 });
    onWall(room, wallShelf, 1, 3.4, 1.2, { len: 1.4, what: 'books', look: true });
    onWall(room, windowItem, 4, -1.0, 1.6, { w: 0.9, h: 0.8 }); onWall(room, windowItem, 3, -1.5, 1.6, { sun: true, w: 0.9, h: 0.8 });
    hangLamp(room, -1.2, -hd + 1.85, 2.9, '#3a5a7a'); hangLamp(room, -3.3, 1.3, 3.0, '#3a5a7a');
    put(room, rectRug, 1.9, 0.4, 0.2, { w: 2.2, d: 1.5 });
    room.cast.push({ role: 'kid', name: 'Alma', pid: 'alma', look: { skin: '#c98e62', hair: '#2e2420', hairdo: 'pony', dress: '#5a4a7a', apron: '#8a5f3e', loupe: true, h: 0.8 }, at: { x: -1.2, z: -hd + 1.0, yaw: 0 }, job: 'tinker', prop: 'tool', lines: [SAY.clockHelp, SAY.clockTick, SAY.clockTower] });
    room.cast.push({ role: 'cat', name: 'Tic', at: { x: -4.2, z: 1.25, yaw: 0.5, y: 1.1 }, pose: 'sleep' });
    void R;
  }
  function workshop(room) {
    const { hw, hd, R } = room, k = room.kit;
    // the back of the big clock on the gable: its dial seen from inside, the axle, the gear train
    k.frame(0, 3.2, -hd, 0, 1);
    k.add(GEO.cyl24, 0, 0, 0.03, 1.55, 0.06, 1.55, '#e8dcc0', { rx: Math.PI / 2 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; k.box(Math.sin(a) * 1.3, Math.cos(a) * 1.3, 0.07, 0.1, 0.22, 0.02, '#8a7a5a', { rz: -a, ink: 0 }); }
    k.cyl(0, 0, 0.0, 0.09, 0.6, '#5e4130', { rx: Math.PI / 2, geo: GEO.cyl8 });
    gear(room, k, -2.9, -1.1, 0.95, 0.35, '#c99a3e'); gear(room, k, -1.45, -0.55, 0.52, -0.64, '#c9783a'); gear(room, k, 2.6, -1.3, 0.75, -0.44, '#c99a3e'); gear(room, k, 3.75, 0.2, 0.45, 0.74, W8.steel);
    { const at = k.world(0, 0, 0.36), b = room.rig.bone(null, [at.x, at.y, at.z], [0, 0, 0], undefined, 1); room.rig.part(b, PG.box, '#2b2235', [0, 0.45, 0], [0.12, 1.0, 0.04], null, 0.01); room.spin.push({ b, speed: -0.05 }); }
    // the big pendulum, hung from a beam
    k.frame(0, 0, 0, 0, 0); k.box(0, 5.3, -hd + 1.2, room.W, 0.2, 0.24, '#5e4130', { wall: 1 });
    { const b = room.rig.bone(null, [0, 5.2, -hd + 1.2], [0, 0, 0]); room.rig.part(b, PG.box, W8.brass, [0, -1.8, 0], [0.06, 3.6, 0.05], null, 0.008); room.rig.part(b, PG.disc, W8.brass, [0, -3.7, 0], [0.38, 0.1, 0.38], [Math.PI / 2, 0, 0], 0.01); room.clocks.push({ pend: b, swing: 0.32, period: 2.6, phase: 0, big: true }); }
    put(room, workbench, -hw + 0.5, -0.8, Math.PI / 2, { len: 2.3 });
    onWall(room, wallShelf, 2, 0.2, 1.6, { len: 1.4, what: 'jars', levels: 2 });
    put(room, armchair, hw - 1.4, 1.9, -Math.PI * 0.75, { color: '#5a4a7a' }); put(room, sideTable, hw - 2.3, 2.7, 0, {});
    put(room, bed, hw - 1.07, -hd + 1.6, -Math.PI / 2, { w: 1.0, quilt: '#5a4a7a', wood: '#5e4130', head: 0.9 });
    onWall(room, windowItem, 2, 1.4, 2.2, { sun: true, w: 0.9 });
    put(room, rectRug, 0.4, 1.0, 0, { w: 2.4, d: 1.6 });
    stairHole(room, -1);
    room.cast.push({ role: 'cat', name: 'Tac', at: { x: 0.8, z: -hd + 3.4, yaw: Math.PI }, pose: 'sit', watch: true });
    void R;
  }
  function millRoom(room) {
    const { hw, hd, R, P } = room, k = room.kit;
    entrance(room, 0);
    put(room, millstones, 0, -1.0, 0, {});
    k.frame(0, 0, -1.0, 0, 0); k.cyl(0, 1.9, 0, 0.22, room.WH - 1.9, '#7a5236', { geo: GEO.cyl8 });
    { const b = room.rig.bone(null, [0, room.WH - 0.9, -1.0], [0, 0, 0]); room.rig.part(b, PG.disc, '#a8703f', null, [1.25, 0.14, 1.25], null, 0.012); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; room.rig.part(b, PG.box, '#8a5f3e', [Math.cos(a) * 1.25, 0.14, Math.sin(a) * 1.25], [0.1, 0.16, 0.12], [0, -a, 0], 0.006); } room.spin.push({ b, speed: 0.4, axis: 'y' }); }
    put(room, sacks, -hw + 0.9, -1.4, Math.PI / 2, { n: 6 }); put(room, sacks, -hw + 0.9, 1.2, Math.PI / 2, { n: 3 });
    put(room, bed, hw - 1.07, -hd + 1.2, -Math.PI / 2, { w: 1.0, quilt: P.fab[0], wood: P.wood, head: 0.9 });
    put(room, potStove, hw - 0.9, 0.9, -Math.PI / 2, { fold: 2 });
    put(room, table, 2.4, 2.5, 0, { w: 1.2, d: 0.8 }); put(room, chair, 2.4, 3.3, Math.PI, { color: P.wood });
    onWall(room, windowItem, 2, -1.2, 2.4, { round: true, w: 0.9, sun: true }); onWall(room, windowItem, 4, 2.6, 2.4, { round: true, w: 0.9 });
    { k.frame(0, 0, 0, 0, 1); k.beam(-3.0, 0, -hd + 0.25, -3.0, 4.2, -hd + 0.25, 0.08, '#7a5236'); k.beam(-2.4, 0, -hd + 0.25, -2.4, 4.2, -hd + 0.25, 0.08, '#7a5236'); for (let i = 0; i < 12; i++) k.box(-2.7, 0.3 + i * 0.33, -hd + 0.25, 0.6, 0.05, 0.06, '#8a5f3e', { ink: 0.004 }); }
    for (let i = 0; i < 6; i++) { k.frame(0, 0, 0, 0, 0); k.box(-2 + i * 0.8, 0.006, 0.6 + (i % 3) * 0.8, 0.5, 0.01, 0.4, '#fbf8f0', { ry: i, ink: 0 }); }
    hangLamp(room, 2.4, 2.5, 2.8, '#c9783a');
    onWall(room, picture, 3, -2.6, 2.2, { cell: 'mill', w: 0.8, h: 0.8 }); onWall(room, wallShelf, 2, 2.6, 1.7, { len: 1.2, what: 'jars' });
    put(room, plantItem, -hw + 0.5, hd - 0.55, 0, {});
    room.cast.push({ role: 'man', name: 'Ambrosio', look: { skin: '#efc29a', hair: '#d8d8d8', hairdo: 'bald', dress: '#efe6d2', apron: '#ffffff', legs: true, pants: '#6b5a4a', hat: 'flat', hatColor: '#d8d0c0', stache: true }, at: { x: -hw + 2.2, z: 0.2, yaw: Math.PI / 2 }, job: 'stand', lines: [SAY.millSails] });
    void R;
  }
  function boatShed(room) {
    const { hw, hd, R, P } = room, k = room.kit;
    entrance(room, 0);
    put(room, boat, 0.5, -1.0, 0, {});
    // a cot for whoever stays the night (Remanso has no inn: hearts.js puts its Rest prompt here)
    put(room, bed, -hw + 1.07, hd - 2.1, Math.PI / 2, { w: 1.0, quilt: P.fab[0], wood: P.wood, head: 0.9 });
    put(room, workbench, -hw + 0.5, -0.4, Math.PI / 2, { len: 2.6 });
    { k.frame(-hw, 1.9, -0.4, Math.PI / 2, 4); k.box(0, 0, 0.02, 2.4, 1.0, 0.04, '#c9a66b'); for (let i = 0; i < 6; i++) k.box(-1.0 + i * 0.4, (i % 2) * 0.2 - 0.1, 0.07, 0.06, 0.4, 0.04, i % 2 ? '#3a3040' : '#8a5f3e', { ink: 0.004 }); }
    for (let i = 0; i < 3; i++) { k.frame(0, 0, -hd, 0, 1); k.beam(-3.5 + i * 0.5, 0.5, 0.15, -3.2 + i * 0.5, 3.6, 0.15, 0.06, '#c9a66b'); k.add(GEO.ball, -3.2 + i * 0.5, 3.6, 0.15, 0.1, 0.32, 0.04, '#c9a66b'); }
    { k.frame(hw - 1.2, 0, -hd + 0.5, 0, 0); for (let i = 0; i < 6; i++) k.box(0, 0.06 + i * 0.1, 0, 2.2, 0.08, 0.3, i % 2 ? '#b98a55' : '#a8784a', { ink: 0.004 }); room.solids.push({ obox: 1, x: hw - 1.2, z: -hd + 0.5, hw: 1.1, hd: 0.2, rot: 0 }); }
    { k.frame(hw - 0.9, 0, hd - 1.6, 0, 0); for (let i = 0; i < 4; i++) k.add(GEO.torus, 0, 0.06 + i * 0.1, 0, 0.42 - i * 0.04, 0.42 - i * 0.04, 0.3, '#d8c08a', { rx: Math.PI / 2, ink: 0.004 }); room.solids.push({ x: hw - 0.9, z: hd - 1.6, r: 0.5 }); }
    for (let i = 0; i < 8; i++) { k.frame(0, 0, 0, 0, 0); k.box(-2 + R() * 4, 0.006, -1.0 + (R() - 0.5) * 3, 0.3 + R() * 0.4, 0.01, 0.2 + R() * 0.3, '#e8d4a8', { ry: R() * 3, ink: 0 }); }
    onWall(room, windowItem, 2, 0.6, 2.2, { sun: true }); onWall(room, windowItem, 3, -3.6, 2.1, { sun: true });
    onWall(room, picture, 1, 2.0, 2.4, { cell: 'blueprint', w: 1.1, h: 1.1, frame: '#c9a66b' });
    hangLamp(room, 0.5, -1.0, 3.0, '#d9483b');
    room.cast.push({ role: 'kid', name: 'Rodri', look: { skin: '#a8714a', hair: '#2e2420', dress: '#d9483b', apron: '#c9a66b', legs: true, pants: '#3f5f7a', h: 0.9 }, at: { x: 0.5, z: 0.35, yaw: Math.PI }, job: 'tinker', prop: 'tool', lines: [SAY.shedBoat] });
  }
  function noaRoom(room) {
    const { hw, hd, R, P } = room;
    entrance(room, 0);
    // Noa's desk under the north window: letters, a pen, a map pinned above with the tower circled
    put(room, table, -1.0, -hd + 0.5, 0, { w: 1.5, d: 0.7, items: false, look: null });
    { const k = room.kit; k.frame(-1.0, 0, -hd + 0.5, 0, 0); for (let i = 0; i < 5; i++) k.box(-0.5 + i * 0.22, 0.79 + i * 0.004, (i % 2) * 0.08, 0.26, 0.006, 0.18, i % 2 ? '#fdf8ee' : '#f3e4c4', { ry: (i - 2) * 0.25, ink: 0.003 }); k.cyl(0.5, 0.79, 0.1, 0.012, 0.18, '#3f6fb5', { rz: 1.2, geo: GEO.cyl6, ink: 0.003 }); }
    addLook(room, 'w.letter', -1.0, -hd + 0.5, 0, { hd: 0.4, front: 0.7, lookY: 1.2 });
    put(room, chair, -1.0, -hd + 1.25, Math.PI, { color: '#2f8f86' });
    onWall(room, picture, 1, -1.0, 2.25, { cell: 'map', w: 1.0, h: 1.0, frame: '#c9a66b' });
    onWall(room, windowItem, 1, 1.5, 2.3, { w: 1.0 });
    put(room, bed, -hw + 1.07, hd - 2.1, Math.PI / 2, { w: 1.1, quilt: '#2f8f86', patch: '#f2c14e', wood: P.wood });
    put(room, bookcase, hw - 0.22, -hd + 1.5, -Math.PI / 2, { w: 1.1, fold: 2 }); put(room, bookcase, hw - 0.22, -hd + 2.7, -Math.PI / 2, { w: 1.1, fold: 2 });
    { const k = room.kit; k.frame(hw - 1.3, 0, hd - 1.1, -0.6, 0); for (const a of [0, 2.1, 4.2]) k.beam(0, 0, 0, Math.cos(a) * 0.35, 1.2, Math.sin(a) * 0.35, 0.03, '#5e4130'); k.cyl(0, 1.3, 0, 0.07, 0.8, '#c99a3e', { rx: -1.1, geo: GEO.cyl8 }); room.solids.push({ x: hw - 1.3, z: hd - 1.1, r: 0.4 }); }
    put(room, roundRug, 0.5, 0.5, 0, { r: 1.1 });
    put(room, plantItem, -hw + 0.5, -hd + 0.55, 0, { tall: true });
    onWall(room, windowItem, 2, 1.4, 2.2, { sun: true }); onWall(room, windowItem, 3, -2.6, 2.1, { sun: true });
    onWall(room, picture, 4, -1.2, 2.2, { cell: 'family', w: 0.5, h: 0.6 });
    onWall(room, picture, 2, 2.8, 2.3, { cell: 'stars', w: 0.6, h: 0.6 });
    void R;
  }

  // ------------------------------------------------------------ who lives here (the homes): seeded by the door
  const NAMES = {
    grandma: ['Amparo', 'Consuelo', 'Pilar', 'Rosario', 'Mercedes', 'Josefa', 'Herminia', 'Felisa', 'Esperanza', 'Socorro', 'Remedios', 'Matilde'],
    grandpa: ['Anselmo', 'Eusebio', 'Fermín', 'Gregorio', 'Honorio', 'Isidro', 'Jacinto', 'Leandro', 'Matías', 'Severino', 'Tobías', 'Ulises'],
    woman: ['Irene', 'Luisa', 'Carla', 'Elsa', 'Nora', 'Alicia', 'Beatriz', 'Eva', 'Gloria', 'Julia', 'Lidia', 'Noemí', 'Olga', 'Raquel', 'Silvia', 'Yolanda', 'Daniela'],
    man: ['Óscar', 'Andrés', 'Raúl', 'Gael', 'Iván', 'Martín', 'Nicolás', 'Pablo', 'Ricardo', 'Samuel', 'Víctor', 'Alonso', 'César', 'Emilio', 'Jaime', 'Rodrigo'],
    kid: ['Lucía', 'Martina', 'Valentina', 'Diego', 'Camila', 'Iker', 'Gabi', 'Juanito', 'Manu', 'Sol', 'Pili', 'Nacho', 'Coco', 'Fede', 'Maite', 'Pipo', 'Rosita', 'Tomi'],
    cat: ['Michi', 'Pelusa', 'Luna', 'Bigotes', 'Canela', 'Tigre', 'Nube', 'Copito', 'Mango', 'Sombra'],
  };
  const GROUP = { grandma: 'elder', grandpa: 'elder', woman: 'adult', man: 'adult', kid: 'kid', cat: 'cat', dog: 'cat', parrot: 'cat', canary: 'cat', turtle: 'cat' };
  const PET_WORDS = new Set();          // (pets' names that are translated words, like the cats': not added to CJK's names)
  const TITLE = { grandma: { es: 'Doña', pt: 'Dona', de: 'Oma' }, grandpa: { es: 'Don', pt: 'Seu', de: 'Opa' } };
  // zh / ja: the same people, their names said the zh / ja way (CJK.md's table; the cats' names are translated, like
  // townlife's Michi → 橘子 / ミカン). Grandmas and grandpas get 奶奶 / 爷爷 or さん after the name, like Doña Rosa.
  const TITLE_CJ = { grandma: { zh: '[奶奶|nǎi nai]', ja: 'さん' }, grandpa: { zh: '[爷爷|yé ye]', ja: 'さん' } };
  const NAME_CJ = {};
  [['Amparo', '[安帕罗|Ān pà luó]', 'アンパロ'], ['Consuelo', '[康苏埃洛|Kāng sū āi luò]', 'コンスエロ'], ['Pilar', '[皮拉尔|Pí lā ěr]', 'ピラール'], ['Rosario', '[罗萨里奥|Luó sà lǐ ào]', 'ロサリオ'],
    ['Mercedes', '[梅赛德斯|Méi sài dé sī]', 'メルセデス'], ['Josefa', '[何塞法|Hé sè fǎ]', 'ホセファ'], ['Herminia', '[埃尔米尼娅|Āi ěr mǐ ní yà]', 'エルミニア'], ['Felisa', '[费利萨|Fèi lì sà]', 'フェリサ'],
    ['Esperanza', '[埃斯佩兰萨|Āi sī pèi lán sà]', 'エスペランサ'], ['Socorro', '[索科罗|Suǒ kē luó]', 'ソコロ'], ['Remedios', '[雷梅迪奥斯|Léi méi dí ào sī]', 'レメディオス'], ['Matilde', '[玛蒂尔德|Mǎ dì ěr dé]', 'マティルデ'],
    ['Anselmo', '[安塞尔莫|Ān sài ěr mò]', 'アンセルモ'], ['Eusebio', '[欧塞维奥|Ōu sài wéi ào]', 'エウセビオ'], ['Fermín', '[费尔明|Fèi ěr míng]', 'フェルミン'], ['Gregorio', '[格雷戈里奥|Gé léi gē lǐ ào]', 'グレゴリオ'],
    ['Honorio', '[奥诺里奥|Ào nuò lǐ ào]', 'オノリオ'], ['Isidro', '[伊西德罗|Yī xī dé luó]', 'イシドロ'], ['Jacinto', '[哈辛托|Hā xīn tuō]', 'ハシント'], ['Leandro', '[莱安德罗|Lái ān dé luó]', 'レアンドロ'],
    ['Matías', '[马蒂亚斯|Mǎ dì yà sī]', 'マティアス'], ['Severino', '[塞韦里诺|Sài wéi lǐ nuò]', 'セベリーノ'], ['Tobías', '[托比亚斯|Tuō bǐ yà sī]', 'トビアス'], ['Ulises', '[乌利塞斯|Wū lì sài sī]', 'ウリセス'],
    ['Irene', '[伊雷内|Yī léi nèi]', 'イレネ'], ['Luisa', '[路易莎|Lù yì shā]', 'ルイサ'], ['Carla', '[卡拉|Kǎ lā]', 'カルラ'], ['Elsa', '[埃尔莎|Āi ěr shā]', 'エルサ'], ['Nora', '[诺拉|Nuò lā]', 'ノラ'],
    ['Alicia', '[艾丽西亚|Ài lì xī yà]', 'アリシア'], ['Beatriz', '[贝亚特丽斯|Bèi yà tè lì sī]', 'ベアトリス'], ['Eva', '[埃娃|Āi wá]', 'エバ'], ['Gloria', '[格洛丽亚|Gé luò lì yà]', 'グロリア'],
    ['Julia', '[胡利娅|Hú lì yà]', 'フリア'], ['Lidia', '[莉迪娅|Lì dí yà]', 'リディア'], ['Noemí', '[诺埃米|Nuò āi mǐ]', 'ノエミ'], ['Olga', '[奥尔加|Ào ěr jiā]', 'オルガ'], ['Raquel', '[拉克尔|Lā kè ěr]', 'ラケル'],
    ['Silvia', '[西尔维娅|Xī ěr wéi yà]', 'シルビア'], ['Yolanda', '[约兰达|Yuē lán dá]', 'ヨランダ'], ['Daniela', '[达妮埃拉|Dá nī āi lā]', 'ダニエラ'],
    ['Óscar', '[奥斯卡|Ào sī kǎ]', 'オスカル'], ['Andrés', '[安德烈斯|Ān dé liè sī]', 'アンドレス'], ['Raúl', '[劳尔|Láo ěr]', 'ラウル'], ['Gael', '[加埃尔|Jiā āi ěr]', 'ガエル'], ['Iván', '[伊万|Yī wàn]', 'イバン'],
    ['Martín', '[马丁|Mǎ dīng]', 'マルティン'], ['Nicolás', '[尼古拉斯|Ní gǔ lā sī]', 'ニコラス'], ['Pablo', '[巴勃罗|Bā bó luó]', 'パブロ'], ['Ricardo', '[里卡多|Lǐ kǎ duō]', 'リカルド'],
    ['Samuel', '[萨穆埃尔|Sà mù āi ěr]', 'サムエル'], ['Víctor', '[维克多|Wéi kè duō]', 'ビクトル'], ['Alonso', '[阿隆索|Ā lóng suǒ]', 'アロンソ'], ['César', '[塞萨尔|Sài sà ěr]', 'セサル'],
    ['Emilio', '[埃米利奥|Āi mǐ lì ào]', 'エミリオ'], ['Jaime', '[海梅|Hǎi méi]', 'ハイメ'], ['Rodrigo', '[罗德里戈|Luó dé lǐ gē]', 'ロドリゴ'],
    ['Lucía', '[露西娅|Lù xī yà]', 'ルシア'], ['Martina', '[玛蒂娜|Mǎ dì nà]', 'マルティナ'], ['Valentina', '[瓦伦蒂娜|Wǎ lún dì nà]', 'バレンティナ'], ['Diego', '[迭戈|Dié gē]', 'ディエゴ'],
    ['Camila', '[卡米拉|Kǎ mǐ lā]', 'カミラ'], ['Iker', '[伊克尔|Yī kè ěr]', 'イケル'], ['Gabi', '[加比|Jiā bǐ]', 'ガビ'], ['Juanito', '[胡安尼托|Hú ān ní tuō]', 'フアニート'], ['Manu', '[马努|Mǎ nǔ]', 'マヌ'],
    ['Sol', '[索尔|Suǒ ěr]', 'ソル'], ['Pili', '[皮莉|Pí lì]', 'ピリ'], ['Nacho', '[纳乔|Nà qiáo]', 'ナチョ'], ['Coco', '[可可|Kě kě]', 'ココ'], ['Fede', '[费德|Fèi dé]', 'フェデ'], ['Maite', '[迈特|Mài tè]', 'マイテ'],
    ['Pipo', '[皮波|Pí bō]', 'ピポ'], ['Rosita', '[罗西塔|Luó xī tǎ]', 'ロシータ'], ['Tomi', '[托米|Tuō mǐ]', 'トミ'],
    ['Encarna', '[恩卡尔纳|Ēn kǎ ěr nà]', 'エンカルナ'], ['Paz', '[帕斯|Pà sī]', 'パス'], ['Gonzalo', '[冈萨洛|Gāng sà luò]', 'ゴンサロ'], ['Bernardo', '[贝尔纳多|Bèi ěr nà duō]', 'ベルナルド'],
    ['Hernán', '[埃尔南|Āi ěr nán]', 'エルナン'], ['Lorenzo', '[洛伦索|Luò lún suǒ]', 'ロレンソ'], ['Marisa', '[玛丽莎|Mǎ lì shā]', 'マリサ'], ['Ximena', '[希梅娜|Xī méi nà]', 'ヒメナ'],
    ['Adela', '[阿德拉|Ā dé lā]', 'アデラ'], ['Alma', '[阿尔玛|Ā ěr mǎ]', 'アルマ'], ['Ambrosio', '[安布罗西奥|Ān bù luó xī ào]', 'アンブロシオ'], ['Rodri', '[罗德里|Luó dé lǐ]', 'ロドリ'],
    ['Michi', '[咪咪|Mī mi]', 'ミー'], ['Pelusa', '[毛球|Máo qiú]', 'モフ'], ['Luna', '[月亮|Yuè liang]', 'ルナ'], ['Bigotes', '[胡子|Hú zi]', 'ヒゲマル'], ['Canela', '[肉桂|Ròu guì]', 'シナモン'],
    ['Tigre', '[老虎|Lǎo hǔ]', 'トラ'], ['Nube', '[云朵|Yún duǒ]', 'ソラ'], ['Copito', '[雪花|Xuě huā]', 'ユキ'], ['Mango', '[芒果|Máng guǒ]', 'マンゴー'], ['Sombra', '[影子|Yǐng zi]', 'カゲ'],
  ].forEach(([es, zh, ja]) => { NAME_CJ[es] = { zh, ja }; });
  function household(door) {
    const R = rng(hash(door.id + ':who')), r = R();
    let m;
    if (door.blue) m = ['grandma', 'cat'];                 // Teo's grandma lives in the blue house (town.js)
    else {
      if (r < 0.13) m = [];
      else if (r < 0.39) m = [R() < 0.55 ? 'grandma' : 'grandpa'];
      else if (r < 0.62) m = [R() < 0.5 ? 'woman' : 'man', 'kid'];
      else if (r < 0.78) m = [R() < 0.5 ? 'grandma' : 'grandpa', 'kid'];
      else m = R() < 0.5 ? ['woman', 'man'] : [R() < 0.5 ? 'woman' : 'man', R() < 0.5 ? 'grandma' : 'grandpa'];
      if (R() < (m.length ? 0.4 : 0.6)) m.push('cat');
    }
    const used = new Set();
    return m.map(role => { let n = pick(NAMES[role], R); for (let i = 0; used.has(n) && i < 5; i++) n = pick(NAMES[role], R); used.add(n); return { role, name: n, seed: R() }; });
  }
  function lookOf(role, R) {
    const skin = pick(['#f5cda2', '#efc29a', '#e6b48c', '#c98e62', '#a8714a', '#f0c7a0', '#8a5a3c', '#dcae86'], R), hair = pick(['#2e2420', '#4a2f27', '#6b3b25', '#c98a4a', '#e0b060', '#3a2b26', '#8a4a2a'], R);
    switch (role) {
      case 'grandma': return { skin, hair: pick(['#f4f1ea', '#e0ddd6', '#d8d8d8', '#c9c4bb'], R), hairdo: 'bun', dress: pick(['#7a5ab0', '#5a7ab8', '#8a4f7d', '#4f8a7a', '#b8607a'], R), apron: R() < 0.5 ? '#fdf8ee' : null, glasses: R() < 0.55, h: 0.88, w: 1.05, eyes: R() < 0.3 ? 'happy' : null };
      case 'grandpa': return { skin, hair: pick(['#f4f1ea', '#d8d8d8', '#bdb8b0'], R), hairdo: 'bald', beard: R() < 0.4, stache: R() < 0.6, glasses: R() < 0.5, dress: pick(['#8a5f3e', '#5a6a8a', '#6b7a4a', '#7a4a4a'], R), legs: true, pants: pick(['#4a3a33', '#3a4466', '#5a5048'], R), hat: R() < 0.35 ? 'flat' : null, hatColor: '#6b5a4a', h: 0.95 };
      case 'woman': return { skin, hair, hairdo: pick(['long', 'pony', 'bun', 'curly', 'long'], R), dress: pick(['#e0743c', '#3f7fc9', '#d97aa0', '#4f9a5a', '#e6b84a', '#c9553f', '#3e8f8a'], R), apron: R() < 0.35 ? '#fdf8ee' : null, hat: R() < 0.15 ? 'scarf' : null, hatColor: pick(['#f2c14e', '#e86a7a', '#3f6fb5'], R) };
      case 'man': return { skin, hair, dress: pick(['#3f6f9a', '#8a5f3e', '#4f8a4a', '#c9553f', '#5a86b8', '#7a5ab0'], R), legs: true, pants: pick(['#3a4466', '#4a3a33', '#2f3440'], R), stache: R() < 0.4, beard: R() < 0.2, h: 1.04, w: 1.06, hat: R() < 0.2 ? 'cap' : null, hatColor: pick(['#2f4a7a', '#c9443a', '#4f8a4a'], R) };
      case 'kid': { const cap = R() < 0.35; return { skin, hair, hairdo: cap ? 'pony' : pick(['pigtails', 'pony', 'long', 'curly'], R), dress: pick(['#e86a9a', '#4f9a5a', '#f2c14e', '#3d7fd1', '#e0743c', '#9f6ad1'], R), legs: R() < 0.5, h: 0.74, hat: cap ? 'cap' : null, hatColor: pick(['#3d7fd1', '#e0503f', '#4f9a5a'], R), eyes: R() < 0.25 ? 'happy' : null }; }
      default: return null;
    }
  }
  const CAT_COLORS = ['#e8a050', '#8a8a96', '#3a3440', '#f4efe4', '#c98a4a', '#6b5a4a'];
  function linesFor(room, role, R, extra = []) {
    const g = GROUP[role], feats = room.feats, town = room.door.town, stilt = room.door.stilt;
    const ok = l => l.who.includes(g) && l.need.every(f => feats.has(f)) && (!l.town || l.town === town || (l.town === 'stilt' && stilt));
    const pool = POOL.filter(ok);
    const specific = shuffle(pool.filter(l => l.need.length || l.town), R), general = shuffle(pool.filter(l => !l.need.length && !l.town), R);
    const out = extra.filter(ok).concat(specific.slice(0, 1), general.slice(0, 1), specific.slice(1, 2));
    return out.filter((l, i) => out.indexOf(l) === i).slice(0, 2);
  }
  // put this floor's share of the household on the room's spots (homes), and everyone the template asked for
  // a profile's person or pet, on the first free spot of the type it wants (then any spot that fits, then the middle)
  const PET_KINDS = ['cat', 'dog', 'parrot', 'canary', 'turtle'];
  function castProfile(room, list) {
    const prof = room.prof, S = G && G.state ? G.state : {}, part = room.floor > 0 ? prof.up || {} : prof;
    const free = room.spots.slice();
    const take = types => { for (const t of types) { const i = free.findIndex(s => s.type === t); if (i >= 0) return free.splice(i, 1)[0]; } return null; };
    for (const c of (part.people || []).concat(part.pets || [])) {
      try { if (c.when && !c.when(S)) continue; } catch (e) { continue; }
      const pet = PET_KINDS.includes(c.kind);
      let want = c.at; try { if (typeof want === 'function') want = want(S); } catch (e) { want = null; }
      const s = take([].concat(want || [], pet ? (c.kind === 'cat' ? ['cat', 'pet', 'rug', 'floor'] : c.kind === 'dog' ? ['dog', 'pet', 'rug', 'floor'] : [c.kind, 'pet'])
        : c.role === 'kid' ? ['floor', 'bed', 'sit', 'stand'] : ['stand', 'sit', 'arm', 'floor'])) || { x: 0, z: 0.4, yaw: Math.PI, type: 'stand' };
      const sit = ['sit', 'rock', 'arm', 'bed', 'sofa', 'desk'].includes(s.type) || s.sit === 1 ? 1 : s.type === 'floor' || s.sit === 2 ? 2 : 0;
      let job = c.job, opt = c.opt, pose = c.pose; try { if (typeof job === 'function') job = job(S); if (typeof opt === 'function') opt = opt(S); if (typeof pose === 'function') pose = pose(S); } catch (e) { job = null; pose = null; }
      // (asleep in bed whatever else; then the person's own job, then the spot's, like the easel's 'paint')
      list.push({ role: pet ? c.kind : c.role, pet: pet ? c.kind : null, name: c.name, pid: c.id, look: c.look, color: c.color, pose: pose || s.pose, opt,
        at: { x: s.x, z: s.z, yaw: c.yaw !== undefined ? room.sx * c.yaw : s.yaw, sit: s.lie ? 0 : sit, y: s.seat || s.y || 0, bone: s.bone, lie: s.lie },
        job: (s.type === 'sleep' ? 'sleep' : null) || job || s.job || (s.type === 'rock' ? 'rock' : s.type === 'arm' ? 'read' : sit ? 'sit' : 'stand'), prop: s.type === 'sleep' ? null : c.prop || s.prop, propColor: c.propColor,
        lines: c.lines && c.lines.length ? c.lines : (pet ? [PET_LINES[c.kind] || PET_LINES.cat] : null), watch: c.watch });
    }
  }
  function castRoom(room) {
    const R = rng(hash(room.key + ':cast'));
    const list = room.cast.slice();          // (the special buildings' templates bring their own people)
    if (room.prof && !room.prof.generic) castProfile(room, list);
    else if (['house', 'farmhouse', 'marina'].includes(room.door.kind)) {
      const all = household(room.door), people = all.filter(m => m.role !== 'cat'), cat = all.find(m => m.role === 'cat');
      let mine = people;
      if (room.door.rooms > 1) {             // two rooms: a kid (or the second grown-up) is in the other one
        const kid = people.find(m => m.role === 'kid');
        if (room.floor > 0) mine = kid && people.length > 1 ? [kid] : people.length > 1 ? [people[1]] : [];
        else mine = kid && people.length > 1 ? people.filter(m => m !== kid) : people.length > 1 ? [people[0]] : people;
      }
      if (cat && (room.door.rooms === 1 || (room.floor === 0) === (rng(hash(room.door.id + ':cat'))() < 0.65))) mine = mine.concat([cat]);
      const prefs = { elder: ['rock', 'arm', 'sit', 'stand'], adult: ['stand', 'sit', 'arm'], kid: ['floor', 'bed', 'sit', 'stand'], cat: ['cat'] };
      const free = shuffle(room.spots.slice(), R);
      for (const m of mine) {
        const g = GROUP[m.role];
        let s = null; for (const t of prefs[g]) { s = free.find(q => q.type === t && !(g === 'kid' && q.job === 'cook')); if (s) break; }
        if (!s) continue;
        free.splice(free.indexOf(s), 1);
        const sit = ['sit', 'rock', 'arm', 'bed'].includes(s.type) ? 1 : s.type === 'floor' ? 2 : 0;
        const extra = [];
        if (room.door.blue && m.role === 'grandma') extra.push(SAY.teoGran);
        if (room.kitchenSide && g !== 'kid' && g !== 'cat' && R() < 0.5) extra.push(kitchenLine(room.kitchenSide > 0));
        if (room.lines) extra.push(...room.lines);
        list.push({ role: m.role, name: m.name, at: { x: s.x, z: s.z, yaw: s.yaw, sit, y: s.seat || s.y || 0, bone: s.bone }, job: s.job || (s.type === 'rock' ? 'rock' : s.type === 'arm' ? 'read' : sit ? 'sit' : 'stand'),
          prop: s.prop || (s.type === 'arm' ? 'book' : null), pose: s.pose, extra, seed: m.seed });
      }
    }
    room.cast = [];
    for (const c of list) addResident(room, c, R);
  }
  // the pets' own lines (a profile can give its pet its own)
  const PET_LINES = {
    cat: LN('cat', '', 'Meow.', 'Miau.', 'Miau.', 'Miau.'),
    dog: Object.assign(LN('cat', '', 'Woof! Woof!', '¡Guau, guau!', 'Au, au!', 'Wuff, wuff!'), { zh: '[汪|wāng] [汪|wāng] ！', ja: 'ワン ワン ！' }),
    canary: Object.assign(LN('cat', '', 'Tweet, tweet!', '¡Pío, pío!', 'Piu, piu!', 'Piep, piep!'), { zh: '[叽叽|jī jī] [喳喳|zhā zhā] ！', ja: 'ピヨ ピヨ ！' }),
    parrot: Object.assign(LN('cat', '', 'Squawk!', '¡Croac!', 'Cróóó!', 'Krah!'), { zh: '[嘎|gā] ！', ja: 'ギャー ！' }),
    turtle: Object.assign(LN('cat', '', '… (it blinks, very slowly)', '…', '…', '…'), { zh: '… …', ja: '… …' }),
  };
  PET_LINES.cat.zh = '[喵|miāo] 。'; PET_LINES.cat.ja = 'ニャー 。';
  function addResident(room, c, R) {
    const rig = room.rig, role = c.role, pet = c.pet || (role === 'cat' ? 'cat' : null), cat = !!pet;
    const name = c.name || pick(NAMES[role] || NAMES.cat, R);
    const at = c.at, look = pet ? null : c.look || lookOf(role, rng(hash(room.key + name)));
    let P;
    if (pet === 'cat') P = makeCat(rig, c.color || pick(CAT_COLORS, rng(hash(name))), at, c.pose || 'sit');
    else if (pet === 'dog') P = makeDog(rig, c.color || '#c98a4a', at, c.pose || 'sit', c.opt || {});
    else if (pet === 'parrot' || pet === 'canary') P = makeBird(rig, at, Object.assign({ small: pet === 'canary' }, c.opt || {}, c.color ? { color: c.color } : {}));
    else if (pet === 'turtle') P = makeTurtle(rig, at);
    else if (at.lie) {        // lying in bed (asleep, or ill): on a bone tipped back, head to the north
      const lb = rig.bone(null, [at.x, at.y || 0.6, at.z], [-Math.PI / 2, at.yaw || 0, 0], 'YXZ');
      P = makePerson(rig, look, { x: 0, y: 0, z: 0, yaw: 0 }, lb, { prop: c.prop, propColor: c.propColor });
    } else {
      if (at.bone) P = makePerson(rig, look, { x: 0, y: (at.y || 0.5) - (look.legs ? 0.3 : 0) - 0.02, z: 0.05, yaw: 0, sit: 1 }, at.bone, { prop: c.prop, propColor: c.propColor });
      else { const sitY = at.sit === 1 ? (at.y || 0.5) - (look.legs ? 0.3 : 0) - 0.02 : at.sit === 2 ? -0.18 : (at.y || 0); P = makePerson(rig, look, { x: at.x, y: sitY, z: at.z, yaw: at.yaw, sit: at.sit }, null, { prop: c.prop, propColor: c.propColor }); }
    }
    const lines = c.lines || (c.lines === null ? linesFor(room, role, R) : linesFor(room, role, R, c.extra || []));
    const h = (look && look.h) || 1;
    const baseY = cat ? (at.y || 0) : at.lie ? (at.y || 0.6) - 0.9 : at.bone ? 0.5 : P.root.position.y;
    const S = { x: at.x, z: at.z, yaw: at.yaw || 0, baseYaw: at.yaw || 0, near: false, wave: 0, talk: 0, blink: 1 + R() * 3, seed: R(), sit: at.sit || 0, rock: !!at.bone, lie: !!at.lie };
    const p = { role, cat, pet, pid: c.pid || null, job: c.job || (cat ? c.pose : 'stand'), P, S, pool: lines.length ? lines : [POOL[0]], turn: 0, watch: c.watch, rocker: at.bone || null };
    const top = pet === 'dog' ? 0.75 : pet === 'parrot' ? 0.55 : cat ? 0.55 : S.lie ? 1.0 : (S.sit ? 1.23 : 1.5) * h + 0.05;
    p.api = { id: room.key + ':' + room.people.length, pid: p.pid, get name() { return displayName(role, name); }, plain: name, lines: p.pool[0], talking: false,
      get x() { return X0 + S.x; }, get z() { return Z0 + S.z; }, get y() { return Y0 + baseY; }, top, cat, pet };
    room.people.push(p);
    if (!S.sit && !cat && !S.lie) room.solids.push({ x: at.x, z: at.z, r: 0.4 });
    if (cat && !at.y) room.solids.push({ x: at.x, z: at.z, r: pet === 'dog' ? 0.36 : 0.28 });
    if (!cat) room.feats.add('person');
    if (cat) room.feats.add(pet === 'cat' ? 'cat' : 'pet');
  }
  function displayName(role, name) {
    const lg = langNow();
    if (cjkI(lg)) {           // zh / ja: the name the zh / ja way, then 奶奶 / 爷爷 / さん for the old (in the mode's plain text)
      const n = NAME_CJ[name], t = TITLE_CJ[role];
      return n ? CJK.plain(n[lg] + (t ? ' ' + t[lg] : ''), { lang: lg }) : name;
    }
    const t = TITLE[role], ti = t && pickLang(t, lg, ''); return ti ? ti + ' ' + name : name;
  }

  // ------------------------------------------------------------ make a room (plan + meshes)
  function makeRoom(door, floor) {
    const key = door.id + '#' + floor, R = rng(hash(key));
    const prof = HOME_KINDS.includes(door.kind) ? (profileOf(door) || GENERIC) : null;
    door._prof = prof;
    const spec = specOf(door, floor, R), P = paletteOf(door, rng(hash(door.id + ':pal')));
    // (a profile may pick its own paper, floor and fabrics: the painter's room isn't the fisher's)
    if (prof && prof.colors) Object.assign(P, prof.colors);
    const ofloor = prof && (floor > 0 ? (prof.up && prof.up.floor) || prof.floor2 : prof.floor);
    const owall = prof && (floor > 0 ? (prof.up && prof.up.wall) || prof.wall2 : prof.wall);
    const room = { key, door, floor, R, P, prof, W: spec.W, D: spec.D, WH: spec.WH, hw: spec.W / 2, hd: spec.D / 2, kit: Kit(), rig: Rig(),
      solids: [], looks: [], reads: [], exits: [], spawns: {}, spots: [], cast: [], people: [], clocks: [], spin: [], steam: [], curios: [], sunWindows: [], shafts: [], feats: new Set(),
      marks: {}, anims: [], sx: prof && prof.mirror ? prof.mirror : (rng(hash(door.id + ':mirror'))() < 0.5 ? -1 : 1),
      floorKind: ofloor || (door.kind === 'bakery' && door.style === 'alba' ? 'checkTeal' : door.kind === 'shed' || door.kind === 'millhouse' ? (door.style === 'lake' ? 'lake' : 'planks') : P.floor),
      wallKind: owall || (door.kind === 'shed' ? 'planks' : door.style === 'alba' ? P.pattern : STYLE[door.style].wall),
      plainWalls: door.kind === 'clockmaker' && floor > 0 ? [1] : [] };      // (no beams across the big clock's back)
    shell(room);
    spec.tpl(room);
    castRoom(room);
    shafts(room);
    // a Look right where someone stands would fight their Talk: move it aside, or drop it
    room.looks = room.looks.filter(L => { for (const p of room.people) { if (Math.hypot(p.S.x - L.x, p.S.z - L.z) < 1.0) { const dx = L.x - L.ax, dz = L.z - L.az, d = Math.hypot(dx, dz) || 1; L.x += (-dz / d) * 1.2; L.z += (dx / d) * 1.2; if (Math.hypot(p.S.x - L.x, p.S.z - L.z) < 1.0) return false; } } return Math.abs(L.x) < room.hw - 0.3 && Math.abs(L.z) < room.hd - 0.3; });
    for (const L of room.looks) room.curios.push({ id: L.id, x: L.ax, z: L.az });
    finish(room);
    return room;
  }
  function finish(room) {
    const g = new THREE.Group(); g.position.set(X0, Y0, Z0); g.visible = false; g.name = 'interior:' + room.key;
    const M = mats(), B = room.kit.B;
    const add = (geo, mat, o = {}) => { if (!geo) return null; const m = new THREE.Mesh(geo, mat); m.castShadow = !!o.cast; m.receiveShadow = !!o.receive; m.frustumCulled = false; if (o.depth) m.customDepthMaterial = M.depth; m.matrixAutoUpdate = false; m.updateMatrix(); g.add(m); return m; };
    add(room.floorGeo, texMat('floor-' + room.floorKind, floorTex(room.floorKind), room.P.floorTint || '#ffffff', {}), { receive: true });
    add(room.wallGeo, texMat('wall-' + room.wallKind, wallTex(room.wallKind), room.P.paper, { fade: 1 }), { receive: true });
    if (B.solid.length) { add(bake(B.solid), M.furn, { cast: true, receive: true, depth: true }); add(bake(B.solid, { hull: true }), M.ink); }
    if (B.glow.length) add(bake(B.glow, { flick: true }), M.glow);
    if (B.decal.length) add(bake(B.decal, { uv: true }), texMat('atlas-' + langNow(), atlas(), '#ffffff', { wall: 1 }), { receive: true });
    if (B.board.length) add(bake(B.board, { uv: true }), texMat('board-' + langNow(), boardTex(), '#ffffff', { wall: 1 }));
    if (room.shafts.length) add(shaftGeo(room.shafts), M.shaft);
    if (room.rig.count) { const r = room.rig.bake(); g.add(r.mesh, r.ink); room.skin = r; }
    room.g = g; room.lang = langNow();
    room.kit = null;           // (the pieces aren't needed once baked)
    G.w3d.scene.add(g);
  }
  function dispose(room) {
    if (!room.g) return;
    room.g.traverse(o => { if (o.isMesh && o.geometry !== room.floorGeo && o.geometry !== room.wallGeo) o.geometry.dispose(); });
    if (room.floorGeo) room.floorGeo.dispose(); if (room.wallGeo) room.wallGeo.dispose();
    if (room.skin && room.skin.skel.dispose) room.skin.skel.dispose();
    G.w3d.scene.remove(room.g); room.g = null;
  }

  // ============================================================ in and out
  const cache = new Map();
  let inside = false, cur = null, curDoor = null, busy = false, plat = null, live = [], tagEl = null, tagCv = null, tag = null, bubbleEl = null, bubble = null, talkBusy = false, steamT = 0, tickT = 0;
  function platform() { if (!plat) { plat = { box: [1e5, 1e5, 1e5, 1e5], top: -100, interiors: true }; WORLD.addPlatforms([plat]); } return plat; }
  function roomFor(door, floor) {
    const key = door.id + '#' + floor;
    let room = cache.get(key);
    if (room && room.lang !== langNow()) { dispose(room); cache.delete(key); room = null; }      // (its pictures have words in the old language)
    if (!room) { room = makeRoom(door, floor); }
    cache.delete(key); cache.set(key, room);
    while (cache.size > CACHE) { const [k0, r0] = cache.entries().next().value; if (r0 === room || r0 === cur) break; dispose(r0); cache.delete(k0); }
    return room;
  }
  function solidsOn(room) {
    solidsOff();
    live = room.solids.map(s => Object.assign({}, s, { x: X0 + s.x, z: Z0 + s.z, interior: true }));
    WORLD.extra.push(...live);
    const p = platform(); p.box = [X0 - room.hw, X0 + room.hw, Z0 - room.hd, Z0 + room.hd]; p.top = Y0;
  }
  function solidsOff() {
    for (const s of live) { const i = WORLD.extra.indexOf(s); if (i >= 0) WORLD.extra.splice(i, 1); }
    live = [];
    if (plat) { plat.box = [1e5, 1e5, 1e5, 1e5]; plat.top = -100; }
  }
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; Y.vx = Y.vz = Y.vy = 0; Y.onGround = true;
    M.x = x - Math.sin(yaw) * 0.9 + Math.cos(yaw) * 0.8; M.z = z - Math.cos(yaw) * 0.9 - Math.sin(yaw) * 0.8; M.station = null; M.look = null; M.hop = null;
    if (inside) { [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3); }
    G.sim.snap();
  }
  function show(door, floor, from) {
    const room = roomFor(door, floor);
    if (cur && cur !== room && cur.g) cur.g.visible = false;
    cur = room; room.g.visible = true;
    solidsOn(room);
    const s = room.spawns[from] || room.spawns.out || room.spawns.up || { x: 0, z: 0, yaw: Math.PI };
    teleport(X0 + s.x, Z0 + s.z, s.yaw);
    // (closer than before: the compact rooms fill the view like a dollhouse; the bigger shops and halls a little farther)
    const big = Math.max(room.W, room.D * 1.3);
    G.cam.snap(Math.PI, 0.68, clamp(big * 0.82, 7.4, 10.5));
    room.people.forEach(p => { p.S.near = false; p.S.wave = 0; });
    buildDyn(room);
    hideTag();
  }
  async function enter(id) {
    if (!G || busy || inside) return false;
    const door = doorById(id);
    if (!door) return false;
    if (claimed(id)) return false;
    if (isLocked(id)) { const msg = LOCKED[id]; if (msg && typeof STORY !== 'undefined') STORY.think(msg, 4); return false; }
    busy = true;
    try {
      Sound.play('wood');
      await UI.fade(1, 380);
      curDoor = door; inside = true;
      show(door, 0, 'out');
      G.w3d.setInterior({ fog: STYLE[door.style].fog, near: 26, far: 70 });
      await UI.fade(0, 380);
    } catch (e) { console.error('[interiors]', e); }
    busy = false;
    welcome(door);
    if (G.save) G.save();
    return true;
  }
  function welcome(door) {
    const s = ST(); s.seen = s.seen || [];
    const first = !s.seen.includes(door.id); if (first) s.seen.push(door.id);
    const NAME = { bakery: 'The bakery', inn: 'The inn', school: 'The school', clockmaker: 'The clockmaker’s', millhouse: 'The mill house', farmhouse: 'Marga’s farmhouse', shed: 'The boat shed', noa: 'Noa’s house', marina: 'Marina’s house' };
    const TOWNS = { alba: 'Alba', molinar: 'Molinar', remanso: 'Remanso' };
    if (NAME[door.kind]) { if (first) UI.chapter(NAME[door.kind], TOWNS[door.town] || ''); return; }
    const ppl = cur ? cur.people.filter(p => !p.cat) : [];
    if (!first) return;
    const prof = door._prof, th = prof && THEMES[prof.theme], label = (prof && prof.label) || (th && th.label) || '';
    const owner = prof && !prof.generic && (prof.people || []).concat((prof.up && prof.up.people) || [])[0];
    if (owner) UI.toast(`${displayName(owner.role, owner.name)}’s house${label ? ' · ' + label : ''}`);
    else if (ppl.length) UI.toast(`${ppl[0].api.name}’s house`);
    else UI.toast(cur && cur.people.length ? 'Nobody’s home… except the cat.' : 'Nobody’s home… but the door was open.');
  }
  async function leave() {
    if (!G || busy || !inside) return;
    busy = true;
    try {
      Sound.play('wood');
      await UI.fade(1, 380);
      const d = curDoor;
      if (cur && cur.g) cur.g.visible = false;
      solidsOff(); inside = false; cur = null; curDoor = null; hideTag(); hideBubble();
      G.w3d.setInterior(null);
      let x = d.out.x, z = d.out.z; [x, z] = WORLD.pushOut(x, z, 0.45);
      // the camera out on the street, three-quarters on: you, and the door you came out of (straight behind you it would sit
      // inside the house, and the spring arm would squeeze it up against your head); walk off and it swings round behind you
      teleport(x, z, d.out.yaw); G.cam.snap(d.out.yaw + Math.PI - 0.9, 0.34, 8.5);
      await UI.fade(0, 380);
    } catch (e) { console.error('[interiors]', e); }
    busy = false;
    if (G.save) G.save();
  }
  async function go(where) {
    if (!inside || busy) return;
    const d = curDoor, floor = where === 'up' || where === 'back' ? 1 : 0, from = { up: 'up', back: 'back', down: 'down', front: 'front' }[where];
    busy = true;
    try { Sound.play(where === 'up' || where === 'down' ? 'step' : 'wood'); await UI.fade(1, 300); show(d, floor, from); await UI.fade(0, 300); } catch (e) { console.error('[interiors]', e); }
    busy = false;
  }

  // ============================================================ what you can do inside: leave, go up or down, talk, look
  function interactables() {
    const list = [];
    if (!inside || !cur || busy) return list;
    for (const e of cur.exits) list.push({ x: X0 + e.x, z: Z0 + e.z, y: Y0, r: e.r, label: e.label, run: () => (e.go === 'out' ? leave() : go(e.go)) });
    for (const p of cur.people) list.push({ x: p.api.x, z: p.api.z, y: Y0, r: p.cat ? 1.7 : p.S.sit ? 2.1 : 2.4, label: 'Talk', run: () => talk(p) });
    for (const L of cur.looks) list.push({ x: X0 + L.x, z: Z0 + L.z, y: Y0, r: L.r, label: 'Look', run: () => look(L) });
    if (typeof SIGNS !== 'undefined' && SIGNS.read) for (const R of cur.reads || []) list.push({ x: X0 + R.x, z: Z0 + R.z, y: Y0, r: R.r, label: 'Read', run: () => SIGNS.read(readCardOf(R.cell)) });
    // a side quest's own things (a spot to search, something to pick up), in room coordinates
    for (const h of HOOKS) if (h.extras) { let more = null; try { more = h.extras(ctxOf(null)); } catch (e) { console.error('[interiors hook]', e); } for (const it of more || []) list.push(Object.assign({ y: Y0 }, it, { x: X0 + it.x, z: Z0 + it.z })); }
    return list;
  }
  // the words on a picture or a board, as a Read card (signs.js: the words big, a 🔊, the English)
  const PIC_READ = ['sampler', 'calendar', 'bakeboard', 'menu', 'abc'];
  function readCardOf(cell) {
    const lg = langNow(), T = PIC_WORDS, CH = { face: '#2f3a33', edge: '#7a5236', ink: '#fdf8ee' }, w = (id, fb) => picWord(id, fb, lg);
    if (cell === 'sampler') { const s = T.sampler[lg] || T.sampler.es; return { tag: 'A stitched sampler', lines: [{ text: s.join(' '), en: 'Home, sweet home', look: { edge: '#d9483b', ink: '#3f6fb5' } }] }; }
    if (cell === 'calendar') {
      const now = new Date();
      let month = '', en = ''; try { month = new Date().toLocaleString(T.loc[lg] || 'es-MX', { month: 'long' }); en = new Date().toLocaleString('en-US', { month: 'long' }); } catch (e) { /* no locale */ }
      return { tag: 'A calendar', lines: [{ text: cjkI(lg) ? cjDate(lg, now.getMonth() + 1, now.getDate()) : `${cap(month)} ${now.getDate()}`, en: `${en} ${now.getDate()} (today)`, look: { edge: '#d9483b' } }] };
    }
    // (zh / ja: a word's notation, so the card shows its readings and the voice reads the characters)
    const wsrc = (id, fb) => (cjkI(lg) && LEX.item(id) && LEX.item(id)[lg] ? LEX.src(id) : w(id, fb));
    if (cell === 'bakeboard') return { tag: 'The bakery’s chalkboard', lines: [{ text: T.board[lg] || T.board.es, en: 'today', look: CH },
      ...[['w.bread', 'Pan', 4, 'bread'], ['w.cake', 'Pastel', 9, 'cake'], ['w.cookie', 'Galleta', 1, 'cookie']].map(([id, fb, p, en]) => ({ text: cjkI(lg) ? `${wsrc(id, fb)} ： ${p} ●` : `${w(id, fb)} · ${p} ●`, say: wsrc(id, fb), en: `${en}: ${p} coin${p > 1 ? 's' : ''}`, look: CH }))] };
    if (cell === 'menu') { const m = T.menu[lg] || T.menu.es, en = ['menu', 'soup', 'bread', 'cheese', 'tea']; return { tag: 'The menu on the wall', lines: m.map((t, i) => ({ text: t, en: en[i], look: CH })) }; }
    if (cell === 'abc') return { tag: 'The alphabet poster', lines: [{ text: 'Aa Bb Cc …', say: 'A, B, C', en: 'the alphabet' }, { text: T.abc[lg] || T.abc.es, say: (T.abc[lg] || T.abc.es).split(' ')[0], en: lg === 'de' ? 'letters German has that English doesn’t' : lg === 'zh' ? 'ü: a letter pinyin has that English doesn’t' : lg === 'ja' ? 'a: the first kana, in hiragana and katakana' : 'a letter ' + (lg === 'pt' ? 'Portuguese' : 'Spanish') + ' has that English doesn’t', look: { ink: '#8a5ab0' } }] };
    if (cell === 'blackboard') {
      const title = { es: 'La casa', pt: 'A casa', de: 'Das Haus', zh: '[房子|fáng zi]', ja: '[家|いえ]' }[lg] || 'La casa', ids = ['w.table', 'w.chair', 'w.bed', 'w.window', 'w.door', 'w.lamp'];
      return { tag: 'The blackboard', lines: [{ text: title, en: 'the house', look: CH }].concat(ids.map(id => ({ text: cjkI(lg) ? wsrc(id, '') : LEX.form(id, { article: true }), en: 'the ' + ((LEX.item(id) || {}).en || ''), look: CH }))) };
    }
    return null;
  }
  // outside: "Go in" at each door near (x, z); a locked door you can knock on (Noa's) says so; Marina's stays quiet (she's at it)
  function doorPrompts(x, z) {
    const list = [];
    if (inside || !G) return list;
    for (const d of allDoors()) {
      const p = d.prompt; if (Math.abs(p.x - x) > 6 || Math.abs(p.z - z) > 6) continue;
      if (claimed(d.id)) continue;
      const locked = isLocked(d.id);
      if (locked && !LOCKED[d.id]) continue;
      list.push({ x: p.x, z: p.z, y: WORLD.groundAt(p.x, p.z), r: p.r, label: locked ? 'Knock' : 'Go in', door: d.id, run: () => (locked ? knock(d) : enter(d.id)) });
    }
    return list;
  }
  async function knock(d) { Sound.play('wood'); await STORY.wait(0.25); Sound.play('wood'); await STORY.wait(0.6); STORY.think(LOCKED[d.id] || 'It’s locked.', 4); }
  // Mimo gets curious about these (story.js curiosities, while you're inside); one spot per word, the nearest
  function curiosities() {
    if (!inside || !cur) return [];
    const Y = G.sim.you, best = {};
    for (const c of cur.curios) { const x = X0 + c.x, z = Z0 + c.z, d = Math.hypot(x - Y.x, z - Y.z); if (d > 7) continue; if (!best[c.id] || d < best[c.id].d) best[c.id] = { id: c.id, x, z, r: 4.2, d }; }
    return Object.values(best).map(({ id, x, z, r }) => ({ id, x, z, r }));
  }
  // a thing to point at when a word comes up for review indoors
  function reviewSpot(id, x, z) {
    if (!inside || !cur) return null;
    let best = null, bd = 8;
    for (const c of cur.curios) { if (c.id !== id) continue; const wx = X0 + c.x, wz = Z0 + c.z, d = Math.hypot(wx - x, wz - z); if (d < bd) { bd = d; best = { x: wx, z: wz }; } }
    return best;
  }
  async function talk(p) {
    // a side quest (interiors_quests.js) may have something to say first
    for (const h of HOOKS) if (h.talk) { let fn = null; try { fn = h.talk(ctxOf(p)); } catch (e) { console.error('[interiors hook]', e); } if (fn) return fn(); }
    return chatLine(p);
  }
  // the person's own lines, one after another, through the weave
  async function chatLine(p, L) {
    L = L || p.pool[p.turn++ % p.pool.length];
    p.api.lines = L.jaKid && p.role === 'kid' ? Object.assign({}, L, { ja: L.jaKid }) : L;      // (a kid says a shared line casually in ja)
    if (p.cat) { if (p.pet === 'dog') bark(); else Sound.play(p.pet === 'canary' ? 'canary' : 'chirp'); p.S.purr = 2.5; }
    if (typeof STORY !== 'undefined' && STORY.sayInline) return STORY.sayInline(p.api);
    return sayHere(p.api);
  }
  // a little bark (WebAudio through the game's own output; nothing in audio.js changes)
  function bark() {
    try {
      const ac = Sound.ctx, out = Sound.out || (ac && ac.destination); if (!ac || !out) { Sound.play('pip'); return; }
      const t = ac.currentTime;
      for (const d of [0, 0.2]) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.setValueAtTime(420, t + d); o.frequency.exponentialRampToValueAtTime(190, t + d + 0.11);
        g.gain.setValueAtTime(0.0001, t + d); g.gain.linearRampToValueAtTime(0.05, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.13); o.connect(g); g.connect(out); o.start(t + d); o.stop(t + d + 0.15); }
    } catch (e) { /* (no audio) */ }
  }
  // what a hook sees: the door, the floor, the person (with their profile id), the room's marks
  function ctxOf(p) {
    return { door: curDoor ? { id: curDoor.id, town: curDoor.town, kind: curDoor.kind } : null, floor: cur ? cur.floor : 0, person: p ? p.api : null, pid: p ? p.pid : null,
      p, room: cur, marks: cur ? cur.marks : {}, X0, Y0, Z0, G };
  }
  // (until story.js shares sayInline: the same weave, in a bubble of our own over the person, until E; never the English
  // under a whole line: the user wants it only on request)
  async function sayHere(p) {
    dom();
    const W = LEX.weave(), L = p.lines || {}, text = L[langNow()] || '', en = L.en || '';
    let html;
    if (W >= 0.62 && text) html = UI.words(text);
    else { const parts = UI.weaveParts(en); UI.noteWoven(parts); html = UI.partsHTML(parts); }
    bubbleEl.className = 'bubble on'; bubbleEl.innerHTML = `<div class="who">${esc(p.name)}</div><div class="line">${html}</div><div class="more">E ▸</div>`;
    bubble = p; p.talking = true; talkBusy = true; G.sim.lock = 1;
    for (let i = 0; i < 3; i++) Sound.play('blip', 'town');
    await UI.waitKey();
    Sound.play('click');
    p.talking = false; hideBubble();
    await STORY.wait(0.08);             // (still locked for a beat: the E that closed the bubble mustn't start the next talk)
    talkBusy = false; G.sim.lock = 0;
  }
  function hideBubble() { bubble = null; if (bubbleEl) { bubbleEl.className = 'bubble'; bubbleEl.style.visibility = 'hidden'; } }
  // Look: the word in the language on a paper tag over the thing, glossed; Mimo looks too (and says it, if it knows it)
  async function look(L) {
    dom();
    const id = L.id, it = LEX.item(id) || {};
    LEX.expose(id);
    tag = { L, t: 6, x: X0 + L.ax, y: Y0 + L.ay, z: Z0 + L.az };
    const lg = langNow(), tagB = tagEl.querySelector('b');
    if (cjkI(lg) && it[lg]) { tagB.innerHTML = CJK.html(LEX.src(id), { lang: lg, ruby: 'always' }); CJK.seen(LEX.src(id), { lang: lg }); }      // (zh / ja: the word with its reading over it, like a new word's card)
    else tagB.textContent = LEX.form(id, { article: true });
    tagEl.querySelector(':scope > div > span').textContent = it.en || '';        // (the gloss: not a span of the word's ruby)
    if (typeof ICONS !== 'undefined') ICONS.draw(tagCv, it.icon);
    Sound.play('page');
    try { if (cjkI(langNow())) CJK.say(LEX.src(id), langNow()); else Sound.say(LEX.form(id, { article: true }), langNow()); } catch (e) { /* no voice */ }     // (zh / ja: the voice reads the characters, never pinyin / rōmaji)
    const M = G.sim.mimo, mine = tag;
    G.sim.mimoGo(null, { x: tag.x, z: tag.z });
    if (LEX.taught(id)) { G.sim.mimoSay(exclaim(LEX.form(id)), 1.8); M.happy = 0.8; }
    else { M.tiltT = 1.2; G.sim.mimoSay(langNow() === 'es' ? '¿…?' : '…?', 1.2); }
    STORY.wait(1.4).then(() => { if (tag === mine || !tag) G.sim.mimoGo(null, null); });   // (Mimo looks a moment; you're free meanwhile)
  }
  function hideTag() { tag = null; if (tagEl) tagEl.style.visibility = 'hidden'; }
  function dom() {
    if (tagEl || typeof document === 'undefined') return;
    const css = document.createElement('style');
    css.textContent = `
      .int-tag { position: fixed; z-index: 7; left: 0; top: 0; transform: translate(-50%, -100%) rotate(-2.5deg); display: flex; align-items: center; gap: 9px; padding: 6px 16px 7px 6px; margin-top: -12px;
        background: #fffaf0; border: 3px solid #2b2235; border-radius: 14px; box-shadow: 0 0 0 4px #fff, 0 8px 0 3px rgba(43,34,53,.2); pointer-events: none; visibility: hidden; }
      .int-tag::before { content: ""; position: absolute; left: 50%; top: -10px; width: 13px; height: 13px; margin-left: -7px; border-radius: 50%; background: #d6453a; border: 2.5px solid #2b2235; }
      .int-tag canvas { width: 54px; height: 54px; background: #fff; border-radius: 10px; border: 2px dashed rgba(43,34,53,.25); }
      .int-tag b { display: block; font: 800 26px Bahnschrift, "Segoe UI", sans-serif; color: #d6453a; line-height: 1.05; white-space: nowrap; }
      .int-tag span { display: block; font: italic 600 14px "Segoe UI", sans-serif; color: #2b2235; opacity: .72; }
      body.in-battle .int-tag, body.on-title .int-tag { display: none !important; }
      .int-mark { position: fixed; z-index: 6; left: 0; top: 0; transform: translate(-50%, -100%); width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center;
        font: 900 17px Bahnschrift, "Segoe UI", sans-serif; color: #fff; background: #3b7ddd; border: 3px solid #2b2235; box-shadow: 0 3px 0 rgba(43,34,53,.25); pointer-events: none; visibility: hidden; animation: intmark 1.1s ease-in-out infinite; }
      .int-mark.new { background: #e0a020; font-size: 20px; }
      @keyframes intmark { 50% { margin-top: -5px; } }
      body.in-battle .int-mark, body.on-title .int-mark { display: none !important; }`;
    document.head.appendChild(css);
    tagEl = document.createElement('div'); tagEl.className = 'int-tag'; tagEl.innerHTML = '<canvas width="96" height="96"></canvas><div><b></b><span></span></div>';
    document.body.appendChild(tagEl); tagCv = tagEl.querySelector('canvas');
    bubbleEl = document.createElement('div'); bubbleEl.className = 'bubble'; bubbleEl.id = 'int-bubble'; document.body.appendChild(bubbleEl);
  }
  // ◆ over whoever has a side-quest step for you, ! over someone with a new one (the hooks say which)
  const markEls = [];
  function marks() {
    let n = 0;
    const quiet = !inside || !cur || busy || talkBusy || (typeof STORY !== 'undefined' && (STORY.line || STORY.busy)) || (G.state && G.state.teaching);
    if (!quiet && HOOKS.some(h => h.mark)) for (const p of cur.people) {
      let m = null;
      for (const h of HOOKS) if (h.mark) { try { m = h.mark(ctxOf(p)); } catch (e) { m = null; } if (m) break; }
      if (!m) continue;
      let el = markEls[n];
      if (!el) { el = document.createElement('div'); el.className = 'int-mark'; document.body.appendChild(el); markEls.push(el); }
      if (el.textContent !== m) { el.textContent = m; el.classList.toggle('new', m === '!'); }
      UI.place(el, screen(p.api.x, p.api.y + p.api.top + 0.55, p.api.z), 0);
      n++;
    }
    for (let i = n; i < markEls.length; i++) markEls[i].style.visibility = 'hidden';
  }
  // a quest's own props (a lost key on the rug, a drawing on a wall), rebuilt whenever you come in or a quest moves on
  function buildDyn(room) {
    if (!room || !room.g) return;
    if (room.dynG) { room.dynG.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); room.g.remove(room.dynG); room.dynG = null; }
    const specs = [];
    for (const h of HOOKS) if (h.props) { try { specs.push(...(h.props(ctxOf(null)) || [])); } catch (e) { console.error('[interiors hook]', e); } }
    if (!specs.length) return;
    const k = Kit(), M = mats(), g = new THREE.Group();
    for (const s of specs) {
      if (s.kind === 'picture') { const a = wallAt(room, s.wall || 1, s.t || 0, 0); k.frame(a.x, s.y || 2, a.z, a.rot, s.wall || 1); k.box(0, 0, 0.02, (s.w || 0.5) + 0.08, (s.h || 0.5) + 0.08, 0.04, s.frame || '#fdf8ee', { ink: 0.005 }); k.decal(0, 0, 0.045, s.w || 0.5, s.h || 0.5, s.cell || 'star'); }
      else { k.frame(s.x || 0, s.y || 0, s.z || 0, s.rot || 0, s.wall || 0); if (s.draw) s.draw(k, GEO, W8); }
    }
    const add = (geo, mat) => { if (!geo) return; const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.matrixAutoUpdate = false; m.updateMatrix(); g.add(m); };
    if (k.B.solid.length) { add(bake(k.B.solid), M.furn); add(bake(k.B.solid, { hull: true }), M.ink); }
    if (k.B.glow.length) add(bake(k.B.glow, { flick: true }), M.glow);
    if (k.B.decal.length) add(bake(k.B.decal, { uv: true }), texMat('atlas-' + langNow(), atlas(), '#ffffff', { wall: 1 }));
    room.dynG = g; room.g.add(g);
  }
  // a quest moved on: rebuild that door's rooms (the one you're in at once, keeping you where you stand), or just the props
  function refresh(doorId, o = {}) {
    if (o.props) { if (cur && (!doorId || cur.door.id === doorId)) buildDyn(cur); return; }
    for (const [k, r] of [...cache]) if ((!doorId || r.door.id === doorId) && r !== cur) { dispose(r); cache.delete(k); }
    if (!inside || !cur || (doorId && cur.door.id !== doorId)) return;
    const Y = G.sim.you, keep = { x: Y.x, z: Y.z, yaw: Y.yaw }, d = curDoor, f = cur.floor, old = cur;
    cache.delete(old.key); dispose(old); cur = null;
    const room = roomFor(d, f); cur = room; room.g.visible = true; solidsOn(room); buildDyn(room);
    Y.x = keep.x; Y.z = keep.z; Y.yaw = keep.yaw; [Y.x, Y.z] = WORLD.pushOut(Y.x, Y.z, 0.35); G.sim.snap();
  }
  const personOf = pid => (cur ? cur.people.find(p => p.pid === pid) || null : null);
  const _sv = new THREE.Vector3();
  function screen(x, y, z) { const cam = G.w3d.camera; _sv.set(x, y, z).project(cam); return { x: (_sv.x * 0.5 + 0.5) * innerWidth, y: (-_sv.y * 0.5 + 0.5) * innerHeight, on: _sv.z < 1 && Math.abs(_sv.x) < 1.15 && Math.abs(_sv.y) < 1.15 }; }

  // ============================================================ every frame (while inside)
  const _clk = new Date();
  function update(dt, t) {
    U.uTime.value = t;
    if (!inside || !cur || !G) { if (tag) hideTag(); for (const el of markEls) el.style.visibility = 'hidden'; return; }
    const Y = G.sim.you, cam = G.w3d.camera, room = cur;
    U.uFocus.value.set(Y.x, Y.ry + 1.0, Y.z);
    // which walls the camera is behind (they fold away, with everything on them)
    const lx = cam.position.x - X0, lz = cam.position.z - Z0;
    U.uHide.value.set(lz < -room.hd ? 1 : 0, lx > room.hw ? 1 : 0, lz > room.hd ? 1 : 0, lx < -room.hw ? 1 : 0);
    for (const p of room.people) animate(p, dt, t, Y);
    // clocks show the time (and tick), pendulums swing, gears turn, cuckoos pop out now and then
    _clk.setTime(Date.now());
    const secs = _clk.getHours() * 3600 + _clk.getMinutes() * 60 + _clk.getSeconds();
    for (const c of room.clocks) {
      if (c.hands) { const s = (secs + c.hands.off) % 43200; c.hands.sec.rotation.z = -(Math.floor(s) % 60) / 60 * TAU; c.hands.minute.rotation.z = -((s / 60) % 60) / 60 * TAU; c.hands.hour.rotation.z = -(s / 43200) * TAU; }
      if (c.pend) c.pend.rotation.z = Math.sin(t * Math.PI * 2 / (c.period || 1.6) + c.phase) * (c.big ? c.swing : 0.22 * c.swing);
      if (c.bird) { const B = c.bird; B.t -= dt; const out = B.t < 0 ? Math.max(0, Math.sin(clamp(-B.t / 1.6, 0, 1) * Math.PI)) * 0.22 : 0; B.b.position.copy(B.base).addScaledVector(B.dir, out); if (B.t < -1.6) { B.t = 9 + Math.random() * 10; } if (B.t < 0 && B.t > -dt * 1.5) Sound.play('chirp'); }
    }
    for (const s of room.spin) { if (s.axis === 'y') s.b.rotation.y += s.speed * dt; else if (s.axis === 'x') s.b.rotation.x += s.speed * dt; else s.b.rotation.z += s.speed * dt; }
    for (const a of room.anims) { try { a(t, dt, Y); } catch (e) { /* (a theme's little motion) */ } }
    marks(dt);
    // the clockmaker's: a soft tick every second
    if (room.door.kind === 'clockmaker' && room.floor === 0 && (tickT -= dt) <= 0) { tickT = 1; Sound.play('click'); }
    // steam over the pots, now and then
    if (room.steam.length && (steamT -= dt) <= 0) { steamT = 0.9 + Math.random() * 0.8; const s = room.steam[(Math.random() * room.steam.length) | 0]; G.w3d.fx.puff(X0 + s.x, Y0 + s.y, Z0 + s.z, 1, 0.16, '#f4f2ee', 0.6); }
    // the Look tag, and our own bubble
    cam.updateMatrixWorld();
    if (tag) {
      tag.t -= dt;
      if (tag.t <= 0 || Math.hypot(Y.x - tag.x, Y.z - tag.z) > 4.5 || G.state.teaching || STORY.line) hideTag();
      else UI.place(tagEl, screen(tag.x, tag.y, tag.z), -4);
    }
    if (bubble && bubbleEl) UI.place(bubbleEl, screen(bubble.x, bubble.y + bubble.top + 0.3, bubble.z), -6);
    // (a scene that broke off never leaves you frozen)
    if (G.sim.lock && !STORY.busy && !talkBusy && !busy) { G.sim.lock = 0; G.cam.override = null; }
  }
  // people: face you when you come close (sitters only turn a little), wave hello, talk with their mouths, do their jobs
  function animate(p, dt, t, Y) {
    const S = p.S, P = p.P, api = p.api;
    const dx = Y.x - (X0 + S.x), dz = Y.z - (Z0 + S.z), dist = Math.hypot(dx, dz), toYou = Math.atan2(dx, dz);
    const near = dist < (S.near ? 4.2 : 3.4) || api.talking;
    if (near && !S.near && !api.talking && !p.cat) S.wave = 1.2;
    S.near = near;
    S.talk = damp(S.talk, api.talking ? 1 : 0, 10, dt);
    if (p.pet && p.pet !== 'cat') { petAnim(p, dt, t, dist, toYou); return; }
    if (S.lie) {       // asleep or ill in bed: breathing, a slow turn of the head your way, the mouth when talking
      P.body.scale.set(1, 1 + Math.sin(t * 1.6 + S.seed * 9) * 0.02, 1 + Math.sin(t * 1.6 + S.seed * 9) * 0.03);
      const hy = dist < 5 && p.job !== 'sleep' ? clamp(angDiff(S.yaw, toYou), -0.7, 0.7) : 0;
      P.head.rotation.y = damp(P.head.rotation.y, hy * 0.6, 3, dt);
      P.arms[0].rotation.set(-0.25, 0, -0.15); P.arms[1].rotation.set(-0.25, 0, 0.15);
      if (P.legs) P.legs.forEach(hip => { hip.rotation.x = 0; });
      if ((S.blink -= dt) < 0) { if (S.blink < -0.12) S.blink = 2 + Math.random() * 3.5; }
      P.eyes.scale.y = p.job === 'sleep' && !api.talking ? 0.12 : S.blink < 0 ? 0.12 : 1;
      P.mouth.scale.y = S.talk > 0.3 ? 1 + Math.abs(Math.sin(t * 16)) * 3 : 1;
      return;
    }
    if (p.cat) {
      const purr = (S.purr = Math.max(0, (S.purr || 0) - dt));
      P.body.scale.y = 1 + Math.sin(t * (P.pose === 'sleep' ? 2.2 : 3)) * 0.035;
      if (P.tail) P.tail.rotation.y = Math.sin(t * (P.pose === 'sleep' ? 0.8 : 2.2) + S.seed * 9) * (P.pose === 'sleep' ? 0.15 : 0.45);
      if (P.head) {
        let hy = 0, hx = 0;
        if (p.watch) { const c = cur.clocks.find(q => q.big && q.pend && !q.hands); if (c) hy = -c.pend.rotation.z * 0.8; hx = -0.15; }
        if (dist < 4 || purr > 0) { hy = clamp(angDiff(S.yaw, toYou), -1.0, 1.0) * (P.pose === 'sleep' ? 0.5 : 1); hx = P.pose === 'sleep' ? -0.25 * Math.min(1, purr + (dist < 2.5 ? 1 : 0)) : 0; }
        P.head.rotation.y = damp(P.head.rotation.y, hy, 5, dt); P.head.rotation.x = damp(P.head.rotation.x, hx, 5, dt);
      }
      if (P.eyes) { if ((S.blink -= dt) < 0) { if (S.blink < -0.12) S.blink = 2 + Math.random() * 3; } P.eyes.scale.y = S.blink < 0 || purr > 0 ? 0.15 : 1; }
      return;
    }
    // turning: standers face you; sitters lean a little your way
    let goal = S.baseYaw;
    if (near) goal = S.sit ? S.baseYaw + clamp(angDiff(S.baseYaw, toYou), -0.5, 0.5) : toYou;
    S.yaw = dampAngle(S.yaw, goal, 4, dt);
    P.root.rotation.y = p.rocker ? 0 : S.yaw;
    if (p.rocker) { p.rocker.rotation.x = Math.sin(t * 1.7 + S.seed * 5) * 0.08; P.root.rotation.y = clamp(angDiff(S.baseYaw, S.yaw), -0.5, 0.5); }
    const br = 1 + Math.sin(t * 2.2 + S.seed * 9) * 0.014;
    P.body.scale.set(1, (S.sit === 1 ? 0.82 : S.sit === 2 ? 0.86 : 1) * br, 1);
    P.body.position.y = S.talk * Math.abs(Math.sin(t * 13)) * 0.03 + (p.job === 'knead' ? Math.abs(Math.sin(t * 5)) * 0.02 : 0);
    P.body.rotation.z = Math.sin(t * 1.2 + S.seed * 9) * 0.02;
    P.body.rotation.x = p.job === 'knead' ? 0.12 + Math.sin(t * 5) * 0.06 : ['tinker', 'desk', 'sew', 'keys', 'write', 'stir'].includes(p.job) ? 0.1 : p.job === 'wipe' || p.job === 'knit' || p.job === 'water' ? 0.08 : 0;
    if (P.legs) P.legs.forEach(hip => { hip.rotation.x = S.sit ? -1.3 : 0; });
    // arms (arms[0] is the right arm)
    let aR = [-0.5, 0, -0.2], aL = [-0.5, 0, 0.2];
    const s5 = Math.sin(t * 5), s3 = Math.sin(t * 3 + S.seed * 4);
    switch (p.job) {
      // (the themed homes' jobs)
      case 'paint': aR = [-1.5 + Math.sin(t * 2.3 + S.seed) * 0.25, 0, -0.45 + Math.sin(t * 3.1) * 0.2]; aL = [-0.9, 0, 0.35]; break;
      case 'strum': aR = [-0.9, 0, -0.55 + Math.sin(t * 9) * 0.18]; aL = [-1.2, 0, 0.9]; break;
      case 'keys': aR = [-1.25 + Math.abs(Math.sin(t * 6)) * 0.12, 0, -0.3]; aL = [-1.25 + Math.abs(Math.sin(t * 6 + 1.7)) * 0.12, 0, 0.3]; break;
      case 'sew': aR = [-1.2 + Math.sin(t * 8) * 0.06, 0, -0.25]; aL = [-1.2, 0, 0.25 + Math.sin(t * 2) * 0.05]; break;
      case 'knit': aR = [-1.15 + Math.sin(t * 7) * 0.1, 0, -0.32]; aL = [-1.15 - Math.sin(t * 7) * 0.1, 0, 0.32]; break;
      case 'write': aR = [-1.2 + Math.sin(t * 5) * 0.05, 0, -0.3 + Math.sin(t * 9) * 0.06]; aL = [-1.0, 0, 0.35]; break;
      case 'water': aR = [-1.0 + Math.max(0, Math.sin(t * 0.8)) * 0.4, 0, -0.3]; aL = [-0.5, 0, 0.2]; break;
      case 'stir': aR = [-1.2, 0, -0.3 + Math.sin(t * 4) * 0.25]; aL = [-0.7, 0, 0.3]; break;
      case 'cradle': aR = [-1.1, 0, -0.5 + Math.sin(t * 1.6) * 0.1]; aL = [-1.1, 0, 0.5 + Math.sin(t * 1.6) * 0.1]; P.body.rotation.z = Math.sin(t * 1.6) * 0.06; break;
      case 'hold': aR = [-1.1, 0, -0.35]; aL = [-1.0, 0, 0.35]; break;
      case 'think': aR = [-2.0, 0, -0.9]; aL = [-0.6, 0, 0.3]; break;
      case 'cook': aR = [-1.1 + Math.sin(t * 4) * 0.12, 0, -0.35 + Math.cos(t * 4) * 0.25]; aL = [-0.6, 0, 0.3]; break;
      case 'knead': aR = [-1.25 - s5 * 0.25, 0, -0.25]; aL = [-1.25 + s5 * 0.25, 0, 0.25]; break;
      case 'wipe': aR = [-1.0 + s5 * 0.15, 0, -0.25 + Math.cos(t * 5) * 0.3]; aL = [-0.7, 0, 0.3]; break;
      case 'point': { const up = (Math.sin(t * 0.7 + S.seed) > 0.2) && !near; aR = up ? [-1.7, 0, -1.05 + s3 * 0.06] : [-0.7, 0, -0.25]; aL = [-0.6, 0, 0.25]; break; }
      case 'read': aR = [-1.05, 0, -0.3]; aL = [-1.05, 0, 0.3]; break;
      case 'desk': { const hand = Math.sin(t * 0.5 + S.seed * 7) > 0.85 && !near; aR = [-1.25, 0, -0.35]; aL = hand ? [-2.9, 0, 0.15] : [-1.25, 0, 0.35]; break; }
      case 'tinker': aR = [-1.15 + Math.sin(t * 7) * 0.08, 0, -0.3]; aL = [-1.15, 0, 0.3 + Math.sin(t * 6) * 0.06]; break;
      case 'rock': case 'sit': aR = [-0.75, 0, -0.3]; aL = [-0.75, 0, 0.3]; break;
      default: if (S.sit === 2) { aR = [-1.0 + s3 * 0.35, 0, -0.35]; aL = [-1.0 - s3 * 0.35, 0, 0.35]; } break;
    }
    if (S.wave > 0) { S.wave -= dt; aL = [-0.3, 0, 2.4 - Math.sin(t * 9) * 0.35]; }
    if (api.talking && p.job !== 'knead' && p.job !== 'wipe') aR = [-0.9 + Math.sin(t * 5) * 0.2, 0, -0.4 - Math.sin(t * 2.5) * 0.2];
    P.arms[0].rotation.set(...aR); P.arms[1].rotation.set(...aL);
    // the head: looks at you when you're close, else idles (and reads, and watches the work)
    let hy, hx = 0;
    if (dist < 6) { hy = clamp(angDiff(S.yaw + P.body.rotation.y, toYou), -1.1, 1.1); hx = -0.05; }
    else { hy = Math.sin(t * 0.37 + S.seed * 20) * 0.45; if (['read', 'knead', 'tinker', 'desk', 'cook', 'wipe', 'sew', 'knit', 'write', 'keys', 'stir', 'water', 'cradle', 'hold'].includes(p.job)) hx = 0.3; if (p.job === 'paint' || p.job === 'think') { hx = -0.1; hy *= 0.4; } }
    P.head.rotation.y = damp(P.head.rotation.y, hy, 5, dt); P.head.rotation.x = damp(P.head.rotation.x, hx, 6, dt);
    if ((S.blink -= dt) < 0) { if (S.blink < -0.12) S.blink = 2 + Math.random() * 3.5; }
    P.eyes.scale.y = S.blink < 0 ? 0.12 : 1;
    P.mouth.scale.y = S.talk > 0.3 ? 1 + Math.abs(Math.sin(t * 16)) * 3 : 1;
  }

  // the other pets: a dog wags harder when you're close, a bird bobs and cocks its head, a turtle pokes its head out
  function petAnim(p, dt, t, dist, toYou) {
    const S = p.S, P = p.P, near = dist < 3.2 || p.api.talking, happy = (S.purr = Math.max(0, (S.purr || 0) - dt));
    if (p.pet === 'dog') {
      if (P.tail) P.tail.rotation.z = Math.sin(t * (near || happy ? 16 : 5)) * (near || happy ? 0.7 : 0.3);
      if (P.head) { const hy = dist < 5 ? clamp(angDiff(S.yaw, toYou), -0.9, 0.9) : Math.sin(t * 0.5 + S.seed * 9) * 0.4; P.head.rotation.y = damp(P.head.rotation.y, hy, 5, dt); P.head.rotation.z = damp(P.head.rotation.z, near ? Math.sin(t * 1.3) * 0.18 : 0, 3, dt); }
      for (const sx of [-1, 1]) if (P['ear' + sx]) P['ear' + sx].rotation.z = sx * (0.25 + Math.sin(t * 3 + sx) * 0.05 + (happy ? Math.abs(Math.sin(t * 12)) * 0.25 : 0));
      P.body.scale.y = 1 + Math.sin(t * (P.pose === 'lie' ? 2 : 3.2)) * 0.03;
      P.body.position.y = happy ? Math.abs(Math.sin(t * 10)) * 0.08 : 0;
    } else if (p.pet === 'parrot' || p.pet === 'canary') {
      const hop = p.pet === 'canary' ? Math.max(0, Math.sin(t * 2.3 + S.seed * 9)) : 0;
      P.body.position.y = hop * 0.12 + (happy ? Math.abs(Math.sin(t * 14)) * 0.06 : 0);
      P.body.rotation.x = Math.sin(t * 1.7 + S.seed) * 0.08;
      if (P.head) { P.head.rotation.z = Math.sin(t * 0.9 + S.seed * 5) * 0.35; P.head.rotation.y = dist < 4 ? clamp(angDiff(S.yaw, toYou), -1.2, 1.2) : Math.sin(t * 0.6) * 0.8; }
    } else if (p.pet === 'turtle') {
      const out = near ? 1 : Math.max(0, Math.sin(t * 0.4 + S.seed * 7));
      if (P.head) P.head.position.z = 0.12 + out * 0.08;
      P.body.rotation.y = Math.sin(t * 0.2 + S.seed) * 0.3;
    }
    if (P.eyes) { if ((S.blink -= dt) < 0) { if (S.blink < -0.12) S.blink = 2 + Math.random() * 3; } P.eyes.scale.y = S.blink < 0 ? 0.15 : 1; }
  }

  // ============================================================ the rest of the API
  function init(game) {
    G = game; DOORS = null; dom();
    if (typeof CJK !== 'undefined') try {         // zh / ja: the IME and typed answers know the households' words; rōmaji capitalizes their names
      for (const l of ['zh', 'ja']) CJK.addSource(cjSources().filter(s => s.l === l && !/^name /.test(s.where)).map(s => s.src), l);
      if (CJK.addNames) CJK.addNames(Object.entries(NAME_CJ).filter(([es]) => !NAMES.cat.includes(es) && !PET_WORDS.has(es)).map(([, n]) => n.ja));
    } catch (e) { console.error('[interiors]', e); }
    // the homes' side quests (interiors_quests.js): into QUESTS.LIST as side quests
    if (typeof HQ !== 'undefined' && HQ && HQ.init) try { HQ.init(game); } catch (e) { console.error('[interiors] quests', e); }
  }
  // zh / ja: every string this file adds, as [{ where, src, l }]; cjCheck() validates them all against CJK.md ([] = fine)
  function cjSources() {
    const out = [], add = (where, src, l) => { if (src) out.push({ where, src, l }); };
    for (const L of POOL.concat(Object.values(SAY), [kitchenLine(true), kitchenLine(false)])) { add(L.en + ' · zh', L.zh, 'zh'); add(L.en + ' · ja', L.ja, 'ja'); add(L.en + ' · jaKid', L.jaKid, 'ja'); }
    for (const [es, n] of Object.entries(NAME_CJ)) { add('name ' + es, n.zh, 'zh'); add('name ' + es, n.ja, 'ja'); }
    for (const [role, t] of Object.entries(TITLE_CJ)) { add('name title ' + role, t.zh, 'zh'); add('name title ' + role, t.ja, 'ja'); }
    for (const [id, c] of Object.entries(WORDS_CJ)) for (const l of ['zh', 'ja']) { add(id, c[l], l); if (c.cl) add(id + ' cl', c.cl[l], l); ((c.alt && c.alt[l]) || []).forEach(a => add(id + ' alt', a, l)); }
    for (const [k, v] of Object.entries(PIC_WORDS)) if (k !== 'loc' && k !== 'abc') for (const l of ['zh', 'ja']) [].concat(v[l] || []).forEach(s => add('picture ' + k, s, l));
    for (let d = 1; d <= 31; d++) for (const l of ['zh', 'ja']) add('date', cjDate(l, ((d - 1) % 12) + 1, d), l);
    // the homes' people and pets (playtest 4), and the pets' own sounds
    for (const [id, h] of Object.entries(HOMES)) {
      const all = [h].concat(h.up ? [h.up] : [], ['es', 'pt', 'de', 'zh', 'ja'].filter(l => h[l]).map(l => h[l]), ['es', 'pt', 'de', 'zh', 'ja'].filter(l => h[l] && h[l].up).map(l => h[l].up));
      for (const part of all) for (const c of (part.people || []).concat(part.pets || [])) (c.lines || []).forEach((L, i) => { add(`${id} ${c.id || c.name} #${i} · zh`, L.zh, 'zh'); add(`${id} ${c.id || c.name} #${i} · ja`, L.ja, 'ja'); });
    }
    for (const [k, L] of Object.entries(PET_LINES)) { add('pet ' + k, L.zh, 'zh'); add('pet ' + k, L.ja, 'ja'); }
    for (const f of CJ_MORE) { try { out.push(...f()); } catch (e) { console.error('[interiors] cj', e); } }
    return out;
  }
  const CJ_MORE = [];        // (more zh / ja strings to check: the quests add theirs)
  function cjCheck() {
    const bad = [];
    for (const L of POOL.concat(Object.values(SAY))) if (!L.zh || !L.ja) bad.push({ where: L.en, problems: ['no zh / ja'] });
    for (const [id, h] of Object.entries(HOMES)) for (const part of [h].concat(h.up ? [h.up] : [])) for (const c of (part.people || []).concat(part.pets || []))
      (c.lines || []).forEach((L, i) => { const miss = ['en', 'es', 'pt', 'de', 'zh', 'ja'].filter(l => !L[l]); if (miss.length) bad.push({ where: `${id} ${c.id || c.name} #${i}`, problems: ['missing ' + miss.join(' ')] }); });
    for (const [id, c] of Object.entries(WORDS_CJ)) { const it = LEX.item(id); if (!it || it.zh !== c.zh || it.ja !== c.ja) bad.push({ where: id, problems: ['the item has other zh / ja forms than WORDS_CJ'] }); }
    if (typeof CJK === 'undefined') return bad;
    for (const s of cjSources()) { const p = CJK.validate(s.src, s.l); if (p.length) bad.push({ where: s.where, src: s.src, problems: p }); }
    return bad;
  }
  function stats() {
    if (!cur || !cur.g) return null;
    let tris = 0, calls = 0;
    cur.g.traverse(o => { if (o.isMesh && o.visible) { const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += n; calls++; } });
    return { key: cur.key, kind: cur.door.kind, size: [cur.W, cur.D], tris: Math.round(tris), calls, people: cur.people.length, looks: cur.looks.length, words: [...new Set(cur.looks.map(l => l.id))], clocks: cur.clocks.length, cached: cache.size };
  }
  // the furniture and building helpers, for the themes (interiors_themes.js) and the quests' props
  const FURN = { bed, table, chair, stool, armchair, stove, counter, fireplace, hood, potStove, bookcase, wardrobe, dresser, nightstand, sideTable, floorLamp,
    roundRug, rectRug, bench, coatRack, plantItem, sacks, windowItem, fishNet, oars, lifeRing, picture, wallShelf, clockItem, grandClock, frontDoor, innerDoor,
    breadOven, breadRack, shopCounter, bar, schoolDesk, teacherDesk, blackboard, globe, workbench, boat, millstones };
  const KIT = { FURN, GEO, PG, W8, INK, shade, mix, pick, hash, rng, put, onWall, wallAt, addLook, spot, hangLamp, rockingChair, gear, entrance, stairsUp, stairHole,
    cupOn, plateOn, loafAt, vaseAt, candleAt, jarAt, booksRow, plantAt, barrelAt, tableLampAt, makePerson, makeCat, makeDog, makeBird, makeTurtle, Kit, cellUV, CELLS,
    PET_LINES, LN, wallTex, floorTex };
  return {
    init, doors, enter, leave, update, interactables, doorPrompts, curiosities, reviewSpot, unlock, lock, isLocked,
    claim(fn) { if (typeof fn === 'function') CLAIMS.push(fn); },        // (fn(doorId) → true: that door belongs to another module now)
    // (playtest 4) homes, themes, quest hooks
    home, theme, hook, kit: KIT, refresh, chat: (p, L) => chatLine(p, L), person: personOf, displayName,
    get homes() { return HOMES; }, get themes() { return THEMES; }, profileOf: id => { const d = doorById(id); return d ? profileOf(d) : null; }, doorById,
    get inside() { return inside; },
    get current() { return inside && curDoor ? { id: curDoor.id, town: curDoor.town, kind: curDoor.kind, floor: cur ? cur.floor : 0, rooms: curDoor.rooms } : null; },
    get OUTSIDE() { return inside && curDoor ? { x: curDoor.out.x, z: curDoor.out.z, yaw: curDoor.out.yaw } : null; },
    get song() { return inside && curDoor ? STYLE[curDoor.style].song : null; },
    get busy() { return busy || talkBusy; },
    WORDS: WORD_IDS, stats,
    // names said the zh / ja way: { Leonor: ['[莱昂诺尔|Lái áng nuò ěr]', 'レオノール'] } (pet: true for a translated pet's name)
    names(map, o = {}) { for (const [es, v] of Object.entries(map)) { NAME_CJ[es] = { zh: v[0], ja: v[1] }; if (o.pet) PET_WORDS.add(es); } },
    cjMore(fn) { if (typeof fn === 'function') CJ_MORE.push(fn); },
    _: { X0, Y0, Z0, cache, get room() { return cur; }, allDoors, makeRoom, go, look, talk, POOL, SAY, household, U, hideTag,
      NAME_CJ, WORDS_CJ, cjSources, cjCheck, displayName, readCardOf, kitchenLine, HOMES, THEMES, HOOKS, buildDyn, ctxOf, zones },
  };
})();
