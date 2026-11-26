'use strict';
// Candil long ago: the words (DESIGN.md 21.1, game/TIME.md §25 "The Gray Marsh (T4c)"). Every line in English (the weave's, with
// {w.mhp_*} slots and words already in the game) and Spanish here; marsh_text_pt.js, _de.js, _zh.js and _ja.js add their languages
// (MHPTXT.add). The word table is whole in all five. marsh_past.js is Candil the morning after Lantern Night, marsh_past_dungeon.js the
// Lantern House, marsh_time_boss.js the Lantern Moth; time_marsh.js (MARSHT) says, demonstrates and grades them.
// The grammar rung (TIME.md §8, rung 8, B2): a long story with every past in its place. The imperfect paints the scene and what was
// going on («Hacía calor», «Todos estaban esperando»), «estaba + -ando» is cut off by the preterite («Estaba encendiendo los faroles
// cuando se apagaron»), the preterite moves the story on («La niebla salió del agua»), the pluperfect steps back («Ya se había ido»,
// «Había escrito sus palabras»), and what someone said is passed on one step back («Dijo que iba a hablar», «Creyó que te reías de
// él»). The wrong past where one is needed is a B with a tip; a report not stepped back is a B; the present misses.
// The cast (each language its own for the new people of then): the old lamplighter (Lucero's grandmother), young Nieves (who rang the
// chapel's bell), the ferryman (the twins' father), the mayor (Lantern Night's host), and three of today's grown-ups as children:
// little Marisol, little Ramiro and little Tadeo.
const MHPTXT = (() => {
  const L = (en, es, o) => Object.assign({ en, es }, o || {});
  const CAST = {
    luz: L('Doña Luz', 'Doña Luz'),
    nieves: L('Nieves', 'Nieves'),
    ferry: L('Fidel', 'Fidel'),
    mayor: L('Mayor Paz', 'Alcaldesa Paz'),
    marisol: L('Marisol', 'Marisol'),
    ramiro: L('Ramiro', 'Ramiro'),
    tadeo: L('Tadeo', 'Tadeo'),
    house: L('the Lantern House', 'la Casa de los Faroles'),
  };
  // ------------------------------------------------------------ what people say (mixed by the weave; EN on request)
  const LINES = {
    // the old lamplighter, by the Lantern House's door (the main path)
    'luz.hello': L('Oh! A visitor, this morning of all mornings… I’m {luz}, the {w.mhp_lamplighter} of Candil. Every {w.lantern} on this {w.lf_lake} is mine to light.',
      '¡Oh! Una visita, justo esta mañana… Soy doña Luz, la farolera de Candil. Todos los faroles de este lago los enciendo yo.'),
    'luz.task': L('You heard me. So tell me: what was I doing when the lights went out?',
      'Ya me oíste. A ver, dime: ¿qué estaba haciendo yo cuando se apagaron las luces?'),
    'luz.after': L('Yes… I was out on the causeway, so I didn’t see it. Ask the ones who were on the {w.mhp_jetty}: {mayor} hosted the night, {ferry} was out on the {w.lf_lake} in his boat, and the little ones, {marisol} and {ramiro}. Then come back and tell me the whole {w.mhp_story}, from the {w.mhp_beginning}.',
      'Sí… Yo estaba en el camino de piedra, así que no lo vi. Pregunta a los que estaban en el embarcadero: la alcaldesa Paz organizó la noche, Fidel estaba en el lago con su barca, y los pequeños, Marisol y Ramiro. Luego vuelve y cuéntame la historia entera, desde el principio.'),
    'luz.again': L('Ask the ones who were on the {w.mhp_jetty}: {mayor}, {ferry}, little {marisol}, little {ramiro}. Then tell me everything.',
      'Pregunta a los que estaban en el embarcadero: la alcaldesa, Fidel, la pequeña Marisol, el pequeño Ramiro. Luego cuéntamelo todo.'),
    'luz.ask': L('Well? Tell me the whole {w.mhp_story}. From the {w.mhp_beginning}, slowly.',
      '¿Y bien? Cuéntame la historia entera. Desde el principio, despacio.'),
    'luz.s1': L('First: what was going on on the {w.mhp_jetty} when he came up?', 'Primero: ¿qué pasaba en el embarcadero cuando él llegó?'),
    'luz.s2': L('And before that? What had he done?', '¿Y antes? ¿Qué había hecho él?'),
    'luz.s3': L('And {w.mhp_then}? What happened when he opened his mouth?', '¿Y entonces? ¿Qué pasó cuando abrió la boca?'),
    'luz.s4': L('And what had he told {marisol}?', '¿Y qué le había dicho a Marisol?'),
    'luz.told': L('So that’s how it was… He wrote it to me once: when he was a boy, in Alba, a whole theater laughed at him. Since then he never said a word. And last night that little laugh brought it all back.',
      'Así que fue así… Una vez me lo escribió: de niño, en Alba, un teatro entero se rió de él. Desde entonces no volvió a decir ni una palabra. Y anoche esa risita se lo trajo todo de vuelta.'),
    'luz.told2': L('When his {w.lantern} sank, the gray that always followed him came down over the {w.lf_lake}. He ran up the Lantern House with the last light, and the great lantern went out. At {w.rup_dawn} I saw him on the stair up the {w.pkp_crag}, going up to the Old Tower. I called his name. He didn’t turn round.',
      'Cuando su farol se hundió, lo gris que siempre lo seguía bajó sobre el lago. Subió corriendo a la Casa de los Faroles con la última luz, y el gran farol se apagó. Al amanecer lo vi en la escalera del peñasco, subiendo a la Torre Vieja. Lo llamé por su nombre. No se dio la vuelta.'),
    'luz.key': L('The {w.fog} is inside the Lantern House now, eating the light. Here’s the key. Go up, and light it again. {marisol} will want to go with you.',
      'Ahora la niebla está dentro de la Casa de los Faroles, comiéndose la luz. Toma la llave. Sube y enciéndela otra vez. Marisol querrá ir contigo.'),
    'luz.chat1': L('A {w.mhp_lamplighter} doesn’t need words, I told him. Just a {w.mhp_steady} {w.mhp_hand} and a little {w.pkf_patience}. He had both.',
      'Un farolero no necesita palabras, le dije. Solo una mano firme y un poco de paciencia. Él tenía las dos cosas.'),
    'luz.chat2': L('He lit the {w.mhp_jetty}’s lanterns every evening for a year. He never forgot a single one.',
      'Encendió los faroles del embarcadero cada tarde durante un año. Nunca se le olvidó ni uno.'),
    'luz.done': L('The great lantern is lit again. But look up there, at the tower… the {w.fog} went up with him. Someday someone will go up and bring him his words back.',
      'El gran farol está encendido otra vez. Pero mira allá arriba, la torre… la niebla subió con él. Algún día alguien subirá y le devolverá sus palabras.'),
    // the mayor, at the jetty
    'mayor.task': L('So you’re the one asking questions? Then you tell me: what was everyone doing when he came up onto the {w.mhp_jetty}?',
      '¿Así que tú eres quien hace las preguntas? Entonces dímelo tú: ¿qué estaba haciendo todo el mundo cuando él subió al embarcadero?'),
    'mayor.after': L('Exactly. Waiting, all of us, with our lanterns. And {w.mhp_then}… Ask {ferry}: he saw it from the water.',
      'Exacto. Esperando, todos, con nuestros faroles. Y entonces… Pregúntale a Fidel: él lo vio desde el agua.'),
    'mayor.chat': L('Candil has floated its lanterns on the {w.lf_lake} for a hundred years. It’s our {w.mhp_tradition}. This morning nobody feels like it.',
      'Candil pone sus faroles en el lago desde hace cien años. Es nuestra tradición. Esta mañana nadie tiene ganas.'),
    'mayor.chat2': L('They say he hadn’t said a word in front of anyone in ten years. Last night he was going to. I was so {w.mhp_nervous} for him.',
      'Dicen que llevaba diez años sin decir una palabra delante de nadie. Anoche iba a hacerlo. Yo estaba tan nerviosa por él.'),
    // the ferryman, at the dock
    'ferry.task': L('You tell me, so I know I didn’t dream it: what happened when his {w.lantern} sank?',
      'Dímelo tú, para saber que no lo soñé: ¿qué pasó cuando su farol se hundió?'),
    'ferry.after': L('Yes. That. My {w.mhp_twin:pl} were on the {w.mhp_jetty}… {ramiro} hasn’t said a word since. Go gently with him.',
      'Sí. Eso. Mis gemelos estaban en el embarcadero… Ramiro no ha dicho ni una palabra desde entonces. Ve con cuidado con él.'),
    'ferry.chat': L('I pole the {w.mhp_punt} across the {w.lf_lake} every day. Today the water feels… heavier.',
      'Cada día cruzo el lago con la batea. Hoy el agua se siente… más pesada.'),
    // little Marisol, on the jetty
    'marisol.task': L('Do you believe me? Then say it back: what did he tell me?', '¿Me crees? Entonces repítelo: ¿qué me dijo?'),
    'marisol.after': L('Yes! And {w.mhp_then}… the {w.rup_frog}… Ask {ramiro}. It wasn’t his {w.mhp_fault}!',
      '¡Sí! Y entonces… la rana… Pregúntale a Ramiro. ¡No fue culpa suya!'),
    'marisol.chat': L('My {w.lf_paper_lantern} was a {w.star}. A blue star! It went under the {w.mhp_jetty}.', 'Mi farol de papel era una estrella. ¡Una estrella azul! Se fue debajo del embarcadero.'),
    // little Ramiro (and Tadeo), by the twins' hut
    'ramiro.task': L('(very quietly) Did he think… that I was laughing at him?', '(muy bajito) ¿Él creyó… que yo me reía de él?'),
    'ramiro.after': L('I want to tell him. I want to tell him it was the {w.rup_frog}. But he went up to the tower…',
      'Quiero decírselo. Quiero decirle que fue la rana. Pero se fue a la torre…'),
    'ramiro.chat': L('I keep thinking about his {w.mhp_face}. He went so {w.mhp_pale}.', 'No paro de pensar en su cara. Se puso tan pálido.'),
    'tadeo.chat1': L('It’s true, the {w.rup_frog} had a {w.gd_leaf} on its head. Like a hat. Anyone would have laughed.',
      'Es verdad, la rana tenía una hoja en la cabeza. Como un sombrero. Cualquiera se habría reído.'),
    'tadeo.chat2': L('{ramiro} hasn’t eaten anything this morning. Not even his {w.bread}.', 'Ramiro no ha comido nada esta mañana. Ni su pan.'),
    // young Nieves, at the causeway's foot (she rang the chapel's bell every evening)
    'nieves.1': L('I was ringing the {w.chapel}’s evening {w.bell} when the lights went out. The bell rang… but nobody heard it. Not even me.',
      'Yo estaba tocando la campana de la capilla cuando se apagaron las luces. La campana sonó… pero nadie la oyó. Ni yo.'),
    'nieves.2': L('Every evening I ring it, and the whole {w.lf_lake} answers. This morning the water is quiet.',
      'Cada tarde la toco, y todo el lago responde. Esta mañana el agua está callada.'),
    // little Marisol in the Lantern House (she follows his light with you)
    'house.in': L('It’s so dark in here… Grandma Luz keeps the oil down here. Look at the floor: the {w.fog} got in.',
      'Qué oscuro está aquí… La abuela Luz guarda el aceite aquí abajo. Mira el suelo: la niebla entró.'),
    'house.r0done': L('Yes. While the {w.fog} was coming in, he went up. Let’s go after him.', 'Sí. Mientras la niebla entraba, él subió. Vamos tras él.'),
    'house.r1done': L('He learned it here, with Grandma Luz. Not one word all year… and he learned everything.', 'Lo aprendió aquí, con la abuela Luz. Ni una palabra en todo el año… y lo aprendió todo.'),
    'house.r2done': L('It’s shining! Just a little. The rest of the light is up there… with whatever is drinking it.', '¡Brilla! Solo un poquito. El resto de la luz está allá arriba… con lo que se la está bebiendo.'),
    'house.top': L('Look, round the great {w.lantern}! A moth… a huge gray one. It’s drinking the light!', '¡Mira, alrededor del gran farol! Una polilla… una polilla gris enorme. ¡Se está bebiendo la luz!'),
    'house.end': L('His words… He had them all along. When he comes back down, I’ll be the first to listen. I promise.', 'Sus palabras… Las tenía desde siempre. Cuando baje, yo seré la primera en escucharlo. Lo prometo.'),
    // side quest: «Ramiro's note» (cross-time)
    'note.ask': L('Will you help me? I’m going to write him a {w.rup_note}. But I don’t know how to say it. You say it, and I’ll write it down: «{ramiro} said that…»',
      '¿Me ayudas? Le voy a escribir una nota. Pero no sé cómo decirlo. Dilo tú, y yo lo escribo: «Ramiro dijo que…»'),
    'note.done': L('There. I’ll put it in a {w.ruf_can}, at the foot of the tower’s stair, under a {w.mhp_cairn}. So it doesn’t get wet. When he comes down, he’ll find it.',
      'Ya está. La voy a poner en una lata, al pie de la escalera de la torre, debajo de un mojón. Para que no se moje. Cuando baje, la va a encontrar.'),
    'note.placed': L('He’ll come down someday. And then he’ll read it. Won’t he?', 'Algún día bajará. Y entonces la leerá. ¿Verdad?'),
    'now.ramiro.note': L('That {w.ruf_can} by the tower path? I put it there. I was seven. «{ramiro} said that he wasn’t laughing at you.» I never knew if he read it. I’ve always been a little sorry about that.',
      '¿Esa lata junto al camino de la torre? La puse yo. Tenía siete años. «Ramiro dijo que no se reía de ti.» Nunca supe si la leyó. Siempre me ha dado un poco de pena.'),
    // side quest: «Nieves's willow» (cross-time)
    'willow.ask': L('Will you help me? I want to plant a {w.tf_gd_willow} {w.mhp_cutting} by the causeway, so the {w.mhp_pilgrim:pl} have some shade. But the bank is all stones.',
      '¿Me ayudas? Quiero plantar un esqueje de sauce junto al camino de piedra, para que los peregrinos tengan sombra. Pero la orilla es pura piedra.'),
    'willow.planted': L('Now it’s in! Willows love water: it’ll grow fast. Tell me, so I remember it: where did we plant it?',
      '¡Ya está plantado! A los sauces les encanta el agua: crecerá rápido. Dímelo, para que me acuerde: ¿dónde lo plantamos?'),
    'willow.done': L('By the causeway. Maybe someday it’ll be the biggest tree on the {w.lf_lake}.', 'Junto al camino. Quizá algún día sea el árbol más grande del lago.'),
    'now.nieves.willow': L('That {w.tf_gd_willow} by the causeway? I planted it, the year the {w.fog} came. With a little help. It’s the only one that never died.',
      '¿Ese sauce junto al camino de piedra? Lo planté yo, el año que llegó la niebla. Con un poco de ayuda. Es el único que nunca se murió.'),
    // side quest: «Marisol's paper lantern»
    'lantern.ask': L('My {w.lf_paper_lantern}… it went under the {w.mhp_jetty} last night. It’s still there, I can see it. I can’t swim that far.',
      'Mi farol de papel… anoche se fue debajo del embarcadero. Todavía está ahí, lo veo. Yo no sé nadar tan lejos.'),
    'lantern.legend': L('You got it! Now… tell me the {w.mhp_legend}. Grandma Luz always tells it: what did people do every year, on {w.mhp_lanternnight}?',
      '¡Lo trajiste! Ahora… cuéntame la leyenda. La abuela Luz siempre la cuenta: ¿qué hacía la gente cada año, en la Noche de los Faroles?'),
    'lantern.done': L('Yes! And this year I’m going to make a new {w.star}. A bigger one, with {w.mhp_tissuepaper} and {w.mhp_bamboo}.',
      '¡Sí! Y este año voy a hacer una estrella nueva. Más grande, con papel de seda y bambú.'),
  };
  // ------------------------------------------------------------ demonstrations (whole in the language, the marked words glossed)
  const DEMO = {
    'luz.demo': L('Last night was {w.mhp_lanternnight}. It was warm, and the {w.lf_lake} was as still as a {w.mhp_mirror}. I was lighting the causeway’s lanterns when, all of a sudden, every light went out. When I got back, the boy had {w.mhp_already} gone. And this morning {marisol} told me he wanted to speak.',
      'Anoche fue la Noche de los Faroles. Hacía calor y el lago estaba quieto como un espejo. Yo estaba encendiendo los faroles del camino de piedra cuando, de repente, todas las luces se apagaron. Cuando volví, el muchacho ya se había ido. Y esta mañana Marisol me dijo que él quería hablar.'),
    'mayor.demo': L('Last night we were all on the {w.mhp_jetty}. Every year, each person says a {w.pf_wish} out loud and puts their {w.lantern} on the water. The quiet boy was waiting for his turn, his lantern in his {w.mhp_hand}. I had asked him myself: «Tonight, you speak too!»',
      'Anoche todos estábamos en el embarcadero. Cada año, cada persona dice un deseo en voz alta y pone su farol en el agua. El muchacho callado estaba esperando su turno, con su farol en la mano. Se lo había pedido yo misma: «¡Esta noche, habla tú también!»'),
    'ferry.demo': L('I was out in my boat, in the middle of the {w.lf_lake}. I saw his {w.lantern} fall into the water. When it sank, the {w.fog} came up out of the water… gray, cold. I had never seen a fog like that on our lake. Never!',
      'Yo estaba en mi barca, en medio del lago. Vi su farol caer al agua. Cuando se hundió, la niebla salió del agua… gris, fría. Nunca había visto una niebla así en nuestro lago. ¡Nunca!'),
    'marisol.demo': L('I was right next to him! He had shown me his {w.rup_notebook}: he had written his words, all of them. He told me that tonight he was going to speak in front of everyone. He told ME!',
      '¡Yo estaba a su lado! Él me había enseñado su cuaderno: había escrito sus palabras, todas. Me dijo que esa noche iba a hablar delante de todos. ¡Me lo dijo a mí!'),
    // little Marisol in the Lantern House, a floor at a time
    'd.r0': L('Look: wet {w.rup_footprint:pl} on the {w.mhp_step:pl}. The {w.fog} was coming in under the door… and he went up.',
      'Mira: huellas mojadas en los escalones. La niebla entraba por debajo de la puerta… y él subió.'),
    'd.r1': L('A {w.mhp_page} from his {w.rup_notebook}! It says: «I came to Candil a year ago. Here I learned to light the light.» So he wrote that he had learned to light the light…',
      '¡Una página de su cuaderno! Dice: «Llegué a Candil hace un año. Aquí aprendí a encender la luz.» O sea, escribió que había aprendido a encender la luz…'),
    'd.r2': L('The great {w.pf_lens}… Grandma Luz says that before, it shone all night, and the boats could see it from far away. Now it’s all gray.',
      'La gran lente… La abuela Luz dice que antes brillaba toda la noche, y las barcas la veían desde lejos. Ahora está toda gris.'),
    'ramiro.demo': L('A {w.rup_frog} jumped onto the {w.mhp_jetty}, just as he opened his mouth. It was so {w.mhp_funny}! I laughed… But I wasn’t laughing at him. I was laughing at the frog! He went {w.mhp_pale} and ran off.',
      'Una rana saltó al embarcadero, justo cuando él abrió la boca. ¡Era tan graciosa! Me reí… Pero yo no me reía de él. ¡Me reía de la rana! Él se puso pálido y se fue corriendo.'),
  };
  const MARKS = {
    'luz.demo': { es: [['Hacía calor', 'it was warm (the scene)'], ['estaba quieto', 'was still (the scene)'], ['estaba encendiendo', 'was lighting (going on…)'], ['se apagaron', 'went out (…cut off: what happened)'], ['ya se había ido', 'had already gone (before that)'], ['me dijo que él quería', 'told me he wanted (what someone said)']] },
    'mayor.demo': { es: [['estábamos', 'we were (the scene)'], ['Cada año', 'every year'], ['deseo', 'wish'], ['estaba esperando su turno', 'was waiting for his turn'], ['Se lo había pedido yo', 'I had asked him (before that)']] },
    'ferry.demo': { es: [['estaba en mi barca', 'I was in my boat (the scene)'], ['Vi', 'I saw'], ['se hundió', 'it sank'], ['salió del agua', 'came out of the water'], ['Nunca había visto', 'I had never seen']] },
    'marisol.demo': { es: [['estaba a su lado', 'I was next to him'], ['me había enseñado', 'had shown me'], ['había escrito', 'had written'], ['Me dijo que', 'he told me that'], ['iba a hablar', 'was going to speak (stepped back)']] },
    'ramiro.demo': { es: [['saltó', 'jumped'], ['abrió la boca', 'opened his mouth'], ['Era tan graciosa', 'it was so funny'], ['no me reía de él', 'I wasn’t laughing at him'], ['se fue corriendo', 'ran off']] },
    'd.r0': { es: [['huellas', 'footprints'], ['escalones', 'steps'], ['entraba', 'was coming in (going on)'], ['subió', 'went up (what happened)']] },
    'd.r1': { es: [['página', 'page'], ['Llegué', 'I came'], ['aprendí', 'I learned'], ['escribió que', 'he wrote that'], ['había aprendido', 'had learned (stepped back)']] },
    'd.r2': { es: [['lente', 'lens'], ['antes brillaba', 'it used to shine'], ['la veían', 'they could see it'], ['desde lejos', 'from far away']] },
  };
  // ------------------------------------------------------------ the pattern cards: a long story with every past; passing on a plan
  const CARDS = {
    story: { tag: 'A long story: every past in its place',
      es: { ex: [['hacía calor, estaba quieto', 'the scene: the imperfect'], ['estaba encendiendo… cuando se apagaron', 'going on, then cut off'], ['se apagaron, volví', 'what happened: the preterite'], ['ya se había ido', 'before that: the pluperfect'], ['me dijo que quería', 'what someone said, stepped back']],
        note: 'A long story uses them all. The imperfect paints the scene and what was going on («hacía», «estaba encendiendo»); the preterite moves the story on («se apagaron», «volví»); the pluperfect steps back to before («ya se había ido»); «dijo que…» passes on what someone said, one step back in time («quería»).' } },
    said: { tag: 'What someone said they would do',
      es: { ex: [['«Voy a hablar» → dijo que iba a hablar', '“I’m going to” → he said he was going to'], ['«Hablaré» → dijo que hablaría', '“I will” → he said he would'], ['«Quiero» → dijo que quería', '“I want” → he said he wanted']],
        note: 'Passing on a plan, step it back: «voy a» becomes «iba a», the future becomes the conditional («hablaría»), the present the imperfect («quería»). And what someone thought too: «creyó que te reías de él».' } },
  };
  // ------------------------------------------------------------ the tasks (MARSHT.grade): want (S; an A with an accent missing or none of
  // `more`), alt (A), tense (the other past: B), shift (what someone said, not stepped back: B), person (someone else: B), and the misses:
  // pres (now), fut (tomorrow), miss
  const T = o => o;
  const TIPS = {
    tense: { es: 'That’s the other past: «{form}».' },
    shift: { es: 'Almost! Passing on what someone said or thought, step the time back: «{form}».' },
    pres: { es: 'That’s now. It already happened: «{form}».' },
    fut: { es: 'That’s tomorrow! This is long ago: «{form}».' },
    person: { es: 'Right time, but who? «{form}».' },
    alt: { es: 'Right! The step here: «{form}».' },
    more: { es: 'Right! The whole sentence for an S: «{form}».' },
    veto: { es: '«{form}»' },
    miss: { es: '«{form}»' },
  };
  const TASKS = {
    // the old lamplighter's question (the scene she was in: «estaba + -ando», cut off)
    luz1: T({ title: '{luz}’s question: what was she doing when the lights went out?', words: ['w.lantern'],
      frame: { es: 'Estabas ___ los faroles del camino.' }, chips: { es: [['encendiendo', 'lighting']] },
      model: L('You were lighting the causeway’s lanterns.', 'Estabas encendiendo los faroles del camino.'),
      want: { es: [['estabas', 'encendiendo']] }, alt: { es: ['encendías'] },
      tense: { es: ['encendiste'] }, person: { es: [['estaba', 'encendiendo'], ['estaban', 'encendiendo']] },
      pres: { es: [['estás', 'encendiendo'], 'enciendes'] }, fut: { es: ['encenderás', ['vas a', 'encender']] },
      more: { es: ['faroles'] },
      tips: { tense: { es: 'That happened, yes… but she was in the middle of it when the lights went out: «{form}».' }, person: { es: 'Right tense! But you’re telling HER what she was doing: «{form}».' }, alt: { es: 'Right! But she was in the middle of it: «estabas encendiendo». An A.' } } }),
    // the four witnesses
    mayor: T({ title: '{mayor}’s question: what was everyone doing when he came up?', words: ['w.mhp_jetty'],
      frame: { es: 'Todos ___ esperando en el embarcadero.' }, chips: { es: [['estaban', 'were']] },
      model: L('Everyone was waiting on the jetty.', 'Todos estaban esperando en el embarcadero.'),
      want: { es: [['estaban', 'esperando']] }, alt: { es: ['esperaban'] },
      tense: { es: ['esperaron', ['estuvieron', 'esperando']] }, person: { es: [['estábamos', 'esperando'], ['estaba', 'esperando']] },
      pres: { es: [['están', 'esperando'], 'esperan'] }, fut: { es: ['esperarán'] },
      more: { es: ['embarcadero'] },
      tips: { tense: { es: 'That’s what happened, once. Here it’s the scene, still going on: «{form}».' }, person: { es: 'Right tense! Everyone: «{form}».' } } }),
    ferry: T({ title: '{ferry}’s question: what happened when the lantern sank?', words: ['w.fog'],
      frame: { es: 'La niebla ___ del agua.' }, chips: { es: [['salió', 'came out']] },
      model: L('The fog came up out of the water.', 'La niebla salió del agua.'),
      want: { es: ['salió'] }, alt: { es: ['subió', ['se', 'levantó']] },
      tense: { es: ['salía', ['había', 'salido']] },
      pres: { es: ['sale'] }, fut: { es: ['saldrá'] },
      more: { es: ['agua'] },
      tips: { tense: { es: 'That’s the background. What happened, right then? «{form}».' } } }),
    marisol: T({ title: 'Little {marisol}’s question: what did he tell her?', words: ['w.rup_notebook'],
      frame: { es: 'Te dijo que ___ hablar delante de todos.' }, chips: { es: [['iba a', 'was going to']] },
      model: L('He told you he was going to speak in front of everyone.', 'Te dijo que iba a hablar delante de todos.'),
      want: { es: [['dijo', 'iba a hablar'], ['dijo', 'hablaría']] }, alt: { es: [['le dijo', 'iba a hablar']] },
      shift: { es: [['dijo', 'va a hablar'], ['dijo', 'hablará']] }, person: { es: [['me dijo', 'iba a hablar']] },
      pres: { es: [['dice', 'va a hablar']] },
      more: { es: ['todos'] },
      tips: { shift: { es: 'Almost! Passing on what he said, step it back: «voy a» → «iba a». «{form}».' }, person: { es: 'Right time, but he told HER: «te dijo». «{form}».' }, alt: { es: 'Right! She’s right there, though: «te dijo». An A.' } } }),
    ramiro: T({ title: 'Little {ramiro}’s question: did he think Ramiro was laughing at him?', words: ['w.mhp_laugh'],
      frame: { es: 'Sí. Creyó que te ___ de él.' }, chips: { es: [['reías', 'you were laughing']] },
      model: L('Yes. He thought you were laughing at him.', 'Sí. Creyó que te reías de él.'),
      want: { es: [['creyó', 'reías'], ['pensó', 'reías']] },
      shift: { es: [['creyó', 'ríes'], ['pensó', 'ríes']] }, tense: { es: [['creyó', 'reíste'], ['pensó', 'reíste']] },
      pres: { es: [['cree', 'ríes']] },
      more: { es: ['creyó', 'pensó'] },
      tips: { shift: { es: 'Almost! What he thought, stepped back: «te ríes» → «te reías». «{form}».' }, tense: { es: 'You laughed, yes. But what he thought was going on: «te reías». «{form}».' } } }),
    // the whole story, told back to the old lamplighter (four parts, in order)
    s1: T({ title: '{luz}: what was going on on the jetty when he came up?', words: ['w.mhp_jetty'],
      frame: { es: 'Todos ___ esperando con sus faroles.' }, chips: { es: [['estaban', 'were']] },
      model: L('Everyone was waiting with their lanterns.', 'Todos estaban esperando con sus faroles.'),
      want: { es: [['estaban', 'esperando']] }, alt: { es: ['esperaban'] }, tense: { es: ['esperaron'] },
      pres: { es: [['están', 'esperando'], 'esperan'] }, more: { es: ['faroles'] },
      tips: { tense: { es: 'That’s what happened, once. The scene was still going on: «{form}».' } } }),
    s2: T({ title: '{luz}: and before that, what had he done?', words: ['w.rup_notebook', 'w.mhp_word'],
      frame: { es: '___ escrito sus palabras en un cuaderno.' }, chips: { es: [['había', 'had']] },
      model: L('He had written his words in a notebook.', 'Había escrito sus palabras en un cuaderno.'),
      want: { es: [['había', 'escrito']] }, tense: { es: ['escribió', 'escribía', ['ha', 'escrito']] },
      pres: { es: ['escribe'] }, more: { es: ['palabras'] },
      tips: { tense: { es: 'It happened, yes, but BEFORE that night: «había» + the participle, «{form}».' } } }),
    s3: T({ title: '{luz}: and then? What happened when he opened his mouth?', words: ['w.rup_frog', 'w.mhp_laugh'],
      frame: { es: 'Ramiro se ___ de una rana, y él se fue corriendo.' }, chips: { es: [['rió', 'laughed']] },
      model: L('Ramiro laughed at a frog, and he ran off.', 'Ramiro se rió de una rana, y él se fue corriendo.'),
      want: { es: [['rió', 'fue'], ['rio', 'fue'], ['rió', 'marchó']] }, alt: { es: [['rió', 'corriendo']] },
      tense: { es: [['reía', 'iba'], ['reía', 'fue']] }, pres: { es: [['ríe', 'va']] },
      more: { es: ['rana'] },
      tips: { tense: { es: 'Those happened, one after the other: the preterite, «{form}».' }, alt: { es: 'Right! And then what did HE do? «{form}».' } } }),
    s4: T({ title: '{luz}: and what had he told Marisol?', words: ['w.mhp_speech'],
      frame: { es: 'Le dijo que ___ hablar delante de todos.' }, chips: { es: [['iba a', 'was going to']] },
      model: L('He told her he was going to speak in front of everyone.', 'Le dijo que iba a hablar delante de todos.'),
      want: { es: [['dijo', 'iba a hablar'], ['dijo', 'hablaría']] }, shift: { es: [['dijo', 'va a hablar'], ['dijo', 'hablará']] },
      pres: { es: [['dice', 'va a']] }, more: { es: ['todos'] } }),
    // the Lantern House's floors
    r0: T({ title: 'Wet footprints on the stairs: what happened while the fog was coming in?', words: ['w.rup_footprint'],
      frame: { es: 'Mientras la niebla ___, él subió la escalera.' }, chips: { es: [['entraba', 'was coming in']] },
      model: L('While the fog was coming in, he went up the stairs.', 'Mientras la niebla entraba, él subió la escalera.'),
      want: { es: [['entraba', 'subió'], ['estaba entrando', 'subió']] },
      tense: { es: [['entró', 'subió'], ['entraba', 'subía']] }, pres: { es: [['entra', 'sube']] },
      more: { es: ['escalera'] },
      tips: { tense: { es: 'One of them was going on, the other cut in: «mientras la niebla entraba» (going on), «él subió» (what happened). «{form}».' } } }),
    r1: T({ title: 'A page from his notebook: what did he write?', words: ['w.mhp_page'],
      frame: { es: 'Escribió que ___ aprendido a encender la luz.' }, chips: { es: [['había', 'had']] },
      model: L('He wrote that he had learned to light the light.', 'Escribió que había aprendido a encender la luz.'),
      want: { es: [['escribió', 'había aprendido']] }, shift: { es: [['escribió', 'aprendí'], ['escribió', 'aprendió'], ['escribió', 'aprendo']] },
      pres: { es: [['escribe', 'aprendí']] }, more: { es: ['luz'] },
      tips: { shift: { es: 'Almost! What he wrote, passed on, steps back: «aprendí» → «había aprendido». «{form}».' } } }),
    r2: T({ title: 'The great lens: what did it use to do, every night?', words: ['w.pf_lens'],
      frame: { es: 'Antes, la lente ___ toda la noche.' }, chips: { es: [['brillaba', 'used to shine']] },
      model: L('Before, the lens used to shine all night.', 'Antes, la lente brillaba toda la noche.'),
      want: { es: ['brillaba'] }, tense: { es: ['brilló', ['había', 'brillado']] }, pres: { es: ['brilla'] }, fut: { es: ['brillará'] },
      more: { es: ['noche'] },
      tips: { tense: { es: 'Every night, again and again: the imperfect, «{form}».' } } }),
    // the Lantern Moth forgot the night: tell it
    moth1: T({ title: 'The Lantern Moth: what was going on on the jetty?', words: ['w.mhp_jetty'],
      frame: { es: 'Todos ___ esperando en el embarcadero.' }, chips: { es: [['estaban', 'were']] },
      model: L('Everyone was waiting on the jetty.', 'Todos estaban esperando en el embarcadero.'),
      want: { es: [['estaban', 'esperando']] }, alt: { es: ['esperaban'] }, tense: { es: ['esperaron'] },
      pres: { es: [['están', 'esperando'], 'esperan'] }, more: { es: ['embarcadero'] },
      tips: { tense: { es: 'That’s what happened, once. The scene was still going on: «{form}».' } } }),
    moth2: T({ title: 'The Lantern Moth: and the boy, what had he done before?', words: ['w.mhp_word'],
      frame: { es: '___ escrito sus palabras.' }, chips: { es: [['había', 'had']] },
      model: L('He had written his words.', 'Había escrito sus palabras.'),
      want: { es: [['había', 'escrito']] }, tense: { es: ['escribió', 'escribía'] }, pres: { es: ['escribe'] },
      more: { es: ['palabras'] },
      tips: { tense: { es: 'It happened BEFORE that night: «{form}».' } } }),
    // side quests
    note: T({ title: 'Little {ramiro}’s note: «Ramiro said that…»', words: ['w.rup_note'],
      frame: { es: 'Ramiro dijo que no se ___ de ti.' }, chips: { es: [['reía', 'was laughing']] },
      model: L('Ramiro said that he wasn’t laughing at you. He was laughing at a frog.', 'Ramiro dijo que no se reía de ti. Se reía de una rana.'),
      want: { es: [['dijo', 'no se reía']] }, shift: { es: [['dijo', 'no se ríe'], ['dijo', 'no me río']] },
      person: { es: [['dijo', 'no me reía']] }, pres: { es: [['dice', 'no se ríe']] },
      more: { es: ['rana'] },
      tips: { shift: { es: 'Almost! Passed on, it steps back: «no me río» → «no se reía». «{form}».' }, person: { es: 'Right time! But Ramiro is «él» in the note: «no se reía». «{form}».' } } }),
    willow2: T({ title: '{nieves}: where did you plant it?', words: ['w.tf_gd_willow'],
      frame: { es: 'Lo ___ junto al camino de piedra.' }, chips: { es: [['plantamos', 'we planted']] },
      model: L('We planted it by the causeway.', 'Lo plantamos junto al camino de piedra.'),
      want: { es: ['plantamos'] }, alt: { es: ['plantaste', 'plantó'] }, tense: { es: ['plantábamos'] },
      pres: { es: ['plantamos hoy'] }, fut: { es: ['plantaremos'] },
      more: { es: ['camino'] },
      tips: { alt: { es: 'Right! You did it together, though: «lo plantamos». An A.' }, tense: { es: 'It happened once, just now: «{form}».' } } }),
    legend: T({ title: 'Little {marisol}: what did people do every year, on Lantern Night?', words: ['w.mhp_legend', 'w.mhp_tradition'],
      frame: { es: 'Cada año, la gente ___ faroles en el lago y pedía un deseo.' }, chips: { es: [['ponía', 'used to put']] },
      model: L('Every year, people put lanterns on the lake and made a wish.', 'Cada año, la gente ponía faroles en el lago y pedía un deseo.'),
      want: { es: [['ponía', 'pedía'], ['ponía', 'decía']] }, alt: { es: ['ponía'] }, tense: { es: ['puso', 'pidió'] },
      pres: { es: [['pone', 'pide']] }, more: { es: ['deseo'] },
      tips: { tense: { es: 'That’s once. Every year, again and again: the imperfect, «{form}».' }, alt: { es: 'Right! And the wish too, «pedía un deseo». An A.' } } }),
  };
  // {mimo}, told as a memory (3rd person: past_text.js PTXT.PV has the forms): the box's frame and model per task
  const MEM = {
    barrel: { verb: 'v.push', title: 'An oil barrel has rolled across the stairs. Tell {mimo} what it did, as a memory.', words: ['w.pkp_barrel'],
      frame: { es: '{mimo} ___ el barril.' }, model: L('{mimo} pushed the barrel.', '{mimo} empujó el barril.'), more: { es: ['barril'] } },
    blow: { verb: 'v.blow', title: 'A thick knot of fog sits on the hatch. Tell {mimo} what it did, as a memory.', words: ['w.fog'],
      frame: { es: '{mimo} ___ la niebla.' }, model: L('{mimo} blew the fog away.', '{mimo} sopló la niebla.'), more: { es: ['niebla'] } },
    lens: { verb: 'v.light', title: 'The great lens is gray with fog. Tell {mimo} what it did, as a memory.', words: ['w.pf_lens'],
      frame: { es: '{mimo} ___ la lente.' }, model: L('{mimo} lit up the lens.', '{mimo} iluminó la lente.'), more: { es: ['lente'] } },
    willow: { verb: 'v.dig', title: 'The bank is all stones. Tell {mimo} what it did, as a memory.', words: ['w.mhp_cutting'],
      frame: { es: '{mimo} ___ un hoyo junto al camino.' }, model: L('{mimo} dug a hole by the causeway.', '{mimo} cavó un hoyo junto al camino.'), more: { es: ['hoyo'] } },
    lantern: { verb: 'v.swim', title: 'Marisol’s paper lantern bobs under the jetty. Tell {mimo} what it did, as a memory.', words: ['w.lf_paper_lantern'],
      frame: { es: '{mimo} ___ hasta el farol.' }, model: L('{mimo} swam to the lantern.', '{mimo} nadó hasta el farol.'), more: { es: ['farol'] } },
  };
  // ------------------------------------------------------------ the Lantern House's floors, and the Lantern Moth's lines
  const ROOMS = [
    { name: 'The Oil Store', sub: 'The Lantern House, long ago · the ground floor' },
    { name: 'The Wick Room', sub: 'The Lantern House, long ago · where the wicks are made' },
    { name: 'The Lens Gallery', sub: 'The Lantern House, long ago · the great mirror' },
    { name: 'The Lantern Room', sub: 'The Lantern House, long ago · the top' },
  ];
  const FIGHT = {
    intro: L('Light… more light… I drink it all. Who are you? I don’t remember anything… only the light.', 'Luz… más luz… me la bebo toda. ¿Quiénes son? No recuerdo nada… solo la luz.'),
    coach: L('It’s a memory! Tell what {mimo} did: «{mimo} jumped…», «{mimo} hit…». Even better, the scene and the deed at once: «While the moth was drinking the light, {mimo} jumped on it»!',
      '¡Es un recuerdo! Di lo que hizo {mimo}: «{mimo} saltó…», «{mimo} golpeó…». Mejor aún, la escena y lo que pasó, juntos: «Mientras la polilla bebía la luz, {mimo} saltó sobre ella».'),
    now: L('That’s now! In here, everything is a memory.', '¡Eso es ahora! Aquí dentro, todo es un recuerdo.'),
    ouch: L('My wings! My dusty wings!', '¡Mis alas! ¡Mis alas de polvo!'),
    story: L('A story! It was drinking the light… and then {mimo} struck. STORY ×2!', '¡Una historia! Bebía la luz… y entonces {mimo} atacó. ¡HISTORIA ×2!'),
    dust: L('Moth dust!', '¡Polvo de polilla!'),
    gust: L('Wing gust!', '¡Aletazo!'),
    forgot: L('My dust… gone… I don’t remember the night. I drank the light, and the night with it. Tell me. What was going on on the jetty?',
      'Mi polvo… se fue… No recuerdo la noche. Me bebí la luz, y la noche también. Cuéntamela. ¿Qué pasaba en el embarcadero?'),
    q2: L('Waiting… yes, waiting. And the boy… what had he done before?', 'Esperando… sí, esperando. Y el muchacho… ¿qué había hecho antes?'),
    answer: L('Tell it the night, right: «Everyone was waiting…»', 'Cuéntale la noche, bien: «Todos estaban esperando…»'),
    remember: L('His words… he had written them. I remember now. I remember…', 'Sus palabras… las había escrito. Ahora me acuerdo. Me acuerdo…'),
    win: L('He came up here with the last light, and he opened his mouth one more time, to the lake. I kept what he said. Here… I give it back.',
      'Subió aquí con la última luz, y abrió la boca una vez más, hacia el lago. Guardé lo que dijo. Toma… te lo devuelvo.'),
  };
  // the Lantern Moth in the battle: a species of its own in every language (the word you aim at it with is the moth's)
  const SPECIES = { es: { w: 'polilla', pl: 'polillas', g: 'f', en: 'the Lantern Moth' } };
  const NAMES = {
    boss: L('the Lantern Moth', 'la Polilla del Farol'),
    noteText: L('Ramiro said he wasn’t laughing at you. He was laughing at a frog.', 'Ramiro dijo que no se reía de ti. Se reía de una rana.'),
    house: L('The Lantern House', 'La Casa de los Faroles'),
  };
  const LORE = L('The Lantern Moth: a great gray moth that hatched from a lantern that sank on Lantern Night. It drinks light, and with it, what people remember.',
    'La Polilla del Farol: una gran polilla gris que nació de un farol que se hundió en la Noche de los Faroles. Se bebe la luz, y con ella, lo que la gente recuerda.');

  // ------------------------------------------------------------ the words of long ago (MARSHT.registerWords: LEX items, kind 'word'; the
  // journal's «Marsh words»): W(key, en, es, pt, de, zh, ja, genders es·pt·de, plurals?). The land's own words are here too:
  // time_marsh_land.js's Looks say them. Words already in the game (the lantern, the fog, the lake, the frog, the willow…) are used,
  // never registered again.
  const GD = { m: 'm', f: 'f', n: 'n' };
  const W = (k, en, es, pt, de, zh, ja, g, pl) => {
    const o = { id: 'w.mhp_' + k, en, es, pt, de, zh, ja };
    if (g) o.g = { es: GD[g[0]], pt: GD[g[1]], de: GD[g[2]] };
    if (pl) o.pl = pl;
    return o;
  };
  const PL = (es, pt, de) => ({ es, pt, de });
  const WORDS = [
    W('jetty', 'jetty', 'embarcadero', 'cais', 'Bootssteg', '[码头|mǎ tóu]', '[桟橋|さんばし]', 'mmm'),
    W('lamplighter', 'lamplighter', 'farolera', 'acendedora de lampiões', 'Laternenanzünderin', '[点灯人|diǎn dēng rén]', '[明|あ]かり [番|ばん]', 'fff'),
    W('lanternnight', 'Lantern Night', 'Noche de los Faroles', 'Noite das Lanternas', 'Laternennacht', '[灯笼夜|dēng long yè]', '[灯籠|とうろう] の [夜|よる]', 'fff'),
    W('page', 'page', 'página', 'página', 'Seite', '[纸页|zhǐ yè]', 'ページ', 'fff'),
    W('word', 'word', 'palabra', 'palavra', 'Wort', '[话|huà]', '[言葉|ことば]', 'ffn', PL('palabras', 'palavras', 'Worte')),
    W('laugh', 'laugh', 'risa', 'risada', 'Lachen', '[笑声|xiào shēng]', '[笑|わら]い[声|ごえ]', 'ffn'),
    W('sadness', 'sadness', 'tristeza', 'tristeza', 'Traurigkeit', '[悲伤|bēi shāng]', '[悲|かな]しみ', 'fff'),
    W('story', 'story', 'historia', 'história', 'Geschichte', '[故事|gù shi]', '[話|はなし]', 'fff'),
    W('legend', 'legend', 'leyenda', 'lenda', 'Legende', '[传说|chuán shuō]', '[言|い]い[伝|つた]え', 'fff'),
    W('firefly', 'firefly', 'luciérnaga', 'vaga-lume', 'Glühwürmchen', '[萤火虫|yíng huǒ chóng]', 'ホタル', 'fmn', PL('luciérnagas', 'vaga-lumes', 'Glühwürmchen')),
    W('cutting', 'cutting', 'esqueje', 'muda', 'Steckling', '[枝条|zhī tiáo]', '[挿|さ]し[木|き]', 'mfm'),
    W('cairn', 'cairn', 'mojón', 'marco de pedras', 'Steinhaufen', '[石堆|shí duī]', '[石積|いしづ]み', 'mmm'),
    W('mirror', 'mirror', 'espejo', 'espelho', 'Spiegel', '[镜子|jìng zi]', '[鏡|かがみ]', 'mmm'),
    W('pilgrim', 'pilgrim', 'peregrino', 'peregrino', 'Pilger', '[朝圣者|cháo shèng zhě]', '[巡礼者|じゅんれいしゃ]', 'mmm', PL('peregrinos', 'peregrinos', 'Pilger')),
    W('twin', 'twin', 'gemelo', 'gêmeo', 'Zwilling', '[双胞胎|shuāng bāo tāi]', '[双子|ふたご]', 'mmm', PL('gemelos', 'gêmeos', 'Zwillinge')),
    W('carp', 'carp', 'carpa', 'carpa', 'Karpfen', '[鲤鱼|lǐ yú]', '[鯉|こい]', 'ffm'),
    W('punt', 'punt', 'batea', 'chata', 'Kahn', '[平底船|píng dǐ chuán]', '[小舟|こぶね]', 'ffm'),
    W('funny', 'funny', 'gracioso', 'engraçado', 'lustig', '[好笑|hǎo xiào]', 'おかしい'),
    W('fault', 'fault', 'culpa', 'culpa', 'Schuld', '[错|cuò]', 'せい', 'fff'),
    W('shame', 'embarrassment', 'vergüenza', 'vergonha', 'Scham', '[难为情|nán wéi qíng]', '[恥|は]ずかしさ', 'fff'),
    W('misunderstanding', 'misunderstanding', 'malentendido', 'mal-entendido', 'Missverständnis', '[误会|wù huì]', '[誤解|ごかい]', 'mmn'),
    W('witness', 'witness', 'testigo', 'testemunha', 'Zeuge', '[证人|zhèng rén]', '[目撃者|もくげきしゃ]', 'mfm'),
    W('speech', 'speech', 'discurso', 'discurso', 'Rede', '[演讲|yǎn jiǎng]', 'スピーチ', 'mmf'),
    W('then', 'then', 'entonces', 'então', 'dann', '[然后|rán hòu]', 'それから'),
    W('afterwards', 'afterwards', 'luego', 'depois', 'danach', '[后来|hòu lái]', 'あとで'),
    W('already', 'already', 'ya', 'já', 'schon', '[已经|yǐ jīng]', 'もう'),
    W('earlymorning', 'small hours', 'madrugada', 'madrugada', 'Morgengrauen', '[凌晨|líng chén]', '[明|あ]け[方|がた]', 'ffn'),
    W('hand', 'hand', 'mano', 'mão', 'Hand', '[手|shǒu]', '[手|て]', 'fff', PL('manos', 'mãos', 'Hände')),
    W('face', 'face', 'cara', 'rosto', 'Gesicht', '[脸|liǎn]', '[顔|かお]', 'fmn'),
    W('warmth', 'warmth', 'calor', 'calor', 'Wärme', '[热气|rè qì]', '[暑|あつ]さ', 'mmf'),
    W('stainedglass', 'stained glass', 'vidriera', 'vitral', 'Buntglasfenster', '[彩色玻璃|cǎi sè bō li]', 'ステンドグラス', 'fmn'),
    W('workshop', 'workshop', 'taller', 'oficina', 'Werkstatt', '[工作间|gōng zuò jiān]', '[作業場|さぎょうば]', 'mff'),
    W('oilcan', 'oil can', 'bidón', 'galão', 'Kanister', '[油桶|yóu tǒng]', '[油缶|あぶらかん]', 'mmm', PL('bidones', 'galões', 'Kanister')),
    W('balcony', 'balcony', 'balcón', 'sacada', 'Balkon', '[阳台|yáng tái]', 'バルコニー', 'mfm'),
    W('toad', 'toad', 'sapo', 'sapo', 'Kröte', '[癞蛤蟆|lài há ma]', 'ヒキガエル', 'mmf'),
    W('iris', 'iris', 'lirio', 'íris', 'Schwertlilie', '[鸢尾花|yuān wěi huā]', 'アヤメ', 'mff', PL('lirios', 'íris', 'Schwertlilien')),
    W('apology', 'apology', 'disculpa', 'desculpa', 'Entschuldigung', '[道歉|dào qiàn]', 'おわび', 'fff'),
    W('smile', 'smile', 'sonrisa', 'sorriso', 'Lächeln', '[微笑|wēi xiào]', '[笑顔|えがお]', 'fmn'),
    W('joke', 'joke', 'broma', 'brincadeira', 'Scherz', '[玩笑|wán xiào]', '[冗談|じょうだん]', 'ffm'),
    W('shout', 'shout', 'grito', 'grito', 'Schrei', '[喊声|hǎn shēng]', '[叫|さけ]び', 'mmm'),
    W('glow', 'glow', 'resplandor', 'brilho', 'Schein', '[光芒|guāng máng]', '[輝|かがや]き', 'mmm'),
    W('host', 'host', 'anfitriona', 'anfitriã', 'Gastgeberin', '[主人|zhǔ rén]', '[主催者|しゅさいしゃ]', 'fff'),
    W('pale', 'pale', 'pálido', 'pálido', 'blass', '[苍白|cāng bái]', '[青白|あおじろ]い'),
    W('garland', 'garland', 'guirnalda', 'guirlanda', 'Girlande', '[彩带|cǎi dài]', '[飾|かざ]り', 'fff', PL('guirnaldas', 'guirlandas', 'Girlanden')),
    W('funnel', 'funnel', 'embudo', 'funil', 'Trichter', '[漏斗|lòu dǒu]', 'じょうご', 'mmm'),
    W('rag', 'rag', 'trapo', 'pano', 'Lappen', '[抹布|mā bù]', 'ぞうきん', 'mmm', PL('trapos', 'panos', 'Lappen')),
    W('cotton', 'cotton', 'algodón', 'algodão', 'Baumwolle', '[棉花|mián hua]', '[綿|わた]', 'mmf'),
    W('cloth', 'cloth', 'paño', 'tecido', 'Tuch', '[布|bù]', '[布|ぬの]', 'mmn', PL('paños', 'tecidos', 'Tücher')),
    W('sill', 'windowsill', 'alféizar', 'parapeito', 'Fensterbank', '[窗台|chuāng tái]', '[窓台|まどだい]', 'mmf'),
    W('step', 'step', 'escalón', 'degrau', 'Stufe', '[台阶|tái jiē]', '[段|だん]', 'mmf', PL('escalones', 'degraus', 'Stufen')),
    W('landing', 'landing', 'rellano', 'patamar', 'Treppenabsatz', '[楼梯平台|lóu tī píng tái]', '[踊|おど]り[場|ば]', 'mmm'),
    W('soot', 'soot', 'hollín', 'fuligem', 'Ruß', '[烟灰|yān huī]', 'すす', 'mfm'),
    W('handle', 'handle', 'asa', 'alça', 'Griff', '[把手|bǎ shou]', '[取|と]っ[手|て]', 'ffm'),
    W('string', 'string', 'cordel', 'barbante', 'Schnur', '[细绳|xì shéng]', 'ひも', 'mmf'),
    W('bamboo', 'bamboo', 'bambú', 'bambu', 'Bambus', '[竹子|zhú zi]', '[竹|たけ]', 'mmm'),
    W('crowd', 'crowd', 'multitud', 'multidão', 'Menge', '[人群|rén qún]', '[人|ひと]だかり', 'fff'),
    W('nervous', 'nervous', 'nervioso', 'nervoso', 'nervös', '[紧张|jǐn zhāng]', '[緊張|きんちょう]した'),
    W('steady', 'steady', 'firme', 'firme', 'ruhig', '[稳|wěn]', 'しっかりした'),
    W('oillamp', 'oil lamp', 'lámpara de aceite', 'lamparina a óleo', 'Öllampe', '[油灯|yóu dēng]', '[石油|せきゆ] ランプ', 'fff', PL('lámparas de aceite', 'lamparinas a óleo', 'Öllampen')),
    W('joy', 'joy', 'alegría', 'alegria', 'Freude', '[快乐|kuài lè]', '[喜|よろこ]び', 'fff'),
    W('iron', 'iron', 'hierro', 'ferro', 'Eisen', '[铁|tiě]', '[鉄|てつ]', 'mmn'),
    W('mothdust', 'moth dust', 'polvo de polilla', 'pó de mariposa', 'Mottenstaub', '[蛾粉|é fěn]', '[鱗粉|りんぷん]', 'mmm'),
    W('courage', 'courage', 'coraje', 'coragem', 'Mut', '[勇气|yǒng qì]', '[勇気|ゆうき]', 'mfm'),
    W('tradition', 'tradition', 'tradición', 'tradição', 'Brauch', '[传统|chuán tǒng]', '[伝統|でんとう]', 'ffm'),
    W('beginning', 'beginning', 'principio', 'começo', 'Anfang', '[开头|kāi tóu]', '[最初|さいしょ]', 'mmm'),
    W('tissuepaper', 'tissue paper', 'papel de seda', 'papel de seda', 'Seidenpapier', '[薄纸|báo zhǐ]', '[和紙|わし]', 'mmn'),
    W('farewell', 'farewell', 'despedida', 'despedida', 'Abschied', '[告别|gào bié]', '[別|わか]れ', 'ffm'),
    W('basket', 'basket', 'canasta', 'cesto', 'Korb', '[篮子|lán zi]', 'かご', 'fmm'),
    W('loneliness', 'loneliness', 'soledad', 'solidão', 'Einsamkeit', '[孤独|gū dú]', '[孤独|こどく]', 'fff'),
    W('friendship', 'friendship', 'amistad', 'amizade', 'Freundschaft', '[友谊|yǒu yì]', '[友情|ゆうじょう]', 'fff'),
    W('pride', 'pride', 'orgullo', 'orgulho', 'Stolz', '[骄傲|jiāo ào]', '[誇|ほこ]り', 'mmm'),
    W('shyness', 'shyness', 'timidez', 'timidez', 'Schüchternheit', '[害羞|hài xiū]', '[内気|うちき]', 'fff'),
    W('astonishment', 'astonishment', 'asombro', 'espanto', 'Staunen', '[惊讶|jīng yà]', '[驚|おどろ]き', 'mmn'),
    W('fullmoon', 'full moon', 'luna llena', 'lua cheia', 'Vollmond', '[满月|mǎn yuè]', '[満月|まんげつ]', 'ffm'),
    W('shootingstar', 'shooting star', 'estrella fugaz', 'estrela cadente', 'Sternschnuppe', '[流星|liú xīng]', '[流|なが]れ[星|ぼし]', 'fff'),
    // the land long ago (time_marsh_land.js's Looks): the clear lake, its banks, what lives there
    W('reedbed', 'reed bed', 'juncal', 'juncal', 'Röhricht', '[芦苇丛|lú wěi cóng]', '[葦原|あしはら]', 'mmn'),
    W('willowbranch', 'willow branch', 'rama de sauce', 'galho de salgueiro', 'Weidenzweig', '[柳枝|liǔ zhī]', '[柳|やなぎ] の [枝|えだ]', 'fmm'),
    W('weepingwillow', 'weeping willow', 'sauce llorón', 'chorão', 'Trauerweide', '[垂柳|chuí liǔ]', 'シダレヤナギ', 'mmf', PL('sauces llorones', 'chorões', 'Trauerweiden')),
    W('wildflower', 'wildflower', 'flor silvestre', 'flor silvestre', 'Wildblume', '[野花|yě huā]', '[野|の] の [花|はな]', 'fff', PL('flores silvestres', 'flores silvestres', 'Wildblumen')),
    W('transparent', 'see-through', 'transparente', 'transparente', 'durchsichtig', '[透明|tòu míng]', '[透明|とうめい]な'),
    W('canoe', 'canoe', 'canoa', 'canoa', 'Kanu', '[独木舟|dú mù zhōu]', 'カヌー', 'ffn'),
    W('cricket', 'cricket', 'grillo', 'grilo', 'Grille', '[蟋蟀|xī shuài]', 'コオロギ', 'mmf', PL('grillos', 'grilos', 'Grillen')),
    W('morninglight', 'morning light', 'luz de la mañana', 'luz da manhã', 'Morgenlicht', '[晨光|chén guāng]', '[朝|あさ] の [光|ひかり]', 'ffn'),
    W('lakeshore', 'lakeshore', 'orilla del lago', 'margem do lago', 'Seeufer', '[湖边|hú biān]', '[湖|みずうみ] の ほとり', 'ffn'),
    W('duckweed', 'duckweed', 'lenteja de agua', 'lentilha-d’água', 'Wasserlinse', '[浮萍|fú píng]', 'ウキクサ', 'fff'),
  ];

  // ------------------------------------------------------------ the language packs (marsh_text_pt.js … _ja.js): MHPTXT.add(lang, pack)
  // pack: { CAST, LINES, DEMO, FIGHT, NAMES: { key: text }, LORE: text, MARKS: { key: [...] }, CARDS: { key: { ex, note } },
  //         TIPS: { kind: text }, SPECIES: {...}, TASKS: { key: { frame, chips, model, want, alt, tense, shift, … } }, MEM: { key: { frame, model, more } } }
  function add(l, pack) {
    if (!pack) return;
    const tabs = { CAST, LINES, DEMO, FIGHT, NAMES };
    for (const [tn, tab] of Object.entries(tabs)) for (const [k, t] of Object.entries(pack[tn] || {})) if (tab[k]) tab[k][l] = t; else console.warn('[marsh past] ' + l + ': no ' + tn + '.' + k);
    if (pack.LORE) LORE[l] = pack.LORE;
    for (const [k, m] of Object.entries(pack.MARKS || {})) (MARKS[k] || (MARKS[k] = {}))[l] = m;
    for (const [k, c] of Object.entries(pack.CARDS || {})) if (CARDS[k]) CARDS[k][l] = c;
    for (const [k, t] of Object.entries(pack.TIPS || {})) (TIPS[k] || (TIPS[k] = {}))[l] = t;
    if (pack.SPECIES) SPECIES[l] = pack.SPECIES;
    const field = (T0, f, v) => { if (f === 'model') { T0.model[l] = v; return; } if (f === 'tips') { for (const [kk, tt] of Object.entries(v)) { T0.tips = T0.tips || {}; (T0.tips[kk] || (T0.tips[kk] = {}))[l] = tt; } return; } (T0[f] || (T0[f] = {}))[l] = v; };
    for (const [k, P] of Object.entries(pack.TASKS || {})) { const T0 = TASKS[k]; if (!T0) { console.warn('[marsh past] ' + l + ': no task ' + k); continue; } for (const [f, v] of Object.entries(P)) field(T0, f, v); }
    for (const [k, P] of Object.entries(pack.MEM || {})) { const T0 = MEM[k]; if (!T0) { console.warn('[marsh past] ' + l + ': no memory ' + k); continue; } for (const [f, v] of Object.entries(P)) field(T0, f, v); }
  }
  return { CAST, LINES, DEMO, MARKS, CARDS, TIPS, TASKS, MEM, ROOMS, FIGHT, SPECIES, NAMES, LORE, WORDS, add };
})();
