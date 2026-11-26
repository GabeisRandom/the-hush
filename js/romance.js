'use strict';
// Morgana and Dante (DESIGN.md 14.9, the user's pick "D, C"): a small dating side story, the same two people in every
// language, with their lines written natively in each. Confessing feelings in a language you're learning is the scariest
// output there is, so saying it anyway, even imperfectly, is the opposite of the Hush. "Love languages" works both ways:
// the five love languages are the kinds of dates, and you learn how love is said («te quiero» isn't «te amo»).
//
//   Dante (24), the bell-smith: a little forge on the west side of Alba's bell tower, an anvil and the town's cracked bell on a
//   stand. Warm, loud, funny, competitive. He sings on purpose so the Hush can't come near; underneath, silence scares him.
//   He writes lyrics he's too shy to sing. Tired of being called "strong"; lights up at "kind" and "funny".
//   Morgana (21), the goth poet: hidden in the attic of the half-fallen house in the Old Quarter (cemetery.js 'ruin'), with
//   Poe, her black cat. Dry, guarded, secretly romantic. She loves silence, which is dangerous here: the Hush has started
//   graying the last lines of her poems.
//
// Finding them (both after Rosa): Dante is at his forge. Poe sits under the big tree in Alba's plaza by a pinned poem; read it
// and he trots ahead and waits by the next one (the north gate, the theater's forecourt, the broken house). At the ruin he
// slips between the boards and a rope ladder drops from the window upstairs: Morgana's attic, a room like the corn hall.
// Ranks (DESIGN.md 14.9's table): 1 meet · 2 (2 ♥) the ask-out · 3 (5 ♥ + the hill's big one) hold hands · 4 (8 ♥ + Ciro) their
// soft side and a favor · 5 (11 ♥ + the first bell) the confession: Morgana reads her poem on the theater's steps, Dante sings.
// Dates: Talk → Date: words of affirmation, quality time, a gift, acts of service, hand-holding (rank 3+); one per person every
// ~3 minutes of play; +1 ♥, +2 in their favorite (Morgana: words; Dante: acts of service); a miss is a funny reaction.
// Rivals: while you date one, the other is your rival: banter duels (3 rounds: pick the comeback that fits, then type it to
// land it; 2 of 3 wins earn respect). At 3 respect, "a crack in the armor": they admit something soft, and you can switch
// (after a short, kind breakup). Hearts and ranks are kept per person.
//
// One global, ROMANCE:
//   ROMANCE.build(scene, { terrainAt }) → { group, people, update(dt, t, you|null), colliders: [], stats() }
//   ROMANCE.init(game)        (words, phrases and icons register at load; init adds the two quests to QUESTS.LIST)
//   ROMANCE.interactables()   outside: Dante, the forge, the poems, Poe, the ladder, wildflowers; in the attic: its things
//   the attic, a room (main.js ROOMS, like the corn hall): .inside · .OUTSIDE · .update(dt, t) · .curiosities() · .target()
//                                                          · .enter() · .leave()
// Progress lives in state.romance. The people are live objects { id, name, x, z, y, top, r, story, hidden, talking }.
// The world's solids that depend on state (Morgana outdoors) live in WORLD.extra; the forge's are fixed (WORLD.addSolids).
// Never genders the player: no adjectives or participles about you in es/pt lines; both gendered forms are accepted when
// you type one. PG: holding hands, hugs, at most a kiss on the cheek.
//
// zh / ja (2026-11-11, game/CJK.md's notation): every line, poem, card and phrase has its own zh / ja, written natively
// (the block "zh / ja" below the telenovela's tables; the phrases, words, wall poems and the record name sit where theirs do).
// The show is «情深深静悄悄» (a nod to the big Chinese TV romances) and «静寂の恋»; chapters are 第N集 / 第N話, the
// endings 未完待续…… / つづく… and 剧终 / 終. How love is said: zh 你人不错 (friendly) · 我对你有好感 (I'm into you) ·
// 我喜欢你 (the confession) · 我爱你 (heavy); ja いい人だね (friendly: the classic friend-zone line) · 好きです ·
// 付き合ってください (the 告白) · 大好き · 愛してる (heard mostly in TV dramas). The zh / ja poems aren't translations:
// short five-character quatrains in zh, haiku and tanka in ja, each with its own English under it (en_zh / en_ja). The
// judges read zh / ja through CJK.canon / CJK.contains (pinyin or characters, rōmaji, kana or kanji); their grammar slip
// is zh «你是聪明» (an adjective takes 很, never 是) and ja «優しいだ» (an い-adjective never takes だ); a zh gift is
// checked for its measure word (一朵花), the way es / pt check the article. Morgana says わたし and あなた; Dante says 俺
// and 君 (僕 in his song); the player's own ja lines have no pronoun or gendered ending.

const ROMANCE = (() => {
  // ================================================================ small helpers
  const { M4 } = TK;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const HALF = Math.PI / 2;
  const GEO = {
    box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 12), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
    cyl6: new THREE.CylinderGeometry(1, 1, 1, 6), sph: new THREE.SphereGeometry(1, 14, 10), sphS: new THREE.SphereGeometry(1, 8, 6),
    cone: new THREE.ConeGeometry(1, 1, 10), cone4: new THREE.ConeGeometry(1, 1, 4), cone6: new THREE.ConeGeometry(1, 1, 6),
    torus: new THREE.TorusGeometry(1, 0.16, 6, 16), half: new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI / 2),
    disc: new THREE.CylinderGeometry(1, 1, 1, 18),
  };
  const lathe = (pts, n = 14) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  const lang = () => (typeof UI !== 'undefined' && UI.lang) || 'es';
  // zh / ja (CJK.md): isC() · PL(src) the notation as plain text in the mode (for menus, titles, toasts) · RO(src) its
  // pinyin / rōmaji (what you type: a box's placeholder) · HT(src) HTML with ruby (cards) · enC(s) an English text whose
  // «…» hold notation (Phrasebook notes) · saysC(text, src) does a typed text say this somewhere (CJK.contains)
  const isC = (l = lang()) => (l === 'zh' || l === 'ja') && typeof CJK !== 'undefined';
  const PL = (s, o) => (isC() && typeof s === 'string' ? CJK.plain(s, Object.assign({ lang: lang() }, o || {})) : s);
  const RO = s => (isC() && typeof s === 'string' ? CJK.roman(s, { lang: lang() }) : s);
  const HT = s => (isC() ? CJK.html(String(s == null ? '' : s), { lang: lang() }) : esc(s));
  const enC = s => (isC() && typeof s === 'string' ? s.replace(/«([^»]*)»/g, (m, x) => '«' + (/[぀-ヿ㐀-鿿[]/.test(x) ? CJK.plain(x, { lang: lang(), cap: false }) : x) + '»') : s);
  const saysC = (text, src, l = lang()) => !!src && !!String(text || '').trim() && CJK.contains(String(text), src, l);
  // typed answers, compared loosely: no case, accents or punctuation (German ä = ae, ö = oe, ü = ue, ß = ss); zh / ja:
  // CJK.canon (toneless pinyin or rōmaji, characters through the dictionary)
  const canon = (s, l = lang()) => { if (isC(l)) return CJK.canon(String(s || ''), l); let n = norm(String(s || '')); if (l === 'de') n = n.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u').replace(/ß/g, 'ss'); return n.replace(/\s+/g, ' ').trim(); };
  const similar = (a, b) => { if (isC()) return CJK.similar(String(a || ''), String(b || ''), lang()); const x = canon(a), y = canon(b); if (!x || !y) return 0; return 1 - lev(x, y) / Math.max(x.length, y.length); };
  const pick = a => a[Math.floor(Math.random() * a.length) % a.length];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const fillVars = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] !== undefined ? v[k] : m));
  const LANGNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German' };

  let G = null;                                   // the game (main.js)
  // (fills in what's missing, in place: scenes hold on to these objects across awaits)
  const fill = (o, d) => { for (const k in d) if (o[k] === undefined) o[k] = d[k]; return o; };
  const S = () => {
    const s = G.state, r = s.romance || (s.romance = {});
    if (r._ok === s) return r;
    r.p = r.p || {};
    for (const id of ['morgana', 'dante']) r.p[id] = fill(r.p[id] || {}, { met: false, rank: 0, hearts: 0, respect: 0, dateAt: -1e9, duelAt: -1e9, crack: 0, tried: {} });
    r.trail = fill(r.trail || {}, { seen: false, read: [false, false, false, false], ladder: false });
    fill(r, { partner: null, rival: null, switchTo: null, favor: null });
    Object.defineProperty(r, '_ok', { value: s, enumerable: false, writable: true, configurable: true });   // (checked once per state; not saved)
    return r;
  };
  const PS = id => S().p[id];
  const now = () => (G && G.state ? G.state.time || 0 : 0);
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  let myLock = false;
  const lock = on => { if (!G) return; G.sim.lock = on ? 1 : 0; myLock = !!on; };
  const other = id => (id === 'morgana' ? 'dante' : 'morgana');
  const NAME = { morgana: 'Morgana', dante: 'Dante' };
  const her = id => (id === 'morgana' ? 'her' : 'him'), his = id => (id === 'morgana' ? 'her' : 'his'), she = id => (id === 'morgana' ? 'she' : 'he');

  // ================================================================ places (plain data)
  const GY = 0.25;                                                  // Alba's flat ground (town.js)
  // the forge, on the west side of the bell tower (the tower: x −27.8…−24.2, z −167.8…−164.2; Bruno's yard is south of it)
  const FORGE = {
    dante: { x: -30.2, z: -167.05, yaw: 0 },                       // behind the anvil, facing south (toward the yard and you)
    anvil: { x: -30.2, z: -166.05 }, hearth: { x: -28.5, z: -166.3 }, bell: { x: -32.5, z: -166.5 }, barrel: { x: -29.0, z: -164.75 },
    coal: { x: -29.25, z: -167.75 }, talk: { x: -30.2, z: -165.0 }, center: { x: -30.4, z: -166.2 },
  };
  // the poem trail: where each poem hangs, where you read it, where Poe waits by it, and Poe's way on to the next one
  const RUIN_Y = 1.433, SQ_Y = 0.7;
  const POEMS = [
    // (on the big tree's north-west side: old Pedro, hushed, sits on its south-west side)
    { at: 'the plaza', paper: { x: -4.41, y: GY + 1.55, z: -152.29, yaw: -Math.PI * 0.75 }, read: { x: -5.45, z: -153.3, r: 2.0 },
      poe: { x: -5.1, z: -152.43, y: GY + 0.51, yaw: -2.0 } },
    { at: 'the north gate', paper: { x: -7.0, y: 1.1935 + 0.82, z: -192.68, yaw: 0 }, read: { x: -7.0, z: -191.45, r: 1.9 },
      poe: { x: -5.95, z: -192.25, yaw: 0.2 } },
    { at: 'the theater’s forecourt', paper: { x: -7.0, y: SQ_Y + 1.12, z: -223.55, yaw: 0 }, read: { x: -7.0, z: -222.3, r: 1.9 }, post: true,
      poe: { x: -6.1, z: -223.2, yaw: 0.3 } },
    { at: 'the broken house', paper: { x: -3.69, y: RUIN_Y + 1.5, z: -202.65, yaw: -HALF }, read: { x: -4.75, z: -202.65, r: 1.6 },
      poe: { x: -4.35, z: -201.25, yaw: -HALF } },
  ];
  const TRAIL_PATH = [
    [[-5.1, -152.43], [-6.3, -154.3], [-8.4, -158.5], [-8.6, -170], [-8.6, -182], [-8.3, -189], [-5.95, -192.25]],
    [[-5.95, -192.25], [-8.4, -195.5], [-9.0, -203], [-9.3, -212], [-8.8, -219], [-6.1, -223.2]],
    [[-6.1, -223.2], [-8.6, -219], [-9.3, -211], [-8.4, -204.5], [-5.6, -202.0], [-4.35, -201.25]],
  ];
  const RUIN = { window: { x: -3.6, y: RUIN_Y + 1.65, z: -201.6 }, upper: { x: -3.6, y: RUIN_Y + 4.0, z: -201.6 }, ladder: { x: -3.8, z: -201.6 },
    climb: { x: -4.6, z: -201.6, r: 1.5 } };
  const OUTSIDE = { x: -4.95, z: -201.6, yaw: -HALF };              // where you stand after climbing down (and a save in the attic)
  // the old theater's steps (cemetery.js HALL: its door at z −234.75, two steps in front of it)
  const STEPS = { morgana: { x: -13.5, z: -234.35, yaw: 0 }, you: { x: -13.5, z: -231.3, yaw: Math.PI }, poe: { x: -11.95, z: -233.4 } };
  // wildflowers to pick for a gift (by the forge, and by the broken house)
  const FLOWERS = [{ x: -33.5, z: -168.8, y: GY }, { x: -6.6, z: -199.0, y: null }];
  const ALBA = { x: -10, z: -150, r: 46 };

  // the attic: far off at y 300 like the other rooms (the houses at (−272, 300, 0), the corn hall at (−255, 300, 35), the
  // Great Mill at x 236); 10 × 8, a gable roof with its ridge running north–south, the round window in the north gable
  const ATTIC = { x: -240, y: 300, z: 56, hw: 5, hd: 4, eave: 1.35, ridge: 4.35 };
  const AY = ATTIC.y;
  const ap = (lx, lz) => ({ x: ATTIC.x + lx, z: ATTIC.z + lz });
  const ARRIVE = Object.assign(ap(-2.55, 2.45), { yaw: Math.PI });       // (a few steps from the window you climbed in by: out of "Climb down"'s reach)
  const EXIT = ap(-4.35, 2.7);
  const SEAT = { x: ATTIC.x + 0.35, z: ATTIC.z - 3.15, yaw: 0 };          // Morgana on the window seat, facing into the room
  const POE_SPOT = ap(1.75, -2.9);
  // things in the attic you can fetch for her (acts of service), and look at
  const FETCH = [
    { id: 'candle', word: 'w.candle', at: ap(-4.0, -0.55), y: 0.83 },
    { id: 'book', word: 'w.book', at: ap(4.35, 1.35), y: 0.86 },
    { id: 'cup', word: 'w.cup', at: ap(-1.55, -3.05), y: 0.5 },
    { id: 'blanket', word: 'w.blanket', at: ap(3.7, -0.5), y: 0.3 },
    { id: 'record', word: 'w.record', at: ap(-4.15, 0.95), y: 0.62 },
  ];
  const LANDMARKS = { forge: { ...FORGE.center }, dante: { ...FORGE.dante }, poems: POEMS.map(p => ({ x: p.read.x, z: p.read.z })), ruin: { ...RUIN.climb },
    steps: { ...STEPS.you }, attic: { x: ATTIC.x, z: ATTIC.z, y: AY } };

  // ================================================================ words and expressions (registered at load)
  const NEW_WORDS = [
    { id: 'w.poem', es: 'poema', pt: 'poema', de: 'Gedicht', en: 'poem', enPl: 'poems', g: { es: 'm', pt: 'm', de: 'n' }, pl: { es: 'poemas', pt: 'poemas', de: 'Gedichte' }, icon: 'poem' },
    { id: 'w.heart', es: 'corazón', pt: 'coração', de: 'Herz', en: 'heart', enPl: 'hearts', g: { es: 'm', pt: 'm', de: 'n' }, pl: { es: 'corazones', pt: 'corações', de: 'Herzen' }, icon: 'heart' },
    { id: 'w.hammer', es: 'martillo', pt: 'martelo', de: 'Hammer', en: 'hammer', enPl: 'hammers', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'martillos', pt: 'martelos', de: 'Hämmer' }, icon: 'hammer' },
    { id: 'w.blanket', es: 'manta', pt: 'cobertor', de: 'Decke', en: 'blanket', enPl: 'blankets', g: { es: 'f', pt: 'm', de: 'f' }, pl: { es: 'mantas', pt: 'cobertores', de: 'Decken' }, icon: 'blanket', alt: { es: ['cobija', 'frazada'], pt: ['manta', 'coberta'] } },
    { id: 'w.record', es: 'disco', pt: 'disco', de: 'Schallplatte', en: 'record', enPl: 'records', g: { es: 'm', pt: 'm', de: 'f' }, pl: { es: 'discos', pt: 'discos', de: 'Schallplatten' }, icon: 'record', alt: { es: ['vinilo'], pt: ['vinil'], de: ['Platte'] } },
  ];
  // The love phrases: kind 'phrase', so they show in the journal's Phrasebook once you've said them (LEX taught). Each is
  // taught where it happens: you type it in a scene. The note is per language (a getter: only one language is played per save).
  const PHRASES = [
    { id: 'ph.love.caesbien', es: 'Me caes bien.', pt: 'Vou com a sua cara.', de: 'Du bist mir sympathisch.', en: 'I like you (as a person)',
      notes: { es: '«Me caes bien»: you like someone as a person. Friendly, never romantic (literally "you fall well on me").',
        pt: '«Vou com a sua cara»: I like you, your vibe. Friendly and casual (literally "I go with your face").',
        de: '«Du bist mir sympathisch»: you like someone as a person. Friendly, not romantic.' },
      alt: { es: ['me caes muy bien', 'me caes super bien', 'tu me caes bien'], pt: ['vou muito com a sua cara', 'eu vou com a sua cara', 'vou com a tua cara', 'eu vou com a tua cara', 'vou com sua cara', 'fui com a sua cara', 'fui com sua cara', 'eu fui com a sua cara'], de: ['du bist mir sehr sympathisch', 'du bist mir echt sympathisch', 'du bist mir auch sympathisch'] } },
    { id: 'ph.love.gustas', es: 'Me gustas.', pt: 'Tô a fim de você.', de: 'Du gefällst mir.', en: 'I like you (I’m into you)',
      notes: { es: '«Me gustas»: I’m into you. Romantic. (For friends: «me caes bien».)',
        pt: '«Tô a fim de você»: I’m into you. Romantic and casual. (For friends: «vou com a sua cara».)',
        de: '«Du gefällst mir»: I like you, I’m into you. (For friends: «du bist mir sympathisch».)' },
      alt: { es: ['me gustas mucho', 'tu me gustas', 'tu me gustas mucho'], pt: ['estou a fim de voce', 'eu to a fim de voce', 'eu estou a fim de voce', 'to a fim de vc', 'to afim de voce'], de: ['du gefallst mir sehr', 'du gefallst mir echt', 'ich steh auf dich'] } },
    { id: 'ph.love.quiero', es: 'Te quiero.', pt: 'Gosto muito de você.', de: 'Ich hab dich lieb.', en: 'I love you (I care about you a lot)',
      notes: { es: '«Te quiero»: I love you, I care about you. For partners, family and close friends. Warm, not too heavy.',
        pt: '«Gosto muito de você»: I really care about you. Warm, not too heavy («te amo» is much bigger).',
        de: '«Ich hab dich lieb»: I love you, I care about you. For partners, family and close friends.' },
      alt: { es: ['yo te quiero', 'te quiero mucho', 'yo tambien te quiero'], pt: ['eu gosto muito de voce', 'gosto muito de vc', 'gosto de voce'], de: ['ich habe dich lieb', 'hab dich lieb', 'ich hab dich sehr lieb'] } },
    { id: 'ph.love.amo', es: 'Te amo.', pt: 'Te amo.', de: 'Ich liebe dich.', en: 'I love you (deep, big love)',
      notes: { es: '«Te amo»: deep, big love. Save it for when it’s true: too soon, and it’s a lot!',
        pt: '«Te amo»: deep, big love. Brazilians say it a bit more easily, but early on it’s still a lot!',
        de: '«Ich liebe dich»: deep, big love. Germans don’t say it lightly!' },
      alt: { es: ['yo te amo'], pt: ['eu te amo', 'amo voce'], de: [] } },
    { id: 'ph.love.salir', es: '¿Quieres salir conmigo?', pt: 'Quer sair comigo?', de: 'Willst du mit mir ausgehen?', en: 'Do you want to go out with me?',
      notes: { es: 'Asking someone out. «Salir con alguien» = to date someone.', pt: 'Asking someone out. «Sair com alguém» = to go out with someone.', de: 'Asking someone out on a date.' },
      alt: { es: ['te gustaria salir conmigo', 'quieres salir conmigo hoy'], pt: ['voce quer sair comigo', 'quer sair comigo hoje'], de: ['mochtest du mit mir ausgehen', 'willst du mit mir weggehen'] } },
    { id: 'ph.love.mano', es: '¿Te puedo tomar la mano?', pt: 'Posso segurar sua mão?', de: 'Darf ich deine Hand halten?', en: 'Can I hold your hand?',
      notes: { es: 'Always ask first! «¿Puedo…?» asks permission.', pt: 'Always ask first! «Posso…?» asks permission.', de: 'Always ask first! «Darf ich…?» asks permission.' },
      alt: { es: ['puedo tomarte la mano', 'puedo tomar tu mano', 'te puedo agarrar la mano', 'te puedo tomar de la mano', 'puedo tomarte de la mano'], pt: ['posso segurar a sua mao', 'posso pegar na sua mao'], de: ['darf ich deine hand nehmen', 'kann ich deine hand halten'] } },
    { id: 'ph.love.traje', es: 'Te traje algo.', pt: 'Eu trouxe uma coisa pra você.', de: 'Ich hab dir was mitgebracht.', en: 'I brought you something.',
      notes: { es: 'Then say what: «Te traje una flor».', pt: 'Then say what: «Eu trouxe uma flor pra você».', de: 'Then say what, in the accusative: «Ich hab dir einen Apfel mitgebracht» (der → einen).' },
      alt: { es: [], pt: [], de: [] } },
    { id: 'ph.love.aqui', es: 'Aquí tienes.', pt: 'Aqui está.', de: 'Bitte schön.', en: 'Here you go.',
      notes: { es: 'Handing something over. Among friends also: «Toma».', pt: 'Handing something over. Among friends also: «Toma!».', de: 'Handing something over (and the answer to «Danke»). Also: «Hier, bitte».' },
      alt: { es: ['aqui esta', 'toma', 'ten', 'aqui lo tienes', 'aqui la tienes'], pt: ['aqui', 'toma', 'aqui esta ela', 'aqui esta ele', 'ta aqui'], de: ['bitte sehr', 'hier bitte', 'bitteschon', 'hier', 'bitte', 'hier bitte schon'] } },
    { id: 'ph.love.siento', es: 'Lo siento.', pt: 'Me desculpa.', de: 'Es tut mir leid.', en: 'I’m sorry.',
      notes: { es: 'For real apologies and bad news, said kindly.', pt: 'For apologies. («Sinto muito» is for bad news.)', de: 'For real apologies and bad news.' },
      alt: { es: ['lo siento mucho'], pt: ['desculpa', 'sinto muito'], de: ['tut mir leid', 'es tut mir so leid'] } },
  ];
  // zh / ja (CJK.md's notation): the words, and the love phrases as they're really said. The ladder of love: zh 你人不错 →
  // 我对你有好感 → 我喜欢你 (how a confession sounds) → 我爱你 (heavy, rarely said); ja いい人だね → 好きです →
  // 大好き → 愛してる (mostly heard in TV dramas). Asking out: zh 你愿意跟我约会吗？, ja 付き合ってください (the 告白).
  const Z2 = (zh, ja) => ({ zh, ja });
  const WORDS_CJK = {
    'w.poem': Z2('[诗|shī]', '[詩|し]'),
    'w.heart': Object.assign(Z2('[心|xīn]', '[心|こころ]'), { alt: { ja: ['ハート'] } }),
    'w.hammer': Object.assign(Z2('[锤子|chuí zi]', 'ハンマー'), { alt: { zh: ['[铁锤|tiě chuí]'], ja: ['[金槌|かなづち]', 'かなづち'] } }),
    'w.blanket': Object.assign(Z2('[毯子|tǎn zi]', '[毛布|もうふ]'), { alt: { zh: ['[被子|bèi zi]'] } }),
    'w.record': Object.assign(Z2('[唱片|chàng piàn]', 'レコード'), { alt: { zh: ['[黑胶|hēi jiāo] [唱片|chàng piàn]'] } }),
    // (interiors.js registers these without zh / ja: filled in only while they're missing, for the attic's favors)
    'w.book': Z2('[书|shū]', '[本|ほん]'),
    'w.cup': Object.assign(Z2('[杯子|bēi zi]', 'カップ'), { alt: { ja: ['マグカップ'] } }),
    'w.window': Object.assign(Z2('[窗户|chuāng hu]', '[窓|まど]'), { alt: { zh: ['[窗|chuāng]'] } }),
  };
  NEW_WORDS.forEach(w => { const c = WORDS_CJK[w.id]; if (c) { w.zh = c.zh; w.ja = c.ja; if (c.alt) w.alt = Object.assign(w.alt || {}, c.alt); } });
  const PH_CJK = {
    'ph.love.caesbien': { zh: '[你|nǐ] [人|rén] [不错|bù cuò] 。', ja: 'いい [人|ひと] だ ね 。',
      notes: { zh: '«[你|nǐ] [人|rén] [不错|bù cuò]»: you’re a good person, I like you. Friendly, never romantic (literally “you, as a person, aren’t bad”).',
        ja: '«いい [人|ひと] だ ね»: you’re a nice person. Friendly, not romantic. (In Japan it’s even the classic friend-zone line!)' },
      alt: { zh: ['[你|nǐ] [人|rén] [很|hěn] [好|hǎo]', '[你|nǐ] [人|rén] [挺|tǐng] [好|hǎo] [的|de]', '[你|nǐ] [人|rén] [挺|tǐng] [不错|bù cuò] [的|de]', '[我|wǒ] [觉得|jué de] [你|nǐ] [人|rén] [不错|bù cuò]',
        '[你|nǐ] [人|rén] [真|zhēn] [不错|bù cuò]', '[你|nǐ] [人|rén] [很|hěn] [不错|bù cuò]', '[你|nǐ] [人|rén] [也|yě] [不错|bù cuò]', '[你|nǐ] [这个|zhè ge] [人|rén] [不错|bù cuò]'],
        ja: ['いい [人|ひと] だ', 'いい [人|ひと] です ね', 'いい [人|ひと] です', 'いい [人|ひと] だ よ', 'いい [人|ひと] だ ね', 'いい やつ だ ね', 'いい やつ だ な', '[気|き] が [合|あ]う ね'] } },
    'ph.love.gustas': { zh: '[我|wǒ] [对|duì] [你|nǐ] [有|yǒu] [好感|hǎo gǎn] 。', ja: '[好|す]き です 。',
      notes: { zh: '«[我|wǒ] [对|duì] [你|nǐ] [有|yǒu] [好感|hǎo gǎn]»: I’m into you, I have feelings for you. Romantic, but gentle. (For friends: «[你|nǐ] [人|rén] [不错|bù cuò]».)',
        ja: '«[好|す]き です»: I like you, I’m into you. The classic confession: です makes it sincere. (For friends: «いい [人|ひと] だ ね».)' },
      alt: { zh: ['[我|wǒ] [对|duì] [你|nǐ] [很|hěn] [有|yǒu] [好感|hǎo gǎn]', '[我|wǒ] [对|duì] [你|nǐ] [有|yǒu] [点|diǎn] [好感|hǎo gǎn]', '[其实|qí shí] [我|wǒ] [对|duì] [你|nǐ] [有|yǒu] [好感|hǎo gǎn]',
        '[我|wǒ] [有点|yǒu diǎn] [喜欢|xǐ huan] [你|nǐ]', '[我|wǒ] [喜欢|xǐ huan] [你|nǐ]', '[我|wǒ] [好像|hǎo xiàng] [喜欢|xǐ huan] [上|shàng] [你|nǐ] [了|le]'],
        ja: ['[好|す]き', '[好|す]き だ', '[好|す]き だ よ', '[好|す]き です よ', '[好|す]き な ん です', '[好|す]き な ん だ', 'あなた が [好|す]き です', 'あなた が [好|す]き', '[君|きみ] が [好|す]き',
          '[好|す]き に なりました', '[好|す]き に なった'] } },
    'ph.love.quiero': { zh: '[我|wǒ] [喜欢|xǐ huan] [你|nǐ] 。', ja: '[大好|だいす]き 。',
      notes: { zh: '«[我|wǒ] [喜欢|xǐ huan] [你|nǐ]»: I like you, I love you. This is how a confession sounds in Chinese: warm and real. («[我|wǒ] [爱|ài] [你|nǐ]» is much bigger.)',
        ja: '«[大好|だいす]き»: I love you so much. Warm and happy: couples say it, and so do families and friends. («[愛|あい]してる» is far heavier.)' },
      alt: { zh: ['[我|wǒ] [很|hěn] [喜欢|xǐ huan] [你|nǐ]', '[我|wǒ] [好|hǎo] [喜欢|xǐ huan] [你|nǐ]', '[我|wǒ] [真的|zhēn de] [喜欢|xǐ huan] [你|nǐ]', '[我|wǒ] [真的|zhēn de] [很|hěn] [喜欢|xǐ huan] [你|nǐ]',
        '[我|wǒ] [也|yě] [喜欢|xǐ huan] [你|nǐ]', '[我|wǒ] [超|chāo] [喜欢|xǐ huan] [你|nǐ]', '[我|wǒ] [非常|fēi cháng] [喜欢|xǐ huan] [你|nǐ]', '[喜欢|xǐ huan] [你|nǐ]'],
        ja: ['[大好|だいす]き です', '[大好|だいす]き だ よ', '[大好|だいす]き だ', '[大好|だいす]き よ', 'あなた が [大好|だいす]き', '[君|きみ] が [大好|だいす]き', '[本当|ほんとう] に [大好|だいす]き'] } },
    'ph.love.amo': { zh: '[我|wǒ] [爱|ài] [你|nǐ] 。', ja: '[愛|あい]してる 。',
      notes: { zh: '«[我|wǒ] [爱|ài] [你|nǐ]»: I love you, deeply. Heavy words: many couples rarely say them out loud, even after years. Too soon, and it’s a lot!',
        ja: '«[愛|あい]してる»: I love you, deeply. Rarely said out loud in Japan: many couples never say it. You hear it mostly in TV dramas and songs!' },
      alt: { zh: ['[我|wǒ] [好|hǎo] [爱|ài] [你|nǐ]', '[我|wǒ] [很|hěn] [爱|ài] [你|nǐ]', '[我|wǒ] [爱上|ài shàng] [你|nǐ] [了|le]', '[爱|ài] [你|nǐ]'],
        ja: ['[愛|あい]して います', '[愛|あい]してる よ', '[愛|あい]して いる', '[愛|あい]してます'] } },
    'ph.love.salir': { zh: '[你|nǐ] [愿意|yuàn yì] [跟|gēn] [我|wǒ] [约会|yuē huì] [吗|ma] ？', ja: '[付|つ]き[合|あ]って ください 。',
      notes: { zh: 'Asking someone out: «[约会|yuē huì]» = a date. («[我们|wǒ men] [在一起|zài yī qǐ] [吧|ba]», let’s be together, is the big step.)',
        ja: '«[付|つ]き[合|あ]って ください»: please go out with me. In Japan, dating usually starts with this «[告白|こくはく]» (confession): «[好|す]き です 。 [付|つ]き[合|あ]って ください 。»' },
      alt: { zh: ['[你|nǐ] [愿意|yuàn yì] [和|hé] [我|wǒ] [约会|yuē huì] [吗|ma]', '[你|nǐ] [想|xiǎng] [跟|gēn] [我|wǒ] [约会|yuē huì] [吗|ma]', '[要|yào] [不要|bù yào] [跟|gēn] [我|wǒ] [约会|yuē huì]',
        '[跟|gēn] [我|wǒ] [约会|yuē huì] [好|hǎo] [吗|ma]', '[我们|wǒ men] [约会|yuē huì] [吧|ba]', '[我们|wǒ men] [在一起|zài yī qǐ] [吧|ba]', '[和|hé] [我|wǒ] [交往|jiāo wǎng] [吧|ba]', '[你|nǐ] [愿意|yuàn yì] [和|hé] [我|wǒ] [交往|jiāo wǎng] [吗|ma]'],
        ja: ['[付|つ]き[合|あ]って', '[付|つ]き[合|あ]って くれる', '[付|つ]き[合|あ]って くれません か', '[付|つ]き[合|あ]って ほしい', '[付|つ]き[合|あ]おう', 'デート しよう', 'デート しません か'] } },
    'ph.love.mano': { zh: '[我|wǒ] [可以|kě yǐ] [牵|qiān] [你|nǐ] [的|de] [手|shǒu] [吗|ma] ？', ja: '[手|て] を つないで も いい ？',
      notes: { zh: 'Always ask first! «[可以|kě yǐ] … [吗|ma] ？» asks permission. «[牵手|qiān shǒu]» = holding hands.',
        ja: 'Always ask first! «〜 て も いい ？» asks permission. «[手|て] を つなぐ» = to hold hands.' },
      alt: { zh: ['[我|wǒ] [能|néng] [牵|qiān] [你|nǐ] [的|de] [手|shǒu] [吗|ma]', '[可以|kě yǐ] [牵|qiān] [你|nǐ] [的|de] [手|shǒu] [吗|ma]', '[我|wǒ] [可以|kě yǐ] [牵|qiān] [你|nǐ] [手|shǒu] [吗|ma]',
        '[能|néng] [牵|qiān] [你|nǐ] [的|de] [手|shǒu] [吗|ma]', '[我们|wǒ men] [可以|kě yǐ] [牵手|qiān shǒu] [吗|ma]', '[我们|wǒ men] [牵手|qiān shǒu] [好|hǎo] [吗|ma]', '[可以|kě yǐ] [牵手|qiān shǒu] [吗|ma]'],
        ja: ['[手|て] を つないで も いい です か', '[手|て] を つないで いい', '[手|て] 、 つないで も いい', '[手|て] つないで も いい', '[手|て] を つないで も いい'] } },
    'ph.love.traje': { zh: '[我|wǒ] [给|gěi] [你|nǐ] [带|dài] [了|le] [礼物|lǐ wù] 。', ja: 'プレゼント を [持|も]って きた よ 。',
      notes: { zh: 'Then say what, with its measure word: «[我|wǒ] [给|gěi] [你|nǐ] [带|dài] [了|le] [一|yī] [朵|duǒ] [花|huā]» (a flower takes «[朵|duǒ]»).',
        ja: 'Then say what: «[花|はな] を [持|も]って きた よ».' },
      alt: { zh: ['[我|wǒ] [给|gěi] [你|nǐ] [带|dài] [了|le] [个|gè] [礼物|lǐ wù]', '[我|wǒ] [给|gěi] [你|nǐ] [带|dài] [了|le] [东西|dōng xi]', '[我|wǒ] [给|gěi] [你|nǐ] [带|dài] [了|le] [点|diǎn] [东西|dōng xi]'],
        ja: ['プレゼント が ある よ', 'プレゼント を [持|も]って きました', 'プレゼント [持|も]って きた よ', 'おみやげ を [持|も]って きた よ'] } },
    'ph.love.aqui': { zh: '[给|gěi] [你|nǐ] 。', ja: 'どうぞ 。',
      notes: { zh: '«[给|gěi] [你|nǐ]»: here you go (literally “give you”). Handing something over.',
        ja: '«どうぞ»: here you go. Handing something over (it also means “please, go ahead”). «はい 、 どうぞ» is the friendly way.' },
      alt: { zh: ['[给|gěi] [你|nǐ] [吧|ba]', '[给|gěi]', '[拿|ná] [着|zhe]', '[这|zhè] [是|shì] [你|nǐ] [要|yào] [的|de]', '[给|gěi] [你|nǐ] [的|de]'],
        ja: ['はい 、 どうぞ', 'はい どうぞ', 'はい', 'どうぞ 、 これ', 'これ 、 どうぞ', 'はい 、 これ'] } },
    'ph.love.siento': { zh: '[对不起|duì bu qǐ] 。', ja: 'ごめん ね 。',
      notes: { zh: '«[对不起|duì bu qǐ]»: I’m sorry, for real apologies. («[不好意思|bù hǎo yì si]» is lighter: excuse me, sorry to bother you.)',
        ja: '«ごめん ね»: I’m sorry, to someone close. («ごめんなさい» is a bit more formal; «すみません» is for strangers.)' },
      alt: { zh: ['[真|zhēn] [对不起|duì bu qǐ]', '[对不起|duì bu qǐ] [啊|a]', '[抱歉|bào qiàn]', '[很|hěn] [抱歉|bào qiàn]', '[真的|zhēn de] [对不起|duì bu qǐ]'],
        ja: ['ごめん', 'ごめんなさい', '[本当|ほんとう] に ごめん', 'すみません'] } },
  };
  PHRASES.forEach(p => { const c = PH_CJK[p.id]; if (!c) return; p.zh = c.zh; p.ja = c.ja; Object.assign(p.notes, c.notes); p.alt = Object.assign(p.alt || {}, c.alt); });
  const PH = {};
  PHRASES.forEach(p => { PH[p.id] = p; });
  if (typeof LEX !== 'undefined') {
    LEX.register(NEW_WORDS.filter(w => !LEX.item(w.id)).map(w => Object.assign({ kind: 'word' }, w)));
    // (a word another file registered first, without zh / ja: only what's missing)
    for (const id of Object.keys(WORDS_CJK)) {
      const it = LEX.item(id), c = WORDS_CJK[id]; if (!it) continue;
      for (const l of ['zh', 'ja']) { if (!it[l]) it[l] = c[l]; if (c.alt && c.alt[l] && !(it.alt && it.alt[l])) it.alt = Object.assign({}, it.alt, { [l]: c.alt[l] }); }
    }
    LEX.register(PHRASES.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', es: p.es, pt: p.pt, de: p.de, zh: p.zh, ja: p.ja, en: p.en, get note() { return enC(p.notes[lang()] || ''); },
      region: 'Love & dating', register: 'casual', icon: 'heart', alt: p.alt })));
  }

  // ================================================================ icons (paper cutouts, like the rest)
  if (typeof ICONS !== 'undefined' && ICONS.add) {
    const has = k => ICONS.keys.includes(k);
    const heart = (x, y, s) => c => { c.moveTo(x, y + 12 * s); c.bezierCurveTo(x - 30 * s, y - 8 * s, x - 18 * s, y - 34 * s, x, y - 18 * s); c.bezierCurveTo(x + 18 * s, y - 34 * s, x + 30 * s, y - 8 * s, x, y + 12 * s); c.closePath(); };
    if (!has('heart')) ICONS.add('heart', (c, p, h) => { h.shape(c, p, heart(0, 14, 1.25), '#e0503f'); if (p) h.dot(c, -13, -14, 5, 'rgba(255,255,255,0.45)'); });
    if (!has('poem')) ICONS.add('poem', (c, p, h) => {
      h.shape(c, p, h.rr(-24, -32, 48, 64, 4), '#f6efe4');
      if (p) { [-16, -6, 4, 14].forEach((y, i) => { c.beginPath(); c.moveTo(-15, y); c.quadraticCurveTo(0, y - 4, 15 - i * 3, y); c.lineWidth = 2.2; c.strokeStyle = i === 3 ? 'rgba(43,34,53,0.25)' : '#5a2f55'; c.stroke(); }); }
      h.shape(c, p, h.poly([[10, -34], [26, -34], [26, -12], [18, -18], [10, -12]]), '#6e2f63', 1.8);
    });
    if (!has('hammer')) ICONS.add('hammer', (c, p, h) => { h.shape(c, p, h.rr(-4, -8, 8, 42, 3), '#a8673a'); h.shape(c, p, h.rr(-24, -30, 48, 20, 4), '#6b6f7a'); });
    if (!has('blanket')) ICONS.add('blanket', (c, p, h) => { h.shape(c, p, h.rr(-30, -18, 60, 40, 8), '#6e2f63'); if (p) [-14, 0, 14].forEach(x => { c.beginPath(); c.moveTo(x, -16); c.lineTo(x, 20); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.35)'; c.stroke(); }); });
    if (!has('record')) ICONS.add('record', (c, p, h) => { h.shape(c, p, h.ell(0, 0, 32, 32), '#2b2235'); h.shape(c, p, h.ell(0, 0, 11, 11), '#b23a6a', 1.6); if (p) h.dot(c, 0, 0, 2.5, '#fff'); });
    if (!has('duel')) ICONS.add('duel', (c, p, h) => {
      h.shape(c, p, h.rr(-36, -26, 30, 22, 8), '#7fd6c8'); h.shape(c, p, h.rr(6, 4, 30, 22, 8), '#f6b3a8');
      h.shape(c, p, h.poly([[2, -30], [-6, -2], [4, -2], [-4, 28], [12, -8], [2, -8], [10, -30]]), '#ffd84a', 1.8);
    });
    if (!has('gift')) ICONS.add('gift', (c, p, h) => { h.shape(c, p, h.rr(-26, -10, 52, 40, 4), '#6e9fd8'); h.shape(c, p, h.rr(-4, -10, 8, 40, 1), '#e0503f', 1.4); h.shape(c, p, h.ell(-10, -16, 10, 7, 0.4), '#e0503f'); h.shape(c, p, h.ell(10, -16, 10, 7, -0.4), '#e0503f'); });
    if (!has('handhold')) ICONS.add('handhold', (c, p, h) => { h.shape(c, p, h.ell(-10, 6, 18, 14, 0.4), '#f5cda2'); h.shape(c, p, h.ell(10, 2, 18, 14, -0.4), '#8a5636'); h.shape(c, p, heart(0, -14, 0.5), '#e0503f', 1.6); });
    if (!has('bellring')) ICONS.add('bellring', (c, p, h) => {
      h.shape(c, p, cc => { cc.moveTo(-22, 18); cc.bezierCurveTo(-20, -30, 20, -30, 22, 18); cc.closePath(); }, '#e6b84a'); h.shape(c, p, h.ell(0, 24, 6, 6), '#c99a3a');
      if (p) [[-30, -10, -38, -18], [30, -10, 38, -18], [-32, 6, -42, 6], [32, 6, 42, 6]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.lineWidth = 2.4; c.strokeStyle = h.INK; c.stroke(); });
    });
    if (!has('quill')) ICONS.add('quill', (c, p, h) => { h.shape(c, p, cc => { cc.moveTo(-24, 30); cc.quadraticCurveTo(-10, -10, 28, -32); cc.quadraticCurveTo(10, 0, -24, 30); cc.closePath(); }, '#f6efe4'); if (p) { c.beginPath(); c.moveTo(-24, 30); c.lineTo(20, -24); c.lineWidth = 1.6; c.strokeStyle = h.INK; c.stroke(); } });
  }

  // ================================================================ the look of the cards and chips (CSS, added once)
  let cssDone = false;
  function css() {
    if (cssDone) return; cssDone = true;
    const s = document.createElement('style'); s.id = 'romance-css';
    s.textContent = `
.card.rpoem { background: #f7f0f5; transform: translate(-50%, -50%) rotate(-1deg); border-color: #3a2340; max-width: min(470px, calc(100vw - 40px)); }
.card.rpoem .tag { color: #6e2f63; opacity: .85; }
.card.rpoem .pl { font: 21px "Segoe Print", "Ink Free", cursive; line-height: 1.25; margin-top: 6px; color: #2b2235; }
.card.rpoem .pe { font: italic 13px "Segoe UI", sans-serif; opacity: .7; margin-bottom: 2px; }
.card.rpoem:not(.rp-en) .pe { display: none; }
.card.rpoem .fade .pl { color: #9a95a3; }
.card.rpoem .fade .pe { opacity: .45; }
.card.rpoem .warn { font-size: 12px; color: #6e2f63; margin-top: 8px; font-style: italic; }
.card.rpoem .row { margin-top: 10px; }
.card.rpoem .sig { font: 15px "Segoe Print", "Ink Free", cursive; text-align: right; color: #6e2f63; margin-top: 4px; }
.card.rhearts .big { color: #d6453a; }
#tn-card { position: fixed; inset: 0; z-index: 12; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none; opacity: 0; transition: opacity .5s;
  background: radial-gradient(ellipse at center, rgba(92,10,32,.95) 0%, rgba(30,4,14,.97) 62%, rgba(8,2,6,.99) 100%); }
#tn-card.on { opacity: 1; }
#tn-card .rose { font: 46px "Segoe UI Symbol", serif; color: #e0506a; text-shadow: 0 0 14px rgba(255,80,110,.7); }
#tn-card .show { font: italic 700 clamp(34px, 7vw, 68px) Georgia, "Times New Roman", serif; color: #f7dca8; letter-spacing: 1px; text-shadow: 0 0 22px rgba(255,120,140,.55), 0 3px 0 #4a0a1c; }
#tn-card .sen { font: italic 14px "Segoe UI", sans-serif; color: rgba(255,255,255,.55); margin-top: 2px; }
#tn-card .ep { font: 600 15px Georgia, serif; color: #e7a3b4; letter-spacing: 6px; text-transform: uppercase; margin-top: 26px; }
#tn-card .ti { font: italic clamp(24px, 4vw, 38px) Georgia, serif; color: #fff; margin-top: 6px; }
#tn-card .en { font: italic 14px "Segoe UI", sans-serif; color: rgba(255,255,255,.6); margin-top: 4px; }
#tn-card .w, #tn-vig .w { color: inherit; border-bottom-color: currentColor; } #tn-card .gl, #tn-vig .gl { color: inherit; font-size: .45em; opacity: .7; }
#tn-vig { position: fixed; inset: 0; z-index: 10; pointer-events: none; opacity: 0; transition: opacity .3s; box-shadow: inset 0 0 220px 70px rgba(70,0,16,.88);
  display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; padding: 0 6vw 10vh 0; }
#tn-vig.on { opacity: 1; -webkit-backdrop-filter: sepia(.5) saturate(1.35) contrast(1.06); backdrop-filter: sepia(.5) saturate(1.35) contrast(1.06); }
#tn-vig.flash { opacity: 1; transition: opacity .12s; box-shadow: inset 0 0 160px 40px rgba(150,0,30,.7); }
#tn-vig .ct { font: italic 700 clamp(30px, 5vw, 54px) Georgia, serif; color: #f7dca8; text-shadow: 0 0 18px rgba(0,0,0,.85), 0 3px 0 #4a0a1c; }
#tn-vig .cen { font: italic 14px "Segoe UI", sans-serif; color: rgba(255,255,255,.8); text-shadow: 0 0 8px rgba(0,0,0,.9); }
#tn-vig.fin { align-items: center; justify-content: center; padding: 0; background: radial-gradient(ellipse at center, rgba(24,2,10,.6) 0%, rgba(24,2,10,.5) 40%, rgba(40,0,12,.78) 100%); }
#tn-vig.fin .ct { font-size: clamp(56px, 11vw, 116px); -webkit-text-stroke: 1.5px #5a0c22; text-shadow: 0 0 30px rgba(255,90,120,.65), 0 4px 0 #3a0614; }
#tn-vig.fin .cen { font-size: 16px; }
#tn-card .cjk-chars, #tn-vig .cjk-chars, .card.rpoem .pl .cjk-chars { font-style: normal; }
#tn-card .show .cjk-chars, #tn-card .ti .cjk-chars, #tn-vig .ct .cjk-chars { letter-spacing: 3px; }
#tn-card .cjk-zh.cjk-chars, #tn-vig .cjk-zh.cjk-chars, .card.rpoem .pl .cjk-zh.cjk-chars { font-family: KaiTi, STKaiti, "Kaiti SC", "Microsoft YaHei", "PingFang SC", sans-serif; }
#tn-card .cjk-ja.cjk-chars, #tn-vig .cjk-ja.cjk-chars, .card.rpoem .pl .cjk-ja.cjk-chars { font-family: "Yu Mincho", YuMincho, "Hiragino Mincho ProN", "MS Mincho", "Yu Gothic UI", "Yu Gothic", Meiryo, sans-serif; font-weight: 700; }
#tn-card .cjk rt, #tn-vig .cjk rt { font-size: .3em; letter-spacing: 0; text-shadow: none; opacity: .75; }
#tn-card .ep .cjk rt { font-size: .7em; }
.card.rpoem .pl .cjk-chars { font-size: 24px; }
.card.rpoem .pl .cjk rt { font-size: .48em; }
`;
    document.head.appendChild(s);
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
  // a kit of pieces in a movable frame: add(geo, color, x, y, z, sx, sy, sz, rx, ry, rz); beam(a, b, t, color) from point a to b
  function Kit() {
    const P = []; let F = new THREE.Matrix4();
    const k = {
      P,
      frame(x = 0, y = 0, z = 0, yaw = 0, rx = 0, rz = 0) { F = new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, yaw, rz, 'YXZ')), V3(1, 1, 1)); return k; },
      add(geo, color, x, y, z, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0) { P.push({ geo, color, m: F.clone().multiply(M4(x, y, z, sx, sy, sz, ry, rx, rz)) }); return k; },
      box(x, y, z, w, h, d, color, rx = 0, ry = 0, rz = 0) { return k.add(GEO.box, color, x, y, z, w, h, d, rx, ry, rz); },
      beam(a, b, t, color, t2 = t, geo = GEO.box) {
        const d = V3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length();
        const q = new THREE.Quaternion().setFromUnitVectors(V3(0, 1, 0), d.clone().normalize());
        P.push({ geo, color, m: F.clone().multiply(new THREE.Matrix4().compose(V3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, V3(t, L, t2))) });
        return k;
      },
      put(geo, color, m) { P.push({ geo, color, m: F.clone().multiply(m || new THREE.Matrix4()) }); return k; },
    };
    return k;
  }
  const VC = () => TK.toon('#ffffff', { vc: 1, rim: 0.22 });
  function inked(P, ink = 0.016, o = {}) {
    const geo = bake(P), g = new THREE.Group();
    const m = new THREE.Mesh(geo, o.mat || VC()); m.castShadow = o.shadow !== false; m.receiveShadow = !!o.receive; g.add(m);
    if (ink) { const h = new THREE.Mesh(geo, TK.outlineMat(ink)); h.castShadow = false; g.add(h); }
    g.userData.mesh = m;
    return g;
  }
  const INK = '#2b2235';
  const inkMat = new THREE.MeshBasicMaterial({ color: INK });
  const whiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const glowMat = (color, opacity) => new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending });
  const textTex = (w, h, draw) => { const t = TK.canvasTex(w, h, draw); t.anisotropy = 4; return t; };
  // a symbol on a sprite (♪ ♫ ♥ !), white with an ink edge
  const symTex = (ch, color) => textTex(64, 64, c => { c.font = '900 50px "Segoe UI Symbol", Bahnschrift, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 7; c.strokeStyle = '#fffaf0'; c.strokeText(ch, 32, 35); c.fillStyle = color; c.fillText(ch, 32, 35); });

  // ---------------- people: an articulated figure (body, legs, arms, head; eyes and mouth apart, for blinks and talking)
  // look: { w, hipX, shoulder, shoulderY, neck, leg(k, s), torso(k), arm(k, s), head(k), eyes: { x, y, z, sx, sy }, mouth(head) }
  function figure(look) {
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const legs = [-1, 1].map(s => {
      const hip = new THREE.Group(); hip.position.set(s * (look.hipX || 0.11), 0.36, 0); body.add(hip);
      const k = Kit(); look.leg(k, s); hip.add(inked(k.P, 0.013)); return hip;
    });
    const tk = Kit(); look.torso(tk); body.add(inked(tk.P, 0.016));
    const arms = [-1, 1].map(s => {
      const sh = new THREE.Group(); sh.position.set(s * (look.shoulder || 0.27), look.shoulderY || 0.85, 0.02); body.add(sh);
      const k = Kit(); look.arm(k, s); sh.add(inked(k.P, 0.013)); return sh;
    });
    const head = new THREE.Group(); head.position.set(0, look.neck || 0.98, 0); body.add(head);
    const hk = Kit(); look.head(hk); head.add(inked(hk.P, 0.014));
    const E = look.eyes;
    const eyes = [-1, 1].map(s => {
      const e = new THREE.Group(); e.position.set(s * E.x, E.y, E.z); head.add(e);
      const ball = new THREE.Mesh(GEO.sphS, inkMat); ball.scale.set(E.sx, E.sy, E.sx * 0.66); e.add(ball);
      const hl = new THREE.Mesh(GEO.sphS, whiteMat); hl.scale.setScalar(E.sx * 0.38); hl.position.set(E.sx * 0.35, E.sy * 0.4, E.sx * 0.5); e.add(hl);
      return e;
    });
    const mouth = look.mouth(head);
    root.traverse(o => { if (o.isMesh && !o.material.isMeshBasicMaterial) o.castShadow = true; });
    return { root, body, legs, arms, head, eyes, mouth, props: {} };
  }

  // Dante: deep brown skin, built like a strongman (big shoulders and arms, a broad chest tapering to the waist), short black
  // hair and a trimmed beard, a fitted charcoal tank top under a leather apron, leather wristbands, a red bandana, his hammer
  // in his right hand
  function makeDante() {
    const skin = '#6b3f26', skinD = '#552f1c', skinL = '#7a4a2e', hair = '#17110e', shirt = '#3b3f4a', apron = '#b07a43', apronD = '#6b4423',
      pants = '#3d4660', boot = '#4a2f1e', red = '#d9493b', iron = '#4e4f5a';
    // the body's profile (radius, height): narrow hips, a V up to a deep chest, then the shoulders sloping up into big traps
    const prof = [[0, 0.3], [0.32, 0.31], [0.35, 0.4], [0.37, 0.5], [0.44, 0.62], [0.49, 0.72], [0.5, 0.79], [0.47, 0.84], [0.4, 0.89], [0.27, 0.94], [0.14, 0.975], [0, 0.985]];
    const F = figure({
      hipX: 0.17, shoulder: 0.53, shoulderY: 0.8, neck: 0.97,
      eyes: { x: 0.1, y: 0.235, z: 0.262, sx: 0.036, sy: 0.05 },
      leg(k) { k.add(GEO.cyl, pants, 0, -0.14, 0, 0.13, 0.28, 0.13).add(GEO.cyl, boot, 0, -0.28, 0.005, 0.132, 0.1, 0.132).add(GEO.sphS, boot, 0, -0.33, 0.06, 0.135, 0.075, 0.18); },
      torso(k) {
        // the tank top, all the way up to the neck (his arms and shoulder caps are bare)
        k.put(lathe(prof, 18), shirt);
        // the tan leather apron: a bib over the chest and belly, a knee-length skirt in front (his trousers and boots show
        // under it), straps over the shoulders, a pocket with a chisel
        k.put(new THREE.LatheGeometry(prof.slice(2, 7).map(([r, y]) => new THREE.Vector2(r * 1.04 + 0.006, y)), 6, -0.72, 1.44), apron);
        k.put(new THREE.CylinderGeometry(0.39, 0.42, 0.24, 7, 1, true, -0.85, 1.7), apron, M4(0, 0.3, 0, 1));
        k.add(GEO.box, apronD, 0, 0.415, 0.4, 0.5, 0.05, 0.05);
        k.add(GEO.cyl, apronD, 0, 0.41, 0, 0.392, 0.05, 0.392);
        k.add(GEO.box, '#c9a24a', 0, 0.41, 0.405, 0.08, 0.055, 0.03);
        for (const s of [-1, 1]) { k.beam([s * 0.17, 0.79, 0.49], [s * 0.27, 0.94, 0.05], 0.07, apronD, 0.03); k.beam([s * 0.27, 0.94, 0.05], [s * 0.21, 0.84, -0.44], 0.07, apronD, 0.03); }
        k.add(GEO.box, apronD, -0.12, 0.58, 0.455, 0.16, 0.13, 0.02);
        k.add(GEO.cyl8, '#a8673a', -0.16, 0.66, 0.455, 0.012, 0.12, 0.012).add(GEO.box, iron, -0.08, 0.66, 0.456, 0.02, 0.1, 0.012);
        // the bandana, knotted in front
        k.add(GEO.torus, red, 0, 0.935, 0.02, 0.16, 0.16, 0.2, HALF, 0, 0);
        k.add(GEO.cone4, red, 0, 0.86, 0.17, 0.07, 0.12, 0.03, Math.PI, Math.PI / 4, 0);
      },
      arm(k, s) {
        // bare, big arms: a round shoulder, a thick upper arm with a biceps in front and a triceps behind, the elbow, a heavy
        // forearm, a leather wristband, a big hand
        k.add(GEO.sph, skin, 0, -0.01, 0, 0.155, 0.15, 0.155);
        k.add(GEO.cyl, skin, 0, -0.12, 0, 0.112, 0.2, 0.112);
        k.add(GEO.sphS, skinL, 0, -0.13, 0.05, 0.1, 0.112, 0.085).add(GEO.sphS, skin, 0, -0.11, -0.04, 0.096, 0.1, 0.08);
        k.add(GEO.sphS, skin, 0, -0.23, 0, 0.092, 0.08, 0.092);
        k.add(GEO.sphS, skin, 0, -0.275, 0.008, 0.102, 0.075, 0.102).add(GEO.cyl, skin, 0, -0.31, 0.006, 0.094, 0.12, 0.094);
        k.add(GEO.cyl, apronD, 0, -0.37, 0.006, 0.098, 0.045, 0.098);
        k.add(GEO.sphS, skin, 0, -0.405, 0.012, 0.108, 0.1, 0.108);
        if (s < 0) {      // his right hand: the hammer (the handle pointing forward, the head at its end)
          k.add(GEO.cyl8, '#9a6a3e', 0, -0.41, 0.27, 0.03, 0.54, 0.03, HALF, 0, 0);
          k.add(GEO.box, iron, 0, -0.41, 0.55, 0.14, 0.27, 0.15).add(GEO.box, '#6d6f7a', 0, -0.28, 0.55, 0.145, 0.03, 0.155);
        }
      },
      head(k) {
        k.add(GEO.sph, skin, 0, 0.22, 0, 0.29, 0.285, 0.28);
        for (const s of [-1, 1]) k.add(GEO.sphS, skin, s * 0.285, 0.21, -0.01, 0.05, 0.075, 0.045);
        k.add(GEO.sphS, skinD, 0, 0.175, 0.278, 0.06, 0.048, 0.05);                                       // a broad nose
        // short hair, close-cropped, with a sharp hairline
        k.put(new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI * 0.5), hair, M4(0, 0.24, -0.015, 0.302, 0.3, 0.3, 0, -0.42, 0));
        // the trimmed beard along the jaw and chin (the front two-thirds of the lower head), the mustache, sideburns
        k.put(new THREE.SphereGeometry(1, 16, 6, -Math.PI / 6, Math.PI * 4 / 3, Math.PI * 0.63, Math.PI * 0.37), hair, M4(0, 0.22, 0.004, 0.298, 0.292, 0.29));
        k.add(GEO.sphS, hair, 0, 0.152, 0.279, 0.09, 0.024, 0.03);
        for (const s of [-1, 1]) k.add(GEO.box, hair, s * 0.276, 0.17, 0.035, 0.03, 0.15, 0.07);
        for (const s of [-1, 1]) k.add(GEO.box, hair, s * 0.1, 0.312, 0.258, 0.095, 0.03, 0.025, 0, 0, -s * 0.14);   // thick eyebrows
        for (const s of [-1, 1]) k.add(GEO.sphS, '#7a4330', s * 0.175, 0.16, 0.236, 0.045, 0.022, 0.012, 0, s * 0.45, 0);   // a warm flush
      },
      mouth(head) {     // a big grin: a dark half-moon with teeth
        const g = new THREE.Group(); g.position.set(0, 0.118, 0.282); head.add(g);
        const m = new THREE.Mesh(new THREE.CircleGeometry(0.052, 12, Math.PI, Math.PI), new THREE.MeshBasicMaterial({ color: '#4a1a1e' })); g.add(m);
        const t = new THREE.Mesh(new THREE.PlaneGeometry(0.084, 0.016), whiteMat); t.position.set(0, -0.009, 0.002); g.add(t);
        g.rotation.x = -0.12;
        return g;
      },
    });
    F.root.scale.setScalar(1.12); F.h = 1.62 * 1.12;
    return F;
  }
  // Morgana: pale, long black hair with straight bangs, a black dress with plum, a lace collar, striped tights, boots, a silver
  // moon earring, her notebook. `style` 'base' is how she is; the six others are previews the user is choosing between.
  // Round 4 (2026-11-08), "go back to the original design and try to differentiate from that": six versions of her base look
  // (the same pale skin, black hair, black and plum, lace and silver moons), each with her own hair, face, build and goth
  // outfit. Round 3's six (each a different-looking woman) are kept in prototypes/morgana-looks-round3.js.
  const MLOOKS = ['gown', 'baby', 'poet', 'witch', 'veil', 'dandy'];
  function makeMorgana(style = 'base') {
    const skin = '#f4e2d8', skinD = '#e6c9bc', ink = '#1d1822', silver = '#dfe4ee', gold = '#c9a24a';
    const prof = [[0, 0.3], [0.19, 0.31], [0.215, 0.4], [0.225, 0.5], [0.25, 0.66], [0.245, 0.78], [0.18, 0.88], [0.1, 0.955], [0, 0.965]];
    const PROF = {        // body shapes (radius, height), hips to neck
      slim: [[0, 0.3], [0.17, 0.31], [0.195, 0.4], [0.2, 0.5], [0.23, 0.66], [0.225, 0.78], [0.165, 0.88], [0.095, 0.955], [0, 0.965]],
      fit: [[0, 0.3], [0.2, 0.31], [0.21, 0.4], [0.2, 0.5], [0.255, 0.66], [0.255, 0.78], [0.19, 0.88], [0.1, 0.955], [0, 0.965]],
      curvy: [[0, 0.3], [0.24, 0.31], [0.29, 0.4], [0.27, 0.5], [0.3, 0.64], [0.28, 0.78], [0.2, 0.88], [0.11, 0.955], [0, 0.965]],
      lanky: [[0, 0.3], [0.165, 0.31], [0.185, 0.4], [0.19, 0.5], [0.212, 0.66], [0.212, 0.78], [0.158, 0.88], [0.085, 0.955], [0.06, 0.975], [0, 0.99]],
    };
    const SK = { gown: ['#f6ece8', '#e6d3cf'], baby: ['#f9e4da', '#efcbbd'], poet: ['#f3dccb', '#e2c1aa'], witch: ['#ede3dc', '#d9c8bd'], veil: ['#f3e8e6', '#ddd0cd'], dandy: ['#f4e2d8', '#e6c9bc'] };
    const lath = (pts, n = 16, p0 = 0, pl = TAU) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), n, p0, pl);     // (bottom to top: normals out)
    const onF = (x, r) => Math.sqrt(Math.max(0, r * r - x * x));          // (how far forward a surface of radius r is, x to the side)
    let curE = null;                                                        // (the look's eyes, while its head is built)
    const plain = Kit();                                                    // (head pieces too small for an ink outline: freckles)
    // her face: head, ears, nose, eyeshadow, liner, blush. o: skin, skinD, shadow, smoky, liner, lash, blush, brows, arch, nose
    // ('button' | 'point' | 'broad' | 'long'), lids, lower, smudge, contour, cheeks, chin, freckles, mole. Brows show only without bangs.
    const face = (k, o = {}) => {
      const sk = o.skin || skin, sd = o.skinD || skinD, E = o.E || curE || { x: 0.095, y: 0.205, sx: 0.034, sy: 0.047 }, L = o.lash || 1;
      k.add(GEO.sph, sk, 0, 0.21, 0, 0.275, 0.27, 0.265);
      for (const s of [-1, 1]) k.add(GEO.sphS, sk, s * 0.268, 0.19, -0.005, 0.04, 0.06, 0.04);
      if (o.cheeks) for (const s of [-1, 1]) k.add(GEO.sphS, sk, s * 0.15, 0.11, 0.17, 0.11, 0.09, 0.09);
      if (o.chin) k.add(GEO.sphS, sk, 0, 0.025, 0.155, 0.055, 0.05, 0.045);           // (a slight point, not a blob)
      const n = o.nose || 'button';
      if (n === 'button') k.add(GEO.sphS, sd, 0, 0.158, 0.27, 0.022, 0.024, 0.02);
      else if (n === 'point') k.add(GEO.cone, sd, 0, 0.163, 0.268, 0.021, 0.05, 0.021, 1.95, 0, 0);
      else if (n === 'broad') { k.add(GEO.sphS, sd, 0, 0.152, 0.268, 0.034, 0.026, 0.022); for (const s of [-1, 1]) k.add(GEO.sphS, sd, s * 0.024, 0.145, 0.265, 0.016, 0.014, 0.014); }
      else if (n === 'long') k.add(GEO.sphS, sd, 0, 0.165, 0.27, 0.02, 0.04, 0.022);         // ('none': no nose at all)
      for (const s of [-1, 1]) {
        const ex = s * E.x, top = E.y + E.sy * 0.85;
        k.add(GEO.sphS, o.shadow || '#a77aa3', ex, top, 0.247, E.sx * 1.35, 0.018 * (o.smoky || 1), 0.012);
        k.add(GEO.box, o.liner || INK, ex + s * 0.033 * (E.sx / 0.034), top - 0.008, 0.25, 0.034 * L, 0.009 * L, 0.01, 0, 0, s * 0.55);
        if (o.lids) k.add(GEO.sphS, o.lids, ex, E.y + E.sy * 0.45, 0.262, E.sx * 1.45, E.sy * 0.62, 0.02);
        if (o.lower) k.add(GEO.box, o.lower, ex, E.y - E.sy * 0.95, 0.262, E.sx * 1.6, 0.006, 0.008);
        if (o.smudge) k.add(GEO.sphS, o.smudge, ex, E.y - E.sy * 0.95, 0.246, E.sx * 1.3, 0.014, 0.01);
        if (o.contour) k.add(GEO.box, o.contour, s * 0.19, 0.14, 0.185, 0.07, 0.014, 0.01, 0, s * 0.62, -s * 0.5);
        if (o.blush !== false) k.add(GEO.sphS, o.blush || '#f1c3cb', s * 0.158, 0.135, 0.226, 0.036, 0.017, 0.008, 0, s * 0.5, 0);
        if (o.brows) k.add(GEO.box, o.brows, s * 0.1, 0.3, 0.236, 0.07, o.browT || 0.016, 0.015, 0, 0, s * (o.arch || 0.12));      // (arch: the outer ends up)
        if (o.flicks) for (const [f, a] of o.flicks === 3 ? [[0, 0.3], [0.4, 0.62], [0.78, 1.0]] : [[0.25, 0.55], [0.7, 0.95]]) k.add(GEO.box, o.liner || INK, ex + s * E.sx * f, top + 0.007, 0.252, 0.005, o.flicks === 3 ? 0.028 : 0.022, 0.008, 0, 0, -s * a);   // lashes
      }
      if (o.freckles) [[-0.13, 0.15], [-0.1, 0.13], [-0.16, 0.12], [-0.12, 0.105], [0.13, 0.15], [0.1, 0.13], [0.16, 0.12], [0.12, 0.105], [-0.03, 0.17], [0.03, 0.17]].forEach(([x, y]) => plain.add(GEO.sphS, o.freckles, x, y, onF(x, 0.255) + 0.002, 0.008, 0.008, 0.004));
      if (o.mole) k.add(GEO.sphS, '#3a2228', 0.07, 0.085, 0.246, 0.008);
    };
    // hair pieces: the back and sides (open in front), the crown, straight bangs
    const shell = (k, c) => k.put(new THREE.SphereGeometry(1, 16, 10, HALF + 0.95, TAU - 1.9, 0, Math.PI * 0.62), c, M4(0, 0.215, -0.012, 0.296, 0.296, 0.296, 0, -0.12, 0));
    const crown = (k, c, f = 0.3) => k.put(new THREE.SphereGeometry(1, 16, 5, 0, TAU, 0, Math.PI * f), c, M4(0, 0.215, 0, 0.297));
    const bangs = (k, c) => k.put(new THREE.CylinderGeometry(0.262, 0.274, 0.12, 14, 1, true, -0.92, 1.84), c, M4(0, 0.352, 0.0, 1));
    const moon = k => { k.put(new THREE.TorusGeometry(0.036, 0.011, 4, 10, Math.PI * 1.3), silver, M4(0.325, 0.04, 0.06, 1, 1, 1, 0.75, 0, 0.7)); k.add(GEO.sphS, silver, 0.318, 0.09, 0.05, 0.013); };
    const boots = (k, c, r = 0.08) => k.add(GEO.cyl, c, 0, -0.255, 0.005, r, 0.15, r).add(GEO.sphS, c, 0, -0.335, 0.045, r + 0.005, 0.06, r + 0.055);
    const hand = (k, c = skin, r = 0.066) => k.add(GEO.sphS, c, 0, -0.33, 0.005, r);
    const rAt = (P, y) => { for (let i = 1; i < P.length; i++) if (y <= P[i][1] || i === P.length - 1) { const [r0, y0] = P[i - 1], [r1, y1] = P[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return 0; };   // (a profile's radius at y)
    // a line over the top of her head (a part): x to the side, from angle a0 to a1 (0 = the top, + toward her face)
    const arcLine = (k, c, x, a0, a1, r, w = 0.008) => { const R = Math.sqrt(Math.max(0, r * r - x * x)), P = a => [x, 0.215 + R * Math.cos(a), R * Math.sin(a)]; for (let i = 0; i < 4; i++) k.beam(P(a0 + (a1 - a0) * i / 4), P(a0 + (a1 - a0) * (i + 1) / 4), w, c, w); };
    // a smooth tube along a curve through `pts`, its radius r0 → r1 (or r0(t)): a ponytail, a wavy lock. sq < 1 flattens it
    // front to back. (Each ring: U sideways, W = T × U, so U × W = T and the faces point out.)
    const tube = (pts, r0, r1 = r0, seg = 16, n = 8, sq = 1) => {
      const cur = new THREE.CatmullRomCurve3(pts.map(p => V3(p[0], p[1], p[2]))), pos = [], nor = [], idx = [];
      for (let i = 0; i <= seg; i++) {
        const t = i / seg, P = cur.getPointAt(t), T = cur.getTangentAt(t).normalize(), r = typeof r0 === 'function' ? r0(t) : r0 + (r1 - r0) * t;
        let U = V3(T.y, -T.x, 0); if (U.lengthSq() < 1e-6) U = V3(1, 0, 0); U.normalize();
        const W = new THREE.Vector3().crossVectors(T, U);
        for (let j = 0; j <= n; j++) {
          const a = j / n * TAU, c = Math.cos(a), s = Math.sin(a);
          const d = U.clone().multiplyScalar(c).addScaledVector(W, s * sq), m = U.clone().multiplyScalar(c * sq).addScaledVector(W, s).normalize();
          pos.push(P.x + d.x * r, P.y + d.y * r, P.z + d.z * r); nor.push(m.x, m.y, m.z);
        }
      }
      for (let i = 0; i < seg; i++) for (let j = 0; j < n; j++) { const a = i * (n + 1) + j, b = a + n + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
      return g;
    };

    const LOOKS = {
      base: {
        leg(k) {
          k.add(GEO.cyl, '#211b29', 0, -0.13, 0, 0.068, 0.28, 0.068);
          for (const y of [-0.05, -0.11, -0.17]) k.add(GEO.cyl, '#8b3f7c', 0, y, 0, 0.071, 0.028, 0.071);      // striped tights
          boots(k, '#1a161f'); k.add(GEO.box, silver, 0.0, -0.22, 0.078, 0.04, 0.02, 0.012);
        },
        torso(k) {
          const dress = '#2a2230', plum = '#6e2f63', lace = '#f3eee6';
          k.put(lath(prof), dress);
          // the skirt, flaring from the waist, with a plum ruffle peeking out under it; the sash
          k.put(lath([[0.405, 0.19], [0.39, 0.22], [0.33, 0.33], [0.27, 0.45], [0.235, 0.53]]), dress);
          k.put(lath([[0.42, 0.155], [0.41, 0.17], [0.37, 0.24]]), plum);
          k.add(GEO.cyl, plum, 0, 0.5, 0, 0.243, 0.06, 0.243);
          for (const s of [-1, 1]) k.add(GEO.sphS, plum, s * 0.06, 0.5, -0.24, 0.07, 0.045, 0.04, 0, 0, s * 0.4);
          // the lace collar: a ring and scallops in front, with a little silver brooch; tiny buttons
          k.add(GEO.torus, lace, 0, 0.9, 0.0, 0.155, 0.155, 0.22, HALF, 0, 0);
          for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.32; k.add(GEO.sphS, lace, Math.sin(a) * 0.16, 0.865, Math.cos(a) * 0.16, 0.05, 0.035, 0.018, 0.25, a, 0); }
          k.add(GEO.sphS, silver, 0, 0.88, 0.175, 0.022);
          for (let i = 0; i < 3; i++) k.add(GEO.sphS, '#4a3a55', 0, 0.62 + i * 0.075, 0.245, 0.012);
        },
        arm(k) { k.add(GEO.cyl, '#2a2230', 0, -0.15, 0, 0.066, 0.3, 0.066); k.add(GEO.torus, '#f3eee6', 0, -0.29, 0, 0.068, 0.068, 0.12, HALF, 0, 0); hand(k); },
        head(k) {
          face(k); shell(k, ink); crown(k, ink); bangs(k, ink);
          k.add(GEO.sph, ink, 0, -0.07, -0.17, 0.27, 0.42, 0.13);                                                   // long hair down her back
          for (const s of [-1, 1]) k.add(GEO.sph, ink, s * 0.248, 0.0, 0.065, 0.066, 0.29, 0.08, 0, 0, s * 0.05);   // two long locks by her face
          moon(k);
        },
        lips: '#7a3466', book: '#6e2f63',
      },
      // 1. taller and sharper: a long oval face, almond eyes in a long black wing, high arched brows, a pointed nose, dark plum
      //    lips; her hair slicked back into a high ponytail that reaches her waist (no bangs, her forehead shows); a long black
      //    gown with a white lace jabot, a plum corset belt, a plum panel down its front, puffed sleeves with lace cuffs; moon drops
      gown: {
        body: { scale: 1.08, hipX: 0.085, shoulder: 0.232 },
        eyes: { x: 0.093, y: 0.205, z: 0.256, sx: 0.037, sy: 0.032 }, headScale: [0.94, 1.05, 0.97],
        leg(k) {
          k.add(GEO.cyl, '#1a161f', 0, -0.13, 0, 0.058, 0.28, 0.058).add(GEO.cyl, '#141118', 0, -0.27, 0, 0.066, 0.13, 0.066);
          k.put(new THREE.ConeGeometry(0.066, 0.22, 10), '#141118', M4(0, -0.335, 0.09, 1, 1, 0.5, 0, HALF, 0));
        },
        torso(k) {
          const blk = '#221c28', plum = '#6e2f63', lace = '#f3eee6';
          k.put(lath(PROF.slim), blk);
          // the gown to the floor, a plum panel down its front, a black lace hem
          k.put(lath([[0.45, 0.0], [0.445, 0.035], [0.39, 0.19], [0.31, 0.36], [0.235, 0.47], [0.205, 0.52]], 22), blk);
          k.put(lath([[0.457, 0.0], [0.452, 0.035], [0.397, 0.19], [0.317, 0.36], [0.241, 0.47]], 6, -0.3, 0.6), plum);
          for (let i = 0; i < 22; i++) { const a = i * TAU / 22; k.add(GEO.sphS, '#3a3242', Math.sin(a) * 0.455, 0.02, Math.cos(a) * 0.455, 0.042, 0.03, 0.014, 0, a, 0); }
          // the plum corset belt, laced in silver
          k.put(lath([[0.207, 0.46], [0.213, 0.5], [0.227, 0.58], [0.241, 0.66]], 18), plum);
          for (let i = 0; i < 4; i++) for (const s of [-1, 1]) k.add(GEO.box, silver, 0, 0.485 + i * 0.045, 0.219 + i * 0.006, 0.05, 0.006, 0.006, 0, 0, s * 0.6);
          // the white lace jabot: a ruffled collar and ruffles down her chest, a moon brooch
          k.add(GEO.torus, lace, 0, 0.9, 0, 0.15, 0.15, 0.22, HALF, 0, 0);
          k.put(new THREE.ConeGeometry(0.075, 0.17, 4), lace, M4(0, 0.8, 0.215, 1, 1, 0.3, 0, Math.PI - 0.22, 0));
          [[0.86, 0.2, 0.07], [0.815, 0.222, 0.058], [0.77, 0.238, 0.045]].forEach(([y, z, w]) => k.add(GEO.sphS, lace, 0, y, z, w, 0.018, 0.016, 0.25, 0, 0));
          k.put(new THREE.TorusGeometry(0.026, 0.008, 4, 10, Math.PI * 1.3), silver, M4(0, 0.905, 0.205, 1, 1, 1, 0, 0, -0.9));
        },
        arm(k) {
          const blk = '#221c28';
          k.add(GEO.sph, blk, 0, -0.05, 0, 0.098, 0.11, 0.098);                                   // puffed at the shoulder
          k.add(GEO.cyl, blk, 0, -0.18, 0, 0.054, 0.24, 0.054);
          k.put(new THREE.CylinderGeometry(0.057, 0.074, 0.05, 12, 1, true), '#f3eee6', M4(0, -0.29, 0, 1));     // a lace cuff
          hand(k, SK.gown[0], 0.058);
        },
        head(k) {
          const S = SK.gown;
          face(k, { skin: S[0], skinD: S[1], lids: '#3a2a3e', shadow: '#4a2a4a', smoky: 1.2, lash: 1.8, brows: ink, arch: 0.16, nose: 'point', blush: false });
          // slicked back: a cap over her head, tilted so her forehead shows, gathered into a high ponytail
          k.put(new THREE.SphereGeometry(1, 18, 8, 0, TAU, 0, HALF), ink, M4(0, 0.21, -0.005, 0.293, 0.29, 0.283, 0, -0.68, 0));
          k.add(GEO.cyl, '#6e2f63', 0, 0.49, -0.2, 0.058, 0.05, 0.058, -1.05, 0, 0);               // a plum velvet tie
          k.put(tube([[0, 0.48, -0.18], [0, 0.56, -0.29], [0, 0.52, -0.4], [0, 0.34, -0.45], [0, 0.05, -0.41], [0, -0.25, -0.33], [0, -0.48, -0.27]],
            t => Math.min(0.055 + t * 0.4, 0.077 - 0.058 * t), 0, 40, 10), ink);
          // silver crescent moons hanging from both ears
          for (const s of [-1, 1]) {
            k.add(GEO.sphS, silver, s * 0.29, 0.13, 0.0, 0.011).add(GEO.box, silver, s * 0.292, 0.095, 0.0, 0.005, 0.06, 0.005);
            k.put(new THREE.TorusGeometry(0.03, 0.009, 4, 10, Math.PI * 1.3), silver, M4(s * 0.294, 0.05, 0.01, 1, 1, 1, s * 0.6, 0, 2.3));
          }
        },
        lips: '#4a1438', lipSize: [0.03, 0.012], book: '#4a2442',
      },
      // 2. smaller and softer: petite, a round face, big round eyes with lower lashes, freckles, a tiny plum mouth; a chin-length
      //    bob with choppy micro-bangs and a silver bat clip; a black babydoll dress with puff sleeves, a big black lace collar,
      //    a plum bow and sash; bold plum-and-black striped tights, platform Mary Janes
      baby: {
        body: { scale: 0.9, hipX: 0.088, shoulder: 0.24 },
        eyes: { x: 0.1, y: 0.2, z: 0.257, sx: 0.046, sy: 0.06 }, headScale: [1.06, 0.96, 1.0],
        leg(k) {
          k.add(GEO.cyl, '#7a3470', 0, -0.13, 0, 0.068, 0.28, 0.068);
          for (const y of [-0.025, -0.085, -0.145, -0.205]) k.add(GEO.cyl, '#1d1822', 0, y, 0, 0.071, 0.03, 0.071);    // bold stripes
          k.add(GEO.sphS, '#141118', 0, -0.305, 0.045, 0.076, 0.048, 0.115);                     // Mary Janes: a round toe,
          k.add(GEO.box, '#141118', 0, -0.272, 0.03, 0.15, 0.016, 0.03);                          // a strap,
          k.add(GEO.box, '#2a2630', 0, -0.343, 0.04, 0.165, 0.045, 0.255);                        // a thick sole
        },
        torso(k) {
          const blk = '#211b29', plum = '#6e2f63', lace = '#3d3546';
          k.put(lath(prof), blk);
          // the babydoll skirt, flaring from just under her chest, its lace hem; a plum sash with a bow
          k.put(lath([[0.37, 0.31], [0.36, 0.34], [0.31, 0.46], [0.27, 0.58], [0.25, 0.66]], 20), blk);
          for (let i = 0; i < 20; i++) { const a = i * TAU / 20; k.add(GEO.sphS, lace, Math.sin(a) * 0.37, 0.305, Math.cos(a) * 0.37, 0.04, 0.026, 0.014, 0, a, 0); }
          k.add(GEO.cyl, plum, 0, 0.665, 0, 0.258, 0.042, 0.258);
          for (const s of [-1, 1]) k.add(GEO.sphS, plum, s * 0.045, 0.665, 0.258, 0.045, 0.03, 0.02, 0, 0, -s * 0.35);
          k.add(GEO.sphS, plum, 0, 0.665, 0.266, 0.018);
          // a big round collar in black lace, a plum bow at her throat
          k.add(GEO.torus, lace, 0, 0.9, 0, 0.15, 0.15, 0.2, HALF, 0, 0);
          for (const s of [-1, 1]) k.add(GEO.sphS, lace, s * 0.09, 0.865, 0.16, 0.1, 0.045, 0.06, 0.35, 0, s * 0.3);
          for (const s of [-1, 1]) k.add(GEO.sphS, plum, s * 0.038, 0.885, 0.21, 0.038, 0.025, 0.018, 0, 0, -s * 0.35);
          k.add(GEO.sphS, plum, 0, 0.885, 0.218, 0.016);
        },
        arm(k) {
          k.add(GEO.sph, '#211b29', 0, -0.04, 0, 0.1, 0.095, 0.1);                                 // a puff sleeve
          k.add(GEO.cyl, SK.baby[0], 0, -0.19, 0, 0.05, 0.2, 0.05);
          k.add(GEO.torus, '#3d3546', 0, -0.29, 0, 0.055, 0.055, 0.2, HALF, 0, 0);
          hand(k, SK.baby[0], 0.058);
        },
        head(k) {
          const S = SK.baby;
          face(k, { skin: S[0], skinD: S[1], shadow: '#8a5a8a', lash: 1.0, freckles: '#d9a088', blush: '#f2a8b0' });
          // the bob: a cap, the sides and back down to her chin (open for her face), choppy micro-bangs high on her forehead
          crown(k, ink, 0.32);
          k.put(lath([[0.318, 0.0], [0.326, 0.07], [0.322, 0.17], [0.305, 0.27], [0.275, 0.34], [0.245, 0.4]], 18, 0.98, TAU - 1.96), ink);
          k.put(new THREE.SphereGeometry(1, 16, 2, HALF - 1.02, 2.04, Math.PI * 0.24, Math.PI * 0.11), ink, M4(0, 0.215, 0, 0.302, 0.3, 0.3));
          for (let i = 0; i < 9; i++) { const a = -0.88 + i * 0.22; k.add(GEO.cone4, ink, Math.sin(a) * 0.268, 0.338, Math.cos(a) * 0.268, 0.03, 0.04, 0.012, Math.PI, a, 0); }
          // a silver bat clip
          { const x = -0.19, y = 0.37, z = 0.172; k.add(GEO.sphS, silver, x, y, z, 0.014, 0.02, 0.012); for (const s of [-1, 1]) k.add(GEO.sphS, silver, x + s * 0.03, y + 0.01, z - 0.004, 0.03, 0.014, 0.008, 0, 0, s * 0.35); }
        },
        lips: '#6a2a5a', lipSize: [0.022, 0.01], book: '#6e2f63',
      },
      // 3. curvier and bookish: a soft face with round cheeks, gentle heavy-lidded eyes behind round silver glasses, a beauty
      //    mark, full berry lips; long loose waves to her waist, parted in the middle; a plum poet's blouse with full sleeves, a
      //    black laced corset, a long tiered black skirt, a velvet choker with a silver moon
      poet: {
        body: { scale: 0.99, hipX: 0.11, shoulder: 0.272 },
        eyes: { x: 0.098, y: 0.205, z: 0.258, sx: 0.038, sy: 0.042 }, headScale: [1.04, 0.99, 1.02],
        leg(k) { k.add(GEO.cyl, '#1a161f', 0, -0.13, 0, 0.08, 0.28, 0.08); boots(k, '#16121a', 0.088); },
        torso(k) {
          const plum = '#6e2f63', blk = '#1b1620';
          k.put(lath(PROF.curvy), plum);
          // the long skirt in two tiers, to her ankles
          k.put(lath([[0.47, 0.02], [0.46, 0.05], [0.41, 0.2]], 22), blk);
          k.put(lath([[0.42, 0.19], [0.41, 0.22], [0.35, 0.36], [0.3, 0.47], [0.28, 0.52]], 22), blk);
          // the corset, laced in silver, its boning
          k.put(lath([[0.283, 0.46], [0.283, 0.5], [0.3, 0.58], [0.312, 0.66]], 20), blk);
          for (let i = 0; i < 4; i++) for (const s of [-1, 1]) k.add(GEO.box, silver, 0, 0.49 + i * 0.045, 0.287 + i * 0.007, 0.055, 0.006, 0.006, 0, 0, s * 0.6);
          for (const a of [-1.1, -0.55, 0.55, 1.1]) k.beam([Math.sin(a) * 0.288, 0.47, Math.cos(a) * 0.288], [Math.sin(a) * 0.317, 0.65, Math.cos(a) * 0.317], 0.008, '#3a3442', 0.008);
          // a velvet choker with a silver moon
          k.add(GEO.torus, blk, 0, 0.895, 0, 0.178, 0.178, 0.12, HALF, 0, 0);
          k.add(GEO.box, silver, 0, 0.868, 0.2, 0.004, 0.03, 0.004);
          k.put(new THREE.TorusGeometry(0.026, 0.008, 4, 10, Math.PI * 1.3), silver, M4(0, 0.84, 0.238, 1, 1, 1, 0, 0, -0.9));
        },
        arm(k) {
          k.add(GEO.sph, '#6e2f63', 0, -0.15, 0, 0.1, 0.18, 0.1);                                   // a full poet's sleeve
          k.add(GEO.cyl, '#1b1620', 0, -0.288, 0, 0.06, 0.04, 0.06);                                 // gathered at a black cuff
          k.put(new THREE.CylinderGeometry(0.058, 0.086, 0.05, 12, 1, true), '#f3eee6', M4(0, -0.322, 0, 1));     // a lace ruffle
          hand(k, SK.poet[0], 0.064);
        },
        head(k) {
          const S = SK.poet;
          face(k, { skin: S[0], skinD: S[1], lids: '#6a4a62', shadow: '#7a4a6a', lash: 1.2, blush: '#eeb3ae', brows: ink, arch: 0.08, mole: true });
          // round silver glasses
          for (const s of [-1, 1]) {
            k.add(GEO.torus, silver, s * 0.098, 0.205, 0.292, 0.06, 0.06, 0.1);
            k.beam([s * 0.158, 0.21, 0.285], [s * 0.255, 0.215, 0.17], 0.008, silver, 0.008);
          }
          k.put(new THREE.TorusGeometry(0.038, 0.006, 4, 8, Math.PI), silver, M4(0, 0.2, 0.296, 1));
          // long loose waves, parted in the middle: a cap with the part, sweeps over her temples, a full back, wavy locks over
          // her shoulders and down her back
          crown(k, ink, 0.36); shell(k, ink);
          for (const s of [-1, 1]) k.add(GEO.sph, ink, s * 0.15, 0.375, 0.155, 0.16, 0.058, 0.05, 0.35, 0, -s * 0.6);
          k.add(GEO.sph, ink, 0, -0.1, -0.17, 0.3, 0.44, 0.13);
          for (const s of [-1, 1]) k.add(GEO.sph, ink, s * 0.26, -0.02, -0.06, 0.1, 0.28, 0.14);
          const wave = (p0, p1, p2, amp, ph, r0, r1) => {
            const pts = [];
            for (let i = 0; i <= 8; i++) {
              const t = i / 8, u = 1 - t, w = Math.sin(t * 8.5 + ph) * amp * Math.min(1, t * 3);
              pts.push([0, 1, 2].map(c => u * u * p0[c] + 2 * u * t * p1[c] + t * t * p2[c] + (c === 0 ? w : 0)));
            }
            k.put(tube(pts, r0, r1, 32, 8, 0.65), ink);
          };
          for (const s of [-1, 1]) {
            wave([s * 0.24, 0.22, 0.08], [s * 0.27, -0.05, 0.13], [s * 0.2, -0.38, 0.25], 0.02 * s, 0, 0.06, 0.03);
            wave([s * 0.27, 0.2, 0.0], [s * 0.33, -0.05, 0.03], [s * 0.3, -0.42, 0.12], 0.025 * s, 1.5, 0.065, 0.035);
          }
          for (let i = 0; i < 5; i++) { const x = (i - 2) * 0.11; wave([x * 0.9, 0.15, -0.26], [x * 1.1, -0.2, -0.31], [x * 1.2, -0.56, -0.28], 0.025, i * 1.7, 0.07, 0.04); }
        },
        lips: '#7a1f3a', lipSize: [0.036, 0.016], book: '#3a1a2a',
      },
      // 4. the witch: a sharp face with a pointed chin, narrow green cat eyes in a long black wing, high arched brows, a long
      //    nose, black-cherry lips; very long straight hair with one silver-white streak, under a tall witch's hat with its tip
      //    bent back, a plum band and a moon buckle; a short black dress with a pointed hem, a long cape lined in plum, bell
      //    sleeves, striped stockings, pointed buckled boots
      witch: {
        body: { scale: 0.98 },
        eyes: { x: 0.096, y: 0.208, z: 0.256, sx: 0.037, sy: 0.03 }, eyeColor: '#2e6a4a', headScale: [0.96, 1.02, 0.98],
        leg(k) {
          k.add(GEO.cyl, '#211b29', 0, -0.13, 0, 0.066, 0.28, 0.066);
          for (const y of [-0.04, -0.08, -0.12, -0.16, -0.2]) k.add(GEO.cyl, '#8b3f7c', 0, y, 0, 0.069, 0.018, 0.069);     // striped stockings
          k.add(GEO.cyl, '#141118', 0, -0.275, 0, 0.074, 0.12, 0.074);
          k.put(new THREE.ConeGeometry(0.07, 0.25, 10), '#141118', M4(0, -0.333, 0.115, 1, 1, 0.45, 0, HALF - 0.25, 0));
          k.add(GEO.cyl, '#2a2630', 0, -0.245, 0, 0.077, 0.022, 0.077).add(GEO.box, silver, 0, -0.245, 0.077, 0.03, 0.028, 0.01);
        },
        torso(k) {
          const blk = '#1d1822', plum = '#6e2f63';
          k.put(lath(prof), blk);
          // a short dress with a pointed hem, a plum sash
          k.put(lath([[0.37, 0.25], [0.35, 0.29], [0.29, 0.41], [0.235, 0.53]], 18), blk);
          for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + 0.35; k.add(GEO.cone4, blk, Math.sin(a) * 0.352, 0.2, Math.cos(a) * 0.352, 0.065, 0.12, 0.02, Math.PI, a, 0); }
          k.add(GEO.cyl, plum, 0, 0.53, 0, 0.236, 0.05, 0.236);
          // the long cape behind her, lined in plum, tied at her throat with a plum cord and a silver moon clasp
          const capeP = [[0.43, 0.08], [0.39, 0.3], [0.33, 0.55], [0.3, 0.72], [0.275, 0.83], [0.19, 0.91]];
          k.put(lath(capeP, 18, HALF + 0.22, Math.PI - 0.44), blk);
          k.put(lath(capeP.slice().reverse().map(([r, y]) => [r - 0.012, y]), 18, HALF + 0.22, Math.PI - 0.44), plum);      // (top to bottom: it faces in)
          for (const s of [-1, 1]) { k.beam([s * 0.24, 0.875, -0.04], [s * 0.1, 0.86, 0.19], 0.018, plum, 0.018); k.beam([s * 0.1, 0.86, 0.19], [0, 0.845, 0.225], 0.018, plum, 0.018); }
          k.put(new THREE.TorusGeometry(0.03, 0.009, 4, 10, Math.PI * 1.3), silver, M4(0, 0.84, 0.237, 1, 1, 1, 0, 0, -0.9));
        },
        arm(k) {
          const blk = '#1d1822';
          k.add(GEO.cyl, blk, 0, -0.14, 0, 0.064, 0.28, 0.064);
          k.put(new THREE.CylinderGeometry(0.066, 0.135, 0.15, 12, 1, true), blk, M4(0, -0.31, 0, 1));     // a bell sleeve,
          k.add(GEO.torus, '#6e2f63', 0, -0.385, 0, 0.135, 0.135, 0.12, HALF, 0, 0);                         // trimmed in plum
          hand(k, SK.witch[0], 0.06);
        },
        head(k) {
          const S = SK.witch, hat = '#16121a', streak = '#dcd8e4';
          face(k, { skin: S[0], skinD: S[1], shadow: '#2a2230', smoky: 1.4, lash: 2.0, brows: ink, arch: 0.3, nose: 'point', chin: true, blush: false });
          // very long straight hair from a side part, down past her hips; one silver-white streak at the front
          shell(k, ink); crown(k, ink, 0.4);
          k.add(GEO.sph, ink, -0.06, 0.38, 0.165, 0.2, 0.07, 0.085, 0.4, 0, 0.25);
          k.add(GEO.sph, ink, 0, -0.16, -0.23, 0.27, 0.5, 0.11);
          k.add(GEO.sph, ink, 0.235, -0.16, 0.1, 0.07, 0.5, 0.08, 0, 0, 0.04);
          k.add(GEO.sph, streak, -0.235, -0.16, 0.1, 0.07, 0.5, 0.08, 0, 0, -0.04);
          k.beam([-0.12, 0.43, 0.18], [-0.235, 0.3, 0.12], 0.05, streak, 0.03);
          // the witch's hat: a wide brim, a tall crown with its tip bent back, a plum band, a silver moon buckle
          k.add(GEO.cyl, hat, 0, 0.44, -0.01, 0.52, 0.018, 0.52, -0.08, 0, 0.05);
          k.put(new THREE.CylinderGeometry(0.075, 0.255, 0.36, 16, 1, true), hat, M4(0, 0.62, -0.03, 1, 1, 1, 0, -0.08, 0.05));
          k.put(new THREE.ConeGeometry(0.075, 0.26, 12), hat, M4(0.01, 0.875, -0.148, 1, 1, 1, 0, -0.93, 0.05));
          k.add(GEO.cyl, '#6e2f63', 0, 0.475, -0.013, 0.25, 0.05, 0.25, -0.08, 0, 0.05);
          k.put(new THREE.TorusGeometry(0.035, 0.011, 4, 10, Math.PI * 1.3), silver, M4(0, 0.478, 0.252, 1, 1, 1, 0, 0, 2.3));
        },
        lips: '#3a1028', lipSize: [0.03, 0.012], book: '#2a2330',
      },
      // 5. the veil (the user's pick). The first, athletic pixie version is in prototypes/morgana-veil-pixie.js. After "she kinda
      //    looks like a femboy", "dont add a nose like change her physique" and "make her as dramatically feminine as dante is
      //    dramatically masculine to polarize them" she is the opposite of his V: a dramatic hourglass (a tiny corseted waist
      //    between round hips and her bust, narrow sloping shoulders, slim long arms, a long swan neck, a smaller head), no nose,
      //    big eyes with long lashes, thin arched brows, blush, full red lips, pearl drop earrings; long glossy hair from a side
      //    part, the fringe swept across her forehead, tucked behind her left ear and falling over her right shoulder, the ends
      //    curled; a little black hat tipped over her left side with a net veil over her eyes, a plum rose and a black feather; a
      //    black gown with a sweetheart neckline under sheer black lace up to her throat, a black satin corset laced in plum with a
      //    plum bow at her waist, the skirt round over her hips and narrow at the knee, then a dramatic trumpet flare in two
      //    ruffles; long gloves, a pearl choker with a silver moon. Her arms hang out from her hips (`splay`).
      veil: {
        // (a long torso: her waist, bust and shoulders sit high, so only a short neck shows under her head; shoulderY moves
        // her arms up with it, and handY is where her longer arms end)
        body: { scale: 0.97, hipX: 0.085, shoulder: 0.2, shoulderY: 0.91, neck: 1.05 },           // (a head shorter than Dante)
        eyes: { x: 0.096, y: 0.2, z: 0.257, sx: 0.041, sy: 0.052 }, headScale: [0.92, 0.93, 0.92], topAdd: 0.05, splay: 0.25, handY: -0.43,
        // her shoulders and neck: flat-ish shoulders sloping into a short slender neck
        up: [[0.196, 0.782], [0.2, 0.84], [0.193, 0.88], [0.165, 0.912], [0.115, 0.934], [0.078, 0.952], [0.062, 0.97], [0.057, 1.0], [0.056, 1.04], [0, 1.05]],
        leg(k) { k.add(GEO.cyl, '#1a161f', 0, -0.13, 0, 0.058, 0.28, 0.058); boots(k, '#121015', 0.062); },
        torso(k) {
          const blk = '#19151d', sat = '#110e14', lace = '#2f2636', plum = '#6e2f63';
          // her figure, black to her bust; above it her shoulders and neck, under sheer black lace (the lace is in post())
          k.put(lath([[0, 0.3], [0.24, 0.31], [0.3, 0.39], [0.28, 0.45], [0.215, 0.53], [0.132, 0.6], [0.15, 0.66], [0.19, 0.72], [0.2, 0.77], [0.195, 0.792], [0, 0.796]]), blk);
          k.put(lath(LOOKS.veil.up), SK.veil[0]);
          for (const s of [-1, 1]) k.add(GEO.sph, blk, s * 0.06, 0.75, 0.1, 0.12, 0.095, 0.13);         // the bodice over her bust: a sweetheart neckline
          // the corset: cinched to a tiny waist, laced up the front in plum, a plum bow at the cinch
          const cor = [[0.297, 0.44], [0.223, 0.53], [0.14, 0.6], [0.158, 0.66], [0.199, 0.725]];
          k.put(lath(cor, 20), sat);
          for (const y of [0.48, 0.53, 0.645, 0.69]) { const z = rAt(cor, y) + 0.004; for (const s of [-1, 1]) k.add(GEO.box, plum, 0, y, z, 0.045, 0.007, 0.007, 0, 0, s * 0.62); }
          for (const s of [-1, 1]) { k.add(GEO.sphS, plum, s * 0.036, 0.603, 0.152, 0.04, 0.025, 0.016, 0, 0, -s * 0.3); k.beam([s * 0.01, 0.595, 0.155], [s * 0.03, 0.52, 0.238], 0.02, plum, 0.008); }
          k.add(GEO.sphS, plum, 0, 0.6, 0.158, 0.015);
          // the skirt: round over her hips, narrow at the knee, then a dramatic trumpet flare in two ruffles, lace at their hems
          k.put(lath([[0.48, 0.03], [0.46, 0.06], [0.34, 0.13], [0.245, 0.2], [0.25, 0.27], [0.295, 0.35], [0.31, 0.4], [0.292, 0.445]], 24), blk);
          k.put(lath([[0.385, 0.12], [0.37, 0.14], [0.285, 0.2], [0.255, 0.24]], 24), blk);
          for (const [r, y, n] of [[0.478, 0.025, 26], [0.383, 0.115, 20]]) for (let i = 0; i < n; i++) { const a = i * TAU / n; k.add(GEO.sphS, lace, Math.sin(a) * r, y, Math.cos(a) * r, 0.042, 0.027, 0.014, 0, a, 0); }
          // a string of pearls lying on her collarbones in a V (her neck stays bare), a silver moon at its point
          const up = LOOKS.veil.up;
          for (let i = 0; i <= 12; i++) { const t = i / 6 - 1, x = 0.1 * t, y = 0.855 + 0.07 * t * t, r = rAt(up, y) + 0.011; k.add(GEO.sphS, '#ece6dc', x, y, Math.sqrt(Math.max(0, r * r - x * x)), 0.011); }
          k.put(new THREE.TorusGeometry(0.022, 0.007, 4, 10, Math.PI * 1.3), silver, M4(0, 0.842, rAt(up, 0.842) + 0.022, 1, 1, 1, 0, 0, -0.9));
        },
        arm(k) {
          k.add(GEO.sph, '#2f2636', 0, -0.022, 0, 0.056, 0.054, 0.056);                             // a little lace puff sleeve,
          k.add(GEO.cyl, SK.veil[0], 0, -0.085, 0, 0.04, 0.09, 0.04);                                // her bare upper arm,
          k.add(GEO.cyl, '#121015', 0, -0.275, 0, 0.042, 0.3, 0.042);                                // a long black glove,
          k.add(GEO.torus, '#2f2636', 0, -0.128, 0, 0.045, 0.045, 0.15, HALF, 0, 0);
          k.add(GEO.sphS, '#121015', 0, -0.43, 0.005, 0.044, 0.05, 0.04);                           // a slender hand
        },
        head(k) {
          const S = SK.veil;
          face(k, { skin: S[0], skinD: S[1], shadow: '#4a2848', smoky: 1.2, lash: 2.2, flicks: 3, brows: ink, browT: 0.009, arch: 0.22, blush: '#eeb0b8', nose: 'none' });
          // long glossy hair from a side part: the fringe swept across her forehead to her right temple, a full back past her
          // shoulder blades, tucked behind her left ear, a long lock falling over her right shoulder; the ends curl
          crown(k, ink, 0.4); shell(k, ink);
          k.add(GEO.sph, ink, -0.05, 0.385, 0.172, 0.215, 0.075, 0.075, 0.45, 0, 0.32);
          k.add(GEO.cone4, ink, -0.222, 0.3, 0.15, 0.042, 0.1, 0.02, 0, 0.6, 2.55);
          // down her back: five wavy locks over a fill, each curling at its end, a glossy line down each
          k.add(GEO.sph, ink, 0, -0.06, -0.17, 0.25, 0.38, 0.11);
          for (let i = 0; i < 5; i++) {
            const x = (i - 2) * 0.095, pts = [[x, 0.32, 0.02 - Math.sqrt(Math.max(0, 0.084 - x * x - 0.011))]];        // (from the crown: no seam)
            for (let j = 1; j <= 7; j++) { const t = j / 7; pts.push([x * (1 + 0.15 * t) + Math.sin(t * 7 + i * 1.3) * 0.022 * t, 0.32 - t * 0.86, -0.265 - 0.025 * Math.sin(t * Math.PI) - Math.abs(i - 2) * 0.012]); }
            k.put(tube(pts, 0.065, 0.04, 28, 8, 0.6), ink);
            const e = pts[7]; k.add(GEO.sphS, ink, e[0], e[1] - 0.02, e[2] + 0.01, 0.048);
            plain.put(tube(pts.slice(0, 6).map(p => [p[0] + 0.012, p[1], p[2] - 0.036]), 0.008, 0.005, 16, 5), '#4a4054');
          }
          k.add(GEO.sph, ink, 0.255, -0.04, -0.11, 0.075, 0.3, 0.12);                                                             // behind her left ear
          k.put(tube([[-0.24, 0.26, 0.04], [-0.29, 0.06, 0.085], [-0.255, -0.1, 0.15], [-0.235, -0.25, 0.2], [-0.2, -0.37, 0.228]], 0.072, 0.048, 28, 10, 0.7), ink);
          [[-0.2, -0.41, 0.24, 0.046], [-0.228, -0.44, 0.215, 0.04], [-0.19, -0.465, 0.21, 0.034]].forEach(([x, y, z, r]) => k.add(GEO.sphS, ink, x, y, z, r));
          plain.put(tube([[-0.25, 0.2, 0.09], [-0.29, 0.0, 0.137], [-0.255, -0.18, 0.21]], 0.011, 0.007, 16, 6), '#4a4054');       // a glossy highlight on it
          // pearl drop earrings
          for (const s of [-1, 1]) k.add(GEO.sphS, silver, s * 0.29, 0.13, 0.0, 0.009).add(GEO.box, silver, s * 0.291, 0.105, 0.0, 0.004, 0.04, 0.004).add(GEO.sphS, '#ece6dc', s * 0.292, 0.075, 0.003, 0.021);
          // the little hat tipped over her left side, a plum rose, a black feather
          k.add(GEO.cyl, '#121015', 0.13, 0.47, 0.03, 0.095, 0.055, 0.095, 0.2, 0, -0.4);
          k.add(GEO.cyl, '#121015', 0.133, 0.45, 0.034, 0.128, 0.012, 0.128, 0.2, 0, -0.4);
          k.add(GEO.sphS, '#6e2f63', 0.21, 0.45, 0.12, 0.042).add(GEO.sphS, '#8a3f7c', 0.215, 0.455, 0.155, 0.022);
          k.beam([0.13, 0.5, -0.02], [0.08, 0.57, -0.24], 0.045, '#121015', 0.012, GEO.cone4);
        },
        post(F) {        // the see-through pieces: the net veil from the hat's brim down over her eyes; sheer lace over her shoulders and neck
          const net = (w, flowers) => {       // (the lace also tints what's under it, like sheer black fabric)
            const t = textTex(64, 64, c => {
              c.clearRect(0, 0, 64, 64); if (flowers) { c.fillStyle = 'rgba(24,19,30,0.4)'; c.fillRect(0, 0, 64, 64); } c.strokeStyle = 'rgba(20,16,24,0.92)'; c.lineWidth = w; c.beginPath(); c.moveTo(0, 0); c.lineTo(64, 64); c.moveTo(64, 0); c.lineTo(0, 64); c.stroke();
              if (flowers) { c.fillStyle = 'rgba(20,16,24,0.92)'; for (const [x, y] of [[32, 0], [0, 32], [64, 32], [32, 64], [32, 32]]) { c.beginPath(); c.arc(x, y, x === 32 && y === 32 ? 6 : 4, 0, TAU); c.fill(); } }
            });
            t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
          };
          const tv = net(3, false); tv.repeat.set(12, 5);
          const m = new THREE.Mesh(new THREE.SphereGeometry(0.315, 20, 5, HALF - 0.95, 1.9, Math.PI * 0.27, Math.PI * 0.29),
            new THREE.MeshBasicMaterial({ map: tv, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
          m.position.set(0, 0.21, 0); m.rotation.z = -0.12; m.renderOrder = 2; F.head.add(m);
          const tl = net(2.5, true); tl.repeat.set(22, 4);
          const lace = new THREE.Mesh(new THREE.LatheGeometry(LOOKS.veil.up.filter(([, y]) => y <= 0.952).map(([r, y]) => new THREE.Vector2(r + 0.005, y)), 24),
            new THREE.MeshBasicMaterial({ map: tl, transparent: true, depthWrite: false }));
          lace.renderOrder = 1; F.body.add(lace);
        },
        lips: '#7a0a24', lipSize: [0.036, 0.017], book: '#19151d',
      },
      // 6. long and lean, a dandy: a heart-shaped face, sleepy grey eyes, straight brows, a small dark mouth; short tousled curls
      //    like a romantic poet's; a plum velvet tailcoat with lace cuffs, a black waistcoat with silver buttons and a watch chain
      //    with a moon fob, a black cravat over a white collar, a black ruffled mini, her striped tights, tall boots
      dandy: {
        body: { scale: 1.03, hipX: 0.085, shoulder: 0.25, neck: 0.98 },
        eyes: { x: 0.094, y: 0.2, z: 0.256, sx: 0.035, sy: 0.042 }, eyeColor: '#3e4856', headScale: [0.95, 1.03, 0.97],
        leg(k) {
          k.add(GEO.cyl, '#211b29', 0, -0.13, 0, 0.064, 0.28, 0.064);
          for (const y of [-0.03, -0.075, -0.12]) k.add(GEO.cyl, '#8b3f7c', 0, y, 0, 0.067, 0.022, 0.067);      // her striped tights
          k.add(GEO.cyl, '#0f0d12', 0, -0.255, 0, 0.072, 0.18, 0.072).add(GEO.sphS, '#0f0d12', 0, -0.335, 0.045, 0.077, 0.055, 0.13);
          k.add(GEO.cyl, '#2a2630', 0, -0.17, 0, 0.076, 0.03, 0.076);
        },
        torso(k) {
          const blk = '#17141b', plum = '#5a2050', plumD = '#3e1638', white = '#f3eee6', z = y => rAt(PROF.lanky, y);
          k.put(lath(PROF.lanky), blk);                                                           // the waistcoat
          // a black ruffled mini in two tiers, lace at the hems
          k.put(lath([[0.33, 0.28], [0.315, 0.31], [0.26, 0.42], [0.2, 0.51]], 18), blk);
          k.put(lath([[0.3, 0.36], [0.285, 0.39], [0.24, 0.46], [0.2, 0.51]], 18), '#221c28');
          for (const [r, y] of [[0.33, 0.275], [0.3, 0.355]]) for (let i = 0; i < 16; i++) { const a = i * TAU / 16; k.add(GEO.sphS, '#3d3546', Math.sin(a) * r, y, Math.cos(a) * r, 0.034, 0.022, 0.012, 0, a, 0); }
          for (let i = 0; i < 4; i++) { const y = 0.5 + i * 0.065; k.add(GEO.sphS, silver, 0, y, z(y) + 0.004, 0.012); }
          // a watch chain from a button, a moon fob
          const on = (x, y) => [x, y, Math.sqrt(Math.max(0, z(y) ** 2 - x * x)) + 0.006];
          k.beam(on(0, 0.565), on(0.05, 0.535), 0.006, silver, 0.006).beam(on(0.05, 0.535), on(0.078, 0.515), 0.006, silver, 0.006);
          k.put(new THREE.TorusGeometry(0.02, 0.007, 4, 10, Math.PI * 1.3), silver, M4(0.08, 0.49, 0.18, 1, 1, 1, 0.3, 0, -0.9));
          // a white collar, a black cravat with a silver pin
          for (const s of [-1, 1]) k.add(GEO.cone4, white, s * 0.07, 0.9, 0.125, 0.045, 0.08, 0.015, -0.3, 0, Math.PI + s * 0.5);
          k.add(GEO.sphS, '#211b29', 0, 0.885, 0.15, 0.05, 0.035, 0.03).add(GEO.sphS, '#211b29', 0, 0.83, 0.172, 0.045, 0.07, 0.025);
          k.add(GEO.sphS, silver, 0, 0.845, 0.197, 0.011);
          // the plum velvet tailcoat: open in front, lapels, tails behind to her knees
          k.put(lath([[0.198, 0.5], [0.2, 0.56], [0.222, 0.66], [0.222, 0.78], [0.168, 0.88], [0.115, 0.93]], 18, 0.5, TAU - 1.0), plum);
          k.put(lath([[0.235, 0.14], [0.218, 0.3], [0.205, 0.45], [0.2, 0.52]], 12, Math.PI - 0.55, 1.1), plum);
          for (const s of [-1, 1]) k.beam([s * 0.105, 0.6, 0.2], [s * 0.085, 0.86, 0.15], 0.06, plumD, 0.022);
        },
        arm(k) {
          k.add(GEO.sph, '#5a2050', 0, -0.02, 0, 0.075, 0.07, 0.075);
          k.add(GEO.cyl, '#5a2050', 0, -0.15, 0, 0.064, 0.28, 0.064).add(GEO.cyl, '#3e1638', 0, -0.275, 0, 0.068, 0.04, 0.068);
          k.put(new THREE.CylinderGeometry(0.06, 0.086, 0.06, 12, 1, true), '#f3eee6', M4(0, -0.315, 0, 1));      // lace cuffs
          hand(k, SK.dandy[0], 0.058);
        },
        head(k) {
          const S = SK.dandy;
          face(k, { skin: S[0], skinD: S[1], lids: '#4a3a4e', shadow: '#5a3a5a', lash: 1.2, brows: ink, arch: 0.04, nose: 'point', blush: '#efc0c0' });
          // tousled curls: over the top, round the sides and back (her face and cheeks left open), a few on her forehead from a
          // side part
          crown(k, ink, 0.42);
          const C = (a, b, r) => k.add(GEO.sphS, ink, 0.288 * Math.sin(a) * Math.sin(b), 0.22 + 0.288 * Math.cos(a), 0.288 * Math.sin(a) * Math.cos(b) - 0.01, r, r * 0.92, r);
          C(0, 0, 0.085);
          for (const [a, n] of [[0.28, 6], [0.52, 9], [0.78, 12], [1.04, 14], [1.3, 14], [1.56, 13], [1.82, 11], [2.08, 9], [2.3, 6]])
            for (let i = 0; i < n; i++) { const b = (i + (n % 2) * 0.5) * TAU / n; if (a > 0.75 && Math.abs(Math.atan2(Math.sin(b), Math.cos(b))) < (a > 1.7 ? 1.45 : 0.95)) continue; C(a, b, 0.068 - a * 0.007); }
          [[-0.14, 0.4, 0.18, 0.055], [-0.06, 0.42, 0.2, 0.055], [0.03, 0.43, 0.2, 0.05], [-0.18, 0.34, 0.19, 0.048], [-0.2, 0.28, 0.17, 0.042]].forEach(([x, y, zz, r]) => k.add(GEO.sphS, ink, x, y, zz, r));
          moon(k);
        },
        lips: '#5a2048', lipSize: [0.026, 0.01], book: '#5a2050',
      },
    };
    const L = LOOKS[style] || LOOKS.base, B = L.body || {};
    const E = Object.assign({ x: 0.095, y: 0.205, z: 0.255, sx: 0.034, sy: 0.047 }, L.eyes || {});
    curE = E;
    const F = figure({
      hipX: B.hipX || 0.09, shoulder: B.shoulder || 0.245, shoulderY: B.shoulderY || 0.84, neck: B.neck || 0.965, eyes: E,
      leg: (k, s) => L.leg(k, s), torso: k => L.torso(k), arm: (k, s) => L.arm(k, s), head: k => L.head(k),
      mouth(head) {
        const ls = L.lipSize || [0.032, 0.011], m = new THREE.Mesh(GEO.sphS, new THREE.MeshBasicMaterial({ color: L.lips }));
        m.scale.set(ls[0], ls[1], 0.008); m.position.set(0, 0.105, 0.258); head.add(m);
        return m;
      },
    });
    curE = null;
    // her proportions: the head's shape, the colour of her eyes, her height
    if (L.headScale) F.head.scale.set(L.headScale[0], L.headScale[1], L.headScale[2]);
    if (L.eyeColor) { const em = new THREE.MeshBasicMaterial({ color: L.eyeColor }); F.eyes.forEach(e => { e.children[0].material = em; }); }
    if (B.scale) F.root.scale.setScalar(B.scale);
    if (plain.P.length) F.head.add(inked(plain.P, 0));
    if (L.post) L.post(F);                // (pieces that aren't inked toon: the veil's net)
    // the notebook in her left hand (a prop: moves to her lap when she sits and writes), and her quill
    const nb = inked(Kit().add(GEO.box, L.book, 0, 0, 0, 0.17, 0.23, 0.035).add(GEO.box, '#f6efe4', 0.006, 0, 0.0, 0.16, 0.215, 0.04).add(GEO.box, silver, -0.04, 0.05, 0.019, 0.04, 0.04, 0.004).P, 0.01);
    const hy = L.handY || -0.33;           // (where the look's hands are, down its arms)
    nb.position.set(0, hy - 0.04, 0.07); nb.rotation.set(-0.3, 0, 0); F.arms[1].add(nb); F.props.notebook = nb;
    const quill = inked(Kit().add(GEO.cyl6, '#fdf8ee', 0, 0, 0, 0.012, 0.2, 0.012).add(GEO.cone6, '#e6dccd', 0.0, 0.07, 0, 0.03, 0.14, 0.01).P, 0.006);
    quill.position.set(0, hy - 0.03, 0.06); quill.rotation.set(1.0, 0, 0); quill.visible = false; F.arms[0].add(quill); F.props.quill = quill;
    F.h = 1.56 * (B.scale || 1); F.style = style;
    F.topAdd = L.topAdd || 0;             // (her speech bubble sits this much higher: a taller look)
    F.splay = L.splay || 0;               // (her hanging arms angle out this much more: wide hips)
    return F;
  }
  // Poe: a black cat with yellow eyes (a body and head in one mesh; legs and the tail move)
  function makePoe() {
    const fur = '#2d2934', furL = '#3a3442', root = new THREE.Group(), body = new THREE.Group(); root.add(body);
    const k = Kit();
    k.add(GEO.sph, fur, 0, 0.21, 0, 0.13, 0.13, 0.24);
    k.add(GEO.sph, furL, 0, 0.18, 0.12, 0.09, 0.1, 0.1);                                  // chest
    const hk = Kit();
    hk.add(GEO.sph, fur, 0, 0, 0, 0.125, 0.112, 0.112);
    hk.add(GEO.sphS, fur, 0, -0.03, 0.08, 0.06, 0.045, 0.05);                              // muzzle
    for (const s of [-1, 1]) {
      hk.add(GEO.cone6, fur, s * 0.066, 0.105, -0.005, 0.048, 0.1, 0.035, 0, 0, -s * 0.28);
      hk.add(GEO.cone6, '#c98a9a', s * 0.064, 0.1, 0.012, 0.028, 0.065, 0.01, 0, 0, -s * 0.28);
      hk.add(GEO.sphS, '#f4d03f', s * 0.05, 0.018, 0.093, 0.032, 0.034, 0.02);
      hk.add(GEO.box, '#111016', s * 0.05, 0.018, 0.112, 0.009, 0.043, 0.006);
      for (const w of [-1, 1]) hk.add(GEO.box, '#d9d4e2', s * 0.1, -0.035 + w * 0.012, 0.085, 0.09, 0.004, 0.004, 0, 0, w * s * 0.12);
    }
    hk.add(GEO.sphS, '#d98a9a', 0, -0.01, 0.123, 0.014, 0.01, 0.008);
    const torso = inked(k.P, 0.01); body.add(torso);
    const head = new THREE.Group(); head.position.set(0, 0.34, 0.21); body.add(head); head.add(inked(hk.P, 0.009));
    const legs = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => {
      const g = new THREE.Group(); g.position.set(sx * 0.068, 0.17, sz * 0.14); body.add(g);
      g.add(inked(Kit().add(GEO.cyl8, fur, 0, -0.085, 0, 0.032, 0.17, 0.032).add(GEO.sphS, fur, 0, -0.165, 0.01, 0.036, 0.022, 0.045).P, 0.008));
      return g;
    });
    const tail = []; let prev = body;
    for (let i = 0; i < 4; i++) {
      const g = new THREE.Group(); g.position.set(0, i ? 0.1 : 0.24, i ? 0 : -0.22); prev.add(g);
      g.add(inked(Kit().add(GEO.cyl8, fur, 0, 0.05, 0, 0.028 - i * 0.003, 0.11, 0.028 - i * 0.003).P, 0.007));
      tail.push(g); prev = g;
    }
    root.traverse(o => { if (o.isMesh && !o.material.isMeshBasicMaterial) o.castShadow = true; });
    return { root, body, head, legs, tail, torso };
  }
  // ---------------- textures
  // one of Morgana's pages: cream paper, plum handwriting, the last line gone gray (the Hush), a crescent moon, a black pin
  function paperTex(seed, ribbon = true) {
    return textTex(128, 168, (c, W, H) => {
      const R = rng(seed);
      c.fillStyle = '#f6efe4'; c.beginPath(); c.moveTo(5, 7);
      for (let x = 5; x <= W - 5; x += 9) c.lineTo(x, 4 + R() * 4);
      for (let y = 8; y <= H - 8; y += 12) c.lineTo(W - 4 - R() * 3, y);
      for (let x = W - 5; x >= 5; x -= 9) c.lineTo(x, H - 4 - R() * 5);
      c.closePath(); c.fill(); c.strokeStyle = 'rgba(43,34,53,0.3)'; c.lineWidth = 2; c.stroke();
      for (let i = 0; i < 5; i++) {
        const y = 44 + i * 22, gray = i === 4;
        c.strokeStyle = gray ? 'rgba(150,145,160,0.55)' : '#5a2f55'; c.lineWidth = 2.5; c.beginPath();
        let x = 16; c.moveTo(x, y);
        const end = W - 20 - (i % 2) * 22 - (gray ? 20 : 0);
        while (x < end) { x += 6 + R() * 6; c.quadraticCurveTo(x - 4, y - 6 - R() * 5, x, y + (R() - 0.5) * 3); }
        c.stroke();
      }
      c.fillStyle = '#6e2f63'; c.beginPath(); c.arc(W - 24, 22, 9, 0, TAU); c.fill(); c.fillStyle = '#f6efe4'; c.beginPath(); c.arc(W - 20, 19, 8, 0, TAU); c.fill();
      if (ribbon) { c.fillStyle = '#6e2f63'; c.beginPath(); c.moveTo(0, 22); c.lineTo(22, 0); c.lineTo(36, 0); c.lineTo(0, 36); c.closePath(); c.fill(); }
      c.fillStyle = '#2b2235'; c.beginPath(); c.arc(W / 2, 13, 5, 0, TAU); c.fill(); c.fillStyle = '#9a95a3'; c.beginPath(); c.arc(W / 2 - 1.5, 11.5, 1.6, 0, TAU); c.fill();
    });
  }
  // wooden planks (the attic's floor), dark plum plaster with a faint damask (its walls), the night through the round window
  const planks = () => { const t = textTex(128, 128, (c, W, H) => { const R = rng(9); for (let i = 0; i < 4; i++) { c.fillStyle = ['#5b4130', '#664936', '#523a2b', '#614532'][i]; c.fillRect(0, i * 32, W, 32); c.fillStyle = 'rgba(30,18,12,0.5)'; c.fillRect(0, i * 32, W, 2); const j = (R() * W) | 0; c.fillRect(j, i * 32, 2, 32); for (let k = 0; k < 5; k++) { c.fillStyle = 'rgba(40,24,16,0.18)'; c.fillRect(R() * W, i * 32 + 6 + R() * 20, 18 + R() * 30, 1.5); } } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const plaster = () => { const t = textTex(128, 128, (c, W, H) => { c.fillStyle = '#4b3550'; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(150,110,150,0.18)'; c.lineWidth = 2; for (let y = 16; y < H; y += 32) for (let x = (y / 32) % 2 ? 0 : 16; x < W + 16; x += 32) { c.beginPath(); c.moveTo(x, y - 9); c.quadraticCurveTo(x + 8, y, x, y + 9); c.quadraticCurveTo(x - 8, y, x, y - 9); c.stroke(); } }); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; };
  const nightTex = () => textTex(128, 128, (c, W, H) => {
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1b1d46'); g.addColorStop(0.7, '#4a3a78'); g.addColorStop(1, '#7a5a8a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = rng(4); c.fillStyle = '#fffbe8'; for (let i = 0; i < 26; i++) { c.globalAlpha = 0.4 + R() * 0.6; c.fillRect(R() * W, R() * H * 0.7, 1.6, 1.6); } c.globalAlpha = 1;
    c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(84, 34, 13, 0, TAU); c.fill(); c.fillStyle = '#28285a'; c.beginPath(); c.arc(90, 30, 12, 0, TAU); c.fill();
    c.fillStyle = '#16142a'; for (const [x, h] of [[18, 46], [34, 34], [100, 40], [116, 52]]) { c.beginPath(); c.moveTo(x - 7, H); c.quadraticCurveTo(x - 6, H - h * 0.6, x, H - h); c.quadraticCurveTo(x + 6, H - h * 0.6, x + 7, H); c.fill(); }
    c.fillRect(0, H - 10, W, 10);
  });

  // ---------------- the forge (one merged mesh, its glowing coals, and the cracked bell, which swings)
  function buildForge(parent) {
    const k = Kit(), H = FORGE.hearth, A = FORGE.anvil, B = FORGE.bell, brick = '#9c5039', brickD = '#7f3e2d', iron = '#4d4b57', wood = '#8a5f3e', woodD = '#6b4a2e';
    // the hearth against the tower's west wall: bricks, a stone slab, the coal bed; the hood and its pipe up the wall
    k.frame(H.x, GY, H.z, 0);
    k.box(0, 0.42, 0, 1.2, 0.84, 1.6, brick);
    for (const y of [0.2, 0.42, 0.64]) { k.box(-0.601, y, 0, 0.01, 0.022, 1.6, '#d6c3b0'); k.box(0, y, 0.801, 1.2, 0.022, 0.01, '#d6c3b0'); }
    for (const [y, z] of [[0.31, -0.4], [0.31, 0.4], [0.53, 0], [0.53, -0.7], [0.53, 0.7], [0.75, -0.4], [0.75, 0.4]]) k.box(-0.601, y, z, 0.012, 0.2, 0.022, '#d6c3b0');
    k.box(-0.601, 0.26, 0, 0.02, 0.3, 0.55, '#2a2226');                                                // the ash door
    k.box(0, 0.87, 0, 1.3, 0.08, 1.7, '#8a8580').box(-0.05, 0.92, 0, 0.8, 0.04, 1.15, '#2a2226');
    k.put(new THREE.CylinderGeometry(0.2, 0.62, 0.6, 4, 1, true), iron, M4(0, 1.75, 0, 1, 1, 1, Math.PI / 4));
    k.add(GEO.cyl, iron, 0.28, 3.45, 0, 0.15, 3.0, 0.15).add(GEO.cyl, '#3a3844', 0.28, 4.98, 0, 0.19, 0.08, 0.19);
    k.box(0.53, 2.6, 0, 0.06, 0.06, 0.4, iron).box(0.53, 3.9, 0, 0.06, 0.06, 0.4, iron);                // brackets on the wall
    // a little lean-to roof over the hearth, bracketed to the tower
    k.box(-0.27, 2.78, 0, 1.9, 0.08, 2.4, '#7a5436', 0, 0, 0.24);
    for (const z of [-1.0, 1.0]) k.beam([0.6, 1.95, z], [-1.05, 2.58, z], 0.07, woodD);
    // the tool rack on the tower wall, south of the hearth: tongs and two hammers
    k.frame(-27.86, GY, -164.75, 0);
    k.box(0, 1.5, 0, 0.05, 0.12, 0.95, woodD);
    for (const z of [-0.32, 0.32]) k.add(GEO.cyl8, '#9a6a3e', -0.05, 1.22, z, 0.02, 0.5, 0.02).box(-0.05, 0.98, z, 0.06, 0.08, 0.16, iron);
    k.beam([-0.05, 1.46, -0.04], [-0.05, 0.95, -0.1], 0.02, iron).beam([-0.05, 1.46, 0.04], [-0.05, 0.95, 0.1], 0.02, iron);
    // the anvil on its stump
    k.frame(A.x, GY, A.z, 0);
    k.add(GEO.cyl, '#7a5436', 0, 0.21, 0, 0.3, 0.42, 0.3).add(GEO.cyl, '#c9a06a', 0, 0.425, 0, 0.27, 0.012, 0.27);
    k.box(0, 0.48, 0, 0.32, 0.1, 0.26, iron).box(0, 0.6, 0, 0.16, 0.14, 0.15, iron).box(0, 0.72, 0, 0.6, 0.12, 0.23, iron).box(0.04, 0.785, 0, 0.5, 0.01, 0.2, '#6c6a78');
    k.add(GEO.cone, iron, -0.42, 0.72, 0, 0.075, 0.28, 0.075, 0, 0, HALF);
    // the bell stand: two A-frames and a crossbar (the bell hangs from it: separate, it swings)
    k.frame(B.x, GY, B.z, 0);
    for (const z of [-0.78, 0.78]) { k.beam([-0.5, 0, z], [0, 2.1, z], 0.09, wood).beam([0.5, 0, z], [0, 2.1, z], 0.09, wood).box(0, 0.6, z, 0.75, 0.07, 0.07, woodD); }
    k.beam([0, 2.08, -0.9], [0, 2.08, 0.9], 0.11, woodD);
    // the quench barrel and the coal bucket
    k.frame(FORGE.barrel.x, GY, FORGE.barrel.z, 0);
    k.add(GEO.cyl, wood, 0, 0.31, 0, 0.3, 0.62, 0.3).add(GEO.cyl, iron, 0, 0.12, 0, 0.306, 0.04, 0.306).add(GEO.cyl, iron, 0, 0.5, 0, 0.306, 0.04, 0.306).add(GEO.cyl, '#5a8fb0', 0, 0.6, 0, 0.27, 0.02, 0.27);
    k.frame(FORGE.coal.x, GY, FORGE.coal.z, 0);
    k.add(GEO.cyl, iron, 0, 0.14, 0, 0.2, 0.28, 0.2);
    for (let i = 0; i < 6; i++) k.add(GEO.sphS, '#26222a', Math.cos(i) * 0.09, 0.3 + (i % 2) * 0.03, Math.sin(i * 1.7) * 0.09, 0.07, 0.05, 0.07);
    const stat = inked(k.P, 0.016, { receive: true }); parent.add(stat);
    // the coals, glowing
    const lit = Kit(); lit.frame(H.x - 0.05, GY, H.z, 0);
    const R = rng(31); for (let i = 0; i < 16; i++) lit.box((R() - 0.5) * 0.65, 0.95 + R() * 0.03, (R() - 0.5) * 1.0, 0.1 + R() * 0.08, 0.05, 0.1 + R() * 0.08, ['#ff7a2a', '#ffb347', '#e0503f', '#ffd84a'][i % 4], 0, R() * 3, 0);
    const coals = new THREE.Mesh(bake(lit.P), new THREE.MeshBasicMaterial({ vertexColors: true })); parent.add(coals);
    const glow = new THREE.Sprite(glowMat('#ff9a3a', 0.6)); glow.scale.setScalar(1.8); glow.position.set(H.x - 0.05, GY + 1.1, H.z); parent.add(glow);
    // the cracked bell: Alba's old voice. A crack runs up from the lip; a riveted patch where Dante's been working
    const bell = new THREE.Group(); bell.position.set(B.x, GY + 2.02, B.z); parent.add(bell);
    const bk = Kit();
    bk.put(lathe([[0.37, -0.74], [0.42, -0.75], [0.41, -0.71], [0.32, -0.6], [0.25, -0.44], [0.22, -0.24], [0.19, -0.08], [0.12, -0.01], [0, 0]], 16), '#c4943e');     // (bottom to top: normals out)
    bk.add(GEO.cyl8, '#8a6a2e', 0, 0.06, 0, 0.06, 0.12, 0.06).add(GEO.torus, '#5a4a32', 0, 0.12, 0, 0.07, 0.07, 0.1);
    [[0.0, -0.745, 0.4], [-0.035, -0.62, 0.33], [0.03, -0.5, 0.27], [-0.01, -0.36, 0.235], [0.02, -0.26, 0.222]].reduce((a, b) => { bk.beam(a, b, 0.02, '#2e2218', 0.012); return b; });
    bk.box(0.12, -0.5, 0.262, 0.1, 0.16, 0.012, '#8f8c96', 0, 0.42, 0);
    for (const [x, y] of [[0.08, -0.44], [0.16, -0.44], [0.08, -0.56], [0.16, -0.56]]) bk.add(GEO.sphS, '#5c5a66', x, y, 0.27, 0.012);
    bk.add(GEO.cyl8, '#5a4a32', 0, -0.35, 0, 0.012, 0.5, 0.012).add(GEO.sphS, '#6a5a3a', 0, -0.62, 0, 0.07);
    bell.add(inked(bk.P, 0.014));
    return { stat, coals, glow, bell };
  }
  // a poem pinned up: its paper, a soft plum glow while it's unread, and for the one at the fork, a crooked stake
  function buildPoem(parent, P, i) {
    const g = new THREE.Group(); parent.add(g);
    const p = P.paper;
    if (P.post) {
      const k = Kit(); k.frame(p.x, SQ_Y, p.z - 0.06, 0, 0, 0.04);
      k.box(0, 0.68, 0, 0.08, 1.36, 0.08, '#3a2f36').add(GEO.cone4, '#3a2f36', 0, 1.42, 0, 0.06, 0.14, 0.06);
      k.box(0, 1.33, 0.05, 0.2, 0.04, 0.02, '#6e2f63');
      g.add(inked(k.P, 0.01));
    }
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.58), new THREE.MeshToonMaterial({ map: paperTex(41 + i * 13), gradientMap: TK.grad, transparent: true, alphaTest: 0.3 }));
    sheet.position.set(p.x, p.y, p.z); sheet.rotation.set(0, p.yaw, (i % 2 ? 1 : -1) * 0.06); sheet.translateZ(0.012); g.add(sheet);
    const glow = new THREE.Sprite(glowMat('#c58ad6', 0.5)); glow.scale.setScalar(1.15); glow.position.set(p.x, p.y, p.z); glow.position.x += Math.sin(p.yaw) * 0.12; glow.position.z += Math.cos(p.yaw) * 0.12; g.add(glow);
    return { g, sheet, glow };
  }
  // the rope ladder Morgana lets down from the broken window upstairs (its origin at the top: it unrolls by scaling down)
  function buildLadder(parent) {
    const top = RUIN.upper.y - 0.6, len = top - RUIN_Y - 0.04;
    const k = Kit();
    for (const s of [-1, 1]) k.add(GEO.cyl6, '#c9b88a', 0, -len / 2, s * 0.25, 0.022, len, 0.022);
    for (let y = -0.25; y > -len + 0.1; y -= 0.31) k.box(0, y, 0, 0.05, 0.045, 0.56, '#8a6a4a');
    const rope = inked(k.P, 0.008); rope.position.set(RUIN.ladder.x, top, RUIN.ladder.z); rope.scale.y = 0.001; rope.visible = false; parent.add(rope);
    const hk = Kit(); hk.frame(RUIN.ladder.x + 0.06, top, RUIN.ladder.z, 0);
    for (const s of [-1, 1]) hk.box(0.02, 0.06, s * 0.25, 0.16, 0.05, 0.05, '#3a3640');
    const hooks = inked(hk.P, 0.006); hooks.visible = false; parent.add(hooks);
    return { rope, hooks, len };
  }
  // a patch of wildflowers (pick one for a gift)
  function buildFlowers(parent, F, gy) {
    const k = Kit(), R = rng(Math.round(F.x * 7 - F.z * 3)), y0 = F.y !== null ? F.y : gy(F.x, F.z);
    k.frame(F.x, y0, F.z, 0);
    const cols = ['#ff8fb1', '#ffd84a', '#ffffff', '#b9a2ff', '#ff6b5a'];
    for (let i = 0; i < 7; i++) {
      const a = R() * TAU, r = R() * 0.5, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 0.28 + R() * 0.2, c = cols[i % cols.length];
      k.beam([x, 0, z], [x + (R() - 0.5) * 0.08, h, z + (R() - 0.5) * 0.08], 0.022, '#4f9a45');
      for (let j = 0; j < 5; j++) { const b = j / 5 * TAU; k.add(GEO.sphS, c, x + Math.cos(b) * 0.045, h + 0.01, z + Math.sin(b) * 0.045, 0.04, 0.018, 0.04); }
      k.add(GEO.sphS, '#f2a33a', x, h + 0.025, z, 0.025);
      k.add(GEO.sphS, '#5aa84a', x + 0.05, 0.08, z, 0.06, 0.03, 0.03, 0, a, 0);
    }
    const m = inked(k.P, 0.006); parent.add(m);
    return { m, x: F.x, z: F.z, y: y0 };
  }
  // ---------------- the attic (built on first entry, like the corn hall): a gable roof with its ridge running north–south, the
  // round window in the north gable over the window seat, candles, poems pinned everywhere, a gramophone, a mattress on the
  // floor, crates of books, a desk. Walls and roof face inward only: from outside the camera sees in, like a dollhouse.
  let attic = null;
  function buildAttic() {
    if (attic) return attic;
    const scene = G.w3d.scene, g = new THREE.Group(); g.name = 'romance-attic'; g.visible = false; scene.add(g);
    const A = ATTIC, solids = [], X = A.x, Z = A.z;
    // floor, low side walls, the two gables, the two roof slopes
    const ft = planks(); ft.repeat.set(2.5, 2);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(A.hw * 2, 0.3, A.hd * 2), new THREE.MeshToonMaterial({ map: ft, gradientMap: TK.grad }));
    floor.position.set(X, AY - 0.15, Z); floor.receiveShadow = true; g.add(floor);
    const wt = plaster(); wt.repeat.set(0.45, 0.45);                       // (the gables' UVs are in units)
    const wallM = new THREE.MeshToonMaterial({ map: wt, gradientMap: TK.grad });
    const st = plaster(); st.repeat.set(A.hd * 2 * 0.45, A.eave * 0.45);    // (a plane's UVs are 0…1)
    const sideM = new THREE.MeshToonMaterial({ map: st, gradientMap: TK.grad });
    const roofT = planks(); roofT.repeat.set(1.6, 1.4);
    const roofM = new THREE.MeshToonMaterial({ map: roofT, gradientMap: TK.grad, color: '#8c7a8e' });
    for (const s of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(A.hd * 2, A.eave), sideM); m.position.set(X + s * A.hw, AY + A.eave / 2, Z); m.rotation.y = -s * HALF; m.receiveShadow = true; m.castShadow = true; g.add(m);
    }
    const gable = new THREE.Shape([new THREE.Vector2(-A.hw, 0), new THREE.Vector2(A.hw, 0), new THREE.Vector2(A.hw, A.eave), new THREE.Vector2(0, A.ridge), new THREE.Vector2(-A.hw, A.eave)]);
    for (const s of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.ShapeGeometry(gable), wallM); m.position.set(X, AY, Z + s * A.hd); m.rotation.y = s > 0 ? Math.PI : 0; m.receiveShadow = true; m.castShadow = true; g.add(m);
    }
    const L = Math.hypot(A.hw, A.ridge - A.eave), up = (A.ridge - A.eave) / L, out = A.hw / L;
    for (const s of [-1, 1]) {       // s −1: the west slope, s 1: the east one
      const geo = new THREE.PlaneGeometry(L, A.hd * 2), m = new THREE.Mesh(geo, roofM);
      const Xa = V3(-s * out, up, 0), Ya = V3(0, 0, s < 0 ? 1 : -1), N = V3().crossVectors(Xa, Ya);
      m.matrixAutoUpdate = false; m.matrix.makeBasis(Xa, Ya, N).setPosition(X + s * A.hw / 2, AY + (A.eave + A.ridge) / 2, Z);
      m.castShadow = true; m.receiveShadow = true; g.add(m);
    }
    // everything that stays put, in one mesh
    const k = Kit(), wood = '#4a3436', woodL = '#6b4a3e', plum = '#6e2f63', plumD = '#4a2a48', cream = '#efe6d6', brass = '#c9a24a';
    k.frame(X, AY, Z, 0);
    // the round window: its frame and cross; the window seat under it, with cushions
    k.put(new THREE.TorusGeometry(0.76, 0.07, 6, 20), wood, M4(0, 2.35, -A.hd + 0.05, 1));
    k.box(0, 2.35, -A.hd + 0.04, 0.05, 1.5, 0.04, wood).box(0, 2.35, -A.hd + 0.04, 1.5, 0.05, 0.04, wood);
    k.box(0, 0.225, -A.hd + 0.45, 2.7, 0.45, 0.72, wood).box(0, 0.5, -A.hd + 0.45, 2.5, 0.11, 0.62, plum);
    for (const [x, c] of [[-0.95, plumD], [1.0, '#8b3f7c']]) k.add(GEO.sphS, c, x, 0.68, -A.hd + 0.32, 0.26, 0.17, 0.12, 0.2, x * 0.3, 0);
    solids.push({ obox: 1, x: X, z: Z - A.hd + 0.45, hw: 1.38, hd: 0.4, rot: 0 });
    // the stool by the seat (the teacup sits on it)
    k.add(GEO.cyl, woodL, -1.55, 0.21, -3.05, 0.2, 0.42, 0.2);
    solids.push({ x: X - 1.55, z: Z - 3.05, r: 0.28 });
    // the desk (west): papers, an inkwell, a quill; its stool
    k.frame(X - 4.05, AY, Z - 0.6, 0);
    k.box(0, 0.78, 0, 0.85, 0.06, 1.5, woodL);
    for (const [x, z] of [[-0.36, -0.68], [0.36, -0.68], [-0.36, 0.68], [0.36, 0.68]]) k.box(x, 0.38, z, 0.07, 0.76, 0.07, wood);
    for (let i = 0; i < 4; i++) k.box(0.05 + (i % 2) * 0.08, 0.815 + i * 0.006, -0.28 + i * 0.1, 0.32, 0.006, 0.42, i === 3 ? '#fdf8ee' : cream, 0, 0.2 * (i - 1.5), 0);
    k.add(GEO.cyl8, '#1d1822', 0.22, 0.85, 0.42, 0.06, 0.09, 0.06).add(GEO.cone6, '#fdf8ee', 0.26, 0.98, 0.44, 0.035, 0.24, 0.012, 0, 0, -0.35);
    k.add(GEO.cyl, woodL, 0.7, 0.24, 0.1, 0.18, 0.48, 0.18);
    solids.push({ obox: 1, x: X - 4.05, z: Z - 0.6, hw: 0.48, hd: 0.8, rot: 0 });
    // the mattress on the floor (east): a dark quilt, a pillow
    k.frame(X + 3.7, AY, Z - 1.5, 0);
    k.box(0, 0.11, 0, 1.4, 0.22, 2.3, '#d9cfd8').box(0, 0.24, 0.2, 1.42, 0.06, 1.7, plumD);
    for (let i = 0; i < 4; i++) k.box(0, 0.275, -0.45 + i * 0.45, 1.43, 0.012, 0.03, '#6e4a6c');
    k.add(GEO.sphS, cream, 0, 0.32, -0.85, 0.45, 0.12, 0.24);
    solids.push({ obox: 1, x: X + 3.7, z: Z - 1.5, hw: 0.72, hd: 1.18, rot: 0 });
    // crates of books (east, south)
    k.frame(X + 4.4, AY, Z + 1.35, 0);
    k.box(0, 0.25, 0, 0.72, 0.5, 0.5, woodL).box(0, 0.73, 0, 0.66, 0.45, 0.46, '#7a5a48');
    for (let i = 0; i < 6; i++) k.box(-0.27 + i * 0.1, 0.3, 0.04, 0.08, 0.36, 0.34, ['#3f7fc9', '#2b2235', plum, '#4f9a5a', '#c9553f', '#e6b84a'][i]);
    for (let i = 0; i < 5; i++) k.box(-0.24 + i * 0.12, 0.76, 0.03, 0.1, 0.32, 0.32, ['#2b2235', '#8a5ab0', '#c9443a', '#3e8f8a', '#2b2235'][i], 0, 0, (i - 2) * 0.05);
    solids.push({ obox: 1, x: X + 4.4, z: Z + 1.35, hw: 0.4, hd: 0.3, rot: 0 });
    // the gramophone on a crate (west): a turntable, the tonearm, a brass horn
    k.frame(X - 4.15, AY, Z + 0.95, 0);
    k.box(0, 0.25, 0, 0.72, 0.5, 0.62, woodL).box(0, 0.57, 0, 0.5, 0.14, 0.46, '#5a3a2a');
    k.add(GEO.cyl, '#1d1822', 0, 0.65, 0, 0.18, 0.02, 0.18).add(GEO.cyl, '#b23a6a', 0, 0.662, 0, 0.06, 0.008, 0.06);
    k.beam([0.2, 0.68, -0.18], [0.04, 0.68, 0.05], 0.02, brass);
    k.put(new THREE.CylinderGeometry(0.3, 0.035, 0.55, 12, 1, true), brass, M4(0.12, 0.98, -0.12, 1, 1, 1, 0.5, -0.5, 0.35));
    solids.push({ obox: 1, x: X - 4.15, z: Z + 0.95, hw: 0.4, hd: 0.35, rot: 0 });
    // the rug, Poe's cushion; the little window in the west wall you came in through (the rope ladder's hooks on its sill), a coil of rope
    k.frame(X, AY, Z, 0);
    k.add(GEO.disc, '#5a2a52', 0.3, 0.012, 0.25, 1.5, 0.02, 1.15).add(GEO.disc, '#7a3a70', 0.3, 0.02, 0.25, 1.2, 0.012, 0.9);
    k.add(GEO.disc, '#8b3f7c', POE_SPOT.x - X, 0.05, POE_SPOT.z - Z, 0.34, 0.1, 0.34);
    k.box(-A.hw + 0.04, 0.32, 2.7, 0.08, 0.07, 1.0, wood).box(-A.hw + 0.04, 1.08, 2.7, 0.08, 0.07, 1.0, wood).box(-A.hw + 0.04, 0.7, 2.2, 0.08, 0.82, 0.07, wood).box(-A.hw + 0.04, 0.7, 3.2, 0.08, 0.82, 0.07, wood);
    k.box(-A.hw + 0.02, 0.7, 2.7, 0.02, 0.7, 0.9, '#2a2a4a');
    for (const z of [2.45, 2.95]) k.box(-A.hw + 0.14, 0.37, z, 0.2, 0.05, 0.05, '#3a3640');
    for (let i = 0; i < 4; i++) k.put(new THREE.TorusGeometry(0.2 - i * 0.02, 0.03, 4, 14), '#c9b88a', M4(-3.85, 0.04 + i * 0.05, 3.5, 1, 1, 1, 0, HALF, 0));
    // a lantern on the floor by the mattress
    k.add(GEO.cyl8, '#2f3440', 2.55, 0.03, 0.55, 0.16, 0.06, 0.16).add(GEO.cyl8, '#2f3440', 2.55, 0.5, 0.55, 0.13, 0.06, 0.13).add(GEO.torus, '#2f3440', 2.55, 0.62, 0.55, 0.08, 0.08, 0.1, HALF, 0, 0);
    for (const [dx, dz] of [[-0.11, -0.11], [0.11, -0.11], [-0.11, 0.11], [0.11, 0.11]]) k.box(2.55 + dx, 0.27, 0.55 + dz, 0.025, 0.46, 0.025, '#2f3440');
    // candles: on the window seat's ends, by the desk, by the mattress, on the crates
    const CANDLES = [[-1.2, 0.56, -3.6, 0.28], [-1.05, 0.56, -3.5, 0.18], [1.18, 0.56, -3.62, 0.22], [-3.55, 0.0, -1.7, 0.3], [-3.3, 0.0, -1.55, 0.16], [2.75, 0.0, -2.9, 0.24],
      [4.3, 0.95, 1.2, 0.18], [4.55, 0.95, 1.45, 0.26], [-0.6, 0.0, 1.4, 0.2], [1.6, 0.0, 2.2, 0.32]];
    for (const [x, y, z, h] of CANDLES) { k.add(GEO.cyl8, '#f2e9d8', x, y + h / 2, z, 0.045, h, 0.045); k.add(GEO.cyl8, '#d9cbb0', x, y + 0.015, z, 0.07, 0.03, 0.07); }
    const stat = inked(k.P, 0.016, { receive: true }); g.add(stat);
    // the walls' solids (pieces of at most 12: world.js looks only within 9 of you)
    solids.push({ obox: 1, x: X - A.hw - 0.3, z: Z, hw: 0.3, hd: A.hd, rot: 0 }, { obox: 1, x: X + A.hw + 0.3, z: Z, hw: 0.3, hd: A.hd, rot: 0 },
      { obox: 1, x: X, z: Z - A.hd - 0.3, hw: A.hw + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: X, z: Z + A.hd + 0.3, hw: A.hw + 0.3, hd: 0.3, rot: 0 });
    // what glows: candle flames, the lantern, the window
    const lit = Kit(); lit.frame(X, AY, Z, 0);
    for (const [x, y, z, h] of CANDLES) lit.add(GEO.cone6, '#ffd56a', x, y + h + 0.06, z, 0.035, 0.11, 0.035);
    lit.box(2.55, 0.27, 0.55, 0.2, 0.42, 0.2, '#ffe7a0');
    g.add(new THREE.Mesh(bake(lit.P), new THREE.MeshBasicMaterial({ vertexColors: true })));
    const win = new THREE.Mesh(new THREE.CircleGeometry(0.72, 24), new THREE.MeshBasicMaterial({ map: nightTex(), fog: false })); win.position.set(X, AY + 2.35, Z - A.hd + 0.02); g.add(win);
    const glows = CANDLES.map(([x, y, z, h]) => { const s = new THREE.Sprite(glowMat('#ffbf5a', 0.5)); s.scale.setScalar(0.85); s.position.set(X + x, AY + y + h + 0.08, Z + z); g.add(s); return s; });
    { const s = new THREE.Sprite(glowMat('#ffcf6a', 0.55)); s.scale.setScalar(2.0); s.position.set(X + 2.55, AY + 0.35, Z + 0.55); g.add(s); glows.push(s); }
    const moon = new THREE.Sprite(glowMat('#8fa0ff', 0.35)); moon.scale.setScalar(2.6); moon.position.set(X, AY + 2.35, Z - A.hd + 0.3); g.add(moon);
    // a shaft of moonlight from the window onto the floor
    const shaftTex = TK.canvasTex(32, 128, c => { const gr = c.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(200,210,255,0.8)'); gr.addColorStop(1, 'rgba(200,210,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, 32, 128); });
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.1, 2.6, 14, 1, true), new THREE.MeshBasicMaterial({ map: shaftTex, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
    shaft.position.set(X, AY + 1.2, Z - A.hd + 1.0); shaft.rotation.x = 0.55; g.add(shaft);
    // her poems, pinned to the walls (the gray last lines: the Hush at work)
    const POEMS_ON_WALLS = [[-1.45, 2.65, 'n', 0.12], [1.5, 2.55, 'n', -0.1], [-1.25, 1.55, 'n', -0.08], [1.35, 1.45, 'n', 0.1], [-2.4, 1.9, 'n', 0.05], [2.45, 2.0, 'n', -0.06],
      [-1.2, 0.85, 'w', 0.08], [1.6, 0.8, 'w', -0.1], [-0.8, 0.9, 'e', -0.05], [2.4, 0.85, 'e', 0.12]];
    const wallPapers = [];
    POEMS_ON_WALLS.forEach(([a, y, side, tilt], i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.47), new THREE.MeshToonMaterial({ map: paperTex(100 + i * 7, i % 3 === 0), gradientMap: TK.grad, transparent: true, alphaTest: 0.3 }));
      if (side === 'n') { m.position.set(X + a, AY + y, Z - A.hd + 0.025); m.rotation.set(0, 0, tilt); }
      else if (side === 'w') { m.position.set(X - A.hw + 0.025, AY + y, Z + a); m.rotation.set(0, HALF, tilt); }
      else { m.position.set(X + A.hw - 0.025, AY + y, Z + a); m.rotation.set(0, -HALF, tilt); }
      g.add(m); wallPapers.push(m);
    });
    // the things she might ask you to bring (separate: you take them to her)
    const items = {};
    const item = (id, P) => { const m = inked(P, 0.01); g.add(m); items[id] = m; return m; };
    { const f = FETCH[0]; item('candle', Kit().frame(f.at.x, AY + f.y, f.at.z, 0).add(GEO.cyl8, '#f2e9d8', 0, 0.12, 0, 0.05, 0.24, 0.05).add(GEO.cyl8, '#b8893a', 0, 0.0, 0, 0.1, 0.03, 0.1).P); }
    { const f = FETCH[1]; item('book', Kit().frame(f.at.x, AY + f.y + 0.12, f.at.z, 0.4).box(0, 0.03, 0, 0.3, 0.07, 0.38, plum).box(0.01, 0.03, 0, 0.29, 0.055, 0.36, cream).add(GEO.sphS, '#dfe4ee', 0, 0.066, 0.08, 0.04, 0.008, 0.04).P); }
    { const f = FETCH[2]; item('cup', Kit().frame(f.at.x, AY + f.y - 0.07, f.at.z, 0).add(GEO.cyl8, '#efe6f2', 0, 0.06, 0, 0.07, 0.11, 0.07).add(GEO.torus, '#efe6f2', 0.08, 0.06, 0, 0.035, 0.035, 0.035).add(GEO.cyl8, '#8a5a3a', 0, 0.11, 0, 0.062, 0.006, 0.062).P); }
    { const f = FETCH[3]; item('blanket', Kit().frame(f.at.x, AY + f.y, f.at.z, 0).box(0, 0, 0, 1.1, 0.12, 0.42, '#8b3f7c').box(0, 0.065, 0, 1.12, 0.008, 0.2, '#b06aa0').P); }
    { const f = FETCH[4]; item('record', Kit().frame(f.at.x + 0.42, AY + 0.21, f.at.z - 0.1, -HALF, -0.12).add(GEO.disc, '#1d1822', 0, 0, 0, 0.2, 0.012, 0.2, HALF, 0, 0).box(0, 0, -0.012, 0.36, 0.36, 0.008, '#c9a2d8', 0, 0, 0).P); }
    // Morgana's spot, Poe's
    solids.push({ x: SEAT.x, z: SEAT.z + 0.1, r: 0.42 });
    WORLD.addSolids(solids);
    WORLD.addPlatforms([{ box: [X - A.hw, X + A.hw, Z - A.hd, Z + A.hd], top: AY }]);
    attic = { g, stat, glows, moon, shaft, items, wallPapers, win };
    return attic;
  }
  // ================================================================ lines: { en (the weave version, with slots), es, pt, de }
  // Written natively in each language, A1–A2 mostly, a little harder at the higher ranks. Nothing in es/pt genders the player.
  const T = (en, es, pt, de) => ({ en, es, pt, de });
  const LT = {
    // ---------------- Morgana: meeting her (the attic, the first time)
    'm.meet.1': T('Poe. I told you: no visitors.', 'Poe. Te lo dije: nada de visitas.', 'Poe. Eu te falei: nada de visita.', 'Poe. Ich hab’s dir gesagt: kein Besuch.'),
    'm.meet.2': T('…And you followed a {w.cat}. Through the whole {c.village}.', '…Y tú seguiste a un gato. Por todo el pueblo.', '…E você seguiu um gato. Pela vila inteira.', '… Und du bist einer Katze gefolgt. Durchs ganze Dorf.'),
    'm.meet.3': T('They weren’t for you. They were for nobody. …I’m Morgana.', 'No eran para ti. Eran para nadie. …Soy Morgana.', 'Não eram pra você. Eram pra ninguém. …Eu sou a Morgana.', 'Die waren nicht für dich. Die waren für niemanden. … Ich bin Morgana.'),
    'm.meet.4': T('I come up here because it’s quiet. Nobody looks at a broken {w.house}.', 'Subo aquí porque es tranquilo. Nadie mira una casa rota.', 'Eu subo aqui porque é tranquilo. Ninguém olha pra uma casa caindo aos pedaços.', 'Ich komme hier hoch, weil es ruhig ist. Niemand schaut ein kaputtes Haus an.'),
    'm.meet.5': T('But lately the quiet bites. {c.look}: the last line of every {w.poem} goes gray.', 'Pero últimamente el silencio muerde. Mira: el último verso de cada poema se pone gris.', 'Mas ultimamente o silêncio morde. Olha: o último verso de cada poema fica cinza.', 'Aber in letzter Zeit beißt die Stille. Schau: Die letzte Zeile von jedem Gedicht wird grau.'),
    'm.meet.6': T('Great. So my {w.poem:pl} need an audience. How tragic.', 'Genial. O sea que mis poemas necesitan público. Qué trágico.', 'Ótimo. Então os meus poemas precisam de plateia. Que trágico.', 'Super. Meine Gedichte brauchen also Publikum. Wie tragisch.'),
    'm.meet.7': T('Fine. You can come back. You don’t rub me the wrong way.', 'Bueno. Puedes volver. No me caes mal.', 'Tá. Pode voltar. Até que eu vou com a sua cara.', 'Na gut. Du kannst wiederkommen. Du bist mir nicht unsympathisch.'),
    'm.meet.8': T('That’s my way of saying «{caes}». Say it back… if you mean it.', 'Así digo yo «me caes bien». Dímelo tú… si lo dices en serio.', 'É o meu jeito de dizer «vou com a sua cara». Agora fala você… se for verdade.', 'So sage ich «du bist mir sympathisch». Sag du es … wenn du es ernst meinst.'),
    'm.meet.9': T('…Hm. Okay. Bring something to say next time.', '…Mmm. Bueno. La próxima vez, trae algo que decir.', '…Hum. Tá. Da próxima vez, traz alguma coisa pra dizer.', '… Hm. Okay. Bring nächstes Mal was zum Erzählen mit.'),
    'm.meet.skip': T('Too shy? …Me too. Come back anyway.', '¿Te da vergüenza? …A mí también. Vuelve igual.', 'Ficou com vergonha? …Eu também. Volta mesmo assim.', 'Zu schüchtern? … Ich auch. Komm trotzdem wieder.'),
    'm.voice': T('Poe… who followed you this time?', 'Poe… ¿quién te siguió esta vez?', 'Poe… quem te seguiu dessa vez?', 'Poe … wer ist dir diesmal gefolgt?'),
    // rank 2: getting to know her, and the ask-out
    'm.r2.1': T('You came back. Again. Poe likes you. That’s suspicious.', 'Volviste. Otra vez. A Poe le caes bien. Eso es sospechoso.', 'Você voltou. De novo. O Poe gosta de você. Isso é suspeito.', 'Du bist wiedergekommen. Schon wieder. Poe mag dich. Das ist verdächtig.'),
    'm.r2.2': T('I’ve been writing {w.poem:pl} since I was nine. I’m twenty-one now. That’s a lot of {w.poem:pl} about cats.', 'Escribo poemas desde los nueve años. Ahora tengo veintiuno. Son muchos poemas sobre gatos.', 'Eu escrevo poemas desde os nove anos. Agora tenho vinte e um. É muito poema sobre gato.', 'Ich schreibe Gedichte, seit ich neun bin. Jetzt bin ich einundzwanzig. Das sind viele Gedichte über Katzen.'),
    'm.r2.3': T('Nobody had ever read them. Until you.', 'Nadie los había leído nunca. Hasta que llegaste.', 'Ninguém nunca tinha lido. Até você chegar.', 'Niemand hat sie je gelesen. Bis du kamst.'),
    'm.r2.4': T('If I say them out loud, they’re real. And people laugh at real things.', 'Si los digo en voz alta, son reales. Y la gente se ríe de las cosas reales.', 'Se eu falo em voz alta, eles viram reais. E as pessoas riem das coisas reais.', 'Wenn ich sie laut sage, sind sie echt. Und über echte Dinge lachen die Leute.'),
    'm.r2.5': T('…You didn’t laugh. Not once.', '…Tú no te reíste. Ni una vez.', '…Você não riu. Nenhuma vez.', '… Du hast nicht gelacht. Kein einziges Mal.'),
    'm.r2.6': T('There’s «{caes}», and there’s «{gustas}». The second one is… more. Just so you know.', 'Una cosa es «me caes bien», y otra es «me gustas». La segunda es… más. Para que sepas.', 'Tem «vou com a sua cara», e tem «tô a fim de você». O segundo é… mais. Só pra você saber.', 'Es gibt «du bist mir sympathisch», und es gibt «du gefällst mir». Das Zweite ist … mehr. Nur damit du’s weißt.'),
    'm.r2.7': T('…Oh. That one. Okay.', '…Ah. Esa. Bueno.', '…Ah. Esse. Tá.', '… Oh. Das. Okay.'),
    'm.r2.yes': T('…Yes. But if you tell anyone I smiled, I’ll deny it.', '…Sí. Pero si le cuentas a alguien que sonreí, lo voy a negar.', '…Sim. Mas se você contar pra alguém que eu sorri, eu vou negar.', '… Ja. Aber wenn du jemandem erzählst, dass ich gelächelt habe, streite ich alles ab.'),
    'm.r2.no': T('Was there… something else? No? Okay.', '¿Había… algo más? ¿No? Bueno.', 'Tinha… mais alguma coisa? Não? Tá.', 'War da … noch was? Nein? Okay.'),
    'm.r2.rival1': T('Wait. You smell like coal. You’re with the loud one from the forge, aren’t you?', 'Espera. Hueles a carbón. Estás con el ruidoso de la forja, ¿no?', 'Peraí. Você tá com cheiro de carvão. Você tá com o barulhento da forja, né?', 'Moment. Du riechst nach Kohle. Du bist mit dem Lauten aus der Schmiede zusammen, oder?'),
    'm.r2.rival2': T('Then we’re rivals. Nothing personal. Or maybe it is.', 'Entonces somos rivales. No es nada personal. O tal vez sí.', 'Então somos rivais. Nada pessoal. Ou talvez seja.', 'Dann sind wir Rivalen. Nichts Persönliches. Oder vielleicht doch.'),
    // rank 3: a date that goes deeper (holding hands unlocks)
    'm.r3.1': T('They say you chased the gray off the {c.hill}. With words.', 'Dicen que espantaste lo gris de la colina. Con palabras.', 'Dizem que você espantou o cinza do morro. Com palavras.', 'Man sagt, du hast das Grau vom Hügel verjagt. Mit Wörtern.'),
    'm.r3.2': T('I watched from the {w.window}. The {c.hill} turned green again. It was… almost poetic.', 'Lo vi desde la ventana. La colina se puso verde otra vez. Fue… casi poético.', 'Eu vi da janela. O morro ficou verde de novo. Foi… quase poético.', 'Ich hab’s vom Fenster aus gesehen. Der Hügel wurde wieder grün. Das war … fast poetisch.'),
    'm.r3.3': T('I wrote something about it. Don’t make that face.', 'Escribí algo sobre eso. No pongas esa cara.', 'Eu escrevi uma coisa sobre isso. Não faz essa cara.', 'Ich hab was darüber geschrieben. Mach nicht so ein Gesicht.'),
    'm.r3.4': T('«Someone spoke, and the hill remembered its color.»', '«Alguien habló, y la colina recordó su color.»', '«Alguém falou, e o morro lembrou a sua cor.»', '«Jemand hat gesprochen, und der Hügel hat sich an seine Farbe erinnert.»'),
    'm.r3.5': T('This time the last line didn’t go gray. I think it’s because of you.', 'Esta vez el último verso no se puso gris. Creo que es por ti.', 'Dessa vez o último verso não ficou cinza. Acho que é por sua causa.', 'Diesmal ist die letzte Zeile nicht grau geworden. Ich glaube, das liegt an dir.'),
    'm.r3.6': T('…You can hold my hand sometime. If you ask. Properly.', '…Algún día puedes tomarme la mano. Si me lo pides. Como se debe.', '…Um dia você pode segurar a minha mão. Se pedir. Direitinho.', '… Du darfst irgendwann meine Hand halten. Wenn du fragst. Richtig.'),
    // rank 4: her soft side, and a favor (read her grandmother's poem out loud)
    'm.r4.1': T('Can I tell you something? You’ll think it’s silly.', '¿Te puedo contar algo? Vas a pensar que es una tontería.', 'Posso te contar uma coisa? Você vai achar bobagem.', 'Darf ich dir was erzählen? Du findest es bestimmt albern.'),
    'm.r4.2': T('My grandmother read me {w.poem:pl} every night. She had the softest voice.', 'Mi abuela me leía poemas todas las noches. Tenía la voz más suave del mundo.', 'A minha avó lia poemas pra mim toda noite. Ela tinha a voz mais suave do mundo.', 'Meine Oma hat mir jeden Abend Gedichte vorgelesen. Sie hatte die sanfteste Stimme der Welt.'),
    'm.r4.3': T('When she was gone, I stopped reading them out loud. I thought {c.silence} was respect.', 'Cuando ella se fue, dejé de leerlos en voz alta. Pensé que el silencio era respeto.', 'Quando ela se foi, eu parei de ler em voz alta. Achei que o silêncio era respeito.', 'Als sie nicht mehr da war, hab ich aufgehört, sie laut zu lesen. Ich dachte, Schweigen ist Respekt.'),
    'm.r4.4': T('But {c.silence} isn’t respect. It’s just {c.silence}. And the Hush loves it.', 'Pero el silencio no es respeto. Es solo silencio. Y al Silencio le encanta.', 'Mas silêncio não é respeito. É só silêncio. E o Silêncio adora.', 'Aber Schweigen ist kein Respekt. Es ist nur Schweigen. Und die Stille liebt das.'),
    'm.r4.5': T('This was her favorite. Would you… read it to me? Out loud? I can’t.', 'Este era su favorito. ¿Me lo… lees tú? ¿En voz alta? Yo no puedo.', 'Esse era o favorito dela. Você… lê pra mim? Em voz alta? Eu não consigo.', 'Das war ihr Lieblingsgedicht. Liest du es mir … vor? Laut? Ich kann das nicht.'),
    'm.r4.6': T('…So that’s what it sounds like. In someone else’s voice.', '…Así suena. En la voz de otra persona.', '…Então é assim que fica. Na voz de outra pessoa.', '… So klingt das also. Mit einer anderen Stimme.'),
    'm.r4.7': T('{c.thanks:f}. She would have liked you. Poe already does. Traitor.', 'Gracias. Le habrías caído bien. A Poe ya le caes bien. Traidor.', 'Obrigada. Ela ia gostar de você. O Poe já gosta. Traidor.', 'Danke. Sie hätte dich gemocht. Poe mag dich ja schon. Verräter.'),
    'm.r4.skip': T('Not today? …That’s okay. It has waited this long; it can wait a little more.', '¿Hoy no? …Está bien. Ya esperó mucho; puede esperar un poco más.', 'Hoje não? …Tudo bem. Ele já esperou tanto, pode esperar mais um pouco.', 'Heute nicht? … Schon okay. Es hat so lange gewartet, da kann es noch ein bisschen warten.'),
    // rank 5: the confession, then her poem on the old theater's steps
    'm.r5.1': T('The first {w.bell} rang. I heard it from here. Even Poe sat up.', 'Sonó la primera campana. La oí desde aquí. Hasta Poe se levantó.', 'O primeiro sino tocou. Eu ouvi daqui. Até o Poe levantou.', 'Die erste Glocke hat geläutet. Ich hab sie von hier gehört. Sogar Poe hat sich aufgesetzt.'),
    'm.r5.2': T('I finished a {w.poem}. A whole one. The last line stayed.', 'Terminé un poema. Uno entero. El último verso se quedó.', 'Eu terminei um poema. Inteirinho. O último verso ficou.', 'Ich hab ein Gedicht fertig. Ein ganzes. Die letzte Zeile ist geblieben.'),
    'm.r5.3': T('But first… you look like you want to say something. Say it.', 'Pero antes… tienes cara de querer decir algo. Dilo.', 'Mas antes… você tá com cara de quem quer falar alguma coisa. Fala.', 'Aber vorher … du siehst aus, als wolltest du was sagen. Sag es.'),
    'm.r5.amo1': T('«{amo}»? We’ve had a few dates and a {w.cat}.', '¿«Te amo»? Llevamos unas cuantas citas y un gato.', '«Te amo»? A gente teve uns encontros e um gato.', '«Ich liebe dich»? Wir hatten ein paar Dates und eine Katze.'),
    'm.r5.amo2': T('That one’s for years from now. Say the other one. It’s still big. Trust me.', 'Esa es para dentro de muchos años. Di la otra. También es grande. Créeme.', 'Essa é pra daqui a muitos anos. Fala a outra. Ela também é grande. Confia.', 'Das ist was für in vielen Jahren. Sag das andere. Das ist auch groß. Glaub mir.'),
    'm.r5.quiero': T('…Me too. I mean it. Don’t look at me like that.', '…Yo también te quiero. En serio. No me mires así.', '…Eu também gosto muito de você. É sério. Não me olha assim.', '… Ich hab dich auch lieb. Ehrlich. Schau mich nicht so an.'),
    'm.r5.shy': T('Nothing? …Okay. I’ll wait. I’m good at waiting.', '¿Nada? …Bueno. Espero. Soy buena esperando.', 'Nada? …Tá. Eu espero. Eu sou boa em esperar.', 'Nichts? … Okay. Ich warte. Warten kann ich gut.'),
    'm.r5.4': T('Come. I want to read it somewhere with an audience. Even if the audience is a {w.cat}.', 'Ven. Quiero leerlo en un lugar con público. Aunque el público sea un gato.', 'Vem. Quero ler num lugar com plateia. Mesmo que a plateia seja um gato.', 'Komm. Ich will es irgendwo mit Publikum lesen. Auch wenn das Publikum eine Katze ist.'),
    'm.r5.5': T('The old theater. Aurora built it so everyone could sing. Perfect.', 'El viejo teatro. Aurora lo construyó para que todos cantaran. Perfecto.', 'O velho teatro. A Aurora construiu pra todo mundo cantar. Perfeito.', 'Das alte Theater. Aurora hat es gebaut, damit alle singen können. Perfekt.'),
    'm.r5.6': T('There. Out loud. In front of the whole {c.village}.', 'Listo. En voz alta. Delante de todo el pueblo.', 'Pronto. Em voz alta. Na frente da vila inteira.', 'So. Laut. Vor dem ganzen Dorf.'),
    'm.r5.7': T('Exactly. The best audience in the world.', 'Exacto. El mejor público del mundo.', 'Exatamente. A melhor plateia do mundo.', 'Genau. Das beste Publikum der Welt.'),
    'm.r5.8': T('…Don’t let it go to your head.', '…Que no se te suba a la cabeza.', '…Não vai ficar se achando, hein.', '… Bild dir bloß nichts drauf ein.'),
    // what she says when a rank is waiting on the story (or on time together)
    'm.gate.boss': T('Everyone’s talking about the gray {c.hill} east of town. Go do something about it. Then come back.', 'Todo el mundo habla de la colina gris al este del pueblo. Haz algo al respecto. Y vuelve.', 'Todo mundo tá falando do morro cinza a leste da vila. Vai lá resolver. Depois volta.', 'Alle reden über den grauen Hügel östlich vom Dorf. Kümmer dich drum. Dann komm wieder.'),
    'm.gate.ciro': T('There’s a clockmaker in Molinar who knows about the old {w.bell:pl}. Find him. Then tell me everything.', 'Hay un relojero en Molinar que sabe de las campanas viejas. Búscalo. Y luego me lo cuentas todo.', 'Tem um relojoeiro em Molinar que sabe dos sinos antigos. Procura ele. Depois me conta tudo.', 'In Molinar gibt es einen Uhrmacher, der alles über die alten Glocken weiß. Such ihn. Dann erzähl mir alles.'),
    'm.gate.bell': T('If one {w.bell} rang again… maybe I’d finish a {w.poem}. Just saying.', 'Si sonara una campana otra vez… a lo mejor terminaría un poema. Solo digo.', 'Se um sino tocasse de novo… talvez eu terminasse um poema. Só tô falando.', 'Wenn wieder eine Glocke läuten würde … vielleicht würde ich ein Gedicht fertig schreiben. Nur so.'),
    'm.chat.1': T('Poe brought me a dead leaf today. Best gift of the week.', 'Poe me trajo una hoja seca hoy. El mejor regalo de la semana.', 'O Poe me trouxe uma folha seca hoje. O melhor presente da semana.', 'Poe hat mir heute ein trockenes Blatt gebracht. Das beste Geschenk der Woche.'),
    'm.chat.2': T('I like the rain. It talks, so I don’t have to.', 'Me gusta la lluvia. Ella habla y así yo no tengo que hablar.', 'Eu gosto da chuva. Ela fala, aí eu não preciso falar.', 'Ich mag Regen. Er redet, dann muss ich nicht reden.'),
    'm.chat.3': T('Don’t touch the {w.candle:pl}. They have feelings.', 'No toques las velas. Tienen sentimientos.', 'Não mexe nas velas. Elas têm sentimentos.', 'Fass die Kerzen nicht an. Die haben Gefühle.'),
    'm.chat.4': T('You’re here again. Good. I mean… whatever. Good.', 'Estás aquí otra vez. Bien. O sea… da igual. Bien.', 'Você tá aqui de novo. Que bom. Quer dizer… tanto faz. Que bom.', 'Du bist wieder da. Gut. Ich meine … egal. Gut.'),
    'm.chat.5': T('I read my {w.poem:pl} to Poe now. Out loud. He pretends not to care.', 'Ahora le leo mis poemas a Poe. En voz alta. Él finge que no le importa.', 'Agora eu leio meus poemas pro Poe. Em voz alta. Ele finge que não liga.', 'Ich lese Poe jetzt meine Gedichte vor. Laut. Er tut so, als wär’s ihm egal.'),
    'm.cool': T('Again? Later. My social battery is down to one {w.candle}.', '¿Otra vez? Más tarde. Mi batería social está en una vela.', 'De novo? Mais tarde. Minha bateria social tá numa vela só.', 'Schon wieder? Später. Mein Sozialakku steht bei einer Kerze.'),
    'm.wait': T('Did you talk to him yet? Kindly?', '¿Ya hablaste con él? ¿Con cariño?', 'Já falou com ele? Com carinho?', 'Hast du schon mit ihm geredet? Lieb?'),
    'm.switch.yes': T('…You talked to him. Good. Then yes.', '…Hablaste con él. Bien. Entonces sí.', '…Você falou com ele. Ótimo. Então, sim.', '… Du hast mit ihm geredet. Gut. Dann ja.'),
    // her dates
    'm.d.words': T('Go on. Say something nice. I’ll pretend I don’t care.', 'Dale. Dime algo bonito. Voy a fingir que no me importa.', 'Vai. Fala alguma coisa bonita. Vou fingir que não ligo.', 'Na los. Sag was Nettes. Ich tu so, als wär’s mir egal.'),
    'm.d.wordsLove': T('…Say that again. No, don’t. I heard it. {c.thanks:f}.', '…Dilo otra vez. No, no lo digas. Ya lo oí. Gracias.', '…Fala de novo. Não, não fala. Eu ouvi. Obrigada.', '… Sag das noch mal. Nein, lass. Ich hab’s gehört. Danke.'),
    'm.d.wordsOk': T('Hm. Nice. A bit greeting card, but nice.', 'Mmm. Lindo. Un poco de tarjeta de cumpleaños, pero lindo.', 'Hum. Bonitinho. Meio cartão de aniversário, mas bonitinho.', 'Hm. Nett. Ein bisschen Glückwunschkarte, aber nett.'),
    'm.d.wordsMeh': T('«{adj}». Wow. Did you get that off a candy wrapper?', '«{adj}». Guau. ¿Lo sacaste de un papel de dulce?', '«{adj}». Nossa. Tirou isso de papel de bala?', '«{adj}». Wow. Stand das auf einer Bonbonverpackung?'),
    'm.d.wordsSlip': T('«{adj}»? I’m «{fix}», thank you. But… I’ll take it.', '¿«{adj}»? Soy «{fix}», gracias. Pero… lo acepto.', '«{adj}»? Eu sou «{fix}», obrigada. Mas… aceito.', '«{adj}»? Ich bin «{fix}», danke. Aber … ich nehm’s.'),
    'm.d.wordsOdd': T('…I don’t know that word. But you said it with feeling.', '…No conozco esa palabra. Pero la dijiste con sentimiento.', '…Não conheço essa palavra. Mas você falou com sentimento.', '… Das Wort kenn ich nicht. Aber du hast es mit Gefühl gesagt.'),
    'm.d.time': T('A walk. Fine. Slowly. I talk, you listen. For once.', 'Un paseo. Bueno. Despacio. Yo hablo y tú escuchas. Por una vez.', 'Um passeio. Tá. Devagar. Eu falo e você escuta. Pra variar.', 'Ein Spaziergang. Na gut. Langsam. Ich rede, du hörst zu. Zur Abwechslung.'),
    'm.d.timeOk': T('…You were actually listening. Nobody does that.', '…Me estabas escuchando de verdad. Nadie hace eso.', '…Você tava escutando de verdade. Ninguém faz isso.', '… Du hast wirklich zugehört. Das macht sonst keiner.'),
    'm.d.timeNo': T('Wrong. Were you looking at the moon? …Fair enough.', 'No. ¿Estabas mirando la luna? …Bueno, te entiendo.', 'Errado. Tava olhando pra lua? …Tá, eu entendo.', 'Falsch. Hast du zum Mond geschaut? … Na gut, verstehe ich.'),
    'm.d.gift': T('A gift? For me? …What is it?', '¿Un regalo? ¿Para mí? …¿Qué es?', 'Um presente? Pra mim? …O que é?', 'Ein Geschenk? Für mich? … Was ist es?'),
    'm.g.newspaper': T('A {w.newspaper}! I cut words out of these and make collage {w.poem:pl}. How did you know?', '¡Un periódico! Recorto las palabras y hago poemas collage. ¿Cómo sabías?', 'Um jornal! Eu recorto as palavras e faço poemas de colagem. Como você sabia?', 'Eine Zeitung! Ich schneide Wörter aus und mache Collage-Gedichte. Woher wusstest du das?'),
    'm.g.chocolate': T('{w.chocolate}. Dark, I hope. …It doesn’t matter. {c.thanks:f}.', 'Chocolate. Amargo, espero. …Da igual. Gracias.', 'Chocolate. Amargo, espero. …Tanto faz. Obrigada.', 'Schokolade. Zartbitter, hoffe ich. … Egal. Danke.'),
    'm.g.flower': T('A wild {w.flower}. I’ll press it in my notebook. It’ll be beautiful when it’s dry.', 'Una flor silvestre. La voy a guardar en mi cuaderno. Seca va a ser preciosa.', 'Uma flor do campo. Vou guardar no meu caderno. Seca ela vai ficar linda.', 'Eine Wildblume. Die press ich in meinem Heft. Getrocknet wird sie wunderschön.'),
    'm.g.candy': T('{w.candy}. Too sweet. Like a greeting card. …I’ll give it to Poe.', 'Dulces. Demasiado dulces. Como una tarjeta de cumpleaños. …Se los doy a Poe.', 'Bala. Doce demais. Que nem cartão de aniversário. …Vou dar pro Poe.', 'Bonbons. Zu süß. Wie eine Glückwunschkarte. … Ich geb sie Poe.'),
    'm.g.gum': T('{w.gum}. Wow. I’m not twelve.', 'Chicle. Guau. No tengo doce años.', 'Chiclete. Nossa. Eu não tenho doze anos.', 'Kaugummi. Wow. Ich bin keine zwölf.'),
    'm.g.hat': T('A straw {w.hat}? Do I look like someone who goes out in the sun?', '¿Un sombrero de paja? ¿Tengo cara de salir al sol?', 'Um chapéu de palha? Eu tenho cara de quem sai no sol?', 'Ein Strohhut? Seh ich aus, als würde ich in die Sonne gehen?'),
    'm.g.soda': T('{w.soda}. It fizzes. Like tiny screaming. No.', 'Refresco. Hace burbujas. Como gritos chiquitos. No.', 'Refrigerante. Faz bolinha. Que nem gritinho. Não.', 'Limo. Die sprudelt. Wie winzige Schreie. Nein.'),
    'm.g.ok': T('Oh. {c.thanks:f}. I’ll… keep it. Somewhere safe.', 'Ah. Gracias. Lo voy a… guardar. En un lugar seguro.', 'Ah. Obrigada. Vou… guardar. Num lugar seguro.', 'Oh. Danke. Ich … heb das auf. An einem sicheren Ort.'),
    'm.f.candle': T('Bring me the {w.candle}, {c.please}. This one’s almost out.', 'Tráeme la vela, por favor. Esta ya casi se apaga.', 'Me traz a vela, por favor. Essa aqui tá quase apagando.', 'Bring mir bitte die Kerze. Die hier geht gleich aus.'),
    'm.f.book': T('Bring me the {w.book}, {c.please}. The one with the purple cover.', 'Tráeme el libro, por favor. El de la tapa morada.', 'Me traz o livro, por favor. O de capa roxa.', 'Bring mir bitte das Buch. Das mit dem lila Einband.'),
    'm.f.cup': T('Bring me the {w.cup}, {c.please}. My tea’s gone cold.', 'Tráeme la taza, por favor. Mi té ya está frío.', 'Me traz a xícara, por favor. O meu chá já esfriou.', 'Bring mir bitte die Tasse. Mein Tee ist schon kalt.'),
    'm.f.blanket': T('Bring me the {w.blanket}, {c.please}. I’m cold.', 'Tráeme la manta, por favor. Tengo frío.', 'Me traz o cobertor, por favor. Tô com frio.', 'Bring mir bitte die Decke. Mir ist kalt.'),
    'm.f.record': T('Bring me the {w.record}, {c.please}. I want sad music.', 'Tráeme el disco, por favor. Quiero música triste.', 'Me traz o disco, por favor. Quero música triste.', 'Bring mir bitte die Schallplatte. Ich will traurige Musik.'),
    'm.f.ok': T('…{c.thanks:f}. You’re useful. That’s a compliment, by the way.', '…Gracias. Eres útil. Es un cumplido, por cierto.', '…Obrigada. Você é útil. É um elogio, tá?', '… Danke. Du bist nützlich. Das ist übrigens ein Kompliment.'),
    'm.f.wrong': T('That’s {got}. I asked for {want}. Try again.', 'Eso es {got}. Te pedí {want}. Inténtalo otra vez.', 'Isso é {got}. Eu pedi {want}. Tenta de novo.', 'Das ist {got}. Ich wollte {want}. Versuch’s noch mal.'),
    'm.d.touch': T('…Hm? You want something. Ask.', '…¿Mmm? Quieres algo. Pregunta.', '…Hum? Você quer alguma coisa. Pergunta.', '… Hm? Du willst was. Frag.'),
    'm.d.touchYes': T('…Yes. Just don’t make it weird. …Your hand is warm.', '…Sí. Pero que no sea raro. …Tienes la mano calientita.', '…Pode. Só não deixa ficar esquisito. …A sua mão é quentinha.', '… Ja. Aber mach’s nicht komisch. … Deine Hand ist warm.'),
    'm.d.touchOrder': T('That’s an order, not a question. Try asking.', 'Eso es una orden, no una pregunta. Intenta preguntar.', 'Isso é uma ordem, não uma pergunta. Tenta perguntar.', 'Das ist ein Befehl, keine Frage. Versuch’s mit Fragen.'),
    'm.d.touchHuh': T('Hold… what? Ask me properly.', '¿Tomar… qué? Pregúntame bien.', 'Segurar… o quê? Pergunta direito.', 'Halten … was? Frag mich richtig.'),
    'm.d.touchAfter': T('…Okay. That was nice. Don’t tell Poe.', '…Bueno. Eso estuvo lindo. No le digas a Poe.', '…Tá. Foi bom. Não conta pro Poe.', '… Okay. Das war schön. Sag’s nicht Poe.'),
    // breaking up with her (kindly)
    'm.bu.1': T('You have that face. The “we need to talk” face.', 'Tienes esa cara. La cara de «tenemos que hablar».', 'Você tá com aquela cara. A cara de «a gente precisa conversar».', 'Du hast dieses Gesicht. Das «Wir müssen reden»-Gesicht.'),
    'm.bu.blunt': T('Ouch. That was a hammer, not a word. Try again… carefully.', 'Auch. Eso fue un martillazo, no una palabra. Inténtalo otra vez… con cuidado.', 'Ai. Isso foi uma martelada, não uma palavra. Tenta de novo… com cuidado.', 'Autsch. Das war ein Hammer, kein Wort. Versuch’s noch mal … vorsichtig.'),
    'm.bu.dodge': T('The weather’s fine. Now say the real thing.', 'El clima está bien. Ahora dime la verdad.', 'O tempo tá ótimo. Agora fala a verdade.', 'Das Wetter ist schön. Jetzt sag, was wirklich los ist.'),
    'm.bu.ok1': T('…Okay. Thank you for saying it, and not just disappearing.', '…Está bien. Gracias por decírmelo y no desaparecer.', '…Tudo bem. Obrigada por me falar, em vez de sumir.', '… Okay. Danke, dass du es mir sagst und nicht einfach verschwindest.'),
    'm.bu.ok2': T('Go. But Poe is going to keep glaring at you.', 'Ve. Pero Poe te va a seguir mirando mal.', 'Vai. Mas o Poe vai continuar te olhando torto.', 'Geh. Aber Poe wird dich weiter böse anschauen.'),

    // ---------------- Dante: meeting him (at the forge)
    'd.before': T('Hi! New in town? Go see Rosa at the fruit stall first. She knows everybody!', '¡Hola! ¿Recién llegas? Primero ve a ver a Doña Rosa, al puesto de fruta. ¡Ella conoce a todo el mundo!', 'Oi! Acabou de chegar? Primeiro fala com a Dona Rosa, na barraca de frutas. Ela conhece todo mundo!', 'Hallo! Neu hier? Geh zuerst zu Oma Rosa am Obststand. Die kennt jeden!'),
    'd.meet.1': T('♪ La-la-LAAA… ♪ Oh! A visitor! Hi! I’m Dante!', '♪ La-la-LAAA… ♪ ¡Oh! ¡Una visita! ¡Hola! ¡Soy Dante!', '♪ Lá-lá-LÁÁÁ… ♪ Opa! Visita! Oi! Eu sou o Dante!', '♪ La-la-LAAA … ♪ Oh! Besuch! Hallo! Ich bin Dante!'),
    'd.meet.2': T('Sorry about the singing. I sing so the Hush can’t get close. Loud means safe!', 'Perdón por cantar. Canto para que el Silencio no se acerque. ¡Mientras más fuerte, más seguro!', 'Foi mal a cantoria. Eu canto pro Silêncio não chegar perto. Quanto mais alto, mais seguro!', 'Sorry wegen dem Singen. Ich singe, damit die Stille nicht näher kommt. Laut ist sicher!'),
    'd.meet.3': T('I’m a blacksmith. Well, I fix {w.bell:pl}. Well… I fix this {w.bell}. Just one.', 'Soy herrero. Bueno, arreglo campanas. Bueno… arreglo esta campana. Una sola.', 'Eu sou ferreiro. Quer dizer, eu conserto sinos. Quer dizer… eu conserto esse sino. Um só.', 'Ich bin Schmied. Also, ich repariere Glocken. Also … ich repariere diese Glocke. Nur eine.'),
    'd.meet.4': T('It cracked the day the Hush came. It’s Alba’s voice. I’m going to mend it.', 'Se rajó el día que llegó el Silencio. Es la voz de Alba. La voy a arreglar.', 'Ele rachou no dia em que o Silêncio chegou. É a voz de Alba. Eu vou consertar.', 'Sie hat einen Riss, seit die Stille kam. Sie ist Albas Stimme. Ich krieg sie wieder hin.'),
    'd.meet.5': T('Big jobs are my thing! Everybody always says: Dante, you’re so strong!', '¡Los trabajos grandes son lo mío! Todo el mundo me dice: ¡Dante, qué fuerte eres!', 'Trabalho grande é comigo mesmo! Todo mundo sempre fala: Dante, como você é forte!', 'Große Jobs sind mein Ding! Alle sagen immer: Dante, du bist so stark!'),
    'd.meet.6': T('…Yeah. Strong. That’s me.', '…Sí. Fuerte. Ese soy yo.', '…É. Forte. Esse sou eu.', '… Ja. Stark. Das bin ich.'),
    'd.meet.7': T('But hey! I like you already! «{caes}»: it means you’re good people. Say it to me!', '¡Pero oye! ¡Ya me caes bien! «Me caes bien»: o sea, que eres buena gente. ¡Dímelo tú!', 'Mas olha! Eu já vou com a sua cara! «Vou com a sua cara»: quer dizer que você é gente boa. Fala pra mim!', 'Aber hey! Du bist mir jetzt schon sympathisch! «Du bist mir sympathisch»: Das heißt, ich mag dich. Sag’s mir auch!'),
    'd.meet.8': T('HA! Perfect! Come back anytime! Bring your ears! I have songs!', '¡JA! ¡Perfecto! ¡Vuelve cuando quieras! ¡Trae tus orejas! ¡Tengo canciones!', 'HA! Perfeito! Volta quando quiser! Traz os ouvidos! Eu tenho música!', 'HA! Perfekt! Komm jederzeit wieder! Bring deine Ohren mit! Ich hab Lieder!'),
    'd.meet.skip': T('Shy? No problem! I’m loud enough for two!', '¿Te da pena? ¡No pasa nada! ¡Yo hablo fuerte por los dos!', 'Ficou com vergonha? Sem problema! Eu falo alto por nós dois!', 'Schüchtern? Kein Problem! Ich bin laut genug für zwei!'),
    // rank 2
    'd.r2.1': T('Hey, you came back! Most people only come back for the coal.', '¡Ey, volviste! La mayoría solo vuelve por el carbón.', 'E aí, você voltou! A maioria só volta por causa do carvão.', 'Hey, du bist wieder da! Die meisten kommen nur wegen der Kohle wieder.'),
    'd.r2.2': T('I’m twenty-four and I still sing to my anvil. Don’t tell anyone.', 'Tengo veinticuatro años y todavía le canto a mi yunque. No se lo digas a nadie.', 'Eu tenho vinte e quatro anos e ainda canto pra minha bigorna. Não conta pra ninguém.', 'Ich bin vierundzwanzig und singe immer noch meinem Amboss was vor. Sag’s niemandem.'),
    'd.r2.3': T('I write song lyrics, you know. Whole notebooks. I never sing those.', '¿Sabes? Escribo letras de canciones. Cuadernos enteros. Esas nunca las canto.', 'Sabia? Eu escrevo letras de música. Cadernos inteiros. Essas eu nunca canto.', 'Weißt du was? Ich schreibe Liedtexte. Ganze Hefte voll. Die singe ich nie.'),
    'd.r2.4': T('Those are quiet songs. And quiet scares me. “The strong one”, scared of quiet. Funny, right?', 'Son canciones tranquilas. Y el silencio me da miedo. «El fuerte», con miedo al silencio. Chistoso, ¿no?', 'São músicas calminhas. E o silêncio me dá medo. «O forte», com medo do silêncio. Engraçado, né?', 'Das sind leise Lieder. Und Stille macht mir Angst. «Der Starke» hat Angst vor Stille. Witzig, oder?'),
    'd.r2.5': T('But you don’t laugh at me. You laugh with me. That’s different.', 'Pero tú no te ríes de mí. Te ríes conmigo. Eso es diferente.', 'Mas você não ri de mim. Você ri comigo. É diferente.', 'Aber du lachst nicht über mich. Du lachst mit mir. Das ist was anderes.'),
    'd.r2.6': T('Hey. «{caes}» is for friends. «{gustas}» is… for more than friends. Just a fun fact! Totally random!', 'Oye. «Me caes bien» es para amigos. «Me gustas» es… para algo más. ¡Dato curioso! ¡Totalmente al azar!', 'Olha. «Vou com a sua cara» é pra amigos. «Tô a fim de você» é… pra algo mais. Curiosidade! Totalmente aleatória!', 'Hey. «Du bist mir sympathisch» ist für Freunde. «Du gefällst mir» ist … für mehr. Nur so ein Fun Fact! Total zufällig!'),
    'd.r2.7': T('…Oh. OH. Okay. My face is hot. It’s the forge. It’s definitely the forge.', '…Ah. ¡AH! Bueno. Me arde la cara. Es la forja. Seguro es la forja.', '…Ah. AH! Tá. Minha cara tá quente. É a forja. Com certeza é a forja.', '… Oh. OH. Okay. Mein Gesicht ist heiß. Das ist die Schmiede. Ganz sicher die Schmiede.'),
    'd.r2.yes': T('Really?! I mean… YES! Of course!', '¡¿En serio?! O sea… ¡SÍ! ¡Claro que sí!', 'Sério?! Quer dizer… SIM! Claro que sim!', 'Echt?! Ich meine … JA! Klar!'),
    'd.r2.no': T('Something else on your mind? No? Okay! I’ll keep hammering!', '¿Algo más? ¿No? ¡Bueno! ¡Sigo martillando!', 'Mais alguma coisa? Não? Beleza! Vou continuar martelando!', 'Noch was? Nein? Okay! Ich hämmer weiter!'),
    'd.r2.rival1': T('Wait! You smell like {w.candle:pl} and old books. You’re with the poet from the broken {w.house}!', '¡Espera! Hueles a velas y a libros viejos. ¡Estás con la poeta de la casa rota!', 'Peraí! Você tá com cheiro de vela e livro velho. Você tá com a poeta da casa caindo aos pedaços!', 'Moment! Du riechst nach Kerzen und alten Büchern. Du bist mit der Dichterin aus dem kaputten Haus zusammen!'),
    'd.r2.rival2': T('Then it’s official: we’re RIVALS! Friendly rivals. Very loud ones.', '¡Entonces es oficial: somos RIVALES! Rivales amistosos. Muy ruidosos.', 'Então é oficial: somos RIVAIS! Rivais amigáveis. Bem barulhentos.', 'Dann ist es offiziell: Wir sind RIVALEN! Freundliche Rivalen. Sehr laute.'),
    // rank 3
    'd.r3.1': T('I saw the {c.hill} turn green! From the top of the {w.tower}! I yelled so loud a pigeon fainted.', '¡Vi la colina ponerse verde! ¡Desde arriba de la torre! Grité tan fuerte que una paloma se desmayó.', 'Eu vi o morro ficar verde! Lá de cima da torre! Gritei tão alto que um pombo desmaiou.', 'Ich hab gesehen, wie der Hügel grün wurde! Von oben auf dem Turm! Ich hab so laut geschrien, dass eine Taube umgekippt ist.'),
    'd.r3.2': T('You fought the gray with words. I fight it with noise. Maybe words are better.', 'Tú peleaste contra lo gris con palabras. Yo peleo con ruido. A lo mejor las palabras son mejores.', 'Você lutou contra o cinza com palavras. Eu luto com barulho. Talvez palavras sejam melhores.', 'Du hast das Grau mit Wörtern bekämpft. Ich kämpfe mit Lärm. Vielleicht sind Wörter besser.'),
    'd.r3.3': T('My grandpa was a blacksmith too. He used to say: a {w.bell} sings because it’s empty inside.', 'Mi abuelo también era herrero. Decía: una campana canta porque está vacía por dentro.', 'O meu avô também era ferreiro. Ele dizia: um sino canta porque é vazio por dentro.', 'Mein Opa war auch Schmied. Er hat immer gesagt: Eine Glocke singt, weil sie innen leer ist.'),
    'd.r3.4': T('Quiet inside, loud outside. I didn’t get it. Maybe now I do. Maybe quiet is just… room.', 'Silencio adentro, ruido afuera. No lo entendía. Tal vez ahora sí. Tal vez el silencio es solo… espacio.', 'Silêncio por dentro, barulho por fora. Eu não entendia. Talvez agora eu entenda. Talvez o silêncio seja só… espaço.', 'Innen still, außen laut. Ich hab’s nicht verstanden. Vielleicht jetzt. Vielleicht ist Stille einfach … Platz.'),
    'd.r3.5': T('…You can hold my hand, you know. If you ask. My hands are big, but they’re gentle.', '…Me puedes tomar la mano, ¿eh? Si me lo pides. Tengo las manos grandes, pero suaves.', '…Você pode segurar a minha mão, tá? Se pedir. Minhas mãos são grandes, mas são delicadas.', '… Du darfst meine Hand halten, weißt du. Wenn du fragst. Meine Hände sind groß, aber sanft.'),
    // rank 4: his soft side, and a favor (write down his song while he sings it)
    'd.r4.1': T('You met the clockmaker in Molinar? He knew my grandpa!', '¿Conociste al relojero de Molinar? ¡Conocía a mi abuelo!', 'Você conheceu o relojoeiro de Molinar? Ele conhecia o meu avô!', 'Du hast den Uhrmacher in Molinar getroffen? Der kannte meinen Opa!'),
    'd.r4.2': T('Ciro says the {w.bell:pl} answer each other. If one rings, the others want to ring too.', 'Ciro dice que las campanas se contestan. Si una suena, las otras también quieren sonar.', 'O Ciro diz que os sinos se respondem. Se um toca, os outros também querem tocar.', 'Ciro sagt, die Glocken antworten einander. Wenn eine läutet, wollen die anderen auch läuten.'),
    'd.r4.3': T('Like people. Like… us.', 'Como las personas. Como… nosotros.', 'Que nem as pessoas. Que nem… a gente.', 'Wie Menschen. Wie … wir.'),
    'd.r4.4': T('One day I want to sing you something. But the words aren’t on paper yet.', 'Algún día te quiero cantar algo. Pero la letra todavía no está en papel.', 'Um dia eu quero cantar uma coisa pra você. Mas a letra ainda não tá no papel.', 'Eines Tages will ich dir was vorsingen. Aber der Text steht noch nicht auf Papier.'),
    'd.r4.5': T('My hands are full of coal. Can you write it down while I sing it? Slowly. Quietly.', 'Tengo las manos llenas de carbón. ¿Lo escribes tú mientras te lo canto? Despacio. Bajito.', 'Minhas mãos tão cheias de carvão. Você escreve enquanto eu canto? Devagar. Baixinho.', 'Meine Hände sind voller Kohle. Schreibst du mit, während ich singe? Langsam. Leise.'),
    'd.r4.6': T('You wrote it! You WROTE my song! …Sorry. Quietly: you wrote my song.', '¡Lo escribiste! ¡ESCRIBISTE mi canción! …Perdón. Bajito: escribiste mi canción.', 'Você escreveu! Você ESCREVEU a minha música! …Foi mal. Baixinho: você escreveu a minha música.', 'Du hast es aufgeschrieben! Du hast mein Lied AUFGESCHRIEBEN! … Sorry. Leise: Du hast mein Lied aufgeschrieben.'),
    'd.r4.7': T('Everyone calls me strong. You’re the first person who makes me feel like a songwriter.', 'Todos me dicen fuerte. Eres la primera persona que me hace sentir compositor.', 'Todo mundo me chama de forte. Você é a primeira pessoa que me faz sentir compositor.', 'Alle nennen mich stark. Du bist der erste Mensch, bei dem ich mich wie ein Songwriter fühle.'),
    'd.r4.skip': T('Not now? That’s okay! The song can wait. It’s patient. Unlike me.', '¿Ahora no? ¡Está bien! La canción puede esperar. Es paciente. Yo no.', 'Agora não? Tudo bem! A música pode esperar. Ela é paciente. Eu não.', 'Jetzt nicht? Kein Problem! Das Lied kann warten. Es ist geduldig. Anders als ich.'),
    // rank 5: the confession, and his song
    'd.r5.1': T('You heard it?! The first {w.bell}! I sang all night! Badly! Loudly!', '¡¿La oíste?! ¡La primera campana! ¡Canté toda la noche! ¡Mal! ¡Fuerte!', 'Você ouviu?! O primeiro sino! Eu cantei a noite toda! Mal! Alto!', 'Hast du’s gehört?! Die erste Glocke! Ich hab die ganze Nacht gesungen! Schlecht! Laut!'),
    'd.r5.2': T('And then I stopped. And it was quiet. And nothing took my words.', 'Y después me callé. Y todo quedó en silencio. Y nada se llevó mis palabras.', 'E depois eu parei. E ficou tudo em silêncio. E nada levou as minhas palavras.', 'Und dann hab ich aufgehört. Und es war still. Und nichts hat mir meine Wörter genommen.'),
    'd.r5.3': T('Because you were there. In my head. I think. …You look like you want to say something.', 'Porque estabas tú. En mi cabeza. Creo. …Tienes cara de querer decir algo.', 'Porque você tava lá. Na minha cabeça. Acho. …Você tá com cara de quem quer falar alguma coisa.', 'Weil du da warst. In meinem Kopf. Glaub ich. … Du siehst aus, als wolltest du was sagen.'),
    'd.r5.amo1': T('«{amo}»?! WOW! That’s what my grandma says to her soap operas!', '¡¿«Te amo»?! ¡GUAU! ¡Eso le dice mi abuela a su telenovela!', '«Te amo»?! UAU! É o que a minha avó fala pra novela dela!', '«Ich liebe dich»?! WOW! Das sagt meine Oma zu ihrer Telenovela!'),
    'd.r5.amo2': T('Let’s start with «{quiero}», okay? I’m a slow cooker. Like a good stew.', 'Empecemos con «te quiero», ¿sí? Yo soy de cocción lenta. Como un buen guiso.', 'Vamos começar com «gosto muito de você», tá? Eu sou de fogo baixo. Que nem um bom feijão.', 'Fangen wir mit «Ich hab dich lieb» an, okay? Ich brauch Zeit. Wie ein guter Eintopf.'),
    'd.r5.quiero': T('I love you too! …Sorry, that was LOUD. (quietly) I love you too.', '¡Yo también te quiero! …Perdón, eso fue MUY fuerte. (bajito) Yo también te quiero.', 'Eu também gosto muito de você! …Foi mal, isso foi ALTO. (baixinho) Eu também gosto muito de você.', 'Ich hab dich auch lieb! … Sorry, das war LAUT. (leise) Ich hab dich auch lieb.'),
    'd.r5.shy': T('No words? That’s okay. I’m learning that quiet is okay too.', '¿Sin palabras? Está bien. Estoy aprendiendo que el silencio también está bien.', 'Sem palavras? Tudo bem. Eu tô aprendendo que o silêncio também é bom.', 'Keine Worte? Schon okay. Ich lerne gerade, dass Stille auch okay ist.'),
    'd.r5.4': T('I wrote a song. I never sang it. Not even to the anvil. Listen.', 'Escribí una canción. Nunca la canté. Ni siquiera al yunque. Escucha.', 'Eu fiz uma música. Nunca cantei. Nem pra bigorna. Escuta.', 'Ich hab ein Lied geschrieben. Ich hab es nie gesungen. Nicht mal dem Amboss. Hör zu.'),
    'd.r5.5': T('…It’s quiet now. And I’m not scared at all.', '…Ahora hay silencio. Y no tengo nada de miedo.', '…Agora tá tudo quieto. E eu não tô com medo nenhum.', '… Jetzt ist es still. Und ich hab überhaupt keine Angst.'),
    'd.r5.6': T('Come here. A hug. A gentle one. I’m practicing gentle.', 'Ven aquí. Un abrazo. Uno suave. Estoy practicando ser delicado.', 'Vem cá. Um abraço. Bem de leve. Tô treinando ser delicado.', 'Komm her. Eine Umarmung. Eine sanfte. Ich übe gerade, sanft zu sein.'),
    'd.r5.7': T('Did you hear that? The {w.bell} rang true. Just once. That’s enough for today.', '¿Oíste eso? La campana sonó bien. Una sola vez. Por hoy es suficiente.', 'Você ouviu isso? O sino tocou certinho. Uma vez só. Por hoje tá bom.', 'Hast du das gehört? Die Glocke hat richtig geklungen. Nur einmal. Für heute reicht das.'),
    'd.gate.boss': T('Have you seen the gray {c.hill} east of town? Somebody should shout at it. With words!', '¿Viste la colina gris al este del pueblo? Alguien debería gritarle. ¡Con palabras!', 'Você viu o morro cinza a leste da vila? Alguém devia gritar com ele. Com palavras!', 'Hast du den grauen Hügel östlich vom Dorf gesehen? Jemand sollte ihn anschreien. Mit Wörtern!'),
    'd.gate.ciro': T('Go see Ciro, the clockmaker in Molinar! He knows everything about {w.bell:pl}. Then come tell me!', '¡Ve a ver a Ciro, el relojero de Molinar! Sabe todo de campanas. ¡Y luego me cuentas!', 'Vai falar com o Ciro, o relojoeiro de Molinar! Ele sabe tudo de sinos. Depois me conta!', 'Geh zu Ciro, dem Uhrmacher in Molinar! Der weiß alles über Glocken. Dann erzähl’s mir!'),
    'd.gate.bell': T('If one of the big {w.bell:pl} rings again, I’ll sing all night. Promise!', 'Si una de las campanas grandes vuelve a sonar, canto toda la noche. ¡Prometido!', 'Se um dos sinos grandes tocar de novo, eu canto a noite toda. Prometo!', 'Wenn eine der großen Glocken wieder läutet, sing ich die ganze Nacht. Versprochen!'),
    'd.chat.1': T('If you hear singing at three in the morning, that’s not the Hush. That’s me.', 'Si oyes cantar a las tres de la mañana, no es el Silencio. Soy yo.', 'Se você ouvir alguém cantando às três da manhã, não é o Silêncio. Sou eu.', 'Wenn du um drei Uhr morgens Gesang hörst, ist das nicht die Stille. Das bin ich.'),
    'd.chat.2': T('This anvil and I have been through a lot. Mostly my singing.', 'Este yunque y yo hemos pasado por mucho. Sobre todo por mis canciones.', 'Essa bigorna e eu já passamos por muita coisa. Principalmente pelas minhas músicas.', 'Dieser Amboss und ich haben viel zusammen durchgemacht. Vor allem meinen Gesang.'),
    'd.chat.3': T('Marta gives me {w.bread} for free if I sing quieter. I’ve never eaten free {w.bread}.', 'Marta me da pan gratis si canto más bajito. Nunca he comido pan gratis.', 'A Marta me dá pão de graça se eu cantar mais baixo. Nunca comi pão de graça.', 'Marta gibt mir gratis Brot, wenn ich leiser singe. Ich hab noch nie gratis Brot gegessen.'),
    'd.chat.4': T('You’re here! My favorite person! Don’t tell the anvil.', '¡Llegaste! ¡Mi persona favorita! No se lo digas al yunque.', 'Você chegou! Minha pessoa favorita! Não conta pra bigorna.', 'Du bist da! Mein Lieblingsmensch! Sag’s nicht dem Amboss.'),
    'd.chat.5': T('I sing quiet songs now. Sometimes. The pigeons are confused.', 'Ahora canto canciones bajitas. A veces. Las palomas están confundidas.', 'Agora eu canto músicas baixinhas. Às vezes. Os pombos tão confusos.', 'Ich singe jetzt leise Lieder. Manchmal. Die Tauben sind verwirrt.'),
    'd.cool': T('Again? Give me a minute, I’m in the middle of a {w.bell}!', '¿Otra vez? ¡Dame un minuto, que estoy con la campana!', 'De novo? Me dá um minutinho, tô no meio do sino!', 'Schon wieder? Gib mir eine Minute, ich bin mitten in einer Glocke!'),
    'd.wait': T('Did you talk to Morgana yet? Nicely?', '¿Ya hablaste con Morgana? ¿Bonito?', 'Já falou com a Morgana? Com carinho?', 'Hast du schon mit Morgana geredet? Nett?'),
    'd.switch.yes': T('Really?! YES! …Sorry, that was loud. Yes.', '¡¿En serio?! ¡SÍ! …Perdón, fue muy fuerte. Sí.', 'Sério?! SIM! …Foi mal, gritei. Sim.', 'Echt?! JA! … Sorry, das war laut. Ja.'),
    // his dates
    'd.d.words': T('Compliments? For me? Go! I’m ready! I’m SO ready!', '¿Cumplidos? ¿Para mí? ¡Dale! ¡Estoy listo! ¡Súper listo!', 'Elogios? Pra mim? Vai! Tô pronto! Prontíssimo!', 'Komplimente? Für mich? Los! Ich bin bereit! SO bereit!'),
    'd.d.wordsLove': T('Me? «{adj}»? Nobody ever says that! Say it louder! No, wait, quieter. I want to keep it.', '¿Yo? ¿«{adj}»? ¡Nadie me dice eso! ¡Dilo más fuerte! No, espera, más bajito. Me lo quiero guardar.', 'Eu? «{adj}»? Ninguém nunca me fala isso! Fala mais alto! Não, peraí, mais baixo. Quero guardar.', 'Ich? «{adj}»? Das sagt nie jemand! Sag’s lauter! Nein, warte, leiser. Das will ich behalten.'),
    'd.d.wordsOk': T('Ha! {c.thanks}! You’re making me blush. It’s the forge. Mostly.', '¡Ja! ¡Gracias! Me estás haciendo sonrojar. Es la forja. Más o menos.', 'Ha! Valeu! Assim eu fico vermelho. É a forja. Mais ou menos.', 'Ha! Danke! Ich werd ja rot. Das ist die Schmiede. Größtenteils.'),
    'd.d.wordsMeh': T('«{adj}». Yeah. Everybody says that. (sigh) …Thanks, though.', '«{adj}». Sí. Todo el mundo dice eso. (suspiro) …Gracias, igual.', '«{adj}». É. Todo mundo fala isso. (suspiro) …Valeu, mesmo assim.', '«{adj}». Ja. Das sagen alle. (seufz) … Trotzdem danke.'),
    'd.d.wordsSlip': T('«{adj}»? Ha! «{fix}», with an o. But I love it anyway!', '¿«{adj}»? ¡Ja! «{fix}», con o. ¡Pero me encanta igual!', '«{adj}»? Ha! «{fix}», com o. Mas eu adorei mesmo assim!', '«{adj}»? Ha! «{fix}». Aber ich find’s trotzdem toll!'),
    'd.d.wordsOdd': T('I don’t know that word, but it sounded nice! {c.thanks}!', 'No conozco esa palabra, ¡pero sonó bonito! ¡Gracias!', 'Não conheço essa palavra, mas soou bonito! Valeu!', 'Das Wort kenn ich nicht, aber es klang schön! Danke!'),
    'd.d.time': T('A walk! Around the plaza! I’ll try to talk quietly. No promises!', '¡Un paseo! ¡Por la plaza! Voy a intentar hablar bajito. ¡No prometo nada!', 'Um passeio! Pela praça! Vou tentar falar baixinho. Não prometo nada!', 'Ein Spaziergang! Über den Platz! Ich versuch, leise zu reden. Ich versprech nichts!'),
    'd.d.timeOk': T('YES! You listened! Every word! My heart is doing a drum solo!', '¡SÍ! ¡Me escuchaste! ¡Cada palabra! ¡Mi corazón está tocando un solo de batería!', 'SIM! Você escutou! Cada palavra! Meu coração tá fazendo um solo de bateria!', 'JA! Du hast zugehört! Jedes Wort! Mein Herz spielt ein Schlagzeugsolo!'),
    'd.d.timeNo': T('Ha! No! Was I too loud? I was too loud. I’ll tell it again sometime!', '¡Ja! ¡No! ¿Hablé muy fuerte? Hablé muy fuerte. ¡Te lo cuento otra vez otro día!', 'Ha! Não! Eu falei alto demais? Falei alto demais. Te conto de novo outro dia!', 'Ha! Nein! War ich zu laut? Ich war zu laut. Ich erzähl’s dir ein andermal nochmal!'),
    'd.d.gift': T('A GIFT?! For ME?! What is it, what is it?', '¡¿Un REGALO?! ¡¿Para MÍ?! ¿Qué es, qué es?', 'Um PRESENTE?! Pra MIM?! O que é, o que é?', 'Ein GESCHENK?! Für MICH?! Was ist es, was ist es?'),
    'd.g.honey': T('{w.honey}! For my throat! For singing! You understand me!', '¡MIEL! ¡Para mi garganta! ¡Para cantar! ¡Me entiendes!', 'MEL! Pra minha garganta! Pra cantar! Você me entende!', 'HONIG! Für meinen Hals! Zum Singen! Du verstehst mich!'),
    'd.g.bread': T('{w.bread}! From Marta’s bakery? Of course! Half for you! …Okay, a third.', '¡Pan! ¿De la panadería de Marta? ¡Claro que sí! ¡La mitad para ti! …Bueno, un tercio.', 'Pão! Da padaria da Marta? Claro que é! Metade pra você! …Tá, um terço.', 'Brot! Aus Martas Bäckerei? Na klar! Die Hälfte für dich! … Okay, ein Drittel.'),
    'd.g.newspaper': T('A {w.newspaper}? Words without music! …I’ll use it to light the forge. Thanks!', '¿Un periódico? ¡Palabras sin música! …Lo uso para prender la forja. ¡Gracias!', 'Um jornal? Palavras sem música! …Vou usar pra acender a forja. Valeu!', 'Eine Zeitung? Wörter ohne Musik! … Damit mach ich das Feuer an. Danke!'),
    'd.g.gum': T('{w.gum}! Last time it got stuck in my beard for a week.', '¡Chicle! La última vez se me pegó en la barba una semana.', 'Chiclete! Da última vez grudou na minha barba por uma semana.', 'Kaugummi! Letztes Mal klebte er eine Woche in meinem Bart.'),
    'd.g.flower': T('A {w.flower}! I’ll put it on the anvil. The anvil deserves nice things too.', '¡Una flor! La voy a poner en el yunque. El yunque también merece cosas bonitas.', 'Uma flor! Vou colocar na bigorna. A bigorna também merece coisas bonitas.', 'Eine Blume! Die leg ich auf den Amboss. Der Amboss verdient auch was Schönes.'),
    'd.g.hat': T('A {w.hat}! Now I look like a farmer who sings!', '¡Un sombrero! ¡Ahora parezco un granjero que canta!', 'Um chapéu! Agora eu pareço um fazendeiro cantor!', 'Ein Hut! Jetzt seh ich aus wie ein singender Bauer!'),
    'd.g.ok': T('For me? You’re the best! I’m going to eat it right now. With my eyes first.', '¿Para mí? ¡Eres lo máximo! Me lo voy a comer ya. Primero con los ojos.', 'Pra mim? Você é demais! Vou comer agora. Primeiro com os olhos.', 'Für mich? Du bist der Hammer! Ich ess das sofort. Erst mit den Augen.'),
    'd.d.bell': T('A favor? YES! Help me test the {w.bell}. I ring it, you count. How many rings?', '¿Un favor? ¡SÍ! Ayúdame a probar la campana. Yo la toco y tú cuentas. ¿Cuántas veces suena?', 'Um favor? SIM! Me ajuda a testar o sino. Eu toco e você conta. Quantas vezes ele toca?', 'Ein Gefallen? JA! Hilf mir, die Glocke zu testen. Ich läute, du zählst. Wie oft klingt sie?'),
    'd.d.bellOk': T('{n}! Exactly! What ears! From now on, you count my rings. Officially!', '¡{n}! ¡Exacto! ¡Qué oído! ¡Desde hoy cuentas mis campanadas oficialmente!', '{n}! Exatamente! Que ouvido! A partir de hoje você conta as minhas badaladas. Oficialmente!', '{n}! Genau! Was für Ohren! Ab heute zählst du offiziell meine Glockenschläge!'),
    'd.d.bellNo': T('Ha! No, it was {n}! Did you count the echo too? The echo doesn’t count!', '¡Ja! ¡No, fueron {n}! ¿Contaste el eco también? ¡El eco no cuenta!', 'Ha! Não, foram {n}! Você contou o eco também? O eco não conta!', 'Ha! Nein, es waren {n}! Hast du das Echo mitgezählt? Das Echo zählt nicht!'),
    'd.d.touch': T('Hm? What? You look like you want to ask something!', '¿Mmm? ¿Qué? ¡Tienes cara de querer preguntar algo!', 'Hum? Que foi? Você tá com cara de quem quer perguntar alguma coisa!', 'Hm? Was? Du siehst aus, als wolltest du was fragen!'),
    'd.d.touchYes': T('YES! I mean… yes. Gently. See? Gentle hands.', '¡SÍ! O sea… sí. Despacito. ¿Ves? Manos suaves.', 'SIM! Quer dizer… pode. Devagarinho. Viu? Mãos delicadas.', 'JA! Ich meine … ja. Ganz sanft. Siehst du? Sanfte Hände.'),
    'd.d.touchOrder': T('Whoa, whoa! Ask first! It’s nicer when you ask.', '¡Epa, epa! ¡Primero se pregunta! Es más bonito cuando preguntas.', 'Opa, opa! Primeiro pergunta! É mais bonito quando você pergunta.', 'Hoppla! Erst fragen! Es ist schöner, wenn du fragst.'),
    'd.d.touchHuh': T('Hold what? My hammer? Ha! Ask me properly!', '¿Tomar qué? ¿Mi martillo? ¡Ja! ¡Pregúntame bien!', 'Segurar o quê? O meu martelo? Ha! Pergunta direito!', 'Was halten? Meinen Hammer? Ha! Frag mich richtig!'),
    'd.d.touchAfter': T('Your hand smells like coal now. Sorry! Worth it!', 'Ahora tu mano huele a carbón. ¡Perdón! ¡Valió la pena!', 'Agora a sua mão tá com cheiro de carvão. Foi mal! Valeu a pena!', 'Jetzt riecht deine Hand nach Kohle. Sorry! Hat sich gelohnt!'),
    // breaking up with him (kindly)
    'd.bu.1': T('Uh-oh. Serious face. Is it the coal smell? I can shower more!', 'Uy. Cara seria. ¿Es por el olor a carbón? ¡Me puedo bañar más!', 'Xi. Cara séria. É o cheiro de carvão? Eu posso tomar mais banho!', 'Oh oh. Ernstes Gesicht. Ist es der Kohlegeruch? Ich kann öfter duschen!'),
    'd.bu.blunt': T('Ow! That hurt like a hammer on the thumb. Say it nicer, okay?', '¡Ay! Eso dolió como un martillazo en el dedo. Dilo más bonito, ¿sí?', 'Ai! Isso doeu que nem martelada no dedo. Fala com mais carinho, tá?', 'Au! Das tat weh wie ein Hammer auf den Daumen. Sag’s netter, okay?'),
    'd.bu.dodge': T('The weather’s perfect! …But that’s not it, is it?', '¡El clima está perfecto! …Pero no es eso, ¿verdad?', 'O tempo tá perfeito! …Mas não é isso, né?', 'Das Wetter ist perfekt! … Aber darum geht’s nicht, oder?'),
    'd.bu.ok1': T('…Ah. Okay. It hurts a little. But you said it nicely. Thanks.', '…Ah. Okay. Duele un poquito. Pero lo dijiste bonito. Gracias.', '…Ah. Tá. Dói um pouquinho. Mas você falou com carinho. Valeu.', '… Ah. Okay. Das tut ein bisschen weh. Aber du hast es schön gesagt. Danke.'),
    'd.bu.ok2': T('From now on: rivals! The loud kind! (sniff)', '¡Desde ahora, rivales! ¡De los ruidosos! (snif)', 'A partir de agora: rivais! Dos barulhentos! (snif)', 'Ab jetzt sind wir Rivalen! Die lauten! (schnief)'),

    // ---------------- rivals (Morgana's are dry and poetic; Dante's loud and playful)
    'mr.find': T('There you are. Hiding from me? How cute.', 'Ahí estás. ¿Te escondías de mí? Qué ternura.', 'Achei. Tava se escondendo de mim? Que fofura.', 'Da bist du ja. Versteckst du dich vor mir? Wie niedlich.'),
    'mr.duel': T('Let’s see if your words are sharper than your taste.', 'A ver si tus palabras son más afiladas que tu gusto.', 'Vamos ver se as suas palavras são mais afiadas que o seu gosto.', 'Mal sehen, ob deine Worte schärfer sind als dein Geschmack.'),
    'mr.chat': T('Hm. Your Dante is singing again. The crows filed a complaint.', 'Mmm. Tu Dante está cantando otra vez. Los cuervos pusieron una queja.', 'Hum. O seu Dante tá cantando de novo. Os corvos fizeram uma reclamação.', 'Hm. Dein Dante singt schon wieder. Die Krähen haben sich beschwert.'),
    'mr.decline': T('Running away? …Kidding. Next time.', '¿Huyendo? …Es broma. La próxima.', 'Fugindo? …Brincadeira. Na próxima.', 'Läufst du weg? … War nur Spaß. Nächstes Mal.'),
    'mr.hit': T('…Hm. Touché.', '…Mmm. Touché.', '…Hum. Touché.', '… Hm. Touché.'),
    'mr.misfire': T('Was that… supposed to hurt? Adorable.', '¿Eso… debía doler? Qué ternura.', 'Isso… era pra doer? Que fofura.', 'Sollte das … wehtun? Niedlich.'),
    'mr.other': T('That’s the answer to a different insult. Listen better.', 'Esa respuesta es para otro insulto. Escucha mejor.', 'Essa resposta é pra outra provocação. Escuta direito.', 'Das ist die Antwort auf eine andere Gemeinheit. Hör besser zu.'),
    'mr.fizzle': T('And? That’s it? It sort of… trailed off.', '¿Y? ¿Eso es todo? Se quedó a medias.', 'E? Só isso? Ficou pela metade.', 'Und? Das war’s? Das ist irgendwie … verpufft.'),
    'mr.tongue': T('Cat got your tongue? Poe’s, maybe.', '¿Te comió la lengua el gato? El mío, tal vez.', 'O gato comeu a sua língua? O meu, talvez.', 'Hat dir die Katze die Zunge geklaut? Meine vielleicht.'),
    'mr.win': T('Fine. You win this one. Don’t get used to it.', 'Bueno. Ganaste esta vez. No te acostumbres.', 'Tá bom. Você ganhou dessa vez. Não se acostuma.', 'Na gut. Diesmal hast du gewonnen. Gewöhn dich nicht dran.'),
    'mr.lose': T('As expected. Go back to your noisy little forge.', 'Como era de esperarse. Vuelve a tu forja ruidosa.', 'Como eu esperava. Volta pra sua forja barulhenta.', 'Wie erwartet. Geh zurück zu deiner lauten kleinen Schmiede.'),
    'mr.crack.1': T('You won again. It’s irritating.', 'Ganaste otra vez. Es irritante.', 'Você ganhou de novo. É irritante.', 'Du hast schon wieder gewonnen. Das nervt.'),
    'mr.crack.2': T('You know what? I wrote about you.', '¿Sabes qué? Escribí sobre ti.', 'Sabe de uma coisa? Eu escrevi sobre você.', 'Weißt du was? Ich hab über dich geschrieben.'),
    'mr.crack.3': T('At first they were insults. They rhymed really well.', 'Al principio eran insultos. Rimaban muy bien.', 'No começo eram insultos. Rimavam muito bem.', 'Am Anfang waren es Beleidigungen. Die haben sich super gereimt.'),
    'mr.crack.4': T('Now… I don’t know what they are.', 'Ahora… no sé qué son.', 'Agora… eu não sei o que são.', 'Jetzt … weiß ich nicht, was sie sind.'),
    'mr.crack.5': T('Forget it. Go back to your singer.', 'Olvídalo. Ve con tu cantante.', 'Esquece. Volta pro seu cantor.', 'Vergiss es. Geh zu deinem Sänger.'),
    'mr.crack.again': T('You, winning again. You know what I think. I’m not saying it twice.', 'Tú, ganando otra vez. Ya sabes lo que pienso. No lo voy a repetir.', 'Você, ganhando de novo. Você sabe o que eu penso. Não vou repetir.', 'Du, schon wieder am Gewinnen. Du weißt, was ich denke. Ich sag’s nicht zweimal.'),
    'mr.crack.ask': T('You’re with Dante. Talk to him first. Kindly. He doesn’t deserve {c.silence}.', 'Estás con Dante. Habla con él primero. Con cariño. Él no merece silencio.', 'Você tá com o Dante. Fala com ele primeiro. Com carinho. Ele não merece silêncio.', 'Du bist mit Dante zusammen. Rede zuerst mit ihm. Lieb. Er hat kein Schweigen verdient.'),
    'dr.find': T('THERE you are! I looked everywhere! Well, in two places! Duel time!', '¡AHÍ estás! ¡Te busqué por todas partes! ¡Bueno, en dos lugares! ¡Hora del duelo!', 'AÍ está você! Te procurei em todo lugar! Tá, em dois lugares! Hora do duelo!', 'DA bist du! Ich hab überall gesucht! Okay, an zwei Stellen! Duellzeit!'),
    'dr.duel': T('Word duel! Right now! Three rounds! Loser buys the {w.bread}!', '¡Duelo de palabras! ¡Ahora mismo! ¡Tres rondas! ¡Quien pierda paga el pan!', 'Duelo de palavras! Agora! Três rodadas! Quem perder paga o pão!', 'Wortduell! Sofort! Drei Runden! Wer verliert, zahlt das Brot!'),
    'dr.chat': T('Ah, the poet’s better half! Ready to lose another duel?', '¡Ah, la media naranja de la poeta! ¿Con ganas de perder otro duelo?', 'Ah, a cara-metade da poeta! Bora perder mais um duelo?', 'Ah, die bessere Hälfte der Dichterin! Bereit für die nächste Niederlage?'),
    'dr.decline': T('Next time, then! I’ll be warming up my voice!', '¡La próxima, entonces! ¡Voy a calentar la voz!', 'Na próxima, então! Vou aquecer a voz!', 'Dann nächstes Mal! Ich wärm schon mal meine Stimme auf!'),
    'dr.hit': T('OOF! Good one!', '¡UF! ¡Buena esa!', 'AI! Essa foi boa!', 'AUTSCH! Der war gut!'),
    'dr.misfire': T('Ha! What was THAT? Point for me!', '¡Ja! ¿Qué fue ESO? ¡Punto para mí!', 'Rá! Que foi ISSO? Ponto pra mim!', 'Ha! Was war DAS denn? Punkt für mich!'),
    'dr.other': T('Wrong comeback! You’re answering something I didn’t say!', '¡Esa no va! ¡Contestas algo que no dije!', 'Errou! Você tá respondendo uma coisa que eu nem falei!', 'Falsche Antwort! Das hab ich gar nicht gesagt!'),
    'dr.fizzle': T('Huh? That came out all crooked! Point for me!', '¿Eh? ¡Eso salió todo chueco! ¡Punto para mí!', 'Hã? Isso saiu todo torto! Ponto pra mim!', 'Hä? Das kam ganz schief raus! Punkt für mich!'),
    'dr.tongue': T('No comeback? HA! The anvil talks more than you!', '¿Sin respuesta? ¡JA! ¡El yunque habla más que tú!', 'Sem resposta? HA! A bigorna fala mais que você!', 'Keine Antwort? HA! Der Amboss redet mehr als du!'),
    'dr.win': T('You beat me! Ugh! Respect! Real respect!', '¡Me ganaste! ¡Uf! ¡Respeto! ¡Respeto de verdad!', 'Você ganhou de mim! Ai! Respeito! Respeito de verdade!', 'Du hast mich besiegt! Mann! Respekt! Echter Respekt!'),
    'dr.lose': T('HA! Victory! I’ll write a song about it! A loud one!', '¡JA! ¡Gané! ¡Voy a escribir una canción sobre esto! ¡Una muy fuerte!', 'HA! Ganhei! Vou fazer uma música sobre isso! Bem alta!', 'HA! Gewonnen! Darüber schreib ich ein Lied! Ein lautes!'),
    'dr.crack.1': T('You beat me AGAIN! Three times! Nobody beats me three times!', '¡Me ganaste OTRA vez! ¡Tres veces! ¡Nadie me gana tres veces!', 'Você ganhou de mim DE NOVO! Três vezes! Ninguém ganha de mim três vezes!', 'Du hast mich SCHON WIEDER besiegt! Dreimal! Niemand besiegt mich dreimal!'),
    'dr.crack.2': T('…Okay. I’ll tell you the truth.', '…Okay. Te voy a decir la verdad.', '…Tá. Vou te falar a verdade.', '… Okay. Ich sag dir die Wahrheit.'),
    'dr.crack.3': T('I don’t want to be your rival. I want to be… the one who sings with you.', 'No quiero ser tu rival. Quiero ser… el que canta contigo.', 'Eu não quero ser seu rival. Quero ser… o que canta com você.', 'Ich will nicht dein Rivale sein. Ich will … der sein, der mit dir singt.'),
    'dr.crack.4': T('Ugh! Forget I said that! LA LA LA!', '¡Ay! ¡Olvida lo que dije! ¡LA LA LA!', 'Ai! Esquece o que eu falei! LÁ LÁ LÁ!', 'Ach! Vergiss, was ich gesagt hab! LA LA LA!'),
    'dr.crack.again': T('Three wins again! You know how I feel, right? I’m not saying it again. Too loud.', '¡Tres victorias otra vez! Ya sabes lo que siento, ¿no? No lo repito. Es muy fuerte.', 'Três vitórias de novo! Você sabe o que eu sinto, né? Não vou repetir. É alto demais.', 'Schon wieder drei Siege! Du weißt, was ich fühle, oder? Ich sag’s nicht nochmal. Zu laut.'),
    'dr.crack.ask': T('Really? But you’re with Morgana! Talk to her first. Nicely, okay? She deserves nice words.', '¿En serio? ¡Pero estás con Morgana! Habla con ella primero. Bonito, ¿eh? Ella merece palabras bonitas.', 'Sério? Mas você tá com a Morgana! Fala com ela primeiro. Com carinho, tá? Ela merece palavras bonitas.', 'Echt? Aber du bist mit Morgana zusammen! Rede zuerst mit ihr. Nett, okay? Sie verdient schöne Worte.'),
    // ---------------- «Amor en Silencio»: the telenovela's big moments (2026-11-09, "make the love plots with both of them act
    // like a telenovela"); see TN
    'm.tn.rival': T('This… isn’t over.', 'Esto… no se va a quedar así.', 'Isso… não vai ficar assim.', 'Das … ist noch nicht vorbei.'),
    'd.tn.rival': T('My {w.heart} is on fire… with jealousy!', '¡Mi corazón está en llamas… de celos!', 'Meu coração tá pegando fogo… de ciúme!', 'Mein Herz brennt … vor Eifersucht!'),
    'mr.tn.crack': T('No. No, no, no. This can’t be happening.', 'No. No, no, no. Esto no puede estar pasando.', 'Não. Não, não, não. Isso não pode estar acontecendo.', 'Nein. Nein, nein, nein. Das darf nicht wahr sein.'),
    'dr.tn.crack': T('Why is my {w.heart} beating so loud?!', '¡¿Por qué me late tan fuerte el corazón?!', 'Por que o meu coração tá batendo tão forte?!', 'Warum schlägt mein Herz so laut?!'),
    'm.tn.bu': T('I knew it. I saw it in your eyes… and in my {w.poem:pl}.', 'Lo sabía. Lo vi en tus ojos… y en mis poemas.', 'Eu sabia. Eu vi nos seus olhos… e nos meus poemas.', 'Ich wusste es. Ich hab’s in deinen Augen gesehen … und in meinen Gedichten.'),
    'd.tn.bu': T('Oh, my {w.heart}! …No, it’s fine. It’s made of iron. It can take it.', '¡Ay, mi corazón! …No, está bien. Es de hierro. Aguanta.', 'Ai, meu coração! …Não, tudo bem. Ele é de ferro. Aguenta.', 'Oh, mein Herz! … Nein, schon gut. Es ist aus Eisen. Es hält das aus.'),
  };
  // your own lines (English, with weave slots)
  const YOU = {
    poems: 'I read your {w.poem:pl}. They led me here.',
    hush: 'The Hush… it takes the words of people who stop using them.',
    why: 'They’re really good. Why do you hide them?',
    bigjob: 'That sounds like a big job.',
    whynot: 'Why not?',
    nobody: 'There’s nobody here but us… and Poe… and {mimo}.',
    talk: 'Can we talk? It’s important.',
    ruin: 'Poe squeezed between the boards! …Somebody’s up there.',
    ladder: 'A rope ladder! The way up.',
  };
  // ---------------- poems and the song (line by line: the language, and each line's English, shown on request: EN on the card)
  const POEM_TEXT = [
    { en: ['If you’re looking for me, don’t look at the sun.', 'Follow the shadow that meows.', 'It waits where the noise ends.'],
      es: ['Si me buscas, no mires el sol.', 'Sigue a la sombra que maúlla.', 'Te espera donde termina el ruido.'],
      pt: ['Se você me procura, não olhe o sol.', 'Siga a sombra que mia.', 'Ela te espera onde o barulho acaba.'],
      de: ['Wenn du mich suchst, schau nicht zur Sonne.', 'Folge dem Schatten, der miaut.', 'Er wartet, wo der Lärm aufhört.'] },
    { en: ['Here the town ends', 'and the broken bricks begin.', 'Walk north, slowly:', 'the old houses don’t shout.'],
      es: ['Aquí se acaba el pueblo', 'y empiezan los ladrillos rotos.', 'Camina hacia el norte, despacio:', 'las casas viejas no gritan.'],
      pt: ['Aqui a vila acaba', 'e começam os tijolos quebrados.', 'Ande pro norte, devagar:', 'as casas velhas não gritam.'],
      de: ['Hier hört das Dorf auf', 'und die kaputten Ziegel fangen an.', 'Geh nach Norden, langsam:', 'Die alten Häuser schreien nicht.'] },
    { en: ['Everyone looks at the theater.', 'Nobody looks back.', 'The house broken in two', 'keeps a secret upstairs.'],
      es: ['Todos miran el teatro.', 'Nadie mira atrás.', 'La casa partida en dos', 'guarda un secreto arriba.'],
      pt: ['Todo mundo olha o teatro.', 'Ninguém olha pra trás.', 'A casa partida em duas', 'guarda um segredo lá em cima.'],
      de: ['Alle schauen aufs Theater.', 'Keiner schaut zurück.', 'Das Haus, in zwei zerbrochen,', 'hat oben ein Geheimnis.'] },
    { en: ['If you made it this far,', 'you know how to read in silence.', 'Now come up and say it out loud:', 'I don’t want to be alone anymore.'],
      es: ['Si llegaste hasta aquí,', 'sabes leer en silencio.', 'Ahora sube y dilo en voz alta:', 'ya no quiero estar sola.'],
      pt: ['Se você chegou até aqui,', 'sabe ler em silêncio.', 'Agora suba e diga em voz alta:', 'eu não quero mais ficar sozinha.'],
      de: ['Wenn du bis hierher gekommen bist,', 'kannst du still lesen.', 'Jetzt komm hoch und sag es laut:', 'Ich will nicht mehr allein sein.'] },
  ];
  // her grandmother's favorite (you read it out loud for her, rank 4)
  const GRAN_POEM = { en: ['The moon doesn’t speak,', 'but everyone listens to it.'], es: ['La luna no habla,', 'pero todos la escuchan.'],
    pt: ['A lua não fala,', 'mas todo mundo escuta.'], de: ['Der Mond spricht nicht,', 'doch alle hören ihm zu.'] };
  // hers, read on the theater's steps (rank 5)
  const M_POEM = { en: ['I lived up in an attic', 'with a cat and a candle.', 'Someone climbed up, talking,', 'and the silence turned into stars.'],
    es: ['Vivía en un ático', 'con un gato y una vela.', 'Subió alguien hablando', 'y el silencio se hizo estrella.'],
    pt: ['Eu morava num sótão', 'com um gato e uma vela.', 'Subiu alguém falando', 'e o silêncio virou estrela.'],
    de: ['Ich wohnte unterm Dach', 'mit Katze und mit Kerze.', 'Dann kam wer, der was sprach,', 'und aus Stille wurden Sterne.'] };
  // his, sung softly (rank 5); its first two lines are the ones you write down for him (rank 4)
  const D_SONG = { en: ['My bell has a crack,', 'but it still sings.', 'And when you are near,', 'silence doesn’t scare me.'],
    es: ['Mi campana tiene una grieta,', 'pero todavía canta.', 'Y si tú estás cerca,', 'el silencio no me espanta.'],
    pt: ['Meu sino tem uma rachadura,', 'mas ainda canta.', 'E se você tá por perto,', 'o silêncio não me espanta.'],
    de: ['Meine Glocke hat einen Riss,', 'doch sie singt jeden Tag.', 'Und wenn du bei mir bist,', 'ist die Stille, was ich mag.'],
    en_de: ['My bell has a crack,', 'but it sings every day.', 'And when you are with me,', 'silence is what I like.'] };     // (the German rhymes its own way)

  // ---------------- words of affirmation: which adjectives they love, take, or roll their eyes at; agreement slips
  // (Morgana is a woman: -a; Dante a man: -o. German predicate adjectives don't change.)
  const ADJ = {
    morgana: {
      es: { love: ['inteligente', 'lista', 'misteriosa', 'valiente', 'interesante', 'creativa', 'talentosa', 'original', 'unica', 'poetica', 'brillante', 'sabia', 'fascinante'],
        ok: ['amable', 'simpatica', 'buena', 'divertida', 'graciosa', 'especial', 'increible', 'genial', 'maravillosa', 'fuerte', 'elegante', 'chida', 'buena onda', 'chevere', 'genia'],
        meh: ['linda', 'bonita', 'tierna', 'guapa', 'hermosa', 'mona', 'dulce', 'adorable', 'preciosa', 'bella', 'cute'],
        slip: { listo: 'lista', misterioso: 'misteriosa', creativo: 'creativa', talentoso: 'talentosa', unico: 'única', poetico: 'poética', sabio: 'sabia', simpatico: 'simpática', bueno: 'buena', divertido: 'divertida', gracioso: 'graciosa', maravilloso: 'maravillosa', lindo: 'linda', bonito: 'bonita', tierno: 'tierna', guapo: 'guapa', hermoso: 'hermosa', precioso: 'preciosa', bello: 'bella' } },
      pt: { love: ['inteligente', 'misteriosa', 'corajosa', 'interessante', 'criativa', 'talentosa', 'original', 'unica', 'poetica', 'brilhante', 'sabia', 'fascinante', 'esperta'],
        ok: ['gentil', 'simpatica', 'legal', 'divertida', 'engracada', 'especial', 'incrivel', 'demais', 'maravilhosa', 'forte', 'elegante', 'top', 'massa', 'sensacional', 'figura', 'gente boa'],
        meh: ['linda', 'bonita', 'fofa', 'meiga', 'bonitinha', 'gata', 'gracinha', 'querida', 'cheirosa', 'bela', 'cute'],
        slip: { misterioso: 'misteriosa', corajoso: 'corajosa', criativo: 'criativa', talentoso: 'talentosa', unico: 'única', poetico: 'poética', esperto: 'esperta', simpatico: 'simpática', divertido: 'divertida', engracado: 'engraçada', maravilhoso: 'maravilhosa', lindo: 'linda', bonito: 'bonita', fofo: 'fofa', sabio: 'sábia' } },
      de: { love: ['klug', 'intelligent', 'geheimnisvoll', 'mutig', 'interessant', 'kreativ', 'talentiert', 'originell', 'einzigartig', 'potisch' /* poetisch, as canon() spells it */, 'brillant', 'faszinierend', 'tiefgrundig'],
        ok: ['nett', 'lieb', 'lustig', 'witzig', 'toll', 'besonders', 'super', 'wunderbar', 'cool', 'stark', 'elegant', 'klasse', 'spitze', 'sympathisch', 'freundlich'],
        meh: ['hubsch', 'suss', 'niedlich', 'wunderschon', 'goldig', 'putzig', 'knuffig', 'cute'], slip: {} },
    },
    dante: {
      es: { love: ['amable', 'divertido', 'gracioso', 'chistoso', 'creativo', 'buena persona', 'persona buena', 'buena gente', 'buena onda', 'generoso', 'carinoso', 'talentoso', 'dulce', 'tierno', 'buen cantante', 'gentil', 'noble'],
        ok: ['simpatico', 'genial', 'increible', 'especial', 'inteligente', 'valiente', 'interesante', 'guapo', 'lindo', 'bueno', 'chido', 'chevere', 'maravilloso', 'lo maximo'],
        meh: ['fuerte', 'grande', 'alto', 'enorme', 'musculoso', 'forzudo', 'grandote', 'fortachon'],
        slip: { divertida: 'divertido', graciosa: 'gracioso', chistosa: 'chistoso', creativa: 'creativo', generosa: 'generoso', carinosa: 'cariñoso', talentosa: 'talentoso', tierna: 'tierno', simpatica: 'simpático', guapa: 'guapo', linda: 'lindo', buena: 'bueno', maravillosa: 'maravilloso', alta: 'alto', musculosa: 'musculoso' } },
      pt: { love: ['gentil', 'engracado', 'divertido', 'criativo', 'boa pessoa', 'pessoa boa', 'gente boa', 'generoso', 'carinhoso', 'talentoso', 'fofo', 'doce', 'bom cantor', 'querido', 'atencioso'],
        ok: ['legal', 'incrivel', 'especial', 'inteligente', 'corajoso', 'simpatico', 'demais', 'lindo', 'bonito', 'top', 'massa', 'maravilhoso', 'bom', 'sensacional'],
        meh: ['forte', 'grande', 'alto', 'enorme', 'musculoso', 'grandao', 'fortao', 'parrudo'],
        slip: { engracada: 'engraçado', divertida: 'divertido', criativa: 'criativo', generosa: 'generoso', carinhosa: 'carinhoso', talentosa: 'talentoso', fofa: 'fofo', querida: 'querido', simpatica: 'simpático', linda: 'lindo', bonita: 'bonito', corajosa: 'corajoso', boa: 'bom', maravilhosa: 'maravilhoso' } },
      de: { love: ['nett', 'lieb', 'lustig', 'witzig', 'kreativ', 'guter mensch', 'freundlich', 'herzlich', 'grosszugig', 'talentiert', 'sanft', 'sus', 'suss', 'guter sanger'],
        ok: ['toll', 'super', 'cool', 'klug', 'mutig', 'besonders', 'wunderbar', 'hubsch', 'klasse', 'spitze', 'interessant', 'intelligent', 'sympathisch', 'wunderschon', 'hammer'],
        meh: ['stark', 'gross', 'kraftig', 'riesig', 'muskulos', 'breit', 'massig'], slip: {} },
    },
  };
  const ADJ_MODEL = { morgana: { es: 'Eres muy inteligente.', pt: 'Você é muito inteligente.', de: 'Du bist sehr klug.', en: 'You’re very smart.' },
    dante: { es: 'Eres muy amable.', pt: 'Você é muito gentil.', de: 'Du bist sehr nett.', en: 'You’re very kind.' } };

  // ---------------- quality time: a little story (3 lines), then a question about it, with three answers (the first is right)
  const S3 = (en, es, pt, de) => ({ en, es, pt, de });
  const STORIES = {
    morgana: [
      { lines: [S3('When I was nine, I wrote my first {w.poem}.', 'A los nueve años escribí mi primer poema.', 'Aos nove anos eu escrevi o meu primeiro poema.', 'Mit neun hab ich mein erstes Gedicht geschrieben.'),
        S3('It was about my grandmother’s {w.cat}, Sombra.', 'Era sobre la gata de mi abuela, Sombra.', 'Era sobre a gata da minha avó, a Sombra.', 'Es ging um die Katze von meiner Oma, Schatten.'),
        S3('She was gray, and very, very lazy.', 'Era gris y muy, muy perezosa.', 'Ela era cinza e muito, muito preguiçosa.', 'Sie war grau und sehr, sehr faul.')],
        q: S3('So. What was the cat called?', 'A ver. ¿Cómo se llamaba la gata?', 'Então. Como a gata se chamava?', 'Also. Wie hieß die Katze?'),
        a: [S3('Sombra.', 'Sombra.', 'Sombra.', 'Schatten.'), S3('Poe.', 'Poe.', 'Poe.', 'Poe.'), S3('Luna.', 'Luna.', 'Luna.', 'Luna.')] },
      { lines: [S3('I don’t like the sun much.', 'No me gusta mucho el sol.', 'Eu não gosto muito do sol.', 'Ich mag die Sonne nicht so.'),
        S3('But the moon… the moon I love.', 'Pero la luna… la luna me encanta.', 'Mas a lua… a lua eu amo.', 'Aber den Mond … den Mond liebe ich.'),
        S3('At night I write by the {w.window} until the {w.candle:pl} go out.', 'De noche escribo junto a la ventana hasta que se apagan las velas.', 'De noite eu escrevo perto da janela até as velas apagarem.', 'Nachts schreibe ich am Fenster, bis die Kerzen ausgehen.')],
        q: S3('When do I write?', '¿Cuándo escribo?', 'Quando eu escrevo?', 'Wann schreibe ich?'),
        a: [S3('At night.', 'De noche.', 'De noite.', 'Nachts.'), S3('In the morning.', 'Por la mañana.', 'De manhã.', 'Morgens.'), S3('At noon.', 'Al mediodía.', 'Ao meio-dia.', 'Mittags.')] },
      { lines: [S3('Everyone thinks my favorite color is black.', 'Todos creen que mi color favorito es el negro.', 'Todo mundo acha que a minha cor favorita é preto.', 'Alle denken, meine Lieblingsfarbe ist Schwarz.'),
        S3('It isn’t. It’s purple. Like plums.', 'No lo es. Es el morado. Como las ciruelas.', 'Não é. É roxo. Que nem ameixa.', 'Ist sie nicht. Es ist Lila. Wie Pflaumen.'),
        S3('The color of the sky just before night.', 'El color del cielo justo antes de la noche.', 'A cor do céu logo antes da noite.', 'Die Farbe vom Himmel kurz vor der Nacht.')],
        q: S3('My favorite color?', '¿Mi color favorito?', 'Minha cor favorita?', 'Meine Lieblingsfarbe?'),
        a: [S3('Purple.', 'Morado.', 'Roxo.', 'Lila.'), S3('Black.', 'Negro.', 'Preto.', 'Schwarz.'), S3('Red.', 'Rojo.', 'Vermelho.', 'Rot.')] },
      { lines: [S3('Poe isn’t really my {w.cat}.', 'En realidad, Poe no es mi gato.', 'Na verdade, o Poe não é meu gato.', 'Poe ist eigentlich nicht mein Kater.'),
        S3('One night he came in through the {w.window} and stayed.', 'Una noche entró por la ventana y se quedó.', 'Uma noite ele entrou pela janela e ficou.', 'Eines Nachts kam er durchs Fenster und ist geblieben.'),
        S3('Now he thinks the attic is his. He’s probably right.', 'Ahora cree que el ático es suyo. Seguro tiene razón.', 'Agora ele acha que o sótão é dele. Deve ter razão.', 'Jetzt glaubt er, der Dachboden gehört ihm. Wahrscheinlich hat er recht.')],
        q: S3('How did Poe get in?', '¿Cómo entró Poe?', 'Como o Poe entrou?', 'Wie ist Poe reingekommen?'),
        a: [S3('Through the window.', 'Por la ventana.', 'Pela janela.', 'Durchs Fenster.'), S3('Through the door.', 'Por la puerta.', 'Pela porta.', 'Durch die Tür.'), S3('In a box.', 'En una caja.', 'Numa caixa.', 'In einer Kiste.')] },
    ],
    dante: [
      { lines: [S3('My grandpa made {w.bell:pl} for six villages.', 'Mi abuelo hizo campanas para seis pueblos.', 'O meu avô fez sinos pra seis vilas.', 'Mein Opa hat Glocken für sechs Dörfer gemacht.'),
        S3('He could hear when a {w.bell} was sad.', 'Él sabía cuándo una campana estaba triste.', 'Ele sabia quando um sino tava triste.', 'Er konnte hören, wenn eine Glocke traurig war.'),
        S3('A sad {w.bell} rings a little lower, he said.', 'Decía que una campana triste suena un poco más grave.', 'Ele dizia que um sino triste toca um pouco mais grave.', 'Eine traurige Glocke klingt ein bisschen tiefer, hat er gesagt.')],
        q: S3('For how many villages did he make {w.bell:pl}?', '¿Para cuántos pueblos hizo campanas?', 'Pra quantas vilas ele fez sinos?', 'Für wie viele Dörfer hat er Glocken gemacht?'),
        a: [S3('For six.', 'Para seis.', 'Pra seis.', 'Für sechs.'), S3('For two.', 'Para dos.', 'Pra duas.', 'Für zwei.'), S3('For ten.', 'Para diez.', 'Pra dez.', 'Für zehn.')] },
      { lines: [S3('Every morning I eat three breads from Marta’s bakery.', 'Todas las mañanas me como tres panes de la panadería de Marta.', 'Toda manhã eu como três pães da padaria da Marta.', 'Jeden Morgen esse ich drei Brötchen aus Martas Bäckerei.'),
        S3('Marta says I’m her best customer.', 'Marta dice que soy su mejor cliente.', 'A Marta diz que eu sou o melhor cliente dela.', 'Marta sagt, ich bin ihr bester Kunde.'),
        S3('I say she’s my best friend. With {w.bread}.', 'Yo digo que ella es mi mejor amiga. Con pan.', 'Eu digo que ela é a minha melhor amiga. Com pão.', 'Ich sage, sie ist meine beste Freundin. Mit Brot.')],
        q: S3('Where do I get my {w.bread}?', '¿Dónde compro el pan?', 'Onde eu compro pão?', 'Wo kaufe ich mein Brot?'),
        a: [S3('At Marta’s bakery.', 'En la panadería de Marta.', 'Na padaria da Marta.', 'In Martas Bäckerei.'), S3('At the market.', 'En el mercado.', 'No mercado.', 'Auf dem Markt.'), S3('At the inn.', 'En la posada.', 'Na pousada.', 'Im Gasthaus.')] },
      { lines: [S3('I hate {c.silence} at night.', 'Odio el silencio de noche.', 'Eu odeio o silêncio de noite.', 'Ich hasse die Stille in der Nacht.'),
        S3('So I sleep with the {w.window} open.', 'Por eso duermo con la ventana abierta.', 'Por isso eu durmo com a janela aberta.', 'Deshalb schlafe ich mit offenem Fenster.'),
        S3('The ducks from the pond sing to me. Badly. But they try.', 'Los patos del estanque me cantan. Mal. Pero lo intentan.', 'Os patos do lago cantam pra mim. Mal. Mas tentam.', 'Die Enten vom Teich singen mir was vor. Schlecht. Aber sie geben sich Mühe.')],
        q: S3('Who sings to me at night?', '¿Quién me canta de noche?', 'Quem canta pra mim de noite?', 'Wer singt mir nachts was vor?'),
        a: [S3('The ducks.', 'Los patos.', 'Os patos.', 'Die Enten.'), S3('The birds.', 'Los pájaros.', 'Os passarinhos.', 'Die Vögel.'), S3('Bruno.', 'Bruno.', 'O Bruno.', 'Bruno.')] },
      { lines: [S3('I’m learning the guitar.', 'Estoy aprendiendo a tocar la guitarra.', 'Tô aprendendo a tocar violão.', 'Ich lerne Gitarre.'),
        S3('Tito from the plaza is teaching me.', 'Tito, el de la plaza, me está enseñando.', 'O Tito, da praça, tá me ensinando.', 'Tito vom Platz bringt es mir bei.'),
        S3('My fingers get all tangled. But I keep trying.', 'Se me enredan los dedos. Pero sigo intentando.', 'Meus dedos se enrolam. Mas eu continuo tentando.', 'Meine Finger verheddern sich. Aber ich übe weiter.')],
        q: S3('Who’s teaching me the guitar?', '¿Quién me enseña guitarra?', 'Quem tá me ensinando violão?', 'Wer bringt mir Gitarre bei?'),
        a: [S3('Tito.', 'Tito.', 'O Tito.', 'Tito.'), S3('Marta.', 'Marta.', 'A Marta.', 'Marta.'), S3('Bruno.', 'Bruno.', 'O Bruno.', 'Bruno.')] },
    ],
  };

  // ---------------- gifts: what they love (a special line), dislike (a funny one, no heart), or simply take
  const GIFTS = {
    morgana: { 'w.newspaper': 'love', 'w.chocolate': 'love', 'w.flower': 'love', 'w.candy': 'no', 'w.gum': 'no', 'w.hat': 'no', 'w.soda': 'no' },
    dante: { 'w.honey': 'love', 'w.bread': 'love', 'w.flower': 'love', 'w.hat': 'love', 'w.newspaper': 'no', 'w.gum': 'no' },
  };
  // (things you can give without an article: «Te traje miel», «Ich hab dir Honig mitgebracht»)
  const MASS = { es: ['w.honey', 'w.chocolate', 'w.cheese', 'w.bread', 'w.juice'], pt: ['w.honey', 'w.chocolate', 'w.cheese', 'w.bread', 'w.juice'],
    de: ['w.honey', 'w.chocolate', 'w.cheese', 'w.bread', 'w.juice'] };
  const GIFT_MODEL = { es: n => `Te traje ${n}.`, pt: n => `Eu trouxe ${n} pra você.`, de: n => `Ich hab dir ${n} mitgebracht.` };
  // an item with its indefinite article (German: accusative) for the model sentence (none for honey, chocolate…)
  function withArticle(id, l = lang()) {
    const it = LEX.item(id) || {}, w = it[l] || id, g = it.g && it.g[l];
    if (l === 'zh') return `[一|yī] ${clZh(id)} ${w}`;          // (zh: its measure word, 一朵花; ja: the word alone)
    if (l === 'ja') return w;
    if (MASS[l].includes(id)) return w;
    if (l === 'es') return (g === 'f' ? 'una ' : 'un ') + w;
    if (l === 'pt') return (g === 'f' ? 'uma ' : 'um ') + w;
    return ({ m: 'einen ', f: 'eine ', n: 'ein ' }[g] || '') + w;
  }
  // the things in the attic: «the X» (what she asks for) and «a X» (what you brought by mistake)
  const FETCH_NAMES = {
    candle: { es: ['la vela', 'una vela'], pt: ['a vela', 'uma vela'], de: ['die Kerze', 'eine Kerze'], en: 'the candle' },
    book: { es: ['el libro', 'un libro'], pt: ['o livro', 'um livro'], de: ['das Buch', 'ein Buch'], en: 'the book' },
    cup: { es: ['la taza', 'una taza'], pt: ['a xícara', 'uma xícara'], de: ['die Tasse', 'eine Tasse'], en: 'the cup' },
    blanket: { es: ['la manta', 'una manta'], pt: ['o cobertor', 'um cobertor'], de: ['die Decke', 'eine Decke'], en: 'the blanket' },
    record: { es: ['el disco', 'un disco'], pt: ['o disco', 'um disco'], de: ['die Schallplatte', 'eine Schallplatte'], en: 'the record' },
  };

  // ---------------- banter duels: their jab, the comeback that fits it (in your voice: never gendered), and a few misfires
  const J = (jab, back) => ({ jab, back });
  const DUEL = {
    morgana: [       // (she's your rival while you date Dante)
      J(T('Your boyfriend sings so loud the birds moved out of town.', 'Tu novio canta tan fuerte que los pájaros se mudaron.', 'Seu namorado canta tão alto que os passarinhos se mudaram.', 'Dein Freund singt so laut, dass die Vögel umgezogen sind.'),
        T('They moved closer, to hear him better.', 'Se mudaron más cerca, para oírlo mejor.', 'Eles se mudaram pra mais perto, pra ouvir melhor.', 'Sie sind näher gezogen, um ihn besser zu hören.')),
      J(T('You smell like coal. How romantic.', 'Hueles a carbón. Qué romántico.', 'Você tá com cheiro de carvão. Que romântico.', 'Du riechst nach Kohle. Wie romantisch.'),
        T('Better coal than attic dust.', 'Mejor carbón que polvo de ático.', 'Melhor carvão do que poeira de sótão.', 'Besser Kohle als Dachbodenstaub.')),
      J(T('You date someone who sings to an anvil?', '¿Sales con alguien que le canta a un yunque?', 'Você namora alguém que canta pra uma bigorna?', 'Du bist mit jemandem zusammen, der einem Amboss was vorsingt?'),
        T('Yes. And the anvil never complains.', 'Sí. Y el yunque nunca se queja.', 'Sim. E a bigorna nunca reclama.', 'Ja. Und der Amboss beschwert sich nie.')),
      J(T('You chose noise. I choose {c.silence}.', 'Tú elegiste el ruido. Yo elijo el silencio.', 'Você escolheu o barulho. Eu escolho o silêncio.', 'Du hast den Lärm gewählt. Ich wähle das Schweigen.'),
        T('That’s exactly what the Hush wants.', 'Eso es justo lo que quiere el Silencio.', 'É exatamente isso que o Silêncio quer.', 'Genau das will die Stille.')),
      J(T('Your little rabbit keeps staring at me.', 'Tu conejito no deja de mirarme.', 'Esse seu coelhinho fica me encarando.', 'Dein kleiner Hase starrt mich die ganze Zeit an.'),
        T('It stares because it likes you.', 'Te mira así porque le caes bien.', 'Ele te encara porque gosta de você.', 'Er starrt, weil er dich mag.')),
      J(T('You two are like thunder and a hammer: all noise.', 'Ustedes dos son como un trueno y un martillo: puro ruido.', 'Vocês dois são tipo trovão e martelo: só barulho.', 'Ihr zwei seid wie Donner und Hammer: nur Krach.'),
        T('Better noise together than {c.silence} alone.', 'Mejor ruido juntos que silencio sola.', 'Melhor barulho juntos do que silêncio sozinha.', 'Lieber Krach zu zweit als Stille allein.')),
    ],
    dante: [         // (he's your rival while you date Morgana)
      J(T('Your girlfriend writes poems sadder than a Monday!', '¡Tu novia escribe poemas más tristes que un lunes!', 'Sua namorada escreve poemas mais tristes que segunda-feira!', 'Deine Freundin schreibt Gedichte, die trauriger sind als ein Montag!'),
        T('Mondays have poetry too.', 'Los lunes también tienen poesía.', 'Segunda-feira também tem poesia.', 'Auch Montage haben Poesie.')),
      J(T('A date in an attic? With dust and spiders!', '¿Una cita en un ático? ¡Con polvo y arañas!', 'Um encontro num sótão? Com poeira e aranhas!', 'Ein Date auf dem Dachboden? Mit Staub und Spinnen!'),
        T('At least spiders don’t shout.', 'Por lo menos las arañas no gritan.', 'Pelo menos as aranhas não gritam.', 'Wenigstens schreien Spinnen nicht.')),
      J(T('She wears black even to the beach!', '¡Ella se viste de negro hasta para ir a la playa!', 'Ela usa preto até pra ir à praia!', 'Sie trägt sogar am Strand Schwarz!'),
        T('And you wear coal every day.', 'Y tú te vistes de carbón todos los días.', 'E você se veste de carvão todo dia.', 'Und du trägst jeden Tag Kohle.')),
      J(T('My voice reaches the {w.tower}! And yours?', '¡Mi voz llega hasta la torre! ¿Y la tuya?', 'Minha voz chega até a torre! E a sua?', 'Meine Stimme reicht bis zum Turm! Und deine?'),
        T('Mine doesn’t need to shout to get there.', 'La mía no necesita gritar para llegar.', 'A minha não precisa gritar pra chegar.', 'Meine muss nicht schreien, um anzukommen.')),
      J(T('I bet you can’t even whistle!', '¡Apuesto a que ni sabes silbar!', 'Aposto que você nem sabe assobiar!', 'Wetten, du kannst nicht mal pfeifen!'),
        T('I whistle better than you sing.', 'Silbo mejor de lo que tú cantas.', 'Eu assobio melhor do que você canta.', 'Ich pfeife besser, als du singst.')),
      J(T('{w.poem:pl}? I prefer songs with rhythm!', '¿Poemas? ¡Yo prefiero canciones con ritmo!', 'Poemas? Eu prefiro música com ritmo!', 'Gedichte? Ich mag lieber Lieder mit Rhythmus!'),
        T('A good {w.poem} has rhythm too.', 'Un buen poema también tiene ritmo.', 'Um bom poema também tem ritmo.', 'Ein gutes Gedicht hat auch Rhythmus.')),
    ],
  };
  const MISFIRES = [
    T('I like bread!', '¡Me gusta el pan!', 'Eu gosto de pão!', 'Ich mag Brot!'),
    T('What time is it?', '¿Qué hora es?', 'Que horas são?', 'Wie spät ist es?'),
    T('It’s sunny today.', 'Hoy hace sol.', 'Hoje tá fazendo sol.', 'Heute scheint die Sonne.'),
    T('Nice hat!', '¡Qué lindo sombrero!', 'Que chapéu bonito!', 'Schöner Hut!'),
    T('My {w.cat} is called Mimo.', 'Mi gato se llama Mimo.', 'Meu gato se chama Mimo.', 'Meine Katze heißt Mimo.'),
  ];
  // the breakup (kindly): what you could say, and the kind one you type
  const BREAKUP = {
    kind: T('I’m sorry. You’re really special, but my {w.heart} is with someone else.', 'Lo siento. Eres muy especial, pero mi corazón está con otra persona.', 'Me desculpa. Você é muito especial, mas o meu coração está com outra pessoa.', 'Es tut mir leid. Du bist etwas Besonderes, aber mein Herz gehört jemand anderem.'),
    blunt: T('I don’t like you anymore. Bye.', 'Ya no me gustas. Adiós.', 'Não gosto mais de você. Tchau.', 'Ich mag dich nicht mehr. Tschüss.'),
    dodge: T('Uh… how about this weather?', 'Eh… ¿qué tal el clima?', 'É… e esse tempo, hein?', 'Äh … schönes Wetter heute, oder?'),
  };
  // «Amor en Silencio», the love plots as a telenovela: every big scene opens on a title card (the show, «Capítulo N», the
  // chapter), the bombshells get a rush in on the speaker's face and a dun-dun-DUNNN (Mimo gasps), the sweet moments a slow
  // push and a harp, the hard ones the back of a hand to the forehead, and a chapter ends frozen on «Continuará…». The two
  // finales end on «Fin».
  const TN = {
    show: T('Love in Silence', 'Amor en Silencio', 'Amor em Silêncio', 'Liebe in der Stille'),
    ep: T('Chapter', 'Capítulo', 'Capítulo', 'Folge'),
    cont: T('To be continued…', 'Continuará…', 'Continua…', 'Fortsetzung folgt …'),
    fin: T('The End', 'Fin', 'Fim', 'Ende'),
    'm.meet': T('The Girl in the Attic', 'La chica del ático', 'A garota do sótão', 'Das Mädchen auf dem Dachboden'),
    'm.r2': T('A Secret in Verse', 'Un secreto en verso', 'Um segredo em versos', 'Ein Geheimnis in Versen'),
    'm.r3': T('The Hill Remembers', 'La colina recuerda', 'O morro se lembra', 'Der Hügel erinnert sich'),
    'm.r4': T('Grandmother’s Voice', 'La voz de la abuela', 'A voz da vovó', 'Die Stimme der Oma'),
    'm.r5': T('Grand Finale: The Last Line', 'Gran final: el último verso', 'Grande final: o último verso', 'Das große Finale: Die letzte Zeile'),
    'd.meet': T('The Singing Blacksmith', 'El herrero que canta', 'O ferreiro que canta', 'Der singende Schmied'),
    'd.r2': T('Heart of Iron', 'Corazón de hierro', 'Coração de ferro', 'Herz aus Eisen'),
    'd.r3': T('Big Hands, Soft Heart', 'Manos grandes, corazón tierno', 'Mãos grandes, coração mole', 'Große Hände, weiches Herz'),
    'd.r4': T('The Bells Answer', 'Las campanas se contestan', 'Os sinos se respondem', 'Die Glocken antworten'),
    'd.r5': T('Grand Finale: The Bell Rings', 'Gran final: la campana suena', 'Grande final: o sino toca', 'Das große Finale: Die Glocke läutet'),
    rival: T('Rivals!', '¡Rivales!', 'Rivais!', 'Rivalen!'),
    crack: T('A Crack in the Armor', 'Una grieta en la armadura', 'Uma rachadura na armadura', 'Ein Riss in der Rüstung'),
    breakup: T('Tears in the Rain', 'Lágrimas bajo la lluvia', 'Lágrimas na chuva', 'Tränen im Regen'),
    switch: T('A New Love', 'Un nuevo amor', 'Um novo amor', 'Eine neue Liebe'),
  };
  // the bombshells (a rush in, a sting, Mimo gasps) and the sweet moments (a slow push, a swoon); the acting on some lines
  // (only standing: on Morgana's window seat she keeps her seat)
  const DRAMA = { 'm.r2.rival1': 'sting', 'd.r2.rival1': 'sting', 'm.tn.rival': 'sting', 'd.tn.rival': 'sting', 'mr.find': 'sting', 'dr.find': 'sting',
    'm.r4.3': 'sting', 'mr.tn.crack': 'sting', 'dr.tn.crack': 'sting', 'mr.crack.2': 'sting', 'dr.crack.3': 'sting', 'm.tn.bu': 'sting', 'd.tn.bu': 'sting',
    'm.r2.6': 'swoon', 'd.r2.6': 'swoon', 'm.r3.6': 'swoon', 'd.r3.5': 'swoon', 'm.r5.quiero': 'swoon', 'd.r5.quiero': 'swoon' };
  const ACT = { 'm.r2.rival1': 'point', 'd.r2.rival1': 'point', 'mr.find': 'point', 'dr.find': 'point', 'm.tn.rival': 'turn', 'd.tn.rival': 'drama',
    'mr.tn.crack': 'drama', 'dr.tn.crack': 'drama', 'm.tn.bu': 'drama', 'd.tn.bu': 'drama' };

  // ================================================================ zh / ja (game/CJK.md's notation): the same scenes, written natively
  // Morgana is dry and guarded (zh 哼, 随便, 无所谓; ja わたし and あなた, short plain sentences, a soft わ or の now and then);
  // Dante is loud and warm (zh 哈, 哇, lots of ！; ja 俺 and 君, だぜ, マジか). Neither of them genders the player, and the
  // player's own ja lines (the comebacks, the breakup) have no pronoun and no gendered ending. Keys as in LT, merged into it.
  const LT_CJK = {
    // ---------------- Morgana
    'm.meet.1': Z2('[坡坡|Pō po] 。 [我|wǒ] [跟|gēn] [你|nǐ] [说|shuō] [过|guo] ： [不许|bù xǔ] [带|dài] [客人|kè rén] [回来|huí lái] 。', 'ポー 。 [言|い]った はず 。 [客|きゃく] は お[断|ことわ]り って 。'),
    'm.meet.2': Z2('…… [你|nǐ] [还|hái] [真|zhēn] [跟|gēn] [着|zhe] [一|yī] [只|zhī] [猫|māo] ， [走|zǒu] [遍|biàn] [了|le] [整个|zhěng gè] [村子|cūn zi] 。', '…… で 、 [猫|ねこ] に ついて きた わけ 。 [村中|むらじゅう] 。'),
    'm.meet.3': Z2('[那些|nà xiē] [诗|shī] [不是|bù shì] [写|xiě] [给|gěi] [你|nǐ] [的|de] 。 [不是|bù shì] [写|xiě] [给|gěi] [任何|rèn hé] [人|rén] [的|de] 。 …… [我|wǒ] [叫|jiào] [莫甘娜|Mò gān nà] 。', 'あれ は あなた の ため じゃ ない 。 [誰|だれ] の ため でも ない 。 …… わたし は モルガナ 。'),
    'm.meet.4': Z2('[我|wǒ] [来|lái] [这儿|zhè r] ， [是|shì] [因为|yīn wèi] [这里|zhè lǐ] [安静|ān jìng] 。 [没|méi] [人|rén] [会|huì] [多|duō] [看|kàn] [一|yī] [眼|yǎn] [破|pò] [房子|fáng zi] 。', 'ここ に [来|く]る の は 、 [静|しず]か だ から 。 [壊|こわ]れた [家|いえ] なんて 、 [誰|だれ] も [見|み]ない 。'),
    'm.meet.5': Z2('[可是|kě shì] [最近|zuì jìn] ， [安静|ān jìng] [开始|kāi shǐ] [咬|yǎo] [人|rén] [了|le] 。 [你|nǐ] [看|kàn] ： [每|měi] [首|shǒu] [诗|shī] [的|de] [最后|zuì hòu] [一|yī] [行|háng] [都|dōu] [变|biàn] [灰|huī] [了|le] 。', 'でも [最近|さいきん] 、 [静|しず]けさ が [牙|きば] を むく の 。 [見|み]て 。 どの [詩|し] も 、 [最後|さいご] の [一行|いちぎょう] が [灰色|はいいろ] に なる 。'),
    'm.meet.6': Z2('[好|hǎo] [极|jí] [了|le] 。 [所以|suǒ yǐ] [我|wǒ] [的|de] [诗|shī] [需要|xū yào] [观众|guān zhòng] 。 [真|zhēn] [是|shì] [悲剧|bēi jù] 。', '[最高|さいこう] 。 つまり 、 わたし の [詩|し] に は [観客|かんきゃく] が [必要|ひつよう] って こと 。 なんて [悲劇|ひげき] 。'),
    'm.meet.7': Z2('[好|hǎo] [吧|ba] 。 [你|nǐ] [可以|kě yǐ] [再|zài] [来|lái] 。 [你|nǐ] [这个|zhè ge] [人|rén] …… [还|hái] [不|bù] [算|suàn] [讨厌|tǎo yàn] 。', 'いい わ 。 また [来|き]て も いい 。 [悪|わる]い [人|ひと] じゃ なさそう だし 。'),
    'm.meet.8': Z2('[这|zhè] [就是|jiù shì] [我|wǒ] [说|shuō] “ {caes} ” [的|de] [方式|fāng shì] 。 [你|nǐ] [也|yě] [说|shuō] [一|yī] [句|jù] [吧|ba] …… [如果|rú guǒ] [是|shì] [真心|zhēn xīn] [的|de] 。', 'それ が わたし なり の 「 {caes} 」 。 あなた も [言|い]って …… [本気|ほんき] なら 。'),
    'm.meet.9': Z2('…… [哼|hēng] 。 [好|hǎo] [吧|ba] 。 [下次|xià cì] [带|dài] [点|diǎn] [话|huà] [来|lái] 。', '…… ふーん 。 [悪|わる]く ない 。 [次|つぎ] は 、 [何|なに]か [話|はなし] を [持|も]って きて 。'),
    'm.meet.skip': Z2('[不好意思|bù hǎo yì si] [说|shuō] ？ …… [我|wǒ] [也|yě] [是|shì] 。 [反正|fǎn zhèng] [再|zài] [来|lái] [吧|ba] 。', '[恥|は]ずかしい ？ …… わたし も 。 それ でも 、 また [来|き]て 。'),
    'm.voice': Z2('[坡坡|Pō po] …… [这次|zhè cì] [又|yòu] [是|shì] [谁|shéi] [跟|gēn] [着|zhe] [你|nǐ] [来|lái] [了|le] ？', 'ポー …… [今度|こんど] は [誰|だれ] を [連|つ]れて きた の ？'),
    'm.r2.1': Z2('[你|nǐ] [又|yòu] [来|lái] [了|le] 。 [又|yòu] [一|yī] [次|cì] 。 [坡坡|Pō po] [喜欢|xǐ huan] [你|nǐ] 。 [很|hěn] [可疑|kě yí] 。', 'また [来|き]た の 。 また 。 ポー は あなた が [気|き] に [入|い]った みたい 。 [怪|あや]しい 。'),
    'm.r2.2': Z2('[我|wǒ] [从|cóng] [九|jiǔ] [岁|suì] [就|jiù] [开始|kāi shǐ] [写|xiě] [诗|shī] 。 [现在|xiàn zài] [我|wǒ] [二十一|èr shí yī] [岁|suì] 。 [写|xiě] [猫|māo] [的|de] [诗|shī] [可|kě] [不少|bù shǎo] 。', '[九歳|きゅうさい] から [詩|し] を [書|か]いて る 。 [今|いま] は [二十一|にじゅういち] 。 [猫|ねこ] の [詩|し] が 、 ずいぶん [増|ふ]えた 。'),
    'm.r2.3': Z2('[从来|cóng lái] [没有|méi yǒu] [人|rén] [读|dú] [过|guo] 。 [直到|zhí dào] [你|nǐ] [出现|chū xiàn] 。', '[誰|だれ] も [読|よ]んだ こと が なかった 。 あなた が [来|く]る まで は 。'),
    'm.r2.4': Z2('[如果|rú guǒ] [我|wǒ] [大声|dà shēng] [念|niàn] [出来|chū lái] ， [它们|tā men] [就|jiù] [是|shì] [真|zhēn] [的|de] 。 [而|ér] [人们|rén men] [会|huì] [笑|xiào] [真|zhēn] [的|de] [东西|dōng xi] 。', '[声|こえ] に [出|だ]したら 、 [本物|ほんもの] に なる 。 そして [人|ひと] は 、 [本物|ほんもの] を [笑|わら]う 。'),
    'm.r2.5': Z2('…… [你|nǐ] [没有|méi yǒu] [笑|xiào] 。 [一|yī] [次|cì] [也|yě] [没有|méi yǒu] 。', '…… あなた は [笑|わら]わなかった 。 [一度|いちど] も 。'),
    'm.r2.6': Z2('“ {caes} ” [是|shì] [一|yī] [回事|huí shì] ， “ {gustas} ” [是|shì] [另|lìng] [一|yī] [回事|huí shì] 。 [后面|hòu miàn] [那|nà] [句|jù] …… [更|gèng] [多|duō] 。 [告诉|gào su] [你|nǐ] [一下|yī xià] [而已|ér yǐ] 。', '「 {caes} 」 と 「 {gustas} 」 は [違|ちが]う 。 [後|あと] の ほう は …… もっと 。 [一応|いちおう] 、 [言|い]って おく 。'),
    'm.r2.7': Z2('…… [哦|ò] 。 [是|shì] [那|nà] [句|jù] [啊|a] 。 [好|hǎo] [吧|ba] 。', '…… あ 。 そっち 。 そう 。'),
    'm.r2.yes': Z2('…… [好|hǎo] 。 [但是|dàn shì] [你|nǐ] [要是|yào shi] [跟|gēn] [别人|bié rén] [说|shuō] [我|wǒ] [笑|xiào] [了|le] ， [我|wǒ] [可|kě] [不|bù] [承认|chéng rèn] 。', '…… うん 。 でも 、 わたし が [笑|わら]った って [誰|だれ]か に [言|い]ったら 、 [否定|ひてい] する から 。'),
    'm.r2.no': Z2('[还|hái] [有|yǒu] …… [别|bié] [的|de] [事|shì] [吗|ma] ？ [没有|méi yǒu] ？ [好|hǎo] [吧|ba] 。', '[他|ほか] に …… [何|なに]か ある ？ ない ？ そう 。'),
    'm.r2.rival1': Z2('[等等|děng deng] 。 [你|nǐ] [身上|shēn shang] [有|yǒu] [煤|méi] [味|wèi] 。 [你|nǐ] [跟|gēn] [铁匠铺|tiě jiang pù] [那个|nà ge] [大嗓门|dà sǎng mén] [在一起|zài yī qǐ] [了|le] ， [对|duì] [吧|ba] ？', '[待|ま]って 。 [石炭|せきたん] の におい 。 [鍛冶場|かじば] の 、 あの うるさい [人|ひと] と [付|つ]き[合|あ]って る の ね ？'),
    'm.r2.rival2': Z2('[那|nà] [我们|wǒ men] [就是|jiù shì] [对手|duì shǒu] [了|le] 。 [不是|bù shì] [针对|zhēn duì] [你|nǐ] 。 …… [也许|yě xǔ] [就是|jiù shì] 。', 'じゃあ 、 わたし たち は ライバル 。 [別|べつ]に [個人的|こじんてき] な [意味|いみ] は ない 。 …… ある かも 。'),
    'm.r3.1': Z2('[听说|tīng shuō] [你|nǐ] [把|bǎ] [山坡|shān pō] [上|shang] [的|de] [灰色|huī sè] [赶走|gǎn zǒu] [了|le] 。 [用|yòng] [话语|huà yǔ] 。', '[丘|おか] の [灰色|はいいろ] を 、 あなた が [追|お]い[払|はら]った って [聞|き]いた 。 [言葉|ことば] で 。'),
    'm.r3.2': Z2('[我|wǒ] [从|cóng] [窗户|chuāng hu] [看|kàn] [到|dào] [了|le] 。 [山坡|shān pō] [又|yòu] [变|biàn] [绿|lǜ] [了|le] 。 [那|nà] …… [几乎|jī hū] [有|yǒu] [点|diǎn] [诗意|shī yì] 。', '[窓|まど] から [見|み]て た 。 [丘|おか] が また [緑|みどり] に なった 。 …… ちょっと [詩的|してき] だった 。'),
    'm.r3.3': Z2('[我|wǒ] [写|xiě] [了|le] [点|diǎn] [东西|dōng xi] 。 [别|bié] [这样|zhè yàng] [看|kàn] [我|wǒ] 。', 'それ に ついて 、 [少|すこ]し [書|か]いた 。 そんな [顔|かお] しない で 。'),
    'm.r3.4': Z2('“ [有人|yǒu rén] [开口|kāi kǒu] ， [山坡|shān pō] [便|biàn] [想起|xiǎng qǐ] [了|le] [自己|zì jǐ] [的|de] [颜色|yán sè] 。 ”', '「 [誰|だれ]か が [話|はな]し 、 [丘|おか] は [自分|じぶん] の [色|いろ] を [思|おも]い[出|だ]した 。 」'),
    'm.r3.5': Z2('[这次|zhè cì] [最后|zuì hòu] [一|yī] [行|háng] [没有|méi yǒu] [变|biàn] [灰|huī] 。 [我|wǒ] [想|xiǎng] ， [是|shì] [因为|yīn wèi] [你|nǐ] 。', '[今度|こんど] は 、 [最後|さいご] の [一行|いちぎょう] が [灰色|はいいろ] に ならなかった 。 たぶん 、 あなた の おかげ 。'),
    'm.r3.6': Z2('…… [哪天|nǎ tiān] [你|nǐ] [可以|kě yǐ] [牵|qiān] [我|wǒ] [的|de] [手|shǒu] 。 [如果|rú guǒ] [你|nǐ] [问|wèn] 。 [好好|hǎo hǎo] [地|de] [问|wèn] 。', '…… いつか 、 [手|て] を つないで も いい 。 ちゃんと [聞|き]いて くれたら 。'),
    'm.r4.1': Z2('[我|wǒ] [能|néng] [跟|gēn] [你|nǐ] [说|shuō] [件|jiàn] [事|shì] [吗|ma] ？ [你|nǐ] [会|huì] [觉得|jué de] [很|hěn] [傻|shǎ] 。', '[話|はな]して も いい ？ ばか みたい って [思|おも]う かも 。'),
    'm.r4.2': Z2('[我|wǒ] [奶奶|nǎi nai] [每天|měi tiān] [晚上|wǎn shang] [给|gěi] [我|wǒ] [念|niàn] [诗|shī] 。 [她|tā] [的|de] [声音|shēng yīn] [是|shì] [世界|shì jiè] [上|shang] [最|zuì] [温柔|wēn róu] [的|de] 。', 'おばあちゃん は [毎晩|まいばん] 、 わたし に [詩|し] を [読|よ]んで くれた 。 [世界|せかい] で いちばん やさしい [声|こえ] だった 。'),
    'm.r4.3': Z2('[她|tā] [走|zǒu] [了|le] [以后|yǐ hòu] ， [我|wǒ] [就|jiù] [不再|bù zài] [大声|dà shēng] [念|niàn] [诗|shī] [了|le] 。 [我|wǒ] [以为|yǐ wéi] [沉默|chén mò] [是|shì] [一种|yī zhǒng] [尊重|zūn zhòng] 。', 'おばあちゃん が いなく なって 、 [声|こえ] に [出|だ]して [読|よ]む の を やめた 。 [黙|だま]る こと が 、 [敬意|けいい] だ と [思|おも]って た 。'),
    'm.r4.4': Z2('[可是|kě shì] [沉默|chén mò] [不是|bù shì] [尊重|zūn zhòng] 。 [沉默|chén mò] [就|jiù] [只是|zhǐ shì] [沉默|chén mò] 。 [而|ér] [寂静|Jì jìng] [最|zuì] [喜欢|xǐ huan] [它|tā] 。', 'でも 、 [沈黙|ちんもく] は [敬意|けいい] じゃ ない 。 ただ の [沈黙|ちんもく] 。 そして [静寂|せいじゃく] は 、 それ が [大好物|だいこうぶつ] 。'),
    'm.r4.5': Z2('[这|zhè] [是|shì] [她|tā] [最|zuì] [喜欢|xǐ huan] [的|de] 。 [你|nǐ] [能|néng] …… [念|niàn] [给|gěi] [我|wǒ] [听|tīng] [吗|ma] ？ [大声|dà shēng] [地|de] ？ [我|wǒ] [做|zuò] [不|bù] [到|dào] 。', 'これ 、 おばあちゃん の お[気|き]に[入|い]り 。 …… [読|よ]んで くれる ？ [声|こえ] に [出|だ]して 。 わたし に は 、 できない 。'),
    'm.r4.6': Z2('…… [原来|yuán lái] [它|tā] [听|tīng] [起来|qǐ lái] [是|shì] [这样|zhè yàng] [的|de] 。 [在|zài] [别人|bié rén] [的|de] [声音|shēng yīn] [里|lǐ] 。', '…… こんな [風|ふう] に [聞|き]こえる ん だ 。 [他|ほか] の [人|ひと] の [声|こえ] で 。'),
    'm.r4.7': Z2('[谢谢|xiè xie] 。 [她|tā] [一定|yī dìng] [会|huì] [喜欢|xǐ huan] [你|nǐ] 。 [坡坡|Pō po] [已经|yǐ jīng] [喜欢|xǐ huan] [你|nǐ] [了|le] 。 [叛徒|pàn tú] 。', 'ありがとう 。 おばあちゃん も 、 きっと あなた を [気|き] に [入|い]った 。 ポー は もう [気|き] に [入|い]って る 。 [裏切|うらぎ]り[者|もの] 。'),
    'm.r4.skip': Z2('[今天|jīn tiān] [不行|bù xíng] ？ …… [没关系|méi guān xi] 。 [它|tā] [已经|yǐ jīng] [等|děng] [了|le] [这么|zhè me] [久|jiǔ] ， [再|zài] [等|děng] [一会儿|yī huì r] [也|yě] [行|xíng] 。', '[今日|きょう] は ダメ ？ …… いい よ 。 この [詩|し] は ずっと [待|ま]って た 。 もう [少|すこ]し くらい [待|ま]てる 。'),
    'm.r5.1': Z2('[第一|dì yī] [口|kǒu] [钟|zhōng] [响|xiǎng] [了|le] 。 [我|wǒ] [在|zài] [这儿|zhè r] [都|dōu] [听到|tīng dào] [了|le] 。 [连|lián] [坡坡|Pō po] [都|dōu] [坐|zuò] [起来|qǐ lái] [了|le] 。', '[最初|さいしょ] の [鐘|かね] が [鳴|な]った 。 ここ まで [聞|き]こえた 。 ポー まで [起|お]き[上|あ]がった 。'),
    'm.r5.2': Z2('[我|wǒ] [写完|xiě wán] [了|le] [一|yī] [首|shǒu] [诗|shī] 。 [完整|wán zhěng] [的|de] 。 [最后|zuì hòu] [一|yī] [行|háng] [留|liú] [下来|xià lái] [了|le] 。', '[詩|し] を [一|ひと]つ [書|か]き[上|あ]げた 。 [最後|さいご] まで 。 [最後|さいご] の [一行|いちぎょう] も 、 [消|き]えなかった 。'),
    'm.r5.3': Z2('[不过|bù guò] [先|xiān] …… [你|nǐ] [好像|hǎo xiàng] [有|yǒu] [话|huà] [要|yào] [说|shuō] 。 [说|shuō] [吧|ba] 。', 'でも その [前|まえ] に …… [何|なに]か [言|い]いたそう な [顔|かお] 。 [言|い]って 。'),
    'm.r5.amo1': Z2('“ {amo} ” ？ [我们|wǒ men] [才|cái] [约会|yuē huì] [了|le] [几|jǐ] [次|cì] ， [外加|wài jiā] [一|yī] [只|zhī] [猫|māo] 。', '「 {amo} 」 ？ …… それ 、 ドラマ で しか [聞|き]いた こと ない 。'),
    'm.r5.amo2': Z2('[那|nà] [句|jù] [要|yào] [等|děng] [很多|hěn duō] [年|nián] [以后|yǐ hòu] 。 [说|shuō] [另|lìng] [一|yī] [句|jù] 。 [那|nà] [句|jù] [也|yě] [很|hěn] [重|zhòng] 。 [相信|xiāng xìn] [我|wǒ] 。', 'それ は 、 [何年|なんねん] も [先|さき] に [取|と]って おいて 。 もう [一|ひと]つ の ほう を [言|い]って 。 それ だって 、 じゅうぶん [大|おお]きい 。 [信|しん]じて 。'),
    'm.r5.quiero': Z2('…… [我|wǒ] [也|yě] [喜欢|xǐ huan] [你|nǐ] 。 [真的|zhēn de] 。 [别|bié] [那样|nà yàng] [看|kàn] [着|zhe] [我|wǒ] 。', '…… わたし も 、 [大好|だいす]き 。 [本当|ほんとう] に 。 そんな [目|め] で [見|み]ない で 。'),
    'm.r5.shy': Z2('[什么|shén me] [都|dōu] [不|bù] [说|shuō] ？ …… [好|hǎo] [吧|ba] 。 [我|wǒ] [等|děng] 。 [我|wǒ] [很|hěn] [会|huì] [等|děng] 。', '[何|なに] も ？ …… いい わ 。 [待|ま]つ 。 [待|ま]つ の は [得意|とくい] だ から 。'),
    'm.r5.4': Z2('[来|lái] 。 [我|wǒ] [想|xiǎng] [在|zài] [有|yǒu] [观众|guān zhòng] [的|de] [地方|dì fang] [念|niàn] 。 [哪怕|nǎ pà] [观众|guān zhòng] [是|shì] [一|yī] [只|zhī] [猫|māo] 。', '[来|き]て 。 [観客|かんきゃく] の いる [所|ところ] で [読|よ]みたい 。 [観客|かんきゃく] が [猫|ねこ] でも 。'),
    'm.r5.5': Z2('[老|lǎo] [剧院|jù yuàn] 。 [奥罗拉|Ào luó lā] [建|jiàn] [它|tā] ， [是|shì] [为了|wèi le] [让|ràng] [大家|dà jiā] [都|dōu] [能|néng] [唱歌|chàng gē] 。 [完美|wán měi] 。', '[古|ふる]い [劇場|げきじょう] 。 オーロラ が 、 みんな が [歌|うた]える よう に [建|た]てた [場所|ばしょ] 。 [完璧|かんぺき] 。'),
    'm.r5.6': Z2('[好|hǎo] [了|le] 。 [大声|dà shēng] [地|de] 。 [当着|dāng zhe] [整个|zhěng gè] [村子|cūn zi] [的|de] [面|miàn] 。', 'はい 。 [声|こえ] に [出|だ]して 。 [村中|むらじゅう] の [前|まえ] で 。'),
    'm.r5.7': Z2('[没错|méi cuò] 。 [世界|shì jiè] [上|shang] [最|zuì] [好|hǎo] [的|de] [观众|guān zhòng] 。', 'そう 。 [世界一|せかいいち] の [観客|かんきゃく] 。'),
    'm.r5.8': Z2('…… [别|bié] [得意|dé yì] 。', '…… [調子|ちょうし] に [乗|の]らない で 。'),
    'm.gate.boss': Z2('[大家|dà jiā] [都|dōu] [在|zài] [说|shuō] [村子|cūn zi] [东边|dōng biān] [那|nà] [座|zuò] [灰色|huī sè] [的|de] [山坡|shān pō] 。 [去|qù] [想想|xiǎng xiang] [办法|bàn fǎ] 。 [然后|rán hòu] [再|zài] [回来|huí lái] 。', 'みんな 、 [村|むら] の [東|ひがし] の [灰色|はいいろ] の [丘|おか] の [話|はなし] を して る 。 なんとか して きて 。 それ から 、 [戻|もど]って きて 。'),
    'm.gate.ciro': Z2('[磨坊镇|Mò fáng zhèn] [有|yǒu] [个|gè] [钟表匠|zhōng biǎo jiàng] ， [他|tā] [知道|zhī dào] [古老|gǔ lǎo] [的|de] [钟|zhōng] [的|de] [事|shì] 。 [去|qù] [找|zhǎo] [他|tā] 。 [然后|rán hòu] [全部|quán bù] [告诉|gào su] [我|wǒ] 。', 'モリナール に 、 [古|ふる]い [鐘|かね] に [詳|くわ]しい [時計屋|とけいや] が いる 。 [会|あ]って きて 。 それ から 、 [全部|ぜんぶ] [話|はな]して 。'),
    'm.gate.bell': Z2('[要是|yào shi] [有|yǒu] [一|yī] [口|kǒu] [钟|zhōng] [再|zài] [响|xiǎng] [起来|qǐ lái] …… [也许|yě xǔ] [我|wǒ] [能|néng] [写完|xiě wán] [一|yī] [首|shǒu] [诗|shī] 。 [随便|suí biàn] [说说|shuō shuo] 。', '[鐘|かね] が [一|ひと]つ でも また [鳴|な]ったら …… [詩|し] を [書|か]き[上|あ]げられる かも 。 [別|べつ]に 、 [言|い]って みた だけ 。'),
    'm.chat.1': Z2('[坡坡|Pō po] [今天|jīn tiān] [给|gěi] [我|wǒ] [叼|diāo] [来|lái] [一|yī] [片|piàn] [枯叶|kū yè] 。 [这|zhè] [周|zhōu] [最|zuì] [好|hǎo] [的|de] [礼物|lǐ wù] 。', '[今日|きょう] 、 ポー が [枯|か]れ[葉|は] を [持|も]って きた 。 [今週|こんしゅう] いちばん の プレゼント 。'),
    'm.chat.2': Z2('[我|wǒ] [喜欢|xǐ huan] [下雨|xià yǔ] 。 [雨|yǔ] [在|zài] [说话|shuō huà] ， [我|wǒ] [就|jiù] [不用|bù yòng] [说|shuō] [了|le] 。', '[雨|あめ] が [好|す]き 。 [雨|あめ] が [話|はな]して くれる から 、 わたし は [話|はな]さなくて いい 。'),
    'm.chat.3': Z2('[别|bié] [碰|pèng] [蜡烛|là zhú] 。 [它们|tā men] [有|yǒu] [感情|gǎn qíng] 。', 'ろうそく に [触|さわ]らない で 。 [気持|きも]ち が ある の 。'),
    'm.chat.4': Z2('[你|nǐ] [又|yòu] [来|lái] [了|le] 。 [挺|tǐng] [好|hǎo] 。 [我|wǒ] [是|shì] [说|shuō] …… [无所谓|wú suǒ wèi] 。 [挺|tǐng] [好|hǎo] 。', 'また [来|き]た 。 よかった 。 …… [別|べつ]に 、 どう でも いい けど 。 よかった 。'),
    'm.chat.5': Z2('[我|wǒ] [现在|xiàn zài] [会|huì] [给|gěi] [坡坡|Pō po] [念|niàn] [我|wǒ] [的|de] [诗|shī] 。 [大声|dà shēng] [地|de] 。 [它|tā] [假装|jiǎ zhuāng] [不|bù] [在乎|zài hu] 。', '[今|いま] は 、 ポー に [詩|し] を [読|よ]んで あげて る 。 [声|こえ] に [出|だ]して 。 [興味|きょうみ] ない ふり を する けど 。'),
    'm.cool': Z2('[又|yòu] [来|lái] ？ [待会儿|dāi huì r] [吧|ba] 。 [我|wǒ] [的|de] [社交|shè jiāo] [电量|diàn liàng] [只|zhǐ] [剩|shèng] [一|yī] [根|gēn] [蜡烛|là zhú] [了|le] 。', 'また ？ [後|あと] で 。 [社交|しゃこう] の バッテリー が 、 ろうそく [一本|いっぽん] [分|ぶん] しか ない 。'),
    'm.wait': Z2('[你|nǐ] [跟|gēn] [他|tā] [谈|tán] [了|le] [吗|ma] ？ [好好|hǎo hǎo] [地|de] [谈|tán] ？', 'もう [彼|かれ] と [話|はな]した ？ やさしく ？'),
    'm.switch.yes': Z2('…… [你|nǐ] [跟|gēn] [他|tā] [谈|tán] [过|guo] [了|le] 。 [很|hěn] [好|hǎo] 。 [那|nà] [我|wǒ] [答应|dā ying] 。', '…… [彼|かれ] と [話|はな]した の ね 。 よかった 。 じゃあ 、 いい よ 。'),
    'm.d.words': Z2('[说|shuō] [吧|ba] 。 [说|shuō] [点|diǎn] [好听|hǎo tīng] [的|de] 。 [我|wǒ] [会|huì] [假装|jiǎ zhuāng] [不|bù] [在乎|zài hu] 。', 'どうぞ 。 [何|なに]か うれしい こと 、 [言|い]って 。 [興味|きょうみ] ない ふり 、 する から 。'),
    'm.d.wordsLove': Z2('…… [再|zài] [说|shuō] [一|yī] [遍|biàn] 。 [不|bù] ， [别|bié] [说|shuō] [了|le] 。 [我|wǒ] [听到|tīng dào] [了|le] 。 [谢谢|xiè xie] 。', '…… もう [一回|いっかい] [言|い]って 。 ううん 、 いい 。 [聞|き]こえた 。 ありがとう 。'),
    'm.d.wordsOk': Z2('[嗯|èn] 。 [不错|bù cuò] 。 [有点|yǒu diǎn] [像|xiàng] [贺卡|hè kǎ] [上|shang] [的|de] [话|huà] ， [不过|bù guò] [不错|bù cuò] 。', 'ふーん 。 いい ね 。 ちょっと グリーティングカード っぽい けど 、 いい 。'),
    'm.d.wordsMeh': Z2('“ {adj} ” 。 [哇|wā] 。 [你|nǐ] [是|shì] [从|cóng] [糖果|táng guǒ] [纸|zhǐ] [上|shang] [抄|chāo] [来|lái] [的|de] [吗|ma] ？', '「 {adj} 」 。 へえ 。 お[菓子|かし] の [袋|ふくろ] に でも [書|か]いて あった ？'),
    'm.d.wordsSlip': Z2('“ {adj} ” ？ [应该|yīng gāi] [说|shuō] “ {fix} ” ， [谢谢|xiè xie] 。 [不过|bù guò] …… [我|wǒ] [收下|shōu xià] [了|le] 。', '「 {adj} 」 ？ 「 {fix} 」 でしょ 。 …… まあ 、 もらって おく 。'),
    'm.d.wordsOdd': Z2('…… [这个|zhè ge] [词|cí] [我|wǒ] [不|bù] [认识|rèn shi] 。 [但|dàn] [你|nǐ] [说|shuō] [得|de] [很|hěn] [有|yǒu] [感情|gǎn qíng] 。', '…… その [言葉|ことば] 、 [知|し]らない 。 でも 、 [気持|きも]ち は [伝|つた]わった 。'),
    'm.d.time': Z2('[散步|sàn bù] 。 [行|xíng] 。 [慢慢|màn màn] [走|zǒu] 。 [我|wǒ] [说|shuō] ， [你|nǐ] [听|tīng] 。 [难得|nán dé] [一|yī] [次|cì] 。', '[散歩|さんぽ] 。 いい わ 。 ゆっくり ね 。 わたし が [話|はな]す から 、 あなた は [聞|き]いて 。 たまに は 。'),
    'm.d.timeOk': Z2('…… [你|nǐ] [真的|zhēn de] [在|zài] [听|tīng] 。 [没有|méi yǒu] [人|rén] [会|huì] [这样|zhè yàng] 。', '…… [本当|ほんとう] に [聞|き]いて た ん だ 。 そんな [人|ひと] 、 いない よ 。'),
    'm.d.timeNo': Z2('[不|bù] [对|duì] 。 [你|nǐ] [刚才|gāng cái] [在|zài] [看|kàn] [月亮|yuè liang] [吗|ma] ？ …… [好|hǎo] [吧|ba] ， [我|wǒ] [懂|dǒng] 。', 'はずれ 。 [月|つき] でも [見|み]て た ？ …… まあ 、 [分|わ]かる 。'),
    'm.d.gift': Z2('[礼物|lǐ wù] ？ [给|gěi] [我|wǒ] [的|de] ？ …… [是|shì] [什么|shén me] ？', 'プレゼント ？ わたし に ？ …… [何|なに] ？'),
    'm.g.newspaper': Z2('[报纸|bào zhǐ] ！ [我|wǒ] [会|huì] [把|bǎ] [上面|shàng miàn] [的|de] [字|zì] [剪|jiǎn] [下来|xià lái] ， [拼|pīn] [成|chéng] [诗|shī] 。 [你|nǐ] [怎么|zěn me] [知道|zhī dào] [的|de] ？', '[新聞|しんぶん] ！ [言葉|ことば] を [切|き]り[抜|ぬ]いて 、 コラージュ の [詩|し] を [作|つく]る の 。 どうして [分|わ]かった の ？'),
    'm.g.chocolate': Z2('[巧克力|qiǎo kè lì] 。 [希望|xī wàng] [是|shì] [黑|hēi] [巧克力|qiǎo kè lì] 。 …… [算|suàn] [了|le] ， [无所谓|wú suǒ wèi] 。 [谢谢|xiè xie] 。', 'チョコレート 。 ビター だ と いい けど 。 …… [別|べつ]に いい 。 ありがとう 。'),
    'm.g.flower': Z2('[一|yī] [朵|duǒ] [野花|yě huā] 。 [我|wǒ] [要|yào] [把|bǎ] [它|tā] [夹|jiā] [在|zài] [本子|běn zi] [里|lǐ] 。 [干|gān] [了|le] [以后|yǐ hòu] [会|huì] [很|hěn] [美|měi] 。', '[野|の] の [花|はな] 。 ノート に [挟|はさ]んで おく 。 [乾|かわ]いたら 、 きっと きれい 。'),
    'm.g.candy': Z2('[糖|táng] 。 [太|tài] [甜|tián] [了|le] 。 [跟|gēn] [贺卡|hè kǎ] [一样|yī yàng] 。 …… [给|gěi] [坡坡|Pō po] [吧|ba] 。', 'あめ 。 [甘|あま]すぎる 。 グリーティングカード みたい 。 …… ポー に あげる 。'),
    'm.g.gum': Z2('[口香糖|kǒu xiāng táng] 。 [哇|wā] 。 [我|wǒ] [又|yòu] [不是|bù shì] [十二|shí èr] [岁|suì] 。', 'ガム 。 へえ 。 わたし 、 [十二歳|じゅうにさい] じゃ ない ん だ けど 。'),
    'm.g.hat': Z2('[草帽|cǎo mào] ？ [我|wǒ] [看起来|kàn qǐ lái] [像|xiàng] [会|huì] [去|qù] [晒|shài] [太阳|tài yáng] [的|de] [人|rén] [吗|ma] ？', '[麦|むぎ]わら[帽子|ぼうし] ？ わたし が [日|ひ]なた に [出|で]る [人|ひと] に [見|み]える ？'),
    'm.g.soda': Z2('[汽水|qì shuǐ] 。 [会|huì] [冒泡|mào pào] 。 [像|xiàng] [小小|xiǎo xiǎo] [的|de] [尖叫|jiān jiào] 。 [不要|bù yào] 。', 'ソーダ 。 シュワシュワ する 。 [小|ちい]さな [悲鳴|ひめい] みたい 。 [無理|むり] 。'),
    'm.g.ok': Z2('[哦|ò] 。 [谢谢|xiè xie] 。 [我|wǒ] [会|huì] …… [收|shōu] [好|hǎo] 。 [放|fàng] [在|zài] [安全|ān quán] [的|de] [地方|dì fang] 。', 'あ 。 ありがとう 。 …… しまって おく 。 [大切|たいせつ] な [場所|ばしょ] に 。'),
    'm.f.candle': Z2('[请|qǐng] [把|bǎ] [蜡烛|là zhú] [拿|ná] [给|gěi] [我|wǒ] 。 [这|zhè] [根|gēn] [快|kuài] [灭|miè] [了|le] 。', 'ろうそく 、 [取|と]って くれる ？ これ 、 もう [消|き]えそう 。'),
    'm.f.book': Z2('[请|qǐng] [把|bǎ] [书|shū] [拿|ná] [给|gěi] [我|wǒ] 。 [紫色|zǐ sè] [封面|fēng miàn] [的|de] [那|nà] [本|běn] 。', '[本|ほん] 、 [取|と]って くれる ？ [紫|むらさき] の [表紙|ひょうし] の 。'),
    'm.f.cup': Z2('[请|qǐng] [把|bǎ] [杯子|bēi zi] [拿|ná] [给|gěi] [我|wǒ] 。 [我|wǒ] [的|de] [茶|chá] [凉|liáng] [了|le] 。', 'カップ 、 [取|と]って くれる ？ お[茶|ちゃ] が [冷|さ]めちゃった 。'),
    'm.f.blanket': Z2('[请|qǐng] [把|bǎ] [毯子|tǎn zi] [拿|ná] [给|gěi] [我|wǒ] 。 [我|wǒ] [好|hǎo] [冷|lěng] 。', '[毛布|もうふ] 、 [取|と]って くれる ？ [寒|さむ]い 。'),
    'm.f.record': Z2('[请|qǐng] [把|bǎ] [唱片|chàng piàn] [拿|ná] [给|gěi] [我|wǒ] 。 [我|wǒ] [想|xiǎng] [听|tīng] [悲伤|bēi shāng] [的|de] [音乐|yīn yuè] 。', 'レコード 、 [取|と]って くれる ？ [悲|かな]しい [音楽|おんがく] が [聴|き]きたい 。'),
    'm.f.ok': Z2('…… [谢谢|xiè xie] 。 [你|nǐ] [挺|tǐng] [有用|yǒu yòng] [的|de] 。 [顺便|shùn biàn] [说|shuō] [一|yī] [句|jù] ， [这|zhè] [是|shì] [夸|kuā] [你|nǐ] 。', '…… ありがとう 。 [役|やく] に [立|た]つ ね 。 ちなみに 、 ほめて る の 。'),
    'm.f.wrong': Z2('[这|zhè] [是|shì] {got} 。 [我|wǒ] [要|yào] [的|de] [是|shì] {want} 。 [再|zài] [找找|zhǎo zhao] 。', 'それ は {got} 。 わたし が [頼|たの]んだ の は {want} 。 もう [一回|いっかい] 。'),
    'm.d.touch': Z2('…… [嗯|èn] ？ [你|nǐ] [想|xiǎng] [要|yào] [什么|shén me] 。 [问|wèn] [吧|ba] 。', '…… なに ？ [何|なに]か [言|い]いたい ん でしょ 。 [聞|き]いて みて 。'),
    'm.d.touchYes': Z2('…… [可以|kě yǐ] 。 [别|bié] [搞|gǎo] [得|de] [怪怪|guài guài] [的|de] [就|jiù] [行|xíng] 。 …… [你|nǐ] [的|de] [手|shǒu] [好|hǎo] [暖|nuǎn] 。', '…… いい よ 。 [変|へん]な [空気|くうき] に しない で ね 。 …… [手|て] 、 あったかい 。'),
    'm.d.touchOrder': Z2('[这|zhè] [是|shì] [命令|mìng lìng] ， [不是|bù shì] [问题|wèn tí] 。 [试试|shì shi] [问|wèn] [我|wǒ] 。', 'それ は [命令|めいれい] 。 [質問|しつもん] じゃ ない 。 [聞|き]いて みて 。'),
    'm.d.touchHuh': Z2('[牵|qiān] …… [什么|shén me] ？ [好好|hǎo hǎo] [问|wèn] [我|wǒ] 。', 'つなぐ …… [何|なに] を ？ ちゃんと [聞|き]いて 。'),
    'm.d.touchAfter': Z2('…… [好|hǎo] [吧|ba] 。 [还|hái] [挺|tǐng] [好|hǎo] [的|de] 。 [别|bié] [告诉|gào su] [坡坡|Pō po] 。', '…… うん 。 よかった 。 ポー に は [内緒|ないしょ] 。'),
    'm.bu.1': Z2('[你|nǐ] [一|yī] [脸|liǎn] “ [我们|wǒ men] [得|děi] [谈谈|tán tan] ” [的|de] [表情|biǎo qíng] 。', 'その [顔|かお] 。 「 [話|はなし] が ある 」 って [顔|かお] 。'),
    'm.bu.blunt': Z2('[好|hǎo] [疼|téng] 。 [这|zhè] [不是|bù shì] [话|huà] ， [是|shì] [锤子|chuí zi] 。 [再|zài] [说|shuō] [一|yī] [次|cì] …… [小心|xiǎo xīn] [点|diǎn] 。', '[痛|いた]っ 。 それ 、 [言葉|ことば] じゃ なくて ハンマー 。 もう [一回|いっかい] …… [気|き] を つけて 。'),
    'm.bu.dodge': Z2('[天气|tiān qì] [很|hěn] [好|hǎo] 。 [现在|xiàn zài] [说|shuō] [真话|zhēn huà] 。', '[天気|てんき] は いい わ 。 [本題|ほんだい] を [言|い]って 。'),
    'm.bu.ok1': Z2('…… [好|hǎo] 。 [谢谢|xiè xie] [你|nǐ] [说|shuō] [出来|chū lái] ， [而|ér] [不是|bù shì] [默默|mò mò] [消失|xiāo shī] 。', '…… [分|わ]かった 。 [黙|だま]って [消|き]えないで 、 ちゃんと [言|い]って くれて ありがとう 。'),
    'm.bu.ok2': Z2('[走|zǒu] [吧|ba] 。 [不过|bù guò] [坡坡|Pō po] [会|huì] [一直|yī zhí] [瞪|dèng] [你|nǐ] 。', '[行|い]って 。 でも 、 ポー は ずっと あなた を にらむ から 。'),
    // ---------------- Dante
    'd.before': Z2('[嗨|hāi] ！ [新|xīn] [来|lái] [的|de] ？ [先|xiān] [去|qù] [水果|shuǐ guǒ] [摊|tān] [找|zhǎo] [罗莎|Luó shā] [奶奶|nǎi nai] 。 [她|tā] [谁|shéi] [都|dōu] [认识|rèn shi] ！', 'よう ！ [新入|しんい]り か ？ まず は [果物屋|くだものや] の ロサ さん に [会|あ]い に [行|い]き な 。 [誰|だれ] でも [知|し]って る ぜ ！'),
    'd.meet.1': Z2('♪ [啦|lā] [啦|lā] [啦|lā] —— ♪ [哦|ò] ！ [有|yǒu] [客人|kè rén] ！ [你好|nǐ hǎo] ！ [我|wǒ] [是|shì] [但丁|Dàn dīng] ！', '♪ ラ ラ ラー …… ♪ おっと ！ お[客|きゃく]さん だ ！ よう ！ [俺|おれ] は ダンテ ！'),
    'd.meet.2': Z2('[不好意思|bù hǎo yì si] ， [我|wǒ] [在|zài] [唱歌|chàng gē] 。 [我|wǒ] [唱歌|chàng gē] ， [寂静|Jì jìng] [就|jiù] [靠|kào] [不|bù] [近|jìn] 。 [越|yuè] [大声|dà shēng] [越|yuè] [安全|ān quán] ！', '[歌|うた]って て ごめん な 。 [歌|うた]って れば 、 [静寂|せいじゃく] は [近|ちか]づけない 。 うるさい ほど [安全|あんぜん] ！'),
    'd.meet.3': Z2('[我|wǒ] [是|shì] [铁匠|tiě jiang] 。 [嗯|èn] ， [我|wǒ] [修|xiū] [钟|zhōng] 。 [其实|qí shí] …… [我|wǒ] [只|zhǐ] [修|xiū] [这|zhè] [口|kǒu] [钟|zhōng] 。 [就|jiù] [一|yī] [口|kǒu] 。', '[俺|おれ] は [鍛冶屋|かじや] だ 。 まあ 、 [鐘|かね] を [直|なお]して る 。 て いう か …… この [鐘|かね] だけ 。 [一|ひと]つ だけ な 。'),
    'd.meet.4': Z2('[寂静|Jì jìng] [来|lái] [的|de] [那|nà] [天|tiān] ， [它|tā] [裂|liè] [了|le] 。 [它|tā] [是|shì] [阿尔巴|Ā ěr bā] [的|de] [声音|shēng yīn] 。 [我|wǒ] [一定|yī dìng] [要|yào] [把|bǎ] [它|tā] [修好|xiū hǎo] 。', '[静寂|せいじゃく] が [来|き]た [日|ひ] に 、 ひび が [入|はい]った 。 アルバ の [声|こえ] なん だ 。 [俺|おれ] が [直|なお]して みせる 。'),
    'd.meet.5': Z2('[大|dà] [活儿|huó r] [就|jiù] [交给|jiāo gěi] [我|wǒ] ！ [大家|dà jiā] [总|zǒng] [说|shuō] ： [但丁|Dàn dīng] ， [你|nǐ] [好|hǎo] [壮|zhuàng] [啊|a] ！', 'でかい [仕事|しごと] は [任|まか]せとけ ！ みんな いつも 「 ダンテ 、 [力持|ちからも]ち だ な 」 って [言|い]う ん だ 。'),
    'd.meet.6': Z2('…… [是|shì] [啊|a] 。 [壮|zhuàng] 。 [那|nà] [就是|jiù shì] [我|wǒ] 。', '…… まあ な 。 [力持|ちからも]ち 。 それ が [俺|おれ] だ 。'),
    'd.meet.7': Z2('[不过|bù guò] [嘿|hēi] ！ [我|wǒ] [已经|yǐ jīng] [觉得|jué de] [你|nǐ] [不错|bù cuò] [了|le] ！ “ {caes} ” ： [就是|jiù shì] [说|shuō] [你|nǐ] [是|shì] [个|gè] [好人|hǎo rén] 。 [你|nǐ] [也|yě] [对|duì] [我|wǒ] [说|shuō] [一|yī] [句|jù] ！', 'でも さ ！ もう [気|き] に [入|い]った ぜ ！ 「 {caes} 」 ： いい やつ だ って [意味|いみ] だ 。 [俺|おれ] に も [言|い]って くれ よ ！'),
    'd.meet.8': Z2('[哈|hā] ！ [完美|wán měi] ！ [随时|suí shí] [来|lái] ！ [带|dài] [上|shang] [你|nǐ] [的|de] [耳朵|ěr duo] ！ [我|wǒ] [有|yǒu] [好多|hǎo duō] [歌|gē] ！', 'ハハッ ！ [完璧|かんぺき] ！ いつ でも [来|こ]い よ ！ [耳|みみ] を [持|も]って こい ！ [歌|うた] なら いくら でも ある ！'),
    'd.meet.skip': Z2('[害羞|hài xiū] ？ [没|méi] [问题|wèn tí] ！ [我|wǒ] [一个人|yī gè rén] [的|de] [嗓门|sǎng mén] [够|gòu] [两个人|liǎng gè rén] [用|yòng] ！', '[照|て]れ[屋|や] か ？ [問題|もんだい] ない ！ [俺|おれ] が [二人分|ふたりぶん] うるさい から ！'),
    'd.r2.1': Z2('[嘿|hēi] ， [你|nǐ] [又|yòu] [来|lái] [了|le] ！ [大部分|dà bù fen] [人|rén] [回来|huí lái] [只是|zhǐ shì] [为了|wèi le] [煤|méi] 。', 'おお 、 また [来|き]た な ！ たいてい の やつ は 、 [石炭|せきたん] [目当|めあ]て で しか [来|こ]ない のに 。'),
    'd.r2.2': Z2('[我|wǒ] [二十四|èr shí sì] [岁|suì] [了|le] ， [还|hái] [对|duì] [着|zhe] [铁砧|tiě zhēn] [唱歌|chàng gē] 。 [别|bié] [告诉|gào su] [别人|bié rén] 。', '[俺|おれ] 、 [二十四|にじゅうよん] に も なって 、 まだ [金床|かなとこ] に [歌|うた]って る ん だ 。 [内緒|ないしょ] な 。'),
    'd.r2.3': Z2('[你|nǐ] [知道|zhī dào] [吗|ma] ？ [我|wǒ] [写|xiě] [歌词|gē cí] 。 [写|xiě] [了|le] [好几|hǎo jǐ] [本|běn] 。 [那些|nà xiē] [我|wǒ] [从来|cóng lái] [不|bù] [唱|chàng] 。', '[実|じつ] は 、 [歌詞|かし] を [書|か]いて る ん だ 。 ノート [何冊|なんさつ] も 。 そっち は 、 [一度|いちど] も [歌|うた]った こと ない 。'),
    'd.r2.4': Z2('[那些|nà xiē] [是|shì] [安静|ān jìng] [的|de] [歌|gē] 。 [可|kě] [安静|ān jìng] [让|ràng] [我|wǒ] [害怕|hài pà] 。 “ [壮汉|zhuàng hàn] ” [居然|jū rán] [怕|pà] [安静|ān jìng] 。 [好笑|hǎo xiào] [吧|ba] ？', '[静|しず]かな [歌|うた] なん だ 。 で 、 [俺|おれ] は [静|しず]けさ が [怖|こわ]い 。 「 [力持|ちからも]ち 」 が 、 [静|しず]けさ を [怖|こわ]がる 。 [笑|わら]える だろ ？'),
    'd.r2.5': Z2('[但|dàn] [你|nǐ] [不|bù] [笑话|xiào hua] [我|wǒ] 。 [你|nǐ] [跟|gēn] [我|wǒ] [一起|yī qǐ] [笑|xiào] 。 [这|zhè] [不|bù] [一样|yī yàng] 。', 'でも 、 [君|きみ] は [俺|おれ] を [笑|わら]わない 。 [一緒|いっしょ] に [笑|わら]って くれる 。 それ って 、 [全然|ぜんぜん] [違|ちが]う ん だ 。'),
    'd.r2.6': Z2('[嘿|hēi] 。 “ {caes} ” [是|shì] [对|duì] [朋友|péng you] [说|shuō] [的|de] 。 “ {gustas} ” [嘛|ma] …… [是|shì] [朋友|péng you] [以上|yǐ shàng] [的|de] 。 [只是|zhǐ shì] [个|gè] [冷知识|lěng zhī shi] ！ [完全|wán quán] [随便|suí biàn] [说说|shuō shuo] ！', 'なあ 。 「 {caes} 」 は [友達|ともだち] に [言|い]う [言葉|ことば] 。 「 {gustas} 」 は …… [友達|ともだち] [以上|いじょう] 。 ただ の [豆知識|まめちしき] だ ！ [深|ふか]い [意味|いみ] は ない ！'),
    'd.r2.7': Z2('…… [哦|ò] 。 [哦|ò] ！ [好|hǎo] 。 [我|wǒ] [脸|liǎn] [好|hǎo] [烫|tàng] 。 [是|shì] [炉子|lú zi] [的|de] [关系|guān xi] 。 [肯定|kěn dìng] [是|shì] [炉子|lú zi] 。', '…… あ 。 ああ ！ そっか 。 [顔|かお] が [熱|あつ]い 。 [炉|ろ] の せい だ 。 [絶対|ぜったい] [炉|ろ] の せい だ 。'),
    'd.r2.yes': Z2('[真的|zhēn de] [吗|ma] ？ ！ [我|wǒ] [是|shì] [说|shuō] …… [好|hǎo] ！ [当然|dāng rán] [好|hǎo] ！', 'マジ で ？ ！ いや …… もちろん ！ よろこんで ！'),
    'd.r2.no': Z2('[还|hái] [有|yǒu] [别|bié] [的|de] [事|shì] [吗|ma] ？ [没有|méi yǒu] ？ [好|hǎo] [嘞|lei] ！ [我|wǒ] [继续|jì xù] [打铁|dǎ tiě] ！', '[他|ほか] に [何|なに]か ある ？ ない ？ よし ！ [打|う]ち[続|つづ]ける ぜ ！'),
    'd.r2.rival1': Z2('[等等|děng deng] ！ [你|nǐ] [身上|shēn shang] [有|yǒu] [蜡烛|là zhú] [和|hé] [旧书|jiù shū] [的|de] [味道|wèi dao] 。 [你|nǐ] [跟|gēn] [破|pò] [房子|fáng zi] [里|lǐ] [那个|nà ge] [诗人|shī rén] [在一起|zài yī qǐ] [了|le] ！', '[待|ま]った ！ ろうそく と [古|ふる]い [本|ほん] の におい が する ぞ 。 [壊|こわ]れた [家|いえ] の 、 あの [詩人|しじん] と [付|つ]き[合|あ]って る な ！'),
    'd.r2.rival2': Z2('[那|nà] [就|jiù] [正式|zhèng shì] [宣布|xuān bù] ： [我们|wǒ men] [是|shì] [对手|duì shǒu] ！ [友好|yǒu hǎo] [的|de] [对手|duì shǒu] 。 [超级|chāo jí] [大声|dà shēng] [的|de] 。', 'じゃあ [正式|せいしき] に 、 [俺|おれ] たち は ライバル だ ！ [仲良|なかよ]し の ライバル 。 めちゃくちゃ うるさい やつ な 。'),
    'd.r3.1': Z2('[我|wǒ] [看到|kàn dào] [山坡|shān pō] [变|biàn] [绿|lǜ] [了|le] ！ [在|zài] [塔|tǎ] [顶|dǐng] [上|shang] [看到|kàn dào] [的|de] ！ [我|wǒ] [喊|hǎn] [得|de] [太|tài] [大声|dà shēng] ， [一|yī] [只|zhī] [鸽子|gē zi] [都|dōu] [晕|yūn] [过去|guò qù] [了|le] 。', '[丘|おか] が [緑|みどり] に なる の を [見|み]た ぜ ！ [塔|とう] の [上|うえ] から ！ [叫|さけ]び すぎて 、 ハト が [一羽|いちわ] [気絶|きぜつ] した 。'),
    'd.r3.2': Z2('[你|nǐ] [用|yòng] [话语|huà yǔ] [打败|dǎ bài] [了|le] [灰色|huī sè] 。 [我|wǒ] [用|yòng] [噪音|zào yīn] 。 [也许|yě xǔ] [话语|huà yǔ] [更|gèng] [好|hǎo] 。', '[君|きみ] は [言葉|ことば] で [灰色|はいいろ] と [戦|たたか]った 。 [俺|おれ] は [音|おと] で [戦|たたか]う 。 [言葉|ことば] の ほう が いい の かも な 。'),
    'd.r3.3': Z2('[我|wǒ] [爷爷|yé ye] [也|yě] [是|shì] [铁匠|tiě jiang] 。 [他|tā] [常|cháng] [说|shuō] ： [钟|zhōng] [会|huì] [唱歌|chàng gē] ， [是|shì] [因为|yīn wèi] [里面|lǐ miàn] [是|shì] [空|kōng] [的|de] 。', 'じいちゃん も [鍛冶屋|かじや] だった 。 よく [言|い]って た ん だ 。 [鐘|かね] が [歌|うた]う の は 、 [中|なか] が [空|から]っぽ だ から だ って 。'),
    'd.r3.4': Z2('[里面|lǐ miàn] [安静|ān jìng] ， [外面|wài miàn] [响亮|xiǎng liàng] 。 [以前|yǐ qián] [我|wǒ] [不|bù] [懂|dǒng] 。 [也许|yě xǔ] [现在|xiàn zài] [懂|dǒng] [了|le] 。 [也许|yě xǔ] [安静|ān jìng] [只是|zhǐ shì] …… [空间|kōng jiān] 。', '[中|なか] は [静|しず]か で 、 [外|そと] は にぎやか 。 [前|まえ] は [分|わ]からなかった 。 [今|いま] なら [分|わ]かる かも 。 [静|しず]けさ って 、 ただ の …… [余白|よはく] なん だ な 。'),
    'd.r3.5': Z2('…… [你|nǐ] [可以|kě yǐ] [牵|qiān] [我|wǒ] [的|de] [手|shǒu] [哦|ò] 。 [只要|zhǐ yào] [你|nǐ] [问|wèn] 。 [我|wǒ] [的|de] [手|shǒu] [很|hěn] [大|dà] ， [但|dàn] [很|hěn] [温柔|wēn róu] 。', '…… [手|て] 、 つないで も いい ん だ ぜ 。 [聞|き]いて くれたら な 。 [俺|おれ] の [手|て] は でかい けど 、 やさしい から 。'),
    'd.r4.1': Z2('[你|nǐ] [见|jiàn] [到|dào] [磨坊镇|Mò fáng zhèn] [的|de] [钟表匠|zhōng biǎo jiàng] [了|le] ？ [他|tā] [认识|rèn shi] [我|wǒ] [爷爷|yé ye] ！', 'モリナール の [時計屋|とけいや] に [会|あ]った の か ？ じいちゃん の [知|し]り[合|あ]い なん だ ！'),
    'd.r4.2': Z2('[西罗|Xī luó] [说|shuō] ， [钟|zhōng] [和|hé] [钟|zhōng] [会|huì] [互相|hù xiāng] [回应|huí yìng] 。 [一|yī] [口|kǒu] [响|xiǎng] [了|le] ， [别的|bié de] [也|yě] [想|xiǎng] [响|xiǎng] 。', 'シロ さん が [言|い]う に は 、 [鐘|かね] は [答|こた]え[合|あ]う ん だって 。 [一|ひと]つ が [鳴|な]れば 、 [他|ほか] の も [鳴|な]りたく なる 。'),
    'd.r4.3': Z2('[就|jiù] [像|xiàng] [人|rén] 。 [就|jiù] [像|xiàng] …… [我们|wǒ men] 。', '[人|ひと] みたい に 。 …… [俺|おれ] たち みたい に 。'),
    'd.r4.4': Z2('[总有一天|zǒng yǒu yī tiān] ， [我|wǒ] [想|xiǎng] [唱|chàng] [首|shǒu] [歌|gē] [给|gěi] [你|nǐ] [听|tīng] 。 [可是|kě shì] [歌词|gē cí] [还|hái] [没|méi] [写|xiě] [在|zài] [纸|zhǐ] [上|shang] 。', 'いつか 、 [君|きみ] に [歌|うた]って あげたい [歌|うた] が ある 。 でも 、 [歌詞|かし] が まだ [紙|かみ] に なって ない ん だ 。'),
    'd.r4.5': Z2('[我|wǒ] [满手|mǎn shǒu] [都|dōu] [是|shì] [煤|méi] 。 [我|wǒ] [唱|chàng] ， [你|nǐ] [帮|bāng] [我|wǒ] [写|xiě] [下来|xià lái] [好|hǎo] [吗|ma] ？ [慢慢|màn màn] [地|de] 。 [轻轻|qīng qīng] [地|de] 。', '[手|て] が [石炭|せきたん] だらけ なん だ 。 [俺|おれ] が [歌|うた]う から 、 [書|か]き[取|と]って くれない か ？ ゆっくり 。 [静|しず]か に 。'),
    'd.r4.6': Z2('[你|nǐ] [写|xiě] [下来|xià lái] [了|le] ！ [你|nǐ] [写|xiě] [下|xià] [了|le] [我|wǒ] [的|de] [歌|gē] ！ …… [抱歉|bào qiàn] 。 [小声|xiǎo shēng] [点|diǎn] ： [你|nǐ] [写|xiě] [下|xià] [了|le] [我|wǒ] [的|de] [歌|gē] 。', '[書|か]いて くれた ！ [俺|おれ] の [歌|うた] を [書|か]いて くれた ！ …… わりぃ 。 [小|ちい]さい [声|こえ] で 。 [俺|おれ] の [歌|うた] を 、 [書|か]いて くれた 。'),
    'd.r4.7': Z2('[大家|dà jiā] [都|dōu] [说|shuō] [我|wǒ] [壮|zhuàng] 。 [你|nǐ] [是|shì] [第一个|dì yī gè] [让|ràng] [我|wǒ] [觉得|jué de] [自己|zì jǐ] [是|shì] [词曲|cí qǔ] [作者|zuò zhě] [的|de] [人|rén] 。', 'みんな 、 [俺|おれ] を [力持|ちからも]ち って [呼|よ]ぶ 。 [俺|おれ] を [作詞家|さくしか] の [気分|きぶん] に させて くれた の は 、 [君|きみ] が [初|はじ]めて だ 。'),
    'd.r4.skip': Z2('[现在|xiàn zài] [不行|bù xíng] ？ [没关系|méi guān xi] ！ [歌|gē] [可以|kě yǐ] [等|děng] 。 [它|tā] [很|hěn] [有|yǒu] [耐心|nài xīn] 。 [不|bù] [像|xiàng] [我|wǒ] 。', '[今|いま] は ダメ か ？ いい って ！ [歌|うた] は [待|ま]てる 。 [気|き] が [長|なが]い から な 。 [俺|おれ] と [違|ちが]って 。'),
    'd.r5.1': Z2('[你|nǐ] [听到|tīng dào] [了|le] [吗|ma] ？ ！ [第一|dì yī] [口|kǒu] [钟|zhōng] ！ [我|wǒ] [唱|chàng] [了|le] [一|yī] [整夜|zhěng yè] ！ [唱|chàng] [得|de] [很|hěn] [烂|làn] ！ [很|hěn] [大声|dà shēng] ！', '[聞|き]こえた か ？ ！ [最初|さいしょ] の [鐘|かね] ！ [一晩中|ひとばんじゅう] [歌|うた]った ぜ ！ [下手|へた] くそ に ！ [大声|おおごえ] で ！'),
    'd.r5.2': Z2('[然后|rán hòu] [我|wǒ] [停|tíng] [了|le] 。 [四周|sì zhōu] [很|hěn] [安静|ān jìng] 。 [可是|kě shì] [什么|shén me] [也|yě] [没有|méi yǒu] [带走|dài zǒu] [我|wǒ] [的|de] [话|huà] 。', 'それ から 、 [歌|うた] を やめた 。 [静|しず]か に なった 。 でも 、 [何|なに] も [俺|おれ] の [言葉|ことば] を [奪|うば]わなかった 。'),
    'd.r5.3': Z2('[因为|yīn wèi] [你|nǐ] [在|zài] 。 [在|zài] [我|wǒ] [脑子|nǎo zi] [里|lǐ] 。 [我|wǒ] [想|xiǎng] [是|shì] [吧|ba] 。 …… [你|nǐ] [好像|hǎo xiàng] [有|yǒu] [话|huà] [要|yào] [说|shuō] 。', '[君|きみ] が いた から だ 。 [俺|おれ] の [頭|あたま] の [中|なか] に 。 たぶん な 。 …… [何|なに]か [言|い]いたそう な [顔|かお] だ な 。'),
    'd.r5.amo1': Z2('“ {amo} ” ？ ！ [哇|wā] ！ [我|wǒ] [奶奶|nǎi nai] [只有|zhǐ yǒu] [对|duì] [着|zhe] [电视剧|diàn shì jù] [才|cái] [这么|zhè me] [说|shuō] ！', '「 {amo} 」 ？ ！ うおっ ！ ばあちゃん が [昼|ひる]ドラ に [言|い]う セリフ じゃん ！'),
    'd.r5.amo2': Z2('[我们|wǒ men] [先|xiān] [从|cóng] “ {quiero} ” [开始|kāi shǐ] [吧|ba] ？ [我|wǒ] [是|shì] [慢火|màn huǒ] [炖|dùn] [的|de] 。 [像|xiàng] [一|yī] [锅|guō] [好|hǎo] [汤|tāng] 。', 'まず は 「 {quiero} 」 から に しよう ぜ ？ [俺|おれ] 、 じっくり [煮込|にこ]む タイプ なん だ 。 うまい シチュー みたい に 。'),
    'd.r5.quiero': Z2('[我|wǒ] [也|yě] [喜欢|xǐ huan] [你|nǐ] ！ …… [抱歉|bào qiàn] ， [太|tài] [大声|dà shēng] [了|le] 。 （ [小声|xiǎo shēng] ） [我|wǒ] [也|yě] [喜欢|xǐ huan] [你|nǐ] 。', '[俺|おれ] も [大好|だいす]き だ ！ …… わりぃ 、 [声|こえ] が でかすぎた 。 （ [小声|こごえ] で ） [俺|おれ] も 、 [大好|だいす]き だ 。'),
    'd.r5.shy': Z2('[说|shuō] [不|bù] [出|chū] [话|huà] ？ [没关系|méi guān xi] 。 [我|wǒ] [在|zài] [学|xué] ， [安静|ān jìng] [也|yě] [挺|tǐng] [好|hǎo] [的|de] 。', '[言葉|ことば] が [出|で]ない ？ いい ん だ 。 [静|しず]か な の も [悪|わる]く ない って 、 [今|いま] [勉強中|べんきょうちゅう] だ から 。'),
    'd.r5.4': Z2('[我|wǒ] [写|xiě] [了|le] [一|yī] [首|shǒu] [歌|gē] 。 [从来|cóng lái] [没|méi] [唱|chàng] [过|guo] 。 [连|lián] [铁砧|tiě zhēn] [都|dōu] [没|méi] [听|tīng] [过|guo] 。 [你|nǐ] [听|tīng] 。', '[歌|うた] を [作|つく]った ん だ 。 [一度|いちど] も [歌|うた]って ない 。 [金床|かなとこ] に も 。 [聴|き]いて くれ 。'),
    'd.r5.5': Z2('…… [现在|xiàn zài] [好|hǎo] [安静|ān jìng] 。 [可是|kě shì] [我|wǒ] [一点|yī diǎn] [也|yě] [不|bù] [怕|pà] 。', '…… [静|しず]か に なった な 。 でも 、 ちっとも [怖|こわ]く ない 。'),
    'd.r5.6': Z2('[过来|guò lái] 。 [抱|bào] [一下|yī xià] 。 [轻轻|qīng qīng] [的|de] 。 [我|wǒ] [在|zài] [练习|liàn xí] [温柔|wēn róu] 。', 'こっち [来|こ]い よ 。 ハグ だ 。 そっと な 。 やさしく する [練習中|れんしゅうちゅう] なん だ 。'),
    'd.r5.7': Z2('[你|nǐ] [听到|tīng dào] [了|le] [吗|ma] ？ [钟|zhōng] [响|xiǎng] [得|de] [很|hěn] [准|zhǔn] 。 [就|jiù] [一|yī] [下|xià] 。 [今天|jīn tiān] [够|gòu] [了|le] 。', '[聞|き]こえた か ？ [鐘|かね] が 、 ちゃんと [鳴|な]った 。 [一回|いっかい] だけ 。 [今日|きょう] は それ で じゅうぶん だ 。'),
    'd.gate.boss': Z2('[你|nǐ] [看到|kàn dào] [村子|cūn zi] [东边|dōng biān] [那|nà] [座|zuò] [灰色|huī sè] [的|de] [山坡|shān pō] [了|le] [吗|ma] ？ [得|děi] [有人|yǒu rén] [冲|chòng] [它|tā] [喊|hǎn] 。 [用|yòng] [话语|huà yǔ] ！', '[村|むら] の [東|ひがし] の 、 [灰色|はいいろ] の [丘|おか] を [見|み]た か ？ [誰|だれ]か が [怒鳴|どな]って やらない と な 。 [言葉|ことば] で ！'),
    'd.gate.ciro': Z2('[去|qù] [找|zhǎo] [磨坊镇|Mò fáng zhèn] [的|de] [钟表匠|zhōng biǎo jiàng] [西罗|Xī luó] ！ [钟|zhōng] [的|de] [事|shì] [他|tā] [全|quán] [知道|zhī dào] 。 [然后|rán hòu] [回来|huí lái] [告诉|gào su] [我|wǒ] ！', 'モリナール の [時計屋|とけいや] 、 シロ さん に [会|あ]って こい ！ [鐘|かね] の こと なら [何|なん] でも [知|し]って る 。 それ から 、 [俺|おれ] に [話|はな]して くれ ！'),
    'd.gate.bell': Z2('[要是|yào shi] [有|yǒu] [一|yī] [口|kǒu] [大|dà] [钟|zhōng] [再|zài] [响|xiǎng] [起来|qǐ lái] ， [我|wǒ] [就|jiù] [唱|chàng] [一|yī] [整夜|zhěng yè] 。 [说到做到|shuō dào zuò dào] ！', 'でかい [鐘|かね] が また [一|ひと]つ でも [鳴|な]ったら 、 [一晩中|ひとばんじゅう] [歌|うた]う ぜ 。 [約束|やくそく] だ ！'),
    'd.chat.1': Z2('[如果|rú guǒ] [你|nǐ] [凌晨|líng chén] [三|sān] [点|diǎn] [听到|tīng dào] [有人|yǒu rén] [唱歌|chàng gē] ， [那|nà] [不是|bù shì] [寂静|Jì jìng] 。 [是|shì] [我|wǒ] 。', '[夜中|よなか] の [三時|さんじ] に [歌|うた] が [聞|き]こえたら 、 それ は [静寂|せいじゃく] じゃ ない 。 [俺|おれ] だ 。'),
    'd.chat.2': Z2('[这|zhè] [块|kuài] [铁砧|tiě zhēn] [跟|gēn] [我|wǒ] [一起|yī qǐ] [经历|jīng lì] [了|le] [很多|hěn duō] 。 [主要|zhǔ yào] [是|shì] [我|wǒ] [的|de] [歌声|gē shēng] 。', 'この [金床|かなとこ] と は 、 いろいろ [乗|の]り[越|こ]えて きた 。 ほとんど [俺|おれ] の [歌|うた] だ けど な 。'),
    'd.chat.3': Z2('[玛尔塔|Mǎ ěr tǎ] [说|shuō] ， [我|wǒ] [唱|chàng] [小声|xiǎo shēng] [点|diǎn] [就|jiù] [送|sòng] [我|wǒ] [面包|miàn bāo] 。 [我|wǒ] [从来|cóng lái] [没|méi] [吃|chī] [过|guo] [免费|miǎn fèi] [的|de] [面包|miàn bāo] 。', 'マルタ さん は 、 [静|しず]か に [歌|うた]えば パン を タダ で くれる って 。 タダ の パン 、 [食|た]べた こと ない 。'),
    'd.chat.4': Z2('[你|nǐ] [来|lái] [了|le] ！ [我|wǒ] [最|zuì] [喜欢|xǐ huan] [的|de] [人|rén] ！ [别|bié] [告诉|gào su] [铁砧|tiě zhēn] 。', '[来|き]た な ！ [俺|おれ] の いちばん の [推|お]し ！ [金床|かなとこ] に は [内緒|ないしょ] な 。'),
    'd.chat.5': Z2('[我|wǒ] [现在|xiàn zài] [会|huì] [唱|chàng] [安静|ān jìng] [的|de] [歌|gē] [了|le] 。 [有时候|yǒu shí hou] 。 [鸽子|gē zi] [们|men] [都|dōu] [糊涂|hú tu] [了|le] 。', '[最近|さいきん] は [静|しず]かな [歌|うた] も [歌|うた]う ん だ 。 たまに な 。 ハト たち が [混乱|こんらん] して る 。'),
    'd.cool': Z2('[又|yòu] [来|lái] ？ [等|děng] [我|wǒ] [一|yī] [分钟|fēn zhōng] ， [我|wǒ] [正|zhèng] [忙|máng] [着|zhe] [修|xiū] [钟|zhōng] [呢|ne] ！', 'また か ？ ちょっと [待|ま]って くれ 、 [鐘|かね] の [途中|とちゅう] なん だ ！'),
    'd.wait': Z2('[你|nǐ] [跟|gēn] [莫甘娜|Mò gān nà] [谈|tán] [了|le] [吗|ma] ？ [好好|hǎo hǎo] [地|de] ？', 'もう モルガナ と [話|はな]した か ？ やさしく な ？'),
    'd.switch.yes': Z2('[真的|zhēn de] [吗|ma] ？ ！ [好|hǎo] ！ …… [抱歉|bào qiàn] ， [太|tài] [大声|dà shēng] [了|le] 。 [好|hǎo] 。', 'マジ か ？ ！ よっしゃ ！ …… わりぃ 、 うるさかった な 。 よろしく 。'),
    'd.d.words': Z2('[夸|kuā] [我|wǒ] ？ [夸|kuā] [我|wǒ] [吗|ma] ？ [来|lái] [吧|ba] ！ [我|wǒ] [准备|zhǔn bèi] [好|hǎo] [了|le] ！ [超级|chāo jí] [准备|zhǔn bèi] [好|hǎo] [了|le] ！', 'ほめ[言葉|ことば] ？ [俺|おれ] に ？ さあ [来|こ]い ！ [準備|じゅんび] OK ！ [準備|じゅんび] [万端|ばんたん] だ ！'),
    'd.d.wordsLove': Z2('[我|wǒ] ？ “ {adj} ” ？ [从来|cóng lái] [没|méi] [人|rén] [这么|zhè me] [说|shuō] [过|guo] ！ [再|zài] [大声|dà shēng] [点|diǎn] ！ [不|bù] ， [等等|děng deng] ， [小声|xiǎo shēng] [点|diǎn] 。 [我|wǒ] [想|xiǎng] [好好|hǎo hǎo] [收|shōu] [着|zhe] 。', '[俺|おれ] が ？ 「 {adj} 」 ？ そんな の 、 [誰|だれ] も [言|い]って くれない ぞ ！ もっと [大|おお]きい [声|こえ] で ！ いや 、 [待|ま]て 、 [小|ちい]さく 。 [大事|だいじ] に とって おきたい 。'),
    'd.d.wordsOk': Z2('[哈|hā] ！ [谢谢|xiè xie] ！ [你|nǐ] [害|hài] [我|wǒ] [脸红|liǎn hóng] [了|le] 。 [是|shì] [炉子|lú zi] [的|de] [关系|guān xi] 。 [大概|dà gài] 。', 'ハハッ ！ ありがとう ！ [照|て]れる な 。 [炉|ろ] の せい だ 。 たぶん 。'),
    'd.d.wordsMeh': Z2('“ {adj} ” 。 [是|shì] [啊|a] 。 [大家|dà jiā] [都|dōu] [这么|zhè me] [说|shuō] 。 （ [叹气|tàn qì] ） …… [不过|bù guò] [还是|hái shi] [谢谢|xiè xie] 。', '「 {adj} 」 。 ああ 。 みんな そう [言|い]う 。 （ ため[息|いき] ） …… まあ 、 ありがとう な 。'),
    'd.d.wordsSlip': Z2('“ {adj} ” ？ [哈|hā] ！ [是|shì] “ {fix} ” [啦|la] ！ [不过|bù guò] [我|wǒ] [还是|hái shi] [超|chāo] [开心|kāi xīn] ！', '「 {adj} 」 ？ ハハッ ！ 「 {fix} 」 だろ ！ でも 、 [最高|さいこう] に うれしい ぜ ！'),
    'd.d.wordsOdd': Z2('[这个|zhè ge] [词|cí] [我|wǒ] [不|bù] [认识|rèn shi] ， [不过|bù guò] [听|tīng] [起来|qǐ lái] [很|hěn] [好听|hǎo tīng] ！ [谢谢|xiè xie] ！', 'その [言葉|ことば] 、 [知|し]らない けど 、 いい [響|ひび]き だ ！ ありがとう ！'),
    'd.d.time': Z2('[散步|sàn bù] ！ [绕|rào] [着|zhe] [广场|guǎng chǎng] [走|zǒu] ！ [我|wǒ] [会|huì] [试着|shì zhe] [小声|xiǎo shēng] [说话|shuō huà] 。 [不|bù] [保证|bǎo zhèng] [哦|ò] ！', '[散歩|さんぽ] ！ [広場|ひろば] を ぐるっと ！ [小|ちい]さい [声|こえ] で [話|はな]す よう に する 。 [約束|やくそく] は できない けど な ！'),
    'd.d.timeOk': Z2('[太|tài] [好|hǎo] [了|le] ！ [你|nǐ] [在|zài] [听|tīng] ！ [每|měi] [个|gè] [字|zì] [都|dōu] [听|tīng] [了|le] ！ [我|wǒ] [的|de] [心|xīn] [在|zài] [打|dǎ] [鼓|gǔ] [独奏|dú zòu] ！', 'よっしゃ ！ [聞|き]いて て くれた ！ [全部|ぜんぶ] ！ [俺|おれ] の [心臓|しんぞう] が ドラムソロ[中|ちゅう] だ ！'),
    'd.d.timeNo': Z2('[哈|hā] ！ [不|bù] [对|duì] ！ [我|wǒ] [太|tài] [吵|chǎo] [了|le] [吗|ma] ？ [肯定|kěn dìng] [是|shì] 。 [改天|gǎi tiān] [再|zài] [讲|jiǎng] [一|yī] [遍|biàn] ！', 'ハハッ ！ はずれ ！ [声|こえ] が でかすぎた か ？ でかすぎた な 。 また [今度|こんど] [話|はな]す よ ！'),
    'd.d.gift': Z2('[礼物|lǐ wù] ？ ！ [给|gěi] [我|wǒ] [的|de] ？ ！ [是|shì] [什么|shén me] ？ [是|shì] [什么|shén me] ？', 'プレゼント ？ ！ [俺|おれ] に ？ ！ [何|なん] だ 、 [何|なん] だ ？'),
    'd.g.honey': Z2('[蜂蜜|fēng mì] ！ [润|rùn] [嗓子|sǎng zi] ！ [唱歌|chàng gē] [用|yòng] ！ [你|nǐ] [太|tài] [懂|dǒng] [我|wǒ] [了|le] ！', 'はちみつ ！ のど に いい ！ [歌|うた] の ため に ！ [分|わ]かって る な ！'),
    'd.g.bread': Z2('[面包|miàn bāo] ！ [玛尔塔|Mǎ ěr tǎ] [家|jiā] [的|de] ？ [当然|dāng rán] [啦|la] ！ [分|fēn] [你|nǐ] [一半|yī bàn] ！ …… [好|hǎo] [吧|ba] ， [三分之一|sān fēn zhī yī] 。', 'パン ！ マルタ さん の [店|みせ] の か ？ もちろん だ よ な ！ [半分|はんぶん] やる よ ！ …… いや 、 [三分|さんぶん] の [一|いち] 。'),
    'd.g.newspaper': Z2('[报纸|bào zhǐ] ？ [没有|méi yǒu] [音乐|yīn yuè] [的|de] [字|zì] ！ …… [拿|ná] [来|lái] [生火|shēng huǒ] [吧|ba] 。 [谢|xiè] [啦|la] ！', '[新聞|しんぶん] ？ [音楽|おんがく] の ない [言葉|ことば] か ！ …… [炉|ろ] の [火|ひ] つけ に [使|つか]う よ 。 サンキュー ！'),
    'd.g.gum': Z2('[口香糖|kǒu xiāng táng] ！ [上次|shàng cì] [它|tā] [粘|zhān] [在|zài] [我|wǒ] [胡子|hú zi] [上|shang] [一|yī] [个|gè] [星期|xīng qī] 。', 'ガム ！ この [前|まえ] 、 ひげ に くっついて [一週間|いっしゅうかん] [取|と]れなかった ん だ 。'),
    'd.g.flower': Z2('[一|yī] [朵|duǒ] [花|huā] ！ [我|wǒ] [把|bǎ] [它|tā] [放|fàng] [在|zài] [铁砧|tiě zhēn] [上|shang] 。 [铁砧|tiě zhēn] [也|yě] [值得|zhí de] [拥有|yōng yǒu] [美好|měi hǎo] [的|de] [东西|dōng xi] 。', '[花|はな] ！ [金床|かなとこ] に [飾|かざ]る よ 。 [金床|かなとこ] だって 、 きれい な もの が ほしい はず だ 。'),
    'd.g.hat': Z2('[帽子|mào zi] ！ [现在|xiàn zài] [我|wǒ] [像|xiàng] [个|gè] [会|huì] [唱歌|chàng gē] [的|de] [农夫|nóng fū] ！', '[帽子|ぼうし] ！ これ で [歌|うた]う [農家|のうか] の [人|ひと] みたい だ ！'),
    'd.g.ok': Z2('[给|gěi] [我|wǒ] [的|de] ？ [你|nǐ] [最|zuì] [好|hǎo] [了|le] ！ [我|wǒ] [现在|xiàn zài] [就|jiù] [要|yào] [吃|chī] 。 [先|xiān] [用|yòng] [眼睛|yǎn jing] [吃|chī] 。', '[俺|おれ] に ？ [最高|さいこう] だ ！ [今|いま] すぐ いただく ぜ 。 まず は [目|め] で 。'),
    'd.d.bell': Z2('[帮|bāng] [忙|máng] ？ [好|hǎo] [啊|a] ！ [帮|bāng] [我|wǒ] [试试|shì shi] [这|zhè] [口|kǒu] [钟|zhōng] 。 [我|wǒ] [敲|qiāo] ， [你|nǐ] [数|shǔ] 。 [它|tā] [响|xiǎng] [几|jǐ] [下|xià] ？', '[手伝|てつだ]い ？ よっしゃ ！ [鐘|かね] の テスト を [手伝|てつだ]って くれ 。 [俺|おれ] が [鳴|な]らす から 、 [君|きみ] が [数|かぞ]えて 。 [何回|なんかい] [鳴|な]る ？'),
    'd.d.bellOk': Z2('{n} ！ [没错|méi cuò] ！ [好|hǎo] [耳朵|ěr duo] ！ [从|cóng] [今天|jīn tiān] [起|qǐ] ， [你|nǐ] [就是|jiù shì] [我|wǒ] [的|de] [正式|zhèng shì] [数钟员|shǔ zhōng yuán] ！', '{n} ！ [正解|せいかい] ！ いい [耳|みみ] だ ！ [今日|きょう] から 、 [君|きみ] が [俺|おれ] の [公式|こうしき] カウンター だ ！'),
    'd.d.bellNo': Z2('[哈|hā] ！ [不|bù] [对|duì] ， [是|shì] {n} ！ [你|nǐ] [连|lián] [回声|huí shēng] [也|yě] [数|shǔ] [了|le] [吗|ma] ？ [回声|huí shēng] [不|bù] [算|suàn] ！', 'ハハッ ！ ちがう 、 {n} だ ！ こだま まで [数|かぞ]えた か ？ こだま は [数|かず] に [入|はい]らない ぞ ！'),
    'd.d.touch': Z2('[嗯|èn] ？ [怎么|zěn me] [了|le] ？ [你|nǐ] [好像|hǎo xiàng] [想|xiǎng] [问|wèn] [什么|shén me] ！', 'ん ？ どうした ？ [何|なに]か [聞|き]きたそう な [顔|かお] だ な ！'),
    'd.d.touchYes': Z2('[可以|kě yǐ] ！ [我|wǒ] [是|shì] [说|shuō] …… [可以|kě yǐ] 。 [轻轻|qīng qīng] [地|de] 。 [看|kàn] ， [温柔|wēn róu] [的|de] [手|shǒu] 。', 'もちろん ！ いや …… うん 。 そっと な 。 ほら 、 やさしい [手|て] だろ ？'),
    'd.d.touchOrder': Z2('[哎|āi] ， [哎|āi] ！ [先|xiān] [问|wèn] [一下|yī xià] ！ [问|wèn] [了|le] [才|cái] [更|gèng] [好|hǎo] 。', 'おっと 、 おっと ！ まず [聞|き]いて くれ よ ！ [聞|き]いて くれた ほう が うれしい ん だ 。'),
    'd.d.touchHuh': Z2('[牵|qiān] [什么|shén me] ？ [我|wǒ] [的|de] [锤子|chuí zi] ？ [哈|hā] ！ [好好|hǎo hǎo] [问|wèn] [我|wǒ] ！', '[何|なに] を ？ [俺|おれ] の ハンマー か ？ ハハッ ！ ちゃんと [聞|き]いて くれ ！'),
    'd.d.touchAfter': Z2('[你|nǐ] [的|de] [手|shǒu] [现在|xiàn zài] [有|yǒu] [煤|méi] [味|wèi] [了|le] 。 [抱歉|bào qiàn] ！ [值得|zhí de] ！', '[君|きみ] の [手|て] 、 [石炭|せきたん] くさく なっちゃった な 。 わりぃ ！ でも 、 [価値|かち] は あった ！'),
    'd.bu.1': Z2('[糟|zāo] [了|le] 。 [一|yī] [脸|liǎn] [严肃|yán sù] 。 [是|shì] [因为|yīn wèi] [煤|méi] [味|wèi] [吗|ma] ？ [我|wǒ] [可以|kě yǐ] [多|duō] [洗|xǐ] [几|jǐ] [次|cì] [澡|zǎo] ！', 'やべ 。 [真剣|しんけん] な [顔|かお] 。 [石炭|せきたん] の におい の せい か ？ もっと シャワー [浴|あ]びる から ！'),
    'd.bu.blunt': Z2('[哎哟|āi yō] ！ [这|zhè] [比|bǐ] [锤子|chuí zi] [砸|zá] [到|dào] [手指|shǒu zhǐ] [还|hái] [疼|téng] 。 [说|shuō] [得|de] [温柔|wēn róu] [点|diǎn] ， [好|hǎo] [吗|ma] ？', 'いてっ ！ ハンマー で [指|ゆび] を [打|う]った くらい [痛|いた]い 。 もっと やさしく [言|い]って くれ よ 。'),
    'd.bu.dodge': Z2('[天气|tiān qì] [好|hǎo] [极|jí] [了|le] ！ …… [不过|bù guò] [你|nǐ] [想|xiǎng] [说|shuō] [的|de] [不是|bù shì] [这个|zhè ge] ， [对|duì] [吧|ba] ？', '[最高|さいこう] の [天気|てんき] だ ！ …… でも 、 そういう [話|はなし] じゃ ない よ な ？'),
    'd.bu.ok1': Z2('…… [啊|a] 。 [好|hǎo] [吧|ba] 。 [有点|yǒu diǎn] [疼|téng] 。 [不过|bù guò] [你|nǐ] [说|shuō] [得|de] [很|hěn] [温柔|wēn róu] 。 [谢谢|xiè xie] 。', '…… そっか 。 [分|わ]かった 。 ちょっと [痛|いた]い な 。 でも 、 やさしく [言|い]って くれた 。 ありがとう 。'),
    'd.bu.ok2': Z2('[从|cóng] [现在|xiàn zài] [起|qǐ] ： [我们|wǒ men] [是|shì] [对手|duì shǒu] ！ [大声|dà shēng] [的|de] [那种|nà zhǒng] ！ （ [吸|xī] [鼻子|bí zi] ）', 'これ から は ライバル だ ！ うるさい ほう の ！ （ ぐすっ ）'),
    // ---------------- rivals
    'mr.find': Z2('[找到|zhǎo dào] [你|nǐ] [了|le] 。 [在|zài] [躲|duǒ] [我|wǒ] ？ [真|zhēn] [可爱|kě ài] 。', '[見|み]つけた 。 わたし から [隠|かく]れて た の ？ かわいい こと 。'),
    'mr.duel': Z2('[看看|kàn kan] [你|nǐ] [的|de] [嘴|zuǐ] [是|shì] [不是|bù shì] [比|bǐ] [你|nǐ] [的|de] [品味|pǐn wèi] [更|gèng] [厉害|lì hai] 。', 'あなた の [言葉|ことば] が 、 [趣味|しゅみ] より [鋭|するど]い か 、 [見|み]せて もらう わ 。'),
    'mr.chat': Z2('[哼|hēng] 。 [你|nǐ] [的|de] [但丁|Dàn dīng] [又|yòu] [在|zài] [唱歌|chàng gē] [了|le] 。 [乌鸦|wū yā] [们|men] [都|dōu] [投诉|tóu sù] [了|le] 。', 'ふん 。 あなた の ダンテ 、 また [歌|うた]って る 。 カラス たち が [苦情|くじょう] を [出|だ]した わ 。'),
    'mr.decline': Z2('[想|xiǎng] [逃|táo] ？ …… [开玩笑|kāi wán xiào] [的|de] 。 [下次|xià cì] [吧|ba] 。', '[逃|に]げる の ？ …… [冗談|じょうだん] 。 また [今度|こんど] 。'),
    'mr.hit': Z2('…… [哼|hēng] 。 [算|suàn] [你|nǐ] [狠|hěn] 。', '…… ふん 。 やる じゃ ない 。'),
    'mr.misfire': Z2('[这|zhè] …… [是|shì] [想|xiǎng] [伤|shāng] [我|wǒ] [吗|ma] ？ [真|zhēn] [可爱|kě ài] 。', 'それ …… [効|き]いて る つもり ？ かわいい 。'),
    'mr.other': Z2('[那|nà] [是|shì] [回|huí] [别的|bié de] [话|huà] [的|de] 。 [好好|hǎo hǎo] [听|tīng] 。', 'それ は [別|べつ] の [悪口|わるぐち] へ の [返事|へんじ] 。 よく [聞|き]いて 。'),
    'mr.fizzle': Z2('[然后|rán hòu] [呢|ne] ？ [就|jiù] [这样|zhè yàng] ？ [说|shuō] [到|dào] [一半|yī bàn] …… [没|méi] [了|le] 。', 'で ？ それ だけ ？ [途中|とちゅう] で …… [消|き]えちゃった 。'),
    'mr.tongue': Z2('[舌头|shé tou] [被|bèi] [猫|māo] [叼|diāo] [走|zǒu] [了|le] ？ [也许|yě xǔ] [是|shì] [坡坡|Pō po] 。', '[猫|ねこ] に [舌|した] でも [取|と]られた ？ ポー かも ね 。'),
    'mr.win': Z2('[好|hǎo] [吧|ba] 。 [这|zhè] [局|jú] [你|nǐ] [赢|yíng] [了|le] 。 [别|bié] [习惯|xí guàn] 。', 'いい わ 。 [今回|こんかい] は あなた の [勝|か]ち 。 [慣|な]れない で ね 。'),
    'mr.lose': Z2('[不出所料|bù chū suǒ liào] 。 [回|huí] [你|nǐ] [那|nà] [吵闹|chǎo nào] [的|de] [小|xiǎo] [铁匠铺|tiě jiang pù] [去|qù] [吧|ba] 。', '[予想|よそう] どおり 。 あの うるさい [鍛冶場|かじば] に [帰|かえ]れば ？'),
    'mr.crack.1': Z2('[你|nǐ] [又|yòu] [赢|yíng] [了|le] 。 [真|zhēn] [烦|fán] 。', 'また [勝|か]った 。 [腹|はら] が [立|た]つ 。'),
    'mr.crack.2': Z2('[你|nǐ] [知道|zhī dào] [吗|ma] ？ [我|wǒ] [写|xiě] [过|guo] [你|nǐ] 。', '[知|し]って る ？ あなた の こと を [書|か]いた の 。'),
    'mr.crack.3': Z2('[一开始|yī kāi shǐ] [都|dōu] [是|shì] [骂|mà] [你|nǐ] [的|de] 。 [押韵|yā yùn] [押|yā] [得|de] [很|hěn] [好|hǎo] 。', '[最初|さいしょ] は [悪口|わるぐち] だった 。 [韻|いん] も よく [踏|ふ]んで た 。'),
    'mr.crack.4': Z2('[现在|xiàn zài] …… [我|wǒ] [也|yě] [不|bù] [知道|zhī dào] [它们|tā men] [是|shì] [什么|shén me] [了|le] 。', '[今|いま] は …… [何|なん] な の か 、 [分|わ]からない 。'),
    'mr.crack.5': Z2('[算|suàn] [了|le] 。 [回|huí] [你|nǐ] [的|de] [歌手|gē shǒu] [身边|shēn biān] [去|qù] [吧|ba] 。', '[忘|わす]れて 。 あなた の [歌手|かしゅ] の ところ に [帰|かえ]って 。'),
    'mr.crack.again': Z2('[你|nǐ] [又|yòu] [赢|yíng] [了|le] 。 [你|nǐ] [知道|zhī dào] [我|wǒ] [怎么|zěn me] [想|xiǎng] [的|de] 。 [我|wǒ] [不|bù] [说|shuō] [第二|dì èr] [遍|biàn] 。', 'また [勝|か]った わ ね 。 わたし の [気持|きも]ち 、 [分|わ]かって る でしょ 。 [二度|にど] は [言|い]わない 。'),
    'mr.crack.ask': Z2('[你|nǐ] [在|zài] [跟|gēn] [但丁|Dàn dīng] [交往|jiāo wǎng] 。 [先|xiān] [跟|gēn] [他|tā] [谈|tán] 。 [好好|hǎo hǎo] [谈|tán] 。 [他|tā] [不该|bù gāi] [被|bèi] [沉默|chén mò] [对待|duì dài] 。', 'あなた は ダンテ と [付|つ]き[合|あ]って る 。 まず [彼|かれ] と [話|はな]して 。 やさしく 。 [黙|だま]って [離|はな]れる の は 、 [彼|かれ] に [失礼|しつれい] よ 。'),
    'dr.find': Z2('[原来|yuán lái] [你|nǐ] [在|zài] [这儿|zhè r] ！ [我|wǒ] [到处|dào chù] [找|zhǎo] [你|nǐ] ！ [好|hǎo] [吧|ba] ， [找|zhǎo] [了|le] [两|liǎng] [个|gè] [地方|dì fang] ！ [决斗|jué dòu] [时间|shí jiān] [到|dào] ！', 'いた ！ そこら[中|じゅう] [探|さが]した ぜ ！ まあ 、 [二|ふた]か[所|しょ] だ けど ！ [決闘|けっとう] の [時間|じかん] だ ！'),
    'dr.duel': Z2('[斗嘴|dòu zuǐ] [对决|duì jué] ！ [就|jiù] [现在|xiàn zài] ！ [三|sān] [回合|huí hé] ！ [输|shū] [的|de] [人|rén] [请客|qǐng kè] [吃|chī] [面包|miàn bāo] ！', '[言葉|ことば] の [決闘|けっとう] だ ！ [今|いま] すぐ ！ [三|さん] ラウンド ！ [負|ま]けた ほう が パン を おごる ！'),
    'dr.chat': Z2('[哟|yō] ， [诗人|shī rén] [的|de] [另一半|lìng yī bàn] ！ [准备|zhǔn bèi] [好|hǎo] [再|zài] [输|shū] [一|yī] [场|chǎng] [了|le] [吗|ma] ？', 'よう 、 [詩人|しじん] の [相棒|あいぼう] ！ また [負|ま]け に [来|き]た か ？'),
    'dr.decline': Z2('[那|nà] [就|jiù] [下次|xià cì] ！ [我|wǒ] [先|xiān] [开开|kāi kai] [嗓|sǎng] ！', 'じゃあ また [今度|こんど] だ ！ [声|こえ] を [温|あたた]めて おく ぜ ！'),
    'dr.hit': Z2('[哎哟|āi yō] ！ [说|shuō] [得|de] [好|hǎo] ！', 'ぐはっ ！ やる な ！'),
    'dr.misfire': Z2('[哈|hā] ！ [那|nà] [是|shì] [什么|shén me] ？ [我|wǒ] [得|dé] [一|yī] [分|fēn] ！', 'ハハッ ！ [何|なん] だ そりゃ ？ [俺|おれ] の ポイント ！'),
    'dr.other': Z2('[回|huí] [错|cuò] [了|le] ！ [我|wǒ] [根本|gēn běn] [没|méi] [说|shuō] [那个|nà ge] ！', '[返|かえ]し が [違|ちが]う ！ [俺|おれ] 、 そんな こと [言|い]って ない ぞ ！'),
    'dr.fizzle': Z2('[啊|á] ？ [说|shuō] [得|de] [歪七扭八|wāi qī niǔ bā] ！ [我|wǒ] [得|dé] [一|yī] [分|fēn] ！', 'え ？ ぐちゃぐちゃ だ ぞ ！ [俺|おれ] の ポイント ！'),
    'dr.tongue': Z2('[没|méi] [话|huà] [说|shuō] ？ [哈|hā] ！ [铁砧|tiě zhēn] [都|dōu] [比|bǐ] [你|nǐ] [话|huà] [多|duō] ！', '[返事|へんじ] なし か ？ ハッ ！ [金床|かなとこ] の ほう が よく しゃべる ぜ ！'),
    'dr.win': Z2('[你|nǐ] [赢|yíng] [了|le] [我|wǒ] ！ [唉|āi] ！ [佩服|pèi fú] ！ [真心|zhēn xīn] [佩服|pèi fú] ！', '[負|ま]けた ！ くぅ ！ [尊敬|そんけい] する ！ [本気|ほんき] で ！'),
    'dr.lose': Z2('[哈|hā] ！ [我|wǒ] [赢|yíng] [了|le] ！ [我|wǒ] [要|yào] [为|wèi] [这|zhè] [写|xiě] [首|shǒu] [歌|gē] ！ [大声|dà shēng] [的|de] ！', 'ハッ ！ [勝利|しょうり] ！ この こと を [歌|うた] に する ぜ ！ でかい [声|こえ] の やつ を ！'),
    'dr.crack.1': Z2('[你|nǐ] [又|yòu] [赢|yíng] [了|le] ！ [三|sān] [次|cì] [了|le] ！ [从来|cóng lái] [没|méi] [人|rén] [赢|yíng] [过|guo] [我|wǒ] [三|sān] [次|cì] ！', 'また [負|ま]けた ！ [三回|さんかい] も ！ [俺|おれ] に [三回|さんかい] [勝|か]った やつ なんて いない ぞ ！'),
    'dr.crack.2': Z2('…… [好|hǎo] [吧|ba] 。 [我|wǒ] [跟|gēn] [你|nǐ] [说|shuō] [实话|shí huà] 。', '…… [分|わ]かった 。 [本当|ほんとう] の こと を [言|い]う よ 。'),
    'dr.crack.3': Z2('[我|wǒ] [不|bù] [想|xiǎng] [当|dāng] [你|nǐ] [的|de] [对手|duì shǒu] 。 [我|wǒ] [想|xiǎng] [当|dāng] …… [和|hé] [你|nǐ] [一起|yī qǐ] [唱歌|chàng gē] [的|de] [那个|nà ge] [人|rén] 。', '[俺|おれ] は 、 [君|きみ] の ライバル で いたく ない 。 [君|きみ] と …… [一緒|いっしょ] に [歌|うた]う [人|ひと] で いたい ん だ 。'),
    'dr.crack.4': Z2('[啊|à] ！ [当|dàng] [我|wǒ] [没|méi] [说|shuō] ！ [啦|lā] [啦|lā] [啦|lā] ！', 'うわー ！ [今|いま] の なし ！ ラ ラ ラー ！'),
    'dr.crack.again': Z2('[又|yòu] [赢|yíng] [了|le] [三|sān] [次|cì] ！ [你|nǐ] [知道|zhī dào] [我|wǒ] [的|de] [心意|xīn yì] [吧|ba] ？ [我|wǒ] [不|bù] [再|zài] [说|shuō] [了|le] 。 [太|tài] [大声|dà shēng] [了|le] 。', 'また [三連敗|さんれんぱい] だ ！ [俺|おれ] の [気持|きも]ち 、 [分|わ]かる だろ ？ もう [言|い]わない ぞ 。 うるさすぎる から な 。'),
    'dr.crack.ask': Z2('[真的|zhēn de] ？ [可是|kě shì] [你|nǐ] [在|zài] [跟|gēn] [莫甘娜|Mò gān nà] [交往|jiāo wǎng] ！ [先|xiān] [跟|gēn] [她|tā] [谈|tán] 。 [好好|hǎo hǎo] [说|shuō] ， [好|hǎo] [吗|ma] ？ [她|tā] [值得|zhí de] [听到|tīng dào] [好|hǎo] [话|huà] 。', 'マジ か ？ でも 、 [君|きみ] は モルガナ と [付|つ]き[合|あ]って る ！ まず [彼女|かのじょ] と [話|はな]して くれ 。 やさしく な ？ [彼女|かのじょ] に は 、 やさしい [言葉|ことば] が [似合|にあ]う 。'),
    // ---------------- the telenovela's big moments (zh: the lines of a big TV romance, «这不可能！»; ja: a 昼ドラ's, «うそ…»)
    'm.tn.rival': Z2('[这|zhè] …… [还|hái] [没|méi] [完|wán] 。', 'この まま じゃ …… [終|お]わらせない 。'),
    'd.tn.rival': Z2('[我|wǒ] [的|de] [心|xīn] [在|zài] [燃烧|rán shāo] …… [是|shì] [嫉妒|jí dù] [的|de] [火焰|huǒ yàn] ！', '[俺|おれ] の [心|こころ] が [燃|も]えて る …… [嫉妬|しっと] の [炎|ほのお] で ！'),
    'mr.tn.crack': Z2('[不|bù] 。 [不|bù] ， [不|bù] ， [不|bù] 。 [这|zhè] [不|bù] [可能|kě néng] ！', 'うそ 。 うそ 、 うそ 、 うそ 。 こんな こと 、 あり[得|え]ない 。'),
    'dr.tn.crack': Z2('[为什么|wèi shén me] [我|wǒ] [的|de] [心|xīn] [跳|tiào] [得|de] [这么|zhè me] [大声|dà shēng] ？ ！', 'なんで [俺|おれ] の [心臓|しんぞう] 、 こんな に うるさい ん だ ？ ！'),
    'm.tn.bu': Z2('[我|wǒ] [早就|zǎo jiù] [知道|zhī dào] 。 [我|wǒ] [从|cóng] [你|nǐ] [的|de] [眼睛|yǎn jing] [里|lǐ] [看|kàn] [出来|chū lái] [了|le] …… [也|yě] [从|cóng] [我|wǒ] [的|de] [诗|shī] [里|lǐ] 。', '[分|わ]かって た 。 あなた の [目|め] に [書|か]いて あった …… わたし の [詩|し] に も 。'),
    'd.tn.bu': Z2('[啊|à] ， [我|wǒ] [的|de] [心|xīn] ！ [你|nǐ] [好|hǎo] [无情|wú qíng] ！ …… [不|bù] ， [没事|méi shì] 。 [它|tā] [是|shì] [铁|tiě] [做|zuò] [的|de] 。 [扛|káng] [得|de] [住|zhù] 。', 'ああ 、 [俺|おれ] の [心|こころ] が ！ …… いや 、 [平気|へいき] だ 。 [鉄|てつ] で できて る から な 。 [耐|た]えられる 。'),
  };
  for (const [k, v] of Object.entries(LT_CJK)) if (LT[k]) Object.assign(LT[k], v);
  // (where a zh / ja line says something the English doesn't: its own English, en_zh / en_ja)
  Object.assign(LT['m.d.wordsSlip'], { en_zh: '«{adj}»? You mean «{fix}», thank you. But… I’ll take it.', en_ja: '«{adj}»? It’s «{fix}», isn’t it. …Well, I’ll take it.' });
  Object.assign(LT['d.d.wordsSlip'], { en_zh: '«{adj}»? Ha! It’s «{fix}»! But I love it anyway!', en_ja: '«{adj}»? Ha! It’s «{fix}», right? But it makes me super happy!' });
  Object.assign(LT['m.r5.amo1'], { en_ja: '«{amo}»? …I’ve only ever heard that in TV dramas.' });
  Object.assign(LT['d.tn.bu'], { en_zh: 'Oh, my {w.heart}! You’re so heartless! …No, it’s fine. It’s made of iron. It can take it.' });
  // ---------------- the poems and the song: written for zh and ja, not translated. zh: five-character quatrains with a
  // rhyme (the trail, her grandmother's, hers); ja: haiku, and a tanka for the last pinned poem and for hers. Each line
  // has its own English under it (en_zh / en_ja), and the clue survives: the meowing shadow, north, the house broken in two.
  const poemCJK = (P, zh, enZh, ja, enJa) => Object.assign(P, { zh, ja, en_zh: enZh, en_ja: enJa });
  poemCJK(POEM_TEXT[0],
    ['[寻|xún] [我|wǒ] [莫|mò] [看|kàn] [日|rì] ，', '[黑影|hēi yǐng] [喵喵|miāo miāo] [叫|jiào] 。', '[随|suí] [它|tā] [一路|yī lù] [走|zǒu] ，', '[喧声|xuān shēng] [尽处|jìn chù] [找|zhǎo] 。'],
    ['To find me, don’t look at the sun:', 'a black shadow goes «meow».', 'Follow it all the way,', 'and look where the noise ends.'],
    ['[日|ひ] を [見|み]るな', '[鳴|な]く [影|かげ] を [追|お]え', '[音|おと] の [果|は]て'],
    ['Don’t look at the sun.', 'Follow the shadow that meows', 'to where the noise ends.']);
  poemCJK(POEM_TEXT[1],
    ['[小镇|xiǎo zhèn] [到|dào] [此|cǐ] [尽|jìn] ，', '[碎|suì] [砖|zhuān] [路|lù] [上|shàng] [横|héng] 。', '[向|xiàng] [北|běi] [慢慢|màn màn] [走|zǒu] ，', '[老|lǎo] [屋|wū] [静|jìng] [无|wú] [声|shēng] 。'],
    ['The town ends here;', 'broken bricks lie across the road.', 'Walk north, slowly:', 'the old houses make no sound.'],
    ['[町|まち] を [出|で]て', '[北|きた] へ ゆっくり', '[黙|だま]る [家|いえ]'],
    ['Leave the town,', 'walk north, slowly,', 'to the houses that keep quiet.']);
  poemCJK(POEM_TEXT[2],
    ['[人人|rén rén] [看|kàn] [戏台|xì tái] ，', '[无|wú] [人|rén] [回头|huí tóu] [望|wàng] 。', '[屋|wū] [断|duàn] [成|chéng] [两半|liǎng bàn] ，', '[秘密|mì mì] [楼|lóu] [上|shàng] [藏|cáng] 。'],
    ['Everyone watches the stage;', 'nobody looks back.', 'A house broken in two', 'hides a secret upstairs.'],
    ['[振|ふ]り[向|む]けば', '[二|ふた]つ に [割|わ]れた', '[家|いえ] の [謎|なぞ]'],
    ['Look back:', 'a house broken in two,', 'and its secret.']);
  poemCJK(POEM_TEXT[3],
    ['[能|néng] [走|zǒu] [到|dào] [这里|zhè lǐ] ，', '[静|jìng] [里|lǐ] [读|dú] [诗篇|shī piān] 。', '[上楼|shàng lóu] [大声|dà shēng] [说|shuō] ：', '[不想|bù xiǎng] [再|zài] [孤单|gū dān] 。'],
    ['If you made it this far,', 'you can read poems in silence.', 'Now come up and say it out loud:', 'I don’t want to be alone anymore.'],
    ['ここ まで を', '[黙|だま]って [読|よ]んだ', 'あなた なら', '[上|あ]がって [言|い]って', 'ひとり は いや と'],
    ['All this way', 'you read in silence:', 'so you, then,', 'come up and say it out loud:', '«I don’t want to be alone.»']);
  poemCJK(GRAN_POEM,
    ['[月亮|yuè liang] [不|bù] [说话|shuō huà] ，', '[可|kě] [人人|rén rén] [都|dōu] [在|zài] [听|tīng] 。'], ['The moon doesn’t speak,', 'yet everyone is listening.'],
    ['もの [言|い]わぬ', '[月|つき] に みんな が', '[耳|みみ] すます'], ['Not a word from the moon,', 'and still everyone', 'listens to it.']);
  poemCJK(M_POEM,
    ['[我|wǒ] [住|zhù] [阁楼|gé lóu] [上|shàng] ，', '[一|yī] [猫|māo] [一|yī] [烛光|zhú guāng] 。', '[有人|yǒu rén] [登|dēng] [楼|lóu] [语|yǔ] ，', '[寂静|jì jìng] [化|huà] [星芒|xīng máng] 。'],
    ['I lived up in an attic,', 'one cat, one candle’s light.', 'Someone climbed the stairs, talking,', 'and the silence turned to starlight.'],
    ['[屋根裏|やねうら] に', '[猫|ねこ] と ろうそく', 'ひとりきり', '[声|こえ] が のぼって', 'しじま は [星|ほし] に'],
    ['Up in an attic,', 'a cat and a candle,', 'all alone.', 'Then a voice came climbing up,', 'and the silence turned to stars.']);
  poemCJK(D_SONG,
    ['[我|wǒ] [的|de] [钟|zhōng] [有|yǒu] [裂缝|liè fèng] ，', '[可|kě] [它|tā] [还|hái] [在|zài] [唱|chàng] [着|zhe] [歌|gē] 。', '[只要|zhǐ yào] [你|nǐ] [在|zài] [身边|shēn biān] ，', '[寂静|jì jìng] [就|jiù] [吓|xià] [不到|bu dào] [我|wǒ] 。'],
    ['My bell has a crack,', 'but it’s still singing.', 'As long as you’re by my side,', 'the silence can’t scare me.'],
    ['[僕|ぼく] の [鐘|かね] に は ひび が ある 、', 'それ でも まだ [歌|うた]って る 。', '[君|きみ] が そば に いて くれたら 、', '[静|しず]けさ も [怖|こわ]く ない 。'],
    ['My bell has a crack,', 'and still it’s singing.', 'If you stay by my side,', 'even the quiet doesn’t scare me.']);
  // ---------------- words of affirmation in zh / ja: no agreement to get wrong, so the slip is grammar instead (zh «你是聪明»:
  // an adjective takes 很 / 真, never 是; ja «優しいだ»: an い-adjective never takes だ). A one-character zh adjective (美, 酷,
  // 帅…) counts only after a degree word (很美, 真酷), so 没 (méi) is never 美. Nouns (好人, 天才…) take 是 rightly.
  Object.assign(ADJ.morgana, {
    zh: { love: ['[聪明|cōng ming]', '[神秘|shén mì]', '[勇敢|yǒng gǎn]', '[有趣|yǒu qù]', '[有意思|yǒu yì si]', '[有创意|yǒu chuàng yì]', '[有才华|yǒu cái huá]', '[独特|dú tè]', '[有诗意|yǒu shī yì]', '[有深度|yǒu shēn dù]',
        '[机智|jī zhì]', '[有个性|yǒu gè xìng]', '[迷人|mí rén]', '[才女|cái nǚ]', '[天才|tiān cái]', '[与众不同|yǔ zhòng bù tóng]', '[有灵气|yǒu líng qì]', '[深刻|shēn kè]'],
      ok: ['[善良|shàn liáng]', '[温柔|wēn róu]', '[厉害|lì hai]', '[棒|bàng]', '[了不起|liǎo bu qǐ]', '[特别|tè bié]', '[酷|kù]', '[优雅|yōu yǎ]', '[有气质|yǒu qì zhì]', '[幽默|yōu mò]', '[好玩|hǎo wán]',
        '[坚强|jiān qiáng]', '[真诚|zhēn chéng]', '[帅|shuài]', '[帅气|shuài qi]', '[好人|hǎo rén]', '[友好|yǒu hǎo]', '[强|qiáng]'],
      meh: ['[可爱|kě ài]', '[漂亮|piào liang]', '[美|měi]', '[好看|hǎo kàn]', '[甜|tián]', '[萌|méng]', '[乖|guāi]', '[美丽|měi lì]', '[小可爱|xiǎo kě ài]'], slip: {} },
    ja: { love: ['[頭|あたま] が いい', '[賢|かしこ]い', 'ミステリアス', '[神秘的|しんぴてき]', '[不思議|ふしぎ]', '[面白|おもしろ]い', '[個性的|こせいてき]', '[才能|さいのう] が ある', '[詩的|してき]', '[知的|ちてき]',
        '[深|ふか]い', '[勇敢|ゆうかん]', '[独特|どくとく]', '[天才|てんさい]', '[魅力的|みりょくてき]', 'センス が いい'],
      ok: ['[優|やさ]しい', 'いい [人|ひと]', 'すごい', 'かっこいい', 'クール', '[特別|とくべつ]', '[上品|じょうひん]', 'エレガント', '[強|つよ]い', 'おしゃれ', '[素敵|すてき]', '[最高|さいこう]', '[楽|たの]しい',
        '[親切|しんせつ]', '[大人|おとな]っぽい', 'ユニーク'],
      meh: ['かわいい', '[可愛|かわい]い', 'きれい', '[綺麗|きれい]', '[美人|びじん]', '[美|うつく]しい', 'キュート', 'ラブリー', '[可愛|かわい]らしい', 'プリティ'], slip: {} },
  });
  Object.assign(ADJ.dante, {
    zh: { love: ['[善良|shàn liáng]', '[温柔|wēn róu]', '[幽默|yōu mò]', '[有趣|yǒu qù]', '[有意思|yǒu yì si]', '[好笑|hǎo xiào]', '[搞笑|gǎo xiào]', '[有创意|yǒu chuàng yì]', '[体贴|tǐ tiē]', '[大方|dà fang]',
        '[有才华|yǒu cái huá]', '[可爱|kě ài]', '[好人|hǎo rén]', '[好心|hǎo xīn]', '[热心|rè xīn]', '[温暖|wēn nuǎn]', '[暖|nuǎn]', '[贴心|tiē xīn]', '[细心|xì xīn]', '[开朗|kāi lǎng]', '[好听|hǎo tīng]',
        '[会唱歌|huì chàng gē]', '[真诚|zhēn chéng]'],
      ok: ['[聪明|cōng ming]', '[勇敢|yǒng gǎn]', '[帅|shuài]', '[帅气|shuài qi]', '[酷|kù]', '[厉害|lì hai]', '[棒|bàng]', '[了不起|liǎo bu qǐ]', '[特别|tè bié]', '[好看|hǎo kàn]', '[靠谱|kào pǔ]', '[神秘|shén mì]',
        '[迷人|mí rén]', '[有魅力|yǒu mèi lì]'],
      meh: ['[强壮|qiáng zhuàng]', '[壮|zhuàng]', '[力气大|lì qi dà]', '[有力气|yǒu lì qi]', '[高大|gāo dà]', '[壮实|zhuàng shi]', '[结实|jiē shi]', '[肌肉|jī ròu]', '[猛|měng]', '[强|qiáng]', '[大块头|dà kuài tóu]',
        '[魁梧|kuí wú]', '[坚强|jiān qiáng]'], slip: {} },
    ja: { love: ['[優|やさ]しい', '[面白|おもしろ]い', '[楽|たの]しい', '[親切|しんせつ]', '[思|おも]いやり が ある', 'いい [人|ひと]', 'いい やつ', '[歌|うた] が うまい', '[歌|うた] が [上手|じょうず]', '[才能|さいのう] が ある',
        '[温|あたた]かい', 'あったかい', 'かわいい', '[可愛|かわい]い', 'ユーモア が ある', '[気|き] が きく', '[繊細|せんさい]', '[明|あか]るい', '[声|こえ] が いい'],
      ok: ['かっこいい', '[頭|あたま] が いい', 'すごい', '[素敵|すてき]', 'イケメン', '[特別|とくべつ]', '[勇敢|ゆうかん]', 'クール', '[賢|かしこ]い', '[頼|たの]もしい', '[最高|さいこう]', 'ハンサム', '[男前|おとこまえ]', '[天才|てんさい]'],
      meh: ['[強|つよ]い', '[力持|ちからも]ち', '[大|おお]きい', 'でかい', '[背|せ] が [高|たか]い', 'マッチョ', 'たくましい', 'ムキムキ', '[筋肉|きんにく]', '[力|ちから] が [強|つよ]い', 'ごつい'], slip: {} },
  });
  Object.assign(ADJ_MODEL.morgana, Z2('[你|nǐ] [很|hěn] [聪明|cōng ming] 。', '[頭|あたま] が いい ね 。'));
  Object.assign(ADJ_MODEL.dante, Z2('[你|nǐ] [很|hěn] [善良|shàn liáng] 。', '[優|やさ]しい ね 。'));
  const DEG_ZH = ['[很|hěn]', '[真|zhēn]', '[好|hǎo]', '[太|tài]', '[超|chāo]', '[挺|tǐng]', '[特别|tè bié]', '[非常|fēi cháng]', '[最|zuì]', '[这么|zhè me]', '[那么|nà me]', '[超级|chāo jí]', '[蛮|mán]',
    '[有点|yǒu diǎn]', '[真是|zhēn shì]', '[多|duō]'];
  const NOUN_ZH = new Set(['[好人|hǎo rén]', '[才女|cái nǚ]', '[天才|tiān cái]', '[小可爱|xiǎo kě ài]', '[大块头|dà kuài tóu]', '[肌肉|jī ròu]', '[会唱歌|huì chàng gē]']);
  // ---------------- quality time: the same stories (Morgana's grandmother's cat stays Sombra, 松布拉 / ソンブラ)
  const STORIES_CJK = {
    morgana: [
      { lines: [Z2('[我|wǒ] [九|jiǔ] [岁|suì] [的|de] [时候|shí hou] [写|xiě] [了|le] [第一|dì yī] [首|shǒu] [诗|shī] 。', '[九歳|きゅうさい] の とき 、 [初|はじ]めて [詩|し] を [書|か]いた 。'),
        Z2('[写|xiě] [的|de] [是|shì] [奶奶|nǎi nai] [的|de] [猫|māo] ， [叫|jiào] [松布拉|Sōng bù lā] 。', 'おばあちゃん の [猫|ねこ] 、 ソンブラ の [詩|し] 。'),
        Z2('[它|tā] [是|shì] [灰色|huī sè] [的|de] ， [非常|fēi cháng] 、 [非常|fēi cháng] [懒|lǎn] 。', '[灰色|はいいろ] で 、 すごく 、 すごく なまけもの だった 。')],
        q: Z2('[那么|nà me] 。 [那|nà] [只|zhī] [猫|māo] [叫|jiào] [什么|shén me] ？', 'じゃあ 。 その [猫|ねこ] の [名前|なまえ] は ？'),
        a: [Z2('[松布拉|Sōng bù lā] 。', 'ソンブラ 。'), Z2('[坡坡|Pō po] 。', 'ポー 。'), Z2('[露娜|Lù nà] 。', 'ルナ 。')] },
      { lines: [Z2('[我|wǒ] [不|bù] [太|tài] [喜欢|xǐ huan] [太阳|tài yáng] 。', '[太陽|たいよう] は あまり [好|す]き じゃ ない 。'),
        Z2('[可是|kě shì] [月亮|yuè liang] …… [我|wǒ] [爱|ài] [月亮|yuè liang] 。', 'でも [月|つき] は …… [月|つき] は [大好|だいす]き 。'),
        Z2('[晚上|wǎn shang] [我|wǒ] [在|zài] [窗边|chuāng biān] [写|xiě] [东西|dōng xi] ， [一直|yī zhí] [写|xiě] [到|dào] [蜡烛|là zhú] [烧|shāo] [完|wán] 。', '[夜|よる] は 、 ろうそく が [消|き]える まで 、 [窓|まど] の そば で [書|か]いて る 。')],
        q: Z2('[我|wǒ] [什么|shén me] [时候|shí hou] [写|xiě] [东西|dōng xi] ？', 'わたし は いつ [書|か]く ？'),
        a: [Z2('[晚上|wǎn shang] 。', '[夜|よる] 。'), Z2('[早上|zǎo shang] 。', '[朝|あさ] 。'), Z2('[中午|zhōng wǔ] 。', '[昼|ひる] 。')] },
      { lines: [Z2('[大家|dà jiā] [都|dōu] [以为|yǐ wéi] [我|wǒ] [最|zuì] [喜欢|xǐ huan] [黑色|hēi sè] 。', 'みんな 、 わたし の [好|す]きな [色|いろ] は [黒|くろ] だ と [思|おも]って る 。'),
        Z2('[不是|bù shì] 。 [是|shì] [紫色|zǐ sè] 。 [像|xiàng] [李子|lǐ zi] [一样|yī yàng] 。', '[違|ちが]う 。 [紫|むらさき] 。 プラム みたい な 。'),
        Z2('[天|tiān] [快|kuài] [黑|hēi] [时|shí] [天空|tiān kōng] [的|de] [颜色|yán sè] 。', '[夜|よる] に なる [直前|ちょくぜん] の 、 [空|そら] の [色|いろ] 。')],
        q: Z2('[我|wǒ] [最|zuì] [喜欢|xǐ huan] [什么|shén me] [颜色|yán sè] ？', 'わたし の [好|す]きな [色|いろ] は ？'),
        a: [Z2('[紫色|zǐ sè] 。', '[紫|むらさき] 。'), Z2('[黑色|hēi sè] 。', '[黒|くろ] 。'), Z2('[红色|hóng sè] 。', '[赤|あか] 。')] },
      { lines: [Z2('[其实|qí shí] [坡坡|Pō po] [不是|bù shì] [我|wǒ] [的|de] [猫|māo] 。', '[本当|ほんとう] は 、 ポー は わたし の [猫|ねこ] じゃ ない 。'),
        Z2('[有|yǒu] [一天|yī tiān] [晚上|wǎn shang] ， [它|tā] [从|cóng] [窗户|chuāng hu] [进来|jìn lái] ， [就|jiù] [不|bù] [走|zǒu] [了|le] 。', 'ある [夜|よる] 、 [窓|まど] から [入|はい]って きて 、 そのまま [居|い]ついた の 。'),
        Z2('[现在|xiàn zài] [它|tā] [以为|yǐ wéi] [阁楼|gé lóu] [是|shì] [它|tā] [的|de] 。 [大概|dà gài] [也|yě] [没错|méi cuò] 。', '[今|いま] は 、 [屋根裏|やねうら] は [自分|じぶん] の もの だ と [思|おも]って る 。 たぶん 、 その とおり 。')],
        q: Z2('[坡坡|Pō po] [是|shì] [怎么|zěn me] [进来|jìn lái] [的|de] ？', 'ポー は どこ から [入|はい]って きた ？'),
        a: [Z2('[从|cóng] [窗户|chuāng hu] 。', '[窓|まど] から 。'), Z2('[从|cóng] [门|mén] 。', 'ドア から 。'), Z2('[在|zài] [箱子|xiāng zi] [里|lǐ] 。', '[箱|はこ] に [入|はい]って 。')] },
    ],
    dante: [
      { lines: [Z2('[我|wǒ] [爷爷|yé ye] [给|gěi] [六|liù] [个|gè] [村子|cūn zi] [造|zào] [过|guo] [钟|zhōng] 。', 'じいちゃん は 、 [六|むっ]つ の [村|むら] の [鐘|かね] を [作|つく]った ん だ 。'),
        Z2('[他|tā] [能|néng] [听|tīng] [出|chū] [一|yī] [口|kǒu] [钟|zhōng] [什么|shén me] [时候|shí hou] [难过|nán guò] 。', '[鐘|かね] が [悲|かな]しい とき 、 じいちゃん に は [分|わ]かった 。'),
        Z2('[他|tā] [说|shuō] ， [难过|nán guò] [的|de] [钟|zhōng] [声音|shēng yīn] [会|huì] [低|dī] [一点|yī diǎn] 。', '[悲|かな]しい [鐘|かね] は 、 ちょっと [低|ひく]く [鳴|な]る ん だって 。')],
        q: Z2('[他|tā] [给|gěi] [几|jǐ] [个|gè] [村子|cūn zi] [造|zào] [过|guo] [钟|zhōng] ？', 'じいちゃん は 、 いくつ の [村|むら] の [鐘|かね] を [作|つく]った ？'),
        a: [Z2('[六|liù] [个|gè] 。', '[六|むっ]つ 。'), Z2('[两|liǎng] [个|gè] 。', '[二|ふた]つ 。'), Z2('[十|shí] [个|gè] 。', '[十|とお] 。')] },
      { lines: [Z2('[我|wǒ] [每天|měi tiān] [早上|zǎo shang] [吃|chī] [三|sān] [个|gè] [玛尔塔|Mǎ ěr tǎ] [面包店|miàn bāo diàn] [的|de] [面包|miàn bāo] 。', '[毎朝|まいあさ] 、 マルタ さん の パン[屋|や] の パン を [三|みっ]つ [食|た]べる 。'),
        Z2('[玛尔塔|Mǎ ěr tǎ] [说|shuō] [我|wǒ] [是|shì] [她|tā] [最|zuì] [好|hǎo] [的|de] [顾客|gù kè] 。', 'マルタ さん は 、 [俺|おれ] が いちばん の お[客|きゃく] だ って 。'),
        Z2('[我|wǒ] [说|shuō] [她|tā] [是|shì] [我|wǒ] [最|zuì] [好|hǎo] [的|de] [朋友|péng you] 。 [带|dài] [面包|miàn bāo] [的|de] 。', '[俺|おれ] に とって は 、 いちばん の [友達|ともだち] だ 。 パン [付|つ]き の な 。')],
        q: Z2('[我|wǒ] [在|zài] [哪儿|nǎ r] [买|mǎi] [面包|miàn bāo] ？', '[俺|おれ] は どこ で パン を [買|か]う ？'),
        a: [Z2('[在|zài] [玛尔塔|Mǎ ěr tǎ] [的|de] [面包店|miàn bāo diàn] 。', 'マルタ さん の パン[屋|や] 。'), Z2('[在|zài] [市场|shì chǎng] 。', '[市場|いちば] 。'), Z2('[在|zài] [旅店|lǚ diàn] 。', '[宿屋|やどや] 。')] },
      { lines: [Z2('[我|wǒ] [讨厌|tǎo yàn] [夜里|yè lǐ] [的|de] [寂静|jì jìng] 。', '[夜|よる] の [静|しず]けさ が 、 [大嫌|だいきら]い なん だ 。'),
        Z2('[所以|suǒ yǐ] [我|wǒ] [开|kāi] [着|zhe] [窗户|chuāng hu] [睡觉|shuì jiào] 。', 'だから 、 [窓|まど] を [開|あ]けて [寝|ね]る 。'),
        Z2('[池塘|chí táng] [里|lǐ] [的|de] [鸭子|yā zi] [给|gěi] [我|wǒ] [唱歌|chàng gē] 。 [唱|chàng] [得|de] [很|hěn] [难听|nán tīng] 。 [但|dàn] [它们|tā men] [很|hěn] [努力|nǔ lì] 。', '[池|いけ] の アヒル が [歌|うた]って くれる 。 [下手|へた] だ けど 。 でも 、 がんばって る 。')],
        q: Z2('[晚上|wǎn shang] [谁|shéi] [给|gěi] [我|wǒ] [唱歌|chàng gē] ？', '[夜|よる] 、 [誰|だれ] が [俺|おれ] に [歌|うた]って くれる ？'),
        a: [Z2('[鸭子|yā zi] 。', 'アヒル 。'), Z2('[小鸟|xiǎo niǎo] 。', '[小鳥|ことり] 。'), Z2('[布鲁诺|Bù lǔ nuò] 。', 'ブルーノ 。')] },
      { lines: [Z2('[我|wǒ] [在|zài] [学|xué] [弹|tán] [吉他|jí tā] 。', 'ギター を [習|なら]って る ん だ 。'),
        Z2('[广场|guǎng chǎng] [上|shang] [的|de] [蒂托|Dì tuō] [在|zài] [教|jiāo] [我|wǒ] 。', '[広場|ひろば] の ティト が [教|おし]えて くれて る 。'),
        Z2('[我|wǒ] [的|de] [手指|shǒu zhǐ] [总|zǒng] [打结|dǎ jié] 。 [但|dàn] [我|wǒ] [一直|yī zhí] [在|zài] [练|liàn] 。', '[指|ゆび] が こんがらがる 。 でも 、 [練習|れんしゅう] は [続|つづ]けて る 。')],
        q: Z2('[谁|shéi] [在|zài] [教|jiāo] [我|wǒ] [弹|tán] [吉他|jí tā] ？', '[誰|だれ] が [俺|おれ] に ギター を [教|おし]えて る ？'),
        a: [Z2('[蒂托|Dì tuō] 。', 'ティト 。'), Z2('[玛尔塔|Mǎ ěr tǎ] 。', 'マルタ さん 。'), Z2('[布鲁诺|Bù lǔ nuò] 。', 'ブルーノ 。')] },
    ],
  };
  for (const id of ['morgana', 'dante']) STORIES_CJK[id].forEach((s, i) => {
    const S0 = STORIES[id][i]; if (!S0) return;
    s.lines.forEach((L, k) => Object.assign(S0.lines[k], L)); Object.assign(S0.q, s.q); s.a.forEach((A, k) => Object.assign(S0.a[k], A));
  });
  // ---------------- gifts: zh says it with the measure word (我给你带了一朵花: like es / pt's article, it's checked); ja
  // with を (花を持ってきたよ: «花が持ってきた» would mean the flower did the bringing)
  MASS.zh = MASS.es.slice(); MASS.ja = MASS.es.slice();
  GIFT_MODEL.zh = n => `[我|wǒ] [给|gěi] [你|nǐ] [带|dài] [了|le] ${n} 。`;
  GIFT_MODEL.ja = n => `${n} を [持|も]って きた よ 。`;
  const FLOWER_CL = ['[朵|duǒ]', '[枝|zhī]', '[束|shù]'];
  const CL_OK_ZH = { 'w.flower': FLOWER_CL, 'w.rose': FLOWER_CL, 'w.sunflower': FLOWER_CL, 'w.tulip': FLOWER_CL, 'w.newspaper': ['[份|fèn]', '[张|zhāng]'],
    'w.chocolate': ['[块|kuài]', '[盒|hé]', '[条|tiáo]', '[颗|kē]', '[个|gè]', '[包|bāo]'], 'w.honey': ['[罐|guàn]', '[瓶|píng]', '[杯|bēi]'], 'w.bread': ['[个|gè]', '[块|kuài]', '[片|piàn]', '[条|tiáo]', '[袋|dài]'],
    'w.hat': ['[顶|dǐng]', '[个|gè]'], 'w.candy': ['[颗|kē]', '[块|kuài]', '[粒|lì]', '[个|gè]', '[包|bāo]', '[袋|dài]'], 'w.gum': ['[片|piàn]', '[块|kuài]', '[条|tiáo]', '[包|bāo]', '[盒|hé]'],
    'w.soda': ['[瓶|píng]', '[罐|guàn]', '[杯|bēi]'], 'w.cheese': ['[块|kuài]', '[片|piàn]'], 'w.juice': ['[瓶|píng]', '[杯|bēi]', '[盒|hé]'], 'w.apple': ['[个|gè]', '[颗|kē]'], 'w.pear': ['[个|gè]', '[颗|kē]'],
    'w.orange': ['[个|gè]', '[颗|kē]'], 'w.cake': ['[块|kuài]', '[个|gè]', '[片|piàn]'], 'w.cookie': ['[块|kuài]', '[片|piàn]', '[个|gè]', '[包|bāo]', '[盒|hé]'], 'w.icecream': ['[个|gè]', '[支|zhī]', '[盒|hé]', '[杯|bēi]', '[根|gēn]'] };
  const MW_ZH = ['[个|gè]', '[朵|duǒ]', '[枝|zhī]', '[束|shù]', '[份|fèn]', '[张|zhāng]', '[块|kuài]', '[片|piàn]', '[罐|guàn]', '[瓶|píng]', '[杯|bēi]', '[盒|hé]', '[包|bāo]', '[颗|kē]', '[粒|lì]', '[顶|dǐng]',
    '[条|tiáo]', '[根|gēn]', '[支|zhī]', '[本|běn]', '[只|zhī]', '[件|jiàn]', '[袋|dài]', '[些|xiē]'];
  const NUMDET_ZH = ['[一|yī]', '[两|liǎng]', '[三|sān]', '[几|jǐ]', '[这|zhè]', '[那|nà]'];
  const GIFT_VERB = { zh: ['[带|dài]', '[送|sòng]', '[给|gěi] [你|nǐ]', '[礼物|lǐ wù]', '[买|mǎi]'], ja: ['[持|も]って き', 'あげる', 'あげます', 'プレゼント', 'どうぞ', 'おみやげ', '[買|か]って き'] };
  const clZh = id => { const it = LEX.item(id) || {}; return (it.cl && it.cl.zh) || (CL_OK_ZH[id] || ['[个|gè]'])[0]; };
  Object.assign(FETCH_NAMES.candle, Z2(['[蜡烛|là zhú]', '[蜡烛|là zhú]'], ['ろうそく', 'ろうそく']));
  Object.assign(FETCH_NAMES.book, Z2(['[书|shū]', '[书|shū]'], ['[本|ほん]', '[本|ほん]']));
  Object.assign(FETCH_NAMES.cup, Z2(['[杯子|bēi zi]', '[杯子|bēi zi]'], ['カップ', 'カップ']));
  Object.assign(FETCH_NAMES.blanket, Z2(['[毯子|tǎn zi]', '[毯子|tǎn zi]'], ['[毛布|もうふ]', '[毛布|もうふ]']));
  Object.assign(FETCH_NAMES.record, Z2(['[唱片|chàng piàn]', '[唱片|chàng piàn]'], ['レコード', 'レコード']));
  // ---------------- banter duels: their jabs, and comebacks short enough to type (the player's ja ones: no pronoun, no ぜ / わ)
  const DUEL_CJK = {
    morgana: [
      [Z2('[你|nǐ] [男朋友|nán péng you] [唱歌|chàng gē] [那么|nà me] [大声|dà shēng] ， [鸟|niǎo] [都|dōu] [搬走|bān zǒu] [了|le] 。', 'あなた の [彼氏|かれし] 、 [歌|うた] が うるさすぎて [鳥|とり] が [引|ひ]っ[越|こ]した わ 。'),
        Z2('[它们|tā men] [搬|bān] [近|jìn] [了|le] ， [为了|wèi le] [听|tīng] [得|de] [更|gèng] [清楚|qīng chu] 。', '[近|ちか]く に [引|ひ]っ[越|こ]した ん だ よ 。 よく [聞|き]こえる よう に 。')],
      [Z2('[你|nǐ] [身上|shēn shang] [一|yī] [股|gǔ] [煤|méi] [味|wèi] 。 [真|zhēn] [浪漫|làng màn] 。', '[石炭|せきたん] くさい 。 ロマンチック ね 。'),
        Z2('[煤|méi] [味|wèi] [总|zǒng] [比|bǐ] [阁楼|gé lóu] [的|de] [灰|huī] [好|hǎo] 。', '[屋根裏|やねうら] の ほこり より まし だ よ 。')],
      [Z2('[你|nǐ] [跟|gēn] [一个|yī gè] [对|duì] [着|zhe] [铁砧|tiě zhēn] [唱歌|chàng gē] [的|de] [人|rén] [约会|yuē huì] ？', '[金床|かなとこ] に [歌|うた]う [人|ひと] と [付|つ]き[合|あ]って る の ？'),
        Z2('[对|duì] 。 [而且|ér qiě] [铁砧|tiě zhēn] [从来|cóng lái] [不|bù] [抱怨|bào yuàn] 。', 'うん 。 それ に 、 [金床|かなとこ] は [文句|もんく] を [言|い]わない 。')],
      [Z2('[你|nǐ] [选|xuǎn] [了|le] [噪音|zào yīn] 。 [我|wǒ] [选|xuǎn] [沉默|chén mò] 。', 'あなた は [騒音|そうおん] を [選|えら]んだ 。 わたし は [沈黙|ちんもく] を [選|えら]ぶ 。'),
        Z2('[那|nà] [正是|zhèng shì] [寂静|Jì jìng] [想要|xiǎng yào] [的|de] 。', 'それ こそ 、 [静寂|せいじゃく] の [思|おも]う つぼ だ よ 。')],
      [Z2('[你|nǐ] [那|nà] [只|zhī] [小|xiǎo] [兔子|tù zi] [一直|yī zhí] [盯|dīng] [着|zhe] [我|wǒ] 。', 'あなた の ウサギ 、 ずっと わたし を [見|み]て る 。'),
        Z2('[它|tā] [盯|dīng] [着|zhe] [你|nǐ] ， [是|shì] [因为|yīn wèi] [喜欢|xǐ huan] [你|nǐ] 。', 'あなた の こと が [好|す]き だ から だ よ 。')],
      [Z2('[你们|nǐ men] [俩|liǎ] [就|jiù] [像|xiàng] [打雷|dǎ léi] [加|jiā] [锤子|chuí zi] ： [全是|quán shì] [噪音|zào yīn] 。', 'あなた たち 、 [雷|かみなり] と ハンマー みたい 。 うるさい だけ 。'),
        Z2('[一起|yī qǐ] [吵|chǎo] ， [总|zǒng] [比|bǐ] [一个人|yī gè rén] [沉默|chén mò] [好|hǎo] 。', '[一人|ひとり] で [黙|だま]る より 、 [二人|ふたり] で うるさい ほう が いい 。')],
    ],
    dante: [
      [Z2('[你|nǐ] [女朋友|nǚ péng you] [写|xiě] [的|de] [诗|shī] [比|bǐ] [星期一|xīng qī yī] [还|hái] [悲伤|bēi shāng] ！', '[君|きみ] の [彼女|かのじょ] の [詩|し] 、 [月曜日|げつようび] より [暗|くら]い ぜ ！'),
        Z2('[星期一|xīng qī yī] [也|yě] [有|yǒu] [诗意|shī yì] 。', '[月曜日|げつようび] に も [詩|し] は ある よ 。')],
      [Z2('[在|zài] [阁楼|gé lóu] [里|lǐ] [约会|yuē huì] ？ [有|yǒu] [灰尘|huī chén] [还有|hái yǒu] [蜘蛛|zhī zhū] ！', '[屋根裏|やねうら] で デート ？ ほこり と クモ だらけ だろ ！'),
        Z2('[至少|zhì shǎo] [蜘蛛|zhī zhū] [不会|bù huì] [大喊大叫|dà hǎn dà jiào] 。', '[少|すく]なくとも 、 クモ は [叫|さけ]ばない 。')],
      [Z2('[她|tā] [连|lián] [去|qù] [海边|hǎi biān] [都|dōu] [穿|chuān] [黑色|hēi sè] ！', '[彼女|かのじょ] 、 [海|うみ] に も [黒|くろ]い [服|ふく] で [行|い]く ん だ ぜ ！'),
        Z2('[你|nǐ] [还|hái] [天天|tiān tiān] [穿|chuān] [一身|yī shēn] [煤灰|méi huī] [呢|ne] 。', 'そっち は [毎日|まいにち] [石炭|せきたん] を [着|き]て る じゃ ない 。')],
      [Z2('[我|wǒ] [的|de] [声音|shēng yīn] [能|néng] [传|chuán] [到|dào] [塔|tǎ] [顶|dǐng] ！ [你|nǐ] [的|de] [呢|ne] ？', '[俺|おれ] の [声|こえ] は [塔|とう] まで [届|とど]く ぜ ！ [君|きみ] の は ？'),
        Z2('[我|wǒ] [的|de] [不用|bù yòng] [喊|hǎn] [也|yě] [能|néng] [传|chuán] [到|dào] 。', '[叫|さけ]ばなくて も 、 ちゃんと [届|とど]く よ 。')],
      [Z2('[我|wǒ] [打赌|dǎ dǔ] [你|nǐ] [连|lián] [口哨|kǒu shào] [都|dōu] [不会|bù huì] [吹|chuī] ！', 'どうせ [口笛|くちぶえ] も [吹|ふ]けない ん だろ ！'),
        Z2('[我|wǒ] [吹|chuī] [口哨|kǒu shào] [比|bǐ] [你|nǐ] [唱歌|chàng gē] [好听|hǎo tīng] 。', 'そっち の [歌|うた] より 、 [口笛|くちぶえ] の ほう が うまい よ 。')],
      [Z2('[诗|shī] ？ [我|wǒ] [更|gèng] [喜欢|xǐ huan] [有|yǒu] [节奏|jié zòu] [的|de] [歌|gē] ！', '[詩|し] ？ [俺|おれ] は リズム の ある [歌|うた] が [好|す]き だ ！'),
        Z2('[好|hǎo] [诗|shī] [也|yě] [有|yǒu] [节奏|jié zòu] 。', 'いい [詩|し] に も 、 リズム は ある 。')],
    ],
  };
  for (const id of ['morgana', 'dante']) DUEL_CJK[id].forEach(([jab, back], i) => { if (DUEL[id][i]) { Object.assign(DUEL[id][i].jab, jab); Object.assign(DUEL[id][i].back, back); } });
  [Z2('[我|wǒ] [喜欢|xǐ huan] [面包|miàn bāo] ！', 'パン が [好|す]き ！'), Z2('[现在|xiàn zài] [几|jǐ] [点|diǎn] ？', '[今|いま] 、 [何時|なんじ] ？'), Z2('[今天|jīn tiān] [是|shì] [晴天|qíng tiān] 。', '[今日|きょう] は [晴|は]れ だ よ 。'),
    Z2('[帽子|mào zi] [真|zhēn] [好看|hǎo kàn] ！', 'いい [帽子|ぼうし] だ ね ！'), Z2('[我|wǒ] [的|de] [猫|māo] [叫|jiào] [米莫|Mǐ mò] 。', 'うち の [猫|ねこ] の [名前|なまえ] は ミモ 。')].forEach((v, i) => { if (MISFIRES[i]) Object.assign(MISFIRES[i], v); });
  Object.assign(BREAKUP.kind, Z2('[对不起|duì bu qǐ] 。 [你|nǐ] [很|hěn] [特别|tè bié] ， [但|dàn] [我|wǒ] [的|de] [心|xīn] [在|zài] [别人|bié rén] [那里|nà lǐ] 。', 'ごめん ね 。 [本当|ほんとう] に [特別|とくべつ] な [人|ひと] だ よ 。 でも 、 [心|こころ] は [他|ほか] の [人|ひと] に [向|む]いて る 。'));
  Object.assign(BREAKUP.blunt, Z2('[我|wǒ] [不|bù] [喜欢|xǐ huan] [你|nǐ] [了|le] 。 [拜拜|bái bái] 。', 'もう [好|す]き じゃ ない 。 じゃあ ね 。'));
  Object.assign(BREAKUP.dodge, Z2('[呃|è] …… [今天|jīn tiān] [天气|tiān qì] [不错|bù cuò] [吧|ba] ？', 'えっと …… いい [天気|てんき] だ ね ？'));
  // ---------------- the telenovela, as the big TV romances say it: zh «情深深静悄悄» (第N集 · 未完待续…… · 剧终), ja «静寂の恋»
  // (第N話 · つづく… · 終); ep holds the chapter's pattern, {n} its number
  const TN_CJK = {
    show: Z2('[情|qíng] [深深|shēn shēn] [静悄悄|jìng qiāo qiāo]', '[静寂|せいじゃく] の [恋|こい]'), ep: Z2('[第|dì] {n} [集|jí]', '[第|だい] {n} [話|わ]'),
    cont: Z2('[未完待续|wèi wán dài xù] ……', 'つづく …'), fin: Z2('[剧终|jù zhōng]', '[終|おわり]'),
    'm.meet': Z2('[阁楼|gé lóu] [上|shang] [的|de] [女孩|nǚ hái]', '[屋根裏|やねうら] の [少女|しょうじょ]'), 'm.r2': Z2('[诗|shī] [中|zhōng] [的|de] [秘密|mì mì]', '[詩|し] に [隠|かく]した [秘密|ひみつ]'),
    'm.r3': Z2('[山坡|shān pō] [还|hái] [记得|jì de]', '[丘|おか] は [覚|おぼ]えて いる'), 'm.r4': Z2('[奶奶|nǎi nai] [的|de] [声音|shēng yīn]', '[祖母|そぼ] の [声|こえ]'),
    'm.r5': Z2('[大结局|dà jié jú] ： [最后|zuì hòu] [一|yī] [行|háng] [诗|shī]', '[最終回|さいしゅうかい] ： [最後|さいご] の [一行|いちぎょう]'),
    'd.meet': Z2('[唱歌|chàng gē] [的|de] [铁匠|tiě jiang]', '[歌|うた]う [鍛冶屋|かじや]'), 'd.r2': Z2('[钢铁|gāng tiě] [之|zhī] [心|xīn]', '[鋼|はがね] の [心|こころ]'),
    'd.r3': Z2('[大|dà] [手掌|shǒu zhǎng] ， [软|ruǎn] [心肠|xīn cháng]', '[大|おお]きな [手|て] 、 やさしい [心|こころ]'), 'd.r4': Z2('[钟声|zhōng shēng] [相应|xiāng yìng]', '[響|ひび]き[合|あ]う [鐘|かね]'),
    'd.r5': Z2('[大结局|dà jié jú] ： [钟声|zhōng shēng] [响起|xiǎng qǐ]', '[最終回|さいしゅうかい] ： [鐘|かね] が [鳴|な]る'),
    rival: Z2('[冤家|yuān jia] ！', '[恋|こい] の ライバル ！'), crack: Z2('[铠甲|kǎi jiǎ] [上|shang] [的|de] [裂痕|liè hén]', '[鎧|よろい] の ひび'),
    breakup: Z2('[雨|yǔ] [中|zhōng] [的|de] [眼泪|yǎn lèi]', '[雨|あめ] の [中|なか] の [涙|なみだ]'), switch: Z2('[新|xīn] [的|de] [恋情|liàn qíng]', '[新|あたら]しい [恋|こい]'),
  };
  for (const [k, v] of Object.entries(TN_CJK)) if (TN[k]) Object.assign(TN[k], v);
  // ---------------- names over their heads (CJK.md's table) and the bell's count (zh 七下; ja 七回, with its sound changes)
  const NAME_CJK = { morgana: Z2('[莫甘娜|Mò gān nà]', 'モルガナ'), dante: Z2('[但丁|Dàn dīng]', 'ダンテ') };
  const KAI_JA = ['', '[一回|いっかい]', '[二回|にかい]', '[三回|さんかい]', '[四回|よんかい]', '[五回|ごかい]', '[六回|ろっかい]', '[七回|ななかい]', '[八回|はっかい]', '[九回|きゅうかい]', '[十回|じゅっかい]'];
  const COUNT_JA = { 1: ['いっかい'], 6: ['ろっかい'], 7: ['しち'], 8: ['はっかい'], 9: ['きゅうかい'], 10: ['じゅっかい', 'じっかい'] };     // (counts the number word alone doesn't cover; compared through CJK.canon)
  const countSrc = N => (lang() === 'ja' ? KAI_JA[N] || LEX.src('n.' + N) : `${N === 2 ? '[两|liǎng]' : LEX.src('n.' + N)} [下|xià]`);
  // ================================================================ little sounds of their own (through Sound's bus): the hammer's
  // clang, Dante humming, Poe's meow (Sound.ctx is null until the first key or click: then they're silent)
  function sfx(fn) { const ac = Sound.ctx, out = Sound.out; if (!ac || !out) return; try { fn(ac, out, ac.currentTime); } catch (e) { /* (audio not ready) */ } }
  function tone(ac, out, type, f, t, a, d, v, f2) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + a + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, v), t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    o.connect(g); g.connect(out); o.start(t); o.stop(t + a + d + 0.05);
  }
  const clang = v => sfx((ac, out, t) => { if (v < 0.03) return; [[523, 0.07], [1371, 0.035], [2213, 0.02], [3150, 0.012]].forEach(([f, a], i) => tone(ac, out, i ? 'sine' : 'triangle', f * (0.98 + Math.random() * 0.04), t, 0.003, 0.5 - i * 0.09, a * v)); });
  const meow = (v = 1) => sfx((ac, out, t) => {
    const o = ac.createOscillator(), g = ac.createGain(), bp = ac.createBiquadFilter(); o.type = 'sawtooth'; bp.type = 'bandpass'; bp.Q.value = 4;
    o.frequency.setValueAtTime(560, t); o.frequency.linearRampToValueAtTime(880, t + 0.13); o.frequency.linearRampToValueAtTime(600, t + 0.45);
    bp.frequency.setValueAtTime(950, t); bp.frequency.linearRampToValueAtTime(1700, t + 0.16); bp.frequency.linearRampToValueAtTime(900, t + 0.45);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.11 * v, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(bp); bp.connect(g); g.connect(out); o.start(t); o.stop(t + 0.55);
  });
  // a hummed phrase: "la la laaa" (soft: quieter and lower, for the song at the end)
  const TUNES = [[0, 2, 4, 7, 4, 2], [7, 7, 9, 7, 4, 2, 0], [4, 5, 7, 12, 11, 7], [0, 4, 7, 9, 7, 4]];
  function hum(v, soft) {
    sfx((ac, out, t) => {
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = soft ? 900 : 1500; lp.connect(out);
      const tune = TUNES[(Math.random() * TUNES.length) | 0], base = soft ? 165 : 196;
      tune.forEach((n, i) => {
        const f = base * Math.pow(2, n / 12), s = t + i * (soft ? 0.36 : 0.22), len = i === tune.length - 1 ? 0.5 : soft ? 0.3 : 0.18;
        const o = ac.createOscillator(), vib = ac.createOscillator(), vg = ac.createGain(), g = ac.createGain();
        o.type = 'triangle'; o.frequency.value = f; vib.frequency.value = 5.5; vg.gain.value = f * 0.012; vib.connect(vg); vg.connect(o.frequency);
        g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime((soft ? 0.05 : 0.07) * v, s + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, s + len);
        o.connect(g); g.connect(lp); o.start(s); vib.start(s); o.stop(s + len + 0.05); vib.stop(s + len + 0.05);
      });
    });
  }

  // the telenovela's music: an organ chord under a title card, the dun-dun-DUNNN, a harp swoon
  const organ = () => sfx((ac, out, t) => {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.connect(out);
    [130.8, 155.6, 196, 261.6, 311.1].forEach(f => {
      for (const det of [-5, 5]) {
        const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.02, t + 0.5); g.gain.setValueAtTime(0.02, t + 2.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.1);
        o.connect(g); g.connect(lp); o.start(t); o.stop(t + 3.15);
      }
    });
    tone(ac, out, 'sine', 70, t, 0.01, 1.4, 0.18, 40);
  });
  const sting = () => sfx((ac, out, t) => {
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500; lp.connect(out);
    [[196, 0, 0.17], [185, 0.21, 0.17], [155.6, 0.44, 1.25]].forEach(([f, s, len], i) => {
      for (const det of [-7, 0, 7]) {
        const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = det;
        g.gain.setValueAtTime(0.0001, t + s); g.gain.exponentialRampToValueAtTime(i === 2 ? 0.05 : 0.04, t + s + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + s + len);
        o.connect(g); g.connect(lp); o.start(t + s); o.stop(t + s + len + 0.05);
      }
    });
    tone(ac, out, 'sine', 95, t + 0.44, 0.004, 0.7, 0.25, 42);       // (the timpani under the last note)
  });
  const swoon = () => sfx((ac, out, t) => { [0, 4, 7, 11, 12, 16, 19, 23, 24].forEach((n, i) => tone(ac, out, 'triangle', 262 * Math.pow(2, n / 12), t + i * 0.05, 0.004, 0.9, 0.045)); });
  // the cards: a title card over everything, and the dark warm edges of a frozen frame (with «Continuará…» or «Fin»)
  let tnEl = null, vigEl = null;
  const tnText = k => { const L = TN[k], l = lang(); return { t: pickLang(L, l, L.en), en: L.en }; };
  // a title's words by the weave, like every line (DESIGN.md 17.3): the English with the words you know in the language, the whole
  // title in the language as the weave rises (the same titles first, by their key); never the English under it
  function tnMix(k) {
    const T0 = tnText(k);
    if (!T0.t || T0.t === T0.en || typeof STORY === 'undefined' || !STORY.mixHTML) return HT(T0.t);
    try { return STORY.mixHTML(T0.t, T0.en, { key: 'tn.' + k }).html; } catch (e) { return HT(T0.t); }
  }
  function tnEls() {
    css();
    if (!tnEl) { tnEl = document.createElement('div'); tnEl.id = 'tn-card'; document.body.appendChild(tnEl); }
    if (!vigEl) { vigEl = document.createElement('div'); vigEl.id = 'tn-vig'; document.body.appendChild(vigEl); }
  }
  // a chapter's title card: the show's name, «Capítulo N» (counting every chapter you've seen), the chapter's own name
  async function episode(k) {
    if (!TN[k]) return;
    tnEls();
    const st = S(); st.episode = (st.episode || 0) + 1;
    const ep = tnText('ep');
    // (zh / ja: the notation with its readings, and the chapter as 第3集 / 第3話; the show's name and the chapter's by the weave)
    const epHTML = isC() && TN.ep[lang()] ? HT(fillVars(TN.ep[lang()], { n: st.episode })) : `${esc(ep.t)} ${st.episode}`;
    tnEl.innerHTML = `<div class="rose">❦</div><div class="show">${tnMix('show')}</div>`
      + `<div class="ep">${epHTML}</div><div class="ti">${tnMix(k)}</div>`;
    void tnEl.offsetWidth; tnEl.classList.add('on'); organ();
    await wait(3.0);
    tnEl.classList.remove('on'); await wait(0.5);
  }
  // the end of a chapter: the picture goes sepia and dark at the edges, «Continuará…» (a finale: «Fin», and a harp). (The
  // sepia is the overlay's backdrop-filter: main.js sets the canvas's own filter every frame, for the Hush.)
  async function continuara(fin) {
    tnEls();
    vigEl.innerHTML = `<div class="ct">${tnMix(fin ? 'fin' : 'cont')}</div>`;          // (by the weave, no English under it)
    vigEl.className = 'on' + (fin ? ' fin' : '');
    if (fin) swoon(); else sting();
    await wait(fin ? 3.2 : 2.4);
    vigEl.className = ''; await wait(0.35);
    vigEl.innerHTML = '';
  }
  // a bombshell: the camera rushes in on the speaker's face, dun-dun-DUNNN, a red flash at the edges, Mimo gasps; a sweet
  // moment: a slow push in and a harp
  async function dramaZoom(id, kind) {
    const st = stOf(id), F = FIG[id], Y = G.sim.you; if (!F) return;
    const hp = V3(0, 0.22, 0); F.head.updateWorldMatrix(true, false); F.head.localToWorld(hp);
    const dx = Y.x - st.x, dz = Y.z - st.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, sweet = kind === 'swoon';
    shot(hp.x + ux * (sweet ? 1.7 : 1.3) - uz * 0.22, hp.y + 0.06, hp.z + uz * (sweet ? 1.7 : 1.3) + ux * 0.22, hp.x, hp.y - 0.03, hp.z, sweet ? 0.9 : 0.22);
    if (sweet) swoon();
    else {
      sting(); tnEls(); vigEl.className = 'flash'; setTimeout(() => { if (vigEl.className === 'flash') vigEl.className = ''; }, 650);
      G.sim.mimo.happy = 0.5; sprites.gaspT = 1.3;                                    // (Mimo gasps: a hop and a «!!»)
    }
    await wait(sweet ? 0.5 : 0.35);
  }

  // ================================================================ the people (live objects: main.js gives them solids, the mini-map dots,
  // and STORY.sayInline puts their lines over them)
  const DS = { id: 'dante', x: FORGE.dante.x, z: FORGE.dante.z, y: GY, yaw: 0, speed: 0, phase: 0, mode: 'home', blink: 2, talk: 0, seed: 0.7, swing: 0.3, look: null, pose: 'work', lean: 0, t0: 0, stuck: 0 };
  const MS = { id: 'morgana', x: SEAT.x, z: SEAT.z, y: AY, yaw: 0, speed: 0, phase: 0, mode: 'attic', blink: 3, talk: 0, seed: 2.1, look: null, pose: 'sit', lean: 0, t0: 0, stuck: 0 };
  const PO = { x: POEMS[0].poe.x, z: POEMS[0].poe.z, y: POEMS[0].poe.y, yaw: POEMS[0].poe.yaw, speed: 0, phase: 0, mode: 'sit', at: 0, path: null, pi: 0, meowT: 2, s: 1, look: null };
  const FIG = { dante: null, morgana: null };
  let MSTYLE = 'veil';            // Morgana's look (makeMorgana): the user's pick, 2026-11-08; restyle() swaps it live, for previews
  function restyle(style) {
    const old = FIG.morgana; if (!old) return null;
    const parent = old.root.parent, vis = old.root.visible, F = makeMorgana(style);
    F.sitY = old.sitY;
    if (parent) { parent.remove(old.root); parent.add(F.root); }
    F.root.visible = vis; FIG.morgana = F; MSTYLE = style;
    return F;
  }
  let root = null, poeOut = null, poeIn = null, forge = null, poems = [], ladder = null, flowers = [], sprites = {}, notes = [], gyF = (x, z) => WORLD.terrainAt(x, z);
  let inside = false, stRef = null, sceneOn = false, hold = null;
  const personVisible = id => {
    if (!root || !G || (G.indoors && G.indoors())) return false;
    if (id === 'dante') return DS.mode !== 'gone' && !!FIG.dante && FIG.dante.root.visible && root.visible;
    return ['out', 'approach', 'leave', 'held'].includes(MS.mode) && !!FIG.morgana && FIG.morgana.root.visible;
  };
  const person = (id, st) => ({ id, story: true, r: 0.46, talking: false, lines: null,
    // (the name over the bubble: zh / ja 莫甘娜 / モルガナ in the mode, as story.js does)
    get name() { return isC() ? PL(NAME_CJK[id][lang()]) : NAME[id]; }, get x() { return st.x; }, get z() { return st.z; }, get y() { return st.y; },
    get top() { return (st.pose === 'sit' ? 1.38 : (id === 'dante' ? 1.86 : 1.62)) + (id === 'morgana' && FIG.morgana ? FIG.morgana.topAdd || 0 : 0); }, get hidden() { return !personVisible(id); } });
  const DANTE = person('dante', DS), MORGANA = person('morgana', MS);
  const api = id => (id === 'dante' ? DANTE : MORGANA);
  const stOf = id => (id === 'dante' ? DS : MS);
  const VOICE = { id: 'romance.voice', name: '???', x: RUIN.upper.x - 0.3, z: RUIN.upper.z, y: RUIN.upper.y, top: 0.35, talking: false };

  // ================================================================ build: the forge and Dante, Poe, the poems, the ladder, wildflowers
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    gyF = gy;
    root = new THREE.Group(); root.name = 'romance'; scene.add(root);
    forge = buildForge(root);
    FIG.dante = makeDante(); root.add(FIG.dante.root);
    FIG.morgana = makeMorgana(MSTYLE); root.add(FIG.morgana.root); FIG.morgana.root.visible = false; FIG.morgana.sitY = 0.2;
    FIG.dante.sitY = 0.15;
    poeOut = makePoe(); root.add(poeOut.root);
    poems = POEMS.map((P, i) => buildPoem(root, P, i));
    ladder = buildLadder(root);
    flowers = FLOWERS.map(F => buildFlowers(root, F, gy));
    // the marks over their heads: "!" (someone new), "♥" (a rank waiting: talk), and Dante's ♪ notes
    const markTex = symTex('!', '#f2a33a'), heartTex = symTex('♥', '#e0503f');
    sprites.mark = new THREE.Sprite(new THREE.SpriteMaterial({ map: markTex, transparent: true, opacity: 0, depthWrite: false })); sprites.mark.scale.setScalar(0.55); root.add(sprites.mark);
    sprites.heartD = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, opacity: 0, depthWrite: false })); sprites.heartD.scale.setScalar(0.5); root.add(sprites.heartD);
    sprites.heartM = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, opacity: 0, depthWrite: false })); sprites.heartM.scale.setScalar(0.5); root.add(sprites.heartM);
    sprites.pop = new THREE.Sprite(new THREE.SpriteMaterial({ map: heartTex, transparent: true, opacity: 0, depthWrite: false })); sprites.pop.scale.setScalar(0.4); scene.add(sprites.pop); sprites.popT = 0;
    sprites.gasp = new THREE.Sprite(new THREE.SpriteMaterial({ map: symTex('!!', '#e0503f'), transparent: true, opacity: 0, depthWrite: false })); sprites.gasp.scale.setScalar(0.5); scene.add(sprites.gasp); sprites.gaspT = 0;   // (Mimo's gasp)
    const noteTex = [symTex('♪', '#e0503f'), symTex('♫', '#3f7fc9'), symTex('♪', '#4f9a5a')];
    for (let i = 0; i < 7; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: noteTex[i % 3], transparent: true, opacity: 0, depthWrite: false })); s.scale.setScalar(0.42); root.add(s); notes.push({ s, t: 9, x: 0, z: 0, y: 0, dx: 0 }); }
    // the forge's solids are fixed (it's always there): the hearth, the anvil, the barrel, the coal bucket, the bell stand
    const colliders = [
      { obox: 1, x: FORGE.hearth.x, z: FORGE.hearth.z, hw: 0.64, hd: 0.84, rot: 0 }, { x: FORGE.anvil.x, z: FORGE.anvil.z, r: 0.36 },
      { x: FORGE.barrel.x, z: FORGE.barrel.z, r: 0.33 }, { x: FORGE.coal.x, z: FORGE.coal.z, r: 0.24 },
      { obox: 1, x: FORGE.bell.x, z: FORGE.bell.z, hw: 0.32, hd: 0.9, rot: 0 },
    ];
    function stats() {
      let tris = 0, calls = 0;
      root.traverseVisible(o => { if (o.isMesh) { const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += n; calls++; } });
      return { tris: Math.round(tris), calls };
    }
    return { colliders, group: root, people: [DANTE, MORGANA], update, stats, landmarks: LANDMARKS, objects: { forge, dante: FIG.dante, morgana: FIG.morgana, poe: poeOut, poems, ladder, flowers } };
  }

  // ================================================================ per frame
  function resetForState() {        // a new game or a loaded save: everyone back in their place
    const st = S();
    DS.mode = 'home'; DS.x = FORGE.dante.x; DS.z = FORGE.dante.z; DS.yaw = 0; DS.pose = 'work'; DS.y = GY; DS.speed = 0;
    MS.mode = 'attic'; MS.x = SEAT.x; MS.z = SEAT.z; MS.yaw = 0; MS.pose = 'sit'; MS.y = AY; MS.speed = 0;
    hold = null; sceneOn = false; st.favor = null;
    placePoe(); placeMorgana();
    if (ladder) { const on = !!st.trail.ladder; ladder.rope.visible = ladder.hooks.visible = on; ladder.rope.scale.y = on ? 1 : 0.001; }
    st.rivalAt = Math.max(st.rivalAt || -1e9, now() - RIVAL_COOL + 75);       // (a rival may come looking for you a little after a load)
  }
  // Poe: by the first poem not yet read (in order), or gone up to the attic once the ladder is down
  function placePoe() {
    const st = S(), tr = st.trail;
    PO.path = null; PO.s = 1; PO.speed = 0;
    if (tr.ladder) { PO.mode = 'gone'; PO.at = 4; return; }
    let i = 0; while (i < 3 && tr.read[i]) i++;
    const P = POEMS[i].poe; PO.at = i; PO.mode = 'sit'; PO.x = P.x; PO.z = P.z; PO.yaw = P.yaw; PO.y = P.y !== undefined ? P.y : WORLD.groundAt(P.x, P.z);
  }
  // Morgana's model lives in the attic or outdoors, wherever she is
  function placeMorgana() {
    const F = FIG.morgana; if (!F) return;
    if (MS.mode === 'attic') { if (attic) { attic.g.add(F.root); F.root.visible = true; } else F.root.visible = false; }
    else { root.add(F.root); F.root.visible = true; }
  }
  const RIVAL_COOL = 240;
  function update(dt, t, you) {
    if (!G || !root) return;
    if (G.state !== stRef) { stRef = G.state; resetForState(); }
    const st = S(), ind = !!(G.indoors && G.indoors()), F = G.state.flags;
    const past = typeof CEMETERY !== 'undefined' && CEMETERY.era === 'past';
    const Y = you || { x: -10, z: -137, y: GY };
    if (myLock && G.sim.lock > 0 && !STORY.busy && !sceneOn) { lock(false); G.cam.override = null; }
    root.visible = !ind && Math.hypot(Y.x + 15, Y.z + 190) < 170;
    sprites.pop.visible = sprites.popT > 0;
    if (sprites.popT > 0) { sprites.popT -= dt; sprites.pop.material.opacity = clamp(sprites.popT * 2, 0, 1); sprites.pop.position.y += dt * 0.6; }
    sprites.gasp.visible = sprites.gaspT > 0;
    if (sprites.gaspT > 0) { const Mi = G.sim.mimo; sprites.gaspT -= dt; sprites.gasp.material.opacity = clamp(sprites.gaspT * 2.5, 0, 1); sprites.gasp.position.set(Mi.x, (Mi.y || 0) + 1.15 + (1.3 - sprites.gaspT) * 0.25, Mi.z); }
    if (!root.visible) return;
    // Dante, at his forge (hammering and singing) or out looking for you
    const FD = FIG.dante, dD = Math.hypot(Y.x - DS.x, Y.z - DS.z);
    FD.root.visible = DS.mode !== 'gone' && dD < 110;
    if (FD.root.visible) { stepRival(DS, dt, you); poseFig(FD, DS, DANTE, dt, t, you); danteWork(dt, t, you, dD); }
    forge.glow.material.opacity = 0.5 + 0.12 * Math.sin(t * 7.3) + 0.06 * Math.sin(t * 17.1);
    // Morgana, when she's out (a rival looking for you, or on the theater's steps)
    if (MS.mode !== 'attic') { stepRival(MS, dt, you); if (FIG.morgana.root.parent !== root) placeMorgana(); poseFig(FIG.morgana, MS, MORGANA, dt, t, you); }
    // the poem trail (after Rosa): the pages, Poe, the ladder
    const trail = !!F.rosa && !!F.hatched;
    poems.forEach((p, i) => {
      p.g.visible = trail && !(past && i >= 2);
      p.glow.material.opacity = st.trail.read[i] ? 0 : 0.32 + 0.18 * Math.sin(t * 3 + i);
    });
    poeOut.root.visible = trail && ['sit', 'trot', 'scene', 'steps'].includes(PO.mode) && !(past && PO.at >= 2 && PO.mode !== 'steps');
    if (poeOut.root.visible) stepPoe(dt, t, you);
    ladder.rope.visible = ladder.hooks.visible = (!!st.trail.ladder || !!ladder.unrolling) && !past;
    flowers.forEach((f, i) => { f.m.visible = !(past && i === 1); });
    // the marks: "!" over Dante before you've met him, "♥" when a rank is waiting for a talk
    const pD = PS('dante'), pM = PS('morgana');
    sprites.mark.material.opacity = damp(sprites.mark.material.opacity, F.rosa && !pD.met && FD.root.visible && !DANTE.talking && dD < 30 ? 1 : 0, 6, dt);
    sprites.mark.position.set(DS.x, DS.y + 2.25 + Math.sin(t * 6) * 0.06, DS.z);
    sprites.heartD.material.opacity = damp(sprites.heartD.material.opacity, wantsTalk('dante') && FD.root.visible && !DANTE.talking ? 1 : 0, 6, dt);
    sprites.heartD.position.set(DS.x, DS.y + 2.3 + Math.sin(t * 4) * 0.07, DS.z);
    sprites.heartM.visible = MS.mode !== 'attic';
    if (sprites.heartM.visible) { sprites.heartM.material.opacity = damp(sprites.heartM.material.opacity, wantsTalk('morgana') && !MORGANA.talking ? 1 : 0, 6, dt); sprites.heartM.position.set(MS.x, MS.y + 2.05 + Math.sin(t * 4) * 0.07, MS.z); }
    // Dante's notes, floating up
    for (const n of notes) { if (n.t > 1.6) { n.s.material.opacity = 0; continue; } n.t += dt; const k = n.t / 1.6; n.s.position.set(n.x + Math.sin(n.t * 4 + n.dx) * 0.18, n.y + k * 1.3, n.z); n.s.material.opacity = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85; }
    if (hold) holdPose(dt, t);
    if (you) triggers(you, dt);
    void pM;
  }
  // a person's figure: walking, sitting, hammering, singing, reading, holding hands, a hug
  function poseFig(F, st, P, dt, t, Y) {
    F.root.position.set(st.x, st.y, st.z); F.root.rotation.y = st.yaw;
    const walk = clamp(st.speed / 1.4, 0, 1.6);
    if (st.speed > 0.05) st.phase += dt * (3 + st.speed * 2.4); else st.phase = damp(st.phase, Math.round(st.phase / Math.PI) * Math.PI, 8, dt);
    const sw = Math.sin(st.phase), sit = st.pose === 'sit';
    st.talk = damp(st.talk || 0, P.talking ? 1 : 0, 10, dt);
    F.body.position.y = (sit ? F.sitY : 0) + Math.abs(sw) * 0.04 * Math.min(walk, 1.2) + st.talk * Math.abs(Math.sin(t * 13)) * 0.02;
    F.body.rotation.z = sw * 0.04 * walk + Math.sin(t * 1.1 + st.seed) * 0.012;
    F.body.rotation.x = damp(F.body.rotation.x, st.lean || 0, 6, dt);
    F.legs.forEach((h, i) => { h.rotation.x = sit ? -1.42 : Math.sin(st.phase + i * Math.PI) * 0.55 * walk; });
    let a0 = [-0.1 - sw * 0.45 * walk, 0, -0.1], a1 = [-0.1 + sw * 0.45 * walk, 0, 0.1];
    const near = Y && Math.hypot(Y.x - st.x, Y.z - st.z) < (P.talking ? 9 : 4.2);
    let hy = Math.sin(t * 0.37 + st.seed * 20) * 0.3, hx = 0;
    if (st.pose === 'work' && !near && st.speed < 0.05) {          // Dante at the anvil: raise the hammer slowly, bring it down hard
      const c = st.swing, up = c < 0.62 ? smoothstep(0, 0.62, c) : c < 0.74 ? 1 - smoothstep(0.62, 0.74, c) : 0;
      a0 = [-0.75 - up * 1.75, 0, -0.18]; a1 = [-0.85, 0, 0.3]; hx = 0.28; hy *= 0.3;
      if (st.sing) { hx = -0.1; hy = Math.sin(t * 2) * 0.25; }
    } else if (st.pose === 'sit') {                                  // Morgana on the window seat, writing
      a0 = [-0.95, 0, -0.32]; a1 = [-0.7, 0, 0.36]; hx = 0.3; hy *= 0.25;
      if (F.props.quill) F.props.quill.visible = !near;
      if (F.props.notebook) { F.props.notebook.rotation.set(-1.05, 0.25, 0.4); }
    } else if (st.pose === 'read') { a0 = [-1.3, 0, -0.35]; a1 = [-1.25, 0, 0.42]; hx = 0.18; if (F.props.notebook) F.props.notebook.rotation.set(-1.6, 0, 0.9); }
    else if (st.pose === 'hold') { a1 = [-0.12, 0, 0.55]; }
    else if (st.pose === 'hug') { a0 = [-1.35, 0, 0.45]; a1 = [-1.35, 0, -0.45]; hx = 0.1; }
    else if (st.pose === 'sing') { a0 = [-0.35, 0, -0.55]; a1 = [-0.35, 0, 0.55]; hx = -0.18; hy = Math.sin(t * 1.6) * 0.18; }
    else if (st.pose === 'drama') { a0 = [-2.55, 0, clamp((Math.abs(F.arms[0].position.x) - 0.1) / 0.7, 0.3, 0.7)]; }   // (the telenovela: a hand up to the forehead…)
    else if (st.pose === 'point') { a0 = [-1.5, 0, -0.06]; }                          // (…and pointing right at you)
    if (F.splay && !['sit', 'read', 'hug', 'sing', 'work'].includes(st.pose)) { if (st.pose !== 'drama' && st.pose !== 'point') a0[2] -= F.splay; if (st.pose !== 'hold') a1[2] += F.splay; }   // (arms clear of wide hips)
    if (st.pose !== 'sit' && F.props.quill) F.props.quill.visible = false;
    if (st.pose !== 'sit' && st.pose !== 'read' && F.props.notebook) F.props.notebook.rotation.set(-0.3, 0, 0);
    F.arms[0].rotation.set(...a0); F.arms[1].rotation.set(...a1);
    if (st.look) { hy = clamp(angDiff(st.yaw, Math.atan2(st.look.x - st.x, st.look.z - st.z)), -1.1, 1.1); hx = -0.05; }
    else if (near && Y) { hy = clamp(angDiff(st.yaw, Math.atan2(Y.x - st.x, Y.z - st.z)), -1.1, 1.1); hx = sit ? -0.08 : -0.05; }
    if (st.pose === 'drama') { hx = -0.32; hy = 0.45; }                              // (…head thrown back, looking away)
    F.head.rotation.y = damp(F.head.rotation.y, hy, 5, dt); F.head.rotation.x = damp(F.head.rotation.x, hx, 6, dt);
    if ((st.blink -= dt) < 0 && st.blink < -0.12) st.blink = 2 + Math.random() * 3.5;
    F.eyes.forEach(e => { e.scale.y = st.blink < 0 ? 0.12 : 1; });
    const m = F.mouth, open = st.talk > 0.3 ? 0.55 + Math.abs(Math.sin(t * 16)) * 1.1 : (st.sing ? 0.8 + Math.abs(Math.sin(t * 6)) * 0.5 : 1);
    m.scale.y = (m.userData.sy || (m.userData.sy = m.scale.y)) * open;
  }
  // at home, Dante turns to you when you come close; otherwise he works: a strike every second or so (a clang, sparks), and he sings
  let humT = 1.5, noteT = 0;
  function danteWork(dt, t, Y, d) {
    const st = DS, home = st.mode === 'home';
    if (!home) { st.sing = false; return; }
    if (st.pose === 'hold' || st.pose === 'hug') return;          // (a staged moment: he stays as placed)
    const near = Y && d < 4.2, talking = DANTE.talking;
    st.yaw = dampAngle(st.yaw, near || talking ? Math.atan2(Y.x - st.x, Y.z - st.z) : FORGE.dante.yaw, 4, dt);
    if (st.pose !== 'work') return;
    // (he always sings while he works; after the confession he lets it be quiet now and then: he's not scared of it any more)
    st.sing = !near && !talking && (PS('dante').rank < 5 || Math.sin(t * 0.21) > -0.2);
    if (!near && !talking) {
      const c0 = st.swing; st.swing = (st.swing + dt / 1.15) % 1;
      if (c0 < 0.74 && st.swing >= 0.74 || (c0 > st.swing && c0 < 0.74)) {       // the hammer lands
        const v = clamp(1 - d / 26, 0, 1); if (v > 0) clang(v * 0.9);
        if (d < 40 && G.w3d && G.w3d.fx) G.w3d.fx.sparkle(FORGE.anvil.x, GY + 0.82, FORGE.anvil.z, 3, ['#ffb347', '#ffd84a', '#ff7a2a']);
      }
    }
    if (st.sing && d < 34) {
      if ((noteT -= dt) <= 0) { noteT = 0.55 + Math.random() * 0.3; const n = notes.find(q => q.t > 1.6); if (n) { n.t = 0; n.x = st.x + (Math.random() - 0.5) * 0.4; n.z = st.z; n.y = st.y + 1.95; n.dx = Math.random() * 6; } }
      if ((humT -= dt) <= 0) { humT = 2.6 + Math.random() * 1.6; const v = clamp(1 - d / 22, 0, 1); if (v > 0.05) hum(v); }
    }
  }
  // a rival walking up to you (mode 'approach'), or off again ('leave'); otherwise they stay put
  function stepRival(st, dt, Y) {
    st.speed = 0;
    if (st.mode !== 'approach' && st.mode !== 'leave') { if (st.mode === 'home' || st.mode === 'out') st.y = st.mode === 'home' ? GY : WORLD.groundAt(st.x, st.z); return; }
    if (!Y) return;
    const toYou = st.mode === 'approach';
    let tx, tz;
    if (toYou) { tx = Y.x; tz = Y.z; } else { tx = st.x + Math.sin(st.leaveYaw) * 5; tz = st.z + Math.cos(st.leaveYaw) * 5; }
    const dx = tx - st.x, dz = tz - st.z, d = Math.hypot(dx, dz);
    if (toYou && d < 1.75) { st.speed = 0; st.yaw = dampAngle(st.yaw, Math.atan2(dx, dz), 8, dt); return; }
    const v = toYou ? 4.4 : 2.6, step = Math.min(d, v * dt);
    let nx = st.x + (dx / d) * step, nz = st.z + (dz / d) * step;
    [nx, nz] = WORLD.pushOut(nx, nz, 0.4);
    const moved = Math.hypot(nx - st.x, nz - st.z);
    st.x = nx; st.z = nz; st.y = WORLD.groundAt(st.x, st.z, st.y + 0.5); st.speed = Math.min(v, moved / Math.max(dt, 1e-4));
    st.yaw = dampAngle(st.yaw, Math.atan2(dx, dz), 7, dt);
    // (stuck: no real progress toward you for a while, e.g. sliding back and forth along a wall)
    const left = Math.hypot(tx - st.x, tz - st.z);
    if (!toYou || !(st.best < 1e9) || left < st.best - 0.25) { st.best = left; st.stuck = 0; } else st.stuck += dt;
    st.t0 += dt;
    if (toYou && (st.stuck > 1.2 || st.t0 > 25)) {          // (blocked by a wall: step out from behind the nearest corner, a few steps from you)
      const a = Math.atan2(st.x - Y.x, st.z - Y.z) + (Math.random() - 0.5) * 0.8;
      [st.x, st.z] = WORLD.pushOut(Y.x + Math.sin(a) * 4.5, Y.z + Math.cos(a) * 4.5, 0.5); st.y = WORLD.groundAt(st.x, st.z); st.stuck = 0; st.t0 = 0; st.best = 1e9;
    }
    if (!toYou && st.t0 > 3.2) goHome(st.id);
  }
  function goHome(id) {
    const st = stOf(id);
    st.t0 = 0; st.stuck = 0; st.best = 1e9; st.speed = 0; st.look = null;
    if (id === 'dante') { st.mode = 'home'; st.x = FORGE.dante.x; st.z = FORGE.dante.z; st.y = GY; st.yaw = 0; st.pose = 'work'; }
    else { st.mode = 'attic'; st.x = SEAT.x; st.z = SEAT.z; st.y = AY; st.yaw = 0; st.pose = 'sit'; placeMorgana(); }
  }
  // Poe: sits by a poem and waits; once it's read, he trots on to the next one (and waits for you if you fall behind)
  function stepPoe(dt, t, Y) {
    const P = poeOut, st = S();
    if (PO.mode === 'sit' && PO.at < 3 && st.trail.read[PO.at]) { PO.mode = 'trot'; PO.path = TRAIL_PATH[PO.at].map(([x, z]) => ({ x, z })); PO.pi = 1; }
    if (PO.mode === 'sit' && PO.at < 3) { const i = PO.at; if (i > 0 && !st.trail.read[i - 1]) placePoe(); }
    const dY = Y ? Math.hypot(Y.x - PO.x, Y.z - PO.z) : 99;
    PO.speed = 0;
    if (PO.mode === 'trot' && PO.path) {
      if (dY > 15) { PO.look = Y; }                                     // (wait up: you're too far behind)
      else {
        PO.look = null;
        const tg = PO.path[PO.pi], dx = tg.x - PO.x, dz = tg.z - PO.z, d = Math.hypot(dx, dz), v = dY < 5 ? 3.6 : 2.8, step = Math.min(d, v * dt);
        if (d > 1e-3) { PO.x += (dx / d) * step; PO.z += (dz / d) * step; PO.yaw = dampAngle(PO.yaw, Math.atan2(dx, dz), 9, dt); PO.speed = v; }
        if (d - step < 0.05) { PO.pi++; if (PO.pi >= PO.path.length) { PO.at++; PO.mode = 'sit'; PO.path = null; const S2 = POEMS[PO.at].poe; PO.yaw = S2.yaw; meow(0.6); } }
      }
      PO.y = WORLD.groundAt(PO.x, PO.z) + (PO.at === 0 && PO.pi <= 1 ? 0 : 0);
    }
    if (PO.mode === 'sit') {
      const S2 = POEMS[Math.min(PO.at, 3)].poe; PO.y = S2.y !== undefined ? S2.y : WORLD.groundAt(PO.x, PO.z);
      if (Y && dY < 6) PO.yaw = dampAngle(PO.yaw, Math.atan2(Y.x - PO.x, Y.z - PO.z), 3, dt);
      if (Y && dY < 7 && (PO.meowT -= dt) <= 0) { PO.meowT = 7 + Math.random() * 5; meow(clamp(1 - dY / 12, 0.2, 1)); if (!st.trail.seen && G.state.flags.rosa) { st.trail.seen = true; G.save(); } }
    }
    animatePoe(P, PO, dt, t);
  }
  function animatePoe(P, st, dt, t) {
    P.root.position.set(st.x, st.y, st.z); P.root.rotation.y = st.yaw; P.root.scale.setScalar(Math.max(0.001, st.s));
    const walk = st.speed > 0.05;
    if (walk) st.phase += dt * (8 + st.speed * 2.5); else st.phase = damp(st.phase, 0, 6, dt);
    const sitting = !walk && (st.mode === 'sit' || st.mode === 'steps' || st.mode === 'attic');
    P.body.rotation.x = damp(P.body.rotation.x, sitting ? -0.42 : 0, 6, dt);
    P.body.position.y = damp(P.body.position.y, sitting ? 0.06 : 0, 6, dt) + (walk ? Math.abs(Math.sin(st.phase)) * 0.03 : 0);
    P.legs.forEach((g, i) => { g.rotation.x = walk ? Math.sin(st.phase + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.7 : (sitting && i >= 2 ? 1.25 : sitting ? 0.42 : 0); });
    P.tail.forEach((g, i) => { g.rotation.x = (i ? 0.35 : -0.6) + Math.sin(t * 2.2 + i * 0.8) * 0.12; g.rotation.z = Math.sin(t * 1.7 + i * 0.6) * (0.25 + i * 0.05); });
    P.head.rotation.y = st.look && !walk ? clamp(angDiff(st.yaw, Math.atan2(st.look.x - st.x, st.look.z - st.z)), -1, 1) : Math.sin(t * 0.5) * 0.3;
    P.head.rotation.x = sitting ? 0.3 : 0;
  }
  // the hand-in-hand moment and the hug: their pose, and your arm reaching for theirs
  function holdPose() {
    const H = G.cast && G.cast.hero; if (!H || !hold) return;
    if (hold.kind === 'hold') { H.arms[0].rotation.set(-0.12, 0, -0.55); }
    if (hold.kind === 'hug') { H.arms[0].rotation.set(-1.3, 0, -0.45); H.arms[1].rotation.set(-1.3, 0, 0.45); }
  }
  // ================================================================ speech
  // a phrase as it sits inside a line: «me caes bien» (es / pt / de: no final dot, lower case); zh / ja: the notation without
  // its last 。 (phr) or as plain text in the mode (phP: for menus, toasts and the quests' English)
  const phr = id => { const p = PH[id]; if (!p) return ''; const s = String(p[lang()] || ''); return isC() ? s.replace(/\s*[。！]$/, '') : s.replace(/[.]$/, '').replace(/^(.)/, c => c.toLowerCase()); };
  const phP = id => (isC() ? PL(phr(id), { cap: false }) : phr(id));
  const phS = id => PL(String((PH[id] || {})[lang()] || ''));         // (the whole phrase, for a box's title)
  // a line (an LT key or a { en, es, pt, de, zh, ja } object) for the current language, with {mimo} and the phrases filled in.
  // zh / ja: the line's own slots get the notation, and its English weave the plain text; {mimo} stays for CJK (米莫 / ミモ,
  // or the name you gave)
  function lineOf(key, vars = {}) {
    const L = typeof key === 'string' ? LT[key] : key; if (!L) return { text: String(key), weave: String(key) };
    const c = isC(), mimo = (G && G.state && G.state.mimoName) || 'Mimo';
    const v = Object.assign({ caes: phr('ph.love.caesbien'), gustas: phr('ph.love.gustas'), quiero: phr('ph.love.quiero'), amo: phr('ph.love.amo') }, vars), w = { mimo };
    for (const k in v) w[k] = c ? PL(String(v[k]), { cap: false }) : v[k];
    if (!c) v.mimo = mimo;
    const en = (L[lang()] && L['en_' + lang()]) || L.en;            // (a zh / ja line that says it its own way has its own English)
    return { text: fillVars(pickLang(L, lang(), '') || '', v), weave: fillVars(en, w) };     // (a line with no text in the language: the English weave)
  }
  // said over someone, through the weave like everyone's lines (sayInline decides: English with words woven in, or the
  // whole line in the language; its English on request, EN)
  function speak(p, key, vars, full) {
    const L = lineOf(key, vars);
    p.lines = { en: L.weave }; p.lines[lang()] = L.text;
    const id = p === MORGANA ? 'morgana' : p === DANTE ? 'dante' : null;
    if (typeof key !== 'string' || !id || (!DRAMA[key] && !ACT[key])) return STORY.sayInline(p, full);
    // the telenovela: the acting (not from Morgana's window seat), the zoom and its music, then back to the two-shot
    return (async () => {
      const st = stOf(id), keep = { pose: st.pose, yaw: st.yaw }, act = st.pose === 'sit' ? null : ACT[key];
      if (act === 'turn') st.yaw += 2.6; else if (act) st.pose = act;
      if (DRAMA[key]) await dramaZoom(id, DRAMA[key]);
      const r = await STORY.sayInline(p, full);
      if (act) { st.pose = keep.pose; st.yaw = keep.yaw; }
      if (DRAMA[key] && sceneOn) faceShot(id);
      return r;
    })();
  }
  const think = (text, s) => STORY.think(text, s);
  const plainEn = L => UI.weavePlain(fillVars(L.en, { mimo: (G && G.state && G.state.mimoName) || 'Mimo' }), { english: true });
  // a poem (or the song) on a card: each line in the language, its English under it only on request (EN: DESIGN.md 17.3, the
  // English is never under a line by default); the last line gray when the Hush has it
  function poemCard(P, o = {}) {
    css();
    const l = lang(), own = !!(P[l] && P[l].length), lines = pickLang(P, l, P.en || []), en = (own && P['en_' + l]) || P.en || [];
    // (zh / ja: the notation with its readings, in a brush or Mincho face; reading it counts for the characters you know)
    const show = s => (own && isC() ? HT(s) : esc(s));
    const body = lines.map((s, i) => `<div class="${o.faded && i === lines.length - 1 ? 'fade' : ''}"><div class="pl">${show(s)}</div><div class="pe">${esc(en[i] || '')}</div></div>`).join('');
    const said = lines.join(' '), hasEn = own && lines.some((s, i) => en[i] && en[i] !== s);
    if (own && isC()) CJK.seen(said, { lang: l });
    const html = `<div class="tag">${esc(o.tag || 'A poem')}</div>${body}${o.faded ? '<div class="warn">The last line is fading to gray, like a hushed person’s words…</div>' : ''}${o.sig ? `<div class="sig">${esc(o.sig)}</div>` : ''}`
      + `<div class="row"><button data-act="say" data-text="${esc(said)}">🔊</button>${hasEn ? '<button data-act="pen" title="Each line in English">EN</button>' : ''}</div><div class="sub">E to close</div>`;
    const shown = UI.card(html, { kind: 'rpoem', say: o.say ? said : undefined });
    const card = document.getElementById('card'), enB = card && card.querySelector('[data-act="pen"]');
    if (enB) enB.onclick = e => { e.stopPropagation(); card.classList.toggle('rp-en'); };
    return shown;
  }

  // ================================================================ checking what you type
  // ---------------- zh / ja: read through CJK (pinyin or characters, rōmaji, kana or kanji; tones and long vowels optional)
  const stripP = s => String(s || '').replace(/[\s。、，．,.！!？?：:；;「」『』“”"'‘’…~～〜·・()（）]/g, '');
  const hasHan = s => /[㐀-鿿]/.test(String(s || ''));
  // a phrase: right when its pinyin / rōmaji is (characters that only sound right, 同音字, pass as «close»)
  function phraseOkC(p, text, l) {
    const t = CJK.canon(text, l); if (!t) return { ok: false, empty: !String(text || '').trim() };
    const forms = [p[l]].concat((p.alt && p.alt[l]) || []).filter(Boolean), keys = forms.map(f => CJK.canon(f, l));
    if (keys.includes(t)) {
      const typed = hasHan(text) ? stripP(text) : '';
      return typed && !forms.some((f, k) => keys[k] === t && stripP(CJK.chars(f, { lang: l })) === typed) ? { ok: true, close: true } : { ok: true };
    }
    if (keys.some(k => (k.length >= 6 && lev(k, t) <= 1) || (k.length >= 14 && lev(k, t) <= 2))) return { ok: true, close: true };
    return { ok: false, close: keys.some(k => lev(k, t) <= 3) };
  }
  // asking out: zh 约会 / 交往 / 在一起 / 女朋友 / 男朋友, with me (跟我, 和我, 我们, 做我的…: «我跟但丁约会» isn't asking);
  // ja 付き合って (付き合おう…), デート, 恋人に…
  function isAskOutC(text, l) {
    if (phraseOkC(PH['ph.love.salir'], text, l).ok) return true;
    if (l === 'zh') return ['[约会|yuē huì]', '[交往|jiāo wǎng]', '[在一起|zài yī qǐ]', '[女朋友|nǚ péng you]', '[男朋友|nán péng you]'].some(w => saysC(text, w, l))
      && ['[跟|gēn] [我|wǒ]', '[和|hé] [我|wǒ]', '[同|tóng] [我|wǒ]', '[我们|wǒ men]', '[做|zuò] [我|wǒ]', '[当|dāng] [我|wǒ]', '[我|wǒ] [的|de]'].some(w => saysC(text, w, l));
    return /tsukia|deto|koibito|kanojoninat|kareshininat/.test(CJK.canon(text, l));
  }
  // the confession: zh 爱你 → 'amo', 喜欢你 → 'quiero'; ja 愛してる → 'amo', 大好き → 'quiero' (said with 不 / じゃない: neither)
  function whichLoveC(text, l) {
    if (l === 'zh') {
      if (['[不|bù] [爱|ài]', '[不|bù] [喜欢|xǐ huan]'].some(w => saysC(text, w, l))) return null;
      if (['[爱|ài] [你|nǐ]', '[爱上|ài shàng] [你|nǐ]', '[爱|ài] [着|zhe] [你|nǐ]', '[爱|ài] [您|nín]'].some(w => saysC(text, w, l))) return 'amo';
      return ['[喜欢|xǐ huan] [你|nǐ]', '[喜欢|xǐ huan] [上|shàng] [你|nǐ]', '[喜欢|xǐ huan] [您|nín]'].some(w => saysC(text, w, l)) ? 'quiero' : null;
    }
    const n = CJK.canon(text, l);
    if (/(suki|shite)(ja|jya|dewa|de wa)nai/.test(n)) return null;
    return /aishite/.test(n) ? 'amo' : /suki/.test(n) ? 'quiero' : null;     // (好きです, the textbook 告白, counts as much as 大好き)
  }
  // holding hands: zh 手 / 牵 with 可以 / 能 / 吗 / ？ (an ask) or 把手给我 / 牵我 (an order); ja 手 / つなぐ with 〜てもいい /
  // くれる / ？ (an ask) or 〜て(ください) / つなげ (an order)
  function judgeTouchC(text, l) {
    const q = /[?？]/.test(text);
    let hand, ask, order;
    if (l === 'zh') {
      hand = ['[手|shǒu]', '[牵|qiān]'].some(w => saysC(text, w, l));
      ask = q || ['[可以|kě yǐ]', '[能|néng]', '[吗|ma]', '[好不好|hǎo bù hǎo]', '[行不行|xíng bù xíng]', '[可不可以|kě bù kě yǐ]', '[能不能|néng bù néng]', '[愿意|yuàn yì]', '[介意|jiè yì]'].some(w => saysC(text, w, l));
      order = ['[把|bǎ] [手|shǒu] [给|gěi] [我|wǒ]', '[手|shǒu] [给|gěi] [我|wǒ]', '[给|gěi] [我|wǒ] [手|shǒu]', '[牵|qiān] [我|wǒ]', '[伸|shēn] [手|shǒu]', '[拉|lā] [我|wǒ]'].some(w => saysC(text, w, l));
    } else {
      const n = CJK.canon(text, l);
      hand = /手/.test(text) || /tsuna|nigi/.test(n);
      ask = q || /(mo|de|te)i(desuka|ka|no|kana)?$|idesuka|kure(ru|nai|masuka|masenka)|morae|masenka|ka(na)?$|dame/.test(n);
      order = /tsunaide(kudasai|yo|ne)?$|tsunage|tsunago$|dashite|nigitte|nigire/.test(n);
    }
    if (!hand) return ask ? 'nohand' : 'no';
    if (ask) return 'ask';
    return order ? 'order' : 'ask0';
  }
  // a compliment: zh 你很 + an adjective (a one-character one only after a degree word: 很美, 真酷); ja an adjective (+ です /
  // ね). The slip: zh «你是聪明» (an adjective takes 很, never 是; a noun takes 是: 你是好人), ja «優しいだ» (an い-adjective
  // never takes だ). The adjectives are notation, so the reactions show them in the mode.
  function judgeComplimentC(id, text, l) {
    const A = ADJ[id][l]; if (!A) return { kind: 'nostart' };
    const zh = l === 'zh', plainC = a => CJK.chars(a, { lang: l }).replace(/\s/g, '');
    const hasA = a => (zh && [...plainC(a)].length === 1 ? DEG_ZH.some(d => saysC(text, `${d} ${a}`, l)) : saysC(text, a, l));
    const iAdj = a => /い$/.test(plainC(a)) && !/^(きれい|綺麗)$/.test(plainC(a));
    const slipOf = a => (zh ? !NOUN_ZH.has(a) && ['[你|nǐ]', '[您|nín]'].some(y => saysC(text, `${y} [是|shì] ${a}`, l)) && !saysC(text, `${a} [的|de]`, l)
      : iAdj(a) && new RegExp(CJK.canon(a, l) + 'da(?!ro|ke)').test(CJK.canon(text, l)));
    for (const kind of ['love', 'meh', 'ok']) {
      const a = A[kind].find(hasA); if (!a) continue;
      if (!slipOf(a)) return { kind, adj: a };
      return zh ? { kind: 'slip', adj: `[你|nǐ] [是|shì] ${a}`, fix: `[你|nǐ] [很|hěn] ${a}`, good: kind } : { kind: 'slip', adj: `${a} だ`, fix: `${a} です`, good: kind };
    }
    const said = zh ? ['[你|nǐ]', '[您|nín]'].some(y => saysC(text, y, l)) : /(desu|da|ne|yo|na)$/.test(CJK.canon(text, l));
    return said ? { kind: 'odd', adj: '' } : { kind: 'nostart' };
  }
  // a gift: the thing, a verb (zh 带 / 送 / 给你; ja 持ってきた / あげる / どうぞ), and zh its measure word (一朵花, not 一个花
  // or 一花); ja を (花を持ってきた, not 花が持ってきた)
  function judgeGiftC(id, text, l) {
    const it = LEX.item(id) || {}, nouns = [it[l]].concat((it.alt && it.alt[l]) || []).filter(Boolean);
    const noun = nouns.find(f => saysC(text, f, l)), verb = (GIFT_VERB[l] || []).some(v => saysC(text, v, l));
    if (!noun) return { noun: false, verb };
    if (l === 'zh') {
      const ok = (CL_OK_ZH[id] || [clZh(id), '[个|gè]']).concat('[些|xiē]'), fix = withArticle(id, l), used = MW_ZH.find(m => saysC(text, `${m} ${noun}`, l));
      if (used) return { noun: true, verb, artOk: ok.some(c => CJK.canon(c, l) === CJK.canon(used, l)), fix };
      if (NUMDET_ZH.some(d => saysC(text, `${d} ${noun}`, l))) return { noun: true, verb, artOk: false, fix };
      return { noun: true, verb, artOk: true, fix: null };
    }
    const bad = ['[持|も]って', 'あげ'].some(v => saysC(text, `${noun} が ${v}`, l));
    return { noun: true, verb, artOk: !bad, fix: bad ? `${noun} を [持|も]って きた よ` : null };
  }
  // the bell's count: a number word (zh 七, 七下; ja 七, 七回, ななかい, はっかい…), never digits
  function judgeCountC(text, N, l) {
    if (/[0-9０-９]/.test(text)) return { digits: true };
    const n = CJK.canon(text, l); if (!n) return { empty: true };
    for (let k = 20; k >= 1; k--) if (LEX.item('n.' + k) && LEX.heard('n.' + k, text)) return { n: k, ok: k === N };     // (17 before 7)
    if (l === 'ja') for (const [k, forms] of Object.entries(COUNT_JA)) if (forms.some(f => n.includes(CJK.canon(f, l)))) return { n: +k, ok: +k === N };
    return { n: null };
  }
  function phraseOk(id, text) {
    if (isC() && PH[id]) return phraseOkC(PH[id], text, lang());
    const p = PH[id], l = lang(), t = canon(text); if (!p || !t) return { ok: false, empty: !t };
    const forms = [p[l]].concat((p.alt && p.alt[l]) || []).map(f => canon(f)), tt = t.replace(/ /g, '');
    if (forms.includes(t) || forms.some(f => f.replace(/ /g, '') === tt)) return { ok: true };
    if (forms.some(f => (f.length >= 6 && lev(f, t) <= 1) || (f.length >= 14 && lev(f, t) <= 2))) return { ok: true, close: true };
    return { ok: false, close: forms.some(f => lev(f, t) <= 3) };
  }
  // asking someone out (any natural way of saying it)
  function isAskOut(text) {
    if (isC()) return isAskOutC(text, lang());
    const n = canon(text), l = lang();
    if (phraseOk('ph.love.salir', text).ok) return true;
    if (l === 'es') return /\bsalir\b.*\bconmigo\b/.test(n) || /\b(sales|saldrias) conmigo\b/.test(n) || /\bser mi (novia|novio|pareja)\b/.test(n) || /\buna cita conmigo\b/.test(n);
    if (l === 'pt') return /\b(sair|sairia) comigo\b/.test(n) || /\bnamorar comigo\b/.test(n) || /\bquer namorar\b/.test(n) || /\bser (a )?minha namorada\b|\bser (o )?meu namorado\b/.test(n) || /\bencontro comigo\b/.test(n);
    return /\bmit mir\b.*\b(ausgehen|ausgehn|auszugehen|weggehen|gehen|aus)\b/.test(n) || /\bdate mit mir\b|\bmit mir ein date\b/.test(n) || /\b(meine freundin|mein freund) sein\b/.test(n);
  }
  // the confession: which one did you say? 'quiero' (te quiero / gosto muito de você / ich hab dich lieb), 'amo', or null
  function whichLove(text) {
    if (isC()) return whichLoveC(text, lang());
    const n = canon(text), l = lang();
    if (l === 'es') return /\bte amo\b/.test(n) ? 'amo' : /\bte quiero\b/.test(n) ? 'quiero' : null;
    if (l === 'pt') return /\b(te amo|amo voce|amo vc|eu te amo)\b/.test(n) ? 'amo' : /\bgosto (muito |tanto |demais )*de (voce|vc|ti)\b|\bte adoro\b/.test(n) ? 'quiero' : null;
    return /\bliebe dich\b/.test(n) ? 'amo' : /\bhab(e)? dich\b.*\b(lieb|gern|gerne)\b/.test(n) ? 'quiero' : null;
  }
  // holding hands: did you ask (permission), or order? 'ask' | 'order' | 'nohand' | 'no'
  function judgeTouch(text) {
    if (isC()) return judgeTouchC(text, lang());
    const n = canon(text), l = lang();
    const hand = l === 'es' ? /\bmano(s)?\b/ : l === 'pt' ? /\bmao(s)?\b/ : /\b(hand|hande|handchen)\b/;
    const ask = l === 'es' ? /\b(puedo|podria|puedes|podemos|me dejas|me permites|me das|se puede|quieres|quisieras|te importa|te molesta)\b/ : l === 'pt' ? /\b(posso|pode|poderia|podemos|deixa|quer|me permite|tudo bem se)\b/ : /\b(darf|kann|konnte|durfte|willst|mochtest|wurdest|wollen wir|sollen wir|ist es okay|ok wenn|okay wenn)\b/;
    const order = l === 'es' ? /\b(dame|toma|agarra|tomame)\b/ : l === 'pt' ? /\b(me da|da a|segura|pega|me de)\b/ : /\b(gib|nimm|halt)\b/;
    const bossy = l === 'es' ? /^(dame|toma|agarra|tomame)\b/ : l === 'de' ? /^(gib|nimm|halt)\b/ : null;      // (an order with a «?» on it is still an order)
    if (!hand.test(n)) return ask.test(n) ? 'nohand' : 'no';
    if (ask.test(n)) return 'ask';
    if (/\?/.test(text) && !(bossy && bossy.test(n))) return 'ask';        // «¿Te tomo la mano?», «Vamos dar as mãos?», «Me dá a mão?»: canon() drops the «?», so look at what was typed
    return order.test(n) ? 'order' : 'ask0';
  }
  // a compliment: «Eres …» / «Você é …» / «Du bist …» + an adjective → { kind: 'love'|'ok'|'meh'|'slip'|'odd'|'nostart', adj, fix }
  function judgeCompliment(id, text) {
    if (isC()) return judgeComplimentC(id, text, lang());
    const n = canon(text), l = lang(), A = ADJ[id][l];
    const start = l === 'es' ? /\b(eres|sos|tu eres)\b/ : l === 'pt' ? /\b(voce e|vc e|tu es|tu e|voce eh)\b/ : /\b(du bist|bist du)\b/;
    if (!start.test(n)) return { kind: 'nostart' };
    // the words after the verb, or (nothing after it: «¡Qué inteligente eres!», «Wie klug du bist!») the ones before it
    const parts = n.split(start), after = parts[parts.length - 1].trim() || parts[0].trim();
    const words = after.split(' ').filter(w => w && !['muy', 'tan', 'muito', 'tao', 'bem', 'sehr', 'so', 'echt', 'total', 'ganz', 'mega', 'una', 'un', 'uma', 'um', 'ein', 'eine', 'einer', 'der', 'die', 'la', 'el', 'a', 'o', 'mas', 'mais', 'la mas', 'que', 'como', 'wie'].includes(w));
    // «una persona muy generosa», «uma pessoa engraçada», «buena gente»: the adjective goes with the noun, not with them
    const withNoun = words.some(w => ['persona', 'pessoa', 'gente'].includes(w));
    const phrase = words.join(' ');
    const has = list => list.find(a => (' ' + phrase + ' ').includes(' ' + a + ' ') || words.some(w => w === a || (l === 'de' && w.startsWith(a) && w.length <= a.length + 2)));
    let a;
    if ((a = has(A.love))) return { kind: 'love', adj: a };
    if ((a = has(A.meh))) return { kind: 'meh', adj: a };
    if (!withNoun && (a = Object.keys(A.slip).find(k => words.includes(k)))) return { kind: 'slip', adj: a, fix: A.slip[a], good: A.meh.includes(A.slip[a]) ? 'meh' : A.love.includes(A.slip[a]) ? 'love' : 'ok' };
    if (withNoun && (a = Object.keys(A.slip).find(k => words.includes(k)))) { const fx = A.slip[a]; return { kind: A.meh.includes(fx) ? 'meh' : A.love.includes(fx) ? 'love' : 'ok', adj: fx }; }     // (their reaction echoes it about themselves: «¿Generoso, yo?»)
    if ((a = has(A.ok))) return { kind: 'ok', adj: a };
    return { kind: 'odd', adj: words[0] || '' };
  }
  // a gift: «Te traje una manzana» / «Eu trouxe uma maçã pra você» / «Ich hab dir einen Apfel mitgebracht»
  function judgeGift(id, text) {
    if (isC()) return judgeGiftC(id, text, lang());
    const n = canon(text), l = lang(), it = LEX.item(id) || {}, g = it.g && it.g[l];
    const nouns = [it[l]].concat((it.alt && it.alt[l]) || [], it.pl ? [it.pl[l]] : []).filter(Boolean).map(w => canon(w));
    const words = n.split(' ');
    let at = -1, len = 1, hitF = null;
    for (const fuzzy of [false, true]) {          // (exact forms first, so «Bonbons» is the plural, not a typo of «Bonbon»)
      for (const f of nouns) { const fw = f.split(' '); for (let i = 0; i + fw.length <= words.length; i++) if (fw.every((w, k) => words[i + k] === w || (fuzzy && w.length > 4 && lev(words[i + k], w) <= 1))) { at = i; len = fw.length; hitF = f; break; } if (at >= 0) break; }
      if (at >= 0) break;
    }
    const verb = l === 'es' ? /\b(traje|traigo|regalo|compre|tengo algo|es para ti|para ti)\b/.test(n) : l === 'pt' ? /\b(trouxe|trago|presente|comprei|e pra voce|pra voce|para voce|pra vc)\b/.test(n) : /\b(mitgebracht|mitbringen|bringe|schenke|geschenk|fur dich)\b/.test(n);
    if (at < 0) return { noun: false, verb };
    const art = words[at - 1] || '', mass = MASS[l].includes(id);
    let artOk = true, fix = null;
    // the plural («Te traje flores», «Ich hab dir Bonbons mitgebracht»): no article needed, just not a singular one
    const pl = it.pl && it.pl[l];
    if (pl && hitF === canon(pl) && hitF !== canon(it[l])) {
      if (['un', 'una', 'um', 'uma', 'ein', 'eine', 'einen'].includes(art)) { artOk = false; fix = (l === 'es' ? (g === 'f' ? 'unas ' : 'unos ') : l === 'pt' ? (g === 'f' ? 'umas ' : 'uns ') : '') + pl; }
      return { noun: true, verb, artOk, fix };
    }
    if (l === 'es') { const want = g === 'f' ? ['una', 'la', 'esta', 'esa', 'tu'] : ['un', 'el', 'este', 'ese', 'tu']; if (['un', 'una', 'el', 'la'].includes(art) && !want.includes(art)) { artOk = false; fix = (g === 'f' ? 'una ' : 'un ') + it[l]; } }
    else if (l === 'pt') { const want = g === 'f' ? ['uma', 'a', 'essa', 'esta'] : ['um', 'o', 'esse', 'este']; if (['um', 'uma', 'o', 'a'].includes(art) && !want.includes(art)) { artOk = false; fix = (g === 'f' ? 'uma ' : 'um ') + it[l]; } }
    else { const W = { m: ['einen', 'den', 'deinen', 'diesen'], f: ['eine', 'die', 'deine', 'diese'], n: ['ein', 'das', 'dein', 'dieses'] };
      const want = (W[g] || []).concat(id === 'w.candy' || id === 'w.gum' ? W.n : []);        // (der or das Bonbon / Kaugummi: both are fine)
      if (['ein', 'eine', 'einen', 'einem', 'der', 'die', 'das', 'den', 'dem'].includes(art) && !want.includes(art)) { artOk = false; fix = ({ m: 'einen ', f: 'eine ', n: 'ein ' }[g] || '') + it[l]; } }
    if (!['un', 'una', 'el', 'la', 'um', 'uma', 'o', 'a', 'ein', 'eine', 'einen', 'der', 'die', 'das', 'den', 'esta', 'este', 'esa', 'ese', 'tu', 'essa', 'esse', 'deinen', 'deine', 'dein', 'diesen', 'diese', 'dieses'].includes(art) && !mass) { artOk = false; fix = withArticle(id); }
    return { noun: true, verb, artOk, fix };
  }
  // a number word (the bell count)
  function judgeCount(text, N) {
    if (isC()) return judgeCountC(text, N, lang());
    if (/\d/.test(text)) return { digits: true };
    const n = canon(text); if (!n) return { empty: true };
    const words = n.split(' ');
    for (let k = 1; k <= 20; k++) if (LEX.item('n.' + k) && words.some(w => LEX.check('n.' + k, w).ok)) return { n: k, ok: k === N };
    if (lang() === 'de' && words.includes('zwo')) return { n: 2, ok: N === 2 };
    return { n: null };
  }

  // ================================================================ the language side: phrases you've said, hearts
  function teachPhrase(id, clean = true) {
    const p = PH[id]; if (!p) return;
    const was = LEX.taught(id);
    LEX.expose(id); LEX.attempt(id, { ok: true, hints: clean ? 0 : 1, ms: 3500, mode: was ? 'review' : 'echo' });
    if (!was) UI.toast(`New phrase: «${PL(p[lang()])}» (${p.en}) · in your Phrasebook`);
  }
  // a box to say a phrase (its model shows on "I don't know"); keeps asking until it's right, or Esc. (zh / ja: the model is
  // notation; the title shows it in the mode, the box's placeholder in pinyin / rōmaji, what you type; the characters you
  // got right count toward knowing them)
  async function phraseBox(id, o = {}) {
    const p = PH[id], l = lang(), model = p[l], show = PL(model), typeAs = isC() ? RO(model) : model;
    for (let tries = 0; ; tries++) {
      const r = await UI.command({ name: o.name || 'You', icon: o.icon || 'heart', title: o.title || `Say it: «${show}»`, verbs: [], placeholder: o.placeholder || (tries ? typeAs : (o.hide ? '…' : typeAs)),
        hint: o.hint || `«${show}» = ${p.en}`, model, modelEn: p.en });
      if (!r || r.cancelled) return { cancelled: true };
      const ok = o.check ? (o.check(r.text) ? { ok: true } : phraseOk(id, r.text)) : phraseOk(id, r.text);
      if (ok.ok) {
        if (isC()) CJK.used(r.text, model, { lang: l });
        teachPhrase(id, tries === 0 && !ok.close); if (ok.close) UI.toast(`Close enough! It’s «${show}»`); else Sound.play('review'); return { ok: true, text: r.text, tries };
      }
      Sound.play('wrong'); UI.toast(ok.close ? `Almost! «${show}»` : `Try: «${show}» (${p.en})`);
    }
  }
  const GATES = [null, { hearts: 0 }, { hearts: 2 }, { hearts: 5, flag: 'boss' }, { hearts: 8, flag: 'ciro' }, { hearts: 11, flag: 'bell' }];
  const flagOk = f => { const F = G.state.flags; return f === 'boss' ? !!F.boss : f === 'ciro' ? !!F.ciro : f === 'bell' ? !!(F.millFree || (F.bells || 0) >= 1) : true; };
  const FLAG_TEXT = { boss: 'free the gray hill east of Alba', ciro: 'meet Ciro, the clockmaker in Molinar', bell: 'ring the first bell' };
  const roleOf = id => { const st = S(); return st.partner === id ? 'partner' : st.rival === id ? 'rival' : st.switchTo === id && st.partner ? 'pending' : 'friend'; };
  function rankReady(id) {
    const p = PS(id), next = p.rank + 1, g = GATES[next], st = S();
    if (!p.met || !g || next > 5 || next < 2) return false;
    if (next >= 3 && st.partner !== id) return false;          // (the deeper ranks are for the person you're dating)
    if (st.rival === id || roleOf(id) === 'pending') return false;
    return p.hearts >= g.hearts && flagOk(g.flag);
  }
  const canAskOut = id => { const st = S(), p = PS(id); return !st.partner && st.rival !== id && p.met && (p.rank >= 2 || st.switchTo === id); };
  const crackReady = id => { const p = PS(id); return roleOf(id) === 'rival' && p.respect >= 3 && !p.crackOn; };
  const wantsTalk = id => { const p = PS(id); return !!G && G.state.flags.rosa && p.met && (rankReady(id) || crackReady(id) || (roleOf(id) === 'rival' && !p.rivalIntro)); };
  function addHearts(id, n, note) {
    const p = PS(id); if (n <= 0) { if (note) UI.toast(`${NAME[id]}: ${note}`); G.save(); return; }
    p.hearts = Math.min(16, p.hearts + n);
    Sound.play(n >= 2 ? 'chest' : 'review');
    popHeart(id);
    const next = GATES[p.rank + 1], need = next ? `${p.hearts}/${next.hearts}` : `${p.hearts}`;
    const flag = next && next.flag && !flagOk(next.flag) && p.hearts >= next.hearts ? ` · rank ${p.rank + 1} also needs you to ${FLAG_TEXT[next.flag]}` : '';
    UI.toast(`${'♥'.repeat(n)} ${NAME[id]} ♥ ${need}${note ? ' · ' + note : ''}${flag}`);
    G.save();
  }
  function popHeart(id) { const st = stOf(id), y = st.y + (st.pose === 'sit' ? 1.5 : 2.0); sprites.pop.position.set(st.x, y, st.z); sprites.popT = 1.2; sprites.pop.visible = true; G.w3d.fx.sparkle(st.x, y - 0.2, st.z, 8, ['#ff8fb1', '#ffd84a']); }
  function heartsLabel(id) {
    const p = PS(id), role = roleOf(id), next = GATES[p.rank + 1];
    if (role === 'rival') return `rival · respect ${Math.min(3, p.respect)}/3`;
    const h = next && p.rank < 5 ? `♥ ${p.hearts}/${next.hearts}` : `♥ ${p.hearts}`;
    return `${h} · rank ${Math.max(1, p.rank)}${role === 'partner' ? ' · dating' : ''}`;
  }
  // ================================================================ scenes: helpers
  const DATE_COOL = 180, DUEL_COOL = 90;
  // a scene: your controls held, the camera and Mimo given back at the end, whatever happens
  async function scene(fn) {
    sceneOn = true; lock(true);
    try { return await fn(); } finally { sceneOn = false; lock(false); G.cam.override = null; G.sim.mimoGo(null, null); hold = null; }
  }
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; if (yaw !== undefined) Y.yaw = yaw; Y.vx = Y.vz = 0; M.x = x + 1.0; M.z = z + 0.8; M.hidden = false; G.sim.snap();
  }
  function snapCam(yaw, pitch, dist) { G.cam.snap(yaw, pitch, dist); G.cam.back = 0; G.cam._look = null; }
  const shot = (px, py, pz, lx, ly, lz, dur) => { G.cam.override = { pos: V3(px, py, pz), look: V3(lx, ly, lz), dur }; };      // (dur 0.001: a cut, for behind a fade)
  // a two-shot: from the side of whoever's talking, looking at them and past them toward you
  function faceShot(id) {
    const st = stOf(id), Y = G.sim.you, dx = Y.x - st.x, dz = Y.z - st.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    const y = st.y + (st.pose === 'sit' ? 1.0 : 1.35);
    shot(st.x + ux * 3.4 + px * 1.6, y + 0.9, st.z + uz * 3.4 + pz * 1.6, st.x + ux * 0.4, y, st.z + uz * 0.4);
  }
  let bellKick = 0;
  function ringBell() { bellKick = 1; Sound.play('bell'); clang(0.5); }
  // stand two people side by side (you on their left: their left hand in your right), facing yaw f
  function sideBySide(id, x, z, f, gap) {
    const st = stOf(id), Lx = Math.cos(f), Lz = -Math.sin(f);
    st.x = x - Lx * gap / 2; st.z = z - Lz * gap / 2; st.yaw = f; st.y = WORLD.groundAt(st.x, st.z, st.y + 1);
    teleport(x + Lx * gap / 2, z + Lz * gap / 2, f);
    G.sim.mimoGo({ x: x + Lx * (gap / 2 + 1.1) + Math.sin(f) * 0.6, z: z + Lz * (gap / 2 + 1.1) + Math.cos(f) * 0.6 }, { x: st.x, z: st.z });
  }
  // the hand-in-hand moment: Morgana by her round window, Dante in front of his forge
  async function handMoment(id) {
    const st = stOf(id), keep = { x: st.x, z: st.z, yaw: st.yaw, pose: st.pose, y: st.y }, Y = G.sim.you, back = { x: Y.x, z: Y.z, yaw: Y.yaw };
    await UI.fade(1, 350);
    if (id === 'morgana' && inside) { sideBySide(id, ATTIC.x, ATTIC.z - 2.45, Math.PI, 0.86); shot(ATTIC.x + 0.4, AY + 1.95, ATTIC.z + 0.9, ATTIC.x, AY + 1.75, ATTIC.z - 4, 0.001); }
    else { const f = id === 'dante' ? 0 : st.yaw, x = id === 'dante' ? -30.9 : st.x, z = id === 'dante' ? -164.1 : st.z; sideBySide(id, x, z, f, id === 'dante' ? 1.12 : 0.86); shot(x + Math.sin(f) * 3.6, st.y + 1.7, z + Math.cos(f) * 3.6, x, st.y + 1.15, z, 0.001); }      // (Dante's gap: his shoulders are broad)
    st.pose = 'hold'; hold = { kind: 'hold', id };
    await UI.fade(0, 400);
    Sound.play('review');
    for (let i = 0; i < 3; i++) { await wait(0.9); G.w3d.fx.sparkle(st.x + Math.cos(st.yaw) * 0.45, st.y + 1.2, st.z - Math.sin(st.yaw) * 0.45, 5, ['#ff8fb1', '#ffd84a']); }
    await wait(0.6);
    await UI.fade(1, 350);
    hold = null; Object.assign(st, keep); teleport(back.x, back.z, back.yaw); G.sim.mimoGo(null, null);
    G.cam.override = null; G.cam.back = 0;
    await UI.fade(0, 350);
  }
  // a hug (Dante, at the end): out in front of his forge (behind his anvil there's no room), face to face, seen
  // from the side; then back to the forge, him behind the anvil and you in front of it
  async function hug(id) {
    const st = stOf(id), cx = -30.9, cz = -164.1, gap = 0.74;
    await UI.fade(1, 300);
    st.x = cx - gap / 2; st.z = cz; st.yaw = HALF; st.y = WORLD.groundAt(st.x, st.z, st.y + 1);
    teleport(cx + gap / 2, cz, -HALF);
    G.sim.mimoGo({ x: cx + 1.6, z: cz + 1.1 }, { x: cx, z: cz });
    G.cam.override = { pos: V3(cx + 0.3, st.y + 1.75, cz + 3.7), look: V3(cx, st.y + 1.15, cz), dur: 0.001 };
    st.pose = 'hug'; hold = { kind: 'hug', id };
    await UI.fade(0, 350);
    Sound.play('review'); await wait(0.4);
    for (let i = 0; i < 3; i++) { await wait(0.6); popHeart(id); }
    await wait(0.5);
    await UI.fade(1, 300);
    hold = null; st.pose = 'stand';
    st.x = FORGE.dante.x; st.z = FORGE.dante.z; st.y = GY; st.yaw = 0;
    teleport(FORGE.talk.x, FORGE.talk.z, Math.PI);
    G.sim.mimoGo(null, null); G.cam.override = null; G.cam.back = 0;
    await UI.fade(0, 350);
  }
  // a kiss on the cheek (Morgana, at the end): you're right in front of her, she leans in, quick, and pretends it
  // didn't happen (seen from the side)
  async function kiss(id) {
    const st = stOf(id), Y = G.sim.you, f0 = Math.atan2(Y.x - st.x, Y.z - st.z);
    await UI.fade(1, 250);
    teleport(st.x + Math.sin(f0) * 0.82, st.z + Math.cos(f0) * 0.82, f0 + Math.PI);
    const f = Math.atan2(Y.x - st.x, Y.z - st.z), x0 = st.x, z0 = st.z, sx = Math.cos(f), sz = -Math.sin(f);
    st.yaw = f; st.pose = 'stand';
    G.cam.override = { pos: V3(x0 + Math.sin(f) * 0.41 + sx * 3.3, st.y + 1.55, z0 + Math.cos(f) * 0.41 + sz * 3.3), look: V3(x0 + Math.sin(f) * 0.41, st.y + 1.15, z0 + Math.cos(f) * 0.41), dur: 0.001 };
    await UI.fade(0, 300);
    await wait(0.35);
    await tween(0.5, k => { const e = Math.sin(k * Math.PI); st.x = x0 + Math.sin(f) * 0.24 * e; st.z = z0 + Math.cos(f) * 0.24 * e; st.lean = 0.16 * e; });
    st.x = x0; st.z = z0; st.lean = 0; popHeart(id); Sound.play('pip'); G.sim.mimo.happy = 1.5;
    await wait(0.6);
  }

  // ================================================================ talking to them
  async function talkTo(id) {
    const p = PS(id), P = api(id), st = S();
    if (id === 'dante' && !G.state.flags.rosa) return speak(P, 'd.before');
    if (!p.met) { if (id === 'dante') return scene(meetDante); return null; }
    return scene(async () => {
      const role = roleOf(id);
      stOf(id).look = { x: G.sim.you.x, z: G.sim.you.z };
      if (role === 'rival' && !p.rivalIntro) return rivalIntro(id);
      if (role === 'pending') return speak(P, id === 'morgana' ? 'm.wait' : 'd.wait');
      const ready = rankReady(id) || crackReady(id), opts = [];
      opts.push({ label: ready ? 'Talk ♥' : 'Talk', sub: ready ? `something’s on ${his(id)} mind` : '', value: 'talk' });
      if (role === 'partner' || role === 'friend') {
        const cd = DATE_COOL - (now() - p.dateAt);
        opts.push({ label: role === 'partner' ? 'Date ♥' : 'Hang out ♥', value: 'date',
          sub: cd > 0 ? `again in about ${Math.max(1, Math.ceil(cd / 60))} min` : 'words · time together · a gift · a favor' + (p.rank >= 3 && role === 'partner' ? ' · holding hands' : '') });
      }
      if (role === 'rival') {
        const cd = DUEL_COOL - (now() - p.duelAt);
        opts.push({ label: 'Banter duel ⚔', value: 'duel', sub: cd > 0 ? `${cap(she(id))} needs a breather: about ${Math.max(1, Math.ceil(cd / 60))} min` : `three rounds of comebacks · respect ${Math.min(3, p.respect)}/3` });
        if (p.crackOn && st.switchTo !== id) opts.push({ label: `Ask ${her(id)} out`, sub: `you’d have to talk to ${NAME[st.partner]} first`, value: 'crackask' });
      }
      if (canAskOut(id)) opts.push({ label: `Ask ${her(id)} out ♥`, sub: st.switchTo === id ? `${NAME[id]} is waiting` : '', value: 'ask' });
      if (role === 'partner' && st.switchTo && st.switchTo !== id) opts.push({ label: 'We need to talk…', sub: 'a kind breakup', value: 'breakup' });
      const v = await UI.choose(`${NAME[id]} · ${heartsLabel(id)}`, opts);
      if (v === 'talk') await talkScene(id);
      else if (v === 'date') await dateMenu(id);
      else if (v === 'duel') { if (DUEL_COOL - (now() - p.duelAt) > 0) { UI.toast(`${NAME[id]} needs a breather. Try again in a minute.`); } else await duel(id, false); }
      else if (v === 'ask') await askOut(id, st.switchTo === id);
      else if (v === 'crackask') { await speak(P, (id === 'morgana' ? 'mr' : 'dr') + '.crack.ask'); st.switchTo = id; UI.toast(`Talk to ${NAME[st.partner]} first. Kindly.`); G.save(); }
      else if (v === 'breakup') await breakup(id);
      stOf(id).look = null;
    });
  }
  async function talkScene(id) {
    const p = PS(id), P = api(id), pre = id === 'morgana' ? 'm' : 'd', role = roleOf(id);
    if (role === 'rival') return crackReady(id) ? crackScene(id) : speak(P, pre + 'r.chat');
    if (rankReady(id)) return rankScene(id, p.rank + 1);
    const g = GATES[p.rank + 1];
    if (g && p.rank >= 2 && S().partner === id && p.hearts >= g.hearts && !flagOk(g.flag)) return speak(P, `${pre}.gate.${g.flag}`);
    const pool = p.rank >= 5 ? ['chat.5', 'chat.1', 'chat.2', 'chat.3'] : S().partner === id ? ['chat.4', 'chat.1', 'chat.2', 'chat.3'] : ['chat.1', 'chat.2', 'chat.3'];
    p.chatI = ((p.chatI || 0) + 1) % pool.length;
    return speak(P, `${pre}.${pool[p.chatI]}`);
  }
  async function rivalIntro(id, inline) {           // (inline: inside the meeting's chapter, so no card of its own)
    const P = api(id), pre = id === 'morgana' ? 'm' : 'd';
    if (!inline) await episode('rival');
    await speak(P, pre + '.r2.rival1'); await speak(P, pre + '.r2.rival2'); await speak(P, pre + '.tn.rival');
    PS(id).rivalIntro = true; S().rivalAt = now(); G.save();
    UI.toast(`${NAME[id]} is your rival now: win banter duels to earn ${his(id)} respect.`);
    if (!inline) await continuara();
  }

  // ================================================================ meeting them, and the ranks
  async function meetDante() {
    const p = PS('dante'), P = DANTE;
    await episode('d.meet');
    DS.pose = 'stand'; DS.sing = false; DS.yaw = Math.atan2(G.sim.you.x - DS.x, G.sim.you.z - DS.z);
    shot(DS.x + 2.2, GY + 2.2, DS.z + 4.6, DS.x, GY + 1.45, DS.z); hum(0.8);
    await speak(P, 'd.meet.1');
    faceShot('dante');
    await speak(P, 'd.meet.2'); await speak(P, 'd.meet.3'); await speak(P, 'd.meet.4');
    await STORY.you(YOU.bigjob);
    await speak(P, 'd.meet.5'); await speak(P, 'd.meet.6'); await speak(P, 'd.meet.7');
    p.met = true; p.rank = Math.max(p.rank, 1); G.save();
    const r = await phraseBox('ph.love.caesbien', { name: 'Dante', title: `Dante says «${phS('ph.love.caesbien').replace(/[.。]$/, '')}». Say it back to him!` });
    await speak(P, r.ok ? 'd.meet.8' : 'd.meet.skip');
    if (S().partner === 'morgana') { await rivalIntro('dante', true); }
    await continuara();
    DS.pose = 'work'; G.save();
  }
  async function meetMorgana() {
    const p = PS('morgana'), P = MORGANA;
    await episode('m.meet');
    shot(ATTIC.x - 2.6, AY + 2.3, ATTIC.z - 0.4, SEAT.x, AY + 1.0, SEAT.z);
    await wait(0.8);
    await speak(P, 'm.meet.1');
    MS.look = { x: G.sim.you.x, z: G.sim.you.z };
    await speak(P, 'm.meet.2');
    await STORY.you(YOU.poems);
    faceShot('morgana');
    await speak(P, 'm.meet.3'); await speak(P, 'm.meet.4'); await speak(P, 'm.meet.5');
    await STORY.you(YOU.hush);
    await speak(P, 'm.meet.6'); await speak(P, 'm.meet.7'); await speak(P, 'm.meet.8');
    p.met = true; p.rank = Math.max(p.rank, 1); G.save();
    const r = await phraseBox('ph.love.caesbien', { name: 'Morgana', title: `Say it back to her: «${phS('ph.love.caesbien')}»` });
    await speak(P, r.ok ? 'm.meet.9' : 'm.meet.skip');
    if (S().partner === 'dante') await rivalIntro('morgana', true);
    await continuara();
    MS.look = null; G.save();
  }
  async function rankScene(id, r) {
    const p = PS(id); let ok = true;
    if (r === 2) return rank2(id);
    if (r === 3) await rank3(id);
    else if (r === 4) ok = id === 'morgana' ? await rank4Morgana() : await rank4Dante();
    else if (r === 5) ok = id === 'morgana' ? await rank5Morgana() : await rank5Dante();
    if (!ok) { G.save(); return; }
    p.rank = r; Sound.play('fanfare');
    UI.toast(`${NAME[id]} · rank ${r}${r === 3 ? ' · new date: holding hands (ask first!)' : r === 5 ? ' ♥ ♥ ♥' : ''}`);
    G.save();
  }
  async function rank2(id) {
    const P = api(id), pre = id === 'morgana' ? 'm' : 'd', p = PS(id);
    await episode(pre + '.r2');
    faceShot(id);
    for (const k of ['r2.1', 'r2.2', 'r2.3']) await speak(P, pre + '.' + k);
    await STORY.you(id === 'morgana' ? YOU.why : YOU.whynot);
    for (const k of ['r2.4', 'r2.5', 'r2.6']) await speak(P, pre + '.' + k);
    p.rank = Math.max(p.rank, 2); G.save();
    const g = await phraseBox('ph.love.gustas', { name: NAME[id], title: `Tell ${her(id)}: «${phS('ph.love.gustas')}»` });
    if (g.ok) await speak(P, pre + '.r2.7');
    await askOut(id, false);
    await continuara();
  }
  // asking them out (rank 2, or after a switch): you start dating, and the other one becomes your rival
  async function askOut(id, switching) {
    const P = api(id), pre = id === 'morgana' ? 'm' : 'd', p = PS(id), st = S();
    if (switching) { await episode('switch'); faceShot(id); }
    const r = await phraseBox('ph.love.salir', { name: NAME[id], title: `Ask ${her(id)} out: «${phS('ph.love.salir')}»`, check: isAskOut });
    if (!r.ok) { await speak(P, pre + '.r2.no'); return false; }
    await speak(P, switching ? pre + '.switch.yes' : pre + '.r2.yes');
    const o = other(id), po = PS(o);
    st.partner = id; st.rival = o; st.switchTo = null;
    p.rank = Math.max(p.rank, 2); p.hearts = Math.max(p.hearts, 2); p.crackOn = false;
    po.respect = 0; po.crackOn = false; if (!switching) po.rivalIntro = false;
    popHeart(id); Sound.play('fanfare');
    UI.toast(`You’re dating ${NAME[id]} ♥` + (po.met ? ` · ${NAME[o]} is your rival now` : ''));
    G.save();
    if (switching) await continuara();
    return true;
  }
  async function rank3(id) {
    const P = api(id), pre = id === 'morgana' ? 'm' : 'd';
    await episode(pre + '.r3');
    faceShot(id);
    const keys = id === 'morgana' ? ['r3.1', 'r3.2', 'r3.3', 'r3.4', 'r3.5', 'r3.6'] : ['r3.1', 'r3.2', 'r3.3', 'r3.4', 'r3.5'];
    for (const k of keys) await speak(P, pre + '.' + k);
    await continuara();
  }
  async function rank4Morgana() {
    const P = MORGANA, l = lang();
    await episode('m.r4');
    faceShot('morgana');
    for (const k of ['r4.1', 'r4.2', 'r4.3', 'r4.4', 'r4.5']) await speak(P, 'm.' + k);
    await poemCard(GRAN_POEM, { tag: 'Her grandmother’s favorite poem' });
    const model = GRAN_POEM[l].join(' '), en = (GRAN_POEM['en_' + l] || GRAN_POEM.en).join(' ');
    for (;;) {
      const r = await UI.command({ name: 'Morgana', icon: 'poem', title: 'Read it to her, out loud: type the poem', verbs: [], placeholder: isC() ? RO(model) : model, hint: en, model, modelEn: en });
      if (!r || r.cancelled) { await speak(P, 'm.r4.skip'); return false; }
      if (similar(r.text, model) >= 0.6) { if (isC()) CJK.used(r.text, model, { lang: l }); break; }
      Sound.play('wrong'); UI.toast(`Slowly: «${PL(model)}»`);
    }
    Sound.play('review'); G.sim.mimo.happy = 1.2;
    await speak(P, 'm.r4.6'); await speak(P, 'm.r4.7');
    await continuara();
    return true;
  }
  async function rank4Dante() {
    const P = DANTE, l = lang();
    await episode('d.r4');
    DS.pose = 'stand'; faceShot('dante');
    for (const k of ['r4.1', 'r4.2', 'r4.3', 'r4.4', 'r4.5']) await speak(P, 'd.' + k);
    DS.pose = 'sing'; DS.sing = true; hum(0.8, true);
    const model = D_SONG[l].slice(0, 2).join(' '), en = (D_SONG['en_' + l] || D_SONG.en).slice(0, 2).join(' ');
    await speak(P, { en: '♪ ' + en + ' ♪', [l]: '♪ ' + model + ' ♪' }, undefined, true);     // (sung in the language: you write down what you heard)
    DS.sing = false; DS.pose = 'stand';
    for (;;) {
      const r = await UI.command({ name: 'Dante', icon: 'quill', title: 'Write down what he sang', verbs: [], placeholder: isC() ? RO(model) : model, hint: en, model, modelEn: en });
      if (!r || r.cancelled) { await speak(P, 'd.r4.skip'); DS.pose = 'work'; return false; }
      if (similar(r.text, model) >= 0.6) { if (isC()) CJK.used(r.text, model, { lang: l }); break; }
      Sound.play('wrong'); UI.toast(`«${PL(model)}»`);
    }
    Sound.play('review');
    await speak(P, 'd.r4.6'); await speak(P, 'd.r4.7');
    await continuara();
    DS.pose = 'work';
    return true;
  }
  // the confession: choose how to say it; «te amo» too soon gets a funny, kind reaction, then they help you say it right
  async function confess(id) {
    const P = api(id), pre = id === 'morgana' ? 'm' : 'd', l = lang(), q = PH['ph.love.quiero'], a = PH['ph.love.amo'];
    const v = await UI.choose('How do you say it?', [{ label: `«${PL(q[l])}»`, sub: q.en, value: 'quiero' }, { label: `«${PL(a[l])}»`, sub: a.en, value: 'amo' }]);
    if (!v) { await speak(P, pre + '.r5.shy'); return false; }
    const r = await phraseBox(v === 'amo' ? 'ph.love.amo' : 'ph.love.quiero', { name: NAME[id], title: `Say it: «${PL((v === 'amo' ? a : q)[l])}»`, check: t => whichLove(t) === v });
    if (!r.ok) { await speak(P, pre + '.r5.shy'); return false; }
    if (v === 'amo') {
      await speak(P, pre + '.r5.amo1'); await speak(P, pre + '.r5.amo2');
      const r2 = await phraseBox('ph.love.quiero', { name: NAME[id], title: `Say the other one: «${PL(q[l])}»`, check: t => whichLove(t) === 'quiero' });
      if (!r2.ok) { await speak(P, pre + '.r5.shy'); return false; }
    }
    popHeart(id); await speak(P, pre + '.r5.quiero');
    return true;
  }
  async function rank5Morgana() {
    const P = MORGANA;
    await episode('m.r5');
    faceShot('morgana');
    for (const k of ['r5.1', 'r5.2', 'r5.3']) await speak(P, 'm.' + k);
    if (!(await confess('morgana'))) return false;
    await speak(P, 'm.r5.4');
    // down to the old theater's steps, where Aurora's choir used to sing
    await UI.fade(1, 650);
    S().favor = null;
    if (inside) { inside = false; if (attic) attic.g.visible = false; G.w3d.setInterior(null); }
    MS.mode = 'out'; MS.pose = 'read'; MS.x = STEPS.morgana.x; MS.z = STEPS.morgana.z; MS.yaw = STEPS.morgana.yaw; MS.y = WORLD.groundAt(MS.x, MS.z, 3); placeMorgana();
    PO.mode = 'steps'; PO.x = STEPS.poe.x; PO.z = STEPS.poe.z; PO.y = WORLD.groundAt(PO.x, PO.z, 3); PO.yaw = -0.4; PO.s = 1;
    teleport(STEPS.you.x, STEPS.you.z, STEPS.you.yaw);
    G.sim.mimoGo({ x: STEPS.you.x + 1.3, z: STEPS.you.z - 0.4 }, { x: MS.x, z: MS.z });
    shot(-10.3, SQ_Y + 2.3, -228.6, -13.45, SQ_Y + 1.55, -234.0);
    await wait(0.2);
    await UI.fade(0, 800);
    await speak(P, 'm.r5.5');
    await poemCard(M_POEM, { tag: 'Morgana reads it out loud:', sig: '— Morgana', say: true });
    await speak(P, 'm.r5.6');
    await STORY.you(YOU.nobody);
    await speak(P, 'm.r5.7');
    MS.pose = 'stand'; await kiss('morgana');
    await speak(P, 'm.r5.8');
    await continuara(true);
    return true;
  }
  async function rank5Dante() {
    const P = DANTE;
    await episode('d.r5');
    DS.pose = 'stand'; faceShot('dante');
    for (const k of ['r5.1', 'r5.2', 'r5.3']) await speak(P, 'd.' + k);
    if (!(await confess('dante'))) { DS.pose = 'work'; return false; }
    await speak(P, 'd.r5.4');
    DS.pose = 'sing'; DS.sing = true; hum(0.9, true);
    shot(DS.x + 1.6, GY + 1.9, DS.z + 3.6, DS.x, GY + 1.5, DS.z);
    await poemCard(D_SONG, { tag: 'Dante sings it, softly:', sig: '♪', say: true });
    DS.sing = false; DS.pose = 'stand';
    await speak(P, 'd.r5.5'); await speak(P, 'd.r5.6');
    await hug('dante');
    shot(FORGE.bell.x + 2.4, GY + 2.3, FORGE.bell.z + 3.6, FORGE.bell.x, GY + 1.5, FORGE.bell.z);
    DS.look = FORGE.bell; await wait(0.5); ringBell(); await wait(1.2); DS.look = null;
    faceShot('dante');
    await speak(P, 'd.r5.7');
    await continuara(true);
    DS.pose = 'work';
    return true;
  }

  // ================================================================ dates (the five love languages)
  async function dateMenu(id) {
    const p = PS(id), P = api(id), pre = id === 'morgana' ? 'm' : 'd', st = S();
    if (now() - p.dateAt < DATE_COOL) return speak(P, pre + '.cool');
    if (st.favor) { UI.toast('She’s still waiting for what she asked for.'); return null; }
    const fav = id === 'morgana' ? 'words' : 'service', tag = k => ((p.tried || {})[k] === 2 ? ` · ♥♥ ${his(id)} favorite!` : '');
    const l = lang(), you = l === 'es' ? 'Eres…' : l === 'pt' ? 'Você é…' : l === 'zh' ? PL('[你|nǐ] [很|hěn]') + '…' : l === 'ja' ? '…' + PL('です ね', { cap: false }) : 'Du bist…';
    const opts = [
      { label: 'Words of affirmation', sub: `tell ${her(id)} something nice: «${you}»` + tag('words'), value: 'words' },
      { label: 'Quality time', sub: 'a walk and a talk: listen well' + tag('time'), value: 'time' },
      { label: 'A gift', sub: 'something from your bag' + tag('gift'), value: 'gift' },
      { label: 'Acts of service', sub: (id === 'dante' ? 'help him test the bell' : 'do her a favor') + tag('service'), value: 'service' },
    ];
    if (p.rank >= 3 && st.partner === id) opts.push({ label: 'Physical touch', sub: 'hold hands (ask first!)' + tag('touch'), value: 'touch' });
    const v = await UI.choose(`${st.partner === id ? 'A date' : 'Time'} with ${NAME[id]}: which love language?`, opts);
    if (!v) return null;
    let got = null;
    if (v === 'words') got = await dateWords(id);
    else if (v === 'time') got = await dateTime(id);
    else if (v === 'gift') got = await dateGift(id);
    else if (v === 'service') got = id === 'dante' ? await bellCount() : await fetchStart();
    else got = await dateTouch(id);
    if (got === null) return null;              // (nothing happened: an empty bag, a box closed with Esc)
    p.dateAt = now();
    if (got === 'pending') { G.save(); return null; }     // (her favor: the hearts come when you bring it)
    p.tried = p.tried || {}; if (got > (p.tried[v] || 0)) p.tried[v] = got;
    addHearts(id, got, got >= 2 && v === fav ? `${v === 'words' ? 'words of affirmation' : 'acts of service'}: ${his(id)} love language!` : got <= 0 ? 'no hearts this time, but no harm done' : '');
    return got;
  }
  // the word you typed, as you typed it (with its accents), for their reaction
  function typedWord(text, a) { const toks = String(text).split(/\s+/).map(w => w.replace(/[¡!¿?.,;:«»"]/g, '')); const f = a.split(' ')[0]; const t = toks.find(w => canon(w) === f || (lang() === 'de' && canon(w).startsWith(f))); return t ? (a.includes(' ') ? toks.slice(toks.indexOf(t), toks.indexOf(t) + a.split(' ').length).join(' ') : t) : a; }
  async function dateWords(id) {
    const P = api(id), pre = id === 'morgana' ? 'm' : 'd', l = lang(), M = ADJ_MODEL[id], c = isC(), nc = { cap: false };
    const start = l === 'es' ? 'Eres' : l === 'pt' ? 'Você é' : l === 'zh' ? PL('[你|nǐ] [很|hěn]') : l === 'ja' ? '' : 'Du bist';
    // (zh / ja: no agreement to mind; the hint shows the pattern and the grammar slip to avoid, in the mode)
    const iAdjName = () => (CJK.mode('ja') === 'roman' ? 'i' : 'い') + '-adjective';
    const hint = l === 'zh' ? `«${start}» + an adjective (${['[聪明|cōng ming]', '[有趣|yǒu qù]', '[善良|shàn liáng]', '[有才华|yǒu cái huá]'].map(a => PL(a, nc)).join(', ')}…). No «${PL('[是|shì]', nc)}» before an adjective!`
      : l === 'ja' ? `An adjective + «${PL('です', nc)}» or «${PL('ね', nc)}» (${['[優|やさ]しい', '[面白|おもしろ]い', '[素敵|すてき]', '[頭|あたま] が いい'].map(a => PL(a, nc)).join(', ')}…). An ${iAdjName()} never takes «${PL('だ', nc)}»!`
      : l === 'de' ? 'Du bist + an adjective (nett, lustig, klug, kreativ…)' : id === 'morgana' ? 'She’s a woman: the adjective ends in -a (inteligente stays the same).' : 'He’s a man: the adjective ends in -o (amable / gentil stay the same).';
    await speak(P, pre + '.d.words');
    for (;;) {
      const r = await UI.command({ name: NAME[id], icon: 'heart', title: `Tell ${NAME[id]} something nice: ${l === 'ja' ? `«… ${PL('です ね', nc)}»` : `«${start} …»`}`, verbs: [],
        placeholder: l === 'ja' ? '… ' + PL('です ね', nc) : start + ' …', hint, model: M[l], modelEn: M.en });
      if (!r || r.cancelled) return null;
      const j = judgeCompliment(id, r.text);
      if (j.kind === 'nostart') { Sound.play('wrong'); UI.toast(l === 'ja' ? `Say how ${she(id)} is, with an adjective: «${PL(M[l])}»` : `Start with «${start} …»: «${PL(M[l])}»`); continue; }
      const adj = c ? j.adj || '' : typedWord(r.text, j.adj || '');           // (zh / ja: the adjective as notation, shown in the mode)
      if (c && j.kind !== 'odd') CJK.used(r.text, j.kind === 'slip' ? j.fix : j.adj, { lang: l });
      if (j.kind === 'love') { await speak(P, pre + '.d.wordsLove', { adj }); return id === 'morgana' ? 2 : 1; }
      if (j.kind === 'ok') { await speak(P, pre + '.d.wordsOk', { adj }); return id === 'morgana' ? 2 : 1; }
      if (j.kind === 'meh') { Sound.play('whimper'); await speak(P, pre + '.d.wordsMeh', { adj }); return 0; }
      if (j.kind === 'slip') {
        await speak(P, pre + '.d.wordsSlip', { adj, fix: j.fix });
        UI.toast(l === 'zh' ? `«${PL(j.fix)}»: an adjective takes «${PL('[很|hěn]', nc)}» or «${PL('[真|zhēn]', nc)}», never «${PL('[是|shì]', nc)}»`
          : l === 'ja' ? `«${PL(j.fix)}»: an ${iAdjName()} never takes «${PL('だ', nc)}»` : `For ${NAME[id]}: «${j.fix}» (${id === 'morgana' ? 'feminine, -a' : 'masculine, -o'})`);
        return j.good === 'meh' ? 0 : 1;
      }
      await speak(P, pre + '.d.wordsOdd'); return 1;
    }
  }
  async function dateTime(id) {
    const P = api(id), p = PS(id), pre = id === 'morgana' ? 'm' : 'd', list = STORIES[id], s = list[(p.storyI || 0) % list.length];
    await speak(P, pre + '.d.time');
    await UI.fade(1, 420); UI.toast(id === 'morgana' ? 'A slow walk through the old streets…' : 'A walk around the plaza…'); await wait(0.4); await UI.fade(0, 420);
    for (const L of s.lines) await speak(P, L);
    await speak(P, s.q);
    const W = LEX.weave(), opts = shuffle(s.a.map((a, k) => ({ label: PL(lineOf(a).text), sub: W < 0.62 ? plainEn(a) : '', value: 'a' + k })));
    const v = await UI.choose(`${NAME[id]} asks: «${PL(lineOf(s.q).text)}»`, opts);
    p.storyI = (p.storyI || 0) + 1;
    if (v === 'a0') { await speak(P, pre + '.d.timeOk'); return 1; }
    await speak(P, pre + '.d.timeNo'); return 0;
  }
  async function dateGift(id) {
    const P = api(id), pre = id === 'morgana' ? 'm' : 'd', bag = G.state.bag || (G.state.bag = {}), l = lang();
    const ids = Object.keys(bag).filter(k => bag[k] > 0 && /^w\./.test(k) && LEX.item(k) && LEX.item(k)[l]);
    if (!ids.length) { think('My bag is empty… There are wildflowers by the forge and by the broken old house. Or I could buy something in a shop.', 6); return null; }
    await speak(P, pre + '.d.gift');
    const name = k => (LEX.taught(k) || LEX.seen(k) ? LEX.form(k) : LEX.item(k).en);
    const item = await UI.choose('Which gift?', ids.slice(0, 9).map(k => ({ label: name(k), sub: `${LEX.item(k).en} · you have ${bag[k]}`, value: k })));
    if (!item) return null;
    LEX.expose(item);
    const model = GIFT_MODEL[l](withArticle(item)), en = LEX.item(item).en, enA = MASS[l].includes(item) ? 'some' : /^[aeiou]/i.test(en) ? 'an' : 'a';
    let j;
    const nc = { cap: false };
    // (zh: with its measure word, 一朵花; ja: the gift + を + 持ってきたよ)
    const ph = l === 'es' ? 'Te traje …' : l === 'pt' ? 'Eu trouxe … pra você' : l === 'zh' ? PL('[我|wǒ] [给|gěi] [你|nǐ] [带|dài] [了|le]') + ' …' : l === 'ja' ? '… ' + PL('を [持|も]って きた よ', nc) : 'Ich hab dir … mitgebracht';
    const hint = l === 'de' ? 'With the accusative: der → einen, die → eine, das → ein' : l === 'pt' ? 'With um / uma: the word’s gender'
      : l === 'zh' ? `With its measure word: ${['[一|yī] [朵|duǒ] [花|huā]', '[一|yī] [份|fèn] [报纸|bào zhǐ]', '[一|yī] [块|kuài] [巧克力|qiǎo kè lì]'].map(s => `«${PL(s, nc)}»`).join(', ')}…`
      : l === 'ja' ? `The gift + «${PL('を', nc)}» + «${PL('[持|も]って きた よ', nc)}»` : 'With un / una: the word’s gender';
    for (;;) {
      const r = await UI.command({ name: NAME[id], icon: 'gift', title: `Give ${her(id)} the ${en}. Say it!`, verbs: [], placeholder: ph, hint, model, modelEn: `I brought you ${enA} ${en}.` });
      if (!r || r.cancelled) return null;
      j = judgeGift(item, r.text);
      if (!j.noun) { Sound.play('wrong'); UI.toast(`Say what it is: «${PL(model)}»`); continue; }
      if (isC()) CJK.used(r.text, model, { lang: l });
      break;
    }
    bag[item] -= 1; if (bag[item] <= 0) delete bag[item];
    if (j.verb && j.artOk) teachPhrase('ph.love.traje'); else UI.toast(j.artOk ? `Even better: «${PL(model)}»` : `Almost: «${PL(j.fix)}» · «${PL(model)}»`);
    const kind = GIFTS[id][item], short = item.slice(2);
    if (kind === 'no') { Sound.play('whimper'); await speak(P, `${pre}.g.${short}`); return 0; }
    await speak(P, kind === 'love' && LT[`${pre}.g.${short}`] ? `${pre}.g.${short}` : pre + '.g.ok');
    return 1;
  }
  // acts of service, Dante's: ring the cracked bell with him, and count the rings (in words)
  async function bellCount() {
    const P = DANTE, l = lang();
    DS.pose = 'stand';
    await speak(P, 'd.d.bell');
    const N = 3 + Math.floor(Math.random() * 6);
    shot(FORGE.bell.x + 2.4, GY + 2.3, FORGE.bell.z + 3.6, FORGE.bell.x, GY + 1.5, FORGE.bell.z);
    DS.look = FORGE.bell; await wait(0.7);
    for (let i = 0; i < N; i++) { ringBell(); await wait(0.8); }
    await wait(0.6); G.cam.override = null; DS.look = null;
    let res = null;
    // (zh / ja: the number in the mode, or with its counter: 七下 / 七回; his answer says it that way)
    const c = isC(), ph = l === 'es' ? 'tres, cuatro…' : l === 'pt' ? 'três, quatro…' : l === 'zh' ? PL('[三|sān] 、 [四|sì] ……') : l === 'ja' ? PL('[三|さん] 、 [四|よん] …') : 'drei, vier…';
    for (;;) {
      const r = await UI.command({ name: 'Dante', icon: 'bellring', title: 'How many times did it ring? Say the number, in words!', verbs: [], placeholder: ph,
        hint: c ? `A number word, not a digit: «${PL(LEX.src('n.3'), { cap: false })}», or with its counter, «${PL(countSrc(3), { cap: false })}»` : 'A number word in the language (not a digit).',
        model: c ? countSrc(N) : LEX.form('n.' + N), modelEn: String(N) });
      if (!r || r.cancelled) { DS.pose = 'work'; return null; }
      const j = judgeCount(r.text, N);
      if (j.digits) { Sound.play('wrong'); UI.toast('In words! Not digits.'); continue; }
      if (!j.n) { Sound.play('wrong'); UI.toast('A number word, please. (? shows it)'); continue; }
      res = j; break;
    }
    const word = c ? countSrc(N) : LEX.form('n.' + N);
    if (res.ok) { LEX.expose('n.' + N); await speak(P, 'd.d.bellOk', { n: c ? word : cap(word) }); DS.pose = 'work'; return 2; }
    await speak(P, 'd.d.bellNo', { n: word }); DS.pose = 'work'; return 0;
  }
  // acts of service, Morgana's: she asks for something in the attic; you find it, bring it, and hand it over
  async function fetchStart() {
    if (!inside) return null;
    const p = PS('morgana'), ids = FETCH.map(f => f.id).filter(i => i !== p.lastFetch), want = ids[(Math.random() * ids.length) | 0];
    p.lastFetch = want;
    await speak(MORGANA, 'm.f.' + want);
    S().favor = { want };
    LEX.expose(FETCH.find(f => f.id === want).word);
    UI.toast('Find what she asked for, and take it to her.');
    return 'pending';
  }
  async function fetchTake(itemId) {
    const st = S(); if (!st.favor || !attic) return;
    return scene(async () => {
      const want = st.favor.want, l = lang(), N = FETCH_NAMES, item = attic.items[itemId];
      item.visible = false; Sound.play('pip');
      const Y = G.sim.you, f = Math.atan2(MS.x - Y.x, MS.z - Y.z);
      teleport(MS.x - Math.sin(f) * 1.25, MS.z - Math.cos(f) * 1.25, f); faceShot('morgana');
      if (itemId !== want) { await speak(MORGANA, 'm.f.wrong', { got: N[itemId][l][1], want: N[want][l][0] }); item.visible = true; return; }
      const r = await phraseBox('ph.love.aqui', { name: 'Morgana', icon: 'gift', title: `Hand it over: «${phS('ph.love.aqui')}»` });
      item.visible = true;
      if (!r.ok) { UI.toast('You put it back. She’s still waiting.'); return; }
      st.favor = null;
      await speak(MORGANA, 'm.f.ok');
      const p = PS('morgana'); p.tried = p.tried || {}; if (!p.tried.service) p.tried.service = 1;
      addHearts('morgana', 1, '');
    });
  }
  async function dateTouch(id) {
    const P = api(id), pre = id === 'morgana' ? 'm' : 'd', l = lang(), model = PH['ph.love.mano'][l], nc = { cap: false };
    const hint = l === 'zh' ? `A question that asks permission: «${PL('[可以|kě yǐ] … [吗|ma] ？', nc)}»` : l === 'ja' ? `Ask permission: «${PL('〜 て も いい ？', nc)}»` : 'A question that asks permission';
    await speak(P, pre + '.d.touch');
    for (;;) {
      const r = await UI.command({ name: NAME[id], icon: 'handhold', title: `Ask to hold ${his(id)} hand. Ask first!`, verbs: [], placeholder: isC() ? RO(model) : model, hint, model, modelEn: 'Can I hold your hand?' });
      if (!r || r.cancelled) return null;
      const j = judgeTouch(r.text);
      if (j === 'order') { Sound.play('wrong'); await speak(P, pre + '.d.touchOrder'); continue; }
      if (j !== 'ask') { await speak(P, pre + '.d.touchHuh'); continue; }
      if (isC()) CJK.used(r.text, model, { lang: l });
      teachPhrase('ph.love.mano', phraseOk('ph.love.mano', r.text).ok);
      break;
    }
    await speak(P, pre + '.d.touchYes');
    await handMoment(id);
    await speak(P, pre + '.d.touchAfter');
    return 1;
  }

  // ================================================================ rivals: banter duels, the crack in the armor, the switch
  async function duel(id, found) {
    const P = api(id), pre = id === 'morgana' ? 'mr' : 'dr', p = PS(id), st = S();
    faceShot(id);
    if (found) await speak(P, pre + '.find');
    await speak(P, pre + '.duel');
    const go = await UI.choose(`${NAME[id]} challenges you to a banter duel!`, [{ label: 'Bring it on!', sub: '3 rounds: pick the comeback that fits, then type it to land it', value: 'yes' }, { label: 'Not now', value: 'no' }]);
    p.duelAt = now(); st.rivalAt = now();
    if (go !== 'yes') { await speak(P, pre + '.decline'); return; }
    const pool = shuffle(DUEL[id].slice()), rounds = pool.slice(0, 3);
    let wins = 0;
    for (let r = 0; r < 3; r++) {
      const Jb = rounds[r];
      UI.toast(`⚔ Round ${r + 1} of 3 · you ${wins}, ${NAME[id]} ${r - wins}`);
      await speak(P, Jb.jab);
      const others = pool.filter(x => x !== Jb), wrong = others[(Math.random() * others.length) | 0].back, mis = pick(MISFIRES);
      const opts = shuffle([{ c: Jb.back, k: 'right' }, { c: wrong, k: 'other' }, { c: mis, k: 'misfire' }]), W = LEX.weave();
      const v = await UI.choose('Pick the comeback that fits!', opts.map((o, i) => ({ label: PL(lineOf(o.c).text), sub: W < 0.62 ? plainEn(o.c) : '', value: 'o' + i })));
      if (!v) { await speak(P, pre + '.tongue'); continue; }
      const o = opts[+v.slice(1)];
      if (o.k !== 'right') { Sound.play('wrong'); await speak(P, o.k === 'other' ? pre + '.other' : pre + '.misfire'); continue; }
      const text = lineOf(o.c).text, en = plainEn(o.c);
      const c = await UI.command({ name: 'You', icon: 'duel', title: 'Land it! Type your comeback:', verbs: [], placeholder: isC() ? RO(text) : text, hint: en, model: text, modelEn: en });
      if (!c || c.cancelled) { await speak(P, pre + '.tongue'); continue; }
      const q = similar(c.text, text);
      if (q >= 0.6) {
        if (isC()) CJK.used(c.text, text, { lang: lang() });
        wins++; Sound.play(q > 0.95 ? 'perfect' : 'hit'); const R = stOf(id); G.w3d.fx.sparkle(R.x, R.y + 1.6, R.z, 8, ['#ffd84a', '#ff8fb1']);
        await speak(P, pre + '.hit'); if (q < 0.85) UI.toast(`It landed! Exactly: «${PL(text)}»`);
      } else { Sound.play('whiff'); await speak(P, pre + '.fizzle'); UI.toast(`«${PL(text)}»`); }
    }
    p.duelAt = now(); st.rivalAt = now();
    if (wins >= 2) {
      p.respect = (p.respect || 0) + 1; Sound.play('fanfare');
      await speak(P, pre + '.win');
      UI.toast(`⚔ You won ${wins} of 3! ${NAME[id]}’s respect: ${Math.min(3, p.respect)}/3` + (p.respect >= 3 && !p.crackOn ? ` · something changed… talk to ${her(id)}` : ''));
    } else { Sound.play('lose'); await speak(P, pre + '.lose'); UI.toast(`⚔ ${NAME[id]} won this one (you ${wins} of 3). No harm done!`); }
    G.save();
  }
  async function crackScene(id) {
    const P = api(id), p = PS(id), pre = id === 'morgana' ? 'mr' : 'dr', st = S(), first = !p.crack;
    if (first) await episode('crack');
    faceShot(id);
    if (!first) await speak(P, pre + '.crack.again');
    else { await speak(P, pre + '.tn.crack'); for (const k of id === 'morgana' ? ['1', '2', '3', '4', '5'] : ['1', '2', '3', '4']) await speak(P, `${pre}.crack.${k}`); }
    p.crack = (p.crack || 0) + 1; p.crackOn = true; G.save();
    const v = await UI.choose(`${NAME[id]} let something soft slip.`, [{ label: `Ask ${her(id)} out`, sub: `you’d have to talk to ${NAME[st.partner] || 'your partner'} first`, value: 'ask' }, { label: 'Stay rivals (for now)', value: 'no' }]);
    if (v === 'ask') { await speak(P, pre + '.crack.ask'); st.switchTo = id; UI.toast(`Talk to ${NAME[st.partner]} first. Kindly.`); G.save(); }
    if (first) await continuara();
  }
  // a short, kind breakup: how to let someone down gently
  async function breakup(id) {
    const P = api(id), pre = id === 'morgana' ? 'm' : 'd', st = S(), l = lang(), kind = lineOf(BREAKUP.kind).text;
    await episode('breakup');
    faceShot(id);
    await STORY.you(YOU.talk);
    await speak(P, pre + '.bu.1');
    for (;;) {
      const opts = shuffle([{ c: BREAKUP.kind, k: 'kind' }, { c: BREAKUP.blunt, k: 'blunt' }, { c: BREAKUP.dodge, k: 'dodge' }]);
      const v = await UI.choose('How do you say it?', opts.map((o, i) => ({ label: PL(lineOf(o.c).text), sub: plainEn(o.c), value: 'o' + i })));
      if (!v) { UI.toast('Not yet.'); return; }
      const o = opts[+v.slice(1)];
      if (o.k === 'blunt') { Sound.play('wrong'); await speak(P, pre + '.bu.blunt'); continue; }
      if (o.k === 'dodge') { await speak(P, pre + '.bu.dodge'); continue; }
      const r = await UI.command({ name: 'You', icon: 'heart', title: 'Say it kindly:', verbs: [], placeholder: isC() ? RO(kind) : kind, hint: plainEn(BREAKUP.kind), model: kind, modelEn: plainEn(BREAKUP.kind) });
      if (!r || r.cancelled) continue;
      if (similar(r.text, kind) < 0.55) { Sound.play('wrong'); UI.toast(`Gently: «${PL(kind)}»`); continue; }
      if (isC()) CJK.used(r.text, kind, { lang: l });
      break;
    }
    teachPhrase('ph.love.siento');
    await speak(P, pre + '.tn.bu');
    await speak(P, pre + '.bu.ok1'); await speak(P, pre + '.bu.ok2');
    const p = PS(id); st.partner = null; st.rival = id; p.respect = 0; p.crackOn = false; p.rivalIntro = true;
    UI.toast(`${NAME[id]} is your rival now · ${NAME[st.switchTo]} is waiting for you`);
    G.save();
    await continuara();
  }
  // a rival walked up to you: the duel, then they go
  async function duelFound(id) {
    const R = stOf(id);
    R.mode = 'held';
    await scene(() => duel(id, true));
    const Y = G.sim.you; R.mode = 'leave'; R.leaveYaw = Math.atan2(R.x - Y.x, R.z - Y.z); R.t0 = 0; R.pose = 'stand';
  }
  // ================================================================ the poem trail
  const TRAIL_THINK = [
    'A black {w.cat}, watching me read. «Follow the shadow that meows»… is that you?',
    'The town ends here… and the {w.cat} is already heading up the old brick road.',
    '«The house broken in two»… We passed it on the way here! The {w.cat} is going back.',
    '«Now come up and say it out loud»… up where?',
  ];
  // (zh / ja: their poems say it their own way, so the thought quotes their English)
  const TRAIL_THINK_CJK = {
    zh: ['A black {w.cat}, watching me read. «A black shadow goes meow»… is that you?', TRAIL_THINK[1],
      '«A house broken in two»… We passed it on the way here! The {w.cat} is going back.', TRAIL_THINK[3]],
    ja: [TRAIL_THINK[0], '«Leave the town, walk north, slowly»… and the {w.cat} is already heading up the old brick road.',
      '«A house broken in two»… We passed it on the way here! The {w.cat} is going back.', '«Come up and say it out loud»… up where?'],
  };
  async function readPoem(i) {
    const st = S(), first = !st.trail.read[i];
    st.trail.read[i] = true; st.trail.seen = true;
    Sound.play('page');
    LEX.expose('w.poem');
    await poemCard(POEM_TEXT[i], { tag: `A poem, pinned up · ${POEMS[i].at}`, faded: true, sig: '— M.' });
    if (first) { think(((isC() && TRAIL_THINK_CJK[lang()]) || TRAIL_THINK)[i], 5); if (i < 3 && PO.at === i) meow(0.8); }
    G.save();
  }
  async function ruinScene() {
    const st = S(); if (st.trail.ladder) return;
    await scene(async () => {
      shot(-9.3, RUIN_Y + 2.7, -198.2, -3.9, RUIN_Y + 2.4, -201.6);
      G.sim.mimoGo({ x: -6.0, z: -200.2 }, RUIN.window);
      PO.mode = 'scene'; meow(1);
      await wait(0.9);
      // Poe hops up to the boarded window, and squeezes between the boards
      const x0 = PO.x, z0 = PO.z, y0 = PO.y, sx = RUIN.window.x - 0.2, sy = RUIN.window.y - 0.62, sz = RUIN.window.z;
      PO.yaw = HALF;
      await tween(0.5, k => { PO.x = lerp(x0, sx, k); PO.z = lerp(z0, sz, k); PO.y = lerp(y0, sy, k) + Math.sin(k * Math.PI) * 0.55; });
      Sound.play('pip'); await wait(0.45);
      await tween(0.55, k => { PO.x = sx + k * 0.45; PO.s = 1 - k * 0.98; });
      PO.mode = 'gone'; PO.s = 1; Sound.play('wood');
      await wait(0.4);
      await STORY.you(YOU.ruin);
      // a thump upstairs; a voice; and a rope ladder unrolls from the window above
      Sound.play('land', 7); await wait(0.5);
      shot(-9.0, RUIN_Y + 3.4, -198.6, -3.7, RUIN_Y + 3.0, -201.6);
      await speak(VOICE, 'm.voice');
      ladder.unrolling = true; ladder.rope.scale.y = 0.001; Sound.play('swoosh');
      await tween(1.0, k => { ladder.rope.scale.y = Math.max(0.001, 1 - Math.pow(1 - k, 3)); });
      Sound.play('wood'); ladder.unrolling = false;
      st.trail.ladder = true; G.save();
      await STORY.you(YOU.ladder);
    });
  }

  // ================================================================ the attic (a room, like the corn hall)
  const PI = { x: POE_SPOT.x, z: POE_SPOT.z, y: AY + 0.1, yaw: 2.6, speed: 0, phase: 0, mode: 'attic', look: null, s: 1 };
  async function enter() {
    buildAttic();
    if (!poeIn) { poeIn = makePoe(); attic.g.add(poeIn.root); }
    MS.mode = 'attic'; MS.x = SEAT.x; MS.z = SEAT.z; MS.y = AY; MS.yaw = 0; MS.pose = 'sit'; placeMorgana();
    await UI.fade(1, 450);
    inside = true; attic.g.visible = true; G.w3d.setInterior({ fog: '#1c1424', near: 13, far: 40 });
    teleport(ARRIVE.x, ARRIVE.z, ARRIVE.yaw); snapCam(Math.PI + 0.32, 0.55, 8.4);
    Sound.play('wood');
    await UI.fade(0, 450);
    const st = S();
    if (!st.atticSeen) { st.atticSeen = true; UI.chapter('Morgana’s attic', 'Up in the broken house'); }
    G.save();
    if (!PS('morgana').met) await scene(meetMorgana);
  }
  async function leave() {
    S().favor = null;
    await UI.fade(1, 450);
    inside = false; if (attic) attic.g.visible = false; G.w3d.setInterior(null);
    teleport(OUTSIDE.x, OUTSIDE.z, OUTSIDE.yaw); snapCam(HALF - 0.55, 0.3, 8.0);
    Sound.play('wood');
    await UI.fade(0, 450);
    G.save();
  }
  // per frame while you're in the attic (main.js calls the room you're in)
  function roomUpdate(dt, t) {
    if (!inside || !attic) return;
    if (myLock && G.sim.lock > 0 && !STORY.busy && !sceneOn) { lock(false); G.cam.override = null; }
    const Y = G.sim.you, you = { x: Y.x, z: Y.z, y: Y.ry };
    if (MS.mode === 'attic' && FIG.morgana) {
      if (FIG.morgana.root.parent !== attic.g) placeMorgana();
      if (MS.pose === 'sit' && MS.look === null) MS.yaw = dampAngle(MS.yaw, 0, 3, dt);
      poseFig(FIG.morgana, MS, MORGANA, dt, t, you);
    }
    if (poeIn) { if (Math.hypot(Y.x - PI.x, Y.z - PI.z) < 3) PI.look = you; else PI.look = null; animatePoe(poeIn, PI, dt, t); }
    attic.glows.forEach((s, i) => { s.material.opacity = 0.42 + 0.1 * Math.sin(t * 6.1 + i * 1.9) + 0.05 * Math.sin(t * 15 + i); });
    attic.moon.material.opacity = 0.3 + 0.05 * Math.sin(t * 0.7);
    if (hold) holdPose();
  }
  function insideItems() {
    const list = [], st = S(); if (!attic) return list;
    list.push({ x: EXIT.x, z: EXIT.z, y: AY, r: 1.4, label: 'Climb down', run: leave });
    if (MS.mode === 'attic') list.push({ x: MS.x, z: MS.z + 0.75, y: AY, r: 2.3, label: 'Talk', run: () => talkTo('morgana') });
    list.push({ x: POE_SPOT.x, z: POE_SPOT.z, y: AY, r: 1.25, label: 'Pet', run: petPoe });
    list.push({ x: ATTIC.x - 3.55, z: ATTIC.z + 0.95, y: AY, r: 1.1, label: 'Look', run: lookRecord });
    list.push({ x: ATTIC.x + 2.0, z: ATTIC.z - 3.3, y: AY, r: 1.3, label: 'Read', run: readWall });
    list.push({ x: ATTIC.x - 2.3, z: ATTIC.z - 3.3, y: AY, r: 1.2, label: 'Look', run: lookWindow });
    if (st.favor) FETCH.forEach(f => list.push({ x: f.at.x, z: f.at.z, y: AY, r: 1.35, label: `Take «${PL((pickLang(FETCH_NAMES[f.id], lang(), [FETCH_NAMES[f.id].en]) || [f.id])[0], { cap: false })}»`, run: () => fetchTake(f.id) }));    // (every frame in the attic: never a crash)
    return list;
  }
  const WALL_POEMS = [
    { en: ['The candle talks to the dark', 'in a language with no words.', 'I understand it.'], es: ['La vela le habla a la oscuridad', 'en un idioma sin palabras.', 'Yo la entiendo.'],
      pt: ['A vela fala com o escuro', 'numa língua sem palavras.', 'Eu entendo.'], de: ['Die Kerze spricht mit der Dunkelheit', 'in einer Sprache ohne Wörter.', 'Ich verstehe sie.'] },
    { en: ['Poe walks across my poems', 'and leaves paw prints.', 'They’re better than my words.'], es: ['Poe camina sobre mis poemas', 'y deja huellas.', 'Son mejores que mis palabras.'],
      pt: ['O Poe anda nos meus poemas', 'e deixa pegadas.', 'São melhores que as minhas palavras.'], de: ['Poe läuft über meine Gedichte', 'und hinterlässt Pfotenabdrücke.', 'Die sind besser als meine Wörter.'] },
    { en: ['Everyone is so loud down there.', 'Up here it’s only me,', 'and a silence that listens too much.'], es: ['Allá abajo todos hacen ruido.', 'Aquí arriba solo estoy yo,', 'y un silencio que escucha demasiado.'],
      pt: ['Lá embaixo todo mundo faz barulho.', 'Aqui em cima só tem eu,', 'e um silêncio que escuta demais.'], de: ['Da unten sind alle so laut.', 'Hier oben bin nur ich,', 'und eine Stille, die zu viel zuhört.'] },
  ];
  // (zh: her lines as she'd write them; ja: as haiku)
  poemCJK(WALL_POEMS[0],
    ['[烛光|zhú guāng] [对|duì] [黑暗|hēi àn] [说话|shuō huà] ，', '[用|yòng] [一种|yī zhǒng] [没有|méi yǒu] [字|zì] [的|de] [语言|yǔ yán] 。', '[我|wǒ] [听|tīng] [得|de] [懂|dǒng] 。'],
    ['The candlelight talks to the dark', 'in a language with no words.', 'I understand it.'],
    ['ろうそく が', '[闇|やみ] と [話|はな]す の', '[分|わ]かる の よ'], ['The candle', 'talking with the dark:', 'I understand it.']);
  poemCJK(WALL_POEMS[1],
    ['[坡坡|Pō po] [走|zǒu] [过|guò] [我|wǒ] [的|de] [诗|shī] ，', '[留下|liú xià] [一串|yī chuàn] [脚印|jiǎo yìn] 。', '[比|bǐ] [我|wǒ] [写|xiě] [的|de] [字|zì] [还|hái] [好|hǎo] 。'],
    ['Poe walks across my poems', 'and leaves a trail of paw prints.', 'They’re better than what I wrote.'],
    ['[詩|し] の [上|うえ] を', 'ポー の [足跡|あしあと]', 'わたし より'], ['Across my poem,', 'Poe’s paw prints:', 'better than mine.']);
  poemCJK(WALL_POEMS[2],
    ['[楼下|lóu xià] [人人|rén rén] [都|dōu] [很|hěn] [吵|chǎo] 。', '[楼上|lóu shàng] [只有|zhǐ yǒu] [我|wǒ] ，', '[和|hé] [一片|yī piàn] [听|tīng] [得|de] [太|tài] [多|duō] [的|de] [寂静|jì jìng] 。'],
    ['Downstairs, everyone is loud.', 'Upstairs there’s only me,', 'and a silence that listens too much.'],
    ['[下|した] の [声|こえ]', 'ここ に わたし と', '[聞|き]く しじま'], ['Voices down below.', 'Up here, only me', 'and a silence that listens.']);
  let wallI = 0;
  async function readWall() {
    const P = WALL_POEMS[wallI++ % WALL_POEMS.length], gone = PS('morgana').rank < 3;
    Sound.play('page'); LEX.expose('w.poem');
    await poemCard(P, { tag: 'Pinned to the attic wall', faded: gone, sig: '— M.' });
    if (gone && PS('morgana').met) think('The last lines are going gray… like the hushed people’s words.', 4.5);
  }
  const RECORD = { es: 'Canciones para días de lluvia', pt: 'Canções para dias de chuva', de: 'Lieder für Regentage', zh: '[雨天|yǔ tiān] [的|de] [歌|gē]', ja: '[雨|あめ] の [日|ひ] の [歌|うた]' };
  async function lookRecord() { think(`A gramophone. The record is called «${PL(pickLang(RECORD, lang(), 'Songs for Rainy Days'))}». Of course it is.`, 5); hum(0.25, true); }
  async function lookWindow() { think('Through the round {w.window}: the road to the cemetery, and the cypresses, black against a purple sky.', 5); LEX.expose('w.window'); }
  async function petPoe() {
    meow(0.9); G.sim.mimo.happy = 1;
    const st = inside ? PI : PO, y = st.y + 0.6;
    sprites.pop.position.set(st.x, y, st.z); sprites.popT = 1.0; sprites.pop.visible = true;
    const T = ['Poe purrs… then bites my hand, very gently. A goth {w.cat}.', 'Poe headbutts {mimo}. {mimo} is delighted.', 'Poe stares into the distance. Probably thinking about {w.poem:pl}.', 'Poe allows exactly one pet. Then he looks away, unimpressed.'];
    PS('morgana').petI = ((PS('morgana').petI || 0) + 1) % T.length;
    think(T[PS('morgana').petI], 4); LEX.expose('w.cat');
  }
  async function lookBell() {
    LEX.expose('w.bell');
    think(PS('dante').met ? 'Alba’s old {w.bell}. A crack runs up from its lip. Dante is patching it, a little every day.' : 'An old {w.bell} on a wooden stand, with a big crack in it. Somebody’s been patching it.', 5);
  }
  function pickFlower() {
    const bag = G.state.bag || (G.state.bag = {});
    if ((bag['w.flower'] || 0) >= 5) { think('I’ve got plenty of {w.flower:pl} already.', 3.5); return; }
    bag['w.flower'] = (bag['w.flower'] || 0) + 1; LEX.expose('w.flower');
    Sound.play('pip'); UI.toast(`+1 «${LEX.form('w.flower')}» (a wildflower, for a gift) · you have ${bag['w.flower']}`);
    G.save();
  }

  // ================================================================ the world's side: things to press E on, arrivals, rivals
  function outsideItems() {
    const list = [], st = S(), F = G.state.flags, Y = G.sim.you, past = typeof CEMETERY !== 'undefined' && CEMETERY.era === 'past';
    if (!root || !root.visible || !F.hatched) return list;
    if (personVisible('dante') && Math.abs(DS.x - Y.x) < 7 && Math.abs(DS.z - Y.z) < 7) list.push({ x: DS.x, z: DS.z + (DS.mode === 'home' ? 0.75 : 0), y: DS.y, r: DS.mode === 'home' ? 2.5 : 2.2, label: 'Talk', run: () => talkTo('dante') });
    if (Math.abs(FORGE.center.x - Y.x) < 9 && Math.abs(FORGE.center.z - Y.z) < 9) list.push({ x: FORGE.bell.x + 0.75, z: FORGE.bell.z + 0.9, y: GY, r: 1.2, label: 'Look', run: lookBell });
    if (personVisible('morgana') && MS.mode !== 'approach') list.push({ x: MS.x, z: MS.z, y: MS.y, r: 2.2, label: 'Talk', run: () => talkTo('morgana') });
    if (F.rosa) POEMS.forEach((P, i) => { if (past && i >= 2) return; if (Math.abs(P.read.x - Y.x) < 6 && Math.abs(P.read.z - Y.z) < 6) list.push({ x: P.read.x, z: P.read.z, y: WORLD.groundAt(P.read.x, P.read.z), r: P.read.r, label: st.trail.read[i] ? 'Read again' : 'Read', run: () => readPoem(i) }); });
    if (poeOut && poeOut.root.visible && (PO.mode === 'sit' || PO.mode === 'steps')) list.push({ x: PO.x, z: PO.z, y: PO.y, r: 1.15, label: 'Pet', run: petPoe });
    if (st.trail.ladder && !past) list.push({ x: RUIN.climb.x, z: RUIN.climb.z, y: RUIN_Y, r: RUIN.climb.r, label: 'Climb up', run: enter });
    flowers.forEach((f, i) => { if (past && i === 1) return; if (Math.abs(f.x - Y.x) < 4 && Math.abs(f.z - Y.z) < 4) list.push({ x: f.x, z: f.z, y: f.y, r: 1.35, label: 'Pick a flower', run: pickFlower }); });
    return list;
  }
  function triggers(Y) {
    if (!G.state.flags.hatched || STORY.busy || STORY.line || G.state.teaching || G.journalOpen || G.sim.lock > 0 || sceneOn) return;
    const st = S(), past = typeof CEMETERY !== 'undefined' && CEMETERY.era === 'past';
    if (!st.trail.ladder && !past && st.trail.read.every(Boolean) && PO.at === 3 && PO.mode === 'sit' && Math.hypot(Y.x - RUIN.climb.x, Y.z - RUIN.climb.z) < 6) { STORY.run(ruinScene); return; }
    for (const id of ['dante', 'morgana']) { const R = stOf(id); if (R.mode === 'approach' && Math.hypot(R.x - Y.x, R.z - Y.z) < 1.9) { STORY.run(() => duelFound(id)); return; } }
    // Morgana goes home after her reading on the theater's steps, once you've walked off
    if (MS.mode === 'out' && Math.hypot(Y.x - MS.x, Y.z - MS.z) > 26) { goHome('morgana'); if (PO.mode === 'steps') PO.mode = 'gone'; }
    rivalTick(Y);
  }
  // now and then (at most every ~4 minutes) your rival comes looking for you in Alba, for a duel
  function rivalTick(Y) {
    const st = S(), rid = st.rival;
    if (!rid || !st.partner || !PS(rid).met || !PS(rid).rivalIntro || st.switchTo === rid) return;
    const R = stOf(rid);
    if (rid === 'dante' ? R.mode !== 'home' : R.mode !== 'attic') return;
    if (now() - Math.max(st.rivalAt || -1e9, PS(rid).duelAt || -1e9) < RIVAL_COOL) return;
    if (Math.hypot(Y.x - ALBA.x, Y.z - ALBA.z) > ALBA.r || G.sim.you.speed > 7) return;
    if (rid === 'dante' && Math.hypot(Y.x - FORGE.center.x, Y.z - FORGE.center.z) < 14) return;      // (at his forge you can challenge him yourself)
    st.rivalAt = now();
    R.mode = 'approach'; R.pose = 'stand'; R.t0 = 0; R.stuck = 0; R.best = 1e9; R.look = null;
    const far = rid === 'morgana' || Math.hypot(R.x - Y.x, R.z - Y.z) > 30;
    if (far) {       // (from somewhere behind the camera, so they walk into view: the first spot with a clear way to you)
      const clear = (x, z) => { for (let k = 1; k < 10; k++) { const sx = lerp(x, Y.x, k / 10), sz = lerp(z, Y.z, k / 10), [px, pz] = WORLD.pushOut(sx, sz, 0.45); if (Math.hypot(px - sx, pz - sz) > 0.05) return false; } return true; };
      let best = null;
      for (const da of [0, 0.5, -0.5, 1.0, -1.0, 1.5, -1.5]) {
        const a = G.cam.yaw + Math.PI + da, x = Y.x + Math.sin(a) * 11, z = Y.z + Math.cos(a) * 11, [px, pz] = WORLD.pushOut(x, z, 0.5);
        if (!best) best = [px, pz];
        if (Math.hypot(px - x, pz - z) < 0.05 && clear(px, pz)) { best = [px, pz]; break; }
      }
      [R.x, R.z] = best; R.y = WORLD.groundAt(R.x, R.z);
      if (rid === 'morgana') placeMorgana();
    }
  }
  // where to point (Ask Mimo, the quests): them, or the way to them
  function spotOf(id) {
    if (id === 'dante') return { x: DS.x, z: DS.z };
    if (inside) return { x: MS.x, z: MS.z };
    if (MS.mode !== 'attic') return { x: MS.x, z: MS.z };
    const st = S(); if (st.trail.ladder) return { x: RUIN.climb.x, z: RUIN.climb.z };
    return trailTarget();
  }
  function trailTarget() {
    const st = S(); let i = 0; while (i < 4 && st.trail.read[i]) i++;
    if (i >= 4) return { x: RUIN.climb.x, z: RUIN.climb.z };
    if (PO.mode === 'trot' || (PO.mode === 'sit' && PO.at !== i)) return { x: PO.x, z: PO.z };
    return { x: POEMS[i].read.x, z: POEMS[i].read.z };
  }
  // who the love quest is about: the person you're dating, the one waiting for you, or whoever you've grown closest to
  function focusId() {
    const st = S();
    if (st.partner) return st.partner;
    if (st.switchTo) return st.switchTo;
    const m = PS('morgana'), d = PS('dante');
    if (m.met && !d.met) return 'morgana';
    if (d.met && !m.met) return 'dante';
    if (st.rival) return other(st.rival);
    return m.hearts > d.hearts ? 'morgana' : 'dante';
  }

  // ================================================================ the two quests (quests.js LIST entries)
  function trailQuest() {
    const tr = s => (s.romance && s.romance.trail) || { read: [] }, nRead = s => (tr(s).read || []).filter(Boolean).length;
    const metM = s => !!(s.romance && s.romance.p && s.romance.p.morgana && s.romance.p.morgana.met);
    return {
      id: 'romance.trail', kind: 'side', title: 'A trail of {w.poem:pl}', giver: 'a black cat in Alba’s plaza',
      started: s => !!tr(s).seen,
      steps: [
        { text: 'Follow the black {w.cat}, and read its {w.poem:pl} ({n}/4)', n: nRead, word: 'w.poem',
          why: 'A black {w.cat} sat under the big tree in Alba’s plaza, by a {w.poem} pinned to its trunk. Read one, and the {w.cat} trots off and waits by the next. Someone is leaving a trail.',
          done: s => nRead(s) >= 4, target: () => trailTarget(), hint: '{mimo} points at the black {w.cat}. It’s waiting by a pinned page!' },
        { text: 'Follow the {w.cat} into the broken {w.house}',
          why: 'The last {w.poem} was pinned to the half-fallen {w.house} in the Old Quarter: «Now come up and say it out loud».',
          done: s => !!tr(s).ladder, target: () => ({ x: RUIN.climb.x, z: RUIN.climb.z }), hint: '{mimo} points at the broken {w.house}. The {w.cat} is sitting by its wall.' },
        { text: 'Climb up into the attic',
          why: 'A rope ladder came down from the window upstairs. Somebody up there writes {w.poem:pl}… and has a {w.cat} called Poe.',
          done: metM, target: () => ({ x: RUIN.climb.x, z: RUIN.climb.z }), hint: '{mimo} looks up at the rope ladder.' },
      ],
      story: [
        { when: s => !!tr(s).seen, text: 'A black {w.cat} called Poe sat in Alba’s plaza, by a {w.poem} pinned to the big tree. Each {w.poem} pointed to the next: the north gate, the old theater’s square, then back to the {w.house} that broke in half.' },
        { when: metM, text: 'Up in its attic lives Morgana, 21, a poet who hides from everyone. The Hush has started graying the last lines of her {w.poem:pl}.' },
      ],
    };
  }
  function loveQuest() {
    const R = s => s.romance || {}, met = s => { const r = R(s); return !!(r.p && ((r.p.morgana || {}).met || (r.p.dante || {}).met)); };
    const P = s => { const id = focusId(), r = R(s); return (r.p && r.p[id]) || { rank: 0, hearts: 0 }; };
    const dating = s => !!R(s).partner, nm = () => NAME[focusId()], hr = () => her(focusId());
    const WHY = 'Dates are how you get closer: words of affirmation, quality time, a gift, acts of service, and later, holding hands. Everyone has a favorite (it gives ♥♥). One date with each of them every few minutes. While you date one of them, the other is your rival: win banter duels to earn their respect.';
    const step = (r, need, flag, why) => ({
      get text() { return `${nm()}, rank ${r}: ♥ {n}/${need}` + (flag ? `, and ${FLAG_TEXT[flag]}` : ''); },
      n: s => Math.min(need, P(s).hearts), get why() { return (typeof why === 'function' ? why() : why) + ' ' + WHY; },
      done: s => dating(s) && P(s).rank >= r, target: () => spotOf(focusId()),
      get hint() { return `{mimo} points the way to ${nm()}.`; },
    });
    return {
      id: 'romance', kind: 'side', title: 'Love languages', giver: 'Morgana and Dante',
      started: met,
      steps: [
        { get text() { return `Get to know ${nm()}, and ask ${hr()} out (♥ {n}/2)`; }, n: s => Math.min(2, P(s).hearts), why: WHY,
          done: dating, target: () => spotOf(focusId()), get hint() { return `{mimo} points the way to ${nm()}.`; } },
        step(3, 5, 'boss', 'A date that goes deeper.'),
        step(4, 8, 'ciro', 'Their soft side, and a favor for them.'),
        step(5, 11, 'bell', () => `The confession: «${phP('ph.love.quiero')}» isn’t «${phP('ph.love.amo')}».`),
      ],
      story: [
        { when: s => !!(R(s).p && (R(s).p.dante || {}).met), text: 'Dante, 24, mends Alba’s cracked bell at a little forge by the bell tower. He sings loud on purpose, so the Hush can’t come near; underneath, silence scares him.' },
        { when: s => !!R(s).partner, get text() { return `You’re dating ${NAME[R(G.state).partner] || '…'}.` + (R(G.state).rival ? ` ${NAME[R(G.state).rival]} is your rival.` : ''); } },
        { when: s => ['morgana', 'dante'].some(id => R(s).p && (R(s).p[id] || {}).rank >= 5), get text() { return `You said it, in the language: «${phP('ph.love.quiero')}». Not «${phP('ph.love.amo')}». Not yet.`; } },
      ],
    };
  }

  // ================================================================ zh / ja: every string of this file
  // (for CJK.addSource, so the IME offers its words and typed characters read right; and for tests: CJK.validate each).
  // A line's own slots ({caes}, {adj}, {n}…) are filled with samples, so what's checked is what the game shows.
  function cjkStrings(l) {
    const out = [], add = s => { if (typeof s === 'string' && s) out.push(s); }, arr = a => (a || []).forEach(add);
    const inner = s => { if (typeof s === 'string') for (const m of s.matchAll(/«([^»]*)»/g)) if (/[぀-ヿ㐀-鿿[]/.test(m[1])) out.push(m[1]); };
    const ph = id => String((PH[id] || {})[l] || '').replace(/\s*[。！]$/, '');
    const sample = { caes: ph('ph.love.caesbien'), gustas: ph('ph.love.gustas'), quiero: ph('ph.love.quiero'), amo: ph('ph.love.amo'),
      adj: l === 'zh' ? '[聪明|cōng ming]' : '[優|やさ]しい', fix: l === 'zh' ? '[你|nǐ] [很|hěn] [聪明|cōng ming]' : '[優|やさ]しい です',
      got: (FETCH_NAMES.book[l] || [])[1], want: (FETCH_NAMES.candle[l] || [])[0], n: l === 'zh' ? '[七|qī] [下|xià]' : KAI_JA[7] };
    for (const k of Object.keys(LT)) if (LT[k][l]) add(fillVars(LT[k][l], sample));
    PHRASES.forEach(p => { add(p[l]); arr(p.alt && p.alt[l]); inner(p.notes[l]); });
    for (const w of Object.values(WORDS_CJK)) { add(w[l]); arr(w.alt && w.alt[l]); }
    [...POEM_TEXT, GRAN_POEM, M_POEM, D_SONG, ...WALL_POEMS].forEach(P => arr(P[l]));
    for (const id of ['morgana', 'dante']) {
      const A = ADJ[id][l]; if (A) { arr(A.love); arr(A.ok); arr(A.meh); }
      add(ADJ_MODEL[id][l]); add(NAME_CJK[id][l]);
      STORIES[id].forEach(s => { s.lines.forEach(L => add(L[l])); add(s.q[l]); s.a.forEach(A => add(A[l])); });
      DUEL[id].forEach(d => { add(d.jab[l]); add(d.back[l]); });
    }
    MISFIRES.forEach(m => add(m[l])); Object.values(BREAKUP).forEach(b => add(b[l]));
    for (const k of Object.keys(TN)) add(fillVars(TN[k][l] || '', { n: 3 }));
    Object.values(FETCH_NAMES).forEach(f => arr(f[l]));
    add(RECORD[l]);
    if (l === 'zh') {
      arr(DEG_ZH); arr(MW_ZH); arr(NUMDET_ZH); Object.values(CL_OK_ZH).forEach(arr); arr(GIFT_VERB.zh); add('[你|nǐ] [是|shì] [聪明|cōng ming]'); add('[三|sān] 、 [四|sì] ……');
      arr(['[我爱你|wǒ ài nǐ]', '[我喜欢你|wǒ xǐ huan nǐ]']);          // (whole, for the IME: «woaini» → 我爱你, not 我哎你)
    }
    else { arr(KAI_JA.filter(Boolean)); arr(GIFT_VERB.ja); add('[優|やさ]しい だ'); add('[三|さん] 、 [四|よん] …'); }
    add(GIFT_MODEL[l](l === 'zh' ? '[一|yī] [朵|duǒ] [花|huā]' : '[花|はな]'));
    return out;
  }

  // ================================================================ the game side (main.js and story.js call these)
  return {
    build,
    init(game) {
      G = game; css();
      if (typeof QUESTS !== 'undefined' && QUESTS.LIST) {
        if (!QUESTS.LIST.some(q => q.id === 'romance.trail')) QUESTS.LIST.push(trailQuest());
        if (!QUESTS.LIST.some(q => q.id === 'romance')) QUESTS.LIST.push(loveQuest());
      }
      // zh / ja: the words of every line into CJK's dictionary (the IME, characters typed), and the new names (rōmaji capitals)
      if (typeof CJK !== 'undefined') {
        try {
          if (CJK.addNames) CJK.addNames(['ティト', 'ソンブラ', 'ルナ']);
          if (CJK.addSource) for (const l of ['zh', 'ja']) CJK.addSource(cjkStrings(l), l);
        } catch (e) { console.error('[romance]', e); }
      }
    },
    // the attic, as a room (main.js: ROOMS; story.js: interactables)
    get inside() { return inside; },
    OUTSIDE,
    interactables() { if (!G || !root) return []; return inside ? insideItems() : outsideItems(); },
    update(dt, t) { roomUpdate(dt, t); },
    curiosities() {
      if (!inside) return [];
      return [{ id: 'w.candle', x: ATTIC.x - 3.4, z: ATTIC.z - 1.6, r: 3.2 }, { id: 'w.window', x: ATTIC.x, z: ATTIC.z - 3.4, r: 3.6 }, { id: 'w.book', x: ATTIC.x + 4.3, z: ATTIC.z + 1.3, r: 3 },
        { id: 'w.cat', x: POE_SPOT.x, z: POE_SPOT.z, r: 2.6 }, { id: 'w.poem', x: ATTIC.x + 1.5, z: ATTIC.z - 3.6, r: 3.2 }];
    },
    target() {
      if (!G || !inside) return null;
      const st = S();
      if (st.favor) { const f = FETCH.find(q => q.id === st.favor.want); return f ? { x: f.at.x, z: f.at.z, hint: '{mimo} sniffs around… she asked for something. Over there?' } : null; }
      if (MS.mode === 'attic' && (wantsTalk('morgana') || now() - PS('morgana').dateAt >= DATE_COOL)) return { x: MS.x, z: MS.z + 0.8, hint: '{mimo} points at Morgana.' };
      return null;
    },
    enter, leave,
    // tests and tools
    _: {
      S: () => S(), PS, LT, YOU, POEMS, POEM_TEXT, TRAIL_PATH, RUIN, FORGE, ATTIC, SEAT, EXIT, ARRIVE, FETCH, STEPS, DUEL, MISFIRES, STORIES, ADJ, GIFTS, PHRASES, BREAKUP, GATES,
      DS, MS, PO, PI, FIG, get attic() { return attic; }, get root() { return root; }, get forge() { return forge; }, get ladder() { return ladder; }, get poeOut() { return poeOut; },
      talkTo, talkScene, meetDante, meetMorgana, rankScene, askOut, dateMenu, dateWords, dateTime, dateGift, bellCount, fetchStart, fetchTake, dateTouch, duel, duelFound, crackScene, breakup,
      readPoem, ruinScene, enter, leave, petPoe, pickFlower, placePoe, goHome, rivalTick, focusId, roleOf, rankReady, wantsTalk, canAskOut, restyle,
      episode, continuara, dramaZoom, TN, DRAMA, ACT, rivalIntro, rank3, rank4Morgana, rank4Dante, rank5Morgana, rank5Dante,
      judgeCompliment, judgeGift, judgeTouch, judgeCount, whichLove, isAskOut, phraseOk, similar, canon, lineOf, teachPhrase, outsideItems, insideItems,
      set rivalCool(v) { /* (tests) */ }, RIVAL_COOL, DATE_COOL, DUEL_COOL,
      // zh / ja
      cjkStrings, LT_CJK, TN_CJK, NAME_CJK, PH_CJK, WORDS_CJK, GRAN_POEM, M_POEM, D_SONG, WALL_POEMS, RECORD, countSrc, phraseBox, confess, poemCard, speak,
    },
  };
})();
