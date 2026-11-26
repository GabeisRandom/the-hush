'use strict';
// The shops of Molinar (DESIGN.md 14.2): you buy by asking, in whole sentences.
//  - Every price shows on its tag, the digits and the word (P6b, DESIGN.md 19: they used to show «?» until you asked). Point at
//    a thing, or ask («¿Cuánto cuesta el queso?»), and the keeper says it out loud («Cuesta cinco monedas»). For your first
//    orders, js/shop_order.js shows the frames and chips (SHOP.onPaint), and js/pantry.js what each thing does.
//  - You buy any quantity from 1 to 20, in words or digits: «Quiero dos manzanas, por favor», «Ich
//    hätte gern einen Käse», «Me vê três biscoitos». Each request is graded S–D like an attack:
//    agreement (una manzana / dos manzanas, duas maçãs, einen Apfel), the verb, word order, spelling
//    (a missing accent is only a tip, P6a: but «Apfel» for «Äpfel» is an A) and politeness, which an S needs. A polite S takes a coin off each
//    thing (never below 1). Bossy «Dame…» / «Gib mir…» works, but grades B at best.
//  - The keeper's lines follow the weave like everyone else's (UI.partsHTML / UI.noteWoven): English
//    with the shop words in the language, then (as the weave rises) the whole line in the language;
//    the English only on request (EN), never under the line by default (DESIGN.md 17.3).
//  - Help (or typing ? / idk) shows a model sentence to copy, like the teach box's "I don't know".
//  - zh / ja (CJK.md) have their own grammar, notes and lines (parseCJ, "zh / ja" below): measure words and 两 for zh
//    («我要两个苹果», «请给我一罐蜂蜜», «苹果多少钱？»), を and the counters for ja («りんご を ふたつ ください», «りんご は いくら
//    です か»), typed in characters (the in-game IME on the box) or pinyin / rōmaji, tones optional.
//
//   SHOP.open({ lang, stall: { id, keeper: { id, name } }, coins, bag, mimoName, asked })
//     → Promise<{ coins, bag, bought: [{ id, n, price, total, grade }], log, asked }>
//   SHOP.parse(text, lang, stallId, ctx) → { kind, items, grade, reason, notes, canon, … }
//   SHOP.extend({ words, items, goods, en, mass, listSg, pricePl, stalls, enWords, cj }) adds goods and stalls (townlife.js's
//     corner stores: juice, soda, ice cream, candy, chocolate, gum, the newspaper), see the bottom of the file
//
// It brings its own CSS and DOM, registers the new words with LEX (w.pear … w.hat, w.coin, and the
// numbers n.1 … n.20) and draws their icons. Loads after ui.js, before story.js and battle/.

const SHOP = (() => {
  const LANGS = ['es', 'pt', 'de'];
  const LNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German' };

  // ================================================================ the catalog
  // [id, price in coins, hearts it heals in battle, the stall that sells it]
  const CATALOG = [
    ['w.apple', 2, 1, 'fruit'], ['w.pear', 2, 1, 'fruit'], ['w.orange', 3, 1, 'fruit'],
    ['w.bread', 4, 2, 'bakery'], ['w.cake', 9, 3, 'bakery'],
    ['w.cheese', 5, 2, 'cheese'], ['w.honey', 6, 2, 'cheese'],
    ['w.cookie', 1, 1, 'sweets'],
    ['w.hat', 15, 0, 'hats'],              // heals nothing: Mimo wears it
  ];
  const STALLS = {};
  CATALOG.forEach(([id, , , st]) => (STALLS[st] = STALLS[st] || []).push(id));
  const PRICE = {};
  CATALOG.forEach(([id, p]) => { PRICE[id] = p; });
  // fine on their own, with no number or article: «quiero pan», «Ich möchte Käse» (= one)
  const MASS = new Set(['w.bread', 'w.cake', 'w.cheese', 'w.honey']);
  // named in the singular when the keeper lists them: «Tengo pan y pasteles»
  const LIST_SG = new Set(['w.bread', 'w.cheese', 'w.honey']);
  // asked about in the plural in the help's model sentence: «¿Cuánto cuestan las manzanas?»
  const PRICE_PL = new Set(['w.apple', 'w.pear', 'w.orange', 'w.cookie']);

  // the new words (apple and bread are already in words.js)
  const NEW_WORDS = [
    { id: 'w.pear', es: 'pera', pt: 'pera', de: 'Birne', en: 'pear', enPl: 'pears', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'peras', pt: 'peras', de: 'Birnen' }, icon: 'pear' },
    { id: 'w.orange', es: 'naranja', pt: 'laranja', de: 'Orange', en: 'orange', enPl: 'oranges', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'naranjas', pt: 'laranjas', de: 'Orangen' }, icon: 'orange' },
    { id: 'w.cake', es: 'pastel', pt: 'bolo', de: 'Kuchen', en: 'cake', enPl: 'cakes', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'pasteles', pt: 'bolos', de: 'Kuchen' }, icon: 'cake' },
    { id: 'w.cheese', es: 'queso', pt: 'queijo', de: 'Käse', en: 'cheese', enPl: 'cheeses', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'quesos', pt: 'queijos', de: 'Käse' }, icon: 'cheese' },
    { id: 'w.honey', es: 'miel', pt: 'mel', de: 'Honig', en: 'honey', enPl: 'jars of honey', g: { es: 'f', pt: 'm', de: 'm' }, pl: { es: 'mieles', pt: 'méis', de: 'Honige' }, icon: 'honey' },
    { id: 'w.cookie', es: 'galleta', pt: 'biscoito', de: 'Keks', en: 'cookie', enPl: 'cookies', g: { es: 'f', pt: 'm', de: 'm' }, pl: { es: 'galletas', pt: 'biscoitos', de: 'Kekse' }, icon: 'cookie' },
    { id: 'w.hat', es: 'sombrero', pt: 'chapéu', de: 'Hut', en: 'hat', enPl: 'hats', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'sombreros', pt: 'chapéus', de: 'Hüte' }, icon: 'hat' },
    { id: 'w.coin', es: 'moneda', pt: 'moeda', de: 'Münze', en: 'coin', enPl: 'coins', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'monedas', pt: 'moedas', de: 'Münzen' }, icon: 'coin' },
  ];
  NEW_WORDS.forEach(w => { if (!LEX.item(w.id)) LEX.register([Object.assign({ kind: 'word' }, w)]); });
  // the catalog as the rest of the game reads it (journal bag tab, food in battles)
  const ITEMS = CATALOG.map(([id, price, heal, stall]) => Object.assign({}, LEX.item(id) || {}, { id, price, heal, stall, mass: MASS.has(id) }));
  const BY_ID = {};
  ITEMS.forEach(it => { BY_ID[it.id] = it; });

  // numbers 1–20 (n.1 … n.20): «un / una», «um / uma», «dois / duas», «ein / eine / einen»
  const NUM = {
    es: ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'],
    pt: ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove', 'vinte'],
    de: ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn', 'zwanzig'],
    en: ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
  };
  const NUM_ALT = { pt: { 14: ['quatorze'], 16: ['dezasseis'], 17: ['dezassete'], 19: ['dezanove'] }, de: { 2: ['zwo'] } };
  for (let n = 1; n <= 20; n++) {
    if (LEX.item('n.' + n)) continue;
    const it = { id: 'n.' + n, kind: 'number', n, es: NUM.es[n], pt: NUM.pt[n], de: NUM.de[n], en: NUM.en[n], icon: 'num' + n };
    if (n === 1) Object.assign(it, { f: { es: 'una', pt: 'uma', de: 'eine' }, alt: { es: ['un', 'una'], pt: ['uma'], de: ['ein', 'eine', 'einen'] },
      forms: { es: { m: 'un', f: 'una', alone: 'uno' }, pt: { m: 'um', f: 'uma' }, de: { m: 'ein', f: 'eine', n: 'ein', acc: 'einen', alone: 'eins' } } });
    if (n === 2) Object.assign(it, { f: { pt: 'duas' }, alt: { pt: ['duas'], de: ['zwo'] }, forms: { pt: { m: 'dois', f: 'duas' } } });
    if (NUM_ALT.pt[n] && n !== 2) it.alt = { pt: NUM_ALT.pt[n] };
    LEX.register([it]);
  }

  // ================================================================ icons (same paper-cutout rule as icons.js)
  if (typeof ICONS !== 'undefined') {
    const stem = (c, x1, y1, x2, y2, col = '#5b3a22', w = 3) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineWidth = w; c.strokeStyle = col; c.stroke(); };
    ICONS.add('pear', (c, p, h) => {
      h.shape(c, p, k => { k.moveTo(0, -28); k.bezierCurveTo(9, -28, 11, -14, 13, -6); k.bezierCurveTo(30, 4, 28, 32, 0, 32); k.bezierCurveTo(-28, 32, -30, 4, -13, -6); k.bezierCurveTo(-11, -14, -9, -28, 0, -28); k.closePath(); }, '#c9d54a');
      h.shape(c, p, h.ell(12, -32, 9, 4.5, -0.5), '#5cb04c');
      if (p) { stem(c, 0, -27, -2, -39); h.dot(c, -10, 10, 5, 'rgba(255,255,255,0.45)'); }
    });
    ICONS.add('orange', (c, p, h) => {
      h.shape(c, p, h.ell(0, 5, 28, 27), '#f39a2b');
      h.shape(c, p, h.ell(11, -24, 10, 4.5, -0.4), '#5cb04c');
      if (p) { h.dot(c, -11, -5, 5, 'rgba(255,255,255,0.45)'); h.dot(c, 1, -21, 2.4, '#7a4a1a'); [[9, 10], [15, 0], [-4, 17], [3, 24], [-15, 10], [12, 20]].forEach(([x, y]) => h.dot(c, x, y, 1.3, 'rgba(150,70,10,0.45)')); }
    });
    ICONS.add('cake', (c, p, h) => {
      h.shape(c, p, h.rr(-30, -8, 60, 36, 8), '#f3d9a6');
      h.shape(c, p, k => { k.moveTo(-32, -4); k.quadraticCurveTo(-32, -20, -16, -20); k.lineTo(16, -20); k.quadraticCurveTo(32, -20, 32, -4); k.quadraticCurveTo(28, 6, 23, -1); k.quadraticCurveTo(17, 9, 11, -1); k.quadraticCurveTo(5, 8, -1, -1); k.quadraticCurveTo(-7, 9, -13, -1); k.quadraticCurveTo(-20, 8, -25, -1); k.quadraticCurveTo(-29, 3, -32, -4); k.closePath(); }, '#f6a6c1');
      h.shape(c, p, h.ell(0, -26, 7, 7), '#e2483a');
      if (p) { c.beginPath(); c.moveTo(0, -32); c.quadraticCurveTo(4, -40, 10, -41); c.lineWidth = 2; c.strokeStyle = '#5b3a22'; c.stroke(); stem(c, -27, 14, 27, 14, 'rgba(214,69,58,0.5)', 3); h.dot(c, -2, -28, 2, '#fff'); }
    });
    ICONS.add('cheese', (c, p, h) => {
      h.shape(c, p, h.poly([[-32, 2], [30, -8], [30, 24], [-32, 26]]), '#f2b632');
      h.shape(c, p, h.poly([[-32, 2], [30, -8], [-6, -28]]), '#ffd65a');
      if (p) [[-16, 14, 5, 4], [6, 10, 4, 3.4], [20, 17, 3, 2.6], [-3, 20, 2.6, 2.2], [-6, -12, 3.4, 2]].forEach(([x, y, rx, ry]) => h.shape(c, 1, h.ell(x, y, rx, ry), '#d9971c', 1.4));
    });
    ICONS.add('honey', (c, p, h) => {
      h.shape(c, p, h.rr(-24, -14, 48, 44, 12), '#f2a93b');
      h.shape(c, p, h.rr(-20, -27, 40, 14, 5), '#b8662e');
      if (p) {
        h.shape(c, 1, h.rr(-16, 0, 32, 18, 5), '#fffaf0', 1.6);
        h.shape(c, 1, k => { for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3, x = Math.cos(a) * 5.5, y = 9 + Math.sin(a) * 5.5; if (i) k.lineTo(x, y); else k.moveTo(x, y); } k.closePath(); }, '#f2a93b', 1.4);
        h.shape(c, 1, k => { k.moveTo(-20, -13); k.lineTo(-2, -13); k.quadraticCurveTo(-3, -5, -7, -4); k.quadraticCurveTo(-11, -3, -11, -8); k.quadraticCurveTo(-15, -4, -18, -8); k.closePath(); }, '#f7c04a', 1.3);
        h.dot(c, 15, -6, 3.5, 'rgba(255,255,255,0.5)');
      }
    });
    ICONS.add('cookie', (c, p, h) => {
      h.shape(c, p, h.ell(0, 2, 30, 28), '#d9a35a');
      if (p) [[-12, -8, 4], [8, -12, 3.5], [14, 6, 4], [-6, 13, 3.5], [-17, 6, 3], [3, 1, 3]].forEach(([x, y, r]) => h.dot(c, x, y, r, '#5b3a22'));
    });
    // the straw hat Mimo wears
    ICONS.add('hat', (c, p, h) => {
      h.shape(c, p, h.ell(0, 15, 40, 11), '#e8c477');
      h.shape(c, p, k => { k.moveTo(-20, 13); k.bezierCurveTo(-23, -28, 23, -28, 20, 13); k.closePath(); }, '#f0d389');
      if (p) {
        h.shape(c, 1, k => { k.moveTo(-21.5, 2); k.lineTo(21.5, 2); k.lineTo(20.6, 11); k.lineTo(-20.6, 11); k.closePath(); }, '#e2483a', 1.6);
        [[-12, -8, -6, -14], [2, -16, 8, -10], [10, -4, 14, -1], [-28, 16, -20, 18], [22, 16, 30, 15]].forEach(([a, b, d, e]) => stem(c, a, b, d, e, 'rgba(160,110,40,0.6)', 1.3));
        h.dot(c, -8, -12, 3, 'rgba(255,255,255,0.45)');
      }
    });
    ICONS.add('coin', (c, p, h) => {
      h.shape(c, p, h.ell(0, 2, 28, 28), '#ffc93c');
      if (p) {
        h.shape(c, 1, h.ell(0, 2, 19, 19), '#ffd96b', 1.5);
        h.shape(c, 1, k => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4.5 : 10; if (i) k.lineTo(Math.cos(a) * r, 2 + Math.sin(a) * r); else k.moveTo(Math.cos(a) * r, 2 + Math.sin(a) * r); } k.closePath(); }, '#f0a020', 1.3);
        h.dot(c, -13, -10, 4, 'rgba(255,255,255,0.65)');
      }
    });
    for (let n = 1; n <= 20; n++) ICONS.add('num' + n, (c, p, h) => {
      h.shape(c, p, h.rr(-30, -28, 60, 58, 14), '#ffe9a8');
      if (p) { c.fillStyle = h.INK; c.font = `800 ${n > 9 ? 32 : 38}px Bahnschrift, "Segoe UI", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(n), 0, 2); }
    });
  }

  // ================================================================ the words the keeper understands
  // Every accepted form of the goods: [singular, plural(s), gender]. The first is the standard word;
  // the others are what people also say in some places (torta, bolacha, Brötchen…).
  const GOODS = {
    es: { 'w.apple': [['manzana', 'manzanas', 'f']], 'w.pear': [['pera', 'peras', 'f']], 'w.orange': [['naranja', 'naranjas', 'f']],
      'w.bread': [['pan', 'panes', 'm'], ['pancito', 'pancitos', 'm']], 'w.cake': [['pastel', 'pasteles', 'm'], ['torta', 'tortas', 'f'], ['bizcocho', 'bizcochos', 'm'], ['queque', 'queques', 'm']],
      'w.cheese': [['queso', 'quesos', 'm']], 'w.honey': [['miel', 'mieles', 'f']], 'w.cookie': [['galleta', 'galletas', 'f'], ['galletita', 'galletitas', 'f']],
      'w.hat': [['sombrero', 'sombreros', 'm']] },
    pt: { 'w.apple': [['maçã', 'maçãs', 'f']], 'w.pear': [['pera', 'peras', 'f']], 'w.orange': [['laranja', 'laranjas', 'f']],
      'w.bread': [['pão', 'pães', 'm'], ['pãozinho', 'pãezinhos', 'm']], 'w.cake': [['bolo', 'bolos', 'm']],
      'w.cheese': [['queijo', 'queijos', 'm']], 'w.honey': [['mel', ['méis', 'meles'], 'm']], 'w.cookie': [['biscoito', 'biscoitos', 'm'], ['bolacha', 'bolachas', 'f']],
      'w.hat': [['chapéu', 'chapéus', 'm']] },
    de: { 'w.apple': [['Apfel', 'Äpfel', 'm']], 'w.pear': [['Birne', 'Birnen', 'f']], 'w.orange': [['Orange', 'Orangen', 'f'], ['Apfelsine', 'Apfelsinen', 'f']],
      'w.bread': [['Brot', 'Brote', 'n'], ['Brötchen', 'Brötchen', 'n']], 'w.cake': [['Kuchen', 'Kuchen', 'm'], ['Torte', 'Torten', 'f']],
      'w.cheese': [['Käse', 'Käse', 'm']], 'w.honey': [['Honig', 'Honige', 'm']], 'w.cookie': [['Keks', 'Kekse', 'm'], ['Plätzchen', 'Plätzchen', 'n']],
      'w.hat': [['Hut', 'Hüte', 'm']] },
  };
  const mainLemma = (id, lang) => { const L = GOODS[lang][id][0]; return { id, sg: L[0], pl: [].concat(L[1])[0], g: L[2] }; };
  const gOf = (id, lang) => (id === 'w.coin' ? 'f' : mainLemma(id, lang).g);
  // jars and pieces: «un frasco de miel», «zwei Gläser Honig», «ein Stück Kuchen» [sg, pl, gender, kind, measure]
  // (measure: German says «zwei Stück Kuchen», «zwei Glas Honig» as well as «zwei Gläser»)
  const UNITS = {
    es: [['frasco', 'frascos', 'm', 'jar'], ['tarro', 'tarros', 'm', 'jar'], ['trozo', 'trozos', 'm', 'piece'], ['pedazo', 'pedazos', 'm', 'piece'], ['rebanada', 'rebanadas', 'f', 'piece']],
    pt: [['pote', 'potes', 'm', 'jar'], ['vidro', 'vidros', 'm', 'jar'], ['pedaço', 'pedaços', 'm', 'piece'], ['fatia', 'fatias', 'f', 'piece']],
    de: [['Glas', 'Gläser', 'n', 'jar', 1], ['Stück', 'Stücke', 'n', 'piece', 1], ['Scheibe', 'Scheiben', 'f', 'piece']],
  };
  // the jar the keeper puts honey in
  const JAR = { es: { sg: 'frasco', pl: 'frascos', g: 'm', of: ' de ' }, pt: { sg: 'pote', pl: 'potes', g: 'm', of: ' de ' }, de: { sg: 'Glas', pl: 'Gläser', g: 'n', of: ' ' } };

  // Asking for things. tone: 1 polite, -1 bossy (0 neutral). qp: polite when asked as a question
  // («¿Me da…?»). err: the wrong person («quieres» = you want). inf: an infinitive, fine after
  // «quiero», «puede», «voy a». needDe: takes «de» (pt «gostaria de…»). canon: the model frame.
  const VERBS = {
    es: {
      quiero: { v: 'want', canon: 'Quiero …' }, queremos: { v: 'want', canon: 'Queremos …' },
      quisiera: { v: 'want', tone: 1, canon: 'Quisiera …' }, 'quisiéramos': { v: 'want', tone: 1, canon: 'Quisiéramos …' },
      'querría': { v: 'want', tone: 1, canon: 'Querría …' }, 'quería': { v: 'want', tone: 1, canon: 'Quería …' },
      'gustaría': { v: 'want', tone: 1, canon: 'Me gustaría …' },
      quieres: { v: 'want', err: 1, fix: 'quiero', means: 'you want' }, quiere: { v: 'want', err: 1, fix: 'quiero', means: 'he / she wants' }, quieren: { v: 'want', err: 1, fix: 'quiero', means: 'they want' },
      querer: { v: 'want', inf: 1, fix: 'quiero', means: 'to want' },
      da: { v: 'give', qp: 1, canon: '¿Me da …?' }, das: { v: 'give', qp: 1, canon: '¿Me das …?' }, 'dé': { v: 'give', canon: '¿Me da …?' },
      deme: { v: 'give', canon: 'Deme …' }, denos: { v: 'give', canon: 'Denos …' },
      dame: { v: 'give', tone: -1, canon: '¿Me da …?' }, danos: { v: 'give', tone: -1, canon: '¿Nos da …?' }, ponme: { v: 'give', tone: -1, canon: '¿Me pone …?' },
      pone: { v: 'give', qp: 1, canon: '¿Me pone …?' }, 'póngame': { v: 'give', canon: 'Póngame …' },
      dar: { v: 'give', inf: 1, fix: 'da', means: 'to give' }, vender: { v: 'give', inf: 1, fix: 'vende', means: 'to sell' },
      puede: { v: 'can', tone: 1, canon: '¿Me puede dar …?' }, puedes: { v: 'can', tone: 1, canon: '¿Me puedes dar …?' },
      'podría': { v: 'can', tone: 1, canon: '¿Me podría dar …?' }, 'podrías': { v: 'can', tone: 1, canon: '¿Me podrías dar …?' }, pudiera: { v: 'can', tone: 1, canon: '¿Me pudiera dar …?' },
      regala: { v: 'give', tone: 1, canon: '¿Me regala …?' }, regalas: { v: 'give', tone: 1, canon: '¿Me regalas …?' },
      vende: { v: 'give', qp: 1, canon: '¿Me vende …?' }, vendes: { v: 'give', qp: 1, canon: '¿Me vendes …?' },
      llevo: { v: 'take', canon: 'Me llevo …' }, llevamos: { v: 'take', canon: 'Nos llevamos …' }, llevar: { v: 'take', inf: 1, fix: 'llevo', means: 'to take' },
      voy: { v: 'aux', canon: 'Voy a llevar …' }, vamos: { v: 'aux', canon: 'Vamos a llevar …' },
      compro: { v: 'buy', canon: 'Compro …' }, comprar: { v: 'buy', inf: 1, fix: 'compro', means: 'to buy' },
      necesito: { v: 'need', canon: 'Necesito …' }, necesitamos: { v: 'need', canon: 'Necesitamos …' }, necesitar: { v: 'need', inf: 1, fix: 'necesito', means: 'to need' },
      busco: { v: 'need', canon: 'Busco …' },
      tiene: { v: 'have', qp: 1, canon: '¿Tiene …?' }, tienen: { v: 'have', qp: 1, canon: '¿Tienen …?' }, tienes: { v: 'have', canon: '¿Tienes …?' },
      'tendría': { v: 'have', tone: 1, canon: '¿Tendría …?' }, 'tendrías': { v: 'have', tone: 1, canon: '¿Tendrías …?' },
      hay: { v: 'have', canon: '¿Hay …?' },
    },
    pt: {
      quero: { v: 'want', canon: 'Quero …' }, queremos: { v: 'want', canon: 'Queremos …' },
      queria: { v: 'want', tone: 1, canon: 'Queria …' }, 'queríamos': { v: 'want', tone: 1, canon: 'Queríamos …' },
      gostaria: { v: 'want', tone: 1, needDe: 1, canon: 'Gostaria de …' }, 'gostaríamos': { v: 'want', tone: 1, needDe: 1, canon: 'Gostaríamos de …' },
      quer: { v: 'want', err: 1, fix: 'quero', means: 'you want / he wants' }, querem: { v: 'want', err: 1, fix: 'quero', means: 'they want' },
      querer: { v: 'want', inf: 1, fix: 'quero', means: 'to want' },
      vou: { v: 'aux', canon: 'Vou levar …' },
      levo: { v: 'take', canon: 'Levo …' }, levamos: { v: 'take', canon: 'Levamos …' }, levar: { v: 'take', inf: 1, fix: 'levo', means: 'to take' },
      compro: { v: 'buy', canon: 'Compro …' }, comprar: { v: 'buy', inf: 1, fix: 'compro', means: 'to buy' },
      preciso: { v: 'need', needDe: 1, canon: 'Preciso de …' }, precisamos: { v: 'need', needDe: 1, canon: 'Precisamos de …' },
      'vê': { v: 'give', tone: 1, canon: 'Me vê …' },           // «me vê…»: the market way to ask
      'dá': { v: 'give', canon: 'Me dá …' }, 'dê': { v: 'give', canon: 'Me dê …' }, passa: { v: 'give', canon: 'Me passa …' },
      pode: { v: 'can', tone: 1, canon: 'Pode me dar …?' }, poderia: { v: 'can', tone: 1, canon: 'Poderia me dar …?' }, podia: { v: 'can', tone: 1, canon: 'Podia me dar …?' },
      dar: { v: 'give', inf: 1, fix: 'dá', means: 'to give' }, vender: { v: 'give', inf: 1, fix: 'vende', means: 'to sell' }, ver: { v: 'give', inf: 1, fix: 'vê', means: 'to see' },
      tem: { v: 'have', canon: 'Tem …?' }, 'têm': { v: 'have', canon: 'Têm …?' }, tens: { v: 'have', canon: 'Tens …?' }, teria: { v: 'have', tone: 1, canon: 'Teria …?' },
      vende: { v: 'give', qp: 1, canon: 'Vende …?' },
    },
    // German: lemma and person (p), so the ending can be checked against the subject
    de: {
      'möchte': { v: 'want', tone: 1, lemma: 'möchten', p: 'ich' }, 'möchten': { v: 'want', tone: 1, lemma: 'möchten', p: 'wir' }, 'möchtest': { v: 'want', tone: 1, lemma: 'möchten', p: 'du' },
      'hätte': { v: 'want', tone: 1, lemma: 'hätten', p: 'ich', gern: 1 }, 'hätten': { v: 'want', tone: 1, lemma: 'hätten', p: 'wir', gern: 1 }, 'hättest': { v: 'want', tone: 1, lemma: 'hätten', p: 'du', gern: 1 },
      nehme: { v: 'take', lemma: 'nehmen', p: 'ich' }, nehmen: { v: 'take', lemma: 'nehmen', p: 'wir', inf: 1 }, nimmst: { v: 'take', lemma: 'nehmen', p: 'du' }, nimm: { v: 'take', lemma: 'nehmen', p: 'imp' },
      will: { v: 'want', tone: -1, lemma: 'wollen', p: 'ich' }, wollen: { v: 'want', tone: -1, lemma: 'wollen', p: 'wir' }, willst: { v: 'want', tone: -1, lemma: 'wollen', p: 'du' },
      kaufe: { v: 'buy', lemma: 'kaufen', p: 'ich' }, kaufen: { v: 'buy', lemma: 'kaufen', p: 'wir', inf: 1 }, kaufst: { v: 'buy', lemma: 'kaufen', p: 'du' },
      brauche: { v: 'need', lemma: 'brauchen', p: 'ich' }, brauchen: { v: 'need', lemma: 'brauchen', p: 'wir', inf: 1 }, brauchst: { v: 'need', lemma: 'brauchen', p: 'du' },
      bekomme: { v: 'take', lemma: 'bekommen', p: 'ich' }, bekommen: { v: 'take', lemma: 'bekommen', p: 'wir', inf: 1 }, bekommst: { v: 'take', lemma: 'bekommen', p: 'du' },
      kriege: { v: 'take', lemma: 'kriegen', p: 'ich' }, kriegen: { v: 'take', lemma: 'kriegen', p: 'wir', inf: 1 },
      gib: { v: 'give', tone: -1, lemma: 'geben', p: 'imp' }, gebt: { v: 'give', tone: -1, lemma: 'geben', p: 'imp' }, geben: { v: 'give', lemma: 'geben', p: 'wir', inf: 1 },
      habe: { v: 'have', lemma: 'haben', p: 'ich' }, haben: { v: 'have', lemma: 'haben', p: 'wir', inf: 1 }, hast: { v: 'have', lemma: 'haben', p: 'du' }, habt: { v: 'have', lemma: 'haben', p: 'ihr' },
      kann: { v: 'can', tone: 1, lemma: 'können', p: 'ich' }, 'können': { v: 'can', tone: 1, lemma: 'können', p: 'wir' }, kannst: { v: 'can', tone: 1, lemma: 'können', p: 'du' },
      'könnte': { v: 'can', tone: 1, lemma: 'könnten', p: 'ich' }, 'könnten': { v: 'can', tone: 1, lemma: 'könnten', p: 'wir' }, 'könntest': { v: 'can', tone: 1, lemma: 'könnten', p: 'du' },
      darf: { v: 'can', tone: 1, lemma: 'dürfen', p: 'ich' }, 'dürfen': { v: 'can', tone: 1, lemma: 'dürfen', p: 'wir' }, 'dürfte': { v: 'can', tone: 1, lemma: 'dürften', p: 'ich' },
      verkaufen: { v: 'give', lemma: 'verkaufen', p: 'wir', inf: 1 },
      'würde': { v: 'aux', tone: 1, lemma: 'würden', p: 'ich' }, 'würden': { v: 'aux', tone: 1, lemma: 'würden', p: 'wir' },
    },
  };
  const DE_CONJ = {
    'möchten': { ich: 'möchte', du: 'möchtest', wir: 'möchten', sie: 'möchten', ihr: 'möchtet' }, 'hätten': { ich: 'hätte', du: 'hättest', wir: 'hätten', sie: 'hätten', ihr: 'hättet' },
    nehmen: { ich: 'nehme', du: 'nimmst', wir: 'nehmen', sie: 'nehmen', ihr: 'nehmt' }, wollen: { ich: 'will', du: 'willst', wir: 'wollen', sie: 'wollen', ihr: 'wollt' },
    kaufen: { ich: 'kaufe', du: 'kaufst', wir: 'kaufen', sie: 'kaufen', ihr: 'kauft' }, brauchen: { ich: 'brauche', du: 'brauchst', wir: 'brauchen', sie: 'brauchen', ihr: 'braucht' },
    bekommen: { ich: 'bekomme', du: 'bekommst', wir: 'bekommen', sie: 'bekommen', ihr: 'bekommt' }, kriegen: { ich: 'kriege', du: 'kriegst', wir: 'kriegen', sie: 'kriegen', ihr: 'kriegt' },
    geben: { ich: 'gebe', du: 'gibst', wir: 'geben', sie: 'geben', ihr: 'gebt' }, haben: { ich: 'habe', du: 'hast', wir: 'haben', sie: 'haben', ihr: 'habt' },
    'können': { ich: 'kann', du: 'kannst', wir: 'können', sie: 'können', ihr: 'könnt' }, 'könnten': { ich: 'könnte', du: 'könntest', wir: 'könnten', sie: 'könnten', ihr: 'könntet' },
    'dürfen': { ich: 'darf', du: 'darfst', wir: 'dürfen', sie: 'dürfen', ihr: 'dürft' }, 'dürften': { ich: 'dürfte', du: 'dürftest', wir: 'dürften', sie: 'dürften', ihr: 'dürftet' },
    'würden': { ich: 'würde', du: 'würdest', wir: 'würden', sie: 'würden', ihr: 'würdet' }, verkaufen: { ich: 'verkaufe', du: 'verkaufst', wir: 'verkaufen', sie: 'verkaufen', ihr: 'verkauft' },
  };
  const FIX_MEANS = { quiero: 'I want', quero: 'I want', da: 'give me', 'dá': 'give me', 'vê': 'get me', vende: 'sell me', llevo: 'I’ll take', levo: 'I’ll take', compro: 'I buy', necesito: 'I need' };

  // The rest of each language: articles, the question words, polite words, greetings…
  const tri = (add, rows, e) => rows.forEach(([w, g, pl]) => add(w, Object.assign({ g, pl }, e)));
  const LANG_WORDS = {
    es(add, each, phrase) {
      tri(add, [['el', 'm', 0], ['la', 'f', 0], ['los', 'm', 1], ['las', 'f', 1]], { t: 'det', def: 1 });
      tri(add, [['unos', 'm', 1], ['unas', 'f', 1]], { t: 'det', some: 1 });
      tri(add, [['otro', 'm', 0], ['otra', 'f', 0], ['otros', 'm', 1], ['otras', 'f', 1]], { t: 'det', other: 1 });
      tri(add, [['este', 'm', 0], ['esta', 'f', 0], ['estos', 'm', 1], ['estas', 'f', 1]], { t: 'det', dem: 'este' });
      tri(add, [['ese', 'm', 0], ['esa', 'f', 0], ['esos', 'm', 1], ['esas', 'f', 1]], { t: 'det', dem: 'ese' });
      add('del', { t: 'det', def: 1, prep: 1, g: 'm', pl: 0 });
      add('de', { t: 'de' }); add('a', { t: 'prep' }); add('al', { t: 'prep' });
      add('uno', { t: 'num', n: 1, g: 'm', alone: 1 }); add('un', { t: 'num', n: 1, g: 'm' }); add('una', { t: 'num', n: 1, g: 'f' });
      tri(add, [['cuánto', 'm', 0], ['cuánta', 'f', 0], ['cuántos', 'm', 1], ['cuántas', 'f', 1]], { t: 'q', k: 'howmuch' });
      add('precio', { t: 'q', k: 'price' }); add('qué', { t: 'q', k: 'what' }); add('cuál', { t: 'q', k: 'which' });
      [['cuesta', 'cuestan'], ['vale', 'valen'], ['es', 'son'], ['está', 'están'], ['sale', 'salen']].forEach(([s, p]) => { add(s, { t: 'cop', pl: 0, pair: p }); add(p, { t: 'cop', pl: 1, pair: s }); });
      add('yo', { t: 'pron', p: 'yo' }); add('me', { t: 'pron', p: 'me' }); add('nos', { t: 'pron', p: 'nos' }); add('te', { t: 'pron', p: 'te' });
      add('usted', { t: 'pron', p: 'usted', formal: 1 }); add('tú', { t: 'pron', p: 'tu' }); add('vos', { t: 'pron', p: 'vos' });
      add('gracias', { t: 'thanks' }); add('hola', { t: 'greet', k: 'hola' }); add('buenas', { t: 'greet', k: 'buenas' });
      each('porfa porfis', { t: 'please' }); add('porfavor', { t: 'please', space: 'por favor' });
      each('disculpe disculpa perdón perdone', { t: 'sorry' }); each('señor señora señorita don doña', { t: 'address' });
      each('adiós chao chau bye', { t: 'bye' }); each('y e', { t: 'conj' }); add('sí', { t: 'yes' }); add('no', { t: 'no' });
      each('bueno pues entonces ahora hoy ok okay okey mira oye oiga eh mmm ah ay ya más nada solo sólo también todo aquí muy mucho para por favor', { t: 'filler' });
      each('eso esto', { t: 'filler', point: 1 }); add('vale', { t: 'filler' }); add('ayuda', { t: 'help' });
      phrase('por favor', { t: 'please' }); phrase('por fa', { t: 'please' }); phrase('muchas gracias', { t: 'thanks' });
      phrase('buenos días', { t: 'greet', k: 'dias' }); phrase('buen día', { t: 'greet', k: 'buendia' }); phrase('buenas tardes', { t: 'greet', k: 'tardes' }); phrase('buenas noches', { t: 'greet', k: 'noches' });
      phrase('hasta luego', { t: 'bye' }); phrase('hasta pronto', { t: 'bye' }); phrase('nos vemos', { t: 'bye' }); phrase('con permiso', { t: 'sorry' });
      phrase('qué precio', { t: 'q', k: 'price' }); phrase('un poco de', { t: 'det', bit: 1 }); phrase('un poquito de', { t: 'det', bit: 1 });
    },
    pt(add, each, phrase) {
      tri(add, [['o', 'm', 0], ['a', 'f', 0], ['os', 'm', 1], ['as', 'f', 1]], { t: 'det', def: 1 });
      tri(add, [['uns', 'm', 1], ['umas', 'f', 1]], { t: 'det', some: 1 });
      tri(add, [['outro', 'm', 0], ['outra', 'f', 0], ['outros', 'm', 1], ['outras', 'f', 1]], { t: 'det', other: 1 });
      tri(add, [['este', 'm', 0], ['esta', 'f', 0], ['estes', 'm', 1], ['estas', 'f', 1]], { t: 'det', dem: 'este' });
      tri(add, [['esse', 'm', 0], ['essa', 'f', 0], ['esses', 'm', 1], ['essas', 'f', 1]], { t: 'det', dem: 'esse' });
      tri(add, [['do', 'm', 0], ['da', 'f', 0], ['dos', 'm', 1], ['das', 'f', 1]], { t: 'det', def: 1, prep: 1 });
      add('de', { t: 'de' }); add('a', { t: 'prep' });
      add('um', { t: 'num', n: 1, g: 'm' }); add('uma', { t: 'num', n: 1, g: 'f' }); add('dois', { t: 'num', n: 2, g: 'm' }); add('duas', { t: 'num', n: 2, g: 'f' });
      tri(add, [['quanto', 'm', 0], ['quanta', 'f', 0], ['quantos', 'm', 1], ['quantas', 'f', 1]], { t: 'q', k: 'howmuch' });
      add('preço', { t: 'q', k: 'price' }); add('qual', { t: 'q', k: 'which' });
      [['custa', 'custam'], ['é', 'são'], ['está', 'estão'], ['tá', 'tão'], ['fica', 'ficam'], ['sai', 'saem']].forEach(([s, p]) => { add(s, { t: 'cop', pl: 0, pair: p }); add(p, { t: 'cop', pl: 1, pair: s }); });
      add('eu', { t: 'pron', p: 'eu' }); add('me', { t: 'pron', p: 'me' }); add('você', { t: 'pron', p: 'voce' }); add('tu', { t: 'pron', p: 'tu' });
      each('obrigado obrigada valeu', { t: 'thanks' }); add('oi', { t: 'greet', k: 'oi' }); add('olá', { t: 'greet', k: 'ola' });
      each('tchau xau adeus', { t: 'bye' }); each('desculpa desculpe', { t: 'sorry' }); each('senhor senhora moço moça', { t: 'address' });
      add('e', { t: 'conj' }); add('sim', { t: 'yes' }); add('não', { t: 'no' });
      each('então bom olha ei hoje agora ok beleza aí mais só que né hein muito para pra também aqui por', { t: 'filler' });
      each('isso isto', { t: 'filler', point: 1 }); add('tá', { t: 'filler' }); add('ajuda', { t: 'help' });
      phrase('por favor', { t: 'please' }); phrase('por gentileza', { t: 'please' }); phrase('muito obrigado', { t: 'thanks' }); phrase('muito obrigada', { t: 'thanks' });
      phrase('bom dia', { t: 'greet', k: 'dia' }); phrase('boa tarde', { t: 'greet', k: 'tarde' }); phrase('boa noite', { t: 'greet', k: 'noite' });
      phrase('até logo', { t: 'bye' }); phrase('até mais', { t: 'bye' }); phrase('até amanhã', { t: 'bye' }); phrase('com licença', { t: 'sorry' });
      phrase('o senhor', { t: 'pron', p: 'senhor', formal: 1 }); phrase('a senhora', { t: 'pron', p: 'senhor', formal: 1 });
      phrase('um pouco de', { t: 'det', bit: 1 }); phrase('um pouquinho de', { t: 'det', bit: 1 });
      phrase('qual é o preço', { t: 'q', k: 'price' }); phrase('qual o preço', { t: 'q', k: 'price' });
    },
    de(add, each, phrase) {
      each('der die das den dem des', { t: 'det', def: 1 });
      each('dieser diese dieses diesen diesem', { t: 'det', dem: 1 });
      add('eins', { t: 'num', n: 1, alone: 1 }); each('ein eine einen einem einer eines', { t: 'num', n: 1 });
      for (let n = 1; n <= 20; n++) add((n === 1 ? 'ein' : NUM.de[n]) + 'mal', { t: 'num', n, mal: 1 });   // «zweimal Kuchen»
      add('was', { t: 'q', k: 'what' }); add('wie', { t: 'q', k: 'how' }); add('wieviel', { t: 'q', k: 'howmuch' });
      [['kostet', 'kosten'], ['ist', 'sind'], ['macht', 'machen']].forEach(([s, p]) => { add(s, { t: 'cop', pl: 0, pair: p }); add(p, { t: 'cop', pl: 1, pair: s }); });
      each('ich wir du ihr', { t: 'pron' }); add('sie', { t: 'pron', formal: 1 }); each('mir uns es', { t: 'pron', obj: 1 });
      each('gern gerne', { t: 'gern' });
      add('bitte', { t: 'please' }); add('danke', { t: 'thanks' }); add('entschuldigung', { t: 'sorry' });
      add('hallo', { t: 'greet', k: 'hallo' }); add('moin', { t: 'greet', k: 'moin' }); add('servus', { t: 'greet', k: 'servus' }); add('tag', { t: 'greet', k: 'tag' }); add('grüezi', { t: 'greet', k: 'gruezi' });
      each('tschüss tschüs ciao tschau', { t: 'bye' }); add('und', { t: 'conj' }); add('ja', { t: 'yes' }); add('nein', { t: 'no' });
      each('noch mal auch dann also so heute jetzt ok okay äh ähm hm oh ach sehr denn nur bloß für hier schön gut viel viele teuer', { t: 'filler' });
      add('etwas', { t: 'det', bit: 1 }); add('hilfe', { t: 'help' });
      phrase('guten tag', { t: 'greet', k: 'tag' }); phrase('guten morgen', { t: 'greet', k: 'morgen' }); phrase('guten abend', { t: 'greet', k: 'abend' }); phrase('grüß gott', { t: 'greet', k: 'gruss' });
      phrase('danke schön', { t: 'thanks' }); phrase('danke sehr', { t: 'thanks' }); phrase('vielen dank', { t: 'thanks', say: 'vielen Dank' }); phrase('bitte schön', { t: 'please' }); phrase('bitte sehr', { t: 'please' });
      phrase('auf wiedersehen', { t: 'bye' }); phrase('bis bald', { t: 'bye' }); phrase('bis dann', { t: 'bye' }); phrase('bis später', { t: 'bye' }); phrase('schönen tag', { t: 'bye' });
      phrase('entschuldigen sie', { t: 'sorry', say: 'Entschuldigen Sie' });
      phrase('wie viel', { t: 'q', k: 'howmuch' }); phrase('wie viele', { t: 'q', k: 'howmuch' }); phrase('wie teuer', { t: 'q', k: 'howmuch' });
      phrase('gibt es', { t: 'verb', v: 'have', lemma: 'geben', p: 'es', gibt: 1 });
      phrase('ein paar', { t: 'det', some: 1 }); phrase('ein bisschen', { t: 'det', bit: 1 }); phrase('ein wenig', { t: 'det', bit: 1 });
    },
  };
  // English words, to notice when someone answers in English
  const EN = new Set(('i want would like please two three one four five six how much is are the an give have you do does hello hi thanks thank bye apple apples bread cheese ' +
    'honey cake cakes cookie cookies hat hats pear pears orange oranges coin coins some can get cost costs what yes buy need take and of for it that this sorry good morning sell many').split(' '));
  const HELP_WORDS = new Set(['idk', 'i dont know', 'i don t know', 'dont know', 'dunno', 'help', 'help me', 'ayuda', 'ajuda', 'hilfe', 'no se', 'no lo se', 'nao sei', 'weiss nicht', 'weiß nicht', 'ich weiss nicht', 'ich weiß nicht', 'keine ahnung', 'socorro']);
  const saysHelp = s => /^\s*\?+\s*$/.test(s) || HELP_WORDS.has(norm(s));

  // ================================================================ numbers in words (for prices beyond 20 too)
  const ES_U = NUM.es.concat(['veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve']);
  const ES_T = { 3: 'treinta', 4: 'cuarenta', 5: 'cincuenta', 6: 'sesenta', 7: 'setenta', 8: 'ochenta', 9: 'noventa' };
  const ES_H = { 1: 'ciento', 2: 'doscientos', 3: 'trescientos', 4: 'cuatrocientos', 5: 'quinientos', 6: 'seiscientos', 7: 'setecientos', 8: 'ochocientos', 9: 'novecientos' };
  const PT_T = { 2: 'vinte', 3: 'trinta', 4: 'quarenta', 5: 'cinquenta', 6: 'sessenta', 7: 'setenta', 8: 'oitenta', 9: 'noventa' };
  const PT_H = { 1: 'cento', 2: 'duzentos', 3: 'trezentos', 4: 'quatrocentos', 5: 'quinhentos', 6: 'seiscentos', 7: 'setecentos', 8: 'oitocentos', 9: 'novecentos' };
  const DE_T = { 2: 'zwanzig', 3: 'dreißig', 4: 'vierzig', 5: 'fünfzig', 6: 'sechzig', 7: 'siebzig', 8: 'achtzig', 9: 'neunzig' };
  // g: the gender of what's counted (null: the number on its own); cas: German case, for «ein / einen»
  function numWord(n, lang, g = null, cas = 'nom') {
    n = Math.max(0, Math.floor(n));
    if (cjOn(lang)) return CJK.plain(lang === 'zh' ? zhNumSrc(n, !!g) : `[${jaNumKanji(n)}|${jaNumKana(n)}]`, { lang, cap: false });
    if (lang === 'es') {
      if (n === 100) return 'cien';
      const h = Math.floor(n / 100) % 10, r = n % 100, out = [];
      if (h) out.push(g === 'f' && h > 1 ? ES_H[h].replace(/os$/, 'as') : ES_H[h]);
      if (r) {
        let w = r < 30 ? ES_U[r] : ES_T[Math.floor(r / 10)] + (r % 10 ? ' y ' + ES_U[r % 10] : '');
        if (r % 10 === 1 && r !== 11) { if (g === 'f') w = w.replace(/uno$/, 'una'); else if (g) w = w.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un'); }
        out.push(w);
      }
      return out.length ? out.join(' ') : 'cero';
    }
    if (lang === 'pt') {
      if (n === 100) return 'cem';
      const h = Math.floor(n / 100) % 10, r = n % 100, out = [];
      const unit = u => (g === 'f' && u === 1 ? 'uma' : g === 'f' && u === 2 ? 'duas' : NUM.pt[u]);
      if (h) out.push(g === 'f' && h > 1 ? PT_H[h].replace(/os$/, 'as') : PT_H[h]);
      if (r) out.push(r < 20 ? unit(r) : PT_T[Math.floor(r / 10)] + (r % 10 ? ' e ' + unit(r % 10) : ''));
      return out.length ? out.join(' e ') : 'zero';
    }
    if (lang === 'de') {
      if (n === 1 && g) return g === 'f' ? 'eine' : g === 'n' || cas !== 'acc' ? 'ein' : 'einen';
      const h = Math.floor(n / 100) % 10, r = n % 100;
      let s = h ? (h === 1 ? 'hundert' : NUM.de[h] + 'hundert') : '';
      if (r === 1 && h && g) s += g === 'f' ? 'eine' : 'ein';                // «hunderteine Münzen»
      else if (r) s += r < 20 ? NUM.de[r] : (r % 10 ? (r % 10 === 1 ? 'ein' : NUM.de[r % 10]) + 'und' : '') + DE_T[Math.floor(r / 10)];
      return s || 'null';
    }
    return String(n);
  }
  const enNum = n => (n <= 20 ? NUM.en[n] : String(n));
  const EN_NOUN = { 'w.apple': ['apple', 'apples'], 'w.pear': ['pear', 'pears'], 'w.orange': ['orange', 'oranges'], 'w.bread': ['bread', 'loaves'], 'w.cake': ['cake', 'cakes'],
    'w.cheese': ['cheese', 'cheeses'], 'w.honey': ['honey', 'honey'], 'w.cookie': ['cookie', 'cookies'], 'w.hat': ['hat', 'hats'], 'w.coin': ['coin', 'coins'] };
  const enNoun = (id, pl) => (EN_NOUN[id] || [id, id])[pl ? 1 : 0];
  function nounWord(id, pl, lang) {
    if (id === 'w.coin') { const c = LEX.item('w.coin'); return pl ? c.pl[lang] : c[lang]; }
    const L = mainLemma(id, lang);
    return pl ? L.pl : L.sg;
  }

  // articles
  const ART = {
    es: { def: ['el', 'la', 'los', 'las'], prep: ['del', 'de la', 'de los', 'de las'], some: ['unos', 'unas', 'unos', 'unas'], other: ['otro', 'otra', 'otros', 'otras'], este: ['este', 'esta', 'estos', 'estas'], ese: ['ese', 'esa', 'esos', 'esas'] },
    pt: { def: ['o', 'a', 'os', 'as'], prep: ['do', 'da', 'dos', 'das'], some: ['uns', 'umas', 'uns', 'umas'], other: ['outro', 'outra', 'outros', 'outras'], este: ['este', 'esta', 'estes', 'estas'], esse: ['esse', 'essa', 'esses', 'essas'] },
  };
  const romArt = (lang, det, g, pl) => ART[lang][det.prep ? 'prep' : det.some ? 'some' : det.other ? 'other' : det.dem || 'def'][(g === 'f' ? 1 : 0) + (pl ? 2 : 0)];
  const deIndef = (g, cas) => (g === 'f' ? 'eine' : g === 'n' || cas !== 'acc' ? 'ein' : 'einen');
  function deDef(fam, g, pl, cas) {
    if (fam === 'dies') return pl ? 'diese' : { m: cas === 'acc' ? 'diesen' : 'dieser', f: 'diese', n: 'dieses' }[g];
    return pl ? 'die' : { m: cas === 'acc' ? 'den' : 'der', f: 'die', n: 'das' }[g];
  }
  const defArt = (lang, g, pl, cas = 'nom') => (lang === 'de' ? deDef('d', g, pl, cas) : ART[lang].def[(g === 'f' ? 1 : 0) + (pl ? 2 : 0)]);

  // ================================================================ the dictionary, built once per language
  const bareOf = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const umlauted = s => s.replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü');
  const firstCap = s => s.replace(/\p{L}/u, ch => ch.toUpperCase());
  // optimal string alignment distance: a swapped pair of letters counts once
  function osa(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    const d = [];
    for (let i = 0; i <= a.length; i++) d.push([i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      let low = 1e9;
      for (let j = 1; j <= b.length; j++) {
        let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2][j - 2] + 1);
        d[i][j] = v; if (v < low) low = v;
      }
      if (low > max) return max + 1;
    }
    return d[a.length][b.length];
  }
  const LX = {};
  function lexicon(lang) {
    if (LX[lang]) return LX[lang];
    const exact = new Map(), bare = new Map(), phrases = [];
    const put = (m, k, e) => { const a = m.get(k); if (a) a.push(e); else m.set(k, [e]); };
    const add = (form, e) => { const x = Object.assign({ form }, e), low = form.toLowerCase(); put(exact, low, x); put(bare, bareOf(low), x); return x; };
    const each = (list, e) => list.split(' ').forEach(w => add(w, e));
    const phrase = (text, e) => phrases.push({ words: text.toLowerCase().split(' ').map(bareOf), e: Object.assign({ form: text }, e) });
    for (const [id, lemmas] of Object.entries(GOODS[lang])) lemmas.forEach(([sg, pls, g], k) => {
      const all = [].concat(pls), lemma = { id, sg, pl: all[0], g, alt: k > 0 };
      add(sg, { t: 'noun', id, g, pl: all.includes(sg) ? 2 : 0, lemma });
      all.forEach(p => { if (p !== sg) add(p, { t: 'noun', id, g, pl: 1, lemma }); });
    });
    UNITS[lang].forEach(([sg, pl, g, kind, measure]) => {
      const lemma = { sg, pl, g, kind, measure: !!measure };
      add(sg, { t: 'unit', g, pl: measure ? 2 : 0, kind, measure: !!measure, lemma });
      add(pl, { t: 'unit', g, pl: 1, kind, measure: !!measure, lemma });
    });
    NUM[lang].forEach((w, n) => { if (n > (lang === 'pt' ? 2 : 1)) add(w, { t: 'num', n }); });
    Object.entries(NUM_ALT[lang] || {}).forEach(([n, ws]) => ws.forEach(w => add(w, { t: 'num', n: +n, alt: 1 })));
    Object.entries(VERBS[lang]).forEach(([w, v]) => add(w, Object.assign({ t: 'verb' }, v)));
    LANG_WORDS[lang](add, each, phrase);
    // a phrase's words are known on their own too (so a typo inside «por favor» is still understood)
    phrases.forEach(p => p.e.form.split(' ').forEach(w => { if (!exact.has(w.toLowerCase())) add(w, { t: 'part' }); }));
    phrases.sort((a, b) => b.words.length - a.words.length);
    return (LX[lang] = { exact, bare, phrases });
  }

  // ================================================================ reading a sentence
  function tokenize(text) {
    const out = [], re = /(\d+)|([A-Za-zÀ-ÖØ-öø-ÿĀ-ſßẞ]+)|([¿?¡!.,;:…])/g;
    let m;
    while ((m = re.exec(text))) {
      if (m[1]) out.push({ k: 'digit', raw: m[1], low: m[1], n: parseInt(m[1], 10) });
      else if (m[2]) { const low = m[2].toLowerCase(); out.push({ k: 'word', raw: m[2], low, bare: bareOf(low) }); }
      else out.push({ k: 'punct', raw: m[3] });
    }
    return out;
  }
  const RANK = { noun: 0, num: 1, verb: 2, cop: 3, q: 4, unit: 5, det: 6 };
  const rankOf = list => Math.min(...list.map(e => (RANK[e.t] === undefined ? 9 : RANK[e.t])));
  // A word: exactly right, right but for an accent («cuanto»), or a typo one letter off (two on long
  // words) from a word the keeper knows. German «ae / oe / ue» for «ä / ö / ü» is fine.
  function lookup(lang, tok, ctx) {
    const X = lexicon(lang);
    if (ctx.names && ctx.names.includes(tok.low)) return { cands: [{ t: 'filler', form: tok.raw, name: 1 }], how: 'exact' };
    let c = X.exact.get(tok.low);
    if (c) return { cands: c, alts: X.bare.get(tok.bare) || c, how: 'exact' };
    if (lang === 'de' && /ae|oe|ue/.test(tok.low)) { c = X.exact.get(umlauted(tok.low)); if (c) return { cands: c, alts: c, how: 'exact' }; }
    c = X.bare.get(tok.bare);
    if (c) return { cands: c, alts: c, how: 'accent' };
    const len = tok.bare.length, max = len >= 8 ? 2 : len >= 4 ? 1 : 0;
    if (!max) return null;
    // every word at the nearest distance stays a candidate («quero»: «quiero» or «queso»?); the
    // sentence around it decides (resolve)
    let best = [], bd = max + 1;
    for (const [k, list] of X.bare) {
      if (k.length < 3 || Math.abs(k.length - len) > max) continue;
      const d = osa(tok.bare, k, max);
      if (d < bd) { bd = d; best = list.slice(); } else if (d === bd) best = best.concat(list);
    }
    if (!best.length || bd > max) return null;
    best.sort((a, b) => rankOf([a]) - rankOf([b]));
    return { cands: best, alts: best, how: 'fuzzy' };
  }
  // «por favor», «buenos días», «wie viel»: phrases become one token
  function joinPhrases(toks, lang) {
    const X = lexicon(lang), out = [];
    const key = u => (u.how === 'fuzzy' ? bareOf(u.cands[0].form.toLowerCase()) : u.bare);
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.k === 'word' && t.cands) {
        const p = X.phrases.find(ph => ph.words.every((w, j) => { const u = toks[i + j]; return u && u.k === 'word' && u.cands && key(u) === w; }));
        if (p) {
          const parts = toks.slice(i, i + p.words.length);
          out.push({ k: 'word', raw: parts.map(u => u.raw).join(' '), low: parts.map(u => u.low).join(' '), bare: parts.map(u => u.bare).join(' '), cands: [p.e], alts: [p.e], how: 'exact', parts, phrase: 1 });
          i += p.words.length - 1; continue;
        }
      }
      out.push(t);
    }
    return out;
  }
  // which meaning a word has here («vale» the verb or «vale» = OK, pt «a» the article or «a» = to…)
  function resolve(W, lang) {
    const hasQ = W.some(w => w.cands && w.cands.some(e => e.t === 'q' && (e.k === 'howmuch' || e.k === 'price' || lang === 'de')));
    W.forEach((w, i) => {
      if (w.k === 'digit') { w.e = { t: 'num', n: w.n, digits: 1, form: w.raw }; return; }
      if (!w.cands) { w.e = null; return; }
      const prev = W[i - 1], next = W[i + 1];
      const has = t => w.cands.find(e => e.t === t), alt = t => (w.alts || []).find(e => e.t === t);
      let e = w.cands[0];
      const kinds = new Set(w.cands.map(x => x.t)), nextKinds = next ? (next.k === 'digit' ? ['num'] : (next.cands || []).map(x => x.t)) : [];
      if (w.how === 'fuzzy' && kinds.size > 1) {             // a typo near two words: a thing after a number, a verb before one
        const thing = has('noun') || has('unit'), verb = has('verb');
        if (thing && prev && prev.e && (prev.e.t === 'num' || prev.e.t === 'det')) e = thing;
        else if (verb && nextKinds.some(t => ['num', 'det', 'noun', 'unit'].includes(t))) e = verb;
      } else if (has('cop') && has('filler')) e = hasQ ? has('cop') : has('filler');
      else if (has('det') && has('prep')) e = next && next.cands && next.cands.some(x => ['noun', 'unit', 'num'].includes(x.t)) ? has('det') : has('prep');
      else if (prev && prev.low === 'me' && !has('verb') && alt('verb')) { e = alt('verb'); w.how = 'accent'; }                        // «me da» → «me dá»
      else if (lang === 'pt' && w.low === 'e' && prev && prev.e && prev.e.t === 'q' && alt('cop')) { e = alt('cop'); w.how = 'accent'; }   // «quanto e» → «quanto é»
      w.e = e;
    });
  }
  // the things asked for: [number or article] [jar / piece (+ de)] thing
  function nounPhrases(W) {
    const nps = [], loose = [];
    let det = null, num = null, unit = null, de = false, first = -1, point = false;
    const reset = () => { det = num = unit = null; de = false; first = -1; };
    for (let i = 0; i < W.length; i++) {
      const w = W[i], e = w.e;
      if (!e) continue;
      const nx = W[i + 1] && W[i + 1].e;
      switch (e.t) {
        case 'num': {
          // a number right after a thing, with no thing of its own after it: «manzanas dos» (word order)
          const last = nps[nps.length - 1];
          if (!num && !det && !unit && last && last.end === i - 1 && !last.num && !last.det && !last.unit && !(nx && ['noun', 'unit', 'det', 'de'].includes(nx.t))) { last.num = w; last.order = true; break; }
          if (num) loose.push(num);
          num = w; if (first < 0) first = i; break;
        }
        case 'det': if (num) { loose.push(num); num = null; } if (det && !det.e.bit) point = true; det = w; if (first < 0) first = i; break;
        case 'unit': unit = w; if (first < 0) first = i; break;
        case 'de': if (unit) de = true; break;
        case 'noun': nps.push({ noun: w, det, num, unit, de, start: first < 0 ? i : first, end: i }); reset(); break;
        case 'filler': if (e.point) point = true; break;
        case 'part': break;
        default: if (num) loose.push(num); if (det && !det.e.bit) point = true; reset();
      }
    }
    if (num) loose.push(num);
    if (det && !det.e.bit) point = true;
    return { nps, loose, point };
  }

  function addErr(r, kind, tok, fix, x) {
    const e = Object.assign({ kind, typed: tok ? tok.raw : '', fix: fix || '', tok }, x || {});
    r.errors.push(e);
    return e;
  }
  // Spanish and Portuguese: the number and article agree with the thing in gender and number
  function romanceNP(np, lang, role, r) {
    const N = np.noun.e, U = np.unit && np.unit.e, H = U || N, g = H.g, HL = H.lemma, head = np.unit || np.noun;
    let num = np.num && np.num.e, det = np.det && np.det.e;
    // (a noun the same in both, like grandma.js's «jiaozi» / «baozi»: the article or the number says which it is)
    const isPl = H.pl === 1 || (H.pl === 2 && !!((det && det.pl) || (num && num.n > 1)));
    const it = { id: N.id, n: null, lemma: N.lemma, unit: U ? U.lemma : null, det, num, plural: isPl, bare: !num && !det && !U, np, errs: [] };
    const E = (kind, tok, fix, x) => it.errs.push(addErr(r, kind, tok, fix, Object.assign({ noun: HL.sg, g }, x)));
    // pt «dos pães» is the Spanish two: «dois pães»
    if (lang === 'pt' && det && det.prep && np.det.low === 'dos' && role === 'obj' && !num && isPl) {
      const fix = g === 'f' ? 'duas' : 'dois';
      E('spelling', np.det, fix);
      num = it.num = { t: 'num', n: 2, form: fix, typo: 1 }; det = it.det = null;
    }
    // how many: the number says so; with only an article, the noun does («las manzanas»: how many?)
    it.n = num ? num.n : det ? (det.bit ? 1 : det.some || isPl ? null : 1) : isPl ? null : 1;
    if (num && !num.digits && !num.typo) {
      if (num.n === 1) {
        const want = { es: { m: 'un', f: 'una' }, pt: { m: 'um', f: 'uma' } }[lang][g];
        if (num.form !== want) E(lang === 'es' && num.form === 'uno' && g === 'm' ? 'form' : 'gender', np.num, want);
      } else if (num.n === 2 && lang === 'pt') { const want = g === 'f' ? 'duas' : 'dois'; if (num.form !== want) E('gender', np.num, want); }
    }
    if (num && head.how !== 'fuzzy') {
      if (it.n === 1 && isPl) E('number', head, HL.sg, { one: 1 });
      else if (it.n > 1 && !isPl) E('number', head, HL.pl, { n: it.n });
    }
    if (det && !det.bit) {
      const want = romArt(lang, det, g, isPl);
      if (det.g !== g) E('gender', np.det, want);
      else if (!!det.pl !== isPl) E('number', np.det, want, { art: 1 });
    }
    if (U && !np.de) E('prep', np.unit, null, { unit: 1 });
    if (!num && !det && !U && (role === 'subj' || (!isPl && !MASS.has(N.id)))) E('article', np.noun, null);
    if (np.order) E('order', np.num, null);
    return it;
  }
  // German: «einen Apfel», «eine Birne», «ein Brot» (what you ask for is in the accusative), «der
  // Käse» (what costs is the subject), plural nouns after numbers («zwei Äpfel»)
  function germanNP(np, role, r) {
    const N = np.noun.e, U = np.unit && np.unit.e, H = U || N, g = H.g, HL = H.lemma, cas = role === 'subj' ? 'nom' : 'acc';
    const num = np.num && np.num.e, det = np.det && np.det.e, head = np.unit || np.noun;
    let pl = H.pl === 1 ? true : H.pl === 0 ? false : null;            // Käse, Kuchen, Stück are the same in both
    if (pl === null) pl = num ? num.n !== 1 && !num.mal : det ? (det.some || ((det.form === 'die' || det.form === 'diese') && g !== 'f')) : !MASS.has(N.id) && !U;
    const it = { id: N.id, n: null, lemma: N.lemma, unit: U ? U.lemma : null, unitPl: !!(U && U.pl === 1), det, num, plural: pl, bare: !num && !det && !U, np, errs: [] };
    it.n = num ? num.n : det ? (det.bit ? 1 : det.some || pl ? null : 1) : pl ? null : 1;
    const E = (kind, tok, fix, x) => it.errs.push(addErr(r, kind, tok, fix, Object.assign({ noun: HL.sg, g }, x)));
    if (num && !num.digits && !num.mal && num.n === 1) {
      const want = deIndef(g, cas), typed = num.form.toLowerCase();
      if (typed !== want) {
        if (typed === 'eins') E('form', np.num, want);
        else if ((g === 'm' && ['ein', 'einen', 'einem', 'eines'].includes(typed)) || (g === 'n' && ['einem', 'eines'].includes(typed))) E('case', np.num, want, { cas });
        else E('gender', np.num, want);
      }
    }
    if (num && head.how !== 'fuzzy' && !(U && U.measure) && !num.mal) {
      if (it.n === 1 && H.pl === 1) E('number', head, HL.sg, { one: 1 });
      else if (it.n > 1 && H.pl === 0) E('number', head, HL.pl, { n: it.n });
    }
    if (det && (det.def || det.dem)) {
      const fam = det.dem ? 'dies' : 'd', want = deDef(fam, g, pl, cas), typed = det.form.toLowerCase();
      if (typed !== want) {
        const caseForms = fam === 'd' ? ['der', 'den', 'dem', 'des'] : ['dieser', 'diesen', 'diesem', 'dieses'];
        if (pl) E('number', np.det, want, { art: 1 });
        else if ((g === 'm' && caseForms.includes(typed)) || (g === 'n' && [caseForms[2], fam === 'd' ? 'des' : ''].includes(typed))) E('case', np.det, want, { cas });
        else E('gender', np.det, want);
      }
    }
    if (!num && !det && !U && !pl && !MASS.has(N.id)) E('article', np.noun, null);
    if (np.order) E('order', np.num, null);
    return it;
  }
  // a number on its own, answering «¿Cuántas quieres?»: «Tres», «Una», «Einen»
  function answerNum(w, id, lang, r) {
    const e = w.e, n = e.n, L = mainLemma(id, lang);
    const it = { id, n, answer: 1, num: e, lemma: L, unit: id === 'w.honey' ? JAR[lang] : null, errs: [] };
    if (e.digits || e.mal || n > 2) return it;
    const g = id === 'w.honey' ? JAR[lang].g : L.g, typed = e.form.toLowerCase();
    let ok = [], fix = null;
    if (lang === 'es' && n === 1) ok = [fix = g === 'f' ? 'una' : 'uno'];
    if (lang === 'pt') ok = [fix = n === 1 ? (g === 'f' ? 'uma' : 'um') : (g === 'f' ? 'duas' : 'dois')];
    if (lang === 'de' && n === 1) { fix = deIndef(g, 'acc'); ok = ['eins', fix]; }
    if (ok.length && !ok.includes(typed)) {
      const noun = id === 'w.honey' ? JAR[lang].sg : L.sg;
      if (lang === 'es' && typed === 'un' && g === 'm') it.errs.push(addErr(r, 'form', w, 'uno', { alone: 1, noun, g }));
      else if (lang === 'de' && g === 'm' && typed === 'ein') it.errs.push(addErr(r, 'case', w, 'einen', { cas: 'acc', noun, g }));
      else it.errs.push(addErr(r, 'gender', w, fix, { noun, g }));
    }
    return it;
  }
  function romanceVerbs(W, verbs, nps, r) {
    const at = w => W.indexOf(w);
    for (const v of verbs) {
      const e = v.e;
      if (e.err) addErr(r, 'verb', v, e.fix, { means: e.means });
      else if (e.inf && !verbs.some(u => u !== v && !u.e.inf && !u.e.err && ['want', 'can', 'aux', 'need'].includes(u.e.v) && at(u) < at(v))) addErr(r, 'verb', v, e.fix, { means: e.means, inf: 1 });
      if (e.needDe) {
        const vi = at(v), np = nps.find(p => p.start > vi);
        if (np && !W.slice(vi + 1, np.start + 1).some(u => u.e && (u.e.t === 'de' || (u.e.t === 'det' && u.e.prep)))) addErr(r, 'prep', v, e.form + ' de', { verb: e.form });
      }
    }
  }
  // German verbs: the ending follows the subject («ich möchte», «wir möchten»), «ich» can't be left out,
  // «hätte» needs «gern», the verb comes second, and a second verb goes to the end
  const SKIP = new Set(['please', 'thanks', 'greet', 'bye', 'sorry', 'filler', 'part', 'yes', 'no', 'address', 'conj', 'gern', 'help']);
  function germanVerbs(W, verbs, nps, r) {
    const at = w => W.indexOf(w);
    const subjTok = W.find(w => w.e && w.e.t === 'pron' && !w.e.obj);
    const subj = subjTok ? subjTok.e.form.toLowerCase() : null;
    const modal = verbs.find(v => !v.e.inf && ['can', 'aux', 'want'].includes(v.e.v));
    const infs = verbs.filter(v => v.e.inf && modal && at(v) > at(modal));
    const fins = verbs.filter(v => !infs.includes(v));
    const gern = W.some(w => w.e && w.e.t === 'gern');
    for (const v of fins) {
      const e = v.e;
      if (e.gibt) continue;
      if (e.p === 'imp') { if (subj === 'ich') addErr(r, 'verb', v, DE_CONJ[e.lemma].ich, { subj }); continue; }
      if (e.lemma === 'haben' && (e.p === 'ich' || subj === 'ich')) { addErr(r, 'verb', v, 'hätte gern', { gern: 1 }); continue; }
      if (e.lemma === 'geben' && subj !== 'sie' && subj !== 'wir') { addErr(r, 'verb', v, 'geben Sie mir', { sie: 1 }); continue; }
      if (subj) { const want = (DE_CONJ[e.lemma] || {})[subj]; if (want && want !== e.form.toLowerCase()) addErr(r, 'verb', v, want, { subj }); }
      else if (e.p === 'wir' && r.question) addErr(r, 'subject', v, e.form + ' Sie', { sie: 1 });        // «Haben Honig?» → «Haben Sie Honig?»
      else addErr(r, 'subject', v, 'ich ' + ((DE_CONJ[e.lemma] || {}).ich || e.form));
      if (e.gern && !gern) addErr(r, 'verb', v, e.form + ' gern', { gern: 1 });
    }
    if (subj === 'du') r.soft.push({ kind: 'style' });
    const fin = fins[0];
    if (fin && r.kind === 'buy' && !r.question && fin.e.p !== 'imp' && !fin.e.gibt) {
      let count = 0, seen = null;
      for (let i = 0; i < at(fin); i++) {
        const w = W[i];
        if (!w.e || SKIP.has(w.e.t)) continue;
        const np = nps.find(p => i >= p.start && i <= p.end);
        if (np) { if (np !== seen) { count++; seen = np; } continue; }
        count++;
      }
      if (count >= 2 || (count === 0 && subjTok && at(subjTok) > at(fin) && ['want', 'take', 'buy', 'need'].includes(fin.e.v))) addErr(r, 'order', fin, null, { v2: 1 });
    }
    for (const v of infs) if (nps.some(p => p.start > at(v))) addErr(r, 'order', v, null, { inf: v.e.form });
    return subj;
  }

  // Read a sentence typed at a stall: what kind it is, what's asked for, how many, the slips, the grade.
  // ctx: { pending: the item the keeper asked "how many?" about, focus: the item you're pointing at, names }
  function parse(text, lang, stallId, ctx = {}) {
    if (cjOn(lang)) return parseCJ(text, lang, stallId, ctx);         // zh / ja: their own grammar (below)
    lang = LANGS.includes(lang) ? lang : 'es';
    const r = { text: String(text == null ? '' : text), lang, stall: stallId || null, kind: 'unknown', items: [], errors: [], soft: [], notes: [],
      polite: false, bossy: false, question: false, greet: null, unknown: [], words: [], grade: null, reason: '', canon: '', why: '' };
    const raw = r.text.trim();
    if (!raw) { r.kind = 'empty'; return r; }
    if (saysHelp(raw)) { r.kind = 'help'; return r; }
    r.question = /[?¿]/.test(raw);
    const names = (ctx.names || ['mimo']).map(s => String(s).toLowerCase());
    let toks = tokenize(raw);
    toks.forEach(t => { if (t.k === 'word') Object.assign(t, lookup(lang, t, { names }) || {}); });
    toks = joinPhrases(toks, lang);
    const W = toks.filter(t => t.k !== 'punct');
    resolve(W, lang);
    const words = W.filter(w => w.k === 'word');
    const en = words.filter(w => !w.e && EN.has(w.low)).length;
    if (en && (en >= 2 ? en * 2 >= words.length : words.length === 1)) { r.kind = 'english'; return r; }
    const T = t => W.filter(w => w.e && w.e.t === t);
    const verbs = T('verb'), qs = T('q'), cops = T('cop'), greets = T('greet');
    r.greet = greets.length ? greets[0].e.k : null;
    Object.defineProperty(r, 'verbs', { value: verbs });           // for the better sentence (kept out of JSON)
    Object.defineProperty(r, 'prons', { value: T('pron') });
    // the polite words you used, kept in the better sentence
    const word = t => { const w = T(t)[0]; return w ? w.e.say || w.e.form : ''; };
    r.please = T('please').length > 0; r.thanksWord = word('thanks'); r.sorryWord = word('sorry');
    const q = qs.find(x => ['howmuch', 'price', 'what'].includes(x.e.k));
    r.qText = q ? q.e.form : '';
    r.aCuanto = lang === 'es' && !!q && W.some((w, i) => w.e && w.e.t === 'prep' && w.low === 'a' && W[i + 1] === q);
    const isPrice = qs.some(q => q.e.k === 'howmuch' || q.e.k === 'price') || (lang === 'de' && qs.some(q => q.e.k === 'what') && cops.length > 0);
    // «esta» for «está» in «¿A cuánto esta el pan?»
    if (isPrice && !cops.length) { const w = W.find(x => x.e && x.e.t === 'det' && x.alts && x.alts.some(e => e.t === 'cop')); if (w) { w.e = w.alts.find(e => e.t === 'cop'); w.how = 'accent'; } }
    const { nps, loose, point } = nounPhrases(W);
    if (isPrice) r.kind = 'price';
    else if (nps.length || verbs.length) r.kind = 'buy';
    else if (loose.length) r.kind = ctx.pending ? 'buy' : 'number';
    else if (T('bye').length) r.kind = 'bye';
    else if (greets.length) r.kind = 'greet';
    else if (T('thanks').length) r.kind = 'thanks';
    else if (T('yes').length) r.kind = 'yes';
    else if (T('no').length) r.kind = 'no';
    else if (T('please').length || T('sorry').length) r.kind = 'polite';
    else if (T('help').length) r.kind = 'help';
    if (r.kind === 'number') r.n = loose[0].e.n;
    if (r.kind !== 'buy' && r.kind !== 'price') return r;

    // spelling (each typo counts) and accents (an A)
    for (const w of W) {
      if (!w.e) { if (w.k === 'word') r.unknown.push(w.raw); continue; }
      const parts = w.phrase ? w.parts : [w];
      for (const u of parts) {
        const proper = (u === w ? w.e : u.cands[0]).form;
        if (u.how === 'fuzzy') addErr(r, 'spelling', u, proper);
        // (P6a, accents.js: an accent missing is a tip, never a grade. The one exception here: a German plural only its umlaut away
        // from the singular, «Apfel» for «Äpfel»: the shop counts one or two, so that one still costs the S)
        else if (u.how === 'accent') {
          const E0 = u === w ? w.e : u.cands[0], HL = E0 && E0.lemma, typed = String(u.raw || '').toLowerCase();
          const other = HL && typeof HL === 'object' && HL.sg && HL.pl && HL.sg !== HL.pl && [HL.sg, HL.pl].some(f => f !== proper && String(f).toLowerCase() === typed);
          r.soft.push({ kind: other ? 'accentWord' : 'accent', typed: u.raw, fix: proper });
        }
      }
      if (w.e.space) r.soft.push({ kind: 'space', fix: w.e.space });
    }
    const role = r.kind === 'price' ? 'subj' : 'obj';
    for (const np of nps) r.items.push(lang === 'de' ? germanNP(np, role, r) : romanceNP(np, lang, role, r));
    if (r.kind === 'buy' && !nps.length && loose.length && ctx.pending) r.items.push(answerNum(loose[0], ctx.pending, lang, r));
    else if (!nps.length && ctx.focus && (point || r.kind === 'price')) r.items.push({ id: ctx.focus, n: r.kind === 'buy' ? 1 : null, point: 1, lemma: mainLemma(ctx.focus, lang), errs: [] });
    // a misspelled thing is fixed to the form that fits («dos mansanas» → «manzanas»)
    for (const it of r.items) {
      const head = it.np && (it.np.unit || it.np.noun);
      if (head && head.how === 'fuzzy' && it.n !== null) { const se = r.errors.find(x => x.kind === 'spelling' && x.tok === head), HL = head.e.lemma; if (se && HL) se.fix = it.n === 1 ? HL.sg : HL.pl; }
    }
    const subj = lang === 'de' ? germanVerbs(W, verbs, nps, r) : (romanceVerbs(W, verbs, nps, r), null);
    if (r.kind === 'price') priceCheck(W, r, lang);
    // polite: «por favor», a greeting, «gracias», «disculpe», «señor», a softer verb, or a question
    // like «¿Me da…?» / «¿Tiene…?» / «Haben Sie…?»
    r.bossy = verbs.some(v => v.e.tone === -1);
    r.polite = ['please', 'greet', 'thanks', 'sorry', 'address'].some(t => T(t).length) || W.some(w => w.e && w.e.t === 'pron' && w.e.formal && lang !== 'de')
      || verbs.some(v => v.e.tone === 1 || (v.e.qp && r.question))
      || (lang === 'de' && subj === 'sie' && r.question && verbs.some(v => ['have', 'give'].includes(v.e.v)));
    if (W.some(w => w.e && w.e.t === 'num' && w.e.digits)) { const d = W.find(w => w.e && w.e.digits); r.soft.push({ kind: 'digits', word: numWord(Math.min(d.e.n, 999), lang) }); }
    if (r.unknown.length) r.soft.push({ kind: 'extra', words: r.unknown });
    if (!r.polite) r.soft.push({ kind: 'polite' });
    // the words you used, for LEX: the things and the number words (not digits)
    for (const it of r.items) {
      const np = it.np;
      if (np) r.words.push({ id: it.id, ok: np.noun.how !== 'fuzzy', len: np.noun.raw.length });
      const nt = np ? np.num : it.answer ? loose[0] : null;
      if (nt && nt.e && !nt.e.digits && nt.e.n >= 1 && nt.e.n <= 20) r.words.push({ id: 'n.' + nt.e.n, ok: nt.how !== 'fuzzy', len: nt.raw.length });
    }
    r.items.forEach(it => { it.phrase = npCanon(it, lang, role); it.errs.forEach(e => { e.phrase = it.phrase; }); });
    gradeOf(r, lang);
    r.canon = canonOf(r, lang, subj);
    return r;
  }
  function priceCheck(W, r, lang) {
    const cop = W.find(w => w.e && w.e.t === 'cop');
    const real = r.items.filter(it => !it.point);
    r.plural = real.length > 1 || real.some(it => (it.n && it.n > 1) || it.plural);
    r.copE = cop ? cop.e : null;
    if (cop && real.length && cop.how !== 'fuzzy' && !!cop.e.pl !== r.plural) addErr(r, 'number', cop, cop.e.pair, { cop: 1, pl: r.plural });
    // «¿Cuánto cuesta…?»: «cuánto» doesn't change here
    if (lang !== 'de') { const q = W.find(w => w.e && w.e.t === 'q' && w.e.k === 'howmuch'); if (q && (q.e.g === 'f' || q.e.pl)) addErr(r, 'form', q, lang === 'es' ? 'cuánto' : 'quanto', { q: 1 }); }
  }

  // ================================================================ grades (like attacks: battle/flow.js gradeOf)
  // Each kind of grammar slip counts once (a case slip twice), each misspelled word once.
  // 0 → S (polite, every accent, numbers as words) or A; 1 → B; 2 → C; 3+ → D. Bossy: B at best.
  const MAJOR = new Set(['case']);
  const GN = { m: 'masculine', f: 'feminine', n: 'neuter (das)' };
  const POLITE_WORD = { es: 'por favor', pt: 'por favor', de: 'bitte' };
  function noteOf(x, lang) {
    if (CJL.includes(lang)) return noteCJ(x, lang);
    const ph = x.phrase || x.fix;
    switch (x.kind) {
      case 'spelling': return `Spelling: «${x.typed}» → «${x.fix}»`;
      case 'gender': return `Gender: «${x.noun}» is ${GN[x.g] || x.g} → «${ph}»`;
      case 'number':
        if (x.cop) return x.pl ? `More than one → «${x.fix}»` : `Just one → «${x.fix}»`;
        if (x.art) return `The article and the noun must match: «${ph}»`;
        return x.one ? `Just one → singular: «${ph}»` : `Two or more → plural: «${ph}»`;
      case 'case': return x.cas === 'nom' ? `Case: the thing that costs is the subject → «${ph}»` : `Case: what you ask for takes the accusative → «${ph}»`;
      case 'verb':
        if (x.gern) return '«Ich hätte gern …» = I’d like';
        if (x.sie) return '«Geben Sie mir …» needs the «Sie»';
        if (x.subj) return `Verb ending: «${x.subj} ${x.fix}»`;
        return `Verb: «${x.fix}» (${FIX_MEANS[x.fix] || 'I …'}), not «${x.typed.toLowerCase()}» (${x.means || '…'})`;
      case 'subject': return x.sie ? `German needs the «Sie»: «${firstCap(x.fix)} …?»` : `German needs the «ich»: «${firstCap(x.fix)} …»`;
      case 'order': return x.v2 ? 'Word order: the verb comes second' : x.inf ? `Word order: «${x.inf}» goes at the very end` : `Word order: the number comes first → «${ph}»`;
      case 'article': return `Add an article: «${ph}»`;
      case 'form': return x.q ? `«${x.fix}» doesn’t change here` : lang === 'de' ? `«eins» is for counting. Before a noun: «${ph}»` : x.alone ? '«uno» on its own (just «un» before a noun)' : `Before a noun, «uno» → «un»: «${ph}»`;
      case 'prep': return x.unit ? `Add «de»: «${ph}»` : `«${x.verb}» takes «de»: «${x.fix} …»`;
      case 'accent': return lang === 'de' ? `Umlaut: «${x.fix}»` : `Accent: «${x.fix}»`;
      case 'accentWord': return `«${x.typed}» and «${x.fix}» are two different words: the umlaut makes «${x.fix}»`;
      case 'space': return `«${x.fix}» is two words`;
      case 'digits': return `Write the number as a word for an S: «${x.word}»`;
      case 'polite': return `Add «${POLITE_WORD[lang]}» for an S (and a discount!)`;
      case 'extra': return `Skipped: «${x.words.join(' ')}»`;
      case 'style': return 'To a shopkeeper, say «Sie»: «Haben Sie …?»';
    }
    return x.kind;
  }
  function bossyNote(r, lang) {
    if (CJL.includes(lang)) return bossyCJ(r, lang);
    const t = r.text.toLowerCase();
    if (lang === 'de') return /\bwill|\bwoll/.test(t) ? '«Ich will» sounds demanding. Try «Ich möchte …»' : '«Gib mir» is bossy with a shopkeeper. Try «Ich möchte …»';
    return /ponme/.test(t) ? '«Ponme» is bossy. Try «¿Me pone …?»' : '«Dame» is bossy with a shopkeeper. Try «¿Me da …?» or «Quisiera …»';
  }
  function gradeOf(r, lang) {
    const kinds = [];
    r.errors.forEach(e => { if (e.kind !== 'spelling' && !kinds.includes(e.kind)) kinds.push(e.kind); });
    let slips = kinds.reduce((a, k) => a + (MAJOR.has(k) ? 2 : 1), 0) + r.errors.filter(e => e.kind === 'spelling').length;
    // (an accent is a tip, never a grade: P6a, accents.js; it stays in the notes, and an S says it)
    const counted = r.soft.filter(s => !(typeof ACCENTS !== 'undefined' ? ACCENTS.free(s.kind) : false)), tips = r.soft.filter(s => !counted.includes(s));
    let g = slips === 0 ? (counted.length ? 'A' : 'S') : slips === 1 ? 'B' : slips === 2 ? 'C' : 'D';
    if (r.bossy && (g === 'S' || g === 'A')) g = 'B';
    r.slips = slips; r.grade = g;
    const errs = r.errors.slice().sort((a, b) => (MAJOR.has(b.kind) ? 1 : 0) - (MAJOR.has(a.kind) ? 1 : 0));
    const seen = new Set();
    r.notes = [...errs.map(e => noteOf(e, lang)), ...(r.bossy ? [bossyNote(r, lang)] : []), ...counted.map(s => noteOf(s, lang)), ...tips.map(s => noteOf(s, lang))].filter(n => !seen.has(n) && seen.add(n));
    r.tip = typeof ACCENTS !== 'undefined' ? [...new Set(tips.map(s => ACCENTS.tipLine(noteOf(s, lang))))].join(' · ') : '';
    r.reason = g === 'S' ? 'Perfect, and polite!' + (r.tip ? ' · ' + r.tip : '') : r.bossy && !slips ? bossyNote(r, lang) : r.notes[0] || '';
    const k0 = errs.length ? errs[0].kind : r.bossy ? 'bossy' : counted.length ? counted[0].kind : '', k = k0 === 'accentWord' ? 'accent' : k0;
    r.why = (WHY[lang] || {})[k] || '';
  }

  // ================================================================ the better sentence ("Better: «…»") and the help's models
  const AND = { es: ' y ', pt: ' e ', de: ' und ', en: ' and ' };
  const joinList = (list, lang) => (list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + AND[lang] + list[list.length - 1]);
  function npCanon(it, lang, role) {
    const L = it.lemma || mainLemma(it.id, lang), U = it.unit, g = (U || L).g, n = it.n, plural = it.plural;
    if (it.point) return '';
    if (lang === 'de') {
      const cas = role === 'subj' ? 'nom' : 'acc';
      if (U) return n ? `${numWord(n, 'de', U.g, cas)} ${n === 1 || (U.measure && !it.unitPl) ? U.sg : U.pl} ${L.sg}` : `${U.pl} ${L.sg}`;
      if (it.det && (it.det.def || it.det.dem) && !it.num) return `${deDef(it.det.dem ? 'dies' : 'd', g, plural, cas)} ${plural ? L.pl : L.sg}`;
      if (it.det && it.det.some) return `ein paar ${L.pl}`;
      if (n === null) return L.pl;
      if (n === 1 && (it.bare || (it.det && it.det.bit)) && MASS.has(it.id)) return L.sg;
      if (role === 'subj' && !it.num) return `${deDef('d', g, false, 'nom')} ${L.sg}`;
      return `${numWord(n, 'de', g, cas)} ${n === 1 ? L.sg : L.pl}`;
    }
    if (U) return n ? `${numWord(n, lang, U.g)} ${n === 1 ? U.sg : U.pl} de ${L.sg}` : `${U.pl} de ${L.sg}`;
    if (it.det && it.det.bit) return `${lang === 'es' ? 'un poco de' : 'um pouco de'} ${L.sg}`;
    if (it.det && !it.num) return `${romArt(lang, it.det, g, plural)} ${plural ? L.pl : L.sg}`;
    if (role === 'subj' && !it.num) return `${defArt(lang, g, plural)} ${plural ? L.pl : L.sg}`;
    if (n === null) return L.pl;
    if (n === 1 && it.bare && MASS.has(it.id)) return L.sg;
    return `${numWord(n, lang, g)} ${n === 1 ? L.sg : L.pl}`;
  }
  const addPlease = (s, lang) => { const tail = lang === 'de' ? ', bitte' : ', por favor'; return /\?$/.test(s) ? s.slice(0, -1) + tail + '?' : s + tail; };
  const GREET = {
    es: { hola: ['¡Hola!', 'Hi!'], buenas: ['¡Buenas!', 'Hi there!'], dias: ['¡Buenos días!', 'Good morning!'], buendia: ['¡Buen día!', 'Good morning!'], tardes: ['¡Buenas tardes!', 'Good afternoon!'], noches: ['¡Buenas noches!', 'Good evening!'] },
    pt: { oi: ['Oi!', 'Hi!'], ola: ['Olá!', 'Hello!'], dia: ['Bom dia!', 'Good morning!'], tarde: ['Boa tarde!', 'Good afternoon!'], noite: ['Boa noite!', 'Good evening!'] },
    de: { hallo: ['Hallo!', 'Hello!'], tag: ['Guten Tag!', 'Good day!'], morgen: ['Guten Morgen!', 'Good morning!'], abend: ['Guten Abend!', 'Good evening!'], moin: ['Moin!', 'Hi!'], servus: ['Servus!', 'Hi!'], gruss: ['Grüß Gott!', 'Hello!'], gruezi: ['Grüezi!', 'Hello!'] },
  };
  // the frame of the request, keeping your verb when it was a good one
  function frameOf(r, lang, subj) {
    const W = r.verbs || [];
    if (lang === 'de') {
      const v = W.find(x => !x.e.inf || W.length === 1);
      if (!v) return '…';
      const e = v.e, we = subj === 'wir';
      switch (e.lemma) {
        case 'möchten': return we ? 'Wir möchten …' : 'Ich möchte …';
        case 'hätten': return we ? 'Wir hätten gern …' : 'Ich hätte gern …';
        case 'nehmen': return e.p === 'imp' ? 'Ich nehme …' : we ? 'Wir nehmen …' : 'Ich nehme …';
        case 'kaufen': return 'Ich kaufe …';
        case 'brauchen': return 'Ich brauche …';
        case 'bekommen': return 'Ich bekomme …';
        case 'kriegen': return 'Ich kriege …';
        case 'wollen': return 'Ich möchte …';
        case 'geben': return e.gibt ? 'Gibt es …?' : e.p === 'imp' ? 'Ich möchte …' : 'Geben Sie mir …';
        case 'haben': return e.p === 'ich' || subj === 'ich' ? 'Ich hätte gern …' : 'Haben Sie …?';
        case 'können': return 'Kann ich … haben?';
        case 'könnten': return 'Könnte ich … haben?';
        case 'dürfen': case 'dürften': return 'Darf ich … haben?';
        case 'verkaufen': return 'Verkaufen Sie …?';
        case 'würden': return 'Ich würde gern … nehmen';
      }
      return 'Ich möchte …';
    }
    const v = W.find(x => !x.e.inf && x.e.v !== 'aux') || W.find(x => x.e.v === 'aux') || W[0];
    if (!v) return '…';
    const e = v.e;
    if (e.v === 'aux') { const inf = W.find(x => x.e.inf); return lang === 'es' ? `${firstCap(e.form)} a ${inf ? inf.e.form : 'llevar'} …` : `${firstCap(e.form)} ${inf ? inf.e.form : 'levar'} …`; }
    if (e.err || e.inf) return lang === 'es' ? 'Quiero …' : 'Quero …';
    if (e.tone === -1) return e.canon;
    const inf = W.find(x => x.e.inf && W.indexOf(x) > W.indexOf(v));
    if (e.v === 'can' && lang === 'es') return `¿Me ${e.form} ${inf ? inf.e.form : 'dar'} …?`;
    if (e.v === 'can' && lang === 'pt') return `${firstCap(e.form)} me ${inf ? inf.e.form : 'dar'} …?`;
    if (e.v === 'have' && lang === 'pt') { const p = (r.prons || []).find(x => x.e.formal || x.e.p === 'voce'); return p ? `${firstCap(p.e.form)} ${e.form} …?` : e.canon; }
    if (e.qp && !r.question && e.v === 'give') return e.canon.replace(/^¿/, '').replace(/\?$/, '');
    const frame = e.canon || (lang === 'es' ? 'Quiero …' : 'Quero …');
    return inf && ['want', 'need'].includes(e.v) ? frame.replace('…', inf.e.form + ' …') : frame;     // «Quiero comprar …»
  }
  // keep the polite words you used («por favor», «gracias», the greeting, «disculpe»); add «por favor» if there were none
  function wrapPolite(r, lang, s) {
    if (r.please || !r.polite || r.bossy) s = addPlease(s, lang);
    else if (r.thanksWord) s = /\?$/.test(s) ? s.slice(0, -1) + ', ' + r.thanksWord + '?' : s + ', ' + r.thanksWord;
    const pre = [r.greet && GREET[lang][r.greet] ? GREET[lang][r.greet][0] : '', r.sorryWord ? (lang === 'es' ? '¡' + firstCap(r.sorryWord) + '!' : firstCap(r.sorryWord) + '!') : ''].filter(Boolean).join(' ');
    return (pre ? pre + ' ' : '') + firstCap(s);
  }
  function canonOf(r, lang, subj) {
    const real = r.items.filter(it => !it.point);
    if (r.kind === 'buy') {
      if (!r.items.length) return '';
      if (r.items[0].answer) return wrapPolite(r, lang, r.items[0].phrase);        // «Tres manzanas, por favor»
      const list = real.length ? joinList(real.map(it => it.phrase), lang) : lang === 'de' ? 'das' : lang === 'es' ? 'eso' : 'isso';
      return wrapPolite(r, lang, frameOf(r, lang, subj).replace('…', list));
    }
    if (r.kind === 'price') {
      const pl = r.plural, cop = r.copE ? (!!r.copE.pl === pl ? r.copE.form : r.copE.pair) : '';
      if (!real.length) return wrapPolite(r, lang, lang === 'es' ? '¿Cuánto cuesta?' : lang === 'pt' ? 'Quanto custa?' : 'Was kostet das?');
      const list = joinList(real.map(it => it.phrase), lang);
      const s = lang === 'es' ? `¿${r.aCuanto ? 'A cuánto' : 'Cuánto'} ${cop || (pl ? 'cuestan' : 'cuesta')} ${list}?`
        : lang === 'pt' ? `Quanto ${cop || (pl ? 'custam' : 'custa')} ${list}?`
          : `${r.qText ? firstCap(r.qText === 'wieviel' ? 'wie viel' : r.qText) : 'Was'} ${cop || (pl ? 'kosten' : 'kostet')} ${list}?`;
      return wrapPolite(r, lang, s);
    }
    return '';
  }
  // A model sentence for the help: ask the price first, then buy (always an S)
  function model(id, lang, o = {}) {
    if (cjOn(lang)) return modelCJ(id, lang, o);
    const L = mainLemma(id, lang), g = L.g, en = enNoun(id, false);
    if (!o.known) {
      const pl = PRICE_PL.has(id);
      const text = lang === 'es' ? `¿Cuánto ${pl ? 'cuestan' : 'cuesta'} ${defArt('es', g, pl)} ${pl ? L.pl : L.sg}, por favor?`
        : lang === 'pt' ? `Quanto ${pl ? 'custam' : 'custa'} ${defArt('pt', g, pl)} ${pl ? L.pl : L.sg}, por favor?`
          : `Was ${pl ? 'kosten' : 'kostet'} ${deDef('d', g, pl, 'nom')} ${pl ? L.pl : L.sg}, bitte?`;
      return { text, en: `How much ${pl ? 'are the ' + enNoun(id, true) : 'is the ' + en}, please?`, ids: [id], kind: 'price' };
    }
    if (id === 'w.honey') return { text: { es: 'Quiero miel, por favor', pt: 'Quero mel, por favor', de: 'Ich möchte Honig, bitte' }[lang], en: lang === 'de' ? 'I’d like some honey, please.' : 'I want some honey, please.', ids: [id], kind: 'buy' };
    const n = !MASS.has(id) && id !== 'w.hat' && (o.coins === undefined || PRICE[id] * 2 <= o.coins) ? 2 : 1;
    const np = `${numWord(n, lang, g, 'acc')} ${n === 1 ? L.sg : L.pl}`;
    const text = lang === 'es' ? `Quiero ${np}, por favor` : lang === 'pt' ? `Quero ${np}, por favor` : `Ich möchte ${np}, bitte`;
    return { text, en: `${lang === 'de' ? 'I’d like' : 'I want'} ${n === 1 ? (/^[aeiou]/.test(en) ? 'an ' : 'a ') + en : 'two ' + enNoun(id, true)}, please.`, ids: [id, 'n.' + n], kind: 'buy' };
  }

  // ================================================================ why a slip is a slip (the longer version, like battle/lang.js)
  const WHY = {
    es: {
      gender: 'Gender: every Spanish noun is masculine or feminine, and the little words before it match: «un pan», «una manzana», «el queso», «la miel».',
      number: 'One or more: after «dos», «tres»… the noun is plural (manzana → manzanas, pan → panes). After «un / una» it stays singular. The verb matches too: «cuesta» for one thing, «cuestan» for more.',
      form: '«uno» is the number on its own («¿Cuántos? Uno»). Right before a noun it shortens to «un»: «un pan». In «¿Cuánto cuesta…?», «cuánto» never changes.',
      verb: 'Say what you want with «quiero» (I want), or more softly «quisiera» (I would like). «quieres» means "you want", «quiere» "he / she wants", and «querer» is just "to want".',
      order: 'In Spanish the number comes before the thing: «dos manzanas», not «manzanas dos».',
      article: 'Spanish puts a little word before the thing: «¿Cuánto cuesta el queso?», «Quiero una manzana». Bread, cheese, cake and honey can go without one: «Quiero pan».',
      prep: 'A jar of honey is «un frasco de miel»: the jar and the honey are joined with «de».',
      spelling: 'Spelling: a letter was off. Compare your sentence with the better one.',
      accent: 'Accents: Spanish puts marks on some letters, like «dieciséis», «cuánto» and «adiós». Typing without them still works, but this is how they look.',
      digits: 'The numbers are words to learn too: write «dos», not «2», for an S.',
      polite: 'Shopkeepers love «por favor». A greeting («buenos días»), «gracias», or a softer way to ask («quisiera…», «¿me da…?») works too, and a polite S gets you a discount!',
      bossy: '«Dame» is how you talk to a friend or a little brother. With a shopkeeper, ask: «¿Me da…?», or say «Quisiera…».',
      extra: 'The keeper skipped a word it didn’t need (or didn’t know). Keep it simple: how many, what, and «por favor».',
      space: '«por favor» is two words.',
    },
    pt: {
      gender: 'Gender: every Portuguese noun is masculine or feminine, and the little words before it match: «um pão», «uma maçã», «o queijo». Two changes too: «dois pães», «duas maçãs».',
      number: 'One or more: after «dois», «três»… the noun is plural (maçã → maçãs, pão → pães). After «um / uma» it stays singular. The verb matches too: «custa» for one thing, «custam» for more.',
      form: 'In «Quanto custa…?», «quanto» never changes.',
      verb: 'Say what you want with «quero» (I want), or more softly «queria» (I would like). «quer» means "you want / he wants", and «querer» is just "to want".',
      order: 'In Portuguese the number comes before the thing: «duas maçãs», not «maçãs duas».',
      article: 'Portuguese puts a little word before the thing: «Quanto custa o queijo?», «Quero um biscoito». Bread, cheese, cake and honey can go without one: «Quero pão».',
      prep: '«gostaria» and «preciso» take «de»: «Gostaria de dois pães», «Preciso de mel». A jar of honey is «um pote de mel».',
      spelling: 'Spelling: a letter was off. Compare your sentence with the better one.',
      accent: 'Accents: Portuguese puts marks on some letters, like «maçã», «três», «pães» and «chapéu». Typing without them still works, but this is how they look.',
      digits: 'The numbers are words to learn too: write «dois», not «2», for an S.',
      polite: 'Add «por favor». A greeting («bom dia»), «obrigado / obrigada», «o senhor / a senhora», or a softer way to ask («queria…», «me vê…») works too, and a polite S gets you a discount!',
      extra: 'The keeper skipped a word it didn’t need (or didn’t know). Keep it simple: how many, what, and «por favor».',
    },
    de: {
      gender: 'Gender: German nouns are der, die or das: «der Apfel», «die Birne», «das Brot». Asking for one: «einen Apfel», «eine Birne», «ein Brot».',
      case: 'Case: what you ask for is the object (accusative). Only «der» words change: «ein» → «einen», «der» → «den» («Ich möchte einen Apfel»). «die» and «das» words stay the same. But the thing that costs is the subject: «Was kostet der Käse?»',
      number: 'One or more: after «zwei», «drei»… the noun is plural, and German plurals are learned with the word: «Äpfel», «Birnen», «Brote», «Kekse», «Hüte». The verb matches too: «kostet» for one, «kosten» for more.',
      form: '«eins» is the number on its own («Wie viele? Eins»). Before a noun it’s «einen / eine / ein»: «einen Apfel».',
      verb: 'With «ich», the verb ends in -e: «ich möchte», «ich nehme», «ich hätte gern». With «wir» and «Sie» it ends in -en: «Haben Sie…?». «Ich hätte gern…» means "I would like" («ich habe gern» means "I like having").',
      subject: 'German doesn’t drop the «ich»: «Ich möchte zwei Äpfel», not just «Möchte zwei Äpfel».',
      order: 'In a German sentence the verb is the second thing: «Ich möchte zwei Äpfel» or «Zwei Äpfel möchte ich». With «kann ich…» or «möchte…», the second verb goes to the very end: «Kann ich zwei Äpfel haben?»',
      article: 'One countable thing needs «einen / eine / ein»: «Ich möchte einen Apfel». Bread, cheese, cake and honey can go without: «Ich möchte Käse».',
      spelling: 'Spelling: a letter was off. Compare your sentence with the better one.',
      accent: 'Umlauts: German writes «ä, ö, ü», like «Äpfel», «möchte», «Käse». Typing «ae, oe, ue» is fine too. Leaving them out still works, but «Apfel» and «Äpfel» are different words!',
      digits: 'The numbers are words to learn too: write «zwei», not «2», for an S.',
      polite: 'Add «bitte», a greeting («Guten Tag»), or ask the polite way: «Ich möchte…», «Ich hätte gern…», «Haben Sie…?». A polite S gets you a discount!',
      bossy: '«Gib mir» and «ich will» sound like a demanding kid. Say «Ich möchte…» or «Ich hätte gern…».',
      style: '«du» is for friends and family. To a shopkeeper, Germans say «Sie»: «Haben Sie Honig?»',
      extra: 'The keeper skipped a word it didn’t need (or didn’t know). Keep it simple: how many, what, and «bitte».',
    },
  };

  // ================================================================ what the keeper says
  // Each line is a list of text and slots, in the language and in English. A slot is a shop word
  // ({ id, tl, en, gl }): highlighted in the language line; in the English line (low weave) it's still
  // shown in the language, with a small gloss the first few times (the weave, DESIGN.md 12.4).
  const STALL_NAME = {
    fruit: { es: 'Frutas', pt: 'Frutas', de: 'Obst', en: 'Fruit' }, bakery: { es: 'Panadería', pt: 'Padaria', de: 'Bäckerei', en: 'Bakery' },
    cheese: { es: 'Quesos y miel', pt: 'Queijos e mel', de: 'Käse und Honig', en: 'Cheese & honey' }, sweets: { es: 'Dulces', pt: 'Doces', de: 'Süßes', en: 'Sweets' },
    hats: { es: 'Sombreros', pt: 'Chapéus', de: 'Hüte', en: 'Hats' },
  };
  const WHERE = {
    fruit: { es: 'en el puesto de fruta', pt: 'na banca de frutas', de: 'am Obststand', en: 'the fruit stall' },
    bakery: { es: 'en la panadería', pt: 'na padaria', de: 'in der Bäckerei', en: 'the bakery' },
    cheese: { es: 'en el puesto de quesos', pt: 'na banca de queijos', de: 'am Käsestand', en: 'the cheese stall' },
    sweets: { es: 'en el puesto de dulces', pt: 'na banca de doces', de: 'am Süßigkeitenstand', en: 'the sweets stall' },
    hats: { es: 'en el puesto de sombreros', pt: 'na banca de chapéus', de: 'am Hutstand', en: 'the hat stall' },
  };
  const stallOf = id => Object.keys(STALLS).find(s => STALLS[s].includes(id)) || 'fruit';
  const PROMPT = { es: '¿Qué le dices?', pt: 'O que você diz?', de: 'Was sagst du?' };
  const PLACEHOLDER = { es: 'escribe aquí…', pt: 'escreva aqui…', de: 'schreib hier…' };
  const slot = (id, tl, en, gl) => ({ id, tl, en, gl: gl === undefined ? en : gl });
  function kit(lang) {
    if (cjOn(lang)) return kitCJ(lang);
    const I = (id, pl) => slot(id, nounWord(id, pl, lang), enNoun(id, pl));
    const N = (n, g, cas) => slot('n.' + n, numWord(n, lang, g, cas), enNum(n), String(n));
    const C = pl => slot('w.coin', LEX.item('w.coin') ? (pl ? LEX.item('w.coin').pl[lang] : LEX.item('w.coin')[lang]) : 'coin', pl ? 'coins' : 'coin');
    const money = n => [N(n, 'f', 'nom'), ' ', C(n !== 1)];
    const join = (lists, and) => lists.reduce((a, l, i) => a.concat(i === 0 ? [] : [i === lists.length - 1 ? and : ', '], l), []);
    const J = JAR[lang];
    const qty = (n, id) => (id === 'w.honey' ? [N(n, J.g, 'nom'), ' ' + (n === 1 ? J.sg : J.pl) + J.of, I(id, false)] : [N(n, gOf(id, lang), 'nom'), ' ', I(id, n !== 1)]);
    const qtyEN = (n, id) => (id === 'w.honey' ? [N(n, J.g, 'nom'), n === 1 ? ' jar of ' : ' jars of ', I(id, false)] : [N(n, gOf(id, lang), 'nom'), ' ', I(id, n !== 1)]);
    const goods = (st, and) => { const ids = STALLS[st] || []; return ids.length ? join(ids.map(id => [I(id, !LIST_SG.has(id))]), and) : ['…']; };
    const def = (id, pl) => [defArt(lang, gOf(id, lang), pl, 'nom') + ' ', I(id, pl)];
    const list = (items, and, en) => join(items.map(it => (en ? qtyEN : qty)(it.n, it.id)), and);
    return { I, N, C, money, qty, qtyEN, goods, def, list, join };
  }
  const LINES = {
    welcome: {
      es: (c, k) => ['¡Hola! Tengo ', ...k.goods(c.stall, ' y '), '. ¿Qué te doy?'],
      pt: (c, k) => ['Oi! Tenho ', ...k.goods(c.stall, ' e '), '. O que vai ser?'],
      de: (c, k) => ['Hallo! Ich habe ', ...k.goods(c.stall, ' und '), '. Was darf’s sein?'],
      en: (c, k) => ['Hi! I’ve got ', ...k.goods(c.stall, ' and '), '. What can I get you?'],
    },
    greetBack: {
      es: c => [GREET.es[c.key][0], ' ¿Qué te doy?'], pt: c => [GREET.pt[c.key][0], ' O que vai ser?'], de: c => [GREET.de[c.key][0], ' Was darf’s sein?'],
      en: (c, k, lang) => [GREET[lang][c.key][1], ' What can I get you?'],
    },
    sold: {
      es: (c, k) => [c.mode === 'bossy' ? 'Mmm… bueno. ' : '¡Claro! ', ...k.list(c.items, ' y '), c.mode === 'discount' ? '. ¡Qué amable! Con descuento, ' : ': ', c.total === 1 ? 'es ' : 'son ', ...k.money(c.total), '.', c.hat ? ' ¡A ' + c.mimo + ' le va a quedar precioso!' : '', c.mode === 'bossy' ? '' : ' ¿Algo más?'],
      pt: (c, k) => [c.mode === 'bossy' ? 'Hum… tá bom. ' : 'Claro! ', ...k.list(c.items, ' e '), c.mode === 'discount' ? '. Que gentileza! Com desconto, ' : ': ', c.total === 1 ? 'é ' : 'são ', ...k.money(c.total), '.', c.hat ? ' Vai combinar com ' + c.mimo + '!' : '', c.mode === 'bossy' ? '' : ' Mais alguma coisa?'],
      de: (c, k) => [c.mode === 'bossy' ? 'Hm… na gut. ' : 'Gern! ', ...k.list(c.items, ' und '), c.mode === 'discount' ? '. Wie nett! Mit Rabatt macht das ' : ', das macht ', ...k.money(c.total), '.', c.hat ? ' Der steht ' + c.mimo + ' bestimmt super!' : '', c.mode === 'bossy' ? '' : ' Sonst noch etwas?'],
      en: (c, k) => [c.mode === 'bossy' ? 'Hmm… all right. ' : 'Sure! ', ...k.list(c.items, ' and ', true), c.mode === 'discount' ? '. How kind! With a discount, that’s ' : ': that’s ', ...k.money(c.total), '.', c.hat ? ' It’ll look lovely on ' + c.mimo + '!' : '', c.mode === 'bossy' ? '' : ' Anything else?'],
    },
    price: {
      es: (c, k) => ['Cuesta ', ...k.money(PRICE[c.id]), '.'], pt: (c, k) => ['Custa ', ...k.money(PRICE[c.id]), '.'],
      de: (c, k) => [...k.def(c.id, false), ' kostet ', ...k.money(PRICE[c.id]), '.'],
      en: (c, k) => ['It’s ', ...k.money(PRICE[c.id]), '.'], en_de: (c, k) => ['The ', k.I(c.id, false), ' is ', ...k.money(PRICE[c.id]), '.'],
    },
    priceEach: {
      es: (c, k) => ['Cuestan ', ...k.money(PRICE[c.id]), ' cada ', gOf(c.id, 'es') === 'f' ? 'una.' : 'uno.'], pt: (c, k) => ['Custam ', ...k.money(PRICE[c.id]), ' cada.'],
      de: (c, k) => [...k.def(c.id, true), ' kosten ', ...k.money(PRICE[c.id]), ' das Stück.'],
      en: (c, k) => ['They’re ', ...k.money(PRICE[c.id]), ' each.'], en_de: (c, k) => ['The ', k.I(c.id, true), ' are ', ...k.money(PRICE[c.id]), ' each.'],
    },
    priceQty: {
      es: (c, k) => [...k.qty(c.n, c.id), ' cuestan ', ...k.money(c.n * PRICE[c.id]), '.'], pt: (c, k) => [...k.qty(c.n, c.id), ' custam ', ...k.money(c.n * PRICE[c.id]), '.'],
      de: (c, k) => [...k.qty(c.n, c.id), ' kosten ', ...k.money(c.n * PRICE[c.id]), '.'], en: (c, k) => [...k.qtyEN(c.n, c.id), ' cost ', ...k.money(c.n * PRICE[c.id]), '.'],
    },
    priceMany: {
      es: (c, k) => c.items.reduce((a, it, i) => a.concat([i ? ' ' : ''], k.def(it.id, false), [' cuesta '], k.money(PRICE[it.id]), ['.']), []),
      pt: (c, k) => c.items.reduce((a, it, i) => a.concat([i ? ' ' : ''], k.def(it.id, false), [' custa '], k.money(PRICE[it.id]), ['.']), []),
      de: (c, k) => c.items.reduce((a, it, i) => a.concat([i ? ' ' : ''], k.def(it.id, false), [' kostet '], k.money(PRICE[it.id]), ['.']), []),
      en: (c, k) => c.items.reduce((a, it, i) => a.concat([i ? ' The ' : 'The '], [k.I(it.id, false)], [' is '], k.money(PRICE[it.id]), ['.']), []),
    },
    notHere: {
      es: (c, k) => ['Lo siento, aquí no hay ', k.I(c.id, !LIST_SG.has(c.id)), '. Prueba ', WHERE[stallOf(c.id)].es, '.'],
      pt: (c, k) => ['Desculpa, aqui não tem ', k.I(c.id, !LIST_SG.has(c.id)), '. Tenta ', WHERE[stallOf(c.id)].pt, '.'],
      de: (c, k) => ['Tut mir leid, ', k.I(c.id, !LIST_SG.has(c.id)), ' habe ich nicht. Versuch’s ', WHERE[stallOf(c.id)].de, '.'],
      en: (c, k) => ['Sorry, I don’t sell ', k.I(c.id, !LIST_SG.has(c.id)), ' here. Try ', WHERE[stallOf(c.id)].en, '.'],
    },
    broke: {
      es: (c, k) => ['Uy, eso cuesta ', ...k.money(c.total), ', y tienes ', ...k.money(c.coins), '. ¿Quizás menos?'],
      pt: (c, k) => ['Ih, isso custa ', ...k.money(c.total), ', e você tem ', ...k.money(c.coins), '. Que tal menos?'],
      de: (c, k) => ['Oh, das kostet ', ...k.money(c.total), ', und du hast ', ...k.money(c.coins), '. Vielleicht weniger?'],
      en: (c, k) => ['Oh, that’s ', ...k.money(c.total), ', and you have ', ...k.money(c.coins), '. Maybe fewer?'],
    },
    howMany: {
      es: (c, k) => (c.id === 'w.honey' ? ['¿Cuántos frascos de ', k.I(c.id, false), ' quieres?'] : [gOf(c.id, 'es') === 'f' ? '¿Cuántas ' : '¿Cuántos ', k.I(c.id, true), ' quieres?']),
      pt: (c, k) => (c.id === 'w.honey' ? ['Quantos potes de ', k.I(c.id, false), ' você quer?'] : [gOf(c.id, 'pt') === 'f' ? 'Quantas ' : 'Quantos ', k.I(c.id, true), ' você quer?']),
      de: (c, k) => (c.id === 'w.honey' ? ['Wie viele Gläser ', k.I(c.id, false), ' möchtest du?'] : ['Wie viele ', k.I(c.id, true), ' möchtest du?']),
      en: (c, k) => (c.id === 'w.honey' ? ['How many jars of ', k.I(c.id, false), ' would you like?'] : ['How many ', k.I(c.id, true), ' would you like?']),
    },
    whatQty: { es: (c, k) => ['¿', k.N(c.n, null), ' qué?'], pt: (c, k) => [k.N(c.n, null), ' o quê?'], de: (c, k) => [k.N(c.n, null), ' was?'], en: (c, k) => [k.N(c.n, null), ' what?'] },
    which: {
      es: (c, k) => ['¿Cuál? Tengo ', ...k.goods(c.stall, ' y '), '.'], pt: (c, k) => ['Qual? Tenho ', ...k.goods(c.stall, ' e '), '.'],
      de: (c, k) => ['Welches denn? Ich habe ', ...k.goods(c.stall, ' und '), '.'], en: (c, k) => ['Which one? I’ve got ', ...k.goods(c.stall, ' and '), '.'],
    },
    whatWant: {
      es: (c, k) => ['¿Qué te doy? Tengo ', ...k.goods(c.stall, ' y '), '.'], pt: (c, k) => ['O que vai ser? Tenho ', ...k.goods(c.stall, ' e '), '.'],
      de: (c, k) => ['Was darf’s sein? Ich habe ', ...k.goods(c.stall, ' und '), '.'], en: (c, k) => ['What can I get you? I’ve got ', ...k.goods(c.stall, ' and '), '.'],
    },
    noSuch: {
      es: (c, k) => ['Lo siento, eso no lo tengo. Tengo ', ...k.goods(c.stall, ' y '), '.'], pt: (c, k) => ['Desculpa, isso eu não tenho. Tenho ', ...k.goods(c.stall, ' e '), '.'],
      de: (c, k) => ['Tut mir leid, das habe ich nicht. Ich habe ', ...k.goods(c.stall, ' und '), '.'], en: (c, k) => ['Sorry, I don’t have that. I’ve got ', ...k.goods(c.stall, ' and '), '.'],
    },
    tooMany: {
      es: (c, k) => ['¡Uy, eso es mucho! Máximo ', k.N(20, null), '.'], pt: (c, k) => ['Nossa, é muita coisa! No máximo ', k.N(20, null), '.'],
      de: (c, k) => ['Oh, das ist zu viel! Höchstens ', k.N(20, null), '.'], en: (c, k) => ['Whoa, that’s a lot! ', k.N(20, null), ' at most.'],
    },
    huh: { es: () => ['¿Perdón? No te entendí.'], pt: () => ['Como? Não entendi.'], de: () => ['Wie bitte? Das habe ich nicht verstanden.'], en: () => ['Sorry? I didn’t get that.'] },
    english: { es: () => ['Ay, no hablo inglés…'], pt: () => ['Ih, não falo inglês…'], de: () => ['Oh, ich spreche kein Englisch…'], en: () => ['Oh, I don’t speak English…'] },
    thanks: {
      es: () => ['¡De nada! ¡Que te vaya bien!'], pt: () => ['De nada! Volte sempre!'], de: () => ['Gern geschehen! Schönen Tag noch!'],
      en: () => ['You’re welcome! Take care!'], en_pt: () => ['You’re welcome! Come back anytime!'], en_de: () => ['My pleasure! Have a nice day!'],
    },
    bye: { es: () => ['¡Adiós! ¡Vuelve pronto!'], pt: () => ['Tchau! Volte sempre!'], de: () => ['Tschüss! Bis bald!'], en: () => ['Bye! Come back soon!'], en_pt: () => ['Bye! Come back anytime!'] },
    yes: { es: () => ['¡Bien! ¿Qué te doy?'], pt: () => ['Ótimo! O que vai ser?'], de: () => ['Prima! Was darf’s sein?'], en: () => ['Great! What can I get you?'] },
    no: { es: () => ['¡Bueno! Aquí estoy si necesitas algo.'], pt: () => ['Tá bom! Tô aqui se precisar.'], de: () => ['Okay! Ich bin hier, wenn du was brauchst.'], en: () => ['Okay! I’m here if you need anything.'] },
  };
  // capitals at the start of each sentence («Dos manzanas…», «El queso cuesta…»)
  function capFix(toks) {
    let start = true;
    return toks.map(t => {
      if (typeof t === 'string') {
        const s = start && /\p{L}/u.test(t) ? firstCap(t) : t;
        if (/[\p{L}.!?…]/u.test(t)) start = /[.!?…]\s*$/.test(t) || /[¡¿]\s*$/.test(t);
        return s;
      }
      const o = start ? Object.assign({}, t, { tl: firstCap(t.tl), en: firstCap(t.en) }) : t;
      start = false;
      return o;
    });
  }
  // (zh / ja: the tokens are the notation, shown by CJK: cjHTML, cjSrc below)
  const curLang = () => (V ? V.lang : LEX.lang);
  const tlHTML = toks => (cjOn(curLang()) ? cjHTML(toks, curLang()) : toks.map(t => (typeof t === 'string' ? esc(t) : `<span class="w" data-en="${esc(t.en)}">${esc(t.tl)}</span>`)).join(''));
  const tlPlain = toks => (cjOn(curLang()) ? CJK.plain(cjSrc(toks), { lang: curLang() }) : toks.map(t => (typeof t === 'string' ? t : t.tl)).join(''));
  const enPlain = toks => toks.map(t => (typeof t === 'string' ? t : t.en)).join('');
  const isItem = id => !!(id && LEX.item(id));
  // UI.weaveParts-style parts: the English line, with the shop words in the language (glossed the first 3 times)
  const enParts = toks => toks.map((t, i) => {
    if (typeof t === 'string') return { s: t };
    const p = { s: t.tl, id: t.id, tl: true, en: t.en, gl: !isItem(t.id) || LEX.wv(t.id) < 3 ? t.gl : undefined }, l = curLang();
    if (cjOn(l)) { p.src = t.tl; p.cap = i === 0; p.s = CJK.plain(t.tl, { lang: l, cap: p.cap }); p.len = CJK.len(t.tl, { lang: l, cap: p.cap }); }
    return p;
  });

  // ================================================================ zh / ja (CJK.md): orders in Chinese and Japanese
  // The same visit, grades, discount and weave as es / pt / de, with each language's own grammar (parseCJ):
  //  zh: a number takes a measure word (两个苹果, 一罐蜂蜜, 一顶帽子; 两, not 二, before it; 个 where a thing has its own
  //      is a soft note), 这 / 那 (+ 个) point at a thing, 多少钱 / 怎么卖 ask the price (the thing first), 我要 / 我想要 /
  //      我买 / 来 / 请给我 / 有…吗 / 能…吗 order; 请 / 请问 / 谢谢 / 您 / 你好 / 老板 are polite, 给我 without 请 is
  //      bossy. Tones are optional; one typed wrong is a soft note, or another word when the keeper knows one with that tone
  //      (mǎi 买 buys, mài 卖 sells). A character that only sounds the same (平果) is a spelling slip.
  //  ja: りんご を ふたつ ください: を on the thing (が / は there: a slip; left out: a soft note), a counter on the number
  //      (ひとつ … とお, then 個; 枚 flat things, 本 bottles and bars, 杯 cups, 部 papers) with its sound changes (いっこ,
  //      さんぼん), a count before the thing takes の (ふたつ の りんご), これ / この, the verb last, は for the price (りんご
  //      は いくら です か). ください / お願いします / です / ます are polite; くれ / よこせ are bossy.
  // What you type (characters, pinyin / rōmaji or kana; the in-game IME is on the box) is read like the battle parser
  // reads a command: the cheapest cover by the keepers' words (CJK.typed / wordOf / matchAt). Lines, notes and models are
  // the notation, shown by CJK in the mode (ruby over the characters you don't know yet).
  const CJL = ['zh', 'ja'];
  const cjOn = l => CJL.includes(l) && typeof CJK !== 'undefined' && !!CJK.typed;
  // the goods: zh forms and measure words (cl: the keeper's; cls: also right), ja forms and the counters that fit them
  // beyond つ and 個 (jc; the first is the keeper's)
  const CJ_GOODS = {
    'w.apple': { zh: ['[苹果|píng guǒ]'], cl: '个', cls: ['斤'], ja: ['りんご', 'リンゴ', '[林檎|りんご]'] },
    'w.pear': { zh: ['[梨|lí]', '[梨子|lí zi]'], cl: '个', cls: ['斤'], ja: ['[梨|なし]', 'ナシ'] },
    'w.orange': { zh: ['[橙子|chéng zi]', '[橘子|jú zi]', '[桔子|jú zi]'], cl: '个', cls: ['斤'], ja: ['オレンジ'] },
    'w.bread': { zh: ['[面包|miàn bāo]'], cl: '个', cls: ['块', '片', '条'], ja: ['パン'], jc: ['枚'] },
    'w.cake': { zh: ['[蛋糕|dàn gāo]'], cl: '块', cls: ['个', '片', '盒'], ja: ['ケーキ'] },
    'w.cheese': { zh: ['[奶酪|nǎi lào]', '[芝士|zhī shì]'], cl: '块', cls: ['片'], ja: ['チーズ'], jc: ['枚'] },
    'w.honey': { zh: ['[蜂蜜|fēng mì]'], cl: '罐', cls: ['瓶'], ja: ['はちみつ', 'ハチミツ', '[蜂蜜|はちみつ]'] },
    'w.cookie': { zh: ['[饼干|bǐng gān]', '[曲奇|qǔ qí]'], cl: '块', cls: ['片', '个', '包', '盒'], ja: ['クッキー'], jc: ['枚'] },
    'w.hat': { zh: ['[帽子|mào zi]'], cl: '顶', ja: ['[帽子|ぼうし]'] },
    'w.coin': { zh: ['[金币|jīn bì]', '[硬币|yìng bì]'], cl: '枚', cls: ['个'], ja: ['コイン'], jc: ['枚'] },
    'w.juice': { zh: ['[果汁|guǒ zhī]'], cl: '瓶', cls: ['杯', '盒'], ja: ['ジュース'], jc: ['本', '杯'] },
    'w.soda': { zh: ['[汽水|qì shuǐ]', '[可乐|kě lè]', '[苏打水|sū dá shuǐ]'], cl: '瓶', cls: ['罐', '杯'], ja: ['ソーダ', 'サイダー', 'コーラ'], jc: ['本', '杯'] },
    'w.icecream': { zh: ['[冰淇淋|bīng qí lín]', '[冰激凌|bīng jī líng]', '[雪糕|xuě gāo]'], cl: '个', cls: ['支', '根', '盒', '杯'], ja: ['アイス', 'アイスクリーム'], jc: ['本'] },
    'w.candy': { zh: ['[糖|táng]', '[糖果|táng guǒ]'], cl: '颗', cls: ['块', '包'], ja: ['あめ', 'アメ', '[飴|あめ]', 'キャンディー', 'キャンディ'] },
    'w.chocolate': { zh: ['[巧克力|qiǎo kè lì]'], cl: '块', cls: ['条', '盒', '颗'], ja: ['チョコ', 'チョコレート'], jc: ['枚'] },
    'w.gum': { zh: ['[口香糖|kǒu xiāng táng]'], cl: '片', cls: ['块', '包', '条'], ja: ['ガム'], jc: ['枚'] },
    'w.newspaper': { zh: ['[报纸|bào zhǐ]'], cl: '份', cls: ['张'], ja: ['[新聞|しんぶん]'], jc: ['部'] },
  };
  // zh measure words (the wrong ones too, to say so) and what they count
  const CL_PY = { 个: 'gè', 块: 'kuài', 片: 'piàn', 条: 'tiáo', 罐: 'guàn', 瓶: 'píng', 顶: 'dǐng', 枚: 'méi', 杯: 'bēi', 盒: 'hé', 份: 'fèn', 张: 'zhāng',
    颗: 'kē', 包: 'bāo', 支: 'zhī', 根: 'gēn', 斤: 'jīn', 只: 'zhī', 本: 'běn', 件: 'jiàn', 双: 'shuāng', 位: 'wèi', 碗: 'wǎn', 袋: 'dài' };
  const CL_EN = { 个: 'most things', 块: 'pieces', 片: 'slices', 条: 'bars and loaves', 罐: 'jars and cans', 瓶: 'bottles', 顶: 'hats', 枚: 'coins', 杯: 'cups',
    盒: 'boxes', 份: 'newspapers', 张: 'sheets', 颗: 'little round things', 包: 'packs', 支: 'sticks', 根: 'sticks', 斤: 'half kilos', 只: 'animals', 本: 'books',
    件: 'clothes', 双: 'pairs', 位: 'people', 碗: 'bowls', 袋: 'bags' };
  const clOf = id => (CJ_GOODS[id] && CJ_GOODS[id].cl) || '个';
  const clsOf = id => [clOf(id)].concat((CJ_GOODS[id] && CJ_GOODS[id].cls) || []);
  const clSrc = c => `[${c}|${CL_PY[c] || 'gè'}]`;
  // zh numbers in the notation: [两|liǎng] before a measure word (o: true), [二十五|èr shí wǔ], [一百零五|yī bǎi líng wǔ]
  const ZH_C = '零一二三四五六七八九', ZH_P = ['líng', 'yī', 'èr', 'sān', 'sì', 'wǔ', 'liù', 'qī', 'bā', 'jiǔ'];
  function zhNumSrc(n, cl) {
    n = Math.max(0, Math.floor(n));
    if (n === 2 && cl) return '[两|liǎng]';
    const h = Math.floor(n / 100) % 10, t = Math.floor((n % 100) / 10), u = n % 10, c = [], s = [];
    const put = (ch, py) => { c.push(ch); s.push(py); };
    if (h) { if (h === 2 && cl) put('两', 'liǎng'); else put(ZH_C[h], ZH_P[h]); put('百', 'bǎi'); }
    if (t) { if (h || t > 1) put(ZH_C[t], ZH_P[t]); put('十', 'shí'); } else if (h && u) put('零', 'líng');
    if (u) put(ZH_C[u], ZH_P[u]);
    if (!c.length) put('零', 'líng');
    return `[${c.join('')}|${s.join(' ')}]`;
  }
  // ja numbers and counters: ひとつ … とお, then a counter with its sound changes (いっこ, ろっこ, じゅっこ; いっぽん, さんぼん)
  const JA_NUM = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう', 'じゅう'], JA_KAN = '〇一二三四五六七八九';
  const JA_TSU_SRC = ['', '[一|ひと]つ', '[二|ふた]つ', '[三|みっ]つ', '[四|よっ]つ', '[五|いつ]つ', '[六|むっ]つ', '[七|なな]つ', '[八|やっ]つ', '[九|ここの]つ', '[十|とお]'];
  const JA_CTR = { 個: { k: 'こ', s: 'k' }, 本: { k: 'ほん', s: 'h', p: 'ぽん', b: 'ぼん' }, 杯: { k: 'はい', s: 'h', p: 'ぱい', b: 'ばい' }, 枚: { k: 'まい' }, 部: { k: 'ぶ' } };
  const CTR_EN = { つ: 'things, up to ten', 個: 'things', 本: 'bottles and bars', 杯: 'cups', 枚: 'flat things', 部: 'newspapers' };
  function jaNumKana(n) {
    const h = Math.floor(n / 100) % 10, t = Math.floor((n % 100) / 10), u = n % 10;
    const H = ['', 'ひゃく', 'にひゃく', 'さんびゃく', 'よんひゃく', 'ごひゃく', 'ろっぴゃく', 'ななひゃく', 'はっぴゃく', 'きゅうひゃく'];
    return (H[h] + (t ? (t > 1 ? JA_NUM[t] : '') + 'じゅう' : '') + (u ? JA_NUM[u] : '')) || 'れい';
  }
  function jaNumKanji(n) {
    const h = Math.floor(n / 100) % 10, t = Math.floor((n % 100) / 10), u = n % 10;
    return ((h ? (h > 1 ? JA_KAN[h] : '') + '百' : '') + (t ? (t > 1 ? JA_KAN[t] : '') + '十' : '') + (u ? JA_KAN[u] : '')) || '〇';
  }
  // a count's readings: ok (the right ones, the usual first) and bad (the number and the counter just stuck together)
  function jaCountKana(n, c) {
    const C = JA_CTR[c] || JA_CTR['個'];
    if (!C.s || n < 1 || n >= 100) return { ok: [jaNumKana(n) + C.k], bad: [] };
    const u = n % 10, t = Math.floor(n / 10);
    const head = u ? (t ? jaNumKana(t * 10) : '') : t > 1 ? JA_NUM[t] : '', last = u ? JA_NUM[u] : 'じゅう', plain = head + last + C.k;
    let ok;
    if (C.s === 'k') ok = last === 'いち' ? [head + 'いっこ'] : last === 'ろく' ? [head + 'ろっこ'] : last === 'はち' ? [head + 'はっこ', plain] : last === 'じゅう' ? [head + 'じゅっこ', head + 'じっこ'] : [plain];
    else ok = last === 'いち' ? [head + 'いっ' + C.p] : last === 'ろく' ? [head + 'ろっ' + C.p] : last === 'はち' ? [head + 'はっ' + C.p, plain] : last === 'じゅう' ? [head + 'じゅっ' + C.p, head + 'じっ' + C.p] : last === 'さん' ? [head + 'さん' + C.b] : [plain];
    return { ok, bad: ok.includes(plain) ? [] : [plain] };
  }
  const ctrsOf = id => ['つ', '個'].concat((CJ_GOODS[id] && CJ_GOODS[id].jc) || []);
  const ctrOf = (id, n) => { const j = CJ_GOODS[id] && CJ_GOODS[id].jc; return j && j.length ? j[0] : n <= 10 ? 'つ' : '個'; };
  const jaCountSrc = (n, c) => (c === 'つ' && n >= 1 && n <= 10 ? JA_TSU_SRC[n] : `[${jaNumKanji(n)}${c === 'つ' ? '個' : c}|${jaCountKana(n, c === 'つ' ? '個' : c).ok[0]}]`);
  // a thing's word, a count of it («两个苹果» / «りんご ふたつ»), a number with a measure word / counter, coins
  const cjWord = (id, l) => { const it = LEX.item(id); return (it && it[l]) || (CJ_GOODS[id] && CJ_GOODS[id][l] && CJ_GOODS[id][l][0]) || enNoun(id, false); };
  const cjQty = (n, id, l, o = {}) => (l === 'zh' ? `${zhNumSrc(n, true)} ${clSrc(o.cl || clOf(id))} ${cjWord(id, l)}` : `${cjWord(id, l)} ${jaCountSrc(n, o.ctr || ctrOf(id, n))}`);
  const cjCount = (n, l, x) => (l === 'zh' ? `${zhNumSrc(n, true)} ${clSrc(x || '个')}` : jaCountSrc(n, x || (n <= 10 ? 'つ' : '個')));
  const cjMoney = (n, l) => (l === 'zh' ? `${zhNumSrc(n, true)} [枚|méi] ${cjWord('w.coin', 'zh')}` : `${cjWord('w.coin', 'ja')} ${jaCountSrc(n, '枚')}`);
  const cjWhere = (id, l) => { const w = WHERE[stallOf(id)]; return (w && w[l]) || (l === 'zh' ? '[别的|bié de] [摊位|tān wèi]' : 'ほか の お[店|みせ]'); };
  const DET_JA = { kono: 'この', sono: 'その', ano: 'あの', kore: 'この', sore: 'その', are: 'あの' }, PT_JA = { kore: 'これ', sore: 'それ', are: 'あれ' };
  const DET_ZH = { zhe: '[这|zhè]', na: '[那|nà]' };
  // the words get their zh / ja (the teach box, the bag, battles), the numbers 1–20 theirs (二 / 两, 二 / ふたつ)
  function cjMerge() {
    for (const [id, g] of Object.entries(CJ_GOODS)) {
      const it = LEX.item(id);
      if (!it) continue;
      for (const l of CJL) {
        if (!g[l]) continue;
        if (!it[l]) it[l] = g[l][0];
        const more = g[l].filter(f => f !== it[l]);
        if (more.length) { it.alt = it.alt || {}; it.alt[l] = Array.from(new Set([...(it.alt[l] || []), ...more])); }
        if (it.pl && typeof it.pl === 'object' && !it.pl[l]) it.pl[l] = it[l];
      }
      if (!(it.cl && it.cl.zh)) it.cl = Object.assign({}, it.cl, { zh: clSrc(clOf(id)) });
    }
    for (let n = 1; n <= 20; n++) {
      const it = LEX.item('n.' + n);
      if (!it) continue;
      if (!it.zh) it.zh = zhNumSrc(n, false);
      if (!it.ja) it.ja = `[${jaNumKanji(n)}|${jaNumKana(n)}]`;
      it.alt = it.alt || {};
      if (n === 2 && !it.alt.zh) it.alt.zh = ['[两|liǎng]'];
      if (n <= 10 && !it.alt.ja) it.alt.ja = [JA_TSU_SRC[n]];
    }
  }
  cjMerge();
  Object.assign(LNAME, { zh: 'Chinese', ja: 'Japanese' });
  Object.assign(PROMPT, { zh: '[你|nǐ] [想|xiǎng] [说|shuō] [什么|shén me] ？', ja: 'なん と [言|い]います か ？' });
  Object.assign(PLACEHOLDER, { zh: '[在|zài] [这里|zhè lǐ] [写|xiě] …', ja: 'ここ に [書|か]いて …' });
  [['fruit', '[水果|shuǐ guǒ]', 'くだもの', '[水果|shuǐ guǒ] [摊|tān]', 'くだもの[屋|や]さん'], ['bakery', '[面包店|miàn bāo diàn]', 'パン[屋|や]', '[面包店|miàn bāo diàn]', 'パン[屋|や]さん'],
    ['cheese', '[奶酪|nǎi lào] [和|hé] [蜂蜜|fēng mì]', 'チーズ と はちみつ', '[奶酪|nǎi lào] [摊|tān]', 'チーズ[屋|や]さん'], ['sweets', '[甜点|tián diǎn]', 'お[菓子|かし]', '[甜点|tián diǎn] [摊|tān]', 'お[菓子屋|かしや]さん'],
    ['hats', '[帽子|mào zi]', '[帽子|ぼうし]', '[帽子|mào zi] [摊|tān]', '[帽子屋|ぼうしや]さん']]
    .forEach(([st, nz, nj, wz, wj]) => { Object.assign(STALL_NAME[st], { zh: nz, ja: nj }); Object.assign(WHERE[st], { zh: wz, ja: wj }); });
  Object.assign(GREET, {
    zh: { nihao: ['[你好|nǐ hǎo] ！', 'Hi!'], ninhao: ['[您好|nín hǎo] ！', 'Hello!'], zao: ['[早上好|zǎo shang hǎo] ！', 'Good morning!'], xiawu: ['[下午好|xià wǔ hǎo] ！', 'Good afternoon!'], wanshang: ['[晚上好|wǎn shang hǎo] ！', 'Good evening!'] },
    ja: { konnichiwa: ['こんにちは ！', 'Hello!'], ohayo: ['おはよう ございます ！', 'Good morning!'], konbanwa: ['こんばんは ！', 'Good evening!'], doumo: ['どうも ！', 'Hi!'] },
  });

  // ---------------------------------------------------------------- the keepers' words: [kind, key, notation, more]
  const ZH_WORDS = [
    ['pron', 'wo', '[我|wǒ]'], ['pron', 'wo', '[我们|wǒ men]'], ['pron', 'ni', '[你|nǐ]'], ['pron', 'nin', '[您|nín]'],
    ['verb', 'yao', '[要|yào]', { v: 'want' }], ['verb', 'xiangyao', '[想要|xiǎng yào]', { v: 'want', tone: 1 }], ['verb', 'xiang', '[想|xiǎng]', { v: 'want', tone: 1 }],
    ['verb', 'mai', '[买|mǎi]', { v: 'buy' }], ['verb', 'sell', '[卖|mài]', { v: 'sell' }], ['verb', 'lai', '[来|lái]', { v: 'give' }], ['verb', 'na', '[拿|ná]', { v: 'give' }],
    ['verb', 'gei', '[给|gěi]', { v: 'give', tone: -1 }], ['verb', 'you', '[有|yǒu]', { v: 'have' }], ['verb', 'youmeiyou', '[有没有|yǒu méi yǒu]', { v: 'have', q: 1 }],
    ['verb', 'xuyao', '[需要|xū yào]', { v: 'need' }], ['verb', 'neng', '[能|néng]', { v: 'can', tone: 1 }], ['verb', 'keyi', '[可以|kě yǐ]', { v: 'can', tone: 1 }],
    ['please', 'qing', '[请|qǐng]'], ['please', 'qingwen', '[请问|qǐng wèn]'], ['please', 'mafan', '[麻烦|má fan]'],
    ['thanks', 'xiexie', '[谢谢|xiè xie]'], ['thanks', 'xiexie', '[多谢|duō xiè]'], ['thanks', 'xiexie', '[谢|xiè]'],
    ['greet', 'nihao', '[你好|nǐ hǎo]'], ['greet', 'ninhao', '[您好|nín hǎo]'], ['greet', 'zao', '[早上好|zǎo shang hǎo]'], ['greet', 'zao', '[早|zǎo]'], ['greet', 'zao', '[早安|zǎo ān]'],
    ['greet', 'xiawu', '[下午好|xià wǔ hǎo]'], ['greet', 'wanshang', '[晚上好|wǎn shang hǎo]'], ['greet', 'nihao', '[嗨|hāi]'], ['greet', 'nihao', '[哈喽|hā lóu]'],
    ['address', 'laoban', '[老板|lǎo bǎn]'], ['address', 'ayi', '[阿姨|ā yí]'], ['address', 'shushu', '[叔叔|shū shu]'], ['address', 'shifu', '[师傅|shī fu]'],
    ['sorry', 'buhaoyisi', '[不好意思|bù hǎo yì si]'], ['sorry', 'duibuqi', '[对不起|duì bu qǐ]'], ['sorry', 'darao', '[打扰|dǎ rǎo] [一下|yī xià]'], ['sorry', 'laojia', '[劳驾|láo jià]'],
    ['bye', 'zaijian', '[再见|zài jiàn]'], ['bye', 'baibai', '[拜拜|bái bái]'], ['bye', 'zoule', '[走|zǒu] [了|le]'],
    ['yes', 'hao', '[好|hǎo]'], ['yes', 'hao', '[好的|hǎo de]'], ['yes', 'hao', '[好吧|hǎo ba]'], ['yes', 'shi', '[是|shì]'], ['yes', 'dui', '[对|duì]'], ['yes', 'xing', '[行|xíng]'],
    ['no', 'bu', '[不|bù]'], ['no', 'buyao', '[不要|bù yào]'], ['no', 'buyong', '[不用|bù yòng]'], ['no', 'meiyou', '[没有|méi yǒu]'], ['no', 'suanle', '[算了|suàn le]'],
    ['q', 'price', '[多少|duō shao] [钱|qián]'], ['q', 'price', '[怎么|zěn me] [卖|mài]'], ['q', 'price', '[几|jǐ] [块|kuài] [钱|qián]'], ['q', 'price', '[价格|jià gé]'], ['q', 'price', '[价钱|jià qian]'],
    ['q', 'howmuch', '[多少|duō shao]'], ['q', 'money', '[钱|qián]'], ['q', 'ji', '[几|jǐ]'], ['q', 'what', '[什么|shén me]'], ['ma', 'ma', '[吗|ma]'],
    ['det', 'zhe', '[这|zhè]'], ['det', 'na', '[那|nà]'], ['det', 'zhe', '[这些|zhè xiē]', { pl: 1 }], ['det', 'na', '[那些|nà xiē]', { pl: 1 }],
    ['some', 'xie', '[一些|yī xiē]'], ['some', 'dian', '[一点|yī diǎn]'], ['some', 'dian', '[一点儿|yī diǎn r]'], ['some', 'dian', '[点|diǎn]'], ['some', 'xie', '[些|xiē]'],
    ['de', 'de', '[的|de]'], ['and', 'he', '[和|hé]'], ['and', 'haiyou', '[还有|hái yǒu]'], ['and', 'gen', '[跟|gēn]'], ['also', 'zai', '[再|zài]'], ['also', 'hai', '[还|hái]'], ['also', 'ye', '[也|yě]'],
    ['fill', 'ba', '[吧|ba]'], ['fill', 'a', '[啊|a]'], ['fill', 'ya', '[呀|ya]'], ['fill', 'ne', '[呢|ne]'], ['fill', 'jiu', '[就|jiù]'], ['fill', 'yixia', '[一下|yī xià]'], ['fill', 'le', '[了|le]'],
    ['fill', 'xian', '[先|xiān]'], ['fill', 'o', '[哦|ó]'], ['fill', 'dou', '[都|dōu]'], ['fill', 'yigong', '[一共|yī gòng]'], ['fill', 'name', '[那么|nà me]'], ['fill', 'zheli', '[这里|zhè lǐ]'],
    ['help', '', '[帮助|bāng zhù]'], ['help', '', '[帮忙|bāng máng]'], ['help', '', '[不|bù] [知道|zhī dào]'], ['help', '', '[我|wǒ] [不|bù] [知道|zhī dào]'],
    ['name', '', '[米莫|Mǐ mò]'],
  ];
  const JA_WORDS = [
    ['p', 'wo', 'を'], ['p', 'wa', 'は'], ['p', 'ga', 'が'], ['p', 'ni', 'に'], ['p', 'no', 'の'], ['p', 'to', 'と'], ['p', 'mo', 'も'], ['p', 'de', 'で'], ['p', 'ya', 'や'],
    ['verb', 'kudasai', 'ください', { v: 'give', tone: 1 }], ['verb', 'kudasai', '[下|くだ]さい', { v: 'give', tone: 1 }],
    ['verb', 'onegai', 'お[願|ねが]いします', { v: 'give', tone: 1 }], ['verb', 'onegai', 'お[願|ねが]い いたします', { v: 'give', tone: 1 }], ['verb', 'onegai0', 'お[願|ねが]い', { v: 'give' }],
    ['verb', 'choudai', 'ちょうだい', { v: 'give' }], ['verb', 'kure', 'くれ', { v: 'give', tone: -1 }], ['verb', 'kure', 'くれよ', { v: 'give', tone: -1 }], ['verb', 'yokose', 'よこせ', { v: 'give', tone: -1 }],
    ['verb', 'hoshii', 'ほしい', { v: 'want' }], ['verb', 'hoshii', '[欲|ほ]しい', { v: 'want' }],
    ['verb', 'kau', '[買|か]います', { v: 'buy', tone: 1 }], ['verb', 'kau', '[買|か]う', { v: 'buy' }], ['verb', 'kaitai', '[買|か]いたい', { v: 'buy' }],
    ['verb', 'morau', 'もらえますか', { v: 'can', tone: 1, q: 1 }], ['verb', 'morau', 'もらえませんか', { v: 'can', tone: 1, q: 1 }], ['verb', 'morau', 'もらいます', { v: 'take', tone: 1 }],
    ['verb', 'itadaku', 'いただけますか', { v: 'can', tone: 1, q: 1 }], ['verb', 'itadaku', 'いただけませんか', { v: 'can', tone: 1, q: 1 }], ['verb', 'itadaku', 'いただきます', { v: 'take', tone: 1 }],
    ['verb', 'aru', 'ありますか', { v: 'have', tone: 1, q: 1 }], ['verb', 'aru', 'あります', { v: 'have', tone: 1 }], ['verb', 'aru', 'ある', { v: 'have' }],
    ['verb', 'suru', 'します', { v: 'pick', tone: 1 }], ['verb', 'suru', 'する', { v: 'pick' }],
    ['q', 'ikura', 'いくら'], ['q', 'oikura', 'おいくら'], ['q', 'nedan', '[値段|ねだん]'], ['q', 'ikutsu', 'いくつ'], ['q', 'nani', '[何|なに]'], ['q', 'nani', 'なに'], ['q', 'nani', '[何|なん]'],
    ['desu', 'desu', 'です'], ['desu', 'desuka', 'ですか'], ['desu', 'desuka', 'でしょうか'], ['ka', 'ka', 'か'], ['fill', 'da', 'だ'],
    ['pt', 'kore', 'これ'], ['pt', 'sore', 'それ'], ['pt', 'are', 'あれ'], ['det', 'kono', 'この'], ['det', 'sono', 'その'], ['det', 'ano', 'あの'],
    ['greet', 'konnichiwa', 'こんにちは'], ['greet', 'konnichiwa', 'こんにちわ'], ['greet', 'ohayo', 'おはよう'], ['greet', 'ohayo', 'おはよう ございます'], ['greet', 'konbanwa', 'こんばんは'], ['greet', 'konbanwa', 'こんばんわ'], ['greet', 'doumo', 'どうも'],
    ['sorry', 'sumimasen', 'すみません'], ['sorry', 'sumimasen', 'すいません'], ['sorry', 'gomen', 'ごめんなさい'], ['sorry', 'gomen', 'ごめん'],
    ['thanks', 'arigatou', 'ありがとう'], ['thanks', 'arigatou', 'ありがとう ございます'], ['thanks', 'arigatou', 'ありがとう ございました'], ['thanks', 'arigatou', 'どうも ありがとう'], ['thanks', 'arigatou', 'どうも ありがとう ございます'],
    ['bye', 'sayounara', 'さようなら'], ['bye', 'jaane', 'じゃあね'], ['bye', 'matane', 'またね'], ['bye', 'baibai', 'バイバイ'], ['bye', 'shitsurei', '[失礼|しつれい]します'], ['bye', 'mata', 'では また'], ['bye', 'mata', 'じゃあ また'],
    ['yes', 'hai', 'はい'], ['yes', 'un', 'うん'], ['yes', 'ee', 'ええ'],
    ['no', 'iie', 'いいえ'], ['no', 'iya', 'いや'], ['no', 'ii', 'いい です'], ['no', 'kekkou', 'けっこう です'], ['no', 'daijoubu', '[大丈夫|だいじょうぶ] です'], ['no', 'iranai', 'いらない'], ['no', 'iranai', 'いりません'],
    ['fill', 'jaa', 'じゃあ'], ['fill', 'jaa', 'じゃ'], ['fill', 'etto', 'えっと'], ['fill', 'etto', 'えーと'], ['fill', 'anou', 'あのう'], ['fill', 'ne', 'ね'], ['fill', 'yo', 'よ'],
    ['fill', 'chotto', 'ちょっと'], ['fill', 'mou', 'もう'], ['fill', 'zenbu', 'ぜんぶ'], ['fill', 'zenbu', '[全部|ぜんぶ]'], ['fill', 'sorekara', 'それから'], ['fill', 'ato', 'あと'],
    ['help', '', 'わからない'], ['help', '', 'わかりません'], ['help', '', '[分|わ]からない'], ['help', '', '[分|わ]かりません'], ['help', '', 'しらない'], ['help', '', 'たすけて'], ['help', '', 'ヘルプ'],
    ['name', '', 'ミモ'],
  ];
  const CJ_IDK = { zh: ['buzhidao', 'wobuzhidao', 'bangwo', 'bangbangwo'], ja: ['wakaranai', 'wakarimasen', 'shiranai', 'tasukete'] };
  // the keepers' dictionary, built once per language (again after SHOP.extend): every word as a pattern of units
  const CLX = {};
  function cjLex(l) {
    if (CLX[l]) return CLX[l];
    const E = [];
    const add = (cat, key, src, x) => { const e = Object.assign({ cat, key, src }, x || {}); e.w = CJK.wordOf(src, l); if (l === 'zh' ? e.w.syl.length : e.w.kana) E.push(e); };
    for (const it of ITEMS) {
      const x = LEX.item(it.id) || {}, g = CJ_GOODS[it.id] || {};
      new Set([x[l], ...((x.alt && x.alt[l]) || []), ...(g[l] || [])].filter(Boolean)).forEach(w => add('noun', it.id, w));
    }
    if (l === 'zh') {
      for (let n = 1; n <= 99; n++) add('num', String(n), zhNumSrc(n, false), n === 2 ? { n, er: 1 } : { n });
      add('num', 'liang', '[两|liǎng]', { n: 2 });
      for (const c of Object.keys(CL_PY)) add('cl', c, clSrc(c));
      ZH_WORDS.forEach(([cat, key, src, x]) => add(cat, key, src, x));
    } else {
      for (let n = 1; n <= 10; n++) add('count', 'つ' + n, JA_TSU_SRC[n], { n, ctr: 'つ' });
      for (const c of Object.keys(JA_CTR)) for (let n = 1; n <= 20; n++) {
        const { ok, bad } = jaCountKana(n, c), right = `[${jaNumKanji(n)}${c}|${ok[0]}]`;
        ok.forEach(k => add('count', c + n, `[${jaNumKanji(n)}${c}|${k}]`, { n, ctr: c }));
        bad.forEach(k => add('count', c + n, k, { n, ctr: c, bad: 'sound', fix: right }));
      }
      for (let n = 1; n <= 20; n++) add('num', String(n), `[${jaNumKanji(n)}|${jaNumKana(n)}]`, { n, kanjiOnly: n === 2 });     // (に is a particle)
      for (const c of ['つ'].concat(Object.keys(JA_CTR))) add('ctr', c, c === 'つ' ? 'つ' : `[${c}|${JA_CTR[c].k}]`, { ctr: c });   // after digits: 2つ, 3個
      JA_WORDS.forEach(([cat, key, src, x]) => add(cat, key, src, x));
    }
    const C = (CLX[l] = { l, E, bySyl: new Map(), byCh: new Map(), byKana: new Map() });
    const put = (M, k, e) => { if (!k) return; let a = M.get(k); if (!a) M.set(k, a = []); a.push(e); };
    for (const e of E) {
      if (l === 'zh') { put(C.bySyl, e.w.syl[0], e); put(C.byCh, e.w.ch[0], e); continue; }
      put(C.byKana, CJK.looseK([...e.w.kana][0] || ''), e);
      if (e.w.segs[0]) put(C.byCh, [...e.w.segs[0].s][0], e);
    }
    CJK.addSource(E.map(e => e.src), l);          // (the IME offers them, and canon reads them)
    return C;
  }
  // the cheapest cover of what you typed by the keepers' words: a word costs 1 (one that only sounds the same a little
  // more, a tone typed wrong a little more), an unknown unit 8, and no word runs across a comma or a full stop
  function cjCover(C, text) {
    const l = C.l, { U, marks } = CJK.typed(text, l), n = U.length;
    const best = new Array(n + 1).fill(Infinity), back = new Array(n + 1).fill(null);
    best[0] = 0;
    const crosses = (i, j) => { for (let k = i + 1; k < j; k++) if (marks[k]) return true; return false; };
    // ja: a word typed in katakana is one word (バナナ is never バ + ナナ «seven»): a match may not start or end inside a run
    const kata = U.map(u => !!u.k && /[ァ-ヺー]/.test(u.raw || '')), rs = [], re = [];
    for (let i = 0; i < n; i++) rs[i] = kata[i] ? (i > 0 && kata[i - 1] && !marks[i] ? rs[i - 1] : i) : -1;
    for (let i = n - 1; i >= 0; i--) re[i] = kata[i] ? (i < n - 1 && kata[i + 1] && !marks[i + 1] ? re[i + 1] : i + 1) : -1;
    const cutsKana = (i, j) => l === 'ja' && ((kata[i] && rs[i] < i) || (kata[j - 1] && re[j - 1] > j));
    for (let i = 0; i < n; i++) {
      if (best[i] === Infinity) continue;
      const u = U[i];
      if (u.digit) {
        if (best[i] + 1 < best[i + 1]) { best[i + 1] = best[i] + 1; back[i + 1] = { i, cands: [{ e: { cat: 'num', key: 'digits', n: u.n, digits: 1, src: '' }, homo: false, toneBad: false }] }; }
        continue;
      }
      const pool = l === 'zh' ? [].concat(C.bySyl.get(u.syl) || [], u.han ? C.byCh.get(u.ch) || [] : []) : u.han ? C.byCh.get(u.ch) || [] : u.k ? C.byKana.get(CJK.looseK(u.k)) || [] : [];
      const spans = new Map();
      for (const e of new Set(pool)) {
        const m = CJK.matchAt(e.w, U, i, l, { homo: true });
        if (!m || m.j <= i || crosses(i, m.j) || (e.kanjiOnly && m.kana) || cutsKana(i, m.j)) continue;
        let a = spans.get(m.j); if (!a) spans.set(m.j, a = []);
        a.push(Object.assign({ e }, m));
      }
      for (const [j, list] of spans) {
        const good = list.filter(x => !x.homo), seen = new Set();
        // (the right tone first, then a word spelled out in full: «to» is と before it's とお)
        const use = (good.length ? good : list).sort((a, b) => (a.toneBad - b.toneBad) || (!!a.short - !!b.short)).filter(x => { const k = x.e.cat + ':' + x.e.key; if (seen.has(k)) return false; seen.add(k); return true; });
        const cost = best[i] + 1 + (good.length ? 0 : 0.35) + (use[0].toneBad || use[0].short ? 0.2 : 0);
        if (cost < best[j]) { best[j] = cost; back[j] = { i, cands: use }; }
      }
      if (best[i] + 8 < best[i + 1]) { best[i + 1] = best[i] + 8; back[i + 1] = { i, cands: [], unk: true }; }
    }
    const out = [];
    for (let j = n; j > 0; j = back[j].i) out.unshift(Object.assign({ j }, back[j]));
    const merged = [];
    for (const p of out) { const q = merged[merged.length - 1]; if (p.unk && q && q.unk && !marks[p.i]) { q.j = p.j; continue; } merged.push(p); }
    if (l === 'ja') absorbKana(merged, U, marks);
    for (const p of merged) p.raw = U.slice(p.i, p.j).map(u => u.raw).join(l === 'zh' && !U[p.i].han ? ' ' : '');
    return { pieces: merged, U, marks };
  }
  // ja: a word the keeper doesn't know stays whole. A one-kana particle or counter, or a number in kana, found inside it
  // goes back into it: みかん is not み + か (the question particle) + ん, いちご is not いち + ご, すいか を is not すい + か を
  function absorbKana(P, U, marks) {
    const mk = p => !!p && !!marks[p.i], unk = p => !!p && !!p.unk;
    const cat = (p, c) => !!p && !p.unk && p.cands.length > 0 && c.includes(p.cands[0].e.cat);     // (its likeliest reading: と before とお)
    const weakP = p => cat(p, ['p', 'ka', 'ctr']) && p.j - p.i === 1;
    const weakN = p => cat(p, ['num']) && p.cands.every(x => !x.e.digits) && U.slice(p.i, p.j).every(u => !u.han);
    for (let again = true, guard = 0; again && guard < 50; guard++) {
      again = false;
      for (let k = 0; k < P.length; k++) {
        const p = P[k], prev = P[k - 1], next = P[k + 1];
        if (!weakP(p) && !weakN(p)) continue;
        const leftU = unk(prev) && !mk(p), rightU = unk(next) && !mk(next);
        const edgeL = !prev || mk(p) || cat(prev, ['p']), edgeR = !next || mk(next) || cat(next, ['p']);
        const glue = weakN(p) ? leftU || rightU || (weakN(next) && !mk(next))
          : (leftU && (rightU || edgeR || weakP(next))) || (rightU && edgeL);
        if (!glue) continue;
        if (leftU) { prev.j = p.j; P.splice(k, 1); k--; }
        else if (rightU) { next.i = p.i; P.splice(k, 1); k--; }
        else Object.assign(p, { unk: true, cands: [] });              // (いち + ご: the next round joins them)
        again = true;
      }
      for (let k = 1; k < P.length; k++) if (P[k].unk && P[k - 1].unk && !marks[P[k].i]) { P[k - 1].j = P[k].j; P.splice(k, 1); k--; again = true; }
    }
  }
  // which meaning a word has here (十 / 是 «shi», 只 / 支 «zhī», 盒 / 和 «hé», 买 mǎi / 卖 mài, この / あのう…)
  function cjPick(W, l, ctx) {
    const anyOf = (x, cat, key) => !!x && x.cands.some(y => y.e.cat === cat && (key === undefined || y.e.key === key));
    W.forEach((w, k) => {
      w.e = null;
      if (w.unk || !w.cands.length) return;
      const prev = W[k - 1], next = W[k + 1], has = cat => w.cands.find(x => x.e.cat === cat), nx = cat => anyOf(next, cat);
      const afterCount = !!(prev && prev.e && ['num', 'det'].includes(prev.e.cat));
      let c = w.cands[0];
      const noun = has('noun');
      if (noun && !(noun.toneBad && w.cands.some(x => !x.toneBad))) c = noun;
      else if (l === 'ja' && has('ctr')) c = prev && prev.e && prev.e.digits ? has('ctr') : w.cands.find(x => x.e.cat !== 'ctr') || c;    // (杯 はい: only after digits)
      else if (l === 'zh') {
        const cls = w.cands.filter(x => x.e.cat === 'cl'), others = w.cands.filter(x => x.e.cat !== 'cl' && x.e.cat !== 'num');
        if (has('num') && (others.length || cls.length)) c = nx('cl') || nx('noun') || nx('de') ? has('num') : others[0] || cls[0];
        else if (cls.length && (others.length || cls.length > 1)) {
          const nn = W.slice(k + 1, k + 4).map(x => x.cands.find(y => y.e.cat === 'noun')).find(Boolean), fits = nn ? clsOf(nn.e.key) : ctx.focus ? clsOf(ctx.focus) : ['个'];
          const bestCl = cls.slice().sort((a, b) => (fits.includes(b.e.key) - fits.includes(a.e.key)) || (a.toneBad - b.toneBad))[0];
          c = !others.length || afterCount ? bestCl : others[0];
        } else if (w.cands.filter(x => x.e.cat === 'verb').length > 1) {      // 买 mǎi / 卖 mài: the tone decides; without one, you buy
          const vs = w.cands.filter(x => x.e.cat === 'verb'), right = vs.filter(x => !x.toneBad);
          const askSell = W.some(x => anyOf(x, 'pron', 'ni') || anyOf(x, 'pron', 'nin')) && W.some(x => anyOf(x, 'ma'));
          c = right.length === 1 ? right[0] : (right.length ? right : vs).find(x => x.e.key === (askSell ? 'sell' : 'mai')) || vs[0];
        }
      }
      Object.assign(w, { e: c.e, homo: !!c.homo, toneBad: !!c.toneBad });
    });
    // ja: digits and a counter are one count («2つ», «3個»)
    for (let k = 0; k < W.length - 1; k++) {
      const w = W[k], nx = W[k + 1];
      if (l === 'ja' && w.e && w.e.digits && nx.e && nx.e.cat === 'ctr') { w.e = { cat: 'count', key: 'digits', n: w.e.n, ctr: nx.e.ctr, digits: 1, src: '' }; w.raw += nx.raw; W.splice(k + 1, 1); }
    }
  }

  // ---------------------------------------------------------------- zh: the grammar of an order
  function itemZh(np, id, r, isPrice) {
    const num = np.num && np.num.e, cl = np.cl && np.cl.e, fits = clsOf(id);
    const it = { id, n: null, errs: [], det: np.det ? np.det.e.key : null, cl: null, digits: !!(num && num.digits), bare: !num && !cl && !np.det };
    it.n = num ? num.n : np.det ? (np.det.e.pl ? null : 1) : isPrice ? null : cl || MASS.has(id) ? 1 : null;
    const E = (kind, tok, x) => it.errs.push(addErr(r, kind, tok, '', Object.assign({ id }, x)));
    if (num && !cl) E('measure', np.num, { missing: 1 });
    if (cl) {
      if (fits.includes(cl.key)) it.cl = cl.key;
      else if (cl.key === '个') r.soft.push({ kind: 'ge', id, it });
      else E('measure', np.cl, { wrong: cl.key });
    }
    if (num && num.er && cl) E('liang', np.num);
    if (np.de && (num || cl)) E('de', np.de);
    if (np.post) r.soft.push({ kind: 'order', id, it });
    return it;
  }
  function gramZh(W, r, ctx) {
    const T = cat => W.filter(w => w.e && w.e.cat === cat), K = (cat, key) => W.some(w => w.e && w.e.cat === cat && (key === undefined || w.e.key === key));
    const at = w => W.indexOf(w), verbs = T('verb');
    r.greet = T('greet').length ? T('greet')[0].e.key : null;
    if (K('ma') || K('verb', 'youmeiyou')) r.question = true;
    const isPrice = K('q', 'price') || (K('q', 'howmuch') && !verbs.length);
    // the things: [这 / 那] [number] [measure word] [的] thing; a count with no thing of its own points (这个) or answers (两个)
    const nps = [], loose = [];
    let cur = null;
    const flush = () => { if (cur && (cur.num || cur.cl || cur.det || cur.some)) loose.push(cur); cur = null; };
    W.forEach((w, k) => {
      const e = w.e;
      if (!e) { if (w.unk) flush(); return; }
      switch (e.cat) {
        case 'det': flush(); cur = { det: w, start: k }; break;
        case 'some': if (cur && (cur.num || cur.cl)) flush(); cur = Object.assign(cur || { start: k }, { some: w }); break;
        case 'num': if (cur && (cur.num || cur.cl || cur.some)) flush(); cur = Object.assign(cur || { start: k }, { num: w }); break;
        case 'cl': if (cur && cur.cl) flush(); cur = Object.assign(cur || { start: k }, { cl: w }); break;
        case 'de': if (cur && (cur.num || cur.cl)) cur.de = w; else flush(); break;
        case 'noun': nps.push(Object.assign(cur || { start: k }, { noun: w, end: k })); cur = null; break;
        default: flush();
      }
    });
    flush();
    // a count right after its thing: «苹果两个» (the number usually comes first), «苹果多少钱一个» (the price of one)
    for (const lc of loose.slice()) {
      if (lc.det || lc.some || !(lc.num || lc.cl)) continue;
      const np = nps.filter(p => p.end < lc.start).pop();
      if (!np || np.num || np.cl || np.det) continue;
      if (!W.slice(np.end + 1, lc.start).every(x => (x.e ? x.e.cat === 'fill' || (isPrice && x.e.cat === 'q') : !x.unk))) continue;
      Object.assign(np, { num: lc.num, cl: lc.cl, de: lc.de, post: !isPrice });
      loose.splice(loose.indexOf(lc), 1);
    }
    if (K('help')) r.kind = 'help';
    else if (isPrice) r.kind = 'price';
    else if (K('no') && !verbs.length) r.kind = 'no';
    else if (nps.length || verbs.some(v => v.e.v !== 'can') || (verbs.length && loose.length)) r.kind = 'buy';
    else if (loose.length) r.kind = ctx.pending || loose.some(x => x.det) ? 'buy' : 'number';
    else if (K('bye')) r.kind = 'bye';
    else if (K('greet')) r.kind = 'greet';
    else if (K('thanks')) r.kind = 'thanks';
    else if (K('yes') || verbs.length) r.kind = 'yes';          // (可以 / 能 on their own: "sure")
    else if (K('no')) r.kind = 'no';
    else if (K('please') || K('sorry') || K('address')) r.kind = 'polite';
    if (r.kind === 'number') r.n = loose[0].num ? loose[0].num.e.n : 1;
    if (r.kind !== 'buy' && r.kind !== 'price') return;
    for (const np of nps) r.items.push(itemZh(np, np.noun.e.key, r, isPrice));
    if (!nps.length) {
      const lc = loose.find(x => x.det) || loose[0];
      if (lc && r.kind === 'buy' && ctx.pending && !lc.det) r.items.push(Object.assign(itemZh(lc, ctx.pending, r, false), { answer: 1 }));
      else if (lc && ctx.focus && (lc.det || lc.cl || r.kind === 'price')) r.items.push(Object.assign(itemZh(lc, ctx.focus, r, isPrice), { point: 1, bare: !lc.num }));
      else if (!lc && ctx.focus && isPrice) r.items.push({ id: ctx.focus, n: null, point: 1, errs: [], bare: true });
    }
    // who wants it (你要 = you want), 卖 mài (sell) for 买 mǎi (buy), 想 alone (to miss), the price word before the thing
    const pronBefore = v => { for (let k = at(v) - 1; k >= 0; k--) { const e = W[k].e; if (!e) continue; if (e.cat === 'pron') return W[k]; if (!['fill', 'please', 'address', 'greet', 'sorry', 'also', 'name'].includes(e.cat)) return null; } return null; };
    for (const v of verbs) {
      const p = pronBefore(v), you = !!p && (p.e.key === 'ni' || p.e.key === 'nin');
      if (you && ['want', 'buy', 'need'].includes(v.e.v) && !r.question) addErr(r, 'who', p, '');
      if (v.e.key === 'sell' && !(r.question && (you || !p))) addErr(r, 'verb', v, '', { sell: 1 });
      if (v.e.key === 'xiang' && !W.slice(at(v) + 1).some(x => x.e && x.e.cat === 'verb')) addErr(r, 'verb', v, '', { miss: 1 });
    }
    if (isPrice) {
      const q = W.find(w => w.e && w.e.cat === 'q' && ['price', 'howmuch'].includes(w.e.key));
      if (q && nps.length && nps.every(np => np.start > at(q))) addErr(r, 'order', q, '', { price: 1, id: nps[0].noun.e.key });
    }
    const please = K('please'), can = verbs.some(v => v.e.v === 'can');
    r.bossy = verbs.some(v => v.e.tone === -1) && !please && !can && !r.question;
    r.polite = please || K('thanks') || K('greet') || K('sorry') || K('address') || K('pron', 'nin') || verbs.some(v => v.e.tone === 1)
      || (r.question && verbs.some(v => ['have', 'can', 'sell'].includes(v.e.v)));
    Object.assign(r, { thanksTyped: K('thanks'), qingwen: K('please', 'qingwen'), sorry: K('sorry') });
    Object.defineProperty(r, 'verbs', { value: verbs });
  }
  function phraseZh(it) {
    const w = cjWord(it.id, 'zh'), cl = clSrc(it.cl || clOf(it.id)), det = it.det ? DET_ZH[it.det] + ' ' : '';
    if (it.answer) return `${it.n ? zhNumSrc(it.n, true) + ' ' : ''}${cl}`;
    if (it.point) return `${det || DET_ZH.zhe + ' '}${it.n && it.n > 1 ? zhNumSrc(it.n, true) + ' ' : ''}${cl}`;
    if (it.n === null) return det ? `${it.det === 'na' ? '[那些|nà xiē]' : '[这些|zhè xiē]'} ${w}` : w;
    if (it.bare && MASS.has(it.id)) return w;
    return `${det}${det && it.n === 1 ? '' : zhNumSrc(it.n, true) + ' '}${cl} ${w}`;
  }
  // the right sentence, keeping your verb when it was a good one (and 请问 / 谢谢 when there was nothing polite)
  function canonZh(r) {
    const its = r.items, list = its.map(it => it.phrase).reduce((a, p, i) => a + (i === 0 ? '' : i === its.length - 1 ? ' [和|hé] ' : ' 、 ') + p, '');
    const has = k => (r.verbs || []).some(v => v.e.key === k);
    let s;
    if (r.kind === 'price') s = `${its.length ? list : '[这|zhè] [个|gè]'} [多少|duō shao] [钱|qián] ？`;
    else if (!its.length) return '';
    else if (its[0].answer) s = `${list} 。`;
    else {
      const frame = has('neng') ? '[能|néng] [给|gěi] [我|wǒ] … [吗|ma] ？' : has('keyi') ? '[可以|kě yǐ] [给|gěi] [我|wǒ] … [吗|ma] ？'
        : has('xiang') && has('mai') ? '[我|wǒ] [想|xiǎng] [买|mǎi] … 。' : has('xiangyao') || has('xiang') ? '[我|wǒ] [想要|xiǎng yào] … 。'
          : has('youmeiyou') ? '[有没有|yǒu méi yǒu] … ？' : has('sell') && r.question ? '[你|nǐ] [卖|mài] … [吗|ma] ？' : has('you') ? '[有|yǒu] … [吗|ma] ？'
            : has('mai') || has('sell') ? '[我|wǒ] [买|mǎi] … 。' : has('lai') ? '[来|lái] … 。' : has('gei') || has('na') ? '[请|qǐng] [给|gěi] [我|wǒ] … 。'
              : has('xuyao') ? '[我|wǒ] [需要|xū yào] … 。' : '[我|wǒ] [要|yào] … 。';
      s = frame.replace('…', list);
    }
    const end = / ？$/.test(s) ? '？' : '。';
    let body = s.replace(/ [。？]$/, '');
    if (r.kind === 'buy' && (r.thanksTyped || (!r.polite && !/\[请\|/.test(body)))) body += ' ， [谢谢|xiè xie]';
    if (r.kind === 'price' && (r.qingwen || !r.polite)) body = '[请问|qǐng wèn] ， ' + body;
    const pre = [r.greet && GREET.zh[r.greet] ? GREET.zh[r.greet][0] : '', r.sorry ? '[不好意思|bù hǎo yì si] ，' : ''].filter(Boolean).join(' ');
    return (pre ? pre + ' ' : '') + body + ' ' + end;
  }

  // ---------------------------------------------------------------- ja: the grammar of an order
  function countCheck(c, cw, id, E, it) {
    if (c.cat === 'num') { E('counter', cw, { missing: 1 }); return; }           // «りんご を さん ください»: no counter
    it.ctr = c.ctr;
    if (c.ctr === 'つ' && c.n > 10) E('counter', cw, { tsu10: 1 });
    else if (!ctrsOf(id).includes(c.ctr)) E('counter', cw, { wrong: c.ctr });
    else if (c.bad === 'sound') E('sound', cw, { fixSrc: c.fix });
  }
  function itemJa(g, r, main, isPrice, ctx, W) {
    const id = g.noun ? g.noun.e.key : ctx.focus;
    if (!id) return null;
    const cw = g.count || g.pre, c = cw && cw.e;
    const it = { id, n: c ? c.n : isPrice ? null : g.point || g.det || MASS.has(id) ? 1 : null, errs: [], point: g.noun ? 0 : 1, pt: g.point ? g.point.e.key : null,
      det: g.det ? g.det.e.key : null, ctr: null, digits: !!(c && c.digits), bare: !c };
    const E = (kind, tok, x) => it.errs.push(addErr(r, kind, tok, '', Object.assign({ id }, x)));
    if (c) countCheck(c, cw, id, E, it);
    if (g.pre && !g.no) E('no', g.pre, { n: c.n, ctr: c.ctr || '' });
    if (g.kono) E('kono', g.det, { pt: g.det.e.key });
    const p = g.p && g.p.e.key;
    if (p === 'to' || p === 'ya') return it;                    // (joined to the next thing, which takes the particle)
    if (isPrice) { if (p === 'wo' || p === 'ga') E('wa', g.p); else if (!p) r.soft.push({ kind: 'waDrop', id, it }); }
    else if (main) {
      const v = main.e.v;
      if (['give', 'can', 'take', 'buy'].includes(v)) { if (['ga', 'wa', 'ni', 'de'].includes(p)) E('wo', g.p); else if (!p && W.indexOf(main) > g.end) r.soft.push({ kind: 'woDrop', id, it }); }
      else if (v === 'have' && p === 'wo') E('ga', g.p);
      else if (v === 'pick' && p !== 'ni') E('ni', g.p || g.noun || g.point);
    }
    return it;
  }
  function gramJa(W, r, ctx) {
    const T = cat => W.filter(w => w.e && w.e.cat === cat), K = (cat, key) => W.some(w => w.e && w.e.cat === cat && (key === undefined || w.e.key === key));
    const at = w => W.indexOf(w), verbs = T('verb');
    r.greet = T('greet').length ? T('greet')[0].e.key : null;
    if (K('ka') || K('desu', 'desuka') || verbs.some(v => v.e.q)) r.question = true;
    const isPrice = K('q', 'ikura') || K('q', 'oikura') || K('q', 'nedan');
    // the things: [この] thing [particle] [count], [count の] thing, これ [particle] [count]; a count on its own answers
    const items = [], loose = [];
    let pre = null;
    const drop = () => { if (pre && pre.count) loose.push(pre); pre = null; };
    W.forEach((w, k) => {
      const e = w.e;
      if (!e) { if (w.unk) drop(); return; }
      const last = items[items.length - 1];
      switch (e.cat) {
        case 'det': drop(); pre = { det: w, start: k }; break;
        case 'pt': drop(); items.push({ point: w, start: k, end: k }); break;
        case 'count': case 'num':
          if (last && !last.count && !last.pre && last.end === k - 1 && (!last.p || ['wo', 'ga', 'wa', 'mo'].includes(last.p.e.key))) { last.count = w; last.end = k; break; }
          drop(); pre = { count: w, start: k }; break;
        case 'p':
          if (e.key === 'no' && pre && pre.count && pre.start === k - 1) { pre.no = w; break; }
          if (last && last.end === k - 1 && (!last.p || (last.count && !last.p2))) { if (!last.p) last.p = w; else last.p2 = w; last.end = k; }
          break;
        case 'noun': {
          const it = { noun: w, det: pre && pre.det, pre: pre && pre.count, no: pre && pre.no, start: pre ? pre.start : k, end: k };
          if (!pre && last && last.point && !last.p && !last.count && last.end === k - 1) { items.pop(); Object.assign(it, { det: last.point, kono: 1, start: last.start }); }   // これ りんご
          items.push(it); pre = null; break;
        }
        default: drop();
      }
    });
    drop();
    if (K('help')) r.kind = 'help';
    else if (isPrice) r.kind = 'price';
    else if (K('no') && !verbs.length) r.kind = 'no';
    else if (items.length || verbs.length) r.kind = 'buy';
    else if (loose.length) r.kind = ctx.pending ? 'buy' : 'number';
    else if (K('bye')) r.kind = 'bye';
    else if (K('greet')) r.kind = 'greet';
    else if (K('thanks')) r.kind = 'thanks';
    else if (K('yes')) r.kind = 'yes';
    else if (K('no')) r.kind = 'no';
    else if (K('sorry')) r.kind = 'polite';
    if (r.kind === 'number') r.n = loose[0].count.e.n;
    if (r.kind !== 'buy' && r.kind !== 'price') return;
    const main = verbs[verbs.length - 1] || null;       // the verb at the end decides the particles
    items.forEach(g => { const it = itemJa(g, r, main, isPrice, ctx, W); if (it) r.items.push(it); });
    if (!items.length && loose.length) {
      const lc = loose[0], it = { id: ctx.pending || ctx.focus, n: lc.count.e.n, errs: [], ctr: null, digits: !!lc.count.e.digits };
      if (it.id) {
        countCheck(lc.count.e, lc.count, it.id, (kind, tok, x) => it.errs.push(addErr(r, kind, tok, '', Object.assign({ id: it.id }, x))), it);
        r.items.push(Object.assign(it, r.kind === 'buy' && ctx.pending ? { answer: 1 } : { point: 1, pt: 'kore' }));
      }
    } else if (!items.length && ctx.focus && isPrice) r.items.push({ id: ctx.focus, n: null, point: 1, pt: 'kore', errs: [], bare: true });
    // the verb comes last
    if (r.kind === 'buy' && main && W.slice(at(main) + 1).some(x => x.e && ['noun', 'count', 'num', 'pt'].includes(x.e.cat))) addErr(r, 'order', main, '', { id: r.items.length ? r.items[0].id : null });
    r.bossy = verbs.some(v => v.e.tone === -1);
    r.polite = verbs.some(v => v.e.tone === 1) || K('desu') || K('sorry') || K('thanks') || K('greet') || K('q', 'oikura');
    r.sorry = K('sorry');
    Object.defineProperty(r, 'verbs', { value: verbs });
    Object.defineProperty(r, 'mainVerb', { value: main });
  }
  function phraseJa(it, kind) {
    const word = it.point ? PT_JA[it.pt] || 'これ' : (it.det ? DET_JA[it.det] + ' ' : '') + cjWord(it.id, 'ja');
    const ctr = it.ctr && ctrsOf(it.id).includes(it.ctr) && !(it.ctr === 'つ' && it.n > 10) ? it.ctr : ctrOf(it.id, it.n || 1);
    const cnt = it.n ? jaCountSrc(it.n, ctr) : '';
    it.word = word;
    if (it.answer) return cnt;
    if (kind === 'price') return it.n > 1 ? `${word} ${cnt} で` : `${word} は`;
    return cnt && !it.bare ? `${word} を ${cnt}` : `${word} を`;
  }
  const JA_POLITE_V = { onegai: 'お[願|ねが]いします', itadaku: 'いただけます か', morau: 'もらえます か', kudasai: 'ください' };
  function canonJa(r) {
    const its = r.items, main = r.mainVerb && r.mainVerb.e;
    let s;
    if (r.kind === 'price') s = !its.length ? 'これ は いくら です か ？' : its.length > 1 ? `${its.map(it => it.word).join(' と ')} は いくら です か ？` : `${its[0].phrase} いくら です か ？`;
    else if (!its.length) return '';
    else if (its[0].answer) s = `${its[0].phrase} ください 。`;
    else if (main && main.v === 'have') s = `${its.map(it => it.word).join(' と ')} は あります か ？`;
    else if (main && main.v === 'pick') s = `${its.map(it => it.word).join(' と ')} に します 。`;
    else { const v = (main && main.tone === 1 && JA_POLITE_V[main.key]) || 'ください'; s = `${its.map(it => it.phrase).join(' と 、 ')} ${v} ${/か$/.test(v) ? '？' : '。'}`; }
    const pre = [r.greet && GREET.ja[r.greet] ? GREET.ja[r.greet][0] : '', r.sorry ? 'すみません 、' : ''].filter(Boolean).join(' ');
    return (pre ? pre + ' ' : '') + s;
  }

  // ---------------------------------------------------------------- reading an order, the notes, the grade
  // Notes keep their zh / ja as the notation between two private marks (Q), so the panel can show it with its readings
  // (cjRich) and the plain notes (r.notes, tests) show it in the mode (cjText); typed words stay as you typed them.
  const Q = src => '' + src + '';
  const cjText = (s, l) => String(s || '').replace(/([^]*)/g, (m, x) => '«' + CJK.plain(x, { lang: l, cap: false }) + '»');
  const cjRich = (s, l) => String(s || '').split(/([^]*)/).map(p => (p[0] === '' ? '«' + CJK.html(p.slice(1, -1), { lang: l, cap: false }) + '»' : esc(p))).join('');
  function parseCJ(text, lang, stallId, ctx = {}) {
    const r = { text: String(text == null ? '' : text), lang, stall: stallId || null, kind: 'unknown', items: [], errors: [], soft: [], notes: [],
      polite: false, bossy: false, question: false, greet: null, unknown: [], words: [], grade: null, reason: '', canon: '', why: '' };
    let raw = r.text.trim();
    if (!raw) { r.kind = 'empty'; return r; }
    if (saysHelp(raw) || CJ_IDK[lang].includes(CJK.canon(raw, lang))) { r.kind = 'help'; return r; }
    r.question = /[?？]/.test(raw);
    for (const nm of ctx.names || []) if (nm && String(nm).length > 1) raw = raw.replace(new RegExp(String(nm).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), ' ');
    const W = cjCover(cjLex(lang), raw).pieces.map(p => ({ raw: p.raw, unk: !!p.unk, cands: p.cands || [], e: null, homo: false, toneBad: false }));
    // English? (two or more English words, or one on its own that's no word the keeper knows)
    const lat = (raw.match(/[A-Za-z]+/g) || []).map(w => w.toLowerCase()), en = lat.filter(w => EN.has(w)).length;
    if (en && (en >= 2 ? en * 2 >= lat.length : lat.length === 1 && !W.some(w => !w.unk && w.cands.some(x => !['fill', 'name'].includes(x.e.cat))))) { r.kind = 'english'; return r; }
    cjPick(W, lang, ctx);
    // a character that only sounds the same (a spelling slip), a tone typed wrong (an A), what the keeper didn't know
    for (const w of W) {
      if (w.unk) { const t = w.raw.trim(); if (t) r.unknown.push(t); continue; }
      if (!w.e) continue;
      if (w.homo) addErr(r, 'spelling', w, '', { fixSrc: w.e.src });
      else if (w.toneBad) r.soft.push({ kind: 'tone', src: w.e.src });
    }
    (lang === 'zh' ? gramZh : gramJa)(W, r, ctx);
    if (r.kind !== 'buy' && r.kind !== 'price') { r.errors = []; r.soft = []; return r; }
    const dIt = r.items.find(it => it.digits);
    if (dIt) r.soft.push({ kind: 'digits', it: dIt });
    if (r.unknown.length) r.soft.push({ kind: 'extra', words: r.unknown });
    if (!r.polite) r.soft.push({ kind: 'polite', price: r.kind === 'price' });
    // the words you used, for LEX (the things, and numbers said as words)
    for (const w of W) {
      if (!w.e) continue;
      if (w.e.cat === 'noun') r.words.push({ id: w.e.key, ok: !w.homo, len: w.raw.length });
      else if ((w.e.cat === 'num' || w.e.cat === 'count') && !w.e.digits && w.e.n >= 1 && w.e.n <= 20 && LEX.item('n.' + w.e.n)) r.words.push({ id: 'n.' + w.e.n, ok: !w.homo, len: w.raw.length });
    }
    r.items.forEach(it => { it.phrase = lang === 'zh' ? phraseZh(it) : phraseJa(it, r.kind); it.errs.forEach(e => { e.phrase = it.phrase; }); });
    gradeOf(r, lang);
    r.canonSrc = lang === 'zh' ? canonZh(r) : canonJa(r);
    r.canon = r.canonSrc ? CJK.plain(r.canonSrc, { lang }) : '';
    Object.assign(r, { reasonSrc: r.reason, notesSrc: r.notes.slice(), whySrc: r.why });
    r.reason = cjText(r.reason, lang); r.notes = r.notes.map(n => cjText(n, lang)); r.why = cjText(r.why, lang);
    r.usedSrc = W.filter(w => w.e && !w.homo && w.e.src).map(w => w.e.src).join(' ');
    return r;
  }
  function noteCJ(x, l) {
    const ph = x.phrase || (x.it && x.it.phrase) || '', zh = l === 'zh', word = x.id ? cjWord(x.id, l) : '';
    switch (x.kind) {
      case 'spelling': return `Character: ${Q(x.fixSrc || '')}, not «${x.typed}»`;
      case 'tone': return `Tone: ${Q(x.src)}` + (CJK.mode(l) === 'chars' ? ` (${CJK.roman(x.src, { lang: l, cap: false })})` : '');
      case 'measure': return x.missing ? `A number needs a measure word: ${Q(ph)}` : `${Q(clSrc(x.wrong))} is for ${CL_EN[x.wrong] || 'other things'}. ${Q(word)}: ${Q(ph)}`;
      case 'liang': return `Before a measure word, 2 is ${Q('[两|liǎng]')}: ${Q(ph)}`;
      case 'de': return `No ${Q('[的|de]')} after a count: ${Q(ph)}`;
      case 'ge': return `${Q('[个|gè]')} works, but ${Q(word)} has its own measure word: ${Q(ph)}`;
      case 'who': return `${Q('[你|nǐ]')} means you. Asking for yourself: ${Q('[我|wǒ] [要|yào] …')}`;
      case 'verb': return x.sell ? `${Q('[卖|mài]')} is to sell. To buy: ${Q('[买|mǎi]')}` : `${Q('[想|xiǎng]')} alone means “to miss”. To ask: ${Q('[我|wǒ] [想要|xiǎng yào] …')}`;
      case 'order':
        if (zh) return x.price ? `The thing comes first, then the price: ${Q(`${word} [多少|duō shao] [钱|qián] ？`)}` : `The number usually comes first: ${Q(ph)}`;
        return `The verb comes last: ${Q(`${word || 'りんご'} を … ください`)}`;
      case 'wo': return `With ${Q('ください')}, the thing takes ${Q('を')}: ${Q(ph + ' ください')}`;
      case 'wa': return `Asking about a thing, it takes ${Q('は')}: ${Q(`${word} は いくら です か`)}`;
      case 'ga': return `${Q('あります')} takes ${Q('が')} or ${Q('は')}: ${Q(`${word} は あります か`)}`;
      case 'ni': return `${Q('します')} (I’ll go with…) takes ${Q('に')}: ${Q(`${word} に します`)}`;
      case 'counter':
        if (x.tsu10) return `${Q('つ')} counts up to ten (${Q('[十|とお]')}). Above that: ${Q(ph)}`;
        if (x.wrong) return `${Q(x.wrong === 'つ' ? 'つ' : `[${x.wrong}|${JA_CTR[x.wrong].k}]`)} is for ${CTR_EN[x.wrong] || 'other things'}: ${Q(ph)}`;
        return `Count with a counter: ${Q(ph)}`;
      case 'sound': return `Sound change: ${Q(x.fixSrc)}, not «${x.typed}»`;
      case 'no': return `A count before the thing takes ${Q('の')}: ${Q(`${jaCountSrc(x.n, x.ctr && x.ctr !== 'つ' ? x.ctr : 'つ')} の ${word}`)}, or ${Q(`${word} を ${jaCountSrc(x.n, x.ctr || 'つ')}`)}`;
      case 'kono': return `Before a thing, ${Q(PT_JA[x.pt] || 'これ')} → ${Q(DET_JA[x.pt] || 'この')}: ${Q(`${DET_JA[x.pt] || 'この'} ${word}`)}`;
      case 'woDrop': return `${Q('を')} was left out (fine with friends): ${Q(ph)}`;
      case 'waDrop': return `The thing you ask about takes ${Q('は')}: ${Q(`${x.it && x.it.word ? x.it.word : word} は いくら です か`)}`;
      case 'digits': { const it = x.it || {}; return `Say the number as a word for an S: ${Q(zh ? cjCount(it.n, 'zh', it.cl || clOf(it.id)) : jaCountSrc(it.n, it.ctr && ctrsOf(it.id).includes(it.ctr) ? it.ctr : ctrOf(it.id, it.n)))}`; }
      case 'polite': return zh ? (x.price ? `Start with ${Q('[请问|qǐng wèn]')} for an S` : `Add ${Q('[请|qǐng]')} or ${Q('[谢谢|xiè xie]')} for an S (and a discount!)`)
        : (x.price ? `End it with ${Q('です か')} for an S: ${Q('いくら です か')}` : `Ask with ${Q('ください')} for an S (and a discount!)`);
      case 'extra': {          // (ja in rōmaji mode: a word typed in rōmaji, shown that way, not as the kana it turned into)
        const roman = !zh && CJK.mode(l) === 'roman', show = w => (roman && /^[ぁ-ゖァ-ヺー]+$/.test(w) ? CJK.romaji(w) : w);
        return `Skipped: «${x.words.map(show).join(' ')}»`;
      }
    }
    return x.kind;
  }
  const bossyCJ = (r, l) => (l === 'zh' ? `${Q('[给|gěi] [我|wǒ] …')} on its own is an order. Try ${Q('[请|qǐng] [给|gěi] [我|wǒ] …')} or ${Q('[我|wǒ] [要|yào] …')}`
    : `${Q(/よこせ|yokose/i.test(r.text) ? 'よこせ' : 'くれ')} is bossy with a shopkeeper. Try ${Q('〜 を ください')}`);
  const whyMark = T => Object.fromEntries(Object.entries(T).map(([k, s]) => [k, s.replace(/«([^»]*)»/g, (m, x) => Q(x))]));
  WHY.zh = whyMark({
    measure: 'Measure words: Chinese puts one between a number (or 这 / 那) and the thing: «[两|liǎng] [个|gè] [苹果|píng guǒ]», «[一|yī] [罐|guàn] [蜂蜜|fēng mì]», «[这|zhè] [顶|dǐng] [帽子|mào zi]». «[个|gè]» is the everyday one; some things have their own: «[块|kuài]» pieces, «[罐|guàn]» jars, «[瓶|píng]» bottles, «[顶|dǐng]» hats, «[份|fèn]» newspapers.',
    liang: 'Two: counting things, 2 is «[两|liǎng]»: «[两|liǎng] [个|gè] [苹果|píng guǒ]». «[二|èr]» is for counting out loud and inside bigger numbers: «[十二|shí èr]», «[二十|èr shí]».',
    de: '«[的|de]» joins a description to a thing («[红色|hóng sè] [的|de] [苹果|píng guǒ]»), but never comes between a count and the thing: «[两|liǎng] [个|gè] [苹果|píng guǒ]».',
    order: 'Say the thing first, then ask the price: «[苹果|píng guǒ] [多少|duō shao] [钱|qián] ？». The count comes before the thing: «[两|liǎng] [个|gè] [苹果|píng guǒ]» («[苹果|píng guǒ] [两|liǎng] [个|gè]» is what people say in a hurry).',
    who: '«[我|wǒ] [要|yào] …» is “I want…”. «[你|nǐ] [要|yào] …» is “you want…”, which is what the keeper asks you!',
    verb: 'Tones make words: «[买|mǎi]» (third tone) is to buy, «[卖|mài]» (fourth tone) is to sell. And «[想|xiǎng]» alone means “to miss / to think”: «[我|wǒ] [想要|xiǎng yào] …» is “I’d like…”.',
    spelling: 'Characters: that one sounds the same but means something else. In the IME list, pick the one with the right meaning.',
    tone: 'Tones: the marks over pinyin (ā á ǎ à) are part of the word. You can leave them out, but a wrong one is another sound, and sometimes another word (mǎi buy, mài sell).',
    ge: '«[个|gè]» works for almost anything, but some things have their own measure word: «[一|yī] [顶|dǐng] [帽子|mào zi]», «[一|yī] [罐|guàn] [蜂蜜|fēng mì]», «[一|yī] [块|kuài] [奶酪|nǎi lào]», «[一|yī] [份|fèn] [报纸|bào zhǐ]».',
    digits: 'The numbers are words to learn too: write «[两|liǎng]» (not the digit 2) for an S.',
    polite: 'Add «[请|qǐng]» (please) or «[谢谢|xiè xie]» (thanks), greet with «[你好|nǐ hǎo]», or ask with «[请问|qǐng wèn]» (may I ask…). Calling the keeper «[老板|lǎo bǎn]» (boss) is friendly too. A polite S gets you a discount!',
    bossy: '«[给|gěi] [我|wǒ] …» on its own is an order, the way you’d talk to a little brother. Put «[请|qǐng]» in front («[请|qǐng] [给|gěi] [我|wǒ] …»), or say «[我|wǒ] [要|yào] …».',
    extra: 'The keeper skipped a word it didn’t need (or didn’t know). Keep it simple: how many, the measure word, what.',
  });
  WHY.ja = whyMark({
    wo: '«を» marks the thing you want: «りんご を ください». With «が» or «は» it would be the one doing something.',
    wa: 'Asking about a thing makes it the topic, with «は»: «りんご は いくら です か ？».',
    ga: '«あります» (there is) takes «が» or «は»: «りんご は あります か ？», «りんご が あります か ？».',
    ni: '«〜 に します» is “I’ll go with…”: «りんご に します».',
    counter: 'Japanese counts with a counter after the number: «[一|ひと]つ», «[二|ふた]つ» … «[十|とお]» for anything up to ten, «[個|こ]» («[十一個|じゅういっこ]») above that. Some things have their own: flat things «[枚|まい]», bottles and bars «[本|ほん]», newspapers «[部|ぶ]».',
    sound: 'Sound changes: some numbers and counters run together: «[一個|いっこ]», «[六個|ろっこ]», «[十個|じゅっこ]», «[一本|いっぽん]», «[三本|さんぼん]». «いちこ» sounds off to a Japanese ear.',
    no: 'A count before the thing joins it with «の»: «[二|ふた]つ の りんご». The usual way is the thing, «を», then the count: «りんご を [二|ふた]つ ください».',
    kono: '«これ / それ / あれ» stand on their own (“this one”). Before a thing, say «この / その / あの»: «この りんご».',
    order: 'In Japanese the verb comes last: «りんご を [二|ふた]つ ください».',
    woDrop: 'Dropping «を» is fine with friends («りんご [二|ふた]つ ください»), but the full form is «りんご を [二|ふた]つ ください».',
    waDrop: 'In a full question the thing takes «は»: «りんご は いくら です か ？».',
    digits: 'The numbers are words to learn too: say «[二|ふた]つ» (not the digit 2) for an S.',
    polite: 'Ask with «ください» or «お[願|ねが]いします», end a question with «です か», or start with «すみません». A polite S gets you a discount!',
    bossy: '«くれ» and «よこせ» are how you’d boss a little brother around. To a shopkeeper: «〜 を ください».',
    extra: 'The keeper skipped a word it didn’t need (or didn’t know). Keep it simple: the thing, «を», the count, «ください».',
  });
  // a help model: ask the price first, then buy (always a polite S); text: in the mode, src: the notation, type: what to type
  function modelCJ(id, l, o = {}) {
    const zh = l === 'zh', w = cjWord(id, l), en = enNoun(id, false);
    let src, enT, ids, kind;
    if (!o.known) {
      src = zh ? `[请问|qǐng wèn] ， ${w} [多少|duō shao] [钱|qián] ？` : `すみません 、 ${w} は いくら です か ？`;
      enT = `Excuse me, how much ${PRICE_PL.has(id) ? 'are the ' + enNoun(id, true) : 'is the ' + en}?`; ids = [id]; kind = 'price';
    } else {
      const n = !MASS.has(id) && id !== 'w.hat' && (o.coins === undefined || PRICE[id] * 2 <= o.coins) ? 2 : 1;
      src = zh ? `[请|qǐng] [给|gěi] [我|wǒ] ${cjQty(n, id, 'zh')} 。` : `${w} を ${jaCountSrc(n, ctrOf(id, n))} ください 。`;
      const what = n === 1 ? (MASS.has(id) ? 'some ' + en : (/^[aeiou]/.test(en) ? 'an ' : 'a ') + en) : 'two ' + enNoun(id, true);
      enT = zh ? `Please give me ${what}.` : `I’d like ${what}, please.`; ids = [id, 'n.' + n]; kind = 'buy';
    }
    return { text: CJK.plain(src, { lang: l }), src, type: CJK.mode(l) === 'chars' ? CJK.roman(src, { lang: l }) : CJK.plain(src, { lang: l }), en: enT, ids, kind };
  }

  // ---------------------------------------------------------------- what the keepers say in zh / ja
  // Lines are lists of notation strings and slots (their tl is the notation too); cjSrc joins them into one line, cjHTML
  // shows it with the slots highlighted. Slots: the thing (I), a count of it (qty: «两个苹果», «りんご ふたつ»), a number
  // with a measure word / counter (N), coins («四枚金币», «コイン 四枚»).
  function kitCJ(l) {
    const zh = l === 'zh';
    const I = (id, pl) => slot(id, cjWord(id, l), enNoun(id, pl));
    const N = (n, x) => slot('n.' + Math.min(20, Math.max(1, n)), cjCount(n, l, x), enNum(n), String(n));
    const C = pl => slot('w.coin', cjWord('w.coin', l), pl ? 'coins' : 'coin');
    const money = n => [slot('w.coin', cjMoney(n, l), `${enNum(n)} coin${n === 1 ? '' : 's'}`, `${n} coin${n === 1 ? '' : 's'}`)];
    const qty = (n, id) => [slot(id, cjQty(n, id, l), `${enNum(n)} ${enNoun(id, n !== 1)}`, `${n} ${enNoun(id, n !== 1)}`)];
    const join = (lists, and) => lists.reduce((a, x, i) => a.concat(i === 0 ? [] : [i === lists.length - 1 ? and : and === ' and ' ? ', ' : zh ? '、' : 'と'], x), []);
    const goods = (st, and) => { const ids = STALLS[st] || []; return ids.length ? join(ids.map(id => [I(id, !LIST_SG.has(id))]), and) : ['…']; };
    const list = (items, and) => join(items.map(it => qty(it.n, it.id)), and);
    const per = id => (zh ? `[一|yī] ${clSrc(clOf(id))}` : jaCountSrc(1, ctrOf(id, 1)));
    return { I, N, C, money, qty, qtyEN: qty, goods, def: (id, pl) => [I(id, pl)], list, join, per };
  }
  const cjPieces = toks => toks.map(t => (typeof t === 'string' ? { src: t.trim() } : { src: String(t.tl || '').trim(), slot: t })).filter(p => p.src);
  const cjSrc = toks => cjPieces(toks).map(p => p.src).join(' ');
  function cjHTML(toks, l) {
    const P = cjPieces(toks), full = P.map(p => p.src).join(' '), { m, U } = CJK.units(full, { lang: l });
    let k = 0;
    for (const p of P) { p.a = k; k += CJK.units(p.src, { lang: l, register: false, ruby: false }).U.length; p.b = k; }
    if (k !== U.length) return CJK.html(full, { lang: l });          // (never, but then without the highlights)
    let out = '', rubies = 0;
    for (const p of P) {
      let body = '';
      for (let i = p.a; i < p.b; i++) {
        const u = U[i];
        let t = esc(u.t);
        if (u.rt) { t = `<ruby>${t}<rt${u.fade ? ' class="cjk-fade"' : ''}>${esc(u.rt)}</rt></ruby>`; rubies++; }
        if (i === p.a) { if (u.sp) out += ' '; body += t; } else body += (u.sp ? ' ' : '') + t;
      }
      out += p.slot ? `<span class="w" data-en="${esc(p.slot.en)}">${body}</span>` : body;
    }
    return `<span class="cjk cjk-${l} cjk-${m}${rubies ? ' cjk-ruby' : ''}" lang="${CJK.tag(l, m)}">${out}</span>`;
  }
  const zhEach = (c, k) => [k.I(c.id, false), ...k.money(PRICE[c.id]), k.per(c.id), '。'];
  const jaEach = (c, k) => [k.I(c.id, false), 'は', k.per(c.id), ...k.money(PRICE[c.id]), 'です 。'];
  const enEach = (c, k) => [k.I(c.id, !MASS.has(c.id)), ': ', ...k.money(PRICE[c.id]), ' each.'];
  const CJ_LINES = {
    welcome: {
      zh: (c, k) => ['[欢迎|huān yíng] [光临|guāng lín] ！ [我|wǒ] [这里|zhè lǐ] [有|yǒu]', ...k.goods(c.stall, '[和|hé]'), '。 [您|nín] [要|yào] [什么|shén me] ？'],
      ja: (c, k) => ['いらっしゃいませ ！', ...k.goods(c.stall, 'と'), 'が あります よ 。 なに に します か ？'],
    },
    greetBack: { zh: c => [GREET.zh[c.key][0], '[您|nín] [要|yào] [什么|shén me] ？'], ja: c => [GREET.ja[c.key][0], 'いらっしゃいませ 。 なに に します か ？'] },
    sold: {
      zh: (c, k) => [c.mode === 'bossy' ? '[哦|ó] … [好|hǎo] [吧|ba] 。' : '[好|hǎo] [的|de] ！', ...k.list(c.items, '[和|hé]'),
        c.mode === 'discount' ? '。 [您|nín] [真|zhēn] [客气|kè qi] ！ [给|gěi] [您|nín] [便宜|pián yi] [一点|yī diǎn] ， [一共|yī gòng]' : '， [一共|yī gòng]', ...k.money(c.total), '。',
        c.hat ? '{mimo} [戴|dài] [上|shàng] [一定|yī dìng] [很|hěn] [好看|hǎo kàn] ！' : '', c.mode === 'bossy' ? '' : '[还|hái] [要|yào] [别的|bié de] [吗|ma] ？'],
      ja: (c, k) => [c.mode === 'bossy' ? '… はい 。' : 'はい 、', ...k.list(c.items, 'と'), c.mode === 'discount' ? 'です ね 。 ごていねい に どうも ！ おまけ して 、 ぜんぶ で' : 'です ね 。 ぜんぶ で',
        ...k.money(c.total), 'です 。', c.hat ? '{mimo} に よく [似合|にあ]います よ ！' : '', c.mode === 'bossy' ? '' : 'ほか に なに か あります か ？'],
    },
    price: { zh: zhEach, ja: jaEach, en_zh: enEach, en_ja: enEach },
    priceEach: { zh: zhEach, ja: jaEach, en_zh: enEach, en_ja: enEach },
    priceQty: {
      zh: (c, k) => [...k.qty(c.n, c.id), '[一共|yī gòng]', ...k.money(c.n * PRICE[c.id]), '。'],
      ja: (c, k) => [...k.qty(c.n, c.id), 'で', ...k.money(c.n * PRICE[c.id]), 'です 。'],
    },
    priceMany: {
      zh: (c, k) => c.items.reduce((a, it, i) => a.concat(i ? ['，'] : [], [k.I(it.id, false)], k.money(PRICE[it.id]), [k.per(it.id)]), []).concat(['。']),
      ja: (c, k) => c.items.reduce((a, it, i) => a.concat(i ? ['、'] : [], [k.I(it.id, false), 'は', k.per(it.id)], k.money(PRICE[it.id])), []).concat(['です 。']),
    },
    notHere: {
      zh: (c, k) => ['[不好意思|bù hǎo yì si] ， [我|wǒ] [这里|zhè lǐ] [没有|méi yǒu]', k.I(c.id, true), '。 [去|qù]', cjWhere(c.id, 'zh'), '[看看|kàn kan] [吧|ba] 。'],
      ja: (c, k) => ['すみません 、', k.I(c.id, true), 'は ここ に は ありません 。', cjWhere(c.id, 'ja'), 'に あります よ 。'],
    },
    broke: {
      zh: (c, k) => (c.coins > 0 ? ['[哎呀|āi yā] ， [一共|yī gòng]', ...k.money(c.total), '， [您|nín] [只有|zhǐ yǒu]', ...k.money(c.coins), '。 [少|shǎo] [买|mǎi] [一点|yī diǎn] [吧|ba] ？']
        : ['[哎呀|āi yā] ， [一共|yī gòng]', ...k.money(c.total), '， [可是|kě shì] [您|nín] [没有|méi yǒu]', k.C(true), '[了|le] 。']),
      ja: (c, k) => (c.coins > 0 ? ['あら 、 ぜんぶ で', ...k.money(c.total), 'です けど 、', ...k.money(c.coins), 'しか ありません ね 。 すこし へらします か ？']
        : ['あら 、 ぜんぶ で', ...k.money(c.total), 'です けど 、', k.C(true), 'が もう ありません ね 。']),
    },
    howMany: { zh: (c, k) => [k.I(c.id, true), '[要|yào] [几|jǐ]', clSrc(clOf(c.id)), '？'], ja: (c, k) => [k.I(c.id, true), 'は いくつ に します か ？'] },
    whatQty: { zh: (c, k) => [k.N(c.n, '个'), '[什么|shén me] ？'], ja: (c, k) => ['なに を', k.N(c.n), 'です か ？'] },
    which: {
      zh: (c, k) => ['[哪|nǎ] [个|gè] ？ [我|wǒ] [这里|zhè lǐ] [有|yǒu]', ...k.goods(c.stall, '[和|hé]'), '。'],
      ja: (c, k) => ['どれ です か ？', ...k.goods(c.stall, 'と'), 'が あります よ 。'],
    },
    whatWant: {
      zh: (c, k) => ['[您|nín] [要|yào] [什么|shén me] ？ [我|wǒ] [这里|zhè lǐ] [有|yǒu]', ...k.goods(c.stall, '[和|hé]'), '。'],
      ja: (c, k) => ['なに に します か ？', ...k.goods(c.stall, 'と'), 'が あります よ 。'],
    },
    noSuch: {
      zh: (c, k) => ['[不好意思|bù hǎo yì si] ， [这个|zhè ge] [我|wǒ] [没有|méi yǒu] 。 [我|wǒ] [这里|zhè lǐ] [有|yǒu]', ...k.goods(c.stall, '[和|hé]'), '。'],
      ja: (c, k) => ['すみません 、 それ は ありません 。', ...k.goods(c.stall, 'と'), 'なら あります よ 。'],
    },
    tooMany: { zh: (c, k) => ['[太|tài] [多|duō] [了|le] ！ [最多|zuì duō]', k.N(20, '个'), '。'], ja: (c, k) => ['えっ 、 それ は おおすぎます ！', k.N(20, '個'), 'まで です 。'] },
    huh: { zh: () => ['[不好意思|bù hǎo yì si] ， [我|wǒ] [没|méi] [听懂|tīng dǒng] 。'], ja: () => ['すみません 、 よく わかりません でした 。'] },
    english: { zh: () => ['[哎呀|āi yā] ， [我|wǒ] [不|bù] [会|huì] [说|shuō] [英语|yīng yǔ] …'], ja: () => ['えっと … [英語|えいご] は ちょっと …'] },
    thanks: { zh: () => ['[不客气|bù kè qi] ！ [欢迎|huān yíng] [再|zài] [来|lái] ！'], ja: () => ['こちら こそ 、 ありがとう ございます ！ また どうぞ ！'] },
    bye: { zh: () => ['[再见|zài jiàn] ！ [欢迎|huān yíng] [再|zài] [来|lái] ！'], ja: () => ['ありがとう ございました ！ また どうぞ ！'] },
    yes: { zh: () => ['[好|hǎo] ！ [您|nín] [要|yào] [什么|shén me] ？'], ja: () => ['はい ！ なに に します か ？'] },
    no: { zh: () => ['[好|hǎo] [的|de] 。 [需要|xū yào] [什么|shén me] [再|zài] [叫|jiào] [我|wǒ] 。'], ja: () => ['はい 、 また いつでも どうぞ 。'] },
  };
  for (const [key, T] of Object.entries(CJ_LINES)) Object.assign(LINES[key], T);

  // ================================================================ the panel
  const KNOWN = { es: new Set(), pt: new Set(), de: new Set(), zh: new Set(), ja: new Set() };     // prices you've asked (or paid), per language
  let V = null, els = null;                                          // the visit, and the panel's elements
  const CSS = `
#shop { position: fixed; inset: 0; z-index: 10; display: flex; align-items: flex-end; justify-content: center; padding: 16px 16px 20px; box-sizing: border-box; pointer-events: none;
  font-family: "Segoe UI", system-ui, sans-serif; color: #2b2235; }
#shop.sh-off { display: none; }
#shop *, #shop *::before, #shop *::after { box-sizing: border-box; }
#shop button { font: inherit; color: inherit; cursor: pointer; }
#shop .sh-card { pointer-events: auto; position: relative; width: min(800px, 100%); max-height: 100%; overflow-y: auto; background: #fffaf0; border: 3px solid #2b2235; border-radius: 20px;
  box-shadow: 0 0 0 6px #fff, 0 12px 0 5px rgba(43,34,53,.18); padding: 12px 16px 12px; display: flex; flex-direction: column; gap: 9px; }
#shop .sh-card.sh-shake { animation: sh-shake .35s; }
@keyframes sh-shake { 20% { transform: translateX(-9px); } 45% { transform: translateX(8px); } 70% { transform: translateX(-5px); } }
#shop .sh-head { display: flex; align-items: center; gap: 10px; }
#shop .sh-sicon { width: 44px; height: 44px; flex: none; }
#shop .sh-who { display: flex; flex-direction: column; min-width: 0; flex: 1; }
#shop .sh-who b { font: 800 21px/1.1 Bahnschrift, "Segoe UI", sans-serif; }
#shop .sh-who small { font-size: 12px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; opacity: .6; }
#shop .sh-purse { display: flex; align-items: center; gap: 6px; background: #fff; border: 2px solid rgba(43,34,53,.18); border-radius: 99px; padding: 2px 12px 2px 3px; }
#shop .sh-purse canvas { width: 30px; height: 30px; }
#shop .sh-purse b { font: 800 20px Bahnschrift, "Segoe UI", sans-serif; }
#shop .sh-purse span { font-size: 13px; font-weight: 700; opacity: .75; }
#shop .sh-say { position: relative; background: #fff; border-radius: 16px; padding: 9px 14px 10px; font-size: 19px; line-height: 1.4; border: 2px solid rgba(43,34,53,.14); box-shadow: 0 3px 0 rgba(43,34,53,.1); }
#shop .sh-say::before { content: ""; position: absolute; left: 22px; top: -12px; border: 11px solid transparent; border-top: 0; border-bottom-color: rgba(43,34,53,.14); }
#shop .sh-say::after { content: ""; position: absolute; left: 24px; top: -8px; border: 9px solid transparent; border-top: 0; border-bottom-color: #fff; }
#shop .sh-tools { float: right; display: flex; gap: 4px; margin: 3px 0 0 10px; }
#shop .sh-tools button { font-size: 11px; font-weight: 800; border: 1.5px solid #2b2235; border-radius: 8px; background: transparent; padding: 1px 6px; }
#shop .sh-en { font-size: 14px; font-style: italic; opacity: .7; margin-top: 3px; display: none; }
#shop .sh-en.on { display: block; }
#shop .w { color: #d6453a; font-weight: 800; border-bottom: 2px dotted #d6453a; position: relative; cursor: help; }
#shop .w:hover::after { content: attr(data-en); position: absolute; left: 50%; bottom: 130%; transform: translateX(-50%); background: #2b2235; color: #fffaf0; font: 600 13px "Segoe UI", sans-serif;
  padding: 3px 8px; border-radius: 8px; white-space: nowrap; z-index: 3; }
#shop .gl { font: italic 600 .72em "Segoe UI", sans-serif; opacity: .6; margin-left: 3px; color: #2b2235; }
#shop .sh-shelf { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
#shop .sh-item { position: relative; flex: 0 1 196px; min-width: 132px; display: flex; flex-direction: column; align-items: center; padding: 6px 8px 8px; background: #fff; border: 2px solid rgba(43,34,53,.15); border-radius: 14px; text-align: center; }
#shop .sh-item:hover { border-color: rgba(33,164,147,.6); }
#shop .sh-item.on { border-color: #21a493; box-shadow: 0 0 0 3px rgba(33,164,147,.25); }
#shop .sh-item canvas { width: 58px; height: 58px; }
#shop .sh-item .nm { font-size: 17px; font-weight: 800; line-height: 1.15; }
#shop .sh-item .nm i { font-style: normal; font-weight: 600; opacity: .55; font-size: 14px; }
#shop .sh-item small { font-size: 12px; opacity: .65; line-height: 1.3; }
#shop .sh-tag { position: absolute; top: 6px; right: 6px; min-width: 28px; padding: 1px 7px; border-radius: 8px; background: #ffe9a8; border: 2px solid #2b2235; font: 800 15px Bahnschrift, "Segoe UI", sans-serif; transform: rotate(6deg); }
#shop .sh-tag.known { background: #fff3c9; }
#shop .sh-tag em { font: italic 700 11px "Segoe UI", sans-serif; margin-left: 4px; color: #d6453a; }
#shop .sh-bag { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; font-size: 13px; font-weight: 700; min-height: 26px; }
#shop .sh-bag .lbl { opacity: .55; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
#shop .sh-bag .e { opacity: .45; font-weight: 600; }
#shop .sh-bag .b { display: inline-flex; align-items: center; gap: 1px; background: #fff; border-radius: 99px; padding: 0 9px 0 2px; border: 1.5px solid rgba(43,34,53,.15); }
#shop .sh-bag canvas { width: 24px; height: 24px; }
#shop .sh-fb { display: flex; align-items: center; gap: 12px; padding: 6px 10px; background: rgba(255,255,255,.7); border-radius: 14px; border: 2px dashed rgba(43,34,53,.15); }
#shop .sh-fb.sh-hide { display: none; }
#shop .sh-fb.tip .sh-grade { display: none; }
#shop .sh-grade { flex: none; width: 48px; height: 48px; border-radius: 50%; border: 3px solid #2b2235; display: grid; place-items: center; animation: sh-pop .45s cubic-bezier(.3,1.6,.5,1);
  background: radial-gradient(circle at 36% 30%, var(--gt) 0 9%, var(--g) 34%, var(--g2) 100%); }
#shop .sh-grade b { font: 900 28px/1 Bahnschrift, "Segoe UI", sans-serif; color: #fffaf0; -webkit-text-stroke: 5px #2b2235; paint-order: stroke fill; }
#shop .gS { --g: #ffc93c; --g2: #ff9f1c; --gt: #fffbe6; } #shop .gA { --g: #2fc4b0; --g2: #158f80; --gt: #f2fffc; } #shop .gB { --g: #6cc35a; --g2: #3f8f34; --gt: #f4ffef; }
#shop .gC { --g: #f39a45; --g2: #c96a1c; --gt: #fff4e8; } #shop .gD { --g: #a9a1b8; --g2: #7d7590; --gt: #f6f3fa; }
@keyframes sh-pop { from { transform: scale(.55) rotate(-14deg); } }
#shop .sh-why { display: flex; flex-direction: column; min-width: 0; font-size: 14px; line-height: 1.35; }
#shop .sh-why b { font-size: 15px; }
#shop .sh-why span { opacity: .8; }
#shop .sh-why .sh-better { opacity: 1; }
#shop .sh-why q { quotes: "«" "»"; font-weight: 800; color: #137267; }
#shop .sh-why .sh-offnote { color: #9a6a12; font-weight: 800; opacity: 1; }
#shop .sh-whyb { align-self: flex-start; border: 0; background: none; padding: 0; font-size: 12px; font-weight: 800; color: #137267; text-decoration: underline; }
#shop .sh-whyt { display: none; font-size: 13px; }
#shop .sh-why.open .sh-whyt { display: block; }
#shop .sh-help { display: none; flex-wrap: wrap; align-items: baseline; gap: 2px 12px; background: #fff; border: 2px dashed rgba(214,69,58,.45); border-radius: 14px; padding: 7px 12px 8px; }
#shop.sh-learn .sh-help { display: flex; }
#shop .sh-help .t { width: 100%; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; opacity: .55; }
#shop .sh-help b { font: 800 24px Bahnschrift, "Segoe UI", sans-serif; color: #d6453a; }
#shop .sh-help span { font-size: 14px; font-style: italic; opacity: .7; }
#shop .sh-prompt { font-weight: 800; font-size: 15px; }
#shop .sh-prompt .sh-pen { font-weight: 600; font-style: italic; opacity: .6; font-size: 13px; margin-left: 6px; }
#shop .sh-form { display: flex; gap: 8px; margin: 0; }
#shop .sh-input { flex: 1; min-width: 0; font: 600 20px "Segoe UI", sans-serif; padding: 6px 10px; border: 2.5px solid #2b2235; border-radius: 10px; outline: none; background: #fff; color: #2b2235; }
#shop .sh-input:focus { box-shadow: 0 0 0 3px rgba(33,164,147,.35); }
#shop.sh-learn .sh-input::placeholder { color: rgba(214,69,58,.5); font-weight: 700; }
#shop .sh-form button { border: 2.5px solid #2b2235; border-radius: 10px; background: #2b2235; color: #fffaf0; font-weight: 800; padding: 6px 18px; font-size: 16px; }
#shop .sh-row { display: flex; gap: 8px; align-items: center; }
#shop .sh-row button { border: 2px solid #2b2235; border-radius: 10px; background: transparent; font-size: 12px; font-weight: 800; padding: 3px 10px; }
#shop .sh-row .sh-keys { margin-left: auto; font-size: 11px; opacity: .5; }
@media (max-height: 760px) { #shop .sh-item canvas { width: 44px; height: 44px; } #shop .sh-say { font-size: 18px; padding-top: 7px; padding-bottom: 8px; } #shop .sh-card { gap: 7px; padding-top: 10px; padding-bottom: 10px; } #shop .sh-sicon { width: 38px; height: 38px; } }
@media (max-height: 620px) { #shop .sh-item canvas { width: 34px; height: 34px; } #shop .sh-item small { display: none; } #shop .sh-say { font-size: 16px; } #shop .sh-row .sh-keys { display: none; } }
@media (max-width: 560px) { #shop { padding: 8px; } #shop .sh-row .sh-keys { display: none; } #shop .sh-item { flex-basis: 120px; min-width: 104px; } }`;

  function build() {
    if (els) return els;
    const st = document.createElement('style'); st.id = 'shop-css'; st.textContent = CSS; document.head.appendChild(st);
    const root = document.createElement('div'); root.id = 'shop'; root.className = 'sh-off';
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Market stall');
    root.innerHTML = `<div class="sh-card">
  <div class="sh-head"><canvas class="sh-sicon" width="88" height="88"></canvas><div class="sh-who"><b class="sh-name"></b><small class="sh-stall"></small></div>
    <div class="sh-purse" title="Your coins"><canvas width="60" height="60"></canvas><b class="sh-coins">0</b><span class="sh-cw"></span></div></div>
  <div class="sh-say" aria-live="polite"><span class="sh-tools"><button type="button" data-act="hear" title="Hear it">🔊</button><button type="button" data-act="en" title="Show the English">EN</button></span><div class="sh-line"></div><div class="sh-en"></div></div>
  <div class="sh-shelf"></div>
  <div class="sh-bag"></div>
  <div class="sh-fb sh-hide"><div class="sh-grade"><b></b></div><div class="sh-why"></div></div>
  <div class="sh-help"><div class="t">Try saying this · copy it into the box</div><b class="sh-model"></b><span class="sh-model-en"></span></div>
  <div class="sh-prompt"></div>
  <form class="sh-form" autocomplete="off"><input class="sh-input" spellcheck="false" autocomplete="off" aria-label="What you say"><button type="submit">Say</button></form>
  <div class="sh-row"><button type="button" data-act="help">Help (?)</button><button type="button" data-act="bye">Bye (Esc)</button><span class="sh-keys">Enter: say · Tab: help · click a thing to point at it</span></div>
</div>`;
    document.body.appendChild(root);
    const q = s => root.querySelector(s);
    els = { root, card: q('.sh-card'), sicon: q('.sh-sicon'), name: q('.sh-name'), stall: q('.sh-stall'), coinIcon: q('.sh-purse canvas'), coins: q('.sh-coins'), coinWord: q('.sh-cw'),
      line: q('.sh-line'), en: q('.sh-en'), enBtn: q('[data-act="en"]'), shelf: q('.sh-shelf'), bag: q('.sh-bag'), fb: q('.sh-fb'), badge: q('.sh-grade'), why: q('.sh-why'),
      model: q('.sh-model'), modelEn: q('.sh-model-en'), prompt: q('.sh-prompt'), form: q('.sh-form'), input: q('.sh-input') };
    els.form.addEventListener('submit', e => { e.preventDefault(); submit(els.input.value); });
    if (typeof CJK !== 'undefined' && CJK.attachIME) CJK.attachIME(els.input);     // (zh / ja in character mode: the in-game IME)
    els.input.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); close('esc'); }
      else if (e.key === 'Tab') { e.preventDefault(); showHelp(); }
      e.stopPropagation();
    });
    els.input.addEventListener('keyup', e => e.stopPropagation());
    els.input.addEventListener('focus', () => { if (V && typeof Input !== 'undefined') Input.typing = true; });
    els.input.addEventListener('blur', () => { if (typeof Input !== 'undefined') Input.typing = false; });
    root.addEventListener('click', e => {
      const b = e.target.closest('[data-act],[data-id]');
      if (!b || !V) return;
      if (b.dataset.id) { select(b.dataset.id); return; }
      const act = b.dataset.act;
      if (act === 'bye') close('bye');
      else if (act === 'help') showHelp();
      else if (act === 'en' && V.line) { V.line.showEn = !V.line.showEn; paintLine(); els.input.focus(); }
      else if (act === 'hear' && V.line) {
        const said = cjOn(V.lang) ? CJK.say(cjSrc(V.line.tl), V.lang) : typeof Sound !== 'undefined' && Sound.say(tlPlain(V.line.tl), V.lang);
        if (typeof Sound !== 'undefined' && !said && typeof UI !== 'undefined') UI.toast('No voice for this language is installed on this PC');
        els.input.focus();
      }
      else if (act === 'why') els.why.classList.toggle('open');
    });
    return els;
  }
  // Esc closes the shop even when the text box doesn't have the focus; other keys bring it back
  function onKey(e) {
    if (!V) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close('esc'); return; }
    if (document.activeElement !== els.input && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) els.input.focus();
  }
  const sfx = (name, ...a) => { if (typeof Sound !== 'undefined') Sound.play(name, ...a); };

  function open(o = {}) {
    // zh / ja (CJK.md) have their own grammar (parseCJ). Never fall back to Spanish for them: that would also switch LEX
    // and UI (below) into Spanish for the rest of the game.
    build();
    if (V) close('reopened');
    const ok = l => LANGS.includes(l) || cjOn(l);
    const lang = ok(o.lang) ? o.lang : ok(LEX.lang) ? LEX.lang : 'es';
    if (LEX.lang !== lang) LEX.lang = lang;                  // they match in the game; tests may not
    if (typeof UI !== 'undefined' && UI.lang !== lang) UI.lang = lang;
    const st = o.stall || {}, stall = typeof st === 'string' ? st : st.id || 'fruit', keeper = (typeof st === 'object' && st.keeper) || {};
    if (!STALLS[stall]) console.warn('[shop] no goods for stall', stall);
    (o.asked || []).forEach(id => { if (PRICE[id]) KNOWN[lang].add(id); });
    return new Promise(resolve => {
      V = { lang, stall, keeper: { id: keeper.id || stall, name: keeper.name || (STALL_NAME[stall] ? STALL_NAME[stall][lang] : 'Keeper') },
        coins: Math.max(0, Math.floor(+o.coins || 0)), bag: Object.assign({}, o.bag || {}), bought: [], log: [], pending: null, focus: null,
        helped: new Set(), helpIdx: 0, model: null, mimo: o.mimoName || (typeof UI !== 'undefined' && UI.mimoName) || 'Mimo', resolve, line: null, readyAt: performance.now(), closing: false };
      (STALLS[stall] || []).forEach(id => LEX.expose(id));
      LEX.expose('w.coin');
      els.root.classList.remove('sh-off', 'sh-learn');
      els.fb.classList.add('sh-hide');
      els.input.value = '';
      els.input.setAttribute('lang', cjOn(lang) ? CJK.tag(lang) : lang);
      keeperSay(line('welcome'));
      paintFrame();
      addEventListener('keydown', onKey, true);
      sfx('click');
      if (typeof Input !== 'undefined') Input.typing = true;
      setTimeout(() => { if (V) els.input.focus(); }, 30);
    });
  }
  function close(why = 'close') {
    if (!V) return null;
    const v = V;
    V = null;
    clearTimeout(v.closeT);
    removeEventListener('keydown', onKey, true);
    els.root.classList.add('sh-off');
    els.root.classList.remove('sh-learn');
    if (document.activeElement === els.input) els.input.blur();
    if (typeof Input !== 'undefined') Input.typing = false;
    const res = { coins: v.coins, bag: Object.assign({}, v.bag), bought: v.bought.slice(), log: v.log.slice(), asked: [...KNOWN[v.lang]], closedBy: why };
    v.resolve(res);
    return res;
  }

  function line(key, c = {}) {
    const lang = V ? V.lang : LEX.lang, k = kit(lang), T = LINES[key];
    c = Object.assign({ stall: V && V.stall, mimo: V ? V.mimo : 'Mimo' }, c);
    return { key, tl: cjOn(lang) ? T[lang](c, k, lang) : capFix(T[lang](c, k, lang)), en: capFix((T['en_' + lang] || T.en)(c, k, lang)) };
  }
  // The keeper's line follows the weave, like story.js sayInline: English with the shop words in the language, then (as the
  // weave rises) the whole line in the language. Its English is on request, EN, never under it by default (DESIGN.md 17.3).
  function keeperSay(L) {
    const W = LEX.weave(), full = UI.fullLine ? UI.fullLine('shop.' + L.key, W) : W >= 0.62;     // (whole lines arrive gradually: ui.js fullLine)
    V.line = Object.assign(L, { mode: !full ? 'woven' : 'tl', showEn: false, parts: null });
    if (V.line.mode === 'woven') { V.line.parts = enParts(L.en); UI.noteWoven(V.line.parts.filter(p => p.tl && isItem(p.id))); }
    else L.tl.forEach(t => { if (typeof t !== 'string' && isItem(t.id)) LEX.expose(t.id); });
    // zh / ja in character mode: the line counts as read for each character in it (its woven words, below the full weave)
    if (cjOn(V.lang)) { if (V.line.mode === 'woven') V.line.parts.forEach(p => { if (p.src) CJK.seen(p.src, { lang: V.lang }); }); else CJK.seen(cjSrc(L.tl), { lang: V.lang }); }
    paintLine();
    sfx('blip', V.keeper.id);
    V.readyAt = performance.now();
  }
  function paintLine() {
    const L = V.line;
    els.line.innerHTML = L.mode === 'woven' ? UI.partsHTML(L.parts) : tlHTML(L.tl);
    els.en.textContent = enPlain(L.en); els.en.classList.toggle('on', !!L.showEn); els.enBtn.style.display = '';
  }
  // the header, the purse, the shelf, the bag and the prompt
  function paintFrame() {
    if (cjOn(V.lang)) { paintFrameCJ(); return; }
    const lang = V.lang, W = LEX.weave(), goods = STALLS[V.stall] || [], sn = STALL_NAME[V.stall];
    ICONS.draw(els.sicon, goods.length ? (LEX.item(goods[0]) || {}).icon : 'coin');
    els.name.textContent = V.keeper.name;
    els.stall.textContent = sn ? (W < 0.92 ? `${sn[lang]} · ${sn.en}` : sn[lang]) : V.stall;
    ICONS.draw(els.coinIcon, 'coin');
    els.coins.textContent = V.coins;
    els.coinWord.textContent = (LEX.item('w.coin') || {})[lang] && (V.coins === 1 ? LEX.item('w.coin')[lang] : LEX.item('w.coin').pl[lang]);
    els.shelf.innerHTML = goods.map(id => {
      const L = mainLemma(id, lang), known = KNOWN[lang].has(id), it = LEX.item(id) || {};
      const art = lang === 'de' ? deDef('d', L.g, false, 'nom') : ART[lang].def[L.g === 'f' ? 1 : 0];
      const sub = [W < 0.92 ? enNoun(id, false) : '', id === 'w.honey' ? `${lang === 'de' ? 'ein Glas' : (lang === 'es' ? 'un ' : 'um ') + JAR[lang].sg} = a jar` : `pl. ${L.pl}`].filter(Boolean).join(' · ');
      const tag = `${PRICE[id]}<em>${esc(numWord(PRICE[id], lang, 'f', 'nom'))}</em>`;     // (P6b: every price shows, in digits and words; pointing at it, the keeper says it)
      return `<button type="button" class="sh-item${V.focus === id ? ' on' : ''}" data-id="${id}" title="Point at it: the keeper says its price"><span class="sh-tag${known ? ' known' : ''}">${tag}</span>`
        + `<canvas width="116" height="116" data-icon="${esc(it.icon || '')}"></canvas><span class="nm"><i>${esc(art)}</i> ${esc(L.sg)}</span><small>${esc(sub)}</small></button>`;
    }).join('');
    const ids = Object.keys(V.bag).filter(id => V.bag[id] > 0);
    els.bag.innerHTML = '<span class="lbl">Bag</span>' + (ids.length ? ids.map(id => `<span class="b" title="${esc(LEX.item(id) ? LEX.form(id) + ' · ' + enNoun(id, false) : id)}"><canvas width="48" height="48" data-icon="${esc((LEX.item(id) || {}).icon || '')}"></canvas>×${V.bag[id]}</span>`).join('') : '<span class="e">empty</span>');
    els.root.querySelectorAll('.sh-shelf canvas[data-icon], .sh-bag canvas[data-icon]').forEach(cv => ICONS.draw(cv, cv.dataset.icon));
    // (the prompt in the language: its English on hover, never beside it by default)
    els.prompt.innerHTML = W < 0.62 ? `What do you say? <span class="sh-pen">(in ${LNAME[lang]})</span>` : W < 0.92 ? `<span title="What do you say?">${esc(PROMPT[lang])}</span>` : esc(PROMPT[lang]);
    if (!els.root.classList.contains('sh-learn')) els.input.placeholder = W < 0.62 ? `type in ${LNAME[lang]}…` : PLACEHOLDER[lang];
    painted();
  }
  // (P6b) what other files add to the panel each time it's drawn: SHOP.onPaint = [fn(visit, els)] (pantry.js: what each thing does;
  // shop_order.js: how to order, for new shoppers)
  function painted() { for (const f of (typeof SHOP !== 'undefined' && SHOP.onPaint) || []) { try { f(V, els); } catch (e) { console.error('[shop] onPaint', e); } } }
  // zh / ja: no articles; the shelf shows each thing with its measure word (一个苹果, 一罐 = a jar) or its counter for one
  // (ひとつ, いちまい), the price tag the coins in words (两枚, 二枚), the rest in the notation, shown by CJK in the mode
  function paintFrameCJ() {
    const lang = V.lang, zh = lang === 'zh', W = LEX.weave(), goods = STALLS[V.stall] || [], sn = STALL_NAME[V.stall];
    const P = src => CJK.plain(src, { lang, cap: false });
    ICONS.draw(els.sicon, goods.length ? (LEX.item(goods[0]) || {}).icon : 'coin');
    els.name.textContent = P(V.keeper.name || (sn && (sn[lang] || sn.en)) || 'Keeper');
    els.stall.textContent = sn ? (W < 0.92 || !sn[lang] ? [sn[lang] ? P(sn[lang]) : '', sn.en].filter(Boolean).join(' · ') : P(sn[lang])) : V.stall;
    ICONS.draw(els.coinIcon, 'coin');
    els.coins.textContent = V.coins;
    els.coinWord.textContent = P(cjWord('w.coin', lang));
    els.shelf.innerHTML = goods.map(id => {
      const known = KNOWN[lang].has(id), it = LEX.item(id) || {}, cl = clOf(id);
      const lead = zh ? `<i>${esc(P(`[一|yī] ${clSrc(cl)}`))}</i> ` : '';
      const one = zh ? (cl !== '个' ? `${P(clSrc(cl))} = ${CL_EN[cl] || ''}` : '') : `1 = ${P(jaCountSrc(1, ctrOf(id, 1)))}`;
      const sub = [W < 0.92 ? enNoun(id, false) : '', one].filter(Boolean).join(' · ');
      const tag = `${PRICE[id]}<em>${esc(P(zh ? `${zhNumSrc(PRICE[id], true)} [枚|méi]` : jaCountSrc(PRICE[id], '枚')))}</em>`;     // (P6b: every price shows)
      return `<button type="button" class="sh-item${V.focus === id ? ' on' : ''}" data-id="${id}" title="Point at it: the keeper says its price"><span class="sh-tag${known ? ' known' : ''}">${tag}</span>`
        + `<canvas width="116" height="116" data-icon="${esc(it.icon || '')}"></canvas><span class="nm">${lead}${CJK.html(cjWord(id, lang), { lang, cap: false })}</span><small>${esc(sub)}</small></button>`;
    }).join('');
    const ids = Object.keys(V.bag).filter(id => V.bag[id] > 0);
    els.bag.innerHTML = '<span class="lbl">Bag</span>' + (ids.length ? ids.map(id => `<span class="b" title="${esc(LEX.item(id) ? LEX.form(id) + ' · ' + enNoun(id, false) : id)}"><canvas width="48" height="48" data-icon="${esc((LEX.item(id) || {}).icon || '')}"></canvas>×${V.bag[id]}</span>`).join('') : '<span class="e">empty</span>');
    els.root.querySelectorAll('.sh-shelf canvas[data-icon], .sh-bag canvas[data-icon]').forEach(cv => ICONS.draw(cv, cv.dataset.icon));
    const prompt = CJK.html(PROMPT[lang], { lang });
    els.prompt.innerHTML = W < 0.62 ? `What do you say? <span class="sh-pen">(in ${LNAME[lang]})</span>` : W < 0.92 ? `<span title="What do you say?">${prompt}</span>` : prompt;
    if (!els.root.classList.contains('sh-learn')) els.input.placeholder = W < 0.62 ? `type in ${LNAME[lang]}${CJK.mode(lang) === 'chars' ? ` (letters turn into ${zh ? 'characters' : 'kana'})` : ''}…` : P(PLACEHOLDER[lang]);
    painted();
  }
  function shake() { els.card.classList.remove('sh-shake'); void els.card.offsetWidth; els.card.classList.add('sh-shake'); }
  // point at a thing on the shelf: «¿Cuánto cuesta?» then means that one, and Help models it
  function select(id) {
    if (!V || !(STALLS[V.stall] || []).includes(id)) return;
    V.focus = V.focus === id ? null : id;
    sfx('click');
    // (P6b, "say the prices of things in shops") pointing at a thing, the keeper says its price, out loud: «Cuesta tres monedas»
    if (V.focus) {
      KNOWN[V.lang].add(id);
      keeperSay(line(PRICE_PL.has(id) && !cjOn(V.lang) ? 'priceEach' : 'price', { id }));
      try { if (cjOn(V.lang)) CJK.say(cjSrc(V.line.tl), V.lang); else if (typeof Sound !== 'undefined') Sound.say(tlPlain(V.line.tl), V.lang); } catch (e) { /* (no voice on this PC) */ }
    }
    paintFrame();
    els.input.focus();
  }
  // Help: a model sentence for a thing on the shelf, to copy (nothing is said out loud)
  function showHelp() {
    if (!V) return null;
    const goods = STALLS[V.stall] || [];
    if (!goods.length) return null;
    const id = V.focus && goods.includes(V.focus) ? V.focus : goods[V.helpIdx++ % goods.length];
    const m = model(id, V.lang, { known: KNOWN[V.lang].has(id), coins: V.coins });
    V.model = m;
    m.ids.forEach(i => { V.helped.add(i); if (isItem(i)) LEX.expose(i); });
    els.root.classList.add('sh-learn');
    if (m.src) els.model.innerHTML = CJK.html(m.src, { lang: V.lang, ruby: 'always' });       // (zh / ja: with every reading)
    else els.model.textContent = m.text;
    els.modelEn.textContent = m.en;
    els.input.value = '';
    els.input.placeholder = m.type || m.text;
    els.input.focus();
    sfx('page');
    return m;
  }
  function endHelp() { els.root.classList.remove('sh-learn'); V.helped.clear(); V.model = null; }
  function showGrade(r, sale) {
    els.fb.classList.remove('sh-hide', 'tip');
    els.badge.className = 'sh-grade g' + r.grade;
    els.badge.firstElementChild.textContent = r.grade;
    els.badge.style.animation = 'none'; void els.badge.offsetWidth; els.badge.style.animation = '';
    const key = s => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
    let html;
    if (r.canonSrc !== undefined && cjOn(V.lang)) {        // zh / ja: the notes' words with their readings (cjRich), the better sentence too
      const l = V.lang;
      html = `<b>${cjRich(r.reasonSrc, l)}</b>` + r.notesSrc.filter(n => n !== r.reasonSrc).slice(0, 2).map(n => `<span>${cjRich(n, l)}</span>`).join('');
      if (r.grade !== 'S' && r.canonSrc && !CJK.same(r.text, r.canonSrc, l)) html += `<span class="sh-better">Better: <q>${CJK.html(r.canonSrc, { lang: l })}</q></span>`;
      if (sale && sale.off) html += '<span class="sh-offnote">Polite S: one coin off each!</span>';
      if (r.whySrc && r.grade !== 'S') html += `<button type="button" class="sh-whyb" data-act="why">Why?</button><span class="sh-whyt">${cjRich(r.whySrc, l)}</span>`;
      els.why.innerHTML = html;
      els.why.classList.remove('open');
      return;
    }
    html = `<b>${esc(r.reason)}</b>` + r.notes.filter(n => n !== r.reason).slice(0, 2).map(n => `<span>${esc(n)}</span>`).join('');
    if (r.grade !== 'S' && r.canon && key(r.canon) !== key(r.text)) html += `<span class="sh-better">Better: <q>${esc(r.canon)}</q></span>`;
    if (sale && sale.off) html += '<span class="sh-offnote">Polite S: one coin off each!</span>';
    if (r.why && r.grade !== 'S') html += `<button type="button" class="sh-whyb" data-act="why">Why?</button><span class="sh-whyt">${esc(r.why)}</span>`;
    els.why.innerHTML = html;
    els.why.classList.remove('open');
  }
  function showTip(text) { els.fb.classList.remove('sh-hide'); els.fb.classList.add('tip'); els.why.innerHTML = `<span>${esc(text)}</span>`; }

  function priceReply(r) {
    const goods = STALLS[V.stall] || [];
    const its = r.items.length ? r.items : [];
    if (!its.length) return line('which');
    const off = its.find(it => !goods.includes(it.id));
    if (off) return line('notHere', { id: off.id });
    its.forEach(it => KNOWN[V.lang].add(it.id));
    V.focus = its[its.length - 1].id;
    if (its.length > 1) return line('priceMany', { items: its });
    const it = its[0];
    if (it.n > 1 && it.n <= 20) return line('priceQty', { id: it.id, n: it.n });
    if (it.plural) return line('priceEach', { id: it.id });
    return line('price', { id: it.id });
  }
  function buyReply(r) {
    const goods = STALLS[V.stall] || [], its = r.items;
    if (!its.length) return { L: line(r.unknown.length ? 'noSuch' : 'whatWant') };
    const off = its.find(it => !goods.includes(it.id));
    if (off) return { L: line('notHere', { id: off.id }) };
    if (its.some(it => it.n !== null && it.n > 20)) return { L: line('tooMany') };
    if (its.some(it => it.n === 0)) return { L: line('huh') };
    const ask = its.find(it => it.n === null);
    if (ask) { V.pending = ask.id; return { L: line('howMany', { id: ask.id }) }; }
    // a polite S: one coin off each thing (never below 1)
    const S = r.grade === 'S';
    const lines = its.map(it => ({ id: it.id, n: it.n, price: S ? Math.max(1, PRICE[it.id] - 1) : PRICE[it.id] }));
    const total = lines.reduce((a, l) => a + l.n * l.price, 0), off1 = lines.some(l => l.price < PRICE[l.id]);
    if (total > V.coins) return { L: line('broke', { total, coins: V.coins }) };
    V.coins -= total;
    lines.forEach(l => { V.bag[l.id] = (V.bag[l.id] || 0) + l.n; V.bought.push({ id: l.id, n: l.n, price: l.price, total: l.n * l.price, grade: r.grade }); KNOWN[V.lang].add(l.id); });
    V.pending = null;
    V.focus = lines[lines.length - 1].id;
    const hat = lines.some(l => l.id === 'w.hat');
    return { L: line('sold', { items: lines, total, mode: r.bossy ? 'bossy' : off1 ? 'discount' : 'plain', hat }), sale: { total, off: off1, lines } };
  }
  // You said something to the keeper. Returns what happened (for tests too).
  function submit(text) {
    if (!V || V.closing) return null;
    const raw = String(text == null ? '' : text).trim();
    if (!raw) { shake(); return null; }
    const ms = Math.max(600, performance.now() - V.readyAt);
    const r = parse(raw, V.lang, V.stall, { pending: V.pending, focus: V.focus, names: [String(V.mimo).toLowerCase(), 'mimo'] });
    if (r.kind === 'help') { els.input.value = ''; const m = showHelp(); return { text: raw, kind: 'help', model: m ? m.text : '' }; }
    const goods = STALLS[V.stall] || [];
    const tryIt = goods.length ? model(goods[0], V.lang, { known: KNOWN[V.lang].has(goods[0]), coins: V.coins }).text : '';
    let L, sale = null, tip = null, keep = false;
    switch (r.kind) {
      case 'english': L = line('english'); tip = `Say it in ${LNAME[V.lang]}, like: «${tryIt}» (or press Help)`; keep = true; break;
      case 'greet': L = line('greetBack', { key: r.greet }); break;
      case 'thanks': L = line('thanks'); break;
      case 'bye': L = line('bye'); V.closing = true; break;
      case 'yes': L = line('yes'); break;
      case 'no': L = line('no'); break;
      case 'polite': L = line('whatWant'); break;
      case 'number': {
        L = line('whatQty', { n: r.n });
        const id = goods[0] || 'w.apple', n = Math.min(20, Math.max(1, r.n));
        if (cjOn(V.lang)) { const q = V.lang === 'zh' ? cjQty(n, id, 'zh') : `${cjWord(id, 'ja')} を ${jaCountSrc(n, ctrOf(id, n))} ください`; tip = `Say what, too: «${CJK.plain(q, { lang: V.lang })}»`; break; }
        const M = mainLemma(id, V.lang);
        tip = `Say what, too: «${firstCap(numWord(n, V.lang, M.g, 'acc'))} ${n === 1 ? M.sg : M.pl}»`;
        break;
      }
      case 'price': L = priceReply(r); break;
      case 'buy': ({ L, sale } = buyReply(r)); break;
      default: L = line('huh'); tip = `Try: «${tryIt}», or press Help (?)`; keep = true;
    }
    keeperSay(L);
    if (r.grade) showGrade(r, sale); else if (tip) showTip(tip); else els.fb.classList.add('sh-hide');
    if (sale) sfx(r.grade === 'S' ? 'perfect' : 'chest'); else if (r.kind === 'unknown' || r.kind === 'english') sfx('wrong');
    // the shop words you produced count for the language engine (spread the time over the sentence)
    const len = Math.max(1, raw.replace(/\s+/g, '').length);
    for (const w of r.words) LEX.attempt(w.id, { ok: w.ok, hints: V.helped.has(w.id) ? 1 : 0, ms: Math.round(clamp(1200 + (ms - 1200) * (w.len / len), 800, 20000)), mode: 'shop' });
    // zh / ja: the characters you typed right count toward knowing them (their readings fade)
    if (cjOn(V.lang) && r.usedSrc && (r.kind === 'buy' || r.kind === 'price') && r.grade !== 'D') CJK.used(raw, r.usedSrc, { lang: V.lang });
    endHelp();
    const turn = { text: raw, kind: r.kind, grade: r.grade, reason: r.reason, notes: r.notes, canon: r.canon, why: r.why, reply: tlPlain(V.line.tl), en: enPlain(V.line.en), mode: V.line.mode,
      items: r.items.map(it => ({ id: it.id, n: it.n })), words: r.words.map(w => w.id) };
    if (sale) turn.sale = { total: sale.total, off: sale.off };
    V.log.push(turn);
    if (keep) els.input.select(); else els.input.value = '';
    paintFrame();
    if (V.closing) V.closeT = setTimeout(() => close('bye'), 1500);
    return Object.assign({ coins: V.coins, bag: Object.assign({}, V.bag) }, turn);
  }

  // ================================================================ more goods and stalls (townlife.js's corner stores, or anyone's)
  //   SHOP.extend({ words: [LEX items], items: [[id, price, hearts healed in battle, stall or [stalls]]],
  //                 goods: { es: { id: [[sg, pl, gender], …] }, pt, de }   (the forms the keepers understand; the first is the standard one)
  //                 en: { id: [sg, pl] }, mass: [ids], listSg: [ids], pricePl: [ids],
  //                 stalls: { stallId: { name: { es, pt, de, en }, where: { es, pt, de, en }, welcome: { es(c, k), pt, de, en }, goods: [ids] } },
  //                 enWords: 'juice soda …',                           (English words, so an answer in English is spotted)
  //                 cj: { id: { zh: [forms], cl: '瓶', cls: ['杯'], ja: [forms], jc: ['本'] } } })   (zh / ja: the words if LEX lacks them, the
  //                     measure words (cl: the keeper's, cls: also right) and the ja counters beyond つ / 個; without it 个 and つ / 個)
  //                 units: { es: [[sg, pl, gender, kind, measure?]], pt, de }   (more «un frasco de…» words: grandma.js's plates, bowls, cups)
  //                 cl: { 盘: ['pán', 'plates'] }                            (zh measure words the keepers don't know yet: reading, what they count)
  // It only adds: the market's stalls, goods and lines stay as they were. A stall's own welcome line is used for that stall only.
  const STALL_WELCOME = {};
  let welcomeWrapped = false;
  function extend(o = {}) {
    (o.words || []).forEach(w => { if (!LEX.item(w.id)) LEX.register([Object.assign({ kind: 'word' }, w)]); });
    for (const [l, map] of Object.entries(o.goods || {})) if (GOODS[l]) for (const [id, lemmas] of Object.entries(map)) if (!GOODS[l][id]) GOODS[l][id] = lemmas;
    for (const [id, pair] of Object.entries(o.en || {})) if (!EN_NOUN[id]) EN_NOUN[id] = pair;
    (o.mass || []).forEach(id => MASS.add(id)); (o.listSg || []).forEach(id => LIST_SG.add(id)); (o.pricePl || []).forEach(id => PRICE_PL.add(id));
    for (const [l, list] of Object.entries(o.units || {})) if (UNITS[l]) list.forEach(u => { if (!UNITS[l].some(x => x[0] === u[0])) UNITS[l].push(u); });
    for (const [c, v] of Object.entries(o.cl || {})) { if (!CL_PY[c]) CL_PY[c] = v[0]; if (!CL_EN[c]) CL_EN[c] = v[1]; }
    for (const [st, s] of Object.entries(o.stalls || {})) {
      STALLS[st] = STALLS[st] || [];
      (s.goods || []).forEach(id => { if (!STALLS[st].includes(id)) STALLS[st].push(id); });
      if (s.name) STALL_NAME[st] = s.name;
      if (s.where) WHERE[st] = s.where;
      if (s.welcome) STALL_WELCOME[st] = s.welcome;
    }
    for (const [id, price, heal, stall] of o.items || []) {
      const sts = [].concat(stall || []);
      sts.forEach(st => { STALLS[st] = STALLS[st] || []; if (!STALLS[st].includes(id)) STALLS[st].push(id); });
      if (!(id in PRICE)) PRICE[id] = price;
      if (!BY_ID[id]) { const it = Object.assign({}, LEX.item(id) || {}, { id, price: PRICE[id], heal: heal || 0, stall: sts[0] || null, mass: MASS.has(id) }); ITEMS.push(it); BY_ID[id] = it; }
    }
    String(o.enWords || '').toLowerCase().split(/\s+/).filter(Boolean).forEach(w => EN.add(w));
    if (Object.keys(STALL_WELCOME).length && !welcomeWrapped) {
      welcomeWrapped = true;
      for (const k of Object.keys(LINES.welcome)) {
        const base = LINES.welcome[k];
        LINES.welcome[k] = (c, kt, lang) => { const W = STALL_WELCOME[c.stall], f = W && (W[k] || (k.startsWith('en') && W.en)); return f ? f(c, kt, lang) : base(c, kt, lang); };
      }
    }
    LANGS.forEach(l => { delete LX[l]; });            // the keepers' dictionaries are rebuilt with the new words
    for (const [id, g] of Object.entries(o.cj || {})) CJ_GOODS[id] = Object.assign({}, CJ_GOODS[id], g);
    cjMerge(); CJL.forEach(l => { delete CLX[l]; });  // (zh / ja: the new words get theirs too)
    return { items: ITEMS.length, stalls: Object.keys(STALLS) };
  }

  return {
    ITEMS, STALLS, PRICE, item: id => BY_ID[id] || null,
    open, close, parse, numWord, model, extend,
    get isOpen() { return !!V; },
    get known() { return KNOWN; },
    // forget the prices you've asked (a new game; tests)
    forget(lang) { (lang ? [lang] : Object.keys(KNOWN)).forEach(l => { if (KNOWN[l]) KNOWN[l].clear(); }); },
    // tests: drive the open panel
    _: {
      submit, help: showHelp, select, close,
      state: () => (V ? { lang: V.lang, stall: V.stall, coins: V.coins, bag: Object.assign({}, V.bag), bought: V.bought.slice(), pending: V.pending, focus: V.focus,
        line: V.line ? { tl: tlPlain(V.line.tl), en: enPlain(V.line.en), mode: V.line.mode } : null, learn: els.root.classList.contains('sh-learn'), log: V.log.slice() } : null),
      line: (key, c) => { const L = line(key, c); return { tl: tlPlain(L.tl), en: enPlain(L.en) }; },
      // zh / ja: every notation string the keepers use, checked against CJK.md (CJK.validate) → [{ where, src, problems }]
      cjCheck() {
        if (typeof CJK === 'undefined') return [];
        const out = [], chk = (where, src, l) => { const p = CJK.validate(src, l); if (p.length) out.push({ where, src, problems: p }); };
        for (const l of CJL) {
          cjLex(l).E.forEach(e => { if (!e.bad && e.src) chk('word ' + e.cat + ':' + e.key, e.src, l); });
          [PROMPT, PLACEHOLDER].forEach((T, i) => chk(['prompt', 'placeholder'][i], T[l], l));
          Object.entries(STALL_NAME).forEach(([st, T]) => { if (T[l]) chk('stall ' + st, T[l], l); });
          Object.entries(WHERE).forEach(([st, T]) => { if (T[l]) chk('where ' + st, T[l], l); });
          Object.values(GREET[l]).forEach(([s]) => chk('greet', s, l));
          Object.entries(WHY[l]).forEach(([k, s]) => (s.match(/[^]*/g) || []).forEach(x => chk('why ' + k, x.slice(1, -1), l)));
          const k = kitCJ(l), items = ITEMS.map(it => it.id).filter(id => cjWord(id, l) !== enNoun(id, false));
          const c = { stall: Object.keys(STALLS)[0], mimo: 'Mimo', items: items.slice(0, 3).map((id, i) => ({ id, n: i + 1 })), total: 7, coins: 3, mode: 'discount', hat: true, id: items[0], n: 12, key: Object.keys(GREET[l])[0] };
          for (const [key, T] of Object.entries(LINES)) if (T[l]) chk('line ' + key, cjSrc(T[l](c, k, l)), l);
          for (const id of items) { chk('qty ' + id, cjQty(12, id, l), l); for (const known of [false, true]) chk('model ' + id, modelCJ(id, l, { known, coins: 99 }).src, l); }
        }
        return out;
      },
    },
  };
})();
