'use strict';
// Xochi and the Día de Muertos, the festival for Spanish games (SIDES.md: a festival with a kid host, ending in a set piece
// against the Hush). es games only: everything is parked away, silent and without prompts in every other language.
//
// WHO: Xóchitl «Xochi», nine, a girl from a Mexican family in Alba: braids with magenta ribbons, a cempasúchil behind her
// ear, an embroidered blouse, and a little red wagon full of marigolds by the bell tower. Full of her family's traditions
// and of questions about the past («¿Sabías que…?», «¡Qué padre!»). Her great-grandmother Esperanza Ríos came to Alba from
// Oaxaca long ago, planted the first cempasúchil here and cut papel picado for the whole village; she lies in the cemetery
// (her grave by the gate is the only one with fresh flowers: her family says her name every year, so the Hush can't fade it).
// Xochi never met her. Her grandmother Luz, «la abuela Lucha», Esperanza's daughter, cuts papel picado next to the wagon.
// The theme fits the game: the Hush erases names and words; the Day of the Dead is about saying the names of the people
// you remember. Warm, colorful remembrance, never a "Mexican Halloween".
// WHERE: Xochi at the shared kid spot by the bell tower (−22.5, −169.1); the village ofrenda on the plaza's north-west
// corner, facing the fountain; Esperanza's grave inside the cemetery gate; on the night, a cempasúchil petal path from her
// grave down the brick road, through the north gate and the north street, to the ofrenda.
// CHAPTERS (gated like every side character: Rosa's welcome, the big Hushling, bells 1, 2, 3):
//   1 La ofrenda: what goes on it and why (cempasúchil, velas, pan de muerto, papel picado, foto, agua, sal, her favorite
//     things); then build it by telling Mimo where each thing goes (al lado de, encima de, debajo de, entre… y…, delante de)
//   2 Pan de muerto y papel picado: the recipe with Marta the baker (infinitives → orders to Mimo: mezcla, añade, haz,
//     pon…), tasting it («Sabe a naranja», «Huele a mantequilla»); then papel picado with abuela Lucha (dobla, corta, abre:
//     your own design, in your color, hung on the ofrenda)
//   3 Calaveritas literarias: playful rhymes where la Calaca comes for Alba's people; say the last lines, finish the rhymes
//     (any word that rhymes counts), one for Xochi; they go up on a board by the ofrenda; a sugar skull with Mimo's name
//   4 Recuerdos: interview Alba's elders about the people in the cemetery (cemetery.js PEOPLE: Andrés, Lorenzo, Sofía, the
//     Gil twins, Aurora; and Esperanza): ask «¿Cómo era…?», «¿Qué le gustaba?», write a memory in the imperfect (era,
//     tenía, le gustaba, hacía…); their photos and favorite things join the ofrenda
//   5 La noche: the petal path from the cemetery; night falls; the Hush comes to erase the names on the photos; you say each
//     name and a memory («Se llamaba Andrés. Era muy alegre.») and the photos, candles and petals glow back; warm lights,
//     the visitors, come down the path; the band plays; Mimo gets a cempasúchil crown. «¡Feliz Día de Muertos!»
// API: MUERTOS.init(game) · MUERTOS.build(scene, env) → { colliders, group, people, update } · MUERTOS.hatOn() (main.js: the
// straw hat steps aside for the crown) · MUERTOS.mapMark(dpr) (minimap.js) · MUERTOS.quest() · MUERTOS._ (tests: ._.t).
// State: G.state.mu. Phrases: ph.mu.*. Song: 'mu_cempasuchil'. Panels: muertos_ui.js (MUI). Needs THREE (r128), core.js,
// toonkit.js, zhfolk.js (its 3D kit, person rig and music deck), icons.js, lexicon.js; UI, STORY, QUESTS, SIGNS at run time.

const MUERTOS = (() => {
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const esc = s => MUI.esc(s);
  let G = null, B = null;
  const S = () => { const s = G.state; if (!s.mu) s.mu = {}; const o = s.mu; o.ch = o.ch || {}; o.placed = o.placed || {}; o.cal = o.cal || {}; o.iv = o.iv || {}; return o; };
  const shown = () => !!(G && G.state && G.state.lang === 'es' && G.state.flags && G.state.flags.hatched);
  const flags = () => (G && G.state && G.state.flags) || {};
  const mimo = () => (G && G.state && G.state.mimoName) || 'Mimo';
  const sub = s => String(s).split('{mimo}').join(mimo());

  // ================================================================ the places
  // the ofrenda faces the fountain from the plaza's north-west corner (between Bruno's yard fence and the blue house)
  const SPOT = { kid: { x: -22.5, z: -169.1, yaw: 0.9 }, wagon: { x: -25.0, z: -169.6, yaw: 0.3 }, lucha: { x: -23.9, z: -170.9, yaw: Math.PI / 2 }, table: { x: -23.1, z: -170.9, yaw: Math.PI / 2 },
    alt: { x: -18.9, z: -157.3, yaw: 0.656 }, grave: { x: -60.5, z: -261.4, yaw: Math.PI }, plaza: { x: -10, z: -146 },
    you: { x: -14.6, z: -151.6 }, board: { x: -16.3, z: -158.9, yaw: 0.35 } };
  const ALT = (() => { const a = SPOT.alt, c = Math.cos(a.yaw), s = Math.sin(a.yaw); return { R: { x: c, z: -s }, F: { x: s, z: c }, at: (lx, lz) => ({ x: a.x + lx * c + lz * s, z: a.z - lx * s + lz * c }) }; })();
  const FRONT = ALT.at(0, 2.6);         // where you stand to look at it
  // the petal path: Esperanza's grave → the cemetery gate → the brick road → the theater's square → the Old Quarter → the
  // north gate → the north street → the plaza → the foot of the ofrenda (cemetery.js ROADS, by hand)
  const PATH = [[-60.5, -262.7], [-59.2, -264.6], [-56, -265], [-53.4, -263.6], [-50.8, -260.4], [-47.4, -256.2], [-43, -251.4], [-39.4, -246], [-35.8, -240.2], [-31.4, -235.4],
    [-26.2, -232.2], [-21.2, -229.9], [-15.6, -226.4], [-10, -223], [-10.3, -217], [-10.6, -211], [-10.3, -205], [-9.7, -199], [-10, -193], [-10, -187.3], [-10, -180], [-10, -172],
    [-10, -164], [-10.4, -159.6], [-12.2, -158.3], [-14.6, -157.2], [-16.4, -156.1]];

  // ================================================================ the people we remember (cemetery.js PEOPLE, and Esperanza)
  // portrait: how their photo looks; mem: words a memory of them can use; fav: their favorite thing on the ofrenda
  const PEOPLE = {
    esperanza: { name: 'Esperanza Ríos', first: ['esperanza'], fem: true, skin: '#a8714a', hair: '#ebe7df', bun: true, shawl: '#2f7fa8', bg: '#f7d9a8', smile: 1,
      model: 'Se llamaba Esperanza. Le encantaba el chocolate.', modelEn: 'Her name was Esperanza. She loved chocolate.',
      mem: ['alegr', 'chocolat', 'papel', 'cempasuchil', 'flor', 'vecin', 'oaxaca', 'cort', 'ensen', 'plant', 'cant', 'simpatic', 'amabl'] },
    andres: { name: 'Andrés Vidal', first: ['andres', 'vidal'], skin: '#e6b48c', hair: '#6b4a2a', hat: '#e2c46a', bg: '#cfe8b0', mustache: true, fav: 'apple',
      role: 'the apple grower', elder: 'rosa', mem: ['alegr', 'alto', 'silb', 'manzan', 'regal', 'plant', 'arbol'],
      model: 'Se llamaba Andrés. Era muy alegre.', modelEn: 'His name was Andrés. He was very cheerful.' },
    lorenzo: { name: 'Lorenzo Paz', first: ['lorenzo', 'paz'], skin: '#dcae86', hair: '#3a2b26', bg: '#ead6b4', mustache: true, pencil: true, fav: 'chair',
      role: 'the carpenter', elder: 'otto', mem: ['callad', 'amabl', 'mader', 'silla', 'hacia', 'carpinter', 'teatro', 'banca'],
      model: 'Se llamaba Lorenzo. Hacía sillas preciosas.', modelEn: 'His name was Lorenzo. He made beautiful chairs.' },
    sofia: { name: 'Sofía Reyes', first: ['sofia', 'reyes'], fem: true, skin: '#c98e62', hair: '#2e2420', bun: true, glasses: true, bg: '#bfe0ea', fav: 'soup',
      role: 'the village doctor', elder: 'clara', mem: ['doctor', 'chistos', 'chiste', 'sopa', 'curab', 'reir', 'simpatic', 'medic', 'graciosa', 'gracioso'],
      model: 'Se llamaba Sofía. Era muy chistosa.', modelEn: 'Her name was Sofía. She was very funny.' },
    gil: { name: 'Ramona y Rufino Gil', first: ['ramona', 'rufino', 'gil'], plural: true, skin: '#e6b48c', hair: '#8a5a3a', bg: '#f0c8d0', twins: true, fav: 'shoes',
      role: 'the twin shoemakers', elder: 'fello', mem: ['gemel', 'discut', 'zapat', 'pele', 'herman'],
      model: 'Se llamaban Ramona y Rufino. Eran gemelos.', modelEn: 'Their names were Ramona and Rufino. They were twins.' },
    aurora: { name: 'Aurora Campos', first: ['aurora', 'campos'], fem: true, skin: '#f0c7a0', hair: '#6b3b25', bun: true, shawl: '#e8b83e', dress: '#5c4a7a', bg: '#e0d0f0', fav: 'music',
      role: 'the choir director', elder: 'tina', mem: ['elegant', 'estrict', 'cant', 'coro', 'dirig', 'teatro', 'music'],
      model: 'Se llamaba Aurora. Le encantaba cantar.', modelEn: 'Her name was Aurora. She loved singing.' },
  };
  const ROW = ['andres', 'lorenzo', 'sofia', 'gil', 'aurora'];
  // the imperfect (and a couple of past forms) a memory may use; the present a learner may slip into, with its fix
  const IMPF = ['era', 'eran', 'tenia', 'tenian', 'gustaba', 'gustaban', 'encantaba', 'encantaban', 'hacia', 'hacian', 'vivia', 'vivian', 'tocaba', 'cantaba', 'curaba', 'plantaba',
    'regalaba', 'silbaba', 'discutian', 'peleaban', 'dirigia', 'cortaba', 'trabajaba', 'cocinaba', 'ensenaba', 'olia', 'estaba', 'iba', 'queria', 'llamaba', 'llamaban', 'sabia', 'decia', 'hablaba', 'reia', 'jugaba', 'cosia', 'horneaba', 'traia'];
  const PRES = { es: 'era', son: 'eran', tiene: 'tenía', le_gusta: 'le gustaba', le_gustan: 'le gustaban', le_encanta: 'le encantaba', le_encantan: 'le encantaban', hace: 'hacía', vive: 'vivía', toca: 'tocaba', canta: 'cantaba', se_llama: 'se llamaba', se_llaman: 'se llamaban' };
  const presentSlip = t => { const n = ' ' + MUI.N(t) + ' '; for (const [k, v] of Object.entries(PRES)) if (n.includes(' ' + k.replace('_', ' ') + ' ')) return `In the past: ${k.replace('_', ' ')} → <b>${v}</b>`; return null; };
  const hasImpf = t => { const w = MUI.N(t).split(' '); return IMPF.some(v => w.includes(v)); };
  const memHit = (t, list) => { const w = MUI.N(t).split(' '); return w.some(x => list.some(k => x.startsWith(k))); };

  // ================================================================ the Phrasebook (LEX kind 'phrase', es)
  const R_MU = 'México · Día de Muertos';
  const PH = [
    { id: 'ph.mu.ofrenda', es: 'la ofrenda', en: 'the Day of the Dead altar', keys: ['ofrenda'], note: 'Photos, candles, flowers, food and the person’s favorite things, on levels. In Mexico it’s set up at home, at school, even in town squares.' },
    { id: 'ph.mu.cempasuchil', es: 'el cempasúchil', en: 'the Mexican marigold', keys: ['cempasuchil', 'cempasuchitl', 'flor de muerto', 'flor de cempasuchil'], note: 'The flower of the dead: its color and scent guide the visitors. From Nahuatl cempōhualxōchitl, “twenty flower”, for its many petals.' },
    { id: 'ph.mu.vela', es: 'la vela', en: 'the candle', keys: ['vela', 'velas', 'veladora', 'velita'], note: 'Candles light the way home.' },
    { id: 'ph.mu.pan', es: 'el pan de muerto', en: 'the bread of the dead', keys: ['pan de muerto', 'pan de muertos'], note: 'A sweet round bread with “little bones” of dough on top. Many bakers flavor it with orange blossom.' },
    { id: 'ph.mu.papel', es: 'el papel picado', en: 'cut paper banners', keys: ['papel picado'], note: 'Thin colored paper cut into shapes and hung in strings. It dances in the wind.' },
    { id: 'ph.mu.foto', es: 'la foto', en: 'the photo', keys: ['foto', 'fotos', 'fotografia', 'retrato'], note: 'The person’s photo goes up top, where everyone can see it.' },
    { id: 'ph.mu.agua', es: 'el agua', en: 'the water', keys: ['agua', 'vaso de agua'], note: '«El agua»: it’s feminine, but takes «el». The visitors come a long way, so they arrive thirsty.' },
    { id: 'ph.mu.sal', es: 'la sal', en: 'the salt', keys: ['sal'], note: 'Many families put out a little salt: they say it purifies.' },
    { id: 'ph.mu.allado', es: 'al lado de…', en: 'next to…', keys: ['al lado de', 'al lado del'], note: 'de + el = del: «al lado del pan». Also «junto a…».' },
    { id: 'ph.mu.encima', es: 'encima de…', en: 'on top of… / above…', keys: ['encima de', 'encima del'], note: '«sobre» works too: «sobre la mesa».' },
    { id: 'ph.mu.debajo', es: 'debajo de…', en: 'under… / below…', keys: ['debajo de', 'debajo del'], note: '«abajo de» is common in Mexico too.' },
    { id: 'ph.mu.entre', es: 'entre… y…', en: 'between… and…', keys: ['entre'], note: '«La foto está entre las dos velas.»' },
    { id: 'ph.mu.quepadre', es: '¡Qué padre!', en: 'How cool!', register: 'slang', keys: ['que padre', 'bien padre', 'padrisimo'], note: 'Mexican slang: «padre» (literally “father”) means great, cool. «¡Está bien padre!»: it’s really cool!' },
    { id: 'ph.mu.querico', es: '¡Qué rico!', en: 'How delicious!', keys: ['que rico', 'que rica', 'riquisimo', 'que sabroso'], note: 'For food (and drinks): «¡Qué rico pan!»' },
    { id: 'ph.mu.sabea', es: 'Sabe a naranja.', en: 'It tastes like orange.', keys: ['sabe a'], note: 'saber a + a flavor. «¿A qué sabe?»: what does it taste like?' },
    { id: 'ph.mu.huelea', es: 'Huele a mantequilla.', en: 'It smells like butter.', keys: ['huele a'], note: 'oler a + a smell (o → hue: huele). «¿A qué huele?»: what does it smell like?' },
    { id: 'ph.mu.quedo', es: '¡Quedó precioso!', en: 'It turned out beautiful!', keys: ['quedo precioso', 'quedo preciosa', 'quedo bonito', 'quedo bonita', 'quedo lindo', 'quedo padre', 'quedo hermoso'], note: 'quedar: how something turned out. «¿Cómo te quedó?»: how did yours turn out?' },
    { id: 'ph.mu.calaverita', es: 'una calaverita', en: 'a calaverita: a funny Day of the Dead rhyme', keys: ['calaverita', 'calaveritas'], note: 'Short rhymes where Death comes for someone who’s alive… and something funny happens. Kids write them at school; newspapers print them. It’s also a sugar skull.' },
    { id: 'ph.mu.calaca', es: 'la Calaca', en: 'Death (a playful nickname)', keys: ['calaca'], register: 'slang', note: 'Mexican Spanish has cheeky names for Death: la Calaca, la Flaca, la Huesuda (“the Bony One”), la Pelona (“the Bald One”).' },
    { id: 'ph.mu.concarino', es: 'con cariño', en: 'with love, affectionately', keys: ['con carino'], note: 'Calaveritas tease, but always «con cariño».' },
    { id: 'ph.mu.comoera', es: '¿Cómo era?', en: 'What was he / she like?', keys: ['como era', 'como eran'], note: 'era: the imperfect of ser, for describing people in the past. Two people: «¿Cómo eran?»', sit: 'You want to know what Andrés was like. Ask!' },
    { id: 'ph.mu.quelegustaba', es: '¿Qué le gustaba?', en: 'What did he / she like?', keys: ['que le gustaba', 'que les gustaba'], note: 'gustaba: the imperfect of gustar. Two people: «¿Qué les gustaba?»', sit: 'Ask what she liked.' },
    { id: 'ph.mu.leencantaba', es: 'Le encantaba el chocolate.', en: 'She loved chocolate.', keys: ['le encantaba', 'le encantaban'], note: 'encantar works like gustar, only stronger. Plural things: «le encantaban las manzanas».', sit: 'Tell Xochi her great-grandmother loved chocolate.' },
    { id: 'ph.mu.sellamaba', es: 'Se llamaba Esperanza.', en: 'Her name was Esperanza.', keys: ['se llamaba', 'se llamaban'], note: 'llamarse in the imperfect: what someone’s name was.', sit: 'Say that her name was Esperanza.' },
    { id: 'ph.mu.era', es: 'Era muy alegre.', en: 'He / She was very cheerful.', keys: ['era muy alegre', 'era alegre', 'era muy'], note: 'era + a word for what someone was like: alegre, amable, chistoso / chistosa, elegante, callado / callada…', sit: 'Say that he was very cheerful.' },
    { id: 'ph.mu.feliz', es: '¡Feliz Día de Muertos!', en: 'Happy Day of the Dead!', keys: ['feliz dia de muertos', 'feliz dia de los muertos'], note: 'Said on November 1st and 2nd. UNESCO lists the festival as intangible heritage of humanity.' },
    { id: 'ph.mu.bienvenidos', es: '¡Bienvenidos a casa!', en: 'Welcome home!', keys: ['bienvenidos a casa', 'bienvenidas a casa', 'bienvenidos'], note: 'For the visitors, on the night they come home.' },
    { id: 'ph.mu.recordamos', es: 'Siempre te recordamos.', en: 'We always remember you.', keys: ['siempre te recordamos', 'te recordamos'], note: 'You’ll see it on graves and ofrendas. recordar (o → ue): recuerdo, recuerdas… nosotros recordamos.' },
  ];
  PH.forEach(p => { p.register = p.register || 'casual'; p.region = R_MU; p.icon = p.icon || 'muFlor'; });
  const PHI = Object.fromEntries(PH.map(p => [p.id, p]));
  const nowS = () => Date.now() / 1000;
  function registerLex() {
    if (typeof LEX === 'undefined') return;
    LEX.register(PH.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', es: p.es, en: p.en, note: p.note, region: p.region, register: p.register, icon: p.icon, alt: { es: p.keys.slice() } })));
    if (!LEX.item('k.calaverita')) LEX.register([{ id: 'k.calaverita', kind: 'key', es: 'calaverita de azúcar', pt: 'caveirinha de açúcar', de: 'Zuckerschädel', en: 'Sugar skull', g: { es: 'f', pt: 'f', de: 'm' }, icon: 'muCalavera' }]);
  }
  // into the Phrasebook (stage 3), its LEX review pushed far off (Xochi's chapters are the practice)
  function teach(id) {
    if (typeof LEX === 'undefined' || !LEX.item(id) || LEX.lang !== 'es') return;
    const s = LEX.st(id), t = nowS(); LEX.expose(id);
    if (s.stage < 3) s.stage = 3;
    s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 30 * 86400; s.last = t;
  }
  const teachAll = ids => ids.forEach(teach);
  function keepFar() {
    if (typeof LEX === 'undefined' || LEX.lang !== 'es') return;
    const t = nowS();
    for (const p of PH) { if (!LEX.item(p.id)) continue; const s = LEX.st(p.id); if (s.stage >= 2 && s.due < t + 86400) { s.due = t + 30 * 86400; s.str = Math.max(s.str || 0, 30 * 86400); } }
  }
  const item = id => Object.assign({ sit: PHI[id].sit || PHI[id].en }, PHI[id]);

  // ================================================================ what they say: [Spanish, English] (A1–A2 early, B1 by the night;
  // nobody genders the player: «la persona nueva», «quien llegó en el tren»)
  const LT = {
    'x.hi': ['¡Hola! ¿Tú eres la persona nueva del pueblo?', 'Hi! Are you the new person in town?'],
    'x.name': ['Me llamo Xóchitl, pero todos me dicen Xochi. ¡Quiere decir «flor»!', 'My name is Xóchitl, but everybody calls me Xochi. It means “flower”!'],
    'x.nahuatl': ['Es una palabra en náhuatl, una lengua muy antigua de México.', 'It’s a word in Nahuatl, a very old language from Mexico.'],
    'x.soon': ['¿Sabías? ¡Ya casi es el Día de Muertos!', 'Guess what? It’s almost the Day of the Dead!'],
    'x.notscary': ['¿Miedo? ¡No! Es una fiesta muy bonita, con flores, música y pan.', 'Spooky? No! It’s a beautiful celebration, with flowers, music and bread.'],
    'x.remember': ['Recordamos a las personas que ya no están. Ponemos sus fotos, sus cosas favoritas… y decimos sus nombres.', 'We remember the people who are gone. We put out their photos, their favorite things… and we say their names.'],
    'x.bisa': ['Mi bisabuela Esperanza está en el cementerio. Yo no la conocí… pero mi abuela me cuenta todo de ella.', 'My great-grandma Esperanza is in the cemetery. I never met her… but my grandma tells me everything about her.'],
    'x.plan': ['Este año quiero hacer una ofrenda grande, en la plaza. ¡Para todo Alba!', 'This year I want to make a big ofrenda, in the plaza. For all of Alba!'],
    'x.hush': ['El Silencio borra los nombres… pero si los decimos en voz alta, no puede.', 'The Hush erases names… but if we say them out loud, it can’t.'],
    'x.wagon': ['Mira mi carretita. ¡Traigo todo para la ofrenda!', 'Look at my little wagon. I brought everything for the ofrenda!'],
    'x.build': ['Ahora la armamos. Tú le dices a {mimo} dónde va cada cosa, ¿sí?', 'Now let’s put it together. You tell {mimo} where each thing goes, OK?'],
    'x.photo': ['Primero, la foto de mi bisabuela. Va arriba, en el centro.', 'First, my great-grandma’s photo. It goes up top, in the middle.'],
    'x.done1': ['¡Quedó preciosa! Mira: la foto está entre las dos velas. ¡Qué padre!', 'It turned out beautiful! Look: the photo is between the two candles. How cool!'],
    'x.wait': ['¡Todavía no! Estoy preparando todo. Ve a tu aventura y luego vuelves, ¿sí?', 'Not yet! I’m getting everything ready. Go on your adventure and come back later, OK?'],
    'x.ch2': ['¡Hoy hacemos pan de muerto con Marta! ¡Y papel picado con mi abuela!', 'Today we make pan de muerto with Marta! And papel picado with my grandma!'],
    'm.hi': ['¡Xochi! ¿Ya es tiempo de pan de muerto?', 'Xochi! Is it pan de muerto time already?'],
    'm.recipe': ['Esta receta era de Doña Esperanza. Mi abuela la aprendió de ella.', 'This recipe was Doña Esperanza’s. My grandma learned it from her.'],
    'm.read': ['Yo leo la receta y tú le dices a {mimo} qué hacer. ¡Pero dilo como una orden!', 'I’ll read the recipe, and you tell {mimo} what to do. But say it like an order!'],
    'm.oven': ['¡Al horno! Ahora, a esperar… ¡Ay, qué olor!', 'Into the oven! Now we wait… Oh, that smell!'],
    'm.try': ['Ya está. Pruébalo. ¿Cómo está?', 'It’s ready. Try it. How is it?'],
    'm.secret': ['El secreto es el azahar: la flor del naranjo. Por eso sabe a naranja.', 'The secret is orange blossom: the flower of the orange tree. That’s why it tastes like orange.'],
    'm.bye': ['Uno para la ofrenda… ¡y otro para ustedes!', 'One for the ofrenda… and another one for you two!'],
    'l.hi': ['¡Ay, mi niña! ¿Quién te acompaña hoy?', 'Oh, my girl! Who’s with you today?'],
    'l.me': ['Yo soy Luz, la abuela de Xochi. Pero todos me dicen Lucha.', 'I’m Luz, Xochi’s grandma. But everybody calls me Lucha.'],
    'l.mama': ['Mi mamá, Esperanza, me enseñó a hacer papel picado. ¡Y ahora te enseño yo!', 'My mother, Esperanza, taught me to make papel picado. And now I’ll teach you!'],
    'l.hang': ['Lo colgamos en la ofrenda. A mi mamá le encantaría.', 'We’ll hang it on the ofrenda. My mother would love it.'],
    'x.done2': ['¡El pan, el papel picado…! ¡La ofrenda está cada vez más bonita!', 'The bread, the papel picado…! The ofrenda gets prettier and prettier!'],
    'x.cal1': ['¡Es tiempo de calaveritas! Son versos chistosos para el Día de Muertos.', 'It’s calaverita time! They’re funny verses for the Day of the Dead.'],
    'x.cal2': ['En cada calaverita, la Calaca viene por alguien… pero siempre pasa algo gracioso.', 'In every calaverita, la Calaca (Death) comes for someone… but something funny always happens.'],
    'x.cal3': ['No son tristes ni malas. ¡Son con cariño! Hasta salen en los periódicos.', 'They’re not sad or mean. They’re written with love! They even come out in the newspapers.'],
    'x.cal6': ['¡Las ponemos junto a la ofrenda, para que todo Alba se ría!', 'We’ll put them up next to the ofrenda, so all of Alba can laugh!'],
    'x.calYou': ['Y yo escribí una para ti. ¡Escucha!', 'And I wrote one for you. Listen!'],
    'x.sugar': ['Toma: una calaverita de azúcar con el nombre de {mimo}. ¡Es un regalo!', 'Here: a sugar skull with {mimo}’s name on it. It’s a present!'],
    'x.r1': ['Mi abuela dice que los recuerdos son como el pan: hay que compartirlos.', 'My grandma says memories are like bread: you have to share them.'],
    'x.r2': ['Quiero poner más fotos en la ofrenda. Pero no conozco a la gente del cementerio…', 'I want to put more photos on the ofrenda. But I don’t know the people in the cemetery…'],
    'x.r3': ['¿Me ayudas? Pregúntales a los mayores de Alba. Ellos sí se acuerdan.', 'Will you help me? Ask Alba’s older folks. They remember.'],
    'x.r5': ['Toma mi libreta de recuerdos. ¡Escribe todo!', 'Take my memory notebook. Write everything down!'],
    'x.rwho': ['Doña Rosa, Don Otto, Doña Clara, Don Fello… y Doña Tina, en el barrio viejo.', 'Doña Rosa, Don Otto, Doña Clara, Don Fello… and Doña Tina, in the Old Quarter.'],
    'x.rbisa': ['¿Y mi bisabuela? ¿Qué te dijo Doña Tina? ¿Cómo era?', 'And my great-grandma? What did Doña Tina tell you? What was she like?'],
    'x.rdone': ['¡Ahora la ofrenda es de todo Alba!', 'Now the ofrenda belongs to all of Alba!'],
    'x.n1': ['¡Hoy es la noche! Esta noche vienen las visitas.', 'Tonight’s the night! Tonight the visitors come.'],
    'x.n2': ['Vamos a hacer el camino de pétalos, del cementerio a la plaza. ¡Para que encuentren el camino!', 'Let’s make the petal path, from the cemetery to the plaza. So they can find their way!'],
    'l.n3': ['Y si viene el Silencio, decimos sus nombres. Con un recuerdo. Así: «Se llamaba Esperanza. Le encantaba el chocolate.»', 'And if the Hush comes, we say their names. With a memory. Like this: “Her name was Esperanza. She loved chocolate.”'],
    'x.grave': ['Hola, bisabuela. Esta noche te esperamos en la plaza.', 'Hi, great-grandma. Tonight we’ll be waiting for you in the plaza.'],
    'x.ready': ['Ya está todo. Ahora… a esperar a las visitas.', 'Everything’s ready. Now… we wait for the visitors.'],
    'x.uhoh': ['¿Qué es eso? ¡Los nombres… se están borrando!', 'What’s that? The names… they’re fading!'],
    'x.esperanza': ['¡Mi bisabuela! ¡Mira, abuela, su nombre brilla!', 'My great-grandma! Look, grandma, her name is shining!'],
    'l.quick': ['¡Rápido! ¡Digan sus nombres! ¡Con un recuerdo!', 'Quick! Say their names! With a memory!'],
    'x.won': ['¡Se fue! ¡El Silencio se fue!', 'It’s gone! The Hush is gone!'],
    'l.visitas': ['Miren… ya llegaron. Bienvenidos a casa.', 'Look… they’re here. Welcome home.'],
    'x.thanks': ['Gracias por decir sus nombres. Ahora nadie los va a olvidar.', 'Thank you for saying their names. Now nobody will forget them.'],
    'x.crown': ['{mimo}, esto es para ti: una corona de cempasúchil. ¡Para que siempre encuentres el camino!', '{mimo}, this is for you: a cempasúchil crown. So you always find your way!'],
    'x.feliz': ['¡Feliz Día de Muertos!', 'Happy Day of the Dead!'],
    'x.idle1': ['¿Sabías que el cempasúchil tiene muchísimos pétalos? ¡Yo conté cien!', 'Did you know a cempasúchil has tons of petals? I counted a hundred!'],
    'x.idle2': ['¿Sabías que en Oaxaca el pan de muerto tiene caritas pintadas? ¡Mi bisabuela era de allá!', 'Did you know that in Oaxaca pan de muerto has little painted faces? My great-grandma was from there!'],
    'x.idle3': ['¿Cómo era Alba antes? ¿Había más flores? ¿Más música? ¡Quiero saber todo!', 'What was Alba like before? Were there more flowers? More music? I want to know everything!'],
    'x.idle4': ['Mi abuela dice que nadie se va del todo si alguien dice su nombre.', 'My grandma says nobody is really gone if someone says their name.'],
    'x.idle5': ['¡Qué padre fue la noche! ¿Viste las lucecitas? Yo creo que una era mi bisabuela.', 'The night was so cool! Did you see the little lights? I think one of them was my great-grandma.'],
    'l.idle1': ['Dobla, corta, abre… y con paciencia, mija.', 'Fold, cut, open… and with patience, sweetie.'],
    'l.idle2': ['Mi mamá cortaba papel picado para todo el pueblo. Yo tenía tu edad… bueno, la de Xochi.', 'My mother cut papel picado for the whole village. I was your age… well, Xochi’s age.'],
  };
  const lineOf = key => { const L = LT[key] || [key, key]; return { es: sub(L[0]), en: sub(L[1]) }; };

  // ================================================================ icons (paper cutouts, like every word picture)
  function registerIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const has = k => ICONS.keys.includes(k);
    const marigold = (c, p, h, x, y, r) => { for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; h.shape(c, p, h.ell(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.45, r * 0.45), i % 2 ? '#f39a1e' : '#f7b52c', 1.4); } h.shape(c, p, h.ell(x, y, r * 0.5, r * 0.5), '#f5a623', 1.4); if (p) for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; h.dot(c, x + Math.cos(a) * r * 0.26, y + Math.sin(a) * r * 0.26, r * 0.1, '#d9770f'); } };
    if (!has('muFlor')) ICONS.add('muFlor', (c, p, h) => { h.shape(c, p, h.rr(-2, 4, 4, 32, 2), '#3f8a3a'); h.shape(c, p, h.ell(10, 24, 10, 4, -0.5), '#4c9a40'); h.shape(c, p, h.ell(-10, 18, 9, 4, 0.5), '#4c9a40'); marigold(c, p, h, 0, -10, 26); });
    if (!has('muKid')) ICONS.add('muKid', (c, p, h) => {
      for (const s of [-1, 1]) { h.shape(c, p, h.rr(s * 22 - 5, -2, 10, 34, 5), '#1f1a18'); h.shape(c, p, h.ell(s * 22, 34, 6, 4), '#e2337f'); }
      h.shape(c, p, h.ell(0, 4, 26, 28), '#b9825a');
      h.shape(c, p, cc => { cc.moveTo(-28, 2); cc.bezierCurveTo(-30, -40, 30, -40, 28, 2); cc.quadraticCurveTo(14, -14, 0, -18); cc.quadraticCurveTo(-14, -14, -28, 2); cc.closePath(); }, '#1f1a18');
      if (!p) return; marigold(c, 1, h, 22, -20, 11);
      h.eyes(c, -9, 9, 4); h.dot(c, -16, 14, 4.5, 'rgba(255,120,150,0.55)'); h.dot(c, 16, 14, 4.5, 'rgba(255,120,150,0.55)');
      c.beginPath(); c.arc(0, 14, 7, 0.15, Math.PI - 0.15); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke();
      [-12, -4, 4, 12].forEach((x, i) => h.dot(c, x, 33, 2.4, ['#e2337f', '#f39a1e', '#1fa3a0', '#7b4bb0'][i]));
    });
    if (!has('muLucha')) ICONS.add('muLucha', (c, p, h) => {
      h.shape(c, p, h.ell(0, -30, 13, 10), '#ebe7df');
      h.shape(c, p, cc => { cc.moveTo(-34, 40); cc.quadraticCurveTo(-30, 14, 0, 16); cc.quadraticCurveTo(30, 14, 34, 40); cc.closePath(); }, '#2f7fa8');
      h.shape(c, p, h.ell(0, 0, 24, 26), '#a8714a');
      h.shape(c, p, cc => { cc.moveTo(-26, -2); cc.bezierCurveTo(-28, -34, 28, -34, 26, -2); cc.quadraticCurveTo(0, -20, -26, -2); cc.closePath(); }, '#ebe7df');
      if (!p) return; for (const s of [-1, 1]) { c.beginPath(); c.arc(s * 9, 0, 6.5, 0, TAU); c.lineWidth = 1.8; c.strokeStyle = h.INK; c.stroke(); h.dot(c, s * 9, 0, 2.4, h.INK); }
      c.beginPath(); c.arc(0, 10, 6, 0.2, Math.PI - 0.2); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke();
      for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(-28 + i * 14, 24); c.lineTo(-24 + i * 14, 38); c.lineWidth = 2; c.strokeStyle = i % 2 ? '#f5c518' : '#e2337f'; c.stroke(); }
    });
    if (!has('muVela')) ICONS.add('muVela', (c, p, h) => { h.shape(c, p, h.rr(-11, -8, 22, 42, 4), '#fbf3e0'); h.shape(c, p, cc => { cc.moveTo(0, -36); cc.quadraticCurveTo(12, -20, 0, -12); cc.quadraticCurveTo(-12, -20, 0, -36); cc.closePath(); }, '#ffb52e'); if (p) { h.dot(c, 0, -19, 3.5, '#fff3a0'); c.beginPath(); c.moveTo(0, -12); c.lineTo(0, -7); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke(); h.shape(c, 1, h.rr(-11, 18, 22, 6, 1), '#e2337f', 1.2); } });
    if (!has('muPan')) ICONS.add('muPan', (c, p, h) => {
      h.shape(c, p, cc => { cc.moveTo(-34, 16); cc.bezierCurveTo(-36, -26, 36, -26, 34, 16); cc.quadraticCurveTo(0, 24, -34, 16); cc.closePath(); }, '#d99a4e');
      if (!p) return; [[-26, 0, 22, -10], [-20, -12, 24, 4]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.lineWidth = 7; c.strokeStyle = '#a8673a'; c.stroke(); c.lineWidth = 2; c.strokeStyle = h.INK; });
      h.shape(c, 1, h.ell(0, -14, 8, 7), '#b97a3e', 1.6); for (let i = 0; i < 14; i++) h.dot(c, -26 + (i * 37) % 52, -4 + (i * 13) % 16, 1.4, '#fff8ec');
    });
    if (!has('muAgua')) ICONS.add('muAgua', (c, p, h) => { h.shape(c, p, h.poly([[-16, -28], [16, -28], [12, 30], [-12, 30]]), 'rgba(190,230,250,0.9)'); if (p) { h.shape(c, 1, h.poly([[-14, -10], [14, -10], [12, 28], [-12, 28]]), '#6cc3ea', 1.4); h.dot(c, -6, 6, 3, 'rgba(255,255,255,0.8)'); } });
    if (!has('muSal')) ICONS.add('muSal', (c, p, h) => { h.shape(c, p, cc => { cc.moveTo(-14, -6); cc.quadraticCurveTo(0, -30, 14, -6); cc.closePath(); }, '#ffffff'); h.shape(c, p, cc => { cc.moveTo(-30, -6); cc.lineTo(30, -6); cc.quadraticCurveTo(26, 24, 0, 24); cc.quadraticCurveTo(-26, 24, -30, -6); cc.closePath(); }, '#d96a3a'); if (p) [-10, 0, 10].forEach(x => h.dot(c, x, 8, 2.5, '#f5c518')); });
    if (!has('muChoco')) ICONS.add('muChoco', (c, p, h) => { h.shape(c, p, cc => { cc.arc(26, 2, 10, -1.4, 1.4); }, null); h.shape(c, p, h.rr(-24, -12, 46, 40, 8), '#2f9a8a'); h.shape(c, p, h.ell(-1, -12, 23, 6), '#6b3b1f'); if (p) { h.dot(c, -6, -13, 3, '#e8c9a0'); h.dot(c, 4, -12, 2.5, '#e8c9a0'); [-10, 6].forEach((x, i) => { c.beginPath(); c.moveTo(x, -20); c.bezierCurveTo(x - 6, -28, x + 6, -34, x, -42 - i * 2); c.lineWidth = 2.4; c.strokeStyle = 'rgba(43,34,53,0.45)'; c.stroke(); }); [-14, -2, 10].forEach(x => h.dot(c, x, 10, 3, '#f5c518')); } });
    if (!has('muFoto')) ICONS.add('muFoto', (c, p, h) => { h.shape(c, p, h.rr(-26, -32, 52, 64, 4), '#8a5f3e'); if (p) { h.shape(c, 1, h.rr(-19, -25, 38, 46, 2), '#f7d9a8', 1.4); h.shape(c, 1, h.ell(0, -6, 10, 12), '#a8714a', 1.4); h.shape(c, 1, cc => { cc.moveTo(-16, 21); cc.quadraticCurveTo(0, 4, 16, 21); cc.closePath(); }, '#2f7fa8', 1.4); h.shape(c, 1, h.ell(0, -17, 9, 5), '#ebe7df', 1.4); } });
    if (!has('muPapel')) ICONS.add('muPapel', (c, p, h) => {
      if (p) { c.beginPath(); c.moveTo(-40, -30); c.lineTo(40, -30); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke(); }
      h.shape(c, p, cc => { cc.moveTo(-26, -30); cc.lineTo(26, -30); cc.lineTo(26, 22); for (let k = 0; k < 4; k++) cc.quadraticCurveTo(26 - k * 13 - 6.5, 32, 26 - (k + 1) * 13, 22); cc.closePath(); }, '#e2337f');
      if (p) { h.dot(c, 0, -6, 7, '#fff8ec'); for (const s of [-1, 1]) { h.shape(c, 1, h.poly([[s * 14, -18], [s * 18, -12], [s * 14, -6], [s * 10, -12]]), '#fff8ec', 1); h.dot(c, s * 15, 10, 3, '#fff8ec'); } }
    });
    if (!has('muCalavera')) ICONS.add('muCalavera', (c, p, h) => {
      h.shape(c, p, cc => { cc.moveTo(-26, 8); cc.bezierCurveTo(-30, -36, 30, -36, 26, 8); cc.quadraticCurveTo(22, 18, 14, 20); cc.lineTo(14, 30); cc.lineTo(-14, 30); cc.lineTo(-14, 20); cc.quadraticCurveTo(-22, 18, -26, 8); cc.closePath(); }, '#fffdf6');
      if (!p) return;
      for (const s of [-1, 1]) { h.shape(c, 1, h.ell(s * 11, -4, 8, 8), '#1fa3a0', 1.4); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; h.dot(c, s * 11 + Math.cos(a) * 9.5, -4 + Math.sin(a) * 9.5, 2.4, s < 0 ? '#e2337f' : '#f39a1e'); } h.dot(c, s * 11, -4, 3, '#fff8ec'); }
      h.shape(c, 1, h.poly([[0, 4], [4, 11], [-4, 11]]), '#7b4bb0', 1.2);
      c.beginPath(); c.moveTo(-12, 22); c.lineTo(12, 22); c.lineWidth = 1.8; c.strokeStyle = h.INK; c.stroke(); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 5, 19); c.lineTo(i * 5, 26); c.stroke(); }
      [-14, -6, 6, 14].forEach((x, i) => h.dot(c, x, -22, 2.4, ['#f5c518', '#3fa34d', '#e2337f', '#1fa3a0'][i]));
    });
    if (!has('muCorona')) ICONS.add('muCorona', (c, p, h) => { h.shape(c, p, h.ell(0, 6, 34, 14), '#3f8a3a'); for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; marigold(c, p, h, Math.cos(a) * 30, 6 + Math.sin(a) * 12 - 6, 11); } for (let i = 0; i < 3; i++) marigold(c, p, h, -18 + i * 18, 14, 10); });
    if (!has('muLibreta')) ICONS.add('muLibreta', (c, p, h) => { h.shape(c, p, h.rr(-24, -32, 48, 64, 4), '#7b4bb0'); if (p) { h.shape(c, 1, h.rr(-16, -20, 32, 14, 2), '#fff8ec', 1.4); marigold(c, 1, h, 0, 14, 10); for (let i = 0; i < 5; i++) h.dot(c, -24, -24 + i * 12, 2.6, '#f5c518'); } });
    if (!has('muLuz')) ICONS.add('muLuz', (c, p, h) => { if (p) { const g = c.createRadialGradient(0, 0, 2, 0, 0, 40); g.addColorStop(0, 'rgba(255,248,210,1)'); g.addColorStop(0.35, 'rgba(255,196,90,0.85)'); g.addColorStop(1, 'rgba(255,150,40,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 40, 0, TAU); c.fill(); } });
  }

  // ================================================================ drawings shared by the panels and the 3D world
  // a photo on the ofrenda (k: 0 vivid … 1 hushed: gray, and the name gone)
  function portrait(c, P, k = 0) {
    const W = c.canvas.width, Hh = c.canvas.height, sx = W / 128, sy = Hh / 160;
    c.save(); c.setTransform(sx, 0, 0, sy, 0, 0); c.clearRect(0, 0, 128, 160);
    c.fillStyle = '#7a4f30'; c.fillRect(0, 0, 128, 160); c.fillStyle = '#9a6a42'; c.fillRect(4, 4, 120, 152);
    c.fillStyle = P.bg; c.fillRect(11, 11, 106, 110);
    const head = (x, y, s, o) => {
      c.fillStyle = o.shawl || o.dress || '#5a6b8a'; c.beginPath(); c.ellipse(x, y + 52 * s, 40 * s, 30 * s, 0, Math.PI, TAU); c.fill();
      if (o.bun) { c.fillStyle = o.hair; c.beginPath(); c.arc(x, y - 30 * s, 11 * s, 0, TAU); c.fill(); }
      c.fillStyle = o.skin; c.beginPath(); c.ellipse(x, y, 22 * s, 26 * s, 0, 0, TAU); c.fill();
      c.fillStyle = o.hair; c.beginPath(); c.ellipse(x, y - 13 * s, 23 * s, 15 * s, 0, Math.PI * 1.02, Math.PI * 1.98); c.fill();
      if (o.hat) { c.fillStyle = o.hat; c.beginPath(); c.ellipse(x, y - 16 * s, 34 * s, 7 * s, 0, 0, TAU); c.fill(); c.fillRect(x - 16 * s, y - 34 * s, 32 * s, 18 * s); c.fillStyle = '#a8442e'; c.fillRect(x - 16 * s, y - 21 * s, 32 * s, 4 * s); }
      c.fillStyle = '#2b2235'; for (const d of [-1, 1]) { c.beginPath(); c.arc(x + d * 8 * s, y - 1 * s, 2.6 * s, 0, TAU); c.fill(); }
      if (o.glasses) { c.strokeStyle = '#2b2235'; c.lineWidth = 1.6 * s; for (const d of [-1, 1]) { c.beginPath(); c.arc(x + d * 8 * s, y - 1 * s, 6 * s, 0, TAU); c.stroke(); } }
      if (o.mustache) { c.fillStyle = o.hair; c.beginPath(); c.ellipse(x - 5 * s, y + 9 * s, 6 * s, 2.6 * s, 0.2, 0, TAU); c.ellipse(x + 5 * s, y + 9 * s, 6 * s, 2.6 * s, -0.2, 0, TAU); c.fill(); }
      c.strokeStyle = '#2b2235'; c.lineWidth = 1.8 * s; c.beginPath(); c.arc(x, y + 9 * s, 7 * s, 0.25, Math.PI - 0.25); c.stroke();
      c.fillStyle = 'rgba(255,120,140,0.45)'; for (const d of [-1, 1]) { c.beginPath(); c.arc(x + d * 14 * s, y + 7 * s, 4 * s, 0, TAU); c.fill(); }
      if (o.pencil) { c.strokeStyle = '#f5c518'; c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x + 18 * s, y - 14 * s); c.lineTo(x + 28 * s, y - 2 * s); c.stroke(); }
    };
    if (P.twins) { head(44, 70, 0.78, P); head(84, 70, 0.78, Object.assign({}, P, { hair: '#6b4a2a', mustache: true })); } else head(64, 66, 1, P);
    c.fillStyle = '#fff8ec'; c.fillRect(9, 126, 110, 27);
    const name = k > 0.55 ? '▬▬▬ ▬▬' : P.name;
    let px = 16; c.font = `800 ${px}px Bahnschrift, "Segoe UI", sans-serif`; while (px > 8 && c.measureText(name).width > 104) { px--; c.font = `800 ${px}px Bahnschrift, "Segoe UI", sans-serif`; }
    c.fillStyle = '#2b2235'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(name, 64, 140);
    c.restore();
    if (k > 0.01) {
      const d = c.getImageData(0, 0, W, Hh), a = d.data;
      for (let i = 0; i < a.length; i += 4) { const l = a[i] * 0.3 + a[i + 1] * 0.55 + a[i + 2] * 0.15, g = lerp(l, 168, 0.35); a[i] = lerp(a[i], g, k); a[i + 1] = lerp(a[i + 1], g, k); a[i + 2] = lerp(a[i + 2], g + 6, k); }
      c.putImageData(d, 0, 0);
    }
  }
  // papel picado: one flag in a color, with the cuts you chose (D: { color, fig, tri, circ })
  const PP_COLORS = { rosa: '#e2337f', morado: '#7b4bb0', naranja: '#f39a1e', amarillo: '#f5c518', verde: '#3fa34d', azul: '#2f7fd8', rojo: '#d63a2f', blanco: '#f4efe6' };
  const FIGS = {
    flor: (c, x, y, s) => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.beginPath(); c.ellipse(x + Math.cos(a) * 9 * s, y + Math.sin(a) * 9 * s, 7 * s, 4 * s, a, 0, TAU); c.fill(); } },
    pajaro: (c, x, y, s) => { c.beginPath(); c.ellipse(x, y, 12 * s, 7 * s, -0.2, 0, TAU); c.fill(); c.beginPath(); c.arc(x + 11 * s, y - 6 * s, 5 * s, 0, TAU); c.fill(); c.beginPath(); c.moveTo(x - 10 * s, y); c.lineTo(x - 22 * s, y - 7 * s); c.lineTo(x - 20 * s, y + 6 * s); c.fill(); c.beginPath(); c.moveTo(x + 15 * s, y - 6 * s); c.lineTo(x + 21 * s, y - 4 * s); c.lineTo(x + 15 * s, y - 3 * s); c.fill(); },
    corazon: (c, x, y, s) => { c.beginPath(); c.moveTo(x, y + 12 * s); c.bezierCurveTo(x - 18 * s, y, x - 12 * s, y - 14 * s, x, y - 5 * s); c.bezierCurveTo(x + 12 * s, y - 14 * s, x + 18 * s, y, x, y + 12 * s); c.fill(); },
    calavera: (c, x, y, s) => { c.beginPath(); c.arc(x, y - 2 * s, 12 * s, 0, TAU); c.fill(); c.fillRect(x - 7 * s, y + 6 * s, 14 * s, 8 * s); },
    estrella: (c, x, y, s) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = (i % 2 ? 5.5 : 14) * s; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); },
    luna: (c, x, y, s) => { c.beginPath(); c.arc(x, y, 13 * s, 0, TAU); c.fill(); },
    sol: (c, x, y, s) => { c.beginPath(); c.arc(x, y, 8 * s, 0, TAU); c.fill(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a - 0.18) * 10 * s, y + Math.sin(a - 0.18) * 10 * s); c.lineTo(x + Math.cos(a) * 16 * s, y + Math.sin(a) * 16 * s); c.lineTo(x + Math.cos(a + 0.18) * 10 * s, y + Math.sin(a + 0.18) * 10 * s); c.fill(); } },
    mariposa: (c, x, y, s) => { for (const d of [-1, 1]) { c.beginPath(); c.ellipse(x + d * 8 * s, y - 5 * s, 8 * s, 7 * s, d * 0.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(x + d * 6 * s, y + 6 * s, 5 * s, 5 * s, 0, 0, TAU); c.fill(); } },
  };
  // the bits a cut leaves as paper (the skull's eyes, the moon's bite)
  const FIG_KEEP = { calavera: (c, x, y, s) => { for (const d of [-1, 1]) { c.beginPath(); c.arc(x + d * 4.5 * s, y - 2 * s, 3.2 * s, 0, TAU); c.fill(); } c.fillRect(x - 1 * s, y + 7 * s, 2 * s, 7 * s); }, luna: (c, x, y, s) => { c.beginPath(); c.arc(x + 6 * s, y - 3 * s, 11 * s, 0, TAU); c.fill(); }, flor: (c, x, y, s) => { c.beginPath(); c.arc(x, y, 3.5 * s, 0, TAU); c.fill(); }, mariposa: (c, x, y, s) => c.fillRect(x - 1.2 * s, y - 10 * s, 2.4 * s, 20 * s) };
  function papel(c, D) {
    const W = c.canvas.width, Hh = c.canvas.height, s = W / 100, col = PP_COLORS[D.color] || D.color || '#e2337f';
    c.clearRect(0, 0, W, Hh);
    c.fillStyle = col; c.beginPath(); c.moveTo(0, 0); c.lineTo(W, 0); c.lineTo(W, Hh * 0.86);
    for (let k = 0; k < 6; k++) c.quadraticCurveTo(W - (k + 0.5) * W / 6, Hh * (D.tri ? 1 : 0.97), W - (k + 1) * W / 6, Hh * 0.86);
    c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(0, 0, W, 5 * s);
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000';
    if (D.tri) for (let k = 0; k < 8; k++) { const x = (k + 0.5) * W / 8; c.beginPath(); c.moveTo(x - 4 * s, 10 * s); c.lineTo(x, 4 * s); c.lineTo(x + 4 * s, 10 * s); c.fill(); }
    if (D.circ) for (let k = 0; k < 6; k++) for (const y of [20, 100]) { c.beginPath(); c.arc((k + 0.5) * W / 6, y * Hh / 120, 3.2 * s, 0, TAU); c.fill(); }
    if (D.fig && FIGS[D.fig]) { FIGS[D.fig](c, W / 2, Hh * 0.5, 2.1 * s); for (const d of [-1, 1]) FIGS[D.fig](c, W / 2 + d * 33 * s, Hh * 0.5, 0.75 * s); }
    else { c.beginPath(); c.arc(W / 2, Hh * 0.5, 9 * s, 0, TAU); c.fill(); }
    if (D.diam !== false) for (const d of [-1, 1]) { c.beginPath(); c.moveTo(W / 2 + d * 22 * s, Hh * 0.2); c.lineTo(W / 2 + d * 26 * s, Hh * 0.26); c.lineTo(W / 2 + d * 22 * s, Hh * 0.32); c.lineTo(W / 2 + d * 18 * s, Hh * 0.26); c.fill(); }
    c.globalCompositeOperation = 'source-over'; c.fillStyle = col;
    if (D.fig && FIG_KEEP[D.fig]) { FIG_KEEP[D.fig](c, W / 2, Hh * 0.5, 2.1 * s); for (const d of [-1, 1]) FIG_KEEP[D.fig](c, W / 2 + d * 33 * s, Hh * 0.5, 0.75 * s); }
  }

  // ================================================================ 3D
  const K = () => ZHF.Kit();
  const GY_TOWN = () => (typeof TOWN !== 'undefined' && TOWN.GY) || 0.25;
  function marigold(k, x, y, z, s = 1, o = {}) {
    k.ball(x, y, z, 0.075 * s, 0.06 * s, 0.075 * s, o.col || '#f39a1e', { ink: o.ink === undefined ? 0.006 : o.ink });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; k.ball(x + Math.cos(a) * 0.06 * s, y - 0.01 * s, z + Math.sin(a) * 0.06 * s, 0.04 * s, 0.035 * s, 0.04 * s, i % 2 ? '#f7b52c' : '#f5a020', { ink: 0 }); }
  }
  let GLOWTEX = null;
  function glowTex() {
    if (GLOWTEX) return GLOWTEX;
    const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'), g = c.createRadialGradient(32, 32, 1, 32, 32, 31);
    g.addColorStop(0, 'rgba(255,250,225,1)'); g.addColorStop(0.25, 'rgba(255,205,110,0.85)'); g.addColorStop(0.6, 'rgba(255,150,50,0.25)'); g.addColorStop(1, 'rgba(255,130,40,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64); GLOWTEX = new THREE.CanvasTexture(cv); return GLOWTEX;
  }
  const glow = (size, op = 0.9) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: op, fog: false })); m.scale.set(size, size, 1); m.renderOrder = 3; return m; };
  const canvasPlane = (w, h, cw, ch, draw, o = {}) => { const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; draw(cv.getContext('2d')); const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4; const m = ZHF.plane(w, h, tex, o); m.userData.cv = cv; m.userData.tex = tex; return m; };
  // a candle: wax, a wick and a flame (the flame and its halo are their own objects: they flicker, go out, come back)
  function candle(parent, x, y, z, h = 0.3, jar) {
    const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
    const k = K(); if (jar) k.cyl(0, 0.09, 0, 0.065, 0.18, '#e2337f', { ink: 0.006 }).cyl(0, 0.19, 0, 0.055, 0.02, '#fbf3e0', { ink: 0 }); else k.cyl(0, h / 2, 0, 0.045, h, '#fbf3e0', { ink: 0.008 });
    ZHF.bake(g, k);
    const top = jar ? 0.2 : h, fk = K(); fk.cone(0, top + 0.06, 0, 0.022, 0.09, '#ffcf3f', { glow: true }).ball(0, top + 0.035, 0, 0.018, 0.024, 0.018, '#fff3a0', { glow: true });
    const flame = new THREE.Group(); ZHF.bake(flame, fk); g.add(flame);
    const halo = glow(jar ? 0.55 : 0.45, 0.55); halo.position.set(0, top + 0.07, 0); g.add(halo);
    return { g, flame, halo, lit: 1, t: Math.random() * 9 };
  }
  // the people's extra bits on the shared rig (zhfolk.js person)
  function hatK(kh, r, col = '#e8d08a') { kh.cyl(0, 0.13, -0.02, r * 1.9, 0.025, col, { ink: 0.008 }).cyl(0, 0.2, -0.02, r * 0.95, 0.15, col, { ink: 0.008 }).cyl(0, 0.15, -0.02, r * 0.97, 0.035, '#c0392b', { ink: 0 }); }
  function makeXochi() {
    const p = ZHF.person({ kid: true, skin: '#b9825a', hair: '#1f1a18', shirt: '#fff8ec', sleeve: '#fff8ec', pants: '#b9825a', shoes: '#8a3b2e', collar: '#e2337f' });
    const kb = K(); kb.cone(0, 0.57, 0, 0.33, 0.9, '#c2185b', { ink: 0.016 }).cyl(0, 0.135, 0, 0.336, 0.035, '#f39a1e', { ink: 0 });
    [['#e2337f', -0.12], ['#f39a1e', -0.04], ['#1fa3a0', 0.04], ['#7b4bb0', 0.12]].forEach(([c, x]) => kb.ball(x, 0.8, 0.245, 0.03, 0.03, 0.015, c, { ink: 0 }));
    ZHF.bake(p.body, kb);
    const kh = K(), r = 0.275;
    for (const s of [-1, 1]) { kh.rod([s * 0.24, -0.04, -0.06], [s * 0.27, -0.4, 0.07], 0.045, '#1f1a18', { ink: 0.01 }); kh.ball(s * 0.272, -0.44, 0.08, 0.05, 0.05, 0.05, '#e2337f', { ink: 0.006 }); }
    marigold(kh, 0.265, 0.11, 0.0, 1.05);
    ZHF.bake(p.head, kh);
    const bunch = new THREE.Group(), kf = K();
    for (let i = 0; i < 3; i++) { kf.rod([0, 0, 0], [(i - 1) * 0.06, 0.32, 0.05], 0.01, '#3f8a3a', { ink: 0 }); marigold(kf, (i - 1) * 0.06, 0.34, 0.05, 0.8); }
    ZHF.bake(bunch, kf); p.arms[1].userData.hand.add(bunch); p.bunch = bunch;
    p.r = r; return p;
  }
  function makeLucha() {
    const p = ZHF.person({ skin: '#a8714a', hair: '#ebe7df', shirt: '#7a3a5a', sleeve: '#7a3a5a', pants: '#4a2f45', shoes: '#2b2235', glasses: true, old: true }, { sit: true, seatY: 0.46 });
    const kb = K(); kb.ball(0, p.shY + 0.02, 0, 0.36, 0.13, 0.3, '#2f7fa8', { ink: 0.012 }); for (let i = 0; i < 7; i++) kb.rod([-0.3 + i * 0.1, p.shY - 0.06, 0.2], [-0.3 + i * 0.1, p.shY - 0.2, 0.22], 0.008, i % 2 ? '#f5c518' : '#e2337f', { ink: 0 });
    ZHF.bake(p.body, kb);
    const kh = K(); kh.ball(0, 0.16, -0.17, 0.11, 0.1, 0.1, '#ebe7df', { ink: 0.008 }); ZHF.bake(p.head, kh);
    return p;
  }
  function makeMusician(kind) {
    const look = { skin: ['#c98e62', '#a8714a', '#e6b48c'][kind], hair: '#2b2235', shirt: '#fbfbf6', sleeve: '#fbfbf6', pants: '#fbfbf6', shoes: '#2b2235', collar: '#c0392b', mustache: kind === 1 };
    const p = ZHF.person(look); const kh = K(); hatK(kh, 0.25); ZHF.bake(p.head, kh);
    const kb = K(); kb.cone(0, p.shY - 0.02, 0.2, 0.09, 0.14, '#c0392b', { rx: Math.PI, ink: 0.006 }); ZHF.bake(p.body, kb);
    const inst = new THREE.Group(), ki = K();
    if (kind < 2) { const s = kind ? 0.8 : 1; ki.ball(0, 0, 0, 0.17 * s, 0.22 * s, 0.07, kind ? '#c98a4a' : '#a0602e', { ink: 0.01 }).ball(0, 0.02, 0.05, 0.05, 0.05, 0.02, '#2b2235', { ink: 0 }).rod([0, 0.18 * s, 0], [0, 0.6 * s, 0.02], 0.03, '#5a3a22'); }
    else { ki.rod([0, 0, 0], [0, 0.42, 0], 0.025, '#e8b83e', { ink: 0.006 }).cone(0, 0.5, 0, 0.07, 0.16, '#e8b83e', { ink: 0.006 }).box(0.04, 0.2, 0.03, 0.05, 0.1, 0.04, '#d9a03a', { ink: 0 }); }
    ZHF.bake(inst, ki);
    if (kind < 2) { inst.position.set(0.02, p.shY - 0.32, 0.26); inst.rotation.set(0.1, 0, -1.0); p.body.add(inst); p.pose = 'drum'; }
    else { inst.position.set(0, p.headY - 0.12, 0.32); inst.rotation.set(Math.PI / 2 - 0.15, 0, 0); p.body.add(inst); p.pose = 'hold'; }
    p.kindM = kind; return p;
  }

  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    const root = new THREE.Group(); root.name = 'muertos'; scene.add(root); root.visible = false;
    const colliders = [], solid = c => { c.x0 = c.x; c.z0 = c.z; colliders.push(c); return c; };
    const town = new THREE.Group(), cem = new THREE.Group(); root.add(town, cem);
    // ---------------- Xochi's wagon of marigolds, abuela Lucha's table (from chapter 2)
    { const W = SPOT.wagon, k = K(); k.frame(W.x, gy(W.x, W.z), W.z, W.yaw);
      k.box(0, 0.36, 0, 0.62, 0.24, 0.95, '#c8322a', { ink: 0.012 }).box(0, 0.49, 0, 0.66, 0.04, 0.99, '#a8281f', { ink: 0.006 });
      for (const [x, z] of [[-0.33, -0.32], [0.33, -0.32], [-0.33, 0.32], [0.33, 0.32]]) k.add(ZHF.GEO.cyl, '#3a2b26', x, 0.16, z, 0.15, 0.05, 0.15, 0, 0, Math.PI / 2, { ink: 0.008 });
      k.rod([0, 0.4, 0.5], [0, 0.62, 1.05], 0.022, '#7a5236').rod([-0.12, 0.62, 1.05], [0.12, 0.62, 1.05], 0.02, '#7a5236');
      for (let i = 0; i < 11; i++) marigold(k, -0.22 + (i % 4) * 0.15, 0.56 + (i > 7 ? 0.08 : 0), -0.36 + Math.floor(i / 4) * 0.3 + (i % 2) * 0.05, 1.25);
      k.cyl(0.5, 0.18, -0.55, 0.13, 0.36, '#3e8f8a', { ink: 0.008 }); for (let i = 0; i < 5; i++) marigold(k, 0.44 + (i % 3) * 0.06, 0.44 + (i % 2) * 0.05, -0.6 + (i % 2) * 0.08, 1.1);
      const wg = new THREE.Group(); ZHF.bake(wg, k); town.add(wg); colliders.push(solid({ obox: 1, x: W.x, z: W.z, hw: 0.4, hd: 0.62, rot: W.yaw }), solid({ x: W.x + Math.sin(W.yaw) * 0.0 + 0.5 * Math.cos(W.yaw) - 0.55 * Math.sin(W.yaw), z: W.z - 0.5 * Math.sin(W.yaw) - 0.55 * Math.cos(W.yaw), r: 0.18 })); }
    const luchaG = new THREE.Group(); town.add(luchaG);
    { const T = SPOT.table, k = K(); k.frame(T.x, gy(T.x, T.z), T.z, T.yaw);
      k.box(0, 0.62, 0, 0.8, 0.05, 0.55, '#a8784e', { ink: 0.01 }); for (const [x, z] of [[-0.34, -0.22], [0.34, -0.22], [-0.34, 0.22], [0.34, 0.22]]) k.rod([x, 0, z], [x, 0.6, z], 0.025, '#7a5236');
      ['#e2337f', '#f39a1e', '#7b4bb0', '#1fa3a0'].forEach((c, i) => k.box(-0.18 + i * 0.12, 0.655 + i * 0.006, -0.05 + (i % 2) * 0.08, 0.3, 0.004, 0.22, c, { ink: 0, ry: i * 0.3 }));
      k.rod([0.22, 0.66, 0.12], [0.34, 0.66, 0.02], 0.012, '#8a8f9e', { ink: 0 }).rod([0.22, 0.66, 0.02], [0.34, 0.66, 0.12], 0.012, '#8a8f9e', { ink: 0 });
      const L = SPOT.lucha; k.free(); k.frame(L.x, gy(L.x, L.z), L.z, L.yaw); k.box(0, 0.44, 0, 0.46, 0.05, 0.44, '#8a5f3e', { ink: 0.01 }).box(0, 0.75, -0.21, 0.46, 0.55, 0.04, '#8a5f3e', { ink: 0.01 });
      for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) k.rod([x, 0, z], [x, 0.44, z], 0.022, '#6b4a2e');
      ZHF.bake(luchaG, k); colliders.push(solid({ obox: 1, x: T.x, z: T.z, hw: 0.42, hd: 0.3, rot: T.yaw })); }
    // ---------------- the ofrenda (three levels, an arch of marigolds, the photos' board; things appear as they're placed)
    const A = SPOT.alt, ay = gy(A.x, A.z), alt = new THREE.Group(); alt.position.set(A.x, ay, A.z); alt.rotation.y = A.yaw; town.add(alt);
    { const k = K();
      k.box(0, 0.21, 0, 2.5, 0.42, 1.0, '#7b4bb0', { ink: 0.016 }).box(0, 0.43, 0, 2.54, 0.025, 1.04, '#fff8ec', { ink: 0.006 });
      k.box(0, 0.63, -0.15, 2.0, 0.4, 0.7, '#e2337f', { ink: 0.016 }).box(0, 0.835, -0.15, 2.04, 0.025, 0.74, '#fff8ec', { ink: 0.006 });
      k.box(0, 1.02, -0.27, 1.5, 0.38, 0.46, '#1fa3a0', { ink: 0.014 }).box(0, 1.215, -0.27, 1.54, 0.025, 0.5, '#fff8ec', { ink: 0.006 });
      k.box(0, 1.76, -0.53, 2.3, 1.12, 0.06, '#4a2a5a', { ink: 0.012 });
      for (const s of [-1, 1]) { k.rod([s * 1.2, 0, -0.42], [s * 1.2, 1.6, -0.42], 0.035, '#3f8a3a'); for (let i = 0; i < 6; i++) marigold(k, s * 1.2, 0.35 + i * 0.25, -0.38, 1.3); }
      for (let i = 0; i <= 18; i++) { const a = Math.PI * i / 18, x = -Math.cos(a) * 1.2, y = 1.6 + Math.sin(a) * 1.25; marigold(k, x, y, -0.4, 1.35); if (i % 3 === 1) k.ball(x * 1.05, y + 0.05, -0.46, 0.06, 0.03, 0.09, '#3f8a3a', { ink: 0 }); }
      ZHF.bake(alt, k);
      // the papel picado fringe along each level's front edge
      const fr = canvasPlane(1, 0.12, 256, 32, c => { const cols = ['#e2337f', '#f39a1e', '#1fa3a0', '#f5c518', '#7b4bb0', '#3fa34d']; for (let i = 0; i < 8; i++) { c.fillStyle = cols[i % 6]; c.beginPath(); c.moveTo(i * 32 + 2, 0); c.lineTo(i * 32 + 30, 0); c.lineTo(i * 32 + 30, 22); c.lineTo(i * 32 + 16, 31); c.lineTo(i * 32 + 2, 22); c.closePath(); c.fill(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(i * 32 + 16, 12, 4, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; } }, { alpha: true });
      fr.userData.tex.wrapS = THREE.RepeatWrapping;
      [[2.5, 0.38, 0.505], [2.0, 0.79, 0.205], [1.5, 1.17, -0.035]].forEach(([w, y, z]) => { const m = fr.clone(); m.material = fr.material.clone(); m.material.map = fr.userData.tex.clone(); m.material.map.needsUpdate = true; m.material.map.wrapS = THREE.RepeatWrapping; m.material.map.repeat.set(w / 1.0 * 1.0, 1); m.scale.set(w, 1, 1); m.position.set(0, y, z); alt.add(m); });
    }
    const slotPos = { t0: [-0.5, 1.23, -0.27], t1: [0, 1.23, -0.32], t2: [0.5, 1.23, -0.27], m0: [-0.62, 0.85, 0.06], m1: [0, 0.85, 0.06], m2: [0.62, 0.85, 0.06], b0: [-0.8, 0.445, 0.33], b1: [0, 0.445, 0.33], b2: [0.8, 0.445, 0.33], arch: [0, 2.55, -0.36], floor: [0, 0.02, 1.0] };
    const items = {}, mk = (slot, fn) => { const g = new THREE.Group(); const [x, y, z] = slotPos[slot]; g.position.set(x, y, z); alt.add(g); fn(g); g.visible = false; items[slot] = g; return g; };
    const candles = [];
    mk('t0', g => candles.push(candle(g, 0, 0, 0, 0.32))); mk('t2', g => candles.push(candle(g, 0, 0, 0, 0.32)));
    const photos = {};
    mk('t1', g => { const k = K(); k.box(0, 0.25, 0, 0.42, 0.52, 0.04, '#7a4f30', { ink: 0.01 }).rod([0, 0, -0.12], [0, 0.3, -0.02], 0.015, '#7a4f30', { ink: 0 }); ZHF.bake(g, k); const ph = canvasPlane(0.36, 0.45, 128, 160, c => portrait(c, PEOPLE.esperanza)); ph.position.set(0, 0.25, 0.022); g.add(ph); photos.esperanza = ph; });
    mk('m0', g => { const k = K(); k.cyl(0, 0.09, 0, 0.06, 0.18, '#cfeaf7', { ink: 0.008 }).cyl(0, 0.15, 0, 0.052, 0.01, '#6cc3ea', { ink: 0 }); ZHF.bake(g, k); });
    mk('m1', g => { const k = K(); k.ball(0, 0.07, 0, 0.17, 0.1, 0.17, '#d99a4e', { ink: 0.01 }); for (const r of [0.6, -0.6]) k.rod([-0.13 * Math.cos(r), 0.15, -0.13 * Math.sin(r)], [0.13 * Math.cos(r), 0.15, 0.13 * Math.sin(r)], 0.028, '#b97a3e', { ink: 0.006 }); k.ball(0, 0.18, 0, 0.045, 0.04, 0.045, '#b97a3e', { ink: 0.006 }); ZHF.bake(g, k); });
    mk('m2', g => { const k = K(); k.cyl(0, 0.07, 0, 0.07, 0.14, '#2f9a8a', { ink: 0.008 }).cyl(0, 0.14, 0, 0.06, 0.01, '#6b3b1f', { ink: 0 }).add(ZHF.GEO.tor, '#2f9a8a', 0.08, 0.07, 0, 0.04, 0.04, 0.04, 0, 0, 0, { ink: 0 }); ZHF.bake(g, k); });
    mk('b0', g => { const k = K(); k.cyl(0, 0.03, 0, 0.11, 0.06, '#d96a3a', { ink: 0.008 }).add(ZHF.GEO.half, '#ffffff', 0, 0.06, 0, 0.07, 0.05, 0.07, 0, 0, 0, { ink: 0 }); ZHF.bake(g, k); });
    mk('b1', g => { const k = K(); k.cyl(0, 0.12, 0, 0.11, 0.24, '#c0603a', { ink: 0.01 }); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; marigold(k, Math.cos(a) * 0.09 * (i ? 1 : 0), 0.32 + (i ? 0 : 0.06), Math.sin(a) * 0.09 * (i ? 1 : 0), 1.2); } ZHF.bake(g, k); });
    mk('b2', g => { const k = K(); k.ball(0, 0.08, 0, 0.1, 0.09, 0.09, '#fffdf6', { ink: 0.008 }); for (const s of [-1, 1]) { k.ball(s * 0.035, 0.09, 0.08, 0.022, 0.022, 0.01, '#1fa3a0', { ink: 0 }); k.ball(s * 0.06, 0.13, 0.065, 0.014, 0.014, 0.01, s < 0 ? '#e2337f' : '#f39a1e', { ink: 0 }); } k.ball(0, 0.05, 0.088, 0.03, 0.01, 0.01, '#7b4bb0', { ink: 0 }); ZHF.bake(g, k); });
    // the papel picado under the arch: five flags (yours from chapter 2) on a string
    const flags = [];
    mk('arch', g => { const k = K(); k.rod([-0.82, 0.04, 0], [0, -0.06, 0], 0.008, '#2b2235', { ink: 0 }).rod([0, -0.06, 0], [0.82, 0.04, 0], 0.008, '#2b2235', { ink: 0 }); ZHF.bake(g, k);
      for (let i = 0; i < 5; i++) { const x = -0.62 + i * 0.31, f = canvasPlane(0.27, 0.32, 100, 120, c => papel(c, { color: ['rosa', 'naranja', 'morado', 'verde', 'amarillo'][i], fig: 'flor', tri: true, circ: true }), { alpha: true, double: true }); f.position.set(x, -0.22 + Math.abs(x) * 0.1, 0); g.add(f); flags.push(f); } });
    mk('floor', g => { const k = K(); for (let i = 0; i < 64; i++) { const arm = i % 4, r = 0.1 + Math.floor(i / 4) * 0.042, w = Math.sin(i * 2.4) * 0.05; const x = arm === 0 ? r : arm === 1 ? -r : w, z = arm === 2 ? r : arm === 3 ? -r * 0.6 : w; k.ball(x, 0, z, 0.035, 0.008, 0.028, i % 3 ? '#f39a1e' : '#f7b52c', { ink: 0, ay: i * 2.4 }); } marigold(k, 0, 0.03, 0, 1.4); ZHF.bake(g, k); });
    // chapter 4: the photos on the board, and each one's favorite thing at the ofrenda's foot
    const row = {}, favs = {};
    const ROWPOS = { andres: [-0.84, 1.62], lorenzo: [-0.44, 1.97], aurora: [0, 1.99], sofia: [0.44, 1.97], gil: [0.84, 1.62] };
    for (const id of ROW) { const [x, y] = ROWPOS[id], g = new THREE.Group(); g.position.set(x, y, -0.49); alt.add(g); const k = K(); k.box(0, 0, 0, 0.3, 0.37, 0.03, '#7a4f30', { ink: 0.008 }); ZHF.bake(g, k); const ph = canvasPlane(0.26, 0.325, 128, 160, c => portrait(c, PEOPLE[id])); ph.position.set(0, 0, 0.017); g.add(ph); photos[id] = ph; g.visible = false; row[id] = g; }
    { const fav = (id, x, z, fn) => { const g = new THREE.Group(); g.position.set(x, 0, z); alt.add(g); const k = K(); fn(k); ZHF.bake(g, k); g.visible = false; favs[id] = g; };
      fav('andres', -1.5, 0.55, k => { k.ball(0, 0.08, 0, 0.08, 0.075, 0.08, '#d63a2f', { ink: 0.008 }).rod([0, 0.15, 0], [0.01, 0.2, 0], 0.008, '#5b3a22', { ink: 0 }).ball(0.12, 0.06, 0.06, 0.07, 0.065, 0.07, '#7ab648', { ink: 0.008 }); });
      fav('lorenzo', -1.55, 0.0, k => { k.box(0, 0.2, 0, 0.26, 0.03, 0.26, '#a8784e', { ink: 0.008 }).box(0, 0.36, -0.12, 0.26, 0.3, 0.03, '#a8784e', { ink: 0.008 }); for (const [x, z] of [[-0.11, -0.11], [0.11, -0.11], [-0.11, 0.11], [0.11, 0.11]]) k.rod([x, 0, z], [x, 0.2, z], 0.016, '#7a5236', { ink: 0 }); });
      fav('sofia', 1.5, 0.55, k => { k.ball(0, 0.05, 0, 0.12, 0.06, 0.12, '#f4efe2', { ink: 0.008 }).cyl(0, 0.08, 0, 0.1, 0.01, '#e8a33a', { ink: 0 }).rod([0.05, 0.09, 0], [0.18, 0.16, 0.05], 0.01, '#8a8f9e', { ink: 0 }); });
      fav('gil', 1.55, 0.02, k => { for (const s of [-1, 1]) k.ball(s * 0.07, 0.05, 0, 0.055, 0.05, 0.12, s < 0 ? '#8a3b2e' : '#3a2b26', { ink: 0.008 }); });
      fav('aurora', 1.15, 0.85, k => { k.rod([0, 0, 0], [0, 0.45, -0.05], 0.015, '#2b2235', { ink: 0 }).box(0, 0.5, -0.045, 0.26, 0.2, 0.01, '#fff8ec', { ink: 0.006, rx: -0.3 }); });
      const sheet = canvasPlane(0.24, 0.18, 96, 72, c => { c.fillStyle = '#fffdf6'; c.fillRect(0, 0, 96, 72); c.strokeStyle = '#2b2235'; c.lineWidth = 1.4; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(6, 18 + i * 8); c.lineTo(90, 18 + i * 8); c.stroke(); } c.fillStyle = '#2b2235'; [[20, 42], [36, 34], [52, 26], [68, 38], [82, 30]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, 4.5, 3.4, -0.4, 0, TAU); c.fill(); c.fillRect(x + 3.4, y - 16, 1.6, 16); }); });
      sheet.position.set(0, 0.5, -0.033); sheet.rotation.x = -0.3; favs.aurora.add(sheet);
    }
    // chapter 5: candles in jars at the ofrenda's foot
    const jars = new THREE.Group(); alt.add(jars); jars.visible = false;
    [[-1.3, 0.85], [-0.85, 0.6], [-0.42, 0.62], [0.42, 0.62], [0.85, 0.6], [1.3, 0.85]].forEach(([x, z]) => candles.push(Object.assign(candle(jars, x, 0, z, 0.2, true), { jar: true })));
    colliders.push(solid({ obox: 1, x: A.x, z: A.z, hw: 1.35, hd: 0.62, rot: A.yaw }));
    // ---------------- the calaveritas board (chapter 3): an easel with four sheets
    const board = new THREE.Group(); town.add(board); board.visible = false;
    { const P = ALT.at(2.05, 0.3), k = K(); board.position.set(P.x, gy(P.x, P.z), P.z); board.rotation.y = A.yaw - 0.25;
      k.rod([-0.36, 0, -0.1], [-0.3, 1.5, 0], 0.025, '#8a5f3e').rod([0.36, 0, -0.1], [0.3, 1.5, 0], 0.025, '#8a5f3e').rod([0, 0, -0.4], [0, 1.4, -0.02], 0.025, '#8a5f3e').box(0, 1.0, 0.02, 0.8, 0.85, 0.03, '#d9c09a', { ink: 0.01 });
      ZHF.bake(board, k);
      const sheet = canvasPlane(0.7, 0.75, 140, 150, c => { c.fillStyle = '#fffdf6'; c.fillRect(0, 0, 140, 150); const cols = ['#e2337f', '#f39a1e', '#1fa3a0', '#7b4bb0']; for (let q = 0; q < 4; q++) { const x0 = (q % 2) * 70 + 6, y0 = Math.floor(q / 2) * 75 + 6; c.fillStyle = cols[q]; c.fillRect(x0, y0, 58, 9); c.fillStyle = 'rgba(43,34,53,.55)'; for (let l = 0; l < 4; l++) c.fillRect(x0 + 2, y0 + 18 + l * 12, 50 - (l % 2) * 12, 3); c.beginPath(); c.arc(x0 + 50, y0 + 60, 5, 0, TAU); c.fillStyle = '#fffdf6'; c.fill(); c.strokeStyle = '#2b2235'; c.stroke(); } });
      sheet.position.set(0, 1.0, 0.04); board.add(sheet);
      colliders.push(solid({ x: P.x, z: P.z, r: 0.35 })); }
    // ---------------- Esperanza's grave, inside the cemetery gate: kept clean, with fresh marigolds (es games)
    const graveG = new THREE.Group(); cem.add(graveG);
    { const P = SPOT.grave, y0 = gy(P.x, P.z), k = K(); graveG.position.set(P.x, y0, P.z); graveG.rotation.y = P.yaw;
      k.box(0, 0.06, 0.25, 1.1, 0.12, 1.6, '#c9bfb2', { ink: 0.012 }).box(0, 0.5, -0.45, 0.82, 0.8, 0.16, '#d8c8bc', { ink: 0.012 }).add(ZHF.GEO.cyl, '#d8c8bc', 0, 0.9, -0.45, 0.41, 0.16, 0.41, Math.PI / 2, 0, 0, { ink: 0.012 });
      for (const s of [-1, 1]) { k.cyl(s * 0.36, 0.2, 0.75, 0.07, 0.16, '#c0603a', { ink: 0.008 }); for (let i = 0; i < 4; i++) marigold(k, s * 0.36 + (i % 2 ? 0.05 : -0.05), 0.33 + (i > 1 ? 0.06 : 0), 0.75 + (i % 2 ? 0.04 : -0.03), 1.1); }
      for (let i = 0; i < 26; i++) k.ball(-0.4 + (i * 0.37) % 0.8, 0.13, -0.2 + (i * 0.53) % 1.0, 0.035, 0.008, 0.028, i % 3 ? '#f39a1e' : '#f7b52c', { ink: 0, ay: i });
      k.cyl(0.18, 0.17, 0.95, 0.045, 0.1, '#2f9a8a', { ink: 0.006 });
      ZHF.bake(graveG, k);
      const plaque = canvasPlane(0.66, 0.6, 200, 182, c => { c.fillStyle = '#d8c8bc'; c.fillRect(0, 0, 200, 182); c.fillStyle = '#5a4a44'; c.textAlign = 'center'; c.font = '700 26px Georgia, serif'; c.fillText('Esperanza', 100, 46); c.fillText('Ríos', 100, 80); c.font = 'italic 600 18px Georgia, serif'; c.fillText('Siempre te', 100, 122); c.fillText('recordamos', 100, 146); c.fillStyle = '#f39a1e'; for (const x of [40, 160]) { c.beginPath(); c.arc(x, 166, 7, 0, TAU); c.fill(); } });
      plaque.position.set(0, 0.6, -0.365); graveG.add(plaque);
      candles.push(candle(graveG, -0.18, 0.12, 0.95, 0.16, true));
      colliders.push(solid({ x: P.x, z: P.z - 0.05, r: 0.55 })); }
    // ---------------- the petal path (chapter 5): one instanced mesh, laid from the grave to the ofrenda
    const pathM = (() => {
      const P = PATH, seg = [], cum = [0];
      for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); seg.push(d); cum.push(cum[i - 1] + d); }
      const L = cum[cum.length - 1], n = Math.round(L * 14);
      const geo = new THREE.CircleGeometry(0.095, 6); geo.rotateX(-Math.PI / 2); geo.scale(1, 1, 0.62);
      const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: '#ffffff' }), n);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3(), col = new THREE.Color(), R = rng(2026), base = [], sAt = [];
      for (let i = 0; i < n; i++) {
        const d = (i + R() * 0.8) / n * L; let j = 1; while (j < cum.length - 1 && cum[j] < d) j++;
        const a = P[j - 1], b = P[j], u = (d - cum[j - 1]) / (seg[j - 1] || 1), x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u), nx = -(b[1] - a[1]) / (seg[j - 1] || 1), nz = (b[0] - a[0]) / (seg[j - 1] || 1);
        const off = (R() - 0.5) * 1.15 * (R() < 0.75 ? 1 : 0.6), px = x + nx * off, pz = z + nz * off;
        p.set(px, gy(px, pz) + 0.05 + R() * 0.02, pz); e.set(0, R() * TAU, 0); q.setFromEuler(e); const sc = 0.8 + R() * 0.6; s.set(sc, 1, sc);
        m4.compose(p, q, s); mesh.setMatrixAt(i, m4);
        col.set(['#f39a1e', '#f7b52c', '#f5a020', '#e8861a'][Math.floor(R() * 4)]); base.push(col.clone()); mesh.setColorAt(i, col); sAt.push(d);
      }
      mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.frustumCulled = false; mesh.count = 0; mesh.visible = false;
      root.add(mesh);
      return { mesh, n, L, cum, base, sAt, at(d) { d = clamp(d, 0, L); let j = 1; while (j < cum.length - 1 && cum[j] < d) j++; const a = P[j - 1], b = P[j], u = (d - cum[j - 1]) / (seg[j - 1] || 1); return { x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u) }; } };
    })();
    // ---------------- the visitors: warm lights that come down the path on the night
    const visitors = [];
    for (let i = 0; i < 7; i++) { const g = new THREE.Group(), h = glow(1.15, 0.7), core = glow(0.24, 0.9); h.material.color.set('#ffb35a'); core.material.color.set('#fff0c8'); g.add(h, core); g.visible = false; root.add(g); visitors.push({ g, h, d: 0, at: null, t: Math.random() * 9 }); }
    // ---------------- the night sky: a dusk dome over the real sky
    const dome = new THREE.Mesh(new THREE.SphereGeometry(560, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, transparent: true, fog: false, uniforms: { uK: { value: 0 } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uK; varying vec3 vDir;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main(){ float h = clamp(vDir.y, -0.2, 1.0);
          vec3 col = mix(vec3(0.55, 0.26, 0.24), vec3(0.20, 0.11, 0.28), smoothstep(-0.05, 0.22, h)); col = mix(col, vec3(0.05, 0.05, 0.16), smoothstep(0.2, 0.8, h));
          vec2 g = floor(vec2(atan(vDir.z, vDir.x) * 90.0, h * 140.0)); float st = step(0.985, h21(g)) * smoothstep(0.12, 0.4, h);
          col += vec3(1.0, 0.95, 0.85) * st * (0.6 + 0.4 * h21(g + 7.0));
          gl_FragColor = vec4(col, uK); }` }));
    dome.renderOrder = -0.5; dome.visible = false; scene.add(dome);
    // ---------------- the people: Xochi (always), abuela Lucha (from chapter 2), the band (the night, and after)
    const people = [];
    const kid = makeXochi(); kid.id = 'xochi'; kid.name = 'Xochi'; kid.x = SPOT.kid.x; kid.z = SPOT.kid.z; kid.y = gy(kid.x, kid.z); kid.yaw = kid.baseYaw = SPOT.kid.yaw; kid.story = true; root.add(kid.root); people.push(kid);
    const lucha = makeLucha(); lucha.id = 'lucha'; lucha.name = 'Abuela Lucha'; lucha.x = SPOT.lucha.x; lucha.z = SPOT.lucha.z; lucha.y = gy(lucha.x, lucha.z); lucha.yaw = lucha.baseYaw = SPOT.lucha.yaw; lucha.story = true; lucha.noTurn = true; lucha.pose = 'hold'; root.add(lucha.root); people.push(lucha);
    const BAND = [{ x: -11.6, z: -157.2, yaw: 0.45 }, { x: -12.7, z: -157.9, yaw: 0.5 }, { x: -13.6, z: -158.9, yaw: 0.55 }];
    const band = BAND.map((b, i) => { const p = makeMusician(i); p.id = 'band' + i; p.name = ['Jarana', 'Requinto', 'Trompeta'][i]; p.x = b.x; p.z = b.z; p.y = gy(b.x, b.z); p.yaw = p.baseYaw = b.yaw; p.noTurn = true; p.hidden = true; p.root.visible = false; root.add(p.root); people.push(p); return p; });
    const lights = scene.children.filter(o => o.isHemisphereLight || o.isDirectionalLight);
    B = { root, town, cem, alt, items, photos, row, favs, flags, candles, jars, board, graveG, luchaG, pathM, visitors, dome, kid, lucha, band, colliders, people, gy, lights, scene };
    return { colliders, group: root, people, update };
  }

  // a photo's look: k 0 vivid … 1 hushed
  function photoK(id, k) { const ph = B && B.photos[id]; if (!ph) return; const c = ph.userData.cv.getContext('2d'); portrait(c, PEOPLE[id], k); ph.userData.tex.needsUpdate = true; ph.userData.k = k; }
  // your papel picado on the ofrenda's string (the middle flag in your color, the rest in the others)
  function hangPapel(D) {
    if (!B) return; const order = ['rosa', 'naranja', 'morado', 'verde', 'amarillo', 'azul', 'rojo'].filter(c => c !== D.color);
    B.flags.forEach((f, i) => { const c = f.userData.cv.getContext('2d'); papel(c, Object.assign({}, D, { color: i === 2 ? D.color : order[i % order.length] })); f.userData.tex.needsUpdate = true; });
  }
  // petals: how much of the path is down (0..1, from the grave), and how far from the grave the Hush has grayed it (0..1)
  function petals(laid, grayTo = 0) {
    const P = B.pathM, n = Math.round(clamp(laid, 0, 1) * P.n); P.mesh.count = n; P.mesh.visible = n > 0;
    const g = new THREE.Color('#9a96a6'), c = new THREE.Color(), cut = grayTo * P.L;
    if (P._gray !== grayTo) { P._gray = grayTo; for (let i = 0; i < P.n; i++) { c.copy(P.base[i]); if (P.sAt[i] < cut) c.lerp(g, 0.85); P.mesh.setColorAt(i, c); } P.mesh.instanceColor.needsUpdate = true; }
  }

  // ================================================================ the night (chapter 5): the dome, dimmer lights, a violet fog
  let NIGHT = 0;
  const FOGN = new THREE.Color('#2a2140');
  function nightApply(k) {
    if (!B) return;
    B.dome.visible = k > 0.002; B.dome.material.uniforms.uK.value = k;
    if (k <= 0.002) return;
    const cam = G.w3d && G.w3d.camera; if (cam) B.dome.position.copy(cam.position);
    for (const L of B.lights) L.intensity *= L.isHemisphereLight ? 1 - 0.55 * k : 1 - 0.78 * k;
    const sc = B.scene; if (sc.fog) { sc.fog.color.lerp(FOGN, 0.8 * k); sc.fog.near = lerp(sc.fog.near, 14, k); sc.fog.far = lerp(sc.fog.far, 95, k); }
    if (!B.fogMats) { B.fogMats = []; sc.traverse(o => { const u = o.material && o.material.uniforms; if (u && u.uFogNear && u.uFogFar) B.fogMats.push(u); }); }
    // (the grass has no lighting of its own: only its fog can darken it, so its fog starts behind the camera)
    for (const u of B.fogMats) { const grass = !!u.uPlayer; u.uFogNear.value = grass ? lerp(sc.fog.near, -24, k) : sc.fog.near; u.uFogFar.value = grass ? lerp(sc.fog.far, 46, k) : sc.fog.far; }
  }

  // ================================================================ every frame
  const FEST = { on: false, night: 0, path: -1, gray: 0, visit: false, band: false, music: 0 };
  let waveT = 3, hopT = 0;
  function update(dt, t, you) {
    if (!B) return;
    const on = shown() && !(G.indoors && G.indoors()), Y = G.sim.you, st = on ? S() : null;
    B.root.visible = on;
    for (const c of B.colliders) { c.x = c.x0 + (on ? 0 : 1e5); c.z = c.z0; }
    for (const p of B.people) p.hidden = true;
    if (G.cast) { const c = crown(); if (c) c.visible = hatOn(); }
    if (!on) { ZHF.music.want('mu', null, 0); ZHF.music.frame(t); return; }
    const dPlaza = Math.hypot(Y.x - SPOT.plaza.x, Y.z - SPOT.plaza.z), dGrave = Math.hypot(Y.x - SPOT.grave.x, Y.z - SPOT.grave.z);
    B.town.visible = FEST.on || dPlaza < 150; B.cem.visible = FEST.on || dGrave < 130;
    const c1 = !!st.ch[1];
    for (const [slot, g] of Object.entries(B.items)) g.visible = c1 || !!st.placed[slot];
    for (const id of ROW) { const done = !!st.ch[4] || !!(st.iv[id] && st.iv[id].mem); B.row[id].visible = done; B.favs[id].visible = done; }
    B.board.visible = !!st.ch[3]; B.jars.visible = FEST.on || !!st.ch[5];
    B.luchaG.visible = !!st.lucha;
    const ppKey = st.pp ? JSON.stringify(st.pp) : '';
    if (B.ppKey !== ppKey) { B.ppKey = ppKey; if (st.pp) hangPapel(st.pp); else B.flags.forEach((f, i) => { papel(f.userData.cv.getContext('2d'), { color: ['rosa', 'naranja', 'morado', 'verde', 'amarillo'][i], fig: 'flor', tri: true, circ: true }); f.userData.tex.needsUpdate = true; }); }
    // the people
    const k = B.kid; k.hidden = false; k.root.visible = B.town.visible || FEST.on;
    B.lucha.hidden = !st.lucha; B.lucha.root.visible = !!st.lucha && B.town.visible;
    const bandOn = FEST.band || (!!st.ch[5] && !FEST.on);
    for (const p of B.band) { p.hidden = !bandOn; p.root.visible = bandOn && B.town.visible; }
    const scene = typeof STORY !== 'undefined' && STORY.busy;
    if (!FEST.on && !k.faceAt) {
      if (!scene && (waveT -= dt) <= 0) { waveT = 4 + Math.random() * 5; k.pose = 'wave'; k.waveT = 1.4; }
      if (k.waveT > 0 && (k.waveT -= dt) <= 0) k.pose = 'idle';
      if ((hopT -= dt) <= 0) { hopT = 2.5 + Math.random() * 5; k.hopT = 0.5; }
      k.hop = k.hopT > 0 ? Math.abs(Math.sin((k.hopT -= dt) * 6.3)) * 0.14 : 0;
    }
    if (k.root.visible) ZHF.animate(k, dt, t, FEST.on ? null : you);
    if (B.lucha.root.visible) { B.lucha.pose = Math.sin(t * 0.7) > 0.6 ? 'think' : 'hold'; ZHF.animate(B.lucha, dt, t, null); }
    for (const p of B.band) if (p.root.visible) { if (p.kindM < 2) p.pose = 'drum'; ZHF.animate(p, dt, t, null); p.hop = Math.abs(Math.sin(t * 5.6 + p.kindM)) * 0.05; }
    // candles flicker (and go out in the Hush)
    for (const c of B.candles) { c.t += dt; const f = c.lit * (0.86 + 0.14 * Math.sin(c.t * 13 + Math.sin(c.t * 5.3) * 2)); c.flame.visible = c.lit > 0.05; c.flame.scale.set(1, 0.7 + 0.3 * f, 1); c.halo.material.opacity = 0.55 * f * (0.4 + 0.6 * FEST.night); c.halo.visible = c.lit > 0.05; }
    // the visitors bob
    for (const v of B.visitors) if (v.g.visible) { v.t += dt; v.g.position.y = v.y + Math.sin(v.t * 2.1) * 0.12; v.h.material.opacity = 0.5 + 0.18 * Math.sin(v.t * 3.3); }
    // the path: laid on the night, then it stays (fading to a few petals by the plaza)
    if (FEST.path >= 0) petals(FEST.path, FEST.gray); else if (st.ch[5]) petals(1, 0); else { B.pathM.mesh.visible = false; B.pathM.mesh.count = 0; }
    NIGHT = damp(NIGHT, FEST.on ? FEST.night : 0, 1.4, dt); nightApply(NIGHT);
    // the music: the band during the night, and in the plaza after it (louder as you come near)
    let lvl = 0;
    if (FEST.on && FEST.music) lvl = FEST.music;
    else if (st.ch[5] && B.town.visible) { const d = Math.hypot(Y.x - B.band[1].x, Y.z - B.band[1].z); lvl = 0.45 * (1 - smoothstep(4, 15, d)); }
    ZHF.music.want('mu', 'mu_cempasuchil', lvl, { duck: lvl > 0.01 ? Math.max(0.05, 1 - lvl * 2.6) : 1 }); ZHF.music.frame(t);
  }

  // ================================================================ Mimo's cempasúchil crown (the night's gift)
  let CROWN = null;
  function crown() {
    if (CROWN || !G || !G.cast || !G.cast.mimo || !G.cast.mimo.body) return CROWN;
    const g = new THREE.Group(); g.position.set(0, 0.5, -0.02); g.rotation.set(-0.16, 0, 0.05);
    const k = K(); k.add(ZHF.GEO.tor, '#3f8a3a', 0, 0, 0, 0.27, 0.27, 0.3, Math.PI / 2, 0, 0, { ink: 0 });
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; marigold(k, Math.cos(a) * 0.27, 0.03, Math.sin(a) * 0.27, i % 3 ? 0.85 : 1.05, { ink: 0.004 }); }
    ZHF.bake(g, k); g.visible = false; G.cast.mimo.body.add(g); CROWN = g; return g;
  }
  const hatOn = () => !!(G && G.state && G.state.lang === 'es' && G.state.mu && G.state.mu.crown && !G.state.mu.crownOff);

  // ================================================================ the music: «Flor de veinte pétalos», the band's song
  // A son jarocho–funk groove in 6/8 that swings into 3/4 every other bar (the sesquiáltera): a jarana's bright strums with
  // muted "chk" strokes between, zapateado heels and toe taps on a wooden tarima, a quijada (jawbone) rattle closing each
  // section, a funky finger bass (the leona's part), a requinto picking the hook, then two trumpets in thirds taking it up.
  // D major, 108 to the dotted quarter (162 here: 12 steps a bar). Intro (requinto alone) · A (requinto) · B (trumpets,
  // claps on the hemiola) · C (a breakdown: bass, heels, claps, the jarana creeping back in) · A' (trumpets, requinto fills).
  (function addSong() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const Kt = Sound.kit;
    const HA = Kt.mel('A4/2 D5/2 F#5/2 A5/3 F#5/1 E5/2 | D5/2 B4/2 D5/2 G5/4 r/2 | C#5/2 E5/2 G5/2 A5/2 G5/2 E5/2 | F#5/4 E5/2 D5/6 | A4/2 D5/2 F#5/2 A5/3 B5/1 A5/2 | B5/2 A5/2 G5/2 B5/4 D6/2 | C#6/3 B5/1 A5/2 G5/2 E5/2 C#5/2 | D5/6 r/6');
    const HB = Kt.mel('F#5/4 D5/2 F#5/4 B5/2 | A5/2 G5/2 F#5/2 G5/6 | E5/4 C#5/2 E5/4 A5/2 | G5/2 F#5/2 E5/2 F#5/6 | F#5/4 D5/2 F#5/4 B5/2 | D6/2 C#6/2 B5/2 A5/4 G5/2 | G5/3 F#5/1 E5/2 C#5/3 E5/1 G5/2 | F#5/6 D5/6');
    const CH = { D: [62, 66, 69, 74], G: [62, 67, 71, 74], A7: [61, 64, 67, 69], A: [61, 64, 69, 73], Bm: [62, 66, 71, 74] };
    const RT = { D: 38, G: 43, A7: 45, A: 45, Bm: 47 };
    const PA = ['D', 'G', 'A7', 'D', 'D', 'G', 'A7', 'D'], PB = ['Bm', 'G', 'A', 'D', 'Bm', 'G', 'A7', 'D'], PC = ['D', 'A7', 'D', 'A7'];
    const PCS = [2, 4, 6, 7, 9, 11, 1];      // D major, for the second trumpet's third below
    const third = m => { const i = PCS.indexOf(((m % 12) + 12) % 12); if (i < 0) return m - 3; const j = (i + 5) % 7; return m - (((m % 12) - PCS[j] + 12) % 12); };
    const B68 = [[0, 0, 3, 1], [3, 0, 1, 0.45], [4, 7, 2, 0.8], [6, 12, 2, 0.9], [9, 7, 1, 0.55], [10, 'T', 2, 0.75]];
    const B34 = [[0, 0, 2, 1], [2, 12, 1, 0.5], [4, 7, 2, 0.9], [6, 0, 1, 0.5], [8, 'S', 2, 0.9], [10, 7, 1, 0.55], [11, 7, 1, 0.4]];
    const BRK = [[0, 0, 2, 1], [2, 12, 1, 0.7], [3, 10, 1, 0.6], [4, 7, 2, 0.9], [6, 0, 1, 0.6], [7, 3, 1, 0.6], [8, 4, 2, 0.9], [10, 7, 1, 0.7], [11, 9, 1, 0.6]];
    Sound.addSong('mu_cempasuchil', { bpm: 162, len: 360, from: 24, swing: 0.04, vol: 0.52, verb: 0.14, echo: 0.06, echoSteps: 3,
      play(i, t, s16) {
        const b = Math.floor(i / 12), st = i % 12;
        const sec = b < 2 ? 'I' : b < 10 ? 'A' : b < 18 ? 'B' : b < 22 ? 'C' : 'A2', pb = sec === 'I' ? b : sec === 'A' ? b - 2 : sec === 'B' ? b - 10 : sec === 'C' ? b - 18 : b - 22;
        const cn = sec === 'B' ? PB[pb] : sec === 'C' ? PC[pb] : PA[pb % 8], C = CH[cn], R = RT[cn];
        const hem = (b & 1) === 1, acc = hem ? (st === 0 || st === 4 || st === 8) : (st === 0 || st === 6);
        // the requinto: the hook in the intro and in A
        if (sec === 'I' || sec === 'A') { const n = HA[(pb % 8) * 12 + st]; if (n) Kt.string(n[0], t, 0.95, Math.min(0.5, n[1] * s16 * 1.4), 1.8); }
        if (sec === 'I') { if (b === 1 && st === 8) Kt.scrape(t, s16 * 3, 0.9, 2600, 34); return; }
        // the jarana: strums on every eighth, accents on the beats, muted strokes between (it sits out the breakdown's start)
        if (!(sec === 'C' && pb < 2) && !(st & 1)) {
          if (acc) Kt.strum(C, t, 0.95, 0.2, 2.3, false);
          else { Kt.strum(C, t, 0.45, 0.06, 2.6, ((st >> 1) & 1) === 1); Kt.chk(t, 0.75); }
        }
        // zapateado: heels on the accents, toe taps between, a roll into every fourth bar
        if (acc) Kt.tom(t, 210, sec === 'C' ? 0.9 : 0.7);
        else if (st === 3 || st === 9 || (hem && st === 6)) Kt.rim(t, 0.5);
        if (b % 4 === 3 && st >= 9) Kt.rim(t, 0.35 + (st - 9) * 0.12);
        if (pb % 8 === 7 && st === 9 || (sec === 'C' && pb === 1 && st === 9)) Kt.scrape(t, s16 * 2.6, 0.85, 2600, 34);
        // the bass
        const BL = sec === 'C' && pb < 2 ? BRK : hem ? B34 : B68;
        for (const [at, iv, len, v] of BL) if (st === at) { const m = R + (iv === 'T' ? (cn === 'Bm' ? 3 : 4) : iv === 'S' ? (cn === 'A7' ? 10 : 12) : iv); Kt.fbass(m, t, len * s16 * 0.95, v); }
        if (sec === 'C' && pb < 2 && st === 2) Kt.chopper(R + 24, t, 0.09, 0.55, true);
        if (sec === 'C' && pb === 3 && st === 0) Kt.swell(t, s16 * 12, 0.9);
        // claps on the hemiola, and a soft kick under the trumpets
        if (sec !== 'A' && ((hem && (st === 4 || st === 8)) || (!hem && st === 6))) Kt.claps(t, 0.55);
        if ((sec === 'B' || sec === 'A2') && acc && st !== 4) Kt.kick(t, 0.5);
        // the trumpets, in thirds: the B tune, then the hook again in A'
        const tn = sec === 'B' ? HB[pb * 12 + st] : sec === 'A2' ? HA[pb * 12 + st] : null;
        if (tn) { const d = tn[1] * s16 * 0.92; Kt.lead(tn[0], t, d, 'trumpet', 0.85); Kt.lead(third(tn[0]), t, d, 'trumpet', 0.55); }
        if (sec === 'A2' && !(st & 1) && !tn) Kt.string(C[(st >> 1) % C.length] + 12, t, 0.35, 0.18, 1.8);
        if (sec === 'C' && (pb === 1 || pb === 3) && (st === 10 || st === 11)) { Kt.lead(74 + (st - 10) * 2, t, 0.1, 'trumpet', 0.6); Kt.lead(78 + (st - 10) * 2, t, 0.1, 'trumpet', 0.45); }
      } });
  })();

  // ================================================================ scene helpers
  const lock = on => { if (G) G.sim.lock = on ? 1 : 0; };
  const fadeTo = (to, ms) => { if (!MUI.fast) return UI.fade(to, ms); const el = document.getElementById('fade'); if (el) { el.style.transition = 'none'; el.style.opacity = to; } return Promise.resolve(); };      // (tests: no waiting on timers in a hidden tab)
  const front = (p, d) => ({ x: p.x + Math.sin(p.baseYaw !== undefined ? p.baseYaw : p.yaw || 0) * d, z: p.z + Math.cos(p.baseYaw !== undefined ? p.baseYaw : p.yaw || 0) * d });
  function standAt(f, look) {
    const Y = G.sim.you, M = G.sim.mimo; Y.x = f.x; Y.z = f.z; Y.yaw = Math.atan2(look.x - Y.x, look.z - Y.z);
    M.x = f.x + Math.cos(Y.yaw) * 0.9; M.z = f.z - Math.sin(Y.yaw) * 0.9; M.station = null; M.wander = null; M.look = { x: look.x, z: look.z };
    [Y.x, Y.z] = WORLD.pushOut(Y.x, Y.z, 0.4); [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3); G.sim.snap();
  }
  const standBy = () => standAt(front(B.kid, 1.9), B.kid);
  function shotOf(p, d = 3.6, h = 1.9, side = 1.4) { const yaw = p.baseYaw !== undefined ? p.baseYaw : p.yaw || 0, f = front(p, d), y = p.y !== undefined ? p.y : B.gy(p.x, p.z); G.cam.override = { pos: V3(f.x + Math.cos(yaw) * side, y + h, f.z - Math.sin(yaw) * side), look: V3(p.x, y + 0.9, p.z) }; }
  const shotKid = () => shotOf(B.kid);
  const shot = (p, l) => { G.cam.override = { pos: V3(p[0], p[1], p[2]), look: V3(l[0], l[1], l[2]) }; };
  function shotAltar(d = 4.2, h = 2.2) { const f = ALT.at(1.7, d), y = B.gy(SPOT.alt.x, SPOT.alt.z); G.cam.override = { pos: V3(f.x, y + h, f.z), look: V3(SPOT.alt.x, y + 1.25, SPOT.alt.z) }; }
  async function scene(fn) {
    lock(true);
    try { await fn(); } catch (e) { console.error('[muertos] scene', e); }
    finally { G.cam.override = null; lock(false); if (G.sim.mimo) G.sim.mimo.look = null; if (!FEST.on) G.fx.hush = 0; if (G.save) G.save(); }
  }
  // Xochi walks along to wherever the chapter happens, then goes back to her wagon
  function kidTo(x, z, look) { const k = B.kid; k.x = x; k.z = z; k.y = B.gy(x, z); if (look) k.baseYaw = k.yaw = Math.atan2(look.x - x, look.z - z); k.away = true; }
  function kidHome() { const k = B.kid; if (!k.away) return; k.away = false; k.x = SPOT.kid.x; k.z = SPOT.kid.z; k.y = B.gy(k.x, k.z); k.yaw = k.baseYaw = SPOT.kid.yaw; k.faceAt = null; k.pose = 'idle'; }
  // the people who talk: ours, and Alba's (through a stand-in, so their own lines stay theirs)
  const nameOf = p => (typeof p.name === 'string' ? p.name : p.name && p.name.es) || '';
  async function speak(p, key, o = {}) {
    if (!p || typeof STORY === 'undefined') return;
    const L = typeof key === 'string' ? lineOf(key) : { es: sub(key[0]), en: sub(key[1]) };
    const pr = { id: (p.id || 'mu') + '', name: o.name || nameOf(p), x: p.x, y: p.y !== undefined ? p.y : B.gy(p.x, p.z), z: p.z, top: p.top || 2.1, lines: { es: L.es, en: L.en } };
    p.talking = true;
    try { await STORY.sayInline(pr, true); } finally { p.talking = false; }
  }
  const npcP = (id, name) => { const n = G.sim.npc && G.sim.npc(id); return n ? Object.assign(n, { _muName: name }) : null; };
  const townP = id => { const L = G.town && G.town.people; return L ? L.find(p => p.id === id) || null : null; };
  const domP = () => { const L = G.domino && G.domino.people; return L ? L.find(p => p.id === 'dm.fello') || null : null; };
  const tinaP = () => { const L = G.cemetery && G.cemetery.people; return L ? L.find(p => p.id === 'tina') || null : null; };
  const WHO = { kid: () => B.kid, lucha: () => B.lucha, marta: () => npcP('baker'), rosa: () => npcP('rosa'), otto: () => townP('otto'), clara: () => townP('clara'), fello: () => domP(), tina: () => tinaP() };
  const NAMES = { kid: 'Xochi', lucha: 'Abuela Lucha', marta: 'Marta', rosa: 'Rosa', otto: 'Otto', clara: 'Clara', fello: 'Don Fello', tina: 'Doña Tina' };
  const say = (who, key) => speak(WHO[who](), key, { name: NAMES[who] });
  const you = text => STORY.you(sub(text)), think = (text, s) => STORY.think(sub(text), s);
  const coins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; try { Sound.play('chest'); } catch (e) { /* */ } UI.toast(`${why}: +${n} coins`); };
  const sparkle = (x, y, z, n = 14, cols = ['#ffd23f', '#f39a1e', '#ff6b9a']) => { try { G.w3d.fx.sparkle(x, y, z, n, cols); } catch (e) { /* */ } };
  const later = () => think('Xochi waves: «¡Luego seguimos!» (We’ll carry on later!)', 3.5);
  const iconCv = (key, s = 110) => { const cv = ICONS.canvas(key, s * 2); cv.style.width = cv.style.height = s + 'px'; return cv; };
  const altarWorld = (lx, ly, lz) => { const p = ALT.at(lx, lz); return { x: p.x, y: B.gy(SPOT.alt.x, SPOT.alt.z) + ly, z: p.z }; };

  // ================================================================ chapter 1: la ofrenda
  const L1 = [
    { id: 'ph.mu.cempasuchil', icon: 'muFlor', say: ['Primero, el cempasúchil. ¡Huele!', 'First, the marigold. Smell it!'] },
    { id: 'ph.mu.vela', icon: 'muVela', say: ['Las velas iluminan el camino.', 'The candles light the way.'] },
    { id: 'ph.mu.pan', icon: 'muPan', say: ['Pan dulce para las visitas.', 'Sweet bread for the visitors.'] },
    { id: 'ph.mu.papel', icon: 'muPapel', say: ['¡Mi favorito! Papel de colores.', 'My favorite! Colored paper.'] },
    { id: 'ph.mu.foto', icon: 'muFoto', say: ['La foto de la persona, arriba.', 'The person’s photo, up top.'] },
    { id: 'ph.mu.agua', icon: 'muAgua', say: ['Vienen de muy lejos… ¡llegan con sed!', 'They come from very far away… they arrive thirsty!'] },
    { id: 'ph.mu.sal', icon: 'muSal', say: ['Y un poquito de sal.', 'And a little salt.'] },
  ].map(o => Object.assign(item(o.id), o, { art: el => el.appendChild(iconCv(o.icon, 96)) }));
  // the altar, as a drawing: [tier, column] per place (3 the top level; columns as you look at it)
  const SLOT = { t0: [3, 0], t1: [3, 1], t2: [3, 2], m0: [2, 0], m1: [2, 1], m2: [2, 2], b0: [1, 0], b1: [1, 1], b2: [1, 2] };
  const ITEM_AT = { t0: 'vela', t1: 'foto', t2: 'vela', m0: 'agua', m1: 'pan', m2: 'choco', b0: 'sal', b1: 'flores', b2: 'calav', arch: 'papel', floor: 'petalos' };
  const ICON_OF = { vela: 'muVela', foto: 'muFoto', agua: 'muAgua', pan: 'muPan', choco: 'muChoco', sal: 'muSal', flores: 'muFlor', calav: 'muCalavera', papel: 'muPapel', petalos: 'muFlor' };
  const OBJ = { vela: ['vela', 'velas', 'veladora', 'velita'], foto: ['foto', 'fotografia', 'retrato'], agua: ['agua', 'vaso'], pan: ['pan'], choco: ['chocolate', 'taza'], sal: ['sal'],
    flores: ['flores', 'flor', 'cempasuchil', 'cempasuchitl', 'florero', 'maceta'], calav: ['calaverita', 'calavera'], papel: ['papel picado', 'papel', 'banderitas'], petalos: ['petalos', 'petalo'], ofrenda: ['ofrenda', 'altar', 'mesa'] };
  const XY = { t0: [165, 132], t1: [220, 132], t2: [275, 132], m0: [135, 187], m1: [220, 187], m2: [305, 187], b0: [105, 242], b1: [220, 242], b2: [335, 242], arch: [220, 58], floor: [220, 318] };
  function drawAltar(c, placed, target, fly) {
    c.clearRect(0, 0, 440, 340);
    c.fillStyle = '#3a2a4a'; c.fillRect(0, 0, 440, 340); c.fillStyle = '#5a3f6a'; c.fillRect(0, 300, 440, 40);
    c.fillStyle = '#4a2a5a'; c.fillRect(118, 40, 204, 92);
    for (let i = 0; i <= 22; i++) { const a = Math.PI * i / 22, x = 220 - Math.cos(a) * 132, y = 240 - Math.sin(a) * 214; c.fillStyle = i % 2 ? '#f7b52c' : '#f39a1e'; c.beginPath(); c.arc(x, y, 7, 0, TAU); c.fill(); }
    [[70, 240, 300, 60, '#7b4bb0'], [105, 187, 230, 53, '#e2337f'], [140, 132, 160, 55, '#1fa3a0']].forEach(([x, y, w, h, col]) => { c.fillStyle = col; c.fillRect(x, y, w, h); c.fillStyle = '#fff8ec'; c.fillRect(x - 3, y - 4, w + 6, 6); c.strokeStyle = '#2b2235'; c.lineWidth = 2; c.strokeRect(x, y, w, h); for (let k = 0; k < w / 16; k++) { c.fillStyle = ['#f5c518', '#f39a1e', '#3fa34d', '#fff8ec'][k % 4]; c.beginPath(); c.moveTo(x + k * 16 + 2, y + 2); c.lineTo(x + k * 16 + 14, y + 2); c.lineTo(x + k * 16 + 8, y + 11); c.fill(); } });
    const drawItem = (slot, alpha = 1, at) => {
      const key = ITEM_AT[slot], [x, y] = at || XY[slot]; c.globalAlpha = alpha;
      if (slot === 'arch') { c.strokeStyle = '#2b2235'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(150, 46); c.quadraticCurveTo(220, 58, 290, 46); c.stroke(); ['#e2337f', '#f39a1e', '#7b4bb0', '#3fa34d', '#f5c518'].forEach((col, i) => { const fx = 158 + i * 28; c.fillStyle = col; c.fillRect(fx, 49, 20, 24); }); }
      else if (slot === 'floor') { for (let i = 0; i < 40; i++) { const a = i * 2.4, r = 4 + (i % 10) * 3.4; c.fillStyle = i % 2 ? '#f39a1e' : '#f7b52c'; c.beginPath(); c.ellipse(x + Math.cos(a) * r * 1.8, y + Math.sin(a) * r * 0.45, 4, 2.4, a, 0, TAU); c.fill(); } }
      else { const s = key === 'foto' ? 64 : 50; c.drawImage(ICONS.canvas(ICON_OF[key], 128), x - s / 2, y - s + 8, s, s); }
      c.globalAlpha = 1;
    };
    for (const s of Object.keys(XY)) if (placed[s] && s !== fly) drawItem(s);
    if (target && !placed[target]) {
      const [x, y] = XY[target], r = target === 'arch' ? 34 : target === 'floor' ? 26 : 26, cy = target === 'arch' ? 60 : target === 'floor' ? 316 : y - 18;
      c.setLineDash([5, 4]); c.strokeStyle = '#ffd166'; c.lineWidth = 3; c.beginPath(); c.ellipse(x, cy, target === 'arch' ? 74 : r, target === 'floor' ? 14 : r, 0, 0, TAU); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#ffd166'; c.font = '900 22px Bahnschrift, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', x, cy);
      // Mimo holds it (top right)
      c.fillStyle = '#fff8ec'; c.strokeStyle = '#2b2235'; c.lineWidth = 2.5; c.beginPath(); c.roundRect ? c.roundRect(350, 8, 82, 92, 12) : c.rect(350, 8, 82, 92); c.fill(); c.stroke();
      c.drawImage(ICONS.canvas(ICON_OF[ITEM_AT[target]], 128), 362, 14, 58, 58); c.fillStyle = '#2b2235'; c.font = '800 12px Trebuchet MS, sans-serif'; c.fillText(mimo() + ' has it', 391, 86);
    }
    if (fly) drawItem(fly.slot, 1, fly.at);
  }
  // what you typed: the thing (or "it"), the place word, and what it's next to / under / between…
  const PREPS = [['left', /\ba la izquierda (?:de|del)\b(.*)/], ['right', /\ba la derecha (?:de|del)\b(.*)/], ['side', /\b(?:al otro lado|al lado|junto) (?:de|del|a|al)\b(.*)/],
    ['above', /\b(?:encima|arriba) (?:de|del)\b(.*)/], ['above', /\bsobre\b(.*)/], ['below', /\b(?:debajo|abajo) (?:de|del)\b(.*)/], ['below', /\bbajo\b(.*)/],
    ['front', /\b(?:delante|enfrente|en frente) (?:de|del)\b(.*)/], ['front', /\bfrente (?:a|al)\b(.*)/], ['between', /\b(?:entre|en medio de|en medio del)\b(.*)/]];
  const objIn = s => { const n = ' ' + s + ' ', out = []; for (const [k, list] of Object.entries(OBJ)) for (const w of list) { const i = n.indexOf(' ' + w + ' '); if (i >= 0) { out.push({ k, i }); break; } } return out.sort((a, b) => a.i - b.i).map(o => o.k); };
  function placeCheck(text, target, placed) {
    const n = MUI.N(text), want = ITEM_AT[target];
    const verb = /\b(pon|ponla|ponlo|ponlas|ponlos|ponle|coloca|colocala|colocalo|colocalas|colocalos|deja|dejala|dejalo|cuelga|cuelgalo|cuelgala|cuelgalos|mete|echa|echalos|pone|ponga|coloque|deje|cuelgue|pongan)\b/.test(n);
    const clitic = /\b(ponla|ponlo|ponlas|ponlos|colocala|colocalo|colocalas|colocalos|dejala|dejalo|cuelgalo|cuelgala|cuelgalos|echalos)\b/.test(n);
    let rel = null, rest = '';
    for (const [r, re] of PREPS) { const m = n.match(re); if (m) { rel = r; rest = m[1] || ''; break; } }
    const before = rel ? n.slice(0, n.length - rest.length) : n;
    const objOk = clitic || OBJ[want].some(w => (' ' + before + ' ').includes(' ' + w + ' '));
    const note = /\bde el\b/.test(n) ? 'de + el = <b>del</b>' : /\ba el\b/.test(n) ? 'a + el = <b>al</b>' : '';
    const loose = target === 'arch' ? /\barriba\b/.test(n) && !rel : target === 'floor' ? /\b(en el suelo|en el piso)\b/.test(n) : false;
    if (!rel && !loose) return { ok: false, why: 'Say where: «… al lado de…», «… encima de…», «… debajo de…», «… entre… y…», «… delante de…»' };
    const refs = objIn(rest).filter(k => k !== want || (want === 'vela' && target === 't0'));
    const T = SLOT[target], at = k => Object.keys(SLOT).filter(s => placed[s] && ITEM_AT[s] === k).map(s => SLOT[s]);
    let ok = loose;
    if (!ok && target === 'arch') ok = rel === 'above' && (refs.length === 0 || refs.some(k => k === 'ofrenda' || at(k).length));
    else if (!ok && target === 'floor') ok = rel === 'front' && refs.some(k => k === 'ofrenda' || ['flores', 'sal', 'calav', 'pan'].includes(k));
    else if (!ok && T) {
      const R1 = refs[0] ? at(refs[0]) : [], R2 = refs[1] ? at(refs[1]) : [];
      if (rel === 'between') ok = R1.some(a => R2.some(b => a[0] === T[0] && b[0] === T[0] && Math.min(a[1], b[1]) === T[1] - 1 && Math.max(a[1], b[1]) === T[1] + 1));
      else ok = R1.some(a => rel === 'side' ? a[0] === T[0] && Math.abs(a[1] - T[1]) === 1 : rel === 'left' ? a[0] === T[0] && T[1] === a[1] - 1 : rel === 'right' ? a[0] === T[0] && T[1] === a[1] + 1
        : rel === 'above' ? T[0] === a[0] + 1 && a[1] === T[1] : rel === 'below' ? T[0] === a[0] - 1 && a[1] === T[1] : false);
    }
    if (!ok) {
      const lr = (rel === 'left' || rel === 'right') && refs[0] ? ' (Left and right: as you look at the ofrenda.)' : '';
      return { ok: false, why: refs.length ? `Look at the plan: that’s not where the dotted ring is.${lr}` : 'Next to what? Say what it’s next to, on top of, under…: «… de la foto».' };
    }
    if (!objOk) return { ok: false, why: `Tell ${esc(mimo())} what: «Pon ${esc(PLACE_NOUN[want])}…»` };
    return { ok: true, minor: !verb, note: [!verb ? 'next time start with «Pon…»' : '', note].filter(Boolean).join(' · ') };
  }
  const PLACE_NOUN = { vela: 'la vela', foto: 'la foto', agua: 'el agua', pan: 'el pan', choco: 'el chocolate', sal: 'la sal', flores: 'las flores', calav: 'la calaverita', papel: 'el papel picado', petalos: 'los pétalos' };
  const BUILD = [
    { slot: 't2', model: 'Pon la vela al lado de la foto.', modelEn: 'Put the candle next to the photo.', say: ['¿Dónde va la vela?', 'Where does the candle go?'] },
    { slot: 't0', model: 'Pon la otra vela al otro lado de la foto.', modelEn: 'Put the other candle on the other side of the photo.', say: ['¡Otra vela! ¿Dónde?', 'Another candle! Where?'] },
    { slot: 'm0', model: 'Pon el agua debajo de la vela.', modelEn: 'Put the water under the candle.', say: ['El agua. ¡Vienen con sed!', 'The water. They come thirsty!'] },
    { slot: 'm2', model: 'Pon el chocolate debajo de la otra vela.', modelEn: 'Put the chocolate under the other candle.', say: ['A mi bisabuela le encantaba el chocolate. ¿Dónde lo ponemos?', 'My great-grandma loved chocolate. Where do we put it?'] },
    { slot: 'm1', model: 'Pon el pan entre el agua y el chocolate.', modelEn: 'Put the bread between the water and the chocolate.', say: ['¡El pan de muerto! ¿Dónde va?', 'The pan de muerto! Where does it go?'] },
    { slot: 'b1', model: 'Pon las flores debajo del pan.', modelEn: 'Put the flowers under the bread.', say: ['¡Cempasúchil! ¿Dónde?', 'Marigolds! Where?'] },
    { slot: 'b0', model: 'Pon la sal al lado de las flores.', modelEn: 'Put the salt next to the flowers.', say: ['La sal, para purificar.', 'The salt, to purify.'] },
    { slot: 'b2', model: 'Pon la calaverita al otro lado de las flores.', modelEn: 'Put the sugar skull on the other side of the flowers.', say: ['¡Y mi calaverita de azúcar!', 'And my sugar skull!'] },
    { slot: 'arch', model: 'Pon el papel picado encima de la foto.', modelEn: 'Put the papel picado above the photo.', say: ['¡El papel picado! ¿Dónde lo colgamos?', 'The papel picado! Where do we hang it?'] },
    { slot: 'floor', model: 'Pon los pétalos delante de la ofrenda.', modelEn: 'Put the petals in front of the ofrenda.', say: ['Y los pétalos… ¡son el camino!', 'And the petals… they’re the path!'] },
  ];
  function buildSteps() {
    const st = S(); let cv = null;
    return BUILD.map((b, i) => ({
      kind: `Tell ${mimo()} where it goes · ${i + 1} of ${BUILD.length}`, say: b.say, model: b.model, modelEn: b.modelEn,
      gl: i === 0 ? 'Mimo has something; the dotted ring shows where it goes. Say where, next to what’s already there: <b>Pon … al lado de / encima de / debajo de / entre … y … / delante de …</b>' : '',
      note: i === 0 ? 'Left and right: as you look at it. de + el = del: «debajo del pan».' : '',
      placeholder: 'Pon … al lado de …', skip: () => !!st.placed[b.slot],
      art: el => { cv = document.createElement('canvas'); cv.width = 440; cv.height = 340; cv.style.width = '440px'; cv.style.maxWidth = '100%'; el.appendChild(cv); drawAltar(cv.getContext('2d'), st.placed, b.slot); },
      check: t => placeCheck(t, b.slot, st.placed),
      onOk: async () => {
        try { Sound.play('pip'); } catch (e) { /* */ }
        const [x1, y1] = XY[b.slot], x0 = 391, y0 = 70, c = cv && cv.getContext('2d');
        if (c && !MUI.fast) for (let f = 1; f <= 14; f++) { const u = f / 14, hop = Math.sin(u * Math.PI) * 60; drawAltar(c, st.placed, null, { slot: b.slot, at: [lerp(x0, x1, u), lerp(y0, y1, u) - hop] }); await new Promise(r => setTimeout(r, 28)); }
        st.placed[b.slot] = true; if (c) drawAltar(c, st.placed, null);
        const P = slotWorld(b.slot); sparkle(P.x, P.y + 0.3, P.z, 10);
      },
    }));
  }
  const SLOT3D = { t0: [-0.5, 1.4, -0.27], t1: [0, 1.5, -0.32], t2: [0.5, 1.4, -0.27], m0: [-0.62, 0.95, 0.06], m1: [0, 0.95, 0.06], m2: [0.62, 0.95, 0.06], b0: [-0.8, 0.55, 0.33], b1: [0, 0.6, 0.33], b2: [0.8, 0.55, 0.33], arch: [0, 2.4, -0.36], floor: [0, 0.1, 1.0] };
  const slotWorld = s => altarWorld(...SLOT3D[s]);
  async function meet() {
    const st = S();
    await scene(async () => {
      standBy(); shotKid();
      B.kid.pose = 'wave'; await say('kid', 'x.hi'); B.kid.pose = 'idle';
      await say('kid', 'x.name'); await say('kid', 'x.nahuatl'); await say('kid', 'x.soon');
      await you('The Day of the Dead? That sounds a little spooky…');
      B.kid.pose = 'cheer'; await say('kid', 'x.notscary'); B.kid.pose = 'idle';
      await say('kid', 'x.remember'); await say('kid', 'x.bisa');
      shotAltar(7, 3.6); await say('kid', 'x.plan');
      shotKid(); await say('kid', 'x.hush');
      await you('Then {mimo} and I will help!');
      st.met = true;
    });
    if (!CH[0].gate(flags())) { think('Xochi: «¡Primero ve a conocer a Rosa! Luego empezamos.» (Go meet Rosa first! Then we’ll start.)', 4.5); return; }
    const go = await UI.choose('Xochi: «¿Empezamos?» (Shall we start?)', [{ label: 'Chapter 1 now: La ofrenda', sub: `what goes on it and why; then build it with ${mimo()}`, value: 1 }, { label: 'Later', value: 0 }]);
    if (go) await chapter1();
  }
  async function chapter1() {
    const st = S();
    if (!st.l1) {
      await scene(async () => { standBy(); shotKid(); await say('kid', 'x.wagon'); });
      const r = await MUI.lesson({ title: 'La ofrenda', sub: 'what goes on it, and why', face: 'muKid', name: 'Xochi', intro: ['¡Mira! Todo esto va en la ofrenda.', 'Look! All of this goes on the ofrenda.'], items: L1, recall: false });
      if (r.quit) return later();
      st.l1 = true; teachAll(L1.map(o => o.id));
    }
    await fadeTo(1, 350); kidTo(...Object.values(ALT.at(-1.9, 1.4)), FRONT); standAt(FRONT, SPOT.alt); await fadeTo(0, 350);
    await scene(async () => { kidTo(...Object.values(ALT.at(-1.9, 1.4)), SPOT.alt); shotAltar(); await say('kid', 'x.build'); await say('kid', 'x.photo'); st.placed.t1 = true; const P = slotWorld('t1'); sparkle(P.x, P.y, P.z, 14); try { Sound.play('learned'); } catch (e) { /* */ } });
    kidTo(...Object.values(ALT.at(-1.9, 1.4)), SPOT.alt);
    const r = await MUI.steps(buildSteps(), { title: 'La ofrenda', sub: `build it: tell ${mimo()} where each thing goes`, face: 'muKid', name: 'Xochi', intro: ['¿Dónde va cada cosa? ¡Tú dices!', 'Where does each thing go? You tell us!'] });
    if (r.quit) { kidHome(); return later(); }
    st.ch[1] = true; st.g1 = r.grades;
    await scene(async () => {
      kidTo(...Object.values(ALT.at(-1.9, 1.4)), SPOT.alt); shotAltar(4.6, 2.0);
      for (const s of ['t0', 't2']) { const P = slotWorld(s); sparkle(P.x, P.y + 0.15, P.z, 8, ['#ffd23f', '#fff3a0']); }
      try { Sound.play('chime'); } catch (e) { /* */ }
      B.kid.pose = 'cheer'; await say('kid', 'x.done1'); B.kid.pose = 'idle';
    });
    kidHome();
    teachAll(['ph.mu.ofrenda', 'ph.mu.allado', 'ph.mu.encima', 'ph.mu.debajo', 'ph.mu.entre', 'ph.mu.quepadre']);
    coins(6, 'Xochi shares her marigold money');
    UI.toast('In your Phrasebook: al lado de, encima de, debajo de, entre… y…, ¡Qué padre!');
  }

  // ================================================================ chapter 2: pan de muerto (with Marta) and papel picado (with abuela Lucha)
  // a recipe step: Marta reads it in the infinitive; you tell Mimo as an order (tú)
  const RECIPE = [
    { inf: 'Mezclar la harina y el azúcar.', verbs: ['mezcla', 'revuelve', 'bate'], obj: ['harina', 'azucar', 'todo'], model: 'Mezcla la harina y el azúcar.', en: 'Mix the flour and the sugar.', bad: { mezclar: 'mezcla', mezcle: 'mezcla' } },
    { inf: 'Añadir los huevos y la mantequilla.', verbs: ['anade', 'agrega', 'echa', 'pon', 'ponle', 'anadele', 'agregale', 'echale'], obj: ['huevos', 'huevo', 'mantequilla'], model: 'Añade los huevos y la mantequilla.', en: 'Add the eggs and the butter.', bad: { anadir: 'añade', agregar: 'agrega', anada: 'añade' } },
    { inf: 'Amasar la masa.', verbs: ['amasa', 'amasala'], obj: null, model: 'Amasa la masa.', en: 'Knead the dough.', bad: { amasar: 'amasa', amase: 'amasa' } },
    { inf: 'Formar una bola.', verbs: ['forma', 'haz'], obj: ['bola', 'pelota'], model: 'Forma una bola.', en: 'Shape a ball.', bad: { formar: 'forma', forme: 'forma' } },
    { inf: 'Hacer los huesitos.', verbs: ['haz'], obj: ['huesitos', 'huesos', 'hueso', 'huesito'], model: 'Haz los huesitos.', en: 'Make the little bones.', bad: { hacer: 'haz', hace: 'haz', haces: 'haz', haga: 'haz' }, irr: 'hacer → <b>haz</b>: an irregular order' },
    { inf: 'Poner los huesitos encima.', verbs: ['pon', 'ponle', 'coloca'], obj: ['huesitos', 'huesos', 'encima', 'arriba'], model: 'Pon los huesitos encima.', en: 'Put the little bones on top.', bad: { poner: 'pon', pone: 'pon', pones: 'pon', ponga: 'pon' }, irr: 'poner → <b>pon</b>: irregular too' },
    { inf: 'Meter el pan al horno.', verbs: ['mete', 'metelo', 'hornea', 'pon'], obj: ['horno', 'pan'], model: 'Mete el pan al horno.', en: 'Put the bread in the oven.', bad: { meter: 'mete', hornear: 'hornea', meta: 'mete' } },
    { inf: 'Echar azúcar encima.', verbs: ['echa', 'echale', 'pon', 'ponle', 'espolvorea'], obj: ['azucar'], model: 'Échale azúcar.', en: 'Sprinkle sugar on it.', bad: { echar: 'echa', eche: 'echa' } },
  ];
  function recipeCheck(R, text) {
    const w = MUI.N(text).split(' '), verb = R.verbs.some(v => w.includes(v)), obj = !R.obj || R.obj.some(o => MUI.has(text, o));
    if (verb && obj) return { ok: true };
    const b = Object.keys(R.bad).find(k => w.includes(k));
    if (b) return { ok: false, why: `Almost! As an order to ${esc(mimo())}: ${esc(b)} → <b>${esc(R.bad[b])}</b>${R.irr ? ' (' + R.irr + ')' : ''}` };
    if (verb) return { ok: false, why: `${esc(cap(R.verbs[0]))}… what? «${esc(R.model)}»` };
    return { ok: false, why: `The recipe says «${esc(R.inf)}». Tell ${esc(mimo())} as an order${R.irr ? ' (' + R.irr + ')' : ''}.` };
  }
  // the bread on Marta's table, step by step (0: flour and sugar … 8: sugar on the baked loaf)
  function drawBread(c, s) {
    const W = 360, Hh = 210; c.clearRect(0, 0, W, Hh); c.fillStyle = '#f4e3c6'; c.fillRect(0, 0, W, Hh); c.fillStyle = '#c99a6a'; c.fillRect(0, 150, W, 60);
    const ink = '#2b2235', bowl = () => { c.fillStyle = '#3e8f8a'; c.beginPath(); c.moveTo(90, 100); c.lineTo(270, 100); c.quadraticCurveTo(260, 168, 180, 168); c.quadraticCurveTo(100, 168, 90, 100); c.closePath(); c.fill(); c.strokeStyle = ink; c.lineWidth = 3; c.stroke(); };
    if (s >= 7) { c.fillStyle = '#5a4a44'; c.fillRect(70, 30, 220, 130); c.fillStyle = s === 7 ? '#ff9a3c' : '#3a2b26'; c.fillRect(90, 50, 180, 90); c.strokeStyle = ink; c.lineWidth = 3; c.strokeRect(70, 30, 220, 130); if (s === 7) { c.globalAlpha = 0.35; c.fillStyle = '#ffd166'; c.fillRect(90, 50, 180, 90); c.globalAlpha = 1; } }
    if (s <= 3) {
      bowl();
      if (s === 0) { c.fillStyle = '#fffaf0'; c.beginPath(); c.ellipse(150, 100, 34, 14, 0, Math.PI, TAU); c.fill(); c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(212, 100, 28, 12, 0, Math.PI, TAU); c.fill(); c.fillStyle = '#e8e2d0'; for (let i = 0; i < 14; i++) c.fillRect(196 + (i * 7) % 30, 92 + (i * 3) % 7, 2, 2); }
      else if (s === 1) { c.fillStyle = '#f7efd8'; c.beginPath(); c.ellipse(180, 100, 70, 16, 0, Math.PI, TAU); c.fill(); }
      else if (s === 2) { c.fillStyle = '#f7efd8'; c.beginPath(); c.ellipse(180, 100, 70, 16, 0, Math.PI, TAU); c.fill(); for (const x of [158, 196]) { c.fillStyle = '#ffd34a'; c.beginPath(); c.arc(x, 94, 10, 0, TAU); c.fill(); } c.fillStyle = '#fff3b0'; c.fillRect(214, 86, 24, 12); }
      else { c.fillStyle = '#efd6a8'; c.beginPath(); c.ellipse(180, 96, 62, 26, 0, Math.PI, TAU); c.fill(); c.strokeStyle = 'rgba(43,34,53,.25)'; c.lineWidth = 2; c.beginPath(); c.arc(170, 92, 18, 3.6, 5.6); c.stroke(); }
    } else {
      const y = s >= 7 ? 140 : 150, crust = s >= 8 ? '#c47a32' : s === 7 ? '#d99a4e' : '#efd6a8';
      if (s <= 6) { c.fillStyle = '#5a4a44'; c.fillRect(80, 150, 200, 8); }
      if (s !== 7) { c.fillStyle = crust; c.beginPath(); c.ellipse(180, y, 70, 46, 0, Math.PI, TAU); c.fill(); c.strokeStyle = ink; c.lineWidth = 3; c.stroke(); }
      if (s === 5) for (const [x, r] of [[300, 0.2], [312, -0.4], [296, 0.9], [318, 0.4]]) { c.save(); c.translate(x, 125); c.rotate(r); c.fillStyle = '#e8c890'; c.beginPath(); c.ellipse(0, 0, 22, 6, 0, 0, TAU); c.fill(); c.restore(); }
      if (s >= 6 && s !== 7) { c.fillStyle = s >= 8 ? '#a8673a' : '#e8c890'; for (const r of [0.55, -0.55]) { c.save(); c.translate(180, y - 26); c.rotate(r); c.beginPath(); c.ellipse(0, 0, 50, 8, 0, 0, TAU); c.fill(); c.strokeStyle = ink; c.lineWidth = 2; c.stroke(); c.restore(); } c.beginPath(); c.arc(180, y - 44, 11, 0, TAU); c.fill(); c.stroke(); }
      if (s >= 8) { c.fillStyle = '#fffdf6'; for (let i = 0; i < 70; i++) c.fillRect(120 + (i * 37) % 120, y - 40 + (i * 13) % 36, 2.4, 2.4); }
    }
  }
  const FLAV = ['naranja', 'azahar', 'mantequilla', 'azucar', 'anis', 'pan', 'vainilla', 'canela', 'huevo', 'chocolate', 'leche', 'flor', 'flores', 'dulce'];
  const TASTE = [
    { say: ['Ya está. Pruébalo. ¿Cómo está?', 'It’s ready. Try it. How is it?'], model: '¡Está delicioso!', modelEn: 'It’s delicious!', check: t => ({ ok: MUI.has(t, ['rico', 'rica', 'delicioso', 'deliciosa', 'buenisimo', 'buenisima', 'riquisimo', 'riquisima', 'sabroso', 'sabrosa', 'bueno', 'muy bueno', 'exquisito', 'padre']) }) },
    { say: ['¿A qué sabe?', 'What does it taste like?'], model: 'Sabe a naranja.', modelEn: 'It tastes like orange.', check: t => { const f = FLAV.some(w => MUI.has(t, w)); return MUI.has(t, 'sabe a') && f ? { ok: true } : f ? { ok: true, minor: true, note: 'the whole thing: «Sabe a …»' } : { ok: false, why: 'saber a + a flavor: «Sabe a naranja», «Sabe a mantequilla»…' }; } },
    { say: ['¿Y a qué huele?', 'And what does it smell like?'], model: 'Huele a mantequilla.', modelEn: 'It smells like butter.', check: t => { const f = FLAV.some(w => MUI.has(t, w)); return MUI.has(t, 'huele a') && f ? { ok: true } : f ? { ok: true, minor: true, note: 'the whole thing: «Huele a …»' } : { ok: false, why: 'oler a: «Huele a mantequilla», «Huele a naranja»… (o → hue)' }; } },
  ];
  async function bakery() {
    const M = npcP('baker'); if (!M) return true;
    await fadeTo(1, 350); const f = front(M, 1.8); standAt(f, M); kidTo(f.x + 1.0, f.z + 0.7, M); await fadeTo(0, 350);
    await scene(async () => { kidTo(f.x + 1.0, f.z + 0.7, M); shotOf(M, 3.6, 1.9); await say('marta', 'm.hi'); await say('marta', 'm.recipe'); await say('marta', 'm.read'); });
    let cv = null, stage = 0;
    const steps = RECIPE.map((R, i) => ({ kind: `Tell ${mimo()} · as an order · ${i + 1} of ${RECIPE.length}`, gl: `<span style="opacity:.6">La receta:</span> «${esc(R.inf)}»`, model: R.model, modelEn: R.en, placeholder: `${mimo()}, …`,
      help: i === 0 ? 'The recipe is in the infinitive (mezclar). An order to a friend: mezcla, añade, amasa…' : '',
      art: el => { cv = document.createElement('canvas'); cv.width = 360; cv.height = 210; cv.style.width = '360px'; cv.style.maxWidth = '100%'; el.appendChild(cv); drawBread(cv.getContext('2d'), stage); },
      check: t => recipeCheck(R, t), onOk: async () => { stage = i + 1; if (cv) drawBread(cv.getContext('2d'), stage); try { Sound.play(i === 6 ? 'poof' : 'pip'); } catch (e) { /* */ } } }));
    const r = await MUI.steps(steps, { title: 'Pan de muerto', sub: 'Doña Esperanza’s recipe, at Marta’s bakery', face: 'muPan', name: 'Marta', intro: ['¡Manos a la masa!', 'Let’s get our hands in the dough!'] });
    if (r.quit) return false;
    await scene(async () => { shotOf(M, 3.6, 1.9); await say('marta', 'm.oven'); });
    const r2 = await MUI.steps(TASTE.map((s, i) => Object.assign({ kind: `Tasting · ${i + 1} of 3`, art: el => el.appendChild(iconCv('muPan', 110)), placeholder: 'en español…' }, s)), { title: 'Pan de muerto', sub: 'still warm', face: 'muPan', name: 'Marta' });
    if (r2.quit) return false;
    await scene(async () => { shotOf(M, 3.6, 1.9); await say('marta', 'm.secret'); await say('marta', 'm.bye'); });
    teachAll(['ph.mu.querico', 'ph.mu.sabea', 'ph.mu.huelea']);
    S().g2 = r.grades.concat(r2.grades);
    return true;
  }
  // papel picado: fold, cut, open; in your color, with your figure
  const COLORS = { rosa: ['rosa', 'rosado', 'rosada'], morado: ['morado', 'morada', 'lila', 'violeta'], naranja: ['naranja', 'anaranjado', 'anaranjada'], amarillo: ['amarillo', 'amarilla'], verde: ['verde'], azul: ['azul'], rojo: ['rojo', 'roja'], blanco: ['blanco', 'blanca'] };
  const FIG_WORDS = { flor: ['flor', 'flores'], pajaro: ['pajaro', 'pajarito', 'ave'], corazon: ['corazon', 'corazones'], calavera: ['calavera', 'calaverita'], estrella: ['estrella', 'estrellas'], luna: ['luna'], sol: ['sol'], mariposa: ['mariposa', 'mariposas'] };
  const findIn = (t, M) => { for (const [k, ws] of Object.entries(M)) if (ws.some(w => MUI.has(t, w))) return k; return null; };
  function drawFold(c, D, s) {
    const W = 300, Hh = 200; c.clearRect(0, 0, W, Hh); c.fillStyle = '#fff4dc'; c.fillRect(0, 0, W, Hh);
    const col = PP_COLORS[D.color] || '#e2337f';
    if (s >= 6) { const cv = document.createElement('canvas'); cv.width = 200; cv.height = 240; papel(cv.getContext('2d'), D); c.drawImage(cv, 90, 4, 120, 144); c.strokeStyle = '#2b2235'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(40, 6); c.lineTo(260, 6); c.stroke(); return; }
    const w = s === 0 ? 180 : s === 1 ? 90 : 45, h = s >= 2 ? 80 : 160, x = (W - w) / 2, y = 20;
    c.fillStyle = col; c.fillRect(x, y, w, h); c.strokeStyle = '#2b2235'; c.lineWidth = 2; c.strokeRect(x, y, w, h);
    if (s >= 1) { c.setLineDash([4, 4]); c.beginPath(); c.moveTo(x + w, y); c.lineTo(x + w, y + h); c.stroke(); c.setLineDash([]); }
    c.fillStyle = '#fff4dc';
    if (D.tri) for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x, y + 8 + k * 18); c.lineTo(x + 8, y + 14 + k * 18); c.lineTo(x, y + 20 + k * 18); c.fill(); }
    if (D.fig && FIGS[D.fig]) { c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip(); FIGS[D.fig](c, x + w, y + h * 0.55, 1.2); c.restore(); }
    if (D.circ) for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x + w * 0.4, y + 12 + k * 24, 4, 0, TAU); c.fill(); }
    c.fillStyle = '#2b2235'; c.font = '800 13px Trebuchet MS, sans-serif'; c.textAlign = 'center'; c.fillText(s === 0 ? 'papel de china' : s === 1 ? 'doblado' : 'doblado otra vez', W / 2, Hh - 12);
  }
  async function papelPicado() {
    const st = S(), first = !st.lucha;
    st.lucha = true;
    await fadeTo(1, 350); const L = B.lucha, f = { x: SPOT.table.x + 1.3, z: SPOT.table.z + 0.9 }; standAt(f, SPOT.table); kidTo(SPOT.table.x + 0.6, SPOT.table.z - 1.0, SPOT.table); await fadeTo(0, 350);
    await scene(async () => { kidTo(SPOT.table.x + 0.6, SPOT.table.z - 1.0, SPOT.table); shot([f.x + 1.6, B.gy(f.x, f.z) + 2.0, f.z + 1.4], [L.x, L.y + 0.9, L.z]);
      if (first) { await say('lucha', 'l.hi'); await you('Hi! I’m helping Xochi with the ofrenda.'); await say('lucha', 'l.me'); }
      await say('lucha', 'l.mama'); });
    const D = { color: 'rosa', fig: null, tri: false, circ: false };
    let cv = null, stage = 0;
    const art = el => { cv = document.createElement('canvas'); cv.width = 300; cv.height = 200; cv.style.width = '300px'; cv.style.maxWidth = '100%'; el.appendChild(cv); drawFold(cv.getContext('2d'), D, stage); };
    const redraw = s => { stage = s; if (cv) drawFold(cv.getContext('2d'), D, s); try { Sound.play('pip'); } catch (e) { /* */ } };
    const cut = (want, set) => t => { const w = MUI.N(t).split(' '); if (!w.some(x => ['corta', 'cortale', 'recorta', 'cortalo', 'haz'].includes(x))) return { ok: false, why: w.includes('cortar') ? 'As an order: cortar → <b>corta</b>' : 'Tell Mimo to cut: «Corta…»' }; const k = want(t); if (!k) return { ok: false, why: 'Cut what?' }; set(k); return { ok: true }; };
    const steps = [
      { kind: 'Choose your paper', say: ['Primero, escoge un color. ¿De qué color lo quieres?', 'First, choose a color. What color do you want it?'], model: 'Rosa, por favor.', modelEn: 'Pink, please.', gl: 'rosa · morado · naranja · amarillo · verde · azul · rojo · blanco', art,
        check: t => { const k = findIn(t, COLORS); if (!k) return { ok: false, why: 'A color: «Rosa, por favor», «Lo quiero morado»…' }; D.color = k; return { ok: true }; }, onOk: async () => redraw(0) },
      { kind: `Tell ${mimo()}: fold it`, say: ['Ahora, dile a ' + mimo() + ': ¡dobla el papel!', 'Now tell ' + mimo() + ': fold the paper!'], model: 'Dobla el papel.', modelEn: 'Fold the paper.', art, check: t => MUI.has(t, ['dobla', 'doblalo', 'doblala']) ? { ok: true } : { ok: false, why: MUI.has(t, 'doblar') ? 'As an order: doblar → <b>dobla</b>' : 'Fold: «Dobla el papel.»' }, onOk: async () => redraw(1) },
      { kind: 'Fold it again', say: ['Otra vez. Más chiquito.', 'Again. Smaller.'], model: 'Dóblalo otra vez.', modelEn: 'Fold it again.', art, check: t => MUI.has(t, ['dobla', 'doblalo', 'doblala']) ? { ok: true, minor: !MUI.has(t, ['otra vez', 'de nuevo', 'otra']), note: MUI.has(t, ['otra vez', 'de nuevo']) ? '' : '«otra vez»: again' } : { ok: false, why: '«Dóblalo otra vez.»' }, onOk: async () => redraw(2) },
      { kind: 'Cut the edges', say: ['Ahora, unos triangulitos en la orilla.', 'Now, some little triangles along the edge.'], model: 'Corta unos triángulos.', modelEn: 'Cut some triangles.', art, check: cut(t => (MUI.has(t, ['triangulo', 'triangulos', 'triangulitos', 'picos']) ? 1 : null), () => { D.tri = true; }), onOk: async () => redraw(3) },
      { kind: 'Your figure, in the middle', say: ['¿Y en el centro? Una flor, un pájaro, un corazón, una calavera, una estrella, una luna, un sol, una mariposa…', 'And in the middle? A flower, a bird, a heart, a skull, a star, a moon, a sun, a butterfly…'], model: 'Corta una flor.', modelEn: 'Cut a flower.', art,
        gl: 'una flor · un pájaro · un corazón · una calavera · una estrella · una luna · un sol · una mariposa', check: cut(t => findIn(t, FIG_WORDS), k => { D.fig = k; }), onOk: async () => redraw(4) },
      { kind: 'Little circles', say: ['Unos circulitos… ¡para que pase el viento!', 'Some little circles… so the wind can blow through!'], model: 'Corta unos círculos.', modelEn: 'Cut some circles.', art, check: cut(t => (MUI.has(t, ['circulo', 'circulos', 'circulitos', 'bolitas', 'hoyos', 'agujeros']) ? 1 : null), () => { D.circ = true; }), onOk: async () => redraw(5) },
      { kind: 'Open it!', say: ['¡Ahora, ábrelo! Despacito…', 'Now, open it! Slowly…'], model: 'Abre el papel.', modelEn: 'Open the paper.', art, check: t => MUI.has(t, ['abre', 'abrelo', 'abrela', 'desdobla', 'desdoblalo']) ? { ok: true } : { ok: false, why: MUI.has(t, ['abrir', 'desdoblar']) ? 'As an order: abrir → <b>abre</b>' : 'Open: «Abre el papel.»' }, onOk: async () => { redraw(6); try { Sound.play('learned'); } catch (e) { /* */ } } },
      { kind: 'How did it turn out?', say: ['¡Ay, qué bonito! ¿Cómo te quedó?', 'Oh, how pretty! How did yours turn out?'], model: '¡Quedó precioso!', modelEn: 'It turned out beautiful!', art,
        check: t => { const adj = ['bonito', 'bonita', 'precioso', 'preciosa', 'lindo', 'linda', 'padre', 'hermoso', 'hermosa', 'genial', 'increible', 'bien', 'chido', 'chida', 'perfecto', 'perfecta', 'padrisimo']; return MUI.has(t, 'quedo') && MUI.has(t, adj) ? { ok: true } : MUI.has(t, adj) ? { ok: true, minor: true, note: 'with quedar: «¡Quedó precioso!»' } : { ok: false, why: '«¡Quedó precioso!», «¡Quedó bonito!»…' }; } },
    ];
    const r = await MUI.steps(steps, { title: 'Papel picado', sub: 'fold, cut, open: with abuela Lucha', face: 'muLucha', name: 'Abuela Lucha', intro: ['Despacito y con cuidado, ¿eh?', 'Slowly and carefully, OK?'] });
    if (r.quit) return false;
    st.pp = D; st.g2 = (st.g2 || []).concat(r.grades); hangPapel(D);
    await scene(async () => { shot([f.x + 1.6, B.gy(f.x, f.z) + 2.0, f.z + 1.4], [L.x, L.y + 0.9, L.z]); await say('lucha', 'l.hang'); });
    teachAll(['ph.mu.quedo']);
    return true;
  }
  async function chapter2() {
    const st = S();
    await scene(async () => { standBy(); shotKid(); await say('kid', 'x.ch2'); });
    if (!st.pan) { if (!(await bakery())) { kidHome(); return later(); } st.pan = true; G.save && G.save(); }
    if (!st.pp) { if (!(await papelPicado())) { kidHome(); return later(); } }
    st.ch[2] = true;
    await fadeTo(1, 350); standAt(FRONT, SPOT.alt); kidTo(...Object.values(ALT.at(-1.9, 1.4)), SPOT.alt); await fadeTo(0, 350);
    await scene(async () => { kidTo(...Object.values(ALT.at(-1.9, 1.4)), SPOT.alt); shotAltar(4.4, 2.6); const P = slotWorld('arch'); sparkle(P.x, P.y, P.z, 16); B.kid.pose = 'cheer'; await say('kid', 'x.done2'); B.kid.pose = 'idle'; });
    kidHome();
    coins(8, 'Marta and abuela Lucha thank you');
  }

  const lineArr = k => { const L = lineOf(k); return [L.es, L.en]; };
  const wait = s => (typeof STORY !== 'undefined' && STORY.wait ? STORY.wait(s) : new Promise(r => setTimeout(r, s * 1000)));
  const photoArt = id => el => { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 160; cv.style.width = '104px'; cv.style.height = '130px'; portrait(cv.getContext('2d'), PEOPLE[id]); el.appendChild(cv); const d = document.createElement('div'); d.style.cssText = 'align-self:center;font:700 15px Trebuchet MS,sans-serif;max-width:220px'; d.innerHTML = `<b style="font-size:19px">${esc(PEOPLE[id].name)}</b><br><span style="opacity:.7">${esc(PEOPLE[id].role || '')}</span>`; el.appendChild(d); };

  // ================================================================ chapter 3: calaveritas literarias (la Calaca comes for Alba, con cariño)
  const CAL_READ = [
    { who: 'Bruno', es: ['La Calaca fue al patio', 'a buscar a Bruno el fuerte,', 'pero él hizo cien lagartijas…', '¡y se cansó la Muerte!'], en: ['La Calaca went to the yard', 'to fetch Bruno the strong,', 'but he did a hundred push-ups…', 'and Death got tired!'], keys: ['se canso', 'muerte'], note: '«lagartijas»: push-ups, in Mexico (literally “little lizards”).' },
    { who: 'Don Fello', es: ['La Muerte retó a Don Fello', 'a jugar al dominó;', 'él golpeó tan fuerte la mesa', '¡que la Muerte se asustó!'], en: ['Death challenged Don Fello', 'to a game of dominoes;', 'he slammed the table so hard', 'that Death got scared!'], keys: ['se asusto'] },
  ];
  const CAL_DO = [
    { id: 'rosa', who: 'Rosa', es: ['La Calaca llegó al puesto', 'de Rosa, la de las manzanas.', 'Probó una tan, tan rica', 'que volvió todas las ___.'], en: ['La Calaca came to the stall', 'of Rosa, the apple lady.', 'She tried one so, so tasty', 'that she came back every ___.'],
      best: ['mananas', 'semanas'], tail: ['anas'], same: 'manzanas', model: 'mañanas', modelEn: 'mornings', hint: 'A word that rhymes with «manzanas»… every morning?', say: ['Ahora te toca: termina la rima. ¿Qué rima con «manzanas»?', 'Your turn: finish the rhyme. What rhymes with “manzanas”?'] },
    { id: 'marta', who: 'Marta', es: ['La Calaca entró en la panadería', 'con mucha hambre y sin un peso;', 'Marta le dio pan de muerto', 'y la Calaca le dio un ___.'], en: ['La Calaca walked into the bakery', 'very hungry, without a cent;', 'Marta gave her pan de muerto', 'and the Calaca gave her a ___.'],
      best: ['beso', 'hueso', 'queso'], tail: ['eso'], same: 'peso', model: 'beso', modelEn: 'a kiss', hint: 'Rhymes with «peso»: a kiss (beso)? a bone (hueso)? some cheese (queso)?', say: ['¡Esta es de Marta, la panadera!', 'This one’s about Marta, the baker!'] },
    { id: 'tito', who: 'Tito', es: ['La Calaca vino por Tito,', 'el de la guitarra en la plaza;', 'él tocó una canción tan bonita', '¡que la Calaca bailó hasta su ___!'], en: ['La Calaca came for Tito,', 'the guitar man in the plaza;', 'he played such a pretty song', 'that the Calaca danced all the way ___!'],
      best: ['casa'], tail: ['asa', 'aza'], same: 'plaza', model: 'casa', modelEn: 'home', hint: 'Rhymes with «plaza» (in Mexico, z and s sound the same)… all the way home?', say: ['Tito, el de la guitarra…', 'Tito, the guitar man…'] },
    { id: 'mimo', who: '{mimo}', es: ['La Calaca vio a {mimo}', 'y le quiso dar un susto;', 'pero {mimo} dijo «¡hola!»', 'y la Calaca bailó con ___.'], en: ['La Calaca saw {mimo}', 'and wanted to give it a fright;', 'but {mimo} said “hello!”', 'and the Calaca danced with ___.'],
      best: ['gusto'], tail: ['usto'], same: 'susto', model: 'gusto', modelEn: 'joy', hint: 'Rhymes with «susto»: «con gusto», gladly, with joy.', say: ['¡Y una de {mimo}!', 'And one about {mimo}!'] },
    { id: 'xochi', who: 'Xochi', es: ['La Calaca vino por Xochi,', 'pero Xochi no la vio:', 'estaba haciendo preguntas…', '¡y la Calaca se ___!'], en: ['La Calaca came for Xochi,', 'but Xochi didn’t see her:', 'she was busy asking questions…', 'and the Calaca ___!'],
      best: ['aburrio', 'durmio', 'canso', 'mareo', 'rio', 'escondio', 'asusto', 'cayo', 'perdio', 'quedo', 'sento', 'desmayo', 'enojo', 'mareo'], tail: ['io'], accentO: true, same: 'vio', model: 'aburrió', modelEn: 'got bored', hint: 'Rhymes with «vio»: a verb that ends in -ó. «se aburrió» (got bored), «se durmió» (fell asleep)…', say: ['Ahora… ¡una de mí! Pero con cariño, ¿eh?', 'Now… one about me! But with love, OK?'] },
  ];
  const CAL_YOU = { es: ['La Calaca buscó en Alba', 'a quien llegó en el tren;', 'pero hablaba tan bonito', '¡que se quedó a aprender!'], en: ['La Calaca searched Alba', 'for the one who came on the train;', 'but they spoke so beautifully', 'that she stayed to learn!'] };
  function rhymeCheck(C, text) {
    const raw = String(text || '').trim(), w = MUI.N(raw).split(' ').filter(Boolean), last = w[w.length - 1] || '';
    if (last === C.same) return { ok: false, why: 'That’s the same word! Another one that rhymes with it.' };
    if (C.best.includes(last)) return { ok: true, said: last };
    if (/^[a-z]+$/.test(last) && last.length > 2 && (C.tail.some(t => last.endsWith(t) && last.length > t.length) || (C.accentO && /ó[\s.!¡?]*$/.test(raw)))) return { ok: true, said: last, note: '¡Rima! A creative one.' };
    return { ok: false, why: esc(C.hint) };
  }
  const verseHTML = (C, blank) => `<div style="background:#fffdf6;border:2.5px solid #2b2235;border-radius:14px;padding:10px 16px;max-width:540px;font:700 19px/1.4 Georgia, serif;box-shadow:0 4px 0 rgba(43,34,53,.15)">`
    + C.es.map((l, i) => `<div style="margin:2px 0${!blank && i === 3 ? ';color:#c2185b' : ''}">${esc(sub(l)).replace('___', '<span style="display:inline-block;min-width:74px;border-bottom:3px dashed #e2337f">&nbsp;</span>')}<div style="font:600 12.5px Trebuchet MS, sans-serif;opacity:.62">${esc(sub(C.en[i]))}</div></div>`).join('') + '</div>';
  function calSteps() {
    const st = S(), out = [];
    CAL_READ.forEach((C, i) => out.push({ kind: 'Say it out loud · the last line', say: i ? ['¡Otra! Esta es de Don Fello.', 'Another one! This one’s about Don Fello.'] : ['Yo leo… y tú dices el último verso. ¡En voz alta!', 'I’ll read… and you say the last line. Out loud!'],
      art: verseHTML(C, false), model: C.es[3], modelEn: C.en[3], note: C.note || '', placeholder: 'the last line…', voice: C.es.join(', '), check: t => ({ ok: C.keys.every(k => MUI.has(t, k)) }) }));
    CAL_DO.forEach((C, i) => out.push({ kind: C.id === 'xochi' ? 'One about Xochi · finish it' : `Finish the rhyme · ${i + 1} of ${CAL_DO.length - 1}`, say: [sub(C.say[0]), sub(C.say[1])], art: verseHTML(C, true),
      model: C.model, modelEn: C.modelEn, placeholder: 'the last word…', help: i ? '' : 'Any word that rhymes counts!', check: t => rhymeCheck(C, t), then: r => { st.cal[C.id] = (r.r && r.r.said) || C.model; } }));
    return out;
  }
  const calLines = () => { const st = S(); return CAL_READ.concat(CAL_DO).map(C => { const w = C.id ? (st.cal[C.id] || C.model) : ''; return { text: C.es.map(l => sub(l).replace('___', w)).join(' / '), en: C.en.map(l => sub(l).replace('___', w ? '“' + w + '”' : '___')).join(' / ') }; }).concat([{ text: CAL_YOU.es.join(' / '), en: CAL_YOU.en.join(' / ') }]); };
  async function chapter3() {
    const st = S();
    await scene(async () => { standBy(); shotKid(); await say('kid', 'x.cal1'); await say('kid', 'x.cal2'); await say('kid', 'x.cal3'); });
    const r = await MUI.steps(calSteps(), { title: 'Calaveritas', sub: 'la Calaca comes for Alba (con cariño)', face: 'muCalavera', name: 'Xochi', intro: ['¿Listo? ¿Lista? ¡Vamos!', 'Ready? Let’s go!'] });
    if (r.quit) return later();
    st.ch[3] = true; st.g3 = r.grades;
    await scene(async () => {
      standBy(); shotKid(); await say('kid', 'x.cal6'); await say('kid', 'x.calYou');
      await speak(B.kid, [CAL_YOU.es.join(' / '), CAL_YOU.en.join(' / ')], { name: 'Xochi' });
      await you('Ha! She stayed to learn. I love it.');
      B.kid.pose = 'cheer'; await say('kid', 'x.sugar'); B.kid.pose = 'idle';
      G.state.bag = G.state.bag || {}; G.state.bag['k.calaverita'] = 1;
      const M = G.sim.mimo; M.happy = 1.6; sparkle(M.x, M.ry + 0.8, M.z, 14, ['#ffffff', '#e2337f', '#1fa3a0']);
    });
    if (MUI.fast) UI.toast('Key item: calaverita de azúcar');
    else try { await UI.card(`<canvas width="140" height="140"></canvas><div class="tag">Key item</div><div class="big">calaverita de azúcar</div><div class="sub">A sugar skull with ${esc(mimo())}’s name on it · <b>E</b></div>`, { kind: 'reveal', icon: 'muCalavera', say: 'calaverita de azúcar' }); } catch (e) { /* */ }
    teachAll(['ph.mu.calaverita', 'ph.mu.calaca', 'ph.mu.concarino']);
    coins(6, 'Xochi’s calaverita prize');
  }

  // ================================================================ chapter 4: recuerdos (Alba's elders remember the people in the cemetery)
  const IV = {
    andres: { elder: 'rosa', intro: ['¿Andrés Vidal? ¡Ay, Andrés! Pregunta, pregunta.', 'Andrés Vidal? Oh, Andrés! Go ahead, ask.'],
      a1: ['Era alto y muy alegre. ¡Siempre silbaba!', 'He was tall and very cheerful. He was always whistling!'],
      a2: ['Le encantaban las manzanas, ¡claro! Plantaba manzanos por todo el valle. Y les regalaba manzanas a los niños.', 'He loved apples, of course! He planted apple trees all over the valley. And he gave apples to the kids.'],
      mem: 'Andrés era muy alegre.', memEn: 'Andrés was very cheerful.', bye: ['Mis manzanas son de sus árboles, ¿sabes? Todavía.', 'My apples come from his trees, you know. Still.'] },
    lorenzo: { elder: 'otto', intro: ['¿Lorenzo, el carpintero? Claro que me acuerdo.', 'Lorenzo, the carpenter? Of course I remember.'],
      a1: ['Era muy callado… pero muy amable.', 'He was very quiet… but very kind.'],
      a2: ['Le gustaba la madera. Hacía sillas preciosas. ¡Todas las sillas del teatro!', 'He liked wood. He made beautiful chairs. All the chairs in the theater!'],
      mem: 'Lorenzo hacía sillas preciosas.', memEn: 'Lorenzo made beautiful chairs.', bye: ['Esta banca también la hizo él. Todavía aguanta.', 'He made this bench too. It still holds up.'] },
    sofia: { elder: 'clara', intro: ['¿La doctora Sofía? ¡Ay, qué recuerdos!', 'Doctor Sofía? Oh, the memories!'],
      a1: ['Era la doctora del pueblo. ¡Y era muy chistosa!', 'She was the village doctor. And she was very funny!'],
      a2: ['Le gustaba hacer reír a la gente. Curaba los resfriados con sopa… ¡y el mal humor con chistes!', 'She liked making people laugh. She cured colds with soup… and bad moods with jokes!'],
      mem: 'Sofía era muy chistosa.', memEn: 'Sofía was very funny.', bye: ['Ya casi no me resfrío… pero extraño sus chistes.', 'I hardly ever catch colds now… but I miss her jokes.'] },
    gil: { elder: 'fello', plural: true, intro: ['¿Los Gil? ¡Diache! ¿Ramona y Rufino? Pregúntame.', 'The Gils? Well, darn! Ramona and Rufino? Ask me.'],
      a1: ['¡Eran gemelos! Y discutían por todo. ¡Por todo!', 'They were twins! And they argued about everything. Everything!'],
      a2: ['Les gustaba hacer zapatos… y pelear por cada zapato. ¡Como Chago y yo con el dominó!', 'They liked making shoes… and fighting over every shoe. Like Chago and me with dominoes!'],
      mem: 'Ramona y Rufino eran gemelos.', memEn: 'Ramona and Rufino were twins.', bye: ['Estos zapatos me los hicieron ellos. ¡Y siguen buenos!', 'They made these shoes for me. And they’re still good!'] },
    aurora: { elder: 'tina', intro: ['¿Aurora Campos? Ay, mi directora…', 'Aurora Campos? Oh, my choir director…'],
      a1: ['Aurora era muy elegante… ¡y muy estricta en los ensayos!', 'Aurora was very elegant… and very strict at rehearsals!'],
      a2: ['Le encantaba cantar. Dirigía el coro del teatro. Yo cantaba en su coro, ¿sabes?', 'She loved singing. She directed the theater’s choir. I sang in her choir, you know.'],
      mem: 'Aurora era muy elegante.', memEn: 'Aurora was very elegant.',
      e1: ['¡Esperanza! Era mi vecina. Era muy alegre… y siempre olía a chocolate. Le encantaba cortar papel picado. ¡Nos enseñaba a todos los niños!', 'Esperanza! She was my neighbor. She was very cheerful… and she always smelled of chocolate. She loved cutting papel picado. She taught all of us kids!'],
      bye: ['Dile a la niña que su bisabuela cantaba muy bonito.', 'Tell the girl her great-grandma sang beautifully.'] },
  };
  PEOPLE.esperanza.role = 'Xochi’s great-grandmother';
  const ivDone = (st, id) => !!(st.iv[id] && st.iv[id].mem);
  const nIv = st => ROW.filter(id => ivDone(st, id)).length;
  function askQ1(id) {
    return t => { const P = IV[id], n = MUI.N(t);
      if (/\bcomo (era|eran)\b/.test(n)) { const pl = /\beran\b/.test(n); return { ok: true, minor: !!P.plural !== pl, note: P.plural && !pl ? 'two people: «¿Cómo eran?»' : '' }; }
      if (/\bcomo (es|son)\b/.test(n)) return { ok: false, why: `In the past: ${/\bson\b/.test(n) ? 'son → <b>eran</b>' : 'es → <b>era</b>'}` };
      return { ok: false, why: 'Ask what they were like: «¿Cómo era…?»' }; };
  }
  function askQ2(id) {
    return t => { const P = IV[id], n = MUI.N(t);
      if (/\bque (le|les) (gustaba|gustaban|encantaba|encantaban)\b/.test(n) || /\bque (hacia|hacian)\b/.test(n)) { const pl = /\bles\b/.test(n); return { ok: true, minor: !!P.plural !== pl && /\ble/.test(n), note: P.plural && !pl ? 'two people: «¿Qué les gustaba?»' : '' }; }
      if (/\bque (le|les) (gusta|gustan|encanta|encantan)\b/.test(n)) return { ok: false, why: 'In the past: gusta → <b>gustaba</b>' };
      return { ok: false, why: 'Ask what they liked: «¿Qué le gustaba?»' }; };
  }
  const HEARD = { esperanza: 'alegre, el chocolate, el papel picado, el cempasúchil', andres: 'alegre, alto, silbaba, las manzanas', lorenzo: 'callado, amable, la madera, las sillas', sofia: 'la doctora, chistosa, la sopa, los chistes', gil: 'gemelos, discutían, los zapatos', aurora: 'elegante, estricta, cantar, el coro' };
  // an adjective about a woman ending in -o (or about a man in -a): a gentle note, not a miss
  const ADJ = ['chistos', 'simpatic', 'callad', 'estrict', 'alt', 'divertid', 'graciis', 'gracios', 'carinos', 'bonit', 'buen'];
  function agree(id, t) {
    const P = PEOPLE[id]; if (P.plural || id === 'gil') return '';
    for (const w of MUI.N(t).split(' ')) for (const a of ADJ) if (w === a + (P.fem ? 'o' : 'a')) return `about ${P.fem ? 'her' : 'him'}: <b>${a}${P.fem ? 'a' : 'o'}</b>`;
    return '';
  }
  function memCheck(id) {
    return t => { const P = PEOPLE[id];
      if (hasImpf(t) && memHit(t, P.mem)) { const a = agree(id, t); return { ok: true, minor: !!a, note: a }; }
      if (!hasImpf(t)) return { ok: false, why: presentSlip(t) || 'In the past: era…, le gustaba…, le encantaba…, hacía…' };
      return { ok: false, why: 'Use something you heard: ' + esc(HEARD[id] || '') + '…' }; };
  }
  function ivSteps(id) {
    const st = S(), I = IV[id], P = PEOPLE[id], who = NAMES[I.elder], short = P.plural ? 'Ramona y Rufino' : P.name.split(' ')[0];
    const steps = [
      { kind: `Ask ${who} · what ${P.plural ? 'were they' : P.fem ? 'was she' : 'was he'} like?`, say: I.intro, art: photoArt(id), model: P.plural ? '¿Cómo eran Ramona y Rufino?' : `¿Cómo era ${short}?`, modelEn: `What ${P.plural ? 'were they' : P.fem ? 'was she' : 'was he'} like?`, placeholder: '¿Cómo era…?', check: askQ1(id) },
      { kind: `Ask · what did ${P.plural ? 'they' : P.fem ? 'she' : 'he'} like?`, say: I.a1, art: photoArt(id), model: P.plural ? '¿Qué les gustaba?' : '¿Qué le gustaba?', modelEn: `What did ${P.plural ? 'they' : P.fem ? 'she' : 'he'} like?`, placeholder: '¿Qué le gustaba?', check: askQ2(id) },
      { kind: 'Your memory notebook · one sentence, in the past', say: I.a2, art: photoArt(id), gl: 'Write what you heard, in the past: <b>era…</b>, <b>le gustaba(n)…</b>, <b>le encantaba(n)…</b>, <b>hacía…</b>', model: I.mem, modelEn: I.memEn, placeholder: `${short} era…`, check: memCheck(id), then: r => { st.iv[id] = { mem: r.text }; } },
    ];
    if (id === 'aurora') steps.push(
      { kind: 'Ask about Xochi’s great-grandma', say: ['¿Quieres saber algo más?', 'Do you want to know anything else?'], art: photoArt('esperanza'), model: '¿Cómo era Esperanza?', modelEn: 'What was Esperanza like?', placeholder: '¿Cómo era…?', check: t => /\bcomo era\b/.test(MUI.N(t)) && MUI.has(t, 'esperanza') ? { ok: true } : MUI.has(t, 'esperanza') ? { ok: false, why: '«¿Cómo era Esperanza?»' } : { ok: false, why: 'Ask about Esperanza: «¿Cómo era Esperanza?»' } },
      { kind: 'A memory for Xochi', say: I.e1, art: photoArt('esperanza'), gl: 'One sentence about Esperanza, in the past.', model: 'Esperanza era muy alegre.', modelEn: 'Esperanza was very cheerful.', placeholder: 'Esperanza era…', check: memCheck('esperanza'), then: r => { st.iv.esperanza = { mem: r.text }; } });
    return steps;
  }
  function faceTo(p, d = 1.6) { const Y = G.sim.you; let dx = Y.x - p.x, dz = Y.z - p.z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L; standAt({ x: p.x + dx * d, z: p.z + dz * d }, p); return { dx, dz }; }
  function shotPair(p, u) { const y = p.y !== undefined ? p.y : B.gy(p.x, p.z); G.cam.override = { pos: V3(p.x + u.dx * 3.6 - u.dz * 1.7, y + 1.9, p.z + u.dz * 3.6 + u.dx * 1.7), look: V3(p.x, y + 1.0, p.z) }; }
  async function interview(id) {
    const st = S(), I = IV[id], P = PEOPLE[id], p = WHO[I.elder](); if (!p) return;
    let u = null;
    await scene(async () => { u = faceTo(p); shotPair(p, u); await speak(p, I.intro, { name: NAMES[I.elder] }); });
    const r = await MUI.steps(ivSteps(id), { title: 'Recuerdos', sub: `${NAMES[I.elder]} remembers ${P.name}`, face: I.elder === 'fello' ? 'dmFello' : 'muLibreta', name: NAMES[I.elder] });
    if (r.quit) return;
    st.g4 = (st.g4 || []).concat(r.grades);
    await scene(async () => { if (u) shotPair(p, u); await speak(p, I.bye, { name: NAMES[I.elder] }); });
    const n = nIv(st); UI.toast(`Memories in Xochi’s notebook: ${n} of 5`);
    if (n >= 5) think('All five memories! Back to Xochi by the bell tower.', 4.5);
  }
  async function chapter4() {
    const st = S();
    if (!st.l4) {
      await scene(async () => { standBy(); shotKid(); await say('kid', 'x.r1'); await say('kid', 'x.r2'); await say('kid', 'x.r3'); });
      const r = await MUI.lesson({ title: 'Recuerdos', sub: 'talking about the past', face: 'muKid', name: 'Xochi', intro: ['Para el pasado decimos «era», «le gustaba»…', 'For the past we say «era», «le gustaba»…'],
        items: ['ph.mu.comoera', 'ph.mu.quelegustaba', 'ph.mu.era', 'ph.mu.leencantaba', 'ph.mu.sellamaba'].map(item), outro: ['¡Ya sabes preguntar! Ahora, a escuchar.', 'Now you know how to ask! Now, let’s listen.'] });
      if (r.quit) return later();
      st.l4 = true; st.round4 = true; teachAll(['ph.mu.comoera', 'ph.mu.quelegustaba', 'ph.mu.era', 'ph.mu.leencantaba', 'ph.mu.sellamaba']);
      await scene(async () => { standBy(); shotKid(); await say('kid', 'x.r5'); await say('kid', 'x.rwho'); });
      UI.toast('Ask Rosa (her fruit stall), Otto (a bench in the plaza), Clara (the main street), Don Fello (the domino table) and Doña Tina (the Old Quarter).');
      return;
    }
    if (nIv(st) < 5) { await scene(async () => { standBy(); shotKid(); await say('kid', 'x.rwho'); }); think(`${nIv(st)} of 5 memories so far.`, 3); return; }
    await scene(async () => { standBy(); shotKid(); await say('kid', 'x.rbisa'); });
    const r = await MUI.steps([{ kind: 'Tell Xochi about her great-grandma', say: lineArr('x.rbisa'), art: photoArt('esperanza'), model: 'Era muy alegre. Le encantaba el chocolate.', modelEn: 'She was very cheerful. She loved chocolate.',
      gl: st.iv.esperanza ? `Your notebook: «${esc(st.iv.esperanza.mem)}»` : '', placeholder: 'Era…', check: memCheck('esperanza') }], { title: 'Recuerdos', sub: 'for Xochi', face: 'muKid', name: 'Xochi' });
    if (r.quit) return later();
    st.ch[4] = true; st.round4 = false;
    await fadeTo(1, 350); standAt(FRONT, SPOT.alt); kidTo(...Object.values(ALT.at(-1.9, 1.4)), SPOT.alt); await fadeTo(0, 350);
    await scene(async () => {
      kidTo(...Object.values(ALT.at(-1.9, 1.4)), SPOT.alt); shotAltar(3.8, 2.3);
      for (const id of ROW) { const P = B.photos[id].getWorldPosition(V3(0, 0, 0)); sparkle(P.x, P.y, P.z, 8); await wait(0.25); }
      B.kid.pose = 'cheer'; await say('kid', 'x.rdone'); B.kid.pose = 'idle';
    });
    kidHome();
    coins(10, 'Xochi’s family thanks you');
  }

  // ================================================================ chapter 5: la noche
  function festOn() { FEST.on = true; FEST.night = 0; FEST.path = 0; FEST.gray = 0; FEST.music = 0; FEST.band = false; for (const c of B.candles) c.lit = 1; for (const id of Object.keys(B.photos)) photoK(id, 0); }
  function festOff() {
    FEST.on = false; FEST.path = -1; FEST.gray = 0; FEST.band = false; FEST.night = 0; FEST.music = 0;
    for (const v of B.visitors) v.g.visible = false; for (const c of B.candles) c.lit = 1; for (const id of Object.keys(B.photos)) photoK(id, 0);
    kidHome(); if (G) G.fx.hush = 0;
  }
  async function flyPath() {
    const P = B.pathM, n = 180;
    for (let i = 0; i <= n; i++) {
      const u = i / n, e = u * u * (3 - 2 * u), d = e * P.L; FEST.path = Math.min(1, e + 0.02);
      const a = P.at(d), b = P.at(Math.min(P.L, d + 6)), dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1, y = B.gy(a.x, a.z);
      G.cam.override = { pos: V3(a.x - dx / L * 5 - dz / L * 1.2, y + 8.5, a.z - dz / L * 5 + dx / L * 1.2), look: V3(a.x + dx / L * 5, y, a.z + dz / L * 5) };
      if (i % 9 === 0) { const s = P.at(d + 1.5); sparkle(s.x, B.gy(s.x, s.z) + 0.3, s.z, 5, ['#f39a1e', '#f7b52c']); }
      await wait(0.045);
    }
    FEST.path = 1;
  }
  async function hushComes() {
    try { Sound.play('grow'); } catch (e) { /* */ }
    for (let i = 0; i <= 60; i++) { const u = i / 60; G.fx.hush = 0.6 * u; FEST.gray = u; for (const c of B.candles) c.lit = 1 - u; if (i % 6 === 0) for (const id of Object.keys(B.photos)) photoK(id, u); await wait(0.05); }
  }
  const photoAt = id => B.photos[id].getWorldPosition(V3(0, 0, 0));
  function shotPhoto(id) { const P = photoAt(id), F = ALT.F; G.cam.override = { pos: V3(P.x + F.x * 2.3 + ALT.R.x * 0.5, P.y + 0.35, P.z + F.z * 2.3 + ALT.R.z * 0.5), look: V3(P.x, P.y, P.z) }; }
  function hudPortrait(id, k) { return (c, s) => { c.fillStyle = '#3a2a4a'; c.fillRect(0, 0, s, s); const cv = document.createElement('canvas'); cv.width = 128; cv.height = 160; portrait(cv.getContext('2d'), PEOPLE[id], k); c.drawImage(cv, s * 0.16, s * 0.02, s * 0.68, s * 0.96); }; }
  function nameCheck(id, t) {
    const P = PEOPLE[id], n = ' ' + MUI.N(t) + ' ';
    if (!P.first.some(f => n.includes(' ' + f + ' '))) return { ok: false, why: `Say ${P.plural ? 'their names' : 'the name'}: «Se llamaba${P.plural ? 'n' : ''} ${esc(P.plural ? 'Ramona y Rufino' : P.name.split(' ')[0])}…»` };
    if (!hasImpf(t)) return { ok: false, why: presentSlip(t) || 'In the past: «Se llamaba…», «Era…», «Le encantaba…»' };
    const mem = memHit(t, P.mem), llam = /\bse llamaban?\b/.test(n);
    return { ok: true, minor: !(llam && mem), note: !mem ? 'next time, add a memory: «Era…», «Le encantaba…»' : !llam ? '«Se llamaba…» is the classic way to begin' : '' };
  }
  async function restore(id, i, n) {
    photoK(id, 0); const P = photoAt(id); sparkle(P.x, P.y, P.z, 18, ['#ffd23f', '#f39a1e', '#fff3a0']);
    const lit = Math.ceil(B.candles.length * (i + 1) / n); B.candles.forEach((c, k) => { if (k < lit) c.lit = 1; });
    FEST.gray = 1 - (i + 1) / n; G.fx.hush = 0.6 * (1 - (i + 1) / n);
    try { Sound.play('chime'); Sound.play('learned'); } catch (e) { /* */ }
    await wait(0.9);
  }
  async function visitorsCome() {
    const P = B.pathM, V = B.visitors, order = ['esperanza', 'andres', 'lorenzo', 'sofia', 'gil', 'aurora'];
    const targets = order.map(photoAt).concat([slotWorld('arch')]);
    shot([-12.2, B.gy(-12, -154) + 3.0, -153.5], [-10, 1.8, -182]);
    FEST.music = 0.22;
    V.forEach((v, i) => { v.d = P.L - 42 - i * 3.4; const a = P.at(v.d); v.g.position.set(a.x, 0, a.z); v.y = B.gy(a.x, a.z) + 1.4; v.g.visible = true; v.g.scale.setScalar(0.01); });
    for (let f = 0; f < 160; f++) {
      V.forEach((v, i) => { v.d = Math.min(P.L, v.d + 0.33); const a = P.at(v.d); v.g.position.x = a.x; v.g.position.z = a.z; v.y = B.gy(a.x, a.z) + 1.3 + Math.sin(f * 0.06 + i) * 0.2; v.g.scale.setScalar(Math.min(1, f / 30)); });
      if (f === 95) shotAltar(6.4, 2.8);
      await wait(0.045);
    }
    for (let f = 0; f <= 45; f++) { V.forEach((v, i) => { const T = targets[i % targets.length]; v.g.position.x = lerp(v.g.position.x, T.x + ALT.F.x * 0.25, 0.12); v.g.position.z = lerp(v.g.position.z, T.z + ALT.F.z * 0.25, 0.12); v.y = lerp(v.y, T.y + 0.3, 0.12); }); await wait(0.045); }
    FEST.music = 0.58; try { Sound.play('learned'); } catch (e) { /* */ }
  }
  async function confetti() { for (let i = 0; i < 12; i++) { const a = Math.random() * TAU, r = 2 + Math.random() * 6; sparkle(SPOT.plaza.x + Math.cos(a) * r, B.gy(SPOT.plaza.x, SPOT.plaza.z) + 2.5 + Math.random() * 3, SPOT.plaza.z + Math.sin(a) * r, 22, [['#f39a1e', '#f7b52c'], ['#e2337f', '#ffd166'], ['#1fa3a0', '#fff3a0']][i % 3]); try { Sound.play(i % 3 ? 'pip' : 'chime'); } catch (e) { /* */ } await wait(0.25); } }
  async function chapter5() {
    const st = S();
    await scene(async () => { standBy(); shotKid(); await say('kid', 'x.n1'); await say('kid', 'x.n2'); });
    if (!st.l5) {
      const r = await MUI.lesson({ title: 'La noche', sub: 'what we say tonight', face: 'muLucha', name: 'Abuela Lucha', intro: lineArr('l.n3'), items: ['ph.mu.sellamaba', 'ph.mu.recordamos', 'ph.mu.bienvenidos', 'ph.mu.feliz'].map(item), outro: ['¡Vámonos! Al cementerio.', 'Let’s go! To the cemetery.'] });
      if (r.quit) return later();
      st.l5 = true;
    }
    let quit = false;
    try {
      await fadeTo(1, 500); festOn();
      const g = SPOT.grave, gy0 = B.gy(g.x, g.z), gf = { x: g.x, z: g.z - 2.0 };
      standAt(gf, g); kidTo(g.x + 1.4, g.z - 1.7, g); FEST.night = 0.55;
      await fadeTo(0, 500);
      await scene(async () => { kidTo(g.x + 1.4, g.z - 1.7, g); shot([g.x - 2.4, gy0 + 1.9, g.z - 3.8], [g.x, gy0 + 0.7, g.z]); await say('kid', 'x.grave'); });
      lock(true); shot([g.x - 2.4, gy0 + 1.9, g.z - 3.8], [g.x, gy0 + 0.7, g.z]);
      MUI.hud.open('El camino de pétalos · the petal path');
      const g0 = await MUI.hud.call({ icon: 'muFlor', title: `Tell ${esc(mimo())} to scatter the petals!`, sub: 'From the grave to the plaza, so the visitors can find the way.', model: 'Echa los pétalos.', modelEn: 'Scatter the petals.',
        check: t => { const w = MUI.N(t).split(' '); return w.some(x => ['echa', 'echalos', 'tira', 'tiralos', 'pon', 'ponlos', 'riega', 'esparce', 'avienta'].includes(x)) && MUI.has(t, ['petalos', 'petalo', 'flores', 'cempasuchil']) ? { ok: true } : { ok: false, why: '«Echa los pétalos»: echa (throw, scatter) + los pétalos' }; } });
      MUI.hud.close();
      if (g0 === 'quit') { quit = true; return; }
      await flyPath();
      await fadeTo(1, 450); standAt(FRONT, SPOT.alt); kidTo(...Object.values(ALT.at(-1.9, 1.4)), SPOT.alt); FEST.night = 0.92; FEST.band = true; await fadeTo(0, 450);
      await scene(async () => { kidTo(...Object.values(ALT.at(-1.9, 1.4)), SPOT.alt); shotAltar(5.6, 2.4); await say('kid', 'x.ready'); });
      lock(true); shotAltar(5.2, 2.6); await hushComes();
      await scene(async () => { shotAltar(4.6, 2.2); G.fx.hush = 0.6; B.kid.pose = 'sulk'; await say('kid', 'x.uhoh'); B.kid.pose = 'idle'; await speak(B.lucha, 'l.quick', { name: 'Abuela Lucha' }); });
      lock(true); G.fx.hush = 0.6;
      MUI.hud.open('Sus nombres · say each name, and a memory');
      const order = ['andres', 'lorenzo', 'sofia', 'gil', 'aurora', 'esperanza'], grades = [];
      for (let i = 0; i < order.length; i++) {
        const id = order[i], P = PEOPLE[id], m = st.iv[id];
        shotPhoto(id);
        const gr = await MUI.hud.call({ draw: hudPortrait(id, 1), title: `${esc(cap(P.role.replace(/^the /, '')))}: say ${P.plural ? 'their names' : 'the name'}, and a memory`, sub: m && m.mem ? `Your notebook: «${esc(m.mem)}»` : `${esc(P.name)}`, bar: i / order.length, model: P.model, modelEn: P.modelEn, placeholder: 'Se llamaba…', check: t => nameCheck(id, t) });
        if (gr === 'quit') { quit = true; break; }
        grades.push(gr); await restore(id, i, order.length);
        if (id === 'esperanza') { MUI.hud.close(); await scene(async () => { shotAltar(3.6, 2.0); B.kid.pose = 'cheer'; await say('kid', 'x.esperanza'); B.kid.pose = 'idle'; }); }
      }
      MUI.hud.close();
      if (quit) return;
      st.g5 = grades;
      for (let i = 0; i <= 30; i++) { G.fx.hush = Math.max(0, G.fx.hush - 0.03); await wait(0.04); }
      G.fx.hush = 0; FEST.gray = 0; try { Sound.play('fanfare'); } catch (e) { /* */ }
      lock(true); await visitorsCome();
      await scene(async () => { shotAltar(4.8, 2.3); B.kid.pose = 'cheer'; await say('kid', 'x.won'); B.kid.pose = 'idle'; await speak(B.lucha, 'l.visitas', { name: 'Abuela Lucha' }); await say('kid', 'x.thanks'); });
      await scene(async () => {
        // (the camera stays 4+ away: closer than that, world3d dissolves things so they never block the view)
        const M = G.sim.mimo, F = ALT.F, R = ALT.R, cx = M.x + F.x * 4.0 + R.x * 1.1, cz = M.z + F.z * 4.0 + R.z * 1.1;
        G.cam.override = { pos: V3(cx, M.ry + 1.7, cz), look: V3(M.x, M.ry + 0.5, M.z) }; M.look = { x: cx, z: cz };
        await say('kid', 'x.crown'); st.crown = true; st.crownOff = false; const c = crown(); if (c) c.visible = true;
        M.happy = 2; M.glow = 1; if (G.sim.emit) G.sim.emit('learned', {}); sparkle(M.x, M.ry + 0.9, M.z, 18); UI.toast(`${mimo()} wears a cempasúchil crown!`);
        await wait(1.8);
      });
      lock(true); shotAltar(6.6, 3.0); FEST.music = 0.62;
      MUI.hud.open('¡Feliz Día de Muertos!');
      const gf2 = await MUI.hud.call({ icon: 'muCalavera', title: 'The whole plaza is celebrating! Say it with them:', sub: 'Happy Day of the Dead!', model: '¡Feliz Día de Muertos!', modelEn: 'Happy Day of the Dead!', keys: ['feliz dia de muertos', 'feliz dia de los muertos'] });
      MUI.hud.close();
      if (gf2 !== 'quit') { B.kid.pose = 'cheer'; await confetti(); B.kid.pose = 'idle'; }
      st.ch[5] = true;
      teachAll(['ph.mu.sellamaba', 'ph.mu.recordamos', 'ph.mu.bienvenidos', 'ph.mu.feliz']);
      coins(16, 'Xochi’s family thanks you');
      await wait(1.5); await fadeTo(1, 600);
    } finally { festOff(); lock(false); G.cam.override = null; MUI.hud.close(); if (G.save) G.save(); }
    await fadeTo(0, 600);
    if (quit) later();
  }

  // ================================================================ the menu
  const CH = [
    { n: 1, title: 'La ofrenda', sub: 'what goes on it and why; build it with Mimo', gate: f => !!f.rosa, wait: 'after Rosa’s welcome', run: chapter1 },
    { n: 2, title: 'Pan de muerto y papel picado', sub: 'bake with Marta, cut paper with abuela Lucha', gate: f => !!f.boss, wait: 'after the big Hushling on the hill', run: chapter2 },
    { n: 3, title: 'Calaveritas', sub: 'funny rhymes about Alba’s people', gate: f => (f.bells || 0) >= 1, wait: 'after the first bell', run: chapter3 },
    { n: 4, title: 'Recuerdos', sub: 'ask Alba’s elders about the people in the cemetery', gate: f => (f.bells || 0) >= 2, wait: 'after the second bell', run: chapter4 },
    { n: 5, title: 'La noche', sub: 'the petal path, the names, the Hush', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell', run: chapter5 },
  ];
  let talking = false;
  async function kidTalk() { if (talking) return; talking = true; try { await kidTalk0(); } finally { talking = false; kidHome(); } }
  async function kidTalk0() {
    const st = S(), f = flags();
    if (!st.met) { await meet(); return; }
    const next = CH.find(c => !st.ch[c.n]), opts = [];
    if (next) opts.push(next.gate(f) ? { label: `Chapter ${next.n}: ${next.title}`, sub: next.n === 4 && st.round4 ? `memories: ${nIv(st)}/5` : next.sub, value: 'next' } : { label: `Chapter ${next.n}: ${next.title}`, sub: `later: ${next.wait}`, value: 'wait' });
    if (st.ch[1]) opts.push({ label: 'The ofrenda words again', sub: 'cempasúchil, vela, pan de muerto…', value: 'words' });
    if (st.ch[3]) opts.push({ label: 'Calaveritas again', value: 'cal' });
    opts.push({ label: 'Chat', value: 'chat' });
    if (st.crown) opts.push({ label: st.crownOff ? `Put the cempasúchil crown back on ${mimo()}` : `Take ${mimo()}’s crown off`, value: 'crown' });
    const v = await UI.choose('Xochi: «¿Qué hacemos?» (What shall we do?)', opts);
    if (v === 'next') return next.run();
    if (v === 'wait') return scene(async () => { standBy(); shotKid(); await say('kid', 'x.wait'); });
    if (v === 'words') { const r = await MUI.lesson({ title: 'La ofrenda', sub: 'the words again', face: 'muKid', name: 'Xochi', items: L1, recall: true }); if (!r.quit) teachAll(L1.map(o => o.id)); return; }
    if (v === 'cal') { await MUI.steps(calSteps(), { title: 'Calaveritas', sub: 'again!', face: 'muCalavera', name: 'Xochi' }); return; }
    if (v === 'chat') { st.chat = (st.chat || 0) + 1; return scene(async () => { standBy(); shotKid(); await say('kid', st.ch[5] ? (st.chat % 2 ? 'x.idle5' : 'x.idle4') : ['x.idle1', 'x.idle2', 'x.idle3', 'x.idle4'][st.chat % 4]); }); }
    if (v === 'crown') { st.crownOff = !st.crownOff; if (!st.crownOff && G.state.lu && G.state.lu.mask) G.state.lu.maskOff = true; UI.toast(st.crownOff ? 'Crown off.' : `${mimo()} wears the cempasúchil crown again!`); if (G.save) G.save(); }
  }
  async function luchaTalk() { const st = S(); st.lchat = (st.lchat || 0) + 1; await scene(async () => { const u = faceTo(B.lucha, 1.5); shotPair(B.lucha, u); await speak(B.lucha, st.lchat % 2 ? 'l.idle1' : 'l.idle2', { name: 'Abuela Lucha' }); }); }
  const elderLabel = id => `Ask about ${PEOPLE[id].plural ? 'the Gil twins' : PEOPLE[id].name.split(' ')[0]}`;
  const PROVIDER = {
    interactables() {
      if (!B || !shown() || MUI.isOpen || FEST.on || (G.indoors && G.indoors())) return [];
      const L = [], Y = G.sim.you, st = S(), add = (x, z, r, label, run, y) => L.push({ x, z, y: y !== undefined ? y : B.gy(x, z), r, label, run });
      if (Math.hypot(Y.x - B.kid.x, Y.z - B.kid.z) < 14) add(B.kid.x, B.kid.z, 2.0, 'Talk', kidTalk);
      if (st.lucha && Math.hypot(Y.x - B.lucha.x, Y.z - B.lucha.z) < 8) add(B.lucha.x, B.lucha.z, 1.7, 'Talk', luchaTalk);
      if (st.round4) for (const id of ROW) {
        if (ivDone(st, id) || (id === 'aurora' && typeof CEMETERY !== 'undefined' && CEMETERY.era === 'past')) continue;
        const p = WHO[IV[id].elder](); if (p && !p.hidden && Math.hypot(Y.x - p.x, Y.z - p.z) < 7) add(p.x, p.z, 2.2, elderLabel(id), () => interview(id), p.y !== undefined ? p.y : undefined);
      }
      return L;
    },
    tick(dt, Y) {
      if (!B || !shown()) return;
      const st = S();
      if (!st.seen && Math.hypot(Y.x - B.kid.x, Y.z - B.kid.z) < 9) { st.seen = true; think('A girl with a little wagon full of orange flowers waves at you: «¡Hola! ¡Hola!»', 4.5); }
    },
  };

  // ================================================================ the quest (quests.js LIST: Spanish games only)
  function quest() {
    const y = s => s.mu || {}, ch = (s, n) => !!(y(s).ch && y(s).ch[n]), kidAt = () => (B ? { x: B.kid.x, z: B.kid.z } : SPOT.kid);
    const step = (n, text, why, hint, target) => ({ get text() { const c = CH[n - 1]; return c && !c.gate(flags()) ? text : text.replace(/ \(after [^)]*\)$/, ''); }, why, done: s => ch(s, n), target: target || kidAt, hint });
    const n4 = s => ROW.filter(id => y(s).iv && y(s).iv[id] && y(s).iv[id].mem).length;
    const nextElder = () => { const st = G && G.state && G.state.mu; if (st && st.round4) for (const id of ROW) if (!(st.iv && st.iv[id] && st.iv[id].mem)) { const p = WHO[IV[id].elder](); if (p) return { x: p.x, z: p.z }; } return kidAt(); };
    return {
      id: 'mu', kind: 'side', title: 'Xochi’s Día de Muertos', giver: 'Xochi, the girl with the marigold wagon by the bell tower',
      started: s => s.lang === 'es' && !!y(s).met,
      steps: [
        step(1, 'Build the ofrenda with Xochi (la ofrenda)', 'What goes on a Day of the Dead altar, and why: marigolds, candles, bread, papel picado, the photo, water, salt. Then tell {mimo} where each thing goes.', '{mimo} sniffs the air: marigolds!'),
        step(2, 'Pan de muerto with Marta, papel picado with abuela Lucha (after the big Hushling on the hill)', 'Marta reads the recipe and you give {mimo} the orders; then fold, cut and open your own papel picado.', '{mimo} smells fresh bread.'),
        step(3, 'Calaveritas with Xochi (after the first bell)', 'Funny rhymes where la Calaca comes for Alba’s people: say the last lines, finish the rhymes.', '{mimo} giggles.'),
        Object.assign(step(4, 'Recuerdos: ask Alba’s elders about the people in the cemetery ({n}/5) (after the second bell)', 'Ask «¿Cómo era…?» and «¿Qué le gustaba?», then write a memory in the past (era, le gustaba, hacía…). Rosa, Otto, Clara, Don Fello and Doña Tina remember.', '{mimo} points at the next elder to ask.', nextElder), { n: n4 }),
        step(5, 'La noche: the Day of the Dead (after the third bell)', 'The petal path from the cemetery, and the names on the ofrenda.', '{mimo} looks north, toward the cemetery.'),
      ],
      story: [
        { when: s => !!y(s).met, text: 'By the bell tower, Xochi (Xóchitl: “flower” in Nahuatl), nine, pulls a little wagon full of marigolds. Her great-grandmother Esperanza came to Alba from Oaxaca long ago and lies in the cemetery. Xochi wants a big ofrenda in the plaza, for all of Alba: the Hush erases names, but it can’t take the names people say.' },
        { when: s => ch(s, 1), text: 'You built the ofrenda with Xochi: «Pon la vela al lado de la foto».' },
        { when: s => ch(s, 2), text: 'You baked pan de muerto with Marta (Esperanza’s recipe: it tastes of orange blossom) and cut your own papel picado with abuela Lucha.' },
        { when: s => ch(s, 3), text: 'Calaveritas: la Calaca came for Bruno, Don Fello, Rosa, Marta, Tito, {mimo} and Xochi, and something funny happened every time. Xochi gave {mimo} a sugar skull with its name on it.' },
        { when: s => ch(s, 4), text: 'Alba’s elders remembered Andrés, Lorenzo, Sofía, the Gil twins and Aurora, and Doña Tina told you about Esperanza. Their photos are on the ofrenda now.' },
        { when: s => ch(s, 5), text: 'On the night, a petal path ran from Esperanza’s grave to the plaza. The Hush came to erase the names on the photos, and you said every one of them, with a memory. Warm lights came down the path, the band played, and {mimo} got a cempasúchil crown.' },
      ],
    };
  }

  // ================================================================ signs, the map mark
  function signs() {
    if (typeof SIGNS === 'undefined' || !SIGNS.add) return;
    SIGNS.add({ id: 'mu-grave', x: SPOT.grave.x, z: SPOT.grave.z - 1.3, r: 1.5, when: () => shown() && !(typeof CEMETERY !== 'undefined' && CEMETERY.era === 'past'),
      card: () => ({ tag: 'A grave with fresh marigolds', lines: [{ text: 'Esperanza Ríos', en: 'Xochi’s great-grandmother' }, { text: 'Siempre te recordamos', en: 'We always remember you' }] }) });
    const bp = ALT.at(2.05, 1.1);
    SIGNS.add({ id: 'mu-board', x: bp.x, z: bp.z, r: 1.3, when: () => shown() && !!(G.state.mu && G.state.mu.ch && G.state.mu.ch[3]), card: () => ({ tag: 'Calaveritas de Alba', lines: calLines() }) });
    SIGNS.add({ id: 'mu-ofrenda', x: FRONT.x, z: FRONT.z, r: 1.4, when: () => shown() && !!(G.state.mu && G.state.mu.ch && G.state.mu.ch[1]),
      card: () => ({ tag: 'La ofrenda de Alba', lines: [{ text: 'Siempre te recordamos', en: 'We always remember you' }].concat(['esperanza'].concat(G.state.mu.ch[4] ? ROW : []).map(id => ({ text: PEOPLE[id].name, en: PEOPLE[id].role || '' }))) }) });
  }
  const MARK = {};
  function mapMark(dpr) {
    if (!B || !shown() || !(G.state.mu && G.state.mu.ch && G.state.mu.ch[1])) return null;
    const k = String(dpr);
    if (!MARK[k]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr); const c = cv.getContext('2d'); c.scale(dpr, dpr);
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.fillStyle = i % 2 ? '#f7b52c' : '#f39a1e'; c.beginPath(); c.arc(9 + Math.cos(a) * 4.6, 9 + Math.sin(a) * 4.6, 3.3, 0, TAU); c.fill(); }
      c.fillStyle = '#d9770f'; c.beginPath(); c.arc(9, 9, 3, 0, TAU); c.fill(); c.strokeStyle = '#2b2235'; c.lineWidth = 1; c.beginPath(); c.arc(9, 9, 8.2, 0, TAU); c.stroke();
      MARK[k] = cv;
    }
    return { x: SPOT.alt.x, z: SPOT.alt.z, img: MARK[k] };
  }

  // ================================================================ start
  function init(game) {
    G = game; ZHF.bind(game); MUI.bind(game);
    registerLex(); registerIcons();
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'mu')) QUESTS.LIST.push(quest());
    signs();
    setInterval(() => { if (shown()) keepFar(); }, 30000);
  }
  // ================================================================ tests (the game never calls these)
  const TEST = {
    fast(on = true) { MUI.fast = on; },
    setup(fl) { Object.assign(G.state.flags, { hatched: true, rosa: true }, fl || {}); },
    // play on through scenes, cards and calls (answering with each card's model), menus (o.choose), lines (E)
    async drive(o = {}) {
      const g = window.__g, log = [], t0 = performance.now(), $q = s => document.querySelector(s);
      while (performance.now() - t0 < (o.sec || 25) * 1000) {
        if (MUI.cur) { const a = (o.answer && o.answer(MUI.cur)) || MUI.cur.model || 'x'; log.push('card: ' + a); await MUI.cur.submit(a); await g.go(0.05); continue; }
        if (MUI.hcur) { const a = (o.answer && o.answer(MUI.hcur)) || MUI.hcur.model; log.push('call: ' + a); MUI.hcur.submit(a); await g.go(0.05); continue; }
        const ch = $q('#choose:not(.hidden)');
        if (ch) { const bs = [...ch.querySelectorAll('button')]; const i = typeof o.choose === 'function' ? o.choose(ch.textContent, bs.map(b => b.textContent)) : (o.choose || 0); log.push('choose: ' + (bs[i] ? bs[i].textContent.slice(0, 40) : '?')); (bs[i] || bs[0]).click(); await g.go(0.1); continue; }
        const card = $q('#card:not(.hidden)');
        if (card && card.textContent.trim()) { log.push('card: ' + card.textContent.replace(/\s+/g, ' ').slice(0, 40)); dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true, cancelable: true })); await g.go(0.1); await new Promise(r => setTimeout(r, 300)); continue; }
        if (STORY.line) { const s = (STORY.line.name || STORY.line.who || '') + ': ' + String(STORY.line.text || (STORY.line.parts || []).map(p => p.s).join('')).slice(0, 60); if (log[log.length - 1] !== s) log.push(s); if (!STORY.line.full) STORY.line.shown = 1e6; await g.press(); continue; }
        if (!STORY.busy && !MUI.isOpen && !MUI.hud.open_ && !(o.busy && o.busy())) break;
        await g.go(o.step || 0.15); await null;
      }
      return log;
    },
    get FEST() { return FEST; }, get B() { return B; }, get NIGHT() { return NIGHT; },
  };
  return {
    init, build, update, quest, hatOn, mapMark, interactables: () => [],
    get busy() { return FEST.on; },
    _: { S: () => S(), LT, PH, PEOPLE, IV, BUILD, RECIPE, CAL_READ, CAL_DO, SPOT, ALT, PATH, FRONT, placeCheck, recipeCheck, rhymeCheck, nameCheck, memHit, hasImpf, presentSlip, askQ1, askQ2, memCheck,
      portrait, papel, drawAltar, drawBread, drawFold, chapter1, chapter2, chapter3, chapter4, chapter5, meet, kidTalk, interview, bakery, papelPicado, festOn, festOff, hangPapel, photoK, petals, nightApply, flyPath, visitorsCome, PROVIDER, CH, t: TEST },
  };
})();
