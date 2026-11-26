'use strict';
// Town life: the people and corners that make Alba, Molinar and Remanso feel lived in (helper module).
//  - The smokers: three guys around a cable-reel table in Alba's south-west corner, by the west gate, each from a different
//    region, so each talks his own way. Who sits there, and how they look, follows the playthrough's language:
//      es  Chuy (Mexico City) · Facu (Buenos Aires, with «vos») · Pipe (Medellín)
//      pt  Beto (Rio de Janeiro) · Juninho (São Paulo) · Tonho (Salvador, Bahia)
//      de  Kalle (Berlin) · Ferdl (Vienna) · Ueli (Zürich)
//      zh  大鹏 Dàpéng (Beijing) · 阿杰 Ā Jié (Chengdu) · 铁柱 Tiězhù (Harbin, the Northeast)       (sailor: 老高 Lǎo Gāo)
//      ja  マサ Masa (Osaka) · ショウ Shō (Hakata) · カイ Kai (Okinawa)                          (sailor: ゲンさん Gen-san)
//    (zh / ja: the notation of CJK.md; their swearing is PG at every level. See "zh / ja" below the paper's headlines.)
//    Each teaches 5 phrases of his slang: you copy each one, then he quizzes you, output first ("How would someone from
//    Mexico say 'cool'?" → «chido»). They bicker about whose slang is best.
//  - The swearer: an old sailor fixing his turnip cart by the east gate (Don Goyo · Seu Tião · Hein), who swears at the
//    wheel nonstop and teaches swear words in three lessons (mild, strong, very strong), with how strong each one is and
//    when NOT to say it. With KEYS.opts.bleep on, swears show as «m***» and he only teaches the mild ones.
//  - Corner stores (you buy by asking: SHOP.open with new stalls, through SHOP.extend in shop.js):
//      Alba, inside the north gate:  la tiendita · a vendinha · der Kiosk        (Doña Chela · Dona Cida · Frau Kaya)
//      Molinar, by the Great Mill:   el almacén · o mercadinho · der Späti        (Nacho · Guto · Timo, always sleepy)
//      Remanso, at the way in:       el kiosco · a banca · das Büdchen            (Doña Pili · Dona Graça · Frau Pütz)
//    New goods: juice, soda, ice cream, candy, chocolate, gum and the newspaper (ice cream, candy and chocolate heal in
//    battle; the paper has the day's headlines; gum makes Mimo blow a bubble).
//  - Five side quests (QUESTS.LIST): Michi the lost cat (ask people «¿Has visto un gato?»), the kite in the tree (tell Mimo
//    «¡Salta!»), the store sign with a typo (write it right), a parcel for an old man you have to ask for by name, and a shy
//    fisher who needs help asking someone out for ice cream.
//  - Life: a man reading the paper, two neighbors gossiping, someone sweeping, a dog walker, three old men at dominoes.
//
// One global, TOWNLIFE:
//   TOWNLIFE.init(game)                    words, phrases, icons, lines, the stores' goods (SHOP.extend), the quests
//   TOWNLIFE.build(scene, { terrainAt })   → { colliders, group, people, update(dt, t, you|null), stats() }
//   TOWNLIFE.interactables()               → [{ x, z, r, label, run }] near you (story.js adds them outdoors)
//   TOWNLIFE.phrasebook()                  → every phrase of this language: { id, phrase, shown, en, note, region, register,
//                                            strength, learned, from } (for the journal's Phrasebook)
//   TOWNLIFE.bleep(text)                   → the text with swears bleeped when KEYS.opts.bleep is on
//   TOWNLIFE.bareAt(x, z)                  → 0..1, plain data: where world.js keeps the grass short (under the stores, the corners)
// Progress lives in state.tl. Phrases are registered with LEX (kind 'phrase') and marked seen, but not "taught": that would
// fill Mimo's working set, crowd LEX.due() and push weave()/tier() up. What you learned is in state.tl.phr.
// Loads after cornmaze.js, before world.js (whose grass asks bareAt). Needs THREE (r128), core.js and toonkit.js at load; LEX,
// ICONS, LINES, UI, STORY, SHOP, QUESTS, WORLD and Sound at run time.

const TOWNLIFE = (() => {
  const LANGS = ['es', 'pt', 'de'];
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  let G = null;                                   // the game (main.js), from init()
  const lang = () => (G && G.state && LANGS.includes(G.state.lang) ? G.state.lang : typeof UI !== 'undefined' && LANGS.includes(UI.lang) ? UI.lang : 'es');
  const S = () => {
    const st = G.state;
    if (!st.tl) st.tl = {};
    const t = st.tl;
    t.phr = t.phr || {}; t.q = t.q || {}; t.sm = t.sm || {}; t.sw = t.sw || {}; t.met = t.met || {}; t.talk = t.talk || {};
    return t;
  };
  const bleepOn = () => !!(typeof KEYS !== 'undefined' && KEYS.opts && KEYS.opts.bleep === true);
  const shuffle = (a, R = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const nn = s => ' ' + norm(s) + ' ';
  // zh / ja (CJK.md): lang() above stays es / pt / de for this file's own tables, so a zh / ja game must never show them:
  // lines go to the English weave, the slang characters stay hidden, signs and models have zh / ja (or English) versions
  const realLang = () => (G && G.state && G.state.lang) || (typeof UI !== 'undefined' && UI.lang) || 'es';
  const cjkGame = () => typeof CJK !== 'undefined' && CJK.isCJK(realLang());
  const dl = () => (cjkGame() ? realLang() : lang());          // (the language to show and judge in: the tables below that have zh / ja)
  const plainC = t => (cjkGame() && typeof t === 'string' ? CJK.plain(t, { lang: realLang() }) : t);     // (zh / ja notation as plain text)
  // (zh / ja keys: matched in the typed text or its pinyin / rōmaji, which has no spaces between words)
  const hasAny = (text, keys) => {
    if (!keys) return false;
    if (cjkGame()) { const c = CJK.canon(text, realLang()) + ' ' + String(text); return keys.some(k => c.includes(/^[a-z ]+$/.test(k) ? k.replace(/ /g, '') : k)); }
    const n = nn(text); return keys.some(k => n.includes(' ' + norm(k) + ' '));
  };

  // ================================================================ where everything is
  // Alba (flat at y 0.25): the smokers against the west wall of the house by the west gate; the swearer's cart inside the
  // east gate; the corner store just inside the north gate, facing the north street. Molinar: the store by the Great Mill's
  // forecourt, with the dominoes table and the kite tree. Remanso: the store at the way in, facing the road.
  const TOWN_C = { alba: { x: -10, z: -150, show: 130 }, molinar: { x: 215, z: -150, show: 130 }, remanso: { x: -165, z: -150, show: 110 } };   // (each corner is drawn within `show` of its town)
  const PL = {
    hangout: { table: { x: -47.5, z: -142.5 }, bench: { x: -45.5, z: -142.6, len: 3.0 },
      seats: [{ x: -45.55, z: -142.75, yaw: -Math.PI / 2, seat: 0.48 }, { x: -48.85, z: -143.7, yaw: 0.93, seat: 0.5 }, { x: -48.7, z: -141.0, yaw: 2.3, seat: 0.5 }],
      crates: [{ x: -48.85, z: -143.7, rot: 0.3 }, { x: -48.7, z: -141.0, rot: -0.2 }], catCrate: { x: -46.9, z: -145.3, rot: 0.15 } },
    cart: { x: 30.4, z: -140.7, rot: 0.22, goyo: { x: 30.6, z: -139.35, yaw: 0.22 + Math.PI } },
    stores: {
      alba: { x: -1.25, z: -188.6, yaw: -Math.PI / 2, stall: 'tl_alba', town: 'alba', awn: ['#e05a4b', '#fff4e4'], goods: ['w.juice', 'w.soda', 'w.candy', 'w.chocolate', 'w.gum', 'w.newspaper'] },
      molinar: { x: 249.6, z: -162.6, yaw: -Math.PI / 2, stall: 'tl_molinar', town: 'molinar', awn: ['#3f6fb5', '#fff4e4'], goods: ['w.icecream', 'w.juice', 'w.soda', 'w.chocolate', 'w.candy'] },
      remanso: { x: -135.4, z: -156.5, yaw: 0, stall: 'tl_remanso', town: 'remanso', awn: ['#2f8f8a', '#fff4e4'], goods: ['w.icecream', 'w.soda', 'w.gum', 'w.newspaper', 'w.candy'] },
    },
    paperMan: { x: -0.55, z: -185.7, yaw: -2.4, seat: 0.45 },
    gossip: [{ x: -4.7, z: -191.5 }, { x: -3.7, z: -192.25 }],
    paloma: { x: -7.4, z: -187.3, yaw: 1.5 },
    dominoes: { x: 256.4, z: -156.0 },
    kiteTree: { x: 254.4, z: -166.9 }, kiteKid: { x: 252.5, z: -165.0, yaw: 2.2 },
    sign: { x: 247.4, z: -160.2, yaw: -Math.PI / 2 },
    sweep: [[244.2, -158.9], [244.2, -162.8]],
    dogPath: [[238.6, -163.4], [243.5, -166.6], [249.0, -167.6], [252.2, -170.2]],
    vale: { x: -133.15, z: -155.3, yaw: -2.2 }, shy: { x: -138.7, z: -153.5, yaw: 1.75 },
  };
  // a point in front of something facing `yaw` (people and shops face local +z)
  const ahead = (o, d, side = 0) => ({ x: o.x + Math.sin(o.yaw) * d + Math.cos(o.yaw) * side, z: o.z + Math.cos(o.yaw) * d - Math.sin(o.yaw) * side });
  // Where the grass stays short (world.js townBare asks, before anything is built): under the stores and in front of their
  // counters, the smokers' corner, the cart and its turnips, the dominoes table, the sign, Remanso's little table.
  const BARE = (() => {
    const list = Object.values(PL.stores).map(st => ({ obox: 1, x: st.x + Math.sin(st.yaw) * 0.35, z: st.z + Math.cos(st.yaw) * 0.35, hw: 2.4, hd: 1.9, rot: st.yaw, soft: 0.8 }));
    list.push({ x: -47.0, z: -142.6, r: 2.9, soft: 1.0 }, { x: PL.hangout.catCrate.x, z: PL.hangout.catCrate.z, r: 0.9, soft: 0.5 }, { x: 30.7, z: -140.0, r: 3.0, soft: 1.0 },
      { x: PL.dominoes.x, z: PL.dominoes.z, r: 2.0, soft: 0.8 }, { x: PL.sign.x, z: PL.sign.z, r: 0.8, soft: 0.4 }, { x: PL.stores.remanso.x + 2.6, z: PL.stores.remanso.z + 2.0, r: 1.3, soft: 0.5 },
      { x: PL.paperMan.x, z: PL.paperMan.z, r: 0.9, soft: 0.5 });
    return list;
  })();
  function bareAt(x, z) {
    let a = 0;
    for (const b of BARE) {
      if (Math.abs(x - b.x) > 5 || Math.abs(z - b.z) > 5) continue;
      let d;
      if (b.obox) { const c = Math.cos(b.rot), s = Math.sin(b.rot), lx = (x - b.x) * c - (z - b.z) * s, lz = (x - b.x) * s + (z - b.z) * c; d = Math.max(Math.abs(lx) - b.hw, Math.abs(lz) - b.hd); }
      else d = Math.hypot(x - b.x, z - b.z) - b.r;
      a = Math.max(a, 1 - smoothstep(-b.soft, 0, d));
    }
    return a;
  }

  // ================================================================ words (LEX): the new goods, the cat and the kite
  const WORDS = [
    { id: 'w.juice', es: 'jugo', pt: 'suco', de: 'Saft', en: 'juice', enPl: 'juices', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'jugos', pt: 'sucos', de: 'Säfte' }, icon: 'juice', alt: { es: ['zumo'] } },
    { id: 'w.soda', es: 'refresco', pt: 'refrigerante', de: 'Limonade', en: 'soda', enPl: 'sodas', g: { es: 'm', pt: 'm', de: 'f' }, pl: { es: 'refrescos', pt: 'refrigerantes', de: 'Limonaden' }, icon: 'soda', alt: { es: ['gaseosa', 'soda'], pt: ['refri'], de: ['Limo', 'Cola'] } },
    { id: 'w.icecream', es: 'helado', pt: 'sorvete', de: 'Eis', en: 'ice cream', enPl: 'ice creams', g: { es: 'm', pt: 'm', de: 'n' }, pl: { es: 'helados', pt: 'sorvetes', de: 'Eis' }, icon: 'icecream', alt: { pt: ['picolé'] } },
    { id: 'w.candy', es: 'dulce', pt: 'bala', de: 'Bonbon', en: 'candy', enPl: 'candies', g: { es: 'm', pt: 'f', de: 'm' }, pl: { es: 'dulces', pt: 'balas', de: 'Bonbons' }, icon: 'candy', alt: { es: ['caramelo', 'golosina'], pt: ['docinho'] } },
    { id: 'w.chocolate', es: 'chocolate', pt: 'chocolate', de: 'Schokolade', en: 'chocolate', enPl: 'chocolate bars', g: { es: 'm', pt: 'm', de: 'f' }, pl: { es: 'chocolates', pt: 'chocolates', de: 'Schokoladen' }, icon: 'chocolate', alt: { es: ['chocolatina'], de: ['Schoki'] } },
    { id: 'w.gum', es: 'chicle', pt: 'chiclete', de: 'Kaugummi', en: 'gum', enPl: 'packs of gum', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'chicles', pt: 'chicletes', de: 'Kaugummis' }, icon: 'gum' },
    { id: 'w.newspaper', es: 'periódico', pt: 'jornal', de: 'Zeitung', en: 'newspaper', enPl: 'newspapers', g: { es: 'm', pt: 'm', de: 'f' }, pl: { es: 'periódicos', pt: 'jornais', de: 'Zeitungen' }, icon: 'newspaper', alt: { es: ['diario'] } },
    { id: 'w.cat', es: 'gato', pt: 'gato', de: 'Katze', en: 'cat', enPl: 'cats', g: { es: 'm', pt: 'm', de: 'f' }, pl: { es: 'gatos', pt: 'gatos', de: 'Katzen' }, icon: 'cat', alt: { es: ['gata', 'gatito'], pt: ['gata', 'gatinho'], de: ['Kater'] } },
    { id: 'w.kite', es: 'cometa', pt: 'pipa', de: 'Drachen', en: 'kite', enPl: 'kites', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'cometas', pt: 'pipas', de: 'Drachen' }, icon: 'kite',
      alt: { es: ['papalote', 'barrilete', 'chiringa', 'volantín', 'papagayo'], pt: ['papagaio', 'pandorga', 'arraia'] } },
  ];
  // the shop's side (shop.js SHOP.extend): [id, price, hearts it heals in battle, stalls], the forms the keepers understand
  const SHOP_ITEMS = [['w.juice', 2, 0], ['w.soda', 2, 0], ['w.icecream', 3, 2], ['w.candy', 1, 1], ['w.chocolate', 2, 1], ['w.gum', 1, 0], ['w.newspaper', 2, 0]];
  const SHOP_GOODS = {
    es: { 'w.juice': [['jugo', 'jugos', 'm'], ['zumo', 'zumos', 'm']], 'w.soda': [['refresco', 'refrescos', 'm'], ['gaseosa', 'gaseosas', 'f'], ['soda', 'sodas', 'f']],
      'w.icecream': [['helado', 'helados', 'm']], 'w.candy': [['dulce', 'dulces', 'm'], ['caramelo', 'caramelos', 'm'], ['golosina', 'golosinas', 'f']],
      'w.chocolate': [['chocolate', 'chocolates', 'm'], ['chocolatina', 'chocolatinas', 'f']], 'w.gum': [['chicle', 'chicles', 'm']], 'w.newspaper': [['periódico', 'periódicos', 'm'], ['diario', 'diarios', 'm']] },
    pt: { 'w.juice': [['suco', 'sucos', 'm']], 'w.soda': [['refrigerante', 'refrigerantes', 'm'], ['refri', 'refris', 'm']], 'w.icecream': [['sorvete', 'sorvetes', 'm'], ['picolé', 'picolés', 'm']],
      'w.candy': [['bala', 'balas', 'f'], ['docinho', 'docinhos', 'm']], 'w.chocolate': [['chocolate', 'chocolates', 'm']], 'w.gum': [['chiclete', 'chicletes', 'm']], 'w.newspaper': [['jornal', 'jornais', 'm']] },
    de: { 'w.juice': [['Saft', 'Säfte', 'm']], 'w.soda': [['Limonade', 'Limonaden', 'f'], ['Limo', 'Limos', 'f'], ['Cola', 'Colas', 'f']], 'w.icecream': [['Eis', 'Eis', 'n']],
      'w.candy': [['Bonbon', 'Bonbons', 'm']], 'w.chocolate': [['Schokolade', 'Schokoladen', 'f'], ['Schoki', 'Schokis', 'f']], 'w.gum': [['Kaugummi', 'Kaugummis', 'm']], 'w.newspaper': [['Zeitung', 'Zeitungen', 'f']] },
  };
  const SHOP_EN = { 'w.juice': ['juice', 'juices'], 'w.soda': ['soda', 'sodas'], 'w.icecream': ['ice cream', 'ice creams'], 'w.candy': ['candy', 'candies'],
    'w.chocolate': ['chocolate bar', 'chocolate bars'], 'w.gum': ['gum', 'packs of gum'], 'w.newspaper': ['newspaper', 'newspapers'] };
  const STORE_NAME = {
    alba: { es: 'La tiendita', pt: 'A vendinha', de: 'Der Kiosk', en: 'Corner store', zh: '[小卖部|xiǎo mài bù]', ja: '[売店|ばいてん]' },
    molinar: { es: 'El almacén', pt: 'O mercadinho', de: 'Der Späti', en: 'Corner store', zh: '[杂货店|zá huò diàn]', ja: '[雑貨屋|ざっかや]' },
    remanso: { es: 'El kiosco', pt: 'A banca', de: 'Das Büdchen', en: 'Kiosk', zh: '[报亭|bào tíng]', ja: 'キオスク' },
  };
  const SIGN_TEXT = { alba: { es: 'LA TIENDITA', pt: 'A VENDINHA', de: 'KIOSK', zh: '[小卖部|xiǎo mài bù]', ja: '[売店|ばいてん]' },
    molinar: { es: 'EL ALMACÉN', pt: 'MERCADINHO', de: 'SPÄTI', zh: '[杂货店|zá huò diàn]', ja: '[雑貨屋|ざっかや]' }, remanso: { es: 'EL KIOSCO', pt: 'A BANCA', de: 'BÜDCHEN', zh: '[报亭|bào tíng]', ja: 'キオスク' } };
  // where the keepers send you for something they don't sell (shop.js notHere: «Prueba en el almacén de Molinar»)
  const WHERE_ST = {
    alba: { es: 'en la tiendita de Alba', pt: 'na vendinha de Alba', de: 'am Kiosk in Alba', en: 'the corner store in Alba', zh: '[阿尔巴|Ā ěr bā] [的|de] [小卖部|xiǎo mài bù]', ja: 'アルバ の [売店|ばいてん]' },
    molinar: { es: 'en el almacén de Molinar', pt: 'no mercadinho de Molinar', de: 'im Späti in Molinar', en: 'the corner store in Molinar', zh: '[磨坊镇|Mò fáng zhèn] [的|de] [杂货店|zá huò diàn]', ja: 'モリナール の [雑貨屋|ざっかや]' },
    remanso: { es: 'en el kiosco de Remanso', pt: 'na banca de Remanso', de: 'am Büdchen in Remanso', en: 'the kiosk in Remanso', zh: '[静水村|Jìng shuǐ cūn] [的|de] [报亭|bào tíng]', ja: 'レマンソ の キオスク' },
  };
  // what each keeper says when you walk up (shop.js lines: text and shop-word slots; k.goods lists the shelf)
  const WELCOME = {
    alba: { es: (c, k) => ['¡Hola, corazón! Tengo ', ...k.goods(c.stall, ' y '), '. ¿Qué te doy?'], pt: (c, k) => ['Oi, meu bem! Tenho ', ...k.goods(c.stall, ' e '), '. O que vai ser?'],
      de: (c, k) => ['Hallo, Schätzchen! Ich hab ', ...k.goods(c.stall, ' und '), '. Was darf’s sein?'], en: (c, k) => ['Hi, sweetheart! I’ve got ', ...k.goods(c.stall, ' and '), '. What can I get you?'] },
    molinar: { es: (c, k) => ['¡Hola! Aaah… perdón, qué sueño. Tengo ', ...k.goods(c.stall, ' y '), '. ¿Qué te doy?'], pt: (c, k) => ['Oi! Aaah… desculpa, que sono. Tenho ', ...k.goods(c.stall, ' e '), '. O que vai ser?'],
      de: (c, k) => ['Hallo! Aaah … Entschuldigung, bin so müde. Ich hab ', ...k.goods(c.stall, ' und '), '. Was darf’s sein?'], en: (c, k) => ['Hi! Aaah… sorry, I’m so sleepy. I’ve got ', ...k.goods(c.stall, ' and '), '. What can I get you?'] },
    remanso: { es: (c, k) => ['¡Hola, cielo! ¡Qué calor! Tengo ', ...k.goods(c.stall, ' y '), '. ¿Qué te doy?'], pt: (c, k) => ['Oi, meu anjo! Que calor! Tenho ', ...k.goods(c.stall, ' e '), '. O que vai ser?'],
      de: (c, k) => ['Hallo, Herzchen! Heiß heute, ne? Ich hab ', ...k.goods(c.stall, ' und '), '. Was darf’s sein?'], en: (c, k) => ['Hi, sweetheart! Hot today, huh? I’ve got ', ...k.goods(c.stall, ' and '), '. What can I get you?'] },
  };
  // zh / ja (CJK.md; shop.js parseCJ): the same keepers, in the notation (k.goods joins with 、 / 和 or と)
  Object.assign(WELCOME.alba, {
    zh: (c, k) => ['[你好|nǐ hǎo] ， [宝贝|bǎo bèi] ！ [我|wǒ] [这里|zhè lǐ] [有|yǒu]', ...k.goods(c.stall, '[和|hé]'), '。 [要|yào] [点|diǎn] [什么|shén me] ？'],
    ja: (c, k) => ['いらっしゃい ！', ...k.goods(c.stall, 'と'), 'が あります よ 。 なに に します か ？'] });
  Object.assign(WELCOME.molinar, {
    zh: (c, k) => ['[你好|nǐ hǎo] ！ [啊|a] … [不好意思|bù hǎo yì si] ， [好|hǎo] [困|kùn] 。 [我|wǒ] [这里|zhè lǐ] [有|yǒu]', ...k.goods(c.stall, '[和|hé]'), '。 [要|yào] [点|diǎn] [什么|shén me] ？'],
    ja: (c, k) => ['いらっしゃい … ふわあ 、 すみません 、 ねむくて 。', ...k.goods(c.stall, 'と'), 'が あります 。 なに に します か ？'] });
  Object.assign(WELCOME.remanso, {
    zh: (c, k) => ['[你好|nǐ hǎo] ， [亲爱的|qīn ài de] ！ [今天|jīn tiān] [好|hǎo] [热|rè] [啊|a] ！ [我|wǒ] [这里|zhè lǐ] [有|yǒu]', ...k.goods(c.stall, '[和|hé]'), '。 [要|yào] [点|diǎn] [什么|shén me] ？'],
    ja: (c, k) => ['いらっしゃい ！ [今日|きょう] は [暑|あつ]い です ね ！', ...k.goods(c.stall, 'と'), 'が あります よ 。 なに に します か ？'] });

  // ================================================================ icons (icons.js: paper cutouts, one ink line)
  function addIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const has = k => ICONS.keys.includes(k);
    const line = (c, pts, col, w = 2) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(p => c.lineTo(p[0], p[1])); c.lineWidth = w; c.strokeStyle = col; c.stroke(); };
    if (!has('juice')) ICONS.add('juice', (c, p, h) => {        // a juice box with a straw
      h.shape(c, p, h.rr(-18, -20, 36, 50, 4), '#f39a2b'); h.shape(c, p, h.poly([[-18, -20], [-10, -30], [18, -30], [18, -20]]), '#f7b955');
      if (p) { line(c, [[8, -30], [14, -44], [22, -44]], '#e0503f', 3); h.dot(c, 0, 6, 10, '#ffd36b'); h.dot(c, 4, 2, 3, '#7ab648'); }
    });
    if (!has('soda')) ICONS.add('soda', (c, p, h) => {          // a bottle of soda
      h.shape(c, p, k => { k.moveTo(-6, -38); k.lineTo(6, -38); k.lineTo(6, -24); k.quadraticCurveTo(16, -16, 16, -4); k.lineTo(16, 30); k.quadraticCurveTo(16, 34, 12, 34); k.lineTo(-12, 34); k.quadraticCurveTo(-16, 34, -16, 30); k.lineTo(-16, -4); k.quadraticCurveTo(-16, -16, -6, -24); k.closePath(); }, '#6fbf5a');
      h.shape(c, p, h.rr(-8, -44, 16, 8, 2), '#e0503f');
      if (p) { h.shape(c, 1, h.rr(-16, 2, 32, 16, 2), '#fffaf0', 1.6); h.dot(c, -9, -8, 3, 'rgba(255,255,255,0.6)'); }
    });
    if (!has('icecream')) ICONS.add('icecream', (c, p, h) => {  // a cone with two scoops
      h.shape(c, p, h.poly([[-14, 0], [14, 0], [0, 38]]), '#e0b060');
      h.shape(c, p, h.ell(0, -6, 17, 13), '#f6a6c1'); h.shape(c, p, h.ell(0, -24, 14, 12), '#fff3d6');
      if (p) { [[-6, 8, 6, 22], [6, 8, -4, 22]].forEach(([a, b, d, e]) => line(c, [[a, b], [d, e]], '#b8862e', 1.6)); h.dot(c, 4, -36, 4, '#e0503f'); h.dot(c, -6, -28, 3, 'rgba(255,255,255,0.7)'); }
    });
    if (!has('candy')) ICONS.add('candy', (c, p, h) => {        // a wrapped sweet
      h.shape(c, p, h.poly([[-14, 0], [-34, -14], [-34, 14]]), '#f2c14e'); h.shape(c, p, h.poly([[14, 0], [34, -14], [34, 14]]), '#f2c14e');
      h.shape(c, p, h.ell(0, 0, 18, 15), '#e86a9a');
      if (p) { line(c, [[-8, -10], [8, 10]], 'rgba(255,255,255,0.7)', 3); h.dot(c, -6, -6, 3, 'rgba(255,255,255,0.7)'); }
    });
    if (!has('chocolate')) ICONS.add('chocolate', (c, p, h) => {
      h.shape(c, p, h.rr(-26, -18, 52, 36, 3), '#7a4a2e'); h.shape(c, p, h.poly([[-26, 4], [26, -10], [26, 18], [-26, 18]]), '#e0503f');
      if (p) { [-13, 0, 13].forEach(x => line(c, [[x, -18], [x, -6]], '#5b3420', 1.4)); h.dot(c, 6, 8, 4, '#fff3c0'); }
    });
    if (!has('gum')) ICONS.add('gum', (c, p, h) => {            // a pack of gum, and a pink bubble
      h.shape(c, p, h.rr(-30, -6, 34, 26, 3), '#4fb3d9'); h.shape(c, p, h.ell(14, -14, 20, 20), '#f6a6c1');
      if (p) { h.shape(c, 1, h.rr(-26, 0, 26, 8, 2), '#fffaf0', 1.4); h.dot(c, 8, -22, 5, 'rgba(255,255,255,0.7)'); }
    });
    if (!has('newspaper')) ICONS.add('newspaper', (c, p, h) => {
      h.shape(c, p, h.rr(-30, -24, 60, 50, 3), '#fbf6e7');
      if (p) {
        c.fillStyle = h.INK; c.fillRect(-24, -18, 48, 7);
        [-4, 4, 12].forEach(y => line(c, [[-24, y], [-4, y]], 'rgba(43,34,53,0.55)', 2)); [-4, 4, 12].forEach(y => line(c, [[4, y], [24, y]], 'rgba(43,34,53,0.55)', 2));
        h.shape(c, 1, h.rr(-24, -6, 18, 10, 1), '#83c7e2', 1.2);
      }
    });
    if (!has('cat')) ICONS.add('cat', (c, p, h) => {            // an orange cat with white paws
      h.shape(c, p, h.ell(4, 14, 22, 15), '#f0a050');
      h.shape(c, p, k => { k.moveTo(22, 18); k.quadraticCurveTo(40, 14, 34, -6); k.lineTo(30, -4); k.quadraticCurveTo(32, 10, 20, 12); k.closePath(); }, '#f0a050');
      h.shape(c, p, h.poly([[-26, -16], [-22, -36], [-12, -22]]), '#f0a050'); h.shape(c, p, h.poly([[0, -22], [8, -36], [10, -16]]), '#f0a050');
      h.shape(c, p, h.ell(-8, -10, 18, 15), '#f0a050');
      [-10, 10].forEach(x => h.shape(c, p, h.ell(x, 28, 6, 4), '#fffaf0'));
      if (p) { h.eyes(c, -14, -2, -12, 0.8); h.dot(c, -8, -4, 2, '#e86a9a'); }
    });
    if (!has('kite')) ICONS.add('kite', (c, p, h) => {
      h.shape(c, p, h.poly([[0, -36], [22, -6], [0, 22], [-22, -6]]), '#e0503f');
      h.shape(c, p, h.poly([[0, -36], [22, -6], [0, -6]]), '#f2c14e'); h.shape(c, p, h.poly([[0, -6], [-22, -6], [0, 22]]), '#3f7fc9');
      if (p) { line(c, [[0, 22], [6, 30], [-4, 36], [6, 42]], h.INK, 1.6); h.dot(c, 6, 30, 3, '#4f9a5a'); h.dot(c, -4, 36, 3, '#e86a9a'); }
    });
    if (!has('slang')) ICONS.add('slang', (c, p, h) => {        // a speech bubble with a spark
      h.shape(c, p, k => { k.moveTo(-30, -24); k.lineTo(30, -24); k.quadraticCurveTo(36, -24, 36, -18); k.lineTo(36, 8); k.quadraticCurveTo(36, 14, 30, 14); k.lineTo(-6, 14); k.lineTo(-18, 30); k.lineTo(-16, 14); k.lineTo(-30, 14); k.quadraticCurveTo(-36, 14, -36, 8); k.lineTo(-36, -18); k.quadraticCurveTo(-36, -24, -30, -24); k.closePath(); }, '#7fd8cd');
      if (p) { c.fillStyle = h.INK; c.font = '900 24px Bahnschrift, "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('¡!', 0, -4); }
    });
    if (!has('swear')) ICONS.add('swear', (c, p, h) => {        // a stormy bubble full of #@$!
      h.shape(c, p, k => { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, r = i % 2 ? 26 : 33; const x = Math.cos(a) * r * 1.1, y = Math.sin(a) * r * 0.8 - 4; if (i) k.lineTo(x, y); else k.moveTo(x, y); } k.closePath(); }, '#ffd84a');
      if (p) { c.fillStyle = '#d6453a'; c.font = '900 22px Bahnschrift, "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('#@$!', 0, -4); }
    });
  }

  // ================================================================ the smokers (one trio per language)
  // A phrase: { id, tl (as said), en, note, ex/exEn (him using it), ask (the challenge, in English), keys (accepted, normalized) }.
  // Their lines are only in their own language (plus the English, which keeps the slang in «» with a gloss).
  const L1 = (tl, en) => ({ tl, en });
  const SMOKERS = {
    es: [
      { id: 'chuy', name: 'Chuy', region: { tl: 'México', en: 'Mexico' }, color: '#2f8f4e', from: 'Mexico City',
        look: { skin: '#c98e62', hair: '#2e2420', stache: true, dress: '#2f8f4e', legs: true, pants: '#3a4a6a', shoes: '#f4f1ea', hat: 'cap', hatColor: '#2b2235' },
        hi: L1('¡Qué onda! ¿Vienes a echar chisme con nosotros?', '«¿Qué onda?» (what’s up?) Come to «echar chisme» (gossip) with us?'),
        start: L1('Va, te enseño cómo hablamos en México. ¡Pon atención, güey!', 'OK, I’ll teach you how we talk in Mexico. Pay attention, «güey» (dude)!'),
        quiz: L1('¡Ahora tú! A ver si te acuerdas.', 'Now you! Let’s see if you remember.'),
        win: L1('¡Qué chido! Ya hablas como chilango.', '«¡Qué chido!» (how cool!) You already talk like a «chilango» (someone from Mexico City).'),
        ok: L1('¡Nada mal! Con práctica, sale.', 'Not bad! With practice, you’ll get it.'),
        later: L1('Va, luego seguimos, güey.', 'OK, we’ll keep going later, «güey».'),
        chat: [L1('Mi abuela dice que el Silencio se come las palabras. ¡Por eso yo hablo un chorro!', 'My grandma says the Hush eats words. That’s why I talk «un chorro» (a ton)!'),
          L1('Neta, el pan de Marta está bien chido.', '«Neta» (for real), Marta’s {w.bread} is really «chido» (cool).'),
          L1('Oye, tu {mimo} está bien chido. ¿Habla?', 'Hey, your {mimo} is really «chido» (cool). Does it talk?')],
        cat: L1('¿Un gato naranja? ¡Está dormido en la caja, güey! Mira.', 'An orange {w.cat}? It’s asleep in the crate, «güey»! Look.'),
        praise: ['¡Eso!', '¡Chido!', '¡Órale!'],
        phrases: [
          { id: 'ph.mx.queonda', tl: '¿Qué onda?', en: 'What’s up?', note: 'A friendly hello between friends in Mexico. The answer: «¡Nada, todo bien!»', ex: '¡Qué onda! ¿Cómo estás?', exEn: 'What’s up! How are you?', ask: 'Greet a friend the Mexican way: “What’s up?”', keys: ['que onda'] },
          { id: 'ph.mx.guey', tl: 'güey', en: 'dude', note: 'Friends call each other «güey» (also written «wey»). With strangers it can sound rude: save it for your buddies.', ex: '¡Ay, güey, qué hambre!', exEn: 'Oh, dude, I’m so hungry!', ask: 'How does someone from Mexico say “dude” to a friend?', keys: ['guey', 'wey', 'buey'] },
          { id: 'ph.mx.chido', tl: '¡Qué chido!', en: 'How cool!', note: '«chido» = cool, great. «¡Qué chido!» = how cool!', ex: '¡Qué chido está tu {mimo}!', exEn: 'Your {mimo} is so cool!', ask: 'How would someone from Mexico say “cool”?', keys: ['chido', 'chida', 'chidos', 'chidas'] },
          { id: 'ph.mx.nomanches', tl: '¡No manches!', en: 'No way!', note: 'For something hard to believe. It’s the polite cousin of a ruder phrase, so it’s fine almost anywhere.', ex: '¿Marta regala pan? ¡No manches!', exEn: 'Marta is giving away bread? No way!', ask: 'Your friend says the bakery is giving away free bread. React the Mexican way: “No way!”', keys: ['no manches'] },
          { id: 'ph.mx.chamba', tl: 'la chamba', en: 'work, a job', note: '«Me voy a la chamba» = I’m off to work. «chambear» = to work.', ex: 'Mañana tengo mucha chamba.', exEn: 'Tomorrow I’ve got lots of work.', ask: 'In Mexico, what’s a casual word for “work”?', keys: ['chamba', 'chambear', 'chambeo'] },
        ] },
      { id: 'facu', name: 'Facu', region: { tl: 'Argentina', en: 'Argentina' }, color: '#5aa7d8', from: 'Buenos Aires',
        look: { skin: '#f0c7a0', hair: '#6b3b25', beard: true, dress: '#9fd0ef', legs: true, pants: '#4a3a33', shoes: '#5b3a22', hairdo: 'long' }, mate: true,
        hi: L1('Che, ¿y vos quién sos? ¡Vení, sentate!', '«Che» (hey), and who are you? Come, sit down!'),
        start: L1('Bueno, te enseño a hablar como en Buenos Aires. ¿Dale?', 'Well, I’ll teach you to talk like in Buenos Aires. «¿Dale?» (OK?)'),
        quiz: L1('A ver, ahora vos. ¿Te acordás?', 'Let’s see, now you («vos»). Do you remember?'),
        win: L1('¡Bárbaro! Ya sos re porteño.', '«¡Bárbaro!» (great!) You’re «re» (really) «porteño» (from Buenos Aires) now.'),
        ok: L1('Bien, che. Practicá un poco más, ¿dale?', 'Good, «che». Practice a bit more, «¿dale?» (OK?)'),
        later: L1('Dale, después seguimos.', '«Dale» (OK), we’ll carry on later.'),
        chat: [L1('Che, ¿querés un mate? Está re rico.', '«Che» (hey), want some «mate» (tea)? It’s «re» (really) good.'),
          L1('Mañana tengo laburo… pero hoy, ¡charlamos!', 'Tomorrow I’ve got «laburo» (work)… but today, we chat!'),
          L1('En Argentina decimos «vos» en vez de «tú». Vos sabés, ¿no?', 'In Argentina we say «vos» instead of «tú». You know, right?')],
        cat: L1('¿Un gato naranja? Está durmiendo en la caja, che. ¡Mirá!', 'An orange {w.cat}? It’s sleeping in the crate, «che». Look («mirá»)!'),
        praise: ['¡Bárbaro!', '¡Eso, che!', '¡Genial!'],
        phrases: [
          { id: 'ph.ar.che', tl: '¡Che!', en: 'Hey!', note: 'To get someone’s attention, or just as a little sound in a sentence. Argentines say it all the time.', ex: 'Che, ¿vos de dónde sos?', exEn: 'Hey, where are you from?', ask: 'Get a friend’s attention the Argentine way: “Hey!”', keys: ['che'] },
          { id: 'ph.ar.vos', tl: 'vos sos', en: 'you are (vos = tú)', note: 'In Argentina «vos» replaces «tú», with its own verbs: «vos sos», «vos tenés», «vos querés».', ex: 'Vos sos de afuera, ¿no?', exEn: 'You’re not from around here, are you?', ask: 'Say “you are” the Argentine way, with «vos».', keys: ['vos sos'] },
          { id: 'ph.ar.re', tl: 're bueno', en: 'really good', note: '«re» before a word makes it stronger: «re lindo» (really nice), «re bueno» (really good).', ex: 'Este mate está re rico.', exEn: 'This mate is really good.', ask: 'Say “really good” like an Argentine.', keys: ['re bueno', 'rebueno', 're buena', 'rebuena', 're buenos'] },
          { id: 'ph.ar.laburo', tl: 'el laburo', en: 'work, a job', note: '«laburar» = to work. It comes from the Italian «lavoro»: lots of Argentines have Italian grandparents.', ex: 'Me voy al laburo.', exEn: 'I’m off to work.', ask: 'In Argentina, what’s a casual word for “work”?', keys: ['laburo', 'laburar', 'laburando'] },
          { id: 'ph.ar.barbaro', tl: '¡Bárbaro!', en: 'Great!', note: 'When something is great, or you happily agree. «¡Bárbaro!» = awesome, perfect.', ex: '¿Mañana a las cinco? ¡Bárbaro!', exEn: 'Tomorrow at five? Great!', ask: 'Your friend asks: “Tomorrow at five?” Answer “Great!” like an Argentine.', keys: ['barbaro'] },
        ] },
      { id: 'pipe', name: 'Pipe', region: { tl: 'Colombia', en: 'Colombia' }, color: '#e6b02e', from: 'Medellín',
        look: { skin: '#a8714a', hair: '#2e2420', dress: '#f2c94c', legs: true, pants: '#2f3440', shoes: '#f4f1ea', hat: 'straw', hatColor: '#f1e3c0', band: '#2b2235' },
        hi: L1('¡Quiubo, parce! ¿Qué más?', '«¡Quiubo!» (hi), «parce» (buddy)! «¿Qué más?» (how’s it going?)'),
        start: L1('Listo, parce. Le enseño a hablar como en Medellín.', 'All right, «parce». I’ll teach you to talk like in Medellín.'),
        quiz: L1('Ahora usted, parce. ¿Se acuerda?', 'Now you, «parce». Do you remember?'),
        win: L1('¡Qué bacano! Usted ya habla como paisa.', '«¡Qué bacano!» (how cool!) You already talk like a «paisa» (someone from Medellín).'),
        ok: L1('¡Bien, parce! Poco a poco.', 'Good, «parce»! Little by little.'),
        later: L1('Listo, después seguimos, parce.', 'All right, we’ll carry on later, «parce».'),
        chat: [L1('Como dice mi mamá: «quien tiene boca, se equivoca». ¡Y no pasa nada!', 'As my mom says: «whoever has a mouth makes mistakes». And that’s okay!'),
          L1('¿Un tintico? En Colombia el café negro se llama «tinto».', 'A «tintico»? In Colombia a black coffee is called «tinto».'),
          L1('¡Qué bacano este pueblo! Pero hace falta música, parce.', 'This town is so «bacano» (cool)! But it needs music, «parce».')],
        cat: L1('¿Un gato naranja? Está dormidito en la caja, parce. ¡Mire!', 'An orange {w.cat}? It’s fast asleep in the crate, «parce». Look!'),
        praise: ['¡Eso, parce!', '¡Bacano!', '¡Muy bien!'],
        phrases: [
          { id: 'ph.co.parce', tl: 'parce', en: 'buddy, pal', note: 'Short for «parcero». Super common in Medellín and Bogotá.', ex: '¡Quiubo, parce!', exEn: 'Hi, buddy!', ask: 'How do Colombians say “buddy”?', keys: ['parce', 'parcero', 'parcera', 'parcerito'] },
          { id: 'ph.co.quemas', tl: '¿Qué más?', en: 'How’s it going?', note: 'A Colombian hello. Here it doesn’t mean “what else?”: it means “how are you?”.', ex: '¡Hola! ¿Qué más? ¿Todo bien?', exEn: 'Hi! How’s it going? All good?', ask: 'Greet someone like in Colombia: “How’s it going?”', keys: ['que mas', 'quiubo', 'que hubo'] },
          { id: 'ph.co.bacano', tl: 'bacano', en: 'cool, great', note: 'Anything nice or fun is «bacano». «¡Qué bacano!» = how cool!', ex: '¡Qué bacano este pueblo!', exEn: 'This town is so cool!', ask: 'How would someone from Colombia say “cool”?', keys: ['bacano', 'bacana', 'bacanos'] },
          { id: 'ph.co.deuna', tl: '¡De una!', en: 'Sure, let’s do it!', note: 'A happy, instant yes. «¿Vamos por un helado?» «¡De una!»', ex: '¿Un tinto? ¡De una!', exEn: 'A coffee? Sure, right now!', ask: 'Your friend asks: “Want an ice cream?” Say “Sure, right now!” like a Colombian.', keys: ['de una'] },
          { id: 'ph.co.quepena', tl: '¡Qué pena!', en: 'Sorry! / How embarrassing!', note: 'In Colombia this is a polite “sorry” or “excuse me”, not only “what a pity”.', ex: '¡Ay, qué pena! ¿Le pisé el pie?', exEn: 'Oh, sorry! Did I step on your foot?', ask: 'You bump into someone in Bogotá. Say “sorry!” the Colombian way.', keys: ['que pena'] },
        ] },
    ],
    pt: [
      { id: 'beto', name: 'Beto', region: { tl: 'Rio de Janeiro', en: 'Rio' }, color: '#2fa36b', from: 'Rio de Janeiro',
        look: { skin: '#c98e62', hair: '#2e2420', hairdo: 'curly', dress: '#f2c94c', legs: true, pants: '#3f7fc9', shoes: '#2f8f8a', shades: true },
        hi: L1('Qual é, mermão! Chega mais!', '«Qual é» (what’s up), «mermão» (bro)! Come on over!'),
        start: L1('Beleza, vou te ensinar a falar que nem carioca!', 'All right, I’ll teach you to talk like a «carioca» (someone from Rio)!'),
        quiz: L1('Agora é você! Lembra?', 'Now it’s you! Remember?'),
        win: L1('Caraca! Já tá falando que nem carioca!', '«Caraca» (wow)! You already talk like a «carioca»!'),
        ok: L1('Maneiro! Com treino, vai.', '«Maneiro» (cool)! With practice, you’ll get there.'),
        later: L1('Valeu, depois a gente continua.', '«Valeu» (thanks), we’ll keep going later.'),
        chat: [L1('Caraca, que dia lindo! Bora pra praia? … Ih, aqui não tem praia.', '«Caraca» (wow), what a beautiful day! Beach time? … Oh, there’s no beach here.'),
          L1('No Rio a gente fala cantando, sabia? É maneiro!', 'In Rio we talk like we’re singing, did you know? It’s «maneiro» (cool)!'),
          L1('Mermão, biscoito é biscoito. Não deixa ninguém te dizer o contrário.', '«Mermão» (bro), a cookie is a «biscoito». Don’t let anyone tell you otherwise.')],
        cat: L1('Um gato laranja? Tá dormindo na caixa, mermão! Olha ali.', 'An orange {w.cat}? It’s sleeping in the box, «mermão»! Look there.'),
        praise: ['Isso aí!', 'Maneiro!', 'Caraca, boa!'],
        phrases: [
          { id: 'ph.rj.mermao', tl: 'mermão', en: 'bro', note: 'From «meu irmão» (my brother). Very carioca.', ex: 'Valeu, mermão!', exEn: 'Thanks, bro!', ask: 'How does someone from Rio say “bro”?', keys: ['mermao', 'merma', 'meu irmao'] },
          { id: 'ph.rj.caraca', tl: 'Caraca!', en: 'Wow!', note: 'Surprise or amazement, good or bad. You hear it all over Rio.', ex: 'Caraca, olha o tamanho desse moinho!', exEn: 'Wow, look how big that windmill is!', ask: 'React to something amazing like a carioca: “Wow!”', keys: ['caraca'] },
          { id: 'ph.rj.maneiro', tl: 'maneiro', en: 'cool', note: 'Something nice, fun or stylish. «Que maneiro!» = how cool!', ex: 'Que maneiro o seu {mimo}!', exEn: 'Your {mimo} is so cool!', ask: 'How would someone from Rio say “cool”?', keys: ['maneiro', 'maneira', 'maneiros'] },
          { id: 'ph.rj.quale', tl: 'Qual é?', en: 'What’s up?', note: 'A carioca hello: «Qual é, mermão?». Said angrily, it means “what’s your problem?”, so smile!', ex: 'Qual é, tudo bem?', exEn: 'What’s up, all good?', ask: 'Greet a friend like in Rio: “What’s up?”', keys: ['qual e', 'quale'] },
          { id: 'ph.rj.bolado', tl: 'tô bolado', en: 'I’m upset', note: '«bolado» = annoyed or upset, the carioca way. «tô» = «estou».', ex: 'Tô bolado: perdi o trem!', exEn: 'I’m upset: I missed the train!', ask: 'Tell a friend you’re upset, the carioca way: “I’m upset.”', keys: ['bolado', 'bolada'] },
        ] },
      { id: 'juninho', name: 'Juninho', region: { tl: 'São Paulo', en: 'São Paulo' }, color: '#6b6f80', from: 'São Paulo',
        look: { skin: '#dcae86', hair: '#2e2420', dress: '#6b6f80', legs: true, pants: '#2f3440', shoes: '#f4f1ea', hat: 'cap', hatColor: '#2b2235' },
        hi: L1('E aí, mano? Firmeza?', 'Hey, «mano» (bro)? «Firmeza?» (all good?)'),
        start: L1('Firmeza, mano. Vou te ensinar a falar que nem paulista.', 'Cool, «mano». I’ll teach you to talk like a «paulista» (someone from São Paulo).'),
        quiz: L1('Meu, agora é você. Lembra?', '«Meu» (dude), now it’s you. Remember?'),
        win: L1('Da hora, mano! Já pode morar em São Paulo.', '«Da hora» (awesome), «mano»! You could live in São Paulo already.'),
        ok: L1('Firmeza! Treina mais um pouco, mano.', 'Good! Practice a bit more, «mano».'),
        later: L1('Suave, mano. Depois a gente continua.', 'No worries, «mano». We’ll keep going later.'),
        chat: [L1('Em São Paulo todo mundo trabalha muito. Trampo, trampo, trampo… Aqui eu descanso!', 'In São Paulo everyone works a lot. «Trampo», «trampo», «trampo» (work)… Here I rest!'),
          L1('Meu, tá frio hoje, né? Em São Paulo é sempre assim.', '«Meu» (dude), it’s cold today, right? In São Paulo it’s always like this.'),
          L1('É bolacha, mano. Bo-la-cha.', 'It’s «bolacha» (cookie), «mano». Bo-la-cha.')],
        cat: L1('Um gato laranja? Meu, tá dormindo na caixa ali!', 'An orange {w.cat}? «Meu» (dude), it’s sleeping in that box!'),
        praise: ['Da hora!', 'Isso, mano!', 'Firmeza!'],
        phrases: [
          { id: 'ph.sp.mano', tl: 'mano', en: 'bro', note: 'Paulistas call each other «mano» (and girls «mina»).', ex: 'E aí, mano, beleza?', exEn: 'Hey bro, all good?', ask: 'What does a paulista call his buddy?', keys: ['mano', 'manos'] },
          { id: 'ph.sp.meu', tl: 'Meu!', en: 'Dude! / Man!', note: 'At the start of a sentence, «meu» isn’t “my”: it’s like “dude!”. «Meu, que frio!»', ex: 'Meu, que fila enorme!', exEn: 'Dude, what a huge line!', ask: 'Start a sentence the paulista way: “Dude, …”', keys: ['meu'] },
          { id: 'ph.sp.dahora', tl: 'da hora', en: 'awesome', note: 'Something cool is «da hora». «Que da hora!» = how awesome!', ex: 'Esse sorvete é da hora!', exEn: 'This ice cream is awesome!', ask: 'How do people in São Paulo say “awesome”?', keys: ['da hora', 'dahora'] },
          { id: 'ph.sp.trampo', tl: 'o trampo', en: 'work, a job', note: '«trampar» = to work. «Tô indo pro trampo» = I’m off to work.', ex: 'Amanhã tem trampo cedo.', exEn: 'Tomorrow there’s work early.', ask: 'In São Paulo, what’s a casual word for “work”?', keys: ['trampo', 'trampar', 'trampando'] },
          { id: 'ph.sp.bolacha', tl: 'bolacha', en: 'cookie', note: 'In São Paulo a cookie is a «bolacha». In Rio it’s a «biscoito». They argue about it forever.', ex: 'Quer uma bolacha?', exEn: 'Want a cookie?', ask: 'In São Paulo, what do you call a cookie?', keys: ['bolacha', 'bolachas', 'bolachinha'] },
        ] },
      { id: 'tonho', name: 'Tonho', region: { tl: 'Bahia', en: 'Bahia' }, color: '#e0743c', from: 'Salvador, Bahia',
        look: { skin: '#8a5a3c', hair: '#2e2420', dress: '#e0743c', legs: true, pants: '#f4f1ea', shoes: '#c98a4a', beard: true },
        hi: L1('Oxe! Gente nova na área! Senta aí, véi.', '«Oxe» (whoa)! New people around! Sit down, «véi» (dude).'),
        start: L1('Massa! Vou te ensinar a falar que nem baiano. Com calma, viu?', '«Massa» (cool)! I’ll teach you to talk like a «baiano» (someone from Bahia). Nice and slow, OK?'),
        quiz: L1('Agora você, véi. Sem pressa.', 'Now you, «véi». No rush.'),
        win: L1('Que massa! Mainha ia ficar orgulhosa.', '«Que massa» (how cool)! «Mainha» (mom) would be proud.'),
        ok: L1('Tá bom, véi. Devagar se vai longe.', 'It’s OK, «véi». Slow and steady goes far.'),
        later: L1('Relaxa, véi. Depois a gente continua.', 'Relax, «véi». We’ll keep going later.'),
        chat: [L1('Mainha sempre dizia: quem não fala, não aprende.', '«Mainha» (mom) always said: whoever doesn’t speak, doesn’t learn.'),
          L1('Na Bahia ninguém tem pressa. Calma, véi, calma.', 'In Bahia nobody’s in a hurry. Easy, «véi», easy.'),
          L1('Oxe, e esse bichinho aí? Que massa!', '«Oxe» (whoa), and who’s this little critter? «Que massa» (how cool)!')],
        cat: L1('Oxe, um gato laranja? Tá dormindo na caixa, véi!', '«Oxe», an orange {w.cat}? It’s sleeping in the box, «véi»!'),
        praise: ['Massa!', 'Isso, véi!', 'Arretado!'],
        phrases: [
          { id: 'ph.ba.oxe', tl: 'Oxe!', en: 'Whoa! / Huh?!', note: 'Surprise, Northeast Brazil style. The long version: «Oxente!».', ex: 'Oxe! Cadê meu chinelo?', exEn: 'Huh?! Where’s my flip-flop?', ask: 'React with surprise like a baiano: “Whoa?!”', keys: ['oxe', 'oxente', 'oxi'] },
          { id: 'ph.ba.massa', tl: 'massa', en: 'cool, great', note: 'In Bahia anything good is «massa». «Que massa!» = how cool!', ex: 'Que massa esse lugar!', exEn: 'This place is so cool!', ask: 'How do people in Bahia say “cool”?', keys: ['massa'] },
          { id: 'ph.ba.vei', tl: 'véi', en: 'dude', note: 'From «velho» (old man), but people say it to anybody: «E aí, véi?».', ex: 'Calma, véi!', exEn: 'Easy, dude!', ask: 'Call a buddy “dude” like in Bahia.', keys: ['vei', 'veio'] },
          { id: 'ph.ba.mainha', tl: 'mainha', en: 'mom (with love)', note: '«mainha» and «painho»: mom and dad, the sweet Bahian way.', ex: 'Mainha faz o melhor acarajé do mundo.', exEn: 'Mom makes the best acarajé in the world.', ask: 'How do baianos say “mom”, sweetly?', keys: ['mainha'] },
          { id: 'ph.ba.opaio', tl: 'Ó paí, ó!', en: 'Look here!', note: 'Salvador’s “look at this!”, from «olha, pai, olha». There’s even a movie called that.', ex: 'Ó paí, ó: o barco chegou!', exEn: 'Look here: the boat’s in!', ask: 'Point something out like in Salvador: “Look here!”', keys: ['o pai o', 'opaio', 'o paio'] },
        ] },
    ],
    de: [
      { id: 'kalle', name: 'Kalle', region: { tl: 'Berlin', en: 'Berlin' }, color: '#c0563c', from: 'Berlin',
        look: { skin: '#c98e62', hair: '#2e2420', beard: true, dress: '#4a3a33', legs: true, pants: '#2f3440', shoes: '#2b2235', hat: 'flat', hatColor: '#3a3040' },
        hi: L1('Na, wat is? Komm ran, setz dich!', '«Na, wat is?» (well, what’s up?) Come over, sit down!'),
        start: L1('Na jut, ick bring dir Berlinerisch bei!', 'All right («jut» = gut), «ick» (I) will teach you Berlin talk!'),
        quiz: L1('So, jetzt du. Weeßte noch?', 'So, now you. «Weeßte noch?» (do you still know?)'),
        win: L1('Dufte! Du bist ja ’n echter Berliner!', '«Dufte» (great)! You’re a real Berliner!'),
        ok: L1('Nich schlecht! Üben, üben, üben.', 'Not bad! Practice, practice, practice.'),
        later: L1('Jut, machen wa später weiter.', 'OK («jut»), we’ll carry on later («wa» = wir).'),
        chat: [L1('Icke hab Hunger. Hat jemand ’ne Schrippe?', '«Icke» (I) am hungry. Anyone got a «Schrippe» (bread roll)?'),
          L1('In Berlin is immer wat los. Hier is et so still …', 'In Berlin there’s always something going on («wat los»). Here it’s so quiet…'),
          L1('Mein Kiez hat ’n Späti an jeder Ecke. Jut, dass Molinar jetzt ooch eenen hat!', 'My «Kiez» (neighborhood) has a «Späti» (late shop) on every corner. Good thing Molinar has one now too («ooch eenen»)!')],
        cat: L1('’Ne orange Katze? Die pennt in der Kiste da! Kiek ma.', 'An orange {w.cat}? It’s snoozing («pennt») in that crate! Look («kiek ma»).'),
        praise: ['Dufte!', 'Jenau!', 'Na also!'],
        phrases: [
          { id: 'ph.be.icke', tl: 'icke', en: 'I (ich)', note: 'Berliners say «icke» or «ick» for «ich»: «Icke bin aus Berlin».', ex: 'Icke? Icke war det nich!', exEn: 'Me? It wasn’t me!', ask: 'How does a Berliner say “I”?', keys: ['icke', 'ick'] },
          { id: 'ph.be.wat', tl: 'wat', en: 'what (was)', note: '«Wat?» = «Was?». And «det» = «das»: «Wat is det?»', ex: 'Wat is’n los?', exEn: 'What’s going on?', ask: 'Ask “What?” like a Berliner.', keys: ['wat'] },
          { id: 'ph.be.schrippe', tl: 'die Schrippe', en: 'bread roll', note: 'In Berlin a bread roll is a «Schrippe». Elsewhere: «Brötchen», «Semmel», «Weggli»…', ex: 'Zwee Schrippen, bitte!', exEn: 'Two bread rolls, please!', ask: 'In Berlin, what’s a bread roll called?', keys: ['schrippe', 'schrippen'] },
          { id: 'ph.be.kiez', tl: 'der Kiez', en: 'the neighborhood', note: 'Your «Kiez» is your part of town: your bakery, your Späti, your neighbors.', ex: 'Det is mein Kiez!', exEn: 'This is my neighborhood!', ask: 'How do Berliners say “neighborhood”?', keys: ['kiez'] },
          { id: 'ph.be.dufte', tl: 'dufte', en: 'great, cool', note: 'Old Berlin word for “great”. «Det is ja dufte!» = that’s great!', ex: 'Dein {mimo} is ja dufte!', exEn: 'Your {mimo} is great!', ask: 'Say “great” the old Berlin way.', keys: ['dufte'] },
        ] },
      { id: 'ferdl', name: 'Ferdl', region: { tl: 'Wien', en: 'Vienna' }, color: '#c9443a', from: 'Vienna',
        look: { skin: '#efc29a', hair: '#4a2f27', stache: true, dress: '#7a2f3a', legs: true, pants: '#4a4a55', shoes: '#2b2235', hat: 'trilby', hatColor: '#4a4a55', scarf: '#e8e2d6' },
        hi: L1('Servus! Wie geht’s dir, Oida?', '«Servus» (hi)! How are you, «Oida» (dude)?'),
        start: L1('Na guat, i lern da a bisserl Wienerisch.', 'All right («guat»), I’ll teach you («i lern da») a little bit («a bisserl») of Viennese.'),
        quiz: L1('Jetzt du, Oida. Weißt es noch?', 'Now you, «Oida». Do you still know?'),
        win: L1('Leiwand! Du redest wia a echter Wiener!', '«Leiwand» (awesome)! You talk like («wia») a real Viennese!'),
        ok: L1('Passt scho. Üben, gell?', '«Passt scho» (that’s fine). Practice, OK («gell»)?'),
        later: L1('Schau ma mal. Später geht’s weiter.', '«Schau ma mal» (we’ll see). We’ll go on later.'),
        chat: [L1('In Wien sagen wir: „Schau ma mal.“ Das heißt: vielleicht … irgendwann.', 'In Vienna we say: «Schau ma mal» (we’ll see). It means: maybe… someday.'),
          L1('A Kaffee und a Kipferl, mehr brauch i ned.', '«A Kaffee» (a coffee) and «a Kipferl» (a croissant), that’s all I need («brauch i ned»).'),
          L1('Oida, dein {mimo} is ja leiwand!', '«Oida», your {mimo} is «leiwand» (awesome)!')],
        cat: L1('A orange Katz? Die schlaft in da Kistn, Oida!', 'An orange {w.cat} («Katz»)? It’s asleep in the crate («Kistn»), «Oida»!'),
        praise: ['Leiwand!', 'Bravo, Oida!', 'Passt!'],
        phrases: [
          { id: 'ph.at.servus', tl: 'Servus!', en: 'Hi! / Bye!', note: 'Hello and goodbye in Austria (and Bavaria), between people who say «du».', ex: 'Servus, wie geht’s?', exEn: 'Hi, how are you?', ask: 'Say hi like in Vienna.', keys: ['servus'] },
          { id: 'ph.at.oida', tl: 'Oida!', en: 'Dude! / Whoa!', note: 'From «Alter». For a buddy, or when you’re surprised: «Oida, schau!»', ex: 'Oida, is des kalt!', exEn: 'Whoa, is it cold!', ask: 'What does a Viennese say for “dude!” or “whoa!”?', keys: ['oida', 'alter'] },
          { id: 'ph.at.leiwand', tl: 'leiwand', en: 'awesome', note: 'Viennese for great, awesome. «Des is leiwand!»', ex: 'Leiwand! A Eis!', exEn: 'Awesome! An ice cream!', ask: 'How do people in Vienna say “awesome”?', keys: ['leiwand'] },
          { id: 'ph.at.paradeiser', tl: 'der Paradeiser', en: 'tomato', note: 'In Austria a tomato is a «Paradeiser» (in Germany: «Tomate»).', ex: 'Paradeiser san gsund.', exEn: 'Tomatoes are healthy.', ask: 'In Austria, what’s a tomato called?', keys: ['paradeiser'] },
          { id: 'ph.at.baba', tl: 'Baba!', en: 'Bye!', note: 'The Viennese goodbye. Extra Viennese: «Baba und foi ned!» (bye, and don’t fall!).', ex: 'Baba, bis morgen!', exEn: 'Bye, see you tomorrow!', ask: 'Say “bye” the Viennese way.', keys: ['baba'] },
        ] },
      { id: 'ueli', name: 'Ueli', region: { tl: 'Zürich', en: 'Zürich' }, color: '#d9443a', from: 'Zürich',
        look: { skin: '#f5cda2', hair: '#e0b060', glasses: true, dress: '#d9443a', legs: true, pants: '#c9b48a', shoes: '#5b3a22', hat: 'beanie', hatColor: '#f4f1ea' },
        hi: L1('Grüezi mitenand! Hoi!', '«Grüezi mitenand» (hello, everyone)! «Hoi» (hi)!'),
        start: L1('Guet, ich zeig dir es bitzeli Schwiizerdütsch.', 'Good («guet»), I’ll show you a little bit («es bitzeli») of Swiss German.'),
        quiz: L1('Jetzt du. Weisch no?', 'Now you. «Weisch no?» (do you still know?)'),
        win: L1('Super! Du bisch fascht en Schwiizer!', 'Super! You’re («bisch») almost («fascht») Swiss!'),
        ok: L1('Guet gmacht! Nöd schlächt.', 'Well done («guet gmacht»)! Not bad («nöd schlächt»).'),
        later: L1('Kei Problem. Spöter wiiter.', 'No problem («kei Problem»). We’ll go on later («spöter»).'),
        chat: [L1('Bi üs in Züri isch alles pünktlich. Sogar d’Pause: zäh Minute, nöd meh!', 'Back home in Zürich («Züri») everything is on time. Even the break: ten minutes, not more!'),
          L1('Ich ha mis Znüni vergässe. Hät öpper en Öpfel?', 'I forgot my «Znüni» (morning snack). Has anyone got an apple («Öpfel»)?'),
          L1('Die zwei verstah ich nöd. Und sie mich au nöd!', 'I don’t understand those two («verstah ich nöd»). And they don’t understand me either!')],
        cat: L1('E orangi Chatz? Die schlaft det i de Chischte!', 'An orange {w.cat} («Chatz»)? It’s asleep over there, in the crate («Chischte»)!'),
        praise: ['Super!', 'Guet!', 'Bravo!'],
        phrases: [
          { id: 'ph.ch.gruezi', tl: 'Grüezi!', en: 'Hello!', note: 'The Swiss hello for people you say «Sie» to. For friends: «Hoi!» or «Sali!».', ex: 'Grüezi! Wie gaht’s?', exEn: 'Hello! How are you?', ask: 'Greet someone politely like in Switzerland.', keys: ['gruezi', 'gruessech'] },
          { id: 'ph.ch.merci', tl: 'Merci vielmal!', en: 'Thanks a lot!', note: 'The Swiss mix French and German: «merci» + «vielmal» = thanks a lot.', ex: 'Merci vielmal für d’Hilf!', exEn: 'Thanks a lot for the help!', ask: 'Say “thanks a lot” the Swiss way.', keys: ['merci vielmal', 'merci viel mal', 'merci viumau'] },
          { id: 'ph.ch.velo', tl: 's Velo', en: 'bike', note: 'Swiss for «Fahrrad», from the French «vélo».', ex: 'Ich fahr mit em Velo.', exEn: 'I’m going by bike.', ask: 'In Switzerland, what’s a bike called?', keys: ['velo', 'velos'] },
          { id: 'ph.ch.znueni', tl: 's Znüni', en: 'the morning snack', note: 'The snack at nine o’clock («nüni» = nine): bread, an apple… At four there’s «Zvieri».', ex: 'Ziit für s Znüni!', exEn: 'Time for the morning snack!', ask: 'What’s the Swiss name for the mid-morning snack?', keys: ['znuni', 'znueni'] },
          { id: 'ph.ch.chuchi', tl: 'Chuchichäschtli', en: 'kitchen cupboard', note: 'The famous Swiss test word. If you can say it, you’re practically Swiss!', ex: 'Säg mal „Chuchichäschtli“!', exEn: 'Say “Chuchichäschtli”!', ask: 'The famous Swiss word for “kitchen cupboard” (go on, try it!)', keys: ['chuchichaschtli', 'chuchichaeschtli', 'chuchichastli'] },
        ] },
    ],
  };
  // the three of them, when you first sit down, and the bickering after each one's lesson: [seat, line]
  const GROUP = { es: L1('Aquí cada uno habla a su manera. ¡Pregúntanos lo que quieras!', 'Here each of us talks our own way. Ask us anything!'),
    pt: L1('Aqui cada um fala de um jeito. Pergunta pra gente!', 'Here each of us talks our own way. Ask us!'),
    de: L1('Wir reden hier alle ’n bisschen anders. Frag uns ruhig!', 'We all talk a bit differently here. Go ahead, ask us!') };
  const BANTER = {
    chuy: [[1, L1('Che, eso está bien… pero el español más lindo es el de Buenos Aires, ¿viste?', '«Che», that’s fine… but the nicest Spanish is from Buenos Aires, «¿viste?» (you see?)')],
      [2, L1('¡Ay, no, parce! El más bonito es el de Colombia. ¡Todo el mundo lo dice!', 'Oh no, «parce»! The nicest is Colombia’s. Everybody says so!')],
      [0, L1('¡No manches! Ustedes dos están locos.', '«¡No manches!» (no way!) You two are crazy.')]],
    facu: [[0, L1('¿«Laburo»? ¡En México se dice «chamba», güey!', '«Laburo»? In Mexico we say «chamba», «güey»!')],
      [1, L1('¿Chamba? ¡Qué palabra tan rara, che!', '«Chamba»? What a weird word, «che»!')],
      [2, L1('Tranquilos, parce. En Colombia decimos «camello».', 'Easy, «parce». In Colombia we say «camello».')]],
    pipe: [[1, L1('«Bacano» está bien, pero «bárbaro» es mejor.', '«Bacano» is fine, but «bárbaro» is better.')],
      [0, L1('Y «chido» es el mejor de todos, güey.', 'And «chido» is the best of all, «güey».')],
      [2, L1('¡Ay, ustedes! Todos dicen «cool», ¡pero de tres maneras!', 'Oh, you guys! You all say “cool”, but three different ways!')]],
    beto: [[1, L1('Ô carioca, fala direito! É «bolacha», não «biscoito»!', 'Hey «carioca», talk properly! It’s «bolacha», not «biscoito»!')],
      [0, L1('Biscoito, mermão! Bolacha é coisa de paulista!', '«Biscoito», «mermão»! «Bolacha» is a São Paulo thing!')],
      [2, L1('Oxe, vocês dois… parem de brigar e comam logo!', '«Oxe», you two… stop fighting and just eat!')]],
    juninho: [[0, L1('«Da hora»? No Rio a gente diz «maneiro».', '«Da hora»? In Rio we say «maneiro».')],
      [2, L1('E na Bahia é «massa», véi!', 'And in Bahia it’s «massa», «véi»!')],
      [1, L1('Três jeitos, mano. Todos certos!', 'Three ways, «mano». All of them right!')]],
    tonho: [[1, L1('Mano, o sotaque baiano é o mais bonito.', '«Mano», the Bahian accent is the prettiest.')],
      [2, L1('Eu sei, véi. Eu sei.', 'I know, «véi». I know.')],
      [0, L1('Caraca, que modéstia!', '«Caraca» (wow), how modest!')]],
    kalle: [[1, L1('Na geh, Berlinerisch … In Wien red ma schöner, Oida.', 'Oh come on, Berlin talk… In Vienna we talk nicer, «Oida».')],
      [2, L1('Und ich verstah eu beidi nöd. Merci vielmal!', 'And I don’t understand either of you. «Merci vielmal» (thanks a lot)!')],
      [0, L1('Wat? Det is doch janz einfach!', '«Wat?» (what?) «Det» (that) is totally («janz») easy!')]],
    ferdl: [[0, L1('Paradeiser? Det heißt Tomate, Mann!', '«Paradeiser»? That’s called a «Tomate», man!')],
      [1, L1('Bei uns ned, Oida.', 'Not where we come from («bei uns ned»), «Oida».')],
      [2, L1('Und bi üs heisst’s au Tomate. Aber mir säged Velo!', 'And back home it’s «Tomate» too. But we say «Velo» (bike)!')]],
    ueli: [[0, L1('Chu … Chuchi … wat?!', '«Chu… Chuchi…» «wat?!» (what?!)')],
      [1, L1('Des kann ka Mensch aussprechen, Oida.', 'Nobody («ka Mensch») can pronounce that, «Oida».')],
      [2, L1('Chuchichäschtli. Ganz eifach!', '«Chuchichäschtli». Totally easy («ganz eifach»)!')]],
  };

  // ================================================================ the swearer (one old sailor per language) and his lessons
  // strength: 0 mild (fine almost anywhere), 1 strong, 2 very strong. insult: said at a person (never do).
  const SW_LEVEL = [{ en: 'mild', color: '#6cc35a' }, { en: 'strong', color: '#f39a45' }, { en: 'very strong', color: '#e0503f' }];
  const SWEARER = {
    es: { name: 'Don Goyo', look: { skin: '#c98e62', hair: '#f4f1ea', hairdo: 'bald', beard: true, dress: '#3a5a8a', legs: true, pants: '#4a3a33', shoes: '#2b2235', hat: 'captain', hatColor: '#2f3b5a', h: 1.02, w: 1.12 },
      hi: [L1('¡Carajo! ¡Esta pinche rueda se cayó otra vez!', '«¡Carajo!» (dammit!) This «pinche» (damn) wheel fell off again!'), L1('¿Y tú qué miras? ¡Mierda, mi dedo!', 'And what are you looking at? «¡Mierda!» (shit!), my finger!')],
      intro: L1('Fui marinero cuarenta años. En cada puerto aprendí una grosería nueva. ¡Ja!', 'I was a sailor for forty years. In every port I learned a new swear word. Ha!'),
      offer: L1('¿Quieres aprender groserías? Te enseño… pero con cuidado, ¿eh?', 'Want to learn some swear words? I’ll teach you… but carefully, eh?'),
      grumble: [L1('¡Caramba! ¿Otra vez tú? ¡Qué gusto!', '«¡Caramba!» (good grief!) You again? Nice to see you!'), L1('¡Puta madre! La rueda… ¡otra vez!', '«¡Puta madre!» (holy shit!) The wheel… again!'),
        L1('¡Joder, qué calor! ¿Me traes un refresco de la tiendita?', '«¡Joder!» (hell!), it’s hot! Will you get me a soda from the corner store?')],
      why: L1('¿Enojado yo? ¡Joder, no! Así hablo. El Silencio odia las groserías. ¡A mí no me calla nadie!', 'Me, angry? «¡Joder!» (hell), no! That’s just how I talk. The Hush hates swearing. Nobody shuts ME up!'),
      lesson: [L1('Primero las suaves. Estas las puedes decir casi en cualquier parte.', 'First the mild ones. You can say these almost anywhere.'),
        L1('Ahora las fuertes. Cuidado: estas no se dicen en la escuela.', 'Now the strong ones. Careful: you don’t say these at school.'),
        L1('Y ahora… las muy fuertes. Casi nunca, ¿eh? ¡Nunca delante de tu abuela!', 'And now… the very strong ones. Hardly ever, eh? Never in front of your grandma!')],
      end: L1('¡Muy bien! Ya sabes. Y recuerda: nunca delante de tu abuela.', 'Very good! Now you know. And remember: never in front of your grandma.'),
      done: L1('Ya sabes todo lo que yo sé. ¡Ahora ve y habla fuerte!', 'Now you know everything I know. Now go and speak up!'),
      bleep: L1('¿Qué es ese pitido? ¿Tienes el «bip» puesto? ¡Bah! Entonces solo te enseño las suaves.', 'What’s that beeping? You’ve got the bleeper on? Bah! Then I’ll only teach you the mild ones.'),
      right: L1('¡Exacto! ¡Así se habla!', 'Exactly! That’s the way to talk!'), wrong: L1('¡Nooo! ¡Caramba! Escucha bien:', 'Nooo! Good grief! Listen carefully:'),
      cat: L1('¿Un gato naranja? ¡Ese pinche gato se robó un nabo y corrió hacia la puerta del oeste!', 'An orange {w.cat}? That «pinche» (damn) cat stole a turnip and ran toward the west gate!'),
      grandma: 'abuela', insultQ: 'pendejo',
      items: [
        { id: 'ph.sw.es.caramba', tl: '¡Caramba!', en: 'Good grief! / Darn!', s: 0, note: 'The polite way to almost swear. Fine anywhere, even with your abuela.' },
        { id: 'ph.sw.es.chale', tl: '¡Chale!', en: 'Ugh! / Come on!', s: 0, note: 'Mexico: when something disappoints you. Harmless and very common.' },
        { id: 'ph.sw.es.mierda', tl: '¡Mierda!', en: 'Shit!', s: 1, note: 'For when things go wrong. Very common, but not with kids, teachers or your abuela.' },
        { id: 'ph.sw.es.carajo', tl: '¡Carajo!', en: 'Dammit! / Hell!', s: 1, note: 'An angry “dammit!”, all over Latin America. Not at work, not at church.' },
        { id: 'ph.sw.es.joder', tl: '¡Joder!', en: 'Fuck! / Damn!', s: 1, note: 'In Spain people say it all day long. In Latin America it sounds Spanish (and «joder» can mean “to bother”). Never in front of your abuela!' },
        { id: 'ph.sw.es.pinche', tl: 'pinche', en: 'damn, lousy (Mexico)', s: 1, note: 'Mexico. It goes before a noun: «¡pinche rueda!» = damn wheel! Rude: use it for things, never for people.' },
        { id: 'ph.sw.es.putamadre', tl: '¡Puta madre!', en: 'Holy shit! / Motherf…!', s: 2, note: 'Very strong. Only when you’re really angry, and never at a person.' },
        { id: 'ph.sw.es.pendejo', tl: 'pendejo', en: 'idiot, asshole (an insult)', s: 2, insult: true, note: 'An insult! Never call anyone this (in Mexico it’s a serious one). Know it, so you know when someone’s being rude.' },
      ] },
    pt: { name: 'Seu Tião', look: { skin: '#a8714a', hair: '#f4f1ea', hairdo: 'bald', stache: true, dress: '#2f6f8a', legs: true, pants: '#f4f1ea', shoes: '#2b2235', hat: 'captain', hatColor: '#f4f1ea', h: 1.0, w: 1.15 },
      hi: [L1('Porra! Essa roda caiu de novo!', '«Porra!» (dammit!) This wheel fell off again!'), L1('Tá olhando o quê? Merda, meu dedo!', 'What are you looking at? «Merda!» (shit!), my finger!')],
      intro: L1('Fui marinheiro por quarenta anos. Em cada porto aprendi um palavrão novo. Rá!', 'I was a sailor for forty years. In every port I learned a new swear word. Ha!'),
      offer: L1('Quer aprender uns palavrões? Eu ensino… mas com cuidado, hein?', 'Want to learn some swear words? I’ll teach you… but carefully, huh?'),
      grumble: [L1('Droga! Você de novo? Que bom!', '«Droga!» (darn!) You again? Good to see you!'), L1('Puta que pariu! A roda… de novo!', '«Puta que pariu!» (holy shit!) The wheel… again!'),
        L1('Porra, que calor! Me traz um refrigerante da vendinha?', '«Porra» (hell), it’s hot! Will you get me a soda from the corner store?')],
      why: L1('Bravo, eu? Porra, não! Eu falo assim. O Silêncio odeia palavrão. Ninguém me cala!', 'Me, angry? «Porra» (hell), no! That’s just how I talk. The Hush hates swearing. Nobody shuts ME up!'),
      lesson: [L1('Primeiro, os leves. Esses dá pra falar quase em qualquer lugar.', 'First, the mild ones. You can say these almost anywhere.'),
        L1('Agora os fortes. Cuidado: esses não se fala na escola.', 'Now the strong ones. Careful: you don’t say these at school.'),
        L1('E agora… os muito fortes. Quase nunca, hein? Nunca na frente da sua avó!', 'And now… the very strong ones. Hardly ever, huh? Never in front of your grandma!')],
      end: L1('Muito bem! Agora você sabe. E lembra: nunca na frente da sua avó.', 'Very good! Now you know. And remember: never in front of your grandma.'),
      done: L1('Você já sabe tudo o que eu sei. Agora vai e fala alto!', 'Now you know everything I know. Now go and speak up!'),
      bleep: L1('Que apito é esse? Tá com o «bip» ligado? Bah! Então só ensino os leves.', 'What’s that beeping? You’ve got the bleeper on? Bah! Then I’ll only teach you the mild ones.'),
      right: L1('Isso mesmo! É assim que se fala!', 'Exactly! That’s the way to talk!'), wrong: L1('Nada disso! Droga! Escuta bem:', 'Not at all! Darn! Listen carefully:'),
      cat: L1('Um gato laranja? Aquele gato do cacete roubou um nabo e correu pro portão oeste!', 'An orange {w.cat}? That «do cacete» (damn) cat stole a turnip and ran to the west gate!'),
      grandma: 'avó', insultQ: 'babaca',
      items: [
        { id: 'ph.sw.pt.droga', tl: 'Droga!', en: 'Darn!', s: 0, note: 'The polite almost-swear. OK almost anywhere, even with your avó.' },
        { id: 'ph.sw.pt.putz', tl: 'Putz!', en: 'Shoot! / Oh no!', s: 0, note: 'A harmless “oh no!”. Brazilians say it when they forget something.' },
        { id: 'ph.sw.pt.merda', tl: 'Merda!', en: 'Shit!', s: 1, note: 'When things go wrong. Not with kids, teachers or your avó.' },
        { id: 'ph.sw.pt.porra', tl: 'Porra!', en: 'Dammit!', s: 1, note: 'Brazil’s all-purpose “dammit!”. Very common, still rude.' },
        { id: 'ph.sw.pt.cacete', tl: 'Cacete!', en: 'Damn! / Hell!', s: 1, note: 'Surprise or anger. A bit softer than «caralho», but not for school.' },
        { id: 'ph.sw.pt.babaca', tl: 'babaca', en: 'jerk, idiot (an insult)', s: 1, insult: true, note: 'An insult. Don’t call people this! But now you know when someone’s being rude.' },
        { id: 'ph.sw.pt.caralho', tl: 'Caralho!', en: 'Fuck!', s: 2, note: 'Very strong. Friends say it a lot, but never at work or with family.' },
        { id: 'ph.sw.pt.pqp', tl: 'Puta que pariu!', en: 'Holy shit! / Motherf…!', s: 2, note: 'Very strong. In messages people write just «PQP».' },
      ] },
    de: { name: 'Hein', look: { skin: '#f0c7a0', hair: '#f4f1ea', hairdo: 'bald', beard: true, dress: '#2f3b5a', legs: true, pants: '#2f3440', shoes: '#2b2235', hat: 'captain', hatColor: '#2b2235', h: 1.04, w: 1.12 },
      hi: [L1('Verdammt! Das Rad ist schon wieder ab!', '«Verdammt!» (dammit!) The wheel’s come off again!'), L1('Was guckst du? Scheiße, mein Daumen!', 'What are you looking at? «Scheiße!» (shit!), my thumb!')],
      intro: L1('Ich war vierzig Jahre Seemann. In jedem Hafen hab ich ein neues Schimpfwort gelernt. Har har!', 'I was a sailor for forty years. In every port I learned a new swear word. Har har!'),
      offer: L1('Willst du ein paar Schimpfwörter lernen? Ich bring sie dir bei … aber vorsichtig, ja?', 'Want to learn some swear words? I’ll teach you… but carefully, OK?'),
      grumble: [L1('Mist! Du schon wieder? Schön!', '«Mist!» (darn!) You again? Nice!'), L1('Verdammte Scheiße! Das Rad … schon wieder!', '«Verdammte Scheiße!» (goddamn shit!) The wheel… again!'),
        L1('Verdammt, ist das heiß! Holst du mir ’ne Limo vom Kiosk?', '«Verdammt» (damn), it’s hot! Will you get me a soda from the kiosk?')],
      why: L1('Ich, wütend? Verdammt, nein! So rede ich eben. Die Stille hasst Flüche. Mir macht keiner den Mund zu!', 'Me, angry? «Verdammt» (hell), no! That’s just how I talk. The Hush hates swearing. Nobody shuts ME up!'),
      lesson: [L1('Zuerst die harmlosen. Die kannst du fast überall sagen.', 'First the harmless ones. You can say these almost anywhere.'),
        L1('Jetzt die starken. Vorsicht: Die sagt man nicht in der Schule.', 'Now the strong ones. Careful: you don’t say these at school.'),
        L1('Und jetzt … die ganz schlimmen. Fast nie, ja? Nie vor deiner Oma!', 'And now… the really bad ones. Almost never, OK? Never in front of your grandma!')],
      end: L1('Sehr gut! Jetzt weißt du’s. Und denk dran: nie vor deiner Oma.', 'Very good! Now you know. And remember: never in front of your grandma.'),
      done: L1('Jetzt weißt du alles, was ich weiß. Und jetzt: Rede laut!', 'Now you know everything I know. Now go and speak up!'),
      bleep: L1('Was piept da? Hast du den Piepser an? Pah! Dann gibt’s nur die harmlosen.', 'What’s that beeping? You’ve got the bleeper on? Pah! Then you only get the harmless ones.'),
      right: L1('Genau! So redet man!', 'Exactly! That’s the way to talk!'), wrong: L1('Nee, nee! Mist! Hör gut zu:', 'Nope! Darn! Listen carefully:'),
      cat: L1('Eine orange Katze? Das verdammte Vieh hat eine Rübe geklaut und ist zum Westtor gerannt!', 'An orange {w.cat}? That «verdammte» (damn) beast stole a turnip and ran to the west gate!'),
      grandma: 'Oma', insultQ: 'Arschloch',
      items: [
        { id: 'ph.sw.de.mist', tl: 'Mist!', en: 'Darn! / Rats!', s: 0, note: 'Literally “manure”. The everyday harmless swear: fine almost anywhere.' },
        { id: 'ph.sw.de.scheibenkleister', tl: 'Scheibenkleister!', en: 'Shoot!', s: 0, note: 'It starts like «Scheiße», then turns harmless (“window putty”). Perfect in front of your Oma.' },
        { id: 'ph.sw.de.kacke', tl: 'Kacke!', en: 'Crap!', s: 1, note: 'Like “crap!”. Rude and a bit childish. Not at school, not at work.' },
        { id: 'ph.sw.de.verdammt', tl: 'Verdammt!', en: 'Dammit!', s: 1, note: 'An angry “dammit!”. Common, but not polite.' },
        { id: 'ph.sw.de.scheisse', tl: 'Scheiße!', en: 'Shit!', s: 1, note: 'Germany’s favorite swear. Very common, still rude: not with kids, teachers or your Oma.' },
        { id: 'ph.sw.de.verdammtescheisse', tl: 'Verdammte Scheiße!', en: 'Goddamn shit!', s: 2, note: 'Both together: very angry. Only when the wheel falls off for the fifth time.' },
        { id: 'ph.sw.de.arschloch', tl: 'Arschloch', en: 'asshole (an insult)', s: 2, insult: true, note: 'A strong insult! Never call anyone this. Know it, so you know when someone’s rude.' },
      ] },
  };
  // the check after the mild lesson (output: say one); the strong one asks how strong a word is, the last one about the insult
  const SW_ASK = g => `You drop your ice cream. Your ${g} is standing right next to you. What do you say?`;
  // what gets bleeped (strong and very strong ones, in every language, plus the English glosses)
  const BLEEP_WORDS = ['mierda', 'carajo', 'joder', 'jodido', 'jodida', 'pinche', 'pinches', 'puta', 'putas', 'pendejo', 'pendeja', 'pendejos', 'cabrón', 'cabron', 'chingado', 'chingada', 'coño',
    'merda', 'porra', 'caralho', 'cacete', 'babaca', 'pqp',
    'scheiße', 'scheisse', 'scheiß', 'kacke', 'arschloch', 'verdammt', 'verdammte', 'verdammter', 'verdammtes', 'verdammten',
    'shit', 'shitty', 'fuck', 'fucking', 'damn', 'dammit', 'goddamn', 'asshole', 'bastard', 'crap', 'motherf'];
  const BLEEP_RE = new RegExp('(^|[^\\p{L}])(' + BLEEP_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')(?=$|[^\\p{L}])', 'giu');
  function bleep(text) {
    if (!bleepOn() || !text) return text;
    return String(text).replace(BLEEP_RE, (m, pre, w) => pre + w[0] + '***');
  }

  // ================================================================ everyone else's lines ({ es, pt, de, en }; English with weave slots)
  const T = (es, pt, de, en) => ({ es, pt, de, en });
  const NAMES = {
    keeper_alba: T('Doña Chela', 'Dona Cida', 'Frau Kaya'), keeper_molinar: T('Nacho', 'Guto', 'Timo'), keeper_remanso: T('Doña Pili', 'Dona Graça', 'Frau Pütz'),
    paper: T('Don Anselmo', 'Seu Hélio', 'Herr Lindner'), gossipA: T('Lucha', 'Neide', 'Gitte'), gossipB: T('Male', 'Zezé', 'Moni'),
    paloma: T('Paloma', 'Duda', 'Frieda'), michi: T('Michi', 'Mingau', 'Mieze'), kid: T('Tavo', 'Juca', 'Paul'),
    dom0: T('Don Eusebio', 'Seu Juvenal', 'Herr Kluge'), dom1: T('Don Fermín', 'Seu Osvaldo', 'Herr Brandt'), dom2: T('Don Julio', 'Seu Nestor', 'Herr Wolf'),
    sweeper: T('Doña Fina', 'Dona Fátima', 'Frau Brehm'), walker: T('Rodrigo', 'Caio', 'Jannik'), dog: T('Canelo', 'Paçoca', 'Bello'),
    vale: T('Vale', 'Yasmin', 'Mira'), shy: T('Joaquín', 'Davi', 'Jonte'),
  };
  const nmRaw = k => (NAMES[k] ? NAMES[k][dl()] || NAMES[k].es : k);          // (zh / ja: the notation, for zh / ja lines)
  const nm = k => plainC(nmRaw(k));                                          // (as plain text: labels, menus, English)
  const LT = {
    'tl.store.alba.hi': T('¡Bienvenidos a la tiendita! Aquí hay de todo… y el chisme es gratis.', 'Bem-vindos à vendinha! Aqui tem de tudo… e a fofoca é de graça.', 'Willkommen am Kiosk! Hier gibt’s alles … und der Tratsch ist umsonst.', 'Welcome to the corner store! We have everything… and the gossip is free.'),
    'tl.store.molinar.hi': T('¡Hola! Aaah… perdón. Trabajo toda la noche y duermo poco.', 'Oi! Aaah… desculpa. Eu trabalho a noite toda e durmo pouco.', 'Hallo! Aaah … Entschuldigung. Ich arbeite die ganze Nacht und schlafe wenig.', 'Hi! Aaah… sorry. I work all night and hardly sleep.'),
    'tl.store.remanso.hi': T('¡Hola, cielo! En Remanso hace calor. ¡Un helado lo arregla todo!', 'Oi, meu anjo! Em Remanso faz calor. Um sorvete resolve tudo!', 'Hallo, Herzchen! In Remanso ist es heiß. Ein Eis hilft immer!', 'Hi, sweetheart! It’s hot in Remanso. {w.icecream} fixes everything!'),
    // the parcel (Doña Chela, in Alba) for an old man at the dominoes table in Molinar
    'tl.parcel.ask': T('¿Vas a Molinar? ¡Qué suerte! ¿Le llevas este paquete a don Eusebio? Juega dominó cerca del Gran Molino.',
      'Você vai pra Molinar? Que sorte! Leva esse pacote pro seu Juvenal? Ele joga dominó perto do Grande Moinho.',
      'Du gehst nach Molinar? Wie praktisch! Bringst du Herrn Kluge dieses Paket? Er spielt Domino bei der Großen Mühle.',
      'You’re going to Molinar? How lucky! Will you take this parcel to {dom0}? He plays dominoes near the Great Mill.'),
    'tl.parcel.ask2': T('Ojo: siempre juega con dos amigos. ¡Pregunta por él por su nombre!', 'Olha: ele sempre joga com dois amigos. Pergunta por ele pelo nome!', 'Aber Achtung: Er spielt immer mit zwei Freunden. Frag nach ihm, mit Namen!', 'Careful: he always plays with two friends. Ask for him by name!'),
    'tl.dom.0': T('¡Shh! Estamos jugando dominó.', 'Psiu! A gente tá jogando dominó.', 'Pst! Wir spielen Domino.', 'Shh! We’re playing dominoes.'),
    'tl.dom.1': T('¡Capicúa! … No, perdón, todavía no.', 'Bati! … Não, desculpa, ainda não.', 'Domino! … Nein, Entschuldigung, noch nicht.', 'I win! … No, sorry, not yet.'),
    'tl.dom.2': T('Llevamos cuarenta años jugando aquí.', 'A gente joga aqui há quarenta anos.', 'Wir spielen hier seit vierzig Jahren.', 'We’ve been playing here for forty years.'),
    'tl.dom.notme': T('¿Yo? No, yo soy {me}.', 'Eu? Não, eu sou o {me}.', 'Ich? Nein, ich bin {me}.', 'Me? No, I’m {me}.'),
    'tl.dom.huh': T('¿A quién buscas? Di su nombre.', 'Você procura quem? Fala o nome.', 'Wen suchst du? Sag den Namen.', 'Who are you looking for? Say the name.'),
    'tl.dom.me': T('¡Soy yo! ¿Un paquete de Chela? ¡Calcetines! Ella sabe que siempre tengo frío.', 'Sou eu! Um pacote da Cida? Meias! Ela sabe que eu sempre sinto frio.', 'Das bin ich! Ein Paket von Frau Kaya? Socken! Sie weiß, dass ich immer friere.', 'That’s me! A parcel from {keeper_alba}? Socks! She knows I’m always cold.'),
    'tl.dom.thanks': T('Toma, por el viaje. ¡Y dile a Chela que gracias!', 'Toma, pela viagem. E fala pra Cida: obrigado!', 'Hier, für den Weg. Und sag Frau Kaya danke!', 'Here, for the trip. And tell {keeper_alba} thanks!'),
    // the sign with a typo (Molinar's sleepy keeper)
    'tl.sign.ask': T('Anoche pinté un letrero nuevo… a las cuatro de la mañana. ¿Está bien escrito? Míralo, por favor.', 'Ontem à noite eu pintei uma placa nova… às quatro da manhã. Tá escrito certo? Dá uma olhada, por favor.',
      'Gestern Nacht hab ich ein neues Schild gemalt … um vier Uhr morgens. Ist es richtig geschrieben? Schau’s dir bitte an.', 'Last night I painted a new sign… at four in the morning. Is it spelled right? Take a look, {c.please}.'),
    'tl.sign.thanks': T('¡Ay, qué vergüenza! ¡Gracias! Toma un helado, invita la casa.', 'Ai, que vergonha! Valeu! Toma um sorvete, é por conta da casa.', 'Oh, wie peinlich! Danke! Hier, ein Eis. Geht aufs Haus.', 'Oh, how embarrassing! {c.thanks}! Here, have some {w.icecream}, on the house.'),
    // Michi the cat (Paloma, by Alba's corner store)
    'tl.cat.ask': T('¡Mi gata Michi se perdió! Es naranja, con las patas blancas. ¿Me ayudas?', 'A minha gata Mingau sumiu! Ela é laranja, com as patinhas brancas. Me ajuda?', 'Meine Katze Mieze ist weg! Sie ist orange, mit weißen Pfoten. Hilfst du mir?', 'My {w.cat} {michi} is lost! She’s orange, with white paws. Will you help me?'),
    'tl.cat.ask2': T('Pregunta a la gente: «¿Has visto un gato?»', 'Pergunta pro pessoal: «Você viu um gato?»', 'Frag die Leute: „Hast du eine Katze gesehen?“', 'Ask people: «{model}»'),
    'tl.cat.wait': T('¿Ya encontraste a Michi? Pregunta a la gente, por favor.', 'Já achou a Mingau? Pergunta pro pessoal, por favor.', 'Hast du Mieze schon gefunden? Frag die Leute, bitte.', 'Have you found {michi} yet? Ask people, {c.please}.'),
    'tl.cat.thanks': T('¡Michi! ¡Gracias, gracias! Toma, son mis ahorros.', 'Mingau! Obrigada, obrigada! Toma, são as minhas economias.', 'Mieze! Danke, danke! Hier, mein Taschengeld.', '{michi}! {c.thanks}, {c.thanks}! Here, my savings.'),
    'tl.cat.look': T('Mira, {mimo}: es un gato. ¡Un gato!', 'Olha, {mimo}: é um gato. Um gato!', 'Schau, {mimo}: Das ist eine Katze. Eine Katze!', '{c.look}, {mimo}: it’s a {w.cat}. A {w.cat}!'),
    'tl.cat.after': T('Michi ya no se escapa. Bueno… casi nunca.', 'A Mingau não foge mais. Bom… quase nunca.', 'Mieze läuft nicht mehr weg. Na ja … fast nie.', '{michi} doesn’t run away anymore. Well… almost never.'),
    'tl.cat.paper': T('¿Un gato? Sí, uno naranja. Corrió hacia la puerta del este, hacia la carreta.', 'Um gato? Sim, um laranja. Correu pro portão leste, pra carroça.', 'Eine Katze? Ja, eine orange. Sie ist zum Osttor gelaufen, zum Karren.', 'A {w.cat}? Yes, an orange one. It ran toward the east gate, by the cart.'),
    'tl.huh': T('¿Perdón? No te entendí.', 'Como? Não entendi.', 'Wie bitte? Das hab ich nicht verstanden.', 'Sorry? I didn’t understand.'),
    // the kite (Quique, by Molinar's store)
    'tl.kite.ask': T('¡Mi cometa se quedó en el árbol! Está muy alto… ¡no llego!', 'A minha pipa ficou presa na árvore! Tá alto demais… não alcanço!', 'Mein Drachen hängt im Baum fest! Er ist zu hoch … ich komm nicht ran!', 'My {w.kite} got stuck in the {w.tree}! It’s too high… I can’t reach it!'),
    'tl.kite.ask2': T('¿Tu {mimo} puede saltar muy alto?', 'O seu {mimo} consegue pular bem alto?', 'Kann dein {mimo} ganz hoch springen?', 'Can your {mimo} jump really high?'),
    'tl.kite.thanks': T('¡Mi cometa! ¡Gracias! Toma, un dulce para {mimo}.', 'A minha pipa! Valeu! Toma, uma bala pro {mimo}.', 'Mein Drachen! Danke! Hier, ein Bonbon für {mimo}.', 'My {w.kite}! {c.thanks}! Here, a {w.candy} for {mimo}.'),
    'tl.kite.after': T('¡Mira cómo vuela! Con el viento de Molinar, ¡vuela altísimo!', 'Olha como ela voa! Com o vento de Molinar, voa altíssimo!', 'Schau, wie er fliegt! Mit dem Wind von Molinar fliegt er ganz hoch!', '{c.look} how it flies! With Molinar’s wind, it flies super high!'),
    // the shy fisher (Remanso) and the kiosk keeper's granddaughter
    'tl.shy.ask': T('Psst… ¿puedo pedirte un favor? Quiero invitar a Vale a tomar un helado. Pero siempre me equivoco con las palabras…', 'Psiu… posso te pedir um favor? Quero chamar a Yasmin pra tomar um sorvete. Mas eu sempre erro as palavras…',
      'Psst … kann ich dich was fragen? Ich will Mira auf ein Eis einladen. Aber ich sag immer die falschen Wörter …', 'Psst… can I ask you a favor? I want to ask {vale} out for {w.icecream}. But I always get the words wrong…'),
    'tl.shy.ask2': T('¿Me ayudas a escribir la pregunta?', 'Me ajuda a escrever a pergunta?', 'Hilfst du mir, die Frage zu schreiben?', 'Will you help me write the question?'),
    'tl.shy.nervous': T('Mmm… falta algo. ¿Y el helado? ¿Y la pregunta?', 'Hum… tá faltando alguma coisa. E o sorvete? E a pergunta?', 'Hm … da fehlt was. Und das Eis? Und die Frage?', 'Hmm… something’s missing. The {w.icecream}? The question?'),
    'tl.shy.before': T('Vale es muy simpática… pero me pongo nervioso.', 'A Yasmin é muito legal… mas eu fico nervoso.', 'Mira ist echt nett … aber ich werde so nervös.', '{vale} is really nice… but I get so nervous.'),
    'tl.shy.yes': T('¿Un helado contigo? ¡Claro que sí! … Pero yo vendo helados. ¡Invito yo!', 'Um sorvete com você? Claro que sim! … Mas eu vendo sorvete. Eu que pago!', 'Ein Eis mit dir? Na klar! … Aber ich verkaufe Eis. Ich lade dich ein!', '{w.icecream} with you? Of course! … But I sell {w.icecream}! My treat!'),
    'tl.shy.after': T('¡Dijo que sí! ¡Gracias! Las palabras no eran tan difíciles…', 'Ela disse sim! Valeu! As palavras não eram tão difíceis…', 'Sie hat ja gesagt! Danke! Die Wörter waren gar nicht so schwer …', 'She said yes! {c.thanks}! The words weren’t that hard…'),
    'tl.shy.later': T('Mañana vamos a tomar otro helado. ¡Y yo hablo primero!', 'Amanhã a gente vai tomar outro sorvete. E eu falo primeiro!', 'Morgen essen wir noch ein Eis. Und ich rede zuerst!', 'Tomorrow we’re having another {w.icecream}. And I’ll speak first!'),
    'tl.vale.0': T('Ayudo a mi abuela en el kiosco. ¡El helado de coco es el mejor!', 'Eu ajudo a minha avó na banca. O sorvete de coco é o melhor!', 'Ich helfe meiner Oma im Büdchen. Das Kokoseis ist das beste!', 'I help my grandma at the kiosk. The coconut {w.icecream} is the best!'),
    'tl.vale.1': T('Joaquín siempre compra un refresco y no dice nada. ¡Qué raro!', 'O Davi sempre compra um refrigerante e não fala nada. Que estranho!', 'Jonte kauft immer eine Limo und sagt nichts. Komisch!', '{shy} always buys a {w.soda} and says nothing. Strange!'),
    // life
    'tl.paper.0': T('Aquí dice que va a llover. El periódico nunca se equivoca… casi nunca.', 'Aqui diz que vai chover. O jornal nunca erra… quase nunca.', 'Hier steht, dass es regnet. Die Zeitung irrt sich nie … fast nie.', 'It says here it’s going to rain. The {w.newspaper} is never wrong… almost never.'),
    'tl.paper.1': T('¿Sabías que en la tiendita venden el periódico? Cuesta dos monedas.', 'Sabia que a vendinha vende jornal? Custa duas moedas.', 'Wusstest du, dass es am Kiosk die Zeitung gibt? Sie kostet zwei Münzen.', 'Did you know the corner store sells the {w.newspaper}? It’s two coins.'),
    'tl.gossipA.0': T('¿Viste al señor de la carreta? ¡Dice cada grosería!', 'Viu o senhor da carroça? Ele fala cada palavrão!', 'Hast du den Mann mit dem Karren gehört? Der flucht vielleicht!', 'Have you heard the man with the cart? The words he says!'),
    'tl.gossipB.0': T('Y los muchachos de la esquina fuman todo el día. ¡Pero son simpáticos!', 'E os rapazes da esquina fumam o dia todo. Mas são simpáticos!', 'Und die Jungs an der Ecke rauchen den ganzen Tag. Aber sie sind nett!', 'And the guys on the corner smoke all day. But they’re nice!'),
    'tl.gossipA.1': T('Doña Chela sabe todo lo que pasa en Alba. ¡Todo!', 'A Dona Cida sabe tudo que acontece em Alba. Tudo!', 'Frau Kaya weiß alles, was in Alba passiert. Alles!', '{keeper_alba} knows everything that happens in Alba. Everything!'),
    'tl.gossipB.1': T('Shh… ¡que nos escucha!', 'Psiu… ela tá ouvindo!', 'Pst … sie hört uns!', 'Shh… she can hear us!'),
    'tl.sweeper.0': T('¡Cuidado, que barro! Con tanto viento, la basura vuela por todo Molinar.', 'Cuidado, tô varrendo! Com tanto vento, o lixo voa pela Molinar inteira.', 'Vorsicht, ich fege! Bei dem Wind fliegt der Müll durch ganz Molinar.', 'Careful, I’m sweeping! With all this wind, trash flies all over Molinar.'),
    'tl.sweeper.1': T('El muchacho del almacén duerme de día y trabaja de noche. ¡Qué raro!', 'O moço do mercadinho dorme de dia e trabalha de noite. Que estranho!', 'Der Junge vom Späti schläft am Tag und arbeitet nachts. Komisch!', 'The young man at the store sleeps by day and works by night. How strange!'),
    'tl.walker.0': T('Este es Canelo. ¡Le encanta correr detrás de los molinos!', 'Esse é o Paçoca. Ele adora correr atrás dos moinhos!', 'Das ist Bello. Er rennt so gern den Mühlen hinterher!', 'This is {dog}. He loves running after the windmills!'),
    'tl.walker.1': T('¿Tu {mimo} y Canelo pueden ser amigos?', 'O seu {mimo} e o Paçoca podem ser amigos?', 'Können dein {mimo} und Bello Freunde sein?', 'Can your {mimo} and {dog} be friends?'),
  };
  // the model sentences you're asked for, per language
  const MODEL = {
    cat: T('¿Has visto un gato?', 'Você viu um gato?', 'Hast du eine Katze gesehen?', 'Have you seen a cat?'),
    shy: T('¿Quieres tomar un helado conmigo?', 'Você quer tomar um sorvete comigo?', 'Willst du mit mir ein Eis essen?', 'Do you want to have an ice cream with me?'),
    parcel: T('¿Quién es don Eusebio?', 'Quem é o seu Juvenal?', 'Wer ist Herr Kluge?', 'Which one of you is {dom0}?'),
  };
  // zh / ja (CJK.md notation)
  Object.assign(MODEL.cat, { zh: '[你|nǐ] [看见|kàn jiàn] [一|yī] [只|zhī] [猫|māo] [了|le] [吗|ma] ？', ja: '[猫|ねこ] を [見|み]ません でした か ？' });
  Object.assign(MODEL.shy, { zh: '[你|nǐ] [想|xiǎng] [跟|gēn] [我|wǒ] [一起|yī qǐ] [吃|chī] [冰淇淋|bīng qí lín] [吗|ma] ？', ja: '[一緒|いっしょ] に アイス を [食|た]べません か ？' });
  Object.assign(MODEL.parcel, { zh: '[哪|nǎ] [位|wèi] [是|shì] {dom0} ？', ja: '{dom0} さん は どなた です か ？' });
  // the sign Molinar's keeper painted at four in the morning, and what it should say
  const SIGN_TYPO = {
    es: { wrong: '¡HAY HELADOZ!', right: '¡Hay helados!', ok: ['helados'], bad: ['heladoz'], en: 'We have ice cream!' },
    pt: { wrong: 'TEMOS SORVETI!', right: 'Temos sorvete!', ok: ['sorvete', 'sorvetes'], bad: ['sorveti'], en: 'We have ice cream!' },
    de: { wrong: 'KALTE GETRENKE!', right: 'Kalte Getränke!', ok: ['getranke', 'getraenke'], bad: ['getrenke'], en: 'Cold drinks!' },
  };
  // zh / ja: a real slip of the brush. zh in characters: 琪 (the jade radical) for 淇 (the water one: ice cream is cold and
  // wet), the classic homophone slip, so it's fixed in characters (the IME); in pinyin, which can't show that, a letter too
  // many. ja: ン for ソ, the classic katakana mix-up (and no Japanese word starts with ン). The wrong forms stay out of CJK's
  // dictionary (the IME would offer them).
  const HAN = /[㐀-鿿]/;
  const ZH_SIGN = {
    chars: { wrong: '[有|yǒu] [冰琪淋|bīng qí lín] ！', right: '[有|yǒu] [冰淇淋|bīng qí lín] ！', en: 'We have ice cream!', note: 'Look closely at each character… ice cream is cold and wet.',
      check: t => HAN.test(t) && /冰(淇淋|激凌)/.test(t) && !/琪/.test(t),
      wrongHint: t => (!HAN.test(t) ? 'Write it in characters: type the pinyin, then pick the characters.' : /琪/.test(t) ? 'That’s the same slip as on the sign! Which character is off?' : '') },
    roman: { wrong: 'YǑU BĪNGQÍLÍNG!', right: '[有|yǒu] [冰淇淋|bīng qí lín] ！', ok: ['bingqilin'], bad: ['bingqiling'], en: 'We have ice cream!', note: 'Read it out loud, letter by letter.' },
  };
  Object.defineProperty(SIGN_TYPO, 'zh', { enumerable: true, get: () => ZH_SIGN[typeof CJK !== 'undefined' && CJK.mode('zh') === 'chars' ? 'chars' : 'roman'] });
  const JA_SIGN = { wrong: 'ンフトクリーム あります ！', right: 'ソフトクリーム あります ！', ok: ['ソフト', 'そふと', 'sofuto'], bad: ['ンフト', 'んふと', 'nfuto'], en: 'We have soft-serve ice cream!' };
  Object.defineProperty(SIGN_TYPO, 'ja', { enumerable: true, get: () => Object.assign({}, JA_SIGN, { note: typeof CJK !== 'undefined' && CJK.mode('ja') === 'chars'
    ? 'Look closely at the katakana. Some of them look a lot alike…' : 'Read it out loud, sound by sound. Does the first word sound right?' }) });
  // the day's paper: headlines picked by what's happened ({ when, es, pt, de, en })
  const MAST = T('EL ECO DEL VALLE', 'O ECO DO VALE', 'DAS TALBLATT', 'The Valley Echo');
  const NEWS = [
    { when: s => (s.q.cat || 0) === 1, ...T('Se busca gata naranja: se llama Michi', 'Procura-se gata laranja: o nome é Mingau', 'Orange Katze vermisst: Sie heißt Mieze', 'Wanted: an orange cat named {michi}') },
    { when: s => (s.q.cat || 0) >= 3, ...T('Michi vuelve a casa: ¡fiesta en Alba!', 'Mingau volta pra casa: festa em Alba!', 'Mieze ist wieder da: Fest in Alba!', '{michi} comes home: a party in Alba!') },
    { when: (s, f) => !f.millFree, ...T('Molinar: el Gran Molino sigue parado', 'Molinar: o Grande Moinho continua parado', 'Molinar: Die Große Mühle steht still', 'Molinar: the Great Mill still isn’t turning') },
    { when: (s, f) => !!f.millFree, ...T('¡El Gran Molino gira otra vez! Suena la primera campana', 'O Grande Moinho gira de novo! Toca o primeiro sino', 'Die Große Mühle dreht sich wieder! Die erste Glocke läutet', 'The Great Mill turns again! The first bell rings') },
    { when: s => (s.q.kite || 0) >= 2, ...T('Molinar: una cometa vuela más alto que los molinos', 'Molinar: uma pipa voa mais alto que os moinhos', 'Molinar: Ein Drachen fliegt höher als die Mühlen', 'Molinar: a kite flies higher than the windmills') },
    { when: s => (s.q.sign || 0) >= 2, ...T('El almacén de Molinar arregla su letrero', 'O mercadinho de Molinar conserta a placa', 'Der Späti in Molinar repariert sein Schild', 'Molinar’s store fixes its sign') },
    { when: s => (s.q.shy || 0) >= 2, ...T('Remanso: ¡amor en el kiosco!', 'Remanso: amor na banca!', 'Remanso: Liebe am Büdchen!', 'Remanso: love at the kiosk!') },
    { always: true, ...T('Un marinero jubilado rompe su carreta por tercera vez', 'Marinheiro aposentado quebra a carroça pela terceira vez', 'Alter Seemann: Karren schon wieder kaputt', 'Retired sailor breaks his cart for the third time') },
    { always: true, ...T('Vecinos discuten: ¿«chido», «bárbaro» o «bacano»?', 'Vizinhos discutem: «biscoito» ou «bolacha»?', 'Streit an der Ecke: „Schrippe“, „Semmel“ oder „Weggli“?', 'Neighbors argue: whose word is right?') },
    { always: true, ...T('El Silencio avanza. Los expertos dicen: ¡hablen más!', 'O Silêncio avança. Especialistas dizem: falem mais!', 'Die Stille wächst. Experten sagen: Redet mehr!', 'The Hush spreads. Experts say: talk more!') },
    { always: true, ...T('Cuidado: armadillos en las colinas', 'Cuidado: tatus nas colinas', 'Vorsicht: Gürteltiere in den Hügeln', 'Watch out: armadillos in the hills') },
  ];

  // ================================================================ zh / ja (CJK.md notation): the corner's own people
  // A zh / ja game has its own trio and its own sailor (the es / pt / de ones stay away), each with regional, PG slang:
  //   zh  大鹏 Dàpéng (Beijing) · 阿杰 Ā Jié (Chengdu, Sichuan) · 铁柱 Tiězhù (Harbin, the Northeast) · the sailor 老高 Lǎo Gāo
  //   ja  マサ Masa (Osaka) · ショウ Shō (Hakata, Fukuoka) · カイ Kai (Okinawa) · the sailor ゲンさん Gen-san
  // Their lines are notation. The English keeps the slang in «», as notation too (enC: characters or pinyin / rōmaji, by the
  // mode). Names and region names are notation (nameC, region.tlC), read as plain text through getters (labels, menus).
  // Swearing stays PG: mild (哎呀, しまった), strong (该死, くそっ), very strong (去你的, この やろう), and one insult to know.
  const CJ = ['zh', 'ja'];
  const Z = (zh, ja) => ({ zh, ja });
  const plainL = (s, l) => (typeof CJK !== 'undefined' && typeof s === 'string' ? CJK.plain(s, { lang: l }) : s);
  const asCJK = (l, o) => {
    const nc = o.name; o.nameC = nc; Object.defineProperty(o, 'name', { enumerable: true, get: () => plainL(nc, l) });
    if (o.region) { const rc = o.region.tl; o.region.tlC = rc; Object.defineProperty(o.region, 'tl', { enumerable: true, get: () => plainL(rc, l) }); }
    return o;
  };
  // the English of a zh / ja line: the notation in «» as plain text in the mode
  const enC = s => (cjkGame() && typeof s === 'string' ? s.replace(/«([^»]*)»/g, (m, x) => '«' + (/[぀-ヿ㐀-鿿[]/.test(x) ? CJK.plain(x, { lang: realLang(), cap: false }) : x) + '»') : s);
  SMOKERS.zh = [
    { id: 'dapeng', name: '[大鹏|Dà péng]', region: { tl: '[北京|Běi jīng]', en: 'Beijing' }, color: '#c8463c', from: 'Beijing',
      look: { skin: '#e8c39e', hair: '#1f1a17', dress: '#3b5ba5', legs: true, pants: '#2b2b3a', shoes: '#f4f1ea', hat: 'flat', hatColor: '#4a4a52' },
      hi: L1('[嘿|hēi] ！ [干嘛|gàn má] [呢|ne] ？ [来|lái] ， [坐|zuò] [这儿|zhè r] [聊|liáo] [会儿|huì r] ！', '«[嘿|hēi]» (hey)! «[干嘛呢|gàn má ne]» (what’s up)? Come on, sit here and chat a bit!'),
      start: L1('[得嘞|dé lei] ！ [我|wǒ] [教|jiāo] [你|nǐ] [说|shuō] [北京话|Běi jīng huà] 。 [听|tīng] [好|hǎo] [了|le] ！', '«[得嘞|dé lei]» (you got it)! I’ll teach you how we talk in Beijing. Listen up!'),
      quiz: L1('[该|gāi] [你|nǐ] [了|le] ！ [看看|kàn kan] [你|nǐ] [还|hái] [记得|jì de] [不|bù] 。', 'Your turn! Let’s see if you remember.'),
      win: L1('[倍儿|bèi r] [棒|bàng] ！ [你|nǐ] [说话|shuō huà] [跟|gēn] [老|lǎo] [北京|Běi jīng] [一样|yī yàng] ！', '«[倍儿棒|bèi r bàng]» (super!) You talk like a real old Beijinger!'),
      ok: L1('[还|hái] [行|xíng] ！ [多|duō] [练练|liàn lian] [就|jiù] [好|hǎo] 。', 'Not bad! A bit more practice and you’ve got it.'),
      later: L1('[得|dé] ， [回头|huí tóu] [见|jiàn] ！', '«[得|dé]» (OK), see you later!'),
      chat: [L1('[我|wǒ] [奶奶|nǎi nai] [说|shuō] [寂静|Jì jìng] [会|huì] [吃掉|chī diào] [话|huà] 。 [所以|suǒ yǐ] [我|wǒ] [天天|tiān tiān] [贫|pín] ！', 'My grandma says the Hush eats words. That’s why I «[贫|pín]» (yak away) every day!'),
        L1('[说真的|shuō zhēn de] ， [玛尔塔|Mǎ ěr tǎ] [的|de] {w.bread} [倍儿|bèi r] [香|xiāng] 。', 'For real, Marta’s {w.bread} smells «[倍儿|bèi r]» (super) good.'),
        L1('[嘿|hēi] ， [你|nǐ] [的|de] {mimo} [真|zhēn] [好玩儿|hǎo wán r] 。 [它|tā] [会|huì] [说话|shuō huà] [吗|ma] ？', 'Hey, your {mimo} is really «[好玩儿|hǎo wán r]» (fun). Does it talk?')],
      cat: L1('[橘猫|jú māo] ？ [在|zài] [那|nà] [个|gè] [箱子|xiāng zi] [里|lǐ] [睡觉|shuì jiào] [呢|ne] ！ [你|nǐ] [瞧|qiáo] 。', 'An orange {w.cat}? It’s asleep in that crate! «[瞧|qiáo]» (look).'),
      praise: ['[好|hǎo] ！', '[地道|dì dao] ！', '[倍儿|bèi r] [棒|bàng] ！'],
      phrases: [
        { id: 'ph.bj.gemen', tl: '[哥们儿|gē men r]', en: 'buddy, pal', note: 'What Beijing guys call a close friend. The «[儿|r]» at the end (just an “r” sound) is very Beijing: they put it on lots of words.', ex: '[哥们儿|gē men r] ， [走|zǒu] ， [吃|chī] [饭|fàn] [去|qù] ！', exEn: 'Come on, buddy, let’s go eat!', ask: 'How does someone from Beijing say “buddy” to a friend?', keys: ['哥们', 'gemen'] },
        { id: 'ph.bj.beir', tl: '[倍儿|bèi r] [棒|bàng]', en: 'super great', note: '«[倍儿|bèi r]» = super, really: «[倍儿棒|bèi r bàng]» super great, «[倍儿香|bèi r xiāng]» super tasty. Pure Beijing.', ex: '[你|nǐ] [的|de] {mimo} [倍儿|bèi r] [棒|bàng] ！', exEn: 'Your {mimo} is super great!', ask: 'How would someone from Beijing say “super great”?', keys: ['倍儿棒', '倍棒', 'beirbang', 'beibang'] },
        { id: 'ph.bj.beng', tl: '[甭|béng] [客气|kè qi]', en: 'don’t mention it', note: '«[甭|béng]» squeezes «[不用|bù yòng]» (no need) into one sound. «[甭客气|béng kè qi]» = no need to be polite: you’re welcome!', ex: '[谢|xiè] [什么|shén me] [呀|ya] ！ [甭|béng] [客气|kè qi] ！', exEn: 'What are you thanking me for? Don’t mention it!', ask: 'Someone thanks you. Answer the Beijing way: “Don’t mention it!”', keys: ['甭客气', 'bengkeqi'] },
        { id: 'ph.bj.laojia', tl: '[劳驾|láo jià]', en: 'excuse me (may I…)', note: 'An old, polite Beijing “excuse me”: to get past someone, or to ask a small favor.', ex: '[劳驾|láo jià] ， [让|ràng] [一下|yī xià] 。', exEn: 'Excuse me, could I get past?', ask: 'You need to squeeze past someone in a Beijing alley. What do you say?', keys: ['劳驾', 'laojia'] },
        { id: 'ph.bj.kandashan', tl: '[侃|kǎn] [大山|dà shān]', en: 'to shoot the breeze', note: 'Beijing for chatting for hours about everything and nothing. Word for word: “to chat at the big mountain”!', ex: '[我们|wǒ men] [天天|tiān tiān] [在|zài] [这儿|zhè r] [侃|kǎn] [大山|dà shān] 。', exEn: 'We shoot the breeze here every day.', ask: 'In Beijing, how do you say “to shoot the breeze” (chat for hours)?', keys: ['侃大山', 'kandashan'] },
      ] },
    { id: 'ajie', name: '[阿|Ā] [杰|Jié]', region: { tl: '[成都|Chéng dū]', en: 'Chengdu' }, color: '#e0803a', from: 'Chengdu, in Sichuan',
      look: { skin: '#e3b88f', hair: '#2a211c', hairdo: 'curly', dress: '#f2a23a', legs: true, pants: '#3a4a3a', shoes: '#2b2235', glasses: true },
      hi: L1('[哎|āi] ， [你|nǐ] [来|lái] [啦|la] ！ [坐|zuò] [嘛|ma] ， [莫|mò] [客气|kè qi] 。', '«[哎|āi]», you’re here! Sit down, «[莫|mò]» (don’t) be shy.'),
      start: L1('[要得|yào dé] ！ [我|wǒ] [教|jiāo] [你|nǐ] [说|shuō] [四川话|Sì chuān huà] ， [巴适|bā shì] [得很|de hěn] ！', '«[要得|yào dé]» (OK)! I’ll teach you Sichuan talk. It’s «[巴适得很|bā shì de hěn]» (just great)!'),
      quiz: L1('[来|lái] ， [该|gāi] [你|nǐ] [了|le] 。 [还|hái] [记得|jì de] [不|bù] ？', 'Come on, your turn. Still remember?'),
      win: L1('[巴适|bā shì] ！ [你|nǐ] [都|dōu] [是|shì] [半|bàn] [个|gè] [成都人|Chéng dū rén] [了|le] ！', '«[巴适|bā shì]» (great)! You’re half a Chengdu local now!'),
      ok: L1('[要得|yào dé] ， [慢慢|màn màn] [来|lái] ， [不|bù] [着急|zháo jí] 。', '«[要得|yào dé]» (OK), take it slow. No rush.'),
      later: L1('[要得|yào dé] ， [下回|xià huí] [再|zài] [摆|bǎi] ！', '«[要得|yào dé]» (OK), we’ll «[摆|bǎi]» (chat) next time!'),
      chat: [L1('[成都人|Chéng dū rén] [不|bù] [着急|zháo jí] 。 [喝|hē] [茶|chá] ， [摆|bǎi] [龙门阵|lóng mén zhèn] ， [安逸|ān yì] ！', 'Chengdu folks never rush. Drink tea, «[摆龙门阵|bǎi lóng mén zhèn]» (chat away)… «[安逸|ān yì]» (so comfy)!'),
        L1('[那|nà] [个|gè] [寂静|Jì jìng] [啊|a] ， [莫得|mò de] [啥子|shá zi] [好|hǎo] [怕|pà] [的|de] 。 [多|duō] [说话|shuō huà] [就|jiù] [行|xíng] [了|le] ！', 'That Hush? «[莫得|mò de]» (there’s nothing) to be scared of. Just talk more!'),
        L1('[你|nǐ] [的|de] {mimo} [好|hǎo] [乖|guāi] [哦|o] ！ [它|tā] [吃|chī] [不|bù] [吃|chī] [辣|là] ？', 'Your {mimo} is so sweet! Does it eat spicy food?')],
      cat: L1('[橘猫|jú māo] ？ [在|zài] [那|nà] [个|gè] [箱子|xiāng zi] [里头|lǐ tou] [睡|shuì] [得|de] [好|hǎo] [安逸|ān yì] [哦|o] ！', 'An orange {w.cat}? It’s asleep in that crate, all «[安逸|ān yì]» (snug)!'),
      praise: ['[要得|yào dé] ！', '[巴适|bā shì] ！', '[安逸|ān yì] ！'],
      phrases: [
        { id: 'ph.cd.bashi', tl: '[巴适|bā shì]', en: 'great, just right', note: 'Sichuan’s favorite word: comfortable, great, just right. «[巴适得很|bā shì de hěn]» = really great!', ex: '[这|zhè] [茶|chá] [巴适|bā shì] [得很|de hěn] ！', exEn: 'This tea is just great!', ask: 'How would someone from Chengdu say “great”?', keys: ['巴适', 'bashi'] },
        { id: 'ph.cd.yaode', tl: '[要得|yào dé]', en: 'OK! sure!', note: 'Sichuan’s “OK!”. Say it when you agree.', ex: '[走|zǒu] ， [吃|chī] [火锅|huǒ guō] ？ [要得|yào dé] ！', exEn: 'Let’s go eat hotpot? Sure!', ask: 'A friend from Chengdu asks you to go eat hotpot. Say “OK!” their way.', keys: ['要得', 'yaode'] },
        { id: 'ph.cd.anyi', tl: '[安逸|ān yì]', en: 'cozy, so nice', note: 'In standard Chinese «[安逸|ān yì]» means “easy, comfortable”. In Chengdu people say it about anything nice: food, weather, a nap.', ex: '[晒|shài] [太阳|tài yáng] ， [安逸|ān yì] ！', exEn: 'Sitting in the sun… so nice!', ask: 'Lying in the sun in Chengdu. How do you say “so nice”?', keys: ['安逸', 'anyi'] },
        { id: 'ph.cd.longmenzhen', tl: '[摆|bǎi] [龙门阵|lóng mén zhèn]', en: 'to chat, to tell stories', note: 'Sichuan for a long, happy chat. Word for word: “to set out the dragon-gate battle line”!', ex: '[我们|wǒ men] [喝|hē] [茶|chá] ， [摆|bǎi] [龙门阵|lóng mén zhèn] 。', exEn: 'We drink tea and chat away.', ask: 'In Chengdu, how do you say “to chat for hours”?', keys: ['龙门阵', 'longmenzhen'] },
        { id: 'ph.cd.mode', tl: '[莫得|mò de]', en: 'there isn’t, no', note: 'Sichuan for «[没有|méi yǒu]» (there isn’t). «[莫得问题|mò de wèn tí]» = no problem!', ex: '[莫得|mò de] [问题|wèn tí] ！', exEn: 'No problem!', ask: 'Say “no problem!” the Sichuan way.', keys: ['莫得', 'mode'] },
      ] },
    { id: 'tiezhu', name: '[铁柱|Tiě zhù]', region: { tl: '[东北|Dōng běi]', en: 'the Northeast' }, color: '#5b7f3a', from: 'Harbin, in the Northeast',
      look: { skin: '#f0cfa8', hair: '#3a2a20', beard: true, dress: '#5b6b3a', legs: true, pants: '#3a3a4a', shoes: '#2b2235', hat: 'beanie', hatColor: '#c0392b', h: 1.04, w: 1.14 },
      hi: L1('[嘎哈|gà há] [呢|ne] ？ [别|bié] [站|zhàn] [着|zhe] ， [过来|guò lái] [唠|lào] [会儿|huì r] [嗑|kē] ！', '«[嘎哈|gà há]» (what’re you up to)? Don’t just stand there, come «[唠嗑|lào kē]» (chat) a bit!'),
      start: L1('[整|zhěng] ！ [我|wǒ] [教|jiāo] [你|nǐ] [东北话|Dōng běi huà] ， [贼|zéi] [简单|jiǎn dān] ！', '«[整|zhěng]» (let’s do it)! I’ll teach you Northeast talk. It’s «[贼|zéi]» (super) easy!'),
      quiz: L1('[该|gāi] [你|nǐ] [了|le] ！ [咋样|zǎ yàng] ， [还|hái] [记得|jì de] [不|bù] ？', 'Your turn! «[咋样|zǎ yàng]» (so), still remember?'),
      win: L1('[嘎嘎|gā gā] [好|hǎo] ！ [你|nǐ] [这|zhè] [东北|Dōng běi] [味儿|wèi r] [贼|zéi] [正|zhèng] ！', '«[嘎嘎好|gā gā hǎo]» (super good)! Your Northeast accent is «[贼|zéi]» (totally) spot on!'),
      ok: L1('[还|hái] [行|xíng] 。 [多|duō] [整|zhěng] [几|jǐ] [遍|biàn] [就|jiù] [会|huì] [了|le] 。', 'Not bad. «[整|zhěng]» (do) it a few more times and you’ll have it.'),
      later: L1('[行|xíng] ， [回头|huí tóu] [接着|jiē zhe] [唠|lào] ！', 'OK, we’ll keep «[唠|lào]» (chatting) later!'),
      chat: [L1('[我们|wǒ men] [那儿|nà r] [冬天|dōng tiān] [零下|líng xià] [三十|sān shí] [度|dù] 。 [这儿|zhè r] [贼|zéi] [暖和|nuǎn huo] ！', 'Back home it’s thirty below in winter. Here it’s «[贼|zéi]» (super) warm!'),
        L1('[寂静|Jì jìng] [来|lái] [了|le] [咋整|zǎ zhěng] ？ [多|duō] [唠嗑|lào kē] [呗|bei] ！', 'The Hush is coming, «[咋整|zǎ zhěng]» (what do we do)? Just «[唠嗑|lào kē]» (chat) more!'),
        L1('[你|nǐ] [的|de] {mimo} [嘎嘎|gā gā] [可爱|kě ài] 。 [它|tā] [冷|lěng] [不|bù] [冷|lěng] ？', 'Your {mimo} is «[嘎嘎|gā gā]» (super) cute. Does it get cold?')],
      cat: L1('[橘猫|jú māo] ？ [搁|gē] [那|nà] [箱子|xiāng zi] [里|lǐ] [睡|shuì] [得|de] [贼|zéi] [香|xiāng] ！', 'An orange {w.cat}? It’s «[搁|gē]» (in) that crate, sleeping «[贼香|zéi xiāng]» (like a log)!'),
      praise: ['[整|zhěng] [挺|tǐng] [好|hǎo] ！', '[嘎嘎|gā gā] [好|hǎo] ！', '[贼|zéi] [棒|bàng] ！'],
      phrases: [
        { id: 'ph.db.laotie', tl: '[老铁|lǎo tiě]', en: 'close buddy', note: '«[老铁|lǎo tiě]» (old iron) is a friend as solid as iron. The Northeast made it famous all over China.', ex: '[老铁|lǎo tiě] ， [来|lái] [帮|bāng] [个|gè] [忙|máng] ！', exEn: 'Buddy, come give me a hand!', ask: 'In the Northeast, what do you call a close buddy?', keys: ['老铁', 'laotie'] },
        { id: 'ph.db.gaga', tl: '[嘎嘎|gā gā]', en: 'super, totally', note: 'Put it before a word to make it bigger: «[嘎嘎好|gā gā hǎo]» super good, «[嘎嘎香|gā gā xiāng]» super tasty.', ex: '[这|zhè] [饺子|jiǎo zi] [嘎嘎|gā gā] [香|xiāng] ！', exEn: 'These dumplings are super tasty!', ask: 'How do people from the Northeast say “super” (super good, super tasty)?', keys: ['嘎嘎', 'gaga'] },
        { id: 'ph.db.gaha', tl: '[嘎哈|gà há]', en: 'what are you doing? what for?', note: 'Northeast for «[干什么|gàn shén me]» (what are you doing?). «[你嘎哈呢|nǐ gà há ne] ？» = what are you up to?', ex: '[你|nǐ] [嘎哈|gà há] [呢|ne] ？', exEn: 'What are you up to?', ask: 'Ask a friend “What are you up to?” the Northeast way.', keys: ['嘎哈', 'gaha'] },
        { id: 'ph.db.zei', tl: '[贼|zéi]', en: 'really, super', note: '«[贼|zéi]» means “thief”, but in the Northeast it also means “very”: «[贼好|zéi hǎo]», «[贼冷|zéi lěng]».', ex: '[今天|jīn tiān] [贼|zéi] [冷|lěng] ！', exEn: 'It’s super cold today!', ask: 'In the Northeast, which word means “really” (and also “thief”)?', keys: ['贼', 'zei'] },
        { id: 'ph.db.laoke', tl: '[唠嗑|lào kē]', en: 'to chat', note: 'Northeast for a friendly chat. «[唠|lào] [会儿|huì r] [嗑|kē]» = chat for a while.', ex: '[有|yǒu] [空|kòng] [来|lái] [唠嗑|lào kē] ！', exEn: 'Come chat when you’re free!', ask: 'How do people from the Northeast say “to chat”?', keys: ['唠嗑', 'laoke'] },
      ] },
  ];
  SMOKERS.ja = [
    { id: 'masa', name: 'マサ', region: { tl: '[大阪|おおさか]', en: 'Osaka' }, color: '#e8b52e', from: 'Osaka',
      look: { skin: '#eac4a0', hair: '#2b1e18', dress: '#f2c14e', legs: true, pants: '#2b2235', shoes: '#f4f1ea', hat: 'cap', hatColor: '#1c1c1c' },
      hi: L1('おう 、 [来|き]た ん か ！ まあ [座|すわ]り 、 [座|すわ]り ！', '«おう» (hey), you came! Sit down, sit down!'),
      start: L1('ほな 、 [大阪弁|おおさかべん] [教|おし]えたる わ 。 よう [聞|き]き や ！', '«ほな» (alright then), I’ll teach you Osaka dialect. Listen up!'),
      quiz: L1('ほな 、 [次|つぎ] は あんた の [番|ばん] や 。 [覚|おぼ]えて る か ？', '«ほな» (alright), now it’s your turn. Remember?'),
      win: L1('めっちゃ ええ やん ！ もう [立派|りっぱ] な [大阪人|おおさかじん] や ！', '«めっちゃ ええ やん» (that’s super good)! You’re a true Osakan now!'),
      ok: L1('まあまあ や な 。 [練習|れんしゅう] したら いける で ！', '«まあまあ» (so-so). Practice and you’ll «いける» (get there)!'),
      later: L1('ほな 、 また な ！', '«ほな 、 また な» (see ya)!'),
      chat: [L1('ばあちゃん が [言|い]うてた 。 [静寂|せいじゃく] は [言葉|ことば] を [食|た]べる ん や て 。 せや から 、 ワイ は めっちゃ しゃべる ねん ！', 'My grandma said the Hush eats words. «せや から» (that’s why) I talk «めっちゃ» (a ton)!'),
        L1('ほんま 、 マルタ の {w.bread} は めっちゃ うまい で 。', '«ほんま» (for real), Marta’s {w.bread} is «めっちゃ» (super) tasty.'),
        L1('あんた の {mimo} 、 めっちゃ かわいい やん 。 しゃべる ん か ？', 'Your {mimo} is «めっちゃ» (so) cute. Does it talk?')],
      cat: L1('[茶|ちゃ]トラ の [猫|ねこ] ？ あそこ の [箱|はこ] で [寝|ね]て る で 。 ほら 、 [見|み]て みい ！', 'An orange {w.cat}? It’s asleep in that crate over there. Look!'),
      praise: ['ええ やん ！', 'めっちゃ ええ ！', 'さすが や ！'],
      phrases: [
        { id: 'ph.os.nandeyanen', tl: 'なんで やねん ！', en: 'Oh, come on! / Why on earth?!', note: 'The famous Osaka comeback: the straight man’s line in a comedy duo. Say it when someone says something silly.', ex: '[猫|ねこ] が [新聞|しんぶん] [読|よ]んで る ？ なんで やねん ！', exEn: 'The cat is reading the paper? Oh, come on!', ask: 'Your friend says the cat reads the newspaper. React the Osaka way: “Oh, come on!”', keys: ['なんでやねん', 'nandeyanen'] },
        { id: 'ph.os.meccha', tl: 'めっちゃ', en: 'super, really', note: 'Osaka’s “very”, now heard all over Japan: «めっちゃ うまい» = super tasty.', ex: 'この たこやき 、 めっちゃ うまい ！', exEn: 'These takoyaki are super tasty!', ask: 'How would someone from Osaka say “super” (super tasty)?', keys: ['めっちゃ', 'meccha', 'metcha', 'mettya'] },
        { id: 'ph.os.honma', tl: 'ほんま', en: 'really, for real', note: 'Osaka for «[本当|ほんとう]» (really). «ほんま ？» = really? «ほんま に» = for real.', ex: 'ほんま に ？ [信|しん]じられへん ！', exEn: 'For real? I can’t believe it!', ask: 'How does someone from Osaka say “really?”', keys: ['ほんま', 'honma'] },
        { id: 'ph.os.akan', tl: 'あかん', en: 'no good, don’t', note: 'Osaka’s “no good!” and “don’t!”: «それ は あかん» = that’s no good.', ex: 'あかん 、 [遅刻|ちこく] や ！', exEn: 'Oh no, I’m late!', ask: 'Something’s no good. Say it the Osaka way.', keys: ['あかん', 'akan'] },
        { id: 'ph.os.ookini', tl: 'おおきに', en: 'thank you', note: 'An old Osaka “thanks!”. Shopkeepers still say it: «まいど 、 おおきに ！»', ex: 'おおきに ！ また [来|き]て な ！', exEn: 'Thanks! Come again!', ask: 'Thank someone the old Osaka way.', keys: ['おおきに', 'ookini', 'okini'] },
      ] },
    { id: 'sho', name: 'ショウ', region: { tl: '[博多|はかた]', en: 'Hakata' }, color: '#d9534f', from: 'Hakata, in Fukuoka',
      look: { skin: '#e5bd96', hair: '#1a1410', hairdo: 'long', dress: '#c94a5a', legs: true, pants: '#3a3a5a', shoes: '#5b3a22' },
      hi: L1('なんしよーと ？ ほら 、 ここ [座|すわ]らんね ！', '«なんしよーと ？» (what’re you up to?) Come on, sit here!'),
      start: L1('よか よ 、 [博多弁|はかたべん] [教|おし]えちゃる けん 。 ばり [簡単|かんたん] よ ！', '«よか よ» (sure), I’ll teach you Hakata dialect. It’s «ばり» (super) easy!'),
      quiz: L1('[次|つぎ] は あんた の [番|ばん] たい 。 [覚|おぼ]えとる ？', 'Now it’s your turn. Remember?'),
      win: L1('ばり よか ！ もう [博多|はかた] の [人|ひと] たい ！', '«ばり よか» (super good)! You’re a Hakata local now!'),
      ok: L1('よか よか 。 [練習|れんしゅう] すれば [大丈夫|だいじょうぶ] けん 。', '«よか よか» (no worries). Practice and you’ll be fine.'),
      later: L1('また [来|き]んしゃい ！', 'Come again («[来|き]んしゃい»)!'),
      chat: [L1('[博多|はかた] の ラーメン は ばり うまか よ 。 [食|た]べた こと ある と ？', 'Hakata ramen is «ばり うまか» (super tasty). Ever had it?'),
        L1('[静寂|せいじゃく] は [怖|こわ]か けど 、 しゃべれば よか と よ 。', 'The Hush is «[怖|こわ]か» (scary), but all you have to do is talk.'),
        L1('あんた の {mimo} 、 ばり かわいか ね 。', 'Your {mimo} is «ばり かわいか» (super cute).')],
      cat: L1('[茶|ちゃ]トラ の [猫|ねこ] ？ あそこ の [箱|はこ] で [寝|ね]とる よ 。', 'An orange {w.cat}? It’s «[寝|ね]とる» (sleeping) in that crate over there.'),
      praise: ['よか ！', 'ばり よか ！', 'よか よか ！'],
      phrases: [
        { id: 'ph.hk.yoka', tl: 'よか', en: 'good, fine', note: 'Hakata for «いい» (good). «よか よか» = it’s fine, no worries.', ex: 'この [天気|てんき] 、 よか ね 。', exEn: 'Nice weather, huh?', ask: 'How do people in Hakata say “good”?', keys: ['よか', 'yoka'] },
        { id: 'ph.hk.bari', tl: 'ばり', en: 'super, very', note: 'Hakata’s “very”: «ばり うまか» = super tasty. Osaka says «めっちゃ», Hakata says «ばり».', ex: 'この ラーメン 、 ばり うまか ！', exEn: 'This ramen is super tasty!', ask: 'How do people in Hakata say “super” (super tasty)?', keys: ['ばり', 'bari'] },
        { id: 'ph.hk.nanshiyoto', tl: 'なんしよーと ？', en: 'What are you up to?', note: 'Hakata for «[何|なに] して る の ？» (what are you doing?). A friendly hello, too.', ex: 'おー 、 なんしよーと ？', exEn: 'Hey, what are you up to?', ask: 'Ask a friend “What are you up to?” the Hakata way.', keys: ['なんしよ', 'nanshiyo', 'nansiyo'] },
        { id: 'ph.hk.ken', tl: 'けん', en: 'because, so', note: 'Hakata (and much of western Japan) for «から» (because): «[雨|あめ] けん 、 [行|い]かん» = it’s raining, so I’m not going.', ex: '[雨|あめ] けん 、 [家|いえ] に おる 。', exEn: 'It’s raining, so I’m staying home.', ask: 'In Hakata, which little word means “because”?', keys: ['けん', 'ken'] },
        { id: 'ph.hk.umaka', tl: 'うまか', en: 'tasty', note: 'In Kyushu, adjectives can end in «か» instead of «い»: «うまい» → «うまか», «かわいい» → «かわいか».', ex: 'この [明太子|めんたいこ] 、 うまか ！', exEn: 'This spicy cod roe is tasty!', ask: 'How do people in Hakata say “tasty”?', keys: ['うまか', 'umaka'] },
      ] },
    { id: 'kai', name: 'カイ', region: { tl: '[沖縄|おきなわ]', en: 'Okinawa' }, color: '#2fa3a0', from: 'Okinawa',
      look: { skin: '#c99266', hair: '#1a1410', hairdo: 'curly', dress: '#2fa3a0', legs: true, pants: '#f0e6d2', shoes: '#8a5f3e', hat: 'straw', hatColor: '#e8d29a' },
      hi: L1('はいさい ！ めんそーれ 。 ゆっくり してって ね 。', '«はいさい» (hi)! «めんそーれ» (welcome). Make yourself at home.'),
      start: L1('よし 、 [沖縄|おきなわ] の [言葉|ことば] を [教|おし]える さ 。 でーじ [楽|たの]しい よ ！', 'OK, I’ll teach you some Okinawan words. It’s «でーじ» (super) fun!'),
      quiz: L1('じゃあ 、 [次|つぎ] は あなた の [番|ばん] さ 。', 'OK, now it’s your turn.'),
      win: L1('でーじ じょうとー ！ もう りっぱ な うちなーんちゅ さ ！', '«でーじ じょうとー» (super great)! You’re a real «うちなーんちゅ» (Okinawan) now!'),
      ok: L1('なんくるないさ ！ [練習|れんしゅう] すれば [大丈夫|だいじょうぶ] 。', '«なんくるないさ» (it’ll work out)! Practice and you’ll be fine.'),
      later: L1('また ね 。 ちばりよー ！', 'See you. «ちばりよー» (hang in there)!'),
      chat: [L1('[沖縄|おきなわ] の [海|うみ] は でーじ きれい さ 。 いつか [見|み] に おいで 。', 'Okinawa’s sea is «でーじ» (super) beautiful. Come see it someday.'),
        L1('[静寂|せいじゃく] ？ なんくるないさ 。 みんな で しゃべれば [大丈夫|だいじょうぶ] 。', 'The Hush? «なんくるないさ» (it’ll be OK). If we all talk, we’ll be fine.'),
        L1('あなた の {mimo} 、 でーじ かわいい ね 。', 'Your {mimo} is «でーじ» (super) cute.')],
      cat: L1('[茶|ちゃ]トラ の [猫|ねこ] ？ そこ の [箱|はこ] で すやすや [寝|ね]て る さ 。', 'An orange {w.cat}? It’s sleeping «すやすや» (soundly) in that crate there.'),
      praise: ['じょうとー ！', 'でーじ いい ！', 'さすが ！'],
      phrases: [
        { id: 'ph.ok.mensore', tl: 'めんそーれ', en: 'welcome', note: 'Okinawa’s “welcome!”. You see it at the airport and on shop signs.', ex: 'めんそーれ 、 [沖縄|おきなわ] へ ！', exEn: 'Welcome to Okinawa!', ask: 'Welcome a guest the Okinawan way.', keys: ['めんそーれ', 'mensore', 'mensoore'] },
        { id: 'ph.ok.nankuru', tl: 'なんくるないさ', en: 'it’ll all work out', note: 'Okinawa’s famous motto: don’t worry, it’ll be fine (as long as you do your part).', ex: '[雨|あめ] でも 、 なんくるないさ 。', exEn: 'Rain? It’ll all work out.', ask: 'Your friend is worried. Tell them “it’ll all work out”, Okinawan style.', keys: ['なんくるない', 'nankurunai'] },
        { id: 'ph.ok.haisai', tl: 'はいさい', en: 'hi, hello', note: 'An Okinawan “hello!”. You’ll also hear «はいたい».', ex: 'はいさい ！ [元気|げんき] ？', exEn: 'Hi! How are you?', ask: 'Say “hi” the Okinawan way.', keys: ['はいさい', 'haisai', 'はいたい', 'haitai'] },
        { id: 'ph.ok.nifee', tl: 'にふぇーでーびる', en: 'thank you', note: 'Okinawan for «ありがとう» (thank you). A mouthful… «にふぇー» for short.', ex: 'にふぇーでーびる 。 また ね ！', exEn: 'Thank you. See you!', ask: 'Thank someone in Okinawan.', keys: ['にふぇー', 'nifee', 'nife'] },
        { id: 'ph.ok.deeji', tl: 'でーじ', en: 'super, very', note: 'Okinawa’s “very”: «でーじ おいしい» = super tasty. Osaka says «めっちゃ», Hakata «ばり», Okinawa «でーじ».', ex: 'この [海|うみ] 、 でーじ きれい ！', exEn: 'This sea is super beautiful!', ask: 'How do Okinawans say “super” (super pretty)?', keys: ['でーじ', 'deeji', 'deji'] },
      ] },
  ];
  CJ.forEach(l => SMOKERS[l].forEach(sm => asCJK(l, sm)));
  Object.assign(GROUP, {
    zh: L1('[我们|wǒ men] [仨|sā] [说话|shuō huà] [各|gè] [有|yǒu] [各|gè] [的|de] [味儿|wèi r] 。 [想|xiǎng] [学|xué] [啥|shá] [就|jiù] [问|wèn] ！', 'The three of us each talk our own way. Ask whatever you want to learn!'),
    ja: L1('おれら 、 みんな [出身|しゅっしん] が ちがう ねん 。 なんでも [聞|き]いて や ！', 'We’re all from different places. Ask us anything!'),
  });
  Object.assign(BANTER, {
    dapeng: [[1, L1('[北京话|Běi jīng huà] [还|hái] [行|xíng] … [可|kě] [最|zuì] [巴适|bā shì] [的|de] [还是|hái shi] [四川话|Sì chuān huà] ！', 'Beijing talk is OK… but the most «[巴适|bā shì]» (great) is still Sichuan talk!')],
      [2, L1('[拉倒|lā dǎo] [吧|ba] ！ [东北话|Dōng běi huà] [贼|zéi] [好听|hǎo tīng] ， [全国|quán guó] [都|dōu] [爱|ài] [学|xué] ！', 'Oh, come off it! Northeast talk sounds «[贼|zéi]» (super) good. The whole country loves it!')],
      [0, L1('[得|dé] [得|dé] [得|dé] ， [你们|nǐ men] [俩|liǎ] [别|bié] [贫|pín] [了|le] 。', 'OK, OK, OK. You two, quit «[贫|pín]» (yakking).')]],
    ajie: [[0, L1('“ [摆|bǎi] [龙门阵|lóng mén zhèn] ” ？ [我们|wǒ men] [北京|Běi jīng] [叫|jiào] “ [侃|kǎn] [大山|dà shān] ” ！', '«[摆龙门阵|bǎi lóng mén zhèn]»? In Beijing we say «[侃大山|kǎn dà shān]»!')],
      [2, L1('[我们|wǒ men] [东北|Dōng běi] [就|jiù] [说|shuō] “ [唠嗑|lào kē] ” ， [多|duō] [简单|jiǎn dān] ！', 'In the Northeast we just say «[唠嗑|lào kē]». So simple!')],
      [1, L1('[三|sān] [种|zhǒng] [说法|shuō fǎ] ， [一个|yī gè] [意思|yì si] 。 [都|dōu] [要得|yào dé] ！', 'Three ways to say it, one meaning. All «[要得|yào dé]» (fine)!')]],
    tiezhu: [[1, L1('[零下|líng xià] [三十|sān shí] [度|dù] ？ [莫得|mò de] [火锅|huǒ guō] ， [怎么|zěn me] [活|huó] [嘛|ma] ？', 'Thirty below? How do you survive «[莫得|mò de]» (without) hotpot?')],
      [0, L1('[北京|Běi jīng] [冬天|dōng tiān] [也|yě] [冷|lěng] ， [可|kě] [没|méi] [那么|nà me] [邪乎|xié hu] 。', 'Beijing winters are cold too, but not that «[邪乎|xié hu]» (crazy).')],
      [2, L1('[嗨|hāi] ， [冷|lěng] [才|cái] [带劲儿|dài jìn r] [呢|ne] ！', 'Pfft, the cold is what makes it «[带劲儿|dài jìn r]» (awesome)!')]],
    masa: [[1, L1('[大阪弁|おおさかべん] も よか けど 、 [博多弁|はかたべん] が いちばん かわいか よ 。', 'Osaka dialect is «よか» (fine), but Hakata dialect is the cutest.')],
      [2, L1('いやいや 、 [沖縄|おきなわ] の [言葉|ことば] が でーじ いい さ 。', 'No, no, Okinawan words are «でーじ» (super) nice.')],
      [0, L1('なんで やねん ！ [二人|ふたり] とも わかってへん な 。', '«なんで やねん» (oh, come on)! You two don’t get it.')]],
    sho: [[0, L1('「 ばり 」 ？ [大阪|おおさか] は 「 めっちゃ 」 や で ！', '«ばり»? In Osaka it’s «めっちゃ»!')],
      [2, L1('[沖縄|おきなわ] は 「 でーじ 」 さ 。', 'In Okinawa it’s «でーじ».')],
      [1, L1('[三|みっ]つ とも 「 すごく 」 って こと たい 。', 'All three just mean “very”.')]],
    kai: [[1, L1('なんくるないさ 、 よか [言葉|ことば] たい 。', '«なんくるないさ» is a «よか» (good) phrase.')],
      [0, L1('せやな 。 [大阪|おおさか] でも [使|つか]おう かな 。', '«せやな» (true). Maybe I’ll use it in Osaka too.')],
      [2, L1('どうぞ どうぞ 。 めんそーれ ！', 'Go right ahead. «めんそーれ» (welcome)!')]],
  });
  SWEARER.zh = asCJK('zh', { name: '[老|Lǎo] [高|Gāo]', look: { skin: '#d9a77a', hair: '#f4f1ea', hairdo: 'bald', beard: true, dress: '#2f4f7a', legs: true, pants: '#4a3a33', shoes: '#2b2235', hat: 'captain', hatColor: '#2f3b5a', h: 1.0, w: 1.12 },
    hi: [L1('[哎哟|āi yō] ！ [这|zhè] [破|pò] [轮子|lún zi] [又|yòu] [掉|diào] [了|le] ！', '«[哎哟|āi yō]» (ouch)! This «[破|pò]» (darn) wheel fell off again!'), L1('[看|kàn] [啥|shá] [看|kàn] ？ [该死|gāi sǐ] ， [我|wǒ] [的|de] [手指|shǒu zhǐ] ！', 'What are you looking at? «[该死|gāi sǐ]» (dammit), my finger!')],
    intro: L1('[我|wǒ] [当|dāng] [了|le] [四十|sì shí] [年|nián] [水手|shuǐ shǒu] 。 [每|měi] [到|dào] [一|yī] [个|gè] [港口|gǎng kǒu] ， [就|jiù] [学|xué] [一|yī] [句|jù] [新|xīn] [的|de] [骂人话|mà rén huà] 。 [哈|hā] ！', 'I was a sailor for forty years. In every port I learned a new swear word. Ha!'),
    offer: L1('[想|xiǎng] [学|xué] [骂人话|mà rén huà] [吗|ma] ？ [我|wǒ] [教|jiāo] [你|nǐ] … [不过|bù guò] [要|yào] [小心|xiǎo xīn] [啊|a] ！', 'Want to learn some swear words? I’ll teach you… but carefully, eh?'),
    grumble: [L1('[哎呀|āi yā] ， [又|yòu] [是|shì] [你|nǐ] ！ [好|hǎo] ， [好|hǎo] ！', '«[哎呀|āi yā]» (oh my), you again! Good, good!'), L1('[见鬼|jiàn guǐ] ！ [轮子|lún zi] … [又|yòu] [掉|diào] [了|le] ！', '«[见鬼|jiàn guǐ]» (damn it)! The wheel… again!'),
      L1('[热|rè] [死|sǐ] [了|le] ！ [你|nǐ] [能|néng] [去|qù] [小卖部|xiǎo mài bù] [给|gěi] [我|wǒ] [买|mǎi] [瓶|píng] {w.soda} [吗|ma] ？', 'It’s «[热死了|rè sǐ le]» (boiling)! Could you get me a {w.soda} from the corner store?')],
    why: L1('[我|wǒ] [生气|shēng qì] ？ [没有|méi yǒu] ！ [我|wǒ] [就|jiù] [这么|zhè me] [说话|shuō huà] 。 [寂静|Jì jìng] [最|zuì] [讨厌|tǎo yàn] [骂人话|mà rén huà] 。 [谁|shéi] [也|yě] [别|bié] [想|xiǎng] [让|ràng] [我|wǒ] [闭嘴|bì zuǐ] ！', 'Me, angry? No! That’s just how I talk. The Hush hates swearing. Nobody shuts ME up!'),
    lesson: [L1('[先|xiān] [学|xué] [轻|qīng] [的|de] 。 [这些|zhè xiē] [在|zài] [哪儿|nǎ r] [说|shuō] [都|dōu] [行|xíng] 。', 'First the mild ones. You can say these almost anywhere.'),
      L1('[现在|xiàn zài] [学|xué] [重|zhòng] [的|de] 。 [小心|xiǎo xīn] ： [在|zài] [学校|xué xiào] [可|kě] [不能|bù néng] [说|shuō] 。', 'Now the strong ones. Careful: not at school.'),
      L1('[最后|zuì hòu] … [最|zuì] [重|zhòng] [的|de] 。 [几乎|jī hū] [永远|yǒng yuǎn] [别|bié] [说|shuō] ， [在|zài] [奶奶|nǎi nai] [面前|miàn qián] [更|gèng] [不|bù] [行|xíng] ！', 'And last… the strongest ones. Hardly ever, and never in front of your grandma!')],
    end: L1('[很|hěn] [好|hǎo] ！ [你|nǐ] [学会|xué huì] [了|le] 。 [记住|jì zhù] ： [别|bié] [在|zài] [奶奶|nǎi nai] [面前|miàn qián] [说|shuō] ！', 'Very good! Now you know. Remember: never in front of your grandma!'),
    done: L1('[我|wǒ] [会|huì] [的|de] [你|nǐ] [都|dōu] [会|huì] [了|le] 。 [去|qù] [吧|ba] ， [大声|dà shēng] [说话|shuō huà] ！', 'Now you know everything I know. Go on, speak up!'),
    bleep: L1('[这|zhè] [嘀嘀|dī dī] [声|shēng] [是|shì] [什么|shén me] ？ [你|nǐ] [开|kāi] [了|le] [消音|xiāo yīn] ？ [哼|hēng] ！ [那|nà] [我|wǒ] [只|zhǐ] [教|jiāo] [你|nǐ] [轻|qīng] [的|de] 。', 'What’s that beeping? You’ve got the bleeper on? Hmph! Then I’ll only teach you the mild ones.'),
    right: L1('[对|duì] [了|le] ！ [就|jiù] [这么|zhè me] [说|shuō] ！', 'That’s right! That’s the way to say it!'), wrong: L1('[不|bù] [对|duì] ！ [哎呀|āi yā] ， [好好|hǎo hǎo] [听|tīng] ：', 'Wrong! Oh my, listen carefully:'),
    cat: L1('[橘猫|jú māo] ？ [那|nà] [只|zhī] [臭|chòu] [猫|māo] [偷|tōu] [了|le] [我|wǒ] [一|yī] [个|gè] [萝卜|luó bo] ， [往|wǎng] [西门|xī mén] [跑|pǎo] [了|le] ！', 'An orange {w.cat}? That «[臭猫|chòu māo]» (pesky cat) stole one of my turnips and ran toward the west gate!'),
    grandmaC: '[奶奶|nǎi nai]', insultQC: '[混蛋|hún dàn]',
    get grandma() { return plainL(this.grandmaC, 'zh'); }, get insultQ() { return plainL(this.insultQC, 'zh'); },
    items: [
      { id: 'ph.sw.zh.aiya', tl: '[哎呀|āi yā] ！', en: 'Oh no! / Oops!', s: 0, note: 'The everyday “oh no!”. Fine anywhere, even in front of your grandma.', keys: ['哎呀', 'aiya'] },
      { id: 'ph.sw.zh.zaogao', tl: '[糟糕|zāo gāo] ！', en: 'Oh dear! / Darn!', s: 0, note: 'When something goes wrong. Harmless: kids say it, teachers say it.', keys: ['糟糕', 'zaogao'] },
      { id: 'ph.sw.zh.daomei', tl: '[真|zhēn] [倒霉|dǎo méi] ！', en: 'Just my luck!', s: 0, note: '«[倒霉|dǎo méi]» = bad luck. For a dropped ice cream or a wheel that falls off. Fine anywhere.', keys: ['倒霉', 'daomei'] },
      { id: 'ph.sw.zh.kewu', tl: '[可恶|kě wù] ！', en: 'Curses! / Damn it!', s: 1, note: 'Angry and annoyed, like in every TV drama. A bit rude: not at school, not in front of your grandma.', keys: ['可恶', 'kewu'] },
      { id: 'ph.sw.zh.jiangui', tl: '[见鬼|jiàn guǐ] ！', en: 'Damn it! / What the heck!', s: 1, note: 'Word for word: “see a ghost!”. For when things go wrong, or something weird happens. Not polite.', keys: ['见鬼', 'jiangui'] },
      { id: 'ph.sw.zh.gaisi', tl: '[该死|gāi sǐ] ！', en: 'Damn it!', s: 1, note: 'An angry “damn it!”, said at things: the wheel, the rain. Rude: not with teachers or grandma.', keys: ['该死', 'gaisi'] },
      { id: 'ph.sw.zh.qunide', tl: '[去|qù] [你|nǐ] [的|de] ！', en: 'Get lost! / Forget you!', s: 2, note: 'Very rude when said at someone. Old friends sometimes say it as a joke, but never to strangers or to grandma.', keys: ['去你的', 'qunide'] },
      { id: 'ph.sw.zh.hundan', tl: '[混蛋|hún dàn]', en: 'jerk (an insult)', s: 2, insult: true, note: 'An insult! Never call anyone this. Know it, so you know when someone’s being rude.', keys: ['混蛋', 'hundan'] },
    ] });
  SWEARER.ja = asCJK('ja', { name: 'ゲン さん', look: { skin: '#e0b48a', hair: '#f4f1ea', hairdo: 'bald', stache: true, dress: '#24466e', legs: true, pants: '#f4f1ea', shoes: '#2b2235', hat: 'captain', hatColor: '#f4f1ea', h: 1.0, w: 1.12 },
    hi: [L1('ちくしょう ！ また [車輪|しゃりん] が [外|はず]れやがった ！', '«ちくしょう» (dammit)! The darn wheel came off again!'), L1('[何|なに] [見|み]てん だ ？ くそっ 、 [指|ゆび] が ！', 'What are you staring at? «くそっ» (damn), my finger!')],
    intro: L1('おれ は [四十年|よんじゅうねん] 、 [船乗|ふなの]り を やって た 。 [港|みなと] ごと に [新|あたら]しい [悪口|わるぐち] を [覚|おぼ]えた もん だ 。 がっはっは ！', 'I was a sailor for forty years. In every port I picked up a new swear word. Ha ha ha!'),
    offer: L1('[悪口|わるぐち] 、 [覚|おぼ]えたい か ？ [教|おし]えて やる … ただし 、 [気|き] を つけろ よ ？', 'Want to learn some swear words? I’ll teach you… but carefully, got it?'),
    grumble: [L1('あちゃー 、 また おまえ か ！ よく [来|き]た な ！', '«あちゃー» (oh boy), you again! Good to see you!'), L1('くそっ ！ [車輪|しゃりん] が … また か よ ！', '«くそっ» (damn)! The wheel… again!'),
      L1('あー 、 [暑|あつ]い ！ [売店|ばいてん] で {w.soda} 、 [買|か]って きて くれねえ か ？', 'Argh, it’s hot! Could you get me a {w.soda} from the corner store?')],
    why: L1('[怒|おこ]って る だと ？ ちがう ちがう ！ これ が おれ の しゃべりかた だ 。 [静寂|せいじゃく] は [悪口|わるぐち] が [大嫌|だいきら]い なん だ 。 おれ を だまらせる やつ なんか いねえ ！', 'Me, angry? No, no! That’s just how I talk. The Hush hates swearing. Nobody shuts ME up!'),
    lesson: [L1('まず は [軽|かる]い の から だ 。 これ は だいたい どこ でも [言|い]える 。', 'First the mild ones. You can say these almost anywhere.'),
      L1('[次|つぎ] は [強|つよ]い の だ 。 [気|き] を つけろ 、 [学校|がっこう] で は [言|い]う な よ 。', 'Now the strong ones. Careful: don’t say these at school.'),
      L1('[最後|さいご] は … いちばん [強|つよ]い やつ だ 。 めった に [言|い]う な 。 ばあちゃん の [前|まえ] で は [絶対|ぜったい] だめ だ ぞ ！', 'And last… the strongest ones. Hardly ever. And never in front of your grandma!')],
    end: L1('よし ！ これ で わかった な 。 [覚|おぼ]えとけ よ 、 ばあちゃん の [前|まえ] で は [言|い]う な 。', 'Good! Now you know. And remember: never in front of your grandma.'),
    done: L1('おれ の [知|し]って る こと は 、 [全部|ぜんぶ] [教|おし]えた 。 さあ 、 [行|い]って 、 [大|おお]きな [声|こえ] で しゃべれ ！', 'Now you know everything I know. Go on and speak up!'),
    bleep: L1('なんだ 、 この ピー って [音|おと] は ？ ピー を つけて る の か ？ ちぇっ ！ じゃあ 、 [軽|かる]い の だけ [教|おし]えて やる 。', 'What’s that beeping? You’ve got the bleeper on? Tch! Then I’ll only teach you the mild ones.'),
    right: L1('そう だ ！ それ で いい ！', 'That’s it! That’s the way to talk!'), wrong: L1('ちがう ！ あちゃー 、 よく [聞|き]け ：', 'Wrong! Oh boy, listen carefully:'),
    cat: L1('[茶|ちゃ]トラ の [猫|ねこ] ？ あの [野郎|やろう] 、 おれ の かぶ を [盗|ぬす]んで 、 [西門|にしもん] の ほう へ [逃|に]げた ぞ ！', 'An orange {w.cat}? That «[野郎|やろう]» (rascal) stole one of my turnips and ran off toward the west gate!'),
    grandmaC: 'おばあちゃん', insultQC: 'ばかやろう',
    get grandma() { return plainL(this.grandmaC, 'ja'); }, get insultQ() { return plainL(this.insultQC, 'ja'); },
    items: [
      { id: 'ph.sw.ja.acha', tl: 'あちゃー ！', en: 'Oops! / Oh boy!', s: 0, note: 'A harmless “oops!”. Fine anywhere, even with your grandma.', keys: ['あちゃ', 'acha'] },
      { id: 'ph.sw.ja.shimatta', tl: 'しまった ！', en: 'Oh no! / Darn it!', s: 0, note: 'When you’ve just made a mistake. Fine anywhere.', keys: ['しまった', 'shimatta', 'simatta'] },
      { id: 'ph.sw.ja.mou', tl: 'もう ！', en: 'Ugh! / Come on!', s: 0, note: 'Fed up, but sweetly: kids, teachers and grandmas all say it.', keys: ['もう', 'mou'] },
      { id: 'ph.sw.ja.kuso', tl: 'くそっ ！', en: 'Damn! / Crap!', s: 1, note: 'Japan’s classic “damn!”, heard in every anime fight. Rude: not at school, not with your boss or grandma.', keys: ['くそ', 'kuso'] },
      { id: 'ph.sw.ja.chikusho', tl: 'ちくしょう ！', en: 'Dammit!', s: 1, note: 'An angry “dammit!”, for when the wheel falls off. Not polite.', keys: ['ちくしょ', 'chikusho', 'tikusyo'] },
      { id: 'ph.sw.ja.fuzakeruna', tl: 'ふざける な ！', en: 'Knock it off! / Don’t mess with me!', s: 1, note: 'Angry and loud, and aimed at someone, so it starts fights. Save it for really bad days.', keys: ['ふざけるな', 'fuzakeruna'] },
      { id: 'ph.sw.ja.konoyaro', tl: 'この やろう ！', en: 'Why, you…!', s: 2, note: 'Very strong when you say it to someone. Fine in action movies… never at a real person.', keys: ['このやろ', 'konoyaro'] },
      { id: 'ph.sw.ja.bakayaro', tl: 'ばかやろう', en: 'you idiot, you jerk (an insult)', s: 2, insult: true, note: 'An insult! Never call anyone this. Know it, so you know when someone’s being rude.', keys: ['ばかやろ', 'bakayaro'] },
    ] });
  // everyone else in zh / ja: names, the goods, the stores, the lines, the paper (merged into the tables above)
  const NAMES_CJK = {
    keeper_alba: Z('[刘|Liú] [阿姨|ā yí]', 'ヨシエ さん'), keeper_molinar: Z('[小|Xiǎo] [周|Zhōu]', 'ケンタ'), keeper_remanso: Z('[何|Hé] [奶奶|nǎi nai]', 'ハル さん'),
    paper: Z('[老|Lǎo] [张|Zhāng]', 'ゴロウ さん'), gossipA: Z('[李|Lǐ] [阿姨|ā yí]', 'サチコ'), gossipB: Z('[赵|Zhào] [阿姨|ā yí]', 'ミツコ'),
    paloma: Z('[小雨|Xiǎo yǔ]', 'ユイ'), michi: Z('[橘子|Jú zi]', 'ミカン'), kid: Z('[豆豆|Dòu dou]', 'ソウタ'),
    dom0: Z('[钱|Qián] [大爷|dà ye]', 'ジロウ'), dom1: Z('[孙|Sūn] [大爷|dà ye]', 'サブロウ'), dom2: Z('[冯|Féng] [大爷|dà ye]', 'ヘイキチ'),
    sweeper: Z('[马|Mǎ] [阿姨|ā yí]', 'フミ さん'), walker: Z('[小刚|Xiǎo gāng]', 'リョウ'), dog: Z('[旺财|Wàng cái]', 'ポチ'),
    vale: Z('[晓晓|Xiǎo xiao]', 'アオイ'), shy: Z('[阿|Ā] [文|Wén]', 'ユウキ'),
  };
  for (const [k, v] of Object.entries(NAMES_CJK)) if (NAMES[k]) Object.assign(NAMES[k], v);
  // (the names and places, so rōmaji capitalizes them: «Yoshie-san», «Sōta», «Ōsaka», «Hakataben»)
  const JA_NAMES = 'ヨシエ ケンタ ハル ゴロウ サチコ ミツコ ユイ ミカン ソウタ ジロウ サブロウ ヘイキチ フミ リョウ ポチ アオイ ユウキ マサ ショウ カイ ゲン 大阪 博多 沖縄 大阪弁 博多弁 大阪人'.split(' ');
  // the goods: [zh, ja, zh measure word, ja counter, { zh: [alternatives], ja: [...] }]
  const WORDS_CJK = {
    'w.juice': ['[果汁|guǒ zhī]', 'ジュース', '[杯|bēi]', '[本|ほん]'], 'w.soda': ['[汽水|qì shuǐ]', 'ソーダ', '[瓶|píng]', '[本|ほん]', { ja: ['サイダー'] }],
    'w.icecream': ['[冰淇淋|bīng qí lín]', 'アイス', '[个|gè]', '[個|こ]', { zh: ['[冰激凌|bīng jī líng]', '[雪糕|xuě gāo]'], ja: ['アイスクリーム', 'ソフトクリーム'] }],
    'w.candy': ['[糖|táng]', '[飴|あめ]', '[颗|kē]', '[個|こ]', { zh: ['[糖果|táng guǒ]'], ja: ['キャンディー', 'キャンディ'] }],
    'w.chocolate': ['[巧克力|qiǎo kè lì]', 'チョコレート', '[块|kuài]', '[枚|まい]', { ja: ['チョコ'] }], 'w.gum': ['[口香糖|kǒu xiāng táng]', 'ガム', '[包|bāo]', '[個|こ]'],
    'w.newspaper': ['[报纸|bào zhǐ]', '[新聞|しんぶん]', '[份|fèn]', '[部|ぶ]'], 'w.cat': ['[猫|māo]', '[猫|ねこ]', '[只|zhī]', '[匹|ひき]', { ja: ['ネコ', 'にゃんこ'] }],
    'w.kite': ['[风筝|fēng zheng]', '[凧|たこ]', '[只|zhī]', '[枚|まい]'],
  };
  const cjkWord = (w, c) => {
    for (const [i, l] of CJ.entries()) { if (!w[l]) w[l] = c[i]; w.cl = w.cl || {}; if (!w.cl[l]) w.cl[l] = c[2 + i]; w.pl = w.pl || {}; if (!w.pl[l]) w.pl[l] = c[i]; }
    if (c[4]) { w.alt = w.alt || {}; for (const l of CJ) if (c[4][l]) w.alt[l] = Array.from(new Set([...(w.alt[l] || []), ...c[4][l]])); }
  };
  WORDS.forEach(w => { if (WORDS_CJK[w.id]) cjkWord(w, WORDS_CJK[w.id]); });
  // (the stores' own zh / ja, STORE_NAME, WHERE_ST and WELCOME, are up with the shop: shop.js parseCJ)
  // the lines (LT keys; merged at init, after the last LT line is in)
  const LT_CJK = {
    'tl.store.alba.hi': Z('[欢迎|huān yíng] [光临|guāng lín] ！ [我|wǒ] [这儿|zhè r] [啥|shá] [都|dōu] [有|yǒu] … [八卦|bā guà] [还|hái] [免费|miǎn fèi] ！', 'いらっしゃい ！ うち は [何|なん] でも ある よ … [噂話|うわさばなし] は ただ ！'),
    'tl.store.molinar.hi': Z('[你好|nǐ hǎo] ！ [啊|a] … [不好意思|bù hǎo yì si] 。 [我|wǒ] [整|zhěng] [夜|yè] [上班|shàng bān] ， [觉|jiào] [都|dōu] [不够|bù gòu] [睡|shuì] 。', 'いらっしゃい … ふぁぁ … すみません 。 [一晩中|ひとばんじゅう] [働|はたら]いて 、 ほとんど [寝|ね]て ない ん です 。'),
    'tl.store.remanso.hi': Z('[你好|nǐ hǎo] ， [孩子|hái zi] ！ [静水村|Jìng shuǐ cūn] [好|hǎo] [热|rè] 。 [来|lái] [个|gè] {w.icecream} ， [什么|shén me] [都|dōu] [好|hǎo] [了|le] ！', 'あら 、 いらっしゃい ！ レマンソ は [暑|あつ]い ねえ 。 {w.icecream} を [食|た]べれば 、 [元気|げんき] [百倍|ひゃくばい] よ ！'),
    'tl.parcel.ask': Z('[你|nǐ] [要|yào] [去|qù] [磨坊镇|Mò fáng zhèn] ？ [太|tài] [巧|qiǎo] [了|le] ！ [帮|bāng] [我|wǒ] [把|bǎ] [这|zhè] [个|gè] [包裹|bāo guǒ] [带|dài] [给|gěi] {dom0} [好|hǎo] [吗|ma] ？ [他|tā] [在|zài] [大磨坊|Dà mò fáng] [旁边|páng biān] [玩|wán] [多米诺|duō mǐ nuò] [骨牌|gǔ pái] 。',
      'モリナール に [行|い]く の ？ ちょうど よかった ！ この [小包|こづつみ] 、 {dom0} さん に [届|とど]けて くれる ？ [大風車|だいふうしゃ] の [近|ちか]く で ドミノ を して る の 。'),
    'tl.parcel.ask2': Z('[不过|bù guò] [注意|zhù yì] ： [他|tā] [总是|zǒng shì] [跟|gēn] [两|liǎng] [个|gè] [朋友|péng you] [一起|yī qǐ] [玩|wán] 。 [你|nǐ] [得|děi] [按|àn] [名字|míng zi] [问|wèn] ！', 'でも 、 [気|き] を つけて 。 いつも [友達|ともだち] [二人|ふたり] と [遊|あそ]んで る の 。 [名前|なまえ] で [聞|き]いて ね ！'),
    'tl.dom.0': Z('[嘘|xū] ！ [我们|wǒ men] [正|zhèng] [玩|wán] [多米诺|duō mǐ nuò] [呢|ne] 。', 'しーっ ！ [今|いま] 、 ドミノ の [最中|さいちゅう] じゃ 。'),
    'tl.dom.1': Z('[赢|yíng] [了|le] ！ … [不|bù] [对|duì] ， [还|hái] [没|méi] [呢|ne] 。', '[上|あ]がり じゃ ！ … いや 、 まだ じゃった 。'),
    'tl.dom.2': Z('[我们|wǒ men] [在|zài] [这儿|zhè r] [玩|wán] [了|le] [四十|sì shí] [年|nián] [了|le] 。', 'わしら は ここ で [四十年|よんじゅうねん] も [遊|あそ]んで おる 。'),
    'tl.dom.notme': Z('[我|wǒ] ？ [不|bù] [是|shì] 。 [大家|dà jiā] [叫|jiào] [我|wǒ] {me} 。', 'わし か ？ いや 、 わし は {me} じゃ 。'),
    'tl.dom.huh': Z('[你|nǐ] [找|zhǎo] [谁|shéi] ？ [说|shuō] [名字|míng zi] [呀|ya] 。', '[誰|だれ] を [探|さが]して おる ん じゃ ？ [名前|なまえ] を [言|い]って くれ 。'),
    'tl.dom.me': Z('[是|shì] [我|wǒ] ！ {keeper_alba} [寄|jì] [的|de] [包裹|bāo guǒ] ？ [袜子|wà zi] ！ [她|tā] [知道|zhī dào] [我|wǒ] [总是|zǒng shì] [怕|pà] [冷|lěng] 。', 'わし じゃ ！ {keeper_alba} から の [小包|こづつみ] ？ [靴下|くつした] じゃ ！ わし が [寒|さむ]がり な の を 、 よう [知|し]って おる 。'),
    'tl.dom.thanks': Z('[拿|ná] [着|zhe] ， [路上|lù shang] [用|yòng] 。 [替|tì] [我|wǒ] [谢谢|xiè xie] {keeper_alba} ！', 'ほれ 、 [道中|どうちゅう] の [足|た]し に 。 {keeper_alba} に よろしく [伝|つた]えて くれ ！'),
    'tl.sign.ask': Z('[昨晚|zuó wǎn] [我|wǒ] [写|xiě] [了|le] [块|kuài] [新|xīn] [招牌|zhāo pai] … [凌晨|líng chén] [四|sì] [点|diǎn] [写|xiě] [的|de] 。 [写|xiě] [对|duì] [了|le] [吗|ma] ？ [帮|bāng] [我|wǒ] [看看|kàn kan] [吧|ba] 。',
      'ゆうべ 、 [新|あたら]しい [看板|かんばん] を [書|か]いた ん です … [朝|あさ] の [四時|よじ] に 。 ちゃんと [書|か]けてます か ？ [見|み]て もらえます か ？'),
    'tl.sign.thanks': Z('[哎呀|āi yā] ， [真|zhēn] [丢人|diū rén] ！ [谢谢|xiè xie] ！ [送|sòng] [你|nǐ] [个|gè] {w.icecream} ， [我|wǒ] [请客|qǐng kè] 。', 'うわ 、 [恥|は]ずかしい ！ ありがとう ございます ！ {w.icecream} 、 サービス です 。'),
    'tl.cat.ask': Z('[我|wǒ] [的|de] {w.cat} {michi} [不见|bù jiàn] [了|le] ！ [它|tā] [是|shì] [橘色|jú sè] [的|de] ， [爪子|zhuǎ zi] [是|shì] [白|bái] [的|de] 。 [你|nǐ] [能|néng] [帮|bāng] [我|wǒ] [吗|ma] ？', 'うち の {w.cat} の {michi} が 、 いなくなっちゃった ！ [茶|ちゃ]トラ で 、 [足|あし] が [白|しろ]い の 。 [手伝|てつだ]って くれる ？'),
    'tl.cat.ask2': Z('[问问|wèn wen] [大家|dà jiā] ： “ {model} ”', 'みんな に [聞|き]いて みて ： 「 {model} 」'),
    'tl.cat.wait': Z('[找到|zhǎo dào] {michi} [了|le] [吗|ma] ？ [请|qǐng] [问问|wèn wen] [大家|dà jiā] 。', '{michi} 、 [見|み]つかった ？ みんな に [聞|き]いて みて ね 。'),
    'tl.cat.thanks': Z('{michi} ！ [谢谢|xiè xie] ， [谢谢|xiè xie] ！ [这|zhè] [是|shì] [我|wǒ] [攒|zǎn] [的|de] [零花钱|líng huā qián] 。', '{michi} ！ ありがとう 、 ありがとう ！ これ 、 わたし の おこづかい 。'),
    'tl.cat.look': Z('[你|nǐ] [看|kàn] ， {mimo} ： [这|zhè] [是|shì] {w.cat} 。 {w.cat} ！', '[見|み]て 、 {mimo} ： {w.cat} だ よ 。 {w.cat} ！'),
    'tl.cat.after': Z('{michi} [再|zài] [也|yě] [不|bù] [乱|luàn] [跑|pǎo] [了|le] 。 [好吧|hǎo ba] … [几乎|jī hū] [不|bù] [跑|pǎo] [了|le] 。', '{michi} は もう [逃|に]げない よ 。 まあ … ほとんど ね 。'),
    'tl.cat.paper': Z('[猫|māo] ？ [看见|kàn jiàn] [了|le] ， [一|yī] [只|zhī] [橘猫|jú māo] 。 [往|wǎng] [东门|dōng mén] [跑|pǎo] [了|le] ， [朝|cháo] [推车|tuī chē] [那边|nà biān] 。', '[猫|ねこ] かい ？ ああ 、 [茶|ちゃ]トラ を [見|み]た よ 。 [東門|ひがしもん] の ほう 、 [荷車|にぐるま] の ほう へ [走|はし]って いった 。'),
    'tl.huh': Z('[什么|shén me] ？ [我|wǒ] [没|méi] [听|tīng] [懂|dǒng] 。', 'え ？ よく わからなかった 。'),
    'tl.kite.ask': Z('[我|wǒ] [的|de] {w.kite} [挂|guà] [在|zài] {w.tree} [上|shàng] [了|le] ！ [太|tài] [高|gāo] [了|le] … [我|wǒ] [够|gòu] [不|bù] [着|zháo] ！', 'ぼく の {w.kite} が {w.tree} に [引|ひ]っかかっちゃった ！ [高|たか]すぎて … [届|とど]かない ！'),
    'tl.kite.ask2': Z('[你|nǐ] [的|de] {mimo} [能|néng] [跳|tiào] [得|de] [很|hěn] [高|gāo] [吗|ma] ？', 'きみ の {mimo} 、 [高|たか]く [跳|と]べる ？'),
    'tl.kite.thanks': Z('[我|wǒ] [的|de] {w.kite} ！ [谢谢|xiè xie] ！ [给|gěi] {mimo} [一|yī] [颗|kē] {w.candy} 。', 'ぼく の {w.kite} ！ ありがとう ！ {mimo} に {w.candy} 、 あげる ね 。'),
    'tl.kite.after': Z('[你|nǐ] [看|kàn] [它|tā] [飞|fēi] [得|de] [多|duō] [高|gāo] ！ [磨坊镇|Mò fáng zhèn] [的|de] [风|fēng] [真|zhēn] [大|dà] ！', '[見|み]て 、 すごく [高|たか]く [飛|と]んで る ！ モリナール の [風|かぜ] は [強|つよ]い から ね ！'),
    'tl.shy.ask': Z('[嘘|xū] … [能|néng] [帮|bāng] [我|wǒ] [个|gè] [忙|máng] [吗|ma] ？ [我|wǒ] [想|xiǎng] [请|qǐng] {vale} [吃|chī] {w.icecream} 。 [可是|kě shì] [我|wǒ] [一|yī] [紧张|jǐn zhāng] [就|jiù] [说|shuō] [错|cuò] [话|huà] …',
      'あの … ちょっと [頼|たの]み が ある ん だ けど 。 {vale} を {w.icecream} に [誘|さそ]いたい ん だ 。 でも 、 いつも [言葉|ことば] を [間違|まちが]えちゃって …'),
    'tl.shy.ask2': Z('[你|nǐ] [能|néng] [帮|bāng] [我|wǒ] [写|xiě] [这|zhè] [句|jù] [话|huà] [吗|ma] ？', '[誘|さそ]う [言葉|ことば] 、 [一緒|いっしょ] に [考|かんが]えて くれる ？'),
    'tl.shy.nervous': Z('[呃|è] … [好像|hǎo xiàng] [少|shǎo] [了|le] [点|diǎn] [什么|shén me] 。 {w.icecream} [呢|ne] ？ [问|wèn] [她|tā] [的|de] [话|huà] [呢|ne] ？', 'うーん … [何|なに] か [足|た]りない 。 {w.icecream} は ？ [誘|さそ]う [言葉|ことば] は ？'),
    'tl.shy.before': Z('{vale} [人|rén] [特别|tè bié] [好|hǎo] … [可是|kě shì] [我|wǒ] [一|yī] [见|jiàn] [她|tā] [就|jiù] [紧张|jǐn zhāng] 。', '{vale} は すごく [優|やさ]しい ん だ … でも 、 [緊張|きんちょう] しちゃう ん だ よ 。'),
    'tl.shy.yes': Z('[跟|gēn] [你|nǐ] [一起|yī qǐ] [吃|chī] {w.icecream} ？ [当然|dāng rán] [好|hǎo] [啦|la] ！ … [可是|kě shì] {w.icecream} [是|shì] [我们|wǒ men] [家|jiā] [卖|mài] [的|de] ！ [我|wǒ] [请|qǐng] [你|nǐ] ！', '[一緒|いっしょ] に {w.icecream} ？ もちろん ！ … でも 、 {w.icecream} は うち で [売|う]って る の よ 。 わたし の おごり ！'),
    'tl.shy.after': Z('[她|tā] [答应|dā ying] [了|le] ！ [谢谢|xiè xie] ！ [原来|yuán lái] [也|yě] [没|méi] [那么|nà me] [难|nán] …', 'いい よ って ！ ありがとう ！ [言葉|ことば] って 、 そんな に [難|むずか]しく なかった …'),
    'tl.shy.later': Z('[明天|míng tiān] [我们|wǒ men] [还|hái] [去|qù] [吃|chī] {w.icecream} 。 [这次|zhè cì] [我|wǒ] [先|xiān] [开口|kāi kǒu] ！', '[明日|あした] も [一緒|いっしょ] に {w.icecream} を [食|た]べる ん だ 。 [今度|こんど] は ぼく から [話|はな]す よ ！'),
    'tl.vale.0': Z('[我|wǒ] [帮|bāng] [奶奶|nǎi nai] [看|kān] [报亭|bào tíng] 。 [椰子|yē zi] [味|wèi] [的|de] {w.icecream} [最|zuì] [好吃|hǎo chī] ！', 'おばあちゃん の キオスク を [手伝|てつだ]って る の 。 ココナッツ の {w.icecream} が いちばん おいしい よ ！'),
    'tl.vale.1': Z('{shy} [每次|měi cì] [都|dōu] [买|mǎi] [一|yī] [瓶|píng] {w.soda} ， [什么|shén me] [也|yě] [不|bù] [说|shuō] 。 [真|zhēn] [奇怪|qí guài] ！', '{shy} くん 、 いつも {w.soda} を [買|か]う けど 、 [何|なに] も [言|い]わない の 。 [変|へん] なの ！'),
    'tl.paper.0': Z('[报|bào] [上|shàng] [说|shuō] [要|yào] [下雨|xià yǔ] 。 [报纸|bào zhǐ] [从来|cóng lái] [不|bù] [出错|chū cuò] … [差不多|chà bu duō] [从来|cóng lái] [不|bù] 。', '[新聞|しんぶん] に よる と 、 [雨|あめ] が [降|ふ]る そう だ 。 [新聞|しんぶん] は [間違|まちが]えない … まあ 、 ほとんど な 。'),
    'tl.paper.1': Z('[你|nǐ] [知道|zhī dào] [吗|ma] ？ [小卖部|xiǎo mài bù] [卖|mài] [报纸|bào zhǐ] ， [两|liǎng] [个|gè] [硬币|yìng bì] 。', '[知|し]って る かい ？ [売店|ばいてん] で [新聞|しんぶん] を [売|う]って る よ 。 コイン [二枚|にまい] だ 。'),
    'tl.gossipA.0': Z('[你|nǐ] [听见|tīng jiàn] [推车|tuī chē] [那|nà] [个|gè] [老头儿|lǎo tóu r] [说话|shuō huà] [了|le] [吗|ma] ？ [满嘴|mǎn zuǐ] [脏话|zāng huà] ！', '[荷車|にぐるま] の おじいさん 、 [聞|き]いた ？ [口|くち] が [悪|わる]い の なんの って ！'),
    'tl.gossipB.0': Z('[还有|hái yǒu] [街角|jiē jiǎo] [那|nà] [几|jǐ] [个|gè] [小伙子|xiǎo huǒ zi] ， [整天|zhěng tiān] [抽烟|chōu yān] 。 [不过|bù guò] [人|rén] [都|dōu] [挺|tǐng] [好|hǎo] [的|de] ！', 'それ に 、 [角|かど] の [若|わか]い [人|ひと] たち 。 [一日中|いちにちじゅう] たばこ を [吸|す]って る の よ 。 でも 、 いい [人|ひと] たち な の ！'),
    'tl.gossipA.1': Z('{keeper_alba} [什么|shén me] [都|dōu] [知道|zhī dào] 。 [阿尔巴|Ā ěr bā] [的|de] [事|shì] ， [她|tā] [全|quán] [知道|zhī dào] ！', '{keeper_alba} は アルバ の こと 、 [何|なん] でも [知|し]って る の よ 。 [何|なん] でも ！'),
    'tl.gossipB.1': Z('[嘘|xū] … [她|tā] [在|zài] [听|tīng] [呢|ne] ！', 'しーっ … [聞|き]こえちゃう わ よ ！'),
    'tl.sweeper.0': Z('[小心|xiǎo xīn] ， [我|wǒ] [在|zài] [扫地|sǎo dì] ！ [风|fēng] [这么|zhè me] [大|dà] ， [垃圾|lā jī] [满|mǎn] [镇|zhèn] [飞|fēi] 。', '[気|き] を つけて 、 [掃除中|そうじちゅう] よ ！ [風|かぜ] が [強|つよ]くて 、 ごみ が [町中|まちじゅう] に [飛|と]んで いく の 。'),
    'tl.sweeper.1': Z('[杂货店|zá huò diàn] [那|nà] [个|gè] [小伙子|xiǎo huǒ zi] [白天|bái tiān] [睡觉|shuì jiào] ， [晚上|wǎn shang] [上班|shàng bān] 。 [真|zhēn] [奇怪|qí guài] ！', '[雑貨屋|ざっかや] の [若|わか]い [人|ひと] 、 [昼|ひる] に [寝|ね]て 、 [夜|よる] に [働|はたら]く の よ 。 [変|へん] よ ね ！'),
    'tl.walker.0': Z('[这|zhè] [是|shì] {dog} 。 [它|tā] [最|zuì] [喜欢|xǐ huan] [追|zhuī] [风车|fēng chē] [了|le] ！', 'こいつ は {dog} 。 [風車|ふうしゃ] を [追|お]いかける の が [大好|だいす]き なん だ ！'),
    'tl.walker.1': Z('[你|nǐ] [的|de] {mimo} [和|hé] {dog} [能|néng] [做|zuò] [朋友|péng you] [吗|ma] ？', 'きみ の {mimo} と {dog} 、 [友達|ともだち] に なれる かな ？'),
    'tl.goyo.soda': Z('{w.soda} ！ [哎哟|āi yō] ， [你|nǐ] [真|zhēn] [够|gòu] [意思|yì si] ！ [拿|ná] [着|zhe] ， [辛苦|xīn kǔ] [了|le] 。', '{w.soda} じゃねえ か ！ ちくしょう 、 [気|き] が [利|き]く な ！ ほら 、 [手間賃|てまちん] だ 。'),
  };
  // the paper (by the English headline) and its masthead
  Object.assign(MAST, Z('[山谷|Shān gǔ] [回声|Huí shēng] [报|Bào]', '[谷|たに] の こだま [新聞|しんぶん]'));
  const NEWS_CJK = {
    'Wanted: an orange cat named {michi}': Z('[寻|xún] [猫|māo] ： [橘色|jú sè] [小|xiǎo] [母猫|mǔ māo] ， [名叫|míng jiào] {michi}', '[猫|ねこ] を [探|さが]して います ： [茶|ちゃ]トラ 、 [名前|なまえ] は {michi}'),
    '{michi} comes home: a party in Alba!': Z('{michi} [回家|huí jiā] [了|le] ！ [阿尔巴|Ā ěr bā] [全|quán] [村|cūn] [庆祝|qìng zhù]', '{michi} 、 [無事|ぶじ] [帰宅|きたく] ！ アルバ は おおよろこび'),
    'Molinar: the Great Mill still isn’t turning': Z('[磨坊镇|Mò fáng zhèn] ： [大磨坊|Dà mò fáng] [依然|yī rán] [不|bù] [转|zhuàn]', 'モリナール ： [大風車|だいふうしゃ] 、 [今|いま] も [止|と]まった まま'),
    'The Great Mill turns again! The first bell rings': Z('[大磨坊|Dà mò fáng] [又|yòu] [转|zhuàn] [起来|qǐ lái] [了|le] ！ [第一|dì yī] [口|kǒu] [钟|zhōng] [响|xiǎng] [了|le]', '[大風車|だいふうしゃ] 、 ふたたび [回|まわ]る ！ [最初|さいしょ] の [鐘|かね] が [鳴|な]る'),
    'Molinar: a kite flies higher than the windmills': Z('[磨坊镇|Mò fáng zhèn] ： [一|yī] [只|zhī] [风筝|fēng zheng] [飞|fēi] [得|de] [比|bǐ] [风车|fēng chē] [还|hái] [高|gāo]', 'モリナール ： [凧|たこ] が [風車|ふうしゃ] より [高|たか]く [舞|ま]う'),
    'Molinar’s store fixes its sign': Z('[磨坊镇|Mò fáng zhèn] [杂货店|zá huò diàn] [改正|gǎi zhèng] [招牌|zhāo pai] [错字|cuò zì]', 'モリナール の [雑貨屋|ざっかや] 、 [看板|かんばん] の [誤字|ごじ] を [直|なお]す'),
    'Remanso: love at the kiosk!': Z('[静水村|Jìng shuǐ cūn] ： [报亭|bào tíng] [前|qián] [的|de] [爱情|ài qíng] ！', 'レマンソ ： キオスク で [恋|こい] が [芽生|めば]える ！'),
    'Retired sailor breaks his cart for the third time': Z('[退休|tuì xiū] [老|lǎo] [水手|shuǐ shǒu] [第三|dì sān] [次|cì] [弄坏|nòng huài] [推车|tuī chē]', '[元船乗|もとふなの]り 、 [荷車|にぐるま] を [壊|こわ]す こと [三度目|さんどめ]'),
    'Neighbors argue: whose word is right?': Z('[邻居|lín jū] [争论|zhēng lùn] ： “ [冰棍儿|bīng gùn r] ” [还是|hái shi] “ [雪糕|xuě gāo] ” ？', '[近所|きんじょ] で [大論争|だいろんそう] ： 「 [肉|にく]まん 」 か 「 [豚|ぶた]まん 」 か ？'),
    'The Hush spreads. Experts say: talk more!': Z('[寂静|Jì jìng] [蔓延|màn yán] 。 [专家|zhuān jiā] [说|shuō] ： [多|duō] [说话|shuō huà] ！', '[静寂|せいじゃく] が [広|ひろ]がる 。 [専門家|せんもんか] 「 もっと [話|はな]そう ！ 」'),
    'Watch out: armadillos in the hills': Z('[注意|zhù yì] ： [山坡|shān pō] [上|shàng] [有|yǒu] [犰狳|qiú yú]', '[注意|ちゅうい] ： [丘|おか] に アルマジロ [出没|しゅつぼつ]'),
  };
  NEWS.forEach(n => { if (NEWS_CJK[n.en]) Object.assign(n, NEWS_CJK[n.en]); });
  const NEWS_DATE = Z('[今日|jīn rì] [报纸|bào zhǐ]', '[今日|きょう] の [新聞|しんぶん]');
  // every zh / ja string of this file (CJK.addSource at init; tests validate them). Not the misspelled signs.
  function cjkStrings(l) {
    const out = [], add = s => { if (typeof s === 'string' && s) out.push(s); };
    const inner = s => { if (typeof s === 'string') for (const m of s.matchAll(/«([^»]*)»/g)) if (/[぀-ヿ㐀-鿿[]/.test(m[1])) out.push(m[1]); };
    const L = o => { if (o) { add(o.tl); inner(o.en); } };
    for (const sm of SMOKERS[l] || []) {
      add(sm.nameC); add(sm.region.tlC); ['hi', 'start', 'quiz', 'win', 'ok', 'later', 'cat'].forEach(k => L(sm[k])); sm.chat.forEach(L); sm.praise.forEach(add);
      for (const p of sm.phrases) { add(p.tl); add(p.ex); [p.en, p.note, p.exEn, p.ask].forEach(inner); }
      for (const [, b] of BANTER[sm.id] || []) L(b);
    }
    const W = SWEARER[l];
    if (W) { add(W.nameC); add(W.grandmaC); add(W.insultQC); W.hi.forEach(L); W.grumble.forEach(L); W.lesson.forEach(L); ['intro', 'offer', 'why', 'end', 'done', 'bleep', 'right', 'wrong', 'cat'].forEach(k => L(W[k])); W.items.forEach(it => { add(it.tl); inner(it.note); }); }
    L(GROUP[l]);
    for (const o of [...Object.values(LT_CJK), ...Object.values(NAMES_CJK), ...Object.values(NEWS_CJK), MAST, NEWS_DATE, MODEL.cat, MODEL.shy, MODEL.parcel]) add(o[l]);
    for (const T0 of [STORE_NAME, WHERE_ST, SIGN_TEXT]) for (const v of Object.values(T0)) add(v[l]);
    for (const w of WORDS) { add(w[l]); if (w.cl) add(w.cl[l]); }
    add(SIGN_TYPO[l].right);
    return out;
  }
  // {name} slots in lines: the people's names in this language, {mimo}, and anything passed in. cj: the slots of a zh / ja
  // line, which get the notation and leave {mimo} to CJK (米莫 / ミモ for the default name); otherwise plain text.
  function fillVars(s, vars = {}, cj = false) {
    return String(s || '').replace(/\{(mimo|model|me|[a-z_0-9]+)\}/g, (m, k) => {
      if (k === 'mimo') return cj ? m : (G && G.state && G.state.mimoName) || (typeof UI !== 'undefined' && UI.mimoName) || 'Mimo';
      if (vars[k] !== undefined) return cj ? vars[k] : plainC(vars[k]);
      if (NAMES[k]) return cj ? nmRaw(k) : nm(k);
      return m;
    });
  }
  // a line ({ es, pt, de, en } or one speaker's { tl, en }) in the current language and level, with names filled in and bleeped
  // (zh / ja: a line with no zh / ja text has text '', and speak() gives the English weave, never Spanish)
  function lineOf(L, vars) {
    const cj = cjkGame(), l = cj ? realLang() : lang(), tier = typeof LEX !== 'undefined' ? LEX.tier() : 1;
    const pickT = v => (Array.isArray(v) ? v[Math.min(v.length, Math.max(1, tier)) - 1] : v);
    const text = pickT(L.tl !== undefined ? L.tl : L[l] !== undefined ? L[l] : cj ? '' : L.es) || '', en = pickT(L.en);
    vars = Object.assign({ model: MODEL.cat[dl()] }, vars || {});
    return { text: text ? bleep(fillVars(text, vars, cj)) : '', en: bleep(fillVars(cj && L.tl !== undefined ? enC(en) : en, vars)) };
  }

  // ================================================================ registering it all (init)
  let registered = false;
  function register() {
    if (registered || typeof LEX === 'undefined') return;
    registered = true;
    for (const [k, v] of Object.entries(LT_CJK)) if (LT[k]) Object.assign(LT[k], v);
    LEX.register(WORDS.filter(w => !LEX.item(w.id)).map(w => Object.assign({ kind: 'word' }, w)));
    for (const w of WORDS) { const it = LEX.item(w.id); if (it && it !== w && WORDS_CJK[w.id]) cjkWord(it, WORDS_CJK[w.id]); }     // (registered first by another file: only what's missing)
    const ph = [];
    for (const l of Object.keys(SMOKERS)) {
      for (const sm of SMOKERS[l]) for (const p of sm.phrases) ph.push({ id: p.id, kind: 'phrase', [l]: p.tl, en: p.en, note: p.note, region: sm.region.en, register: 'slang', icon: 'slang', from: sm.id });
      for (const it of SWEARER[l].items) ph.push({ id: it.id, kind: 'phrase', [l]: it.tl, en: it.en, note: it.note, region: '', register: 'swear', strength: it.s, insult: !!it.insult, icon: 'swear', from: 'swearer' });
    }
    LEX.register(ph.filter(p => !LEX.item(p.id)));
    addIcons();
    // (zh / ja into LINES with this file's own slots filled for that language, so CJK.validateAll checks them)
    const fillL = (s, l) => String(s).replace(/\{([a-z_0-9]+)\}/g, (m, k) => (k === 'mimo' ? m : k === 'model' ? MODEL.cat[l] : k === 'me' ? NAMES.dom1[l] : NAMES[k] ? NAMES[k][l] : m));
    if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) { LINES[k] = { es: [v.es], pt: [v.pt], de: [v.de], en: [v.en] }; for (const l of CJ) if (v[l]) LINES[k][l] = fillL(v[l], l); }
    if (typeof CJK !== 'undefined') {
      if (CJK.addNames) CJK.addNames(JA_NAMES);
      if (CJK.addSource) for (const l of CJ) CJK.addSource(cjkStrings(l).concat(l === 'zh' ? ['[不|bù] [知道|zhī dào]'] : ['[分|わ]からない', '[知|し]らない']), l);
    }
  }
  // ================================================================ materials: the town's toon look. Props fade (dithered) right by the camera
  // and between the camera and you, like town.js (the camera comes from viewMatrix: three r128 doesn't send cameraPosition
  // to basic materials, so the ink hulls would never fade otherwise).
  const U = { uFocus: { value: V3(0, -1e4, 0) }, uFade: { value: 1 } };
  function fadePatch(o) {
    return sh => {
      const CC = TK.camCut;        // (a store's awning and sign go with the house the camera's inside: toonkit.js)
      Object.assign(sh.uniforms, U, CC ? CC.U : {}, { rimAmt: { value: o.rim || 0 } });
      let vs = 'varying vec3 vWP;\n' + sh.vertexShader;
      if (o.off) vs = vs.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${TK.fl(o.off)};`);
      vs = vs.replace('#include <project_vertex>', `#include <project_vertex>
        #ifdef USE_INSTANCING
          vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
      sh.vertexShader = vs;
      let fs = 'uniform vec3 uFocus;\nuniform float uFade;\nuniform float rimAmt;\nvarying vec3 vWP;\n' + (CC ? CC.decl : '') + sh.fragmentShader;
      fs = fs.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        ${CC ? CC.test : ''}
        { vec3 camW = -vec3(dot(viewMatrix[0].xyz, viewMatrix[3].xyz), dot(viewMatrix[1].xyz, viewMatrix[3].xyz), dot(viewMatrix[2].xyz, viewMatrix[3].xyz));
          vec3 seg = uFocus - camW; float segL = max(length(seg), 0.001); vec3 dir = seg / segL;
          vec3 rel = vWP - camW; float along = dot(rel, dir); float axis = length(rel - dir * along);
          float occl = step(0.0, along) * step(along, segL - 0.9) * (1.0 - smoothstep(1.1, 2.4, axis)) * smoothstep(0.4, 1.2, vWP.y - uFocus.y + 1.5);
          float nearCam = 1.0 - smoothstep(1.4, 3.2, length(rel));
          if (uFade > 0.5 && nearCam > 0.8) discard;
          float fadeAmt = uFade * max(occl * 0.9, nearCam);
          if (fadeAmt > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < fadeAmt) discard; }`);
      if (o.rim) fs = fs.replace('#include <tonemapping_fragment>', 'float rimF = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\ngl_FragColor.rgb += vec3(1.0, 0.95, 0.82) * rimAmt * smoothstep(0.6, 0.95, rimF);\n#include <tonemapping_fragment>');
      sh.fragmentShader = fs;
    };
  }
  const MATS = {};
  function propMat(o = {}) {
    const key = 'p' + JSON.stringify(o); if (MATS[key]) return MATS[key];
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad, vertexColors: !o.map, map: o.map || null });
    m.onBeforeCompile = fadePatch({ rim: 0.22 }); m.customProgramCacheKey = () => 'tl-' + key;
    return (MATS[key] = m);
  }
  function propInk(w) {
    const key = 'i' + w; if (MATS[key]) return MATS[key];
    const m = new THREE.MeshBasicMaterial({ color: '#2b2235', side: THREE.BackSide });
    m.onBeforeCompile = fadePatch({ off: w }); m.customProgramCacheKey = () => 'tl-' + key;
    return (MATS[key] = m);
  }

  // ================================================================ geometry: pieces → one vertex-colored mesh and its ink hull (cornmaze.js's way)
  const GEO = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl6: new THREE.CylinderGeometry(1, 1, 1, 6), sph: new THREE.SphereGeometry(1, 10, 7),
    ico: new THREE.IcosahedronGeometry(1, 1), cone: new THREE.ConeGeometry(1, 1, 8), torus: new THREE.TorusGeometry(1, 0.16, 6, 16) };
  function bake(pieces) {
    let n = 0;
    const list = pieces.map(p => { const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone(); g.applyMatrix4(p.m); n += g.attributes.position.count; return { g, c: new THREE.Color(p.color) }; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let o = 0;
    for (const { g, c } of list) {
      const cnt = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      for (let i = 0; i < cnt; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
      o += cnt;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    return geo;
  }
  // a kit of pieces, placed with at(x, y, z, yaw) (local +z = the front)
  function Kit() {
    const P = [];
    let base = new THREE.Matrix4();
    const k = {
      P,
      at(x, y, z, ry = 0) { base = TK.M4(x, y, z, 1, 1, 1, ry); return k; },
      add(geo, color, x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) { P.push({ geo, color, m: base.clone().multiply(TK.M4(x, y, z, sx, sy, sz, ry, rx, rz)) }); return k; },
      box(x, y, z, w, h, d, color, ry = 0, rx = 0, rz = 0) { return k.add(GEO.box, color, x, y, z, w, h, d, rx, ry, rz); },
      cyl(x, y, z, r, h, color, rx = 0, rz = 0, geo = GEO.cyl) { return k.add(geo, color, x, y, z, r, h, r, rx, 0, rz); },
      ball(x, y, z, r, color, sy = r, sz = r) { return k.add(GEO.sph, color, x, y, z, r, sy, sz); },
      world(x, y, z) { return V3(x, y, z).applyMatrix4(base); },
    };
    return k;
  }
  function inked(P, ink = 0.02, name = 'tl-props') {
    const geo = bake(P), g = new THREE.Group(); g.name = name;
    const m = new THREE.Mesh(geo, propMat()); m.castShadow = true; m.receiveShadow = true; g.add(m);
    const h = new THREE.Mesh(geo, propInk(ink)); g.add(h);
    return g;
  }
  // a painted board: a canvas texture on the front of a box (and on its back too if `both`: a box's back face isn't
  // mirrored), redrawn when the language changes
  function board(w, h, draw, pw = 512, both = false) {
    const cv = document.createElement('canvas'); cv.width = pw; cv.height = Math.round(pw * h / w);
    const tex = new THREE.CanvasTexture(cv), wood = TK.toon('#8a5f3e', { rim: 0.1 }); tex.anisotropy = 4;
    const front = new THREE.MeshToonMaterial({ map: tex, gradientMap: TK.grad });
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), [wood, wood, wood, wood, front, both ? front : wood]); mesh.castShadow = true;
    const ink = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, h + 0.05, 0.11), new THREE.MeshBasicMaterial({ color: '#2b2235', side: THREE.BackSide })); mesh.add(ink);
    let drawn = null;
    mesh.userData.redraw = (key, force) => { if (drawn === key && !force) return; drawn = key; const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); draw(c, cv.width, cv.height); tex.needsUpdate = true; };
    return mesh;
  }
  const roundRect = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
  function fitText(c, text, maxW, size, font) { let s = size; c.font = `${font} ${s}px Bahnschrift, "Trebuchet MS", "Segoe UI", sans-serif`; while (c.measureText(text).width > maxW && s > 12) { s -= 2; c.font = `${font} ${s}px Bahnschrift, "Trebuchet MS", "Segoe UI", sans-serif`; } }

  // ================================================================ people: drawn like town.js's townsfolk (one instanced mesh per body part)
  const lathe = (pts, n = 13) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
  let PART = null;
  function parts() {
    if (PART) return PART;
    PART = {
      lathe: { geo: lathe([[0, 0], [0.38, 0.02], [0.37, 0.3], [0.28, 0.68], [0.2, 0.9], [0.1, 0.97], [0, 0.98]]), ink: 0.02 },
      head: { geo: new THREE.SphereGeometry(1, 14, 10), ink: 0.02 },
      ball: { geo: new THREE.SphereGeometry(1, 8, 6), ink: 0.03 },
      cap: { geo: new THREE.SphereGeometry(1, 12, 5, 0, TAU, 0, Math.PI * 0.5), ink: 0.02 },
      cyl: { geo: new THREE.CylinderGeometry(1, 1, 1, 8), ink: 0.03 },
      cone: { geo: new THREE.ConeGeometry(1, 1, 8), ink: 0.03 },
      box: { geo: new THREE.BoxGeometry(1, 1, 1), ink: 0.03 },
      thin: { geo: new THREE.BoxGeometry(1, 1, 1), ink: 0 },
      eye: { geo: new THREE.SphereGeometry(1, 6, 4), ink: 0, mat: () => TK.toon('#2b2235', { rim: 0 }) },
      hl: { geo: new THREE.SphereGeometry(1, 5, 3), ink: 0, mat: () => new THREE.MeshBasicMaterial({ color: '#ffffff' }) },
      blush: { geo: new THREE.SphereGeometry(1, 6, 4), ink: 0, mat: () => new THREE.MeshBasicMaterial({ color: '#ff8c9a', transparent: true, opacity: 0.5, depthWrite: false }) },
      ring: { geo: new THREE.TorusGeometry(1, 0.12, 5, 16), ink: 0, mat: () => new THREE.MeshBasicMaterial({ color: '#2b2235' }) },
      ember: { geo: new THREE.SphereGeometry(1, 6, 4), ink: 0, mat: () => new THREE.MeshBasicMaterial({ color: '#ff7a2a' }) },
    };
    return PART;
  }
  function Rig() {
    const P = parts(), leaves = Object.fromEntries(Object.keys(P).map(k => [k, []]));
    const leaf = (parent, part, color, pos, scale, rot) => { const n = new THREE.Object3D(); if (pos) n.position.set(...pos); if (scale) n.scale.set(...scale); if (rot) n.rotation.set(...rot); parent.add(n); leaves[part].push({ n, color }); return n; };
    const node = (parent, pos, rot) => { const n = new THREE.Object3D(); if (pos) n.position.set(...pos); if (rot) n.rotation.set(...rot); if (parent) parent.add(n); return n; };
    let list = [];
    function meshes(group) {
      const col = new THREE.Color();
      for (const [name, L] of Object.entries(leaves)) {
        if (!L.length) continue;
        const D = P[name], mat = D.mat ? D.mat() : TK.toon('#ffffff', { rim: 0.32 });
        const im = new THREE.InstancedMesh(D.geo, mat, L.length);
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = D.ink > 0; im.name = 'tl-folk-' + name;
        if (!D.mat) L.forEach((l, i) => im.setColorAt(i, col.set(l.color)));
        group.add(im); list.push({ im, L });
        if (D.ink) { const h = new THREE.InstancedMesh(D.geo, TK.outlineMat(D.ink), L.length); h.instanceMatrix = im.instanceMatrix; h.frustumCulled = false; h.name = im.name + '-ink'; group.add(h); }
      }
    }
    function sync() { for (const { im, L } of list) { for (let i = 0; i < L.length; i++) im.setMatrixAt(i, L[i].n.matrixWorld); im.instanceMatrix.needsUpdate = true; } }
    return { leaf, node, meshes, sync, get count() { return Object.values(leaves).reduce((a, l) => a + l.length, 0); } };
  }
  // One person. d: { skin, hair, dress, apron, hairdo (bald|bun|pony|long|curly|pigtails), hat (straw|cap|beret|scarf|flat|beanie|
  // captain|trilby), hatColor, band, beard, stache, glasses, shades, scarf, legs, pants, shoes, h, w, prop (cig|paper|hammer|broom|mate|
  // basket), mate }
  function makePerson(rig, d) {
    const { leaf, node } = rig;
    const C = { skin: d.skin, hair: d.hair || '#2e2420', dress: d.dress, pants: d.pants || '#3a4466', shoes: d.shoes || '#5b3a22', hat: d.hatColor || '#e8c57a' };
    const root = new THREE.Object3D(), body = node(root), w = d.w || 1;
    root.scale.setScalar(d.h || 1);
    const R = { root, body, d, legs: null, feet: [], arms: [], head: null, eyes: [], mouth: null, props: {} };
    if (d.legs) {
      leaf(body, 'lathe', C.dress, [0, 0.36, 0], [w, 0.64, w]);
      R.legs = [-1, 1].map(s => { const hip = node(body, [s * 0.12 * w, 0.4, 0]); leaf(hip, 'cyl', C.pants, [0, -0.18, 0], [0.085, 0.36, 0.085]); R.feet.push(leaf(hip, 'ball', C.shoes, [0, -0.36, 0.05], [0.1, 0.075, 0.15])); return hip; });
    } else {
      leaf(body, 'lathe', C.dress, null, [w, 1, w]);
      R.feet = [-1, 1].map(s => leaf(body, 'ball', C.shoes, [s * 0.13 * w, 0.04, 0.12], [0.1, 0.07, 0.14]));
    }
    if (d.apron) leaf(body, 'ball', d.apron, [0, 0.42, 0.26 * w], [0.24 * w, 0.3, 0.08]);
    if (d.scarf) { leaf(body, 'cyl', d.scarf, [0, 0.93, 0.01], [0.2, 0.08, 0.2]); leaf(body, 'box', d.scarf, [0.08, 0.78, 0.17], [0.07, 0.24, 0.03], [0.1, 0, 0.15]); }
    R.arms = [-1, 1].map(s => {
      const sh = node(body, [s * 0.25 * w, 0.84, 0.05], [-0.5, 0, -s * 0.2]);
      leaf(sh, 'cyl', C.dress, [0, -0.14, 0], [0.07, 0.28, 0.07]);
      const hand = node(sh, [0, -0.3, 0]); leaf(hand, 'ball', C.skin, null, [0.07, 0.07, 0.07]);
      sh.userData.hand = hand; return sh;
    });
    const head = R.head = node(body, [0, 0.98, 0]);
    leaf(head, 'head', C.skin, [0, 0.2, 0], [0.28, 0.27, 0.27]);
    if (d.hairdo !== 'bald') leaf(head, 'cap', C.hair, [0, 0.22, -0.02], [0.29, 0.29, 0.29], [-0.5, 0, 0]);
    else leaf(head, 'cap', C.hair, [0, 0.14, -0.06], [0.285, 0.2, 0.26], [-1.1, 0, 0]);
    if (d.hairdo === 'bun') leaf(head, 'ball', C.hair, [0, 0.42, -0.2], [0.12, 0.12, 0.12]);
    if (d.hairdo === 'pony') { leaf(head, 'ball', C.hair, [0, 0.3, -0.27], [0.08, 0.08, 0.08]); leaf(head, 'ball', C.hair, [0, 0.14, -0.33], [0.08, 0.17, 0.08], [0.3, 0, 0]); }
    if (d.hairdo === 'long') leaf(head, 'ball', C.hair, [0, 0.1, -0.1], [0.28, 0.3, 0.2]);
    if (d.hairdo === 'pigtails') for (const s of [-1, 1]) leaf(head, 'ball', C.hair, [s * 0.27, 0.12, -0.08], [0.09, 0.14, 0.09]);
    if (d.hairdo === 'curly') for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; leaf(head, 'ball', C.hair, [Math.cos(a) * 0.17, 0.4 + Math.sin(a * 2) * 0.02, Math.sin(a) * 0.15 - 0.04], [0.11, 0.1, 0.11]); }
    R.eyes = [-1, 1].map(s => { const e = node(head, [s * 0.1, 0.21, 0.24]); leaf(e, 'eye', null, null, [0.04, 0.06, 0.025]); leaf(e, 'hl', null, [0.013, 0.023, 0.022], [0.017, 0.017, 0.017]); return e; });
    [-1, 1].forEach(s => leaf(head, 'blush', null, [s * 0.17, 0.09, 0.23], [0.05, 0.0275, 0.015], [0, s * 0.4, 0]));
    R.mouth = leaf(head, 'eye', null, [0, 0.07, 0.27], [0.035, 0.012, 0.01]);
    if (d.stache) for (const s of [-1, 1]) leaf(head, 'ball', C.hair, [s * 0.05, 0.11, 0.255], [0.06, 0.025, 0.03], [0, 0, -s * 0.35]);
    if (d.beard) leaf(head, 'ball', C.hair, [0, 0.03, 0.12], [0.21, 0.17, 0.16]);
    if (d.glasses) for (const s of [-1, 1]) leaf(head, 'ring', null, [s * 0.1, 0.19, 0.265], [0.068, 0.068, 0.068]);
    if (d.shades) { for (const s of [-1, 1]) leaf(head, 'box', '#2b2235', [s * 0.1, 0.2, 0.262], [0.13, 0.07, 0.02]); leaf(head, 'thin', '#2b2235', [0, 0.22, 0.268], [0.08, 0.015, 0.01]); }
    const hat = node(head, [0, 0.4, 0]);
    if (d.hat === 'straw') { leaf(hat, 'cyl', C.hat, null, [0.5, 0.035, 0.5]); leaf(hat, 'cap', C.hat, [0, 0.01, 0], [0.22, 0.2, 0.22]); leaf(hat, 'cyl', d.band || '#e05a4b', [0, 0.05, 0], [0.225, 0.05, 0.225]); }
    else if (d.hat === 'cap') { leaf(hat, 'cap', C.hat, [0, -0.08, 0], [0.3, 0.22, 0.3]); leaf(hat, 'cyl', C.hat, [0, -0.08, 0.26], [0.16, 0.02, 0.12]); }
    else if (d.hat === 'beret') leaf(hat, 'ball', C.hat, [0.04, -0.07, -0.02], [0.3, 0.09, 0.3], [0, 0, 0.2]);
    else if (d.hat === 'scarf') { leaf(hat, 'cap', C.hat, [0, -0.2, -0.01], [0.31, 0.32, 0.31], [-0.25, 0, 0]); leaf(hat, 'ball', C.hat, [0, -0.32, -0.27], [0.08, 0.08, 0.08]); }
    else if (d.hat === 'flat') { leaf(hat, 'cap', C.hat, [0, -0.1, 0.02], [0.31, 0.14, 0.33]); leaf(hat, 'cyl', C.hat, [0, -0.1, 0.27], [0.15, 0.02, 0.1]); }
    else if (d.hat === 'beanie') { leaf(hat, 'cap', C.hat, [0, -0.1, 0], [0.31, 0.3, 0.31]); leaf(hat, 'cyl', C.hat, [0, -0.1, 0], [0.315, 0.07, 0.315]); leaf(hat, 'ball', '#d9443a', [0, 0.2, 0], [0.07, 0.07, 0.07]); }
    else if (d.hat === 'captain') { leaf(hat, 'cyl', C.hat, [0, -0.02, 0], [0.3, 0.12, 0.3]); leaf(hat, 'cyl', '#2b2235', [0, -0.08, 0], [0.305, 0.04, 0.305]); leaf(hat, 'cyl', '#2b2235', [0, -0.09, 0.24], [0.16, 0.02, 0.12]); leaf(hat, 'ball', '#e6b84a', [0, -0.02, 0.29], [0.04, 0.04, 0.02]); }
    else if (d.hat === 'trilby') { leaf(hat, 'cyl', C.hat, [0, -0.06, 0], [0.38, 0.03, 0.38]); leaf(hat, 'cyl', C.hat, [0, 0.04, 0], [0.22, 0.17, 0.22]); leaf(hat, 'cyl', '#2b2235', [0, -0.02, 0], [0.225, 0.04, 0.225]); }
    // things people hold
    const handR = R.arms[1].userData.hand, handL = R.arms[0].userData.hand, P = R.props;
    if (d.prop === 'cig') { P.cig = node(handR, [0, -0.02, 0.06], [1.2, 0, 0]); leaf(P.cig, 'cyl', '#f4f1ea', [0, 0.06, 0], [0.012, 0.12, 0.012]); P.ember = leaf(P.cig, 'ember', null, [0, 0.125, 0], [0.016, 0.016, 0.016]); }
    if (d.mate) { P.mate = node(handL, [0, -0.04, 0.05]); leaf(P.mate, 'ball', '#8a5a2e', null, [0.07, 0.08, 0.07]); leaf(P.mate, 'cyl', '#d9d4c8', [0.02, 0.09, 0], [0.008, 0.12, 0.008], [0, 0, -0.2]); }
    if (d.prop === 'paper') { P.paper = node(body, [0, 1.05, 0.34]); leaf(P.paper, 'box', '#fbf6e7', [-0.13, 0, 0], [0.26, 0.34, 0.012], [0, 0.25, 0]); leaf(P.paper, 'box', '#fbf6e7', [0.13, 0, 0], [0.26, 0.34, 0.012], [0, -0.25, 0]); leaf(P.paper, 'thin', '#2b2235', [-0.14, 0.11, 0.035], [0.2, 0.04, 0.005], [0, 0.25, 0]); }
    if (d.prop === 'hammer') { P.hammer = node(handR, [0, 0, 0.02], [1.3, 0, 0]); leaf(P.hammer, 'cyl', '#a8784e', [0, 0.12, 0], [0.02, 0.3, 0.02]); leaf(P.hammer, 'box', '#6b6a78', [0, 0.27, 0], [0.12, 0.05, 0.05]); }
    if (d.prop === 'broom') { P.broom = node(body, [0.05, 0.5, 0.38], [0.35, 0, 0]); leaf(P.broom, 'cyl', '#a8784e', [0, 0.1, 0], [0.025, 1.3, 0.025]); leaf(P.broom, 'cone', '#e3c26a', [0, -0.62, 0], [0.16, 0.34, 0.07]); }
    if (d.prop === 'basket') { P.basket = node(handL, [0, -0.12, 0.04]); leaf(P.basket, 'cyl', '#c9955a', null, [0.17, 0.16, 0.13]); for (let i = 0; i < 3; i++) leaf(P.basket, 'ball', ['#e2453a', '#f2c14e', '#9cc24e'][i], [(i - 1) * 0.08, 0.09, 0], [0.06, 0.06, 0.06]); }
    if (d.prop === 'cone') { P.cone = node(handR, [0, 0.02, 0.05]); leaf(P.cone, 'cone', '#e0b060', [0, -0.06, 0], [0.04, 0.12, 0.04], [Math.PI, 0, 0]); leaf(P.cone, 'ball', '#f6a6c1', [0, 0.02, 0], [0.05, 0.05, 0.05]); }
    return R;
  }
  // animals: a dog, the cat (curled up asleep, or sitting)
  function makeDog(rig, color) {
    const { leaf, node } = rig, root = new THREE.Object3D(), body = node(root), A = { root, body, legs: [], tail: null, head: null };
    leaf(body, 'ball', color, [0, 0.36, 0], [0.2, 0.18, 0.34]);
    A.head = node(body, [0, 0.55, 0.3]); leaf(A.head, 'ball', color, null, [0.17, 0.16, 0.17]); leaf(A.head, 'ball', '#f3e2c6', [0, -0.04, 0.14], [0.09, 0.07, 0.1]); leaf(A.head, 'eye', null, [0, -0.01, 0.24], [0.04, 0.03, 0.03]);
    for (const s of [-1, 1]) { leaf(A.head, 'eye', null, [s * 0.07, 0.05, 0.13], [0.03, 0.035, 0.02]); leaf(A.head, 'hl', null, [s * 0.07 + 0.01, 0.065, 0.145], [0.01, 0.01, 0.01]); leaf(A.head, 'ball', '#7a4f2e', [s * 0.15, 0.04, -0.02], [0.05, 0.12, 0.08], [0, 0, s * 0.3]); }
    for (const [x, z] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const hip = node(body, [x * 0.1, 0.26, z * 0.2]); leaf(hip, 'cyl', color, [0, -0.11, 0], [0.05, 0.24, 0.05]); A.legs.push(hip); }
    A.tail = node(body, [0, 0.45, -0.32], [-0.7, 0, 0]); leaf(A.tail, 'ball', color, [0, 0.1, 0], [0.04, 0.12, 0.04]);
    leaf(body, 'cyl', '#d9443a', [0, 0.5, 0.24], [0.13, 0.03, 0.13], [0.6, 0, 0]);       // a collar
    return A;
  }
  function makeCat(rig, sleeping) {
    const { leaf, node } = rig, root = new THREE.Object3D(), body = node(root), O = '#f0a050', W = '#fffaf0', A = { root, body, tail: null, head: null };
    if (sleeping) {      // curled up in a ring, tail round the nose
      leaf(body, 'ball', O, [0, 0.13, 0], [0.22, 0.13, 0.2]);
      A.head = node(body, [0.14, 0.16, 0.1]); leaf(A.head, 'ball', O, null, [0.11, 0.1, 0.1]);
      for (const s of [-1, 1]) { leaf(A.head, 'cone', O, [s * 0.06, 0.1, 0], [0.035, 0.07, 0.03], [0, 0, -s * 0.25]); leaf(A.head, 'eye', null, [s * 0.04, 0.02, 0.09], [0.025, 0.004, 0.01]); }
      A.tail = node(body, [-0.05, 0.08, 0.14]); leaf(A.tail, 'cyl', O, [0.1, 0, 0], [0.035, 0.26, 0.035], [0, 0, Math.PI / 2]);
      for (const s of [-1, 1]) leaf(body, 'ball', W, [0.2, 0.05, s * 0.06], [0.04, 0.03, 0.04]);
    } else {             // sitting up
      leaf(body, 'ball', O, [0, 0.16, 0], [0.13, 0.16, 0.15]);
      A.head = node(body, [0, 0.36, 0.06]); leaf(A.head, 'ball', O, null, [0.11, 0.1, 0.1]);
      for (const s of [-1, 1]) { leaf(A.head, 'cone', O, [s * 0.065, 0.11, 0], [0.04, 0.08, 0.03], [0, 0, -s * 0.2]); leaf(A.head, 'eye', null, [s * 0.04, 0.02, 0.09], [0.022, 0.03, 0.01]); }
      leaf(A.head, 'ball', '#f2a0a8', [0, -0.02, 0.1], [0.015, 0.012, 0.01]);
      A.tail = node(body, [0, 0.05, -0.14]); leaf(A.tail, 'cyl', O, [0.06, 0.12, -0.04], [0.035, 0.28, 0.035], [0.3, 0, -0.5]);
      for (const s of [-1, 1]) leaf(body, 'ball', W, [s * 0.06, 0.03, 0.1], [0.045, 0.035, 0.05]);
    }
    return A;
  }
  // the kite: a three-color diamond with a bowed tail (and its string, stretched every frame)
  function makeKite(rig) {
    const { leaf, node } = rig, root = new THREE.Object3D(), K = { root, tail: [] };
    const face = node(root, null, [0, 0, Math.PI / 4]);
    leaf(face, 'box', '#e0503f', null, [0.5, 0.5, 0.025]);
    leaf(face, 'box', '#f2c14e', [0.125, 0.125, 0.016], [0.25, 0.25, 0.012]); leaf(face, 'box', '#3f7fc9', [-0.125, -0.125, 0.016], [0.25, 0.25, 0.012]);
    for (let i = 0; i < 4; i++) { const n = node(root, [0, -0.42 - i * 0.2, 0]); leaf(n, 'ball', ['#4f9a5a', '#e86a9a', '#f2c14e', '#3f7fc9'][i], null, [0.05, 0.03, 0.03]); K.tail.push(n); }
    K.string = leaf(new THREE.Object3D(), 'thin', '#f4efe4', null, [0.008, 1, 0.008]);
    return K;
  }
  const _a = V3(0, 0, 0), _b = V3(0, 0, 0), _d = V3(0, 0, 0), _up = V3(0, 1, 0);
  function stretch(n, a, b) {      // a thin leaf from point a to point b
    _d.copy(b).sub(a); const L = _d.length();
    n.position.copy(a).add(b).multiplyScalar(0.5); n.scale.set(0.008, Math.max(0.001, L), 0.008);
    n.quaternion.setFromUnitVectors(_up, _d.normalize()); n.updateMatrixWorld(true);
  }

  // ================================================================ build: the three towns' corners
  let built = null;
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => (typeof WORLD !== 'undefined' ? WORLD.terrainAt(x, z) : 0.25));
    const root = new THREE.Group(); root.name = 'townlife'; scene.add(root);
    const colliders = [], people = [], R0 = rng(4242);
    const towns = {};
    for (const key of Object.keys(TOWN_C)) { const g = new THREE.Group(); g.name = 'townlife-' + key; root.add(g); towns[key] = { key, g, rig: Rig(), kit: Kit(), list: [], boards: [], extra: [] }; }
    // ---------------- people
    // spec: { id, town, name (a NAMES key, or a function), lang (only shown in that language), look, prop, job, at: { x, z, yaw, seat }, path, kid, solid }
    const P = {};
    function person(spec) {
      const T = towns[spec.town], R = makePerson(T.rig, Object.assign({}, spec.look, { prop: spec.prop || spec.look.prop, mate: spec.mate }));
      const at = spec.at || { x: spec.path[0][0], z: spec.path[0][1], yaw: 0 };
      const S = { x: at.x, z: at.z, yaw: at.yaw || 0, speed: 0, phase: R0() * 6, near: false, wave: 0, talk: 0, blink: 1 + R0() * 4, seed: R0(), sit: !!at.seat, seat: at.seat || 0,
        pose: null, lookAt: undefined, i: 1, dir: 1, pause: R0() * 2, hop: 0, smokeT: 2 + R0() * 6, drag: 0, slam: 3 + R0() * 6, fist: 0, yawn: 9 + R0() * 9 };
      const p = { spec, R, S, T, hidden: false };
      p.api = spec.api || {
        id: 'tl-' + spec.id, kind: spec.kid ? 'kid' : 'tl', kid: !!spec.kid, talking: false,
        get name() { return typeof spec.name === 'function' ? spec.name() : nm(spec.name || spec.id); },
        get x() { return S.x; }, get z() { return S.z; },
        get y() { return gy(S.x, S.z) + (S.sit ? S.seat - 0.5 : 0); }, get top() { return (spec.look.h || 1) * 1.5 - (S.sit ? 0.45 : 0); },
      };
      if (!spec.api) people.push(p.api);
      T.list.push(p); P[spec.id] = p;
      if (spec.solid) colliders.push({ x: at.x, z: at.z, r: spec.solid === true ? 0.4 : spec.solid });
      return p;
    }
    // the smokers: one seat each, three people per seat (one per language); the seat's api is what talks
    const H = PL.hangout;
    const seatApi = H.seats.map((st, i) => ({
      id: 'tl-smoker' + i, kind: 'tl', kid: false, talking: false, seat: i,
      get name() { const sm = (SMOKERS[dl()] || SMOKERS.es)[i]; return sm ? sm.name : '…'; },
      get x() { return st.x; }, get z() { return st.z; }, get y() { return gy(st.x, st.z) + st.seat - 0.5; }, get top() { return 1.05; },
    }));
    seatApi.forEach(a => people.push(a));
    for (const l of Object.keys(SMOKERS)) SMOKERS[l].forEach((sm, i) => person({ id: sm.id, town: 'alba', lang: l, api: seatApi[i], look: sm.look, prop: 'cig', mate: !!sm.mate, job: 'smoke', at: H.seats[i] }));
    // the swearer (one per language, the same spot)
    const goyoApi = { id: 'tl-swearer', kind: 'tl', kid: false, talking: false, get name() { return (SWEARER[dl()] || SWEARER.es).name; },
      get x() { return PL.cart.goyo.x; }, get z() { return PL.cart.goyo.z; }, get y() { return gy(PL.cart.goyo.x, PL.cart.goyo.z); }, get top() { return 1.55; } };
    people.push(goyoApi);
    colliders.push({ x: PL.cart.goyo.x, z: PL.cart.goyo.z, r: 0.42 });
    for (const l of Object.keys(SWEARER)) person({ id: 'swearer_' + l, town: 'alba', lang: l, api: goyoApi, look: SWEARER[l].look, prop: 'hammer', job: 'swear', at: PL.cart.goyo });
    // the keepers, behind their counters
    for (const [key, st] of Object.entries(PL.stores)) {
      const looks = { alba: { skin: '#e6b48c', hair: '#5a4a44', hairdo: 'bun', dress: '#c9553f', apron: '#fdf8ee', glasses: true, h: 0.96, w: 1.1 },
        molinar: { skin: '#dcae86', hair: '#2e2420', hairdo: 'curly', dress: '#3f6fb5', legs: true, pants: '#2f3440', shoes: '#f4f1ea', hat: 'beanie', hatColor: '#3a3040' },
        remanso: { skin: '#a8714a', hair: '#e8e2d6', hairdo: 'bun', dress: '#2f8f8a', apron: '#fdf8ee', h: 0.95, w: 1.15, hat: 'scarf', hatColor: '#f2c14e' } }[key];
      person({ id: 'keeper_' + key, town: st.town, name: 'keeper_' + key, look: looks, job: 'keeper', sleepy: key === 'molinar', at: Object.assign(ahead(st, -0.3), { yaw: st.yaw }) });
    }
    // Alba: the man with the paper, two neighbors gossiping, Paloma (and Michi)
    person({ id: 'paper', town: 'alba', name: 'paper', look: { skin: '#f0c7a0', hair: '#d8d8d8', hairdo: 'bald', stache: true, glasses: true, dress: '#6b5a8a', legs: true, pants: '#4a4a55', shoes: '#5b3a22', hat: 'flat', hatColor: '#6b5a4a' }, prop: 'paper', job: 'read', at: PL.paperMan });
    const gA = PL.gossip[0], gB = PL.gossip[1];
    person({ id: 'gossipA', town: 'alba', name: 'gossipA', look: { skin: '#c98e62', hair: '#2e2420', hairdo: 'bun', dress: '#e0743c', apron: '#fdf8ee' }, prop: 'basket', job: 'chat', other: 'gossipB', solid: true, at: { x: gA.x, z: gA.z, yaw: Math.atan2(gB.x - gA.x, gB.z - gA.z) } });
    person({ id: 'gossipB', town: 'alba', name: 'gossipB', look: { skin: '#f5cda2', hair: '#8a4a2a', hairdo: 'long', dress: '#7a5ab0', hat: 'straw', hatColor: '#e8c57a' }, job: 'chat', other: 'gossipA', solid: true, at: { x: gB.x, z: gB.z, yaw: Math.atan2(gA.x - gB.x, gA.z - gB.z) } });
    person({ id: 'paloma', town: 'alba', name: 'paloma', kid: true, look: { skin: '#a8714a', hair: '#2e2420', hairdo: 'pigtails', dress: '#4fb3d9', h: 0.74 }, job: 'paloma', solid: 0.34, at: PL.paloma });
    // Molinar: the dominoes, the kite kid, someone sweeping, a dog walker
    const DM = PL.dominoes;
    [0, 1, 2].forEach(i => {
      const a = Math.PI / 2 + i * (TAU / 3), at = { x: DM.x + Math.sin(a) * 0.95, z: DM.z + Math.cos(a) * 0.95, yaw: a + Math.PI, seat: 0.47 };
      const look = [{ skin: '#e6b48c', hair: '#f4f1ea', hairdo: 'bald', stache: true, dress: '#4f7f4a', legs: true, pants: '#4a3a33', hat: 'flat', hatColor: '#4a4a55', scarf: '#c9b48a' },
        { skin: '#8a5a3c', hair: '#d8d8d8', hairdo: 'bald', beard: true, dress: '#c9b48a', legs: true, pants: '#2f3440', glasses: true },
        { skin: '#f0c7a0', hair: '#c9c9c9', dress: '#5a86b8', legs: true, pants: '#4a4a55', hat: 'beret', hatColor: '#2b2235' }][i];
      person({ id: 'dom' + i, town: 'molinar', name: 'dom' + i, look, job: 'domino', at });
    });
    person({ id: 'kid', town: 'molinar', name: 'kid', kid: true, look: { skin: '#dcae86', hair: '#6b3b25', dress: '#e0503f', legs: true, pants: '#3f6fb5', shoes: '#f4f1ea', hat: 'cap', hatColor: '#f2c14e', h: 0.72 }, job: 'kite', solid: 0.34, at: PL.kiteKid });
    person({ id: 'sweeper', town: 'molinar', name: 'sweeper', look: { skin: '#c98e62', hair: '#d8d8d8', hairdo: 'bun', dress: '#8a5ab0', apron: '#fdf8ee', h: 0.95 }, prop: 'broom', job: 'sweep', path: PL.sweep });
    person({ id: 'walker', town: 'molinar', name: 'walker', look: { skin: '#8a5a3c', hair: '#2e2420', dress: '#4f9a5a', legs: true, pants: '#3a4466', shoes: '#f4f1ea', hat: 'cap', hatColor: '#e0503f' }, job: 'walk', path: PL.dogPath, speed: 1.3 });
    // Remanso: the keeper's granddaughter, and the shy fisher
    person({ id: 'vale', town: 'remanso', name: 'vale', look: { skin: '#c98e62', hair: '#2e2420', hairdo: 'pony', dress: '#f2c94c', apron: '#fdf8ee' }, job: 'vale', solid: true, at: PL.vale });
    person({ id: 'shy', town: 'remanso', name: 'shy', look: { skin: '#a8714a', hair: '#2e2420', dress: '#3f6fb5', legs: true, pants: '#c9b48a', shoes: '#5b3a22', hat: 'straw', hatColor: '#e8c57a', band: '#3f6fb5' }, job: 'shy', solid: true, at: PL.shy });
    // ---------------- animals and quest things (in the town rigs)
    const A = towns.alba, M = towns.molinar;
    const catSleep = makeCat(A.rig, true), catSit = makeCat(A.rig, false);
    { const c = PL.hangout.catCrate; catSleep.root.position.set(c.x + 0.05, gy(c.x, c.z) + 0.12, c.z); catSleep.root.rotation.y = 0.4; }
    { const pa = PL.paloma; catSit.root.position.set(pa.x + 0.55, gy(pa.x, pa.z), pa.z + 0.35); catSit.root.rotation.y = 1.0; }
    const dog = { A: makeDog(M.rig, '#c97a3a'), x: PL.dogPath[0][0], z: PL.dogPath[0][1] + 1, yaw: 0, ph: 0, speed: 0 };
    const kite = makeKite(M.rig);
    const TR = PL.kiteTree, kiteHome = V3(TR.x + 1.6, gy(TR.x, TR.z) + 3.3, TR.z + 1.5);      // (snagged on the canopy's low edge, on the side you see from the road)
    kite.root.position.copy(kiteHome); kite.root.rotation.set(0.2, 2.3, 0.5);
    // ---------------- props
    const k = A.kit;
    // the smokers' corner: a bench against the wall, two crates, a cable-reel table with an ashtray, a radio and a bottle,
    // and a crate on its side by the wall (Michi sleeps in it)
    {
      const B = H.bench, gb = gy(B.x, B.z);
      k.at(B.x, gb, B.z, -Math.PI / 2);
      k.box(0, 0.44, 0, B.len, 0.08, 0.48, '#b07a48'); [-1, 1].forEach(s => { k.box(s * (B.len / 2 - 0.2), 0.2, 0.15, 0.1, 0.4, 0.1, '#7a5436'); k.box(s * (B.len / 2 - 0.2), 0.45, -0.2, 0.1, 0.9, 0.1, '#7a5436'); });
      k.box(0, 0.78, -0.22, B.len, 0.22, 0.06, '#c48a54', 0, -0.12);
      colliders.push({ obox: 1, x: B.x, z: B.z, hw: B.len / 2, hd: 0.3, rot: -Math.PI / 2 });
      const Tb = H.table, gt = gy(Tb.x, Tb.z);
      k.at(Tb.x, gt, Tb.z, 0.3);
      k.cyl(0, 0.05, 0, 0.55, 0.1, '#a8784e'); k.cyl(0, 0.36, 0, 0.2, 0.6, '#8a5f3e'); k.cyl(0, 0.68, 0, 0.58, 0.08, '#b88a58');
      k.cyl(0.18, 0.77, 0.1, 0.09, 0.09, '#9aa0ad'); k.ball(0.18, 0.8, 0.1, 0.06, '#5b5a66', 0.02, 0.06);        // the ashtray (a can)
      k.box(-0.2, 0.82, -0.12, 0.3, 0.18, 0.12, '#d9443a'); k.cyl(-0.3, 1.0, -0.12, 0.008, 0.25, '#2b2235'); k.ball(-0.12, 0.83, -0.05, 0.04, '#f4f1ea');   // the radio
      k.cyl(0.05, 0.84, -0.28, 0.05, 0.22, '#6fbf5a'); k.cyl(0.05, 0.98, -0.28, 0.02, 0.06, '#e0503f');          // a bottle
      colliders.push({ x: Tb.x, z: Tb.z, r: 0.62 });
      for (const c of H.crates) { k.at(c.x, gy(c.x, c.z), c.z, c.rot); k.box(0, 0.22, 0, 0.56, 0.44, 0.46, '#c49a62'); [-0.12, 0.12].forEach(y => k.box(0, 0.22 + y, 0.235, 0.58, 0.05, 0.02, '#8a5f3e')); colliders.push({ x: c.x, z: c.z, r: 0.38 }); }
      const cc = H.catCrate; k.at(cc.x, gy(cc.x, cc.z), cc.z, cc.rot);
      k.box(0, 0.02, 0, 0.66, 0.04, 0.5, '#c49a62'); k.box(0, 0.3, -0.24, 0.66, 0.6, 0.04, '#c49a62'); [-1, 1].forEach(s => k.box(s * 0.31, 0.3, 0, 0.04, 0.6, 0.5, '#b88a58')); k.box(0, 0.58, 0, 0.66, 0.04, 0.5, '#c49a62');
      k.box(0, 0.06, 0.02, 0.5, 0.06, 0.4, '#e8d6a8');            // a folded blanket
      colliders.push({ obox: 1, x: cc.x, z: cc.z, hw: 0.36, hd: 0.28, rot: cc.rot });
      // a string of little paper flags along the wall above the bench (strung between two poles)
      k.at(B.x, gb, B.z, -Math.PI / 2);
      [-1, 1].forEach(s => k.box(s * 1.75, 1.15, -0.3, 0.06, 2.3, 0.06, '#7a5436'));
      for (let i = 0; i < 9; i++) { const u = (i + 0.5) / 9, x = -1.7 + u * 3.4, y = 2.2 - Math.sin(u * Math.PI) * 0.28; k.add(GEO.cone, ['#e05a4b', '#f2c14e', '#4fb3d9', '#6cc35a'][i % 4], x, y, -0.28, 0.09, 0.2, 0.012, Math.PI, 0, 0); }
    }
    // the swearer's cart: one wheel on, the other lying in the grass, turnips everywhere, his toolbox
    {
      const Cc = PL.cart, gc = gy(Cc.x, Cc.z);
      k.at(Cc.x, gc, Cc.z, Cc.rot);
      k.box(0, 0.82, 0, 2.2, 0.5, 1.25, '#b07a48', 0, 0.16); k.box(0, 0.6, 0, 2.3, 0.08, 1.3, '#8a5f3e', 0, 0.16);
      [-1, 1].forEach(s => k.box(1.6, 0.62, s * 0.45, 1.6, 0.08, 0.08, '#7a5436', 0, 0.05));            // the shafts
      k.cyl(0, 0.55, -0.72, 0.55, 0.12, '#8a5f3e', Math.PI / 2); k.cyl(0, 0.55, -0.79, 0.12, 0.08, '#5b4030', Math.PI / 2);   // the wheel that held
      for (let i = 0; i < 4; i++) k.box(0, 0.55, -0.72, 0.06, 1.0, 0.04, '#6b4a2e', 0, 0, i * Math.PI / 4);
      k.box(0, 0.32, 0.55, 0.3, 0.6, 0.2, '#6b4a2e');                                                      // a block propping it up
      const wx = 0.9, wz = 1.55; k.cyl(wx, 0.07, wz, 0.55, 0.12, '#8a5f3e'); k.cyl(wx, 0.14, wz, 0.12, 0.06, '#5b4030');   // the fallen wheel
      for (let i = 0; i < 4; i++) k.box(wx, 0.13, wz, 1.0, 0.04, 0.06, '#6b4a2e', i * Math.PI / 4);
      const TURN = [[-0.6, 1.13, -0.2], [-0.2, 1.15, 0.15], [0.3, 1.12, -0.1], [0.65, 1.16, 0.2], [-0.4, 1.17, 0.35], [0.1, 1.2, -0.35], [1.25, 0.12, 0.95], [-1.0, 0.12, 1.95], [0.55, 0.12, 2.35], [1.75, 0.12, 2.05]];
      TURN.forEach(([x, y, z], i) => { k.ball(x, y, z, 0.16, i % 3 ? '#9a5ab0' : '#f4efe4', 0.14, 0.16); k.add(GEO.cone, '#6fae4a', x, y + 0.17, z, 0.05, 0.16, 0.05); });
      k.box(-1.5, 0.15, 1.1, 0.6, 0.3, 0.35, '#c9443a'); k.box(-1.5, 0.32, 1.1, 0.3, 0.05, 0.05, '#2b2235');   // the toolbox
      colliders.push({ obox: 1, x: Cc.x + Math.cos(Cc.rot) * 0.5, z: Cc.z - Math.sin(Cc.rot) * 0.5, hw: 1.9, hd: 0.78, rot: Cc.rot });
    }
    // the crate the man with the paper sits on, by Alba's corner store
    { const pm = PL.paperMan; k.at(pm.x, gy(pm.x, pm.z), pm.z, pm.yaw); k.box(0, 0.21, -0.05, 0.56, 0.42, 0.46, '#c49a62'); [-0.11, 0.11].forEach(y => k.box(0, 0.21 + y, 0.185, 0.58, 0.05, 0.02, '#8a5f3e')); colliders.push({ x: pm.x, z: pm.z, r: 0.38 }); }
    // ---------------- the stores (a kiosk each: counter, walls, roof, a striped awning, shelves of goods, a painted sign)
    const GOODS_COL = { 'w.juice': ['#f39a2b', 'box'], 'w.soda': ['#6fbf5a', 'bottle'], 'w.candy': ['#e86a9a', 'jar'], 'w.chocolate': ['#7a4a2e', 'bar'], 'w.gum': ['#4fb3d9', 'box'],
      'w.newspaper': ['#fbf6e7', 'paper'], 'w.icecream': ['#f6a6c1', 'jar'] };
    const signs = {};
    for (const [key, st] of Object.entries(PL.stores)) {
      const T = towns[st.town], kk = T.kit, gs = gy(st.x, st.z), W = 2.8, D = 2.0, Hh = 2.5, [A1, A2] = st.awn;
      kk.at(st.x, gs, st.z, st.yaw);
      kk.box(0, -0.05, 0, W + 0.5, 0.1, D + 1.4, '#c9b8a0');                                        // a stone step all round
      kk.box(0, 0.5, D / 2 - 0.25, W, 1.0, 0.5, '#b07a48'); kk.box(0, 1.03, D / 2 - 0.22, W + 0.12, 0.07, 0.62, '#8a5f3e');
      [-0.9, 0, 0.9].forEach(x => kk.box(x, 0.5, D / 2 + 0.005, 0.7, 0.75, 0.02, '#c48a54'));        // panels on the counter
      [-1, 1].forEach(s => kk.box(s * (W / 2 - 0.06), Hh / 2, 0, 0.12, Hh, D, '#f6ead6'));
      kk.box(0, Hh / 2, -D / 2 + 0.06, W, Hh, 0.12, '#f6ead6');
      kk.box(0, Hh + 0.07, 0, W + 0.34, 0.14, D + 0.34, '#8a5f3e');
      for (let i = 0; i < 7; i++) kk.box(-W / 2 + (i + 0.5) * W / 7, Hh - 0.18, D / 2 + 0.46, W / 7 + 0.005, 0.05, 1.0, i % 2 ? A2 : A1, 0, 0.36);
      for (let i = 0; i < 7; i++) kk.add(GEO.cone, i % 2 ? A2 : A1, -W / 2 + (i + 0.5) * W / 7, Hh - 0.42, D / 2 + 0.96, W / 14, 0.16, 0.03, Math.PI, 0, 0);
      [1.45, 1.95].forEach(y => kk.box(0, y, -D / 2 + 0.3, W - 0.34, 0.05, 0.4, '#c99a5a'));
      st.goods.forEach((id, i) => {
        const [col, kind] = GOODS_COL[id] || ['#ccc', 'box'], row = i % 2, x = -0.95 + Math.floor(i / 2) * 0.62, y = row ? 1.98 : 1.48, z = -D / 2 + 0.3;
        for (let j = 0; j < 3; j++) {
          const xx = x + (j - 1) * 0.17;
          if (kind === 'bottle') { kk.cyl(xx, y + 0.13, z, 0.05, 0.22, col); kk.cyl(xx, y + 0.27, z, 0.022, 0.06, '#e0503f'); }
          else if (kind === 'jar') { kk.cyl(xx, y + 0.1, z, 0.07, 0.16, '#e8f4f8'); kk.ball(xx, y + 0.1, z, 0.05, col); kk.cyl(xx, y + 0.19, z, 0.072, 0.03, '#e0503f'); }
          else if (kind === 'bar') kk.box(xx, y + 0.1, z, 0.12, 0.16, 0.04, j % 2 ? '#e0503f' : col);
          else if (kind === 'paper') kk.box(xx, y + 0.04 + j * 0.025, z, 0.2, 0.025, 0.28, col);
          else kk.box(xx, y + 0.09, z, 0.13, 0.15, 0.1, col);
        }
      });
      if (st.goods.includes('w.newspaper')) for (let j = 0; j < 4; j++) kk.box(0.7, 1.08 + j * 0.022, D / 2 - 0.25, 0.42, 0.02, 0.3, j % 2 ? '#f4efe0' : '#fbf6e7', 0.1 * j);
      kk.box(-0.75, 1.12, D / 2 - 0.25, 0.3, 0.12, 0.22, '#e8f4f8'); kk.ball(-0.75, 1.2, D / 2 - 0.25, 0.09, '#e86a9a', 0.05);   // a jar of sweets on the counter
      if (st.goods.includes('w.icecream')) {      // the ice-cream chest beside it, with a cone on a stick
        kk.box(W / 2 + 0.55, 0.42, 0.35, 0.8, 0.84, 0.7, '#f4f8fa'); kk.box(W / 2 + 0.55, 0.87, 0.35, 0.82, 0.07, 0.72, '#4fb3d9');
        kk.cyl(W / 2 + 0.55, 1.15, 0.05, 0.02, 0.5, '#8a5f3e'); kk.add(GEO.cone, '#e0b060', W / 2 + 0.55, 1.38, 0.05, 0.1, 0.22, 0.1, Math.PI, 0, 0); kk.ball(W / 2 + 0.55, 1.52, 0.05, 0.11, '#f6a6c1');
        colliders.push({ obox: 1, x: st.x + Math.cos(st.yaw) * (W / 2 + 0.55) + Math.sin(st.yaw) * 0.35, z: st.z - Math.sin(st.yaw) * (W / 2 + 0.55) + Math.cos(st.yaw) * 0.35, hw: 0.42, hd: 0.37, rot: st.yaw });
      }
      // crates of soda by the side, and a stool for the keeper
      kk.box(-W / 2 - 0.45, 0.17, 0.5, 0.5, 0.34, 0.4, '#d9443a'); for (let j = 0; j < 6; j++) kk.cyl(-W / 2 - 0.62 + (j % 3) * 0.17, 0.4, 0.4 + Math.floor(j / 3) * 0.2, 0.04, 0.14, '#6fbf5a');
      kk.box(-W / 2 - 0.45, 0.51, 0.5, 0.5, 0.34, 0.4, '#d9443a', 0.3);
      colliders.push({ obox: 1, x: st.x, z: st.z, hw: W / 2 + 0.12, hd: D / 2 + 0.12, rot: st.yaw });
      colliders.push({ x: st.x + Math.cos(st.yaw) * (-W / 2 - 0.45) + Math.sin(st.yaw) * 0.5, z: st.z - Math.sin(st.yaw) * (-W / 2 - 0.45) + Math.cos(st.yaw) * 0.5, r: 0.36 });
      // the sign on the roof (its name on both faces: from behind the kiosk it was blank wood)
      const sg = board(2.5, 0.6, (c, w, h) => {
        const text = plainC(SIGN_TEXT[key][dl()]);
        c.fillStyle = '#8a5f3e'; roundRect(c, 3, 3, w - 6, h - 6, 22); c.fill();
        c.fillStyle = '#fdf3dc'; roundRect(c, 13, 13, w - 26, h - 26, 16); c.fill();
        c.strokeStyle = A1; c.lineWidth = 6; roundRect(c, 24, 24, w - 48, h - 48, 10); c.stroke();
        fitText(c, text, w - 90, 76, '900'); c.fillStyle = '#2b2235'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, w / 2, h / 2 + 4);
        c.fillStyle = A1; [[38, h / 2], [w - 38, h / 2]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 9, 0, TAU); c.fill(); });
      }, 512, true);
      const sp = kk.world(0, Hh + 0.47, D / 2 - 0.05); sg.position.copy(sp); sg.rotation.y = st.yaw; T.g.add(sg);
      T.boards.push({ mesh: sg, key: () => dl() + (cjkGame() ? CJK.mode() : '') });      // (zh / ja: repainted when the mode changes too)
      signs[key] = sg;
    }
    // Molinar: the dominoes table and stools, the kite tree, the A-frame sign with the typo
    {
      const kk = M.kit, DMx = PL.dominoes, gd = gy(DMx.x, DMx.z);
      kk.at(DMx.x, gd, DMx.z, 0.2);
      kk.box(0, 0.7, 0, 0.95, 0.06, 0.95, '#8a5f3e'); [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => kk.box(a * 0.38, 0.34, b * 0.38, 0.07, 0.68, 0.07, '#6b4a2e'));
      for (let i = 0; i < 9; i++) { const a = i * 0.7, r = 0.1 + (i % 3) * 0.1; kk.box(Math.cos(a) * r, 0.745, Math.sin(a) * r, 0.11, 0.025, 0.055, '#fbf6e7', a); }
      colliders.push({ x: DMx.x, z: DMx.z, r: 0.62 });
      [0, 1, 2].forEach(i => { const a = Math.PI / 2 + i * (TAU / 3), x = DMx.x + Math.sin(a) * 0.95, z = DMx.z + Math.cos(a) * 0.95; kk.at(x, gy(x, z), z, 0); kk.cyl(0, 0.22, 0, 0.2, 0.44, '#a8784e'); colliders.push({ x, z, r: 0.32 }); });
      const TRx = PL.kiteTree, gt = gy(TRx.x, TRx.z);
      kk.at(TRx.x, gt, TRx.z, 0);
      kk.cyl(0, 1.6, 0, 0.26, 3.2, '#8a5f3e'); kk.add(GEO.cyl, '#8a5f3e', -0.5, 3.0, 0.3, 0.09, 1.3, 0.09, 0.5, 0, 0.7);
      [[0, 4.3, 0, 1.55], [-1.0, 3.8, 0.5, 1.15], [0.9, 3.7, -0.4, 1.2], [0.1, 3.5, 1.0, 1.05], [-0.3, 5.1, -0.2, 1.0]].forEach(([x, y, z, r], i) => kk.add(GEO.ico, i % 2 ? '#5aa84a' : '#4c9a40', x, y, z, r, r * 0.86, r));
      colliders.push({ x: TRx.x, z: TRx.z, r: 0.4 });
      const SG = PL.sign; kk.at(SG.x, gy(SG.x, SG.z), SG.z, SG.yaw);
      kk.box(0, 0.5, 0.18, 0.72, 1.0, 0.04, '#8a5f3e', 0, -0.2); kk.box(0, 0.5, -0.18, 0.72, 1.0, 0.04, '#8a5f3e', 0, 0.2); kk.box(0, 0.98, 0, 0.6, 0.06, 0.06, '#6b4a2e');
      colliders.push({ obox: 1, x: SG.x, z: SG.z, hw: 0.4, hd: 0.3, rot: SG.yaw });
      const chalkDraw = (c, w, h) => {
        const fixed = !!(G && (S().q.sign || 0) >= 2), T0 = SIGN_TYPO[dl()];
        c.fillStyle = '#2f3b34'; c.fillRect(0, 0, w, h); c.strokeStyle = '#f4f1e4'; c.lineWidth = 4; c.strokeRect(14, 14, w - 28, h - 28);
        c.fillStyle = '#f4f1e4'; c.textAlign = 'center'; c.textBaseline = 'middle';
        // (zh / ja in characters: one line per word of the notation, punctuation kept with the word before it)
        const raw = fixed ? T0.right : T0.wrong, cj = cjkGame(), chars = cj && CJK.mode(dl()) === 'chars', sep = chars ? '' : ' ', words = [];
        if (chars) (raw.match(/\[[^\]]*\]\S*|\S+/g) || []).forEach(t => { const p = plainC(t); if (/^[。、，！？!?]+$/.test(p) && words.length) words[words.length - 1] += p; else words.push(p); });
        else words.push(...(cj ? plainC(raw) : raw).split(' '));
        if (fixed) words.forEach((x, i) => { words[i] = x.toUpperCase(); });
        const lines = words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(sep), words.slice(Math.ceil(words.length / 2)).join(sep)] : words;
        lines.forEach((s, i) => { fitText(c, s, w - 50, 92, '900'); c.font = c.font.replace('Bahnschrift', '"Segoe Print", "Ink Free", Bahnschrift'); c.fillText(s, w / 2, h * (0.32 + i * 0.26)); });
        c.fillStyle = '#f6a6c1'; c.beginPath(); c.arc(w / 2, h * 0.85, 22, 0, TAU); c.fill(); c.fillStyle = '#e0b060'; c.beginPath(); c.moveTo(w / 2 - 20, h * 0.86); c.lineTo(w / 2 + 20, h * 0.86); c.lineTo(w / 2, h * 0.97); c.closePath(); c.fill();
      };
      const chalkKey = () => dl() + (cjkGame() ? CJK.mode() : '') + ((G && (S().q.sign || 0) >= 2) ? '!' : '');
      const chalk = board(0.62, 0.86, chalkDraw, 256);
      chalk.position.copy(kk.world(0, 0.51, 0.245)); chalk.rotation.order = 'YXZ'; chalk.rotation.set(-0.2, SG.yaw, 0);
      M.g.add(chalk); M.boards.push({ mesh: chalk, key: chalkKey });
      // (the A-frame's other side says it too: from the kiosk's counter you saw only bare wood)
      const chalkB = board(0.62, 0.86, chalkDraw, 256);
      chalkB.position.copy(kk.world(0, 0.51, -0.245)); chalkB.rotation.order = 'YXZ'; chalkB.rotation.set(-0.2, SG.yaw + Math.PI, 0);
      M.g.add(chalkB); M.boards.push({ mesh: chalkB, key: chalkKey });
      signs.chalk = chalk; signs.chalkBack = chalkB;
    }
    // Remanso: a little table and two stools by the kiosk, under a parasol
    {
      const R2 = towns.remanso, kk = R2.kit, st = PL.stores.remanso, tx = st.x + 2.6, tz = st.z + 2.0, g2 = gy(tx, tz);
      kk.at(tx, g2, tz, 0); kk.cyl(0, 0.36, 0, 0.05, 0.72, '#6b6a78'); kk.cyl(0, 0.72, 0, 0.42, 0.05, '#f4f1ea'); kk.cyl(0, 1.4, 0, 0.03, 1.4, '#8a5f3e');
      for (let i = 0; i < 8; i++) kk.add(GEO.cone, i % 2 ? '#fff4e4' : '#2f8f8a', Math.sin(i / 8 * TAU) * 0.55, 2.02, Math.cos(i / 8 * TAU) * 0.55, 0.42, 0.3, 0.42, -0.5, i / 8 * TAU + Math.PI, 0);
      kk.add(GEO.cone, '#2f8f8a', 0, 2.22, 0, 1.15, 0.4, 1.15);
      colliders.push({ x: tx, z: tz, r: 0.48 });
    }
    // ---------------- bake the props, make the people meshes
    for (const T of Object.values(towns)) {
      if (T.kit.P.length) T.g.add(inked(T.kit.P, 0.016, 'tl-props-' + T.key));
      T.rig.meshes(T.g);
    }
    // ---------------- smoke: puffs from the cigarettes and the smokers' mouths (Alba), like the chimneys' (town.js)
    const SMOKE_N = 40, smoke = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), TK.toon('#f4f2ee', { rim: 0.25 }), SMOKE_N);
    const smokeInk = new THREE.InstancedMesh(smoke.geometry, TK.outlineMat(0.06), SMOKE_N); smokeInk.instanceMatrix = smoke.instanceMatrix;
    smoke.frustumCulled = smokeInk.frustumCulled = false; smoke.name = 'tl-smoke'; smoke.castShadow = false; A.g.add(smoke, smokeInk);
    const puffs = Array.from({ length: SMOKE_N }, () => ({ life: 1, max: 1, x: 0, y: -50, z: 0, vx: 0, vy: 0, vz: 0, size: 0.1 }));
    let puffNext = 0;
    const puff = (x, y, z, size, vx, vy, vz, max) => { const p = puffs[puffNext]; puffNext = (puffNext + 1) % SMOKE_N; Object.assign(p, { life: 0, max, x, y, z, vx, vy, vz, size }); };
    const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), sv = V3(1, 1, 1), pv = V3(0, 0, 0);
    function updateSmoke(dt, t) {
      for (let i = 0; i < SMOKE_N; i++) {
        const p = puffs[i];
        if (p.life < p.max) { p.life += dt; p.x += (p.vx + Math.sin(t * 0.7 + i) * 0.12) * dt; p.y += p.vy * dt; p.z += (p.vz + 0.08) * dt; p.vy *= 1 - dt * 0.4; }
        const k = clamp(p.life / p.max, 0, 1), s = p.life >= p.max ? 0.0001 : p.size * (0.5 + k * 1.6) * (k > 0.7 ? (1 - k) / 0.3 : 1);
        m4.compose(pv.set(p.x, p.y, p.z), q0, sv.set(s, s, s)); smoke.setMatrixAt(i, m4);
      }
      smoke.instanceMatrix.needsUpdate = true;
    }
    // ---------------- per frame
    const v = V3(0, 0, 0);
    function think(p, dt, t, you) {
      const S = p.S, d = p.spec, api = p.api;
      const dY = you ? Math.hypot(you.x - S.x, you.z - S.z) : 99, was = S.near;
      S.near = dY < (was ? 3.6 : 3.0) || api.talking;
      if (S.near && !was && !api.talking && d.job !== 'read' && d.job !== 'domino') S.wave = 1.2;
      const toYou = you ? Math.atan2(you.x - S.x, you.z - S.z) : S.yaw;
      S.lookAt = dY < 6 ? toYou : undefined;
      S.speed = 0; S.pose = null; S.hop = 0; S.chatTalk = false; S.crouch = 0;
      const face = (yaw, kk = 5) => { S.yaw = dampAngle(S.yaw, yaw, kk, dt); };
      const at = d.at;
      switch (d.job) {
        case 'smoke': {
          if (api.talking) { S.pose = 'gesture'; S.drag = 0; break; }
          if (S.drag > 0) { S.drag -= dt; S.pose = 'smoke'; if (S.drag <= 0) { S.exhale = 1.4; S.smokeT = 5 + Math.random() * 6; } }
          else if ((S.smokeT -= dt) <= 0) S.drag = 1.8;
          if (S.exhale > 0) S.exhale -= dt;
          if (!S.near && (t * 0.23 + S.seed * 5) % 4 < 1.2) S.pose = S.pose || 'gesture';      // they chat among themselves
          break;
        }
        case 'swear': {
          if (S.near) { face(toYou, 4); if ((S.fist -= dt) > 0) S.pose = 'fist'; break; }
          face(at.yaw, 3); S.pose = 'hammer'; S.crouch = 1;
          if ((S.fist -= dt) <= -6 - S.seed * 4) S.fist = 1.8;
          if (S.fist > 0) { S.pose = 'fist'; S.crouch = 0; }
          break;
        }
        case 'keeper': {
          if (S.near) { face(toYou, 4); break; }
          face(at.yaw, 3);
          const c = (t * 0.11 + S.seed * 7) % 1; S.pose = c < 0.2 ? 'arrange' : null;
          if (d.sleepy && (S.yawn -= dt) < 0) { S.pose = 'yawn'; if (S.yawn < -2.2) S.yawn = 8 + Math.random() * 10; }
          break;
        }
        case 'read': S.pose = S.near ? null : 'read'; break;
        case 'chat': {
          const o = P[d.other]; if (!o) break;
          if (S.near || o.S.near) { face(toYou); break; }
          face(Math.atan2(o.S.x - S.x, o.S.z - S.z));
          const turn = Math.floor(t / 2.7 + (d.id === 'gossipA' ? 0 : 1)) % 2 === 0;
          S.chatTalk = turn; S.pose = 'chat'; S.nod = !turn && Math.sin(t * 0.9) > 0.3;
          break;
        }
        case 'domino': {
          const c = { x: PL.dominoes.x, z: PL.dominoes.z };
          face(Math.atan2(c.x - S.x, c.z - S.z), 3);
          S.pose = 'domino';
          if ((S.slam -= dt) < 0) { S.pose = 'slam'; if (S.slam < -0.5) S.slam = 4 + Math.random() * 8; }
          break;
        }
        case 'kite': {
          const st = G ? (S0q('kite')) : 0;
          if (st >= 2 && !api.talking) {        // he flies it round and round
            const a = t * 0.35, r = 1.4, cx = at.x + 0.3, cz = at.z + 0.2;
            const nx = cx + Math.cos(a) * r, nz = cz + Math.sin(a) * r;
            S.speed = Math.hypot(nx - S.x, nz - S.z) / Math.max(dt, 1e-3); if (S.speed > 0.05) face(Math.atan2(nx - S.x, nz - S.z), 8);
            S.x = nx; S.z = nz; S.speed = Math.min(S.speed, 2); S.pose = 'kite';
            break;
          }
          if (S.near) { face(toYou); break; }
          face(Math.atan2(PL.kiteTree.x - S.x, PL.kiteTree.z - S.z), 3); S.pose = 'up';
          if ((t + S.seed * 5) % 5 < 0.6) S.hop = Math.abs(Math.sin(((t + S.seed * 5) % 5) / 0.6 * Math.PI)) * 0.25;
          break;
        }
        case 'paloma': {
          const st = G ? S0q('cat') : 0;
          if (S.near) { face(toYou); if (st < 3) S.pose = 'sad'; break; }
          face(at.yaw, 3); S.pose = st >= 3 ? 'pet' : 'sad'; if (st >= 3) S.crouch = 0.6;
          break;
        }
        case 'sweep': {
          if (S.near) { face(toYou); break; }
          S.pose = 'sweep';
          const tg = S.dir > 0 ? d.path[1] : d.path[0];
          if (moveTo(S, tg[0], tg[1], 0.3, dt)) S.dir = -S.dir;
          S.yaw = dampAngle(S.yaw, Math.atan2(tg[0] - S.x, tg[1] - S.z) + Math.PI / 2 + Math.sin(t * 0.3) * 0.4, 3, dt); S.speed = 0.25;
          break;
        }
        case 'walk': {
          if (S.near) { face(toYou); break; }
          if (S.pause > 0) { S.pause -= dt; break; }
          const tg = d.path[S.i];
          if (moveTo(S, tg[0], tg[1], d.speed || 1.2, dt)) {
            if (S.i === 0 || S.i === d.path.length - 1) S.pause = 2 + Math.random() * 2;
            if (S.i === d.path.length - 1) S.dir = -1; else if (S.i === 0) S.dir = 1;
            S.i += S.dir;
          }
          break;
        }
        case 'vale': {
          const st = G ? S0q('shy') : 0;
          if (st >= 2 && !S.near) { const j = P.shy; face(Math.atan2(j.S.x - S.x, j.S.z - S.z), 3); S.pose = 'chat'; S.chatTalk = Math.floor(t / 2.4) % 2 === 0; break; }
          if (S.near) { face(toYou); break; }
          face(at.yaw, 3); S.pose = (t * 0.13 + S.seed) % 1 < 0.45 ? 'arrange' : null;
          break;
        }
        case 'shy': {
          const st = G ? S0q('shy') : 0, V = P.vale;
          if (st >= 2) {        // next to Vale now, chatting
            const tx = V.S.x - 1.0, tz = V.S.z + 0.4;
            if (Math.hypot(tx - S.x, tz - S.z) > 0.08) { moveTo(S, tx, tz, 1.1, dt); face(Math.atan2(tx - S.x, tz - S.z), 6); break; }
            if (S.near) { face(toYou); break; }
            face(Math.atan2(V.S.x - S.x, V.S.z - S.z), 3); S.pose = 'chat'; S.chatTalk = Math.floor(t / 2.4) % 2 === 1; break;
          }
          if (S.near) { face(toYou); S.pose = 'shy'; break; }
          const peek = Math.sin(t * 0.5 + S.seed * 4) > 0.2;
          face(peek ? Math.atan2(V.S.x - S.x, V.S.z - S.z) : at.yaw + 1.2, 2); S.pose = 'shy';
          break;
        }
        default: break;
      }
    }
    function moveTo(S, tx, tz, v0, dt) {
      const dx = tx - S.x, dz = tz - S.z, dd = Math.hypot(dx, dz);
      if (dd < 0.05) { S.speed = 0; return true; }
      const st = Math.min(dd, v0 * dt); S.x += (dx / dd) * st; S.z += (dz / dd) * st; S.speed = v0;
      S.yaw = dampAngle(S.yaw, Math.atan2(dx, dz), 7, dt);
      return dd - st < 0.05;
    }
    function pose(p, dt, t) {
      const S = p.S, R = p.R, d = p.spec, P0 = R.props, api = p.api;
      if (p.hidden) { R.root.scale.setScalar(0.0001); R.root.position.set(S.x, -50, S.z); R.root.updateMatrixWorld(true); return; }
      R.root.scale.setScalar(d.look.h || 1);
      const legsSeat = S.sit && R.legs ? 0.3 : 0, g0 = gy(S.x, S.z);
      R.root.position.set(S.x, g0 + (S.sit ? S.seat - legsSeat - 0.02 : 0) - S.crouch * 0.18, S.z); R.root.rotation.y = S.yaw;
      const walk = clamp(S.speed / 1.3, 0, 1.6);
      if (S.speed > 0.05) S.phase += dt * (3.0 + S.speed * 2.6); else S.phase = damp(S.phase, Math.round(S.phase / Math.PI) * Math.PI, 8, dt);
      const ph = S.phase, sw = Math.sin(ph);
      S.talk = damp(S.talk, api.talking || S.chatTalk ? 1 : 0, 10, dt);
      R.body.scale.set(1, (S.sit ? 0.82 : 1) * (1 + Math.sin(t * 2.2 + S.seed * 9) * 0.014), 1);
      R.body.position.y = Math.abs(sw) * 0.05 * Math.min(walk, 1.2) + S.talk * Math.abs(Math.sin(t * 13)) * 0.03 + S.hop;
      R.body.rotation.z = sw * 0.05 * walk + Math.sin(t * 1.2 + S.seed * 9) * 0.02;
      const bend = { arrange: 0.22, sweep: 0.12, hammer: 0.55, pet: 0.5, slam: 0.15, domino: 0.12, sad: 0.04 }[S.pose] || 0;
      R.body.rotation.x = bend + walk * 0.05 + (S.pose === 'yawn' ? -0.12 : 0);
      R.body.rotation.y = S.pose === 'sweep' ? Math.sin(t * 4.2) * 0.12 : 0;
      if (R.legs) R.legs.forEach((hip, i) => { hip.rotation.x = S.sit ? -1.25 : S.crouch ? -0.9 * S.crouch * (i ? 1 : 0.4) : Math.sin(ph + i * Math.PI) * 0.6 * walk; });
      else R.feet.forEach((f, i) => { const s = i ? 1 : -1; if (S.sit) f.position.set(s * 0.13, -0.56, 0.36); else f.position.set(s * 0.13 * (d.look.w || 1), 0.04 + Math.max(0, Math.sin(ph + i * Math.PI)) * 0.06 * walk, 0.12 + Math.sin(ph + i * Math.PI) * 0.13 * walk); });
      let aL = [-0.5 + sw * 0.5 * walk, 0, 0.2], aR = [-0.5 - sw * 0.5 * walk, 0, -0.2];
      switch (S.pose) {
        case 'smoke': { const k = clamp(Math.min((1.8 - S.drag) / 0.45, S.drag / 0.45), 0, 1); aR = [lerp(-0.6, -2.35, easeInOut(k)), 0, lerp(-0.25, 0.45, k)]; break; }
        case 'gesture': aR = [-0.95 + Math.sin(t * 3 + S.seed * 5) * 0.25, 0, -0.35 - Math.sin(t * 1.7) * 0.2]; break;
        case 'hammer': { const k = Math.max(0, Math.sin(t * 7)); aR = [-1.0 - k * 1.3, 0, -0.15]; aL = [-0.9, 0, 0.35]; break; }
        case 'fist': aR = [-2.6 + Math.sin(t * 14) * 0.25, 0, -0.25]; aL = [-0.4, 0, 0.3]; break;
        case 'sweep': { const s = Math.sin(t * 4.2); aL = [-0.95, 0, 0.35 + s * 0.15]; aR = [-0.75, 0, -0.3 + s * 0.15]; if (P0.broom) P0.broom.rotation.set(0.35, 0, s * 0.45); break; }
        case 'arrange': { const s = Math.sin(t * 3); aL = [-1.15 + s * 0.15, 0, 0.25]; aR = [-1.15 - s * 0.15, 0, -0.25]; break; }
        case 'yawn': aL = [-2.9, 0, 0.5]; aR = [-2.9, 0, -0.5]; break;
        case 'read': aL = [-1.35, 0, 0.45]; aR = [-1.35, 0, -0.45]; break;
        case 'chat': if (S.chatTalk) aR = [-1.0 + Math.sin(t * 5) * 0.25, 0, -0.35 - Math.sin(t * 2.5) * 0.25]; break;
        case 'domino': aL = [-0.95, 0, 0.3]; aR = [-0.95, 0, -0.3]; break;
        case 'slam': { const k = Math.abs(Math.sin(t * 9)); aR = [-1.5 + k * 0.6, 0, -0.2]; aL = [-0.95, 0, 0.3]; break; }
        case 'up': aR = [-2.5, 0, -0.3]; aL = [-0.4, 0, 0.3]; break;
        case 'kite': aR = [-2.4, 0, -0.25]; break;
        case 'sad': aL = [-0.3, 0, 0.1]; aR = [-0.3, 0, -0.1]; break;
        case 'pet': aR = [-1.2 + Math.sin(t * 3) * 0.15, 0, -0.1]; break;
        case 'shy': aL = [0.35, 0, 0.15]; aR = [0.35, 0, -0.15]; break;
      }
      if (S.sit && !S.pose) { aL = [-0.75, 0, 0.3]; aR = [-0.75, 0, -0.3]; }
      if (S.sit && S.pose === 'gesture') aL = [-0.75, 0, 0.3];
      if (S.wave > 0 && !['hammer', 'read', 'sweep', 'kite'].includes(S.pose)) { S.wave -= dt; aR = [-0.3, 0, -2.4 + Math.sin(t * 9) * 0.35]; }
      R.arms[0].rotation.set(...aL); R.arms[1].rotation.set(...aR);
      if (P0.paper) { const up = S.pose === 'read'; P0.paper.position.set(0, up ? 1.05 : 0.62, up ? 0.34 : 0.3); P0.paper.rotation.x = up ? 0 : -1.2; }
      if (P0.ember) P0.ember.scale.setScalar(0.016 * (S.pose === 'smoke' && S.drag < 1.2 && S.drag > 0.4 ? 1.7 : 1 + Math.sin(t * 5 + S.seed * 3) * 0.15));
      // the head: looks at you when you're close; up at the kite; down when sad; back when yawning
      let hy, hx = 0;
      if (S.lookAt !== undefined && S.pose !== 'read') { hy = clamp(angDiff(S.yaw + R.body.rotation.y, S.lookAt), -1.2, 1.2); hx = -0.05; }
      else hy = Math.sin(t * 0.37 + S.seed * 20) * (S.speed > 0.1 ? 0.15 : 0.5);
      if (S.pose === 'up' || S.pose === 'kite') { hx = -0.55; if (S.lookAt === undefined) hy = 0; }
      if (S.pose === 'sad') hx += 0.35;
      if (S.pose === 'yawn') hx -= 0.45;
      if (S.pose === 'smoke') hx -= 0.12;
      if (S.pose === 'domino' || S.pose === 'slam' || S.pose === 'arrange' || S.pose === 'pet') hx += 0.3;
      if (S.nod) hx += Math.max(0, Math.sin(t * 6)) * 0.12;
      R.head.rotation.y = damp(R.head.rotation.y, hy, 5, dt); R.head.rotation.x = damp(R.head.rotation.x, hx, 6, dt);
      if ((S.blink -= dt) < 0) { if (S.blink < -0.12) S.blink = 2 + Math.random() * 3.5; }
      const bl = S.blink < 0 || S.pose === 'yawn' ? 0.12 : 1;
      R.eyes.forEach(e => { e.scale.y = bl; });
      R.mouth.scale.y = S.pose === 'yawn' ? 0.06 : S.talk > 0.3 ? 0.012 + Math.abs(Math.sin(t * 16)) * 0.035 : 0.012;
      R.root.updateMatrixWorld(true);
      // smoke: a thin trail from the tip, and a big puff after each drag
      if (P0.ember && d.job === 'smoke') {
        if (Math.random() < dt * 2.2) { P0.ember.getWorldPosition(v); puff(v.x, v.y + 0.02, v.z, 0.035, 0, 0.35, 0, 2.2); }
        if (S.exhale > 0 && Math.random() < dt * 9) { R.head.localToWorld(v.set(0, 0.07, 0.3)); const fx = Math.sin(S.yaw), fz = Math.cos(S.yaw); puff(v.x, v.y, v.z, 0.07, fx * 0.5, 0.28, fz * 0.5, 2.6); }
      }
    }
    // the dog trots after its walker; the cats; the kite in the tree, falling, or flying
    let kiteFall = null;
    function animals(dt, t) {
      const W = P.walker, dg = dog;
      if (W) {
        const back = { x: W.S.x - Math.sin(W.S.yaw) * 1.3 + Math.cos(W.S.yaw) * 0.6, z: W.S.z - Math.cos(W.S.yaw) * 1.3 - Math.sin(W.S.yaw) * 0.6 };
        const dx = back.x - dg.x, dz = back.z - dg.z, dd = Math.hypot(dx, dz);
        dg.speed = dd > 0.25 ? Math.min(3, dd * 2.2) : 0;
        if (dg.speed > 0) { dg.x += dx / dd * dg.speed * dt; dg.z += dz / dd * dg.speed * dt; dg.yaw = dampAngle(dg.yaw, Math.atan2(dx, dz), 8, dt); }
        dg.ph += dt * (2 + dg.speed * 5);
        const D0 = dg.A; D0.root.position.set(dg.x, gy(dg.x, dg.z), dg.z); D0.root.rotation.y = dg.yaw;
        D0.legs.forEach((l, i) => { l.rotation.x = dg.speed > 0.1 ? Math.sin(dg.ph + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.6 : 0; });
        D0.tail.rotation.z = Math.sin(t * 12) * 0.6; D0.body.position.y = dg.speed > 0.1 ? Math.abs(Math.sin(dg.ph)) * 0.05 : 0;
        D0.head.rotation.x = dg.speed > 0.1 ? 0 : Math.sin(t * 2) * 0.1;
        D0.root.updateMatrixWorld(true);
      }
      const cs = G ? S0q('cat') : 0;
      catSleep.root.scale.setScalar(cs === 1 ? 1 : 0.0001); catSleep.body.scale.y = 1 + Math.sin(t * 1.6) * 0.05; catSleep.root.updateMatrixWorld(true);
      catSit.root.scale.setScalar(cs >= 3 ? 1 : 0.0001); if (catSit.tail) catSit.tail.rotation.z = Math.sin(t * 1.7) * 0.4; catSit.root.updateMatrixWorld(true);
      // the kite
      const ks = G ? S0q('kite') : 0, kid = P.kid;
      if (kiteFall && ks >= 2 && kiteFall.done) kiteFall = null;
      if (kiteFall) {        // falling (then held where it landed until the quest step is saved)
        if (!kiteFall.done) {
          kiteFall.t += dt; const k = Math.min(1, kiteFall.t / 1.6), e = k * k;
          kite.root.position.set(lerp(kiteFall.a.x, kiteFall.b.x, k) + Math.sin(k * 9) * 0.3 * (1 - k), lerp(kiteFall.a.y, kiteFall.b.y, e), lerp(kiteFall.a.z, kiteFall.b.z, k));
          kite.root.rotation.z = Math.sin(k * 7) * 0.6;
          if (k >= 1) kiteFall.done = true;
        } else kite.root.position.copy(kiteFall.b);
      } else if (ks >= 2 && kid) {
        const hand = kid.R.arms[1].userData.hand; hand.getWorldPosition(_a);
        const wind = t * 0.6, tx = kid.S.x - 3.2 + Math.sin(wind) * 1.2, tz = kid.S.z + 2.6 + Math.cos(wind * 0.7) * 1.0, ty = gy(kid.S.x, kid.S.z) + 6.2 + Math.sin(t * 1.3) * 0.5;
        kite.root.position.set(damp(kite.root.position.x, tx, 2, dt), damp(kite.root.position.y, ty, 2, dt), damp(kite.root.position.z, tz, 2, dt));
        kite.root.rotation.set(0.3, Math.atan2(_a.x - kite.root.position.x, _a.z - kite.root.position.z), Math.sin(t * 2) * 0.3);
      } else if (ks < 2) { kite.root.position.copy(kiteHome); kite.root.rotation.set(0.2, 2.3, 0.5 + Math.sin(t * 1.4) * 0.05); }
      kite.tail.forEach((n, i) => { n.position.x = Math.sin(t * 4 + i) * 0.06 * (i + 1); });
      kite.root.updateMatrixWorld(true);
      if (ks >= 2 && kid && !kiteFall) { kid.R.arms[1].userData.hand.getWorldPosition(_a); kite.root.localToWorld(_b.set(0, 0, 0)); stretch(kite.string, _a, _b); }
      else { kite.string.scale.set(0.008, 0.001, 0.008); kite.string.position.set(0, -60, 0); kite.string.updateMatrixWorld(true); }
    }
    const S0q = key => ((G.state.tl && G.state.tl.q) || {})[key] || 0;
    function update(dt, t, you) {
      if (G) { const Y = G.sim.you; U.uFocus.value.set(Y.x, Y.ry + 1.0, Y.z); }
      const l = lang();
      const focus = you || (G ? { x: G.sim.you.x, z: G.sim.you.z } : { x: -10, z: -150 });
      for (const T of Object.values(towns)) {
        const c = TOWN_C[T.key], on = Math.hypot(focus.x - c.x, focus.z - c.z) < c.show;
        T.g.visible = on;
        if (!on) continue;
        for (const p of T.list) { p.hidden = !!(p.spec.lang && p.spec.lang !== realLang()); if (!p.hidden) think(p, dt, t, you); pose(p, dt, t); }     // (one trio and one sailor per language: zh / ja have their own)
        for (const b of T.boards) b.mesh.userData.redraw(b.key());
      }
      if (towns.alba.g.visible) updateSmoke(dt, t);
      if (towns.alba.g.visible || towns.molinar.g.visible) animals(dt, t);
      for (const T of Object.values(towns)) if (T.g.visible) T.rig.sync();
      carryUpdate(dt, t);
    }
    // the draw cost, for tests (what's drawn right now)
    function stats() {
      let tris = 0, calls = 0;
      const shown = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
      root.traverse(o => { if (o.isMesh && shown(o)) { const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += n * (o.isInstancedMesh ? o.count : 1); calls++; } });
      return { tris: Math.round(tris), calls, people: people.length, solids: colliders.length, towns: Object.fromEntries(Object.values(towns).map(T => [T.key, { visible: T.g.visible, people: T.list.length, parts: T.rig.count }])) };
    }
    built = { root, towns, P, people, colliders, signs, kite, kiteHome, catSleep, catSit, dog, seatApi, goyoApi, gy, startKiteFall(to) { kiteFall = { t: 0, a: kite.root.position.clone(), b: to, done: false }; }, get kiteFalling() { return !!kiteFall && !kiteFall.done; } };
    return { colliders, platforms: [], group: root, people, update, stats, landmarks: PL };
  }
  // ================================================================ the game side
  const LNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  const lock = on => { if (G) G.sim.lock = on ? 1 : 0; };
  const exclaim = w => (cjkGame() ? w + (/[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]$/i.test(w) ? '!' : '！') : lang() === 'es' ? '¡' + cap(w) + '!' : cap(w) + '!');
  const pickOne = a => a[(Math.random() * a.length) | 0];
  const sound = (...a) => { if (typeof Sound !== 'undefined') Sound.play(...a); };
  // say it out loud (the 🔊 button tells you if there's no voice for the language; the automatic one stays quiet). zh / ja:
  // the notation, through CJK.say (the characters, with a zh-CN / ja-JP voice)
  const say = (text, quiet) => {
    if (typeof Sound === 'undefined' || !Sound.say) return;
    const ok = cjkGame() ? CJK.say(text, realLang()) : Sound.say(String(text).replace(/[¡!¿?«»„“"]/g, ''), lang());
    if (!ok && !quiet && typeof UI !== 'undefined') UI.toast('No voice for this language is installed on this PC');
  };
  const think = (text, s) => STORY.think(fillVars(text), s);
  const you = text => STORY.you(fillVars(text));
  LT['tl.goyo.soda'] = T('¡Un refresco! ¡Carajo, qué amable! Toma, por las molestias.', 'Um refrigerante! Porra, que gentileza! Toma, pelo trabalho.', 'Eine Limo! Verdammt, wie nett! Hier, für die Mühe.', 'A {w.soda}! Damn, how kind! Here, for your trouble.');
  // A line over someone (a person's api: { name, x, z, y, top }): STORY.sayInline, the weave, waits for E. The bleeper beeps.
  function speak(p, L, vars) {
    const { text, en } = lineOf(L, vars);
    if (bleepOn() && /\*\*\*/.test(text)) { sound('pip'); setTimeout(() => sound('pip'), 90); }
    if (STORY.sayInline) {      // (zh / ja: the line in the notation when there is one, else the English weave)
      p.lines = { en };
      if (text) { if (cjkGame()) p.lines[realLang()] = text; else { p.lines[lang()] = text; if (typeof UI !== 'undefined') p.lines[UI.lang] = text; } }
      return STORY.sayInline(p);
    }
    STORY.think(`${p.name}: «${plainC(text) || en}»`, 4); return STORY.wait(2.4);
  }
  // what you've learned (state.tl.phr: { id: { n, ok, t } }); LEX only marks it seen (see the top of the file)
  function learnPhrase(id, r) {
    const st = S(), rec = st.phr[id] || (st.phr[id] = { n: 0, ok: 0, t: 0 });
    rec.n++; if (r && r.ok && !r.hints && !r.revealed) rec.ok++; rec.t = Date.now();
    if (typeof LEX !== 'undefined' && LEX.item(id)) LEX.expose(id);
  }

  // ---------------------------------------------------------------- the phrase panel: copy a phrase (echo), or say it from memory (recall),
  // or write something right (fix). Tab: a hint · ?: I don't know (it shows the answer and says it; type it once) · Esc: not now.
  const CSS = `
#tl-panel { z-index: 9; align-items: start; }
#tl-panel > * { grid-column: 2; }
#tl-panel .tl-side { grid-column: 1; grid-row: 1 / span 12; display: flex; flex-direction: column; align-items: center; gap: 6px; }
#tl-panel .tl-side canvas { width: 96px; height: 96px; background: #fff; border-radius: 14px; border: 2px dashed rgba(43,34,53,.3); }
#tl-panel .tl-tag { font: 800 11px "Segoe UI", sans-serif; letter-spacing: .07em; text-transform: uppercase; color: #fff; background: var(--tlc, #21a493); border-radius: 99px; padding: 2px 9px; text-align: center; max-width: 100px; }
#tl-panel .tl-ex { font-size: 16px; font-style: italic; color: #4a4560; }
#tl-panel .tl-ex small { display: block; font-size: 12px; opacity: .65; font-style: normal; }
#tl-panel .tl-ex:not(.en-on) small { display: none; } #tl-panel .tl-ex { cursor: pointer; }
#tl-panel .tl-card { display: flex; align-items: baseline; flex-wrap: wrap; gap: 2px 10px; background: #fff; border: 2px dashed rgba(214,69,58,.45); border-radius: 12px; padding: 4px 10px; }
#tl-panel .tl-card b { font: 800 28px Bahnschrift, "Segoe UI", sans-serif; color: var(--red); }
#tl-panel .tl-card span { font-size: 15px; font-style: italic; opacity: .75; }
#tl-panel .tl-card button { margin-left: auto; border: 2px solid var(--ink); border-radius: 8px; background: transparent; font-size: 13px; padding: 0 7px; }
#tl-panel .tl-note { font-size: 13px; line-height: 1.35; opacity: .85; }
#tl-panel .tl-meter { display: flex; align-items: center; gap: 5px; font: 800 11px "Segoe UI", sans-serif; letter-spacing: .07em; text-transform: uppercase; }
#tl-panel .tl-meter i { width: 13px; height: 13px; border-radius: 50%; border: 2px solid var(--ink); background: #fff; }
#tl-panel .tl-meter em { font-style: normal; color: #c2412f; margin-left: 6px; }
#tl-panel .tl-prompt { font-size: 17px; font-weight: 800; color: #137267; }
#tl-panel .tl-sign { justify-self: start; font: 700 24px "Segoe Print", "Ink Free", cursive; background: #2f3b34; color: #f4f1e4; border-radius: 8px; padding: 4px 14px; border: 4px solid #8a5f3e; }
#tl-panel.tl-recall:not(.tl-shown) .tl-card, #tl-panel.tl-recall:not(.tl-shown) .tl-note, #tl-panel.tl-fix:not(.tl-shown) .tl-card { display: none; }
#tl-panel.tl-echo [data-a="hint"], #tl-panel.tl-echo [data-a="idk"], #tl-panel.tl-shown [data-a="idk"] { display: none; }
#tl-panel.tl-echo .tl-input::placeholder, #tl-panel.tl-shown .tl-input::placeholder { color: rgba(214,69,58,.45); font-weight: 700; }
.card.tl-news { background: #f6f1e3; text-align: left; max-width: min(520px, calc(100vw - 40px)); padding: 14px 24px 14px; }
.card.tl-news .tl-mast { font: 900 30px Georgia, "Times New Roman", serif; text-align: center; border-bottom: 3px double #2b2235; letter-spacing: .03em; }
.card.tl-news .tl-date { font: 700 11px "Segoe UI", sans-serif; text-transform: uppercase; letter-spacing: .1em; opacity: .6; text-align: center; margin: 3px 0 8px; }
.card.tl-news .tl-h { font: 800 19px Georgia, "Times New Roman", serif; margin: 8px 0 0; line-height: 1.25; }
.card.tl-news .en { margin-top: 8px; font-size: 13px; }
.card.tl-news .en p { margin: 2px 0; }
.card.tl-news .row { margin-top: 8px; }`;
  let cssOn = false;
  function css() { if (cssOn) return; cssOn = true; const st = document.createElement('style'); st.id = 'tl-css'; st.textContent = CSS; document.head.appendChild(st); }
  let PE = null, PS = null;
  function panelEls() {
    if (PE) return PE;
    css();
    const el = document.createElement('div'); el.id = 'tl-panel'; el.className = 'panel hidden';
    el.innerHTML = `<div class="tl-side"><canvas width="96" height="96"></canvas><span class="tl-tag"></span></div>
      <div class="ptitle tl-title"></div><div class="tl-ex"></div><div class="tl-prompt"></div><div class="tl-sign"></div>
      <div class="tl-card"><b></b><span></span><button type="button" title="Hear it">🔊</button></div>
      <div class="tl-note"></div><div class="tl-meter"></div><div class="hint tl-hint"></div>
      <form class="tl-form" autocomplete="off"><input class="tl-input" autocomplete="off" spellcheck="false"><button type="submit">OK</button></form>
      <div class="prow"><button type="button" data-a="hint">Hint (Tab)</button><button type="button" data-a="idk">I don’t know (?)</button><button type="button" data-a="skip">Not now (Esc)</button></div>`;
    document.body.appendChild(el);
    const q = s => el.querySelector(s);
    PE = { el, pic: q('canvas'), tag: q('.tl-tag'), title: q('.tl-title'), ex: q('.tl-ex'), prompt: q('.tl-prompt'), sign: q('.tl-sign'), card: q('.tl-card'), phrase: q('.tl-card b'), gloss: q('.tl-card span'),
      hear: q('.tl-card button'), note: q('.tl-note'), meter: q('.tl-meter'), hint: q('.tl-hint'), form: q('form'), input: q('.tl-input'), hintBtn: q('[data-a="hint"]'), idk: q('[data-a="idk"]'), skip: q('[data-a="skip"]') };
    return PE;
  }
  const IDK = new Set(['idk', 'i dont know', 'i don t know', 'dont know', 'dunno', 'no se', 'no lo se', 'nao sei', 'weiss nicht', 'weiß nicht', 'ich weiss nicht', 'ich weiß nicht', 'keine ahnung']);
  const IDK_C = new Set(['不知道', 'buzhidao', 'bùzhīdào', 'わからない', '分からない', 'わかりません', 'wakaranai', 'しらない', '知らない', 'shiranai']);     // (zh / ja)
  const mask = (w, n) => { let first = true; return [...w].map((ch, i) => { if (/[\s¡!¿?,.。、，！？]/.test(ch)) return ch; const show = first || (n >= 2 && i % 2 === 0) || n >= 3; first = false; return show ? ch : '_'; }).join(' '); };
  const meterHTML = (s, insult) => `<span>How strong:</span>${[0, 1, 2].map(i => `<i style="${i <= s ? 'background:' + SW_LEVEL[s].color : ''}"></i>`).join('')}<b>${SW_LEVEL[s].en}</b>${insult ? '<em>an insult</em>' : ''}`;
  // o: { mode: 'echo'|'recall'|'fix', title, tag, color, icon, ex, exEn, prompt, sign, answer, shown, en, note, strength, insult, keys, check(text), wrongHint(text) }
  // → { ok, typed, hints, revealed, tries, ms } or { cancelled: true }
  function panel(o) {
    return new Promise(resolve => {
      const E = panelEls();
      if (PS) PS.finish({ ok: false, cancelled: true });
      const st = PS = { o, hints: 0, revealed: o.mode === 'echo', tries: 0, t0: performance.now() };
      E.el.className = 'panel tl-' + o.mode + (st.revealed ? ' tl-shown' : '');
      E.el.style.setProperty('--tlc', o.color || '#21a493');
      if (typeof ICONS !== 'undefined') ICONS.draw(E.pic, o.icon || 'slang');
      const show = (el, v, html) => { el.style.display = v ? '' : 'none'; if (v) { if (html) el.innerHTML = v; else el.textContent = v; } };
      // (zh / ja: answer, shown, ex and sign are notation: ruby in the mode on the card, plain text in the box and the hints)
      const cj = cjkGame(), H = s => (cj ? CJK.html(s, { lang: realLang() }) : esc(s)), P = s => (cj ? plainC(s) : s);
      if (cj && CJK.attachIME) CJK.attachIME(E.input);
      show(E.tag, o.tag); show(E.title, o.title);
      // (an example: the phrase in a sentence, the sentence's English on request, a tap: DESIGN.md 17.3)
      show(E.ex, o.ex ? `«${H(o.ex)}»${o.exEn ? `<small>${esc(o.exEn)}</small>` : ''}` : '', true);
      E.ex.classList.remove('en-on'); E.ex.title = o.exEn ? 'Tap for the English' : ''; E.ex.onclick = () => { if (o.exEn) E.ex.classList.toggle('en-on'); E.input.focus(); };
      show(E.prompt, o.prompt); show(E.sign, o.sign && H(o.sign), true);
      E.phrase.innerHTML = H(o.shown || o.answer || ''); E.gloss.textContent = o.en || '';
      show(E.note, o.note);
      show(E.meter, o.strength !== undefined ? meterHTML(o.strength, o.insult) : '', true);
      const idle = () => (o.mode === 'echo' ? 'Type it to learn it' : 'Tab: a hint · ?: I don’t know');
      const showHint = () => { E.hint.textContent = st.hints ? mask(P(o.answer), st.hints) : st.revealed && o.mode !== 'echo' ? 'Type it!' : idle(); E.hint.classList.toggle('given', st.hints > 0 && !st.revealed); };
      E.input.value = ''; E.input.placeholder = o.mode === 'echo' ? P(o.shown || o.answer) : (o.placeholder || 'type it…');
      showHint();
      E.el.classList.remove('hidden'); if (typeof Input !== 'undefined') Input.typing = true;
      setTimeout(() => { if (PS === st) E.input.focus(); }, 30);
      const finish = r => {
        if (PS !== st) return; PS = null;
        E.el.classList.add('hidden'); if (typeof Input !== 'undefined') Input.typing = false; E.input.blur(); off();
        resolve(Object.assign({ hints: st.hints, revealed: st.revealed && o.mode !== 'echo', tries: st.tries, ms: performance.now() - st.t0 }, r));
      };
      st.finish = finish;
      const reveal = () => { st.revealed = true; E.el.classList.add('tl-shown'); E.input.value = ''; E.input.placeholder = P(o.shown || o.answer); showHint(); say(o.answer, true); E.input.focus(); };
      const hint = () => { if (st.revealed) return; st.hints = Math.min(3, st.hints + 1); showHint(); E.input.focus(); };
      const submit = e => {
        if (e) e.preventDefault();
        const text = E.input.value.trim(); if (!text) return;
        if (!st.revealed && (/^\s*[?？]+\s*$/.test(text) || IDK.has(norm(text)) || (cj && IDK_C.has(text.replace(/\s+/g, '').toLowerCase())))) { reveal(); return; }
        const ok = o.check ? o.check(text) : hasAny(text, o.keys || []);
        if (ok) { sound('click'); finish({ ok: true, typed: text }); return; }
        st.tries++;
        if (o.wrongHint && o.wrongHint(text)) { E.hint.textContent = o.wrongHint(text); E.hint.classList.remove('given'); }
        else if (st.revealed) E.hint.textContent = `Copy it: «${P(o.shown || o.answer)}»`;
        else { st.hints = Math.min(3, st.hints + 1); showHint(); }
        E.el.classList.remove('shake'); void E.el.offsetWidth; E.el.classList.add('shake');
        sound('wrong'); E.input.select();
      };
      const key = e => { if (e.key === 'Escape') { e.preventDefault(); finish({ ok: false, cancelled: true }); } else if (e.key === 'Tab') { e.preventDefault(); hint(); } e.stopPropagation(); };
      const hear = () => { say(o.answer); E.input.focus(); };
      const skip = () => finish({ ok: false, cancelled: true });
      E.form.addEventListener('submit', submit); E.input.addEventListener('keydown', key); E.hintBtn.addEventListener('click', hint); E.idk.addEventListener('click', reveal); E.skip.addEventListener('click', skip); E.hear.addEventListener('click', hear);
      function off() { E.form.removeEventListener('submit', submit); E.input.removeEventListener('keydown', key); E.hintBtn.removeEventListener('click', hint); E.idk.removeEventListener('click', reveal); E.skip.removeEventListener('click', skip); E.hear.removeEventListener('click', hear); }
      st.submit = text => { E.input.value = text; submit(); };
    });
  }
  // a menu or a box: the world waits, and a scene that breaks off never leaves you frozen
  async function choose(title, options) { lock(true); try { return await UI.choose(title, options); } finally { lock(false); } }
  async function panelLocked(o) { lock(true); G.state.teaching = true; try { return await panel(o); } finally { G.state.teaching = false; lock(false); } }
  async function commandLocked(o) { lock(true); try { return await UI.command(o); } finally { lock(false); } }

  // ---------------------------------------------------------------- the smokers
  const seatOf = id => SMOKERS[dl()].findIndex(s => s.id === id);
  async function groupHello() {
    const l = dl();
    for (let i = 0; i < 3; i++) await speak(built.seatApi[i], SMOKERS[l][i].hi);
    await speak(built.seatApi[0], GROUP[l]);
  }
  // the keys a phrase is taken by: its own, and (zh / ja) the phrase itself in characters and as canon pinyin / rōmaji
  const keysOf = (ph, tl = ph.tl) => {
    if (!cjkGame()) return ph.keys || [tl];
    const l = realLang(), own = CJK.chars(tl, { lang: l }).replace(/[\s。、，！？：；「」“”…!?,.]/g, '');
    return [...(ph.keys || []), own, CJK.canon(tl, l)].filter(Boolean);
  };
  const enF = s => (s == null ? s : fillVars(enC(s)));          // (an English text of a zh / ja table: its «» in the mode)
  function phrasePanel(sm, ph, mode) {
    return panelLocked({ mode, color: sm.color, tag: sm.region.tl, icon: 'slang',
      title: mode === 'echo' ? `${sm.name} teaches you: talk like in ${sm.region.en}!` : `${sm.name} asks you:`,
      ex: mode === 'echo' ? fillVars(ph.ex, {}, cjkGame()) : null, exEn: mode === 'echo' ? enF(ph.exEn) : null, prompt: mode === 'recall' ? enF(ph.ask) : null,
      answer: ph.tl, en: enF(ph.en), note: enF(ph.note), keys: keysOf(ph), placeholder: `say it like in ${sm.region.en}…` });
  }
  async function smokerTalk(seat) {
    const l = dl(), sm = SMOKERS[l][seat], api = built.seatApi[seat], st = S(), rec = st.sm[sm.id] || (st.sm[sm.id] = { done: 0, best: 0, chat: 0, seen: 0 });
    if (!st.met.smokers) { st.met.smokers = 1; await groupHello(); }
    else if (!rec.seen) await speak(api, sm.hi);
    rec.seen = 1;
    const left = sm.phrases.filter(p => !st.phr[p.id]).length;
    const c = await choose(`${sm.name}, from ${sm.from}`, [
      rec.done ? { label: 'Quiz me again', sub: `${sm.phrases.length} phrases from ${sm.region.en}, from memory`, value: 'quiz' }
        : { label: left ? 'Teach me how you talk' : 'Quiz me', sub: !left ? `${sm.phrases.length} phrases from ${sm.region.en}, from memory` : left < sm.phrases.length ? `${left} phrases left, then a quiz` : `${sm.phrases.length} phrases from ${sm.region.en}, then a quiz`, value: 'learn' },
      { label: 'Just chat', sub: 'how’s it going?', value: 'chat' },
    ]);
    if (!c) return;
    if (c === 'chat') { await speak(api, sm.chat[rec.chat++ % sm.chat.length]); G.save(); return; }
    if (c === 'quiz') await smokerQuiz(sm, api, rec, true);
    else await smokerLesson(sm, api, rec);
    G.save();
  }
  async function smokerLesson(sm, api, rec) {
    const st = S();
    await speak(api, sm.start);
    for (const ph of sm.phrases) {
      if (st.phr[ph.id]) continue;          // (picked up where you left off)
      const r = await phrasePanel(sm, ph, 'echo');
      if (r.cancelled) { await speak(api, sm.later); G.save(); return; }
      learnPhrase(ph.id, r); sound('review');
      G.sim.mimo.happy = 0.6;
    }
    await speak(api, sm.quiz);
    await smokerQuiz(sm, api, rec, false);
  }
  async function smokerQuiz(sm, api, rec, again) {
    let first = 0;
    for (const ph of shuffle(sm.phrases.slice())) {
      const r = await phrasePanel(sm, ph, 'recall');
      if (r.cancelled) { await speak(api, sm.later); return null; }
      learnPhrase(ph.id, r);
      const clean = r.ok && !r.hints && !r.revealed;
      if (clean) first++;
      UI.toast(clean ? `${plainC(pickOne(sm.praise))} «${plainC(ph.tl)}»` : `«${plainC(ph.tl)}» = ${enC(ph.en)}`);
      sound(clean ? 'review' : 'pip');
    }
    const n = sm.phrases.length;
    await speak(api, first >= n - 1 ? sm.win : sm.ok);
    const coins = again || rec.done ? 0 : 2 + first;
    if (coins) { G.state.coins = (G.state.coins || 0) + coins; sound('chest'); }
    UI.toast(`${first}/${n} right the first time` + (coins ? ` · 🪙 +${coins} coins` : ''));
    const firstTime = !rec.done;
    rec.done = 1; rec.best = Math.max(rec.best || 0, first);
    G.save();
    if (firstTime) for (const [seat, L] of BANTER[sm.id] || []) await speak(built.seatApi[seat], L);
    return first;
  }

  // ---------------------------------------------------------------- the swearer
  let bleepTold = false;
  async function swearerTalk() {
    const l = dl(), W = SWEARER[l], api = built.goyoApi, sw = S().sw, bag = G.state.bag || {};
    if (!sw.met) { sw.met = 1; for (const L of W.hi) await speak(api, L); await speak(api, W.intro); await speak(api, W.offer); }
    else await speak(api, W.grumble[(sw.g = (sw.g || 0) + 1) % W.grumble.length]);
    // he did ask for a soda…
    if (!sw.soda && (bag['w.soda'] || 0) > 0) {
      const give = await choose(`Give ${W.name} your soda?`, [{ label: 'Give it to him', sub: 'he’s been at that wheel all day', value: 'give' }, { label: 'Keep it', value: 'keep' }]);
      if (give === 'give') {
        bag['w.soda']--; if (!bag['w.soda']) delete bag['w.soda']; sw.soda = 1;
        await speak(api, LT['tl.goyo.soda']);
        G.state.coins = (G.state.coins || 0) + 3; UI.toast('🪙 +3 coins'); sound('chest'); G.save();
      }
    }
    const lv = sw.level || 0, bl = bleepOn();
    if (bl && lv >= 1 && !bleepTold) { bleepTold = true; await speak(api, W.bleep); }
    const names = ['the mild ones', 'the strong ones', 'the very strong ones'], subs = ['fine almost anywhere', 'not at school, not with grandma', 'hardly ever, and never at a person'];
    const opts = [];
    for (let i = 0; i <= Math.min(lv, 2); i++) { if (bl && i > 0) break; opts.push({ label: (i < lv ? 'Again: ' : 'Teach me ') + names[i], sub: subs[i], value: 'L' + i }); }
    opts.push({ label: 'Why do you swear so much?', value: 'why' });
    const c = await choose(`${W.name}, an old sailor`, opts);
    if (!c) return;
    if (c === 'why') { await speak(api, W.why); return; }
    if (bl && !bleepTold) { bleepTold = true; await speak(api, W.bleep); }
    await swearLesson(+c.slice(1));
  }
  async function swearLesson(level) {
    const l = dl(), W = SWEARER[l], api = built.goyoApi, sw = S().sw, items = W.items.filter(it => it.s === level);
    const keysAll = list => list.flatMap(it => keysOf(it, it.tl)), Pb = t => plainC(bleep(t));        // (zh / ja: keys and plain text)
    await speak(api, W.lesson[level]);
    for (const it of items) {
      const r = await panelLocked({ mode: 'echo', color: SW_LEVEL[it.s].color, tag: SW_LEVEL[it.s].en, icon: 'swear', title: `${W.name} teaches you: ${it.insult ? 'an insult (to recognize, not to use!)' : 'a swear word'}`,
        answer: it.tl, shown: bleep(it.tl), en: bleep(it.en), note: enF(it.note), strength: it.s, insult: it.insult, keys: cjkGame() ? keysOf(it) : [it.tl] });
      if (r.cancelled) return;
      learnPhrase(it.id, r); sound(level ? 'pip' : 'review');
    }
    // a check, then he's done with you (for now)
    let right = true;
    if (level === 0) {
      const mild = W.items.filter(it => it.s === 0), strong = W.items.filter(it => it.s > 0);
      const r = await panelLocked({ mode: 'recall', color: SW_LEVEL[0].color, tag: 'quiz', icon: 'swear', title: `${W.name} asks you:`, prompt: SW_ASK(W.grandma),
        answer: mild[0].tl, en: mild[0].en, keys: keysAll(mild), placeholder: 'what do you say?',
        wrongHint: text => (hasAny(text, keysAll(strong)) ? `Not in front of your ${W.grandma}! Something mild…` : '') });
      if (r.cancelled) return;
      right = r.ok && !r.revealed;
    } else if (level === 1) {
      const it = pickOne(W.items.filter(x => x.s >= 1 && !x.insult));
      const c = await choose(`${W.name}: “How strong is «${Pb(it.tl)}»?”`, SW_LEVEL.map((L, i) => ({ label: cap(L.en), value: i })));
      if (c === null) return;
      right = c === it.s;
      if (!right) UI.toast(`«${Pb(it.tl)}» is ${SW_LEVEL[it.s].en}`);
    } else {
      const c = await choose(`${W.name}: “Someone calls you «${bleep(W.insultQ)}». Is that friendly?”`, [{ label: 'No: it’s an insult', value: 'no' }, { label: 'Yes: it means “buddy”', value: 'yes' }]);
      if (c === null) return;
      right = c === 'no';
      if (!right) UI.toast(`«${bleep(W.insultQ)}» is an insult. Never friendly!`);
    }
    await speak(api, right ? W.right : W.wrong);
    if ((sw.level || 0) <= level) { sw.level = level + 1; G.state.coins = (G.state.coins || 0) + 2; UI.toast('🪙 +2 coins (for your ears)'); sound('chest'); }
    await speak(api, sw.level >= 3 ? W.done : W.end);
    G.save();
  }

  // ---------------------------------------------------------------- the stores
  let shopDone = false;
  function ensureShop() {
    if (shopDone || typeof SHOP === 'undefined' || !SHOP.extend) return !!shopDone;
    shopDone = true;
    SHOP.extend({
      words: WORDS.filter(w => SHOP_EN[w.id]),
      stalls: Object.fromEntries(Object.entries(PL.stores).map(([key, st]) => [st.stall, { name: STORE_NAME[key], where: WHERE_ST[key], welcome: WELCOME[key], goods: st.goods }])),
      items: SHOP_ITEMS.map(([id, price, heal]) => [id, price, heal, Object.values(PL.stores).filter(st => st.goods.includes(id)).map(st => st.stall)]),
      goods: SHOP_GOODS, en: SHOP_EN,
      mass: ['w.juice', 'w.soda', 'w.icecream', 'w.chocolate'], listSg: ['w.juice', 'w.soda', 'w.icecream'], pricePl: ['w.candy'],
      enWords: 'juice juices soda sodas ice cream creams candy candies chocolate chocolates gum newspaper newspapers paper',
    });
    return true;
  }
  async function openStore(key) {
    const st = PL.stores[key], s = S(), K = built.P['keeper_' + key], api = K.api;
    if (typeof SHOP === 'undefined' || !SHOP.open || !ensureShop()) { think('The store is closed today.'); return; }
    if (!s.met['store_' + key]) { s.met['store_' + key] = 1; await speak(api, LT['tl.store.' + key + '.hi']); }
    // story beats first: Doña Chela's parcel (once you're headed for Molinar), the sleepy keeper's sign
    if (key === 'alba' && G.state.flags.ch1 && !s.q.parcel) {
      await speak(api, LT['tl.parcel.ask']); await speak(api, LT['tl.parcel.ask2']);
      s.q.parcel = 1; G.save();
      await you(`A parcel for ${nm('dom0')}, at the dominoes table by the Great Mill. On it!`);
    }
    if (key === 'molinar' && !s.q.sign) { await speak(api, LT['tl.sign.ask']); s.q.sign = 1; G.save(); }
    const S0 = G.state;
    api.talking = true; S0.teaching = true;
    let r = null;
    try {
      r = await SHOP.open({ lang: S0.lang, stall: { id: st.stall, keeper: { id: 'keeper_' + key, name: api.name } }, coins: S0.coins || 0, bag: Object.assign({}, S0.bag || {}), mimoName: S0.mimoName, asked: S0.shopAsked || [] });
      if (r) { S0.coins = r.coins; S0.bag = r.bag || S0.bag; if (r.asked) S0.shopAsked = r.asked; }
    } catch (e) { console.error('[townlife] shop', e); }
    S0.teaching = false; api.talking = false; G.save();
    if (r && r.bought && r.bought.length) await afterBuy(key, r.bought);
  }
  async function afterBuy(key, bought) {
    const ids = new Set(bought.map(b => b.id)), M = G.sim.mimo;
    if (ids.has('w.newspaper')) await readPaper();
    if (ids.has('w.gum')) { gumBubble(); think('{mimo} gets a piece of {w.gum}… and blows a huge pink bubble!', 4); }
    else if (ids.has('w.icecream')) { M.happy = 1.4; think('{mimo} gets a lick of {w.icecream}. Pure joy!', 3.5); }
    else if (ids.has('w.candy') || ids.has('w.chocolate')) { M.happy = 0.8; G.sim.mimoSay('!', 1.2); }
  }
  async function readPaper() {
    const l = lang(), s = S(), f = G.state.flags || {};
    const news = NEWS.filter(n => !n.always && n.when(s, f)), always = NEWS.filter(n => n.always);
    s.news = (s.news || 0) + 1;
    const pick = news.slice(0, 2);
    for (let i = 0; pick.length < 3 && i < always.length; i++) pick.push(always[(s.news + i) % always.length]);
    // (the paper in the language; its English, the masthead's too, only on request: EN, DESIGN.md 17.3)
    // (zh / ja: the notation, in the mode; a headline with no zh / ja shows in English, never Spanish)
    const cj = cjkGame(), cl = realLang(), H = s => (cj ? CJK.html(s, { lang: cl }) : esc(s));
    const date = cj ? NEWS_DATE[cl] : { es: 'Edición de hoy', pt: 'Edição de hoje', de: 'Heutige Ausgabe' }[l];
    const nl = cj ? cl : l, head = h => (h[nl] ? H(fillVars(h[nl], {}, cj)) : esc(fillVars(h.en)));
    sound('page');
    await UI.card(`<div class="tl-mast">${H(MAST[nl])}</div><div class="tl-date">${H(date)}</div>`
      + pick.map(h => `<div class="tl-h">${head(h)}</div>`).join('')
      + `<div class="row"><button data-act="en">EN</button></div><div class="en"><p><b>${esc(MAST.en)}</b></p>${pick.map(h => `<p>${esc(fillVars(h.en))}</p>`).join('')}</div><div class="sub">E to close</div>`, { kind: 'tl-news' });
    G.save();
  }
  // Mimo's gum bubble: it grows, wobbles and pops
  let bubble = null;
  function gumBubble() {
    const mm = G.cast && G.cast.mimo; if (!mm) return;
    if (!bubble) { bubble = TK.part(new THREE.SphereGeometry(1, 14, 10), '#f6a6c1', null, null, { ink: 0.015, rim: 0.5 }); bubble.castShadow = false; }
    (mm.body || mm.root).add(bubble);
    const mo = mm.mouth ? mm.mouth.position : V3(0, 0.3, 0.32);
    bubble.position.set(mo.x, mo.y, mo.z + 0.05); bubble.scale.setScalar(0.01); bubble.visible = true;
    bubble.userData.t = 0;
  }

  // ---------------------------------------------------------------- Michi the lost cat (Alba)
  const CATW = { es: ['gato', 'gata', 'gatos', 'gatito', 'gatita', 'michi', 'minino'], pt: ['gato', 'gata', 'gatinho', 'gatinha', 'mingau'], de: ['katze', 'katzen', 'kater', 'katzchen', 'mieze', 'miezekatze'],
    zh: ['猫', 'mao'], ja: ['猫', 'ねこ', 'ネコ', 'neko', 'にゃんこ', 'nyanko'] };
  const SEENW = { es: ['visto', 'viste', 'vio', 'vieron', 'vi', 'ves'], pt: ['viu', 'viram', 'visto', 'vi', 've'], de: ['gesehen', 'gesehn', 'siehst', 'sahst', 'sah'],
    zh: ['看见', '见过', '看到', 'kanjian', 'jianguo', 'kandao'], ja: ['見', 'みま', 'みた', 'mima', 'mita'] };
  const WHEREW = { es: ['donde'], pt: ['onde', 'cade'], de: ['wo'], zh: ['哪', 'nali', 'naer'], ja: ['どこ', 'doko'] };
  function judgeCat(text, l = dl()) {
    const cat = hasAny(text, CATW[l]), seen = hasAny(text, SEENW[l]) || hasAny(text, WHEREW[l]);
    return cat && seen ? 'ok' : cat ? 'close' : 'no';
  }
  const catGiver = () => { const q = S().q; return (q.cat || 0) === 1 && (q.catClue || 0) < 3 ? q.catClue || 0 : -1; };
  async function catTalk() {
    const q = S().q, p = built.P.paloma.api;
    if (!q.cat) { await speak(p, LT['tl.cat.ask']); await speak(p, LT['tl.cat.ask2']); q.cat = 1; q.catClue = 0; LEX.expose('w.cat'); G.save(); return; }
    if (q.cat === 1) { await speak(p, LT['tl.cat.wait']); if ((q.catClue || 0) === 0) think('Who might have seen her? The man reading the paper by the store sees everything.', 4.5); return; }
    if (q.cat === 2) {
      await you(`Here she is: ${nm('michi')}!`);
      q.cat = 3; G.save();        // (she hops down next to Paloma)
      G.w3d.fx.sparkle(p.x + 0.5, p.y + 0.6, p.z + 0.3, 14, ['#ffd27a', '#fff3a0']); sound('learned');
      await speak(p, LT['tl.cat.thanks']);
      G.state.coins = (G.state.coins || 0) + 8; UI.toast('🪙 +8 coins'); sound('chest');
      await speak(p, LT['tl.cat.look']);
      const C = built.catSit.root.position;
      if (!LEX.taught('w.cat') && LEX.mayIntroduce()) await STORY.teachWord('w.cat', { look: { x: C.x, z: C.z } }); else LEX.expose('w.cat');
      G.save(); return;
    }
    await speak(p, LT['tl.cat.after']);
  }
  async function catAsk(api, who) {
    const l = dl();
    api.talking = true;
    const r = await commandLocked({ name: G.state.mimoName, icon: 'cat', title: `Ask ${api.name} if they’ve seen a cat`, verbs: [], placeholder: 'ask a question…',
      hint: `Ask in ${LNAME[l]}.`, model: MODEL.cat[l], modelEn: MODEL.cat.en });
    api.talking = false;
    if (!r || r.cancelled) return;
    const v = judgeCat(r.text);
    if (v === 'no') { sound('wrong'); await speak(api, LT['tl.huh']); return; }
    if (v === 'close') UI.toast(`Close! Better: «${plainC(MODEL.cat[l])}»`); else sound('review');
    LEX.expose('w.cat');
    const q = S().q;
    if (who === 0) await speak(api, LT['tl.cat.paper']);
    else if (who === 1) await speak(api, SWEARER[dl()].cat);
    else { await speak(api, SMOKERS[dl()][api.seat].cat); G.sim.mimo.perk = 1; think('{mimo} tiptoes toward the crate by the wall… shh!', 4); }
    q.catClue = Math.max(q.catClue || 0, who + 1); G.save();
  }
  let carried = null;
  function catCarryMesh() {
    if (carried) return carried;
    const g = new THREE.Group(), P0 = (geo, c, pos, sc, rot) => g.add(TK.part(geo, c, pos, sc, { ink: 0.012, rot }));
    const s = new THREE.SphereGeometry(1, 12, 9), cn = new THREE.ConeGeometry(1, 1, 8);
    P0(s, '#f0a050', [0, 0, 0], [0.13, 0.12, 0.2]); P0(s, '#f0a050', [0, 0.1, 0.17], [0.1, 0.09, 0.09]);
    [-1, 1].forEach(k => { P0(cn, '#f0a050', [k * 0.055, 0.19, 0.16], [0.035, 0.07, 0.03]); P0(s, '#fffaf0', [k * 0.07, -0.09, 0.12], [0.035, 0.03, 0.04]); });
    P0(new THREE.CylinderGeometry(1, 1, 1, 6), '#f0a050', [0.06, 0.02, -0.22], [0.03, 0.22, 0.03], [1.2, 0, 0.4]);
    [-1, 1].forEach(k => { const e = new THREE.Mesh(s, new THREE.MeshBasicMaterial({ color: '#2b2235' })); e.scale.set(0.02, 0.006, 0.01); e.position.set(k * 0.04, 0.11, 0.255); g.add(e); });
    g.position.set(0, -0.06, 0.08); g.rotation.y = Math.PI / 2 - 0.3;
    carried = g; return g;
  }
  async function pickCat() {
    const q = S().q, c = PL.hangout.catCrate;
    lock(true);
    G.sim.mimoGo({ x: c.x - 1.2, z: c.z + 0.6 }, c); sound('chirp');
    await STORY.wait(0.6);
    await you(`An orange {w.cat} with white paws, fast asleep in the crate… ${nm('michi')}!`);
    q.cat = 2; q.catClue = Math.max(q.catClue || 0, 3); G.save();
    sound('pip'); G.sim.mimoGo(null, null); lock(false);
    think(`${nm('michi')} purrs in my arms. Back to ${nm('paloma')}, by the corner store!`, 4);
  }
  function carryUpdate(dt) {
    if (!G || !G.cast || !G.cast.hero) return;
    const hero = G.cast.hero, want = (S().q.cat || 0) === 2;
    if (want && (!carried || hero.holding !== carried)) { const m = catCarryMesh(); hero.hands.add(m); hero.holding = m; }
    if (!want && carried && hero.holding === carried) { hero.hands.remove(carried); hero.holding = null; }
    if (carried && carried.parent) carried.children[0].scale.y = 0.12 * (1 + Math.sin(performance.now() / 300) * 0.04);
    if (bubble && bubble.visible) {
      const u = bubble.userData; u.t += dt;
      const k = Math.min(1, u.t / 1.8), s = 0.02 + k * 0.3 + Math.sin(u.t * 9) * 0.01 * k;
      bubble.scale.setScalar(s);
      if (u.t > 2.1) { bubble.visible = false; if (bubble.parent) bubble.parent.remove(bubble); sound('poof'); const M = G.sim.mimo; G.w3d.fx.puff(M.x, M.ry + 0.4, M.z, 6, 0.12, '#f6a6c1'); M.happy = 0.6; }
    }
  }

  // ---------------------------------------------------------------- the kite in the tree (Molinar): tell Mimo «¡Salta!»
  const VERBS = () => ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim'].filter(id => typeof LEX !== 'undefined' && LEX.item(id));
  async function kiteTalk() {
    const q = S().q, p = built.P.kid.api;
    if ((q.kite || 0) >= 2) { await speak(p, LT['tl.kite.after']); return; }
    if (!q.kite) { await speak(p, LT['tl.kite.ask']); q.kite = 1; LEX.expose('w.kite'); G.save(); }
    await speak(p, LT['tl.kite.ask2']);
    G.sim.mimo.look = PL.kiteTree; G.sim.mimo.perk = 1;
    await STORY.wait(0.6);
    G.sim.mimo.look = null;
    await kiteCommand();       // (straight on: what should Mimo do?)
  }
  async function kiteCommand() {
    const name = G.state.mimoName, M = G.sim.mimo, q = S().q;
    const r = await commandLocked({ name, icon: 'kite', title: `The ${UI.weavePlain('{w.kite}')} is stuck high up in the ${UI.weavePlain('{w.tree}')}. What should ${name} do?`, verbs: VERBS(), answer: 'v.jump',
      hint: LEX.taught('v.jump') ? '' : 'Type a sentence in the language, like a command.' });
    if (!r || r.cancelled) return;
    if (r.verb !== 'v.jump') {
      if (r.verb) { G.sim.mimoSay(exclaim(LEX.form(r.verb)), 1.4); if (LEX.taught(r.verb)) LEX.attempt(r.verb, { ok: true, hints: 0, ms: r.ms, mode: 'command' }); }
      if (r.verb === 'v.throw') think('{mimo} throws a pebble. It bounces off a branch… the {w.kite} wobbles, but stays.', 4);
      else if (r.verb === 'v.hit') { sound('hit'); M.sad = 1.2; think('{mimo} bonks the trunk. A leaf flutters down. Just a leaf.', 4); }
      else if (r.verb === 'v.push') think('{mimo} pushes the {w.tree} with all its might. The {w.tree} doesn’t care.', 4);
      else if (r.verb) think('{mimo} tries, but the {w.kite} stays up there.', 3.5);
      else { G.sim.mimoSay('…?', 1.4); M.tiltT = 1.4; think('{mimo} tilts its head. It needs to get up high… which word was that?', 4); }
      return;
    }
    const first = !LEX.taught('v.jump');
    LEX.attempt('v.jump', { ok: true, hints: 0, ms: r.ms, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: 'v.jump' }); UI.toast(`${name} learned «${LEX.form('v.jump')}»!`); }
    G.sim.mimoSay(exclaim(LEX.form('v.jump')), 1.6);
    // under the kite, one huge jump into the branches, and down it comes into the kid's hands
    const tr = PL.kiteTree, gt = built.gy(tr.x, tr.z), kid = built.P.kid;
    lock(true);
    try {
      const K0 = built.kiteHome;
      G.sim.mimoGo({ x: K0.x, z: K0.z + 0.05 }, { x: tr.x, z: tr.z });
      G.cam.override = { pos: V3(tr.x + 1.0, gt + 2.6, tr.z + 7.5), look: V3(K0.x - 0.2, gt + 2.6, K0.z) };
      await STORY.wait(1.3);
      M.hop = { x0: M.x, z0: M.z, x1: M.x, z1: M.z, y0: M.y, y1: M.y, t: 0, dur: 1.05, h: 3.0 }; sound('jump');
      await STORY.wait(0.5);
      sound('wood'); G.w3d.fx.puff(K0.x, K0.y + 0.3, K0.z, 10, 0.25, '#7fc06a');
      const ks = kid.S; built.startKiteFall(V3(ks.x + Math.sin(ks.yaw) * 0.35, gt + 0.95, ks.z + Math.cos(ks.yaw) * 0.35));
      await STORY.wait(1.7);
      q.kite = 2; G.save(); sound('learned');
      G.sim.mimoGo(null, null); G.cam.override = null;
    } finally { lock(false); }
    await speak(kid.api, LT['tl.kite.thanks']);
    G.state.bag = G.state.bag || {}; G.state.bag['w.candy'] = (G.state.bag['w.candy'] || 0) + 1; G.state.coins = (G.state.coins || 0) + 5;
    UI.toast(`🪙 +5 coins · ${cap(LEX.form('w.candy'))} ×1`); sound('chest');
    const K = built.kite.root.position;
    if (!LEX.taught('w.kite') && LEX.mayIntroduce()) await STORY.teachWord('w.kite', { look: { x: K.x, z: K.z } });
    G.save();
  }

  // ---------------------------------------------------------------- the sign with a typo (Molinar)
  // reading a sign: the Read card (signs.js: the words big, a 🔊, the English); without it, a thought
  async function readCard(card, fallback) {
    if (typeof SIGNS !== 'undefined' && SIGNS.read) return SIGNS.read(card);
    think(fallback, 4.5);
  }
  const CHALK = { face: '#2f3b34', edge: '#8a5f3e', ink: '#f4f1e4' };
  async function signLook() {
    const q = S().q, T0 = SIGN_TYPO[dl()];
    const cj = cjkGame();         // (zh / ja: the notation; the card reads it in the mode)
    if ((q.sign || 0) >= 2) { await readCard({ tag: `${nm('keeper_molinar')}’s sign`, lines: [{ text: T0.right, en: T0.en, look: CHALK }], note: `Spelled right now. ${cap(LEX.form('w.icecream'))} for everyone!` }, `«${plainC(T0.right)}»… spelled right now. ${cap(LEX.form('w.icecream'))} for everyone!`); return; }
    if (!q.sign) { await readCard({ tag: `${nm('keeper_molinar')}’s new sign`, lines: [{ text: T0.wrong, say: cj ? T0.wrong : T0.wrong.toLowerCase(), en: T0.en, look: CHALK }], note: 'Hmm. Something about that sign looks off…' }, `«${plainC(T0.wrong)}»… hmm. Something about that sign looks off.`); return; }
    const r = await panelLocked({ mode: 'fix', color: '#2f8f4e', tag: 'the sign', icon: 'icecream', title: `${nm('keeper_molinar')}’s new sign`, sign: T0.wrong, note: T0.note,
      prompt: 'Something on it is spelled wrong. Write the sign the right way:', answer: T0.right, en: T0.en, placeholder: 'write the sign…', wrongHint: T0.wrongHint,
      check: T0.check || (text => hasAny(text, T0.ok) && !hasAny(text, T0.bad)) });
    if (r.cancelled || !r.ok) return;
    q.sign = 2; G.save(); sound('learned');
    const K = built.P.keeper_molinar.api;
    G.w3d.fx.sparkle(PL.sign.x, built.gy(PL.sign.x, PL.sign.z) + 1.0, PL.sign.z, 12);
    await speak(K, LT['tl.sign.thanks']);
    G.state.bag = G.state.bag || {}; G.state.bag['w.icecream'] = (G.state.bag['w.icecream'] || 0) + 1; G.state.coins = (G.state.coins || 0) + 4;
    UI.toast(`🪙 +4 coins · ${cap(LEX.form('w.icecream'))} ×1`); sound('chest');
    G.save();
  }

  // ---------------------------------------------------------------- the parcel: ask for him by name (Molinar's dominoes)
  const QW = { es: ['quien', 'donde', 'eres', 'usted', 'es', 'esta', 'buscando'], pt: ['quem', 'onde', 'cade', 'senhor', 'voce', 'e', 'esta'], de: ['wer', 'wo', 'sind', 'bist', 'ist', 'suche'],
    zh: ['谁', '哪', 'shei', 'nawei', 'nage', '？', '?', 'ma'], ja: ['誰', 'だれ', 'どなた', 'どこ', 'dare', 'donata', 'doko', 'ka', '？', '?'] };
  const DOM_KEYS = { es: [['eusebio'], ['fermin'], ['julio']], pt: [['juvenal'], ['osvaldo'], ['nestor']], de: [['kluge'], ['brandt'], ['wolf']] };
  // zh / ja: 钱大爷 · 孙大爷 · 冯大爷 and ジロウ · サブロウ · ヘイキチ (the surname, or the name, in characters or pinyin / rōmaji)
  DOM_KEYS.zh = [['钱', 'qian'], ['孙', 'sun'], ['冯', 'feng']];
  DOM_KEYS.ja = [['ジロウ', 'じろう', 'jiro'], ['サブロウ', 'さぶろう', 'saburo'], ['ヘイキチ', 'へいきち', 'heikichi']];
  function judgeParcel(text, l = dl()) {
    const who = DOM_KEYS[l].findIndex(keys => hasAny(text, keys));
    const question = /[?¿]/.test(text) || hasAny(text, QW[l]);
    return { who, question };
  }
  async function parcelAsk() {
    const l = dl(), q = S().q, men = [0, 1, 2].map(i => built.P['dom' + i].api);
    const r = await commandLocked({ name: G.state.mimoName, icon: 'newspaper', title: `Three old men are playing dominoes. Which one is ${nm('dom0')}? Ask them.`, verbs: [], placeholder: 'ask for him by name…',
      hint: `Ask in ${LNAME[l]}, with his name.`, model: cjkGame() ? fillVars(MODEL.parcel[l], {}, true) : MODEL.parcel[l], modelEn: fillVars(MODEL.parcel.en) });
    if (!r || r.cancelled) return;
    const v = judgeParcel(r.text);
    if (v.who < 0) { sound('wrong'); await speak(men[1], LT['tl.dom.huh']); return; }
    if (v.who > 0) { await speak(men[v.who], LT['tl.dom.notme'], { me: nmRaw('dom' + v.who) }); return; }
    if (!v.question) UI.toast(`Close! Better: «${plainC(cjkGame() ? fillVars(MODEL.parcel[l], {}, true) : MODEL.parcel[l])}»`); else sound('review');
    const P0 = built.P.dom0; P0.S.wave = 1.5;
    await speak(men[0], LT['tl.dom.me']);
    q.parcel = 2; G.save();
    await speak(men[0], LT['tl.dom.thanks']);
    G.state.coins = (G.state.coins || 0) + 10; UI.toast('🪙 +10 coins'); sound('chest');
    G.save();
  }

  // ---------------------------------------------------------------- the shy fisher (Remanso): help him ask someone out for ice cream
  const SHY = { es: { want: ['quieres', 'quiere', 'queres', 'te gustaria', 'vamos', 'tomamos', 'comemos'], ice: ['helado', 'helados', 'heladito', 'nieve'] },
    pt: { want: ['quer', 'queres', 'bora', 'vamos', 'topa', 'gostaria'], ice: ['sorvete', 'sorvetes', 'sorvetinho', 'picole'] },
    de: { want: ['willst', 'mochtest', 'magst', 'wollen', 'gehen wir', 'lust'], ice: ['eis', 'eisessen', 'ein eis'] },
    zh: { want: ['想', '要不要', '一起', 'xiang', 'yaobuyao', 'yiqi'], ice: ['冰淇淋', '冰激凌', '雪糕', 'bingqilin', 'bingjiling', 'xuegao'] },
    ja: { want: ['ませんか', 'いっしょ', '一緒', 'masenka', 'issho', 'tabeyo', 'iko'], ice: ['アイス', 'aisu'] } };
  function judgeShy(text, l = dl()) { const W = SHY[l]; return hasAny(text, W.want) && hasAny(text, W.ice); }
  function asQuestion(text, l = lang()) {
    let s = text.trim().replace(/\s+/g, ' ');
    if (cjkGame()) { s = s.replace(/[.!。！]+$/, ''); return /[?？]$/.test(s) ? s : s + (/[぀-ヿ㐀-鿿]/.test(s) ? '？' : '?'); }     // (zh / ja: as typed)
    s = s.charAt(0).toUpperCase() + s.slice(1);
    if (!/[?]$/.test(s)) s = s.replace(/[.!]+$/, '') + '?';
    if (l === 'es' && !/^¿/.test(s)) s = '¿' + s;
    return s;
  }
  async function shyTalk() {
    const q = S().q, p = built.P.shy.api;
    if ((q.shy || 0) >= 2) { await speak(p, LT['tl.shy.later']); return; }
    if (!q.shy) { await speak(p, LT['tl.shy.ask']); q.shy = 1; G.save(); }
    else await speak(p, LT['tl.shy.before']);
    await speak(p, LT['tl.shy.ask2']);
    const l = dl();
    const r = await commandLocked({ name: nm('shy'), icon: 'icecream', title: `Write the question ${nm('shy')} wants to ask ${nm('vale')}`, verbs: [], placeholder: 'write the question…',
      hint: `Ask her if she wants to have an ice cream with him, in ${LNAME[l]}.`, model: MODEL.shy[l], modelEn: MODEL.shy.en });
    if (!r || r.cancelled) return;
    if (!judgeShy(r.text)) { sound('wrong'); await speak(p, LT['tl.shy.nervous']); return; }
    sound('review');
    const V = built.P.vale.api, line = asQuestion(r.text);
    lock(true);
    try {
      G.cam.override = { pos: V3((p.x + V.x) / 2 + 1.2, p.y + 2.6, (p.z + V.z) / 2 + 5.0), look: V3((p.x + V.x) / 2, p.y + 1.0, (p.z + V.z) / 2) };
      await STORY.wait(0.6);
      await speak(p, { tl: line, en: MODEL.shy.en });
      await speak(V, LT['tl.shy.yes']);
      q.shy = 2; G.save();
      G.w3d.fx.sparkle((p.x + V.x) / 2, p.y + 1.6, (p.z + V.z) / 2, 18, ['#ff8fb1', '#fff3a0']); sound('learned');
      await STORY.wait(0.6);
      await speak(p, LT['tl.shy.after']);
    } finally { G.cam.override = null; lock(false); }
    G.state.bag = G.state.bag || {}; G.state.bag['w.icecream'] = (G.state.bag['w.icecream'] || 0) + 1; G.state.coins = (G.state.coins || 0) + 5;
    UI.toast(`🪙 +5 coins · ${cap(LEX.form('w.icecream'))} ×1`); sound('chest');
    G.save();
  }

  // ---------------------------------------------------------------- everyone else
  const LIFE = { paper: ['tl.paper.0', 'tl.paper.1'], gossipA: ['tl.gossipA.0', 'tl.gossipA.1'], gossipB: ['tl.gossipB.0', 'tl.gossipB.1'], sweeper: ['tl.sweeper.0', 'tl.sweeper.1'],
    walker: ['tl.walker.0', 'tl.walker.1'], dom0: ['tl.dom.0', 'tl.dom.2'], dom1: ['tl.dom.1', 'tl.dom.0'], dom2: ['tl.dom.2', 'tl.dom.1'], vale: ['tl.vale.0', 'tl.vale.1'] };
  async function lifeTalk(id) {
    const st = S(), keys = LIFE[id], n = (st.talk[id] = (st.talk[id] || 0) + 1);
    let key = keys[(n - 1) % keys.length];
    if (id === 'vale' && (st.q.shy || 0) >= 2) key = 'tl.vale.0';
    await speak(built.P[id].api, LT[key]);
  }

  // ---------------------------------------------------------------- what you can press E on (story.js adds these outdoors)
  function interactables() {
    if (!G || !built || !G.state.flags || !G.state.flags.hatched) return [];
    const Y = G.sim.you, list = [], q = S().q;
    const add = (x, z, r, label, run) => { if (Math.abs(x - Y.x) < r + 2 && Math.abs(z - Y.z) < r + 2) list.push({ x, z, r, label, run }); };
    const near = key => Math.hypot(Y.x - TOWN_C[key].x, Y.z - TOWN_C[key].z) < 60;
    const B = built.P, giver = catGiver();
    const talk = (id, run, r = 2.4, label = 'Talk') => { const p = B[id]; if (p) add(p.S.x, p.S.z, r, label, run); };
    if (near('alba')) {
      if (SMOKERS[dl()]) {        // (each language has its own trio and sailor)
        built.seatApi.forEach((a, i) => add(a.x, a.z, 2.8, giver === 2 ? 'Ask' : 'Talk', () => (giver === 2 ? catAsk(a, 2) : smokerTalk(i))));
        const g = built.goyoApi; add(g.x, g.z, 2.6, giver === 1 ? 'Ask' : 'Talk', () => (giver === 1 ? catAsk(g, 1) : swearerTalk()));
      }
      if ((q.cat || 0) === 1) { const c = PL.hangout.catCrate; add(c.x, c.z, 1.9, 'Pick up', pickCat); }
      talk('paper', () => (giver === 0 ? catAsk(B.paper.api, 0) : lifeTalk('paper')), 2.4, giver === 0 ? 'Ask' : 'Talk');
      talk('gossipA', () => lifeTalk('gossipA')); talk('gossipB', () => lifeTalk('gossipB'));
      talk('paloma', catTalk);
    }
    if (near('molinar')) {
      [0, 1, 2].forEach(i => talk('dom' + i, () => lifeTalk('dom' + i), 2.2));
      if ((q.parcel || 0) === 1) { const D = PL.dominoes; add(D.x - 1.6, D.z, 2.2, 'Ask', parcelAsk); }
      talk('kid', kiteTalk, 2.4, (q.kite || 0) === 1 ? 'Help' : 'Talk');
      talk('sweeper', () => lifeTalk('sweeper')); talk('walker', () => lifeTalk('walker'));
      const SG = PL.sign; add(SG.x - 0.5, SG.z, 1.8, (q.sign || 0) === 1 ? 'Fix the sign' : 'Read', signLook);
    }
    if (near('remanso')) { talk('vale', () => lifeTalk('vale')); talk('shy', shyTalk); }
    for (const [key, st] of Object.entries(PL.stores)) if (near(key)) {
      const f = ahead(st, 2.0); add(f.x, f.z, 2.4, 'Shop', () => openStore(key));
      const b = ahead(st, 4.4); add(b.x, b.z, 1.4, 'Read', () => storeSignRead(key));        // (step back to read the sign on the roof)
    }
    return list;
  }
  const SIGN_EN = { alba: { es: 'the little shop', pt: 'the little shop', de: 'kiosk (a corner shop)' }, molinar: { es: 'the general store', pt: 'the little market', de: 'the late shop (open till late)' },
    remanso: { es: 'the kiosk', pt: 'the newsstand', de: 'the little kiosk' } };
  Object.assign(SIGN_EN.alba, { zh: 'the corner shop', ja: 'the shop' }); Object.assign(SIGN_EN.molinar, { zh: 'the general store', ja: 'the general store' }); Object.assign(SIGN_EN.remanso, { zh: 'the newsstand', ja: 'the kiosk' });
  async function storeSignRead(key) {
    const l = dl(), text = cjkGame() ? SIGN_TEXT[key][l] : cap(SIGN_TEXT[key][l].toLowerCase()), A1 = PL.stores[key].awn[0];     // (zh / ja: the notation; the card shows its reading)
    await readCard({ tag: 'The sign on the corner store', lines: [{ text, en: SIGN_EN[key][l] || 'corner store', look: { face: '#fdf3dc', edge: A1, ink: '#2b2235' } }] }, `«${plainC(text)}»… ${SIGN_EN[key][l]}.`);
  }

  // ---------------------------------------------------------------- the quests (quests.js LIST entries)
  function quests() {
    const qq = s => (s.tl && s.tl.q) || {};
    const at = id => { const p = built && built.P[id]; return p ? { x: p.S.x, z: p.S.z } : null; };
    const giverAt = () => { const c = qq(G.state).catClue || 0; return c === 0 ? at('paper') : c === 1 ? { x: PL.cart.goyo.x, z: PL.cart.goyo.z } : { x: PL.hangout.seats[1].x, z: PL.hangout.seats[1].z }; };
    return [
      { id: 'tl.cat', kind: 'side', get title() { return `Where’s ${nm('michi')}?`; }, get giver() { return `${nm('paloma')}, by Alba’s corner store`; },
        started: s => (qq(s).cat || 0) >= 1,
        steps: [
          { get text() { return `Ask around: «${plainC(MODEL.cat[dl()])}» ({n}/3)`; }, n: s => Math.min(3, qq(s).catClue || 0),
            get why() { return `${nm('paloma')}’s {w.cat} ${nm('michi')} ran off. She’s orange, with white paws. Ask people if they’ve seen her.`; },
            done: s => (qq(s).catClue || 0) >= 3 || (qq(s).cat || 0) >= 2, target: giverAt, word: 'w.cat', hint: '{mimo} sniffs the air… someone over there might have seen her.' },
          { get text() { return `Find ${nm('michi')}, the orange {w.cat}`; }, why: 'The guys on the corner by the west gate saw her: asleep in a crate by the wall!',
            done: s => (qq(s).cat || 0) >= 2, target: () => ({ x: PL.hangout.catCrate.x, z: PL.hangout.catCrate.z }), word: 'w.cat', hint: '{mimo} tiptoes toward the crates by the wall…' },
          { get text() { return `Bring ${nm('michi')} back to ${nm('paloma')}`; }, get why() { return `${nm('paloma')} is waiting by Alba’s corner store, just inside the north gate.`; },
            done: s => (qq(s).cat || 0) >= 3, target: () => at('paloma'), hint: '{mimo} points north, to the corner store.' },
        ],
        story: [{ when: s => (qq(s).cat || 0) >= 3, get text() { return `${nm('michi')}, ${nm('paloma')}’s {w.cat}, had curled up in a crate by the smokers’ bench. You found her by asking around.`; } }] },
      { id: 'tl.kite', kind: 'side', get title() { return `${nm('kid')}’s {w.kite}`; }, get giver() { return `${nm('kid')}, by Molinar’s corner store`; },
        started: s => (qq(s).kite || 0) >= 1,
        steps: [{ text: 'Get the {w.kite} down from the {w.tree}', why: 'It’s stuck way up in the branches, next to the corner store by the Great Mill. {mimo} can jump really high…',
          done: s => (qq(s).kite || 0) >= 2, target: () => ({ x: PL.kiteTree.x, z: PL.kiteTree.z }), word: 'v.jump', hint: '{mimo} looks up at the {w.tree} and wiggles, ready to jump.' }] },
      { id: 'tl.sign', kind: 'side', title: 'A sign with a typo', get giver() { return `${nm('keeper_molinar')}, at Molinar’s corner store`; },
        started: s => (qq(s).sign || 0) >= 1,
        steps: [{ text: 'Read the new sign and write it correctly', get why() { return `${nm('keeper_molinar')} painted it at four in the morning. Something on it is spelled wrong.`; },
          done: s => (qq(s).sign || 0) >= 2, target: () => ({ x: PL.sign.x, z: PL.sign.z }), hint: '{mimo} points at the little chalkboard by the store.' }] },
      { id: 'tl.parcel', kind: 'side', get title() { return `A parcel for ${nm('dom0')}`; }, get giver() { return `${nm('keeper_alba')}, at Alba’s corner store`; },
        started: s => (qq(s).parcel || 0) >= 1,
        steps: [{ get text() { return `Ask for ${nm('dom0')} at the dominoes table in Molinar`; }, why: 'He plays dominoes with two friends by the Great Mill. You don’t know which one he is: ask for him by name!',
          done: s => (qq(s).parcel || 0) >= 2, target: () => ({ x: PL.dominoes.x, z: PL.dominoes.z }), hint: '{mimo} points east, toward Molinar and its Great Mill.' }] },
      { id: 'tl.shy', kind: 'side', title: 'Shy at the lake', get giver() { return `${nm('shy')}, in Remanso`; },
        started: s => (qq(s).shy || 0) >= 1,
        steps: [{ get text() { return `Help ${nm('shy')} ask ${nm('vale')} out for {w.icecream}`; }, get why() { return `${nm('shy')} knows what he wants to say, just not the words. Write the question for him: does she want to have some {w.icecream} with him?`; },
          done: s => (qq(s).shy || 0) >= 2, target: () => at('shy'), word: 'w.icecream', hint: '{mimo} points at the nervous young fisher by the kiosk.' }] },
    ];
  }

  // ---------------------------------------------------------------- the phrasebook (for the journal)
  function phrasebook() {
    // (zh / ja: slang as notation, which the journal shows with ruby; swears as plain text, which it shows as they are)
    const l = dl(), st = G ? S().phr : {}, out = [];
    for (const sm of SMOKERS[l]) for (const p of sm.phrases) out.push({ id: p.id, phrase: p.tl, shown: p.tl, en: enC(p.en), note: enC(p.note), region: sm.region.en, register: 'slang', strength: null, insult: false, learned: !!st[p.id], from: sm.name });
    for (const it of SWEARER[l].items) out.push({ id: it.id, phrase: it.tl, shown: plainC(bleep(it.tl)), en: bleep(it.en), note: enC(it.note), region: '', register: 'swear', strength: it.s, insult: !!it.insult, learned: !!st[it.id], from: SWEARER[l].name });
    return out;
  }

  return {
    init(game) {
      G = game;
      register(); ensureShop(); css();
      if (typeof QUESTS !== 'undefined' && QUESTS.LIST) for (const q of quests()) if (!QUESTS.LIST.some(x => x.id === q.id)) QUESTS.LIST.push(q);
    },
    build, interactables, phrasebook, bleep, bareAt,
    get places() { return PL; },
    // tests and tools
    _: {
      SMOKERS, SWEARER, LT, MODEL, SIGN_TYPO, NEWS, PL, WORDS, lineOf, fillVars, bleep, hasAny, judgeCat, judgeShy, judgeParcel, asQuestion, ensureShop,
      cjkStrings, keysOf, enC, GROUP, BANTER,
      panel, panelSubmit: text => { if (!PS) return false; PS.submit(text); return true; }, panelOpen: () => !!PS, panelKey: k => { if (!PE || !PS) return false; PE.input.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })); return true; },
      panelState: () => (PS ? { mode: PS.o.mode, answer: PS.o.answer, hints: PS.hints, revealed: PS.revealed, title: PS.o.title, prompt: PS.o.prompt || '', hint: PE.hint.textContent } : null),
      speak, smokerTalk, swearerTalk, swearLesson, openStore, readPaper, catTalk, catAsk, pickCat, kiteTalk, kiteCommand, signLook, parcelAsk, shyTalk, lifeTalk, gumBubble,
      quests, S: () => S(), get B() { return built; },
    },
  };
})();
