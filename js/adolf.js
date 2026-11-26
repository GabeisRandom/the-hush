'use strict';
// Adi (Adolf), Alba's postman: a German-only side character (G.state.lang === 'de'; everything hides in es/pt games).
// The friendliest man in town, with an unfortunate name he handles with a gentle sigh (a great-uncle's name his grandma
// insisted on: "just call me Adi!"). No history jokes, no symbols, no mustache: a round, rosy, kind postman.
//
// What's here:
//   - Adi walks his round through Alba's northern streets (laneNW → north street → laneNE and back), stopping at doors
//     with a letter, and rests at his garden table behind the houses on the lane (around (−31, −185)) with his
//     neighbours Hilde (a sweet granny, ruthless at board games) and Kalle (a careful young man with a crossword).
//   - The side quest "Post for Alba": five letters to deliver. You read the addresses («An Frau Rosa», «Für den Bäcker»,
//     «An die Familie im blauen Haus», «Für den Mann mit dem Besen», «An den Trainer»), ask people «Wo wohnt …?» to put
//     them on the compass, and hand each one over with a sentence («Ein Brief für den Bäcker!»), graded S–D:
//     für + accusative (der → den), mit + dative (mit dem Besen), and Sie / du. Then Feierabend: Kaffee und Kuchen in his
//     garden, and a game of «Mensch ärgere dich nicht» (the real rules) with Adi, Hilde and Kalle. The prize: Adi's old
//     postman's cap for Mimo. Afterwards: more mail rounds (random letters «für die Frau mit der Gießkanne»…), the board
//     game any time, and a practice of the expressions.
//   - FIVE CHAPTERS (2026-11-13), gated like every side character (Rosa's welcome, the big Hushling, bells 1, 2, 3; a
//     chapter you've started stays open, so old saves carry on): 1 «Post für Alba» (meet Adi, the five letters),
//     2 «Feierabend» (Kaffee und Kuchen, the first game, the cap), 3 «Die kleine Runde» (your first round of three letters:
//     mit + dative), 4 «Ein Paket für den Nachbarn» (a parcel day: an Einschreiben for Herr Otto, Kalle not home so Hilde
//     takes his parcel, the yellow note «Dein Paket ist bei Hilde, Schulgasse 3», an address label to Bremen: street then
//     number, postcode then town), 5 «Liebe Grüße aus Alba» (the Hush stops the letters; Hilde offers «du»; postcards:
//     «Lieber Kalle / Lieber Herr Otto / Liebe Hilde», dir vs Ihnen, the endings; the town writes again and Adi gets his
//     first letter in years, with Hilde's yellow scarf). The new chapters' panels are WUI's (weihnacht_ui.js), restyled
//     post-yellow while they run. Song: «Eilpost» (ad_eilpost), liquid drum & bass, after chapter 5 by the garden table.
//   - 19 everyday expressions as LEX phrases (ph.*), and 12 more for chapters 4–5 (ph.ad.*): «Na?», «Alles klar?», «Mensch!», «Genau!», «Ach so!», «Doch!»,
//     «Na ja …», «Feierabend!», «Tschüss!», «Mahlzeit!», «Prost!», «Schönen Tag noch!», «Lecker!», «Guten Appetit!»,
//     «Viel Glück!», «Du bist dran!», «Mensch, ärgere dich nicht!», «Gut gemacht!», «Schade!». Each is taught where it
//     happens (you say it back: echo), then recalled in context (output), and Adi quizzes the ones that are due.
//
// One global, ADOLF:
//   ADOLF.init(game)                       words/phrases/lines are registered at load; init adds the quests to QUESTS.LIST
//   ADOLF.build(scene, { terrainAt })      → { colliders: [] (see below), group, people, update(dt, t, you|null), stats() }
//   ADOLF.interactables()                  → [{ x, z, y, r, label, run }] (Adi, the neighbours, the garden, deliveries, asking)
//   ADOLF.busy                             true while the board game is open (main should treat it like a frozen frame)
//   ADOLF.capOn()                          Mimo is wearing Adi's cap (main hides the straw hat meanwhile)
// All of Adi's solids are language-dependent, so they live in WORLD.extra (parked at x 1e5 outside German games) and
// build() returns colliders: []. The people objects are live: { id, name, x, z, y, top, r, story, hidden, talking }.
// Progress lives in state.adolf. Needs THREE, core.js, toonkit.js, lexicon.js, words.js, lines.js, icons.js, town.js and
// world.js at load; STORY, UI, QUESTS, Sound at run time. Test page: adolf-test.html.

const ADOLF = (() => {
  // ================================================================ small helpers
  const { M4 } = TK;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const GEO = {
    box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 14), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
    sph: new THREE.SphereGeometry(1, 14, 10), sphS: new THREE.SphereGeometry(1, 8, 6), cone: new THREE.ConeGeometry(1, 1, 12),
    cone6: new THREE.ConeGeometry(1, 1, 6), ico: new THREE.IcosahedronGeometry(1, 0), torus: new THREE.TorusGeometry(1, 0.16, 6, 18),
  };
  const lathe = (pts, n = 16) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
  function segDist(px, pz, ax, az, bx, bz) {
    const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz, t = l2 ? clamp(((px - ax) * dx + (pz - az) * dz) / l2, 0, 1) : 0;
    return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
  }
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  // typed German, compared loosely: no case, accents or punctuation; ä = ae, ö = oe, ü = ue, ß = ss
  const canon = s => norm(String(s || '')).replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u').replace(/ß/g, 'ss').replace(/\s+/g, ' ').trim();
  const pick = (a, R = Math.random) => a[Math.floor(R() * a.length) % a.length];
  const fillVars = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
  const nowS = () => Date.now() / 1000;

  let G = null;                                   // the game (main.js)
  const isDe = () => !!(G && G.state && G.state.lang === 'de');
  const S = () => { const s = G.state; return s.adolf || (s.adolf = {}); };
  const wait = s => STORY.wait(s);
  let myLock = false;
  const lock = on => { if (!G) return; G.sim.lock = on ? 1 : 0; myLock = !!on; };

  // ================================================================ places (plain data)
  // The garden lies behind the two houses on the little lane (laneNW), west of the school: you reach it through the
  // narrow way between the houses (a rose arch) or the gate in its east fence. North: a hedge, then the woods.
  const GARDEN = { x: -31, z: -185, x0: -37.3, x1: -25.0, z0: -180.0, z1: -190.0 };
  const TABLE = { x: -31.6, z: -185.3, r: 0.85, h: 0.74 };
  const SEAT_R = 1.38;
  const SEATS = {
    adi: { x: TABLE.x, z: TABLE.z - SEAT_R, yaw: 0 }, hilde: { x: TABLE.x - SEAT_R, z: TABLE.z, yaw: Math.PI / 2 },
    kalle: { x: TABLE.x + SEAT_R, z: TABLE.z, yaw: -Math.PI / 2 }, you: { x: TABLE.x, z: TABLE.z + SEAT_R, yaw: Math.PI },
  };
  const PLAY_SPOT = { x: TABLE.x + 0.25, z: TABLE.z + 2.05, yaw: Math.PI };       // where you stand to play
  const ARCH = { x: -29.6, z: -180.35 }, EAST_GATE = { x: -25.0, z: -185.7 };
  const MAILBOX = { x: -28.15, z: -180.75 }, MAILBOX_YAW = -0.3;
  const BIRDHOUSE = { x: -35.4, z: -181.5 }, BARROW = { x: -26.4, z: -188.4, yaw: 0.5 };
  const GNOMES = [
    { id: 'gerd', name: 'Gerd', x: -25.85, z: -184.35, yaw: -Math.PI / 2, prop: 'sign', coat: '#3f7fc9', hat: '#d9493b' },
    { id: 'guenther', name: 'Günther', x: -36.3, z: -183.2, yaw: Math.PI / 2, prop: 'shovel', coat: '#4f9a5a', hat: '#d9493b' },
    { id: 'udo', name: 'Udo', x: -27.6, z: -189.1, yaw: Math.PI * 0.85, prop: 'rod', coat: '#e0743c', hat: '#c9453b' },
    { id: 'heinz', name: 'Heinz', x: -36.2, z: -187.6, yaw: Math.PI / 2, prop: 'sleep', coat: '#8a5ab0', hat: '#d9493b' },
    { id: 'klaus', name: 'Klaus', x: -28.35, z: -184.45, yaw: -0.4, prop: 'peek', coat: '#3e8f8a', hat: '#e0503f' },
  ];
  // Adi's way from his chair, through the garden and the narrow way between the houses, onto the lane
  const GARDEN_PATH = [[-32.7, -187.4], [-34.5, -186.3], [-34.5, -183.0], [-31.0, -181.3], [-29.6, -180.3], [-29.4, -178.4], [-29.2, -175.3], [-29.0, -172.9]];
  // …and his round: the lane east, a bit of the north street, the lane past the pond's side, and back (he turns round
  // at the far end). It keeps clear of the plaza and the other reserved corners.
  const STREET_PATH = [[-26.0, -172.9], [-18.0, -173.0], [-12.2, -173.0], [-10.0, -171.4], [-9.2, -168.7], [-4.0, -168.5], [3.0, -168.5], [8.0, -168.5], [12.4, -166.2], [16.0, -164.1]];
  const LANDMARKS = { garden: { x: GARDEN.x, z: GARDEN.z }, table: { x: TABLE.x, z: TABLE.z }, arch: { ...ARCH }, eastGate: { ...EAST_GATE }, mailbox: { ...MAILBOX }, play: { ...PLAY_SPOT } };
  const inGarden = (x, z, pad = 0) => x > GARDEN.x0 - pad && x < GARDEN.x1 + pad && z < GARDEN.z0 + pad && z > GARDEN.z1 - pad;

  // the four seats at the board: you, Adi, Hilde, Kalle (turn order, clockwise)
  const PLAYERS = [
    { id: 'you', name: 'You', color: '#e0503f', light: '#f6b3a8' },
    { id: 'adi', name: 'Adi', color: '#f2c14e', light: '#f9e2a6' },
    { id: 'hilde', name: 'Hilde', color: '#4f9a5a', light: '#b6dbb8' },
    { id: 'kalle', name: 'Kalle', color: '#3f7fc9', light: '#b3cdee' },
  ];

  // ================================================================ words and expressions (registered at load)
  const NEW_WORDS = [
    { id: 'w.coffee', es: 'café', pt: 'café', de: 'Kaffee', en: 'coffee', enPl: 'coffees', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'cafés', pt: 'cafés', de: 'Kaffees' }, icon: 'coffee' },
    { id: 'w.gnome', es: 'gnomo', pt: 'gnomo', de: 'Gartenzwerg', en: 'garden gnome', enPl: 'garden gnomes', g: { es: 'm', pt: 'm', de: 'm' },
      pl: { es: 'gnomos', pt: 'gnomos', de: 'Gartenzwerge' }, icon: 'gnome', alt: { de: ['Zwerg', 'Gartenzwerge'], es: ['enano'], pt: ['anão'] } },
    { id: 'w.garden', es: 'jardín', pt: 'jardim', de: 'Garten', en: 'garden', enPl: 'gardens', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'jardines', pt: 'jardins', de: 'Gärten' }, icon: 'garden' },
    { id: 'w.dice', es: 'dado', pt: 'dado', de: 'Würfel', en: 'dice', enPl: 'dice', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'dados', pt: 'dados', de: 'Würfel' }, icon: 'dice' },
    { id: 'w.mailbox', es: 'buzón', pt: 'caixa de correio', de: 'Briefkasten', en: 'mailbox', enPl: 'mailboxes', g: { es: 'm', pt: 'f', de: 'm' },
      pl: { es: 'buzones', pt: 'caixas de correio', de: 'Briefkästen' }, icon: 'mailbox' },
    { id: 'w.cap', es: 'gorra', pt: 'boné', de: 'Mütze', en: 'cap', enPl: 'caps', g: { es: 'f', pt: 'm', de: 'f' }, pl: { es: 'gorras', pt: 'bonés', de: 'Mützen' }, icon: 'postcap' },
    // the letters in your bag while you deliver (a key item, not a word to teach)
    { id: 'k.adiLetter', kind: 'key', es: 'carta', pt: 'carta', de: 'Brief', en: 'letter (Adi’s round)', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'cartas', pt: 'cartas', de: 'Briefe' }, icon: 'letter' },
    // chapter 5's keepsake: Adi's postcard to you
    { id: 'k.adiKarte', kind: 'key', es: 'postal de Adi', pt: 'postal do Adi', de: 'Adis Postkarte', en: 'Adi’s postcard', g: { es: 'f', pt: 'm', de: 'f' }, icon: 'adCard' },
  ];
  // The expressions: German only. note = when and how it's used; sit = a situation for recalling it (English, the
  // German shown in «»); alt = other accepted ways to type it (compared with canon()).
  const PHRASES = [
    { id: 'ph.na', de: 'Na?', en: 'Hey! How’s it going?', note: 'The shortest German hello: friendly and casual. You answer «Na?» right back (or «Gut, und dir?»).', sit: 'You bump into Adi on his round. Greet him the casual German way.', alt: ['na', 'naa', 'naaa', 'na du'] },
    { id: 'ph.allesklar', de: 'Alles klar!', en: 'All good! / Got it!', note: 'Ask it to check in («Alles klar?») and say it back to mean "yes, all good, got it". The same two words both ways.', sit: 'Kalle asks you «Alles klar?». Tell him everything’s fine.', alt: ['alles klar', 'alles klar bei mir', 'alles gut'] },
    { id: 'ph.mensch', de: 'Mensch!', en: 'Wow! / Oh man!', note: 'Literally "human!". For when you’re surprised, happy or a bit annoyed: «Mensch, so viele Briefe!»', sit: 'Adi drops a whole stack of letters on the road. What does he say?' },
    { id: 'ph.genau', de: 'Genau!', en: 'Exactly!', note: 'Say it when you agree. Germans say it a lot, and it always sounds friendly.', sit: 'Adi asks: «Der Brief ist für den Bäcker, oder?» Agree with him!' },
    { id: 'ph.achso', de: 'Ach so!', en: 'Oh, I see!', note: 'For the moment something finally makes sense.', sit: 'Marta explains she’s «die Bäckerin», and Lucas is «der Bäcker». Now you get it!', alt: ['achso', 'aso', 'ach soo'] },
    { id: 'ph.doch', de: 'Doch!', en: 'Yes, it is! (after a "no")', note: 'A special yes, against a no: «Das ist nicht für mich.» – «Doch!» English has no single word for it.', sit: 'Hugo says: «Der Brief ist nicht für mich.» But it is! Say so.', alt: ['doch doch', 'oh doch'] },
    { id: 'ph.naja', de: 'Na ja …', en: 'Well… / Oh well.', note: 'For shrugs and so-so things.', sit: 'Adi asks how your game went. You lost… but it was fun. Shrug.', alt: ['naja', 'na ja'] },
    { id: 'ph.feierabend', de: 'Feierabend!', en: 'Work’s done for today!', note: 'The time after work, and what you cheer when it starts. One of the happiest German words.', sit: 'Adi delivers his very last letter of the day. What does he shout?' },
    { id: 'ph.tschuess', de: 'Tschüss!', en: 'Bye!', note: 'The everyday goodbye: friends, shops, neighbours, everybody.', sit: 'Time to go. Say bye to Hilde and Kalle!', alt: ['tschus', 'tschuss', 'tschuessi', 'tschussi', 'tschau', 'tschuss tschuss'] },
    { id: 'ph.mahlzeit', de: 'Mahlzeit!', en: 'Enjoy your lunch! (a lunchtime hello)', note: 'Around noon at work, people greet each other with «Mahlzeit!» ("mealtime!"). You answer «Mahlzeit!».', sit: 'It’s noon, and Bruno passes you on his break. Greet him the lunchtime way.' },
    { id: 'ph.prost', de: 'Prost!', en: 'Cheers!', note: 'Raise your cup or glass, and look everyone in the eye. It works with coffee too.', sit: 'Everyone at the garden table raises their coffee cups.', alt: ['prosit'] },
    { id: 'ph.schoenentag', de: 'Schönen Tag noch!', en: 'Have a nice day!', note: 'A warm goodbye: to shopkeepers, neighbours, the postman. The answer: «Danke, gleichfalls!» (thanks, you too).', sit: 'Rosa waves goodbye at her fruit stall. Wish her a nice day.', alt: ['einen schonen tag noch', 'schonen tag', 'schonen tag dir noch'] },
    { id: 'ph.lecker', de: 'Lecker!', en: 'Yummy!', note: 'For food you like. «Sehr lecker!» is even better.', sit: 'You taste Hilde’s cake. Tell her!', alt: ['sehr lecker', 'lecka', 'mega lecker'] },
    { id: 'ph.appetit', de: 'Guten Appetit!', en: 'Enjoy your meal!', note: 'Said before everyone starts eating.', sit: 'The cake is on everyone’s plate. Wish them a good meal before you start.', alt: ['guten apetit', 'gutn appetit'] },
    { id: 'ph.glueck', de: 'Viel Glück!', en: 'Good luck!', note: 'Before a game, a test, a trip…', sit: 'The board game is about to start. Wish everyone luck!', alt: ['viel gluck', 'gluck', 'viel gluck euch'] },
    { id: 'ph.dran', de: 'Du bist dran!', en: 'It’s your turn!', note: 'For games and queues: «Ich bin dran» (my turn), «du bist dran» (your turn).', sit: 'Kalle is daydreaming. It’s his turn. Tell him!', alt: ['du bist jetzt dran', 'kalle du bist dran'] },
    { id: 'ph.aergere', de: 'Mensch, ärgere dich nicht!', en: 'Hey, don’t get upset!', note: 'The board game’s name, and what everybody says when they knock someone’s piece back home.', sit: 'You just knocked Hilde’s piece back to the start. Say the game’s name to her!', alt: ['mensch argere dich nicht', 'argere dich nicht'] },
    { id: 'ph.gutgemacht', de: 'Gut gemacht!', en: 'Well done!', note: 'Praise for anything: a game, a job, a cake.', sit: 'Kalle won the game! Congratulate him.', alt: ['sehr gut gemacht', 'gut gemacht kalle'] },
    { id: 'ph.schade', de: 'Schade!', en: 'Too bad! / What a pity!', note: 'When something didn’t work out: a missed six, a lost piece, rain.', sit: 'You needed a six… and rolled a one. Too bad!', alt: ['oh schade', 'schade schade'] },
    // chapter 4 (2026-11-13): a parcel day. Lesson with Adi
    { id: 'ph.ad.paket', de: 'Ein Paket für Sie!', en: 'A parcel for you!', note: '«das Paket». At the door you say what it is and who it’s for, like with the letters: «für Sie», «für dich».', sit: 'You ring at a door with a big parcel. The lady who opens is a stranger. What do you say?', alt: ['ein paket fur sie', 'paket fur sie', 'ein paket fur dich'] },
    { id: 'ph.ad.annehmen', de: 'Können Sie das Paket annehmen?', en: 'Can you take the parcel?', note: 'Nobody home? In Germany you ask a neighbor to take it in («annehmen»). Almost everyone says yes.', sit: 'Nobody’s home, so you ring the neighbor’s bell. Ask (politely, with «Sie») if she can take the parcel.', alt: ['konnen sie das paket annehmen', 'konnen sie das paket fur kalle annehmen', 'kannst du das paket annehmen', 'nehmen sie das paket an'] },
    { id: 'ph.ad.unterschreiben', de: 'Hier unterschreiben, bitte.', en: 'Sign here, please.', note: 'An «Einschreiben» (registered letter) or a parcel needs a signature. Point at the spot and say this.', sit: 'Herr Otto has to sign for his registered letter. Show him where.', alt: ['hier unterschreiben bitte', 'bitte hier unterschreiben', 'unterschreiben sie bitte hier', 'hier unterschreiben'] },
    { id: 'ph.ad.wiebitte', de: 'Wie bitte?', en: 'Pardon? / Sorry, what?', note: 'The polite way to ask someone to say it again. (A bare «Was?» sounds rude.)', sit: 'Kalle mumbles something you can’t understand. Ask him to say it again.', alt: ['wie bitte', 'bitte wie', 'wie bitte nochmal'] },
    { id: 'ph.ad.machich', de: 'Klar, mach ich!', en: 'Sure, will do!', note: 'A happy yes to a favor. Also handy: «Ich sag Bescheid» (I’ll let them know).', sit: 'Kalle asks you to tell Hilde he’s coming. Say: sure, will do!', alt: ['klar mach ich', 'mach ich', 'klar mache ich', 'ich sag bescheid', 'ich sage bescheid', 'ich sag ihr bescheid', 'ich sage ihr bescheid'] },
    { id: 'ph.ad.gleichfalls', de: 'Danke, gleichfalls!', en: 'Thanks, you too!', note: 'The answer to «Schönen Tag noch!», «Guten Appetit!», «Frohe Weihnachten!»… It means: the same to you.', sit: 'Herr Otto wishes you a nice day. Wish it right back, in two words!', alt: ['danke gleichfalls', 'gleichfalls', 'danke ebenfalls', 'ebenfalls'] },
    // chapter 5: postcards. Lesson with Hilde
    { id: 'ph.ad.liebegruesse', de: 'Liebe Grüße!', en: 'Love, … / Best wishes! (on a card)', note: 'The warm way to end a card or a message to friends and family. (In a hurry: «LG».)', sit: 'You end a postcard to a friend. What do you write before your name?', alt: ['liebe grusse', 'lg', 'ganz liebe grusse', 'liebe grusse aus alba'] },
    { id: 'ph.ad.wiegehtsdir', de: 'Wie geht es dir?', en: 'How are you? (du)', note: 'To a friend, a kid, family: «dir». Spoken it’s often «Wie geht’s dir?».', sit: 'You write to your friend Kalle. Ask him how he’s doing.', alt: ['wie geht es dir', 'wie gehts dir', 'wie geht s dir'] },
    { id: 'ph.ad.wiegehtsihnen', de: 'Wie geht es Ihnen?', en: 'How are you? (Sie)', note: 'To someone you say «Sie» to: «Ihnen», with a capital I.', sit: 'You write to old Herr Otto. Ask him how he’s doing, politely.', alt: ['wie geht es ihnen', 'wie gehts ihnen', 'wie geht s ihnen'] },
    { id: 'ph.ad.vielegruesse', de: 'Viele Grüße!', en: 'Best regards! (on a card)', note: 'Friendly but a bit more neutral than «Liebe Grüße»: right for «Sie». Very formal letters end «Mit freundlichen Grüßen».', sit: 'You end a card to Herr Otto (you say «Sie» to him). A safe, friendly closing?', alt: ['viele grusse', 'herzliche grusse', 'mit freundlichen grussen', 'freundliche grusse'] },
    { id: 'ph.ad.bisbald', de: 'Bis bald!', en: 'See you soon!', note: 'For cards, messages and goodbyes. «Bis morgen!» is see you tomorrow.', sit: 'You’ll see Hilde again soon. End your card with that!', alt: ['bis bald', 'bis dann', 'bis spater'] },
    { id: 'ph.ad.schreibmal', de: 'Schreib mal wieder!', en: 'Write again sometime!', note: 'A classic line at the end of a German letter or card, especially to someone who doesn’t write much.', sit: 'Adi never gets letters. Ask him to write to you sometime!', alt: ['schreib mal wieder', 'schreib mir mal wieder', 'schreib bald wieder', 'schreib mal'] },
  ];
  const PH = {};
  PHRASES.forEach(p => { PH[p.id] = p; });
  if (typeof LEX !== 'undefined') {
    LEX.register(NEW_WORDS.filter(w => !LEX.item(w.id)).map(w => Object.assign({ kind: 'word' }, w)));
    LEX.register(PHRASES.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', de: p.de, en: p.en, note: p.note, region: 'Deutschland', register: 'casual', icon: 'speech', alt: { de: p.alt || [] } })));
  }
  // German number words, for counting your roll on the board
  const NUMW = { 1: ['eins'], 2: ['zwei', 'zwo'], 3: ['drei'], 4: ['vier'], 5: ['funf'], 6: ['sechs'] };
  const NUMDE = ['', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs'];

  // ================================================================ icons
  if (typeof ICONS !== 'undefined' && ICONS.add) {
    const has = k => ICONS.keys.includes(k);
    if (!has('speech')) ICONS.add('speech', (c, p, h) => {
      h.shape(c, p, cc => { cc.moveTo(-30, -24); cc.arcTo(32, -24, 32, 18, 12); cc.arcTo(32, 18, -30, 18, 12); cc.lineTo(-4, 18); cc.lineTo(-18, 32); cc.lineTo(-14, 18); cc.arcTo(-32, 18, -32, -24, 12); cc.arcTo(-32, -24, 32, -24, 12); cc.closePath(); }, '#7fd6c8');
      if (p) { h.dot(c, -12, -3, 4, h.INK); h.dot(c, 0, -3, 4, h.INK); h.dot(c, 12, -3, 4, h.INK); }
    });
    if (!has('coffee')) ICONS.add('coffee', (c, p, h) => {
      h.shape(c, p, h.ell(0, 26, 30, 7), '#fffaf0');
      h.shape(c, p, cc => { cc.moveTo(-22, -6); cc.lineTo(22, -6); cc.lineTo(16, 22); cc.lineTo(-16, 22); cc.closePath(); }, '#e86a5a');
      h.shape(c, p, cc => { cc.arc(24, 6, 8, -1.3, 1.3); }, null, 4);
      h.shape(c, p, h.ell(0, -6, 22, 5), '#6b3b25');
      if (p) [-8, 6].forEach(x => { c.beginPath(); c.moveTo(x, -16); c.quadraticCurveTo(x - 6, -24, x, -32); c.lineWidth = 2.2; c.strokeStyle = 'rgba(43,34,53,0.5)'; c.stroke(); });
    });
    if (!has('gnome')) ICONS.add('gnome', (c, p, h) => {
      h.shape(c, p, h.poly([[-20, 32], [20, 32], [14, 2], [-14, 2]]), '#3f7fc9');
      h.shape(c, p, h.ell(0, -6, 13, 12), '#f3c9a5');
      h.shape(c, p, h.poly([[-13, 0], [13, 0], [0, 26]]), '#fdf8ee');
      h.shape(c, p, h.poly([[-15, -12], [15, -12], [4, -44]]), '#d9493b');
      if (p) { h.dot(c, -5, -8, 2.2, h.INK); h.dot(c, 5, -8, 2.2, h.INK); h.dot(c, 0, -3, 3.5, '#f0a08a'); }
    });
    if (!has('garden')) ICONS.add('garden', (c, p, h) => {
      [-26, -13, 0, 13, 26].forEach(x => h.shape(c, p, h.poly([[x - 5, 30], [x + 5, 30], [x + 5, -2], [x, -9], [x - 5, -2]]), '#fdf8ee', 1.8));
      if (p) { c.fillStyle = '#fdf8ee'; c.fillRect(-32, 6, 64, 5); c.strokeStyle = h.INK; c.lineWidth = 1.6; c.strokeRect(-32, 6, 64, 5); }
      [[-16, -22, '#ff8fb1'], [4, -28, '#ffd84a'], [20, -18, '#e0503f']].forEach(([x, y, col]) => { h.shape(c, p, h.rr(x - 1.5, y, 3, 22, 1), '#4f9a45', 1.4); h.shape(c, p, h.ell(x, y, 7, 7), col, 1.6); });
    });
    if (!has('dice')) ICONS.add('dice', (c, p, h) => {
      h.shape(c, p, h.rr(-28, -28, 56, 56, 10), '#fffaf0');
      if (p) [[-14, -14], [14, -14], [0, 0], [-14, 14], [14, 14]].forEach(([x, y]) => h.dot(c, x, y, 5.5, h.INK));
    });
    if (!has('mailbox')) ICONS.add('mailbox', (c, p, h) => {
      h.shape(c, p, h.rr(-4, 4, 8, 30, 2), '#8a5f3e');
      h.shape(c, p, h.rr(-26, -26, 52, 34, 9), '#f2c14e');
      if (p) { c.fillStyle = h.INK; c.fillRect(-14, -14, 28, 4); c.beginPath(); c.arc(0, -1, 6, 0, TAU); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke(); }
    });
    if (!has('postcap')) ICONS.add('postcap', (c, p, h) => {
      h.shape(c, p, cc => { cc.moveTo(-26, 10); cc.bezierCurveTo(-28, -30, 28, -30, 26, 10); cc.closePath(); }, '#34508c');
      h.shape(c, p, h.rr(-27, 2, 54, 9, 3), '#f2c14e');
      h.shape(c, p, cc => { cc.moveTo(-24, 11); cc.quadraticCurveTo(0, 30, 34, 14); cc.lineTo(24, 11); cc.closePath(); }, '#1f2a44');
      if (p) h.dot(c, 0, -10, 5, '#f2c14e');
    });
    // (2026-11-13) faces for the panels, and the new chapters' things: a parcel, a postcard, the yellow note
    const face = (c, p, h, o) => {
      if (o.back) o.back(c, p, h);
      h.shape(c, p, h.ell(0, 6, 25, 26), o.skin);
      if (o.hair) o.hair(c, p, h);
      if (!p) return;
      if (o.happy) [-9, 9].forEach(x => { c.beginPath(); c.arc(x, 6, 4, Math.PI * 1.1, Math.PI * 1.9); c.lineWidth = 2.4; c.strokeStyle = h.INK; c.stroke(); });
      else { h.dot(c, -9, 5, 3.4, h.INK); h.dot(c, 9, 5, 3.4, h.INK); h.dot(c, -8, 4, 1.2, '#fff'); h.dot(c, 10, 4, 1.2, '#fff'); }
      h.dot(c, -16, 14, 4.5, 'rgba(255,140,154,0.55)'); h.dot(c, 16, 14, 4.5, 'rgba(255,140,154,0.55)');
      c.beginPath(); c.arc(0, 14, 6, 0.2, Math.PI - 0.2); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke();
      if (o.over) o.over(c, p, h);
    };
    if (!has('adAdi')) ICONS.add('adAdi', (c, p, h) => face(c, p, h, { skin: '#f2c39b',
      hair: (c2, p2, h2) => { h2.shape(c2, p2, cc => { cc.moveTo(-25, -6); cc.bezierCurveTo(-27, -40, 27, -40, 25, -6); cc.closePath(); }, '#34508c'); h2.shape(c2, p2, h2.rr(-26, -10, 52, 8, 3), '#f2c14e'); h2.shape(c2, p2, cc => { cc.moveTo(-22, -2); cc.quadraticCurveTo(0, 12, 30, 0); cc.lineTo(22, -3); cc.closePath(); }, '#1f2a44'); } }));
    if (!has('adHilde')) ICONS.add('adHilde', (c, p, h) => face(c, p, h, { skin: '#f1c7a5', happy: true,
      back: (c2, p2, h2) => h2.shape(c2, p2, h2.ell(0, -30, 13, 11), '#f4f1ea'),
      hair: (c2, p2, h2) => h2.shape(c2, p2, cc => { cc.moveTo(-26, 0); cc.bezierCurveTo(-28, -36, 28, -36, 26, 0); cc.quadraticCurveTo(12, -16, 0, -14); cc.quadraticCurveTo(-12, -16, -26, 0); cc.closePath(); }, '#f4f1ea') }));
    if (!has('adKalle')) ICONS.add('adKalle', (c, p, h) => face(c, p, h, { skin: '#f6d0b0',
      hair: (c2, p2, h2) => { for (let i = 0; i < 9; i++) { const a = Math.PI + 0.2 + i * 0.34; h2.shape(c2, p2, h2.ell(Math.cos(a) * 22, -8 + Math.sin(a) * 18, 9, 8), '#c8642c', 1.4); } } }));
    if (!has('adOtto')) ICONS.add('adOtto', (c, p, h) => face(c, p, h, { skin: '#e8b48c',
      hair: (c2, p2, h2) => { h2.shape(c2, p2, h2.rr(-30, -18, 60, 7, 3), '#5b4a3a'); h2.shape(c2, p2, h2.rr(-18, -36, 36, 20, 6), '#5b4a3a'); },
      over: c2 => { c2.fillStyle = '#f4f1ea'; c2.beginPath(); c2.ellipse(-7, 11, 8, 3.5, 0.3, 0, TAU); c2.ellipse(7, 11, 8, 3.5, -0.3, 0, TAU); c2.fill(); } }));
    if (!has('adParcel')) ICONS.add('adParcel', (c, p, h) => {
      h.shape(c, p, h.poly([[-30, -6], [0, -20], [30, -6], [0, 8]]), '#e3b878');
      h.shape(c, p, h.poly([[-30, -6], [0, 8], [0, 34], [-30, 20]]), '#c99a5a');
      h.shape(c, p, h.poly([[0, 8], [30, -6], [30, 20], [0, 34]]), '#d8aa68');
      if (p) { c.strokeStyle = '#8a5f3e'; c.lineWidth = 3; c.beginPath(); c.moveTo(-15, -13); c.lineTo(15, 1); c.lineTo(15, 27); c.stroke(); h.shape(c, 1, h.rr(-24, 2, 16, 10, 2), '#fffaf0', 1.2); }
    });
    if (!has('adCard')) ICONS.add('adCard', (c, p, h) => {
      h.shape(c, p, h.rr(-34, -22, 68, 46, 4), '#fffaf0');
      if (p) { c.strokeStyle = h.INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(2, -16); c.lineTo(2, 18); c.stroke(); [-12, -4, 4, 12].forEach(y => { c.beginPath(); c.moveTo(-28, y); c.lineTo(-6, y); c.stroke(); });
        h.shape(c, 1, h.rr(18, -18, 12, 14, 1), '#e0503f', 1.2); [0, 8, 16].forEach(y => { c.beginPath(); c.moveTo(8, y); c.lineTo(30, y); c.stroke(); }); }
    });
    if (!has('adNote')) ICONS.add('adNote', (c, p, h) => {
      h.shape(c, p, h.rr(-26, -32, 52, 64, 3), '#f2c14e');
      if (p) { c.fillStyle = h.INK; c.font = '800 11px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.fillText('Leider nicht', 0, -14); c.fillText('angetroffen', 0, -2); c.strokeStyle = h.INK; c.lineWidth = 1.4; [12, 22].forEach(y => { c.beginPath(); c.moveTo(-18, y); c.lineTo(18, y); c.stroke(); }); }
    });
  }

  // ================================================================ lines (lines.js's format: de [simpler, richer], en with weave slots)
  // German only, A1–A2, and nobody assumes the player's gender. {n} and {mimo} are filled in here.
  const LT = {
    // meeting Adi
    'adi.hello': { de: ['Na? Du bist neu hier, oder?', 'Na? Dich kenne ich noch nicht. Du bist neu in Alba, oder?'], en: ['«Na?» You’re new here, aren’t you?', '«Na?» I don’t know you yet. You’re new in Alba, aren’t you?'] },
    'adi.name': { de: ['Ich bin Adolf. Ich bringe die Post.', 'Ich bin Adolf, der Briefträger. Ich bringe allen in Alba die Post.'], en: ['I’m Adolf. I bring the mail.', 'I’m Adolf, the postman. I bring everybody in Alba their mail.'] },
    'adi.sigh': { de: ['… Ja, ich weiß. Der Name. *seufz*', '… Ja, ich weiß, ich weiß. Der Name. *seufz* Meine Oma wollte unbedingt den Namen von ihrem Onkel.'], en: ['… Yes, I know. The name. *sigh*', '… Yes, I know, I know. The name. *sigh* My grandma really wanted me to have her uncle’s name.'] },
    'adi.call': { de: ['Sag einfach Adi! Alle sagen Adi.', 'Sag einfach Adi! Alle hier sagen Adi. Sogar meine Oma, inzwischen.'], en: ['Just call me Adi! Everybody does.', 'Just call me Adi! Everybody here does. Even my grandma, these days.'] },
    'adi.na': { de: ['«Na?» heißt: Hallo, wie geht’s? Sag es mal!', '«Na?» ist ein kleines Hallo: Hallo, wie geht’s, alles in einem Wort. Sag es mal!'], en: ['«Na?» means: hi, how’s it going? Try it!', '«Na?» is a little hello: hi, how are you, all in one word. Go on, say it!'] },
    'adi.na.back': { de: ['Na! Siehst du? Ganz einfach.', 'Na! Siehst du? Ganz einfach. Jetzt bist du fast schon aus Alba!'], en: ['«Na!» See? Easy.', '«Na!» See? Easy. Now you’re almost from Alba!'] },
    'adi.greet.adi': { de: ['Genau! Adi! Hallo!', 'Genau! Adi! Hallo, hallo!'], en: ['«Genau!» Adi! {w.hello}!', '«Genau!» Adi! {w.hello}, {w.hello}!'] },
    'adi.greet.adolf': { de: ['Adi reicht! Wirklich. Aber danke.', 'Adi reicht, wirklich! … Aber danke, das ist sehr höflich.'], en: ['Adi is fine! Really. But thanks.', 'Adi is fine, really! … But thank you, that’s very polite.'] },
    'adi.greet.other': { de: ['Hallo! Schön, dich zu sehen!'], en: ['{w.hello}! Nice to see you!'] },
    'adi.later': { de: ['Du trainierst mit Bruno? Super! Komm danach wieder.', 'Du trainierst mit Bruno? Super! Komm danach wieder, dann habe ich vielleicht Arbeit für dich.'], en: ['You’re training with Bruno? Great! Come back afterwards.', 'You’re training with Bruno? Great! Come back afterwards, maybe I’ll have some work for you then.'] },
    // the job
    'adi.busy': { de: ['Mensch, heute habe ich so viele Briefe!', 'Mensch, heute habe ich so viele Briefe! Seit der Stille schreiben die Leute weniger … aber heute schreiben alle!'], en: ['«Mensch», I have so many {w.letter:pl} today!', '«Mensch», I have so many {w.letter:pl} today! Since the Hush, people write less… but today everybody wrote!'] },
    'adi.help': { de: ['Hilfst du mir? Bring fünf Briefe für mich.', 'Kannst du mir helfen? Bring bitte fünf Briefe für mich. Dann bin ich schneller fertig.'], en: ['Will you help me? Deliver five {w.letter:pl} for me.', 'Can you help me? Please deliver five {w.letter:pl} for me. Then I’ll be done sooner.'] },
    'adi.how': { de: ['Lies die Adresse. Und frag die Leute: «Wo wohnt …?»', 'Lies einfach die Adresse auf dem Brief. Und wenn du nicht weißt, wo jemand wohnt, frag die Leute: «Wo wohnt …?»'], en: ['Read the address. And ask people: «Wo wohnt …?»', 'Just read the address on the {w.letter}. And if you don’t know where someone lives, ask people: «Wo wohnt …?» (where does … live?)'] },
    'adi.give': { de: ['Hier, fünf Briefe. Alles klar?', 'Hier sind die fünf Briefe. Der erste ist für Frau Rosa, am Obststand. Alles klar?'], en: ['Here, five {w.letter:pl}. «Alles klar?»', 'Here are the five {w.letter:pl}. The first one is for Rosa, at the fruit stall. «Alles klar?»'] },
    'adi.klar': { de: ['«Alles klar?» heißt: Ist alles gut? Und die Antwort: «Alles klar!»', '«Alles klar?» heißt: Ist alles gut, verstanden? Und die Antwort ist ganz einfach: «Alles klar!»'], en: ['«Alles klar?» means: all good? And the answer: «Alles klar!»', '«Alles klar?» means: all good, got it? And the answer is simply: «Alles klar!»'] },
    'adi.bye': { de: ['Super! Bis später! Tschüss!', 'Super! Ich mache den Rest der Runde. Danach ist Feierabend, in meinem Garten. Tschüss!'], en: ['Great! See you later! «Tschüss!»', 'Great! I’ll do the rest of my round. After that it’s «Feierabend» in my {w.garden}. «Tschüss!»'] },
    'adi.left': { de: ['Noch {n} Briefe. Du schaffst das!', 'Noch {n} Briefe! Du schaffst das. Und frag ruhig: «Wo wohnt …?»'], en: ['{n} more {w.letter:pl}. You can do it!', '{n} more {w.letter:pl}! You can do it. And just ask: «Wo wohnt …?»'] },
    'adi.home': { de: ['Alle Briefe? Super! Komm in meinen Garten. Feierabend!', 'Alle Briefe? Super! Komm in meinen Garten, hinter den Häusern neben der Schule. Feierabend!'], en: ['All the {w.letter:pl}? Great! Come to my {w.garden}. «Feierabend!»', 'All the {w.letter:pl}? Great! Come to my {w.garden}, behind the houses next to the school. «Feierabend!»'] },
    // small talk on his round (one per chat, in turn)
    'adi.chat1': { de: ['Für Pipa habe ich immer ein Leckerli dabei.', 'Für Pipa, den Hund von Leo, habe ich immer ein Leckerli in der Tasche. Pssst!'], en: ['I always have a treat with me for Pipa.', 'I always keep a treat in my bag for Pipa, Leo’s dog. Shh!'] },
    'adi.chat2': { de: ['Jeder Brief ist ein kleines Geschenk.', 'Jeder Brief ist ein kleines Geschenk. Jemand wollte dir etwas sagen!'], en: ['Every {w.letter} is a little present.', 'Every {w.letter} is a little present. Someone wanted to tell you something!'] },
    'adi.chat3': { de: ['Mahlzeit! … Ach, es ist noch nicht Mittag? Egal!'], en: ['«Mahlzeit!» … Oh, it’s not lunchtime yet? Never mind!'] },
    'adi.chat4': { de: ['Die Stille mag keine Briefe. Ich bringe trotzdem jeden.', 'Die Stille mag keine Briefe, glaube ich. Aber ich bringe jeden einzelnen. Mit einem Lächeln!'], en: ['The Hush doesn’t like {w.letter:pl}. I deliver every one anyway.', 'I don’t think the Hush likes {w.letter:pl}. But I deliver every single one. With a smile!'] },
    'adi.chat5': { de: ['Mein Garten ist hinter den Häusern. Komm mal vorbei!', 'Mein Garten ist hinter den Häusern, neben der Schule. Komm mal vorbei!'], en: ['My {w.garden} is behind the houses. Drop by!', 'My {w.garden} is behind the houses, next to the school. Drop by sometime!'] },
    // the five letters: the people who get them
    'rosa.get': { de: ['Ein Brief für mich? Ach, wie schön! Danke!', 'Ein Brief für mich? Ach, wie schön! Der ist von meiner Schwester. Danke!'], en: ['A {w.letter} for me? Oh, how lovely! {c.thanks}!', 'A {w.letter} for me? Oh, how lovely! It’s from my sister. {c.thanks}!'] },
    'rosa.bye': { de: ['Schönen Tag noch!'], en: ['«Schönen Tag noch!»'] },
    'rosa.back': { de: ['Danke, gleichfalls!'], en: ['{c.thanks}, you too!'] },
    'lucas.q': { de: ['Für den Bäcker? Bin ich gemeint?', 'Für den Bäcker? Bin ich gemeint? Na ja, ich backe ja Brot …'], en: ['For the baker? Do you mean me?', 'For the baker? You mean me? Well, I do bake {w.bread}…'] },
    'lucas.get': { de: ['Danke! Das ist mein neues Rezept!', 'Danke! Endlich! Das ist mein neues Rezept. Für Mohnkuchen!'], en: ['{c.thanks}! It’s my new recipe!', '{c.thanks}! Finally! It’s my new recipe. For poppy-seed {w.cake}!'] },
    'marta.gotcha': { de: ['Für den Bäcker? Ich bin die Bäckerin! Der Bäcker ist Lucas.', 'Für den Bäcker? Nein, nein, ich bin die Bäckerin! Der Bäcker ist Lucas, am Brotstand auf dem Markt.'], en: ['For «den Bäcker»? I’m «die Bäckerin»! The baker is Lucas.', 'For «den Bäcker»? No, no, I’m «die Bäckerin», the woman baker! «Der Bäcker» is Lucas, at the bread stall in the market.'] },
    'marta.ok': { de: ['Genau! Bäcker und Bäckerin. Viel Glück!'], en: ['«Genau!» Bäcker and Bäckerin. Good luck!'] },
    'blue.who': { de: ['Ja, bitte? Wer ist da?'], en: ['Yes? Who’s there?'] },
    'blue.get': { de: ['Ein Brief für uns? Oh, danke schön!', 'Ein Brief für uns? Oh, danke schön! Der ist bestimmt von Teo. Er schreibt mir jede Woche!'], en: ['A {w.letter} for us? Oh, {c.thanks}!', 'A {w.letter} for us? Oh, {c.thanks}! It must be from Teo. He writes to me every week!'] },
    'blue.bye': { de: ['Tschüss!', 'Tschüss! Und grüß Adi von mir!'], en: ['«Tschüss!»', '«Tschüss!» And say hi to Adi for me!'] },
    'hugo.no': { de: ['Ein Brief für mich? Nein, der ist nicht für mich.', 'Ein Brief für mich? Nein, nein. Ich bekomme nie Briefe. Der ist nicht für mich.'], en: ['A {w.letter} for me? No, that’s not for me.', 'A {w.letter} for me? No, no. I never get {w.letter:pl}. That’s not for me.'] },
    'hugo.get': { de: ['Doch? Wirklich? … Von meinem Sohn! Danke!', 'Doch? Wirklich? Lass mal sehen … Von meinem Sohn! Mensch, danke!'], en: ['«Doch»? Really? … From my son! {c.thanks}!', '«Doch»? Really? Let me see… From my son! «Mensch», {c.thanks}!'] },
    'bruno.get': { de: ['Ein Brief für mich? Danke! Mahlzeit!', 'Ein Brief für den Trainer? Danke! Ich mache gerade Pause. Mahlzeit!'], en: ['A {w.letter} for me? {c.thanks}! «Mahlzeit!»', 'A {w.letter} for the coach? {c.thanks}! I’m on my break. «Mahlzeit!»'] },
    'bruno.after': { de: ['Ha! Gut! So sagt man das bei der Arbeit.'], en: ['Ha! Good! That’s what you say at work.'] },
    // asking where someone lives
    'ask.huh': { de: ['Hm? Wen suchst du? Frag: «Wo wohnt …?»'], en: ['Hm? Who are you looking for? Ask: «Wo wohnt …?»'] },
    'ask.nobody': { de: ['Hm, den kenne ich nicht. Lies die Adresse noch mal!'], en: ['Hm, I don’t know them. Read the address again!'] },
    'ask.baeckerin': { de: ['Die Bäckerin? Das ist Marta, in der Bäckerei. Aber der Bäcker ist Lucas!'], en: ['«Die Bäckerin»? That’s Marta, in the bakery. But «der Bäcker» is Lucas!'] },
    // Feierabend: Kaffee und Kuchen
    'party.hi': { de: ['Da bist du ja! Alle fünf Briefe? Mensch!', 'Da bist du ja! Alle fünf Briefe? Mensch, du bist schneller als ich!'], en: ['There you are! All five {w.letter:pl}? «Mensch!»', 'There you are! All five {w.letter:pl}? «Mensch», you’re faster than me!'] },
    'party.fa': { de: ['Und jetzt: Feierabend!', 'Und jetzt: Feierabend! Kein Brief mehr bis morgen.'], en: ['And now: «Feierabend!»', 'And now: «Feierabend!» No more {w.letter:pl} until tomorrow.'] },
    'party.friends': { de: ['Das sind meine Nachbarn: Hilde und Kalle.'], en: ['These are my neighbors: Hilde and Kalle.'] },
    'hilde.hi': { de: ['Hallo! Setz dich, setz dich!'], en: ['{w.hello}! Sit down, sit down!'] },
    'kalle.hi': { de: ['Na? Alles klar?'], en: ['«Na?» «Alles klar?»'] },
    'party.cake': { de: ['Kaffee und Kuchen! Möchtest du Kuchen?', 'Kaffee und Kuchen, wie jeden Tag! Möchtest du ein Stück Kuchen?'], en: ['{w.coffee} and {w.cake}! Would you like some {w.cake}?', '{w.coffee} and {w.cake}, like every day! Would you like a piece of {w.cake}?'] },
    'party.nein': { de: ['Nein? Doch, doch! Ein kleines Stück!'], en: ['No? Oh yes, yes, «doch»! Just a small piece!'] },
    'party.ja': { de: ['Bitte schön!'], en: ['Here you go!'] },
    'party.appetit': { de: ['Guten Appetit!'], en: ['«Guten Appetit!»'] },
    'hilde.lecker': { de: ['Und? Lecker?', 'Und? Ist er lecker? Das ist mein Rezept!'], en: ['Well? «Lecker»?', 'Well? Is it yummy? It’s my recipe!'] },
    'hilde.knew': { de: ['Hihi! Ich weiß.'], en: ['Hee hee! I know.'] },
    'party.game': { de: ['Und jetzt: «Mensch ärgere dich nicht»!', 'Und jetzt spielen wir «Mensch ärgere dich nicht»! Spielst du mit?'], en: ['And now: «Mensch ärgere dich nicht»!', 'And now we play «Mensch ärgere dich nicht»! Will you play?'] },
    'hilde.warn': { de: ['Ich gewinne immer!', 'Ich warne dich: Ich gewinne immer!'], en: ['I always win!', 'I’m warning you: I always win!'] },
    // after a game
    'kalle.prost': { de: ['Prost!', 'Prost! Das geht auch mit Kaffee!'], en: ['«Prost!»', '«Prost!» Works with {w.coffee} too!'] },
    'kalle.naja': { de: ['Ich habe verloren. Na ja …'], en: ['I lost. «Na ja…»'] },
    'adi.won.you': { de: ['Gut gemacht! Mensch, du bist gut!'], en: ['«Gut gemacht!» «Mensch», you’re good!'] },
    'cap.give': { de: ['Für {mimo}: eine Postmütze!', 'Und das ist für {mimo}: meine alte Postmütze! Für die beste Hilfe in Alba.'], en: ['For {mimo}: a postman’s {w.cap}!', 'And this is for {mimo}: my old postman’s {w.cap}! For the best help in Alba.'] },
    'cap.look': { de: ['Steht dir super!', 'Steht dir super, {mimo}! Jetzt gehörst du zur Post.'], en: ['Looks great on you!', 'Looks great on you, {mimo}! Now you’re part of the post office.'] },
    'adi.again': { de: ['Schade! Ein andermal!'], en: ['«Schade!» Another time!'] },
    'adi.thanks': { de: ['Danke! Das war schön!', 'Danke! Das war ein schöner Feierabend!'], en: ['{c.thanks}! That was lovely!', '{c.thanks}! What a lovely evening!'] },
    // the neighbours at the table
    'hilde.idle1': { de: ['Ich stricke einen Schal für Adi. Pssst!', 'Ich stricke einen Schal für Adi. Gelb, wie die Post! Pssst, nichts sagen!'], en: ['I’m knitting a scarf for Adi. Shh!', 'I’m knitting a scarf for Adi. Yellow, like the post! Shh, don’t tell him!'] },
    'hilde.idle2': { de: ['Spielst du mit? Ich gewinne immer!'], en: ['Want to play? I always win!'] },
    'hilde.away': { de: ['Adi ist noch auf seiner Runde. Wir warten hier.'], en: ['Adi’s still on his round. We’re waiting here.'] },
    'kalle.idle1': { de: ['Na? Alles klar?'], en: ['«Na?» «Alles klar?»'] },
    'kalle.idle2': { de: ['Kreuzworträtsel! Ein Wort für „nicht laut“? Hmm … „leise“!', 'Kreuzworträtsel! Ein Wort mit fünf Buchstaben für „nicht laut“? Hmm … „leise“!'], en: ['A crossword! A word for “not loud”? Hmm… «leise»!', 'A crossword! A five-letter word for “not loud”? Hmm… «leise»!'] },
    // more rounds, practice, the menu
    'round.give': { de: ['Hier, drei Briefe! Alles klar?'], en: ['Here, three {w.letter:pl}! «Alles klar?»'] },
    'round.done': { de: ['Alle drei? Super! Hier, für dich.', 'Alle drei? Super, danke! Hier, ein paar Münzen für dich.'], en: ['All three? Great! Here, for you.', 'All three? Great, {c.thanks}! Here, a few {w.coin:pl} for you.'] },
    'adi.quiz': { de: ['Weißt du noch?'], en: ['Do you remember?'] },
    'adi.practice': { de: ['Üben wir! Was sagst du …?'], en: ['Let’s practice! What do you say…?'] },
    'adi.tschuess': { de: ['Tschüss! Schönen Tag noch!'], en: ['«Tschüss!» «Schönen Tag noch!»'] },
    'adi.play': { de: ['Eine Runde? Na klar! Komm, in den Garten!'], en: ['A round? Sure! Come on, to the {w.garden}!'] },
    'adi.capoff': { de: ['Pause für die Mütze? Alles klar!'], en: ['A break for the {w.cap}? «Alles klar!»'] },
    'adi.capon': { de: ['Die Mütze! Steht dir super!'], en: ['The {w.cap}! Looks great on you!'] },
    'rcpt.thanks': { de: ['Ein Brief für mich? Danke!', 'Ein Brief für mich? Oh, wie schön! Danke schön!'], en: ['A {w.letter} for me? {c.thanks}!', 'A {w.letter} for me? Oh, how lovely! {c.thanks}!'] },
    // (2026-11-13) the chapters' gates
    'adi.busy0': { de: ['Na? Ich habe gerade so viel zu tun! Später, ja?'], en: ['«Na?» I’m so busy right now! Later, OK?'] },
    'adi.home.later': { de: ['Alle Briefe? Super, danke! Feierabend machen wir ein andermal. Heute ist noch so viel los!'], en: ['All the {w.letter:pl}? Great, thanks! We’ll have our «Feierabend» another time. There’s still so much going on today!'] },
    'adi.later.ch': { de: ['Bald! Erst dein Abenteuer. Die Post wartet.'], en: ['Soon! Your adventure first. The mail can wait.'] },
    'adi.round.first': { de: ['Hast du Zeit? Ich habe eine kleine Runde für dich: drei Briefe. Lies die Adressen gut!'], en: ['Have you got time? I have a little round for you: three {w.letter:pl}. Read the addresses carefully!'] },
    // chapter 4: a parcel day
    'c4.adi.pakete': { de: ['Mensch! Heute habe ich keine Briefe. Nur Pakete! Hilfst du mir?'], en: ['«Mensch!» No {w.letter:pl} today. Only parcels! Will you help me?'] },
    'c4.adi.lesson': { de: ['Pakete sind anders. Da muss man fragen, unterschreiben … Ich zeig’s dir.'], en: ['Parcels are different. You have to ask, get signatures… I’ll show you.'] },
    'c4.adi.otto': { de: ['Zuerst: ein Einschreiben für Herrn Otto. Er sitzt am Platz.'], en: ['First: a registered letter for Herr Otto. He’s sitting on the square.'] },
    'c4.otto.hi': { de: ['Ein Einschreiben? Für mich? Wie spannend!'], en: ['A registered letter? For me? How exciting!'] },
    'c4.otto.sign': { de: ['Mit Vergnügen. Otto, mit einem großen O!'], en: ['With pleasure. Otto, with a big O!'] },
    'c4.otto.bye': { de: ['Danke schön! Schönen Tag noch!'], en: ['Thank you! «Schönen Tag noch!»'] },
    'c4.adi.kalle': { de: ['Jetzt ein Paket für Kalle. Klingel mal!'], en: ['Now a parcel for Kalle. Ring the bell!'] },
    'c4.adi.nachbar': { de: ['Kalle ist nicht da. Kein Problem! Wir fragen die Nachbarin.'], en: ['Kalle isn’t home. No problem! We’ll ask the neighbor.'] },
    'c4.adi.typisch': { de: ['Das machen alle in Deutschland: Pakete für die Nachbarn annehmen.'], en: ['Everybody in Germany does it: taking in parcels for the neighbors.'] },
    'c4.hilde.yes': { de: ['Natürlich! Ich nehme alle Pakete an. Ich bin ja immer zu Hause … und stricke.'], en: ['Of course! I take in all the parcels. I’m always home anyway… knitting.'] },
    'c4.adi.zettel': { de: ['Jetzt der Zettel für Kalles Tür. Sonst sucht er sein Paket!'], en: ['Now the note for Kalle’s door. Otherwise he’ll go looking for his parcel!'] },
    'c4.hilde.send': { de: ['Und kannst du mein Paket mitnehmen? Ein Schal für meine Schwester Erika, in Bremen.'], en: ['And can you take my parcel along? A scarf for my sister Erika, in Bremen.'] },
    'c4.adi.addr': { de: ['Name, dann Straße und Hausnummer, dann Postleitzahl und Ort. In der Reihenfolge!'], en: ['Name, then street and house number, then postcode and town. In that order!'] },
    'c4.kalle.mumble': { de: ['Mmh … hamm … Pagget für mmich?'], en: ['Mmh… gotta… parshel for mme?'] },
    'c4.adi.zahnarzt': { de: ['Kalle war beim Zahnarzt. Sein Mund ist noch ganz taub!'], en: ['Kalle was at the dentist. His mouth is still all numb!'] },
    'c4.kalle.clear': { de: ['Ist ein Paket für mich da?'], en: ['Is there a parcel for me?'] },
    'c4.kalle.achso': { de: ['Ach so! Bei Hilde! Sagst du ihr Bescheid? Ich komme gleich.'], en: ['Oh, I see! At Hilde’s! Will you let her know? I’m coming right over.'] },
    'c4.kalle.danke': { de: ['Super! Danke dir!'], en: ['Great! Thanks!'] },
    'c4.adi.done': { de: ['Mensch, das hast du toll gemacht! Hier, für dich.'], en: ['«Mensch», you did great! Here, this is for you.'] },
    'c4.adi.worry': { de: ['Komisch … heute kein einziger Brief. Nur Pakete. Schreiben die Leute nicht mehr?'], en: ['Strange… not a single {w.letter} today. Only parcels. Don’t people write anymore?'] },
    // chapter 5: the letters stop
    'c5.adi.leer': { de: ['Schau mal: meine Tasche ist leer. Kein Brief. Seit Tagen.'], en: ['Look: my bag is empty. Not one {w.letter}. For days.'] },
    'c5.hilde.frueher': { de: ['Früher haben alle geschrieben. Postkarten aus dem Urlaub, Briefe zum Geburtstag …'], en: ['People used to write. Postcards from vacation, {w.letter:pl} for birthdays…'] },
    'c5.kalle.stille': { de: ['Das ist die Stille. Die Leute vergessen das Schreiben. Mir fällt auch nichts mehr ein.'], en: ['That’s the Hush. People forget how to write. I can’t think of anything either.'] },
    'c5.adi.sad': { de: ['Ein Briefträger ohne Briefe … *seufz*'], en: ['A postman without {w.letter:pl}… *sigh*'] },
    'c5.hilde.idea': { de: ['Dann schreiben wir eben! Postkarten! Ich zeige dir, wie man eine schöne Karte schreibt.'], en: ['Then we’ll just write! Postcards! I’ll show you how to write a lovely card.'] },
    'c5.hilde.du': { de: ['Ach, und sag doch du zu mir. Wir sind doch Nachbarn!'], en: ['Oh, and say «du» to me. We’re neighbors, after all!'] },
    'c5.hilde.du2': { de: ['Schön! Also: Hilde. Nur Hilde.'], en: ['Lovely! So: Hilde. Just Hilde.'] },
    'c5.hilde.cards': { de: ['Drei Karten: für Kalle, für Herrn Otto und … für mich!'], en: ['Three cards: for Kalle, for Herr Otto and… for me!'] },
    'c5.adi.post': { de: ['Drei Karten! Ab in den Briefkasten!'], en: ['Three cards! Into the {w.mailbox}!'] },
    'c5.kalle.reads': { de: ['Eine Karte! «Lieber Kalle» … Mensch! Ich schreibe auch eine. An Hilde!'], en: ['A card! «Lieber Kalle»… «Mensch!» I’ll write one too. To Hilde!'] },
    'c5.adi.otto': { de: ['Und Herr Otto schreibt zurück: „Mir geht es gut! Danke für die Karte!“'], en: ['And Herr Otto writes back: “I’m well! Thank you for the card!”'] },
    'c5.adi.letters': { de: ['Briefe! Überall Briefe! Alba schreibt wieder!'], en: ['{w.letter:pl}! {w.letter:pl} everywhere! Alba is writing again!'] },
    'c5.hilde.forAdi': { de: ['Und einer ist für dich, Adi. Von mir. Mit einem Schal. Gelb, wie die Post!'], en: ['And one is for you, Adi. From me. With a scarf. Yellow, like the post!'] },
    'c5.adi.forme': { de: ['Für … mich? Ein Brief für MICH? Der erste seit Jahren!'], en: ['For… me? A {w.letter} for ME? The first in years!'] },
    'c5.adi.thanks': { de: ['Danke. Danke euch allen.'], en: ['Thank you. Thank you all.'] },
    'c5.adi.card': { de: ['Und das ist für dich: eine Postkarte. Von mir!'], en: ['And this is for you: a postcard. From me!'] },
  };
  if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES['adolf.' + k]) LINES['adolf.' + k] = v;     // (window.line / STORY.sayAt can say them as 'adolf.<key>')
  // a line for your level (lines.js's way: tier 1 → the simpler one), with {n}, {mimo} filled in
  function lineOf(key, vars = {}) {
    const L = typeof key === 'string' ? LT[key] : key; if (!L) return { text: String(key), en: String(key), weave: String(key) };
    const tier = typeof LEX !== 'undefined' ? LEX.tier() : 1, arr = L.de, i = Math.min(arr.length, Math.max(1, tier)) - 1, en = L.en || [''];
    const v = Object.assign({ mimo: (G && G.state && G.state.mimoName) || 'Mimo' }, vars);
    return { text: fillVars(arr[i], v), en: fillVars(en[Math.min(en.length - 1, i)], v), weave: fillVars(en[en.length - 1], v) };
  }

  // ================================================================ the letters
  // to: who gets it (npc: a story villager in sim; town: one of town.js's people; door: the blue house's door).
  // g / noun: the person in the address, for «für + accusative» (der → den, die and das stay); mit: «mit + dative»;
  // names: other ways to name them; key: what asking about them sounds like (canon()'d); nom: how you'd ask («Wo wohnt
  // der Bäcker?»: the subject, so der); where: the answer.
  const ACC = { m: 'den', f: 'die', n: 'das', pl: 'die' }, DAT = { m: 'dem', f: 'der', n: 'dem', pl: 'den' };
  const QUEST_LETTERS = [
    { id: 'rosa', addr: 'An Frau Rosa', npc: 'rosa', name: 'Oma Rosa', top: 1.85, polite: true, names: ['frau rosa', 'oma rosa', 'rosa'], key: /\brosa\b/,
      nom: 'Frau Rosa', model: 'Ein Brief für Sie!', modelEn: 'A letter for you!',
      where: { de: ['Frau Rosa? Die steht am Obststand, neben Noas Haus.'], en: ['Rosa? She’s at the fruit stall, next to Noa’s house.'] } },
    { id: 'baecker', addr: 'Für den Bäcker', town: 'lucas', g: 'm', noun: 'backer', word: 'Bäcker', names: ['lucas'], key: /\bbacker\b|\blucas\b/,
      nom: 'der Bäcker', model: 'Ein Brief für den Bäcker!', modelEn: 'A letter for the baker!',
      where: { de: ['Der Bäcker? Das ist Lucas. Er steht am Brotstand, auf dem Markt.'], en: ['The baker? That’s Lucas. He’s at the bread stall, in the market.'] } },
    { id: 'blau', addr: 'An die Familie im blauen Haus', door: 'blue', g: 'f', noun: 'familie', word: 'Familie', group: true, names: [], key: /\bblau|\bfamilie\b/,
      nom: 'die Familie im blauen Haus', model: 'Post für Sie!', modelEn: 'Mail for you!',
      where: { de: ['Das blaue Haus? Das ist in der Nordstraße, gleich beim Platz.'], en: ['The blue {w.house}? It’s on the north street, right by the square.'] } },
    { id: 'besen', addr: 'Für den Mann mit dem Besen', town: 'hugo', g: 'm', noun: 'mann', word: 'Mann', mit: { g: 'm', noun: 'besen', word: 'Besen' }, names: ['hugo'], key: /\bbesen\b|\bhugo\b/,
      nom: 'der Mann mit dem Besen', model: 'Ein Brief für Sie!', modelEn: 'A letter for you!',
      where: { de: ['Der Mann mit dem Besen? Das ist Hugo. Er fegt vor dem Gasthaus.'], en: ['The man with the broom? That’s Hugo. He sweeps in front of the inn.'] } },
    { id: 'trainer', addr: 'An den Trainer', npc: 'bruno', name: 'Bruno', top: 2.05, g: 'm', noun: 'trainer', word: 'Trainer', names: ['bruno'], key: /\btrainer\b|\bbruno\b/,
      nom: 'der Trainer', model: 'Ein Brief für den Trainer!', modelEn: 'A letter for the coach!',
      where: { de: ['Der Trainer? Das ist Bruno! Er ist in seinem Hof, beim Glockenturm.'], en: ['The coach? That’s Bruno! He’s in his yard, by the bell {w.tower}.'] } },
  ];
  // after the quest: Adi's little rounds (three of these, picked at random)
  const POOL = [
    { id: 'vera', addr: 'Für die Frau mit den Blumen', town: 'vera', g: 'f', noun: 'frau', word: 'Frau', mit: { g: 'pl', noun: 'blumen', word: 'Blumen' }, names: ['vera'], key: /\bblumen\b|\bvera\b/, nom: 'die Frau mit den Blumen',
      where: { de: ['Die Frau mit den Blumen? Das ist Vera, am Blumenstand.'], en: ['The woman with the flowers? That’s Vera, at the flower stall.'] } },
    { id: 'sofia', addr: 'Für die Frau mit der Brille', town: 'sofia', g: 'f', noun: 'frau', word: 'Frau', mit: { g: 'f', noun: 'brille', word: 'Brille' }, names: ['sofia'], key: /\bbrille\b|\bsofia\b/, nom: 'die Frau mit der Brille',
      where: { de: ['Die Frau mit der Brille? Das ist Sofia, am Käsestand.'], en: ['The woman with the glasses? That’s Sofia, at the cheese stall.'] } },
    { id: 'jonas', addr: 'Für den Mann mit dem Bart', town: 'jonas', g: 'm', noun: 'mann', word: 'Mann', mit: { g: 'm', noun: 'bart', word: 'Bart' }, names: ['jonas'], key: /\bbart\b|\bjonas\b/, nom: 'der Mann mit dem Bart',
      where: { de: ['Der Mann mit dem Bart? Das ist Jonas, am Stand mit den Töpfen.'], en: ['The man with the beard? That’s Jonas, at the stall with the pots.'] } },
    { id: 'tito', addr: 'Für den Mann mit der Gitarre', town: 'tito', g: 'm', noun: 'mann', word: 'Mann', mit: { g: 'f', noun: 'gitarre', word: 'Gitarre' }, names: ['tito'], key: /\bgitarre\b|\btito\b/, nom: 'der Mann mit der Gitarre',
      where: { de: ['Der Mann mit der Gitarre? Das ist Tito. Er spielt auf dem Platz.'], en: ['The man with the guitar? That’s Tito. He plays on the square.'] } },
    { id: 'lena', addr: 'Für die Frau mit der Gießkanne', town: 'lena', g: 'f', noun: 'frau', word: 'Frau', mit: { g: 'f', noun: 'giesskanne', word: 'Gießkanne' }, names: ['lena'], key: /\bgiesskanne\b|\bgiskanne\b|\blena\b/, nom: 'die Frau mit der Gießkanne',
      where: { de: ['Die Frau mit der Gießkanne? Das ist Lena. Sie gießt die Blumen in der Weststraße.'], en: ['The woman with the watering can? That’s Lena. She waters the flowers on the west street.'] } },
    { id: 'clara', addr: 'Für die Dame mit dem Stock', town: 'clara', g: 'f', noun: 'dame', word: 'Dame', mit: { g: 'm', noun: 'stock', word: 'Stock' }, names: ['clara'], key: /\bstock\b|\bclara\b/, nom: 'die Dame mit dem Stock', polite: true,
      where: { de: ['Die Dame mit dem Stock? Das ist Clara. Sie geht in der Hauptstraße spazieren.'], en: ['The lady with the walking stick? That’s Clara. She takes walks on the main street.'] } },
    { id: 'paula', addr: 'Für die Frau mit dem Korb', town: 'paula', g: 'f', noun: 'frau', word: 'Frau', mit: { g: 'm', noun: 'korb', word: 'Korb' }, names: ['paula'], key: /\bkorb\b|\bpaula\b/, nom: 'die Frau mit dem Korb',
      where: { de: ['Die Frau mit dem Korb? Das ist Paula. Sie geht oft zum Markt.'], en: ['The woman with the basket? That’s Paula. She often walks to the market.'] } },
    { id: 'marco', addr: 'Für den Mann mit der Schubkarre', town: 'marco', g: 'm', noun: 'mann', word: 'Mann', mit: { g: 'f', noun: 'schubkarre', word: 'Schubkarre' }, names: ['marco'], key: /\bschubkarre\b|\bmarco\b/, nom: 'der Mann mit der Schubkarre',
      where: { de: ['Der Mann mit der Schubkarre? Das ist Marco, in der Oststraße.'], en: ['The man with the wheelbarrow? That’s Marco, on the east street.'] } },
    { id: 'mila', addr: 'Für die Frau mit dem Gemüse', town: 'mila', g: 'f', noun: 'frau', word: 'Frau', mit: { g: 'n', noun: 'gemuse', word: 'Gemüse' }, names: ['mila'], key: /\bgemuse\b|\bmila\b/, nom: 'die Frau mit dem Gemüse',
      where: { de: ['Die Frau mit dem Gemüse? Das ist Mila, am Gemüsestand.'], en: ['The woman with the vegetables? That’s Mila, at the vegetable stall.'] } },
    { id: 'rita', addr: 'Für die Frau mit der Wäsche', town: 'rita', g: 'f', noun: 'frau', word: 'Frau', mit: { g: 'f', noun: 'wasche', word: 'Wäsche' }, names: ['rita'], key: /\bwasche\b|\brita\b/, nom: 'die Frau mit der Wäsche',
      where: { de: ['Die Frau mit der Wäsche? Das ist Rita. Sie hängt Wäsche auf, beim Teich.'], en: ['The woman with the laundry? That’s Rita. She hangs up laundry, near the pond.'] } },
    { id: 'emil', addr: 'Für den Angler am Teich', town: 'emil', g: 'm', noun: 'angler', word: 'Angler', names: ['emil'], key: /\bangler\b|\bteich\b|\bemil\b/, nom: 'der Angler am Teich',
      where: { de: ['Der Angler? Das ist Emil. Er sitzt immer am Teich.'], en: ['The angler? That’s Emil. He always sits by the pond.'] } },
    { id: 'otto', addr: 'An Herrn Otto', town: 'otto', names: ['herrn otto', 'otto'], herr: 'otto', key: /\botto\b/, nom: 'Herr Otto', polite: true,
      where: { de: ['Herr Otto? Der sitzt auf einer Bank am Platz.'], en: ['Mr Otto? He sits on a bench on the square.'] } },
    { id: 'marta', addr: 'Für die Bäckerin', npc: 'baker', name: 'Marta', top: 1.9, g: 'f', noun: 'backerin', word: 'Bäckerin', names: ['marta'], key: /\bbackerin\b|\bmarta\b/, nom: 'die Bäckerin',
      where: { de: ['Die Bäckerin? Das ist Marta, in der Bäckerei.'], en: ['«Die Bäckerin»? That’s Marta, in the bakery.'] } },
    { id: 'lucas2', addr: 'Für den Bäcker', town: 'lucas', g: 'm', noun: 'backer', word: 'Bäcker', names: ['lucas'], key: /\bbacker\b|\blucas\b/, nom: 'der Bäcker', where: QUEST_LETTERS[1].where },
    { id: 'hugo2', addr: 'Für den Mann mit dem Besen', town: 'hugo', g: 'm', noun: 'mann', word: 'Mann', mit: { g: 'm', noun: 'besen', word: 'Besen' }, names: ['hugo'], key: /\bbesen\b|\bhugo\b/, nom: 'der Mann mit dem Besen', where: QUEST_LETTERS[3].where },
    { id: 'rosa2', addr: 'An Frau Rosa', npc: 'rosa', name: 'Oma Rosa', top: 1.85, polite: true, names: ['frau rosa', 'oma rosa', 'rosa'], key: /\brosa\b/, nom: 'Frau Rosa', where: QUEST_LETTERS[0].where },
  ];
  const LETTER = {};
  QUEST_LETTERS.concat(POOL).forEach(L => { LETTER[L.id] = L; });
  // the model sentence for handing it over («Ein Brief für den Mann mit dem Besen!» would be right too, but long)
  const modelOf = L => L.model || (L.herr ? `Ein Brief für Herrn ${cap(L.herr)}!` : L.polite ? 'Ein Brief für Sie!' : `Ein Brief für ${ACC[L.g]} ${L.word}!`);

  // Handing a letter over: one sentence, graded S–D. What counts: saying what it is (Brief / Post), «für», and who it's
  // for: Sie / dich / euch, a name, or the address's noun with the right article (für + accusative: der → den).
  function gradeHandover(text, L) {
    const n = canon(text), what = /\b(brief|briefe|briefchen|post|postkarte|karte|paket)\b/.test(n), fur = /\bfur\b/.test(n);
    const after = (n.match(/\bfur\s+(.*)$/) || [])[1] || '';
    let obj = null;
    if (/^(sie|euch)\b/.test(after)) obj = 'sie';
    else if (/^dich\b/.test(after)) obj = 'dich';
    else if ((L.names || []).some(nm => (' ' + after + ' ').startsWith(' ' + nm + ' '))) obj = 'name';
    else if (L.noun && new RegExp('^' + ACC[L.g] + ' ' + L.noun + '\\b').test(after)) obj = 'noun';
    // the slips worth a word
    let slip = null;
    if (fur && /^(ihnen|dir|ihr|du|ich|mir)\b/.test(after)) slip = 'After «für» come «Sie», «dich» or «euch» (not Ihnen or dir): «für Sie».';
    else if (fur && L.noun && new RegExp('^(der|den|dem|die|das|des) ' + L.noun + '\\b').test(after) && obj !== 'noun')
      slip = L.g === 'm' ? `After «für», der becomes den: «für den ${L.word}».` : `«${L.word}» is ${L.g === 'f' ? 'feminine (die)' : 'neuter (das)'}, and after «für» it stays: «für ${ACC[L.g]} ${L.word}».`;
    else if (L.herr && fur && /^herr\b/.test(after)) slip = `«Herr» becomes «Herrn» after «an» and «für»: «für Herrn ${cap(L.herr)}».`;
    if (!slip && L.mit) { const m = n.match(new RegExp('\\bmit (\\w+) ' + L.mit.noun + '\\b')); if (m && m[1] !== DAT[L.mit.g]) slip = `After «mit» comes the dative: «mit ${DAT[L.mit.g]} ${L.mit.word}».`; }
    if (L.herr && obj === null && fur && new RegExp('^herrn ' + L.herr).test(after)) obj = 'name';
    if (!what && !fur && !obj) return { grade: 'D', why: `Say what you’re bringing and who it’s for: «${modelOf(L)}»` };
    if (slip && (fur || what)) return { grade: 'B', why: slip };
    if (fur && obj) {
      if (obj === 'dich' && L.polite) return { grade: 'A', why: 'With someone older you don’t know well, «Sie» is politer: «Ein Brief für Sie!»' };
      if (obj === 'dich' && L.group) return { grade: 'A', why: 'For a whole family: «für euch» (or polite: «für Sie»).' };
      if (!what) return { grade: 'A', why: `Say what it is, too: «${modelOf(L)}»` };
      return { grade: 'S', why: '' };
    }
    if (fur) return { grade: 'C', why: `Who is it for? «${modelOf(L)}»` };
    return { grade: 'C', why: `Add «für» and who it’s for: «${modelOf(L)}»` };
  }
  // Asking where someone lives: «Wo wohnt …?» (also «Wo ist …?», «Wohnt hier …?», «Kennst du …?»)
  function parseAsk(text, letters) {
    const n = canon(text);
    const q = /\b(wo|wer|wohin)\b/.test(n) || /\bwohnt\b.*\bhier\b/.test(n) || /\bkennst du\b/.test(n);
    const v = /\b(wohnt|wohnen|ist|sind|finde|steht|arbeitet)\b/.test(n);
    let target = null;
    for (const L of letters) if (L.key.test(n)) { target = L; break; }
    if (!target && /\bbackerin\b/.test(n) && !letters.some(L => L.id === 'marta')) target = 'baeckerin';
    const slip = !!(target && typeof target === 'object' && target.g === 'm' && target.noun && new RegExp('\\b(wohnt|ist|steht) den ' + target.noun + '\\b').test(n));
    return { q, v, target, slip };
  }
  // an expression: did you say it? (one letter off in a longer one still counts; you see it spelled right)
  function phraseMatch(id, text) {
    const p = PH[id], t = canon(text); if (!t) return { empty: true };
    const forms = [p.de].concat(p.alt || []).map(canon), tt = t.replace(/ /g, '');
    if (forms.includes(t) || forms.some(f => f.replace(/ /g, '') === tt)) return { ok: true };
    if (forms.some(f => f.length >= 5 && lev(f.replace(/ /g, ''), tt) <= 1)) return { ok: true, close: true };
    return { ok: false, close: forms.some(f => lev(f.replace(/ /g, ''), tt) <= 2) };
  }

  // ================================================================ models: pieces → one vertex-colored toon mesh with an ink hull
  function bake(pieces) {
    let n = 0;
    const list = pieces.map(p => { const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone(); if (p.m) g.applyMatrix4(p.m); n += g.attributes.position.count; return { g, c: new THREE.Color(p.color || '#ffffff') }; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let o = 0;
    for (const { g, c } of list) {
      const cnt = g.attributes.position.count;
      pos.set(g.attributes.position.array, o * 3);
      if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
      for (let i = 0; i < cnt; i++) { col[(o + i) * 3] = c.r; col[(o + i) * 3 + 1] = c.g; col[(o + i) * 3 + 2] = c.b; }
      o += cnt; g.dispose();
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    return geo;
  }
  // a kit of pieces in a movable frame (x, y, z, yaw, tilt): add(geo, color, x, y, z, sx, sy, sz, rx, ry, rz)
  function Kit() {
    const P = []; let F = new THREE.Matrix4();
    const k = {
      P,
      frame(x = 0, y = 0, z = 0, yaw = 0, rx = 0, rz = 0) { F = new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, yaw, rz, 'YXZ')), V3(1, 1, 1)); return k; },
      add(geo, color, x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) { P.push({ geo, color, m: F.clone().multiply(M4(x, y, z, sx, sy, sz, ry, rx, rz)) }); return k; },
      beam(a, b, t, color, t2 = t) {        // a box from point a to point b (frame coordinates)
        const d = V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
        const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
        P.push({ geo: GEO.box, color, m: F.clone().multiply(new THREE.Matrix4().compose(V3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, V3(t, L, t2))) });
        return k;
      },
    };
    return k;
  }
  const VC = () => TK.toon('#ffffff', { vc: 1, rim: 0.22 });
  function inked(P, ink = 0.016, o = {}) {
    const geo = bake(P), g = new THREE.Group();
    const m = new THREE.Mesh(geo, VC()); m.castShadow = o.shadow !== false; m.receiveShadow = !!o.receive; g.add(m);
    if (ink) { const h = new THREE.Mesh(geo, TK.outlineMat(ink)); h.castShadow = false; g.add(h); }
    return g;
  }
  const INK = '#2b2235';
  const inkMat = new THREE.MeshBasicMaterial({ color: INK });
  const textTex = (w, h, draw) => { const t = TK.canvasTex(w, h, draw); t.anisotropy = 4; return t; };

  // ---------------- people: an articulated figure (body, legs, arms, head) from a look
  // look: { skin, top (jacket), sleeve, pants, shoe, w (width), torso(k), head(k), arm(k, s), happyEyes, glasses }
  function figure(look) {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const w = look.w || 1;
    const legs = [-1, 1].map(s => {
      const hip = new THREE.Group(); hip.position.set(s * 0.11 * w, 0.36, 0); body.add(hip);
      const k = Kit(); k.add(GEO.cyl, look.pants, 0, -0.16, 0, 0.085, 0.32, 0.085).add(GEO.sph, look.shoe, 0, -0.33, 0.045, 0.095, 0.07, 0.14);
      hip.add(inked(k.P, 0.013)); return hip;
    });
    const tk = Kit(); look.torso(tk); body.add(inked(tk.P, 0.016));
    const arms = [-1, 1].map(s => {
      const sh = new THREE.Group(); sh.position.set(s * 0.27 * w, 0.85, 0.02); body.add(sh);
      const k = Kit(); k.add(GEO.cyl, look.sleeve, 0, -0.15, 0, 0.075, 0.3, 0.075).add(GEO.sph, look.skin, 0, -0.32, 0, 0.075);
      if (look.arm) look.arm(k, s);
      sh.add(inked(k.P, 0.013)); return sh;
    });
    const head = new THREE.Group(); head.position.set(0, 0.98, 0); body.add(head);
    const hk = Kit(); look.head(hk);
    [-1, 1].forEach(s => hk.add(GEO.sphS, '#f7a8b0', s * 0.17, 0.12, 0.232, 0.055, 0.03, 0.016, 0, s * 0.45, 0));       // rosy cheeks
    head.add(inked(hk.P, 0.014));
    // (the eyes and the mouth stay separate: they blink and talk)
    const eyes = [-1, 1].map(s => {
      let e;
      if (look.happyEyes) { e = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.011, 6, 12, Math.PI), inkMat); e.position.set(s * 0.1, 0.205, 0.262); }
      else { e = new THREE.Group(); e.position.set(s * 0.1, 0.215, 0.255); const ball = new THREE.Mesh(GEO.sphS, inkMat); ball.scale.set(0.036, 0.052, 0.024); e.add(ball); }
      head.add(e); return e;
    });
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.011, 6, 12, Math.PI), inkMat);
    mouth.position.set(0, 0.105, 0.272); mouth.rotation.z = Math.PI; head.add(mouth);
    root.traverse(o => { if (o.isMesh && !o.material.isMeshBasicMaterial) o.castShadow = true; });
    return { root, body, legs, arms, head, eyes, mouth, props: {} };
  }
  // a profile for a round torso: [radius, y] pairs scaled by w
  const torsoProfile = (w, belly = 1) => [[0, 0.3], [0.27 * w, 0.31], [0.32 * w * belly, 0.42], [0.335 * w * belly, 0.56], [0.3 * w, 0.72], [0.22 * w, 0.88], [0.11, 0.965], [0, 0.98]];
  const radiusAt = (prof, y) => { for (let i = 0; i < prof.length - 1; i++) { const [r0, y0] = prof[i], [r1, y1] = prof[i + 1]; if (y >= y0 && y <= y1) return lerp(r0, r1, (y - y0) / (y1 - y0 || 1)); } return 0.2; };

  // Adi: postal blue jacket, a yellow trim, a big satchel, rosy cheeks, round glasses, curls under his cap. Clean-shaven.
  function makeAdi() {
    const skin = '#f2c39b', blue = '#3d6fb6', yellow = '#f2c14e', w = 1.12, prof = torsoProfile(w, 1.06);
    const F = figure({
      skin, sleeve: blue, pants: '#2f3f63', shoe: '#5b3a24', w,
      torso(k) {
        k.P.push({ geo: lathe(prof, 18), color: blue, m: new THREE.Matrix4() });
        k.add(GEO.cyl, yellow, 0, 0.335, 0, 0.3 * w, 0.035, 0.3 * w);                                   // a yellow hem
        [0.46, 0.6, 0.73].forEach(y => k.add(GEO.sphS, yellow, 0, y, radiusAt(prof, y) + 0.004, 0.026));   // buttons
        [-1, 1].forEach(s => k.add(GEO.cone6, '#fdf8ee', s * 0.07, 0.925, 0.085, 0.05, 0.1, 0.03, -0.5, 0, s * 0.9));   // a white collar
        // the satchel on his left hip, its flap in post yellow, letters peeking out; the strap over his right shoulder
        k.add(GEO.box, '#8a5a35', 0.37, 0.44, 0.04, 0.12, 0.27, 0.34).add(GEO.box, yellow, 0.375, 0.53, 0.04, 0.13, 0.12, 0.35);
        k.add(GEO.box, '#fffaf0', 0.36, 0.6, 0.0, 0.06, 0.06, 0.22).add(GEO.box, '#bcd8ea', 0.36, 0.6, 0.08, 0.055, 0.07, 0.08);
        const strap = s => { const pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6, x = lerp(-0.2, 0.33, t), y = lerp(0.9, 0.5, t), r = radiusAt(prof, y) + 0.012; pts.push([x, y, s * Math.sqrt(Math.max(0.0004, r * r - x * x))]); } for (let i = 0; i < 6; i++) k.beam(pts[i], pts[i + 1], 0.04, '#6b4a2e', 0.02); };
        strap(1); strap(-1);
      },
      head(k) {
        k.add(GEO.sph, skin, 0, 0.21, 0, 0.29, 0.28, 0.28);
        [-1, 1].forEach(s => k.add(GEO.sphS, skin, s * 0.285, 0.2, -0.01, 0.05, 0.075, 0.045));
        k.add(GEO.sphS, '#e9a88a', 0, 0.155, 0.285, 0.052, 0.045, 0.045);                                 // a round button nose
        for (let i = 0; i < 9; i++) { const a = -2.2 + i * 0.55; k.add(GEO.sphS, '#6b3b25', Math.sin(a) * 0.255, 0.3 + (i % 2) * 0.025, Math.cos(a) * 0.255 - 0.02, 0.075); }   // curls under the cap
        [-1, 1].forEach(s => k.add(GEO.box, '#5a3622', s * 0.1, 0.318, 0.262, 0.075, 0.016, 0.02, 0, 0, -s * 0.18));   // cheerful eyebrows
        // round glasses
        [-1, 1].forEach(s => k.add(GEO.torus, INK, s * 0.1, 0.215, 0.276, 0.062, 0.062, 0.062));
        k.add(GEO.box, INK, 0, 0.225, 0.282, 0.05, 0.012, 0.012);
        // the cap: navy, a post-yellow band, a black visor and a little gold horn on the front
        k.add(GEO.cyl, '#2c3e6b', 0, 0.455, -0.015, 0.262, 0.13, 0.262).add(GEO.cyl, '#2c3e6b', 0, 0.525, -0.015, 0.275, 0.03, 0.275);
        k.add(GEO.cyl, yellow, 0, 0.405, -0.015, 0.267, 0.045, 0.267);
        k.add(GEO.box, '#1f2a44', 0, 0.385, 0.23, 0.25, 0.024, 0.14, 0.12, 0, 0);
        k.add(GEO.torus, '#f7d04a', 0, 0.46, 0.262, 0.04, 0.04, 0.04);
      },
    });
    // a letter in his hand when he posts one
    const letter = new THREE.Mesh(GEO.box, TK.toon('#fffaf0')); letter.scale.set(0.2, 0.14, 0.012); letter.position.set(0, -0.37, 0.06); letter.rotation.x = -0.3; letter.visible = false;
    F.arms[0].add(letter); F.props.letter = letter;
    F.sitY = 0.15; F.h = 1.62;
    return F;
  }
  // Hilde: a lavender cardigan, white hair in a bun, glasses on a chain, happy eyes, knitting a yellow scarf
  function makeHilde() {
    const skin = '#f1c7a5', cardi = '#9b7fc0', w = 0.98, prof = torsoProfile(w, 0.98);
    const F = figure({
      skin, sleeve: cardi, pants: '#d9c6b0', shoe: '#6b4a3a', w, happyEyes: true,
      torso(k) {
        k.P.push({ geo: lathe(prof, 18), color: cardi, m: new THREE.Matrix4() });
        k.add(GEO.cyl, '#e88fa8', 0, 0.33, 0, 0.27, 0.06, 0.27);                    // her dress under the cardigan
        [0.5, 0.64, 0.77].forEach(y => k.add(GEO.sphS, '#fdf8ee', 0, y, radiusAt(prof, y) + 0.004, 0.022));
        k.add(GEO.sphS, '#f2c14e', 0.12, 0.8, radiusAt(prof, 0.8) - 0.02, 0.03);   // a brooch
      },
      head(k) {
        k.add(GEO.sph, skin, 0, 0.21, 0, 0.27, 0.26, 0.26);
        k.add(GEO.sph, '#f4f1ea', 0, 0.27, -0.03, 0.28, 0.22, 0.27).add(GEO.sph, '#f4f1ea', 0, 0.42, -0.17, 0.12);   // white hair, the bun
        k.add(GEO.sphS, '#e9a88a', 0, 0.16, 0.265, 0.04, 0.035, 0.035);
        [-1, 1].forEach(s => { k.add(GEO.torus, INK, s * 0.095, 0.205, 0.262, 0.055, 0.055, 0.055); k.add(GEO.sphS, '#fdf8ee', s * 0.27, 0.13, 0.02, 0.022); });   // glasses, pearl earrings
        k.add(GEO.box, INK, 0, 0.215, 0.27, 0.045, 0.011, 0.011);
      },
      arm(k, s) { if (s > 0) k.add(GEO.cyl8, '#c9a46a', 0, -0.4, 0.06, 0.008, 0.3, 0.008, 0.9, 0, 0); else k.add(GEO.cyl8, '#c9a46a', 0, -0.4, 0.06, 0.008, 0.3, 0.008, 0.9, 0, 0); },
    });
    // the scarf she's knitting, hanging from her needles, and a ball of wool on her lap
    const scarf = inked(Kit().add(GEO.box, '#f2c14e', 0, 0, 0, 0.2, 0.05, 0.3).add(GEO.box, '#e0b03a', 0, 0.026, -0.08, 0.2, 0.004, 0.02).add(GEO.box, '#e0b03a', 0, 0.026, 0.04, 0.2, 0.004, 0.02).P, 0.01);
    scarf.position.set(0, 0.62, 0.3); F.body.add(scarf); F.props.scarf = scarf;
    const ball = inked(Kit().add(GEO.sph, '#f2c14e', 0, 0, 0, 0.07).P, 0.01); ball.position.set(-0.12, 0.5, 0.32); F.body.add(ball);
    F.sitY = 0.15; F.h = 1.5;
    return F;
  }
  // Kalle: messy ginger hair, freckles, a green shirt, jeans, a newspaper (the crossword)
  function makeKalle() {
    const skin = '#f6d0b0', shirt = '#5aa36a', w = 1.0, prof = torsoProfile(w, 0.92);
    const F = figure({
      skin, sleeve: shirt, pants: '#3f5d8a', shoe: '#fdf8ee', w,
      torso(k) {
        k.P.push({ geo: lathe(prof, 18), color: shirt, m: new THREE.Matrix4() });
        for (let i = 0; i < 5; i++) k.add(GEO.cyl, '#4b8d5a', 0, 0.42 + i * 0.12, 0, radiusAt(prof, 0.42 + i * 0.12) + 0.004, 0.018, radiusAt(prof, 0.42 + i * 0.12) + 0.004);   // stripes: a checked shirt, from afar
        k.add(GEO.cone6, '#fdf8ee', 0, 0.93, 0.09, 0.07, 0.08, 0.03, -0.6, 0, 0);
      },
      head(k) {
        k.add(GEO.sph, skin, 0, 0.21, 0, 0.27, 0.27, 0.27);
        for (let i = 0; i < 11; i++) { const a = -2.6 + i * 0.52; k.add(GEO.sphS, '#c8642c', Math.sin(a) * 0.2, 0.38 + Math.cos(i * 1.7) * 0.03, Math.cos(a) * 0.2 - 0.04, 0.12, 0.1, 0.12); }   // messy ginger hair
        k.add(GEO.sphS, '#c8642c', 0.05, 0.43, 0.12, 0.09, 0.06, 0.08);                 // a fringe
        k.add(GEO.sphS, '#ec9e84', 0, 0.165, 0.265, 0.035, 0.04, 0.035);
        [[-0.15, 0.14], [-0.12, 0.11], [-0.18, 0.11], [0.15, 0.14], [0.12, 0.11], [0.18, 0.11]].forEach(([x, y]) => k.add(GEO.sphS, '#c98a5a', x, y, 0.235, 0.01));   // freckles
        [-1, 1].forEach(s => k.add(GEO.sphS, skin, s * 0.27, 0.2, -0.01, 0.045, 0.07, 0.04));
      },
    });
    const paper = inked(Kit().add(GEO.box, '#f4efe4', 0, 0, 0, 0.42, 0.3, 0.012).add(GEO.box, '#a9a3b0', -0.1, 0.06, 0.008, 0.16, 0.012, 0.004).add(GEO.box, '#a9a3b0', -0.1, 0.02, 0.008, 0.16, 0.012, 0.004)
      .add(GEO.box, '#a9a3b0', 0.1, 0.0, 0.008, 0.14, 0.14, 0.004).add(GEO.box, '#2b2235', -0.1, -0.06, 0.008, 0.16, 0.05, 0.004).P, 0.008);
    paper.position.set(0, 0.68, 0.36); paper.rotation.x = -0.45; F.body.add(paper); F.props.paper = paper;
    F.sitY = 0.15; F.h = 1.58;
    return F;
  }

  // ---------------- the garden: one merged mesh (plus a few textured bits), and its solids
  function gnome(k, g, gy) {
    const y = gy(g.x, g.z), sleep = g.prop === 'sleep';
    k.frame(g.x, y + (sleep ? 0.12 : 0), g.z, g.yaw, sleep ? -1.35 : 0, 0);
    k.add(GEO.sphS, '#6b4a2e', -0.07, 0.04, 0.03, 0.06, 0.04, 0.08).add(GEO.sphS, '#6b4a2e', 0.07, 0.04, 0.03, 0.06, 0.04, 0.08);   // boots
    k.add(GEO.cone, g.coat, 0, 0.22, 0, 0.16, 0.36, 0.16);                                     // the coat
    k.add(GEO.cyl8, '#4a3a33', 0, 0.15, 0, 0.13, 0.03, 0.13);                                  // belt
    k.add(GEO.sph, '#f3c9a5', 0, 0.4, 0, 0.1);                                                 // head
    k.add(GEO.sphS, '#f0a08a', 0, 0.39, 0.095, 0.036);                                         // nose
    k.add(GEO.cone, '#fdf8ee', 0, 0.31, 0.065, 0.085, 0.17, 0.05, Math.PI, 0, 0);             // beard
    if (!sleep) { k.add(GEO.sphS, INK, -0.035, 0.425, 0.088, 0.012).add(GEO.sphS, INK, 0.035, 0.425, 0.088, 0.012); }
    k.add(GEO.cone, g.hat, 0, 0.56, -0.012, 0.105, 0.27, 0.105, -0.12, 0, 0);                  // the pointy red hat
    [-1, 1].forEach(s => k.add(GEO.sphS, g.coat, s * 0.13, 0.27, 0.04, 0.045, 0.07, 0.045));
    if (g.prop === 'sign') { k.add(GEO.cyl8, '#8a5f3e', 0.16, 0.38, 0.06, 0.015, 0.6, 0.015); }
    if (g.prop === 'shovel') { k.add(GEO.cyl8, '#8a5f3e', -0.16, 0.3, 0.05, 0.014, 0.5, 0.014, 0, 0, 0.25).add(GEO.box, '#9aa0ad', -0.22, 0.06, 0.05, 0.08, 0.1, 0.015, 0, 0, 0.25); }
    if (g.prop === 'rod') { k.add(GEO.cyl8, '#8a5f3e', 0.14, 0.5, 0.25, 0.01, 0.75, 0.01, 0.9, 0, 0); }
    if (g.prop === 'peek') { /* (he peeks out from behind the bush) */ }
  }
  function chair(k, x, z, yaw, gy) {
    const G0 = '#5f9a5a', D = '#4b7f47';
    k.frame(x, gy(x, z), z, yaw);
    k.add(GEO.box, G0, 0, 0.45, 0, 0.44, 0.05, 0.42);
    [[-0.19, -0.18], [0.19, -0.18], [-0.19, 0.18], [0.19, 0.18]].forEach(([a, b]) => k.add(GEO.box, D, a, 0.225, b, 0.04, 0.45, 0.04));
    [-0.19, 0.19].forEach(a => k.add(GEO.box, D, a, 0.72, -0.19, 0.045, 0.55, 0.04));       // back posts (away from the table: local −z)
    [0.6, 0.78, 0.94].forEach(yy => k.add(GEO.box, G0, 0, yy, -0.19, 0.4, 0.06, 0.03));
  }
  function picket(k, x1, z1, x2, z2, gy, o = {}) {
    const L = Math.hypot(x2 - x1, z2 - z1), ry = Math.atan2(x2 - x1, z2 - z1), n = Math.max(1, Math.round(L / 0.32)), c = o.color || '#f6f1e6';
    k.frame(x1, gy(x1, z1), z1, ry);
    for (let i = 0; i <= n; i++) { const t = (i / n) * L; k.add(GEO.box, c, 0, 0.36, t, 0.05, 0.72, 0.09).add(GEO.cone6, c, 0, 0.77, t, 0.05, 0.1, 0.05); }
    [0.22, 0.55].forEach(yy => k.add(GEO.box, '#e7dfcc', 0.035, yy, L / 2, 0.025, 0.06, L));
  }
  function buildGarden(parent, gy) {
    const root = new THREE.Group(); root.name = 'adolf-garden-all'; parent.add(root);
    const k = Kit(), solids = [];
    const solid = o => solids.push(Object.assign({ hx: o.x, hz: o.z }, o));
    // the table: a round top on a pedestal, four green chairs
    k.frame(TABLE.x, gy(TABLE.x, TABLE.z), TABLE.z, 0);
    k.add(GEO.cyl, '#f4efe4', 0, 0.02, 0, 0.36, 0.04, 0.36).add(GEO.cyl, '#f4efe4', 0, 0.37, 0, 0.07, 0.7, 0.07).add(GEO.cyl, '#f4efe4', 0, 0.705, 0, TABLE.r, 0.04, TABLE.r);
    for (const [, s] of Object.entries(SEATS)) chair(k, s.x, s.z, s.yaw, gy);
    solid({ x: TABLE.x, z: TABLE.z, r: 1.0 });
    for (const [id, s] of Object.entries(SEATS)) if (id !== 'you') solid({ x: s.x, z: s.z, r: 0.3 });
    // on the table: a Gugelhupf on a plate, a coffee pot, cups and plates at each seat
    const ty = gy(TABLE.x, TABLE.z) + TABLE.h + 0.012;
    k.frame(TABLE.x, ty, TABLE.z, 0);
    k.add(GEO.cyl, '#fdf8ee', -0.42, 0.006, -0.36, 0.19, 0.012, 0.19);
    k.P.push({ geo: lathe([[0.04, 0], [0.15, 0], [0.16, 0.05], [0.13, 0.12], [0.07, 0.15], [0.04, 0.13]], 14), color: '#c98a45', m: new THREE.Matrix4().makeTranslation(TABLE.x - 0.42, ty + 0.012, TABLE.z - 0.36) });
    k.add(GEO.torus, '#fdf8ee', -0.42, 0.15, -0.36, 0.1, 0.1, 0.1, Math.PI / 2, 0, 0);       // icing
    k.P.push({ geo: lathe([[0, 0], [0.08, 0], [0.095, 0.08], [0.075, 0.18], [0.05, 0.2], [0.055, 0.23], [0, 0.24]], 12), color: '#fdf8ee', m: new THREE.Matrix4().makeTranslation(TABLE.x + 0.44, ty, TABLE.z - 0.38) });
    k.add(GEO.cone6, '#fdf8ee', 0.54, 0.13, -0.38, 0.025, 0.12, 0.025, 0, 0, -1.0).add(GEO.torus, '#fdf8ee', 0.36, 0.12, -0.38, 0.05, 0.05, 0.05, 0, Math.PI / 2, 0);
    [0.3, 0.6, 0.9].forEach(t => k.add(GEO.sphS, '#3f7fc9', 0.44 + Math.cos(t * 7) * 0.085, 0.06 + t * 0.09, -0.38 + Math.sin(t * 7) * 0.085, 0.012));
    for (const [id, s] of Object.entries(SEATS)) {
      const dx = (s.x - TABLE.x) / SEAT_R, dz = (s.z - TABLE.z) / SEAT_R, px = -dz, pz = dx;
      k.add(GEO.cyl, '#fdf8ee', dx * 0.6 + px * 0.16, 0.005, dz * 0.6 + pz * 0.16, 0.09, 0.01, 0.09).add(GEO.cyl, '#fdf8ee', dx * 0.6 + px * 0.16, 0.04, dz * 0.6 + pz * 0.16, 0.045, 0.07, 0.045);   // saucer and cup
      k.add(GEO.cyl, '#fdf8ee', dx * 0.58 - px * 0.18, 0.005, dz * 0.58 - pz * 0.18, 0.11, 0.01, 0.11);          // plate
      if (id !== 'you') k.add(GEO.box, '#c98a45', dx * 0.58 - px * 0.18, 0.035, dz * 0.58 - pz * 0.18, 0.08, 0.05, 0.1, 0, Math.atan2(dx, dz), 0);   // a slice of cake
    }
    // five gnomes
    GNOMES.forEach(g => { gnome(k, g, gy); solid({ x: g.x, z: g.z, r: 0.22 }); });
    // the rose arch at the narrow way between the houses, the mailbox beside it
    k.frame(ARCH.x, gy(ARCH.x, ARCH.z), ARCH.z, 0);          // (you walk through it north–south: it spans east–west)
    [-0.92, 0.92].forEach(a => { k.add(GEO.box, '#f6f1e6', a, 1.05, 0, 0.09, 2.1, 0.09); solid({ x: ARCH.x + a, z: ARCH.z, r: 0.12 }); });
    k.P.push({ geo: new THREE.TorusGeometry(0.92, 0.05, 6, 20, Math.PI), color: '#f6f1e6', m: new THREE.Matrix4().makeTranslation(ARCH.x, gy(ARCH.x, ARCH.z) + 2.1, ARCH.z) });
    const R = rng(4242);
    for (let i = 0; i < 26; i++) {
      const a = (i / 25) * Math.PI, side = i % 2 ? 1 : -1, lx = Math.cos(a) * 0.95, ly = 2.1 + Math.sin(a) * 0.95;
      k.add(GEO.ico, i % 3 ? '#4f9a45' : '#5fae4f', lx, ly, side * 0.05, 0.13 + R() * 0.05);
      if (i % 2 === 0) k.add(GEO.ico, i % 4 ? '#e86a9a' : '#d9493b', lx + 0.04, ly + 0.05, side * 0.1, 0.06);
    }
    [-0.92, 0.92].forEach(a => { for (let j = 0; j < 4; j++) k.add(GEO.ico, '#4f9a45', a + (j % 2 ? 0.06 : -0.06), 0.4 + j * 0.42, 0.06, 0.1).add(GEO.ico, '#e86a9a', a, 0.55 + j * 0.42, 0.11, 0.05); });
    k.frame(MAILBOX.x, gy(MAILBOX.x, MAILBOX.z), MAILBOX.z, MAILBOX_YAW);
    k.add(GEO.box, '#8a5f3e', 0, 0.5, 0, 0.08, 1.0, 0.08).add(GEO.box, '#f2c14e', 0, 1.1, 0, 0.36, 0.26, 0.24).add(GEO.cyl, '#f2c14e', 0, 1.23, 0, 0.12, 0.36, 0.12, 0, 0, Math.PI / 2);
    k.add(GEO.box, INK, 0, 1.17, 0.121, 0.2, 0.025, 0.01).add(GEO.torus, INK, 0.0, 1.06, 0.121, 0.045, 0.045, 0.045);
    solid({ x: MAILBOX.x, z: MAILBOX.z, r: 0.2 });
    // fences: a white picket fence west and east (with a gate gap), a hedge along the north
    picket(k, GARDEN.x0, GARDEN.z0 - 1.0, GARDEN.x0, GARDEN.z1 + 0.2, gy);
    picket(k, GARDEN.x1, GARDEN.z0 + 0.15, GARDEN.x1, EAST_GATE.z + 1.0, gy);
    picket(k, GARDEN.x1, EAST_GATE.z - 1.0, GARDEN.x1, GARDEN.z1 + 0.2, gy);
    solid({ obox: 1, x: GARDEN.x0, z: (GARDEN.z0 - 1.0 + GARDEN.z1 + 0.2) / 2, hw: 0.08, hd: Math.abs(GARDEN.z1 + 0.2 - GARDEN.z0 + 1.0) / 2, rot: 0 });
    solid({ obox: 1, x: GARDEN.x1, z: (GARDEN.z0 + 0.15 + EAST_GATE.z + 1.0) / 2, hw: 0.08, hd: Math.abs(EAST_GATE.z + 1.0 - GARDEN.z0 - 0.15) / 2, rot: 0 });
    solid({ obox: 1, x: GARDEN.x1, z: (EAST_GATE.z - 1.0 + GARDEN.z1 + 0.2) / 2, hw: 0.08, hd: Math.abs(GARDEN.z1 + 0.2 - EAST_GATE.z + 1.0) / 2, rot: 0 });
    // the gate posts with a little roof of roses, and the hedge
    [EAST_GATE.z + 1.0, EAST_GATE.z - 1.0].forEach(z => { k.frame(GARDEN.x1, gy(GARDEN.x1, z), z, 0); k.add(GEO.box, '#f6f1e6', 0, 0.55, 0, 0.12, 1.1, 0.12).add(GEO.cone6, '#f6f1e6', 0, 1.16, 0, 0.1, 0.14, 0.1); });
    const hz = GARDEN.z1 - 0.1;
    for (let x = GARDEN.x0 + 0.3; x < GARDEN.x1 - 0.2; x += 0.62) {
      k.frame(x, gy(x, hz), hz, 0);
      k.add(GEO.ico, R() < 0.5 ? '#4f9a45' : '#468c3e', 0, 0.5 + R() * 0.08, 0, 0.5, 0.52, 0.42).add(GEO.ico, '#5fae4f', 0.1, 0.86, 0.12, 0.3, 0.22, 0.25);
    }
    solid({ obox: 1, x: (GARDEN.x0 + GARDEN.x1) / 2, z: hz, hw: (GARDEN.x1 - GARDEN.x0) / 2, hd: 0.45, rot: 0 });
    // a flower bed along the west fence, a vegetable patch, a birdhouse, a wheelbarrow full of flowers
    const COLS = ['#ff8fb1', '#ffd84a', '#ff6b5a', '#ffffff', '#b9a2ff', '#ff9d3a'];
    k.frame(GARDEN.x0 + 0.65, gy(GARDEN.x0 + 0.65, -185.5), -185.5, 0).add(GEO.box, '#6b4a2e', 0, 0.02, 0, 0.8, 0.06, 6.6);
    for (let i = 0; i < 34; i++) { const z = -182.4 - R() * 6.4, x = GARDEN.x0 + 0.35 + R() * 0.6; if (GNOMES.some(g => Math.hypot(g.x - x, g.z - z) < 0.35)) continue; k.frame(x, gy(x, z), z, 0).add(GEO.cyl8, '#3f8a3a', 0, 0.12, 0, 0.012, 0.24, 0.012).add(GEO.ico, COLS[i % COLS.length], 0, 0.27, 0, 0.055); }
    k.frame(-34.7, gy(-34.7, -188.6), -188.6, 0).add(GEO.box, '#6b4a2e', 0, 0.02, 0, 2.0, 0.06, 1.2);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { k.add(GEO.sphS, '#7fb04a', -0.65 + i * 0.65, 0.13, -0.3 + j * 0.6, 0.16, 0.12, 0.16).add(GEO.sphS, '#9cc45a', -0.65 + i * 0.65, 0.2, -0.3 + j * 0.6, 0.1, 0.07, 0.1); }
    k.frame(BIRDHOUSE.x, gy(BIRDHOUSE.x, BIRDHOUSE.z), BIRDHOUSE.z, 0.6);
    k.add(GEO.cyl8, '#8a5f3e', 0, 0.75, 0, 0.04, 1.5, 0.04).add(GEO.box, '#e0743c', 0, 1.62, 0, 0.26, 0.26, 0.26).add(GEO.cone6, '#c9553f', 0, 1.86, 0, 0.24, 0.22, 0.24).add(GEO.cyl8, INK, 0, 1.64, 0.131, 0.05, 0.01, 0.05, Math.PI / 2, 0, 0);
    solid({ x: BIRDHOUSE.x, z: BIRDHOUSE.z, r: 0.12 });
    k.frame(BARROW.x, gy(BARROW.x, BARROW.z), BARROW.z, BARROW.yaw);
    k.add(GEO.box, '#3f7fc9', 0, 0.42, 0, 0.5, 0.22, 0.7).add(GEO.cyl, '#2f3440', 0, 0.16, 0.42, 0.16, 0.06, 0.16, 0, 0, Math.PI / 2);
    [-0.2, 0.2].forEach(a => k.add(GEO.box, '#8a5f3e', a, 0.36, -0.55, 0.04, 0.04, 0.6, -0.2, 0, 0).add(GEO.box, '#8a5f3e', a, 0.18, -0.2, 0.04, 0.32, 0.04));
    for (let i = 0; i < 9; i++) k.add(GEO.ico, COLS[(i * 2) % COLS.length], -0.15 + (i % 3) * 0.15, 0.58, -0.2 + Math.floor(i / 3) * 0.2, 0.07);
    solid({ obox: 1, x: BARROW.x, z: BARROW.z, hw: 0.32, hd: 0.62, rot: BARROW.yaw });
    // stepping stones from the arch and from the gate to the table
    [[-29.8, -181.1], [-30.4, -182.0], [-30.9, -182.9], [-26.0, -185.6], [-27.0, -185.5], [-28.0, -185.4], [-29.0, -185.35]].forEach(([x, z]) => k.frame(x, gy(x, z), z, R() * 3).add(GEO.cyl8, '#cfc6b8', 0, 0.03, 0, 0.3, 0.06, 0.26));
    const mesh = inked(k.P, 0.012, { receive: true });
    mesh.name = 'adolf-garden'; root.add(mesh);
    // textured bits: the checked tablecloth, the board on the table, the name plates
    const checks = textTex(64, 64, (c) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#fdf8ee' : '#e05a4b'; c.fillRect(i * 8, j * 8, 8, 8); } });
    checks.wrapS = checks.wrapT = THREE.RepeatWrapping; checks.repeat.set(3, 3); checks.magFilter = THREE.NearestFilter;
    const cloth = new THREE.Mesh(new THREE.CylinderGeometry(TABLE.r + 0.04, TABLE.r + 0.1, 0.16, 28, 1, false), new THREE.MeshToonMaterial({ map: checks, gradientMap: TK.grad }));
    cloth.position.set(TABLE.x, gy(TABLE.x, TABLE.z) + TABLE.h - 0.06, TABLE.z); cloth.receiveShadow = true; cloth.castShadow = true; root.add(cloth);
    const boardTex = textTex(256, 256, (c) => drawBoard(c, 256, null, { plain: true }));
    const board = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.025, 0.56), [0, 0, 1, 0, 0, 0].map(i => i ? new THREE.MeshToonMaterial({ map: boardTex, gradientMap: TK.grad }) : TK.toon('#e8c97a')));
    board.position.set(TABLE.x + 0.02, ty + 0.02, TABLE.z + 0.06); board.rotation.y = Math.PI; root.add(board);
    const plate = (text, w, h, sub, pw = 256) => {
      const tex = textTex(pw, Math.round(pw * h / w), (c, W, H) => {
        c.fillStyle = '#fffaf0'; c.fillRect(0, 0, W, H); c.strokeStyle = INK; c.lineWidth = Math.max(8, Math.round(H * 0.06)); c.strokeRect(4, 4, W - 8, H - 8);
        // (the name as big as fits: the old fixed size left «Adis Garten» tiny on the arch)
        let fs = Math.round(H * (sub ? 0.46 : 0.6)); c.font = `900 ${fs}px Bahnschrift, "Segoe UI", sans-serif`;
        while (fs > 10 && c.measureText(text).width > W * (sub ? 0.88 : 0.72)) { fs -= 1; c.font = `900 ${fs}px Bahnschrift, "Segoe UI", sans-serif`; }
        c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2 - (sub ? 0 : 18), H * (sub ? 0.38 : 0.54));
        if (sub) { c.font = `800 ${Math.round(H * 0.25)}px Bahnschrift, "Segoe UI", sans-serif`; c.fillStyle = '#c2412f'; c.fillText(sub, W / 2, H * 0.76); }
        if (!sub) { const fx = W / 2 + c.measureText(text).width / 2 + 10, fy = H * 0.5; c.fillStyle = '#e86a9a'; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; c.beginPath(); c.arc(fx + Math.cos(a) * 11, fy + Math.sin(a) * 11, 9, 0, TAU); c.fill(); } c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(fx, fy, 7, 0, TAU); c.fill(); }
      });
      return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex }));
    };
    const name = plate('ADI', 0.3, 0.1); name.position.set(MAILBOX.x, gy(MAILBOX.x, MAILBOX.z) + 1.0, MAILBOX.z); name.rotation.y = MAILBOX_YAW;
    name.translateZ(0.122); root.add(name);
    // the arch's plate: as big as fits under the arch, on both faces (E «Read» by the arch: interactables)
    const sign = plate('Adis Garten', 1.3, 0.42, '♥ Willkommen ♥', 512); sign.position.set(ARCH.x, gy(ARCH.x, ARCH.z) + 2.45, ARCH.z + 0.06); root.add(sign);
    const sign2 = sign.clone(); sign2.rotation.y = Math.PI; sign2.position.z = ARCH.z - 0.06; root.add(sign2);
    const gerd = GNOMES[0], wsign = plate('Willkommen', 0.36, 0.14); wsign.position.set(gerd.x - 0.06, gy(gerd.x, gerd.z) + 0.7, gerd.z - 0.16); wsign.rotation.y = gerd.yaw; root.add(wsign);
    const wsign2 = wsign.clone(); wsign2.rotation.set(0, gerd.yaw + Math.PI, 0); wsign2.position.x -= Math.sin(gerd.yaw) * 0.01; wsign2.position.z -= Math.cos(gerd.yaw) * 0.01; root.add(wsign2);   // (Gerd's sign from behind)
    // your slice of cake, for the party
    const yourCake = inked(Kit().add(GEO.box, '#c98a45', 0, 0, 0, 0.08, 0.05, 0.1).add(GEO.box, '#fdf8ee', 0, 0.028, 0, 0.08, 0.008, 0.1).P, 0.008);
    { const s = SEATS.you, dx = (s.x - TABLE.x) / SEAT_R, dz = (s.z - TABLE.z) / SEAT_R, px = -dz, pz = dx; yourCake.position.set(TABLE.x + dx * 0.58 - px * 0.18, ty + 0.035, TABLE.z + dz * 0.58 - pz * 0.18); }
    yourCake.visible = false; root.add(yourCake);
    return { solids, mesh, cloth, board, yourCake, group: root };
  }

  // ================================================================ «Mensch ärgere dich nicht»: the rules (pure, testable)
  // The cross board on an 11 × 11 grid: 40 track squares, each player's start square (A) at 0 / 10 / 20 / 30, a base of
  // four (B) in a corner and a home row of four (the last square before your own start leads into it).
  // A piece's progress p: −1 in the base, 0..39 along the track (from its own start square), 40..43 in the home row.
  // Rules: a 6 brings a piece out onto your start square (you must, while pieces wait, unless your own piece sits there)
  // and gives you another roll; your start square must be cleared while pieces still wait in your base; with no piece
  // out (all in the base, or packed at the end of the home row) you get three tries for a 6; landing on another
  // player's piece sends it back to its base (capturing is allowed, not forced); you can't land on your own piece; the
  // home row needs the exact count and you can't jump over your own pieces there. First with every piece home wins.
  const MADN = (() => {
    const N = 40, START = [0, 10, 20, 30];
    const TRACK = [[0, 4], [1, 4], [2, 4], [3, 4], [4, 4], [4, 3], [4, 2], [4, 1], [4, 0], [5, 0], [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [10, 5],
      [10, 6], [9, 6], [8, 6], [7, 6], [6, 6], [6, 7], [6, 8], [6, 9], [6, 10], [5, 10], [4, 10], [4, 9], [4, 8], [4, 7], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 5]];
    const HOMES = [[[1, 5], [2, 5], [3, 5], [4, 5]], [[5, 1], [5, 2], [5, 3], [5, 4]], [[9, 5], [8, 5], [7, 5], [6, 5]], [[5, 9], [5, 8], [5, 7], [5, 6]]];
    const BASES = [[[0, 0], [1, 0], [0, 1], [1, 1]], [[9, 0], [10, 0], [9, 1], [10, 1]], [[9, 9], [10, 9], [9, 10], [10, 10]], [[0, 9], [1, 9], [0, 10], [1, 10]]];
    const abs = (pl, p) => (START[pl] + p) % N;
    function create(o = {}) { const n = clamp(o.pieces || 4, 1, 4); return { n, pos: [0, 1, 2, 3].map(() => Array(n).fill(-1)), turn: o.first || 0, winner: -1, moves: 0, rolls: 0, captures: 0, enters: 0 }; }
    function at(g, sq) { for (let pl = 0; pl < 4; pl++) for (let i = 0; i < g.n; i++) { const p = g.pos[pl][i]; if (p >= 0 && p < N && abs(pl, p) === sq) return { pl, i }; } return null; }
    const homeFree = (g, pl, s) => !g.pos[pl].some(p => p === N + s);
    // every legal move for a roll: { pl, i, from, to, cap: { pl, i } | null, enter, home }
    function legal(g, pl, roll) {
      const P = g.pos[pl], out = [];
      const waiting = P.some(p => p === -1), onStart = at(g, START[pl]);
      if (roll === 6 && waiting && !(onStart && onStart.pl === pl)) {        // out you come (you must)
        const i = P.indexOf(-1);
        return [{ pl, i, from: -1, to: 0, enter: true, cap: onStart }];
      }
      for (let i = 0; i < g.n; i++) {
        const p = P[i]; if (p < 0) continue;
        const q = p + roll;
        if (p < N && q < N) { const o = at(g, abs(pl, q)); if (o && o.pl === pl) continue; out.push({ pl, i, from: p, to: q, cap: o }); continue; }
        const s = q - N; if (s > 3) continue;
        let ok = true; for (let k = (p >= N ? p - N + 1 : 0); k <= s; k++) if (!homeFree(g, pl, k)) { ok = false; break; }
        if (ok) out.push({ pl, i, from: p, to: q, cap: null, home: true });
      }
      // while pieces wait, the one on your start square has to move off first (if it can)
      if (waiting && onStart && onStart.pl === pl) { const clear = out.filter(m => m.i === onStart.i); if (clear.length) return clear; }
      return out;
    }
    const packed = (g, pl, s) => { for (let k = s + 1; k <= 3; k++) if (homeFree(g, pl, k)) return false; return true; };
    // no piece out on the track and nothing in the home row that could still move up: three tries for a 6
    const stuck = (g, pl) => g.pos[pl].every(p => p === -1 || (p >= N && packed(g, pl, p - N)));
    function apply(g, m) {
      if (m.cap) { g.pos[m.cap.pl][m.cap.i] = -1; g.captures++; }
      if (m.enter) g.enters++;
      g.pos[m.pl][m.i] = m.to; g.moves++;
      if (g.winner < 0 && g.pos[m.pl].every(p => p >= N)) g.winner = m.pl;
    }
    // how many of the others could land on a square with their next roll
    function threat(g, pl, sq) {
      let n = 0;
      for (let o = 0; o < 4; o++) {
        if (o === pl) continue;
        for (const p of g.pos[o]) {
          if (p === -1) { if (START[o] === sq) n += 0.5; continue; }
          if (p >= N) continue;
          const d = (sq - abs(o, p) + N) % N;
          if (d >= 1 && d <= 6 && p + d < N) n += 1;
        }
      }
      return n;
    }
    // the players' styles: Adi friendly but sensible, Hilde loves to capture, Kalle plays it safe
    const STYLE = [{ cap: 34, risk: 14, home: 30, rnd: 5 }, { cap: 32, risk: 15, home: 30, rnd: 7 }, { cap: 75, risk: 6, home: 22, rnd: 4 }, { cap: 12, risk: 30, home: 42, rnd: 3 }];
    function aiPick(g, pl, moves, R = Math.random, style = STYLE[pl]) {
      let best = null, bs = -1e9;
      const waiting = g.pos[pl].some(p => p === -1);
      for (const m of moves) {
        let s = (m.to - Math.max(m.from, 0)) * 0.6;
        if (m.enter) s += 45;
        if (m.cap) s += style.cap + Math.max(0, g.pos[m.cap.pl][m.cap.i]) * 0.4;
        if (m.to >= N && m.from < N) s += style.home;
        if (m.to >= N) s += (m.to - N) * 1.5;
        if (m.from >= 0 && m.from < N) s += style.risk * threat(g, pl, abs(pl, m.from)) * 0.8;
        if (m.to < N) s -= style.risk * threat(g, pl, abs(pl, m.to));
        if (m.from === 0 && waiting) s += 8;
        if (m.to < N) for (let o = 0; o < 4; o++) if (o !== pl && START[o] === abs(pl, m.to) && g.pos[o].some(p => p === -1)) s -= style.risk * 0.6;
        s += R() * style.rnd;
        if (s > bs) { bs = s; best = m; }
      }
      return best;
    }
    // one whole turn (rolls until it's over), with a picker for the moves; returns the rolls and moves made
    function turn(g, R, pickFn) {
      const pl = g.turn, log = [];
      let tries = stuck(g, pl) ? 3 : 1;
      for (let guard = 0; guard < 60; guard++) {
        const roll = 1 + Math.floor(R() * 6); g.rolls++;
        const moves = legal(g, pl, roll);
        let m = null;
        if (moves.length) { m = pickFn(g, pl, moves, roll); apply(g, m); }
        log.push({ roll, m, n: moves.length });
        if (g.winner >= 0) return log;
        if (roll === 6) { tries = stuck(g, pl) ? 3 : 1; continue; }
        if (!moves.length && --tries > 0) continue;
        break;
      }
      g.turn = (pl + 1) % 4;
      return log;
    }
    // the rules, checked: whole games between four AIs (tests)
    function check(g) {
      const bad = [];
      for (let pl = 0; pl < 4; pl++) {
        const seen = new Set();
        for (const p of g.pos[pl]) {
          if (p < -1 || p > N + 3) bad.push('range ' + pl + ':' + p);
          if (p >= 0) { const key = p >= N ? 'h' + p : 't' + abs(pl, p); if (seen.has(key)) bad.push('stacked ' + pl + ' ' + key); seen.add(key); }
        }
      }
      const sq = new Map();
      for (let pl = 0; pl < 4; pl++) for (const p of g.pos[pl]) if (p >= 0 && p < N) { const a = abs(pl, p); if (sq.has(a)) bad.push('shared square ' + a); sq.set(a, pl); }
      return bad;
    }
    function simulate(games = 100, seed = 7, o = {}) {
      const R = rng(seed), out = { games, finished: 0, wins: [0, 0, 0, 0], turns: [], captures: 0, enters: 0, bad: [], enterOn6: true, exactHome: true };
      for (let k = 0; k < games; k++) {
        const g = create({ pieces: o.pieces || 4, first: k % 4 });
        let turns = 0;
        while (g.winner < 0 && turns < 4000) {
          const log = turn(g, R, (gg, pl, moves, roll) => {
            for (const m of moves) { if (m.enter && roll !== 6) out.enterOn6 = false; if (m.to > N + 3) out.exactHome = false; }
            return aiPick(gg, pl, moves, R);
          });
          turns++;
          const bad = check(g); if (bad.length) { out.bad.push(...bad); break; }
          void log;
        }
        if (g.winner >= 0) { out.finished++; out.wins[g.winner]++; }
        out.turns.push(turns); out.captures += g.captures; out.enters += g.enters;
      }
      out.avgTurns = Math.round(out.turns.reduce((a, b) => a + b, 0) / games); out.maxTurns = Math.max(...out.turns); delete out.turns;
      return out;
    }
    return { N, START, TRACK, HOMES, BASES, abs, create, at, legal, stuck, apply, threat, aiPick, turn, check, simulate, STYLE };
  })();

  // ---------------- drawing the board (the overlay's canvas, and the little board on the garden table)
  // Turned so your base (red) is bottom left; the others go round clockwise: Adi, Hilde, Kalle.
  const rot = (c, r) => [r, 10 - c];
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function boardGeom(W) { const cell = W / 11.7, off = (W - cell * 11) / 2; return { cell, off, R: cell * 0.36, P: (col, row) => { const [cc, rw] = rot(col, row); return [off + (cc + 0.5) * cell, off + (rw + 0.5) * cell]; } }; }
  function piecePos(B, pl, i, p) {
    if (p === -1) return B.P(...MADN.BASES[pl][i]);
    if (p >= MADN.N) return B.P(...MADN.HOMES[pl][p - MADN.N]);
    return B.P(...MADN.TRACK[MADN.abs(pl, p)]);
  }
  function pawn(c, x, y, R, col, o = {}) {
    c.save(); c.translate(x, y - (o.lift || 0));
    c.fillStyle = 'rgba(43,34,53,0.22)'; c.beginPath(); c.ellipse(0, R * 0.62 + (o.lift || 0), R * 0.72, R * 0.26, 0, 0, TAU); c.fill();
    c.lineWidth = Math.max(1.5, R * 0.14); c.strokeStyle = INK; c.fillStyle = col;
    c.beginPath(); c.moveTo(-R * 0.62, R * 0.6); c.quadraticCurveTo(-R * 0.5, -R * 0.1, -R * 0.2, -R * 0.25); c.lineTo(R * 0.2, -R * 0.25); c.quadraticCurveTo(R * 0.5, -R * 0.1, R * 0.62, R * 0.6); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.arc(0, -R * 0.42, R * 0.36, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(-R * 0.12, -R * 0.54, R * 0.12, 0, TAU); c.fill();
    if (o.label) { c.fillStyle = INK; c.font = `800 ${Math.round(R * 0.62)}px "Segoe UI", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.label, 0, R * 0.22); }
    c.restore();
  }
  // g: a game (or null: the empty board with everyone at home); o: { movable, sel, anim: { pl, i, x, y, lift }, floats, t, plain }
  function drawBoard(c, W, g, o = {}) {
    const B = boardGeom(W), { cell, R } = B, t = o.t || 0;
    c.clearRect(0, 0, W, W);
    c.fillStyle = '#f6e3ab'; rr(c, 2, 2, W - 4, W - 4, cell * 0.6); c.fill(); c.lineWidth = Math.max(2, W / 170); c.strokeStyle = INK; c.stroke();
    c.fillStyle = 'rgba(255,250,240,0.55)';
    const [ax, ay] = B.P(4, 0), [bx, by] = B.P(6, 10); rr(c, Math.min(ax, bx) - cell * 0.5, Math.min(ay, by) - cell * 0.5, Math.abs(bx - ax) + cell, Math.abs(by - ay) + cell, cell * 0.3); c.fill();
    const [cx1, cy1] = B.P(0, 4), [cx2, cy2] = B.P(10, 6); rr(c, Math.min(cx1, cx2) - cell * 0.5, Math.min(cy1, cy2) - cell * 0.5, Math.abs(cx2 - cx1) + cell, Math.abs(cy2 - cy1) + cell, cell * 0.3); c.fill();
    const circle = (x, y, r, fill, lw = 1) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = fill; c.fill(); c.lineWidth = Math.max(1.2, W / 260) * lw; c.strokeStyle = INK; c.stroke(); };
    // the track (dotted path between squares), then the squares
    c.strokeStyle = 'rgba(43,34,53,0.35)'; c.lineWidth = Math.max(1, W / 300); c.beginPath();
    MADN.TRACK.forEach(([col, row], i) => { const [x, y] = B.P(col, row); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.closePath(); c.stroke();
    MADN.TRACK.forEach(([col, row], i) => { const [x, y] = B.P(col, row), pl = MADN.START.indexOf(i); circle(x, y, R, pl >= 0 ? PLAYERS[pl].light : '#fffaf0', pl >= 0 ? 1.4 : 1);
      if (pl >= 0 && !o.plain) { c.fillStyle = PLAYERS[pl].color; c.font = `900 ${Math.round(R * 0.8)}px Bahnschrift, "Segoe UI", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('A', x, y + 1); } });
    for (let pl = 0; pl < 4; pl++) {
      const pts = MADN.BASES[pl].map(([col, row]) => B.P(col, row)), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
      c.fillStyle = PLAYERS[pl].light; rr(c, Math.min(...xs) - cell * 0.55, Math.min(...ys) - cell * 0.55, Math.max(...xs) - Math.min(...xs) + cell * 1.1, Math.max(...ys) - Math.min(...ys) + cell * 1.1, cell * 0.4); c.fill();
      c.lineWidth = Math.max(1.5, W / 220); c.strokeStyle = INK; c.stroke();
      pts.forEach(([x, y]) => circle(x, y, R * 0.92, '#fffaf0'));
      MADN.HOMES[pl].forEach(([col, row]) => { const [x, y] = B.P(col, row); circle(x, y, R * 0.92, PLAYERS[pl].light); });
    }
    { const [x, y] = B.P(5, 5); c.fillStyle = '#e86a9a'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; c.beginPath(); c.arc(x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.55, R * 0.42, 0, TAU); c.fill(); } c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(x, y, R * 0.42, 0, TAU); c.fill(); }
    // highlights: the pieces you can move (pulsing), and the way the chosen one goes
    const sel = o.sel;
    if (g && sel) {
      const steps = [];
      if (sel.enter) steps.push(0); else for (let p = sel.from + 1; p <= sel.to; p++) steps.push(p);
      steps.forEach((p, k) => { const [x, y] = piecePos(B, sel.pl, sel.i, p); c.fillStyle = k === steps.length - 1 ? 'rgba(33,164,147,0.45)' : 'rgba(33,164,147,0.25)'; c.beginPath(); c.arc(x, y, k === steps.length - 1 ? R * 0.95 : R * 0.32, 0, TAU); c.fill(); });
    }
    if (g && o.movable) o.movable.forEach((m, k) => {
      const [x, y] = piecePos(B, m.pl, m.i, m.from), pulse = 1 + 0.12 * Math.sin(t * 6);
      c.lineWidth = Math.max(2, W / 150) * (sel === m ? 1.5 : 1); c.strokeStyle = sel === m ? '#21a493' : '#e6a92e'; c.beginPath(); c.arc(x, y, R * 1.25 * pulse, 0, TAU); c.stroke();
    });
    // the pieces
    if (g || o.plain) for (let pl = 0; pl < 4; pl++) for (let i = 0; i < (g ? g.n : 4); i++) {
      if (g && o.anim && o.anim.pl === pl && o.anim.i === i) continue;
      const p = g ? g.pos[pl][i] : -1, [x, y] = piecePos(B, pl, i, p);
      const lab = g && o.movable && o.movable.some(m => m.pl === pl && m.i === i) && pl === 0 ? String(o.movable.findIndex(m => m.pl === pl && m.i === i) + 1) : '';
      pawn(c, x, y, R, PLAYERS[pl].color, { label: lab });
    }
    if (g && o.anim) pawn(c, o.anim.x, o.anim.y, R, PLAYERS[o.anim.pl].color, { lift: o.anim.lift || 0 });
    // numbers floating up as a piece is counted along («eins, zwei, drei…»)
    (o.floats || []).forEach(f => { c.save(); c.globalAlpha = clamp(f.a, 0, 1); c.font = `800 ${Math.round(cell * 0.42)}px Bahnschrift, "Segoe UI", sans-serif`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#fffaf0'; c.strokeText(f.text, f.x, f.y); c.fillStyle = f.color || INK; c.fillText(f.text, f.x, f.y); c.restore(); });
  }
  function drawDie(c, W, v, o = {}) {
    c.clearRect(0, 0, W, W);
    c.save(); c.translate(W / 2, W / 2); c.rotate(o.tilt || 0);
    const s = W * 0.4; c.fillStyle = '#fffaf0'; rr(c, -s, -s, s * 2, s * 2, s * 0.32); c.fill(); c.lineWidth = Math.max(2, W / 26); c.strokeStyle = INK; c.stroke();
    const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v] || [];
    c.fillStyle = v === 6 ? '#e0503f' : INK; P.forEach(([x, y]) => { c.beginPath(); c.arc(x * s * 0.52, y * s * 0.52, s * 0.15, 0, TAU); c.fill(); });
    c.restore();
  }

  // ================================================================ build: the garden, the three of them, Adi's round
  let root = null, shown = false, stRef = null, garden = null, solids = [], capMesh = null, scarf = null;
  let ROUTE = [];
  const AS = { x: SEATS.adi.x, z: SEATS.adi.z, y: 0, yaw: 0, speed: 0, phase: 0, sit: true, mode: 'home', i: 0, pause: 0, stopYaw: 0, homeT: 0, homeFor: 25, seed: 0.3, blink: 2, talk: 0, wave: 0, near: false, hold: false, pose: null };
  const HS = { x: SEATS.hilde.x, z: SEATS.hilde.z, y: 0, yaw: SEATS.hilde.yaw, speed: 0, phase: 0, sit: true, seed: 1.7, blink: 3, talk: 0, pose: 'knit' };
  const KS = { x: SEATS.kalle.x, z: SEATS.kalle.z, y: 0, yaw: SEATS.kalle.yaw, speed: 0, phase: 0, sit: true, seed: 4.1, blink: 1, talk: 0, pose: 'paper' };
  let FA = null, FH = null, FK = null, gyF = (x, z) => WORLD.terrainAt(x, z);
  const sprites = {};
  // the people, for main (solids, the mini-map) and for speech bubbles; parked far away outside German games
  const person = (id, name, st, F, story) => ({ id, name, story: !!story, r: 0.42, talking: false, lines: null,
    get x() { return shown && !st.away ? st.x : 1e5; }, get z() { return shown && !st.away ? st.z : 1e5; }, get y() { return st.y; },
    get top() { return st.sit ? 1.32 : (F ? F.h : 1.6) + 0.08; }, get hidden() { return !shown || !!st.away; } });      // (st.away: a scene has them out, e.g. Kalle at the dentist)
  const ADI = person('adi', 'Adi', AS, null, true), HILDE = person('hilde', 'Hilde', HS, null, false), KALLE = person('kalle', 'Kalle', KS, null, false);
  AS.api = ADI; HS.api = HILDE; KS.api = KALLE;

  // doors along his round: he stops at those near the street and posts a letter
  function routeWithStops() {
    const pts = GARDEN_PATH.map(p => ({ x: p[0], z: p[1] }));
    const doors = (typeof TOWN !== 'undefined' && TOWN.layout ? TOWN.layout.buildings : []).filter(b => b.doorAt && b.kind === 'house');
    let prev = pts[pts.length - 1];
    for (const [x, z] of STREET_PATH) {
      const stops = [];
      for (const b of doors) {
        const dx = x - prev.x, dz = z - prev.z, l2 = dx * dx + dz * dz, t = ((b.doorAt.x - prev.x) * dx + (b.doorAt.z - prev.z) * dz) / l2;
        if (t < 0.08 || t > 0.92) continue;
        const px = prev.x + dx * t, pz = prev.z + dz * t, d = Math.hypot(b.doorAt.x - px, b.doorAt.z - pz);
        if (d > 3.4 || Math.hypot(b.doorAt.x + 10, b.doorAt.z + 146) < 17) continue;      // (not around the plaza)
        stops.push({ t, x: px + (b.doorAt.x - px) * 0.35, z: pz + (b.doorAt.z - pz) * 0.35, stop: { yaw: Math.atan2(b.doorAt.x - px, b.doorAt.z - pz), t: 1.5 } });
      }
      stops.sort((a, b) => a.t - b.t).forEach(s => pts.push(s));
      pts.push({ x, z }); prev = { x, z };
    }
    return pts;
  }
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    gyF = gy;
    root = new THREE.Group(); root.name = 'adolf'; root.visible = false; scene.add(root);
    garden = buildGarden(root, gy);
    solids = garden.solids.map(s => Object.assign(s, { x: 1e5, z: 1e5 }));      // (parked until a German game shows them)
    solids.forEach(s => WORLD.extra.push(s));
    FA = makeAdi(); FH = makeHilde(); FK = makeKalle();
    [FA, FH, FK].forEach(F => root.add(F.root));
    { // chapter 5's gift: the yellow scarf Hilde was knitting all along (on Adi from then on)
      const k = Kit(), y = '#f2c14e';
      k.add(GEO.torus, y, 0, 0.93, 0.01, 0.17, 0.17, 0.3, Math.PI / 2, 0, 0).add(GEO.box, y, 0.08, 0.77, 0.19, 0.085, 0.26, 0.05, 0.12, 0, 0.12).add(GEO.box, '#e0a020', 0.088, 0.645, 0.2, 0.087, 0.02, 0.052, 0.12, 0, 0.12);
      scarf = inked(k.P, 0.012); scarf.name = 'ad-scarf'; scarf.visible = false; FA.body.add(scarf);
    }
    Object.defineProperty(ADI, 'top', { get() { return AS.sit ? 1.32 : FA.h + 0.08; } });
    for (const [st, s] of [[HS, SEATS.hilde], [KS, SEATS.kalle]]) { st.x = s.x; st.z = s.z; st.y = gy(s.x, s.z); }
    AS.y = gy(AS.x, AS.z);
    ROUTE = routeWithStops();
    // a "!" when Adi has something for you, and his «Na?» when you pass by
    const markTex = textTex(64, 64, c => { c.font = '900 52px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.fillStyle = '#f2a33a'; c.strokeStyle = '#fffaf0'; c.lineWidth = 7; c.strokeText('!', 32, 52); c.fillText('!', 32, 52); });
    sprites.mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex, transparent: true, opacity: 0, depthWrite: false })); sprites.mark.scale.setScalar(0.55); root.add(sprites.mark);
    const naTex = textTex(128, 80, (c, W, H) => {
      c.fillStyle = '#ffffff'; c.strokeStyle = INK; c.lineWidth = 5; rr(c, 6, 6, W - 12, H - 30, 18); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(48, H - 25); c.lineTo(58, H - 6); c.lineTo(70, H - 25); c.closePath(); c.fill(); c.stroke(); c.fillRect(46, H - 30, 26, 8);
      c.fillStyle = '#d6453a'; c.font = '900 34px Bahnschrift, "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Na?', W / 2, (H - 24) / 2 + 4);
    });
    sprites.na = new THREE.Sprite(new THREE.SpriteMaterial({ map: naTex, transparent: true, opacity: 0, depthWrite: false })); sprites.na.scale.set(0.9, 0.56, 1); root.add(sprites.na);
    sprites.naT = 0; sprites.naCool = 2;
    function stats() {
      let tris = 0, calls = 0;
      root.traverseVisible(o => { if (o.isMesh) { const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += n; calls++; } });
      return { tris: Math.round(tris), calls, solids: solids.length, route: ROUTE.length, stops: ROUTE.filter(p => p.stop).length };
    }
    return { colliders: [], group: root, people: [ADI, HILDE, KALLE], update, stats, landmarks: LANDMARKS, objects: { garden, adi: FA, hilde: FH, kalle: FK } };
  }
  function setShown(on) {
    shown = on; if (root) root.visible = on;
    for (const s of solids) { s.x = on ? s.hx : 1e5; s.z = on ? s.hz : 1e5; }
  }
  // Mimo's postman cap (the prize), sitting between its ears like the straw hat
  function makeCap() {
    if (capMesh || !G || !G.cast || !G.cast.mimo) return;
    const g = new THREE.Group(); g.position.set(0, 0.6, -0.06); g.rotation.set(-0.26, 0, -0.08);
    const k = Kit();
    k.add(GEO.cyl, '#2c3e6b', 0, 0.06, 0, 0.15, 0.12, 0.15).add(GEO.cyl, '#2c3e6b', 0, 0.125, 0, 0.16, 0.025, 0.16).add(GEO.cyl, '#f2c14e', 0, 0.02, 0, 0.155, 0.04, 0.155);
    k.add(GEO.box, '#1f2a44', 0, 0.0, 0.14, 0.17, 0.02, 0.11, 0.15, 0, 0).add(GEO.torus, '#f7d04a', 0, 0.065, 0.152, 0.03, 0.03, 0.03);
    g.add(inked(k.P, 0.01)); g.visible = false; G.cast.mimo.body.add(g); capMesh = g;
  }
  const capOn = () => isDe() && !!(G && G.state.adolf && G.state.adolf.cap) && G.state.adolf.capOn !== false;

  // ---------------- per frame
  function moveTo(st, tx, tz, v, dt) {
    const dx = tx - st.x, dz = tz - st.z, d = Math.hypot(dx, dz);
    if (d < 0.05) return true;
    const step = Math.min(d, v * dt); st.x += (dx / d) * step; st.z += (dz / d) * step; st.speed = v;
    st.yaw = dampAngle(st.yaw, Math.atan2(dx, dz), 7, dt);
    return d - step < 0.05;
  }
  const lettersDone = st => QUEST_LETTERS.every(L => (st.del || {})[L.id]);
  // Adi stays home when the story wants him there: the party after the five letters, the first game, a game on
  function wantHome() { const st = S(); return busy || !!AS.hold || (!!st.job && lettersDone(st) && !(st.games > 0) && chOpen(2)); }
  function stepAdi(dt, Y) {
    const A = AS, d = Y ? Math.hypot(Y.x - A.x, Y.z - A.z) : 99;
    const wasNear = A.near;
    A.near = (!!Y && d < (A.near ? 3.2 : 2.6)) || !!ADI.talking;
    if (A.near && !wasNear && !ADI.talking && !A.sit) A.wave = 1.2;
    A.speed = 0; A.pose = null;
    if (A.hold) return;                                                     // (a scene has him)
    if (A.mode === 'home') {
      A.sit = true; A.x = SEATS.adi.x; A.z = SEATS.adi.z; A.yaw = dampAngle(A.yaw, SEATS.adi.yaw, 4, dt);
      A.homeT += dt;
      const youNear = Y && Math.hypot(Y.x - TABLE.x, Y.z - TABLE.z) < 12;
      if (A.homeT > A.homeFor && !wantHome() && !youNear) { A.mode = 'out'; A.i = 0; A.sit = false; A.x = ROUTE[0].x; A.z = ROUTE[0].z; }
      return;
    }
    A.sit = false;
    if (A.near) { if (Y) A.yaw = dampAngle(A.yaw, Math.atan2(Y.x - A.x, Y.z - A.z), 5, dt); return; }
    if (A.mode === 'out' && wantHome()) { A.mode = 'back'; A.i = Math.max(0, A.i - 1); A.pause = 0; }
    if (A.pause > 0) { A.pause -= dt; A.pose = 'deliver'; A.yaw = dampAngle(A.yaw, A.stopYaw, 6, dt); return; }
    const tg = ROUTE[A.i];
    if (moveTo(A, tg.x, tg.z, wantHome() ? 2.2 : 1.35, dt)) {
      if (A.mode === 'out') {
        if (tg.stop) { A.pause = tg.stop.t; A.stopYaw = tg.stop.yaw; }
        A.i++; if (A.i >= ROUTE.length) { A.mode = 'back'; A.i = ROUTE.length - 2; A.pause = 2.5; A.stopYaw = A.yaw + Math.PI; }
      } else { A.i--; if (A.i < 0) { A.mode = 'home'; A.homeT = 0; A.homeFor = 40 + Math.random() * 30; } }
    }
  }
  // sit Adi down at his chair at once (scenes, the board game)
  function adiHome() { const A = AS; A.mode = 'home'; A.sit = true; A.i = 0; A.pause = 0; A.homeT = 0; A.homeFor = 60; A.x = SEATS.adi.x; A.z = SEATS.adi.z; A.yaw = SEATS.adi.yaw; A.y = gyF(A.x, A.z); }
  function poseFig(F, st, dt, t, Y) {
    st.y = st.sit ? gyF(st.x, st.z) : gyF(st.x, st.z);
    F.root.position.set(st.x, st.y, st.z); F.root.rotation.y = st.yaw;
    const walk = clamp(st.speed / 1.3, 0, 1.5);
    if (st.speed > 0.05) st.phase += dt * (3 + st.speed * 2.6); else st.phase = damp(st.phase, Math.round(st.phase / Math.PI) * Math.PI, 8, dt);
    const sw = Math.sin(st.phase);
    st.talk = damp(st.talk || 0, st.api.talking ? 1 : 0, 10, dt);
    F.body.position.y = (st.sit ? F.sitY : 0) + Math.abs(sw) * 0.045 * Math.min(walk, 1.2) + st.talk * Math.abs(Math.sin(t * 13)) * 0.03;
    F.body.rotation.z = sw * 0.045 * walk + Math.sin(t * 1.1 + st.seed) * 0.015;
    F.legs.forEach((h, i) => { h.rotation.x = st.sit ? -1.42 : Math.sin(st.phase + i * Math.PI) * 0.55 * walk; });
    let a0 = [-0.12 - sw * 0.45 * walk, 0, -0.12], a1 = [-0.12 + sw * 0.45 * walk, 0, 0.12];
    if (st.sit) { a0 = [-0.95, 0, -0.18]; a1 = [-0.95, 0, 0.18]; }
    if (st.pose === 'deliver') a0 = [-1.35, 0, -0.1];
    if (st.pose === 'knit' && !st.api.talking) { const k = Math.sin(t * 7 + st.seed); a0 = [-1.0 + k * 0.08, 0, -0.35]; a1 = [-1.0 - k * 0.08, 0, 0.35]; }
    if (st.pose === 'paper' && !st.api.talking) { a0 = [-1.15, 0, -0.32]; a1 = [-1.15, 0, 0.32]; }
    if (st.cheer > 0) { st.cheer -= dt; a0 = [-0.2, 0, -2.5 - Math.sin(t * 10) * 0.2]; a1 = [-0.2, 0, 2.5 + Math.sin(t * 10) * 0.2]; }
    if (st.wave > 0) { st.wave -= dt; a1 = [-0.3, 0, 2.4 + Math.sin(t * 9) * 0.35]; }
    F.arms[0].rotation.set(...a0); F.arms[1].rotation.set(...a1);
    if (F.props.letter) F.props.letter.visible = st.pose === 'deliver';
    // the head: looks at you when you're close, otherwise idles about
    let hy = Math.sin(t * 0.37 + st.seed * 20) * (st.speed > 0.1 ? 0.15 : 0.4), hx = 0;
    if (st.look) hy = clamp(angDiff(st.yaw, Math.atan2(st.look.x - st.x, st.look.z - st.z)), -1.1, 1.1);
    else if (Y && Math.hypot(Y.x - st.x, Y.z - st.z) < 7) { hy = clamp(angDiff(st.yaw, Math.atan2(Y.x - st.x, Y.z - st.z)), -1.1, 1.1); hx = -0.05; }
    if ((st.pose === 'knit' || st.pose === 'paper') && !st.api.talking && !(Y && Math.hypot(Y.x - st.x, Y.z - st.z) < 4)) { hy *= 0.3; hx = 0.3; }
    F.head.rotation.y = damp(F.head.rotation.y, hy, 5, dt); F.head.rotation.x = damp(F.head.rotation.x, hx, 6, dt);
    if ((st.blink -= dt) < 0 && st.blink < -0.12) st.blink = 2 + Math.random() * 3.5;
    if (!F.eyes[0].isMesh || F.eyes[0].geometry.type !== 'TorusGeometry') F.eyes.forEach(e => { e.scale.y = st.blink < 0 ? 0.12 : 1; });
    F.mouth.scale.y = st.talk > 0.3 ? 0.6 + Math.abs(Math.sin(t * 16)) * 1.4 : 1;
  }

  function resetForState() {          // a new game or a loaded save: Adi starts at home; your cake isn't served yet
    adiHome(); AS.homeFor = 15 + Math.random() * 20; AS.hold = false;
    if (garden) garden.yourCake.visible = false;
    sprites.naT = 0;
  }
  function update(dt, t, you) {
    if (!G || !root) return;
    if (G.state !== stRef) { stRef = G.state; resetForState(); }
    const on = isDe() && !!G.state.flags.hatched && !(G.indoors && G.indoors());
    if (on !== shown) setShown(on);
    if (capMesh) capMesh.visible = capOn();
    if (myLock && G.sim.lock > 0 && !STORY.busy && !busy) { lock(false); G.cam.override = null; }     // (a scene that broke off never leaves you frozen)
    if (!on) { musicTick(t, true); return; }
    const far = you && Math.hypot(you.x + 10, you.z + 160) > 175;
    root.visible = !far;
    if (far) { musicTick(t, true); return; }
    stepAdi(dt, you);
    // (each of them is a dozen meshes: only drawn and animated near you; the garden hides behind the houses anyway)
    const dG = you ? Math.hypot(you.x - GARDEN.x, you.z - GARDEN.z) : 0, dA = you ? Math.hypot(you.x - AS.x, you.z - AS.z) : 0;
    FH.root.visible = garden.group.visible = dG < 75; FK.root.visible = dG < 75 && !KS.away; FA.root.visible = dA < 90;
    if (scarf) scarf.visible = !!S().c5;              // (chapter 5: Hilde's yellow scarf, on Adi)
    musicTick(t);
    if (FA.root.visible) poseFig(FA, AS, dt, t, you);
    if (FH.root.visible) { poseFig(FH, HS, dt, t, you); poseFig(FK, KS, dt, t, you); }
    // the "!" over Adi, and his «Na?» when you pass by before you've met
    const st = S(), M = sprites.mark, head = AS.sit ? 1.75 : FA.h + 0.55;
    const flag = (!st.met && chOpen(1)) || (!st.job && (G.state.flags.lessons || 0) >= 2 && chOpen(1)) || (st.job && lettersDone(st) && !st.party && AS.mode === 'home' && chOpen(2)) || (st.round && roundDone(st)) || nextReady();
    const dY = you ? Math.hypot(you.x - AS.x, you.z - AS.z) : 99;
    M.material.opacity = damp(M.material.opacity, flag && !ADI.talking && dY < 30 && sprites.naT <= 0 ? 1 : 0, 6, dt);
    M.position.set(AS.x, AS.y + head + Math.sin(t * 6) * 0.06, AS.z);
    sprites.naCool -= dt;
    if (!st.met && dY < 11 && dY > 2.4 && sprites.naCool <= 0 && !ADI.talking) { sprites.naT = 2.6; sprites.naCool = 22; AS.wave = 1.6; Sound.play('blip', 'town'); }
    sprites.naT -= dt;
    sprites.na.material.opacity = damp(sprites.na.material.opacity, sprites.naT > 0 ? 1 : 0, 8, dt);
    sprites.na.position.set(AS.x + 0.15, AS.y + head + 0.45, AS.z);
    if (UIB && UIB.open) boardTick(dt, t);
    if (you) triggers(you);
  }
  // arriving: the garden (once), and the party when the five letters are delivered
  function triggers(Y) {
    if (STORY.busy || STORY.line || G.state.teaching || G.journalOpen || G.sim.lock > 0 || busy) return;
    const st = S();
    if (!st.sawGarden && inGarden(Y.x, Y.z)) { st.sawGarden = true; G.save(); STORY.run(gardenScene); return; }
    if (st.job && lettersDone(st) && !st.party && chOpen(2) && AS.mode === 'home' && Math.hypot(Y.x - TABLE.x, Y.z - TABLE.z) < 3.4) { STORY.run(partyScene); return; }
  }

  // ================================================================ speech
  // someone else's object, wrapped so a line can sit over them without touching their own lines
  function talker(p, name, top) {
    return { name: name || p.name || '', get x() { return p.x; }, get z() { return p.z; }, get y() { return p.y !== undefined ? p.y : WORLD.terrainAt(p.x, p.z); },
      top: top || p.top || 1.6, get talking() { return !!p.talking; }, set talking(v) { p.talking = v; } };
  }
  // a line (an LT key, or { de: [...], en: [...] }) said over someone, through the weave like everyone's lines
  function speak(p, key, vars) {
    if (!isDe()) return Promise.resolve();
    const L = lineOf(key, vars), W = LEX.weave();
    p.lines = { en: L.weave || L.en, de: L.text };      // (sayInline decides, line by line, woven or the whole line in German)
    return STORY.sayInline(p);
  }
  const think = (text, s) => STORY.think(text, s);
  const npcTalker = (id, name, top) => { const n = G.sim.npc(id); return n ? talker(n, name, top) : null; };
  const townPerson = id => (G.town && G.town.people ? G.town.people.find(q => q.id === id) : null);
  function blueDoor() {
    const b = typeof TOWN !== 'undefined' && TOWN.layout.buildings.find(q => q.blue);
    if (!b || !b.doorAt) return null;
    const dx = b.doorAt.x - b.x, dz = b.doorAt.z - b.z, d = Math.hypot(dx, dz) || 1;
    return { name: 'Eine Stimme', x: b.doorAt.x, z: b.doorAt.z, y: gyF(b.doorAt.x, b.doorAt.z), top: 1.7, talking: false, front: { x: b.doorAt.x + dx / d * 0.9, z: b.doorAt.z + dz / d * 0.9 } };
  }
  // who gets a letter, as a speaker (or null if they're nowhere to be seen)
  function recipient(L) {
    if (L.npc) return npcTalker(L.npc, L.name, L.top);
    if (L.town) { const p = townPerson(L.town); return p && !p.hushed ? talker(p) : null; }
    if (L.door) return blueDoor();
    return null;
  }

  // ================================================================ the look of the boxes (CSS, added once)
  let cssDone = false;
  function css() {
    if (cssDone) return; cssDone = true;
    const s = document.createElement('style'); s.id = 'adolf-css';
    s.textContent = `
#adolf-phrase { z-index: 9; grid-template-columns: 96px 1fr; align-items: start; }
#adolf-phrase > canvas { background: #fff; border-radius: 14px; border: 2px dashed rgba(43,34,53,.3); }
#adolf-phrase .ap-col { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
#adolf-phrase .ap-tag { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--teal); }
#adolf-phrase .ap-big { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; }
#adolf-phrase .ap-big b { font: 800 28px Bahnschrift, "Segoe UI", sans-serif; color: var(--red); }
#adolf-phrase .ap-big span { font-size: 15px; font-style: italic; opacity: .75; }
#adolf-phrase .ap-big button { border: 2px solid var(--ink); border-radius: 8px; background: transparent; font-size: 13px; padding: 1px 7px; }
#adolf-phrase .ap-note { font-size: 13px; line-height: 1.35; opacity: .78; }
#adolf-phrase.ok .ap-big b::after { content: " ✓"; color: var(--teal); }
#adolf-board { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; background: rgba(20,18,30,.34); }
#adolf-board .ab-card { position: relative; display: grid; grid-template-columns: auto minmax(270px, 330px); gap: 14px; align-items: start; background: var(--paper);
  border: 3px solid var(--ink); border-radius: 20px; box-shadow: 0 0 0 7px #fff, 0 16px 0 6px rgba(43,34,53,.2); padding: 14px; max-width: calc(100vw - 32px); max-height: calc(100vh - 32px); overflow: auto; }
#adolf-board .ab-board { display: block; border-radius: 14px; cursor: pointer; }
#adolf-board .ab-side { display: flex; flex-direction: column; gap: 9px; min-width: 0; }
#adolf-board .ab-title { font: 800 21px Bahnschrift, "Segoe UI", sans-serif; line-height: 1.1; }
#adolf-board .ab-title small { display: block; font: 600 12px "Segoe UI", sans-serif; opacity: .6; margin-top: 3px; }
#adolf-board .ab-players { display: grid; gap: 3px; }
#adolf-board .ab-pl { display: flex; align-items: center; gap: 8px; padding: 3px 8px; border-radius: 10px; border: 2px solid transparent; font-weight: 700; font-size: 14px; }
#adolf-board .ab-pl.on { border-color: var(--ink); background: #fff3c4; }
#adolf-board .ab-pl i { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--ink); flex: none; }
#adolf-board .ab-pl span { margin-left: auto; font-size: 12px; letter-spacing: 1px; opacity: .8; }
#adolf-board .ab-dice { display: flex; align-items: center; gap: 12px; }
#adolf-board .ab-dice canvas { width: 70px; height: 70px; flex: none; }
#adolf-board .ab-roll { flex: 1; border: 3px solid var(--ink); border-radius: 14px; background: var(--teal); color: #fff; font: 800 20px Bahnschrift, "Segoe UI", sans-serif; padding: 8px 10px; box-shadow: 0 4px 0 rgba(43,34,53,.25); }
#adolf-board .ab-roll small { display: block; font: 700 11px "Segoe UI", sans-serif; opacity: .85; }
#adolf-board .ab-roll:disabled { background: #d9d3e0; color: #6e6878; box-shadow: none; cursor: default; }
#adolf-board .ab-say { min-height: 66px; background: #fff; border: 2px solid rgba(43,34,53,.15); border-radius: 14px; padding: 7px 11px; }
#adolf-board .ab-say .who { font-size: 11px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; color: #8a4f80; }
#adolf-board .ab-say .de { font-size: 17px; font-weight: 600; line-height: 1.3; }
#adolf-board .ab-say .en { font-size: 13px; font-style: italic; opacity: .65; }
#adolf-board .ab-say:not(.en-on) .en { display: none; }
#adolf-board .ab-say .ab-enb { float: right; font: 800 11px "Segoe UI", sans-serif; border: 2px solid #2b2235; border-radius: 8px; background: #fff; padding: 0 6px; cursor: pointer; }
#adolf-board .ab-say.en-on .ab-enb { background: #ffe36e; } #adolf-board .ab-say:not(.has-en) .ab-enb { visibility: hidden; }
#adolf-board .ab-talk { background: #fbf6e7; border: 2px dashed rgba(43,34,53,.25); border-radius: 14px; padding: 7px 10px; }
#adolf-board .ab-prompt { font-size: 13px; font-weight: 700; min-height: 18px; line-height: 1.35; }
#adolf-board .ab-prompt b { color: var(--red); }
#adolf-board .ab-talk form { display: flex; gap: 6px; margin-top: 6px; }
#adolf-board .ab-talk input { flex: 1; min-width: 0; font: 600 16px "Segoe UI", sans-serif; padding: 5px 9px; border: 2.5px solid var(--ink); border-radius: 10px; outline: none; }
#adolf-board .ab-talk input:focus { box-shadow: 0 0 0 3px rgba(33,164,147,.35); }
#adolf-board .ab-talk button { border: 2.5px solid var(--ink); border-radius: 10px; background: var(--ink); color: var(--paper); font-weight: 800; padding: 4px 10px; }
#adolf-board .ab-stars { display: flex; justify-content: space-between; font: 800 13px "Segoe UI", sans-serif; color: #b07a12; margin-top: 4px; }
#adolf-board .ab-stars i { font-style: normal; color: var(--ink); opacity: .55; font-weight: 600; }
#adolf-board .ab-keys { font-size: 11.5px; line-height: 1.75; opacity: .78; }
#adolf-board .ab-keys kbd { font: 700 10.5px "Segoe UI", sans-serif; border: 1.5px solid var(--ink); border-radius: 4px; padding: 0 4px; background: #fff; }
#adolf-board .ab-modal { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(255,250,240,.88); border-radius: 18px; }
#adolf-board .ab-box { background: #fff; border: 3px solid var(--ink); border-radius: 16px; padding: 14px 18px; max-width: 480px; box-shadow: 0 6px 0 rgba(43,34,53,.18); }
#adolf-board .ab-box h3 { margin: 0 0 8px; font: 800 22px Bahnschrift, "Segoe UI", sans-serif; }
#adolf-board .ab-box ul { margin: 0 0 8px; padding-left: 18px; font-size: 14px; line-height: 1.45; }
#adolf-board .ab-box p { margin: 6px 0; font-size: 14px; }
#adolf-board .ab-box .row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; }
#adolf-board .ab-box button { border: 2.5px solid var(--ink); border-radius: 12px; background: var(--paper); font-weight: 800; padding: 6px 14px; }
#adolf-board .ab-box button.go { background: var(--teal); color: #fff; }
#adolf-board .ab-rank { display: grid; gap: 4px; margin: 6px 0; }
#adolf-board .ab-rank div { display: flex; gap: 8px; align-items: center; font-weight: 700; }
#adolf-board .ab-rank i { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--ink); }
@media (max-width: 820px) { #adolf-board .ab-card { grid-template-columns: 1fr; } }
`;
    document.head.appendChild(s);
  }

  // ================================================================ expressions: say it back (echo), then use it (recall)
  // A box like the teach box: the expression, what it means, when people say it, a 🔊; you type it. In recall mode the
  // expression is hidden: you get the situation and the meaning, Tab shows letters, "I don't know" shows it all.
  let PB = null;
  function phraseDom() {
    if (PB) return PB;
    css();
    const box = document.createElement('div'); box.id = 'adolf-phrase'; box.className = 'panel hidden';
    box.innerHTML = '<canvas width="96" height="96"></canvas><div class="ap-col"><div class="ap-tag"></div><div class="ptitle"></div>'
      + '<div class="ap-big"><b></b><span></span><button type="button" title="Hear it">🔊</button></div><div class="ap-note"></div><div class="hint"></div>'
      + '<form autocomplete="off"><input spellcheck="false" autocomplete="off"><button type="submit">Say it</button></form>'
      + '<div class="prow" style="grid-column:auto"><button type="button" data-a="hint">Hint (Tab)</button><button type="button" data-a="idk">I don’t know (?)</button><button type="button" data-a="skip">Not now (Esc)</button></div></div>';
    document.body.appendChild(box);
    const q = s => box.querySelector(s);
    PB = { box, pic: q('canvas'), tag: q('.ap-tag'), title: q('.ptitle'), big: q('.ap-big'), bigB: q('.ap-big b'), bigEn: q('.ap-big span'), hear: q('.ap-big button'),
      note: q('.ap-note'), hint: q('.hint'), form: q('form'), input: q('input'), bHint: q('[data-a="hint"]'), bIdk: q('[data-a="idk"]'), bSkip: q('[data-a="skip"]'), resolve: null };
    return PB;
  }
  // o: { mode: 'echo' | 'recall', title, tag } → { ok, hints, tries, ms, learned, typed, cancelled }
  function phraseBox(id, o = {}) {
    return new Promise(resolve => {
      const B = phraseDom(), p = PH[id], t0 = performance.now();
      let hints = 0, tries = 0, learning = o.mode !== 'recall';
      ICONS.draw(B.pic, o.icon || 'speech');
      B.box.classList.remove('ok', 'shake');
      const show = () => {
        B.tag.textContent = o.tag || (o.mode === 'recall' ? 'Say it!' : 'New expression');
        B.title.textContent = o.title || (o.mode === 'recall' ? p.sit : 'Say it back!');
        B.big.style.display = learning ? '' : 'none';
        B.bigB.textContent = p.de; B.bigEn.textContent = p.en;
        B.note.textContent = learning ? p.note : `Meaning: “${p.en}”`;
        B.hint.textContent = learning ? 'Type it to say it' : hints ? [...p.de].map((ch, i) => (/[\s,.!?…]/.test(ch) || i === 0 || (hints >= 2 && i % 2 === 0) || hints >= 3 ? ch : '_')).join(' ') : 'From memory! Tab: a hint · ?: I don’t know';
        B.hint.classList.toggle('given', !learning && hints > 0);
        B.input.placeholder = learning ? p.de : 'type it…';
        B.bHint.style.display = B.bIdk.style.display = learning ? 'none' : '';
      };
      const say = () => { try { Sound.say(p.de.replace(/[«»…]/g, ''), 'de'); } catch (e) { /* no voice */ } };
      const finish = r => { B.box.classList.add('hidden'); Input.typing = false; B.input.blur(); cleanup(); PB.resolve = null; resolve(r); };
      const submit = e => {
        if (e) e.preventDefault();
        const text = B.input.value;
        if (/^\s*\?+\s*$/.test(text) || ['idk', 'i dont know', 'weiss nicht', 'keine ahnung'].includes(norm(text))) { learn(); return; }
        const m = phraseMatch(id, text);
        if (m.empty) return;
        if (m.ok) { B.box.classList.add('ok'); Sound.play('review'); finish({ ok: true, hints, tries, ms: performance.now() - t0, learned: o.mode === 'recall' && learning, typed: text, close: !!m.close }); return; }
        tries++; if (!learning) hints = Math.min(3, hints + 1);
        show(); B.box.classList.remove('shake'); void B.box.offsetWidth; B.box.classList.add('shake'); Sound.play('wrong'); B.input.select();
      };
      const learn = () => { learning = true; show(); say(); B.input.value = ''; B.input.focus(); };
      const key = e => {
        if (e.key === 'Tab') { e.preventDefault(); if (!learning) { hints = Math.min(3, hints + 1); show(); } }
        if (e.key === 'Escape') { e.preventDefault(); finish({ cancelled: true, hints, tries }); }
        e.stopPropagation();
      };
      const onHint = () => { hints = Math.min(3, hints + 1); show(); B.input.focus(); };
      const onSkip = () => finish({ cancelled: true, hints, tries });
      B.form.addEventListener('submit', submit); B.input.addEventListener('keydown', key); B.hear.addEventListener('click', say);
      B.bHint.addEventListener('click', onHint); B.bIdk.addEventListener('click', learn); B.bSkip.addEventListener('click', onSkip);
      function cleanup() { B.form.removeEventListener('submit', submit); B.input.removeEventListener('keydown', key); B.hear.removeEventListener('click', say); B.bHint.removeEventListener('click', onHint); B.bIdk.removeEventListener('click', learn); B.bSkip.removeEventListener('click', onSkip); }
      PB.resolve = { submit: text => { B.input.value = text; submit(); }, idk: learn, cancel: onSkip };     // (tests)
      B.input.value = ''; show(); B.box.classList.remove('hidden'); Input.typing = true;
      if (learning) setTimeout(say, 150);
      setTimeout(() => B.input.focus(), 30);
    });
  }
  // Adi's own review times for the expressions. LEX's due time is parked far ahead: story.js's outdoor reviews have no
  // spot to point at for an expression, and a due one there would hold up the word reviews.
  function park(id, ok) {
    const s = LEX.st(id), r = S().rev || (S().rev = {});
    r[id] = nowS() + (ok ? clamp(s.str || 60, 60, 86400 * 3) : 45);
    s.due = nowS() + 1e8;
  }
  // Teach it the first time (say it back), recall it after that. Counts in LEX like words do.
  async function usePhrase(id, o = {}) {
    if (!isDe() || !PH[id]) return { cancelled: true };
    const taught = LEX.taught(id);
    LEX.expose(id);
    const r = await phraseBox(id, Object.assign({ mode: taught && !o.echo ? 'recall' : 'echo' }, o));
    if (r.cancelled) return r;
    if (!taught || o.echo) LEX.attempt(id, { ok: true, hints: 0, ms: r.ms, mode: 'echo' });
    else if (r.learned) LEX.learnt(id);
    else LEX.attempt(id, { ok: r.tries === 0 && r.hints === 0, hints: r.hints + r.tries, ms: r.ms, mode: 'review' });
    park(id, !r.learned);
    if (G) { G.sim.mimo.happy = Math.max(G.sim.mimo.happy, 0.8); if (!taught) UI.toast(`New expression: «${PH[id].de}» (${PH[id].en})`); }
    return r;
  }
  const duePhrases = () => { const r = S().rev || {}; return PHRASES.filter(p => LEX.taught(p.id) && (r[p.id] || 0) <= nowS()).map(p => p.id); };
  // a free sentence (handing a letter over, asking, greeting): the game's "tell Mimo" box with a model for "I don't know"
  function sayBox(o) {
    return UI.command({ name: 'Adi', icon: o.icon || 'letter', title: o.title, verbs: [], placeholder: o.placeholder || 'say it in German…', hint: o.hint || '', model: o.model, modelEn: o.modelEn });
  }

  // ================================================================ scenes: meeting Adi, the job, the letters
  const hold = on => { AS.hold = on; };
  // the letters you carry right now: the quest's five, or a little round's three
  function activeLetters() {
    const st = S(), del = st.del || {}, out = [];
    if (st.job) for (const L of QUEST_LETTERS) if (!del[L.id]) out.push(L);
    if (st.round) for (const id of st.round.ids) if (!st.round.done[id] && LETTER[id]) out.push(LETTER[id]);
    return out;
  }
  const isKnown = L => { const st = S(); return !!((st.known || {})[L.id] || (st.round && st.round.known && st.round.known[L.id])); };
  function setKnown(L) { const st = S(); if (st.round && st.round.ids.includes(L.id)) (st.round.known || (st.round.known = {}))[L.id] = true; else (st.known || (st.known = {}))[L.id] = true; }
  function roundDone(st) { return !!(st.round && st.round.ids.every(id => st.round.done[id])); }
  function bagSync() {
    const st = S(), n = activeLetters().length, bag = G.state.bag || (G.state.bag = {});
    if (n) { bag['k.adiLetter'] = n; LEX.expose('k.adiLetter'); } else delete bag['k.adiLetter'];
    void st;
  }

  async function talkAdi() {
    const st = S();
    if (!st.met) { if (!chOpen(1)) return speak(ADI, 'adi.busy0'); return meetScene(); }
    if (!st.job) { if ((G.state.flags.lessons || 0) >= 2) return jobScene(); return speak(ADI, 'adi.later'); }
    if (!lettersDone(st)) {
      await speak(ADI, 'adi.left', { n: activeLetters().filter(L => QUEST_LETTERS.includes(L)).length });
      await quizDue();
      return;
    }
    if (!st.party) return speak(ADI, chOpen(2) ? 'adi.home' : 'adi.home.later');      // (chapter 2, Feierabend, waits for its gate)
    if (!(st.games > 0)) { await speak(ADI, 'adi.play'); return playAtTable(); }
    if (st.round && roundDone(st)) return finishRound();
    return adiMenu();
  }
  async function meetScene() {
    const st = S();
    lock(true); hold(true); AS.sit = AS.mode === 'home';
    await speak(ADI, 'adi.hello');
    await speak(ADI, 'adi.name');
    await speak(ADI, 'adi.sigh');
    await speak(ADI, 'adi.call');
    await speak(ADI, 'adi.na');
    await usePhrase('ph.na', { title: 'Adi says «Na?». Say it back to him!' });
    await speak(ADI, 'adi.na.back');
    const r = await sayBox({ icon: 'wave', title: 'Say hi to Adi, by name!', placeholder: 'Hallo, …!', model: 'Hallo, Adi!', modelEn: 'Hi, Adi!' });
    const n = r && !r.cancelled ? canon(r.text) : '';
    st.met = true; G.save();
    if (/\badolf\b/.test(n)) await speak(ADI, 'adi.greet.adolf');
    else if (/\badi\b/.test(n)) await speak(ADI, 'adi.greet.adi');
    else if (n) await speak(ADI, 'adi.greet.other');
    if ((G.state.flags.lessons || 0) >= 2) await jobScene(true);
    else await speak(ADI, 'adi.later');
    hold(false); lock(false);
  }
  async function jobScene(inner) {
    const st = S();
    if (!inner) { lock(true); hold(true); }
    await speak(ADI, 'adi.busy');
    await speak(ADI, 'adi.help');
    await speak(ADI, 'adi.how');
    await speak(ADI, 'adi.give');
    await speak(ADI, 'adi.klar');
    await usePhrase('ph.allesklar', { title: 'Adi asks «Alles klar?». Answer him: all good!', echo: !LEX.taught('ph.allesklar') });
    st.job = true; st.del = st.del || {}; st.known = Object.assign({ rosa: true }, st.known || {});
    bagSync(); Sound.play('page'); UI.toast('📬 Adi gave you 5 letters (see your Quests)');
    if (typeof QUESTS !== 'undefined') QUESTS.track('adolf');
    G.save();
    await speak(ADI, 'adi.bye');
    if (!inner) { hold(false); lock(false); }
  }
  // Adi asks one expression that's due (at most one per chat, so it never gets in the way)
  let quizT = -1e9;
  async function quizDue() {
    const due = duePhrases(); if (!due.length || nowS() - quizT < 50) return;
    quizT = nowS();
    await speak(ADI, 'adi.quiz');
    await usePhrase(due[0], { tag: 'Adi asks', title: PH[due[0]].sit });
  }

  // ---------------- handing a letter over
  async function deliver(L) {
    const st = S(), p = recipient(L); if (!p) return;
    lock(true);
    G.sim.mimo.look = { x: p.x, z: p.z };
    // a little scene first, for some of them
    if (L.id === 'baecker') { await speak(p, 'lucas.q'); await usePhrase('ph.genau', { title: 'Lucas asks if he’s the one. Yes, exactly!' }); }
    if (L.id === 'besen') { await speak(p, 'hugo.no'); await usePhrase('ph.doch', { title: 'Hugo says the letter isn’t for him. But it is! Contradict his “no”.' }); }
    if (L.door) { Sound.play('wood'); await wait(0.22); Sound.play('wood'); await wait(0.22); Sound.play('wood'); await wait(0.4); await speak(p, 'blue.who'); }
    let res = null;
    for (;;) {
      const r = await sayBox({ title: `Hand over the letter «${L.addr}». Say what it is and who it’s for!`, placeholder: 'Ein Brief für …', model: modelOf(L), modelEn: L.modelEn || 'A letter for …!',
        hint: 'für + who: «für Sie», «für den Bäcker» (der → den), «für die Familie»' });
      if (!r || r.cancelled) break;
      const g = gradeHandover(r.text, L);
      if (g.grade === 'D') { Sound.play('wrong'); UI.toast(g.why); continue; }
      res = g; break;
    }
    if (!res) { G.sim.mimo.look = null; lock(false); return; }
    const coins = { S: 3, A: 2, B: 1, C: 1 }[res.grade] || 1;
    G.state.coins = (G.state.coins || 0) + coins;
    Sound.play(res.grade === 'S' ? 'chest' : 'review');
    UI.toast(`✉ ${res.grade}${res.grade === 'S' ? ' · perfect!' : ''} · 🪙 +${coins}`);
    if (res.why) think(res.why, 6);
    if (st.round && st.round.ids.includes(L.id) && !st.round.done[L.id]) st.round.done[L.id] = true;
    else (st.del || (st.del = {}))[L.id] = true;
    bagSync(); G.save();
    // their thanks, and an expression to take away
    if (L.id === 'rosa') { await speak(p, 'rosa.get'); await speak(p, 'rosa.bye'); const r2 = await usePhrase('ph.schoenentag', { title: 'Rosa wishes you a nice day. Say it back to her!' }); if (!r2.cancelled) await speak(p, 'rosa.back'); }
    else if (L.id === 'baecker') await speak(p, 'lucas.get');
    else if (L.door) { await speak(p, 'blue.get'); await speak(p, 'blue.bye'); await usePhrase('ph.tschuess', { title: 'The voice says bye. Say bye back!' }); }
    else if (L.id === 'besen') await speak(p, 'hugo.get');
    else if (L.id === 'trainer') { await speak(p, 'bruno.get'); const r3 = await usePhrase('ph.mahlzeit', { title: 'Bruno greets you the lunchtime way. Answer him the same way!' }); if (!r3.cancelled) await speak(p, 'bruno.after'); }
    else await speak(p, 'rcpt.thanks');
    G.sim.mimo.look = null; lock(false);
    if (st.round && roundDone(st)) think('All three delivered! Back to Adi for the pay.', 4.5);
    else if (st.job && lettersDone(st) && !st.party) { think('All five delivered! Adi said: «Feierabend» in his {w.garden}, behind the houses next to the school.', 6); }
  }
  // «Für den Bäcker»… to Marta? She's die Bäckerin.
  async function martaGotcha() {
    const p = npcTalker('baker', 'Marta', 1.9); if (!p) return;
    lock(true);
    await speak(p, 'marta.gotcha');
    const r = await usePhrase('ph.achso', { title: 'Oh! Bäcker is a man, Bäckerin a woman. Now you get it!' });
    if (!r.cancelled) await speak(p, 'marta.ok');
    setKnown(LETTER.baecker); S().gotcha = true; G.save();
    lock(false);
  }
  // asking a townsperson where someone lives
  async function askVillager(person, name) {
    const st = S(), p = talker(person, name), list = activeLetters(), unknown = list.filter(L => !isKnown(L)), first = unknown[0] || list[0];
    if (!first) return;
    lock(true); p.talking = true;
    const r = await sayBox({ icon: 'wave', title: `Ask ${p.name} where someone lives`, placeholder: 'Wo wohnt …?', hint: 'Your letters: ' + list.map(L => '«' + L.addr + '»').join(' · '),
      model: `Wo wohnt ${first.nom}?`, modelEn: 'Where does … live?' });
    p.talking = false;
    if (!r || r.cancelled) { lock(false); return; }
    const a = parseAsk(r.text, list);
    if (a.target === 'baeckerin') await speak(p, 'ask.baeckerin');
    else if (!a.target) await speak(p, a.q ? 'ask.nobody' : 'ask.huh');
    else {
      await speak(p, a.target.where);
      setKnown(a.target);
      if (a.slip) UI.toast(`Close! In «Wo wohnt ${a.target.nom}?» they’re the one who lives there: der, not den.`);
      else if (!a.q || !a.v) UI.toast(`Better: «Wo wohnt ${a.target.nom}?»`);
      else Sound.play('review');
      st.asked = (st.asked || 0) + 1; G.save();
    }
    lock(false);
  }

  // ================================================================ scenes: the garden, Feierabend, the menu, rounds, practice
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const tableShot = () => { const y = gyF(TABLE.x, TABLE.z); G.cam.override = { pos: V(TABLE.x + 3.4, y + 3.3, TABLE.z + 4.4), look: V(TABLE.x - 0.2, y + 0.8, TABLE.z - 0.2) }; };
  async function gardenScene() {
    const g = GNOMES[4];
    think('A whole garden full of {w.gnome:pl}… and a table set for {w.coffee} and {w.cake}!', 5);
    await wait(1.2);
    if (!LEX.taught('w.gnome') && LEX.mayIntroduce()) await STORY.teachWord('w.gnome', { spot: { x: g.x + 1.2, z: g.z + 0.9 }, look: { x: g.x, z: g.z } });
  }
  async function partyScene() {
    const st = S(); if (st.party) return;
    lock(true); adiHome(); hold(true);
    const Y = G.sim.you; Y.x = PLAY_SPOT.x; Y.z = PLAY_SPOT.z; Y.yaw = PLAY_SPOT.yaw; G.sim.snap();
    tableShot(); G.sim.mimoGo({ x: TABLE.x + 1.5, z: TABLE.z + 1.7 }, TABLE);
    await wait(0.6);
    AS.cheer = 1.2;
    await speak(ADI, 'party.hi');
    await usePhrase('ph.mensch', { title: 'Adi is amazed. Say it with him!' });
    await speak(ADI, 'party.fa');
    await usePhrase('ph.feierabend', { title: 'Work is done for today! Cheer with him!' });
    await speak(ADI, 'party.friends');
    await speak(HILDE, 'hilde.hi');
    await speak(KALLE, 'kalle.hi');
    await usePhrase('ph.allesklar', { title: 'Kalle asks «Na? Alles klar?». Tell him all’s good!' });
    await speak(ADI, 'party.cake');
    const r = await sayBox({ icon: 'cake', title: 'Adi offers you a piece of cake. Answer him!', placeholder: 'Ja, …', model: 'Ja, bitte!', modelEn: 'Yes, please!', hint: 'Yes, please: «Ja, bitte!» · No, thanks: «Nein, danke!»' });
    const n = r && !r.cancelled ? canon(r.text) : '';
    if (/\bnein\b/.test(n)) await speak(ADI, 'party.nein'); else await speak(ADI, 'party.ja');
    if (n && !/\bbitte\b|\bgern|\bdanke\b/.test(n)) UI.toast('Polite: «Ja, bitte!» (yes, please)');
    garden.yourCake.visible = true; Sound.play('pip');
    await speak(ADI, 'party.appetit');
    await usePhrase('ph.appetit', { title: 'Wish everyone a good meal, too!' });
    G.sim.mimo.happy = 1.5;
    await speak(HILDE, 'hilde.lecker');
    const r2 = await usePhrase('ph.lecker', { title: 'Hilde’s cake is delicious. Tell her!' });
    if (!r2.cancelled) await speak(HILDE, 'hilde.knew');
    if (!LEX.taught('w.coffee') && LEX.mayIntroduce()) await STORY.teachWord('w.coffee', { look: { x: TABLE.x + 0.44, z: TABLE.z - 0.38 } });
    st.party = true; G.save();
    await speak(ADI, 'party.game');
    await speak(HILDE, 'hilde.warn');
    G.cam.override = null; G.sim.mimoGo(null, null);
    hold(false); lock(false);
    await playAtTable({ first: true });
  }
  // ---------------- the neighbours, the gnomes, the mailbox
  let chatI = 0;
  async function talkNeighbour(who) {
    const st = S(), p = who === 'hilde' ? HILDE : KALLE;
    if (st.job && lettersDone(st) && !st.party && chOpen(2)) { if (AS.mode === 'home') return partyScene(); return speak(HILDE, 'hilde.away'); }
    if (who === 'kalle' && LEX.taught('ph.allesklar') && Math.random() < 0.5) { await speak(KALLE, 'kalle.idle1'); await usePhrase('ph.allesklar', { tag: 'Kalle asks', title: 'Kalle asks «Na? Alles klar?». Answer him!' }); return; }
    const k = who === 'hilde' ? (st.party ? 'hilde.idle2' : 'hilde.idle1') : (chatI++ % 2 ? 'kalle.idle2' : 'kalle.idle1');
    await speak(p, k);
  }
  const GNOME_LOOK = {
    gerd: '«Gerd», says the name on his hat. A {w.gnome} holding a sign: «Willkommen»!',
    guenther: '«Günther» has a tiny shovel. A very hard-working {w.gnome}.',
    udo: '«Udo» is fishing… in the grass. An optimist!',
    heinz: '«Heinz» is fast asleep among the {w.flower:pl}. Shh…',
    klaus: '«Klaus» peeks out from behind the bush. Hello there!',
  };
  // ---------------- Adi's menu (after the quest)
  async function adiMenu() {
    const st = S();
    await quizDue();
    const taught = PHRASES.filter(p => LEX.taught(p.id)).length, next = CHS.find(c => !chDone(c.n));
    const opts = [
      next && next.n >= 3 ? (chOpen(next.n) ? { label: `Chapter ${next.n}: ${next.title}`, sub: chSub(next.n), value: 'next' } : { label: `Chapter ${next.n}: ${next.title}`, sub: `later: ${next.wait}`, value: 'wait' }) : null,
      { label: 'Play «Mensch ärgere dich nicht»', sub: 'a game at Adi’s garden table, with Hilde and Kalle', value: 'game' },
      st.round ? { label: 'About my letters…', sub: `${activeLetters().length} still to deliver`, value: 'roundinfo' } : chDone(3) ? { label: 'Deliver some letters', sub: 'a little round: three letters, coins for good sentences', value: 'round' } : null,
      { label: 'Practice the expressions', sub: `${taught} of ${PHRASES.length} learned`, value: 'practice' },
      st.cap ? { label: st.capOn !== false ? 'Take off Mimo’s cap' : 'Put Mimo’s cap back on', sub: 'Adi’s old postman’s cap', value: 'cap' } : null,
      { label: '«Tschüss!»', sub: 'say bye', value: 'bye' },
    ].filter(Boolean);
    lock(true);
    const v = await UI.choose('Adi: «Na? Was machen wir?» (So, what shall we do?)', opts);
    lock(false);
    if (v === 'next') return chRun(next.n);
    if (v === 'wait') return speak(ADI, 'adi.later.ch');
    if (v === 'game') { await speak(ADI, 'adi.play'); return playAtTable(); }
    if (v === 'round') return startRound();
    if (v === 'roundinfo') return speak(ADI, 'adi.left', { n: activeLetters().length });
    if (v === 'practice') return practice();
    if (v === 'cap') { st.capOn = st.capOn === false; G.save(); return speak(ADI, st.capOn ? 'adi.capon' : 'adi.capoff'); }
    if (v === 'bye') { await speak(ADI, 'adi.tschuess'); if (LEX.taught('ph.tschuess')) await usePhrase('ph.tschuess', { tag: 'Say bye', title: 'Say bye to Adi!' }); }
  }
  function startRound() {
    const st = S(), R = Math.random;
    const here = POOL.filter(L => recipient(L));
    const ids = []; while (ids.length < 3 && here.length) { const L = here.splice(Math.floor(R() * here.length), 1)[0]; if (!ids.some(i => LETTER[i].town && LETTER[i].town === L.town)) ids.push(L.id); }
    st.round = { ids, done: {}, known: {} }; st.rounds = (st.rounds || 0) + 1;
    bagSync(); G.save();
    if (typeof QUESTS !== 'undefined') QUESTS.track('adolf.round');
    UI.toast('📬 3 letters: ' + ids.map(i => '«' + LETTER[i].addr + '»').join(' · '));
    return speak(ADI, 'round.give');
  }
  async function finishRound() {
    const st = S(), pay = 4;
    await speak(ADI, 'round.done');
    G.state.coins = (G.state.coins || 0) + pay; Sound.play('chest'); UI.toast(`🪙 +${pay} from Adi`);
    st.round = null; st.roundsDone = (st.roundsDone || 0) + 1; bagSync(); G.save();
  }
  async function practice() {
    const taught = PHRASES.filter(p => LEX.taught(p.id)).map(p => p.id);
    if (!taught.length) return;
    const due = duePhrases(), order = due.concat(taught.filter(id => !due.includes(id)).sort(() => Math.random() - 0.5)).slice(0, 5);
    await speak(ADI, 'adi.practice');
    let right = 0;
    for (let i = 0; i < order.length; i++) {
      const r = await usePhrase(order[i], { tag: `Practice ${i + 1}/${order.length}`, title: PH[order[i]].sit });
      if (r.cancelled) break;
      if (!r.learned && !r.hints && !r.tries) right++;
    }
    if (right) { G.state.coins = (G.state.coins || 0) + right; UI.toast(`Practice: ${right}/${order.length} from memory · 🪙 +${right}`); }
    G.save();
    return speak(ADI, right >= order.length - 1 ? 'adi.won.you' : 'adi.again');
  }
  // ---------------- the board game at the table: everyone takes their seat
  async function playAtTable(o = {}) {
    lock(true); hold(true);
    await UI.fade(1, 300);
    adiHome(); const Y = G.sim.you; Y.x = PLAY_SPOT.x; Y.z = PLAY_SPOT.z; Y.yaw = PLAY_SPOT.yaw; G.sim.mimo.x = TABLE.x + 1.6; G.sim.mimo.z = TABLE.z + 1.9; G.sim.snap();
    tableShot(); G.cam.snap(Math.PI, 0.3, 8.5);
    await UI.fade(0, 300);
    const len = o.pieces || await UI.choose('How long a game? (Wie lange?)', [
      { label: 'A short game', sub: '2 pieces each · about 5 minutes', value: 2 },
      { label: 'The full game', sub: '4 pieces each · the real thing', value: 4 },
    ]);
    let res = null;
    while (len) {
      res = await boardGame({ pieces: len });
      lock(true);
      if (!res.finished) { await speak(ADI, 'adi.again'); break; }
      await afterGame(res);
      if (!res.again) break;
    }
    G.cam.override = null; hold(false); lock(false);
    return res;
  }
  async function afterGame(res) {
    const st = S(), first = !(st.games > 0);
    st.games = (st.games || 0) + 1; if (res.winner === 0) st.wins = (st.wins || 0) + 1;
    G.state.coins = (G.state.coins || 0) + res.coins; G.save();
    if (res.winner === 0) await speak(ADI, 'adi.won.you');
    else if (!LEX.taught('ph.gutgemacht') || Math.random() < 0.5) await usePhrase('ph.gutgemacht', { title: `${PLAYERS[res.winner].name} won! Congratulate them.` });
    if (res.winner !== 3 && !LEX.taught('ph.naja')) { await speak(KALLE, 'kalle.naja'); await usePhrase('ph.naja', { title: 'Kalle shrugs. Shrug with him!' }); }
    await speak(KALLE, 'kalle.prost'); await usePhrase('ph.prost', { title: 'Everyone raises their coffee cups!' });
    if (first) {
      AS.cheer = 1;
      await speak(ADI, 'cap.give');
      st.cap = true; st.capOn = true; G.sim.mimo.happy = 2; Sound.play('chest'); G.w3d.fx.sparkle(G.sim.mimo.x, G.sim.mimo.ry + 0.9, G.sim.mimo.z, 16);
      UI.toast(`${G.state.mimoName} got Adi’s old postman’s cap!`); G.save();
      if (!LEX.taught('w.cap') && LEX.mayIntroduce()) await STORY.teachWord('w.cap', { look: { x: G.sim.mimo.x, z: G.sim.mimo.z }, title: `${G.state.mimoName} looks up at its new cap. What is it called?` });
      await speak(ADI, 'cap.look');
    }
    await speak(ADI, 'adi.thanks');
  }

  // ================================================================ the board game overlay
  let busy = false, UIB = null;
  // what Adi, Hilde and Kalle say while playing: [German, English]
  const BG = {
    start: { 1: [['Viel Glück, alle!', 'Good luck, everyone!']], 2: [['Ich gewinne immer.', 'I always win.']], 3: [['Oh je … viel Glück!', 'Oh dear… good luck!']] },
    yourturn: { 1: [['Du bist dran!', 'It’s your turn!']] },
    six: { 1: [['Eine Sechs! Mensch!', 'A six! «Mensch!»']], 2: [['Sechs! Ha!', 'Six! Ha!']], 3: [['Oh! Eine Sechs!', 'Oh! A six!']] },
    cap: { 1: [['Mensch, ärgere dich nicht! … ’Tschuldigung!', 'Hey, don’t get upset! … Sorry!'], ['Oh! Mensch, ärgere dich nicht! Nicht böse sein, ja?', 'Oh! Don’t get upset! Don’t be mad, OK?']],
      2: [['Zack! Raus mit dir!', 'Whack! Out you go!'], ['Hihi! Tschüss!', 'Hee hee! Bye-bye!']], 3: [['Oh nein, das wollte ich nicht! … Na ja.', 'Oh no, I didn’t mean to! … Oh well.']] },
    hit: { 1: [['Ach, macht nix! Ich ärgere mich nicht!', 'Oh, never mind! I’m not upset!']], 2: [['Na warte!', 'Just you wait!']], 3: [['Schade …', 'Too bad…']] },
    miss: { 1: [['Na ja, nächstes Mal!', 'Oh well, next time!']], 2: [['Pah! Würfel sind doof.', 'Pah! Silly dice.']], 3: [['Schade. Keine Sechs.', 'Too bad. No six.']] },
    home: { 1: [['Im Haus! Juhu!', 'Home! Yay!']], 2: [['Die ist sicher.', 'That one’s safe.']], 3: [['Geschafft!', 'Made it!']] },
    youhome: { 1: [['Gut gemacht!', 'Well done!']] },
    nomove: { 1: [['Kein Zug möglich. Schade!', 'No move possible. Too bad!']] },
    win: { 0: [['Gewonnen! Gut gemacht!', 'You won! Well done!']], 1: [['Gewonnen! Juhu! Noch eine Runde?', 'I won! Yay! Another round?']], 2: [['Wie immer. Ich gewinne immer!', 'As always. I always win!']], 3: [['Ich? Echt? Ich habe gewonnen?', 'Me? Really? I won?']] },
    dream: { 3: [['…', '(Kalle is gazing at the clouds.)']] }, dreamok: { 3: [['Oh! Ich? Danke!', 'Oh! Me? Thanks!']] }, dreamlate: { 2: [['Kalle! Du bist dran!', 'Kalle! It’s your turn!']] },
    star: { 1: [['Genau!', 'Exactly!'], ['Haha, genau!', 'Haha, exactly!']], 2: [['Pah!', 'Pah!']], 3: [['Ich ärgere mich ja nicht …', 'I’m not upset…']] },
    count: { 1: [['Genau, {n}!', 'Exactly, {n}!']] },
    glueck: { 1: [['Danke! Dir auch!', 'Thanks! You too!']] },
  };
  function boardDom() {
    if (UIB) return UIB;
    css();
    const el = document.createElement('div'); el.id = 'adolf-board'; el.className = 'hidden';
    el.innerHTML = '<div class="ab-card"><canvas class="ab-board"></canvas><div class="ab-side">'
      + '<div class="ab-title">«Mensch ärgere dich nicht»<small>At Adi’s garden table. The name means “hey, don’t get upset!”</small></div>'
      + '<div class="ab-players"></div>'
      + '<div class="ab-dice"><canvas width="140" height="140"></canvas><button class="ab-roll" type="button">Würfeln!<small>roll · Space</small></button></div>'
      + '<div class="ab-say"><button type="button" class="ab-enb" title="This line in English">EN</button><div class="who"></div><div class="de"></div><div class="en"></div></div>'
      + '<div class="ab-talk"><div class="ab-prompt"></div><form autocomplete="off"><input spellcheck="false" autocomplete="off" placeholder="Say something in German… (T)"><button type="submit">Say</button></form><div class="ab-stars"><span>★ 0</span><i>bonus stars become coins</i></div></div>'
      + '<div class="ab-keys"><kbd>Space</kbd> roll / move · <kbd>1</kbd>–<kbd>4</kbd> or <kbd>←</kbd><kbd>→</kbd> pick a piece · <kbd>T</kbd> talk · <kbd>F</kbd> faster · <kbd>H</kbd> rules · <kbd>Esc</kbd> leave</div>'
      + '</div><div class="ab-modal hidden"><div class="ab-box"></div></div></div>';
    document.body.appendChild(el);
    const q = s => el.querySelector(s);
    UIB = { el, cv: q('.ab-board'), dcv: q('.ab-dice canvas'), roll: q('.ab-roll'), players: q('.ab-players'), who: q('.ab-say .who'), de: q('.ab-say .de'), en: q('.ab-say .en'),
      prompt: q('.ab-prompt'), form: q('.ab-talk form'), input: q('.ab-talk input'), stars: q('.ab-stars span'), modal: q('.ab-modal'), box: q('.ab-box'),
      open: false, g: null, size: 480, movable: null, sel: null, anim: null, floats: [], dieV: 6, dieTilt: 0, waiter: null, fast: false, instant: false, auto: false, want: null, starsN: 0, t: 0, quit: false, modalKind: null };
    UIB.roll.addEventListener('click', () => act());
    { const sayEl = q('.ab-say'), enb = q('.ab-enb'); enb.addEventListener('click', e => { e.stopPropagation(); sayEl.classList.toggle('en-on'); enb.blur(); }); }      // (a line's English, on request)
    UIB.form.addEventListener('submit', e => { e.preventDefault(); talkSubmit(); });
    UIB.cv.addEventListener('pointerdown', e => {
      const U = UIB; if (!U.movable || !U.waiter || U.waiter.kind !== 'pick') return;
      const r = U.cv.getBoundingClientRect(), x = (e.clientX - r.left) * (U.size / r.width), y = (e.clientY - r.top) * (U.size / r.height), B = boardGeom(U.size);
      let best = null, bd = B.R * 1.5;
      for (const m of U.movable) { const [px, py] = piecePos(B, m.pl, m.i, m.from), d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = m; } }
      if (best) { U.sel = best; act(); }
    });
    return UIB;
  }
  const w = s => (UIB && UIB.instant ? Promise.resolve() : STORY.wait(s * (UIB && UIB.fast ? 0.4 : 1)));
  function render() {
    const U = UIB; if (!U || !U.open || U.instant) return;
    const c = U.cv.getContext('2d');
    c.setTransform(U.cv.width / U.size, 0, 0, U.cv.width / U.size, 0, 0);       // (the canvas's own scale: the page's pixel ratio can change while it's open)
    drawBoard(c, U.size, U.g, { movable: U.movable, sel: U.sel, anim: U.anim, floats: U.floats, t: U.t });
    const d = U.dcv.getContext('2d'); drawDie(d, 140, U.dieV, { tilt: U.dieTilt });
  }
  function refresh() {
    const U = UIB; if (!U) return;
    const g = U.g;
    U.players.innerHTML = PLAYERS.map((P, pl) => {
      const home = g ? g.pos[pl].filter(p => p >= MADN.N).length : 0, n = g ? g.n : 4;
      return `<div class="ab-pl ${g && g.turn === pl && g.winner < 0 ? 'on' : ''}"><i style="background:${P.color}"></i>${esc(P.name)}${pl === 0 ? ' (you)' : ''}<span>${'●'.repeat(home)}${'○'.repeat(n - home)}</span></div>`;
    }).join('');
    const myRoll = U.waiter && U.waiter.kind === 'roll', myPick = U.waiter && U.waiter.kind === 'pick';
    U.roll.disabled = !(myRoll || myPick);
    U.roll.innerHTML = myPick ? 'Ziehen!<small>move · Space · or click a piece</small>' : `Würfeln!<small>roll · Space${U.fast ? ' · fast' : ''}</small>`;
    U.stars.textContent = '★ ' + U.starsN;
    render();
  }
  function say(pl, key, vars = {}) {
    const U = UIB, set = BG[key] && BG[key][pl]; if (!U || !set) return;
    const [de, en] = pick(set, U.R || Math.random).map(s => fillVars(s, vars));
    // (by the weave like every line, DESIGN.md 17.3: mixed, the English with the words you know in German, whole in German as the
    // weave rises; the English only on request, EN on the line)
    U.who.textContent = pl === 0 ? 'Adi' : PLAYERS[pl].name; U.de.textContent = de;
    if (!U.instant && de && en && de !== en && typeof STORY !== 'undefined' && STORY.mixHTML) { try { U.de.innerHTML = STORY.mixHTML(de, en, { key: 'adolf:' + en }).html; } catch (e) { /* (as written) */ } }
    U.en.textContent = en && en !== de ? en : '';
    const box = U.de.parentNode; box.classList.remove('en-on'); box.classList.toggle('has-en', !!U.en.textContent);
    if (!U.instant) Sound.play('blip', 'town');
  }
  // a moment to say something (optional, for bonus stars): { kind: 'phrase', ids, text, stars, onHit } or { kind: 'count', n }
  function want(spec) { const U = UIB; U.want = spec; prompt(); }
  function prompt() {
    const U = UIB, w0 = U.want;
    if (!w0) { U.prompt.innerHTML = '<span style="opacity:.6">Type an expression any time: «Mensch!», «Schade!»…</span>'; return; }
    if (w0.kind === 'count') { U.prompt.innerHTML = `★ Count your roll in German: <b>${w0.n}</b> = ?` + ((U.counts || 0) < 3 ? ` <span style="opacity:.6">(${esc(NUMDE[w0.n])})</span>` : ''); return; }
    const p = PH[w0.ids[0]], known = LEX.taught(p.id);
    U.prompt.innerHTML = `★ ${esc(w0.text)} ` + (known ? `<span style="opacity:.65">(${esc(p.en)} · «${esc(p.de.charAt(0))}…»)</span>` : `<b>«${esc(p.de)}»</b> <span style="opacity:.65">(${esc(p.en)})</span>`);
  }
  function star(n) { const U = UIB; U.starsN += n; if (!U.instant) Sound.play('review'); refresh(); }
  function phraseHit(id) { const taught = LEX.taught(id); LEX.expose(id); LEX.attempt(id, { ok: true, hints: 0, ms: 2500, mode: taught ? 'review' : 'echo' }); park(id, true); }
  function talkSubmit(text) {
    const U = UIB; if (!U) return false;
    if (text === undefined) { text = U.input.value; U.input.value = ''; }
    const t = canon(text); if (!t) return false;
    const w0 = U.want;
    if (w0 && w0.kind === 'count' && NUMW[w0.n].includes(t)) {
      star(1); U.counts = (U.counts || 0) + 1; if (LEX.item('n.' + w0.n)) LEX.attempt('n.' + w0.n, { ok: true, ms: 2500, mode: 'talk' });
      say(1, 'count', { n: NUMDE[w0.n] }); U.want = null; prompt(); return true;
    }
    if (w0 && w0.kind === 'phrase') { const id = w0.ids.find(i => phraseMatch(i, text).ok); if (id) { star(w0.stars || 1); phraseHit(id); const f = w0.onHit; U.want = null; prompt(); if (f) f(id); return true; } }
    const any = PHRASES.find(p => phraseMatch(p.id, text).ok);
    if (any) { say(1, 'star'); if (LEX.taught(any.id)) phraseHit(any.id); return true; }
    if (/^\s*\d+\s*$/.test(text)) { U.prompt.innerHTML = 'In German, please! 1 eins · 2 zwei · 3 drei · 4 vier · 5 fünf · 6 sechs'; return false; }
    if (w0 && w0.kind === 'count') { U.prompt.innerHTML = `Not quite: <b>${w0.n}</b> = <b>${esc(NUMDE[w0.n])}</b>`; if (!U.instant) Sound.play('wrong'); U.want = null; return false; }
    return false;
  }
  function waitFor(kind) { return new Promise(r => { UIB.waiter = { kind, r }; refresh(); }); }
  function act() {
    const U = UIB, w0 = U.waiter; if (!w0) return;
    if (w0.kind === 'pick') { if (!U.sel) return; U.waiter = null; w0.r(U.sel); }
    else { U.waiter = null; w0.r(); }
    refresh();
  }
  function modal(kind, html) {
    const U = UIB; U.modalKind = kind; U.box.innerHTML = html; U.modal.classList.remove('hidden');
    U.box.querySelectorAll('[data-m]').forEach(b => { b.onclick = () => modalKey(b.dataset.m); });
  }
  function closeModal() { const U = UIB; U.modalKind = null; U.modal.classList.add('hidden'); }
  function modalKey(c) {
    const U = UIB, k = U.modalKind;
    if (k === 'rules') { closeModal(); return; }
    if (k === 'leave') { if (c === 'Enter' || c === 'leave' || c === 'NumpadEnter') { closeModal(); U.quit = true; const w0 = U.waiter; U.waiter = null; if (w0) w0.r(null); } else if (c === 'Escape' || c === 'stay') closeModal(); return; }
    if (k === 'result') { if (c === 'Enter' || c === 'Space' || c === 'again' || c === 'NumpadEnter') { closeModal(); U.resultR('again'); } else if (c === 'Escape' || c === 'done' || c === 'KeyE') { closeModal(); U.resultR('done'); } }
  }
  const showRules = () => modal('rules', '<h3>How to play</h3><ul>'
    + '<li>Roll a <b>6</b> to bring a piece out onto your start square (A). A 6 means: roll again!</li>'
    + '<li>No piece out yet? You get <b>three tries</b> to roll a 6.</li>'
    + '<li>Land exactly on someone, and their piece goes back home. You can’t land on your own piece.</li>'
    + '<li>While pieces wait at home, your start square must be cleared first.</li>'
    + '<li>After a whole lap, move into your home row: the exact number, no jumping over your own pieces.</li>'
    + '<li>All your pieces home first: you win!</li></ul>'
    + '<p>★ Bonus stars: count your roll in German (eins … sechs) and use the expressions at the right moment. Stars become coins.</p><div class="row"><button class="go" data-m="ok">Got it</button></div>');
  const askLeave = () => modal('leave', '<h3>Leave the game?</h3><p>This game won’t count. (Esc: keep playing)</p><div class="row"><button data-m="stay">Keep playing</button><button class="go" data-m="leave">Leave (Enter)</button></div>');
  function onKey(e) {
    const U = UIB; if (!U || !U.open) return;
    if (e.target === U.input) {
      if (e.key === 'Enter') { e.preventDefault(); talkSubmit(); }
      else if (e.key === 'Escape') { e.preventDefault(); U.input.blur(); }
      e.stopPropagation(); return;
    }
    const c = e.code, stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (U.modalKind) { stop(); modalKey(c); return; }
    if (c === 'Escape') { stop(); askLeave(); return; }
    if (c === 'KeyT' || c === 'Slash') { stop(); U.input.focus(); return; }
    if (c === 'KeyF') { stop(); U.fast = !U.fast; refresh(); return; }
    if (c === 'KeyH') { stop(); showRules(); return; }
    if (/^(Digit|Numpad)[1-4]$/.test(c) && U.movable) { stop(); const m = U.movable[+c.slice(-1) - 1]; if (m) { U.sel = m; act(); } return; }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(c)) {
      stop(); if (U.movable && U.movable.length) { const i = U.movable.indexOf(U.sel), d = /Left|Up|KeyA|KeyW/.test(c) ? -1 : 1; U.sel = U.movable[(i + d + U.movable.length) % U.movable.length]; render(); } return;
    }
    if (c === 'Space' || c === 'Enter' || c === 'KeyE' || c === 'NumpadEnter') { stop(); act(); return; }
    if (c === 'Tab') { stop(); return; }
    e.stopPropagation();
  }
  // per frame while it's open: the pulsing highlights, the numbers floating up
  function boardTick(dt) {
    const U = UIB; U.t += dt;
    if (U.floats.length) { U.floats.forEach(f => { f.a -= dt * 1.1; f.y -= dt * 22; }); U.floats = U.floats.filter(f => f.a > 0); }
    if (U.movable || U.floats.length) render();
  }

  async function rollDie() {
    const U = UIB, v = 1 + Math.floor(U.R() * 6);
    if (!U.instant) for (let k = 0; k < 5; k++) { U.dieV = 1 + Math.floor(Math.random() * 6); U.dieTilt = (Math.random() - 0.5) * 0.9; render(); Sound.play('wood'); await w(0.07); }
    U.dieV = v; U.dieTilt = 0; render();
    return v;
  }
  async function animMove(m) {
    const U = UIB; if (U.instant) return;
    const B = boardGeom(U.size), steps = [];
    if (m.enter) steps.push(0); else for (let p = m.from + 1; p <= m.to; p++) steps.push(p);
    let [x, y] = piecePos(B, m.pl, m.i, m.from);
    for (let k = 0; k < steps.length; k++) {
      const [tx, ty] = piecePos(B, m.pl, m.i, steps[k]), x0 = x, y0 = y;
      await STORY.tween(U.fast ? 0.07 : 0.13, e => { U.anim = { pl: m.pl, i: m.i, x: lerp(x0, tx, e), y: lerp(y0, ty, e), lift: Math.sin(e * Math.PI) * B.R * 0.8 }; render(); });
      x = tx; y = ty; Sound.play('pip');
      if (m.pl === 0 && !m.enter) U.floats.push({ x: tx, y: ty - B.R * 1.4, text: NUMDE[k + 1] || String(k + 1), a: 1.3, color: '#21a493' });
    }
    U.anim = null; render();
  }
  async function onCapture(by, v, sq) {
    const U = UIB, B = boardGeom(U.size), [x, y] = B.P(...MADN.TRACK[sq]);
    U.floats.push({ x, y: y - B.R, text: 'Zack!', a: 1.6, color: '#e0503f' });
    if (!U.instant) { Sound.play('poof'); if (G) G.sim.mimo.scared = 0.6; }
    if (by === 0) {
      say(v.pl, 'hit');
      want({ kind: 'phrase', ids: ['ph.aergere'], stars: 2, text: `You knocked ${PLAYERS[v.pl].name}’s piece home! Say the game’s name to them:`, onHit: () => say(v.pl, 'star') });
    } else {
      say(by, 'cap');
      if (v.pl === 0) want({ kind: 'phrase', ids: ['ph.schade', 'ph.naja'], stars: 1, text: 'Your piece had to go home. Too bad!' });
      else if (v.pl === 1 && U.R() < 0.6) { await w(1.1); say(1, 'hit'); }
    }
    await w(0.9);
  }
  // one game: resolves { finished, winner, stars, coins, again }
  const boardDefaults = {};          // (tests: { instant, auto, seed })
  async function boardGame(o = {}) {
    o = Object.assign({}, boardDefaults, o);
    const U = boardDom();
    busy = true; U.open = true; U.quit = false; U.starsN = 0; U.want = null; U.dreamed = false; U.firstTurn = true; U.floats = []; U.anim = null; U.movable = null; U.sel = null;
    U.R = o.seed ? rng(o.seed) : Math.random;
    if (o.instant !== undefined) U.instant = !!o.instant;
    if (o.auto !== undefined) U.auto = !!o.auto;
    const g = U.g = MADN.create({ pieces: o.pieces || 4, first: 0 });
    U.size = Math.round(clamp(Math.min(innerHeight - 90, innerWidth - 420), 300, 600));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    U.cv.width = U.cv.height = Math.round(U.size * dpr); U.cv.style.width = U.cv.style.height = U.size + 'px';
    U.el.classList.remove('hidden'); Input.typing = true; addEventListener('keydown', onKey, true);
    if (G) lock(true);
    U.who.textContent = ''; U.de.textContent = ''; U.en.textContent = ''; U.de.parentNode.classList.remove('en-on', 'has-en');
    refresh();
    say(1, 'start'); await w(0.9); say(2, 'start'); await w(0.8);
    want({ kind: 'phrase', ids: ['ph.glueck'], stars: 1, text: 'Wish everyone luck!', onHit: () => say(1, 'glueck') });
    while (g.winner < 0 && !U.quit) {
      const pl = g.turn; refresh();
      if (pl === 3 && !U.dreamed && !U.instant && !U.auto && U.R() < 0.4) await dream();
      let tries = MADN.stuck(g, pl) ? 3 : 1;
      for (let guard = 0; guard < 60 && !U.quit; guard++) {
        if (pl === 0 && !U.auto) { if (U.firstTurn) { U.firstTurn = false; say(1, 'yourturn'); } await waitFor('roll'); if (U.quit) break; }
        else await w(pl === 0 ? 0.2 : 0.45);
        const roll = await rollDie(); g.rolls++;
        const moves = MADN.legal(g, pl, roll);
        if (roll === 6 && pl !== 0 && U.R() < 0.35) say(pl, 'six');
        if (pl === 0) want({ kind: 'count', n: roll });
        if (moves.length) {
          let m;
          if (pl === 0 && !U.auto) { U.movable = moves; U.sel = moves[0]; refresh(); m = await waitFor('pick'); U.movable = null; U.sel = null; if (U.quit || !m) break; }
          else { if (pl !== 0) await w(0.25); m = MADN.aiPick(g, pl, moves, U.R); }
          await animMove(m);
          const sq = m.to < MADN.N ? MADN.abs(pl, m.to) : -1, victim = m.cap ? { pl: m.cap.pl, i: m.cap.i } : null;
          MADN.apply(g, m); refresh();
          if (victim) await onCapture(pl, victim, sq);
          else if (m.to >= MADN.N && m.from < MADN.N) { if (pl === 0) say(1, 'youhome'); else if (U.R() < 0.5) say(pl, 'home'); }
          if (g.winner >= 0) break;
        } else if (pl === 0 && !MADN.stuck(g, 0)) { say(1, 'nomove'); await w(0.5); }
        if (roll === 6) { tries = MADN.stuck(g, pl) ? 3 : 1; continue; }
        if (!moves.length && --tries > 0) { await w(0.2); continue; }
        if (!moves.length && MADN.stuck(g, pl)) { if (pl !== 0 && U.R() < 0.4) say(pl, 'miss'); if (pl === 0) want({ kind: 'phrase', ids: ['ph.schade', 'ph.naja'], stars: 1, text: 'No six in three tries. Too bad!' }); }
        break;
      }
      if (g.winner >= 0 || U.quit) break;
      g.turn = (pl + 1) % 4;
      if (pl === 0) await w(0.35);
    }
    const finished = g.winner >= 0;
    const coins = finished ? Math.min(20, U.starsN) + (g.winner === 0 ? 5 : 1) : 0;
    let again = false;
    if (finished) {
      say(g.winner, 'win');
      if (!U.instant) Sound.play(g.winner === 0 ? 'fanfare' : 'review');
      const order = [0, 1, 2, 3].sort((a, b) => (b === g.winner) - (a === g.winner) || g.pos[b].reduce((s, p) => s + Math.max(p, -1), 0) - g.pos[a].reduce((s, p) => s + Math.max(p, -1), 0));
      if (!U.auto && !U.instant) {
        const choice = await new Promise(r => { U.resultR = r; modal('result', `<h3>${g.winner === 0 ? 'You won!' : esc(PLAYERS[g.winner].name) + ' won!'}</h3><div class="ab-rank">${order.map((pl, k) => `<div>${k + 1}. <i style="background:${PLAYERS[pl].color}"></i>${esc(PLAYERS[pl].name)}${pl === 0 ? ' (you)' : ''}</div>`).join('')}</div><p>★ ${U.starsN} bonus stars · 🪙 +${coins}</p><div class="row"><button data-m="done">Done (Esc)</button><button class="go" data-m="again">Noch eine Runde! (Enter)</button></div>`); });
        again = choice === 'again';
      }
    }
    // close
    removeEventListener('keydown', onKey, true);
    U.el.classList.add('hidden'); U.open = false; U.waiter = null; U.movable = null; closeModal();
    Input.typing = false; busy = false;
    const res = { finished, winner: g.winner, stars: U.starsN, coins, again, turns: g.rolls, pieces: g.n };
    UIB.last = res;
    return res;
  }
  // Kalle drifts off: tell him it's his turn
  async function dream() {
    const U = UIB; U.dreamed = true; U.dreamHit = false;
    say(3, 'dream');
    want({ kind: 'phrase', ids: ['ph.dran'], stars: 2, text: 'Kalle is daydreaming. Tell him it’s his turn!', onHit: () => { U.dreamHit = true; } });
    for (let k = 0; k < 55 && !U.dreamHit && !U.quit; k++) await STORY.wait(0.1);
    say(U.dreamHit ? 3 : 2, U.dreamHit ? 'dreamok' : 'dreamlate');
    if (U.want && U.want.ids && U.want.ids[0] === 'ph.dran') U.want = null; prompt();
    await w(0.7);
  }

  // ================================================================ the five chapters (2026-11-13)
  // Gated like every side character (Rosa's welcome, the big Hushling, bells 1, 2, 3). Done-ness comes from the state the
  // quest always kept, and a chapter you've started stays open whatever its gate says, so old saves carry on where they were.
  const CHS = [
    { n: 1, title: 'Post für Alba', sub: 'meet Adi; deliver his five letters', gate: f => !!f.rosa, wait: 'after Rosa’s welcome' },
    { n: 2, title: 'Feierabend', sub: 'Kaffee und Kuchen, then «Mensch ärgere dich nicht»', gate: f => !!f.boss, wait: 'after the big Hushling on the hill' },
    { n: 3, title: 'Die kleine Runde', sub: 'your own round: three letters', gate: f => (f.bells || 0) >= 1, wait: 'after the first bell' },
    { n: 4, title: 'Ein Paket für den Nachbarn', sub: 'a parcel day with Adi', gate: f => (f.bells || 0) >= 2, wait: 'after the second bell' },
    { n: 5, title: 'Liebe Grüße aus Alba', sub: 'when the letters stop', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell' },
  ];
  function chDone(n) { if (!G) return false; const st = S(); return n === 1 ? !!st.job && lettersDone(st) : n === 2 ? !!st.party && (st.games || 0) > 0 : n === 3 ? (st.roundsDone || 0) > 0 : n === 4 ? !!st.c4 : n === 5 ? !!st.c5 : false; }
  function chStarted(n) { if (!G) return false; const st = S(); return n === 1 ? !!st.met : n === 2 ? !!st.party || (st.games || 0) > 0 : n === 3 ? !!st.round || (st.rounds || 0) > 0 : n === 4 ? !!st.c4s : n === 5 ? !!st.c5s : false; }
  function chOpen(n) { return !!G && (chDone(n) || chStarted(n) || (CHS[n - 1].gate(G.state.flags || {}) && (n === 1 || chDone(n - 1)))); }
  function nextReady() { if (!G) return false; const st = S(); if (!((st.games || 0) > 0) || st.round) return false; const nx = CHS.find(c => !chDone(c.n)); return !!nx && nx.n >= 3 && chOpen(nx.n); }
  const chSub = n => (n === 3 ? 'your own round: three letters, «mit» + dative' : n === 4 ? (S().c4s ? 'back to the parcels' : 'a parcel day with Adi') : (S().c5s ? 'back to the postcards' : 'when the letters stop'));
  function chRun(n) { if (n === 3) return speak(ADI, 'adi.round.first').then(() => startRound()); return n === 4 ? chapter4() : chapter5(); }

  // ---------------------------------------------------------------- helpers for the new chapters
  const hasWUI = () => typeof WUI !== 'undefined' && WUI.hud;
  // (where a pattern first matches in the raw text, lower case: canon() drops digits, and house numbers and postcodes are digits)
  const at = (t, re) => { const m = String(t || '').toLowerCase().match(re); return m ? m.index : -1; };
  // (fades: instant in fast test mode, where the tab's timers crawl)
  const fadeTo = to => { if (hasWUI() && WUI.fast) { const el = document.getElementById('fade'); if (el) { el.style.transition = 'none'; el.style.opacity = to; } return Promise.resolve(); } return UI.fade(to, 250); };
  const addCoins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; Sound.play('chest'); UI.toast(`${why}: 🪙 +${n}`); };
  // (WUI's panels wear the Christmas market's lights; for Adi's chapters they get a post-yellow strip instead)
  function postLook(on) {
    if (on && !document.getElementById('ad-post-css')) {
      const s = document.createElement('style'); s.id = 'ad-post-css';
      s.textContent = 'body.ad-post #wmov .lights, body.ad-post #wmhud .lights { background: repeating-linear-gradient(90deg, #f2c14e 0 30px, #ffd96a 30px 34px) !important; filter: none !important; box-shadow: inset 0 -4px 0 #34508c; }';
      document.head.appendChild(s);
    }
    document.body.classList.toggle('ad-post', !!on);
  }
  // one typed line on the call bar: → 'S'…'D' or 'quit' (the grade is kept for the chapter's card)
  let grades = null;
  const phKeys = id => [PH[id].de].concat(PH[id].alt || []);
  const phOk = id => t => { const h = WUI.has(t, phKeys(id)); return { ok: h.ok, minor: h.typo }; };
  async function hudSay(o) {
    if (!hasWUI()) return 'S';
    if (!WUI.hud.isOpen) WUI.hud.open(o.head || 'Adis Post');
    const g = await WUI.hud.call({ icon: o.icon, title: o.title, sub: o.sub || '', model: o.model, modelEn: o.modelEn, check: o.check, help: o.help, placeholder: o.placeholder });
    if (g === 'quit') return g;
    if (grades) grades.push(g);
    if (o.id && PH[o.id]) { const taught = LEX.taught(o.id); LEX.expose(o.id); LEX.attempt(o.id, { ok: g === 'S' || g === 'A', hints: g === 'S' ? 0 : 1, ms: 3000, mode: taught ? 'review' : 'echo' }); park(o.id, g !== 'D'); }
    if (!WUI.fast) await wait(0.4);
    return g;
  }
  const phSay = (id, o) => hudSay(Object.assign({ model: PH[id].de, modelEn: PH[id].en, check: phOk(id), id }, o));
  const hudClose = () => { if (hasWUI() && WUI.hud.isOpen) WUI.hud.close(); };
  const gradeLine = list => { const c = {}; (list || []).forEach(g => { c[g] = (c[g] || 0) + 1; }); return ['S', 'A', 'B', 'C', 'D'].filter(g => c[g]).map(g => `${g}×${c[g]}`).join(' · ') || '—'; };
  // a WUI lesson of expressions; afterwards they count in LEX like the ones taught at the table
  async function wuiLesson(ids, o) {
    if (!hasWUI()) return true;
    const r = await WUI.lesson(Object.assign({ items: ids.map(id => ({ id, de: PH[id].de, en: PH[id].en, note: PH[id].note, sit: PH[id].sit, keys: phKeys(id) })) }, o));
    if (!r || r.quit) return false;
    ids.forEach(id => { LEX.expose(id); if (!LEX.taught(id)) LEX.attempt(id, { ok: true, hints: 0, ms: 3000, mode: 'echo' }); park(id, !!(r.clean && r.clean[id])); });
    G.save();
    return true;
  }
  function placeYou(p, face) { const Y = G.sim.you; Y.x = p.x; Y.z = p.z; Y.yaw = Math.atan2(face.x - p.x, face.z - p.z); Y.vx = Y.vz = 0; G.sim.snap(); }
  const cam = (pos, posY, look, lookY) => { G.cam.override = { pos: V(pos.x, gyF(pos.x, pos.z) + posY, pos.z), look: V(look.x, gyF(look.x, look.z) + lookY, look.z) }; };
  // the two houses on the lane, either side of the garden's narrow way: Hilde's (west) and Kalle's (east)
  function laneDoor(side) {
    const B = typeof TOWN !== 'undefined' && TOWN.layout ? TOWN.layout.buildings.filter(b => b.doorAt && b.kind === 'house' && Math.hypot(b.x - ARCH.x, b.z - ARCH.z) < 9) : [];
    const b = B.filter(q => (side === 'east' ? q.x > ARCH.x : q.x < ARCH.x)).sort((a, c) => Math.hypot(a.x - ARCH.x, a.z - ARCH.z) - Math.hypot(c.x - ARCH.x, c.z - ARCH.z))[0];
    const door = b ? b.doorAt : side === 'east' ? { x: -23.57, z: -174.33 } : { x: -30.19, z: -172.55 }, ctr = b || (side === 'east' ? { x: -25.5, z: -177.6 } : { x: -32.8, z: -175.2 });
    const dx = door.x - ctr.x, dz = door.z - ctr.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
    return { door: { x: door.x, z: door.z }, front: { x: door.x + ux * 1.6, z: door.z + uz * 1.6 }, cam: { x: door.x + ux * 5.2 - uz * 1.8, z: door.z + uz * 5.2 + ux * 1.8 }, side: { x: door.x + ux * 1.5 - uz * 1.1, z: door.z + uz * 1.5 + ux * 1.1 } };
  }
  // Adi steps out of his chair to stand somewhere for a scene (or back home)
  function adiAt(p, face) { AS.mode = 'scene'; AS.sit = false; AS.x = p.x; AS.z = p.z; AS.y = gyF(p.x, p.z); AS.yaw = Math.atan2(face.x - p.x, face.z - p.z); }
  function endScene() {
    hudClose(); postLook(false); KS.away = false; MUS.scene = 0; MUS.hush = 0;
    if (AS.mode === 'scene') adiHome();
    if (G) { G.cam.override = null; }
    hold(false); lock(false); grades = null;
  }
  // (a canvas for the cards: a parcel label, the note for Kalle's door, a postcard; the lines filled in so far)
  function paperArt(kind, lines, o = {}) {
    return el => {
      const W = 420, H = kind === 'card' ? 250 : 200, cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.style.width = '420px'; cv.style.maxWidth = '100%';
      const c = cv.getContext('2d');
      c.fillStyle = kind === 'note' ? '#f2c14e' : '#fffaf0'; c.strokeStyle = INK; c.lineWidth = 3; rr(c, 4, 4, W - 8, H - 8, 10); c.fill(); c.stroke();
      c.fillStyle = INK; c.textBaseline = 'middle';
      if (kind === 'label') {
        c.font = '800 15px Bahnschrift, sans-serif'; c.fillText('Empfänger (to):', 22, 30);
        c.fillStyle = '#e0503f'; c.fillRect(W - 92, 18, 64, 44); c.fillStyle = INK; c.font = '700 11px Bahnschrift, sans-serif'; c.fillText('PAKET', W - 80, 40);
      } else if (kind === 'note') {
        c.font = '900 20px Bahnschrift, sans-serif'; c.fillText('Leider nicht angetroffen …', 22, 30);
        c.font = '700 13px Bahnschrift, sans-serif'; c.fillText('(Sorry, you weren’t home…)', 22, 54);
      } else {
        c.beginPath(); c.moveTo(W * 0.58, 24); c.lineTo(W * 0.58, H - 24); c.lineWidth = 1.6; c.stroke();
        c.fillStyle = '#7fb3d9'; c.fillRect(W - 78, 18, 54, 62); c.strokeRect(W - 78, 18, 54, 62); c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(W - 51, 49, 14, 0, TAU); c.fill();
        c.fillStyle = INK; c.lineWidth = 1.2; [126, 160, 194].forEach(y => { c.beginPath(); c.moveTo(W * 0.62, y + 12); c.lineTo(W - 22, y + 12); c.stroke(); });
        c.font = '700 13px Bahnschrift, sans-serif'; c.fillText('Liebe Grüße aus Alba', W * 0.62, 100);
      }
      const hand = '"Segoe Print", "Comic Sans MS", cursive';
      c.font = `600 ${kind === 'card' ? 18 : 22}px ${hand}`; c.fillStyle = '#1f3d7a';
      (lines || []).forEach((s, i) => { if (s) c.fillText(s, 26, (kind === 'note' ? 92 : kind === 'label' ? 74 : 48) + i * (kind === 'card' ? 32 : 36)); });
      (o.addr || []).forEach((s, i) => { if (s) { c.font = `600 15px ${hand}`; c.fillText(s, W * 0.62, 126 + i * 34); } });
      el.appendChild(cv);
    };
  }
  // «Liebe Hilde» / «Lieber Kalle» / «Lieber Herr Otto»: the greeting agrees with who it's for (never with the writer)
  const greetCheck = (g, name, show, herr) => t => {
    const n = canon(t), want = g === 'm' ? 'lieber' : 'liebe', wrong = g === 'm' ? 'liebe' : 'lieber', nm = canon(name), who = herr ? 'herr ' + nm : nm;
    const model = `${g === 'm' ? 'Lieber' : 'Liebe'} ${herr ? 'Herr ' : ''}${show},`;
    if (new RegExp(`\\b${want} ${who}\\b`).test(n)) return { ok: true };
    if (new RegExp(`\\b${wrong} ${who}\\b`).test(n)) return { ok: false, why: `${show} is ${g === 'm' ? 'a man: «Lieber …»' : 'a woman: «Liebe …»'}.` };
    if (herr && new RegExp(`\\b${want} ${nm}\\b`).test(n)) return { ok: true, minor: true, note: `with «Sie», add «Herr»: «${model}»` };
    if (!herr && new RegExp(`\\b${want} (herr|frau) ${nm}\\b`).test(n)) return { ok: true, minor: true, note: `you say «du»: just «${model}»` };
    if (/\bsehr geehrte/.test(n) && n.includes(nm)) return { ok: true, minor: true, note: `very formal; on a card «${model}» is warmer` };
    if (/\b(hallo|hi|moin|servus)\b/.test(n) && n.includes(nm)) return { ok: true, minor: true, note: `fine for a message; a card starts «${model}»` };
    return { ok: false, why: `Start with «${model}»` };
  };
  // «für + accusative»: für den Kuchen / die Post
  const furCheck = (noun, g, extra) => t => {
    const n = canon(t), art = { m: 'den', f: 'die', n: 'das' }[g], cn = canon(noun);
    if (!/\bdanke\b/.test(n)) return { ok: false, why: 'Start with «Danke …»' };
    if (new RegExp(`\\bfur ${art} ${cn}\\b`).test(n)) return { ok: true };
    if (new RegExp(`\\bfur (der|dem|den|die|das) ${cn}\\b`).test(n)) return { ok: true, grade: 'B', note: `after «für» comes the accusative: «für ${art} ${noun}»` };
    if (new RegExp(`\\b${cn}\\b`).test(n) || (extra && extra.test(n))) return { ok: true, minor: true, note: `in full: «Danke für ${art} ${noun}!»` };
    return { ok: false, why: `Say what for: «Danke für ${art} ${noun}!»` };
  };

  // ---------------------------------------------------------------- chapter 4: a parcel day
  async function stopOtto() {
    const p = recipient(LETTER.otto);
    await speak(ADI, 'c4.adi.otto');
    if (!p) { think('Herr Otto isn’t on his bench right now. Adi will try again later.', 4); return 'skip'; }
    await fadeTo(1);
    const ox = p.x, oz = p.z, a = 0.5, spot = { x: ox + Math.sin(a) * 1.7, z: oz + Math.cos(a) * 1.7 };
    placeYou(spot, { x: ox, z: oz }); adiAt({ x: ox + Math.sin(a + 0.9) * 2.1, z: oz + Math.cos(a + 0.9) * 2.1 }, { x: ox, z: oz });
    cam({ x: ox + Math.sin(a - 0.5) * 5.4, z: oz + Math.cos(a - 0.5) * 5.4 }, 2.4, { x: ox, z: oz }, 1.0);
    await fadeTo(0);
    const icon = 'adOtto';
    const g1 = await hudSay({ head: 'Ein Einschreiben', icon, title: 'A registered letter («ein Einschreiben») for Herr Otto. Tell him!', model: 'Ein Einschreiben für Herrn Otto!', modelEn: 'A registered letter for Mr Otto!',
      check: t => {
        const n = canon(t);
        if (!/\b(einschreiben|brief)\b/.test(n)) return { ok: false, why: 'Say what it is: «ein Einschreiben»' };
        if (/\bfur herr otto\b/.test(n)) return { ok: true, grade: 'B', note: '«Herr» becomes «Herrn» after «für»: «für Herrn Otto»' };
        if (/\bfur (herrn otto|sie)\b/.test(n)) return { ok: true };
        if (/\bfur dich\b/.test(n)) return { ok: true, grade: 'A', note: 'Herr Otto is «Sie»: «für Sie»' };
        return { ok: true, minor: true, note: 'and who it’s for: «für Herrn Otto»' };
      } });
    if (g1 === 'quit') return 'quit';
    await speak(p, 'c4.otto.hi');
    if ((await phSay('ph.ad.unterschreiben', { icon, title: 'He has to sign for it. Show him where, politely.', check: t => { const n = canon(t); if (!/\bunterschreib/.test(n)) return { ok: false, why: '«unterschreiben» = to sign' }; return /\bbitte\b/.test(n) ? { ok: true } : { ok: true, minor: true, note: 'add «bitte»: it’s polite' }; } })) === 'quit') return 'quit';
    Sound.play('page');
    await speak(p, 'c4.otto.sign');
    await speak(p, 'c4.otto.bye');
    if ((await phSay('ph.ad.gleichfalls', { icon, title: 'Herr Otto wishes you a nice day. Wish it right back, in two words!' })) === 'quit') return 'quit';
    hudClose();
    return 'ok';
  }
  async function stopKalleAway() {
    KS.away = true;
    await speak(ADI, 'c4.adi.kalle');
    await fadeTo(1);
    const K = laneDoor('east');
    placeYou(K.front, K.door); adiAt(K.side, K.door); cam(K.cam, 2.4, K.door, 1.2);
    await fadeTo(0);
    Sound.play('pip'); await wait(0.35); Sound.play('pip'); await wait(1.4);
    think('Ding-dong… nobody opens. Kalle isn’t home.', 3.5); await wait(1.2);
    await speak(ADI, 'c4.adi.nachbar'); await speak(ADI, 'c4.adi.typisch');
    // to Hilde, knitting in the garden as always
    await fadeTo(1);
    const hs = { x: HS.x + 0.95, z: HS.z + 1.45 };
    placeYou(hs, HS); adiHome(); cam({ x: HS.x + 2.6, z: HS.z + 4.4 }, 2.3, HS, 0.9);
    await fadeTo(0);
    const g = await phSay('ph.ad.annehmen', { head: 'Paket für den Nachbarn', icon: 'adHilde', title: 'Hilde is home (of course). Ask her, politely («Sie»), to take Kalle’s parcel.', model: 'Können Sie das Paket für Kalle annehmen?',
      check: t => { const h = WUI.has(t, [['paket', 'annehmen'], ['paket', 'nehmen', 'an']]); if (!h.ok) return { ok: false, why: '«das Paket annehmen» = to take in the parcel' }; return /\bkannst du\b|\bnimmst du\b/.test(canon(t)) ? { ok: true, grade: 'A', note: 'with Hilde, «Sie» is politer (for now!)' } : { ok: true, minor: h.typo }; } });
    if (g === 'quit') return 'quit';
    await speak(HILDE, 'c4.hilde.yes');
    hudClose();
    await speak(ADI, 'c4.adi.zettel');
    // the yellow note for Kalle's door
    const note = ['', ''];
    const r = !hasWUI() ? { done: true, grades: [] } : await WUI.steps([
      { kind: 'Der Zettel (the note)', big: 'Leider nicht angetroffen', note: 'Kalle is a friend: «dein» (your). And «bei» = at someone’s place.', sit: 'Write where his parcel is: «Dein Paket ist bei Hilde.»',
        art: paperArt('note', note), model: 'Dein Paket ist bei Hilde.', modelEn: 'Your parcel is at Hilde’s.',
        check: t => { const n = canon(t); if (/\bzu hilde\b/.test(n)) return { ok: false, why: '«bei» = at someone’s place: «bei Hilde»' }; if (!/\bbei hilde\b/.test(n)) return { ok: false, why: 'Where is it? «bei Hilde»' }; return /\bihr paket\b/.test(n) ? { ok: true, minor: true, note: 'Kalle is «du»: «dein Paket»' } : { ok: true }; },
        onOk: (c, t) => { note[0] = t; } },
      { kind: 'Die Adresse (the address)', note: 'In German the house number comes AFTER the street: «Schulgasse 3».', sit: 'And Hilde’s address: number 3, «Schulgasse».', art: paperArt('note', note), model: 'Schulgasse 3', modelEn: '3 Schulgasse',
        check: t => { const si = at(t, /schulgass/), ni = at(t, /\b(3|drei)\b/); if (si < 0) return { ok: false, why: 'The street: «Schulgasse»' }; if (ni < 0) return { ok: false, why: 'Hilde’s number is 3: «Schulgasse 3»' }; return ni < si ? { ok: false, why: 'The number comes after the street: «Schulgasse 3»' } : { ok: true }; },
        onOk: (c, t) => { note[1] = t; } },
    ], { title: 'Ein Zettel für Kalle', sub: 'the note on the door', face: 'adAdi', name: 'Adi', intro: ['Schreib einen Zettel für Kalles Tür.', 'Write a note for Kalle’s door.'] });
    if (!r || r.quit) return 'quit';
    (r.grades || []).forEach(x => grades && grades.push(x));
    return 'ok';
  }
  async function stopLabel() {
    await fadeTo(1); placeYou({ x: HS.x + 0.95, z: HS.z + 1.45 }, HS); cam({ x: HS.x + 2.6, z: HS.z + 4.4 }, 2.3, HS, 0.9); await fadeTo(0);
    await speak(HILDE, 'c4.hilde.send'); await speak(ADI, 'c4.adi.addr');
    const L = ['', '', ''];
    const order = (t, a, b, whyAB) => { const ia = at(t, a), ib = at(t, b); return ia < 0 || ib < 0 ? null : ia < ib ? { ok: true } : { ok: false, why: whyAB }; };
    const r = !hasWUI() ? { done: true, grades: [] } : await WUI.steps([
      { kind: 'Line 1 · Name', sit: 'Hilde’s sister: «Erika Sommer».', art: paperArt('label', L), model: 'Erika Sommer', modelEn: 'Erika Sommer',
        check: t => (WUI.has(t, ['erika sommer']).ok ? { ok: true } : WUI.has(t, ['sommer erika']).ok ? { ok: true, minor: true, note: 'first name first: «Erika Sommer»' } : { ok: false, why: 'Her name: «Erika Sommer»' }), onOk: (c, t) => { L[0] = t; } },
      { kind: 'Line 2 · Straße + Hausnummer', note: 'The number comes after the street.', sit: 'She lives at number 8, «Lindenstraße».', art: paperArt('label', L), model: 'Lindenstraße 8', modelEn: '8 Lindenstraße',
        check: t => { const o = order(t, /lindenstra/, /\b(8|acht)\b/, 'The number comes after the street: «Lindenstraße 8»'); return o || { ok: false, why: 'Street and number: «Lindenstraße 8»' }; }, onOk: (c, t) => { L[1] = t; } },
      { kind: 'Line 3 · PLZ + Ort', note: 'The «Postleitzahl» (postcode, five digits) comes before the town.', sit: 'The postcode is 28195, the town Bremen.', art: paperArt('label', L), model: '28195 Bremen', modelEn: '28195 Bremen',
        check: t => { const o = order(t, /\b28195\b/, /bremen/, 'In Germany the postcode comes first: «28195 Bremen»'); return o || { ok: false, why: 'Postcode and town: «28195 Bremen»' }; }, onOk: (c, t) => { L[2] = t; } },
    ], { title: 'Ein Paket nach Bremen', sub: 'the address label', face: 'adHilde', name: 'Hilde', intro: ['Name, Straße, Ort. Ganz einfach!', 'Name, street, town. Easy!'] });
    if (!r || r.quit) return 'quit';
    (r.grades || []).forEach(x => grades && grades.push(x));
    Sound.play('page');
    return 'ok';
  }
  async function stopKalleBack() {
    KS.away = false;
    await fadeTo(1);
    const ks = { x: KS.x - 0.95, z: KS.z + 1.45 };
    placeYou(ks, KS); cam({ x: KS.x - 2.6, z: KS.z + 4.4 }, 2.3, KS, 0.9);
    await fadeTo(0);
    await speak(KALLE, 'c4.kalle.mumble'); await speak(ADI, 'c4.adi.zahnarzt');
    const icon = 'adKalle';
    if ((await phSay('ph.ad.wiebitte', { head: 'Kalle ist zurück', icon, title: 'Kalle mumbles (his mouth is numb). Ask him, politely, to say it again!' })) === 'quit') return 'quit';
    await speak(KALLE, 'c4.kalle.clear');
    if ((await hudSay({ icon, title: 'Tell him where his parcel is.', model: 'Dein Paket ist bei Hilde.', modelEn: 'Your parcel is at Hilde’s.',
      check: t => { const n = canon(t); return /\bbei hilde\b/.test(n) ? { ok: true } : /\bhilde\b/.test(n) ? { ok: true, minor: true, note: 'at someone’s place: «bei Hilde»' } : { ok: false, why: 'Where is it? «bei Hilde»' }; } })) === 'quit') return 'quit';
    await speak(KALLE, 'c4.kalle.achso');
    if ((await phSay('ph.ad.machich', { icon, title: 'Kalle asks you to let Hilde know he’s coming. Sure, will do!' })) === 'quit') return 'quit';
    await speak(KALLE, 'c4.kalle.danke');
    hudClose();
    return 'ok';
  }
  async function chapter4() {
    const st = S(); st.c4s = true; G.save();
    grades = st.g4 = st.g4 || [];
    lock(true); hold(true); postLook(true);
    try {
      adiHome(); placeYou(PLAY_SPOT, TABLE); tableShot();
      await speak(ADI, 'c4.adi.pakete');
      if (!st.c4les) {
        await speak(ADI, 'c4.adi.lesson');
        if (!(await wuiLesson(['ph.ad.paket', 'ph.ad.annehmen', 'ph.ad.unterschreiben', 'ph.ad.wiebitte', 'ph.ad.machich', 'ph.ad.gleichfalls'], { title: 'Ein Paket für …', sub: 'a parcel day', face: 'adAdi', name: 'Adi',
          intro: ['Pakete! Hör gut zu und sag es nach.', 'Parcels! Listen well and say it back.'], outro: ['Super! Jetzt los!', 'Great! Let’s go!'] }))) return;
        st.c4les = true; G.save();
      }
      if (!st.c4otto) { const r = await stopOtto(); if (r === 'quit') return; st.c4otto = true; G.save(); }
      if (!st.c4kalle) { if ((await stopKalleAway()) === 'quit') return; st.c4kalle = true; G.save(); }
      if (!st.c4label) { if ((await stopLabel()) === 'quit') return; st.c4label = true; G.save(); }
      if ((await stopKalleBack()) === 'quit') return;
      await fadeTo(1); adiHome(); placeYou(PLAY_SPOT, TABLE); tableShot(); await fadeTo(0);
      AS.cheer = 1.2;
      await speak(ADI, 'c4.adi.done'); addCoins(12, 'Adi pays you for the parcel day');
      st.c4 = true; G.save();
      UI.toast(`Chapter 4 done! Your lines: ${gradeLine(st.g4)}`);
      await speak(ADI, 'c4.adi.worry');
    } finally { endScene(); }
  }

  // ---------------------------------------------------------------- chapter 5: the letters stop
  const CARDS = {
    kalle: { who: 'Kalle', face: 'adKalle', addr: ['Kalle', 'Schulgasse 5'], steps: [
      { kind: 'The greeting', note: 'A card starts «Liebe …» for a woman, «Lieber …» for a man (it agrees with who it’s for).', sit: 'Kalle is a man and a friend. Start the card.', model: 'Lieber Kalle,', modelEn: 'Dear Kalle,', check: greetCheck('m', 'kalle', 'Kalle') },
      { kind: 'The message', note: 'Friends get «du», so: «dir».', sit: 'Ask him how he’s doing.', model: 'Wie geht es dir?', modelEn: 'How are you?', id: 'ph.ad.wiegehtsdir',
        check: t => (WUI.has(t, ['wie geht es dir', 'wie gehts dir']).ok ? { ok: true } : /\bihnen\b/.test(canon(t)) ? { ok: false, why: 'Kalle is a friend: «dir»' } : { ok: false, why: '«Wie geht es dir?»' }) },
      { kind: 'The ending', note: 'Warm, for friends: «Liebe Grüße!». Your name goes under it.', sit: 'End the card, warmly.', model: 'Liebe Grüße!', modelEn: 'Love,', id: 'ph.ad.liebegruesse',
        check: t => { const n = canon(t); if (/\bmit freundlichen grussen\b/.test(n)) return { ok: true, minor: true, note: 'that’s for official letters; for Kalle: «Liebe Grüße!»' }; return /\b(liebe|viele|herzliche) grusse\b|\blg\b/.test(n) ? { ok: true } : { ok: false, why: '«Liebe Grüße!»' }; } },
    ] },
    otto: { who: 'Herr Otto', face: 'adOtto', addr: ['Herrn Otto', 'Am Marktplatz 1'], steps: [
      { kind: 'The address', note: 'On an envelope or card: «Herrn» (it’s really «an Herrn Otto»).', sit: 'Write his name on the address side.', model: 'Herrn Otto', modelEn: 'Mr Otto',
        check: t => { const n = canon(t); return /\bherrn otto\b/.test(n) ? { ok: true } : /\bherr otto\b/.test(n) ? { ok: false, why: 'On an address: «Herrn Otto»' } : { ok: false, why: '«Herrn Otto»' }; }, addr: true },
      { kind: 'The greeting', note: 'You say «Sie» to him, but a card can still be warm: «Lieber Herr Otto».', sit: 'Start the card.', model: 'Lieber Herr Otto,', modelEn: 'Dear Mr Otto,', check: greetCheck('m', 'otto', 'Otto', true) },
      { kind: 'The message', note: '«Sie» → «Ihnen», with a capital I.', sit: 'Ask him, politely, how he’s doing.', model: 'Wie geht es Ihnen?', modelEn: 'How are you?', id: 'ph.ad.wiegehtsihnen',
        check: t => (WUI.has(t, ['wie geht es ihnen', 'wie gehts ihnen']).ok ? { ok: true } : /\bdir\b/.test(canon(t)) ? { ok: false, why: 'Herr Otto is «Sie»: «Ihnen»' } : { ok: false, why: '«Wie geht es Ihnen?»' }) },
      { kind: 'The ending', note: 'Friendly and safe with «Sie»: «Viele Grüße!».', sit: 'End the card.', model: 'Viele Grüße!', modelEn: 'Best regards,', id: 'ph.ad.vielegruesse',
        check: t => { const n = canon(t); if (/\bliebe grusse\b/.test(n)) return { ok: true, minor: true, note: 'a bit close for «Sie»; «Viele Grüße!» is safe' }; return /\b(viele|herzliche|freundliche) grusse\b|\bmit freundlichen grussen\b/.test(n) ? { ok: true } : { ok: false, why: '«Viele Grüße!»' }; } },
    ] },
    hilde: { who: 'Hilde', face: 'adHilde', addr: ['Hilde', 'Schulgasse 3'], steps: [
      { kind: 'The greeting', note: 'Hilde is a woman: «Liebe». And she said «du»: just her name.', sit: 'Start the card to Hilde.', model: 'Liebe Hilde,', modelEn: 'Dear Hilde,', check: greetCheck('f', 'hilde', 'Hilde') },
      { kind: 'The message', note: '«für» + accusative: der Kuchen → «für den Kuchen».', sit: 'Thank her for the cake (from your first Feierabend).', model: 'Danke für den Kuchen!', modelEn: 'Thanks for the cake!', check: furCheck('Kuchen', 'm') },
      { kind: 'The ending', note: 'You’ll see her soon anyway!', sit: 'End with “see you soon”.', model: 'Bis bald!', modelEn: 'See you soon!', id: 'ph.ad.bisbald',
        check: t => (WUI.has(t, ['bis bald', 'bis dann', 'bis spater']).ok ? { ok: true } : /\bgrusse\b/.test(canon(t)) ? { ok: true, minor: true, note: 'nice! The task was «Bis bald!»' } : { ok: false, why: '«Bis bald!»' }) },
    ] },
  };
  async function writeCard(key) {
    const C = CARDS[key], lines = [], addr = [];
    const steps = C.steps.map(s => Object.assign({}, s, { art: el => paperArt('card', lines, { addr: addr.length ? addr : C.addr.map(() => '') })(el), onOk: (c, t) => { if (s.addr) addr.push(t, C.addr[1]); else lines.push(t); } }));
    if (!hasWUI()) return 'ok';
    const r = await WUI.steps(steps, { title: `Eine Postkarte für ${C.who}`, sub: 'Liebe Grüße aus Alba', face: 'adHilde', name: 'Hilde', intro: ['Schön schreiben! Und denk an «du» und «Sie».', 'Write nicely! And mind «du» and «Sie».'] });
    if (!r || r.quit) return 'quit';
    (r.grades || []).forEach(x => grades && grades.push(x));
    C.steps.forEach(s => { if (s.id) { LEX.expose(s.id); if (!LEX.taught(s.id)) LEX.attempt(s.id, { ok: true, hints: 0, ms: 3000, mode: 'echo' }); park(s.id, true); } });
    return 'ok';
  }
  async function chapter5() {
    const st = S(); st.c5s = true; G.save();
    grades = st.g5 = st.g5 || [];
    lock(true); hold(true); postLook(true);
    try {
      adiHome(); placeYou(PLAY_SPOT, TABLE); tableShot();
      MUS.hush = 0.55;
      if (!st.c5intro) {
        await speak(ADI, 'c5.adi.leer'); await speak(HILDE, 'c5.hilde.frueher'); await speak(KALLE, 'c5.kalle.stille'); await speak(ADI, 'c5.adi.sad');
        await speak(HILDE, 'c5.hilde.idea'); await speak(HILDE, 'c5.hilde.du');
        if ((await hudSay({ head: 'Du oder Sie?', icon: 'adHilde', title: 'Hilde offers «du» (the German moment: «Wir duzen uns»). Say yes, and call her by her name!', model: 'Gerne, Hilde!', modelEn: 'Gladly, Hilde!',
          check: t => { const n = canon(t); if (/\bfrau hilde\b/.test(n)) return { ok: true, minor: true, note: 'she said «du»: just «Hilde»' }; return /\bhilde\b/.test(n) ? { ok: true } : /\b(gern|gerne|ja|klar)\b/.test(n) ? { ok: true, minor: true, note: 'and her name: «Gerne, Hilde!»' } : { ok: false, why: '«Gerne, Hilde!»' }; } })) === 'quit') return;
        hudClose();
        await speak(HILDE, 'c5.hilde.du2');
        st.duHilde = true; st.c5intro = true; G.save();
      }
      if (!st.c5les) {
        if (!(await wuiLesson(['ph.ad.liebegruesse', 'ph.ad.wiegehtsdir', 'ph.ad.wiegehtsihnen', 'ph.ad.vielegruesse', 'ph.ad.bisbald', 'ph.ad.schreibmal'], { title: 'Liebe Grüße', sub: 'how to write a card', face: 'adHilde', name: 'Hilde',
          intro: ['Eine Karte hat drei Teile: Anrede, ein paar Sätze, Gruß.', 'A card has three parts: the greeting, a few lines, the ending.'], outro: ['Wunderbar! Jetzt schreiben wir.', 'Wonderful! Now let’s write.'] }))) return;
        st.c5les = true; G.save();
      }
      await speak(HILDE, 'c5.hilde.cards');
      st.c5cards = st.c5cards || {};
      for (const k of ['kalle', 'otto', 'hilde']) { if (st.c5cards[k]) continue; if ((await writeCard(k)) === 'quit') return; st.c5cards[k] = true; G.save(); }
      // into Adi's yellow mailbox… and the town writes back
      await fadeTo(1);
      const mb = { x: MAILBOX.x - 0.9, z: MAILBOX.z - 1.0 };      // (the garden side of the arch; the camera by the east gate)
      placeYou(mb, MAILBOX); adiAt({ x: MAILBOX.x + 0.9, z: MAILBOX.z - 1.3 }, MAILBOX); cam({ x: MAILBOX.x + 4.6, z: MAILBOX.z - 4.4 }, 2.4, MAILBOX, 0.8);
      await fadeTo(0);
      await speak(ADI, 'c5.adi.post');
      for (let i = 0; i < 3; i++) { Sound.play('page'); await wait(0.35); }
      G.w3d.fx.sparkle(MAILBOX.x, gyF(MAILBOX.x, MAILBOX.z) + 1.0, MAILBOX.z, 10, ['#f2c14e', '#fffaf0', '#7fb3d9']); MUS.hush = 0.4;
      await fadeTo(1); placeYou(PLAY_SPOT, TABLE); adiAt({ x: TABLE.x + 0.4, z: TABLE.z - 1.9 }, { x: PLAY_SPOT.x, z: PLAY_SPOT.z }); tableShot(); await fadeTo(0);
      await speak(KALLE, 'c5.kalle.reads'); MUS.hush = 0.3; MUS.scene = 0.15;
      await speak(ADI, 'c5.adi.otto'); MUS.hush = 0.2; MUS.scene = 0.28;
      AS.cheer = 1.4; await speak(ADI, 'c5.adi.letters');
      G.w3d.fx.sparkle(TABLE.x, gyF(TABLE.x, TABLE.z) + 1.4, TABLE.z, 22, ['#f2c14e', '#fffaf0', '#7fb3d9', '#e0503f']);
      await speak(HILDE, 'c5.hilde.forAdi'); await speak(ADI, 'c5.adi.forme');
      // and your card for the postman who never gets any
      const g1 = await hudSay({ head: 'Eine Karte für Adi', icon: 'adAdi', title: 'Your own card, for Adi (a man, a friend). Start it!', model: 'Lieber Adi,', modelEn: 'Dear Adi,', check: greetCheck('m', 'adi', 'Adi') });
      if (g1 === 'quit') return;
      if ((await hudSay({ icon: 'adAdi', title: 'Thank him for the mail («die Post»).', model: 'Danke für die Post!', modelEn: 'Thanks for the mail!', check: furCheck('Post', 'f', /\bbriefe\b/) })) === 'quit') return;
      if ((await phSay('ph.ad.schreibmal', { icon: 'adAdi', title: 'And the classic ending, for someone who never gets letters: write again sometime!' })) === 'quit') return;
      hudClose();
      MUS.hush = 0; MUS.scene = 0.45; AS.cheer = 2; HS.cheer = 1.6; KS.cheer = 1.6; Sound.play('learned');
      G.w3d.fx.sparkle(AS.x, AS.y + 1.4, AS.z, 26, ['#f2c14e', '#fffaf0', '#e0503f']); G.sim.mimo.happy = 2.5;
      st.c5 = true; G.save();                         // (from here on Adi wears Hilde's yellow scarf)
      await speak(ADI, 'c5.adi.thanks');
      await speak(ADI, 'c5.adi.card');
      G.state.bag = G.state.bag || {}; G.state.bag['k.adiKarte'] = 1; Sound.play('chest');
      await UI.card(`<div class="tag">Key item</div><canvas width="140" height="140"></canvas><div class="big">Adis Postkarte</div><div class="sub">«Liebe Grüße aus Alba! Danke für alles. Schreib mal wieder! Dein Adi» · Adi’s postcard to you. E</div>`, { icon: 'adCard' });
      addCoins(15, 'Adi, Hilde and Kalle');
      UI.toast(`Chapter 5 done! Your lines: ${gradeLine(st.g5)}`);
      await wait(hasWUI() && WUI.fast ? 0 : 3);
    } finally { endScene(); }
  }

  // ---------------------------------------------------------------- the music: «Eilpost» (ad_eilpost)
  // Liquid drum & bass for a postman in a hurry, 172 bpm in D minor: a two-step breakbeat with ghost snares, a round sub bass,
  // Rhodes chords (Dm9 G13 Cmaj9 Am9 B♭maj9 Gm9 A7sus A7♭9), an FM-bell hook in the second part, and a bike bell at the end
  // of each phrase. Then the post office: the drums drop to half time under a typewriter (ticks, and its bell at the end
  // of the line) and the rubber stamp's thump, before the break rolls back in. It plays when the town starts writing again
  // (chapter 5's end), and near Adi's garden table after that, quietly.
  const MUS = { scene: 0, hush: 0, lvl: 0 };
  function musicTick(t, off) {
    if (typeof ZHF === 'undefined' || !ZHF.music) return;
    let lvl = 0;
    if (!off && G && isDe()) {
      if (MUS.scene) lvl = MUS.scene;
      else if (S().c5 && !busy && !AS.hold) { const Y = G.sim.you; lvl = 0.26 * (1 - smoothstep(5, 16, Math.hypot(Y.x - TABLE.x, Y.z - TABLE.z))); }
    }
    ZHF.music.want('ad', lvl > 0.001 ? 'ad_eilpost' : null, lvl, { duck: lvl > 0.01 ? Math.max(0.1, 1 - lvl * 2.4) : 1 });
    ZHF.music.frame(t);
    if (G && G.fx && (MUS.hush || MUS.hushOn)) { MUS.hushNow = damp(MUS.hushNow || 0, MUS.hush, 1.6, 1 / 60); G.fx.hush = Math.max(G.fx.hush || 0, MUS.hushNow); MUS.hushOn = MUS.hushNow > 0.01; if (!MUS.hushOn) G.fx.hush = 0; }
  }
  (function addSong() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const K = Sound.kit;
    const ROOT = [38, 43, 36, 33, 34, 31, 33, 33];
    const CH = [[53, 57, 60, 64], [53, 59, 64], [52, 55, 59, 62], [55, 59, 60, 64], [50, 53, 57, 60], [53, 58, 62, 69], [55, 62, 64], [55, 61, 64, 70]];
    const HOOK = K.mel('A5/4 C6/2 D6/2 E6/4 D6/4 | C6/2 B5/2 A5/4 G5/8 | E5/2 G5/2 B5/4 A5/2 G5/2 E5/4 | A5/6 r/2 C6/4 B5/4 | D6/4 C6/2 A5/2 F5/4 A5/4 | G5/2 A5/2 Bb5/4 D6/4 C6/4 | E6/6 D6/2 E6/4 r/4 | C#6/4 E6/4 G6/4 Bb6/4');
    Sound.addSong('ad_eilpost', { bpm: 172, len: 384, swing: 0.04, vol: 0.34, verb: 0.14, echo: 0.12, echoSteps: 3, play(i, t, s16) {
      const sec = i < 128 ? 'A' : i < 256 ? 'B' : 'C', bar = (i >> 4) & 7, s = i & 15, R = ROOT[bar], nR = ROOT[(bar + 1) & 7], C = CH[bar];
      if (i % 128 === 0) K.crash(t, 0.55);
      if (sec !== 'C') {
        if (s === 0 || s === 10) K.kick(t, s ? 0.75 : 1);
        if (s === 4 || s === 12) K.snare(t, 0.85);
        if (s === 7 || s === 14 || (s === 15 && bar % 2)) K.snare(t, 0.22);
        if (!(s & 1)) K.hat(t, s % 4 === 2 ? 0.55 : 0.3); else if (sec === 'B') K.hat(t, 0.16);
      } else {
        if (s === 0) K.kick(t, 0.8); if (s === 8) K.snare(t, 0.6);
        if (bar < 6) { K.tick(t, s % 4 !== 0, s % 4 === 0 ? 0.9 : 0.5); if (s === 12 && bar % 2 === 1) K.handbell(91, t, 0.6); if (s === 4 || s === 12) K.thud(t, 0.5); }
        else { if (s % 2 === 0 || bar === 7) K.snare(t, 0.15 + (bar - 6) * 0.25 + s * 0.02); }
      }
      if (s === 0) K.sub808(R, t, s16 * 7, 0.9); else if (s === 8) K.sub808(R + (bar % 2 ? 7 : 12), t, s16 * 5, 0.6); else if (s === 14 && sec !== 'C') K.sub808(nR + (nR > R ? -1 : 1), t, s16 * 1.8, 0.55);
      if (s === 0) for (const m of C) K.epiano(m, t, s16 * 6, 0.55, 0.9); else if (s === 10 && sec !== 'C') for (const m of C) K.epiano(m, t, s16 * 3.5, 0.32, 0.8);
      if (sec === 'B') { const n = HOOK[i - 128]; if (n) K.fmlead(n[0], t, n[1] * s16 * 0.95, 0.8, 2.2); }
      if (sec === 'A' && (s === 6 || s === 14) && bar % 2 === 1) K.epiano(C[C.length - 1] + 12, t, s16 * 1.5, 0.25, 1.4);
      if (sec !== 'C' && bar === 7 && (s === 12 || s === 13)) K.handbell(88, t, 0.55);
    } });
  })();

  // ================================================================ things to press E on
  const lookTable = async () => think('{w.coffee} cups, a {w.cake} under a cloth… and a board game: «Mensch ärgere dich nicht».', 5);
  async function readMailbox() { LEX.expose('w.mailbox'); think('A yellow {w.mailbox}. The name plate says «ADI», with a little painted flower where the rest of the name used to be.', 6); }
  async function playFromTable() {
    if (AS.mode !== 'home') { adiHome(); G.w3d.fx.puff(AS.x, AS.y + 0.2, AS.z, 8, 0.3); }
    return playAtTable();
  }
  function interactables() {
    if (!G || !isDe() || !G.state.flags.hatched || busy || !shown) return [];
    const st = S(), Y = G.sim.you, list = [];
    const near = (x, z, r) => Math.abs(x - Y.x) < r && Math.abs(z - Y.z) < r;
    if (near(AS.x, AS.z, 6)) list.push({ x: AS.x, z: AS.z, y: AS.y, r: 2.6, label: 'Talk', run: talkAdi });
    if (near(GARDEN.x, GARDEN.z, 14)) {
      list.push({ x: HS.x, z: HS.z, y: HS.y, r: 1.9, label: 'Talk', run: () => talkNeighbour('hilde') });
      list.push({ x: KS.x, z: KS.z, y: KS.y, r: 1.9, label: 'Talk', run: () => talkNeighbour('kalle') });
      list.push({ x: TABLE.x, z: TABLE.z + 1.75, r: 1.5, label: st.party ? 'Play' : 'Look', run: st.party ? playFromTable : lookTable });
      GNOMES.forEach(g => list.push({ x: g.x, z: g.z, r: 1.25, label: 'Look', run: async () => think(GNOME_LOOK[g.id], 4.5) }));
      list.push({ x: MAILBOX.x, z: MAILBOX.z + 0.5, r: 1.4, label: 'Read', run: readMailbox });
    }
    // the plate over the garden's arch (signs.js: the words big, a 🔊, the English)
    if (near(ARCH.x, ARCH.z, 4) && typeof SIGNS !== 'undefined' && SIGNS.read) list.push({ x: ARCH.x, z: ARCH.z, r: 1.6, label: 'Read', run: () => SIGNS.read({ tag: 'The sign on the garden’s arch',
      lines: [{ text: 'Adis Garten', en: 'Adi’s garden', look: { edge: INK } }, { text: 'Willkommen', en: 'welcome', look: { edge: INK, ink: '#c2412f' } }] }) });
    const letters = activeLetters();
    if (letters.length) {
      for (const L of letters) {
        const p = recipient(L); if (!p) continue;
        if (L.door) { if (near(p.front.x, p.front.z, 4)) list.push({ x: p.front.x, z: p.front.z, r: 1.7, label: 'Knock', run: () => deliver(L) }); continue; }
        if (near(p.x, p.z, 4)) list.push({ x: p.x, z: p.z, y: p.y, r: 2.5, label: 'Deliver', run: () => deliver(L) });
      }
      const baecker = letters.some(L => L.id === 'baecker') && !st.gotcha;
      if (baecker) { const m = G.sim.npc('baker'); if (m && near(m.x, m.z, 4)) list.push({ x: m.x, z: m.z, r: 2.5, label: 'Deliver', run: martaGotcha }); }
      if (letters.some(L => !isKnown(L))) {
        const rec = new Set(letters.map(L => L.town).filter(Boolean)), recNpc = new Set(letters.map(L => L.npc).filter(Boolean));
        if (G.town && G.town.people) G.town.people.forEach(p => { if (!p.hushed && !rec.has(p.id) && near(p.x, p.z, 4)) list.push({ x: p.x, z: p.z, y: p.y, r: 2.3, label: 'Ask', run: () => askVillager(p) }); });
        [['kid', 'Nico'], ['rosa', 'Oma Rosa'], ['baker', 'Marta']].forEach(([id, nm]) => {
          if (recNpc.has(id) || (id === 'baker' && baecker)) return;
          const n = G.sim.npc(id); if (n && near(n.x, n.z, 4)) list.push({ x: n.x, z: n.z, r: 2.4, label: 'Ask', run: () => askVillager(n, nm) });
        });
      }
    }
    return list;
  }

  // ================================================================ the quests (quests.js LIST entries)
  // where the compass points while you deliver: the nearest person you know the way to, else someone to ask
  function letterTarget(list) {
    if (!G || !list.length) return null;
    const Y = G.sim.you, d = p => Math.hypot(p.x - Y.x, p.z - Y.z);
    const known = list.filter(isKnown).map(L => { const p = recipient(L); return p ? (L.door ? { x: p.front.x, z: p.front.z } : { x: p.x, z: p.z }) : null; }).filter(Boolean);
    if (known.length) return known.sort((a, b) => d(a) - d(b))[0];
    const folk = ((G.town && G.town.people) || []).filter(p => !p.hushed && !list.some(L => L.town === p.id)).map(p => ({ x: p.x, z: p.z }));
    return folk.sort((a, b) => d(a) - d(b))[0] || null;
  }
  const lettersHint = list => (list.some(isKnown) ? '{mimo} points the way. Someone on your list is over there!' : '{mimo} shrugs. Ask someone nearby: «Wo wohnt …?»');
  function quest() {
    const st = s => s.adolf || {}, de = s => s.lang === 'de', del = s => st(s).del || {};
    const others = s => QUEST_LETTERS.slice(1).filter(L => del(s)[L.id]).length;
    const left = () => (G ? activeLetters().filter(L => QUEST_LETTERS.includes(L)) : []);
    // (a step's text says when its chapter opens, until it's open)
    const gated = (n, o) => Object.defineProperty(o, 'text', { get() { return G && chOpen(n) ? o.raw.replace(/ \(after [^)]*\)$/, '') : o.raw; }, enumerable: true });
    return {
      id: 'adolf', kind: 'side', title: 'Post for Alba', giver: 'Adi, Alba’s postman',
      started: s => de(s) && !!st(s).job,
      steps: [
        { text: 'Deliver the first {w.letter}: «An Frau Rosa»', word: 'w.letter',
          why: 'Adi the postman gave you five {w.letter:pl}. The first is for Rosa, at her fruit stall. Hand it over with a sentence: «Ein Brief für Sie!» (Sie is the polite “you”).',
          done: s => !!del(s).rosa, target: () => { const n = G.sim.npc('rosa'); return n ? { x: n.x, z: n.z } : null; }, hint: '{mimo} points at the fruit stall. Rosa is there!' },
        { text: 'Deliver Adi’s other {w.letter:pl} ({n}/4)', n: others, word: 'w.letter',
          get why() { return 'Read each address and find who it’s for. Don’t know where someone lives? Ask anyone: «Wo wohnt …?» Still to go: ' + left().filter(L => L.id !== 'rosa').map(L => `«${L.addr}»${isKnown(L) ? ' (you know where)' : ''}`).join(', ') + '. And remember: after «für», der becomes den.'; },
          done: s => others(s) >= 4, target: () => letterTarget(left()), get hint() { return lettersHint(left()); } },
        gated(2, { raw: 'Feierabend! Find Adi in his {w.garden} (after the big Hushling on the hill)',
          why: 'All five {w.letter:pl} are delivered. Adi said: after work it’s «Feierabend» in his {w.garden}, behind the houses on the little lane, next to the school.',
          done: s => !!st(s).party, target: () => ({ x: TABLE.x, z: TABLE.z + 1.8 }), hint: '{mimo} sniffs the air… {w.coffee} and {w.cake}! The {w.garden} is behind the houses.' }),
        { text: 'Play «Mensch ärgere dich nicht» with Adi, Hilde and Kalle',
          why: 'A German classic: roll a six to come out, race round the board, knock the others back home… and don’t get upset! That’s what the name means.',
          done: s => (st(s).games || 0) >= 1, target: () => ({ x: TABLE.x, z: TABLE.z + 1.8 }), hint: '{mimo} hops onto a garden chair. Game time!' },
        // (2026-11-13) the new chapters
        gated(3, { raw: 'Your own round: three letters for Adi (after the first bell)',
          why: 'Adi’s little rounds: «Für die Frau mit der Gießkanne», «Für den Mann mit dem Bart»… After «mit» comes the dative: mit dem, mit der, mit den.',
          done: s => (st(s).roundsDone || 0) >= 1, target: () => ({ x: AS.x, z: AS.z }), hint: '{mimo} points at Adi’s satchel. More {w.letter:pl}!' }),
        gated(4, { raw: 'A parcel day with Adi (after the second bell)',
          why: 'Registered mail for Herr Otto, a parcel for Kalle (who isn’t home: ask the neighbor!), a note for his door, and an address label for Hilde’s parcel to Bremen.',
          done: s => !!st(s).c4, target: () => ({ x: AS.x, z: AS.z }), hint: '{mimo} tries to lift a parcel. Too heavy!' }),
        gated(5, { raw: 'Liebe Grüße aus Alba: the letters have stopped (after the third bell)',
          why: 'The Hush has the town forgetting how to write. Write postcards with Hilde: «Lieber Kalle», «Lieber Herr Otto», «Liebe Hilde»… and get everyone writing again.',
          done: s => !!st(s).c5, target: () => ({ x: TABLE.x, z: TABLE.z + 1.8 }), hint: '{mimo} peeks into Adi’s empty {w.mailbox}.' }),
      ],
      story: [
        { when: s => !!st(s).job, text: 'In Alba you met Adi, the postman. Yes, his name is Adolf: a great-uncle’s name his grandma insisted on. Everybody just calls him Adi. He taught you «Na?» and gave you five {w.letter:pl} to deliver.' },
        { when: s => others(s) >= 4, text: 'You read the addresses, asked people «Wo wohnt …?», and handed every {w.letter} over: «für den Bäcker», «an die Familie im blauen Haus». After «für», der becomes den.' },
        { when: s => !!st(s).party, text: '«Feierabend!» {w.coffee} and {w.cake} in Adi’s {w.garden}, with his neighbours Hilde and Kalle. «Guten Appetit!» «Lecker!»' },
        { when: s => (st(s).games || 0) >= 1, text: 'Then a game of «Mensch ärgere dich nicht». Hilde says she always wins. Adi gave {mimo} his old postman’s {w.cap}.' },
        { when: s => !!st(s).c4, text: 'A parcel day: an «Einschreiben» for Herr Otto («Hier unterschreiben, bitte»), Kalle’s parcel left with his neighbor Hilde (a yellow note on his door: «Dein Paket ist bei Hilde»), and an address label for Bremen: street, then number; postcode, then town.' },
        { when: s => !!st(s).c5, text: 'Then the letters stopped. You and Hilde (now «du») wrote postcards: «Lieber Kalle, wie geht es dir?», «Lieber Herr Otto, wie geht es Ihnen?», «Liebe Hilde, danke für den Kuchen!». Alba started writing again, and Adi got the first letter he’d had in years: from Hilde, with the yellow scarf she’d been knitting.' },
      ],
    };
  }
  function roundQuest() {
    const R = s => (s.adolf && s.adolf.round) || null, left = () => (G ? activeLetters().filter(L => POOL.includes(L)) : []);
    return {
      id: 'adolf.round', kind: 'side', title: 'Adi’s mail round', giver: 'Adi, Alba’s postman',
      started: s => s.lang === 'de' && !!R(s),
      steps: [
        { text: 'Deliver Adi’s {w.letter:pl} ({n}/3)', n: s => { const r = R(s); return r ? r.ids.filter(id => r.done[id]).length : 0; },
          get why() { return 'Still to go: ' + left().map(L => `«${L.addr}»${isKnown(L) ? ' (you know where)' : ''}`).join(', ') + '. Ask «Wo wohnt …?» if you don’t know.'; },
          done: s => { const r = R(s); return !!r && r.ids.every(id => r.done[id]); }, target: () => letterTarget(left()), get hint() { return lettersHint(left()); } },
        { text: 'Back to Adi for your pay', done: s => !R(s), target: () => ({ x: AS.x, z: AS.z }), hint: '{mimo} points at Adi. Pay day!' },
      ],
    };
  }

  // ================================================================ the module
  return {
    init(game) {
      G = game;
      if (typeof QUESTS !== 'undefined' && QUESTS.LIST) {
        if (!QUESTS.LIST.some(q => q.id === 'adolf')) QUESTS.LIST.push(quest());
        if (!QUESTS.LIST.some(q => q.id === 'adolf.round')) QUESTS.LIST.push(roundQuest());
      }
      makeCap();
    },
    build, update, interactables, capOn, quest, roundQuest,
    get busy() { return busy; },
    landmarks: LANDMARKS, people: [ADI, HILDE, KALLE],
    // tests and tools
    _: {
      MADN, PHRASES, PH, LT, BG, QUEST_LETTERS, POOL, LETTER, ROUTE: () => ROUTE, solids: () => solids, garden: () => garden, figures: () => ({ FA, FH, FK }),
      gradeHandover, parseAsk, phraseMatch, canon, lineOf, modelOf, S: () => S(), AS, HS, KS, ADI, HILDE, KALLE, GARDEN, TABLE, SEATS, PLAY_SPOT, ARCH, EAST_GATE, MAILBOX, GNOMES,
      activeLetters, isKnown, recipient, blueDoor, deliver, askVillager, martaGotcha, talkAdi, meetScene, jobScene, partyScene, gardenScene, playAtTable, boardGame, afterGame,
      practice, startRound, finishRound, adiMenu, talkNeighbour, usePhrase, duePhrases, wantHome, adiHome, setShown, lettersDone: () => lettersDone(S()),
      // the chapters (2026-11-13)
      CHS, chDone, chStarted, chOpen, chRun, nextReady, chapter4, chapter5, writeCard, stopOtto, stopKalleAway, stopLabel, stopKalleBack, greetCheck, furCheck, laneDoor, MUS, CARDS, get scarf() { return scarf; },
      ui: () => UIB, pb: () => PB, talkSubmit, act, drawBoard, boardDefaults, get shown() { return shown; },
    },
  };
})();
