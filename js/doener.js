'use strict';
// «Yıldız Grill», Alba's Dönerladen: German's everyday-life side character (SIDES.md), de games only. The user wants side
// content that relates to the actual culture of the people: Döner is Germany's favorite fast food, and Turkish-German families
// are part of everyday German life. Written as Germans with Turkish roots, warmly and without caricature.
//
// WHO (original characters):
//   Kemal Yıldız, about 50, runs the shop. Born in Berlin, warm and joking, proud of his bread (he bakes it himself) and his
//     secret garlic sauce; a little Berlin in his German («Allet jut!»). His shop's sign is a star: «Yıldız» means star.
//   Elif Yıldız, 18, born in Alba, his daughter. Does her homework at the end of the counter (her Abitur is this year), headphones
//     round her neck; switches between German, Turkish words and Kiezdeutsch with her friends; wants to study medicine AND rap.
//   Babaanne Gülten (Grandma, the father's mother), born 1942. Came to Germany in 1964, three years after the 1961 recruitment
//     agreement between West Germany and Turkey: three days by train from Istanbul to Munich, then a radio factory in Berlin.
//     Her neighbour Frau Krüger taught her German over coffee; her first German word was «Feierabend». In 1985 she and her
//     husband opened their first Imbiss in Berlin. «We thought: two years. It became sixty.» She plays tavla at her table.
//   Selin, Elif's mother, a nurse (chapter 4).
// WHERE: house 10 ('alba-house-10', the second house on the west street's south side), claimed in de games only; a red
//   storefront with the star sign, a menu lightbox and a standing table outside. The shop is a room at (−30, 300, −260): the
//   counter with its glass display, the rotating spit, the backlit menu, the drinks fridge, the tea station with tulip glasses,
//   bistro tables, Babaanne's table with the tavla board, the family photo wall, a TV in the corner.
// CHAPTERS (gated like every side character: Rosa's welcome, the big Hushling on the hill, bells 1, 2, 3):
//   1 Bestellen: Döner, Dürüm, Döner-Teller, Döner-Box, Ayran; «Einmal Döner mit alles und scharf!» (the famous everyday order;
//     standard German says «mit allem»), the sauces, «ohne Zwiebeln», «Hier essen oder zum Mitnehmen?», «Stimmt so!»
//   2 An der Theke: the lunch rush; Alba's people order, you repeat each order for Kemal and say the price («Das macht …»)
//   3 Wörter, die reisen: Tamam, Hadi, Yallah, Abi (and das Abi!), Abla, Kanka, Çay, Afiyet olsun, Kolay gelsin; a little
//     Kiezdeutsch into standard German, words German got from Turkish (Joghurt, Kiosk); Babaanne's story at the photo wall
//   4 Familie: Elif's Abitur party: the family (Elifs Vater…), the food (Simit, Börek, Sucuk, Baklava, Çay), «Elinize sağlık!»,
//     Elif's double identity and her rap (you find the rhymes). {mimo} gets the shop's cap with the star.
//   5 Die Nacht der Stille: the Hush has silenced the shop (a cold grill, the regulars gone, Kemal hardly talking). You invite
//     Alba to a public viewing (a friendly, Germany against Turkey); the chatter, the orders and the cheering drive the Hush
//     out, «Ich bin für beide!», a 2:2. Babaanne gives {mimo} a nazar boncuğu.
// Rewards: Phrasebook entries (ph.dn.*), {mimo}'s cap (a head item) and the nazar charm (on an ear), coins.
// Song: 'de_doener' «Saz & Spieß»: a bağlama riff in Hicaz over boom-bap and an 808, with a darbuka.
// API: DOENER.init(game) · .build(scene, env) → { colliders, group, people, update } (the storefront) · as a room (main.js
//   ROOMS): .inside · .OUTSIDE · .interactables() · .curiosities() · .update(dt, t) · .enter() · .leave() · .hatOn() ·
//   .mapMark(dpr) · .quest() · ._ (tests: ._.t). State: G.state.dn. Panels: weihnacht_ui.js (WUI). Uses zhfolk.js (ZHF).

const DOENER = (() => {
  const X0 = -30, Y0 = 300, Z0 = -260, HW = 6.5, HD = 5, WH = 3.6, HALF = Math.PI / 2;
  const DOOR_ID = 'alba-house-10', HOUSE_N = 10;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const esc = s => WUI.esc(s);
  let G = null, B = null, R = null;
  const S = () => {
    const s = G.state; if (!s.dn) s.dn = {};
    const o = s.dn; o.ch = o.ch || {}; o.inv = o.inv || {}; return o;
  };
  const isDe = () => !!(G && G.state && G.state.lang === 'de');
  const shown = () => !!(isDe() && G.state.flags && G.state.flags.hatched);
  const flags = () => (G && G.state && G.state.flags) || {};
  const mimo = () => (G && G.state && G.state.mimoName) || 'Mimo';
  const sub = s => String(s).split('{mimo}').join(mimo());
  const sfx = (k, ...a) => { try { Sound.play(k, ...a); } catch (e) { /* no audio yet */ } };
  const wait = s => WUI.wait(s);
  const has = (t, l) => WUI.has(t, l);
  const toks = s => WUI.toks(s);
  const INK = '#2b2235', RED = '#c8322a', RED2 = '#a8231d', CREAM = '#fff4dc', GOLD = '#f2c14e';

  // ================================================================ the menu (prices in cents)
  const MENU = [
    { id: 'doener', de: 'Döner', art: 'der Döner', g: 'm', price: 700, icon: 'dnDoener', keys: ['doner', 'doner kebab', 'kebab', 'dona'], en: 'a Döner in bread: flatbread, grilled meat, salad, sauce' },
    { id: 'duerum', de: 'Dürüm', art: 'der Dürüm', g: 'm', price: 750, icon: 'dnDuerum', keys: ['durum', 'wrap', 'yufka'], en: 'a Dürüm: the same, rolled up in thin flatbread (yufka)' },
    { id: 'teller', de: 'Döner-Teller', art: 'der Döner-Teller', g: 'm', price: 1100, icon: 'dnTeller', keys: ['doner teller', 'donerteller', 'teller'], en: 'a Döner plate, with salad and fries or rice' },
    { id: 'box', de: 'Döner-Box', art: 'die Döner-Box', g: 'f', price: 650, icon: 'dnBox', keys: ['doner box', 'donerbox', 'box'], en: 'a Döner box: fries, meat and sauce in a box' },
    { id: 'halloumi', de: 'Halloumi im Brot', art: 'der Halloumi', g: 'm', price: 650, icon: 'dnHalloumi', keys: ['halloumi', 'hallumi', 'halumi'], en: 'grilled halloumi cheese in bread (vegetarian)' },
    { id: 'ayran', de: 'Ayran', art: 'der Ayran', g: 'm', also: 'n', price: 200, icon: 'dnAyran', keys: ['ayran'], en: 'Ayran: a cold, salty yogurt drink' },
    { id: 'cay', de: 'Çay', art: 'der Çay', g: 'm', price: 150, icon: 'dnCay', keys: ['cay', 'chai', 'tschai', 'tee'], en: 'Turkish black tea, in a tulip glass' },
  ];
  const ITEM = Object.fromEntries(MENU.map(m => [m.id, m]));
  const SAUCE = [
    { id: 'kraeuter', de: 'Kräutersoße', keys: ['krautersosse', 'krautersose', 'krauter', 'krautersauce'], en: 'herb sauce (yogurt and herbs)', col: '#e8efe0' },
    { id: 'knobi', de: 'Knoblauchsoße', keys: ['knoblauchsosse', 'knoblauchsose', 'knoblauch', 'knobi', 'knoblauchsauce'], en: 'garlic sauce', col: '#fff8ec' },
    { id: 'scharf', de: 'scharfe Soße', keys: ['scharf', 'scharfe sosse', 'scharfe', 'chili'], en: 'hot sauce («mit scharf»)', col: '#d6332a' },
  ];

  // ================================================================ the Phrasebook (LEX kind 'phrase', German; region «Dönerladen»)
  const REGION = 'Dönerladen';
  const PH = [
    { id: 'ph.dn.mitalles', de: 'Einmal Döner mit alles und scharf!', en: 'One Döner with everything, spicy!', note: 'The most famous order in Germany. It’s colloquial: standard German says «mit allem». At the counter, both are fine!', sit: 'Order one Döner with everything on it, and spicy: the classic way.', keys: [['doner', 'mit alles'], ['doner', 'mit allem']] },
    { id: 'ph.dn.ohne', de: 'Ohne Zwiebeln, bitte.', en: 'Without onions, please.', note: '«ohne» (without) + what you don’t want: ohne Zwiebeln, ohne Soße, ohne Tomaten.', sit: 'You don’t like onions. Say so at the counter.', keys: [['ohne', 'zwiebeln'], ['ohne', 'zwiebel']] },
    { id: 'ph.dn.mitnehmen', de: 'Zum Mitnehmen, bitte.', en: 'To take away, please.', note: 'You’ll always hear the question: «Hier essen oder zum Mitnehmen?» (Eat here or take away?)', sit: 'You’re in a hurry: you want your food to go.', keys: ['zum mitnehmen', 'mitnehmen'] },
    { id: 'ph.dn.stimmtso', de: 'Stimmt so!', en: 'Keep the change!', note: 'Say it as you hand over the money: you round up, and the rest is a tip.', sit: 'It’s 9,50 € and you hand over 10 €. Let them keep the change.', keys: ['stimmt so', 'passt so'] },
    { id: 'ph.dn.sofort', de: 'Kommt sofort!', en: 'Coming right up!', note: 'What everyone behind a counter says when you order.', sit: 'You’re behind the counter and someone orders. Answer like Kemal!', keys: ['kommt sofort', 'sofort', 'kommt gleich'] },
    { id: 'ph.dn.allet', de: 'Allet jut!', en: 'All good! (Berlin dialect)', note: 'Berlinerisch for «Alles gut!»: in Berlin «g» often sounds like «j» («jut»), and «es» like «et».', sit: 'Kemal asks if everything’s fine. Answer the Berlin way!', keys: ['allet jut', 'alles jut', 'allet gut'] },
    { id: 'ph.dn.tamam', de: 'Tamam!', en: 'Okay! (Turkish)', note: 'A Turkish word lots of German speakers use, not only Turkish Germans.', sit: 'Elif asks if you can help later. Say okay, her way.', keys: ['tamam'] },
    { id: 'ph.dn.hadi', de: 'Hadi!', en: 'Come on! / Let’s go! (Turkish)', note: 'To hurry someone up, or to cheer them on: «Hadi, hadi!»', sit: 'The bus is leaving and Elif is still packing. Hurry her up!', keys: ['hadi', 'haydi'] },
    { id: 'ph.dn.yallah', de: 'Yallah!', en: 'Let’s go! (from Arabic)', note: 'From Arabic, and common in German youth language: «Yallah, wir gehen!»', sit: 'Time to leave! Say «let’s go» like Elif’s friends.', keys: ['yallah', 'yalla'] },
    { id: 'ph.dn.abi', de: 'Abi', en: 'big brother (Turkish), and the Abitur (German)!', note: 'In Turkish «abi» is your big brother, or a polite way to address an older guy. In German «das Abi» is the Abitur, the final school exams.', sit: 'Elif has just passed her final school exams. What did she pass? «das …»', keys: ['abi', 'abitur'] },
    { id: 'ph.dn.abla', de: 'Abla', en: 'big sister (Turkish)', note: 'Also a friendly way to address an older girl or woman.', sit: 'What does Elif’s little cousin call her? «big sister» in Turkish…', keys: ['abla'] },
    { id: 'ph.dn.kanka', de: 'Kanka', en: 'buddy, best friend (Turkish slang)', note: 'From «kan kardeş», blood brother. Elif calls her best friend «Kanka».', sit: 'How does Elif greet her best friend? «Na, …?»', keys: ['kanka'] },
    { id: 'ph.dn.cay', de: 'Ein Çay, bitte!', en: 'A tea, please!', note: 'Çay (say “chai”): strong black tea, in small tulip-shaped glasses, with sugar cubes. Never with milk!', sit: 'Babaanne pours tea. Ask for a glass.', keys: [['cay'], ['chai'], ['tschai']] },
    { id: 'ph.dn.afiyet', de: 'Afiyet olsun!', en: 'Enjoy your meal! (Turkish)', note: 'The Turkish «Guten Appetit!», said when food is served.', sit: 'Kemal puts the plates on the table. Wish everyone a good meal, in Turkish!', keys: ['afiyet olsun', 'afiyet'] },
    { id: 'ph.dn.kolay', de: 'Kolay gelsin!', en: 'May it come easy! (to someone working)', note: 'A lovely Turkish phrase for anyone at work: the cook, the cashier, the cleaner. German has nothing like it!', sit: 'Kemal is sweating at the grill at lunchtime. Wish him an easy shift, in Turkish!', keys: ['kolay gelsin'] },
    { id: 'ph.dn.elinize', de: 'Elinize sağlık!', en: 'Health to your hands! (thanks to the cook)', note: 'The Turkish way to thank whoever cooked: may your hands stay healthy.', sit: 'Babaanne made the börek. Thank her the Turkish way!', keys: ['elinize saglik', 'eline saglik', 'elinize'] },
    { id: 'ph.dn.lassma', de: 'Lassma Döner essen!', en: 'Let’s go eat Döner! (Kiezdeutsch)', note: 'Kiezdeutsch, a youth dialect from multilingual city neighbourhoods: «lassma» = «lass uns mal». Fine with friends; at school, standard German.', sit: 'Ask your friends to go eat Döner, Kiezdeutsch style.', keys: [['lassma', 'doner'], ['lass uns', 'doner']] },
    { id: 'ph.dn.tor', de: 'Tor!', en: 'Goal!', note: 'Shout it as long as you can: «Toooor!»', sit: 'The ball is in the net! Shout!', keys: ['tor', 'toor', 'tooor', 'toooor', 'tooooor'] },
    { id: 'ph.dn.beide', de: 'Ich bin für beide!', en: 'I’m rooting for both!', note: '«für» + a team: «Ich bin für Deutschland», «Ich bin für die Türkei». Many Turkish-German families cheer for both!', sit: 'Germany plays Turkey, and someone asks who you’re for. Say: both!', keys: [['fur beide'], ['beide']] },
  ];
  PH.forEach(p => { if (!p.model) p.model = p.de; });
  const PHI = Object.fromEntries(PH.map(p => [p.id, p]));
  const regPhrases = () => { if (typeof LEX !== 'undefined') LEX.register(PH.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', de: p.de, en: p.en, note: p.note, region: REGION, register: /tamam|hadi|yallah|kanka|abla|lassma|allet/.test(p.id) ? 'slang' : 'casual', icon: 'dnDoener', alt: { de: p.keys.filter(k => typeof k === 'string') } }))); };
  regPhrases();
  function teach(id) {
    if (typeof LEX === 'undefined' || !LEX.item(id) || LEX.lang !== 'de') return;
    const s = LEX.st(id), t = Date.now() / 1000; LEX.expose(id);
    if (s.stage < 3) s.stage = 3;
    s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 1e8; s.last = t;
  }
  const keepFar = () => { if (typeof LEX === 'undefined' || LEX.lang !== 'de') return; const t = Date.now() / 1000; for (const p of PH) { if (!LEX.item(p.id)) continue; const s = LEX.st(p.id); if (s.stage >= 2 && s.due < t + 86400) s.due = t + 1e8; } };

  // ================================================================ what they say (German first, the English under it)
  const L = (de, en) => ({ de: [de], en: [en] });
  const LT = {
    // meeting the family
    'el.hi': L('Hoş geldiniz! Willkommen bei Yıldız! Ich bin Elif.', '«Hoş geldiniz»: welcome! Welcome to Yıldız! I’m Elif.'),
    'el.homework': L('Sorry, ich mach grad Hausaufgaben. Mathe fürs Abi. Integrale, ey!', 'Sorry, I’m doing homework. Maths for my Abitur. Integrals, ugh!'),
    'el.family': L('Der am Spieß ist mein Baba, Kemal. Und das da ist meine Babaanne, Oma Gülten.', 'The one at the spit is my Baba (dad), Kemal. And that’s my Babaanne, Grandma Gülten.'),
    'ke.hi': L('Na, was darf’s sein? Das Brot ist ganz frisch, gerade aus dem Ofen!', 'Well, what can I get you? The bread’s really fresh, straight out of the oven!'),
    'gu.hi': L('Hoş geldin! Setz dich, Kind. Möchtest du einen Çay?', 'Welcome! Sit down, dear. Would you like a çay?'),
    'el.order': L('Erst mal bestellen! Ich zeig dir, wie man einen Döner bestellt. Wie ein Profi!', 'First, let’s order! I’ll show you how to order a Döner. Like a pro!'),
    'ke.allet': L('Allet jut! So bestellt man in Berlin. Und jetzt auch in Alba!', '«Allet jut!» That’s Berlin for «Alles gut». That’s how you order in Berlin. And now in Alba too!'),
    'el.done1': L('Siehst du? Jetzt bist du Döner-Profi!', 'See? Now you’re a Döner pro!'),
    // chapter 2: the lunch rush
    'ke.rush': L('Mittagspause! Gleich kommen alle auf einmal. Hilfst du mir an der Kasse?', 'Lunch break! Everyone’s about to come at once. Will you help me at the till?'),
    'ke.how': L('Du hörst zu, du sagst mir die Bestellung, und du sagst den Preis. Ich mache den Rest!', 'You listen, you tell me the order, and you say the price. I’ll do the rest!'),
    'ke.sofort': L('Kommt sofort!', 'Coming right up!'),
    'ke.done2': L('Mann, du bist ja schneller als mein Grill!', 'Man, you’re even faster than my grill!'),
    'el.kolay': L('Hast du gehört? «Kolay gelsin!» Das sagt man zu jemandem, der arbeitet. Möge es leicht gehen!', 'Did you hear? «Kolay gelsin!» You say it to someone who’s working. May it go easy!'),
    // chapter 3: words that travel, and Babaanne's story
    'el.words': L('Weißt du was? Viele Deutsche sagen türkische Wörter. Ohne es zu merken!', 'Know what? Lots of Germans use Turkish words. Without even noticing!'),
    'el.abi': L('Und «Abi» ist lustig: Auf Türkisch ist das der große Bruder. Auf Deutsch ist das Abi das Abitur!', 'And «Abi» is funny: in Turkish it’s your big brother. In German «das Abi» is the Abitur, the final school exams!'),
    'el.kiez': L('Mit meinen Freunden rede ich manchmal Kiezdeutsch. In der Schule Hochdeutsch. Mit Babaanne Türkisch.', 'With my friends I sometimes speak Kiezdeutsch. At school, standard German. With Babaanne, Turkish.'),
    'el.kiez2': L('Kiezdeutsch ist kein schlechtes Deutsch. Das ist ein Dialekt, mit eigenen Regeln!', 'Kiezdeutsch isn’t bad German. It’s a dialect, with its own rules!'),
    'el.story': L('Babaanne, erzählst du die Geschichte? Von früher?', 'Babaanne, will you tell the story? From the old days?'),
    'gu.yes': L('Na gut. Komm, setz dich. Schau dir die Fotos an.', 'All right. Come, sit down. Look at the photos.'),
    'gu.end': L('Wir dachten: zwei Jahre. Dann wurden es sechzig.', 'We thought: two years. Then it became sixty.'),
    'gu.end2': L('Aber weißt du was? Hier ist jetzt mein Zuhause. Hier und dort.', 'But you know what? This is my home now. Here and there.'),
    // chapter 4: family, and Elif's Abitur party
    'el.abi2': L('Ich hab mein Abi! Mit 1,7! Heute feiern wir!', 'I passed my Abitur! With a 1.7 (in Germany, 1 is the best)! Today we celebrate!'),
    'ke.proud': L('Meine Tochter wird Ärztin! … Oder Rapperin. Oder beides. Wir werden sehen!', 'My daughter’s going to be a doctor! … Or a rapper. Or both. We’ll see!'),
    'se.hi': L('Hallo! Ich bin Selin, Elifs Mutter. Ich komme direkt aus dem Krankenhaus!', 'Hi! I’m Selin, Elif’s mother. I’ve come straight from the hospital!'),
    'gu.food': L('Esst, esst! Es ist genug für alle da.', 'Eat, eat! There’s enough for everyone.'),
    'el.identity': L('In der Türkei sagen sie zu mir: «die Deutsche». Hier sagen manche: «die Türkin». Ich sage: Ich bin Elif. Beides gehört zu mir.', 'In Turkey they call me «the German girl». Here some say «the Turkish girl». I say: I’m Elif. Both are part of me.'),
    'el.rap': L('Okay, okay! Ich hab einen Rap geschrieben. Hilfst du mir mit den Reimen?', 'Okay, okay! I wrote a rap. Will you help me with the rhymes?'),
    'ke.cap': L('Für {mimo}: unsere Mütze! Mit dem Stern. «Yıldız» heißt nämlich Stern!', 'For {mimo}: our cap! With the star. «Yıldız» means star, you know!'),
    // chapter 5: the night of the Hush
    'el.quiet': L('Seit Tagen kommt keiner mehr. Der Grill ist kalt. Und Baba … redet kaum noch.', 'Nobody’s come for days. The grill is cold. And Baba… hardly talks anymore.'),
    'el.hush': L('Die Stille ist hier drin. Ich spür das.', 'The Hush is in here. I can feel it.'),
    'el.plan': L('Ich hab eine Idee! Heute Abend spielt Deutschland gegen die Türkei. Ein Freundschaftsspiel! Wir machen Public Viewing, hier bei uns!', 'I have an idea! Tonight Germany plays Turkey. A friendly! Let’s have a public viewing, right here!'),
    'el.invite': L('Lad die Leute ein! Bruno, Adi, Marta und Oma Rosa. Sag: «Heute Abend Fußball bei Yıldız!»', 'Invite people! Bruno, Adi, Marta and Grandma Rosa. Say: «Football tonight at Yıldız!»'),
    'el.invited': L('Alle kommen? Super! Dann komm heute Abend. Hadi!', 'Everyone’s coming? Great! Then come tonight. Hadi!'),
    'bruno.inv': L('Fußball? Klar bin ich dabei! Ich bring gute Laune mit!', 'Football? Of course I’m in! I’ll bring the good mood!'),
    'adi.inv': L('Ich bringe Kalle mit! Und Hilde. Die schreit am lautesten!', 'I’ll bring Kalle! And Hilde. She shouts the loudest!'),
    'marta.inv': L('Ich bringe Kuchen mit! Und für die Pause noch mehr Kuchen.', 'I’ll bring cake! And for half-time, more cake.'),
    'rosa.inv': L('Ach, Fußball! Mein Mann hat das so geliebt. Ich komme gern.', 'Oh, football! My husband loved it so. I’d love to come.'),
    'el.full': L('Guck mal! Alle sind gekommen!', 'Look! Everyone came!'),
    'ke.back': L('Zehnmal? Allet klar! Kommt sofort!', 'Ten? You got it! Coming right up!'),
    'gu.nazar': L('Für {mimo}. Ein Nazar. Gegen den bösen Blick … und gegen die Stille.', 'For {mimo}. A nazar. Against the evil eye… and against the Hush.'),
    'el.thanks': L('Danke. Du hast unseren Laden gerettet. Und Baba lacht wieder!', 'Thank you. You saved our shop. And Baba is laughing again!'),
    'ke.thanks': L('Für dich ist der Döner ab jetzt immer umsonst! … Na gut, fast immer.', 'From now on your Döner is always free! … Okay, almost always.'),
    // chat
    'el.idle1': L('«Döner» heißt «der Drehende». Weil sich der Spieß dreht!', '«Döner» means «the turning one». Because the spit turns!'),
    'el.idle2': L('Das Wort «Joghurt» kommt aus dem Türkischen. «Kiosk» übrigens auch!', 'The word «Joghurt» (yogurt) comes from Turkish. So does «Kiosk», by the way!'),
    'el.idle3': L('Am Wochenende rappe ich manchmal auf einer kleinen Bühne. Klein. Aber laut!', 'At weekends I sometimes rap on a little stage. Small. But loud!'),
    'ke.idle1': L('Das Geheimnis ist die Soße. Das Rezept? Streng geheim!', 'The secret is the sauce. The recipe? Top secret!'),
    'ke.idle2': L('Das Brot backe ich jeden Morgen selbst. Um fünf Uhr! Ein guter Döner braucht Zeit.', 'I bake the bread myself every morning. At five! A good Döner takes time.'),
    'gu.idle1': L('Tavla? Ich spiele seit siebzig Jahren. Ich verliere nie!', 'Tavla (backgammon)? I’ve played for seventy years. I never lose!'),
    'gu.idle2': L('Trink deinen Çay, solange er heiß ist. Kalter Tee ist traurig.', 'Drink your çay while it’s hot. Cold tea is sad.'),
    'el.wait': L('Warte mal, gerade ist viel los. Komm später wieder, tamam?', 'Wait, it’s busy right now. Come back later, tamam?'),
  };
  const lineOf = (key, vars) => {
    const v = LT[key]; if (!v) return { de: key, en: key };
    let de = sub(v.de[0]), en = sub(v.en[0]);
    if (vars) for (const [a, b] of Object.entries(vars)) { de = de.split('{' + a + '}').join(b); en = en.split('{' + a + '}').join(b); }
    return { de, en };
  };
  const regLines = () => { if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES['dn.' + k]) LINES['dn.' + k] = v; };

  // ================================================================ chapter 2: the lunch rush's orders
  // who comes in, what they say, the parts you must repeat (each: words, one of which must be there), the total, eat here or go
  const RUSH = [
    { id: 'bruno', name: 'Bruno', look: { skin: '#c98e62', hair: '#2e2420', shirt: '#3f6f9a', pants: '#2f3440', hat: 'beanie', hatCol: '#e8e4dc', wide: 1.15 },
      say: ['Einmal Döner-Teller, ohne Soße. Ich bin im Training!', 'One Döner plate, no sauce. I’m in training!'], parts: [['einmal', 'ein', 'einen'], ['teller'], ['ohne sosse', 'ohne sose', 'ohne sauce', 'keine sosse']], cents: 1100,
      model: 'Einmal Döner-Teller ohne Soße!', here: true },
    { id: 'adi', name: 'Adi', look: { skin: '#f0c7a0', hair: '#8a5a3a', shirt: '#f2c14e', pants: '#34508c', hat: 'flat', hatCol: '#34508c', belly: true },
      say: ['Zweimal Dürüm mit scharf, zum Mitnehmen. Einer ist für Kalle!', 'Two Dürüm, spicy, to take away. One is for Kalle!'], parts: [['zweimal', 'zwei'], ['durum'], ['scharf'], ['mitnehmen']], cents: 1500,
      model: 'Zweimal Dürüm mit scharf, zum Mitnehmen!' },
    { id: 'lucas', name: 'Lucas', look: { skin: '#a8714a', hair: '#2e2420', shirt: '#f2e6d0', pants: '#3f4a5a', apron: '#ffffff' },
      say: ['Eine Döner-Box mit Knoblauchsoße und ein Ayran, bitte.', 'A Döner box with garlic sauce and an Ayran, please.'], parts: [['box'], ['knoblauch', 'knoblauchsosse', 'knoblauchsose', 'knobi'], ['ayran']], cents: 850,
      model: 'Eine Döner-Box mit Knoblauchsoße und ein Ayran!' },
    { id: 'vera', name: 'Vera', look: { skin: '#e8b48a', hair: '#6b3b25', shirt: '#d97aa0', pants: '#4a3f5a' },
      say: ['Einmal Halloumi im Brot, aber ohne Zwiebeln. Ich esse kein Fleisch.', 'One halloumi in bread, but without onions. I don’t eat meat.'], parts: [['halloumi', 'hallumi', 'halumi'], ['ohne zwiebeln', 'ohne zwiebel', 'keine zwiebeln']], cents: 650,
      model: 'Einmal Halloumi im Brot, ohne Zwiebeln!' },
    { id: 'otto', name: 'Herr Otto', look: { skin: '#f0c7a0', hair: '#f4f1ea', shirt: '#8a5f3e', pants: '#3f3a35', hat: 'flat', hatCol: '#6b5a4a', glasses: true, old: true },
      say: ['Einen Döner mit alles, aber nicht so scharf. Und einen Çay, bitte.', 'A Döner with everything, but not too spicy. And a çay, please.'], parts: [['doner'], ['mit alles', 'mit allem', 'alles'], ['nicht so scharf', 'nicht scharf', 'wenig scharf', 'mild'], ['cay', 'chai', 'tschai', 'tee']], cents: 850,
      model: 'Einmal Döner mit alles, nicht so scharf, und ein Çay!', kolay: true },
  ];

  // ================================================================ chapter 3: Babaanne's story (the photo wall), the words that travel
  // each photo: a picture key (photoArt), what she says, a question about it, what counts as the answer
  const STORY_PHOTOS = [
    { pic: 'train', say: ['1964 bin ich mit dem Zug nach Deutschland gekommen. Drei Tage im Zug, von Istanbul nach München!', 'In 1964 I came to Germany by train. Three days on the train, from Istanbul to Munich!'],
      q: 'Wann ist Babaanne nach Deutschland gekommen? (Say the year the German way: «neunzehnhundert…»)', model: 'Neunzehnhundertvierundsechzig.', year: 1964 },
    { pic: 'factory', say: ['In Berlin habe ich in einer Fabrik gearbeitet. Wir haben Radios gebaut. Ich war zweiundzwanzig.', 'In Berlin I worked in a factory. We built radios. I was twenty-two.'],
      q: 'Wo hat sie gearbeitet?', model: 'In einer Fabrik.', keys: ['fabrik'] },
    { pic: 'neighbour', say: ['Meine Nachbarin, Frau Krüger, hat mir Deutsch beigebracht. Bei Kaffee und Kuchen. Mein erstes Wort? «Feierabend!»', 'My neighbour, Frau Krüger, taught me German. Over coffee and cake. My first word? «Feierabend!» (time off work)'],
      q: 'Was war ihr erstes deutsches Wort?', model: 'Feierabend!', keys: ['feierabend'] },
    { pic: 'imbiss', say: ['1985 haben mein Mann und ich unseren ersten Imbiss aufgemacht, in Berlin. Den Döner im Brot gab es da schon, seit den Siebzigern. Wer ihn erfunden hat? Ach, das sagt jeder anders!', 'In 1985 my husband and I opened our first snack bar, in Berlin. Döner in bread already existed then, since the seventies. Who invented it? Oh, everyone says something different!'],
      q: 'Was haben sie 1985 aufgemacht?', model: 'Einen Imbiss.', keys: ['imbiss', 'imbissbude', 'laden', 'restaurant'] },
    { pic: 'school', say: ['Und das ist Elif, an ihrem ersten Schultag. Mit einer Schultüte, wie alle Kinder in Deutschland!', 'And that’s Elif, on her first day of school. With a Schultüte (a big cone of sweets), like every child in Germany!'],
      q: 'Was hat Elif in der Hand?', model: 'Eine Schultüte.', keys: ['schultute', 'tute'] },
  ];
  // Turkish words German speakers use (copy, then say from a situation)
  const WORDS = ['ph.dn.tamam', 'ph.dn.hadi', 'ph.dn.yallah', 'ph.dn.abla', 'ph.dn.kanka', 'ph.dn.afiyet', 'ph.dn.kolay'];
  // a little Kiezdeutsch, into standard German (Elif: «with friends I talk like this, at school like that»)
  const KIEZ = [
    { kiez: 'Lassma Döner essen!', std: 'Lass uns Döner essen!', en: 'Let’s go eat Döner!', keys: [['lass uns', 'doner'], ['lasst uns', 'doner']], why: '«lassma» = «lass uns mal»' },
    { kiez: 'Ich geh Kiosk.', std: 'Ich gehe zum Kiosk.', en: 'I’m going to the kiosk.', keys: [['zum kiosk'], ['zu dem kiosk'], ['in den kiosk']], why: 'Kiezdeutsch drops the little words; standard German needs «zum»' },
    { kiez: 'Ischwör, das ist voll gut!', std: 'Ich schwöre, das ist sehr gut!', en: 'I swear, that’s really good!', keys: [['ich schwore'], ['ich schwor']], why: '«ischwör» = «ich schwöre» (I swear)' },
  ];

  // ================================================================ chapter 4: the party table, the family, Elif's rap
  const FOOD = [
    { de: 'der Simit', en: 'a simit: a sesame bread ring', icon: 'dnSimit', keys: ['simit'] },
    { de: 'der Börek', en: 'börek: flaky pastry with cheese or spinach', icon: 'dnBoerek', keys: ['borek'] },
    { de: 'die Sucuk', en: 'sucuk: a spicy beef sausage, fried with eggs', icon: 'dnSucuk', keys: ['sucuk', 'sucuck', 'sudschuk'] },
    { de: 'die Baklava', en: 'baklava: pastry with pistachios and syrup', icon: 'dnBaklava', keys: ['baklava'] },
  ];
  const FAMILY = [
    { who: 'Kemal', q: 'Wer ist Kemal? (Elif’s …)', model: 'Kemal ist Elifs Vater.', keys: [['vater'], ['papa'], ['baba']], en: 'Kemal is Elif’s father.' },
    { who: 'Selin', q: 'Und Selin?', model: 'Selin ist Elifs Mutter.', keys: [['mutter'], ['mama']], en: 'Selin is Elif’s mother.' },
    { who: 'Gülten', q: 'Und Babaanne Gülten?', model: 'Gülten ist Elifs Oma.', keys: [['oma'], ['grossmutter'], ['babaanne']], en: 'Gülten is Elif’s grandmother.' },
    { who: 'Elif', q: 'Und für Babaanne: wer ist Elif?', model: 'Elif ist Gültens Enkelin.', keys: [['enkelin'], ['enkel'], ['enkelkind']], en: 'Elif is Gülten’s granddaughter.' },
  ];
  // Elif's rap (original): she says the first line, you find the rhyme that ends the second
  const RAP = [
    { a: 'Morgens Hochdeutsch, abends Türkisch zu Haus,', b: 'und dazwischen? Da leb ich mich ___!', word: 'aus', alts: ['aus'], en: 'Standard German in the morning, Turkish at home at night; and in between? I let loose!' },
    { a: 'Die Leute fragen: „Bist du von hier oder von dort?“', b: 'Ich sag: Ich bin von hier. Alba ist mein ___!', word: 'Ort', alts: ['ort'], en: 'People ask: “Are you from here or from there?” I say: I’m from here. Alba is my place!' },
    { a: 'Babaanne kam mit dem Zug, mit nichts in der Hand,', b: 'heute ist sie zu Hause in diesem ___!', word: 'Land', alts: ['land'], en: 'Babaanne came by train, with nothing in her hand; today she’s at home in this country!' },
    { a: 'Ich werd Ärztin, ich werd Rapperin, ich werd beides,', b: 'und eins ist sicher: Ich bin nichts ___!', word: 'Leises', alts: ['leises', 'leises'], en: 'I’ll be a doctor, I’ll be a rapper, I’ll be both; and one thing’s for sure: I’m nothing quiet!' },
  ];

  // ================================================================ pictures: icons (paper cutouts), signs, the menu, photos, the TV
  (function icons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const add = (k, f) => { if (!ICONS.keys.includes(k)) ICONS.add(k, f); };
    const face = (c, p, h, skin, hair, o = {}) => {
      h.shape(c, p, h.ell(0, 8, 25, 26), skin);
      if (o.bun) h.shape(c, p, h.ell(0, -24, 13, 11), hair);
      h.shape(c, p, cc => { cc.moveTo(-26, 4); cc.quadraticCurveTo(-30, -26, 0, -24); cc.quadraticCurveTo(30, -26, 26, 4); cc.quadraticCurveTo(14, -10, 0, -10); cc.quadraticCurveTo(-14, -10, -26, 4); cc.closePath(); }, hair);
      if (o.cap) { h.shape(c, p, cc => { cc.moveTo(-25, -6); cc.bezierCurveTo(-25, -34, 25, -34, 25, -6); cc.closePath(); }, o.cap); h.shape(c, p, h.rr(-6, -10, 34, 8, 4), o.cap); }
      if (o.tail) h.shape(c, p, h.ell(24, -2, 8, 16, 0.5), hair);
      if (!p) return;
      h.eyes(c, -9, 9, 8, 0.9); h.dot(c, -16, 16, 4.5, 'rgba(255,130,140,.45)'); h.dot(c, 16, 16, 4.5, 'rgba(255,130,140,.45)');
      c.beginPath(); c.arc(0, 18, 7, 0.15, Math.PI - 0.15); c.lineWidth = 2.2; c.strokeStyle = h.INK; c.stroke();
      if (o.glasses) [-9, 9].forEach(x => { c.beginPath(); c.arc(x, 8, 6.5, 0, TAU); c.lineWidth = 1.8; c.strokeStyle = h.INK; c.stroke(); });
      if (o.cap) { c.fillStyle = '#fff'; c.font = '900 13px sans-serif'; c.textAlign = 'center'; c.fillText('★', 0, -16); }
      if (o.phones) { c.beginPath(); c.arc(0, 36, 18, Math.PI * 1.1, Math.PI * 1.9, true); c.lineWidth = 4; c.strokeStyle = '#2b2235'; c.stroke(); }
    };
    add('dnKemal', (c, p, h) => face(c, p, h, '#d9a37a', '#2b2235', { cap: '#c8322a', glasses: true }));
    add('dnElif', (c, p, h) => face(c, p, h, '#d9a37a', '#2b2235', { tail: true, phones: true }));
    add('dnGulten', (c, p, h) => face(c, p, h, '#e0b088', '#e8e4dc', { bun: true, glasses: true }));
    add('dnDoener', (c, p, h) => { h.shape(c, p, cc => { cc.moveTo(-34, 8); cc.quadraticCurveTo(0, -40, 34, 8); cc.closePath(); }, '#e9c27a'); h.shape(c, p, h.rr(-26, -6, 52, 12, 5), '#a8582a'); h.shape(c, p, h.rr(-24, -14, 48, 8, 4), '#5fae4a'); h.shape(c, p, h.rr(-20, -20, 40, 6, 3), '#d6332a'); h.shape(c, p, cc => { cc.moveTo(-34, 8); cc.quadraticCurveTo(0, 34, 34, 8); cc.closePath(); }, '#f1d08a'); if (p) [[-12, -2], [4, -3], [16, -1]].forEach(([x, y]) => h.dot(c, x, y, 2.4, '#fff8ec')); });
    add('dnDuerum', (c, p, h) => { h.shape(c, p, h.rr(-30, -14, 60, 28, 14), '#f1d08a'); h.shape(c, p, h.ell(24, 0, 9, 13), '#a8582a'); if (p) { h.dot(c, 22, -4, 3, '#5fae4a'); h.dot(c, 26, 4, 3, '#d6332a'); [-18, -6, 6].forEach(x => { c.beginPath(); c.moveTo(x, -12); c.lineTo(x + 4, 12); c.lineWidth = 1.6; c.strokeStyle = 'rgba(160,110,50,.6)'; c.stroke(); }); } });
    add('dnTeller', (c, p, h) => { h.shape(c, p, h.ell(0, 6, 36, 22), '#fffaf0'); h.shape(c, p, h.ell(-10, 4, 15, 9), '#a8582a'); h.shape(c, p, h.ell(12, 0, 12, 8), '#5fae4a'); h.shape(c, p, h.ell(12, 12, 10, 6), '#f2d16a'); if (p) h.dot(c, 14, 0, 3, '#d6332a'); });
    add('dnBox', (c, p, h) => { h.shape(c, p, h.poly([[-26, -8], [26, -8], [20, 30], [-20, 30]]), '#fffaf0'); for (let i = 0; i < 6; i++) h.shape(c, p, h.rr(-20 + i * 7, -22 - (i % 2) * 5, 5, 18, 2), '#f2d16a'); h.shape(c, p, h.ell(0, -10, 18, 6), '#a8582a'); if (p) { c.fillStyle = '#c8322a'; c.fillRect(-18, 8, 36, 6); } });
    add('dnHalloumi', (c, p, h) => { h.shape(c, p, cc => { cc.moveTo(-34, 8); cc.quadraticCurveTo(0, -40, 34, 8); cc.closePath(); }, '#e9c27a'); h.shape(c, p, h.rr(-24, -10, 48, 12, 4), '#f6ead2'); if (p) [-14, 0, 14].forEach(x => { c.fillStyle = '#c99a5a'; c.fillRect(x - 5, -8, 10, 2); }); h.shape(c, p, cc => { cc.moveTo(-34, 8); cc.quadraticCurveTo(0, 34, 34, 8); cc.closePath(); }, '#f1d08a'); });
    add('dnAyran', (c, p, h) => { h.shape(c, p, h.rr(-16, -26, 32, 56, 8), '#fffdf6'); h.shape(c, p, h.rr(-16, -34, 32, 10, 4), '#2f7fc9'); if (p) { c.fillStyle = '#2f7fc9'; c.font = '900 11px sans-serif'; c.textAlign = 'center'; c.fillText('AYRAN', 0, 6); } });
    add('dnCay', (c, p, h) => { h.shape(c, p, h.ell(0, 30, 24, 6), '#d9a03a'); h.shape(c, p, cc => { cc.moveTo(-12, -24); cc.quadraticCurveTo(-18, -6, -7, 4); cc.quadraticCurveTo(-14, 16, -10, 26); cc.lineTo(10, 26); cc.quadraticCurveTo(14, 16, 7, 4); cc.quadraticCurveTo(18, -6, 12, -24); cc.closePath(); }, '#c2551e'); if (p) { c.fillStyle = 'rgba(255,255,255,.45)'; c.fillRect(-9, -20, 4, 16); [-6, 6].forEach(x => { c.beginPath(); c.moveTo(x, -28); c.quadraticCurveTo(x - 5, -36, x, -44); c.lineWidth = 2; c.strokeStyle = 'rgba(43,34,53,.4)'; c.stroke(); }); } });
    add('dnSimit', (c, p, h) => { h.shape(c, p, cc => { cc.arc(0, 0, 30, 0, TAU); cc.moveTo(14, 0); cc.arc(0, 0, 14, 0, TAU, true); }, '#c47a3a'); if (p) for (let i = 0; i < 20; i++) { const a = i * 0.9, r = 18 + (i % 4) * 3; h.dot(c, Math.cos(a) * r, Math.sin(a) * r, 1.6, '#fff1c8'); } });
    add('dnBoerek', (c, p, h) => { h.shape(c, p, h.rr(-30, -12, 60, 30, 6), '#e9b84a'); if (p) for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-26, -6 + i * 7); c.quadraticCurveTo(0, -10 + i * 7, 26, -6 + i * 7); c.lineWidth = 1.6; c.strokeStyle = 'rgba(140,90,30,.6)'; c.stroke(); } });
    add('dnSucuk', (c, p, h) => { h.shape(c, p, h.ell(0, 8, 32, 20), '#fffaf0'); [[-12, 4], [6, 0], [14, 14], [-4, 16]].forEach(([x, y]) => h.shape(c, p, h.ell(x, y, 9, 8), '#a8322a')); h.shape(c, p, h.ell(-16, 14, 9, 7), '#fff8ec'); if (p) h.dot(c, -16, 14, 3.4, '#f2c14e'); });
    add('dnBaklava', (c, p, h) => { for (const [x, y] of [[-14, 6], [14, 6], [0, -10]]) h.shape(c, p, h.poly([[x - 13, y + 8], [x, y - 10], [x + 13, y + 8], [x, y + 16]]), '#e3a440'); if (p) [[-14, 6], [14, 6], [0, -10]].forEach(([x, y]) => h.dot(c, x, y + 2, 3, '#6aa84a')); });
    add('dnNazar', (c, p, h) => { h.shape(c, p, h.ell(0, 0, 30, 30), '#1f4fa8'); h.shape(c, p, h.ell(0, 0, 20, 20), '#ffffff'); h.shape(c, p, h.ell(0, 0, 12, 12), '#7cc4ff'); h.shape(c, p, h.ell(0, 0, 6, 6), '#2b2235'); });
    add('dnStar', (c, p, h) => { h.shape(c, p, h.rr(-32, -32, 64, 64, 12), '#c8322a'); h.shape(c, p, cc => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 26; i ? cc.lineTo(Math.cos(a) * r, Math.sin(a) * r) : cc.moveTo(Math.cos(a) * r, Math.sin(a) * r); } cc.closePath(); }, '#ffd23f'); });
    add('dnTV', (c, p, h) => { h.shape(c, p, h.rr(-34, -22, 68, 44, 6), '#2b2235'); h.shape(c, p, h.rr(-29, -17, 58, 34, 3), '#3f9a4a'); if (p) { c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.strokeRect(-25, -13, 50, 26); c.beginPath(); c.moveTo(0, -13); c.lineTo(0, 13); c.stroke(); c.beginPath(); c.arc(0, 0, 6, 0, TAU); c.stroke(); } });
  })();
  const canvasTex = (w, h, draw) => ZHF.canvasTex(w, h, draw);
  const SANS = 'Bahnschrift, "Segoe UI", sans-serif';
  const euro = c => WUI.euro(c);
  function star(c, x, y, r, col) { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.42 : r; i ? c.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : c.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } c.closePath(); c.fillStyle = col; c.fill(); }
  // the shop's sign: red, «YILDIZ GRILL» in white, the gold star (lit: true glows; the Hush: grey)
  function signDraw(c, w, h, lit) {
    c.fillStyle = lit ? '#c8322a' : '#6e6a72'; c.fillRect(0, 0, w, h); c.fillStyle = lit ? '#a8231d' : '#5a5660'; c.fillRect(0, h - 18, w, 18);
    c.strokeStyle = '#fff4dc'; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20);
    star(c, 92, h / 2 - 6, 60, lit ? '#ffd23f' : '#9a96a0');
    c.fillStyle = '#fff8ec'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = `900 96px ${SANS}`; c.fillText('YILDIZ GRILL', 172, h / 2 - 22);
    c.font = `700 38px ${SANS}`; c.fillStyle = lit ? '#ffe7a8' : '#d8d4dc'; c.fillText('Döner · Dürüm · Halloumi · Ayran · Çay', 176, h / 2 + 52);
  }
  // the menu (the backlit board inside, the lightbox outside)
  function menuDraw(c, w, h, o = {}) {
    c.fillStyle = '#1f1a24'; c.fillRect(0, 0, w, h); c.fillStyle = '#c8322a'; c.fillRect(0, 0, w, o.wide ? 70 : 84);
    c.fillStyle = '#fff8ec'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `900 ${o.wide ? 48 : 52}px ${SANS}`; c.fillText('SPEISEKARTE', w / 2, o.wide ? 37 : 44);
    const items = MENU, cols = o.wide ? 2 : 1, rows = Math.ceil(items.length / cols), cw = w / cols, rh = (h - (o.wide ? 88 : 104)) / rows;
    items.forEach((m, i) => {
      const cx = Math.floor(i / rows) * cw, y = (o.wide ? 88 : 104) + (i % rows) * rh + rh / 2;
      try { c.drawImage(ICONS.canvas(m.icon, 96), cx + 14, y - rh * 0.42, rh * 0.84, rh * 0.84); } catch (e) { /* (icons not ready) */ }
      c.textAlign = 'left'; c.fillStyle = '#fff8ec'; c.font = `800 ${Math.round(rh * 0.36)}px ${SANS}`; c.fillText(m.de, cx + 22 + rh * 0.9, y);
      c.textAlign = 'right'; c.fillStyle = '#ffd23f'; c.fillText(euro(m.price), cx + cw - 22, y);
    });
  }
  // the photo wall (chapter 3): 'train' 1964, 'factory', 'neighbour', 'imbiss' 1985, 'school', 'opening' (Alba, 2006)
  function photoDraw(c, kind, W = 256, H = 200) {
    const sepia = ['train', 'factory', 'neighbour'].includes(kind);
    c.fillStyle = '#5a3a22'; c.fillRect(0, 0, W, H); c.fillStyle = sepia ? '#e9dcc0' : '#f3ead8'; c.fillRect(12, 12, W - 24, H - 24);
    const ink = sepia ? '#6b5236' : '#3a3040', fig = (x, y, s, col, o = {}) => { c.fillStyle = col || ink; c.beginPath(); c.arc(x, y - 30 * s, 9 * s, 0, TAU); c.fill(); c.fillRect(x - 8 * s, y - 20 * s, 16 * s, 34 * s); if (o.bun) { c.beginPath(); c.arc(x, y - 40 * s, 5 * s, 0, TAU); c.fill(); } };
    if (kind === 'train') {
      c.fillStyle = sepia ? '#c9b48a' : '#a8c8e0'; c.fillRect(12, 12, W - 24, 90);
      c.fillStyle = ink; c.fillRect(30, 70, 196, 60); c.fillStyle = '#e9dcc0'; for (let i = 0; i < 5; i++) c.fillRect(42 + i * 36, 82, 24, 18);
      c.fillStyle = ink; [60, 120, 180].forEach(x => { c.beginPath(); c.arc(x, 138, 10, 0, TAU); c.fill(); }); fig(220, 176, 0.8, '#7a5a3a', { bun: true }); c.fillRect(196, 160, 16, 14);
      c.font = `700 18px ${SANS}`; c.textAlign = 'left'; c.fillText('1964', 22, 32);
    } else if (kind === 'factory') {
      c.fillStyle = '#c9b48a'; c.fillRect(12, 120, W - 24, 68); c.fillStyle = ink; c.fillRect(30, 108, 196, 14);
      for (let i = 0; i < 4; i++) { fig(48 + i * 52, 106, 0.75, i === 1 ? '#7a5a3a' : ink, { bun: i === 1 }); c.fillStyle = '#8a7a5a'; c.fillRect(38 + i * 52, 96, 20, 10); }
      c.font = `700 16px ${SANS}`; c.textAlign = 'left'; c.fillStyle = ink; c.fillText('Berlin', 22, 32);
    } else if (kind === 'neighbour') {
      c.fillStyle = '#d9c9a8'; c.fillRect(60, 120, 136, 16); c.fillStyle = ink; c.fillRect(70, 136, 8, 40); c.fillRect(178, 136, 8, 40);
      fig(70, 116, 0.95, '#7a5a3a', { bun: true }); fig(186, 116, 0.95, '#8a6a8a', { bun: true });
      c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(112, 116, 9, 0, TAU); c.arc(146, 116, 9, 0, TAU); c.fill(); c.fillStyle = '#c47a3a'; c.beginPath(); c.moveTo(118, 112); c.lineTo(140, 112); c.lineTo(129, 102); c.closePath(); c.fill();
    } else if (kind === 'imbiss') {
      c.fillStyle = '#a8c8e0'; c.fillRect(12, 12, W - 24, 80); c.fillStyle = '#c8322a'; c.fillRect(40, 40, 176, 26); c.fillStyle = '#fff8ec'; c.font = `900 18px ${SANS}`; c.textAlign = 'center'; c.fillText('IMBISS', 128, 58);
      c.fillStyle = '#f3ead8'; c.fillRect(40, 66, 176, 70); c.fillStyle = '#2b2235'; c.fillRect(50, 76, 70, 50); c.fillStyle = '#a8582a'; c.fillRect(132, 70, 20, 56); fig(180, 150, 0.85, '#3a3040'); fig(206, 150, 0.85, '#7a5a3a', { bun: true });
      c.fillStyle = '#3a3040'; c.font = `700 16px ${SANS}`; c.textAlign = 'left'; c.fillText('1985', 22, 180);
    } else if (kind === 'school') {
      c.fillStyle = '#bfe0ea'; c.fillRect(12, 12, W - 24, 110); fig(128, 170, 1.0, '#7a4f8f');
      c.fillStyle = '#e86a9a'; c.beginPath(); c.moveTo(146, 96); c.lineTo(196, 70); c.lineTo(160, 142); c.closePath(); c.fill(); c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(176, 74, 9, 0, TAU); c.fill();
      c.fillStyle = '#3a3040'; c.font = `700 16px ${SANS}`; c.textAlign = 'left'; c.fillText('1. Schultag', 22, 32);
    } else if (kind === 'opening') {
      c.fillStyle = '#c8322a'; c.fillRect(30, 26, 196, 34); star(c, 52, 43, 14, '#ffd23f'); c.fillStyle = '#fff8ec'; c.font = `900 18px ${SANS}`; c.textAlign = 'left'; c.fillText('YILDIZ GRILL', 72, 50);
      [[70, '#3a3040'], [108, '#7a5a3a'], [146, '#4fa3a5'], [180, '#7a4f8f']].forEach(([x, col], i) => fig(x, 170, i === 3 ? 0.6 : 0.95, col, { bun: i === 1 }));
      c.fillStyle = '#3a3040'; c.font = `700 16px ${SANS}`; c.fillText('Alba, 2006', 150, 186);
    }
    if (sepia) { c.fillStyle = 'rgba(140,100,40,.12)'; c.fillRect(12, 12, W - 24, H - 24); }
  }
  // the TV in the corner: off, or the match (score, minute, the ball)
  function tvDraw(c, w, h, m) {
    c.fillStyle = '#14121a'; c.fillRect(0, 0, w, h);
    if (!m) { c.fillStyle = '#2a2632'; c.fillRect(8, 8, w - 16, h - 16); return; }
    c.fillStyle = '#3f9a4a'; c.fillRect(8, 8, w - 16, h - 16); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 3; c.strokeRect(24, 30, w - 48, h - 54);
    c.beginPath(); c.moveTo(w / 2, 30); c.lineTo(w / 2, h - 24); c.stroke(); c.beginPath(); c.arc(w / 2, (h + 6) / 2, 26, 0, TAU); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(m.bx || w / 2, m.by || h / 2, 7, 0, TAU); c.fill();
    c.fillStyle = 'rgba(20,18,26,.85)'; c.fillRect(8, 8, w - 16, 26); c.fillStyle = '#fff'; c.font = `800 18px ${SANS}`; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(`GER ${m.de} : ${m.tr} TUR   ${m.min}'`, 16, 21);
  }
  function tavlaDraw(c, w, h) {
    c.fillStyle = '#7a4a2a'; c.fillRect(0, 0, w, h); c.fillStyle = '#e9d3a8'; c.fillRect(10, 10, w / 2 - 16, h - 20); c.fillRect(w / 2 + 6, 10, w / 2 - 16, h - 20);
    for (let i = 0; i < 12; i++) { const x = (i < 6 ? 14 : w / 2 + 10) + (i % 6) * ((w / 2 - 24) / 6), tw = (w / 2 - 24) / 6; for (const [y0, y1] of [[10, h * 0.42], [h - 10, h * 0.58]]) { c.fillStyle = (i + (y0 > 50 ? 1 : 0)) % 2 ? '#a8322a' : '#2b2235'; c.beginPath(); c.moveTo(x, y0); c.lineTo(x + tw, y0); c.lineTo(x + tw / 2, y1); c.closePath(); c.fill(); } }
    [[30, 26, '#fff8ec'], [44, 26, '#fff8ec'], [w - 40, h - 26, '#2b2235'], [w - 54, h - 26, '#2b2235'], [w / 2 - 30, 26, '#2b2235']].forEach(([x, y, col]) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill(); });
  }

  // ================================================================ the storefront on house 10 (de games only)
  function house() {
    if (typeof TOWN === 'undefined' || !TOWN.layout) return null;
    const b = TOWN.layout.buildings.filter(q => q.kind === 'house')[HOUSE_N - 1]; if (!b) return null;
    const c = Math.cos(b.rot), s = Math.sin(b.rot), at = b.doorAt || null;
    const world = (lx, lz) => ({ x: b.x + lx * c + lz * s, z: b.z - lx * s + lz * c });
    const dlx = at ? (at.x - b.x) * c - (at.z - b.z) * s : 0;
    return { b, world, dlx, front: b.d / 2, yaw: b.rot };
  }
  function buildFront() {
    const h = house(); if (!h) return null;
    const g = new THREE.Group(); g.position.set(h.b.x, B.GY, h.b.z); g.rotation.y = h.yaw; B.root.add(g);
    const F = h.front, dx = h.dlx, half = h.b.w / 2, k = ZHF.Kit(), s = dx < 0 ? 1 : -1;     // (s: from the door toward the house's middle)
    // (town.js: a two-floor stucco house has a balcony right over its door, 2.9 up, so the sign hangs beside it, over the
    // ground-floor windows and under the upper ones; the menu goes in the shop window next to the door)
    const slots = Math.max(2, Math.min(4, Math.floor((h.b.w - 0.6) / 1.6))), slotW = h.b.w / slots;
    // the sign (both looks, swapped when the Hush is in), on a red frame
    const scv = document.createElement('canvas'); scv.width = 1024; scv.height = 256;
    const stex = new THREE.CanvasTexture(scv); stex.anisotropy = 4;
    const drawSign = lit => { signDraw(scv.getContext('2d'), 1024, 256, lit); stex.needsUpdate = true; };
    drawSign(true);
    const sw = Math.min(3.0, h.b.w / 2 - 0.2), sh = sw / 4, sy = 2.92, sx = clamp(dx + s * (0.95 + sw / 2), -half + sw / 2 + 0.1, half - sw / 2 - 0.1);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: stex })); sign.position.set(sx, sy, F + 0.12); g.add(sign);
    k.box(sx, sy, F + 0.06, sw + 0.12, sh + 0.12, 0.08, '#8f1d1a', { ink: 0.01 });
    // the menu, lit, in the shop window beside the door; the open sign on the door
    const lx = dx + s * slotW, mcv = canvasTex(512, 640, (c, w, hh) => menuDraw(c, w, hh));
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), new THREE.MeshBasicMaterial({ map: mcv })); lb.position.set(lx, 1.65, F + 0.15); g.add(lb);
    k.box(lx, 1.65, F + 0.11, 0.88, 1.08, 0.04, '#2b2235', { ink: 0.006 });
    const open = ZHF.plane(0.5, 0.22, canvasTex(256, 112, c => { c.fillStyle = '#fff8ec'; c.fillRect(0, 0, 256, 112); c.strokeStyle = '#3f9a4a'; c.lineWidth = 10; c.strokeRect(5, 5, 246, 102); c.fillStyle = '#3f9a4a'; c.font = `900 54px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Geöffnet', 128, 58); }));
    open.position.set(dx, 2.0, F + 0.14); g.add(open);
    // a blade sign sticking out from the wall: «DÖNER», top to bottom
    const bx = clamp(dx + (dx < 0 ? -1.3 : 1.3), -half + 0.2, half - 0.2);
    const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 1.3), new THREE.MeshBasicMaterial({ map: canvasTex(128, 380, c => { c.fillStyle = '#c8322a'; c.fillRect(0, 0, 128, 380); c.fillStyle = '#ffd23f'; c.fillRect(8, 8, 112, 4); c.fillRect(8, 368, 112, 4); c.fillStyle = '#fff8ec'; c.font = `900 66px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; 'DÖNER'.split('').forEach((ch, i) => c.fillText(ch, 64, 48 + i * 70)); }), side: THREE.DoubleSide }));
    blade.position.set(bx, 2.95, F + 0.6); blade.rotation.y = HALF; g.add(blade);
    k.rod([bx, 3.62, F + 0.02], [bx, 3.62, F + 0.9], 0.025, '#2b2235', { ink: 0 });
    // the standing table on the pavement: a napkin holder, a tulip glass of çay
    const tx = clamp(dx + s * (slotW * 1.5 + 0.3), -half + 0.4, half - 0.4), tz = F + 1.2;
    k.cyl(tx, 0.02, tz, 0.3, 0.04, '#5a5660').cyl(tx, 0.55, tz, 0.04, 1.06, '#8a8692', { ink: 0.006 }).cyl(tx, 1.09, tz, 0.38, 0.05, '#c8322a', { ink: 0.01 });
    k.box(tx - 0.1, 1.17, tz, 0.14, 0.12, 0.08, '#fffaf0', { ink: 0.004 }).cyl(tx + 0.12, 1.16, tz + 0.05, 0.03, 0.09, '#c2551e', { ink: 0.004 });
    ZHF.bake(g, k);
    const W = (a, b) => h.world(a, b);
    const T = W(tx, tz), col = { x: T.x, z: T.z, r: 0.42 }; col.x0 = col.x; col.z0 = col.z; B.colliders.push(col);
    const star3 = TK.glowTex && new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd23f', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.6 }));
    if (star3) { star3.scale.setScalar(1.2); star3.position.set(sx - sw / 2 + sw * 0.09, sy + 0.02, F + 0.3); g.add(star3); }
    return { g, h, sign, drawSign, lit: true, star3, door: W(dx, F + 0.9), doorIn: W(dx, F + 0.5), front: W(dx, F + 1.6), tableAt: T, signAt: W(sx, F + 1.4), menuAt: W(lx, F + 0.9) };
  }

  // ================================================================ the shop (a room at (X0, Y0, Z0); +z toward the door and the camera)
  const SPOT = { spawn: { x: 0.6, z: 4.1 }, exit: { x: 0.6, z: 4.7 }, front: { x: 0.2, z: -1.3 }, behind: { x: 2.4, z: -3.3 }, kemal: { x: -2.4, z: -3.55 }, elif: { x: 3.55, z: -1.45 },
    gulten: { x: -5.35, z: 0.6 }, gTable: { x: -4.65, z: 0.6 }, photos: { x: -5.6, z: -0.6 }, tv: { x: 6.3, z: -0.6 }, spit: { x: -3.65, z: -3.75 }, party: { x: 0.3, z: 1.5 } };
  const TABLES = [{ x: -1.4, z: 1.7 }, { x: 1.7, z: 1.7 }, { x: 4.4, z: 0.5 }];
  const PHOTOS = ['train', 'factory', 'neighbour', 'imbiss', 'school', 'opening'];
  function floorTex() {
    return canvasTex(512, 512, c => {
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#d9cbb2' : '#efe4cf'; c.fillRect(i * 64, j * 64, 64, 64); }
      c.fillStyle = 'rgba(90,70,50,.08)'; for (let k = 0; k < 600; k++) c.fillRect((k * 53) % 512, (k * 97) % 512, 3, 2);
      c.strokeStyle = 'rgba(120,100,80,.35)'; c.lineWidth = 2; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, 512); c.moveTo(0, i * 64); c.lineTo(512, i * 64); c.stroke(); }
    });
  }
  // warm yellow plaster over a dark red wainscot; white tiles behind the counter
  const wallTex = () => canvasTex(512, 512, c => { c.fillStyle = '#f2d58a'; c.fillRect(0, 0, 512, 512); for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(160,110,40,${0.03 + (i % 4) * 0.01})`; c.fillRect((i * 41) % 512, (i * 83) % 512, 2, 2); } c.fillStyle = '#8f1d1a'; c.fillRect(0, 370, 512, 142); c.fillStyle = GOLD; c.fillRect(0, 366, 512, 6); });
  const tileTex = () => canvasTex(512, 512, c => { c.fillStyle = '#f7f5ef'; c.fillRect(0, 0, 512, 512); c.strokeStyle = '#c9c4b8'; c.lineWidth = 3; for (let y = 0; y < 512; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); for (let x = (y / 32) % 2 ? 0 : 32; x < 512; x += 64) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 32); c.stroke(); } } });
  const TULIP = new THREE.LatheGeometry([[0, 0], [0.032, 0.002], [0.026, 0.03], [0.02, 0.05], [0.03, 0.08], [0.036, 0.1]].map(([x, y]) => new THREE.Vector2(x, y)), 12);
  const MEAT = new THREE.LatheGeometry([[0, 0], [0.27, 0], [0.31, 0.25], [0.36, 0.6], [0.41, 0.95], [0.38, 1.05], [0, 1.08]].map(([x, y]) => new THREE.Vector2(x, y)), 16);
  const halo = (color, size, op = 0.5) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op })); m.scale.setScalar(size); m.renderOrder = 3; return m; };
  function buildRoom() {
    const g = new THREE.Group(); g.name = 'doener-room'; g.position.set(X0, Y0, Z0); g.visible = false; G.w3d.scene.add(g);
    const k = ZHF.Kit(), solids = [];
    const ft = floorTex(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(HW / 2.2, HD / 2.2);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2 * HW, 0.3, 2 * HD), new THREE.MeshToonMaterial({ map: ft, gradientMap: TK.grad })); floor.position.y = -0.15; floor.receiveShadow = true; g.add(floor);
    const wm = new THREE.MeshToonMaterial({ map: wallTex(), gradientMap: TK.grad }), tm = new THREE.MeshToonMaterial({ map: tileTex(), gradientMap: TK.grad });
    for (const [w, x, z, ry, mat] of [[2 * HW, 0, -HD, 0, tm], [2 * HW, 0, HD, Math.PI, wm], [2 * HD, -HW, 0, HALF, wm], [2 * HD, HW, 0, -HALF, wm]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), mat); m.position.set(x, WH / 2, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m); }
    solids.push({ obox: 1, x: 0, z: -HD - 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: 0, z: HD + 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: -HW - 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 }, { obox: 1, x: HW + 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 });
    const WOOD = '#6b3a22', STEEL = '#c9ccd4';
    for (const [x, z] of [[-HW, -HD], [HW, -HD], [-HW, HD], [HW, HD]]) k.box(x + (x < 0 ? 0.1 : -0.1), WH / 2, z + (z < 0 ? 0.1 : -0.1), 0.2, WH, 0.2, '#8f1d1a');
    // the counter (red front, steel top), the glass display with the salad trays, the register, Elif's books
    const cx = -1.75, cz = -2.4, cw = 9.5;
    k.box(cx, 0.5, cz, cw, 1.0, 0.8, RED2, { ink: 0.014 }).box(cx, 1.03, cz, cw + 0.1, 0.06, 0.9, STEEL, { ink: 0.01 });
    for (let i = 0; i < 6; i++) k.box(cx - cw / 2 + 0.8 + i * 1.6, 0.5, cz + 0.405, 0.04, 0.9, 0.02, '#7a1a16', { ink: 0 });
    k.box(-1.95, 1.08, -2.2, 4.6, 0.04, 0.42, '#e8e8ee', { ink: 0.006 });
    [['#d6332a', -3.9], ['#fffaf0', -3.3], ['#8a3a7a', -2.7], ['#5fae4a', -2.1], ['#a8d870', -1.5], ['#7a2a6a', -0.9], ['#fbfbf6', -0.3]].forEach(([col, x]) => { k.box(x, 1.12, -2.2, 0.5, 0.05, 0.32, STEEL, { ink: 0 }); for (let j = 0; j < 4; j++) k.ball(x - 0.15 + j * 0.1, 1.17, -2.2 + ((j % 2) - 0.5) * 0.1, 0.06, 0.035, 0.06, col, { ink: 0 }); });
    const glass = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.36, 0.46), new THREE.MeshBasicMaterial({ color: '#cfe8f0', transparent: true, opacity: 0.22, depthWrite: false })); glass.position.set(-1.95, 1.3, -2.2); g.add(glass);
    k.box(2.25, 1.16, -2.5, 0.42, 0.2, 0.32, '#2b2235', { ink: 0.006 }).box(2.25, 1.33, -2.58, 0.3, 0.16, 0.03, '#3f9a8a', { rx: -0.3, ink: 0 });
    k.box(2.75, 1.1, -2.2, 0.34, 0.06, 0.26, '#2f7fc9', { ink: 0.004 }).box(2.73, 1.16, -2.22, 0.32, 0.05, 0.25, '#c8322a', { ink: 0.004 }).box(2.76, 1.2, -2.21, 0.3, 0.02, 0.22, '#fffaf0', { ink: 0.004 });
    solids.push({ obox: 1, x: cx, z: cz, hw: cw / 2 + 0.05, hd: 0.45, rot: 0 });
    // the tea station: the double teapot (çaydanlık) and tulip glasses on a brass tray
    k.cyl(1.0, 1.17, -2.45, 0.16, 0.22, STEEL, { ink: 0.008 }).cyl(1.0, 1.35, -2.45, 0.11, 0.14, '#d9dbe2', { ink: 0.006 }).cone(1.18, 1.2, -2.45, 0.03, 0.14, STEEL, { rz: -1.0, ink: 0 }).cone(1.12, 1.38, -2.45, 0.02, 0.1, STEEL, { rz: -1.0, ink: 0 }).ball(1.0, 1.45, -2.45, 0.03, 0.03, 0.03, '#2b2235', { ink: 0 });
    k.cyl(1.55, 1.07, -2.3, 0.24, 0.02, '#d9a03a', { ink: 0.004 });
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; k.add(TULIP, '#c2551e', 1.55 + Math.cos(a) * 0.14, 1.08, -2.3 + Math.sin(a) * 0.14, 1, 1, 1, 0, 0, 0, { ink: 0 }); }
    // the spit: the heater behind it, its base and drip tray (the meat turns: its own group)
    const sp = SPOT.spit;
    k.box(sp.x, 0.55, sp.z - 0.45, 0.9, 1.1, 0.2, '#3d3f48', { ink: 0.01 }).box(sp.x, 1.55, sp.z - 0.45, 0.9, 1.0, 0.2, '#3d3f48', { ink: 0.01 }).box(sp.x, 0.95, sp.z, 0.7, 0.08, 0.7, STEEL, { ink: 0.008 }).box(sp.x, 0.5, sp.z, 0.5, 0.9, 0.5, '#5a5d68', { ink: 0.008 });
    k.box(-1.0, 0.55, -4.4, 1.6, 1.1, 0.7, '#5a5d68', { ink: 0.01 }).box(-1.0, 1.12, -4.4, 1.66, 0.05, 0.76, STEEL, { ink: 0.006 });
    for (let i = 0; i < 4; i++) k.cyl(-1.5 + i * 0.32, 1.2, -4.4, 0.13, 0.12, i % 2 ? '#f1d08a' : '#e9c27a', { ink: 0.004 });
    solids.push({ obox: 1, x: sp.x, z: sp.z - 0.2, hw: 0.5, hd: 0.5, rot: 0 }, { obox: 1, x: -1.0, z: -4.4, hw: 0.85, hd: 0.4, rot: 0 });
    const heat = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.7), new THREE.MeshBasicMaterial({ color: '#ff7a2a' })); heat.position.set(sp.x, 1.5, sp.z - 0.34); g.add(heat);
    const heatHalo = halo('#ff9a3a', 2.4, 0.4); heatHalo.position.set(sp.x, 1.5, sp.z - 0.2); g.add(heatHalo);
    const spit = new THREE.Group(); spit.position.set(sp.x, 1.0, sp.z); g.add(spit);
    const meat = new THREE.Mesh(MEAT, TK.toon('#a8582a')); meat.castShadow = true; spit.add(meat);
    spit.add(new THREE.Mesh(MEAT, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })).translateY(0)); spit.children[1].scale.set(1.05, 1.02, 1.05);
    const ks = ZHF.Kit(); ks.rod([0, -0.05, 0], [0, 1.4, 0], 0.025, STEEL, { ink: 0 }).cyl(0, 1.12, 0, 0.36, 0.04, STEEL, { ink: 0.006 }); for (let i = 0; i < 6; i++) ks.box(Math.cos(i) * 0.32, 0.3 + i * 0.12, Math.sin(i) * 0.32, 0.12, 0.05, 0.06, '#7a3a1a', { ry: -i, ink: 0 }); ZHF.bake(spit, ks);
    // the backlit menu over the counter, the drinks fridge, a nazar by the door, plants
    const menu = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 1.4), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 256, (c, w, h) => menuDraw(c, w, h, { wide: true })) })); menu.position.set(-0.6, 2.6, -HD + 0.05); g.add(menu);
    k.box(-0.6, 2.6, -HD + 0.02, 5.75, 1.55, 0.04, '#2b2235', { ink: 0 });
    k.box(4.9, 1.0, -4.3, 1.05, 2.0, 0.8, '#e8e8ee', { ink: 0.012 });
    const cols = ['#fffdf6', '#d6332a', '#f28a1e', '#5fae4a', '#fffdf6'];
    for (let r = 0; r < 4; r++) for (let i = 0; i < 5; i++) k.cyl(4.55 + i * 0.17, 0.35 + r * 0.45, -3.95, 0.05, 0.24, cols[(i + r) % 5], { ink: 0.003 });
    const fglass = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.85), new THREE.MeshBasicMaterial({ color: '#bfe6f2', transparent: true, opacity: 0.3, depthWrite: false })); fglass.position.set(4.9, 1.0, -3.89); g.add(fglass);
    solids.push({ obox: 1, x: 4.9, z: -4.3, hw: 0.58, hd: 0.45, rot: 0 });
    for (const [r, col, z] of [[0.3, '#1f4fa8', 0], [0.2, '#ffffff', 0.01], [0.12, '#7cc4ff', 0.02], [0.06, INK, 0.03]]) k.add(ZHF.GEO.cyl, col, HW - 0.06 - z, 2.1, 3.4, r, 0.02, r, 0, 0, HALF, { ink: 0 });
    for (const [x, z] of [[-5.9, 4.3], [5.9, 4.3]]) { k.cyl(x, 0.25, z, 0.25, 0.5, '#c97a3a', { ink: 0.008 }); for (let i = 0; i < 5; i++) k.ball(x + Math.cos(i * 1.3) * 0.18, 0.75 + (i % 3) * 0.15, z + Math.sin(i * 1.3) * 0.18, 0.2, 0.12, 0.2, '#4f9a4a', { ink: 0.006 }); solids.push({ x, z, r: 0.35 }); }
    // the bistro tables, and Babaanne's table with her tavla board and her tea
    for (const T of TABLES) {
      k.cyl(T.x, 0.03, T.z, 0.28, 0.06, '#5a5660').cyl(T.x, 0.38, T.z, 0.04, 0.72, '#8a8692', { ink: 0.006 }).cyl(T.x, 0.75, T.z, 0.44, 0.04, '#f4efe4', { ink: 0.01 });
      for (const s of [-1, 1]) k.box(T.x + s * 0.72, 0.45, T.z, 0.4, 0.05, 0.4, '#c8322a', { ink: 0.008 }).box(T.x + s * 0.92, 0.75, T.z, 0.05, 0.6, 0.4, '#c8322a', { ink: 0.008 }).box(T.x + s * 0.72, 0.22, T.z, 0.04, 0.44, 0.04, '#5a5660', { ink: 0 });
      solids.push({ x: T.x, z: T.z, r: 0.62 });
    }
    const gt = SPOT.gTable;
    k.cyl(gt.x, 0.38, gt.z, 0.05, 0.72, WOOD, { ink: 0.006 }).cyl(gt.x, 0.75, gt.z, 0.52, 0.05, '#c9935a', { ink: 0.01 }).cyl(gt.x, 0.03, gt.z, 0.3, 0.06, WOOD);
    k.box(SPOT.gulten.x, 0.45, SPOT.gulten.z, 0.46, 0.06, 0.46, WOOD, { ink: 0.008 }).box(SPOT.gulten.x - 0.22, 0.78, SPOT.gulten.z, 0.05, 0.62, 0.46, WOOD, { ink: 0.008 });
    k.add(TULIP, '#c2551e', gt.x + 0.32, 0.78, gt.z + 0.28, 1.2, 1.2, 1.2, 0, 0, 0, { ink: 0 });
    const tav = ZHF.plane(0.56, 0.38, canvasTex(256, 176, (c, w, h) => tavlaDraw(c, w, h))); tav.rotation.x = -HALF; tav.position.set(gt.x - 0.05, 0.79, gt.z - 0.05); g.add(tav);
    solids.push({ x: gt.x, z: gt.z, r: 0.62 }, { x: SPOT.gulten.x, z: SPOT.gulten.z, r: 0.35 });
    // Elif's stool at the end of the counter
    k.cyl(SPOT.elif.x, 0.66, SPOT.elif.z, 0.22, 0.06, '#c8322a', { ink: 0.006 }).cyl(SPOT.elif.x, 0.33, SPOT.elif.z, 0.04, 0.66, '#8a8692', { ink: 0 });
    solids.push({ x: SPOT.elif.x, z: SPOT.elif.z, r: 0.3 });
    // the photo wall (west), the TV (east, high up)
    PHOTOS.forEach((kind, i) => { const m = ZHF.plane(0.66, 0.52, canvasTex(256, 200, c => photoDraw(c, kind))); m.position.set(-HW + 0.04, i % 2 ? 2.35 : 1.75, -2.8 + i * 1.0); m.rotation.y = HALF; g.add(m); });
    const tcv = document.createElement('canvas'); tcv.width = 320; tcv.height = 190; tvDraw(tcv.getContext('2d'), 320, 190, null);
    const ttex = new THREE.CanvasTexture(tcv), tv = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.64), new THREE.MeshBasicMaterial({ map: ttex })); tv.position.set(HW - 0.12, 2.6, SPOT.tv.z); tv.rotation.y = -HALF; g.add(tv);
    k.box(HW - 0.08, 2.6, SPOT.tv.z, 0.06, 0.72, 1.16, '#14121a', { ink: 0.006 }).box(HW - 0.03, 2.6, SPOT.tv.z, 0.04, 0.1, 0.1, '#3d3f48', { ink: 0 });
    // the lamps
    const lamps = [];
    for (const [x, z] of [[-3.2, -0.5], [0.6, 0.6], [4.0, -0.5]]) { k.rod([x, WH, z], [x, 3.15, z], 0.012, INK, { ink: 0 }).add(ZHF.GEO.half, '#c8322a', x, 3.12, z, 0.28, 0.18, 0.28, Math.PI, 0, 0, { ink: 0.008 }).ball(x, 3.02, z, 0.1, 0.07, 0.1, '#fff2c8', { glow: true }); const hl = halo('#ffd890', 1.6, 0.45); hl.position.set(x, 2.95, z); g.add(hl); lamps.push(hl); }
    ZHF.bake(g, k);
    const cols2 = solids.map(s => { const c = Object.assign({}, s, { x: X0 + s.x, z: Z0 + s.z, doener: true }); c.x0 = c.x; c.x = c.x0 + 1e5; return c; });
    WORLD.addSolids(cols2);
    const plat = { box: [1e5, 1e5 + 1, 1e5, 1e5 + 1], top: Y0, doener: true }; WORLD.addPlatforms([plat]);
    const actors = new THREE.Group(); actors.visible = false; G.w3d.scene.add(actors);
    R = { g, actors, cols: cols2, plat, spit, heat, heatHalo, lamps, menu, tv, tcv, ttex, people: {} };
    makeFamily();
  }
  const roomOn = on => { if (!R) return; for (const c of R.cols) c.x = c.x0 + (on ? 0 : 1e5); R.plat.box = on ? [X0 - HW, X0 + HW, Z0 - HD, Z0 + HD] : [1e5, 1e5 + 1, 1e5, 1e5 + 1]; };
  // ---------------- the family (and anyone who drops in): rigs placed in room coordinates
  function person(id, name, look, o = {}) {
    const p = ZHF.person(look, o); p.id = id; p.name = name; p.nameSrc = name; p.root.visible = false; R.actors.add(p.root); R.people[id] = p; return p;
  }
  function put(p, x, z, yaw, y = 0) { p.x = X0 + x; p.z = Z0 + z; p.y = Y0 + y; if (yaw !== undefined) p.yaw = p.baseYaw = yaw; p.root.visible = true; p.hidden = false; return p; }
  function makeFamily() {
    const ke = person('kemal', 'Kemal', { skin: '#d9a37a', hair: '#2b2235', shirt: '#fbfbf6', sleeve: '#fbfbf6', pants: '#2f3440', apron: '#c8322a', hat: 'flat', hatCol: '#c8322a', glasses: true, belly: true });
    const el = person('elif', 'Elif', { skin: '#d9a37a', hair: '#2b2235', shirt: '#7a4f8f', sleeve: '#7a4f8f', pants: '#2f3440', shoes: '#fbfbf6', collar: '#7a4f8f' }, { sit: true, seatY: 0.7 });
    const kt = ZHF.Kit(); kt.ball(0, 0.04, -0.27, 0.11, 0.14, 0.1, '#2b2235', { ink: 0.008 }).ball(0, -0.12, -0.3, 0.07, 0.12, 0.07, '#2b2235', { ink: 0.006 }); ZHF.bake(el.head, kt);
    const kp = ZHF.Kit(); kp.add(ZHF.GEO.tor, '#2b2235', 0, el.hipY + 0.52, 0.02, 0.2, 0.2, 0.25, HALF + 0.3, 0, 0, { ink: 0 }).ball(-0.2, el.hipY + 0.55, 0.06, 0.07, 0.08, 0.04, '#3f3a4a', { ink: 0.004 }).ball(0.2, el.hipY + 0.55, 0.06, 0.07, 0.08, 0.04, '#3f3a4a', { ink: 0.004 }); ZHF.bake(el.body, kp);
    const gu = person('gulten', 'Babaanne', { skin: '#e0b088', hair: '#e8e4dc', shirt: '#8a4f7d', sleeve: '#c97a3a', pants: '#4a3f35', vest: '#c97a3a', glasses: true, old: true }, { sit: true, seatY: 0.48 });
    const kb = ZHF.Kit(); kb.ball(0, 0.18, -0.2, 0.1, 0.09, 0.09, '#e8e4dc', { ink: 0.008 }); ZHF.bake(gu.head, kb);
    const se = person('selin', 'Selin', { skin: '#d9a37a', hair: '#3a2b26', shirt: '#4fa3a5', sleeve: '#4fa3a5', pants: '#2f3440' });
    put(ke, SPOT.kemal.x, SPOT.kemal.z, 0); put(el, SPOT.elif.x, SPOT.elif.z, -0.35); put(gu, SPOT.gulten.x, SPOT.gulten.z, HALF);
    el.pose = 'cards'; gu.pose = 'cards'; se.root.visible = false; se.hidden = true;
  }
  // ---------------- {mimo}'s cap (the shop's: red, a white star) and the nazar charm on its ear
  let CAP = null, NAZ = null;
  function mimoBits() {
    if (!G || !G.cast || !G.cast.mimo || !G.cast.mimo.body) return;
    if (!CAP) {
      const g = new THREE.Group(); g.position.set(0, 0.55, -0.04); g.rotation.set(-0.18, 0, 0.08);
      const k = ZHF.Kit(); k.add(ZHF.GEO.half, RED, 0, 0, 0, 0.19, 0.15, 0.2, 0, 0, 0, { ink: 0.01 }).box(0, 0.005, 0.2, 0.26, 0.025, 0.16, RED2, { ink: 0.006 }).ball(0, 0.15, 0, 0.03, 0.02, 0.03, RED2, { ink: 0 });
      ZHF.bake(g, k);
      const st = ZHF.plane(0.11, 0.11, canvasTex(64, 64, c => star(c, 32, 34, 28, '#fffaf0')), { alpha: true }); st.position.set(0, 0.08, 0.17); st.rotation.x = -0.5; g.add(st);
      g.visible = false; G.cast.mimo.body.add(g); CAP = g;
    }
    if (!NAZ && G.cast.mimo.ears && G.cast.mimo.ears[1]) {
      const g = new THREE.Group(); g.position.set(0.02, 0.12, 0.06);
      const k = ZHF.Kit(); k.add(ZHF.GEO.tor, '#d9a03a', 0, 0.055, 0, 0.025, 0.025, 0.25, 0, 0, 0, { ink: 0 });
      for (const [r, col, z] of [[0.05, '#1f4fa8', 0], [0.034, '#ffffff', 0.004], [0.02, '#7cc4ff', 0.008], [0.009, INK, 0.012]]) k.add(ZHF.GEO.cyl, col, 0, 0, z, r, 0.01, r, HALF, 0, 0, { ink: 0 });
      ZHF.bake(g, k); g.visible = false; G.cast.mimo.ears[1].add(g); NAZ = g;
    }
  }
  const otherHat = () => (typeof WEIHNACHT !== 'undefined' && WEIHNACHT.hatOn && WEIHNACHT.hatOn()) || (typeof ADOLF !== 'undefined' && ADOLF.capOn && ADOLF.capOn());
  const hatOn = () => !!(isDe() && G.state.dn && G.state.dn.cap && !G.state.dn.capOff && !otherHat());
  const nazarOn = () => !!(isDe() && G.state.dn && G.state.dn.nazar && !G.state.dn.nazarOff);

  // ================================================================ outdoors: the storefront (build / update, through main.js's MODS)
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    const root = new THREE.Group(); root.name = 'doener'; root.visible = false; scene.add(root);
    B = { root, gy, GY: (typeof TOWN !== 'undefined' && TOWN.GY) || 0.25, colliders: [], people: [] };
    try { B.front = buildFront(); } catch (e) { console.error('[doener] front', e); }
    return { colliders: B.colliders, group: root, people: B.people, update };
  }
  // the Hush has the shop between the third bell and the match night, once the party (chapter 4) is over: it moves in while
  // you're away (st.hushOn: set as you come in or go out, never in the middle of a visit)
  const hushDue = () => { const st = G && G.state && G.state.dn; return !!(st && st.ch && st.ch[4] && !st.ch[5] && (flags().bells || 0) >= 3); };
  const hushed = () => hushDue() && !!G.state.dn.hushOn;
  function update(dt, t, you) {
    if (!B) return;
    const on = shown() && !(G.indoors && G.indoors());
    B.root.visible = on;
    for (const c of B.colliders) c.x = c.x0 + (on ? 0 : 1e5);
    mimoBits(); if (CAP) CAP.visible = hatOn(); if (NAZ) NAZ.visible = nazarOn();
    if (!on || !B.front) return;
    const lit = !hushed() || MATCH.on;
    if (B.front.lit !== lit) { B.front.lit = lit; B.front.drawSign(lit); }
    if (B.front.star3) B.front.star3.material.opacity = lit ? 0.5 + 0.12 * Math.sin(t * 3.1) : 0;
  }

  // ================================================================ the shop as a room (main.js ROOMS)
  let inside = false, rbusy = false;
  const OUT = () => { const F = B && B.front; return F ? { x: F.front.x, z: F.front.z, yaw: F.h.yaw } : { x: -31.3, z: -146.6, yaw: Math.PI }; };
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo; Y.x = x; Y.z = z; Y.yaw = yaw; Y.vx = Y.vz = Y.vy = 0; Y.onGround = true;
    M.x = x + Math.cos(yaw) * 0.95; M.z = z - Math.sin(yaw) * 0.95; M.station = null; M.look = null; M.hop = null; M.wander = null;
    [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3); G.sim.snap();
  }
  const roomAt = (x, z, yaw) => teleport(X0 + x, Z0 + z, yaw);
  async function enter(o = {}) {
    if (!G || inside || rbusy || !shown()) return;
    rbusy = true;
    try {
      sfx('wood'); await UI.fade(1, 380);
      if (!R) buildRoom();
      inside = true; R.g.visible = true; R.actors.visible = true; roomOn(true);
      G.w3d.setInterior({ fog: '#2a1c14', near: 26, far: 70 });
      roomAt(SPOT.spawn.x, SPOT.spawn.z, Math.PI); G.cam.snap(Math.PI, 0.5, 9.5);
      await UI.fade(0, 380);
    } catch (e) { console.error('[doener] enter', e); }
    rbusy = false;
    const st = S(); if (!st.visited) { st.visited = true; UI.chapter('Yıldız Grill', 'Döner · Dürüm · Çay · Alba'); }
    if (hushDue()) st.hushOn = true;
    familyPose();
    if (G.save) G.save();
    if (o.quiet) return;
    if (!st.met) await meet();
    else if (hushed() && !st.l5) await quietScene();
  }
  async function leave() {
    if (!G || !inside || rbusy) return;
    rbusy = true;
    try {
      sfx('wood'); await UI.fade(1, 380);
      inside = false; if (R) { R.g.visible = false; R.actors.visible = false; } roomOn(false); G.w3d.setInterior(null); G.fx.hush = 0;
      if (hushDue()) S().hushOn = true;
      const o = OUT(); [o.x, o.z] = WORLD.pushOut(o.x, o.z, 0.45); teleport(o.x, o.z, o.yaw); G.cam.snap(o.yaw + Math.PI - 0.9, 0.34, 8.5);
      await UI.fade(0, 380);
    } catch (e) { console.error('[doener] leave', e); }
    rbusy = false; if (G.save) G.save();
  }
  function keepIn() {
    const lim = (v, c, h) => Math.max(c - h, Math.min(c + h, v)), M = G.sim.mimo, Y = G.sim.you;
    if (!M.hidden && (Math.abs(M.x - X0) > HW - 0.3 || Math.abs(M.z - Z0) > HD - 0.3 || M.y < Y0 - 1)) { M.hop = null; M.wander = null; M.x = lim(M.x, X0, HW - 0.7); M.z = lim(M.z, Z0, HD - 0.7); M.y = M.ry = Y0; }
    if (M.wander && (Math.abs(M.wander.x - X0) > HW - 0.7 || Math.abs(M.wander.z - Z0) > HD - 0.7)) { M.wander.x = lim(M.wander.x, X0, HW - 0.8); M.wander.z = lim(M.wander.z, Z0, HD - 0.8); }
    if (Y.y < Y0 - 2 || Math.abs(Y.x - X0) > HW + 0.5 || Math.abs(Y.z - Z0) > HD + 0.5) roomAt(SPOT.spawn.x, SPOT.spawn.z, Math.PI);
  }
  // the match on the TV (chapter 5): the score, the minute, a ball wandering about
  // (night: chapter 5 is on; lit: the grill is back on; hush: how much of the Hush is left, 1 → 0)
  const MATCH = { on: false, de: 0, tr: 0, min: 0, crowd: 0, lit: false, hush: 0, night: false };
  let tvKey = '';
  function roomUpdate(dt, t) {
    if (!inside || !R) return;
    keepIn();
    // the Hush in the shop: a grey cloud under the ceiling, the colours drained (between the third bell and the match night)
    cloudTick(dt, t, MATCH.night ? MATCH.hush : hushed() ? 1 : 0); G.fx.hush = 0.42 * CL.v;
    const quiet = hushed() && !MATCH.lit;
    R.spit.rotation.y += dt * (quiet ? 0 : 0.6);
    const hf = quiet ? 0 : 0.9 + Math.sin(t * 9) * 0.05 + Math.sin(t * 23) * 0.04;
    R.heat.material.color.set(quiet ? '#5a4a44' : '#ff7a2a'); R.heatHalo.material.opacity = 0.42 * hf;
    R.lamps.forEach((s, i) => { s.material.opacity = (quiet ? 0.12 : 0.42) + 0.05 * Math.sin(t * 4.1 + i * 2); });
    for (const p of Object.values(R.people)) if (p.root.visible) ZHF.animate(p, dt, t, null);
    if (MATCH.on) {
      MATCH.min = Math.min(90, MATCH.min + dt * 0.8);
      const key = `${MATCH.de}:${MATCH.tr}:${Math.floor(MATCH.min)}:${Math.floor(t * 4)}`;
      if (key !== tvKey) { tvKey = key; tvDraw(R.tcv.getContext('2d'), 320, 190, { de: MATCH.de, tr: MATCH.tr, min: Math.floor(MATCH.min), bx: 160 + Math.sin(t * 1.3) * 110, by: 105 + Math.cos(t * 1.7) * 50 }); R.ttex.needsUpdate = true; }
    } else if (tvKey !== 'off') { tvKey = 'off'; tvDraw(R.tcv.getContext('2d'), 320, 190, null); R.ttex.needsUpdate = true; }
    // (a scene that broke off never leaves you frozen)
    if (G.sim.lock && !STORY.busy && !WUI.isOpen && !WUI.hud.isOpen && !rbusy && !busyN) { G.sim.lock = 0; G.cam.override = null; }
  }

  // ================================================================ the music: «Saz & Spieß» (the shop's radio)
  // German hip-hop has deep Turkish-German roots: a bağlama (saz) riff in Hicaz (E F G# A B C D: the augmented second F–G#)
  // over a dusty boom-bap and an 808 (90 bpm, a light swing). A darbuka plays the maqsum pattern (doum, tek, tek, doum, tek)
  // under the kick and snare, a low open-string drone rings under each bar, vinyl crackle on top. The saz is a bright pluck
  // with an octave course and a metal twang, and it tremolos its long notes like a real bağlama. Intro 2 (the saz and the
  // drone alone) · A 8 (the riff over the beat) · B 8 (a tremolo line up high, handclaps) · a 2-bar darbuka break.
  // Roots: A: E F A E (twice) · B: A G F E (twice).
  (function addSong() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const K = Sound.kit;
    const RIFF = K.mel('E4/2 F4/2 G#4/2 A4/2 B4/4 A4/2 G#4/2 | F4/3 G#4/1 F4/2 E4/2 r/4 E5/2 D5/2 | C5/2 B4/2 A4/2 G#4/2 A4/3 B4/1 A4/2 G#4/2 | F4/2 G#4/2 F4/2 E4/6 r/4');
    const LINE = K.mel('B4/4 C5/4 B4/2 A4/2 G#4/4 | A4/6 B4/2 C5/4 D5/4 | E5/8 D5/4 C5/4 | B4/4 A4/2 G#4/2 F4/4 E4/4');
    const ROOTS = [40, 41, 45, 40, 40, 41, 45, 40, 45, 43, 41, 40, 45, 43, 41, 40];
    const saz = (m, t, len, v) => { K.string(m, t, v, len, 2.6); K.string(m + 12, t + 0.004, v * 0.32, len * 0.6, 3); K.banjo(m, t, v * 0.22); };
    Sound.addSong('de_doener', { bpm: 90, len: 320, from: 32, swing: 0.08, vol: 0.35, verb: 0.08, echo: 0.08, echoSteps: 3,
      play(i, t, s16) {
        const bar = i >> 4, s = i & 15, intro = bar < 2, brk = bar >= 18, sec = bar < 10 ? 'A' : 'B', r = ROOTS[(bar - 2 + 16) % 16];
        K.crackle(t, s16, 1.2);
        if (s === 0) K.string(intro || brk ? 40 : r - 12 + 12, t, 0.35, 15 * s16, 1.2);
        // the saz: the riff (intro, A, the break), the tremolo line (B)
        const mel = intro || brk || sec === 'A' ? RIFF[i % 64] : LINE[(i - 160) % 64];
        if (mel) { const [m, len] = mel, v = sec === 'B' && !brk ? 0.8 : 0.95; saz(sec === 'B' && !brk ? m + 12 : m, t, Math.min(len, 3) * s16, v); if (len >= 4) for (let k = 1; k < len; k++) saz(sec === 'B' && !brk ? m + 12 : m, t + k * s16, s16 * 0.9, v * (0.5 - k * 0.03)); }
        if (intro) return;
        // the darbuka: doum (0, 8), tek (2, 6, 12), and a tek roll at the end of every other bar
        if (s === 0 || s === 8) K.tom(t, 72, 0.9);
        if (s === 2 || s === 6 || s === 12 || ((bar & 1) && s >= 13)) K.rim(t, s >= 13 ? 0.55 : 0.85);
        if (brk) return;
        // boom-bap: the kick, the snare (with claps in B), hats
        if (s === 0 || s === 10 || (s === 7 && bar % 4 === 3)) K.kick(t, s ? 0.75 : 1);
        if (s === 4 || s === 12) { K.snare(t, 0.75); if (sec === 'B') K.clap(t, 0.45); }
        if (!(s & 1)) K.hat(t, s % 4 ? 0.22 : 0.35);
        // the 808: the root, long and low, with a pickup
        if (s === 0) K.sub808(r, t, 6 * s16, 0.85); if (s === 10) K.sub808(r, t, 3 * s16, 0.7); if (s === 14 && bar % 4 === 3) K.sub808(r + 2, t, 2 * s16, 0.6);
        if (s === 0 && (bar === 2 || bar === 10)) K.crash(t, 0.5);
      } });
  })();

  // ================================================================ scenes: helpers
  let busyN = 0;
  const lock = on => { if (G) G.sim.lock = on ? 1 : 0; };
  const think = (text, s) => STORY.think(text, s);
  const shot = (p, l) => { G.cam.override = { pos: V3(p[0], p[1], p[2]), look: V3(l[0], l[1], l[2]) }; };
  const rshot = (p, l) => shot([X0 + p[0], Y0 + p[1], Z0 + p[2]], [X0 + l[0], Y0 + l[1], Z0 + l[2]]);
  const SHOT = { wide: [[1.2, 3.4, 7.8], [-0.4, 1.3, -2.2]], counter: [[0.6, 2.0, 2.4], [-1.2, 1.3, -3.2]], gulten: [[-2.2, 1.8, 3.2], [-4.8, 1.0, 0.4]], elif: [[2.0, 1.7, 1.6], [3.5, 1.1, -1.5]], photos: [[-3.2, 2.0, 0.6], [-6.4, 1.9, -0.6]], tv: [[2.4, 2.4, 2.6], [6.3, 2.4, -0.6]], till: [[2.7, 2.65, -4.5], [-0.6, 1.45, -1.2]] };
  async function scene(fn) {
    lock(true); busyN++;
    try { await fn(); } catch (e) { console.error('[doener] scene', e); }
    finally { busyN--; G.cam.override = null; lock(false); if (G.sim.mimo) G.sim.mimo.look = null; if (!MATCH.on) G.fx.hush = 0; if (G.save) G.save(); }
  }
  // a line over someone (a rig in the shop, or someone in town wrapped by talker): German, the English under it
  function sayRaw(p, de, en) { if (!p || typeof STORY === 'undefined') return Promise.resolve(); p.lines = { de, en }; if (!p.name) p.name = p.nameSrc || ''; return STORY.sayInline(p, true); }
  const say = (p, key, vars) => { const l = lineOf(key, vars); return sayRaw(p, l.de, l.en); };
  const P = id => R && R.people[id];
  function talker(p, name, top) { return { name, get x() { return p.x; }, get z() { return p.z; }, get y() { return p.y !== undefined ? p.y : WORLD.terrainAt(p.x, p.z); }, top: top || p.top || 1.75, get talking() { return !!p.talking; }, set talking(v) { p.talking = v; } }; }
  function who(where) {
    const [kind, id] = String(where).split(':');
    if (kind === 'npc') return G.sim.npc(id) || null;
    if (kind === 'town') { const L0 = G.town && G.town.people, p = L0 && L0.find(q => q.id === id); return p && !p.hushed ? p : null; }
    if (kind === 'adolf') { const L0 = G.adolf && G.adolf.people; return (L0 && L0.find(q => q.id === id && !q.hidden)) || null; }
    return null;
  }
  const NPC_TOP = { rosa: 1.85, bruno: 2.05, baker: 1.95 };
  function shotAt(p, d = 3.2) { const Y = G.sim.you, dx = Y.x - p.x, dz = Y.z - p.z, L0 = Math.hypot(dx, dz) || 1, ux = dx / L0, uz = dz / L0, y = p.y !== undefined ? p.y : WORLD.terrainAt(p.x, p.z); shot([p.x + ux * (d - 0.4) - uz * 2.0, y + 1.9, p.z + uz * (d - 0.4) + ux * 2.0], [p.x, y + 1.05, p.z]); }
  const coins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; sfx('chest'); UI.toast(`${why}: +${n} coins`); };
  const mimoHappy = (n = 1.6) => { const M = G.sim.mimo; if (M) M.happy = Math.max(M.happy || 0, n); };
  const sparkle = (x, y, z, n, cols, s) => { try { G.w3d.fx.sparkle(x, y, z, n, cols || ['#ffd23f', '#ff6a5a']); if (s) sfx(s); } catch (e) { /* */ } };
  const icoArt = (key, size = 120) => el => el.appendChild(WUI.art.icon(key, size));
  const row = (...keys) => el => keys.forEach(k => el.appendChild(WUI.art.icon(k, 96)));
  const FACE = { kemal: ['dnKemal', 'Kemal'], elif: ['dnElif', 'Elif'], gulten: ['dnGulten', 'Babaanne Gülten'] };
  const panel = (whoId, title, sub) => ({ title, sub, face: FACE[whoId][0], name: FACE[whoId][1] });

  // ================================================================ checks for typed German
  const ART = { m: 'der', f: 'die', n: 'das' };
  // a menu thing with its article (recall: «der Dürüm»)
  const nounCheck = M0 => t => {
    const h = has(t, M0.keys); if (!h.ok) return { ok: false, why: 'Look at the picture again! (Tab: a hint)' };
    const T = toks(t), a = T.find(w => ['der', 'die', 'das'].includes(w)), want = ART[M0.g], alt = M0.also ? ART[M0.also] : null;
    if (!a) return { ok: true, minor: true, said: M0.art, note: `with its article: «${esc(M0.art)}»` };
    if (a !== want && a !== alt) return { ok: true, grade: 'B', said: M0.art, note: `it’s «${esc(M0.art)}»` };
    return { ok: true, minor: h.typo, said: M0.art };
  };
  // an order: the thing(s) and the extras; polite with «bitte» / «Ich hätte gern» / «einmal»
  const orderCheck = (need, model) => t => {
    for (const [keys, what] of need) if (!has(t, keys).ok) return { ok: false, why: `And ${what}? «${esc(model)}»` };
    const polite = has(t, ['bitte', 'hatte gern', 'hatte gerne', 'mochte', 'einmal', 'zweimal', 'ich nehme']).ok;
    return polite ? { ok: true } : { ok: true, minor: true, note: 'politer with «bitte», «einmal …» or «Ich hätte gern …»' };
  };
  // repeating a customer's order for Kemal: every part must be there
  const repeatCheck = C0 => t => {
    for (const keys of C0.parts) if (!has(t, keys).ok) return { ok: false, why: `Something’s missing. Listen again: «${esc(C0.say[0])}»` };
    return { ok: true };
  };
  // a price in words (digits count, with a note); o.frame: words that make it a sentence
  const priceCheck = (cents, o = {}) => t => {
    const p = WUI.price(t); if (!p) return { ok: false, why: o.why || `How much? Say it in words: «${WUI.euroWords(cents)}»?` };
    if (p.cents !== cents) return { ok: false, why: `Not quite: that’s ${WUI.euro(p.cents)}. Add it up again (the menu’s on the wall)!` };
    if (p.digits) return { ok: true, grade: 'B', note: `in words: «${WUI.euroWords(cents)}»` };
    return !o.frame || has(t, o.frame).ok ? { ok: true } : { ok: true, minor: true, note: o.frameNote || '' };
  };
  const anyCheck = (keys, why) => t => { const h = has(t, keys); return h.ok ? { ok: true, minor: h.typo } : { ok: false, why }; };
  // a year: «1964», «neunzehnhundertvierundsechzig», «neunzehnhundert vierundsechzig» (→ { n, digits })
  const numberIn = t => {
    const d = String(t).match(/\d{3,4}/); if (d) return { n: +d[0], digits: true };
    const T = toks(t);
    for (let i = 0; i < T.length; i++) {
      if (!T[i].startsWith('neunzehnhundert')) continue;
      let rest = T[i].slice(15); if (rest.startsWith('und')) rest = rest.slice(3);
      if (rest) { const v = WUI.num(rest); if (v != null && v < 100) return { n: 1900 + v, digits: false }; continue; }
      for (let j = Math.min(T.length, i + 4); j > i + 1; j--) { const v = WUI.num(T.slice(i + 1, j).join('')); if (v != null && v < 100) return { n: 1900 + v, digits: false }; }
      return { n: 1900, digits: false };
    }
    return null;
  };

  // ================================================================ meeting the family; chapter 1: Bestellen
  const sauceArt = () => el => {
    const cv = WUI.art.mk(300, 150), c = cv.getContext('2d');
    SAUCE.forEach((s, i) => { const x = 50 + i * 100; WUI.art.rrect(c, x - 22, 30, 44, 92, 12); WUI.art.fillInk(c, s.col, 2.4); WUI.art.rrect(c, x - 10, 12, 20, 20, 4); WUI.art.fillInk(c, '#3d3f48', 2); c.fillStyle = INK; c.font = `800 13px ${SANS}`; c.textAlign = 'center'; c.fillText(['Kräuter', 'Knobi', 'scharf'][i], x, 140); });
    el.appendChild(cv);
  };
  const chOpen = n => { const c = CH[n - 1]; return !!(c && c.gate(flags())); };
  async function meet() {
    const st = S();
    await scene(async () => {
      rshot(...SHOT.wide); await wait(0.4);
      rshot(...SHOT.elif); await say(P('elif'), 'el.hi'); await say(P('elif'), 'el.homework');
      rshot(...SHOT.counter); await say(P('elif'), 'el.family');
      await say(P('kemal'), 'ke.hi');
      rshot(...SHOT.gulten); await say(P('gulten'), 'gu.hi');
      st.met = true;
    });
    if (!chOpen(1)) return;
    const go = await UI.choose('Elif: «Hast du Hunger?» (Are you hungry?)', [{ label: 'Chapter 1: Bestellen', sub: 'ordering a Döner like a pro', value: 1 }, { label: 'Later', value: 0 }]);
    if (go) await chapter1();
  }
  const MENU5 = ['doener', 'duerum', 'teller', 'box', 'ayran'];
  async function chapter1() {
    const st = S();
    await scene(async () => { rshot(...SHOT.elif); await say(P('elif'), 'el.order'); });
    const learn = MENU5.map(id => { const M0 = ITEM[id]; return { kind: 'New · type it to learn it', big: M0.art, gl: `“${esc(M0.en)}”`, art: icoArt(M0.icon), model: M0.art, keys: M0.keys, echo: true, voice: M0.art, note: id === 'ayran' ? 'Many people say «das Ayran» too.' : '' }; });
    const recall = WUI.shuffle(MENU5.slice()).map(id => { const M0 = ITEM[id]; return { kind: 'From memory · what’s this?', sit: 'Say it with its article (der, die, das)!', art: icoArt(M0.icon), model: M0.art, modelEn: M0.en, check: nounCheck(M0) }; });
    recall[0].say = ['Und jetzt ohne Hilfe! Was ist das?', 'And now without help! What’s this?'];
    const P1 = PHI['ph.dn.mitalles'], P2 = PHI['ph.dn.ohne'];
    const more = [
      { kind: 'New · counting portions', big: 'Einmal Döner, bitte.', gl: '“One Döner, please.”', note: '«einmal, zweimal, dreimal …» (once, twice…) is how you count portions at a counter.', echo: true, model: 'Einmal Döner, bitte.', keys: [['einmal', 'doner']], voice: 'Einmal Döner, bitte.' },
      { kind: 'New · the sauces', big: 'mit Kräutersoße', gl: '“with herb sauce”', note: 'The three classics: Kräutersoße (herbs and yogurt), Knoblauchsoße (garlic), and «scharf» (hot: colloquial for «mit scharfer Soße»).', art: sauceArt(), echo: true, model: 'mit Kräutersoße', keys: [['mit', 'krautersosse'], ['mit', 'krautersose'], ['mit', 'krauter']], voice: 'mit Kräutersoße' },
      { kind: 'New · the famous one', big: P1.de, gl: `“${esc(P1.en)}”`, note: esc(P1.note), art: icoArt('dnDoener'), echo: true, model: P1.de, keys: [['doner', 'alles', 'scharf'], ['doner', 'allem', 'scharf']], voice: P1.de },
      { kind: 'New · without', big: P2.de, gl: `“${esc(P2.en)}”`, note: esc(P2.note), echo: true, model: P2.de, keys: P2.keys, voice: P2.de },
    ];
    let r = await WUI.steps(learn.concat(recall, more), Object.assign({ intro: ['Das gibt es bei uns!', 'This is what we have!'] }, panel('elif', 'Döner bestellen', 'the menu')));
    if (r.quit) return;
    // the real thing: you at the counter, Kemal asks
    await scene(async () => { roomAt(SPOT.front.x, SPOT.front.z + 0.3, Math.PI); rshot(...SHOT.counter); await say(P('kemal'), 'ke.hi'); });
    r = await WUI.steps([
      { kind: 'At the counter', say: ['Was darf’s sein?', 'What can I get you?'], art: icoArt('dnDoener', 100), sit: 'Order one Döner with herb sauce.', model: 'Einmal Döner mit Kräutersoße, bitte!', check: orderCheck([[ITEM.doener.keys, 'the Döner'], [SAUCE[0].keys, 'the herb sauce']], 'Einmal Döner mit Kräutersoße, bitte!') },
      { kind: 'At the counter', say: ['Mit Zwiebeln?', 'With onions?'], sit: 'You don’t want onions.', model: 'Ohne Zwiebeln, bitte.', check: anyCheck(P2.keys, '«Ohne Zwiebeln, bitte.»') },
      { kind: 'At the counter', say: ['Hier essen oder zum Mitnehmen?', 'Eat here or take away?'], sit: 'Choose: eat here («hier essen») or take it with you («zum Mitnehmen»).', model: 'Zum Mitnehmen, bitte.', check: anyCheck(['zum mitnehmen', 'mitnehmen', 'hier essen', 'zum hier essen', 'zum hieressen'], '«Zum Mitnehmen, bitte.» or «Hier essen.»') },
      { kind: 'At the counter', say: ['Und zu trinken?', 'And to drink?'], art: icoArt('dnAyran', 100), sit: 'Order an Ayran.', model: 'Ein Ayran, bitte!', check: orderCheck([[ITEM.ayran.keys, 'the Ayran']], 'Ein Ayran, bitte!') },
      { kind: 'At the counter', say: [`Und für ${mimo()}?`, `And for ${mimo()}?`], art: icoArt('dnBox', 100), sit: `${esc(mimo())} points at the fries. Order a Döner box.`, model: `Eine Döner-Box für ${mimo()}, bitte!`, check: orderCheck([[ITEM.box.keys, 'the Döner box']], `Eine Döner-Box für ${mimo()}, bitte!`) },
      { kind: 'New · paying', say: ['Das macht fünfzehn Euro fünfzig.', 'That comes to fifteen euros fifty.'], big: 'Stimmt so!', gl: '“Keep the change!”', note: esc(PHI['ph.dn.stimmtso'].note), sit: 'You hand him 16 euros. Let him keep the change.', echo: true, model: 'Hier, bitte. Stimmt so!', keys: PHI['ph.dn.stimmtso'].keys },
      { kind: 'New · a little Berlin', say: ['Danke! Allet jut?', 'Thanks! All good?'], big: 'Allet jut!', gl: '“All good!” (Berlin dialect)', note: esc(PHI['ph.dn.allet'].note), echo: true, model: 'Allet jut!', keys: PHI['ph.dn.allet'].keys },
    ], panel('kemal', 'Bei Yıldız', 'ordering, for real'));
    if (r.quit) return;
    ['ph.dn.mitalles', 'ph.dn.ohne', 'ph.dn.mitnehmen', 'ph.dn.stimmtso', 'ph.dn.allet'].forEach(teach);
    await scene(async () => { rshot(...SHOT.counter); sfx('chest'); mimoHappy(2.2); await say(P('kemal'), 'ke.allet'); rshot(...SHOT.elif); P('elif').pose = 'cheer'; await say(P('elif'), 'el.done1'); P('elif').pose = 'cards'; });
    st.ch[1] = true; coins(4, 'Elif’s tip for a Döner pro');
  }

  // ================================================================ chapter 2: An der Theke (the lunch rush)
  const custFor = C0 => P('c-' + C0.id) || person('c-' + C0.id, C0.name, C0.look);
  const menuArt = el => { const cv = WUI.art.mk(520, 300); menuDraw(cv.getContext('2d'), 520, 300, { wide: true }); cv.style.maxWidth = '100%'; el.appendChild(cv); };
  async function chapter2() {
    const st = S();
    await scene(async () => { rshot(...SHOT.counter); await say(P('kemal'), 'ke.rush'); await say(P('kemal'), 'ke.how'); });
    let quit = false;
    roomAt(SPOT.behind.x, SPOT.behind.z, 0);
    try {
      for (let i = st.rush || 0; i < RUSH.length; i++) {
        const C0 = RUSH[i], cu = custFor(C0);
        put(cu, SPOT.front.x - 0.8, SPOT.front.z + 0.1, Math.PI);
        await scene(async () => { rshot(...SHOT.till); sfx('wood'); await wait(0.3); await sayRaw(cu, C0.say[0], C0.say[1]); });
        const r = await WUI.steps([
          { kind: `${C0.name} orders`, say: C0.say, sit: 'Tell Kemal the order: everything they said.', model: C0.model, check: repeatCheck(C0), placeholder: 'the order, for Kemal…' },
          { kind: 'The price', say: ['Und was macht das?', 'And what does that come to?'], art: menuArt, sit: `Add it up from the menu and tell ${esc(C0.name)}: «Das macht … Euro.»`, model: `Das macht ${WUI.euroWords(C0.cents)}.`, check: priceCheck(C0.cents, { frame: ['das macht', 'macht'], frameNote: 'how sellers say it: «Das macht … Euro.»' }) },
        ], panel('kemal', 'An der Theke', `the lunch rush · ${i + 1} of ${RUSH.length}`));
        if (r.quit) { quit = true; break; }
        await scene(async () => { rshot(...SHOT.till); await say(P('kemal'), 'ke.sofort'); sfx('chest'); if (C0.kolay) await sayRaw(cu, 'Danke! Kolay gelsin!', 'Thanks! «Kolay gelsin!» (may your work go easy)'); else await sayRaw(cu, 'Danke! Tschüss!', 'Thanks! Bye!'); });
        cu.root.visible = false; cu.hidden = true; st.rush = i + 1;
      }
    } finally { roomAt(SPOT.front.x, SPOT.front.z + 1.4, Math.PI); }
    if (quit) return;
    await scene(async () => { rshot(...SHOT.elif); await say(P('elif'), 'el.kolay'); });
    const K1 = PHI['ph.dn.kolay'], K2 = PHI['ph.dn.sofort'];
    const r = await WUI.steps([
      { kind: 'New · a Turkish phrase', big: K1.de, gl: `“${esc(K1.en)}”`, note: esc(K1.note), echo: true, model: K1.de, keys: K1.keys, voice: K1.de },
      { kind: 'Your turn', sit: 'Kemal wipes his forehead at the grill. Wish him an easy shift!', model: K1.de, keys: K1.keys },
      { kind: 'New · behind the counter', big: K2.de, gl: `“${esc(K2.en)}”`, note: 'Kemal says it after every order.', echo: true, model: K2.de, keys: K2.keys, voice: K2.de },
    ], panel('elif', 'Kolay gelsin!', 'a phrase for anyone at work'));
    if (r.quit) return;
    ['ph.dn.kolay', 'ph.dn.sofort'].forEach(teach);
    await scene(async () => { rshot(...SHOT.counter); P('kemal').pose = 'cheer'; await say(P('kemal'), 'ke.done2'); P('kemal').pose = 'idle'; });
    st.ch[2] = true; coins(8, 'Kemal pays his helper');
  }

  // ================================================================ chapter 3: Wörter, die reisen; Babaanne's story
  const yearCheck = y => t => {
    const v = numberIn(t); if (!v) return { ok: false, why: `Years go in hundreds: 1964 is «neunzehnhundert…»` };
    if (v.n !== y) return { ok: false, why: 'Listen to her again: what year?' };
    return v.digits ? { ok: true, grade: 'B', note: `in words: «neunzehnhundert${WUI.numWords(y - 1900)}»` } : { ok: true };
  };
  const photoArt = kind => el => { const cv = WUI.art.mk(320, 250); photoDraw(cv.getContext('2d'), kind, 320, 250); el.appendChild(cv); };
  async function chapter3() {
    const st = S();
    if (!st.words) {
      await scene(async () => { rshot(...SHOT.elif); await say(P('elif'), 'el.words'); await say(P('elif'), 'el.abi'); });
      const items = WORDS.map(id => PHI[id]);
      const learn = items.filter(p => p.id !== 'ph.dn.kolay').map(p => ({ kind: 'New · a word that travels', big: p.de, gl: `“${esc(p.en)}”`, note: esc(p.note), echo: true, model: p.de, keys: p.keys, voice: p.de }));
      const A0 = PHI['ph.dn.abi'];
      learn.push({ kind: 'Two meanings', big: 'das Abi', gl: `“${esc(A0.en)}”`, note: esc(A0.note), echo: true, model: 'das Abi', keys: [['abi']], voice: 'das Abi' });
      const rec = WUI.shuffle(items.slice()).map(p => ({ kind: 'From memory · what do you say?', sit: esc(p.sit), model: p.de, modelEn: p.en, keys: p.keys }));
      rec[0].say = ['Und jetzt du! Ohne Hilfe.', 'Now you! Without help.'];
      const r = await WUI.steps(learn.concat(rec), panel('elif', 'Wörter, die reisen', 'Turkish words in German'));
      if (r.quit) return;
      WORDS.concat(['ph.dn.abi']).forEach(teach); st.words = true;
    }
    if (!st.kiez) {
      await scene(async () => { rshot(...SHOT.elif); await say(P('elif'), 'el.kiez'); await say(P('elif'), 'el.kiez2'); });
      const steps = KIEZ.map(K0 => ({ kind: 'Kiezdeutsch → Hochdeutsch', say: [K0.kiez, K0.en], big: K0.kiez, sit: 'Say it in standard German (Hochdeutsch), the way you would at school.', model: K0.std, modelEn: K0.en,
        check: t => { const h = has(t, K0.keys); return h.ok ? { ok: true, minor: h.typo } : { ok: false, why: esc(K0.why) }; } }));
      steps.push({ kind: 'German words from Turkish', say: ['Und andersrum: Manche deutschen Wörter kommen aus dem Türkischen!', 'And the other way round: some German words come from Turkish!'], art: row('dnAyran'), sit: 'The creamy milk food from Turkish «yoğurt» is called in German…?', model: 'der Joghurt', keys: ['joghurt', 'jogurt', 'yoghurt', 'joghurth'] });
      steps.push({ kind: 'German words from Turkish', sit: 'And the little shop for newspapers and sweets, from Turkish «köşk» (a pavilion)?', model: 'der Kiosk', keys: ['kiosk'] });
      steps.push({ kind: 'Where «Döner» comes from', say: ['«Döner» kommt von «dönmek»: drehen. Guck mal, der Spieß!', '«Döner» comes from Turkish «dönmek»: to turn. Look at the spit!'], sit: 'What does the spit do? «Der Spieß …» (drehen: to turn; it turns itself: «dreht sich»)', model: 'Der Spieß dreht sich.', modelEn: 'The spit turns.', check: t => has(t, ['dreht sich', 'dreht']).ok ? (has(t, ['dreht sich']).ok ? { ok: true } : { ok: true, minor: true, note: 'it turns itself: «dreht sich»' }) : { ok: false, why: '«drehen», for the spit: «Der Spieß dreht sich.»' } });
      const LZ = PHI['ph.dn.lassma'];
      steps.push({ kind: 'New · Kiezdeutsch, with friends', big: LZ.de, gl: `“${esc(LZ.en)}”`, note: esc(LZ.note), echo: true, model: LZ.de, keys: LZ.keys, voice: LZ.de });
      const r = await WUI.steps(steps, panel('elif', 'Kiezdeutsch', 'with friends, at school, at home'));
      if (r.quit) return;
      teach('ph.dn.lassma'); st.kiez = true;
    }
    await scene(async () => { rshot(...SHOT.gulten); await say(P('elif'), 'el.story'); await say(P('gulten'), 'gu.yes'); rshot(...SHOT.photos); await wait(0.6); });
    const steps = [{ kind: 'Babaanne’s story', say: ['1961 haben Deutschland und die Türkei einen Vertrag unterschrieben. Deutschland brauchte Arbeiter.', 'In 1961 West Germany and Turkey signed an agreement. Germany needed workers.'], art: photoArt('train'),
      big: 'der Gastarbeiter', gl: '“guest worker”', note: 'That’s what the people who came to work were called: «Gastarbeiter». Many thought they would stay a few years. Many stayed for good.', echo: true, model: 'Gastarbeiter', keys: ['gastarbeiter', 'gastarbeiterin'], voice: 'Gastarbeiter' }];
    for (const Ph of STORY_PHOTOS) steps.push({ kind: 'Babaanne’s story', say: Ph.say, art: photoArt(Ph.pic), sit: esc(Ph.q), model: Ph.model, check: Ph.year ? yearCheck(Ph.year) : anyCheck(Ph.keys, `Listen to her again: «${esc(Ph.say[0])}»`) });
    const r = await WUI.steps(steps, panel('gulten', 'Babaannes Geschichte', 'the photo wall'));
    if (r.quit) return;
    await scene(async () => { rshot(...SHOT.gulten); await say(P('gulten'), 'gu.end'); await say(P('gulten'), 'gu.end2'); });
    st.ch[3] = true; coins(6, 'Babaanne presses a coin into your hand');
  }

  // ================================================================ chapter 4: Familie (Elif's Abitur party)
  function familyDraw(c, W, H) {
    c.fillStyle = '#fff4dc'; c.fillRect(0, 0, W, H); c.strokeStyle = '#8b5a2b'; c.lineWidth = 8; c.strokeRect(4, 4, W - 8, H - 8);
    const F = [['Kemal', '#fbfbf6', '#2b2235', 1.0], ['Selin', '#4fa3a5', '#3a2b26', 0.95], ['Elif', '#7a4f8f', '#2b2235', 0.9], ['Gülten', '#8a4f7d', '#e8e4dc', 0.85]];
    F.forEach(([n, shirt, hair, s], i) => {
      const x = 52 + i * 85, y = 150;
      c.fillStyle = shirt; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - 24 * s, y + 30); c.quadraticCurveTo(x - 26 * s, y - 20 * s, x, y - 22 * s); c.quadraticCurveTo(x + 26 * s, y - 20 * s, x + 24 * s, y + 30); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = i === 3 ? '#e0b088' : '#d9a37a'; c.beginPath(); c.arc(x, y - 44 * s, 20 * s, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = hair; c.beginPath(); c.arc(x, y - 50 * s, 20 * s, Math.PI, TAU); c.fill(); if (i === 3) { c.beginPath(); c.arc(x, y - 70 * s, 8, 0, TAU); c.fill(); }
      c.fillStyle = INK; [-6, 6].forEach(d => { c.beginPath(); c.arc(x + d * s, y - 44 * s, 2.4, 0, TAU); c.fill(); });
      c.font = `800 17px ${SANS}`; c.textAlign = 'center'; c.fillText(n, x, y + 52);
    });
  }
  const famArt = el => { const cv = WUI.art.mk(360, 220); familyDraw(cv.getContext('2d'), 360, 220); el.appendChild(cv); };
  const famCheck = F0 => t => {
    if (!has(t, F0.keys).ok) return { ok: false, why: `Look at the family again: «${esc(F0.model)}»` };
    if (has(t, ['elifs', 'gultens', 'von elif', 'von gulten']).ok) return { ok: true, minor: !has(t, ['elifs', 'gultens']).ok, note: has(t, ['elifs', 'gultens']).ok ? '' : 'shorter with an -s: «Elifs …»' };
    return { ok: true, minor: true, note: `whose? «${esc(F0.model)}»` };
  };
  const rhymeCheck = Q => t => {
    const T = toks(t), w = WUI.canon(Q.word);
    if (!T.some(x => x === w || (w.length >= 5 && WUI.lev(x, w) <= 1))) return { ok: false, why: `What rhymes with «${esc(Q.a.split(' ').pop().replace(/[,.!?„“"]/g, ''))}»?` };
    return { ok: true, said: Q.b.replace('___', Q.word) };
  };
  function partyOn() {
    const se = P('selin'); put(se, 1.0, 2.9, 0.6);
    if (!R.party) {
      const g = new THREE.Group(), k = ZHF.Kit();
      for (const T of TABLES.slice(0, 2)) {
        k.cyl(T.x - 0.18, 0.79, T.z, 0.17, 0.02, '#fffaf0', { ink: 0.004 }).cyl(T.x + 0.18, 0.79, T.z, 0.17, 0.02, '#fffaf0', { ink: 0.004 });
        k.add(ZHF.GEO.tor, '#c47a3a', T.x - 0.18, 0.82, T.z, 0.1, 0.1, 0.5, HALF, 0, 0, { ink: 0.003 }).box(T.x + 0.18, 0.83, T.z, 0.2, 0.05, 0.14, '#e9b84a', { ink: 0.004 });
        for (let i = 0; i < 3; i++) k.cyl(T.x - 0.05 + i * 0.07, 0.81, T.z + 0.22, 0.03, 0.01, '#a8322a', { ink: 0 });
        k.add(TULIP, '#c2551e', T.x, 0.78, T.z - 0.25, 1, 1, 1, 0, 0, 0, { ink: 0 });
      }
      ZHF.bake(g, k); g.position.set(X0, Y0, Z0); R.actors.add(g); R.party = g;
    }
    R.party.visible = true;
  }
  function partyOff() { const se = P('selin'); if (se) { se.root.visible = false; se.hidden = true; } if (R && R.party) R.party.visible = false; }
  async function chapter4() {
    const st = S();
    partyOn();
    try {
      await scene(async () => { rshot(...SHOT.wide); P('elif').pose = 'cheer'; sfx('fanfare'); await say(P('elif'), 'el.abi2'); P('elif').pose = 'cards'; rshot(...SHOT.counter); await say(P('kemal'), 'ke.proud'); rshot([2.4, 1.9, 4.6], [1.0, 1.25, 2.9]); await say(P('selin'), 'se.hi'); rshot(...SHOT.gulten); await say(P('gulten'), 'gu.food'); });
      let r = await WUI.steps(FAMILY.map((F0, i) => ({ kind: 'The family', say: i === 0 ? ['Kennst du schon alle? Das ist meine Familie!', 'Do you know everyone yet? This is my family!'] : null, art: famArt, sit: esc(F0.q) + ' (the -s says whose: «Elifs Vater», Elif’s father)', model: F0.model, modelEn: F0.en, check: famCheck(F0) })), panel('elif', 'Meine Familie', 'who is who'));
      if (r.quit) return;
      const E1 = PHI['ph.dn.elinize'], E2 = PHI['ph.dn.afiyet'];
      const steps = FOOD.map(f => ({ kind: 'New · on the table', big: f.de, gl: `“${esc(f.en)}”`, art: icoArt(f.icon), echo: true, model: f.de, keys: f.keys, voice: f.de }));
      steps.push({ kind: 'At the table', say: ['Möchtest du noch einen Çay?', 'Would you like another çay?'], art: icoArt('dnCay'), sit: 'Yes, please! Ask for a çay.', model: 'Ja, gerne! Ein Çay, bitte.', keys: [['cay'], ['chai'], ['tschai'], ['gerne'], ['ja bitte']] });
      steps.push({ kind: 'New · thanking the cook', say: ['Der Börek ist von Babaanne!', 'The börek is Babaanne’s!'], art: icoArt('dnBoerek'), big: E1.de, gl: `“${esc(E1.en)}”`, note: esc(E1.note), echo: true, model: E1.de, keys: E1.keys, voice: E1.de });
      steps.push({ kind: 'Your turn', sit: 'Kemal fried the sucuk with eggs. Thank him the Turkish way!', model: E1.de, keys: E1.keys });
      steps.push({ kind: 'Your turn', sit: 'Selin brings the baklava to the table. Wish everyone a good meal, in Turkish!', model: E2.de, keys: E2.keys });
      r = await WUI.steps(steps, panel('gulten', 'Das Festessen', 'the party table'));
      if (r.quit) return;
      ['ph.dn.elinize', 'ph.dn.cay'].forEach(teach);
      await scene(async () => { rshot(...SHOT.elif); await say(P('elif'), 'el.identity'); await say(P('elif'), 'el.rap'); });
      r = await WUI.steps(RAP.map((Q, i) => ({ kind: `Elif’s rap · line ${i + 1} of 4`, say: ['🎤 ' + Q.a, Q.en], big: Q.b, sit: 'Find the rhyme, and say the whole second line!', model: Q.b.replace('___', Q.word), modelEn: Q.en, check: rhymeCheck(Q) })), panel('elif', 'Elifs Rap', 'you find the rhymes'));
      if (r.quit) return;
      await scene(async () => {
        rshot(...SHOT.counter); await say(P('kemal'), 'ke.cap');
        st.cap = true; st.capOff = false; if (G.state.wm) G.state.wm.hatOff = true; if (G.state.adolf && G.state.adolf.cap) G.state.adolf.capOn = false;
        mimoBits(); if (CAP) CAP.visible = true;
        const M = G.sim.mimo; mimoHappy(2.4); sparkle(M.x, M.ry + 0.9, M.z, 16, ['#c8322a', '#ffd23f'], 'learned');
        UI.toast(`${mimo()} wears the Yıldız Grill cap!`);
      });
      st.ch[4] = true; coins(8, 'A party bag from the Yıldız family');
    } finally { partyOff(); }
  }

  // ================================================================ chapter 5: Die Nacht der Stille (the match night)
  Object.assign(LT, {
    'el.still': L('Aber guck mal: Alle sitzen nur da. Keiner redet. Und Baba starrt auf den kalten Grill.', 'But look: everyone just sits there. Nobody talks. And Baba stares at the cold grill.'),
    'el.grill': L('Sag Baba, er soll den Grill anmachen. Los!', 'Tell Baba to switch the grill on. Go on!'),
    'ke.quiet': L('Was … darf’s … sein?', 'What… can I… get you?'),
    'el.tv': L('Gleich ist Anpfiff! Und der Fernseher ist noch aus!', 'Kick-off any second! And the TV is still off!'),
    'bruno.who': L('Und du? Für wen bist du eigentlich?', 'And you? Who are you rooting for, anyway?'),
    'ke.diplo': L('Ha! Diplomatisch! Genau wie meine Mutter.', 'Ha! Diplomatic! Just like my mother.'),
    'gu.hadi': L('Hadi! Hadi! Tooor!', 'Come on! Come on! Goal!'),
    'marta.half': L('Halbzeit! Und ich hab Kuchen mitgebracht!', 'Half-time! And I brought cake!'),
    'kalle.sigh': L('Zwei zu eins für die Türkei … Na ja.', 'Two–one to Turkey… oh well.'),
    'el.late': L('Neunzigste Minute! Jetzt oder nie!', 'Ninetieth minute! Now or never!'),
    'el.final': L('Abpfiff! Und? Wer hat gewonnen?', 'Final whistle! So? Who won?'),
    'el.gone': L('Hörst du das? Alle reden, alle lachen. Die Stille ist weg!', 'Hear that? Everyone’s talking, everyone’s laughing. The Hush is gone!'),
    'el.idle4': L('Babaanne sagt immer: «Wer Çay trinkt, hat Zeit.» Ich hab nie Zeit. Ich trink trotzdem Çay.', 'Babaanne always says: «Whoever drinks çay has time.» I never have time. I drink çay anyway.'),
    'el.idle5': L('Im Herbst fange ich mit dem Medizinstudium an. Und am Wochenende: Rap!', 'In the autumn I start studying medicine. And at weekends: rap!'),
    'ke.idle3': L('Meine Eltern hatten einen Imbiss in Berlin. Jetzt hab ich einen in Alba. Und Elif? Mal sehen!', 'My parents had a snack bar in Berlin. Now I have one in Alba. And Elif? We’ll see!'),
  });
  // the invitations (outdoors): who, where, how they greet you; Oma Rosa gets «Sie» (as at Fiete's market)
  const INV = [
    { id: 'bruno', name: 'Bruno', where: 'npc:bruno', npc: 'bruno', reply: 'bruno.inv', hi: ['Na? Was gibt’s?', 'Hey! What’s up?'] },
    { id: 'adi', name: 'Adi', where: 'adolf:adi', reply: 'adi.inv', hi: ['Post für dich? Nee, heute nicht. Was gibt’s?', 'Post for you? Nope, not today. What’s up?'] },
    { id: 'marta', name: 'Marta', where: 'npc:baker', npc: 'baker', reply: 'marta.inv', hi: ['Hallo! Brot? Brötchen?', 'Hello! Bread? Rolls?'] },
    { id: 'rosa', name: 'Oma Rosa', where: 'npc:rosa', npc: 'rosa', sie: true, reply: 'rosa.inv', hi: ['Ach, hallo! Wie schön, dich zu sehen.', 'Oh, hello! How lovely to see you.'] },
  ];
  const invited = () => INV.filter(I => S().inv[I.id]).length;
  const allInvited = () => invited() >= INV.length;
  const inviteCheck = I => t => {
    if (!has(t, ['fussball', 'fussballspiel', 'spiel', 'match', 'public viewing', 'landerspiel']).ok) return { ok: false, why: 'Say what’s on tonight: «Fußball»!' };
    const sie = has(t, ['kommen sie', 'sie kommen', 'haben sie', 'wollen sie', 'mochten sie']).ok, du = has(t, ['kommst du', 'kommst', 'komm', 'hast du', 'willst du', 'bist du']).ok;
    if (I.sie && du && !sie) return { ok: true, grade: 'B', note: `${esc(I.name)} is older: politely, «Kommen Sie?»` };
    if (!I.sie && sie && !du) return { ok: true, minor: true, note: `${esc(I.name)} is a friend: «Kommst du?» is fine` };
    if (!has(t, ['yildiz', 'bei uns', 'heute abend', 'heute']).ok) return { ok: true, minor: true, note: 'say when and where: «Heute Abend … bei Yıldız!»' };
    return { ok: true };
  };
  async function invite(I) {
    const st = S(), p = who(I.where); if (!p || st.inv[I.id]) return;
    const T = talker(p, I.name, NPC_TOP[I.npc] || p.top);
    await scene(async () => { shotAt(p, 3.0); await sayRaw(T, I.hi[0], I.hi[1]); });
    const model = I.sie ? 'Heute Abend Fußball bei Yıldız! Kommen Sie?' : 'Heute Abend Fußball bei Yıldız! Kommst du?';
    const r = await WUI.steps([{ kind: `Invite ${esc(I.name)}`, sit: `Invite ${esc(I.name)} to watch the match tonight at the Yıldız Grill.${I.sie ? ` ${esc(I.name)} is older than you: politely, with «Sie».` : ''}`, model, modelEn: 'Football tonight at Yıldız! Are you coming?', check: inviteCheck(I) }],
      panel('elif', 'Die Einladung', `invite Alba to the match · ${invited()} of ${INV.length} so far`));
    if (r.quit) return;
    st.inv[I.id] = true;
    await scene(async () => { shotAt(p, 3.0); await say(T, I.reply); });
    if (allInvited()) think('Everyone’s coming! Back to the Yıldız Grill: tell Elif.', 4.5); else UI.toast(`Invited to the match: ${invited()} of ${INV.length}`);
    if (G.save) G.save();
  }
  // the poses for the shop's mood (the Hush, or an ordinary day)
  function familyPose() {
    if (!R) return;
    const q = hushed() && !MATCH.lit, ke = P('kemal'), el = P('elif'), gu = P('gulten');
    if (ke) ke.pose = q ? 'sulk' : 'idle'; if (el) el.pose = q ? 'think' : 'cards'; if (gu) gu.pose = q ? 'sulk' : 'cards';
  }
  async function quietScene() {
    const st = S();
    familyPose();
    await scene(async () => {
      rshot(...SHOT.wide); await wait(1.0);
      rshot(...SHOT.elif); await say(P('elif'), 'el.quiet');
      rshot(...SHOT.counter); await wait(0.8);
      rshot(...SHOT.elif); await say(P('elif'), 'el.hush');
      P('elif').pose = 'point'; await say(P('elif'), 'el.plan'); await say(P('elif'), 'el.invite'); P('elif').pose = 'think';
    });
    st.l5 = true; if (G.save) G.save();
    think('Invite Bruno, Adi, Marta and Oma Rosa: «Heute Abend Fußball bei Yıldız!»', 5);
  }
  async function invReminder() {
    const left = INV.filter(I => !S().inv[I.id]).map(I => I.name);
    await scene(async () => { rshot(...SHOT.elif); await say(P('elif'), 'el.invite'); });
    think(`Still to invite: ${left.join(', ')}.`, 4);
  }
  // ---------------- the Hush in the shop: a grey cloud with pale eyes, under the ceiling
  const CL = { g: null, mat: null, v: 0 };
  function cloud() {
    if (CL.g || !R) return CL.g;
    const g = new THREE.Group(), geo = new THREE.SphereGeometry(1, 14, 10);
    const mat = new THREE.MeshBasicMaterial({ color: '#5a5670', transparent: true, opacity: 0.5, depthWrite: false });
    for (const [x, y, z, s] of [[0, 0, 0, 1.0], [-1.3, -0.1, 0.4, 0.8], [1.3, -0.05, -0.3, 0.85], [-0.6, 0.15, -0.9, 0.7], [0.7, 0.2, 0.9, 0.75], [-2.4, -0.2, -0.2, 0.6], [2.3, -0.15, 0.5, 0.6]]) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(s * 1.1, s * 0.55, s); m.renderOrder = 4; g.add(m); }
    const em = new THREE.MeshBasicMaterial({ color: '#e8e4f0', transparent: true, opacity: 0.85, depthWrite: false });
    for (const sx of [-0.3, 0.3]) { const e = new THREE.Mesh(geo, em); e.position.set(sx, -0.02, 1.04); e.scale.set(0.09, 0.14, 0.04); e.renderOrder = 5; g.add(e); }
    g.position.set(0.8, 3.0, 0.4); g.visible = false; R.g.add(g); CL.g = g; CL.mat = mat; CL.em = em; return g;
  }
  function cloudTick(dt, t, k) {
    CL.v = damp(CL.v, k, 2.5, dt); if (CL.v < 0.003) CL.v = 0;
    if (!CL.v && !CL.g) return;
    const g = cloud(); if (!g) return;
    g.visible = CL.v > 0.02; if (!g.visible) return;
    g.scale.setScalar(0.35 + 0.65 * CL.v); g.position.y = 3.0 + Math.sin(t * 0.8) * 0.06; g.rotation.y = Math.sin(t * 0.3) * 0.15;
    CL.mat.opacity = 0.5 * Math.min(1, CL.v * 1.5); CL.em.opacity = 0.85 * Math.min(1, CL.v * 1.5);
  }
  // ---------------- the match night: who comes (a rig each; Hilde and Rosa sit), where they stand, the shots
  const CROWD = [
    { id: 'c-bruno', rush: 0, at: [2.5, -0.9] }, { id: 'c-adi', rush: 1, at: [3.2, 2.8] }, { id: 'c-lucas', rush: 2, at: [5.6, 1.8] }, { id: 'c-vera', rush: 3, at: [5.0, 2.9] }, { id: 'c-otto', rush: 4, at: [1.9, 3.5] },
    { id: 'kalle', name: 'Kalle', look: { skin: '#f5cda2', hair: '#d9772e', shirt: '#4f9a5a', sleeve: '#4f9a5a', pants: '#34508c' }, at: [2.0, -0.15] },
    { id: 'hilde', name: 'Hilde', look: { skin: '#f0c7a0', hair: '#f4f1ea', shirt: '#b8a0d8', sleeve: '#b8a0d8', pants: '#4a3f5a', glasses: true, old: true }, at: [0.98, 1.7], sit: 0.47 },
    { id: 'marta', name: 'Marta', look: { skin: '#e6b48c', hair: '#3a2b26', shirt: '#f2e6d0', sleeve: '#f2e6d0', pants: '#3f3a35', apron: '#ffffff', hat: 'beanie', hatCol: '#ffffff', wide: 1.1 }, at: [-0.5, 3.1] },
    { id: 'rosa', name: 'Oma Rosa', look: { skin: '#efc29a', hair: '#f4f1ea', shirt: '#8a4f7d', sleeve: '#8a4f7d', pants: '#5a3f55', apron: '#fbf6ee', glasses: true, old: true }, at: [3.68, 0.5], sit: 0.47 },
  ];
  const YOU5 = { x: -1.6, z: 3.9 };
  const SH5 = { wide: [[-4.4, 3.0, 4.4], [3.0, 1.2, 0.0]], grill: [[-0.6, 2.2, 0.4], [-3.0, 1.3, -3.6]], tv: [[3.6, 2.5, 1.6], [6.3, 2.3, -0.6]], crowd: [[5.8, 2.3, -0.3], [0.8, 1.1, 2.2]], bruno: [[4.4, 1.9, -0.2], [2.5, 1.5, -0.9]] };
  function matchOn() {
    Object.assign(MATCH, { on: false, lit: false, de: 0, tr: 0, min: 0, hush: 1, night: true });
    const tv = { x: X0 + SPOT.tv.x, z: Z0 + SPOT.tv.z };
    for (const C0 of CROWD) {
      const p = C0.rush !== undefined ? custFor(RUSH[C0.rush]) : P(C0.id) || person(C0.id, C0.name, C0.look, C0.sit ? { sit: true, seatY: C0.sit } : {});
      put(p, C0.at[0], C0.at[1], C0.sit ? HALF : 0); p.faceAt = C0.sit ? null : tv; p.pose = 'idle'; p.talking = false;
    }
    const se = P('selin'); put(se, 4.5, -1.1, 0); se.faceAt = tv;
    roomAt(YOU5.x, YOU5.z, Math.atan2(SPOT.tv.x - YOU5.x, SPOT.tv.z - YOU5.z));
    familyPose();
  }
  function matchOff() {
    Object.assign(MATCH, { on: false, lit: false, hush: 0, night: false });
    for (const C0 of CROWD) { const p = P(C0.id); if (p) { p.root.visible = false; p.hidden = true; p.faceAt = null; p.talking = false; p.pose = 'idle'; } }
    const se = P('selin'); if (se) { se.root.visible = false; se.hidden = true; se.faceAt = null; }
    familyPose();
  }
  // the crowd reacts (cheer, groan), then settles; the Hush shrinks a little
  const crowdDo = (pose, s = 1.8, ids) => {
    const L0 = CROWD.map(C0 => P(C0.id)).filter((p, i) => p && p.root.visible && (!ids || ids.includes(CROWD[i].id)));
    L0.forEach(p => { p.pose = pose; p.talking = true; });
    wait(s).then(() => L0.forEach(p => { if (p.pose === pose) p.pose = 'idle'; p.talking = false; }));
  };
  const calm = d => { MATCH.hush = Math.max(0, MATCH.hush - d); };
  function hudAside(on) { const el = document.getElementById('wmhud'); if (el) el.style.visibility = on ? 'hidden' : ''; Input.typing = !on; if (G) G.state.teaching = !on; }
  async function sayHud(p, key, raw) { const open = WUI.hud.isOpen; if (open) hudAside(true); try { if (raw) await sayRaw(p, raw[0], raw[1]); else await say(p, key); } finally { if (open) hudAside(false); } }
  // checks: «Mach … an!» (anmachen comes apart), ten Döner, Tor, both teams, Hadi, Afiyet olsun, a draw
  const onCheck = (keys, what) => t => {
    const T = toks(t);
    if (!has(t, keys).ok) return { ok: false, why: `What should be switched on? «${what}»` };
    if (has(t, ['anmachen', 'einschalten', 'anschalten']).ok) return { ok: true, minor: true, note: `as a command, the «an» goes to the end: «Mach ${what} an!»` };
    if (!has(t, ['mach', 'mache', 'machen', 'macht', 'schalt', 'schalte', 'schaltet']).ok) return { ok: false, why: `«anmachen» (to switch on), as a command: «Mach ${what} an!»` };
    if (!T.includes('an') && !T.includes('ein')) return { ok: true, minor: true, note: `anmachen comes apart: «Mach ${what} an!»` };
    return { ok: true };
  };
  const tenCheck = t => {
    if (!has(t, ['doner']).ok) return { ok: false, why: 'Ten what? «Zehnmal Döner …»' };
    if (has(t, ['zehnmal', 'zehn mal', 'zehn']).ok) return has(t, ['mit alles', 'mit allem', 'alles']).ok ? { ok: true } : { ok: true, minor: true, note: 'with everything: «… mit alles!»' };
    if (/\b10\s*(?:mal|x)?\b/i.test(String(t))) return { ok: true, grade: 'B', note: 'in words: «zehnmal»' };
    return { ok: false, why: 'For the whole shop: ten! «zehnmal»' };
  };
  const torCheck = t => (toks(t).some(w => /^to+r+$/.test(w)) ? { ok: true } : { ok: false, why: 'Shout «Tor!» (goal!), as long as you like: «Toooor!»' });
  const beideCheck = t => {
    if (has(t, ['beide', 'beiden']).ok) return has(t, ['fur beide', 'fur beiden']).ok ? { ok: true } : { ok: true, minor: true, note: 'the whole sentence: «Ich bin für beide!»' };
    if (has(t, ['deutschland', 'turkei']).ok) return { ok: false, why: 'Careful: Kemal and Babaanne are both listening… «Ich bin für beide!»' };
    return { ok: false, why: '«für» + the team: «Ich bin für …» Germany? Turkey? Both!' };
  };
  const hadiCheck = t => (has(t, ['hadi', 'haydi']).ok ? { ok: true } : torCheck(t).ok ? { ok: true, minor: true, note: 'Babaanne’s way: «Hadi! Hadi!»' } : { ok: false, why: 'Cheer like Babaanne: «Hadi!» (come on!)' });
  const afiyetCheck = t => (has(t, ['afiyet olsun', 'afiyet']).ok ? { ok: true } : has(t, ['guten appetit', 'mahlzeit']).ok ? { ok: true, minor: true, note: 'the Turkish way: «Afiyet olsun!»' } : { ok: false, why: 'The Turkish «Guten Appetit»: «Afiyet olsun!»' });
  const drawCheck = t => (has(t, ['unentschieden']).ok ? { ok: true } : has(t, ['beide', 'keiner', 'niemand', 'zwei zu zwei', 'zwei zwei']).ok || /2\s*(?::|-|zu)\s*2/i.test(String(t)) ? { ok: true, minor: true, note: 'a draw is «unentschieden»' } : { ok: false, why: 'Nobody won: it’s a draw, «unentschieden»!' });
  const ball = (c, s) => { c.fillStyle = '#3f9a4a'; c.fillRect(0, 0, s, s); c.fillStyle = '#fff'; c.beginPath(); c.arc(s / 2, s / 2, s * 0.32, 0, TAU); c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); c.fillStyle = INK; c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; c.lineTo(s / 2 + Math.cos(a) * s * 0.12, s / 2 + Math.sin(a) * s * 0.12); } c.closePath(); c.fill(); };
  async function chapter5() {
    const st = S(); let quit = false; const grades = [];
    const go = async p => { const g = await p; if (g === 'quit') { quit = true; return null; } grades.push(g); return g; };
    const M = () => G.sim.mimo, cheerMimo = () => { mimoHappy(2.2); const m = M(); if (m) sparkle(m.x, m.ry + 0.8, m.z, 8, ['#ffd23f', '#ff6a5a']); };
    try {
      await UI.fade(1, 700); matchOn(); rshot(...SH5.wide); await UI.fade(0, 900);
      await scene(async () => { rshot(...SH5.wide); await say(P('elif'), 'el.full'); rshot(...SH5.grill); await wait(0.7); rshot(...SH5.wide); await say(P('elif'), 'el.still'); await say(P('elif'), 'el.grill'); });
      lock(true); WUI.hud.open('Die Nacht der Stille · bring the shop back');
      // the grill
      rshot(...SH5.grill);
      if (!await go(WUI.hud.call({ icon: 'dnKemal', title: 'Elif: «Sag Baba, er soll den Grill anmachen!»', sub: 'Tell Kemal to switch the grill on. anmachen comes apart: «Mach … an!»', bar: 1 / 9, model: 'Kemal, mach den Grill an!', modelEn: 'Kemal, switch the grill on!', check: onCheck(['grill', 'spiess', 'ofen'], 'den Grill') }))) return;
      MATCH.lit = true; familyPose(); P('kemal').pose = 'cheer'; sparkle(X0 + SPOT.spit.x, Y0 + 1.6, Z0 + SPOT.spit.z, 14, ['#ff9a3a', '#ffd23f'], 'chime'); calm(0.14);
      await wait(1.2); P('kemal').pose = 'idle';
      // the orders
      await sayHud(P('kemal'), 'ke.quiet');
      if (!await go(WUI.hud.call({ icon: 'dnDoener', title: 'Kemal: «Was … darf’s … sein?»', sub: 'Order for the whole shop: ten Döner, with everything!', bar: 2 / 9, model: 'Zehnmal Döner mit alles, bitte!', modelEn: 'Ten Döner with everything, please!', check: tenCheck }))) return;
      crowdDo('cheer', 1.4); await sayHud(P('kemal'), 'ke.back'); calm(0.12);
      // the TV: kick-off
      rshot(...SH5.wide); await sayHud(P('elif'), 'el.tv');
      if (!await go(WUI.hud.call({ icon: 'dnTV', title: 'Der Fernseher', sub: 'Tell Elif to switch the TV on: «Mach … an!»', bar: 3 / 9, model: 'Elif, mach den Fernseher an!', modelEn: 'Elif, switch the TV on!', check: onCheck(['fernseher', 'fernsehen', 'tv', 'glotze', 'kiste'], 'den Fernseher') }))) return;
      MATCH.on = true; MATCH.min = 0; sfx('whistle'); rshot(...SH5.tv); calm(0.1);
      await wait(1.6);
      // 1:0 Germany
      MATCH.min = 23; await wait(0.8); MATCH.de = 1; sfx('fanfare'); crowdDo('cheer', 2.2, ['c-bruno', 'c-adi', 'kalle', 'c-otto']); P('kemal').pose = 'cheer'; rshot(...SH5.crowd);
      if (!await go(WUI.hud.call({ draw: ball, title: 'Tor für Deutschland! 1:0', sub: 'Shout it, as long as you like: «Toooor!»', bar: 4 / 9, model: 'Toooor!', modelEn: 'Goaaal!', check: torCheck }))) return;
      cheerMimo(); calm(0.12); P('kemal').pose = 'idle';
      // who are you for?
      rshot(...SH5.bruno); await sayHud(P('c-bruno'), 'bruno.who');
      if (!await go(WUI.hud.call({ icon: 'dnStar', title: 'Bruno: «Für wen bist du eigentlich?»', sub: 'Germany or Turkey? In this shop, there’s only one right answer…', bar: 5 / 9, model: 'Ich bin für beide!', modelEn: 'I’m rooting for both!', check: beideCheck }))) return;
      rshot(...SH5.grill); await sayHud(P('kemal'), 'ke.diplo'); crowdDo('cheer', 1.2); calm(0.12);
      // 1:1 Turkey
      rshot(...SH5.tv); MATCH.min = 41; await wait(0.8); MATCH.tr = 1; sfx('fanfare');
      rshot(...SHOT.gulten); P('gulten').pose = 'cheer'; await sayHud(P('gulten'), 'gu.hadi');
      if (!await go(WUI.hud.call({ draw: ball, title: 'Tor für die Türkei! 1:1', sub: 'Cheer with Babaanne: «Hadi!» (come on!)', bar: 6 / 9, model: 'Hadi! Hadi!', modelEn: 'Come on! Come on!', check: hadiCheck }))) return;
      P('gulten').pose = 'cards'; cheerMimo(); calm(0.1);
      // half-time: the Döner and Marta's cake
      MATCH.min = 45; sfx('whistle'); rshot(...SH5.wide); await sayHud(P('marta'), 'marta.half');
      if (!await go(WUI.hud.call({ icon: 'dnBaklava', title: 'Halbzeit!', sub: 'Ten Döner and Marta’s cake are on the tables. Wish everyone a good meal, the Turkish way!', bar: 7 / 9, model: 'Afiyet olsun!', modelEn: 'Enjoy your meal!', check: afiyetCheck }))) return;
      crowdDo('hold', 2.0); calm(0.1);
      // 2:1 Turkey… 2:2 in the 89th minute
      rshot(...SH5.tv); MATCH.min = 67; await wait(0.8); MATCH.tr = 2; P('gulten').pose = 'cheer';
      rshot(...SH5.crowd); await sayHud(P('kalle'), 'kalle.sigh'); P('gulten').pose = 'cards';
      MATCH.min = 89; await sayHud(P('elif'), 'el.late'); await wait(0.6); MATCH.de = 2; sfx('fanfare'); crowdDo('cheer', 2.6); P('kemal').pose = 'cheer'; P('elif').pose = 'cheer';
      if (!await go(WUI.hud.call({ draw: ball, title: 'Ausgleich! 2:2', sub: 'In the 89th minute! Shout!', bar: 8 / 9, model: 'Tooooor!', modelEn: 'Goaaaal!', check: torCheck }))) return;
      cheerMimo(); calm(0.12); P('kemal').pose = 'idle'; P('elif').pose = 'cards';
      // the final whistle: who won?
      MATCH.min = 90; sfx('whistle'); rshot(...SH5.wide); await sayHud(P('elif'), 'el.final');
      if (!await go(WUI.hud.call({ icon: 'dnTV', title: 'Abpfiff! 2:2', sub: 'Two all: nobody won! In German, a draw is «unentschieden».', bar: 1, model: 'Unentschieden!', modelEn: 'A draw!', check: drawCheck }))) return;
      // the Hush can't stand it: the whole shop talking at once
      MATCH.hush = 0; sfx('poof'); crowdDo('cheer', 3.0); P('kemal').pose = 'cheer'; P('elif').pose = 'cheer'; P('gulten').pose = 'cheer';
      try { for (let i = 0; i < 10; i++) G.w3d.fx.puff(X0 + 0.8 + (Math.random() - 0.5) * 5, Y0 + 2.8 + (Math.random() - 0.5) * 0.6, Z0 + 0.4 + (Math.random() - 0.5) * 3, 4, 0.8); } catch (e) { /* */ }
      cheerMimo(); WUI.hud.close(); lock(false);
      await scene(async () => { rshot(...SH5.wide); await wait(1.4); await say(P('elif'), 'el.gone'); });
      ['kemal', 'elif', 'gulten'].forEach(id => { if (P(id)) P(id).pose = id === 'kemal' ? 'idle' : 'cards'; });
      // the nazar, from Babaanne
      await scene(async () => {
        rshot(...SHOT.gulten); P('gulten').pose = 'hold'; await say(P('gulten'), 'gu.nazar');
        st.nazar = true; st.nazarOff = false; mimoBits(); if (NAZ) NAZ.visible = true;
        const m = M(); mimoHappy(2.5); m.glow = 1; sparkle(m.x, m.ry + 0.9, m.z, 18, ['#1f4fa8', '#7cc4ff', '#ffffff'], 'learned');
        UI.toast(`${mimo()} wears Babaanne’s nazar boncuğu!`); P('gulten').pose = 'cards';
        rshot(...SHOT.elif); P('elif').pose = 'cheer'; await say(P('elif'), 'el.thanks'); P('elif').pose = 'cards';
        rshot(...SH5.grill); await say(P('kemal'), 'ke.thanks');
      });
      st.ch[5] = true; st.hushOn = false; st.grades5 = grades;
      ['ph.dn.tor', 'ph.dn.beide', 'ph.dn.hadi', 'ph.dn.afiyet'].forEach(teach);
      coins(16, 'The whole street’s thanks');
    } finally {
      lock(false); WUI.hud.close(); G.cam.override = null;
      const hel = document.getElementById('wmhud'); if (hel) hel.style.visibility = '';
      matchOff();
      if (st.ch[5]) UI.toast('The Yıldız Grill is open again, and its sign is lit.');
      else if (quit) think('Elif: «Nächstes Mal! Es gibt immer ein Rückspiel.» (Next time! There’s always a return match.)', 3.5);
    }
  }

  // ================================================================ Elif's menu, Kemal's counter, Babaanne's table
  const CH = [
    { n: 1, title: 'Bestellen', sub: 'ordering a Döner like a pro', gate: f => !!f.rosa, wait: 'after Rosa’s welcome', run: () => chapter1() },
    { n: 2, title: 'An der Theke', sub: 'the lunch rush: you take the orders', gate: f => !!f.boss, wait: 'after the big Hushling on the hill', run: () => chapter2() },
    { n: 3, title: 'Wörter, die reisen', sub: 'Turkish words in German, Kiezdeutsch, Babaanne’s story', gate: f => (f.bells || 0) >= 1, wait: 'after the first bell', run: () => chapter3() },
    { n: 4, title: 'Familie', sub: 'Elif’s Abitur party', gate: f => (f.bells || 0) >= 2, wait: 'after the second bell', run: () => chapter4() },
    { n: 5, title: 'Die Nacht der Stille', sub: 'the match night against the Hush', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell',
      run: () => { const st = S(); if (!hushed() && !st.l5) st.hushOn = true; return !st.l5 ? quietScene() : !allInvited() ? invReminder() : chapter5(); } },
  ];
  let talking = false;
  const once = fn => async () => { if (talking) return; talking = true; try { await fn(); } finally { talking = false; } };
  const elifTalk = once(async () => {
    const st = S(), f = flags();
    if (!st.met) return meet();
    const next = CH.find(c => !st.ch[c.n]), opts = [];
    if (next) {
      const sub = !next.gate(f) ? `later: ${next.wait}` : next.n === 5 && st.l5 && !allInvited() ? `invite: ${INV.map(I => (st.inv[I.id] ? '✓ ' : '') + I.name).join(', ')}` : next.sub;
      opts.push({ label: `Chapter ${next.n}: ${next.title}`, sub, value: next.gate(f) ? 'next' : 'wait' });
    }
    if (st.ch[1]) opts.push({ label: 'Practice the shop’s phrases', sub: 'from memory, for a coin each', value: 'practice' });
    opts.push({ label: 'Chat', value: 'chat' });
    if (st.cap) opts.push({ label: hatOn() ? `Take ${mimo()}’s Yıldız cap off` : `Put the Yıldız cap on ${mimo()}`, value: 'cap' });
    if (st.nazar) opts.push({ label: nazarOn() ? `Take ${mimo()}’s nazar off` : `Put the nazar on ${mimo()}`, value: 'nazar' });
    const v = await UI.choose(hushed() && !MATCH.lit ? 'Elif: «Hey … gut, dass du da bist.» (Hey… good that you’re here.)' : 'Elif: «Na, wie läuft’s?» (Hey, how’s it going?)', opts);
    if (v === 'next') return next.run();
    if (v === 'wait') return scene(async () => { rshot(...SHOT.elif); await say(P('elif'), 'el.wait'); });
    if (v === 'practice') return practice();
    if (v === 'chat') {
      st.chat = (st.chat || 0) + 1;
      const pool = ['el.idle1', 'el.idle2', 'el.idle3', 'el.idle4'].concat(st.ch[4] ? ['el.idle5'] : []), key = hushed() && !MATCH.lit ? 'el.hush' : pool[st.chat % pool.length];
      return scene(async () => { rshot(...SHOT.elif); await say(P('elif'), key); });
    }
    if (v === 'cap') {
      st.capOff = hatOn();
      if (!st.capOff) { if (G.state.wm) G.state.wm.hatOff = true; if (G.state.adolf && G.state.adolf.cap) G.state.adolf.capOn = false; }
      UI.toast(st.capOff ? 'Cap off.' : `${mimo()} wears the Yıldız cap again!`); if (G.save) G.save(); return;
    }
    if (v === 'nazar') { st.nazarOff = nazarOn(); UI.toast(st.nazarOff ? 'Nazar off.' : `${mimo()} wears the nazar again!`); if (G.save) G.save(); }
  });
  const gulTalk = once(async () => {
    const st = S(); st.gchat = (st.gchat || 0) + 1;
    if (hushed() && !MATCH.lit) return scene(async () => { rshot(...SHOT.gulten); await sayRaw(P('gulten'), '…', '(Babaanne holds her tea glass. The çay went cold a long time ago.)'); });
    const pool = ['gu.idle1', 'gu.idle2', 'gu.hi'].concat(st.ch[3] ? ['gu.end2'] : []);
    return scene(async () => { rshot(...SHOT.gulten); await say(P('gulten'), pool[st.gchat % pool.length]); });
  });
  async function practice() {
    const ids = PH.filter(p => LEX.item(p.id) && LEX.taught(p.id)).map(p => p.id); if (!ids.length) return;
    const pickN = WUI.shuffle(ids.slice()).slice(0, 5);
    const r = await WUI.steps(pickN.map(id => { const p = PHI[id]; return { kind: 'From memory · what do you say?', sit: esc(p.sit), model: p.model, modelEn: p.en, keys: p.keys }; }),
      Object.assign({ intro: ['Weißt du noch?', 'Do you remember?'] }, panel('elif', 'Üben mit Elif', 'the shop’s expressions')));
    if (r.quit) return;
    const right = r.grades.filter(g => g === 'S' || g === 'A').length;
    if (right) coins(right, `Practice: ${right} of ${r.grades.length} from memory`);
  }
  // order something from Kemal (after chapter 1): the coins it costs, about one a euro; after the match night, «fast immer umsonst»
  const ORDER_FIND = ['box', 'teller', 'duerum', 'halloumi', 'doener', 'ayran', 'cay'];
  const orderFood = once(async () => {
    const st = S();
    if (!st.ch[1]) { await scene(async () => { rshot(...SHOT.counter); await say(P('kemal'), 'ke.hi'); }); think('Elif waves you over: she wants to show you how to order first.', 3.5); return; }
    if (hushed() && !MATCH.lit) return scene(async () => { rshot(...SHOT.counter); await sayRaw(P('kemal'), '…', '(Kemal just stares at the cold grill.)'); });
    roomAt(SPOT.front.x - 1.2, SPOT.front.z + 0.4, Math.PI); rshot(...SHOT.counter);
    let item = null;
    lock(true); WUI.hud.open('Bei Yıldız · order something');
    try {
      const g1 = await WUI.hud.call({ icon: 'dnDoener', title: 'Kemal: «Na, was darf’s sein?»', sub: 'Order anything on the menu, politely: «Einmal …, bitte!»', model: 'Einmal Döner mit alles, bitte!', modelEn: 'One Döner with everything, please!',
        check: t => { const id = ORDER_FIND.find(k => has(t, ITEM[k].keys).ok); if (!id) return { ok: false, why: 'Something from the menu! Döner, Dürüm, Döner-Teller, Döner-Box, Halloumi, Ayran or Çay' }; item = ITEM[id]; return orderCheck([[item.keys, item.de]], `Einmal ${item.de}, bitte!`)(t); } });
      if (g1 === 'quit' || !item) return;
      const cost = st.ch[5] ? 1 : Math.max(1, Math.round(item.price / 100)), free = (G.state.coins || 0) < cost, drink = item.id === 'ayran' || item.id === 'cay';
      if (!drink) {
        const g2 = await WUI.hud.call({ icon: item.icon, title: 'Kemal: «Hier essen oder zum Mitnehmen?»', sub: 'Eat here, or take it with you?', model: 'Hier essen, bitte.', modelEn: 'Eat here, please.', check: anyCheck(['hier essen', 'zum hier essen', 'hier', 'mitnehmen', 'zum mitnehmen'], '«Hier essen.» or «Zum Mitnehmen.»') });
        if (g2 === 'quit') return;
      }
      const g3 = free
        ? await WUI.hud.call({ icon: item.icon, title: 'Kemal: «Ach, lass mal. Das geht aufs Haus!»', sub: '“It’s on the house!” (You’re short of coins.) Thank him!', model: 'Danke schön!', modelEn: 'Thank you!', check: anyCheck(['danke', 'dankeschon', 'danke schon', 'vielen dank', 'tesekkurler', 'sag ol'], '«Danke schön!»') })
        : await WUI.hud.call({ icon: item.icon, title: `Kemal: «Das macht ${esc(WUI.euroWords(item.price))}.»`, sub: `Pay (${cost} coin${cost === 1 ? '' : 's'}), with a word.`, model: 'Hier, bitte. Stimmt so!', modelEn: 'Here you go. Keep the change!', check: anyCheck(['hier bitte', 'bitte schon', 'bitte', 'hier', 'stimmt so', 'passt so', 'bitte sehr'], '«Hier, bitte!»') });
      if (g3 === 'quit') return;
      if (!free) G.state.coins = (G.state.coins || 0) - cost;
      sfx('chest'); mimoHappy(2.2); const m = G.sim.mimo; if (m) sparkle(m.x, m.ry + 0.8, m.z, 10, ['#ffd23f', '#ff9a3a']);
      UI.toast(free ? `${item.de}, on the house! ${mimo()} loves it.` : `${item.de}! ${mimo()} loves it. −${cost} coin${cost === 1 ? '' : 's'}`);
    } finally { WUI.hud.close(); lock(false); G.cam.override = null; if (G.save) G.save(); }
  });
  const menuCard = () => ({ tag: 'The menu (die Speisekarte)', lines: MENU.map(m => ({ text: `${m.de}  ${euro(m.price)}`, en: m.en, say: `${m.de}: ${WUI.euroWords(m.price)}` })) });
  const photoCard = () => ({ tag: 'The family photo wall', lines: [
    { text: '1964: Istanbul → München', en: 'Babaanne Gülten’s train to Germany: three days' }, { text: 'Berlin: die Radiofabrik', en: 'the radio factory where she worked' },
    { text: 'Frau Krüger', en: 'the neighbour who taught her German, over coffee and cake' }, { text: '1985: der erste Imbiss', en: 'the family’s first snack bar, in Berlin' },
    { text: 'Elifs erster Schultag', en: 'Elif’s first day of school, with her Schultüte' }, { text: 'Alba, 2006: Yıldız Grill', en: 'opening day, here in Alba' }] });
  function roomItems() {
    const list = []; if (!inside || rbusy || !R || MATCH.night || busyN) return list;
    const A = (x, z, r, label, run) => list.push({ x: X0 + x, z: Z0 + z, y: Y0, r, label, run });
    A(SPOT.exit.x, SPOT.exit.z, 1.4, 'Go out', leave);
    A(SPOT.elif.x - 0.1, SPOT.elif.z + 0.85, 1.8, 'Talk (Elif)', elifTalk);
    A(-1.5, -1.45, 1.4, 'Order (Kemal)', orderFood);
    A(1.4, -1.45, 1.1, 'Read the menu', () => SIGNS.read(menuCard()));
    A(-4.3, 1.75, 1.6, 'Talk (Babaanne)', gulTalk);
    A(-5.7, -1.2, 1.5, 'Look at the photos', () => SIGNS.read(photoCard()));
    A(5.4, -0.2, 1.3, 'Look', () => think(S().ch[5] ? 'The old TV in the corner. Still 2:2, as far as Alba is concerned.' : 'An old TV in the corner, high on the wall. On match nights, the whole street squeezes in here.', 3.5));
    return list;
  }

  // ================================================================ outdoors: "Go in", the invitations (story.js STORY.extra)
  const PROVIDER = {
    interactables() {
      if (!B || !B.front || !shown() || WUI.isOpen || (G.indoors && G.indoors())) return [];
      const L0 = [], Y = G.sim.you, st = S(), D = B.front.door;
      if (Math.abs(Y.x - D.x) < 6 && Math.abs(Y.z - D.z) < 6) L0.push({ x: D.x, z: D.z, r: 1.7, label: 'Go in', run: () => enter() });
      if (st.l5 && !st.ch[5]) for (const I of INV) if (!st.inv[I.id]) { const p = who(I.where); if (p && Math.hypot(Y.x - p.x, Y.z - p.z) < 6) L0.push({ x: p.x, z: p.z, r: 2.2, label: `Invite ${I.name} to the match`, run: () => invite(I) }); }
      return L0;
    },
    tick(dt, Y) {
      if (!B || !B.front || !shown()) return;
      const st = S(), D = B.front.door;
      if (!st.seen && Math.hypot(Y.x - D.x, Y.z - D.z) < 9) { st.seen = true; think('A red shop sign with a gold star: «YILDIZ GRILL». It smells of fresh bread and grilled meat…', 4.5); }
    },
  };

  // ================================================================ the quest (quests.js LIST: German games only)
  function quest() {
    const d = s => s.dn || {}, ch = (s, n) => !!(d(s).ch && d(s).ch[n]);
    const doorAt = () => (B && B.front ? { x: B.front.door.x, z: B.front.door.z } : { x: -31.3, z: -146.6 });
    const nextInv = () => { const st = G && G.state && G.state.dn; if (st && st.l5 && !st.ch[5]) for (const I of INV) if (!(st.inv || {})[I.id]) { const p = who(I.where); if (p) return { x: p.x, z: p.z }; } return doorAt(); };
    const step = (n, text, why, hint, target) => ({ get text() { const c = CH[n - 1]; return c && !c.gate(flags()) ? text : text.replace(/ \(after [^)]*\)$/, ''); }, why, done: s => ch(s, n), target: target || doorAt, hint });
    return {
      id: 'dn', kind: 'side', title: 'Yıldız Grill', giver: 'Elif, at the Dönerladen on the west street', started: s => s.lang === 'de' && !!d(s).met,
      steps: [
        step(1, 'Order a Döner like a pro, with Elif', 'Döner, Dürüm, Döner-Teller, Döner-Box, Ayran; the sauces, «ohne Zwiebeln», «Hier essen oder zum Mitnehmen?». Then order for real, from Kemal.', '{mimo} sniffs: fresh bread and grilled meat. The Yıldız Grill!'),
        step(2, 'Help Kemal through the lunch rush (after the big Hushling on the hill)', 'Alba’s people order; you repeat each order for Kemal and say the price: «Das macht … Euro.»', '{mimo} points at the shop with the star on its sign.'),
        step(3, 'Words that travel, and Babaanne’s story (after the first bell)', 'Turkish words in German (Tamam! Hadi! Yallah!), a little Kiezdeutsch, and Babaanne Gülten’s story at the photo wall: from Istanbul to Berlin in 1964.', '{mimo} points at the Yıldız Grill. Babaanne is waiting with çay.'),
        step(4, 'Elif’s Abitur party (after the second bell)', 'The family, the food on the table (Simit, Börek, Sucuk, Baklava), «Elinize sağlık!», and Elif’s rap: you find the rhymes.', '{mimo} hears music from the Yıldız Grill. A party?'),
        Object.assign(step(5, 'The match night: invite Alba ({n}/4) and bring the shop back (after the third bell)', 'The Hush has silenced the shop: the grill is cold, the regulars stay away. Invite Bruno, Adi, Marta and Oma Rosa to watch Germany against Turkey at Yıldız, then fill the shop with orders, goals and cheering.', '{mimo} points at the next person to invite… or at the shop.', nextInv), { n: s => INV.filter(I => (d(s).inv || {})[I.id]).length }),
      ],
      story: [
        { when: s => !!d(s).met, text: 'On the west street is the Yıldız Grill, a Dönerladen with a gold star on its sign («Yıldız» means star). Kemal runs it, his daughter Elif does her homework at the counter, and Babaanne Gülten plays tavla in the corner.' },
        { when: s => ch(s, 1), text: 'You can order a Döner like a pro now: «Einmal Döner mit alles und scharf!» (standard German: «mit allem»), «ohne Zwiebeln», «zum Mitnehmen», «Stimmt so!»' },
        { when: s => ch(s, 2), text: 'You helped Kemal through the lunch rush: Bruno, Adi, Lucas, Vera and Herr Otto, every order repeated and every price right. «Kolay gelsin!»' },
        { when: s => ch(s, 3), text: 'Elif taught you Turkish words that German speakers use, and a little Kiezdeutsch. Babaanne told her story: the train in 1964, the radio factory, Frau Krüger, the first Imbiss in 1985. «We thought: two years. It became sixty.»' },
        { when: s => ch(s, 4), text: 'Elif passed her Abitur! At the party you met her mother Selin, ate börek and baklava, and found the rhymes for Elif’s rap. {mimo} wears the shop’s cap with the star.' },
        { when: s => ch(s, 5), text: 'The match night: Germany 2, Turkey 2, and the whole street cheering in the Yıldız Grill. The Hush is gone. Babaanne gave {mimo} a nazar, and your Döner is (almost) always free now.' },
      ],
    };
  }

  // ================================================================ readable signs (signs.js), the minimap's mark
  function addSigns() {
    if (typeof SIGNS === 'undefined' || !SIGNS.add || !B || !B.front) return;
    const F = B.front, out = () => shown() && !(G.indoors && G.indoors());
    SIGNS.add({ id: 'dn-sign', x: F.signAt.x, z: F.signAt.z, r: 1.3, when: out, card: () => ({ tag: 'A shop sign', lines: [{ text: 'YILDIZ GRILL', en: '«Yıldız» is Turkish for “star”: the Star Grill' }, { text: 'Döner · Dürüm · Halloumi · Ayran · Çay', en: 'what they sell' }] }) });
    SIGNS.add({ id: 'dn-menu', x: F.menuAt.x, z: F.menuAt.z, r: 1.1, when: out, card: () => menuCard() });
  }
  const MARK = {};
  function mapMark(dpr) {
    if (!B || !B.front || !shown()) return null;
    const q = hushed(), k = String(dpr) + (q ? 'H' : 'L');
    if (!MARK[k]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr); c.lineJoin = 'round';
      c.fillStyle = q ? '#8a8692' : RED; c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.rect(2.5, 2.5, 13, 13); c.fill(); c.stroke();
      star(c, 9, 9.4, 5.4, q ? '#d8d4dc' : '#ffd23f');
      MARK[k] = cv;
    }
    const D = B.front.door; return { x: D.x, z: D.z, img: MARK[k] };
  }

  // ================================================================ start
  function init(game) {
    G = game; ZHF.bind(game); WUI.bind(game);
    regPhrases(); regLines();
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'dn')) QUESTS.LIST.push(quest());
    if (typeof INTERIORS !== 'undefined' && INTERIORS.claim) INTERIORS.claim(id => id === DOOR_ID && isDe());
    addSigns();
    setInterval(() => { if (shown()) keepFar(); }, 30000);
  }

  // ================================================================ tests (the game never calls these)
  const TEST = {
    fast(on = true) { WUI.fast = on; },
    setup(fl) { Object.assign(G.state.flags, { hatched: true, rosa: true }, fl || {}); },
    // jump the save to a chapter's start (n: the chapters already done)
    done(n) {
      const st = S(); for (let i = 1; i <= 5; i++) st.ch[i] = i <= n;
      st.met = st.visited = st.seen = true; st.rush = n >= 2 ? RUSH.length : 0; st.words = st.kiez = n >= 3; st.cap = n >= 4; st.nazar = n >= 5; st.l5 = n >= 5; st.hushOn = false; st.inv = {};
      if (n >= 5) INV.forEach(I => { st.inv[I.id] = true; });
    },
    invAll() { INV.forEach(I => { S().inv[I.id] = true; }); },
    go: async sec => { await window.__g.go(sec); },
    drive: o => WUI.drive(Object.assign({ sec: 30 }, o || {})),
    enter: () => enter({ quiet: true }), leave: () => leave(),
    get R() { return R; }, get B() { return B; }, MATCH, CL,
  };
  return {
    init, build, quest, hatOn, nazarOn, mapMark, enter, leave,
    get inside() { return inside; },
    get OUTSIDE() { return OUT(); },
    interactables() { return inside ? roomItems() : []; },
    update(dt, t) { roomUpdate(dt, t); },
    curiosities() { return []; },
    target() { return inside ? { x: X0 + SPOT.elif.x, z: Z0 + SPOT.elif.z + 0.8, hint: '{mimo} points at Elif, at the end of the counter.' } : null; },
    get busy() { return rbusy || busyN > 0 || MATCH.night; },
    ROOM_AT: { x: X0, y: Y0, z: Z0 }, DOOR_ID,
    _: { S: () => S(), LT, PH, PHI, MENU, RUSH, INV, CH, SPOT, CROWD, meet, chapter1, chapter2, chapter3, chapter4, chapter5, quietScene, invite, orderFood, practice, elifTalk, gulTalk, PROVIDER, roomItems, hushed, familyPose,
      checks: { nounCheck, orderCheck, repeatCheck, priceCheck, yearCheck, famCheck, rhymeCheck, inviteCheck, onCheck, tenCheck, torCheck, beideCheck, hadiCheck, afiyetCheck, drawCheck }, numberIn, t: TEST },
  };
})();
