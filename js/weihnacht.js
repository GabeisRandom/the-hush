'use strict';
// Fiete and the Weihnachtsmarkt (game/SIDES.md: the festival with a kid host). German games only: everything is hidden,
// silent and without prompts in every other language. The user: side content "that relates to the actual culture of the
// people"; the lead chose the Weihnachtsmarkt (everyone in Germany goes, it's cozy, and its lights against the dark fit
// the fight against the Hush). PG (Kinderpunsch, never Glühwein), cultural rather than religious: the market, the Advent
// calendar, Nikolaus, baking, presents.
//
// WHO: Fiete (FEE-tuh, a north German name), eight, in a mustard winter jacket, a red bobble hat (Pudelmütze) and red
//   rubber boots, with a paper star lantern on a stick. Grandson of Hilde (Adi's neighbour, the knitter; adolf.js). He
//   remembers the market Alba used to hold around the fountain, until the Hush put its lights out; nobody has sung since.
//   He calls himself the market's expert and counts everything. Catchphrase: «Juhu!»
// WHERE: Fiete at the shared festival-kid spot by the bell tower's north-east side (−22.5, −169.1), with his sled and his
//   handmade Advent calendar on an easel. The market in the plaza (the shared festival spot): six wooden stalls in a ring
//   around the fountain (between the walkers' path and the benches, clear of Nico and the two big trees) and a big
//   candle-driven Christmas pyramid between the fountain and the north street. Built in chapter 1, dark and shuttered
//   until the market night; open and lit after it. Fiete's boots stand by the nearest house door to his spot (chapter 3).
// CHAPTERS (gated like every side character: Rosa's welcome, the big Hushling on the hill, bells 1, 2, 3):
//   1 Die Buden: the six things (gebrannte Mandeln, Lebkuchenherz, Kinderpunsch, Bratwurst, Reibekuchen, Crêpe); the
//     stalls go up as you say «Hier gibt es …!»; the prices (drei Euro fünfzig); playing market: «Was darf's sein?» «Ich
//     hätte gern …» «Das macht … Euro.» «Danke, gleichfalls!», then you sell; Fiete's Adventskalender (24 doors, a small
//     task behind each, one ready every few minutes of play or each new day, across all the chapters)
//   2 Plätzchen backen with Marta the baker: she reads the recipe in the infinitive, you tell {mimo} in the imperative
//     (gib … dazu, knete, roll … aus, stich Sterne aus, leg, back, verzier); the shapes; «Das riecht so gut!»
//   3 Nikolaus: clean the boots and put them out (vor die Tür), Fiete's Nikolaus verse (original), the filled boots next
//     morning, the Wunschzettel («Ich wünsche mir …», «Ich hätte gern …», {mimo} wünscht sich …)
//   4 Geschenke: Wichteln («Ich schenke ihm / ihr / dir / Ihnen …» with the accusative), gingerbread hearts with your own
//     messages for Rosa, Bruno and Herr Otto (du or Sie), and one for {mimo}: a gingerbread-heart necklace
//   5 Die Marktnacht: night falls, the Hush hangs over the plaza and blows the candles out; you light the pyramid
//     (die erste, zweite, dritte, vierte Kerze) and the stalls one by one, singing «Das Lichterlied» (original) with
//     Fiete and the town; the music comes back layer by layer; the Hush turns into snow. {mimo}'s Pudelmütze, knitted by
//     Oma Hilde. Afterwards the market stays open: buy things at the stalls, and see it by night.
// API: WEIHNACHT.init(game) · .build(scene, env) → { colliders, group, people, update } · .update(dt, t, you) · .hatOn()
//   (main.js: the straw hat steps aside for the Pudelmütze) · .mapMark(dpr) (minimap.js) · .quest() · .busy · ._ (tests:
//   ._.t). State: G.state.wm. Phrases: ph.wm.*. Song: 'de_markt' «Budenzauber». Panels: weihnacht_ui.js (WUI). Uses
//   zhfolk.js (ZHF) for its 3D kit, the person rig and the music deck.

const WEIHNACHT = (() => {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const esc = s => WUI.esc(s);
  let G = null, B = null;
  const S = () => {
    const s = G.state; if (!s.wm) s.wm = {};
    const o = s.wm; o.ch = o.ch || {}; o.cal = o.cal || { open: 0, lastT: -1e9, day: '', done: {}, task: 0 }; o.gifts = o.gifts || {}; o.hearts = o.hearts || {}; o.given = o.given || {}; o.wishes = o.wishes || [];
    return o;
  };
  const isDe = () => !!(G && G.state && G.state.lang === 'de');
  const shown = () => !!(isDe() && G.state.flags && G.state.flags.hatched);
  const flags = () => (G && G.state && G.state.flags) || {};
  const mimo = () => (G && G.state && G.state.mimoName) || 'Mimo';
  const sub = s => String(s).split('{mimo}').join(mimo());
  const sfx = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* no audio yet */ } };
  const wait = s => WUI.wait(s);
  const has = (t, l) => WUI.has(t, l);
  const canon = s => WUI.canon(s);

  // ================================================================ the places
  // The plaza: the fountain at (−10, −146), r 3; the walkers' ring at r ≈ 6.3; benches at r 9.4; lamps at r 12.6; the big
  // trees at 135° and 315°; Nico at 45° (r 8.5); the streets meet it at 0° (east), 90° (south), 180° (west), 270° (north).
  const C = { x: -10, z: -146 };
  const ring = (a, r) => ({ x: C.x + Math.cos(a * Math.PI / 180) * r, z: C.z + Math.sin(a * Math.PI / 180) * r });
  const SPOT = { kid: { x: -22.5, z: -169.1, yaw: 0.7 }, sled: { x: -24.7, z: -169.5, yaw: 0.35 }, easel: { x: -23.7, z: -170.9, yaw: 0.62 },
    pyr: { x: -10, z: -150.4 }, you: { x: -9.2, z: -140.1 }, look: { x: -10, z: -149 } };
  const HUT_R = 8.0;

  // ================================================================ the six stalls (the market's ring, by angle)
  // price in cents; g: the noun's gender (pl: plural); acc: «I'd like …» with the right article; icon: its picture
  const STALLS = [
    { id: 'punsch', a: 205, sign: 'Kinderpunsch', noun: 'Kinderpunsch', art: 'der Kinderpunsch', g: 'm', acc: 'einen Kinderpunsch', price: 350, icon: 'wmPunsch',
      en: 'kids’ punch: hot, fruity and spicy, no alcohol', keys: ['kinderpunsch', 'punsch'], here: 'Hier gibt es Kinderpunsch!', vendor: 'Herr Zimt', vlook: { skin: '#e8b48a', hair: '#6b4a2a', shirt: '#7a4f8f', pants: '#2f3440', apron: '#fff8ec', hat: 'beanie', hatCol: '#3f8a5a', mustache: true },
      call: ['Kinderpunsch! Heiß und lecker, ganz ohne Alkohol!', 'Kids’ punch! Hot and tasty, no alcohol at all!'] },
    { id: 'mandeln', a: 225, sign: 'Gebrannte Mandeln', noun: 'Mandeln', art: 'gebrannte Mandeln', g: 'pl', acc: 'eine Tüte gebrannte Mandeln', price: 450, icon: 'wmMandeln',
      en: 'sugar-roasted almonds, in a paper bag (eine Tüte)', keys: ['gebrannte mandeln', 'mandeln', 'mandel'], here: 'Hier gibt es gebrannte Mandeln!', vendor: 'Frau Brenner', vlook: { skin: '#f0c7a0', hair: '#c98a4a', shirt: '#d6332a', pants: '#3f4a5a', apron: '#fff8ec', hat: 'beanie', hatCol: '#fff8ec', band: '#d6332a' },
      call: ['Gebrannte Mandeln! Frisch geröstet und noch warm!', 'Roasted almonds! Freshly roasted and still warm!'] },
    { id: 'herz', a: 245, sign: 'Lebkuchenherzen', noun: 'Lebkuchenherz', art: 'das Lebkuchenherz', g: 'n', acc: 'ein Lebkuchenherz', price: 300, icon: 'wmHerz',
      en: 'a gingerbread heart (with a message in icing)', keys: ['lebkuchenherz', 'lebkuchenherzen', 'lebkuchen'], here: 'Hier gibt es Lebkuchenherzen!', vendor: 'Frau Honig', vlook: { skin: '#c98e62', hair: '#2b2235', shirt: '#e8b23a', pants: '#5a3f2a', apron: '#fff8ec', hat: 'flat', hatCol: '#8a4f24' },
      call: ['Lebkuchenherzen! Mit Liebe gemacht!', 'Gingerbread hearts! Made with love!'] },
    { id: 'crepe', a: 290, sign: 'Crêpes', noun: 'Crêpe', art: 'die Crêpe', g: 'f', also: 'm', acc: 'eine Crêpe', price: 450, icon: 'wmCrepe',
      en: 'a crêpe, with sugar or chocolate (many people say «der Crêpe» too)', keys: ['crepe', 'crepes'], here: 'Hier gibt es Crêpes!', vendor: 'Herr Zucker', vlook: { skin: '#f5cda2', hair: '#e8e4dc', shirt: '#3f6fb5', pants: '#2f3440', apron: '#ffffff', hat: 'flat', hatCol: '#ffffff', glasses: true },
      call: ['Crêpes mit Zucker oder mit Schokolade!', 'Crêpes with sugar or with chocolate!'] },
    { id: 'wurst', a: 28, sign: 'Bratwurst', noun: 'Bratwurst', art: 'die Bratwurst', g: 'f', acc: 'eine Bratwurst', price: 400, icon: 'wmWurst',
      en: 'a grilled sausage in a bread roll, with mustard', keys: ['bratwurst', 'bratwurste', 'wurst'], here: 'Hier gibt es Bratwurst!', vendor: 'Herr Senf', vlook: { skin: '#e6b48c', hair: '#3a2b26', shirt: '#4f8a4a', pants: '#3f4a5a', apron: '#fff8ec', hat: 'flat', hatCol: '#3a3040', mustache: true, belly: true },
      call: ['Bratwurst vom Grill! Mit Senf und Brötchen!', 'Bratwurst off the grill! With mustard and a roll!'] },
    { id: 'reibe', a: 62, sign: 'Reibekuchen', noun: 'Reibekuchen', art: 'der Reibekuchen', g: 'm', acc: 'drei Reibekuchen', price: 500, icon: 'wmReibe',
      en: 'potato pancakes (also called Kartoffelpuffer), three with apple sauce', keys: ['reibekuchen', 'kartoffelpuffer', 'puffer'], here: 'Hier gibt es Reibekuchen!', vendor: 'Frau Knusper', vlook: { skin: '#f0c7a0', hair: '#4a2f27', shirt: '#c9553f', pants: '#2f3440', apron: '#fff8ec', hat: 'beanie', hatCol: '#e8b23a', band: '#c9553f' },
      call: ['Reibekuchen mit Apfelmus! Schön knusprig!', 'Potato pancakes with apple sauce! Nice and crispy!'] },
  ];
  const STALL = Object.fromEntries(STALLS.map(s => [s.id, s]));
  const ORDER = ['punsch', 'mandeln', 'herz', 'crepe', 'wurst', 'reibe'];     // (setting up and lighting: round from the bell tower's side)

  // ================================================================ the Phrasebook (LEX kind 'phrase', German)
  const REGION = 'Weihnachtsmarkt';
  const PH = [
    { id: 'ph.wm.wasdarf', de: 'Was darf’s sein?', en: 'What can I get you?', note: 'What every stallholder asks. «darf’s» is short for «darf es».', sit: 'You’re behind the counter and someone walks up. Ask what they’d like!', keys: ['was darfs sein', 'was darf es sein', 'was darf s sein'] },
    { id: 'ph.wm.hattegern', de: 'Ich hätte gern …', en: 'I’d like …', note: 'The polite way to order: «Ich hätte gern eine Bratwurst.» Softer than «Ich will …».', sit: 'Order a Bratwurst, politely.', model: 'Ich hätte gern eine Bratwurst.', keys: [['hatte gern', 'bratwurst'], ['hatte gerne', 'bratwurst'], ['mochte', 'bratwurst']] },
    { id: 'ph.wm.dasmacht', de: 'Das macht … Euro.', en: 'That comes to … euros.', note: 'How sellers tell you the total: «Das macht vier Euro fünfzig.»', sit: 'Someone buys two Bratwürste at 4 € each. Tell them the total!', model: 'Das macht acht Euro.', keys: [['macht', 'acht euro']] },
    { id: 'ph.wm.gleichfalls', de: 'Danke, gleichfalls!', en: 'Thanks, you too!', note: 'The answer to «Schönen Abend noch!» or «Frohe Weihnachten!»: it sends the wish right back.', sit: 'The stallholder says «Schönen Abend noch!». Send the wish back!', keys: ['gleichfalls', 'ebenfalls', 'dir auch', 'ihnen auch'] },
    { id: 'ph.wm.advent', de: 'Schönen Advent!', en: 'Have a lovely Advent!', note: 'A greeting for the four weeks before Christmas. On a Sunday: «Schönen ersten Advent!» (zweiten, dritten, vierten …).', sit: 'It’s the first Sunday of Advent and you meet a neighbor. Greet them!', keys: ['schonen advent', 'schonen ersten advent', 'frohen advent', 'einen schonen advent'] },
    { id: 'ph.wm.riecht', de: 'Das riecht so gut!', en: 'That smells so good!', note: 'riechen: to smell. «Hier riecht es nach Plätzchen!» (It smells of cookies in here!)', sit: 'The oven opens and the kitchen smells of cookies. Say so!', keys: ['riecht so gut', 'riecht gut', 'riecht lecker', 'riecht super', 'riecht toll'] },
    { id: 'ph.wm.mehr', de: 'Das schmeckt nach mehr!', en: 'That tastes like more! (I want another one!)', note: 'A cheerful way to say it’s delicious and you’d like seconds.', sit: 'You ate one cookie… and you want another. Say it the German way!', keys: ['schmeckt nach mehr'] },
    { id: 'ph.wm.wunsch', de: 'Ich wünsche mir …', en: 'I wish for … (as a present)', note: 'For wish lists and birthdays, with the accusative: «Ich wünsche mir einen Schlitten / eine Puppe / ein Buch.»', sit: 'Fiete asks what you’d like for Christmas. Wish for a sled (der Schlitten)!', model: 'Ich wünsche mir einen Schlitten.', keys: [['wunsche mir', 'einen schlitten']] },
    { id: 'ph.wm.mirkalt', de: 'Mir ist kalt!', en: 'I’m cold!', note: 'Literally «to me it is cold». «Ich bin kalt» would mean you’re a cold, unfriendly person!', sit: 'The wind blows through the market and you shiver. Say you’re cold!', keys: ['mir ist kalt', 'mir ist so kalt', 'mir ist es kalt'] },
    { id: 'ph.wm.schenke', de: 'Ich schenke dir …', en: 'I’m giving you … (as a present)', note: 'schenken: to give as a present. Who gets it: dative (dir, ihm, ihr, Ihnen). What you give: accusative (einen Schal).', sit: 'You give Fiete a ball (der Ball). Say it!', model: 'Ich schenke dir einen Ball.', keys: [['schenke dir', 'einen ball']] },
    { id: 'ph.wm.liebhab', de: 'Ich hab dich lieb!', en: 'I love you! (to family and friends)', note: 'Warm but not romantic: for parents, grandparents and best friends. You see it iced on lots of gingerbread hearts. «Ich liebe dich» is for sweethearts.', sit: 'You give your grandma a gingerbread heart. What could the icing say?', keys: ['hab dich lieb', 'habe dich lieb'] },
    { id: 'ph.wm.frohe', de: 'Frohe Weihnachten!', en: 'Merry Christmas!', note: 'The Christmas greeting. «Fröhliche Weihnachten!» works too.', sit: 'It’s Christmas! Wish everyone a merry Christmas.', keys: ['frohe weihnachten', 'frohliche weihnachten', 'schone weihnachten'] },
    { id: 'ph.wm.feiertage', de: 'Schöne Feiertage!', en: 'Happy holidays!', note: 'For everyone, whatever they celebrate: the days off at the end of the year.', sit: 'Wish a shopkeeper happy holidays as you leave.', keys: ['schone feiertage', 'frohe feiertage'] },
    { id: 'ph.wm.rutsch', de: 'Guten Rutsch!', en: 'Happy New Year! (said before it)', note: 'Literally «a good slide» (into the new year). Said in the days before 31 December.', sit: 'It’s 29 December and you say goodbye to a friend until next year. Wish them a good start!', keys: ['guten rutsch', 'einen guten rutsch'] },
    { id: 'ph.wm.satt', de: 'Ich bin satt.', en: 'I’m full.', note: 'satt: full (of food). Not «Ich bin voll», which means something else!', sit: 'Three potato pancakes and a crêpe later… you can’t eat any more. Say so!', keys: ['ich bin satt', 'bin satt', 'bin so satt'] },
    { id: 'ph.wm.gemuetlich', de: 'Wie gemütlich!', en: 'How cozy!', note: '«Gemütlich»: warm, snug and relaxed, all at once. A Christmas market at night is the most gemütlich place there is.', sit: 'Lights, snow, warm punch and music. Say how cozy it is!', keys: ['wie gemutlich', 'so gemutlich', 'gemutlich'] },
    { id: 'ph.wm.lichter', de: 'Lichter an!', en: 'Lights on!', note: 'What everyone shouts on the market night, when the stalls light up one by one.', sit: 'The market is dark, and it’s time. What do you shout?', keys: ['lichter an', 'licht an', 'mach die lichter an', 'macht die lichter an'] },
    { id: 'ph.wm.bescherung', de: 'Bescherung!', en: 'Present time! (on 24 December)', note: 'In Germany presents are opened on the evening of 24 December: the «Bescherung».', sit: 'It’s the evening of 24 December and everyone gathers around the presents. What time is it?', keys: ['bescherung'] },
  ];
  PH.forEach(p => { if (!p.model) p.model = p.de.replace(/ …$/, ''); });
  const PHI = Object.fromEntries(PH.map(p => [p.id, p]));
  const regPhrases = () => { if (typeof LEX !== 'undefined') LEX.register(PH.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', de: p.de, en: p.en, note: p.note, region: REGION, register: 'casual', icon: 'wmHerz', alt: { de: p.keys.filter(k => typeof k === 'string') } }))); };
  regPhrases();
  // into the Phrasebook (stage 3, "known"), its LEX review parked far ahead (Fiete quizzes you instead, like Adi does)
  function teach(id) {
    if (typeof LEX === 'undefined' || !LEX.item(id) || LEX.lang !== 'de') return;
    const s = LEX.st(id), t = Date.now() / 1000; LEX.expose(id);
    if (s.stage < 3) s.stage = 3;
    s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 1e8; s.last = t;
  }
  const keepFar = () => { if (typeof LEX === 'undefined' || LEX.lang !== 'de') return; const t = Date.now() / 1000; for (const p of PH) { if (!LEX.item(p.id)) continue; const s = LEX.st(p.id); if (s.stage >= 2 && s.due < t + 86400) s.due = t + 1e8; } };
  // key items in the bag
  const KEYS_ITEMS = [
    { id: 'k.wmTin', kind: 'key', de: 'Plätzchendose', en: 'a tin of Christmas cookies (Fiete’s)', icon: 'wmCookie' },
    { id: 'k.wmHeart', kind: 'key', de: 'Lebkuchenherz', en: 'gingerbread hearts to give away', icon: 'wmHerz' },
  ];
  if (typeof LEX !== 'undefined') LEX.register(KEYS_ITEMS.filter(k => !LEX.item(k.id)));
  const bag = (id, n) => { const b = G.state.bag || (G.state.bag = {}); if (n > 0) { b[id] = n; try { LEX.expose(id); } catch (e) { /* */ } } else delete b[id]; };

  // ================================================================ what they say (German first, the English under it)
  // [simple, richer] per line where it helps; A1–A2 early on, up to B1 by the market night; never about your gender
  const L = (de, en) => ({ de: [de], en: [en] });
  const LT = {
    // meeting Fiete
    'kid.hi': L('Hallo! Ich bin Fiete. Ich bin acht!', 'Hi! I’m Fiete. I’m eight!'),
    'kid.market': L('Weißt du was? Früher gab es hier einen Weihnachtsmarkt. Auf dem Platz, rund um den Brunnen!', 'Guess what? There used to be a Christmas market here. On the square, all around the fountain!'),
    'kid.lights': L('Mit Buden und Lichtern und gebrannten Mandeln … mmmh!', 'With stalls and lights and roasted almonds… mmmh!'),
    'kid.hush': L('Aber dann kam die Stille. Die Lichter gingen aus, und keiner hat mehr gesungen.', 'But then the Hush came. The lights went out, and nobody sang anymore.'),
    'kid.help': L('Ich baue den Markt wieder auf! Hilfst du mir?', 'I’m going to build the market back up! Will you help me?'),
    'kid.yay': L('Juhu! Dann sind wir jetzt ein Team!', 'Yay! Then we’re a team now!'),
    // chapter 1: the stalls
    'kid.here': L('Hier standen die Buden. Sechs Stück, im Kreis um den Brunnen!', 'This is where the stalls stood. Six of them, in a ring around the fountain!'),
    'kid.learn': L('Zuerst zeige ich dir, was es auf dem Markt gibt. Pass gut auf!', 'First I’ll show you what there is at the market. Pay close attention!'),
    'kid.build': L('Und jetzt bauen wir die Buden auf! Sag mir, was es hier gibt.', 'And now we put up the stalls! Tell me what there is here.'),
    'kid.pyr': L('Und in die Mitte kommt die Weihnachtspyramide! Die hat mein Opa gebaut.', 'And the Christmas pyramid goes in the middle! My grandpa built it.'),
    'kid.pyr2': L('Wenn die Kerzen brennen, dreht sie sich. Von ganz allein!', 'When the candles burn, it turns. All by itself!'),
    'kid.prices': L('Jetzt brauchen wir Preise. Ich schreibe, du sagst sie mir!', 'Now we need prices. I write, you tell me them!'),
    'kid.shop': L('Und jetzt spielen wir Markt! Ich verkaufe, und du kaufst ein.', 'And now let’s play market! I sell, and you do the shopping.'),
    'kid.swap': L('Jetzt tauschen wir! Du verkaufst, und ich kaufe.', 'Now we swap! You sell, and I buy.'),
    'kid.cal': L('Und das ist mein Adventskalender! Den habe ich selbst gebastelt.', 'And this is my Advent calendar! I made it myself.'),
    'kid.cal2': L('Hinter jedem Türchen ist eine kleine Aufgabe. Jeden Tag darf man ein Türchen aufmachen!', 'Behind every little door there’s a little task. Every day you’re allowed to open one door!'),
    'kid.done1': L('Die Buden stehen! Jetzt fehlen nur noch die Lichter … und die Leute.', 'The stalls are up! Now all that’s missing is the lights… and the people.'),
    // chapter 2: baking with Marta
    'kid.bake': L('Weißt du, was im Advent am besten riecht? Plätzchen! Komm, Marta backt mit uns!', 'Do you know what smells best in Advent? Cookies! Come on, Marta is baking with us!'),
    'marta.hi': L('Hallo, ihr zwei! Heute backen wir Butterplätzchen. Das Rezept ist von meiner Oma.', 'Hello, you two! Today we’re baking butter cookies. The recipe is my grandma’s.'),
    'marta.how': L('Ich lese das Rezept vor, und ihr sagt {mimo}, was es machen soll.', 'I’ll read the recipe out, and you tell {mimo} what to do.'),
    'marta.done': L('Wunderbar! So schöne Plätzchen habe ich lange nicht gesehen.', 'Wonderful! I haven’t seen such lovely cookies in a long time.'),
    'kid.tin': L('Vierundzwanzig Plätzchen! Eins für jeden Tag bis Weihnachten!', 'Twenty-four cookies! One for every day until Christmas!'),
    // chapter 3: Nikolaus
    'kid.nik': L('Morgen ist Nikolaus! Heute Abend stellen wir die Stiefel vor die Tür.', 'Tomorrow is Nikolaus! Tonight we put our boots out in front of the door.'),
    'kid.nik2': L('In der Nacht kommt der Nikolaus und füllt sie. Mit Nüssen, Mandarinen und Schokolade!', 'In the night Nikolaus comes and fills them. With nuts, mandarins and chocolate!'),
    'kid.nik3': L('Aber nur, wenn die Stiefel schön sauber sind!', 'But only if the boots are nice and clean!'),
    'kid.night': L('So, jetzt schnell ins Bett! Gute Nacht!', 'Right, now quick, off to bed! Good night!'),
    'kid.morning': L('Guten Morgen! Guck mal, die Stiefel sind voll!', 'Good morning! Look, the boots are full!'),
    'kid.who': L('Wer ist der Nikolaus wohl? Ich glaube … Herr Otto! Der hat so einen weißen Bart.', 'Who could Nikolaus be? I think… Mr Otto! He has that white beard.'),
    'kid.wish': L('Und jetzt der Wunschzettel! Für Weihnachten. Was wünschst du dir?', 'And now the wish list! For Christmas. What do you wish for?'),
    'kid.done3': L('Fertig! Den Wunschzettel lege ich heute Abend ans Fenster.', 'Done! Tonight I’ll put the wish list on the windowsill.'),
    // chapter 4: presents
    'kid.wichteln': L('Wir machen Wichteln! Jeder schenkt jemandem etwas. Aber alles ist geheim!', 'Let’s do Wichteln! Everyone gives somebody a present. But it’s all secret!'),
    'kid.dativ': L('Pass auf: Bruno bekommt es, also «ihm». Marta: «ihr». Ich: «dir». Und Frau Rosa, ganz höflich: «Ihnen».', 'Careful: Bruno gets it, so «ihm». Marta: «ihr». Me: «dir». And Mrs Rosa, very politely: «Ihnen».'),
    'kid.secret': L('Jetzt legen wir die Geschenke heimlich vor ihre Türen. Psst!', 'Now we secretly leave the presents in front of their doors. Shh!'),
    'kid.hearts': L('Auf dem Markt gibt es Lebkuchenherzen mit Sprüchen drauf. Wir machen welche für die Nachbarn!', 'At the market there are gingerbread hearts with sayings on them. Let’s make some for the neighbors!'),
    'kid.go': L('Bring die Herzen zu Oma Rosa, zu Bruno und zu Herrn Otto! Und sag, dass du sie ihnen schenkst.', 'Take the hearts to Grandma Rosa, to Bruno and to Mr Otto! And say you’re giving them to them.'),
    'kid.mimoheart': L('Und das letzte Herz ist für {mimo}! An einer Schleife, wie eine Kette.', 'And the last heart is for {mimo}! On a ribbon, like a necklace.'),
    'kid.done4': L('Alle haben sich gefreut! Schenken macht fast mehr Spaß als Bekommen.', 'Everyone was so happy! Giving is almost more fun than getting.'),
    'rosa.heart': L('Für mich? Ach, wie lieb! Das hänge ich in mein Fenster.', 'For me? Oh, how sweet! I’ll hang it in my window.'),
    'bruno.heart': L('Ha! Ein Lebkuchenherz! Das esse ich nach dem Training. Danke!', 'Ha! A gingerbread heart! I’ll eat it after training. Thanks!'),
    'otto.heart': L('Hohoho … ich meine: Oh, danke schön! Wie nett von Ihnen!', 'Ho ho ho… I mean: oh, thank you very much! How kind of you!'),
    'bruno.gift': L('Ein Geschenk vor meiner Tür? Von wem ist das denn?', 'A present in front of my door? Who’s that from?'),
    'marta.gift': L('Oh! Ein Päckchen! Ich habe einen Wichtel!', 'Oh! A little parcel! I have a secret Santa!'),
    'rosa.gift': L('Na so was! Ein Geschenk für mich? Wie schön!', 'Well, what do you know! A present for me? How lovely!'),
    // chapter 5: the market night
    'kid.tonight': L('Heute Abend ist es so weit! Heute machen wir den Weihnachtsmarkt auf!', 'Tonight’s the night! Tonight we open the Christmas market!'),
    'kid.song': L('Meine Oma hat mir das Lichterlied beigebracht. Früher hat ganz Alba es gesungen.', 'My grandma taught me the Lichterlied, the song of lights. All of Alba used to sing it.'),
    'kid.song2': L('Ich singe immer die erste Zeile, und du singst die zweite. Okay?', 'I always sing the first line, and you sing the second. Okay?'),
    'kid.dark': L('Es ist so dunkel … und so still.', 'It’s so dark… and so quiet.'),
    'kid.look': L('Da! Über dem Platz! Die Stille!', 'There! Over the square! The Hush!'),
    'kid.blown': L('Sie pustet die Kerzen aus! Wir müssen singen, ganz laut!', 'It’s blowing the candles out! We have to sing, really loud!'),
    'kid.pyrgo': L('Zünde die Kerzen an! Eine nach der anderen!', 'Light the candles! One after the other!'),
    'kid.turns': L('Sie dreht sich! Die Pyramide dreht sich!', 'It’s turning! The pyramid is turning!'),
    'kid.now': L('Jetzt die Buden! Sing mit mir!', 'Now the stalls! Sing with me!'),
    'kid.snow': L('Guck mal … es schneit! Die Stille ist zu Schnee geworden!', 'Look… it’s snowing! The Hush has turned into snow!'),
    'kid.thanks': L('Danke! Ohne dich hätte ich das nie geschafft.', 'Thank you! I could never have done it without you.'),
    'kid.hat': L('Das ist für {mimo}. Meine Oma Hilde hat die Mütze gestrickt. Für die kalten Abende!', 'This is for {mimo}. My grandma Hilde knitted the hat. For the cold evenings!'),
    'kid.hat2': L('Psst … ich habe auch eine. Jetzt sind wir Zwillinge!', 'Psst… I have one too. Now we’re twins!'),
    // chat
    'kid.idle1': L('Wusstest du? In Deutschland gibt es über zweitausend Weihnachtsmärkte!', 'Did you know? There are over two thousand Christmas markets in Germany!'),
    'kid.idle2': L('Mein Lieblingsessen auf dem Markt? Gebrannte Mandeln. Und Reibekuchen. Und Crêpes. Und …', 'My favorite food at the market? Roasted almonds. And potato pancakes. And crêpes. And…'),
    'kid.idle3': L('Weihnachtspyramiden kommen aus dem Erzgebirge. Da wohnen die besten Holzschnitzer!', 'Christmas pyramids come from the Ore Mountains. That’s where the best woodcarvers live!'),
    'kid.idle4': L('Der Nussknacker kommt auch aus dem Erzgebirge. Knack!', 'The nutcracker comes from the Ore Mountains too. Crack!'),
    'kid.idle5': L('Einer der ältesten Weihnachtsmärkte ist in Dresden: der Striezelmarkt. Den gibt es seit fast 600 Jahren!', 'One of the oldest Christmas markets is in Dresden: the Striezelmarkt. It’s been going for almost 600 years!'),
    'kid.idle6': L('Der Markt ist wieder da, und die Stille ist weg. Fast wie früher!', 'The market is back, and the Hush is gone. Almost like before!'),
    'kid.wait': L('Warte! Ich bin noch nicht so weit. Geh erst mal auf Abenteuer!', 'Wait! I’m not ready yet. Go on an adventure first!'),
    'kid.door': L('Ein neues Türchen! Komm, mach es auf!', 'A new little door! Come on, open it!'),
    'kid.doorDone': L('Super! Das Türchen ist geschafft!', 'Great! That door is done!'),
    // the Advent doors' people
    'rosa.door': L('Danke, dir auch! Wie lieb von dir.', 'Thanks, you too! How sweet of you.'),
    'bruno.door': L('Lebkuchen? Ich liebe Lebkuchen! Aber nur nach dem Training.', 'Gingerbread? I love gingerbread! But only after training.'),
    'marta.door': L('Stollen? Ja, ganz frisch! Mit Rosinen und Mandeln.', 'Stollen? Yes, really fresh! With raisins and almonds.'),
    'lucas.door': L('Eine Brezel? Bitte schön! Die geht aufs Haus.', 'A pretzel? Here you go! It’s on the house.'),
    'hilde.door': L('Psst! Eine Mütze. Für wen? Das ist ein Geheimnis!', 'Shh! A hat. Who for? That’s a secret!'),
    'otto.door': L('Ich? Der Nikolaus? Hohoho … nein, nein!', 'Me? Nikolaus? Ho ho ho… no, no!'),
    'vera.door': L('Ein Tannenzweig für den Adventskranz? Gern! Bitte schön.', 'A fir branch for the Advent wreath? Gladly! Here you go.'),
    'kalle.door': L('Eine Schneeballschlacht? Oh nein … na gut, ja! Aber nicht ins Gesicht!', 'A snowball fight? Oh no… okay, fine! But not in the face!'),
    'tito.door': L('Ein Weihnachtslied? Klar! Hör mal …', 'A Christmas song? Sure! Listen…'),
    'adi.door': L('Frohe Weihnachten! Ich bringe gerade die Weihnachtskarten. So viele!', 'Merry Christmas! I’m just delivering the Christmas cards. So many!'),
    'emil.door': L('Gefroren? Noch nicht! Aber bald kann man hier Schlittschuh laufen.', 'Frozen? Not yet! But soon you’ll be able to skate here.'),
    // buying at the open market
    'v.hi': L('Guten Abend! Was darf’s sein?', 'Good evening! What can I get you?'),
    'v.bye': L('Danke schön! Schönen Abend noch!', 'Thank you! Have a lovely evening!'),
  };
  const lineOf = (key, vars) => {
    const v = LT[key]; if (!v) return { de: key, en: key };
    const tier = typeof LEX !== 'undefined' && LEX.tier ? LEX.tier() : 1, n = Math.max(1, Math.min(tier, v.de.length)) - 1;
    let de = sub(v.de[n]), en = sub(v.en[Math.min(n, v.en.length - 1)]);
    if (vars) for (const [a, b] of Object.entries(vars)) { de = de.split('{' + a + '}').join(b); en = en.split('{' + a + '}').join(b); }
    return { de, en };
  };
  const regLines = () => { if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES['wm.' + k]) LINES['wm.' + k] = v; };

  // ================================================================ the Lichterlied (original), Fiete's Nikolaus verse (original)
  // couplets: [first line (Fiete and the town), second line (you), English]
  const SONG = {
    intro: ['Die Stille kam in unsre Stadt,', 'bis keiner mehr gesungen hat.', 'The Hush came into our town, until nobody sang anymore.'],
    light: ['Doch hör mal hin: ein kleines Licht!', 'Die Stille, nein, die mag es nicht!', 'But listen: a little light! The Hush, oh no, it doesn’t like it!'],
    pyr: ['Wir zünden eine Kerze an,', 'damit die Stille gehen kann.', 'We light a candle, so that the Hush can go.'],
    punsch: ['Der Punsch ist heiß, die Bude glüht,', 'und Alba singt ein neues Lied.', 'The punch is hot, the stall glows, and Alba sings a new song.'],
    mandeln: ['Gebrannte Mandeln, süß und warm,', 'wir singen alle, Arm in Arm.', 'Roasted almonds, sweet and warm, we all sing, arm in arm.'],
    herz: ['Ein Herz aus Lebkuchen für dich,', 'und eins für mich, und eins für mich!', 'A gingerbread heart for you, and one for me, and one for me!'],
    crepe: ['Die Crêpes, die duften durch die Nacht,', 'die Stille hat sich weggemacht.', 'The crêpes smell sweet through the night, the Hush has slipped away.'],
    wurst: ['Die Wurst vom Grill, die zischt und brät,', 'zum Singen ist es nie zu spät!', 'The sausage on the grill sizzles and fries; it’s never too late to sing!'],
    reibe: ['Reibekuchen, knusprig, heiß,', 'wir singen laut, nicht still und leis!', 'Potato pancakes, crispy, hot; we sing loud, not still and quiet!'],
    end: ['Jetzt leuchtet alles, hell und klar:', 'der Weihnachtsmarkt ist wieder da!', 'Now everything shines, bright and clear: the Christmas market is back!'],
  };
  const SONG_ORDER = ['intro', 'light', 'pyr', 'punsch', 'mandeln', 'herz', 'crepe', 'wurst', 'reibe', 'end'];
  const VERSE = [
    ['Lieber Nikolaus, komm her,', 'Dear Nikolaus, come here,'],
    ['meine Stiefel sind noch leer.', 'my boots are still empty.'],
    ['Hab sie blank geputzt für dich,', 'I polished them shiny for you,'],
    ['bitte, bitte, denk an mich!', 'please, please, remember me!'],
  ];
  // the words that must be there for a sung or recited line to count (the rest may be a little off)
  const lineKeys = s => { const T = WUI.toks(s), big = T.filter(w => w.length >= 4); return [big.length >= 2 ? big : T]; };

  // ================================================================ Wichteln: the people, their pronoun, three presents each
  const GIFT = {
    ball: { de: 'Ball', g: 'm', icon: 'wmBall', en: 'a ball' }, schal: { de: 'Schal', g: 'm', icon: 'wmScarf', en: 'a scarf' },
    tasse: { de: 'Tasse', g: 'f', icon: 'wmMug', en: 'a mug' }, kerze: { de: 'Kerze', g: 'f', icon: 'wmCandle', en: 'a candle' },
    buch: { de: 'Buch', g: 'n', icon: 'wmBook', en: 'a book' }, puzzle: { de: 'Puzzle', g: 'n', icon: 'wmPuzzle', en: 'a jigsaw puzzle' },
  };
  const ACC = { m: 'einen', f: 'eine', n: 'ein' };
  const WICHTEL = [
    { id: 'bruno', name: 'Bruno', pro: 'ihm', third: true, gifts: ['ball', 'tasse', 'buch'], ask: ['Was schenkst du Bruno?', 'What are you giving Bruno?'], en: 'him' },
    { id: 'baker', name: 'Marta', pro: 'ihr', third: true, gifts: ['schal', 'kerze', 'buch'], ask: ['Und Marta? Was schenkst du ihr?', 'And Marta? What are you giving her?'], en: 'her' },
    { id: 'fiete', name: 'Fiete', pro: 'dir', gifts: ['ball', 'tasse', 'puzzle'], ask: ['Und mir? Sag es mir direkt!', 'And me? Tell me directly!'], en: 'you (Fiete)' },
    { id: 'rosa', name: 'Frau Rosa', pro: 'Ihnen', polite: true, gifts: ['schal', 'kerze', 'puzzle'], ask: ['Und Oma Rosa? Sag es ihr direkt, ganz höflich!', 'And Grandma Rosa? Tell her directly, very politely!'], en: 'you (Rosa, polite)' },
  ];
  // the hearts' people: who, du or Sie, how to find them
  const HEARTS = [
    { id: 'rosa', name: 'Oma Rosa', where: 'npc:rosa', sie: true, reply: 'rosa.heart', top: 1.85 },
    { id: 'bruno', name: 'Bruno', where: 'npc:bruno', sie: false, reply: 'bruno.heart', top: 2.05 },
    { id: 'otto', name: 'Herr Otto', where: 'town:otto', sie: true, reply: 'otto.heart' },
  ];
  // presents for a wish list: gender per noun (canon'd), for «Ich wünsche mir einen / eine / ein …»
  const WISHN = { schlitten: 'm', ball: 'm', fussball: 'm', teddy: 'm', teddybar: 'm', hund: 'm', roller: 'm', schal: 'm', pullover: 'm', rucksack: 'm', drachen: 'm', computer: 'm', hamster: 'm', malkasten: 'm', kalender: 'm', kuchen: 'm', keks: 'm', laptop: 'm', fernseher: 'm', schneemann: 'm', stern: 'm', ring: 'm', rennwagen: 'm', dinosaurier: 'm', zug: 'm', bagger: 'm',
    puppe: 'f', katze: 'f', mutze: 'f', gitarre: 'f', tasse: 'f', kerze: 'f', uhr: 'f', eisenbahn: 'f', trommel: 'f', jacke: 'f', blume: 'f', geige: 'f', kamera: 'f', schokolade: 'f', torte: 'f', reise: 'f', konsole: 'f', spielkonsole: 'f', kette: 'f', tasche: 'f', mundharmonika: 'f', flote: 'f', brille: 'f', lampe: 'f',
    buch: 'n', fahrrad: 'n', spiel: 'n', puzzle: 'n', pony: 'n', handy: 'n', auto: 'n', pferd: 'n', skateboard: 'n', klavier: 'n', bild: 'n', kleid: 'n', zelt: 'n', tablet: 'n', geschenk: 'n', kaninchen: 'n', meerschweinchen: 'n', haus: 'n', boot: 'n', einhorn: 'n', videospiel: 'n', brettspiel: 'n', lebkuchenherz: 'n', platzchen: 'n', fernglas: 'n', teleskop: 'n', instrument: 'n', schwert: 'n',
    socken: 'pl', handschuhe: 'pl', bucher: 'pl', kekse: 'pl', stifte: 'pl', schuhe: 'pl', ferien: 'pl', schlittschuhe: 'pl', ski: 'pl', murmeln: 'pl', sussigkeiten: 'pl', mandeln: 'pl' };

  // ================================================================ the Advent calendar's 24 doors
  // here: answered right on the card; say: go and say it to someone (who: 'npc:id' | 'town:id' | 'adolf:id'), they answer
  const DOORS = [
    { n: 1, pic: 'star', kind: 'here', q: ['Sag mal: «Schönen Advent!»', 'Say: «Have a lovely Advent!»'], model: 'Schönen Advent!', keys: PHI['ph.wm.advent'].keys, ph: 'ph.wm.advent' },
    { n: 2, pic: 'wmCandle', kind: 'say', who: 'npc:rosa', name: 'Oma Rosa', task: 'Wish Grandma Rosa a lovely Advent', model: 'Einen schönen Advent, Frau Rosa!', keys: ['advent'], reply: 'rosa.door' },
    { n: 3, pic: 'wmSnowman', kind: 'here', q: ['Es ist weiß und kalt und fällt im Winter vom Himmel. Was ist das?', 'It’s white and cold and falls from the sky in winter. What is it?'], model: 'Der Schnee!', keys: ['schnee'] },
    { n: 4, pic: 'wmHerz', kind: 'say', who: 'npc:bruno', name: 'Bruno', task: 'Ask Bruno if he likes gingerbread', model: 'Magst du Lebkuchen?', keys: [['magst', 'lebkuchen'], ['mogen sie', 'lebkuchen']], reply: 'bruno.door' },
    { n: 5, pic: 'wmCandle', kind: 'here', q: ['Am Adventskranz brennt jeden Sonntag eine Kerze mehr. Wie viele Kerzen brennen am zweiten Advent?', 'On the Advent wreath one more candle burns every Sunday. How many burn on the second Sunday of Advent?'], model: 'Zwei Kerzen!', num: 2 },
    { n: 6, pic: 'bread', kind: 'say', who: 'npc:baker', name: 'Marta', task: 'Ask Marta if she has Stollen (the Christmas fruit loaf)', model: 'Hast du Stollen?', keys: ['stollen'], reply: 'marta.door' },
    { n: 7, pic: 'wmSnowman', kind: 'here', q: ['Ich habe einen Bauch aus Schnee und eine Nase aus Karotte. Wer bin ich?', 'I have a tummy made of snow and a carrot for a nose. Who am I?'], model: 'Ein Schneemann!', keys: ['schneemann'] },
    { n: 8, pic: 'bread', kind: 'say', who: 'town:lucas', name: 'Lucas', task: 'Ask Lucas, at the bread stall, for a pretzel', model: 'Eine Brezel, bitte!', keys: ['brezel', 'breze'], reply: 'lucas.door' },
    { n: 9, pic: 'tree', kind: 'here', q: ['Wie heißt der Monat mit Weihnachten?', 'What’s the name of the month with Christmas in it?'], model: 'Dezember!', keys: ['dezember'] },
    // (once Hilde has offered «du» in Adi's chapter 5, adolf.js state.adolf.duHilde, the door asks with «du»)
    { n: 10, pic: 'wmMuetze', kind: 'say', who: 'adolf:hilde', name: 'Hilde',
      get task() { return G && G.state && G.state.adolf && G.state.adolf.duHilde ? 'Ask Hilde (Adi’s neighbour, Fiete’s grandma) what she’s knitting; you two are on «du» now' : 'Ask Hilde (Adi’s neighbour, Fiete’s grandma) what she’s knitting; politely, with «Sie»'; },
      get model() { return G && G.state && G.state.adolf && G.state.adolf.duHilde ? 'Was strickst du?' : 'Was stricken Sie?'; },
      keys: ['stricken sie', 'strickst du', 'strickst', 'stricken'], reply: 'hilde.door',
      get sie() { return !(G && G.state && G.state.adolf && G.state.adolf.duHilde); } },
    { n: 11, pic: 'wmScarf', kind: 'here', q: ['Brrr! Der Wind ist eisig. Was sagst du?', 'Brrr! The wind is icy. What do you say?'], model: 'Mir ist kalt!', keys: PHI['ph.wm.mirkalt'].keys, ph: 'ph.wm.mirkalt', trap: 'ich bin kalt' },
    { n: 12, pic: 'wmBoot', kind: 'say', who: 'town:otto', name: 'Herr Otto', task: 'Ask Mr Otto, on his bench in the plaza, if he’s Nikolaus (politely: «Sie»)', model: 'Sind Sie der Nikolaus?', keys: ['nikolaus'], reply: 'otto.door', sie: true },
    { n: 13, pic: 'wmHerz', kind: 'here', q: ['Ich bin braun und süß und manchmal ein Herz. Was bin ich?', 'I’m brown and sweet and sometimes a heart. What am I?'], model: 'Lebkuchen!', keys: ['lebkuchen', 'lebkuchenherz'] },
    { n: 14, pic: 'tree', kind: 'say', who: 'town:vera', name: 'Vera', task: 'Ask Vera, at the flower stall, for a fir branch', model: 'Einen Tannenzweig, bitte!', keys: ['tannenzweig', 'tannenzweige', 'zweig'], reply: 'vera.door' },
    { n: 15, pic: 'wmReibe', kind: 'here', q: ['Drei Reibekuchen und zwei Crêpes … Fiete fragt: «Noch einen?» Was sagst du?', 'Three potato pancakes and two crêpes… Fiete asks: «Another one?» What do you say?'], model: 'Nein danke, ich bin satt!', keys: ['satt'], ph: 'ph.wm.satt', trap: 'bin voll' },
    { n: 16, pic: 'wmSnowman', kind: 'say', who: 'adolf:kalle', name: 'Kalle', task: 'Ask Kalle, at Adi’s garden table, if he’ll join a snowball fight', model: 'Machst du bei der Schneeballschlacht mit?', keys: ['schneeballschlacht', 'schneeball', 'schneeballe'], reply: 'kalle.door' },
    { n: 17, pic: 'wmPunsch', kind: 'here', q: ['Fiete: «Ich habe Durst, und mir ist kalt!» Was empfiehlst du ihm?', 'Fiete: «I’m thirsty, and I’m cold!» What do you suggest?'], model: 'Einen Kinderpunsch!', keys: ['kinderpunsch', 'punsch', 'kakao', 'heisse schokolade', 'tee'] },
    { n: 18, pic: 'wmGift', kind: 'say', who: 'town:tito', name: 'Tito', task: 'Ask Tito, with his guitar in the plaza, to play a Christmas song', model: 'Spiel ein Weihnachtslied, bitte!', keys: ['weihnachtslied', 'lied'], reply: 'tito.door', music: true },
    { n: 19, pic: 'wmGift', kind: 'here', q: ['Wie sagt man «Happy holidays!» auf Deutsch?', 'How do you say «Happy holidays!» in German?'], model: 'Schöne Feiertage!', keys: PHI['ph.wm.feiertage'].keys, ph: 'ph.wm.feiertage' },
    { n: 20, pic: 'letter', kind: 'say', who: 'adolf:adi', name: 'Adi', task: 'Wish Adi the postman a merry Christmas', model: 'Frohe Weihnachten, Adi!', keys: PHI['ph.wm.frohe'].keys, reply: 'adi.door', ph: 'ph.wm.frohe' },
    { n: 21, pic: 'wmNut', kind: 'here', q: ['Ich bin aus Holz, ich trage eine Uniform, und ich knacke Nüsse mit dem Mund. Wer bin ich?', 'I’m made of wood, I wear a uniform, and I crack nuts with my mouth. Who am I?'], model: 'Der Nussknacker!', keys: ['nussknacker'] },
    { n: 22, pic: 'wmSnowman', kind: 'say', who: 'town:emil', name: 'Emil', task: 'Ask Emil, the angler, if the pond is frozen', model: 'Ist der Teich gefroren?', keys: ['gefroren', 'zugefroren', 'eis'], reply: 'emil.door' },
    { n: 23, pic: 'wmCookie', kind: 'here', q: ['Was wünscht man vor Silvester? «Einen guten …»', 'What do you wish people before New Year’s Eve? «A good…»'], model: 'Guten Rutsch!', keys: ['rutsch'], ph: 'ph.wm.rutsch' },
    { n: 24, pic: 'wmPyramide', kind: 'here', q: ['Das letzte Türchen! Heute ist der 24. Dezember. Am Abend gibt es die Bescherung! Was wünschst du allen?', 'The last door! Today is 24 December. In the evening comes the «Bescherung», presents! What do you wish everyone?'], model: 'Frohe Weihnachten!', keys: PHI['ph.wm.frohe'].keys.concat(['schone feiertage']), ph: 'ph.wm.bescherung', big: true },
  ];
  const CAP = [0, 5, 10, 15, 20, 23];       // doors you may open by the chapters done (the 24th: after the market night)
  const DOOR_GAP = 240;                     // seconds of play between doors (or a new day)

  // ================================================================ 3D: the stalls, the pyramid, the lights, Fiete and his spot
  const INK = '#2b2235';
  const ROOF4 = new THREE.ConeGeometry(1, 1, 4).rotateY(Math.PI / 4);      // a stall's roof: a low pyramid over the rectangle
  const SPHERE = new THREE.SphereGeometry(1, 10, 8);
  const toWorld = (P, yaw, lx, lz) => ({ x: P.x + lx * Math.cos(yaw) + lz * Math.sin(yaw), z: P.z - lx * Math.sin(yaw) + lz * Math.cos(yaw) });
  const halo = (color, size) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })); m.scale.setScalar(size); m.renderOrder = 3; return m; };
  const flame = () => new THREE.Mesh(SPHERE, new THREE.MeshBasicMaterial({ color: '#ffd66a' }));
  const BULB = ['#ff6a5a', '#ffd23f', '#7ee08f', '#7cc4ff', '#ffb0e0'];
  // a string of bulbs from a to b ([x, y, z]), sagging: the wire into k, the bulbs into kOn (lit) and kOff (dark)
  function strand(k, kOn, kOff, a, b, n, sag, seed = 0) {
    const P = u => [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - sag * 4 * u * (1 - u), lerp(a[2], b[2], u)];
    for (let i = 0; i < 10; i++) k.rod(P(i / 10), P((i + 1) / 10), 0.01, INK, { ink: 0 });
    for (let i = 1; i < n; i++) { const [x, y, z] = P(i / n); kOn.ball(x, y - 0.05, z, 0.05, 0.065, 0.05, BULB[(i + seed) % BULB.length], { glow: true }); kOff.ball(x, y - 0.05, z, 0.045, 0.06, 0.045, '#d8d2c4', { ink: 0 }); }
  }
  const signTex = (S0) => ZHF.canvasTex(512, 132, (c, w, h) => {
    if (typeof SIGNS !== 'undefined' && SIGNS.paint) SIGNS.paint(c, w, h, { text: S0.sign, edge: '#8b5a2b', face: '#fff4dc', ink: '#8f1d2c', icon: S0.icon, size: 0.56 });
    else { c.fillStyle = '#fff4dc'; c.fillRect(0, 0, w, h); c.fillStyle = '#8f1d2c'; c.font = '800 64px Bahnschrift'; c.textAlign = 'center'; c.fillText(S0.sign, w / 2, 86); }
  });
  const closedTex = () => ZHF.canvasTex(256, 112, (c, w, h) => {
    c.fillStyle = '#fffaf0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c8322a'; c.lineWidth = 8; c.strokeRect(5, 5, w - 10, h - 10);
    c.fillStyle = '#2b2235'; c.textAlign = 'center'; c.font = '800 40px Bahnschrift, sans-serif'; c.fillText('Bald', w / 2, 50); c.font = '800 34px Bahnschrift, sans-serif'; c.fillText('geöffnet!', w / 2, 90);
  });
  // goods on a stall's counter, by stall (local frame: x across, y up, z toward the front; the counter top is at y 1.15)
  function goods(k, id) {
    const T = 1.16;
    if (id === 'punsch') { k.cyl(-0.55, T + 0.18, 0.72, 0.27, 0.34, '#c8322a', { ink: 0.01 }).cyl(-0.55, T + 0.355, 0.72, 0.25, 0.02, '#8f1d2c', { ink: 0 }).rod([-0.4, T + 0.3, 0.72], [-0.2, T + 0.6, 0.6], 0.015, '#c9c4b8', { ink: 0 }); [0.15, 0.4, 0.65].forEach((x, i) => k.cyl(x, T + 0.06, 0.8, 0.065, 0.12, i % 2 ? '#3f8fd9' : '#c8322a', { ink: 0.006 })); }
    else if (id === 'mandeln') { k.add(ZHF.GEO.half, '#d9893a', -0.5, T + 0.02, 0.72, 0.32, 0.26, 0.32, Math.PI, 0, 0, { ink: 0.01 }).ball(-0.5, T + 0.05, 0.72, 0.26, 0.04, 0.26, '#a8582a', { ink: 0 }); for (let i = 0; i < 5; i++) k.cone(0.05 + i * 0.17, T + 0.13, 0.78, 0.065, 0.22, '#fdf6e6', { rx: Math.PI, ink: 0.005 }).ball(0.05 + i * 0.17, T + 0.25, 0.78, 0.055, 0.03, 0.055, '#b5652e', { ink: 0 }); }
    else if (id === 'herz') { for (let i = 0; i < 3; i++) k.box(-0.6 + i * 0.6, T + 0.03, 0.78, 0.3, 0.05, 0.22, '#9a5a2a', { ink: 0.006 }); }
    else if (id === 'crepe') { k.cyl(-0.45, T + 0.04, 0.74, 0.34, 0.07, '#4a4a52', { ink: 0.01 }).cyl(-0.45, T + 0.085, 0.74, 0.29, 0.012, '#f1d08a', { ink: 0 }).cyl(0.35, T + 0.08, 0.78, 0.07, 0.16, '#5a3420', { ink: 0.006 }).cyl(0.6, T + 0.09, 0.78, 0.05, 0.18, '#fffaf0', { ink: 0.006 }); }
    else if (id === 'wurst') { k.box(-0.2, T + 0.06, 0.74, 1.5, 0.1, 0.36, '#2b2235', { ink: 0.008 }); for (let i = 0; i < 5; i++) k.rod([-0.75 + i * 0.27, T + 0.14, 0.66], [-0.75 + i * 0.27, T + 0.14, 0.86], 0.04, '#b5532e', { ink: 0.006 }); k.ball(0.85, T + 0.08, 0.76, 0.12, 0.07, 0.09, '#e2b06a', { ink: 0.006 }); }
    else if (id === 'reibe') { k.box(-0.3, T + 0.04, 0.74, 1.1, 0.06, 0.4, '#4a4a52', { ink: 0.008 }); for (let i = 0; i < 6; i++) k.cyl(-0.72 + (i % 3) * 0.28, T + 0.08, 0.66 + Math.floor(i / 3) * 0.17, 0.08, 0.02, '#e3a440', { ink: 0.004 }); k.add(ZHF.GEO.half, '#f3e1b0', 0.6, T + 0.01, 0.78, 0.13, 0.1, 0.13, 0, 0, 0, { ink: 0.006 }); }
  }
  function hut(S0, idx) {
    const P = ring(S0.a, HUT_R), yaw = Math.atan2(C.x - P.x, C.z - P.z), g = new THREE.Group();
    g.position.set(P.x, B.GY, P.z); g.rotation.y = yaw; g.visible = false; B.root.add(g);
    const body = new THREE.Group(); g.add(body);
    const k = ZHF.Kit(), WOOD = '#b98450', DARK = '#7e5230', TRIM = '#efd9ad', ROOF = idx % 2 ? '#2f6d48' : '#a8432f';
    k.box(0, 0.06, 0, 2.5, 0.12, 1.7, DARK, { ink: 0.012 });
    k.box(0, 1.2, -0.76, 2.36, 2.2, 0.1, WOOD, { ink: 0.014 });
    for (let i = 0; i < 5; i++) k.box(0, 0.32 + i * 0.42, -0.7, 2.3, 0.025, 0.02, DARK, { ink: 0 });
    for (const s of [-1, 1]) { k.box(s * 1.16, 1.2, 0, 0.1, 2.2, 1.6, WOOD, { ink: 0.014 }); k.box(s * 1.16, 1.2, 0.8, 0.13, 2.2, 0.13, DARK, { ink: 0.012 }); }
    k.box(0, 0.62, 0.76, 2.36, 0.98, 0.1, WOOD, { ink: 0.014 }).box(0, 1.12, 0.8, 2.56, 0.08, 0.46, TRIM, { ink: 0.012 }).box(0, 2.3, 0.8, 2.5, 0.14, 0.14, DARK, { ink: 0.012 });
    for (let i = 0; i < 4; i++) k.box(-0.9 + i * 0.6, 0.62, 0.82, 0.04, 0.9, 0.02, DARK, { ink: 0 });
    const roofM = (sx, sy, sz) => new THREE.Matrix4().compose(V3(0, 2.37 + sy / 2, 0), new THREE.Quaternion(), V3(sx, sy, sz));
    k.P.push({ geo: ROOF4, color: ROOF, m: roofM(1.42 / 0.7071, 0.86, 1.08 / 0.7071) });
    k.H.push({ geo: ROOF4, color: INK, m: roofM(1.46 / 0.7071, 0.9, 1.12 / 0.7071) });
    // the fir garland along the roof's front edge, its bulbs, the lamp inside
    const kOn = ZHF.Kit(), kOff = ZHF.Kit();
    for (let i = 0; i < 13; i++) { const x = -1.32 + i * 0.22; k.ball(x, 2.36, 1.1, 0.11, 0.09, 0.09, i % 2 ? '#2f7a3f' : '#3d8a4a', { ink: 0.006 }); if (i % 2 === 0) { kOn.ball(x, 2.27, 1.16, 0.045, 0.06, 0.045, BULB[(i / 2 + idx) % BULB.length], { glow: true }); kOff.ball(x, 2.27, 1.16, 0.04, 0.055, 0.04, '#d8d2c4', { ink: 0 }); } }
    k.ball(1.3, 2.3, 1.12, 0.1, 0.1, 0.06, '#c8322a', { ink: 0.006 }).ball(-1.3, 2.3, 1.12, 0.1, 0.1, 0.06, '#c8322a', { ink: 0.006 });
    kOn.ball(0, 2.08, 0.1, 0.09, 0.09, 0.09, '#ffe2a0', { glow: true });
    ZHF.bake(body, k);
    const lit = new THREE.Group(), dark = new THREE.Group(); body.add(lit, dark); ZHF.bake(lit, kOn); ZHF.bake(dark, kOff); lit.visible = false;
    const inner = halo('#ffc870', 1.3); inner.position.set(0, 2.16, 0.05); lit.add(inner);
    const front = halo('#ffb860', 2.6); front.position.set(0, 1.25, 1.35); lit.add(front);
    // the sign on the roof's front; it glows once the stall is lit
    const tex = signTex(S0), sign = ZHF.plane(2.05, 0.53, tex); sign.position.set(0, 2.68, 1.02); body.add(sign);
    const signLit = new THREE.MeshBasicMaterial({ map: tex }), signDay = sign.material;
    // the shutter (a flap hinged at the top: down while closed, up as an awning when open) and its little paper sign
    const shut = new THREE.Group(); shut.position.set(0, 2.25, 0.86); body.add(shut);
    const ks = ZHF.Kit(); ks.box(0, -0.5, 0, 2.28, 1.0, 0.05, WOOD, { ink: 0.01 }); for (let i = 0; i < 4; i++) ks.box(-0.85 + i * 0.57, -0.5, 0.03, 0.04, 0.96, 0.02, DARK, { ink: 0 }); ZHF.bake(shut, ks);
    const closed = ZHF.plane(0.62, 0.27, closedTex()); closed.position.set(0, -0.48, 0.04); shut.add(closed);
    // the goods (only while it's open) and the stallholder
    const gd = new THREE.Group(), kg = ZHF.Kit(); goods(kg, S0.id); ZHF.bake(gd, kg); gd.visible = false; body.add(gd);
    if (S0.id === 'herz') { const ht = new THREE.CanvasTexture(WUI.art.heart('', 96)); for (let i = 0; i < 6; i++) { const h = ZHF.plane(0.26, 0.25, ht, { alpha: true, double: true }); h.position.set(-0.85 + i * 0.34, 1.86 + (i % 2) * 0.12, 0.62); gd.add(h); } }
    const vp = toWorld(P, yaw, 0, -0.3), v = ZHF.person(Object.assign({}, S0.vlook)); v.id = 'v-' + S0.id; v.nameSrc = S0.vendor; v.x = vp.x; v.z = vp.z; v.y = B.GY + 0.12; v.yaw = v.baseYaw = yaw; v.noTurn = true; v.story = true; v.hidden = true; v.root.visible = false; B.root.add(v.root);
    const col = { obox: 1, x: P.x, z: P.z, hw: 1.32, hd: 0.98, rot: yaw }; col.x0 = col.x; col.z0 = col.z; B.colliders.push(col);
    const counter = toWorld(P, yaw, 0, 1.75);
    return { S0, g, body, P, yaw, lit, dark, inner, front, sign, signLit, signDay, shut, closed, gd, v, col, counter, built: false, open: false, on: false, pop: 1, shutA: 0 };
  }
  function pyramid() {
    const P = SPOT.pyr, g = new THREE.Group(); g.position.set(P.x, B.GY, P.z); g.visible = false; B.root.add(g);
    const k = ZHF.Kit(), W1 = '#dcb27a', W2 = '#9a6238', GREEN = '#2f7a4a';
    k.add(ZHF.GEO.cyl8, W2, 0, 0.14, 0, 1.0, 0.28, 1.0, 0, Math.PI / 8, 0, { ink: 0.016 }).add(ZHF.GEO.cyl8, GREEN, 0, 0.3, 0, 1.03, 0.05, 1.03, 0, Math.PI / 8, 0, { ink: 0 });
    k.cyl(0, 2.15, 0, 0.055, 3.8, W2, { ink: 0.008 });
    const CAND = [], fl = [];
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, x = Math.cos(a) * 0.8, z = Math.sin(a) * 0.8; k.cyl(x, 0.35, z, 0.085, 0.06, '#e8c35a', { ink: 0.006 }).cyl(x, 0.55, z, 0.05, 0.36, '#fffaf0', { ink: 0.008 }); CAND.push({ x, z }); }
    ZHF.bake(g, k);
    CAND.forEach(c => { const f = flame(); f.scale.set(0.035, 0.07, 0.035); f.position.set(c.x, 0.8, c.z); f.visible = false; const h = halo('#ffc060', 0.9); h.position.set(c.x, 0.82, c.z); g.add(f, h); fl.push({ f, h }); });
    // the turning part: three plates with their figures, the posts, the propeller and the star
    const spin = new THREE.Group(); g.add(spin);
    const ks = ZHF.Kit(), TIERS = [[1.0, 1.12], [1.9, 0.86], [2.7, 0.6]];
    TIERS.forEach(([y, r], i) => {
      ks.cyl(0, y, 0, r, 0.06, W1, { ink: 0.01 }).cyl(0, y + 0.035, 0, r + 0.02, 0.02, GREEN, { ink: 0 });
      const y2 = i < 2 ? TIERS[i + 1][0] : 3.3;
      for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + i * 0.3; ks.rod([Math.cos(a) * (r - 0.05), y + 0.03, Math.sin(a) * (r - 0.05)], [Math.cos(a) * (r * 0.72), y2, Math.sin(a) * (r * 0.72)], 0.018, W2, { ink: 0 }); }
    });
    for (let j = 0; j < 4; j++) {      // plate 1: miners with their lamps (Erzgebirge style) and little fir trees
      const a = j * Math.PI / 2, x = Math.cos(a) * 0.82, z = Math.sin(a) * 0.82, b = a + Math.PI / 4, tx = Math.cos(b) * 0.82, tz = Math.sin(b) * 0.82;
      ks.cyl(x, 1.17, z, 0.07, 0.26, '#2b2235', { ink: 0.006 }).ball(x, 1.36, z, 0.06, 0.06, 0.06, '#f5cda2', { ink: 0.005 }).add(ZHF.GEO.half, '#2b2235', x, 1.39, z, 0.065, 0.05, 0.065, 0, 0, 0, { ink: 0 }).ball(x + Math.cos(a) * 0.08, 1.2, z + Math.sin(a) * 0.08, 0.03, 0.03, 0.03, '#ffd23f', { glow: true });
      ks.cone(tx, 1.22, tz, 0.11, 0.36, GREEN, { ink: 0.006 });
    }
    for (let j = 0; j < 4; j++) { const a = j * Math.PI / 2 + 0.4, x = Math.cos(a) * 0.6, z = Math.sin(a) * 0.6; ks.ball(x, 2.0, z, 0.085, 0.085, 0.085, '#ffffff', { ink: 0.006 }).ball(x, 2.13, z, 0.06, 0.06, 0.06, '#ffffff', { ink: 0.005 }).cyl(x, 2.21, z, 0.04, 0.06, INK, { ink: 0 }); }
    for (let j = 0; j < 3; j++) { const a = j * TAU / 3, x = Math.cos(a) * 0.38, z = Math.sin(a) * 0.38; ks.box(x, 2.8, z, 0.16, 0.14, 0.14, '#f4e3c6', { ry: -a, ink: 0.005 }).cone(x, 2.93, z, 0.13, 0.12, '#c8322a', { ry: Math.PI / 4 - a, ink: 0.004 }).box(x + Math.cos(a) * 0.072, 2.8, z + Math.sin(a) * 0.072, 0.05, 0.05, 0.01, '#ffd23f', { ry: Math.PI / 2 - a, glow: true }); }
    ks.cyl(0, 3.32, 0, 0.22, 0.05, W1, { ink: 0.008 }).cyl(0, 3.42, 0, 0.07, 0.16, W2, { ink: 0.006 });
    for (let j = 0; j < 8; j++) { const a = j / 8 * TAU; ks.box(Math.cos(a) * 0.62, 3.52, Math.sin(a) * 0.62, 0.2, 0.02, 0.66, W1, { rz: 0.55, ry: Math.PI / 2 - a, ink: 0.005 }); }
    ks.ball(0, 3.75, 0, 0.09, 0.09, 0.09, '#f2c14e', { ink: 0.006 }); for (let j = 0; j < 6; j++) ks.cone(Math.cos(j / 6 * TAU) * 0.13, 3.75 + Math.sin(j / 6 * TAU) * 0.13, 0, 0.04, 0.12, '#f2c14e', { rz: j / 6 * TAU - Math.PI / 2, ink: 0.004 });
    ZHF.bake(spin, ks);
    const top = halo('#ffe08a', 1.2); top.position.set(0, 3.75, 0); g.add(top);
    const col = { x: P.x, z: P.z, r: 1.05 }; col.x0 = col.x; col.z0 = col.z; B.colliders.push(col);
    return { g, spin, fl, top, col, lit: 0, w: 0, built: false };
  }
  // light strings from the pyramid's top to each stall's roof, and the plaza's eight lamps' glow
  function canopy() {
    const k = ZHF.Kit(), P = SPOT.pyr, top = [P.x, B.GY + 3.6, P.z], out = [];
    for (const H0 of B.huts) {
      const kOn = ZHF.Kit(), kOff = ZHF.Kit(), apex = [H0.P.x, B.GY + 3.15, H0.P.z];
      strand(k, kOn, kOff, top, apex, 11, 0.55, B.huts.indexOf(H0));
      const on = new THREE.Group(), off = new THREE.Group(); ZHF.bake(on, kOn); ZHF.bake(off, kOff); on.visible = false; out.push({ on, off, H0 });
    }
    const wires = new THREE.Group(); ZHF.bake(wires, k);
    const g = new THREE.Group(); g.add(wires); out.forEach(o => g.add(o.on, o.off)); g.visible = false; B.root.add(g);
    const lamps = [22, 68, 112, 158, 202, 248, 292, 338].map(a => { const p = ring(a, 12.6), h = halo('#ffd890', 2.4); h.position.set(p.x, B.GY + 3.25, p.z); B.root.add(h); return h; });
    return { g, strands: out, lamps };
  }
  // ---------------- Fiete: a mustard jacket, a red bobble hat, a striped scarf, red boots, mittens on a string, a star lantern
  function makeKid() {
    const p = ZHF.person({ kid: true, skin: '#f5cda2', hair: '#c97a3a', hat: 'beanie', hatCol: '#d6332a', band: '#fffaf0', shirt: '#e8b23a', sleeve: '#e8b23a', pants: '#3f5f8f', shoes: '#d6332a', collar: '#fffaf0' });
    const kh = ZHF.Kit(); kh.ball(0, 0.33, -0.02, 0.1, 0.1, 0.1, '#fffaf0', { ink: 0.008 }); for (const s of [-1, 1]) kh.ball(s * 0.07, 0.12, 0.26, 0.022, 0.016, 0.01, '#c9763a', { ink: 0 }); ZHF.bake(p.head, kh);
    const kb = ZHF.Kit(), cy = p.hipY + 0.5 + 0.02;
    kb.add(ZHF.GEO.tor, '#d6332a', 0, cy, 0, 0.255, 0.235, 0.45, Math.PI / 2, 0, 0, { ink: 0 });
    for (let i = 0; i < 4; i++) kb.box(0.1, cy - 0.08 - i * 0.07, 0.265, 0.09, 0.07, 0.03, i % 2 ? '#fffaf0' : '#d6332a', { ink: 0.004 });
    ZHF.bake(p.body, kb);
    p.arms.forEach(a => { const m = ZHF.Kit(); m.ball(0, 0, 0, 0.075, 0.07, 0.075, '#3f8a5a', { ink: 0.008 }); ZHF.bake(a.userData.hand, m); });
    const lan = new THREE.Group(), kl = ZHF.Kit(); kl.rod([0, 0, 0], [0, 0.62, 0.12], 0.012, '#8a5f3e', { ink: 0 }).rod([0, 0.62, 0.12], [0, 0.56, 0.2], 0.006, INK, { ink: 0 });
    ZHF.bake(lan, kl);
    const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), new THREE.MeshBasicMaterial({ color: '#ffd76a' })); star.position.set(0, 0.48, 0.2); star.scale.set(1, 1.15, 0.55); lan.add(star);
    const sh = halo('#ffd27a', 0.7); sh.position.copy(star.position); lan.add(sh);
    p.arms[1].userData.hand.add(lan); p.lantern = { g: lan, star, halo: sh };
    p.id = 'fiete'; p.nameSrc = 'Fiete'; p.name = 'Fiete'; p.x = SPOT.kid.x; p.z = SPOT.kid.z; p.yaw = p.baseYaw = SPOT.kid.yaw; p.story = true; p.kidP = true;
    return p;
  }
  // the sled and the Advent calendar on its easel (the calendar's picture repaints when a door opens)
  function spot() {
    const k = ZHF.Kit(), S1 = SPOT.sled, gy = B.gy(S1.x, S1.z);
    k.frame(S1.x, gy, S1.z, S1.yaw);
    for (const s of [-1, 1]) { k.rod([s * 0.32, 0.05, -0.62], [s * 0.32, 0.05, 0.5], 0.03, '#c8322a', { ink: 0.006 }).rod([s * 0.32, 0.05, 0.5], [s * 0.32, 0.22, 0.68], 0.03, '#c8322a', { ink: 0.006 }); for (const z of [-0.45, 0.3]) k.rod([s * 0.32, 0.05, z], [s * 0.3, 0.26, z], 0.022, '#9a6238', { ink: 0 }); }
    for (let i = 0; i < 5; i++) k.box(0, 0.28, -0.5 + i * 0.24, 0.78, 0.04, 0.18, '#d9a35a', { ink: 0.008 });
    k.box(0, 0.34, -0.1, 0.36, 0.1, 0.3, '#2f7fc9', { ink: 0.006 }).box(0, 0.34, -0.1, 0.06, 0.11, 0.31, '#ffd23f', { ink: 0 });
    const E0 = SPOT.easel, ey = B.gy(E0.x, E0.z); k.frame(E0.x, ey, E0.z, E0.yaw);
    k.rod([-0.36, 0, -0.1], [-0.26, 1.42, 0], 0.025, '#8a5f3e').rod([0.36, 0, -0.1], [0.26, 1.42, 0], 0.025, '#8a5f3e').rod([0, 0, 0.32], [0, 1.32, 0.02], 0.025, '#8a5f3e').box(0, 0.52, 0.04, 0.8, 0.04, 0.12, '#8a5f3e');
    k.free(); ZHF.bake(B.root, k);
    const cv = WUI.art.calendar({ open: 0 }, 360), tex = new THREE.CanvasTexture(cv), pl = ZHF.plane(0.86, 0.74, tex);
    pl.position.set(E0.x + Math.sin(E0.yaw) * 0.08, ey + 1.0, E0.z + Math.cos(E0.yaw) * 0.08); pl.rotation.set(-0.1, E0.yaw, 0, 'YXZ'); B.root.add(pl);
    B.cal = { cv, tex, pl, key: '' };
    B.colliders.push(Object.assign({ x: S1.x, z: S1.z, r: 0.55 }, { x0: S1.x, z0: S1.z }), Object.assign({ x: E0.x, z: E0.z, r: 0.35 }, { x0: E0.x, z0: E0.z }));
  }
  function calRefresh() {
    if (!B || !B.cal) return;
    const st = S(), c = st.cal, key = c.open + ':' + (doorReady() ? 1 : 0);
    if (B.cal.key === key) return; B.cal.key = key;
    const cv = WUI.art.calendar({ open: c.open, ready: doorReady(), pics: DOORS.map(d => d.pic) }, 360), ctx = B.cal.cv.getContext('2d');
    ctx.clearRect(0, 0, B.cal.cv.width, B.cal.cv.height); ctx.drawImage(cv, 0, 0); B.cal.tex.needsUpdate = true;
  }
  // ---------------- Fiete's boots by his front door (the nearest Alba house to his spot); filled on Nikolaus morning
  function bootsAt() {
    const want = { x: -20, z: -174 }; let best = null, bd = 1e9, n = 0;
    if (typeof TOWN !== 'undefined' && TOWN.layout) for (const b of TOWN.layout.buildings) { if (b.kind !== 'house') continue; n++; if (!b.doorAt || b.blue || [9, 13, 15].includes(n)) continue; const d = Math.hypot(b.doorAt.x - want.x, b.doorAt.z - want.z); if (d < bd) { bd = d; best = b; } }
    if (!best || bd > 16) return { x: -23.4, z: -163.4, yaw: 0, door: { x: -24.2, z: -164.2 } };
    const fx = Math.sin(best.rot), fz = Math.cos(best.rot), d = best.doorAt;     // (doorAt is 1.1 in front of the door, on the street's edge: no tall grass)
    return { x: d.x - fx * 0.2 + fz * 0.65, z: d.z - fz * 0.2 - fx * 0.65, yaw: best.rot, door: { x: d.x - fx * 1.1, z: d.z - fz * 1.1 }, front: { x: d.x + fx * 1.2, z: d.z + fz * 1.2 } };
  }
  function boots() {
    const A = bootsAt(), g = new THREE.Group(); g.position.set(A.x, B.gy(A.x, A.z), A.z); g.rotation.y = A.yaw; g.scale.setScalar(1.3); g.visible = false; B.root.add(g);
    const k = ZHF.Kit();
    for (const s of [-1, 1]) { const x = s * 0.13; k.cyl(x, 0.2, -0.02, 0.075, 0.3, '#d6332a', { ink: 0.008 }).box(x, 0.05, 0.05, 0.15, 0.1, 0.26, '#d6332a', { ink: 0.008 }).box(x, 0.012, 0.05, 0.16, 0.025, 0.27, INK, { ink: 0 }); }
    k.cyl(0.42, 0.11, 0, 0.05, 0.2, '#7ee08f', { ink: 0.006 }).box(0.42, 0.03, 0.05, 0.1, 0.06, 0.16, '#7ee08f', { ink: 0.006 }).cyl(0.42, 0.2, 0, 0.055, 0.04, '#fffaf0', { ink: 0 });
    ZHF.bake(g, k);
    const fill = new THREE.Group(), kf = ZHF.Kit();
    for (const s of [-1, 1]) { const x = s * 0.13; kf.ball(x - 0.02, 0.4, -0.02, 0.06, 0.06, 0.06, '#f28a1e', { ink: 0.005 }).ball(x + 0.04, 0.38, 0.02, 0.035, 0.03, 0.04, '#a8673a', { ink: 0.004 }).box(x + 0.03, 0.43, -0.05, 0.05, 0.12, 0.03, '#c8322a', { ink: 0.004 }); }
    kf.box(0.42, 0.26, 0, 0.07, 0.07, 0.02, '#e0a25a', { ink: 0.004 });
    ZHF.bake(fill, kf); fill.visible = false; g.add(fill);
    return { g, fill, A };
  }
  // ---------------- {mimo}'s presents: the Pudelmütze (chapter 5) and the gingerbread-heart necklace (chapter 4)
  let HAT = null, NECK = null;
  function mimoBits() {
    if (!G || !G.cast || !G.cast.mimo || !G.cast.mimo.body) return;
    if (!HAT) {
      const g = new THREE.Group(); g.position.set(0, 0.55, -0.05); g.rotation.set(-0.22, 0, 0.1);
      const k = ZHF.Kit(); k.add(ZHF.GEO.half, '#d6332a', 0, 0.02, 0, 0.19, 0.17, 0.19, 0, 0, 0, { ink: 0.01 }).add(ZHF.GEO.tor, '#fffaf0', 0, 0.02, 0, 0.19, 0.19, 0.3, Math.PI / 2, 0, 0, { ink: 0 });
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; k.box(Math.cos(a) * 0.12, 0.12, Math.sin(a) * 0.12, 0.025, 0.06, 0.025, '#fffaf0', { ry: -a, ink: 0 }); }
      k.ball(0, 0.22, 0, 0.075, 0.075, 0.075, '#fffaf0', { ink: 0.008 });
      ZHF.bake(g, k); g.visible = false; G.cast.mimo.body.add(g); HAT = g;
    }
    if (!NECK) {
      const g = new THREE.Group(), k = ZHF.Kit(); k.add(ZHF.GEO.tor, '#d6332a', 0, 0.2, 0.0, 0.33, 0.33, 0.12, Math.PI / 2 + 0.28, 0, 0, { ink: 0 });
      ZHF.bake(g, k);
      const h = ZHF.plane(0.17, 0.16, new THREE.CanvasTexture(WUI.art.heart('', 96)), { alpha: true, double: true }); h.position.set(0, 0.12, 0.345); h.rotation.x = -0.25; g.add(h);
      g.visible = false; G.cast.mimo.body.add(g); NECK = g;
    }
  }
  const hatOn = () => !!(isDe() && G.state.wm && G.state.wm.hat && !G.state.wm.hatOff && !(typeof ADOLF !== 'undefined' && ADOLF.capOn && ADOLF.capOn()));
  const neckOn = () => !!(isDe() && G.state.wm && G.state.wm.neck && !G.state.wm.neckOff);
  // ---------------- the night (a dark dome, stars, the lights' glow), the snow, the Hush over the plaza
  const NIGHT = { k: 0, want: 0, dome: null, stars: null, lights: null, snow: null, snowK: 0, snowWant: 0 };
  function nightBuild() {
    if (NIGHT.dome) return;
    const geo = new THREE.SphereGeometry(520, 24, 14), cols = [], pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i) / 520, c = new THREE.Color('#0b1230').lerp(new THREE.Color('#2a2f5c'), clamp(1 - y * 1.6, 0, 1)); cols.push(c.r, c.g, c.b); }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    NIGHT.dome = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    NIGHT.dome.renderOrder = -0.5; NIGHT.dome.frustumCulled = false; G.w3d.scene.add(NIGHT.dome);
    const sp = []; for (let i = 0; i < 420; i++) { const a = Math.random() * TAU, e = 0.12 + Math.random() * 1.3, r = 500; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
    NIGHT.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#fff6dc', size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, fog: false }));
    NIGHT.stars.frustumCulled = false; NIGHT.stars.renderOrder = -0.4; G.w3d.scene.add(NIGHT.stars);
    for (const o of G.w3d.scene.children) { if (o.isHemisphereLight) NIGHT.hemi = o; else if (o.isDirectionalLight) NIGHT.sun = o; }
    // the snow: soft flakes in a big cylinder around the plaza, falling and drifting
    const N = 900, fp = new Float32Array(N * 3), seed = [];
    for (let i = 0; i < N; i++) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * 22; fp[i * 3] = C.x + Math.cos(a) * r; fp[i * 3 + 1] = Math.random() * 14; fp[i * 3 + 2] = C.z + Math.sin(a) * r; seed.push({ v: 0.5 + Math.random() * 0.7, ph: Math.random() * TAU }); }
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
    const ft = TK.canvasTex(32, 32, c => { const g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); });
    NIGHT.snow = new THREE.Points(fg, new THREE.PointsMaterial({ map: ft, color: '#ffffff', size: 0.16, transparent: true, opacity: 0, depthWrite: false }));
    NIGHT.snow.frustumCulled = false; NIGHT.snow.userData.seed = seed; B.root.add(NIGHT.snow);
  }
  // every frame (after the world's own light and fog): the night's share k darkens the sky, the lights and the fog
  const FOG_NIGHT = new THREE.Color('#141a38');
  function nightFrame(dt, t) {
    NIGHT.k = damp(NIGHT.k, NIGHT.want, 1.4, dt); if (NIGHT.k < 0.002 && NIGHT.want === 0) NIGHT.k = 0;
    NIGHT.snowK = damp(NIGHT.snowK, NIGHT.snowWant, 0.8, dt);
    if (!NIGHT.dome) return;
    const k = NIGHT.k, cam = G.w3d.camera;
    NIGHT.dome.visible = NIGHT.stars.visible = k > 0.001; NIGHT.dome.material.opacity = k; NIGHT.stars.material.opacity = k * 0.9;
    NIGHT.dome.position.copy(cam.position); NIGHT.stars.position.copy(cam.position);
    if (k > 0.001) {
      if (NIGHT.hemi) NIGHT.hemi.intensity *= 1 - 0.62 * k; if (NIGHT.sun) NIGHT.sun.intensity *= 1 - 0.8 * k;
      const f = G.w3d.scene.fog; if (f) { f.color.lerp(FOG_NIGHT, k * 0.92); f.near *= 1 - 0.3 * k; }
    }
    const sn = NIGHT.snow; sn.visible = NIGHT.snowK > 0.01; sn.material.opacity = NIGHT.snowK * 0.95;
    if (sn.visible) {
      const a = sn.geometry.attributes.position, sd = sn.userData.seed;
      for (let i = 0; i < sd.length; i++) { let y = a.getY(i) - dt * sd[i].v; if (y < B.GY) y += 14; a.setY(i, y); a.setX(i, a.getX(i) + Math.sin(t * 0.7 + sd[i].ph) * dt * 0.25); }
      a.needsUpdate = true;
    }
  }
  // the Hush over the plaza: a huge sleepy gray cloud in a nightcap that blows the lights out
  function makeStille() {
    if (B.stille) return B.stille;
    const g = new THREE.Group(), body = new THREE.Group(), k = ZHF.Kit(), GR1 = '#9d98ab', GR2 = '#b4afbf';
    [[0, 0, 0, 2.2], [-1.9, -0.3, 0.2, 1.6], [1.9, -0.25, 0.1, 1.7], [-0.9, 0.9, -0.3, 1.5], [1.0, 0.95, -0.2, 1.4], [0, -0.6, 0.9, 1.5], [-2.9, -0.6, -0.3, 1.0], [2.9, -0.5, -0.4, 1.1]].forEach(([x, y, z, r], i) => k.ball(x, y, z, r, r * 0.82, r * 0.9, i % 2 ? GR2 : GR1, { ink: 0.05 }));
    k.cone(-0.5, 2.2, -0.4, 1.0, 2.3, '#8f8a9d', { rz: 0.75, ink: 0.04 }).ball(-1.85, 2.75, -0.4, 0.35, 0.35, 0.35, '#d8d4e0', { ink: 0.03 });
    for (const s of [-1, 1]) k.ball(s * 0.75, 0.25, 1.95, 0.42, 0.16, 0.12, '#eef0ff', { glow: true });
    const baked = ZHF.bake(body, k); g.add(body);
    if (baked.mesh) { baked.mesh.material = baked.mesh.material.clone(); baked.mesh.material.emissive = new THREE.Color('#5a5670'); }     // (gray even in the dark)
    const mouth = new THREE.Mesh(SPHERE, new THREE.MeshBasicMaterial({ color: '#3a3444' })); mouth.position.set(0, -0.55, 2.05); mouth.scale.set(0.3, 0.12, 0.08); g.add(mouth);
    g.position.set(C.x, 14, C.z - 2); g.scale.setScalar(0.01); g.visible = false; B.root.add(g);
    B.stille = { g, body, mouth, blow: 0, flinch: 0, s: 1, sWant: 1, y: 11.5 };
    return B.stille;
  }
  function stilleFrame(dt, t) {
    const H0 = B.stille; if (!H0 || !H0.g.visible) return;
    H0.s = damp(H0.s, H0.sWant, 1.6, dt); H0.flinch = Math.max(0, H0.flinch - dt * 1.8); H0.blow = Math.max(0, H0.blow - dt);
    H0.g.scale.setScalar(Math.max(0.01, H0.s * (1 - H0.flinch * 0.12)));
    H0.g.position.y = H0.y + Math.sin(t * 0.9) * 0.35 + H0.flinch * 0.8;
    H0.g.rotation.z = Math.sin(t * 0.6) * 0.05; H0.body.rotation.y = Math.sin(t * 0.4) * 0.12;
    const b = H0.blow > 0 ? Math.sin(Math.min(1, H0.blow) * Math.PI) : 0;
    H0.mouth.scale.set(0.3 - b * 0.12, 0.12 + b * 0.22, 0.08);
  }

  // ================================================================ build
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    const root = new THREE.Group(); root.name = 'weihnacht'; root.visible = false; scene.add(root);
    B = { root, gy, GY: (typeof TOWN !== 'undefined' && TOWN.GY) || 0.25, colliders: [], people: [] };
    B.huts = STALLS.map((S0, i) => hut(S0, i));
    B.hutOf = Object.fromEntries(B.huts.map(h => [h.S0.id, h]));
    B.pyr = pyramid();
    B.can = canopy();
    spot();
    B.boots = boots();
    const kid = makeKid(); kid.y = gy(kid.x, kid.z); root.add(kid.root); B.kid = kid;
    B.people.push(kid, ...B.huts.map(h => h.v));
    return { colliders: B.colliders, group: root, people: B.people, update };
  }

  // ================================================================ what the market looks like right now
  // From the save (chapter 1: the stalls and the pyramid are up, shut and dark; after the market night: open and lit), or,
  // while a scene stages it (LOOK.staged), whatever the scene sets.
  const LOOK = { up: {}, open: {}, lit: {}, pyrUp: false, pyrLit: 0, boots: false, filled: false, lamps: false, staged: false };
  function lookFromState(st) {
    const up = st.up || {}, five = !!st.ch[5], one = !!st.ch[1];
    for (const id of ORDER) { LOOK.up[id] = one || !!up[id]; LOOK.open[id] = five; LOOK.lit[id] = five; }
    LOOK.pyrUp = one || !!up.pyr; LOOK.pyrLit = five ? 4 : 0; LOOK.boots = !!(st.ch[3] || st.bootsOut); LOOK.filled = !!(st.ch[3] || st.filled); LOOK.lamps = five;
  }
  function applyLook(dt, t) {
    for (const h of B.huts) {
      const id = h.S0.id, up = !!LOOK.up[id];
      if (up && !h.built) { h.built = true; h.pop = h.popNow ? 0 : 1; h.popNow = false; }
      if (!up) h.built = false;
      h.g.visible = h.built;
      if (h.pop < 1) { h.pop = Math.min(1, h.pop + dt * 1.5); h.body.scale.set(1, Math.max(0.02, easeOutBack(h.pop)), 1); } else h.body.scale.set(1, 1, 1);
      h.open = !!LOOK.open[id]; h.on = !!LOOK.lit[id];
      h.shutA = damp(h.shutA, h.open ? -1.35 : 0, 4, dt); h.shut.rotation.x = h.shutA;
      h.gd.visible = h.open; h.lit.visible = h.on; h.dark.visible = !h.on; h.closed.visible = !h.open;
      h.sign.material = h.on && NIGHT.k > 0.25 ? h.signLit : h.signDay;
      const fl = 0.86 + Math.sin(t * 7.3 + h.S0.a) * 0.07 + Math.sin(t * 13.1 + h.S0.a * 2) * 0.05;
      h.inner.material.opacity = h.on ? (0.12 + 0.3 * NIGHT.k) * fl : 0; h.front.material.opacity = h.on ? 0.28 * NIGHT.k * fl : 0;
    }
    const P = B.pyr; P.built = !!LOOK.pyrUp; P.g.visible = P.built;
    P.fl.forEach((f, i) => { const lit = i < LOOK.pyrLit; f.f.visible = lit; f.f.scale.set(0.035, 0.07 * (0.85 + Math.sin(t * 11 + i * 1.7) * 0.15), 0.035); f.h.material.opacity = lit ? 0.35 + 0.5 * NIGHT.k : 0; });
    P.w = damp(P.w, [0, 0.22, 0.45, 0.7, 0.95][LOOK.pyrLit] || 0, 0.7, dt); P.spin.rotation.y += dt * P.w; P.top.material.opacity = LOOK.pyrLit >= 4 ? 0.25 + 0.5 * NIGHT.k : 0;
    B.can.g.visible = P.built;
    B.can.strands.forEach(s => { const lit = !!LOOK.lit[s.H0.S0.id]; s.on.visible = lit; s.off.visible = !lit; });
    B.can.lamps.forEach(h => { h.material.opacity = LOOK.lamps ? 0.6 * NIGHT.k : 0; });
    B.boots.g.visible = !!LOOK.boots; B.boots.fill.visible = !!LOOK.filled;
  }

  // ================================================================ every frame
  const FEST = { on: false, night: false, snow: false, level: 0, mask: 63, kidAway: false };     // (the market night's set piece)
  const EVE = { on: false };                                                                      // (an evening at the open market)
  const MUS = { mask: 63 };
  let waveT = 3, hopT = 0, busyN = 0;
  function update(dt, t, you) {
    if (!B) return;
    const on = shown() && !(G.indoors && G.indoors()), Y = G.sim.you, st = on ? S() : null;
    const dPl = Math.hypot(Y.x - C.x, Y.z - C.z), near = on && (FEST.on || dPl < 150);
    B.root.visible = near;
    for (const h of B.huts) h.col.x = h.col.x0 + (on && h.built ? 0 : 1e5);
    B.pyr.col.x = B.pyr.col.x0 + (on && B.pyr.built ? 0 : 1e5);
    for (const c of B.colliders) if (c !== B.pyr.col && !B.huts.some(h => h.col === c)) c.x = c.x0 + (on ? 0 : 1e5);
    B.kid.hidden = !on || FEST.kidAway; B.kid.root.visible = !B.kid.hidden;
    for (const h of B.huts) { h.v.hidden = !(on && h.open); h.v.root.visible = !h.v.hidden; }
    mimoBits(); if (HAT) HAT.visible = hatOn(); if (NECK) NECK.visible = neckOn();
    if (EVE.on && (!on || dPl > 46)) eveOff();
    NIGHT.want = on && (FEST.night || EVE.on) ? 1 : 0; NIGHT.snowWant = on && (FEST.snow || EVE.on) ? 1 : 0;
    if (NIGHT.want > 0 && !NIGHT.dome) nightBuild();
    nightFrame(dt, t);
    if (!on) { ZHF.music.want('wm', null, 0); ZHF.music.frame(t); return; }
    if (!LOOK.staged) lookFromState(st);
    applyLook(dt, t); stilleFrame(dt, t); calRefresh();
    // the music: the market night's layers, an evening's visit, and the open market (softly, near the plaza)
    let lvl = 0;
    if (FEST.on) lvl = FEST.level; else if (EVE.on || SING.on) lvl = 0.4; else if (st.ch[5] && !(STORY.busy && !busyN)) lvl = 0.3 * (1 - smoothstep(8, 19, dPl));
    MUS.mask = FEST.on ? FEST.mask : 63;
    ZHF.music.want('wm', 'de_markt', lvl, FEST.on ? { duck: 0.05 } : {}); ZHF.music.frame(t);
    if (!near) return;
    // Fiete: waves now and then, hops, swings his lantern; the stallholders bob behind their counters
    const k = B.kid, scene = typeof STORY !== 'undefined' && STORY.busy;
    if (!FEST.on && !k.away) {
      if (!scene && (waveT -= dt) <= 0) { waveT = 4 + Math.random() * 5; k.pose = 'wave'; k.waveT = 1.3; }
      if (k.waveT > 0 && (k.waveT -= dt) <= 0) k.pose = 'idle';
      if ((hopT -= dt) <= 0) { hopT = 2.5 + Math.random() * 5; k.hopT = 0.5; }
      k.hop = k.hopT > 0 ? Math.abs(Math.sin((k.hopT -= dt) * 6.3)) * 0.16 : 0;
    }
    if (k.lantern) { k.lantern.g.rotation.z = Math.sin(t * 2.3) * 0.12; k.lantern.halo.material.opacity = 0.25 + 0.6 * NIGHT.k; }
    ZHF.animate(k, dt, t, FEST.on ? null : you);
    for (const h of B.huts) if (h.open) { const v = h.v; if (!v.pose || v.pose === 'idle') v.pose = 'hold'; ZHF.animate(v, dt, t, null); }
    if (B.crowd) B.crowd.forEach(p => { if (p.root.visible) ZHF.animate(p, dt, t, null); });
    // steam over the punch, now and then (once it's open)
    if (B.hutOf.punsch.open && Math.random() < dt * 1.2) { const h = B.hutOf.punsch, s = toWorld(h.P, h.yaw, -0.55, 0.72); try { G.w3d.fx.puff(s.x, B.GY + 1.6, s.z, 1, 0.25, '#ffffff', 0.5); } catch (e) { /* */ } }
  }

  // ================================================================ the music: «Budenzauber» (the market's song)
  // A brass-band chorale turned into a head-nodding groove (92 bpm, a light swing; B♭ major): a German brass choir's warm
  // chords (horns), a tuba playing a bouncy funk line instead of oom-pah (and sliding up into each bar of the B part), a
  // boom-bap kick and snare with a nutcracker's crack (woodblock and rim) every other bar, a flugelhorn singing the
  // Lichterlied's tune, a barrel organ (the reedy «Drehorgel» of German markets) taking the B part over handclaps, hats
  // and a shaker on top. Intro 2 (the brass choir and the tuba alone) · A 8 (the tune) · B 8 (the organ) · a 4-bar chorale
  // (the drums drop out, the flugelhorn plays the tune broad). A: B♭maj7 Gm7 E♭maj7 F7sus B♭maj7 Cm7 F7 B♭6 · B: E♭maj7
  // D7 Gm7 C7 Cm7 F7 B♭maj7 F7sus · chorale: B♭ E♭ F B♭. MUS.mask switches its parts on and off: on the market night the
  // song comes back one layer per light (1 the brass choir, 2 the tuba, 4 the drums, 8 the flugelhorn, 16 the organ and
  // claps, 32 the hats and shaker).
  (function addSong() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const K = Sound.kit;
    const CHORDS = K.CH('Bb1: D4 F4 Bb4, F1: Eb4 F4 A4,'
      + 'Bb1: D4 F4 A4, G1: D4 F4 Bb4, Eb2: G3 Bb3 D4, F1: Eb4 F4 Bb4, Bb1: D4 F4 A4, C2: Eb4 G4 Bb4, F1: Eb4 A4 C5, Bb1: D4 F4 G4,'
      + 'Eb2: G3 Bb3 D4, D2: F#3 A3 C4, G1: D4 F4 Bb4, C2: E4 G4 Bb4, C2: Eb4 G4 Bb4, F1: Eb4 A4 C5, Bb1: D4 F4 A4, F1: Eb4 F4 Bb4,'
      + 'Bb1: D4 F4 Bb4, Eb2: G3 Bb3 Eb4, F1: C4 F4 A4, Bb1: D4 F4 Bb4');
    const TUNE = K.mel('r/2 F4/2 Bb4/3 A4/1 Bb4/2 C5/2 D5/4 | C5/2 Bb4/2 C5/4 r/6 D5/2 | Eb5/3 D5/1 C5/2 Bb4/2 C5/2 D5/2 F5/4 | Eb5/2 D5/2 Bb4/4 r/8 |'
      + 'r/2 F5/2 G5/3 F5/1 Eb5/2 D5/2 Eb5/4 | D5/2 C5/2 Bb4/4 r/6 A4/2 | Bb4/3 C5/1 D5/2 F5/2 Eb5/2 D5/2 C5/4 | Bb4/8 r/8');
    const ORG = K.mel('G5/4 Bb5/4 G5/2 F5/2 Eb5/4 | F#5/4 A5/4 F#5/2 E5/2 D5/4 | G5/6 F5/2 D5/4 Bb4/4 | C5/4 E5/4 G5/4 Bb5/4 |'
      + 'G5/4 F5/2 Eb5/2 D5/4 C5/4 | Eb5/4 F5/4 A5/4 C6/4 | Bb5/8 F5/4 D5/4 | Eb5/4 D5/4 C5/8');
    // the tuba's bar: [step, interval from the root ('n': a half step under the next bar's root), sixteenths, level]
    const TUBA = [[0, 0, 3, 1], [3, 12, 1, 0.7], [6, 0, 2, 0.85], [8, 7, 2, 0.8], [10, 10, 1, 0.6], [11, 12, 1, 0.75], [12, 7, 2, 0.8], [14, 'n', 2, 0.7]];
    Sound.addSong('de_markt', { bpm: 92, len: 352, from: 32, swing: 0.1, vol: 0.28, verb: 0.12, echo: 0.1, echoSteps: 3,
      play(i, t, s16) {
        const m = MUS.mask, bar = i >> 4, s = i & 15, C0 = CHORDS[bar % 22], R = C0[0], next = CHORDS[(bar + 1) % 22][0];
        const intro = bar < 2, sec = bar < 10 ? 'A' : bar < 18 ? 'B' : 'C', broad = intro || sec === 'C';
        if (m & 1) {
          if (broad) { if (s === 0) for (let k = 1; k < C0.length; k++) K.horn(C0[k], t, 0.85, 15 * s16); }
          else if (s === 6 || s === 14 || (sec === 'B' && s === 11)) for (let k = 1; k < C0.length; k++) K.horn(C0[k] + 12, t, 0.6, 0.11);
        }
        if (m & 2) {
          if (broad) { if (s === 0) K.tuba(R, t, 7 * s16, 1); if (s === 8) K.tuba(R + 7, t, 7 * s16, 0.8); }
          else for (const [at, iv, len, v] of TUBA) if (at === s) K.tuba(iv === 'n' ? next - 1 : R + iv, t, len * s16 * 0.92, v, sec === 'B' && at === 14 ? next : undefined);
        }
        if (m & 4 && !intro) {
          if (sec === 'C') { if (s === 0) K.kick(t, 0.6); }
          else {
            if (s === 0 || s === 7 || s === 10) K.kick(t, s ? 0.75 : 0.95);
            if (s === 4 || s === 12) K.snare(t, 0.8); if (s === 9 || s === 15) K.snare(t, 0.16);
            if ((bar & 1) && s === 14) { K.woodblock(t, false, 1.2); K.rim(t, 0.7); }
          }
        }
        if (m & 8) {
          if (sec === 'A') { const n = TUNE[i - 32]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'flugel', 0.95); }
          else if (sec === 'C') { if (!(i & 1)) { const n = TUNE[(i - 288) >> 1]; if (n) K.lead(n[0], t, n[1] * s16 * 1.9, 'flugel', 0.8); } }
          else if ((bar & 1) && (s === 0 || s === 8)) K.lead(C0[C0.length - 1] + 12, t, 4 * s16, 'flugel', 0.45);
        }
        if ((m & 16) && sec === 'B') { const n = ORG[i - 160]; if (n) K.lead(n[0], t, n[1] * s16 * 0.9, 'accordion', 0.8); if (s === 4 || s === 12) K.clap(t, 0.5); }
        if ((m & 32) && !broad) { if (!(s & 1)) K.hat(t, s % 4 ? 0.3 : 0.5); else K.shaker(t, 0.4); if (s === 0 && (bar === 2 || bar === 10)) K.crash(t, 0.6); }
      } });
  })();

  // ================================================================ scenes: helpers
  const lock = on => { if (G) G.sim.lock = on ? 1 : 0; };
  const think = (text, s) => STORY.think(text, s);
  const front = (p, d) => ({ x: p.x + Math.sin(p.baseYaw) * d, z: p.z + Math.cos(p.baseYaw) * d });
  const shot = (p, l) => { G.cam.override = { pos: V3(p[0], p[1], p[2]), look: V3(l[0], l[1], l[2]) }; };
  // you (and {mimo}) stand at a spot, facing a point
  function standAt(at, look) {
    const Y = G.sim.you, M = G.sim.mimo, L0 = look || { x: B.kid.x, z: B.kid.z };
    Y.x = at.x; Y.z = at.z; Y.yaw = Math.atan2(L0.x - Y.x, L0.z - Y.z);
    M.x = at.x + Math.cos(Y.yaw) * 0.9; M.z = at.z - Math.sin(Y.yaw) * 0.9; M.station = null; M.wander = null; M.look = { x: L0.x, z: L0.z };
    [Y.x, Y.z] = WORLD.pushOut(Y.x, Y.z, 0.4); [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3); G.sim.snap();
  }
  const standBy = () => standAt(front(B.kid, 1.9), { x: B.kid.x, z: B.kid.z });
  function shotKid() { const k = B.kid, f = front(k, 3.4), s = { x: Math.cos(k.baseYaw) * 1.3, z: -Math.sin(k.baseYaw) * 1.3 }; shot([f.x + s.x, k.y + 1.8, f.z + s.z], [k.x, k.y + 0.85, k.z]); }
  const PLAZA_SHOT = [[C.x + 3.5, 6.2, C.z + 15.5], [C.x, 1.6, C.z - 3]];
  function kidTo(p, look) { const k = B.kid; k.x = p.x; k.z = p.z; k.y = B.gy(p.x, p.z); k.baseYaw = k.yaw = look ? Math.atan2(look.x - p.x, look.z - p.z) : k.baseYaw; k.away = true; k.hop = 0; k.pose = 'idle'; }
  function kidHome() { const k = B.kid; k.x = SPOT.kid.x; k.z = SPOT.kid.z; k.y = B.gy(k.x, k.z); k.yaw = k.baseYaw = SPOT.kid.yaw; k.away = false; k.faceAt = null; k.pose = 'idle'; k.noTurn = false; }
  async function scene(fn) {
    lock(true); busyN++;
    try { await fn(); } catch (e) { console.error('[weihnacht] scene', e); }
    finally { busyN--; G.cam.override = null; lock(false); if (G.sim.mimo) G.sim.mimo.look = null; if (G.save) G.save(); }
  }
  // a line over someone: the whole line in German, the English under it (STORY.sayInline, as the other side characters do)
  function sayRaw(p, de, en) { if (!p || typeof STORY === 'undefined') return Promise.resolve(); p.lines = { de, en }; if (!p.name) p.name = p.nameSrc || ''; return STORY.sayInline(p, true); }
  const say = (p, key, vars) => { const l = lineOf(key, vars); return sayRaw(p, l.de, l.en); };
  // someone else's live object (a story villager, a townsperson, Adi's people), wrapped so a line can sit over them
  function talker(p, name, top) {
    return { name: name || p.name || '', get x() { return p.x; }, get z() { return p.z; }, get y() { return p.y !== undefined ? p.y : WORLD.terrainAt(p.x, p.z); }, top: top || p.top || 1.75,
      get talking() { return !!p.talking; }, set talking(v) { p.talking = v; } };
  }
  function who(where) {
    const [kind, id] = String(where).split(':');
    if (kind === 'npc') { const n = G.sim.npc(id); return n || null; }
    if (kind === 'town') { const P = G.town && G.town.people, p = P && P.find(q => q.id === id); return p && !p.hushed ? p : null; }
    if (kind === 'adolf') { const P = G.adolf && G.adolf.people; return (P && P.find(q => q.id === id && !q.hidden)) || null; }
    return null;
  }
  const NPC_TOP = { rosa: 1.85, bruno: 2.05, baker: 1.95 };
  const whoTalker = (where, name) => { const p = who(where); if (!p) return null; const id = String(where).split(':')[1]; return talker(p, name, NPC_TOP[id]); };
  function shotAt(p, d = 3.3) {
    const Y = G.sim.you, dx = Y.x - p.x, dz = Y.z - p.z, L0 = Math.hypot(dx, dz) || 1, ux = dx / L0, uz = dz / L0;
    const y = p.y !== undefined ? p.y : WORLD.terrainAt(p.x, p.z);
    shot([p.x + ux * d - uz * 1.2, y + 1.9, p.z + uz * d + ux * 1.2], [p.x, y + 1.05, p.z]);
  }
  const coins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; sfx('chest'); UI.toast(`${why}: +${n} coins`); };
  const mimoHappy = (n = 1.6) => { const M = G.sim.mimo; if (M) { M.happy = Math.max(M.happy || 0, n); } };
  const sparkle = (x, y, z, n, cols, s) => { try { G.w3d.fx.sparkle(x, y, z, n, cols || ['#ffd23f', '#ff6a5a']); if (s) sfx(s); } catch (e) { /* */ } };
  const puff = (x, y, z, n, s) => { try { G.w3d.fx.puff(x, y, z, n || 6, s || 0.4); } catch (e) { /* */ } };
  const chDone = st => { let n = 0; while (n < 5 && st.ch[n + 1]) n++; return n; };
  const today = () => new Date().toDateString();
  const WHO = { face: 'wmKid', name: 'Fiete' };
  const icoArt = (key, size = 128) => el => el.appendChild(WUI.art.icon(key, size));

  // ================================================================ checks for typed German
  const ART = { m: 'der', f: 'die', n: 'das' };
  // a market thing, with its article (recall: «die Bratwurst»)
  const nounCheck = S0 => t => {
    const h = has(t, S0.keys); if (!h.ok) return { ok: false, why: 'Look at the picture again! (Tab: a hint)' };
    if (S0.g === 'pl') return { ok: true, minor: h.typo, said: S0.art };
    const T = WUI.toks(t), art = T.find(w => ['der', 'die', 'das'].includes(w)), want = ART[S0.g], alt = S0.also ? ART[S0.also] : null;
    if (!art) return { ok: true, minor: true, said: S0.art, note: `with its article: «${esc(S0.art)}»` };
    if (art !== want && art !== alt) return { ok: true, grade: 'B', said: S0.art, note: `it’s «${esc(S0.art)}»` };
    return { ok: true, minor: h.typo, said: S0.art };
  };
  // «Hier gibt es …!»
  const hereCheck = S0 => t => {
    const h = has(t, S0.keys); if (!h.ok) return { ok: false, why: `What’s in the picture? ${esc(S0.en)}` };
    const frame = has(t, ['hier gibt es', 'es gibt', 'hier gibts', 'gibt es hier']).ok;
    return frame ? { ok: true, minor: h.typo } : { ok: true, minor: true, note: `a whole sentence: «${esc(S0.here)}»` };
  };
  // a price said in words (digits count, with a note)
  const priceCheck = (cents, o = {}) => t => {
    const p = WUI.price(t); if (!p) return { ok: false, why: o.why || `Say it in words: «${WUI.euroWords(cents)}»?` };
    if (p.cents !== cents) return { ok: false, why: `Not quite: that’s ${WUI.euro(p.cents)}. Look again!` };
    const frame = o.frame ? has(t, o.frame).ok : true;
    if (p.digits) return { ok: true, grade: 'B', note: `in words: «${WUI.euroWords(cents)}»` };
    return frame ? { ok: true } : { ok: true, minor: true, note: o.frameNote || '' };
  };
  // ordering politely: the thing (with the right accusative article when there is one) and «bitte» / «Ich hätte gern» / «Ich möchte»
  const orderCheck = S0 => t => {
    const h = has(t, S0.keys); if (!h.ok) return { ok: false, why: `Which one? ${esc(S0.sign)}!` };
    const polite = has(t, ['bitte', 'hatte gern', 'hatte gerne', 'mochte', 'nehme', 'ich nehme']).ok;
    const T = WUI.toks(t), a = T.find(w => ['ein', 'einen', 'eine', 'der', 'den', 'die', 'das'].includes(w));
    if (S0.g === 'm' && (a === 'ein' || a === 'der')) return { ok: true, grade: 'B', note: `der ${esc(S0.noun)} → «${esc(S0.acc)}» (accusative)` };
    if (S0.g === 'f' && !S0.also && (a === 'einen' || a === 'ein')) return { ok: true, grade: 'B', note: `die ${esc(S0.noun)} → «${esc(S0.acc)}»` };
    if (S0.g === 'n' && (a === 'einen' || a === 'eine')) return { ok: true, grade: 'B', note: `das ${esc(S0.noun)} → «${esc(S0.acc)}»` };
    return polite ? { ok: true, minor: h.typo } : { ok: true, minor: true, note: 'politer with «bitte» or «Ich hätte gern …»' };
  };
  // a command for {mimo} in the du-imperative; the recipe's infinitive counts, with a note (o: { verb: [imperative forms],
  // inf: 'infinitive', obj: [words one of which must be there], end: separable particle, slip: [wrong forms] → why })
  const cmdCheck = o => t => {
    const T = WUI.toks(t), exact = w => T.includes(WUI.canon(w));
    const obj = !o.obj || o.obj.some(w => has(t, [w]).ok);
    const impX = o.verb.some(exact), infX = !!o.inf && exact(o.inf);
    if (o.slip && !impX && !infX) for (const [w, why] of o.slip) if (has(t, [w]).ok) return { ok: true, grade: 'B', note: why };
    const imp = impX || (!infX && o.verb.some(w => has(t, [w]).ok)), inf = infX || (!imp && !!o.inf && has(t, [o.inf]).ok);
    if (!imp && !inf) return { ok: false, why: o.why || `Tell ${esc(mimo())} what to do: «${esc(o.model)}»` };
    if (!imp && inf) return { ok: true, grade: 'B', note: `that’s how the recipe says it; to ${esc(mimo())}: «${esc(o.model)}»` };
    if (!obj) return { ok: true, minor: true, note: `the whole thing: «${esc(o.model)}»` };
    if (o.end && !exact(o.end)) return { ok: true, minor: true, note: `the «${o.end}» goes to the end: «${esc(o.model)}»` };
    return { ok: true, minor: !impX };
  };
  const anyCheck = (keys, why) => t => { const h = has(t, keys); return h.ok ? { ok: true, minor: h.typo } : { ok: false, why }; };
  const numberIn = t => { const d = String(t).match(/\d+/); if (d) return { n: +d[0], digits: true }; for (const w of WUI.toks(t)) { if (/^(ein|eine|einen)$/.test(w)) continue; const v = WUI.num(w); if (v != null) return { n: v, digits: false }; } return null; };

  // ================================================================ chapter 1: die Buden
  async function meet() {
    const st = S();
    await scene(async () => {
      standBy(); shotKid();
      B.kid.pose = 'wave'; await say(B.kid, 'kid.hi'); B.kid.pose = 'idle';
      await say(B.kid, 'kid.market');
      shot(...PLAZA_SHOT); await say(B.kid, 'kid.lights'); G.fx.hush = 0.35; await say(B.kid, 'kid.hush'); G.fx.hush = 0;
      shotKid(); await say(B.kid, 'kid.help');
      await STORY.you('A Christmas market? Count me in!');
      B.kid.pose = 'cheer'; mimoHappy(); await say(B.kid, 'kid.yay'); B.kid.pose = 'idle';
      st.met = true;
    });
    if (!chOpen(1)) return;
    const go = await UI.choose('Fiete: «Fangen wir an?» (Shall we start?)', [{ label: 'Chapter 1: Die Buden', sub: 'the stalls, their prices, playing market, the Advent calendar', value: 1 }, { label: 'Later', value: 0 }]);
    if (go) await chapter1();
  }
  async function chapter1() {
    const st = S(); st.up = st.up || {};
    let quit = false;
    LOOK.staged = true; lookFromState(st);
    try {
      await UI.fade(1, 350); kidTo(ring(258, 5.0), C); standAt(SPOT.you, SPOT.look); shot(...PLAZA_SHOT); await UI.fade(0, 350);
      await scene(async () => { shot(...PLAZA_SHOT); await say(B.kid, 'kid.here'); await say(B.kid, 'kid.learn'); });
      // the six things: copy each (with its article), then say each from its picture
      const learn = ORDER.map(id => { const S0 = STALL[id]; return { kind: 'New · type it to learn it', big: S0.art, gl: `“${esc(S0.en)}”`, art: icoArt(S0.icon, 120), model: S0.art, keys: S0.keys, echo: true, voice: S0.art,
        note: id === 'reibe' ? 'Plural: die Reibekuchen. Also called «Kartoffelpuffer».' : id === 'herz' ? 'das Herz → das Lebkuchenherz; plural: die Lebkuchenherzen' : id === 'mandeln' ? 'die Mandel, die Mandeln. Without an article: «gebrannte Mandeln».' : id === 'crepe' ? 'Plural: die Crêpes.' : id === 'wurst' ? 'Plural: die Bratwürste.' : '' }; });
      const recall = WUI.shuffle(ORDER.slice()).map(id => { const S0 = STALL[id]; return { kind: 'From memory · what’s this?', sit: 'Say it with its article (der, die, das)!', art: icoArt(S0.icon, 120), model: S0.art, modelEn: S0.en, check: nounCheck(S0) }; });
      recall[0].say = ['Super! Und jetzt ohne Hilfe: Was ist das?', 'Great! And now without help: what’s this?'];
      let r = await WUI.steps(learn.concat(recall), { title: 'Auf dem Weihnachtsmarkt', sub: 'what there is at the market', face: 'wmKid', name: 'Fiete', intro: ['Das gibt es auf dem Markt!', 'This is what there is at the market!'] });
      if (r.quit) { quit = true; return; }
      // the stalls go up as you say what's there (the bar at the bottom: the plaza stays in view)
      await scene(async () => { shot(...PLAZA_SHOT); await say(B.kid, 'kid.build'); });
      lock(true); WUI.hud.open('Die Buden · the stalls go up');
      try {
        for (let i = 0; i < ORDER.length; i++) {
          const H0 = B.hutOf[ORDER[i]], S0 = H0.S0;
          if (st.up[S0.id]) continue;
          hutShot(H0);
          const g = await WUI.hud.call({ icon: S0.icon, title: 'Was gibt es hier?', sub: `${esc(S0.en)}<br>Say: «Hier gibt es …!»`, bar: i / 7, model: S0.here, modelEn: `There’s ${S0.en.split(':')[0].split(',')[0]} here!`, check: hereCheck(S0) });
          if (g === 'quit') { quit = true; return; }
          H0.popNow = true; st.up[S0.id] = true; LOOK.up[S0.id] = true;
          puff(H0.P.x, B.GY + 0.3, H0.P.z, 10, 0.5); sfx('poof'); setTimeout(() => sparkle(H0.P.x, B.GY + 2.2, H0.P.z, 14, ['#ffd23f', '#7ee08f'], 'learned'), 350);
          await wait(1.3);
        }
        if (!st.up.pyr) {
          shot([C.x + 4.5, 3.6, C.z + 2.2], [SPOT.pyr.x, 2.2, SPOT.pyr.z]);
          const g = await WUI.hud.call({ icon: 'wmPyramide', title: 'Und in die Mitte?', sub: 'The big Christmas pyramid! Say: «die Weihnachtspyramide»', bar: 6 / 7, model: 'Die Weihnachtspyramide!', modelEn: 'The Christmas pyramid!', check: anyCheck(['weihnachtspyramide', 'pyramide'], 'It’s a «Weihnachtspyramide»!') });
          if (g === 'quit') { quit = true; return; }
          st.up.pyr = true; LOOK.pyrUp = true; puff(SPOT.pyr.x, B.GY + 0.3, SPOT.pyr.z, 12, 0.6); sfx('poof'); sparkle(SPOT.pyr.x, B.GY + 3.6, SPOT.pyr.z, 18, null, 'learned');
          await wait(1.2);
        }
      } finally { WUI.hud.close(); lock(false); }
      await scene(async () => { shot([C.x + 4.5, 3.6, C.z + 2.2], [SPOT.pyr.x, 2.2, SPOT.pyr.z]); await say(B.kid, 'kid.pyr'); await say(B.kid, 'kid.pyr2'); shot(...PLAZA_SHOT); await say(B.kid, 'kid.prices'); });
      // the prices, in words
      const rows = () => ORDER.map(id => [STALL[id].sign, st.price && st.price[id] ? STALL[id].price : null]);
      st.price = st.price || {};
      const priceStep = (id, echo) => { const S0 = STALL[id]; return { kind: echo ? 'New · a price in words' : 'The price board · say it in words', big: echo ? `${WUI.euro(S0.price)} = ${WUI.euroWords(S0.price)}` : '', art: () => WUI.art.board(ORDER.map(j => [STALL[j].sign, j === id || (st.price[j]) ? STALL[j].price : null, j === id])),
        say: echo ? ['So sagt man Preise: erst die Euro, dann die Cent.', 'This is how you say prices: first the euros, then the cents.'] : [`Und ${S0.art}? Was kostet das?`, `And ${S0.en.split(',')[0].split(':')[0]}? How much is it?`],
        model: WUI.euroWords(S0.price), modelEn: WUI.euro(S0.price), echo: !!echo, check: priceCheck(S0.price), placeholder: echo ? WUI.euroWords(S0.price) : 'say the price in words…', then: () => { st.price[id] = true; } }; };
      r = await WUI.steps([priceStep('mandeln', true), priceStep('punsch'), priceStep('wurst'), priceStep('crepe')], Object.assign({ title: 'Die Preise', sub: 'the price board' }, WHO));
      if (r.quit) { quit = true; return; }
      ORDER.forEach(id => { st.price[id] = true; });
      // playing market: you buy from Fiete, then you sell to him
      await scene(async () => { shot(...PLAZA_SHOT); await say(B.kid, 'kid.shop'); });
      const boardArt = hi => () => WUI.art.board(ORDER.map(j => [STALL[j].sign, STALL[j].price, j === hi]));
      r = await WUI.steps([
        { kind: 'Shopping · Fiete sells', say: ['Hallo! Was darf’s sein?', 'Hi! What can I get you?'], art: icoArt('wmMandeln', 110), sit: 'Order a bag of roasted almonds, politely.', model: 'Ich hätte gern eine Tüte gebrannte Mandeln.', modelEn: 'I’d like a bag of roasted almonds.', check: orderCheck(STALL.mandeln) },
        { kind: 'Shopping · pay', say: ['Gern! Das macht vier Euro fünfzig.', 'Sure! That comes to four euros fifty.'], sit: 'Hand over the money, with a word.', model: 'Hier, bitte!', modelEn: 'Here you are!', check: anyCheck(['hier bitte', 'bitte schon', 'bitte', 'hier', 'vier euro funfzig', 'stimmt so', 'bitte sehr'], 'Hand it over: «Hier, bitte!»') },
        { kind: 'Shopping · say goodbye', say: ['Danke! Schönen Abend noch!', 'Thanks! Have a lovely evening!'], sit: 'Send the wish right back: “Thanks, you too!”', model: 'Danke, gleichfalls!', modelEn: 'Thanks, you too!', check: t => { const h = has(t, PHI['ph.wm.gleichfalls'].keys); if (h.ok) return { ok: true, minor: h.typo }; if (has(t, ['danke']).ok) return { ok: true, minor: true, note: 'send the wish back too: «Danke, gleichfalls!»' }; return { ok: false }; } },
        { kind: 'Shopping · a drink', say: ['Und zu trinken? Was möchtest du?', 'And to drink? What would you like?'], art: icoArt('wmPunsch', 110), sit: 'Order a kids’ punch (der Kinderpunsch).', model: 'Einen Kinderpunsch, bitte!', modelEn: 'A kids’ punch, please!', check: orderCheck(STALL.punsch), after: 'At real markets you pay a deposit («Pfand») for the mug, and get it back when you return it.' },
        { kind: 'Now you sell', say: ['Jetzt tauschen wir! Du verkaufst, und ich kaufe.', 'Now we swap! You sell, and I buy.'], sit: 'Fiete walks up to your stall. Ask what he’d like, like a real stallholder.', model: 'Was darf’s sein?', modelEn: 'What can I get you?', check: t => { const h = has(t, PHI['ph.wm.wasdarf'].keys); if (h.ok) return { ok: true, minor: h.typo }; if (has(t, ['was mochtest du', 'was mochten sie', 'was willst du', 'was hattest du gern']).ok) return { ok: true, minor: true, note: 'what stallholders say: «Was darf’s sein?»' }; return { ok: false }; } },
        { kind: 'Now you sell · a price', say: ['Was kostet eine Bratwurst?', 'How much is a Bratwurst?'], art: boardArt('wurst'), sit: 'Tell him the price (it’s on the board).', model: 'Eine Bratwurst kostet vier Euro.', modelEn: 'A Bratwurst costs four euros.', check: priceCheck(400, { frame: ['kostet'], frameNote: 'a whole sentence: «Eine Bratwurst kostet vier Euro.»' }) },
        { kind: 'Now you sell · the total', say: ['Dann nehme ich zwei Crêpes. Was macht das?', 'Then I’ll take two crêpes. What does that come to?'], art: boardArt('crepe'), sit: 'Two crêpes at 4,50 € each: tell him the total.', model: 'Das macht neun Euro.', modelEn: 'That comes to nine euros.', check: priceCheck(900, { frame: ['das macht', 'macht'], frameNote: 'how sellers say it: «Das macht neun Euro.»', why: 'Two crêpes at 4,50 €… «Das macht … Euro.»' }) },
        { kind: 'Now you sell · goodbye', say: ['Hier, bitte. Tschüss!', 'Here you go. Bye!'], sit: 'Thank him and say goodbye.', model: 'Danke! Tschüss!', modelEn: 'Thanks! Bye!', check: anyCheck(['tschuss', 'wiedersehen', 'schonen tag', 'schonen abend', 'ciao', 'bis bald', 'danke'], 'Say goodbye: «Danke! Tschüss!»') },
      ], Object.assign({ title: 'Wir spielen Markt', sub: 'buying and selling' }, WHO));
      if (r.quit) { quit = true; return; }
      ['ph.wm.wasdarf', 'ph.wm.hattegern', 'ph.wm.dasmacht', 'ph.wm.gleichfalls'].forEach(teach);
    } finally {
      LOOK.staged = false; WUI.hud.close();
      if (quit) { await UI.fade(1, 300); kidHome(); await UI.fade(0, 300); think('Fiete: «Bis später!» (See you later!)', 3); }
    }
    if (quit) return;
    // back at his spot: the Advent calendar, and its first door
    await UI.fade(1, 350); kidHome(); standBy(); shotKid(); await UI.fade(0, 350);
    await scene(async () => { const E0 = SPOT.easel; shot([E0.x + Math.sin(E0.yaw) * 2.2 + 0.6, B.gy(E0.x, E0.z) + 1.5, E0.z + Math.cos(E0.yaw) * 2.2], [E0.x, B.gy(E0.x, E0.z) + 1.0, E0.z]); await say(B.kid, 'kid.cal'); await say(B.kid, 'kid.cal2'); });
    st.ch[1] = true; st.cal.lastT = -1e9;
    await openDoor();
    await scene(async () => { standBy(); shotKid(); B.kid.pose = 'cheer'; await say(B.kid, 'kid.done1'); B.kid.pose = 'idle'; });
    coins(5, 'Fiete pays his market helper');
  }
  function hutShot(H0) { const c = toWorld(H0.P, H0.yaw, 1.4, 5.1); shot([c.x, B.GY + 3.1, c.z], [H0.P.x, B.GY + 1.3, H0.P.z]); }
  // (the market night: from across the square, high enough that the Hush over it stays in view)
  function nightShot(H0) { const P = H0.P; shot([C.x + (C.x - P.x) * 0.95, B.GY + 4.6, C.z + (C.z - P.z) * 0.95], [lerp(P.x, C.x, 0.25), B.GY + 4.2, lerp(P.z, C.z, 0.25)]); }

  // ================================================================ the Advent calendar: a door, its task
  const chOpen = n => { const c = CH[n - 1]; return !!(c && c.gate(flags())); };
  function doorReady() {
    if (!G || !shown()) return false;
    const st = S(), c = st.cal; if (!st.ch[1] || c.task || c.open >= 24) return false;
    const n = c.open + 1, cap = n === 24 ? (st.ch[5] ? 24 : 0) : CAP[chDone(st)];
    if (n > cap) return false;
    return c.open === 0 || G.state.time - c.lastT >= DOOR_GAP || c.day !== today();
  }
  function doorCheck(D) {
    return t => {
      if (D.trap && has(t, [D.trap]).ok) return { ok: false, why: D.n === 11 ? '«Ich bin kalt» means you’re a cold, unfriendly person! Your body says it: «Mir ist kalt!»' : '«Ich bin voll» means something else entirely! Full of food: «Ich bin satt.»' };
      if (D.num) { const v = numberIn(t); if (!v) return { ok: false, why: 'A number, in words!' }; if (v.n !== D.num) return { ok: false, why: 'Count again! One more candle every Sunday.' }; return v.digits ? { ok: true, grade: 'B', note: `in words: «${WUI.numWords(D.num)}»` } : { ok: true }; }
      const h = has(t, D.keys); if (!h.ok) return { ok: false };
      if (D.sie && has(t, ['strickst du', 'bist du']).ok) return { ok: true, minor: true, note: 'to someone older you don’t know well, «Sie» is politer: «' + esc(D.model) + '»' };
      return { ok: true, minor: h.typo };
    };
  }
  async function openDoor() {
    const st = S(), c = st.cal, n = c.open + 1, D = DOORS[n - 1]; if (!D) return;
    c.open = n; c.lastT = G.state.time; c.day = today(); c.task = n; calRefresh(); sfx('page');
    if (D.kind === 'here') return doDoorHere(D);
    UI.toast(`Türchen ${n}: ${D.task}`);
    think(`Door ${n}: ${D.task}. For example: «${D.model}»`, 6);
  }
  async function doDoorHere(D) {
    const r = await WUI.steps([{ kind: `Türchen ${D.n} · ${D.big ? 'the big one!' : 'today’s task'}`, art: () => WUI.art.doorPic(D.pic, D.n), say: D.q, sit: esc(D.q[1]), model: D.model, check: doorCheck(D) }],
      { title: 'Fietes Adventskalender', sub: `door ${D.n} of 24`, face: 'wmKid', name: 'Fiete' });
    if (r.quit) return;
    doorDone(D);
  }
  async function doDoorSay(D) {
    const p = whoTalker(D.who, D.name); if (!p) { think(`${D.name} isn’t around right now.`, 3); return; }
    const r = await WUI.steps([{ kind: `Türchen ${D.n} · say it to ${D.name}`, art: () => WUI.art.doorPic(D.pic, D.n), say: [`Na los! Sag es ${D.name}!`, `Go on! Say it to ${D.name}!`], sit: esc(D.task) + '.', model: D.model, check: doorCheck(D) }],
      { title: 'Fietes Adventskalender', sub: `door ${D.n} of 24`, face: 'wmKid', name: 'Fiete' });
    if (r.quit) return;
    await scene(async () => { shotAt(p); if (D.music) sfx('chime'); await say(p, D.reply); });
    doorDone(D);
  }
  function doorDone(D) {
    const c = S().cal; c.done[D.n] = true; c.task = 0; if (D.ph) teach(D.ph);
    coins(D.big ? 10 : D.n % 4 === 0 ? 3 : 2, `Türchen ${D.n} done! A cookie from Fiete`); mimoHappy(); calRefresh();
  }

  // ================================================================ chapter 2: Plätzchen backen (with Marta, at her bakery)
  const RECIPE = `<div style="background:#fffdf4;border:2.5px solid #2b2235;border-radius:12px;padding:8px 14px;font:700 15px/1.55 'Segoe Print','Comic Sans MS',cursive;color:#5a3420;transform:rotate(-1.5deg);box-shadow:0 3px 0 rgba(43,34,53,.15)">
<b style="color:#c8322a;font-size:17px">Butterplätzchen</b><br>250 g Mehl<br>125 g Butter<br>100 g Zucker<br>1 Ei<br>1 Päckchen Vanillezucker<br>1 Prise Salz<br><span style="opacity:.75">bei 180 °C · 10 Minuten</span></div>`;
  async function chapter2() {
    const st = S(), M0 = G.sim.npc('baker');
    await scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.bake'); });
    let quit = false;
    try {
      if (M0) { await UI.fade(1, 350); standAt({ x: M0.x + 0.5, z: M0.z + 2.3 }, M0); kidTo({ x: M0.x - 1.15, z: M0.z + 1.95 }, M0); await UI.fade(0, 350); }
      const marta = whoTalker('npc:baker', 'Marta');
      await scene(async () => { if (marta) { shotAt(marta); await say(marta, 'marta.hi'); await say(marta, 'marta.how'); } });
      const K0 = { stage: 'ingredients', shapes: [] }, pic = () => WUI.art.kitchen(K0);
      const to = (stage, add) => (c, t, E) => { if (add) for (let i = 0; i < 4; i++) K0.shapes.push(add); K0.stage = stage; E.art.innerHTML = ''; E.art.appendChild(pic()); mimoHappy(0.8); };
      const cut = (pl, sg, de, en) => ({ kind: 'Marta reads · you tell ' + mimo(), art: pic, say: [de, en], gl: '«Plätzchen ausstechen: Sterne, Herzen und Monde.»', sit: `Tell ${esc(mimo())} to cut out ${pl}: ausstechen → «Stich … aus!» (stechen → stich!)`,
        model: `Stich ${pl} aus!`, check: cmdCheck({ verb: ['stich'], inf: 'ausstechen', obj: [pl, sg], end: 'aus', model: `Stich ${pl} aus!`, slip: [['stech', 'stechen changes its vowel: du stichst → «Stich!» (like geben → «Gib!»)'], ['ausstich', 'ausstechen comes apart: «Stich … aus!»']] }), onOk: to('cut', { Sterne: 'star', Herzen: 'heart', Monde: 'moon' }[pl]) });
      const steps = [
        { kind: 'The recipe · read it', art: el => { el.innerHTML = RECIPE; el.appendChild(pic()); }, say: ['Zuerst das Rezept. Wie viel Mehl brauchen wir?', 'First the recipe. How much flour do we need?'], sit: 'Read it off the card, and say the number in words.', model: 'Zweihundertfünfzig Gramm.',
          check: t => { const v = numberIn(t); if (!v) return { ok: false, why: 'How many grams? (Gramm)' }; if (v.n !== 250) return { ok: false, why: 'Look at the card again: … g Mehl' }; return v.digits ? { ok: true, grade: 'A', note: 'in words: «zweihundertfünfzig Gramm»' } : { ok: true }; } },
        { kind: 'Marta reads · you tell ' + mimo(), art: pic, say: ['Mehl, Zucker und Butter in eine Schüssel geben.', 'Put the flour, sugar and butter in a bowl.'], gl: '«Mehl, Zucker und Butter in eine Schüssel geben.»', sit: `Recipes speak in the infinitive (geben). Tell ${esc(mimo())}: geben → «Gib …!»`,
          model: 'Gib alles in die Schüssel!', check: cmdCheck({ verb: ['gib', 'tu', 'tue'], inf: 'geben', obj: ['schussel', 'alles', 'mehl', 'zucker', 'butter'], model: 'Gib alles in die Schüssel!' }), onOk: to('mixed') },
        { kind: 'Marta reads · you tell ' + mimo(), art: pic, say: ['Dann das Ei dazugeben.', 'Then add the egg.'], gl: '«Das Ei dazugeben.»', sit: `dazugeben comes apart: «Gib … dazu!»`, model: 'Gib das Ei dazu!', check: cmdCheck({ verb: ['gib', 'tu', 'tue'], inf: 'dazugeben', obj: ['ei'], end: 'dazu', model: 'Gib das Ei dazu!' }), onOk: to('egg') },
        { kind: 'Marta reads · you tell ' + mimo(), art: pic, say: ['Jetzt alles gut kneten.', 'Now knead everything well.'], gl: '«Alles gut kneten.»', sit: `kneten → «Knete …!» (the dough: der Teig)`, model: 'Knete den Teig!', check: cmdCheck({ verb: ['knete', 'knet'], inf: 'kneten', obj: ['teig', 'alles'], model: 'Knete den Teig!' }), onOk: to('dough') },
        { kind: 'Marta reads · you tell ' + mimo(), art: pic, say: ['Den Teig ausrollen. Schön dünn!', 'Roll out the dough. Nice and thin!'], gl: '«Den Teig ausrollen.»', sit: `ausrollen comes apart too: «Roll … aus!»`, model: 'Roll den Teig aus!',
          check: cmdCheck({ verb: ['roll', 'rolle'], inf: 'ausrollen', obj: ['teig'], end: 'aus', model: 'Roll den Teig aus!', slip: [['ausroll', 'ausrollen comes apart: «Roll den Teig aus!»'], ['ausrolle', 'ausrollen comes apart: «Roll den Teig aus!»']] }), onOk: to('rolled') },
        cut('Sterne', 'stern', 'Jetzt ausstechen! Zuerst Sterne.', 'Now cut them out! Stars first.'),
        cut('Herzen', 'herz', 'Jetzt Herzen!', 'Now hearts!'),
        cut('Monde', 'mond', 'Und zum Schluss Monde!', 'And last of all, moons!'),
        { kind: 'Marta reads · you tell ' + mimo(), art: pic, say: ['Die Plätzchen aufs Blech legen.', 'Put the cookies on the baking tray.'], gl: '«Die Plätzchen aufs Blech legen.»', sit: 'legen → «Leg …!» (aufs = auf das)', model: 'Leg die Plätzchen aufs Blech!', check: cmdCheck({ verb: ['leg', 'lege'], inf: 'legen', obj: ['blech', 'platzchen', 'kekse'], model: 'Leg die Plätzchen aufs Blech!' }), onOk: to('tray') },
        { kind: 'Marta reads · you tell ' + mimo(), art: pic, say: ['Bei 180 Grad zehn Minuten backen.', 'Bake for ten minutes at 180 degrees.'], gl: '«Bei 180 Grad zehn Minuten backen.»', sit: 'backen → «Back …!»', model: 'Back die Plätzchen!', check: cmdCheck({ verb: ['back', 'backe'], inf: 'backen', obj: ['platzchen', 'sie', 'kekse', 'blech'], model: 'Back die Plätzchen!' }), onOk: to('oven') },
        { kind: 'The oven · how long?', art: pic, say: ['Und wie lange? Schau aufs Rezept!', 'And how long? Look at the recipe!'], sit: 'How long do they bake? Say it in words.', model: 'Zehn Minuten!',
          check: t => { const v = numberIn(t); if (!v) return { ok: false, why: 'How many minutes? (Minuten)' }; if (v.n !== 10) return { ok: false, why: 'The recipe says: … Minuten' }; return v.digits ? { ok: true, grade: 'B', note: 'in words: «zehn Minuten»' } : { ok: true }; },
          onOk: async (c, t, E) => { sfx('chime'); K0.stage = 'baked'; E.art.innerHTML = ''; E.art.appendChild(pic()); } },
        { kind: 'The smell', art: pic, say: ['Mmmh! Riechst du das?', 'Mmmh! Can you smell that?'], sit: 'The whole bakery smells of cookies. Say: “That smells so good!”', model: 'Das riecht so gut!', check: anyCheck(PHI['ph.wm.riecht'].keys, 'riechen: to smell. «Das riecht …!»') },
        { kind: 'Marta reads · you tell ' + mimo(), art: pic, say: ['Und jetzt die Plätzchen verzieren!', 'And now decorate the cookies!'], gl: '«Die Plätzchen verzieren.»', sit: 'verzieren → «Verzier …!»', model: 'Verzier die Plätzchen!', check: cmdCheck({ verb: ['verzier', 'verziere'], inf: 'verzieren', obj: ['platzchen', 'sie', 'kekse'], model: 'Verzier die Plätzchen!' }), onOk: to('decorated') },
        { kind: 'Decorating · with what?', art: pic, say: ['Womit? Mit Zuckerguss? Mit Streuseln?', 'With what? Icing? Sprinkles?'], sit: 'Say what with: «mit» + the dative (die Streusel → mit Streuseln).', model: 'Mit Zuckerguss und Streuseln!',
          check: t => { const T = WUI.toks(t); if (!T.includes('mit')) return { ok: false, why: 'Start with «Mit …»' }; if (!has(t, ['zuckerguss', 'streuseln', 'streusel', 'schokolade', 'perlen', 'zucker', 'glasur', 'mandeln', 'nussen']).ok) return { ok: false, why: 'With icing (Zuckerguss)? Sprinkles (Streusel)? Chocolate (Schokolade)?' }; if (T.includes('streusel') && !T.includes('streuseln')) return { ok: true, minor: true, note: 'dative plural adds -n: «mit Streuseln»' }; return { ok: true }; } },
        { kind: 'Tasting', art: pic, say: ['Probiert mal einen Stern! Und?', 'Try a star! Well?'], sit: 'Say how it tastes!', model: 'Lecker!', check: anyCheck(['lecker', 'schmeckt', 'super', 'gut', 'toll', 'mega', 'klasse', 'kostlich'], '«Lecker!» (yummy!)'), onOk: to('taste') },
        { kind: 'New · an expression', big: 'Das schmeckt nach mehr!', gl: `“${esc(PHI['ph.wm.mehr'].en)}”`, note: esc(PHI['ph.wm.mehr'].note), say: ['Fiete sagt immer: «Das schmeckt nach mehr!»', 'Fiete always says: «That tastes like more!»'], art: pic, echo: true, model: 'Das schmeckt nach mehr!', keys: PHI['ph.wm.mehr'].keys, voice: 'Das schmeckt nach mehr!' },
      ];
      const r = await WUI.steps(steps, { title: 'Plätzchen backen', sub: 'in Marta’s bakery', face: 'wmMarta', name: 'Marta', intro: ['Ich lese vor, ihr macht!', 'I read, you do!'] });
      if (r.quit) { quit = true; return; }
      ['ph.wm.riecht', 'ph.wm.mehr'].forEach(teach);
      await scene(async () => { const m = whoTalker('npc:baker', 'Marta'); if (m) { shotAt(m); await say(m, 'marta.done'); } shotKid(); B.kid.pose = 'cheer'; await say(B.kid, 'kid.tin'); B.kid.pose = 'idle'; });
      st.ch[2] = true; bag('k.wmTin', 1);
      coins(6, 'Marta pays the bakers in cookies (and coins)');
      UI.toast('Key item: a tin of cookies (Plätzchendose)');
    } finally { await UI.fade(1, 300); kidHome(); if (!quit) standBy(); await UI.fade(0, 300); if (quit) think('Fiete: «Morgen backen wir weiter!» (We’ll bake more tomorrow!)', 3); }
  }

  // ================================================================ chapter 3: Nikolaus (the boots, the verse, the wish list)
  function bootsShot() { const A = B.boots.A, F = A.front || { x: A.x + 1.5, z: A.z + 1.5 }, y = B.gy(A.x, A.z); shot([A.x + (F.x - A.x) * 2.0 + 0.7, y + 1.1, A.z + (F.z - A.z) * 2.0 + 0.4], [A.x, y + 0.3, A.z]); }
  async function verse() {
    const learn = VERSE.map(([de, en], i) => ({ kind: `The verse · line ${i + 1} of 4`, big: de, gl: `“${esc(en)}”`, model: de, keys: lineKeys(de), echo: true, voice: de, say: i === 0 ? ['Mein Gedicht für den Nikolaus! Sprich mir nach.', 'My poem for Nikolaus! Say it after me.'] : null }));
    const rec = VERSE.map(([de, en], i) => ({ kind: `By heart · line ${i + 1} of 4`, sit: i ? `…${esc(VERSE[i - 1][0])} → and then?` : 'How does it start?', gl: `“${esc(en)}”`, model: de, modelEn: en,
      check: t => { const h = has(t, lineKeys(de)); return h.ok ? { ok: true, minor: h.typo } : { ok: false, why: 'Not quite! (Tab: a hint)' }; }, help: `<span style="letter-spacing:.05em;opacity:.8">${esc(WUI.hintOf(de, 1))}</span>` }));
    rec[0].say = ['Und jetzt auswendig! Sag das ganze Gedicht.', 'And now by heart! Say the whole poem.'];
    return WUI.steps(learn.concat(rec), { title: 'Das Nikolausgedicht', sub: 'Fiete’s verse for Nikolaus', face: 'wmKid', name: 'Fiete' });
  }
  // a wish: «Ich wünsche mir …» / «Ich hätte gern …» / «{mimo} wünscht sich …» with a present in the accusative
  const wishCheck = (frames, model) => t => {
    const T = WUI.toks(t); if (!has(t, frames).ok) return { ok: false, why: `Start like this: «${esc(model.split(' ').slice(0, 3).join(' '))} …»` };
    let gi = -1; for (let i = 0; i < T.length; i++) if (WISHN[T[i]]) { gi = i; break; }
    if (gi < 0) return T.length >= 4 ? { ok: true, note: 'what a wish!' } : { ok: false, why: 'And what do you wish for?' };
    const g = WISHN[T[gi]]; if (g === 'pl') return { ok: true };
    const art = [T[gi - 1], T[gi - 2]].find(w => /^(ein|einen|eine|der|den|die|das|kein|keinen|keine|mein|meinen|meine)$/.test(w || '')), want = { m: 'einen', f: 'eine', n: 'ein' }[g];
    if (!art) return { ok: true, minor: true, note: `with an article: «${want} …»` };
    const okA = { m: ['einen', 'den', 'keinen', 'meinen'], f: ['eine', 'die', 'keine', 'meine'], n: ['ein', 'das', 'kein', 'mein'] }[g];
    const raw = String(t).split(/\s+/).map(x => x.replace(/[^A-Za-zÄÖÜäöüß]/g, '')).find(x => WUI.canon(x) === T[gi]) || T[gi], noun = esc(raw.charAt(0).toUpperCase() + raw.slice(1));
    if (!okA.includes(art)) return { ok: true, grade: 'B', note: `${ART[g]} ${noun} → «${want} ${noun}» (accusative)` };
    return { ok: true };
  };
  async function wishList() {
    const st = S(), list = [], pic = () => WUI.art.wish(list.length ? list : [['…', '']]);
    const addW = who => (c, t, E) => { const s = String(t).trim(); list.push([s.charAt(0).toUpperCase() + s.slice(1).replace(/[.!]*$/, '.'), who]); E.art.innerHTML = ''; E.art.appendChild(pic()); };
    const r = await WUI.steps([
      { kind: 'New · wishing', big: 'Ich wünsche mir einen Schlitten.', gl: '“I’d like a sled (for Christmas).”', note: 'wünschen + mir, and the present in the accusative: der Schlitten → <b>einen</b> Schlitten · die Puppe → <b>eine</b> Puppe · das Buch → <b>ein</b> Buch', say: ['Ich schreibe: «Ich wünsche mir einen Schlitten.»', 'I’m writing: «I wish for a sled.»'], art: pic, echo: true, model: 'Ich wünsche mir einen Schlitten.', keys: [['wunsche mir', 'schlitten']], voice: 'Ich wünsche mir einen Schlitten.' },
      { kind: 'New · the polite way', big: 'Ich hätte gern ein Buch.', gl: '“I’d like a book.”', note: '«Ich hätte gern …» works for wishes too, and in every shop.', art: pic, echo: true, model: 'Ich hätte gern ein Buch.', keys: [['hatte gern', 'buch'], ['hatte gerne', 'buch']], voice: 'Ich hätte gern ein Buch.' },
      { kind: 'Your wish list · 1', say: ['Und du? Was wünschst du dir?', 'And you? What do you wish for?'], art: pic, sit: 'Wish for a present: «Ich wünsche mir …»', model: 'Ich wünsche mir ein Fahrrad.', modelEn: 'I wish for a bike.', check: wishCheck(['wunsche mir'], 'Ich wünsche mir …'), onOk: addW('you') },
      { kind: 'Your wish list · 2', say: ['Noch etwas? Diesmal mit «Ich hätte gern».', 'Anything else? This time with «Ich hätte gern».'], art: pic, sit: 'One more present, the polite way: «Ich hätte gern …»', model: 'Ich hätte gern eine Gitarre.', modelEn: 'I’d like a guitar.', check: wishCheck(['hatte gern', 'hatte gerne'], 'Ich hätte gern …'), onOk: addW('you') },
      { kind: `${mimo()}’s wish`, say: [`Und ${mimo()}? Was wünscht sich ${mimo()}?`, `And ${mimo()}? What does ${mimo()} wish for?`], art: pic, sit: `Say it for ${esc(mimo())}: «${esc(mimo())} wünscht sich …» (sich: himself, herself, itself)`, model: `${mimo()} wünscht sich einen Keks.`, modelEn: `${mimo()} wishes for a cookie.`, check: wishCheck(['wunscht sich', 'wunscht sie sich', 'wunscht er sich'], `${mimo()} wünscht sich …`), onOk: addW('mimo') },
    ], { title: 'Der Wunschzettel', sub: 'for Christmas', face: 'wmKid', name: 'Fiete' });
    if (!r.quit) st.wishes = list.map(([t, w]) => [t, w]);
    return r;
  }
  async function chapter3() {
    const st = S();
    await scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.nik'); await say(B.kid, 'kid.nik2'); await say(B.kid, 'kid.nik3'); });
    if (!st.bootsOut) {
      const r = await WUI.steps([
        { kind: 'Nikolaus · the boots', art: () => WUI.art.boots('dirty'), say: ['Meine Stiefel sind total schmutzig!', 'My boots are totally dirty!'], sit: `Tell ${esc(mimo())} to clean the boots (putzen → «Putz …!»).`, model: 'Putz die Stiefel!', check: cmdCheck({ verb: ['putz', 'putze'], inf: 'putzen', obj: ['stiefel'], model: 'Putz die Stiefel!' }), onOk: (c, t, E) => { E.art.innerHTML = ''; E.art.appendChild(WUI.art.boots('clean')); sfx('learned'); } },
        { kind: 'Nikolaus · where to?', art: () => WUI.art.boots('clean'), say: ['Die glänzen! Und wohin stellen wir sie?', 'They shine! And where do we put them?'], sit: 'In front of the door. Where to (a movement) takes the accusative: «vor die Tür».', model: 'Stell die Stiefel vor die Tür!',
          check: t => { if (has(t, ['vor die tur']).ok) return { ok: true }; if (has(t, ['vor der tur']).ok) return { ok: true, grade: 'B', note: 'where to → accusative: «vor die Tür» (they stand «vor der Tür» afterwards)' }; if (has(t, ['tur']).ok) return { ok: true, minor: true, note: '«Stell die Stiefel vor die Tür!»' }; return { ok: false, why: 'In front of the door: «vor die Tür»' }; },
          onOk: (c, t, E) => { E.art.innerHTML = ''; E.art.appendChild(WUI.art.boots('door')); } },
      ], { title: 'Nikolaus', sub: 'the evening of 5 December', face: 'wmKid', name: 'Fiete' });
      if (r.quit) return;
      st.bootsOut = true;
      await scene(async () => { bootsShot(); await wait(0.4); sparkle(B.boots.A.x, B.gy(B.boots.A.x, B.boots.A.z) + 0.5, B.boots.A.z, 10, ['#fff3a0', '#ffffff'], 'learned'); await wait(1.4); });
    }
    if (!st.verse) { const r = await verse(); if (r.quit) return; st.verse = true; }
    if (!st.filled) {
      await scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.night'); });
      await UI.fade(1, 700); st.filled = true; await UI.chapter('Am nächsten Morgen …', 'The next morning'); await UI.fade(0, 700);
      await scene(async () => { bootsShot(); sfx('chest'); await wait(0.5); await say(B.kid, 'kid.morning'); });
    }
    if (!st.brought) {
      const r = await WUI.steps([
        { kind: 'Nikolaus · what did he bring?', art: () => WUI.art.boots('filled'), say: ['Was hat der Nikolaus gebracht?', 'What did Nikolaus bring?'], sit: 'Name what’s in the boots: at least two things.', model: 'Der Nikolaus hat Nüsse, Mandarinen und Schokolade gebracht!',
          check: t => { const n = [['nusse', 'nuss', 'walnusse'], ['mandarinen', 'mandarine', 'orangen', 'orange'], ['schokolade', 'schoko', 'schokoladennikolaus'], ['lebkuchen', 'lebkuchenherz', 'herz']].filter(ks => has(t, ks).ok).length;
            if (n < 2) return { ok: false, why: n ? 'And what else? (at least two things)' : 'Look in the boots! Nüsse, Mandarinen …' }; return has(t, ['gebracht']).ok ? { ok: true } : { ok: true, minor: true, note: 'a whole sentence: «Der Nikolaus hat … gebracht!»' }; } },
        { kind: `Nikolaus · ${mimo()}’s sock`, art: () => WUI.art.boots('filled'), say: [`Und in ${mimo()}s Socke?`, `And in ${mimo()}’s sock?`], sit: 'A little star cookie! Say what it is.', model: 'Ein Plätzchen!', check: anyCheck(['platzchen', 'keks', 'stern', 'sternchen'], 'A little cookie: «ein Plätzchen»!') },
      ], { title: 'Nikolaus', sub: 'the morning of 6 December', face: 'wmKid', name: 'Fiete' });
      if (r.quit) return;
      st.brought = true; mimoHappy(2);
      await scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.who'); await STORY.you('Mr Otto? Hmm… he does have a white beard…'); });
    }
    await scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.wish'); });
    const r = await wishList(); if (r.quit) return;
    teach('ph.wm.wunsch');
    await scene(async () => { standBy(); shotKid(); B.kid.pose = 'cheer'; await say(B.kid, 'kid.done3'); B.kid.pose = 'idle'; });
    st.ch[3] = true; coins(6, 'Fiete shares his Nikolaus chocolate (and some coins)');
  }

  // ================================================================ chapter 4: Geschenke (Wichteln, gingerbread hearts)
  const giftsArt = W => el => {
    el.innerHTML = W.gifts.map(id => { const G0 = GIFT[id]; return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px"><i data-ic="${G0.icon}"></i><span class="chip">${ART[G0.g]} ${G0.de}</span></div>`; }).join('');
    el.querySelectorAll('i[data-ic]').forEach(s => s.replaceWith(WUI.art.icon(s.dataset.ic, 84)));
  };
  // «Ich schenke ihm einen Ball.»: who gets it (dative), what (accusative)
  const giftCheck = W => t => {
    const T = WUI.toks(t);
    if (!has(t, ['schenke', 'schenk', 'schenken']).ok) return { ok: false, why: `With schenken: «Ich schenke ${esc(W.pro)} …»` };
    const gid = W.gifts.find(id => has(t, [GIFT[id].de]).ok); if (!gid) return { ok: false, why: 'Which present? ' + W.gifts.map(id => `${ART[GIFT[id].g]} ${GIFT[id].de}`).join(' · ') };
    const G0 = GIFT[gid], want = ACC[G0.g], gi = T.indexOf(WUI.canon(G0.de)), art = gi > 0 ? T[gi - 1] : null;
    const pro = T.find(w => ['dir', 'ihm', 'ihr', 'ihnen', 'dich', 'ihn', 'sie', 'du', 'er'].includes(w)), named = W.third && has(t, [W.name]).ok;
    const notes = []; let grade = 'S';
    if (W.polite && pro === 'dir') { grade = 'A'; notes.push('to Mrs Rosa, «Ihnen» is politer than «dir»'); }
    else if (!(pro === WUI.canon(W.pro) || named)) { grade = 'B'; notes.push(`who gets it is in the dative: «${esc(W.pro)}»`); }
    if (art !== want) { grade = WUI.worse(grade, 'B'); notes.push(`${ART[G0.g]} ${G0.de} → «${want} ${G0.de}»`); }
    return { ok: true, grade: grade === 'S' ? undefined : grade, note: notes.join(' · '), gift: gid, said: `Ich schenke ${W.pro} ${want} ${G0.de}.` };
  };
  // a gingerbread heart's message: anything short, in German
  const EN_HINT = ['you', 'love', 'the', 'happy', 'merry', 'christmas', 'my', 'best', 'friend', 'thanks', 'thank', 'are', 'is', 'for', 'and', 'grandma'];
  const DE_HINT = ['ich', 'du', 'dich', 'dir', 'lieb', 'liebe', 'super', 'danke', 'fur', 'frohe', 'weihnachten', 'beste', 'bester', 'toll', 'mein', 'meine', 'sie', 'ihnen', 'herz', 'schatz', 'freund', 'oma', 'opa', 'bist', 'hab', 'habe', 'schon', 'gruss', 'grusse', 'sus', 'suss', 'klasse', 'held', 'trainer', 'lecker', 'mag'];
  const msgCheck = t => {
    const s = String(t).trim(), T = WUI.toks(s);
    if (s.replace(/[^a-zäöüß]/gi, '').length < 2) return { ok: false, why: 'Write a little message!' };
    if (s.length > 28) return { ok: false, why: 'Too long for a heart: 28 letters at most.' };
    if (T.some(w => EN_HINT.includes(w)) && !T.some(w => DE_HINT.includes(w))) return { ok: false, why: 'Auf Deutsch, bitte! (In German, please!) E.g. «Du bist super!»' };
    return { ok: true, said: s };
  };
  // handing a heart over: «Ich schenke Ihnen ein Lebkuchenherz!» (Sie: Ihnen; du: dir), or «Ein Lebkuchenherz für Sie!»
  const heartCheck = h => t => {
    const T = WUI.toks(t);
    if (!has(t, ['lebkuchenherz', 'herz', 'lebkuchen']).ok) return { ok: false, why: 'What is it? «ein Lebkuchenherz»' };
    const want = h.sie ? ['ihnen', 'fur sie'] : ['dir', 'fur dich'], other = h.sie ? ['dir', 'fur dich'] : ['ihnen', 'fur sie'];
    const notes = []; let grade = 'S';
    if (!has(t, ['schenke', 'schenk', 'fur']).ok) { grade = 'A'; notes.push(`say you’re giving it: «Ich schenke ${h.sie ? 'Ihnen' : 'dir'} ein Lebkuchenherz!»`); }
    if (has(t, want).ok) { /* right */ } else if (has(t, other).ok) { grade = WUI.worse(grade, 'A'); notes.push(h.sie ? `${h.name} is «Sie»: «Ihnen» (or «für Sie»)` : 'Bruno is «du»: «dir» (or «für dich»)'); }
    else if (T.includes('dich')) { grade = WUI.worse(grade, 'B'); notes.push('who gets it is in the dative: «dir»'); }
    if (T.includes('einen') || T.includes('eine')) { grade = WUI.worse(grade, 'B'); notes.push('das Herz → «ein Lebkuchenherz»'); }
    return { ok: true, grade: grade === 'S' ? undefined : grade, note: notes.join(' · ') };
  };
  let GIFTBOX = null;
  function giftBox(x, z) {
    if (!GIFTBOX) { GIFTBOX = new THREE.Group(); const k = ZHF.Kit(); k.box(0, 0.16, 0, 0.32, 0.3, 0.32, '#2f7fc9', { ink: 0.008 }).box(0, 0.16, 0, 0.34, 0.31, 0.07, '#ffd23f', { ink: 0 }).box(0, 0.16, 0, 0.07, 0.31, 0.34, '#ffd23f', { ink: 0 }).ball(-0.06, 0.34, 0, 0.07, 0.05, 0.04, '#ffd23f', { ink: 0.004 }).ball(0.06, 0.34, 0, 0.07, 0.05, 0.04, '#ffd23f', { ink: 0.004 }); ZHF.bake(GIFTBOX, k); }
    const g = GIFTBOX.clone(); g.position.set(x, B.gy(x, z), z); B.root.add(g); return g;
  }
  async function giftScene() {
    const st = S(), boxes = [];
    try {
      for (const [id, key] of [['bruno', 'bruno.gift'], ['baker', 'marta.gift'], ['rosa', 'rosa.gift']]) {
        const n = G.sim.npc(id); if (!n) continue;
        const Y = G.sim.you, dx = Y.x - n.x, dz = Y.z - n.z, d = Math.hypot(dx, dz) || 1;
        boxes.push(giftBox(n.x + dx / d * 0.85, n.z + dz / d * 0.85));
        await scene(async () => { shotAt(n, 3.0); await wait(0.4); await say(talker(n, id === 'baker' ? 'Marta' : id === 'rosa' ? 'Oma Rosa' : 'Bruno', NPC_TOP[id]), key); });
      }
      const fg = st.gifts.fiete ? GIFT[st.gifts.fiete] : GIFT.ball;
      await scene(async () => { standBy(); shotKid(); B.kid.pose = 'cheer'; await sayRaw(B.kid, `${ACC[fg.g] === 'einen' ? 'Ein' : ACC[fg.g] === 'eine' ? 'Eine' : 'Ein'} ${fg.de}! Juhu! Danke!`, `${cap(fg.en)}! Yay! Thank you!`); B.kid.pose = 'idle'; });
    } finally { boxes.forEach(b => B.root.remove(b)); }
  }
  async function chapter4() {
    const st = S();
    if (!st.wich) {
      await scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.wichteln'); await say(B.kid, 'kid.dativ'); });
      const steps = [{ kind: 'New · giving presents', big: 'Ich schenke dir einen Ball.', gl: '“I’m giving you a ball.”', note: esc(PHI['ph.wm.schenke'].note), art: icoArt('wmBall', 100), echo: true, model: 'Ich schenke dir einen Ball.', keys: [['schenke dir', 'ball']], voice: 'Ich schenke dir einen Ball.' }];
      for (const W of WICHTEL) steps.push({ kind: `Wichteln · ${W.name}`, say: W.ask, art: giftsArt(W), sit: `Pick one of the three and say it: «Ich schenke ${esc(W.pro)} …» (${esc(W.en)})`,
        model: `Ich schenke ${W.pro} ${ACC[GIFT[W.gifts[0]].g]} ${GIFT[W.gifts[0]].de}.`, check: giftCheck(W), then: r => { st.gifts[W.id] = (r.r && r.r.gift) || W.gifts[0]; } });
      const r = await WUI.steps(steps, { title: 'Wichteln', sub: 'secret presents (dative and accusative)', face: 'wmKid', name: 'Fiete' });
      if (r.quit) return;
      st.wich = true; teach('ph.wm.schenke');
      await scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.secret'); });
      await giftScene();
    }
    if (!st.heartsMade) {
      await scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.hearts'); });
      const who = [...HEARTS.map(h => ({ id: h.id, name: h.name })), { id: 'mimo', name: mimo() }];
      const steps = [{ kind: 'New · a heart’s message', big: 'Ich hab dich lieb!', gl: `“${esc(PHI['ph.wm.liebhab'].en)}”`, note: esc(PHI['ph.wm.liebhab'].note), art: () => WUI.art.heart('Ich hab dich lieb!', 210), echo: true, model: 'Ich hab dich lieb!', keys: PHI['ph.wm.liebhab'].keys, voice: 'Ich hab dich lieb!' }];
      for (const w of who) steps.push({ kind: `A heart for ${w.name}`, art: () => WUI.art.heart('', 210), say: [`Was schreiben wir auf das Herz für ${w.name}?`, `What shall we write on ${w.name}’s heart?`],
        sit: 'Write a short message in icing (in German, 28 letters at most): «Du bist super!», «Danke!», «Frohe Weihnachten!», «Ich hab dich lieb!»…', model: w.id === 'mimo' ? 'Ich hab dich lieb!' : w.id === 'bruno' ? 'Du bist super!' : 'Frohe Weihnachten!', check: msgCheck, placeholder: 'your message…',
        onOk: (c, t, E) => { st.hearts[w.id] = String(t).trim(); E.art.innerHTML = ''; E.art.appendChild(WUI.art.heart(st.hearts[w.id], 210)); sfx('learned'); }, pause: 1.6 });
      const r = await WUI.steps(steps, { title: 'Lebkuchenherzen', sub: 'with a message in icing', face: 'wmKid', name: 'Fiete' });
      if (r.quit) return;
      st.heartsMade = true; teach('ph.wm.liebhab'); bag('k.wmHeart', 3);
      await scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.go'); });
      UI.toast('Give the gingerbread hearts to Oma Rosa, Bruno and Herr Otto (see your Quests)');
      return;
    }
    const n = HEARTS.filter(h => st.given[h.id]).length;
    if (n < 3) { await scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.go'); }); think(`${n} of 3 hearts given.`, 3); return; }
    await scene(async () => {
      standBy(); shotKid(); await say(B.kid, 'kid.mimoheart');
      st.neck = true; st.neckOff = false; mimoBits(); if (NECK) NECK.visible = true;
      const M = G.sim.mimo; mimoHappy(2.2); sparkle(M.x, M.ry + 0.7, M.z, 16, ['#ff7aa2', '#ffd23f'], 'learned');
      UI.toast(`${mimo()} wears a gingerbread heart: «${st.hearts.mimo || '♥'}»`);
      B.kid.pose = 'cheer'; await say(B.kid, 'kid.done4'); B.kid.pose = 'idle';
    });
    st.ch[4] = true; bag('k.wmHeart', 0); coins(8, 'Fiete’s thank-you for the presents');
  }
  async function giveHeart(h) {
    const st = S(), p = whoTalker(h.where, h.name); if (!p) return;
    const msg = st.hearts[h.id] || 'Frohe Weihnachten!';
    const r = await WUI.steps([{ kind: `A heart for ${h.name}`, art: () => WUI.art.heart(msg, 210), say: [`Für ${h.name}! Sag es ${h.sie ? 'höflich, mit «Sie»' : 'mit «du»'}.`, `For ${h.name}! Say it ${h.sie ? 'politely, with «Sie»' : 'with «du»'}.`],
      sit: `Give ${esc(h.name)} the heart: «Ich schenke ${h.sie ? '…' : '…'} ein Lebkuchenherz!» (${h.sie ? 'Sie → Ihnen' : 'du → dir'})`, model: `Ich schenke ${h.sie ? 'Ihnen' : 'dir'} ein Lebkuchenherz!`, check: heartCheck(h) }],
      { title: 'Lebkuchenherzen', sub: 'giving them away', face: 'wmKid', name: 'Fiete' });
    if (r.quit) return;
    st.given[h.id] = true; bag('k.wmHeart', 3 - HEARTS.filter(q => st.given[q.id]).length);
    const L0 = lineOf(h.reply);
    await scene(async () => { shotAt(p); await sayRaw(p, `«${msg}» … ${L0.de}`, `(reading your heart: «${msg}») ${L0.en}`); });
    mimoHappy(1.2);
    if (HEARTS.every(q => st.given[q.id])) think('All three hearts given! Back to Fiete.', 4);
  }

  // ================================================================ chapter 5: die Marktnacht
  const WIDE = [[C.x + 3.2, 7.4, C.z + 17.5], [C.x, 2.6, C.z - 3]], PYRSHOT = [[C.x + 3.6, 3.3, C.z + 1.6], [SPOT.pyr.x, 2.1, SPOT.pyr.z]], SKY = [[C.x + 1, 2.4, C.z + 10], [C.x, 7.5, C.z - 4]];
  const LAYER = [2, 4, 8, 16, 32, 63];
  const CROWD = [[106, 5.6], [122, 5.5], [146, 5.7], [166, 5.4], [186, 5.6], [318, 5.4], [340, 5.6], [8, 5.5]];
  function makeCrowd() {
    if (B.crowd) return B.crowd;
    const LOOKS = [{ skin: '#f0c7a0', hair: '#6b3b25', shirt: '#3f6fb5', pants: '#2f3440', hat: 'beanie', hatCol: '#d6332a' }, { skin: '#c98e62', hair: '#2b2235', shirt: '#c9553f', pants: '#3f4a5a', hat: 'beanie', hatCol: '#e8c35a' },
      { skin: '#e8b48a', hair: '#e8e4dc', shirt: '#4f8a4a', pants: '#3f3a35', old: true, hat: 'flat', hatCol: '#5a4a3a' }, { kid: true, skin: '#f5cda2', hair: '#c98a4a', shirt: '#e86a9a', pants: '#3f5f8f', hat: 'beanie', hatCol: '#7ee08f' },
      { skin: '#a8714a', hair: '#2b2235', shirt: '#8a5ab0', pants: '#2f3440', hat: 'beanie', hatCol: '#3f8fd9' }, { skin: '#f0c7a0', hair: '#c9763a', shirt: '#e8b23a', pants: '#3f4a5a', glasses: true },
      { kid: true, skin: '#c98e62', hair: '#2b2235', shirt: '#3f8fd9', pants: '#2f3440', hat: 'beanie', hatCol: '#d6332a' }, { skin: '#e6b48c', hair: '#8a5a3a', shirt: '#7a4f8f', pants: '#3f3a35', mustache: true, hat: 'flat', hatCol: '#2f3440' }];
    B.crowd = CROWD.map(([a, r], i) => { const p = ZHF.person(LOOKS[i % LOOKS.length]), q = ring(a, r); p.x = q.x; p.z = q.z; p.y = B.GY; p.faceAt = { x: SPOT.pyr.x, z: SPOT.pyr.z }; p.noTurn = true; p.root.visible = false; B.root.add(p.root); return p; });
    return B.crowd;
  }
  function festOn() {
    FEST.on = true; FEST.night = true; FEST.snow = false; FEST.level = 0.4; FEST.mask = 0;
    LOOK.staged = true; for (const id of ORDER) { LOOK.up[id] = true; LOOK.open[id] = false; LOOK.lit[id] = false; } LOOK.pyrUp = true; LOOK.pyrLit = 0; LOOK.lamps = false;
    nightBuild(); NIGHT.k = Math.max(NIGHT.k, 0.6);
    makeCrowd().forEach(p => { p.root.visible = true; p.pose = 'idle'; p.talking = false; });
    kidTo(ring(250, 3.9), SPOT.pyr); B.kid.away = true;
    standAt(SPOT.you, SPOT.look); G.fx.hush = 0.5;
    const H0 = makeStille(); H0.g.visible = true; H0.s = 0.01; H0.sWant = 0.01; H0.y = 15;
  }
  function festOff() {
    FEST.on = false; FEST.night = false; FEST.snow = false; FEST.mask = 63; LOOK.staged = false;
    if (B.crowd) B.crowd.forEach(p => { p.root.visible = false; p.talking = false; });
    if (B.stille) B.stille.g.visible = false;
    kidHome(); G.fx.hush = 0; WUI.hud.close();
  }
  const sing = on => { if (B.crowd) B.crowd.forEach(p => { p.talking = on; }); B.kid.talking = on; };
  const lineCheck = line => t => { const h = has(t, lineKeys(line)); return h.ok ? { ok: true, minor: h.typo, said: line } : { ok: false, why: 'Not quite! Tab shows more letters.' }; };
  const ORD = [['erste', 'ersten'], ['zweite', 'zweiten'], ['dritte', 'dritten'], ['vierte', 'vierten']], ORD_EN = ['first', 'second', 'third', 'fourth'];
  const candleCheck = n => t => {
    const T = WUI.toks(t), ord = ORD[n - 1].some(w => T.includes(w)), other = ORD.some((o, i) => i !== n - 1 && o.some(w => T.includes(w)));
    if (!ord && other) return { ok: false, why: `That’s another candle! The ${ORD_EN[n - 1]}: «die ${ORD[n - 1][0]} Kerze»` };
    if (!ord && !has(t, ['kerze', 'kerzen']).ok) return { ok: false, why: `The ${ORD_EN[n - 1]} candle: «die ${ORD[n - 1][0]} Kerze»` };
    if (!ord) return { ok: true, minor: true, note: `which one? «die ${ORD[n - 1][0]} Kerze»` };
    if (!has(t, ['zunde', 'zund', 'mach', 'zundet']).ok) return { ok: true, minor: true, note: `the whole command: «Zünde die ${ORD[n - 1][0]} Kerze an!»` };
    if (!T.includes('an')) return { ok: true, minor: true, note: 'anzünden comes apart: «Zünde … an!»' };
    return { ok: true };
  };
  // one couplet: Fiete (and the town) sing the first line, you sing the second
  async function couplet(k, i, n, o = {}) {
    const [a, b, en] = SONG[k];
    sing(true); setTimeout(() => sing(false), 2400);
    return WUI.hud.call({ draw: (c, s) => { c.fillStyle = '#1f2a44'; c.fillRect(0, 0, s, s); c.font = `900 ${s * 0.5}px serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffd23f'; c.fillText('♪', s / 2, s / 2 + 4); },
      title: `♪ ${o.who || 'Fiete'}: «${esc(a)}»`, sub: `Sing the next line! <i style="opacity:.7">(${esc(en)})</i>`, bar: i / n, model: b, modelEn: en, check: lineCheck(b), help: `<span style="letter-spacing:.05em;opacity:.75">${esc(WUI.hintOf(b, 1))}</span>`, placeholder: 'sing it…' });
  }
  async function chapter5() {
    const st = S();
    await scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.tonight'); await say(B.kid, 'kid.song'); await say(B.kid, 'kid.song2'); });
    if (!st.rehearsed) {
      const steps = SONG_ORDER.map((k, i) => { const [a, b, en] = SONG[k]; return { kind: `Das Lichterlied · verse ${i + 1} of ${SONG_ORDER.length}`, say: ['♪ ' + a, en], big: b, gl: `“${esc(en)}”`, echo: true, model: b, keys: lineKeys(b), voice: b }; });
      const r = await WUI.steps(steps, { title: 'Das Lichterlied', sub: 'the rehearsal: Fiete sings the first line, you sing the second', face: 'wmKid', name: 'Fiete' });
      if (r.quit) return;
      st.rehearsed = true;
    }
    let quit = false; const grades = [];
    const go = async (p) => { const g = await p; if (g === 'quit') { quit = true; return null; } grades.push(g); return g; };
    try {
      await UI.fade(1, 800); festOn(); shot(...WIDE); await UI.fade(0, 1000);
      const H0 = B.stille;
      await scene(async () => {
        shot(...WIDE); await say(B.kid, 'kid.dark');
        sfx('grow'); H0.sWant = 1; for (let i = 0; i < 50; i++) { H0.y = lerp(15, 11.5, i / 49); G.fx.hush = Math.min(0.6, G.fx.hush + 0.004); await wait(0.04); }
        shot(...SKY); await say(B.kid, 'kid.look');
      });
      lock(true); WUI.hud.open('Die Marktnacht · sing against the Hush');
      shot(...WIDE);
      if (!await go(couplet('intro', 0, 16))) return;
      // the pyramid: the first candle… which the Hush blows out
      shot(...PYRSHOT); await sayHud('kid.pyrgo');
      if (!await go(WUI.hud.call({ icon: 'wmCandle', title: 'Die erste Kerze', sub: 'Light the first candle! anzünden comes apart: «Zünde … an!»', bar: 1 / 16, model: 'Zünde die erste Kerze an!', modelEn: 'Light the first candle!', check: candleCheck(1) }))) return;
      LOOK.pyrLit = 1; sfx('chime'); sparkle(SPOT.pyr.x, B.GY + 0.9, SPOT.pyr.z, 8, ['#ffd23f', '#ff9a3a']);
      await wait(1.0); H0.blow = 1.3; sfx('poof'); for (let i = 0; i < 6; i++) puff(SPOT.pyr.x + (Math.random() - 0.5), B.GY + 1.5 + i * 0.3, SPOT.pyr.z + 1, 3, 0.5);
      await wait(0.7); LOOK.pyrLit = 0; G.fx.hush = 0.62; sfx('hurt');
      await sayHud('kid.blown');
      if (!await go(couplet('light', 2, 16))) return;
      H0.flinch = 1; sfx('hit');
      for (let n = 1; n <= 4; n++) {
        if (!await go(WUI.hud.call({ icon: 'wmCandle', title: `Die ${ORD[n - 1][0]} Kerze`, sub: `Light the ${ORD_EN[n - 1]} candle!`, bar: (2 + n) / 16, model: `Zünde die ${ORD[n - 1][0]} Kerze an!`, modelEn: `Light the ${ORD_EN[n - 1]} candle!`, check: candleCheck(n) }))) return;
        LOOK.pyrLit = n; sfx('chime'); sparkle(SPOT.pyr.x, B.GY + 0.9, SPOT.pyr.z, 10, ['#ffd23f', '#ff9a3a']); G.fx.hush = Math.max(0.3, G.fx.hush - 0.05); H0.flinch = 0.6;
        await wait(0.5);
      }
      FEST.mask = 1; H0.sWant = 0.85; await sayHud('kid.turns');
      if (!await go(couplet('pyr', 7, 16))) return;
      // the stalls, one by one: their lights, their song, the music coming back
      await sayHud('kid.now');
      for (let i = 0; i < ORDER.length; i++) {
        const id = ORDER[i], H1 = B.hutOf[id]; nightShot(H1);
        if (!await go(couplet(id, 8 + i, 16, { who: 'Fiete und Alba' }))) return;
        LOOK.lit[id] = true; LOOK.open[id] = true; H1.v.pose = 'cheer'; setTimeout(() => { H1.v.pose = 'hold'; }, 1800);
        sfx('chime'); sparkle(H1.P.x, B.GY + 2.4, H1.P.z, 16, ['#ffd23f', '#ff6a5a', '#7ee08f']);
        FEST.mask |= LAYER[i]; H0.flinch = 1; H0.sWant = Math.max(0.2, 0.85 - (i + 1) * 0.11); G.fx.hush = Math.max(0, 0.3 - (i + 1) * 0.05);
        await wait(1.1);
      }
      // everyone together: the square's own lamps, then the last verse
      shot(...WIDE);
      if (!await go(WUI.hud.call({ icon: 'wmStille', title: 'Fiete: «Und jetzt alle zusammen! Was rufen wir?»', sub: 'Everyone shouts it, and the whole square lights up: “Lights on!”', bar: 14 / 16, model: 'Lichter an!', modelEn: 'Lights on!', check: anyCheck(PHI['ph.wm.lichter'].keys, '«Lichter an!»') }))) return;
      LOOK.lamps = true; sfx('fanfare'); H0.flinch = 1; H0.sWant = 0.12;
      await wait(0.8);
      if (!await go(couplet('end', 15, 16, { who: 'Alle' }))) return;
      // the Hush turns into snow
      FEST.mask = 63; FEST.level = 0.46; sfx('poof');
      for (let i = 0; i < 12; i++) puff(H0.g.position.x + (Math.random() - 0.5) * 6, H0.g.position.y + (Math.random() - 0.5) * 3, H0.g.position.z + (Math.random() - 0.5) * 4, 4, 0.9);
      H0.g.visible = false; G.fx.hush = 0; FEST.snow = true;
      WUI.hud.close(); lock(false);
      await wait(1.2);
      await scene(async () => { shot(...SKY); await say(B.kid, 'kid.snow'); });
      lock(true); WUI.hud.open('Die Marktnacht');
      shot(...WIDE);
      if (!await go(WUI.hud.call({ icon: 'wmPunsch', title: 'Lights, snow, warm punch and music…', sub: 'Say how cozy it is! «gemütlich»', bar: 1, model: 'Wie gemütlich!', modelEn: 'How cozy!', check: anyCheck(PHI['ph.wm.gemuetlich'].keys, '«Wie gemütlich!»') }))) return;
      WUI.hud.close(); lock(false);
      // the Pudelmütze, from Oma Hilde
      await scene(async () => {
        kidTo(ring(80, 3.6), G.sim.you); const k = B.kid; shot([k.x + 2.4, B.GY + 1.6, k.z + 2.6], [k.x, B.GY + 0.9, k.z]);
        k.pose = 'cheer'; await say(k, 'kid.thanks'); k.pose = 'idle';
        await say(k, 'kid.hat');
        st.hat = true; st.hatOff = false; if (G.state.adolf && G.state.adolf.cap) G.state.adolf.capOn = false;
        mimoBits(); if (HAT) HAT.visible = true;
        const M = G.sim.mimo; mimoHappy(2.5); M.glow = 1; sparkle(M.x, M.ry + 0.9, M.z, 20, ['#ff6a5a', '#ffffff'], 'learned');
        UI.toast(`${mimo()} wears Oma Hilde’s Pudelmütze!`);
        await say(k, 'kid.hat2');
      });
      st.ch[5] = true; st.grades = grades;
      ['ph.wm.lichter', 'ph.wm.gemuetlich', 'ph.wm.frohe'].forEach(teach);
      coins(16, 'Alba’s stallholders thank you, with a little of everything');
    } finally {
      lock(false); WUI.hud.close();
      const done = !!st.ch[5];
      festOff();
      if (done) { EVE.on = true; UI.toast('The market stays lit tonight. Walk around! (Leave the square, and it’s day again.)'); }
      else if (quit) { G.cam.override = null; think('Fiete: «Wir versuchen es noch mal!» (We’ll try again!)', 3); }
    }
  }
  // a line of Fiete's while the bar is open (the bar steps aside for it)
  // (while it talks, the bar hides and gives the keyboard back, so E carries the line on)
  async function sayHud(key) { const open = WUI.hud.isOpen; if (open) hudAside(true); try { await say(B.kid, key); } finally { if (open) hudAside(false); } }
  function hudAside(on) { const el = document.getElementById('wmhud'); if (el) el.style.visibility = on ? 'hidden' : ''; Input.typing = !on; if (G) G.state.teaching = !on; }

  // ================================================================ after the market night: buying, an evening at the market, practice, singing
  function eveOff() { EVE.on = false; }
  async function buy(h) {
    const S0 = h.S0, cost = Math.max(1, Math.round(S0.price / 100));
    if ((G.state.coins || 0) < cost) { think(`${S0.sign} costs ${cost} coins. Not enough coins!`, 3); return; }
    const v = Object.assign(talker(h.v, S0.vendor, h.v.top), {});
    await scene(async () => { shotAt(h.v, 2.9); await sayRaw(v, S0.call[0], S0.call[1]); });
    lock(true); WUI.hud.open(`${S0.sign} · ${S0.vendor}`);
    try {
      const g1 = await WUI.hud.call({ icon: S0.icon, title: `${esc(S0.vendor)}: «Guten Abend! Was darf’s sein?»`, sub: `Order ${esc(S0.en.split(',')[0].split(':')[0])} (${WUI.euro(S0.price)}), politely.`, model: `Ich hätte gern ${S0.acc}.`, modelEn: 'I’d like …', check: orderCheck(S0) });
      if (g1 === 'quit') return;
      const g2 = await WUI.hud.call({ icon: S0.icon, title: `${esc(S0.vendor)}: «Gern! Das macht ${esc(WUI.euroWords(S0.price))}.»`, sub: 'Pay, with a word.', model: 'Hier, bitte!', check: anyCheck(['hier bitte', 'bitte schon', 'bitte', 'hier', 'stimmt so', 'bitte sehr'], '«Hier, bitte!»') });
      if (g2 === 'quit') return;
      G.state.coins = (G.state.coins || 0) - cost; sfx('chest'); mimoHappy(2.2);
      const M = G.sim.mimo; sparkle(M.x, M.ry + 0.8, M.z, 10, ['#ffd23f', '#ff9a3a']);
      const g3 = await WUI.hud.call({ icon: S0.icon, title: `${esc(S0.vendor)}: «Danke schön! Schönen Abend noch!»`, sub: 'Send the wish back!', model: 'Danke, gleichfalls!', check: anyCheck(PHI['ph.wm.gleichfalls'].keys.concat(['danke']), '«Danke, gleichfalls!»') });
      if (g3 !== 'quit') UI.toast(`${S0.sign}! ${mimo()} has a taste. −${cost} coins`);
    } finally { WUI.hud.close(); lock(false); }
  }
  async function practice() {
    const ids = PH.filter(p => LEX.item(p.id) && LEX.taught(p.id)).map(p => p.id); if (!ids.length) return;
    const pickN = WUI.shuffle(ids.slice()).slice(0, 5);
    const r = await WUI.steps(pickN.map(id => { const p = PHI[id]; return { kind: 'From memory · what do you say?', sit: esc(p.sit), model: p.model, modelEn: p.en, keys: p.keys }; }),
      { title: 'Üben mit Fiete', sub: 'the market’s expressions', face: 'wmKid', name: 'Fiete', intro: ['Weißt du noch?', 'Do you remember?'] });
    if (r.quit) return;
    const right = r.grades.filter(g => g === 'S' || g === 'A').length;
    if (right) coins(right, `Practice: ${right} of ${r.grades.length} from memory`);
  }
  const SING = { on: false };
  async function singAlong() {
    SING.on = true;
    try {
      const steps = SONG_ORDER.map((k, i) => { const [a, b, en] = SONG[k]; return { kind: `Das Lichterlied · verse ${i + 1}`, say: ['♪ ' + a, en], sit: 'Sing the next line!', model: b, modelEn: en, check: lineCheck(b), help: `<span style="letter-spacing:.05em;opacity:.75">${esc(WUI.hintOf(b, 1))}</span>` }; });
      const r = await WUI.steps(steps, { title: 'Das Lichterlied', sub: 'singing it with Fiete', face: 'wmKid', name: 'Fiete' });
      if (!r.quit) { const s = r.grades.filter(g => g === 'S').length; UI.toast(`Fiete: «Wie schön!» ${s} of ${r.grades.length} lines perfect.`); }
    } finally { SING.on = false; }
  }

  // ================================================================ Fiete's menu
  const CH = [
    { n: 1, title: 'Die Buden', sub: 'the stalls, their prices, playing market, the Advent calendar', gate: f => !!f.rosa, wait: 'after Rosa’s welcome', run: () => chapter1() },
    { n: 2, title: 'Plätzchen backen', sub: 'cookies with Marta: the recipe as commands', gate: f => !!f.boss, wait: 'after the big Hushling on the hill', run: () => chapter2() },
    { n: 3, title: 'Nikolaus', sub: 'the boots, a verse, the wish list', gate: f => (f.bells || 0) >= 1, wait: 'after the first bell', run: () => chapter3() },
    { n: 4, title: 'Geschenke', sub: 'Wichteln and gingerbread hearts', gate: f => (f.bells || 0) >= 2, wait: 'after the second bell', run: () => chapter4() },
    { n: 5, title: 'Die Marktnacht', sub: 'the lights against the Hush', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell', run: () => chapter5() },
  ];
  function nextDoorWhen() {
    const st = S(), c = st.cal, n = c.open + 1, cap = n === 24 ? (st.ch[5] ? 24 : 0) : CAP[chDone(st)];
    if (c.open >= 24) return 'all 24 doors open!';
    if (n > cap) return `door ${n}: after the next chapter${n === 24 ? ' (the market night)' : ''}`;
    const s = Math.max(0, Math.ceil((DOOR_GAP - (G.state.time - c.lastT)) / 60));
    return `door ${n}: in about ${s} minute${s === 1 ? '' : 's'} of play (or tomorrow)`;
  }
  let talking = false;
  async function kidTalk() { if (talking) return; talking = true; try { await kidTalk0(); } finally { talking = false; } }
  async function kidTalk0() {
    const st = S(), f = flags();
    if (!st.met) return meet();
    const next = CH.find(c => !st.ch[c.n]), opts = [];
    if (next) {
      const nh = HEARTS.filter(h => st.given[h.id]).length;
      opts.push(next.gate(f) ? { label: `Chapter ${next.n}: ${next.title}`, sub: next.n === 4 && st.heartsMade ? `gingerbread hearts given: ${nh}/3` : next.sub, value: 'next' } : { label: `Chapter ${next.n}: ${next.title}`, sub: `later: ${next.wait}`, value: 'wait' });
    }
    const c = st.cal, T0 = c.task ? DOORS[c.task - 1] : null;
    if (T0) opts.push({ label: `Advent door ${T0.n}: the task`, sub: T0.kind === 'say' ? `${T0.task}: «${T0.model}»` : 'answer it here', value: 'task' });
    else if (doorReady()) opts.push({ label: `Open door ${c.open + 1} of the Advent calendar`, sub: 'a little task behind it', value: 'door' });
    else if (st.ch[1] && c.open < 24) opts.push({ label: 'The Advent calendar', sub: nextDoorWhen(), value: 'calwait' });
    if (st.ch[1]) opts.push({ label: 'Practice the market’s expressions', sub: 'from memory, for a coin each', value: 'practice' });
    if (st.ch[5]) opts.push({ label: EVE.on ? 'Back to daytime' : 'An evening at the market', sub: EVE.on ? '' : 'night falls over the lit market, with snow', value: 'eve' }, { label: 'Sing the Lichterlied', value: 'sing' });
    opts.push({ label: 'Chat', value: 'chat' });
    if (st.hat) opts.push({ label: hatOn() ? `Take ${mimo()}’s Pudelmütze off` : `Put the Pudelmütze on ${mimo()}`, value: 'hat' });
    if (st.neck) opts.push({ label: neckOn() ? `Take ${mimo()}’s heart necklace off` : `Put the heart necklace on ${mimo()}`, value: 'neck' });
    const v = await UI.choose('Fiete: «Juhu, da bist du ja! Was machen wir?» (Yay, there you are! What shall we do?)', opts);
    if (v === 'next') return next.run();
    if (v === 'wait') return scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.wait'); });
    if (v === 'task') return T0.kind === 'here' ? doDoorHere(T0) : scene(async () => { standBy(); shotKid(); await sayRaw(B.kid, `Geh zu ${T0.name}! Sag: «${T0.model}»`, `Go to ${T0.name}! Say: «${T0.model}»`); });
    if (v === 'door') { await scene(async () => { standBy(); shotKid(); await say(B.kid, 'kid.door'); }); return openDoor(); }
    if (v === 'calwait') return think(`Fiete’s calendar: ${nextDoorWhen()}.`, 4);
    if (v === 'practice') return practice();
    if (v === 'eve') { EVE.on = !EVE.on; UI.toast(EVE.on ? 'Evening falls over the market…' : 'Back to daytime.'); return; }
    if (v === 'sing') return singAlong();
    if (v === 'chat') { st.chat = (st.chat || 0) + 1; return scene(async () => { standBy(); shotKid(); await say(B.kid, st.ch[5] && st.chat % 3 === 0 ? 'kid.idle6' : ['kid.idle1', 'kid.idle2', 'kid.idle3', 'kid.idle4', 'kid.idle5'][st.chat % 5]); }); }
    if (v === 'hat') { st.hatOff = hatOn(); if (!st.hatOff && G.state.adolf && G.state.adolf.cap) G.state.adolf.capOn = false; UI.toast(st.hatOff ? 'Pudelmütze off.' : `${mimo()} wears the Pudelmütze again!`); if (G.save) G.save(); return; }
    if (v === 'neck') { st.neckOff = neckOn(); UI.toast(st.neckOff ? 'Necklace off.' : `${mimo()} wears the gingerbread heart again!`); if (G.save) G.save(); }
  }

  // ================================================================ what you can press E on (STORY.extra)
  const PROVIDER = {
    interactables() {
      if (!B || !shown() || WUI.isOpen || FEST.on || (G.indoors && G.indoors())) return [];
      const L0 = [], Y = G.sim.you, st = S(), add = (x, z, r, label, run, y) => L0.push({ x, z, y: y !== undefined ? y : B.gy(x, z), r, label, run });
      if (!B.kid.away && Math.hypot(Y.x - B.kid.x, Y.z - B.kid.z) < 14) add(B.kid.x, B.kid.z, 2.0, 'Talk', kidTalk);
      const T0 = st.cal.task ? DOORS[st.cal.task - 1] : null;
      if (T0 && T0.kind === 'say') { const p = who(T0.who); if (p && Math.hypot(Y.x - p.x, Y.z - p.z) < 6) add(p.x, p.z, 2.2, `Advent door ${T0.n}: «${T0.model}»`, () => doDoorSay(T0)); }
      if (st.heartsMade && !st.ch[4]) for (const h of HEARTS) if (!st.given[h.id]) { const p = who(h.where); if (p && Math.hypot(Y.x - p.x, Y.z - p.z) < 6) add(p.x, p.z, 2.2, 'Give a gingerbread heart (Lebkuchenherz)', () => giveHeart(h)); }
      if (st.ch[5]) for (const h of B.huts) if (h.open && Math.hypot(Y.x - h.counter.x, Y.z - h.counter.z) < 3) add(h.counter.x, h.counter.z, 1.9, `Buy: ${h.S0.sign} (${Math.max(1, Math.round(h.S0.price / 100))} coins)`, () => buy(h));
      return L0;
    },
    tick(dt, Y) {
      if (!B || !shown()) return;
      const st = S();
      if (!st.seen && Math.hypot(Y.x - B.kid.x, Y.z - B.kid.z) < 9) { st.seen = true; think('A kid in a red bobble hat waves a paper star lantern at you: «Hallo! Hallo, du da!»', 4.5); }
      if (doorReady() && st.cal.told !== st.cal.open + 1) { st.cal.told = st.cal.open + 1; UI.toast(`Fiete’s Advent calendar: door ${st.cal.open + 1} is ready!`); }
    },
  };

  // ================================================================ the quest (quests.js LIST: German games only)
  function quest() {
    const w = s => s.wm || {}, ch = (s, n) => !!(w(s).ch && w(s).ch[n]), kidAt = () => (B ? { x: B.kid.x, z: B.kid.z } : SPOT.kid);
    // a pending Advent door's person comes first; then the chapter's own target
    const doorAt = () => { const st = G && G.state && G.state.wm, T0 = st && st.cal && st.cal.task ? DOORS[st.cal.task - 1] : null; if (T0 && T0.kind === 'say') { const p = who(T0.who); if (p) return { x: p.x, z: p.z }; } return null; };
    const step = (n, text, why, hint, target) => ({ get text() { const c = CH[n - 1]; return c && !c.gate(flags()) ? text : text.replace(/ \(after [^)]*\)$/, ''); }, why, done: s => ch(s, n), target: () => doorAt() || (target ? target() : kidAt()), hint });
    const nextHeart = () => { const st = G && G.state && G.state.wm; if (st && st.heartsMade && !st.ch[4]) for (const h of HEARTS) if (!st.given[h.id]) { const p = who(h.where); if (p) return { x: p.x, z: p.z }; } return kidAt(); };
    const nH = s => HEARTS.filter(h => (w(s).given || {})[h.id]).length;
    return {
      id: 'wm', kind: 'side', title: 'Fiete’s Weihnachtsmarkt', giver: 'Fiete, the kid with the star lantern by the bell tower',
      started: s => s.lang === 'de' && !!w(s).met,
      steps: [
        step(1, 'Put up the Christmas market with Fiete', 'The stalls go up around the fountain as you say what each one sells, then the prices, then playing market. And Fiete’s Advent calendar: a little task behind each door.', '{mimo} points at the kid with the star lantern.'),
        step(2, 'Bake Christmas cookies with Marta (after the big Hushling on the hill)', 'Marta reads the recipe in the infinitive; you tell {mimo} what to do: «Gib …!», «Roll … aus!», «Stich Sterne aus!»', '{mimo} sniffs the air. Cookies?'),
        step(3, 'Nikolaus: the boots, the verse, the wish list (after the first bell)', 'Clean the boots and put them «vor die Tür», learn Fiete’s verse, and write a wish list: «Ich wünsche mir …»', '{mimo} looks at its own little sock.'),
        Object.assign(step(4, 'Presents: Wichteln and gingerbread hearts ({n}/3) (after the second bell)', 'Secret presents: «Ich schenke ihm / ihr / dir / Ihnen …». Then hearts with your own messages for Oma Rosa, Bruno and Herr Otto.', '{mimo} points at the next person to give a heart to.', nextHeart), { n: nH }),
        step(5, 'The market night (after the third bell)', 'Light the pyramid and the stalls, and sing the Lichterlied against the Hush.', '{mimo} looks at the dark stalls around the fountain.'),
      ],
      story: [
        { when: s => !!w(s).met, text: 'By the bell tower lives Fiete, eight, Oma Hilde’s grandson. Alba used to have a Christmas market around the fountain, until the Hush put its lights out. He wants it back.' },
        { when: s => ch(s, 1), text: 'The six stalls stand around the fountain, with the big pyramid by the north street, shut and dark. You know their prices, and you played market: «Was darf’s sein?» «Ich hätte gern …»' },
        { when: s => ch(s, 2), text: 'You baked butter cookies with Marta, telling {mimo} the recipe in commands. Stars, hearts and moons: «Das schmeckt nach mehr!»' },
        { when: s => ch(s, 3), text: 'Fiete’s boots stood «vor der Tür», and in the morning they were full. Fiete thinks Herr Otto is Nikolaus. Your wish list is on his windowsill.' },
        { when: s => ch(s, 4), text: 'Secret presents for Bruno, Marta, Fiete and Oma Rosa, and gingerbread hearts with your messages. {mimo} wears one.' },
        { when: s => ch(s, 5), text: 'The market night: you lit the pyramid’s candles and every stall, singing the Lichterlied, and the Hush turned into snow. {mimo} wears Oma Hilde’s Pudelmütze. The market is open now.' },
      ],
    };
  }

  // ================================================================ readable signs (signs.js), the minimap's mark
  function addSigns() {
    if (typeof SIGNS === 'undefined' || !SIGNS.add) return;
    const E0 = SPOT.easel;
    SIGNS.add({ id: 'wm-calendar', x: E0.x + Math.sin(E0.yaw) * 1.0, z: E0.z + Math.cos(E0.yaw) * 1.0, r: 1.3, when: () => shown() && !!(G.state.wm && G.state.wm.ch && G.state.wm.ch[1]),
      card: () => { const c = S().cal; return { tag: 'Fiete’s Advent calendar', lines: [{ text: 'Fietes Adventskalender', en: `Fiete’s Advent calendar: ${c.open} of 24 doors open` }, { text: 'Jeden Tag ein Türchen!', en: 'A little door every day!' }] }; } });
    SIGNS.add({ id: 'wm-pyramid', x: SPOT.pyr.x, z: SPOT.pyr.z + 1.6, r: 1.5, when: () => shown() && !!B && B.pyr.built,
      card: () => ({ tag: 'The Christmas pyramid', lines: [{ text: 'Die Weihnachtspyramide', en: 'The candles warm the air, the warm air turns the propeller, and the plates go round.' }, { text: 'aus dem Erzgebirge', en: 'from the Ore Mountains (Erzgebirge) in Saxony, home of the woodcarvers' }] }) });
    for (const S0 of STALLS) {
      const P = ring(S0.a, HUT_R), yaw = Math.atan2(C.x - P.x, C.z - P.z), F = toWorld(P, yaw, 0, 1.7);
      SIGNS.add({ id: 'wm-stall-' + S0.id, x: F.x, z: F.z, r: 1.4, when: () => shown() && !!B && B.hutOf[S0.id].built && !B.hutOf[S0.id].open,
        card: () => ({ tag: 'A market stall', lines: [{ text: S0.sign, en: S0.en }, { text: `${WUI.euro(S0.price)}`, en: WUI.euroWords(S0.price), say: WUI.euroWords(S0.price) }, { text: 'Bald geöffnet!', en: 'Opening soon!' }] }) });
    }
  }
  const MARK = {};
  function mapMark(dpr) {
    if (!B || !shown() || !(G.state.wm && G.state.wm.ch && G.state.wm.ch[1])) return null;
    const k = String(dpr) + (G.state.wm.ch[5] ? 'L' : 'D');
    if (!MARK[k]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr); c.lineJoin = 'round';
      c.fillStyle = '#b98450'; c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.rect(3.5, 8, 11, 7.5); c.fill(); c.stroke();
      c.fillStyle = '#a8432f'; c.beginPath(); c.moveTo(2, 8.5); c.lineTo(9, 2.5); c.lineTo(16, 8.5); c.closePath(); c.fill(); c.stroke();
      if (G.state.wm.ch[5]) ['#ff6a5a', '#ffd23f', '#7ee08f'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(5.5 + i * 3.5, 10.5, 1.3, 0, TAU); c.fill(); });
      MARK[k] = cv;
    }
    return { x: C.x, z: C.z - 1, img: MARK[k] };
  }

  // ================================================================ start
  function init(game) {
    G = game; ZHF.bind(game); WUI.bind(game);
    regPhrases(); regLines();
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'wm')) QUESTS.LIST.push(quest());
    addSigns();
    setInterval(() => { if (shown()) keepFar(); }, 30000);
  }

  // ================================================================ tests (the game never calls these)
  const TEST = {
    fast(on = true) { WUI.fast = on; },
    setup(fl) { Object.assign(G.state.flags, { hatched: true, rosa: true }, fl || {}); },
    // jump the save to a chapter's start (n: the chapters already done)
    done(n) { const st = S(); for (let i = 1; i <= 5; i++) st.ch[i] = i <= n; st.met = true; if (n >= 1) { st.up = { punsch: 1, mandeln: 1, herz: 1, crepe: 1, wurst: 1, reibe: 1, pyr: 1 }; st.price = {}; ORDER.forEach(id => { st.price[id] = true; }); } if (n >= 3) { st.bootsOut = st.filled = st.verse = st.brought = true; } if (n >= 4) { st.wich = st.heartsMade = true; HEARTS.forEach(h => { st.given[h.id] = true; }); st.neck = true; } if (n >= 5) st.hat = true; },
    go: async sec => { const g = window.__g; await g.go(sec); },
    // answer whatever is asked right now (a card or the bar): the model, or what o.answer(cur) gives
    drive: o => WUI.drive(Object.assign({ sec: 30 }, o || {})),
    night(k = 1, snow = true) { nightBuild(); NIGHT.want = k; NIGHT.k = k; NIGHT.snowWant = snow ? 1 : 0; NIGHT.snowK = snow ? 1 : 0; FEST.night = k > 0; FEST.snow = !!snow; },
    stage(o = {}) { LOOK.staged = true; Object.assign(LOOK, o); },
    unstage() { LOOK.staged = false; },
    get B() { return B; }, get LOOK() { return LOOK; }, get FEST() { return FEST; }, get NIGHT() { return NIGHT; }, get EVE() { return EVE; }, get MUS() { return MUS; },
  };
  return {
    init, build, update, quest, hatOn, mapMark, interactables: () => [],
    get busy() { return FEST.on; },
    _: { S: () => S(), LT, PH, PHI, STALLS, DOORS, SONG, SONG_ORDER, VERSE, WICHTEL, HEARTS, GIFT, WISHN, CH, SPOT, chapter1, chapter2, chapter3, chapter4, chapter5, kidTalk, meet, openDoor, doorReady, doDoorHere, doDoorSay, giveHeart, buy, practice, singAlong,
      festOn, festOff, makeStille, makeCrowd, nightBuild, PROVIDER, checks: { nounCheck, hereCheck, priceCheck, orderCheck, cmdCheck, wishCheck, giftCheck, heartCheck, msgCheck, candleCheck, lineCheck, doorCheck }, teach, lineKeys, t: TEST },
  };
})();
