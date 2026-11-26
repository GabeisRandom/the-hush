'use strict';
// Minigames (DESIGN.md 14.7, helper agent). The user asked: "make it so you can play little minigames with kids like tag,
// tic tac toe, etc. make them taunt you which will help you learn that part of the language" and "add chess hustlers in
// the game, make them play checkers or chess. they don't need to be that good just like lower-intermediate."
//
//  - Alba's plaza: three kids, Sofi, Beto and Luci, hang out by a tic-tac-toe grid chalked on the cobbles. They play
//      tag («la mancha» · «pega-pega» · «Fangen»): real chasing round the fountain, in 3D;
//      tic-tac-toe («el gato» · «jogo da velha» · «Tic-Tac-Toe»): you place your X by saying where («arriba a la izquierda»);
//      rock-paper-scissors: you type your pick;
//      hide and seek («las escondidas» · «esconde-esconde» · «Verstecken»): Sofi counts and seeks, then you count (typing
//      the numbers) and find them («¡Te encontré!»).
//    They talk the way kids do (tú / você / du, imperatives, cheek) and taunt you. After a game they teach you one of their
//    taunts (copy it once), and from then on you can throw it back at them: that's the output.
//  - Molinar's market square: two old hustlers at outdoor tables, Don Aurelio (chess) and Doña Reme (checkers), with Don
//    Tino watching. They play for coins (state.coins), trash-talk in the language («¡Te comí el caballo!», «¡Jaque!»), and
//    teach the pieces. Announce your move in the language («caballo a f3») for style points. Chess has full legal moves
//    (castling, en passant, promotion, mate, stalemate, 50 moves, repetition, dead positions); the AI searches 2 plies with
//    material + piece-square tables and a little noise. Checkers (English rules: forced captures, multi-jumps, kings)
//    searches 3 plies with some noise.
//
// One global, MINIGAMES:
//   MINIGAMES.init(game)                      after main has built the world: words, phrases, icons, lines, quests
//   MINIGAMES.build(scene, { terrainAt })     → { colliders, group, people, update(dt, t, you|null), stats() }
//   MINIGAMES.interactables()                 → [{ x, z, y, r, label, run }]   (Talk to everyone; Play at the chalk grid)
//   MINIGAMES.busy                            a minigame is running (any kind)
//   MINIGAMES.overlay                         a 2D board is open: the world gets no input (Input.typing and sim.lock are set)
//   MINIGAMES.playing                         'tag' | 'hide' | null: a 3D game is running (you move; STORY is busy)
//   MINIGAMES.records()                       wins, stickers, phrases said, coins won and lost
//   MINIGAMES._                               engines (CHESS, CHECKERS, TTT, RPS), parsers and test hooks
// State: state.mg. Words: w.paper, w.scissors, w.chess, w.checkers, w.pawn … w.king, p.top, p.bottom (and the existing
// w.stone, p.left/middle/right, n.1–n.10). Phrases: ph.play.* (the kids) and ph.table.* (the hustlers), kind 'phrase'.
// Needs THREE (r128), core.js, toonkit.js, lexicon.js, icons.js and lines.js at load; UI, STORY, Sound, WORLD at run time.

const MINIGAMES = (() => {
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const DEG = Math.PI / 180;
  const pick = (a, R = Math.random) => a[Math.floor(R() * a.length) % a.length];
  const shuffle = (a, R = Math.random) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function lev(a, b) {
    if (a === b) return 0;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  const nrm = s => (typeof norm === 'function' ? norm(s) : String(s).toLowerCase().trim());
  let G = null;                                                     // the game (main.js)
  const lang = () => (G && G.state && LANGS.includes(G.state.lang) ? G.state.lang : (typeof UI !== 'undefined' && LANGS.includes(UI.lang) ? UI.lang : 'es'));
  const ringAt = (c, deg, r) => ({ x: c.x + Math.cos(deg * DEG) * r, z: c.z + Math.sin(deg * DEG) * r });
  const LNAME = { es: 'Spanish', pt: 'Portuguese', de: 'German', zh: 'Chinese', ja: 'Japanese' };
  // zh / ja (CJK.md): lines are in the notation; shown with readings (CJK.html), typed in characters or pinyin / rōmaji
  // (compared through CJK.canon). This file's esc shows the notation that way, and anything else as plain escaped text.
  const cj = () => { const l = lang(); return l === 'zh' || l === 'ja'; };
  const ESCH = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const esc = s => (cj() && typeof CJK !== 'undefined' && CJK.html ? CJK.html(String(s == null ? '' : s), { lang: lang() }) : ESCH(s));
  const plainTL = s => (cj() && typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(String(s == null ? '' : s), { lang: lang() }) : String(s == null ? '' : s));
  const canonCJ = (s, l = lang()) => { try { return typeof CJK !== 'undefined' && CJK.canon ? CJK.canon(String(s), l) : String(s).toLowerCase(); } catch (e) { return String(s).toLowerCase(); } };
  const pickL = (o, l = lang()) => (o[l] !== undefined ? o[l] : o.en !== undefined ? o.en : o.es);     // ({ es, pt, de, zh, ja, en }: a missing one shows the English, never another language)

  // ================================================================ places (plain data)
  // Alba's plaza (town.js): the fountain (r 3.05) in the middle, benches at 9.4, lamps at 12.6, shade trees at 135° and
  // 315°, planters at 45° and 225°, a signpost at 250°. Lola and Max chase round the 135° tree; Pedro sits by the 315° one.
  const PLAZA = { x: -10, z: -146, r: 12, play: 11.2, out: 13.6 };
  const CHALK = { x: -15.5, z: -150.3, rot: 0.55, size: 1.7 };      // the tic-tac-toe grid on the cobbles (north-west quarter)
  const HOP = { x: -12.9, z: -153.3, rot: 0.25 };                  // a hopscotch, for looks
  const KID_HOME = {
    luci: { x: -14.45, z: -149.75, yaw: -2.0, pose: 'kneel' },     // kneeling at the grid with her chalk
    sofi: { x: -16.35, z: -151.75, yaw: 0.9, pose: 'stand' },
    beto: { x: -16.95, z: -149.2, yaw: 1.9, pose: 'ball' },
  };
  // where you can hide in hide and seek (and where the kids hide): behind the fountain, a tree, the planters, two benches
  const HIDE_SPOTS = [
    { id: 'fountainE', ...ringAt(PLAZA, 15, 3.62), face: PLAZA },
    { id: 'fountainS', ...ringAt(PLAZA, 105, 3.62), face: PLAZA },
    { id: 'fountainW', ...ringAt(PLAZA, 195, 3.62), face: PLAZA },
    { id: 'fountainN', ...ringAt(PLAZA, 285, 3.62), face: PLAZA },
    { id: 'tree', ...ringAt(PLAZA, 315, 10.5), face: ringAt(PLAZA, 315, 8.4) },
    { id: 'planterE', ...ringAt(PLAZA, 45, 12.3), face: ringAt(PLAZA, 45, 10.9) },
    { id: 'planterW', ...ringAt(PLAZA, 225, 12.3), face: ringAt(PLAZA, 225, 10.9) },
    { id: 'benchS', ...ringAt(PLAZA, 112, 10.35), face: ringAt(PLAZA, 112, 9.4) },
    { id: 'benchN', ...ringAt(PLAZA, 250, 10.35), face: ringAt(PLAZA, 250, 9.4) },
  ];
  const COUNT_AT = { ...ringAt(PLAZA, 160, 3.55), face: PLAZA };    // where the seeker counts, eyes on the fountain
  // Molinar's market square (molinar.js): the well (r 1.85) and its benches, six stalls in a ring at 9.4, lamps at 13.4.
  // The two tables stand in the south-west, between the fruit stall and the clockmaker's, out of everyone's way.
  const SQUARE = { x: 215, z: -150 };
  const TABLES = {
    chess: { ...ringAt(SQUARE, 117, 12.3), id: 'chess' },
    checkers: { ...ringAt(SQUARE, 137, 12.1), id: 'checkers' },
  };
  for (const T of Object.values(TABLES)) { T.yaw = Math.atan2(SQUARE.x - T.x, SQUARE.z - T.z); T.fx = Math.sin(T.yaw); T.fz = Math.cos(T.yaw); }   // (front: toward the well)
  const TINO_AT = { ...ringAt(SQUARE, 127, 14.0) };
  const SIGN_AT = { ...ringAt(SQUARE, 126.5, 11.0) };

  // ================================================================ words, phrases, icons (registered at load, and again at init)
  const NEW_WORDS = [
    { id: 'w.paper', es: 'papel', pt: 'papel', de: 'Papier', en: 'paper', g: { es: 'm', pt: 'm', de: 'n' }, pl: { es: 'papeles', pt: 'papéis', de: 'Papiere' }, icon: 'paper' },
    { id: 'w.scissors', es: 'tijera', pt: 'tesoura', de: 'Schere', en: 'scissors', enPl: 'pairs of scissors', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'tijeras', pt: 'tesouras', de: 'Scheren' }, icon: 'scissors', alt: { es: ['tijeras', 'las tijeras'] } },
    { id: 'w.chess', es: 'ajedrez', pt: 'xadrez', de: 'Schach', en: 'chess', g: { es: 'm', pt: 'm', de: 'n' }, icon: 'chess' },
    { id: 'w.checkers', es: 'damas', pt: 'damas', de: 'Dame', en: 'checkers', icon: 'checkers', alt: { es: ['las damas'], pt: ['as damas', 'jogo de damas'], de: ['Damespiel', 'das Damespiel'] } },
    { id: 'w.pawn', es: 'peón', pt: 'peão', de: 'Bauer', en: 'pawn', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'peones', pt: 'peões', de: 'Bauern' }, icon: 'pawn' },
    { id: 'w.knight', es: 'caballo', pt: 'cavalo', de: 'Springer', en: 'knight', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'caballos', pt: 'cavalos', de: 'Springer' }, icon: 'knight', alt: { de: ['Pferd', 'das Pferd'] } },
    { id: 'w.bishop', es: 'alfil', pt: 'bispo', de: 'Läufer', en: 'bishop', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'alfiles', pt: 'bispos', de: 'Läufer' }, icon: 'bishop' },
    { id: 'w.rook', es: 'torre', pt: 'torre', de: 'Turm', en: 'rook', g: { es: 'f', pt: 'f', de: 'm' }, pl: { es: 'torres', pt: 'torres', de: 'Türme' }, icon: 'rook' },
    { id: 'w.queen', es: 'dama', pt: 'dama', de: 'Dame', en: 'queen', g: { es: 'f', pt: 'f', de: 'f' }, pl: { es: 'damas', pt: 'damas', de: 'Damen' }, icon: 'queen', alt: { es: ['reina', 'la reina'], pt: ['rainha', 'a rainha'], de: ['Königin', 'die Königin'] } },
    { id: 'w.king', es: 'rey', pt: 'rei', de: 'König', en: 'king', g: { es: 'm', pt: 'm', de: 'm' }, pl: { es: 'reyes', pt: 'reis', de: 'Könige' }, icon: 'king' },
    // up and down, for the tic-tac-toe squares (left / middle / right are battle/'s p.left, p.middle, p.right)
    { id: 'p.top', kind: 'position', es: 'arriba', pt: 'em cima', de: 'oben', en: 'top', icon: 'ptop', alt: { pt: ['encima', 'cima'] } },
    { id: 'p.bottom', kind: 'position', es: 'abajo', pt: 'embaixo', de: 'unten', en: 'bottom', icon: 'pbottom', alt: { pt: ['em baixo', 'baixo'] } },
    // the prize for winning all four of the kids' games (a key item, not a word to teach)
    { id: 'k.medal', kind: 'key', es: 'medalla de la plaza', pt: 'medalha da praça', de: 'Platzmedaille', en: 'Plaza medal', g: { es: 'f', pt: 'f', de: 'f' }, icon: 'medal' },
  ];
  // Taunts and expressions, as they're really said (kind 'phrase', for the journal's Phrasebook). `f`: the form for a girl
  // (the kids are Sofi and Luci, girls, and Beto, a boy: «¡Eres muy lento!» to him, «¡Eres muy lenta!» to them).
  const PHRASES = [
    // the kids: tag
    { id: 'ph.play.cantCatch', es: '¡No me atrapas!', pt: 'Não me pega!', de: 'Du kriegst mich nicht!', en: 'You can’t catch me!', icon: 'taunt',
      note: 'Teasing whoever is “it” in tag.', alt: { es: ['¡No me alcanzas!', '¡No me agarras!', '¡No me pillas!'], pt: ['Você não me pega!', 'Não consegue me pegar!'], de: ['Du fängst mich nicht!', 'Du kriegst mich nie!'] } },
    { id: 'ph.play.slow', es: '¡Eres muy lento!', pt: 'Lerdo!', de: 'Lahme Ente!', en: 'You’re so slow! / Slowpoke!', icon: 'taunt', f: { es: '¡Eres muy lenta!', pt: 'Lerda!' },
      notes: { es: 'Cheeky, between friends. It agrees with who you tease: «lento» to a boy, «lenta» to a girl.', pt: 'Cheeky, between friends. It agrees with who you tease: «lerdo» to a boy, «lerda» to a girl.', de: 'Cheeky, between friends: a “lame duck”. It fits anyone.' },
      alt: { es: ['¡Eres muy lenta!', '¡Qué lento!', '¡Qué lenta!', '¡Eres lento!', '¡Eres lenta!'], pt: ['Lerda!', 'Que lerdo!', 'Que lerda!', 'Seu lerdo!', 'Sua lerda!'], de: ['Du lahme Ente!', 'Du bist so lahm!'] } },
    { id: 'ph.play.youreIt', es: '¡Tú la llevas!', pt: 'Tá com você!', de: 'Du bist dran!', en: 'You’re it!', icon: 'tag',
      notes: { es: 'Tag: whoever “carries it” («la llevas») has to catch the others. Kids also just shout «¡Te toca!».', pt: 'Tag: «tá com você», it’s with you now, so you have to catch the others.', de: 'Tag: whoever is «dran» has to catch the others.' }, alt: { es: ['¡La llevas!', '¡Te toca!', '¡Tú la traes!', '¡Las traes!'], pt: ['Está com você!', 'Tá contigo!', 'Com você!'], de: ['Du bist!', 'Du fängst!'] } },
    { id: 'ph.play.gotYou', es: '¡Te atrapé!', pt: 'Peguei!', de: 'Hab dich!', en: 'Got you!', icon: 'tag',
      note: 'When you tag someone (or catch them out).', alt: { es: ['¡Te pillé!', '¡Te agarré!'], pt: ['Te peguei!', 'Peguei você!'], de: ['Ich hab dich!'] } },
    { id: 'ph.play.almost', es: '¡Uy, casi!', pt: 'Quase!', de: 'Fast!', en: 'So close!', icon: 'taunt',
      note: 'When someone nearly gets you.', alt: { es: ['¡Casi!', '¡Ay, casi!'], pt: ['Foi quase!', 'Ai, quase!', 'Ih, quase!'], de: ['Knapp!', 'Beinahe!', 'Fast hättest du mich!'] } },
    { id: 'ph.play.noFair', es: '¡No vale!', pt: 'Não vale!', de: 'Das gilt nicht!', en: 'No fair! / That doesn’t count!', icon: 'taunt',
      note: 'When someone breaks the rules… or just wins.', alt: { es: ['¡Eso no vale!'], pt: ['Isso não vale!'], de: ['Gilt nicht!', 'Das ist unfair!', 'Unfair!'] } },
    { id: 'ph.play.canIPlay', es: '¿Puedo jugar?', pt: 'Posso brincar?', de: 'Darf ich mitspielen?', en: 'Can I play?', icon: 'speech',
      notes: { es: 'Asking to join a game.', pt: 'Asking to join a game. Kids «brincam» (play around); you «jogar» a match.', de: 'Asking to join a game: «mitspielen», to play along.' },
      alt: { es: ['¿Puedo jugar con ustedes?', '¿Puedo jugar también?', '¿Puedo jugar yo?'], pt: ['Posso jogar?', 'Posso brincar também?', 'Posso brincar com vocês?'], de: ['Kann ich mitspielen?', 'Darf ich mitmachen?', 'Kann ich mitmachen?'] } },
    { id: 'ph.play.again', es: '¡Otra vez!', pt: 'De novo!', de: 'Nochmal!', en: 'Again!', icon: 'speech',
      note: 'To play another round.', alt: { es: ['¡Otra!', '¡Otra más!', '¡Una más!'], pt: ['Mais uma!', 'Outra vez!'], de: ['Noch mal!', 'Noch einmal!', 'Nochmal bitte!'] } },
    { id: 'ph.play.iWon', es: '¡Gané!', pt: 'Ganhei!', de: 'Gewonnen!', en: 'I won!', icon: 'taunt',
      note: 'Shouted, usually with a little dance.', alt: { es: ['¡Yo gané!', '¡Te gané!'], pt: ['Eu ganhei!', 'Ganhei de você!'], de: ['Ich hab gewonnen!', 'Ich habe gewonnen!'] } },
    { id: 'ph.play.yourTurn', es: '¡Te toca!', pt: 'Sua vez!', de: 'Jetzt du!', en: 'Your turn!', icon: 'speech',
      notes: { es: 'Taking turns in any game. In tag, «¡Te toca!» also means “you’re it!”.', pt: 'Taking turns, in any game.', de: 'Taking turns, in any game.' }, alt: { es: ['¡Te toca a ti!'], pt: ['É sua vez!', 'Agora é você!'], de: ['Du bist am Zug!', 'Jetzt bist du dran!'] } },
    { id: 'ph.play.draw', es: '¡Empate!', pt: 'Deu velha!', de: 'Unentschieden!', en: 'It’s a tie!', icon: 'speech',
      notes: { es: 'A tie, in any game.', pt: 'A tie. A tied «jogo da velha» is «deu velha»: the old lady won.', de: 'A tie, in any game.' }, alt: { pt: ['Empate!', 'Empatou!', 'Velha!'], de: ['Gleichstand!'] } },
    // the kids: hide and seek
    { id: 'ph.play.readyOrNot', es: '¡Listos o no, allá voy!', pt: 'Lá vou eu!', de: 'Ich komme!', en: 'Ready or not, here I come!', icon: 'hide',
      note: 'Shouted after counting, in hide and seek.', alt: { es: ['¡Listos o no, ahí voy!', '¡Allá voy!', '¡Ahí voy!'], pt: ['Prontos ou não, lá vou eu!', 'Lá vou!'], de: ['Fertig oder nicht, ich komme!', 'Ich komme jetzt!'] } },
    { id: 'ph.play.found', es: '¡Te encontré!', pt: 'Te achei!', de: 'Gefunden!', en: 'Found you!', icon: 'hide',
      notes: { es: 'Hide and seek, when you find someone.', pt: 'Hide and seek. Brazilians «acham» (find) people: «achei!».', de: 'Hide and seek: “found!”.' }, alt: { es: ['¡Te encontre!', '¡Encontrado!'], pt: ['Achei você!', 'Achei!', 'Achei vocês!'], de: ['Ich hab dich gefunden!', 'Hab dich gefunden!'] } },
    { id: 'ph.play.iSeeYou', es: '¡Te veo!', pt: 'Tô te vendo!', de: 'Ich seh dich!', en: 'I see you!', icon: 'hide',
      note: 'When someone didn’t hide very well.', alt: { pt: ['Estou te vendo!', 'Te vi!'], de: ['Ich sehe dich!'] } },
    { id: 'ph.play.whereAreYou', es: '¿Dónde estás?', pt: 'Cadê você?', de: 'Wo bist du?', en: 'Where are you?', icon: 'hide',
      notes: { es: 'Looking for someone.', pt: '«Cadê?» is everyday Brazilian for “where is…?”.', de: 'Looking for someone.' }, alt: { pt: ['Onde você está?', 'Onde você tá?'] } },
    // the hustlers: chess and checkers
    { id: 'ph.table.aGame', es: '¿Una partidita por cinco monedas?', pt: 'Uma partidinha por cinco moedas?', de: 'Ein Spielchen um fünf Münzen?', en: 'A little game for five coins?', icon: 'coin',
      notes: { es: 'How the old hustlers reel you in. «-ita» makes it sound small and harmless. It isn’t.', pt: 'How the old hustlers reel you in. «-inha» makes it sound small and harmless. It isn’t.', de: 'How the old hustlers reel you in. «-chen» makes it sound small and harmless. It isn’t.' } },
    { id: 'ph.table.check', es: '¡Jaque!', pt: 'Xeque!', de: 'Schach!', en: 'Check!', icon: 'king', note: 'Your king is attacked: deal with it!' },
    { id: 'ph.table.mate', es: '¡Jaque mate!', pt: 'Xeque-mate!', de: 'Schachmatt!', en: 'Checkmate!', icon: 'king',
      note: 'Game over: the king can’t escape.', alt: { es: ['¡Jaquemate!', '¡Mate!'], pt: ['Xeque mate!', 'Mate!'], de: ['Matt!', 'Schach matt!'] } },
    { id: 'ph.table.tookKnight', es: '¡Te comí el caballo!', pt: 'Comi seu cavalo!', de: 'Ich hab deinen Springer geschlagen!', en: 'I took your knight!', icon: 'knight',
      notes: { es: 'You “eat” pieces («comer»). Swap in any piece: «¡Te comí la torre!».', pt: 'You “eat” pieces («comer»). Swap in any piece: «Comi sua torre!».', de: 'You “hit” pieces («schlagen»). Swap in any piece: «Ich hab deinen Turm geschlagen!».' },
      alt: { pt: ['Comi o seu cavalo!'], de: ['Dein Springer ist weg!'] } },
    { id: 'ph.table.niceMove', es: '¡Buena jugada!', pt: 'Boa jogada!', de: 'Guter Zug!', en: 'Nice move!', icon: 'speech',
      note: 'Good manners at the board (the hustlers love flattery).', alt: { es: ['¡Qué buena jugada!', '¡Bien jugado!'], pt: ['Que jogada!', 'Bela jogada!', 'Bem jogado!'], de: ['Schöner Zug!', 'Toller Zug!', 'Gut gespielt!'] } },
    { id: 'ph.table.giveUp', es: '¡Me rindo!', pt: 'Desisto!', de: 'Ich gebe auf!', en: 'I give up!', icon: 'speech',
      note: 'Resigning. (Type it at the board to resign.)', alt: { pt: ['Eu desisto!', 'Me rendo!'], de: ['Ich geb auf!', 'Aufgeben!'] } },
    { id: 'ph.table.chessDraw', es: '¡Tablas!', pt: 'Empate!', de: 'Remis!', en: 'Draw!', icon: 'speech',
      notes: { es: 'A draw in chess and checkers: «tablas» (boards!).', pt: 'A draw, in chess and checkers.', de: 'A draw in chess and checkers (from French).' }, alt: { de: ['Unentschieden!'] } },
    { id: 'ph.table.payUp', es: '¡A pagar!', pt: 'Pode pagar!', de: 'Her mit den Münzen!', en: 'Pay up!', icon: 'coin',
      note: 'What a hustler says when you lose.', alt: { es: ['¡Paga!', '¡Págame!'], pt: ['Paga aí!', 'Me paga!'], de: ['Zahl!', 'Zahltag!'] } },
    { id: 'ph.table.knewIt', es: '¡Lo sabía!', pt: 'Eu sabia!', de: 'Wusste ich’s doch!', en: 'I knew it!', icon: 'taunt',
      note: 'Smug, after a move they saw coming.', alt: { pt: ['Sabia!'], de: ['Wusste ich es doch!', 'Hab ich doch gewusst!', 'Ich wusste es!'] } },
    { id: 'ph.table.mustTake', es: '¡Tienes que comer!', pt: 'Tem que comer!', de: 'Du musst schlagen!', en: 'You have to take!', icon: 'checkers',
      note: 'Checkers: if you can capture, you must.', alt: { es: ['¡Hay que comer!'], pt: ['Tem que comer, hein!'] } },
  ];
  // zh / ja (CJK.md): the words, and the phrases as kids and players really say them there (tag's «it» is the 鬼, a ghost /
  // an ogre; a Japanese kid joins a game with «入れて!»; the seeker calls «もういいかい?»; a Japanese player resigns with
  // «参りました»). Merged into the tables above before they're registered.
  {
    const CW = {
      'w.paper': { zh: '[纸|zhǐ]', ja: '[紙|かみ]', pl: { zh: '[纸|zhǐ]', ja: '[紙|かみ]' }, alt: { zh: ['[布|bù]'], ja: ['かみ', 'パー'] } },
      'w.scissors': { zh: '[剪刀|jiǎn dāo]', ja: 'はさみ', pl: { zh: '[剪刀|jiǎn dāo]', ja: 'はさみ' }, alt: { ja: ['チョキ', 'ハサミ'] } },
      'w.chess': { zh: '[国际象棋|guó jì xiàng qí]', ja: 'チェス', alt: { zh: ['[象棋|xiàng qí]'] } },
      'w.checkers': { zh: '[跳棋|tiào qí]', ja: 'チェッカー', alt: { zh: ['[西洋跳棋|xī yáng tiào qí]', '[国际跳棋|guó jì tiào qí]'] } },
      'w.pawn': { zh: '[兵|bīng]', ja: 'ポーン', pl: { zh: '[兵|bīng]', ja: 'ポーン' }, alt: { zh: ['[卒|zú]'] } },
      'w.knight': { zh: '[马|mǎ]', ja: 'ナイト', pl: { zh: '[马|mǎ]', ja: 'ナイト' } },
      'w.bishop': { zh: '[象|xiàng]', ja: 'ビショップ', pl: { zh: '[象|xiàng]', ja: 'ビショップ' } },
      'w.rook': { zh: '[车|jū]', ja: 'ルーク', pl: { zh: '[车|jū]', ja: 'ルーク' } },
      'w.queen': { zh: '[后|hòu]', ja: 'クイーン', pl: { zh: '[后|hòu]', ja: 'クイーン' }, alt: { zh: ['[皇后|huáng hòu]'] } },
      'w.king': { zh: '[王|wáng]', ja: 'キング', pl: { zh: '[王|wáng]', ja: 'キング' }, alt: { zh: ['[国王|guó wáng]'] } },
      'p.top': { zh: '[上|shàng]', ja: '[上|うえ]', alt: { zh: ['[上面|shàng miàn]', '[上边|shàng bian]'], ja: ['うえ'] } },
      'p.bottom': { zh: '[下|xià]', ja: '[下|した]', alt: { zh: ['[下面|xià miàn]', '[下边|xià bian]'], ja: ['した'] } },
      'k.medal': { zh: '[广场|guǎng chǎng] [奖牌|jiǎng pái]', ja: '[広場|ひろば] の メダル' },
    };
    for (const w of NEW_WORDS) { const c = CW[w.id]; if (!c) continue; w.zh = c.zh; w.ja = c.ja; if (c.pl) w.pl = Object.assign(w.pl || {}, c.pl); if (c.alt) w.alt = Object.assign(w.alt || {}, c.alt); }
    const CP = {
      'ph.play.cantCatch': { zh: '[你|nǐ] [抓不到|zhuā bu dào] [我|wǒ] ！', ja: '[鬼|おに]さん 、 こちら ！', alt: { zh: ['[抓不到|zhuā bu dào] [我|wǒ] ！', '[来|lái] [抓|zhuā] [我|wǒ] [呀|ya] ！'], ja: ['つかまらない よ ！', 'つかまえて みて ！', 'おにさん こちら ！'] },
        notes: { zh: 'Teasing whoever is “it” in tag (the 鬼, the ghost).', ja: 'The classic tag taunt: “this way, Mr. Ogre!” (the 鬼 is whoever is it). Kids clap as they sing it.' } },
      'ph.play.slow': { zh: '[你|nǐ] [好|hǎo] [慢|màn] ！', ja: 'おそい ！', alt: { zh: ['[太|tài] [慢|màn] [了|le] ！', '[慢|màn] [死|sǐ] [了|le] ！'], ja: ['おっそーい ！', 'のろま ！'] },
        notes: { zh: 'Cheeky, between friends. It fits anyone.', ja: 'Cheeky, between friends. It fits anyone.' } },
      'ph.play.youreIt': { zh: '[你|nǐ] [当|dāng] [鬼|guǐ] ！', ja: '[鬼|おに] だ よ ！', alt: { zh: ['[你|nǐ] [是|shì] [鬼|guǐ] ！', '[该|gāi] [你|nǐ] [当|dāng] [鬼|guǐ] [了|le] ！'], ja: ['タッチ ！', 'おに だ よ ！'] },
        notes: { zh: 'Tag: whoever is “it” is the 鬼 (ghost), and has to catch the others.', ja: 'Tag is 鬼ごっこ: whoever is “it” is the 鬼, the ogre. タッチ! (touch!) passes it on.' } },
      'ph.play.gotYou': { zh: '[抓到|zhuā dào] [你|nǐ] [了|le] ！', ja: 'つかまえた ！', alt: { zh: ['[抓住|zhuā zhù] [你|nǐ] [了|le] ！'], ja: ['タッチ ！'] } },
      'ph.play.almost': { zh: '[差|chà] [一点|yī diǎn] ！', ja: 'おしい ！', alt: { zh: ['[就|jiù] [差|chà] [一点|yī diǎn] ！'], ja: ['あぶない ！', 'もう ちょっと ！'] } },
      'ph.play.noFair': { zh: '[不|bù] [算|suàn] ！', ja: 'ずるい ！', alt: { zh: ['[这|zhè] [不|bù] [算|suàn] ！', '[耍赖|shuǎ lài] ！'], ja: ['ずるーい ！', 'なし ！'] } },
      'ph.play.canIPlay': { zh: '[我|wǒ] [可以|kě yǐ] [一起|yī qǐ] [玩|wán] [吗|ma] ？', ja: '[入|い]れて ！', alt: { zh: ['[我|wǒ] [能|néng] [一起|yī qǐ] [玩|wán] [吗|ma] ？', '[带|dài] [我|wǒ] [一起|yī qǐ] [玩|wán] [吧|ba] ！'], ja: ['いれて ！', '[入|い]れて よ ！', 'いっしょ に [遊|あそ]んで も いい ？'] },
        notes: { zh: 'Asking to join a game.', ja: 'How kids join a game: “let me in!” The answer is いいよ! (sure!).' } },
      'ph.play.again': { zh: '[再|zài] [来|lái] [一|yī] [次|cì] ！', ja: 'もう [一回|いっかい] ！', alt: { zh: ['[再|zài] [来|lái] ！', '[再|zài] [玩|wán] [一|yī] [次|cì] ！'], ja: ['もう いっかい ！'] } },
      'ph.play.iWon': { zh: '[我|wǒ] [赢|yíng] [了|le] ！', ja: '[勝|か]った ！', alt: { zh: ['[赢|yíng] [了|le] ！'], ja: ['かった ！', 'やった ！ [勝|か]った ！'] } },
      'ph.play.yourTurn': { zh: '[该|gāi] [你|nǐ] [了|le] ！', ja: '[番|ばん] だ よ ！', alt: { zh: ['[轮到|lún dào] [你|nǐ] [了|le] ！'], ja: ['どうぞ ！', 'ばん だ よ ！'] } },
      'ph.play.draw': { zh: '[平局|píng jú] ！', ja: '[引|ひ]き[分|わ]け ！', alt: { zh: ['[打|dǎ] [平|píng] [了|le] ！', '[平手|píng shǒu] ！'], ja: ['ひきわけ ！', 'あいこ ！'] },
        notes: { zh: 'A tie, in any game.', ja: 'A tie. In じゃんけん a tie is あいこ, and you go again at once: «あいこでしょ!».' } },
      'ph.play.readyOrNot': { zh: '[藏好|cáng hǎo] [了|le] [吗|ma] ？ [我|wǒ] [来|lái] [了|le] ！', ja: 'もう いい かい ？', alt: { zh: ['[我|wǒ] [来|lái] [了|le] ！', '[我|wǒ] [要|yào] [来|lái] [找|zhǎo] [了|le] ！'], ja: ['もういいかい', 'いく よ ！'] },
        notes: { zh: 'Shouted after counting: “hidden yet? Here I come!”', ja: 'The seeker calls “もういいかい?” (ready yet?). The hiders answer “まあだだよ!” (not yet!) or “もういいよ!” (ready!).' } },
      'ph.play.found': { zh: '[找到|zhǎo dào] [你|nǐ] [了|le] ！', ja: '[見|み]つけた ！', alt: { zh: ['[找到|zhǎo dào] [了|le] ！'], ja: ['みつけた ！'] } },
      'ph.play.iSeeYou': { zh: '[我|wǒ] [看见|kàn jiàn] [你|nǐ] [了|le] ！', ja: '[見|み]えて る よ ！', alt: { zh: ['[看见|kàn jiàn] [你|nǐ] [了|le] ！'], ja: ['みえてる よ ！'] } },
      'ph.play.whereAreYou': { zh: '[你|nǐ] [在|zài] [哪里|nǎ lǐ] ？', ja: 'どこ に いる の ？', alt: { zh: ['[你|nǐ] [在|zài] [哪|nǎ] [呢|ne] ？'], ja: ['どこ ？', 'どこ に いる ？'] } },
      'ph.table.aGame': { zh: '[来|lái] [一|yī] [盘|pán] [吧|ba] ？ [五|wǔ] [枚|méi] [金币|jīn bì] 。', ja: '[一局|いっきょく] いかが です か ？ [五枚|ごまい] で 。',
        notes: { zh: 'How the old hustlers reel you in: “just one little game”.', ja: 'How the old hustlers reel you in, politely: “a game, for five coins?”' } },
      'ph.table.check': { zh: '[将军|jiāng jūn] ！', ja: 'チェック ！', notes: { zh: '将军 (“general!”): check, in chess as in Chinese chess.', ja: 'Your king is attacked: deal with it!' } },
      'ph.table.mate': { zh: '[将死|jiāng sǐ] [了|le] ！', ja: 'チェックメイト ！', alt: { zh: ['[将死|jiāng sǐ] ！'], ja: ['メイト ！'] } },
      'ph.table.tookKnight': { zh: '[我|wǒ] [吃|chī] [了|le] [你|nǐ] [的|de] [马|mǎ] ！', ja: 'ナイト を いただきました ！', alt: { zh: ['[吃|chī] [掉|diào] [你|nǐ] [的|de] [马|mǎ] [了|le] ！'], ja: ['ナイト 、 いただき ！'] },
        notes: { zh: 'You “eat” pieces (吃). Swap in any piece: 我吃了你的车！', ja: 'Polite, and smug: “I’ll be taking your knight.” Swap in any piece: ルークをいただきました！' } },
      'ph.table.niceMove': { zh: '[好|hǎo] [棋|qí] ！', ja: 'いい [手|て] です ね ！', alt: { zh: ['[走|zǒu] [得|de] [好|hǎo] ！', '[这|zhè] [步|bù] [棋|qí] [真|zhēn] [好|hǎo] ！'], ja: ['いい [手|て] だ ね ！', 'うまい ！'] } },
      'ph.table.giveUp': { zh: '[我|wǒ] [认输|rèn shū] ！', ja: '[参|まい]りました 。', alt: { zh: ['[认输|rèn shū] ！', '[我|wǒ] [输|shū] [了|le] ！'], ja: ['まいりました', '[参|まい]った ！'] },
        notes: { zh: 'Resigning. (Type it at the board to resign.)', ja: 'How a Japanese player resigns at the board, with a little bow. (Type it at the board to resign.)' } },
      'ph.table.chessDraw': { zh: '[和棋|hé qí] ！', ja: '[引|ひ]き[分|わ]け です 。', alt: { zh: ['[平局|píng jú] ！'], ja: ['ひきわけ ！', '[引|ひ]き[分|わ]け ！'] } },
      'ph.table.payUp': { zh: '[给|gěi] [钱|qián] [吧|ba] ！', ja: 'では 、 コイン を いただきます 。', alt: { zh: ['[付|fù] [钱|qián] ！'], ja: ['コイン を どうぞ 。'] } },
      'ph.table.knewIt': { zh: '[我|wǒ] [就|jiù] [知道|zhī dào] ！', ja: 'やっぱり ！', alt: { zh: ['[我|wǒ] [早|zǎo] [就|jiù] [知道|zhī dào] [了|le] ！'], ja: ['やっぱり ね ！'] } },
      'ph.table.mustTake': { zh: '[你|nǐ] [得|děi] [吃|chī] ！', ja: '[取|と]らなきゃ だめ です よ ！', alt: { zh: ['[必须|bì xū] [吃|chī] ！'], ja: ['[取|と]らなきゃ だめ ！'] } },
    };
    for (const p of PHRASES) {
      const c = CP[p.id]; if (!c) continue;
      p.zh = c.zh; p.ja = c.ja;
      if (c.alt) p.alt = Object.assign(p.alt || {}, c.alt);
      if (c.notes) p.notes = Object.assign(p.notes || (p.note ? { es: p.note, pt: p.note, de: p.note } : {}), c.notes);
    }
  }
  const PH = {}; PHRASES.forEach(p => { PH[p.id] = p; });
  const noteOf = p => (p && p.notes ? p.notes[lang()] || '' : (p && p.note) || '');      // (notes about one language are only shown in it)
  // the words for counting (hide and seek): shop.js registers n.1–n.20; these are the fallback
  const NUMS = {
    es: ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez'],
    pt: ['um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'],
    de: ['eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn'],
    zh: ['[一|yī]', '[二|èr]', '[三|sān]', '[四|sì]', '[五|wǔ]', '[六|liù]', '[七|qī]', '[八|bā]', '[九|jiǔ]', '[十|shí]'],
    ja: ['いち', 'に', 'さん', 'し', 'ご', 'ろく', 'しち', 'はち', 'きゅう', 'じゅう'],      // (counting aloud in hide and seek: し, しち; よん and なな count too)
  };
  const NUM_ALT = { ja: { 4: ['よん'], 7: ['なな'], 9: ['く'] }, zh: { 2: ['[两|liǎng]'] } };
  const numWord = (n, l = lang()) => (typeof LEX !== 'undefined' && LEX.item('n.' + n) && LEX.item('n.' + n)[l]) || NUMS[l][n - 1];
  function registerItems() {
    if (typeof LEX === 'undefined') return;
    for (const w of NEW_WORDS) if (!LEX.item(w.id)) LEX.register([Object.assign({ kind: 'word' }, w)]);
    for (const p of PHRASES) if (!LEX.item(p.id)) {
      const it = Object.assign({ kind: 'phrase', register: 'casual' }, p);
      if (p.notes) Object.defineProperty(it, 'note', { get: () => noteOf(p), enumerable: true, configurable: true });     // (the journal's Phrasebook reads it.note)
      LEX.register([it]);
    }
    if (typeof WORDS !== 'undefined' && Array.isArray(WORDS)) for (const w of NEW_WORDS) if ((!w.kind || w.kind === 'word') && !WORDS.some(x => x.id === w.id)) WORDS.push(LEX.item(w.id));   // (the journal's word cards list WORDS)
  }
  registerItems();

  const DARK_PIECE = '#4a3d5c';
  function registerIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const has = k => ICONS.keys.includes(k);
    const line = (c, pts, w = 2.2, col) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) c.lineTo(p[0], p[1]); c.lineWidth = w; c.strokeStyle = col || ICONS.H.INK; c.stroke(); };
    const add = (k, fn) => { if (!has(k)) ICONS.add(k, fn); };
    add('paper', (c, p, h) => {
      h.shape(c, p, h.poly([[-24, -32], [14, -32], [26, -20], [26, 32], [-24, 32]]), '#fffaf0');
      h.shape(c, p, h.poly([[14, -32], [14, -20], [26, -20]]), '#e8e0cc', 1.6);
      if (p) [-14, -4, 6, 16].forEach(y => line(c, [[-16, y], [18, y]], 1.6, 'rgba(70,110,170,0.5)'));
    });
    add('scissors', (c, p, h) => {
      h.shape(c, p, h.poly([[-4, -2], [26, -34], [32, -28], [4, 4]]), '#c9ced8');
      h.shape(c, p, h.poly([[4, -2], [-26, -34], [-32, -28], [-4, 4]]), '#dfe3ea');
      h.shape(c, p, h.ell(-14, 20, 11, 11), '#e0503f'); h.shape(c, p, h.ell(14, 20, 11, 11), '#e0503f');
      if (p) { h.dot(c, -14, 20, 5, '#fffaf0'); h.dot(c, 14, 20, 5, '#fffaf0'); h.dot(c, 0, 0, 3, h.INK); }
    });
    // chess pieces, as paper cutouts: cream with an ink line
    const base = (h, c, p, col) => h.shape(c, p, h.rr(-22, 22, 44, 10, 4), col);
    const PIECE = {
      pawn(c, p, h, col) { base(h, c, p, col); h.shape(c, p, h.poly([[-15, 22], [-8, -6], [8, -6], [15, 22]]), col); h.shape(c, p, h.ell(0, -16, 12, 12), col); },
      rook(c, p, h, col) { base(h, c, p, col); h.shape(c, p, h.poly([[-15, 22], [-12, -12], [12, -12], [15, 22]]), col); h.shape(c, p, h.poly([[-18, -12], [-18, -30], [-10, -30], [-10, -22], [-3, -22], [-3, -30], [3, -30], [3, -22], [10, -22], [10, -30], [18, -30], [18, -12]]), col); },
      knight(c, p, h, col) { base(h, c, p, col); h.shape(c, p, h.poly([[-16, 22], [-10, 0], [-24, -4], [-22, -16], [-6, -30], [0, -40], [4, -30], [16, -18], [18, 4], [16, 22]]), col); if (p) h.dot(c, -6, -18, 2.6, col === DARK_PIECE ? '#fffaf0' : h.INK); },
      bishop(c, p, h, col) { base(h, c, p, col); h.shape(c, p, h.poly([[-14, 22], [-8, 4], [8, 4], [14, 22]]), col); h.shape(c, p, h.ell(0, -10, 12, 17), col); h.shape(c, p, h.ell(0, -31, 5, 5), col); if (p) line(c, [[-3, -18], [6, -8]], 2.4); },
      queen(c, p, h, col) { base(h, c, p, col); h.shape(c, p, h.poly([[-15, 22], [-10, 0], [10, 0], [15, 22]]), col); h.shape(c, p, h.poly([[-18, 0], [-22, -24], [-10, -10], [0, -30], [10, -10], [22, -24], [18, 0]]), col); if (p) [-22, 0, 22].forEach((x, i) => h.dot(c, x, i === 1 ? -32 : -26, 4, col)); },
      king(c, p, h, col) { base(h, c, p, col); h.shape(c, p, h.poly([[-15, 22], [-10, 0], [10, 0], [15, 22]]), col); h.shape(c, p, h.poly([[-16, 0], [-18, -20], [18, -20], [16, 0]]), col); h.shape(c, p, h.poly([[-3, -20], [-3, -28], [-9, -28], [-9, -33], [-3, -33], [-3, -40], [3, -40], [3, -33], [9, -33], [9, -28], [3, -28], [3, -20]]), col); },
    };
    for (const [k, fn] of Object.entries(PIECE)) { add(k, (c, p, h) => fn(c, p, h, '#f7ecd2')); add(k + 'B', (c, p, h) => fn(c, p, h, DARK_PIECE)); }
    add('chess', (c, p, h) => { if (p) { c.save(); c.globalAlpha = 0.9; } h.shape(c, p, h.rr(-34, 16, 68, 18, 4), '#c9955a'); if (p) c.restore(); PIECE.knight(c, p, h, '#f7ecd2'); });
    add('checkers', (c, p, h) => {
      h.shape(c, p, h.ell(0, 18, 30, 11), '#c9443a'); h.shape(c, p, h.ell(0, 10, 30, 11), '#e05a4b');
      h.shape(c, p, h.ell(0, -2, 30, 11), '#2f2a3a'); h.shape(c, p, h.ell(0, -10, 30, 11), '#4a4256');
      if (p) { h.shape(c, 1, h.ell(0, -10, 19, 6), null, 1.4); h.shape(c, 1, h.poly([[-10, -12], [-6, -20], [0, -13], [6, -20], [10, -12]]), '#f2c14e', 1.4); }
    });
    add('ptop', (c, p, h) => { h.shape(c, p, h.rr(-30, -30, 60, 60, 8), '#fffaf0'); h.shape(c, p, h.poly([[-14, 14], [0, -18], [14, 14]]), '#21a493'); if (p) [[-30, -10, 30, -10]].forEach(() => {}); });
    add('pbottom', (c, p, h) => { h.shape(c, p, h.rr(-30, -30, 60, 60, 8), '#fffaf0'); h.shape(c, p, h.poly([[-14, -14], [0, 18], [14, -14]]), '#21a493'); });
    add('medal', (c, p, h) => {
      h.shape(c, p, h.poly([[-16, -36], [-4, -36], [4, -6], [-8, -6]]), '#e0503f'); h.shape(c, p, h.poly([[16, -36], [4, -36], [-4, -6], [8, -6]]), '#3f7fc9');
      h.shape(c, p, h.ell(0, 12, 20, 20), '#ffcf3f');
      if (p) { h.shape(c, 1, h.ell(0, 12, 13, 13), '#ffd96b', 1.4); h.shape(c, 1, k => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4 : 9; if (i) k.lineTo(Math.cos(a) * r, 12 + Math.sin(a) * r); else k.moveTo(Math.cos(a) * r, 12 + Math.sin(a) * r); } k.closePath(); }, '#f0a020', 1.2); }
    });
    add('taunt', (c, p, h) => {      // a cheeky face sticking its tongue out
      h.shape(c, p, h.ell(0, 0, 28, 28), '#ffd84a');
      if (p) { h.dot(c, -10, -7, 3.4, h.INK); c.beginPath(); c.moveTo(6, -10); c.lineTo(15, -6); c.lineTo(6, -2); c.lineWidth = 2.4; c.strokeStyle = h.INK; c.stroke(); c.beginPath(); c.arc(0, 8, 12, 0.15, Math.PI - 0.15); c.stroke(); }
      h.shape(c, p, k => { k.moveTo(-5, 13); k.lineTo(5, 13); k.quadraticCurveTo(6, 26, 0, 26); k.quadraticCurveTo(-6, 26, -5, 13); k.closePath(); }, '#ff8c9a', 1.8);
    });
    add('speech', (c, p, h) => { h.shape(c, p, k => { k.moveTo(-30, -22); k.lineTo(30, -22); k.lineTo(30, 14); k.lineTo(2, 14); k.lineTo(-12, 28); k.lineTo(-10, 14); k.lineTo(-30, 14); k.closePath(); }, '#fffaf0'); if (p) [-14, 0, 14].forEach(x => h.dot(c, x, -4, 4, '#21a493')); });
    add('tag', (c, p, h) => {        // a kid running, arms out
      h.shape(c, p, h.ell(-4, 4, 12, 16, 0.3), '#4f9a5a'); h.shape(c, p, h.ell(4, -20, 10, 10), '#e6b48c');
      if (p) { line(c, [[-12, 18], [-24, 30]], 4); line(c, [[2, 18], [10, 32]], 4); line(c, [[-12, -2], [-28, -10]], 4); line(c, [[6, -2], [24, -12]], 4); [[22, 8], [26, 14], [20, 20]].forEach(([x, y]) => line(c, [[x, y], [x + 8, y]], 2)); h.dot(c, 7, -21, 2, h.INK); }
    });
    add('hide', (c, p, h) => {       // two eyes peeking over a wall
      h.shape(c, p, h.ell(0, -6, 20, 16), '#e6b48c'); h.shape(c, p, h.rr(-34, 2, 68, 30, 4), '#c9b89a');
      if (p) { h.dot(c, -7, -8, 3, h.INK); h.dot(c, 7, -8, 3, h.INK); [[-24, 12, -6, 12], [6, 22, 26, 22]].forEach(([a, b, d, e]) => line(c, [[a, b], [d, e]], 1.6, 'rgba(43,34,53,0.4)')); }
    });
    add('chalk', (c, p, h) => { h.shape(c, p, h.rr(-26, -8, 52, 16, 7), '#fffaf0'); if (p) { h.shape(c, 1, h.rr(-26, -8, 14, 16, 6), '#ffd1dc', 1.4); line(c, [[-20, 24], [-4, 18], [12, 26], [28, 20]], 2.4, '#ffffff'); } });
  }
  registerIcons();

  // ================================================================ lines (lines.js's format: [simpler, richer] per language, picked by LEX.tier())
  // English versions carry the weave's slots ({w.*}, {c.*}); {…} variables (a phrase in the language, a name) are filled
  // first. Nobody assumes the player's gender in the language versions.
  const LT = {
    // the kids
    'mg.kids.hi': {
      es: ['¡Hola! ¿Quieres jugar con nosotros?', '¡Hola! Somos Sofi, Beto y Luci. ¿Quieres jugar con nosotros?'],
      pt: ['Oi! Quer brincar com a gente?', 'Oi! A gente é a Sofi, o Beto e a Luci. Quer brincar com a gente?'],
      de: ['Hallo! Willst du mitspielen?', 'Hallo! Wir sind Sofi, Beto und Luci. Willst du mit uns spielen?'],
      en: ['{w.hello}! Do you want to play with us?', '{w.hello}! We’re Sofi, Beto and Luci. Do you want to play with us?'] },
    'mg.kids.ask': {
      es: ['Pero primero pregunta bien: «¿Puedo jugar?»', 'Pero aquí hay una regla: primero preguntas bien. Se dice: «¿Puedo jugar?»'],
      pt: ['Mas primeiro pergunta direito: «Posso brincar?»', 'Mas aqui tem uma regra: primeiro você pergunta direito. Fala assim: «Posso brincar?»'],
      de: ['Aber zuerst fragst du richtig: „Darf ich mitspielen?“', 'Aber hier gibt es eine Regel: Zuerst fragst du richtig. Man sagt: „Darf ich mitspielen?“'],
      en: ['But first, ask properly: «{ask}»', 'But there’s a rule here: first you ask properly. You say: «{ask}»'] },
    'mg.kids.yes': {
      es: ['¡Claro que sí!', '¡Claro que sí! Cuantos más, mejor.'], pt: ['Claro!', 'Claro! Quanto mais gente, melhor.'], de: ['Na klar!', 'Na klar! Je mehr, desto besser.'],
      en: ['Of course!', 'Of course! The more, the merrier.'] },
    'mg.kids.again.sofi': {
      es: ['¡Hola otra vez! ¿Jugamos?', '¡Volviste! ¿Jugamos a algo?'], pt: ['Oi de novo! Vamos brincar?', 'Você voltou! Vamos brincar de alguma coisa?'],
      de: ['Hallo nochmal! Spielen wir?', 'Du bist wieder da! Spielen wir was?'], en: ['{w.hello} again! Shall we play?', 'You’re back! Want to play something?'] },
    'mg.kids.again.beto': {
      es: ['¡Hoy nadie me atrapa!', '¡Hoy nadie me atrapa! Soy el más rápido de Alba.'], pt: ['Hoje ninguém me pega!', 'Hoje ninguém me pega! Eu sou o mais rápido de Alba.'],
      de: ['Heute kriegt mich keiner!', 'Heute kriegt mich keiner! Ich bin der Schnellste in Alba.'], en: ['Nobody catches me today!', 'Nobody catches me today! I’m the fastest in Alba.'] },
    'mg.kids.again.luci': {
      es: ['Dibujé un gato nuevo. ¿Juegas?', 'Dibujé un gato nuevo con tiza. ¿Juegas conmigo?'], pt: ['Desenhei um jogo da velha novo. Joga comigo?', 'Desenhei um jogo da velha novo com giz. Quer jogar comigo?'],
      de: ['Ich hab ein neues Tic-Tac-Toe gemalt. Spielst du?', 'Ich hab mit Kreide ein neues Tic-Tac-Toe gemalt. Spielst du mit mir?'], en: ['I drew a new tic-tac-toe. Want to play?', 'I drew a new tic-tac-toe grid in chalk. Will you play with me?'] },
    'mg.kids.which': { es: ['¿A qué jugamos?'], pt: ['Do que a gente brinca?'], de: ['Was spielen wir?'], en: ['What should we play?'] },
    'mg.inv.tag': { es: ['¿Jugamos a la mancha?'], pt: ['Bora brincar de pega-pega?'], de: ['Spielen wir Fangen?'], en: ['Shall we play tag?'] },
    'mg.inv.ttt': { es: ['¿Jugamos al gato?'], pt: ['Vamos jogar jogo da velha?'], de: ['Spielen wir Tic-Tac-Toe?'], en: ['Shall we play tic-tac-toe?'] },
    'mg.inv.rps': { es: ['¿Piedra, papel o tijera?'], pt: ['Pedra, papel e tesoura?'], de: ['Schere, Stein, Papier?'], en: ['{w.stone}, {w.paper}, {w.scissors}?'] },
    'mg.inv.hide': { es: ['¿Jugamos a las escondidas?'], pt: ['Vamos brincar de esconde-esconde?'], de: ['Spielen wir Verstecken?'], en: ['Shall we play hide-and-seek?'] },
    'mg.kids.inLang': { es: ['¡En español, por favor!'], pt: ['Em português, por favor!'], de: ['Auf Deutsch, bitte!'], en: ['In {lname}, {c.please}!'] },
    'mg.kids.no': { es: ['¡Bueno, luego jugamos!'], pt: ['Tá bom, depois a gente brinca!'], de: ['Okay, dann später!'], en: ['Okay, we’ll play later!'] },
    'mg.kids.huh': { es: ['¿Qué? ¿Sí o no?'], pt: ['Hein? Sim ou não?'], de: ['Was? Ja oder nein?'], en: ['What? {c.yes} or no?'] },
    'mg.kids.records': {
      es: ['¡Mira, llevamos la cuenta!'], pt: ['Olha, a gente anota tudo!'], de: ['Schau, wir zählen mit!'], en: ['{c.look}, we keep score!'] },
    'mg.kids.medal': {
      es: ['¡Ganaste los cuatro juegos! Toma: ¡la medalla de la plaza!'], pt: ['Você ganhou os quatro jogos! Toma: a medalha da praça!'],
      de: ['Du hast alle vier Spiele gewonnen! Hier: die Medaille vom Platz!'], en: ['You won all four games! Here: the plaza medal!'] },
    'mg.teach.offer': {
      es: ['¿Quieres aprender a molestar como nosotros?', '¿Quieres aprender a molestar como nosotros? Esta es buenísima.'],
      pt: ['Quer aprender a provocar igual a gente?', 'Quer aprender a provocar igual a gente? Essa é ótima.'],
      de: ['Willst du lernen, so frech zu sein wie wir?', 'Willst du lernen, so frech zu sein wie wir? Der Spruch ist super.'],
      en: ['Want to learn to tease like us?', 'Want to learn to tease like us? This one’s great.'] },
    'mg.teach.use': {
      es: ['¡Ahora úsala contra nosotros!'], pt: ['Agora usa contra a gente!'], de: ['Jetzt benutz ihn gegen uns!'], en: ['Now use it on us!'] },
    // tag
    'mg.tag.rules': {
      es: ['¡Tú la llevas! Atrápanos.', '¡Tú la llevas! Toca a alguien y esa persona la lleva. ¡No vale salir de la plaza!'],
      pt: ['Tá com você! Pega a gente.', 'Tá com você! Encosta em alguém e aí tá com ele. Não vale sair da praça!'],
      de: ['Du bist dran! Fang uns!', 'Du bist dran! Wen du berührst, der ist dran. Den Platz verlassen gilt nicht!'],
      en: ['You’re it! Catch us!', 'You’re it! Tag someone, and then they’re it. Leaving the plaza doesn’t count!'] },
    'mg.tag.youLose': {
      es: ['¡Tú la llevas! ¡Perdiste!', '¡Ja, ja! Al final la llevas tú. ¡Perdiste!'], pt: ['Tá com você! Perdeu!', 'Rá! No final ficou com você. Perdeu!'],
      de: ['Du bist dran! Verloren!', 'Haha! Am Ende bist du dran. Verloren!'], en: ['You’re it! You lose!', 'Ha ha! You’re it at the end. You lose!'] },
    'mg.tag.youWin': {
      es: ['¡No vale! ¡Ganaste!', '¡No vale! Corres un montón… ¡ganaste!'], pt: ['Não vale! Você ganhou!', 'Não vale! Você corre demais… ganhou!'],
      de: ['Das gilt nicht! Du hast gewonnen!', 'Das gilt nicht! Du rennst so schnell … du hast gewonnen!'], en: ['No fair! You win!', 'No fair! You run so fast… you win!'] },
    // tic-tac-toe, rock-paper-scissors
    'mg.ttt.rules': {
      es: ['Tú eres la X. Dime dónde: «arriba a la izquierda», «en el medio»…', 'Tú eres la X y yo la O. Dime dónde va tu X: «arriba a la izquierda», «en el medio»… ¡Tres en raya gana!'],
      pt: ['Você é o X. Fala onde: «em cima à esquerda», «no meio»…', 'Você é o X e eu sou a bolinha. Fala onde vai o seu X: «em cima à esquerda», «no meio»… Três em linha ganha!'],
      de: ['Du bist das X. Sag mir, wo: „oben links“, „in der Mitte“ …', 'Du bist das X, ich bin der Kreis. Sag mir, wo dein X hinkommt: „oben links“, „in der Mitte“ … Drei in einer Reihe gewinnt!'],
      en: ['You’re X. Tell me where: «{ex1}», «{ex2}»…', 'You’re X and I’m O. Tell me where your X goes: «{ex1}», «{ex2}»… Three in a row wins!'] },
    'mg.rps.rules': {
      es: ['Escribe tu jugada: piedra, papel o tijera.', 'Escribe tu jugada: piedra, papel o tijera. ¡El primero que gana tres veces, gana!'],
      pt: ['Escreve a sua jogada: pedra, papel ou tesoura.', 'Escreve a sua jogada: pedra, papel ou tesoura. Quem ganhar três vezes primeiro, ganha!'],
      de: ['Schreib, was du nimmst: Schere, Stein oder Papier.', 'Schreib, was du nimmst: Schere, Stein oder Papier. Wer zuerst dreimal gewinnt, gewinnt!'],
      en: ['Type your pick: {w.stone}, {w.paper} or {w.scissors}.', 'Type your pick: {w.stone}, {w.paper} or {w.scissors}. First to win three times wins!'] },
    // hide and seek
    'mg.hide.rules1': {
      es: ['Yo cuento hasta diez. ¡Escóndete!', 'Primero cuento yo, hasta diez. ¡Corre y escóndete detrás de algo!'],
      pt: ['Eu conto até dez. Se esconde!', 'Primeiro eu conto, até dez. Corre e se esconde atrás de alguma coisa!'],
      de: ['Ich zähle bis zehn. Versteck dich!', 'Zuerst zähle ich, bis zehn. Lauf und versteck dich hinter etwas!'],
      en: ['I’ll count to ten. Hide!', 'I’ll count first, up to ten. Run and hide behind something!'] },
    'mg.hide.rules2': {
      es: ['¡Ahora cuentas tú! Hasta diez.', '¡Ahora cuentas tú, hasta diez! Y luego nos buscas.'], pt: ['Agora você conta! Até dez.', 'Agora você conta, até dez! Depois você procura a gente.'],
      de: ['Jetzt zählst du! Bis zehn.', 'Jetzt zählst du, bis zehn! Dann suchst du uns.'], en: ['Now you count! Up to ten.', 'Now you count, up to ten! Then you look for us.'] },
    'mg.hide.wow': { es: ['¡Qué buen escondite!'], pt: ['Que esconderijo bom!'], de: ['Was für ein gutes Versteck!'], en: ['What a good hiding spot!'] },
    'mg.hide.allFound': { es: ['¡Nos encontraste a todos!'], pt: ['Você achou todo mundo!'], de: ['Du hast alle gefunden!'], en: ['You found everyone!'] },
    'mg.hide.notAll': { es: ['¡Se acabó el tiempo! Aquí estamos.'], pt: ['Acabou o tempo! A gente tá aqui.'], de: ['Die Zeit ist um! Hier sind wir.'], en: ['Time’s up! Here we are.'] },
    // the hustlers
    'mg.aur.hi': {
      es: ['Buenas. ¿Juegas al ajedrez?', 'Buenas tardes. Me llamo Aurelio. ¿Juegas al ajedrez? Yo juego un poquito…'],
      pt: ['Boa tarde. Você joga xadrez?', 'Boa tarde. Meu nome é Aurélio. Você joga xadrez? Eu jogo um pouquinho…'],
      de: ['Guten Tag. Spielst du Schach?', 'Guten Tag. Ich heiße Aurelio. Spielst du Schach? Ich spiele ein bisschen …'],
      en: ['Good afternoon. Do you play {w.chess}?', 'Good afternoon. My name’s Aurelio. Do you play {w.chess}? I play a little…'] },
    'mg.aur.hustle': {
      es: ['¿Una partidita por cinco monedas?', '¿Una partidita por cinco monedas? Para hacerlo interesante.'], pt: ['Uma partidinha por cinco moedas?', 'Uma partidinha por cinco moedas? Só pra ficar interessante.'],
      de: ['Ein Spielchen um fünf Münzen?', 'Ein Spielchen um fünf Münzen? Damit es spannend wird.'], en: ['A little game for five {w.coin:pl}?', 'A little game for five {w.coin:pl}? Just to make it interesting.'] },
    'mg.aur.again': { es: ['¿La revancha?', '¿Vienes por la revancha? Siéntate.'], pt: ['Revanche?', 'Veio pela revanche? Senta aí.'], de: ['Revanche?', 'Willst du Revanche? Setz dich.'], en: ['A rematch?', 'Here for a rematch? Have a seat.'] },
    'mg.aur.lose': {
      es: ['Bien jugado… Toma tus monedas.', 'Bien jugado… muy bien jugado. Toma tus monedas.'], pt: ['Bem jogado… Toma suas moedas.', 'Bem jogado… muito bem jogado. Toma suas moedas.'],
      de: ['Gut gespielt … Hier, deine Münzen.', 'Gut gespielt … sehr gut gespielt. Hier, deine Münzen.'], en: ['Well played… Here are your {w.coin:pl}.', 'Well played… very well played. Here are your {w.coin:pl}.'] },
    'mg.aur.loseFun': { es: ['Bien jugado. ¡Me ganaste!'], pt: ['Bem jogado. Você me ganhou!'], de: ['Gut gespielt. Du hast mich geschlagen!'], en: ['Well played. You beat me!'] },
    'mg.reme.lose': { es: ['¡Ay! Me ganaste. Toma tus monedas.'], pt: ['Ai! Você me ganhou. Toma suas moedas.'], de: ['Oh! Du hast gewonnen. Hier, deine Münzen.'], en: ['Oh! You beat me. Here are your {w.coin:pl}.'] },
    'mg.reme.loseFun': { es: ['¡Ay! Me ganaste. ¡Qué bien juegas!'], pt: ['Ai! Você me ganhou. Que bem você joga!'], de: ['Oh! Du hast gewonnen. Du spielst ja gut!'], en: ['Oh! You beat me. You play well!'] },
    'mg.reme.hi': {
      es: ['¡Hola! ¿Sabes jugar a las damas?', '¡Hola, hola! Soy Reme. ¿Sabes jugar a las damas? Es muy fácil… para mí.'],
      pt: ['Oi! Você sabe jogar damas?', 'Oi, oi! Eu sou a Reme. Você sabe jogar damas? É muito fácil… pra mim.'],
      de: ['Hallo! Kannst du Dame spielen?', 'Hallo, hallo! Ich bin Reme. Kannst du Dame spielen? Das ist ganz leicht … für mich.'],
      en: ['{w.hello}! Do you know how to play {w.checkers}?', '{w.hello}, {w.hello}! I’m Reme. Do you know how to play {w.checkers}? It’s very easy… for me.'] },
    'mg.reme.hustle': {
      es: ['¿Una partidita por cinco monedas?', '¿Una partidita por cinco monedas, cariño?'], pt: ['Uma partidinha por cinco moedas?', 'Uma partidinha por cinco moedas, meu bem?'],
      de: ['Ein Spielchen um fünf Münzen?', 'Ein Spielchen um fünf Münzen, Schätzchen?'], en: ['A little game for five {w.coin:pl}?', 'A little game for five {w.coin:pl}, dear?'] },
    'mg.reme.again': { es: ['¿Otra partidita?'], pt: ['Mais uma partidinha?'], de: ['Noch ein Spielchen?'], en: ['Another little game?'] },
    'mg.reme.rules': {
      es: ['Aquí comer es obligatorio. ¡Si puedes comer, comes!'], pt: ['Aqui comer é obrigatório. Se pode comer, come!'],
      de: ['Hier muss man schlagen. Wenn du schlagen kannst, schlägst du!'], en: ['Here, capturing is a must. If you can take, you take!'] },
    'mg.old.broke': {
      es: ['¿Sin monedas? Bueno, jugamos por diversión.'], pt: ['Sem moedas? Tá bom, a gente joga por diversão.'], de: ['Keine Münzen? Na gut, dann spielen wir zum Spaß.'],
      en: ['No {w.coin:pl}? All right, we’ll play for fun.'] },
    'mg.old.bye': { es: ['Aquí estaremos. Siempre.'], pt: ['A gente vai estar aqui. Sempre.'], de: ['Wir sind hier. Immer.'], en: ['We’ll be here. Always.'] },
    'mg.tino.hi': {
      es: ['Yo solo miro. Aurelio y Reme nunca pierden… casi nunca.', 'Yo solo miro. Aurelio y Reme nunca pierden… bueno, casi nunca. Si les ganas, te invito un café.'],
      pt: ['Eu só olho. O Aurélio e a Reme nunca perdem… quase nunca.', 'Eu só olho. O Aurélio e a Reme nunca perdem… bom, quase nunca. Se você ganhar deles, eu pago um café.'],
      de: ['Ich schaue nur zu. Aurelio und Reme verlieren nie … fast nie.', 'Ich schaue nur zu. Aurelio und Reme verlieren nie … na ja, fast nie. Wenn du sie schlägst, lade ich dich auf einen Kaffee ein.'],
      en: ['I just watch. Aurelio and Reme never lose… almost never.', 'I just watch. Aurelio and Reme never lose… well, almost never. Beat them and the coffee’s on me.'] },
    'mg.tino.tip': {
      es: ['Un consejo: di tu jugada en voz alta. «Caballo a f3». ¡Les encanta!'], pt: ['Uma dica: fala a sua jogada em voz alta. «Cavalo para f3». Eles adoram!'],
      de: ['Ein Tipp: Sag deinen Zug laut. „Springer nach f3“. Das lieben sie!'], en: ['A tip: say your move out loud. «{ex}». They love that!'] },
    'mg.tino.after': { es: ['¡Les ganaste! Eres una leyenda.'], pt: ['Você ganhou deles! Você é uma lenda.'], de: ['Du hast sie geschlagen! Du bist eine Legende.'], en: ['You beat them! You’re a legend.'] },
  };
  // zh / ja: the kids talk casually; Aurelio, Reme and Tino are polite (です / ます) in Japanese, and Reme's «cariño» stays out
  {
    const C = {
      'mg.kids.hi': ['[你好|nǐ hǎo] ！ [你|nǐ] [想|xiǎng] [跟|gēn] [我们|wǒ men] [一起|yī qǐ] [玩|wán] [吗|ma] ？', 'こんにちは ！ いっしょ に [遊|あそ]ぶ ？'],
      'mg.kids.ask': ['[可是|kě shì] [先|xiān] [要|yào] [好好|hǎo hǎo] [问|wèn] ： “ [我|wǒ] [可以|kě yǐ] [一起|yī qǐ] [玩|wán] [吗|ma] ？ ”', 'でも 、 まず ちゃんと [言|い]って ： 「 [入|い]れて ！ 」'],
      'mg.kids.yes': ['[当然|dāng rán] [可以|kě yǐ] ！', 'いいよ ！'],
      'mg.kids.again.sofi': ['[又|yòu] [见面|jiàn miàn] [了|le] ！ [一起|yī qǐ] [玩|wán] [吧|ba] ？', 'また [来|き]た ね ！ [遊|あそ]ぼう ？'],
      'mg.kids.again.beto': ['[今天|jīn tiān] [谁|shéi] [都|dōu] [抓不到|zhuā bu dào] [我|wǒ] ！', 'きょう は だれ も ぼく を つかまえられない よ ！'],
      'mg.kids.again.luci': ['[我|wǒ] [画|huà] [了|le] [一个|yī gè] [新|xīn] [的|de] [井字棋|jǐng zì qí] 。 [你|nǐ] [玩|wán] [吗|ma] ？', 'あたらしい まるばつ を かいた の 。 やる ？'],
      'mg.kids.which': ['[我们|wǒ men] [玩|wán] [什么|shén me] ？', 'なに して [遊|あそ]ぶ ？'],
      'mg.inv.tag': ['[我们|wǒ men] [玩|wán] [抓人|zhuā rén] [吧|ba] ？', '[鬼|おに]ごっこ しよう か ？'],
      'mg.inv.ttt': ['[我们|wǒ men] [玩|wán] [井字棋|jǐng zì qí] [吧|ba] ？', 'まるばつ しよう か ？'],
      'mg.inv.rps': ['[石头|shí tou] [剪刀|jiǎn dāo] [布|bù] ？', 'じゃんけん しよう か ？'],
      'mg.inv.hide': ['[我们|wǒ men] [玩|wán] [捉迷藏|zhuō mí cáng] [吧|ba] ？', 'かくれんぼ しよう か ？'],
      'mg.kids.inLang': ['[说|shuō] [中文|zhōng wén] [嘛|ma] ！', '[日本語|にほんご] で [言|い]って よ ！'],
      'mg.kids.no': ['[好|hǎo] [吧|ba] ， [待会|dāi huì] [再|zài] [玩|wán] ！', 'じゃあ 、 また あと で ね ！'],
      'mg.kids.huh': ['[什么|shén me] ？ [玩|wán] [还是|hái shi] [不|bù] [玩|wán] ？', 'え ？ やる の ？ やらない の ？'],
      'mg.kids.records': ['[你|nǐ] [看|kàn] ， [我们|wǒ men] [记|jì] [着|zhe] [分|fēn] [呢|ne] ！', '[見|み]て 、 [点数|てんすう] を つけて る ん だ ！'],
      'mg.kids.medal': ['[四|sì] [个|gè] [游戏|yóu xì] [你|nǐ] [都|dōu] [赢|yíng] [了|le] ！ [给|gěi] [你|nǐ] ， [广场|guǎng chǎng] [奖牌|jiǎng pái] ！', '[四|よっ]つ ぜんぶ [勝|か]った ね ！ はい 、 [広場|ひろば] の メダル ！'],
      'mg.teach.offer': ['[想|xiǎng] [学|xué] [我们|wǒ men] [怎么|zěn me] [逗|dòu] [人|rén] [吗|ma] ？', 'からかい [方|かた] 、 [教|おし]えて あげよう か ？'],
      'mg.teach.use': ['[现在|xiàn zài] [用|yòng] [它|tā] [来|lái] [逗|dòu] [我们|wǒ men] ！', 'こんど は それ を わたしたち に [言|い]って みて ！'],
      'mg.tag.rules': ['[你|nǐ] [当|dāng] [鬼|guǐ] ！ [来|lái] [抓|zhuā] [我们|wǒ men] ！', '[鬼|おに] だ よ ！ つかまえて みて ！'],
      'mg.tag.youLose': ['[最后|zuì hòu] [你|nǐ] [是|shì] [鬼|guǐ] ！ [你|nǐ] [输|shū] [了|le] ！', '[最後|さいご] は [鬼|おに] だ ね ！ [負|ま]け ！'],
      'mg.tag.youWin': ['[不|bù] [算|suàn] ！ [你|nǐ] [赢|yíng] [了|le] ！', 'ずるい ！ [勝|か]ち だ よ ！'],
      'mg.ttt.rules': ['[你|nǐ] [画|huà] [叉|chā] 。 [告诉|gào su] [我|wǒ] [画|huà] [在|zài] [哪里|nǎ lǐ] ： “ {ex1} ” ， “ {ex2} ” …', 'あなた は ばつ 。 どこ に かく か [言|い]って ： 「 {ex1} 」 、 「 {ex2} 」 …'],
      'mg.rps.rules': ['[写|xiě] [你|nǐ] [出|chū] [什么|shén me] ： [石头|shí tou] 、 [剪刀|jiǎn dāo] [还是|hái shi] [布|bù] 。', '[出|だ]す もの を [書|か]いて ： グー 、 チョキ 、 パー 。'],
      'mg.hide.rules1': ['[我|wǒ] [数|shǔ] [到|dào] [十|shí] 。 [快|kuài] [藏|cáng] [起来|qǐ lái] ！', '[十|じゅう] まで かぞえる よ 。 [隠|かく]れて ！'],
      'mg.hide.rules2': ['[现在|xiàn zài] [你|nǐ] [数|shǔ] ！ [数|shǔ] [到|dào] [十|shí] 。', 'こんど は あなた が かぞえて ！ [十|じゅう] まで 。'],
      'mg.hide.wow': ['[藏|cáng] [得|de] [真|zhēn] [好|hǎo] ！', 'いい かくれ[場所|ばしょ] ！'],
      'mg.hide.allFound': ['[你|nǐ] [把|bǎ] [我们|wǒ men] [都|dōu] [找到|zhǎo dào] [了|le] ！', 'みんな [見|み]つかっちゃった ！'],
      'mg.hide.notAll': ['[时间|shí jiān] [到|dào] [了|le] ！ [我们|wǒ men] [在|zài] [这里|zhè lǐ] ！', '[時間|じかん] ぎれ ！ ここ に いる よ ！'],
      'mg.aur.hi': ['[你好|nǐ hǎo] 。 [你|nǐ] [下|xià] [国际象棋|guó jì xiàng qí] [吗|ma] ？', 'こんにちは 。 チェス は なさいます か ？'],
      'mg.aur.hustle': ['[来|lái] [一|yī] [盘|pán] [吧|ba] ？ [五|wǔ] [枚|méi] [金币|jīn bì] 。', '[一局|いっきょく] いかが です か ？ コイン [五枚|ごまい] で 。'],
      'mg.aur.again': ['[来|lái] [报仇|bào chóu] [吗|ma] ？ [坐|zuò] [吧|ba] 。', 'リベンジ です か ？ どうぞ 、 お[座|すわ]り ください 。'],
      'mg.aur.lose': ['[下|xià] [得|de] [好|hǎo] … [这|zhè] [是|shì] [你|nǐ] [的|de] [金币|jīn bì] 。', 'お[見事|みごと] … コイン を どうぞ 。'],
      'mg.aur.loseFun': ['[下|xià] [得|de] [好|hǎo] 。 [你|nǐ] [赢|yíng] [了|le] ！', 'お[見事|みごと] です 。 わたし の [負|ま]け です 。'],
      'mg.reme.lose': ['[哎呀|āi yā] ！ [你|nǐ] [赢|yíng] [了|le] 。 [给|gěi] [你|nǐ] [金币|jīn bì] 。', 'あら ！ わたし の [負|ま]け です ね 。 コイン を どうぞ 。'],
      'mg.reme.loseFun': ['[哎呀|āi yā] ！ [你|nǐ] [赢|yíng] [了|le] 。 [你|nǐ] [下|xià] [得|de] [真|zhēn] [好|hǎo] ！', 'あら ！ [負|ま]けました 。 お[上手|じょうず] です ね ！'],
      'mg.reme.hi': ['[你好|nǐ hǎo] ！ [你|nǐ] [会|huì] [下|xià] [跳棋|tiào qí] [吗|ma] ？ [对|duì] [我|wǒ] [来说|lái shuō] [很|hěn] [简单|jiǎn dān] …','こんにちは ！ チェッカー は できます か ？ わたし に は かんたん です けど …'],
      'mg.reme.hustle': ['[来|lái] [一|yī] [盘|pán] [吧|ba] ， [亲爱|qīn ài] [的|de] ？ [五|wǔ] [枚|méi] [金币|jīn bì] 。', '[一局|いっきょく] いかが ？ コイン [五枚|ごまい] で 。'],
      'mg.reme.again': ['[再|zài] [来|lái] [一|yī] [盘|pán] ？', 'もう [一局|いっきょく] いかが ？'],
      'mg.reme.rules': ['[在|zài] [这里|zhè lǐ] ， [能|néng] [吃|chī] [就|jiù] [必须|bì xū] [吃|chī] ！', 'ここ で は 、 [取|と]れる なら [必|かなら]ず [取|と]る ん です よ 。'],
      'mg.old.broke': ['[没有|méi yǒu] [金币|jīn bì] ？ [好|hǎo] [吧|ba] ， [那|nà] [就|jiù] [玩|wán] [着|zhe] [玩|wán] 。', 'コイン が ない ？ では 、 [遊|あそ]び で やりましょう 。'],
      'mg.old.bye': ['[我们|wǒ men] [一直|yī zhí] [在|zài] [这里|zhè lǐ] 。', 'わたしたち は いつ でも ここ に います よ 。'],
      'mg.tino.hi': ['[我|wǒ] [只|zhǐ] [是|shì] [看|kàn] [看|kan] 。 [奥雷里奥|Ào léi lǐ ào] [和|hé] [蕾梅|Lěi méi] [从来|cóng lái] [不|bù] [输|shū] … [几乎|jī hū] [从来|cóng lái] [不|bù] [输|shū] 。', 'わたし は [見|み]て いる だけ です 。 アウレリオ と レメ は [負|ま]けない ん です … まあ 、 ほとんど ね 。'],
      'mg.tino.tip': ['[给|gěi] [你|nǐ] [一个|yī gè] [建议|jiàn yì] ： [大声|dà shēng] [说出|shuō chū] [你|nǐ] [的|de] [棋|qí] ， “ [马|mǎ] [到|dào] f3 ” 。 [他们|tā men] [最|zuì] [喜欢|xǐ huan] [了|le] ！', 'ひとつ アドバイス です 。 [手|て] を [声|こえ] に [出|だ]して [言|い]って ください 。 「 ナイト f3 」 。 [二人|ふたり] とも [大好|だいす]き です から ！'],
      'mg.tino.after': ['[你|nǐ] [赢|yíng] [了|le] [他们|tā men] ！ [你|nǐ] [是|shì] [传奇|chuán qí] ！', '[二人|ふたり] に [勝|か]った ん です か ！ [伝説|でんせつ] です よ ！'],
    };
    for (const [k, [zh, ja]] of Object.entries(C)) if (LT[k]) { LT[k].zh = [zh]; LT[k].ja = [ja]; }
  }
  function mergeLines() { if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v; }      // (STORY.sayAt can say them too)
  mergeLines();
  // a line for the current language and level, with {vars} filled in (the English keeps its weave slots)
  function lineOf(key, vars = {}) {
    const L = LT[key]; if (!L) return { text: key, en: key, weave: key };
    const tier = typeof LEX !== 'undefined' ? LEX.tier() : 1, l = lang(), arr = L[l] || L.es, i = Math.min(arr.length, Math.max(1, tier)) - 1, en = L.en || [''];
    // (zh / ja: a phrase or a square's name dropped into the English line is shown plain, in the mode's script)
    const sub = (s, isEn) => s.replace(/\{(ask|ex|ex1|ex2|name|lname|n|phrase)\}/g, (_, k) => { const v = vars[k] !== undefined ? vars[k] : k === 'lname' ? LNAME[l] : k === 'ask' ? phraseText('ph.play.canIPlay') : _; return isEn && cj() ? plainTL(v) : v; });
    return { text: sub(arr[Math.min(arr.length - 1, i)]), en: sub(en[Math.min(en.length - 1, i)], true), weave: sub(en[en.length - 1], true) };
  }
  const phraseText = (id, o = {}) => { const p = PH[id] || (typeof LEX !== 'undefined' && LEX.item(id)); if (!p) return id; const l = o.lang || lang(); return (o.f && p.f && p.f[l]) || p[l] || (l === 'zh' || l === 'ja' ? p.en : p.es); };

  // ================================================================ in-game talk (said in the overlays and bubbles): { es, pt, de, en }, arrays = variants
  const SAY = {
    // tag
    tagGo: { es: '¡Tres, dos, uno… ya!', pt: 'Três, dois, um… já!', de: 'Drei, zwei, eins … los!', en: 'Three, two, one… go!' },
    go: { es: '¡Ya!', pt: 'Já!', de: 'Los!', en: 'Go!' },
    here: { es: '¡Aquí estoy!', pt: 'Tô aqui!', de: 'Hier bin ich!', en: 'Here I am!' },
    gonnaGet: { es: ['¡Te voy a atrapar!', '¡Ya verás!'], pt: ['Vou te pegar!', 'Você vai ver!'], de: ['Ich krieg dich!', 'Na warte!'], en: ['I’m gonna get you!', 'Just you wait!'] },
    run: { es: '¡Corre, corre!', pt: 'Corre, corre!', de: 'Lauf, lauf!', en: 'Run, run!' },
    ohNo: { es: '¡Ay, no!', pt: 'Ah, não!', de: 'Oh nein!', en: 'Oh no!' },
    nyah: { es: '¡Ni me tocas!', pt: 'Nem encosta!', de: 'Ätsch!', en: 'Can’t touch me! / Nyah nyah!' },
    outWarn: { es: '¡Vuelve a la plaza!', pt: 'Volta pra praça!', de: 'Komm zurück auf den Platz!', en: 'Come back to the plaza!' },
    leftPlaza: { es: '¡No vale salir! ¡Te toca!', pt: 'Não vale sair! Tá com você!', de: 'Rausgehen gilt nicht! Du bist dran!', en: 'No leaving! You’re it!' },
    timeUp: { es: '¡Se acabó el tiempo!', pt: 'Acabou o tempo!', de: 'Die Zeit ist um!', en: 'Time’s up!' },
    // hide and seek
    hmmHere: { es: 'Mmm… ¿aquí?', pt: 'Hmm… aqui?', de: 'Hmm … hier?', en: 'Hmm… here?' },
    notHere: { es: 'Aquí no…', pt: 'Aqui não…', de: 'Hier nicht …', en: 'Not here…' },
    giggle: { es: '¡Jiji!', pt: 'Hihi!', de: 'Hihi!', en: 'Hee hee!' },
    youFoundMe: { es: '¡Ay, me encontraste!', pt: 'Ai, você me achou!', de: 'Oh, du hast mich gefunden!', en: 'Oh, you found me!' },
    giveUpWhere: { es: '¡Me rindo! ¿Dónde estás?', pt: 'Desisto! Cadê você?', de: 'Ich gebe auf! Wo bist du?', en: 'I give up! Where are you?' },
    // tic-tac-toe
    myTurn: { es: '¡Me toca!', pt: 'Minha vez!', de: 'Ich bin dran!', en: 'My turn!' },
    uhoh: { es: '¡Uy, uy, uy!', pt: 'Ih, ih, ih!', de: 'Oh, oh, oh!', en: 'Uh-oh!' },
    tttKidWins: { es: '¡Tres en raya! ¡Gané!', pt: 'Três em linha! Ganhei!', de: 'Drei in einer Reihe! Gewonnen!', en: 'Three in a row! I won!' },
    tttYouWin: { es: '¡No vale! ¡Otra!', pt: 'Não vale! Mais uma!', de: 'Das gilt nicht! Nochmal!', en: 'No fair! Another one!' },
    taken: { es: '¡Ahí ya hay algo!', pt: 'Aí já tem coisa!', de: 'Da ist schon was!', en: 'Something’s already there!' },
    tttHuh: { es: '¿Dónde? Di «arriba», «abajo», «izquierda»…', pt: 'Onde? Fala «em cima», «embaixo», «esquerda»…', de: 'Wo? Sag „oben“, „unten“, „links“ …', en: 'Where? Say top, bottom, left…' },
    inLang: { es: '¡En español!', pt: 'Em português!', de: 'Auf Deutsch!', en: 'Not in English!' },
    wellSaid: { es: ['¡Bien dicho!', '¡Eso!'], pt: ['Falou bonito!', 'Isso!'], de: ['Gut gesagt!', 'Genau!'], en: ['Well said!', 'That’s it!'] },
    matchKidWins: { es: '¡Gané la partida!', pt: 'Ganhei a partida!', de: 'Ich hab das Spiel gewonnen!', en: 'I won the match!' },
    matchYouWin: { es: '¡Ganaste la partida! Pero la próxima vez…', pt: 'Você ganhou a partida! Mas da próxima vez…', de: 'Du hast das Spiel gewonnen! Aber nächstes Mal …', en: 'You won the match! But next time…' },
    // rock, paper, scissors
    chant: { es: '¡Piedra, papel o tijera… un, dos, tres!', pt: 'Pedra, papel, tesoura… já!', de: 'Schere, Stein, Papier!', en: 'Rock, paper, scissors… go!' },
    beats: {
      stone: { es: 'La piedra rompe la tijera.', pt: 'A pedra quebra a tesoura.', de: 'Der Stein schleift die Schere.', en: 'Rock breaks scissors.' },
      scissors: { es: 'La tijera corta el papel.', pt: 'A tesoura corta o papel.', de: 'Die Schere schneidet das Papier.', en: 'Scissors cut paper.' },
      paper: { es: 'El papel envuelve la piedra.', pt: 'O papel embrulha a pedra.', de: 'Das Papier wickelt den Stein ein.', en: 'Paper wraps rock.' },
    },
    same: { es: '¡Empate! Otra vez.', pt: 'Empate! De novo.', de: 'Unentschieden! Nochmal.', en: 'A tie! Again.' },
    kidPoint: { es: '¡Punto para mí!', pt: 'Ponto pra mim!', de: 'Punkt für mich!', en: 'Point to me!' },
    youPoint: { es: '¡Ay, punto para ti!', pt: 'Ai, ponto pra você!', de: 'Oh, Punkt für dich!', en: 'Oh, point to you!' },
    rpsHuh: { es: '¿Qué es eso? Piedra, papel o tijera.', pt: 'O que é isso? Pedra, papel ou tesoura.', de: 'Was ist das? Schere, Stein oder Papier.', en: 'What’s that? Rock, paper or scissors.' },
    // chess and checkers
    yourMove: { es: ['Te toca.', 'Te toca. Piensa bien…'], pt: ['Sua vez.', 'Sua vez. Pensa bem…'], de: ['Jetzt du.', 'Jetzt du. Denk gut nach …'], en: ['Your move.', 'Your move. Think hard…'] },
    thinking: { es: ['Mmm… a ver…', 'Déjame pensar…'], pt: ['Hmm… deixa eu ver…', 'Deixa eu pensar…'], de: ['Hmm … mal sehen …', 'Lass mich überlegen …'], en: ['Hmm… let’s see…', 'Let me think…'] },
    banter: { es: ['¿Seguro?', 'Piensa, piensa…', '¡Ja! Lo sabía.', 'Interesante…'], pt: ['Tem certeza?', 'Pensa, pensa…', 'Rá! Eu sabia.', 'Interessante…'], de: ['Sicher?', 'Denk nach, denk nach …', 'Ha! Wusste ich’s doch.', 'Interessant …'], en: ['Sure about that?', 'Think, think…', 'Ha! I knew it.', 'Interesting…'] },
    check: { es: '¡Jaque!', pt: 'Xeque!', de: 'Schach!', en: 'Check!' },
    youCheck: { es: 'Uy… jaque.', pt: 'Xi… xeque.', de: 'Hm … Schach.', en: 'Ooh… check.' },
    aiMates: { es: '¡Jaque mate! ¡A pagar!', pt: 'Xeque-mate! Pode pagar!', de: 'Schachmatt! Her mit den Münzen!', en: 'Checkmate! Pay up!' },
    aiMatesFun: { es: '¡Jaque mate! ¿Otra?', pt: 'Xeque-mate! Mais uma?', de: 'Schachmatt! Noch eine?', en: 'Checkmate! Another?' },
    youMate: { es: 'Jaque mate… Bien jugado.', pt: 'Xeque-mate… bem jogado.', de: 'Schachmatt … gut gespielt.', en: 'Checkmate… well played.' },
    draw: { es: '¡Tablas!', pt: 'Empate!', de: 'Remis!', en: 'Draw!' },
    stalemate: { es: '¡Ahogado! Son tablas.', pt: 'Afogado! É empate.', de: 'Patt! Das ist remis.', en: 'Stalemate! It’s a draw.' },
    aiResigns: { es: 'Me rindo. ¡Qué partida!', pt: 'Desisto. Que partida!', de: 'Ich gebe auf. Was für eine Partie!', en: 'I give up. What a game!' },
    youResign: { es: '¿Te rindes? ¡Las monedas son mías!', pt: 'Desistiu? As moedas são minhas!', de: 'Du gibst auf? Die Münzen gehören mir!', en: 'You give up? The coins are mine!' },
    youResignFun: { es: '¿Ya te vas? ¡Vuelve pronto!', pt: 'Já vai? Volta logo!', de: 'Gehst du schon? Komm bald wieder!', en: 'Leaving already? Come back soon!' },
    flattered: { es: '¡Gracias! Tú tampoco juegas mal.', pt: 'Obrigado! Você também não joga mal.', de: 'Danke! Du spielst auch nicht schlecht.', en: 'Thanks! You don’t play badly either.' },
    flatteredF: { es: '¡Gracias! Tú tampoco juegas mal.', pt: 'Obrigada! Você também não joga mal.', de: 'Danke! Du spielst auch nicht schlecht.', en: 'Thanks! You don’t play badly either.' },
    notCheck: { es: '¿Jaque? ¡Eso no es jaque!', pt: 'Xeque? Isso não é xeque!', de: 'Schach? Das ist kein Schach!', en: 'Check? That’s not check!' },
    rightCheck: { es: 'Sí, sí, ya lo vi…', pt: 'Tá, tá, eu já vi…', de: 'Ja, ja, ich seh’s ja …', en: 'Yes, yes, I see it…' },
    notYourTurn: { es: '¡Ya voy, ya voy!', pt: 'Já vou, já vou!', de: 'Ich mach ja schon!', en: 'I’m going, I’m going!' },
    announceOk: { es: ['¡Eso! Así se dice.', 'Bien dicho.', 'Hablas como un profesional.'], pt: ['Isso! É assim que se fala.', 'Bem falado.', 'Fala que nem profissional.'], de: ['Genau! So sagt man das.', 'Gut gesagt.', 'Du redest wie ein Profi.'], en: ['That’s it! That’s how you say it.', 'Well said.', 'You talk like a pro.'] },
    noSuchMove: { es: 'Esa jugada no se puede.', pt: 'Essa jogada não pode.', de: 'Der Zug geht nicht.', en: 'You can’t play that.' },
    which: { es: '¿Cuál? Hay dos.', pt: 'Qual? Tem dois.', de: 'Welcher? Es gibt zwei.', en: 'Which one? There are two.' },
    mustTake: { es: '¡Tienes que comer!', pt: 'Tem que comer!', de: 'Du musst schlagen!', en: 'You have to take!' },
    ckTook: { es: ['¡Te comí!', '¡Ñam!'], pt: ['Comi!', 'Nham!'], de: ['Geschlagen!', 'Hab ihn!'], en: ['Got one!', 'Yum!'] },
    ckTookMany: { es: '¡Te comí {n} de una vez!', pt: 'Comi {n} de uma vez!', de: '{n} auf einmal!', en: 'I took {n} at once!' },
    ckLost: { es: '¡Ay!', pt: 'Ai!', de: 'Autsch!', en: 'Ouch!' },
    ckCrownAi: { es: '¡Dama! ¡Ahora vuelo!', pt: 'Dama! Agora eu voo!', de: 'Dame! Jetzt geht’s los!', en: 'Crowned! Now watch out!' },
    ckCrownYou: { es: 'Uy… una dama.', pt: 'Xi… uma dama.', de: 'Oh … eine Dame.', en: 'Ooh… a king.' },
    ckAiWins: { es: '¡Gané! ¡A pagar!', pt: 'Ganhei! Pode pagar!', de: 'Gewonnen! Her mit den Münzen!', en: 'I won! Pay up!' },
    ckAiWinsFun: { es: '¡Gané! ¿Otra partidita?', pt: 'Ganhei! Mais uma partidinha?', de: 'Gewonnen! Noch ein Spielchen?', en: 'I won! Another little game?' },
    ckYouWin: { es: '¡Ay! Me ganaste…', pt: 'Ai! Você me ganhou…', de: 'Oh! Du hast gewonnen …', en: 'Oh! You beat me…' },
    tinoOuch: { es: ['¡Uy, eso duele!', '¡Huy, huy, huy!'], pt: ['Ui, essa doeu!', 'Eita!'], de: ['Autsch, das tut weh!', 'Oha!'], en: ['Ouch, that hurts!', 'Whoa!'] },
    tinoNice: { es: '¡Buena jugada!', pt: 'Boa jogada!', de: 'Guter Zug!', en: 'Nice move!' },
    hello: { es: '¡Hola!', pt: 'Oi!', de: 'Hallo!', en: 'Hi!' },
  };
  // zh / ja: the same talk (arrays are variants; the kids are casual, the hustlers polite in Japanese). Rock-paper-scissors is
  // 石头剪刀布 / じゃんけんぽん, with あいこでしょ on a tie; Chinese chess words for check and mate (将军, 将死).
  {
    const C = {
      tagGo: ['[三|sān] ， [二|èr] ， [一|yī] … [跑|pǎo] ！', 'さん 、 に 、 いち … スタート ！'], go: ['[跑|pǎo] ！', 'スタート ！'], here: ['[我|wǒ] [在|zài] [这里|zhè lǐ] ！', 'ここ だ よ ！'],
      gonnaGet: [['[我|wǒ] [要|yào] [抓|zhuā] [到|dào] [你|nǐ] ！', '[你|nǐ] [等|děng] [着|zhe] ！'], ['つかまえて やる ！', 'まってろー ！']],
      run: ['[快|kuài] [跑|pǎo] ， [快|kuài] [跑|pǎo] ！', 'にげろ 、 にげろ ！'], ohNo: ['[哎呀|āi yā] ， [不|bù] [好|hǎo] ！', 'あ 、 しまった ！'], nyah: ['[碰|pèng] [不到|bù dào] [我|wǒ] ！', 'べー だ ！'],
      outWarn: ['[回|huí] [广场|guǎng chǎng] [来|lái] ！', '[広場|ひろば] に [戻|もど]って ！'], leftPlaza: ['[不|bù] [能|néng] [出去|chū qù] ！ [你|nǐ] [当|dāng] [鬼|guǐ] ！', '[出|で]たら だめ ！ [鬼|おに] だ よ ！'],
      timeUp: ['[时间|shí jiān] [到|dào] ！', '[時間|じかん] ぎれ ！'],
      hmmHere: ['[嗯|ng] … [这里|zhè lǐ] ？', 'うーん … ここ ？'], notHere: ['[不|bù] [在|zài] [这里|zhè lǐ] …', 'ここ じゃ ない …'], giggle: ['[嘻嘻|xī xī] ！', 'くすくす ！'],
      youFoundMe: ['[哎呀|āi yā] ， [被|bèi] [你|nǐ] [找到|zhǎo dào] [了|le] ！', 'あ 、 [見|み]つかっちゃった ！'], giveUpWhere: ['[我|wǒ] [认输|rèn shū] ！ [你|nǐ] [在|zài] [哪里|nǎ lǐ] ？', 'もう だめ ！ どこ に いる の ？'],
      myTurn: ['[该|gāi] [我|wǒ] [了|le] ！', 'わたし の [番|ばん] ！'], uhoh: ['[哎呀呀|āi yā ya] ！', 'あらら ！'],
      tttKidWins: ['[三|sān] [个|gè] [连|lián] [成|chéng] [一|yī] [线|xiàn] ！ [我|wǒ] [赢|yíng] [了|le] ！', '[三|みっ]つ ならんだ ！ [勝|か]った ！'], tttYouWin: ['[不|bù] [算|suàn] ！ [再|zài] [来|lái] ！', 'ずるい ！ もう [一回|いっかい] ！'],
      taken: ['[那里|nà lǐ] [已经|yǐ jīng] [有|yǒu] [了|le] ！', 'そこ は もう うまって る よ ！'], tttHuh: ['[哪里|nǎ lǐ] ？ [说|shuō] “ [上|shàng] ” 、 “ [下|xià] ” 、 “ [左|zuǒ] ” …', 'どこ ？ 「 うえ 」 、 「 した 」 、 「 ひだり 」 … って [言|い]って'],
      inLang: ['[说|shuō] [中文|zhōng wén] ！', '[日本語|にほんご] で ！'], wellSaid: [['[说|shuō] [得|de] [好|hǎo] ！', '[对|duì] ！'], ['いい ね ！', 'そう ！']],
      matchKidWins: ['[这|zhè] [局|jú] [我|wǒ] [赢|yíng] [了|le] ！', 'しょうぶ は わたし の [勝|か]ち ！'], matchYouWin: ['[你|nǐ] [赢|yíng] [了|le] ！ [可是|kě shì] [下|xià] [次|cì] …', 'あなた の [勝|か]ち ！ でも つぎ は …'],
      chant: ['[石头|shí tou] ， [剪刀|jiǎn dāo] ， [布|bù] ！', 'じゃんけん 、 ぽん ！'],
      same: ['[平|píng] [了|le] ！ [再|zài] [来|lái] ！', 'あいこ で しょ ！'], kidPoint: ['[我|wǒ] [得|dé] [一|yī] [分|fēn] ！', 'わたし の [一点|いってん] ！'], youPoint: ['[哎呀|āi yā] ， [你|nǐ] [得|dé] [一|yī] [分|fēn] ！', 'あー 、 そっち の [一点|いってん] ！'],
      rpsHuh: ['[那|nà] [是|shì] [什么|shén me] ？ [石头|shí tou] 、 [剪刀|jiǎn dāo] [还是|hái shi] [布|bù] 。', 'なに それ ？ グー 、 チョキ 、 パー だ よ 。'],
      yourMove: [['[该|gāi] [你|nǐ] [了|le] 。', '[该|gāi] [你|nǐ] [了|le] 。 [好好|hǎo hǎo] [想|xiǎng] [想|xiang] …'], ['どうぞ 。', 'どうぞ 。 よく [考|かんが]えて …']],
      thinking: [['[嗯|ng] … [我|wǒ] [看看|kàn kan] …', '[让|ràng] [我|wǒ] [想|xiǎng] [想|xiang] …'], ['ふむ … さて …', 'ちょっと [考|かんが]えさせて ください …']],
      banter: [['[确定|què dìng] [吗|ma] ？', '[想|xiǎng] [想|xiǎng] ， [想|xiǎng] [想|xiǎng] …', '[哈|hā] ！ [我|wǒ] [就|jiù] [知道|zhī dào] 。', '[有意思|yǒu yì si] …'], ['[本当|ほんとう] に それ で いい です か ？', 'よく [考|かんが]えて …', 'ほら 、 やっぱり 。', 'おもしろい …']],
      check: ['[将军|jiāng jūn] ！', 'チェック ！'], youCheck: ['[哦|ò] … [将军|jiāng jūn] 。', 'おや … チェック です ね 。'],
      aiMates: ['[将死|jiāng sǐ] [了|le] ！ [给|gěi] [钱|qián] [吧|ba] ！', 'チェックメイト ！ では 、 コイン を いただきます 。'], aiMatesFun: ['[将死|jiāng sǐ] [了|le] ！ [再|zài] [来|lái] [一|yī] [盘|pán] ？', 'チェックメイト ！ もう [一局|いっきょく] いかが ？'],
      youMate: ['[将死|jiāng sǐ] … [下|xià] [得|de] [好|hǎo] 。', 'チェックメイト … お[見事|みごと] です 。'], draw: ['[和棋|hé qí] ！', '[引|ひ]き[分|わ]け です ！'], stalemate: ['[逼和|bī hé] ！ [是|shì] [和棋|hé qí] 。', 'ステイルメイト ！ [引|ひ]き[分|わ]け です 。'],
      aiResigns: ['[我|wǒ] [认输|rèn shū] 。 [真|zhēn] [是|shì] [一|yī] [盘|pán] [好|hǎo] [棋|qí] ！', '[参|まい]りました 。 いい [勝負|しょうぶ] でした ！'], youResign: ['[你|nǐ] [认输|rèn shū] [了|le] ？ [金币|jīn bì] [归|guī] [我|wǒ] [了|le] ！', '[参|まい]りました か ？ では 、 コイン は わたし が 。'],
      youResignFun: ['[这么|zhè me] [快|kuài] [就|jiù] [走|zǒu] ？ [快|kuài] [回来|huí lái] ！', 'もう お[帰|かえ]り です か ？ また どうぞ ！'], flattered: ['[谢谢|xiè xie] ！ [你|nǐ] [下|xià] [得|de] [也|yě] [不错|bù cuò] 。', 'ありがとう ございます ！ あなた も なかなか です よ 。'],
      flatteredF: ['[谢谢|xiè xie] ！ [你|nǐ] [下|xià] [得|de] [也|yě] [不错|bù cuò] 。', 'ありがとう ございます ！ あなた も なかなか です よ 。'],
      notCheck: ['[将军|jiāng jūn] ？ [这|zhè] [不|bù] [是|shì] [将军|jiāng jūn] ！', 'チェック ？ それ は チェック じゃ ありません よ ！'], rightCheck: ['[是|shì] [是|shì] ， [我|wǒ] [看到|kàn dào] [了|le] …', 'はい 、 はい 、 わかって います よ …'],
      notYourTurn: ['[我|wǒ] [马上|mǎ shàng] [走|zǒu] ！', 'いま [指|さ]します から ！'], announceOk: [['[对|duì] ！ [就|jiù] [是|shì] [这么|zhè me] [说|shuō] 。', '[说|shuō] [得|de] [好|hǎo] 。', '[你|nǐ] [说|shuō] [得|de] [像|xiàng] [行家|háng jia] 。'], ['そう ！ そう [言|い]う ん です 。', 'お[見事|みごと] 。', 'プロ みたい です ね 。']],
      noSuchMove: ['[这|zhè] [步|bù] [不能|bù néng] [走|zǒu] 。', 'その [手|て] は [指|さ]せません 。'], which: ['[哪|nǎ] [一个|yī gè] ？ [有|yǒu] [两|liǎng] [个|gè] 。', 'どっち です か ？ [二|ふた]つ あります 。'], mustTake: ['[你|nǐ] [得|děi] [吃|chī] ！', '[取|と]らなきゃ だめ です よ ！'],
      ckTook: [['[吃|chī] [掉|diào] [了|le] ！', '[好|hǎo] [吃|chī] ！'], ['いただき ！', 'いただきます ！']], ckTookMany: ['[一|yī] [次|cì] [吃|chī] [了|le] {n} [个|gè] ！', '{n} [個|こ] も いただきました ！'], ckLost: ['[哎哟|āi yō] ！', 'あいたた ！'],
      ckCrownAi: ['[升|shēng] [王|wáng] [了|le] ！ [现在|xiàn zài] [小心|xiǎo xīn] [了|le] ！', 'キング に なりました ！ さあ 、 [気|き] を つけて ！'], ckCrownYou: ['[哦|ò] … [一个|yī gè] [王|wáng] 。', 'おや … キング です ね 。'],
      ckAiWins: ['[我|wǒ] [赢|yíng] [了|le] ！ [给|gěi] [钱|qián] [吧|ba] ！', 'わたし の [勝|か]ち ！ では 、 コイン を いただきます 。'], ckAiWinsFun: ['[我|wǒ] [赢|yíng] [了|le] ！ [再|zài] [来|lái] [一|yī] [盘|pán] ？', 'わたし の [勝|か]ち ！ もう [一局|いっきょく] いかが ？'],
      ckYouWin: ['[哎呀|āi yā] ！ [你|nǐ] [赢|yíng] [了|le] …', 'あら ！ [負|ま]けました …'], tinoOuch: [['[哎哟|āi yō] ， [这|zhè] [下|xià] [疼|téng] [了|le] ！', '[哇|wā] ！'], ['おっと 、 それ は [痛|いた]い ！', 'おお ！']], tinoNice: ['[好|hǎo] [棋|qí] ！', 'いい [手|て] です ね ！'],
      hello: ['[你好|nǐ hǎo] ！', 'こんにちは ！'],
    };
    for (const [k, [zh, ja]] of Object.entries(C)) if (SAY[k]) { SAY[k].zh = zh; SAY[k].ja = ja; }
    SAY.beats.stone.zh = '[石头|shí tou] [砸|zá] [剪刀|jiǎn dāo] 。'; SAY.beats.stone.ja = 'グー は チョキ に [勝|か]つ 。';
    SAY.beats.scissors.zh = '[剪刀|jiǎn dāo] [剪|jiǎn] [布|bù] 。'; SAY.beats.scissors.ja = 'チョキ は パー に [勝|か]つ 。';
    SAY.beats.paper.zh = '[布|bù] [包|bāo] [石头|shí tou] 。'; SAY.beats.paper.ja = 'パー は グー に [勝|か]つ 。';
  }
  function sayOf(key, vars = {}, R = Math.random) {
    const e = typeof key === 'string' ? SAY[key] : key; if (!e) return { tl: key, en: key };
    const l = lang(), v = e[l], en = e.en;
    const i = Array.isArray(v) ? Math.floor(R() * v.length) : 0;
    const fill = s => String(s).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    return { tl: fill(Array.isArray(v) ? v[i] : v), en: fill(Array.isArray(en) ? en[Math.min(i, en.length - 1)] : en) };
  }

  // ================================================================ engines (pure logic: no THREE, no DOM)
  // ---------------- tic-tac-toe. Cells 0..8, reading order (0 top left, 4 the middle, 8 bottom right).
  const TTT = (() => {
    const LINES3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
    function winner(b) {
      for (const L of LINES3) { const [a, c, d] = L; if (b[a] && b[a] === b[c] && b[a] === b[d]) return { who: b[a], line: L }; }
      return b.every(Boolean) ? { who: 'draw' } : null;
    }
    const empty = b => b.map((v, i) => (v ? -1 : i)).filter(i => i >= 0);
    const wins = (b, i, who) => { const c = b.slice(); c[i] = who; const w = winner(c); return !!(w && w.who === who); };
    // minimax: +10−depth when `me` wins, −10+depth when the other one does (memoized: there are only a few thousand boards)
    const MEMO = new Map();
    function score(b, me, turn, depth) {
      const k = b.map(v => v || '.').join('') + me + turn + depth, hit = MEMO.get(k); if (hit !== undefined) return hit;
      const w = winner(b);
      let best;
      if (w) best = w.who === 'draw' ? 0 : w.who === me ? 10 - depth : depth - 10;
      else {
        best = turn === me ? -99 : 99;
        for (const i of empty(b)) { b[i] = turn; const s = score(b, me, turn === 'X' ? 'O' : 'X', depth + 1); b[i] = null; best = turn === me ? Math.max(best, s) : Math.min(best, s); }
      }
      MEMO.set(k, best);
      return best;
    }
    function bestMoves(b, me) {
      const opp = me === 'X' ? 'O' : 'X'; let best = -99, out = [];
      for (const i of empty(b)) { b[i] = me; const s = score(b, me, opp, 1); b[i] = null; if (s > best) { best = s; out = [i]; } else if (s === best) out.push(i); }
      return out;
    }
    // A kid's move: usually takes a win (not always: kids get excited), usually blocks yours, now and then plays anywhere.
    function kidMove(b, me, o = {}, R = Math.random) {
      const miss = o.miss !== undefined ? o.miss : 0.35, wild = o.wild !== undefined ? o.wild : 0.25, blind = o.blind !== undefined ? o.blind : 0.15, opp = me === 'X' ? 'O' : 'X', free = empty(b);
      if (!free.length) return -1;
      const win = free.filter(i => wins(b, i, me)); if (win.length && R() > blind) return pick(win, R);
      const block = free.filter(i => wins(b, i, opp)); if (block.length && R() > miss) return pick(block, R);
      if (R() < wild) return pick(free, R);
      if (free.length === 9) return pick([0, 2, 4, 6, 8, 4], R);           // (an opening move: corners and the middle)
      return pick(bestMoves(b, me), R);
    }
    return { LINES3, winner, empty, wins, bestMoves, kidMove, score };
  })();

  // ---------------- rock, paper, scissors
  const RPS = (() => {
    const BEATS = { stone: 'scissors', scissors: 'paper', paper: 'stone' }, ALL = ['stone', 'paper', 'scissors'];
    const result = (a, b) => (a === b ? 0 : BEATS[a] === b ? 1 : -1);      // 1: a wins
    const counter = x => ALL.find(k => BEATS[k] === x);                        // what beats x
    // Kids aren't random: after a win they often throw the same again; after a loss they often throw what would have
    // beaten your last throw. So a player who watches can read them.
    // hist: [{ you, kid, r }], r from the kid's side (1: she won the throw, −1: she lost it)
    function kidThrow(hist, R = Math.random) {
      const last = hist[hist.length - 1];
      if (last) {
        if (last.r > 0 && R() < 0.5) return last.kid;                         // (she won: same again)
        if (last.r < 0 && R() < 0.45) return counter(last.you);               // (she lost: what beats your last)
      }
      return pick(ALL, R);
    }
    return { BEATS, ALL, result, counter, kidThrow };
  })();

  // ---------------- chess (0x88 board: square = rank·16 + file, rank 0 = the 8th rank). Pieces: 'PNBRQK' white, 'pnbrqk' black.
  const CHESS = (() => {
    const KN = [-33, -31, -18, -14, 14, 18, 31, 33], KG = [-17, -16, -15, -1, 1, 15, 16, 17], DIAG = [-17, -15, 15, 17], ORTH = [-16, -1, 1, 16];
    const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    const colorOf = p => (p ? (p < 'a' ? 'w' : 'b') : null);
    const typeOf = p => p.toLowerCase();
    const other = c => (c === 'w' ? 'b' : 'w');
    const sqName = s => 'abcdefgh'[s & 7] + (8 - (s >> 4));
    const sqOf = n => { const f = n.charCodeAt(0) - 97, r = n.charCodeAt(1) - 49; return f < 0 || f > 7 || r < 0 || r > 7 ? -1 : (7 - r) * 16 + f; };
    const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    function fromFEN(fen) {
      const [rows, turn, cas, ep, half, full] = fen.trim().split(/\s+/);
      const b = new Array(128).fill(null), k = { w: -1, b: -1 };
      rows.split('/').forEach((row, r) => { let f = 0; for (const ch of row) { if (ch >= '1' && ch <= '8') f += +ch; else { b[r * 16 + f] = ch; if (ch === 'K') k.w = r * 16 + f; if (ch === 'k') k.b = r * 16 + f; f++; } } });
      const c = cas || '-';
      const pos = { b, turn: turn || 'w', castle: { K: c.includes('K'), Q: c.includes('Q'), k: c.includes('k'), q: c.includes('q') }, ep: ep && ep !== '-' ? sqOf(ep) : -1, half: +(half || 0), full: +(full || 1), k, hist: [] };
      pos.hist.push(key(pos));
      return pos;
    }
    function toFEN(pos) {
      let s = '';
      for (let r = 0; r < 8; r++) { let e = 0; for (let f = 0; f < 8; f++) { const p = pos.b[r * 16 + f]; if (!p) e++; else { if (e) { s += e; e = 0; } s += p; } } if (e) s += e; if (r < 7) s += '/'; }
      const C = pos.castle, cs = (C.K ? 'K' : '') + (C.Q ? 'Q' : '') + (C.k ? 'k' : '') + (C.q ? 'q' : '');
      return `${s} ${pos.turn} ${cs || '-'} ${pos.ep >= 0 ? sqName(pos.ep) : '-'} ${pos.half} ${pos.full}`;
    }
    function key(pos) { const C = pos.castle; let s = ''; for (let sq = 0; sq < 128; sq++) { if (sq & 0x88) { sq += 7; continue; } s += pos.b[sq] || '.'; } return s + pos.turn + (C.K ? 'K' : '') + (C.Q ? 'Q' : '') + (C.k ? 'k' : '') + (C.q ? 'q' : '') + pos.ep; }
    // is square sq attacked by side `by`?
    function attacked(pos, sq, by) {
      const b = pos.b;
      if (by === 'w') { if (!((sq + 15) & 0x88) && b[sq + 15] === 'P') return true; if (!((sq + 17) & 0x88) && b[sq + 17] === 'P') return true; }
      else { if (!((sq - 15) & 0x88) && b[sq - 15] === 'p') return true; if (!((sq - 17) & 0x88) && b[sq - 17] === 'p') return true; }
      const N = by === 'w' ? 'N' : 'n', K = by === 'w' ? 'K' : 'k', B = by === 'w' ? 'B' : 'b', R = by === 'w' ? 'R' : 'r', Q = by === 'w' ? 'Q' : 'q';
      for (const d of KN) { const s = sq + d; if (!(s & 0x88) && b[s] === N) return true; }
      for (const d of KG) { const s = sq + d; if (!(s & 0x88) && b[s] === K) return true; }
      for (const d of DIAG) { let s = sq + d; while (!(s & 0x88)) { const p = b[s]; if (p) { if (p === B || p === Q) return true; break; } s += d; } }
      for (const d of ORTH) { let s = sq + d; while (!(s & 0x88)) { const p = b[s]; if (p) { if (p === R || p === Q) return true; break; } s += d; } }
      return false;
    }
    const inCheck = (pos, c = pos.turn) => pos.k[c] >= 0 && attacked(pos, pos.k[c], other(c));
    // every move, ignoring whether it leaves your own king in check (legal() filters that)
    function gen(pos) {
      const b = pos.b, me = pos.turn, out = [], up = me === 'w' ? -16 : 16, startR = me === 'w' ? 6 : 1, lastR = me === 'w' ? 0 : 7;
      for (let sq = 0; sq < 128; sq++) {
        if (sq & 0x88) { sq += 7; continue; }
        const p = b[sq]; if (!p || colorOf(p) !== me) continue;
        const t = typeOf(p);
        if (t === 'p') {
          const one = sq + up;
          if (!(one & 0x88) && !b[one]) {
            if ((one >> 4) === lastR) for (const pr of 'qrbn') out.push({ from: sq, to: one, p, promo: pr });
            else { out.push({ from: sq, to: one, p }); const two = one + up; if ((sq >> 4) === startR && !b[two]) out.push({ from: sq, to: two, p, dbl: 1 }); }
          }
          for (const to of [one - 1, one + 1]) {
            if (to & 0x88) continue;
            const q = b[to];
            if (q && colorOf(q) !== me) { if ((to >> 4) === lastR) for (const pr of 'qrbn') out.push({ from: sq, to, p, cap: q, promo: pr }); else out.push({ from: sq, to, p, cap: q }); }
            else if (!q && to === pos.ep) out.push({ from: sq, to, p, cap: me === 'w' ? 'p' : 'P', ep: 1 });
          }
        } else if (t === 'n' || t === 'k') {
          for (const d of (t === 'n' ? KN : KG)) { const to = sq + d; if (to & 0x88) continue; const q = b[to]; if (!q) out.push({ from: sq, to, p }); else if (colorOf(q) !== me) out.push({ from: sq, to, p, cap: q }); }
          if (t === 'k') {
            const opp = other(me), home = me === 'w' ? 116 : 4, R = me === 'w' ? 'R' : 'r', C = pos.castle;
            if (sq === home) {
              if ((me === 'w' ? C.K : C.k) && b[home + 3] === R && !b[home + 1] && !b[home + 2] && !attacked(pos, home, opp) && !attacked(pos, home + 1, opp) && !attacked(pos, home + 2, opp)) out.push({ from: sq, to: home + 2, p, castle: 'k' });
              if ((me === 'w' ? C.Q : C.q) && b[home - 4] === R && !b[home - 1] && !b[home - 2] && !b[home - 3] && !attacked(pos, home, opp) && !attacked(pos, home - 1, opp) && !attacked(pos, home - 2, opp)) out.push({ from: sq, to: home - 2, p, castle: 'q' });
            }
          }
        } else {
          for (const d of (t === 'b' ? DIAG : t === 'r' ? ORTH : KG)) { let to = sq + d; while (!(to & 0x88)) { const q = b[to]; if (!q) out.push({ from: sq, to, p }); else { if (colorOf(q) !== me) out.push({ from: sq, to, p, cap: q }); break; } to += d; } }
        }
      }
      return out;
    }
    const CORNER = { 119: 'K', 112: 'Q', 7: 'k', 0: 'q' };
    function make(pos, m) {
      const b = pos.b, me = pos.turn, u = { castle: pos.castle, ep: pos.ep, half: pos.half, kw: pos.k.w, kb: pos.k.b };
      pos.castle = Object.assign({}, pos.castle);
      b[m.from] = null;
      b[m.to] = m.promo ? (me === 'w' ? m.promo.toUpperCase() : m.promo) : m.p;
      if (m.ep) b[m.to + (me === 'w' ? 16 : -16)] = null;
      if (m.castle) { const h = me === 'w' ? 116 : 4; if (m.castle === 'k') { b[h + 1] = b[h + 3]; b[h + 3] = null; } else { b[h - 1] = b[h - 4]; b[h - 4] = null; } }
      if (typeOf(m.p) === 'k') { pos.k[me] = m.to; if (me === 'w') pos.castle.K = pos.castle.Q = false; else pos.castle.k = pos.castle.q = false; }
      if (CORNER[m.from]) pos.castle[CORNER[m.from]] = false;
      if (CORNER[m.to]) pos.castle[CORNER[m.to]] = false;
      pos.ep = m.dbl ? m.from + (me === 'w' ? -16 : 16) : -1;
      pos.half = typeOf(m.p) === 'p' || m.cap ? 0 : pos.half + 1;
      if (me === 'b') pos.full++;
      pos.turn = other(me);
      return u;
    }
    function unmake(pos, m, u) {
      const b = pos.b; pos.turn = other(pos.turn); const me = pos.turn;
      if (me === 'b') pos.full--;
      b[m.from] = m.p;
      b[m.to] = m.ep ? null : (m.cap || null);
      if (m.ep) b[m.to + (me === 'w' ? 16 : -16)] = m.cap;
      if (m.castle) { const h = me === 'w' ? 116 : 4; if (m.castle === 'k') { b[h + 3] = b[h + 1]; b[h + 1] = null; } else { b[h - 4] = b[h - 1]; b[h - 1] = null; } }
      pos.castle = u.castle; pos.ep = u.ep; pos.half = u.half; pos.k.w = u.kw; pos.k.b = u.kb;
    }
    function legal(pos) {
      const me = pos.turn, out = [];
      for (const m of gen(pos)) { const u = make(pos, m); if (!attacked(pos, pos.k[me], other(me))) out.push(m); unmake(pos, m, u); }
      return out;
    }
    function perft(pos, d) { if (!d) return 1; let n = 0; for (const m of legal(pos)) { const u = make(pos, m); n += perft(pos, d - 1); unmake(pos, m, u); } return n; }
    // a game move (not a search move): keeps the history for threefold repetition
    function play(pos, m) { make(pos, m); pos.hist.push(key(pos)); return pos; }
    function insufficient(pos) {
      const minors = [];
      for (let sq = 0; sq < 128; sq++) { if (sq & 0x88) { sq += 7; continue; } const p = pos.b[sq]; if (!p) continue; const t = typeOf(p); if (t === 'k') continue; if (t === 'p' || t === 'r' || t === 'q') return false; minors.push({ t, c: colorOf(p), sq }); }
      if (minors.length <= 1) return true;                                               // K v K, K+minor v K
      if (minors.every(m => m.t === 'b')) { const shade = m => (((m.sq >> 4) + (m.sq & 7)) & 1); return minors.every(m => shade(m) === shade(minors[0])); }   // bishops all on one color
      return false;
    }
    function status(pos) {
      const moves = legal(pos), check = inCheck(pos);
      if (!moves.length) return check ? { over: true, result: other(pos.turn), why: 'mate', check, moves } : { over: true, result: 'draw', why: 'stalemate', check, moves };
      if (pos.half >= 100) return { over: true, result: 'draw', why: 'fifty', check, moves };
      if (insufficient(pos)) return { over: true, result: 'draw', why: 'material', check, moves };
      const k = key(pos); if (pos.hist.filter(h => h === k).length >= 3) return { over: true, result: 'draw', why: 'repetition', check, moves };
      return { over: false, check, moves };
    }
    // ---- the evaluation: material + piece-square tables (Michniewski's simplified tables), from white's view
    const PST = {
      p: [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
      n: [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
      b: [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
      r: [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
      q: [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
      k: [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20],
      ke: [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50],
    };
    function evaluate(pos) {
      const b = pos.b; let mat = 0, queens = 0, s = 0;
      for (let sq = 0; sq < 128; sq++) { if (sq & 0x88) { sq += 7; continue; } const p = b[sq]; if (!p) continue; const t = typeOf(p); if (t === 'q') queens++; if (t !== 'k' && t !== 'p') mat += VAL[t]; }
      const end = queens === 0 || mat <= 1300;
      for (let sq = 0; sq < 128; sq++) {
        if (sq & 0x88) { sq += 7; continue; }
        const p = b[sq]; if (!p) continue;
        const t = typeOf(p), w = p < 'a', r = sq >> 4, i = (w ? r : 7 - r) * 8 + (sq & 7);
        const v = VAL[t] + (t === 'k' ? (end ? PST.ke : PST.k)[i] : PST[t][i]);
        s += w ? v : -v;
      }
      return s;
    }
    const MATE = 100000;
    function search(pos, depth, alpha, beta, ply, ctx) {
      ctx.nodes++;
      const moves = legal(pos);
      if (!moves.length) return inCheck(pos) ? -MATE + ply : 0;
      if (pos.half >= 100) return 0;
      if (depth <= 0) return (pos.turn === 'w' ? 1 : -1) * evaluate(pos);
      moves.sort((a, b) => (b.cap ? VAL[typeOf(b.cap)] * 10 - VAL[typeOf(b.p)] : 0) - (a.cap ? VAL[typeOf(a.cap)] * 10 - VAL[typeOf(a.p)] : 0) + (b.promo ? 800 : 0) - (a.promo ? 800 : 0));
      let best = -Infinity;
      for (const m of moves) {
        const u = make(pos, m); const v = -search(pos, depth - 1, -beta, -alpha, ply + 1, ctx); unmake(pos, m, u);
        if (v > best) best = v; if (v > alpha) alpha = v; if (alpha >= beta) break;
      }
      return best;
    }
    // The hustler's move: every move searched to `depth` plies (2: his move and your reply), then a little noise, so he
    // isn't the same every game and now and then picks a slightly worse move. Returns the move with .score (his view).
    function bestMove(pos, o = {}) {
      const depth = o.depth || 2, noise = o.noise !== undefined ? o.noise : 22, R = o.rand || Math.random, ctx = { nodes: 0 };
      const moves = legal(pos); if (!moves.length) return null;
      const scored = moves.map(m => { const u = make(pos, m); const v = -search(pos, depth - 1, -Infinity, Infinity, 1, ctx); unmake(pos, m, u); return { m, v, n: v + (R() * 2 - 1) * noise + (m.promo && m.promo !== 'q' ? -400 : 0) }; });
      scored.sort((a, b) => b.n - a.n);
      const r = scored[0].m; r.score = scored[0].v; r.nodes = ctx.nodes;
      return r;
    }
    // ---- notation, in the language's own piece letters (es R D T A C, pt R D T B C, de K D T L S)
    const LETTER = { es: { k: 'R', q: 'D', r: 'T', b: 'A', n: 'C' }, pt: { k: 'R', q: 'D', r: 'T', b: 'B', n: 'C' }, de: { k: 'K', q: 'D', r: 'T', b: 'L', n: 'S' }, en: { k: 'K', q: 'Q', r: 'R', b: 'B', n: 'N' } };
    function san(pos, m, L = 'en') {
      let s;
      if (m.castle) s = m.castle === 'k' ? 'O-O' : 'O-O-O';
      else {
        const t = typeOf(m.p), letters = LETTER[L] || LETTER.en;
        if (t === 'p') { s = (m.cap ? 'abcdefgh'[m.from & 7] + 'x' : '') + sqName(m.to) + (m.promo ? '=' + letters[m.promo] : ''); }
        else {
          s = letters[t];
          const twins = legal(pos).filter(o => o.p === m.p && o.to === m.to && o.from !== m.from);
          if (twins.length) { const sameFile = twins.some(o => (o.from & 7) === (m.from & 7)), sameRank = twins.some(o => (o.from >> 4) === (m.from >> 4)); s += !sameFile ? 'abcdefgh'[m.from & 7] : !sameRank ? String(8 - (m.from >> 4)) : sqName(m.from); }
          s += (m.cap ? 'x' : '') + sqName(m.to);
        }
      }
      const u = make(pos, m); const replies = legal(pos).length, chk = inCheck(pos); unmake(pos, m, u);
      return s + (chk ? (replies ? '+' : '#') : '');
    }
    return { START, fromFEN, toFEN, key, attacked, inCheck, gen, legal, make, unmake, play, perft, status, evaluate, search, bestMove, san, sqName, sqOf, colorOf, typeOf, other, VAL, LETTER, insufficient };
  })();

  // ---------------- checkers (English draughts: men move and take forward, captures are forced, a multi-jump is one move,
  // kings move one step any way, crowning ends the move). 64 squares, r·8 + c, dark squares only ((r + c) odd).
  // 'w' / 'W': you (cream, the bottom rows, moving up); 'b' / 'B': the hustler (red, moving down). You move first.
  const CHECKERS = (() => {
    const owner = p => (p ? p.toLowerCase() : null), isKing = p => p === 'W' || p === 'B', other = c => (c === 'w' ? 'b' : 'w');
    const crownRow = c => (c === 'w' ? 0 : 7);
    function start() { const b = new Array(64).fill(null); for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if ((r + c) % 2 === 1) { if (r < 3) b[r * 8 + c] = 'b'; else if (r > 4) b[r * 8 + c] = 'w'; } return { b, turn: 'w', quiet: 0, hist: [] }; }
    function fromString(s, turn = 'w') { const b = s.replace(/\s+/g, '').split('').map(ch => (ch === '.' ? null : ch)); return { b, turn, quiet: 0, hist: [] }; }
    const dirsOf = p => (isKing(p) ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : owner(p) === 'w' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]);
    function jumpsFrom(b, sq, p) {          // (b has sq emptied while we look)
      const out = [], me = owner(p);
      (function dfs(at, path, caps) {
        let more = false; const r = at >> 3, c = at & 7;
        for (const [dr, dc] of dirsOf(p)) {
          const r2 = r + 2 * dr, c2 = c + 2 * dc; if (r2 < 0 || r2 > 7 || c2 < 0 || c2 > 7) continue;
          const mid = (r + dr) * 8 + (c + dc), land = r2 * 8 + c2, q = b[mid];
          if (!q || owner(q) === me || caps.includes(mid) || b[land]) continue;
          more = true;
          if (!isKing(p) && r2 === crownRow(me)) out.push({ from: path[0], path: path.concat(land), caps: caps.concat(mid), crown: true });
          else dfs(land, path.concat(land), caps.concat(mid));
        }
        if (!more && caps.length) out.push({ from: path[0], path: path.slice(), caps: caps.slice(), crown: false });
      })(sq, [sq], []);
      return out;
    }
    function moves(pos) {
      const b = pos.b, me = pos.turn, caps = [], quiet = [];
      for (let sq = 0; sq < 64; sq++) {
        const p = b[sq]; if (!p || owner(p) !== me) continue;
        b[sq] = null; caps.push(...jumpsFrom(b, sq, p)); b[sq] = p;
        if (caps.length) continue;
        const r = sq >> 3, c = sq & 7;
        for (const [dr, dc] of dirsOf(p)) { const r1 = r + dr, c1 = c + dc; if (r1 < 0 || r1 > 7 || c1 < 0 || c1 > 7) continue; const to = r1 * 8 + c1; if (!b[to]) quiet.push({ from: sq, path: [sq, to], caps: [], crown: !isKing(p) && r1 === crownRow(me) }); }
      }
      return caps.length ? caps : quiet;
    }
    const to = m => m.path[m.path.length - 1];
    function apply(pos, m) {
      const b = pos.b.slice(), p = b[m.from];
      b[m.from] = null; for (const s of m.caps) b[s] = null;
      b[to(m)] = m.crown ? p.toUpperCase() : p;
      return { b, turn: other(pos.turn), quiet: m.caps.length || m.crown ? 0 : pos.quiet + 1, hist: pos.hist };
    }
    const key = pos => pos.b.map(p => p || '.').join('') + pos.turn;
    function play(pos, m) { const n = apply(pos, m); n.hist = pos.hist.concat(key(n)); return n; }
    function evaluate(pos) {          // + is good for 'w'
      let s = 0, wn = 0, bn = 0;
      for (let sq = 0; sq < 64; sq++) {
        const p = pos.b[sq]; if (!p) continue;
        const r = sq >> 3, c = sq & 7, w = owner(p) === 'w', k = isKing(p);
        let v = k ? 165 : 100;
        if (!k) { v += (w ? 7 - r : r) * 4; if ((w && r === 7) || (!w && r === 0)) v += 8; }
        if (r >= 2 && r <= 5 && c >= 2 && c <= 5) v += 6;
        if (k) v += 7 - Math.abs(3.5 - r) - Math.abs(3.5 - c);
        if (c === 0 || c === 7) v -= 3;
        s += w ? v : -v; if (w) wn++; else bn++;
      }
      // ahead in pieces? trade down (simplify)
      if (wn !== bn) s += (wn > bn ? 1 : -1) * (24 - wn - bn) * 3;
      return s;
    }
    const WIN = 100000;
    function search(pos, d, a, bt, ext) {
      const ms = moves(pos);
      if (!ms.length) return -WIN - d;
      if (d <= 0) {
        if (ms[0].caps.length && ext > 0) d = 1, ext--;               // (a capture pending: look one more ply, a little)
        else return (pos.turn === 'w' ? 1 : -1) * evaluate(pos);
      }
      let best = -Infinity;
      for (const m of ms) { const v = -search(apply(pos, m), d - 1, -bt, -a, ext); if (v > best) best = v; if (v > a) a = v; if (a >= bt) break; }
      return best;
    }
    // o.slip (P6b, "please nerf the checkers guy too"): the chance of a deliberate mistake this move: a worse move that hands you
    // a piece (rather than two, or a king), else any worse one. Doña Reme's level picks depth, noise and slip (CK_LEVELS below).
    function bestMove(pos, o = {}) {
      const depth = o.depth || 3, noise = o.noise !== undefined ? o.noise : 14, ext = o.ext !== undefined ? o.ext : 1, R = o.rand || Math.random;
      const ms = moves(pos); if (!ms.length) return null;
      const scored = ms.map(m => { const v = -search(apply(pos, m), depth - 1, -Infinity, Infinity, ext); return { m, v, n: v + (R() * 2 - 1) * noise }; });
      scored.sort((a, b) => b.n - a.n);
      if (o.slip && scored.length > 1 && R() < o.slip) {
        const best = Math.max(...scored.map(x => x.v)), worse = scored.filter(x => x.v < best - 20);
        const gift = worse.filter(x => x.v >= best - 260 && x.v <= best - 60), pool = gift.length ? gift : worse.length ? worse : scored.slice(1);
        const pick = pool[Math.floor(R() * pool.length)]; pick.m.score = pick.v; pick.m.slip = true; return pick.m;
      }
      const r = scored[0].m; r.score = scored[0].v; return r;
    }
    function status(pos) {
      const ms = moves(pos);
      if (!ms.length) return { over: true, result: other(pos.turn), why: 'stuck', moves: ms };
      if (pos.quiet >= 60) return { over: true, result: 'draw', why: 'quiet', moves: ms };
      const k = key(pos); if (pos.hist.filter(h => h === k).length >= 3) return { over: true, result: 'draw', why: 'repetition', moves: ms };
      return { over: false, moves: ms };
    }
    const count = (pos, c) => pos.b.filter(p => owner(p) === c).length;
    return { start, fromString, moves, apply, play, evaluate, search, bestMove, status, key, owner, isKing, other, to, count };
  })();

  // ================================================================ reading what you type (in the language)
  // ---- a phrase: exact (no accents, case or punctuation), close (a slip or two: accepted, shown right), or not.
  // o.f: you're talking to a girl (Spanish «lenta», Portuguese «lerda»); o.m: to a boy. A form for the wrong one is
  // accepted and noted (agree: true means it matched the person).
  function phraseMatch(id, text, o = {}) {
    const it = (typeof LEX !== 'undefined' && LEX.item(id)) || PH[id]; if (!it) return { ok: false };
    if ((o.lang || lang()) === 'zh' || (o.lang || lang()) === 'ja') {          // zh / ja: characters, kana, pinyin or rōmaji alike (CJK.canon)
      const l = o.lang || lang(), key = canonCJ(text, l); if (!key) return { ok: false, empty: true };
      const forms = [it[l]].concat((it.alt && it.alt[l]) || []).filter(Boolean);
      for (const f of forms) if (canonCJ(f, l) === key) return { ok: true, exact: true, form: f, slip: false, agree: true, want: null };
      for (const f of forms) { const cf = canonCJ(f, l), tol = cf.length <= 6 ? 0 : cf.length <= 14 ? 1 : 2; if (lev(key, cf) <= tol) return { ok: true, exact: false, form: f, slip: true, agree: true, want: null }; }
      const best = forms.map(f => ({ f, d: lev(key, canonCJ(f, l)) })).sort((a, b) => a.d - b.d)[0];
      return { ok: false, close: !!best && best.d <= Math.max(2, Math.round(canonCJ(best.f, l).length * 0.3)), want: best && best.f };
    }
    const l = o.lang || lang(), n = nrm(text); if (!n) return { ok: false, empty: true };
    const main = it[l], fem = it.f && it.f[l];
    const isFem = f => !!fem && (f === fem || /\b(lenta|lerda|sua lerda)\b/.test(nrm(f)));
    // (the form that fits the person first, so a typo in «lenta» doesn't land on «lento»)
    let forms = [main].concat(fem ? [fem] : [], (it.alt && it.alt[l]) || []).filter(Boolean);
    if (fem && o.f !== undefined) forms = forms.filter(f => isFem(f) === !!o.f).concat(forms.filter(f => isFem(f) !== !!o.f));
    const hit = (f, d) => { const agree = !fem || o.f === undefined ? true : (o.f ? isFem(f) : !isFem(f)); return { ok: true, exact: d === 0, form: f, slip: d > 0, agree, want: !agree ? (o.f ? fem : main) : null }; };
    for (const f of forms) if (nrm(f) === n) return hit(f, 0);
    for (const f of forms) {
      const nf = nrm(f), tol = nf.length <= 6 ? 0 : nf.length <= 14 ? 1 : 2, d = lev(n, nf);
      if (d <= tol) return hit(f, d);
    }
    // close, but not enough (for a hint)
    const best = forms.map(f => ({ f, d: lev(n, nrm(f)) })).sort((a, b) => a.d - b.d)[0];
    return { ok: false, close: best && best.d <= Math.max(2, Math.round(nrm(best.f).length * 0.3)), want: best && best.f };
  }
  // ---- yes / no (to "shall we play?"). 'en' when it's English: the kids want it in the language.
  const YES = {
    es: ['si', 'claro', 'vale', 'dale', 'vamos', 'bueno', 'ok', 'okey', 'juguemos', 'quiero', 'obvio', 'por supuesto', 'puedo jugar', 'sale', 'va', 'orale', 'sii', 'siii', 'genial', 'me encantaria'],
    pt: ['sim', 'claro', 'bora', 'vamos', 'beleza', 'pode ser', 'ok', 'quero', 'opa', 'com certeza', 'posso brincar', 'posso jogar', 'ta', 'ta bom', 'demorou', 'partiu', 'simm', 'legal', 'oba'],
    de: ['ja', 'klar', 'gerne', 'gern', 'okay', 'ok', 'los', 'jawohl', 'na klar', 'logisch', 'auf jeden fall', 'darf ich mitspielen', 'kann ich mitspielen', 'ich will', 'super', 'jaa', 'yes bitte', 'warum nicht'],
  };
  const NO = { es: ['no', 'ahora no', 'luego', 'despues', 'no gracias', 'nop'], pt: ['nao', 'agora nao', 'depois', 'nao obrigado', 'nao obrigada', 'nem'], de: ['nein', 'jetzt nicht', 'spater', 'nein danke', 'nee', 'ne'] };
  const EN_WORDS = new Set(['yes', 'yeah', 'yep', 'sure', 'okay please', 'no', 'nope', 'please', 'top', 'bottom', 'left', 'right', 'middle', 'center', 'centre', 'rock', 'paper', 'scissors', 'stone', 'knight', 'bishop', 'rook', 'queen', 'king', 'pawn', 'to', 'found', 'you', 'can', 'play', 'i', 'the']);
  const looksEnglish = (n, l) => { const ws = n.split(' ').filter(Boolean); if (!ws.length) return false; const en = ws.filter(w => EN_WORDS.has(w)).length; return en > 0 && en >= ws.length * 0.6 && !(l === 'es' && ws.includes('no')) && !(l === 'pt' && ws.includes('no')); };
  // zh / ja: yes and no the way kids say them (a Japanese kid's «いいよ!», the answer to «入れて!»), matched in any script
  const CJ_YES = { zh: ['好', '好的', '好啊', '可以', '行', '要', '想', '当然', '来吧', '走', '嗯', '对', '是', 'ok', 'hao', 'haode', 'keyi', 'xing', 'dangran', 'en', 'dui'],
    ja: ['はい', 'うん', 'いいよ', 'いい', 'やる', 'やりたい', 'あそぶ', '遊ぶ', 'もちろん', 'オッケー', 'ok', 'hai', 'un', 'iiyo', 'ii', 'yaru', 'yaritai', 'asobu', 'mochiron', 'oke'] };
  const CJ_NO = { zh: ['不要', '不想', '不玩', '不行', '不了', '以后', '下次', '算了', '不', 'buyao', 'buxiang', 'buwan', 'buxing', 'suanle', 'bu'],
    ja: ['いいえ', 'ううん', 'いや', 'だめ', 'あとで', 'こんど', 'やめ', 'やらない', 'iie', 'uun', 'iya', 'dame', 'atode', 'kondo', 'yaranai'] };
  function cjHas(raw, can, list, l) { return list.some(w => { if (raw.includes(w)) return true; if (!/^[a-z]+$/.test(w)) return false; return w.length >= 3 ? can.includes(w) : can === w; }); }
  function yesNo(text, l = lang()) {
    if (l === 'zh' || l === 'ja') {
      const raw = String(text).trim(); if (!raw) return null;
      if (phraseMatch('ph.play.canIPlay', text, { lang: l }).ok) return 'ask';
      const can = canonCJ(raw, l);
      if (cjHas(raw, can, CJ_NO[l], l)) return 'no';
      if (cjHas(raw, can, CJ_YES[l], l)) return 'yes';
      if (/^[a-z\s!?.,']+$/i.test(raw) && looksEnglish(nrm(raw), l)) return 'en';
      return null;
    }
    const n = nrm(text); if (!n) return null;
    const has = w => (' ' + n + ' ').includes(' ' + w + ' ');
    if (phraseMatch('ph.play.canIPlay', text, { lang: l }).ok) return 'ask';
    if (NO[l].some(has) && !YES[l].filter(w => w !== 'no').some(w => has(w) && w.length > 2)) return 'no';
    if (YES[l].some(has)) return 'yes';
    if (looksEnglish(n, l)) return 'en';
    return null;
  }
  // ---- a tic-tac-toe square: «arriba a la izquierda», «en el medio», «unten rechts», «no meio»… or a digit 1–9
  const POSW = {
    es: { top: ['arriba', 'superior', 'alto'], bottom: ['abajo', 'inferior', 'bajo'], left: ['izquierda', 'izq', 'izquierdo'], right: ['derecha', 'der', 'derecho'], mid: ['medio', 'centro', 'mitad', 'central', 'en medio'] },
    pt: { top: ['cima', 'encima', 'superior', 'alto'], bottom: ['baixo', 'embaixo', 'inferior', 'debaixo', 'abaixo'], left: ['esquerda', 'esquerdo'], right: ['direita', 'direito'], mid: ['meio', 'centro', 'central'] },
    de: { top: ['oben', 'obere', 'oberen', 'oberes', 'ober'], bottom: ['unten', 'untere', 'unteren', 'unteres'], left: ['links', 'linke', 'linken', 'linkes'], right: ['rechts', 'rechte', 'rechten', 'rechtes'], mid: ['mitte', 'mittel', 'mittlere', 'mittleren', 'mitten', 'zentrum'] },
  };
  const CELL_NAME = {
    es: ['arriba a la izquierda', 'arriba en el medio', 'arriba a la derecha', 'a la izquierda', 'en el medio', 'a la derecha', 'abajo a la izquierda', 'abajo en el medio', 'abajo a la derecha'],
    pt: ['em cima à esquerda', 'em cima no meio', 'em cima à direita', 'à esquerda', 'no meio', 'à direita', 'embaixo à esquerda', 'embaixo no meio', 'embaixo à direita'],
    de: ['oben links', 'oben in der Mitte', 'oben rechts', 'links', 'in der Mitte', 'rechts', 'unten links', 'unten in der Mitte', 'unten rechts'],
    en: ['top left', 'top middle', 'top right', 'middle left', 'the middle', 'middle right', 'bottom left', 'bottom middle', 'bottom right'],
    zh: ['[左上|zuǒ shàng]', '[上面|shàng miàn] [中间|zhōng jiān]', '[右上|yòu shàng]', '[左边|zuǒ bian]', '[正中间|zhèng zhōng jiān]', '[右边|yòu bian]', '[左下|zuǒ xià]', '[下面|xià miàn] [中间|zhōng jiān]', '[右下|yòu xià]'],
    ja: ['[左上|ひだりうえ]', '[上|うえ] の [真|ま]ん[中|なか]', '[右上|みぎうえ]', '[左|ひだり]', '[真|ま]ん[中|なか]', '[右|みぎ]', '[左下|ひだりした]', '[下|した] の [真|ま]ん[中|なか]', '[右下|みぎした]'],
  };
  // zh / ja: the words for the rows and columns (characters, kana, or as typed in pinyin / rōmaji)
  const CJ_POS = {
    zh: { top: ['上', 'shang'], bottom: ['下', 'xia'], left: ['左', 'zuo'], right: ['右', 'you'], mid: ['中间', '中央', '中', 'zhongjian', 'zhongyang', 'zhong'] },
    ja: { top: ['上', 'うえ', 'ue'], bottom: ['下', 'した', 'shita'], left: ['左', 'ひだり', 'hidari'], right: ['右', 'みぎ', 'migi'], mid: ['真ん中', 'まんなか', '中央', 'ちゅうおう', '中', 'なか', 'mannaka', 'chuo', 'naka'] },
  };
  function parseCell(text, l = lang()) {
    const raw = String(text).trim();
    if (/^[1-9]$/.test(raw)) return { cell: +raw - 1, how: 'digit' };
    if (l === 'zh' || l === 'ja') {
      if (/^[１-９]$/.test(raw)) return { cell: raw.charCodeAt(0) - 0xFF11, how: 'digit' };
      const can = canonCJ(raw, l); if (!can) return { cell: -1, how: null };
      const W = CJ_POS[l], has = list => list.some(w => raw.includes(w) || (/^[a-z]+$/.test(w) && can.includes(w)));
      const used = []; let row = null, col = null;
      if (has(W.top)) { row = 0; used.push('p.top'); } else if (has(W.bottom)) { row = 2; used.push('p.bottom'); }
      if (has(W.left)) { col = 0; used.push('p.left'); } else if (has(W.right)) { col = 2; used.push('p.right'); }
      const mid = has(W.mid); if (mid) used.push('p.middle');
      if (row === null && col === null && !mid) return { cell: -1, how: /\b(top|bottom|left|right|middle|center)\b/i.test(raw) ? 'en' : null };
      if (row === null) row = 1; if (col === null) col = 1;
      return { cell: row * 3 + col, how: 'phrase', used };
    }
    const n = nrm(raw); if (!n) return { cell: -1, how: null };
    const W = POSW[l], toks = n.split(' ').filter(Boolean), has = list => list.some(w => (w.includes(' ') ? (' ' + n + ' ').includes(' ' + w + ' ') : toks.includes(w)));
    const used = [];
    let row = null, col = null;
    if (has(W.top)) { row = 0; used.push('p.top'); } else if (has(W.bottom)) { row = 2; used.push('p.bottom'); }
    if (has(W.left)) { col = 0; used.push('p.left'); } else if (has(W.right)) { col = 2; used.push('p.right'); }
    const mid = has(W.mid); if (mid) used.push('p.middle');
    if (row === null && col === null && !mid) return { cell: -1, how: looksEnglish(n, l) || /\b(top|bottom|left|right|middle|center)\b/.test(n) ? 'en' : null };
    if (row === null) row = 1; if (col === null) col = 1;
    return { cell: row * 3 + col, how: 'phrase', used };
  }
  // ---- a rock-paper-scissors pick (by word: the article and plural are fine)
  function parseThrow(text, l = lang()) {
    if (l === 'zh' || l === 'ja') {        // 石头 · 剪刀 · 布 ; グー · チョキ · パー (or いし · はさみ · かみ)
      const raw = String(text).trim(), can = canonCJ(raw, l); if (!raw) return null;
      const K = l === 'zh' ? { stone: ['石头', '石', 'shitou'], scissors: ['剪刀', 'jiandao'], paper: ['布', '纸', 'bu', 'zhi'] }
        : { stone: ['グー', 'ぐー', '石', 'いし', 'gu', 'ishi'], scissors: ['チョキ', 'ちょき', 'はさみ', 'ハサミ', 'choki', 'hasami'], paper: ['パー', 'ぱー', '紙', 'かみ', 'pa', 'kami'] };
      const ids = { stone: 'w.stone', paper: 'w.paper', scissors: 'w.scissors' };
      const found = Object.keys(K).filter(k => K[k].some(w => raw.includes(w) || (/^[a-z]+$/.test(w) && (w.length >= 3 ? can.includes(w) : can === w))));
      if (found.length === 1) return { pick: found[0], id: ids[found[0]] };
      if (found.length > 1) return { many: found };
      if (/\b(rock|stone|paper|scissors)\b/i.test(raw)) return { en: true };
      return null;
    }
    const n = nrm(text); if (!n) return null;
    const toks = n.split(' ').filter(Boolean);
    const ids = { stone: 'w.stone', paper: 'w.paper', scissors: 'w.scissors' };
    const extra = { es: { stone: ['roca', 'piedrita'], paper: ['hoja'], scissors: ['tijeras'] }, pt: { stone: ['pedrinha'], paper: ['papeis'], scissors: ['tesouras'] }, de: { stone: ['steine'], paper: ['papiere'], scissors: ['scheren'] } }[l];
    const found = [];
    for (const [k, id] of Object.entries(ids)) {
      const it = typeof LEX !== 'undefined' && LEX.item(id);
      const forms = [it ? it[l] : null, it && it.pl ? it.pl[l] : null].concat(it && it.alt && it.alt[l] || [], extra[k] || []).filter(Boolean).map(nrm);
      if (toks.some(t => forms.includes(t)) || forms.some(f => f.includes(' ') && n.includes(f))) found.push(k);
    }
    if (found.length === 1) return { pick: found[0], id: ids[found[0]] };
    if (found.length > 1) return { many: found };
    if (/\b(rock|stone|paper|scissors)\b/.test(n)) return { en: true };
    return null;
  }
  // ---- a chess move said out loud: «caballo a f3», «peón e4», «Springer nach f3», «enroque corto», «peão para e8 dama»
  const PIECE_WORDS = {
    es: { k: ['rey'], q: ['dama', 'reina'], r: ['torre'], b: ['alfil'], n: ['caballo'], p: ['peon'] },
    pt: { k: ['rei'], q: ['dama', 'rainha'], r: ['torre'], b: ['bispo'], n: ['cavalo'], p: ['peao'] },
    de: { k: ['konig'], q: ['dame', 'konigin'], r: ['turm'], b: ['laufer'], n: ['springer', 'pferd'], p: ['bauer', 'bauern'] },
  };
  const CASTLE_WORDS = { es: { w: ['enroque', 'enroco'], short: ['corto'], long: ['largo'] }, pt: { w: ['roque', 'roque'], short: ['pequeno', 'curto'], long: ['grande', 'longo'] }, de: { w: ['rochade', 'rochieren'], short: ['kurze', 'kleine', 'kurz'], long: ['lange', 'grosse', 'grose', 'lang'] } };
  // zh / ja: the pieces (国际象棋: 王 后 车 象 马 兵; チェス: キング クイーン ルーク ビショップ ナイト ポーン) and castling (易位 / キャスリング)
  const CJ_PIECES = {
    zh: { k: ['王', '国王', 'wang', 'guowang'], q: ['后', '皇后', 'hou', 'huanghou'], r: ['车', 'ju', 'che'], b: ['象', 'xiang'], n: ['马', 'ma'], p: ['兵', '卒', 'bing', 'zu'] },
    ja: { k: ['キング', 'kingu'], q: ['クイーン', 'kuin'], r: ['ルーク', 'ruku'], b: ['ビショップ', 'bishoppu'], n: ['ナイト', 'naito'], p: ['ポーン', 'pon'] },
  };
  const CJ_CASTLE = { zh: { w: ['易位', 'yiwei'], short: ['短', 'duan'], long: ['长', 'chang'] }, ja: { w: ['キャスリング', 'kyasuringu'], short: ['ショート', 'shoto'], long: ['ロング', 'rongu'] } };
  function parseAnnounceCJ(text, legalMoves, l) {
    const raw = String(text).toLowerCase(), roman = !/[぀-ヿ㐀-鿿]/.test(raw);
    // the words typed in pinyin / rōmaji, one by one (tone digits dropped), as the engine spells them
    const words = roman ? raw.replace(/([a-z])[1-5](?![0-9])/g, '$1').split(/[^a-z]+/).filter(w => w && !/^[a-h]$/.test(w)).map(w => canonCJ(w, l)) : [];
    const at = w => { if (/^[a-z]+$/.test(w)) { const i = words.indexOf(w); return i < 0 ? -1 : i * 100; } return raw.indexOf(w); };
    const squares = []; raw.replace(/(^|[^a-z])([a-h])\s*([1-8])(?![0-9])/g, (_, p, f, r) => { squares.push(f + r); return _; });
    const pieces = [];
    for (const [t, ws] of Object.entries(CJ_PIECES[l])) for (const w of ws) { const i = at(w); if (i >= 0) { pieces.push({ t, i }); break; } }
    pieces.sort((a, b) => a.i - b.i);
    const CW = CJ_CASTLE[l], hasW = list => list.some(w => at(w) >= 0);
    if (hasW(CW.w) || /\b0-0(-0)?\b|\bo-o(-o)?\b/.test(raw)) {
      const long = hasW(CW.long) || /o-o-o|0-0-0/.test(raw), short = hasW(CW.short) || (!long && /o-o|0-0/.test(raw));
      const cands = legalMoves.filter(m => m.castle && (long ? m.castle === 'q' : short ? m.castle === 'k' : true));
      if (cands.length === 1) return { move: cands[0], said: true, piece: 'k' };
      if (cands.length > 1) return { ambiguous: cands, said: true };
      return { none: 'castle' };
    }
    if (!squares.length) { if (/\b(knight|bishop|rook|queen|king|pawn)\b/.test(raw)) return { en: true }; return { none: pieces.length ? 'nosquare' : 'nothing' }; }
    const sq = CHESS.sqOf(squares[squares.length - 1]), from = squares.length > 1 ? CHESS.sqOf(squares[0]) : -1;
    const pieceT = pieces.length ? pieces[0].t : null, promoT = pieces.length > 1 ? pieces[pieces.length - 1].t : null;
    let cands = legalMoves.filter(m => m.to === sq && (from < 0 || m.from === from));
    if (pieceT) cands = cands.filter(m => CHESS.typeOf(m.p) === pieceT);
    if (cands.some(m => m.promo)) cands = cands.filter(m => m.promo === (promoT && promoT !== 'p' && promoT !== 'k' ? promoT : 'q'));
    if (cands.length === 1) return { move: cands[0], said: !!pieceT, piece: pieceT };
    if (cands.length > 1) return { ambiguous: cands, said: !!pieceT };
    return { none: pieceT ? 'piececant' : 'nomove', piece: pieceT, sq: squares[squares.length - 1] };
  }
  function parseAnnounce(text, legalMoves, l = lang()) {
    if (l === 'zh' || l === 'ja') return parseAnnounceCJ(text, legalMoves, l);
    const raw = String(text).toLowerCase(), n = nrm(text), toks = n.split(' ').filter(Boolean);
    const squares = []; raw.replace(/([a-h])\s*([1-8])/g, (_, f, r) => { squares.push(f + r); return _; });
    const PW = PIECE_WORDS[l], CW = CASTLE_WORDS[l];
    const pieces = []; for (const [t, ws] of Object.entries(PW)) toks.forEach((w, i) => { if (ws.includes(w)) pieces.push({ t, i }); });
    pieces.sort((a, b) => a.i - b.i);                    // (in the order you said them: the piece, then what a pawn becomes)
    if (!pieces.length && /\b(knight|bishop|rook|queen|king|pawn|castle|castles)\b/.test(n)) return { en: true };
    // castling
    if (toks.some(w => CW.w.includes(w)) || /\b0-0(-0)?\b|\bo-o(-o)?\b/.test(raw)) {
      const long = toks.some(w => CW.long.includes(w)) || /o-o-o|0-0-0/.test(raw), short = toks.some(w => CW.short.includes(w)) || (!long && /o-o|0-0/.test(raw));
      const cands = legalMoves.filter(m => m.castle && (long ? m.castle === 'q' : short ? m.castle === 'k' : true));
      if (cands.length === 1) return { move: cands[0], said: true, piece: 'k' };
      if (cands.length > 1) return { ambiguous: cands, said: true };
      return { none: 'castle' };
    }
    if (!squares.length) {
      if (/\b(knight|bishop|rook|queen|king|pawn)\b/.test(n)) return { en: true };
      return { none: pieces.length ? 'nosquare' : 'nothing' };
    }
    const sq = CHESS.sqOf(squares[squares.length - 1]), from = squares.length > 1 ? CHESS.sqOf(squares[0]) : -1;
    const pieceT = pieces.length ? pieces[0].t : null, promoT = pieces.length > 1 ? pieces[pieces.length - 1].t : null;
    let cands = legalMoves.filter(m => m.to === sq && (from < 0 || m.from === from));
    if (pieceT) cands = cands.filter(m => CHESS.typeOf(m.p) === pieceT);
    if (cands.some(m => m.promo)) cands = cands.filter(m => m.promo === (promoT && promoT !== 'p' && promoT !== 'k' ? promoT : 'q'));
    if (cands.length === 1) return { move: cands[0], said: !!pieceT, piece: pieceT };
    if (cands.length > 1) return { ambiguous: cands, said: !!pieceT };
    return { none: pieceT ? 'piececant' : 'nomove', piece: pieceT, sq: squares[squares.length - 1] };
  }
  // the piece words with their grammar, for the hustlers' trash talk
  const PIECE_GR = {
    es: { p: ['peón', 'm'], n: ['caballo', 'm'], b: ['alfil', 'm'], r: ['torre', 'f'], q: ['dama', 'f'], k: ['rey', 'm'] },
    pt: { p: ['peão', 'm'], n: ['cavalo', 'm'], b: ['bispo', 'm'], r: ['torre', 'f'], q: ['dama', 'f'], k: ['rei', 'm'] },
    de: { p: ['Bauer', 'm', 'Bauern'], n: ['Springer', 'm', 'Springer'], b: ['Läufer', 'm', 'Läufer'], r: ['Turm', 'm', 'Turm'], q: ['Dame', 'f', 'Dame'], k: ['König', 'm', 'König'] },
    en: { p: ['pawn'], n: ['knight'], b: ['bishop'], r: ['rook'], q: ['queen'], k: ['king'] },
    zh: { p: ['[兵|bīng]'], n: ['[马|mǎ]'], b: ['[象|xiàng]'], r: ['[车|jū]'], q: ['[后|hòu]'], k: ['[王|wáng]'] },
    ja: { p: ['ポーン'], n: ['ナイト'], b: ['ビショップ'], r: ['ルーク'], q: ['クイーン'], k: ['キング'] },
  };
  function pieceTalk(kind, t) {          // kind: 'took' (I took your …), 'lost' (oh, my …), 'cant' (that … can't go there)
    const l = lang(), [w, g, acc] = PIECE_GR[l][t], en = PIECE_GR.en[t][0];
    // (zh: you «吃» a piece, as in Chinese chess; ja: the hustlers are polite and smug: «ナイトをいただきました»)
    if (kind === 'took') return { es: { tl: `¡Te comí ${g === 'f' ? 'la' : 'el'} ${w}!`, en: `I took your ${en}!` }, pt: { tl: `Comi ${g === 'f' ? 'sua' : 'seu'} ${w}!`, en: `I took your ${en}!` }, de: { tl: `Ich hab ${g === 'f' ? 'deine' : 'deinen'} ${acc} geschlagen!`, en: `I took your ${en}!` },
      zh: { tl: `[我|wǒ] [吃|chī] [了|le] [你|nǐ] [的|de] ${w} ！`, en: `I took your ${en}!` }, ja: { tl: `${w} を いただきました ！`, en: `I took your ${en}!` } }[l];
    if (kind === 'lost') return { es: { tl: `¡Ay, mi ${w}!`, en: `Oh no, my ${en}!` }, pt: { tl: `Ai, ${g === 'f' ? 'minha' : 'meu'} ${w}!`, en: `Oh no, my ${en}!` }, de: { tl: `Oh nein, ${g === 'f' ? 'meine' : 'mein'} ${w}!`, en: `Oh no, my ${en}!` },
      zh: { tl: `[哎呀|āi yā] ， [我|wǒ] [的|de] ${w} ！`, en: `Oh no, my ${en}!` }, ja: { tl: `ああ 、 わたし の ${w} が ！`, en: `Oh no, my ${en}!` } }[l];
    return { es: { tl: `${g === 'f' ? 'Esa' : 'Ese'} ${w} no puede ir ahí.`, en: `That ${en} can’t go there.` }, pt: { tl: `${g === 'f' ? 'Essa' : 'Esse'} ${w} não pode ir aí.`, en: `That ${en} can’t go there.` }, de: { tl: `${g === 'f' ? 'Die' : 'Der'} ${w} kann da nicht hin.`, en: `That ${en} can’t go there.` },
      zh: { tl: `[这个|zhè ge] ${w} [不能|bù néng] [走|zǒu] [那里|nà lǐ] 。`, en: `That ${en} can’t go there.` }, ja: { tl: `その ${w} は そこ に は [行|い]けません よ 。`, en: `That ${en} can’t go there.` } }[l];
  }
  // how to say a move: «caballo a f3» · «cavalo para f3» · «Springer nach f3»; when two of a kind can go there (pass the
  // legal moves), from where: «caballo de b5 a d4» · «cavalo de b5 para d4» · «Springer von b5 nach d4»
  const announceOf = (m, l = lang(), legal = null) => {
    if (m.castle) return { es: m.castle === 'k' ? 'enroque corto' : 'enroque largo', pt: m.castle === 'k' ? 'roque pequeno' : 'roque grande', de: m.castle === 'k' ? 'kurze Rochade' : 'lange Rochade',
      zh: m.castle === 'k' ? '[短|duǎn] [易位|yì wèi]' : '[长|cháng] [易位|yì wèi]', ja: m.castle === 'k' ? 'ショート キャスリング' : 'ロング キャスリング' }[l];
    const w = PIECE_GR[l][CHESS.typeOf(m.p)][0], to = CHESS.sqName(m.to);
    const amb = legal && legal.some(o => o.p === m.p && o.to === m.to && o.from !== m.from), from = amb ? CHESS.sqName(m.from) : '';
    return { es: `${w}${from ? ' de ' + from : ''} a ${to}`, pt: `${w}${from ? ' de ' + from : ''} para ${to}`, de: `${w}${from ? ' von ' + from : ''} nach ${to}`,
      zh: `${w} ${from ? '[从|cóng] ' + from + ' ' : ''}[到|dào] ${to}`, ja: `${w} ${from ? from + ' から ' : ''}${to}` }[l];
  };

  // ================================================================ the people: drawn like town.js's townsfolk (every body part of everyone
  // is one instanced mesh with one ink hull), so the six of them cost about twenty draw calls per town
  const KIDS = [
    { id: 'sofi', name: 'Sofi', f: true, look: { kid: 1, skin: '#8a5a3c', hair: '#2a1d1a', hairdo: 'puffs', dress: '#f2c14e', band: '#e0503f', h: 0.76 } },
    { id: 'beto', name: 'Beto', f: false, look: { kid: 1, skin: '#e6b48c', hair: '#c4552c', hairdo: 'curls', top: '#4f9a5a', collar: '#fdf8ee', legs: true, pants: '#3e6fb0', hat: 'capBack', hatColor: '#3d7fd1', h: 0.78 }, prop: 'ball' },
    { id: 'luci', name: 'Luci', f: true, look: { kid: 1, skin: '#f0c7a0', hair: '#6b3b25', hairdo: 'braids', dress: '#8a5ab0', apron: '#c9b3f0', glasses: true, ribbon: '#e86a9a', h: 0.72 }, prop: 'chalk' },
  ];
  const OLD = [
    { id: 'aurelio', game: 'chess', f: false, names: { es: 'Don Aurelio', pt: 'Seu Aurélio', de: 'Opa Aurelio' }, at: 'chess',
      look: { skin: '#efc29a', hair: '#ece8e0', hairdo: 'short', stache: true, dress: '#efe6d2', vest: '#7a5a3a', legs: true, pants: '#4a3a33', hat: 'flat', hatColor: '#7a7a86', glasses: true, h: 1.02, w: 0.95 } },
    { id: 'reme', game: 'checkers', f: true, names: { es: 'Doña Reme', pt: 'Dona Reme', de: 'Oma Reme' }, at: 'checkers',
      look: { skin: '#c98e62', hair: '#d8d4cc', hairdo: 'bun', dress: '#3f5f8a', shawl: '#c9553f', glasses: true, h: 0.92, w: 1.12 } },
    { id: 'tino', f: false, names: { es: 'Don Tino', pt: 'Seu Tino', de: 'Opa Tino' },
      look: { skin: '#e6b48c', hair: '#f4f1ea', hairdo: 'bald', stache: true, dress: '#4f8a4a', legs: true, pants: '#5b4a3a', hat: 'beret', hatColor: '#c9443a', h: 0.98 }, prop: 'cane' },
  ];
  // zh / ja (CJK.md's table): their names the zh / ja way, with 爷爷 / 奶奶 or さん like Doña Rosa (the lines call them 奥雷里奥 / アウレリオ)
  Object.assign(OLD[0].names, { zh: '[奥雷里奥|Ào léi lǐ ào] [爷爷|yé ye]', ja: 'アウレリオ さん' });
  Object.assign(OLD[1].names, { zh: '[蕾梅|Lěi méi] [奶奶|nǎi nai]', ja: 'レメ さん' });
  Object.assign(OLD[2].names, { zh: '[蒂诺|Dì nuò] [爷爷|yé ye]', ja: 'ティノ さん' });
  if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['アウレリオ', 'レメ', 'ティノ', 'ソフィ', 'ベト', 'ルシ']);      // (ja rōmaji capitalizes them mid-sentence)
  const oldName = o => (o.names[lang()] ? plainTL(o.names[lang()]) : o.names.es);
  const lkey = () => lang() + (cj() && typeof CJK !== 'undefined' ? ':' + CJK.mode(lang()) : '');     // (canvases repaint on a zh / ja mode switch too)
  function partsLib() {
    const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 13);
    return {
      dress: { geo: lathe([[0, 0], [0.38, 0.02], [0.37, 0.3], [0.28, 0.68], [0.2, 0.9], [0.1, 0.97], [0, 0.98]]), ink: 0.02 },
      top: { geo: lathe([[0, 0.34], [0.29, 0.35], [0.3, 0.48], [0.27, 0.68], [0.2, 0.9], [0.1, 0.97], [0, 0.98]]), ink: 0.02 },
      head: { geo: new THREE.SphereGeometry(1, 14, 10), ink: 0.02 },
      ball: { geo: new THREE.SphereGeometry(1, 8, 6), ink: 0.03 },
      cap: { geo: new THREE.SphereGeometry(1, 12, 5, 0, TAU, 0, Math.PI * 0.5), ink: 0.02 },
      cyl: { geo: new THREE.CylinderGeometry(1, 1, 1, 8), ink: 0.03 },
      cone: { geo: new THREE.ConeGeometry(1, 1, 8), ink: 0.03 },
      box: { geo: new THREE.BoxGeometry(1, 1, 1), ink: 0.03 },
      eye: { geo: new THREE.SphereGeometry(1, 6, 4), ink: 0, solid: '#2b2235' },
      hl: { geo: new THREE.SphereGeometry(1, 5, 3), ink: 0, basic: '#ffffff' },
      blush: { geo: new THREE.SphereGeometry(1, 6, 4), ink: 0, basic: '#ff8c9a', opacity: 0.5 },
      ring: { geo: new THREE.TorusGeometry(1, 0.12, 5, 16), ink: 0, basic: '#2b2235' },
    };
  }
  // the toon look, plus: anything right by the camera dithers away (as in town.js: the camera comes from viewMatrix, which
  // three r128 sends to every material)
  function nearPatch(o = {}) {
    return sh => {
      if (o.rim) sh.uniforms.rimAmt = { value: o.rim };
      let vs = 'varying vec3 vWP;\n' + sh.vertexShader;
      if (o.off) vs = vs.replace('#include <begin_vertex>', `vec3 transformed = position + normal * ${TK.fl(o.off)};`);
      sh.vertexShader = vs.replace('#include <project_vertex>', `#include <project_vertex>
        #ifdef USE_INSTANCING
          vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
        #else
          vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif`);
      let fs = 'varying vec3 vWP;\n' + (o.rim ? 'uniform float rimAmt;\n' : '') + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        { vec3 camW = -vec3(dot(viewMatrix[0].xyz, viewMatrix[3].xyz), dot(viewMatrix[1].xyz, viewMatrix[3].xyz), dot(viewMatrix[2].xyz, viewMatrix[3].xyz));
          float nearCam = 1.0 - smoothstep(1.3, 2.8, length(vWP - camW));
          if (nearCam > 0.8) discard;
          if (nearCam > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < nearCam) discard; }`);
      if (o.rim) fs = fs.replace('#include <tonemapping_fragment>', 'float rimF = 1.0 - max(dot(normalize(normal), normalize(vViewPosition)), 0.0);\ngl_FragColor.rgb += vec3(1.0, 0.95, 0.82) * rimAmt * smoothstep(0.6, 0.95, rimF);\n#include <tonemapping_fragment>');
      sh.fragmentShader = fs;
    };
  }
  const MATS = {};
  function toonMat(o = {}) {
    const k = 'mg-t' + JSON.stringify(o); if (MATS[k]) return MATS[k];
    const m = new THREE.MeshToonMaterial({ color: o.color || '#ffffff', gradientMap: TK.grad, vertexColors: !!o.vc, map: o.map || null, transparent: !!o.transparent, side: o.side || THREE.FrontSide });
    if (o.poly) { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -o.poly; m.depthWrite = false; }
    m.onBeforeCompile = nearPatch({ rim: o.rim }); m.customProgramCacheKey = () => k;
    return (MATS[k] = m);
  }
  function inkMat(off) {
    const k = 'mg-i' + off; if (MATS[k]) return MATS[k];
    const m = new THREE.MeshBasicMaterial({ color: '#2b2235', side: THREE.BackSide });
    m.onBeforeCompile = nearPatch({ off }); m.customProgramCacheKey = () => k;
    return (MATS[k] = m);
  }
  function basicMat(color, opacity) {
    const k = 'mg-b' + color + (opacity || ''); if (MATS[k]) return MATS[k];
    const m = new THREE.MeshBasicMaterial({ color, transparent: !!opacity, opacity: opacity || 1, depthWrite: !opacity });
    m.onBeforeCompile = nearPatch({}); m.customProgramCacheKey = () => k;
    return (MATS[k] = m);
  }
  function Rig() {
    const P = partsLib(), leaves = Object.fromEntries(Object.keys(P).map(k => [k, []]));
    const leaf = (parent, part, color, pos, scale, rot) => { const n = new THREE.Object3D(); if (pos) n.position.set(...pos); if (scale) n.scale.set(...scale); if (rot) n.rotation.set(...rot); parent.add(n); leaves[part].push({ n, color }); return n; };
    const node = (parent, pos, rot) => { const n = new THREE.Object3D(); if (pos) n.position.set(...pos); if (rot) n.rotation.set(...rot); parent.add(n); return n; };
    function meshes(group) {
      const list = [], col = new THREE.Color();
      for (const [name, L] of Object.entries(leaves)) {
        if (!L.length) continue;
        const D = P[name], mat = D.basic ? basicMat(D.basic, D.opacity) : D.solid ? toonMat({ color: D.solid }) : toonMat({ rim: 0.32 });
        const im = new THREE.InstancedMesh(D.geo, mat, L.length);
        im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); im.frustumCulled = false; im.castShadow = D.ink > 0; im.name = 'mg-folk-' + name;
        if (!D.basic && !D.solid) L.forEach((l, i) => im.setColorAt(i, col.set(l.color || '#ffffff')));
        group.add(im); list.push({ im, L });
        if (D.ink) { const h = new THREE.InstancedMesh(D.geo, inkMat(D.ink), L.length); h.instanceMatrix = im.instanceMatrix; h.frustumCulled = false; h.name = 'mg-folk-' + name + '-ink'; group.add(h); }
      }
      return { list, sync() { for (const { im, L } of list) { for (let i = 0; i < L.length; i++) im.setMatrixAt(i, L[i].n.matrixWorld); im.instanceMatrix.needsUpdate = true; } } };
    }
    return { leaf, node, meshes };
  }
  // One person. d: { kid, skin, hair, hairdo, dress | top+legs+pants, apron, collar, vest, shawl, band, ribbon, hat, hatColor,
  // stache, glasses, h, w } and a prop: ball, chalk, cane
  function makePerson(rig, d, prop) {
    const { leaf, node } = rig, w = d.w || 1, k = d.kid ? 1 : 0;
    const root = new THREE.Object3D(), body = node(root);
    root.scale.setScalar(d.h || 1);
    const R = { root, body, d, legs: null, feet: [], arms: [], head: null, eyes: [], mouth: null, props: {}, hips: [] };
    if (d.legs) {
      leaf(body, 'top', d.top || d.dress, null, [w, 1, w]);
      if (d.vest) leaf(body, 'top', d.vest, [0, 0.02, -0.012], [w * 1.04, 0.92, w * 0.98]);
      if (d.collar) leaf(body, 'cyl', d.collar, [0, 0.9, 0], [0.13 * w, 0.06, 0.13 * w]);
      R.legs = [-1, 1].map(s => { const hip = node(body, [s * 0.12 * w, 0.4, 0]); leaf(hip, 'cyl', d.pants || '#3a4466', [0, -0.18, 0], [0.085, 0.36, 0.085]); R.feet.push(leaf(hip, 'ball', '#5b3a22', [0, -0.36, 0.05], [0.1, 0.075, 0.15])); return hip; });
    } else {
      leaf(body, 'dress', d.dress, null, [w, 1, w]);
      R.feet = [-1, 1].map(s => leaf(body, 'ball', '#5b3a22', [s * 0.13 * w, 0.04, 0.12], [0.1, 0.07, 0.14]));
    }
    if (d.apron) leaf(body, 'ball', d.apron, [0, 0.42, 0.26 * w], [0.24 * w, 0.3, 0.08]);
    if (d.shawl) { leaf(body, 'ball', d.shawl, [0, 0.8, -0.02], [0.36 * w, 0.17, 0.3]); leaf(body, 'cone', d.shawl, [0, 0.62, -0.25], [0.2, 0.3, 0.06], [Math.PI, 0, 0]); }
    R.arms = [-1, 1].map(s => {
      const sh = node(body, [s * 0.25 * w, 0.84, 0.05], [-0.5, 0, -s * 0.2]);
      leaf(sh, 'cyl', d.legs ? (d.top || d.dress) : d.dress, [0, -0.14, 0], [0.07, 0.28, 0.07]);
      const hand = node(sh, [0, -0.3, 0]); leaf(hand, 'ball', d.skin, null, [0.07, 0.07, 0.07]);
      sh.userData.hand = hand; return sh;
    });
    const hs = k ? 1.16 : 1;
    const head = R.head = node(body, [0, 0.98, 0]); head.scale.setScalar(hs);
    leaf(head, 'head', d.skin, [0, 0.2, 0], [0.28, 0.27, 0.27]);
    if (d.hairdo === 'bald') leaf(head, 'cap', d.hair, [0, 0.12, -0.07], [0.285, 0.2, 0.25], [-1.15, 0, 0]);
    else leaf(head, 'cap', d.hair, [0, 0.22, -0.02], [0.29, 0.29, 0.29], [-0.5, 0, 0]);
    if (d.hairdo === 'puffs') for (const s of [-1, 1]) leaf(head, 'ball', d.hair, [s * 0.22, 0.42, -0.05], [0.14, 0.14, 0.14]);
    if (d.hairdo === 'curls') for (let i = 0; i < 7; i++) { const a = (i / 7) * TAU; leaf(head, 'ball', d.hair, [Math.cos(a) * 0.2, 0.38 + (i % 2) * 0.04, -0.04 + Math.sin(a) * 0.17], [0.09, 0.09, 0.09]); }
    if (d.hairdo === 'braids') for (const s of [-1, 1]) { leaf(head, 'cyl', d.hair, [s * 0.22, -0.02, -0.12], [0.055, 0.34, 0.055], [0.15, 0, s * 0.12]); leaf(head, 'ball', d.ribbon || d.hair, [s * 0.24, -0.2, -0.14], [0.06, 0.05, 0.06]); }
    if (d.hairdo === 'bun') leaf(head, 'ball', d.hair, [0, 0.42, -0.2], [0.12, 0.12, 0.12]);
    if (d.band) leaf(head, 'cyl', d.band, [0, 0.33, -0.02], [0.286, 0.05, 0.286], [-0.45, 0, 0]);
    R.eyes = [-1, 1].map(s => { const e = node(head, [s * 0.1, 0.21, 0.24]); leaf(e, 'eye', null, null, [0.04, 0.06, 0.025]); leaf(e, 'hl', null, [0.013, 0.023, 0.022], [0.017, 0.017, 0.017]); return e; });
    [-1, 1].forEach(s => leaf(head, 'blush', null, [s * 0.17, 0.09, 0.23], [0.05, 0.0275, 0.015], [0, s * 0.4, 0]));
    R.mouth = leaf(head, 'eye', null, [0, 0.07, 0.27], [0.035, 0.012, 0.01]);
    if (d.stache) for (const s of [-1, 1]) leaf(head, 'ball', d.hair, [s * 0.05, 0.11, 0.255], [0.06, 0.025, 0.03], [0, 0, -s * 0.35]);
    if (d.glasses) for (const s of [-1, 1]) leaf(head, 'ring', null, [s * 0.1, 0.19, 0.265], [0.068, 0.068, 0.068]);
    const hat = node(head, [0, 0.4, 0]), hc = d.hatColor || '#e8c57a';
    if (d.hat === 'capBack') { leaf(hat, 'cap', hc, [0, -0.08, 0], [0.3, 0.22, 0.3]); leaf(hat, 'cyl', hc, [0, -0.08, -0.26], [0.16, 0.02, 0.12]); }
    else if (d.hat === 'flat') { leaf(hat, 'cap', hc, [0, -0.1, 0.02], [0.31, 0.14, 0.33]); leaf(hat, 'cyl', hc, [0, -0.1, 0.27], [0.15, 0.02, 0.1]); }
    else if (d.hat === 'beret') leaf(hat, 'ball', hc, [0.04, -0.07, -0.02], [0.3, 0.09, 0.3], [0, 0, 0.2]);
    // things they carry
    const handR = R.arms[1].userData.hand, handL = R.arms[0].userData.hand;
    if (prop === 'ball') { R.props.ball = node(root, [0.32, 0.6, 0.28]); leaf(R.props.ball, 'ball', '#e0503f', null, [0.13, 0.13, 0.13]); leaf(R.props.ball, 'cyl', '#fdf8ee', null, [0.132, 0.03, 0.132]); }
    if (prop === 'chalk') { R.props.chalk = node(handR, [0, -0.06, 0.03]); leaf(R.props.chalk, 'box', '#ffd1dc', null, [0.035, 0.12, 0.035]); }
    if (prop === 'cane') { R.props.cane = node(handR, [0, 0, 0.03]); leaf(R.props.cane, 'cyl', '#7a5236', [0, -0.34, 0], [0.025, 0.72, 0.025]); leaf(R.props.cane, 'cyl', '#7a5236', [0, 0.02, -0.05], [0.025, 0.12, 0.025], [Math.PI / 2, 0, 0]); }
    void handL;
    return R;
  }
  // a person's pose this frame. S: { x, y, z, yaw, speed, phase, pose, talk, look (an angle, or undefined), wave, hop, blink, t0 }
  function posePerson(P, S, dt, t) {
    const R = P.R, d = R.d, pose = S.pose || 'stand';
    const walk = clamp(S.speed / 2.2, 0, 1.6);
    if (S.speed > 0.05) S.phase += dt * (3.2 + S.speed * 2.4); else S.phase = damp(S.phase, Math.round(S.phase / Math.PI) * Math.PI, 8, dt);
    const ph = S.phase, sw = Math.sin(ph);
    S.talk = damp(S.talk || 0, P.api.talking || S.chatter > 0 ? 1 : 0, 10, dt);
    if (S.chatter > 0) S.chatter -= dt;
    const sit = pose === 'sit', kneel = pose === 'kneel', crouch = pose === 'crouch';
    let lift = 0, sy = 1, bx = 0, by = 0;
    if (sit) { lift = 0.42 - (R.legs ? 0.3 : 0) - 0.02; sy = 0.84; }
    if (kneel) { lift = -0.3; sy = 0.92; bx = 0.22; }
    if (crouch) { lift = -0.18; sy = 0.62; bx = 0.35; }
    if (pose === 'sulk') bx = 0.18;
    if (pose === 'lean') bx = 0.08;
    R.root.position.set(S.x, S.y + lift + (S.hop || 0), S.z); R.root.rotation.y = S.yaw;
    const breath = 1 + Math.sin(t * 2.2 + (S.seed || 0) * 9) * 0.014;
    R.body.scale.set(1, sy * breath, 1);
    R.body.position.y = Math.abs(sw) * 0.05 * Math.min(walk, 1.2) + S.talk * Math.abs(Math.sin(t * 13)) * 0.03 + (pose === 'cheer' ? Math.abs(Math.sin(t * 7)) * 0.12 : 0);
    R.body.rotation.z = sw * 0.05 * walk + Math.sin(t * 1.2 + (S.seed || 0) * 9) * 0.02;
    R.body.rotation.x = bx + walk * 0.07 + by;
    if (R.legs) R.legs.forEach((hip, i) => { hip.rotation.x = sit ? -1.3 : kneel || crouch ? -1.1 + (i ? 0.5 : 0) : Math.sin(ph + i * Math.PI) * 0.7 * walk; });
    else R.feet.forEach((f, i) => { const s = i ? 1 : -1; if (sit) f.position.set(s * 0.13, -0.5, 0.36); else f.position.set(s * 0.13 * (d.w || 1), 0.04 + Math.max(0, Math.sin(ph + i * Math.PI)) * 0.07 * walk, 0.12 + Math.sin(ph + i * Math.PI) * 0.14 * walk); });
    let aL = [-0.5 + sw * 0.5 * walk, 0, 0.2], aR = [-0.5 - sw * 0.5 * walk, 0, -0.2];
    switch (pose) {
      case 'run': aL = [-0.4 + sw * 0.9, 0, 0.6]; aR = [-0.4 - sw * 0.9, 0, -0.6]; break;
      case 'cheer': aL = [-2.7 + Math.sin(t * 9) * 0.2, 0, 0.5]; aR = [-2.7 - Math.sin(t * 9) * 0.2, 0, -0.5]; break;
      case 'cover': aL = [-2.35, 0, 0.75]; aR = [-2.35, 0, -0.75]; break;
      case 'sulk': aL = [-0.15, 0, 0.12]; aR = [-0.15, 0, -0.12]; break;
      case 'kneel': aL = [-0.7, 0, 0.3]; aR = [-1.0 + Math.sin(t * 5) * 0.25, 0.2, -0.25 + Math.sin(t * 3.1) * 0.2]; break;
      case 'ball': { const b = Math.abs(Math.sin(t * 4.2)); aR = [-0.9 + b * 0.35, 0, -0.35]; break; }
      case 'throw': aR = [-1.55, 0, -0.1]; break;
      case 'point': aR = [-1.45, 0.2, -0.2]; break;
      case 'think': aR = [-2.1, 0.5, -0.9]; break;
      case 'sit': aL = [-0.85, 0, 0.3]; aR = [-0.85, 0, -0.3]; break;
      case 'lean': aR = [-0.35, 0, -0.25]; aL = [-0.4, 0, 0.15]; break;
      case 'crouch': aL = [-1.1, 0, 0.5]; aR = [-1.1, 0, -0.5]; break;
      case 'shrug': aL = [-0.4, 0, 1.0]; aR = [-0.4, 0, -1.0]; break;
    }
    if (S.wave > 0) { S.wave -= dt; aR = [-0.3, 0, -2.4 + Math.sin(t * 9) * 0.35]; }
    R.arms[0].rotation.set(...aL); R.arms[1].rotation.set(...aR);
    if (R.props.ball) {         // Beto bounces his ball, or carries it
      const B = R.props.ball;
      if (pose === 'ball') { const b = Math.abs(Math.sin(t * 4.2)); B.position.set(0.3, 0.13 + b * 0.5, 0.3); }
      else B.position.set(0.3, 0.62, 0.22);
      B.visible = pose !== 'run' && pose !== 'crouch' && pose !== 'cover';
      B.scale.setScalar(B.visible ? 1 : 0.001);
    }
    let hy = 0, hx = 0;
    if (S.look !== undefined) { hy = clamp(angDiff(S.yaw, S.look), -1.1, 1.1); hx = -0.05; }
    else hy = Math.sin(t * 0.37 + (S.seed || 0) * 20) * (S.speed > 0.1 ? 0.15 : 0.5);
    if (pose === 'kneel') hx += 0.45;
    if (pose === 'sulk') hx += 0.5;
    if (pose === 'cover') { hx += 0.3; hy = 0; }
    if (pose === 'think') hx += 0.25;
    if (pose === 'sit' && S.board) hx += 0.35;
    R.head.rotation.y = damp(R.head.rotation.y, hy, 5, dt); R.head.rotation.x = damp(R.head.rotation.x, hx, 6, dt);
    if ((S.blink -= dt) < 0 && S.blink < -0.12) S.blink = 2 + Math.random() * 3.5;
    const bl = S.blink < 0 || pose === 'cover' ? 0.12 : pose === 'cheer' ? 0.45 : 1;
    R.eyes.forEach(e => { e.scale.y = bl; });
    R.mouth.scale.y = S.talk > 0.3 ? 0.012 + Math.abs(Math.sin(t * 16)) * 0.035 : pose === 'cheer' ? 0.05 : 0.012;
    R.root.updateMatrixWorld(true);
  }

  // ================================================================ merged props (tables, stools, boards, chalk): pieces → one vertex-colored mesh + an ink hull
  function Kit() {
    const P = [];
    const k = {
      P,
      add(geo, color, x, y, z, sx = 1, sy = sx, sz = sx, ry = 0, rx = 0, rz = 0) { P.push({ geo, color, m: TK.M4(x, y, z, sx, sy, sz, ry, rx, rz) }); return k; },
    };
    return k;
  }
  function bake(pieces) {
    let n = 0;
    const list = pieces.map(p => { const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone(); g.applyMatrix4(p.m); n += g.attributes.position.count; return { g, c: new THREE.Color(p.color) }; });
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let o = 0;
    for (const { g, c } of list) { const cnt = g.attributes.position.count; pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); for (let i = 0; i < cnt; i++) col.set([c.r, c.g, c.b], (o + i) * 3); o += cnt; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    return geo;
  }
  function inked(kit, ink = 0.018, shadow = true) {
    const geo = bake(kit.P), g = new THREE.Group();
    const m = new THREE.Mesh(geo, toonMat({ vc: true, rim: 0.2 })); m.castShadow = shadow; m.receiveShadow = true; g.add(m);
    if (ink) g.add(new THREE.Mesh(geo, inkMat(ink)));
    return g;
  }

  // ================================================================ drawing on canvases: the chalk on the cobbles, the boards, the hustlers' sign
  const CHALK_COL = { grid: 'rgba(253,251,245,0.95)', x: '#ffe27a', o: '#ff9fbf', doodle: 'rgba(160,220,255,0.9)' };
  // a wobbly chalk stroke (three passes, a little apart, so it looks drawn by a kid)
  function chalkLine(c, x1, y1, x2, y2, col, w, R = Math.random) {
    for (let k = 0; k < 3; k++) {
      c.beginPath(); c.moveTo(x1 + (R() - 0.5) * w * 0.6, y1 + (R() - 0.5) * w * 0.6);
      const mx = (x1 + x2) / 2 + (R() - 0.5) * w, my = (y1 + y2) / 2 + (R() - 0.5) * w;
      c.quadraticCurveTo(mx, my, x2 + (R() - 0.5) * w * 0.6, y2 + (R() - 0.5) * w * 0.6);
      c.strokeStyle = col; c.globalAlpha = k ? 0.45 : 0.9; c.lineWidth = w * (k ? 0.55 : 1); c.lineCap = 'round'; c.stroke();
    }
    c.globalAlpha = 1;
  }
  function chalkX(c, x, y, s, col, R) { chalkLine(c, x - s, y - s, x + s, y + s, col, s * 0.32, R); chalkLine(c, x + s, y - s, x - s, y + s, col, s * 0.32, R); }
  function chalkO(c, x, y, s, col, R) { for (let k = 0; k < 2; k++) { c.beginPath(); c.ellipse(x + (R() - 0.5) * 2, y + (R() - 0.5) * 2, s * (1 - k * 0.05), s * 0.92, R() * 0.4, 0, TAU); c.strokeStyle = col; c.globalAlpha = k ? 0.5 : 0.9; c.lineWidth = s * (k ? 0.18 : 0.3); c.stroke(); } c.globalAlpha = 1; }
  const TTT_TITLE = { es: 'EL GATO', pt: 'JOGO DA VELHA', de: 'TIC-TAC-TOE', zh: '[井字棋|jǐng zì qí]', ja: 'まるばつ' };      // (zh / ja: the notation, chalked as plain text)
  function drawChalkGrid(cv, board, l, seed = 7) {
    const c = cv.getContext('2d'), W = cv.width, R = rng(seed);
    c.clearRect(0, 0, W, W);
    const m = W * 0.17, s = (W - 2 * m) / 3;
    for (let i = 1; i < 3; i++) { chalkLine(c, m + s * i, m - 6, m + s * i, W - m + 6, CHALK_COL.grid, 13, R); chalkLine(c, m - 6, m + s * i, W - m + 6, m + s * i, CHALK_COL.grid, 13, R); }
    (board || []).forEach((v, i) => { const x = m + s * (i % 3 + 0.5), y = m + s * (Math.floor(i / 3) + 0.5); if (v === 'X') chalkX(c, x, y, s * 0.3, CHALK_COL.x, R); else if (v === 'O') chalkO(c, x, y, s * 0.31, CHALK_COL.o, R); });
    c.fillStyle = 'rgba(253,251,245,0.92)'; c.font = `900 ${Math.round(W * 0.085)}px "Segoe Print", "Ink Free", Bahnschrift, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(plainTL(TTT_TITLE[l] || TTT_TITLE.es), W / 2, m * 0.5);
    // a little sun doodle in the corner
    c.strokeStyle = CHALK_COL.doodle; c.lineWidth = 4; c.beginPath(); c.arc(W - m * 0.55, W - m * 0.55, m * 0.22, 0, TAU); c.stroke();
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8; c.beginPath(); c.moveTo(W - m * 0.55 + Math.cos(a) * m * 0.3, W - m * 0.55 + Math.sin(a) * m * 0.3); c.lineTo(W - m * 0.55 + Math.cos(a) * m * 0.42, W - m * 0.55 + Math.sin(a) * m * 0.42); c.stroke(); }
  }
  const HOP_WORDS = { es: ['RAYUELA', 'CIELO'], pt: ['AMARELINHA', 'CÉU'], de: ['HIMMEL UND HÖLLE', 'HIMMEL'], zh: ['[跳房子|tiào fáng zi]', '[天|tiān]'], ja: ['けんけんぱ', '[空|そら]'] };
  function drawHopscotch(cv, l) {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, R = rng(31);
    c.clearRect(0, 0, W, H);
    const bw = W * 0.3, bh = H * 0.1, cx = W / 2;
    // 1, 2, 3 single, 4-5 double, 6 single, 7-8 double, 9 single, then the sky
    const rows = [[1], [2], [3], [4, 5], [6], [7, 8], [9]];
    let y = H - bh * 1.2;
    c.font = `900 ${Math.round(bh * 0.5)}px "Segoe Print", "Ink Free", Bahnschrift, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const row of rows) {
      row.forEach((n, i) => {
        const x = row.length === 1 ? cx - bw / 2 : cx - bw + i * bw;
        chalkLine(c, x, y, x + bw, y, CHALK_COL.grid, 9, R); chalkLine(c, x + bw, y, x + bw, y + bh, CHALK_COL.grid, 9, R); chalkLine(c, x + bw, y + bh, x, y + bh, CHALK_COL.grid, 9, R); chalkLine(c, x, y + bh, x, y, CHALK_COL.grid, 9, R);
        c.fillStyle = n % 2 ? 'rgba(255,226,122,0.9)' : 'rgba(160,220,255,0.9)'; c.fillText(String(n), x + bw / 2, y + bh / 2 + 2);
      });
      y -= bh;
    }
    c.beginPath(); c.ellipse(cx, y - bh * 0.15, bw * 0.75, bh * 0.85, 0, Math.PI, TAU); c.strokeStyle = CHALK_COL.grid; c.lineWidth = 5; c.stroke();
    const [title, sky] = (HOP_WORDS[l] || HOP_WORDS.es).map(plainTL);
    c.fillStyle = 'rgba(255,159,191,0.95)'; c.font = `900 ${Math.round(bh * 0.42)}px "Segoe Print", "Ink Free", Bahnschrift, sans-serif`;
    c.fillText(sky, cx, y - bh * 0.45);
    c.save(); c.translate(W * 0.1, H * 0.55); c.rotate(-Math.PI / 2); c.fillStyle = 'rgba(253,251,245,0.8)'; c.font = `900 ${Math.round(bh * 0.4)}px "Segoe Print", "Ink Free", Bahnschrift, sans-serif`; c.fillText(title, 0, 0); c.restore();
  }
  const SIGN_TEXT = { es: ['¿UNA PARTIDA?', 'AJEDREZ · DAMAS'], pt: ['UMA PARTIDA?', 'XADREZ · DAMAS'], de: ['EINE PARTIE?', 'SCHACH · DAME'],
    zh: ['[下|xià] [一|yī] [盘|pán] [吗|ma] ？', '[国际象棋|guó jì xiàng qí] 、 [跳棋|tiào qí]'], ja: ['[一局|いっきょく] 、 いかが ？', 'チェス 、 チェッカー'] };
  const SIGN_NAT = { es: ['¿Una partida?', 'Ajedrez · Damas'], pt: ['Uma partida?', 'Xadrez · Damas'], de: ['Eine Partie?', 'Schach · Dame'], zh: SIGN_TEXT.zh, ja: SIGN_TEXT.ja };   // (for the Read card)
  // the A-frame's chalk (both sides): the question big on two lines, the two games, the stake; bold letters you can read
  // from across the square
  function drawSign(cv, l) {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, F = 'Bahnschrift, "Segoe UI", sans-serif';
    c.fillStyle = '#2f3a33'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#8a5f3e'; c.lineWidth = 18; c.strokeRect(9, 9, W - 18, H - 18);
    c.strokeStyle = 'rgba(253,251,245,0.3)'; c.lineWidth = 3; c.strokeRect(30, 30, W - 60, H - 60);
    const [a0, b] = SIGN_TEXT[l] || SIGN_TEXT.es, a = plainTL(a0), sp = cj() ? -1 : a.indexOf(' ');      // (zh / ja: the question on one line)
    const put = (s, y, max, col, wt = 900) => { let fs = max; c.font = `${wt} ${fs}px ${F}`; while (c.measureText(s).width > W - 76 && fs > 20) { fs -= 2; c.font = `${wt} ${fs}px ${F}`; } c.fillStyle = col; c.fillText(s, W / 2, y); };
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (sp > 0) { put(a.slice(0, sp), H * 0.15, 104, '#fdfbf5'); put(a.slice(sp + 1), H * 0.3, 104, '#fdfbf5'); } else put(a, H * 0.22, 104, '#fdfbf5');
    c.strokeStyle = 'rgba(253,251,245,0.7)'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(W * 0.28, H * 0.405); c.lineTo(W * 0.72, H * 0.405); c.stroke();
    const [g1, g2] = b.split(/ · | 、 /).map(plainTL); put(g1, H * 0.5, 80, '#ffe27a', 800); if (g2) put(g2, H * 0.63, 80, '#ffe27a', 800);
    c.fillStyle = '#ffd96b'; c.beginPath(); c.arc(W / 2 - 62, H * 0.82, 34, 0, TAU); c.fill(); c.fillStyle = '#2f3a33'; c.font = `900 46px ${F}`; c.fillText('5', W / 2 - 62, H * 0.82 + 2);
    c.fillStyle = '#fdfbf5'; c.font = `900 64px ${F}`; c.fillText('× 🪙', W / 2 + 34, H * 0.82);
  }
  // the 3D boards on the tables (canvas textures): a chessboard and a checkerboard, light squares cream, dark caramel / green
  function boardTex(kind) {
    return TK.canvasTex(256, 256, c => {
      c.fillStyle = '#5b3a22'; c.fillRect(0, 0, 256, 256);
      const m = 12, s = (256 - 2 * m) / 8;
      for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) { c.fillStyle = (r + f) % 2 ? (kind === 'chess' ? '#b07a48' : '#3f6f4a') : '#f3e3c3'; c.fillRect(m + f * s, m + r * s, s, s); }
    });
  }

  // ================================================================ build: the kids and their chalk in Alba, the tables and the hustlers in Molinar
  let W3 = null;               // what build() made
  const person = id => (W3 && W3.byId[id]) || null;
  function build(scene, env = {}) {
    const gy = env.terrainAt || (() => 0.25);
    const root = new THREE.Group(); root.name = 'minigames'; scene.add(root);
    const alba = new THREE.Group(); alba.name = 'mg-alba'; root.add(alba);
    const mol = new THREE.Group(); mol.name = 'mg-molinar'; root.add(mol);
    const colliders = [], people = [], byId = {};
    const Y0 = gy(PLAZA.x, PLAZA.z), YM = gy(SQUARE.x, SQUARE.z);
    // ---------------- Alba: the tic-tac-toe grid and a hopscotch, chalked on the cobbles, and a few sticks of chalk
    const decal = (cv, w, h, x, z, rot) => {
      const t = new THREE.CanvasTexture(cv); t.anisotropy = 4;
      const mat = new THREE.MeshToonMaterial({ map: t, gradientMap: TK.grad, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.set(x, gy(x, z) + 0.035, z); m.receiveShadow = true; m.renderOrder = 1;
      alba.add(m); return { m, t, cv };
    };
    const gridCv = document.createElement('canvas'); gridCv.width = gridCv.height = 256;
    const grid = decal(gridCv, CHALK.size * 1.5, CHALK.size * 1.5, CHALK.x, CHALK.z, CHALK.rot);
    const hopCv = document.createElement('canvas'); hopCv.width = 256; hopCv.height = 512;
    const hop = decal(hopCv, 1.5, 3.0, HOP.x, HOP.z, HOP.rot);
    {
      const k = Kit(), sticks = [['#fdfbf5', 0.55, 0.62, 0.4], ['#ffd1dc', 0.7, 0.45, 1.6], ['#bfe3ff', 0.38, 0.7, 2.6], ['#ffe27a', 0.82, 0.58, 0.9]];
      for (const [c, dx, dz, ry] of sticks) { const x = CHALK.x + (dx - 0.6) * 1.6, z = CHALK.z + (dz - 0.55) * 1.6 + 1.05; k.add(TK.G.cyl, c, x, gy(x, z) + 0.04, z, 0.03, 0.12, 0.03, ry, Math.PI / 2, 0); }
      alba.add(inked(k, 0.01, false));
    }
    let gridKey = '', hopKey = '';
    function drawGround() {
      const l = lang(), b = G && G.state && G.state.mg && G.state.mg.chalk ? G.state.mg.chalk : [null, 'O', null, null, 'X', null, 'X', null, 'O'];
      const k = lkey() + b.join(',');
      if (k !== gridKey) { gridKey = k; drawChalkGrid(gridCv, b, l, 7 + b.filter(Boolean).length); grid.t.needsUpdate = true; }
      if (lkey() !== hopKey) { hopKey = lkey(); drawHopscotch(hopCv, l); hop.t.needsUpdate = true; }
    }
    // ---------------- the kids
    const rigA = Rig(), rigM = Rig();
    for (const K of KIDS) {
      const R = makePerson(rigA, K.look, K.prop), H = KID_HOME[K.id];
      const S = { x: H.x, y: gy(H.x, H.z), z: H.z, yaw: H.yaw, speed: 0, phase: Math.random() * 6, pose: H.pose, talk: 0, blink: 1 + Math.random() * 3, seed: Math.random(), hop: 0, wave: 0 };
      const P = { id: K.id, def: K, R, S, kid: true, home: H, mode: 'home', target: null };
      P.api = { id: K.id, name: K.name, kind: 'kid', kid: true, hushed: false, talking: false, minigame: true, female: K.f,
        get x() { return S.x; }, get z() { return S.z; }, get y() { return S.y + (S.pose === 'kneel' ? -0.3 : S.pose === 'crouch' ? -0.2 : 0); }, top: (K.look.h || 1) * 1.62 };
      people.push(P); byId[K.id] = P;
    }
    const meshA = rigA.meshes(alba);
    // ---------------- Molinar: two tables, four stools, the boards and their pieces, a chalkboard sign; the hustlers
    const T3 = {};
    {
      const k = Kit(), WOOD = '#8a5f3e', DARK = '#5b3a22', STONE = '#d8cfbd';
      const pk = Kit();         // the pieces (no ink: they're tiny)
      for (const T of Object.values(TABLES)) {
        const y = gy(T.x, T.z);
        k.add(TK.G.cyl, STONE, T.x, y + 0.03, T.z, 0.34, 0.06, 0.34).add(TK.G.cyl, DARK, T.x, y + 0.38, T.z, 0.07, 0.7, 0.07).add(TK.G.box, WOOD, T.x, y + 0.74, T.z, 1.0, 0.06, 1.0, T.yaw);
        for (const s of [-1, 1]) { const sx = T.x + T.fx * 0.95 * s, sz = T.z + T.fz * 0.95 * s; k.add(TK.G.cyl, WOOD, sx, y + 0.22, sz, 0.2, 0.44, 0.2).add(TK.G.cyl, DARK, sx, y + 0.45, sz, 0.23, 0.04, 0.23); }
        const top = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.84), new THREE.MeshToonMaterial({ map: boardTex(T.id), gradientMap: TK.grad }));
        top.rotation.x = -Math.PI / 2; top.rotation.z = T.yaw; top.position.set(T.x, y + 0.772, T.z); top.receiveShadow = true; mol.add(top);
        // a few pieces mid-game, in the board's own frame (u along the table's side, v toward the well)
        const at = (u, v) => ({ x: T.x + Math.cos(T.yaw) * u + T.fx * v, z: T.z - Math.sin(T.yaw) * u + T.fz * v });
        const sq = 0.84 / 8, cell = (f, r) => at((f - 3.5) * sq, (r - 3.5) * sq);
        if (T.id === 'chess') {
          const lat = new THREE.LatheGeometry([[0, 0], [0.33, 0], [0.33, 0.12], [0.18, 0.3], [0.14, 0.62], [0.24, 0.72], [0, 0.82]].map(([a, b]) => new THREE.Vector2(a, b)), 10);
          const set = [[0, 0, 1.0, '#f7ecd2'], [3, 0, 1.25, '#f7ecd2'], [4, 0, 1.3, '#f7ecd2'], [5, 1, 0.8, '#f7ecd2'], [2, 2, 1.0, '#f7ecd2'], [4, 3, 0.8, '#f7ecd2'], [6, 1, 0.8, '#f7ecd2'],
            [7, 7, 1.0, '#3b3046'], [4, 7, 1.3, '#3b3046'], [3, 6, 1.25, '#3b3046'], [3, 4, 0.8, '#3b3046'], [5, 5, 1.0, '#3b3046'], [1, 6, 0.8, '#3b3046'], [6, 6, 0.8, '#3b3046']];
          for (const [f, r, s, c] of set) { const p = cell(f, r); pk.add(lat, c, p.x, y + 0.775, p.z, 0.11 * s, 0.11 * s, 0.11 * s); }
        } else {
          const disc = new THREE.CylinderGeometry(1, 1, 1, 14);
          const set = [[1, 0, 'w'], [3, 0, 'w'], [5, 0, 'w'], [0, 1, 'w'], [4, 1, 'w'], [2, 3, 'w'], [3, 4, 'b'], [6, 5, 'b'], [1, 6, 'b'], [3, 6, 'b'], [5, 6, 'b'], [2, 7, 'b'], [6, 7, 'b']];
          for (const [f, r, c] of set) { const p = cell(f, r); pk.add(disc, c === 'w' ? '#f7ecd2' : '#c9443a', p.x, y + 0.79, p.z, 0.042, 0.03, 0.042); }
        }
        colliders.push({ x: T.x, z: T.z, r: 0.62, mg: 'table' });
        const S2 = { inner: { x: T.x + T.fx * 0.95, z: T.z + T.fz * 0.95 }, outer: { x: T.x - T.fx * 0.95, z: T.z - T.fz * 0.95 } };
        colliders.push({ x: S2.inner.x, z: S2.inner.z, r: 0.24, mg: 'stool' });
        T3[T.id] = { T, y, stools: S2, stand: { x: T.x + T.fx * 1.55, z: T.z + T.fz * 1.55 } };
      }
      // the sign: an A-frame chalkboard between the tables, big enough to read from the square, chalked on both sides.
      // Each leaf leans back about its own width (YXZ: tilt, then turn), and its chalk face sits just outside it.
      const S = SIGN_AT, y = gy(S.x, S.z), yaw = Math.atan2(SQUARE.x - S.x, SQUARE.z - S.z), LW = 1.0, LH = 1.35, LEAN = 0.2, LOFF = 0.14;
      const leafQ = s => new THREE.Quaternion().setFromEuler(new THREE.Euler(-s * LEAN, yaw, 0, 'YXZ'));
      const leafAt = s => new THREE.Vector3(S.x + Math.sin(yaw) * s * LOFF, y + (LH / 2) * Math.cos(LEAN), S.z + Math.cos(yaw) * s * LOFF);
      for (const s of [-1, 1]) k.P.push({ geo: TK.G.box, color: WOOD, m: new THREE.Matrix4().compose(leafAt(s), leafQ(s), new THREE.Vector3(LW, LH, 0.05)) });
      colliders.push({ x: S.x, z: S.z, r: 0.5, mg: 'sign' });
      mol.add(inked(k, 0.016));
      const pm = new THREE.Mesh(bake(pk.P), toonMat({ vc: true, rim: 0.35 })); pm.castShadow = true; mol.add(pm);
      const signCv = document.createElement('canvas'); signCv.width = 450; signCv.height = 600;
      const st = new THREE.CanvasTexture(signCv); st.anisotropy = 4;
      const faceGeo = new THREE.PlaneGeometry(LW - 0.1, LH - 0.15), faceMat = new THREE.MeshToonMaterial({ map: st, gradientMap: TK.grad });
      for (const s of [1, -1]) {        // (s = −1: the back leaf's chalk faces backward, so it reads from that side, not mirrored)
        const face = new THREE.Mesh(faceGeo, faceMat), n = new THREE.Vector3(0, 0, 1).applyQuaternion(leafQ(s)).multiplyScalar(s);
        face.position.copy(leafAt(s)).addScaledVector(n, 0.032); face.rotation.set(-LEAN, yaw + (s < 0 ? Math.PI : 0), 0, 'YXZ'); mol.add(face);
      }
      T3.sign = { cv: signCv, t: st, key: '' };
    }
    for (const O of OLD) {
      const R = makePerson(rigM, O.look, O.prop);
      let at, yaw, pose = 'sit';
      if (O.at) { const t3 = T3[O.at]; at = t3.stools.outer; yaw = t3.T.yaw; }
      else { at = TINO_AT; yaw = Math.atan2(TABLES.chess.x - TINO_AT.x, TABLES.chess.z - TINO_AT.z) - 0.5; pose = 'lean'; }
      const S = { x: at.x, y: gy(at.x, at.z), z: at.z, yaw, baseYaw: yaw, speed: 0, phase: 0, pose, talk: 0, blink: 1 + Math.random() * 3, seed: Math.random(), hop: 0, wave: 0, board: !!O.at };
      const P = { id: O.id, def: O, R, S, kid: false, home: { x: at.x, z: at.z, yaw, pose }, mode: 'home' };
      P.api = { id: O.id, get name() { return oldName(O); }, kind: O.at ? 'player' : 'kibitzer', kid: false, hushed: false, talking: false, minigame: true, female: O.f,
        get x() { return S.x; }, get z() { return S.z; }, get y() { return S.y + (S.pose === 'sit' ? -0.05 : 0); }, top: (O.look.h || 1) * 1.5 - (S.pose === 'sit' ? 0.4 : 0) };
      if (!O.at) colliders.push({ x: at.x, z: at.z, r: 0.38, mg: 'tino' });
      people.push(P); byId[O.id] = P;
    }
    const meshM = rigM.meshes(mol);
    // ---------------- per frame
    let stRef = null;
    function update(dt, t, you) {
      if (G && G.state !== stRef) { stRef = G.state; onState(); }
      const Y = you || (G && G.sim.you) || { x: 0, z: 0 }, inRoom = !!(G && G.indoors && G.indoors());
      alba.visible = !inRoom && Math.hypot(Y.x - PLAZA.x, Y.z - PLAZA.z) < 150;
      mol.visible = !inRoom && Math.hypot(Y.x - SQUARE.x, Y.z - SQUARE.z) < 150;
      if (alba.visible || ACTIVE) drawGround();
      if (mol.visible) { const l = lang(); if (T3.sign.key !== lkey()) { T3.sign.key = lkey(); drawSign(T3.sign.cv, l); T3.sign.t.needsUpdate = true; } }
      tickGame(dt, t, you);
      for (const P of people) {
        const vis = P.kid ? alba.visible : mol.visible;
        if (!vis) continue;
        think(P, dt, t, you);
        posePerson(P, P.S, dt, t);
      }
      if (alba.visible) meshA.sync();
      if (mol.visible) meshM.sync();
      uiFrame(dt, t);
      if (medal) medal.visible = !!(G && G.state.mg && G.state.mg.medal && G.state.mg.wearMedal !== false && !G.sim.mimo.hidden);
    }
    function stats() {
      let tris = 0, calls = 0;
      root.traverse(o => { if (o.isMesh && o.visible !== false) { const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3; tris += n * (o.isInstancedMesh ? o.count : 1); calls++; } });
      return { tris: Math.round(tris), calls, people: people.length };
    }
    W3 = { root, alba, mol, people, byId, T3, grid, hop, gy, Y0, YM, colliders };
    return { colliders, group: root, people: people.map(p => p.api), update, stats, objects: { alba, molinar: mol, tables: T3 } };
  }
  // what each person does when no game is driving them: the kids hang out by their chalk, the old ones sit at their
  // boards; everyone turns to look at you when you come close, and waves the first time
  function think(P, dt, t, you) {
    const S = P.S;
    if (P.mode === 'game') return;                     // (a game moves them: tag, hide and seek)
    const H = P.home;
    if (P.mode === 'walkHome' || Math.hypot(S.x - H.x, S.z - H.z) > 0.15) {
      if (P.mode !== 'walkHome') { P.mode = 'walkHome'; P.stuck = 0; }
      P.ghostYou = false;
      const d = steer(P, H.x, H.z, 2.6, dt, { arrive: 0.12 });
      S.pose = 'walk';
      if (d < 1.2) P.stuck = (P.stuck || 0) + dt;                     // (you're standing on their spot: they squeeze in after a moment)
      if (d < 0.15 || P.stuck > 4) { P.mode = 'home'; S.x = H.x; S.z = H.z; S.speed = 0; S.pose = H.pose; }
      return;
    }
    S.speed = 0; S.pose = P.forcePose || H.pose;
    const dY = you ? Math.hypot(you.x - S.x, you.z - S.z) : 99, near = dY < 3.4 || P.api.talking;
    if (near && !P.wasNear && !P.api.talking) S.wave = 1.1;
    P.wasNear = near;
    if (P.kid) {
      if (near && you) { S.look = Math.atan2(you.x - S.x, you.z - S.z); if (S.pose !== 'kneel') S.yaw = dampAngle(S.yaw, S.look, 4, dt); }
      else { S.look = undefined; S.yaw = dampAngle(S.yaw, H.yaw, 3, dt); }
      if (P.id === 'sofi' && !near && Math.sin(t * 0.5) > 0.7) S.chatter = 0.2;     // (Sofi chatters to the others)
    } else {
      S.look = near && you ? Math.atan2(you.x - S.x, you.z - S.z) : undefined;
      if (P.id === 'tino') { S.yaw = dampAngle(S.yaw, near && you ? Math.atan2(you.x - S.x, you.z - S.z) : H.yaw, 3, dt); S.pose = near ? 'stand' : 'lean'; }
      else if (!P.playing) S.pose = Math.sin(t * 0.21 + S.seed * 6) > 0.6 ? 'think' : 'sit';
    }
  }
  // ---------------- moving the kids round the plaza: pick the best of 16 headings (toward the goal, away from anything
  // solid, inside the plaza), then slide out of whatever they touch. (Not WORLD.pushOut: that would push them off the
  // solids main.js gives them each frame.)
  let OBS = null;
  function obstacles() {
    if (OBS) return OBS;
    OBS = (typeof WORLD !== 'undefined' ? WORLD.colliders : []).filter(c => !c.npc && !c.person && !c.mg && Math.hypot(c.x - PLAZA.x, c.z - PLAZA.z) < 18);
    return OBS;
  }
  function pushOne(c, x, z, r) {
    if (c.obox) {
      const cs = Math.cos(c.rot), sn = Math.sin(c.rot);
      let lx = (x - c.x) * cs - (z - c.z) * sn, lz = (x - c.x) * sn + (z - c.z) * cs;
      const cx = clamp(lx, -c.hw, c.hw), cz = clamp(lz, -c.hd, c.hd), dx = lx - cx, dz = lz - cz, d = Math.hypot(dx, dz);
      if (d >= r) return [x, z];
      if (d > 1e-4) { lx = cx + (dx / d) * r; lz = cz + (dz / d) * r; } else if (c.hw - Math.abs(lx) < c.hd - Math.abs(lz)) lx = Math.sign(lx || 1) * (c.hw + r); else lz = Math.sign(lz || 1) * (c.hd + r);
      return [c.x + lx * cs + lz * sn, c.z - lx * sn + lz * cs];
    }
    const dx = x - c.x, dz = z - c.z, d = Math.hypot(dx, dz), m = c.r + r;
    if (d < m && d > 1e-4) return [c.x + (dx / d) * m, c.z + (dz / d) * m];
    return [x, z];
  }
  const hitsAny = (list, x, z, r) => list.some(c => { const [a, b] = pushOne(c, x, z, r); return Math.abs(a - x) + Math.abs(b - z) > 1e-3; });
  function movers(self) {          // what a kid shouldn't run through: the townsfolk, the other kids, you
    const out = [];
    if (G && G.town && G.town.people) for (const p of G.town.people) if (Math.abs(p.x - PLAZA.x) < 16 && Math.abs(p.z - PLAZA.z) < 16) out.push({ x: p.x, z: p.z, r: 0.38 });
    if (W3) for (const P of W3.people) if (P.kid && P !== self && P.S.pose !== 'crouch') out.push({ x: P.S.x, z: P.S.z, r: 0.32 });
    if (G && !(self && self.ghostYou)) out.push({ x: G.sim.you.x, z: G.sim.you.z, r: 0.42 });
    return out;
  }
  function steer(P, tx, tz, speed, dt, o = {}) {
    const S = P.S, dist = Math.hypot(tx - S.x, tz - S.z);
    if (dist < (o.arrive || 0.08)) { S.speed = 0; return dist; }
    const want = Math.atan2(tx - S.x, tz - S.z), obs = obstacles(), mv = movers(P), r = 0.32, lim = o.ring || 99;
    let best = want, bs = -1e9;
    for (let i = 0; i < 16; i++) {
      const a = want + (i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2) * (Math.PI / 8)), fx = Math.sin(a), fz = Math.cos(a);
      let s = Math.cos(angDiff(a, want)) * 1.0 + Math.cos(angDiff(a, S.yaw)) * 0.25;
      for (const [k, pen] of [[0.45, 2.2], [0.95, 1.1], [1.6, 0.5]]) { const x = S.x + fx * k, z = S.z + fz * k; if (hitsAny(obs, x, z, r) || hitsAny(mv, x, z, r)) s -= pen; if (Math.hypot(x - PLAZA.x, z - PLAZA.z) > lim) s -= pen * 1.2; }
      if (s > bs) { bs = s; best = a; }
    }
    S.yaw = dampAngle(S.yaw, best, o.turn || 11, dt);
    const step = Math.min(dist, speed * dt), hd = Math.abs(angDiff(S.yaw, best)) > 1.2 ? 0.4 : 1;
    let x = S.x + Math.sin(S.yaw) * step * hd, z = S.z + Math.cos(S.yaw) * step * hd;
    for (const c of obs) [x, z] = pushOne(c, x, z, r);
    for (const c of mv) [x, z] = pushOne(c, x, z, r);
    S.speed = Math.hypot(x - S.x, z - S.z) / Math.max(dt, 1e-4);
    S.x = x; S.z = z;
    return Math.hypot(tx - x, tz - z);
  }

  // ================================================================ the overlay layer (#mg-ui): the board card, a little answer box, bubbles over
  // people, the HUD of a running game, its E prompt and big countdown words. Paper cards with ink borders, like the game's
  // panels and battle/'s UI; every style is scoped to #mg-ui.
  const CSS = `
#mg-ui { position: fixed; inset: 0; z-index: 10; pointer-events: none; font-family: "Segoe UI", system-ui, sans-serif; color: #2b2235; }
#mg-ui * { box-sizing: border-box; }
#mg-ui .hide { display: none !important; }
#mg-ui button { font: inherit; cursor: pointer; color: inherit; }
#mg-ui kbd { font: 800 12px "Segoe UI", sans-serif; border: 1.5px solid #2b2235; border-radius: 5px; padding: 0 5px; background: #fffaf0; }
#mg-ui .mg-back { position: absolute; inset: 0; background: rgba(28,22,40,.34); pointer-events: auto; }
#mg-ui .mg-card { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: max-content; max-width: calc(100vw - 20px); max-height: calc(100vh - 16px);
  background: #fffaf0; border: 3px solid #2b2235; border-radius: 20px; box-shadow: 0 0 0 6px #fff, 0 12px 0 5px rgba(43,34,53,.18); padding: 14px 16px;
  display: flex; gap: 16px; pointer-events: auto; }
#mg-ui .mg-boardcol { display: flex; flex-direction: column; gap: 8px; align-items: center; }
#mg-ui canvas.mg-board { display: block; border-radius: 12px; cursor: pointer; touch-action: none; }
#mg-ui .mg-under { font-size: 13px; color: #4b4257; text-align: center; max-width: 100%; }
#mg-ui .mg-side { display: flex; flex-direction: column; gap: 8px; width: 330px; min-width: 0; }
#mg-ui .mg-head { display: flex; align-items: center; gap: 10px; }
#mg-ui .mg-head canvas { width: 54px; height: 54px; flex: 0 0 54px; background: #fff; border: 2px dashed rgba(43,34,53,.3); border-radius: 12px; }
#mg-ui .mg-who { min-width: 0; } #mg-ui .mg-who b { font: 800 21px Bahnschrift, "Segoe UI", sans-serif; display: block; white-space: nowrap; }
#mg-ui .mg-who small { font-size: 13px; opacity: .72; }
#mg-ui .mg-chips { margin-left: auto; display: flex; gap: 5px; flex-wrap: wrap; justify-content: flex-end; }
#mg-ui .mg-chip { font-weight: 800; font-size: 13px; background: #fff; border: 2px solid #2b2235; border-radius: 99px; padding: 1px 9px; white-space: nowrap; }
#mg-ui .mg-chip.gold { background: #ffe9a8; } #mg-ui .mg-chip.teal { background: #21a493; color: #fff; } #mg-ui .mg-chip.red { background: #e0503f; color: #fff; }
#mg-ui .mg-say { position: relative; background: #fff; border: 2.5px solid #2b2235; border-radius: 16px; padding: 9px 12px; min-height: 62px; box-shadow: 0 4px 0 rgba(43,34,53,.12); }
#mg-ui .mg-say .tools { position: absolute; right: 8px; top: -13px; display: flex; gap: 4px; }
#mg-ui .mg-say .tools button { font-size: 11px; font-weight: 800; border: 2px solid #2b2235; border-radius: 8px; background: #fffaf0; padding: 0 6px; }
#mg-ui .mg-say .tl { font-size: 20px; font-weight: 800; line-height: 1.28; }
#mg-ui .mg-say .en { font-size: 14px; font-style: italic; opacity: .7; margin-top: 2px; }
#mg-ui .mg-say.noen .en { display: none; }
#mg-ui .mg-status { font-weight: 800; font-size: 15px; color: #137267; min-height: 20px; }
#mg-ui .mg-status.warn { color: #c2412f; }
#mg-ui .mg-list { min-height: 40px; max-height: 210px; overflow: auto; font-size: 14px; line-height: 1.45; background: rgba(43,34,53,.045); border-radius: 10px; padding: 6px 10px; }
#mg-ui .mg-list:empty { display: none; }
#mg-ui .mg-list .w { color: #c2412f; font-weight: 800; }
#mg-ui .mg-list table { border-collapse: collapse; width: 100%; } #mg-ui .mg-list td { padding: 1px 4px; } #mg-ui .mg-list td.n { opacity: .5; width: 22px; }
#mg-ui .mg-hint { font-size: 14px; color: #4b4257; min-height: 18px; }
#mg-ui .mg-hint .tl, #mg-ui .mg-panel .tl { color: #c2412f; font-weight: 800; }
#mg-ui form { display: flex; gap: 8px; margin: 0; }
#mg-ui input { flex: 1; min-width: 0; font: 600 19px "Segoe UI", sans-serif; padding: 6px 10px; border: 2.5px solid #2b2235; border-radius: 10px; outline: none; background: #fff; color: #2b2235; }
#mg-ui input:focus { box-shadow: 0 0 0 3px rgba(33,164,147,.35); }
#mg-ui form button { border: 2.5px solid #2b2235; border-radius: 10px; background: #2b2235; color: #fffaf0; font-weight: 800; padding: 6px 14px; }
#mg-ui .mg-row { display: flex; gap: 6px; flex-wrap: wrap; }
#mg-ui .mg-row button { border: 2px solid #2b2235; border-radius: 10px; background: transparent; font-size: 13px; font-weight: 800; padding: 3px 10px; }
#mg-ui .mg-row button:hover, #mg-ui .mg-say .tools button:hover { background: #fff3c4; }
#mg-ui .mg-row button.main { background: #21a493; color: #fff; border-color: #21a493; }
#mg-ui .shake { animation: mg-shake .35s; }
@keyframes mg-shake { 20% { translate: -8px 0; } 45% { translate: 7px 0; } 70% { translate: -4px 0; } }
#mg-ui .mg-panel { position: absolute; left: 50%; bottom: 24px; transform: translateX(-50%); width: min(580px, calc(100vw - 28px)); background: #fffaf0; border: 3px solid #2b2235; border-radius: 18px;
  box-shadow: 0 0 0 6px #fff, 0 12px 0 5px rgba(43,34,53,.18); padding: 12px 14px; display: grid; grid-template-columns: 76px 1fr; gap: 6px 12px; align-items: center; pointer-events: auto; }
#mg-ui .mg-panel canvas { grid-row: span 4; width: 76px; height: 76px; background: #fff; border: 2px dashed rgba(43,34,53,.3); border-radius: 12px; align-self: start; }
#mg-ui .mg-panel .ptitle { font-weight: 800; font-size: 16px; }
#mg-ui .mg-panel .pbody:empty, #mg-ui .mg-panel .phint:empty { display: none; }
#mg-ui .mg-panel .big { font: 800 27px Bahnschrift, "Segoe UI", sans-serif; color: #c2412f; line-height: 1.15; }
#mg-ui .mg-panel .gloss { font-size: 14px; font-style: italic; opacity: .75; }
#mg-ui .mg-panel .note { font-size: 12.5px; opacity: .7; margin-top: 2px; }
#mg-ui .mg-panel .phint { font-size: 14px; color: #4b4257; }
#mg-ui .mg-panel .chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 2px; }
#mg-ui .mg-panel .chip { font-size: 13px; font-weight: 800; background: #fff; border: 2px solid rgba(43,34,53,.35); border-radius: 99px; padding: 0 8px; }
#mg-ui .mg-panel .chip.tl { color: #c2412f; border-color: #2b2235; }
#mg-ui .mg-panel .prow { grid-column: 2; }
#mg-ui .mg-panel .boxes { display: flex; gap: 4px; flex-wrap: wrap; }
#mg-ui .mg-panel .boxes i { font-style: normal; min-width: 38px; text-align: center; font-weight: 800; font-size: 13px; border: 2px dashed rgba(43,34,53,.3); border-radius: 8px; padding: 2px 4px; }
#mg-ui .mg-panel .boxes i.on { border: 2px solid #2b2235; background: #e9fbf8; color: #13786b; }
#mg-ui .mg-bubs { position: absolute; inset: 0; }
#mg-ui .mg-bub { position: absolute; left: 0; top: 0; transform: translate(-50%, -100%); margin-top: -10px; max-width: 320px; width: max-content; background: #fff; border: 3px solid #2b2235; border-radius: 16px;
  padding: 4px 12px 5px; font-weight: 800; font-size: 18px; line-height: 1.2; box-shadow: 0 4px 0 rgba(43,34,53,.16); text-align: center; }
#mg-ui .mg-bub::after { content: ""; position: absolute; left: 50%; bottom: -11px; width: 14px; height: 14px; background: inherit; border-right: 3px solid #2b2235; border-bottom: 3px solid #2b2235; transform: translateX(-50%) rotate(45deg); }
#mg-ui .mg-bub .nm { display: block; font-size: 10.5px; letter-spacing: .06em; text-transform: uppercase; color: #8a4f80; }
#mg-ui .mg-bub small { display: block; font-size: 12.5px; font-weight: 600; font-style: italic; opacity: .72; }
#mg-ui .mg-bub.taunt { background: #fff1d6; } #mg-ui .mg-bub.you { background: #e9fbf8; color: #13786b; } #mg-ui .mg-bub.count { background: #fffdf2; font-size: 24px; }
#mg-ui .mg-hud { position: absolute; left: 50%; top: 50px; transform: translateX(-50%); display: flex; gap: 10px; align-items: center; background: rgba(255,250,240,.96); border: 3px solid #2b2235;
  border-radius: 99px; padding: 4px 16px; font-weight: 800; font-size: 16px; box-shadow: 0 4px 0 rgba(43,34,53,.18); white-space: nowrap; }
#mg-ui .mg-hud .it { background: #e0503f; color: #fff; border-radius: 99px; padding: 1px 10px; }
#mg-ui .mg-hud .safe { background: #21a493; color: #fff; border-radius: 99px; padding: 1px 10px; }
#mg-ui .mg-hud .time { font-family: Bahnschrift, "Segoe UI", sans-serif; font-size: 19px; }
#mg-ui .mg-hud small { font-weight: 600; opacity: .7; font-size: 12.5px; }
#mg-ui .mg-prompt { position: absolute; left: 0; top: 0; transform: translate(-50%, -100%); font-size: 14px; font-weight: 700; background: #2b2235; color: #fffaf0; padding: 4px 10px 4px 5px; border-radius: 99px; }
#mg-ui .mg-prompt kbd { background: #fffaf0; color: #2b2235; border: 0; border-radius: 99px; padding: 0 7px; margin-right: 4px; font-size: 13px; }
#mg-ui .mg-big { position: absolute; left: 50%; top: 30%; transform: translate(-50%, -50%); font: 900 62px Bahnschrift, "Segoe UI", sans-serif; color: #fffaf0; -webkit-text-stroke: 9px #2b2235; paint-order: stroke fill; white-space: nowrap; text-align: center; }
#mg-ui .mg-big small { display: block; font-size: 22px; -webkit-text-stroke: 6px #2b2235; }
@media (max-width: 860px) { #mg-ui .mg-card { flex-direction: column; align-items: center; overflow: auto; } #mg-ui .mg-side { width: min(480px, 92vw); } }
`;
  let UIR = null;
  const $q = (el, s) => el.querySelector(s);
  function ui() {
    if (UIR) return UIR;
    const st = document.createElement('style'); st.id = 'mg-css'; st.textContent = CSS; document.head.appendChild(st);
    const root = document.createElement('div'); root.id = 'mg-ui';
    root.innerHTML = `<div class="mg-back hide"></div>
<div class="mg-card hide"><div class="mg-boardcol"><canvas class="mg-board"></canvas><div class="mg-under"></div></div>
  <div class="mg-side"><div class="mg-head"><canvas width="108" height="108"></canvas><div class="mg-who"><b></b><small></small></div><div class="mg-chips"></div></div>
    <div class="mg-say"><span class="tools"><button type="button" data-act="hear" title="Hear it">🔊</button><button type="button" data-act="en" title="Show the English">EN</button></span><div class="tl"></div><div class="en"></div></div>
    <div class="mg-status"></div><div class="mg-list"></div><div class="mg-hint"></div>
    <form class="mg-form"><input class="mg-input" spellcheck="false" autocomplete="off" aria-label="What you say"><button type="submit">Say it</button></form>
    <div class="mg-row mg-btns"></div></div></div>
<div class="mg-panel hide"><canvas width="152" height="152"></canvas><div class="ptitle"></div><div class="pbody"></div><div class="phint"></div>
  <form class="mg-pform"><input class="mg-pinput" spellcheck="false" autocomplete="off" aria-label="What you say"><button type="submit">Say it</button></form><div class="mg-row prow"></div></div>
<div class="mg-bubs"></div><div class="mg-hud hide"></div><div class="mg-prompt hide"><kbd>E</kbd><span></span></div><div class="mg-big hide"></div>`;
    document.body.appendChild(root);
    UIR = { root, back: $q(root, '.mg-back'), card: $q(root, '.mg-card'), board: $q(root, 'canvas.mg-board'), under: $q(root, '.mg-under'), face: $q(root, '.mg-head canvas'),
      name: $q(root, '.mg-who b'), sub: $q(root, '.mg-who small'), chips: $q(root, '.mg-chips'), say: $q(root, '.mg-say'), tl: $q(root, '.mg-say .tl'), en: $q(root, '.mg-say .en'),
      status: $q(root, '.mg-status'), list: $q(root, '.mg-list'), hint: $q(root, '.mg-hint'), form: $q(root, '.mg-form'), input: $q(root, '.mg-input'), btns: $q(root, '.mg-btns'),
      panel: $q(root, '.mg-panel'), picon: $q(root, '.mg-panel canvas'), ptitle: $q(root, '.mg-panel .ptitle'), pbody: $q(root, '.mg-panel .pbody'), phint: $q(root, '.mg-panel .phint'),
      pform: $q(root, '.mg-pform'), pinput: $q(root, '.mg-pinput'), prow: $q(root, '.mg-panel .prow'), bubs: $q(root, '.mg-bubs'), hud: $q(root, '.mg-hud'), prompt: $q(root, '.mg-prompt'), big: $q(root, '.mg-big') };
    // the board card: typing, clicking, keys (arrows move the board's cursor while the box is empty; Enter there picks)
    UIR.form.addEventListener('submit', e => { e.preventDefault(); if (BOARD && BOARD.onSubmit) { const v = UIR.input.value; if (!v.trim()) { if (BOARD.onPick) BOARD.onPick(); return; } UIR.input.value = ''; BOARD.onSubmit(v); } });
    UIR.input.addEventListener('keydown', e => {
      e.stopPropagation();
      if (!BOARD) return;
      if (e.key === 'Escape') { e.preventDefault(); if (BOARD.onEsc) BOARD.onEsc(); return; }
      if (e.repeat && e.key.length === 1) { e.preventDefault(); return; }          // (a key held down from walking doesn't spill in)
      const empty = !UIR.input.value;
      const arrows = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (empty && arrows[e.key] && BOARD.onArrow) { e.preventDefault(); BOARD.onArrow(...arrows[e.key]); return; }
      if (empty && e.key === ' ' && BOARD.onPick) { e.preventDefault(); BOARD.onPick(); return; }
      if (e.key === 'Tab') { e.preventDefault(); if (BOARD.onHelp) BOARD.onHelp(); }
    });
    UIR.input.addEventListener('keyup', e => e.stopPropagation());
    UIR.board.addEventListener('pointerdown', e => {
      if (!BOARD || !BOARD.onClick) return;
      const r = UIR.board.getBoundingClientRect();
      BOARD.onClick((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
      setTimeout(() => { if (BOARD) UIR.input.focus(); }, 0);
    });
    UIR.board.addEventListener('pointermove', e => { if (!BOARD || !BOARD.onHover) return; const r = UIR.board.getBoundingClientRect(); BOARD.onHover((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });
    UIR.board.addEventListener('pointerleave', () => { if (BOARD && BOARD.onHover) BOARD.onHover(-1, -1); });
    UIR.card.addEventListener('click', e => {
      const b = e.target.closest('button[data-act]'); if (!b || !BOARD) return;
      const act = b.dataset.act;
      if (act === 'hear') { if (BOARD.line && BOARD.line.tl) speakOut(BOARD.line.tl); }
      else if (act === 'en') { BOARD.showEn = !BOARD.showEn; paintSay(); }
      else if (BOARD.onButton) BOARD.onButton(act);
      if (BOARD) UIR.input.focus();
    });
    // the little answer box
    UIR.pform.addEventListener('submit', e => { e.preventDefault(); if (PANEL) PANEL.submit(UIR.pinput.value); });
    UIR.pinput.addEventListener('keydown', e => {
      e.stopPropagation();
      if (!PANEL) return;
      if (e.key === 'Escape') { e.preventDefault(); PANEL.cancel(); return; }
      if (e.repeat && e.key.length === 1) { e.preventDefault(); return; }
      if (e.key === 'Tab') { e.preventDefault(); PANEL.help(); }
    });
    UIR.pinput.addEventListener('keyup', e => e.stopPropagation());
    UIR.panel.addEventListener('click', e => { const b = e.target.closest('button[data-act]'); if (!b || !PANEL) return; PANEL.button(b.dataset.act); });
    // keys while one of ours is up but its box doesn't have the focus: Esc closes; letters go to the box
    addEventListener('keydown', e => {
      const box = PANEL ? UIR.pinput : BOARD ? UIR.input : null;
      if (!box) {
        if (ACTIVE && ACTIVE.onKey && !Input.typing && !e.ctrlKey && !e.metaKey) ACTIVE.onKey(e);
        return;
      }
      if (document.activeElement === box) return;
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (PANEL) PANEL.cancel(); else if (BOARD.onEsc) BOARD.onEsc(); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) box.focus();
    }, true);
    return UIR;
  }
  const speakOut = text => { const t = cj() && typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(String(text), { lang: lang(), mode: 'chars' }) : String(text); if (typeof Sound !== 'undefined' && Sound.say && !Sound.say(t.replace(/[«»„“"]/g, ''), lang()) && typeof UI !== 'undefined') UI.toast('No voice for this language is installed on this PC'); };
  const sfx = (name, ...a) => { if (typeof Sound !== 'undefined') Sound.play(name, ...a); };
  const weaveNow = () => (typeof LEX !== 'undefined' ? LEX.weave() : 0.5);
  let typingHolds = 0;
  function holdTyping(on) {
    typingHolds = Math.max(0, typingHolds + (on ? 1 : -1));
    if (typeof Input !== 'undefined') Input.typing = typingHolds > 0;
  }

  // ---------------- the board card. cfg: { who: { name, sub, icon }, size: [w, h], draw(ctx, w, h), onClick(u, v), onHover, onArrow, onPick,
  // onSubmit(text), onEsc, onHelp, onButton(act), buttons: [[act, label, main?]], placeholder, chips (html), under (html) }
  let BOARD = null;
  function boardOpen(cfg) {
    const U = ui();
    BOARD = Object.assign({ showEn: false, line: null }, cfg);
    U.back.classList.remove('hide'); U.card.classList.remove('hide');
    U.name.textContent = cfg.who.name; U.sub.textContent = plainTL(cfg.who.sub || '');
    if (cj() && typeof CJK !== 'undefined' && CJK.attachIME) CJK.attachIME(U.input);      // (zh / ja in character mode: the in-game IME)
    if (typeof ICONS !== 'undefined') ICONS.draw(U.face, cfg.who.icon || 'star');
    const dpr = Math.min(2, window.devicePixelRatio || 1), [w, h] = cfg.size;
    U.board.width = Math.round(w * dpr); U.board.height = Math.round(h * dpr); U.board.style.width = w + 'px'; U.board.style.height = h + 'px';
    BOARD.dpr = dpr; BOARD.w = w; BOARD.h = h;
    U.input.value = ''; U.input.placeholder = plainTL(cfg.placeholder || '');
    U.btns.innerHTML = (cfg.buttons || []).map(([a, l, main]) => `<button type="button" data-act="${a}" class="${main ? 'main' : ''}">${esc(l)}</button>`).join('');
    U.say.classList.add('hide'); U.status.textContent = ''; U.list.innerHTML = ''; U.hint.innerHTML = cfg.hint || ''; U.under.innerHTML = cfg.under || ''; U.chips.innerHTML = cfg.chips || '';
    holdTyping(true);
    if (G) G.sim.lock = (G.sim.lock || 0) + 1;
    boardDraw();
    setTimeout(() => { if (BOARD) U.input.focus(); }, 40);
  }
  function boardClose() {
    if (!BOARD) return;
    const U = ui(); BOARD = null;
    U.back.classList.add('hide'); U.card.classList.add('hide');
    if (document.activeElement === U.input) U.input.blur();
    holdTyping(false);
    if (G) G.sim.lock = Math.max(0, (G.sim.lock || 0) - 1);
  }
  function boardDraw() { if (!BOARD || !BOARD.draw) return; const c = ui().board.getContext('2d'); c.setTransform(BOARD.dpr, 0, 0, BOARD.dpr, 0, 0); c.clearRect(0, 0, BOARD.w, BOARD.h); BOARD.draw(c, BOARD.w, BOARD.h); }
  // What someone says here, by the weave (DESIGN.md 17.3: never the whole line with its English under it by default). A phrase of
  // play (line.id, the Phrasebook's: «¡Te toca!», «¡No vale!») comes in the language, as the kids say it, glossed small only while
  // it's new to you (o.gloss false: never; o.gloss true on a line without an id: glossed); your own lines and the counting stay
  // in the language; anything else is mixed like every line (STORY.mixHTML): the English with the words you know in the
  // language, whole lines in the language as the weave rises. Once per line said. → { html, gl (a small gloss, or ''), en }
  function sayHTML(line, o = {}) {
    const tl = String(line.tl == null ? '' : line.tl), en = line.en && line.en !== tl ? String(line.en) : '';
    if (!en || o.kind === 'you') return { html: esc(tl), gl: '', en };
    if (line.id || o.gloss !== undefined || o.kind === 'count') {
      let gl = '';
      if (line.id && typeof LEX !== 'undefined' && LEX.item(line.id)) { if (o.gloss !== false && !LEX.taught(line.id) && LEX.wv(line.id) < 3) gl = en; LEX.woven(line.id); }
      else if (o.gloss === true) gl = en;
      return { html: esc(tl), gl, en };
    }
    if (typeof STORY !== 'undefined' && STORY.mixHTML) { try { return { html: STORY.mixHTML(tl, en, { key: 'mg:' + en }).html, gl: '', en }; } catch (e) { console.warn('[minigames] mix', e); } }
    return { html: esc(tl), gl: '', en };
  }
  // what the other player says: by the weave (sayHTML), its whole English on request (EN)
  function boardSay(line, o = {}) {
    if (!BOARD) return;
    BOARD.line = line; BOARD.showEn = false; BOARD.said = sayHTML(line, o);
    if (line.id && typeof LEX !== 'undefined') LEX.expose(line.id);
    paintSay();
    if (!o.quiet) sfx('blip', o.voice || 'kid');
  }
  function paintSay() {
    const U = ui(), L = BOARD && BOARD.line; if (!L) { U.say.classList.add('hide'); return; }
    const s = BOARD.said || { html: esc(L.tl), gl: '', en: L.en && L.en !== L.tl ? L.en : '' };
    U.say.classList.remove('hide');
    U.tl.innerHTML = s.html + (s.gl ? `<span class="gl">(${ESCH(s.gl)})</span>` : ''); U.en.textContent = s.en;      // (zh / ja: with readings)
    U.say.classList.toggle('noen', !BOARD.showEn);
  }
  const boardStatus = (text, warn) => { const U = ui(); U.status.textContent = text || ''; U.status.classList.toggle('warn', !!warn); };
  const boardList = html => { ui().list.innerHTML = html || ''; const l = ui().list; l.scrollTop = l.scrollHeight; };
  const boardHint = html => { ui().hint.innerHTML = html || ''; };
  const boardChips = html => { ui().chips.innerHTML = html || ''; };
  const boardShake = () => { const c = ui().card; c.classList.remove('shake'); void c.offsetWidth; c.classList.add('shake'); };

  // ---------------- the little answer box: one line to type, in the language. o: { icon, title, big, gloss, note, body (html),
  // hint, placeholder, check(text) → { done: value } | { hint: html, shake } | null, help() → html (and it says it), buttons:
  // [[act, label]], onButton(act) → value | undefined, escValue, hear (text for 🔊) }. Resolves the value, or o.escValue on Esc.
  let PANEL = null;
  function askBox(o) {
    const U = ui();
    if (PANEL) PANEL.cancel();
    return new Promise(resolve => {
      const t0 = performance.now();
      let helped = 0;
      const finish = v => { if (PANEL !== P) return; PANEL = null; U.panel.classList.add('hide'); if (document.activeElement === U.pinput) U.pinput.blur(); holdTyping(false); resolve(v); };
      const P = {
        o, get ms() { return performance.now() - t0; }, get helped() { return helped; },
        submit(text) {
          if (!String(text).trim()) return;
          if (o.help && /^\s*[?？]+\s*$|^\s*(idk|i don'?t know|no s[eé]|n[aã]o sei|wei(ß|ss) nicht|keine ahnung|help|ayuda|ajuda|hilfe|不知道|buzhidao|わからない|わかんない|wakaranai|wakannai)\s*$/i.test(text)) { P.help(); return; }
          const r = o.check ? o.check(text, P) : { done: text };
          if (r && r.done !== undefined) { U.pinput.value = ''; finish(r.done); return; }
          if (r && r.hint !== undefined) U.phint.innerHTML = r.hint;
          if (r && r.shake !== false) { U.panel.classList.remove('shake'); void U.panel.offsetWidth; U.panel.classList.add('shake'); sfx('wrong'); }
          U.pinput.select();
        },
        help() { if (!o.help) return; helped++; const h = o.help(helped); if (h) U.phint.innerHTML = h; U.pinput.focus(); },
        cancel() { finish(o.escValue !== undefined ? o.escValue : null); },
        button(act) { if (act === 'help') { P.help(); return; } if (act === 'hear') { speakOut(o.hear || ''); U.pinput.focus(); return; } if (act === 'esc') { P.cancel(); return; } const v = o.onButton ? o.onButton(act, P) : undefined; if (v !== undefined) finish(v); else U.pinput.focus(); },
        hint(html) { U.phint.innerHTML = html; },
      };
      PANEL = P;
      if (typeof ICONS !== 'undefined') ICONS.draw(U.picon, o.icon || 'speech');
      U.ptitle.innerHTML = o.title || '';
      U.pbody.innerHTML = (o.big ? `<div class="big">${esc(o.big)}</div>` : '') + (o.gloss ? `<div class="gloss">${esc(o.gloss)}</div>` : '') + (o.note ? `<div class="note">${esc(o.note)}</div>` : '') + (o.body || '');
      U.phint.innerHTML = o.hint || '';
      U.pinput.value = ''; U.pinput.placeholder = plainTL(o.placeholder || '');
      if (cj() && typeof CJK !== 'undefined' && CJK.attachIME) CJK.attachIME(U.pinput);      // (zh / ja in character mode: the in-game IME)
      const btns = (o.buttons || []).concat(o.hear ? [['hear', '🔊 Hear it']] : [], o.help ? [['help', 'I don’t know (?)']] : [], [['esc', o.escLabel || 'Not now (Esc)']]);
      U.prow.innerHTML = btns.map(([a, l]) => `<button type="button" data-act="${a}">${esc(l)}</button>`).join('');
      U.panel.classList.remove('hide');
      holdTyping(true);
      setTimeout(() => { if (PANEL === P) { U.pinput.value = ''; U.pinput.focus(); } }, 260);      // (a moment, so a key held from walking doesn't type into it)
    });
  }

  // ---------------- bubbles over people (non-blocking: taunts during a chase, counting, shouts). who: a person, or 'you'
  const BUBS = [];
  function bubble(who, line, o = {}) {
    const U = ui();
    const prev = BUBS.find(b => b.who === who); if (prev) { prev.el.remove(); BUBS.splice(BUBS.indexOf(prev), 1); }
    const el = document.createElement('div');
    // (by the weave, sayHTML: no English under it, only a phrase's small gloss while it's new; zh / ja: with readings)
    const s = sayHTML(line, o);
    el.className = 'mg-bub ' + (o.kind || '');
    el.innerHTML = (o.name ? `<span class="nm">${esc(o.name)}</span>` : '') + s.html + (s.gl ? `<small>${ESCH(s.gl)}</small>` : '');
    U.bubs.appendChild(el);
    BUBS.push({ who, el, t: o.t || clamp(1.6 + plainTL(line.tl).length * (cj() ? 0.12 : 0.045), 1.8, 3.6) });
    if (line.id && typeof LEX !== 'undefined') LEX.expose(line.id);
    if (o.sound !== false) { const v = who === 'you' ? 'rosa' : who && who.kid ? 'kid' : 'baker'; sfx('blip', v); }
  }
  const clearBubbles = () => { for (const b of BUBS) b.el.remove(); BUBS.length = 0; };
  const hud = html => { const U = ui(); if (html == null) { U.hud.classList.add('hide'); U.hud._h = ''; return; } U.hud.classList.remove('hide'); if (U.hud._h !== html) { U.hud._h = html; U.hud.innerHTML = html; } };
  let PROMPT = null, BIG = null;
  const promptAt = p => { PROMPT = p; };          // { x, y, z, label } | null
  function bigText(html, secs = 1) { BIG = { html, t: secs }; const b = ui().big; b.innerHTML = html; b.classList.remove('hide'); }
  const v3 = typeof THREE !== 'undefined' ? new THREE.Vector3() : null;
  function toScreen(x, y, z) {
    if (!G || !G.w3d) return null;
    v3.set(x, y, z).project(G.w3d.camera);
    return { x: (v3.x * 0.5 + 0.5) * innerWidth, y: (-v3.y * 0.5 + 0.5) * innerHeight, on: v3.z < 1 && Math.abs(v3.x) < 1.1 && Math.abs(v3.y) < 1.1 };
  }
  function place(el, p) {
    if (!p || !p.on) { el.style.visibility = 'hidden'; return; }
    const w = el.offsetWidth || 160, h = el.offsetHeight || 40;
    el.style.left = clamp(p.x, w / 2 + 8, innerWidth - w / 2 - 8) + 'px'; el.style.top = clamp(p.y, h + 14, innerHeight - 8) + 'px'; el.style.visibility = 'visible';
  }
  function uiFrame(dt) {
    if (!UIR) return;
    for (let i = BUBS.length - 1; i >= 0; i--) {
      const b = BUBS[i];
      if ((b.t -= dt) <= 0) { b.el.remove(); BUBS.splice(i, 1); continue; }
      let p = null;
      if (b.who === 'you') { const Y = G.sim.you; p = toScreen(Y.x, Y.ry + 2.2, Y.z); }
      else if (b.who && b.who.api) p = toScreen(b.who.S.x, b.who.api.y + b.who.api.top + 0.25, b.who.S.z);
      else if (b.who && b.who.x !== undefined) p = toScreen(b.who.x, (b.who.y || 0) + 1.6, b.who.z);
      place(b.el, p);
    }
    const pr = UIR.prompt;
    if (PROMPT && !PANEL && !BOARD) { pr.classList.remove('hide'); const lb = pr.querySelector('span'); if (lb.textContent !== PROMPT.label) lb.textContent = PROMPT.label; const k = pr.querySelector('kbd'); const key = typeof KEYS !== 'undefined' ? KEYS.name((KEYS.map.interact || ['KeyE'])[0]) : 'E'; if (k.textContent !== key) k.textContent = key; place(pr, toScreen(PROMPT.x, PROMPT.y + 1.9, PROMPT.z)); }
    else pr.classList.add('hide');
    if (BIG && (BIG.t -= dt) <= 0) { BIG = null; UIR.big.classList.add('hide'); }
  }

  // ================================================================ state, rewards, records (state.mg)
  function freshState() { return { v: 1, rec: {}, stickers: [], stars: 0, said: {}, met: {}, medal: false, wearMedal: true, coinsWon: 0, coinsLost: 0, chalk: null }; }
  const S = () => { if (!G) return freshState(); const st = G.state; if (!st.mg) st.mg = freshState(); return st.mg; };
  const rec = g => { const s = S(); return s.rec[g] || (s.rec[g] = { w: 0, l: 0, d: 0, p: 0 }); };
  const wait = s => (typeof STORY !== 'undefined' && G ? STORY.wait(s) : new Promise(r => setTimeout(r, s * 1000)));
  const toast = t => { if (typeof UI !== 'undefined') UI.toast(t); };
  function addCoins(n, why) { if (!n || !G) return; G.state.coins = Math.max(0, (G.state.coins || 0) + n); if (n > 0) sfx('chest'); toast(`🪙 ${n > 0 ? '+' : '−'}${Math.abs(n)} ${Math.abs(n) === 1 ? 'coin' : 'coins'}${why ? ' · ' + why : ''}`); }
  const star = (n = 1) => { S().stars += n; };
  const noteSaid = id => { const s = S(); s.said[id] = (s.said[id] || 0) + 1; };
  const STICKERS = { tag: 'Tag champ', ttt: 'Chalk master', rps: 'Rock solid', hide: 'Plaza ninja', chess: 'Checkmate!', checkers: 'King me!' };
  function sticker(g) { const s = S(); if (s.stickers.includes(g)) return false; s.stickers.push(g); sfx('learned'); toast(`★ New sticker: ${STICKERS[g]}`); return true; }
  function result(g, r) { const R = rec(g); R.p++; R[r]++; if (r === 'w') sticker(g); if (G) G.save(); }
  const kidGamesWon = () => ['tag', 'ttt', 'rps', 'hide'].filter(g => rec(g).w > 0).length;
  let BUSY = false, ACTIVE = null;                    // a minigame's flow runs / a 3D game (tag, hide and seek) runs
  // a line from LT over someone (waits for E, through the weave like everyone's)
  function speak(P, key, vars) {
    const L = lineOf(key, vars), api = P.api || P;
    api.lines = { en: L.weave || L.en }; api.lines[lang()] = L.text;
    if (P.S) P.S.chatter = 0.3;
    return STORY.sayInline(api);
  }
  const kid = id => person(id);
  const KID_OF = { tag: 'beto', ttt: 'luci', rps: 'sofi', hide: 'sofi' };
  const GAME_NAME = {
    tag: { es: 'La mancha', pt: 'Pega-pega', de: 'Fangen', zh: '[抓人|zhuā rén]', ja: '[鬼|おに]ごっこ', en: 'Tag', sub: 'Run around the plaza: catch them, then don’t get caught.' },
    ttt: { es: 'El gato', pt: 'Jogo da velha', de: 'Tic-Tac-Toe', zh: '[井字棋|jǐng zì qí]', ja: 'まるばつ', en: 'Tic-tac-toe', sub: 'In chalk: say where your X goes.' },
    rps: { es: 'Piedra, papel o tijera', pt: 'Pedra, papel e tesoura', de: 'Schere, Stein, Papier', zh: '[石头|shí tou] [剪刀|jiǎn dāo] [布|bù]', ja: 'じゃんけん', en: 'Rock, paper, scissors', sub: 'Type your pick. First to three.' },
    hide: { es: 'Las escondidas', pt: 'Esconde-esconde', de: 'Verstecken', zh: '[捉迷藏|zhuō mí cáng]', ja: 'かくれんぼ', en: 'Hide and seek', sub: 'Hide while Sofi counts, then count and find them.' },
  };
  const GAME_PHRASES = {
    tag: ['ph.play.cantCatch', 'ph.play.youreIt', 'ph.play.slow', 'ph.play.gotYou', 'ph.play.almost', 'ph.play.noFair'],
    ttt: ['ph.play.yourTurn', 'ph.play.iWon', 'ph.play.draw', 'ph.play.again'],
    rps: ['ph.play.iWon', 'ph.play.again', 'ph.play.noFair', 'ph.play.almost'],
    hide: ['ph.play.found', 'ph.play.readyOrNot', 'ph.play.iSeeYou', 'ph.play.whereAreYou'],
    table: ['ph.table.check', 'ph.table.niceMove', 'ph.table.tookKnight', 'ph.table.mate', 'ph.table.giveUp', 'ph.table.chessDraw', 'ph.table.knewIt', 'ph.table.payUp', 'ph.table.mustTake', 'ph.table.aGame'],
  };
  const taught = id => typeof LEX !== 'undefined' && LEX.taught(id);
  const P_LINE = (id, o = {}) => ({ tl: phraseText(id, o), en: (PH[id] || {}).en || '', id });

  // ================================================================ phrases: learn one (copy it), then use it (from memory)
  // Learn: the phrase, its meaning and when it's used; you type it once (LEX: an echo, so it's in the Phrasebook).
  async function learnPhrase(id, o = {}) {
    const p = PH[id]; if (!p) return false;
    const l = lang(), shown = phraseText(id, { f: o.f }), alt = p.f && p.f[l] ? (o.f ? p[l] : p.f[l]) : null;
    const noteForm = alt ? (o.f ? `To a boy: «${p[l]}».` : `To a girl: «${p.f[l]}».`) : '';
    if (typeof LEX !== 'undefined') LEX.expose(id);
    let tries = 0;
    const box = askBox({ icon: p.icon || 'speech', title: o.title || 'A new phrase! Type it to learn it', big: shown, gloss: p.en, note: [noteOf(p), noteForm].filter(Boolean).join(' '),
      placeholder: shown, hear: shown, escLabel: 'Skip (Esc)',
      check: text => { const m = phraseMatch(id, text, { f: o.f }); if (m.ok) return { done: { ok: true, slip: m.slip, typed: text } }; tries++; return { hint: m.close ? `Almost! Copy it exactly: <span class="tl">${esc(shown)}</span>` : `Copy it: <span class="tl">${esc(shown)}</span>` }; } });
    setTimeout(() => { if (PANEL) speakOut(shown); }, 350);
    const r = await box;
    if (!r) return false;
    if (typeof LEX !== 'undefined') LEX.attempt(id, { ok: true, hints: tries ? 1 : 0, ms: 6000, mode: 'echo' });
    sfx('learned'); noteSaid(id);
    toast(`New phrase: «${shown}» · it’s in your Phrasebook (journal)`);
    if (G) G.save();
    return true;
  }
  // Say one back, from memory. ids: the phrases that fit; to: who you're teasing ({ f } for agreement). Chips show what
  // each one means (in English): you remember the words. Resolves { id, form, agree } or null.
  async function sayPhrase(ids, o = {}) {
    const can = ids.filter(taught); if (!can.length) return null;
    const l = lang(), t0 = performance.now();
    let missed = null, helps = 0;
    const r = await askBox({ icon: o.icon || 'taunt', title: o.title || 'Say it!', placeholder: o.placeholder || 'type it in ' + LNAME[l] + '…',
      body: `<div class="chips">${can.map(id => `<span class="chip" title="${esc(noteOf(PH[id]))}">${esc(PH[id].en)}</span>`).join('')}</div>`,
      hint: o.hint || 'From memory! (? shows them)', escLabel: o.escLabel || 'Not now (Esc)',
      help: () => { helps++; return `${can.map(id => `<span class="tl">${esc(phraseText(id, { f: o.f }))}</span>`).join(' · ')}`; },
      check: text => {
        for (const id of can) { const m = phraseMatch(id, text, { f: o.f }); if (m.ok) return { done: { id, form: m.form, agree: m.agree, want: m.want, slip: m.slip } }; }
        const n = nrm(text); if (looksEnglish(n, l)) return { hint: `In ${LNAME[l]}! (? shows them)` };
        let best = null; for (const id of can) { const m = phraseMatch(id, text, { f: o.f }); if (m.close) { best = { id, want: m.want }; break; } }
        if (best) { missed = best.id; return { hint: `So close! It’s <span class="tl">${esc(best.want)}</span>. Type it again.` }; }
        return { hint: `Hmm, that’s not one of them. (? shows them)` };
      } });
    if (!r) return null;
    if (typeof LEX !== 'undefined') LEX.attempt(r.id, { ok: true, hints: missed === r.id || helps ? 1 : 0, ms: performance.now() - t0, mode: 'talk' });
    noteSaid(r.id); star();
    if (r.agree === false && r.want) toast(`Close: to ${o.toName || 'them'} it’s «${r.want}» (${o.f ? 'a girl: -a' : 'a boy: -o'})`);
    return r;
  }
  // yes or no, in the language (to "shall we play?"): 'yes' | 'ask' (you said «¿Puedo jugar?») | 'no' | null (Esc)
  async function answerYes(P, inviteKey) {
    const l = lang(), inv = lineOf(inviteKey);
    bubble(P, { tl: inv.text, en: inv.en }, { name: P.api.name, kind: 'taunt' });
    let misses = 0;
    const YES1 = pickL({ es: '¡Sí!', pt: 'Sim!', de: 'Ja!', zh: '[好|hǎo] ！', ja: 'いいよ ！' }), yes = pickL({ es: 'sí', pt: 'sim', de: 'ja', zh: '[好|hǎo]', ja: 'うん' }), no = pickL({ es: 'no', pt: 'não', de: 'nein', zh: '[不要|bù yào]', ja: 'ううん' });
    return askBox({ icon: 'speech', title: `${esc(P.api.name)} asks: «${esc(inv.text)}»`, body: `<div class="gloss">${ESCH(UI.weavePlain(inv.en, { english: true }))}</div>`, placeholder: pickL({ es: 'sí… / no…', pt: 'sim… / não…', de: 'ja … / nein …', zh: 'hǎo… / bú yào…', ja: 'un… / uun…' }),
      hint: 'Answer in ' + LNAME[l] + '.', escValue: null,
      help: () => `Say <span class="tl">${esc(YES1)}</span> or ask: <span class="tl">${esc(phraseText('ph.play.canIPlay'))}</span>`,
      check: text => {
        const a = yesNo(text, l);
        if (a === 'yes' || a === 'ask' || a === 'no') return { done: a };
        misses++;
        if (a === 'en') { const L2 = lineOf('mg.kids.inLang'); bubble(P, { tl: L2.text, en: UI.weavePlain(L2.en, { english: true }) }, { name: P.api.name }); return { hint: `In ${LNAME[l]}: <span class="tl">${esc(yes)}</span> or <span class="tl">${esc(no)}</span>…` }; }
        const L3 = lineOf('mg.kids.huh'); bubble(P, { tl: L3.text, en: UI.weavePlain(L3.en, { english: true }) }, { name: P.api.name });
        return { hint: misses > 1 ? `Try <span class="tl">${esc(YES1)}</span>, or <span class="tl">${esc(phraseText('ph.play.canIPlay'))}</span>` : 'Yes or no?' };
      } });
  }
  // a due phrase comes back now and then: a kid (or Tino) asks you to say it again (spaced review, from memory)
  async function reviewDue(P, set) {
    if (typeof LEX === 'undefined') return;
    const now = Date.now() / 1000, due = set.filter(id => taught(id) && LEX.st(id).due && LEX.st(id).due <= now);
    if (!due.length) return;
    const id = due[0], p = PH[id];
    const r = await askBox({ icon: p.icon || 'speech', title: `${P.api.name}: "Do you remember how to say this?"`, big: p.en, placeholder: 'from memory…',
      hint: '? if you forgot it', escLabel: 'Not now (Esc)',
      help: () => { setTimeout(() => speakOut(phraseText(id, { f: P.def && P.def.f })), 100); return `It’s <span class="tl">${esc(phraseText(id))}</span>. Type it!`; },
      check: (text, B) => { const m = phraseMatch(id, text); if (m.ok) return { done: { ok: true, hints: B.helped } }; const c = m.close ? `Almost: <span class="tl">${esc(m.want)}</span>` : 'Not quite. (? shows it)'; return { hint: c }; } });
    if (!r) return;
    LEX.attempt(id, { ok: true, hints: r.hints || 0, ms: 5000, mode: 'review' }); noteSaid(id); star();
    sfx(r.hints ? 'pip' : 'review'); bubble(P, sayOf('wellSaid'), { name: P.api.name });
  }

  // ================================================================ the kids: talk, pick a game, play
  function parkMimo(spot, look) { if (!G) return; G.sim.mimoGo(spot, look || spot); }
  async function kidTalk(P) {
    const s = S(), l = lang();
    P.api.talking = true;
    try {
      if (!s.met.kids) {
        await speak(kid('sofi'), 'mg.kids.hi');
        await speak(kid('luci'), 'mg.kids.ask');
        const ok = await learnPhrase('ph.play.canIPlay', { title: 'Luci wants you to ask properly. Type it to learn it!' });
        if (ok) bubble('you', P_LINE('ph.play.canIPlay'), { kind: 'you' });
        await speak(kid('beto'), 'mg.kids.yes');
        s.met.kids = true; G.save();
      } else await speak(P, 'mg.kids.again.' + P.id);
      await reviewDue(P, ['ph.play.canIPlay'].concat(...Object.values(GAME_PHRASES).slice(0, 4)));
      const played = Object.keys(s.rec).some(g => rec(g).p > 0);
      const title = `«${plainTL(lineOf('mg.kids.which').text)}»: what should we play?`;
      const opts = ['tag', 'ttt', 'rps', 'hide'].map(g => { const R = rec(g); return { label: `${plainTL(GAME_NAME[g][l])} (${GAME_NAME[g].en})`, sub: GAME_NAME[g].sub + (R.p ? `  ·  you ${R.w}–${R.l} them` : ''), value: g }; });
      if (played) opts.push({ label: 'Our scores', sub: 'Wins, stickers, phrases', value: 'rec' });
      const g = await UI.choose(title, opts);
      if (!g) { bubble(P, { tl: lineOf('mg.kids.no').text, en: UI.weavePlain(lineOf('mg.kids.no').en, { english: true }) }, { name: P.api.name }); return; }
      if (g === 'rec') { await speak(P, 'mg.kids.records'); await showRecords(); return; }
      await startKidGame(g);
    } finally { P.api.talking = false; }
  }
  async function startKidGame(g) {
    const host = kid(KID_OF[g]);
    const a = await answerYes(host, 'mg.inv.' + g);
    if (!a) return;
    if (a === 'no') { bubble(host, { tl: lineOf('mg.kids.no').text, en: UI.weavePlain(lineOf('mg.kids.no').en, { english: true }) }, { name: host.api.name }); return; }
    if (a === 'ask') { star(); noteSaid('ph.play.canIPlay'); if (typeof LEX !== 'undefined') LEX.attempt('ph.play.canIPlay', { ok: true, ms: 4000, mode: 'talk' }); }
    bubble(host, { tl: lineOf('mg.kids.yes').text, en: UI.weavePlain(lineOf('mg.kids.yes').en, { english: true }) }, { name: host.api.name });
    await wait(0.6);
    let out;
    if (g === 'tag') out = await playTag(host);
    else if (g === 'ttt') out = await playTTT(host);
    else if (g === 'rps') out = await playRPS(host);
    else if (g === 'hide') out = await playHide(host);
    if (out !== 'quit') await afterKidGame(g, host);
  }
  // after a game: the medal (all four won), or a new taunt to learn, or a quick review
  async function afterKidGame(g, host) {
    const s = S();
    if (!s.medal && kidGamesWon() >= 4) {
      s.medal = true; G.state.bag = G.state.bag || {}; G.state.bag['k.medal'] = 1;
      await speak(kid('sofi'), 'mg.kids.medal');
      const name = typeof LEX !== 'undefined' ? LEX.form('k.medal') : 'medal';
      addCoins(5, 'the plaza champion');
      await UI.card(`<canvas width="140" height="140"></canvas><div class="tag">For ${esc(G.state.mimoName || 'Mimo')}</div><div class="big">${esc(name)}</div><div class="sub">The Plaza medal: ${esc(G.state.mimoName || 'Mimo')} wears it now · <b>E</b></div>`, { kind: 'reveal', icon: 'medal', say: name });
      if (G.sim) { G.sim.mimo.happy = 2; G.w3d.fx.sparkle(G.sim.mimo.x, G.sim.mimo.ry + 0.8, G.sim.mimo.z, 20); }
      G.save();
      return;
    }
    const next = GAME_PHRASES[g].find(id => !taught(id));
    if (next) {
      await speak(host, 'mg.teach.offer');
      const ok = await learnPhrase(next, { f: next === 'ph.play.slow' ? true : undefined, title: `${host.api.name} teaches you a ${next === 'ph.play.canIPlay' ? 'phrase' : 'taunt'}. Type it to learn it!` });
      if (ok) { bubble('you', P_LINE(next), { kind: 'you' }); await wait(0.4); await speak(host, 'mg.teach.use'); }
    }
  }
  // the camera on a little scene: from a spot, looking at another
  function shot(from, look, h = 2.6, dur = 0.9) { if (!G) return; G.cam.override = { pos: new THREE.Vector3(from.x, (W3 ? W3.gy(from.x, from.z) : 0.25) + h, from.z), look: new THREE.Vector3(look.x, (W3 ? W3.gy(look.x, look.z) : 0.25) + (look.y || 0.8), look.z), dur }; }
  const unshot = () => { if (G) G.cam.override = null; };

  // ================================================================ tag («la mancha»): real chasing round the fountain
  const TAG = { secs: 60, reach: 1.05, kidRun: 4.6, kidSprint: 6.4, itRun: 5.2, itSprint: 7.2 };
  async function playTag(host) {
    const kids = KIDS.map(K => kid(K.id)), Y = G.sim.you;
    await speak(host, 'mg.tag.rules');
    // places: you south of the fountain, the kids spread out on the far side; Mimo watches from a bench
    const start = ringAt(PLAZA, 90, 6.2);
    Y.x = start.x; Y.z = start.z; Y.yaw = Math.PI; G.sim.snap(); G.cam.snap(Math.PI, 0.42, 9.5);
    kids.forEach((P, i) => { const a = 230 + i * 40, p = ringAt(PLAZA, a, 7 + (i % 2)); P.S.x = p.x; P.S.z = p.z; P.S.yaw = Math.atan2(Y.x - p.x, Y.z - p.z); P.mode = 'game'; P.S.pose = 'stand'; P.count = 0; P.ghostYou = false; P.stamina = 1.6; });
    parkMimo(ringAt(PLAZA, 158, 10.6), PLAZA);
    const A = ACTIVE = { kind: 'tag', t: TAG.secs, it: 'you', grace: 1.2, tags: 0, taunts: 0, out: 0, paused: false, kids, target: null, retarget: 0, tauntHint: true, nextTaunt: 2.5, said: new Set() };
    A.done = new Promise(r => { A.resolve = r; });
    A.onKey = e => { if ((e.code === 'KeyT' || (KEYS.map.interact || []).includes(e.code)) && A.tauntReady) { e.preventDefault(); tauntBack(A); } if (e.code === 'Escape') { e.preventDefault(); A.quit = true; } };
    hud(tagHud(A));
    for (const w of [3, 2, 1]) { bigText(`${numWord(w)}<small>${w}</small>`, 0.9); sfx('click'); await wait(0.85); }
    bigText(esc(sayOf('go').tl), 0.9); sfx('whistle');
    A.live = true;
    const res = await A.done;
    A.live = false; ACTIVE = null; hud(null); promptAt(null);
    kids.forEach(P => { P.mode = 'walkHome'; P.count = 0; });
    G.sim.mimoGo(null, null);
    if (res === 'quit') { clearBubbles(); return 'quit'; }
    sfx('whistle'); bigText(sayOf('timeUp').tl, 1.4);
    await wait(1.2);
    const it = A.it === 'you' ? null : A.it, talker = it || host;
    if (A.it === 'you') { result('tag', 'l'); await speak(talker, 'mg.tag.youLose'); }
    else { result('tag', 'w'); addCoins(2, 'tag'); talker.S.pose = 'sulk'; await speak(talker, 'mg.tag.youWin'); }
    if (A.tags) toast(`You tagged someone ${A.tags} ${A.tags === 1 ? 'time' : 'times'} · ${A.taunts} taunt${A.taunts === 1 ? '' : 's'} back`);
  }
  function tagHud(A) {
    const s = Math.max(0, Math.ceil(A.t)), who = A.it === 'you' ? `<span class="it">${esc(phraseText('ph.play.youreIt'))}</span>` : `<span class="safe">${esc(A.it.api.name)} 🏃</span>`;
    return `🏃 ${esc(GAME_NAME.tag[lang()])} <span class="time">${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</span> ${who} <small>tags ${A.tags}${A.tauntReady ? ' · T: taunt!' : ''}</small>`;
  }
  const paused = () => !G || G.journalOpen || !!STORY.line || G.state.teaching || !!PANEL || !!BOARD;
  function tagTick(A, dt, t) {
    if (!A.live) return;
    if (A.quit) { A.resolve('quit'); return; }
    if (paused()) return;
    const Y = G.sim.you, kids = A.kids;
    A.t -= dt; A.grace -= dt; A.retarget -= dt; A.nextTaunt -= dt;
    const dY = P => Math.hypot(P.S.x - Y.x, P.S.z - Y.z);
    // out of the plaza: a warning, then you're it
    const rY = Math.hypot(Y.x - PLAZA.x, Y.z - PLAZA.z);
    if (rY > PLAZA.out) { A.out += dt; if (A.out > 0.3 && !A.warned) { A.warned = true; const near = kids.slice().sort((a, b) => dY(a) - dY(b))[0]; bubble(near, sayOf('outWarn'), { name: near.api.name }); } if (A.out > 3.2 && A.it !== 'you') { const was = A.it; was.S.pose = 'stand'; A.it = 'you'; A.grace = 1.5; bubble(was, { tl: sayOf('leftPlaza').tl, en: sayOf('leftPlaza').en, id: 'ph.play.noFair' }, { name: was.api.name, kind: 'taunt' }); sfx('wrong'); } }
    else { A.out = 0; A.warned = false; }
    // you tag a kid (not the one who just tagged you: no tag-backs!)
    A.noBackT = (A.noBackT || 0) - dt;
    if (A.it === 'you' && A.grace <= 0) for (const P of kids) if (dY(P) < TAG.reach) {
      if (P === A.noBack && A.noBackT > 0) { if ((A.noBackSaid || 0) < performance.now()) { A.noBackSaid = performance.now() + 2500; bubble(P, P_LINE('ph.play.noFair'), { name: P.api.name, kind: 'taunt' }); } continue; }
      A.it = P; A.tags++; A.grace = 1.0; P.count = 3.05; P.counted = 0; A.tauntReady = true; sfx('hit'); G.w3d.fx.puff(P.S.x, P.S.y + 0.5, P.S.z, 6, 0.2);
      bubble(P, sayOf('ohNo'), { name: P.api.name });
      if (A.tauntHint && ['ph.play.cantCatch', 'ph.play.slow', 'ph.play.gotYou', 'ph.play.almost', 'ph.play.noFair'].some(taught)) { A.tauntHint = false; Promise.resolve().then(() => { if (ACTIVE === A && A.tauntReady && !PANEL) tauntBack(A); }); }
      break;
    }
    // the kids
    let tagged = null;
    for (const P of kids) {
      const S = P.S;
      if (P === A.it) {
        if (P.count > 0) {          // counting to three before giving chase (no tag-backs)
          P.count -= dt; S.speed = 0; S.pose = 'cover';
          const n = 3 - Math.ceil(P.count); if (n > P.counted && n >= 1 && n <= 3) { P.counted = n; bubble(P, { tl: numWord(n) + (n < 3 ? '…' : '!'), en: String(n) }, { name: P.api.name, kind: 'count', gloss: false }); }
          if (P.count <= 0) { A.tauntReady = false; bubble(P, sayOf('gonnaGet'), { name: P.api.name, kind: 'taunt' }); }
          continue;
        }
        // whom to chase: mostly you, sometimes the nearest kid
        if (A.retarget <= 0 || !A.target) { A.retarget = 3 + Math.random() * 2; const others = kids.filter(q => q !== P); const nearKid = others.sort((a, b) => Math.hypot(a.S.x - S.x, a.S.z - S.z) - Math.hypot(b.S.x - S.x, b.S.z - S.z))[0]; A.target = Math.random() < 0.7 || !nearKid ? 'you' : nearKid; }
        const T = A.target === 'you' ? { x: Y.x + Y.vx * 0.35, z: Y.z + Y.vz * 0.35, real: Y } : { x: A.target.S.x, z: A.target.S.z, real: A.target.S };
        const d = Math.hypot(T.real.x - S.x, T.real.z - S.z);
        P.stamina = clamp((P.stamina || 0) + dt * (d < 4.5 ? -1 : 0.6), -2.2, 1.6);
        const sp = d < 4.5 && P.stamina > 0 ? TAG.itSprint : TAG.itRun;
        P.ghostYou = A.target === 'you';
        steer(P, T.x, T.z, sp, dt, { ring: PLAZA.play, arrive: 0.05 });
        S.pose = 'run';
        if (d < TAG.reach && A.grace <= 0) tagged = A.target;
        if (A.target === 'you' && A.nextTaunt <= 0 && d < 6) { A.nextTaunt = 3.5 + Math.random() * 2; bubble(P, Math.random() < 0.5 ? sayOf('run') : sayOf('gonnaGet'), { name: P.api.name, kind: 'taunt' }); }
      } else {
        // run from whoever's it (and tease them when they're far)
        const it = A.it === 'you' ? { x: Y.x, z: Y.z } : { x: A.it.S.x, z: A.it.S.z };
        const d = Math.hypot(it.x - S.x, it.z - S.z);
        let tx, tz, sp;
        if (d < 6.5) {
          const ax = S.x - it.x, az = S.z - it.z, L = Math.hypot(ax, az) || 1;
          const side = ((P.id.charCodeAt(0) + Math.floor(t / 3)) % 2 ? 1 : -1), jk = d < 2.4 ? 0.9 : 0.35;      // (a juke when it's close)
          const fx = ax / L, fz = az / L, px = -fz * side, pz = fx * side;
          tx = S.x + (fx + px * jk) * 3; tz = S.z + (fz + pz * jk) * 3;
          // keep off the edge: pull back toward the middle when near it
          const rr = Math.hypot(S.x - PLAZA.x, S.z - PLAZA.z); if (rr > PLAZA.play - 2.2) { tx += (PLAZA.x - S.x) * 0.5; tz += (PLAZA.z - S.z) * 0.5; }
          P.stamina = clamp((P.stamina || 0) + dt * (d < 3 ? -1 : 0.7), -2, 1.6);
          sp = d < 3 && P.stamina > 0 ? TAG.kidSprint : TAG.kidRun;
          if (d < 2.2 && A.nextTaunt <= 0 && A.it === 'you') { A.nextTaunt = 2.2 + Math.random() * 1.6; bubble(P, Math.random() < 0.6 ? P_LINE('ph.play.almost') : P_LINE('ph.play.cantCatch'), { name: P.api.name, kind: 'taunt' }); }
        } else {
          // far: wander about, a little closer, cheeky
          if (!P.wander || (P.wanderT -= dt) <= 0) { P.wanderT = 2 + Math.random() * 2; const a = Math.random() * TAU, r = 4.5 + Math.random() * 5.5; P.wander = { x: PLAZA.x + Math.cos(a) * r, z: PLAZA.z + Math.sin(a) * r }; }
          tx = P.wander.x; tz = P.wander.z; sp = 2.4; P.stamina = Math.min(1.6, (P.stamina || 0) + dt);
          if (A.it === 'you' && A.nextTaunt <= 0 && d < 9) { A.nextTaunt = 3 + Math.random() * 2; const L2 = Math.random() < 0.5 ? P_LINE('ph.play.cantCatch') : lang() === 'de' ? sayOf('nyah') : sayOf('here'); bubble(P, L2, { name: P.api.name, kind: 'taunt' }); }
          if (A.it !== 'you' && A.it.id === 'beto' && A.nextTaunt <= 0 && d < 7) { A.nextTaunt = 3.5; bubble(P, { tl: (lang() === 'es' ? '¡' : '') + 'Beto, ' + phraseText('ph.play.slow').replace(/^¡/, '').replace(/^./, c => c.toLowerCase()), en: 'Beto, you’re so slow!', id: 'ph.play.slow' }, { name: P.api.name, kind: 'taunt' }); }
        }
        P.ghostYou = false;
        steer(P, tx, tz, sp, dt, { ring: PLAZA.play });
        S.pose = S.speed > 0.4 ? 'run' : 'stand';
        S.look = Math.atan2(it.x - S.x, it.z - S.z);
      }
    }
    if (tagged) {
      const from = A.it;
      if (tagged === 'you') { A.it = 'you'; A.grace = 1.3; A.noBack = from; A.noBackT = 4; sfx('hurt'); bubble(from, P_LINE('ph.play.youreIt'), { name: from.api.name, kind: 'taunt' }); G.w3d.fx.puff(Y.x, Y.ry + 0.5, Y.z, 6, 0.2); }
      else { A.it = tagged; A.grace = 1.0; tagged.count = 2.2; tagged.counted = 0; const L = P_LINE('ph.play.youreIt'); bubble(from, { tl: L.tl.replace(/!$/, ', ' + tagged.api.name + '!'), en: L.en, id: L.id }, { name: from.api.name, kind: 'taunt' }); }
      A.target = null;
    }
    hud(tagHud(A));
    if (A.t <= 0) A.resolve('time');
  }
  // the taunt-back: while the kid you tagged counts to three, throw one of their taunts at them (the game waits)
  async function tauntBack(A) {
    const P = A.it; if (!P || P === 'you' || !A.tauntReady || PANEL) return;
    const ids = ['ph.play.cantCatch', 'ph.play.slow', 'ph.play.gotYou', 'ph.play.almost', 'ph.play.noFair', 'ph.play.youreIt'].filter(taught);
    if (!ids.length) { toast('Win a game: the kids teach you their taunts!'); return; }
    const r = await sayPhrase(ids, { title: `Tease ${P.api.name} while ${P.def.f ? 'she' : 'he'} counts!`, f: P.def.f, toName: P.api.name, icon: 'taunt' });
    if (!r || ACTIVE !== A) return;
    A.taunts++; P.count += 1.2;        // (flustered: a little more time to run)
    bubble('you', { tl: r.form, en: PH[r.id].en }, { kind: 'you' });
    setTimeout(() => { if (ACTIVE === A) bubble(P, Math.random() < 0.5 ? P_LINE('ph.play.noFair') : sayOf('gonnaGet'), { name: P.api.name, kind: 'taunt' }); }, 600);
  }

  // ================================================================ hide and seek («las escondidas»): Sofi counts and seeks, then you count and find them
  async function playHide(host) {
    const Y = G.sim.you, sofi = kid('sofi'), kids = KIDS.map(K => kid(K.id)), l = lang();
    const A = ACTIVE = { kind: 'hide', phase: 'rules', kids, wins: 0, said: 0 };
    A.onKey = e => { if (e.code === 'Escape') { e.preventDefault(); A.quit = true; } if ((KEYS.map.interact || []).includes(e.code) && A.press) { e.preventDefault(); A.press(); } };
    // ---- round 1: you hide, Sofi seeks
    await speak(sofi, 'mg.hide.rules1');
    parkMimo(ringAt(PLAZA, 158, 10.6), PLAZA);
    kids.forEach(P => { P.mode = 'game'; P.S.pose = 'stand'; P.hidden = false; });
    const spots = shuffle(HIDE_SPOTS.slice());
    const kidSpots = { beto: spots[0], luci: spots[1] };
    A.phase = 'hide'; A.n = 0; A.tc = 0; A.hiddenAt = null; A.t = 0;
    hud(`🙈 ${esc(GAME_NAME.hide[l])} <small>Hide! Find a spot and press</small> <kbd>${esc(KEYS.keys('interact').split(' / ')[0])}</kbd>`);
    const res1 = await new Promise(resolve => { A.resolve = resolve; A.round = 1; A.sofi = sofi; A.kidSpots = kidSpots; A.found = new Set(); A.live = true; });
    A.live = false;
    unhide(A);
    if (res1 === 'quit') { endHide(A, kids); return 'quit'; }
    if (res1 === 'safe') { A.wins++; await speak(sofi, 'mg.hide.wow'); addCoins(1, 'a good hiding spot'); }
    else await wait(0.8);
    // ---- round 2: you count (type the numbers), they hide; then find them all and shout «¡Te encontré!»
    kids.forEach(P => { P.mode = 'game'; P.S.pose = 'stand'; P.hidden = false; P.foundOut = false; });
    await speak(sofi, 'mg.hide.rules2');
    const spots2 = shuffle(HIDE_SPOTS.filter(s => Math.hypot(s.x - Y.x, s.z - Y.z) > 3.5)).slice(0, 3);
    kids.forEach((P, i) => { P.hideSpot = spots2[i]; });
    A.phase = 'count2'; A.live = true; A.resolve = () => {};
    shot({ x: Y.x - Math.sin(Y.yaw) * 2, z: Y.z - Math.cos(Y.yaw) * 2 }, { x: PLAZA.x, z: PLAZA.z, y: 1.2 }, 2.4);
    const counted = await countBox();
    unshot();
    kids.forEach(P => { if (!P.hidden) { P.S.x = P.hideSpot.x; P.S.z = P.hideSpot.z; P.hidden = true; } P.S.pose = 'crouch'; P.S.yaw = Math.atan2(P.hideSpot.face.x - P.S.x, P.hideSpot.face.z - P.S.z); });
    if (counted === null) { endHide(A, kids); return 'quit'; }
    // «¡Listos o no, allá voy!»
    let shout = null;
    if (taught('ph.play.readyOrNot')) shout = await sayPhrase(['ph.play.readyOrNot'], { title: 'Now shout it, so they know you’re coming!', icon: 'hide' });
    else if (await learnPhrase('ph.play.readyOrNot', { title: 'Shout it, so they know you’re coming! Type it to learn it' })) shout = { form: phraseText('ph.play.readyOrNot'), id: 'ph.play.readyOrNot' };
    bubble('you', P_LINE('ph.play.readyOrNot'), { kind: 'you' });
    if (shout) star();
    A.phase = 'seek'; A.t = 60; A.foundN = 0; A.giggle = 3;
    const res2 = await new Promise(resolve => { A.resolve = resolve; });
    A.live = false; promptAt(null); hud(null);
    if (res2 === 'quit') { endHide(A, kids); return 'quit'; }
    if (res2 === 'all') { A.wins++; addCoins(1, 'found everyone'); await speak(sofi, 'mg.hide.allFound'); }
    else { kids.forEach(P => { if (P.hidden) { P.hidden = false; P.S.pose = 'cheer'; } }); await speak(sofi, 'mg.hide.notAll'); }
    result('hide', A.wins >= 1 ? 'w' : 'l');
    return endHide(A, kids, true);
  }
  function endHide(A, kids) {
    ACTIVE = null; hud(null); promptAt(null); unhide(A);
    kids.forEach(P => { P.mode = 'walkHome'; P.hidden = false; P.S.pose = 'walk'; });
    G.sim.mimoGo(null, null);
  }
  function unhide(A) {
    if (!A.hiddenAt) return;
    A.hiddenAt = null; G.sim.lock = Math.max(0, G.sim.lock - 1);
    if (G.cast && G.cast.hero) G.cast.hero.root.scale.set(1, 1, 1);
  }
  // your count to ten: type the numbers in the language (one at a time, or all in a row)
  function countBox() {
    const l = lang(); let n = 0;
    const boxes = () => `<div class="boxes">${Array.from({ length: 10 }, (_, i) => `<i class="${i < n ? 'on' : ''}">${i < n ? esc(numWord(i + 1)) : i + 1}</i>`).join('')}</div>`;
    const okNum = (k, w) => { const id = 'n.' + k; if (typeof LEX !== 'undefined' && LEX.item(id)) return LEX.check(id, w).ok; return nrm(w) === nrm(NUMS[l][k - 1]); };
    // zh / ja: count however it's typed (一二三, いち に さん, yi er san, ichi ni san): each next number is read off the front
    const countCJ = (text, B) => {
      let rest = canonCJ(text, l), ok = 0; const said = [];
      while (rest && n < 10) {
        const k = n + 1, forms = [NUMS[l][k - 1]].concat((NUM_ALT[l] || {})[k] || []).map(f => canonCJ(f, l)).filter(Boolean).sort((a, b) => b.length - a.length);
        const f = forms.find(x => rest.startsWith(x)); if (!f) break;
        rest = rest.slice(f.length); n++; ok++; said.push(numWord(k));
        if (typeof LEX !== 'undefined' && LEX.item('n.' + n)) LEX.attempt('n.' + n, { ok: true, hints: B.helped ? 1 : 0, ms: 2500, mode: 'talk' });
      }
      $q(UIR.panel, '.pbody').innerHTML = boxes();
      if (ok) { sfx('pip'); bubble('you', { tl: said.join(l === 'zh' ? ' ， ' : ' 、 ') + ' …', en: '' }, { kind: 'you', sound: false }); }
      if (n >= 10) { star(); return { done: true }; }
      if (!ok) return { hint: `Next comes ${n + 1}: <span class="tl">${B.helped ? esc(numWord(n + 1)) : '?'}</span>` };
      B.hint('Keep going!'); return { shake: false };
    };
    return askBox({ icon: 'hide', title: 'Eyes closed! Count to ten, out loud: type the numbers', body: boxes(), placeholder: plainTL(numWord(1)) + (l === 'zh' || l === 'ja' ? ' ' : ', ') + plainTL(numWord(2)) + '…', hint: 'One at a time, or several at once. (? shows the next one)',
      help: () => `Next: <span class="tl">${esc(numWord(n + 1))}</span>`,
      check: (text, B) => {
        if (l === 'zh' || l === 'ja') return countCJ(text, B);
        const ws = nrm(text).split(' ').filter(Boolean);
        let ok = 0;
        for (const w of ws) { if (n >= 10) break; if (okNum(n + 1, w)) { n++; ok++; if (typeof LEX !== 'undefined' && LEX.item('n.' + n)) LEX.attempt('n.' + n, { ok: true, hints: B.helped ? 1 : 0, ms: 2500, mode: 'talk' }); } else break; }
        $q(UIR.panel, '.pbody').innerHTML = boxes();
        if (ok) { sfx('pip'); bubble('you', { tl: ws.slice(0, ok).join(', ') + '…', en: '' }, { kind: 'you', sound: false }); }
        if (n >= 10) { star(); return { done: true }; }
        if (!ok) return { hint: `Next comes ${n + 1}: <span class="tl">${B.helped ? esc(numWord(n + 1)) : '?'}</span>` };
        B.hint('Keep going!'); return { shake: false };
      } });
  }
  function hideTick(A, dt, t) {
    if (!A.live) return;
    if (A.quit) { A.resolve('quit'); return; }
    const Y = G.sim.you, l = lang();
    if (A.phase === 'count2') {             // (your eyes are closed: the kids run off and hide)
      for (const P of A.kids) {
        if (P.hidden) continue;
        P.ghostYou = true;
        const d = steer(P, P.hideSpot.x, P.hideSpot.z, 3.6, dt, { arrive: 0.2 });
        P.S.pose = 'run';
        if (d < 0.25) { P.hidden = true; P.S.pose = 'crouch'; P.S.yaw = Math.atan2(P.hideSpot.face.x - P.S.x, P.hideSpot.face.z - P.S.z); }
      }
      return;
    }
    if (paused()) return;
    if (A.phase === 'hide') {
      A.t += dt;
      // Sofi walks to the fountain, covers her eyes and counts; Beto and Luci run off to hide too
      const sofi = A.sofi, S = sofi.S;
      if (!A.atCount) { const d = steer(sofi, COUNT_AT.x, COUNT_AT.z, 3.2, dt, { arrive: 0.2 }); S.pose = 'run'; if (d < 0.25) { A.atCount = true; S.yaw = Math.atan2(COUNT_AT.face.x - S.x, COUNT_AT.face.z - S.z); } }
      else {
        S.pose = 'cover'; S.speed = 0;
        A.tc += dt;
        const n = Math.floor(A.tc / 1.15) + 1;
        if (n > A.n && n <= 10) { A.n = n; bubble(sofi, { tl: numWord(n) + (n < 10 ? '…' : '!'), en: String(n) }, { name: sofi.api.name, kind: 'count', gloss: n === 1 }); }
        if (A.tc > 11.6) { A.phase = 'search'; bubble(sofi, P_LINE('ph.play.readyOrNot'), { name: sofi.api.name, kind: 'taunt', gloss: true }); A.order = searchOrder(A); A.si = 0; A.pause = 1.2; promptAt(null);
          if (!A.hiddenAt) { A.seen = true; } }
      }
      for (const id of ['beto', 'luci']) {
        const P = kid(id), sp = A.kidSpots[id];
        if (P.hidden) continue;
        P.ghostYou = false;
        const d = steer(P, sp.x, sp.z, 3.4, dt, { arrive: 0.2 }); P.S.pose = 'run';
        if (d < 0.25) { P.hidden = true; P.S.pose = 'crouch'; P.S.yaw = Math.atan2(sp.face.x - P.S.x, sp.face.z - P.S.z); }
      }
      // your hiding spot: E there to crouch behind it (and E again to get up)
      const sp = nearestSpot(Y.x, Y.z, 1.5, [A.kidSpots.beto, A.kidSpots.luci]);
      if (A.hiddenAt) { promptAt({ ...A.hiddenAt, y: W3.gy(A.hiddenAt.x, A.hiddenAt.z), label: 'Come out' }); A.press = () => unhide(A); }
      else if (sp) { promptAt({ ...sp, y: W3.gy(sp.x, sp.z), label: 'Hide here' }); A.press = () => hideAt(A, sp); }
      else { promptAt(null); A.press = null; }
      hud(`🙈 ${esc(GAME_NAME.hide[l])} · <span class="time">${Math.max(0, 10 - (A.n || 0))}</span> <small>${A.hiddenAt ? 'Shh… you’re hidden.' : 'Hide before Sofi gets to ten!'}</small>`);
      return;
    }
    if (A.phase === 'search') {
      const sofi = A.sofi, S = sofi.S;
      if (A.seen) {                  // you didn't hide: she sees you at once
        A.seen = false; A.phase = 'over';
        bubble(sofi, P_LINE('ph.play.iSeeYou'), { name: sofi.api.name, kind: 'taunt', gloss: true }); S.pose = 'cheer';
        A.resolve('seen'); return;
      }
      if (A.pause > 0) { A.pause -= dt; S.speed = 0; S.pose = 'stand'; return; }
      const spot = A.order[A.si];
      if (!spot || A.si >= 5) {
        A.phase = 'over'; bubble(sofi, sayOf('giveUpWhere'), { name: sofi.api.name, kind: 'taunt' }); S.pose = 'shrug';
        A.resolve('safe'); return;
      }
      sofi.ghostYou = true;
      const d = steer(sofi, spot.x + (spot.face.x - spot.x) * -0.45, spot.z + (spot.face.z - spot.z) * -0.45, 2.6, dt, { arrive: 0.6 });
      S.pose = 'walk';
      if (d < 0.65) {
        const who = spot === A.hiddenAt ? 'you' : ['beto', 'luci'].find(id => A.kidSpots[id] === spot && !A.found.has(id));
        if (who === 'you') { A.phase = 'over'; bubble(sofi, P_LINE('ph.play.found'), { name: sofi.api.name, kind: 'taunt', gloss: true }); S.pose = 'cheer'; sfx('shout'); A.resolve('found'); return; }
        if (who) { A.found.add(who); const P = kid(who); P.hidden = false; P.S.pose = 'cheer'; bubble(sofi, { tl: phraseText('ph.play.found').replace(/!$/, ', ' + P.api.name + '!'), en: 'Found you, ' + P.api.name + '!', id: 'ph.play.found' }, { name: sofi.api.name, kind: 'taunt' }); }
        else bubble(sofi, Math.random() < 0.5 ? sayOf('hmmHere') : sayOf('notHere'), { name: sofi.api.name });
        A.si++; A.pause = 1.1;
      }
      hud(`🙈 ${esc(GAME_NAME.hide[l])} <small>${esc(phraseText('ph.play.whereAreYou'))} · Sofi is looking…</small>`);
      return;
    }
    if (A.phase === 'seek') {
      A.t -= dt; A.giggle -= dt;
      const hidden = A.kids.filter(P => P.hidden);
      if (!hidden.length) { A.phase = 'over'; A.resolve('all'); return; }
      if (A.t <= 0) { A.phase = 'over'; A.resolve('time'); return; }
      let near = null, nd = 99;
      for (const P of hidden) { const d = Math.hypot(P.S.x - Y.x, P.S.z - Y.z); if (d < nd) { nd = d; near = P; } }
      if (near && nd < 4.5 && A.giggle <= 0) { A.giggle = 3 + Math.random() * 3; bubble(near, sayOf('giggle'), { name: '?', gloss: false }); }
      if (near && nd < 2.1) { promptAt({ x: near.S.x, y: W3.gy(near.S.x, near.S.z), z: near.S.z, label: 'Found you!' }); A.press = () => foundKid(A, near); }
      else { promptAt(null); A.press = null; }
      const s = Math.ceil(A.t);
      hud(`🔎 ${esc(GAME_NAME.hide[l])} <span class="time">${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</span> <small>found ${A.kids.length - hidden.length}/${A.kids.length}</small>`);
    }
  }
  function nearestSpot(x, z, r, skip = []) { let best = null, bd = r; for (const s of HIDE_SPOTS) { if (skip.includes(s)) continue; const d = Math.hypot(s.x - x, s.z - z); if (d < bd) { bd = d; best = s; } } return best; }
  function hideAt(A, sp) {
    const Y = G.sim.you; if (A.hiddenAt) return;
    A.hiddenAt = sp; Y.x = sp.x; Y.z = sp.z; Y.yaw = Math.atan2(sp.face.x - sp.x, sp.face.z - sp.z); Y.vx = Y.vz = 0; G.sim.snap();
    G.sim.lock = (G.sim.lock || 0) + 1;
    if (G.cast && G.cast.hero) G.cast.hero.root.scale.set(1, 0.68, 1);
    sfx('pip'); bubble('you', { tl: 'Shh…', en: '' }, { kind: 'you', sound: false });
  }
  // the seeker checks spots nearest first (with a little luck), and the ones where Beto and Luci hide are on the way
  function searchOrder(A) {
    const from = COUNT_AT, list = HIDE_SPOTS.map(s => ({ s, d: Math.hypot(s.x - from.x, s.z - from.z) + Math.random() * 6 }));
    list.sort((a, b) => a.d - b.d);
    return list.map(o => o.s);
  }
  async function foundKid(A, P) {
    if (A.busyFound || !P.hidden) return;
    A.busyFound = true; A.press = null; promptAt(null);
    let r;
    if (taught('ph.play.found')) r = await sayPhrase(['ph.play.found'], { title: `There’s ${P.api.name}! Shout it:`, icon: 'hide', escLabel: 'Later (Esc)' });
    else r = (await learnPhrase('ph.play.found', { title: `There’s ${P.api.name}! Shout it (type it to learn it):` })) ? { form: phraseText('ph.play.found') } : null;
    A.busyFound = false;
    if (!r || ACTIVE !== A) return;
    bubble('you', P_LINE('ph.play.found'), { kind: 'you' });
    P.hidden = false; P.S.pose = 'cheer'; sfx('chest'); star();
    setTimeout(() => { if (ACTIVE === A) bubble(P, sayOf('youFoundMe'), { name: P.api.name }); }, 500);
  }

  // ================================================================ tic-tac-toe («el gato»), chalked on the cobbles: say where your X goes
  async function playTTT(host) {
    const l = lang(), M = { you: 0, kid: 0, round: 0, typed: 0 }, Y = G.sim.you;
    const stand = { x: CHALK.x - 1.35, z: CHALK.z + 0.55 };
    Y.x = stand.x; Y.z = stand.z; Y.yaw = Math.atan2(CHALK.x - stand.x, CHALK.z - stand.z); G.sim.snap();
    shot({ x: CHALK.x - 3.2, z: CHALK.z + 2.6 }, { x: CHALK.x, z: CHALK.z, y: 0.3 }, 2.9);
    parkMimo({ x: CHALK.x - 0.6, z: CHALK.z + 1.5 }, CHALK);
    await speak(host, 'mg.ttt.rules', { ex1: CELL_NAME[l][0], ex2: CELL_NAME[l][4] });
    let board = Array(9).fill(null), cursor = 4, hover = -1, turn = 'X', over = null, mover = null, quit = false;
    CUR = { kind: 'ttt', get board() { return board; }, get yourTurn() { return !!mover; }, M };
    const cellAt = (u, v) => { const m = 0.12, s = (1 - 2 * m) / 3; if (u < m || v < m || u > 1 - m || v > 1 - m) return -1; return Math.floor((v - m) / s) * 3 + Math.floor((u - m) / s); };
    const draw = (c, w, h) => drawTTT(c, w, h, board, { cursor, hover, over, l });
    const refresh = () => { boardDraw(); boardChips(`<span class="mg-chip">You ${M.you}</span><span class="mg-chip">${esc(host.api.name)} ${M.kid}</span><span class="mg-chip gold">★ ${M.typed}</span>`); };
    const under = cell => (cell >= 0 ? `<b>${esc(CELL_NAME[l][cell])}</b> <span style="opacity:.6">(${esc(CELL_NAME.en[cell])})</span>` : 'Hover a square to hear what it’s called');
    const place = (cell, how) => {
      if (turn !== 'X' || over || !mover) return;
      if (board[cell]) { boardSay(sayOf('taken')); boardShake(); return; }
      if (how === 'phrase') { M.typed++; star(); boardSay(sayOf('wellSaid')); }
      const r = mover; mover = null; r(cell);
    };
    boardOpen({ who: { name: host.api.name, sub: `${GAME_NAME.ttt[l]} · ${GAME_NAME.ttt.en} · best of three`, icon: 'chalk' }, size: [330, 330], draw,
      placeholder: CELL_NAME[l][0] + '…', under: under(-1), hint: `Say where: <span class="tl">${esc(CELL_NAME[l][0])}</span>, <span class="tl">${esc(CELL_NAME[l][4])}</span>… (or click; typing earns ★)`,
      buttons: [['help', 'All the squares (?)'], ['quit', 'Stop (Esc)']],
      onSubmit: text => {
        const p = parseCell(text, l);
        if (p.how === 'en') { boardSay(sayOf('inLang')); boardShake(); return; }
        if (p.cell < 0) { boardSay(sayOf('tttHuh')); boardShake(); return; }
        if (p.how === 'phrase' && typeof LEX !== 'undefined') (p.used || []).forEach(id => { if (LEX.item(id)) LEX.attempt(id, { ok: true, ms: 3000, mode: 'talk' }); });
        place(p.cell, p.how);
      },
      onClick: (u, v) => { const c = cellAt(u, v); if (c >= 0) { cursor = c; ui().under.innerHTML = under(c); place(c, 'click'); } },
      onHover: (u, v) => { const c = cellAt(u, v); if (c !== hover) { hover = c; ui().under.innerHTML = under(c); boardDraw(); } },
      onArrow: (dx, dy) => { const r = Math.floor(cursor / 3), c = cursor % 3; cursor = clamp(r + dy, 0, 2) * 3 + clamp(c + dx, 0, 2); ui().under.innerHTML = under(cursor); boardDraw(); },
      onPick: () => place(cursor, 'key'),
      onHelp: () => { boardList(`<table>${[0, 1, 2].map(r => `<tr>${[0, 1, 2].map(c => `<td class="w">${esc(CELL_NAME[l][r * 3 + c])}</td>`).join('')}</tr>`).join('')}</table>`); },
      onButton: a => { if (a === 'help') BOARD.onHelp(); if (a === 'quit') BOARD.onEsc(); },
      onEsc: () => { quit = true; if (mover) { const r = mover; mover = null; r(-1); } } });
    refresh();
    while (!quit && M.you < 2 && M.kid < 2 && M.round < 3) {
      board = Array(9).fill(null); over = null; turn = M.round % 2 ? 'O' : 'X'; refresh();
      boardStatus(turn === 'X' ? 'Your move: say where your X goes' : `${host.api.name} starts this round`);
      if (turn === 'X') boardSay(P_LINE('ph.play.yourTurn'));
      while (!over && !quit) {
        if (turn === 'X') {
          const cell = await new Promise(r => { mover = r; });
          if (cell < 0) { quit = true; break; }
          board[cell] = 'X'; sfx('chug'); refresh();
        } else {
          boardStatus(`${host.api.name} is thinking…`);
          await wait(0.55 + Math.random() * 0.5);
          const cell = TTT.kidMove(board, 'O');
          board[cell] = 'O'; sfx('chug');
          const threat = TTT.empty(board).some(i => TTT.wins(board, i, 'O'));
          if (threat && Math.random() < 0.6) boardSay(sayOf('uhoh')); else if (Math.random() < 0.35) boardSay(sayOf('myTurn'));
          refresh();
        }
        const w = TTT.winner(board);
        if (w) over = w; else { turn = turn === 'X' ? 'O' : 'X'; if (turn === 'X') boardStatus('Your move'); }
      }
      if (quit) break;
      refresh();
      if (over.who === 'X') { M.you++; boardSay({ ...P_LINE('ph.play.noFair'), tl: sayOf('tttYouWin').tl, en: sayOf('tttYouWin').en }); sfx('perfect'); boardStatus('You win this round!'); }
      else if (over.who === 'O') { M.kid++; boardSay(sayOf('tttKidWins')); sfx('lose'); boardStatus(`${host.api.name} wins this round`); }
      else { boardSay(P_LINE('ph.play.draw')); boardStatus('A tie'); }
      M.round++; refresh();
      S().chalk = board.slice();
      await wait(1.6);
    }
    boardClose(); unshot(); G.sim.mimoGo(null, null); CUR = null;
    if (quit) return 'quit';
    const youWon = M.you > M.kid;
    result('ttt', youWon ? 'w' : M.you === M.kid ? 'd' : 'l');
    if (youWon) { addCoins(2, 'tic-tac-toe'); bubble(host, sayOf('matchYouWin'), { name: host.api.name }); host.S.pose = 'sulk'; }
    else if (M.kid > M.you) { bubble(host, sayOf('matchKidWins'), { name: host.api.name }); host.S.pose = 'cheer'; }
    else bubble(host, P_LINE('ph.play.draw'), { name: host.api.name });
    await wait(1.4); host.S.pose = host.home.pose;
  }
  // the chalk board: slate-gray cobbles, chalk lines, yellow X, pink O
  function drawTTT(c, w, h, board, o) {
    const R = rng(11);
    c.fillStyle = '#5f6672'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const x = R() * w, y = R() * h, r = 14 + R() * 18; c.fillStyle = R() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)'; c.beginPath(); c.ellipse(x, y, r, r * 0.8, R() * 3, 0, TAU); c.fill(); }
    const m = w * 0.12, s = (w - 2 * m) / 3, CR = rng(5);
    for (const [i, on] of [[o.hover, 'rgba(255,255,255,0.14)'], [o.cursor, 'rgba(33,164,147,0.25)']]) if (i >= 0 && !o.over) { c.fillStyle = on; c.fillRect(m + s * (i % 3) + 4, m + s * Math.floor(i / 3) + 4, s - 8, s - 8); }
    if (o.cursor >= 0 && !o.over) { c.setLineDash([6, 6]); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; c.strokeRect(m + s * (o.cursor % 3) + 6, m + s * Math.floor(o.cursor / 3) + 6, s - 12, s - 12); c.setLineDash([]); }
    for (let i = 1; i < 3; i++) { chalkLine(c, m + s * i, m - 4, m + s * i, h - m + 4, CHALK_COL.grid, 6, CR); chalkLine(c, m - 4, m + s * i, w - m + 4, m + s * i, CHALK_COL.grid, 6, CR); }
    board.forEach((v, i) => { const x = m + s * (i % 3 + 0.5), y = m + s * (Math.floor(i / 3) + 0.5); if (v === 'X') chalkX(c, x, y, s * 0.27, CHALK_COL.x, CR); else if (v === 'O') chalkO(c, x, y, s * 0.29, CHALK_COL.o, CR); });
    if (o.over && o.over.line) { const [a, , b] = o.over.line, p = i => [m + s * (i % 3 + 0.5), m + s * (Math.floor(i / 3) + 0.5)]; const [x1, y1] = p(a), [x2, y2] = p(b); chalkLine(c, x1, y1, x2, y2, '#ffffff', 9, CR); }
    c.fillStyle = 'rgba(253,251,245,0.75)'; c.font = '800 15px "Segoe Print", "Ink Free", sans-serif'; c.textAlign = 'center'; c.fillText(plainTL(TTT_TITLE[o.l] || ''), w / 2, m * 0.62);
  }

  // ================================================================ rock, paper, scissors: type your pick
  async function playRPS(host) {
    const l = lang(), M = { you: 0, kid: 0, hist: [] }, Y = G.sim.you;
    const stand = { x: host.S.x + Math.sin(host.S.yaw) * 1.6, z: host.S.z + Math.cos(host.S.yaw) * 1.6 };
    Y.x = stand.x; Y.z = stand.z; Y.yaw = Math.atan2(host.S.x - stand.x, host.S.z - stand.z); G.sim.snap();
    shot({ x: (stand.x + host.S.x) / 2 + Math.cos(host.S.yaw) * 3, z: (stand.z + host.S.z) / 2 - Math.sin(host.S.yaw) * 3 }, { x: (stand.x + host.S.x) / 2, z: (stand.z + host.S.z) / 2, y: 1.1 }, 1.8);
    await speak(host, 'mg.rps.rules');
    let show = { you: null, kid: null, r: 0 }, quit = false, mover = null;
    CUR = { kind: 'rps', M, get show() { return show; }, get yourTurn() { return !!mover; } };
    const draw = (c, w, h) => drawRPS(c, w, h, show, host.api.name);
    const refresh = () => { boardDraw(); boardChips(`<span class="mg-chip">You ${M.you}</span><span class="mg-chip">${esc(host.api.name)} ${M.kid}</span>`); };
    // (zh / ja play it their way: 石头 · 剪刀 · 布 and グー · チョキ · パー)
    const words = l === 'zh' ? ['[石头|shí tou]', '[布|bù]', '[剪刀|jiǎn dāo]'] : l === 'ja' ? ['グー', 'パー', 'チョキ'] : ['w.stone', 'w.paper', 'w.scissors'].map(id => (typeof LEX !== 'undefined' && LEX.item(id) ? LEX.item(id)[l] : id));
    boardOpen({ who: { name: host.api.name, sub: `${GAME_NAME.rps[l]} · first to three`, icon: 'scissors' }, size: [400, 250], draw,
      placeholder: words.join(' · ') + '…', hint: `Type <span class="tl">${esc(words[0])}</span>, <span class="tl">${esc(words[1])}</span> or <span class="tl">${esc(words[2])}</span>`,
      under: 'Kids aren’t random. Watch what she throws after she wins… or loses.',
      buttons: [['help', 'The words (?)'], ['quit', 'Stop (Esc)']],
      onSubmit: text => {
        if (!mover) return;
        const p = parseThrow(text, l);
        if (!p) { boardSay(sayOf('rpsHuh')); boardShake(); return; }
        if (p.en) { boardSay(sayOf('inLang')); boardShake(); return; }
        if (p.many) { boardSay(sayOf('rpsHuh')); boardShake(); return; }
        const r = mover; mover = null; r(p);
      },
      onHelp: () => boardList(['w.stone', 'w.paper', 'w.scissors'].map((id, i) => `<div><span class="w">${esc(l === 'zh' || l === 'ja' ? words[i] : LEX.form(id, { article: true }))}</span> · ${esc((LEX.item(id) || {}).en || '')}</div>`).join('') + `<div style="margin-top:4px;opacity:.75">${esc(SAY.beats.stone[l])}<br>${esc(SAY.beats.scissors[l])}<br>${esc(SAY.beats.paper[l])}</div>`),
      onButton: a => { if (a === 'help') BOARD.onHelp(); if (a === 'quit') BOARD.onEsc(); },
      onEsc: () => { quit = true; if (mover) { const r = mover; mover = null; r(null); } } });
    refresh();
    while (!quit && M.you < 3 && M.kid < 3) {
      show = { you: null, kid: null, r: 0 }; refresh();
      boardSay(sayOf('chant')); boardStatus('Type your pick!');
      const p = await new Promise(r => { mover = r; });
      if (!p || quit) break;
      const k = RPS.kidThrow(M.hist), res = RPS.result(p.pick, k);
      M.hist.push({ you: p.pick, kid: k, r: -res });       // (r: from the kid's side)
      if (typeof LEX !== 'undefined') { const first = !LEX.taught(p.id); LEX.attempt(p.id, { ok: true, ms: 2500, mode: 'talk' }); if (first) { G.sim.emit('learned', { id: p.id }); toast(`${G.state.mimoName} learned «${LEX.form(p.id)}»`); } }
      show = { you: p.pick, kid: k, r: res }; refresh(); sfx('swoosh');
      await wait(0.5);
      if (!res) boardSay(sayOf('same'));
      else {
        const why = SAY.beats[res > 0 ? p.pick : k];
        if (res > 0) { M.you++; boardSay({ tl: why[l] + ' ' + sayOf('youPoint').tl, en: why.en + ' ' + sayOf('youPoint').en }); sfx('pip'); }
        else { M.kid++; boardSay({ tl: why[l] + ' ' + sayOf('kidPoint').tl, en: why.en + ' ' + sayOf('kidPoint').en }); sfx('click'); }
      }
      refresh(); boardStatus(res > 0 ? 'Point to you!' : res < 0 ? `Point to ${host.api.name}` : 'A tie: again!');
      await wait(1.5);
    }
    boardClose(); unshot(); CUR = null;
    if (quit) return 'quit';
    const won = M.you > M.kid;
    result('rps', won ? 'w' : 'l');
    if (won) { addCoins(2, 'rock, paper, scissors'); bubble(host, P_LINE('ph.play.noFair'), { name: host.api.name, kind: 'taunt' }); host.S.pose = 'sulk'; }
    else { bubble(host, P_LINE('ph.play.iWon'), { name: host.api.name, kind: 'taunt' }); host.S.pose = 'cheer'; }
    await wait(1.4); host.S.pose = host.home.pose;
  }
  const RPS_ICON = { stone: 'stone', paper: 'paper', scissors: 'scissors' };
  const iconCache = {};
  function iconCv(key, size = 128) { const k = key + size; if (!iconCache[k]) { const cv = document.createElement('canvas'); cv.width = cv.height = size; if (typeof ICONS !== 'undefined') ICONS.draw(cv, key); iconCache[k] = cv; } return iconCache[k]; }
  function drawRPS(c, w, h, show, kidName) {
    c.fillStyle = '#f6edd9'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(43,34,53,0.25)'; c.setLineDash([6, 6]); c.lineWidth = 2; c.beginPath(); c.moveTo(w / 2, 20); c.lineTo(w / 2, h - 20); c.stroke(); c.setLineDash([]);
    const slot = (x, label, pick, win) => {
      c.fillStyle = win > 0 ? '#e9fbf8' : win < 0 ? '#fde3df' : '#fffaf0'; c.strokeStyle = '#2b2235'; c.lineWidth = 3;
      c.beginPath(); c.roundRect ? c.roundRect(x - 80, 40, 160, 160, 18) : c.rect(x - 80, 40, 160, 160); c.fill(); c.stroke();
      if (pick) c.drawImage(iconCv(RPS_ICON[pick]), x - 64, 56, 128, 128);
      else { c.fillStyle = 'rgba(43,34,53,0.35)'; c.font = '900 64px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', x, 120); }
      c.fillStyle = '#2b2235'; c.font = '800 16px "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(label, x, 228);
    };
    slot(w * 0.25, 'You', show.you, show.r); slot(w * 0.75, kidName, show.kid, -show.r);
    c.fillStyle = '#c2412f'; c.font = '900 26px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('VS', w / 2, 120);
  }

  // ================================================================ the hustlers' tables: chess with Don Aurelio, checkers with Doña Reme
  let CUR = null;                                     // the board game being played (for tests): { kind, pos, st }
  const BET_LABEL = {
    es: [['¡Sí, por cinco monedas!', 5], ['¡Por diez monedas!', 10], ['Solo por diversión.', 0]],
    pt: [['Sim, por cinco moedas!', 5], ['Por dez moedas!', 10], ['Só por diversão.', 0]],
    de: [['Ja, um fünf Münzen!', 5], ['Um zehn Münzen!', 10], ['Nur zum Spaß.', 0]],
    zh: [['[好|hǎo] ， [五|wǔ] [枚|méi] [金币|jīn bì] ！', 5], ['[十|shí] [枚|méi] [金币|jīn bì] ！', 10], ['[只是|zhǐ shì] [玩玩|wán wan] 。', 0]],
    ja: [['はい 、 コイン [五枚|ごまい] で ！', 5], ['コイン [十枚|じゅうまい] で ！', 10], ['[遊|あそ]び で お[願|ねが]い します 。', 0]],
  };
  async function oldTalk(P) {
    const s = S(), id = P.id;
    P.api.talking = true;
    try {
      if (id === 'tino') return await tinoTalk(P);
      const pre = id === 'aurelio' ? 'mg.aur' : 'mg.reme';
      if (!s.met[id]) { await speak(P, pre + '.hi'); s.met[id] = true; G.save(); } else await speak(P, pre + '.again');
      const coins = G.state.coins || 0;
      await speak(P, coins >= 5 ? pre + '.hustle' : 'mg.old.broke');
      if (coins >= 5 && typeof LEX !== 'undefined') LEX.expose('ph.table.aGame');
      const l = lang(), opts = (BET_LABEL[l] || BET_LABEL.es).filter(([, v]) => v <= coins).map(([label, v]) => ({ label: `«${plainTL(label)}»`, sub: v ? `Bet ${v} coins: win ${v} or lose ${v} (you have ${coins})` : 'Just for fun: no coins', value: v }));
      const R = rec(P.def.game);
      if (R.p) opts.push({ label: 'Our record', sub: `You ${R.w}–${R.d}–${R.l} (wins–draws–losses)`, value: 'rec' });
      const v = await UI.choose(`${P.api.name}: «${plainTL(lineOf(coins >= 5 ? pre + '.hustle' : 'mg.old.broke').text)}»`, opts);      // (zh / ja: the mode's plain text, not the notation)
      if (v === null) { const L = lineOf('mg.old.bye'); bubble(P, { tl: L.text, en: UI.weavePlain(L.en, { english: true }) }, { name: P.api.name }); return; }
      if (v === 'rec') { await showRecords(); return; }
      if (P.def.game === 'checkers' && !s.met.remeRules) { await speak(P, 'mg.reme.rules'); s.met.remeRules = true; }
      if (P.def.game === 'chess') await playChess(P, v); else await playCheckers(P, v);
    } finally { P.api.talking = false; }
  }
  async function tinoTalk(P) {
    const s = S(), l = lang();
    await speak(P, 'mg.tino.hi');
    if (!s.met.tinoTip) { await speak(P, 'mg.tino.tip', { ex: announceOf({ p: 'N', to: CHESS.sqOf('f3') }, l) }); s.met.tinoTip = true; G.save(); }
    await reviewDue(P, GAME_PHRASES.table);
    const next = GAME_PHRASES.table.find(id => !taught(id));
    const opts = [];
    if (next) opts.push({ label: 'Teach me how they talk', sub: 'Learn a phrase from the board', value: 'teach' });
    opts.push({ label: 'The scores', sub: 'Who beat whom', value: 'rec' });
    const v = await UI.choose(`${P.api.name}: “Want to sound like an old pro at the board?”`, opts);
    if (v === 'teach') await learnPhrase(next, { title: `${P.api.name} teaches you how they talk at the board. Type it to learn it!` });
    if (v === 'rec') await showRecords();
  }
  // the bet: settled at the end (a draw gives it back)
  function settle(game, P, r, bet) {
    result(game, r);
    if (!bet) return;
    const s = S();
    if (r === 'w') { s.coinsWon += bet; addCoins(bet, `${P.api.name} pays up`); }
    else if (r === 'l') { s.coinsLost += bet; addCoins(-bet, `you pay ${P.api.name}`); }
  }
  function tableShot(T3) { const T = T3.T, b = { x: T.x + T.fx * 2.6 + Math.cos(T.yaw) * 1.4, z: T.z + T.fz * 2.6 - Math.sin(T.yaw) * 1.4 }; shot(b, { x: T.x, z: T.z, y: 0.9 }, 2.1); }
  function standAt(T3) { const Y = G.sim.you; Y.x = T3.stand.x; Y.z = T3.stand.z; Y.yaw = T3.T.yaw + Math.PI; Y.vx = Y.vz = 0; G.sim.snap(); parkMimo({ x: T3.T.x + Math.cos(T3.T.yaw) * 1.3 + T3.T.fx * 0.9, z: T3.T.z - Math.sin(T3.T.yaw) * 1.3 + T3.T.fz * 0.9 }, T3.T); }
  // wait for the player to close the finished board (Enter, Esc, the Done button)
  const finalWait = () => new Promise(r => { ui().btns.innerHTML = '<button type="button" data-act="done" class="main">Done (Enter)</button>'; Object.assign(BOARD, { onButton: a => { if (a === 'done') r(); }, onEsc: r, onPick: r, onSubmit: () => r(), onClick: null, onArrow: null }); });
  const say3 = (key, vars) => sayOf(key, vars);

  // ---------------- chess
  async function playChess(P, bet) {
    const l = lang(), T3 = W3.T3.chess;
    standAt(T3); tableShot(T3); P.playing = true; P.S.pose = 'sit';
    const pos = CHESS.fromFEN(CHESS.START);
    const st = { sel: -1, cursor: CHESS.sqOf('e2'), hover: -1, last: null, said: 0, list: [], over: null, mover: null, promo: null, armed: 0, targets: [] };
    CUR = { kind: 'chess', pos, st };
    const legalNow = () => CHESS.legal(pos);
    const refresh = () => { boardDraw(); boardChips(`<span class="mg-chip ${bet ? 'gold' : ''}">${bet ? '🪙 ' + bet : 'for fun'}</span><span class="mg-chip">★ ${st.said}</span>`); boardList(moveListHTML(st.list)); };
    const pickSquare = sq => {
      if (!st.mover || st.promo) return;
      const lm = legalNow();
      if (st.amb) { const a = st.amb.find(m => m.from === sq); st.amb = null; boardHint(''); if (a) { finishMove([a], true); return; } }
      if (st.sel >= 0) {
        const ms = lm.filter(m => m.from === st.sel && m.to === sq);
        if (ms.length) { finishMove(ms, false); return; }
      }
      const p = pos.b[sq];
      if (p && CHESS.colorOf(p) === 'w' && lm.some(m => m.from === sq)) { st.sel = sq; st.targets = lm.filter(m => m.from === sq).map(m => m.to); sfx('click'); }
      else { st.sel = -1; st.targets = []; }
      boardDraw();
    };
    const finishMove = async (ms, said) => {
      let m = ms[0];
      if (ms.length > 1 && ms.every(x => x.promo)) {          // a pawn on the last rank: which piece?
        st.promo = true; boardStatus('Promote to…');
        const want = await new Promise(r => { st.promoPick = r; ui().btns.innerHTML = ['q', 'r', 'b', 'n'].map(t => `<button type="button" data-act="promo-${t}">${esc(cap(PIECE_GR[l][t][0]))}</button>`).join(''); });
        st.promo = null; st.promoPick = null; ui().btns.innerHTML = btnsHTML;
        m = ms.find(x => x.promo === want) || ms[0];
      }
      const r = st.mover; st.mover = null; r({ m, said });
    };
    const btnsHTML = ['help', 'Pieces & phrases (?)', 'resign', 'Resign (Esc)'].reduce((a, v, i, arr) => (i % 2 ? a : a + `<button type="button" data-act="${v}">${esc(arr[i + 1])}</button>`), '');
    boardOpen({ who: { name: P.api.name, sub: `${cap(LEX.form('w.chess'))} · ${bet ? bet + ' coins' : 'for fun'} · you’re white`, icon: 'knight' }, size: [440, 440], draw: (c, w, h) => drawChess(c, w, h, pos, st),
      placeholder: `${announceOf({ p: 'N', to: CHESS.sqOf('f3') }, l)}…`, hint: `Click, or say your move: <span class="tl">${esc(announceOf({ p: 'P', to: CHESS.sqOf('e4') }, l))}</span> (★ when you say it)`,
      buttons: [['help', 'Pieces & phrases (?)'], ['resign', 'Resign (Esc)']],
      onClick: (u, v) => { const sq = chessSqAt(u, v); if (sq >= 0) { st.cursor = sq; pickSquare(sq); } },
      onHover: (u, v) => { const sq = chessSqAt(u, v); if (sq !== st.hover) { st.hover = sq; ui().under.textContent = sq >= 0 ? CHESS.sqName(sq) + (pos.b[sq] ? ' · ' + pieceWord(pos.b[sq]) : '') : ''; } },
      onArrow: (dx, dy) => { let f = (st.cursor & 7) + dx, r = (st.cursor >> 4) + dy; f = clamp(f, 0, 7); r = clamp(r, 0, 7); st.cursor = r * 16 + f; ui().under.textContent = CHESS.sqName(st.cursor) + (pos.b[st.cursor] ? ' · ' + pieceWord(pos.b[st.cursor]) : ''); boardDraw(); },
      onPick: () => pickSquare(st.cursor),
      onHelp: () => boardList(piecesHelpHTML(l)),
      onButton: a => {
        if (a.startsWith('promo-') && st.promoPick) st.promoPick(a.slice(6));
        else if (a === 'help') BOARD.onHelp();
        else if (a === 'resign') BOARD.onEsc();
      },
      onEsc: () => resignArm(st, bet, () => { st.resigned = true; if (st.mover) { const r = st.mover; st.mover = null; r(null); } }),
      onSubmit: text => chessTyped(text, st, pos, P, legalNow, finishMove) });
    refresh();
    boardSay(sayOf('yourMove'), { voice: 'baker' }); boardStatus('Your move (white)');
    let result = null;
    for (;;) {
      const s0 = CHESS.status(pos);
      if (s0.over) { result = s0; break; }
      if (pos.turn === 'w') {
        st.sel = -1; st.targets = [];
        const mv = await new Promise(r => { st.mover = r; });
        if (!mv) break;                                   // (resigned)
        const san = CHESS.san(pos, mv.m, l);
        const capd = mv.m.cap;
        CHESS.play(pos, mv.m); st.last = mv.m; st.sel = -1; st.targets = [];
        st.list.push({ san, said: mv.said }); sfx(capd ? 'hit' : 'wood');
        if (mv.said) { st.said++; star(); const t = CHESS.typeOf(mv.m.p), wid = { p: 'w.pawn', n: 'w.knight', b: 'w.bishop', r: 'w.rook', q: 'w.queen', k: 'w.king' }[t]; if (typeof LEX !== 'undefined' && LEX.item(wid)) LEX.attempt(wid, { ok: true, ms: 4000, mode: 'talk' }); if (Math.random() < 0.6) boardSay(sayOf('announceOk'), { voice: 'baker' }); }
        refresh();
        const after = CHESS.status(pos);
        if (!after.over) {
          if (after.check) boardSay(sayOf('youCheck'), { voice: 'baker' });
          else if (capd) boardSay(pieceTalk('lost', CHESS.typeOf(capd)), { voice: 'baker' });
          if (capd && CHESS.VAL[CHESS.typeOf(capd)] >= 300 && Math.random() < 0.5) boardStatus(`Tino: «${sayOf('tinoOuch').tl}»`);
        }
        continue;
      }
      // the hustler's move
      boardStatus(`${P.api.name} is thinking…`);
      if (Math.random() < 0.3) boardSay(sayOf('thinking'), { voice: 'baker', quiet: true });
      P.S.pose = 'think';
      await wait(0.7 + Math.random() * 0.7);
      if (!BOARD) break;
      const ev = CHESS.evaluate(pos);
      if (ev > 650 && pos.full > 14) { result = { over: true, result: 'w', why: 'resign' }; boardSay(sayOf('aiResigns'), { voice: 'baker' }); break; }
      const m = CHESS.bestMove(pos, { depth: 2, noise: 22 });
      const san = CHESS.san(pos, m, l);
      CHESS.play(pos, m); st.last = m; st.list.push({ san }); sfx(m.cap ? 'hit' : 'wood');
      P.S.pose = 'sit';
      const after = CHESS.status(pos);
      if (!after.over) {
        if (after.check) boardSay(P_LINE('ph.table.check'), { voice: 'baker' });
        else if (m.cap) boardSay(Object.assign(pieceTalk('took', CHESS.typeOf(m.cap)), CHESS.typeOf(m.cap) === 'n' ? { id: 'ph.table.tookKnight' } : {}), { voice: 'baker' });
        else if (Math.random() < 0.12) boardSay(sayOf('banter'), { voice: 'baker' });
        boardStatus(after.check ? 'Check! Your move' : 'Your move');
      }
      refresh();
      if (pos.full > 150) { result = { over: true, result: 'draw', why: 'long' }; break; }
    }
    // the end
    let r = null;
    if (st.agreed) r = 'd';
    else if (st.resigned) { r = 'l'; boardSay(bet ? sayOf('youResign') : sayOf('youResignFun'), { voice: 'baker' }); }
    else if (result) {
      if (result.result === 'w') { r = 'w'; if (result.why === 'mate') boardSay(sayOf('youMate'), { voice: 'baker' }); }
      else if (result.result === 'b') { r = 'l'; boardSay(Object.assign(bet ? sayOf('aiMates') : sayOf('aiMatesFun'), { id: 'ph.table.mate' }), { voice: 'baker' }); }
      else { r = 'd'; boardSay(result.why === 'stalemate' ? sayOf('stalemate') : P_LINE('ph.table.chessDraw'), { voice: 'baker' }); }
    }
    st.over = true; refresh();
    if (r) {
      boardStatus(r === 'w' ? 'You win!' : r === 'l' ? `${P.api.name} wins` : 'A draw', r === 'l');
      sfx(r === 'w' ? 'fanfare' : r === 'l' ? 'lose' : 'review');
      await finalWait();
    }
    boardClose(); unshot(); G.sim.mimoGo(null, null); P.playing = false; P.S.pose = 'sit'; CUR = null;
    if (!r) return;
    const firstWin = r === 'w' && !rec('chess').w;
    settle('chess', P, r, bet);
    if (st.said >= 6) { addCoins(2, 'Tino liked how you said your moves'); }
    if (r === 'w') await speak(P, bet ? 'mg.aur.lose' : 'mg.aur.loseFun');
    if (firstWin) await speak(person('tino'), 'mg.tino.after');
    G.save();
  }
  function resignArm(st, bet, doIt) {
    if (!bet || st.armed > performance.now()) { doIt(); return; }
    st.armed = performance.now() + 4000;
    boardStatus(`Resign? You lose the ${bet} coins. Esc again to resign.`, true); sfx('click');
  }
  const pieceWord = p => cap(PIECE_GR[lang()][CHESS.typeOf(p)][0]);
  function piecesHelpHTML(l) {
    const rows = ['k', 'q', 'r', 'b', 'n', 'p'].map(t => `<tr><td><span class="w">${esc(cap(PIECE_GR[l][t][0]))}</span></td><td>${esc(PIECE_GR.en[t][0])}</td><td style="opacity:.6">${esc((CHESS.LETTER[l] || {})[t] || '')}</td></tr>`).join('');
    const ph = GAME_PHRASES.table.slice(0, 6).map(id => `<div><span class="w">${esc(phraseText(id))}</span> · ${esc(PH[id].en)}</div>`).join('');
    return `<table>${rows}</table><div style="margin:4px 0 2px;opacity:.75">Say a move: <b>${esc(announceOf({ p: 'N', to: CHESS.sqOf('f3') }, l))}</b>, <b>${esc(announceOf({ castle: 'k' }, l))}</b></div>${ph}`;
  }
  function moveListHTML(list) {
    if (!list.length) return '';
    let h = '<table>';
    for (let i = 0; i < list.length; i += 2) h += `<tr><td class="n">${i / 2 + 1}.</td><td>${esc(list[i].san)}${list[i].said ? ' ★' : ''}</td><td>${list[i + 1] ? esc(list[i + 1].san) : ''}</td></tr>`;
    return h + '</table>';
  }
  // what you typed at the chess board: a phrase («¡Buena jugada!», «¡Jaque!», «¡Me rindo!», «¡Tablas!») or your move said out loud
  function chessTyped(text, st, pos, P, legalNow, finishMove) {
    const l = lang();
    const said = id => { const m = phraseMatch(id, text); if (m.ok) { noteSaid(id); if (typeof LEX !== 'undefined' && taught(id)) LEX.attempt(id, { ok: true, ms: 3000, mode: 'talk' }); else if (typeof LEX !== 'undefined') LEX.expose(id); } return m.ok; };
    if (said('ph.table.giveUp')) { BOARD.onEsc(); BOARD.onEsc(); return; }
    if (said('ph.table.niceMove')) { star(); boardSay(P.def.f ? sayOf('flatteredF') : sayOf('flattered'), { voice: 'baker' }); return; }
    if (said('ph.table.check') || said('ph.table.mate')) { if (CHESS.inCheck(pos, 'b')) { star(); boardSay(sayOf('rightCheck'), { voice: 'baker' }); } else boardSay(sayOf('notCheck'), { voice: 'baker' }); return; }
    if (said('ph.table.chessDraw')) { if (CHESS.evaluate(pos) > 120 && pos.full > 10) { st.drawn = true; boardSay(P_LINE('ph.table.chessDraw'), { voice: 'baker' }); st.resigned = false; st.agreed = true; if (st.mover) { const r = st.mover; st.mover = null; st.list.push({ san: '½–½' }); r(null); } } else boardSay({ tl: pickL({ es: '¿Tablas? ¡Ni hablar!', pt: 'Empate? De jeito nenhum!', de: 'Remis? Kommt nicht in Frage!', zh: '[和棋|hé qí] ？ [没门|méi mén] ！', ja: '[引|ひ]き[分|わ]け ？ とんでもない ！' }), en: 'A draw? No way!' }, { voice: 'baker' }); return; }
    if (!st.mover) { boardSay(sayOf('notYourTurn'), { voice: 'baker' }); return; }
    const a = parseAnnounce(text, legalNow(), l);
    if (a.en) { boardSay({ tl: pickL({ es: '¡En español, por favor!', pt: 'Em português, por favor!', de: 'Auf Deutsch, bitte!', zh: '[请|qǐng] [说|shuō] [中文|zhōng wén] ！', ja: '[日本語|にほんご] で お[願|ねが]い します ！' }), en: 'In ' + LNAME[l] + ', please!' }, { voice: 'baker' }); boardShake(); return; }
    if (a.move) { finishMove([a.move], a.said); return; }
    if (a.ambiguous) { const lm = legalNow(); boardSay(sayOf('which'), { voice: 'baker' }); st.targets = []; st.sel = -1; st.amb = a.ambiguous; boardHint(`Two can go there. Say from where, <span class="tl">${esc(announceOf(a.ambiguous[0], l, lm))}</span>, or click the one you mean.`); boardDraw(); return; }
    if (a.none === 'piececant' && a.piece) { boardSay(pieceTalk('cant', a.piece), { voice: 'baker' }); boardShake(); return; }
    boardSay(sayOf('noSuchMove'), { voice: 'baker' }); boardShake();
  }
  const CH_M = 26;
  const chessSqAt = (u, v) => { const W = BOARD ? BOARD.w : 440, m = CH_M / W, s = (1 - 2 * m) / 8; if (u < m || v < m || u > 1 - m || v > 1 - m) return -1; const f = Math.floor((u - m) / s), r = Math.floor((v - m) / s); return r * 16 + f; };
  function drawChess(c, w, h, pos, st) {
    const m = CH_M, s = (w - 2 * m) / 8;
    c.fillStyle = '#6b4a2e'; c.beginPath(); c.roundRect ? c.roundRect(0, 0, w, h, 14) : c.rect(0, 0, w, h); c.fill();
    c.fillStyle = '#f3e3c3'; c.font = '800 13px "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i < 8; i++) { c.fillText('abcdefgh'[i], m + s * (i + 0.5), h - m / 2); c.fillText(String(8 - i), m / 2, m + s * (i + 0.5)); }
    const inChk = CHESS.inCheck(pos, pos.turn) ? pos.k[pos.turn] : -1;
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      const sq = r * 16 + f, x = m + f * s, y = m + r * s;
      c.fillStyle = (r + f) % 2 ? '#b07a48' : '#f3e3c3'; c.fillRect(x, y, s, s);
      if (st.last && (sq === st.last.from || sq === st.last.to)) { c.fillStyle = 'rgba(255,214,90,0.45)'; c.fillRect(x, y, s, s); }
      if (sq === st.sel) { c.fillStyle = 'rgba(33,164,147,0.45)'; c.fillRect(x, y, s, s); }
      if (sq === inChk) { const g = c.createRadialGradient(x + s / 2, y + s / 2, 2, x + s / 2, y + s / 2, s * 0.7); g.addColorStop(0, 'rgba(226,69,58,0.9)'); g.addColorStop(1, 'rgba(226,69,58,0)'); c.fillStyle = g; c.fillRect(x, y, s, s); }
      if (st.amb && st.amb.some(mm => mm.from === sq)) { c.strokeStyle = '#e0503f'; c.lineWidth = 3; c.strokeRect(x + 3, y + 3, s - 6, s - 6); }
    }
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      const sq = r * 16 + f, p = pos.b[sq]; if (!p) continue;
      const t = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }[CHESS.typeOf(p)];
      c.drawImage(iconCv(p < 'a' ? t : t + 'B', 128), m + f * s + s * 0.03, m + r * s + s * 0.02, s * 0.94, s * 0.94);
    }
    for (const to of st.targets || []) { const x = m + (to & 7) * s + s / 2, y = m + (to >> 4) * s + s / 2; c.beginPath(); if (pos.b[to]) { c.arc(x, y, s * 0.44, 0, TAU); c.strokeStyle = 'rgba(33,164,147,0.9)'; c.lineWidth = 4; c.stroke(); } else { c.arc(x, y, s * 0.14, 0, TAU); c.fillStyle = 'rgba(33,164,147,0.8)'; c.fill(); } }
    if (st.cursor >= 0 && !st.over) { const x = m + (st.cursor & 7) * s, y = m + (st.cursor >> 4) * s; c.setLineDash([5, 4]); c.strokeStyle = '#2b2235'; c.lineWidth = 2; c.strokeRect(x + 2, y + 2, s - 4, s - 4); c.setLineDash([]); }
    c.strokeStyle = '#2b2235'; c.lineWidth = 3; c.strokeRect(m, m, s * 8, s * 8);
  }

  // ---------------- checkers
  async function playCheckers(P, bet) {
    const l = lang(), T3 = W3.T3.checkers;
    standAt(T3); tableShot(T3); P.playing = true;
    let pos = CHECKERS.start(); pos.hist = [CHECKERS.key(pos)];
    const st = { sel: -1, cursor: 5 * 8 + 0, last: null, targets: [], mover: null, over: false, armed: 0 };
    CUR = { kind: 'checkers', get pos() { return pos; }, st };
    const refresh = () => { boardDraw(); boardChips(`<span class="mg-chip ${bet ? 'gold' : ''}">${bet ? '🪙 ' + bet : 'for fun'}</span><span class="mg-chip">You ${CHECKERS.count(pos, 'w')}</span><span class="mg-chip">${esc(P.api.name)} ${CHECKERS.count(pos, 'b')}</span>`); };
    const pickSquare = sq => {
      if (!st.mover) return;
      const ms = CHECKERS.moves(pos);
      if (st.sel >= 0) {
        const cand = ms.filter(m => m.from === st.sel && CHECKERS.to(m) === sq).sort((a, b) => b.caps.length - a.caps.length);
        if (cand.length) { const r = st.mover; st.mover = null; r(cand[0]); return; }
      }
      const p = pos.b[sq];
      if (p && CHECKERS.owner(p) === 'w') {
        if (ms.some(m => m.from === sq)) { st.sel = sq; st.targets = ms.filter(m => m.from === sq).map(CHECKERS.to); sfx('click'); }
        else if (ms.length && ms[0].caps.length) { boardSay(P_LINE('ph.table.mustTake'), { voice: 'baker' }); boardShake(); st.sel = -1; st.targets = []; st.mustShow = true; }
        else { st.sel = -1; st.targets = []; }
      } else { st.sel = -1; st.targets = []; }
      boardDraw();
    };
    boardOpen({ who: { name: P.api.name, sub: `${cap(LEX.form('w.checkers'))} · ${bet ? bet + ' coins' : 'for fun'} · you’re cream, you start`, icon: 'checkers' }, size: [420, 420], draw: (c, w, h) => drawCheckers(c, w, h, pos, st),
      placeholder: `${phraseText('ph.table.niceMove')}…`, hint: 'Click a piece, then where it goes. If you can take, you must!',
      buttons: [['help', 'Rules & phrases (?)'], ['resign', 'Resign (Esc)']],
      onClick: (u, v) => { const sq = ckSqAt(u, v); if (sq >= 0) { st.cursor = sq; pickSquare(sq); } },
      onArrow: (dx, dy) => { const r = clamp((st.cursor >> 3) + dy, 0, 7), c = clamp((st.cursor & 7) + dx, 0, 7); st.cursor = r * 8 + c; boardDraw(); },
      onPick: () => pickSquare(st.cursor),
      onHelp: () => boardList(`<div>Men move one step forward, diagonally. Jump over a piece to take it; keep jumping if you can. Reach the far side: a king (<span class="w">${esc(pickL({ es: 'dama', pt: 'dama', de: 'Dame', zh: '[王|wáng]', ja: 'キング' }))}</span>) that moves both ways.</div>` + ['ph.table.mustTake', 'ph.table.niceMove', 'ph.table.giveUp', 'ph.table.chessDraw', 'ph.table.knewIt'].map(id => `<div><span class="w">${esc(phraseText(id))}</span> · ${esc(PH[id].en)}</div>`).join('')),
      onButton: a => { if (a === 'help') BOARD.onHelp(); else if (a === 'resign') BOARD.onEsc(); },
      onEsc: () => resignArm(st, bet, () => { st.resigned = true; if (st.mover) { const r = st.mover; st.mover = null; r(null); } }),
      onSubmit: text => {
        const said = id => { const m = phraseMatch(id, text); if (m.ok) { noteSaid(id); if (typeof LEX !== 'undefined' && taught(id)) LEX.attempt(id, { ok: true, ms: 3000, mode: 'talk' }); } return m.ok; };
        if (said('ph.table.giveUp')) { BOARD.onEsc(); BOARD.onEsc(); return; }
        if (said('ph.table.niceMove')) { star(); boardSay(sayOf('flatteredF'), { voice: 'rosa' }); return; }
        if (said('ph.table.chessDraw')) { if (CHECKERS.evaluate(pos) > 90) { st.agreed = true; boardSay(P_LINE('ph.table.chessDraw'), { voice: 'rosa' }); if (st.mover) { const r = st.mover; st.mover = null; r(null); } } else boardSay({ tl: pickL({ es: '¿Tablas? ¡Ni hablar!', pt: 'Empate? De jeito nenhum!', de: 'Remis? Kommt nicht in Frage!', zh: '[和棋|hé qí] ？ [没门|méi mén] ！', ja: '[引|ひ]き[分|わ]け ？ とんでもない ！' }), en: 'A draw? No way!' }, { voice: 'rosa' }); return; }
        if (said('ph.table.knewIt') || said('ph.table.tookKnight') || said('ph.play.gotYou')) { star(); boardSay(sayOf('banter'), { voice: 'rosa' }); return; }
        boardSay({ tl: pickL({ es: 'Mueve, cariño, mueve.', pt: 'Joga, meu bem, joga.', de: 'Zieh, Schätzchen, zieh.', zh: '[走|zǒu] [呀|ya] ， [亲爱|qīn ài] [的|de] ， [走|zǒu] [呀|ya] 。', ja: 'さあ 、 どうぞ 、 [指|さ]して ください 。' }), en: 'Move, dear, move.' }, { voice: 'rosa' });
      } });
    refresh(); boardSay(sayOf('yourMove'), { voice: 'rosa' }); boardStatus('Your move (cream)');
    let result = null;
    for (;;) {
      const s0 = CHECKERS.status(pos);
      if (s0.over) { result = s0; break; }
      if (pos.turn === 'w') {
        st.sel = -1; st.targets = [];
        const ms0 = s0.moves; if (ms0.length && ms0[0].caps.length) boardStatus('You must take!');
        const m = await new Promise(r => { st.mover = r; });
        if (!m) break;
        pos = CHECKERS.play(pos, m); st.last = m; st.sel = -1; st.targets = []; st.mustShow = false;
        sfx(m.caps.length ? 'hit' : 'wood');
        if (m.caps.length) boardSay(sayOf('ckLost'), { voice: 'rosa' });
        if (m.crown) boardSay(sayOf('ckCrownYou'), { voice: 'rosa' });
        refresh();
        continue;
      }
      boardStatus(`${P.api.name} is thinking…`); P.S.pose = 'think';
      await wait(0.6 + Math.random() * 0.6);
      if (!BOARD) break;
      if (CHECKERS.count(pos, 'w') - CHECKERS.count(pos, 'b') >= 4 && CHECKERS.count(pos, 'b') <= 3) { result = { over: true, result: 'w', why: 'resign' }; boardSay(sayOf('aiResigns'), { voice: 'rosa' }); break; }
      // (P6b: her level, CK_LEVELS: a shallower look ahead, more noise, and now and then a deliberate slip; more slips while
      // you're 3 pieces down, so a casual game can turn around)
      const ckL = CK_LEVELS[ckLevel()], down = CHECKERS.count(pos, 'b') - CHECKERS.count(pos, 'w');
      const m = CHECKERS.bestMove(pos, Object.assign({}, ckL, { slip: Math.min(0.5, ckL.slip + (down >= 3 ? 0.15 : 0)) }));
      pos = CHECKERS.play(pos, m); st.last = m; P.S.pose = 'sit';
      sfx(m.caps.length ? 'hit' : 'wood');
      if (m.caps.length > 1) boardSay(sayOf('ckTookMany', { n: numWord(m.caps.length) }), { voice: 'rosa' });
      else if (m.caps.length) boardSay(sayOf('ckTook'), { voice: 'rosa' });
      else if (m.crown) boardSay(sayOf('ckCrownAi'), { voice: 'rosa' });
      else if (Math.random() < 0.1) boardSay(sayOf('banter'), { voice: 'rosa' });
      refresh(); boardStatus('Your move');
    }
    let r = null;
    if (st.agreed) { r = 'd'; }
    else if (st.resigned) { r = 'l'; boardSay(bet ? sayOf('youResign') : sayOf('youResignFun'), { voice: 'rosa' }); }
    else if (result) {
      r = result.result === 'w' ? 'w' : result.result === 'b' ? 'l' : 'd';
      boardSay(r === 'w' ? sayOf('ckYouWin') : r === 'l' ? (bet ? sayOf('ckAiWins') : sayOf('ckAiWinsFun')) : P_LINE('ph.table.chessDraw'), { voice: 'rosa' });
    }
    st.over = true; refresh();
    if (r) { boardStatus(r === 'w' ? 'You win!' : r === 'l' ? `${P.api.name} wins` : 'A draw', r === 'l'); sfx(r === 'w' ? 'fanfare' : r === 'l' ? 'lose' : 'review'); await finalWait(); }
    boardClose(); unshot(); G.sim.mimoGo(null, null); P.playing = false; P.S.pose = 'sit'; CUR = null;
    if (!r) return;
    const firstWin = r === 'w' && !rec('checkers').w;
    settle('checkers', P, r, bet);
    { const s = S(); s.ckLevel = Math.max(0, Math.min(CK_LEVELS.length - 1, ckLevel() + (r === 'w' ? 1 : r === 'l' ? -1 : 0))); }     // (P6b: she adapts: easier after you lose, a bit harder after you win)
    if (r === 'w') await speak(P, bet ? 'mg.reme.lose' : 'mg.reme.loseFun');
    if (firstWin) await speak(person('tino'), 'mg.tino.after');
    G.save();
  }
  // Doña Reme's levels (P6b, DESIGN.md 19: "please nerf the checkers guy too"). She used to look 3 moves ahead every move (depth 3,
  // noise 14): too strong for a casual game. Now a new player meets level 0; each game you lose takes her down one, each you win
  // up one (state.mg.ckLevel); 3 is her old strength. slip: the chance of a deliberate mistake (bestMove's o.slip). Simulated (40
  // games each) against a weak player (one move ahead, lots of noise) she wins 19 at level 0, 31 at 1, 38 at 2 and 40 at 3; against a
  // casual one (two moves ahead) 0, 1, 6 and 12 (with 12 draws): the level settles where you win about half.
  const CK_LEVELS = [
    { depth: 1, noise: 70, slip: 0.30, ext: 0 },
    { depth: 2, noise: 45, slip: 0.22, ext: 1 },
    { depth: 2, noise: 25, slip: 0.12, ext: 1 },
    { depth: 3, noise: 14, slip: 0.05, ext: 1 },
  ];
  const ckLevel = () => { const s = S(), v = s && typeof s.ckLevel === 'number' ? s.ckLevel : 0; return Math.max(0, Math.min(CK_LEVELS.length - 1, v | 0)); };
  const CK_M = 16;
  const ckSqAt = (u, v) => { const W = BOARD ? BOARD.w : 420, m = CK_M / W, s = (1 - 2 * m) / 8; if (u < m || v < m || u > 1 - m || v > 1 - m) return -1; return Math.floor((v - m) / s) * 8 + Math.floor((u - m) / s); };
  function drawCheckers(c, w, h, pos, st) {
    const m = CK_M, s = (w - 2 * m) / 8;
    c.fillStyle = '#5b3a22'; c.beginPath(); c.roundRect ? c.roundRect(0, 0, w, h, 14) : c.rect(0, 0, w, h); c.fill();
    const ms = st.mover ? CHECKERS.moves(pos) : [];
    const movable = new Set(ms.map(x => x.from));
    for (let r = 0; r < 8; r++) for (let f = 0; f < 8; f++) {
      const sq = r * 8 + f, x = m + f * s, y = m + r * s;
      c.fillStyle = (r + f) % 2 ? '#3f6f4a' : '#f3e3c3'; c.fillRect(x, y, s, s);
      if (st.last && (st.last.from === sq || CHECKERS.to(st.last) === sq)) { c.fillStyle = 'rgba(255,214,90,0.4)'; c.fillRect(x, y, s, s); }
      if (sq === st.sel) { c.fillStyle = 'rgba(33,164,147,0.5)'; c.fillRect(x, y, s, s); }
      if (st.mustShow && movable.has(sq)) { c.strokeStyle = '#ffd166'; c.lineWidth = 4; c.strokeRect(x + 3, y + 3, s - 6, s - 6); }
    }
    if (st.last && st.last.caps.length) for (const q of st.last.caps) { const x = m + (q & 7) * s + s / 2, y = m + (q >> 3) * s + s / 2; c.strokeStyle = 'rgba(226,69,58,0.55)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 8, y - 8); c.lineTo(x + 8, y + 8); c.moveTo(x + 8, y - 8); c.lineTo(x - 8, y + 8); c.stroke(); }
    for (let sq = 0; sq < 64; sq++) {
      const p = pos.b[sq]; if (!p) continue;
      const x = m + (sq & 7) * s + s / 2, y = m + (sq >> 3) * s + s / 2, w2 = CHECKERS.owner(p) === 'w', R = s * 0.38;
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(x + 2, y + 4, R, R * 0.9, 0, 0, TAU); c.fill();
      c.fillStyle = w2 ? '#f7ecd2' : '#c9443a'; c.strokeStyle = '#2b2235'; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, R, 0, TAU); c.fill(); c.stroke();
      c.strokeStyle = w2 ? 'rgba(43,34,53,0.35)' : 'rgba(255,240,230,0.45)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, R * 0.62, 0, TAU); c.stroke();
      if (CHECKERS.isKing(p)) { c.fillStyle = '#ffcf3f'; c.strokeStyle = '#2b2235'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x - 11, y + 6); c.lineTo(x - 12, y - 6); c.lineTo(x - 5, y - 1); c.lineTo(x, y - 9); c.lineTo(x + 5, y - 1); c.lineTo(x + 12, y - 6); c.lineTo(x + 11, y + 6); c.closePath(); c.fill(); c.stroke(); }
    }
    for (const to of st.targets || []) { const x = m + (to & 7) * s + s / 2, y = m + (to >> 3) * s + s / 2; c.beginPath(); c.arc(x, y, s * 0.15, 0, TAU); c.fillStyle = 'rgba(33,164,147,0.85)'; c.fill(); }
    if (st.cursor >= 0 && !st.over) { const x = m + (st.cursor & 7) * s, y = m + (st.cursor >> 3) * s; c.setLineDash([5, 4]); c.strokeStyle = '#fffaf0'; c.lineWidth = 2; c.strokeRect(x + 2, y + 2, s - 4, s - 4); c.setLineDash([]); }
  }

  // ================================================================ the record card
  function recordsData() {
    const s = S(), g = id => rec(id);
    return { kids: { tag: g('tag'), ttt: g('ttt'), rps: g('rps'), hide: g('hide') }, chess: g('chess'), checkers: g('checkers'), stickers: s.stickers.slice(), stars: s.stars, medal: s.medal,
      coinsWon: s.coinsWon, coinsLost: s.coinsLost, phrases: PHRASES.filter(p => taught(p.id)).map(p => p.id), said: Object.assign({}, s.said) };
  }
  async function showRecords() {
    const d = recordsData(), l = lang();
    const row = (name, R) => `<tr><td style="text-align:left;padding:2px 8px">${esc(name)}</td><td style="padding:2px 8px"><b>${R.w}</b> won</td><td style="padding:2px 8px">${R.l} lost</td>${R.d ? `<td style="padding:2px 8px">${R.d} tied</td>` : '<td></td>'}</tr>`;
    const html = `<div class="tag">Scores, chalked on the wall</div><table style="margin:6px auto;font-size:14px">${['tag', 'ttt', 'rps', 'hide'].map(k => row(GAME_NAME[k][l], d.kids[k])).join('')}${row(cap(LEX.form('w.chess')), d.chess)}${row(cap(LEX.form('w.checkers')), d.checkers)}</table>`
      + `<div class="sub" style="font-size:13px;opacity:.8">Stickers: ${d.stickers.length ? d.stickers.map(k => '★ ' + esc(STICKERS[k])).join(' · ') : 'none yet'}${d.medal ? ' · 🏅 the Plaza medal' : ''}</div>`
      + `<div class="sub" style="font-size:13px;opacity:.8">★ ${d.stars} ${d.stars === 1 ? 'thing' : 'things'} said in ${LNAME[l]} · ${d.phrases.length} ${d.phrases.length === 1 ? 'phrase' : 'phrases'} learned · coins from the hustlers: +${d.coinsWon} / −${d.coinsLost}</div><div class="sub">E to close</div>`;
    await UI.card(html, { kind: 'page' });
  }

  // ================================================================ the game side: what you can press E on, the per-frame game tick, init
  function interactables() {
    if (!G || !W3 || BUSY || ACTIVE || !G.state.flags.hatched) return [];
    if (G.indoors && G.indoors()) return [];
    const Y = G.sim.you, out = [];
    if (Math.abs(Y.x - PLAZA.x) < 24 && Math.abs(Y.z - PLAZA.z) < 24) {
      for (const P of W3.people) if (P.kid && P.mode === 'home') out.push({ x: P.S.x, z: P.S.z, y: P.S.y, r: 2.0, label: 'Talk', run: () => guard(() => kidTalk(P)) });
      out.push({ x: CHALK.x, z: CHALK.z, y: W3.gy(CHALK.x, CHALK.z), r: 1.15, label: S().met.kids ? 'Play' : 'Look', run: () => guard(() => (S().met.kids ? startKidGame('ttt') : kidTalk(kid('luci')))) });
    }
    if (Math.abs(Y.x - SQUARE.x) < 26 && Math.abs(Y.z - SQUARE.z) < 26) {
      for (const P of W3.people) if (!P.kid) out.push({ x: P.S.x, z: P.S.z, y: P.S.y, r: P.def.at ? 2.9 : 2.0, label: 'Talk', run: () => guard(() => oldTalk(P)) });     // (across the table from you)
      out.push({ x: SIGN_AT.x, z: SIGN_AT.z, y: W3.gy(SIGN_AT.x, SIGN_AT.z), r: 1.5, label: 'Read', run: signRead });
    }
    return out;
  }
  // the hustlers' chalkboard: a Read card (signs.js: the words big, a 🔊, the English); without it, a thought
  async function signRead() {
    const l = lang(), N = SIGN_NAT[l] || SIGN_NAT.es, note = 'A game, for coins? The old folks at these tables look awfully sure of themselves.';
    if (typeof LEX !== 'undefined') { LEX.expose('w.chess'); LEX.expose('w.checkers'); }
    if (typeof SIGNS === 'undefined' || !SIGNS.read) { STORY.think(`«${N[0]} ${N[1]}»… ${note}`, 5); return; }
    const chalk = { face: '#2f3a33', edge: '#8a5f3e', ink: '#fdfbf5' };
    await SIGNS.read({ tag: 'A chalkboard between the tables', note, lines: [{ text: N[0], en: 'A game?', look: chalk },
      { text: N[1], en: 'chess · checkers', look: Object.assign({}, chalk, { ink: '#ffe27a' }) }, { text: '5 × 🪙', say: '', en: 'a bet: 5 coins', look: chalk }] });
  }
  async function guard(fn) {
    if (BUSY) return;
    BUSY = true;
    try { await fn(); } catch (e) { console.error('[minigames]', e); cleanupAll(); }
    finally { BUSY = false; }
  }
  // put everything back (after an error, or a load in the middle of a game)
  function cleanupAll() {
    if (PANEL) PANEL.cancel();
    if (BOARD) boardClose();
    if (ACTIVE) { if (ACTIVE.resolve) try { ACTIVE.resolve('quit'); } catch (e) { /* ok */ } if (ACTIVE.hiddenAt) unhide(ACTIVE); }
    ACTIVE = null; CUR = null; hud(null); promptAt(null); clearBubbles();
    typingHolds = 0; if (typeof Input !== 'undefined') Input.typing = false;
    if (G) { G.cam.override = null; G.sim.mimoGo(null, null); if (G.cast && G.cast.hero) G.cast.hero.root.scale.set(1, 1, 1); }
    if (W3) for (const P of W3.people) { P.mode = P.mode === 'game' ? 'walkHome' : P.mode; P.hidden = false; P.playing = false; P.api.talking = false; }
  }
  function tickGame(dt, t) {
    const A = ACTIVE; if (!A || !G) return;
    if (A.kind === 'tag') tagTick(A, dt, t);
    else if (A.kind === 'hide') hideTick(A, dt, t);
  }
  function onState() {
    if (ACTIVE || BOARD || PANEL) cleanupAll();
    if (W3) for (const P of W3.people) { P.mode = 'home'; P.S.x = P.home.x; P.S.z = P.home.z; P.S.yaw = P.home.yaw; P.S.pose = P.home.pose; }
  }
  // Mimo's medal (for winning all four of the kids' games): a gold disc on a red-and-blue ribbon
  let medal = null;
  function buildMedal() {
    if (medal || !G || !G.cast || !G.cast.mimo || typeof THREE === 'undefined') return;
    const { part } = TK, g = new THREE.Group(); g.position.set(0, 0.17, 0.33); g.rotation.x = -0.12;
    g.add(part(new THREE.BoxGeometry(0.035, 0.2, 0.01), '#e0503f', [-0.045, 0.1, -0.005], null, { rot: [0, 0, -0.42], ink: 0.006 }));
    g.add(part(new THREE.BoxGeometry(0.035, 0.2, 0.01), '#3f7fc9', [0.045, 0.1, -0.005], null, { rot: [0, 0, 0.42], ink: 0.006 }));
    g.add(part(new THREE.CylinderGeometry(0.058, 0.058, 0.018, 18), '#ffcf3f', [0, 0, 0.004], null, { rot: [Math.PI / 2, 0, 0], ink: 0.008, emissive: '#3a2a00' }));
    g.add(part(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 5), '#f0a020', [0, 0, 0.012], null, { rot: [Math.PI / 2, 0, 0], ink: 0 }));
    g.visible = false; G.cast.mimo.body.add(g); medal = g;
  }
  // the side quests (quests.js LIST entries): the plaza's four games, and the hustlers
  function quests() {
    const won = s => ['tag', 'ttt', 'rps', 'hide'].filter(g => s.mg && s.mg.rec && s.mg.rec[g] && s.mg.rec[g].w > 0).length;
    const beat = (s, g) => !!(s.mg && s.mg.rec && s.mg.rec[g] && s.mg.rec[g].w > 0);
    return [
      { id: 'mg.plaza', kind: 'side', title: 'Games in the plaza', giver: 'Sofi, Beto and Luci, in Alba’s plaza',
        started: s => !!(s.mg && s.mg.met && s.mg.met.kids),
        steps: [{ text: 'Beat the plaza kids at all four games ({n}/4)', n: won, word: 'w.paper',
          why: 'Tag, tic-tac-toe in chalk, rock-paper-scissors and hide and seek. They tease you in the language, and after each game they teach you how. Win all four and they give {mimo} a medal.',
          done: s => !!(s.mg && s.mg.medal) || won(s) >= 4, target: () => KID_HOME.sofi, hint: '{mimo} points at the kids by the chalk drawings in the plaza.' }],
        story: [{ when: s => !!(s.mg && s.mg.medal), text: 'You beat Sofi, Beto and Luci at all four of their games, and {mimo} got the Plaza medal. They still say it doesn’t count.' }] },
      { id: 'mg.hustlers', kind: 'side', title: 'The hustlers of Molinar', get giver() { return `${oldName(OLD[0])} and ${oldName(OLD[1])}, at their tables in Molinar’s square`; },
        started: s => !!(s.mg && s.mg.met && (s.mg.met.aurelio || s.mg.met.reme)),
        steps: [
          { get text() { return `Beat ${oldName(OLD[1])} at {w.checkers}`; }, word: 'w.checkers', why: 'She plays for coins, and she says it’s easy… for her. If you can take a piece, you must!', done: s => beat(s, 'checkers'), target: () => TABLES.checkers, hint: '{mimo} points at the table with the red and cream pieces.' },
          { get text() { return `Beat ${oldName(OLD[0])} at {w.chess}`; }, word: 'w.chess', why: 'He “plays a little.” Say your moves out loud in the language: Tino says they love that.', done: s => beat(s, 'chess'), target: () => TABLES.chess, hint: '{mimo} points at the chess table by the clockmaker’s.' },
        ] },
    ];
  }
  function init(game) {
    G = game;
    registerItems(); registerIcons(); mergeLines();
    S();
    buildMedal();
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST) for (const q of quests()) if (!QUESTS.LIST.some(x => x.id === q.id)) QUESTS.LIST.push(q);
    ui();
  }

  return {
    init, build, interactables,
    get busy() { return BUSY || !!ACTIVE || !!BOARD || !!PANEL; },
    get overlay() { return !!BOARD; },
    get playing() { return ACTIVE ? ACTIVE.kind : null; },
    records: recordsData,
    // tests and tools
    _: {
      CHESS, CHECKERS, CK_LEVELS, ckLevel, TTT, RPS, parseCell, parseThrow, parseAnnounce, phraseMatch, yesNo, announceOf, pieceTalk, lineOf, sayOf, phraseText,
      PHRASES, NEW_WORDS, LT, SAY, HIDE_SPOTS, TABLES, PLAZA, SQUARE, CHALK, KID_HOME, COUNT_AT, SIGN_AT, TINO_AT, GAME_PHRASES, CELL_NAME,
      person, S: () => S(), rec, cleanupAll, kidTalk, oldTalk, tinoTalk, startKidGame, playTag, playTTT, playRPS, playHide, playChess, playCheckers, learnPhrase, sayPhrase, showRecords, obstacles, steer,
      get W3() { return W3; }, get ACTIVE() { return ACTIVE; }, get BOARD() { return BOARD; }, get PANEL() { return PANEL; }, get CUR() { return CUR; }, get BUSY() { return BUSY; },
      // drive the overlays like a player would
      submit(text) { if (PANEL) { UIR.pinput.value = text; PANEL.submit(text); return 'panel'; } if (BOARD && BOARD.onSubmit) { if (!String(text).trim()) { if (BOARD.onPick) BOARD.onPick(); return 'pick'; } BOARD.onSubmit(text); return 'board'; } return false; },
      click(u, v) { if (BOARD && BOARD.onClick) { BOARD.onClick(u, v); return true; } return false; },
      button(act) { if (PANEL) { PANEL.button(act); return 'panel'; } if (BOARD && BOARD.onButton) { BOARD.onButton(act); return 'board'; } return false; },
      esc() { if (PANEL) { PANEL.cancel(); return 'panel'; } if (BOARD && BOARD.onEsc) { BOARD.onEsc(); return 'board'; } if (ACTIVE) { ACTIVE.quit = true; return 'game'; } return false; },
      press() { if (ACTIVE && ACTIVE.press) { ACTIVE.press(); return true; } return false; },
      taunt() { if (ACTIVE && ACTIVE.kind === 'tag') { tauntBack(ACTIVE); return true; } return false; },
      chessSquare(name) { const sq = CHESS.sqOf(name), m = CH_M / (BOARD ? BOARD.w : 440), s = (1 - 2 * m) / 8; return this.click(m + ((sq & 7) + 0.5) * s, m + ((sq >> 4) + 0.5) * s); },
      ckSquare(r, c) { const m = CK_M / (BOARD ? BOARD.w : 420), s = (1 - 2 * m) / 8; return this.click(m + (c + 0.5) * s, m + (r + 0.5) * s); },
      panelText() { return PANEL ? UIR.panel.innerText : BOARD ? UIR.card.innerText : null; },
    },
  };
})();
