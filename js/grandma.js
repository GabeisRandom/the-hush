'use strict';
// Grandma Mei and her Chinese restaurant, the Plum Garden (DESIGN.md 14.11). The user: "a grandma teaching you chinese food
// (maybe add a chinese restaurant like universally …) you could also add a secret area for her special chinese training
// where she teaches you chinese martial arts if you are learning chinese".
//
// THE DOOR: 'alba-house-15', Alba's two-floor yellow house on the north street, just off the plaza (its door faces the
// street, east). Taken over in EVERY language through INTERIORS.claim. (school.js has house 09, west street, zh / ja only.)
// THE ROOM: floats at (−190, 300, −22), like the other rooms. The secret courtyard (kungfu.js, zh only) is at (−150, 300, −250).
//
// In every language the restaurant is real: red lanterns, a signboard in the game's language (and 梅园餐馆 in gold), the menu
// board by the door, and inside, Grandma Mei, a Chinese grandma who has cooked in Alba for forty years. You order from her
// menu in the language you're learning (shop.js SHOP.extend: the stall 'gm_mei', graded S–D like the market), she serves it
// at your table, packs the rest for the road (your bag: it heals in battle) and tells the dish's story the first time. Her
// chats (festival foods, gated by the bells) and her own story (after every dish) add up to a recipe-card collection and
// Mimo's apron. Little hints that she's more than a cook (a photo, a chopstick caught without looking…) are everywhere.
// In zh games she has a full side plot, in chapters gated by the bells (the 'Lesson' entry in her menu):
//   1 点菜 (always): the menu, the measure words 一碗面 · 一盘饺子 · 一笼包子 · 一杯茶, taking orders, ordering politely
//   2 酸甜苦辣咸 (bell 1): Mimo tastes mystery dishes and you say the taste; what you like; 太辣了！
//   3 包饺子 (bell 2): tell Mimo each step (和面 擀皮 放馅 包 煮), 先…再…, count them. Reward: Mimo's apron
//   4 节日美食 (bell 3): 月饼 / 中秋, 汤圆 / 元宵, 粽子 / 端午, and her own memories
//   5 秘密 (bell 4, after 4): the plum painting in her kitchen hides a round door to her courtyard: kungfu.js
// Progress: G.state.gm (saved with the game). Lines: LINES 'gm.*' (es pt de zh ja, the English weave last).
//   GRANDMA.init(game) · as a room (main.js ROOMS): .inside · .OUTSIDE · .interactables() · .update(dt, t) · .target()
//   · .enter() · .leave() · outdoors every frame: .outdoor(dt, t) · .claims(doorId) · .mapMark(dpr) (minimap.js) · ._ (tests)

const GRANDMA = (() => {
  const DOOR_ID = 'alba-house-15';
  const HOUSE_N = 15;                                  // (the 15th 'house' in TOWN.layout, as interiors.js numbers them)
  const X0 = -190, Y0 = 300, Z0 = -22;                 // the room: clear of every other room (≥ 26 away)
  const HW = 7, HD = 5.5, WH = 4.3, HALF = Math.PI / 2;
  const INK = '#2b2235', PAPER = '#fffaf0', RED = '#c8322a', GOLD = '#e8c35a', LACQ = '#7a1f1a';
  const STALL = 'gm_mei';
  let G = null;
  const L = () => (G && G.state && G.state.lang) || (typeof LEX !== 'undefined' && LEX.lang) || 'es';
  const isZh = () => L() === 'zh';
  const cjOn = () => typeof CJK !== 'undefined' && CJK.isCJK(L());
  const cmode = () => (typeof CJK !== 'undefined' ? CJK.mode(L()) : 'roman');
  const TAG = l => (l === 'zh' ? 'zh-Hans' : 'ja');
  const FONT = { zh: '"KaiTi", "STKaiti", "Kaiti SC", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", serif',
    ja: '"Yu Mincho", "YuMincho", "Hiragino Mincho ProN", "MS Mincho", "Yu Gothic", "Meiryo", serif' };
  const S = () => {
    const s = G.state; if (!s.gm) s.gm = {};
    const o = s.gm; o.ord = o.ord || {}; o.st = o.st || {}; o.cards = o.cards || []; o.ch = o.ch || {};
    return o;
  };
  const bells = () => (G && G.state && G.state.flags && G.state.flags.bells) || 0;
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const plainOf = (src, o) => (typeof CJK !== 'undefined' && cjOn() ? CJK.plain(src, Object.assign({ lang: L() }, o || {})) : src);
  const tick = ms => new Promise(r => setTimeout(r, ms));

  // ============================================================ names (CJK.md's table)
  const NAME = {
    gm: { es: 'Abuela Mei', pt: 'Vovó Mei', de: 'Oma Mei', en: 'Grandma Mei', zh: '[梅|Méi] [奶奶|nǎi nai]', ja: 'メイ おばあちゃん' },
    place: { es: 'Jardín del Ciruelo', pt: 'Jardim da Ameixeira', de: 'Pflaumengarten', en: 'The Plum Garden', zh: '[梅园|Méi yuán] [餐馆|cān guǎn]', ja: '[梅園|ばいえん]' },
    kind: { es: 'RESTAURANTE CHINO', pt: 'RESTAURANTE CHINÊS', de: 'CHINA-RESTAURANT', en: 'CHINESE RESTAURANT', zh: '[中餐馆|zhōng cān guǎn]', ja: '[中華料理|ちゅうかりょうり]' },
    where: { es: 'en el restaurante chino de Alba', pt: 'no restaurante chinês de Alba', de: 'im China-Restaurant in Alba', en: 'the Chinese restaurant in Alba',
      zh: '[阿尔巴|Ā ěr bā] [的|de] [梅园|Méi yuán] [餐馆|cān guǎn]', ja: 'アルバ の [中華料理|ちゅうかりょうり] 「 [梅園|ばいえん] 」' },
  };
  const nm = k => { const o = NAME[k]; return o[L()] || o.en; };
  const nmPlain = k => plainOf(nm(k));
  const enName = k => NAME[k].en;

  // ============================================================ the dishes (the menu, in every language)
  // forms: [singular, plural, gender] (the first is the standard one; shop.js reads the others too); zh: the forms and the
  // measure words (cl: hers, cls: also right); ja: the forms and the counters beyond つ / 個 (jc). price in coins, heal: hearts.
  const DISHES = [
    { id: 'w.jiaozi', key: 'jiaozi', price: 4, heal: 2, icon: 'gm_jiaozi', en: ['plate of jiaozi', 'jiaozi'], gloss: 'dumplings',
      es: [['jiaozi', 'jiaozi', 'm'], ['empanadilla', 'empanadillas', 'f']], pt: [['jiaozi', 'jiaozi', 'm'], ['guioza', 'guiozas', 'm']],
      de: [['Jiaozi', 'Jiaozi', 'm'], ['Teigtasche', 'Teigtaschen', 'f']],
      zh: ['[饺子|jiǎo zi]', '[水饺|shuǐ jiǎo]'], cl: '盘', cls: ['个', '份', '碗'], ja: ['[餃子|ぎょうざ]', 'ギョーザ', 'ギョウザ', 'ぎょうざ'] },
    { id: 'w.baozi', key: 'baozi', price: 3, heal: 2, icon: 'gm_baozi', en: ['steamed bun', 'steamed buns'], gloss: 'steamed buns',
      es: [['baozi', 'baozi', 'm'], ['bollo', 'bollos', 'm']], pt: [['baozi', 'baozi', 'm']], de: [['Baozi', 'Baozi', 'm'], ['Dampfnudel', 'Dampfnudeln', 'f']],
      zh: ['[包子|bāo zi]'], cl: '笼', cls: ['个', '份'], ja: ['[肉|にく]まん', '[中華|ちゅうか]まん', 'パオズ', 'にくまん'] },
    { id: 'w.noodles', key: 'noodles', price: 5, heal: 3, icon: 'gm_noodles', en: ['bowl of noodles', 'bowls of noodles'], gloss: 'noodles', mass: true,
      es: [['fideos', 'fideos', 'm'], ['tallarines', 'tallarines', 'm']], pt: [['macarrão', 'macarrões', 'm'], ['lámen', 'lámens', 'm'], ['talharim', 'talharins', 'm']],
      de: [['Nudeln', 'Nudeln', 'f'], ['Nudelsuppe', 'Nudelsuppen', 'f']],
      zh: ['[面|miàn]', '[面条|miàn tiáo]', '[拉面|lā miàn]', '[汤面|tāng miàn]'], cl: '碗', cls: ['份'], ja: ['ラーメン', '[中華|ちゅうか]そば', '[麺|めん]'], jc: ['杯'] },
    { id: 'w.wonton', key: 'wonton', price: 4, heal: 2, icon: 'gm_wonton', en: ['bowl of wontons', 'wontons'], gloss: 'wontons',
      es: [['wantán', 'wantanes', 'm'], ['wonton', 'wontons', 'm']], pt: [['wonton', 'wontons', 'm'], ['wantan', 'wantans', 'm']], de: [['Wantan', 'Wantans', 'm'], ['Wonton', 'Wontons', 'm']],
      zh: ['[馄饨|hún tun]', '[云吞|yún tūn]'], cl: '碗', cls: ['份', '个'], ja: ['ワンタン'] },
    { id: 'w.springroll', key: 'springroll', price: 2, heal: 1, icon: 'gm_springroll', en: ['spring roll', 'spring rolls'], gloss: 'spring rolls',
      es: [['rollito', 'rollitos', 'm']], pt: [['rolinho', 'rolinhos', 'm']], de: [['Frühlingsrolle', 'Frühlingsrollen', 'f']],
      zh: ['[春卷|chūn juǎn]'], cl: '个', cls: ['根', '条', '盘', '份'], ja: ['[春巻|はるま]き', 'はるまき'], jc: ['本'] },
    { id: 'w.tea', key: 'tea', price: 1, heal: 1, icon: 'gm_tea', en: ['tea', 'cups of tea'], gloss: 'tea', mass: true,
      es: [['té', 'tés', 'm']], pt: [['chá', 'chás', 'm']], de: [['Tee', 'Tees', 'm']],
      zh: ['[茶|chá]', '[花茶|huā chá]', '[绿茶|lǜ chá]', '[茉莉花茶|mò lì huā chá]'], cl: '杯', cls: ['壶'], ja: ['お[茶|ちゃ]', '[茶|ちゃ]', 'ウーロン[茶|ちゃ]', 'おちゃ'], jc: ['杯'] },
  ];
  const DISH = Object.fromEntries(DISHES.map(d => [d.id, d]));
  const DISH_IDS = DISHES.map(d => d.id);
  // the LEX words (the teach box, the bag, eating them in battle: «¡come los jiaozi!», «吃饺子！»)
  const WORDS = DISHES.map(d => ({ id: d.id, kind: 'word', en: d.gloss, enPl: d.gloss, icon: d.icon,
    es: d.es[0][0], pt: d.pt[0][0], de: d.de[0][0], zh: d.zh[0], ja: d.ja[0],
    g: { es: d.es[0][2], pt: d.pt[0][2], de: d.de[0][2] }, pl: { es: d.es[0][1], pt: d.pt[0][1], de: d.de[0][1], zh: d.zh[0], ja: d.ja[0] },
    alt: { es: d.es.slice(1).flatMap(f => [f[0], f[1]]), pt: d.pt.slice(1).flatMap(f => [f[0], f[1]]), de: d.de.slice(1).flatMap(f => [f[0], f[1]]), zh: d.zh.slice(1), ja: d.ja.slice(1) } }));
  // her restaurant as a shop.js stall: the dishes, plates / bowls / cups («un plato de jiaozi», «eine Schüssel Nudeln»), the
  // zh measure words shop.js didn't know (盘 plates, 笼 steamer baskets, 壶 pots), and her welcome in each language
  const UNITS = {
    es: [['plato', 'platos', 'm', 'plate'], ['cuenco', 'cuencos', 'm', 'bowl'], ['tazón', 'tazones', 'm', 'bowl'], ['bol', 'boles', 'm', 'bowl'], ['taza', 'tazas', 'f', 'cup'], ['ración', 'raciones', 'f', 'portion'], ['porción', 'porciones', 'f', 'portion'],
      ['sopa', 'sopas', 'f', 'bowl']],          // («una sopa de wonton», «una sopa de fideos»: before this, «sopa» was misread as «soda»)
    pt: [['prato', 'pratos', 'm', 'plate'], ['tigela', 'tigelas', 'f', 'bowl'], ['xícara', 'xícaras', 'f', 'cup'], ['porção', 'porções', 'f', 'portion'], ['sopa', 'sopas', 'f', 'bowl']],
    de: [['Teller', 'Teller', 'm', 'plate', 1], ['Schüssel', 'Schüsseln', 'f', 'bowl'], ['Schale', 'Schalen', 'f', 'bowl'], ['Tasse', 'Tassen', 'f', 'cup'], ['Portion', 'Portionen', 'f', 'portion']],
  };
  const MEASURES = { 盘: ['pán', 'plates'], 笼: ['lóng', 'steamer baskets'], 壶: ['hú', 'pots'] };
  const WELCOME = {
    es: (c, k) => ['¡Hola, cariño! Pasa, siéntate. Hoy tengo ', ...k.goods(c.stall, ' y '), '. ¿Qué te pongo?'],
    pt: (c, k) => ['Oi, meu bem! Entra, senta. Hoje tem ', ...k.goods(c.stall, ' e '), '. O que vai ser?'],
    de: (c, k) => ['Hallo, mein Kind! Komm, setz dich. Heute gibt es ', ...k.goods(c.stall, ' und '), '. Was darf’s sein?'],
    en: (c, k) => ['Hello, dear! Come in, sit down. Today I have ', ...k.goods(c.stall, ' and '), '. What can I get you?'],
    zh: (c, k) => ['[欢迎|huān yíng] [光临|guāng lín] ！ [快|kuài] [坐|zuò] 。 [今天|jīn tiān] [有|yǒu]', ...k.goods(c.stall, '[和|hé]'), '。 [想|xiǎng] [吃|chī] [什么|shén me] ？'],
    ja: (c, k) => ['いらっしゃいませ ！ どうぞ 、 [座|すわ]って 。 [今日|きょう] は', ...k.goods(c.stall, 'と'), 'が あります よ 。 なに に します か ？'],
  };
  let shopDone = false;
  function ensureShop() {
    if (shopDone) return true;
    if (typeof SHOP === 'undefined' || !SHOP.extend) return false;
    shopDone = true;
    try {
      SHOP.extend({
        words: WORDS, units: UNITS, cl: MEASURES,
        stalls: { [STALL]: { name: NAME.place, where: NAME.where, welcome: WELCOME, goods: DISH_IDS } },
        items: DISHES.map(d => [d.id, d.price, d.heal, STALL]),
        goods: { es: Object.fromEntries(DISHES.map(d => [d.id, d.es])), pt: Object.fromEntries(DISHES.map(d => [d.id, d.pt])), de: Object.fromEntries(DISHES.map(d => [d.id, d.de])) },
        en: Object.fromEntries(DISHES.map(d => [d.id, d.en])),
        mass: DISHES.filter(d => d.mass).map(d => d.id), listSg: ['w.tea'], pricePl: ['w.jiaozi', 'w.baozi', 'w.springroll'],
        enWords: 'dumpling dumplings jiaozi bun buns baozi noodle noodles wonton wontons spring roll rolls tea plate plates bowl bowls cup cups',
        cj: Object.fromEntries(DISHES.map(d => [d.id, { zh: d.zh, cl: d.cl, cls: d.cls, ja: d.ja, jc: d.jc }])),
      });
    } catch (e) { console.error('[grandma] shop', e); }
    return true;
  }

  // ============================================================ the pictures (icons.js's paper-cutout rule: one ink line, flat colors)
  function addIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const H = ICONS.H, { shape, ell, poly, rr, dot } = H, has = k => ICONS.keys.includes(k);
    const add = (k, fn) => { if (!has(k)) ICONS.add(k, fn); };
    const line = (c, pts, col, w = 2) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => c.lineTo(p[0], p[1])); c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.stroke(); };
    const plate = (c, p, y = 16, w = 36) => { shape(c, p, ell(0, y, w, w * 0.32), '#f4efe4'); if (p) shape(c, 1, ell(0, y - 1, w * 0.72, w * 0.2), '#e6ddd0', 1.2); };
    const bowl = (c, p, col = '#f4efe4', band = '#3f6fb5') => {
      shape(c, p, k => { k.moveTo(-32, -2); k.lineTo(32, -2); k.quadraticCurveTo(30, 30, 0, 30); k.quadraticCurveTo(-30, 30, -32, -2); k.closePath(); }, col);
      if (p) { line(c, [[-28, 10], [28, 10]], band, 2.4); line(c, [[-24, 17], [24, 17]], band, 1.2); }
    };
    const dumpling = (c, p, x, y, s = 1) => {
      shape(c, p, k => { k.moveTo(x - 15 * s, y + 6 * s); k.quadraticCurveTo(x, y - 18 * s, x + 15 * s, y + 6 * s); k.quadraticCurveTo(x, y + 10 * s, x - 15 * s, y + 6 * s); k.closePath(); }, '#fbf6e8');
      if (p) for (let i = -2; i <= 2; i++) line(c, [[x + i * 4 * s, y - 6 * s + Math.abs(i) * 1.5 * s], [x + i * 3.2 * s, y - 1 * s]], 'rgba(150,120,80,0.6)', 1.1);
    };
    const chopsticks = (c, x = 14, y = -30) => { line(c, [[x, y], [x + 26, y + 30]], '#8a5a2e', 3); line(c, [[x + 8, y - 2], [x + 30, y + 26]], '#a8703f', 3); };
    add('gm_jiaozi', (c, p) => { plate(c, p, 18); dumpling(c, p, -14, 8); dumpling(c, p, 14, 8); dumpling(c, p, 0, -2, 1.1); if (p) chopsticks(c, 16, -36); });
    add('gm_baozi', (c, p) => {
      shape(c, p, rr(-34, 2, 68, 28, 6), '#d9b27a'); if (p) { line(c, [[-34, 12], [34, 12]], '#a8803f', 1.6); line(c, [[-34, 22], [34, 22]], '#a8803f', 1.6); }
      for (const x of [-14, 14]) { shape(c, p, ell(x, -4, 15, 13), '#fffaf0'); if (p) { c.beginPath(); c.arc(x, -9, 5, 0.3, 5.2); c.lineWidth = 1.3; c.strokeStyle = 'rgba(150,120,80,0.6)'; c.stroke(); } }
    });
    add('gm_noodles', (c, p) => {
      bowl(c, p); shape(c, p, ell(0, -2, 32, 8), '#e8a85a');
      if (p) { for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * 7, -6); c.bezierCurveTo(i * 7 + 4, -14, i * 7 - 4, -18, i * 7 + 2, -24); c.lineWidth = 2.2; c.strokeStyle = '#f7dc8a'; c.stroke(); } dot(c, -12, -3, 3, '#6fbf5a'); dot(c, 10, -1, 3, '#6fbf5a'); chopsticks(c, 6, -40); }
    });
    add('gm_wonton', (c, p) => {
      bowl(c, p, '#f4efe4', '#c8322a'); shape(c, p, ell(0, -2, 32, 8), '#e9c27a');
      for (const [x, y] of [[-14, -4], [2, -6], [16, -3]]) { shape(c, p, ell(x, y, 8, 5), '#fbf6e8'); if (p) dot(c, x + 3, y - 4, 2.4, '#fbf6e8'); }
      if (p) { dot(c, -4, 0, 2.2, '#5aa84a'); dot(c, 9, 1, 2.2, '#5aa84a'); }
    });
    add('gm_springroll', (c, p) => { plate(c, p, 20); for (const [x, y, r] of [[-12, 6, -0.25], [8, 2, 0.15], [0, -10, -0.05]]) { c.save(); c.translate(x, y); c.rotate(r); shape(c, p, rr(-18, -6, 36, 12, 6), '#e8a43a'); if (p) { line(c, [[-10, -5], [-12, 5]], 'rgba(150,90,30,0.55)', 1.2); line(c, [[2, -5], [0, 5]], 'rgba(150,90,30,0.55)', 1.2); } c.restore(); } });
    add('gm_tea', (c, p) => {
      shape(c, p, ell(-6, 4, 22, 18), '#4f8a7a'); shape(c, p, rr(-14, -18, 16, 6, 3), '#3f6f62'); shape(c, p, ell(-6, -20, 4, 3), '#3f6f62');
      shape(c, p, poly([[14, 0], [26, -10], [28, -8], [18, 8]]), '#4f8a7a');
      shape(c, p, k => { k.moveTo(18, 14); k.lineTo(38, 14); k.lineTo(35, 30); k.lineTo(21, 30); k.closePath(); }, '#f4efe4');
      if (p) { [-12, 0].forEach(x => { c.beginPath(); c.moveTo(x, -26); c.bezierCurveTo(x - 5, -32, x + 5, -36, x, -42); c.lineWidth = 1.8; c.strokeStyle = 'rgba(43,34,53,0.4)'; c.stroke(); }); dot(c, -10, 0, 3, 'rgba(255,255,255,0.5)'); }
    });
    // the measure words' things: a bowl (碗), a plate (盘), a steamer basket (笼), a cup (杯)
    add('gm_bowl', (c, p) => { bowl(c, p); if (p) shape(c, 1, ell(0, -2, 32, 7), '#fffaf0', 1.6); });
    add('gm_plate', (c, p) => { shape(c, p, ell(0, 4, 38, 16), '#f4efe4'); if (p) { shape(c, 1, ell(0, 2, 26, 9), '#e6ddd0', 1.4); c.beginPath(); c.ellipse(0, 4, 34, 13, 0, 0, TAU); c.lineWidth = 1.6; c.strokeStyle = '#3f6fb5'; c.stroke(); } });
    add('gm_steamer', (c, p) => { shape(c, p, rr(-34, -6, 68, 32, 8), '#d9b27a'); shape(c, p, ell(0, -8, 34, 10), '#e8c98e'); if (p) { line(c, [[-34, 8], [34, 8]], '#a8803f', 1.6); for (let x = -26; x <= 26; x += 8) line(c, [[x, -14], [x + 3, -3]], 'rgba(150,110,50,0.5)', 1.2); dot(c, 0, -8, 3, '#a8803f'); } });
    add('gm_cup', (c, p) => { shape(c, p, k => { k.moveTo(-20, -14); k.lineTo(20, -14); k.lineTo(15, 22); k.lineTo(-15, 22); k.closePath(); }, '#f4efe4'); shape(c, p, ell(0, -14, 20, 5), '#c9a35a'); if (p) { line(c, [[-17, 4], [17, 4]], '#3f6fb5', 1.6); c.beginPath(); c.moveTo(-2, -22); c.bezierCurveTo(-7, -28, 3, -32, -2, -38); c.lineWidth = 1.6; c.strokeStyle = 'rgba(43,34,53,0.4)'; c.stroke(); } });
    add('gm_menu', (c, p) => { shape(c, p, rr(-26, -32, 52, 64, 4), '#c8322a'); shape(c, p, rr(-20, -26, 40, 52, 2), '#fbf3df'); if (p) { c.font = `700 22px ${FONT.zh}`; c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('菜', 0, -10); c.fillText('单', 0, 14); } });
    add('gm_apron', (c, p) => { shape(c, p, k => { k.moveTo(-14, -30); k.lineTo(14, -30); k.lineTo(16, -12); k.lineTo(28, -8); k.lineTo(24, 30); k.lineTo(-24, 30); k.lineTo(-28, -8); k.lineTo(-16, -12); k.closePath(); }, '#fffaf0'); if (p) { shape(c, 1, rr(-12, 4, 24, 14, 3), '#c8322a', 1.4); line(c, [[-14, -30], [-6, -40], [6, -40], [14, -30]], '#c8322a', 2.4); dot(c, 0, -18, 4, '#e8c35a'); } });
    // the five tastes (chapter 2): a lemon (酸), candied haws on a stick (甜), a bitter melon (苦), a chili (辣), salt (咸)
    add('gm_sour', (c, p) => { shape(c, p, ell(0, 4, 30, 22, -0.2), '#f6dc4a'); if (p) { shape(c, 1, ell(-8, -4, 9, 5, -0.4), 'rgba(255,255,255,0.55)', 0); dot(c, 27, -6, 3, '#d9b02a'); } shape(c, p, ell(14, -24, 9, 4, -0.5), '#6fbf5a'); });
    add('gm_sweet', (c, p) => { if (p) line(c, [[0, -40], [0, 40]], '#a8703f', 3); for (let i = 0; i < 4; i++) { shape(c, p, ell(0, -26 + i * 16, 10, 9), '#d9302a'); if (p) dot(c, -3, -29 + i * 16, 2.6, 'rgba(255,255,255,0.75)'); } });
    add('gm_bitter', (c, p) => { shape(c, p, ell(0, 4, 18, 34, 0.5), '#6aa84a'); if (p) for (const [x, y] of [[-8, -14], [4, -6], [-4, 6], [8, 14], [-10, 18], [10, -18]]) dot(c, x, y, 3, '#8fcf6a'); shape(c, p, rr(14, -36, 8, 10, 3), '#4f7a3a'); });
    add('gm_spicy', (c, p) => { shape(c, p, k => { k.moveTo(-6, -24); k.bezierCurveTo(22, -20, 26, 10, 0, 34); k.bezierCurveTo(10, 8, -6, -6, -20, -14); k.closePath(); }, '#e0302a'); shape(c, p, k => { k.moveTo(-22, -16); k.quadraticCurveTo(-18, -30, -6, -26); k.lineTo(-8, -18); k.closePath(); }, '#5aa84a'); if (p) dot(c, 4, -12, 3, 'rgba(255,255,255,0.6)'); });
    add('gm_salty', (c, p) => { shape(c, p, rr(-16, -18, 32, 46, 8), '#e8eef4'); shape(c, p, rr(-16, -28, 32, 12, 5), '#9aa6b8'); if (p) { for (const [x, y] of [[-6, -24], [0, -22], [6, -24]]) dot(c, x, y, 1.6, INK); [[-28, 20], [24, 26], [-22, 30]].forEach(([x, y]) => dot(c, x, y, 2.4, '#fffaf0')); } });
    // making dumplings (chapter 3): the dough, the rolling pin, the filling, the fold, the pot
    add('gm_dough', (c, p) => { bowl(c, p, '#e8e0d0', '#8a7a5a'); shape(c, p, ell(0, -6, 18, 12), '#fbf4e2'); if (p) { dot(c, -20, -20, 3, '#fffaf0'); dot(c, 22, -16, 2.4, '#fffaf0'); } });
    add('gm_rollpin', (c, p) => { shape(c, p, ell(0, 14, 30, 12), '#fbf4e2'); c.save(); c.rotate(-0.25); shape(c, p, rr(-38, -18, 76, 12, 6), '#c9935a'); c.restore(); });
    add('gm_filling', (c, p) => { bowl(c, p, '#f4efe4', '#5aa84a'); shape(c, p, ell(0, -2, 28, 9), '#d98a6a'); if (p) { for (const [x, y] of [[-14, -2], [-2, -5], [10, -1], [18, -4]]) dot(c, x, y, 3, '#7fbf5a'); chopsticks(c, 4, -40); } });
    add('gm_fold', (c, p) => { dumpling(c, p, 0, 4, 2.0); });
    add('gm_boil', (c, p) => { shape(c, p, rr(-30, -6, 60, 34, 8), '#5a6070'); shape(c, p, ell(0, -6, 30, 8), '#cfe6f0'); if (p) { for (const x of [-12, 8]) dot(c, x, -7, 5, '#fbf6e8'); [-14, 2, 16].forEach(x => { c.beginPath(); c.moveTo(x, -16); c.bezierCurveTo(x - 6, -24, x + 6, -30, x, -38); c.lineWidth = 2; c.strokeStyle = 'rgba(43,34,53,0.35)'; c.stroke(); }); line(c, [[-36, 0], [-30, 0]], INK, 3); line(c, [[30, 0], [36, 0]], INK, 3); } });
    // the festival foods (chapter 4, and the chats): a mooncake, tangyuan, a zongzi
    add('gm_mooncake', (c, p) => { shape(c, p, ell(0, 4, 32, 30), '#c9883a'); if (p) { shape(c, 1, ell(0, 4, 22, 20), '#d9a050', 1.6); c.font = `700 22px ${FONT.zh}`; c.fillStyle = '#8a5a22'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('月', 0, 5); for (let i = 0; i < 12; i++) { const a = i * TAU / 12; dot(c, Math.cos(a) * 27, 4 + Math.sin(a) * 25, 2, '#a86a2a'); } } });
    add('gm_tangyuan', (c, p) => { bowl(c, p, '#f4efe4', '#e86a9a'); shape(c, p, ell(0, -2, 30, 8), '#f6e8d0'); for (const [x, y] of [[-13, -6], [3, -9], [14, -3], [-2, 0]]) { shape(c, p, ell(x, y, 8, 7), '#ffffff'); if (p) dot(c, x - 2, y - 2, 1.8, 'rgba(255,200,210,0.9)'); } });
    add('gm_zongzi', (c, p) => { shape(c, p, poly([[0, -34], [30, 26], [-30, 26]]), '#4f9a4a'); if (p) { line(c, [[-14, -4], [22, 10]], '#d9c08a', 2.4); line(c, [[14, -4], [-22, 10]], '#d9c08a', 2.4); line(c, [[0, -34], [-6, 26]], 'rgba(30,80,30,0.5)', 1.2); } });
  }

  // ============================================================ her lines (lines.js format: one entry per tier, the English weave last)
  // Warm, funny, a little bossy about technique. Nobody genders the player: «cariño», «meu bem», «mein Kind», 孩子.
  const T1 = (es, pt, de, zh, ja, en) => ({ es: [].concat(es), pt: [].concat(pt), de: [].concat(de), zh: [].concat(zh), ja: [].concat(ja), en: [].concat(en) });
  const LT = {
    'gm.hi': T1(['¡Hola, hola! Pasa, cariño. Soy la abuela Mei. ¡Aquí nadie se va con hambre!', '¡Hola, hola! Pasa, cariño. Soy la abuela Mei: llevo cuarenta años cocinando en Alba. ¡Aquí nadie se va con hambre!'],
      ['Olá, olá! Entra, meu bem. Eu sou a vovó Mei. Aqui ninguém sai com fome!', 'Olá, olá! Entra, meu bem. Eu sou a vovó Mei: cozinho em Alba há quarenta anos. Aqui ninguém sai com fome!'],
      ['Hallo, hallo! Komm rein, mein Kind. Ich bin Oma Mei. Bei mir geht niemand hungrig nach Hause!', 'Hallo, hallo! Komm rein, mein Kind. Ich bin Oma Mei und koche seit vierzig Jahren in Alba. Bei mir geht niemand hungrig nach Hause!'],
      ['[你好|nǐ hǎo] ！ [快|kuài] [进来|jìn lái] ！ [我|wǒ] [是|shì] [梅|Méi] [奶奶|nǎi nai] 。', '[你好|nǐ hǎo] ！ [快|kuài] [进来|jìn lái] ！ [我|wǒ] [是|shì] [梅|Méi] [奶奶|nǎi nai] 。 [在|zài] [我|wǒ] [这里|zhè lǐ] ， [谁|shéi] [都|dōu] [不会|bù huì] [饿|è] [着|zhe] [肚子|dù zi] [走|zǒu] ！'],
      ['いらっしゃい ！ どうぞ 、 [入|はい]って ！ わたし は メイ です 。', 'いらっしゃい ！ どうぞ 、 [入|はい]って ！ わたし は メイ 。 アルバ で [四十年|よんじゅうねん] 、 [料理|りょうり] を [作|つく]って います 。'],
      ['Hello, hello! Come in, dear. I’m Grandma Mei. Nobody leaves here hungry!', 'Hello, hello! Come in, dear. I’m Grandma Mei: I’ve been cooking in Alba for forty years. Nobody leaves here hungry!']),
    'gm.back': T1('¡Ay, volviste! Siéntate, siéntate.', 'Ai, você voltou! Senta, senta.', 'Ach, da bist du ja wieder! Setz dich, setz dich.',
      '[哎呀|āi yā] ， [你|nǐ] [又|yòu] [来|lái] [了|le] ！ [快|kuài] [坐|zuò] ， [快|kuài] [坐|zuò] 。', 'あら 、 また [来|き]て くれた の ね ！ どうぞ 、 [座|すわ]って 。', 'Oh, you’re back! Sit down, sit down.'),
    'gm.order': T1('Pídemelo en español, como en el mercado: «Quisiera un plato de jiaozi, por favor».', 'Pede em português, como na feira: «Queria um prato de jiaozi, por favor».',
      'Bestell auf Deutsch, wie auf dem Markt: „Ich hätte gern einen Teller Jiaozi, bitte.“', '[用|yòng] [中文|Zhōng wén] [点菜|diǎn cài] [吧|ba] ： “ [请|qǐng] [给|gěi] [我|wǒ] [一|yī] [盘|pán] [饺子|jiǎo zi] 。 ”',
      '[日本語|にほんご] で [注文|ちゅうもん] して ね 。 「 [餃子|ぎょうざ] を ひとつ ください 」 って 。', 'Order in the language, like at the market: “I’d like a plate of {w.jiaozi}, please.”'),
    'gm.served': T1('¡Aquí tienes! Recién hecho. ¡Que aproveche!', 'Aqui está! Fresquinho. Bom apetite!', 'Bitte schön! Ganz frisch. Guten Appetit!',
      '[来|lái] [了|le] ！ [刚|gāng] [出锅|chū guō] [的|de] 。 [慢慢|màn màn] [吃|chī] ！', 'はい 、 どうぞ ！ できたて です よ 。 めしあがれ ！', 'Here you go! Fresh from the kitchen. Enjoy!'),
    'gm.pack': T1('Lo demás te lo pongo para llevar, para el camino.', 'O resto eu embrulho pra viagem.', 'Den Rest packe ich dir für unterwegs ein.',
      '[剩下|shèng xià] [的|de] [给|gěi] [你|nǐ] [打包|dǎ bāo] ， [路上|lù shang] [吃|chī] 。', '[残|のこ]り は 、 お[弁当|べんとう] に して あげます ね 。', 'I’ll pack the rest for you to take along.'),
    'gm.bye': T1('¡Adiós, cariño! ¡Come bien!', 'Tchau, meu bem! Come direitinho!', 'Tschüss, mein Kind! Iss ordentlich!',
      '[慢|màn] [走|zǒu] ！ [下次|xià cì] [再|zài] [来|lái] ！', 'また [来|き]て ね 。 ちゃんと [食|た]べる ん です よ ！', 'Bye, dear! Eat well!'),
    'gm.more': T1('Cuando suene otra campana, vuelve. ¡Tengo más historias en la cocina!', 'Quando tocar outro sino, volta aqui. Tenho mais histórias na cozinha!',
      'Wenn wieder eine Glocke läutet, komm zurück. Ich habe noch mehr Geschichten in der Küche!',
      '[等|děng] [你|nǐ] [再|zài] [敲响|qiāo xiǎng] [一口|yī kǒu] [钟|zhōng] ， [再|zài] [来|lái] [找|zhǎo] [我|wǒ] 。 [我|wǒ] [还有|hái yǒu] [很多|hěn duō] [故事|gù shi] ！',
      'また [鐘|かね] が [鳴|な]ったら 、 [来|き]て ください ね 。 お[話|はなし] は まだ まだ あります よ ！', 'When another bell rings, come back. I’ve got more stories in this kitchen!'),
    // small talk (when there's no new story)
    'gm.small.1': T1('¿Sabías que en China se saluda diciendo «¿Ya comiste?»? Es como decir «hola».', 'Sabia que na China a gente cumprimenta dizendo «Já comeu?»? É como dizer «oi».',
      'Wusstest du, dass man sich in China mit „Hast du schon gegessen?“ begrüßt? Das heißt einfach „Hallo“.',
      '[在|zài] [中国|Zhōng guó] ， [见面|jiàn miàn] [常|cháng] [说|shuō] “ [吃|chī] [了|le] [吗|ma] ？ ” [就是|jiù shì] [你好|nǐ hǎo] [的|de] [意思|yì si] 。',
      '[中国|ちゅうごく] で は 、 「 ごはん [食|た]べた ？ 」 が あいさつ な ん です よ 。 「 こんにちは 」 と [同|おな]じ です 。', 'Did you know that in China people say hello with “Have you eaten yet?” It just means “hi”.'),
    'gm.small.2': T1('Los palillos nunca se clavan de pie en el arroz. ¡Trae mala suerte! Déjalos sobre el plato.', 'Nunca espete os pauzinhos em pé no arroz. Dá azar! Deixa eles em cima do prato.',
      'Stäbchen steckt man nie senkrecht in den Reis. Das bringt Unglück! Leg sie auf den Teller.',
      '[筷子|kuài zi] [不能|bù néng] [插|chā] [在|zài] [米饭|mǐ fàn] [里|lǐ] ， [不|bù] [吉利|jí lì] 。 [放|fàng] [在|zài] [碗|wǎn] [上|shang] [就|jiù] [好|hǎo] 。',
      'お[箸|はし] を ごはん に [立|た]てて は いけません よ 。 [縁起|えんぎ] が [悪|わる]い ん です 。', 'Never stand your chopsticks up in the rice. It’s bad luck! Lay them across the bowl.'),
    'gm.small.3': T1('Cocinar es como hablar un idioma: al principio quemas el arroz. ¡Luego te sale de maravilla!', 'Cozinhar é como falar uma língua: no começo você queima o arroz. Depois, sai uma maravilha!',
      'Kochen ist wie eine Sprache: Am Anfang brennt der Reis an. Später klappt es wie von selbst!',
      '[做饭|zuò fàn] [就|jiù] [像|xiàng] [学|xué] [语言|yǔ yán] 。 [一开始|yī kāi shǐ] [会|huì] [煮|zhǔ] [糊|hú] ， [后来|hòu lái] [就|jiù] [熟|shú] [了|le] 。',
      '[料理|りょうり] は [言葉|ことば] と [同|おな]じ 。 はじめ は こがします 。 でも 、 そのうち [上手|じょうず] に なります よ 。', 'Cooking is like learning a language: at first you burn the rice. Then one day it just comes out right!'),
    // each dish's story, the first time you order it
    'gm.story.jiaozi.1': T1('Los jiaozi son de mi pueblo, en el norte de China. En Año Nuevo, toda la familia los hace junta, toda la noche.', 'Os jiaozi são da minha terra, no norte da China. No Ano-Novo, a família inteira faz junto, a noite toda.',
      'Jiaozi kommen aus meiner Heimat im Norden Chinas. An Neujahr macht die ganze Familie sie zusammen, die ganze Nacht.',
      '[饺子|jiǎo zi] [是|shì] [我|wǒ] [老家|lǎo jiā] [的|de] [味道|wèi dao] 。 [过年|guò nián] [的|de] [时候|shí hou] ， [一家人|yī jiā rén] [一起|yī qǐ] [包|bāo] [饺子|jiǎo zi] ， [包|bāo] [一|yī] [整夜|zhěng yè] 。',
      '[餃子|ぎょうざ] は 、 [中国語|ちゅうごくご] で 「 ジャオズ 」 。 わたし の ふるさと 、 [中国|ちゅうごく] の [北|きた] の [料理|りょうり] です 。 お[正月|しょうがつ] に は 、 [家族|かぞく] みんな で [作|つく]ります 。',
      '{w.jiaozi} are from my hometown, in the north of China. At New Year the whole family makes them together, all night long.'),
    'gm.story.jiaozi.2': T1('Tienen forma de lingote de plata antiguo. ¡Comerlos trae dinero! Bueno… a mí me trajo clientes.', 'Eles têm forma de lingote de prata antigo. Comer traz dinheiro! Bom… pra mim trouxe clientes.',
      'Sie sehen aus wie alte Silberbarren. Wer sie isst, wird reich! Na ja… mir haben sie Kundschaft gebracht.',
      '[饺子|jiǎo zi] [像|xiàng] [古代|gǔ dài] [的|de] [元宝|yuán bǎo] 。 [吃|chī] [了|le] [会|huì] [发财|fā cái] ！ [我|wǒ] [没有|méi yǒu] [发财|fā cái] ， [可是|kě shì] [客人|kè rén] [越来越|yuè lái yuè] [多|duō] ！',
      'むかし の [銀|ぎん] の お[金|かね] の [形|かたち] です 。 [食|た]べる と 、 お[金持|かねも]ち に なる ！ わたし に は 、 お[客|きゃく]さん が [来|き]ました けど ね 。',
      'They’re shaped like old silver ingots. Eat them and you’ll get rich! Well… I didn’t get rich, but I got lots of customers.'),
    'gm.story.baozi.1': T1('Los baozi se cuecen al vapor, en estas cestas de bambú. Mi abuela decía: un baozi bueno es blando como una nube.', 'Os baozi são cozidos no vapor, nessas cestas de bambu. Minha avó dizia: um baozi bom é macio como uma nuvem.',
      'Baozi werden gedämpft, in diesen Bambuskörben. Meine Oma sagte: Ein gutes Baozi ist weich wie eine Wolke.',
      '[包子|bāo zi] [是|shì] [蒸|zhēng] [的|de] ， [放|fàng] [在|zài] [竹|zhú] [蒸笼|zhēng lóng] [里|lǐ] 。 [我|wǒ] [奶奶|nǎi nai] [说|shuō] ： [好|hǎo] [包子|bāo zi] [软|ruǎn] [得|de] [像|xiàng] [云|yún] [一样|yī yàng] 。',
      '[肉|にく]まん は 、 [中国語|ちゅうごくご] で 「 パオズ 」 。 [竹|たけ] の せいろ で [蒸|む]します 。 わたし の おばあちゃん は 、 「 いい パオズ は [雲|くも] みたい に やわらかい 」 と [言|い]って いました 。',
      '{w.baozi} are steamed, in these bamboo baskets. My grandmother used to say: a good one is as soft as a cloud.'),
    'gm.story.baozi.2': T1('Cuando llegué a Alba, vendía baozi en la plaza, en un carrito. ¡Con ese carrito pagué este restaurante!', 'Quando cheguei em Alba, eu vendia baozi na praça, num carrinho. Com esse carrinho, paguei este restaurante!',
      'Als ich nach Alba kam, habe ich Baozi auf dem Platz verkauft, von einem kleinen Wagen. Mit dem Wagen habe ich dieses Restaurant bezahlt!',
      '[我|wǒ] [刚|gāng] [来|lái] [阿尔巴|Ā ěr bā] [的|de] [时候|shí hou] ， [在|zài] [广场|guǎng chǎng] [上|shang] [推|tuī] [着|zhe] [小车|xiǎo chē] [卖|mài] [包子|bāo zi] 。 [这|zhè] [家|jiā] [饭馆|fàn guǎn] ， [是|shì] [包子|bāo zi] [换来|huàn lái] [的|de] ！',
      'アルバ に [来|き]た とき 、 [広場|ひろば] の [屋台|やたい] で [肉|にく]まん を [売|う]って いました 。 その [屋台|やたい] で 、 この お[店|みせ] を [買|か]った ん です よ ！',
      'When I first came to Alba, I sold {w.baozi} in the plaza from a little cart. That cart paid for this whole restaurant!'),
    'gm.story.noodles.1': T1('En China, en tu cumpleaños comes fideos largos, muy largos. ¡Son para una vida larga! Por eso nunca se cortan.', 'Na China, no aniversário a gente come macarrão comprido, bem comprido. É pra ter vida longa! Por isso nunca se corta.',
      'In China isst man am Geburtstag lange, lange Nudeln. Sie stehen für ein langes Leben! Darum schneidet man sie nie.',
      '[在|zài] [中国|Zhōng guó] ， [过|guò] [生日|shēng rì] [要|yào] [吃|chī] [长寿面|cháng shòu miàn] 。 [面|miàn] [越|yuè] [长|cháng] ， [命|mìng] [越|yuè] [长|cháng] 。 [所以|suǒ yǐ] [千万|qiān wàn] [别|bié] [咬断|yǎo duàn] ！',
      '[中国|ちゅうごく] で は 、 [誕生日|たんじょうび] に [長|なが]い [麺|めん] を [食|た]べます 。 [長生|ながい]き の ため です 。 だから 、 [麺|めん] は [切|き]りません よ 。',
      'In China, on your birthday you eat long, long {w.noodles}. They’re for a long life! So never cut them.'),
    'gm.story.noodles.2': T1('Yo los estiro a mano, ¡zas, zas, zas! Mira qué brazos. Cuarenta años estirando fideos… y otras cosas.', 'Eu puxo tudo na mão, zás, zás, zás! Olha que braços. Quarenta anos puxando macarrão… e outras coisas.',
      'Ich ziehe sie mit der Hand, zack, zack, zack! Schau dir diese Arme an. Vierzig Jahre Nudeln ziehen… und andere Sachen.',
      '[我|wǒ] [的|de] [面|miàn] [都|dōu] [是|shì] [手|shǒu] [拉|lā] [的|de] 。 [你|nǐ] [看|kàn] [我|wǒ] [的|de] [胳膊|gē bo] ！ [拉|lā] [了|le] [四十|sì shí] [年|nián] [面|miàn] … [也|yě] [练|liàn] [了|le] [别的|bié de] 。',
      'わたし は [手|て] で [麺|めん] を のばします 。 ほら 、 この [腕|うで] ！ [四十年|よんじゅうねん] も のばして います から ね 。 … ほか の こと も 。',
      'I pull them by hand, whap, whap, whap! Look at these arms. Forty years of pulling {w.noodles}… and other things.'),
    'gm.story.wonton.1': T1('Los wantán flotan en la sopa como nubecitas. En el sur de China los llaman «tragar nubes».', 'Os wontons boiam na sopa como nuvenzinhas. No sul da China chamam de «engolir nuvens».',
      'Wantans schwimmen in der Suppe wie kleine Wolken. Im Süden Chinas sagt man dazu „Wolken schlucken“.',
      '[馄饨|hún tun] [在|zài] [汤|tāng] [里|lǐ] [漂|piāo] [着|zhe] ， [像|xiàng] [一|yī] [朵朵|duǒ duǒ] [小|xiǎo] [云|yún] 。 [在|zài] [南方|nán fāng] ， [人们|rén men] [叫|jiào] [它|tā] [云吞|yún tūn] 。',
      'ワンタン は 、 スープ の [中|なか] で [小|ちい]さな [雲|くも] みたい に [浮|う]かびます 。 [中国|ちゅうごく] の [南|みなみ] で は 「 [雲|くも] を のむ 」 と [書|か]きます 。',
      '{w.wonton} float in the soup like little clouds. In the south of China they call them “cloud swallows”.'),
    'gm.story.wonton.2': T1('Esta sopa me la hacía mi mamá cuando me ponía enferma. Una cucharada y… ¡a correr otra vez!', 'Essa sopa minha mãe fazia quando eu ficava doente. Uma colherada e… pronta pra correr de novo!',
      'Diese Suppe hat mir meine Mama gekocht, wenn ich krank war. Ein Löffel, und… schon bin ich wieder herumgerannt!',
      '[我|wǒ] [小|xiǎo] [时候|shí hou] [生病|shēng bìng] ， [妈妈|mā ma] [就|jiù] [给|gěi] [我|wǒ] [煮|zhǔ] [馄饨|hún tun] 。 [喝|hē] [一|yī] [口|kǒu] [汤|tāng] ， [病|bìng] [就|jiù] [好|hǎo] [了|le] 。',
      'わたし が [病気|びょうき] の とき 、 [母|はは] が この スープ を [作|つく]って くれました 。 ひとくち で 、 すぐ [元気|げんき] ！',
      'My mother made this soup whenever I was sick. One spoonful and… I was running around again!'),
    'gm.story.springroll.1': T1('Los rollitos de primavera son de la Fiesta de la Primavera, el Año Nuevo chino. Dorados, como barritas de oro.', 'Os rolinhos primavera são da Festa da Primavera, o Ano-Novo chinês. Dourados, como barrinhas de ouro.',
      'Frühlingsrollen isst man zum Frühlingsfest, dem chinesischen Neujahr. Golden wie kleine Goldbarren.',
      '[春卷|chūn juǎn] [是|shì] [春节|Chūn jié] [吃|chī] [的|de] 。 [炸|zhá] [得|de] [金黄|jīn huáng] [金黄|jīn huáng] ， [像|xiàng] [一|yī] [根根|gēn gēn] [金条|jīn tiáo] 。',
      '[春巻|はるま]き は 、 [春節|しゅんせつ] 、 [中国|ちゅうごく] の お[正月|しょうがつ] の [料理|りょうり] です 。 [金|きん] の [棒|ぼう] みたい に [金色|きんいろ] でしょう ？',
      '{w.springroll} are for the Spring Festival, Chinese New Year. Fried golden, like little gold bars.'),
    'gm.story.springroll.2': T1('¡Cuidado, queman! La primera vez que los hice aquí, el cartero se quemó la lengua. Ahora pide diez.', 'Cuidado, tá quente! Na primeira vez que fiz aqui, o carteiro queimou a língua. Agora ele pede dez.',
      'Vorsicht, heiß! Als ich sie hier zum ersten Mal gemacht habe, hat sich der Briefträger die Zunge verbrannt. Jetzt bestellt er zehn.',
      '[小心|xiǎo xīn] [烫|tàng] ！ [我|wǒ] [第一次|dì yī cì] [在|zài] [这里|zhè lǐ] [做|zuò] [春卷|chūn juǎn] ， [邮递员|yóu dì yuán] [烫|tàng] [了|le] [舌头|shé tou] 。 [现在|xiàn zài] [他|tā] [每次|měi cì] [要|yào] [十|shí] [个|gè] ！',
      '[熱|あつ]い から 、 [気|き] を つけて ね ！ はじめて [作|つく]った とき 、 [郵便屋|ゆうびんや]さん が [舌|した] を やけど しました 。 [今|いま] は [十本|じゅっぽん] も [頼|たの]みます よ 。',
      'Careful, they’re hot! The first time I made them here, the postman burned his tongue. Now he orders ten.'),
    'gm.story.tea.1': T1('En mi tierra, cuando alguien te sirve té, das dos golpecitos en la mesa con los dedos. Quiere decir «gracias».', 'Na minha terra, quando alguém te serve chá, você bate dois dedinhos na mesa. Quer dizer «obrigado».',
      'Bei uns zu Hause klopft man zweimal mit den Fingern auf den Tisch, wenn einem jemand Tee einschenkt. Das heißt „danke“.',
      '[别人|bié rén] [给|gěi] [你|nǐ] [倒|dào] [茶|chá] [的|de] [时候|shí hou] ， [用|yòng] [手指|shǒu zhǐ] [敲敲|qiāo qiāo] [桌子|zhuō zi] ， [就是|jiù shì] [谢谢|xiè xie] [的|de] [意思|yì si] 。',
      'わたし の ふるさと で は 、 お[茶|ちゃ] を いれて もらったら 、 [指|ゆび] で テーブル を トントン と たたきます 。 「 ありがとう 」 と いう [意味|いみ] です 。',
      'Back home, when someone pours you {w.tea}, you tap the table twice with your fingers. It means “thank you”.'),
    'gm.story.tea.2': T1('Es té de jazmín. Mi maestro decía: la mente, tranquila como el té en la taza. ¡Bah, cosas de viejos!', 'É chá de jasmim. Meu mestre dizia: a mente, calma como o chá na xícara. Ah, coisa de gente velha!',
      'Das ist Jasmintee. Mein Meister sagte immer: Der Geist ruhig wie der Tee in der Tasse. Ach, alte Leute reden so!',
      '[这|zhè] [是|shì] [茉莉花茶|mò lì huā chá] 。 [我|wǒ] [师父|shī fu] [常|cháng] [说|shuō] ： [心|xīn] [要|yào] [静|jìng] ， [像|xiàng] [杯|bēi] [里|lǐ] [的|de] [茶|chá] 。 [哎呀|āi yā] ， [老|lǎo] [人|rén] [的|de] [话|huà] ！',
      'ジャスミン [茶|ちゃ] です 。 わたし の [師匠|ししょう] は 「 [心|こころ] は お[茶|ちゃ] の よう に [静|しず]か に 」 と [言|い]って いました 。 あら 、 [昔|むかし] の [話|はなし] です よ 。',
      'It’s jasmine {w.tea}. My old master used to say: keep your mind still, like the tea in the cup. Oh, just an old woman’s talk!'),
    // festival foods (her chats, after bells 1, 2 and 3)
    'gm.fest.moon.1': T1('El día quince del octavo mes hay luna llena: la Fiesta del Medio Otoño. Las familias miran la luna juntas y comen pasteles de luna.', 'No dia quinze do oitavo mês tem lua cheia: é a Festa do Meio do Outono. As famílias olham a lua juntas e comem bolos da lua.',
      'Am fünfzehnten Tag des achten Monats ist Vollmond: das Mondfest. Die Familien schauen zusammen den Mond an und essen Mondkuchen.',
      '[八月|bā yuè] [十五|shí wǔ] [是|shì] [中秋节|Zhōng qiū jié] ， [月亮|yuè liang] [最|zuì] [圆|yuán] 。 [一家人|yī jiā rén] [一起|yī qǐ] [看|kàn] [月亮|yuè liang] ， [吃|chī] [月饼|yuè bǐng] 。',
      '[八月|はちがつ] [十五日|じゅうごにち] は [中秋節|ちゅうしゅうせつ] 。 [満月|まんげつ] の [夜|よる] 、 [家族|かぞく] みんな で [月|つき] を [見|み]て 、 [月餅|げっぺい] を [食|た]べます 。',
      'On the fifteenth day of the eighth month the moon is full: the Mid-Autumn Festival. Families watch the moon together and eat mooncakes.'),
    'gm.fest.moon.2': T1('El día que me fui de casa era esa fiesta. Mi mamá me dio un pastel de luna y me dijo: «Cuando veas la luna, piensa en casa».', 'O dia em que eu saí de casa foi nessa festa. Minha mãe me deu um bolo da lua e disse: «Quando vir a lua, pense em casa».',
      'An dem Tag, als ich von zu Hause wegging, war genau dieses Fest. Meine Mama gab mir einen Mondkuchen und sagte: „Wenn du den Mond siehst, denk an zu Hause.“',
      '[我|wǒ] [离开|lí kāi] [家|jiā] [的|de] [那天|nà tiān] ， [正好|zhèng hǎo] [是|shì] [中秋节|Zhōng qiū jié] 。 [妈妈|mā ma] [给|gěi] [了|le] [我|wǒ] [一|yī] [个|gè] [月饼|yuè bǐng] ， [说|shuō] ： “ [看到|kàn dào] [月亮|yuè liang] ， [就|jiù] [想想|xiǎng xiang] [家|jiā] 。 ”',
      'わたし が [家|いえ] を [出|で]た [日|ひ] は 、 [中秋節|ちゅうしゅうせつ] でした 。 [母|はは] は [月餅|げっぺい] を くれて 、 「 [月|つき] を [見|み]たら 、 [家|いえ] を [思|おも]いだして 」 と [言|い]いました 。',
      'The day I left home was that very festival. My mother gave me a mooncake and said: “When you see the moon, think of home.”'),
    'gm.fest.moon.3': T1('Por eso, cuando hay luna llena, preparo pasteles de luna para todo Alba. ¡Así nadie mira la luna sin compañía!', 'Por isso, na lua cheia, faço bolos da lua pra Alba inteira. Assim ninguém olha a lua sem companhia!',
      'Darum backe ich bei Vollmond Mondkuchen für ganz Alba. So schaut niemand den Mond ohne Gesellschaft an!',
      '[所以|suǒ yǐ] [每年|měi nián] [中秋|Zhōng qiū] ， [我|wǒ] [给|gěi] [全|quán] [阿尔巴|Ā ěr bā] [做|zuò] [月饼|yuè bǐng] 。 [这样|zhè yàng] ， [谁|shéi] [也|yě] [不是|bù shì] [一个人|yī gè rén] [看|kàn] [月亮|yuè liang] 。',
      'だから [満月|まんげつ] の [日|ひ] は 、 アルバ の みんな に [月餅|げっぺい] を [作|つく]ります 。 だれ も ひとり で [月|つき] を [見|み]ない よう に ね 。',
      'So at every full moon I bake mooncakes for all of Alba. That way nobody watches the moon alone.'),
    'gm.fest.lantern.1': T1('Quince días después del Año Nuevo es la Fiesta de los Faroles. Se comen tangyuan: bolitas dulces de arroz, redondas como la familia reunida.', 'Quinze dias depois do Ano-Novo é a Festa das Lanternas. A gente come tangyuan: bolinhas doces de arroz, redondas como a família reunida.',
      'Fünfzehn Tage nach Neujahr ist das Laternenfest. Man isst Tangyuan: süße Reisbällchen, rund wie eine Familie, die zusammensitzt.',
      '[正月|zhēng yuè] [十五|shí wǔ] [是|shì] [元宵节|Yuán xiāo jié] 。 [我们|wǒ men] [吃|chī] [汤圆|tāng yuán] ， [甜甜|tián tián] [的|de] ， [圆圆|yuán yuán] [的|de] 。 [汤圆|tāng yuán] ， [就是|jiù shì] [团圆|tuán yuán] 。',
      'お[正月|しょうがつ] の [十五日|じゅうごにち] は 、 ランタン の お[祭|まつ]り です 。 タンユエン と いう 、 [甘|あま]くて まるい お[団子|だんご] を [食|た]べます 。',
      'Fifteen days after New Year comes the Lantern Festival. We eat tangyuan: sweet rice balls, round like a family all together.'),
    'gm.fest.lantern.2': T1('Mi papá hacía los mejores tangyuan del mundo, de sésamo negro. Yo me comía diez y él decía: «¡Vas a rodar como uno!».', 'Meu pai fazia os melhores tangyuan do mundo, de gergelim preto. Eu comia dez e ele dizia: «Você vai rolar igual a um!».',
      'Mein Papa machte die besten Tangyuan der Welt, mit schwarzem Sesam. Ich aß zehn, und er sagte: „Gleich rollst du davon wie einer!“',
      '[我|wǒ] [爸爸|bà ba] [做|zuò] [的|de] [黑芝麻|hēi zhī ma] [汤圆|tāng yuán] [是|shì] [世界|shì jiè] [上|shang] [最|zuì] [好吃|hǎo chī] [的|de] 。 [我|wǒ] [一次|yī cì] [吃|chī] [十|shí] [个|gè] ， [他|tā] [说|shuō] ： “ [你|nǐ] [也|yě] [要|yào] [变成|biàn chéng] [汤圆|tāng yuán] [了|le] ！ ”',
      '[父|ちち] の [黒|くろ]ごま の タンユエン は 、 [世界|せかい] で いちばん おいしかった 。 わたし が [十個|じゅっこ] [食|た]べる と 、 「 お[団子|だんご] みたい に [転|ころ]がる ぞ ！ 」 って 。',
      'My dad made the best tangyuan in the world, with black sesame. I’d eat ten, and he’d say: “You’ll turn into one yourself!”'),
    'gm.fest.dragon.1': T1('En la Fiesta del Bote del Dragón comemos zongzi: arroz envuelto en hojas de bambú. Es por un poeta antiguo, Qu Yuan.', 'Na Festa do Barco-Dragão a gente come zongzi: arroz embrulhado em folhas de bambu. É por causa de um poeta antigo, Qu Yuan.',
      'Beim Drachenbootfest essen wir Zongzi: Reis, eingewickelt in Bambusblätter. Wegen eines alten Dichters, Qu Yuan.',
      '[五月|wǔ yuè] [初五|chū wǔ] [是|shì] [端午节|Duān wǔ jié] ， [我们|wǒ men] [吃|chī] [粽子|zòng zi] 。 [这|zhè] [是|shì] [为了|wèi le] [纪念|jì niàn] [古代|gǔ dài] [的|de] [诗人|shī rén] [屈原|Qū Yuán] 。',
      '[端午節|たんごせつ] に は 、 ちまき を [食|た]べます 。 [竹|たけ] の [葉|は] で もち[米|ごめ] を つつんだ もの です 。 [昔|むかし] の [詩人|しじん] 、 [屈原|くつげん] の お[話|はなし] から です 。',
      'At the Dragon Boat Festival we eat zongzi: sticky rice wrapped in bamboo leaves. It’s for an ancient poet, Qu Yuan.'),
    'gm.fest.dragon.2': T1('Cuando el poeta cayó al río, la gente salió en botes y tiró arroz al agua, para que los peces no se lo comieran. Por eso hay carreras de botes-dragón.', 'Quando o poeta caiu no rio, o povo saiu de barco e jogou arroz na água, pros peixes não comerem ele. Por isso tem corrida de barco-dragão.',
      'Als der Dichter in den Fluss fiel, ruderten die Leute in Booten hinaus und warfen Reis ins Wasser, damit die Fische ihn nicht fraßen. Darum gibt es Drachenbootrennen.',
      '[屈原|Qū Yuán] [掉|diào] [进|jìn] [了|le] [江|jiāng] [里|lǐ] 。 [人们|rén men] [划|huá] [着|zhe] [船|chuán] [去|qù] [找|zhǎo] [他|tā] ， [还|hái] [把|bǎ] [米|mǐ] [扔|rēng] [进|jìn] [江|jiāng] [里|lǐ] ， [不让|bù ràng] [鱼|yú] [吃|chī] [他|tā] 。 [所以|suǒ yǐ] [有|yǒu] [龙舟|lóng zhōu] [比赛|bǐ sài] 。',
      '[屈原|くつげん] が [川|かわ] に [落|お]ちた とき 、 [人々|ひとびと] は [舟|ふね] を こいで 、 [川|かわ] に お[米|こめ] を [投|な]げました 。 それ で 、 [竜|りゅう] の [舟|ふね] の レース が ある ん です 。',
      'When the poet fell into the river, people rowed out in boats and threw rice into the water so the fish wouldn’t eat him. That’s why there are dragon boat races.'),
    'gm.fest.dragon.3': T1('De joven yo tocaba el tambor en un bote-dragón. ¡Bum, bum, bum! Íbamos tan rápido que ganamos tres años seguidos.', 'Quando eu era nova, tocava o tambor num barco-dragão. Bum, bum, bum! A gente ia tão rápido que ganhou três anos seguidos.',
      'Als ich jung war, habe ich auf einem Drachenboot die Trommel geschlagen. Bumm, bumm, bumm! Wir waren so schnell, dass wir dreimal hintereinander gewonnen haben.',
      '[我|wǒ] [年轻|nián qīng] [的|de] [时候|shí hou] ， [在|zài] [龙舟|lóng zhōu] [上|shang] [打鼓|dǎ gǔ] 。 [咚|dōng] ！ [咚|dōng] ！ [咚|dōng] ！ [我们|wǒ men] [划|huá] [得|de] [飞快|fēi kuài] ， [连续|lián xù] [三|sān] [年|nián] [拿|ná] [了|le] [第一|dì yī] ！',
      '[若|わか]い ころ 、 わたし は [竜|りゅう] の [舟|ふね] で [太鼓|たいこ] を たたいて いました 。 ドン 、 ドン 、 ドン ！ [三年|さんねん] [続|つづ]けて [優勝|ゆうしょう] した ん です よ 。',
      'When I was young, I played the drum on a dragon boat. Boom, boom, boom! We went so fast we won three years in a row.'),
    // her own story (after you've tried every dish): and Mimo's apron
    'gm.life.1': T1('Llegué a Alba hace cuarenta años con una maleta, una olla y las recetas de mi mamá en la cabeza.', 'Cheguei em Alba há quarenta anos com uma mala, uma panela e as receitas da minha mãe na cabeça.',
      'Ich kam vor vierzig Jahren nach Alba, mit einem Koffer, einem Topf und Mamas Rezepten im Kopf.',
      '[四十|sì shí] [年|nián] [前|qián] ， [我|wǒ] [带|dài] [着|zhe] [一个|yī gè] [箱子|xiāng zi] 、 [一口|yī kǒu] [锅|guō] [来到|lái dào] [阿尔巴|Ā ěr bā] 。 [妈妈|mā ma] [的|de] [菜谱|cài pǔ] ， [都|dōu] [在|zài] [我|wǒ] [脑子|nǎo zi] [里|lǐ] 。',
      '[四十年|よんじゅうねん] [前|まえ] 、 わたし は スーツケース と お[鍋|なべ] ひとつ で アルバ に [来|き]ました 。 [母|はは] の レシピ は 、 ぜんぶ [頭|あたま] の [中|なか] 。',
      'I came to Alba forty years ago with a suitcase, a pot, and my mother’s recipes in my head.'),
    'gm.life.2': T1('Al principio no entendía a nadie. Aprendí la lengua en la cocina: «sal», «más», «¡qué rico!». La comida es la mejor maestra.', 'No começo eu não entendia ninguém. Aprendi a língua na cozinha: «sal», «mais», «que delícia!». A comida é a melhor professora.',
      'Am Anfang habe ich niemanden verstanden. Die Sprache habe ich in der Küche gelernt: „Salz“, „mehr“, „lecker!“. Essen ist der beste Lehrer.',
      '[一开始|yī kāi shǐ] ， [别人|bié rén] [说|shuō] [的|de] [话|huà] [我|wǒ] [都|dōu] [听不懂|tīng bù dǒng] 。 [我|wǒ] [是|shì] [在|zài] [厨房|chú fáng] [里|lǐ] [学|xué] [的|de] ： “ [盐|yán] ” 、 “ [再|zài] [来|lái] [一点|yī diǎn] ” 、 “ [好吃|hǎo chī] ！ ” 。 [吃饭|chī fàn] [是|shì] [最好|zuì hǎo] [的|de] [老师|lǎo shī] 。',
      'はじめ は 、 だれ の [言葉|ことば] も わかりません でした 。 [台所|だいどころ] で [覚|おぼ]えた ん です 。 「 [塩|しお] 」 、 「 もっと 」 、 「 おいしい ！ 」 。 [料理|りょうり] は いちばん の [先生|せんせい] です 。',
      'At first I couldn’t understand anyone. I learned the language in the kitchen: “salt”, “more”, “yum!”. Food is the best teacher.'),
    'gm.life.3': T1('Tú también aprendes así, ¿verdad? Hablando, probando, equivocándote. ¡Toma, para {mimo}! Un delantal.', 'Você também aprende assim, né? Falando, provando, errando. Toma, pra {mimo}! Um avental.',
      'Du lernst auch so, oder? Sprechen, probieren, Fehler machen. Hier, für {mimo}! Eine Schürze.',
      '[你|nǐ] [也|yě] [是|shì] [这样|zhè yàng] [学|xué] [的|de] ， [对|duì] [吧|ba] ？ [多|duō] [说|shuō] ， [多|duō] [尝|cháng] ， [不怕|bù pà] [错|cuò] 。 [来|lái] ， [这个|zhè ge] [围裙|wéi qún] [送给|sòng gěi] {mimo} ！',
      'あなた も そう でしょう ？ [話|はな]して 、 [味見|あじみ] して 、 まちがえて 。 はい 、 {mimo} に エプロン を どうぞ ！',
      'And that’s how you’re learning too, right? Talk, taste, make mistakes. Here, for {mimo}! An apron.'),
  };
  function registerLines() { if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v; }

  // ============================================================ 3D helpers (school.js's way: pieces → one vertex-colored toon mesh + one merged ink hull)
  const GEO = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 16), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
    ball: new THREE.SphereGeometry(1, 14, 10), cone: new THREE.ConeGeometry(1, 1, 12), half: new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2),
    torus: new THREE.TorusGeometry(1, 0.12, 8, 24) };
  const GSIZE = new Map([[GEO.box, [1, 1, 1]], [GEO.cyl, [2, 1, 2]], [GEO.cyl8, [2, 1, 2]], [GEO.ball, [2, 2, 2]], [GEO.cone, [2, 1, 2]], [GEO.half, [2, 1, 2]]]);
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  const M4 = (x, y, z, sx, sy, sz, rx, ry, rz) => new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx || 0, ry || 0, rz || 0)), _s.set(sx, sy, sz));
  function Kit() {
    const P = [], H = [], GL = [];
    let F = new THREE.Matrix4();
    const k = {
      P, H, GL,
      frame(x, y, z, ry = 0) { F = M4(x, y, z, 1, 1, 1, 0, ry, 0); return k; },
      add(geo, color, x, y, z, sx, sy, sz, rx, ry, rz, o = {}) {
        sy = sy === undefined ? sx : sy; sz = sz === undefined ? sx : sz;
        const m = F.clone().multiply(M4(x, y, z, sx, sy, sz, rx, ry, rz));
        (o.glow ? GL : P).push({ geo, color, m });
        const w = o.ink === undefined ? 0.016 : o.ink, g = GSIZE.get(geo);
        if (w > 0 && g) H.push({ geo, color: INK, m: F.clone().multiply(M4(x, y, z, sx + (2 * w) / g[0], sy + (2 * w) / g[1], sz + (2 * w) / g[2], rx, ry, rz)) });
        return k;
      },
      box(x, y, z, w, h, d, color, o = {}) { return k.add(GEO.box, color, x, y, z, w, h, d, o.rx, o.ry, o.rz, o); },
      cyl(x, y, z, r, h, color, o = {}) { return k.add(o.geo || GEO.cyl, color, x, y, z, r, h, r, o.rx, o.ry, o.rz, o); },
      ball(x, y, z, rx, ry, rz, color, o = {}) { return k.add(GEO.ball, color, x, y, z, rx, ry, rz, o.rx || 0, o.ry || 0, o.rz || 0, o); },
    };
    return k;
  }
  function bakeInto(group, k, o = {}) {
    const out = {};
    if (k.P.length) { out.mesh = new THREE.Mesh(TK.merge(k.P), TK.toon('#ffffff', { vc: true, rim: 0.22 })); out.mesh.castShadow = !o.noShadow; out.mesh.receiveShadow = true; group.add(out.mesh); }
    if (k.H.length) { out.hull = new THREE.Mesh(TK.merge(k.H), new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })); group.add(out.hull); }
    if (k.GL.length) { out.glow = new THREE.Mesh(TK.merge(k.GL), new THREE.MeshBasicMaterial({ vertexColors: true })); group.add(out.glow); }
    return out;
  }
  const canvasTex = (w, h, draw) => { const t = TK.canvasTex(w, h, draw); t.anisotropy = 4; return t; };
  const plane = (w, h, tex, o = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshToonMaterial({ map: tex, gradientMap: TK.grad, transparent: !!o.alpha, alphaTest: o.alpha ? 0.4 : 0, side: o.double ? THREE.DoubleSide : THREE.FrontSide }));
    m.receiveShadow = true; return m;
  };
  const glowSprite = (c, s) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: c, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })); sp.scale.setScalar(s); return sp; };
  // vertical text on a board (chars top to bottom, as big as they fit), a red seal, text that fits a width
  function vtext(c, chars, x, y0, y1, maxW, color, font) {
    const n = [...chars].length, step = (y1 - y0) / n, px = Math.min(maxW, step * 0.86);
    c.font = `700 ${Math.round(px)}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color;
    [...chars].forEach((ch, i) => c.fillText(ch, x, y0 + step * (i + 0.5)));
  }
  function seal(c, x, y, s, glyph) {
    c.save(); c.translate(x, y); c.rotate(-0.06);
    c.fillStyle = RED; c.fillRect(-s / 2, -s / 2, s, s);
    c.strokeStyle = PAPER; c.lineWidth = s * 0.05; c.strokeRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
    c.fillStyle = PAPER; c.font = `700 ${Math.round(s * 0.62)}px ${FONT.zh}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(glyph, 0, s * 0.03);
    c.restore();
  }
  function fitText(c, text, maxW, px, weight, family) { let s = Math.round(px); c.font = `${weight} ${s}px ${family}`; while (s > 10 && c.measureText(text).width > maxW) { s--; c.font = `${weight} ${s}px ${family}`; } return s; }
  const LATIN = 'Bahnschrift, "Segoe UI", sans-serif';
  // a red paper lantern with gold caps and a tassel (o.s: size), lit
  function lantern(k, x, y, z, s = 1, glows, cord = 0.3) {
    if (cord) k.cyl(x, y + 0.36 * s + cord / 2, z, 0.008, cord, INK, { ink: 0, geo: GEO.cyl8 });
    k.add(GEO.ball, RED, x, y, z, 0.26 * s, 0.3 * s, 0.26 * s, 0, 0, 0, { glow: true });
    k.cyl(x, y + 0.29 * s, z, 0.13 * s, 0.06 * s, '#d9a03a').cyl(x, y - 0.29 * s, z, 0.13 * s, 0.06 * s, '#d9a03a');
    k.add(GEO.cone, GOLD, x, y - 0.47 * s, z, 0.05 * s, 0.24 * s, 0.05 * s, Math.PI, 0, 0, { ink: 0 });
    if (glows) glows.push({ x, y, z, c: '#ff9a5a', s: 2.2 * s });
  }

  // ============================================================ outside: house 15 dressed up as the Plum Garden (every language)
  // The house faces the north street (its front is local +z). Over the door a black-and-gold signboard in the game's language,
  // a red lantern each side, a string of little lanterns, a red banner on a pole (梅园餐馆 in gold, top to bottom), and the
  // menu board on the pavement. Read them (signs.js); "Go in" at the door (story.js STORY.extra).
  let OUT = null;
  function house() {
    if (typeof TOWN === 'undefined' || !TOWN.layout) return null;
    const b = TOWN.layout.buildings.filter(q => q.kind === 'house')[HOUSE_N - 1];
    if (!b) return null;
    const c = Math.cos(b.rot), s = Math.sin(b.rot), at = b.doorAt || null;
    const world = (lx, lz) => ({ x: b.x + lx * c + lz * s, z: b.z - lx * s + lz * c });
    const dlx = at ? (at.x - b.x) * c - (at.z - b.z) * s : 0;
    return { b, world, dlx, front: b.d / 2, yaw: b.rot, GY: (typeof TOWN !== 'undefined' && TOWN.GY) || 0.25 };
  }
  function plaqueTex(l) {
    return canvasTex(1024, 256, c => {
      c.fillStyle = '#c9a24a'; c.fillRect(0, 0, 1024, 256); c.fillStyle = '#1d1416'; c.fillRect(14, 14, 996, 228);
      c.strokeStyle = '#c9a24a'; c.lineWidth = 4; c.strokeRect(28, 28, 968, 200);
      c.fillStyle = GOLD; c.textAlign = 'center'; c.textBaseline = 'middle';
      if (l === 'zh') {
        c.font = `700 150px ${FONT.zh}`; c.fillText('梅园餐馆', 512, cmode() === 'roman' ? 110 : 132);
        if (cmode() === 'roman') { c.font = `700 40px ${LATIN}`; c.fillText('Méiyuán Cānguǎn', 512, 206); }
        return;
      }
      if (l === 'ja') {
        c.font = `700 46px ${FONT.ja}`; c.fillText(cmode() === 'roman' ? 'CHŪKA RYŌRI' : '中華料理', 512, 66);
        c.font = `700 128px ${FONT.ja}`; c.fillText(cmode() === 'roman' ? 'Baien' : '梅園', 512, 160);
        return;
      }
      seal(c, 110, 128, 120, '梅'); seal(c, 914, 128, 120, '园');
      const px1 = fitText(c, NAME.kind[l] || NAME.kind.en, 620, 48, 800, LATIN); c.fillText(NAME.kind[l] || NAME.kind.en, 512, 74);
      fitText(c, NAME.place[l] || NAME.place.en, 640, 96, 800, 'Georgia, "Times New Roman", serif'); c.fillText(NAME.place[l] || NAME.place.en, 512, 158 + (px1 > 40 ? 0 : 4));
    });
  }
  function bannerTex() {
    return canvasTex(256, 800, c => {
      c.fillStyle = '#b3241e'; c.fillRect(0, 0, 256, 800);
      c.fillStyle = '#d9a03a'; c.fillRect(0, 0, 256, 18); c.fillRect(0, 782, 256, 18);
      c.strokeStyle = 'rgba(232,195,90,0.7)'; c.lineWidth = 5; c.strokeRect(20, 34, 216, 732);
      vtext(c, '梅园餐馆', 128, 60, 740, 170, GOLD, FONT.zh);
    });
  }
  // the menu board (a little A-frame chalkboard): the dishes, their pictures and prices, in the language and mode
  function menuDraw(c, l) {
    c.fillStyle = '#6b4a2e'; c.fillRect(0, 0, 512, 640); c.fillStyle = '#23302a'; c.fillRect(18, 18, 476, 604);
    c.fillStyle = '#f4efe4'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const title = { es: 'MENÚ', pt: 'CARDÁPIO', de: 'SPEISEKARTE', en: 'MENU', zh: cmode() === 'roman' && l === 'zh' ? 'CÀIDĀN' : '菜单', ja: cmode() === 'roman' && l === 'ja' ? 'MENYŪ' : 'メニュー' }[l] || 'MENU';
    fitText(c, title, 420, 64, 800, l === 'zh' ? FONT.zh : l === 'ja' ? FONT.ja : LATIN); c.fillText(title, 256, 70);
    DISHES.forEach((d, i) => {
      const y = 150 + i * 78;
      if (typeof ICONS !== 'undefined') try { c.drawImage(ICONS.canvas(d.icon, 128), 40, y - 32, 64, 64); } catch (e) { /* (no icon yet) */ }
      const word = l === 'zh' || l === 'ja' ? plainOf(d[l][0], { cap: false }) : (d[l] ? d[l][0][0] : d.key);
      c.textAlign = 'left'; c.fillStyle = '#f4efe4'; fitText(c, word, 260, 40, 700, l === 'zh' ? FONT.zh : l === 'ja' ? FONT.ja : LATIN); c.fillText(word, 120, y);
      c.textAlign = 'right'; c.fillStyle = '#f2c94c'; c.font = `800 40px ${LATIN}`; c.fillText(String(d.price), 440, y);
      c.fillStyle = '#ffc93c'; c.beginPath(); c.arc(462, y, 11, 0, TAU); c.fill();
    });
  }
  function buildOutside() {
    const h = house(); if (!h || !G) return null;
    const g = new THREE.Group(); g.name = 'grandma-outside'; g.position.set(h.b.x, h.GY, h.b.z); g.rotation.y = h.yaw;
    G.w3d.scene.add(g);
    const F = h.front, dx = h.dlx, k = Kit(), glows = [];
    // the signboard over the door, on two brackets
    const plaque = plane(1.9, 0.48, plaqueTex(L()), { double: true }); plaque.position.set(dx, 3.0, F + 0.1); g.add(plaque);
    k.box(dx, 3.0, F + 0.05, 2.0, 0.56, 0.06, '#c9a24a').box(dx, 3.33, F + 0.12, 2.2, 0.06, 0.24, LACQ);
    // a red lantern each side of the door
    for (const s of [-1, 1]) { const x = dx + s * 0.95; if (Math.abs(x) > h.b.w / 2 - 0.15) continue; k.box(x, 2.48, F + 0.18, 0.05, 0.05, 0.36, INK, { ink: 0 }); lantern(k, x, 2.02, F + 0.36, 0.95, glows, 0.12); }
    // a string of little lanterns along the front
    const n = 6, x0 = -h.b.w / 2 + 0.3, x1 = h.b.w / 2 - 0.3;
    for (const [a, b] of [[x0, dx - 1.12], [dx + 1.12, x1]]) if (b - a > 0.2) k.add(GEO.cyl8, INK, (a + b) / 2, 3.12, F + 0.14, 0.008, b - a, 0.008, 0, 0, HALF, { ink: 0 });
    for (let i = 0; i < n; i++) { const x = x0 + (x1 - x0) * (i + 0.5) / n; if (Math.abs(x - dx) < 1.2) continue; lantern(k, x, 2.98, F + 0.14, 0.42, null, 0); }
    // the banner on its pole, sticking out from the wall (south of the door, toward the plaza)
    const bx = Math.max(-h.b.w / 2 + 0.25, dx - 2.05);
    k.cyl(bx, 3.0, F + 0.5, 0.025, 1.0, '#3a2a2a', { rx: HALF, ink: 0.008 }).ball(bx, 3.0, F + 1.0, 0.05, 0.05, 0.05, GOLD, { ink: 0.006 });
    const ban = plane(0.42, 1.32, bannerTex(), { double: true }); ban.position.set(bx, 2.3, F + 0.62); ban.rotation.y = HALF; g.add(ban);
    // the menu board on the pavement (an A-frame: both faces)
    const mx = Math.max(-h.b.w / 2 + 0.4, dx - 2.0), mz = F + 0.82;
    const mcv = document.createElement('canvas'); mcv.width = 512; mcv.height = 640;
    const mtex = new THREE.CanvasTexture(mcv); mtex.anisotropy = 4;
    const drawMenu = l => { menuDraw(mcv.getContext('2d'), l); mtex.needsUpdate = true; };
    if (typeof SIGNS !== 'undefined' && SIGNS.board) SIGNS.board(l => drawMenu(G && G.state ? L() : l)); else drawMenu(L());
    for (const s of [-1, 1]) {      // (each face a little in front of its backing board, both leaning in at the top)
      const m = plane(0.66, 0.84, mtex); m.position.set(mx, 0.6, mz + s * 0.235); m.rotation.set(s * -0.32, s < 0 ? Math.PI : 0, 0); g.add(m);
      k.box(mx, 0.6, mz + s * 0.19, 0.72, 0.92, 0.03, '#6b4a2e', { rx: s * -0.32, ink: 0.01 });
    }
    k.box(mx, 1.06, mz, 0.76, 0.04, 0.12, '#5a3a22');
    // a pot of bamboo by the door
    const px = dx + 0.95 > h.b.w / 2 - 0.25 ? dx - 0.95 : dx + 0.95;
    k.cyl(px, 0.22, F + 0.35, 0.2, 0.44, '#2f4a5a');
    for (let i = 0; i < 3; i++) { const hh = 1.1 + i * 0.25; k.cyl(px + (i - 1) * 0.06, 0.4 + hh / 2, F + 0.35, 0.02, hh, '#6a9a3a', { ink: 0.005 }); k.ball(px + (i - 1) * 0.06 + 0.1, 0.42 + hh, F + 0.35, 0.18, 0.04, 0.07, '#5a8a3a', { ink: 0.005, ry: i }); }
    const baked = bakeInto(g, k);
    const sprites = glows.map(q => { const s = glowSprite(q.c, q.s); s.position.set(q.x, q.y, q.z); g.add(s); return s; });
    const W = (lx, lz) => h.world(lx, lz);
    return { g, baked, sprites, plaque, l: L(), mode: cmode(), h, menuSolid: W(mx, mz), menuAt: W(mx, mz + 0.9), signAt: W(dx, F + 1.2), door: W(dx, F + 0.75), doorIn: W(dx, F + 0.3) };
  }
  const SOLID = { x: 1e5, z: 1e5, r: 0.42, grandma: true };       // the menu board's solid (WORLD.extra)
  function outdoor() {
    if (!G) return;
    if (!OUT) { try { OUT = buildOutside() || { broken: true }; } catch (e) { console.error('[grandma]', e); OUT = { broken: true }; } }
    if (OUT.broken) return;
    if (OUT.l !== L() || OUT.mode !== cmode()) { OUT.l = L(); OUT.mode = cmode(); const t = plaqueTex(L()); OUT.plaque.material.map.dispose(); OUT.plaque.material.map = t; OUT.plaque.material.needsUpdate = true; }
    const town = G.town && G.town.group;
    const vis = !(G.indoors && G.indoors()) && (!town || town.visible);
    OUT.g.visible = vis;
    if (!WORLD.extra.includes(SOLID)) WORLD.extra.push(SOLID);
    if (vis) { SOLID.x = OUT.menuSolid.x; SOLID.z = OUT.menuSolid.z; } else { SOLID.x = SOLID.z = 1e5; }
    if (vis) { const t = (G.w3d && G.w3d.time && G.w3d.time.value) || 0; OUT.sprites.forEach((s, i) => { s.material.opacity = 0.36 + 0.08 * Math.sin(t * 4.7 + i * 2.3); }); }
    if (!OUT.signed && typeof SIGNS !== 'undefined' && SIGNS.add) {
      OUT.signed = true;
      SIGNS.add({ id: 'grandma-sign', x: OUT.signAt.x, z: OUT.signAt.z, r: 1.2, when: () => !inside, card: () => signCard() });
      SIGNS.add({ id: 'grandma-menu', x: OUT.menuAt.x, z: OUT.menuAt.z, r: 1.3, when: () => !inside, card: () => { readMenu(); return menuCard(); } });
    }
  }
  // the Read cards: the signboard, the menu (reading it shows you the prices at her counter too)
  function signCard() {
    const l = L(), cj = l === 'zh' || l === 'ja', look = { face: '#1d1416', edge: '#c9a24a', ink: GOLD };
    const lines = cj ? [{ text: NAME.kind[l], en: 'Chinese restaurant', look }, { text: NAME.place[l], en: 'The Plum Garden', look }]
      : [{ text: NAME.kind[l] || NAME.kind.en, en: 'Chinese restaurant', look }, { text: NAME.place[l] || NAME.place.en, en: 'The Plum Garden', look }];
    if (l !== 'zh') lines.push({ text: l === 'ja' ? '梅园餐馆' : '梅园餐馆 · Méiyuán Cānguǎn', en: 'the same name in Chinese, on the red banner: the Plum Garden Restaurant', say: '', look: { face: '#b3241e', edge: '#d9a03a', ink: GOLD } });
    return { tag: 'The restaurant’s signs', lines };
  }
  function menuCard() {
    const l = L(), cj = l === 'zh' || l === 'ja';
    const word = d => (cj ? d[l][0] : d[l] ? d[l][0][0] : d.key);
    return { tag: cj ? (l === 'zh' ? 'The menu (菜单)' : 'The menu (メニュー)') : 'The menu by the door',
      lines: DISHES.map(d => ({ text: word(d), en: `${d.gloss} · ${d.price} coin${d.price > 1 ? 's' : ''}`, look: { face: '#23302a', edge: '#6b4a2e', ink: '#f4efe4' } })) };
  }
  function readMenu() { const s = G.state; s.shopAsked = s.shopAsked || []; for (const id of DISH_IDS) if (!s.shopAsked.includes(id)) s.shopAsked.push(id); }

  // ============================================================ the room (floats at X0, Y0, Z0; built on the first visit)
  // Terracotta tiles, cream walls over a red dado with a gold key-fret frieze. North: the counter with Grandma Mei behind it,
  // the kitchen (the stove and its wok, the bamboo steamers, the shelf of jars, the noodle rack), six red plaques of the menu
  // over it, and in the kitchen's east corner a hanging painting of a plum branch (zh: the secret door behind it). The dining
  // room: three round tables (yours in the middle), regulars eating, lanterns, bamboo, photos on the west wall (one of them
  // a young woman in a fighting stance…), the prep table for making dumplings by the east wall. Walls face inward (a dollhouse).
  let ROOM = null;
  const SPOT = {
    spawn: { x: 0, z: HD - 1.3 }, exit: { x: 0, z: HD - 0.5 }, gm: { x: -1.6, z: -3.2 }, talk: { x: -1.6, z: -1.35 }, menu: { x: -4.3, z: -1.4 },
    photo: { x: -HW + 1.3, z: -0.5 }, table: { x: -1.0, z: 2.0 }, seat: { x: 0.05, z: 2.35 }, you: { x: -1.0, z: 3.25 },
    prep: { x: 4.3, z: -0.55 }, prepMimo: { x: 4.3, z: 0.4 }, gmPrep: { x: 4.3, z: -1.5 }, secret: { x: 5.6, z: -HD + 0.75 }, door: { x: 5.6, z: -HD },
  };
  const TABLES = [{ x: -4.7, z: 1.6 }, { x: SPOT.table.x, z: SPOT.table.z }, { x: 3.6, z: 2.6 }];
  function floorTex() {
    return canvasTex(512, 512, c => {
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        c.fillStyle = (i + j) % 2 ? '#b8664a' : '#c97a58'; c.fillRect(i * 128, j * 128, 128, 128);
        c.fillStyle = 'rgba(60,30,20,0.08)'; for (let k = 0; k < 6; k++) c.fillRect(i * 128 + ((k * 37 + j * 13) % 110), j * 128 + ((k * 53 + i * 29) % 110), 14, 3);
      }
      c.strokeStyle = '#e9d8c0'; c.lineWidth = 5; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 128, 0); c.lineTo(i * 128, 512); c.moveTo(0, i * 128); c.lineTo(512, i * 128); c.stroke(); }
    });
  }
  // cream plaster, a gold key-fret (回纹) frieze on dark red at the top
  function wallTex() {
    return canvasTex(512, 512, c => {
      c.fillStyle = '#f6ead2'; c.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(120,90,60,${0.025 + (i % 5) * 0.01})`; c.fillRect((i * 37) % 512, (i * 91) % 512, 2 + (i % 3), 2); }
      c.fillStyle = '#7a1f1a'; c.fillRect(0, 0, 512, 54); c.fillStyle = GOLD; c.fillRect(0, 54, 512, 5);
      c.strokeStyle = GOLD; c.lineWidth = 4;
      for (let x = 0; x < 512; x += 64) { c.beginPath(); c.moveTo(x + 6, 44); c.lineTo(x + 6, 10); c.lineTo(x + 50, 10); c.lineTo(x + 50, 38); c.lineTo(x + 20, 38); c.lineTo(x + 20, 22); c.lineTo(x + 36, 22); c.stroke(); }
    });
  }
  // a red plaque of the wall menu: the dish top to bottom in gold, its price at the foot
  function dishPlaqueTex(d) {
    return canvasTex(160, 320, c => {
      c.fillStyle = '#d9a03a'; c.fillRect(0, 0, 160, 320); c.fillStyle = '#a8231d'; c.fillRect(8, 8, 144, 304);
      const ch = d.zh[0].replace(/\[([^|\]]+)\|[^\]]*\]/g, '$1').replace(/\s/g, '');
      vtext(c, ch, 80, 26, ch.length > 1 ? 236 : 170, 110, GOLD, FONT.zh);
      c.fillStyle = '#ffd96b'; c.font = `800 44px ${LATIN}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(d.price), 64, 278);
      c.beginPath(); c.arc(108, 278, 13, 0, TAU); c.fill();
    });
  }
  // a hanging scroll: plum blossoms on a branch (the painting that hides her door), or one character
  function plumTex() {
    return canvasTex(320, 640, c => {
      c.fillStyle = '#5a6b4a'; c.fillRect(0, 0, 320, 640); c.fillStyle = '#f3ead2'; c.fillRect(24, 50, 272, 540);
      c.strokeStyle = '#3a2a22'; c.lineCap = 'round';
      const br = (pts, w) => { c.lineWidth = w; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); };
      br([[40, 560], [110, 470], [130, 380], [200, 300], [250, 180]], 14); br([[130, 380], [80, 300], [70, 220]], 8); br([[200, 300], [270, 330]], 6); br([[110, 470], [210, 450]], 6);
      const flower = (x, y, r) => { c.fillStyle = '#e86a8a'; for (let i = 0; i < 5; i++) { const a = i * TAU / 5; c.beginPath(); c.arc(x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6, r * 0.55, 0, TAU); c.fill(); } c.fillStyle = '#ffd96b'; c.beginPath(); c.arc(x, y, r * 0.3, 0, TAU); c.fill(); };
      [[250, 180, 16], [230, 220, 12], [200, 300, 15], [270, 330, 13], [70, 220, 14], [80, 300, 12], [130, 380, 15], [210, 450, 13], [165, 340, 10], [95, 260, 9]].forEach(([x, y, r]) => flower(x, y, r));
      c.fillStyle = INK; c.font = `700 40px ${FONT.zh}`; c.textAlign = 'center'; c.textBaseline = 'middle'; ['梅', '花'].forEach((ch, i) => c.fillText(ch, 268, 90 + i * 46));
      seal(c, 268, 196, 34, '梅');
    });
  }
  function charScrollTex(ch, silk) {
    return canvasTex(256, 640, c => {
      c.fillStyle = silk; c.fillRect(0, 0, 256, 640); c.fillStyle = '#f6efdc'; c.fillRect(26, 60, 204, 520);
      c.fillStyle = INK; c.font = `400 170px ${FONT.zh}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(ch, 128, 300);
      seal(c, 186, 520, 36, '梅');
    });
  }
  // the photos on the west wall: her family, her baozi cart in the plaza, and… a young woman in a fighting stance, with a cup
  function photoTex(kind) {
    return canvasTex(256, 200, c => {
      c.fillStyle = '#5a3a22'; c.fillRect(0, 0, 256, 200); c.fillStyle = kind === 'kungfu' ? '#e8e2d4' : '#f0e4c8'; c.fillRect(14, 14, 228, 172);
      const ink = kind === 'kungfu' ? '#3a3a3a' : '#5a4a3a', fig = (x, y, s, col) => { c.fillStyle = col || ink; c.beginPath(); c.arc(x, y - 30 * s, 9 * s, 0, TAU); c.fill(); c.fillRect(x - 8 * s, y - 20 * s, 16 * s, 32 * s); };
      if (kind === 'family') { c.fillStyle = '#c9b48a'; c.fillRect(14, 120, 228, 66); [[60, 140, 1.1], [100, 140, 1.15], [140, 150, 0.8], [170, 150, 0.75], [205, 140, 1.1]].forEach(([x, y, s], i) => fig(x, y, s, ['#a85a4a', '#4a6a8a', '#d9a03a', '#6a9a5a', '#8a5a7a'][i])); }
      else if (kind === 'cart') { c.fillStyle = '#a8d0e8'; c.fillRect(14, 14, 228, 90); c.fillStyle = '#b3241e'; c.fillRect(70, 96, 110, 46); c.fillStyle = '#e8c35a'; c.fillRect(64, 84, 122, 14); c.fillStyle = INK; c.beginPath(); c.arc(90, 150, 12, 0, TAU); c.arc(160, 150, 12, 0, TAU); c.fill(); fig(208, 150, 1.0, '#a8322c'); c.fillStyle = '#fffaf0'; c.font = `700 22px ${FONT.zh}`; c.textAlign = 'center'; c.fillText('包子', 125, 124); }
      else {      // black and white: a young woman in a low horse stance, fists at her waist, a trophy cup at her feet
        c.fillStyle = '#cfc8b8'; c.fillRect(14, 140, 228, 46);
        c.fillStyle = ink; c.beginPath(); c.arc(128, 62, 13, 0, TAU); c.fill(); c.fillRect(116, 74, 24, 38);
        c.lineWidth = 9; c.lineCap = 'round'; c.strokeStyle = ink; c.beginPath(); c.moveTo(118, 110); c.lineTo(94, 128); c.lineTo(90, 150); c.moveTo(138, 110); c.lineTo(162, 128); c.lineTo(166, 150); c.moveTo(118, 84); c.lineTo(100, 98); c.moveTo(138, 84); c.lineTo(160, 80); c.lineTo(184, 78); c.stroke();
        c.fillStyle = '#9a9a9a'; c.beginPath(); c.moveTo(196, 132); c.lineTo(222, 132); c.lineTo(214, 152); c.lineTo(204, 152); c.closePath(); c.fill(); c.fillRect(203, 152, 12, 10);
        c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(14, 14, 228, 172);
      }
    });
  }
  function buildRoom() {
    const g = new THREE.Group(); g.name = 'grandma-room'; g.position.set(X0, Y0, Z0); g.visible = false; G.w3d.scene.add(g);
    const k = Kit(), solids = [], glows = [];
    const ft = floorTex(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(HW / 1.2, HD / 1.2);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2 * HW, 0.3, 2 * HD), new THREE.MeshToonMaterial({ map: ft, gradientMap: TK.grad })); floor.position.y = -0.15; floor.receiveShadow = true; g.add(floor);
    const wt = wallTex(), wm = new THREE.MeshToonMaterial({ map: wt, gradientMap: TK.grad });
    for (const [w, x, z, ry] of [[2 * HW, 0, -HD, 0], [2 * HW, 0, HD, Math.PI], [2 * HD, -HW, 0, HALF], [2 * HD, HW, 0, -HALF]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), wm); m.position.set(x, WH / 2, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    }
    solids.push({ obox: 1, x: 0, z: -HD - 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: 0, z: HD + 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 },
      { obox: 1, x: -HW - 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 }, { obox: 1, x: HW + 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 });
    const WOOD = '#4a2a20', WOOD2 = '#7a4a32', RED2 = '#a8231d';
    // the red dado with a gold line, all round but the south (the camera looks in from there)
    k.box(0, 0.5, -HD + 0.03, 2 * HW, 1.0, 0.05, RED2, { ink: 0 }).box(-HW + 0.03, 0.5, 0, 0.05, 1.0, 2 * HD, RED2, { ink: 0 }).box(HW - 0.03, 0.5, 0, 0.05, 1.0, 2 * HD, RED2, { ink: 0 });
    k.box(0, 1.02, -HD + 0.06, 2 * HW, 0.05, 0.05, GOLD, { ink: 0 }).box(-HW + 0.06, 1.02, 0, 0.05, 0.05, 2 * HD, GOLD, { ink: 0 }).box(HW - 0.06, 1.02, 0, 0.05, 0.05, 2 * HD, GOLD, { ink: 0 });
    for (const [x, z] of [[-HW, -HD], [HW, -HD], [-HW, HD], [HW, HD]]) k.box(x + (x < 0 ? 0.1 : -0.1), WH / 2, z + (z < 0 ? 0.1 : -0.1), 0.22, WH, 0.22, WOOD);
    // the counter: red lacquer, gold trim, a light wooden top; a cutting board with spring onions, a bowl of eggs
    const cx = -2.1, cz = -2.4, cw = 8.6;
    k.box(cx, 0.43, cz, cw, 0.86, 0.8, RED2).box(cx, 0.9, cz, cw + 0.12, 0.08, 0.92, '#c9935a').box(cx, 0.8, cz + 0.41, cw, 0.05, 0.02, GOLD, { ink: 0 });
    for (let i = 0; i < 5; i++) k.box(cx - cw / 2 + 0.9 + i * 1.7, 0.43, cz + 0.405, 0.9, 0.44, 0.02, '#8a1c18', { ink: 0.006 });
    k.box(SPOT.gm.x, 0.11, SPOT.gm.z, 1.2, 0.22, 0.8, WOOD2);                                       // (her step behind the counter: she's small)
    k.box(-3.3, 0.96, cz - 0.05, 0.62, 0.04, 0.4, '#d9b27a');
    for (let i = 0; i < 5; i++) k.cyl(-3.45 + i * 0.07, 1.0, cz - 0.05, 0.016, 0.42, '#6fbf5a', { rz: HALF, ink: 0.004 });
    k.cyl(0.7, 1.02, cz, 0.2, 0.12, '#f4efe4').ball(0.66, 1.08, cz, 0.06, 0.07, 0.06, '#fbf3e2', { ink: 0.006 }).ball(0.76, 1.08, cz + 0.05, 0.06, 0.07, 0.06, '#e8c9a0', { ink: 0.006 });
    solids.push({ obox: 1, x: cx, z: cz, hw: cw / 2 + 0.06, hd: 0.46, rot: 0 });
    // the kitchen: the stove and its wok, the steamers, the shelf, the noodle rack, a water jar
    k.box(-5.5, 0.43, -4.85, 1.5, 0.86, 0.9, '#3d3f48').box(-5.5, 0.88, -4.85, 1.56, 0.05, 0.96, '#5a5d68');
    k.add(GEO.half, '#1d1d22', -5.75, 0.92, -4.85, 0.42, 0.22, 0.42, Math.PI, 0, 0).cyl(-5.75, 1.02, -4.4, 0.02, 0.5, '#8a5a2e', { rx: 0.9, ink: 0.005 });
    k.add(GEO.ball, '#ff8a3a', -5.75, 0.82, -4.85, 0.3, 0.06, 0.3, 0, 0, 0, { glow: true, ink: 0 });
    glows.push({ x: -5.75, y: 0.95, z: -4.85, c: '#ff8a3a', s: 1.4 });
    k.cyl(-5.05, 1.02, -4.9, 0.16, 0.22, '#c9a24a').cyl(-5.05, 1.16, -4.9, 0.05, 0.08, '#2b2235');
    k.box(-3.6, 0.43, -4.9, 0.95, 0.86, 0.8, '#3d3f48');
    for (let i = 0; i < 3; i++) k.cyl(-3.6, 0.97 + i * 0.19, -4.9, 0.34, 0.17, i % 2 ? '#d9b27a' : '#e2c08a');
    k.add(GEO.half, '#d9b27a', -3.6, 1.5, -4.9, 0.35, 0.16, 0.35).ball(-3.6, 1.68, -4.9, 0.05, 0.05, 0.05, '#a8803f');
    k.box(3.45, 1.3, -5.3, 1.6, 0.06, 0.38, WOOD2).box(3.45, 1.95, -5.3, 1.6, 0.06, 0.38, WOOD2);
    for (let i = 0; i < 5; i++) { const x = 2.85 + i * 0.3; k.cyl(x, 1.48 + (i % 2) * 0.03, -5.28, 0.1, 0.3 + (i % 3) * 0.06, ['#6b3a22', '#c9a24a', '#3f6f62', '#a8231d', '#e8e0d0'][i]); k.cyl(x, 2.08, -5.28, 0.11, 0.2, ['#f4efe4', '#3f6fb5', '#f4efe4', '#c9a24a', '#6b3a22'][i]); }
    k.box(0.45, 0.9, -4.9, 0.08, 1.8, 0.08, WOOD).box(2.05, 0.9, -4.9, 0.08, 1.8, 0.08, WOOD).cyl(1.25, 1.72, -4.9, 0.03, 1.7, WOOD, { rz: HALF, ink: 0.006 });
    for (let i = 0; i < 14; i++) k.box(0.62 + i * 0.09, 1.25 - (i % 3) * 0.05, -4.9 + ((i % 2) - 0.5) * 0.04, 0.025, 0.9 + (i % 3) * 0.1, 0.025, '#f7e3a8', { ink: 0 });
    k.cyl(6.35, 0.38, -4.75, 0.4, 0.76, '#5a3a2a').cyl(6.35, 0.77, -4.75, 0.42, 0.04, '#3a2a22');
    solids.push({ obox: 1, x: -5.5, z: -4.85, hw: 0.8, hd: 0.5, rot: 0 }, { obox: 1, x: -3.6, z: -4.9, hw: 0.5, hd: 0.45, rot: 0 }, { obox: 1, x: 1.25, z: -4.9, hw: 0.9, hd: 0.2, rot: 0 },
      { x: 6.35, z: -4.75, r: 0.48 }, { obox: 1, x: 3.45, z: -5.3, hw: 0.85, hd: 0.25, rot: 0 });
    // the menu on the north wall: six red plaques over the counter
    DISHES.forEach((d, i) => { const m = plane(0.62, 1.24, dishPlaqueTex(d)); m.position.set(-5.7 + i * 0.96, 3.0, -HD + 0.05); g.add(m); k.box(-5.7 + i * 0.96, 3.0, -HD + 0.03, 0.68, 1.3, 0.03, '#d9a03a', { ink: 0.008 }); });
    // the plum painting in the kitchen's east corner, and the round door behind it (zh: the way to her courtyard)
    const D = SPOT.door;
    const door = new THREE.Group(); door.position.set(D.x, 0, D.z + 0.035); g.add(door);
    door.add(TK.part(new THREE.CircleGeometry(0.78, 32), '#3a2418', [0, 1.05, 0], null, { ink: 0 }));
    door.add(TK.part(new THREE.TorusGeometry(0.8, 0.06, 8, 32), '#8a5a2e', [0, 1.05, 0.01], null, { ink: 0.008 }));
    for (let i = -1; i <= 1; i++) door.add(TK.part(GEO.box, '#5a3a22', [i * 0.26, 1.05, 0.012], [0.03, 1.4 - Math.abs(i) * 0.35, 0.01], { ink: 0 }));
    door.add(TK.part(GEO.ball, '#d9a03a', [0.42, 1.05, 0.04], [0.05, 0.05, 0.03], { ink: 0.004 }));
    const doorGlow = glowSprite('#ffd59a', 0.1); doorGlow.position.set(D.x, 1.05, D.z + 0.3); doorGlow.material.opacity = 0; g.add(doorGlow);
    const painting = new THREE.Group(); painting.position.set(D.x, 2.42, D.z + 0.15); g.add(painting);
    const pmesh = plane(1.86, 2.3, plumTex()); pmesh.position.y = -1.15; painting.add(pmesh);
    painting.add(TK.part(GEO.cyl, '#5a3a22', [0, 0.02, 0.02], [0.03, 2.0, 0.03], { rot: [0, 0, HALF], ink: 0.006 }));
    const roller = TK.part(GEO.cyl, '#5a3a22', [0, -2.3, 0.02], [0.035, 2.0, 0.035], { rot: [0, 0, HALF], ink: 0.006 }); painting.add(roller);
    const ladle = new THREE.Group(); ladle.position.set(D.x + 1.08, 1.7, D.z + 0.1); g.add(ladle);
    ladle.add(TK.part(GEO.cyl, '#8a5a2e', [0, -0.25, 0], [0.02, 0.5, 0.02], { ink: 0.005 }));
    ladle.add(TK.part(GEO.half, '#9aa0aa', [0, -0.55, 0], [0.11, 0.07, 0.11], { rot: [Math.PI, 0, 0], ink: 0.006 }));
    k.box(D.x + 1.08, 1.72, D.z + 0.05, 0.06, 0.06, 0.1, '#5a5d68', { ink: 0 });
    // the dining room: three round tables with red cloths and stools, bowls and chopsticks
    TABLES.forEach((t, i) => {
      k.cyl(t.x, 0.36, t.z, 0.1, 0.72, WOOD).cyl(t.x, 0.03, t.z, 0.36, 0.06, WOOD).cyl(t.x, 0.75, t.z, 0.82, 0.06, '#b3241e').cyl(t.x, 0.69, t.z, 0.84, 0.1, '#9a1e18', { ink: 0.01 });
      k.cyl(t.x, 0.8, t.z, 0.36, 0.03, '#d9e4e8', { ink: 0.006 });
      for (let s = 0; s < 4; s++) { const a = s * HALF + 0.4, sx = t.x + Math.cos(a) * 1.18, sz = t.z + Math.sin(a) * 1.18; k.cyl(sx, 0.4, sz, 0.24, 0.08, '#c8322a').cyl(sx, 0.2, sz, 0.06, 0.4, WOOD); }
      if (i !== 1) for (let s = 0; s < 2; s++) { const a = s * Math.PI + 0.2, bx = t.x + Math.cos(a) * 0.5, bz = t.z + Math.sin(a) * 0.5; k.cyl(bx, 0.84, bz, 0.13, 0.08, '#f4efe4').cyl(bx, 0.88, bz, 0.11, 0.01, i ? '#e8a85a' : '#e9c27a', { ink: 0 }); k.box(bx + 0.18, 0.84, bz, 0.02, 0.012, 0.32, '#8a5a2e', { ink: 0 }); }
      solids.push({ x: t.x, z: t.z, r: 0.95 });
    });
    // the prep table by the east wall (a board, a sack of flour, a bowl), where you make dumplings
    const P = SPOT.prep;
    k.box(P.x, 0.52, P.z, 1.9, 0.07, 0.95, '#c9935a');
    for (const [x, z] of [[-0.85, -0.4], [0.85, -0.4], [-0.85, 0.4], [0.85, 0.4]]) k.box(P.x + x, 0.25, P.z + z, 0.07, 0.5, 0.07, WOOD);
    k.box(P.x - 0.2, 0.57, P.z, 1.1, 0.03, 0.65, '#e2c08a', { ink: 0.006 });
    k.cyl(P.x + 1.25, 0.34, P.z - 0.1, 0.24, 0.68, '#efe6d2').cyl(P.x + 1.25, 0.7, P.z - 0.1, 0.16, 0.06, '#d9c9a8');
    solids.push({ obox: 1, x: P.x, z: P.z, hw: 0.98, hd: 0.5, rot: 0 }, { x: P.x + 1.25, z: P.z - 0.1, r: 0.3 });
    // the photos (west wall), a scroll with 家 (home) on the east wall, bamboo in pots, lanterns
    [['family', -1.6], ['kungfu', -0.5], ['cart', 0.6]].forEach(([kind, z]) => { const m = plane(0.62, 0.48, photoTex(kind)); m.position.set(-HW + 0.05, 2.0 + (kind === 'kungfu' ? 0.12 : 0), z); m.rotation.y = HALF; g.add(m); });
    const sc = plane(0.66, 1.65, charScrollTex('家', '#7a3a3a')); sc.position.set(HW - 0.05, 2.15, 0.8); sc.rotation.y = -HALF; g.add(sc);
    k.box(HW - 0.07, 1.31, 0.8, 0.05, 0.05, 0.76, WOOD).box(HW - 0.07, 3.0, 0.8, 0.05, 0.05, 0.72, WOOD);
    for (const [x, z] of [[-HW + 0.55, HD - 0.6], [HW - 0.55, HD - 0.6], [-HW + 0.55, -1.2]]) {
      k.cyl(x, 0.24, z, 0.28, 0.48, '#2f4a5a');
      for (let i = 0; i < 4; i++) { const ox = Math.cos(i * 1.7) * 0.1, oz = Math.sin(i * 1.7) * 0.1, hh = 1.5 + i * 0.25; k.cyl(x + ox, 0.45 + hh / 2, z + oz, 0.025, hh, '#6a9a3a', { ink: 0.006 }); k.ball(x + ox + 0.12, 0.5 + hh, z + oz, 0.22, 0.05, 0.08, '#5a8a3a', { ink: 0.006, ry: i }); }
      solids.push({ x, z, r: 0.38 });
    }
    // (the lanterns hang clear of the line from the door to the wall menu)
    for (const [x, z, s] of [[-6.0, 1.6, 1.15], [1.0, 0.8, 1.15], [4.6, 1.6, 1.15], [-6.4, -1.8, 0.85], [2.4, -1.8, 0.85]]) lantern(k, x, 3.35, z, s, glows, WH - 3.35 - 0.36 * s);
    k.box(0, 0.016, HD - 0.55, 1.8, 0.02, 0.8, '#7a1f1a', { ink: 0 });
    solids.push({ x: SPOT.gm.x, z: SPOT.gm.z, r: 0.5 });
    const baked = bakeInto(g, k);
    const sprites = glows.map(q => { const s = glowSprite(q.c, q.s); s.position.set(q.x, q.y, q.z); g.add(s); return s; });
    WORLD.addSolids(solids.map(s => Object.assign({}, s, { x: X0 + s.x, z: Z0 + s.z, grandma: true })));
    WORLD.addPlatforms([{ box: [X0 - HW, X0 + HW, Z0 - HD, Z0 + HD], top: Y0, grandma: true }]);
    ROOM = { g, baked, sprites, painting, roller, pmesh, ladle, door, doorGlow, steam: [], dish: null, actors: [] };
    ROOM.gm = makeGrandma(g, 'cook'); ROOM.gm.st = { x: X0 + SPOT.gm.x, z: Z0 + SPOT.gm.z, y: Y0, yaw: 0, baseYaw: 0, talk: 0, talking: false, top: 1.95 };
    ROOM.gm.v.root.position.set(SPOT.gm.x, 0, SPOT.gm.z);
    makeRegulars(g);
    if (S().secret) openPainting(true);
    return ROOM;
  }

  // ============================================================ Grandma Mei (an ACTORS villager, dressed) and the regulars
  // 'cook': a deep red jacket with gold frog buttons, a white apron, a jade pin in her silver bun, a ladle in her right hand.
  // 'master' (kungfu.js): white practice clothes, a black sash with red trim. Small, round, quick.
  function makeGrandma(parent, outfit = 'cook') {
    const P = ACTORS.PRESETS;
    if (!P.gm_mei) P.gm_mei = { dress: '#a8322c', apron: '#fbf6ee', skin: '#efc6a0', hair: '#e9e5dd', hat: null, glasses: false, bun: true, eyes: 'happy', h: 0.9, wide: 1.06 };
    if (!P.gm_master) P.gm_master = { dress: '#f4f1ea', apron: null, skin: '#efc6a0', hair: '#e9e5dd', hat: null, glasses: false, bun: true, eyes: 'happy', h: 0.9, wide: 1.0 };
    const v = ACTORS.villager(outfit === 'master' ? 'gm_master' : 'gm_mei'), part = TK.part, Gk = TK.G;
    v.head.add(part(Gk.cyl, '#4fae8a', [0, 0.43, -0.2], [0.014, 0.42, 0.014], { rot: [0, 0, 1.3], ink: 0.006 }));          // the jade pin
    v.head.add(part(Gk.sphere, '#4fae8a', [0.2, 0.48, -0.2], [0.035, 0.035, 0.035], { ink: 0.004 }));
    for (const s of [-1, 1]) v.head.add(part(Gk.box, '#c9c4bb', [s * 0.1, 0.29, 0.25], [0.08, 0.018, 0.02], { rot: [0, 0, -s * 0.15], ink: 0 }));   // her brows
    let held = null;
    if (outfit === 'master') {
      v.body.add(part(new THREE.TorusGeometry(0.31, 0.05, 8, 24), '#1d1822', [0, 0.52, 0], null, { rot: [HALF, 0, 0], ink: 0.006 }));      // the sash
      v.body.add(part(Gk.box, '#1d1822', [0.18, 0.4, 0.22], [0.06, 0.26, 0.03], { rot: [0.2, 0, 0.15], ink: 0.006 }));
      v.body.add(part(Gk.box, '#c8322a', [0, 0.76, 0.265], [0.05, 0.34, 0.02], { rot: [-0.35, 0, 0], ink: 0 }));                          // red trim
    } else {
      for (let i = 0; i < 3; i++) v.body.add(part(Gk.sphere, '#e8c35a', [0, 0.84 - i * 0.1, 0.235 + i * 0.012], [0.03, 0.022, 0.02], { ink: 0.004 }));   // frog buttons
      held = new THREE.Group(); held.position.set(0, -0.32, 0.05); v.arms[0].add(held);                                                   // a ladle
      held.add(part(Gk.cyl, '#8a5a2e', [0, 0.1, 0], [0.018, 0.34, 0.018], { ink: 0.005 }));
      held.add(part(new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2), '#9aa0aa', [0, -0.1, 0.02], [0.08, 0.05, 0.08], { rot: [Math.PI, 0, 0], ink: 0.006 }));
    }
    v.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    parent.add(v.root);
    return { v, held, st: null, waved: false, pose: null, poseT: 0 };
  }
  // the regulars: two friends at the west table, someone alone at the east one, eating (their arms bob, chopsticks up)
  function makeRegulars(g) {
    const P = ACTORS.PRESETS;
    if (!P.gm_c1) Object.assign(P, {
      gm_c1: { dress: '#3f6fb5', apron: null, skin: '#e6b48c', hair: '#4a2f27', hat: 'cap', glasses: false, bun: false, eyes: 'open', h: 0.95 },
      gm_c2: { dress: '#5a9a5a', apron: null, skin: '#f0c8a0', hair: '#c9c4bb', hat: null, glasses: true, bun: true, eyes: 'happy', h: 0.92 },
      gm_c3: { dress: '#d9a03a', apron: null, skin: '#c98e62', hair: '#2e2420', hat: null, glasses: false, bun: false, eyes: 'open', h: 1.0 } });
    const T = TABLES;
    [['gm_c1', T[0].x - 0.95, T[0].z, HALF], ['gm_c2', T[0].x + 0.95, T[0].z, -HALF], ['gm_c3', T[2].x, T[2].z + 0.98, Math.PI]].forEach(([key, x, z, yaw], i) => {
      const v = ACTORS.villager(key); v.root.position.set(x, -0.3, z); v.root.rotation.y = yaw;
      const sticks = new THREE.Group(); sticks.position.set(0, -0.3, 0.06); v.arms[0].add(sticks);
      sticks.add(TK.part(TK.G.cyl, '#8a5a2e', [0.02, 0.12, 0.06], [0.01, 0.3, 0.01], { rot: [0.6, 0, 0], ink: 0 }));
      sticks.add(TK.part(TK.G.cyl, '#8a5a2e', [-0.02, 0.12, 0.06], [0.01, 0.3, 0.01], { rot: [0.5, 0, 0], ink: 0 }));
      v.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
      g.add(v.root); ROOM.actors.push({ v, x, z, yaw, ph: i * 2.1 });
    });
  }
  // a dish on your table (the one you ordered): a plate, a bowl, a steamer, a cup… built from little parts
  function dishModel(id) {
    const g = new THREE.Group(), part = TK.part, Gk = TK.G;
    const add = (geo, col, pos, sc, o) => { const m = part(geo, col, pos, sc, Object.assign({ ink: 0.006 }, o || {})); g.add(m); return m; };
    const plate = () => add(Gk.cyl, '#f4efe4', [0, 0.01, 0], [0.3, 0.02, 0.3]);
    const bowl = (soup) => { add(new THREE.SphereGeometry(1, 16, 8, 0, TAU, Math.PI / 2, Math.PI / 2), '#f4efe4', [0, 0.16, 0], [0.22, 0.16, 0.22]); add(Gk.cyl, soup, [0, 0.135, 0], [0.2, 0.01, 0.2], { ink: 0 }); };
    switch (id) {
      case 'w.jiaozi': plate(); for (let i = 0; i < 5; i++) { const a = i * TAU / 5; add(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI), '#fbf6e8', [Math.cos(a) * 0.15, 0.03, Math.sin(a) * 0.15], [0.07, 0.05, 0.045], { rot: [0, -a, 0] }); } break;
      case 'w.baozi': add(Gk.cyl, '#d9b27a', [0, 0.07, 0], [0.24, 0.14, 0.24]); for (const [x, z] of [[-0.08, -0.06], [0.09, -0.04], [0, 0.09]]) add(Gk.sphere, '#fffaf0', [x, 0.16, z], [0.085, 0.065, 0.085]); break;
      case 'w.noodles': bowl('#e8a85a'); for (let i = 0; i < 6; i++) add(Gk.cyl, '#f7dc8a', [-0.1 + i * 0.04, 0.15, 0], [0.008, 0.2, 0.008], { rot: [HALF, 0, 0.2 * (i - 2.5)], ink: 0 }); add(Gk.sphere, '#6fbf5a', [0.05, 0.15, 0.06], [0.03, 0.01, 0.03], { ink: 0 }); break;
      case 'w.wonton': bowl('#e9c27a'); for (const [x, z] of [[-0.08, -0.04], [0.06, -0.06], [0.02, 0.08]]) add(Gk.sphere, '#fbf6e8', [x, 0.15, z], [0.06, 0.03, 0.05]); break;
      case 'w.springroll': plate(); for (let i = 0; i < 3; i++) add(Gk.cyl, '#e8a43a', [-0.09 + i * 0.09, 0.05, 0], [0.035, 0.24, 0.035], { rot: [HALF, 0, 0.15 * (i - 1)] }); break;
      default: add(Gk.cyl, '#4f8a7a', [-0.08, 0.1, 0], [0.11, 0.16, 0.11]); add(Gk.cyl, '#f4efe4', [0.13, 0.05, 0.05], [0.06, 0.09, 0.06]); add(Gk.cyl, '#c9a35a', [0.13, 0.095, 0.05], [0.05, 0.005, 0.05], { ink: 0 });
    }
    // chopsticks beside it (not for tea)
    if (id !== 'w.tea') for (const s of [-1, 1]) add(Gk.cyl, '#8a5a2e', [0.32, 0.012, s * 0.02], [0.008, 0.36, 0.008], { rot: [HALF, 0, 0], ink: 0 });
    return g;
  }
  function serveDish(id) {
    if (!ROOM) return;
    if (ROOM.dish) { ROOM.g.remove(ROOM.dish); ROOM.dish = null; }
    const d = dishModel(id); d.position.set(SPOT.table.x, 0.82, SPOT.table.z); ROOM.g.add(d); ROOM.dish = d; ROOM.dishT = 0;
  }

  // ============================================================ Mimo's apron (围裙; the reward in every language)
  let APRON = null;
  function apron() {
    if (APRON || !G || !G.cast || !G.cast.mimo) return APRON;
    const a = new THREE.Group(), part = TK.part, Gk = TK.G;
    a.add(part(Gk.sphere, '#c8322a', [0, 0.125, 0.235], [0.225, 0.13, 0.105], { ink: 0.012 }));          // (a red edge, so it reads on Mimo's cream body; below the mouth)
    a.add(part(Gk.sphere, '#ffffff', [0, 0.125, 0.248], [0.205, 0.115, 0.1], { ink: 0 }));
    a.add(part(Gk.box, '#c8322a', [0, 0.1, 0.34], [0.12, 0.065, 0.02], { ink: 0.006 }));
    a.add(part(Gk.sphere, '#e8c35a', [0, 0.1, 0.352], [0.024, 0.024, 0.01], { ink: 0 }));
    a.add(part(new THREE.TorusGeometry(0.325, 0.022, 6, 28), '#c8322a', [0, 0.2, 0], [1, 1, 1], { rot: [HALF, 0, 0], ink: 0.006 }));       // the waist tie
    a.add(part(Gk.box, '#c8322a', [0, 0.2, -0.34], [0.12, 0.06, 0.04], { ink: 0.006 }));                  // its bow at the back
    a.visible = false; G.cast.mimo.body.add(a); APRON = a;
    return a;
  }
  const apronOn = () => !!(G && G.state && G.state.gm && G.state.gm.apron && G.state.gm.wear === 'apron');

  // ============================================================ the room, every frame
  function openPainting(now) {
    if (!ROOM) return;
    ROOM.rollT = now ? 1 : 0; ROOM.rolling = !now;
    if (now) { ROOM.painting.scale.y = 0.04; ROOM.painting.position.y = 2.42; ROOM.doorGlow.material.opacity = 0.35; }
  }
  function animateRoom(dt, t) {
    const R = ROOM, Y = G.sim.you;
    // Grandma Mei: she turns to you when you're near, waves when you come in, stirs or chops when she's alone
    const gm = R.gm, st = gm.st, dx = Y.x - st.x, dz = Y.z - st.z, d = Math.hypot(dx, dz);
    if (gm.walkTo) { const w = gm.walkTo, k = Math.min(1, dt * 2.2); st.x += (w.x - st.x) * k; st.z += (w.z - st.z) * k; if (Math.hypot(w.x - st.x, w.z - st.z) < 0.03) gm.walkTo = null; }
    const goal = gm.face ? Math.atan2(gm.face.x - st.x, gm.face.z - st.z) : d < 8 ? Math.atan2(dx, dz) : st.baseYaw;
    st.yaw = dampAngle(st.yaw, goal, 4, dt); st.talk = damp(st.talk, st.talking ? 1 : 0, 10, dt);
    if (d < 5 && !gm.waved) { gm.waved = true; st.waveT = 1.4; }
    if (d > 8) gm.waved = false;
    st.waveT = Math.max(0, (st.waveT || 0) - dt);
    // (behind the counter she stands on her step)
    gm.lift = damp(gm.lift || 0, Math.hypot(st.x - X0 - SPOT.gm.x, st.z - Z0 - SPOT.gm.z) < 0.5 ? 0.22 : 0, 8, dt); st.top = 1.95 + gm.lift;
    ACTORS.animateVillager(gm.v, { x: st.x - X0, y: gm.lift, z: st.z - Z0, yaw: st.yaw, talk: st.talk, wave: st.waveT > 0, walking: !!gm.walkTo }, dt, t);
    if (!st.waveT && !gm.walkTo) {
      const a = gm.v.arms[0];
      if (gm.pose === 'show') a.rotation.set(-1.4, 0, 0.1);
      else if (d > 3.2 && !st.talking) a.rotation.set(-0.9 + Math.sin(t * 6) * 0.25, Math.sin(t * 3) * 0.3, 0.25);        // stirring
      else a.rotation.set(-0.7 + Math.sin(t * 1.3) * 0.06, 0, 0.2);
    }
    for (const c of R.actors) {
      ACTORS.animateVillager(c.v, { x: c.x, y: -0.3, z: c.z, yaw: c.yaw, talk: 0, wave: false, walking: false }, dt, t);
      const k = Math.max(0, Math.sin(t * 1.7 + c.ph)); c.v.arms[0].rotation.set(-1.1 - k * 0.5, 0, 0.3);
    }
    R.sprites.forEach((s, i) => { s.material.opacity = 0.36 + 0.08 * Math.sin(t * 5.1 + i * 2.1) + 0.04 * Math.sin(t * 13 + i); });
    if (R.rolling) {           // the painting rolls itself up (zh, chapter 5): the round door behind it
      R.rollT = Math.min(1, R.rollT + dt * 0.7); const e = R.rollT * R.rollT * (3 - 2 * R.rollT);
      R.painting.scale.y = 1 - 0.96 * e; R.doorGlow.material.opacity = 0.35 * e;
      if (R.rollT >= 1) R.rolling = false;
    }
    if (S().secret && !R.rolling) R.doorGlow.material.opacity = 0.28 + 0.08 * Math.sin(t * 2);
    if (R.dish && (R.dishT += dt) > 40) { R.g.remove(R.dish); R.dish = null; }
    if ((R.steamT = (R.steamT || 0) - dt) <= 0) { R.steamT = 0.9; G.w3d.fx.puff(X0 - 3.6 + (Math.random() - 0.5) * 0.3, Y0 + 1.7, Z0 - 4.9, 1, 0.16, '#ffffff', 0.6); }
  }

  // ============================================================ the panel (the zh chapters' lessons; kungfu.js uses it too)
  // 'full': a card in the middle of the screen. 'dock': a bar along the bottom, the room left in view (telling Mimo what to do).
  let PANEL = null, KEYH = null, RUN = null;
  function css() {
    if (document.getElementById('gm-css')) return;
    const s = document.createElement('style'); s.id = 'gm-css';
    s.textContent = `
      #gm-panel { position: fixed; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; background: rgba(40,16,12,.32); }
      #gm-panel.gm-hidden { display: none; }
      #gm-panel.gm-dock { background: none; pointer-events: none; align-items: flex-end; padding-bottom: 18px; }
      #gm-panel .gm-card { pointer-events: auto; width: min(820px, calc(100vw - 24px)); max-height: calc(100vh - 24px); overflow-y: auto; box-sizing: border-box; background: ${PAPER}; color: ${INK};
        border: 3px solid ${INK}; border-radius: 18px; box-shadow: 0 8px 0 rgba(43,34,53,.25); padding: 12px 20px; font: 600 16px "Segoe UI", system-ui, sans-serif; }
      #gm-panel.gm-dock .gm-card { width: min(760px, calc(100vw - 24px)); }
      #gm-panel .gm-head { display: flex; align-items: center; gap: 10px; }
      #gm-panel .gm-seal { flex: none; width: 34px; height: 34px; background: ${RED}; color: ${PAPER}; border-radius: 6px; display: grid; place-items: center; font: 400 22px ${FONT.zh}; transform: rotate(-4deg); }
      #gm-panel .gm-title { flex: 1; font: 800 20px Bahnschrift, "Segoe UI", sans-serif; }
      #gm-panel .gm-title small { font: 600 13px "Segoe UI", sans-serif; opacity: .6; margin-left: 8px; }
      #gm-panel .gm-dots i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 2px solid ${INK}; margin-left: 4px; }
      #gm-panel .gm-dots i.on { background: #f2c14e; } #gm-panel .gm-dots i.done { background: ${INK}; }
      #gm-panel .gm-x { flex: none; width: 32px; height: 32px; border-radius: 50%; border: 2.5px solid ${INK}; background: #fff; cursor: pointer; font: 800 14px "Segoe UI"; }
      #gm-panel .gm-say { margin: 8px 0 4px; padding: 6px 12px; background: #f6e3d6; border-radius: 12px; min-height: 28px; line-height: 1.55; }
      #gm-panel .gm-say .who { font: 800 13px "Segoe UI", sans-serif; opacity: .6; margin-right: 8px; }
      #gm-panel .gm-say .en { display: block; font: italic 600 14px "Segoe UI", sans-serif; opacity: .72; }
      #gm-panel .gm-say:not(.en-on) .en { display: none; }
      #gm-panel .gm-say .gm-enb { float: right; margin-left: 8px; font: 800 11px "Segoe UI", sans-serif; border: 2px solid ${INK}; border-radius: 8px; background: #fff; color: ${INK}; padding: 0 6px; cursor: pointer; }
      #gm-panel .gm-say.en-on .gm-enb { background: #f2c14e; }
      #gm-panel .gm-say .gm-do { display: block; font: 700 14px "Segoe UI", sans-serif; color: #2f6f4a; }
      #gm-panel .gm-say .cjk { font-size: 19px; }
      #gm-panel .gm-body { min-height: 210px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 8px 0 6px; text-align: center; }
      #gm-panel.gm-dock .gm-body { min-height: 0; }
      #gm-panel .gm-q { font: 700 18px "Segoe UI", sans-serif; } #gm-panel .gm-q small { display: block; font-weight: 600; font-size: 14px; opacity: .65; margin-top: 2px; }
      #gm-panel .gm-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 13px; opacity: .85; min-height: 30px; }
      #gm-panel .gm-zh { font-family: ${FONT.zh}; font-weight: 400; }
      #gm-panel .gm-big { font-size: 92px; line-height: 1.1; } #gm-panel .gm-mid { font-size: 44px; line-height: 1.3; }
      #gm-panel .gm-big ruby rt, #gm-panel .gm-mid ruby rt { font: 600 18px "Segoe UI", sans-serif; color: ${RED}; }
      #gm-panel .gm-read { font: 800 26px Bahnschrift, "Segoe UI", sans-serif; color: ${RED}; }
      #gm-panel .gm-row { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
      #gm-panel .gm-info { text-align: left; max-width: 420px; } #gm-panel .gm-hint { font: 600 15px/1.45 "Segoe UI", sans-serif; opacity: .82; margin-top: 6px; }
      #gm-panel .gm-mean { font: 700 20px "Segoe UI", sans-serif; display: flex; align-items: center; gap: 8px; }
      #gm-panel canvas.ic { width: 64px; height: 64px; } #gm-panel canvas.ic.sm { width: 40px; height: 40px; } #gm-panel canvas.ic.lg { width: 110px; height: 110px; }
      #gm-panel .gm-opts { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 740px; }
      #gm-panel .gm-opt { min-width: 110px; padding: 8px 14px 8px 22px; border: 3px solid ${INK}; border-radius: 14px; background: #fff; color: ${INK}; cursor: pointer; font: 700 18px "Segoe UI", sans-serif;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 0 rgba(43,34,53,.18); position: relative; }
      #gm-panel .gm-opt:hover { background: #fff3c4; } #gm-panel .gm-opt kbd { position: absolute; left: 6px; top: 3px; font: 800 11px "Segoe UI"; opacity: .5; }
      #gm-panel .gm-opt.right { background: #d8f3dc; border-color: #2f8a4a; } #gm-panel .gm-opt.wrong { background: #fbd9d5; border-color: ${RED}; animation: gmshake .35s; }
      #gm-panel .gm-opt.dim { opacity: .45; } #gm-panel .gm-opt.sel { background: #fff3c4; border-color: #d9a03a; } #gm-panel .gm-opt.done { background: #e4f5e7; border-color: #2f8a4a; box-shadow: none; }
      #gm-panel .gm-match { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 46px; }
      #gm-panel .gm-btn { padding: 8px 18px; border: 3px solid ${INK}; border-radius: 12px; background: ${INK}; color: ${PAPER}; font: 800 16px "Segoe UI", sans-serif; cursor: pointer; }
      #gm-panel .gm-btn.light { background: #fff; color: ${INK}; }
      #gm-panel .gm-sayb { width: 38px; height: 38px; border-radius: 50%; border: 2.5px solid ${INK}; background: #fff; font-size: 17px; cursor: pointer; padding: 0; }
      #gm-panel input.gm-in { font: 700 24px "Segoe UI", sans-serif; padding: 6px 12px; border: 3px solid ${INK}; border-radius: 12px; width: min(440px, 80vw); text-align: center; background: #fff; color: ${INK}; }
      #gm-panel input.gm-in.wrong { animation: gmshake .35s; border-color: ${RED}; } #gm-panel input.gm-in.right { border-color: #2f8a4a; background: #e4f5e7; }
      #gm-panel .gm-note { font: 600 15px "Segoe UI", sans-serif; color: #2f6f4a; min-height: 18px; max-width: 640px; }
      #gm-panel .gm-note.bad { color: ${RED}; } #gm-panel .gm-note ruby rt { font: 600 .5em/1 "Segoe UI"; color: ${RED}; }
      #gm-panel .gm-ticket { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border: 3px dashed #a8803f; border-radius: 12px; background: #fff8e8; font: 800 22px Bahnschrift, "Segoe UI", sans-serif; }
      #gm-panel .gm-grade { display: inline-grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; border: 3px solid ${INK}; font: 900 22px Bahnschrift, sans-serif; color: #fffaf0; -webkit-text-stroke: 4px ${INK}; paint-order: stroke fill; vertical-align: middle; margin-right: 8px; }
      #gm-panel .gS { background: #ffd166; } #gm-panel .gA { background: #8ff0b0; } #gm-panel .gB { background: #8fd0f0; } #gm-panel .gC { background: #d9c2f0; } #gm-panel .gD { background: #e0d6d6; }
      #gm-panel .gm-cards { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
      #gm-panel .gm-rcard { width: 150px; border: 3px solid ${INK}; border-radius: 14px; background: #fff; padding: 6px; font-size: 13px; box-shadow: 0 4px 0 rgba(43,34,53,.15); }
      #gm-panel .gm-rcard.locked { opacity: .35; } #gm-panel .gm-rcard b { display: block; font-size: 16px; }
      #gm-panel .gm-step { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; padding: 4px 8px; border-radius: 10px; border: 2px solid rgba(43,34,53,.2); background: #fff; min-width: 70px; }
      #gm-panel .gm-step.done { background: #e4f5e7; border-color: #2f8a4a; } #gm-panel .gm-step.now { background: #fff3c4; border-color: #d9a03a; }
      #gm-panel .gm-timer { width: 100%; max-width: 520px; height: 10px; border: 2.5px solid ${INK}; border-radius: 8px; overflow: hidden; background: #fff; } #gm-panel .gm-timer i { display: block; height: 100%; background: #f2c14e; }
      @keyframes gmshake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
      body.in-battle #gm-panel { display: none !important; }`;
    document.head.appendChild(s);
  }
  function panelEl() {
    if (PANEL) return PANEL;
    css();
    const el = document.createElement('div'); el.id = 'gm-panel'; el.className = 'gm-hidden';
    el.innerHTML = '<div class="gm-card"><div class="gm-head"><span class="gm-seal">梅</span><b class="gm-title"></b><span class="gm-dots"></span><button class="gm-x" title="Stop (Esc)">✕</button></div>'
      + '<div class="gm-say"></div><div class="gm-body"></div><div class="gm-foot"></div></div>';
    document.body.appendChild(el);
    const q = s => el.querySelector(s);
    PANEL = { el, title: q('.gm-title'), dots: q('.gm-dots'), say: q('.gm-say'), body: q('.gm-body'), foot: q('.gm-foot'), seal: q('.gm-seal'), x: q('.gm-x') };
    PANEL.x.onclick = () => quit();
    addEventListener('keydown', e => {
      if (!PANEL || PANEL.el.classList.contains('gm-hidden')) return;
      const inInput = e.target && e.target.tagName === 'INPUT';
      if (e.code === 'Escape' && !inInput) { e.preventDefault(); e.stopPropagation(); quit(); return; }
      if (KEYH && KEYH(e, inInput)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    return PANEL;
  }
  function openPanel(title, sub, o = {}) {
    const P = panelEl();
    P.seal.textContent = o.seal || '梅';
    P.title.innerHTML = esc(title) + (sub ? `<small>${esc(sub)}</small>` : '');
    P.dots.innerHTML = ''; P.say.innerHTML = ''; P.body.innerHTML = ''; P.foot.innerHTML = '';
    P.el.classList.remove('gm-hidden'); P.el.classList.toggle('gm-dock', !!o.dock);
    if (typeof Input !== 'undefined') Input.typing = true; if (G) G.sim.lock = 1;
    return P;
  }
  function dock(on) { if (PANEL) PANEL.el.classList.toggle('gm-dock', !!on); }
  function closePanel() {
    if (!PANEL) return;
    PANEL.el.classList.add('gm-hidden'); PANEL.body.innerHTML = ''; KEYH = null;
    if (typeof CJK !== 'undefined' && CJK.ime && CJK.ime.box) CJK.ime.box.style.display = 'none';
    if (typeof Input !== 'undefined') Input.typing = false; if (G) G.sim.lock = 0;
  }
  const panelOpen = () => !!PANEL && !PANEL.el.classList.contains('gm-hidden');
  function quit() { if (RUN) { RUN.quit = true; if (RUN.wake) RUN.wake({ quit: true }); } else closePanel(); }
  // her words in the panel, by the weave like every line (DESIGN.md 17.3): mixed (the English with the words you know in the
  // language), whole in the language as the weave rises (zh / ja: in the mode, CJK.html); the English only on request, EN on
  // the line (who: another speaker's name; todo: what to do now, an instruction to you, always shown, never part of the line)
  function panelSay(src, en, who, todo) {
    if (!PANEL) return;
    const l = L(), name = who || nmPlain('gm');
    let html = src ? (cjOn() ? CJK.html(src, { lang: l }) : esc(src)) : '';
    try { if (src && en && typeof STORY !== 'undefined' && STORY.mixHTML) html = STORY.mixHTML(src, en, { key: 'grandma:' + en }).html; } catch (e) { /* (the line as written) */ }
    PANEL.say.classList.toggle('en-on', !src);             // (an instruction in English only, no line in the language: as it is)
    PANEL.say.innerHTML = (en && src ? '<button type="button" class="gm-enb" title="This line in English">EN</button>' : '') + `<span class="who">${esc(name)}</span>` + html + (en ? `<span class="en">${esc(en)}</span>` : '')
      + (todo ? `<span class="gm-do">${esc(todo)}</span>` : '');
    const b = PANEL.say.querySelector('.gm-enb');
    if (b) b.onclick = e => { e.stopPropagation(); PANEL.say.classList.toggle('en-on'); b.blur(); const inp = PANEL.body.querySelector('input'); if (inp) inp.focus(); };
    if (src && cjOn() && cmode() === 'chars') CJK.seen(src, { lang: l });
  }
  function dots(n, at) { if (PANEL) PANEL.dots.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < at ? 'done' : i === at ? 'on' : ''}"></i>`).join(''); }
  const icon = (key, cls = '') => (key ? `<canvas class="ic ${cls}" width="128" height="128" data-icon="${esc(key)}"></canvas>` : '');
  const paintIcons = el => el.querySelectorAll('canvas[data-icon]').forEach(cv => { try { ICONS.draw(cv, cv.dataset.icon); } catch (e) { /* (no such icon) */ } });
  // notation → HTML in the mode (characters with ruby, or pinyin), in a class (gm-big, gm-mid)
  const zhHTML = (src, cls = '', o) => `<span class="gm-zh ${cls}" lang="${TAG(L())}">${CJK.html(src, Object.assign({ lang: L() }, o || {}))}</span>`;
  const sayIt = src => { try { return CJK.say(src, L()); } catch (e) { return false; } };
  const waitAnswer = () => new Promise(r => { const R = RUN; R.wake = v => { R.wake = null; R.cur = null; r(v); }; });
  const PRAISE = [['[对|duì] ！', 'Right!'], ['[很|hěn] [好|hǎo] ！', 'Very good!'], ['[太|tài] [棒|bàng] [了|le] ！', 'Great!'], ['[不错|bú cuò] ！', 'Not bad!']];
  const OOPS = [['[再|zài] [想想|xiǎng xiang] 。', 'Think again.'], ['[没|méi] [关系|guān xi] 。', 'That’s OK.'], ['[不对|bú duì] [哦|ó] 。', 'Not quite.']];
  const cheer = ok => { const [s, en] = (ok ? PRAISE : OOPS)[rnd(ok ? PRAISE.length : OOPS.length)]; panelSay(s, en); };
  function startRun() { RUN = { quit: false, wake: null, cur: null }; return RUN; }
  function endRun() { RUN = null; }

  // ------------------------------------------------------------ question kinds (each resolves { ok } or { quit })
  async function next(label = 'Next ▸', o = {}) {
    const P = PANEL;
    P.foot.innerHTML = `<span>${esc(o.foot || 'E / Enter / Space')}</span><button class="gm-btn gm-next">${esc(label)}</button>`;
    const b = P.foot.querySelector('.gm-next');
    b.onclick = () => { if (RUN && RUN.wake) RUN.wake({ ok: true }); };
    KEYH = (e, inInput) => { if (inInput) return false; if (['KeyE', 'Enter', 'Space', 'NumpadEnter'].includes(e.code) && !e.repeat) { b.click(); return true; } return false; };
    RUN.cur = { kind: 'next', next: () => b.click() };
    return waitAnswer();
  }
  async function choice(prompt, options, right, o = {}) {
    const P = PANEL;
    P.body.innerHTML = `${prompt}<div class="gm-opts">${options.map((op, i) => `<button class="gm-opt" data-i="${i}"><kbd>${i + 1}</kbd>${op.html}</button>`).join('')}</div><div class="gm-note"></div>`;
    paintIcons(P.body);
    P.foot.innerHTML = `<span>${esc(o.foot || `1–${options.length} or click to pick`)}</span><span></span>`;
    const btns = [...P.body.querySelectorAll('.gm-opt')];
    let done = false;
    const pick = async i => {
      if (done || !options[i]) return; done = true;
      const ok = options[i].value === right, ri = options.findIndex(op => op.value === right);
      btns[i].classList.add(ok ? 'right' : 'wrong'); if (!ok && btns[ri]) btns[ri].classList.add('right');
      btns.forEach((b, k) => { if (k !== i && k !== ri) b.classList.add('dim'); });
      Sound.play(ok ? 'review' : 'wrong'); if (!o.quiet) cheer(ok);
      if (o.note) P.body.querySelector('.gm-note').innerHTML = o.note;
      await tick(ok ? (o.note ? 1500 : 750) : (o.note ? 2100 : 1500));
      if (RUN && RUN.wake) RUN.wake({ ok, value: options[i].value });
    };
    btns.forEach((b, i) => { b.onclick = () => pick(i); });
    KEYH = (e, inInput) => { if (inInput) return false; const m = /^(Digit|Numpad)([1-9])$/.exec(e.code); if (m && +m[2] <= options.length) { pick(+m[2] - 1); return true; } return false; };
    RUN.cur = { kind: 'choice', right: options.findIndex(op => op.value === right), pick };
    return waitAnswer();
  }
  async function match(prompt, pairs) {
    const P = PANEL, n = pairs.length, KR = 'ABCDEF';
    let right = shuffle(pairs.map((p, i) => i));
    for (let k = 0; k < 8 && n > 1 && right.every((v, i) => v === i); k++) right = shuffle(right);
    P.body.innerHTML = `${prompt}<div class="gm-match">${pairs.map((p, i) => `<button class="gm-opt" data-side="L" data-i="${i}"><kbd>${i + 1}</kbd>${p.left}</button>`
      + `<button class="gm-opt" data-side="R" data-i="${right[i]}"><kbd>${KR[i]}</kbd>${pairs[right[i]].right}</button>`).join('')}</div>`;
    paintIcons(P.body);
    P.foot.innerHTML = '<span>Pick one on the left, then its match on the right (1–4, then A–D)</span><span></span>';
    const Ls = [...P.body.querySelectorAll('[data-side="L"]')], Rs = [...P.body.querySelectorAll('[data-side="R"]')];
    let sel = null, left = n, bad = 0;
    const tryPair = async (li, rb) => {
      const ri = +rb.dataset.i, lb = Ls[li];
      if (ri === li) { lb.classList.remove('sel'); lb.classList.add('done'); rb.classList.add('done'); Sound.play('review'); left--; if (!left) { cheer(true); await tick(700); if (RUN && RUN.wake) RUN.wake({ ok: bad === 0, bad }); } }
      else { bad++; Sound.play('wrong'); rb.classList.add('wrong'); lb.classList.add('wrong'); setTimeout(() => { rb.classList.remove('wrong'); lb.classList.remove('wrong', 'sel'); }, 450); }
      sel = null;
    };
    const clickL = i => { if (Ls[i].classList.contains('done')) return; Ls.forEach(b => b.classList.remove('sel')); sel = i; Ls[i].classList.add('sel'); Sound.play('click'); };
    const clickR = k => { const rb = Rs[k]; if (!rb || rb.classList.contains('done') || sel === null) return; tryPair(sel, rb); };
    Ls.forEach((b, i) => { b.onclick = () => clickL(i); }); Rs.forEach((b, k) => { b.onclick = () => clickR(k); });
    KEYH = (e, inInput) => {
      if (inInput) return false;
      const m = /^(Digit|Numpad)([1-9])$/.exec(e.code); if (m && +m[2] <= n) { clickL(+m[2] - 1); return true; }
      const k = /^Key([A-F])$/.exec(e.code); if (k && KR.indexOf(k[1]) < n) { clickR(KR.indexOf(k[1])); return true; }
      return false;
    };
    RUN.cur = { kind: 'match', solve: () => { for (let i = 0; i < n; i++) { clickL(i); clickR(Rs.findIndex(b => +b.dataset.i === i)); } } };
    const r = await waitAnswer();
    return r.quit ? r : { ok: true, bad: r.bad || 0 };
  }
  // type an answer: judge(text) → { ok, note (HTML), grade?, retry? }. Tab or Hint: o.hints (a ladder), ?: show o.show.
  // A wrong answer can be tried again (o.tries, default 3); then the answer is shown and you copy it.
  async function typeAns(prompt, judge, o = {}) {
    const P = PANEL, l = L(), chars = cmode() === 'chars';
    P.body.innerHTML = `${prompt}<input class="gm-in" autocomplete="off" spellcheck="false" placeholder="${esc(o.ph || 'type it…')}"><div class="gm-note"></div>`;
    paintIcons(P.body);
    P.foot.innerHTML = `<span>${esc(chars ? 'Pinyin, or pinyin + Space to pick characters' : 'Pinyin (tones optional: ni3 = nǐ)')} · Tab: a hint · ?: show me</span>`
      + '<span><button class="gm-btn light gm-hintb">Hint</button> <button class="gm-btn gm-check">OK</button></span>';
    const inp = P.body.querySelector('.gm-in'), note = P.body.querySelector('.gm-note');
    if (typeof CJK !== 'undefined' && CJK.attachIME) CJK.attachIME(inp);
    let hints = 0, bad = 0, shown = false, done = false;
    const show = () => { shown = true; note.className = 'gm-note'; note.innerHTML = `${o.show ? zhHTML(o.show) : ''} ← type it!`; if (o.show) sayIt(o.show); };
    const hint = () => { const H = o.hints || []; if (hints < H.length) { note.className = 'gm-note'; note.innerHTML = H[hints++]; } else show(); inp.focus(); };
    const check = async () => {
      if (done) return;
      const v = inp.value.trim(); if (!v) return;
      if (/^[?？]+$/.test(v)) { inp.value = ''; show(); return; }
      const r = judge(v) || {};
      note.className = 'gm-note' + (r.ok ? '' : ' bad'); note.innerHTML = r.note || '';
      if (r.ok) {
        done = true; inp.disabled = true; inp.classList.add('right'); Sound.play(r.grade === 'S' || !r.grade ? 'review' : 'pip');
        if (!o.quiet) cheer(true);
        try { if (cjOn() && o.show) CJK.used(v, o.show, { lang: l }); } catch (e) { /* (optional) */ }
        await tick(o.wait || 1300); if (RUN && RUN.wake) RUN.wake({ ok: bad === 0 && !shown && hints < 2, bad, text: v, r });
        return;
      }
      bad++; Sound.play('wrong'); if (!o.quiet) cheer(false);
      inp.classList.remove('wrong'); void inp.offsetWidth; inp.classList.add('wrong'); inp.select();
      if (!r.retry && bad >= (o.tries || 3) && !shown) show();
    };
    P.foot.querySelector('.gm-check').onclick = check;
    P.foot.querySelector('.gm-hintb').onclick = hint;
    inp.addEventListener('keydown', e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === 'Enter') { e.preventDefault(); check(); } else if (e.key === 'Tab') { e.preventDefault(); hint(); } });
    KEYH = () => false;
    setTimeout(() => inp.focus(), 40);
    RUN.cur = { kind: 'type', type: v => { inp.value = v; return check(); }, show: o.show };
    return waitAnswer();
  }
  // ------------------------------------------------------------ typed zh: is a word in what you typed? (characters must be its own,
  // pinyin by syllable, tones optional: like LEX.heard), or is it exactly one of these (Mimo's name, 吧, punctuation aside)?
  function heard(text, src) {
    const l = L();
    try {
      if (!CJK.typed) return CJK.contains(text, src, l);
      const { U, marks } = CJK.typed(text, l), w = CJK.wordOf(src, l);
      for (let i = 0; i < U.length; i++) { const m = CJK.matchAt(w, U, i, l); if (m && !marks.slice(i + 1, m.j).some(Boolean)) return true; }
    } catch (e) { return CJK.contains(text, src, l); }
    return false;
  }
  const heardAny = (text, list) => list.some(s => heard(text, s));
  function bare(text) {
    const mn = String((G && G.state && G.state.mimoName) || 'Mimo');
    let t = String(text).replace(/[，。！？、,.!?;；:：“”"'\s]/g, '');
    for (const n of ['米莫', mn]) if (n) t = t.split(n).join('');
    return t.replace(/(吧|啊|呀|哦|啦)$/u, '').replace(/^(mimo|mi mo)/i, '');
  }
  const canon = t => (typeof CJK !== 'undefined' ? CJK.canon(t, L()) : String(t).toLowerCase());
  function isOnly(text, list) {
    const t = bare(text); if (!t) return false;
    const han = /[㐀-鿿]/.test(t);
    return list.some(s => {
      const want = CJK.chars(s, { lang: L() }).replace(/[\s，。！？、“”]/g, '');
      return han ? t === want : canon(t) === canon(s) || canon(t).replace(/(ba|ya|la)$/, '') === canon(s);
    });
  }

  // ============================================================ scenes (every language)
  Object.assign(LT, {
    'gm.life.3b': T1('Tú también aprendes así, ¿verdad? Hablando, probando, equivocándote. ¡Sigue así!', 'Você também aprende assim, né? Falando, provando, errando. Continua assim!',
      'Du lernst auch so, oder? Sprechen, probieren, Fehler machen. Mach weiter so!',
      '[你|nǐ] [也|yě] [是|shì] [这样|zhè yàng] [学|xué] [的|de] ， [对|duì] [吧|ba] ？ [多|duō] [说|shuō] ， [多|duō] [尝|cháng] ， [不怕|bù pà] [错|cuò] 。 [加油|jiā yóu] ！',
      'あなた も そう でしょう ？ [話|はな]して 、 [味見|あじみ] して 、 まちがえて 。 がんばって ！', 'And that’s how you’re learning too, right? Talk, taste, make mistakes. Keep it up!'),
  });
  // her lines over the room (lines.js): the English weave, or the whole line with the English under it (o.full)
  async function gsay(key, o = {}) {
    const p = ROOM && ROOM.gm && ROOM.gm.st; if (!p) return;
    const Lr = UI.lineFor(key, LEX.tier());
    p.name = nmPlain('gm'); p.id = 'grandma:' + key;
    p.lines = { en: o.full ? (Lr.en || Lr.weave) : Lr.weave, [L()]: Lr.text };
    await STORY.sayInline(p, !!o.full);
  }
  // a line of hers given right here (zh chapters: notation + English), in the room's bubble
  async function gline(src, en, o = {}) {
    const p = ROOM && ROOM.gm && ROOM.gm.st; if (!p) return;
    p.name = o.who || nmPlain('gm'); p.id = 'grandma:' + (o.id || en);
    p.lines = { en, [L()]: src };
    await STORY.sayInline(p, o.full !== false);
  }
  const mimoHappy = (n = 16) => { const M = G.sim.mimo; M.happy = 1.5; M.glow = 1; G.w3d.fx.sparkle(M.x, M.ry + 0.8, M.z, n); };
  // the recipe cards: a card for each dish's story, and one for each festival food
  const CARDS = [
    { key: 'jiaozi', icon: 'gm_jiaozi', en: 'Jiaozi (dumplings)', tip: 'Pork and cabbage in a thin wrapper, pinched shut, boiled. Eat them with a little vinegar. At New Year they bring luck.' },
    { key: 'baozi', icon: 'gm_baozi', en: 'Baozi (steamed buns)', tip: 'A soft, risen dough wrapped round a filling and steamed in a bamboo basket. “As soft as a cloud.”' },
    { key: 'noodles', icon: 'gm_noodles', en: 'Long-life noodles', tip: 'Pulled by hand, never cut: on your birthday, the longer the noodle, the longer the life.' },
    { key: 'wonton', icon: 'gm_wonton', en: 'Wonton soup', tip: 'Little dumplings floating like clouds in a clear broth. Her mother’s cure for everything.' },
    { key: 'springroll', icon: 'gm_springroll', en: 'Spring rolls', tip: 'Thin wrappers rolled round vegetables and fried golden for the Spring Festival. Careful: hot!' },
    { key: 'tea', icon: 'gm_tea', en: 'Jasmine tea', tip: 'When someone pours for you, tap the table twice with two fingers: thank you.' },
    { key: 'mooncake', icon: 'gm_mooncake', en: 'Mooncakes (Mid-Autumn)', tip: 'Round like the full moon of the 8th month’s 15th day. Families share them under the moon.' },
    { key: 'tangyuan', icon: 'gm_tangyuan', en: 'Tangyuan (Lantern Festival)', tip: 'Sweet rice balls with black sesame inside. Tāngyuán sounds like tuányuán: the family together.' },
    { key: 'zongzi', icon: 'gm_zongzi', en: 'Zongzi (Dragon Boat Festival)', tip: 'Sticky rice wrapped in bamboo leaves and tied with string, for the poet Qu Yuan.' },
  ];
  function addCard(key) {
    const st = S(); if (st.cards.includes(key)) return;
    st.cards.push(key); const c = CARDS.find(q => q.key === key);
    Sound.play('page'); UI.toast(`📜 Recipe card: ${c ? c.en : key} (${st.cards.length}/${CARDS.length})`);
  }
  const allDishes = () => DISH_IDS.every(id => S().ord[id]);
  // the first visit: hello (zh: and the first chapter right away)
  async function meet() {
    const st = S(); st.met = true;
    await gsay('gm.hi', { full: true });
    if (G.save) G.save();
    if (isZh() && !st.ch[1]) { await playChapter(1); return; }
    await gsay('gm.order', { full: true }); st.toldOrder = 1;
    await order();
  }
  const ORDER_SUB = { es: 'In Spanish, like at the market: «Quisiera un plato de jiaozi, por favor»', pt: 'In Portuguese, like at the market: «Queria um prato de jiaozi, por favor»',
    de: 'In German, like at the market: «Ich hätte gern einen Teller Jiaozi, bitte»', zh: 'In Chinese: «请给我一盘饺子» (measure words!)', ja: 'In Japanese: «ぎょうざ を ひとつ ください»' };
  function menuOptions() {
    const st = S(), b = bells(), opts = [];
    opts.push({ label: 'Order something to eat', sub: ORDER_SUB[L()] || '', value: 'order' });
    if (canScan()) opts.push({ label: 'Pay by scanning her code (信鸽)', sub: 'Scan, then say what you’re paying for: «一盘饺子和一杯茶»', value: 'scan' });
    if (isZh()) {
      const n = nextChapter();
      if (n) opts.push({ label: `Lesson ${n} · ${CH_TITLE[n].en}`, sub: n > 1 && b < CH_NEED[n] ? `She says: after the ${ordinal(CH_NEED[n])} bell` : CH_TITLE[n].sub, value: 'ch' + n });
      const done = [1, 2, 3, 4].filter(k => st.ch[k]);
      if (done.length) opts.push({ label: 'Practice a lesson again', sub: done.map(k => CH_TITLE[k].en).join(' · '), value: 'again' });
    }
    opts.push({ label: 'Chat with her', sub: chatTeaser(), value: 'chat' });
    opts.push({ label: `Recipe cards (${st.cards.length}/${CARDS.length})`, value: 'cards' });
    if (st.apron) opts.push({ label: `${G.state.mimoName || 'Mimo'}’s apron: ${st.wear === 'apron' ? 'take it off' : 'put it on'}`, value: 'wear' });
    return opts;
  }
  const ordinal = n => ['', 'first', 'second', 'third', 'fourth', 'fifth'][n] || n + 'th';
  function chatTeaser() {
    const st = S(), b = bells();
    if (!isZh()) { const f = FESTS.find(([k, need]) => b >= need && !st.st['fest.' + k]); if (f) return `About ${f[3]}`; }
    if (allDishes() && !st.st.life) return 'About herself';
    return '';
  }
  const FESTS = [['moon', 1, 3, 'the Mid-Autumn Festival', 'mooncake'], ['lantern', 2, 2, 'the Lantern Festival', 'tangyuan'], ['dragon', 3, 3, 'the Dragon Boat Festival', 'zongzi']];
  async function talk() {
    const st = S();
    if (!st.met) return meet();
    for (let guard = 0; guard < 10; guard++) {
      G.sim.lock = 1;
      const pick = await UI.choose(`${nmPlain('gm')} · ${enName('place')}`, menuOptions());
      G.sim.lock = 0;
      if (pick == null) return;
      if (pick === 'order') { await order(); return; }
      if (pick === 'scan') { await scanPay(); return; }
      if (pick === 'chat') { await chat(); return; }
      if (pick === 'cards') { await cardsView(); continue; }
      if (pick === 'wear') { st.wear = st.wear === 'apron' ? '' : 'apron'; Sound.play('pip'); if (G.save) G.save(); continue; }
      if (pick === 'again') { const k = await againMenu(); if (k) { await playChapter(k, { again: true }); return; } continue; }
      if (/^ch\d$/.test(pick)) { await playChapter(+pick.slice(2)); return; }
      return;
    }
  }
  async function againMenu() {
    const st = S(), done = [1, 2, 3, 4].filter(k => st.ch[k]);
    G.sim.lock = 1;
    const k = await UI.choose('Which lesson?', done.map(n => ({ label: `Lesson ${n} · ${CH_TITLE[n].en}`, sub: CH_TITLE[n].sub, value: n })));
    G.sim.lock = 0;
    return k;
  }
  // 扫码 (zh, the phone's «信鸽»: js/talk/phone.js PHONE.scanPay): you scan her code and say what you're paying for, graded;
  // the bill is what you named, paid in coins, and it's served the way an order is
  const canScan = () => isZh() && typeof PHONE !== 'undefined' && !!PHONE.scanPay && typeof TALK !== 'undefined' && TALK.ready();
  async function scanPay() {
    const gm = ROOM && ROOM.gm && ROOM.gm.st;
    if (gm) gm.talking = true;
    let bought = null;
    try { bought = await PHONE.scanPay({ merchant: 'mei', dishes: DISHES.map(d => ({ id: d.id, price: d.price })) }); } catch (e) { console.error('[grandma] scanPay', e); }
    if (gm) gm.talking = false;
    if (G.save) G.save();
    if (bought && bought.length) await served(bought);
  }
  // ordering: shop.js's panel, her stall (graded S–D like the market; a polite S takes a coin off each dish)
  async function order() {
    if (!ensureShop() || typeof SHOP === 'undefined' || !SHOP.open) { STORY.think('The kitchen is closed today.'); return; }
    const st = S(), S0 = G.state, gm = ROOM && ROOM.gm && ROOM.gm.st;
    if (!st.toldOrder) { st.toldOrder = 1; await gsay('gm.order', { full: true }); }
    if (gm) gm.talking = true; S0.teaching = true;
    let r = null;
    try {
      r = await SHOP.open({ lang: S0.lang, stall: { id: STALL, keeper: { id: 'grandma', name: nmPlain('gm') } }, coins: S0.coins || 0, bag: Object.assign({}, S0.bag || {}), mimoName: S0.mimoName, asked: S0.shopAsked || [] });
      if (r) { S0.coins = r.coins; S0.bag = r.bag || S0.bag; if (r.asked) S0.shopAsked = r.asked; }
    } catch (e) { console.error('[grandma] shop', e); }
    S0.teaching = false; if (gm) gm.talking = false; if (G.save) G.save();
    if (r && r.bought && r.bought.length) await served(r.bought);
    return r;
  }
  // served at your table: Mimo hops up and tastes it, she packs the rest for the road; the first time, the dish's story
  async function served(bought) {
    const st = S(), ids = [...new Set(bought.map(b => b.id))].filter(id => DISH[id]);
    if (!ids.length || !ROOM) return;
    const fresh = ids.filter(id => !st.ord[id]);
    ids.forEach(id => { st.ord[id] = (st.ord[id] || 0) + bought.filter(b => b.id === id).reduce((a, b) => a + (b.n || 1), 0); });
    serveDish(fresh[0] || ids[0]);
    G.sim.mimoGo({ x: X0 + SPOT.seat.x, z: Z0 + SPOT.seat.z }, { x: X0 + SPOT.table.x, z: Z0 + SPOT.table.z });
    await gsay('gm.served', { full: true });
    mimoHappy(14); G.sim.mimoSay('♥', 1.8);
    if (!st.firstServe) { st.firstServe = 1; STORY.think('She sets three plates down at once… and catches a falling chopstick between two fingers, without even looking.', 5.5); await STORY.wait(1.2); }
    for (const id of fresh) await dishStory(id);
    await gsay('gm.pack');
    if (allDishes() && !st.st.life) await lifeStory();
    G.sim.mimoGo(null, null);
    if (G.save) G.save();
  }
  async function dishStory(id) {
    const st = S(), key = DISH[id].key;
    if (st.st['dish.' + key]) return;
    st.st['dish.' + key] = 1;
    await gsay(`gm.story.${key}.1`); await gsay(`gm.story.${key}.2`);
    addCard(key);
  }
  async function lifeStory() {
    const st = S(); st.st.life = 1;
    await gsay('gm.life.1'); await gsay('gm.life.2');
    if (st.apron) { await gsay('gm.life.3b'); return; }
    await gsay('gm.life.3', { full: true });
    await giveApron();
  }
  async function giveApron() {
    const st = S(); if (st.apron) return;
    st.apron = 1; st.wear = 'apron'; apron();
    Sound.play('chest'); mimoHappy(24);
    const mn = G.state.mimoName || 'Mimo', word = { es: 'el delantal', pt: 'o avental', de: 'die Schürze', zh: '[围裙|wéi qún]', ja: 'エプロン' }[L()] || 'the apron';
    await UI.card(`<div class="tag">A gift from ${esc(enName('gm'))}</div><canvas width="130" height="130"></canvas><div class="big">${cjOn() ? CJK.html(word, { lang: L() }) : esc(word)}</div>`
      + `<div class="sub">${esc(mn)}’s apron: red pocket, gold button. Put it on or take it off from her menu. <b>E</b></div>`, { kind: 'reveal', icon: 'gm_apron' });
    if (G.save) G.save();
  }
  // a chat: a festival food (after the bells; zh: chapter 4 tells them), her own story, or small talk
  async function chat() {
    const st = S(), b = bells();
    const f = !isZh() && FESTS.find(([k, need]) => b >= need && !st.st['fest.' + k]);
    if (f) { const [k, , n, , card] = f; st.st['fest.' + k] = 1; for (let i = 1; i <= n; i++) await gsay(`gm.fest.${k}.${i}`); addCard(card); if (G.save) G.save(); return; }
    if (allDishes() && !st.st.life) { await lifeStory(); if (G.save) G.save(); return; }
    st.small = ((st.small || 0) % 3) + 1; await gsay('gm.small.' + st.small);
    if (!isZh() && b < 3) await gsay('gm.more');
    else if (!allDishes()) STORY.think(`She has a story for every dish on the menu. (${DISH_IDS.filter(id => st.ord[id]).length}/6 tried)`, 4.5);
    if (G.save) G.save();
  }
  // the recipe cards, in a little binder
  async function cardsView() {
    const st = S();
    startRun(); openPanel('Recipe cards', `${st.cards.length} / ${CARDS.length}`);
    panelSay(isZh() ? '[这些|zhè xiē] [是|shì] [我|wǒ] [妈妈|mā ma] [的|de] [菜谱|cài pǔ] 。' : '', isZh() ? 'These are my mother’s recipes.' : 'Every dish has its story. Order them all, and ask her about the festivals!');
    PANEL.body.innerHTML = `<div class="gm-cards">${CARDS.map(c => {
      const on = st.cards.includes(c.key), d = DISHES.find(q => q.key === c.key), word = d ? (cjOn() ? CJK.html(d[L()][0], { lang: L() }) : esc(d[L()] ? d[L()][0][0] : d.key)) : '';
      return `<div class="gm-rcard${on ? '' : ' locked'}">${icon(c.icon)}<b>${on ? esc(c.en) : '?'}</b>${on && word ? `<div>${word}</div>` : ''}<div>${on ? esc(c.tip) : (d ? 'Order it, and she’ll tell you its story.' : 'Ask her about the festivals.')}</div></div>`;
    }).join('')}</div>`;
    paintIcons(PANEL.body);
    await next('Close'); closePanel(); endRun();
  }

  // ============================================================ zh: her side plot, in chapters (the 'Lesson' entry in her menu)
  const CH_NEED = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
  const CH_TITLE = {
    1: { en: 'Ordering (点菜)', sub: 'the menu, measure words: 一碗面 · 一盘饺子 · 一笼包子' },
    2: { en: 'Five tastes (酸甜苦辣咸)', sub: 'sour, sweet, bitter, spicy, salty; what you like' },
    3: { en: 'Making dumplings (包饺子)', sub: 'tell {mimo} each step; first… then…' },
    4: { en: 'Festival foods (节日美食)', sub: 'mooncakes, tangyuan, zongzi, and her memories' },
    5: { en: 'The secret (秘密)', sub: 'behind the plum painting…' },
  };
  Object.values(CH_TITLE).forEach(c => { Object.defineProperty(c, 'sub', { get: ((s) => () => s.replace('{mimo}', (G && G.state && G.state.mimoName) || 'Mimo'))(c.sub), enumerable: true }); });
  function nextChapter() { const st = S(); for (let n = 1; n <= 5; n++) if (!st.ch[n]) return n; return 0; }
  const NUM_ZH = ['', '[一|yī]', '[二|èr]', '[三|sān]', '[四|sì]', '[五|wǔ]'];
  // the phrasebook (the journal's Phrasebook tab lists LEX phrases at stage ≥ 2; kept far from LEX's own reviews, like domino.js)
  const PHRASES = [
    { id: 'ph.gm.huanying', zh: '[欢迎|huān yíng] [光临|guāng lín]', en: 'Welcome! (what restaurants and shops call out)', note: 'You hear it the moment you walk in.' },
    { id: 'ph.gm.haochi', zh: '[好吃|hǎo chī]', en: 'delicious', note: '好 good + 吃 eat. 好喝 (hǎohē) for drinks.' },
    { id: 'ph.gm.manman', zh: '[慢慢|màn màn] [吃|chī]', en: 'enjoy your meal (“eat slowly”)', note: 'What the cook says when the food comes.' },
    { id: 'ph.gm.diancai', zh: '[点菜|diǎn cài]', en: 'to order (food)', note: '[服务员|fú wù yuán] ， [点菜|diǎn cài] ！ calls the waiter.' },
    { id: 'ph.gm.tailale', zh: '[太|tài] [辣|là] [了|le] ！', en: 'Too spicy!', note: '太 … 了: too …: 太甜了, 太咸了.' },
    { id: 'ph.gm.suantian', zh: '[酸甜苦辣|suān tián kǔ là]', en: 'sour, sweet, bitter, spicy: all the ups and downs of life', note: 'Life is like a dish: it has all four.' },
    { id: 'ph.gm.xihuan', zh: '[我|wǒ] [喜欢|xǐ huan] [吃|chī] [甜|tián] [的|de]', en: 'I like sweet things', note: 'Any taste fits: 我喜欢吃辣的. 不喜欢: don’t like.' },
    { id: 'ph.gm.xianzai', zh: '[先|xiān] … [再|zài] …', en: 'first … then …', note: '先和面，再擀皮: first mix the dough, then roll the wrappers.' },
    { id: 'ph.gm.chenre', zh: '[趁热|chèn rè] [吃|chī]', en: 'eat it while it’s hot', note: 'Grandma Mei’s favorite order.' },
    { id: 'ph.gm.zhongqiu', zh: '[中秋节|Zhōng qiū jié] [快乐|kuài lè] ！', en: 'Happy Mid-Autumn Festival!', note: 'Say it under the full moon, with a mooncake.' },
    { id: 'ph.gm.tuanyuan', zh: '[团圆|tuán yuán]', en: 'the family all together again', note: 'Round mooncakes and round tangyuan both mean 团圆.' },
    { id: 'ph.gm.binanguo', zh: '[别|bié] [难过|nán guò]', en: 'don’t be sad', note: '别 + verb: don’t … (别走 don’t go).' },
  ];
  function registerPhrases() {
    if (typeof LEX === 'undefined') return;
    LEX.register(PHRASES.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', zh: p.zh, en: p.en, note: p.note, region: 'Grandma Mei’s kitchen', register: 'casual', icon: 'gm_menu' })));
  }
  function teachPhrase(id) {
    if (typeof LEX === 'undefined' || !LEX.item(id) || LEX.lang !== 'zh') return;
    const s = LEX.st(id), t = Date.now() / 1000; LEX.expose(id);
    if (s.stage < 3) s.stage = 3; s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 30 * 86400; s.last = t;
  }
  const coinsUp = n => { G.state.coins = (G.state.coins || 0) + n; UI.toast(`🪙 +${n} coins`); Sound.play('chest'); };
  async function chapterDone(n, phrases, coins) {
    const st = S(), first = !st.ch[n]; st.ch[n] = 1;
    (phrases || []).forEach(teachPhrase);
    if (first) { if (coins) coinsUp(coins); UI.toast(`✓ Lesson ${n}: ${CH_TITLE[n].en}${phrases && phrases.length ? ` · ${phrases.length} new phrases in your Phrasebook` : ''}`); Sound.play('learned'); mimoHappy(20); }
    if (G.save) G.save();
  }
  async function playChapter(n, o = {}) {
    if (!isZh()) return;
    const st = S();
    if (n > 1 && !st.ch[n - 1] && !o.again) { await gline(`[先|xiān] [学|xué] [第${NUM_ZH[n - 1].replace(/^\[(.)\|(.+)\]$/, '$1|dì $2')}] [课|kè] [吧|ba] 。`, `Let’s do lesson ${n - 1} first.`); return; }
    if (bells() < CH_NEED[n] && !o.again) {
      await gline(`[还|hái] [不|bù] [行|xíng] 。 [等|děng] [你|nǐ] [敲响|qiāo xiǎng] [第${NUM_ZH[CH_NEED[n]].replace(/^\[(.)\|(.+)\]$/, '$1|dì $2')}] [口|kǒu] [钟|zhōng] ， [再|zài] [来|lái] [找|zhǎo] [我|wǒ] 。`,
        `Not yet. Ring the ${ordinal(CH_NEED[n])} bell, then come and find me.`);
      return;
    }
    const fn = [null, ch1, ch2, ch3, ch4, ch5][n];
    try { await fn(o); } catch (e) { console.error('[grandma] chapter ' + n, e); }
    finally { if (panelOpen()) closePanel(); endRun(); if (ROOM) { ROOM.gm.walkTo = null; ROOM.gm.face = null; ROOM.gm.pose = null; } G.cam.override = null; G.sim.mimoGo(null, null); }
  }
  // a lesson card for a word: big, its reading, a picture, the English, a hint, a 🔊 button
  function wordCard(src, en, ico, hint) {
    PANEL.body.innerHTML = `<div class="gm-row">${icon(ico, 'lg')}${zhHTML(src, 'gm-big')}<div class="gm-info"><div class="gm-read">${esc(CJK.roman(src, { lang: 'zh', cap: false }))} <button class="gm-sayb">🔊</button></div>`
      + `<div class="gm-mean">${esc(en)}</div><div class="gm-hint">${esc(hint || '')}</div></div></div>`;
    paintIcons(PANEL.body); PANEL.body.querySelector('.gm-sayb').onclick = () => sayIt(src); sayIt(src);
  }
  // a model answer (notation) for the notes: in the mode, with its reading
  const model = src => zhHTML(src, 'gm-zh', /[。！？]\s*”?$/.test(src) ? null : { cap: false });     // (a word stays lowercase in pinyin; a sentence gets its capital)

  // ------------------------------------------------------------ chapter 1 · 点菜: the menu, measure words, taking orders, ordering politely
  const MW = [
    { cl: '碗', src: '[碗|wǎn]', en: 'bowl', icon: 'gm_bowl', ex: '[一|yī] [碗|wǎn] [面|miàn]', exEn: 'a bowl of noodles' },
    { cl: '盘', src: '[盘|pán]', en: 'plate', icon: 'gm_plate', ex: '[一|yī] [盘|pán] [饺子|jiǎo zi]', exEn: 'a plate of dumplings' },
    { cl: '笼', src: '[笼|lóng]', en: 'steamer basket', icon: 'gm_steamer', ex: '[一|yī] [笼|lóng] [包子|bāo zi]', exEn: 'a steamer basket of buns' },
    { cl: '杯', src: '[杯|bēi]', en: 'cup', icon: 'gm_cup', ex: '[一|yī] [杯|bēi] [茶|chá]', exEn: 'a cup of tea' },
  ];
  const ZN = ['', '[一|yī]', '[两|liǎng]', '[三|sān]', '[四|sì]', '[五|wǔ]'];
  const orderSrc = (n, cl, id) => `${ZN[n]} [${cl}|${MW.find(m => m.cl === cl) ? CJK.roman(MW.find(m => m.cl === cl).src, { lang: 'zh', cap: false }) : 'gè'}] ${DISH[id].zh[0]}`;
  // read an order the way shop.js does (SHOP.parse: measure words, 两 not 二, the dish), and check it against a ticket
  function judgeOrder(text, want) {
    const r = SHOP.parse(text, 'zh', STALL, {}), it = r.items && r.items[0], d = DISH[want.id];
    const grade = r.grade || 'C', shown = `<span class="gm-grade g${grade}">${grade}</span>`;
    if (!it || r.items.length !== 1) return { ok: false, note: 'Say how many, the measure word, and the dish: like ' + model(orderSrc(want.n, want.cl, want.id)) };
    if (it.id !== want.id) return { ok: false, note: `That’s ${esc(DISH[it.id] ? DISH[it.id].gloss : 'something else')}. The ticket says ${esc(d.gloss)}: ${model(d.zh[0])}` };
    if (it.n !== want.n) return { ok: false, note: `How many? The ticket says ${want.n}: ${model(ZN[want.n])}${want.n === 2 ? ' (两, before a measure word)' : ''}` };
    if (it.cl !== want.cl) return { ok: false, retry: true, note: `${d.gloss} come by the ${MW.find(m => m.cl === want.cl).en} here: ${model(MW.find(m => m.cl === want.cl).src)}${it.cl === '个' ? ' (个 works for anything, but the ticket says ' + MW.find(m => m.cl === want.cl).en + 's!)' : ''}` };
    const slips = (r.notes || []).filter(n => !/请|谢谢|polite|S \(and/.test(n));
    return { ok: true, grade, note: `${shown}${model(orderSrc(want.n, want.cl, want.id))}${slips.length ? ' · ' + esc(slips[0]) : ''}` };
  }
  async function ch1() {
    const st = S();
    await gline('[来|lái] ， [我|wǒ] [教|jiāo] [你|nǐ] [点菜|diǎn cài] 。 [先|xiān] [看看|kàn kan] [菜单|cài dān] ！', 'Come, I’ll teach you how to order. First, look at the menu!');
    startRun(); openPanel('Lesson 1 · 点菜', 'Ordering'); dots(5, 0);
    // the menu: three dishes a page
    for (const page of [DISHES.slice(0, 3), DISHES.slice(3)]) {
      panelSay('[这|zhè] [是|shì] [我们|wǒ men] [的|de] [菜单|cài dān] 。', 'This is our menu.', null, 'Click 🔊 to hear each dish.');
      PANEL.body.innerHTML = `<div class="gm-row" style="gap:26px">${page.map(d => `<div>${icon(d.icon, 'lg')}<div>${zhHTML(d.zh[0], 'gm-mid')}</div><div class="gm-read">${esc(CJK.roman(d.zh[0], { lang: 'zh', cap: false }))} <button class="gm-sayb" data-s="${esc(d.zh[0])}">🔊</button></div><div>${esc(d.gloss)} · ${d.price} 🪙</div></div>`).join('')}</div>`;
      paintIcons(PANEL.body); PANEL.body.querySelectorAll('.gm-sayb').forEach(b => { b.onclick = () => sayIt(b.dataset.s); });
      if ((await next()).quit) return;
    }
    // reading the menu: she names a dish, you find it
    dots(5, 1);
    for (const d of shuffle(DISHES.slice()).slice(0, 4)) {
      panelSay(`[我|wǒ] [要|yào] ${d.zh[0]} 。`, 'Find what she’s asking for.'); sayIt(d.zh[0]);
      const opts = shuffle([d].concat(shuffle(DISHES.filter(q => q !== d)).slice(0, 3))).map(q => ({ html: icon(q.icon), value: q.id }));
      if ((await choice(`<div class="gm-q">${zhHTML(d.zh[0], 'gm-mid')}<small>Which one is it?</small></div>`, opts, d.id)).quit) return;
    }
    // measure words
    dots(5, 2);
    panelSay('[中文|Zhōng wén] [数|shǔ] [东西|dōng xi] [要|yào] [用|yòng] [量词|liàng cí] 。', 'In Chinese, you count things with a measure word.');
    PANEL.body.innerHTML = `<div class="gm-row" style="gap:22px">${MW.map(m => `<div>${icon(m.icon, 'lg')}<div>${zhHTML(m.ex, 'gm-mid')}</div><div class="gm-read">${esc(CJK.roman(m.ex, { lang: 'zh', cap: false }))}</div><div>${esc(m.exEn)}</div></div>`).join('')}</div>`
      + `<div class="gm-hint">Two is ${model('[两|liǎng]')} before a measure word, not 二: ${model('[两|liǎng] [盘|pán] [饺子|jiǎo zi]')}. And for anything else, ${model('[个|gè]')}.</div>`;
    paintIcons(PANEL.body);
    if ((await next()).quit) return;
    for (const [n, cl, id] of shuffle([[1, '碗', 'w.noodles'], [2, '盘', 'w.jiaozi'], [1, '笼', 'w.baozi'], [3, '杯', 'w.tea']])) {
      panelSay('[用|yòng] [哪个|nǎ ge] [量词|liàng cí] ？', 'Which measure word?');
      const blank = `${ZN[n]} ＿ ${DISH[id].zh[0]}`;
      const opts = shuffle(MW.slice()).map(m => ({ html: `${icon(m.icon, 'sm')}${zhHTML(m.src, 'gm-mid')}`, value: m.cl }));
      if ((await choice(`<div class="gm-q">${zhHTML(blank, 'gm-mid')}<small>${esc(DISH[id].gloss)}</small></div>`, opts, cl, { note: model(orderSrc(n, cl, id)) })).quit) return;
    }
    // taking orders: call each ticket to the kitchen
    dots(5, 3);
    panelSay('[你|nǐ] [来|lái] [当|dāng] [服务员|fú wù yuán] ！ [客人|kè rén] [点|diǎn] [什么|shén me] ， [你|nǐ] [就|jiù] [喊|hǎn] [什么|shén me] 。', 'You be the waiter! Call each ticket to the kitchen.');
    for (const want of [{ id: 'w.jiaozi', n: 2, cl: '盘', t: 1 }, { id: 'w.noodles', n: 1, cl: '碗', t: 3 }, { id: 'w.baozi', n: 3, cl: '笼', t: 1 }, { id: 'w.wonton', n: 2, cl: '碗', t: 3 }]) {
      const d = DISH[want.id], m = MW.find(q => q.cl === want.cl);
      const ticket = `<div class="gm-ticket">Table ${want.t}: ${Array.from({ length: want.n }, () => icon(d.icon, 'sm')).join('')} × ${want.n} ${esc(m.en)}${want.n > 1 ? 's' : ''} of ${esc(d.gloss)}</div>`;
      const r = await typeAns(`<div class="gm-q">${ticket}<small>Call it to the kitchen: how many, the measure word, the dish</small></div>`, t => judgeOrder(t, want),
        { show: orderSrc(want.n, want.cl, want.id), hints: [`Start with the number: ${model(ZN[want.n])}`, `Then the measure word: ${model(m.src)} (${esc(m.en)})`] });
      if (r.quit) return;
    }
    // ordering for yourself: her real menu (shop.js), politely
    dots(5, 4);
    closePanel(); endRun();
    await gline('[很|hěn] [好|hǎo] ！ [现在|xiàn zài] [你|nǐ] [自己|zì jǐ] [点|diǎn] 。 [要|yào] [有|yǒu] [礼貌|lǐ mào] [哦|ó] ： [说|shuō] “ [请|qǐng] ” 。', 'Very good! Now order for yourself. Be polite: say “请”.');
    const r = await order();
    if (r && r.bought && r.bought.length) {
      startRun(); openPanel('Lesson 1 · 点菜', 'Ordering', { dock: true });
      panelSay('[好吃|hǎo chī] [吗|ma] ？', 'Is it good?', null, 'Tell her: delicious!');
      const a = await typeAns('<div class="gm-q">Is it good?</div>', t => (heardAny(t, ['[好吃|hǎo chī]', '[很|hěn] [好吃|hǎo chī]', '[太|tài] [好吃|hǎo chī]']) ? { ok: true, note: model('[好吃|hǎo chī] ！') } : { ok: false, note: `Delicious: ${model('[好吃|hǎo chī]')}` }), { show: '[好吃|hǎo chī] ！', hints: ['好 good + 吃 eat'] });
      closePanel(); endRun();
      if (a.quit) return;
      await gline('[哈哈|hā hā] ！ [好吃|hǎo chī] [就|jiù] [多|duō] [吃|chī] [点儿|diǎn r] ！', 'Ha ha! If it’s good, eat some more!');
    }
    await chapterDone(1, ['ph.gm.huanying', 'ph.gm.haochi', 'ph.gm.manman', 'ph.gm.diancai'], st.ch[1] ? 0 : 6);
  }

  // ------------------------------------------------------------ chapter 2 · 酸甜苦辣咸: say the taste Mimo makes a face at; likes; 太…了
  const TASTES = [
    { k: 'suan', src: '[酸|suān]', en: 'sour', icon: 'gm_sour', hint: '酸 has 酉, a wine jar, on its left: things that ferment go sour, like vinegar (醋).', dish: '[柠檬|níng méng]', dishEn: 'a slice of lemon', react: 'sour' },
    { k: 'tian', src: '[甜|tián]', en: 'sweet', icon: 'gm_sweet', hint: '甜 has 舌, a tongue, on its left: something sweet on your tongue.', dish: '[糖葫芦|táng hú lu]', dishEn: 'candied haws on a stick', react: 'sweet' },
    { k: 'ku', src: '[苦|kǔ]', en: 'bitter', icon: 'gm_bitter', hint: '苦 has 艹, grass, on top: bitter herbs. 吃苦, “to eat bitterness”, means to work hard.', dish: '[苦瓜|kǔ guā]', dishEn: 'bitter melon', react: 'bitter' },
    { k: 'la', src: '[辣|là]', en: 'spicy', icon: 'gm_spicy', hint: 'Sichuan food is famous for 辣. Scared? Ask for 不辣, not spicy!', dish: '[麻婆豆腐|má pó dòu fu]', dishEn: 'mapo tofu', react: 'spicy' },
    { k: 'xian', src: '[咸|xián]', en: 'salty', icon: 'gm_salty', hint: 'A salted duck egg (咸鸭蛋) is very 咸: lovely with plain rice porridge.', dish: '[咸鸭蛋|xián yā dàn]', dishEn: 'a salted duck egg', react: 'salty' },
  ];
  // Mimo tastes it… and makes the face
  async function mimoTaste(react) {
    const M = G.sim.mimo, mm = G.cast && G.cast.mimo;
    M.happy = 0; await STORY.wait(0.4);
    if (react === 'sweet') { M.happy = 1.6; M.glow = 1; G.sim.mimoSay('♥ ♥', 2.2); G.w3d.fx.sparkle(M.x, M.ry + 0.8, M.z, 14, ['#ff9ab8', '#fff3a0']); }
    else if (react === 'sour') { M.tiltT = 1.6; G.sim.mimoSay('>_<', 2.2); M.ears.forEach(e => { e.v -= 14; }); }
    else if (react === 'bitter') { M.sad = 2.2; G.sim.mimoSay('…', 2.2); }
    else if (react === 'spicy') { M.happy = 0.9; G.sim.mimoSay('!!!', 2.2); for (let i = 0; i < 4; i++) setTimeout(() => G.w3d.fx.puff(M.x, M.ry + 0.7, M.z, 3, 0.16, i % 2 ? '#ff6a4a' : '#ffffff', 1.6), i * 250); }
    else { G.sim.mimoSay('💧?', 2.2); M.tiltT = 1.2; if (mm) G.w3d.fx.puff(M.x, M.ry + 0.9, M.z, 2, 0.1, '#bfe6ff', 1); }
    await STORY.wait(1.2);
  }
  // «我喜欢吃甜的»: 喜欢 (or 爱) and a taste; o.neg: 不喜欢
  function judgeLike(text, o = {}) {
    const t = TASTES.find(q => heard(text, q.src)), like = heardAny(text, ['[喜欢|xǐ huan]', '[爱|ài]']), neg = heardAny(text, ['[不|bù] [喜欢|xǐ huan]', '[不|bù] [爱|ài]']);
    if (!t) return { ok: false, note: `Say a taste: ${model('[酸|suān]')} ${model('[甜|tián]')} ${model('[苦|kǔ]')} ${model('[辣|là]')} ${model('[咸|xián]')}` };
    if (!like) return { ok: false, note: `Use ${model('[喜欢|xǐ huan]')}: ${model(`[我|wǒ] ${o.neg ? '[不|bù] ' : ''}[喜欢|xǐ huan] [吃|chī] ${t.src} [的|de]`)}` };
    if (!!o.neg !== neg) return { ok: false, note: o.neg ? `Now what you DON’T like: ${model('[不|bù] [喜欢|xǐ huan]')}` : `That’s what you don’t like! Now what you like: ${model('[我|wǒ] [喜欢|xǐ huan] …')}` };
    const full = heard(text, '[我|wǒ]') && heard(text, '[吃|chī]') && heard(text, '[的|de]'), g = full ? 'S' : 'A';
    return { ok: true, grade: g, taste: t, note: `<span class="gm-grade g${g}">${g}</span>${model(`[我|wǒ] ${o.neg ? '[不|bù] ' : ''}[喜欢|xǐ huan] [吃|chī] ${t.src} [的|de]`)}${full ? '' : ' (the whole sentence: 我 … 吃 … 的)'}` };
  }
  async function ch2() {
    const st = S();
    await gline('[中国菜|Zhōng guó cài] [有|yǒu] [五|wǔ] [种|zhǒng] [味道|wèi dao] ： [酸|suān] 、 [甜|tián] 、 [苦|kǔ] 、 [辣|là] 、 [咸|xián] 。', 'Chinese food has five tastes: sour, sweet, bitter, spicy, salty.');
    startRun(); openPanel('Lesson 2 · 酸甜苦辣咸', 'Five tastes'); dots(5, 0);
    for (const t of TASTES) { panelSay(`${t.src} 。`, t.en); wordCard(t.src, t.en, t.icon, t.hint); if ((await next()).quit) return; }
    dots(5, 1);
    for (const t of shuffle(TASTES.slice()).slice(0, 4)) {
      panelSay(`[哪个|nǎ ge] [是|shì] “ ${t.src} ” ？`, 'Which one is it?'); sayIt(t.src);
      const opts = shuffle(TASTES.slice()).slice(0, 4); if (!opts.includes(t)) opts[0] = t;
      if ((await choice(`<div class="gm-q">${zhHTML(t.src, 'gm-big')}</div>`, shuffle(opts).map(q => ({ html: icon(q.icon), value: q.k })), t.k)).quit) return;
    }
    // Mimo tastes five mystery dishes: you say what it tastes like
    dots(5, 2); dock(true);
    const tbl = SPOT.table;
    G.sim.mimoGo({ x: X0 + SPOT.seat.x, z: Z0 + SPOT.seat.z }, { x: X0 + tbl.x, z: Z0 + tbl.z });
    G.cam.override = { pos: new THREE.Vector3(X0 + tbl.x + 2.6, Y0 + 2.8, Z0 + tbl.z + 4.2), look: new THREE.Vector3(X0 + tbl.x + 0.4, Y0 + 0.8, Z0 + tbl.z), dur: 0.8 };
    for (const t of shuffle(TASTES.slice())) {
      serveDish('w.wonton');
      panelSay(`[尝尝|cháng chang] [这个|zhè ge] ！ [什么|shén me] [味道|wèi dao] ？`, `Taste this! What does it taste like? (Watch ${G.state.mimoName || 'Mimo'}’s face.)`);
      PANEL.body.innerHTML = ''; PANEL.foot.innerHTML = '';
      await mimoTaste(t.react);
      const r = await typeAns(`<div class="gm-q">What does it taste like?</div>`, x => {
        const hit = TASTES.find(q => heard(x, q.src));
        if (hit === t) return { ok: true, note: `${model(t.src)} · ${esc(t.en)}` };
        return { ok: false, note: hit ? `Not ${esc(hit.en)}… look at ${esc(G.state.mimoName || 'Mimo')}’s face again!` : `Say the taste: ${model('[酸|suān]')} ${model('[甜|tián]')} ${model('[苦|kǔ]')} ${model('[辣|là]')} ${model('[咸|xián]')}` };
      }, { show: `[很|hěn] ${t.src}`, hints: [`${G.state.mimoName || 'Mimo'}’s face says: ${t.en}`], tries: 2 });
      if (r.quit) return;
      panelSay(`[对|duì] ！ [这|zhè] [是|shì] ${t.dish} ， [很|hěn] ${t.src} ！`, `Right! It’s ${t.dishEn}: very ${t.en}!`); sayIt(t.dish);
      await tick(1600);
    }
    // what you like, what you don't
    dots(5, 3); dock(false);
    panelSay('[你|nǐ] [喜欢|xǐ huan] [吃|chī] [什么|shén me] [味道|wèi dao] [的|de] ？', 'What tastes do you like?');
    let r = await typeAns(`<div class="gm-q">What do you like? ${model('[我|wǒ] [喜欢|xǐ huan] [吃|chī] … [的|de]')}</div>`, x => judgeLike(x), { show: '[我|wǒ] [喜欢|xǐ huan] [吃|chī] [甜|tián] [的|de]', hints: [`${model('[我|wǒ] [喜欢|xǐ huan] [吃|chī]')} + a taste + ${model('[的|de]')}`] });
    if (r.quit) return;
    const liked = (r.r && r.r.taste) || TASTES[1]; st.liked = liked.k;
    panelSay(`[好|hǎo] ， [我|wǒ] [记住|jì zhu] [了|le] ： [你|nǐ] [喜欢|xǐ huan] ${liked.src} [的|de] 。 [那|nà] [你|nǐ] [不|bù] [喜欢|xǐ huan] [什么|shén me] ？`, `All right, I’ll remember: you like ${liked.en} things. And what don’t you like?`);
    r = await typeAns(`<div class="gm-q">What don’t you like? ${model('[我|wǒ] [不|bù] [喜欢|xǐ huan] …')}</div>`, x => judgeLike(x, { neg: true }), { show: '[我|wǒ] [不|bù] [喜欢|xǐ huan] [吃|chī] [苦|kǔ] [的|de]', hints: [`${model('[不|bù]')} before ${model('[喜欢|xǐ huan]')}`] });
    if (r.quit) return;
    // too spicy!
    dots(5, 4); dock(true);
    serveDish('w.noodles');
    panelSay('[来|lái] ， [尝尝|cháng chang] [我|wǒ] [的|de] [四川|Sì chuān] [辣|là] [面|miàn] ！ [辣|là] [不|bù] [辣|là] ？', 'Here, try my Sichuan chili noodles! Spicy or not?');
    PANEL.body.innerHTML = ''; PANEL.foot.innerHTML = '';
    await mimoTaste('spicy'); await mimoTaste('spicy');
    r = await typeAns(`<div class="gm-q">Way too spicy! Tell her: ${model('[太|tài] … [了|le]')} = too …</div>`, x => {
      const t = TASTES.find(q => heard(x, q.src)), tai = heard(x, '[太|tài]'), le = heard(x, '[了|le]');
      if (t && t.k === 'la' && tai) return { ok: true, grade: le ? 'S' : 'A', note: `<span class="gm-grade g${le ? 'S' : 'A'}">${le ? 'S' : 'A'}</span>${model('[太|tài] [辣|là] [了|le] ！')}${le ? '' : ' (it ends with 了)'}` };
      if (t && t.k === 'la') return { ok: false, note: `Not just spicy: TOO spicy! ${model('[太|tài] [辣|là] [了|le]')}` };
      return { ok: false, note: `Too spicy: ${model('[太|tài]')} + the taste + ${model('[了|le]')}` };
    }, { show: '[太|tài] [辣|là] [了|le] ！', hints: [`${model('[太|tài]')} too … ${model('[了|le]')}`] });
    if (r.quit) return;
    closePanel(); endRun(); G.cam.override = null;
    await gline('[哈哈哈|hā hā hā] ！ [快|kuài] [喝|hē] [口|kǒu] [茶|chá] 。', 'Ha ha ha! Quick, have some tea.');
    serveDish('w.tea'); mimoHappy(10);
    await gline(`[我|wǒ] [给|gěi] [你|nǐ] [做|zuò] [点儿|diǎn r] ${liked.src} [的|de] 。 [人生|rén shēng] [就|jiù] [像|xiàng] [一|yī] [盘|pán] [菜|cài] ， [酸甜苦辣|suān tián kǔ là] [都|dōu] [有|yǒu] 。`,
      `I’ll make you something ${liked.en}. Life is like a dish: sour, sweet, bitter, spicy, it has them all.`);
    await chapterDone(2, ['ph.gm.tailale', 'ph.gm.suantian', 'ph.gm.xihuan'], st.ch[2] ? 0 : 6);
  }

  // ------------------------------------------------------------ chapter 3 · 包饺子: tell Mimo each step at the prep table; 先…再…; count them
  const STEPS = [
    { k: 'huomian', src: '[和面|huó miàn]', alt: ['[和面|hé miàn]'], keys: ['huomian', 'hemian'], en: 'mix the dough', icon: 'gm_dough', hint: 'Flour and water, mixed and kneaded. 和 here is said huó (many people say hé).' },
    { k: 'ganpi', src: '[擀皮|gǎn pí]', alt: ['[擀|gǎn]'], keys: ['ganpi', 'gan'], en: 'roll out the wrappers', icon: 'gm_rollpin', hint: '擀 is rolling with a rolling pin; 皮 is skin: the dumpling’s skin.' },
    { k: 'fangxian', src: '[放馅|fàng xiàn]', alt: ['[放|fàng] [馅儿|xiàn r]', '[包|bāo] [馅|xiàn]'], keys: ['fangxian'], en: 'put in the filling', icon: 'gm_filling', hint: '放 is put; 馅 (馅儿) is the filling: pork and cabbage.' },
    { k: 'bao', src: '[包|bāo]', alt: ['[包饺子|bāo jiǎo zi]', '[捏|niē]'], keys: ['bao', 'nie'], en: 'wrap them (fold and pinch)', icon: 'gm_fold', hint: '包 is wrap: the same 包 as in 包子 and 包饺子.' },
    { k: 'zhu', src: '[煮|zhǔ]', alt: ['[煮饺子|zhǔ jiǎo zi]'], keys: ['zhu'], en: 'boil them', icon: 'gm_boil', hint: 'Into the boiling water! When they float, they’re done.' },
  ];
  const ND = 10;              // how many dumplings you make
  function kitchenProps() {
    if (!ROOM) return null;
    if (ROOM.kit) { ROOM.kit.g.visible = true; return ROOM.kit; }
    const P = SPOT.prep, g = new THREE.Group(); g.position.set(P.x, 0, P.z); ROOM.g.add(g);
    const part = TK.part, Gk = TK.G, y = 0.6, hid = o => { o.userData.base = [o.scale.x, o.scale.y, o.scale.z]; o.userData.k = 0; o.userData.ts = 0; o.scale.setScalar(0.0001); return o; };
    const add = (geo, col, pos, sc, o) => { const m = part(geo, col, pos, sc, Object.assign({ ink: 0.006 }, o || {})); g.add(m); return m; };
    add(new THREE.SphereGeometry(1, 14, 8, 0, TAU, Math.PI / 2, Math.PI / 2), '#e8e0d0', [-0.75, y + 0.12, -0.15], [0.17, 0.12, 0.17]);
    const flour = add(Gk.cone, '#fbf6ea', [-0.75, y + 0.1, -0.15], [0.12, 0.1, 0.12], { ink: 0 });
    add(new THREE.SphereGeometry(1, 14, 8, 0, TAU, Math.PI / 2, Math.PI / 2), '#f4efe4', [-0.75, y + 0.1, 0.22], [0.14, 0.1, 0.14]);
    add(Gk.cyl, '#d98a6a', [-0.75, y + 0.08, 0.22], [0.12, 0.01, 0.12], { ink: 0 });
    const dough = hid(add(Gk.sphere, '#fbf4e2', [-0.32, y + 0.08, 0.05], [0.13, 0.09, 0.13]));
    const pin = add(Gk.cyl, '#c9935a', [0.05, y + 0.04, 0.3], [0.035, 0.5, 0.035], { rot: [0, 0, HALF] });
    const pot = add(Gk.cyl, '#4a4e58', [0.8, y + 0.12, 0], [0.2, 0.22, 0.2]);
    add(Gk.cyl, '#cfe6f0', [0.8, y + 0.23, 0], [0.18, 0.005, 0.18], { ink: 0 });
    const spot = i => ({ x: -0.32 + (i % 5) * 0.2, z: i < 5 ? -0.13 : 0.13 });
    const wraps = [], fills = [], dumps = [], floats = [];
    for (let i = 0; i < ND; i++) {
      const s = spot(i);
      wraps.push(hid(add(Gk.cyl, '#fbf6ea', [s.x, y + 0.006, s.z], [0.075, 0.006, 0.075], { ink: 0.004 })));
      fills.push(hid(add(Gk.sphere, '#d98a6a', [s.x, y + 0.02, s.z], [0.03, 0.02, 0.03], { ink: 0 })));
      dumps.push(hid(add(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI), '#fbf6e8', [s.x, y + 0.005, s.z], [0.075, 0.05, 0.045], { rot: [0, (i % 2) * 0.3, 0] })));
      const a = i * TAU / ND; floats.push(hid(add(Gk.sphere, '#fffaf0', [0.8 + Math.cos(a) * 0.1, y + 0.24, Math.sin(a) * 0.1], [0.045, 0.025, 0.035], { ink: 0.003 })));
    }
    ROOM.kit = { g, flour, dough, pin, pot, wraps, fills, dumps, floats, all: [dough, ...wraps, ...fills, ...dumps, ...floats] };
    return ROOM.kit;
  }
  function kitchenReset() { const K = kitchenProps(); if (!K) return; K.all.forEach(o => { o.userData.ts = 0; o.userData.k = 0; o.scale.setScalar(0.0001); }); K.flour.visible = true; K.boil = 0; K.rolling = 0; }
  // (each part grows back to its own shape when revealed, and shrinks away when it's used up)
  function kitchenUpdate(dt, t) {
    const K = ROOM && ROOM.kit; if (!K || !K.g.visible) return;
    for (const o of K.all) { const u = o.userData; u.k = damp(u.k || 0, u.ts || 0, 9, dt); const k = Math.max(0.0001, u.k), b = u.base; o.scale.set(b[0] * k, b[1] * k, b[2] * k); }
    if (K.rolling > 0) { K.rolling -= dt; K.pin.position.z = 0.15 + Math.sin(t * 9) * 0.12; K.pin.rotation.x = t * 9; }
    if (K.boil > 0 && (K.steamT = (K.steamT || 0) - dt) <= 0) { K.boil -= 0.3; K.steamT = 0.3; G.w3d.fx.puff(X0 + SPOT.prep.x + 0.8, Y0 + 0.9, Z0 + SPOT.prep.z, 1, 0.14, '#ffffff', 0.8); }
  }
  function reveal(o) { o.userData.ts = 1; }
  async function mimoStep(i) {
    const K = kitchenProps(), M = G.sim.mimo, P = SPOT.prep, xs = [-0.6, -0.1, 0.1, 0.35, 0.75];
    G.sim.mimoGo({ x: X0 + P.x + xs[i], z: Z0 + SPOT.prepMimo.z }, { x: X0 + P.x + xs[i], z: Z0 + P.z });
    await STORY.wait(0.7);
    const hop = h => { M.hop = { x0: M.x, z0: M.z, x1: M.x, z1: M.z, y0: M.y, y1: M.y, t: 0, dur: 0.36, h }; };
    if (i === 0) { for (let k = 0; k < 3; k++) { hop(0.55); G.w3d.fx.puff(X0 + P.x - 0.7, Y0 + 0.75, Z0 + P.z - 0.15, 3, 0.1, '#fbf6ea', 1); await STORY.wait(0.4); } K.flour.visible = false; reveal(K.dough); }
    else if (i === 1) { K.rolling = 1.8; for (let k = 0; k < ND; k++) { reveal(K.wraps[k]); if (k % 3 === 0) hop(0.4); await STORY.wait(0.16); } K.dough.userData.ts = 0; }
    else if (i === 2) { for (let k = 0; k < ND; k++) { reveal(K.fills[k]); if (k % 2 === 0) hop(0.45); await STORY.wait(0.15); } }
    else if (i === 3) { for (let k = 0; k < ND; k++) { K.wraps[k].userData.ts = 0; K.fills[k].userData.ts = 0; reveal(K.dumps[k]); if (k % 2 === 0) hop(0.5); await STORY.wait(0.17); } G.w3d.fx.sparkle(X0 + P.x, Y0 + 0.8, Z0 + P.z, 10); }
    else { K.boil = 4; for (let k = 0; k < ND; k++) { K.dumps[k].userData.ts = 0; reveal(K.floats[k]); await STORY.wait(0.12); } hop(0.7); await STORY.wait(0.6); }
    Sound.play(i === 4 ? 'chest' : 'pip');
  }
  // which steps are in what you typed
  const stepsIn = text => STEPS.map((s, i) => (heardAny(text, [s.src].concat(s.alt || [])) ? i : -1)).filter(i => i >= 0);
  const stepSrc = i => STEPS[i].src;
  function judgeStep(text, i, done) {
    const hit = stepsIn(text);
    if (hit.includes(i)) return { ok: true, note: `${model(stepSrc(i))} · ${esc(STEPS[i].en)}` };
    const later = hit.find(j => j > i), before = hit.find(j => j < i);
    if (later !== undefined) return { ok: false, xz: [i, later], note: `${model(`[不对|bú duì] ！ [先|xiān] ${stepSrc(i)} ， [再|zài] ${stepSrc(later)} 。`)} No! First ${esc(STEPS[i].en)}, then ${esc(STEPS[later].en)}.` };
    if (before !== undefined) return { ok: false, note: `${model('[已经|yǐ jīng] [做|zuò] [了|le] ！')} We already did that! What comes next?` };
    return { ok: false, note: `Tell ${esc(G.state.mimoName || 'Mimo')} a step: ${STEPS.map(s => model(s.src)).join(' · ')}` };
  }
  // «先和面，再擀皮»: 先 + a step, 再 (或 然后) + a later step
  function judgeXianZai(text) {
    const c = canon(text).replace(/^(women|wo|ni)/, ''), at = c.indexOf('xian');
    const stepOf = s => { s = s.replace(/^(yao|zuo|yixia)/, ''); return STEPS.findIndex(st => st.keys.some(k => s.startsWith(k))); };
    if (at !== 0) return { ok: false, note: `Start with ${model('[先|xiān]')}: first…` };
    const rest = c.slice(4), sep = rest.match(/zai|ranhou/);
    if (!sep) return { ok: false, note: `Then: ${model('[再|zài]')}: ${model('[先|xiān] [和面|huó miàn] ， [再|zài] [擀皮|gǎn pí]')}` };
    const a = stepOf(rest.slice(0, sep.index)), b = stepOf(rest.slice(sep.index + sep[0].length));
    if (a < 0 || b < 0) return { ok: false, note: `Two steps: ${model('[先|xiān] [和面|huó miàn] ， [再|zài] [擀皮|gǎn pí]')}` };
    if (a >= b) return { ok: false, note: `The other way round! ${model(`[先|xiān] ${stepSrc(b)} ， [再|zài] ${stepSrc(a)}`)}` };
    const g = b === a + 1 ? 'S' : 'A';
    return { ok: true, grade: g, note: `<span class="gm-grade g${g}">${g}</span>${model(`[先|xiān] ${stepSrc(a)} ， [再|zài] ${stepSrc(b)}`)}${g === 'A' ? ` (true, but ${esc(STEPS[a + 1].en)} comes in between!)` : ''}` };
  }
  // a number in what you typed: digits, 十二 / 两, or pinyin (shí èr)
  function numberIn(text) {
    const d = String(text).match(/\d+/); if (d) return +d[0];
    let U; try { U = CJK.typed(text, 'zh').U; } catch (e) { return null; }
    const V = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 }, SY = { ling: 0, yi: 1, er: 2, liang: 2, san: 3, si: 4, wu: 5, liu: 6, qi: 7, ba: 8, jiu: 9, shi: 10 };
    const run = [];
    for (const u of U) { const v = u.han ? V[u.ch] : SY[u.syl]; if (v === undefined) { if (run.length) break; continue; } run.push(v); }
    if (!run.length) return null;
    let n = 0, cur = 0; for (const v of run) { if (v === 10) { n += (cur || 1) * 10; cur = 0; } else cur = v; }
    return n + cur;
  }
  async function ch3() {
    const st = S(), mn = G.state.mimoName || 'Mimo', P = SPOT.prep;
    kitchenReset();
    ROOM.gm.walkTo = { x: X0 + SPOT.gmPrep.x, z: Z0 + SPOT.gmPrep.z }; ROOM.gm.face = { x: X0 + P.x, z: Z0 + P.z + 2 };
    await gline('[今天|jīn tiān] [我们|wǒ men] [一起|yī qǐ] [包|bāo] [饺子|jiǎo zi] ！ {mimo} [也|yě] [来|lái] [帮忙|bāng máng] 。', `Today we’re making dumplings together! ${mn} is helping too.`);
    startRun(); openPanel('Lesson 3 · 包饺子', 'Making dumplings'); dots(5, 0);
    panelSay('[包|bāo] [饺子|jiǎo zi] [有|yǒu] [五|wǔ] [步|bù] 。', 'Making dumplings takes five steps.', null, 'Click 🔊 to hear each one.');
    PANEL.body.innerHTML = `<div class="gm-row" style="gap:14px">${STEPS.map((s, i) => `<div>${icon(s.icon)}<div>${zhHTML(s.src, 'gm-mid')}</div><div class="gm-read">${i + 1}. ${esc(CJK.roman(s.src, { lang: 'zh', cap: false }))} <button class="gm-sayb" data-s="${esc(s.src)}">🔊</button></div><div style="max-width:130px;font-size:14px">${esc(s.en)}</div></div>`).join('')}</div>`;
    paintIcons(PANEL.body); PANEL.body.querySelectorAll('.gm-sayb').forEach(b => { b.onclick = () => sayIt(b.dataset.s); });
    if ((await next()).quit) return;
    for (const s of STEPS) { panelSay(`${s.src} 。`, s.en); wordCard(s.src, s.en, s.icon, s.hint); if ((await next()).quit) return; }
    // the order: which step comes next?
    dots(5, 1);
    const left = STEPS.slice();
    for (let i = 0; i < 4; i++) {
      panelSay(i === 0 ? '[第一步|dì yī bù] [做|zuò] [什么|shén me] ？' : '[然后|rán hòu] [呢|ne] ？', i === 0 ? 'What’s the first step?' : 'And then?');
      const want = STEPS[i], opts = shuffle(left.slice()).map(s => ({ html: `${icon(s.icon, 'sm')}${zhHTML(s.src, 'gm-mid')}`, value: s.k }));
      const r = await choice(`<div class="gm-q">${i === 0 ? 'First…' : 'Then…'}</div>`, opts, want.k, { note: model(want.src) });
      if (r.quit) return; left.splice(left.indexOf(want), 1);
    }
    // in the kitchen: tell Mimo each step (the room in view, the panel docked at the bottom)
    dots(5, 2); dock(true);
    G.cam.override = { pos: new THREE.Vector3(X0 + P.x - 1.2, Y0 + 2.2, Z0 + P.z + 3.3), look: new THREE.Vector3(X0 + P.x + 0.1, Y0 + 0.5, Z0 + P.z), dur: 0.8 };
    for (let i = 0; i < STEPS.length; i++) {
      if (i === 4) {      // before the pot: how many did we make?
        panelSay('[我们|wǒ men] [包|bāo] [了|le] [多少|duō shao] [个|gè] [饺子|jiǎo zi] ？ [数|shǔ] [一|yī] [数|shǔ] ！', 'How many dumplings did we make? Count them!');
        const r = await typeAns(`<div class="gm-q">How many? ${model('… [个|gè]')}</div>`, x => {
          const n = numberIn(x), ge = heard(x, '[个|gè]');
          if (n !== ND) return { ok: false, note: n === null ? `A number and ${model('[个|gè]')}: like ${model('[八|bā] [个|gè]')}` : `Count again! (Not ${n}.)` };
          const g = ge ? 'S' : 'A';
          return { ok: true, grade: g, note: `<span class="gm-grade g${g}">${g}</span>${model('[十|shí] [个|gè] [饺子|jiǎo zi]')}${ge ? '' : ` (count with ${'个'}: 十个)`}` };
        }, { show: '[十|shí] [个|gè]', hints: [`Ten is ${model('[十|shí]')}`, `${model('[十|shí] [个|gè]')}`] });
        if (r.quit) return;
      }
      panelSay(i === 0 ? '[第一步|dì yī bù] ， [告诉|gào su] {mimo} ！' : i === 4 ? '[最后|zuì hòu] [一|yī] [步|bù] ！' : '[下一步|xià yī bù] [呢|ne] ？', i === 0 ? `Step one: tell ${mn}!` : i === 4 ? 'The last step!' : 'And the next step?');
      const strip = `<div class="gm-row" style="gap:6px">${STEPS.map((s, j) => `<span class="gm-step${j < i ? ' done' : j === i ? ' now' : ''}">${icon(s.icon, 'sm')}${j < i ? zhHTML(s.src) : '?'}</span>`).join('')}</div>`;
      let tries = 0;
      const r = await typeAns(`<div class="gm-q">${strip}<small>Tell ${esc(mn)} what to do</small></div>`, x => {
        const j = judgeStep(x, i); tries++;
        if (!j.ok && j.xz) { panelSay(`[不对|bú duì] ！ [先|xiān] ${stepSrc(j.xz[0])} ， [再|zài] ${stepSrc(j.xz[1])} 。`, `No! First ${STEPS[j.xz[0]].en}, then ${STEPS[j.xz[1]].en}.`); sayIt(`[先|xiān] ${stepSrc(j.xz[0])} ， [再|zài] ${stepSrc(j.xz[1])}`); }
        return j;
      }, { show: stepSrc(i), hints: [`${icon(STEPS[i].icon, 'sm')} ${esc(STEPS[i].en)}`], quiet: true, wait: 400 });
      if (r.quit) return;
      G.sim.mimoSay(CJK.plain(stepSrc(i), { lang: 'zh' }) + '！', 1.4);
      PANEL.foot.innerHTML = '';
      await mimoStep(i);
      panelSay(['[对|duì] ！ [和|huó] [得|de] [好|hǎo] 。', '[皮|pí] [擀|gǎn] [得|de] [真|zhēn] [圆|yuán] ！', '[馅儿|xiàn r] [不|bù] [多|duō] [不|bù] [少|shǎo] ， [正好|zhèng hǎo] ！', '[包|bāo] [得|de] [真|zhēn] [漂亮|piào liang] ！', '[浮|fú] [起来|qǐ lái] [了|le] ， [熟|shú] [了|le] ！'][i],
        ['Right! Nicely mixed.', 'Such round wrappers!', 'Not too much filling, not too little: just right!', 'Beautifully wrapped!', 'They’re floating: they’re done!'][i]);
      await tick(1100);
    }
    // first… then…
    dots(5, 4);
    panelSay('[包|bāo] [饺子|jiǎo zi] ， [先|xiān] [做|zuò] [什么|shén me] ， [再|zài] [做|zuò] [什么|shén me] ？', 'Making dumplings: what do you do first, and then?', null, 'Say two steps.');
    const r = await typeAns(`<div class="gm-q">${model('[先|xiān] … ， [再|zài] …')}<small>first …, then …</small></div>`, judgeXianZai, { show: '[先|xiān] [和面|huó miàn] ， [再|zài] [擀皮|gǎn pí]', hints: [`${model('[先|xiān]')} + a step, ${model('[再|zài]')} + the next one`] });
    if (r.quit) return;
    closePanel(); endRun(); G.cam.override = null;
    await gline('[饺子|jiǎo zi] [好|hǎo] [了|le] ！ [趁热|chèn rè] [吃|chī] ！', 'The dumplings are ready! Eat them while they’re hot!');
    serveDish('w.jiaozi'); G.sim.mimoGo({ x: X0 + SPOT.seat.x, z: Z0 + SPOT.seat.z }, { x: X0 + SPOT.table.x, z: Z0 + SPOT.table.z }); mimoHappy(18);
    await gline('[饺子|jiǎo zi] [像|xiàng] [元宝|yuán bǎo] 。 [过年|guò nián] [吃|chī] [饺子|jiǎo zi] ， [新|xīn] [的|de] [一|yī] [年|nián] [有|yǒu] [好运|hǎo yùn] ！', 'Dumplings look like old silver ingots. Eat them at New Year, and the new year brings good luck!');
    if (!st.apron) {
      await gline('[这|zhè] [条|tiáo] [围裙|wéi qún] [送给|sòng gěi] {mimo} 。 [以后|yǐ hòu] [你们|nǐ men] [就是|jiù shì] [我|wǒ] [的|de] [小|xiǎo] [帮手|bāng shǒu] ！', `This apron is for ${mn}. From now on, you two are my little helpers!`);
      await giveApron();
    }
    if (!st.cards.includes('jiaozi')) addCard('jiaozi');
    if (ROOM.kit) ROOM.kit.g.visible = false;
    await chapterDone(3, ['ph.gm.xianzai', 'ph.gm.chenre'], st.ch[3] ? 0 : 8);
  }

  // ------------------------------------------------------------ chapter 4 · 节日美食: the festival foods, their stories, her memories
  const FEST = [
    { k: 'moon', n: 3, fest: '[中秋节|Zhōng qiū jié]', festEn: 'the Mid-Autumn Festival', date: '[八月|bā yuè] [十五|shí wǔ]', dateEn: 'the 15th day of the 8th month', food: '[月饼|yuè bǐng]', foodEn: 'mooncakes', icon: 'gm_mooncake', card: 'mooncake' },
    { k: 'lantern', n: 2, fest: '[元宵节|Yuán xiāo jié]', festEn: 'the Lantern Festival', date: '[正月|zhēng yuè] [十五|shí wǔ]', dateEn: 'the 15th day of the 1st month', food: '[汤圆|tāng yuán]', foodEn: 'tangyuan (sweet rice balls)', icon: 'gm_tangyuan', card: 'tangyuan' },
    { k: 'dragon', n: 3, fest: '[端午节|Duān wǔ jié]', festEn: 'the Dragon Boat Festival', date: '[五月|wǔ yuè] [初五|chū wǔ]', dateEn: 'the 5th day of the 5th month', food: '[粽子|zòng zi]', foodEn: 'zongzi (rice in bamboo leaves)', icon: 'gm_zongzi', card: 'zongzi' },
  ];
  const KIND = ['[别|bié] [难过|nán guò]', '[不要|bù yào] [难过|nán guò]', '[我们|wǒ men] [陪|péi] [你|nǐ]', '[我|wǒ] [陪|péi] [你|nǐ]', '[一家人|yī jiā rén]', '[家人|jiā rén]', '[常|cháng] [来|lái]', '[孤单|gū dān]', '[在|zài] [这儿|zhè r]', '[在|zài] [这里|zhè lǐ]', '[抱抱|bào bao]', '[爱|ài] [你|nǐ]', '[朋友|péng you]'];
  async function ch4() {
    const st = S();
    await gline('[每个|měi gè] [节日|jié rì] [都|dōu] [有|yǒu] [自己|zì jǐ] [的|de] [美食|měi shí] 。 [我|wǒ] [给|gěi] [你|nǐ] [讲讲|jiǎng jiang] 。', 'Every festival has its own food. Let me tell you about them.');
    for (const f of FEST) {
      for (let i = 1; i <= f.n; i++) await gsay(`gm.fest.${f.k}.${i}`, { full: true });
      st.st['fest.' + f.k] = 1;
      startRun(); openPanel('Lesson 4 · 节日美食', 'Festival foods', { dock: true }); dots(3, FEST.indexOf(f));
      panelSay(`${f.fest} [吃|chī] [什么|shén me] ？`, `What do people eat at ${f.festEn}?`);
      const r = await typeAns(`<div class="gm-q">${zhHTML(f.fest, 'gm-mid')} ${icon('gm_menu', 'sm')} ?</div>`, x => (heard(x, f.food) ? { ok: true, note: `${icon(f.icon, 'sm')}${model(`[吃|chī] ${f.food}`)} · ${esc(f.foodEn)}` } : { ok: false, note: `She just told you! (${esc(f.foodEn)})` }),
        { show: f.food, hints: [icon(f.icon, 'sm') + ' ' + esc(f.foodEn)] });
      closePanel(); endRun();
      if (r.quit) return;
      addCard(f.card);
    }
    startRun(); openPanel('Lesson 4 · 节日美食', 'Festival foods'); dots(3, 3);
    panelSay('[你|nǐ] [都|dōu] [记住|jì zhu] [了|le] [吗|ma] ？', 'Did you remember them all?');
    if ((await match('<div class="gm-q">Which food for which festival?</div>', FEST.map(f => ({ left: zhHTML(f.fest, 'gm-zh'), right: `${icon(f.icon, 'sm')}${zhHTML(f.food, 'gm-zh')}` })))).quit) return;
    for (const f of shuffle(FEST.slice())) {
      panelSay(`${f.fest} [是|shì] [几月|jǐ yuè] [几号|jǐ hào] ？`, `When is ${f.festEn}?`);
      if ((await choice(`<div class="gm-q">${zhHTML(f.fest, 'gm-mid')}<small>(the old lunar calendar)</small></div>`, shuffle(FEST.slice()).map(q => ({ html: zhHTML(q.date, 'gm-zh'), value: q.k })), f.k, { note: `${model(f.date)}: ${esc(f.dateEn)}` })).quit) return;
    }
    closePanel(); endRun();
    // she goes quiet
    ROOM.gm.face = { x: X0 - HW, z: Z0 - 0.5 };
    await gline('[我|wǒ] [的|de] [孩子们|hái zi men] [都|dōu] [在|zài] [很远|hěn yuǎn] [的|de] [地方|dì fang] 。 [过节|guò jié] [的|de] [时候|shí hou] ， [有时候|yǒu shí hou] [有点儿|yǒu diǎn r] [孤单|gū dān] 。',
      'My children all live far away. At festival time, I sometimes feel a little lonely.');
    ROOM.gm.face = null;
    startRun(); openPanel('Lesson 4 · 节日美食', 'Festival foods', { dock: true });
    panelSay('', `Say something kind to her.`);
    const r = await typeAns('<div class="gm-q">Say something kind to her (in Chinese).</div>', x => (heardAny(x, KIND) ? { ok: true, note: '♥' } : { ok: false, retry: true, note: `Try ${model('[别|bié] [难过|nán guò]')} (don’t be sad) or ${model('[我们|wǒ men] [陪|péi] [你|nǐ]')} (we’re here with you).` }),
      { show: '[奶奶|nǎi nai] ， [别|bié] [难过|nán guò] 。 [我们|wǒ men] [陪|péi] [你|nǐ] ！', hints: [`${model('[别|bié] [难过|nán guò]')}: don’t be sad`], tries: 2 });
    closePanel(); endRun();
    if (r.quit) return;
    mimoHappy(12); G.sim.mimoSay('♥', 2);
    await gline('[谢谢|xiè xie] [你|nǐ] ， [孩子|hái zi] 。 [家人|jiā rén] ， [就是|jiù shì] [一起|yī qǐ] [吃饭|chī fàn] [的|de] [人|rén] 。', 'Thank you, child. Family is the people you eat with.');
    await gline(bells() >= 4 ? '[对了|duì le] … [我|wǒ] [有|yǒu] [一个|yī gè] [秘密|mì mì] 。 [准备|zhǔn bèi] [好|hǎo] [了|le] [就|jiù] [来|lái] [找|zhǎo] [我|wǒ] 。' : '[对了|duì le] … [等|děng] [你|nǐ] [敲响|qiāo xiǎng] [第四|dì sì] [口|kǒu] [钟|zhōng] ， [我|wǒ] [给|gěi] [你|nǐ] [看|kàn] [一个|yī gè] [秘密|mì mì] 。',
      bells() >= 4 ? 'Oh, and… I have a secret. Come and find me when you’re ready.' : 'Oh, and… when you’ve rung the fourth bell, I’ll show you a secret.');
    await chapterDone(4, ['ph.gm.zhongqiu', 'ph.gm.tuanyuan', 'ph.gm.binanguo'], st.ch[4] ? 0 : 8);
  }

  // ------------------------------------------------------------ chapter 5 · 秘密: the painting rolls up; the round door to her courtyard (kungfu.js)
  async function ch5() {
    const st = S(), D = SPOT.door;
    await gline('[跟|gēn] [我|wǒ] [来|lái] 。 [别|bié] [告诉|gào su] [别人|bié rén] [哦|ó] ！', 'Follow me. Don’t tell anyone!');
    ROOM.gm.walkTo = { x: X0 + D.x - 1.0, z: Z0 + D.z + 1.0 }; ROOM.gm.face = { x: X0 + D.x + 1.08, z: Z0 + D.z };
    G.sim.lock = 1;
    G.cam.override = { pos: new THREE.Vector3(X0 + D.x - 1.4, Y0 + 2.4, Z0 + D.z + 5.4), look: new THREE.Vector3(X0 + D.x, Y0 + 1.3, Z0 + D.z), dur: 1.0 };
    await STORY.wait(2.2);
    // she pulls the ladle on its hook… and the painting rolls itself up
    ROOM.gm.pose = 'show';
    for (let k = 0; k < 12; k++) { ROOM.ladle.rotation.z = Math.sin(k / 11 * Math.PI) * 0.6; await STORY.wait(0.05); }
    ROOM.ladle.rotation.z = 0; Sound.play('wood');
    openPainting(false); st.secret = 1;
    await STORY.wait(1.6);
    Sound.play('chest');
    await gline('[这|zhè] [后面|hòu mian] [是|shì] [我|wǒ] [的|de] [小|xiǎo] [院子|yuàn zi] 。 [进来|jìn lái] [吧|ba] 。', 'Behind this is my little courtyard. Come in.');
    ROOM.gm.pose = null; G.cam.override = null; G.sim.lock = 0;
    st.ch[5] = 1; if (G.save) G.save();
    if (typeof KUNGFU !== 'undefined' && KUNGFU.enter) await KUNGFU.enter({ first: true });
    else STORY.think('A round door in the wall… (the courtyard isn’t built yet)', 4);
  }

  // ============================================================ in and out (a room: main.js ROOMS, story.js interactables)
  let inside = false, busy = false;
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; Y.vx = Y.vz = Y.vy = 0; Y.onGround = true;
    M.x = x + Math.cos(yaw) * 0.95; M.z = z - Math.sin(yaw) * 0.95; M.station = null; M.look = null; M.hop = null; M.wander = null;
    [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3);
    G.sim.snap();
  }
  function outsideSpot() {
    const h = house(); if (!h) return { x: -11.6, z: -163.6, yaw: HALF };
    const p = h.world(h.dlx, h.front + 1.5); return { x: p.x, z: p.z, yaw: h.yaw };
  }
  // o.from: 'courtyard' (back through the round door, kungfu.js); o.quiet: no hello
  async function enter(o = {}) {
    if (!G || inside || busy) return;
    busy = true;
    try {
      ensureShop();
      if (!ROOM) buildRoom();
      Sound.play('wood');
      await UI.fade(1, 380);
      inside = true; ROOM.g.visible = true;
      G.w3d.setInterior({ fog: '#2a1814', near: 26, far: 70 });
      if (o.from === 'courtyard') { const s = SPOT.secret; teleport(X0 + s.x, Z0 + s.z + 0.4, 0); G.cam.snap(0, 0.55, 9.5); }
      else { const sp = SPOT.spawn; teleport(X0 + sp.x, Z0 + sp.z, Math.PI); G.cam.snap(Math.PI, 0.6, 10.5); }
      await UI.fade(0, 380);
    } catch (e) { console.error('[grandma] enter', e); }
    busy = false;
    const st = S();
    if (!st.visited) { st.visited = true; UI.chapter(enName('place'), 'Alba · ' + nmPlain('place')); }
    if (G.save) G.save();
    if (o.quiet || o.from) return;
    if (!st.met) { await STORY.wait(0.5); await meet(); }
    else await gsay('gm.back', { full: true });
  }
  async function leave() {
    if (!G || !inside || busy) return;
    busy = true;
    try {
      Sound.play('wood');
      await UI.fade(1, 380);
      inside = false; if (ROOM) ROOM.g.visible = false; G.w3d.setInterior(null);
      const o = outsideSpot(); [o.x, o.z] = WORLD.pushOut(o.x, o.z, 0.45); teleport(o.x, o.z, o.yaw); G.cam.snap(o.yaw + Math.PI - 0.9, 0.34, 8.5);
      await UI.fade(0, 380);
    } catch (e) { console.error('[grandma] leave', e); }
    busy = false;
    if (G.save) G.save();
  }
  // straight into the courtyard (kungfu.js calls this on the way in; the restaurant hides)
  function hideRoom() { inside = false; if (ROOM) ROOM.g.visible = false; }
  function roomItems() {
    const list = []; if (!inside || busy || !ROOM) return list;
    const A = (p, r, label, run) => list.push({ x: X0 + p.x, z: Z0 + p.z, y: Y0, r, label, run });
    A(SPOT.exit, 1.3, 'Leave', leave);
    A(SPOT.talk, 2.3, 'Talk', talk);
    A(SPOT.menu, 1.4, 'Read', async () => { readMenu(); await SIGNS.read(menuCard()); });
    A(SPOT.photo, 1.4, 'Look', async () => {
      const kf = G.state.kf && G.state.kf.done;
      STORY.think(kf ? 'The old black-and-white photo: Master Mei, sixty years ago, in a perfect horse stance. You know that smile.'
        : 'Old photos: her family at a big round table; a red cart selling 包子 in Alba’s plaza; and a young woman in a low fighting stance, a trophy at her feet. She has Grandma Mei’s smile…', 6);
    });
    if (isZh() && S().secret && !(ROOM.rolling)) A(SPOT.secret, 1.5, 'Go in', async () => { if (typeof KUNGFU !== 'undefined' && KUNGFU.enter) await KUNGFU.enter(); });
    return list;
  }
  // (the walls are thin: keep you and Mimo in the room)
  function keepIn() {
    const lim = (v, c, h) => Math.max(c - h, Math.min(c + h, v)), M = G.sim.mimo, Y = G.sim.you;
    if (!M.hidden && (Math.abs(M.x - X0) > HW - 0.3 || Math.abs(M.z - Z0) > HD - 0.3 || M.y < Y0 - 1)) { M.hop = null; M.wander = null; M.x = lim(M.x, X0, HW - 0.7); M.z = lim(M.z, Z0, HD - 0.7); M.y = M.ry = Y0; }
    if (M.wander && (Math.abs(M.wander.x - X0) > HW - 0.7 || Math.abs(M.wander.z - Z0) > HD - 0.7)) { M.wander.x = lim(M.wander.x, X0, HW - 0.8); M.wander.z = lim(M.wander.z, Z0, HD - 0.8); }
    if (Y.y < Y0 - 2 || Math.abs(Y.x - X0) > HW + 0.5 || Math.abs(Y.z - Z0) > HD + 0.5) { const sp = SPOT.spawn; teleport(X0 + sp.x, Z0 + sp.z, Math.PI); }
  }
  function roomUpdate(dt, t) {
    if (!inside || !ROOM) return;
    keepIn(); animateRoom(dt, t); kitchenUpdate(dt, t);
    // (a scene that broke off never leaves you frozen)
    if (G.sim.lock && !STORY.busy && !panelOpen() && !busy && !(typeof SHOP !== 'undefined' && SHOP.isOpen)) { G.sim.lock = 0; G.cam.override = null; }
  }
  const PROVIDER = {         // story.js STORY.extra: outdoors, the door's "Go in", and a nose for dumplings the first time you pass
    interactables() {
      if (!G || !OUT || OUT.broken || !G.state.flags.hatched) return [];
      const D = OUT.doorIn || OUT.door;
      return [{ x: D.x, z: D.z, r: 1.7, label: 'Go in', run: enter }];
    },
    tick(dt, Y) {
      if (!G || !G.state.flags.hatched || !OUT || OUT.broken) return;
      const st = S();
      if (st.told || st.met || !OUT.door) return;
      if (Math.hypot(OUT.door.x - Y.x, OUT.door.z - Y.z) < 7.5) {
        st.told = 'smell';
        STORY.think(`Mmm… something smells amazing. Red lanterns, and a sign: «${nmPlain('place')}». A Chinese restaurant!`, 5);
        if (G.save) G.save();
      }
    },
  };

  // ============================================================ the quest (QUESTS.LIST): Grandma Mei's kitchen
  function quest() {
    const g = s => s.gm || {}, zh = s => s.lang === 'zh';
    const tried = s => DISH_IDS.filter(id => (g(s).ord || {})[id]).length;
    const door = () => (inside ? { x: X0 + SPOT.talk.x, z: Z0 + SPOT.talk.z } : OUT && OUT.door ? OUT.door : null);
    const visit = { text: 'Visit the Chinese restaurant on the north street, just off the plaza', why: 'Red lanterns, a smell of dumplings: Grandma Mei has cooked in Alba for forty years.',
      done: s => !!g(s).met, target: door, hint: '{mimo} sniffs the air and points north from the plaza: red lanterns!' };
    const ALL = [visit,
      { text: 'Order a dish in the language, like at the market', why: 'Ask nicely and she takes a coin off each dish. What she can’t serve you, she packs for the road (it heals in battles).', done: s => tried(s) >= 1, target: door, hint: '{mimo} points at the restaurant. Hungry?' },
      { text: 'Try every dish on her menu ({n}/6)', n: tried, why: 'She has a story for every dish, and a recipe card.', done: s => tried(s) >= 6, target: door, hint: '{mimo} licks its lips and points at the restaurant.' },
      { text: 'Ask her about the festival foods ({n}/3, one after each bell)', n: s => ['moon', 'lantern', 'dragon'].filter(k => (g(s).st || {})['fest.' + k]).length,
        why: 'Mooncakes, tangyuan, zongzi: each festival has its food and its story.', done: s => ['moon', 'lantern', 'dragon'].every(k => (g(s).st || {})['fest.' + k]), target: door, hint: '{mimo} points at the restaurant: story time.' },
    ];
    const ZH = [visit,
      { text: 'Lesson 1 with Grandma Mei: ordering (点菜)', why: 'The menu, measure words (一碗面, 一盘饺子, 一笼包子), taking orders, ordering politely.', done: s => !!(g(s).ch || {})[1], target: door, hint: '{mimo} points at the restaurant.' },
      { text: 'Lesson 2: the five tastes (after the first bell)', why: '酸甜苦辣咸: say what {mimo} is tasting.', done: s => !!(g(s).ch || {})[2], target: () => (bells() >= 1 ? door() : null), hint: '{mimo} points at the restaurant.' },
      { text: 'Lesson 3: making dumplings (after the second bell)', why: 'Tell {mimo} each step: 和面, 擀皮, 放馅, 包, 煮.', done: s => !!(g(s).ch || {})[3], target: () => (bells() >= 2 ? door() : null), hint: '{mimo} points at the restaurant.' },
      { text: 'Lesson 4: festival foods (after the third bell)', why: 'Mooncakes, tangyuan, zongzi, and her own memories.', done: s => !!(g(s).ch || {})[4], target: () => (bells() >= 3 ? door() : null), hint: '{mimo} points at the restaurant.' },
      { text: 'Grandma Mei’s secret (after the fourth bell)', why: 'She promised to show you something…', done: s => !!(g(s).ch || {})[5], target: () => (bells() >= 4 ? door() : null), hint: '{mimo} points at the restaurant, ears up.' },
      { text: 'Train with Master Mei in her courtyard', why: 'Stances, strikes, sayings, and a sparring test. Pass, and {mimo} learns a kung-fu move for battles.', done: s => !!(s.kf && s.kf.done),
        target: () => (typeof KUNGFU !== 'undefined' && KUNGFU.inside ? null : inside ? { x: X0 + SPOT.secret.x, z: Z0 + SPOT.secret.z } : door()), hint: '{mimo} points at the round door behind the painting.' },
    ];
    return {
      id: 'grandma', kind: 'side',
      get title() { return 'Grandma Mei’s kitchen'; },
      get giver() { return 'Grandma Mei, at the Plum Garden'; },
      started: s => !!(g(s).met || g(s).told),
      get steps() { return zh(G ? G.state : {}) ? ZH : ALL; },
      story: [
        { when: s => !!g(s).met, text: 'On Alba’s north street, just off the plaza, Grandma Mei runs the Plum Garden, a Chinese restaurant. She came to Alba forty years ago with a suitcase, a pot and her mother’s recipes.' },
        { when: s => !!g(s).apron, text: '{mimo} has an apron from Grandma Mei: red pocket, gold button.' },
        { when: s => !!g(s).secret, text: 'Behind the plum painting in her kitchen there’s a round door…' },
        { when: s => !!(s.kf && s.kf.done), text: 'Grandma Mei is Master Mei: she taught {mimo} her palm strike, 推掌.' },
      ],
    };
  }

  // ============================================================ the mini-map's mark (minimap.js): a red lantern on the door
  const MARK = {};
  function mapMark(dpr) {
    if (!G || !OUT || OUT.broken || !OUT.door) return null;
    const k = String(dpr);
    if (!MARK[k]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = RED; c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.ellipse(9, 9.5, 6.2, 6.8, 0, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#d9a03a'; c.fillRect(6, 1.5, 6, 2.2); c.fillRect(6, 15.2, 6, 2.2);
      c.strokeStyle = 'rgba(255,230,160,0.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(9, 4); c.lineTo(9, 15); c.stroke();
      MARK[k] = cv;
    }
    return { x: OUT.door.x, z: OUT.door.z, img: MARK[k] };
  }

  // ============================================================ the restaurant's song: lo-fi with a guzheng (Sound.addSong, if audio.js has it)
  // 84 bpm, swung; a dusty boom-bap, an upright bass, a Rhodes on Dmaj9 · Bm7 · Gmaj7 · A7sus, the guzheng singing a
  // pentatonic tune (with a sweep up the strings into each phrase), woodblocks in the second half, a spatula scrape on 4.
  function addSongs() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit || (Sound.songs || []).includes('restaurant')) return;
    const K = Sound.kit, CHS = K.CH('D2: F#3 A3 C#4 E4, B1: A3 D4 F#4, G1: F#3 B3 D4, A1: G3 D4 E4');
    const MEL = K.mel('A4/2 D5 E5 F#5/4 E5/2 D5/4 | r/4 B4/2 D5 A4/8 | G4/2 A4 B4 D5/4 E5/2 D5 B4 | A4/12 r/4 | F#5/2 A5 F#5 E5 D5/4 E5 | F#5/4 E5/2 D5 B4/8 | r/2 B4 D5 E5 F#5/4 A5 | E5/4 D5 r/8');
    Sound.addSong('restaurant', { bpm: 84, len: 128, swing: 0.16, vol: 0.32, verb: 0.2, echo: 0.12, echoSteps: 3, play(i, t, s16) {
      const bar = (i >> 4) & 7, st = i & 15, ch = CHS[bar & 3];
      if (st === 0 || st === 10 || (st === 7 && bar & 1)) K.kick(t, st === 0 ? 0.85 : 0.55);
      if (st === 4 || st === 12) K.snare(t, 0.42);
      if (st % 2 === 0) K.hat(t, st % 4 === 2 ? 0.45 : 0.28); else if (bar > 3) K.shaker(t, 0.4);
      K.crackle(t, s16, 0.7);
      if (st === 0) K.upright(ch[0], t, 0.9, s16 * 5); else if (st === 6) K.upright(ch[0] + 7, t, 0.6, s16 * 3); else if (st === 10) K.upright(ch[0] + 12, t, 0.65, s16 * 3); else if (st === 14) K.upright(ch[0] + 10, t, 0.45, s16 * 2);
      if (st === 0 || st === 11) ch.slice(1).forEach(m => K.epiano(m, t, s16 * (st === 0 ? 9 : 4), 0.55, 0.8));
      const n = MEL[i]; if (n) K.zheng(n[0], t, 0.85, n[1] * s16 * 1.3, n[1] >= 8 ? 1 : 0);
      if (st === 13 && (bar === 3 || bar === 7)) K.gliss([62, 64, 66, 69, 71, 74, 76], t, 0.7, 0.03);
      if (bar > 3 && st % 4 === 2) K.woodblock(t, st === 6 || st === 14, 0.55);
      if (st === 12 && bar === 6) K.scrape(t, s16 * 3, 0.5);
    } });
  }

  // ============================================================ every zh / ja string here passes CJK.validate (tests: GRANDMA._.check())
  function strings() {
    const out = [], put = (where, s, l) => { if (typeof s === 'string' && s) out.push({ where, s, l }); };
    for (const [k, v] of Object.entries(LT)) for (const l of ['zh', 'ja']) (v[l] || []).forEach((s, i) => put(`${k}.${l}[${i}]`, s, l));
    for (const k of Object.keys(NAME)) { put('NAME.' + k + '.zh', NAME[k].zh, 'zh'); put('NAME.' + k + '.ja', NAME[k].ja, 'ja'); }
    DISHES.forEach(d => { d.zh.forEach(s => put(d.key + '.zh', s, 'zh')); d.ja.forEach(s => put(d.key + '.ja', s, 'ja')); });
    PHRASES.forEach(p => put(p.id, p.zh, 'zh'));
    MW.forEach(m => { put('MW', m.src, 'zh'); put('MW', m.ex, 'zh'); });
    TASTES.forEach(t => { put('TASTE', t.src, 'zh'); put('TASTE', t.dish, 'zh'); });
    STEPS.forEach(s => [s.src].concat(s.alt || []).forEach(x => put('STEP', x, 'zh')));
    FEST.forEach(f => ['fest', 'date', 'food'].forEach(k => put('FEST.' + k, f[k], 'zh')));
    KIND.forEach(s => put('KIND', s, 'zh')); PRAISE.concat(OOPS).forEach(([s]) => put('CHEER', s, 'zh'));
    if (typeof SOURCES !== 'undefined') SOURCES.forEach((s, i) => put('SRC' + i, s, 'zh'));
    return out.concat(EXTRA_STRINGS.map(([where, s, l]) => ({ where, s, l })));
  }
  const EXTRA_STRINGS = [];      // (lines written right in the scenes, gathered by tests: see _.check)
  function check() {
    const bad = [];
    for (const { where, s, l } of strings()) { const p = CJK.validate(s, l); if (p.length) bad.push({ where, s, p }); }
    return bad;
  }

  // ============================================================ test drivers (GRANDMA._.t, for the browser console; the game never calls them)
  const TESTS = (() => {
    const g = () => window.__g;
    function setupAlba(o = {}) {
      const G0 = g().game, f = G0.state.flags;
      Object.assign(f, { hatched: true, guideMet: true, guide: true, escort: false, escorted: true, rosa: true, lessons: 2 }, o.flags || {});
      ['hushwave', 'hush', 'lookout', 'glade', 'exit', 'guide', 'gate', 'pass'].forEach(z => { f['z_' + z] = true; });
      const B = G0.sim.npc('bruno'), P = WORLD.L.people.brunoYard; if (B && P) { B.x = P[0]; B.z = P[1]; B.baseYaw = B.yaw = P[2]; }
      G0.state.school = G0.state.school || { told: 'rosa', met: true, done: {}, stars: {} };
      if (o.gm) G0.state.gm = o.gm;
      if (o.coins !== undefined) G0.state.coins = o.coins;
    }
    async function waitFor(fn, sec = 6) { for (let i = 0; i < sec * 10 && !fn(); i++) { await g().go(0.05); await tick(40); } return !!fn(); }
    // play on: lines (E), cards (E), menus (o.choose), the panel (right answers), the shop (o.shop: what to say), until no scene runs
    async function drive(o = {}) {
      const log = [];
      for (let i = 0; i < (o.max || 400); i++) {
        if (panelOpen() && RUN && RUN.cur) {
          const c = RUN.cur;
          if (c.kind === 'next') c.next(); else if (c.kind === 'choice') c.pick(c.right); else if (c.kind === 'match') c.solve();
          else if (c.kind === 'type') { const v = (o.answers && o.answers.shift()) || CJK.plain(c.show || '', { lang: L() }); log.push('type: ' + v); await c.type(v); }
          for (let k = 0; k < 30; k++) { await tick(80); if (!RUN || RUN.cur !== c) break; }
          continue;
        }
        if (typeof SHOP !== 'undefined' && SHOP.isOpen) {
          const say = (o.shop || []).shift();
          if (say) { log.push('shop: ' + say); const r = SHOP._.submit(say); log.push('→ ' + (r && r.grade ? r.grade : r && r.kind)); await tick(200); continue; }
          SHOP._.close('bye'); await tick(200); continue;
        }
        const card = document.querySelector('#card:not(.hidden)');
        if (card && card.textContent.trim()) { log.push('card: ' + card.textContent.replace(/\s+/g, ' ').slice(0, 50)); dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true, cancelable: true })); await tick(350); continue; }
        const ch = document.querySelector('#choose:not(.hidden)');
        if (ch) { const btns = [...ch.querySelectorAll('button')], want = (o.choose || []).shift(); const b = want !== undefined ? btns.find(x => x.textContent.includes(want)) || btns[0] : btns[0]; log.push('choose: ' + b.textContent.slice(0, 40)); b.click(); await tick(250); continue; }
        if (STORY.line) { if (STORY.line.full) { log.push((STORY.line.text || '').slice(0, 50)); await g().press(); } else await g().go(0.3); continue; }
        if (!STORY.busy) break;
        await g().go(0.1); await tick(40);
      }
      return log;
    }
    async function enterNow(o = {}) { STORY.run(() => enter(o)); await waitFor(() => inside && !busy, 8); return o.drive === false ? [] : drive(o); }
    async function chapter(n, o = {}) { STORY.run(() => playChapter(n, o)); await tick(300); return drive(o); }
    async function talkNow(o = {}) { STORY.run(() => talk()); await tick(300); return drive(o); }
    function frame(name) { const D = { door: () => { const d = OUT.door; return { pos: [d.x + 4.2, 3.1, d.z + 3.6], look: [d.x - 1.1, 1.7, d.z - 0.2] }; },
      room: () => ({ pos: [X0 + 0.5, Y0 + 4.2, Z0 + 8.6], look: [X0 - 0.6, Y0 + 1.0, Z0 - 1.8] }), gm: () => ({ pos: [X0 - 0.8, Y0 + 2.1, Z0 + 0.9], look: [X0 + SPOT.gm.x, Y0 + 1.1, Z0 + SPOT.gm.z] }),
      prep: () => ({ pos: [X0 + SPOT.prep.x - 1.2, Y0 + 2.2, Z0 + SPOT.prep.z + 3.3], look: [X0 + SPOT.prep.x + 0.1, Y0 + 0.5, Z0 + SPOT.prep.z] }),
      secret: () => ({ pos: [X0 + SPOT.door.x - 1.4, Y0 + 2.4, Z0 + SPOT.door.z + 5.4], look: [X0 + SPOT.door.x, Y0 + 1.3, Z0 + SPOT.door.z] }) }[name]();
      G.cam.override = { pos: new THREE.Vector3(...D.pos), look: new THREE.Vector3(...D.look), dur: 0.01 };
    }
    return { setupAlba, waitFor, drive, enterNow, chapter, talkNow, frame };
  })();

  // ============================================================ the game side
  function sources() { return strings().filter(x => x.l === 'zh' || x.l === 'ja').map(x => x.s); }
  function init(game) {
    G = game;
    registerLines(); registerPhrases(); addIcons(); addSongs();
    ensureShop();
    try { if (typeof CJK !== 'undefined') CJK.addSource(sources()); } catch (e) { console.error('[grandma]', e); }
    if (typeof INTERIORS !== 'undefined' && INTERIORS.claim) INTERIORS.claim(id => id === DOOR_ID);
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'grandma')) QUESTS.LIST.push(quest());
  }
  return {
    init,
    // as a room (main.js ROOMS; story.js asks the room you're in for its interactables)
    get inside() { return inside; },
    get OUTSIDE() { return inside ? outsideSpot() : null; },
    interactables() { return inside ? roomItems() : []; },
    update(dt, t) { roomUpdate(dt, t); },
    curiosities() { return []; },
    target() { if (!inside) return null; return { x: X0 + SPOT.talk.x, z: Z0 + SPOT.talk.z, hint: `{mimo} points at ${enName('gm')}.` }; },
    get busy() { return busy || panelOpen(); },
    enter, leave,
    // outdoors, every frame (main.js): the lanterns, the signs, the menu board's solid; Mimo's apron
    outdoor(dt, t) {
      outdoor();
      if (G && G.state && G.state.gm && G.state.gm.apron) { const a = apron(); if (a) a.visible = apronOn(); } else if (APRON) APRON.visible = false;
    },
    claims: id => id === DOOR_ID,
    mapMark,
    DOOR_ID, ROOM_AT: { x: X0, y: Y0, z: Z0 },
    // for kungfu.js (the courtyard behind her kitchen): her figure, the panel, the typed-answer helpers, the phrasebook
    kit: { makeGrandma, openPanel, closePanel, panelOpen, panelSay, dots, dock, next, choice, match, typeAns, startRun, endRun, get RUN() { return RUN; },
      heard, heardAny, isOnly, bare, canon, zhHTML, model, icon, paintIcons, sayIt, esc, wordCard, hideRoom, enterFrom: o => enter(Object.assign({ from: 'courtyard' }, o || {})),
      S, isZh, lantern, Kit, bakeInto, canvasTex, plane, glowSprite, vtext, seal, FONT, teachPhrase, mimoHappy, coinsUp },
    // tests and tools
    _: { S: () => S(), LT, DISHES, CARDS, PHRASES, STEPS, TASTES, FEST, MW, SPOT, NAME, strings, check, sources, house, outsideSpot, menuCard, signCard, judgeOrder, judgeLike, judgeStep, judgeXianZai, numberIn,
      heard, isOnly, talk, meet, order, served, chat, playChapter, ch1, ch2, ch3, ch4, ch5, mimoStep, kitchenReset, serveDish, giveApron, openPainting, ensureShop,
      get OUT() { return OUT; }, get ROOM() { return ROOM; }, get RUN() { return RUN; }, panelOpen, closePanel, quest, t: TESTS },
  };
})();
