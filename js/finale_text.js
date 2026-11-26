'use strict';
// Chapter 4's finale, «Toda voz cuenta» (DESIGN.md 18.5, 21.9; the T4d proposal): every line, task, pick and card of the climb,
// the top of the Old Tower, the three-times stage, the speech, the laugh, the aftermath and the credits. English and Spanish
// here; finale_text_pt.js / _de / _zh / _ja add their own language with FINTXT.add(lang, pack). zh / ja in CJK.md's notation.
//   CAST          names (each language its own)                   LINES       every said line: { en, es, … }
//   TASKS         the three gifts (g1–g3) and the eight bridges (b1–b8): frame, chips, model, what's an S / A / B, the misses
//   TIPS          the graders' tips by kind ({form}: the model)    SLIP        the word he gets wrong again, per language
//   TAGS          each echo's place and time, for the pages he picks from
//   DAD           (one block: the old dad today, his front-row seat and his lines, so another version is a quick swap)
// Elio is never a villain, nobody is blamed, the player is never gendered.
const FINTXT = (() => {
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const L = (en, es, o) => Object.assign({ en, es }, o || {});

  // ------------------------------------------------------------ names
  const CAST = {
    elio: L('Elio', 'Elio'), noa: L('Noa', 'Noa'), aurora: L('Aurora', 'Aurora'), felix: L('Félix', 'Félix'),
    rosita: L('young Rosa', 'Rosita'), rosa: L('Doña Rosa', 'Doña Rosa'), dadThen: L('Elio’s dad', 'el papá de Elio'),
    ramiro: L('Ramiro', 'Ramiro'), tadeo: L('Tadeo', 'Tadeo'), sami: L('Sami', 'Sami'), bruno: L('Bruno', 'Bruno'),
    marta: L('Marta', 'Marta'), lucero: L('Lucero', 'Lucero'),
  };
  // ------------------------------------------------------------ the old dad, today (the user may want another version: everything
  // about him lives in this block and in finale_stage.js's DAD block; swap them together)
  const DAD = {
    on: true,                                      // (false: no old dad today; the young dad of then carries the scene alone)
    name: L('Elio’s dad', 'el papá de Elio'),
    look: { skin: '#e6b48c', hair: '#e8e4dc', hairdo: 'bald', beard: true, stache: true, hair2: '#e8e4dc', dress: '#5a6a7a', vest: '#8a6a4a', hat: 'flat', hatColor: '#4a4a52', prop: 'cane', h: 0.98, seat: true },
    lines: {
      'dad.stand': L('…Elio?', '…¿Elio?'),
      'dad.heard': L('I heard you, son. This time, I heard you.', 'Te oí, hijo. Esta vez, sí te oí.'),
      'elio.dad': L('Dad… I’m here.', 'Papá… estoy aquí.'),
      'dad.laugh': L('Ha! A potato! I’ll take it, son. I’ll take it.', '¡Ja! ¡Una papa! Me la quedo, hijo. Me la quedo.'),
    },
    post: [
      L('Every afternoon I sit here and listen to him rehearse.', 'Cada tarde me siento aquí y lo escucho ensayar.'),
      L('I looked for him on every road. Now he finds me, every morning, with bread.', 'Lo busqué por todos los caminos. Ahora él me encuentra a mí, cada mañana, con pan.'),
      L('My son has a lovely voice. I had almost forgotten it.', 'Mi hijo tiene una voz bonita. Casi la había olvidado.'),
    ],
  };

  // ------------------------------------------------------------ lines
  const LINES = {
    // the top: Noa in the great clock, the hooded figure by it, his old lines (oldtower_text.js 'ot.hood.*')
    'noa.top': L('You came back! … He heard every crack too, like me. Give him his words.', '¡Volviste! Él también oía las grietas, como yo. Dale sus palabras.'),
    'hood.name': L('…Elio? It’s been years since anyone said my name.', '…¿Elio? Hace años que nadie dice mi nombre.'),
    'elio.voice': L('My voice… That’s my voice.', 'Mi voz… Esa es mi voz.'),
    'noa.free': L('At last! … Elio, we looked for you everywhere. In every time.', '¡Por fin! Elio, te buscamos por todas partes. En todos los tiempos.'),
    'elio.book': L('This is yours. I’m sorry I kept it so long.', 'Esto es tuyo. Perdona que lo guardara tanto tiempo.'),
    'noa.book': L('You took good care of it. And of their words too.', 'Lo cuidaste bien. Y sus palabras también.'),
    'elio.clock1': L('Forty years ago, at eight o’clock, my speech stopped halfway. In the theater.', 'Hace cuarenta años, a las ocho, mi discurso se quedó a medias. En el teatro.'),
    'noa.clock': L('Then let’s finish it. At eight.', 'Entonces vamos a terminarlo. A las ocho.'),
    'elio.clock2': L('This time I won’t run away from yesterday. I’ll bring it with me… and tomorrow too.', 'Esta vez no voy a huir del ayer. Lo traigo conmigo… y el mañana también.'),
    'bruno.clock': L('Front row, then. I wouldn’t miss it.', 'Entonces, primera fila. No me lo pierdo.'),
    // the wings
    'elio.hands': L('My hands are shaking.', 'Me tiemblan las manos.'),
    'noa.wings': L('That’s normal. If you forget something, look down at the shell: someone will whisper you the line.', 'Es normal. Si se te olvida algo, mira abajo, a la concha: desde ahí te soplarán la frase.'),
    'elio.cap': L('My cap… It stayed here all this time.', 'Mi gorra… Se quedó aquí todo este tiempo.'),
    // the curtain
    'aurora.hush': L('Silence, please! Every voice counts!', '¡Silencio, por favor! ¡Toda voz cuenta!'),
    'elio.open': L('Good evening. A long time ago I started a speech on this stage… and I never finished it. Tonight I want to finish it.', 'Buenas noches. Hace mucho tiempo, empecé un discurso en este escenario… y nunca lo terminé. Esta noche quiero terminarlo.'),
    'elio.later': L('No… that came later.', 'No… eso fue después.'),
    'elio.notyet': L('No… that hasn’t happened yet.', 'No… eso todavía no pasó.'),
    'elio.today': L('My dad is here. Rosa is here. And someone I didn’t know… brought me my words.', 'Mi papá está aquí. Rosa está aquí. Y alguien que no conocía… me trajo mis palabras.'),
    'elio.tomorrow': L('And tomorrow… I have a few things to say about tomorrow.', 'Y mañana… Del mañana tengo un par de cosas que decir.'),
    // the aftermath
    'rosa.letter': L('This is yours, Elio. I wrote it that night, with my lantern in my hand. It waited forty years in a drawer.', 'Esto es tuyo, Elio. Lo escribí aquella noche, con la linterna en la mano. Esperó cuarenta años en un cajón.'),
    'elio.letter': L('«That night you were very brave. I didn’t laugh.»', '«Esa noche fuiste muy valiente. Yo no me reí.»'),
    'elio.letter2': L('And here someone wrote: «{you}»', 'Y aquí alguien escribió: «{you}»'),
    'elio.rosa': L('Thank you, Rosa. You always looked for me.', 'Gracias, Rosa. Siempre me buscaste.'),
    'ramiro.sorry': L('Elio… That night I was laughing at the frog. Not at you.', 'Elio… Aquella noche me reía de la rana. No de ti.'),
    'elio.note': L('I know. I read your note… many times, up there.', 'Lo sé. Leí tu nota… muchas veces, allá arriba.'),
    'elio.nonote': L('Now I know. Thank you for telling me.', 'Ahora lo sé. Gracias por decírmelo.'),
    'noa.you1': L('You did it. Well… we did it.', 'Lo lograste. Bueno… lo logramos.'),
    'noa.you2': L('Thank you for coming to find me. I kept every one of your letters.', 'Gracias por venir a buscarme. Guardé todas tus cartas.'),
    'aurora.bye': L('Every voice counts… his too! Goodbye, Elio!', '¡Toda voz cuenta… también la suya! ¡Hasta siempre, Elio!'),
    'sami.bye': L('Tomorrow I’ll talk to everyone!', '¡Mañana hablaré con todos!'),
    'rosita.bye': L('I knew you’d come back!', '¡Sabía que volverías!'),
  };
  // your own lines and the thoughts (English, the weave brings your words in)
  const YOU = {
    door: 'All eighteen of his words… the journal’s page is glowing.',
    doorOpen: 'The tear is closing… The door stands open. The stair goes up.',
    top: 'Elio. Those aren’t your only words. We brought the rest: all eighteen.',
    g1: 'Not everyone laughed. One of his own words says so…',
    g2: 'Up here nobody laughs… and nobody sings. One of his words wants to sing.',
    g3: 'Words can hurt… but one of his words knows what to do if someone laughs.',
    giveIt: 'Now give it back to him: say it TO him ({you}: you), in its own time.',
    pickWrong: 'Hmm… not that one. Which of his words answers what he just said?',
    grayLifts: 'The gray lifts off him like fog in the morning…',
    wordsBack: 'Our words are flying out of the notebook… back to {mimo}!',
    wings: 'Into the prompter’s box at the front of the stage. If he forgets a line, whisper it to him.',
    box: 'He’s looking at the shell. At you.',
    smile: 'He heard it himself… and he’s smiling.',
  };

  // ------------------------------------------------------------ each echo's place and time (the pages he picks from)
  const TAGS = {
    'alba.past': 'Alba · the winter he arrived', 'molinar.past': 'Molinar · that autumn', 'lake.past': 'the Mirror Lake · that winter',
    'quarry.past': 'the Quarry Caves · that spring', 'gardens.past': 'the Bloom Gardens · that summer', 'peaks.past': 'the Frost Peaks · the next winter',
    'port.past': 'Port Brisa · years later', 'ruins.past': 'the Sunken Ruins · at nineteen', 'marsh.past': 'Candil · Lantern Night, at twenty',
    'alba.future': 'Alba · tomorrow', 'molinar.future': 'Molinar · tomorrow', 'lake.future': 'the Mirror Lake · tomorrow', 'quarry.future': 'the Quarry Caves · tomorrow',
    'gardens.future': 'the Bloom Gardens · tomorrow', 'peaks.future': 'the Frost Peaks · tomorrow', 'port.future': 'Port Brisa · tomorrow',
    'ruins.future': 'the Sunken Ruins · tomorrow', 'marsh.future': 'the Gray Marsh · tomorrow',
  };

  // ------------------------------------------------------------ the speech: three acts, his 18 echoes (CH4's words, read live), the
  // pages he loses (pick: the right one first), the eight bridges you whisper (b1–b8), the laugh
  const SPEECH = [
    { act: 'past' },
    { echo: 'alba.past', beat: 'papa' },
    { bridge: 'b1' },
    { echo: 'molinar.past' },
    { pick: 'lake.past', among: ['gardens.past', 'port.past'] },
    { echo: 'quarry.past' },
    { echo: 'gardens.past' },
    { bridge: 'b2' },
    { pick: 'peaks.past', among: ['ruins.past', 'marsh.past'] },
    { echo: 'port.past' },
    { pick: 'ruins.past', among: ['marsh.past', 'ruins.future'] },
    { echo: 'marsh.past', beat: 'lantern' },
    { bridge: 'b3' },
    { act: 'now' },
    { bridge: 'b4' },
    { line: 'elio.today', beat: 'today' },
    { act: 'future' },
    { line: 'elio.tomorrow' },
    { bridge: 'b5' },
    { echo: 'molinar.future' }, { echo: 'lake.future', beat: 'dad' }, { echo: 'quarry.future' }, { echo: 'gardens.future' },
    { echo: 'peaks.future' }, { echo: 'port.future' },
    { bridge: 'b6' },
    { echo: 'ruins.future' },
    { bridge: 'b7' },
    { echo: 'marsh.future' },
    { laugh: true },
    { bridge: 'b8' },
    { thanks: true },
    { echo: 'alba.future', beat: 'bells' },
  ];

  // ------------------------------------------------------------ the word he gets wrong again (DESIGN.md 17.12), his joke about it,
  // and what {mimo} goes looking for
  const SLIP = {
    es: { right: '¡Gracias, papá!', slip: 'Y… ¡gracias, papa!', joke: '¡Papa! Una papa… ¡Cuarenta años después, la misma papa!', en: 'And… thank you, potato! («papá» is Dad; «papa» is a potato)', jokeEn: 'Potato! A potato… Forty years later, the same potato!', rightEn: 'Thank you, Dad!', mimo: '🥔?', giggle: '¡jiji!', laughs: ['¡jajaja!', '¡ja, ja!', '¡jejeje!', '¡una papa!'] },
  };
  // the curtain call's word per letter (never a fail)
  const BOW = { S: 'A standing ovation!', A: 'Bravo!', B: 'A warm, long applause!', C: 'Applause, all three times at once!', D: 'Applause! He found every line, with you there.' };

  // ------------------------------------------------------------ the graders' tips ({form}: the model, in the language)
  const TIPS = {
    person: { es: 'Give it back to HIM: say it to him (tú). «{form}»' },
    personB: { es: 'Say it as Elio says it (I: yo): «{form}»' },
    tense: { es: 'That’s the other past. «{form}»' },
    habit: { es: 'Year after year, again and again: the imperfect. «{form}»' },
    before: { es: 'It had happened BEFORE that night: the pluperfect. «{form}»' },
    thought: { es: 'Inside a past thought, «would»: the conditional. «{form}»' },
    mood: { es: 'After «ojalá», the subjunctive: «{form}»' },
    whatif: { es: 'A what-if: «si» + the imperfect subjunctive, then the conditional. «{form}»' },
    real: { es: 'It isn’t a what-if anymore: it’s happening NOW! «{form}»' },
    past: { es: 'That’s yesterday! «{form}»' },
    pres: { es: 'That’s now. It already happened: «{form}»' },
    presT: { es: 'That’s today. Tomorrow needs tomorrow’s words: «{form}»' },
    fut: { es: 'That’s tomorrow! «{form}»' },
    futNow: { es: 'That’s tomorrow. He’s here TODAY: «{form}»' },
    pastNow: { es: 'That’s yesterday. He’s here TODAY: «{form}»' },
    wishFut: { es: 'A wish, not a prediction: «{form}»' },
    condFut: { es: 'Close! A what-if needs «would»: «{form}»' },
  };

  // ------------------------------------------------------------ the tasks. Items: a string (a word or phrase, whole words; zh / ja:
  // CJK.contains) or a list (all of them, any order). want → S (A without an accent); alt → A; person, tense, mood… → B with that
  // kind's tip (tipK names it); past, pres, fut → a miss with a tip. Every task's help is always on the box: the frame, the chips, and
  // «?» for the whole line (it costs two letters).
  const T = (o) => o;
  const TASKS = {
    // the gifts at the top: his own words, given back to him in the second person, each in its own time
    g1: T({ rung: 'the two pasts (the scene, then what happened)', title: 'Give it back to him: «Nevaba, me perdí… y alguien me encontró.» Say it to him.',
      frame: { es: 'Nevaba, te ___… y alguien te ___.' }, chips: { es: [['perdiste', 'you got lost'], ['encontró', 'found']] },
      model: { en: 'It was snowing, you got lost… and someone found you.', es: 'Nevaba, te perdiste… y alguien te encontró.' },
      want: { es: [['te perdiste', 'te encontró']] }, alt: { es: [['te perdiste', 'te encontraron'], ['te perdiste', 'te encontramos']] },
      person: { es: [['me perdí'], ['me encontró']] }, tense: { es: [['perdías'], ['encontraba']] },
      pres: { es: [['pierdes'], ['encuentra']] }, fut: { es: [['perderás'], ['encontrará']] },
      tipK: { person: 'person', tense: 'tense', pres: 'pres', fut: 'fut' } }),
    g2: T({ rung: 'the future', title: 'Give it back to him: «Esta vez, cantaré con ustedes.» Say it to him.',
      frame: { es: 'Esta vez ___ con nosotros.' }, chips: { es: [['cantarás', 'you’ll sing']] },
      model: { en: 'This time you’ll sing with us.', es: 'Esta vez cantarás con nosotros.' },
      want: { es: ['cantarás'] }, alt: { es: ['vas a cantar'] },
      person: { es: ['cantaré', 'voy a cantar'] }, pres: { es: ['cantas'] }, past: { es: ['cantaste', 'cantabas'] },
      tipK: { person: 'person', pres: 'presT', past: 'past' } }),
    g3: T({ rung: '«si» + the imperfect subjunctive + the conditional', title: 'Give it back to him: «Si alguien volviera a reírse, me reiría con ustedes… y seguiría hablando.» Say it to him.',
      frame: { es: 'Si alguien volviera a reírse, te ___ con nosotros… y ___ hablando.' }, chips: { es: [['reirías', 'you’d laugh'], ['seguirías', 'you’d keep on']] },
      model: { en: 'If someone laughed again, you’d laugh with us… and keep on talking.', es: 'Si alguien volviera a reírse, te reirías con nosotros… y seguirías hablando.' },
      want: { es: [['te reirías', 'seguirías']] }, alt: { es: ['te reirías', 'seguirías'] },
      person: { es: [['me reiría'], ['seguiría']] }, mood: { es: [['reirás'], ['seguirás']] }, pres: { es: [['ríes'], ['sigues']] },
      tipK: { person: 'person', mood: 'condFut', pres: 'presT' } }),
    // the bridges on the stage: you whisper them, he says them (Elio's own I)
    b1: T({ rung: 'the preterite: what happened', title: 'Whisper what happened that night', who: 'act1',
      frame: { es: 'Aquella noche ___ una palabra mal, y todos se ___.' }, chips: { es: [['dije', 'I said'], ['rieron', 'laughed']] },
      model: { en: 'That night I said one word wrong, and everyone laughed.', es: 'Aquella noche dije una palabra mal, y todos se rieron.' },
      want: { es: [['dije', 'rieron']] }, alt: { es: [['dije', 'reían']] },
      person: { es: [['dijo']] }, tense: { es: [['decía']] }, pres: { es: [['digo'], ['ríen']] }, fut: { es: [['diré']] },
      tipK: { person: 'personB', tense: 'tense', pres: 'pres', fut: 'fut' } }),
    b2: T({ rung: 'the imperfect: how it was, year after year', title: 'Whisper how it was, year after year',
      frame: { es: 'Durante años no ___ con nadie, pero ___ a todos.' }, chips: { es: [['hablaba', 'I talked'], ['escuchaba', 'I listened to']] },
      model: { en: 'For years I didn’t talk to anyone, but I listened to everyone.', es: 'Durante años no hablaba con nadie, pero escuchaba a todos.' },
      want: { es: [['hablaba', 'escuchaba']] }, alt: { es: [['hablaba', 'oía']] },
      person: { es: [['hablaban'], ['hablabas']] }, tense: { es: [['hablé'], ['escuché']] }, pres: { es: [['hablo'], ['escucho']] }, fut: { es: [['hablaré']] },
      tipK: { person: 'personB', tense: 'habit', pres: 'pres', fut: 'fut' } }),
    b3: T({ rung: 'the pluperfect, and «would» inside a past thought', title: 'Whisper what had happened, and what he thought would happen',
      frame: { es: 'Ya me había ___ una vez… y pensé que me ___ siempre.' }, chips: { es: [['pasado', 'happened'], ['pasaría', 'would happen']] },
      model: { en: 'It had happened to me once already… and I thought it would always happen to me.', es: 'Ya me había pasado una vez… y pensé que me pasaría siempre.' },
      want: { es: [['había pasado', 'pasaría']] }, alt: { es: [['había pasado', 'iba a pasar']] },
      tense: { es: [['pasó una vez'], ['ha pasado']] }, mood: { es: [['pasará']] }, pres: { es: [['pasa']] },
      tipK: { tense: 'before', mood: 'thought', pres: 'pres' } }),
    b4: T({ rung: 'the present: here, today', title: 'Whisper it: he’s here, today',
      frame: { es: 'Pero hoy ___ aquí, y ustedes me ___.' }, chips: { es: [['estoy', 'I am'], ['escuchan', 'listen to']] },
      model: { en: 'But today I’m here, and you’re listening to me.', es: 'Pero hoy estoy aquí, y ustedes me escuchan.' },
      want: { es: [['estoy', 'escuchan']] }, alt: { es: [['estoy', 'oyen'], ['estoy', 'están escuchando']] },
      person: { es: [['está'], ['escucho']] }, past: { es: [['estaba'], ['estuve'], ['escucharon'], ['escuchaban']] }, fut: { es: [['estaré'], ['escucharán']] },
      tipK: { person: 'personB', past: 'pastNow', fut: 'futNow' } }),
    b5: T({ rung: 'the future: a promise', title: 'Whisper a promise for tomorrow',
      frame: { es: 'Mañana ___ a cada lugar.' }, chips: { es: [['volveré', 'I’ll go back']] },
      model: { en: 'Tomorrow I’ll go back to every place.', es: 'Mañana volveré a cada lugar.' },
      want: { es: ['volveré'] }, alt: { es: ['voy a volver'] },
      person: { es: ['volverá', 'volverás'] }, pres: { es: ['vuelvo'] }, past: { es: ['volví'] },
      tipK: { person: 'personB', pres: 'presT', past: 'past' } }),
    b6: T({ rung: 'a wish: «ojalá» + the subjunctive', title: 'Whisper a wish for everyone',
      frame: { es: 'Ojalá que nadie más se ___ callado.' }, chips: { es: [['quede', 'stays']] },
      model: { en: 'I hope nobody else stays silent.', es: 'Ojalá que nadie más se quede callado.' },
      want: { es: ['quede'] }, mood: { es: ['queda'] }, fut: { es: ['quedará'] }, past: { es: ['quedó'] },
      tipK: { mood: 'mood', fut: 'wishFut', past: 'past' } }),
    b7: T({ rung: 'a what-if: «si» + the imperfect subjunctive, then the conditional', title: 'Whisper a what-if',
      frame: { es: 'Y si me ___ la voz, ustedes me ___.' }, chips: { es: [['temblara', 'shook'], ['esperarían', 'would wait for']] },
      model: { en: 'And if my voice shook, you’d wait for me.', es: 'Y si me temblara la voz, ustedes me esperarían.' },
      want: { es: [['temblara', 'esperarían'], ['temblase', 'esperarían']] },
      mood: { es: [['tiembla', 'esperarán'], ['tiembla', 'esperarían'], ['temblara', 'esperarán']] }, past: { es: [['tembló']] },
      tipK: { mood: 'whatif', past: 'past' } }),
    b8: T({ rung: 'the what-if come true: the present', title: 'Whisper it: the what-if just came true',
      frame: { es: 'Alguien se ríe… ¡y me ___ con ustedes! Y ___ hablando.' }, chips: { es: [['río', 'I laugh'], ['sigo', 'I keep on']] },
      model: { en: 'Someone’s laughing… and I’m laughing with you! And I keep on talking.', es: 'Alguien se ríe… ¡y me río con ustedes! Y sigo hablando.' },
      want: { es: [['río', 'sigo']] }, alt: { es: [['estoy riendo', 'sigo']] },
      mood: { es: [['reiría'], ['seguiría']] }, past: { es: [['reí'], ['seguí']] }, fut: { es: [['reiré'], ['seguiré']] },
      tipK: { mood: 'real', past: 'past', fut: 'fut' } }),
  };
  // which echo each gift gives back, and the two words he might reach for instead (the first is right)
  const GIFTS = {
    g1: { hood: 'ot.hood.laugh', echo: 'peaks.past', among: ['quarry.past', 'gardens.past'], think: 'g1' },
    g2: { hood: 'ot.hood.here', echo: 'quarry.future', among: ['lake.past', 'ruins.past'], think: 'g2' },
    g3: { hood: 'ot.hood.hurt', echo: 'marsh.future', among: ['gardens.future', 'molinar.past'], think: 'g3' },
  };

  // ------------------------------------------------------------ the rise (the fall's mirror): its captions, English with your words
  const CAPS = ['Eighteen words. Eighteen lanterns.', 'The great {w.clock} turns forward now.', 'Up there, someone is listening.'];

  // ------------------------------------------------------------ after: Elio, his dad and Noa in Alba (rotating lines, every tense)
  const POST = {
    elio: [
      L('This morning I swept the stage. Tomorrow I’ll paint the doors.', 'Esta mañana barrí el escenario. Mañana pintaré las puertas.'),
      L('If you ever want to go up on the stage, tell me. We’ll listen.', 'Si algún día quieres subir al escenario, avísame. Te escucharemos.'),
      L('When I was a boy, I used to hide. Now I talk to someone new every afternoon.', 'De niño, me escondía. Ahora, cada tarde, hablo con alguien nuevo.'),
      L('I had forgotten what my laugh sounds like. It’s quite loud, isn’t it?', 'Había olvidado cómo suena mi risa. Es bastante ruidosa, ¿verdad?'),
      L('I’d love for Noa to tell us about her travels. She has a thousand stories.', 'Me encantaría que Noa nos contara sus viajes. Tiene mil historias.'),
      L('I hope nobody in this valley stays silent ever again.', 'Ojalá que nadie en este valle vuelva a quedarse callado.'),
    ],
    noa: [
      L('Where do we go now? There are so many places… in three times.', '¿Adónde vamos ahora? Hay tantos lugares… en tres tiempos.'),
      L('My notebook is full of your words. I need a new one.', 'Mi cuaderno está lleno de tus palabras. Necesito uno nuevo.'),
      L('If I hadn’t climbed that tower, I’d never have met Elio. Funny, isn’t it?', 'Si no hubiera subido a esa torre, nunca habría conocido a Elio. Qué curioso, ¿no?'),
      L('Every crack is still open. Long ago and tomorrow are waiting for you.', 'Todas las grietas siguen abiertas. El ayer y el mañana te esperan.'),
    ],
  };

  // ------------------------------------------------------------ credits (the program): its headings in English, the roles
  const CREDITS = {
    title: 'Toda voz cuenta', sub: 'Chapter 4 · Elio’s words',
    speech: 'The speech', yours: 'Your lines', cast: 'The cast', times: ['Long ago', 'Today', 'Tomorrow'], songs: 'The music', journey: 'Your journey',
    thanks: L('Thank you for playing.', 'Gracias por jugar.'),
    motto: L('Every voice counts.', 'Toda voz cuenta.'),
    end: L('The End', 'Fin'),
  };

  // ------------------------------------------------------------ the other languages add themselves here
  function add(l, P) {
    if (!P) return;
    const into = (dst, src) => { for (const [k, v] of Object.entries(src || {})) { if (!dst[k]) dst[k] = {}; dst[k][l] = v; } };
    into(CAST, P.CAST); into(LINES, P.LINES);
    if (P.DAD) { into(DAD.lines, P.DAD.lines); if (P.DAD.name) DAD.name[l] = P.DAD.name; (P.DAD.post || []).forEach((t, i) => { if (DAD.post[i]) DAD.post[i][l] = t; }); }
    if (P.SLIP) SLIP[l] = P.SLIP;
    if (P.TIPS) for (const [k, v] of Object.entries(P.TIPS)) { if (!TIPS[k]) TIPS[k] = {}; TIPS[k][l] = v; }
    for (const [k, t] of Object.entries(P.TASKS || {})) {
      const D = TASKS[k]; if (!D) continue;
      for (const [f, v] of Object.entries(t)) {
        if (typeof D[f] === 'string') D[f] = { _: D[f] };                 // (rung, title: one English string for all, until a language has its own)
        if (!D[f] || typeof D[f] !== 'object' || Array.isArray(D[f])) D[f] = {};
        D[f][l] = v;
      }
    }
    if (P.POST) for (const who of Object.keys(P.POST)) (P.POST[who] || []).forEach((t, i) => { if (POST[who] && POST[who][i]) POST[who][i][l] = t; });
    if (P.CREDITS) for (const [k, v] of Object.entries(P.CREDITS)) if (CREDITS[k] && typeof CREDITS[k] === 'object' && !Array.isArray(CREDITS[k])) CREDITS[k][l] = v;
  }

  // ------------------------------------------------------------ every zh / ja string against CJK.md, and every language complete: []
  function check() {
    const out = [];
    const v = (s, l, where) => {
      if (typeof CJK === 'undefined' || !CJK.validate || !s || typeof s !== 'string' || !/[[぀-ヿ一-鿿]/.test(s)) return;
      if (/[A-Za-z]{2,}/.test(s.replace(/\[[^\]]*\]/g, '').replace(/\{[^}]*\}/g, ''))) return;
      const p = CJK.validate(s.replace(/\{[^}]+\}/g, l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ').replace(/___/g, l === 'zh' ? '[它|tā]' : 'それ'), l);
      if (p.length) out.push(`${where} (${l}): ${p.join('; ')} «${s}»`);
    };
    const under = (x, l, where) => { if (typeof x === 'string') v(x, l, where); else if (Array.isArray(x)) x.forEach((y, i) => under(y, l, where + '.' + i)); };
    const each = (o, where) => { for (const [k, T0] of Object.entries(o || {})) for (const l of ['zh', 'ja']) if (T0 && T0[l] !== undefined) under(T0[l], l, where + '.' + k); };
    each(CAST, 'cast'); each(LINES, 'lines'); each(DAD.lines, 'dad'); each({ name: DAD.name }, 'dad');
    for (const [k, T0] of Object.entries(TASKS)) for (const f of ['frame', 'chips', 'model', 'want', 'alt', 'person', 'tense', 'mood', 'past', 'pres', 'fut']) if (T0[f]) for (const l of ['zh', 'ja']) if (T0[f][l] !== undefined) under(T0[f][l], l, `task.${k}.${f}`);
    for (const l of ['zh', 'ja']) if (SLIP[l]) for (const f of ['right', 'slip', 'joke']) v(SLIP[l][f], l, 'slip.' + f);
    for (const who of Object.keys(POST)) POST[who].forEach((T0, i) => { for (const l of ['zh', 'ja']) if (T0[l]) v(T0[l], l, `post.${who}.${i}`); });
    // completeness: every language that has any lines has them all
    for (const l of LANGS) {
      const any = Object.values(LINES).some(T0 => T0[l]); if (!any) continue;
      for (const [k, T0] of Object.entries(LINES)) if (T0.es && !T0[l]) out.push(`lines.${k}: no ${l}`);
      for (const [k, T0] of Object.entries(TASKS)) for (const f of ['frame', 'chips', 'want']) if (!T0[f] || T0[f][l] === undefined) out.push(`task.${k}.${f}: no ${l}`);
      for (const [k, T0] of Object.entries(TASKS)) if (!T0.model[l]) out.push(`task.${k}.model: no ${l}`);
      if (!SLIP[l]) out.push(`slip: no ${l}`);
      for (const [k, T0] of Object.entries(CAST)) if (!T0[l]) out.push(`cast.${k}: no ${l}`);
      for (const [k, T0] of Object.entries(DAD.lines)) if (!T0[l]) out.push(`dad.${k}: no ${l}`);
    }
    return out;
  }

  return { LANGS, CAST, DAD, LINES, YOU, TAGS, SPEECH, SLIP, BOW, TIPS, TASKS, GIFTS, CAPS, POST, CREDITS, add, check };
})();
