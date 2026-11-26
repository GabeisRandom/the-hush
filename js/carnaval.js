'use strict';
// Malu's bloco: a neighborhood street Carnaval (Portuguese games only; SIDES.md). The user picked a street Carnaval:
// everyday Brazil, not postcard Brazil. A bloquinho de rua, families and kids, PG (picolé, guaraná, suco; no alcohol).
//
// WHO: Malu (Maria Luísa), nine, two big hair puffs with yellow scrunchies, her grandpa's old bloco T-shirt knotted at the
// side, a pink tulle skirt, a glittery tiara with two little stars on springs, and his silver whistle (apito) round her
// neck. Her grandpa, Vô Tião (Sebastião), founded Alba's bloco and was its mestre de bateria; since the Hush came he sits on
// a plaza bench all day, gray and silent, and the bloco went quiet with him. Malu wants it back, «com muito barulho».
// Neighbors: Dona Cida (the seamstress, thirty years of costumes) and Seu Juca (the old surdo player).
// WHERE: her bloco HQ («o QG do bloco») by the bell tower's north-east side (the shared festival-kid spot): the old surdo
// under a tarp, a chalkboard, a string of streamers and paper masks. Vô Tião: the plaza bench west of the fountain.
// CHAPTERS (gated like the other side characters: Rosa's welcome, the big Hushling, bells 1, 2, 3):
//   1 Fantasias: the costume trunk; dress {mimo} on a paper doll by typing «uma coroa dourada» (gender agreement); describe
//     the costume; compare (maior, mais colorida, menos brilhante… do que); vote on the bloco's name and theme («Eu voto no…»)
//   2 A bateria: the eight instruments (surdo, caixa, repinique, tamborim, agogô, pandeiro, cuíca, chocalho), each heard on
//     its own, then named by its sound; then you're in charge (TPR): call each section in, «Paradinha!», «Volta!»,
//     «Mais forte!», «Só o surdo!», «Todo mundo!», and the bateria plays what you call
//   3 Marchinhas: three original marchinhas (call and response): «Acorda, Alba!» (the bloco's anthem: every answer in the
//     -ou past), «O {mimo} é pequenininho» (-inho and -ão), «Olha o picolé!» (street vendors' cries); «Joga confete!»;
//     the anthem again from memory
//   4 Organizing the bloco: directions (vira à direita / à esquerda, segue reto, dá a volta) to plan the route on a map of
//     Alba; invite Dona Rosa, Bruno, Marta and Nico around town (invitations and «Você pode…?» requests); paint the
//     estandarte (its colors, its emblem, the name) and the abre-alas banner
//   5 The parade: the bloco marches from the tower, along the lane behind the bakery, down the market street to the plaza.
//     A giant puppet made of the Hush swallows the drums: «Mais forte!», the paradinha (it thinks it won), «Volta!», the
//     chant, «Joga confete!». Round the fountain, Vô Tião's color comes back; Malu becomes the new mestra; {mimo} gets
//     her tiara de estrelinhas
// SONGS: 'pt_bloco' «Acorda, Alba!» (a samba de bloco: a full bateria, a brass fanfarra hook, a tuba bass; its sections
// can be muted live for chapter 2 and the paradinha), 'pt_marcha' (the three marchinhas, a 2/4 marcha band: trumpet,
// trombone, tuba, surdo, caixa, pratos, crowd claps), 'cv_apito' (the mestre's whistle, a one-shot).
// API: CARNAVAL.init(game) · CARNAVAL.build(scene, env) → { colliders, group, people, update } · CARNAVAL.hatOn() (main.js:
// the straw hat steps aside) · CARNAVAL.mapMark(dpr) (minimap.js) · CARNAVAL.quest() · CARNAVAL._ (tests: CARNAVAL._.t).
// State: G.state.cv. Phrases: ph.cv.* (region 'Carnaval de rua'). Panels: carnaval_ui.js (CVUI). Uses zhfolk.js's
// language-neutral parts (ZHF.Kit / bake / person / animate / music) and never its Chinese matching.

const CARNAVAL = (() => {
  const esc = s => CVUI.esc(s), has = (t, k) => CVUI.has(t, k), N = s => CVUI.N(s);
  const MIMO = () => (G && G.state && G.state.mimoName) || 'Mimo';
  // ================================================================ who's who
  const NAMES = { malu: 'Malu', vo: 'Vô Tião', cida: 'Dona Cida', juca: 'Seu Juca', rosa: 'Dona Rosa', bruno: 'Bruno', baker: 'Marta', kid: 'Nico' };
  // the bloco's name and theme (chapter 1's vote): the name goes on the estandarte, in the lines ({bloco}) and the songs
  const BLOCOS = [
    { id: 'sino', name: 'Bloco do Sino Acordado', en: 'the Woken Bell Bloco', keys: ['sino', 'sino acordado'] },
    { id: 'barulhinho', name: 'Unidos do Barulhinho', en: 'United of the Little Noise (a joke on samba schools’ «Unidos de…» names)', keys: ['barulhinho', 'unidos'] },
    { id: 'fala', name: 'Quem Fala Não Se Cala', en: 'Whoever Talks Won’t Be Hushed', keys: ['quem fala', 'nao se cala', 'se cala', 'fala'] },
  ];
  const TEMAS = [
    { id: 'mar', name: 'o fundo do mar', en: 'the bottom of the sea', keys: ['mar', 'fundo do mar'], cols: ['#2f7fe0', '#19b37a', '#ffd23f'], emblem: 'peixe' },
    { id: 'espaco', name: 'o espaço', en: 'outer space', keys: ['espaco'], cols: ['#8a4fd8', '#c8ced8', '#ffd23f'], emblem: 'estrela' },
    { id: 'bichos', name: 'os bichos', en: 'the animals', keys: ['bichos', 'bicho', 'animais'], cols: ['#ff8a2a', '#19b37a', '#ff4f9a'], emblem: 'gato' },
  ];
  // ================================================================ chapter 1: the costume trunk
  // g: the noun's gender (the color agrees with it), pl: plural; slot: where it goes on {mimo}
  const ITEMS = [
    { id: 'coroa', pt: 'coroa', art: 'a', g: 'f', slot: 'head', en: 'a crown', keys: ['coroa', 'coroinha'] },
    { id: 'peruca', pt: 'peruca', art: 'a', g: 'f', slot: 'head', en: 'a wig', keys: ['peruca'] },
    { id: 'chapeu', pt: 'chapéu', art: 'o', g: 'm', slot: 'head', en: 'a hat', keys: ['chapeu', 'chapeuzinho'] },
    { id: 'mascara', pt: 'máscara', art: 'a', g: 'f', slot: 'face', en: 'a mask', keys: ['mascara', 'mascarinha'] },
    { id: 'oculos', pt: 'óculos', art: 'os', g: 'm', pl: true, slot: 'face', en: 'glasses', keys: ['oculos'] },
    { id: 'purpurina', pt: 'purpurina', art: 'a', g: 'f', slot: 'face', en: 'glitter (on the cheeks)', keys: ['purpurina', 'glitter', 'gliter'] },
    { id: 'capa', pt: 'capa', art: 'a', g: 'f', slot: 'body', en: 'a cape', keys: ['capa'] },
    { id: 'asas', pt: 'asas', art: 'as', g: 'f', pl: true, slot: 'body', en: 'wings', keys: ['asas', 'asa', 'asinhas'] },
    { id: 'colar', pt: 'colar de flores', art: 'o', g: 'm', slot: 'body', en: 'a flower necklace', keys: ['colar', 'colar de flores', 'colar havaiano'] },
  ];
  const SLOTS = { head: 'na cabeça', face: 'no rosto', body: 'no corpo' };
  // colors: [m, f, m pl, f pl]; rosa and laranja never change
  const COLORS = [
    { id: 'vermelho', f: ['vermelho', 'vermelha', 'vermelhos', 'vermelhas'], hex: '#e2483a', en: 'red' },
    { id: 'amarelo', f: ['amarelo', 'amarela', 'amarelos', 'amarelas'], hex: '#ffd23f', en: 'yellow' },
    { id: 'verde', f: ['verde', 'verde', 'verdes', 'verdes'], hex: '#19b37a', en: 'green' },
    { id: 'azul', f: ['azul', 'azul', 'azuis', 'azuis'], hex: '#2f7fe0', en: 'blue' },
    { id: 'rosa', f: ['rosa', 'rosa', 'rosa', 'rosa'], alt: ['rosas', 'cor de rosa', 'rosinha'], hex: '#ff6fae', en: 'pink' },
    { id: 'roxo', f: ['roxo', 'roxa', 'roxos', 'roxas'], hex: '#8a4fd8', en: 'purple' },
    { id: 'laranja', f: ['laranja', 'laranja', 'laranja', 'laranja'], alt: ['laranjas'], hex: '#ff8a2a', en: 'orange' },
    { id: 'branco', f: ['branco', 'branca', 'brancos', 'brancas'], hex: '#fbf8f2', en: 'white' },
    { id: 'preto', f: ['preto', 'preta', 'pretos', 'pretas'], hex: '#3a3346', en: 'black' },
    { id: 'dourado', f: ['dourado', 'dourada', 'dourados', 'douradas'], hex: '#e8b828', en: 'golden', shine: true },
    { id: 'prateado', f: ['prateado', 'prateada', 'prateados', 'prateadas'], hex: '#c8ced8', en: 'silver', shine: true },
    { id: 'colorido', f: ['colorido', 'colorida', 'coloridos', 'coloridas'], hex: 'rainbow', en: 'colorful' },
  ];
  const formOf = (C, it) => C.f[(it.pl ? 2 : 0) + (it.g === 'f' ? 1 : 0)];
  // the item said, and its color (if any): { it, C, ok (it agrees), want (the right form) }
  function readItem(text, slot) {
    const n = ' ' + N(text) + ' ';
    const found = ITEMS.filter(it => it.keys.some(k => n.includes(' ' + N(k) + ' ')));
    const it = found.find(i => !slot || i.slot === slot) || found[0] || null;
    let C = null, said = null;
    for (const c of COLORS) { for (const f of c.f.concat(c.alt || [])) if (n.includes(' ' + N(f) + ' ')) { C = c; said = f; break; } if (C) break; }
    if (!it) return { it: null, C };
    const want = C ? formOf(C, it) : null, agrees = !C || N(said) === N(want) || (C.alt || []).some(a => N(a) === N(said));
    return { it, C, said, want, agrees, wrongSlot: slot && it.slot !== slot };
  }
  // ================================================================ chapter 2: the bateria
  const INST = [
    { id: 'surdo', pt: 'o surdo', en: 'the surdo: the big bass drum', note: 'The heart of the bateria, «o coração da bateria»: it keeps the beat, BOOM on beat two.', sound: 'tum… TUM!', keys: ['surdo', 'surdos'] },
    { id: 'caixa', pt: 'a caixa', en: 'the caixa: the snare drum', note: 'It plays all the fast little notes, nonstop: tchaca-tchaca-tchaca.', sound: 'tchaca-tchaca-tchaca', keys: ['caixa', 'caixas', 'caixa de guerra'] },
    { id: 'repique', pt: 'o repinique', en: 'the repinique: the high drum', note: 'It plays the «chamada», the call that starts the whole bateria. Also called «repique».', sound: 'tá, tá, tá-tá-tá!', keys: ['repinique', 'repique', 'repiniques', 'repiques'] },
    { id: 'tamborim', pt: 'o tamborim', en: 'the tamborim: a tiny hand drum', note: 'Small, played with a stick, and you hear it over everything: teleco-teco!', sound: 'teleco-teco', keys: ['tamborim', 'tamborins'] },
    { id: 'agogo', pt: 'o agogô', en: 'the agogô: a double bell', note: 'Two bells, a high one and a low one. It came to Brazil from West Africa.', sound: 'gan-go, gan-go', keys: ['agogo', 'agogos'] },
    { id: 'pandeiro', pt: 'o pandeiro', en: 'the pandeiro: the Brazilian tambourine', note: 'A frame drum with little metal jingles: thumb, fingers, palm.', sound: 'tum-tchi-tchi-pá', keys: ['pandeiro', 'pandeiros'] },
    { id: 'cuica', pt: 'a cuíca', en: 'the cuíca: the drum that squeaks', note: 'A stick inside, rubbed with a wet cloth. It laughs and cries: «a cuíca ri e chora».', sound: 'uí-uí, uóóó', keys: ['cuica', 'cuicas'] },
    { id: 'chocalho', pt: 'o chocalho', en: 'the chocalho: the shaker', note: 'Rows of little metal discs on a frame: tch-tch-tch-tch.', sound: 'tch-tch-tch-tch', keys: ['chocalho', 'chocalhos', 'ganza'] },
  ];
  const INSTI = Object.fromEntries(INST.map(i => [i.id, i]));
  // ================================================================ chapter 3: the marchinhas (original, written for the game)
  // [call, response] pairs; {mimo} is {mimo}'s name. Malu sings the calls, you answer.
  const MARCH = [
    { id: 'acorda', title: 'Acorda, Alba!', en: 'Wake Up, Alba!', note: 'The bloco’s anthem. Every answer ends in -ou: the past tense of «ele/ela» (chegar → chegou, cantar → cantou).', lines: [
      ['Acorda, Alba, acorda!', 'O bloco chegou!', 'Wake up, Alba, wake up!', 'The bloco is here!'],
      ['Quem tava calado agora', 'Levantou e cantou!', 'Whoever was quiet, now', 'Got up and sang!'],
      ['Bate o surdo, toca a caixa,', 'O sino tocou!', 'Beat the surdo, play the snare,', 'The bell has rung!'],
      ['O Silêncio foi embora:', 'O carnaval voltou!', 'The Hush has gone away:', 'Carnival is back!'] ] },
    { id: 'mimo', title: 'O {mimo} é pequenininho', en: '{mimo} Is Teeny-Tiny', note: '-inho makes things small and sweet (pequeno → pequenininho), -ão makes them big (barulho → barulhão).', lines: [
      ['O {mimo} é pequenininho,', 'Mas faz um barulhão!', '{mimo} is teeny-tiny,', 'But makes a huge racket!'],
      ['Tem confete no focinho', 'E serpentina no chão!', 'There’s confetti on its snout', 'And streamers on the ground!'],
      ['Pula, pula, pula, {mimo},', 'Pula sem parar!', 'Jump, jump, jump, {mimo},', 'Jump and don’t stop!'],
      ['Quem tem medo do Silêncio?', 'Ninguém vai se calar!', 'Who’s afraid of the Hush?', 'Nobody’s going quiet!'] ] },
    { id: 'picole', title: 'Olha o picolé!', en: 'Popsicles Here!', note: 'Street vendors call «Olha o…!» («look at the…!»): «Olha o picolé! Olha a água! Olha o guaraná!»', lines: [
      ['Tá quente, tá quente, tá quente!', 'Olha o picolé!', 'It’s hot, it’s hot, it’s hot!', 'Popsicles here!'],
      ['De coco, de uva, de manga?', 'Escolhe qual é!', 'Coconut, grape, mango?', 'Pick which one!'],
      ['Guaraná bem geladinho', 'Pra quem tá de pé!', 'Nice ice-cold guaraná', 'For whoever’s still on their feet!'],
      ['Quem pulou a tarde inteira', 'Descansa o pé!', 'Whoever jumped all afternoon', 'Gets to rest their feet!'] ] },
  ];
  // ================================================================ chapter 4: the route, in directions (a little graph of Alba's streets)
  // world points: the concentração on the back lane by the tower, the north street, the lane behind the bakery, the
  // market street, the plaza and round the fountain
  const ROUTE = [[-21.5, -173.0], [-12.4, -173.0], [-10.0, -171.0], [-7.8, -168.5], [8.0, -168.5], [17.0, -163.5], [21.0, -149.8], [18.0, -148.2], [9.0, -147.4], [1.4, -146.6], [-3.6, -146.3]];
  // the decisions on the way: at each, the right call and what the others would do
  const TURNS = [
    { at: 1, head: 'east', ok: 'reto', model: 'Segue reto!', modelEn: 'Go straight on!', q: 'The back lane meets the north street. Which way?', say: ['E aqui, na rua do norte?', 'And here, at the north street?'],
      no: { direita: 'That’s straight down to the plaza: too short! The bloco has to pass the market.', esquerda: 'That’s the way out of town, to the north gate!' }, after: 'Across the north street, onto the lane behind the bakery.' },
    { at: 6, head: 'south', ok: 'direita', model: 'Vira à direita!', modelEn: 'Turn right!', q: 'The lane comes down to the market street. You’re heading south. Which way?', say: ['Chegamos na rua do mercado! E agora?', 'We’ve reached the market street! Now what?'],
      no: { esquerda: 'Left is east: out of town by the east gate!', reto: 'Straight ahead there’s only a house!' }, after: 'Right, heading west: down the market street.' },
    { at: 8, head: 'west', ok: 'reto', model: 'Segue reto até a praça!', modelEn: 'Go straight on to the plaza!', q: 'All the way down the market street, past the stalls…', say: ['E depois do mercado?', 'And after the market?'],
      no: { direita: 'Right is a row of houses!', esquerda: 'Left is a row of houses!' }, after: 'Straight on, into the plaza.' },
    { at: 10, head: 'west', ok: 'volta', model: 'Dá a volta no chafariz!', modelEn: 'Go around the fountain!', q: 'You’re in the plaza. The fountain is right in front. What does the bloco do?', say: ['Chegamos na praça! E o chafariz?', 'We’re in the plaza! And the fountain?'],
      no: { reto: 'Straight into the fountain? Splash!', direita: 'Go around it! «Dá a volta…»', esquerda: 'Go around it! «Dá a volta…»' }, after: 'Round the fountain: the dispersão, where the bloco ends.' },
  ];
  // who to invite (chapter 4): sim NPCs; what to ask; what they answer; what they'll do in the parade
  const GUESTS = [
    { id: 'bruno', ask: 'You need someone strong to carry the estandarte. Ask Bruno!', model: 'Bruno, você pode carregar o estandarte?', modelEn: 'Bruno, can you carry the estandarte?', need: [['pode', 'poderia', 'consegue', 'quer'], ['estandarte', 'bandeira']], why: 'Ask him: «Você pode carregar o estandarte?»', line: 'cv.bruno.yes' },
    { id: 'baker', ask: 'Marta makes the best cheese bread in town. Ask her to make some for the bloco!', model: 'Marta, você pode fazer pão de queijo pro bloco?', modelEn: 'Marta, can you make cheese bread for the bloco?', need: [['pode', 'poderia', 'consegue', 'quer'], ['pao de queijo', 'pao', 'paes']], why: 'Ask her: «Você pode fazer pão de queijo…?»', line: 'cv.marta.yes' },
    { id: 'rosa', ask: 'Invite Dona Rosa to march in the bloco!', model: 'Dona Rosa, você quer sair no bloco?', modelEn: 'Dona Rosa, do you want to march in the bloco?', need: [['quer', 'vem', 'topa', 'vamos', 'bora'], ['bloco', 'carnaval', 'com a gente']], why: 'Invite her: «Você quer sair no bloco?»', line: 'cv.rosa.yes' },
    { id: 'kid', ask: 'Nico loves noise. Invite him to play the tamborim!', model: 'Nico, você quer tocar tamborim?', modelEn: 'Nico, do you want to play the tamborim?', need: [['quer', 'pode', 'topa', 'vem', 'bora', 'vamos'], ['tamborim', 'tocar', 'bloco']], why: 'Ask him: «Você quer tocar tamborim?»', line: 'cv.nico.yes' },
  ];
  const EMBLEMS = [
    { id: 'sino', keys: ['sino', 'sininho'], en: 'a bell' }, { id: 'estrela', keys: ['estrela', 'estrelinha', 'estrelas'], en: 'a star' },
    { id: 'peixe', keys: ['peixe', 'peixinho', 'peixes'], en: 'a fish' }, { id: 'gato', keys: ['gato', 'gatinho', 'gata'], en: 'a cat' },
    { id: 'sol', keys: ['sol'], en: 'a sun' }, { id: 'coracao', keys: ['coracao', 'coracaozinho'], en: 'a heart' }, { id: 'lua', keys: ['lua'], en: 'a moon' },
    { id: 'tambor', keys: ['tambor', 'surdo', 'tamborim'], en: 'a drum' }, { id: 'flor', keys: ['flor', 'flores', 'florzinha'], en: 'a flower' },
  ];
  // ================================================================ chapter 5: the parade's calls
  const HUSH_BEATS = [
    { id: 'forte', model: 'Mais forte!', modelEn: 'Louder!', keys: ['mais forte', 'forte', 'mais alto', 'mais barulho'], title: 'The giant swallows the drums! Tell the bateria: louder!', icon: '🥁' },
    { id: 'parada', model: 'Paradinha!', modelEn: 'The little stop!', keys: ['paradinha', 'parada', 'para tudo', 'para'], title: 'It’s still swallowing the sound. Malu: «Do the paradinha!» Stop the bateria!', icon: '✋' },
    { id: 'volta', model: 'Volta!', modelEn: 'Back in!', keys: ['volta', 'voltem', 'voltou', 'todo mundo'], title: 'Silence… the giant leans in. It thinks it won. NOW: bring the bateria back!', icon: '💥' },
    { id: 'chant', model: 'O bloco chegou!', modelEn: 'The bloco is here!', keys: ['o bloco chegou', 'bloco chegou', 'chegou'], title: 'Malu sings: «Acorda, Alba, acorda!» Answer her, and the whole street sings with you!', icon: '🎶' },
    { id: 'confete', model: 'Joga confete!', modelEn: 'Throw the confetti!', keys: ['joga confete', 'confete', 'jogar confete', 'joguem confete', 'joga serpentina'], title: 'It’s shrinking! Everyone has confetti. Tell them!', icon: '🎉' },
  ];

  // ================================================================ the Phrasebook (LEX kind 'phrase'; pt only)
  const R_CV = 'Carnaval de rua';
  const PH = [
    { id: 'ph.cv.fantasia', pt: 'Que fantasia linda!', en: 'What a lovely costume!', note: '«Fantasia» is a costume (not a fantasy!). «Linda» agrees with «fantasia».', sit: 'Malu twirls in her costume. Compliment it!' },
    { id: 'ph.cv.voto', pt: 'Eu voto no…', en: 'I vote for…', note: '«em» + «o» = «no»: «Eu voto no Bloco do Sino». For a feminine name: «na».', sit: 'Everyone’s voting on the bloco’s name. Start your vote!', keys: ['eu voto', 'voto no', 'voto na', 'voto em'] },
    { id: 'ph.cv.pular', pt: 'Vamos pular carnaval!', en: 'Let’s go and celebrate Carnival!', note: '«Pular carnaval» (literally «jump Carnival») is how Brazilians say it. Also «brincar o carnaval».', sit: 'It’s Carnival! Invite a friend to go out and celebrate.', keys: ['vamos pular carnaval', 'bora pular carnaval', 'pular carnaval'] },
    { id: 'ph.cv.paradinha', pt: 'Paradinha!', en: 'The little stop! (the whole bateria stops for a moment)', note: '«Parada» (a stop) + «-inha». Then: «Volta!»', sit: 'You’re in charge. Stop the whole bateria for a moment!' },
    { id: 'ph.cv.volta', pt: 'Volta!', en: 'Back in! / Come back!', note: 'The bateria comes back after a paradinha. To a person: «Volta aqui!» (come back here!).', sit: 'The bateria has stopped. Bring it back in!' },
    { id: 'ph.cv.forte', pt: 'Mais forte!', en: 'Louder! / Harder!', note: '«Forte» is strong; in music, loud. The opposite: «Mais baixo!» (softer).', sit: 'The drums are too quiet. Ask for more!', keys: ['mais forte'] },
    { id: 'ph.cv.todomundo', pt: 'Todo mundo junto!', en: 'Everybody together!', note: '«Todo mundo» (literally «all the world») means everybody.', sit: 'Bring the whole bateria in at once!', keys: ['todo mundo junto', 'todo mundo'] },
    { id: 'ph.cv.chegou', pt: 'O bloco chegou!', en: 'The bloco is here! (it has arrived)', note: '«Chegou» is the past of «chegar»: -ar verbs end in -ou for «ele/ela»: cantou, tocou, voltou.', sit: 'Malu sings «Acorda, Alba, acorda!». Answer her!' },
    { id: 'ph.cv.confete', pt: 'Joga confete!', en: 'Throw the confetti!', note: '«Jogar» is to throw, and also to play a game: «jogar bola».', sit: 'The bloco is coming down the street. Tell everyone to throw confetti!', keys: ['joga confete', 'joguem confete'] },
    { id: 'ph.cv.picole', pt: 'Olha o picolé!', en: 'Popsicles here! (literally «look at the popsicle!»)', note: 'How street vendors call out: «Olha a água! Olha o guaraná!»', sit: 'You’re selling popsicles at the bloco. Call out!' },
    { id: 'ph.cv.barulhao', pt: 'Que barulhão!', en: 'What a racket!', note: '-ão makes things big: barulho → barulhão. -inho makes them small: barulhinho.', sit: 'The whole bateria starts at once. Say what a huge noise it is!' },
    { id: 'ph.cv.direita', pt: 'Vira à direita!', en: 'Turn right!', note: 'Left: «Vira à esquerda!». The «à» has a grave accent (a crase).', sit: 'The bloco reaches the market street. Turn right!', keys: ['vira a direita', 'vire a direita', 'a direita'] },
    { id: 'ph.cv.reto', pt: 'Segue reto!', en: 'Go straight on!', note: 'Also «Vai reto!» or «Segue em frente!».', sit: 'The road goes straight ahead. Tell the bloco!', keys: ['segue reto', 'siga reto', 'vai reto', 'segue em frente'] },
    { id: 'ph.cv.pode', pt: 'Você pode me ajudar?', en: 'Can you help me?', note: '«Você pode + verb?» is the everyday way to ask for something: «Você pode carregar…?»', sit: 'The estandarte is heavy. Ask someone for help!', keys: ['voce pode me ajudar', 'pode me ajudar'] },
    { id: 'ph.cv.topa', pt: 'Você topa?', en: 'Are you in?', note: '«Topar» is to agree to a plan. The answer: «Topo!» (I’m in!).', sit: 'You’ve invited a friend to the bloco. Ask if they’re in!', keys: ['voce topa', 'topa'] },
    { id: 'ph.cv.abrealas', pt: 'Abram alas!', en: 'Make way!', note: 'The abre-alas opens a parade. The first famous marchinha, «Ó Abre Alas» (1899), is by Chiquinha Gonzaga, Brazil’s first woman conductor.', sit: 'The bloco is about to march. Tell the crowd to make way!', keys: ['abram alas', 'abre alas', 'abri alas'] },
    { id: 'ph.cv.viva', pt: 'Viva o carnaval!', en: 'Long live Carnival!', note: '«Viva…!» cheers anything: «Viva o bloco! Viva a Malu!»', sit: 'The bloco made it to the plaza. Cheer!', keys: ['viva o carnaval', 'viva'] },
    { id: 'ph.cv.anoquevem', pt: 'Até o ano que vem!', en: 'See you next year!', note: 'What everyone says when Carnival ends.', sit: 'Carnival is over. Say goodbye until next year!', keys: ['ate o ano que vem', 'ano que vem'] },
    { id: 'ph.cv.arrasou', pt: 'Arrasou!', en: 'You nailed it!', note: 'Literally «you flattened it». Big praise, for anyone.', register: 'slang', sit: 'Malu just led the whole bateria. Tell her she nailed it!' },
  ];
  PH.forEach(p => { p.kind = 'phrase'; p.region = p.region || R_CV; p.register = p.register || 'casual'; p.icon = 'cvMask'; });
  const PHI = Object.fromEntries(PH.map(p => [p.id, p]));
  // ================================================================ what they say (pt with the English under it; kids talk casually;
  // never about the player's gender). {mimo}: {mimo}'s name · {bloco}: the bloco's name · {tema}: its theme
  const L1 = (pt, en) => ({ pt: [pt], en: [en] });
  const LT = {
    'cv.malu.whistle': L1('Piiiii! Ei! Você aí!', 'Wheeeet! Hey! You there!'),
    'cv.malu.hi': L1('Oi! Eu sou a Malu. Tenho nove anos e vou ser mestra de bateria!', 'Hi! I’m Malu. I’m nine and I’m going to be a mestra de bateria (the leader of the drums)!'),
    'cv.malu.bloco': L1('Sabia que Alba tinha um bloco de carnaval? O bloco do meu vô!', 'Did you know Alba had a Carnival bloco? My grandpa’s bloco!'),
    'cv.malu.what': L1('Bloco é um grupo que desfila na rua no carnaval, com tambores, fantasias e marchinhas.', 'A bloco is a group that parades down the street at Carnival, with drums, costumes and marchinhas.'),
    'cv.malu.hush': L1('Mas o Silêncio chegou, e o bloco parou. Ninguém toca mais. Nem o meu vô.', 'But the Hush came, and the bloco stopped. Nobody plays anymore. Not even my grandpa.'),
    'cv.malu.vo': L1('Ele fica sentado na praça, quietinho, o dia inteiro. Nem fala mais comigo.', 'He sits in the plaza, all quiet, the whole day. He doesn’t even talk to me anymore.'),
    'cv.malu.plan': L1('Então eu decidi: vou trazer o bloco de volta! Com muito barulho!', 'So I decided: I’m bringing the bloco back! With lots of noise!'),
    'cv.malu.help': L1('Me ajuda? Primeiro, a gente precisa de fantasias!', 'Will you help me? First, we need costumes!'),
    'cv.cida.hi': L1('Oi, gente! Eu sou a Dona Cida, a costureira. Fiz as fantasias do bloco por trinta anos!', 'Hi, everyone! I’m Dona Cida, the seamstress. I made the bloco’s costumes for thirty years!'),
    'cv.cida.box': L1('Olha o baú de fantasias: máscaras, capas, coroas, perucas… e muita purpurina!', 'Look at the costume trunk: masks, capes, crowns, wigs… and lots of glitter!'),
    'cv.malu.dress': L1('Vamos montar a fantasia do {mimo}! Você escolhe.', 'Let’s put together {mimo}’s costume! You choose.'),
    'cv.malu.done1': L1('Arrasou! Agora o {bloco} tem nome, tema e fantasia!', 'Nailed it! Now the {bloco} has a name, a theme and costumes!'),
    'cv.malu.bat': L1('Bloco sem bateria não é bloco! Os instrumentos do vô tão aqui, mas ninguém toca desde que o Silêncio chegou.', 'A bloco without a bateria isn’t a bloco! Grandpa’s instruments are here, but nobody’s played since the Hush came.'),
    'cv.juca.hi': L1('Eu sou o Seu Juca. Eu tocava surdo no bloco do Tião. Faz tempo…', 'I’m Seu Juca. I used to play the surdo in Tião’s bloco. It’s been a while…'),
    'cv.malu.apito': L1('Este é o apito do vô. Com ele, a gente dá os sinais pra bateria. Hoje quem comanda é você!', 'This is grandpa’s whistle. With it, you give the bateria its signals. Today, you’re the one in charge!'),
    'cv.juca.ready': L1('Pode mandar! A gente toca o que você chamar.', 'Go ahead, give the orders! We’ll play whatever you call.'),
    'cv.malu.batdone': L1('Ouviu isso? Alba acordou um pouquinho!', 'Did you hear that? Alba woke up a little bit!'),
    'cv.juca.smile': L1('Fazia tempo que eu não sorria assim.', 'It’s been ages since I smiled like this.'),
    'cv.malu.march': L1('Agora, as marchinhas! São músicas curtas e engraçadas, pra cantar todo mundo junto.', 'Now, the marchinhas! They’re short, funny songs for everybody to sing together.'),
    'cv.malu.chiquinha': L1('A primeira marchinha famosa é de 1899: «Ó Abre Alas», da Chiquinha Gonzaga. O vô me contou!', 'The first famous marchinha is from 1899: «Ó Abre Alas», by Chiquinha Gonzaga. Grandpa told me!'),
    'cv.malu.call': L1('Eu canto, e você responde. Bem alto, pro Silêncio ouvir!', 'I sing, and you answer. Really loud, so the Hush can hear!'),
    'cv.malu.done3': L1('Agora sim! Cantando assim, ninguém fica quieto.', 'That’s more like it! Singing like that, nobody stays quiet.'),
    'cv.malu.org': L1('O carnaval tá chegando! A gente precisa organizar tudo: o caminho, os convites e o estandarte.', 'Carnival is almost here! We have to organize everything: the route, the invitations and the estandarte.'),
    'cv.malu.route': L1('O bloco sai daqui da torre e termina na praça. Mas tem que passar pela rua do mercado, onde tem mais gente!', 'The bloco leaves from here at the tower and ends in the plaza. But it has to go down the market street, where there are more people!'),
    'cv.malu.invite': L1('Agora os convites! Convida a Dona Rosa, o Bruno, a Marta e o Nico.', 'Now the invitations! Invite Dona Rosa, Bruno, Marta and Nico.'),
    'cv.malu.invite2': L1('Faltam convites! Lembra: a Dona Rosa, o Bruno, a Marta e o Nico.', 'Some invitations are still missing! Remember: Dona Rosa, Bruno, Marta and Nico.'),
    'cv.malu.stand': L1('Todo mundo topou! Agora falta o estandarte: a bandeira do bloco. Ele vai na frente, bem alto!', 'Everyone’s in! Now the estandarte is missing: the bloco’s banner. It goes at the front, held up high!'),
    'cv.malu.done4': L1('Ficou lindo! O {bloco} tá pronto pra sair.', 'It’s beautiful! The {bloco} is ready to go.'),
    'cv.bruno.yes': L1('Carregar o estandarte? Claro! Eu treino todo dia pra isso!', 'Carry the estandarte? Of course! I train every day for this!'),
    'cv.marta.yes': L1('Pão de queijo pro bloco? Pode deixar! Eu levo uma cesta cheia.', 'Cheese bread for the bloco? Leave it to me! I’ll bring a whole basket.'),
    'cv.rosa.yes': L1('Sair no bloco? Ai, que saudade! Eu desfilava no bloco do Tião quando era moça. Eu vou!', 'March in the bloco? Oh, how I’ve missed it! I marched in Tião’s bloco when I was young. I’m in!'),
    'cv.nico.yes': L1('Tocar tamborim? Eba! Vou treinar o dia inteiro!', 'Play the tamborim? Yay! I’ll practice all day long!'),
    'cv.malu.day': L1('Chegou o dia! A concentração é aqui na torre. Todo mundo pronto?', 'The day is here! The concentração, where the bloco gathers, is right here at the tower. Is everyone ready?'),
    'cv.malu.go': L1('Abram alas, que o {bloco} vai passar!', 'Make way, the {bloco} is coming through!'),
    'cv.malu.uhoh': L1('O que é aquilo?!', 'What is that?!'),
    'cv.juca.hush': L1('É o Silêncio! Virou um bonecão gigante, e tá engolindo o som da bateria!', 'It’s the Hush! It turned into a giant puppet, and it’s swallowing the bateria’s sound!'),
    'cv.malu.won': L1('Ele foi embora! O bloco venceu!', 'It’s gone! The bloco won!'),
    'cv.vo.wake': L1('Que barulho é esse? …Malu? É o meu bloco?', 'What’s all this noise? …Malu? Is that my bloco?'),
    'cv.malu.vovo': L1('Vovô! Você acordou!', 'Grandpa! You woke up!'),
    'cv.vo.heart': L1('Eu ouvi o surdo daqui da praça. O coração da bateria… e o meu voltou a bater.', 'I heard the surdo from here in the plaza. The heart of the bateria… and mine started beating again.'),
    'cv.vo.mestra': L1('Fica com o apito, Malu. A nova mestra do bloco é você.', 'Keep the whistle, Malu. The bloco’s new mestra is you.'),
    'cv.malu.gift': L1('{mimo}, esta é a minha tiara de estrelinhas. Agora é sua! Você é do bloco!', '{mimo}, this is my little-stars tiara. It’s yours now! You’re part of the bloco!'),
    'cv.malu.idle1': L1('Sabia que o tamborim é pequenininho, mas faz um barulhão?', 'Did you know the tamborim is teeny-tiny, but makes a huge racket?'),
    'cv.malu.idle2': L1('Quando eu crescer, vou ser mestra de bateria. Igual ao meu vô!', 'When I grow up, I’m going to be a mestra de bateria. Just like my grandpa!'),
    'cv.malu.idle3': L1('No carnaval, todo mundo pode ser o que quiser: pirata, sereia, astronauta…', 'At Carnival, everyone can be whatever they want: a pirate, a mermaid, an astronaut…'),
    'cv.malu.idle4': L1('O vô voltou a falar! E agora ele não para de cantar marchinha.', 'Grandpa’s talking again! And now he won’t stop singing marchinhas.'),
    'cv.vo.idle': L1('Ano que vem, o bloco sai de novo. E a mestra vai ser ela!', 'Next year, the bloco marches again. And she’ll be the mestra!'),
    'cv.malu.wait': L1('Calma! Eu ainda tô preparando. Vai explorar um pouco e depois volta!', 'Hold on! I’m still getting ready. Go explore a bit and come back later!'),
  };
  // ================================================================ the places (plain data)
  // the bell tower stands at (−26, −166), 3.6 wide; the back lane (laneNW) runs along z −173; the plaza's fountain at (−10, −146)
  const TOWER = { x: -26, z: -166 };
  const SPOT = { kid: { x: -22.5, z: -169.1, yaw: 2.3 }, surdo: { x: -25.0, z: -168.6 }, board: { x: -23.9, z: -170.35, yaw: 2.6 }, trunk: { x: -26.6, z: -169.4 },
    pole1: { x: -27.7, z: -170.1 }, pole2: { x: -21.0, z: -170.6 }, stand: { x: -20.6, z: -168.9 }, cida: { x: -25.9, z: -170.75, yaw: 0.9 },
    you2: { x: -20.7, z: -173.0 }, malu2: { x: -20.5, z: -171.75 }, vo2: { x: -23.55, z: -168.3, yaw: 2.35 } };
  const PLAZA = { x: -10, z: -146 };
  // Vô Tião's bench: the plaza's west bench (town.js puts benches at 9.4 from the fountain, every so often; this one at 200°)
  const VO = (() => { const a = 200 * Math.PI / 180, x = PLAZA.x + Math.cos(a) * 9.4, z = PLAZA.z + Math.sin(a) * 9.4; return { x, z, yaw: Math.atan2(PLAZA.x - x, PLAZA.z - z) }; })();
  // the bateria for chapter 2: two rows of four in the back lane, facing west (toward you, in charge)
  const BAT_AT = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) BAT_AT.push({ x: -18.4 + c * 1.3, z: -172.35 - r * 1.35 });
  let G = null, B = null;
  const S = () => { const s = G.state; if (!s.cv) s.cv = {}; const o = s.cv; o.ch = o.ch || {}; o.inv = o.inv || {}; o.doll = o.doll || {}; return o; };
  const shown = () => !!(G && G.state && G.state.lang === 'pt' && G.state.flags && G.state.flags.hatched);
  const flags = () => (G && G.state && G.state.flags) || {};
  const blocoOf = () => BLOCOS.find(b => G && G.state.cv && b.id === G.state.cv.bloco) || null;
  const temaOf = () => TEMAS.find(t => G && G.state.cv && t.id === G.state.cv.tema) || TEMAS[0];
  const blocoName = () => (blocoOf() || { name: 'Bloco da Malu' }).name;
  const fill = s => String(s).replace(/\{mimo\}/g, () => MIMO()).replace(/\{bloco\}/g, () => blocoName()).replace(/\{tema\}/g, () => temaOf().name);
  const lineOf = key => { const v = LT[key]; if (!v) return { pt: key, en: key }; const tier = typeof LEX !== 'undefined' && LEX.tier ? LEX.tier() : 1, n = Math.max(1, Math.min(tier, v.pt.length)) - 1; return { pt: fill(v.pt[n]), en: fill(v.en[Math.min(n, v.en.length - 1)]) }; };
  const STAR_GEO = (() => { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.42 : 1; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); } sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: false }); g.translate(0, 0, -0.175); return g; })();

  // ================================================================ icons (paper cutouts: the faces for the panels, the instruments)
  function registerIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const add = (k, fn) => { if (!ICONS.keys.includes(k)) ICONS.add(k, fn); };
    const star = (c, x, y, r, col, h, p) => h.shape(c, p, cc => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; i ? cc.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : cc.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } cc.closePath(); }, col, 1.6);
    add('cvKid', (c, p, h) => {     // Malu: two hair puffs with yellow scrunchies, her star tiara
      h.shape(c, p, h.ell(-27, -20, 15, 15), '#2b1d18'); h.shape(c, p, h.ell(27, -20, 15, 15), '#2b1d18');
      h.shape(c, p, h.ell(0, 6, 27, 29), '#a8714a');
      h.shape(c, p, cc => { cc.moveTo(-27, -2); cc.bezierCurveTo(-28, -32, 28, -32, 27, -2); cc.quadraticCurveTo(0, -16, -27, -2); cc.closePath(); }, '#2b1d18');
      h.shape(c, p, h.ell(-19, -12, 5, 4), '#ffd23f'); h.shape(c, p, h.ell(19, -12, 5, 4), '#ffd23f');
      if (!p) return;
      c.beginPath(); c.moveTo(-10, -24); c.lineTo(-14, -38); c.moveTo(10, -24); c.lineTo(14, -38); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke();
      star(c, -14, -40, 6, '#ffd23f', h, 1); star(c, 14, -40, 6, '#ff6fae', h, 1);
      h.dot(c, -9, 6, 3.4, h.INK); h.dot(c, 9, 6, 3.4, h.INK); h.dot(c, -8, 5, 1.2, '#fff'); h.dot(c, 10, 5, 1.2, '#fff');
      h.dot(c, -16, 15, 4.5, 'rgba(255,120,170,0.55)'); h.dot(c, 16, 15, 4.5, 'rgba(255,120,170,0.55)');
      [[-17, 11], [18, 11], [-14, 18]].forEach(([x, y]) => h.dot(c, x, y, 1.2, '#ffe680'));
      c.beginPath(); c.arc(0, 14, 8, 0.15, Math.PI - 0.15); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke();
    });
    add('cvVo', (c, p, h) => {      // Vô Tião: a Panama hat, a white mustache
      h.shape(c, p, h.ell(0, 8, 25, 27), '#7a4a32');
      h.shape(c, p, h.ell(0, -16, 40, 8), '#f3ead2'); h.shape(c, p, h.rr(-21, -38, 42, 22, 8), '#f3ead2'); h.shape(c, p, h.rr(-21, -22, 42, 6, 2), '#2b2235');
      if (!p) return;
      h.dot(c, -9, 6, 3, h.INK); h.dot(c, 9, 6, 3, h.INK);
      h.shape(c, 1, h.ell(-7, 18, 8, 3.5, 0.2), '#ece8e0', 1.4); h.shape(c, 1, h.ell(7, 18, 8, 3.5, -0.2), '#ece8e0', 1.4);
      c.beginPath(); c.moveTo(-14, -2); c.lineTo(-5, -1); c.moveTo(14, -2); c.lineTo(5, -1); c.lineWidth = 2.4; c.strokeStyle = '#ece8e0'; c.stroke();
    });
    add('cvCida', (c, p, h) => {    // Dona Cida: a gray bun, glasses, a tape measure round her neck
      h.shape(c, p, h.ell(0, -30, 13, 10), '#cfcbd4'); h.shape(c, p, h.ell(0, 6, 26, 28), '#e8b48a');
      h.shape(c, p, cc => { cc.moveTo(-26, 0); cc.bezierCurveTo(-26, -30, 26, -30, 26, 0); cc.quadraticCurveTo(0, -14, -26, 0); cc.closePath(); }, '#cfcbd4');
      h.shape(c, p, h.rr(-24, 30, 48, 7, 3), '#ffd23f');
      if (!p) return;
      [-10, 10].forEach(x => { c.beginPath(); c.arc(x, 6, 7, 0, TAU); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke(); h.dot(c, x, 6, 2.4, h.INK); });
      c.beginPath(); c.arc(0, 16, 7, 0.2, Math.PI - 0.2); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke();
    });
    add('cvJuca', (c, p, h) => {    // Seu Juca: a cap, a round gray beard
      h.shape(c, p, h.ell(0, 10, 28, 26), '#c98e62'); h.shape(c, p, h.ell(0, 22, 22, 13), '#bdb8c4');
      h.shape(c, p, cc => { cc.moveTo(-27, -4); cc.bezierCurveTo(-27, -34, 27, -34, 27, -4); cc.closePath(); }, '#19b37a'); h.shape(c, p, h.rr(-6, -8, 40, 7, 3), '#19b37a');
      if (!p) return;
      h.dot(c, -9, 6, 3, h.INK); h.dot(c, 9, 6, 3, h.INK);
      c.beginPath(); c.arc(0, 20, 6, 0.2, Math.PI - 0.2); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke();
    });
    add('cvMask', (c, p, h) => {    // a carnival mask on a stick (the Phrasebook's icon)
      if (p) { c.beginPath(); c.moveTo(24, 8); c.lineTo(34, 40); c.lineWidth = 4; c.strokeStyle = '#8a5f3e'; c.stroke(); }
      h.shape(c, p, cc => { cc.moveTo(-38, -6); cc.bezierCurveTo(-34, -26, -10, -22, 0, -12); cc.bezierCurveTo(10, -22, 34, -26, 38, -6); cc.bezierCurveTo(34, 14, 10, 14, 0, 4); cc.bezierCurveTo(-10, 14, -34, 14, -38, -6); cc.closePath(); }, '#ff4f9a');
      if (!p) return;
      h.shape(c, 1, h.ell(-17, -4, 8, 5), '#2b2235', 1.2); h.shape(c, 1, h.ell(17, -4, 8, 5), '#2b2235', 1.2);
      star(c, 0, -24, 8, '#ffd23f', h, 1);
      [[-30, -14], [30, -14], [-26, 6], [26, 6]].forEach(([x, y]) => h.dot(c, x, y, 2.2, '#ffd23f'));
    });
    // the eight instruments
    add('cv_surdo', (c, p, h) => {
      h.shape(c, p, h.rr(-30, -16, 60, 46, 6), '#d6332a'); h.shape(c, p, h.ell(0, -16, 30, 9), '#f4ecd8'); h.shape(c, p, h.rr(-31, 24, 62, 7, 3), '#c8ced8');
      if (p) { for (let i = 0; i < 5; i++) { const x = -24 + i * 12; c.beginPath(); c.moveTo(x, -8); c.lineTo(x + 6, 22); c.lineWidth = 1.6; c.strokeStyle = '#c8ced8'; c.stroke(); } c.beginPath(); c.moveTo(14, -26); c.lineTo(34, -42); c.lineWidth = 4; c.strokeStyle = '#8a5f3e'; c.stroke(); h.dot(c, 13, -25, 6, '#f4ecd8'); }
    });
    add('cv_caixa', (c, p, h) => {
      h.shape(c, p, h.rr(-32, -6, 64, 26, 5), '#c8ced8'); h.shape(c, p, h.ell(0, -6, 32, 9), '#fbf8f2');
      if (p) { c.beginPath(); c.moveTo(-30, -36); c.lineTo(6, -10); c.moveTo(30, -36); c.lineTo(-6, -10); c.lineWidth = 3.4; c.strokeStyle = '#8a5f3e'; c.stroke(); for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-26 + i * 10, 0); c.lineTo(-22 + i * 10, 18); c.lineWidth = 1.4; c.strokeStyle = '#8a8f9e'; c.stroke(); } }
    });
    add('cv_repique', (c, p, h) => {
      h.shape(c, p, h.rr(-18, -22, 36, 54, 5), '#c8ced8'); h.shape(c, p, h.ell(0, -22, 18, 6), '#fbf8f2');
      if (p) { c.beginPath(); c.moveTo(4, -28); c.lineTo(32, -40); c.lineWidth = 3.4; c.strokeStyle = '#8a5f3e'; c.stroke(); [-8, 4].forEach(x => { c.beginPath(); c.moveTo(x, -14); c.lineTo(x + 6, 26); c.lineWidth = 1.4; c.strokeStyle = '#8a8f9e'; c.stroke(); }); }
    });
    add('cv_tamborim', (c, p, h) => {
      h.shape(c, p, h.ell(-6, 4, 26, 26), '#2b2235'); h.shape(c, p, h.ell(-6, 4, 21, 21), '#fbf8f2');
      if (p) { c.beginPath(); c.moveTo(4, 0); c.lineTo(36, -34); c.lineWidth = 3; c.strokeStyle = '#3a3346'; c.stroke(); c.beginPath(); c.moveTo(6, -2); c.lineTo(38, -30); c.lineWidth = 1.5; c.stroke(); }
    });
    add('cv_agogo', (c, p, h) => {
      if (p) { c.beginPath(); c.moveTo(-14, -28); c.quadraticCurveTo(0, -46, 14, -24); c.lineWidth = 4; c.strokeStyle = '#b8862a'; c.stroke(); }
      h.shape(c, p, cc => { cc.moveTo(-22, -26); cc.lineTo(-6, -26); cc.lineTo(-2, 30); cc.lineTo(-26, 30); cc.closePath(); }, '#e8b828');
      h.shape(c, p, cc => { cc.moveTo(8, -20); cc.lineTo(20, -20); cc.lineTo(26, 22); cc.lineTo(2, 22); cc.closePath(); }, '#e8b828');
      if (p) { h.dot(c, -14, 22, 3, 'rgba(255,255,255,0.6)'); h.dot(c, 14, 15, 3, 'rgba(255,255,255,0.6)'); }
    });
    add('cv_pandeiro', (c, p, h) => {
      h.shape(c, p, h.ell(0, 2, 34, 34), '#b07a48'); h.shape(c, p, h.ell(0, 2, 27, 27), '#fbf3e0');
      if (p) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; h.shape(c, 1, h.ell(Math.cos(a) * 30.5, 2 + Math.sin(a) * 30.5, 4.5, 4.5), '#c8ced8', 1.2); }
    });
    add('cv_cuica', (c, p, h) => {
      h.shape(c, p, h.rr(-28, -20, 46, 44, 5), '#c8ced8'); h.shape(c, p, h.ell(18, 2, 7, 22), '#fbf8f2');
      if (p) { c.beginPath(); c.moveTo(14, 2); c.lineTo(-18, 2); c.lineWidth = 3; c.strokeStyle = '#8a5f3e'; c.stroke(); [[28, -18], [34, -6], [30, 10]].forEach(([x, y], i) => { c.beginPath(); c.arc(x, y, 5 + i * 2, -0.9, 0.9); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke(); }); }
    });
    add('cv_chocalho', (c, p, h) => {
      h.shape(c, p, h.rr(-34, -18, 58, 34, 4), '#8a5f3e'); h.shape(c, p, h.rr(24, -6, 14, 10, 3), '#8a5f3e');
      if (p) for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) h.shape(c, 1, h.ell(-24 + i * 13, -8 + r * 15, 5, 5), '#c8ced8', 1.2);
    });
  }

  // ================================================================ painted cloth: the chalkboard, the estandarte, the abre-alas banner
  const CV_COL = c => (COLORS.find(x => x.id === c) || {}).hex || c;
  function drawEmblem(c, id, x, y, s, col) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = c.lineCap = 'round'; c.lineWidth = 5; c.strokeStyle = '#2b2235'; c.fillStyle = col;
    const P = f => { c.beginPath(); f(); c.fill(); c.stroke(); };
    if (id === 'sino') { P(() => { c.moveTo(-34, 30); c.bezierCurveTo(-30, -10, -22, -40, 0, -40); c.bezierCurveTo(22, -40, 30, -10, 34, 30); c.closePath(); }); P(() => c.arc(0, 36, 9, 0, TAU)); }
    else if (id === 'estrela') P(() => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 20 : 46; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); });
    else if (id === 'peixe') { P(() => { c.ellipse(-6, 0, 34, 22, 0, 0, TAU); }); P(() => { c.moveTo(24, 0); c.lineTo(46, -20); c.lineTo(46, 20); c.closePath(); }); c.fillStyle = '#2b2235'; c.beginPath(); c.arc(-22, -5, 4, 0, TAU); c.fill(); }
    else if (id === 'gato') { P(() => { c.arc(0, 6, 32, 0, TAU); }); P(() => { c.moveTo(-28, -10); c.lineTo(-26, -44); c.lineTo(-6, -24); c.closePath(); }); P(() => { c.moveTo(28, -10); c.lineTo(26, -44); c.lineTo(6, -24); c.closePath(); }); c.fillStyle = '#2b2235'; [-11, 11].forEach(ex => { c.beginPath(); c.arc(ex, 2, 4, 0, TAU); c.fill(); }); }
    else if (id === 'sol') { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); c.lineTo(Math.cos(a) * 46, Math.sin(a) * 46); c.stroke(); } P(() => c.arc(0, 0, 26, 0, TAU)); }
    else if (id === 'coracao') P(() => { c.moveTo(0, 36); c.bezierCurveTo(-50, 0, -30, -44, 0, -16); c.bezierCurveTo(30, -44, 50, 0, 0, 36); c.closePath(); });
    else if (id === 'lua') P(() => { c.arc(0, 0, 38, 0.6, TAU - 0.6); c.arc(16, 0, 28, TAU - 0.9, 0.9, true); c.closePath(); });
    else if (id === 'tambor') { P(() => { c.rect(-34, -16, 68, 48); }); P(() => c.ellipse(0, -16, 34, 10, 0, 0, TAU)); }
    else if (id === 'flor') { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; P(() => c.arc(Math.cos(a) * 22, Math.sin(a) * 22, 15, 0, TAU)); } c.fillStyle = '#ffd23f'; P(() => c.arc(0, 0, 14, 0, TAU)); }
    c.restore();
  }
  // the estandarte: o = { cols: [main, second], emblem, name }
  function drawStandard(c, W, H, o) {
    const [a, b] = (o.cols && o.cols.length ? o.cols : temaOf().cols).map(CV_COL).concat(['#ffd23f']);
    c.fillStyle = a === 'rainbow' ? '#ff4f9a' : a; c.fillRect(0, 0, W, H);
    c.strokeStyle = b === 'rainbow' ? '#ffd23f' : b; c.lineWidth = W * 0.06; c.strokeRect(W * 0.05, W * 0.05, W * 0.9, H - W * 0.1);
    // the scalloped bottom edge
    c.fillStyle = b === 'rainbow' ? '#ffd23f' : b; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(W * (i + 0.5) / 6, H, W / 12, Math.PI, 0); c.fill(); }
    if (o.emblem) drawEmblem(c, o.emblem, W / 2, H * 0.42, W / 220, b === 'rainbow' || b === a ? '#ffffff' : (b === '#fbf8f2' ? '#ffd23f' : b));
    if (o.name) {
      c.fillStyle = '#fffaf0'; c.strokeStyle = '#2b2235'; c.lineWidth = 6; c.textAlign = 'center'; c.textBaseline = 'middle';
      const words = o.name.split(' '), lines = []; let cur = '';
      for (const w of words) { const t = cur ? cur + ' ' + w : w; if (t.length > 11 && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur);
      const px = Math.min(36, (W * 0.8) / Math.max(...lines.map(l => l.length)) * 1.6);
      c.font = `900 ${px}px Bahnschrift, "Segoe UI", sans-serif`;
      lines.forEach((l, i) => { const y = H * 0.74 + (i - (lines.length - 1) / 2) * px * 1.05; c.strokeText(l, W / 2, y); c.fillText(l, W / 2, y); });
    }
  }
  function drawBanner(c, W, H, text) {
    const cols = temaOf().cols;
    c.fillStyle = '#fffaf0'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 14; i++) { c.fillStyle = cols[i % cols.length]; c.fillRect(i * W / 14, 0, W / 14 + 1, H * 0.12); c.fillRect(i * W / 14, H * 0.88, W / 14 + 1, H * 0.12); }
    c.fillStyle = '#d6286f'; c.textAlign = 'center'; c.textBaseline = 'middle';
    let px = H * 0.42; c.font = `900 ${px}px Bahnschrift, "Segoe UI", sans-serif`;
    while (px > 12 && c.measureText(text).width > W * 0.92) { px -= 2; c.font = `900 ${px}px Bahnschrift, "Segoe UI", sans-serif`; }
    c.fillText(text, W / 2, H / 2 + 2);
  }
  // the chalkboard by the HQ: what's been decided so far
  function drawBoard(c, W, H) {
    const st = G && G.state && G.state.cv ? G.state.cv : {}, b = blocoOf();
    c.fillStyle = '#26473a'; c.fillRect(0, 0, W, H); c.strokeStyle = '#8a5f3e'; c.lineWidth = 14; c.strokeRect(0, 0, W, H);
    c.fillStyle = '#f4f1ea'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '800 30px "Segoe Print", "Comic Sans MS", sans-serif';
    c.fillText('QG DO BLOCO', W / 2, 34);
    c.font = '700 22px "Segoe Print", "Comic Sans MS", sans-serif';
    const rows = b ? [b.name, 'Tema: ' + temaOf().name] : ['Nome: ???', 'Tema: ???'];
    if (st.ch && st.ch[4]) rows.push('Torre → mercado → praça');
    else if (st.ch && st.ch[2]) rows.push('Bateria: OK!');
    rows.forEach((r, i) => c.fillText(r, W / 2, 80 + i * 36));
    const cols = ['#ff6fae', '#ffd23f', '#7fe0ff'];
    for (let i = 0; i < 18; i++) { c.fillStyle = cols[i % 3]; c.beginPath(); c.arc(20 + (i * 53) % (W - 40), H - 18 - (i % 3) * 6, 3, 0, TAU); c.fill(); }
  }

  // ================================================================ instruments in 3D (held by the bateria)
  // each returns a group to put in the player's hands / at the belly (local to the person's body)
  function instrument(id) {
    const g = new THREE.Group(), k = ZHF.Kit(), METAL = '#c8ced8', HEAD = '#f4ecd8', WOOD = '#8a5f3e';
    if (id === 'surdo') { k.add(ZHF.GEO.cyl, '#d6332a', 0, 0.62, 0.36, 0.27, 0.42, 0.27, 0, 0, 0, { ink: 0.014 }).add(ZHF.GEO.cyl, HEAD, 0, 0.84, 0.36, 0.26, 0.02, 0.26, 0, 0, 0, { ink: 0 }); for (const y of [0.42, 0.82]) k.add(ZHF.GEO.cyl, METAL, 0, y, 0.36, 0.28, 0.04, 0.28, 0, 0, 0, { ink: 0 }); k.rod([0, 1.05, 0.05], [0, 0.82, 0.36], 0.012, '#2b2235', { ink: 0 }); }
    else if (id === 'caixa') { k.add(ZHF.GEO.cyl, METAL, 0.05, 0.6, 0.3, 0.2, 0.14, 0.2, 0.25, 0, 0, { ink: 0.012 }).add(ZHF.GEO.cyl, '#fbf8f2', 0.05, 0.67, 0.32, 0.19, 0.015, 0.19, 0.25, 0, 0, { ink: 0 }); }
    else if (id === 'repique') { k.add(ZHF.GEO.cyl, METAL, 0.08, 0.62, 0.28, 0.16, 0.3, 0.16, 0.35, 0, 0, { ink: 0.012 }).add(ZHF.GEO.cyl, '#fbf8f2', 0.08, 0.76, 0.33, 0.15, 0.015, 0.15, 0.35, 0, 0, { ink: 0 }); }
    else if (id === 'cuica') { k.add(ZHF.GEO.cyl, METAL, -0.22, 0.78, 0.1, 0.13, 0.32, 0.13, Math.PI / 2, 0, 0, { ink: 0.012 }).add(ZHF.GEO.cyl, '#fbf8f2', -0.22, 0.78, 0.27, 0.12, 0.015, 0.12, Math.PI / 2, 0, 0, { ink: 0 }); }
    else if (id === 'chocalho') { k.box(0, 0.88, 0.32, 0.5, 0.18, 0.04, WOOD, { ink: 0.01 }); for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) k.add(ZHF.GEO.cyl, METAL, -0.2 + i * 0.1, 0.84 + r * 0.08, 0.35, 0.035, 0.01, 0.035, Math.PI / 2, 0, 0, { ink: 0 }); }
    else if (id === 'pandeiro') { k.add(ZHF.GEO.cyl, '#b07a48', 0.14, 1.05, 0.32, 0.21, 0.06, 0.21, Math.PI / 2 - 0.3, 0, 0.2, { ink: 0.012 }).add(ZHF.GEO.cyl, '#fbf3e0', 0.14, 1.05, 0.36, 0.18, 0.02, 0.18, Math.PI / 2 - 0.3, 0, 0.2, { ink: 0 }); }
    else if (id === 'tamborim') { k.add(ZHF.GEO.cyl, '#2b2235', -0.2, 1.0, 0.32, 0.14, 0.05, 0.14, Math.PI / 2 - 0.4, 0, 0, { ink: 0.01 }).add(ZHF.GEO.cyl, '#fbf8f2', -0.2, 1.0, 0.35, 0.125, 0.012, 0.125, Math.PI / 2 - 0.4, 0, 0, { ink: 0 }).rod([0.2, 0.8, 0.3], [0.02, 1.12, 0.42], 0.012, '#3a3346', { ink: 0 }); }
    else if (id === 'agogo') { k.cone(-0.24, 1.04, 0.32, 0.08, 0.26, '#e8b828', { rx: Math.PI, ink: 0.01 }).cone(-0.1, 1.0, 0.32, 0.065, 0.2, '#e8b828', { rx: Math.PI, ink: 0.01 }).rod([-0.24, 1.18, 0.32], [-0.1, 1.11, 0.32], 0.012, '#b8862a', { ink: 0 }).rod([0.2, 0.8, 0.3], [-0.05, 1.05, 0.42], 0.012, '#8a5f3e', { ink: 0 }); }
    ZHF.bake(g, k); return g;
  }

  // ================================================================ the HQ, Malu, Vô Tião, the neighbors, the bateria
  const LOOK = {
    malu: { kid: true, skin: '#a8714a', hair: '#2b1d18', shirt: '#ffd23f', sleeve: '#ffd23f', pants: '#ff6fae', shoes: '#19b37a', collar: '#19b37a' },
    vo: { skin: '#7a4a32', hair: '#e8e4dc', shirt: '#fbf8f2', sleeve: '#fbf8f2', pants: '#3a3346', shoes: '#2b2235', old: true, mustache: true, brow: '#e8e4dc' },
    cida: { skin: '#e8b48a', hair: '#cfcbd4', shirt: '#8a4fd8', sleeve: '#8a4fd8', pants: '#3f4a5a', shoes: '#2b2235', glasses: true, old: true, apron: '#fff4dc' },
    juca: { skin: '#c98e62', hair: '#bdb8c4', hat: 'flat', hatCol: '#19b37a', shirt: '#ffd23f', sleeve: '#ffd23f', pants: '#2f3a4a', belly: true, mustache: true, old: true, wide: 1.1 },
  };
  // the eight in the bateria (Seu Juca on the surdo), each a neighbor in the bloco's old yellow-and-green T-shirt
  const BAT_LOOKS = [
    ['surdo', 'juca'], ['caixa', { skin: '#8d5a3c', hair: '#2b1d18', shirt: '#ffd23f', pants: '#26336a', shoes: '#f4f1ea' }], ['repique', { skin: '#f0c7a0', hair: '#6b3b25', shirt: '#19b37a', pants: '#2f3a4a', shoes: '#2b2235' }],
    ['tamborim', { skin: '#5e3a28', hair: '#1d1512', shirt: '#ffd23f', pants: '#3f4a5a', shoes: '#ff6fae', kid: true }], ['agogo', { skin: '#e8b48a', hair: '#c98a4a', shirt: '#19b37a', pants: '#26336a', shoes: '#2b2235' }],
    ['pandeiro', { skin: '#b07a52', hair: '#2b2235', shirt: '#ffd23f', pants: '#2f3a4a', shoes: '#f4f1ea', glasses: true }], ['cuica', { skin: '#7a4a32', hair: '#2b1d18', shirt: '#19b37a', pants: '#3a3346', shoes: '#2b2235', mustache: true }],
    ['chocalho', { skin: '#f5cda2', hair: '#3a2b26', shirt: '#ffd23f', pants: '#26336a', shoes: '#19b37a' }],
  ];
  const grayOf = hex => { const c = new THREE.Color(hex), l = c.r * 0.3 + c.g * 0.55 + c.b * 0.15; return '#' + c.lerp(new THREE.Color(l * 0.86, l * 0.86, l * 0.95), 0.88).getHexString(); };
  const grayLook = L => Object.fromEntries(Object.entries(L).map(([k, v]) => [k, typeof v === 'string' && v[0] === '#' ? grayOf(v) : v]));
  function malu(gy) {
    const p = ZHF.person(LOOK.malu); p.id = 'malu'; p.nameSrc = NAMES.malu; p.story = true; p.kidP = true;
    const k = ZHF.Kit(), r = 0.275, H = LOOK.malu.hair;
    for (const s of [-1, 1]) { k.ball(s * 0.2, 0.2, -0.05, 0.13, 0.13, 0.13, H, { ink: 0.012 }); k.add(ZHF.GEO.tor, '#ffd23f', s * 0.15, 0.15, -0.04, 0.06, 0.06, 0.06, 0, 0, s * 0.8, { ink: 0 }); }
    // the tiara: a band of sequins over the head, two springs, two little stars
    for (let i = 0; i <= 6; i++) { const a = Math.PI * (0.15 + 0.7 * i / 6); k.ball(Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02 + 0.03, 0.04, 0.025, 0.025, 0.025, i % 2 ? '#ff6fae' : '#ffd23f', { ink: 0 }); }
    for (const s of [-1, 1]) { k.rod([s * 0.07, r + 0.02, 0.04], [s * 0.12, r + 0.2, 0.06], 0.008, '#c8ced8', { ink: 0 }); k.add(STAR_GEO, s < 0 ? '#ffd23f' : '#ff6fae', s * 0.12, r + 0.24, 0.06, 0.06, 0.06, 0.06, 0, 0, 0, { ink: 0 }); }
    ZHF.bake(p.head, k);
    // the tulle skirt and the whistle on its cord
    const kb = ZHF.Kit(); kb.cone(0, p.hipY - 0.02, 0, 0.32, 0.26, '#ff8fc4', { ink: 0.01 }).cone(0, p.hipY + 0.02, 0, 0.28, 0.2, '#ffb3d6', { ink: 0 });
    kb.rod([-0.08, p.shY + 0.1, 0.12], [0, p.shY - 0.12, 0.25], 0.006, '#19b37a', { ink: 0 }).rod([0.08, p.shY + 0.1, 0.12], [0, p.shY - 0.12, 0.25], 0.006, '#19b37a', { ink: 0 }).add(ZHF.GEO.cyl, '#c8ced8', 0, p.shY - 0.15, 0.26, 0.03, 0.07, 0.03, Math.PI / 2, 0, 0, { ink: 0.005 });
    ZHF.bake(p.body, kb);
    // her toy tamborim and its stick (the right hand)
    const toy = new THREE.Group(), kt = ZHF.Kit(); kt.add(ZHF.GEO.cyl, '#2b2235', 0, 0, 0.06, 0.09, 0.035, 0.09, Math.PI / 2, 0, 0, { ink: 0.006 }).add(ZHF.GEO.cyl, '#fbf8f2', 0, 0, 0.08, 0.08, 0.01, 0.08, Math.PI / 2, 0, 0, { ink: 0 }); ZHF.bake(toy, kt); p.arms[0].userData.hand.add(toy); p.toy = toy;
    const stick = new THREE.Group(), ks = ZHF.Kit(); ks.rod([0, 0, 0], [0, 0.02, 0.24], 0.01, '#3a3346', { ink: 0 }); ZHF.bake(stick, ks); p.arms[1].userData.hand.add(stick); p.stick = stick;
    p.x = SPOT.kid.x; p.z = SPOT.kid.z; p.y = gy(p.x, p.z); p.yaw = p.baseYaw = SPOT.kid.yaw;
    return p;
  }
  // Vô Tião on the bench: a Panama hat with a black band; gray (hushed) until the parade, then in color
  function vo(gy, gray) {
    const L = gray ? grayLook(LOOK.vo) : LOOK.vo, p = ZHF.person(L, gray ? { sit: true, seatY: 0.55 } : {}), k = ZHF.Kit(), r = 0.25;
    const hat = gray ? grayOf('#f3ead2') : '#f3ead2', band = gray ? grayOf('#2b2235') : '#2b2235';
    k.add(ZHF.GEO.cyl, hat, 0, r * 0.62, -0.01, 0.36, 0.025, 0.36, -0.08, 0, 0, { ink: 0.008 }).add(ZHF.GEO.cyl, hat, 0, r * 0.88, -0.01, 0.2, 0.2, 0.2, -0.08, 0, 0, { ink: 0.01 }).add(ZHF.GEO.cyl, band, 0, r * 0.74, -0.01, 0.205, 0.05, 0.205, -0.08, 0, 0, { ink: 0 });
    ZHF.bake(p.head, k);
    p.id = gray ? 'voGray' : 'vo'; p.nameSrc = NAMES.vo; p.story = !gray; p.hushed = !!gray;
    if (gray) { const back = 0.12; p.x = VO.x + Math.sin(VO.yaw) * back; p.z = VO.z + Math.cos(VO.yaw) * back; p.yaw = p.baseYaw = VO.yaw; p.noTurn = true; }
    else { p.x = SPOT.vo2.x; p.z = SPOT.vo2.z; p.yaw = p.baseYaw = SPOT.vo2.yaw; }      // (awake: he stands with Malu at the HQ)
    p.y = gy(p.x, p.z);
    return p;
  }
  function neighbor(look, id, at, gy) {
    const L = typeof look === 'string' ? LOOK[look] : look, p = ZHF.person(L);
    p.id = id; p.nameSrc = NAMES[id] || ''; p.x = at.x; p.z = at.z; p.y = gy(at.x, at.z); p.yaw = p.baseYaw = at.yaw || 0; p.story = !!NAMES[id];
    return p;
  }
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    const root = new THREE.Group(); root.name = 'carnaval'; scene.add(root); root.visible = false;
    const colliders = [], solid = c => { c.x0 = c.x; c.z0 = c.z; colliders.push(c); return c; };
    const k = ZHF.Kit();
    // ---------------- the old surdo under a tarp, on its stand
    const D = SPOT.surdo, dy = gy(D.x, D.z);
    k.frame(D.x, dy, D.z, 0.4);
    k.rod([-0.3, 0, -0.3], [-0.24, 0.42, -0.24], 0.025, '#4a3a33').rod([0.3, 0, -0.3], [0.24, 0.42, -0.24], 0.025, '#4a3a33').rod([0, 0, 0.36], [0, 0.42, 0.24], 0.025, '#4a3a33');
    k.add(ZHF.GEO.cyl, '#b83a2e', 0, 0.72, 0, 0.36, 0.56, 0.36, 0, 0, 0, { ink: 0.016 }).add(ZHF.GEO.cyl, '#f4ecd8', 0, 1.005, 0, 0.35, 0.02, 0.35, 0, 0, 0, { ink: 0 });
    for (const y of [0.45, 0.99]) k.add(ZHF.GEO.cyl, '#c8ced8', 0, y, 0, 0.375, 0.05, 0.375, 0, 0, 0, { ink: 0 });
    k.box(0.12, 1.04, 0.05, 0.62, 0.05, 0.5, '#5f7f9a', { rz: 0.12, ry: 0.3, ink: 0.008 }).box(-0.28, 0.8, 0.08, 0.06, 0.5, 0.46, '#5f7f9a', { rz: 0.06, ink: 0.006 });
    k.rod([0.32, 1.08, -0.1], [0.62, 1.32, -0.3], 0.02, '#8a5f3e', { ink: 0 }).ball(0.3, 1.07, -0.08, 0.06, 0.06, 0.06, '#f4ecd8', { ink: 0.006 });
    k.free();
    // ---------------- the costume trunk (o baú de fantasias), lid open, things spilling out
    const T = SPOT.trunk, ty = gy(T.x, T.z);
    k.frame(T.x, ty, T.z, 0.35);
    k.box(0, 0.24, 0, 0.9, 0.48, 0.55, '#8a5f3e', { ink: 0.014 }).box(0, 0.5, 0, 0.94, 0.04, 0.59, '#6b4a33', { ink: 0.006 }).box(0, 0.75, -0.3, 0.94, 0.5, 0.04, '#8a5f3e', { rx: -0.25, ink: 0.01 });
    k.box(-0.18, 0.52, 0.08, 0.4, 0.1, 0.32, '#ff4f9a', { rz: 0.2, ink: 0.006 }).box(0.2, 0.55, 0.0, 0.32, 0.12, 0.3, '#2f7fe0', { rz: -0.15, ink: 0.006 }).box(0.0, 0.33, 0.33, 0.55, 0.3, 0.04, '#8a4fd8', { rx: 0.4, ink: 0.006 });
    k.ball(0.3, 0.62, 0.12, 0.09, 0.06, 0.09, '#ffd23f', { ink: 0.006 }).ball(-0.35, 0.6, -0.05, 0.11, 0.09, 0.11, '#ff8a2a', { ink: 0.006 });
    k.free();
    // ---------------- the chalkboard on its easel (painted in update when things are decided)
    const Bd = SPOT.board, by = gy(Bd.x, Bd.z);
    k.frame(Bd.x, by, Bd.z, Bd.yaw); k.rod([-0.36, 0, -0.14], [-0.28, 1.55, 0], 0.025, '#8a5f3e').rod([0.36, 0, -0.14], [0.28, 1.55, 0], 0.025, '#8a5f3e').rod([0, 0, 0.32], [0, 1.45, 0.02], 0.025, '#8a5f3e').box(0, 0.6, 0.04, 0.8, 0.04, 0.12, '#8a5f3e'); k.free();
    const boardTex = ZHF.canvasTex(512, 320, (c, w, h) => drawBoard(c, w || 512, h || 320));
    const board = ZHF.plane(0.86, 0.54, boardTex); board.position.set(Bd.x + Math.sin(Bd.yaw) * 0.07, by + 1.07, Bd.z + Math.cos(Bd.yaw) * 0.07); board.rotation.set(-0.1, Bd.yaw, 0, 'YXZ'); root.add(board);
    // ---------------- a string of streamers and little paper masks between two poles
    const p1 = SPOT.pole1, p2 = SPOT.pole2, y1 = gy(p1.x, p1.z), y2 = gy(p2.x, p2.z);
    k.rod([p1.x, y1, p1.z], [p1.x, y1 + 2.8, p1.z], 0.045, '#ff4f9a').rod([p2.x, y2, p2.z], [p2.x, y2 + 2.8, p2.z], 0.045, '#19b37a');
    const RP = []; for (let i = 0; i <= 10; i++) { const u = i / 10; RP.push([lerp(p1.x, p2.x, u), lerp(y1, y2, u) + 2.7 - Math.sin(u * Math.PI) * 0.4, lerp(p1.z, p2.z, u)]); }
    for (let i = 0; i < 10; i++) k.rod(RP[i], RP[i + 1], 0.01, '#2b2235', { ink: 0 });
    const SC = ['#ff4f9a', '#ffd23f', '#19b37a', '#2f7fe0', '#8a4fd8', '#ff8a2a'];
    for (let i = 1; i < 10; i++) {
      const q = RP[i];
      if (i % 3 === 0) { k.ball(q[0], q[1] - 0.28, q[2], 0.15, 0.08, 0.03, SC[i % 6], { ink: 0.006 }); k.ball(q[0] - 0.06, q[1] - 0.27, q[2] + 0.025, 0.03, 0.02, 0.01, '#2b2235', { ink: 0 }).ball(q[0] + 0.06, q[1] - 0.27, q[2] + 0.025, 0.03, 0.02, 0.01, '#2b2235', { ink: 0 }); }
      else for (let j = 0; j < 5; j++) k.box(q[0] + Math.sin(j * 1.7) * 0.03, q[1] - 0.08 - j * 0.11, q[2] + Math.cos(j * 1.3) * 0.03, 0.05, 0.1, 0.012, SC[(i + j) % 6], { rz: Math.sin(j * 2.1) * 0.6, ink: 0 });
    }
    // ---------------- confetti on the ground round the HQ
    const R0 = rng(4242);
    for (let i = 0; i < 90; i++) { const a = R0() * TAU, rr = 0.5 + R0() * 3.2, x = SPOT.kid.x - 1.2 + Math.cos(a) * rr, z = SPOT.kid.z - 0.3 + Math.sin(a) * rr * 0.55; k.box(x, gy(x, z) + 0.012, z, 0.06, 0.006, 0.06, SC[i % 6], { ry: R0() * 3, ink: 0 }); }
    ZHF.bake(root, k);
    colliders.push(solid({ x: D.x, z: D.z, r: 0.45 }), solid({ obox: 1, x: T.x, z: T.z, hw: 0.48, hd: 0.3, rot: 0.35 }), solid({ x: Bd.x, z: Bd.z, r: 0.32 }), solid({ x: p1.x, z: p1.z, r: 0.1 }), solid({ x: p2.x, z: p2.z, r: 0.1 }));
    // ---------------- the people
    const people = [];
    const kid = malu(gy); root.add(kid.root); people.push(kid);
    const voG = vo(gy, true), voC = vo(gy, false); root.add(voG.root, voC.root); voC.root.visible = false; voC.hidden = true; people.push(voG, voC);
    const cida = neighbor('cida', 'cida', SPOT.cida, gy); cida.root.visible = false; cida.hidden = true; root.add(cida.root); people.push(cida);
    // the tape measure round Dona Cida's neck
    { const kc = ZHF.Kit(); kc.rod([-0.12, cida.shY + 0.1, 0.12], [-0.13, cida.shY - 0.3, 0.24], 0.012, '#ffd23f', { ink: 0 }).rod([0.12, cida.shY + 0.1, 0.12], [0.13, cida.shY - 0.3, 0.24], 0.012, '#ffd23f', { ink: 0 }); ZHF.bake(cida.body, kc); }
    // the bateria (hidden until chapter 2's scene and the parade)
    const bat = new THREE.Group(); root.add(bat); bat.visible = false;
    const band = BAT_LOOKS.map(([inst, look], i) => {
      const at = BAT_AT[i], p = neighbor(look, inst === 'surdo' ? 'juca' : 'bat' + i, { x: at.x, z: at.z, yaw: -Math.PI / 2 }, gy);
      p.inst = inst; const g = instrument(inst); p.body.add(g); p.instG = g; p.noTurn = true; p.hidden = true; p.home = at;
      bat.add(p.root); people.push(p); return p;
    });
    B = { scene, root, colliders, people, kid, voG, voC, cida, bat, band, boardTex, board, gy, GY: (typeof TOWN !== 'undefined' && TOWN.GY) || 0.25, std: null, banner: null, giant: null, marchers: null, conf: null };
    return { colliders, group: root, people, update };
  }
  // ================================================================ the music
  // MIX: each section of the bateria (and the brass, the tuba) on or off, live (chapter 2 calls them in one by one);
  // BAT: the paradinha (stop: the bateria goes silent; back: it comes back in on the next downbeat, with a crash)
  const MIX = { surdo: 1, caixa: 1, repique: 1, tamborim: 1, agogo: 1, pandeiro: 1, cuica: 1, chocalho: 1, brass: 1, tuba: 1 };
  const BAT = { stop: false, back: false, boom: false, louder: 1 };
  const MARCHA = { tune: 0 };
  const MUS = { name: null, level: 0, cut: 16000, duck: 0.3 };
  const mixSet = (v, keep) => { for (const k of Object.keys(MIX)) MIX[k] = keep && keep.includes(k) ? 1 : v; };
  // a diatonic third below a melody note (the harmony line): sc = the key's pitch classes, in order
  const third = (m, sc) => { const i = sc.indexOf(((m % 12) + 12) % 12); if (i < 0) return m - 4; const b = sc[(i + 5) % 7]; return m - (((m % 12) - b + 12) % 12 || 12); };
  (function addSongs() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const K = Sound.kit;
    // ---------------- «Acorda, Alba!» (pt_bloco): a samba de bloco in F, 132 bpm. A full bateria: three surdos (the deep
    // primeira on beat two, the segunda answering on one, the terceira cutting in between), caixas in sixteenths, the
    // repinique, tamborins, agogô, pandeiro, chocalho, the cuíca talking, the mestre's whistle. A street fanfarra on top:
    // the trumpet calls the hook («A-cor-da, Al-ba, a-cor-da!»), sax and trombones answer («O blo-co che-gou!»); then the
    // horns punch a riff and the sax answers it. A tuba plays the samba bass, anticipating every chord.
    const CHS = K.CH('F2: A3 C4 D4 F4, F2: A3 C4 D4 F4, C2: E3 G3 Bb3 C4, C2: E3 G3 Bb3 C4, G2: F3 Bb3 D4 F4, C2: E3 G3 Bb3 D4, F2: A3 C4 D4 F4, F2: A3 C4 D4 F4,' +
      'Bb2: D3 F3 G3 Bb3, Bb2: D3 F3 G3 Bb3, A2: C3 F3 A3 C4, D2: F#3 A3 C4 D4, G2: F3 Bb3 D4 F4, C2: E3 G3 Bb3 D4, F2: A3 C4 D4 F4, C2: E3 G3 Bb3 C4');
    const HOOK = K.mel('r/2 C5/1 F5/2 F5/1 A5/3 G5/1 F5/1 G5/2 A5/3 | r/2 A4/1 C5/2 C5/1 A4/2 F4/6 r/2 |' +
      'r/2 C5/1 E5/2 E5/1 G5/3 F5/1 E5/1 F5/2 G5/3 | r/2 G4/1 Bb4/2 Bb4/1 G4/2 E4/6 r/2 |' +
      'r/2 D5/1 G5/2 G5/1 Bb5/3 A5/1 G5/1 A5/2 Bb5/3 | r/2 Bb4/1 C5/2 C5/1 Bb4/2 G4/2 E4/4 r/2 |' +
      'r/2 C5/1 F5/2 F5/1 A5/3 G5/1 F5/1 G5/2 C6/3 | r/2 A5/1 C6/2 C6/1 A5/2 F5/4 r/4 |' +
      'r/8 F5/1 G5/1 Bb5/2 C6/2 D6/2 | r/8 D6/2 C6/1 Bb5/1 G5/2 F5/2 | r/8 F5/1 A5/1 C6/2 D6/2 C6/2 | r/8 A5/1 C6/1 D6/2 F#5/2 A5/2 |' +
      'r/8 Bb5/1 A5/1 G5/2 F5/2 D5/2 | r/8 E5/1 F5/1 G5/2 Bb5/2 C6/2 | r/8 A5/2 G5/1 F5/1 C5/2 F5/2 | r/8 C5/1 E5/1 G5/1 Bb5/1 C6/4');
    const F_SC = [5, 7, 9, 10, 0, 2, 4];
    const TAM = K.pat('x.xx.x.x.xx.x.x.'), REP = K.pat('..x..x.x..x..x.x'), TER = K.pat('...x..x...xx..x.'), AGO = 'h.l..h.lh.ll.h..';
    const CX = [0.45, 0.2, 0.85, 0.6, 0.45, 0.2, 0.85, 0.35];
    const lv = k => MIX[k] * BAT.louder;
    function chamada(i, t) {     // the intro: the whistle, the repinique's call, the surdos answer, and in
      if (i === 0) K.apito(t, 0.5, 0.9);
      if ([4, 6, 8, 9, 10].includes(i)) K.timbale(t, true, i === 10 ? 1.1 : 0.85);
      if (i === 10) K.rim(t, 0.6);
      if (i === 12 || i === 14) { K.surdo(t, true, 1); K.tom(t, 74, 1.1); }
      if (i >= 12) K.snare(t, 0.08 + (i - 12) * 0.05);
      if (i === 15) K.cuica(t, true, 0.9, 0.14);
    }
    Sound.addSong('pt_bloco', { bpm: 132, len: 272, from: 16, swing: 0.04, vol: 0.42, verb: 0.1, echo: 0.06, echoSteps: 3,
      play(i, t, s16) {
        if (i < 16) { chamada(i, t); return; }
        const j = i - 16, bar = j >> 4, s = j & 15, s8 = s & 7, Bsec = bar >= 8, C = CHS[bar], R = C[0];
        const half2 = s >= 8, fill = (bar === 7 || bar === 15) && half2;
        // the paradinha: total silence (the Hush leans in…), until «volta!» brings everything back on a downbeat
        if (BAT.stop) { if (BAT.back && s8 === 0) { BAT.stop = false; BAT.back = false; BAT.boom = true; } else return; }
        if (BAT.boom) { BAT.boom = false; K.crash(t, 1); K.surdo(t, true, 1.3); K.tom(t, 74, 1.4); K.apito(t, 0.2, 0.8); for (let k = 1; k < C.length; k++) K.horn(C[k] + 12, t, 0.9, 0.3); }
        // ---- the bateria
        if (MIX.surdo) {
          if (s8 === 4) K.surdo(t, true, 1.0 * lv('surdo'));                       // primeira: BOOM on two
          if (s8 === 0) { K.surdo(t, false, 0.35 * lv('surdo')); K.tom(t, 74, 0.95 * lv('surdo')); }     // segunda answers on one
          if (TER[s] && !fill) K.tom(t, 98, 0.55 * lv('surdo'));                   // terceira, cutting between them
          if (fill && (s === 8 || s === 10 || s === 11 || s === 14)) { K.surdo(t, true, 1.1 * lv('surdo')); K.tom(t, 74, 1.0 * lv('surdo')); }
        }
        if (MIX.caixa) { const v = fill ? 0.4 + (s - 8) * 0.08 : CX[s8]; K.snare(t, 0.16 * v * lv('caixa')); if (v > 0.5) K.rim(t, 0.3 * lv('caixa')); }
        if (MIX.repique) { if (fill) K.timbale(t, true, (0.5 + (s - 8) * 0.07) * lv('repique')); else if (REP[s]) K.timbale(t, true, 0.65 * lv('repique')); }
        if (MIX.tamborim) { if (fill ? true : TAM[s]) K.tamborim(t, (fill ? 0.6 + (s - 8) * 0.05 : 0.85) * lv('tamborim')); }
        if (MIX.agogo && !fill) { const a = AGO[s]; if (a !== '.') K.agogo(t, a === 'h', 0.8 * lv('agogo')); }
        if (MIX.chocalho) K.shaker(t, ((s & 1) ? 0.95 : 0.45) * lv('chocalho'));
        if (MIX.pandeiro) { const q = s & 3, v = lv('pandeiro'); if (q === 0) { K.conga(t, 'lo', 0.55 * v); K.tamb(t, 0.35 * v); } else if (q === 3) K.tamb(t, 0.7 * v, true); else K.tamb(t, 0.28 * v); }
        if (MIX.cuica) {
          if (!Bsec && (bar & 1) && s === 11) K.cuica(t, true, 0.8 * lv('cuica'), 0.13);
          if (Bsec && !fill && (s === 3 || s === 11)) K.cuica(t, true, 0.85 * lv('cuica'), 0.12);
          if (Bsec && !fill && (s === 6 || s === 14)) K.cuica(t, false, 0.9 * lv('cuica'), s === 6 ? 0.12 : 0.22);
        }
        // the mestre's whistle: a short one at the top of the hook, «pi-pi-piiii» into each fill
        if (bar === 0 && s === 0) K.apito(t, 0.12, 0.8);
        if ((bar === 7 || bar === 15) && (s === 4 || s === 5)) K.apito(t, 0.06, 0.8);
        if ((bar === 7 || bar === 15) && s === 6) K.apito(t, 0.24, 0.85);
        if (s === 0 && (bar === 0 || bar === 8)) K.crash(t, 0.6);
        // ---- the tuba: root on each half, the fifth, then a step from below into the next chord (samba's anticipation)
        if (MIX.tuba) {
          const nR = half2 ? CHS[(bar + 1) & 15][0] : R, v = lv('tuba');
          if (s8 === 0) K.tuba(R, t, 3 * s16, 0.95 * v);
          else if (s8 === 4) K.tuba(R + 7, t, 2 * s16, 0.8 * v);
          else if (s8 === 7) K.tuba(nR - 1, t, s16 * 0.9, 0.7 * v);
        }
        // ---- the fanfarra
        if (MIX.brass) {
          const n = HOOK[j], v = BAT.louder;
          if (!Bsec) {
            if (n) { if (!(bar & 1)) K.lead(n[0], t, n[1] * s16 * 0.92, 'trumpet', 0.95 * v); else { K.lead(n[0], t, n[1] * s16 * 0.92, 'sax', 0.85 * v); K.lead(third(n[0], F_SC), t, n[1] * s16 * 0.9, 'trumpet', 0.45 * v); } }
            if ((s === 6 || s === 14) && !n) for (let k = 1; k < C.length; k++) K.horn(C[k] + 12, t, 0.35 * v, 0.08);
          } else {
            if (s === 0 || s === 3 || s === 6) for (let k = 1; k < C.length; k++) K.horn(C[k] + 12, t, (s === 0 ? 0.95 : 0.75) * v, s === 6 ? 2 * s16 : s16 * 1.2);
            if (n) K.lead(n[0], t, n[1] * s16 * 0.92, bar === 15 ? 'trumpet' : 'sax', 0.9 * v);
          }
        }
      } });
    // ---------------- the marchinhas (pt_marcha): a 2/4 marcha band at 112. The surdo on every beat (tum-TUM), the caixa
    // dragging into the beats, pratos clashing on the offbeats, a pandeiro; a violão de sete cordas walking the bass; a
    // trombone holding the harmony (and sliding at the end of the verse); the flute sings the calls, trumpet and sax the
    // answers; the crowd claps along on the answers. Three tunes (MARCHA.tune): Bb, G and D major.
    const MT = [
      { sc: [10, 0, 2, 3, 5, 7, 9], mel: K.mel('F4/2 Bb4/3 Bb4/1 D5/4 C5/2 Bb4/1 C5/1 D5/2 | r/2 D5/1 F5/3 F5/2 D5/2 Bb4/4 r/2 | C5/2 C5/1 C5/1 D5/2 Eb5/2 D5/2 C5/2 Bb4/2 C5/2 | r/2 A4/1 C5/1 F5/4 Eb5/2 D5/2 C5/4 |' +
          'Bb4/2 D5/1 F5/1 F5/2 D5/2 Eb5/2 G5/1 Eb5/1 C5/4 | r/2 C5/1 Eb5/3 D5/2 C5/2 F5/4 r/2 | F4/2 Bb4/2 C5/1 D5/3 Eb5/2 F5/2 G5/4 | r/1 F5/1 F5/1 G5/1 F5/2 D5/2 Bb4/6 r/2'),
        ch: K.CH('Bb2: D4 F4, Bb2: D4 F4, Bb2: D4 F4, Bb2: D4 F4, C3: Eb4 G4, C3: Eb4 G4, F2: Eb4 A4, F2: Eb4 A4, Bb2: D4 F4, Eb3: G4 Bb4, F2: Eb4 A4, F2: Eb4 A4, Bb2: D4 F4, Eb3: G4 Bb4, F2: Eb4 A4, Bb2: D4 F4') },
      { sc: [7, 9, 11, 0, 2, 4, 6], mel: K.mel('D4/1 G4/2 G4/1 A4/2 B4/1 C5/1 D5/1 D5/1 E5/2 D5/4 | r/2 D5/1 G5/3 F#5/1 E5/1 D5/2 B4/4 r/2 | C5/1 C5/1 E5/2 E5/1 D5/1 C5/2 E5/2 D5/2 C5/4 | r/2 A4/1 B4/1 C5/1 D5/3 C5/1 B4/1 A4/6 |' +
          'G5/2 D5/2 G5/2 D5/2 G5/2 D5/2 E5/2 F#5/2 | G5/3 F#5/1 E5/2 D5/2 G5/6 r/2 | E5/1 E5/1 E5/2 D5/1 C5/1 B4/2 C5/2 D5/3 A4/3 | r/2 D5/1 G5/3 F#5/1 E5/1 F#5/2 G5/4 r/2'),
        ch: K.CH('G2: B3 D4, G2: B3 D4, G2: B3 D4, G2: B3 D4, C3: E4 G4, C3: E4 G4, D3: C4 F#4, D3: C4 F#4, G2: B3 D4, G2: B3 D4, D3: C4 F#4, G2: B3 D4, C3: E4 G4, D3: C4 F#4, D3: C4 F#4, G2: B3 D4') },
      { sc: [2, 4, 6, 7, 9, 11, 1], mel: K.mel('A4/1 D5/2 D5/1 A4/1 E5/2 E5/1 A4/1 F#5/3 E5/1 D5/3 | A5/2 F#5/1 D5/1 E5/1 F#5/1 A5/6 r/4 | G4/1 B4/2 B4/1 G4/1 C#5/2 C#5/1 A4/1 E5/3 D5/1 C#5/3 | E5/2 C#5/1 A4/1 B4/1 C#5/1 D5/6 r/4 |' +
          'D5/1 D5/1 F#5/2 E5/1 D5/1 E5/1 F#5/1 A5/4 F#5/4 | r/2 B4/1 D5/1 G5/2 F#5/2 E5/6 r/2 | A4/1 A4/1 D5/2 C#5/1 B4/2 A4/1 B4/1 C#5/2 E5/2 D5/3 | r/2 E5/1 F#5/3 E5/1 C#5/1 D5/6 r/2'),
        ch: K.CH('D3: F#4 A4, D3: F#4 A4, D3: F#4 A4, D3: F#4 A4, G2: B3 D4, A2: G4 C#5, A2: G4 C#5, D3: F#4 A4, D3: F#4 A4, D3: F#4 A4, G2: B3 D4, A2: G4 C#5, D3: F#4 A4, A2: G4 C#5, A2: G4 C#5, D3: F#4 A4') },
    ];
    Sound.addSong('pt_marcha', { bpm: 112, len: 128, swing: 0, vol: 0.4, verb: 0.13, echo: 0.04, echoSteps: 2,
      play(i, t, s16) {
        const T = MT[MARCHA.tune] || MT[0], bar = (i >> 4) & 7, s = i & 15, C = T.ch[bar * 2 + (s >> 3)], R = C[0], answer = !!(bar & 1);
        if ((s & 3) === 0) { const open = (s & 4) !== 0; K.surdo(t, open, open ? 1.0 : 0.6); }
        const cx = [0.65, 0, 0.3, 0.22, 0.8, 0, 0.3, 0.26][s & 7]; if (cx) K.snare(t, cx * 0.3);
        if ((s & 3) === 2) K.hat(t, 0.85, true);
        if (s & 1) K.tamb(t, (s & 3) === 3 ? 0.45 : 0.25);
        if (answer && (s === 4 || s === 12)) K.claps(t, 0.75);
        // the violão's bass: root and fifth on the beats; at the end of the verse, a run down into the tonic
        if (bar === 7 && s >= 8) { if (!(s & 1)) K.string(T.ch[15][0] + [7, 5, 4, 2][(s - 8) >> 1], t, 2.6, 0.3, 0.8); }
        else if ((s & 3) === 0) K.string(R + ((s & 4) ? 7 : 0) + 12, t, 2.6, 0.32, 0.8);
        // the trombone: the chord's third, held through each half; a slide down to end the verse
        if ((s & 7) === 0 && !(bar === 7 && s === 8)) K.tuba(C[1] - 12, t, 7 * s16, 0.42);
        if (bar === 7 && s === 8) K.tuba(C[1] - 12, t, 7 * s16, 0.5, C[1] - 17);
        const n = T.mel[i];
        if (n) {
          if (!answer) K.lead(n[0], t, n[1] * s16 * 0.92, 'flute', 0.95);
          else { K.lead(n[0], t, n[1] * s16 * 0.9, 'trumpet', 0.85); K.lead(third(n[0], T.sc), t, n[1] * s16 * 0.88, 'sax', 0.5); }
        }
        if (i === 0) K.crash(t, 0.5);
      } });
    // the mestre's whistle, once: «pi, pi, piiiii»
    Sound.addSong('cv_apito', { bpm: 120, len: 12, vol: 0.5, verb: 0.08, play(i, t) { if (i === 0 || i === 2) K.apito(t, 0.07, 1); if (i === 4) K.apito(t, 0.5, 1); } });
  })();
  function whistle() { try { if (Sound.ctx && Sound.ctx.state === 'running' && Sound.out && Sound.deck && Sound.songs.includes('cv_apito')) Sound.deck('cv_apito', Sound.out, { loop: false }); else Sound.play('whistle'); } catch (e) { /* no audio */ } }

  // ================================================================ confetti: paper bits that burst up and flutter down (one draw call)
  function conf() {
    if (B.conf) return B.conf;
    const n = 900, mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.075, 0.11), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), n);
    mesh.frustumCulled = false; mesh.name = 'cv-confetti';
    const cols = ['#ff4f9a', '#ffd23f', '#19b37a', '#2f7fe0', '#8a4fd8', '#ff8a2a', '#ffffff'].map(c => new THREE.Color(c)), M = new THREE.Matrix4(), Z = new THREE.Matrix4().makeScale(0, 0, 0);
    const P = [];
    for (let i = 0; i < n; i++) { mesh.setColorAt(i, cols[i % cols.length]); mesh.setMatrixAt(i, Z); P.push({ live: 0 }); }
    mesh.instanceColor.needsUpdate = true; mesh.instanceMatrix.needsUpdate = true;
    B.scene.add(mesh);
    let next = 0;
    const q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
    B.conf = {
      mesh,
      burst(x, y, z, count = 80, spread = 1.6, up = 4.5) {
        for (let k = 0; k < count; k++) {
          const p = P[next]; next = (next + 1) % n;
          const a = Math.random() * TAU, sp = Math.random() * spread;
          Object.assign(p, { live: 4 + Math.random() * 2.5, x, y, z, vx: Math.cos(a) * sp, vy: up * (0.6 + Math.random() * 0.6), vz: Math.sin(a) * sp, rx: Math.random() * 6, ry: Math.random() * 6, sx: (Math.random() - 0.5) * 9, sy: (Math.random() - 0.5) * 9, ph: Math.random() * 6, floor: null });
        }
      },
      step(dt, t) {
        let any = false;
        for (let i = 0; i < n; i++) {
          const p = P[i]; if (p.live <= 0) continue; any = true;
          p.live -= dt;
          if (p.live <= 0) { mesh.setMatrixAt(i, Z); continue; }
          if (p.floor === null) {
            p.vy -= 4.2 * dt; p.vx *= 1 - 1.4 * dt; p.vz *= 1 - 1.4 * dt; if (p.vy < -1.1) p.vy = -1.1;
            p.x += (p.vx + Math.sin(t * 3 + p.ph) * 0.35) * dt; p.y += p.vy * dt; p.z += (p.vz + Math.cos(t * 2.6 + p.ph) * 0.35) * dt;
            p.rx += p.sx * dt; p.ry += p.sy * dt;
            const gy = B.gy(p.x, p.z) + 0.02; if (p.y < gy && p.vy < 0) { p.y = gy; p.floor = gy; p.rx = -Math.PI / 2; p.live = Math.min(p.live, 2.5); }
          }
          e.set(p.rx, p.ry, 0); q.setFromEuler(e); v.set(p.x, p.y, p.z); sc.setScalar(p.live < 0.6 ? p.live / 0.6 : 1); M.compose(v, q, sc); mesh.setMatrixAt(i, M);
        }
        if (any) mesh.instanceMatrix.needsUpdate = true;
        mesh.visible = any;
      },
    };
    return B.conf;
  }
  const confetti = (x, y, z, n, spread, up) => { try { conf().burst(x, y, z, n, spread, up); Sound.play('poof'); } catch (e) { /* */ } };

  // ================================================================ every frame
  let waveT = 3, hopT = 0, boardKey = '';
  const SCENE = { bat: false, par: false };          // chapter 2's bateria is out · the parade is on
  // CARNAVAL.lend(who, at): another module borrows Malu ('malu') or the awake Vô Tião ('tiao') for a scene: at = { x, z, yaw,
  // pose }, or null to send them home (familia.js: the Sunday lunch at Vó Dita's table)
  const LENT = { malu: null, tiao: null };
  function lend(who, at) {
    if (!(who in LENT)) return;
    LENT[who] = at || null;
    if (!at && B) {
      if (who === 'malu') { const k = B.kid; k.x = SPOT.kid.x; k.z = SPOT.kid.z; k.y = B.gy(k.x, k.z); k.yaw = k.baseYaw = SPOT.kid.yaw; k.pose = 'idle'; k.hop = 0; }
      else { const v = B.voC; v.x = SPOT.vo2.x; v.z = SPOT.vo2.z; v.y = B.gy(v.x, v.z); v.yaw = v.baseYaw = SPOT.vo2.yaw; v.pose = 'idle'; }
    }
  }
  function update(dt, t, you) {
    if (!B) return;
    const on = shown() && !(G.indoors && G.indoors()), Y = G.sim.you, st = on ? S() : null;
    const near = on && (SCENE.par || Math.hypot(Y.x - TOWER.x, Y.z - TOWER.z) < 170);
    B.root.visible = near;
    for (const c of B.colliders) { c.x = c.x0 + (on ? 0 : 1e5); c.z = c.z0; }
    const k = B.kid;
    k.hidden = !on;
    // Vô Tião on his bench: gray until the parade has woken him up
    const woke = !!(st && st.ch[5]);
    B.voG.root.visible = !!(on && st.met && !woke && !SCENE.voUp); B.voG.hidden = !B.voG.root.visible;
    B.voC.root.visible = !!(on && (woke || SCENE.voUp)); B.voC.hidden = !B.voC.root.visible;
    B.cida.hidden = !B.cida.root.visible;
    B.bat.visible = on && (SCENE.bat || SCENE.par);
    for (const p of B.band) p.hidden = !B.bat.visible;
    if (G.cast) { const tia = tiara(); if (tia) tia.visible = hatOn(); }
    if (!on) { ZHF.music.want('cv', null, 0); ZHF.music.frame(t); return; }
    ZHF.music.want('cv', MUS.level > 0 ? MUS.name : null, MUS.level, { cut: MUS.cut, duck: MUS.duck }); ZHF.music.frame(t);
    if (B.conf) B.conf.step(dt, t);
    if (!near) return;
    // the chalkboard: repainted when something's been decided
    const bk = [st.bloco, st.tema, !!st.ch[2], !!st.ch[4]].join('|');
    if (st.ch[4] && (!B.std || !B.banner)) showDecor();
    if (bk !== boardKey) { boardKey = bk; try { const cv = B.boardTex.image; drawBoard(cv.getContext('2d'), cv.width, cv.height); B.boardTex.needsUpdate = true; } catch (e) { /* */ } }
    const scene = typeof STORY !== 'undefined' && STORY.busy;
    // (lent to another module's scene: familia.js's Sunday lunch sets them at the table)
    if (LENT.malu) { const a = LENT.malu; k.x = a.x; k.z = a.z; k.y = B.gy(a.x, a.z); k.baseYaw = a.yaw; k.faceAt = null; k.pose = a.pose || 'idle'; k.hop = Math.abs(Math.sin(t * 5)) * 0.06; }
    if (LENT.tiao && B.voC.root.visible) { const a = LENT.tiao, v = B.voC; v.x = a.x; v.z = a.z; v.y = B.gy(a.x, a.z); v.yaw = v.baseYaw = a.yaw; v.faceAt = null; v.pose = a.pose || 'idle'; }
    if (!SCENE.par && !SCENE.kidBusy && !LENT.malu) {
      if (!scene && (waveT -= dt) <= 0) { waveT = 3 + Math.random() * 4; k.pose = Math.random() < 0.5 ? 'wave' : 'drum'; k.waveT = 1.6; }
      if (k.waveT > 0 && (k.waveT -= dt) <= 0) k.pose = 'idle';
      if ((hopT -= dt) <= 0) { hopT = 2 + Math.random() * 5; k.hopT = 0.5; }
      k.hop = k.hopT > 0 ? Math.abs(Math.sin((k.hopT -= dt) * 6.3)) * 0.18 : 0;
    }
    ZHF.animate(k, dt, t, SCENE.par ? null : you);
    for (const p of [B.voG, B.voC, B.cida]) if (p.root.visible) { ZHF.animate(p, dt, t, null); if (p === B.voG) p.body.rotation.x = 0.14 + Math.sin(t * 0.6) * 0.01; }
    // the bateria plays what's on (MIX), or waits
    if (B.bat.visible) for (const p of B.band) {
      const playing = MUS.level > 0 && MIX[p.inst] > 0 && !BAT.stop;
      p.pose = playing ? (['chocalho', 'pandeiro', 'agogo', 'tamborim'].includes(p.inst) ? 'drum' : 'drum') : 'idle';
      if (playing) p.hop = Math.abs(Math.sin(t * 6.9 + p.home.x)) * 0.05; else p.hop = 0;
      if (!SCENE.par) ZHF.animate(p, dt, t, null);
    }
    if (SCENE.par) parStep(dt, t);
    if (B.giant && B.giant.g.visible) giantStep(dt, t);
  }
  // ================================================================ the scenes: helpers
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const music = (name, level = 0.4, o = {}) => { MUS.name = name; MUS.level = level; MUS.cut = o.cut || 16000; MUS.duck = o.duck === undefined ? 0.3 : o.duck; };
  const musicOff = () => { MUS.level = 0; };
  // who says a line: ours (ZHF people), or the town's story people (Rosa, Bruno, Marta, Nico) where they stand
  function speaker(who) {
    const ours = { malu: B.kid, vo: B.voC.root.visible ? B.voC : B.voG, cida: B.cida, juca: B.band[0] }[who];
    if (ours) return ours;
    const n = G.sim.npc(who); if (!n) return null;
    return { id: who, x: n.x, z: n.z, y: n.y !== undefined ? n.y : B.gy(n.x, n.z), top: 2.1 };
  }
  function say(who, key) {
    const p = speaker(who); if (!p || typeof STORY === 'undefined') return Promise.resolve();
    const L = lineOf(key); p.name = NAMES[who] || ''; p.lines = { en: L.en, pt: L.pt };
    return STORY.sayInline(p, true);
  }
  const you = text => STORY.you(text), think = (text, s) => STORY.think(text, s);
  const lock = on => { if (G) G.sim.lock = on ? 1 : 0; };
  const front = (p, d) => ({ x: p.x + Math.sin(p.baseYaw) * d, z: p.z + Math.cos(p.baseYaw) * d });
  // you (and {mimo}) stand at a spot, facing a point
  function standAt(at, look) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = at.x; Y.z = at.z; Y.yaw = Math.atan2(look.x - Y.x, look.z - Y.z);
    const sx = Math.cos(Y.yaw) * 0.9, sz = -Math.sin(Y.yaw) * 0.9;
    M.x = at.x + sx; M.z = at.z + sz; M.station = null; M.wander = null; M.look = { x: look.x, z: look.z };
    [Y.x, Y.z] = WORLD.pushOut(Y.x, Y.z, 0.4); [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3); G.sim.snap();
  }
  const standBy = () => standAt(front(B.kid, 1.9), B.kid);
  function shotKid() { const k = B.kid, f = front(k, 3.6), s = { x: Math.cos(k.baseYaw) * 1.4, z: -Math.sin(k.baseYaw) * 1.4 }; G.cam.override = { pos: V3(f.x + s.x, k.y + 1.9, f.z + s.z), look: V3(k.x, k.y + 0.9, k.z) }; }
  const shot = (p, l) => { G.cam.override = { pos: V3(p[0], p[1], p[2]), look: V3(l[0], l[1], l[2]) }; };
  async function scene(fn) {
    lock(true);
    try { await fn(); } catch (e) { console.error('[carnaval] scene', e); }
    finally { G.cam.override = null; lock(false); if (G.sim.mimo) G.sim.mimo.look = null; if (!SCENE.par) G.fx.hush = 0; if (G.save) G.save(); }
  }
  const coins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; try { Sound.play('chest'); } catch (e) { /* */ } UI.toast(`${why}: +${n} coins`); };
  const teachAll = ids => ids.forEach(id => CVUI.teach(id));
  const WHO = { face: 'cvKid', name: 'Malu' };
  const mkCanvas = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.style.width = Math.min(w, 460) + 'px'; return cv; };
  const iconCanvas = (key, size = 120) => { const cv = mkCanvas(size, size); try { ICONS.draw(cv, key); } catch (e) { /* */ } cv.style.width = cv.style.height = size + 'px'; return cv; };
  const qgConfetti = n => confetti(SPOT.kid.x - 0.6, B.gy(SPOT.kid.x, SPOT.kid.z) + 1.6, SPOT.kid.z - 0.6, n || 60, 1.8, 4.5);

  // ================================================================ costumes on paper (chapter 1): the things, and {mimo} wearing them
  function colorFill(c, id) {
    const h = CV_COL(id || 'rosa'); if (h !== 'rainbow') return h;
    const g = c.createLinearGradient(-60, -40, 60, 40); ['#ff4f9a', '#ffd23f', '#19b37a', '#2f7fe0', '#8a4fd8'].forEach((x, i) => g.addColorStop(i / 4, x)); return g;
  }
  // one costume thing, centered on (x, y), about 100 across at s 1
  function drawThing(c, id, x, y, s, colId, o = {}) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = c.lineCap = 'round';
    const INK = '#2b2235', fi = (fill, lw = 4) => { c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); }, col = colorFill(c, colId);
    const RB = ['#ff4f9a', '#ffd23f', '#19b37a', '#2f7fe0', '#8a4fd8', '#ff8a2a'];
    if (id === 'coroa') { c.beginPath(); c.moveTo(-44, 26); c.lineTo(-48, -22); c.lineTo(-24, 0); c.lineTo(0, -34); c.lineTo(24, 0); c.lineTo(48, -22); c.lineTo(44, 26); c.closePath(); fi(col); [-24, 0, 24].forEach(px => { c.beginPath(); c.arc(px, 12, 6, 0, TAU); fi(px ? '#ff4f9a' : '#2f7fe0', 2.5); }); }
    else if (id === 'peruca') { for (let i = 0; i < 11; i++) { const a = Math.PI * (0.95 + 1.1 * i / 10); c.beginPath(); c.arc(Math.cos(a) * 42, 14 + Math.sin(a) * 38, 17, 0, TAU); fi(colId === 'colorido' ? RB[i % 6] : col, 3); } c.beginPath(); c.arc(0, -6, 26, 0, TAU); fi(colId === 'colorido' ? '#ffd23f' : col, 3); }
    else if (id === 'chapeu') { c.beginPath(); c.ellipse(0, 18, 52, 12, 0, 0, TAU); fi(col); c.beginPath(); c.moveTo(-30, 16); c.lineTo(-26, -30); c.quadraticCurveTo(0, -40, 26, -30); c.lineTo(30, 16); c.closePath(); fi(col); c.beginPath(); c.rect(-29, 2, 58, 11); fi('#2b2235', 2); }
    else if (id === 'mascara') { c.beginPath(); c.moveTo(-50, -6); c.bezierCurveTo(-45, -32, -13, -28, 0, -14); c.bezierCurveTo(13, -28, 45, -32, 50, -6); c.bezierCurveTo(45, 18, 13, 18, 0, 6); c.bezierCurveTo(-13, 18, -45, 18, -50, -6); c.closePath(); fi(col); [-22, 22].forEach(ex => { c.beginPath(); c.ellipse(ex, -4, 10, 6.5, 0, 0, TAU); fi('#fffaf0', 2.5); }); [[-40, -16], [40, -16], [0, -22]].forEach(([px, py]) => { c.beginPath(); c.arc(px, py, 3.5, 0, TAU); c.fillStyle = '#ffd23f'; c.fill(); }); }
    else if (id === 'oculos') { for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * 24, 18); c.bezierCurveTo(sx * 60, -4, sx * 40, -34, sx * 24, -14); c.bezierCurveTo(sx * 8, -34, sx * -12, -4, sx * 24, 18); c.closePath(); fi(col); } c.beginPath(); c.moveTo(-6, -8); c.quadraticCurveTo(0, -14, 6, -8); c.lineWidth = 4; c.strokeStyle = INK; c.stroke(); }
    else if (id === 'purpurina') { const cs = colId === 'colorido' ? RB : [typeof col === 'string' ? col : '#ffd23f', '#ffffff']; for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 8 + (i * 7) % 38; c.beginPath(); for (let k = 0; k < 8; k++) { const b = k * Math.PI / 4, rr = k % 2 ? 2.5 : 7; c.lineTo(Math.cos(a) * r + Math.cos(b) * rr, Math.sin(a) * r * 0.7 + Math.sin(b) * rr); } c.closePath(); fi(cs[i % cs.length], 1.5); } }
    else if (id === 'capa') { c.beginPath(); c.moveTo(-26, -36); c.lineTo(26, -36); c.quadraticCurveTo(52, 10, 46, 42); c.lineTo(-46, 42); c.quadraticCurveTo(-52, 10, -26, -36); c.closePath(); fi(col); c.beginPath(); c.ellipse(0, -36, 30, 8, 0, 0, TAU); fi('#fffaf0', 3); if (o.sequins) for (let i = 0; i < 26; i++) { c.beginPath(); c.arc(-36 + (i * 13) % 74, -20 + Math.floor(i / 6) * 13, 3.2, 0, TAU); c.fillStyle = i % 2 ? '#ffd23f' : '#ffffff'; c.fill(); } }
    else if (id === 'asas') { for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 30, -12, 30, 20, sx * -0.5, 0, TAU); fi(col); c.beginPath(); c.ellipse(sx * 26, 20, 20, 13, sx * 0.5, 0, TAU); fi(col); } }
    else if (id === 'colar') { for (let i = 0; i < 11; i++) { const a = Math.PI * (0.05 + 0.9 * i / 10); c.beginPath(); c.arc(Math.cos(a) * 46, -8 + Math.sin(a) * 34, 9, 0, TAU); fi(colId === 'colorido' ? RB[i % 6] : i % 2 ? col : '#ffffff', 2.5); } }
    c.restore();
  }
  // {mimo} on paper, wearing doll = { head: { it, c }, face, body }
  function drawDoll(c, W, H, doll, label) {
    c.clearRect(0, 0, W, H); c.fillStyle = '#fff8e6'; c.fillRect(0, 0, W, H);
    const s = Math.min(W, H) / 330; c.save(); c.translate(W / 2, H / 2 + 34 * s); c.scale(s, s); c.lineJoin = c.lineCap = 'round';
    const INK = '#2b2235', fi = (fill, lw = 4) => { c.fillStyle = fill; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); };
    const bd = doll.body, fc = doll.face, hd = doll.head;
    if (bd && bd.it === 'capa') drawThing(c, 'capa', 0, 30, 2.3, bd.c);
    if (bd && bd.it === 'asas') drawThing(c, 'asas', 0, -10, 2.6, bd.c);
    for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 34, -128, 19, 60, sx * 0.14, 0, TAU); fi('#fbf1df'); c.beginPath(); c.ellipse(sx * 34, -124, 9, 42, sx * 0.14, 0, TAU); c.fillStyle = '#ff9b88'; c.fill(); }
    c.beginPath(); c.moveTo(0, -84); c.bezierCurveTo(84, -84, 92, 20, 82, 70); c.quadraticCurveTo(72, 108, 0, 108); c.quadraticCurveTo(-72, 108, -82, 70); c.bezierCurveTo(-92, 20, -84, -84, 0, -84); fi('#fbf1df');
    c.beginPath(); c.ellipse(0, 52, 46, 34, 0, 0, TAU); c.fillStyle = '#fffaf2'; c.fill();
    for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 42, 110, 26, 13, 0, 0, TAU); fi('#fbf1df', 3); }
    c.beginPath(); c.moveTo(0, -78); c.lineTo(12, -64); c.lineTo(0, -50); c.lineTo(-12, -64); c.closePath(); fi('#2fd0c2', 3);
    for (const sx of [-1, 1]) { c.beginPath(); c.ellipse(sx * 28, -18, 8, 12, 0, 0, TAU); c.fillStyle = INK; c.fill(); c.beginPath(); c.arc(sx * 28 + 3, -22, 3, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.beginPath(); c.ellipse(sx * 52, 6, 11, 6, 0, 0, TAU); c.fillStyle = 'rgba(255,140,150,.55)'; c.fill(); }
    c.beginPath(); c.arc(0, 4, 7, 0.2, Math.PI - 0.2); c.lineWidth = 3; c.strokeStyle = INK; c.stroke();
    if (bd && bd.it === 'colar') drawThing(c, 'colar', 0, 34, 1.5, bd.c);
    if (fc) { if (fc.it === 'mascara') drawThing(c, 'mascara', 0, -16, 1.15, fc.c); else if (fc.it === 'oculos') drawThing(c, 'oculos', 0, -16, 1.05, fc.c); else drawThing(c, 'purpurina', 0, 0, 1.6, fc.c); }
    if (hd) { if (hd.it === 'coroa') drawThing(c, 'coroa', 0, -104, 0.85, hd.c); else if (hd.it === 'peruca') drawThing(c, 'peruca', 0, -82, 1.25, hd.c); else drawThing(c, 'chapeu', 0, -102, 0.95, hd.c); }
    c.restore();
    if (label) { c.font = `800 ${Math.round(15 * s * 1.6)}px Bahnschrift, sans-serif`; c.fillStyle = '#2b2235'; c.textAlign = 'center'; c.fillText(label, W / 2, H - 8); }
  }
  // two things side by side, to compare (labels under each)
  function pairArt(id, a, b) {
    return el => {
      const cv = mkCanvas(440, 210), c = cv.getContext('2d'); el.appendChild(cv);
      c.fillStyle = '#fff8e6'; c.fillRect(0, 0, 440, 210);
      drawThing(c, id, 115, 92, a.s, a.c, a.o || {}); drawThing(c, id, 325, 92, b.s, b.c, b.o || {});
      c.font = '800 18px Bahnschrift, "Segoe UI", sans-serif'; c.fillStyle = '#2b2235'; c.textAlign = 'center'; c.fillText(fill(a.label), 115, 196); c.fillText(fill(b.label), 325, 196);
      c.strokeStyle = 'rgba(43,34,53,.2)'; c.setLineDash([6, 6]); c.beginPath(); c.moveTo(220, 14); c.lineTo(220, 196); c.stroke();
    };
  }
  const voteArt = (list, pickId) => `<div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">${list.map((b, i) => `<div style="width:150px;padding:10px 8px;border:3px solid #2b2235;border-radius:14px;background:${b.id === pickId ? '#ffe36b' : ['#ffe0ef', '#d9f4ff', '#e2f8e9'][i]};text-align:center"><b style="font:900 17px Bahnschrift,sans-serif">${esc(b.name)}</b><br><small style="font-weight:700;opacity:.7">${esc(b.en.split(' (')[0])}</small><div style="margin-top:6px;font-weight:800">✋ ${esc(['Dona Cida', 'Seu Juca', 'Nico'][i])}</div></div>`).join('')}</div>`;
  // the costume answer: the thing (in its slot) and its color, agreeing
  function dressCheck(slot) {
    const opts = ITEMS.filter(i => i.slot === slot).map(i => '«' + i.pt + '»').join(', ');
    return text => {
      const r = readItem(text, slot);
      if (!r.it) return { ok: false, why: `Say what ${MIMO()} wears ${SLOTS[slot]}: ${esc(opts)}, and a color.` };
      if (r.wrongSlot) return { ok: false, why: `«${esc(r.it.pt)}» doesn’t go ${SLOTS[slot]}! Try ${esc(opts)}.` };
      const art1 = r.it.pl ? (r.it.g === 'f' ? 'umas' : 'uns') : (r.it.g === 'f' ? 'uma' : 'um'), n = ' ' + N(text) + ' ';
      const artSlip = !r.it.pl && ((r.it.g === 'f' && r.it.keys.some(k => n.includes(' um ' + N(k) + ' '))) || (r.it.g === 'm' && r.it.keys.some(k => n.includes(' uma ' + N(k) + ' '))));
      if (!r.C) return { ok: true, minor: true, note: `Next time add a color: «${art1} ${esc(r.it.pt)} ${esc(formOf(COLORS[3], r.it))}»`, said: `${art1} ${r.it.pt}` };
      if (!r.agrees) return { ok: true, minor: true, note: `«${esc(r.it.pt)}» is ${r.it.g === 'f' ? 'feminine' : 'masculine'}${r.it.pl ? ' plural' : ''}: «${esc(r.it.pt)} ${esc(r.want)}»`, said: `${art1} ${r.it.pt} ${r.want}` };
      if (artSlip) return { ok: true, minor: true, note: `«${esc(r.it.pt)}» takes «${art1}»: «${art1} ${esc(r.it.pt)}»`, said: `${art1} ${r.it.pt} ${r.want}` };
      return { ok: true, said: `${art1} ${r.it.pt} ${r.want}` };
    };
  }

  // ================================================================ chapter 1: fantasias
  async function meet() {
    const st = S();
    await scene(async () => {
      standBy(); shotKid(); whistle();
      B.kid.pose = 'cheer'; await say('malu', 'cv.malu.whistle'); B.kid.pose = 'idle';
      await say('malu', 'cv.malu.hi'); await say('malu', 'cv.malu.bloco'); await say('malu', 'cv.malu.what');
      await say('malu', 'cv.malu.hush');
      st.met = true;            // (Vô Tião shows up on his bench from now on)
      shot([VO.x + Math.sin(VO.yaw) * 4.2 + 1.2, 2.0, VO.z + Math.cos(VO.yaw) * 4.2], [VO.x, 0.9, VO.z]);
      await say('malu', 'cv.malu.vo');
      shotKid(); B.kid.pose = 'hands'; await say('malu', 'cv.malu.plan'); B.kid.pose = 'idle';
      await say('malu', 'cv.malu.help');
      await you('A bloco to wake up Alba… and Malu’s grandpa with it. I’m in!');
    });
    const go = await UI.choose('Malu: «Bora fazer barulho?» (Let’s make some noise?)', [{ label: 'Chapter 1: Fantasias, now', sub: 'costumes for the bloco, and its name', value: 1 }, { label: 'Later', value: 0 }]);
    if (go) await chapter1();
  }
  async function chapter1() {
    const st = S();
    B.cida.root.visible = true;
    await scene(async () => { standBy(); shotKid(); await say('cida', 'cv.cida.hi'); await say('cida', 'cv.cida.box'); await say('malu', 'cv.malu.dress'); });
    const it = id => ITEMS.find(i => i.id === id);
    const thing = (id, col) => el => { const cv = mkCanvas(170, 130), c = cv.getContext('2d'); c.fillStyle = '#fff8e6'; c.fillRect(0, 0, 170, 130); drawThing(c, id, 85, 66, 1.05, col); el.appendChild(cv); };
    const doll = el => { const cv = mkCanvas(300, 300); cv.style.width = '230px'; drawDoll(cv.getContext('2d'), 300, 300, st.doll); el.appendChild(cv); return cv; };
    const swatch = '<div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;max-width:260px">' + COLORS.map(C => `<span title="${C.en}" style="font:700 12px Bahnschrift,sans-serif;padding:2px 6px;border:2px solid #2b2235;border-radius:8px;background:${C.hex === 'rainbow' ? 'linear-gradient(90deg,#ff4f9a,#ffd23f,#19b37a,#2f7fe0)' : C.hex};color:${['preto', 'roxo', 'azul', 'verde', 'vermelho'].includes(C.id) ? '#fff' : '#2b2235'}">${C.f[0]}</span>`).join('') + '</div>';
    const dressArt = slot => el => { doll(el); const box = document.createElement('div'); box.innerHTML = `<div style="display:flex;gap:6px;justify-content:center;margin-bottom:6px">${ITEMS.filter(i => i.slot === slot).map(i => `<div style="text-align:center;font:800 13px Bahnschrift,sans-serif"><canvas data-th="${i.id}" width="90" height="70" style="width:90px;height:70px;background:#fff8e6;border-radius:10px;border:2px solid #2b2235"></canvas><br>${esc(i.art)} ${esc(i.pt)}</div>`).join('')}</div>${swatch}`; el.appendChild(box); box.querySelectorAll('canvas[data-th]').forEach(cv => drawThing(cv.getContext('2d'), cv.dataset.th, 45, 36, 0.55, 'colorido')); };
    const redo = el => { const cv = el.querySelector('canvas'); if (cv) drawDoll(cv.getContext('2d'), 300, 300, st.doll); };
    const dress = (slot, ask, askEn, model) => ({ kind: `Dress ${MIMO()} · ${SLOTS[slot]}`, art: dressArt(slot), say: [fill(ask), fill(askEn)], model, check: dressCheck(slot), placeholder: 'uma … (and a color)',
      gl: `Pick a thing and a color, and make the color agree: «uma máscara amarel<b>a</b>», «um chapéu amarel<b>o</b>», «os óculos amarel<b>os</b>».`,
      onOk: async (r, text, el) => { const q = readItem(text, slot); if (q.it) { st.doll[slot] = { it: q.it.id, c: q.C ? q.C.id : null }; redo(el); G.sim.mimo.happy = 1; try { Sound.play('poof'); } catch (e) { /* */ } } } });
    const worn = () => ['head', 'face', 'body'].map(k => st.doll[k]).filter(Boolean).map(d => ({ it: it(d.it), C: COLORS.find(C => C.id === d.c) }));
    const describeModel = () => { const w = worn(); if (!w.length) return `O ${MIMO()} tem uma coroa dourada e uma capa vermelha.`; const parts = w.map(({ it: i, C }) => `${i.pl ? (i.g === 'f' ? 'umas' : 'uns') : (i.g === 'f' ? 'uma' : 'um')} ${i.pt}${C ? ' ' + formOf(C, i) : ''}`); return `O ${MIMO()} tem ${parts.slice(0, -1).join(', ')}${parts.length > 1 ? ' e ' : ''}${parts[parts.length - 1]}.`; };
    const steps = [
      { kind: 'New · the costume trunk', art: thing('mascara', 'rosa'), echo: true, model: 'a máscara', modelEn: 'the mask', keys: ['mascara'], say: ['Olha! Uma máscara!', 'Look! A mask!'], voice: true },
      { kind: 'New · the costume trunk', art: thing('coroa', 'dourado'), echo: true, model: 'a coroa', modelEn: 'the crown', keys: ['coroa'], say: ['E uma coroa!', 'And a crown!'], voice: true },
      { kind: 'New · the costume trunk', art: thing('peruca', 'colorido'), echo: true, model: 'a peruca', modelEn: 'the wig', keys: ['peruca'], say: ['Uma peruca colorida!', 'A colorful wig!'], voice: true },
      { kind: 'New · the costume trunk', art: thing('capa', 'vermelho'), echo: true, model: 'a capa', modelEn: 'the cape', keys: ['capa'], say: ['E uma capa vermelha!', 'And a red cape!'], voice: true,
        note: 'There’s more in the trunk: o chapéu (hat), os óculos (glasses), a purpurina (glitter), as asas (wings), o colar de flores (flower necklace).' },
      dress('head', 'O que o {mimo} vai usar na cabeça?', 'What will {mimo} wear on its head?', 'uma coroa dourada'),
      dress('face', 'E no rosto?', 'And on its face?', 'uma máscara azul'),
      dress('body', 'E no corpo?', 'And on its body?', 'uma capa vermelha'),
      { kind: 'Describe it', art: el => doll(el), say: ['Como é a fantasia do {mimo}?', 'What’s {mimo}’s costume like?'].map(fill), model: describeModel, placeholder: `O ${MIMO()} tem…`,
        gl: `Say what ${MIMO()} has on: «O ${esc(MIMO())} tem uma… e uma…»`,
        check: text => {
          const n = ' ' + N(text) + ' ', w = worn(), said = w.filter(({ it: i }) => i.keys.some(k => n.includes(' ' + N(k) + ' ')));
          if (said.length < Math.min(2, w.length)) return { ok: false, why: `Describe at least two things ${esc(MIMO())} is wearing: ${w.map(x => '«' + esc(x.it.pt) + '»').join(', ')}` };
          const colors = COLORS.filter(C => C.f.concat(C.alt || []).some(f => n.includes(' ' + N(f) + ' ')));
          return { ok: true, minor: said.length < w.length || !colors.length, note: said.length < w.length ? 'Next time, everything it’s wearing!' : !colors.length ? 'Next time, with the colors!' : 'Que fantasia!' };
        } },
      { kind: 'Say it to Malu', art: el => el.appendChild(iconCanvas('cvKid', 130)), echo: true, model: 'Que fantasia linda!', modelEn: 'What a lovely costume!', keys: ['que fantasia linda', 'fantasia linda', 'que fantasia bonita'], say: ['E a minha? Gostou?', 'And mine? Do you like it?'], voice: true },
      { kind: 'Compare · maior (bigger)', art: pairArt('coroa', { s: 1.45, c: 'dourado', label: 'a coroa da Malu' }, { s: 0.7, c: 'prateado', label: 'a coroa do Seu Juca' }),
        say: ['Qual coroa é maior?', 'Which crown is bigger?'], model: 'A coroa da Malu é maior do que a do Seu Juca.', modelEn: 'Malu’s crown is bigger than Seu Juca’s.',
        gl: 'Bigger is «maior» (never «mais grande»): «A … é maior do que a …»',
        check: t => {
          if (has(t, 'juca') && !has(t, 'malu')) return { ok: false, why: 'Look again: Seu Juca’s crown is the little one!' };
          if (has(t, ['mais grande', 'mais grandes'])) return { ok: has(t, 'malu'), minor: true, note: 'Bigger is «maior», not «mais grande»!', why: 'Bigger is «maior»: «A coroa da Malu é maior…»' };
          if (!has(t, 'maior')) return { ok: false, why: 'Use «maior» (bigger): «A coroa da Malu é maior…»' };
          if (!has(t, 'malu')) return { ok: true, minor: true, note: 'Say whose it is: «a coroa da Malu»' };
          return { ok: true, minor: !has(t, ['do que', 'que a', 'que o']), note: has(t, ['do que', 'que a', 'que o']) ? '' : 'The full comparison: «… maior do que a do Seu Juca»' };
        } },
      { kind: 'Compare · mais (more)', art: pairArt('peruca', { s: 1.05, c: 'colorido', label: 'a peruca da Dona Cida' }, { s: 1.05, c: 'branco', label: 'a peruca do Seu Juca' }),
        say: ['E qual peruca é mais colorida?', 'And which wig is more colorful?'], model: 'A peruca da Dona Cida é mais colorida do que a do Seu Juca.', modelEn: 'Dona Cida’s wig is more colorful than Seu Juca’s.',
        gl: '«mais … do que» = more … than. «Peruca» is feminine: «mais colorid<b>a</b>».',
        check: t => {
          if (has(t, 'juca') && !has(t, 'cida')) return { ok: false, why: 'Look again: Seu Juca’s wig is plain white!' };
          if (!has(t, 'mais')) return { ok: false, why: 'Use «mais» (more): «A peruca da Dona Cida é mais colorida…»' };
          if (has(t, 'mais colorido')) return { ok: true, minor: true, note: '«Peruca» is feminine: «mais colorida»' };
          return { ok: true, minor: !has(t, 'cida') || !has(t, ['do que', 'que a', 'que o']), note: has(t, 'cida') ? '' : 'Say whose it is: «a peruca da Dona Cida»' };
        } },
      { kind: 'Compare · menos (less)', art: pairArt('capa', { s: 1.25, c: 'rosa', o: { sequins: true }, label: 'a capa da Malu' }, { s: 1.25, c: 'azul', label: 'a capa do {mimo}' }),
        say: fill('A capa do {mimo} é mais brilhante ou menos brilhante do que a da Malu?|Is {mimo}’s cape more or less shiny than Malu’s?').split('|'), model: fill('A capa do {mimo} é menos brilhante.'), modelEn: 'It’s less shiny.',
        gl: '«menos … do que» = less … than. Malu’s has all the sequins!',
        check: t => {
          if (has(t, 'mais') && !has(t, 'menos')) return { ok: false, why: 'Look again: Malu’s cape is the one covered in sequins!' };
          if (!has(t, 'menos')) return { ok: false, why: 'Use «menos» (less): «É menos brilhante.»' };
          return { ok: true, minor: !has(t, 'brilhante'), note: has(t, 'brilhante') ? '' : '«menos brilhante» (less shiny)' };
        } },
      { kind: 'Vote · the bloco’s name', art: el => { el.innerHTML = voteArt(BLOCOS); }, say: ['Agora, o nome do bloco! Tá empatado… Vota!', 'Now, the bloco’s name! It’s a tie… Vote!'], model: 'Eu voto no Bloco do Sino Acordado!',
        gl: 'Say «Eu voto no…» and the name you like. Your vote decides!',
        check: t => { const b = BLOCOS.find(x => has(t, x.keys)); if (!b) return { ok: false, why: 'Pick one of the three names: «Eu voto no…»' }; return { ok: true, minor: !has(t, 'voto'), note: has(t, 'voto') ? '' : 'Vote like this: «Eu voto no…»', said: 'Eu voto no ' + b.name + '!' }; },
        onOk: async (r, t, el) => { const b = BLOCOS.find(x => has(t, x.keys)); if (b) { st.bloco = b.id; el.innerHTML = voteArt(BLOCOS, b.id); CVUI.confetti(30); } } },
      { kind: 'Vote · the theme', art: el => { el.innerHTML = voteArt(TEMAS.map(x => ({ id: x.id, name: x.name, en: x.en }))); }, say: ['E o tema? O fundo do mar, o espaço ou os bichos?', 'And the theme? The bottom of the sea, outer space or the animals?'], model: 'Eu voto no fundo do mar!',
        gl: '«Eu voto no fundo do mar», «no espaço», «nos bichos» (em + os = nos)',
        check: t => { const x = TEMAS.find(q => has(t, q.keys)); if (!x) return { ok: false, why: 'Pick a theme: o fundo do mar, o espaço or os bichos.' }; return { ok: true, minor: !has(t, 'voto'), note: has(t, 'voto') ? '' : 'Vote like this: «Eu voto no…»' }; },
        onOk: async (r, t, el) => { const x = TEMAS.find(q => has(t, q.keys)); if (x) { st.tema = x.id; el.innerHTML = voteArt(TEMAS.map(q => ({ id: q.id, name: q.name, en: q.en })), x.id); CVUI.confetti(30); } } },
      { kind: 'One more thing to say', art: el => el.appendChild(iconCanvas('cvMask', 120)), echo: true, model: 'Vamos pular carnaval!', modelEn: 'Let’s go and celebrate Carnival!', keys: ['vamos pular carnaval', 'bora pular carnaval'],
        say: ['Agora diz comigo: «Vamos pular carnaval!»', 'Now say it with me: «Vamos pular carnaval!»'], note: '«Pular carnaval» (literally «jump Carnival») is how Brazilians say it.', voice: true },
    ];
    const r = await CVUI.steps(steps, { title: 'Fantasias', sub: 'Dona Cida’s costume trunk', face: 'cvKid', name: 'Malu', intro: ['Vamos montar as fantasias!', 'Let’s put the costumes together!'] });
    if (r.quit) { B.cida.root.visible = false; think('Malu waves her whistle: «Depois a gente termina!» (we’ll finish later!)', 3); return; }
    if (!st.bloco) st.bloco = 'sino'; if (!st.tema) st.tema = 'mar';
    st.ch[1] = true; teachAll(['ph.cv.fantasia', 'ph.cv.voto', 'ph.cv.pular']);
    await scene(async () => { standBy(); shotKid(); qgConfetti(70); B.kid.pose = 'cheer'; await say('malu', 'cv.malu.done1'); B.kid.pose = 'idle'; });
    B.cida.root.visible = false;
    coins(4, 'Dona Cida sews a little bloco patch for your bag (and four coins)');
  }

  // ================================================================ chapter 2: a bateria
  const solo = id => { mixSet(0); if (id) MIX[id] = 1; BAT.stop = false; BAT.back = false; BAT.louder = 1; };
  function batOut(on) {
    SCENE.bat = on;
    if (on) B.band.forEach(p => { p.x = p.home.x; p.z = p.home.z; p.y = B.gy(p.x, p.z); p.yaw = p.baseYaw = -Math.PI / 2; p.faceAt = null; });
  }
  async function chapter2() {
    const st = S();
    batOut(true);
    await scene(async () => {
      standBy(); shotKid(); await say('malu', 'cv.malu.bat');
      shot([-21.2, 2.3, -170.4], [-17.2, 1.0, -173.0]); await say('juca', 'cv.juca.hi');
      shotKid(); whistle(); B.kid.pose = 'point'; await say('malu', 'cv.malu.apito'); B.kid.pose = 'idle';
    });
    // the instruments, one by one: each heard on its own (the bloco's samba, soloed), then a few named by ear
    music('pt_bloco', 0.34, { duck: 0.15 });
    const learn = INST.map((I, n) => ({ kind: `New · the bateria (${n + 1}/8)`, art: el => { solo(I.id); el.appendChild(iconCanvas('cv_' + I.id, 120)); const d = document.createElement('div'); d.style.cssText = 'font:900 20px Bahnschrift,sans-serif;color:#2f5fb5'; d.textContent = '♪ ' + I.sound; el.appendChild(d); },
      echo: true, model: I.pt, modelEn: I.en, keys: I.keys, gl: esc(I.en), note: esc(I.note), voice: true, say: n === 0 ? ['Escuta só! Cada instrumento sozinho.', 'Just listen! Each instrument on its own.'] : null }));
    const quiz = CVUI.shuffle(INST.slice()).slice(0, 3).map((I, n) => ({ kind: `By ear · which one is playing? (${n + 1}/3)`, art: el => { solo(I.id); el.innerHTML = `<div style="font:900 64px Bahnschrift,sans-serif;color:#d6286f">?</div><div style="font:900 20px Bahnschrift,sans-serif;color:#2f5fb5">♪ ${esc(I.sound)}</div>`; },
      model: I.pt, modelEn: I.en, keys: I.keys, placeholder: 'o… / a…', gl: 'Listen (or read the sound), and name it.', say: n === 0 ? ['Agora, de ouvido! Que instrumento é?', 'Now, by ear! Which instrument is it?'] : null }));
    const r = await CVUI.steps(learn.concat(quiz), { title: 'A bateria', sub: 'the eight instruments', face: 'cvJuca', name: 'Seu Juca', intro: ['Eu toco, você aprende.', 'I play, you learn.'] });
    solo(null);
    if (r.quit) { musicOff(); batOut(false); return; }
    // you're in charge: call each section in, stop, bring it back
    const grades = await batTPR();
    musicOff(); mixSet(1);
    if (!grades) { batOut(false); return; }
    st.ch[2] = true; st.batGrades = grades;
    await scene(async () => { standBy(); shotKid(); qgConfetti(50); B.kid.pose = 'cheer'; await say('malu', 'cv.malu.batdone'); B.kid.pose = 'idle'; shot([-21.2, 2.3, -170.4], [-17.2, 1.0, -173.0]); await say('juca', 'cv.juca.smile'); });
    batOut(false);
    teachAll(['ph.cv.paradinha', 'ph.cv.volta', 'ph.cv.forte', 'ph.cv.todomundo']);
    coins(5, 'Seu Juca slips you a coin for every year he missed playing');
  }
  // the bateria in the lane, you in front of it: calls in the bar at the bottom of the screen
  const BAT_CALLS = [
    { model: 'Surdo!', modelEn: 'The surdos!', keys: INSTI.surdo.keys, title: 'Bring in the <b>surdos</b>: the heart of the bateria!', iconKey: 'cv_surdo', act: () => { MIX.surdo = 1; } },
    { model: 'Caixa!', modelEn: 'The snares!', keys: INSTI.caixa.keys, title: 'Now the <b>caixas</b> (the snares)!', iconKey: 'cv_caixa', act: () => { MIX.caixa = 1; } },
    { model: 'Tamborim!', modelEn: 'The tamborins!', keys: INSTI.tamborim.keys, title: 'Bring in the <b>tamborins</b>!', iconKey: 'cv_tamborim', act: () => { MIX.tamborim = 1; } },
    { model: 'Agogô!', modelEn: 'The agogô!', keys: INSTI.agogo.keys, title: 'And the double bell: the <b>agogô</b>!', iconKey: 'cv_agogo', act: () => { MIX.agogo = 1; } },
    { model: 'Todo mundo junto!', modelEn: 'Everybody together!', keys: ['todo mundo', 'todos', 'geral', 'todo mundo junto'], title: 'Now <b>everybody together</b>!', icon: '🙌', act: () => { mixSet(1); } },
    { model: 'Paradinha!', modelEn: 'The little stop!', keys: ['paradinha', 'para tudo', 'parada'], title: 'Stop everything for a moment: the <b>paradinha</b>!', icon: '✋', act: () => { BAT.stop = true; BAT.back = false; }, wait: 2.4 },
    { model: 'Volta!', modelEn: 'Back in!', keys: ['volta', 'voltem', 'voltou'], title: 'Bring them <b>back in</b>!', icon: '💥', act: () => { BAT.back = true; } },
    { model: 'Mais forte!', modelEn: 'Louder!', keys: ['mais forte', 'mais alto', 'forte'], title: '<b>Louder</b>! Wake up the whole street!', icon: '📣', act: () => { BAT.louder = 1.45; setTimeout(() => { BAT.louder = 1; }, 4200); } },
    { model: 'Só o surdo!', modelEn: 'Only the surdo!', keys: ['so o surdo', 'so os surdos', 'so surdo', 'somente o surdo', 'apenas o surdo', 'so surdos'], title: '<b>Only the surdos</b>! Just the heartbeat.', iconKey: 'cv_surdo', act: () => { mixSet(0, ['surdo', 'tuba']); } },
    { model: 'Todo mundo!', modelEn: 'Everybody!', keys: ['todo mundo', 'todos', 'geral', 'todo mundo junto'], title: 'And <b>everybody</b>, one last time!', icon: '🎉', act: () => { mixSet(1); } },
  ];
  async function batTPR() {
    batOut(true); solo(null); MIX.tuba = 0; music('pt_bloco', 0.5, { duck: 0.08 });
    const k = B.kid; SCENE.kidBusy = true; k.x = SPOT.malu2.x; k.z = SPOT.malu2.z; k.y = B.gy(k.x, k.z); k.faceAt = { x: -16, z: -173 }; k.pose = 'idle';
    standAt(SPOT.you2, { x: -16, z: -173 });
    shot([-21.9, 3.9, -177.6], [-16.3, 0.8, -172.7]); lock(true);
    CVUI.hud.open('A bateria · you’re in charge: call it!');
    const grades = []; let quit = false;
    try {
      for (let i = 0; i < BAT_CALLS.length; i++) {
        const c = BAT_CALLS[i];
        CVUI.hud.cue({ iconKey: c.iconKey, icon: c.icon, title: c.title, sub: `Call it in Portuguese! (${i + 1}/${BAT_CALLS.length})`, bar: i / BAT_CALLS.length });
        const g = await CVUI.hud.call({ model: c.model, modelEn: c.modelEn, keys: c.keys });
        if (g === 'quit') { quit = true; break; }
        grades.push(g); whistle(); c.act(); if (i === 3) MIX.tuba = 1;
        k.pose = 'cheer'; G.sim.mimo.happy = 1;
        await ZHF.wait(c.wait || 1.9); k.pose = 'idle';
        if (BAT.back && BAT.stop) { BAT.stop = false; BAT.back = false; }      // (the song brings them back on a downbeat; with no music playing, right away)
      }
    } finally { CVUI.hud.close(); lock(false); G.cam.override = null; SCENE.kidBusy = false; k.faceAt = null; k.x = SPOT.kid.x; k.z = SPOT.kid.z; k.y = B.gy(k.x, k.z); k.yaw = k.baseYaw = SPOT.kid.yaw; BAT.stop = false; BAT.back = false; BAT.louder = 1; }
    return quit ? null : grades;
  }

  // ================================================================ chapter 3: marchinhas
  function lyricHTML(m, cur, done, mode) {
    const Mm = MARCH[m], gap = s => s.split(' ').map(w => '_'.repeat(Math.max(2, Math.min(7, N(w).length)))).join(' ');
    return `<div class="lyr"><p style="font-weight:900;margin-bottom:4px">♪ ${esc(fill(Mm.title))}</p>` + Mm.lines.map(([call, resp], i) => {
      const r = fill(resp), shownR = i < done || mode === 'all' ? esc(r) : mode === 'hint' ? `<span class="gap">${esc(CVUI.hintOf(r, 1))}</span>` : `<span class="gap">${gap(r)}</span>`;
      return `<p class="call ${i === cur ? 'now' : ''}">${esc(fill(call))}</p><p class="resp">— ${shownR}</p>`;
    }).join('') + '</div>';
  }
  function marchSteps(m, mode) {
    const Mm = MARCH[m];
    return Mm.lines.map(([call, resp, callEn, respEn], i) => ({
      kind: `${mode === 'memory' ? 'From memory' : 'Sing along'} · ${fill(Mm.title)} (${i + 1}/4)`, art: el => { el.innerHTML = lyricHTML(m, i, i, mode === 'memory' ? 'none' : mode === 'echo' ? 'all' : 'hint'); },
      say: [fill(call), fill(callEn)], model: fill(resp), modelEn: fill(respEn), echo: mode === 'echo', gl: mode === 'memory' ? 'Malu sings the call. You sing the answer, from memory!' : `Malu sings «${esc(fill(call))}»… you answer!`,
      note: i === 0 && mode !== 'memory' ? esc(fill(Mm.note)) : '',
      onOk: async () => { CVUI.confetti(26); qgConfetti(36); G.sim.mimo.happy = 1.2; },
    }));
  }
  async function sing(m, mode, title) {
    MARCHA.tune = m; music('pt_marcha', 0.36, { duck: 0.12 }); try { ZHF.music.stop(true); } catch (e) { /* */ }
    return CVUI.steps(marchSteps(m, mode), { title: title || 'Marchinha', sub: fill(MARCH[m].title) + ' · ' + fill(MARCH[m].en), face: 'cvKid', name: 'Malu', intro: ['Eu canto, você responde!', 'I sing, you answer!'] });
  }
  async function chapter3() {
    const st = S();
    await scene(async () => { standBy(); shotKid(); await say('malu', 'cv.malu.march'); await say('malu', 'cv.malu.chiquinha'); await say('malu', 'cv.malu.call'); });
    try {
      for (let m = 0; m < 3; m++) {
        const r = await sing(m, m === 0 ? 'echo' : 'hint', `Marchinha ${m + 1} of 3`);
        if (r.quit) return;
        st.sung = Math.max(st.sung || 0, m + 1);
        if (m === 1) {      // the confetti marchinha: then a real handful of it
          music('pt_marcha', 0.3, { duck: 0.12 });
          const c = await CVUI.steps([{ kind: 'Confete!', art: el => { el.innerHTML = '<div style="font:900 56px Bahnschrift,sans-serif;letter-spacing:.1em"><span style="color:#ff4f9a">●</span><span style="color:#ffd23f">■</span><span style="color:#19b37a">●</span><span style="color:#2f7fe0">■</span><span style="color:#8a4fd8">●</span></div>'; },
            echo: true, model: 'Joga confete!', modelEn: 'Throw the confetti!', keys: ['joga confete', 'joguem confete', 'jogar confete'], voice: true, say: ['Toma, um saco de confete! Diz: «Joga confete!»', 'Here, a bag of confetti! Say: «Joga confete!»'],
            note: '«Jogar» is to throw (and to play a game). Confete: paper confetti. Serpentina: a paper streamer.', onOk: async () => { for (let k = 0; k < 3; k++) { CVUI.confetti(40); qgConfetti(90); } } }], { title: 'Confete e serpentina', face: 'cvKid', name: 'Malu' });
          if (c.quit) return;
        }
      }
      const mem = await sing(0, 'memory', 'The anthem, by heart');
      if (mem.quit) return;
    } finally { musicOff(); }
    st.ch[3] = true; teachAll(['ph.cv.chegou', 'ph.cv.confete', 'ph.cv.picole', 'ph.cv.barulhao']);
    await scene(async () => { standBy(); shotKid(); qgConfetti(80); B.kid.pose = 'cheer'; await say('malu', 'cv.malu.done3'); B.kid.pose = 'idle'; });
    coins(5, 'Malu pins the lyrics to the chalkboard, and pays you in sweets money');
  }
  // ================================================================ chapter 4: organizing the bloco
  // ---------------- the route on a map of Alba (north up), drawn from the town's own layout
  const MAPB = { x0: -40, z0: -184, s: 6.0 };
  const mp = (x, z) => [(x - MAPB.x0) * MAPB.s, (z - MAPB.z0) * MAPB.s];
  const HEAD = { east: [1, 0], south: [0, 1], west: [-1, 0], north: [0, -1] };
  const turnVec = (h, d) => { const [x, y] = HEAD[h]; return d === 'direita' ? [-y, x] : d === 'esquerda' ? [y, -x] : [x, y]; };
  // prog: { upto (route index reached), frac (along the next segment), arc (0..1 round the fountain), head, wrong: dir }
  function drawMap(c, W, H, prog) {
    c.save(); c.fillStyle = '#efe6cf'; c.fillRect(0, 0, W, H);
    const L = typeof TOWN !== 'undefined' && TOWN.layout;
    if (L) {
      c.fillStyle = '#d9c4a0'; c.strokeStyle = 'rgba(43,34,53,.3)'; c.lineWidth = 1;
      for (const b of L.buildings || []) { if (b.x < -46 || b.x > 32 || b.z < -190 || b.z > -126) continue; const [x, y] = mp(b.x, b.z), w = (b.w || 3) * MAPB.s, d = (b.d || 3) * MAPB.s; c.save(); c.translate(x, y); c.rotate(-(b.rot || 0)); c.fillRect(-w / 2, -d / 2, w, d); c.strokeRect(-w / 2, -d / 2, w, d); c.restore(); }
      c.lineCap = c.lineJoin = 'round';
      for (const s of L.streets || []) { c.strokeStyle = '#fbf6ea'; c.lineWidth = s.w * MAPB.s; c.beginPath(); s.pts.forEach(([x, z], i) => { const [px, py] = mp(x, z); i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke(); }
      const [px, py] = mp(PLAZA.x, PLAZA.z); c.fillStyle = '#f4ead4'; c.beginPath(); c.arc(px, py, 12 * MAPB.s, 0, TAU); c.fill(); c.strokeStyle = 'rgba(43,34,53,.25)'; c.stroke();
    }
    const lab = (t, x, z, col, dy = 0) => { const [px, py] = mp(x, z); c.font = '800 13px Bahnschrift, "Segoe UI", sans-serif'; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = '#fffaf0'; c.strokeText(t, px, py + dy); c.fillStyle = col || '#2b2235'; c.fillText(t, px, py + dy); };
    // landmarks: the tower, the bakery, the market's stalls, the plaza's fountain, the school, the ways out
    { const [x, y] = mp(TOWER.x, TOWER.z); c.fillStyle = '#8a5ab0'; c.fillRect(x - 11, y - 11, 22, 22); c.strokeStyle = '#2b2235'; c.lineWidth = 2; c.strokeRect(x - 11, y - 11, 22, 22); }
    { const [x, y] = mp(PLAZA.x, PLAZA.z); c.fillStyle = '#7fc8f0'; c.beginPath(); c.arc(x, y, 2.6 * MAPB.s, 0, TAU); c.fill(); c.strokeStyle = '#2b2235'; c.lineWidth = 2; c.stroke(); }
    for (let i = 0; i < 6; i++) { const [x, y] = mp(7 + i * 3, -150.6); c.fillStyle = i % 2 ? '#ff4f9a' : '#ffd23f'; c.fillRect(x - 6, y - 4, 12, 8); }
    lab('Torre', TOWER.x, TOWER.z + 3.6); lab('Padaria', 4, -158.6); lab('Mercado', 15, -153.2, '#d6286f'); lab('Praça', PLAZA.x, PLAZA.z + 6.4); lab('Chafariz', PLAZA.x, PLAZA.z - 3.4, '#2f5fb5'); lab('Escola', -15, -181.5);
    c.font = '800 13px Bahnschrift, sans-serif'; c.fillStyle = '#8a8f9e'; c.textAlign = 'left'; c.fillText('↑ portão norte', mp(-10, 0)[0] + 18, 14); c.textAlign = 'right'; c.fillText('portão leste →', W - 6, mp(0, -150)[1] + 24);
    // the route so far: from the concentração (★) to where the bloco has got to
    const pts = [], upto = prog.upto, P = i => mp(ROUTE[i][0], ROUTE[i][1]);
    for (let i = 0; i <= upto; i++) pts.push(P(i));
    if (prog.frac > 0 && upto + 1 < ROUTE.length) { const a = P(upto), b = P(upto + 1); pts.push([lerp(a[0], b[0], prog.frac), lerp(a[1], b[1], prog.frac)]); }
    if (prog.arc > 0) { const [cx, cy] = mp(PLAZA.x, PLAZA.z), a0 = Math.atan2(pts[pts.length - 1][1] - cy, pts[pts.length - 1][0] - cx), r = Math.hypot(pts[pts.length - 1][0] - cx, pts[pts.length - 1][1] - cy); for (let k = 1; k <= 30; k++) { const a = a0 - prog.arc * TAU * 0.92 * (k / 30); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }
    c.strokeStyle = '#ff4f9a'; c.lineWidth = 6; c.setLineDash([]); c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    { const [x, y] = P(0); c.fillStyle = '#ffd23f'; c.strokeStyle = '#2b2235'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4 : 10; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); }
    // where the bloco is now, and which way it's facing
    const [hx, hy] = pts[pts.length - 1], [dx, dy] = HEAD[prog.head] || [1, 0];
    if (prog.wrong) { const [wx, wy] = turnVec(prog.head, prog.wrong); c.strokeStyle = '#d6286f'; c.setLineDash([6, 5]); c.lineWidth = 4; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + wx * 38, hy + wy * 38); c.stroke(); c.setLineDash([]); c.font = '900 22px sans-serif'; c.fillStyle = '#d6286f'; c.textAlign = 'center'; c.fillText('✗', hx + wx * 48, hy + wy * 48 + 8); }
    c.fillStyle = '#19b37a'; c.strokeStyle = '#2b2235'; c.lineWidth = 2.5; c.beginPath(); c.arc(hx, hy, 9, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = '#fffaf0'; c.beginPath(); c.moveTo(hx + dx * 7, hy + dy * 7); c.lineTo(hx - dy * 5 - dx * 3, hy + dx * 5 - dy * 3); c.lineTo(hx + dy * 5 - dx * 3, hy - dx * 5 - dy * 3); c.closePath(); c.fill();
    c.restore();
  }
  const DIRS = [['volta', ['volta', 'contorna', 'rodeia', 'ao redor', 'em volta']], ['direita', ['direita']], ['esquerda', ['esquerda']], ['reto', ['reto', 'em frente', 'frente', 'direto']]];
  const dirOf = t => { for (const [d, keys] of DIRS) if (has(t, keys)) return d; return null; };
  async function routeMap() {
    const prog = { upto: 1, frac: 0, arc: 0, head: 'east', wrong: null };
    let cv = null;
    const paint = () => { if (cv) drawMap(cv.getContext('2d'), cv.width, cv.height, prog); };
    const art = el => { cv = mkCanvas(456, 360); cv.style.width = '440px'; el.appendChild(cv); paint(); };
    const anim = (to, arc) => new Promise(res => {
      const fromU = prog.upto, steps = CVUI.fast ? 1 : 30; let k = 0;
      const tick = () => {
        k++; const u = k / steps;
        if (arc) prog.arc = u; else { const pos = fromU + (to - fromU) * u; prog.upto = Math.floor(pos); prog.frac = pos - prog.upto; if (prog.upto >= to) { prog.upto = to; prog.frac = 0; } }
        paint(); if (k < steps) setTimeout(tick, 40); else res();
      };
      tick();
    });
    const steps = TURNS.map((T, n) => ({
      kind: `The route · ${n + 1} of ${TURNS.length}`, art, say: T.say, model: T.model, modelEn: T.modelEn, gl: esc(T.q), placeholder: 'vira… / segue… / dá…',
      check: t => {
        const d = dirOf(t);
        if (!d) return { ok: false, why: 'Say which way: «Vira à direita», «Vira à esquerda», «Segue reto» or «Dá a volta».' };
        if (d !== T.ok) { prog.wrong = d; paint(); return { ok: false, why: esc(T.no[d] || 'Not that way!') }; }
        const verb = has(t, ['vira', 'vire', 'virar', 'segue', 'siga', 'seguir', 'vai', 'va', 'continua', 'da a volta', 'de a volta', 'dar a volta', 'contorna']);
        return { ok: true, minor: !verb, note: verb ? esc(T.after) : `Say it as a command: «${esc(T.model)}»` };
      },
      onOk: async () => { prog.wrong = null; const nx = TURNS[n + 1]; if (nx) { await anim(nx.at); prog.head = nx.head; } else await anim(0, true); paint(); },
    }));
    return CVUI.steps(steps, { title: 'O caminho do bloco', sub: 'plan the route through Alba', face: 'cvKid', name: 'Malu', intro: ['Da torre até a praça, passando pelo mercado!', 'From the tower to the plaza, by way of the market!'] });
  }
  // ---------------- the invitations (out in town: Rosa, Bruno, Marta and Nico)
  async function ask(o) {
    const inp = document.getElementById('command-input'); if (inp) { inp.dataset.model = o.model || ''; inp.dataset.roman = o.model || ''; }     // (tests: ZHF.drive types the model)
    const r = await UI.command({ name: 'Malu', icon: o.icon || 'cvMask', title: o.title, verbs: [], hint: o.hint || '', placeholder: 'say it in Portuguese…', model: o.model, modelEn: o.modelEn });
    return !r || r.cancelled ? null : r;
  }
  async function invite(id) {
    const st = S(), Gs = GUESTS.find(g => g.id === id); if (!Gs || st.inv[id]) return;
    const n = G.sim.npc(id); if (!n) return;
    await scene(async () => {
      standAt({ x: n.x + Math.sin(n.yaw) * 1.6, z: n.z + Math.cos(n.yaw) * 1.6 }, n);
      for (let tries = 0; ; tries++) {
        const r = await ask({ title: Gs.ask, model: Gs.model, modelEn: Gs.modelEn, hint: tries ? Gs.why : 'An invitation («Você quer…?») or a request («Você pode…?»).' });
        if (!r) return;
        if (Gs.need.every(list => has(r.text, list))) {
          try { Sound.play(tries ? 'review' : 'perfect'); } catch (e) { /* */ }
          n.wave = true; await say(id, Gs.line); n.wave = false;
          st.inv[id] = true; coins(2, `${NAMES[id]} is in`);
          break;
        }
        try { Sound.play('wrong'); } catch (e) { /* */ }
        think(Gs.why, 3.5);
      }
    });
    const left = GUESTS.filter(g => !st.inv[g.id]).length;
    think(left ? `${4 - left} of 4 invited. ${left} to go!` : 'Everyone’s in! Back to Malu at the bell tower.', 4);
  }
  // ---------------- the estandarte and the abre-alas banner
  function makeStandard() {
    if (B.std) { B.std.paint(); return B.std; }
    const g = new THREE.Group(), k = ZHF.Kit();
    k.rod([0, 0, 0], [0, 2.95, 0], 0.035, '#8a5f3e').rod([-0.44, 2.62, 0.02], [0.44, 2.62, 0.02], 0.025, '#e8b828').ball(0, 3.0, 0, 0.075, 0.075, 0.075, '#e8b828', { ink: 0.006 });
    for (const s of [-1, 1]) k.ball(s * 0.46, 2.62, 0.02, 0.045, 0.045, 0.045, '#e8b828', { ink: 0 });
    for (let i = 0; i < 9; i++) k.rod([-0.38 + i * 0.095, 1.5, 0.05], [-0.38 + i * 0.095, 1.36, 0.05], 0.012, '#e8b828', { ink: 0 });
    ZHF.bake(g, k);
    const tex = ZHF.canvasTex(240, 320, (c, w, h) => drawStandard(c, w || 240, h || 320, (G.state.cv && G.state.cv.std) || {}));
    const cloth = ZHF.plane(0.82, 1.1, tex, { double: true }); cloth.position.set(0, 2.06, 0.05); g.add(cloth);
    g.visible = false; B.root.add(g);
    B.std = { g, tex, paint() { try { drawStandard(tex.image.getContext('2d'), 240, 320, S().std || {}); tex.needsUpdate = true; } catch (e) { /* */ } } };
    B.std.paint();
    return B.std;
  }
  // the banner: hung under the streamers at the HQ, and carried on two poles at the front of the parade
  function makeBanner() {
    if (B.banner) { B.banner.paint(); return B.banner; }
    const tex = ZHF.canvasTex(1024, 128, (c, w, h) => drawBanner(c, w || 1024, h || 128, fill(`Abram alas para o {bloco}!`)));
    const p1 = SPOT.pole1, p2 = SPOT.pole2, L = Math.hypot(p2.x - p1.x, p2.z - p1.z) - 0.2, hang = ZHF.plane(L, L / 8, tex, { double: true });
    hang.position.set((p1.x + p2.x) / 2, B.gy(p1.x, p1.z) + 1.85, (p1.z + p2.z) / 2); hang.rotation.y = Math.atan2(-(p2.z - p1.z), p2.x - p1.x) + Math.PI; B.root.add(hang);      // (its front to the lane) hang.visible = false;
    const carry = new THREE.Group(), k = ZHF.Kit(); k.rod([-1.15, 0, 0], [-1.15, 2.6, 0], 0.03, '#8a5f3e').rod([1.15, 0, 0], [1.15, 2.6, 0], 0.03, '#8a5f3e'); ZHF.bake(carry, k);
    const cl = ZHF.plane(2.3, 0.42, tex, { double: true }); cl.position.set(0, 2.25, 0.02); carry.add(cl); carry.visible = false; B.root.add(carry);
    B.banner = { hang, carry, tex, paint() { try { drawBanner(tex.image.getContext('2d'), 1024, 128, fill('Abram alas para o {bloco}!')); tex.needsUpdate = true; } catch (e) { /* */ } } };
    B.banner.paint();
    return B.banner;
  }
  function showDecor() {
    const st = S(); if (!st.ch[4] || !B) return;
    const sd = makeStandard(), bn = makeBanner();
    if (!SCENE.par) { const at = SPOT.stand; sd.g.position.set(at.x, B.gy(at.x, at.z), at.z); sd.g.rotation.set(0, 2.4, 0); sd.g.visible = true; }
    bn.hang.visible = !SCENE.par;
  }
  async function chapter4() {
    const st = S();
    if (!st.route) {
      await scene(async () => { standBy(); shotKid(); await say('malu', 'cv.malu.org'); await say('malu', 'cv.malu.route'); });
      const items = [PHI['ph.cv.direita'], { pt: 'Vira à esquerda!', en: 'Turn left!', note: '«esquerda» = left, «direita» = right.', sit: 'Now the bloco has to turn left. Tell it!', keys: ['vira a esquerda', 'vire a esquerda'] },
        PHI['ph.cv.reto'], { pt: 'Dá a volta!', en: 'Go around! / Turn around!', note: '«Dar a volta» is to go around something: «Dá a volta no chafariz» (round the fountain).', sit: 'There’s a fountain in the way. Tell the bloco to go around it!', keys: ['da a volta', 'de a volta'] }];
      const l = await CVUI.lesson({ title: 'Directions', sub: 'to lead a bloco through town', face: 'cvKid', name: 'Malu', intro: ['Pra guiar o bloco, a gente precisa disso!', 'To lead the bloco, we need these!'], items });
      if (l.quit) return;
      const r = await routeMap(); if (r.quit) return;
      st.route = true;
    }
    if (!st.invRound) {
      await scene(async () => { standBy(); shotKid(); await say('malu', 'cv.malu.invite'); });
      st.invRound = true;
      UI.toast('Invite Dona Rosa (her stall), Bruno (his yard), Marta (the bakery) and Nico. Malu’s tip: «Você quer…?» and «Você pode…?»');
      return;
    }
    const n = GUESTS.filter(g => st.inv[g.id]).length;
    if (n < GUESTS.length) { await scene(async () => { standBy(); shotKid(); await say('malu', 'cv.malu.invite2'); }); think(`${n} of 4 invited so far.`, 3); return; }
    await scene(async () => { standBy(); shotKid(); await say('malu', 'cv.malu.stand'); });
    // the estandarte: its colors, the emblem in the middle, the name; then the banner
    st.std = st.std || { cols: [], emblem: null, name: '' };
    const T = temaOf(), cw = hex => (COLORS.find(C => C.hex === hex) || COLORS[1]).f[0], emb = EMBLEMS.find(e => e.id === T.emblem) || EMBLEMS[0];
    const stdArt = el => { const cv = mkCanvas(240, 320); cv.style.width = '170px'; drawStandard(cv.getContext('2d'), 240, 320, st.std); el.appendChild(cv); };
    const redraw = el => { const cv = el.querySelector('canvas'); if (cv) drawStandard(cv.getContext('2d'), 240, 320, st.std); };
    const colorsIn = t => { const n0 = ' ' + N(t) + ' '; return COLORS.map(C => ({ C, i: Math.min(...C.f.concat(C.alt || []).map(f => { const j = n0.indexOf(' ' + N(f) + ' '); return j < 0 ? 1e9 : j; })) })).filter(x => x.i < 1e9).sort((a, b) => a.i - b.i).map(x => x.C); };
    const r = await CVUI.steps([
      { kind: 'The estandarte · its colors', art: stdArt, say: ['De que cor é o estandarte?', 'What color is the estandarte?'], model: `O estandarte é ${cw(T.cols[0])} e ${cw(T.cols[1])}!`, gl: 'Two colors: «O estandarte é verde e amarelo!» («estandarte» is masculine.)',
        check: t => { const cs = colorsIn(t); if (!cs.length) return { ok: false, why: 'Say its colors: «O estandarte é… e…»' }; const fem = cs.some(C => C.f[0] !== C.f[1] && has(t, C.f[1])); return { ok: true, minor: cs.length < 2 || fem, note: fem ? '«Estandarte» is masculine: «amarelo», «vermelho»…' : cs.length < 2 ? 'Two colors next time!' : '' }; },
        onOk: async (rr, t, el) => { st.std.cols = colorsIn(t).slice(0, 2).map(C => C.id); if (st.std.cols.length === 1) st.std.cols.push('amarelo'); redraw(el); } },
      { kind: 'The estandarte · in the middle', art: stdArt, say: ['E o que tem no meio?', 'And what’s in the middle?'], model: `Um ${emb.keys[0]}!`.replace(/^Um (estrela|lua|flor)/, 'Uma $1'),
        gl: 'A picture: um sino (a bell), uma estrela (a star), um peixe (a fish), um gato (a cat), um sol, uma lua, uma flor, um coração…',
        check: t => { const e = EMBLEMS.find(x => has(t, x.keys)); return e ? { ok: true } : { ok: false, why: 'Pick something to paint: «um sino», «uma estrela», «um peixe»…' }; },
        onOk: async (rr, t, el) => { const e = EMBLEMS.find(x => has(t, x.keys)); if (e) st.std.emblem = e.id; redraw(el); } },
      { kind: 'The estandarte · the name', art: stdArt, say: ['E o nome do bloco, bem grande!', 'And the bloco’s name, nice and big!'], model: blocoName(), gl: 'Write the bloco’s name on it.',
        check: t => { const b = blocoOf(); if (b && !has(t, b.keys)) return { ok: false, why: `The bloco’s name is «${esc(blocoName())}»` }; return { ok: true, minor: !N(t).includes(N(blocoName())), note: '' }; },
        onOk: async (rr, t, el) => { st.std.name = blocoName(); redraw(el); CVUI.confetti(30); } },
      { kind: 'The abre-alas banner', art: el => { const cv = mkCanvas(512, 64); cv.style.width = '440px'; drawBanner(cv.getContext('2d'), 512, 64, '…'); el.appendChild(cv); }, say: ['E a faixa do abre-alas, que vai na frente de tudo?', 'And the abre-alas banner, which goes in front of everything?'],
        model: fill('Abram alas para o {bloco}!'), modelEn: 'Make way for the bloco!', gl: '«Abram alas» = make way (alas: the rows of people on each side).',
        check: t => has(t, ['alas', 'ala']) ? { ok: true, minor: !has(t, ['abram alas', 'abre alas']), note: has(t, ['abram alas', 'abre alas']) ? '' : '«Abram alas!»' } : { ok: false, why: 'It starts «Abram alas…» (make way…)' },
        onOk: async (rr, t, el) => { const cv = el.querySelector('canvas'); if (cv) drawBanner(cv.getContext('2d'), 512, 64, fill('Abram alas para o {bloco}!')); CVUI.confetti(36); } },
    ], { title: 'O estandarte', sub: 'the bloco’s banner', face: 'cvCida', name: 'Dona Cida', intro: ['Eu costuro, você decide!', 'I sew, you decide!'] });
    if (r.quit) return;
    if (!st.std.cols.length) st.std.cols = [T.cols[0], T.cols[1]].map(h => (COLORS.find(C => C.hex === h) || COLORS[1]).id);
    if (!st.std.emblem) st.std.emblem = T.emblem; st.std.name = blocoName();
    st.ch[4] = true; showDecor();
    await scene(async () => { standBy(); shot([SPOT.stand.x + 2.6, 2.4, SPOT.stand.z - 2.4], [SPOT.stand.x, 1.9, SPOT.stand.z]); qgConfetti(60); await say('malu', 'cv.malu.done4'); });
    teachAll(['ph.cv.direita', 'ph.cv.reto', 'ph.cv.pode', 'ph.cv.topa']);
    coins(6, 'Bruno, Marta, Rosa and Nico chip in for the bloco: a bag of coins');
  }

  // ================================================================ chapter 5: the parade
  // the path: back along the lane by the tower, then the planned route, then round the fountain (200°)
  const PAR = { s: 0, target: 0, speed: 1.9, path: null, cam: true, join: 0, s0: 0, homes: null };
  function parPath() {
    if (PAR.path) return PAR.path;
    const pts = [{ x: -33.0, z: -169.6 }, { x: -26.0, z: -173.0 }].concat(ROUTE.map(([x, z]) => ({ x, z })));
    const last = pts[pts.length - 1], a0 = Math.atan2(last.z - PLAZA.z, last.x - PLAZA.x);
    for (let k = 1; k <= 28; k++) { const a = a0 - (k / 28) * (200 * Math.PI / 180); pts.push({ x: PLAZA.x + Math.cos(a) * 6.3, z: PLAZA.z + Math.sin(a) * 6.3 }); }
    let d = 0; pts.forEach((p, i) => { if (i) d += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z); p.d = d; });
    PAR.path = { pts, len: d, atRoute: i => pts[i + 2].d };
    return PAR.path;
  }
  function pathAt(s) {
    const pts = parPath().pts;
    const seg = (a, b, u) => { const L = Math.hypot(b.x - a.x, b.z - a.z) || 1e-4, tx = (b.x - a.x) / L, tz = (b.z - a.z) / L; return { x: a.x + (b.x - a.x) * u, z: a.z + (b.z - a.z) * u, tx, tz }; };
    if (s <= 0) { const r = seg(pts[0], pts[1], 0); r.x += r.tx * s; r.z += r.tz * s; return r; }
    for (let i = 1; i < pts.length; i++) if (pts[i].d >= s) return seg(pts[i - 1], pts[i], (s - pts[i - 1].d) / Math.max(1e-4, pts[i].d - pts[i - 1].d));
    return seg(pts[pts.length - 2], pts[pts.length - 1], 1);
  }
  // who walks where: [who, distance behind the front, sideways]
  const FORM = [['ban1', 0, -1.15], ['ban2', 0, 1.15], ['bruno', 1.5, 0], ['malu', 2.8, -0.7], ['you', 2.9, 0.75], ['mimo', 3.9, 0.1],
    ['band0', 5.0, -0.7], ['band1', 5.0, 0.7], ['band2', 6.1, -0.7], ['band3', 6.1, 0.7], ['band4', 7.2, -0.7], ['band5', 7.2, 0.7], ['band6', 8.3, -0.7], ['band7', 8.3, 0.7],
    ['cida', 9.5, -0.7], ['rosa', 9.5, 0.7], ['baker', 10.6, -0.7], ['kid', 10.6, 0.7],
    ['x0', 11.8, -0.8], ['x1', 11.8, 0.8], ['x2', 12.9, -0.8], ['x3', 12.9, 0.8], ['x4', 14.0, -0.8], ['x5', 14.0, 0.8], ['x6', 15.1, -0.8], ['x7', 15.1, 0.8]];
  // the marchers: two banner carriers, and townsfolk in costumes who join after the Hush is driven off (the theme's colors)
  function makeMarchers() {
    if (B.marchers) return B.marchers;
    const T = temaOf(), cols = T.cols, skins = ['#f0c7a0', '#a8714a', '#e8b48a', '#5e3a28', '#c98e62', '#7a4a32', '#f5cda2', '#8d5a3c', '#b07a52', '#e8b48a'];
    const list = [];
    for (let i = 0; i < 10; i++) {
      const look = { skin: skins[i], hair: ['#2b1d18', '#6b3b25', '#c98a4a', '#1d1512'][i % 4], shirt: cols[i % 3], sleeve: cols[i % 3], pants: cols[(i + 1) % 3], shoes: '#2b2235', kid: i === 4 || i === 7, glasses: i === 5,
        hat: i % 3 === 0 ? 'beanie' : null, hatCol: cols[(i + 2) % 3], band: '#ffd23f' };
      const p = ZHF.person(look); p.id = 'x' + i; p.hidden = true; p.root.visible = false; p.noTurn = true;
      const k = ZHF.Kit(); if (i % 3 === 1) { k.add(STAR_GEO, '#ffd23f', 0, 0.36, 0.05, 0.08, 0.08, 0.08, 0, 0, 0, { ink: 0 }); k.rod([0, 0.22, 0.03], [0, 0.32, 0.05], 0.008, '#c8ced8', { ink: 0 }); } else if (i % 3 === 2) for (let j = 0; j < 7; j++) { const a = Math.PI * (0.1 + 0.8 * j / 6); k.ball(Math.cos(a) * 0.27, Math.sin(a) * 0.27 + 0.02, 0.02, 0.04, 0.04, 0.04, ['#ff4f9a', '#ffd23f', '#ffffff'][j % 3], { ink: 0 }); }
      ZHF.bake(p.head, k); B.root.add(p.root); list.push(p);
    }
    B.marchers = list; return list;
  }
  const npcOf = id => G.sim.npc(id);
  function parOn() {
    const st = S(); SCENE.par = true; PAR.path = null; const P = parPath();
    PAR.s0 = PAR.s = PAR.target = P.atRoute(0); PAR.join = 0; PAR.cam = true;
    makeMarchers(); makeStandard(); makeBanner(); showDecor();
    B.marchers.forEach((p, i) => { p.root.visible = i < 2; p.hidden = !p.root.visible; p.pose = i < 2 ? 'pole' : 'idle'; });
    B.std.g.visible = true; B.banner.carry.visible = true; B.banner.hang.visible = false;
    B.cida.root.visible = true; B.cida.pose = 'cheer';
    B.band.forEach(p => { p.noTurn = true; });
    // the town's own people join: Rosa, Bruno (with the estandarte), Marta, Nico. (Back home afterwards.)
    PAR.homes = {};
    for (const id of ['bruno', 'rosa', 'baker', 'kid']) { const n = npcOf(id); if (n) PAR.homes[id] = { x: n.x, z: n.z, yaw: n.yaw, baseYaw: n.baseYaw }; }
    const k = B.kid; SCENE.kidBusy = true; k.pose = 'drum'; k.noTurn = true;
    mixSet(1); BAT.stop = false; BAT.back = false; BAT.louder = 1;
    parStep(0, 0);
    G.sim.snap();
  }
  function parOff() {
    SCENE.par = false; SCENE.kidBusy = false; PAR.cam = false;
    if (B.marchers) B.marchers.forEach(p => { p.root.visible = false; p.hidden = true; });
    if (B.banner) B.banner.carry.visible = false;
    B.cida.root.visible = false;
    B.band.forEach(p => { p.x = p.home.x; p.z = p.home.z; p.y = B.gy(p.x, p.z); p.yaw = p.baseYaw = -Math.PI / 2; p.hop = 0; });
    for (const id of Object.keys(PAR.homes || {})) { const n = npcOf(id), h = PAR.homes[id]; if (!n) continue; Object.assign(n, { x: h.x, z: h.z, yaw: h.yaw, baseYaw: h.baseYaw, look: null, walking: false, wave: false }); }
    PAR.homes = null;
    const k = B.kid; k.x = SPOT.kid.x; k.z = SPOT.kid.z; k.y = B.gy(k.x, k.z); k.yaw = k.baseYaw = SPOT.kid.yaw; k.faceAt = null; k.pose = 'idle'; k.noTurn = false; k.hop = 0;
    if (B.giant) B.giant.g.visible = false;
    const v = B.voC; v.x = SPOT.vo2.x; v.z = SPOT.vo2.z; v.y = B.gy(v.x, v.z); v.yaw = v.baseYaw = SPOT.vo2.yaw; v.faceAt = null; v.pose = 'idle';
    SCENE.voUp = false; musicOff(); mixSet(1); BAT.stop = false; BAT.louder = 1; G.fx.hush = 0;
    showDecor(); try { G.sim.snap(); } catch (e) { /* */ }
  }
  // every frame of the parade: move the front along, everyone after it in formation, the camera alongside
  function parStep(dt, t) {
    if (PAR.s < PAR.target) PAR.s = Math.min(PAR.target, PAR.s + PAR.speed * dt);
    const moving = PAR.s < PAR.target - 1e-3, Y = G.sim.you, M = G.sim.mimo, beat = Math.abs(Math.sin(t * 6.9));
    const place = (d, side) => { const q = pathAt(PAR.s - d); return { x: q.x - q.tz * side, z: q.z + q.tx * side, yaw: Math.atan2(q.tx, q.tz), tx: q.tx, tz: q.tz }; };
    for (const [who, d, side] of FORM) {
      const p = place(d, side);
      if (who === 'you') { Y.x = p.x; Y.z = p.z; Y.yaw = p.yaw; continue; }
      if (who === 'mimo') { M.x = p.x; M.z = p.z; M.yaw = p.yaw; M.station = null; M.wander = null; continue; }
      if (who === 'malu') { const k = B.kid; k.x = p.x; k.z = p.z; k.y = B.gy(p.x, p.z); k.baseYaw = p.yaw; k.faceAt = { x: p.x + p.tx * 3, z: p.z + p.tz * 3 }; k.hop = beat * 0.12; continue; }
      if (who === 'cida') { const c = B.cida; c.x = p.x; c.z = p.z; c.y = B.gy(p.x, p.z); c.yaw = c.baseYaw = p.yaw; c.hop = beat * 0.08; continue; }
      if (who.startsWith('band')) { const b = B.band[+who.slice(4)]; b.x = p.x; b.z = p.z; b.y = B.gy(p.x, p.z); b.yaw = b.baseYaw = p.yaw; ZHF.animate(b, dt, t, null); continue; }
      if (who[0] === 'x' || who.startsWith('ban')) {
        const i = who.startsWith('ban') ? +who.slice(3) - 1 : 2 + +who.slice(1), m = B.marchers && B.marchers[i]; if (!m || !m.root.visible) continue;
        m.x = p.x; m.z = p.z; m.y = B.gy(p.x, p.z); m.yaw = m.baseYaw = p.yaw; m.hop = (who.startsWith('ban') ? beat * 0.04 : beat * 0.1); if (!who.startsWith('ban')) m.pose = 'cheer'; ZHF.animate(m, dt, t, null); continue;
      }
      const n = npcOf(who); if (!n) continue;
      n.x = p.x; n.z = p.z; n.look = { x: p.x + p.tx * 4, z: p.z + p.tz * 4 }; n.walking = moving; n.wave = !moving && who !== 'bruno';
    }
    // the banner between its two carriers; the estandarte up in Bruno's hands
    if (B.banner) { const a = place(0, 0); B.banner.carry.position.set(a.x, B.gy(a.x, a.z), a.z); B.banner.carry.rotation.y = a.yaw; }
    if (B.std) { const b = npcOf('bruno'), a = place(1.5, 0), x = b ? b.x : a.x, z = b ? b.z : a.z; B.std.g.position.set(x + a.tx * 0.4, B.gy(x, z) + 0.2, z + a.tz * 0.4); B.std.g.rotation.set(0, a.yaw, Math.sin(t * 2) * 0.04); }
    // the camera: high up behind the bloco (over the roofs: the lanes are narrow), looking down the street at it
    // (one shot object that moves: main.js eases into a new shot whenever the override object changes)
    if (PAR.cam) {
      const a = place(13, 0), c = place(2, 0);
      if (!PAR.camO || G.cam.override !== PAR.camO) { PAR.camO = { pos: V3(a.x, B.GY + 10.5, a.z), look: V3(c.x, B.GY + 0.6, c.z), dur: 1.4 }; G.cam.override = PAR.camO; }
      else { PAR.camO.pos.set(a.x, B.GY + 10.5, a.z); PAR.camO.look.set(c.x, B.GY + 0.6, c.z); }
    }
  }
  async function marchTo(s, speed) {
    PAR.target = s; if (speed) PAR.speed = speed;
    while (PAR.s < PAR.target - 0.01) { if (PAR.fast) PAR.s = PAR.target; await ZHF.wait(0.1); }
  }
  // ---------------- the Hush's giant puppet (a bonecão, like the giant puppets of Olinda's Carnaval), made of the Hush
  function makeGiant() {
    if (B.giant) return B.giant;
    const g = new THREE.Group(), GR = '#8f8a99', DK = '#6f6a7c', LTc = '#b4afbf';
    const body = new THREE.Group(), head = new THREE.Group(), kb = ZHF.Kit(), kh = ZHF.Kit();
    kb.cone(0, 1.5, 0, 1.05, 3.0, GR, { ink: 0.03 }).cyl(0, 2.95, 0, 0.42, 0.2, LTc, { ink: 0.014 });
    for (let i = 0; i < 6; i++) kb.box(Math.sin(i * 1.1) * 0.5, 0.5 + i * 0.36, 0.64 - i * 0.09, 0.26, 0.05, 0.02, DK, { rz: Math.sin(i) * 0.5, ink: 0 });
    ZHF.bake(body, kb);
    kh.ball(0, 0, 0, 0.95, 1.02, 0.9, GR, { ink: 0.03 });
    for (const s of [-1, 1]) { kh.box(s * 0.33, 0.1, 0.87, 0.34, 0.06, 0.04, '#3a3444', { rz: s * 0.18, ink: 0 }); kh.ball(s * 0.6, -0.22, 0.66, 0.16, 0.09, 0.05, LTc, { ink: 0 }); }
    kh.ball(0, -0.44, 0.84, 0.12, 0.12, 0.06, '#3a3444', { ink: 0 });
    kh.cone(-0.25, 0.98, -0.12, 0.62, 1.35, '#9d98ab', { rz: 0.85, ink: 0.02 }).ball(-1.12, 0.82, -0.12, 0.21, 0.21, 0.21, '#d8d4e0', { ink: 0.01 });
    ZHF.bake(head, kh); head.position.set(0, 3.95, 0);
    const arms = [-1, 1].map(s => { const a = new THREE.Group(), ka = ZHF.Kit(); ka.cyl(0, -0.95, 0, 0.17, 1.9, GR, { ink: 0.014 }).ball(0, -1.95, 0.05, 0.24, 0.21, 0.24, LTc, { ink: 0.01 }); ZHF.bake(a, ka); a.position.set(s * 0.62, 2.9, 0); return a; });
    g.add(body, head, ...arms); g.visible = false; B.root.add(g);
    B.giant = { g, body, head, arms, x: 12.0, z: -147.7, sc: 1, flinch: 0, lean: 0, shh: 1, fade: 1 };
    return B.giant;
  }
  function giantStep(dt, t) {
    const H = B.giant; H.flinch = Math.max(0, H.flinch - dt * 1.8);
    H.g.position.set(H.x, B.gy(H.x, H.z), H.z); H.g.rotation.y = Math.PI / 2 + Math.sin(t * 0.9) * 0.18;
    H.g.scale.setScalar(Math.max(0.02, H.sc * H.fade));
    H.body.rotation.z = Math.sin(t * 1.4) * 0.05 - H.flinch * 0.1; H.body.rotation.x = -H.flinch * 0.25 + H.lean * 0.18;
    H.head.rotation.x = H.lean * 0.45 - H.flinch * 0.4 + Math.sin(t * 1.1) * 0.04; H.head.rotation.z = Math.sin(t * 0.8) * 0.12 + H.lean * 0.25;
    H.arms[0].rotation.set(Math.sin(t * 1.6) * 0.35 - H.flinch, 0, -0.25 - Math.abs(Math.sin(t * 1.6)) * 0.2);
    H.arms[1].rotation.set(lerp(Math.sin(t * 1.6 + 2) * 0.35, -2.75, H.shh) - H.flinch, 0, lerp(0.25, -0.35, H.shh));
  }
  // ---------------- {mimo}'s tiara de estrelinhas (the finale's gift): a band of sequins, two little stars on springs
  let TIA = null;
  function tiara() {
    if (TIA || !G || !G.cast || !G.cast.mimo || !G.cast.mimo.body) return TIA;
    const g = new THREE.Group(); g.position.set(0, 0.47, 0.05); g.rotation.set(-0.18, 0, 0);
    const k = ZHF.Kit();
    for (let i = 0; i <= 8; i++) { const a = Math.PI * (0.1 + 0.8 * i / 8); k.ball(Math.cos(a) * 0.255, Math.sin(a) * 0.13, 0.12, 0.032, 0.032, 0.032, i % 2 ? '#ff6fae' : '#ffd23f', { ink: 0 }); }
    for (const s of [-1, 1]) { k.rod([s * 0.06, 0.12, 0.13], [s * 0.1, 0.33, 0.16], 0.01, '#c8ced8', { ink: 0 }); k.add(STAR_GEO, s < 0 ? '#ffd23f' : '#ff6fae', s * 0.1, 0.37, 0.17, 0.075, 0.075, 0.075, 0, 0, 0, { ink: 0 }); }
    ZHF.bake(g, k); g.visible = false; G.cast.mimo.body.add(g); TIA = g; return g;
  }
  const phonesOn = () => !!(G && G.state.flags && G.state.flags.mimoPhones && (G.state.phonk || {}).phonesOn !== false);
  const hatOn = () => !!(G && G.state && G.state.lang === 'pt' && G.state.cv && G.state.cv.tiara && !G.state.cv.tiaraOff && !phonesOn());
  // ---------------- the parade itself
  async function hudBeat(o, i, n) { CVUI.hud.cue({ icon: o.icon, iconKey: o.iconKey, title: o.title, sub: `Call it in Portuguese! (${i + 1}/${n})`, bar: i / n }); return CVUI.hud.call({ model: o.model, modelEn: o.modelEn, keys: o.keys }); }
  async function chapter5() {
    const st = S();
    await scene(async () => { standBy(); shotKid(); await say('malu', 'cv.malu.day'); });
    if (!st.l5) {
      const l = await CVUI.lesson({ title: 'O desfile', sub: 'what you shout at a parade', face: 'cvKid', name: 'Malu', intro: ['Hoje a gente grita!', 'Today we shout!'], items: [PHI['ph.cv.abrealas'], PHI['ph.cv.viva']] });
      if (l.quit) return;
      st.l5 = true;
    }
    let quit = false;
    const grades = [];
    try {
      await UI.fade(1, 450); parOn(); await UI.fade(0, 450);
      lock(true); music('pt_bloco', 0.0);
      // 1. the concentração: «Abram alas!» and off we go
      await say('malu', 'cv.malu.go');
      CVUI.hud.open('O desfile · the bloco marches!');
      let g = await hudBeat({ model: 'Abram alas!', modelEn: 'Make way!', keys: ['abram alas', 'abre alas', 'abri alas'], title: 'The whole bloco is waiting. Open the way: «Abram alas!»', icon: '🚩' }, 0, 1);
      if (g === 'quit') { quit = true; return; }
      grades.push(g); CVUI.hud.close(); whistle(); music('pt_bloco', 0.5, { duck: 0.05 }); try { ZHF.music.stop(true); } catch (e) { /* */ }
      const P = parPath();
      // 2. along the back lane, behind the bakery, down to the market street
      await marchTo(P.atRoute(6), 2.0);
      // 3. the Hush: a giant puppet rises in the market street and swallows the drums
      const Hg = makeGiant(); Hg.sc = 0.2; Hg.fade = 1; Hg.lean = 0; Hg.shh = 1; Hg.g.visible = true; PAR.cam = false;
      shot([25.6, 4.3, -152.6], [12.0, 3.0, -147.6]);
      try { Sound.play('grow'); } catch (e) { /* */ }
      for (let i = 0; i < 30; i++) { Hg.sc = Math.min(1.15, Hg.sc + 0.035); G.fx.hush = Math.min(0.6, G.fx.hush + 0.02); MUS.cut = Math.max(520, 16000 - i * 520); MUS.level = Math.max(0.22, 0.5 - i * 0.01); await ZHF.wait(0.05); }
      await say('malu', 'cv.malu.uhoh'); await say('juca', 'cv.juca.hush');
      CVUI.hud.open('O Silêncio · drive off the giant!');
      for (let i = 0; i < HUSH_BEATS.length; i++) {
        const b = HUSH_BEATS[i]; g = await hudBeat(b, i, HUSH_BEATS.length);
        if (g === 'quit') { quit = true; return; }
        grades.push(g); whistle();
        if (b.id === 'forte') { BAT.louder = 1.5; MUS.cut = 2400; MUS.level = 0.5; Hg.flinch = 0.8; await ZHF.wait(1.6); MUS.cut = 900; MUS.level = 0.32; BAT.louder = 1; Hg.shh = 1; }
        else if (b.id === 'parada') { BAT.stop = true; BAT.back = false; Hg.lean = 1; G.fx.hush = 0.66; await ZHF.wait(2.2); }
        else if (b.id === 'volta') { BAT.back = true; MUS.cut = 16000; MUS.level = 0.55; BAT.louder = 1.35; await ZHF.wait(0.5); Hg.lean = 0; Hg.flinch = 1; Hg.shh = 0.3; Hg.sc = 0.85; G.fx.hush = 0.36; try { Sound.play('hurt'); } catch (e) { /* */ } confetti(Hg.x + 4, 2.5, Hg.z, 60, 2.2, 4); await ZHF.wait(1.2); BAT.louder = 1; if (BAT.stop) { BAT.stop = false; BAT.back = false; } }      // (no music playing: back in anyway)
        else if (b.id === 'chant') { const ms = makeMarchers(); for (let k = 2; k < ms.length; k++) { ms[k].root.visible = true; ms[k].hidden = false; } Hg.flinch = 1; Hg.sc = 0.6; Hg.shh = 0; G.fx.hush = 0.18; for (const id of ['rosa', 'baker', 'kid']) { const n = npcOf(id); if (n) n.wave = true; } try { Sound.play('fanfare'); } catch (e) { /* */ } await ZHF.wait(1.4); }
        else if (b.id === 'confete') {
          for (let k = 0; k < 6; k++) { const q = pathAt(PAR.s - k * 2.4); confetti(q.x, B.gy(q.x, q.z) + 2.2, q.z, 70, 2.0, 5); await ZHF.wait(0.12); }
          for (let k = 0; k < 24; k++) { Hg.fade = Math.max(0, Hg.fade - 0.05); if (k % 4 === 0) confetti(Hg.x, B.gy(Hg.x, Hg.z) + 2.5 * Hg.fade + 1, Hg.z, 50, 2.4, 3.5); await ZHF.wait(0.05); }
          Hg.g.visible = false; G.fx.hush = 0; try { Sound.play('chime'); } catch (e) { /* */ }
        }
        await ZHF.wait(0.5);
      }
      CVUI.hud.close();
      await say('malu', 'cv.malu.won');
      // 4. down the market street, into the plaza and round the fountain
      PAR.cam = true; MUS.cut = 16000; MUS.level = 0.5;
      await marchTo(P.len, 2.1);
      // 5. Vô Tião: the drums wake him up
      PAR.cam = false; music('pt_bloco', 0.3, { duck: 0.05 });
      const vg = B.voG, vc = B.voC;
      shot([VO.x + Math.sin(VO.yaw) * 3.6 - 1.2, 2.0, VO.z + Math.cos(VO.yaw) * 3.6 + 0.6], [VO.x, 1.0, VO.z]);
      await ZHF.wait(1.2);
      for (let k = 0; k < 3; k++) { G.w3d.fx.sparkle(VO.x, 1.4, VO.z, 14, ['#ffd23f', '#ff6fae', '#7ff7ea']); await ZHF.wait(0.3); }
      SCENE.voUp = true; vc.x = VO.x + Math.sin(VO.yaw) * 0.7; vc.z = VO.z + Math.cos(VO.yaw) * 0.7; vc.y = B.gy(vc.x, vc.z); vc.yaw = vc.baseYaw = VO.yaw; vc.pose = 'idle';
      try { Sound.play('learned'); } catch (e) { /* */ }
      await say('vo', 'cv.vo.wake');
      const k = B.kid; k.x = vc.x + Math.sin(VO.yaw) * 1.4 + 0.5; k.z = vc.z + Math.cos(VO.yaw) * 1.4; k.y = B.gy(k.x, k.z); k.faceAt = { x: vc.x, z: vc.z }; k.pose = 'cheer';
      vc.faceAt = { x: k.x, z: k.z };
      await say('malu', 'cv.malu.vovo'); k.pose = 'idle';
      await say('vo', 'cv.vo.heart'); vc.pose = 'point'; await say('vo', 'cv.vo.mestra'); vc.pose = 'idle'; whistle();
      // the gift
      const M = G.sim.mimo; M.x = k.x + 0.9; M.z = k.z + 0.4; standAt({ x: k.x + 1.6, z: k.z - 0.9 }, k); M.x = k.x + 0.8; M.z = k.z + 0.5;
      shot([k.x + 2.6, 1.9, k.z + 2.2], [k.x + 0.6, 0.8, k.z]);
      await say('malu', 'cv.malu.gift');
      st.tiara = true; st.tiaraOff = false; if (G.state.phonk) G.state.phonk.phonesOn = false;
      const ti = tiara(); if (ti) ti.visible = true;
      M.happy = 2; M.glow = 1; G.sim.emit('learned', {}); UI.toast(`${MIMO()} wears Malu’s tiara de estrelinhas!`);
      // 6. the last calls: «Viva o carnaval!», then «Até o ano que vem!»
      PAR.cam = false; shot([PLAZA.x + 9, 5.5, PLAZA.z + 9], [PLAZA.x, 1.5, PLAZA.z]); music('pt_bloco', 0.5, { duck: 0.05 });
      CVUI.hud.open('O fim do desfile');
      g = await hudBeat({ model: 'Viva o carnaval!', modelEn: 'Long live Carnival!', keys: ['viva o carnaval', 'viva'], title: 'Everyone’s in the plaza. Cheer!', icon: '🎉' }, 0, 2);
      if (g === 'quit') { quit = true; return; }
      grades.push(g);
      for (let i = 0; i < 8; i++) { const a = Math.random() * TAU, r = 2 + Math.random() * 6; confetti(PLAZA.x + Math.cos(a) * r, 3 + Math.random() * 2, PLAZA.z + Math.sin(a) * r, 90, 2.4, 5.5); await ZHF.wait(0.18); }
      g = await hudBeat({ model: 'Até o ano que vem!', modelEn: 'See you next year!', keys: ['ate o ano que vem', 'ano que vem', 'ate ano que vem'], title: 'Carnival is over… Malu waves her whistle. Say goodbye until next year!', icon: '👋' }, 1, 2);
      if (g === 'quit') { quit = true; return; }
      grades.push(g);
      CVUI.hud.close();
      st.ch[5] = true; st.parGrades = grades;
      teachAll(['ph.cv.abrealas', 'ph.cv.viva', 'ph.cv.anoquevem', 'ph.cv.arrasou']);
      await UI.fade(1, 500);
    } finally { CVUI.hud.close(); parOff(); lock(false); G.cam.override = null; if (G.save) G.save(); }
    if (quit) { think('Malu: «A gente sai de novo outra hora!» (we’ll march again another time!)', 3.5); return; }
    await UI.fade(0, 500);
    coins(20, 'The whole bloco passes the hat for you');
    think(`${MIMO()} won’t stop admiring its tiara. Malu and Vô Tião are back at the bell tower.`, 5);
  }
  // ================================================================ the menu
  const CH = [
    { n: 1, title: 'Fantasias', sub: 'costumes for the bloco, its name and theme', gate: f => !!f.rosa, wait: 'after Rosa’s welcome', run: chapter1 },
    { n: 2, title: 'A bateria', sub: 'the drums, and the signals that lead them', gate: f => !!f.boss, wait: 'after the big Hushling on the hill', run: chapter2 },
    { n: 3, title: 'Marchinhas', sub: 'three carnival songs to sing along to', gate: f => (f.bells || 0) >= 1, wait: 'after the first bell', run: chapter3 },
    { n: 4, title: 'Organizing the bloco', sub: 'the route, the invitations, the estandarte', gate: f => (f.bells || 0) >= 2, wait: 'after the second bell', run: chapter4 },
    { n: 5, title: 'O desfile', sub: 'the bloco marches through Alba', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell', run: chapter5 },
  ];
  let talking = false;
  async function kidTalk() { if (talking) return; talking = true; try { await kidTalk0(); } finally { talking = false; } }
  async function kidTalk0() {
    const st = S(), f = flags();
    if (!st.met) return meet();
    const next = CH.find(c => !st.ch[c.n]), opts = [];
    if (next) opts.push(next.gate(f) ? { label: `Chapter ${next.n}: ${next.title}`, sub: next.n === 4 && st.invRound ? `invitations: ${GUESTS.filter(g => st.inv[g.id]).length}/4` : next.sub, value: 'next' } : { label: `Chapter ${next.n}: ${next.title}`, sub: `later: ${next.wait}`, value: 'wait' });
    if (st.ch[3]) opts.push({ label: 'Sing a marchinha', sub: 'Acorda, Alba! · ' + fill(MARCH[1].title) + ' · Olha o picolé!', value: 'sing' });
    if (st.ch[2]) opts.push({ label: 'Lead the bateria again', sub: 'call the sections in, the paradinha, the volta', value: 'bat' });
    opts.push({ label: 'Chat', value: 'chat' });
    if (st.tiara) opts.push({ label: st.tiaraOff || phonesOn() ? `Put the tiara back on ${MIMO()}` : `Take ${MIMO()}’s tiara off`, value: 'tiara' });
    const v = await UI.choose('Malu: «E aí? Bora fazer barulho?» (Hey! Shall we make some noise?)', opts);
    if (v === 'next') return next.run();
    if (v === 'wait') return scene(async () => { standBy(); shotKid(); await say('malu', 'cv.malu.wait'); });
    if (v === 'sing') {
      const m = await UI.choose('Which marchinha?', MARCH.map((M, i) => ({ label: fill(M.title), sub: fill(M.en), value: i + 1 })));
      if (m) { try { await sing(m - 1, 'memory', 'Marchinha'); } finally { musicOff(); } }
      return;
    }
    if (v === 'bat') { try { await batTPR(); } finally { musicOff(); mixSet(1); batOut(false); } return; }
    if (v === 'chat') { st.chat = (st.chat || 0) + 1; return scene(async () => { standBy(); shotKid(); await say('malu', st.ch[5] ? 'cv.malu.idle4' : ['cv.malu.idle1', 'cv.malu.idle2', 'cv.malu.idle3'][st.chat % 3]); }); }
    if (v === 'tiara') { const on = !(st.tiaraOff || phonesOn()); st.tiaraOff = on; if (!on && G.state.phonk) G.state.phonk.phonesOn = false; UI.toast(on ? 'Tiara off.' : `${MIMO()} sparkles again!`); if (G.save) G.save(); }
  }
  async function voTalk() {
    const st = S();
    if (!st.ch[5]) { think('An old man in a Panama hat sits on the bench, gray and silent, staring at the fountain. The Hush has him. Malu’s grandpa…', 5); try { G.sim.mimo.happy = -0.5; } catch (e) { /* */ } return; }
    await scene(async () => { const v = B.voC; standAt(front(v, 1.9), v); G.cam.override = { pos: V3(v.x + Math.sin(v.baseYaw) * 3.4 + 1.2, v.y + 1.9, v.z + Math.cos(v.baseYaw) * 3.4), look: V3(v.x, v.y + 1.1, v.z) }; await say('vo', 'cv.vo.idle'); });
  }
  const PROVIDER = {
    interactables() {
      if (!B || !shown() || CVUI.busy || SCENE.par || SCENE.bat || (G.indoors && G.indoors())) return [];
      const L = [], Y = G.sim.you, add = (x, z, r, label, run) => L.push({ x, z, y: B.gy(x, z), r, label, run }), st = S();
      if (Math.hypot(Y.x - B.kid.x, Y.z - B.kid.z) < 14) add(B.kid.x, B.kid.z, 2.0, 'Talk', kidTalk);
      const v = B.voC.root.visible ? B.voC : B.voG.root.visible ? B.voG : null;
      if (v && Math.hypot(Y.x - v.x, Y.z - v.z) < 10) add(v.x, v.z, 2.0, 'Talk', voTalk);
      if (st.invRound && !st.ch[4]) for (const g of GUESTS) if (!st.inv[g.id]) { const n = G.sim.npc(g.id); if (n && Math.hypot(Y.x - n.x, Y.z - n.z) < 6) add(n.x, n.z, 2.4, 'Invite (convidar)', () => invite(g.id)); }
      return L;
    },
    tick(dt, Y) {
      if (!B || !shown()) return;
      const st = S();
      if (!st.seen && Math.hypot(Y.x - B.kid.x, Y.z - B.kid.z) < 9) { st.seen = true; whistle(); think('A girl with two big hair puffs blows a whistle at you: «Piiiii!» Behind her, an old drum under a tarp, and a trunk spilling costumes.', 5); }
    },
  };

  // ================================================================ the quest (quests.js LIST: pt games only)
  function quest() {
    const y = s => s.cv || {}, ch = (s, n) => !!(y(s).ch && y(s).ch[n]), kidAt = () => (B ? { x: B.kid.x, z: B.kid.z } : SPOT.kid);
    const step = (n, text, why, hint, target) => ({ get text() { const c = CH[n - 1]; return c && !c.gate(flags()) ? text : text.replace(/ \(after [^)]*\)$/, ''); }, why, done: s => ch(s, n), target: target || kidAt, hint });
    const nextGuest = () => { const st = G && G.state && G.state.cv; if (st && st.invRound && !(st.ch && st.ch[4])) for (const g of GUESTS) if (!(st.inv || {})[g.id]) { const n = G.sim.npc(g.id); if (n) return { x: n.x, z: n.z }; } return kidAt(); };
    return {
      id: 'cv', kind: 'side', title: 'Malu’s bloco', giver: 'Malu, the bloco kid by the bell tower',
      started: s => s.lang === 'pt' && !!y(s).met,
      steps: [
        step(1, 'Fantasias: costumes, and the bloco’s name', 'Dress {mimo} from Dona Cida’s trunk («uma coroa dourada»), compare costumes (maior, mais, menos… do que), and vote on the bloco’s name and theme («Eu voto no…»).', '{mimo} points at the girl with the whistle.'),
        step(2, 'A bateria: the drums and the signals (after the big Hushling on the hill)', 'Surdo, caixa, repinique, tamborim, agogô, pandeiro, cuíca, chocalho. Then you call the bateria in: «Paradinha!», «Volta!», «Mais forte!»', '{mimo} drums on its belly.'),
        step(3, 'Marchinhas: three songs to sing (after the first bell)', 'Malu sings, you answer: «Acorda, Alba, acorda!» «O bloco chegou!»', '{mimo} bobs its ears to a marchinha.'),
        Object.assign(step(4, 'Organize the bloco: the route, {n}/4 invitations, the estandarte (after the second bell)', 'Plan the route with directions (vira à direita, segue reto), invite Dona Rosa, Bruno, Marta and Nico («Você quer…?», «Você pode…?»), and paint the estandarte.', '{mimo} points the way.', nextGuest), { n: s => Object.values(y(s).inv || {}).filter(Boolean).length }),
        step(5, 'O desfile: the parade (after the third bell)', 'The bloco marches from the bell tower, down the market street, to the plaza. Something will try to hush it.', '{mimo} hops toward the bell tower.'),
      ],
      story: [
        { when: s => !!y(s).met, text: 'By the bell tower lives Malu, nine, who wants to bring back Alba’s street bloco. Her grandpa, Vô Tião, founded it and led its bateria; since the Hush came he sits on a plaza bench, gray and silent.' },
        { when: s => ch(s, 1), get text() { return 'Costumes from Dona Cida’s trunk, and a vote: the bloco is called «' + blocoName() + '», its theme ' + temaOf().name + ' (' + temaOf().en + ').'; } },
        { when: s => ch(s, 2), text: 'You led the bateria: surdos, caixas, tamborins, agogô… a paradinha, and the volta. Seu Juca smiled for the first time in ages.' },
        { when: s => ch(s, 3), text: 'You learned three marchinhas, and the bloco’s anthem by heart: «Acorda, Alba, acorda!» «O bloco chegou!»' },
        { when: s => ch(s, 4), text: 'The route is planned, Rosa, Bruno, Marta and Nico are in, and Dona Cida sewed the estandarte.' },
        { when: s => ch(s, 5), text: 'The bloco marched through Alba. A giant puppet made of the Hush swallowed the drums, until the paradinha fooled it and the volta blew it away in confetti. Vô Tião woke up, named Malu the new mestra, and {mimo} wears her tiara de estrelinhas.' },
      ],
    };
  }

  // ================================================================ the mini-map: Malu's spot (a pink badge with a yellow star)
  const MARK = {};
  function mapMark(dpr) {
    if (!B || !shown()) return null;
    if (!MARK[dpr]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = '#ff4f9a'; c.strokeStyle = '#2b2235'; c.lineWidth = 1.4; c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 2, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#ffd23f'; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.2 : 5.2; c.lineTo(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r); } c.closePath(); c.fill();
      MARK[dpr] = cv;
    }
    return { x: B.kid.x, z: B.kid.z, img: MARK[dpr] };
  }

  // ================================================================ start
  function init(game) {
    G = game; ZHF.bind(game); CVUI.bind(game);
    registerIcons();
    if (typeof LEX !== 'undefined') LEX.register(PH.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', pt: p.pt, en: p.en, note: p.note, region: p.region, register: p.register, icon: p.icon, alt: p.keys ? { pt: p.keys } : undefined })));
    if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v;
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'cv')) QUESTS.LIST.push(quest());
    if (typeof SIGNS !== 'undefined' && SIGNS.add) {
      const Bd = SPOT.board, look = { face: '#26473a', edge: '#8a5f3e', ink: '#f4f1ea' };
      SIGNS.add({ id: 'cv-board', x: Bd.x + Math.sin(Bd.yaw) * 0.6, z: Bd.z + Math.cos(Bd.yaw) * 0.6, r: 1.3, when: () => shown(),
        card: () => {
          const st = S(), lines = [{ text: 'QG do bloco', en: 'The bloco’s headquarters', look }];
          if (st.bloco) lines.push({ text: blocoName(), en: (blocoOf() || {}).en || '', look }, { text: 'Tema: ' + temaOf().name, en: 'Theme: ' + temaOf().en, look });
          else lines.push({ text: 'Nome: ??? · Tema: ???', en: 'Name: ??? · Theme: ??? (Malu needs your help!)', look });
          if (st.ch[3]) MARCH[0].lines.forEach(([c, r, ce, re]) => lines.push({ text: `${c} — ${r}`, en: `${ce} — ${re}`, look }));
          if (st.ch[4]) lines.push({ text: 'Torre → rua do mercado → praça', en: 'The route: the tower → the market street → the plaza', look });
          return { tag: 'Malu’s chalkboard', lines };
        } });
    }
    setInterval(() => { if (shown()) CVUI.keepFar(PH.map(p => p.id)); }, 30000);
  }
  // ================================================================ tests (the game never calls these)
  const TEST = {
    fast(on = true) { CVUI.fast = on; PAR.fast = on; },
    setup(fl) { Object.assign(G.state.flags, { hatched: true, rosa: true }, fl || {}); },
    // answer whatever is waiting (a card or the call bar) with its model answer
    panel() { if (CVUI.cur) { const m = CVUI.cur.model; CVUI.cur.submit(m); return 'cv card: ' + m; } if (CVUI.hcur) { const m = CVUI.hcur.model; CVUI.hcur.submit(m); return 'cv bar: ' + m; } return null; },
    drive(o = {}) { return ZHF.drive(Object.assign({ panel: () => TEST.panel(), busy: () => CVUI.busy || SCENE.par || SCENE.bat }, o)); },
    get MIX() { return MIX; }, get BAT() { return BAT; }, get MUS() { return MUS; }, get PAR() { return PAR; }, get SCENE() { return SCENE; }, get B() { return B; }, MARCHA,
  };
  return {
    init, build, update, quest, hatOn, mapMark, lend, interactables: () => [],
    person: id => (B ? ({ malu: B.kid, tiao: B.voC }[id] || null) : null),      // (Malu's or the awake Vô Tião's rig: baile.js)
    tiaoAwake: () => !!(G && G.state && G.state.cv && G.state.cv.ch && G.state.cv.ch[5]),
    get busy() { return SCENE.par || SCENE.bat || CVUI.busy; },
    _: { S: () => S(), LT, PH, ITEMS, COLORS, INST, MARCH, TURNS, GUESTS, BLOCOS, TEMAS, ROUTE, readItem, dressCheck, dirOf, lineOf, fill, drawDoll, drawMap, drawStandard, drawBanner,
      meet, chapter1, chapter2, chapter3, chapter4, chapter5, kidTalk, invite, batTPR, sing, routeMap, parOn, parOff, makeGiant, tiara, showDecor, pathAt, parPath, PROVIDER, CH, SPOT, VO, t: TEST },
  };
})();
