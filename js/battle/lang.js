'use strict';
// Battle language tables (es / pt / de). Everything the player reads or types in a battle lives
// here; parser.js and flow.js only look things up by key. Lines are [target language, English].
// Ported from the grey-box prototype (prototypes/battle/lang.js) and grown for the 3D battles:
// the three kinds of Hush creature with their gender (el calladito, la polilla, el escarabajo · o
// caladinho, a mariposa, o besouro · der Schweigling, die Motte, der Käfer), colors and sizes
// (ladder rung 2), body parts with the moth's wings (rung 3), enemy shouts that get richer with your
// language tier, the Coach's lessons, and lines with a feminine version (key + 'F') for moths.
// Chapter 1 (Molinar, DESIGN.md 14.2) adds the armadillo (el armadillo · o tatu · das Gürteltier, a
// neuter noun, so German lines can have a neuter version, key + 'N'), the verb push («empuja» ·
// «empurra» · «schieb») that flips it, and eat («come» · «come» · «iss») for food from the bag.
// Region 2 (the Mirror Lake, DESIGN.md 14.5) adds the frog (la rana · o sapo · der Frosch) and where
// things are: positions in a row, as you see them («la rana de la izquierda / del medio / de la
// derecha», «o sapo da esquerda / do meio / da direita», «den linken / mittleren / rechten Frosch»,
// «den Frosch links / in der Mitte / rechts»), and fish to eat («come el pescado»).
// Then Bruno's training yard (practice: el muñeco · o boneco · die Puppe), and the Corn Society under the
// corn maze: el grano · o grão · das Korn (kernel soldiers, in corn colors, white among them), that pop on a
// hot floor into la palomita · a pipoca · das Popcorn (the gender changes in es/pt), and their leader,
// el Coronel Mazorca · o Coronel Espiga · Oberst Kolben («el coronel» · «o coronel» · «der Oberst»).
// Load order inside battle/: lang.js, parser.js, models.js, stage.js, ui.js, flow.js.
(() => {
  const B = (window.BATTLE = window.BATTLE || {});
  const _ = (B._ = B._ || {});
  const L = {};

  // ================================================================ Spanish (Latin American)
  L.es = {
    code: 'es', name: 'Español', variety: 'Latin American Spanish',
    species: {
      hushling: { w: 'calladito', pl: 'calladitos', g: 'm', en: 'hushling' },
      hushbig: { w: 'calladón', pl: 'calladones', g: 'm', en: 'big hushling' },
      moth: { w: 'polilla', pl: 'polillas', g: 'f', en: 'moth' },
      beetle: { w: 'escarabajo', pl: 'escarabajos', g: 'm', en: 'beetle' },
      armadillo: { w: 'armadillo', pl: 'armadillos', g: 'm', en: 'armadillo' },
      frog: { w: 'rana', pl: 'ranas', g: 'f', en: 'frog' },
      // Bruno's training dummies; the Corn Society: its kernel soldiers (that pop into popcorn on a hot floor:
      // «el grano» becomes «la palomita») and their leader, el Coronel Mazorca (a mazorca is a corn cob)
      dummy: { w: 'muñeco', pl: 'muñecos', g: 'm', en: 'dummy' },
      kernel: { w: 'grano', pl: 'granos', g: 'm', en: 'kernel' },
      popcorn: { w: 'palomita', pl: 'palomitas', g: 'f', en: 'popcorn' },
      colonel: { w: 'coronel', pl: 'coroneles', g: 'm', en: 'colonel', name: 'el Coronel Mazorca' },
    },
    // where one stands in the row, as you see it: «la rana de la izquierda», «el calladito del medio».
    // w: the noun after «de la / del» (its gender picks the article); phrase: how it's said after a noun
    positions: {
      left: { w: 'izquierda', g: 'f', en: 'left', phrase: 'de la izquierda' },
      middle: { w: 'medio', g: 'm', en: 'middle', phrase: 'del medio', alt: ['centro'] },
      right: { w: 'derecha', g: 'f', en: 'right', phrase: 'de la derecha' },
    },
    parts: {
      head: { w: 'cabeza', g: 'f', en: 'head' },
      tail: { w: 'cola', g: 'f', en: 'tail' },
      shell: { w: 'caparazón', g: 'm', en: 'shell' },
      // feminine, but a stressed «a» takes «el» in the singular: «el ala», «las alas»
      wing: { w: 'ala', pl: 'alas', g: 'f', en: 'wing', artSg: 'el' },
    },
    // each adjective: lexemes as {m, f}; the first one is the standard form
    adjs: {
      red: { forms: [{ m: 'rojo', f: 'roja' }], en: 'red' },
      blue: { forms: [{ m: 'azul', f: 'azul' }], en: 'blue' },
      green: { forms: [{ m: 'verde', f: 'verde' }], en: 'green' },
      yellow: { forms: [{ m: 'amarillo', f: 'amarilla' }], en: 'yellow' },
      white: { forms: [{ m: 'blanco', f: 'blanca' }], en: 'white' },
      big: { forms: [{ m: 'grande', f: 'grande' }, { m: 'grandote', f: 'grandota' }], en: 'big' },
      small: { forms: [{ m: 'pequeño', f: 'pequeña' }, { m: 'chico', f: 'chica' }, { m: 'chiquito', f: 'chiquita' }], en: 'small' },
      asleep: { forms: [{ m: 'dormido', f: 'dormida' }], en: 'asleep', state: true },
      angry: { forms: [{ m: 'enojado', f: 'enojada' }], en: 'angry', state: true },
    },
    verbs: {
      jump: { show: 'salta', forms: ['salta', 'salte', 'brinca', 'brinque'], en: 'jump' },
      hit: { show: 'golpea', forms: ['golpea', 'golpee', 'golpéalo', 'golpéale', 'pega', 'pégale', 'pegue', 'péguele'], en: 'hit' },
      // push: who you push takes «a» like «golpea» («empuja al armadillo»); eat takes the food straight («come la manzana»)
      push: { show: 'empuja', forms: ['empuja', 'empuje', 'empújalo', 'empújale'], en: 'push' },
      eat: { show: 'come', forms: ['come', 'coma', 'cómete'], en: 'eat' },
    },
    arts: {
      el: { g: 'm' }, la: { g: 'f' }, los: { g: 'm', pl: 1 }, las: { g: 'f', pl: 1 }, al: { g: 'm', prep: 'a' }, del: { g: 'm', prep: 'de' },
      un: { g: 'm' }, una: { g: 'f' }, unos: { g: 'm', pl: 1 }, unas: { g: 'f', pl: 1 }, su: { g: 'mf', poss: 1 },
    },
    preps: ['sobre', 'encima', 'de', 'a', 'en', 'contra', 'hacia'],
    copulas: { es: 'ser', 'está': 'estar' },
    floatRel: ['flota', 'vuela', 'flotando', 'volando'],   // «la que flota»
    conj: [['y', 'luego'], ['y', 'después'], ['luego'], ['después'], ['y']],
    joiner: 'y luego',
    voc: ['mimo', 'oye'],
    fillers: ['por', 'favor', 'porfa', 'ahora', 'ya', 'rápido', 'dale', 'vamos', 'órale', 'ándale'],
    talk: [
      { id: 'nofight', p: ['no queremos pelear', 'no vamos a pelear', 'no queremos luchar', 'no quiero pelear', 'no hay que pelear'] },
      { id: 'friends', p: ['somos amigos', 'somos amigas', 'soy tu amigo', 'soy tu amiga', 'seamos amigos'] },
      { id: 'calm', p: ['tranquilo', 'tranquila', 'calma', 'cálmate', 'no tengas miedo'] },
      { id: 'nohurt', p: ['no te vamos a hacer daño', 'no te vamos a lastimar', 'no te haremos daño', 'no te vamos a pegar'] },
    ],
    talkAdj: { tranquilo: 'm', tranquila: 'f' },
    autoTalk: ['Tranquilo, no queremos pelear.', 'Somos amigos.', 'No te vamos a lastimar.'],
    // enemy shouts, richer with your tier: [text, English]
    shout(tier, toMimo, high) {
      if (tier <= 1) return high ? ['¡Por arriba!', 'Up high!'] : ['¡Por abajo!', 'Down low!'];
      if (tier === 2) return toMimo
        ? [`¡Voy por el orejón… ${high ? 'por arriba' : 'por abajo'}!`, `Coming for big-ears… ${high ? 'up high' : 'down low'}!`]
        : [`¡Voy por ti… ${high ? 'por arriba' : 'por abajo'}!`, `Coming for you… ${high ? 'up high' : 'down low'}!`];
      const spot = high ? 'en la cabeza' : 'en los pies', en = high ? 'on the head' : 'on the feet';
      return toMimo ? [`¡Orejón, te voy a dar ${spot}!`, `Big-ears, I’m gonna get you ${en}!`] : [`¡Te voy a dar ${spot}!`, `I’m gonna get you ${en}!`];
    },
    dodgeWords: tier => (tier >= 3 ? { high: 'la cabeza', low: 'los pies' } : { high: 'por arriba', low: 'por abajo' }),
    labels: { floating: 'flota', shy: 'tímido', weak: 'punto débil', calm: 'tranquilo', down: 'en el suelo', back: 'boca arriba', capeShut: 'capa cerrada', capeOpen: 'capa abierta' },
    labelsF: { shy: 'tímida' },
    examples: { 1: 'Salta', 2: 'Salta sobre el rojo', 3: 'Golpea la cola' },
    frames: {
      verb: { text: '¡Salta! · ¡Golpea!', pat: 'verb' },
      jumpT: { text: 'Salta sobre el ___', pat: 'jump+target' },
      hitT: { text: 'Golpea al ___', pat: 'hit+target' },
      partT: { text: 'Golpea la ___', pat: 'part' },
      rel: { text: 'Golpea al que está ___', pat: 'relative' },
      talk: { text: 'No queremos pelear · Somos amigos', pat: 'talk' },
      mothT: { text: 'Salta sobre la polilla ___', pat: 'jump+target' },
      wingT: { text: 'Golpea las alas', pat: 'part' },
      beetleT: { text: 'Golpea la cabeza del escarabajo', pat: 'part' },
      pushT: { text: 'Empuja al armadillo ___', pat: 'push+target' },
      frogT: { text: 'Salta sobre la rana ___', pat: 'jump+target' },
      posT: { text: 'de la izquierda · del medio · de la derecha', pat: 'position' },
      dummyT: { text: 'Golpea al muñeco ___', pat: 'hit+target' },
      kernelT: { text: 'Golpea al grano ___', pat: 'hit+target' },
      popT: { text: 'Salta sobre la palomita ___', pat: 'jump+target' },
      bossT: { text: 'Golpea al coronel', pat: 'hit+target' },
    },
    tips: {
      target: 'Describe who: «el rojo», «el grande». With «golpea», add «a»: a + el = «al» → «golpea al azul».',
      boss: 'His husk cape is closed: hits just bounce off. Beat his soldiers first («Golpea al grano amarillo»); then he opens the cape to attack, and that’s when you hit him: «Golpea al coronel».',
      popcorn: 'The floor is hot: the kernels popped! «el grano» is now «la palomita», and it’s feminine: «la palomita roja», «golpea a la blanca». They hop to new spots every turn.',
      position: 'They look the same? Say where it is, as you see it: «de la izquierda» (left), «del medio» (middle), «de la derecha» (right): «{ex}».',
      frog: 'Frogs hop to another lily pad after every turn, so «la rana de la izquierda» may be a different frog next time. Look before you speak!',
      parts: 'Name the part: «golpea la cola», «salta sobre la cabeza». Whose? «la cola del rojo».',
      shy: 'This one is shy. Talk instead of fighting: «No queremos pelear», «Somos amigos».',
      twist: '«es» = what it is (es azul). «está» = how it is right now (está dormido). Hit the one that «está dormido» for a surprise ×2: «Golpea al que está dormido».',
      moth: 'Moths float: «golpea» can’t reach them, «salta» can: «Salta sobre la polilla roja» («polilla» is feminine, so «roja»). Hit the wings to knock one down: «Golpea las alas».',
      beetle: 'Beetles have a hard shell (½ damage). Aim for the head: «Golpea la cabeza del escarabajo».',
      armadillo: 'Armadillos roll up into a hard ball (⅓ damage). Push one over: «Empuja al armadillo» (with «a», like «golpea al…»). On its back it can’t attack, and its belly takes ×2, for one turn.',
      eat: 'Hungry? Feed {name} from the bag: «Come la manzana», «Come el pan». It heals ♥, and it takes your turn.',
    },
    // why a slip is a slip, for the review after a battle (keys are the parser's error kinds)
    why: {
      spelling: 'Spelling: a letter was off. Compare the two lines: what changed is underlined.',
      accent: 'Accents: Spanish puts marks on some letters, like «está» and «pequeño». Typing without them still works, but this is how they look.',
      gender: 'Gender: every Spanish noun is masculine or feminine, and «el / la» and the adjective match it: «el escarabajo rojo», «la polilla roja», «la cola», «la manzana», «el pan». A color alone follows the creature: «la roja» is the red moth, «el rojo» a red hushling, beetle or armadillo.',
      prep: 'The little linking words: «salta» needs where you land: «salta sobre el rojo». «Golpea» and «empuja» need «a» before who: «golpea al rojo», «empuja al armadillo» (a + el = «al»). Food takes no «a»: «come la manzana».',
      possessive: 'Whose part? Use «de»: «la cola del rojo» (de + el = «del»).',
      serestar: '«es» says what something is (es azul). «está» says how it is right now (está dormido). Sleeping is how it is right now, so: «el que está dormido».',
      number: 'Number: the article matches one or more: «la manzana», «las manzanas»; one wing is «el ala», both wings are «las alas». So «las alas», not «la alas».',
      stressedA: '«ala» is feminine, but feminine words that start with a stressed «a» take «el» in the singular: «el ala» (like «el agua»). The plural is regular: «las alas».',
      article: 'Articles: Spanish puts «el / la» (or «un / una») before the noun: «golpea al rojo», «come la manzana». Food you eat in general can go without: «come pan».',
      position: 'Where it is: positions are as you see them on the screen: «de la izquierda» (left), «del medio» (middle), «de la derecha» (right), after the one you mean: «la rana de la izquierda». Frogs hop to another lily pad after every turn, so look again before you say where one is.',
      which: 'Which one? When two or more look the same (same kind, same color), say where the one you mean is: «la rana de la izquierda», «la del medio», «el calladito de la derecha».',
    },
    t: {
      hello: ['¡Hola! Yo entreno compañeros como {name}.', 'Hi! I train partners like {name}.'],
      watchJump: ['Primero, una acción. Mira: ¡salta!', 'First, an action. Watch: jump!'],
      echoJump: ['«Salta». Ahora tú: escribe «salta».', '“Salta.” Now you: type “salta.”'],
      teach: ['¡Muy bien! Ahora enséñaselo a {name}, sin mirar.', 'Very good! Now teach it to {name}, no peeking.'],
      firstWord: ['¡Su primera palabra!', 'Its first word!'],
      foeIn: ['¡Cuidado! Un calladito. Dile a {name} qué hacer.', 'Careful! A hushling. Tell {name} what to do.'],
      listen: ['¡Escucha! Te grita por dónde va a atacar.', 'Listen! It shouts where it will attack.'],
      newHit: ['¡Otra palabra! Mira: ¡golpea!', 'Another word! Watch: hit!'],
      echoHit: ['«Golpea». Escribe «golpea».', '“Golpea.” Type “golpea.”'],
      twoWords: ['¡{name} ya sabe dos palabras! Usa las dos.', '{name} knows two words now! Use both.'],
      winVerbs: ['¡Ganaste! {name} aprende rápido.', 'You won! {name} learns fast.'],
      twoFoes: ['Ahora hay dos calladitos. Este es rojo…', 'Now there are two hushlings. This one is red…'],
      twoFoesB: ['…y este es azul.', '…and this one is blue.'],
      echoRed: ['«Rojo». Escribe «rojo».', '“Rojo.” Type “rojo.”'],
      echoBlue: ['«Azul». Escribe «azul».', '“Azul.” Type “azul.”'],
      teachColor: ['Ahora enséñale el color a {name}.', 'Now teach {name} the color.'],
      sayWho: ['Para decir a quién: «Salta sobre el rojo».', 'To say who: “Salta sobre el rojo.”'],
      yourTurn: ['¡Te toca!', 'Your turn!'],
      winTargets: ['¡Excelente puntería!', 'Excellent aim!'],
      bigOne: ['¡Uf, un calladón! Es enorme.', 'Whoa, a big hushling! It’s huge.'],
      lookTail: ['Mira su cola. ¡Brilla! Es su punto débil.', 'Look at its tail. It’s glowing! That’s its weak spot.'],
      echoTail: ['«Cola». Escribe «cola».', '“Cola.” Type “cola.”'],
      teachWord: ['Ahora enséñale la palabra a {name}.', 'Now teach {name} the word.'],
      sayPart: ['Dile: «Golpea la cola».', 'Tell it: “Golpea la cola.”'],
      weakMoves: ['¡Ojo! El punto débil se mueve.', 'Watch out! The weak spot moves.'],
      lookHead: ['Ahora brilla su cabeza. «Cabeza». Escribe «cabeza».', 'Now its head is glowing. “Cabeza.” Type “cabeza.”'],
      winParts: ['¡Lo lograste! Le diste justo en el punto débil.', 'You did it! You hit it right on the weak spot.'],
      retry: ['¡Ay! Respira. Vamos otra vez.', 'Ouch! Breathe. Let’s go again.'],
      catchOn: ['¡Ya me sé ese truco!', 'I already know that trick!'],
      shyReally: ['¿De verdad…?', 'Really…?'],
      shyJoin: ['¿Amigos? ¡Amigos!', 'Friends? Friends!'],
      shyVoice: ['¡Ho… hola!', 'H… hello!'],
      shyAgain: ['…', '…'],
      shyScared: ['¡Ay! ¡Qué miedo!', 'Eek! So scary!'],
      poorShy: ['Pobrecito…', 'Poor little thing…'],
      poorShyF: ['Pobrecita…', 'Poor little thing…'],
      floating: ['¡Está flotando! Mejor salta.', 'It’s floating! Better jump.'],
      nowAngry: ['¡Ahora está enojado!', 'Now it’s angry!'],
      nowAngryF: ['¡Ahora está enojada!', 'Now it’s angry!'],
      sleepAgain: ['Se volvió a dormir.', 'It fell asleep again.'],
      mothDown: ['¡Se cayó! ¡Ahora sí la alcanzo!', 'It fell! Now I can reach it!'],
      mothUp: ['¡Volvió a volar!', 'It’s flying again!'],
      shellHard: ['¡Qué caparazón tan duro! Mejor la cabeza.', 'What a hard shell! Better the head.'],
      gradeIntro: ['¡Esa letra es tu nota! S es perfecto: el golpe es más fuerte.', 'That letter is your grade! S is perfect: the hit is stronger.'],
      // the armadillo, and the verb that flips it
      watchPush: ['¡Qué caparazón tan duro! Pero lo puedes voltear. Mira: ¡empuja!', 'What a hard shell! But you can flip it over. Watch: push!'],
      echoPush: ['«Empuja». Escribe «empuja».', '“Empuja.” Type “empuja.”'],
      curledHard: ['¡Es una bolita dura! Empújalo primero.', 'It’s a hard little ball! Push it first.'],
      flipped: ['¡Está boca arriba! ¡Ahora, la panza!', 'It’s on its back! Now, the belly!'],
      rollBack: ['¡Se volvió a hacer bolita!', 'It rolled up into a ball again!'],
      pushWhole: ['¿Todo?', 'All of it?'],
      // food from the bag
      hungry: ['¡{name} tiene hambre! Hay comida en la bolsa. Mira: ¡come!', '{name} is hungry! There’s food in the bag. Watch: eat!'],
      echoEat: ['«Come». Escribe «come».', '“Come.” Type “come.”'],
      munch: ['¡Ñam, ñam!', 'Munch, munch!'],
      yum: ['¡Qué rico!', 'Yummy!'],
      full: ['¡Estoy lleno!', 'I’m full!'],
      eatWhat: ['¿Comer qué?', 'Eat what?'],
      noFood: ['¡No hay!', 'There isn’t any!'],
      notFood: ['¡Eso no se come!', 'That’s not for eating!'],
      // where they are: the Coach teaches izquierda / medio / derecha when two or more look the same
      posIntro: ['¡Son iguales! {name} no sabe cuál es cuál. Dile dónde está: a la izquierda, en el medio o a la derecha.', 'They look the same! {name} can’t tell which is which. Tell it where one is: on the left, in the middle or on the right.'],
      posIntro2: ['¡Son iguales! {name} no sabe cuál es cuál. Dile dónde está: a la izquierda o a la derecha.', 'They look the same! {name} can’t tell which is which. Tell it where one is: on the left or on the right.'],
      posLeft: ['A la izquierda: «izquierda». Escribe «izquierda».', 'On the left: “izquierda.” Type “izquierda.”'],
      posMiddle: ['En el medio: «medio». Escribe «medio».', 'In the middle: “medio.” Type “medio.”'],
      posRight: ['A la derecha: «derecha». Escribe «derecha».', 'On the right: “derecha.” Type “derecha.”'],
      frogsHop: ['¡Ojo! Las ranas saltan de hoja en hoja después de cada turno. Mira bien antes de hablar.', 'Watch out! Frogs hop from pad to pad after every turn. Look carefully before you speak.'],
      swapped: ['¡Cambiaron de lugar!', 'They switched places!'],
      whichOne: ['¿Cuál?', 'Which one?'],
      croak: ['¡Croac!', 'Ribbit!'],
      // practice in Bruno's yard (no stakes: the dummies swing, but a miss costs nothing)
      pHello: ['¡Hola! Vamos a entrenar con los muñecos.', 'Hi! Let’s train with the dummies.'],
      pVerbs: ['Primero, las acciones: salta, golpea… ¡Cambia de acción cada vez!', 'First, the actions: jump, hit… Change the action every time!'],
      pColors: ['Mira las bufandas: cada muñeco tiene un color. Di cuál: «el rojo», «el azul».', 'Look at the scarves: each dummy has a color. Say which one: “el rojo”, “el azul.”'],
      pPositions: ['Estos son iguales. Di dónde está: a la izquierda, en el medio o a la derecha.', 'These look the same. Say where one is: on the left, in the middle or on the right.'],
      pMixed: ['Ahora todo junto: acciones, colores y lugares.', 'Now everything together: actions, colors and places.'],
      pDodge: ['¡Y ojo! A veces un muñeco gira. Esquiva con las flechas.', 'And watch out! Sometimes a dummy spins. Dodge with the arrows.'],
      pGreat: ['¡Perfecto!', 'Perfect!'],
      pGood: ['¡Muy bien!', 'Very good!'],
      pFix: ['¡Casi! Otra vez.', 'Almost! Again.'],
      pMissed: ['¡Uy! No pasa nada: es práctica.', 'Oops! No harm done: it’s practice.'],
      pRound: ['¡Otra ronda! Muñecos nuevos.', 'Another round! New dummies.'],
      pWin: ['¡Todos al suelo! ¡Excelente!', 'All down! Excellent!'],
      pDone: ['¡Buen entrenamiento! Vuelve cuando quieras.', 'Good training! Come back any time.'],
      // the Corn Society: its leader thinks you're the Hush's spies, until you speak up
      bossIntro: ['¡Alto! ¡Quietos! ¡Ustedes son del Silencio!', 'Halt! Freeze! You’re from the Hush!'],     // (the Hush is «el Silencio», as in lines.js)
      bossName: ['¡Soy el Coronel Mazorca! ¡Aquí no entra el Silencio!', 'I’m Colonel Cob! The Hush doesn’t get in here!'],
      bossCall: ['¡Soldados, a formar!', 'Soldiers, fall in!'],
      bossBounce: ['¡Ja! ¡Mi capa es muy dura!', 'Ha! My cape is very hard!'],
      bossOpen: ['¡Basta! ¡Ahora peleo yo!', 'Enough! Now I fight!'],
      bossHurt: ['¡Ay, mi medalla!', 'Ow, my medal!'],
      bossClose: ['¡A cubierto! ¡Más soldados!', 'Take cover! More soldiers!'],
      bossHeat: ['¡Fuego! ¡El piso está muy caliente!', 'Fire! The floor is very hot!'],
      pop: ['¡Pop!', 'Pop!'],
      bossGiveUp: ['¡Me rindo! ¡Me rindo!', 'I give up! I give up!'],
      bossAfter: ['¿No son del Silencio? ¡Pero ustedes hablan! ¡Qué valientes!', 'You’re not from the Hush? But you speak! How brave!'],
      psst: ['Psst…', 'Psst…'],
      weak: ['¡Punto débil!', 'Weak spot!'],
      hard: ['¡Está duro!', 'It’s hard!'],
      sneak: ['¡Por sorpresa!', 'Surprise attack!'],
      noverb: ['¿Qué hago?', 'What do I do?'],
      which: ['¿Cuál?', 'Which one?'],
      none: ['¿Dónde?', 'Where?'],
      nopart: ['¿Dónde está eso?', 'Where’s that?'],
      win: ['¡Ganamos!', 'We won!'],
      lose: ['Uf… necesitamos descansar.', 'Phew… we need a rest.'],
      flee: ['¡Vámonos!', 'Let’s go!'],
    },
    // the Coach gives a whole sentence to copy: «¡Empuja al armadillo!», «¡Come la manzana!»
    sayEx: ex => [`Dile: «${ex}»`, `Tell it: “${ex}”`],
    coins: { one: 'moneda', many: 'monedas' },
    weakNow: p => [`¡Ahora brilla ${L.es.parts[p].g === 'f' ? 'la' : 'el'} ${L.es.parts[p].w}!`, `Now the ${L.es.parts[p].en} is glowing!`],
    unknown: w => [`¿«${w}»?`, `doesn’t know “${w}” yet`],
    // a new kind of creature shows up: its name, with the article (the gender is part of the word)
    meet: k => {
      const s = L.es.species[k], f = s.g === 'f', the = (f ? 'la' : 'el') + ' ' + s.w;
      if (k === 'colonel') return [`Es ${s.name}, el jefe. Escribe «${the}».`, `It’s Colonel Cob, the leader. Type “${the}.”`];
      if (k === 'dummy') return [`Este es el muñeco de práctica. Escribe «${the}».`, `This is the practice dummy. Type “${the}.”`];
      return [`¡Mira! ${f ? 'Una' : 'Un'} ${s.w}. Escribe «${the}».`, `Look! A ${s.en}. Type “${the}.”`];
    },
    // a color word, shown on one of them: «Este grano es blanco: «blanco». Escribe «blanco».»
    colorIs: (key, k) => { const s = L.es.species[k], f = s.g === 'f', A = L.es.adjs[key].forms[0]; return [`${f ? 'Esta' : 'Este'} ${s.w} es ${f ? A.f : A.m}: «${A.m}». Escribe «${A.m}».`, `This ${s.en} is ${L.es.adjs[key].en}: “${A.m}.” Type “${A.m}.”`]; },
    gloss: {
      hola: 'hi', yo: 'I', entreno: 'I train', 'compañeros': 'partners', como: 'like', primero: 'first', una: 'a', un: 'a', 'acción': 'action',
      mira: 'look / watch', ahora: 'now', 'tú': 'you', escribe: 'type / write', muy: 'very', bien: 'good', 'enséñaselo': 'teach it to (him)',
      sin: 'without', mirar: 'looking', su: 'its', primera: 'first', palabra: 'word', cuidado: 'careful', calladito: 'hushling (little quiet one)',
      dile: 'tell (him)', 'qué': 'what', hacer: 'to do', escucha: 'listen', te: 'you', grita: 'shouts', 'por dónde': 'where', va: 'goes',
      atacar: 'to attack', otra: 'another', ya: 'already', sabe: 'knows', dos: 'two', palabras: 'words', usa: 'use', las: 'the', ganaste: 'you won',
      aprende: 'learns', 'rápido': 'fast', hay: 'there are', calladitos: 'hushlings', este: 'this one', es: 'is (what it is)', y: 'and',
      'enséñale': 'teach (him)', el: 'the', color: 'color', para: 'to / in order to', decir: 'say', 'a quién': 'who (to whom)', toca: 'your turn',
      excelente: 'excellent', 'puntería': 'aim', uf: 'whoa', 'calladón': 'big hushling', enorme: 'huge', cola: 'tail', brilla: 'glows',
      punto: 'spot', 'débil': 'weak', la: 'the', ojo: 'watch out', se: '(itself)', mueve: 'moves', cabeza: 'head', lograste: 'you did it',
      le: '(to it)', diste: 'you hit / gave', justo: 'right', en: 'on / in', 'caparazón': 'shell', salta: 'jump', golpea: 'hit', sobre: 'on (top of)',
      al: 'a + el (to the)', del: 'de + el (of the)', rojo: 'red', azul: 'blue', verde: 'green', amarillo: 'yellow', grande: 'big', 'pequeño': 'small',
      dormido: 'asleep', enojado: 'angry', 'está': 'is (right now)', respira: 'breathe', vamos: 'let’s go', vez: 'time',
      polilla: 'moth', polillas: 'moths', escarabajo: 'beetle', escarabajos: 'beetles', ala: 'wing', alas: 'wings',
      esa: 'that', letra: 'letter', tu: 'your', nota: 'grade', perfecto: 'perfect', golpe: 'hit', 'más': 'more', fuerte: 'strong',
      'cayó': 'fell', 'sí': 'yes / really', alcanzo: 'I reach', 'volvió': 'went back', volar: 'to fly', tan: 'so', duro: 'hard', mejor: 'better',
      suelo: 'ground', roja: 'red (feminine)', dormida: 'asleep (feminine)', enojada: 'angry (feminine)', pobrecita: 'poor little thing',
      empuja: 'push', 'empújalo': 'push it', armadillo: 'armadillo', armadillos: 'armadillos', pero: 'but', lo: 'it', puedes: 'you can',
      voltear: 'flip over', bolita: 'little ball', boca: 'mouth (boca arriba = on its back)', arriba: 'up', panza: 'belly',
      hacer: 'make (hacerse bolita = roll up)', todo: 'all of it', come: 'eat', 'cómete': 'eat up', comer: 'eat', tiene: 'has', hambre: 'hunger (tener hambre = be hungry)',
      comida: 'food', bolsa: 'bag', 'ñam': 'munch', rico: 'tasty / yummy', estoy: 'I am', lleno: 'full', no: 'no / not', eso: 'that',
      monedas: 'coins', moneda: 'coin',
      rana: 'frog', ranas: 'frogs', izquierda: 'left', derecha: 'right', medio: 'middle', son: 'they are', iguales: 'the same',
      'cuál': 'which (one)', 'dónde': 'where', o: 'or', saltan: 'they hop', hoja: 'leaf (lily pad)', de: 'of / from', 'después': 'after', cada: 'every',
      turno: 'turn', antes: 'before', hablar: 'speaking', cambiaron: 'they changed', lugar: 'place', croac: 'ribbit',
      pescado: 'fish (food)', pez: 'fish (alive)',
      'muñeco': 'dummy', 'muñecos': 'dummies', entrenar: 'train', bufandas: 'scarves', estos: 'these', junto: 'together', acciones: 'actions',
      colores: 'colors', lugares: 'places', veces: 'times (a veces = sometimes)', gira: 'spins', esquiva: 'dodge', flechas: 'arrows',
      cambia: 'change', 'práctica': 'practice', pasa: 'happens (no pasa nada = no harm done)', nada: 'nothing',
      ronda: 'round', nuevos: 'new', todos: 'all', vuelve: 'come back', cuando: 'when', quieras: 'you want',
      entrenamiento: 'training', buen: 'good', casi: 'almost', grano: 'kernel (grain)', granos: 'kernels', palomita: 'popcorn',
      palomitas: 'popcorn (pieces)', coronel: 'colonel', mazorca: 'corn cob', jefe: 'leader / boss', alto: 'halt', silencio: 'silence',
      ustedes: 'you (all)', soy: 'I am', 'aquí': 'here', entra: 'gets in', soldados: 'soldiers', formar: 'fall in (a formar)',
      ja: 'ha', mi: 'my', capa: 'cape', basta: 'enough', peleo: 'I fight', ay: 'ow', medalla: 'medal', cubierto: 'cover (a cubierto = take cover)',
      fuego: 'fire', piso: 'floor', caliente: 'hot', rindo: 'I give up (me rindo)', me: 'me / myself', hablan: 'you speak / they speak',
      valientes: 'brave', blanco: 'white', blanca: 'white (feminine)',
    },
  };

  // ================================================================ Portuguese (Brazilian)
  L.pt = {
    code: 'pt', name: 'Português', variety: 'Brazilian Portuguese',
    species: {
      hushling: { w: 'caladinho', pl: 'caladinhos', g: 'm', en: 'hushling' },
      hushbig: { w: 'caladão', pl: 'caladões', g: 'm', en: 'big hushling' },
      moth: { w: 'mariposa', pl: 'mariposas', g: 'f', en: 'moth' },
      beetle: { w: 'besouro', pl: 'besouros', g: 'm', en: 'beetle' },
      armadillo: { w: 'tatu', pl: 'tatus', g: 'm', en: 'armadillo' },
      frog: { w: 'sapo', pl: 'sapos', g: 'm', en: 'frog' },
      // Bruno's training dummies; the Corn Society: kernel soldiers that pop on a hot floor («o grão» becomes
      // «a pipoca»), and their leader, o Coronel Espiga (an espiga is an ear of corn)
      dummy: { w: 'boneco', pl: 'bonecos', g: 'm', en: 'dummy' },
      kernel: { w: 'grão', pl: 'grãos', g: 'm', en: 'kernel' },
      popcorn: { w: 'pipoca', pl: 'pipocas', g: 'f', en: 'popcorn' },
      colonel: { w: 'coronel', pl: 'coronéis', g: 'm', en: 'colonel', name: 'o Coronel Espiga' },
    },
    // where one stands in the row, as you see it: «o sapo da esquerda», «a mariposa do meio» (de + a = da, de + o = do)
    positions: {
      left: { w: 'esquerda', g: 'f', en: 'left', phrase: 'da esquerda' },
      middle: { w: 'meio', g: 'm', en: 'middle', phrase: 'do meio', alt: ['centro'] },
      right: { w: 'direita', g: 'f', en: 'right', phrase: 'da direita' },
    },
    parts: {
      head: { w: 'cabeça', g: 'f', en: 'head' },
      tail: { w: 'rabo', g: 'm', en: 'tail', alt: ['cauda'] },
      shell: { w: 'casco', g: 'm', en: 'shell', alt: ['carapaça'] },
      wing: { w: 'asa', pl: 'asas', g: 'f', en: 'wing' },
    },
    // the stone comes in three sizes: -inho makes it light and quick, -ão heavy
    stones: {
      pedrinha: { g: 'f', kind: 'light' },
      pedra: { g: 'f', kind: 'medium' },
      'pedrão': { g: 'm', kind: 'heavy' },
      pedrona: { g: 'f', kind: 'heavy' },
    },
    stoneShow: { light: 'a pedrinha', medium: 'a pedra', heavy: 'o pedrão' },
    // -inho / -ão also work on colors: o vermelhinho (the little red one), o azulão (the big blue one)
    adjs: {
      red: { forms: [{ m: 'vermelho', f: 'vermelha' }], dim: { m: 'vermelhinho', f: 'vermelhinha' }, aug: { m: 'vermelhão', f: 'vermelhona' }, en: 'red' },
      blue: { forms: [{ m: 'azul', f: 'azul' }], dim: { m: 'azulzinho', f: 'azulzinha' }, aug: { m: 'azulão', f: 'azulona' }, en: 'blue' },
      green: { forms: [{ m: 'verde', f: 'verde' }], dim: { m: 'verdinho', f: 'verdinha' }, aug: { m: 'verdão', f: 'verdona' }, en: 'green' },
      yellow: { forms: [{ m: 'amarelo', f: 'amarela' }], dim: { m: 'amarelinho', f: 'amarelinha' }, aug: { m: 'amarelão', f: 'amarelona' }, en: 'yellow' },
      white: { forms: [{ m: 'branco', f: 'branca' }], dim: { m: 'branquinho', f: 'branquinha' }, aug: { m: 'brancão', f: 'brancona' }, en: 'white' },
      big: { forms: [{ m: 'grande', f: 'grande' }, { m: 'grandão', f: 'grandona' }], en: 'big' },
      small: { forms: [{ m: 'pequeno', f: 'pequena' }, { m: 'baixinho', f: 'baixinha' }, { m: 'pequenininho', f: 'pequenininha' }], en: 'small' },
    },
    verbs: {
      jump: { show: 'pula', forms: ['pula', 'pule', 'salta', 'salte'], en: 'jump' },
      hit: { show: 'bate', forms: ['bate', 'bata', 'soca', 'soque'], en: 'hit' },
      throw: { show: 'joga', forms: ['joga', 'jogue', 'atira', 'atire', 'arremessa', 'arremesse', 'lança', 'lance'], en: 'throw' },
      // push and eat take what they act on straight, with no «em»: «empurra o tatu», «come a maçã»
      push: { show: 'empurra', forms: ['empurra', 'empurre'], en: 'push' },
      eat: { show: 'come', forms: ['come', 'coma'], en: 'eat' },
    },
    arts: {
      o: { g: 'm' }, a: { g: 'f' }, os: { g: 'm', pl: 1 }, as: { g: 'f', pl: 1 },
      no: { g: 'm', prep: 'em' }, na: { g: 'f', prep: 'em' }, nos: { g: 'm', prep: 'em', pl: 1 }, nas: { g: 'f', prep: 'em', pl: 1 },
      num: { g: 'm', prep: 'em' }, numa: { g: 'f', prep: 'em' }, do: { g: 'm', prep: 'de' }, da: { g: 'f', prep: 'de' },
      ao: { g: 'm', prep: 'a' }, pro: { g: 'm', prep: 'para' }, pra: { g: 'f', prep: 'para' },
      um: { g: 'm' }, uma: { g: 'f' }, uns: { g: 'm', pl: 1 }, umas: { g: 'f', pl: 1 }, seu: { g: 'm', poss: 1 }, sua: { g: 'f', poss: 1 },
    },
    preps: ['em', 'sobre', 'cima', 'de', 'contra', 'para'],
    copulas: { 'é': 'ser', 'está': 'estar', 'tá': 'estar' },
    floatRel: ['voa', 'flutua', 'voando', 'flutuando'],
    conj: [['e', 'depois'], ['e', 'aí'], ['e', 'então'], ['depois'], ['e']],
    joiner: 'e depois',
    voc: ['mimo', 'ei', 'oi'],
    fillers: ['por', 'favor', 'agora', 'já', 'rápido', 'vai', 'bora'],
    talk: [
      { id: 'nofight', p: ['não queremos brigar', 'não vamos brigar', 'não queremos lutar', 'não quero brigar', 'a gente não quer brigar'] },
      { id: 'friends', p: ['somos amigos', 'somos amigas', 'sou seu amigo', 'sou sua amiga', 'vamos ser amigos'] },
      { id: 'calm', p: ['calma', 'fica tranquilo', 'fica tranquila', 'tranquilo', 'tranquila', 'não tenha medo', 'não tem medo', 'relaxa'] },
      { id: 'nohurt', p: ['não vamos te machucar', 'não vamos machucar você', 'a gente não vai te machucar'] },
    ],
    talkAdj: { tranquilo: 'm', tranquila: 'f' },
    autoTalk: ['Calma, não queremos brigar.', 'Somos amigos.', 'Não vamos te machucar.'],
    shout(tier, toMimo, high) {
      if (tier <= 1) return high ? ['Por cima!', 'Up high!'] : ['Por baixo!', 'Down low!'];
      if (tier === 2) return toMimo
        ? [`Vou pegar o orelhudo… ${high ? 'por cima' : 'por baixo'}!`, `Gonna get big-ears… ${high ? 'up high' : 'down low'}!`]
        : [`Vou te pegar… ${high ? 'por cima' : 'por baixo'}!`, `Gonna get you… ${high ? 'up high' : 'down low'}!`];
      const spot = high ? 'sua cabeça' : 'seus pés', en = high ? 'your head' : 'your feet';
      return toMimo ? [`Orelhudo, vou acertar ${spot}!`, `Big-ears, I’m gonna hit ${en}!`] : [`Vou acertar ${spot}!`, `I’m gonna hit ${en}!`];
    },
    dodgeWords: tier => (tier >= 3 ? { high: 'cabeça', low: 'pés' } : { high: 'por cima', low: 'por baixo' }),
    labels: { floating: 'flutua', shy: 'tímido', weak: 'ponto fraco', calm: 'tranquilo', down: 'no chão', back: 'de barriga para cima', capeShut: 'capa fechada', capeOpen: 'capa aberta' },
    labelsF: { shy: 'tímida' },
    examples: { 1: 'Pula', 2: 'Pula no vermelho', 3: 'Bate no rabo' },
    frames: {
      verb: { text: 'Pula! · Bate!', pat: 'verb' },
      jumpT: { text: 'Pula no ___', pat: 'jump+target' },
      hitT: { text: 'Bate no ___', pat: 'hit+target' },
      partT: { text: 'Bate no rabo · Pula na cabeça', pat: 'part' },
      pebble: { text: 'Joga a pedrinha no ___', pat: 'throw-light' },
      boulder: { text: 'Joga o pedrão no ___', pat: 'throw-heavy' },
      talk: { text: 'Não queremos brigar · Somos amigos', pat: 'talk' },
      mothT: { text: 'Pula na mariposa ___', pat: 'jump+target' },
      wingT: { text: 'Bate nas asas', pat: 'part' },
      beetleT: { text: 'Bate na cabeça do besouro', pat: 'part' },
      pushT: { text: 'Empurra o tatu ___', pat: 'push+target' },
      frogT: { text: 'Pula no sapo ___', pat: 'jump+target' },
      posT: { text: 'da esquerda · do meio · da direita', pat: 'position' },
      dummyT: { text: 'Bate no boneco ___', pat: 'hit+target' },
      kernelT: { text: 'Bate no grão ___', pat: 'hit+target' },
      popT: { text: 'Pula na pipoca ___', pat: 'jump+target' },
      bossT: { text: 'Bate no coronel', pat: 'hit+target' },
    },
    tips: {
      target: 'Describe who: «o vermelho», «o grande». Use «em»: em + o = «no», em + a = «na» → «pula no vermelho», «bate no azul».',
      boss: 'His husk cape is closed: hits just bounce off. Beat his soldiers first («Bate no grão amarelo»); then he opens the cape to attack, and that’s when you hit him: «Bate no coronel».',
      popcorn: 'The floor is hot: the kernels popped! «o grão» is now «a pipoca», and it’s feminine: «a pipoca vermelha», «pula na branca». They hop to new spots every turn.',
      position: 'They look the same? Say where it is, as you see it: «da esquerda» (left), «do meio» (middle), «da direita» (right): «{ex}».',
      frog: 'Frogs hop to another lily pad after every turn, so «o sapo da esquerda» may be a different frog next time. Look before you speak!',
      parts: 'Name the part: «bate no rabo», «pula na cabeça». Whose? «o rabo do vermelho».',
      shy: 'This one is shy. Talk instead of fighting: «Não queremos brigar», «Somos amigos».',
      twist: '-inho = small, -ão = big. «a pedrinha» is quick (it hits floaters), «o pedrão» is heavy (it breaks shells). It works on colors too: «o vermelhinho» = the little red one, «o azulão» = the big blue one.',
      moth: 'Moths float: «bate» can’t reach them, «pula» can: «Pula na mariposa vermelha» («mariposa» is feminine: «na», «vermelha»). Hit the wings to knock one down: «Bate nas asas».',
      beetle: 'Beetles have a hard shell (½ damage). Aim for the head: «Bate na cabeça do besouro». «O pedrão» cracks the shell.',
      armadillo: 'Armadillos («o tatu») roll up into a hard ball (⅓ damage). Push one over: «Empurra o tatu», straight, with no «no». On its back it can’t attack, and its belly takes ×2, for one turn.',
      eat: 'Hungry? Feed {name} from the bag: «Come a maçã», «Come o pão». It heals ♥, and it takes your turn.',
    },
    // why a slip is a slip, for the review after a battle (keys are the parser's error kinds)
    why: {
      spelling: 'Spelling: a letter was off. Compare the two lines: what changed is underlined.',
      accent: 'Accents: Portuguese puts marks on some letters, like «cabeça» and «pedrão». Typing without them still works, but this is how they look.',
      gender: 'Gender: every Portuguese noun is masculine or feminine, and «o / a» and the adjective match it: «o besouro vermelho», «a mariposa vermelha», «a cabeça», «a maçã», «o pão». With «em»: «no besouro», «na mariposa».',
      prep: 'The little linking words: Portuguese uses «em» for who or where, joined to the article: em + o = «no», em + a = «na» → «pula no vermelho», «bate na cabeça». But «empurra» and «come» take it straight, with no «em»: «empurra o tatu», «come a maçã».',
      possessive: 'Whose part? Use «de»: «o rabo do vermelho» (de + o = «do»).',
      throwWhat: 'Say what to throw: «a pedrinha» (small and quick) or «o pedrão» (big and heavy).',
      number: 'Number: the article matches one or more: «a maçã», «as maçãs»; one wing is «a asa», both wings are «as asas». With «em»: «na asa», «nas asas».',
      article: 'Articles: Portuguese puts «o / a» (or «um / uma») before the noun: «empurra o tatu», «come a maçã». Food you eat in general can go without: «come pão».',
      position: 'Where it is: positions are as you see them on the screen: «da esquerda» (left), «do meio» (middle), «da direita» (right), after the one you mean: «o sapo da esquerda» (de + a = «da», de + o = «do»). Frogs hop to another lily pad after every turn, so look again before you say where one is.',
      which: 'Which one? When two or more look the same (same kind, same color), say where the one you mean is: «o sapo da esquerda», «o do meio», «a mariposa da direita».',
    },
    t: {
      hello: ['Oi! Eu treino parceiros como {name}.', 'Hi! I train partners like {name}.'],
      watchJump: ['Primeiro, uma ação. Olha: pula!', 'First, an action. Watch: jump!'],
      echoJump: ['«Pula». Agora você: escreve «pula».', '“Pula.” Now you: type “pula.”'],
      teach: ['Muito bem! Agora ensina pra {name}, sem olhar.', 'Very good! Now teach it to {name}, no peeking.'],
      firstWord: ['A primeira palavra!', 'The first word!'],
      foeIn: ['Cuidado! Um caladinho. Fala pra {name} o que fazer.', 'Careful! A hushling. Tell {name} what to do.'],
      listen: ['Presta atenção! Ele grita por onde vai atacar.', 'Pay attention! It shouts where it will attack.'],
      newHit: ['Outra palavra! Olha: bate!', 'Another word! Watch: hit!'],
      echoHit: ['«Bate». Escreve «bate».', '“Bate.” Type “bate.”'],
      twoWords: ['{name} já sabe duas palavras! Usa as duas.', '{name} knows two words now! Use both.'],
      winVerbs: ['Você ganhou! {name} aprende rápido.', 'You won! {name} learns fast.'],
      twoFoes: ['Agora são dois caladinhos. Esse é vermelho…', 'Now there are two hushlings. This one is red…'],
      twoFoesB: ['…e esse é azul.', '…and this one is blue.'],
      echoRed: ['«Vermelho». Escreve «vermelho».', '“Vermelho.” Type “vermelho.”'],
      echoBlue: ['«Azul». Escreve «azul».', '“Azul.” Type “azul.”'],
      teachColor: ['Agora ensina a cor pra {name}.', 'Now teach {name} the color.'],
      sayWho: ['Pra dizer em quem: «Pula no vermelho».', 'To say who: “Pula no vermelho.”'],
      yourTurn: ['Sua vez!', 'Your turn!'],
      winTargets: ['Que pontaria!', 'What aim!'],
      bigOne: ['Eita, um caladão! É enorme.', 'Whoa, a big hushling! It’s huge.'],
      lookTail: ['Olha o rabo dele. Tá brilhando! É o ponto fraco.', 'Look at its tail. It’s glowing! That’s the weak spot.'],
      echoTail: ['«Rabo». Escreve «rabo».', '“Rabo.” Type “rabo.”'],
      teachWord: ['Agora ensina a palavra pra {name}.', 'Now teach {name} the word.'],
      sayPart: ['Fala: «Bate no rabo».', 'Say: “Bate no rabo.”'],
      weakMoves: ['Olha! O ponto fraco mudou de lugar.', 'Look! The weak spot moved.'],
      lookHead: ['Agora a cabeça tá brilhando. «Cabeça». Escreve «cabeça».', 'Now its head is glowing. “Cabeça.” Type “cabeça.”'],
      winParts: ['Conseguiu! Acertou bem no ponto fraco.', 'You did it! Right on the weak spot.'],
      retry: ['Ai! Respira. Vamos de novo.', 'Ouch! Breathe. Let’s go again.'],
      catchOn: ['Já conheço esse truque!', 'I already know that trick!'],
      shyReally: ['Sério…?', 'Really…?'],
      shyJoin: ['Amigos? Amigos!', 'Friends? Friends!'],
      shyVoice: ['O… oi!', 'H… hi!'],
      shyAgain: ['…', '…'],
      shyScared: ['Ai! Que medo!', 'Eek! So scary!'],
      poorShy: ['Coitadinho…', 'Poor little thing…'],
      poorShyF: ['Coitadinha…', 'Poor little thing…'],
      floating: ['Tá flutuando! Melhor pular.', 'It’s floating! Better jump.'],
      tooSlow: ['O pedrão é pesado demais pra quem flutua!', 'The big rock is too heavy to hit a floater!'],
      shellPing: ['Só o pedrão quebra o casco!', 'Only the big rock breaks the shell!'],
      shellCrack: ['O casco rachou!', 'The shell cracked!'],
      throwWhat: ['Jogo o quê? A pedrinha ou o pedrão?', 'Throw what? The pebble or the big rock?'],
      nowAngry: ['Agora ele tá bravo!', 'Now it’s angry!'],
      nowAngryF: ['Agora ela tá brava!', 'Now it’s angry!'],
      sleepAgain: ['Ele dormiu de novo.', 'It fell asleep again.'],
      sleepAgainF: ['Ela dormiu de novo.', 'It fell asleep again.'],
      mothDown: ['Caiu! Agora eu alcanço!', 'It fell! Now I can reach it!'],
      mothUp: ['Voltou a voar!', 'It’s flying again!'],
      shellHard: ['Que casco duro! Melhor a cabeça.', 'What a hard shell! Better the head.'],
      gradeIntro: ['Essa letra é a sua nota! S é perfeito: o golpe fica mais forte.', 'That letter is your grade! S is perfect: the hit gets stronger.'],
      // the armadillo, and the verb that flips it
      watchPush: ['Que casco duro! Mas dá pra virar ele. Olha: empurra!', 'What a hard shell! But you can flip it over. Watch: push!'],
      echoPush: ['«Empurra». Escreve «empurra».', '“Empurra.” Type “empurra.”'],
      curledHard: ['É uma bolinha dura! Empurra primeiro.', 'It’s a hard little ball! Push it first.'],
      flipped: ['Virou de barriga para cima! Agora, na barriga!', 'It flipped onto its back! Now, the belly!'],
      rollBack: ['Virou bolinha de novo!', 'It rolled up into a ball again!'],
      pushWhole: ['Tudo?', 'All of it?'],
      // food from the bag
      hungry: ['{name} tá com fome! Tem comida na bolsa. Olha: come!', '{name} is hungry! There’s food in the bag. Watch: eat!'],
      echoEat: ['«Come». Escreve «come».', '“Come.” Type “come.”'],
      munch: ['Nhac, nhac!', 'Munch, munch!'],
      yum: ['Que gostoso!', 'Yummy!'],
      full: ['Tô cheio!', 'I’m full!'],
      eatWhat: ['Comer o quê?', 'Eat what?'],
      noFood: ['Não tem!', 'There isn’t any!'],
      notFood: ['Isso não se come!', 'That’s not for eating!'],
      // where they are: the Coach teaches esquerda / meio / direita when two or more look the same
      posIntro: ['São iguais! {name} não sabe qual é qual. Fala onde está: na esquerda, no meio ou na direita.', 'They look the same! {name} can’t tell which is which. Say where one is: on the left, in the middle or on the right.'],
      posIntro2: ['São iguais! {name} não sabe qual é qual. Fala onde está: na esquerda ou na direita.', 'They look the same! {name} can’t tell which is which. Say where one is: on the left or on the right.'],
      posLeft: ['Na esquerda: «esquerda». Escreve «esquerda».', 'On the left: “esquerda.” Type “esquerda.”'],
      posMiddle: ['No meio: «meio». Escreve «meio».', 'In the middle: “meio.” Type “meio.”'],
      posRight: ['Na direita: «direita». Escreve «direita».', 'On the right: “direita.” Type “direita.”'],
      frogsHop: ['Olha! Os sapos pulam de folha em folha depois de cada turno. Olha bem antes de falar.', 'Look out! Frogs hop from pad to pad after every turn. Look carefully before you speak.'],
      swapped: ['Trocaram de lugar!', 'They switched places!'],
      whichOne: ['Qual?', 'Which one?'],
      croak: ['Croac!', 'Ribbit!'],
      // practice in Bruno's yard (no stakes: the dummies swing, but a miss costs nothing)
      pHello: ['Oi! Vamos treinar com os bonecos.', 'Hi! Let’s train with the dummies.'],
      pVerbs: ['Primeiro, as ações: pula, bate… Muda de ação toda vez!', 'First, the actions: jump, hit… Change the action every time!'],
      pColors: ['Olha os cachecóis: cada boneco tem uma cor. Fala qual: «o vermelho», «o azul».', 'Look at the scarves: each dummy has a color. Say which one: “o vermelho”, “o azul.”'],
      pPositions: ['Esses são iguais. Fala onde está: na esquerda, no meio ou na direita.', 'These look the same. Say where one is: on the left, in the middle or on the right.'],
      pMixed: ['Agora tudo junto: ações, cores e lugares.', 'Now everything together: actions, colors and places.'],
      pDodge: ['E olha! Às vezes um boneco gira. Desvia com as setas.', 'And look out! Sometimes a dummy spins. Dodge with the arrows.'],
      pGreat: ['Perfeito!', 'Perfect!'],
      pGood: ['Muito bem!', 'Very good!'],
      pFix: ['Quase! De novo.', 'Almost! Again.'],
      pMissed: ['Opa! Tudo bem: é treino.', 'Oops! No harm done: it’s practice.'],
      pRound: ['Mais uma rodada! Bonecos novos.', 'Another round! New dummies.'],
      pWin: ['Todos no chão! Excelente!', 'All down! Excellent!'],
      pDone: ['Bom treino! Volta quando quiser.', 'Good training! Come back any time.'],
      // the Corn Society: its leader thinks you're the Hush's spies, until you speak up
      bossIntro: ['Alto! Parados! Vocês são do Silêncio!', 'Halt! Freeze! You’re from the Hush!'],     // (the Hush is «o Silêncio», as in lines.js)
      bossName: ['Eu sou o Coronel Espiga! Aqui o Silêncio não entra!', 'I’m Colonel Cob! The Hush doesn’t get in here!'],
      bossCall: ['Soldados, em forma!', 'Soldiers, fall in!'],
      bossBounce: ['Rá! Minha capa é muito dura!', 'Ha! My cape is very hard!'],
      bossOpen: ['Chega! Agora eu luto!', 'Enough! Now I fight!'],
      bossHurt: ['Ai, minha medalha!', 'Ow, my medal!'],
      bossClose: ['Proteção! Mais soldados!', 'Cover! More soldiers!'],
      bossHeat: ['Fogo! O chão está muito quente!', 'Fire! The floor is very hot!'],
      pop: ['Pop!', 'Pop!'],
      bossGiveUp: ['Eu me rendo! Eu me rendo!', 'I give up! I give up!'],
      bossAfter: ['Vocês não são do Silêncio? Mas vocês falam! Que coragem!', 'You’re not from the Hush? But you speak! How brave!'],
      psst: ['Psiu…', 'Psst…'],
      weak: ['Ponto fraco!', 'Weak spot!'],
      hard: ['Tá duro!', 'It’s hard!'],
      sneak: ['De surpresa!', 'Surprise attack!'],
      noverb: ['O que eu faço?', 'What do I do?'],
      which: ['Qual?', 'Which one?'],
      none: ['Onde?', 'Where?'],
      nopart: ['Cadê isso?', 'Where’s that?'],
      win: ['Ganhamos!', 'We won!'],
      lose: ['Ufa… precisamos descansar.', 'Phew… we need a rest.'],
      flee: ['Bora!', 'Let’s go!'],
    },
    sayEx: ex => [`Fala: «${ex}»`, `Say: “${ex}”`],
    coins: { one: 'moeda', many: 'moedas' },
    weakNow: p => [`Agora ${L.pt.parts[p].g === 'f' ? 'a' : 'o'} ${L.pt.parts[p].w} tá brilhando!`, `Now the ${L.pt.parts[p].en} is glowing!`],
    unknown: w => [`«${w}»?`, `doesn’t know “${w}” yet`],
    meet: k => {
      const s = L.pt.species[k], f = s.g === 'f', the = (f ? 'a' : 'o') + ' ' + s.w;
      if (k === 'colonel') return [`É ${s.name}, o chefe. Escreve «${the}».`, `It’s Colonel Cob, the leader. Type “${the}.”`];
      if (k === 'dummy') return [`Esse é o boneco de treino. Escreve «${the}».`, `This is the training dummy. Type “${the}.”`];
      return [`Olha! ${f ? 'Uma' : 'Um'} ${s.w}. Escreve «${the}».`, `Look! A ${s.en}. Type “${the}.”`];
    },
    // a color word, shown on one of them: «Esse grão é branco: «branco». Escreve «branco».»
    colorIs: (key, k) => { const s = L.pt.species[k], f = s.g === 'f', A = L.pt.adjs[key].forms[0]; return [`${f ? 'Essa' : 'Esse'} ${s.w} é ${f ? A.f : A.m}: «${A.m}». Escreve «${A.m}».`, `This ${s.en} is ${L.pt.adjs[key].en}: “${A.m}.” Type “${A.m}.”`]; },
    gloss: {
      oi: 'hi', eu: 'I', treino: 'train', parceiros: 'partners', como: 'like', primeiro: 'first', uma: 'a', um: 'a', 'ação': 'action',
      olha: 'look / watch', agora: 'now', 'você': 'you', escreve: 'type / write', muito: 'very', bem: 'good', ensina: 'teach', pra: 'to (para)',
      sem: 'without', olhar: 'looking', primeira: 'first', palavra: 'word', cuidado: 'careful', caladinho: 'hushling (little quiet one)', fala: 'tell / say',
      'o que': 'what', fazer: 'to do', presta: 'pay', 'atenção': 'attention', ele: 'it / he', grita: 'shouts', onde: 'where', vai: 'is going to',
      atacar: 'attack', outra: 'another', 'já': 'already', sabe: 'knows', duas: 'two', palavras: 'words', usa: 'use', as: 'the', ganhou: 'won',
      aprende: 'learns', 'rápido': 'fast', 'são': 'are', dois: 'two', caladinhos: 'hushlings', esse: 'this one', 'é': 'is', e: 'and', cor: 'color',
      dizer: 'say', 'em quem': 'at whom', sua: 'your', vez: 'turn', que: 'what a', pontaria: 'aim', eita: 'whoa', 'caladão': 'big hushling',
      enorme: 'huge', rabo: 'tail', dele: 'its', 'tá': 'is', brilhando: 'glowing', ponto: 'spot', fraco: 'weak', mudou: 'moved', de: 'of', lugar: 'place',
      'cabeça': 'head', conseguiu: 'you did it', acertou: 'you hit', no: 'em + o (on the)', na: 'em + a (on the)', do: 'de + o (of the)', casco: 'shell',
      pula: 'jump', bate: 'hit', joga: 'throw', vermelho: 'red', azul: 'blue', verde: 'green', amarelo: 'yellow', grande: 'big', pequeno: 'small',
      pedrinha: 'pebble', 'pedrão': 'big rock', respira: 'breathe', vamos: 'let’s go', novo: 'again (de novo)',
      mariposa: 'moth', mariposas: 'moths', besouro: 'beetle', besouros: 'beetles', asa: 'wing', asas: 'wings', nas: 'em + as (on the)',
      essa: 'that', letra: 'letter', nota: 'grade', perfeito: 'perfect', golpe: 'hit', fica: 'gets', mais: 'more', forte: 'strong',
      caiu: 'fell', 'alcanço': 'I reach', voltou: 'went back', voar: 'to fly', duro: 'hard', melhor: 'better', 'chão': 'ground',
      ela: 'it / she', vermelha: 'red (feminine)', brava: 'angry (feminine)', coitadinha: 'poor little thing',
      empurra: 'push', tatu: 'armadillo', tatus: 'armadillos', mas: 'but', 'dá': 'can (dá pra = you can)', virar: 'flip over', virou: 'flipped / turned into',
      barriga: 'belly', cima: 'up (para cima = upward)', para: 'to / toward', bolinha: 'little ball', tudo: 'all of it', come: 'eat', comer: 'eat',
      fome: 'hunger (com fome = hungry)', com: 'with', tem: 'there is / has', comida: 'food', bolsa: 'bag', nhac: 'munch', gostoso: 'tasty / yummy',
      'tô': 'I am (estou)', cheio: 'full', 'quê': 'what', 'não': 'not / no', isso: 'that', se: '(itself)', moedas: 'coins', moeda: 'coin',
      sapo: 'frog', sapos: 'frogs', esquerda: 'left', direita: 'right', meio: 'middle', iguais: 'the same', qual: 'which (one)', ou: 'or',
      pulam: 'they hop', folha: 'leaf (lily pad)', depois: 'after', cada: 'every', turno: 'turn', antes: 'before', falar: 'speaking',
      trocaram: 'they swapped', croac: 'ribbit', peixe: 'fish', da: 'de + a (of the)', 'está': 'is',
      boneco: 'dummy', bonecos: 'dummies', treinar: 'train', 'ações': 'actions', muda: 'change', toda: 'every (toda vez)', 'cachecóis': 'scarves',
      esses: 'these', junto: 'together', cores: 'colors', lugares: 'places', vezes: 'times (às vezes = sometimes)', gira: 'spins', desvia: 'dodge',
      setas: 'arrows', quase: 'almost', opa: 'oops', rodada: 'round', novos: 'new', todos: 'all', excelente: 'excellent', bom: 'good', volta: 'come back',
      quando: 'when', quiser: 'you want', 'grão': 'kernel (grain)', 'grãos': 'kernels', pipoca: 'popcorn', pipocas: 'popcorn (pieces)', coronel: 'colonel',
      espiga: 'ear of corn', chefe: 'leader / boss', alto: 'halt', 'silêncio': 'silence', 'vocês': 'you (all)', aqui: 'here', entra: 'gets in',
      soldados: 'soldiers', forma: 'formation (em forma = fall in)', 'rá': 'ha', minha: 'my', capa: 'cape', chega: 'enough', luto: 'I fight', ai: 'ow',
      medalha: 'medal', 'proteção': 'cover', fogo: 'fire', quente: 'hot', me: 'myself', rendo: 'give up (eu me rendo = I give up)', falam: 'you speak',
      coragem: 'courage', branco: 'white', branca: 'white (feminine)', psiu: 'psst',
    },
  };

  // ================================================================ German (standard)
  L.de = {
    code: 'de', name: 'Deutsch', variety: 'Standard German',
    // gen: the genitive form (des Käfers, der Motte)
    species: {
      hushling: { w: 'Schweigling', pl: 'Schweiglinge', gen: 'Schweiglings', g: 'm', en: 'hushling' },
      hushbig: { w: 'Riesenschweigling', pl: 'Riesenschweiglinge', gen: 'Riesenschweiglings', g: 'm', en: 'giant hushling' },
      moth: { w: 'Motte', pl: 'Motten', gen: 'Motte', g: 'f', en: 'moth' },
      beetle: { w: 'Käfer', pl: 'Käfer', gen: 'Käfers', g: 'm', en: 'beetle' },
      // a das-word (neuter): das / das / dem / des · ein / ein / einem / eines · das rote, ein rotes, dem roten
      armadillo: { w: 'Gürteltier', pl: 'Gürteltiere', gen: 'Gürteltiers', g: 'n', en: 'armadillo' },
      frog: { w: 'Frosch', pl: 'Frösche', gen: 'Frosches', g: 'm', en: 'frog' },
      // Bruno's training dummies (a die-word); the Corn Society: das Korn (a das-word, like das Popcorn it pops
      // into), and Oberst Kolben (a Maiskolben is a corn cob). «der Oberst» also goes «den Obersten» (both are fine)
      dummy: { w: 'Puppe', pl: 'Puppen', gen: 'Puppe', g: 'f', en: 'dummy' },
      kernel: { w: 'Korn', pl: 'Körner', gen: 'Korns', g: 'n', en: 'kernel' },
      popcorn: { w: 'Popcorn', pl: 'Popcorns', gen: 'Popcorns', g: 'n', en: 'popcorn' },
      colonel: { w: 'Oberst', pl: 'Obersten', gen: 'Obersten', g: 'm', en: 'colonel', name: 'Oberst Kolben' },
    },
    // where one stands in the row, as you see it: an adjective with the usual endings («den linken Frosch»,
    // «die mittlere Motte», «den Rechten»), or after the noun («den Frosch links / in der Mitte / rechts»).
    // w: the word Mimo learns; stem: the adjective; adv: the word after the noun
    positions: {
      left: { w: 'links', stem: 'link', adv: 'links', en: 'left' },
      middle: { w: 'Mitte', stem: 'mittler', adv: 'in der Mitte', en: 'middle' },
      right: { w: 'rechts', stem: 'recht', adv: 'rechts', en: 'right' },
    },
    parts: {
      head: { w: 'Kopf', g: 'm', en: 'head' },
      tail: { w: 'Schwanz', g: 'm', en: 'tail' },
      shell: { w: 'Panzer', g: 'm', en: 'shell' },
      wing: { w: 'Flügel', pl: 'Flügel', g: 'm', en: 'wing' },   // one wing «den Flügel», both «die Flügel»
    },
    stone: { w: 'Stein', g: 'm', en: 'stone' },
    // German adjectives are stems; the ending (-e, -en…) depends on case and gender
    adjs: {
      red: { stem: 'rot', en: 'red' },
      blue: { stem: 'blau', en: 'blue' },
      green: { stem: 'grün', en: 'green' },
      yellow: { stem: 'gelb', en: 'yellow' },
      white: { stem: 'weiß', en: 'white' },
      big: { stem: 'groß', en: 'big' },
      small: { stem: 'klein', en: 'small' },
    },
    verbs: {
      jump: { show: 'spring', forms: ['spring', 'springe', 'hüpf', 'hüpfe'], en: 'jump' },
      hit: { show: 'schlag', forms: ['schlag', 'schlage', 'hau', 'haue'], en: 'hit' },
      // a separable verb: the particle has to land at the very end
      greif: { show: 'greif', forms: ['greif', 'greife'], en: 'attack (greif … an)', particle: 'an', as: 'attack' },
      // push and eat take the accusative straight: «Schieb das Gürteltier!», «Iss den Apfel!»
      push: { show: 'schieb', forms: ['schieb', 'schiebe', 'stoß', 'stoße', 'schubs', 'schubse'], en: 'push' },
      // (the old spelling «iß» matches «iss» anyway, with an accent note)
      eat: { show: 'iss', forms: ['iss', 'friss'], en: 'eat' },
    },
    // every reading of each article, as case-gender (m, f, n, pl): «der» is the masculine nominative,
    // but also the feminine dative and genitive (der roten Motte). indef: an ein-word, so the adjective
    // after it takes the mixed endings (ein roter Käfer, ein rotes Gürteltier, einen roten Käfer)
    arts: {
      der: { r: ['nom-m', 'dat-f', 'gen-f', 'gen-pl'] }, die: { r: ['nom-f', 'acc-f', 'nom-pl', 'acc-pl'] }, das: { r: ['nom-n', 'acc-n'] },
      den: { r: ['acc-m', 'dat-pl'] }, dem: { r: ['dat-m', 'dat-n'] }, des: { r: ['gen-m', 'gen-n'] },
      ein: { r: ['nom-m', 'nom-n', 'acc-n'], indef: 1 }, eine: { r: ['nom-f', 'acc-f'], indef: 1 }, einen: { r: ['acc-m'], indef: 1 }, einem: { r: ['dat-m', 'dat-n'], indef: 1 },
      einer: { r: ['dat-f', 'gen-f'], indef: 1 }, eines: { r: ['gen-m', 'gen-n'], indef: 1 },
      sein: { r: ['nom-m', 'nom-n'], poss: 1, indef: 1 }, seinen: { r: ['acc-m', 'dat-pl'], poss: 1, indef: 1 }, seine: { r: ['nom-f', 'acc-f', 'acc-pl'], poss: 1, indef: 1 },
      ihren: { r: ['acc-m', 'dat-pl'], poss: 1, indef: 1 }, ihre: { r: ['nom-f', 'acc-f', 'acc-pl'], poss: 1, indef: 1 },
    },
    prons: { ihm: 'dat', ihr: 'dat' },
    preps: ['auf', 'gegen', 'mit', 'von', 'vom'],
    adverbs: ['jetzt', 'sofort', 'schnell', 'kräftig', 'fest', 'gleich', 'nochmal', 'richtig', 'ganz'],
    conj: [['und', 'dann'], ['dann'], ['und']],
    joiner: 'und dann',
    voc: ['mimo', 'hey', 'he'],
    // «weg» and «um» ride along with push: «Schieb es weg!», «Stoß das Gürteltier um!»
    fillers: ['bitte', 'mal', 'doch', 'los', 'weg', 'um'],
    talk: [
      { id: 'nofight', p: ['wir wollen nicht kämpfen', 'wir wollen nicht streiten', 'ich will nicht kämpfen', 'wir kämpfen nicht', 'kein kampf'] },
      { id: 'friends', p: ['wir sind freunde', 'wir sind deine freunde', 'lass uns freunde sein', 'ich bin dein freund', 'ich bin deine freundin'] },
      { id: 'calm', p: ['keine angst', 'hab keine angst', 'ganz ruhig', 'ruhig', 'beruhig dich'] },
      { id: 'nohurt', p: ['wir tun dir nichts', 'wir tun dir nicht weh'] },
    ],
    autoTalk: ['Keine Angst, wir wollen nicht kämpfen.', 'Wir sind Freunde.', 'Wir tun dir nichts.'],
    shout(tier, toMimo, high) {
      if (tier <= 1) return high ? ['Von oben!', 'From above!'] : ['Von unten!', 'From below!'];
      if (tier === 2) return toMimo
        ? [`Ich krieg das Langohr … ${high ? 'von oben' : 'von unten'}!`, `I’ll get long-ears… ${high ? 'from above' : 'from below'}!`]
        : [`Ich krieg dich … ${high ? 'von oben' : 'von unten'}!`, `I’ll get you… ${high ? 'from above' : 'from below'}!`];
      const spot = high ? 'auf den Kopf' : 'auf die Füße', en = high ? 'on the head' : 'on the feet';
      return toMimo ? [`Langohr, ich hau dir ${spot}!`, `Long-ears, I’ll whack you ${en}!`] : [`Ich hau dir ${spot}!`, `I’ll whack you ${en}!`];
    },
    dodgeWords: tier => (tier >= 3 ? { high: 'Kopf', low: 'Füße' } : { high: 'von oben', low: 'von unten' }),
    labels: { floating: 'schwebt', shy: 'schüchtern', weak: 'Schwachpunkt', calm: 'ruhig', down: 'am Boden', back: 'auf dem Rücken', capeShut: 'Umhang zu', capeOpen: 'Umhang offen' },
    labelsF: {},
    examples: { 1: 'Spring!', 2: 'Spring auf den Roten!', 3: 'Schlag auf den Schwanz!' },
    frames: {
      verb: { text: 'Spring! · Schlag!', pat: 'verb' },
      jumpT: { text: 'Spring auf den ___!', pat: 'jump+target' },
      hitT: { text: 'Schlag den ___!', pat: 'hit+target' },
      partT: { text: 'Schlag auf den ___!', pat: 'part' },
      bracket: { text: 'Greif ___ an!', pat: 'separable' },
      talk: { text: 'Wir wollen nicht kämpfen · Wir sind Freunde', pat: 'talk' },
      mothT: { text: 'Spring auf die ___ Motte!', pat: 'jump+target' },
      wingT: { text: 'Schlag auf die Flügel!', pat: 'part' },
      beetleT: { text: 'Schlag dem Käfer auf den Kopf!', pat: 'part' },
      pushT: { text: 'Schieb das ___ Gürteltier!', pat: 'push+target' },
      frogT: { text: 'Spring auf den ___ Frosch!', pat: 'jump+target' },
      posT: { text: 'den linken · mittleren · rechten ___ · ___ links · in der Mitte · rechts', pat: 'position' },
      dummyT: { text: 'Schlag die ___ Puppe!', pat: 'hit+target' },
      kernelT: { text: 'Schlag das ___ Korn!', pat: 'hit+target' },
      popT: { text: 'Spring auf das ___ Popcorn!', pat: 'jump+target' },
      bossT: { text: 'Schlag den Oberst!', pat: 'hit+target' },
    },
    tips: {
      target: 'Describe who: for the one you act on, «der» becomes «den» and the adjective gets -en: «Schlag den Roten!», «Spring auf den Blauen!».',
      boss: 'His husk cape is closed: hits just bounce off. Beat his soldiers first («Schlag das gelbe Korn!», a das-word: «das» stays «das»); then he opens the cape to attack, and that’s when you hit him: «Schlag den Oberst!».',
      popcorn: 'The floor is hot: the kernels popped! «das Korn» is now «das Popcorn», still a das-word: «Schlag das rote Popcorn!», «Spring auf das Weiße!». They hop to new spots every turn.',
      position: 'They look the same? Say where it is, as you see it: «den linken / mittleren / rechten Frosch» (an adjective, with the usual ending) or «den Frosch links / in der Mitte / rechts»: «{ex}».',
      frog: 'Frogs hop to another lily pad after every turn, so «der linke Frosch» may be a different frog next time. Look before you speak!',
      parts: 'Name the part: «Schlag auf den Schwanz!», «Spring auf den Kopf!». Whose? «Spring dem Roten auf den Kopf!» Careful: «auf den» = onto (motion), «auf dem» = on (staying there).',
      shy: 'This one is shy. Talk instead of fighting: «Wir wollen nicht kämpfen», «Wir sind Freunde».',
      twist: 'Separable verbs: «angreifen» → «Greif … an!». Everything in between (den großen Roten, jetzt, mit dem Stein) charges the attack. Without «an», «greif» just means «grab».',
      moth: 'Moths float: «schlag» can’t reach them, «spring» can. «die Motte» is feminine, so it stays «die» and the adjective ends in -e: «Spring auf die rote Motte!». Hit the wings to knock one down: «Schlag auf die Flügel!».',
      beetle: 'Beetles have a hard shell (½ damage). Aim for the head: «Schlag dem Käfer auf den Kopf!» («der Käfer» → «dem Käfer» for whose head).',
      armadillo: '«das Gürteltier» is a das-word (neuter): it stays «das» when you push it: «Schieb das rote Gürteltier!» It rolls up into a hard ball (⅓ damage); pushed over, it lies on its back for one turn: it can’t attack, and its belly takes ×2.',
      eat: 'Hungry? Feed {name} from the bag: «Iss den Apfel!» (der Apfel → den Apfel), «Iss das Brot!». It heals ♥, and it takes your turn.',
    },
    // why a slip is a slip, for the review after a battle (keys are the parser's error kinds)
    why: {
      spelling: 'Spelling: a letter was off. Compare the two lines: what changed is underlined.',
      accent: 'Umlauts: German writes «ä, ö, ü» and «ß», like «Schwänze» and «groß». Typing without them still works, but this is how they look.',
      gender: 'Gender: German nouns are der, die or das, and the article and adjective follow it: «der Käfer» → «Schlag den blauen Käfer!», «die Motte» → «Schlag die rote Motte!», «das Gürteltier» → «Schieb das rote Gürteltier!» (with «ein»: «ein rotes Gürteltier»).',
      article: 'German needs an article before the noun here: «den Roten», «den Kopf», «die Motte», «das Gürteltier», «den Apfel». (Food in general can go without one: «Iss Brot!»)',
      case: 'Case: the one you act on is in the accusative: «der» becomes «den» («Schlag den Käfer!», «Iss den Apfel!»), but «die» stays «die» («Schlag die Motte!») and «das» stays «das» («Schieb das Gürteltier!»). «dem» is the dative, for whose: «Schlag dem Gürteltier auf den Kopf!». After «auf»: «auf den / auf die» = onto (landing on it), «auf dem / auf der» = on (staying there), so «Spring auf den Kopf!».',
      ending: 'Adjective endings: after «den» the adjective ends in -en («den blauen Käfer»); after «die» or «das» for one thing it ends in -e («die rote Motte», «das rote Gürteltier»); after «ein» for a das-word, -es («ein rotes Gürteltier»); after «dem», «der» or «des» (whose) it ends in -en («dem roten Gürteltier», «der roten Motte»).',
      prep: '«Spring» needs where you land, with «auf»: «Spring auf den Roten!», «Spring auf die Motte!». «Schieb» and «Iss» take it straight: «Schieb das Gürteltier!», «Iss den Apfel!».',
      style: 'Almost: it’s usually said with «auf»: «Schlag auf den Kopf!».',
      particle: 'Separable verbs: «angreifen» splits into «Greif … an!». «Greif» comes first and «an» goes at the very end: «Greif den Roten an!». Without «an», «greif» just means «grab».',
      possessive: 'Whose part? The owner goes in the dative: «Spring dem Roten auf den Kopf!», «Schlag der roten Motte auf die Flügel!».',
      none: 'Mimo couldn’t tell which one you meant. Check the colors and sizes on their labels, and the ending: the one you act on is «den Roten» (a der-word), «die Rote» (die Motte) or «das Rote» (das Gürteltier).',
      position: 'Where it is: positions are as you see them on the screen. As an adjective they take the usual endings: «den linken Frosch», «die mittlere Motte», «das rechte Gürteltier», «den Linken». After the noun: «den Frosch links», «in der Mitte», «rechts» («in der Mitte» is where something is, so it’s dative: not «in die Mitte», which means into the middle). Frogs hop to another lily pad after every turn, so look again before you say where one is.',
      which: 'Which one? When two or more look the same (same kind, same color), say where the one you mean is: «den linken Frosch», «den Frosch in der Mitte», «den rechten Schweigling».',
    },
    t: {
      hello: ['Hallo! Ich trainiere Partner wie {name}.', 'Hi! I train partners like {name}.'],
      watchJump: ['Zuerst eine Aktion. Schau: Spring!', 'First, an action. Watch: jump!'],
      echoJump: ['„Spring“. Jetzt du: Schreib „spring“.', '“Spring.” Now you: type “spring.”'],
      teach: ['Sehr gut! Jetzt bring es {name} bei, ohne hinzuschauen.', 'Very good! Now teach it to {name}, no peeking.'],
      firstWord: ['Das erste Wort!', 'The first word!'],
      foeIn: ['Vorsicht! Ein Schweigling. Sag {name}, was zu tun ist.', 'Careful! A hushling. Tell {name} what to do.'],
      listen: ['Hör gut zu! Er ruft, wo er angreift.', 'Listen closely! It shouts where it will attack.'],
      newHit: ['Noch ein Wort! Schau: Schlag!', 'Another word! Watch: hit!'],
      echoHit: ['„Schlag“. Schreib „schlag“.', '“Schlag.” Type “schlag.”'],
      twoWords: ['{name} kennt jetzt zwei Wörter! Benutz beide.', '{name} knows two words now! Use both.'],
      winVerbs: ['Gewonnen! {name} lernt schnell.', 'You won! {name} learns fast.'],
      twoFoes: ['Jetzt sind es zwei Schweiglinge. Der hier ist rot …', 'Now there are two hushlings. This one is red…'],
      twoFoesB: ['… und der hier ist blau.', '…and this one is blue.'],
      echoRed: ['„Rot“. Schreib „rot“.', '“Rot.” Type “rot.”'],
      echoBlue: ['„Blau“. Schreib „blau“.', '“Blau.” Type “blau.”'],
      teachColor: ['Jetzt bring {name} die Farbe bei.', 'Now teach {name} the color.'],
      sayWho: ['So sagst du, wen: „Spring auf den Roten!“', 'This is how you say who: “Spring auf den Roten!”'],
      yourTurn: ['Du bist dran!', 'Your turn!'],
      winTargets: ['Super gezielt!', 'Great aim!'],
      bigOne: ['Uff, ein Riesenschweigling! Der ist riesig.', 'Whoa, a giant hushling! It’s huge.'],
      lookTail: ['Schau dir seinen Schwanz an. Er leuchtet! Das ist sein Schwachpunkt.', 'Look at its tail. It’s glowing! That’s its weak spot.'],
      echoTail: ['„Schwanz“. Schreib „Schwanz“.', '“Schwanz.” Type “Schwanz.”'],
      teachWord: ['Jetzt bring {name} das Wort bei.', 'Now teach {name} the word.'],
      sayPart: ['Sag: „Schlag auf den Schwanz!“', 'Say: “Schlag auf den Schwanz!”'],
      weakMoves: ['Achtung! Der Schwachpunkt wandert.', 'Careful! The weak spot moves.'],
      lookHead: ['Jetzt leuchtet sein Kopf. „Kopf“. Schreib „Kopf“.', 'Now its head is glowing. “Kopf.” Type “Kopf.”'],
      winParts: ['Geschafft! Genau auf den Schwachpunkt.', 'Done! Right on the weak spot.'],
      retry: ['Autsch! Durchatmen. Noch mal.', 'Ouch! Breathe. Again.'],
      catchOn: ['Den Trick kenn ich schon!', 'I already know that trick!'],
      shyReally: ['Wirklich …?', 'Really…?'],
      shyJoin: ['Freunde? Freunde!', 'Friends? Friends!'],
      shyVoice: ['Ha… hallo!', 'H… hello!'],
      shyAgain: ['…', '…'],
      shyScared: ['Au! Hilfe!', 'Ow! Help!'],
      poorShy: ['Der arme Kleine …', 'The poor little thing…'],
      poorShyF: ['Die arme Kleine …', 'The poor little thing…'],
      floating: ['Er schwebt! Spring lieber!', 'It’s floating! Better jump!'],
      floatingF: ['Sie schwebt! Spring lieber!', 'It’s floating! Better jump!'],
      nowAngry: ['Jetzt ist er wütend!', 'Now it’s angry!'],
      nowAngryF: ['Jetzt ist sie wütend!', 'Now it’s angry!'],
      sleepAgain: ['Er ist wieder eingeschlafen.', 'It fell asleep again.'],
      sleepAgainF: ['Sie ist wieder eingeschlafen.', 'It fell asleep again.'],
      mothDown: ['Sie ist abgestürzt! Jetzt komm ich ran!', 'It crashed down! Now I can reach it!'],
      mothUp: ['Sie fliegt wieder!', 'It’s flying again!'],
      shellHard: ['So ein harter Panzer! Lieber auf den Kopf!', 'Such a hard shell! Better the head!'],
      gradeIntro: ['Der Buchstabe ist deine Note! S ist perfekt: Der Schlag wird stärker.', 'That letter is your grade! S is perfect: the hit gets stronger.'],
      // lines about a das-word (the armadillo) use «es»
      nowAngryN: ['Jetzt ist es wütend!', 'Now it’s angry!'],
      sleepAgainN: ['Es ist wieder eingeschlafen.', 'It fell asleep again.'],
      poorShyN: ['Das arme Kleine …', 'The poor little thing…'],
      // the armadillo, and the verb that flips it
      watchPush: ['So ein harter Panzer! Aber du kannst es umdrehen. Schau: Schieb!', 'Such a hard shell! But you can flip it over. Watch: push!'],
      echoPush: ['„Schieb“. Schreib „schieb“.', '“Schieb.” Type “schieb.”'],
      curledHard: ['Eine harte Kugel! Erst schieben!', 'A hard ball! Push it first!'],
      flipped: ['Es liegt auf dem Rücken! Jetzt auf den Bauch!', 'It’s lying on its back! Now go for the belly!'],
      rollBack: ['Es hat sich wieder eingerollt!', 'It rolled itself up again!'],
      pushWhole: ['Das ganze Tier?', 'The whole creature?'],
      // food from the bag
      hungry: ['{name} hat Hunger! In der Tasche ist Essen. Schau: Iss!', '{name} is hungry! There’s food in the bag. Watch: eat!'],
      echoEat: ['„Iss“. Schreib „iss“.', '“Iss.” Type “iss.”'],
      munch: ['Mampf, mampf!', 'Munch, munch!'],
      yum: ['Lecker!', 'Yummy!'],
      full: ['Ich bin satt!', 'I’m full!'],
      eatWhat: ['Was soll ich essen?', 'What should I eat?'],
      noFood: ['Haben wir nicht!', 'We don’t have any!'],
      notFood: ['Das kann man nicht essen!', 'You can’t eat that!'],
      // where they are: the Coach teaches links / Mitte / rechts when two or more look the same
      posIntro: ['Die sehen gleich aus! {name} kann sie nicht unterscheiden. Sag, wo: links, in der Mitte oder rechts.', 'They look the same! {name} can’t tell them apart. Say where: on the left, in the middle or on the right.'],
      posIntro2: ['Die sehen gleich aus! {name} kann sie nicht unterscheiden. Sag, wo: links oder rechts.', 'They look the same! {name} can’t tell them apart. Say where: on the left or on the right.'],
      posLeft: ['Links: „links“. Schreib „links“.', 'On the left: “links.” Type “links.”'],
      posMiddle: ['In der Mitte: „Mitte“. Schreib „Mitte“.', 'In the middle: “Mitte.” Type “Mitte.”'],
      posRight: ['Rechts: „rechts“. Schreib „rechts“.', 'On the right: “rechts.” Type “rechts.”'],
      frogsHop: ['Achtung! Frösche hüpfen nach jedem Zug von Blatt zu Blatt. Schau genau hin, bevor du etwas sagst.', 'Careful! Frogs hop from pad to pad after every turn. Look closely before you say anything.'],
      swapped: ['Sie haben die Plätze getauscht!', 'They switched places!'],
      // «Welcher?» for a der-word, «Welche?» for a die-word, «Welches?» for a das-word
      whichOne: ['Welcher?', 'Which one?'],
      whichOneF: ['Welche?', 'Which one?'],
      whichOneN: ['Welches?', 'Which one?'],
      croak: ['Quak!', 'Ribbit!'],
      // practice in Bruno's yard (no stakes: the dummies swing, but a miss costs nothing)
      pHello: ['Hallo! Wir trainieren mit den Puppen.', 'Hi! We’re training with the dummies.'],
      pVerbs: ['Zuerst die Aktionen: spring, schlag … Nimm jedes Mal eine andere!', 'First, the actions: jump, hit… Use a different one every time!'],
      pColors: ['Schau die Schals an: Jede Puppe hat eine Farbe. Sag, welche: „die Rote“, „die Blaue“.', 'Look at the scarves: each dummy has a color. Say which one: “die Rote”, “die Blaue.”'],
      pPositions: ['Die sehen gleich aus. Sag, wo: links, in der Mitte oder rechts.', 'These look the same. Say where: on the left, in the middle or on the right.'],
      pMixed: ['Jetzt alles zusammen: Aktionen, Farben und Orte.', 'Now everything together: actions, colors and places.'],
      pDodge: ['Und Achtung! Manchmal dreht sich eine Puppe. Weich mit den Pfeilen aus.', 'And careful! Sometimes a dummy spins. Dodge with the arrows.'],
      pGreat: ['Perfekt!', 'Perfect!'],
      pGood: ['Sehr gut!', 'Very good!'],
      pFix: ['Fast! Noch mal.', 'Almost! Again.'],
      pMissed: ['Hoppla! Macht nichts: Es ist nur Training.', 'Oops! No harm done: it’s only practice.'],
      pRound: ['Noch eine Runde! Neue Puppen.', 'Another round! New dummies.'],
      pWin: ['Alle am Boden! Ausgezeichnet!', 'All down! Excellent!'],
      pDone: ['Gutes Training! Komm wieder, wann du willst.', 'Good training! Come back any time.'],
      // the Corn Society: its leader thinks you're the Hush's spies, until you speak up
      bossIntro: ['Halt! Stehen bleiben! Ihr kommt von der Stille!', 'Halt! Freeze! You’re from the Hush!'],     // (the Hush is «die Stille», as in lines.js)
      bossName: ['Ich bin Oberst Kolben! Hier kommt die Stille nicht rein!', 'I’m Colonel Cob! The Hush doesn’t get in here!'],
      bossCall: ['Soldaten, antreten!', 'Soldiers, fall in!'],
      bossBounce: ['Ha! Mein Umhang ist sehr hart!', 'Ha! My cape is very hard!'],
      bossOpen: ['Genug! Jetzt kämpfe ich!', 'Enough! Now I fight!'],
      bossHurt: ['Au, meine Medaille!', 'Ow, my medal!'],
      bossClose: ['In Deckung! Mehr Soldaten!', 'Take cover! More soldiers!'],
      bossHeat: ['Feuer! Der Boden ist sehr heiß!', 'Fire! The floor is very hot!'],
      pop: ['Plopp!', 'Pop!'],
      bossGiveUp: ['Ich gebe auf! Ich gebe auf!', 'I give up! I give up!'],
      bossAfter: ['Ihr kommt nicht von der Stille? Aber ihr sprecht! Wie mutig!', 'You’re not from the Hush? But you speak! How brave!'],
      psst: ['Pst …', 'Psst…'],
      grab: ['Ohne „an“ greift {name} nur zu!', 'Without “an”, {name} just grabs!'],
      weak: ['Schwachpunkt!', 'Weak spot!'],
      hard: ['Zu hart!', 'Too hard!'],
      sneak: ['Überraschung!', 'Surprise attack!'],
      noverb: ['Was soll ich tun?', 'What should I do?'],
      which: ['Welchen denn?', 'Which one?'],
      none: ['Wo denn?', 'Where?'],
      nopart: ['Wo ist das?', 'Where’s that?'],
      win: ['Gewonnen!', 'We won!'],
      lose: ['Puh … wir brauchen eine Pause.', 'Phew… we need a break.'],
      flee: ['Nichts wie weg!', 'Let’s get out of here!'],
    },
    sayEx: ex => [`Sag: „${ex}“`, `Say: “${ex}”`],
    coins: { one: 'Münze', many: 'Münzen' },
    weakNow: p => [`Jetzt leuchtet der ${L.de.parts[p].w}!`, `Now the ${L.de.parts[p].en} is glowing!`],
    unknown: w => [`„${w}“?`, `doesn’t know “${w}” yet`],
    meet: k => {
      const s = L.de.species[k], f = s.g === 'f', the = (f ? 'die' : s.g === 'n' ? 'das' : 'der') + ' ' + s.w;
      if (k === 'colonel') return [`Das ist ${s.name}, der Chef. Schreib „${the}“.`, `That’s Colonel Cob, the leader. Type “${the}.”`];
      if (k === 'dummy') return [`Das ist die Trainingspuppe. Schreib „${the}“.`, `This is the training dummy. Type “${the}.”`];
      return [`Schau! ${f ? 'Eine' : 'Ein'} ${s.w}. Schreib „${the}“.`, `Look! A ${s.en}. Type “${the}.”`];
    },
    // a color word, shown on one of them: «Dieses Korn ist weiß: „weiß“. Schreib „weiß“.» (no ending after «ist»)
    colorIs: (key, k) => { const s = L.de.species[k], w = L.de.adjs[key].stem, dem = s.g === 'f' ? 'Diese' : s.g === 'n' ? 'Dieses' : 'Dieser'; return [`${dem} ${s.w} ist ${w}: „${w}“. Schreib „${w}“.`, `This ${s.en} is ${L.de.adjs[key].en}: “${w}.” Type “${w}.”`]; },
    gloss: {
      hallo: 'hi', ich: 'I', trainiere: 'train', partner: 'partners', wie: 'like', zuerst: 'first', eine: 'a', ein: 'a', aktion: 'action',
      schau: 'look / watch', jetzt: 'now', du: 'you', schreib: 'type / write', sehr: 'very', gut: 'good', bring: 'bring (bring … bei = teach)',
      es: 'it', bei: '(bring … bei = teach)', ohne: 'without', hinzuschauen: 'looking', das: 'the', erste: 'first', wort: 'word', vorsicht: 'careful',
      schweigling: 'hushling (little silent one)', sag: 'tell / say', was: 'what', zu: 'to', tun: 'do', ist: 'is', 'hör': 'listen', er: 'it / he',
      ruft: 'shouts', wo: 'where', angreift: 'attacks', noch: 'another / still', kennt: 'knows', zwei: 'two', 'wörter': 'words', benutz: 'use',
      beide: 'both', gewonnen: 'won', lernt: 'learns', schnell: 'fast', sind: 'are', schweiglinge: 'hushlings', der: 'the (this one)', hier: 'here',
      und: 'and', farbe: 'color', so: 'this is how', sagst: 'you say', wen: 'whom', bist: 'are', dran: '(du bist dran = your turn)', super: 'great',
      gezielt: 'aimed', uff: 'whoa', riesenschweigling: 'giant hushling', riesig: 'huge', dir: '(yourself)', seinen: 'its', schwanz: 'tail',
      an: '(schau … an = look at)', leuchtet: 'glows', sein: 'its', schwachpunkt: 'weak spot', achtung: 'careful', wandert: 'moves around',
      kopf: 'head', geschafft: 'done it', genau: 'exactly', auf: 'onto', den: 'the (accusative)', dem: 'the (dative)', panzer: 'shell',
      spring: 'jump', schlag: 'hit', greif: 'grab (greif … an = attack)', rot: 'red', blau: 'blue', 'grün': 'green', gelb: 'yellow', 'groß': 'big',
      klein: 'small', autsch: 'ouch', durchatmen: 'breathe', mal: 'time (noch mal = again)',
      motte: 'moth', motten: 'moths', 'käfer': 'beetle(s)', 'flügel': 'wing(s)', die: 'the (feminine)', sie: 'it / she',
      buchstabe: 'letter', deine: 'your', note: 'grade', perfekt: 'perfect', wird: 'gets', 'stärker': 'stronger',
      'abgestürzt': 'crashed down', komm: 'come', ran: 'close (rankommen = reach)', fliegt: 'flies', wieder: 'again',
      harter: 'hard', lieber: 'rather / better', boden: 'ground', am: 'on the', arme: 'poor', kleine: 'little one',
      schieb: 'push', 'gürteltier': 'armadillo', 'gürteltiere': 'armadillos', aber: 'but', kannst: 'can (you)', umdrehen: 'flip over',
      kugel: 'ball', erst: 'first', schieben: 'push', liegt: 'lies', 'rücken': 'back', bauch: 'belly', sich: 'itself', eingerollt: 'rolled up',
      hat: 'has', ganze: 'whole', tier: 'animal / creature', iss: 'eat', essen: 'food / to eat', hunger: 'hunger (Hunger haben = be hungry)',
      in: 'in', tasche: 'bag', mampf: 'munch', lecker: 'yummy', bin: 'am', satt: 'full', soll: 'should', man: 'one / you', kann: 'can',
      nicht: 'not', haben: 'have', wir: 'we', 'münzen': 'coins', 'münze': 'coin',
      frosch: 'frog', 'frösche': 'frogs', links: 'on the left', rechts: 'on the right', mitte: 'middle', gleich: 'the same', aus: '(sehen … aus = look)',
      sehen: 'look', unterscheiden: 'tell apart', oder: 'or', 'hüpfen': 'hop', nach: 'after', jedem: 'every', zug: 'turn', von: 'from',
      blatt: 'leaf (lily pad)', hin: '(schau hin = look)', bevor: 'before', etwas: 'something', 'plätze': 'places', getauscht: 'swapped',
      welcher: 'which (one)', welche: 'which (one)', welches: 'which (one)', quak: 'ribbit', fisch: 'fish',
      trainieren: 'train', puppe: 'dummy', puppen: 'dummies', trainingspuppe: 'training dummy', aktionen: 'actions', nimm: 'take / use', jedes: 'every',
      andere: 'another', schals: 'scarves', jede: 'each', zusammen: 'together', alles: 'everything', farben: 'colors', orte: 'places', manchmal: 'sometimes',
      dreht: 'turns (sich drehen = spin)', weich: 'dodge (ausweichen)', pfeilen: 'arrows', mit: 'with', fast: 'almost', hoppla: 'oops', macht: 'makes (macht nichts = no harm)',
      nichts: 'nothing', nur: 'only', training: 'training', runde: 'round', neue: 'new', alle: 'all', ausgezeichnet: 'excellent', gutes: 'good', wann: 'when',
      willst: 'you want', halt: 'halt', ruhe: 'quiet', ihr: 'you (all)', seid: 'are', vom: 'from the', oberst: 'colonel', kolben: 'cob (Maiskolben)', kommt: 'comes',
      rein: 'in', soldaten: 'soldiers', antreten: 'fall in', ha: 'ha', mein: 'my', umhang: 'cape', hart: 'hard', genug: 'enough', 'kämpfe': 'I fight', au: 'ow',
      meine: 'my', medaille: 'medal', deckung: 'cover (in Deckung = take cover)', mehr: 'more', feuer: 'fire', 'heiß': 'hot', plopp: 'pop', gebe: 'give (ich gebe auf = I give up)',
      sprecht: 'you speak', mutig: 'brave', korn: 'kernel (grain)', 'körner': 'kernels', popcorn: 'popcorn', 'weiß': 'white', chef: 'leader / boss', pst: 'psst',
    },
  };

  _.LANGS = L;

  // ================================================================ items for the language engine (LEX)
  // Same shape as lang/words.js: { id, es, pt, de, en, g, icon }. The world may teach some of these
  // words as w.<key>; battle code treats w.red and a.red as the same word (see knows() in flow.js).
  const N = (id, es, pt, de, en, g, icon) => ({ id, es, pt, de, en, g, icon: icon || id.split('.')[1], battle: true });
  _.ITEMS = [
    N('v.jump', 'salta', 'pula', 'spring', 'jump', null, 'jump'),
    N('v.hit', 'golpea', 'bate', 'schlag', 'hit', null, 'hit'),
    N('v.throw', 'lanza', 'joga', 'wirf', 'throw', null, 'throw'),
    N('v.attack', 'ataca', 'ataca', 'greif … an', 'attack', null, 'attack'),
    // Chapter 1: push (the overworld teaches it on the road to Molinar; a fight teaches it if not) and eat
    N('v.push', 'empuja', 'empurra', 'schieb', 'push', null, 'push'),
    N('v.eat', 'come', 'come', 'iss', 'eat', null, 'eat'),
    N('a.red', 'rojo', 'vermelho', 'rot', 'red'), N('a.blue', 'azul', 'azul', 'blau', 'blue'),
    N('a.green', 'verde', 'verde', 'grün', 'green'), N('a.yellow', 'amarillo', 'amarelo', 'gelb', 'yellow'),
    N('a.big', 'grande', 'grande', 'groß', 'big'), N('a.small', 'pequeño', 'pequeno', 'klein', 'small'),
    N('a.asleep', 'dormido', 'dormindo', 'schlafend', 'asleep'), N('a.angry', 'enojado', 'bravo', 'wütend', 'angry'),
    N('n.hushling', 'calladito', 'caladinho', 'Schweigling', 'hushling', { es: 'm', pt: 'm', de: 'm' }),
    N('n.hushbig', 'calladón', 'caladão', 'Riesenschweigling', 'big hushling', { es: 'm', pt: 'm', de: 'm' }),
    // the three kinds of Hush creature (the hushling above, plus moths and beetles)
    N('n.moth', 'polilla', 'mariposa', 'Motte', 'moth', { es: 'f', pt: 'f', de: 'f' }),
    N('n.beetle', 'escarabajo', 'besouro', 'Käfer', 'beetle', { es: 'm', pt: 'm', de: 'm' }),
    N('n.armadillo', 'armadillo', 'tatu', 'Gürteltier', 'armadillo', { es: 'm', pt: 'm', de: 'n' }),
    // Region 2, the Mirror Lake: the frog, and where one stands in a row (kind 'position')
    N('n.frog', 'rana', 'sapo', 'Frosch', 'frog', { es: 'f', pt: 'm', de: 'm' }),
    // Bruno's training dummies, and the Corn Society (with white, one of the corn colors)
    N('n.dummy', 'muñeco', 'boneco', 'Puppe', 'dummy', { es: 'm', pt: 'm', de: 'f' }),
    N('n.kernel', 'grano', 'grão', 'Korn', 'kernel', { es: 'm', pt: 'm', de: 'n' }),
    N('n.popcorn', 'palomita', 'pipoca', 'Popcorn', 'popcorn', { es: 'f', pt: 'f', de: 'n' }),
    N('n.colonel', 'coronel', 'coronel', 'Oberst', 'colonel', { es: 'm', pt: 'm', de: 'm' }),
    N('a.white', 'blanco', 'branco', 'weiß', 'white'),
    Object.assign(N('p.left', 'izquierda', 'esquerda', 'links', 'left', null, 'left'), { kind: 'position' }),
    Object.assign(N('p.middle', 'medio', 'meio', 'Mitte', 'middle', null, 'middle'), { kind: 'position' }),
    Object.assign(N('p.right', 'derecha', 'direita', 'rechts', 'right', null, 'right'), { kind: 'position' }),
    N('n.head', 'cabeza', 'cabeça', 'Kopf', 'head', { es: 'f', pt: 'f', de: 'm' }),
    N('n.tail', 'cola', 'rabo', 'Schwanz', 'tail', { es: 'f', pt: 'm', de: 'm' }),
    N('n.shell', 'caparazón', 'casco', 'Panzer', 'shell', { es: 'm', pt: 'm', de: 'm' }),
    N('n.wing', 'ala', 'asa', 'Flügel', 'wing', { es: 'f', pt: 'f', de: 'm' }),
    N('n.stone', 'piedra', 'pedra', 'Stein', 'stone', { es: 'f', pt: 'f', de: 'm' }),
    N('o.light', 'piedrita', 'pedrinha', 'Steinchen', 'pebble', { es: 'f', pt: 'f', de: 'n' }),
    N('o.heavy', 'pedrusco', 'pedrão', 'Brocken', 'big rock', { es: 'm', pt: 'm', de: 'm' }),
    N('r.estar', 'el que está…', 'o que está…', '—', 'the one that is (right now)…', null, 'asleep'),
    N('t.nofight', 'no queremos pelear', 'não queremos brigar', 'wir wollen nicht kämpfen', 'we don’t want to fight', null, 'talk'),
    N('t.friends', 'somos amigos', 'somos amigos', 'wir sind Freunde', 'we’re friends', null, 'talk'),
    N('t.calm', 'tranquilo', 'calma', 'keine Angst', 'easy / don’t be scared', null, 'talk'),
    N('t.nohurt', 'no te vamos a lastimar', 'não vamos te machucar', 'wir tun dir nichts', 'we won’t hurt you', null, 'talk'),
  ];
  // the teach check also accepts these forms (LEX.check uses item.alt)
  const alt = { 'v.jump': { es: ['brinca'], pt: ['salta'], de: ['springe', 'hüpf'] }, 'v.hit': { es: ['pega', 'pégale'], pt: ['soca'], de: ['hau', 'schlage'] }, 'a.small': { es: ['chico', 'chiquito'], pt: ['baixinho'] },
    'n.colonel': { de: ['Obersten', 'den Obersten'] }, 'n.kernel': { de: ['Maiskorn'] }, 'a.white': { de: ['weiss'] },
    'n.wing': { es: ['alas', 'las alas'], pt: ['asas', 'as asas'], de: ['die Flügel'] },
    'v.push': { es: ['empuje'], pt: ['empurre'], de: ['schiebe'] }, 'v.eat': { es: ['coma', 'cómete'], pt: ['coma'], de: ['iß'] },
    // positions: typed on their own (a teach box, a question in the lake village) with or without the little words around them
    'p.left': { es: ['la izquierda', 'de la izquierda', 'a la izquierda', 'izquierdo'], pt: ['a esquerda', 'da esquerda', 'à esquerda', 'na esquerda'],
      de: ['linke', 'linken', 'linker', 'linkes', 'der linke', 'den linken', 'nach links'] },
    'p.middle': { es: ['el medio', 'del medio', 'en el medio', 'en medio', 'centro', 'el centro', 'del centro'], pt: ['o meio', 'do meio', 'no meio', 'centro', 'o centro'],
      de: ['in der Mitte', 'die Mitte', 'mittlere', 'mittleren', 'mittlerer', 'mittleres', 'der mittlere', 'den mittleren'] },
    'p.right': { es: ['la derecha', 'de la derecha', 'a la derecha', 'derecho'], pt: ['a direita', 'da direita', 'à direita', 'na direita'],
      de: ['rechte', 'rechten', 'rechter', 'rechtes', 'der rechte', 'den rechten', 'nach rechts'] } };
  _.ITEMS.forEach(it => { if (alt[it.id]) it.alt = alt[it.id]; });
  // plurals (LEX.form(id, {pl: true})) and the article where it isn't the usual one («el ala»)
  const plural = { 'n.moth': { es: 'polillas', pt: 'mariposas', de: 'Motten' }, 'n.beetle': { es: 'escarabajos', pt: 'besouros', de: 'Käfer' }, 'n.wing': { es: 'alas', pt: 'asas', de: 'Flügel' },
    'n.armadillo': { es: 'armadillos', pt: 'tatus', de: 'Gürteltiere' }, 'n.frog': { es: 'ranas', pt: 'sapos', de: 'Frösche' },
    'n.dummy': { es: 'muñecos', pt: 'bonecos', de: 'Puppen' }, 'n.kernel': { es: 'granos', pt: 'grãos', de: 'Körner' }, 'n.popcorn': { es: 'palomitas', pt: 'pipocas', de: 'Popcorns' },
    'n.colonel': { es: 'coroneles', pt: 'coronéis', de: 'Obersten' } };
  _.ITEMS.forEach(it => { if (plural[it.id]) it.pl = plural[it.id]; if (it.id === 'n.wing') it.art = { es: 'el' }; });

  // Food in battle: what each one heals when the game doesn't pass its own table (BATTLE.start({ items })).
  // The words come from the language engine (LEX.item(id): forms, genders, plurals). mass: fine without an
  // article («come pan», «come pão», «Iss Brot!»); the others need one («come la manzana», «Iss den Apfel!»).
  _.FOOD = {
    'w.apple': { heal: 1 }, 'w.pear': { heal: 1 }, 'w.orange': { heal: 1 }, 'w.cookie': { heal: 1 },
    'w.bread': { heal: 2, mass: true }, 'w.cheese': { heal: 2, mass: true }, 'w.honey': { heal: 2, mass: true }, 'w.cake': { heal: 3, mass: true },
    'w.fish': { heal: 2, mass: true },
  };
  // The words for a food when the battle's own form differs from the world's (or the world has none yet).
  // Fish: Spanish says «el pez» for a live one and «el pescado» for food, so in a battle Mimo eats «el
  // pescado» and «el pez» is accepted too (LEX.item('w.fish') may well say «pez», for the lake's fish).
  _.FOOD_WORDS = {
    'w.fish': { en: 'fish', enPl: 'fish', icon: 'fish', es: { w: 'pescado', pl: 'pescados', g: 'm', alt: ['pez'] }, pt: { w: 'peixe', pl: 'peixes', g: 'm' }, de: { w: 'Fisch', pl: 'Fische', g: 'm' } },
  };

  // The overworld teaches «empuja» before any fight (and the "tell Mimo" box listens for battle verbs),
  // so the battle's words are in the language engine from the start. A position the world registered
  // first (the lake village asks the way with them) keeps its entry and gains the battle's forms.
  _.registerItems = () => {
    if (typeof LEX === 'undefined') return;
    LEX.register(_.ITEMS.filter(it => !(it.kind === 'position' && LEX.item(it.id) && LEX.item(it.id) !== it)));
    for (const it of _.ITEMS) {
      const w = it.kind === 'position' && LEX.item(it.id);
      if (!w || w === it) continue;
      w.alt = w.alt || {};
      for (const l of ['es', 'pt', 'de']) w.alt[l] = Array.from(new Set([...(w.alt[l] || []), ...((it.alt && it.alt[l]) || [])]));
    }
    _.registered = true;
  };
  if (typeof LEX !== 'undefined' && !_.registered) _.registerItems();
})();

// ================================================================ Region 3, the Quarry Caves (appended): the echo bat and «canta»
// el murciélago · o morcego · die Fledermaus (a die-word: «die rote Fledermaus», also when you hit it). Echo bats copy your
// last command: say the same thing again and they throw it back at you (flow.js echoBack). Sing («canta / canta / sing»,
// learned from Pío in the miners' camp) reaches every foe at once: a little each, more on Hushlings, and bats get dizzy.
(() => {
  const _ = window.BATTLE._, L = _.LANGS;
  const put = (o, k, v) => { if (o && o[k] === undefined) o[k] = v; };
  const lines = (lang, t) => { for (const [k, v] of Object.entries(t)) put(L[lang].t, k, v); };
  // Spanish
  put(L.es.species, 'bat', { w: 'murciélago', pl: 'murciélagos', g: 'm', en: 'bat' });
  put(L.es.verbs, 'sing', { show: 'canta', forms: ['canta', 'cante', 'cántale', 'cántales'], en: 'sing' });
  put(L.es.frames, 'batT', { text: 'Golpea al murciélago ___', pat: 'hit+target' }); put(L.es.frames, 'singT', { text: '¡Canta!', pat: 'verb' });
  put(L.es.tips, 'bat', 'Echo bats copy what you say: say the same thing twice in a row and they throw it right back at you! Change the action or the words every time. A song («canta») leaves them dizzy for a turn.');
  put(L.es.tips, 'sing', 'Mimo’s song («canta») reaches every foe at once: a little for each, more for Hushlings, and echo bats get dizzy. It wakes up sleepers, too.');
  lines('es', { echoBack: ['¡Eco! ¡Te lo devuelve!', 'Echo! It throws it right back at you!'], dazed: ['¡Está mareado!', 'It’s dizzy!'], dazedF: ['¡Está mareada!', 'It’s dizzy!'],
    singing: ['¡La, la, laaa!', 'La, la, laaa!'], screech: ['¡Iiiic!', 'Eeeek!'], copyCat: ['¡Lo mismo otra vez no!', 'Not the same thing again!'] });
  Object.assign(L.es.gloss, { 'murciélago': 'bat', 'murciélagos': 'bats', canta: 'sing', eco: 'echo', devuelve: 'gives back', mareado: 'dizzy', mareada: 'dizzy (feminine)', mismo: 'same', otra: 'another', iiiic: 'eeeek' });
  // Portuguese
  put(L.pt.species, 'bat', { w: 'morcego', pl: 'morcegos', g: 'm', en: 'bat' });
  put(L.pt.verbs, 'sing', { show: 'canta', forms: ['canta', 'cante'], en: 'sing' });
  put(L.pt.frames, 'batT', { text: 'Bate no morcego ___', pat: 'hit+target' }); put(L.pt.frames, 'singT', { text: 'Canta!', pat: 'verb' });
  put(L.pt.tips, 'bat', 'Echo bats copy what you say: say the same thing twice in a row and they throw it right back at you! Change the action or the words every time. A song («canta») leaves them dizzy for a turn.');
  put(L.pt.tips, 'sing', 'Mimo’s song («canta») reaches every foe at once: a little for each, more for Hushlings, and echo bats get dizzy. It wakes up sleepers, too.');
  lines('pt', { echoBack: ['Eco! Ele devolveu!', 'Echo! It threw it right back!'], dazed: ['Ficou tonto!', 'It’s dizzy!'], dazedF: ['Ficou tonta!', 'It’s dizzy!'],
    singing: ['Lá, lá, láaa!', 'La, la, laaa!'], screech: ['Iiiic!', 'Eeeek!'], copyCat: ['A mesma coisa de novo, não!', 'Not the same thing again!'] });
  Object.assign(L.pt.gloss, { morcego: 'bat', morcegos: 'bats', canta: 'sing', eco: 'echo', devolveu: 'gave it back', tonto: 'dizzy', tonta: 'dizzy (feminine)', mesma: 'same', coisa: 'thing', 'novo': 'new (de novo = again)', iiiic: 'eeeek' });
  // German
  put(L.de.species, 'bat', { w: 'Fledermaus', pl: 'Fledermäuse', gen: 'Fledermaus', g: 'f', en: 'bat' });
  put(L.de.verbs, 'sing', { show: 'sing', forms: ['sing', 'singe'], en: 'sing' });
  put(L.de.frames, 'batT', { text: 'Schlag die ___ Fledermaus!', pat: 'hit+target' }); put(L.de.frames, 'singT', { text: 'Sing!', pat: 'verb' });
  put(L.de.tips, 'bat', '«die Fledermaus» is a die-word: «Schlag die rote Fledermaus!» Echo bats copy what you say: say the same thing twice in a row and they throw it right back at you! Change the action or the words every time. A song («sing») leaves them dizzy for a turn.');
  put(L.de.tips, 'sing', 'Mimo’s song («sing») reaches every foe at once: a little for each, more for Hushlings, and echo bats get dizzy. It wakes up sleepers, too.');
  lines('de', { echoBack: ['Echo! Sie wirft es zurück!', 'Echo! It throws it right back!'], dazed: ['Er ist ganz benommen!', 'It’s dizzy!'], dazedF: ['Sie ist ganz benommen!', 'It’s dizzy!'], dazedN: ['Es ist ganz benommen!', 'It’s dizzy!'],
    singing: ['La, la, laaa!', 'La, la, laaa!'], screech: ['Iiieh!', 'Eeeek!'], copyCat: ['Nicht noch mal dasselbe!', 'Not the same thing again!'] });
  Object.assign(L.de.gloss, { fledermaus: 'bat', 'fledermäuse': 'bats', sing: 'sing', echo: 'echo', wirft: 'throws', 'zurück': 'back', benommen: 'dizzy', dasselbe: 'the same thing', noch: 'still (noch mal = again)', iiieh: 'eeeek' });
  // (Chinese and Japanese: the bat, «唱歌 / 歌って» and these lines are in the L.zh / L.ja tables further down)
  ['es', 'pt', 'de'].forEach(k => { delete L[k].I; });        // (the parser indexes each language once: again, with the new words)
  // the language engine's items
  const N = (id, es, pt, de, en, g, icon) => ({ id, es, pt, de, en, g, icon: icon || id.split('.')[1], battle: true });
  const sing = Object.assign(N('v.sing', 'canta', 'canta', 'sing', 'sing', null, 'sing'), { zh: '[唱歌|chàng gē]', ja: '[歌|うた]って', alt: { es: ['cante', 'cántale'], pt: ['cante'], de: ['singe', 'singt', 'singen'], zh: ['[唱|chàng]'], ja: ['[歌|うた]う', '[歌|うた]え'] } });
  const bat = Object.assign(N('n.bat', 'murciélago', 'morcego', 'Fledermaus', 'bat', { es: 'm', pt: 'm', de: 'f' }, 'bat'), { zh: '[蝙蝠|biān fú]', ja: 'コウモリ', pl: { es: 'murciélagos', pt: 'morcegos', de: 'Fledermäuse' } });
  for (const it of [sing, bat]) if (!_.ITEMS.some(x => x.id === it.id)) _.ITEMS.push(it);
  if (typeof LEX !== 'undefined') { const add = [sing, bat].filter(it => !LEX.item(it.id)); if (add.length) LEX.register(add); }
  if (typeof ICONS !== 'undefined' && !ICONS.keys.includes('bat')) ICONS.add('bat', (c, p, h) => {
    h.shape(c, p, c2 => { c2.moveTo(-6, -4); c2.quadraticCurveTo(-30, -26, -40, -6); c2.quadraticCurveTo(-32, -2, -30, 6); c2.quadraticCurveTo(-22, 0, -18, 10); c2.quadraticCurveTo(-12, 4, -6, 8); c2.closePath(); }, '#6a5f88');
    h.shape(c, p, c2 => { c2.moveTo(6, -4); c2.quadraticCurveTo(30, -26, 40, -6); c2.quadraticCurveTo(32, -2, 30, 6); c2.quadraticCurveTo(22, 0, 18, 10); c2.quadraticCurveTo(12, 4, 6, 8); c2.closePath(); }, '#6a5f88');
    h.shape(c, p, h.ell(0, 4, 13, 15), '#8c84a6'); h.shape(c, p, h.poly([[-10, -6], [-6, -24], [-2, -8]]), '#8c84a6'); h.shape(c, p, h.poly([[10, -6], [6, -24], [2, -8]]), '#8c84a6');
    if (p) { h.eyes(c, -5, 5, 0, 0.8); h.dot(c, -3, 12, 1.6, '#fff'); h.dot(c, 3, 12, 1.6, '#fff'); }
  });
})();

// ================================================================ Chinese and Japanese (DESIGN.md 14.10, wave 2): battles in zh and ja
// Every zh / ja string is in the game/CJK.md notation ([打|dǎ] [红色|hóng sè] [的|de] [蛾子|é zi] ！ · [赤|あか]い [蛾|が] を
// [打|う]って ！). battle/ui.js shows it through CJK (ruby that fades in character mode, pinyin / rōmaji in roman mode), and
// parser.js reads what you type (cjParse: characters, or pinyin / rōmaji with or without spaces, tones as marks, digits or
// nothing). Neither language has gender, so every kind is g 'm' (that way the generic frames show). English halves put the
// words in the language inside «» (ui.js renders them). Lines about Mimo say {mimo} in the language half (米莫 / ミモ, or
// the player's name) and {name} in the English half.
//   zh commands are the plain imperative: «跳！», «打红色的蛾子！» (or «打红蛾子！»), «推犰狳！», «打左边的青蛙！», «用石头打！»;
//   请, 吧, 一下 and 把 sentences («把犰狳推倒！») are fine. ja asks with the te-form: «跳んで！», «赤い蛾を打って！»,
//   «アルマジロを押して！», «左のカエルを打って！»; ください and the plain imperative («打て！») are fine too.
// The grammar ladder (DESIGN.md 13.3), as checked by parser.js:
//   zh: the verb (a bare command, no 了 / 在 / 着), 的 between a place or a state and its noun («左边的青蛙», «睡着的青蛙») and
//       between whose and the part («甲虫的头»), word order (the action first; 把 to put who first; descriptions before the
//       noun), the measure word after 这 / 那 / a number («这只青蛙»), 用 for "with" («用石头打…»), and 跳到…上 for jumping
//       onto something. Characters must be the right ones (a homophone is a slip); tones are optional, a wrong one is a note.
//   ja: を for the one you act on (に for where you land: «赤い蛾に跳んで»), い-adjectives straight before the noun («赤い蛾»,
//       not «赤いの蛾»; 緑 takes の), の for whose and where («カエルの頭», «左のカエル»), で for "with" («石で…»), and the
//       te-form («打って», not «打つ» or «打ちます»). Long vowels and kana vs kanji are optional when typing.
// Bruno (the Coach) speaks politely in ja; Mimo and the foes speak casually.
(() => {
  const _ = window.BATTLE._, L = _.LANGS;
  // measure words and their pinyin (zh)
  const CLPY = { '只': 'zhī', '个': 'gè', '颗': 'kē', '粒': 'lì', '位': 'wèi', '条': 'tiáo', '块': 'kuài', '罐': 'guàn' };
  const cl = c => `[${c}|${CLPY[c] || 'gè'}]`;
  const DE = '[的|de]';
  L.zh = {
    code: 'zh', cjk: true, name: '中文', variety: 'Mandarin Chinese (Simplified characters)', idk: true,
    // (the es / pt / de parser's index is still built for every language: these keep it empty)
    arts: {}, preps: [], voc: [], fillers: [], conj: [], talk: [], copulas: {}, floatRel: [], joiner: '， [然后|rán hòu]',
    // cl: the usual measure word; cls: the ones that are fine with it
    species: {
      hushling: { w: '[小默默|xiǎo mò mò]', en: 'hushling', g: 'm', cl: '只', cls: ['只', '个'], alt: ['[默默|mò mò]'] },
      hushbig: { w: '[大默默|dà mò mò]', en: 'big hushling', g: 'm', cl: '只', cls: ['只', '个'] },
      moth: { w: '[蛾子|é zi]', en: 'moth', g: 'm', cl: '只', alt: ['[飞蛾|fēi é]', '[蛾|é]'] },
      beetle: { w: '[甲虫|jiǎ chóng]', en: 'beetle', g: 'm', cl: '只', alt: ['[甲壳虫|jiǎ ké chóng]'] },
      armadillo: { w: '[犰狳|qiú yú]', en: 'armadillo', g: 'm', cl: '只' },
      frog: { w: '[青蛙|qīng wā]', en: 'frog', g: 'm', cl: '只', alt: ['[蛙|wā]'] },
      dummy: { w: '[稻草人|dào cǎo rén]', en: 'dummy', g: 'm', cl: '个', cls: ['个'], alt: ['[假人|jiǎ rén]'] },
      kernel: { w: '[玉米粒|yù mǐ lì]', en: 'kernel', g: 'm', cl: '颗', cls: ['颗', '粒', '个'] },
      popcorn: { w: '[爆米花|bào mǐ huā]', en: 'popcorn', g: 'm', cl: '颗', cls: ['颗', '粒', '个'] },
      colonel: { w: '[上校|shàng xiào]', en: 'colonel', g: 'm', cl: '位', cls: ['位', '个'], name: '[玉米棒|yù mǐ bàng] [上校|shàng xiào]', alt: ['[玉米棒|yù mǐ bàng] [上校|shàng xiào]'] },
      bat: { w: '[蝙蝠|biān fú]', en: 'bat', g: 'm', cl: '只' },
    },
    // where one stands in the row, as you see it: «左边的青蛙», «中间的», «右边那只»
    positions: {
      left: { w: '[左边|zuǒ biān]', en: 'left', alt: ['[左面|zuǒ miàn]', '[左侧|zuǒ cè]', '[左|zuǒ]'] },
      middle: { w: '[中间|zhōng jiān]', en: 'middle', alt: ['[当中|dāng zhōng]', '[中央|zhōng yāng]', '[正中间|zhèng zhōng jiān]'] },
      right: { w: '[右边|yòu biān]', en: 'right', alt: ['[右面|yòu miàn]', '[右侧|yòu cè]', '[右|yòu]'] },
    },
    parts: {
      head: { w: '[头|tóu]', g: 'm', en: 'head', alt: ['[脑袋|nǎo dai]'] },
      tail: { w: '[尾巴|wěi ba]', g: 'm', en: 'tail' },
      shell: { w: '[壳|ké]', g: 'm', en: 'shell', alt: ['[硬壳|yìng ké]', '[甲壳|jiǎ ké]'] },
      wing: { w: '[翅膀|chì bǎng]', pl: '[翅膀|chì bǎng]', g: 'm', en: 'wing' },
    },
    // cj: every form the parser knows, with its style: a color is long (红色) or short (红); a state goes with 的
    adjs: {
      red: { forms: [{ m: '[红色|hóng sè]', f: '[红色|hóng sè]' }], en: 'red', cj: [['[红色|hóng sè]', 'long'], ['[红|hóng]', 'short']] },
      blue: { forms: [{ m: '[蓝色|lán sè]', f: '[蓝色|lán sè]' }], en: 'blue', cj: [['[蓝色|lán sè]', 'long'], ['[蓝|lán]', 'short']] },
      green: { forms: [{ m: '[绿色|lǜ sè]', f: '[绿色|lǜ sè]' }], en: 'green', cj: [['[绿色|lǜ sè]', 'long'], ['[绿|lǜ]', 'short']] },
      yellow: { forms: [{ m: '[黄色|huáng sè]', f: '[黄色|huáng sè]' }], en: 'yellow', cj: [['[黄色|huáng sè]', 'long'], ['[黄|huáng]', 'short']] },
      white: { forms: [{ m: '[白色|bái sè]', f: '[白色|bái sè]' }], en: 'white', cj: [['[白色|bái sè]', 'long'], ['[白|bái]', 'short']] },
      big: { forms: [{ m: '[大|dà]', f: '[大|dà]' }], en: 'big', cj: [['[大|dà]', 'size']] },
      small: { forms: [{ m: '[小|xiǎo]', f: '[小|xiǎo]' }], en: 'small', cj: [['[小|xiǎo]', 'size']] },
      asleep: { forms: [{ m: '[睡着|shuì zháo]', f: '[睡着|shuì zháo]' }], en: 'asleep', state: true, cj: [['[睡着|shuì zháo]', 'state'], ['[在|zài] [睡觉|shuì jiào]', 'state'], ['[睡觉|shuì jiào]', 'state']] },
      angry: { forms: [{ m: '[生气|shēng qì]', f: '[生气|shēng qì]' }], en: 'angry', state: true, cj: [['[生气|shēng qì]', 'state'], ['[在|zài] [生气|shēng qì]', 'state']] },
    },
    // cj: [form, 'ok', 'direct' when it takes who straight, with no 到…上 (踩: stomp on it)]
    verbs: {
      jump: { show: '[跳|tiào]', forms: ['[跳|tiào]', '[蹦|bèng]', '[踩|cǎi]'], en: 'jump', cj: [['[跳|tiào]', 'ok'], ['[蹦|bèng]', 'ok'], ['[踩|cǎi]', 'ok', 'direct']] },
      hit: { show: '[打|dǎ]', forms: ['[打|dǎ]', '[揍|zòu]', '[敲|qiāo]', '[踢|tī]'], en: 'hit', cj: [['[打|dǎ]', 'ok'], ['[揍|zòu]', 'ok'], ['[敲|qiāo]', 'ok'], ['[踢|tī]', 'ok'], ['[砸|zá]', 'ok']] },
      push: { show: '[推|tuī]', forms: ['[推|tuī]', '[推倒|tuī dǎo]', '[推翻|tuī fān]'], en: 'push', cj: [['[推|tuī]', 'ok'], ['[推倒|tuī dǎo]', 'ok', 'result'], ['[推翻|tuī fān]', 'ok', 'result']] },
      eat: { show: '[吃|chī]', forms: ['[吃|chī]', '[吃掉|chī diào]'], en: 'eat', cj: [['[吃|chī]', 'ok'], ['[吃掉|chī diào]', 'ok', 'result']] },
      sing: { show: '[唱歌|chàng gē]', forms: ['[唱歌|chàng gē]', '[唱|chàng]'], en: 'sing', cj: [['[唱歌|chàng gē]', 'ok'], ['[唱|chàng]', 'ok']] },
    },
    // the stone you can hit with («用石头打…»): it lies in the arena once Mimo knows the word
    stone: { w: '[石头|shí tou]', g: 'm', en: 'stone', tag: '[石头|shí tou]', alt: ['[石子|shí zǐ]', '[小石头|xiǎo shí tou]', '[石块|shí kuài]'] },
    clPinyin: CLPY,
    // talking a shy one down: any of these anywhere in what you say
    talkCJ: [
      { id: 'nofight', p: ['[不|bù] [想|xiǎng] [打架|dǎ jià]', '[不要|bù yào] [打架|dǎ jià]', '[别|bié] [打架|dǎ jià]', '[不|bù] [打架|dǎ jià]', '[别|bié] [打|dǎ] [了|le]', '[不|bù] [打|dǎ] [了|le]'] },
      { id: 'friends', p: ['[朋友|péng you]'] },
      { id: 'calm', p: ['[别|bié] [怕|pà]', '[不要|bù yào] [怕|pà]', '[不用|bù yòng] [怕|pà]', '[别|bié] [害怕|hài pà]', '[不要|bù yào] [害怕|hài pà]', '[不用|bù yòng] [害怕|hài pà]', '[冷静|lěng jìng]', '[没事|méi shì]'] },
      { id: 'nohurt', p: ['[不会|bù huì] [伤害|shāng hài]', '[不|bù] [伤害|shāng hài]', '[不会|bù huì] [打|dǎ] [你|nǐ]'] },
    ],
    autoTalk: ['[别|bié] [怕|pà] ， [我们|wǒ men] [不|bù] [想|xiǎng] [打架|dǎ jià] 。', '[我们|wǒ men] [是|shì] [朋友|péng you] 。', '[我们|wǒ men] [不会|bù huì] [伤害|shāng hài] [你|nǐ] 。'],
    // enemy shouts, richer with your tier: [text, English]; the dodge words are in them (上面 / 下面, then 头 / 脚)
    shout(tier, toMimo, high) {
      const where = high ? '[上面|shàng miàn]' : '[下面|xià miàn]', wEn = high ? 'from up high' : 'from down low';
      if (tier <= 1) return high ? ['[上面|shàng miàn] ！', 'Up high!'] : ['[下面|xià miàn] ！', 'Down low!'];
      if (tier === 2) return toMimo ? [`[大|dà] [耳朵|ěr duo] ， [我|wǒ] [从|cóng] ${where} [打|dǎ] [你|nǐ] ！`, `Big-ears, I’m coming for you ${wEn}!`]
        : [`[我|wǒ] [从|cóng] ${where} [打|dǎ] [你|nǐ] ！`, `I’m coming for you ${wEn}!`];
      const spot = high ? '[头|tóu]' : '[脚|jiǎo]', en = high ? 'head' : 'feet';
      return toMimo ? [`[大|dà] [耳朵|ěr duo] ， [我|wǒ] [要|yào] [打|dǎ] [你|nǐ] [的|de] ${spot} ！`, `Big-ears, I’m gonna hit your ${en}!`]
        : [`[我|wǒ] [要|yào] [打|dǎ] [你|nǐ] [的|de] ${spot} ！`, `I’m gonna hit your ${en}!`];
    },
    dodgeWords: tier => (tier >= 3 ? { high: '[头|tóu]', low: '[脚|jiǎo]' } : { high: '[上面|shàng miàn]', low: '[下面|xià miàn]' }),
    labels: { floating: '[在|zài] [飞|fēi]', shy: '[害羞|hài xiū]', weak: '[弱点|ruò diǎn]', calm: '[安静|ān jìng]', down: '[倒地|dǎo dì]', back: '[肚子|dù zi] [朝天|cháo tiān]', capeShut: '[披风|pī fēng] [合着|hé zhe]', capeOpen: '[披风|pī fēng] [打开|dǎ kāi]' },
    labelsF: {},
    stateLbl: { asleep: ['[睡着|shuì zháo] [了|le]', '[睡着|shuì zháo] [了|le]'], angry: ['[生气|shēng qì] [了|le]', '[生气|shēng qì] [了|le]'] },
    examples: { 1: '[跳|tiào] ！', 2: '[打|dǎ] [红色|hóng sè] [的|de] ！', 3: '[打|dǎ] [尾巴|wěi ba] ！' },
    frames: {
      verb: { text: '[跳|tiào] ！ · [打|dǎ] ！', pat: 'verb' },
      jumpT: { text: '[跳|tiào] [到|dào] ___ [身上|shēn shang] ！', pat: 'jump+target' },
      hitT: { text: '[打|dǎ] ___ [的|de] ！', pat: 'hit+target' },
      partT: { text: '[打|dǎ] [尾巴|wěi ba] · [跳|tiào] [到|dào] [头|tóu] [上|shàng]', pat: 'part' },
      talk: { text: '[我们|wǒ men] [不|bù] [想|xiǎng] [打架|dǎ jià] · [我们|wǒ men] [是|shì] [朋友|péng you]', pat: 'talk' },
      mothT: { text: '[跳|tiào] [到|dào] ___ [的|de] [蛾子|é zi] [身上|shēn shang] ！', pat: 'jump+target' },
      wingT: { text: '[打|dǎ] [翅膀|chì bǎng] ！', pat: 'part' },
      beetleT: { text: '[打|dǎ] [甲虫|jiǎ chóng] [的|de] [头|tóu] ！', pat: 'part' },
      pushT: { text: '[推|tuī] ___ [的|de] [犰狳|qiú yú] ！', pat: 'push+target' },
      frogT: { text: '[跳|tiào] [到|dào] ___ [的|de] [青蛙|qīng wā] [身上|shēn shang] ！', pat: 'jump+target' },
      posT: { text: '[左边|zuǒ biān] [的|de] · [中间|zhōng jiān] [的|de] · [右边|yòu biān] [的|de]', pat: 'position' },
      dummyT: { text: '[打|dǎ] ___ [的|de] [稻草人|dào cǎo rén] ！', pat: 'hit+target' },
      kernelT: { text: '[打|dǎ] ___ [的|de] [玉米粒|yù mǐ lì] ！', pat: 'hit+target' },
      popT: { text: '[跳|tiào] [到|dào] ___ [的|de] [爆米花|bào mǐ huā] [上|shàng] ！', pat: 'jump+target' },
      bossT: { text: '[打|dǎ] [上校|shàng xiào] ！', pat: 'hit+target' },
      batT: { text: '[打|dǎ] ___ [的|de] [蝙蝠|biān fú] ！', pat: 'hit+target' },
      singT: { text: '[唱歌|chàng gē] ！', pat: 'verb' },
      instrT: { text: '[用|yòng] [石头|shí tou] [打|dǎ] ___ ！', pat: 'instrument' },
    },
    tips: {
      target: 'Say who: «[打|dǎ] [红色|hóng sè] [的|de] [蛾子|é zi]» (the red moth), or shorter, «[打|dǎ] [红|hóng] [蛾子|é zi]». Without the noun: «[打|dǎ] [红色|hóng sè] [的|de]» (the red one). With 这 (this) or 那 (that), add the measure word: «[这|zhè] [只|zhī] [青蛙|qīng wā]».',
      boss: 'His husk cape is closed: hits just bounce off. Beat his soldiers first («[打|dǎ] [黄色|huáng sè] [的|de] [玉米粒|yù mǐ lì]»); then he opens the cape to attack, and that’s when you hit him: «[打|dǎ] [上校|shàng xiào]».',
      popcorn: 'The floor is hot: the kernels popped! «[玉米粒|yù mǐ lì]» are now «[爆米花|bào mǐ huā]»: «[打|dǎ] [白色|bái sè] [的|de] [爆米花|bào mǐ huā]». They hop to new spots every turn.',
      position: 'They look the same? Say where it is, as you see it: «[左边|zuǒ biān]» (left), «[中间|zhōng jiān]» (middle), «[右边|yòu biān]» (right), with 的 before the noun: «{ex}».',
      frog: 'Frogs hop to another lily pad after every turn, so «[左边|zuǒ biān] [的|de] [青蛙|qīng wā]» may be a different frog next time. Look before you speak!',
      parts: 'Name the part: «[打|dǎ] [尾巴|wěi ba]», «[跳|tiào] [到|dào] [头|tóu] [上|shàng]». Whose? Join them with 的: «[打|dǎ] [甲虫|jiǎ chóng] [的|de] [头|tóu]».',
      shy: 'This one is shy. Talk instead of fighting: «[我们|wǒ men] [不|bù] [想|xiǎng] [打架|dǎ jià]», «[我们|wǒ men] [是|shì] [朋友|péng you]», «[别|bié] [怕|pà]».',
      twist: '“With” is 用, before the action: «[用|yòng] [石头|shí tou] [打|dǎ] [红|hóng] [蛾子|é zi]». A thrown stone flies, so it reaches floating moths too.',
      moth: 'Moths float: «[打|dǎ]» can’t reach them, «[跳|tiào]» can: «[跳|tiào] [到|dào] [红色|hóng sè] [的|de] [蛾子|é zi] [身上|shēn shang]». Hit the wings to knock one down: «[打|dǎ] [翅膀|chì bǎng]».',
      beetle: 'Beetles have a hard shell (½ damage). Aim for the head: «[打|dǎ] [甲虫|jiǎ chóng] [的|de] [头|tóu]».',
      armadillo: 'Armadillos roll up into a hard ball (⅓ damage). Push one over: «[推|tuī] [犰狳|qiú yú]», or with 把: «[把|bǎ] [犰狳|qiú yú] [推倒|tuī dǎo]». On its back it can’t attack, and its belly takes ×2, for one turn.',
      eat: 'Hungry? Feed {name} from the bag: «[吃|chī] [苹果|píng guǒ]», «[吃|chī] [一|yī] [块|kuài] [面包|miàn bāo]». It heals ♥, and it takes your turn.',
      bat: 'Echo bats copy what you say: say the same thing twice in a row and they throw it right back at you! Change the action or the words every time. A song («[唱歌|chàng gē]») leaves them dizzy for a turn.',
      sing: 'Mimo’s song («[唱歌|chàng gē]») reaches every foe at once: a little for each, more for Hushlings, and echo bats get dizzy. It wakes up sleepers, too.',
    },
    // why a slip is a slip, for the review after a battle (keys are the parser's error kinds)
    why: {
      spelling: 'Characters: that one sounds right, but it’s another character. Compare the two lines: what changed is underlined.',
      accent: 'Tones: you don’t have to type them, but when you do, they should be right. The underlined syllable has another tone.',
      de: '的 joins a place or a state to its noun: «[左边|zuǒ biān] [的|de] [青蛙|qīng wā]» (the frog on the left), «[睡着|shuì zháo] [的|de] [青蛙|qīng wā]» (the sleeping frog), and whose to the part: «[青蛙|qīng wā] [的|de] [头|tóu]». On its own: «[红色|hóng sè] [的|de]» (the red one). A short color can go straight on: «[红|hóng] [蛾子|é zi]».',
      order: 'Word order: the action comes first, then who: «[打|dǎ] [红色|hóng sè] [的|de] [蛾子|é zi]». To put who first, use 把: «[把|bǎ] [犰狳|qiú yú] [推倒|tuī dǎo]». A description goes before its noun («[左边|zuǒ biān] [的|de] [青蛙|qīng wā]», not «[青蛙|qīng wā] [左边|zuǒ biān]»), and «[用|yòng] [石头|shí tou]» goes before the action.',
      measure: 'Measure words: after 这 (this), 那 (that) or a number comes a measure word: «[这|zhè] [只|zhī] [青蛙|qīng wā]», «[那|nà] [只|zhī] [蛾子|é zi]», «[一|yī] [个|gè] [苹果|píng guǒ]». Animals take 只, kernels and popcorn 颗, most other things 个.',
      ge: 'Measure words: 个 works for almost anything, but animals usually take 只: «[这|zhè] [只|zhī] [青蛙|qīng wā]».',
      yong: '“With” is 用 (or 拿), before the action: «[用|yòng] [石头|shí tou] [打|dǎ] [青蛙|qīng wā]». 和 and 跟 mean “together with”, like a friend coming along.',
      verbform: 'A command is just the action: «[跳|tiào] ！», «[打|dǎ] [青蛙|qīng wā] ！». 了 says it already happened, and 在 or 着 that it’s going on right now.',
      link: 'Jumping onto something: «[跳|tiào] [到|dào] … [身上|shēn shang]» or «[跳|tiào] [上|shàng] …»: «[跳|tiào] [到|dào] [红|hóng] [蛾子|é zi] [身上|shēn shang]». Or stomp on it: «[踩|cǎi] [红|hóng] [蛾子|é zi]».',
      baBare: 'With 把, the action usually gets a result: «[把|bǎ] [犰狳|qiú yú] [推倒|tuī dǎo]» (push it over), «[把|bǎ] [青蛙|qīng wā] [打|dǎ] [一下|yī xià]».',
      style: '',
      position: 'Where it is: as you see it on the screen: «[左边|zuǒ biān]» (left), «[中间|zhōng jiān]» (middle), «[右边|yòu biān]» (right), with 的 before the noun: «[左边|zuǒ biān] [的|de] [青蛙|qīng wā]». Frogs hop to another lily pad after every turn, so look again before you say where one is.',
      which: 'Which one? When two or more look the same (same kind, same color), say where the one you mean is: «[左边|zuǒ biān] [的|de] [青蛙|qīng wā]», «[中间|zhōng jiān] [的|de]», «[右边|yòu biān] [的|de] [小默默|xiǎo mò mò]».',
      none: 'Mimo couldn’t find one like that. Check the colors and sizes on their labels.',
    },
    // the grade's one-line reason for the slips only zh has (the rest come from flow.js)
    slip: { spelling: 'Character slip', de: '的 slip', order: 'Word-order slip', measure: 'Measure-word slip', yong: '用 slip', verbform: 'Not a bare command', link: '跳到…上 slip' },
    soft: { accent: 'A tone is off' },
    nice: '[完美|wán měi] ！',
    teachHint: chars => (chars ? 'What’s the word? Type its pinyin, then pick the characters (Space). Stuck? Tab = a hint · ? = I don’t know.'
      : 'What’s the word? Type it in pinyin (tones are optional). Stuck? Tab = a hint · ? = I don’t know.'),
    cmdHint: 'Enter = send · Space at the hit = PERFECT · ↑ / ↓ = dodge · ? = an example',
    t: {
      hello: ['[你好|nǐ hǎo] ！ [我|wǒ] [专门|zhuān mén] [训练|xùn liàn] [像|xiàng] {mimo} [这样|zhè yàng] [的|de] [伙伴|huǒ bàn] 。', 'Hi! I train partners like {name}.'],
      watchJump: ['[先|xiān] [学|xué] [一个|yī gè] [动作|dòng zuò] 。 [看|kàn] [好|hǎo] [了|le] ： [跳|tiào] ！', 'First, an action. Watch: «[跳|tiào]» (jump)!'],
      echoJump: ['“ [跳|tiào] ” 。 [你|nǐ] [来|lái] [写|xiě] ： “ [跳|tiào] ” 。', '«[跳|tiào]» (jump). Now you: type «[跳|tiào]».'],
      teach: ['[很|hěn] [好|hǎo] ！ [现在|xiàn zài] [不|bù] [看|kàn] [提示|tí shì] ， [教|jiāo] [给|gěi] {mimo} 。', 'Very good! Now teach it to {name}, no peeking.'],
      firstWord: ['[它|tā] [的|de] [第一|dì yī] [个|gè] [词|cí] ！', 'Its first word!'],
      foeIn: ['[小心|xiǎo xīn] ！ [一|yī] [只|zhī] [小默默|xiǎo mò mò] 。 [告诉|gào su] {mimo} [该|gāi] [做|zuò] [什么|shén me] 。', 'Careful! A hushling («[小默默|xiǎo mò mò]»). Tell {name} what to do.'],
      listen: ['[听|tīng] ！ [它|tā] [会|huì] [喊|hǎn] [出|chū] [要|yào] [从|cóng] [哪里|nǎ lǐ] [攻击|gōng jī] 。', 'Listen! It shouts where it will attack.'],
      newHit: ['[再|zài] [学|xué] [一个|yī gè] [词|cí] ！ [看|kàn] ： [打|dǎ] ！', 'Another word! Watch: «[打|dǎ]» (hit)!'],
      echoHit: ['“ [打|dǎ] ” 。 [写|xiě] “ [打|dǎ] ” 。', '«[打|dǎ]» (hit). Type «[打|dǎ]».'],
      twoWords: ['{mimo} [现在|xiàn zài] [会|huì] [两|liǎng] [个|gè] [词|cí] [了|le] ！ [两个|liǎng gè] [都|dōu] [用|yòng] [一下|yī xià] 。', '{name} knows two words now! Use both.'],
      winVerbs: ['[赢|yíng] [了|le] ！ {mimo} [学|xué] [得|de] [真|zhēn] [快|kuài] 。', 'You won! {name} learns fast.'],
      twoFoes: ['[现在|xiàn zài] [有|yǒu] [两|liǎng] [只|zhī] [小默默|xiǎo mò mò] 。 [这|zhè] [只|zhī] [是|shì] [红色|hóng sè] [的|de] …', 'Now there are two hushlings. This one is red…'],
      twoFoesB: ['… [那|nà] [只|zhī] [是|shì] [蓝色|lán sè] [的|de] 。', '…and that one is blue.'],
      echoRed: ['“ [红色|hóng sè] ” 。 [写|xiě] “ [红色|hóng sè] ” 。', '«[红色|hóng sè]» (red). Type «[红色|hóng sè]».'],
      echoBlue: ['“ [蓝色|lán sè] ” 。 [写|xiě] “ [蓝色|lán sè] ” 。', '«[蓝色|lán sè]» (blue). Type «[蓝色|lán sè]».'],
      teachColor: ['[现在|xiàn zài] [把|bǎ] [这个|zhè ge] [颜色|yán sè] [教|jiāo] [给|gěi] {mimo} 。', 'Now teach {name} the color.'],
      sayWho: ['[说|shuō] [打|dǎ] [谁|shéi] ： “ [打|dǎ] [红色|hóng sè] [的|de] ！ ”', 'To say who: «[打|dǎ] [红色|hóng sè] [的|de] ！» (hit the red one!)'],
      yourTurn: ['[该|gāi] [你|nǐ] [了|le] ！', 'Your turn!'],
      winTargets: ['[打|dǎ] [得|de] [真|zhēn] [准|zhǔn] ！', 'Great aim!'],
      bigOne: ['[哇|wā] ， [一|yī] [只|zhī] [大默默|dà mò mò] ！ [好|hǎo] [大|dà] [啊|a] 。', 'Whoa, a big hushling («[大默默|dà mò mò]»)! It’s huge.'],
      lookTail: ['[看|kàn] [它|tā] [的|de] [尾巴|wěi ba] 。 [在|zài] [发光|fā guāng] ！ [那|nà] [是|shì] [它|tā] [的|de] [弱点|ruò diǎn] 。', 'Look at its tail. It’s glowing! That’s its weak spot.'],
      echoTail: ['“ [尾巴|wěi ba] ” 。 [写|xiě] “ [尾巴|wěi ba] ” 。', '«[尾巴|wěi ba]» (tail). Type «[尾巴|wěi ba]».'],
      teachWord: ['[现在|xiàn zài] [把|bǎ] [这个|zhè ge] [词|cí] [教|jiāo] [给|gěi] {mimo} 。', 'Now teach {name} the word.'],
      sayPart: ['[告诉|gào su] [它|tā] ： “ [打|dǎ] [尾巴|wěi ba] ！ ”', 'Tell it: «[打|dǎ] [尾巴|wěi ba] ！» (hit the tail!)'],
      weakMoves: ['[小心|xiǎo xīn] ！ [弱点|ruò diǎn] [会|huì] [移动|yí dòng] 。', 'Watch out! The weak spot moves.'],
      lookHead: ['[现在|xiàn zài] [它|tā] [的|de] [头|tóu] [在|zài] [发光|fā guāng] 。 “ [头|tóu] ” 。 [写|xiě] “ [头|tóu] ” 。', 'Now its head is glowing. «[头|tóu]» (head). Type «[头|tóu]».'],
      winParts: ['[成功|chéng gōng] [了|le] ！ [正好|zhèng hǎo] [打|dǎ] [中|zhòng] [弱点|ruò diǎn] 。', 'You did it! Right on the weak spot.'],
      retry: ['[哎哟|āi yō] ！ [深呼吸|shēn hū xī] 。 [再|zài] [来|lái] [一次|yī cì] 。', 'Ouch! Breathe. Let’s go again.'],
      catchOn: ['[这|zhè] [招|zhāo] [我|wǒ] [早|zǎo] [就|jiù] [知道|zhī dào] [了|le] ！', 'I already know that trick!'],
      shyReally: ['[真的|zhēn de] [吗|ma] … ？', 'Really…?'],
      shyJoin: ['[朋友|péng you] ？ [朋友|péng you] ！', 'Friends? Friends!'],
      shyVoice: ['[你|nǐ] … [你好|nǐ hǎo] ！', 'H… hello!'],
      shyAgain: ['…', '…'],
      shyScared: ['[哇|wā] ！ [好|hǎo] [可怕|kě pà] ！', 'Eek! So scary!'],
      poorShy: ['[真|zhēn] [可怜|kě lián] …', 'Poor little thing…'],
      floating: ['[它|tā] [在|zài] [飞|fēi] ！ [最好|zuì hǎo] [跳|tiào] [上去|shàng qù] 。', 'It’s floating! Better jump.'],
      nowAngry: ['[它|tā] [生气|shēng qì] [了|le] ！', 'Now it’s angry!'],
      sleepAgain: ['[它|tā] [又|yòu] [睡着|shuì zháo] [了|le] 。', 'It fell asleep again.'],
      mothDown: ['[它|tā] [掉|diào] [下来|xià lái] [了|le] ！ [这|zhè] [下|xià] [够得着|gòu de zháo] [了|le] ！', 'It fell! Now I can reach it!'],
      mothUp: ['[它|tā] [又|yòu] [飞|fēi] [起来|qǐ lái] [了|le] ！', 'It’s flying again!'],
      shellHard: ['[好|hǎo] [硬|yìng] [的|de] [壳|ké] ！ [最好|zuì hǎo] [打|dǎ] [头|tóu] 。', 'What a hard shell! Better the head.'],
      gradeIntro: ['[那个|nà ge] [字母|zì mǔ] [就是|jiù shì] [你|nǐ] [的|de] [分数|fēn shù] ！ S [是|shì] [满分|mǎn fēn] ： [打|dǎ] [得|de] [更|gèng] [重|zhòng] 。', 'That letter is your grade! S is perfect: the hit is stronger.'],
      watchPush: ['[好|hǎo] [硬|yìng] [的|de] [壳|ké] ！ [不过|bù guò] [可以|kě yǐ] [把|bǎ] [它|tā] [推倒|tuī dǎo] 。 [看|kàn] ： [推|tuī] ！', 'What a hard shell! But you can push it over. Watch: «[推|tuī]» (push)!'],
      echoPush: ['“ [推|tuī] ” 。 [写|xiě] “ [推|tuī] ” 。', '«[推|tuī]» (push). Type «[推|tuī]».'],
      curledHard: ['[它|tā] [缩成|suō chéng] [一个|yī gè] [硬球|yìng qiú] [了|le] ！ [先|xiān] [推|tuī] [它|tā] ！', 'It’s a hard little ball! Push it first.'],
      flipped: ['[它|tā] [肚子|dù zi] [朝天|cháo tiān] [了|le] ！ [快|kuài] [打|dǎ] [肚子|dù zi] ！', 'It’s on its back! Now, the belly!'],
      rollBack: ['[它|tā] [又|yòu] [缩成|suō chéng] [球|qiú] [了|le] ！', 'It rolled up into a ball again!'],
      pushWhole: ['[整个|zhěng gè] [推|tuī] ？', 'All of it?'],
      hungry: ['{mimo} [饿|è] [了|le] ！ [包|bāo] [里|lǐ] [有|yǒu] [吃|chī] [的|de] 。 [看|kàn] ： [吃|chī] ！', '{name} is hungry! There’s food in the bag. Watch: «[吃|chī]» (eat)!'],
      echoEat: ['“ [吃|chī] ” 。 [写|xiě] “ [吃|chī] ” 。', '«[吃|chī]» (eat). Type «[吃|chī]».'],
      munch: ['[啊呜|ā wū] ， [啊呜|ā wū] ！', 'Munch, munch!'],
      yum: ['[真|zhēn] [好吃|hǎo chī] ！', 'Yummy!'],
      full: ['[我|wǒ] [吃饱|chī bǎo] [了|le] ！', 'I’m full!'],
      eatWhat: ['[吃|chī] [什么|shén me] ？', 'Eat what?'],
      noFood: ['[没有|méi yǒu] [了|le] ！', 'There isn’t any!'],
      notFood: ['[那个|nà ge] [不能|bù néng] [吃|chī] ！', 'That’s not for eating!'],
      posIntro: ['[它们|tā men] [长得|zhǎng de] [一样|yī yàng] ！ {mimo} [分不清|fēn bù qīng] 。 [告诉|gào su] [它|tā] [在|zài] [哪里|nǎ lǐ] ： [左边|zuǒ biān] 、 [中间|zhōng jiān] [还是|hái shì] [右边|yòu biān] 。', 'They look the same! {name} can’t tell which is which. Tell it where one is: on the left («[左边|zuǒ biān]»), in the middle («[中间|zhōng jiān]») or on the right («[右边|yòu biān]»).'],
      posIntro2: ['[它们|tā men] [长得|zhǎng de] [一样|yī yàng] ！ {mimo} [分不清|fēn bù qīng] 。 [告诉|gào su] [它|tā] [在|zài] [哪里|nǎ lǐ] ： [左边|zuǒ biān] [还是|hái shì] [右边|yòu biān] 。', 'They look the same! {name} can’t tell which is which. Tell it where one is: on the left («[左边|zuǒ biān]») or on the right («[右边|yòu biān]»).'],
      posLeft: ['[在|zài] [左边|zuǒ biān] ： “ [左边|zuǒ biān] ” 。 [写|xiě] “ [左边|zuǒ biān] ” 。', 'On the left: «[左边|zuǒ biān]». Type «[左边|zuǒ biān]».'],
      posMiddle: ['[在|zài] [中间|zhōng jiān] ： “ [中间|zhōng jiān] ” 。 [写|xiě] “ [中间|zhōng jiān] ” 。', 'In the middle: «[中间|zhōng jiān]». Type «[中间|zhōng jiān]».'],
      posRight: ['[在|zài] [右边|yòu biān] ： “ [右边|yòu biān] ” 。 [写|xiě] “ [右边|yòu biān] ” 。', 'On the right: «[右边|yòu biān]». Type «[右边|yòu biān]».'],
      frogsHop: ['[小心|xiǎo xīn] ！ [每|měi] [一|yī] [轮|lún] [之后|zhī hòu] ， [青蛙|qīng wā] [都|dōu] [会|huì] [跳到|tiào dào] [别的|bié de] [荷叶|hé yè] [上|shàng] 。 [说|shuō] [之前|zhī qián] [先|xiān] [看|kàn] [清楚|qīng chu] 。', 'Watch out! Frogs hop from pad to pad after every turn. Look carefully before you speak.'],
      swapped: ['[它们|tā men] [换|huàn] [位置|wèi zhì] [了|le] ！', 'They switched places!'],
      whichOne: ['[哪|nǎ] [一|yī] [只|zhī] ？', 'Which one?'],
      croak: ['[呱呱|guā guā] ！', 'Ribbit!'],
      pHello: ['[你好|nǐ hǎo] ！ [我们|wǒ men] [用|yòng] [稻草人|dào cǎo rén] [来|lái] [练习|liàn xí] 。', 'Hi! Let’s train with the dummies.'],
      pVerbs: ['[先|xiān] [练|liàn] [动作|dòng zuò] ： [跳|tiào] 、 [打|dǎ] … [每次|měi cì] [换|huàn] [一个|yī gè] [动作|dòng zuò] ！', 'First, the actions: jump, hit… Change the action every time!'],
      pColors: ['[看|kàn] [围巾|wéi jīn] ： [每|měi] [个|gè] [稻草人|dào cǎo rén] [都|dōu] [有|yǒu] [一种|yī zhǒng] [颜色|yán sè] 。 [说|shuō] [哪|nǎ] [一个|yī gè] ： “ [红色|hóng sè] [的|de] ” 、 “ [蓝色|lán sè] [的|de] ” 。', 'Look at the scarves: each dummy has a color. Say which one: «[红色|hóng sè] [的|de]» (the red one), «[蓝色|lán sè] [的|de]».'],
      pPositions: ['[这些|zhè xiē] [长得|zhǎng de] [一样|yī yàng] 。 [说|shuō] [在|zài] [哪里|nǎ lǐ] ： [左边|zuǒ biān] 、 [中间|zhōng jiān] [还是|hái shì] [右边|yòu biān] 。', 'These look the same. Say where one is: on the left, in the middle or on the right.'],
      pMixed: ['[现在|xiàn zài] [全部|quán bù] [一起|yī qǐ] ： [动作|dòng zuò] 、 [颜色|yán sè] [和|hé] [位置|wèi zhì] 。', 'Now everything together: actions, colors and places.'],
      pDodge: ['[还有|hái yǒu] ， [小心|xiǎo xīn] ！ [稻草人|dào cǎo rén] [有时|yǒu shí] [会|huì] [转|zhuàn] 。 [用|yòng] [方向键|fāng xiàng jiàn] [躲开|duǒ kāi] 。', 'And watch out! Sometimes a dummy spins. Dodge with the arrows.'],
      pGreat: ['[完美|wán měi] ！', 'Perfect!'],
      pGood: ['[很|hěn] [好|hǎo] ！', 'Very good!'],
      pFix: ['[差|chà] [一点|yī diǎn] ！ [再|zài] [来|lái] 。', 'Almost! Again.'],
      pMissed: ['[哎呀|āi yā] ！ [没关系|méi guān xi] ： [这|zhè] [是|shì] [练习|liàn xí] 。', 'Oops! No harm done: it’s practice.'],
      pRound: ['[再|zài] [来|lái] [一|yī] [轮|lún] ！ [换|huàn] [新|xīn] [的|de] [稻草人|dào cǎo rén] 。', 'Another round! New dummies.'],
      pWin: ['[全|quán] [倒|dǎo] [了|le] ！ [太|tài] [棒|bàng] [了|le] ！', 'All down! Excellent!'],
      pDone: ['[练|liàn] [得|de] [不错|bù cuò] ！ [随时|suí shí] [再|zài] [来|lái] 。', 'Good training! Come back any time.'],
      // the Corn Society: its leader thinks you're the Hush's spies, until you speak up
      bossIntro: ['[站住|zhàn zhù] ！ [不许|bù xǔ] [动|dòng] ！ [你们|nǐ men] [是|shì] [寂静|jì jìng] [派|pài] [来|lái] [的|de] ！', 'Halt! Freeze! You’re from the Hush!'],
      bossName: ['[我|wǒ] [是|shì] [玉米棒|yù mǐ bàng] [上校|shàng xiào] ！ [寂静|jì jìng] [别想|bié xiǎng] [进|jìn] [这里|zhè lǐ] ！', 'I’m Colonel Cob! The Hush doesn’t get in here!'],
      bossCall: ['[士兵们|shì bīng men] ， [集合|jí hé] ！', 'Soldiers, fall in!'],
      bossBounce: ['[哈|hā] ！ [我|wǒ] [的|de] [披风|pī fēng] [硬|yìng] [得|de] [很|hěn] ！', 'Ha! My cape is very hard!'],
      bossOpen: ['[够|gòu] [了|le] ！ [我|wǒ] [亲自|qīn zì] [来|lái] ！', 'Enough! Now I fight!'],
      bossHurt: ['[哎哟|āi yō] ， [我|wǒ] [的|de] [勋章|xūn zhāng] ！', 'Ow, my medal!'],
      bossClose: ['[隐蔽|yǐn bì] ！ [更多|gèng duō] [士兵|shì bīng] ！', 'Take cover! More soldiers!'],
      bossHeat: ['[着火|zháo huǒ] [了|le] ！ [地板|dì bǎn] [好|hǎo] [烫|tàng] ！', 'Fire! The floor is very hot!'],
      pop: ['[砰|pēng] ！', 'Pop!'],
      bossGiveUp: ['[我|wǒ] [投降|tóu xiáng] ！ [我|wǒ] [投降|tóu xiáng] ！', 'I give up! I give up!'],
      bossAfter: ['[你们|nǐ men] [不|bù] [是|shì] [寂静|jì jìng] [派|pài] [来|lái] [的|de] ？ [可|kě] [你们|nǐ men] [会|huì] [说话|shuō huà] ！ [真|zhēn] [勇敢|yǒng gǎn] ！', 'You’re not from the Hush? But you speak! How brave!'],
      psst: ['[嘘|xū] …', 'Psst…'],
      weak: ['[弱点|ruò diǎn] ！', 'Weak spot!'],
      hard: ['[好|hǎo] [硬|yìng] ！', 'It’s hard!'],
      sneak: ['[偷袭|tōu xí] ！', 'Surprise attack!'],
      noverb: ['[我|wǒ] [该|gāi] [做|zuò] [什么|shén me] ？', 'What do I do?'],
      which: ['[哪|nǎ] [一个|yī gè] ？', 'Which one?'],
      none: ['[在|zài] [哪里|nǎ lǐ] ？', 'Where?'],
      nopart: ['[那|nà] [在|zài] [哪里|nǎ lǐ] ？', 'Where’s that?'],
      win: ['[我们|wǒ men] [赢|yíng] [了|le] ！', 'We won!'],
      lose: ['[呼|hū] … [我们|wǒ men] [得|děi] [休息|xiū xi] [一下|yī xià] 。', 'Phew… we need a rest.'],
      flee: ['[快|kuài] [跑|pǎo] ！', 'Let’s go!'],
      throwWhat: ['[扔|rēng] [什么|shén me] ？', 'Throw what?'],
      tooSlow: ['[石头|shí tou] [太|tài] [重|zhòng] [了|le] ， [打|dǎ] [不|bù] [到|dào] [飞|fēi] [着|zhe] [的|de] ！', 'The stone is too heavy to hit a floater!'],
      // the Quarry Caves: echo bats and Mimo's song
      echoBack: ['[回声|huí shēng] ！ [它|tā] [把|bǎ] [话|huà] [扔|rēng] [回来|huí lái] [了|le] ！', 'Echo! It throws it right back at you!'],
      dazed: ['[它|tā] [晕|yūn] [了|le] ！', 'It’s dizzy!'],
      singing: ['[啦啦啦|lā lā lā] ！', 'La, la, laaa!'],
      screech: ['[吱|zhī] ！', 'Eeeek!'],
      copyCat: ['[别|bié] [再|zài] [说|shuō] [一样|yī yàng] [的|de] [了|le] ！', 'Not the same thing again!'],
    },
    // the Coach gives a whole sentence to copy: «推犰狳！», «吃苹果！»
    sayEx: ex => [`[跟|gēn] [它|tā] [说|shuō] ： “ ${ex} ”`, `Tell it: «${ex}»`],
    coins: { one: '[金币|jīn bì]', many: '[金币|jīn bì]' },
    weakNow: p => [`[现在|xiàn zài] ${L.zh.parts[p].w} [在|zài] [发光|fā guāng] ！`, `Now the ${L.zh.parts[p].en} is glowing!`],
    unknown: w => [`“ ${w} ” ？`, `doesn’t know “${w}” yet`],
    // a new kind of creature shows up: its name (and the measure word it takes)
    meet: k => {
      const s = L.zh.species[k];
      if (k === 'colonel') return [`[他|tā] [是|shì] ${s.name} ， [他们|tā men] [的|de] [首领|shǒu lǐng] 。 [写|xiě] “ ${s.w} ” 。`, `It’s Colonel Cob, the leader. Type «${s.w}».`];
      if (k === 'dummy') return [`[这|zhè] [是|shì] [练习|liàn xí] [用|yòng] [的|de] [稻草人|dào cǎo rén] 。 [写|xiě] “ ${s.w} ” 。`, `This is the practice dummy. Type «${s.w}».`];
      return [`[看|kàn] ！ [一|yī] ${cl(s.cl)} ${s.w} 。 [写|xiě] “ ${s.w} ” 。`, `Look! ${/^[aeiou]/.test(s.en) ? 'An' : 'A'} ${s.en}: «${s.w}». Type «${s.w}».`];
    },
    meetTip: k => { const s = L.zh.species[k]; return `A new creature: «${s.w}» (the ${s.en}). Copy it · with 这, 那 or a number it takes «${cl(s.cl)}»: «[一|yī] ${cl(s.cl)} ${s.w}».`; },
    // a color word, shown on one of them: «这颗玉米粒是白色的：“白色”。写“白色”。»
    colorIs: (key, k) => { const s = L.zh.species[k], A = L.zh.adjs[key].forms[0].m; return [`[这|zhè] ${cl(s.cl)} ${s.w} [是|shì] ${A} [的|de] ： “ ${A} ” 。 [写|xiě] “ ${A} ” 。`, `This ${s.en} is ${L.zh.adjs[key].en}: «${A}». Type «${A}».`]; },
    // what the words in the Coach's lines mean (hover), keyed by their characters
    gloss: {
      你好: 'hi', 我: 'I', 专门: 'specially', 训练: 'train', 像: 'like', 这样: 'this way (像…这样 = like …)', 的: '(joins a description to a noun)', 伙伴: 'partner',
      先: 'first', 学: 'learn', 一个: 'one / a', 动作: 'action', 看: 'look / watch', 好: 'good / well', 了: '(done, now)', 跳: 'jump', 你: 'you', 来: 'come (你来 = your turn)',
      写: 'write / type', 很: 'very', 现在: 'now', 不: 'not', 提示: 'hint', 教: 'teach', 给: 'to (give)', 它: 'it', 第一: 'first', 个: '(measure word)', 词: 'word',
      小心: 'careful', 一: 'one / a', 只: '(measure word for animals)', 小默默: 'hushling (little quiet one)', 告诉: 'tell', 该: 'should', 做: 'do', 什么: 'what',
      听: 'listen', 会: 'will / can', 喊: 'shout', 出: 'out', 要: 'is going to / want', 从: 'from', 哪里: 'where', 攻击: 'attack', 再: 'again / then', 打: 'hit',
      两: 'two', 两个: 'both (two)', 都: 'all / both', 用: 'use / with', 一下: 'a bit / once', 赢: 'win', 得: '(how it went)', 真: 'really', 快: 'fast / quick', 有: 'there is / has',
      这: 'this', 是: 'is', 红色: 'red', 那: 'that', 蓝色: 'blue', 把: '(puts who first)', 这个: 'this', 颜色: 'color', 说: 'say', 谁: 'who', 准: 'accurate',
      哇: 'whoa', 大默默: 'big hushling', 大: 'big', 啊: '(oh!)', 尾巴: 'tail', 在: 'is …ing / at', 发光: 'glow', 弱点: 'weak spot', 移动: 'move', 头: 'head',
      成功: 'succeed', 正好: 'just right', 中: 'hit (the mark)', 哎哟: 'ouch', 深呼吸: 'deep breath', 一次: 'once', 招: 'trick', 早: 'long ago', 就: 'already', 知道: 'know',
      真的: 'really', 吗: '(question)', 朋友: 'friend', 可怕: 'scary', 真可怜: 'poor thing', 可怜: 'poor (pitiful)', 飞: 'fly', 最好: 'better', 上去: 'up (onto it)', 生气: 'angry',
      又: 'again', 睡着: 'asleep', 掉: 'fall', 下来: 'down', 下: '(now)', 够得着: 'can reach', 起来: 'up', 硬: 'hard', 壳: 'shell', 那个: 'that', 字母: 'letter',
      就是: 'is (exactly)', 分数: 'grade', 满分: 'full marks', 更: 'more', 重: 'heavy / hard', 不过: 'but', 可以: 'can', 推倒: 'push over', 推: 'push', 缩成: 'curl into',
      硬球: 'hard ball', 球: 'ball', 肚子: 'belly', 朝天: 'facing up', 整个: 'the whole', 饿: 'hungry', 包: 'bag', 里: 'in', 吃: 'eat', 啊呜: 'munch', 好吃: 'tasty',
      吃饱: 'full (of food)', 没有: 'there isn’t', 不能: 'can’t', 它们: 'they', 长得: 'look', 一样: 'the same', 分不清: 'can’t tell apart', 左边: 'left', 中间: 'middle',
      还是: 'or', 右边: 'right', 每: 'every', 轮: 'turn / round', 之后: 'after', 青蛙: 'frog', 跳到: 'jump onto', 别的: 'other', 荷叶: 'lily pad', 上: 'on',
      之前: 'before', 清楚: 'clearly', 换: 'change', 位置: 'place', 哪: 'which', 呱呱: 'ribbit', 我们: 'we', 稻草人: 'straw dummy', 练习: 'practice', 练: 'practice',
      每次: 'every time', 围巾: 'scarf', 一种: 'a kind of', 这些: 'these', 全部: 'all', 一起: 'together', 和: 'and', 还有: 'also', 有时: 'sometimes', 转: 'spin',
      方向键: 'arrow keys', 躲开: 'dodge', 完美: 'perfect', 差: 'short of', 一点: 'a little', 哎呀: 'oops', 没关系: 'no problem', 新: 'new', 全: 'all', 倒: 'down (fallen)',
      太: 'so / too', 棒: 'great', 不错: 'good', 随时: 'any time', 站住: 'halt', 不许: 'not allowed', 动: 'move', 你们: 'you (all)', 寂静: 'the Hush (silence)', 派: 'send',
      玉米棒: 'corn cob', 上校: 'colonel', 别想: 'no way (don’t even think of it)', 进: 'come in', 这里: 'here', 士兵们: 'soldiers', 士兵: 'soldier', 集合: 'fall in', 哈: 'ha',
      披风: 'cape', 够: 'enough', 亲自: 'myself', 勋章: 'medal', 隐蔽: 'take cover', 更多: 'more', 着火: 'on fire', 地板: 'floor', 烫: 'hot', 砰: 'pop',
      投降: 'give up', 可: 'but', 说话: 'speak', 勇敢: 'brave', 嘘: 'psst', 偷袭: 'surprise attack', 休息: 'rest', 跑: 'run', 呼: 'phew', 玉米粒: 'kernel', 爆米花: 'popcorn',
      蛾子: 'moth', 甲虫: 'beetle', 犰狳: 'armadillo', 翅膀: 'wing', 石头: 'stone', 苹果: 'apple', 面包: 'bread', 蝙蝠: 'bat', 回声: 'echo', 话: 'words', 扔: 'throw',
      回来: 'back', 晕: 'dizzy', 啦啦啦: 'la la la', 唱歌: 'sing', 首领: 'leader', 金币: 'coins', 跟: 'to (tell it)', 他: 'he', 他们: 'they (his)', 别: 'don’t', 怕: 'be afraid',
      打架: 'fight', 伤害: 'hurt', 不会: 'won’t', 吱: 'eek', 想: 'want',
    },
  };

  // ---------------------------------------------------------------- Japanese
  L.ja = {
    code: 'ja', cjk: true, name: '日本語', variety: 'Standard Japanese', idk: true,
    arts: {}, preps: [], voc: [], fillers: [], conj: [], talk: [], copulas: {}, floatRel: [], joiner: '、 それから',
    species: {
      hushling: { w: 'だまりっこ', en: 'hushling', g: 'm' },
      hushbig: { w: '[大|おお]だまりっこ', en: 'big hushling', g: 'm' },
      moth: { w: '[蛾|が]', en: 'moth', g: 'm', alt: ['ガ'] },
      beetle: { w: 'カブトムシ', en: 'beetle', g: 'm', alt: ['[甲虫|こうちゅう]', 'かぶとむし'] },
      armadillo: { w: 'アルマジロ', en: 'armadillo', g: 'm', kata: true },
      frog: { w: 'カエル', en: 'frog', g: 'm', alt: ['[蛙|かえる]'], kata: true },
      dummy: { w: 'かかし', en: 'dummy', g: 'm', alt: ['[案山子|かかし]', 'わら[人形|にんぎょう]'] },
      kernel: { w: 'コーン', en: 'kernel', g: 'm', alt: ['コーン の [粒|つぶ]'], kata: true },
      popcorn: { w: 'ポップコーン', en: 'popcorn', g: 'm', kata: true },
      colonel: { w: '[大佐|たいさ]', en: 'colonel', g: 'm', name: 'トウモロコシ [大佐|たいさ]', alt: ['トウモロコシ [大佐|たいさ]'] },
      bat: { w: 'コウモリ', en: 'bat', g: 'm', alt: ['[蝙蝠|こうもり]'], kata: true },
    },
    // where one stands in the row, as you see it: «左のカエル», «真ん中の», «右にいるカエル»
    positions: {
      left: { w: '[左|ひだり]', en: 'left', alt: ['[左側|ひだりがわ]'] },
      middle: { w: '[真|ま]ん[中|なか]', en: 'middle', alt: ['まんなか', '[中央|ちゅうおう]'] },
      right: { w: '[右|みぎ]', en: 'right', alt: ['[右側|みぎがわ]'] },
    },
    parts: {
      head: { w: '[頭|あたま]', g: 'm', en: 'head' },
      tail: { w: 'しっぽ', g: 'm', en: 'tail', alt: ['[尻尾|しっぽ]'] },
      shell: { w: '[甲羅|こうら]', g: 'm', en: 'shell', alt: ['[殻|から]'] },
      wing: { w: '[羽|はね]', pl: '[羽|はね]', g: 'm', en: 'wing', alt: ['[翼|つばさ]'] },
    },
    // cj styles: i (an い-adjective: 赤い), na (大きな), noun (a color noun that takes の: 赤の, 緑の), bad (緑い: there's no
    // such word), state (寝ている: it goes straight before the noun, like a little clause)
    adjs: {
      red: { forms: [{ m: '[赤|あか]い', f: '[赤|あか]い' }], en: 'red', cj: [['[赤|あか]い', 'i'], ['[赤|あか]', 'noun'], ['[赤色|あかいろ]', 'noun']] },
      blue: { forms: [{ m: '[青|あお]い', f: '[青|あお]い' }], en: 'blue', cj: [['[青|あお]い', 'i'], ['[青|あお]', 'noun'], ['[青色|あおいろ]', 'noun']] },
      green: { forms: [{ m: '[緑|みどり]', f: '[緑|みどり]' }], en: 'green', cj: [['[緑|みどり]', 'noun'], ['[緑色|みどりいろ]', 'noun'], ['[緑|みどり]い', 'bad']] },
      yellow: { forms: [{ m: '[黄色|きいろ]い', f: '[黄色|きいろ]い' }], en: 'yellow', cj: [['[黄色|きいろ]い', 'i'], ['[黄色|きいろ]', 'noun']] },
      white: { forms: [{ m: '[白|しろ]い', f: '[白|しろ]い' }], en: 'white', cj: [['[白|しろ]い', 'i'], ['[白|しろ]', 'noun'], ['[白色|しろいろ]', 'noun']] },
      big: { forms: [{ m: '[大|おお]きい', f: '[大|おお]きい' }], en: 'big', cj: [['[大|おお]きい', 'i'], ['[大|おお]きな', 'na']] },
      small: { forms: [{ m: '[小|ちい]さい', f: '[小|ちい]さい' }], en: 'small', cj: [['[小|ちい]さい', 'i'], ['[小|ちい]さな', 'na']] },
      asleep: { forms: [{ m: '[寝|ね]ている', f: '[寝|ね]ている' }], en: 'asleep', state: true, cj: [['[寝|ね]ている', 'state'], ['[寝|ね]てる', 'state'], ['[眠|ねむ]っている', 'state'], ['[眠|ねむ]ってる', 'state']] },
      angry: { forms: [{ m: '[怒|おこ]っている', f: '[怒|おこ]っている' }], en: 'angry', state: true, cj: [['[怒|おこ]っている', 'state'], ['[怒|おこ]ってる', 'state']] },
    },
    // cj: [form, te | imp (both fine) | dict | masu | bad (not a request: a te-form slip), 'wo' when it takes を instead of に
    // (踏んで: stomp on it)]
    verbs: {
      jump: { show: '[跳|と]んで', forms: ['[跳|と]んで'], en: 'jump', cj: [['[跳|と]んで', 'te'], ['[飛|と]んで', 'te'], ['ジャンプ して', 'te'], ['[跳|と]べ', 'imp'], ['[飛|と]べ', 'imp'], ['ジャンプ しろ', 'imp'], ['ジャンプ', 'imp'],
        ['[跳|と]ぶ', 'dict'], ['[飛|と]ぶ', 'dict'], ['ジャンプ する', 'dict'], ['[跳|と]びます', 'masu'], ['[飛|と]びます', 'masu'], ['ジャンプ します', 'masu'], ['[跳|と]びて', 'bad'], ['[跳|と]んて', 'bad'],
        ['[踏|ふ]んで', 'te', 'wo'], ['[踏|ふ]め', 'imp', 'wo'], ['[踏|ふ]む', 'dict', 'wo'], ['[踏|ふ]みつけて', 'te', 'wo']] },
      hit: { show: '[打|う]って', forms: ['[打|う]って'], en: 'hit', cj: [['[打|う]って', 'te'], ['[叩|たた]いて', 'te'], ['[殴|なぐ]って', 'te'], ['パンチ して', 'te'], ['アタック して', 'te'], ['パンチ', 'imp'],
        ['[打|う]て', 'imp'], ['[叩|たた]け', 'imp'], ['[殴|なぐ]れ', 'imp'], ['[打|う]つ', 'dict'], ['[叩|たた]く', 'dict'], ['[殴|なぐ]る', 'dict'], ['パンチ する', 'dict'],
        ['[打|う]ちます', 'masu'], ['[叩|たた]きます', 'masu'], ['[殴|なぐ]ります', 'masu'], ['[打|う]ちて', 'bad'], ['[打|う]つて', 'bad'], ['[叩|たた]きて', 'bad'], ['[叩|たた]って', 'bad'], ['[殴|なぐ]りて', 'bad']] },
      push: { show: '[押|お]して', forms: ['[押|お]して'], en: 'push', cj: [['[押|お]して', 'te'], ['ひっくり[返|かえ]して', 'te'], ['[押|お]し[倒|たお]して', 'te'], ['[押|お]せ', 'imp'], ['[押|お]す', 'dict'], ['[押|お]します', 'masu'],
        ['[押|お]しって', 'bad'], ['[押|お]すて', 'bad']] },
      eat: { show: '[食|た]べて', forms: ['[食|た]べて'], en: 'eat', cj: [['[食|た]べて', 'te'], ['[食|た]べろ', 'imp'], ['お[食|た]べ', 'imp'], ['[食|た]べる', 'dict'], ['[食|た]べます', 'masu'], ['[食|た]べって', 'bad']] },
      sing: { show: '[歌|うた]って', forms: ['[歌|うた]って'], en: 'sing', cj: [['[歌|うた]って', 'te'], ['[歌|うた]え', 'imp'], ['[歌|うた]う', 'dict'], ['[歌|うた]います', 'masu'], ['[歌|うた]いて', 'bad']] },
    },
    stone: { w: '[石|いし]', g: 'm', en: 'stone', tag: '[石|いし]', alt: ['[小石|こいし]'] },
    talkCJ: [
      { id: 'nofight', p: ['けんか したくない', 'けんか しない', 'けんか は しない', 'けんか は やめよう', 'たたかいたくない', 'たたかわない'] },
      { id: 'friends', p: ['ともだち', 'なかま'] },
      { id: 'calm', p: ['こわくない', 'こわがらないで', 'だいじょうぶ', 'おちついて'] },
      { id: 'nohurt', p: ['いじめない', 'きずつけない', 'なにも しない'] },
    ],
    autoTalk: ['だいじょうぶ 、 けんか したくない よ 。', 'ともだち だ よ 。', 'いじめない よ 。'],
    shout(tier, toMimo, high) {
      const where = high ? '[上|うえ]' : '[下|した]', wEn = high ? 'from up high' : 'from down low';
      if (tier <= 1) return high ? ['[上|うえ] だ ！', 'Up high!'] : ['[下|した] だ ！', 'Down low!'];
      if (tier === 2) return toMimo ? [`デカ[耳|みみ] 、 ${where} から いく ぞ ！`, `Big-ears, here I come ${wEn}!`] : [`${where} から いく ぞ ！`, `Here I come ${wEn}!`];
      const spot = high ? '[頭|あたま]' : '[足|あし]', en = high ? 'head' : 'feet';
      return toMimo ? [`デカ[耳|みみ] 、 ${spot} を ねらう ぞ ！`, `Big-ears, I’m going for your ${en}!`] : [`${spot} を ねらう ぞ ！`, `I’m going for your ${en}!`];
    },
    dodgeWords: tier => (tier >= 3 ? { high: '[頭|あたま]', low: '[足|あし]' } : { high: '[上|うえ]', low: '[下|した]' }),
    labels: { floating: '[浮|う]いてる', shy: 'はずかしがり', weak: '[弱点|じゃくてん]', calm: 'おだやか', down: 'たおれてる', back: 'ひっくり[返|かえ]ってる', capeShut: 'マント が [閉|と]じてる', capeOpen: 'マント が [開|ひら]いてる' },
    labelsF: {},
    stateLbl: { asleep: ['[寝|ね]てる', '[寝|ね]てる'], angry: ['[怒|おこ]ってる', '[怒|おこ]ってる'] },
    examples: { 1: '[跳|と]んで ！', 2: '[赤|あか]い の を [打|う]って ！', 3: 'しっぽ を [打|う]って ！' },
    frames: {
      verb: { text: '[跳|と]んで ！ · [打|う]って ！', pat: 'verb' },
      jumpT: { text: '___ やつ に [跳|と]んで ！', pat: 'jump+target' },
      hitT: { text: '___ の を [打|う]って ！', pat: 'hit+target' },
      partT: { text: 'しっぽ を [打|う]って · [頭|あたま] に [跳|と]んで', pat: 'part' },
      talk: { text: 'けんか したくない よ · ともだち だ よ', pat: 'talk' },
      mothT: { text: '___ [蛾|が] に [跳|と]んで ！', pat: 'jump+target' },
      wingT: { text: '[羽|はね] を [打|う]って ！', pat: 'part' },
      beetleT: { text: 'カブトムシ の [頭|あたま] を [打|う]って ！', pat: 'part' },
      pushT: { text: '___ アルマジロ を [押|お]して ！', pat: 'push+target' },
      frogT: { text: '___ カエル に [跳|と]んで ！', pat: 'jump+target' },
      posT: { text: '[左|ひだり] の · [真|ま]ん[中|なか] の · [右|みぎ] の', pat: 'position' },
      dummyT: { text: '___ かかし を [打|う]って ！', pat: 'hit+target' },
      kernelT: { text: '___ コーン を [打|う]って ！', pat: 'hit+target' },
      popT: { text: '___ ポップコーン に [跳|と]んで ！', pat: 'jump+target' },
      bossT: { text: '[大佐|たいさ] を [打|う]って ！', pat: 'hit+target' },
      batT: { text: '___ コウモリ を [打|う]って ！', pat: 'hit+target' },
      singT: { text: '[歌|うた]って ！', pat: 'verb' },
      instrT: { text: '[石|いし] で ___ を [打|う]って ！', pat: 'instrument' },
    },
    tips: {
      target: 'Say who: «[赤|あか]い [蛾|が] を [打|う]って» (hit the red moth). On its own, add の: «[赤|あか]い の を [打|う]って» (the red one). い-adjectives go straight before the noun, with nothing between: «[大|おお]きい カエル». 緑 is a noun, so it takes の: «[緑|みどり] の カエル».',
      boss: 'His husk cape is closed: hits just bounce off. Beat his soldiers first («[黄色|きいろ]い コーン を [打|う]って»); then he opens the cape to attack, and that’s when you hit him: «[大佐|たいさ] を [打|う]って».',
      popcorn: 'The floor is hot: the kernels popped! «コーン» is now «ポップコーン»: «[白|しろ]い ポップコーン を [打|う]って». They hop to new spots every turn.',
      position: 'They look the same? Say where it is, as you see it: «[左|ひだり]» (left), «[真|ま]ん[中|なか]» (middle), «[右|みぎ]» (right), joined to the noun with の: «{ex}».',
      frog: 'Frogs hop to another lily pad after every turn, so «[左|ひだり] の カエル» may be a different frog next time. Look before you speak!',
      parts: 'Name the part: «しっぽ を [打|う]って», «[頭|あたま] に [跳|と]んで». Whose? Join them with の: «カブトムシ の [頭|あたま] を [打|う]って».',
      shy: 'This one is shy. Talk instead of fighting: «けんか したくない よ», «ともだち だ よ», «こわくない よ».',
      twist: '“With” is で: «[石|いし] で [赤|あか]い [蛾|が] を [打|う]って». A thrown stone flies, so it reaches floating moths too.',
      moth: 'Moths float: «[打|う]って» can’t reach them, «[跳|と]んで» can: «[赤|あか]い [蛾|が] に [跳|と]んで» (に: where you land). Hit the wings to knock one down: «[羽|はね] を [打|う]って».',
      beetle: 'Beetles have a hard shell (½ damage). Aim for the head: «カブトムシ の [頭|あたま] を [打|う]って».',
      armadillo: 'Armadillos roll up into a hard ball (⅓ damage). Push one over: «アルマジロ を [押|お]して». On its back it can’t attack, and its belly takes ×2, for one turn.',
      eat: 'Hungry? Feed {name} from the bag: «りんご を [食|た]べて», «パン を [食|た]べて». It heals ♥, and it takes your turn.',
      bat: 'Echo bats copy what you say: say the same thing twice in a row and they throw it right back at you! Change the action or the words every time. A song («[歌|うた]って») leaves them dizzy for a turn.',
      sing: 'Mimo’s song («[歌|うた]って») reaches every foe at once: a little for each, more for Hushlings, and echo bats get dizzy. It wakes up sleepers, too.',
    },
    why: {
      spelling: 'Spelling: a sound (or a kanji) was off. Compare the two lines: what changed is underlined.',
      wo: 'The one you act on takes を: «[赤|あか]い [蛾|が] を [打|う]って», «アルマジロ を [押|お]して», «りんご を [食|た]べて». With が or は it would be the one doing it.',
      woDrop: 'In casual speech を is often left out, but say it for an S: «[赤|あか]い [蛾|が] を [打|う]って».',
      ni: 'Where you land takes に: «[赤|あか]い [蛾|が] に [跳|と]んで» (or «… の [上|うえ] に»). With を, «[跳|と]んで» means jumping over it. To stomp on it: «[赤|あか]い [蛾|が] を [踏|ふ]んで».',
      niDrop: 'Say where you land, with に, for an S: «[赤|あか]い [蛾|が] に [跳|と]んで».',
      iAdj: 'Adjectives: an い-adjective goes straight before the noun, with nothing between: «[赤|あか]い [蛾|が]», «[大|おお]きい カエル» (not «[赤|あか]い の [蛾|が]»). On its own it takes の: «[赤|あか]い の を [打|う]って» (the red one). 緑 isn’t an い-adjective, so it takes の: «[緑|みどり] の [蛾|が]».',
      no: 'の joins whose and where to the noun: «カエル の [頭|あたま]» (the frog’s head), «[左|ひだり] の カエル» (the frog on the left).',
      deP: '“With” is で: «[石|いし] で [赤|あか]い [蛾|が] を [打|う]って». (と means “together with”, like a friend coming along.)',
      teForm: 'Asking Mimo to do something takes the te-form: «[跳|と]んで», «[打|う]って», «[押|お]して», «[食|た]べて» (add ください to be polite). The dictionary form («[打|う]つ») or ます («[打|う]ちます») only says what happens.',
      order: 'In Japanese the verb comes last: «[赤|あか]い [蛾|が] を [打|う]って», and a description goes before its noun: «[左|ひだり] の カエル», not «カエル [左|ひだり]».',
      style: '',
      position: 'Where it is: as you see it on the screen: «[左|ひだり]» (left), «[真|ま]ん[中|なか]» (middle), «[右|みぎ]» (right), joined to the noun with の: «[左|ひだり] の カエル». Frogs hop to another lily pad after every turn, so look again before you say where one is.',
      which: 'Which one? When two or more look the same (same kind, same color), say where the one you mean is: «[左|ひだり] の カエル», «[真|ま]ん[中|なか] の», «[右|みぎ] の だまりっこ».',
      none: 'Mimo couldn’t find one like that. Check the colors and sizes on their labels.',
    },
    slip: { spelling: 'Spelling slip', wo: 'を slip', ni: 'に slip', iAdj: 'Adjective slip', no: 'の slip', deP: 'で slip', teForm: 'Not the te-form', order: 'Word-order slip' },
    soft: {},
    nice: 'カンペキ ！',
    teachHint: chars => (chars ? 'What’s the word? Type it in rōmaji, Space for kanji and katakana. Stuck? Tab = a hint · ? = I don’t know.'
      : 'What’s the word? Type it in rōmaji (long vowels are optional). Stuck? Tab = a hint · ? = I don’t know.'),
    cmdHint: 'Enter = send · Space at the hit = PERFECT · ↑ / ↓ = dodge · ? = an example',
    t: {
      hello: ['こんにちは ！ {mimo} みたい な [仲間|なかま] を [鍛|きた]える の が わたし の [仕事|しごと] です 。', 'Hi! I train partners like {name}.'],
      watchJump: ['まず は [動|うご]き を [一|ひと]つ 。 [見|み]て ください ： [跳|と]んで ！', 'First, an action. Watch: «[跳|と]んで» (jump)!'],
      echoJump: ['「 [跳|と]んで 」 。 [今度|こんど] は あなた が 「 [跳|と]んで 」 と [書|か]いて ください 。', '«[跳|と]んで» (jump). Now you: type «[跳|と]んで».'],
      teach: ['いい です ね ！ [今度|こんど] は [見|み]ない で {mimo} に [教|おし]えて ください 。', 'Very good! Now teach it to {name}, no peeking.'],
      firstWord: ['[初|はじ]めて の [言葉|ことば] です ！', 'Its first word!'],
      foeIn: ['[気|き] を つけて ！ だまりっこ です 。 {mimo} に どう する か [言|い]って ください 。', 'Careful! A hushling («だまりっこ»). Tell {name} what to do.'],
      listen: ['よく [聞|き]いて ！ どこ を [狙|ねら]う か 、 [叫|さけ]びます よ 。', 'Listen! It shouts where it will attack.'],
      newHit: ['もう [一|ひと]つ の [言葉|ことば] ！ [見|み]て ： [打|う]って ！', 'Another word! Watch: «[打|う]って» (hit)!'],
      echoHit: ['「 [打|う]って 」 。 「 [打|う]って 」 と [書|か]いて ください 。', '«[打|う]って» (hit). Type «[打|う]って».'],
      twoWords: ['{mimo} は もう [二|ふた]つ の [言葉|ことば] を [知|し]って います ！ [両方|りょうほう] [使|つか]って ください 。', '{name} knows two words now! Use both.'],
      winVerbs: ['[勝|か]ちました ！ {mimo} は [覚|おぼ]える の が [早|はや]い です ね 。', 'You won! {name} learns fast.'],
      twoFoes: ['[今度|こんど] は だまりっこ が [二匹|にひき] 。 こっち は [赤|あか]い …', 'Now there are two hushlings. This one is red…'],
      twoFoesB: ['… こっち は [青|あお]い です 。', '…and this one is blue.'],
      echoRed: ['「 [赤|あか]い 」 。 「 [赤|あか]い 」 と [書|か]いて ください 。', '«[赤|あか]い» (red). Type «[赤|あか]い».'],
      echoBlue: ['「 [青|あお]い 」 。 「 [青|あお]い 」 と [書|か]いて ください 。', '«[青|あお]い» (blue). Type «[青|あお]い».'],
      teachColor: ['[今度|こんど] は {mimo} に [色|いろ] を [教|おし]えて ください 。', 'Now teach {name} the color.'],
      sayWho: ['[相手|あいて] を [言|い]う とき は ： 「 [赤|あか]い の を [打|う]って ！ 」', 'To say who: «[赤|あか]い の を [打|う]って ！» (hit the red one!)'],
      yourTurn: ['あなた の [番|ばん] です ！', 'Your turn!'],
      winTargets: ['お[見事|みごと] ！ ねらいどおり です 。', 'Great aim!'],
      bigOne: ['うわ 、 [大|おお]だまりっこ だ ！ [大|おお]きい です ね 。', 'Whoa, a big hushling («[大|おお]だまりっこ»)! It’s huge.'],
      lookTail: ['しっぽ を [見|み]て 。 [光|ひか]って います ！ あれ が [弱点|じゃくてん] です 。', 'Look at its tail. It’s glowing! That’s its weak spot.'],
      echoTail: ['「 しっぽ 」 。 「 しっぽ 」 と [書|か]いて ください 。', '«しっぽ» (tail). Type «しっぽ».'],
      teachWord: ['[今度|こんど] は {mimo} に その [言葉|ことば] を [教|おし]えて ください 。', 'Now teach {name} the word.'],
      sayPart: ['こう [言|い]って ： 「 しっぽ を [打|う]って ！ 」', 'Tell it: «しっぽ を [打|う]って ！» (hit the tail!)'],
      weakMoves: ['[気|き] を つけて ！ [弱点|じゃくてん] は [動|うご]きます よ 。', 'Watch out! The weak spot moves.'],
      lookHead: ['[今度|こんど] は [頭|あたま] が [光|ひか]って います 。 「 [頭|あたま] 」 。 「 [頭|あたま] 」 と [書|か]いて ください 。', 'Now its head is glowing. «[頭|あたま]» (head). Type «[頭|あたま]».'],
      winParts: ['やりました ね ！ [弱点|じゃくてん] に ぴったり [当|あ]たりました 。', 'You did it! Right on the weak spot.'],
      retry: ['いたた ！ [深呼吸|しんこきゅう] して 。 もう [一度|いちど] 。', 'Ouch! Breathe. Let’s go again.'],
      catchOn: ['その [手|て] は もう [知|し]ってる ぞ ！', 'I already know that trick!'],
      shyReally: ['ほんと … ？', 'Really…?'],
      shyJoin: ['ともだち ？ ともだち ！', 'Friends? Friends!'],
      shyVoice: ['こ … こんにちは ！', 'H… hello!'],
      shyAgain: ['…', '…'],
      shyScared: ['ひゃっ ！ こわい ！', 'Eek! So scary!'],
      poorShy: ['かわいそう に …', 'Poor little thing…'],
      floating: ['[浮|う]いてる ！ [跳|と]んだ ほう が いい よ 。', 'It’s floating! Better jump.'],
      nowAngry: ['[怒|おこ]っちゃった ！', 'Now it’s angry!'],
      sleepAgain: ['また [寝|ね]ちゃった 。', 'It fell asleep again.'],
      mothDown: ['[落|お]ちた ！ これ なら [届|とど]く ！', 'It fell! Now I can reach it!'],
      mothUp: ['また [飛|と]んだ ！', 'It’s flying again!'],
      shellHard: ['[固|かた]い [甲羅|こうら] ！ [頭|あたま] の ほう が いい 。', 'What a hard shell! Better the head.'],
      gradeIntro: ['その [文字|もじ] が [評価|ひょうか] です ！ S は [満点|まんてん] ： [攻撃|こうげき] が [強|つよ]く なります 。', 'That letter is your grade! S is perfect: the hit is stronger.'],
      watchPush: ['[固|かた]い [甲羅|こうら] です ね 。 でも ひっくり[返|かえ]せます 。 [見|み]て ： [押|お]して ！', 'What a hard shell! But you can flip it over. Watch: «[押|お]して» (push)!'],
      echoPush: ['「 [押|お]して 」 。 「 [押|お]して 」 と [書|か]いて ください 。', '«[押|お]して» (push). Type «[押|お]して».'],
      curledHard: ['かたい ボール に なっちゃった ！ まず [押|お]して ！', 'It’s a hard little ball! Push it first.'],
      flipped: ['ひっくり[返|かえ]った ！ [今|いま] だ 、 おなか を ！', 'It’s on its back! Now, the belly!'],
      rollBack: ['また [丸|まる]まっちゃった ！', 'It rolled up into a ball again!'],
      pushWhole: ['[全部|ぜんぶ] ？', 'All of it?'],
      hungry: ['{mimo} は おなか が すいて います ！ かばん に [食|た]べ[物|もの] が あります 。 [見|み]て ： [食|た]べて ！', '{name} is hungry! There’s food in the bag. Watch: «[食|た]べて» (eat)!'],
      echoEat: ['「 [食|た]べて 」 。 「 [食|た]べて 」 と [書|か]いて ください 。', '«[食|た]べて» (eat). Type «[食|た]べて».'],
      munch: ['もぐもぐ ！', 'Munch, munch!'],
      yum: ['おいしい ！', 'Yummy!'],
      full: ['おなか いっぱい ！', 'I’m full!'],
      eatWhat: ['[何|なに] を [食|た]べる の ？', 'Eat what?'],
      noFood: ['ない よ ！', 'There isn’t any!'],
      notFood: ['それ は [食|た]べられない よ ！', 'That’s not for eating!'],
      posIntro: ['そっくり です ね ！ {mimo} に は [見分|みわ]けられません 。 どこ に いる か [教|おし]えて ： [左|ひだり] 、 [真|ま]ん[中|なか] 、 [右|みぎ] 。', 'They look the same! {name} can’t tell which is which. Tell it where one is: on the left («[左|ひだり]»), in the middle («[真|ま]ん[中|なか]») or on the right («[右|みぎ]»).'],
      posIntro2: ['そっくり です ね ！ {mimo} に は [見分|みわ]けられません 。 どこ に いる か [教|おし]えて ： [左|ひだり] か [右|みぎ] 。', 'They look the same! {name} can’t tell which is which. Tell it where one is: on the left («[左|ひだり]») or on the right («[右|みぎ]»).'],
      posLeft: ['[左|ひだり] に いる の は ： 「 [左|ひだり] 」 。 「 [左|ひだり] 」 と [書|か]いて ください 。', 'On the left: «[左|ひだり]». Type «[左|ひだり]».'],
      posMiddle: ['[真|ま]ん[中|なか] に いる の は ： 「 [真|ま]ん[中|なか] 」 。 「 [真|ま]ん[中|なか] 」 と [書|か]いて ください 。', 'In the middle: «[真|ま]ん[中|なか]». Type «[真|ま]ん[中|なか]».'],
      posRight: ['[右|みぎ] に いる の は ： 「 [右|みぎ] 」 。 「 [右|みぎ] 」 と [書|か]いて ください 。', 'On the right: «[右|みぎ]». Type «[右|みぎ]».'],
      frogsHop: ['[気|き] を つけて ！ カエル は [毎|まい]ターン 、 [別|べつ] の [葉|は]っぱ に [跳|と]び[移|うつ]ります 。 [言|い]う [前|まえ] に よく [見|み]て 。', 'Watch out! Frogs hop from pad to pad after every turn. Look carefully before you speak.'],
      swapped: ['[場所|ばしょ] が [変|か]わった ！', 'They switched places!'],
      whichOne: ['どれ ？', 'Which one?'],
      croak: ['ケロケロ ！', 'Ribbit!'],
      pHello: ['こんにちは ！ かかし で [練習|れんしゅう] しましょう 。', 'Hi! Let’s train with the dummies.'],
      pVerbs: ['まず は [動|うご]き ： [跳|と]んで 、 [打|う]って … [毎回|まいかい] [変|か]えて ください ！', 'First, the actions: jump, hit… Change the action every time!'],
      pColors: ['マフラー を [見|み]て ： かかし は それぞれ [色|いろ] が [違|ちが]います 。 どれ か [言|い]って ： 「 [赤|あか]い の 」 、 「 [青|あお]い の 」 。', 'Look at the scarves: each dummy has a color. Say which one: «[赤|あか]い の» (the red one), «[青|あお]い の».'],
      pPositions: ['これ は そっくり です 。 どこ か [言|い]って ： [左|ひだり] 、 [真|ま]ん[中|なか] 、 [右|みぎ] 。', 'These look the same. Say where one is: on the left, in the middle or on the right.'],
      pMixed: ['[今度|こんど] は [全部|ぜんぶ] いっしょ ： [動|うご]き 、 [色|いろ] 、 [場所|ばしょ] 。', 'Now everything together: actions, colors and places.'],
      pDodge: ['それから 、 [気|き] を つけて ！ かかし が [回|まわ]る こと が あります 。 [矢印|やじるし] キー で よけて ください 。', 'And watch out! Sometimes a dummy spins. Dodge with the arrows.'],
      pGreat: ['カンペキ ！', 'Perfect!'],
      pGood: ['いい ね ！', 'Very good!'],
      pFix: ['おしい ！ もう [一回|いっかい] 。', 'Almost! Again.'],
      pMissed: ['おっと ！ [大丈夫|だいじょうぶ] 、 [練習|れんしゅう] です から 。', 'Oops! No harm done: it’s practice.'],
      pRound: ['もう [一|ひと]ラウンド ！ [新|あたら]しい かかし です 。', 'Another round! New dummies.'],
      pWin: ['[全部|ぜんぶ] たおれた ！ [素晴|すば]らしい ！', 'All down! Excellent!'],
      pDone: ['いい [練習|れんしゅう] でした ！ いつでも また どうぞ 。', 'Good training! Come back any time.'],
      bossIntro: ['[止|と]まれ ！ [動|うご]くな ！ [貴様|きさま]ら 、 [静寂|せいじゃく] の [手先|てさき] だ な ！', 'Halt! Freeze! You’re from the Hush!'],
      bossName: ['わし は トウモロコシ [大佐|たいさ] だ ！ ここ に [静寂|せいじゃく] は [入|はい]らせん ！', 'I’m Colonel Cob! The Hush doesn’t get in here!'],
      bossCall: ['[兵|へい]たち 、 [整列|せいれつ] ！', 'Soldiers, fall in!'],
      bossBounce: ['はっはっは ！ わし の マント は かたい ぞ ！', 'Ha! My cape is very hard!'],
      bossOpen: ['もう いい ！ わし が [相手|あいて] だ ！', 'Enough! Now I fight!'],
      bossHurt: ['いたっ 、 わし の [勲章|くんしょう] が ！', 'Ow, my medal!'],
      bossClose: ['[隠|かく]れろ ！ [兵|へい] を [増|ふ]やせ ！', 'Take cover! More soldiers!'],
      bossHeat: ['[火|ひ] だ ！ [床|ゆか] が [熱|あつ]い ！', 'Fire! The floor is very hot!'],
      pop: ['ポン ！', 'Pop!'],
      bossGiveUp: ['[参|まい]った ！ [参|まい]った ！', 'I give up! I give up!'],
      bossAfter: ['[静寂|せいじゃく] の [手先|てさき] じゃ ない の か ？ しゃべれる と は ！ [勇敢|ゆうかん] だ ！', 'You’re not from the Hush? But you speak! How brave!'],
      psst: ['ひそひそ …', 'Psst…'],
      weak: ['[弱点|じゃくてん] ！', 'Weak spot!'],
      hard: ['かたい ！', 'It’s hard!'],
      sneak: ['[不意打|ふいう]ち ！', 'Surprise attack!'],
      noverb: ['どう すれば いい ？', 'What do I do?'],
      which: ['どれ ？', 'Which one?'],
      none: ['どこ ？', 'Where?'],
      nopart: ['それ 、 どこ ？', 'Where’s that?'],
      win: ['[勝|か]った ！', 'We won!'],
      lose: ['ふう … [休|やす]もう 。', 'Phew… we need a rest.'],
      flee: ['[逃|に]げよう ！', 'Let’s go!'],
      throwWhat: ['[何|なに] を [投|な]げる の ？', 'Throw what?'],
      tooSlow: ['[石|いし] は [重|おも]すぎて 、 [浮|う]いてる の に [当|あ]たらない ！', 'The stone is too heavy to hit a floater!'],
      echoBack: ['エコー ！ はね[返|かえ]して きた ！', 'Echo! It threw it right back at you!'],
      dazed: ['ふらふら してる ！', 'It’s dizzy!'],
      singing: ['ラ 、 ラ 、 ラー ！', 'La, la, laaa!'],
      screech: ['キーッ ！', 'Eeeek!'],
      copyCat: ['[同|おな]じ こと は もう だめ ！', 'Not the same thing again!'],
    },
    sayEx: ex => [`こう [言|い]って ： 「 ${ex} 」`, `Tell it: «${ex}»`],
    coins: { one: 'コイン', many: 'コイン' },
    weakNow: p => [`[今度|こんど] は ${L.ja.parts[p].w} が [光|ひか]ってる ！`, `Now the ${L.ja.parts[p].en} is glowing!`],
    unknown: w => [`「 ${w} 」 ？`, `doesn’t know “${w}” yet`],
    meet: k => {
      const s = L.ja.species[k];
      if (k === 'colonel') return [`トウモロコシ [大佐|たいさ] 、 [隊長|たいちょう] です 。 「 ${s.w} 」 と [書|か]いて ください 。`, `It’s Colonel Cob, the leader. Type «${s.w}».`];
      if (k === 'dummy') return [`[練習|れんしゅう] [用|よう] の かかし です 。 「 ${s.w} 」 と [書|か]いて ください 。`, `This is the practice dummy. Type «${s.w}».`];
      return [`[見|み]て ！ ${s.w} です 。 「 ${s.w} 」 と [書|か]いて ください 。`, `Look! ${/^[aeiou]/.test(s.en) ? 'An' : 'A'} ${s.en}: «${s.w}». Type «${s.w}».`];
    },
    meetTip: k => { const s = L.ja.species[k]; return `A new creature: «${s.w}» (the ${s.en}). Copy it${s.kata ? ' · it’s written in katakana, like many animal names and loanwords' : ''}.`; },
    colorIs: (key, k) => { const s = L.ja.species[k], A = L.ja.adjs[key].forms[0].m; return [`この ${s.w} は ${A} です ： 「 ${A} 」 。 「 ${A} 」 と [書|か]いて ください 。`, `This ${s.en} is ${L.ja.adjs[key].en}: «${A}». Type «${A}».`]; },
    gloss: {
      こんにちは: 'hi', みたい: 'like', な: '(links)', 仲間: 'partner', を: '(the one acted on)', 鍛える: 'train', の: '(of / ’s)', が: '(who does it)', わたし: 'I', 仕事: 'job', です: 'is',
      まず: 'first', は: '(as for)', 動き: 'action', 一つ: 'one', 見て: 'look / watch', ください: 'please', 跳んで: 'jump', 今度: 'this time', あなた: 'you', と: '(quoting)',
      書いて: 'write / type', いい: 'good', ね: '(isn’t it)', 見ない: 'without looking', で: '(by / with)', に: '(to)', 教えて: 'teach', 初めて: 'first', 言葉: 'word', 気: 'attention',
      つけて: 'pay (気をつけて = careful)', だまりっこ: 'hushling (little quiet one)', どう: 'how', する: 'do', か: '(question)', 言って: 'say', よく: 'well', 聞いて: 'listen', どこ: 'where',
      狙う: 'aim at', 叫びます: 'shouts', よ: '(you know)', もう: 'another / already', 打って: 'hit', 二つ: 'two', 知って: 'know', います: 'is …ing', 両方: 'both', 使って: 'use',
      勝ちました: 'won', 覚える: 'learn', 早い: 'fast', 二匹: 'two (animals)', こっち: 'this one', 赤い: 'red', 青い: 'blue', 色: 'color', 相手: 'opponent / who', 言う: 'say',
      とき: 'when', 番: 'turn', お見事: 'well done', ねらいどおり: 'right on target', うわ: 'whoa', 大だまりっこ: 'big hushling', だ: 'is', 大きい: 'big', しっぽ: 'tail',
      光って: 'glowing', あれ: 'that', 弱点: 'weak spot', その: 'that', こう: 'like this', 動きます: 'moves', 頭: 'head', やりました: 'did it', ぴったり: 'exactly', 当たりました: 'hit (the mark)',
      いたた: 'ouch', 深呼吸: 'deep breath', して: 'do', 一度: 'once', 手: 'trick', 知ってる: 'know', ぞ: '(!)', ほんと: 'really', ともだち: 'friend', こわい: 'scary',
      かわいそう: 'poor thing', 浮いてる: 'floating', 跳んだ: 'jumped', ほう: 'way (…ほうがいい = better to)', 怒っちゃった: 'got angry', また: 'again', 寝ちゃった: 'fell asleep',
      落ちた: 'fell', これ: 'this', なら: 'if', 届く: 'reach', 飛んだ: 'flew', 固い: 'hard', 甲羅: 'shell', 文字: 'letter', 評価: 'grade', 満点: 'full marks', 攻撃: 'attack',
      強く: 'strong', なります: 'becomes', でも: 'but', ひっくり返せます: 'can flip over', 押して: 'push', かたい: 'hard', ボール: 'ball', なっちゃった: 'turned into', ひっくり返った: 'flipped over',
      今: 'now', おなか: 'belly', 丸まっちゃった: 'curled up', 全部: 'all', すいて: 'empty (おなかがすいて = hungry)', かばん: 'bag', 食べ物: 'food', あります: 'there is', 食べて: 'eat',
      もぐもぐ: 'munch', おいしい: 'yummy', いっぱい: 'full', 何: 'what', 食べる: 'eat', ない: 'there isn’t', それ: 'that', 食べられない: 'can’t be eaten', そっくり: 'look the same',
      見分けられません: 'can’t tell apart', いる: 'is (there)', 左: 'left', 真ん中: 'middle', 右: 'right', カエル: 'frog', 毎ターン: 'every turn', 別: 'other', 葉っぱ: 'leaf (lily pad)',
      跳び移ります: 'hop over', 前: 'before', 場所: 'place', 変わった: 'changed', どれ: 'which one', ケロケロ: 'ribbit', かかし: 'straw dummy', 練習: 'practice', しましょう: 'let’s do',
      毎回: 'every time', 変えて: 'change', マフラー: 'scarf', それぞれ: 'each', 違います: 'is different', いっしょ: 'together', それから: 'and then', 回る: 'spin', こと: 'thing (…ことがある = sometimes)',
      矢印: 'arrow', キー: 'key', よけて: 'dodge', カンペキ: 'perfect', おしい: 'so close', 一回: 'once', おっと: 'oops', 大丈夫: 'it’s OK', から: 'because', 一ラウンド: 'one round',
      新しい: 'new', たおれた: 'fell down', 素晴らしい: 'wonderful', でした: 'was', いつでも: 'any time', どうぞ: 'please (come)', 止まれ: 'halt', 動くな: 'don’t move', 貴様ら: 'you lot',
      静寂: 'the Hush (silence)', 手先: 'henchmen', わし: 'I (old man)', トウモロコシ: 'corn', 大佐: 'colonel', ここ: 'here', 入らせん: 'won’t let in', 兵たち: 'soldiers', 整列: 'fall in',
      マント: 'cape', 勲章: 'medal', 隠れろ: 'take cover', 兵: 'soldiers', 増やせ: 'more!', 火: 'fire', 床: 'floor', 熱い: 'hot', ポン: 'pop', 参った: 'I give up', じゃ: 'not',
      しゃべれる: 'can talk', 勇敢: 'brave', ひそひそ: 'psst', 不意打ち: 'surprise attack', すれば: 'should do', 勝った: 'won', ふう: 'phew', 休もう: 'let’s rest', 逃げよう: 'let’s run',
      蛾: 'moth', カブトムシ: 'beetle', アルマジロ: 'armadillo', 羽: 'wing', 石: 'stone', りんご: 'apple', パン: 'bread', コウモリ: 'bat', エコー: 'echo', 歌って: 'sing', コイン: 'coins',
      けんか: 'fight', したくない: 'don’t want to', こわくない: 'not scary', いじめない: 'won’t bully', 隊長: 'leader', 用: 'for', 投げる: 'throw', ふらふら: 'dizzy', 同じ: 'same', だめ: 'no good',
    },
  };
})();

// ---------------------------------------------------------------- zh / ja for the language engine's battle words
// The battle's LEX items get their zh / ja forms (and alternatives the teach box and the "tell Mimo" box accept: LEX.check,
// LEX.heard), so Mimo hears «跳！» / «跳んで！» in the overworld too. Items other files registered first keep their object and
// gain the forms they lack (_.mergeZhJa, also run by the zh / ja parser). Swim (the raft's verb) is registered here when
// nobody has it yet, the same word story.js would register, with zh / ja. Foods the world has no zh / ja for yet get the
// battle's own words (_.FOOD_WORDS), each with its measure word (cl, zh).
(() => {
  const _ = window.BATTLE._, L = _.LANGS;
  const ZJ = {
    'v.jump': { zh: '[跳|tiào]', ja: '[跳|と]んで', alt: { zh: ['[蹦|bèng]', '[踩|cǎi]'], ja: ['[飛|と]んで', 'ジャンプ して', 'ジャンプ', '[跳|と]べ', '[跳|と]ぶ', '[飛|と]ぶ'] } },
    'v.hit': { zh: '[打|dǎ]', ja: '[打|う]って', alt: { zh: ['[揍|zòu]', '[敲|qiāo]', '[踢|tī]'], ja: ['[叩|たた]いて', '[殴|なぐ]って', 'パンチ', '[打|う]て', '[打|う]つ', '[叩|たた]く'] } },
    'v.throw': { zh: '[扔|rēng]', ja: '[投|な]げて', alt: { zh: ['[丢|diū]', '[投|tóu]'], ja: ['[投|な]げろ', '[投|な]げる'] } },
    'v.push': { zh: '[推|tuī]', ja: '[押|お]して', alt: { zh: ['[推倒|tuī dǎo]', '[推翻|tuī fān]'], ja: ['[押|お]せ', '[押|お]す', 'ひっくり[返|かえ]して'] } },
    'v.eat': { zh: '[吃|chī]', ja: '[食|た]べて', alt: { zh: ['[吃掉|chī diào]'], ja: ['[食|た]べろ', '[食|た]べる'] } },
    'v.swim': { zh: '[游泳|yóu yǒng]', ja: '[泳|およ]いで', alt: { zh: ['[游|yóu]', '[游过去|yóu guò qù]'], ja: ['[泳|およ]げ', '[泳|およ]ぐ'] } },
    'a.red': { zh: '[红色|hóng sè]', ja: '[赤|あか]い', alt: { zh: ['[红|hóng]'], ja: ['[赤|あか]'] } },
    'a.blue': { zh: '[蓝色|lán sè]', ja: '[青|あお]い', alt: { zh: ['[蓝|lán]'], ja: ['[青|あお]'] } },
    'a.green': { zh: '[绿色|lǜ sè]', ja: '[緑|みどり]', alt: { zh: ['[绿|lǜ]'], ja: ['[緑色|みどりいろ]'] } },
    'a.yellow': { zh: '[黄色|huáng sè]', ja: '[黄色|きいろ]い', alt: { zh: ['[黄|huáng]'], ja: ['[黄色|きいろ]'] } },
    'a.white': { zh: '[白色|bái sè]', ja: '[白|しろ]い', alt: { zh: ['[白|bái]'], ja: ['[白|しろ]'] } },
    'a.big': { zh: '[大|dà]', ja: '[大|おお]きい', alt: { ja: ['[大|おお]きな'] } },
    'a.small': { zh: '[小|xiǎo]', ja: '[小|ちい]さい', alt: { ja: ['[小|ちい]さな'] } },
    'a.asleep': { zh: '[睡着|shuì zháo]', ja: '[寝|ね]ている', alt: { zh: ['[睡觉|shuì jiào]'], ja: ['[寝|ね]てる', '[眠|ねむ]っている'] } },
    'a.angry': { zh: '[生气|shēng qì]', ja: '[怒|おこ]っている', alt: { ja: ['[怒|おこ]ってる'] } },
    'n.hushling': { zh: '[小默默|xiǎo mò mò]', ja: 'だまりっこ' },
    'n.hushbig': { zh: '[大默默|dà mò mò]', ja: '[大|おお]だまりっこ' },
    'n.moth': { zh: '[蛾子|é zi]', ja: '[蛾|が]', alt: { zh: ['[飞蛾|fēi é]'], ja: ['ガ'] } },
    'n.beetle': { zh: '[甲虫|jiǎ chóng]', ja: 'カブトムシ', alt: { zh: ['[甲壳虫|jiǎ ké chóng]'], ja: ['[甲虫|こうちゅう]'] } },
    'n.armadillo': { zh: '[犰狳|qiú yú]', ja: 'アルマジロ' },
    'n.frog': { zh: '[青蛙|qīng wā]', ja: 'カエル', alt: { ja: ['[蛙|かえる]'] } },
    'n.dummy': { zh: '[稻草人|dào cǎo rén]', ja: 'かかし', alt: { zh: ['[假人|jiǎ rén]'], ja: ['[案山子|かかし]'] } },
    'n.kernel': { zh: '[玉米粒|yù mǐ lì]', ja: 'コーン' },
    'n.popcorn': { zh: '[爆米花|bào mǐ huā]', ja: 'ポップコーン' },
    'n.colonel': { zh: '[上校|shàng xiào]', ja: '[大佐|たいさ]' },
    'n.bat': { zh: '[蝙蝠|biān fú]', ja: 'コウモリ' },
    'p.left': { zh: '[左边|zuǒ biān]', ja: '[左|ひだり]', alt: { zh: ['[左面|zuǒ miàn]', '[左边|zuǒ biān] [的|de]'], ja: ['[左側|ひだりがわ]', '[左|ひだり] の'] } },
    'p.middle': { zh: '[中间|zhōng jiān]', ja: '[真|ま]ん[中|なか]', alt: { zh: ['[当中|dāng zhōng]', '[中间|zhōng jiān] [的|de]'], ja: ['まんなか', '[中央|ちゅうおう]', '[真|ま]ん[中|なか] の'] } },
    'p.right': { zh: '[右边|yòu biān]', ja: '[右|みぎ]', alt: { zh: ['[右面|yòu miàn]', '[右边|yòu biān] [的|de]'], ja: ['[右側|みぎがわ]', '[右|みぎ] の'] } },
    'n.head': { zh: '[头|tóu]', ja: '[頭|あたま]', alt: { zh: ['[脑袋|nǎo dai]'] } },
    'n.tail': { zh: '[尾巴|wěi ba]', ja: 'しっぽ', alt: { ja: ['[尻尾|しっぽ]'] } },
    'n.shell': { zh: '[壳|ké]', ja: '[甲羅|こうら]', alt: { zh: ['[硬壳|yìng ké]'], ja: ['[殻|から]'] } },
    'n.wing': { zh: '[翅膀|chì bǎng]', ja: '[羽|はね]', alt: { ja: ['[翼|つばさ]'] } },
    'n.stone': { zh: '[石头|shí tou]', ja: '[石|いし]', alt: { zh: ['[石子|shí zǐ]'], ja: ['[小石|こいし]'] } },
    'o.light': { zh: '[小石子|xiǎo shí zǐ]', ja: '[小石|こいし]' },
    'o.heavy': { zh: '[大石头|dà shí tou]', ja: '[岩|いわ]' },
    't.nofight': { zh: '[我们|wǒ men] [不|bù] [想|xiǎng] [打架|dǎ jià]', ja: 'けんか したくない' },
    't.friends': { zh: '[我们|wǒ men] [是|shì] [朋友|péng you]', ja: 'ともだち だ よ' },
    't.calm': { zh: '[别|bié] [怕|pà]', ja: 'こわくない よ' },
    't.nohurt': { zh: '[我们|wǒ men] [不会|bù huì] [伤害|shāng hài] [你|nǐ]', ja: 'いじめない よ' },
  };
  // its zh / ja, the alternatives it lacks, and (zh / ja have no plurals) the plural as the same word
  function merge(it) {
    const z = it && ZJ[it.id]; if (!z) return;
    for (const l of ['zh', 'ja']) {
      if (!it[l] && z[l]) it[l] = z[l];
      if (z.alt && z.alt[l]) { it.alt = it.alt || {}; it.alt[l] = Array.from(new Set([...(it.alt[l] || []), ...z.alt[l]])); }
      if (it.pl && typeof it.pl === 'object' && !it.pl[l] && it[l]) it.pl[l] = it[l];
    }
  }
  // swim: the same object story.js would register (its ensureVerbs skips it when it's already there), with zh / ja
  if (!_.ITEMS.some(x => x.id === 'v.swim') && !(typeof LEX !== 'undefined' && LEX.item('v.swim'))) {
    _.ITEMS.push({ id: 'v.swim', kind: 'verb', es: 'nada', pt: 'nada', de: 'schwimm', en: 'swim', icon: 'swim', alt: { pt: ['nade'], de: ['schwimme', 'schwimmt', 'schwimmen'] } });
  }
  _.ITEMS.forEach(merge);
  _.mergeZhJa = () => { if (typeof LEX === 'undefined') return; for (const id of Object.keys(ZJ)) merge(LEX.item(id)); };
  if (typeof LEX !== 'undefined') {
    const add = _.ITEMS.filter(it => it.id === 'v.swim' && !LEX.item(it.id));
    if (add.length) LEX.register(add);
    _.mergeZhJa();
  }
  _.ZJ = ZJ;
  // food the world has no zh / ja for yet (the shops can't serve zh / ja); cl: the measure word for «一…» (zh)
  const F = _.FOOD_WORDS = _.FOOD_WORDS || {};
  const food = (id, zh, ja) => { F[id] = F[id] || {}; if (!F[id].zh) F[id].zh = zh; if (!F[id].ja) F[id].ja = ja; };
  food('w.pear', { w: '[梨|lí]', g: 'm', cl: '个' }, { w: '[梨|なし]', g: 'm' });
  food('w.orange', { w: '[橙子|chéng zi]', g: 'm', cl: '个', alt: ['[橘子|jú zi]'] }, { w: 'オレンジ', g: 'm' });
  food('w.cookie', { w: '[饼干|bǐng gān]', g: 'm', cl: '块' }, { w: 'クッキー', g: 'm' });
  food('w.cheese', { w: '[奶酪|nǎi lào]', g: 'm', cl: '块' }, { w: 'チーズ', g: 'm' });
  food('w.honey', { w: '[蜂蜜|fēng mì]', g: 'm', cl: '罐' }, { w: 'はちみつ', g: 'm', alt: ['[蜂蜜|はちみつ]'] });
  food('w.cake', { w: '[蛋糕|dàn gāo]', g: 'm', cl: '块' }, { w: 'ケーキ', g: 'm' });
  food('w.fish', { w: '[鱼|yú]', g: 'm', cl: '条' }, { w: '[魚|さかな]', g: 'm' });
  // the measure word of a food, for «吃一个苹果» (the world's words carry it as cl.zh: '[个|gè]')
  _.foodCl = id => {
    const fw = F[id] && F[id].zh, it = typeof LEX !== 'undefined' && LEX.item(id), c = (fw && fw.cl) || (it && it.cl && it.cl.zh) || '个';
    return String(c).replace(/^\[([^|\]]+)\|.*$/, '$1');
  };
  // every battle string in zh / ja goes into the engine's dictionary (the IME's candidates, characters in typed answers)
  _.feedCJK = () => { if (typeof CJK === 'undefined' || _.cjkFed) return; _.cjkFed = true; CJK.addSource(L.zh, 'zh'); CJK.addSource(L.ja, 'ja'); CJK.addSource(ZJ); CJK.addSource(F); };
  _.feedCJK();
})();

// ================================================================ Region 4, the Bloom Gardens (appended): the picky bee and «trepa»
// la abeja · a abelha · die Biene (feminine in all three: «la abeja roja», «a abelha vermelha», «die rote Biene»). Each picky
// bee wants one thing (roses, sunflowers, tulips, lavender or honey) and buzzes it when it shows up: «¡Me gustan las rosas!».
// Tell it what it likes, to it: «¡Te gustan las rosas!» / «Você gosta de rosas!» / «Du magst Rosen!» (zh «你喜欢玫瑰！», ja
// «バラが好きだね！»): right, it calms down and flies off happy (it counts as beaten); wrong, it gets angry and stings for two.
// Graded S–D on gustar / gostar de / mögen (gardens.js GARDENS.likes.grade). Climb («trepa / sobe / kletter», learned from
// Flora at the garden gate) takes no target: Mimo scrambles up a vine and drops onto one from above (a flier first): it reaches
// fliers and knocks them down for a turn. (zh 爬 / ja 登って: parser.js reads them like sing, with no target.)
(() => {
  const _ = window.BATTLE._, L = _.LANGS;
  const put = (o, k, v) => { if (o && o[k] === undefined) o[k] = v; };
  const lines = (lang, t) => { if (L[lang]) for (const [k, v] of Object.entries(t)) put(L[lang].t, k, v); };
  // Spanish
  put(L.es.species, 'bee', { w: 'abeja', pl: 'abejas', g: 'f', en: 'bee' });
  put(L.es.verbs, 'climb', { show: 'trepa', forms: ['trepa', 'trepe', 'sube', 'suba', 'escala', 'trepá'], en: 'climb' });
  put(L.es.frames, 'likeT', { text: '¡Te gustan las ___!', pat: 'like' }); put(L.es.frames, 'climbT', { text: '¡Trepa!', pat: 'verb' });
  put(L.es.tips, 'bee', 'Picky bees: each one buzzes what it likes. Tell it, to the bee: «¡Te gustan las rosas!» («te gusta» for one thing, «te gustan» for more, and the article: «la miel», «los girasoles»). Right: it calms down and flies off. Wrong: it gets angry and stings twice as hard.');
  put(L.es.tips, 'climb', 'Climb («trepa»): {name} scrambles up a vine and drops onto one of them from above. It reaches the ones that fly, and knocks them down for a turn.');
  lines('es', { beeCalm: ['¡Sííí! ¡Me encanta! Bzzz…', 'Yesss! I love it! Bzzz…'], beeCalmPl: ['¡Sííí! ¡Me encantan! Bzzz…', 'Yesss! I love them! Bzzz…'], beeBye: ['Bzz… gracias…', 'Bzz… thank you…'],
    beeAngry: ['¡No me gusta! ¡BZZZ!', 'I don’t like that! BZZZ!'], beeBuzz: ['¡Bzzz!', 'Bzzz!'], climbing: ['¡Arriba, arriba!', 'Up, up!'], fromAbove: ['¡Desde arriba!', 'From above!'], beeWhich: ['¿A cuál de las abejas? Las dos quieren otra cosa.', 'Which bee? They each want something else.'] });
  Object.assign(L.es.gloss, { abeja: 'bee', abejas: 'bees', trepa: 'climb', gusta: 'likes (one thing)', gustan: 'likes (more than one)', encanta: 'loves', encantan: 'love (them)', bzzz: 'bzzz', arriba: 'up', desde: 'from' });
  // Portuguese (no «trepa» here: in Brazil it means something else)
  put(L.pt.species, 'bee', { w: 'abelha', pl: 'abelhas', g: 'f', en: 'bee' });
  put(L.pt.verbs, 'climb', { show: 'sobe', forms: ['sobe', 'suba', 'escala', 'escale'], en: 'climb' });
  put(L.pt.frames, 'likeT', { text: 'Você gosta de ___!', pat: 'like' }); put(L.pt.frames, 'climbT', { text: 'Sobe!', pat: 'verb' });
  put(L.pt.tips, 'bee', 'Picky bees: each one buzzes what it likes. Tell it, to the bee: «Você gosta de rosas!» (gostar always takes «de»). Right: it calms down and flies off. Wrong: it gets angry and stings twice as hard.');
  put(L.pt.tips, 'climb', 'Climb («sobe»): {name} scrambles up a vine and drops onto one of them from above. It reaches the ones that fly, and knocks them down for a turn.');
  lines('pt', { beeCalm: ['Siiim! Eu adoro! Bzzz…', 'Yesss! I love it! Bzzz…'], beeCalmPl: ['Siiim! Eu adoro! Bzzz…', 'Yesss! I love them! Bzzz…'], beeBye: ['Bzz… obrigada…', 'Bzz… thank you…'],
    beeAngry: ['Eu não gosto disso! BZZZ!', 'I don’t like that! BZZZ!'], beeBuzz: ['Bzzz!', 'Bzzz!'], climbing: ['Pra cima, pra cima!', 'Up, up!'], fromAbove: ['Lá de cima!', 'From above!'], beeWhich: ['Qual abelha? Cada uma quer uma coisa.', 'Which bee? They each want something else.'] });
  Object.assign(L.pt.gloss, { abelha: 'bee', abelhas: 'bees', sobe: 'climb', gosta: 'likes', gosto: 'I like', adoro: 'I love', bzzz: 'bzzz', cima: 'up' });
  // German
  put(L.de.species, 'bee', { w: 'Biene', pl: 'Bienen', gen: 'Biene', g: 'f', en: 'bee' });
  put(L.de.verbs, 'climb', { show: 'kletter', forms: ['kletter', 'klettere', 'klettert'], en: 'climb' });
  put(L.de.frames, 'likeT', { text: 'Du magst ___!', pat: 'like' }); put(L.de.frames, 'climbT', { text: 'Kletter!', pat: 'verb' });
  put(L.de.tips, 'bee', '«die Biene» is a die-word. Picky bees: each one buzzes what it likes. Tell it, to the bee: «Du magst Rosen!» (du → «magst»). Right: it calms down and flies off. Wrong: it gets angry and stings twice as hard.');
  put(L.de.tips, 'climb', 'Climb («kletter»): {name} scrambles up a vine and drops onto one of them from above. It reaches the ones that fly, and knocks them down for a turn.');
  lines('de', { beeCalm: ['Jaaa! Das mag ich so! Summ…', 'Yesss! I love it! Bzzz…'], beeCalmPl: ['Jaaa! Die mag ich so! Summ…', 'Yesss! I love them! Bzzz…'], beeBye: ['Summ… danke…', 'Bzz… thank you…'],
    beeAngry: ['Das mag ich nicht! SUMMM!', 'I don’t like that! BZZZ!'], beeBuzz: ['Summm!', 'Bzzz!'], climbing: ['Hoch, hoch!', 'Up, up!'], fromAbove: ['Von oben!', 'From above!'], beeWhich: ['Welche Biene? Jede will etwas anderes.', 'Which bee? They each want something else.'] });
  Object.assign(L.de.gloss, { biene: 'bee', bienen: 'bees', kletter: 'climb', magst: 'you like', mag: 'I like / she likes', summ: 'bzz', hoch: 'up', oben: 'above' });
  // Chinese and Japanese: the bee, and climb (parser.js reads it like sing and blow: no target)
  if (L.zh) {
    put(L.zh.species, 'bee', { w: '[蜜蜂|mì fēng]', en: 'bee', g: 'm', cl: '只', alt: ['[蜂|fēng]'] });
    put(L.zh.verbs, 'climb', { show: '[爬|pá]', forms: ['[爬|pá]', '[爬上去|pá shàng qù]'], en: 'climb', cj: [['[爬|pá]', 'ok'], ['[爬上去|pá shàng qù]', 'ok', 'result'], ['[往上爬|wǎng shàng pá]', 'ok']] });
    if (L.zh.frames) put(L.zh.frames, 'climbT', { text: '[爬|pá] ！', pat: 'verb' });
    if (L.zh.tips) put(L.zh.tips, 'climb', 'Climb («[爬|pá]»): {name} scrambles up a vine and drops onto one of them from above. It reaches the ones that fly, and knocks them down for a turn.');
    lines('zh', { climbing: ['[往上|wǎng shàng] [爬|pá] ！', 'Up, up!'], fromAbove: ['[从|cóng] [上面|shàng miàn] ！', 'From above!'] });
    if (L.zh.tips) put(L.zh.tips, 'bee', 'Picky bees: each one buzzes what it likes. Tell it: «[你|nǐ] [喜欢|xǐ huan] [玫瑰|méi gui] ！». Right: it calms down and flies off. Wrong: it gets angry and stings twice as hard.');
    lines('zh', { beeCalm: ['[对|duì] ！ [我|wǒ] [最|zuì] [喜欢|xǐ huan] [了|le] ！ [嗡|wēng] …', 'Yesss! I love it! Bzzz…'], beeCalmPl: ['[对|duì] ！ [我|wǒ] [最|zuì] [喜欢|xǐ huan] [了|le] ！ [嗡|wēng] …', 'Yesss! I love them! Bzzz…'], beeBye: ['[嗡|wēng] … [谢谢|xiè xie] …', 'Bzz… thank you…'],
      beeAngry: ['[我|wǒ] [不|bù] [喜欢|xǐ huan] ！ [嗡嗡嗡|wēng wēng wēng] ！', 'I don’t like that! BZZZ!'], beeBuzz: ['[嗡嗡|wēng wēng] ！', 'Bzzz!'] });
  }
  if (L.ja) {
    put(L.ja.species, 'bee', { w: 'ハチ', en: 'bee', g: 'm', alt: ['[蜂|はち]', 'ミツバチ'], kata: true });
    put(L.ja.verbs, 'climb', { show: '[登|のぼ]って', forms: ['[登|のぼ]って'], en: 'climb', cj: [['[登|のぼ]って', 'te'], ['[登|のぼ]れ', 'imp'], ['[登|のぼ]る', 'dict'], ['[登|のぼ]ります', 'masu'], ['よじ[登|のぼ]って', 'te']] });
    if (L.ja.frames) put(L.ja.frames, 'climbT', { text: '[登|のぼ]って ！', pat: 'verb' });
    if (L.ja.tips) put(L.ja.tips, 'climb', 'Climb («[登|のぼ]って»): {name} scrambles up a vine and drops onto one of them from above. It reaches the ones that fly, and knocks them down for a turn.');
    lines('ja', { climbing: ['[上|うえ] へ 、 [上|うえ] へ ！', 'Up, up!'], fromAbove: ['[上|うえ] から ！', 'From above!'] });
    if (L.ja.tips) put(L.ja.tips, 'bee', 'Picky bees: each one buzzes what it likes. Tell it: «バラ が [好|す]き だ ね ！». Right: it calms down and flies off. Wrong: it gets angry and stings twice as hard.');
    lines('ja', { beeCalm: ['そう ！ [大好|だいす]き ！ ブーン …', 'Yesss! I love it! Bzzz…'], beeCalmPl: ['そう ！ [大好|だいす]き ！ ブーン …', 'Yesss! I love them! Bzzz…'], beeBye: ['ブーン … ありがとう …', 'Bzz… thank you…'],
      beeAngry: ['[嫌|きら]い ！ ブンブンブン ！', 'I don’t like that! BZZZ!'], beeBuzz: ['ブンブン ！', 'Bzzz!'] });
  }
  ['es', 'pt', 'de'].forEach(k => { delete L[k].I; });        // (the parser indexes each language once: again, with the new words)
  if (L.zh) delete L.zh.I; if (L.ja) delete L.ja.I;
  // what a bee buzzes it wants, in the language: «¡Me gustan las rosas!» (k: a GARDENS.likes thing), and the English under it
  _.beeWants = (lang, k) => {
    const G = typeof GARDENS !== 'undefined' && GARDENS.likes, T = G && G.THINGS[k]; if (!T) return ['Bzz!', 'Bzz!'];
    const F = T[lang], pl = T.count;
    if (lang === 'es') { const art = F.g === 'f' ? (pl ? 'las' : 'la') : (pl ? 'los' : 'el'); return [`¡Bzz! ¡Me ${pl ? 'gustan' : 'gusta'} ${art} ${pl ? F.pl : F.sg}!`, `Bzz! I like ${T.en}!`]; }
    if (lang === 'pt') return [`Bzz! Eu gosto de ${pl ? F.pl : F.sg}!`, `Bzz! I like ${T.en}!`];
    if (lang === 'de') return [`Summ! Ich mag ${pl ? F.pl : F.sg}!`, `Bzz! I like ${T.en}!`];
    if (lang === 'zh') return [`[嗡嗡|wēng wēng] ！ [我|wǒ] [喜欢|xǐ huan] ${T.zh} ！`, `Bzz! I like ${T.en}!`];
    if (lang === 'ja') return [`ブンブン ！ ${T.ja} が [好|す]き ！`, `Bzz! I like ${T.en}!`];
    return ['Bzz!', `Bzz! I like ${T.en}!`];
  };
  // the language engine's items (the overworld's v.climb from gardens.js when it's there: one object, so nothing's lost)
  const N = (id, es, pt, de, en, g, icon) => ({ id, es, pt, de, en, g, icon: icon || id.split('.')[1], battle: true });
  const climb = (typeof LEX !== 'undefined' && LEX.item('v.climb')) || Object.assign(N('v.climb', 'trepa', 'sobe', 'kletter', 'climb', null, 'climb'), { kind: 'verb', zh: '[爬|pá]', ja: '[登|のぼ]って', alt: { es: ['trepe', 'sube', 'suba', 'escala'], pt: ['suba', 'escala', 'escale'], de: ['klettere', 'klettert', 'klettern'] } });
  const bee = Object.assign(N('n.bee', 'abeja', 'abelha', 'Biene', 'bee', { es: 'f', pt: 'f', de: 'f' }, 'bee'), { zh: '[蜜蜂|mì fēng]', ja: 'ハチ', pl: { es: 'abejas', pt: 'abelhas', de: 'Bienen', zh: '[蜜蜂|mì fēng]', ja: 'ハチ' } });
  for (const it of [climb, bee]) if (!_.ITEMS.some(x => x.id === it.id)) _.ITEMS.push(it);
  if (typeof LEX !== 'undefined') { const add = [climb, bee].filter(it => !LEX.item(it.id)); if (add.length) LEX.register(add); }
  if (typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(bee.zh); CJK.addSource(bee.ja); } catch (e) { /* optional */ } }
})();

// ================================================================ Region 5, the Frost Peaks (appended): the snowball and «sopla»
// la bola (de nieve) · a bola (de neve) · der Schneeball (a der-word: «den roten Schneeball» when you hit it). Snowballs grow
// a size every round you don't hit them (small → big → huge: more hearts, and a huge one hits for two), so act fast. Blow
// («sopla / sopra / puste», learned from Lía on the Frost Pass) is a gust across the whole field: a little for everyone,
// snowballs shrink a size, fliers are blown down for a round. (flow.js: snowGrow, actBlow; parser: «bola de nieve» reads as
// «bola».)
(() => {
  const _ = window.BATTLE._, L = _.LANGS;
  const put = (o, k, v) => { if (o && o[k] === undefined) o[k] = v; };
  const lines = (lang, t) => { if (L[lang]) for (const [k, v] of Object.entries(t)) put(L[lang].t, k, v); };
  // Spanish
  put(L.es.species, 'snowball', { w: 'bola', pl: 'bolas', g: 'f', en: 'snowball', alt: ['bola de nieve'] });      // (alt: taught as «la bola de nieve» too)
  put(L.es.verbs, 'blow', { show: 'sopla', forms: ['sopla', 'sople', 'sóplale', 'sóplalo', 'soplá', 'soplale'], en: 'blow' });
  put(L.es.frames, 'snowT', { text: 'Golpea la bola ___', pat: 'hit+target' }); put(L.es.frames, 'blowT', { text: '¡Sopla!', pat: 'verb' });
  put(L.es.tips, 'snowball', '«la bola de nieve», or just «la bola»: a la-word. Snowballs grow every round you don’t hit them (bigger, tougher, and a huge one hits for two), so hit them fast! «¡Sopla!» blows snow off all of them at once.');
  put(L.es.tips, 'blow', 'Blow («sopla»): a gust across the whole field. A little for everyone, snowballs shrink a size, and the ones that fly are blown down for a round.');
  lines('es', { blowing: ['¡Fuuuuu!', 'Whoooosh!'], grew: ['¡Más grande!', 'Bigger!'], shrunk: ['¡Brrr! ¡Más pequeño!', 'Brrr! Smaller!'], shrunkF: ['¡Brrr! ¡Más pequeña!', 'Brrr! Smaller!'], snowRoll: ['¡Rueda, rueda!', 'Roll, roll!'] });
  Object.assign(L.es.gloss, { bola: 'ball (of snow)', bolas: 'balls (of snow)', nieve: 'snow', sopla: 'blow', fuuuuu: 'whoosh', grande: 'big', pequena: 'small', pequeno: 'small', rueda: 'roll' });
  // Portuguese
  put(L.pt.species, 'snowball', { w: 'bola', pl: 'bolas', g: 'f', en: 'snowball', alt: ['bola de neve'] });
  put(L.pt.verbs, 'blow', { show: 'sopra', forms: ['sopra', 'sopre', 'assopra', 'assopre'], en: 'blow' });
  put(L.pt.frames, 'snowT', { text: 'Bate na bola ___', pat: 'hit+target' }); put(L.pt.frames, 'blowT', { text: 'Sopra!', pat: 'verb' });
  put(L.pt.tips, 'snowball', '«a bola de neve», or just «a bola»: an a-word. Snowballs grow every round you don’t hit them (bigger, tougher, and a huge one hits for two), so hit them fast! «Sopra!» blows snow off all of them at once.');
  put(L.pt.tips, 'blow', 'Blow («sopra»): a gust across the whole field. A little for everyone, snowballs shrink a size, and the ones that fly are blown down for a round.');
  lines('pt', { blowing: ['Fuuuuu!', 'Whoooosh!'], grew: ['Maior!', 'Bigger!'], shrunk: ['Brrr! Menor!', 'Brrr! Smaller!'], snowRoll: ['Rola, rola!', 'Roll, roll!'] });
  Object.assign(L.pt.gloss, { bola: 'ball (of snow)', bolas: 'balls (of snow)', neve: 'snow', sopra: 'blow', maior: 'bigger', menor: 'smaller', rola: 'roll' });
  // German
  put(L.de.species, 'snowball', { w: 'Schneeball', pl: 'Schneebälle', gen: 'Schneeballs', g: 'm', en: 'snowball' });
  put(L.de.verbs, 'blow', { show: 'puste', forms: ['puste', 'pust', 'blas', 'blase'], en: 'blow' });
  put(L.de.frames, 'snowT', { text: 'Schlag den ___ Schneeball!', pat: 'hit+target' }); put(L.de.frames, 'blowT', { text: 'Puste!', pat: 'verb' });
  put(L.de.tips, 'snowball', '«der Schneeball» is a der-word: «Schlag den roten Schneeball!» Snowballs grow every round you don’t hit them (bigger, tougher, and a huge one hits for two), so hit them fast! «Puste!» blows snow off all of them at once.');
  put(L.de.tips, 'blow', 'Blow («puste»): a gust across the whole field. A little for everyone, snowballs shrink a size, and the ones that fly are blown down for a round.');
  lines('de', { blowing: ['Puuuuh!', 'Whoooosh!'], grew: ['Größer!', 'Bigger!'], shrunk: ['Brrr! Kleiner!', 'Brrr! Smaller!'], snowRoll: ['Roll, roll!', 'Roll, roll!'] });
  Object.assign(L.de.gloss, { schneeball: 'snowball', 'schneebälle': 'snowballs', puste: 'blow', puuuuh: 'whoosh', 'größer': 'bigger', kleiner: 'smaller' });
  // Chinese and Japanese: the snowball and blow
  if (L.zh) {
    put(L.zh.species, 'snowball', { w: '[雪球|xuě qiú]', en: 'snowball', g: 'm', cl: '个', cls: ['个', '颗'] });
    put(L.zh.verbs, 'blow', { show: '[吹|chuī]', forms: ['[吹|chuī]', '[吹走|chuī zǒu]'], en: 'blow', cj: [['[吹|chuī]', 'ok'], ['[吹走|chuī zǒu]', 'ok', 'result'], ['[吹风|chuī fēng]', 'ok']] });
    if (L.zh.tips) { put(L.zh.tips, 'snowball', 'Snowballs grow every round you don’t hit them (bigger, tougher, and a huge one hits for two), so hit them fast! «[吹|chuī] ！» blows snow off all of them at once.'); put(L.zh.tips, 'blow', 'Blow («[吹|chuī]»): a gust across the whole field. A little for everyone, snowballs shrink a size, and the ones that fly are blown down for a round.'); }
    if (L.zh.frames) { put(L.zh.frames, 'snowT', { text: '[打|dǎ] ___ [的|de] [雪球|xuě qiú] ！', pat: 'hit+target' }); put(L.zh.frames, 'blowT', { text: '[吹|chuī] ！', pat: 'verb' }); }
    lines('zh', { blowing: ['[呼|hū] ！', 'Whoooosh!'], grew: ['[变大|biàn dà] [了|le] ！', 'Bigger!'], shrunk: ['[变小|biàn xiǎo] [了|le] ！', 'Brrr! Smaller!'], snowRoll: ['[滚|gǔn] [啊|a] [滚|gǔn] ！', 'Roll, roll!'] });
  }
  if (L.ja) {
    put(L.ja.species, 'snowball', { w: '[雪玉|ゆきだま]', en: 'snowball', g: 'm', alt: ['ゆきだま', 'スノーボール'] });
    put(L.ja.verbs, 'blow', { show: '[吹|ふ]いて', forms: ['[吹|ふ]いて'], en: 'blow', cj: [['[吹|ふ]いて', 'te'], ['[吹|ふ]け', 'imp'], ['[吹|ふ]く', 'dict'], ['[吹|ふ]きます', 'masu'], ['[吹|ふ]って', 'bad']] });
    if (L.ja.tips) { put(L.ja.tips, 'snowball', 'Snowballs grow every round you don’t hit them (bigger, tougher, and a huge one hits for two), so hit them fast! «[吹|ふ]いて ！» blows snow off all of them at once.'); put(L.ja.tips, 'blow', 'Blow («[吹|ふ]いて»): a gust across the whole field. A little for everyone, snowballs shrink a size, and the ones that fly are blown down for a round.'); }
    if (L.ja.frames) { put(L.ja.frames, 'snowT', { text: '___ [雪玉|ゆきだま] を [打|う]って ！', pat: 'hit+target' }); put(L.ja.frames, 'blowT', { text: '[吹|ふ]いて ！', pat: 'verb' }); }
    lines('ja', { blowing: ['フーッ ！', 'Whoooosh!'], grew: ['[大|おお]きく なった ！', 'Bigger!'], shrunk: ['[小|ちい]さく なった ！', 'Brrr! Smaller!'], snowRoll: ['ゴロゴロ ！', 'Roll, roll!'] });
  }
  ['es', 'pt', 'de'].forEach(k => { delete L[k].I; });        // (the parser indexes each language once: again, with the new words)
  if (L.zh) delete L.zh.I; if (L.ja) delete L.ja.I;
  // the language engine's items (the overworld's v.blow from peaks.js when it's there: one object, so nothing's lost)
  const N = (id, es, pt, de, en, g, icon) => ({ id, es, pt, de, en, g, icon: icon || id.split('.')[1], battle: true });
  const blow = (typeof LEX !== 'undefined' && LEX.item('v.blow')) || Object.assign(N('v.blow', 'sopla', 'sopra', 'puste', 'blow', null, 'blow'), { kind: 'verb', zh: '[吹|chuī]', ja: '[吹|ふ]いて', alt: { es: ['sople', 'sóplale'], pt: ['sopre', 'assopra'], de: ['pust', 'pusten', 'blas', 'blase'], ja: ['[吹|ふ]け', '[吹|ふ]く'] } });
  blow.battle = true;
  const snowball = Object.assign(N('n.snowball', 'bola de nieve', 'bola de neve', 'Schneeball', 'snowball', { es: 'f', pt: 'f', de: 'm' }, 'snowball'), { zh: '[雪球|xuě qiú]', ja: '[雪玉|ゆきだま]',
    pl: { es: 'bolas de nieve', pt: 'bolas de neve', de: 'Schneebälle', zh: '[雪球|xuě qiú]', ja: '[雪玉|ゆきだま]' }, alt: { es: ['bola'], pt: ['bola'], ja: ['ゆきだま'] } });
  for (const it of [blow, snowball]) if (!_.ITEMS.some(x => x.id === it.id)) _.ITEMS.push(it);
  if (typeof LEX !== 'undefined') { const add = [blow, snowball].filter(it => !LEX.item(it.id)); if (add.length) LEX.register(add); }
  if (typeof ICONS !== 'undefined' && !ICONS.keys.includes('snowball')) ICONS.add('snowball', (c, p, h) => {
    h.shape(c, p, h.ell(0, 8, 28, 27), '#eef3f8'); h.shape(c, p, h.ell(12, -6, 8, 7), '#dbe5ee');
    h.shape(c, p, cc => { cc.moveTo(-22, -12); cc.quadraticCurveTo(0, -42, 22, -12); cc.closePath(); }, '#e2574c'); h.shape(c, p, h.ell(0, -36, 6, 6), '#ffffff');
    h.shape(c, p, h.rr(-26, 22, 52, 9, 4), '#e2574c');
    if (p) { h.dot(c, -8, 4, 3.2, h.INK); h.dot(c, 8, 4, 3.2, h.INK); for (let i = -2; i <= 2; i++) h.dot(c, i * 4, 15 - Math.abs(i) * 0.8, 1.6, h.INK); }
  });
  if (typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(snowball.zh); CJK.addSource(snowball.ja); CJK.addSource('[吹|chuī] [吹走|chuī zǒu]'); CJK.addSource('[吹|ふ]いて'); } catch (e) { /* optional */ } }
})();

// ================================================================ Region 6, Port Brisa (appended): the crab and «llama»
// el cangrejo · o caranguejo · die Krabbe (a die-word: «Schlag die rote Krabbe von hinten!»). Crabs walk sideways with their
// shell and claws to the front: a hit from the front clangs off. Say where: «por detrás» / «por trás» / «von hinten» /
// «从后面» / «後ろから» (flow.js takes the phrase out before the parser reads the command, and the hit lands ×2). Call
// («llama / chama / ruf», 叫, 呼んで; learned from Nico at the moat) takes no target: the gulls dive at everyone.
// (Parked: Port Brisa isn't loaded yet, so none of this is registered until port.js is: PORT is defined before this file.)
(() => {
  if (typeof PORT === 'undefined') return;
  const _ = window.BATTLE._, L = _.LANGS;
  const put = (o, k, v) => { if (o && o[k] === undefined) o[k] = v; };
  const lines = (lang, t) => { if (L[lang]) for (const [k, v] of Object.entries(t)) put(L[lang].t, k, v); };
  // Spanish
  put(L.es.species, 'crab', { w: 'cangrejo', pl: 'cangrejos', g: 'm', en: 'crab' });
  put(L.es.verbs, 'call', { show: 'llama', forms: ['llama', 'llame', 'llamá', 'llámalas', 'llámalos'], en: 'call' });
  put(L.es.frames, 'behindT', { text: '¡Golpea al cangrejo ___ por detrás!', pat: 'hit+target' }); put(L.es.frames, 'callT', { text: '¡Llama!', pat: 'verb' });
  put(L.es.tips, 'crab', 'Crabs walk sideways, shell and claws always to the front: a hit from the front just clangs off. Say where: «por detrás» (from behind). «¡Golpea al cangrejo rojo por detrás!» lands ×2.');
  put(L.es.tips, 'call', 'Call («llama»): the gulls come diving at everyone, a peck each, and the ones that fly fall down for a round.');
  put(L.es, 'behindWord', 'por detrás');
  lines('es', { crabClang: ['¡Clanc! ¡Por delante, no!', 'Clang! Not from the front!'], calling: ['¡Gaviotaaas! ¡Vengan!', 'Gulls! Come here!'] });
  Object.assign(L.es.gloss, { cangrejo: 'crab', cangrejos: 'crabs', llama: 'call', 'detrás': 'behind', detras: 'behind', 'atrás': 'behind', delante: 'in front', gaviotas: 'gulls', vengan: 'come (you all)', clanc: 'clang' });
  // Portuguese
  put(L.pt.species, 'crab', { w: 'caranguejo', pl: 'caranguejos', g: 'm', en: 'crab' });
  put(L.pt.verbs, 'call', { show: 'chama', forms: ['chama', 'chame', 'chamem'], en: 'call' });
  put(L.pt.frames, 'behindT', { text: 'Bate no caranguejo ___ por trás!', pat: 'hit+target' }); put(L.pt.frames, 'callT', { text: 'Chama!', pat: 'verb' });
  put(L.pt.tips, 'crab', 'Crabs walk sideways, shell and claws always to the front: a hit from the front just clangs off. Say where: «por trás» (from behind). «Bate no caranguejo vermelho por trás!» lands ×2.');
  put(L.pt.tips, 'call', 'Call («chama»): the gulls come diving at everyone, a peck each, and the ones that fly fall down for a round.');
  put(L.pt, 'behindWord', 'por trás');
  lines('pt', { crabClang: ['Clanc! Pela frente, não!', 'Clang! Not from the front!'], calling: ['Gaivotaaas! Venham!', 'Gulls! Come here!'] });
  Object.assign(L.pt.gloss, { caranguejo: 'crab', caranguejos: 'crabs', chama: 'call', 'trás': 'behind', tras: 'behind', frente: 'front', gaivotas: 'gulls', venham: 'come (you all)', clanc: 'clang' });
  // German
  put(L.de.species, 'crab', { w: 'Krabbe', pl: 'Krabben', gen: 'Krabbe', g: 'f', en: 'crab' });
  put(L.de.verbs, 'call', { show: 'ruf', forms: ['ruf', 'rufe', 'ruft'], en: 'call' });
  put(L.de.frames, 'behindT', { text: 'Schlag die ___ Krabbe von hinten!', pat: 'hit+target' }); put(L.de.frames, 'callT', { text: 'Ruf!', pat: 'verb' });
  put(L.de.tips, 'crab', '«die Krabbe» is a die-word. Crabs walk sideways, shell and claws always to the front: a hit from the front just clangs off. Say where: «von hinten» (from behind). «Schlag die rote Krabbe von hinten!» lands ×2.');
  put(L.de.tips, 'call', 'Call («ruf»): the gulls come diving at everyone, a peck each, and the ones that fly fall down for a round.');
  put(L.de, 'behindWord', 'von hinten');
  lines('de', { crabClang: ['Klong! Nicht von vorne!', 'Clang! Not from the front!'], calling: ['Möwen! Kommt her!', 'Gulls! Come here!'] });
  Object.assign(L.de.gloss, { krabbe: 'crab', krabben: 'crabs', ruf: 'call', hinten: 'behind', vorne: 'in front', 'möwen': 'gulls', kommt: 'come (you all)', klong: 'clang' });
  // Chinese and Japanese: the crab, call (parser.js reads it like sing: no target), and «from behind»
  if (L.zh) {
    put(L.zh.species, 'crab', { w: '[螃蟹|páng xiè]', en: 'crab', g: 'm', cl: '只', alt: ['[蟹|xiè]'] });
    put(L.zh.verbs, 'call', { show: '[叫|jiào]', forms: ['[叫|jiào]', '[叫来|jiào lái]'], en: 'call', cj: [['[叫|jiào]', 'ok'], ['[叫来|jiào lái]', 'ok', 'result'], ['[喊|hǎn]', 'ok']] });
    if (L.zh.frames) { put(L.zh.frames, 'behindT', { text: '[从|cóng] [后面|hòu miàn] [打|dǎ] ___ [的|de] [螃蟹|páng xiè] ！', pat: 'hit+target' }); put(L.zh.frames, 'callT', { text: '[叫|jiào] ！', pat: 'verb' }); }
    if (L.zh.tips) { put(L.zh.tips, 'crab', 'Crabs walk sideways, shell and claws always to the front: a hit from the front just clangs off. Say where: «[从|cóng] [后面|hòu miàn]» (from behind), before the verb: «[从|cóng] [后面|hòu miàn] [打|dǎ] [红|hóng] [螃蟹|páng xiè] ！» lands ×2.'); put(L.zh.tips, 'call', 'Call («[叫|jiào]»): the gulls come diving at everyone, a peck each, and the ones that fly fall down for a round.'); }
    put(L.zh, 'behindWord', '从后面');
    lines('zh', { crabClang: ['[当|dāng] ！ [前面|qián miàn] [不行|bù xíng] ！', 'Clang! Not from the front!'], calling: ['[海鸥|hǎi ōu] ， [快|kuài] [来|lái] ！', 'Gulls! Come here!'] });
  }
  if (L.ja) {
    put(L.ja.species, 'crab', { w: 'カニ', en: 'crab', g: 'm', alt: ['かに', '[蟹|かに]'], kata: true });
    put(L.ja.verbs, 'call', { show: '[呼|よ]んで', forms: ['[呼|よ]んで'], en: 'call', cj: [['[呼|よ]んで', 'te'], ['[呼|よ]べ', 'imp'], ['[呼|よ]ぶ', 'dict'], ['[呼|よ]びます', 'masu']] });
    if (L.ja.frames) { put(L.ja.frames, 'behindT', { text: '[後|うし]ろ から ___ カニ を [打|う]って ！', pat: 'hit+target' }); put(L.ja.frames, 'callT', { text: '[呼|よ]んで ！', pat: 'verb' }); }
    if (L.ja.tips) { put(L.ja.tips, 'crab', 'Crabs walk sideways, shell and claws always to the front: a hit from the front just clangs off. Say where: «[後|うし]ろ から» (from behind): «[後|うし]ろ から [赤|あか]い カニ を [打|う]って ！» lands ×2.'); put(L.ja.tips, 'call', 'Call («[呼|よ]んで»): the gulls come diving at everyone, a peck each, and the ones that fly fall down for a round.'); }
    put(L.ja, 'behindWord', '後ろから');
    lines('ja', { crabClang: ['ガキン ！ [前|まえ] から は だめ ！', 'Clang! Not from the front!'], calling: ['カモメ たち 、 おいで ！', 'Gulls! Come here!'] });
  }
  ['es', 'pt', 'de'].forEach(k => { delete L[k].I; });        // (the parser indexes each language once: again, with the new words)
  if (L.zh) delete L.zh.I; if (L.ja) delete L.ja.I;
  // the language engine's items (the overworld's v.call from port.js when it's there: one object, so nothing's lost)
  const N = (id, es, pt, de, en, g, icon) => ({ id, es, pt, de, en, g, icon: icon || id.split('.')[1], battle: true });
  const call = (typeof LEX !== 'undefined' && LEX.item('v.call')) || Object.assign(N('v.call', 'llama', 'chama', 'ruf', 'call', null, 'call'), { kind: 'verb', zh: '[叫|jiào]', ja: '[呼|よ]んで', alt: { es: ['llame', 'llamá'], pt: ['chame', 'chamem'], de: ['rufe', 'ruft', 'rufen'], zh: ['[叫来|jiào lái]', '[喊|hǎn]'], ja: ['[呼|よ]べ', '[呼|よ]ぶ'] } });
  call.battle = true;
  const crab = Object.assign(N('n.crab', 'cangrejo', 'caranguejo', 'Krabbe', 'crab', { es: 'm', pt: 'm', de: 'f' }, 'crab'), { zh: '[螃蟹|páng xiè]', ja: 'カニ',
    pl: { es: 'cangrejos', pt: 'caranguejos', de: 'Krabben', zh: '[螃蟹|páng xiè]', ja: 'カニ' }, alt: { ja: ['かに', '[蟹|かに]'], zh: ['[蟹|xiè]'] } });
  for (const it of [call, crab]) if (!_.ITEMS.some(x => x.id === it.id)) _.ITEMS.push(it);
  if (typeof LEX !== 'undefined') { const add = [call, crab].filter(it => !LEX.item(it.id)); if (add.length) LEX.register(add); }
  if (typeof ICONS !== 'undefined' && !ICONS.keys.includes('crab')) ICONS.add('crab', (c, p, h) => {
    for (const s of [-1, 1]) { for (let i = 0; i < 3; i++) h.shape(c, p, h.rr(s * 22 + (s < 0 ? -18 : 0), 6 + i * 8, 18, 4, 2), '#c9433a'); h.shape(c, p, h.ell(s * 30, -20, 12, 10, s * 0.4), '#e2574c'); }
    h.shape(c, p, h.ell(0, 8, 30, 18), '#e2574c'); h.shape(c, p, h.ell(0, 14, 22, 9), '#f2a49a');
    if (p) { h.dot(c, -9, -2, 3.5, h.INK); h.dot(c, 9, -2, 3.5, h.INK); }
  });
  if (typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(crab.zh); CJK.addSource(crab.ja); CJK.addSource('[叫|jiào] [叫来|jiào lái] [从|cóng] [后面|hòu miàn] [海鸥|hǎi ōu]'); CJK.addSource('[呼|よ]んで [後|うし]ろ から カモメ'); } catch (e) { /* optional */ } }
})();

// ================================================================ The Great Mill's giant armadillo (appended, DESIGN.md 16): a boss
// It guards Molinar's bell for the Hush. Its attacks are shouted first with the dodge words the first fights taught («por arriba»
// / «por abajo»; at tier 3 the head and the feet), one move or (angry, phase 3) two in a row with «primero… y luego…» / «erst… und
// dann…» / «先…再…» / «まず…それから…». After rolling it's dizzy («mareado»): then a push flips it. Plus Mimo's lines for a freed word
// and a level-up (battle/rewards.js), and «lanza / joga / wirf»'s forms for the mill (mill.js: the sail loft).
(() => {
  const _ = window.BATTLE._, L = _.LANGS;
  const put = (o, k, v) => { if (o && o[k] === undefined) o[k] = v; };
  const lines = (lang, t) => { if (L[lang]) for (const [k, v] of Object.entries(t)) put(L[lang].t, k, v); };
  // the shout before each attack: moves = [high] or [high, high2] (true: a bounce at your head, duck ↓; false: a roll along the
  // ground, jump ↑); the words in it are exactly the dodge words (dodgeWords), so the hint under the box matches
  const EN = { hi: 'up high', lo: 'down low', hiP: 'the head', loP: 'the feet' };
  const two = (mv, f, g, en) => { const a = mv[0] ? 'hi' : 'lo', b = mv[1] ? 'hi' : 'lo'; return [f(a, b), en(a, b)]; };
  // Spanish
  {
    const W = { hi: 'por arriba', lo: 'por abajo' }, P = { hi: 'la cabeza', lo: 'los pies' };
    put(L.es, 'armaShout', (tier, mv) => {
      if (mv.length > 1) return tier >= 3 ? two(mv, (a, b) => `¡Primero ${P[a]}… y luego ${P[b]}!`, 0, (a, b) => `First ${EN[a + 'P']}… and then ${EN[b + 'P']}!`)
        : two(mv, (a, b) => `¡Primero ${W[a]}… y luego ${W[b]}!`, 0, (a, b) => `First ${EN[a]}… and then ${EN[b]}!`);
      if (tier >= 3) return mv[0] ? ['¡Rebotando… te doy en la cabeza!', 'Bouncing… I’ll get you on the head!'] : ['¡Rodando… te doy en los pies!', 'Rolling… I’ll get you on the feet!'];
      return mv[0] ? ['¡Ahí voy, rebotando… por arriba!', 'Here I come, bouncing… up high!'] : ['¡Ahí voy, rodando… por abajo!', 'Here I come, rolling… down low!'];
    });
    put(L.es.labels, 'dizzy', 'mareado');
    put(L.es.tips, 'armaBoss', 'The giant armadillo is too heavy to push… until it has rolled at you: then it’s dizzy («mareado»). That’s your moment: «¡Empuja al armadillo!» On its back («boca arriba») its belly takes ×2. Listen to its shout: «por arriba» → duck ↓, «por abajo» → jump ↑.');
    lines('es', {
      armaWake: ['¿Quién me despierta? ¡Shhh! ¡Nadie toca mi campana!', 'Who’s waking me? Shhh! Nobody touches my bell!'],
      armaName: ['¡Soy el Gran Armadillo! ¡Aquí manda el Silencio!', 'I’m the Great Armadillo! The Hush rules here!'],
      armaDizzy: ['¡Ay, ay, ay… qué mareo!', 'Ow, ow, ow… I’m so dizzy!'],
      armaPush: ['¡Está mareado! ¡Empújalo!', 'It’s dizzy! Push it!'],
      armaHeavy: ['¡Uf! ¡Pesa mucho!', 'Oof! It’s so heavy!'],
      armaShake: ['¡Ya no estoy mareado!', 'I’m not dizzy anymore!'],
      armaCall: ['¡Calladitos! ¡Ayúdenme!', 'Hushlings! Help me!'],
      armaAngry: ['¡Ahora sí estoy enojado!', 'Now I’m really angry!'],
      armaHurt: ['¡Ay, mi panza!', 'Ow, my belly!'],
      armaGiveUp: ['¡Ay… el Silencio se va…!', 'Oh… the Hush is leaving…'],
      armaAfter: ['¡Qué sueño tan feo! ¡Gracias! ¡Toquen la campana!', 'What a bad dream! Thank you! Ring the bell!'],
      freed: ['¡Una palabra!', 'A word!'],
      levelUp: ['¡Soy más fuerte!', 'I’m stronger!'],
    });
    Object.assign(L.es.gloss, { 'quién': 'who', despierta: 'wakes up', nadie: 'nobody', toca: 'touches', campana: 'bell', gran: 'great', manda: 'rules / is in charge', 'ahí': 'there', voy: 'I go', rebotando: 'bouncing',
      rodando: 'rolling', doy: 'I hit / I give', pies: 'feet', luego: 'then', mareo: 'dizziness', mareado: 'dizzy', 'empújalo': 'push it', pesa: 'it weighs', mucho: 'a lot', 'ayúdenme': 'help me', 'enojado': 'angry',
      va: 'goes', sueño: 'dream', feo: 'ugly / bad', gracias: 'thank you', toquen: 'ring / play (you all)', palabra: 'word', 'más': 'more', fuerte: 'strong' });
  }
  // Portuguese (o tatuzão: -ão makes it big)
  {
    const W = { hi: 'por cima', lo: 'por baixo' }, P = { hi: 'na cabeça', lo: 'nos pés' };
    put(L.pt, 'armaShout', (tier, mv) => {
      if (mv.length > 1) return tier >= 3 ? two(mv, (a, b) => `Primeiro ${P[a]}… e depois ${P[b]}!`, 0, (a, b) => `First ${EN[a + 'P']}… and then ${EN[b + 'P']}!`)
        : two(mv, (a, b) => `Primeiro ${W[a]}… e depois ${W[b]}!`, 0, (a, b) => `First ${EN[a]}… and then ${EN[b]}!`);
      if (tier >= 3) return mv[0] ? ['Quicando… vou te pegar na cabeça!', 'Bouncing… I’ll get you on the head!'] : ['Rolando… vou te pegar nos pés!', 'Rolling… I’ll get you on the feet!'];
      return mv[0] ? ['Lá vou eu, quicando… por cima!', 'Here I come, bouncing… up high!'] : ['Lá vou eu, rolando… por baixo!', 'Here I come, rolling… down low!'];
    });
    put(L.pt.labels, 'dizzy', 'tonto');
    put(L.pt.tips, 'armaBoss', 'The giant armadillo is too heavy to push… until it has rolled at you: then it’s dizzy («tonto»). That’s your moment: «Empurra o tatu!» On its back its belly takes ×2. Listen to its shout: «por cima» → duck ↓, «por baixo» → jump ↑.');
    lines('pt', {
      armaWake: ['Quem me acordou? Psiu! Ninguém toca no meu sino!', 'Who woke me up? Shhh! Nobody touches my bell!'],
      armaName: ['Eu sou o Tatuzão! Aqui manda o Silêncio!', 'I’m the Great Armadillo! The Hush rules here!'],
      armaDizzy: ['Ai, ai, ai… que tontura!', 'Ow, ow, ow… I’m so dizzy!'],
      armaPush: ['Ele tá tonto! Empurra!', 'It’s dizzy! Push it!'],
      armaHeavy: ['Ufa! É muito pesado!', 'Oof! It’s so heavy!'],
      armaShake: ['Não tô mais tonto!', 'I’m not dizzy anymore!'],
      armaCall: ['Caladinhos! Me ajudem!', 'Hushlings! Help me!'],
      armaAngry: ['Agora eu tô bravo de verdade!', 'Now I’m really angry!'],
      armaHurt: ['Ai, minha barriga!', 'Ow, my belly!'],
      armaGiveUp: ['Ai… o Silêncio tá indo embora…', 'Oh… the Hush is leaving…'],
      armaAfter: ['Que sonho feio! Obrigado! Toquem o sino!', 'What a bad dream! Thank you! Ring the bell!'],
      freed: ['Uma palavra!', 'A word!'],
      levelUp: ['Tô mais forte!', 'I’m stronger!'],
    });
    Object.assign(L.pt.gloss, { quem: 'who', acordou: 'woke up', psiu: 'shhh', 'ninguém': 'nobody', toca: 'touches', sino: 'bell', 'tatuzão': 'big armadillo (-ão: big)', manda: 'rules / is in charge', vou: 'I go', quicando: 'bouncing',
      rolando: 'rolling', pegar: 'get / catch', primeiro: 'first', depois: 'then / after', tontura: 'dizziness', tonto: 'dizzy', empurra: 'push', pesado: 'heavy', ajudem: 'help (you all)', bravo: 'angry', verdade: 'truth (de verdade = really)',
      barriga: 'belly', embora: 'away (ir embora = to leave)', sonho: 'dream', feio: 'ugly / bad', obrigado: 'thank you', toquem: 'ring / play (you all)', palavra: 'word', forte: 'strong' });
  }
  // German (das Riesengürteltier: «Ihm ist schwindlig», the neuter dative)
  {
    const W = { hi: 'von oben', lo: 'von unten' }, P = { hi: 'auf den Kopf', lo: 'auf die Füße' };
    put(L.de, 'armaShout', (tier, mv) => {
      if (mv.length > 1) return tier >= 3 ? two(mv, (a, b) => `Erst ${P[a]}… und dann ${P[b]}!`, 0, (a, b) => `First ${EN[a + 'P']}… and then ${EN[b + 'P']}!`)
        : two(mv, (a, b) => `Erst ${W[a]}… und dann ${W[b]}!`, 0, (a, b) => `First ${EN[a]}… and then ${EN[b]}!`);
      if (tier >= 3) return mv[0] ? ['Ich hüpfe… auf deinen Kopf!', 'I’m bouncing… onto your head!'] : ['Ich rolle… auf deine Füße!', 'I’m rolling… onto your feet!'];
      return mv[0] ? ['Jetzt komme ich gehüpft… von oben!', 'Here I come, bouncing… from up high!'] : ['Jetzt komme ich gerollt… von unten!', 'Here I come, rolling… from down low!'];
    });
    put(L.de.labels, 'dizzy', 'schwindlig');
    put(L.de.tips, 'armaBoss', 'The giant armadillo is too heavy to push… until it has rolled at you: then it’s dizzy («schwindlig»). That’s your moment: «Schieb das Gürteltier!» On its back its belly takes ×2. Listen to its shout: «von oben» → duck ↓, «von unten» → jump ↑.');
    lines('de', {
      armaWake: ['Wer weckt mich? Pssst! Niemand berührt meine Glocke!', 'Who’s waking me? Shhh! Nobody touches my bell!'],
      armaName: ['Ich bin das Riesengürteltier! Hier herrscht die Stille!', 'I’m the giant armadillo! The Hush rules here!'],
      armaDizzy: ['Au, au, au… mir ist so schwindlig!', 'Ow, ow, ow… I’m so dizzy!'],
      armaPush: ['Ihm ist schwindlig! Schieb es!', 'It’s dizzy! Push it!'],
      armaHeavy: ['Uff! Das ist zu schwer!', 'Oof! It’s too heavy!'],
      armaShake: ['Mir ist nicht mehr schwindlig!', 'I’m not dizzy anymore!'],
      armaCall: ['Schweiglinge! Helft mir!', 'Hushlings! Help me!'],
      armaAngry: ['Jetzt bin ich wirklich wütend!', 'Now I’m really angry!'],
      armaHurt: ['Au, mein Bauch!', 'Ow, my belly!'],
      armaGiveUp: ['Oh… die Stille geht weg…', 'Oh… the Hush is leaving…'],
      armaAfter: ['Was für ein böser Traum! Danke! Läutet die Glocke!', 'What a bad dream! Thank you! Ring the bell!'],
      freed: ['Ein Wort!', 'A word!'],
      levelUp: ['Ich bin stärker!', 'I’m stronger!'],
    });
    Object.assign(L.de.gloss, { wer: 'who', weckt: 'wakes', niemand: 'nobody', 'berührt': 'touches', glocke: 'bell', 'riesengürteltier': 'giant armadillo', herrscht: 'rules', stille: 'silence (the Hush)', komme: 'I come', 'gehüpft': 'bouncing (gehüpft kommen)',
      gerollt: 'rolling (gerollt kommen)', 'hüpfe': 'I bounce', rolle: 'I roll', erst: 'first', dann: 'then', schwindlig: 'dizzy (mir ist schwindlig = I’m dizzy)', ihm: 'to it (ihm ist… = it is…)', schieb: 'push', schwer: 'heavy', helft: 'help (you all)',
      'wütend': 'angry', bauch: 'belly', geht: 'goes', weg: 'away', 'böser': 'bad', traum: 'dream', danke: 'thanks', 'läutet': 'ring (you all)', wort: 'word', 'stärker': 'stronger' });
  }
  // Chinese (the boss and Mimo speak casually)
  if (L.zh) {
    const W = { hi: '[上面|shàng miàn]', lo: '[下面|xià miàn]' }, P = { hi: '[头|tóu]', lo: '[脚|jiǎo]' };
    put(L.zh, 'armaShout', (tier, mv) => {
      if (mv.length > 1) return tier >= 3 ? two(mv, (a, b) => `[先|xiān] [打|dǎ] ${P[a]} … [再|zài] [打|dǎ] ${P[b]} ！`, 0, (a, b) => `First ${EN[a + 'P']}… and then ${EN[b + 'P']}!`)
        : two(mv, (a, b) => `[先|xiān] ${W[a]} … [再|zài] ${W[b]} ！`, 0, (a, b) => `First ${EN[a]}… and then ${EN[b]}!`);
      if (tier >= 3) return mv[0] ? ['[我|wǒ] [弹|tán] [过来|guò lái] ， [打|dǎ] [你|nǐ] [的|de] [头|tóu] ！', 'I’m bouncing over… I’ll hit your head!'] : ['[我|wǒ] [滚|gǔn] [过来|guò lái] ， [打|dǎ] [你|nǐ] [的|de] [脚|jiǎo] ！', 'I’m rolling over… I’ll hit your feet!'];
      return mv[0] ? ['[我|wǒ] [弹|tán] [过来|guò lái] [了|le] … [上面|shàng miàn] ！', 'Here I come, bouncing… up high!'] : ['[我|wǒ] [滚|gǔn] [过来|guò lái] [了|le] … [下面|xià miàn] ！', 'Here I come, rolling… down low!'];
    });
    if (L.zh.labels) put(L.zh.labels, 'dizzy', '[晕|yūn] [了|le]');
    if (L.zh.tips) put(L.zh.tips, 'armaBoss', 'The giant armadillo is too heavy to push… until it has rolled at you: then it’s dizzy («[晕|yūn] [了|le]»). That’s your moment: «[推|tuī] [犰狳|qiú yú] ！» On its back its belly takes ×2. Listen to its shout: «[上面|shàng miàn]» → duck ↓, «[下面|xià miàn]» → jump ↑.');
    lines('zh', {
      armaWake: ['[谁|shéi] [吵醒|chǎo xǐng] [我|wǒ] [了|le] ？ [嘘|xū] ！ [谁|shéi] [也|yě] [不许|bù xǔ] [碰|pèng] [我|wǒ] [的|de] [钟|zhōng] ！', 'Who’s waking me? Shhh! Nobody touches my bell!'],
      armaName: ['[我|wǒ] [是|shì] [大|dà] [犰狳|qiú yú] ！ [这里|zhè lǐ] [归|guī] [寂静|jì jìng] [管|guǎn] ！', 'I’m the Great Armadillo! The Hush rules here!'],
      armaDizzy: ['[哎哟|āi yō] [哎哟|āi yō] … [好|hǎo] [晕|yūn] ！', 'Ow, ow… I’m so dizzy!'],
      armaPush: ['[它|tā] [晕|yūn] [了|le] ！ [推|tuī] [它|tā] ！', 'It’s dizzy! Push it!'],
      armaHeavy: ['[哎呀|āi yā] ！ [太|tài] [重|zhòng] [了|le] ！', 'Oof! It’s too heavy!'],
      armaShake: ['[我|wǒ] [不|bù] [晕|yūn] [了|le] ！', 'I’m not dizzy anymore!'],
      armaCall: ['[小默默|xiǎo mò mò] ！ [快|kuài] [来|lái] [帮|bāng] [我|wǒ] ！', 'Hushlings! Help me!'],
      armaAngry: ['[这下|zhè xià] [我|wǒ] [真的|zhēn de] [生气|shēng qì] [了|le] ！', 'Now I’m really angry!'],
      armaHurt: ['[哎哟|āi yō] ， [我|wǒ] [的|de] [肚子|dù zi] ！', 'Ow, my belly!'],
      armaGiveUp: ['[啊|ā] … [寂静|jì jìng] [走|zǒu] [了|le] …', 'Oh… the Hush is leaving…'],
      armaAfter: ['[好|hǎo] [可怕|kě pà] [的|de] [梦|mèng] ！ [谢谢|xiè xie] ！ [快|kuài] [去|qù] [敲钟|qiāo zhōng] [吧|ba] ！', 'What a bad dream! Thank you! Go ring the bell!'],
      freed: ['[一个|yī gè] [词|cí] ！', 'A word!'],
      levelUp: ['[我|wǒ] [变强|biàn qiáng] [了|le] ！', 'I’m stronger!'],
    });
    if (L.zh.gloss) Object.assign(L.zh.gloss, { '谁': 'who', '吵醒': 'wake up (with noise)', '不许': 'not allowed', '碰': 'touch', '钟': 'bell', '犰狳': 'armadillo', '归': 'belongs to', '寂静': 'the Hush', '管': 'run / be in charge', '弹': 'bounce',
      '滚': 'roll', '过来': 'over here', '先': 'first', '再': 'then', '晕': 'dizzy', '推': 'push', '重': 'heavy', '帮': 'help', '生气': 'angry', '肚子': 'belly', '梦': 'dream', '敲钟': 'ring the bell', '词': 'word', '变强': 'get stronger' });
  }
  // Japanese (the boss calls itself わし, like the colonel; Mimo is casual)
  if (L.ja) {
    const W = { hi: '[上|うえ]', lo: '[下|した]' }, P = { hi: '[頭|あたま]', lo: '[足|あし]' };
    put(L.ja, 'armaShout', (tier, mv) => {
      if (mv.length > 1) return tier >= 3 ? two(mv, (a, b) => `まず ${P[a]} 、 それから ${P[b]} を ねらう ぞ ！`, 0, (a, b) => `First ${EN[a + 'P']}… and then ${EN[b + 'P']}!`)
        : two(mv, (a, b) => `まず ${W[a]} 、 それから ${W[b]} だ ！`, 0, (a, b) => `First ${EN[a]}… and then ${EN[b]}!`);
      if (tier >= 3) return mv[0] ? ['はねて 、 [頭|あたま] を ねらう ぞ ！', 'Bouncing… I’m aiming at your head!'] : ['ころがって 、 [足|あし] を ねらう ぞ ！', 'Rolling… I’m aiming at your feet!'];
      return mv[0] ? ['はねて いく ぞ … [上|うえ] だ ！', 'Here I come, bouncing… up high!'] : ['ころがって いく ぞ … [下|した] だ ！', 'Here I come, rolling… down low!'];
    });
    if (L.ja.labels) put(L.ja.labels, 'dizzy', '[目|め] が まわってる');
    if (L.ja.tips) put(L.ja.tips, 'armaBoss', 'The giant armadillo is too heavy to push… until it has rolled at you: then it’s dizzy («[目|め] が まわってる»). That’s your moment: «アルマジロ を [押|お]して ！» On its back its belly takes ×2. Listen to its shout: «[上|うえ]» → duck ↓, «[下|した]» → jump ↑.');
    lines('ja', {
      armaWake: ['だれ だ 、 わし を [起|お]こす の は ？ シーッ ！ わし の [鐘|かね] に [触|さわ]る な ！', 'Who’s waking me? Shhh! Don’t touch my bell!'],
      armaName: ['わし は [大|おお]アルマジロ だ ！ ここ は [静寂|せいじゃく] の もの だ ！', 'I’m the Great Armadillo! This place belongs to the Hush!'],
      armaDizzy: ['うう … [目|め] が まわる …', 'Ugh… my head’s spinning…'],
      armaPush: ['[目|め] を まわしてる ！ [押|お]して ！', 'It’s dizzy! Push it!'],
      armaHeavy: ['うっ ！ [重|おも]すぎる ！', 'Oof! It’s too heavy!'],
      armaShake: ['もう [目|め] は まわって ない ぞ ！', 'I’m not dizzy anymore!'],
      armaCall: ['だまりっこ たち ！ [助|たす]けて くれ ！', 'Hushlings! Help me!'],
      armaAngry: ['もう [本気|ほんき] で [怒|おこ]った ぞ ！', 'Now I’m really angry!'],
      armaHurt: ['いたっ 、 わし の おなか ！', 'Ow, my belly!'],
      armaGiveUp: ['ああ … [静寂|せいじゃく] が [消|き]えて いく …', 'Oh… the Hush is leaving…'],
      armaAfter: ['こわい [夢|ゆめ] だった … ありがとう ！ [鐘|かね] を [鳴|な]らして くれ ！', 'What a bad dream… Thank you! Ring the bell!'],
      freed: ['[言葉|ことば] だ ！', 'A word!'],
      levelUp: ['[強|つよ]く なった よ ！', 'I’m stronger!'],
    });
    if (L.ja.gloss) Object.assign(L.ja.gloss, { '起': 'wake', '鐘': 'bell', '触': 'touch', '大': 'big / great', '静寂': 'the Hush', 'はねて': 'bouncing', 'ころがって': 'rolling', 'ねらう': 'aim at', 'まず': 'first', 'それから': 'and then',
      '目': 'eyes (目がまわる = to be dizzy)', '押': 'push', '重': 'heavy', '助': 'help', '本気': 'for real', '怒': 'angry', 'おなか': 'belly', '消': 'vanish', '夢': 'dream', '鳴': 'ring', '言葉': 'word', '強': 'strong' });
  }
  // «lanza / joga / wirf»: what a kid *is doing* says it too (the mill's sail loft: Mimo learns it watching), so accept those forms
  const T = (typeof LEX !== 'undefined' && LEX.item('v.throw')) || _.ITEMS.find(x => x.id === 'v.throw');
  if (T) {
    T.alt = T.alt || {};
    const add = (l, list) => { T.alt[l] = Array.from(new Set([...(T.alt[l] || []), ...list])); };
    add('es', ['lance', 'lánzala', 'lánzalo', 'lanzo']); add('pt', ['jogue', 'jogo', 'arremessa']); add('de', ['wirft', 'werfen', 'werfe', 'wirf es']);
  }
  if (typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource(L.zh.t); CJK.addSource(L.ja.t); } catch (e) { /* optional */ } }
})();
