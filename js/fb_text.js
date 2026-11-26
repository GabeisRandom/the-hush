'use strict';
// The final battle's words (FB1; DESIGN.md 21.11): every line, card and task of the top of the Old Tower, the vines, the trials inside
// the Hush, its core and the aftermath. English and Spanish here; fb_text_pt.js / _de / _zh / _ja add their language with
// FBTXT.add(lang, pack). zh / ja in CJK.md's notation. Elio is never a villain and never hurt; nobody is blamed; the player is never
// gendered. Nothing here is from any existing game: the names, the lines, the masks and the trials are ours.
//   SPECIES   the battle's words for the foes (the vessel, the hoods, the masks, the echoes, the core)   NAMES  titles and labels
//   LORE      the bestiary's lines                    FIGHT  every line said in the two fights        SCENE  every line said outside them
//   YOU       your thoughts (English; the weave brings words in)                                     CARDS  the trial cards
//   PAGES     trial 1's pages, CHOICES the things you pick from (what each looks like)                RUNGS  trial 2's bank (one per grammar
//   rung, the reflection's wrong line and the task)   SLIPS  trial 2's slips bank                     MASKS  trial 3's people of then and
//   the tasks you tell the boy     TASKS  the rest (the last answer in trial 3, the duo frame)        TIPS   the graders' tips by kind
const FBTXT = (() => {
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const L = (en, es, o) => Object.assign({ en, es }, o || {});

  // ------------------------------------------------------------ the foes, for the battle's word tables (registered by fb_boss.js)
  const SPECIES = {
    fb_vessel: { es: { w: 'silencio', pl: 'silencios', g: 'm', en: 'the Hush' } },
    fb_hood: { es: { w: 'capucha', pl: 'capuchas', g: 'f', en: 'hushed hood' } },
    fb_mask: { es: { w: 'máscara', pl: 'máscaras', g: 'f', en: 'laughing mask' } },
    fb_core: { es: { w: 'corazón', pl: 'corazones', g: 'm', en: 'the heart of the Hush' } },
  };
  const NAMES = {
    vessel: L('the Hush', 'el Silencio'), core: L('the heart of the Hush', 'el corazón del Silencio'),
    hood: L('hushed hood', 'capucha'), mask: L('laughing mask', 'máscara'),
    realm: L('Inside the Hush', 'Dentro del Silencio'),
    t1: L('No voice', 'Sin voz'), t2: L('The mirror', 'El espejo'), t3: L('The laugh', 'La risa'), t4: L('His words', 'Sus palabras'),
    today: L('TODAY', '¡HOY!'), past: L('YESTERDAY', '¡AYER!'), future: L('TOMORROW', '¡MAÑANA!'),
    refl: L('Your reflection', 'Tu reflejo'),
  };
  const LORE = {
    fb_vessel: L('The Hush, wearing Elio like a coat. Every hit blows a little fog off him.', 'El Silencio, puesto encima de Elio como un abrigo. Cada golpe le quita un poco de niebla.'),
    fb_hood: L('An empty hood of fog. It wants everyone to be quiet.', 'Una capucha vacía, hecha de niebla. Quiere que todos se callen.'),
    fb_mask: L('A mask from the concert, still laughing after forty years.', 'Una máscara del concierto. Lleva cuarenta años riéndose.'),
    fb_core: L('The heart of the Hush. Inside it, a small warm light: his voice.', 'El corazón del Silencio. Dentro, una lucecita cálida: su voz.'),
  };

  // ------------------------------------------------------------ the fights (the Hush's voice, Elio's faint one, Noa from the clock,
  // Bruno, {mimo}, the masks, the core)
  const FIGHT = {
    'h.open1': L('Up here, nobody talks.', 'Aquí arriba no se habla.'),
    'h.open2': L('This body is mine… and so is his voice.', 'Este cuerpo es mío… y su voz también.'),
    'h.hoods': L('Hoods! Don’t let them say a single word!', '¡Capuchas! ¡Que no digan ni una palabra!'),
    'h.wall': L('You can’t reach me. My hoods cover me.', 'No me alcanzas. Mis capuchas me cubren.'),
    'h.hurt': L('My fog…!', '¡Mi niebla…!'),
    'h.wind': L('You want to talk? Talk… to yesterday.', '¿Quieres hablar? Habla… con el ayer.'),
    'h.masks': L('Remember the laughter? They do.', '¿Te acuerdas de la risa? Ellas sí.'),
    'h.forward': L('Then tomorrow. Nobody talks there either.', 'Entonces, el mañana. Allí tampoco habla nadie.'),
    'h.echoes': L('Look what I became in every tomorrow.', 'Mira en qué me convertí en cada mañana.'),
    'h.fury': L('Yesterday, today, tomorrow… it’s all silence!', '¡Ayer, hoy y mañana… todo es silencio!'),
    'h.shut': L('Be quiet!', '¡Cállate!'), 'h.shh': L('Silence!', '¡Silencio!'),
    'h.basta': L('ENOUGH!', '¡BASTA!'),
    'h.down': L('Shh… Up here, nobody talks.', 'Shh… Aquí arriba no se habla.'),
    // its taunts, before its blows (one each time, in turn)
    'h.t1': L('Nobody hears you.', 'Nadie te escucha.'),
    'h.t2': L('Give up.', 'Ríndete.'),
    'h.t3': L('Your voice doesn’t reach up here.', 'Aquí tu voz no llega.'),
    'h.t4': L('Still talking?', '¿Todavía hablas?'),
    'h.t5': L('Every word you say is a mistake.', 'Cada palabra tuya es un error.'),
    'h.t6': L('I’m bigger than all your words.', 'Soy más grande que todas tus palabras.'),
    'h.flinch': L('Was that a word?', '¿Eso fue una palabra?'),
    'h.seam': L('What…? My fog!', '¿Qué…? ¡Mi niebla!'),
    'h.walls': L('Let it all come down!', '¡Que se caiga todo!'),
    'h.crumble': L('This tower is mine. And so are you.', 'Esta torre es mía. Y tú también.'),
    'n.crack': L('Don’t go quiet! TALK!', '¡No te calles! ¡HABLA!'),
    'n.voice': L('Your voice is full! Now: everything you’ve got, a long chain!', '¡Tu voz está llena! ¡Ahora, todo lo que tienes: una cadena larga!'),
    'b.up': L('Get up! Again!', '¡Arriba! ¡Otra vez!'),
    'e.5': L('…don’t give up…', '…no se rindan…'),
    'e.last': L('…don’t go quiet…', '…no te calles…'),
    'v.shout': L('VOICE!', '¡VOZ!'),
    'e.1': L('…I don’t want… to hurt you…', '…no quiero… hacerles daño…'),
    'e.2': L('…Noa… forgive me…', '…Noa… perdóname…'),
    'e.3': L('…don’t go quiet…', '…no se callen…'),
    'e.4': L('…keep… talking…', '…sigan… hablando…'),
    'e.where': L('…{where}…', '…{where}…'),
    'n.p1': L('The hoods are shielding it! Them first. Say which one: the red one, the blue one… the big one.', '¡Las capuchas lo protegen! Primero ellas. Di cuál: la roja, la azul… la grande.'),
    'n.big': L('If the big one falls, the others run!', '¡Si cae la grande, las otras huyen!'),
    'hd.flee': L('Shh… run!', 'Shh… ¡a correr!'),
    'n.open': L('They’re gone! Now hit the Hush!', '¡Ya no están! ¡Ahora, al Silencio!'),
    'n.p2': L('Now it’s a memory! Tell {mimo} in the past.', '¡Ahora es un recuerdo! Cuéntaselo a {mimo} en pasado.'),
    'n.laugh': L('Don’t go quiet! If they laugh, keep talking: a chain with «y».', '¡No te calles! Si se ríen, sigue hablando: una cadena con «y».'),
    'n.p3': L('It’s tomorrow! Say what {mimo} will do… and what they’ll do.', '¡Es el mañana! Di lo que {mimo} hará… y lo que ellos harán.'),
    'n.p4': L('Watch the clock’s hand! Speak in the time it shows: yesterday, today or tomorrow.', '¡Mira la aguja del reloj! Habla en el tiempo que marca: ayer, hoy o mañana.'),
    'n.down': L('Don’t go quiet! Talk!', '¡No te calles! ¡Habla!'),
    'n.gentle': L('Breathe. This time we’ll do it as a team.', 'Respira. Esta vez lo hacemos en equipo.'),
    'b.in': L('Hey! You’re not fighting without me!', '¡Eh! ¡No vas a pelear sin mí!'),
    'b.team': L('Give me orders! «Bruno, protect {mimo}»… whatever you want!', '¡Dame órdenes! «Bruno, protege a {mimo}»… ¡lo que quieras!'),
    'm.notfall': L('This time we won’t fall!', '¡Esta vez no nos caemos!'),
    'mk.laugh': L('Ha, ha, ha!', '¡Ja, ja, ja!'), 'mk.broken': L('…ha?', '¿…ja?'),
    'c.open': L('In here, not a single word is left.', 'Aquí dentro no queda ninguna palabra.'),
    'c.steal': L('That word… is mine now.', 'Esa palabra… ahora es mía.'),
    'c.hurt': L('No…!', '¡No…!'),
    'e.catch': L('No! That word is yours! Here!', '¡No! ¡Esa palabra es tuya! ¡Toma!'),
    'e.here': L('I’m here! I’m still here! Keep talking… I’m with you!', '¡Estoy aquí! ¡Sigo aquí! Sigue hablando… ¡estoy contigo!'),
    'e.join': L('This time… I’m talking too. You start… and I’ll finish it.', 'Esta vez… hablo yo también. Empieza tú… y yo termino.'),
    'e.finish': L('…because every voice counts!', '…¡porque toda voz cuenta!'),
    'c.break': L('Words… hurt…', 'Las palabras… duelen…'),
    'e.answer': L('Sometimes they hurt. But silence hurts more.', 'A veces duelen. Pero el silencio duele más.'),
  };

  // ------------------------------------------------------------ outside the fights
  const SCENE = {
    'n.careful': L('Careful! It isn’t him talking!', '¡Cuidado! ¡No es él quien habla!'),
    'e.far': L('Is anyone there?', '¿Hay alguien ahí?'),
    'refl.hi': L('Hi. I’m you… with all your mistakes. Shall we play?', 'Hola. Soy tú… con todos tus errores. ¿Jugamos?'),
    'refl.again': L('Again! Say it right this time.', '¡Otra! Ahora dilo bien.'),
    'refl.forgot': L('How do you say «{en}» again? I forgot.', '¿Cómo se decía «{en}»? Se me olvidó.'),
    'refl.end': L('I made a mistake… and nothing happened.', 'Me equivoqué… y no pasó nada.'),
    'refl.bye': L('Keep talking. Mistakes and all.', 'Sigue hablando. Con errores y todo.'),
    'boy.ask': L('So… they weren’t laughing at me?', '¿Entonces… no se reían de mí?'),
    'boy.smile': L('…It was a little funny, wasn’t it?', '…Fue un poco gracioso, ¿verdad?'),
    'elio.young': L('A frog…? Was that all?', '¿Una rana…? ¿Era eso?'),
    'e.lanterns': L('These are my words… I kept them in the dark.', 'Estas son mis palabras… Las guardé a oscuras.'),
    'e.near': L('You came all the way in here… for me?', '¿Viniste hasta aquí dentro… por mí?'),
    'b.thaw': L('Phew! What did I miss?', '¡Uf! ¿Qué me perdí?'),
  };

  // ------------------------------------------------------------ your thoughts (English: the weave brings your words in)
  const YOU = {
    top: 'Elio… no. That isn’t him talking. The Hush is wearing him like a coat.',
    fog: 'The fog is coming off him in pieces. Every hit lands on the Hush, not on him.',
    flinch: 'It doesn’t even flinch…',
    seam: 'A seam of light in its fog! Now the hits are getting through!',
    voice: '«¡VOZ!» is ready: say a long chain, two or three moves joined with «y».',
    down: 'Knocked down… but every fall makes your voice louder.',
    vines: 'The vines… they’re wrapping around my mouth. I can’t… speak…',
    gag: 'Say something… anything…',
    wake: 'Gray. Everywhere. No sound… not even my own voice. We’re inside the Hush. Inside his silence.',
    t1: 'A jetty in the fog, lanterns everywhere… Lantern Night. His lantern must be here somewhere. I can’t speak… but I can read.',
    t1wrong: 'Not that one… The fog closes in. Read the page again.',
    t1light: 'His lantern. Nobody lit it that night. Let’s light it now.',
    voiceBack: 'My voice… it’s back!',
    t2: 'The Mirror Lake… frozen into a mirror. Someone is standing in it. Me? A gray me.',
    t3: 'The theater, that night. In here, the laughter never stopped.',
    t3listen: 'Hits go right through a laugh. Listen to them instead.',
    t3jetty: 'And this is the other laugh, ten years later, on the jetty in Candil.',
    t4: 'His words, hung up like lanterns in the dark. Give them back to him.',
    core: 'There it is: the heart of the Hush. And inside it, a small warm light.',
    duo: 'Start a long chain: three moves joined with «y»… and leave the end open. Elio will finish it.',
    wordsBack: 'Our words are flying out of the notebook… back to {mimo}!',
  };
  // the trial cards: a title, what to do
  const CARDS = {
    realm: L('Inside the Hush', 'Dentro del Silencio'),
    t1: { title: L('No voice', 'Sin voz'), sub: 'Read your way: find his lantern on the jetty.' },
    t2: { title: L('The mirror', 'El espejo'), sub: 'Your reflection talks with your own slips. Say it right.' },
    t3: { title: L('The laugh', 'La risa'), sub: 'Listen to each mask, then tell him what they really said.' },
    t4: { title: L('His words', 'Sus palabras'), sub: 'Give him back his own words, each in its own time.' },
    core: { title: L('The heart of the Hush', 'El corazón del Silencio'), sub: 'The last fight. Elio’s voice is with you.' },
  };

  // ------------------------------------------------------------ trial 1: the pages on the jetty (A2 → B2), and what each page asks you
  // to pick. Each choice: { id, look: what it is, for the scene }; right: the id that's right
  const PAGES = [
    { who: L('Elio’s note', 'Nota de Elio'), right: 'starRound',
      text: L('Tonight I’m leaving my lantern on the jetty. It’s small and round, and it has a star painted on it.', 'Esta noche dejo mi farol en el muelle. Es pequeño y redondo, y tiene una estrella pintada.') },
    { who: L('The lamplighter’s note', 'Nota del farolero'), right: 'right',
      text: L('Elio: the children’s lanterns go on the left; the grown-ups’, on the right. Don’t put yours with the children’s: you’re grown up now.', 'Elio: los faroles de los niños van a la izquierda; los de los mayores, a la derecha. El tuyo no lo pongas con los de los niños: ya eres mayor.') },
    { who: L('A note in a child’s handwriting', 'Una nota con letra de niño'), right: 'green',
      text: L('Elio! I saved you a spot next to my frog. It’s the green boat, not the blue one. Ramiro', '¡Elio! Te guardé un sitio al lado de mi rana. Es la barca verde, no la azul. Ramiro') },
    { who: L('A page of Elio’s speech', 'Una página del discurso de Elio'), right: 'unlit',
      text: L('If I ever can’t find my words, let someone look for the lantern nobody lit: the only one still waiting by the water.', 'Si alguna vez no encuentro mis palabras, que alguien busque el farol que nadie encendió: el único que todavía espera junto al agua.') },
  ];

  // ------------------------------------------------------------ trial 2: one task for each grammar rung of the second lap (TIME.md §8):
  // the reflection says it wrong (refl), you say it right. Rungs are keyed by the echo that taught them ('molinar.past' …).
  // Fields as FIN.ask grades them: frame, chips, model, want (S), alt (A), person / tense / mood (B, with a tip), past / pres / fut (a
  // miss, with its tip); tipK names each kind's tip in TIPS
  const T = o => o;
  const RUNGS = {
    'alba.past': T({ rung: 'the preterite: what happened', refl: L('Yesterday the bell rings, and everyone runs to the plaza.', 'Ayer la campana suena, y todos corren a la plaza.'),
      frame: { es: 'Ayer la campana ___, y todos ___ a la plaza.' }, chips: { es: [['sonó', 'rang'], ['corrieron', 'ran']] },
      model: L('Yesterday the bell rang, and everyone ran to the plaza.', 'Ayer la campana sonó, y todos corrieron a la plaza.'),
      want: { es: [['sonó', 'corrieron']] }, tense: { es: [['sonaba'], ['corrían']] }, pres: { es: [['suena'], ['corren']] }, tipK: { tense: 'tense', pres: 'pres' } }),
    'molinar.past': T({ rung: 'the preterite, about yourself', refl: L('Yesterday I climb the hill and eat bread at the mill.', 'Ayer subo la colina y como pan en el molino.'),
      frame: { es: 'Ayer ___ la colina y ___ pan en el molino.' }, chips: { es: [['subí', 'I climbed'], ['comí', 'I ate']] },
      model: L('Yesterday I climbed the hill and ate bread at the mill.', 'Ayer subí la colina y comí pan en el molino.'),
      want: { es: [['subí', 'comí']] }, person: { es: [['subió'], ['comió']] }, pres: { es: [['subo'], ['como']] }, tipK: { person: 'personMe', pres: 'pres' } }),
    'lake.past': T({ rung: 'irregular preterites', refl: L('Yesterday I maked the soup and putted the table.', 'Ayer hací la sopa y poní la mesa.'),
      frame: { es: 'Ayer ___ la sopa y ___ la mesa.' }, chips: { es: [['hice', 'I made'], ['puse', 'I set']] },
      model: L('Yesterday I made the soup and set the table.', 'Ayer hice la sopa y puse la mesa.'),
      want: { es: [['hice', 'puse']] }, person: { es: [['hizo'], ['puso']] }, past: { es: [['hací'], ['poní']] }, pres: { es: [['hago'], ['pongo']] }, tipK: { person: 'personMe', past: 'irr', pres: 'pres' } }),
    'quarry.past': T({ rung: 'the imperfect: what used to happen', refl: L('Back then, the miners sang once every day.', 'Antes, los mineros cantaron cada día.'),
      frame: { es: 'Antes, los mineros ___ cada día.' }, chips: { es: [['cantaban', 'used to sing']] },
      model: L('Back then, the miners used to sing every day.', 'Antes, los mineros cantaban cada día.'),
      want: { es: ['cantaban'] }, past: { es: ['cantaron'] }, pres: { es: ['cantan'] }, tipK: { past: 'habit', pres: 'pres' } }),
    'gardens.past': T({ rung: 'the imperfect: how things were', refl: L('The garden was big once, and there were flowers once.', 'El jardín fue grande, y hubo flores por todas partes.'),
      frame: { es: 'El jardín ___ grande, y ___ flores por todas partes.' }, chips: { es: [['era', 'was'], ['había', 'there were']] },
      model: L('The garden was big, and there were flowers everywhere.', 'El jardín era grande, y había flores por todas partes.'),
      want: { es: [['era', 'había']] }, past: { es: [['fue'], ['hubo']] }, pres: { es: [['es'], ['hay']] }, tipK: { past: 'desc', pres: 'pres' } }),
    'peaks.past': T({ rung: 'the preterite against the imperfect', refl: L('When I was arriving, it snowed.', 'Cuando llegaba, nevó.'),
      frame: { es: 'Cuando ___, ___.' }, chips: { es: [['llegué', 'I arrived'], ['nevaba', 'it was snowing']] },
      model: L('When I arrived, it was snowing.', 'Cuando llegué, nevaba.'),
      want: { es: [['llegué', 'nevaba']] }, past: { es: [['llegaba'], ['nevó']] }, pres: { es: [['llego'], ['nieva']] }, tipK: { past: 'swap', pres: 'pres' } }),
    'port.past': T({ rung: '«estaba» + -ando, cut off by what happened', refl: L('I cooked when the bell rang.', 'Yo cociné cuando sonó la campana.'),
      frame: { es: 'Yo ___ ___ cuando sonó la campana.' }, chips: { es: [['estaba', 'was'], ['cocinando', 'cooking']] },
      model: L('I was cooking when the bell rang.', 'Yo estaba cocinando cuando sonó la campana.'),
      want: { es: ['estaba cocinando'] }, alt: { es: ['cocinaba'] }, past: { es: ['cociné'] }, pres: { es: ['cocino', 'estoy cocinando'] }, tipK: { past: 'prog', pres: 'pres' } }),
    'ruins.past': T({ rung: 'the pluperfect: what someone said had happened', refl: L('Elvira said that she finds a treasure.', 'Elvira dijo que encuentra un tesoro.'),
      frame: { es: 'Elvira dijo que ___ ___ un tesoro.' }, chips: { es: [['había', 'had'], ['encontrado', 'found']] },
      model: L('Elvira said that she had found a treasure.', 'Elvira dijo que había encontrado un tesoro.'),
      want: { es: ['había encontrado'] }, alt: { es: ['encontró'] }, pres: { es: ['encuentra', 'ha encontrado'] }, fut: { es: ['encontrará'] }, tipK: { pres: 'reported', fut: 'reported' } }),
    'marsh.past': T({ rung: 'the whole past, in one story', refl: L('When Lucero was young, she lives in Candil, and one day she sees a light in the water.', 'Cuando Lucero era joven, vive en Candil, y un día ve una luz en el agua.'),
      frame: { es: 'Cuando Lucero era joven, ___ en Candil, y un día ___ una luz en el agua.' }, chips: { es: [['vivía', 'lived (back then)'], ['vio', 'saw (one day)']] },
      model: L('When Lucero was young, she lived in Candil, and one day she saw a light in the water.', 'Cuando Lucero era joven, vivía en Candil, y un día vio una luz en el agua.'),
      want: { es: [['vivía', 'vio']] }, past: { es: [['vivió'], ['veía']] }, pres: { es: [['vive'], ['ve']] }, tipK: { past: 'swap', pres: 'pres' } }),
    'alba.future': T({ rung: 'the future: a plan', refl: L('Tomorrow we play in the plaza.', 'Mañana jugamos en la plaza.'),
      frame: { es: 'Mañana ___ en la plaza.' }, chips: { es: [['jugaremos', 'we’ll play']] },
      model: L('Tomorrow we’ll play in the plaza.', 'Mañana jugaremos en la plaza.'),
      want: { es: ['jugaremos'] }, alt: { es: ['vamos a jugar'] }, pres: { es: ['jugamos'] }, past: { es: ['jugamos ayer', 'jugábamos'] }, tipK: { pres: 'presT', past: 'past' } }),
    'molinar.future': T({ rung: 'the simple future', refl: L('Tomorrow I go back to Molinar and I help at the mill.', 'Mañana vuelvo a Molinar y ayudo en el molino.'),
      frame: { es: 'Mañana ___ a Molinar y ___ en el molino.' }, chips: { es: [['volveré', 'I’ll go back'], ['ayudaré', 'I’ll help']] },
      model: L('Tomorrow I’ll go back to Molinar and help at the mill.', 'Mañana volveré a Molinar y ayudaré en el molino.'),
      want: { es: [['volveré', 'ayudaré']] }, alt: { es: [['voy a volver', 'voy a ayudar']] }, person: { es: [['volverá'], ['ayudará']] }, pres: { es: [['vuelvo'], ['ayudo']] }, tipK: { person: 'personMe', pres: 'presT' } }),
    'lake.future': T({ rung: 'irregular futures', refl: L('Tomorrow I’ll haver time and I’ll make the soup.', 'Mañana teneré tiempo y haceré la sopa.'),
      frame: { es: 'Mañana ___ tiempo y ___ la sopa.' }, chips: { es: [['tendré', 'I’ll have'], ['haré', 'I’ll make']] },
      model: L('Tomorrow I’ll have time and I’ll make the soup.', 'Mañana tendré tiempo y haré la sopa.'),
      want: { es: [['tendré', 'haré']] }, past: { es: [['teneré'], ['haceré']] }, pres: { es: [['tengo'], ['hago']] }, tipK: { past: 'irrF', pres: 'presT' } }),
    'quarry.future': T({ rung: 'the future of guessing', refl: L('Where is Pío? I don’t know… he is in the mine?', '¿Dónde está Pío? No sé… ¿está en la mina?'),
      frame: { es: '¿Dónde ___ Pío? ___ en la mina.' }, chips: { es: [['estará', 'could he be / he must be']] },
      model: L('Where could Pío be? He must be in the mine.', '¿Dónde estará Pío? Estará en la mina.'),
      want: { es: ['estará'] }, pres: { es: ['está'] }, tipK: { pres: 'guess' } }),
    'gardens.future': T({ rung: 'the conditional: asking nicely, wishing', refl: L('Can you help me? I want to plant flowers.', '¿Puedes ayudarme? Quiero plantar flores.'),
      frame: { es: '¿___ ayudarme? Me ___ plantar flores.' }, chips: { es: [['podrías', 'could you'], ['encantaría', 'I’d love']] },
      model: L('Could you help me? I’d love to plant flowers.', '¿Podrías ayudarme? Me encantaría plantar flores.'),
      want: { es: [['podrías', 'encantaría']] }, alt: { es: [['podrías', 'gustaría']] }, pres: { es: [['puedes'], ['encanta']] }, tipK: { pres: 'polite' } }),
    'peaks.future': T({ rung: 'the conditional: advice', refl: L('If I were you, I go with a coat.', 'Yo que tú, voy con abrigo.'),
      frame: { es: 'Yo que tú, ___ con abrigo.' }, chips: { es: [['iría', 'I’d go']] },
      model: L('If I were you, I’d go with a coat.', 'Yo que tú, iría con abrigo.'),
      want: { es: ['iría'] }, pres: { es: ['voy'] }, fut: { es: ['iré'] }, tipK: { pres: 'advice', fut: 'advice' } }),
    'port.future': T({ rung: 'a wish: «ojalá» + the subjunctive', refl: L('I hope the boats come back (said like a fact).', 'Ojalá que vuelven los barcos.'),
      frame: { es: 'Ojalá que ___ los barcos.' }, chips: { es: [['vuelvan', '(may they) come back']] },
      model: L('I hope the boats come back.', 'Ojalá que vuelvan los barcos.'),
      want: { es: ['vuelvan'] }, pres: { es: ['vuelven'] }, fut: { es: ['volverán'] }, tipK: { pres: 'subj', fut: 'wishFut' } }),
    'ruins.future': T({ rung: '«cuando» + the subjunctive', refl: L('When the night will come, we’ll light the lanterns.', 'Cuando llegará la noche, encenderemos los faroles.'),
      frame: { es: 'Cuando ___ la noche, encenderemos los faroles.' }, chips: { es: [['llegue', '(when it) comes']] },
      model: L('When night comes, we’ll light the lanterns.', 'Cuando llegue la noche, encenderemos los faroles.'),
      want: { es: ['llegue'] }, fut: { es: ['llegará'] }, pres: { es: ['llega'] }, tipK: { fut: 'cuando', pres: 'cuando' } }),
    'marsh.future': T({ rung: '«si» + the imperfect subjunctive, then the conditional', refl: L('If I would talk to him, everything changed.', 'Si hablaría con él, todo cambiara.'),
      frame: { es: 'Si ___ con él, todo ___.' }, chips: { es: [['hablara', '(if) I talked'], ['cambiaría', 'would change']] },
      model: L('If I talked to him, everything would change.', 'Si hablara con él, todo cambiaría.'),
      want: { es: [['hablara', 'cambiaría'], ['hablase', 'cambiaría']] }, pres: { es: [['hablaría'], ['cambiara']] }, fut: { es: [['hablo', 'cambiará']] }, tipK: { pres: 'whatif', fut: 'real' } }),
  };
  // the slips the battles keep a tally of (fb_trials.js), each with a sentence the reflection says wrong in that way
  const SLIPS = {
    gender: T({ rung: 'agreement: «el / la», «-o / -a»', refl: L('The water is cold and the map is new (with the wrong article).', 'La agua está fría y la mapa es nuevo.'),
      frame: { es: '___ agua está fría y ___ mapa es nuevo.' }, chips: { es: [['el', 'the (agua: el, but it’s still feminine)'], ['el', 'the (mapa is masculine)']] },
      model: L('The water is cold and the map is new.', 'El agua está fría y el mapa es nuevo.'),
      want: { es: [['el agua', 'el mapa']] }, pres: { es: [['la agua'], ['la mapa']] }, tipK: { pres: 'gender' } }),
    serestar: T({ rung: '«ser» or «estar»', refl: L('Mimo is tired, but he is very brave (with the wrong «to be»).', 'Mimo es cansado, pero está muy valiente.'),
      frame: { es: '{mimo} ___ cansado, pero ___ muy valiente.' }, chips: { es: [['está', 'is (right now)'], ['es', 'is (always)']] },
      model: L('{mimo} is tired, but he’s very brave.', '{mimo} está cansado, pero es muy valiente.'),
      want: { es: [['está cansado', 'es muy valiente']] }, pres: { es: [['es cansado'], ['está muy valiente']] }, tipK: { pres: 'serestar' } }),
    prep: T({ rung: 'the little linking words', refl: L('I think in you and I dream with the stage (with the wrong little words).', 'Pienso de ti y sueño en el escenario.'),
      frame: { es: 'Pienso ___ ti y sueño ___ el escenario.' }, chips: { es: [['en', 'about (pensar en)'], ['con', 'about (soñar con)']] },
      model: L('I think about you and I dream about the stage.', 'Pienso en ti y sueño con el escenario.'),
      want: { es: [['en ti', 'con el']] }, pres: { es: [['de ti'], ['en el escenario']] }, tipK: { pres: 'prep' } }),
    ending: T({ rung: 'verb endings: who does it', refl: L('We sings and you all listens (with the wrong endings).', 'Nosotros canta y ustedes escucha.'),
      frame: { es: 'Nosotros ___ y ustedes ___.' }, chips: { es: [['cantamos', 'we sing'], ['escuchan', 'you all listen']] },
      model: L('We sing and you all listen.', 'Nosotros cantamos y ustedes escuchan.'),
      want: { es: [['cantamos', 'escuchan']] }, pres: { es: [['canta'], ['escucha']] }, tipK: { pres: 'ending' } }),
  };

  // ------------------------------------------------------------ trial 3: the masks (people of then) and what you tell the boy
  // part: 'theater' (the concert, forty years ago: the boy on the stage) or 'jetty' (Lantern Night, ten years later)
  const MASKS = [
    { id: 'rosita', part: 'theater', name: L('young Rosa', 'Rosita'),
      said: L('I didn’t laugh. I ran out to look for him with my lantern.', 'Yo no me reí. Salí corriendo a buscarlo con mi farol.'),
      task: T({ rung: 'reported speech: the pluperfect', title: 'Tell him what Rosita said',
        frame: { es: 'Rosita dijo que no se ___ ___.' }, chips: { es: [['había', 'had'], ['reído', 'laughed']] },
        model: L('Rosita said she hadn’t laughed.', 'Rosita dijo que no se había reído.'),
        want: { es: ['había reído'] }, alt: { es: ['rio', 'rió'] }, pres: { es: ['ríe', 'reí'] }, tipK: { pres: 'reported' } }) },
    { id: 'nacho', part: 'theater', name: L('Nacho, as a boy', 'Nacho'),
      said: L('I laughed because my little brother fell off his chair!', '¡Me reí porque mi hermanito se cayó de la silla!'),
      task: T({ rung: 'reported speech: the pluperfect', title: 'Tell him what Nacho said',
        frame: { es: 'Nacho dijo que se reía porque su hermanito se había ___ de la silla.' }, chips: { es: [['caído', 'fallen']] },
        model: L('Nacho said he was laughing because his little brother had fallen off his chair.', 'Nacho dijo que se reía porque su hermanito se había caído de la silla.'),
        want: { es: ['caído'] }, alt: { es: ['cayó'] }, pres: { es: ['cae'] }, tipK: { pres: 'reported' } }) },
    { id: 'felix', part: 'theater', name: L('Félix', 'Félix'),
      said: L('I laughed because it was funny: «papa» instead of «papá»! If he had laughed, I would have laughed with him.', 'Me reí porque fue gracioso: ¡«papa» en vez de «papá»! Si él se hubiera reído, yo me habría reído con él.'),
      task: T({ rung: 'reported speech: «would have»', title: 'Tell him what Félix said he would have done',
        frame: { es: 'Félix dijo que, si te hubieras reído, él se ___ ___ contigo.' }, chips: { es: [['habría', 'would have'], ['reído', 'laughed']] },
        model: L('Félix said that if you had laughed, he would have laughed with you.', 'Félix dijo que, si te hubieras reído, él se habría reído contigo.'),
        want: { es: ['habría reído'] }, alt: { es: ['hubiera reído'] }, mood: { es: ['reiría'] }, pres: { es: ['ríe', 'reirá'] }, tipK: { mood: 'wouldHave', pres: 'wouldHave' } }) },
    { id: 'aurora', part: 'theater', name: L('Aurora', 'Aurora'),
      said: L('I shouted: «Silence, please! Every voice counts!»… but I was too late.', 'Yo grité: «¡Silencio, por favor! ¡Toda voz cuenta!»… pero llegué tarde.'),
      task: T({ rung: 'reported speech: the present becomes the imperfect', title: 'Tell him what Aurora said',
        frame: { es: 'Aurora dijo que toda voz ___.' }, chips: { es: [['contaba', 'counted']] },
        model: L('Aurora said that every voice counted.', 'Aurora dijo que toda voz contaba.'),
        want: { es: ['contaba'] }, alt: { es: ['cuenta'] }, past: { es: ['contó'] }, tipK: { past: 'backshift' }, altTip: 'stillTrue' }) },
    { id: 'ramiro', part: 'jetty', name: L('Ramiro, as a little boy', 'Ramiro'),
      said: L('I was laughing at the frog! It jumped and splashed my whole face!', '¡Me reía de la rana! ¡Saltó y me mojó toda la cara!'),
      task: T({ rung: 'reported speech: the pluperfect', title: 'Tell him (on Lantern Night) what Ramiro said',
        frame: { es: 'Ramiro dijo que la rana le ___ ___ la cara.' }, chips: { es: [['había', 'had'], ['mojado', 'splashed']] },
        model: L('Ramiro said that the frog had splashed his face.', 'Ramiro dijo que la rana le había mojado la cara.'),
        want: { es: ['había mojado'] }, alt: { es: ['mojó'] }, pres: { es: ['moja'] }, tipK: { pres: 'reported' } }) },
  ];
  const TASKS = {
    // trial 3's last answer: why they laughed
    why: T({ rung: 'giving a reason: «porque…, no para…»', title: 'He asks: so they weren’t laughing at him? Tell him why they laughed.',
      frame: { es: 'Se rieron porque fue gracioso, no para ___ daño.' }, chips: { es: [['hacerte', 'to do you (harm)']] },
      model: L('They laughed because it was funny, not to hurt you.', 'Se rieron porque fue gracioso, no para hacerte daño.'),
      want: { es: ['hacerte'] }, alt: { es: ['hacer'] }, pres: { es: ['hacer te', 'te hacer'] }, tipK: { pres: 'pron' } }),
    // trial 2: a word the reflection forgot (filled in by fb_trials.js from your own words)
    word: T({ rung: 'a word you often miss', title: 'Your reflection forgot a word: «{en}». Say it.', frame: { es: '___' }, chips: { es: [] }, model: L('{w}', '{w}'), want: { es: ['{w}'] } }),
  };
  // the graders' tips by kind ({form}: the model, in the language)
  const TIPS = {
    pres: { es: 'That’s now. It already happened: «{form}»' },
    presT: { es: 'That’s today. Tomorrow needs tomorrow’s words: «{form}»' },
    past: { es: 'That’s yesterday! «{form}»' },
    tense: { es: 'That’s the other past (how it was, not what happened): «{form}»' },
    personMe: { es: 'Say it about yourself (yo): «{form}»' },
    irr: { es: 'That’s how it would go if it were regular. It isn’t: «{form}»' },
    irrF: { es: 'This future is irregular: «{form}»' },
    habit: { es: 'Again and again, every day: the imperfect. «{form}»' },
    desc: { es: 'Describing how things were: the imperfect. «{form}»' },
    swap: { es: 'One thing happened (preterite) while the scene was going on (imperfect): «{form}»' },
    prog: { es: 'It was going on when something cut in: «estaba» + -ando. «{form}»' },
    reported: { es: 'Someone said it before: one step further into the past. «{form}»' },
    guess: { es: 'A guess about now: the future. «{form}»' },
    polite: { es: 'Ask nicely, and wish softly: the conditional. «{form}»' },
    advice: { es: 'Advice, «if I were you»: the conditional. «{form}»' },
    subj: { es: 'After «ojalá», the subjunctive: «{form}»' },
    wishFut: { es: 'A wish, not a prediction: «{form}»' },
    cuando: { es: 'After «cuando», for what hasn’t happened yet: the subjunctive. «{form}»' },
    whatif: { es: 'A what-if: «si» + the imperfect subjunctive, then the conditional. «{form}»' },
    real: { es: 'That one could really happen. A what-if needs: «{form}»' },
    gender: { es: '«agua» is feminine but takes «el» (it starts with a stressed a); «mapa» is masculine. «{form}»' },
    serestar: { es: 'Right now: «estar». What someone is like: «ser». «{form}»' },
    prep: { es: '«pensar en», «soñar con»: «{form}»' },
    ending: { es: 'The ending says who: «nosotros» -amos, «ustedes» -an. «{form}»' },
    wouldHave: { es: '«would have»: «habría» + the participle. «{form}»' },
    backshift: { es: 'What she said is still true, so «cuenta» works too; the past of it is «contaba»: «{form}»' },
    stillTrue: { es: 'Right! It’s still true today, so the present works too. Told as reported speech: «{form}»' },
    pron: { es: 'The little word joins the infinitive: «hacerte». «{form}»' },
  };

  // ------------------------------------------------------------ the other languages add themselves here
  function add(l, P) {
    if (!P) return;
    const into = (dst, src) => { for (const [k, v] of Object.entries(src || {})) { if (!dst[k]) dst[k] = {}; dst[k][l] = v; } };
    for (const [k, v] of Object.entries(P.SPECIES || {})) { if (!SPECIES[k]) SPECIES[k] = {}; SPECIES[k][l] = v; }
    into(NAMES, P.NAMES); into(LORE, P.LORE); into(FIGHT, P.FIGHT); into(SCENE, P.SCENE);
    if (P.CARDS) for (const [k, v] of Object.entries(P.CARDS)) { const C = CARDS[k]; if (!C) continue; if (C.title) C.title[l] = v; else C[l] = v; }
    if (P.PAGES) P.PAGES.forEach((p, i) => { if (!PAGES[i]) return; if (p.who) PAGES[i].who[l] = p.who; if (p.text) PAGES[i].text[l] = p.text; });
    // (a task's own English for this language, when its sentence isn't the Spanish one's: en: { refl, model })
    const task = (D, t) => { for (const [f, v] of Object.entries(t || {})) { if (f === 'en') { D.enL = D.enL || {}; D.enL[l] = v; continue; } if (f === 'tipK') { D.tipKL = D.tipKL || {}; D.tipKL[l] = v; continue; } if (f === 'refl' || f === 'model') { D[f] = D[f] || {}; D[f][l] = v; continue; } if (!D[f] || typeof D[f] !== 'object' || Array.isArray(D[f])) D[f] = {}; D[f][l] = v; } };
    for (const [k, t] of Object.entries(P.RUNGS || {})) if (RUNGS[k]) task(RUNGS[k], t);
    // (a language can bring slips of its own: de «case», zh «measure» / «order» / «particle», ja «particle» / «teForm»; the rung and the
    // tip's kind come with it, in English)
    for (const [k, t] of Object.entries(P.SLIPS || {})) {
      if (!SLIPS[k]) SLIPS[k] = T({ rung: t.rung || k, tipK: t.tipK || {}, langs: [] }); else if (!SLIPS[k].langs) SLIPS[k].langs = ['es'];
      const t2 = Object.assign({}, t); delete t2.rung; delete t2.tipK; task(SLIPS[k], t2); SLIPS[k].langs.push(l);
    }
    for (const [k, t] of Object.entries(P.TASKS || {})) if (TASKS[k]) task(TASKS[k], t);
    if (P.MASKS) for (const [id, m] of Object.entries(P.MASKS)) { const D = MASKS.find(x => x.id === id); if (!D) continue; if (m.name) D.name[l] = m.name; if (m.said) D.said[l] = m.said; if (m.saidEn) { D.saidEn = D.saidEn || {}; D.saidEn[l] = m.saidEn; } if (m.task) task(D.task, m.task); }
    if (P.TIPS) for (const [k, v] of Object.entries(P.TIPS)) { if (!TIPS[k]) TIPS[k] = {}; TIPS[k][l] = v; }
    // each task's rung in this language's own words (English, naming its own forms): 'alba.past', 'slip.gender', 'mask.rosita', 'task.why'
    const setRung = (D, v) => { if (!D) return; D.rung = D.rung && typeof D.rung === 'object' ? D.rung : { _: D.rung || '' }; D.rung[l] = v; };
    for (const [k, v] of Object.entries(P.RUNGNAMES || {})) {
      if (k.startsWith('slip.')) setRung(SLIPS[k.slice(5)], v);
      else if (k.startsWith('mask.')) { const M0 = MASKS.find(x => x.id === k.slice(5)); if (M0) setRung(M0.task, v); }
      else if (k.startsWith('task.')) setRung(TASKS[k.slice(5)], v);
      else setRung(RUNGS[k], v);
    }
  }
  const rungOf = (T0, l) => (!T0 ? '' : T0.rung && typeof T0.rung === 'object' ? T0.rung[l] || T0.rung._ || '' : T0.rung || '');
  // every zh / ja string against CJK.md, and every language that has any lines has them all: []
  function check() {
    const out = [];
    const v = (s, l, where) => {
      if (typeof CJK === 'undefined' || !CJK.validate || !s || typeof s !== 'string' || !/[぀-ヿ一-鿿]/.test(s)) return;
      if (/[A-Za-z]{2,}/.test(s.replace(/\[[^\]]*\]/g, '').replace(/\{[^}]*\}/g, ''))) return;
      const p = CJK.validate(s.replace(/\{[^}]+\}/g, l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ').replace(/___/g, l === 'zh' ? '[它|tā]' : 'それ'), l);
      if (p.length) out.push(`${where} (${l}): ${p.join('; ')} «${s}»`);
    };
    const under = (x, l, where) => { if (typeof x === 'string') v(x, l, where); else if (Array.isArray(x)) x.forEach((y, i) => under(y, l, where + '.' + i)); };
    const each = (o, where) => { for (const [k, T0] of Object.entries(o || {})) for (const l of ['zh', 'ja']) if (T0 && T0[l] !== undefined) under(T0[l], l, where + '.' + k); };
    each(NAMES, 'names'); each(LORE, 'lore'); each(FIGHT, 'fight'); each(SCENE, 'scene');
    const tasks = Object.assign({}, ...Object.entries(RUNGS).map(([k, t]) => ({ ['rung.' + k]: t })), ...Object.entries(SLIPS).map(([k, t]) => ({ ['slip.' + k]: t })),
      ...Object.entries(TASKS).map(([k, t]) => ({ ['task.' + k]: t })), ...MASKS.map(m => ({ ['mask.' + m.id]: m.task })));
    for (const [k, T0] of Object.entries(tasks)) for (const f of ['refl', 'frame', 'chips', 'model', 'want', 'alt', 'person', 'tense', 'mood', 'past', 'pres', 'fut']) if (T0[f]) for (const l of ['zh', 'ja']) if (T0[f][l] !== undefined) under(T0[f][l], l, `${k}.${f}`);
    PAGES.forEach((p, i) => { for (const l of ['zh', 'ja']) { if (p.text[l]) v(p.text[l], l, `page.${i}`); if (p.who[l]) v(p.who[l], l, `page.${i}.who`); } });
    MASKS.forEach(m => { for (const l of ['zh', 'ja']) { if (m.said[l]) v(m.said[l], l, `mask.${m.id}.said`); if (m.name[l]) v(m.name[l], l, `mask.${m.id}.name`); } });
    for (const l of LANGS) {
      const any = Object.values(FIGHT).some(T0 => T0[l]); if (!any) continue;
      for (const [k, T0] of Object.entries(FIGHT)) if (T0.es && !T0[l]) out.push(`fight.${k}: no ${l}`);
      for (const [k, T0] of Object.entries(SCENE)) if (T0.es && !T0[l]) out.push(`scene.${k}: no ${l}`);
      // (slips are each language's own: only the ones a language brings are checked for it)
      const mine = Object.entries(tasks).filter(([k]) => !/^slip\./.test(k) || (SLIPS[k.slice(5)].langs || ['es']).includes(l));
      for (const [k, T0] of mine) for (const f of ['frame', 'chips', 'want']) if (!T0[f] || T0[f][l] === undefined) out.push(`${k}.${f}: no ${l}`);
      for (const [k, T0] of mine) if (!T0.model || !T0.model[l]) out.push(`${k}.model: no ${l}`);
      PAGES.forEach((p, i) => { if (!p.text[l]) out.push(`page.${i}: no ${l}`); });
      MASKS.forEach(m => { if (!m.said[l]) out.push(`mask.${m.id}: no ${l}`); });
      for (const k of Object.keys(SPECIES)) if (!SPECIES[k][l]) out.push(`species.${k}: no ${l}`);
    }
    return out;
  }
  // FIN.ask looks a tip up by its key in T4d's FINTXT.TIPS: ours go in there as «fb:key» (T4d's own keys are never touched)
  function regTips() {
    if (typeof FINTXT === 'undefined' || !FINTXT || !FINTXT.TIPS) return false;
    for (const k of Object.keys(TIPS)) FINTXT.TIPS['fb:' + k] = TIPS[k];
    return true;
  }
  // a task as this language sees it: its own English where it has one (the reflection's line, the model), and each wrong form's
  // tip pointing at our own text for this language (T4d's, or the plain «Not quite…», only when we have none)
  function local(T0, l) {
    if (!T0) return T0;
    const e = T0.enL && T0.enL[l], tk0 = (T0.tipKL && T0.tipKL[l]) || T0.tipK || {}, tk = {};
    const reg = regTips();
    for (const kind of ['person', 'tense', 'mood', 'past', 'pres', 'fut']) {
      if (!T0[kind] || !(T0[kind][l] || []).length) continue;
      const k = tk0[kind] || kind;
      if (reg && TIPS[k] && TIPS[k][l]) tk[kind] = 'fb:' + k; else if (tk0[kind]) tk[kind] = tk0[kind];
    }
    return Object.assign({}, T0, e && e.refl ? { refl: Object.assign({}, T0.refl, { en: e.refl }) } : {}, e && e.model ? { model: Object.assign({}, T0.model, { en: e.model }) } : {},
      e && e.title ? { title: e.title } : {}, { tipK: tk });
  }
  const saidOf = (M0, l) => (M0.saidEn && M0.saidEn[l] ? Object.assign({}, M0.said, { en: M0.saidEn[l] }) : M0.said);
  // your thoughts and tips with this language's joining word and its «VOICE!» (they're written for es: «y», «¡VOZ!»)
  const JOIN = { es: '«y»', pt: '«e»', de: '«und»', zh: '«然后»', ja: 'the て-form' };
  function you(key, l) {
    const v = (FIGHT['v.shout'] || {})[l], vp = v && typeof CJK !== 'undefined' && /[぀-ヿ一-鿿]/.test(v) ? CJK.plain(v, { lang: l }) : v;
    return String(YOU[key] || '').replace(/«y»/g, JOIN[l] || '«y»').replace('«¡VOZ!»', vp ? `«${vp}»` : '«¡VOZ!»');
  }
  return { LANGS, L, SPECIES, NAMES, LORE, FIGHT, SCENE, YOU, CARDS, PAGES, RUNGS, SLIPS, MASKS, TASKS, TIPS, JOIN, add, check, local, saidOf, you, rungOf };
})();
