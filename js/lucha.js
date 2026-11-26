'use strict';
// La Campana: Spanish's mentor with a secret training spot (SIDES.md: "a mentor with a secret training spot"), es games only.
// WHO: Doña Toña (Antonia Ruiz), who pats tortillas by hand at her stand on Alba's market street. Strong hands (bandaged
// knuckles: «es de hacer tortillas»), a tiny bell painted on the stand's side door, a mask in the counter drawer. Secretly she
// is «La Campana», a técnica luchadora with a golden mask and a little bell on its forehead: when she flies off the top rope it
// rings, and the Hush hates ringing. When the bells went quiet she stopped fighting; her old arena under the stand,
// «La Arenita», gathered dust. Original: not based on any real luchador or character. Lucha libre is family entertainment
// here: técnicos and rudos, a choreographed show, and the mask is sacred (nobody is ever unmasked by force).
// THE GYM: «La Arenita» (−110, 300, −250), down the stand's side door: a little ring (ropes, corner pads, the timekeeper's
// bell), benches, posters, a punching bag. Her trainee «El Bolillo» (a cheerful rudo-in-training with a bread-colored mask)
// spars there.
// CHAPTERS (gated like every side character: Rosa's welcome, the big Hushling, bells 1, 2, 3):
//   1 La tortillería: order tortillas politely (usted: «Me da medio kilo…», «¿Cuánto es?»), ask about her hands; Mimo finds the
//     mask with the bell; «¿Me guardas un secreto?»; she opens the side door
//   2 El vocabulario: técnico / rudo, la máscara, la llave, el tope, la plancha, la tercera cuerda, el réferi, «¡uno, dos, tres!»;
//     then name what she points at in the ring
//   3 ¡Damas y caballeros!: announcer Spanish: narrate La Campana vs El Bolillo as it happens (present: «¡Salta! ¡Vuela!»),
//     then the replay in the preterite («¡Saltó! ¡Voló! ¡Cayó!»)
//   4 El entrenamiento: tú orders to Mimo in the ring, pronouns attached (¡Agárralo! ¡Rebota en las cuerdas! ¡Súbete a las
//     cuerdas! ¡Tope! ¡Lánzate!)
//   5 La función: the arena reopens and Alba comes to watch; «El Mudo», a rudo the Hush made (a gray mask, a stitched mouth),
//     silences the crowd. Lead the chant, call the moves, count «¡uno, dos, tres!»; the bells ring him away (his mask stays on).
//     Mimo learns «la plancha» for es battles: «¡Lánzate sobre el rojo!» (a jump with twice the power), and gets a mini mask.
// API: LUCHA.init(game) · LUCHA.build(scene, env) → { colliders, group, people, update } · as a room (main.js ROOMS): .inside ·
// .OUTSIDE · .interactables() · .update(dt, t) for the room is .roomUpdate · .enter() · .leave() · LUCHA.hatOn() · .mapMark(dpr) ·
// .quest() · ._ (tests: ._.t). State: G.state.lu. Phrases: ph.lu.*. Song: 'lu_campana'. Battle verb: 'dive' (v.dive).
// Needs THREE (r128), core.js, toonkit.js, zhfolk.js (3D kit, rig, music deck), muertos_ui.js (MUI panels), icons.js.

const LUCHA = (() => {
  const X0 = -110, Y0 = 300, Z0 = -250, HW = 8, HD = 7, MAT = 0.55;
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const esc = s => MUI.esc(s);
  let G = null, B = null, R = null;
  const S = () => { const s = G.state; if (!s.lu) s.lu = {}; const o = s.lu; o.ch = o.ch || {}; return o; };
  const on = () => !!(G && G.state && G.state.lang === 'es' && G.state.flags && G.state.flags.hatched);
  const flags = () => (G && G.state && G.state.flags) || {};
  const mimo = () => (G && G.state && G.state.mimoName) || 'Mimo';
  const sub = s => String(s).split('{mimo}').join(mimo());
  // her stand on the market street (north side, between the last stall and the house), its side door down to the gym
  const STAND = { x: 20.8, z: -154.2 }, TONA = { x: 20.8, z: -154.95, yaw: 0 }, DOOR = { x: 18.85, z: -154.4 }, DOOR_IN = { x: 18.1, z: -154.4 };
  const SHOP = { x: 20.8, z: -152.4 };            // where you stand to buy
  // the gym (room coordinates: +z toward the camera, the ring north of the door)
  const RING = { x: 0, z: -1.6, h: 2.8 }, SPOT = { spawn: { x: 0, z: 5.6 }, exit: { x: 0, z: 6.6 }, you: { x: 1.4, z: 3.6 }, coach: { x: -1.4, z: 2.6 }, bell: { x: 3.9, z: 2.4 }, bag: { x: -6.2, z: -2.5 } };

  // ================================================================ the Phrasebook (LEX kind 'phrase', es; region «México · Lucha libre»)
  const R_LU = 'México · Lucha libre';
  const PH = [
    { id: 'ph.lu.meda', es: 'Me da medio kilo de tortillas, por favor.', en: 'Half a kilo of tortillas, please.', keys: ['me da', 'medio kilo', 'un kilo', 'deme'], note: 'At a shop, «Me da…» (lit. “you give me…”) is the polite way to ask for something. Tortillas are sold by weight: un kilo, medio kilo, un cuarto.', sit: 'You’re at a tortilla stand. Ask for half a kilo, politely.' },
    { id: 'ph.lu.cuanto', es: '¿Cuánto es?', en: 'How much is it?', keys: ['cuanto es', 'cuanto le debo', 'cuanto cuesta', 'cuanto cuestan'], note: '«¿Cuánto le debo?» (how much do I owe you?) is just as common.', sit: 'Ask how much it is.' },
    { id: 'ph.lu.vayabien', es: '¡Que le vaya bien!', en: 'Have a good day! (lit. may it go well for you)', keys: ['que le vaya bien', 'que te vaya bien', 'que les vaya bien'], note: 'What you say when you leave a shop, or someone leaves. «le» is polite (usted); with a friend: «¡Que te vaya bien!».', sit: 'You’re leaving the stand. Wish her a good day, politely.' },
    { id: 'ph.lu.secreto', es: 'Es un secreto.', en: 'It’s a secret.', keys: ['es un secreto', 'un secreto', 'te guardo el secreto', 'guardo el secreto'], note: '«¿Me guardas un secreto?»: can you keep a secret for me? «¡Te lo guardo!»: I’ll keep it!', sit: 'Promise you won’t tell anyone: it’s a secret.' },
    { id: 'ph.lu.tecnico', es: 'el técnico, la técnica', en: 'the good guy (in lucha libre)', keys: ['tecnico', 'tecnica'], note: 'Técnicos fight fair, with flying moves, and the crowd cheers them.', sit: 'The one who fights fair and flies off the ropes is…?' },
    { id: 'ph.lu.rudo', es: 'el rudo, la ruda', en: 'the bad guy (in lucha libre)', keys: ['rudo', 'ruda', 'rudos'], note: 'Rudos break the rules and the crowd boos them. It’s theater: outside the ring, rudos and técnicos are often friends.', sit: 'The one who cheats behind the réferi’s back is…?' },
    { id: 'ph.lu.mascara', es: 'la máscara', en: 'the mask', keys: ['mascara', 'mascaras'], note: 'A luchador’s mask is sacred: it’s who they are. It’s never pulled off by force; it’s only lost by betting it in a match, «máscara contra máscara».', sit: 'What a luchador never takes off in public?' },
    { id: 'ph.lu.llave', es: 'la llave', en: 'a hold, a lock (also: a key)', keys: ['llave', 'llaves'], note: 'In lucha, «aplicar una llave» is to put a hold on someone. Outside the ring, «la llave» opens doors.', sit: 'She twists his arm and holds it. That’s a…?' },
    { id: 'ph.lu.tope', es: 'el tope', en: 'a dive through the ropes (also: a speed bump)', keys: ['tope', 'topes'], note: 'A dive between the ropes onto someone outside the ring. In Mexico «un tope» is also a speed bump!', sit: 'She dives between the ropes onto him, outside the ring. A…?' },
    { id: 'ph.lu.plancha', es: 'la plancha', en: 'a flying body press (also: an iron)', keys: ['plancha'], note: 'Flying off the ropes and landing flat on your rival. At home, «la plancha» irons your shirts.', sit: 'She flies off the ropes and lands flat on him. A…?' },
    { id: 'ph.lu.cuerda', es: 'la tercera cuerda', en: 'the top rope (lit. the third rope)', keys: ['tercera cuerda', 'la tercera cuerda'], note: 'The ring has three ropes; the top one is «la tercera». The big flying moves start up there.', sit: 'Where does she climb before she flies?' },
    { id: 'ph.lu.referi', es: 'el réferi', en: 'the referee', keys: ['referi', 'referee', 'arbitro', 'el referi'], note: 'From English “referee”. Rudos love to cheat when he isn’t looking.', sit: 'Who counts to three?' },
    { id: 'ph.lu.cuenta', es: '¡Uno, dos, tres!', en: 'One, two, three! (the count)', keys: ['uno dos tres'], note: 'Both shoulders on the mat for three: a fall («una caída»). Classic matches go «a dos de tres caídas»: best two falls out of three.', sit: 'His shoulders are on the mat. Count with the réferi!' },
    { id: 'ph.lu.damas', es: '¡Damas y caballeros!', en: 'Ladies and gentlemen!', keys: ['damas y caballeros'], note: 'How every announcer opens the show.', sit: 'You’re the announcer. Open the show!' },
    { id: 'ph.lu.volo', es: '¡Voló!', en: 'She flew! / He flew!', keys: ['volo'], note: 'The preterite (what happened): vuela → voló, salta → saltó, sube → subió, cae → cayó.', sit: 'Replay: she flew off the top rope. Say what happened.' },
    { id: 'ph.lu.cayo', es: '¡Cayó!', en: 'He fell! / She fell!', keys: ['cayo'], note: 'caer (to fall): cae → cayó, with a «y». Announcers stretch it: «¡CAYÓÓÓ!».', sit: 'Replay: he fell on the mat. Say what happened.' },
    { id: 'ph.lu.agarralo', es: '¡Agárralo!', en: 'Grab him! / Grab it!', keys: ['agarralo', 'agarrala'], note: 'agarra + lo: the pronoun sticks to the end of an order, and an accent keeps the stress: agárralo.', sit: 'Tell {mimo} to grab the dummy.' },
    { id: 'ph.lu.subete', es: '¡Súbete a las cuerdas!', en: 'Climb up on the ropes!', keys: ['subete'], note: 'subir + te: «súbete» (get yourself up). Same pattern: siéntate, levántate, lánzate.', sit: 'Tell {mimo} to climb up on the ropes.' },
    { id: 'ph.lu.rebota', es: '¡Rebota en las cuerdas!', en: 'Bounce off the ropes!', keys: ['rebota'], note: 'Run into the ropes and let them throw you back, faster.', sit: 'Tell {mimo} to bounce off the ropes.' },
    { id: 'ph.lu.lanzate', es: '¡Lánzate!', en: 'Dive! (lit. throw yourself!)', keys: ['lanzate', 'avientate', 'tirate'], note: 'lanzar + te. In Mexico you’ll also hear «¡Aviéntate!». In battle: «¡Lánzate sobre el rojo!».', sit: 'Tell {mimo} to dive off the ropes.' },
    { id: 'ph.lu.campana', es: '¡Cam-pa-na! ¡Cam-pa-na!', en: 'The crowd’s chant for La Campana', keys: ['campana'], note: 'Crowds chant their favorite’s name, syllable by syllable, clapping on each one.', sit: 'The crowd went quiet. Start the chant!' },
    { id: 'ph.lu.otra', es: '¡Otra! ¡Otra!', en: 'Again! Again! (an encore)', keys: ['otra'], note: 'What a Mexican crowd shouts when it wants more: another song, another round.', sit: 'The show is over and you want more!' },
  ];
  PH.forEach(p => { p.register = 'casual'; p.region = R_LU; p.icon = p.icon || 'luCampana'; });
  const PHI = Object.fromEntries(PH.map(p => [p.id, p]));
  const item = id => { const p = PHI[id]; return Object.assign({}, p, { sit: sub(p.sit || p.en), note: sub(p.note || '') }); };
  const nowS = () => Date.now() / 1000;
  function teach(id) {
    if (typeof LEX === 'undefined' || !LEX.item(id) || LEX.lang !== 'es') return;
    const s = LEX.st(id), t = nowS(); LEX.expose(id); if (s.stage < 3) s.stage = 3; s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 30 * 86400; s.last = t;
  }
  const teachAll = ids => ids.forEach(teach);
  function keepFar() { if (typeof LEX === 'undefined' || LEX.lang !== 'es') return; const t = nowS(); for (const p of PH) { if (!LEX.item(p.id)) continue; const s = LEX.st(p.id); if (s.stage >= 2 && s.due < t + 86400) { s.due = t + 30 * 86400; s.str = Math.max(s.str || 0, 30 * 86400); } } }

  // ================================================================ what they say: [Spanish, English] (she calls you «usted» at the
  // stand, «tú» in the gym; nobody genders the player: «quien llegó en el tren», «la persona nueva», «¿Me guardas un secreto?»)
  const LT = {
    't.hi': ['¡Tortillas, tortillas calientitas! ¡Hechas a mano! ¿Qué le doy?', 'Tortillas, warm tortillas! Handmade! What can I get you?'],
    't.name': ['Soy Toña. Aquí todos me compran las tortillas… ¡porque son las mejores!', 'I’m Toña. Everybody here buys my tortillas… because they’re the best!'],
    't.weigh': ['Medio kilo, ¡ahorita! Mire: las pongo en la báscula…', 'Half a kilo, coming right up! Look: I’ll put them on the scale…'],
    't.price': ['Son veinte pesos. Bueno… para usted, quince. ¡Por ser la persona nueva del pueblo!', 'That’s twenty pesos. Well… fifteen for you. For being the new person in town!'],
    't.hands': ['¿Mis manos? Ah… no es nada. Es de hacer tortillas. ¡Muchas tortillas!', 'My hands? Oh… it’s nothing. It’s from making tortillas. Lots of tortillas!'],
    't.drawer': ['¡No, no, no! ¡Ese cajón no! ¡{mimo}, suelta eso!', 'No, no, no! Not that drawer! {mimo}, let go of that!'],
    't.ay': ['¡Ay! Esto… esto no es mío. Es… de una amiga.', 'Oh! This… this isn’t mine. It’s… a friend’s.'],
    't.ok': ['Bueno, sí es mío. ¿Me guardas un secreto?', 'All right, it is mine. Can you keep a secret for me?'],
    't.campana': ['Antes de los silencios, yo era La Campana. ¡La técnica más valiente de la Arenita!', 'Before the silences, I was La Campana. The bravest técnica in the Arenita!'],
    't.bell': ['¿Ves la campanita? Suena cuando vuelo. Y el Silencio odia que suene.', 'See the little bell? It rings when I fly. And the Hush hates it ringing.'],
    't.door': ['La puerta del lado, la de la campanita… baja por ahí. Te espero abajo.', 'The side door, the one with the little bell… go down that way. I’ll wait for you downstairs.'],
    't.wait': ['¡Todavía no! Ahorita tengo mucha masa. Vuelve más tarde, ¿sí?', 'Not yet! I’ve got lots of dough right now. Come back later, OK?'],
    't.day': ['¡Shhh! Aquí arriba solo soy Toña, la de las tortillas.', 'Shhh! Up here I’m just Toña, the tortilla lady.'],
    'c.welcome': ['¡Te doy la bienvenida a la Arenita! Aquí abajo no soy Toña: ¡soy La Campana!', 'Welcome to the Arenita! Down here I’m not Toña: I’m La Campana!'],
    'c.dust': ['Hace mucho que nadie pelea aquí. Pero con {mimo}… quizás la Arenita vuelve a sonar.', 'Nobody has fought here in a long time. But with {mimo}… maybe the Arenita will ring again.'],
    'c.l2': ['Primero, las palabras. Sin palabras, no hay lucha.', 'First, the words. Without words, there’s no lucha.'],
    'c.respect': ['La máscara es sagrada. Nadie se la quita a nadie. ¿Entendido?', 'The mask is sacred. Nobody takes it off anybody. Understood?'],
    'c.l3': ['Una lucha sin narrador es una lucha sin alma. ¡Hoy tú narras!', 'A match without an announcer is a match without a soul. Today you call it!'],
    'c.bolillo': ['Te presento a El Bolillo, mi alumno. Es rudo… pero muy buena gente.', 'Meet El Bolillo, my student. He’s a rudo… but a really nice guy.'],
    'b.hi': ['¡Quiubo! Soy El Bolillo. ¡El rudo más rudo de la panadería!', 'Hey there! I’m El Bolillo. The roughest rudo in the bakery!'],
    'c.replay': ['¡Ahora la repetición! Lo que pasó, en pasado: saltó, voló, cayó.', 'Now the replay! What happened, in the past: saltó, voló, cayó.'],
    'b.lost': ['¡Ay, mi espalda! Bueno… otra vez gana la técnica.', 'Oh, my back! Well… the técnica wins again.'],
    'c.l4': ['Ahora entrenamos a {mimo}. Tú le das las órdenes. ¡Fuerte y claro!', 'Now we train {mimo}. You give the orders. Loud and clear!'],
    'c.muneco': ['Este es Don Costal, nuestro muñeco. No se queja nunca.', 'This is Don Costal, our dummy. He never complains.'],
    'c.done4': ['¡{mimo} tiene corazón de técnico! Ya casi está listo para la función.', '{mimo} has a técnico’s heart! Almost ready for the show.'],
    'c.l5': ['¡Esta noche hay función! Abrí la Arenita para todo Alba.', 'Tonight there’s a show! I opened the Arenita for all of Alba.'],
    'c.l5b': ['Lucharemos en relevos: {mimo} y yo, contra… no sé. El cartel dice «un misterioso».', 'We’ll fight as a tag team: {mimo} and me, against… I don’t know. The poster says “a mystery opponent”.'],
    'r.hi': ['¡Damas y caballeros! ¡Lucha a una caída! ¡En esta esquina… La Campana y su compañero!', 'Ladies and gentlemen! A one-fall match! In this corner… La Campana and partner!'],
    'r.mudo': ['Y en la otra esquina… ¿quién es usted?', 'And in the other corner… who are you?'],
    'm.hush': ['……', '……'],
    'c.mudo': ['¡Es El Mudo! ¡Un rudo del Silencio! ¡Le quita la voz a la gente!', 'It’s El Mudo! A rudo made of the Hush! He takes people’s voices away!'],
    'c.chant': ['¡No se callen! ¡El Silencio odia el ruido! ¡Que suene la Arenita!', 'Don’t go quiet! The Hush hates noise! Let the Arenita ring!'],
    'c.won': ['¡Se fue! Y su máscara, con él. Así es la lucha: nadie le quita la máscara a nadie.', 'He’s gone! And his mask with him. That’s lucha: nobody takes anyone’s mask.'],
    'c.gift': ['{mimo}, esta máscara es para ti. ¡Con su campanita! Y mi plancha también es tuya: «¡Lánzate!».', '{mimo}, this mask is for you. With its little bell! And my plancha is yours too: “¡Lánzate!”.'],
    'c.secret': ['Y mañana… mañana vuelvo a ser Toña, la de las tortillas. ¿Verdad que es un secreto?', 'And tomorrow… tomorrow I’m Toña the tortilla lady again. It’s a secret, right?'],
    'c.idle1': ['La lucha es teatro, pero los golpes de la lona son reales. ¡Calienta antes!', 'Lucha is theater, but the mat hits for real. Warm up first!'],
    'c.idle2': ['Mi abuela era luchadora también. Ella me dio mi primera máscara.', 'My grandma was a luchadora too. She gave me my first mask.'],
    'c.idle3': ['¡Toca la campana del ring si quieres! Al Silencio no le gusta nada.', 'Ring the ring bell if you like! The Hush doesn’t like it one bit.'],
    'b.idle': ['¿Sabías que «bolillo» es un pan? ¡Por eso mi máscara es café!', 'Did you know «bolillo» is a bread roll? That’s why my mask is brown!'],
  };
  const lineOf = k => { const L = LT[k] || [k, k]; return { es: sub(L[0]), en: sub(L[1]) }; };

  // ================================================================ icons
  function registerIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const has = k => ICONS.keys.includes(k);
    const mask = (c, p, h, base, trim, o = {}) => {
      h.shape(c, p, cc => { cc.moveTo(-28, 14); cc.bezierCurveTo(-32, -40, 32, -40, 28, 14); cc.quadraticCurveTo(24, 34, 0, 36); cc.quadraticCurveTo(-24, 34, -28, 14); cc.closePath(); }, base);
      if (!p) return;
      for (const s of [-1, 1]) { h.shape(c, 1, cc => { cc.ellipse(s * 11, -2, 11, 7, s * 0.25, 0, TAU); }, trim, 1.6); h.shape(c, 1, h.ell(s * 11, -2, 5.5, 4, s * 0.25), '#fffaf0', 1.2); h.dot(c, s * 11, -2, 2.4, h.INK); }
      if (o.mouth === 'stitch') { c.beginPath(); c.moveTo(-10, 20); c.lineTo(10, 20); c.lineWidth = 2.4; c.strokeStyle = h.INK; c.stroke(); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 4.5, 16); c.lineTo(i * 4.5, 24); c.stroke(); } }
      else h.shape(c, 1, h.ell(0, 21, 8, 5), '#c98e62', 1.4);
      if (o.flame) for (let i = 0; i < 3; i++) h.shape(c, 1, cc => { cc.moveTo(-6 + i * 6 - 3, -18); cc.lineTo(-6 + i * 6, -30 - (i === 1 ? 6 : 0)); cc.lineTo(-6 + i * 6 + 3, -18); cc.closePath(); }, trim, 1);
      if (o.bell) { h.shape(c, 1, cc => { cc.moveTo(-6, -16); cc.quadraticCurveTo(-6, -28, 0, -28); cc.quadraticCurveTo(6, -28, 6, -16); cc.lineTo(8, -14); cc.lineTo(-8, -14); cc.closePath(); }, '#f5c518', 1.4); h.dot(c, 0, -12.5, 2, '#8a5a12'); }
    };
    if (!has('luCampana')) ICONS.add('luCampana', (c, p, h) => mask(c, p, h, '#e8b83e', '#c2185b', { bell: true, flame: true }));
    if (!has('luMudo')) ICONS.add('luMudo', (c, p, h) => mask(c, p, h, '#8f8a99', '#5a5566', { mouth: 'stitch' }));
    if (!has('luBolillo')) ICONS.add('luBolillo', (c, p, h) => mask(c, p, h, '#c98a4a', '#fffaf0', {}));
    if (!has('luTona')) ICONS.add('luTona', (c, p, h) => {
      h.shape(c, p, h.ell(18, -18, 10, 12), '#2b1f1a'); h.shape(c, p, h.ell(0, 4, 25, 28), '#b98060');
      h.shape(c, p, cc => { cc.moveTo(-27, 0); cc.bezierCurveTo(-29, -38, 29, -38, 27, 0); cc.quadraticCurveTo(10, -16, -27, 0); cc.closePath(); }, '#2b1f1a');
      if (!p) return; h.shape(c, 1, cc => { cc.moveTo(-26, -10); cc.quadraticCurveTo(0, -30, 26, -10); cc.lineTo(24, -4); cc.quadraticCurveTo(0, -22, -24, -4); cc.closePath(); }, '#e2337f', 1.4);
      h.eyes(c, -9, 9, 4); c.beginPath(); c.arc(0, 14, 7, 0.2, Math.PI - 0.2); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke(); h.dot(c, -16, 13, 4.5, 'rgba(255,120,150,.5)'); h.dot(c, 16, 13, 4.5, 'rgba(255,120,150,.5)');
    });
    if (!has('luTortilla')) ICONS.add('luTortilla', (c, p, h) => { for (let i = 0; i < 4; i++) h.shape(c, p, h.ell(0, 14 - i * 7, 32, 10), i % 2 ? '#f0d79a' : '#e8c880'); if (p) for (let i = 0; i < 9; i++) h.dot(c, -20 + (i * 13) % 40, -8 + (i * 7) % 8, 2, '#c99a4a'); h.shape(c, p, cc => { cc.moveTo(-36, 20); cc.quadraticCurveTo(0, 40, 36, 20); cc.lineTo(36, 26); cc.quadraticCurveTo(0, 46, -36, 26); cc.closePath(); }, '#e2337f'); });
    if (!has('luBell')) ICONS.add('luBell', (c, p, h) => { h.shape(c, p, cc => { cc.moveTo(-22, 16); cc.quadraticCurveTo(-24, -28, 0, -30); cc.quadraticCurveTo(24, -28, 22, 16); cc.lineTo(28, 22); cc.lineTo(-28, 22); cc.closePath(); }, '#f5c518'); h.shape(c, p, h.ell(0, 28, 7, 7), '#8a5a12'); h.shape(c, p, h.rr(-4, -38, 8, 9, 3), '#8a5a12'); if (p) { c.beginPath(); c.moveTo(-14, -8); c.quadraticCurveTo(-16, 6, -14, 14); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.7)'; c.stroke(); } });
    if (!has('luDive')) ICONS.add('luDive', (c, p, h) => {
      if (p) { c.setLineDash([5, 5]); c.beginPath(); c.moveTo(-34, -24); c.quadraticCurveTo(-4, -46, 24, 10); c.lineWidth = 2.4; c.strokeStyle = h.INK; c.stroke(); c.setLineDash([]); }
      h.shape(c, p, h.rr(-38, 18, 76, 10, 3), '#cfe3f0'); h.shape(c, p, h.ell(18, 2, 16, 13, 0.6), '#fbf1df'); [-1, 1].forEach(s => h.shape(c, p, h.ell(10 + s * 6, -12, 4, 11, 0.6 + s * 0.2), '#fbf1df'));
      if (p) { h.shape(c, 1, h.ell(20, 0, 12, 7, 0.6), '#e8b83e', 1.4); h.dot(c, 22, -6, 2.6, '#f5c518'); for (const [x, y] of [[-24, 8], [30, 24], [-10, 22]]) h.dot(c, x, y, 2.4, '#ffd166'); }
    });
  }

  // ================================================================ 3D: the stand, the people, the gym
  const K = () => ZHF.Kit();
  const canvasPlane = (w, h, cw, ch, draw, o) => { const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; draw(cv.getContext('2d')); const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 4; return ZHF.plane(w, h, tex, o || {}); };
  // a lucha mask on a rig's head (base, trim, the bell on the forehead, a stitched mouth)
  function maskOn(p, base, trim, o = {}) {
    const kh = K(), r = 0.25 * (p.kid ? 1.1 : 1);
    kh.ball(0, 0.0, -0.005, r * 1.07, r * 1.07, r * 1.05, base, { ink: 0.018 });
    for (const s of [-1, 1]) { kh.ball(s * 0.095, 0.03, r * 0.9, 0.075, 0.05, 0.03, trim, { ink: 0, az: s * 0.3 }); kh.ball(s * 0.095, 0.03, r * 0.95, 0.045, 0.032, 0.02, '#fffaf0', { ink: 0 }); kh.ball(s * 0.095, 0.028, r * 0.985, 0.02, 0.022, 0.01, '#2b2235', { ink: 0 }); }
    if (o.stitch) { kh.box(0, -0.11, r * 0.97, 0.12, 0.012, 0.01, '#2b2235', { ink: 0 }); for (let i = -2; i <= 2; i++) kh.box(i * 0.025, -0.11, r * 0.98, 0.006, 0.04, 0.008, '#2b2235', { ink: 0 }); }
    else kh.ball(0, -0.11, r * 0.93, 0.05, 0.032, 0.02, p.look.skin, { ink: 0 });
    if (o.flames) for (let i = -1; i <= 1; i++) kh.cone(i * 0.07, 0.12 + (i ? 0 : 0.03), r * 0.86, 0.025, 0.09, trim, { rx: -0.3, ink: 0 });
    if (o.bell) { kh.ball(0, 0.2, r * 0.82, 0.04, 0.04, 0.035, '#f5c518', { ink: 0.006 }); kh.cone(0, 0.235, r * 0.8, 0.045, 0.05, '#f5c518', { ink: 0 }); kh.ball(0, 0.165, r * 0.85, 0.012, 0.012, 0.012, '#8a5a12', { ink: 0 }); }
    if (o.lace) kh.rod([-0.05, 0.05, -r * 0.95], [0.05, -0.05, -r * 0.95], 0.01, trim, { ink: 0 });
    ZHF.bake(p.head, kh);
  }
  const person = (look, o) => { const p = ZHF.person(look, o); return p; };
  function makeTona() {
    const p = person({ skin: '#b98060', hair: '#2b1f1a', shirt: '#f2c14e', sleeve: '#f2c14e', pants: '#3a3a5a', shoes: '#2b2235', apron: '#fdf8ee' });
    const kh = K(); kh.add(ZHF.GEO.tor, '#e2337f', 0, 0.08, -0.02, 0.255, 0.255, 0.18, Math.PI / 2 + 0.3, 0, 0, { ink: 0 }); kh.ball(0, 0.05, -0.3, 0.09, 0.12, 0.09, '#2b1f1a', { ink: 0.008 }); ZHF.bake(p.head, kh);
    for (const a of p.arms) { const kk = K(); kk.ball(0, 0, 0, 0.085, 0.07, 0.085, '#fffaf0', { ink: 0.008 }); const g = new THREE.Group(); ZHF.bake(g, kk); a.userData.hand.add(g); }
    return p;
  }
  function makeCampana() {
    const p = person({ skin: '#b98060', hair: '#e8b83e', shirt: '#c2185b', sleeve: '#b98060', pants: '#e8b83e', shoes: '#c2185b', collar: '#e8b83e' });
    maskOn(p, '#e8b83e', '#c2185b', { bell: true, flames: true, lace: true });
    const kb = K(); kb.box(0, p.shY - 0.18, -0.24, 0.5, 0.62, 0.03, '#c2185b', { ink: 0.008, rx: 0.08 }); kb.box(0, p.hipY + 0.06, 0, 0.6, 0.08, 0.5, '#f5c518', { ink: 0.006 }); ZHF.bake(p.body, kb);
    return p;
  }
  function makeBolillo() { const p = person({ skin: '#e6b48c', hair: '#c98a4a', shirt: '#7a4a2a', sleeve: '#e6b48c', pants: '#c98a4a', shoes: '#3a2b26', belly: true, wide: 1.15 }); maskOn(p, '#c98a4a', '#fffaf0', {}); const kh = K(); for (const s of [-1, 0, 1]) kh.box(s * 0.07, 0.17, 0.12, 0.03, 0.012, 0.16, '#f4e3c0', { ink: 0, rx: -0.6 }); ZHF.bake(p.head, kh); return p; }
  function makeMudo() {
    const p = person({ skin: '#a9a4b5', hair: '#8f8a99', shirt: '#6f6a7c', sleeve: '#a9a4b5', pants: '#5a5566', shoes: '#3a3444', wide: 1.2 });
    maskOn(p, '#8f8a99', '#4a4555', { stitch: true }); const kb = K(); kb.box(0, p.shY - 0.25, -0.26, 0.62, 0.8, 0.03, '#5a5566', { ink: 0.008, rx: 0.1 }); ZHF.bake(p.body, kb);
    p.root.scale.setScalar(1.22); return p;
  }
  function makeRef() { const p = person({ skin: '#e6b48c', hair: '#2b2235', shirt: '#fbfbf6', sleeve: '#fbfbf6', pants: '#2b2235', shoes: '#2b2235', mustache: true }); const kb = K(); for (let i = -2; i <= 2; i++) kb.box(i * 0.1, p.hipY + 0.3, 0.255, 0.035, 0.5, 0.01, '#2b2235', { ink: 0 }); kb.add(ZHF.GEO.tor, '#2b2235', 0, p.hipY + 0.55, 0.26, 0.04, 0.04, 0.02, 0, 0, 0, { ink: 0 }); ZHF.bake(p.body, kb); return p; }

  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    const root = new THREE.Group(); root.name = 'lucha'; scene.add(root); root.visible = false;
    const colliders = [], solid = c => { c.x0 = c.x; c.z0 = c.z; colliders.push(c); return c; };
    // ---------------- her stand: a wooden kiosk, a striped awning, the comal, the scale, the drawer, a side door with a bell
    const y0 = gy(STAND.x, STAND.z), k = K(); k.frame(STAND.x, y0, STAND.z, 0);
    k.box(0, 0.5, 0.15, 2.6, 1.0, 0.5, '#b07a48', { ink: 0.014 }).box(0, 1.03, 0.15, 2.7, 0.06, 0.62, '#8a5f3e', { ink: 0.008 });
    k.box(0, 1.15, -1.05, 2.8, 2.3, 0.1, '#d9a35a', { ink: 0.012 }).box(-1.35, 1.15, -0.45, 0.1, 2.3, 1.3, '#d9a35a', { ink: 0.012 }).box(1.35, 1.15, -0.45, 0.1, 2.3, 1.3, '#d9a35a', { ink: 0.012 });
    for (let i = 0; i < 7; i++) k.box(-1.2 + i * 0.4, 2.42, 0.05, 0.4, 0.06, 1.5, i % 2 ? '#fff4dc' : '#3fa34d', { ink: 0.006, rx: -0.18 });
    k.cyl(-0.55, 1.07, 0.15, 0.32, 0.03, '#2b2235', { ink: 0.006 }); for (let i = 0; i < 3; i++) k.cyl(-0.55 + (i - 1) * 0.12, 1.1, 0.12 + (i % 2) * 0.08, 0.13, 0.012, '#f0d79a', { ink: 0 });
    for (let i = 0; i < 6; i++) k.cyl(0.25, 1.08 + i * 0.012, 0.15, 0.15, 0.011, i % 2 ? '#f0d79a' : '#e8c880', { ink: 0 }); k.box(0.25, 1.06, 0.15, 0.36, 0.01, 0.36, '#e2337f', { ink: 0 });
    k.box(0.85, 1.12, 0.12, 0.28, 0.1, 0.22, '#8a8f9e', { ink: 0.006 }).cyl(0.85, 1.2, 0.12, 0.13, 0.015, '#c8ccd6', { ink: 0 });
    k.box(0.75, 0.62, 0.41, 0.6, 0.18, 0.02, '#8a5f3e', { ink: 0.006 }).ball(0.75, 0.62, 0.43, 0.035, 0.035, 0.02, '#f5c518', { ink: 0 });
    k.box(-1.41, 0.85, -0.25, 0.04, 1.6, 0.8, '#7a4f30', { ink: 0.008 }).ball(-1.44, 1.45, -0.25, 0.08, 0.09, 0.03, '#f5c518', { ink: 0.004 }).ball(-1.44, 0.85, -0.05, 0.03, 0.03, 0.03, '#2b2235', { ink: 0 });
    const stand = new THREE.Group(); ZHF.bake(stand, k); root.add(stand);
    const sign = canvasPlane(2.3, 0.42, 512, 96, c => { c.fillStyle = '#fff4dc'; c.fillRect(0, 0, 512, 96); c.strokeStyle = '#3fa34d'; c.lineWidth = 8; c.strokeRect(4, 4, 504, 88); c.fillStyle = '#2b2235'; c.font = '900 44px Bahnschrift, "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Tortillería Doña Toña', 256, 50); });
    sign.position.set(STAND.x, y0 + 2.05, STAND.z - 0.99); root.add(sign);
    const maskProp = new THREE.Group(); { const km = K(); km.ball(0, 0, 0, 0.16, 0.18, 0.08, '#e8b83e', { ink: 0.008 }); for (const s of [-1, 1]) km.ball(s * 0.06, 0.02, 0.07, 0.045, 0.03, 0.01, '#c2185b', { ink: 0 }); km.ball(0, 0.13, 0.05, 0.03, 0.03, 0.03, '#f5c518', { ink: 0 }); ZHF.bake(maskProp, km); }
    maskProp.position.set(STAND.x + 0.75, y0 + 1.13, STAND.z + 0.2); maskProp.rotation.x = -1.2; maskProp.visible = false; root.add(maskProp);
    colliders.push(solid({ obox: 1, x: STAND.x, z: STAND.z - 0.45, hw: 1.45, hd: 0.72, rot: 0 }));
    const people = [];
    const tona = makeTona(); tona.id = 'tona'; tona.name = 'Doña Toña'; tona.x = TONA.x; tona.z = TONA.z; tona.y = gy(TONA.x, TONA.z); tona.yaw = tona.baseYaw = TONA.yaw; tona.story = true; root.add(tona.root); people.push(tona);
    B = { root, colliders, people, tona, maskProp, gy, scene };
    return { colliders, group: root, people, update };
  }
  // ---------------- the gym, built the first time you go down (it floats at y 300 like the other rooms)
  function buildRoom() {
    const g = new THREE.Group(); g.position.set(X0, Y0, Z0); G.w3d.scene.add(g); g.visible = false;
    const k = K(), solids = [], R0 = RING;
    k.box(0, -0.05, 0, HW * 2, 0.1, HD * 2, '#5a4636', { ink: 0 });
    for (let i = -7; i <= 7; i += 2) k.box(i, 0.005, 0, 0.04, 0.01, HD * 2, '#4a3828', { ink: 0 });
    k.box(0, 2.0, -HD, HW * 2, 4.0, 0.2, '#3a2f4a', { ink: 0.01 }).box(-HW, 2.0, 0, 0.2, 4.0, HD * 2, '#3a2f4a', { ink: 0.01 }).box(HW, 2.0, 0, 0.2, 4.0, HD * 2, '#3a2f4a', { ink: 0.01 });
    k.box(0, 0.5, -HD + 0.12, HW * 2, 1.0, 0.05, '#5a3f6a', { ink: 0 }).box(-HW + 0.12, 0.5, 0, 0.05, 1.0, HD * 2, '#5a3f6a', { ink: 0 }).box(HW - 0.12, 0.5, 0, 0.05, 1.0, HD * 2, '#5a3f6a', { ink: 0 });
    // the ring: the apron with stars, the mat, four posts with pads, three ropes a side
    const h = R0.h, cz = R0.z;
    k.box(0, MAT / 2, cz, h * 2 + 0.2, MAT, h * 2 + 0.2, '#22305a', { ink: 0.014 }).box(0, MAT + 0.02, cz, h * 2, 0.04, h * 2, '#cfe3f0', { ink: 0.006 });
    for (let i = 0; i < 10; i++) { const a = i / 10, x = -h + a * h * 2; k.ball(x, MAT * 0.5, cz + h + 0.11, 0.06, 0.06, 0.01, '#f5c518', { ink: 0 }); }
    const posts = [[-h, cz - h, '#c8322a'], [h, cz - h, '#2f6fd8'], [-h, cz + h, '#2f6fd8'], [h, cz + h, '#c8322a']];
    for (const [x, z, col] of posts) { k.cyl(x, MAT + 0.65, z, 0.07, 1.3, '#8a8f9e', { ink: 0.008 }); for (let j = 0; j < 3; j++) k.box(x, MAT + 0.35 + j * 0.35, z, 0.2, 0.2, 0.2, col, { ink: 0.006 }); }
    const ropeCol = ['#c8322a', '#fbfbf6', '#c8322a'];
    for (let j = 0; j < 3; j++) { const y = MAT + 0.35 + j * 0.35; for (let s = 0; s < 4; s++) { const a = posts[[0, 1, 3, 2][s]], b = posts[[1, 3, 2, 0][s]]; k.rod([a[0], y, a[1]], [b[0], y, b[1]], 0.025, ropeCol[j], { ink: 0.004 }); } }
    k.box(-h - 0.55, 0.15, cz + h - 0.3, 0.6, 0.3, 0.7, '#7a5a3a', { ink: 0.008 }).box(-h - 0.55, 0.35, cz + h - 0.65, 0.6, 0.2, 0.35, '#7a5a3a', { ink: 0.008 });
    solids.push({ obox: 1, x: 0, z: cz, hw: h + 0.25, hd: h + 0.25, rot: 0 });
    // the timekeeper's table and its bell
    const Bl = SPOT.bell; k.box(Bl.x, 0.4, Bl.z, 0.8, 0.05, 0.5, '#8a5f3e', { ink: 0.008 }); for (const [dx, dz] of [[-0.35, -0.2], [0.35, -0.2], [-0.35, 0.2], [0.35, 0.2]]) k.rod([Bl.x + dx, 0, Bl.z + dz], [Bl.x + dx, 0.4, Bl.z + dz], 0.02, '#6b4a2e', { ink: 0 });
    k.add(ZHF.GEO.half, '#f5c518', Bl.x, 0.43, Bl.z, 0.16, 0.12, 0.16, 0, 0, 0, { ink: 0.008 }).ball(Bl.x, 0.57, Bl.z, 0.03, 0.03, 0.03, '#8a5a12', { ink: 0 }).box(Bl.x + 0.22, 0.44, Bl.z, 0.18, 0.02, 0.03, '#6b4a2e', { ink: 0 });
    solids.push({ obox: 1, x: Bl.x, z: Bl.z, hw: 0.45, hd: 0.3, rot: 0 });
    // benches for the crowd, east and west
    for (const s of [-1, 1]) for (let r = 0; r < 2; r++) { const x = s * (5.0 + r * 1.3); k.box(x, 0.3 + r * 0.25, -1.6, 0.9, 0.08, 6.0, '#8a5f3e', { ink: 0.008 }); for (const z of [-4.2, -1.6, 1.0]) k.box(x, (0.3 + r * 0.25) / 2, z, 0.12, 0.3 + r * 0.25, 0.12, '#6b4a2e', { ink: 0 }); solids.push({ obox: 1, x, z: -1.6, hw: 0.5, hd: 3.05, rot: 0 }); }
    // a punching bag (west), a rack of weights (east, at the back), the way up (south-west stairs)
    k.rod([-6.6, 3.9, -5.6], [-6.6, 2.4, -5.6], 0.015, '#8a8f9e', { ink: 0 }).cyl(-6.6, 1.6, -5.6, 0.32, 1.6, '#c8322a', { ink: 0.012 }); solids.push({ x: -6.6, z: -5.6, r: 0.4 });
    k.box(6.6, 0.6, -5.8, 0.5, 1.2, 1.4, '#3a3444', { ink: 0.01 }); for (let i = 0; i < 3; i++) k.cyl(6.6, 0.4 + i * 0.35, -5.8, 0.18, 0.08, '#2b2235', { ink: 0, rz: Math.PI / 2 });
    solids.push({ obox: 1, x: 6.6, z: -5.8, hw: 0.35, hd: 0.8, rot: 0 });
    for (let i = 0; i < 6; i++) k.box(-6.4, 0.15 + i * 0.3, 5.4 - i * 0.35, 1.6, 0.1, 0.4, '#7a5a3a', { ink: 0.006 });
    const baked = ZHF.bake(g, k);
    // posters (original), papel picado over the ring, lamps
    const poster = (x, y, z, ry, draw) => { const p = canvasPlane(1.5, 2.0, 192, 256, draw); p.position.set(x, y, z); p.rotation.y = ry; g.add(p); };
    poster(-3.2, 2.3, -HD + 0.13, 0, c => { c.fillStyle = '#f5c518'; c.fillRect(0, 0, 192, 256); c.fillStyle = '#c2185b'; c.fillRect(8, 8, 176, 240); c.fillStyle = '#fff4dc'; c.textAlign = 'center'; c.font = '900 26px Bahnschrift, sans-serif'; c.fillText('¡LUCHA', 96, 46); c.fillText('LIBRE!', 96, 76); c.font = '800 18px Bahnschrift, sans-serif'; c.fillText('LA CAMPANA', 96, 220); c.beginPath(); c.arc(96, 140, 42, 0, TAU); c.fillStyle = '#e8b83e'; c.fill(); c.fillStyle = '#c2185b'; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(96 + s * 16, 136, 14, 9, 0, 0, TAU); c.fill(); } c.fillStyle = '#f5c518'; c.beginPath(); c.arc(96, 108, 8, 0, TAU); c.fill(); });
    poster(3.2, 2.3, -HD + 0.13, 0, c => { c.fillStyle = '#22305a'; c.fillRect(0, 0, 192, 256); c.fillStyle = '#fff4dc'; c.textAlign = 'center'; c.font = '900 24px Bahnschrift, sans-serif'; c.fillText('ARENITA', 96, 52); c.fillText('ALBA', 96, 80); c.font = '700 16px Bahnschrift, sans-serif'; c.fillText('¡Función de lucha!', 96, 130); c.fillText('Técnicos vs. Rudos', 96, 156); c.fillText('A dos de tres caídas', 96, 182); c.fillStyle = '#f5c518'; c.fillText('Para toda la familia', 96, 226); });
    const lamps = [];
    for (const [x, z] of [[-1.6, -2.6], [1.6, -2.6], [0, -0.6]]) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.45, fog: false })); s.scale.set(1.6, 1.6, 1); s.position.set(x, 3.4, z); g.add(s); lamps.push(s); }
    for (let i = 0; i < 9; i++) { const f = canvasPlane(0.32, 0.4, 64, 80, c => { c.fillStyle = ['#e2337f', '#f39a1e', '#7b4bb0', '#1fa3a0', '#f5c518', '#3fa34d'][i % 6]; c.fillRect(0, 0, 64, 70); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(32, 32, 9, 0, TAU); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(32 + s * 20, 22); c.lineTo(32 + s * 24, 32); c.lineTo(32 + s * 20, 42); c.lineTo(32 + s * 16, 32); c.closePath(); c.fill(); } }, { alpha: true, double: true }); f.position.set(-3.6 + i * 0.9, 3.55 - Math.sin(i / 8 * Math.PI) * 0.3, -1.6); g.add(f); }
    WORLD.addSolids(solids.map(s => Object.assign({}, s, { x: X0 + s.x, z: Z0 + s.z, lucha: true })));
    WORLD.addPlatforms([{ box: [X0 - HW, X0 + HW, Z0 - HD, Z0 + HD], top: Y0, lucha: true }]);
    // the people of the gym (they move in world coordinates, so they live in their own group at the scene's origin, shown
    // only while you're inside; in the ring they stand on the mat)
    const actors = new THREE.Group(); actors.visible = false; G.w3d.scene.add(actors);
    const at = (p, x, z, yaw, mat) => { p.x = X0 + x; p.z = Z0 + z; p.y = Y0 + (mat ? MAT : 0); p.yaw = p.baseYaw = yaw; actors.add(p.root); return p; };
    const campana = at(makeCampana(), SPOT.coach.x, SPOT.coach.z, 0.3);
    const bolillo = at(makeBolillo(), 1.2, -1.6, -HALF, true); bolillo.root.visible = false;
    const mudo = at(makeMudo(), 1.4, -2.4, -HALF, true); mudo.root.visible = false;
    const ref = at(makeRef(), 0, -3.4, 0, true); ref.root.visible = false;
    const dummy = new THREE.Group(); { const kd = K(); kd.cyl(0, 0.55, 0, 0.26, 1.1, '#c9a46a', { ink: 0.012 }).ball(0, 1.28, 0, 0.2, 0.2, 0.2, '#c9a46a', { ink: 0.01 }).rod([0, 1.15, 0], [0, 1.15, 0.001], 0.001, '#c9a46a', { ink: 0 }); for (const s of [-1, 1]) { kd.ball(s * 0.07, 1.32, 0.17, 0.025, 0.025, 0.01, '#2b2235', { ink: 0 }); kd.rod([s * 0.24, 0.85, 0], [s * 0.42, 0.55, 0.05], 0.06, '#c9a46a'); } kd.box(0, 1.18, 0.18, 0.1, 0.012, 0.01, '#2b2235', { ink: 0 }); for (let i = 0; i < 4; i++) kd.box(0, 0.25 + i * 0.25, 0.262, 0.4, 0.015, 0.005, '#a8844a', { ink: 0 }); ZHF.bake(dummy, kd); }
    dummy.position.set(-1.0, MAT, -1.6); dummy.visible = false; g.add(dummy);
    const crowd = []; const CC = [['#c98e62', '#e2337f'], ['#e6b48c', '#2f7fd8'], ['#a8714a', '#f39a1e'], ['#f0c7a0', '#3fa34d'], ['#b9825a', '#7b4bb0'], ['#e6b48c', '#c8322a'], ['#c98e62', '#1fa3a0'], ['#8a5a3c', '#f5c518'], ['#f0c7a0', '#e2337f'], ['#a8714a', '#2f6fd8']];
    CC.forEach(([skin, shirt], i) => { const s = i % 2 ? 1 : -1, r = (i >> 1) % 2, z = -3.8 + Math.floor(i / 4) * 2.2 + (r ? 0.5 : 0), kid = i % 3 === 2; const p = person({ kid, skin, hair: '#2b2235', shirt, pants: '#3a3a5a', shoes: '#2b2235' }, { sit: true, seatY: 0.34 + r * 0.25 }); at(p, s * (5.0 + r * 1.3), z, s < 0 ? HALF : -HALF); p.root.visible = false; crowd.push(p); });
    const puppet = (() => { try { if (typeof ACTORS !== 'undefined' && ACTORS.mimo) { const m = ACTORS.mimo(); m.root.visible = false; actors.add(m.root); return m; } } catch (e) { /* */ } return null; })();
    R = { g, actors, baked, lamps, campana, bolillo, mudo, ref, dummy, crowd, puppet, pup: { x: 0, z: 0, y: 0, ry: 0, tilt: 0, hop: 0 } };
    return R;
  }
  const HALF = Math.PI / 2;
  let GLOW = null;
  function glowTex() { if (GLOW) return GLOW; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d'), gr = c.createRadialGradient(32, 32, 1, 32, 32, 31); gr.addColorStop(0, 'rgba(255,248,220,1)'); gr.addColorStop(0.35, 'rgba(255,214,140,0.7)'); gr.addColorStop(1, 'rgba(255,170,80,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); GLOW = new THREE.CanvasTexture(cv); return GLOW; }

  // ================================================================ Mimo's mini mask (the show's gift): a golden hood, magenta trim, a bell
  let MASK = null;
  function miniMask() {
    if (MASK || !G || !G.cast || !G.cast.mimo || !G.cast.mimo.body) return MASK;
    const g = new THREE.Group(); g.position.set(0, 0.36, 0.0);
    const k = K(); k.add(ZHF.GEO.half, '#e8b83e', 0, 0, 0, 0.33, 0.27, 0.33, 0, 0, 0, { ink: 0.008 });
    k.add(ZHF.GEO.tor, '#c2185b', 0, 0.0, 0, 0.33, 0.33, 0.25, Math.PI / 2, 0, 0, { ink: 0 });
    for (let i = -1; i <= 1; i++) k.cone(i * 0.08, 0.2 + (i ? 0 : 0.04), 0.22, 0.03, 0.1, '#c2185b', { rx: -0.5, ink: 0 });
    k.ball(0, 0.22, 0.26, 0.045, 0.045, 0.04, '#f5c518', { ink: 0.005 }).ball(0, 0.18, 0.29, 0.014, 0.014, 0.014, '#8a5a12', { ink: 0 });
    ZHF.bake(g, k); g.visible = false; G.cast.mimo.body.add(g); MASK = g; return g;
  }
  const hatOn = () => !!(G && G.state && G.state.lang === 'es' && G.state.lu && G.state.lu.mask && !G.state.lu.maskOff);

  // ================================================================ every frame (outdoors: the stand and Doña Toña)
  let waveT = 3;
  function update(dt, t, you) {
    if (!B) return;
    const show = on() && !(G.indoors && G.indoors()), Y = G.sim.you;
    B.root.visible = show && Math.hypot(Y.x - STAND.x, Y.z - STAND.z) < 140;
    for (const c of B.colliders) { c.x = c.x0 + (show ? 0 : 1e5); c.z = c.z0; }
    const T = B.tona; T.hidden = !show;
    if (G.cast) { const m = miniMask(); if (m) m.visible = hatOn(); }
    if (!show) return;
    const scene = typeof STORY !== 'undefined' && STORY.busy;
    if (!scene && (waveT -= dt) <= 0) { waveT = 3.5 + Math.random() * 4; T.pose = Math.random() < 0.5 ? 'drum' : 'idle'; T.poseT = 1.6; }    // (patting tortillas)
    if (T.poseT > 0 && (T.poseT -= dt) <= 0) T.pose = 'idle';
    ZHF.animate(T, dt, t, you);
  }

  // ================================================================ the song: «¡Campanazo!», La Campana's entrance
  // Arena funk in half time (92 bpm) in E Phrygian dominant (E F G# A B C D: the "Spanish" scale): a church bell tolls in
  // every phrase, a fat synth bass riff on E–F, claps and a big snare on three, a muted trumpet on the hook, then an organ
  // vamp with "oh!" shouts and the crowd's three-clap chant (cam-pa-na), toms into each half.
  (function addSong() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const Kt = Sound.kit;
    const HOOK = Kt.mel('E4/2 F4/2 G#4/4 A4/2 G#4/2 F4/4 | E4/4 r/4 B4/4 C5/4 | B4/2 A4/2 G#4/4 F4/2 G#4/2 A4/4 | B4/12 r/4 | E5/2 D5/2 C5/4 B4/2 C5/2 B4/4 | A4/4 G#4/4 F4/4 E4/4 | F4/2 G#4/2 A4/2 B4/2 C5/2 B4/2 A4/2 G#4/2 | E4/16');
    const BASS = [[0, 40, 3, 1], [3, 40, 1, 0.5], [4, 41, 2, 0.8], [6, 40, 2, 0.7], [8, 44, 2, 0.9], [10, 45, 2, 0.8], [12, 44, 1, 0.6], [13, 41, 1, 0.6], [14, 40, 2, 0.85]];
    const ORG = [[52, 56, 59], [53, 57, 60]];
    Sound.addSong('lu_campana', { bpm: 92, len: 256, swing: 0.1, vol: 0.33, verb: 0.16, echo: 0.1, echoSteps: 3, play(i, t, s16) {
      const bar = i >> 4, st = i & 15, B2 = bar >= 8, br = bar & 7;
      if (st === 0 && br % 4 === 0) Kt.bell(52, t, 0.9);
      if (st === 0 || st === 6 || st === 10 || (B2 && st === 13)) Kt.kick(t, st ? 0.75 : 1);
      if (st === 8) { Kt.snare(t, 0.9); Kt.claps(t, 0.7); }
      if (st === 4 || st === 12) Kt.rim(t, 0.4);
      Kt.hat(t, st % 4 === 2 ? 0.5 : 0.25, st === 15);
      for (const [at, m, len, v] of BASS) if (st === at) Kt.synbass(m + (br === 3 || br === 7 ? 1 : 0), t, len * s16 * 0.9, v);
      if (!B2) { const n = HOOK[i & 127]; if (n) Kt.lead(n[0], t, n[1] * s16 * 0.95, 'mute', 0.95); }
      else {
        if (st === 2 || st === 6 || st === 10 || st === 14) for (const m of ORG[(br >> 1) & 1]) Kt.organ(m, t, s16 * 1.4, 0.9);
        const n = HOOK[i & 127]; if (n && br >= 4) Kt.lead(n[0] + 12, t, n[1] * s16 * 0.8, 'saw', 0.6);
        if (br < 4 && (st === 0 || st === 2 || st === 4)) Kt.hclap(t, 0.9);
        if (br === 0 && st === 0) Kt.vox(57, t, 0.4, 0.7, 'o', 'a');
      }
      if (br === 7 && st >= 12) Kt.tom(t, [220, 180, 150, 120][st - 12], 0.8);
      if (i % 128 === 0) Kt.crash(t, 0.7);
    } });
  })();

  // ================================================================ helpers for scenes
  const wait = s => (typeof STORY !== 'undefined' && STORY.wait ? STORY.wait(s) : new Promise(r => setTimeout(r, s * 1000)));
  const fadeTo = (to, ms) => { if (!MUI.fast) return UI.fade(to, ms); const el = document.getElementById('fade'); if (el) { el.style.transition = 'none'; el.style.opacity = to; } return Promise.resolve(); };
  const lock = v => { if (G) G.sim.lock = v ? 1 : 0; };
  const snd = k => { try { Sound.play(k); } catch (e) { /* */ } };
  const sparkle = (x, y, z, n = 12, cols = ['#ffd23f', '#f5c518', '#ff6b9a']) => { try { G.w3d.fx.sparkle(x, y, z, n, cols); } catch (e) { /* */ } };
  const coins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; snd('chest'); UI.toast(`${why}: +${n} coins`); };
  const think = (t, s) => STORY.think(sub(t), s), you = t => STORY.you(sub(t));
  const later = () => think('«¡Luego seguimos!» (We’ll carry on later!)', 3);
  const lineArr = k => { const L = lineOf(k); return [L.es, L.en]; };
  const icon = (key, s = 104) => el => { const cv = ICONS.canvas(key, s * 2); cv.style.width = cv.style.height = s + 'px'; el.appendChild(cv); };
  async function speak(p, key, name) {
    if (!p) return; const L = typeof key === 'string' ? lineOf(key) : { es: sub(key[0]), en: sub(key[1]) };
    const pr = { id: p.id || 'lu', name: name || p.name || '', x: p.x, y: p.y, z: p.z, top: (p.top || 2.0) * (p.root && p.root.scale ? p.root.scale.y : 1), lines: { es: L.es, en: L.en } };
    p.talking = true; try { await STORY.sayInline(pr, true); } finally { p.talking = false; }
  }
  const who = k => ({ tona: [B.tona, 'Doña Toña'], camp: [R && R.campana, 'La Campana'], bol: [R && R.bolillo, 'El Bolillo'], ref: [R && R.ref, 'El réferi'], mudo: [R && R.mudo, 'El Mudo'] }[k]);
  const say = (k, key) => { const [p, n] = who(k); return speak(p, key, n); };
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo; Y.x = x; Y.z = z; Y.yaw = yaw; Y.vx = Y.vz = Y.vy = 0; Y.onGround = true;
    M.x = x + Math.cos(yaw) * 0.95; M.z = z - Math.sin(yaw) * 0.95; M.station = null; M.look = null; M.hop = null; M.wander = null;
    [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3); G.sim.snap();
  }
  async function scene(fn) {
    lock(true);
    try { await fn(); } catch (e) { console.error('[lucha] scene', e); }
    finally { G.cam.override = null; lock(false); if (G.sim.mimo) G.sim.mimo.look = null; if (!FIGHT.on) G.fx.hush = 0; if (G.save) G.save(); }
  }
  const shot = (p, l) => { G.cam.override = { pos: V3(p[0], p[1], p[2]), look: V3(l[0], l[1], l[2]) }; };
  const shotStand = () => { const y = B.gy(STAND.x, STAND.z); shot([STAND.x + 2.2, y + 2.2, STAND.z + 4.4], [STAND.x, y + 1.2, STAND.z - 0.3]); };
  const rshot = (p, l) => shot([X0 + p[0], Y0 + p[1], Z0 + p[2]], [X0 + l[0], Y0 + l[1], Z0 + l[2]]);
  const ringShot = () => rshot([2.6, 3.0, 6.0], [0, 1.2, -1.8]);
  const coachShot = () => { const c = R.campana; shot([c.x + 1.6, Y0 + 2.0, c.z + 3.6], [c.x, Y0 + 1.1, c.z]); };

  // ================================================================ the gym as a room (main.js ROOMS)
  let inside = false, rbusy = false;
  const FIGHT = { on: false, crowd: 0 };
  const OUT = () => ({ x: DOOR_IN.x - 0.5, z: DOOR_IN.z + 0.9, yaw: -HALF });
  async function enter(o = {}) {
    if (!G || inside || rbusy || !on()) return;
    rbusy = true;
    try {
      snd('wood'); await fadeTo(1, 400);
      if (!R) buildRoom();
      inside = true; R.g.visible = true; R.actors.visible = true; G.w3d.setInterior({ fog: '#1a1428', near: 24, far: 70 });
      const sp = SPOT.spawn; teleport(X0 + sp.x, Z0 + sp.z, Math.PI); G.cam.snap(Math.PI, 0.5, 10);
      await fadeTo(0, 400);
    } catch (e) { console.error('[lucha] enter', e); }
    rbusy = false;
    const st = S(); if (!st.visited) { st.visited = true; UI.chapter('La Arenita', 'the secret gym under the tortillería'); }
    if (G.save) G.save();
    if (o.quiet) return;
    if (!st.welcomed) await welcome();
  }
  async function leave() {
    if (!G || !inside || rbusy) return;
    rbusy = true;
    try {
      snd('wood'); await fadeTo(1, 380);
      inside = false; if (R) { R.g.visible = false; R.actors.visible = false; } G.w3d.setInterior(null); puppetOff();
      const o = OUT(); [o.x, o.z] = WORLD.pushOut(o.x, o.z, 0.45); teleport(o.x, o.z, o.yaw); G.cam.snap(o.yaw + Math.PI - 0.9, 0.34, 8.5);
      await fadeTo(0, 380);
    } catch (e) { console.error('[lucha] leave', e); }
    rbusy = false; if (G.save) G.save();
  }
  function keepIn() {
    const lim = (v, c, h) => Math.max(c - h, Math.min(c + h, v)), M = G.sim.mimo, Y = G.sim.you;
    if (!M.hidden && (Math.abs(M.x - X0) > HW - 0.3 || Math.abs(M.z - Z0) > HD - 0.3 || M.y < Y0 - 1)) { M.hop = null; M.wander = null; M.x = lim(M.x, X0, HW - 0.7); M.z = lim(M.z, Z0, HD - 0.7); M.y = M.ry = Y0; }
    if (M.wander && (Math.abs(M.wander.x - X0) > HW - 0.7 || Math.abs(M.wander.z - Z0) > HD - 0.7)) { M.wander.x = lim(M.wander.x, X0, HW - 0.8); M.wander.z = lim(M.wander.z, Z0, HD - 0.8); }
    if (Y.y < Y0 - 2 || Math.abs(Y.x - X0) > HW + 0.5 || Math.abs(Y.z - Z0) > HD + 0.5) { const sp = SPOT.spawn; teleport(X0 + sp.x, Z0 + sp.z, Math.PI); }
  }
  function roomUpdate(dt, t) {
    if (!inside || !R) return;
    keepIn();
    for (const p of [R.campana, R.bolillo, R.mudo, R.ref].concat(R.crowd)) if (p.root.visible) { if (!p.root.rotation._yxz) { p.root.rotation.order = 'YXZ'; p.root.rotation._yxz = 1; } ZHF.animate(p, dt, t, null); p.root.rotation.x = p.tilt || 0; }
    for (const p of R.crowd) if (p.root.visible) { p.pose = FIGHT.crowd > 0.5 ? 'cheer' : FIGHT.crowd < 0 ? 'sulk' : 'idle'; }
    if (R.puppet && R.puppet.root.visible) { const q = R.pup; R.puppet.root.position.set(q.x, q.y + (q.hop || 0), q.z); R.puppet.root.rotation.set(q.tilt || 0, q.baseYaw || 0, 0, 'YXZ'); }
    R.lamps.forEach((s, i) => { s.material.opacity = 0.4 + 0.08 * Math.sin(t * 4.3 + i * 2); });
    if (G.sim.lock && !STORY.busy && !MUI.isOpen && !MUI.hud.open_ && !rbusy) { G.sim.lock = 0; G.cam.override = null; }
  }
  // ---------------- choreography (room coordinates; actors on the mat). An actor: a rig, or R.pup for Mimo's stand-in
  const onMat = (x, z) => Math.abs(x - RING.x) < RING.h && Math.abs(z - RING.z) < RING.h;
  function put(p, x, z, yaw) { p.x = X0 + x; p.z = Z0 + z; p.y = Y0 + (onMat(x, z) ? MAT : 0); if (yaw !== undefined) p.yaw = p.baseYaw = yaw; p.hop = 0; p.tilt = 0; }
  async function walk(p, x, z, dur = 0.6, hop = 0.1) { const x0 = p.x, z0 = p.z, X = X0 + x, Z = Z0 + z, n = Math.max(2, Math.round(dur / 0.04)); p.baseYaw = p.yaw = Math.atan2(X - x0, Z - z0); for (let i = 1; i <= n; i++) { const u = i / n; p.x = lerp(x0, X, u); p.z = lerp(z0, Z, u); p.hop = Math.abs(Math.sin(u * Math.PI * 3)) * hop; await wait(0.04); } p.hop = 0; p.y = Y0 + (onMat(x, z) ? MAT : 0); }
  async function arc(p, x, z, h = 1.3, dur = 0.7, endY) { const x0 = p.x, z0 = p.z, y0 = p.y + (p.hop || 0), X = X0 + x, Z = Z0 + z, Ye = endY !== undefined ? Y0 + endY : Y0 + (onMat(x, z) ? MAT : 0), n = Math.max(3, Math.round(dur / 0.04)); p.baseYaw = p.yaw = Math.atan2(X - x0, Z - z0) || p.yaw; p.y = 0; for (let i = 1; i <= n; i++) { const u = i / n; p.x = lerp(x0, X, u); p.z = lerp(z0, Z, u); p.hop = lerp(y0, Ye, u) + Math.sin(u * Math.PI) * h; await wait(0.04); } p.y = Ye; p.hop = 0; }
  async function topple(p, back = true) { for (let i = 1; i <= 8; i++) { p.tilt = (back ? -1 : 1) * HALF * 0.95 * (i / 8); await wait(0.03); } snd('hit'); try { G.w3d.fx.puff(p.x, p.y + 0.1, p.z, 6, 0.18); } catch (e) { /* */ } }
  async function getUp(p) { for (let i = 7; i >= 0; i--) { p.tilt = (p.tilt < 0 ? -1 : 1) * HALF * 0.95 * (i / 8); await wait(0.04); } p.tilt = 0; }
  const ringBell = (n = 1) => { for (let i = 0; i < n; i++) setTimeout(() => snd('bigbell'), i * 380); };
  function puppetOn(x, z, yaw = Math.PI) {
    if (!R || !R.puppet) return; R.puppet.root.visible = true; put(R.pup, x, z, yaw);
    try { G.cast.mimo.root.visible = false; G.cast.mimoShadow.visible = false; } catch (e) { /* */ }
  }
  function puppetOff() { if (R && R.puppet) R.puppet.root.visible = false; try { G.cast.mimo.root.visible = true; G.cast.mimoShadow.visible = true; } catch (e) { /* */ } }

  // ================================================================ chapter 1: la tortillería (outdoors, at the stand)
  const QTY = ['medio kilo', 'un kilo', 'kilo', 'un cuarto', 'cuarto', 'una docena', 'docena', 'dos kilos'];
  function orderCheck(t) {
    const qty = MUI.has(t, QTY) || /\b\d+\b/.test(t), polite = MUI.has(t, ['me da', 'deme', 'me puede dar', 'me pone', 'quisiera', 'por favor', 'me regala']);
    if (!MUI.has(t, ['tortilla', 'tortillas']) && !qty) return { ok: false, why: 'Say how much: «Me da medio kilo de tortillas, por favor.»' };
    if (!qty) return { ok: false, why: 'How much? «medio kilo», «un kilo», «un cuarto»…' };
    return { ok: true, minor: !polite, note: polite ? '' : 'politer: «Me da…, por favor»' };
  }
  async function meet() {
    const st = S();
    await scene(async () => { teleport(SHOP.x, SHOP.z, Math.PI); shotStand(); B.tona.pose = 'drum'; await say('tona', 't.hi'); B.tona.pose = 'idle'; await say('tona', 't.name'); });
    st.met = true;
    if (!CH[0].gate(flags())) { think('Doña Toña: «¡Vuelva pronto!» (Come back soon!)', 3); return; }
    const r = await MUI.lesson({ title: 'La tortillería', sub: 'buying tortillas, politely', face: 'luTona', name: 'Doña Toña', intro: ['¡Pásele, pásele! ¿Qué le doy?', 'Come on in! What can I get you?'], items: ['ph.lu.meda', 'ph.lu.cuanto', 'ph.lu.vayabien'].map(item), recall: false });
    if (r.quit) return later();
    const steps = [
      { kind: 'Order · half a kilo, politely', say: ['¡Buenas! ¿Qué le doy?', 'Hello! What can I get you?'], art: icon('luTortilla'), model: 'Me da medio kilo de tortillas, por favor.', modelEn: 'Half a kilo of tortillas, please.', check: orderCheck },
      { kind: 'Ask how much', say: lineArr('t.weigh'), art: icon('luTortilla'), model: '¿Cuánto es?', modelEn: 'How much is it?', check: t => ({ ok: MUI.has(t, ['cuanto es', 'cuanto le debo', 'cuanto cuesta', 'cuanto cuestan', 'cuanto seria']) }) },
      { kind: 'Pay her', say: lineArr('t.price'), model: 'Aquí tiene: quince pesos.', modelEn: 'Here you go: fifteen pesos.', check: t => MUI.has(t, ['quince', '15']) ? { ok: true, minor: !MUI.has(t, ['aqui tiene', 'aqui esta', 'tenga']), note: MUI.has(t, ['aqui tiene', 'aqui esta', 'tenga']) ? '' : 'handing money over: «Aquí tiene»' } : { ok: false, why: 'She said «quince» (15): «Aquí tiene: quince pesos.»' } },
      { kind: 'Her knuckles are bandaged… ask, politely', say: ['¿Algo más?', 'Anything else?'], model: '¿Qué le pasó en las manos?', modelEn: 'What happened to your hands?', check: t => MUI.has(t, ['que le paso', 'que te paso', 'que paso']) && MUI.has(t, ['manos', 'mano']) ? { ok: true, minor: MUI.has(t, 'que te paso'), note: MUI.has(t, 'que te paso') ? 'to a shopkeeper, «le» (usted) is politer' : '' } : { ok: false, why: '«¿Qué le pasó…?» (what happened to you?) + «en las manos»' } },
      { kind: 'Say goodbye, politely', say: lineArr('t.hands'), model: '¡Gracias! ¡Que le vaya bien!', modelEn: 'Thanks! Have a good day!', check: t => MUI.has(t, ['que le vaya bien', 'que te vaya bien', 'que le vaya muy bien']) ? { ok: true, minor: MUI.has(t, 'que te vaya bien'), note: MUI.has(t, 'que te vaya bien') ? 'to her: «¡Que le vaya bien!»' : '' } : { ok: false, why: '«¡Que le vaya bien!»: may it go well for you' } },
    ];
    const r2 = await MUI.steps(steps, { title: 'La tortillería', sub: 'Doña Toña’s stand', face: 'luTona', name: 'Doña Toña' });
    if (r2.quit) return later();
    await scene(async () => {
      shotStand(); const M = G.sim.mimo; M.look = { x: STAND.x + 0.75, z: STAND.z + 0.4 }; G.sim.mimoSay('!', 1.2); snd('chirp');
      await wait(0.6); B.maskProp.visible = true; const P = B.maskProp.position; sparkle(P.x, P.y + 0.2, P.z, 14);
      await say('tona', 't.drawer'); await say('tona', 't.ay'); await say('tona', 't.ok');
    });
    const r3 = await MUI.steps([{ kind: 'Keep her secret', say: lineArr('t.ok'), art: icon('luCampana'), model: 'Sí. Es un secreto.', modelEn: 'Yes. It’s a secret.', check: t => ({ ok: MUI.has(t, ['secreto', 'te lo guardo', 'se lo guardo', 'no le digo a nadie', 'no digo nada', 'lo prometo', 'prometo', 'si']) }) }], { title: 'La tortillería', sub: '…a secret', face: 'luTona', name: 'Doña Toña' });
    if (r3.quit) return later();
    await scene(async () => { shotStand(); await say('tona', 't.campana'); await say('tona', 't.bell'); snd('bigbell'); await say('tona', 't.door'); B.maskProp.visible = false; });
    st.ch[1] = true; st.g1 = r2.grades.concat(r3.grades);
    teachAll(['ph.lu.meda', 'ph.lu.cuanto', 'ph.lu.vayabien', 'ph.lu.secreto']);
    coins(5, 'Doña Toña gives your coins back: «¡Entre amigos no se cobra!»');
    think('The side door of the stand, the one with the little bell painted on it…', 4);
  }
  async function welcome() {
    const st = S(); st.welcomed = true;
    await scene(async () => { put(R.campana, SPOT.coach.x, SPOT.coach.z, 0.3); coachShot(); R.campana.pose = 'cheer'; await say('camp', 'c.welcome'); R.campana.pose = 'idle'; await say('camp', 'c.dust'); });
  }

  // ================================================================ chapter 2: the words of lucha libre
  const QUIZ = [
    { say: ['¿Qué es esto? ¡Mi orgullo!', 'What’s this? My pride!'], art: 'luCampana', model: 'La máscara.', keys: ['mascara'], kind: 'She taps her own mask' },
    { say: ['El Bolillo hace trampa cuando el réferi no ve. Es un…', 'El Bolillo cheats when the réferi isn’t looking. He’s a…'], art: 'luBolillo', model: 'Un rudo.', keys: ['rudo'], kind: 'Técnico or rudo?' },
    { say: ['Y yo peleo limpio y vuelo. Soy una…', 'And I fight fair and fly. I’m a…'], art: 'luCampana', model: 'Una técnica.', keys: ['tecnica', 'tecnico'], kind: 'Técnico or rudo?', minorIf: 'tecnico', note: 'she’s a woman: «la técnica»' },
    { say: ['¿Quién cuenta hasta tres?', 'Who counts to three?'], art: 'luBell', model: 'El réferi.', keys: ['referi', 'referee', 'arbitro'], kind: 'In the ring' },
    { say: ['Subo hasta arriba, a la cuerda de arriba. Es la…', 'I climb all the way up, to the top rope. It’s the…'], art: 'luDive', model: 'La tercera cuerda.', keys: ['tercera cuerda', 'tercera'], kind: 'In the ring' },
    { say: ['Le tuerzo el brazo y no lo suelto. Es una…', 'I twist his arm and don’t let go. It’s a…'], art: 'luCampana', model: 'Una llave.', keys: ['llave'], kind: 'The moves' },
    { say: ['Salto entre las cuerdas, ¡hacia afuera del ring! Es un…', 'I dive between the ropes, out of the ring! It’s a…'], art: 'luDive', model: 'Un tope.', keys: ['tope'], kind: 'The moves' },
    { say: ['Vuelo y caigo plana encima de él. Es una…', 'I fly and land flat on top of him. It’s a…'], art: 'luDive', model: 'Una plancha.', keys: ['plancha'], kind: 'The moves' },
    { say: ['¡Sus hombros están en la lona! ¡Cuenta con el réferi!', 'His shoulders are on the mat! Count with the réferi!'], art: 'luBell', model: '¡Uno, dos, tres!', keys: ['uno dos tres'], kind: 'The count' },
  ];
  async function chapter2() {
    const st = S();
    await scene(async () => { coachShot(); await say('camp', 'c.l2'); });
    if (!st.l2) {
      const r = await MUI.lesson({ title: 'Lucha libre', sub: 'the words of the ring', face: 'luCampana', name: 'La Campana', intro: ['¡Repite conmigo!', 'Repeat after me!'],
        items: ['ph.lu.tecnico', 'ph.lu.rudo', 'ph.lu.mascara', 'ph.lu.llave', 'ph.lu.tope', 'ph.lu.plancha', 'ph.lu.cuerda', 'ph.lu.referi', 'ph.lu.cuenta'].map(item), recall: false });
      if (r.quit) return later();
      st.l2 = true;
    }
    await scene(async () => { coachShot(); await say('camp', 'c.respect'); });
    const r2 = await MUI.steps(QUIZ.map((q, i) => ({ kind: `${q.kind} · ${i + 1} of ${QUIZ.length}`, say: q.say, art: icon(q.art), model: q.model, placeholder: 'en español…',
      check: t => MUI.has(t, q.keys) ? { ok: true, minor: !!(q.minorIf && MUI.has(t, q.minorIf) && !MUI.has(t, 'tecnica')), note: q.minorIf && MUI.has(t, q.minorIf) && !MUI.has(t, 'tecnica') ? q.note : '' } : { ok: false } })), { title: 'Lucha libre', sub: 'what is it called?', face: 'luCampana', name: 'La Campana' });
    if (r2.quit) return later();
    st.ch[2] = true; st.g2 = r2.grades;
    teachAll(['ph.lu.tecnico', 'ph.lu.rudo', 'ph.lu.mascara', 'ph.lu.llave', 'ph.lu.tope', 'ph.lu.plancha', 'ph.lu.cuerda', 'ph.lu.referi', 'ph.lu.cuenta']);
    await scene(async () => { coachShot(); R.campana.pose = 'cheer'; await speak(R.campana, ['¡Eso! Ya hablas como luchador… o luchadora. ¡Como tú quieras!', 'That’s it! You talk like a luchador… or a luchadora. Whichever you like!'], 'La Campana'); R.campana.pose = 'idle'; });
    coins(6, 'La Campana’s training fee, paid back');
  }

  // ================================================================ chapter 3: ¡Damas y caballeros! (narrate it now, then the replay in the past)
  const C3 = () => R.campana, B3 = () => R.bolillo;
  const BEATS = [
    { act: async () => { await walk(C3(), 2.2, -3.8, 0.5); await arc(C3(), 2.55, -4.15, 0.3, 0.35, MAT + 1.05); }, title: 'La Campana climbs the corner', pres: ['¡Sube a la tercera cuerda!', 'subio', 'sube'], pret: ['¡Subió a la tercera cuerda!', 'subio', 'sube'] },
    { act: async () => { await arc(C3(), 2.0, -3.4, 1.0, 0.45, MAT + 0.5); }, title: 'She springs off the rope', pres: ['¡Salta!', 'salto', 'salta'], pret: ['¡Saltó!', 'salto', 'salta'] },
    { act: async () => { await arc(C3(), 1.25, -1.9, 1.3, 0.6); }, title: 'She flies at El Bolillo', pres: ['¡Vuela!', 'volo', 'vuela'], pret: ['¡Voló!', 'volo', 'vuela'] },
    { act: async () => { await topple(B3()); }, title: 'El Bolillo hits the mat', pres: ['¡El Bolillo cae!', 'cayo', 'cae'], pret: ['¡El Bolillo cayó!', 'cayo', 'cae'] },
    { act: async () => { const r = R.ref; r.pose = 'drum'; for (let i = 0; i < 3; i++) { snd('hit'); await wait(0.45); } r.pose = 'idle'; C3().pose = 'cheer'; }, title: 'The réferi counts… and she wins', pres: ['¡La Campana gana!', 'gano', 'gana'], pret: ['¡Ganó La Campana!', 'gano', 'gana'] },
  ];
  // now: the present form, not the past one; the replay: the past form, not the present one
  const nowCheck = (b, past) => t => { const [model, pastW, presW] = past ? b.pret : b.pres, n = ' ' + MUI.N(t) + ' ', hasW = w => n.includes(' ' + w + ' ');
    if (past) return hasW(pastW) ? { ok: true } : hasW(presW) ? { ok: false, why: `The replay is what already happened: ${presW} → <b>${pastW}</b>` } : { ok: false };
    return hasW(presW) ? { ok: true } : hasW(pastW) ? { ok: false, why: `It’s happening right now! ${pastW} → <b>${presW}</b>` } : { ok: false }; };
  function setupMatch() { R.bolillo.root.visible = true; R.ref.root.visible = true; put(R.campana, -1.2, -1.6, HALF); put(R.bolillo, 1.25, -1.9, -HALF); put(R.ref, 0, -3.6, 0); R.campana.pose = R.bolillo.pose = R.ref.pose = 'idle'; }
  function endMatch() { R.bolillo.root.visible = false; R.ref.root.visible = false; put(R.campana, SPOT.coach.x, SPOT.coach.z, 0.3); R.campana.pose = 'idle'; }
  async function chapter3() {
    const st = S(); let quit = false;
    try {
      setupMatch();
      await scene(async () => { ringShot(); await say('camp', 'c.l3'); await say('camp', 'c.bolillo'); R.bolillo.pose = 'cheer'; await say('bol', 'b.hi'); R.bolillo.pose = 'idle'; });
      lock(true); ringShot(); MUI.hud.open('¡Damas y caballeros! · you’re the announcer');
      const grades = [];
      const g0 = await MUI.hud.call({ icon: 'luBell', title: 'Open the show!', sub: 'Every announcer starts the same way.', model: '¡Damas y caballeros!', modelEn: 'Ladies and gentlemen!', keys: ['damas y caballeros'] });
      if (g0 === 'quit') { quit = true; return; } grades.push(g0); ringBell(1);
      for (let i = 0; i < BEATS.length; i++) {
        const b = BEATS[i]; MUI.hud.cue({ icon: 'luCampana', title: 'Watch…', sub: b.title, bar: i / BEATS.length }); MUI.hud.fb('');
        await b.act();
        const g = await MUI.hud.call({ icon: 'luCampana', title: 'Narrate it, as it happens!', sub: `${b.title} (now: the present)`, bar: (i + 1) / BEATS.length, model: b.pres[0], check: nowCheck(b, false) });
        if (g === 'quit') { quit = true; return; } grades.push(g);
      }
      MUI.hud.close();
      await scene(async () => { R.campana.pose = 'idle'; await getUp(R.bolillo); setupMatch(); ringShot(); await say('camp', 'c.replay'); });
      lock(true); ringShot(); MUI.hud.open('La repetición · the replay, in the past');
      for (let i = 0; i < BEATS.length; i++) {
        const b = BEATS[i]; MUI.hud.cue({ icon: 'luCampana', title: 'The replay…', sub: b.title, bar: i / BEATS.length }); MUI.hud.fb('');
        await b.act();
        const g = await MUI.hud.call({ icon: 'luCampana', title: 'What happened? (the past)', sub: b.title, bar: (i + 1) / BEATS.length, model: b.pret[0], check: nowCheck(b, true) });
        if (g === 'quit') { quit = true; return; } grades.push(g);
      }
      MUI.hud.close();
      await scene(async () => { ringShot(); R.campana.pose = 'idle'; await say('bol', 'b.lost'); await getUp(R.bolillo); });
      st.ch[3] = true; st.g3 = grades;
      teachAll(['ph.lu.damas', 'ph.lu.volo', 'ph.lu.cayo']);
      coins(8, 'El Bolillo pays his bet');
    } finally { MUI.hud.close(); endMatch(); lock(false); G.cam.override = null; if (quit) later(); }
  }

  // ================================================================ chapter 4: training Mimo (tú orders, the pronoun stuck on the end)
  const P4 = () => R.pup;
  const dummyAt = (x, z, tilt = 0) => { R.dummy.visible = true; R.dummy.position.set(x, onMat(x, z) ? MAT : 0, z); R.dummy.rotation.set(tilt, -HALF, 0, 'YXZ'); };
  async function dummyFall() { for (let i = 1; i <= 8; i++) { R.dummy.rotation.x = -HALF * 0.9 * i / 8; await wait(0.03); } snd('hit'); try { G.w3d.fx.puff(X0 + R.dummy.position.x, Y0 + R.dummy.position.y + 0.2, Z0 + R.dummy.position.z, 6, 0.18); } catch (e) { /* */ } }
  const ORD = [
    { k: 'grab', model: '¡Agárralo!', en: 'Grab him!', title: 'Grab the dummy!', keys: ['agarralo', 'agarrala', 'agarralos'], soft: ['agarra'], note: 'agarra + lo → «¡Agárralo!»',
      act: async () => { const p = P4(); await walk(p, 0.35, -1.55, 0.5, 0.12); for (let i = 0; i < 4; i++) { R.dummy.rotation.z = (i % 2 ? 1 : -1) * 0.12; await wait(0.08); } R.dummy.rotation.z = 0; snd('pip'); } },
    { k: 'bounce', model: '¡Rebota en las cuerdas!', en: 'Bounce off the ropes!', title: 'Run at the ropes and come back faster!', keys: ['rebota', 'rebotate'], soft: [],
      act: async () => { const p = P4(); await walk(p, 2.45, -0.4, 0.45, 0.1); snd('wood'); await walk(p, -1.0, -0.8, 0.3, 0.05); } },
    { k: 'climb', model: '¡Súbete a las cuerdas!', en: 'Climb up on the ropes!', title: 'Climb the corner!', keys: ['subete', 'trepate'], soft: ['sube', 'trepa'], note: 'subir + te → «¡Súbete!» (get yourself up)',
      act: async () => { const p = P4(); await walk(p, -2.3, -3.85, 0.5, 0.1); await arc(p, -2.6, -4.15, 0.3, 0.35, MAT + 1.05); } },
    { k: 'dive', model: '¡Lánzate!', en: 'Dive!', title: 'Fly onto the dummy!', keys: ['lanzate', 'avientate', 'tirate'], soft: ['lanza', 'avienta', 'tira'], note: 'lanzar + te → «¡Lánzate!» (throw yourself)',
      act: async () => { const p = P4(); await arc(p, 0.35, -1.6, 1.4, 0.7); await dummyFall(); } },
    { k: 'tope', model: '¡Tope!', en: 'A tope! (dive through the ropes)', title: 'The dummy is outside the ring: dive between the ropes!', keys: ['tope'], soft: [],
      pre: () => { dummyAt(3.7, -1.6); put(P4(), 1.2, -1.6, HALF); }, act: async () => { const p = P4(); await walk(p, 2.2, -1.6, 0.25, 0.04); await arc(p, 3.35, -1.6, 0.5, 0.4, 0.05); await dummyFall(); } },
  ];
  const ordCheck = o => t => { const w = MUI.N(t).split(' '); if (o.keys.some(k => w.includes(k) || MUI.has(t, k))) return { ok: true }; if (o.soft.some(k => w.includes(k))) return { ok: true, minor: true, note: o.note }; return { ok: false, why: o.note || '' }; };
  async function training(o = {}) {
    let quit = false; const grades = [];
    try {
      dummyAt(0.85, -1.6); puppetOn(-1.6, -0.6, HALF);
      if (!o.quiet) await scene(async () => { ringShot(); await say('camp', 'c.l4'); await say('camp', 'c.muneco'); });
      lock(true); ringShot(); MUI.hud.open(`El entrenamiento · tell ${mimo()}!`);
      for (let i = 0; i < ORD.length; i++) {
        const O = ORD[i]; if (O.pre) O.pre();
        const g = await MUI.hud.call({ icon: 'luDive', title: O.title, sub: `An order to ${esc(mimo())} (tú) · ${i + 1} of ${ORD.length}`, bar: i / ORD.length, model: O.model, modelEn: O.en, check: ordCheck(O) });
        if (g === 'quit') { quit = true; return { quit: true }; }
        grades.push(g); await O.act(); await wait(0.3);
        if (O.k === 'dive') dummyAt(0.85, -1.6);
      }
      return { grades };
    } finally { MUI.hud.close(); puppetOff(); if (R) R.dummy.visible = false; lock(false); G.cam.override = null; if (quit && !o.quiet) later(); }
  }
  async function chapter4() {
    const st = S(); const r = await training(); if (!r || r.quit) return;
    st.ch[4] = true; st.g4 = r.grades;
    await scene(async () => { coachShot(); R.campana.pose = 'cheer'; await say('camp', 'c.done4'); R.campana.pose = 'idle'; });
    teachAll(['ph.lu.agarralo', 'ph.lu.rebota', 'ph.lu.subete', 'ph.lu.lanzate']);
    coins(10, 'La Campana is proud of you two');
  }

  // ================================================================ chapter 5: la función (the Arenita opens; El Mudo, a rudo made of the Hush)
  function showOn() { FIGHT.on = true; FIGHT.crowd = 1; for (const p of R.crowd) p.root.visible = true; setupMatch(); R.bolillo.root.visible = false; put(R.campana, -1.4, -0.9, HALF); puppetOn(-2.2, 0.3, HALF); }
  function showOff() { FIGHT.on = false; FIGHT.crowd = 0; for (const p of R.crowd) p.root.visible = false; R.mudo.root.visible = false; R.mudo.root.scale.setScalar(1.22); endMatch(); puppetOff(); if (G) G.fx.hush = 0; }
  async function chapter5() {
    const st = S(); let quit = false;
    try {
      showOn();
      await scene(async () => { rshot([0, 4.2, 6.4], [0, 1.0, -1.4]); await say('camp', 'c.l5'); await say('camp', 'c.l5b'); ringBell(1); await say('ref', 'r.hi'); });
      // El Mudo comes in: the crowd goes quiet
      const Mu = R.mudo; Mu.root.visible = true; Mu.root.scale.setScalar(1.22); put(Mu, 2.4, -4.0, -HALF);
      await scene(async () => { ringShot(); snd('grow'); for (let i = 0; i <= 30; i++) { G.fx.hush = 0.5 * i / 30; FIGHT.crowd = i > 10 ? -1 : 1; await wait(0.04); } await walk(Mu, 1.3, -2.2, 0.8, 0.04); await say('ref', 'r.mudo'); await say('mudo', 'm.hush'); await say('camp', 'c.mudo'); await say('camp', 'c.chant'); });
      lock(true); ringShot(); G.fx.hush = 0.5; MUI.hud.open('La función · Alba is watching');
      const grades = [], C = R.campana, P = R.pup;
      const call = async (o, i) => { const g = await MUI.hud.call(Object.assign({ bar: i / 7 }, o)); if (g === 'quit') { quit = true; return false; } grades.push(g); return true; };
      if (!(await call({ icon: 'luCampana', title: 'The crowd went silent. Start the chant!', sub: 'Her name, syllable by syllable, louder and louder', model: '¡Cam-pa-na! ¡Cam-pa-na!', keys: ['campana', 'cam pa na'] }, 0))) return;
      FIGHT.crowd = 1; G.fx.hush = 0.32; ringBell(1); snd('fanfare');
      await walk(Mu, -0.6, -1.1, 0.5, 0.04); C.tilt = -0.35; snd('hit');
      if (!(await call({ icon: 'luMudo', title: `El Mudo has La Campana in a hold! Tag in ${esc(mimo())}:`, sub: 'grab him!', model: `¡${mimo()}, agárralo!`, check: ordCheck(ORD[0]) }, 1))) return;
      await walk(P, -1.0, -1.05, 0.35, 0.1); C.tilt = 0; await walk(Mu, 0.8, -1.6, 0.35, 0.03); G.fx.hush = 0.25;
      if (!(await call({ icon: 'luDive', title: 'Now hit him with speed!', sub: 'bounce off the ropes', model: '¡Rebota en las cuerdas!', check: ordCheck(ORD[1]) }, 2))) return;
      await walk(P, -2.5, -0.6, 0.35, 0.1); snd('wood'); await walk(P, 0.4, -1.5, 0.3, 0.05); snd('hit'); Mu.tilt = 0.3; await wait(0.2); Mu.tilt = 0; G.fx.hush = 0.18;
      await walk(C, 2.2, -3.8, 0.5); await arc(C, 2.55, -4.15, 0.3, 0.35, MAT + 1.05);
      if (!(await call({ icon: 'luCampana', title: 'Tell Alba what she’s doing!', sub: 'narrate it, as it happens', model: '¡Sube a la tercera cuerda!', check: nowCheck(BEATS[0], false) }, 3))) return;
      await walk(P, -2.3, -3.85, 0.4, 0.1); await arc(P, -2.6, -4.15, 0.3, 0.3, MAT + 1.05);
      if (!(await call({ icon: 'luDive', title: `Both on the top rope! Tell ${esc(mimo())}:`, sub: 'dive!', model: '¡Lánzate!', check: ordCheck(ORD[3]) }, 4))) return;
      await Promise.all([arc(C, 1.2, -1.9, 1.4, 0.7), arc(P, 0.5, -1.4, 1.5, 0.7)]); await topple(Mu); G.fx.hush = 0.1;
      R.ref.pose = 'drum';
      if (!(await call({ icon: 'luBell', title: 'His shoulders are on the mat! Count with the réferi!', sub: 'one, two, three!', model: '¡Uno, dos, tres!', keys: ['uno dos tres'] }, 5))) return;
      R.ref.pose = 'idle'; ringBell(3); snd('fanfare'); FIGHT.crowd = 1;
      for (let i = 0; i <= 20; i++) { Mu.root.scale.setScalar(1.22 * (1 - i / 20) + 0.01); G.fx.hush = Math.max(0, 0.1 - i * 0.005); if (i % 4 === 0) try { G.w3d.fx.puff(Mu.x, Mu.y + 0.6, Mu.z, 4, 0.2, '#b9b8c2', 0.6); } catch (e) { /* */ } await wait(0.04); }
      Mu.root.visible = false; G.fx.hush = 0; C.pose = 'cheer'; await getUp(Mu);
      if (!(await call({ icon: 'luCampana', title: 'The whole Arenita wants more!', sub: 'shout it with them', model: '¡Otra! ¡Otra!', keys: ['otra'] }, 6))) return;
      for (let i = 0; i < 8; i++) { sparkle(X0 + (Math.random() - 0.5) * 6, Y0 + 2.5 + Math.random(), Z0 - 1.6 + (Math.random() - 0.5) * 5, 18, [['#f5c518', '#c2185b'], ['#1fa3a0', '#fff3a0']][i % 2]); snd(i % 2 ? 'pip' : 'chime'); await wait(0.2); }
      MUI.hud.close(); st.g5 = grades;
      puppetOff(); const M = G.sim.mimo, Y = G.sim.you; teleport(X0 + SPOT.you.x, Z0 + SPOT.you.z, Math.PI); put(C, SPOT.coach.x, SPOT.coach.z, 0.3); C.pose = 'idle';
      await scene(async () => { coachShot(); await say('camp', 'c.won'); await say('camp', 'c.gift'); st.mask = true; st.maskOff = false; crownAside(); const mk = miniMask(); if (mk) mk.visible = true; M.happy = 2; sparkle(M.x, M.ry + 0.9, M.z, 16); UI.toast(`${mimo()} wears a mini lucha mask!`); void Y; });
      if (typeof LEX !== 'undefined' && LEX.item('v.dive') && !LEX.taught('v.dive') && !MUI.fast) await STORY.teachWord('v.dive', { look: { x: C.x, z: C.z }, title: `${mimo()} wants to remember La Campana’s move. What is it called?` });
      else if (typeof LEX !== 'undefined' && LEX.item('v.dive') && LEX.lang === 'es') { const s = LEX.st('v.dive'); if (s.stage < 2) s.stage = 2; }
      if (!MUI.fast) try { await UI.card(`<div class="tag">La Campana · La Arenita</div><canvas width="130" height="130"></canvas><div class="big">lánzate</div><div class="sub">La plancha: ${esc(mimo())}’s new move in battles. A dive from above with twice the power; like «salta», it reaches moths in the air: «Lánzate sobre el rojo». <b>E</b></div>`, { kind: 'reveal', icon: 'luDive', say: 'lánzate' }); } catch (e) { /* */ }
      await scene(async () => { coachShot(); await say('camp', 'c.secret'); });
      st.ch[5] = true;
      teachAll(['ph.lu.campana', 'ph.lu.otra', 'ph.lu.lanzate']);
      coins(16, 'La Arenita’s first show in years');
    } finally { MUI.hud.close(); showOff(); lock(false); G.cam.override = null; if (G.save) G.save(); if (quit) later(); }
  }

  // ================================================================ the menus
  const CH = [
    { n: 1, title: 'La tortillería', sub: 'buy tortillas from Doña Toña', gate: f => !!f.rosa, wait: 'after Rosa’s welcome', run: meet },
    { n: 2, title: 'Las palabras de la lucha', sub: 'técnico, rudo, la máscara, la llave…', gate: f => !!f.boss, wait: 'after the big Hushling on the hill', run: chapter2 },
    { n: 3, title: '¡Damas y caballeros!', sub: 'call La Campana vs El Bolillo', gate: f => (f.bells || 0) >= 1, wait: 'after the first bell', run: chapter3 },
    { n: 4, title: 'El entrenamiento', sub: `train Mimo in the ring`, gate: f => (f.bells || 0) >= 2, wait: 'after the second bell', run: chapter4 },
    { n: 5, title: 'La función', sub: 'the Arenita’s big show', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell', run: chapter5 },
  ];
  let talking = false;
  const guard = fn => async () => { if (talking) return; talking = true; try { await fn(); } finally { talking = false; } };
  const maskOpt = st => (st.mask ? [{ label: st.maskOff ? `Put the mini mask back on ${mimo()}` : `Take ${mimo()}’s mini mask off`, value: 'mask' }] : []);
  const crownAside = () => { const m = G.state.mu; if (m && m.crown) m.crownOff = true; };      // (one thing on Mimo's head at a time: Xochi's crown steps aside)
  const toggleMask = st => { st.maskOff = !st.maskOff; if (!st.maskOff) crownAside(); UI.toast(st.maskOff ? 'Mask off.' : `${mimo()} wears the mini mask again!`); if (G.save) G.save(); };
  const tonaTalk = guard(async () => {
    const st = S();
    if (!st.ch[1]) return meet();
    const v = await UI.choose('Doña Toña: «¿Qué le doy?» (What can I get you?)', [{ label: 'Go down to the Arenita', sub: 'the side door with the little bell', value: 'down' }, { label: 'Chat', value: 'chat' }].concat(maskOpt(st)));
    if (v === 'down') return enter();
    if (v === 'chat') return scene(async () => { shotStand(); await say('tona', 't.day'); });
    if (v === 'mask') toggleMask(st);
  });
  const campTalk = guard(async () => {
    const st = S(), f = flags(), next = CH.find(c => !st.ch[c.n]), opts = [];
    if (next && next.n > 1) opts.push(next.gate(f) ? { label: `Chapter ${next.n}: ${next.title}`, sub: sub(next.sub), value: 'next' } : { label: `Chapter ${next.n}: ${next.title}`, sub: `later: ${next.wait}`, value: 'wait' });
    if (st.ch[2]) opts.push({ label: 'The words of lucha again', value: 'words' });
    if (st.ch[4]) opts.push({ label: `Train ${mimo()} again`, value: 'train' });
    opts.push({ label: 'Chat', value: 'chat' });
    const v = await UI.choose('La Campana: «¿Qué entrenamos hoy?» (What shall we train today?)', opts.concat(maskOpt(st)));
    if (v === 'next') return next.run();
    if (v === 'wait') return scene(async () => { coachShot(); await speak(R.campana, ['¡Todavía no! Primero, tu aventura. La lucha puede esperar.', 'Not yet! Your adventure first. Lucha can wait.'], 'La Campana'); });
    if (v === 'words') { await MUI.lesson({ title: 'Lucha libre', sub: 'the words again', face: 'luCampana', name: 'La Campana', items: ['ph.lu.tecnico', 'ph.lu.rudo', 'ph.lu.mascara', 'ph.lu.llave', 'ph.lu.tope', 'ph.lu.plancha', 'ph.lu.cuerda', 'ph.lu.referi', 'ph.lu.cuenta'].map(item) }); return; }
    if (v === 'train') { await training({ quiet: true }); return; }
    if (v === 'chat') { st.chat = (st.chat || 0) + 1; return scene(async () => { coachShot(); await say('camp', ['c.idle1', 'c.idle2', 'c.idle3'][st.chat % 3]); }); }
    if (v === 'mask') toggleMask(st);
  });
  // outdoors: Doña Toña at her counter, and the side door once you know
  const PROVIDER = {
    interactables() {
      if (!B || !on() || MUI.isOpen || (G.indoors && G.indoors())) return [];
      const L = [], Y = G.sim.you, st = S(), add = (x, z, r, label, run) => L.push({ x, z, y: B.gy(x, z), r, label, run });
      if (Math.hypot(Y.x - STAND.x, Y.z - STAND.z) < 8) add(STAND.x, STAND.z + 0.75, 1.9, 'Talk', tonaTalk);
      if (st.ch[1] && Math.hypot(Y.x - DOOR_IN.x, Y.z - DOOR_IN.z) < 4) add(DOOR_IN.x, DOOR_IN.z, 1.2, 'Go down', () => enter());
      return L;
    },
    tick(dt, Y) { if (!B || !on()) return; const st = S(); if (!st.seen && Math.hypot(Y.x - STAND.x, Y.z - STAND.z) < 9) { st.seen = true; think('Warm tortillas! A woman pats them flat, clap, clap, clap… her knuckles are bandaged.', 4.5); } },
  };
  // in the gym (main.js asks the room for its things)
  function roomItems() {
    const list = []; if (!inside || rbusy || !R) return list;
    const A = (x, z, r, label, run) => list.push({ x: X0 + x, z: Z0 + z, y: Y0, r, label, run });
    A(-6.4, 5.8, 1.4, 'Go up', leave);
    const c = R.campana; list.push({ x: c.x, z: c.z + 0.8, y: Y0, r: 2.0, label: 'Talk', run: campTalk });
    A(SPOT.bell.x, SPOT.bell.z + 0.8, 1.3, 'Ring the bell', async () => { snd('bigbell'); sparkle(X0 + SPOT.bell.x, Y0 + 0.7, Z0 + SPOT.bell.z, 8); if (G.sim.mimo) G.sim.mimo.happy = 1; });
    const poster = (x, lines) => A(x, -HD + 1.1, 1.3, 'Read', () => SIGNS.read({ tag: 'A poster on the wall', lines }));
    poster(-3.2, [{ text: '¡Lucha libre!', en: 'Lucha libre!' }, { text: 'La Campana', en: 'La Campana' }]);
    poster(3.2, [{ text: 'Arenita Alba: ¡función de lucha!', en: 'Arenita Alba: a lucha show!' }, { text: 'Técnicos vs. Rudos, a dos de tres caídas', en: 'Técnicos vs. Rudos, best two falls out of three' }, { text: 'Para toda la familia', en: 'For the whole family' }]);
    return list;
  }

  // ================================================================ the battle move, es only: «lánzate» (la plancha), a jump with twice the power
  function registerBattle() {
    const Bt = window.BATTLE && window.BATTLE._;
    const it = { id: 'v.dive', kind: 'verb', es: 'lánzate', en: 'dive (la plancha)', icon: 'luDive', battle: true, alt: { es: ['lanzate', 'aviéntate', 'avientate', 'tírate', 'tirate'] } };
    if (typeof LEX !== 'undefined' && !LEX.item('v.dive')) LEX.register([it]);
    if (!Bt || !Bt.LANGS || !Bt.LANGS.es || !Bt.MOVES || !Bt.MOVES.jump) return false;
    const Le = Bt.LANGS.es;
    // (accented forms only, like every other es verb: the parser already matches «lanzate» without the accent and grades it
    // A «accent missing»; listing the bare spellings too overwrote the accented ones, so a correct «Lánzate» graded A)
    if (!Le.verbs.dive) Le.verbs.dive = { show: 'lánzate', forms: ['lánzate', 'aviéntate', 'tírate'], en: 'dive' };
    if (Le.tips && !Le.tips.dive) Le.tips.dive = 'La plancha («lánzate», La Campana’s move): a dive from above with twice the power. Like «salta», it reaches moths in the air: «Lánzate sobre el rojo».';
    delete Le.I;
    if (!Bt.MOVES.dive) Bt.MOVES.dive = c => { c.power = (c.power || 1) * 2; return Bt.MOVES.jump(c); };
    if (Bt.VERB_EN && !Bt.VERB_EN.dive) Bt.VERB_EN.dive = 'dive (la plancha)';
    if (Bt.ITEMS && !Bt.ITEMS.some(x => x.id === 'v.dive')) Bt.ITEMS.push((typeof LEX !== 'undefined' && LEX.item('v.dive')) || it);
    return true;
  }

  // ================================================================ the quest, the sign, the map mark
  function quest() {
    const y = s => s.lu || {}, ch = (s, n) => !!(y(s).ch && y(s).ch[n]), door = () => (y(G.state).ch && y(G.state).ch[1] ? { x: DOOR_IN.x, z: DOOR_IN.z } : { x: STAND.x, z: STAND.z + 1.2 });
    const step = (n, text, why, hint) => ({ get text() { const c = CH[n - 1]; return c && !c.gate(flags()) ? text : text.replace(/ \(after [^)]*\)$/, ''); }, why, done: s => ch(s, n), target: door, hint });
    return {
      id: 'lu', kind: 'side', title: 'La Campana', giver: 'Doña Toña, the tortilla stand on the market street', started: s => s.lang === 'es' && !!y(s).met,
      steps: [
        step(1, 'Buy tortillas from Doña Toña', 'Order politely: «Me da medio kilo…», «¿Cuánto es?». Her knuckles are bandaged… and what’s in that drawer?', '{mimo} sniffs the air: warm tortillas!'),
        step(2, 'Learn the words of lucha libre in the Arenita (after the big Hushling on the hill)', 'Down the stand’s side door: técnico, rudo, la máscara, la llave, el tope, la plancha, la tercera cuerda, el réferi.', '{mimo} points at the side door with the little bell.'),
        step(3, 'Call a match as the announcer (after the first bell)', 'La Campana vs El Bolillo: narrate it as it happens (¡Salta! ¡Vuela!), then the replay in the past (¡Saltó! ¡Voló!).', '{mimo} hops toward the side door.'),
        step(4, 'Train {mimo} in the ring (after the second bell)', '¡Agárralo! ¡Rebota en las cuerdas! ¡Súbete a las cuerdas! ¡Lánzate! ¡Tope!', '{mimo} punches the air.'),
        step(5, 'La función: the Arenita’s big show (after the third bell)', 'Alba comes to watch… and the Hush sends a rudo.', '{mimo} rings an imaginary bell.'),
      ],
      story: [
        { when: s => !!y(s).met, text: 'On the market street, Doña Toña pats tortillas by hand. Strong hands, bandaged knuckles, and a mask with a little bell in her drawer: she is La Campana, a técnica luchadora, and her secret gym, the Arenita, is down the stand’s side door.' },
        { when: s => ch(s, 3), text: 'You called La Campana vs El Bolillo like a real announcer: «¡Vuela!»… and in the replay, «¡Voló!».' },
        { when: s => ch(s, 4), text: '{mimo} trained in the ring: «¡Agárralo!», «¡Súbete a las cuerdas!», «¡Lánzate!».' },
        { when: s => ch(s, 5), text: 'La función: the Arenita opened for all of Alba. El Mudo, a rudo made of the Hush, silenced the crowd, until you started the chant. La Campana and {mimo} flew together, the réferi counted three, and the bells rang him away (his mask stayed on). {mimo} learned «la plancha» («¡Lánzate sobre…!») and wears a mini mask.' },
      ],
    };
  }
  function signs() {
    if (typeof SIGNS === 'undefined' || !SIGNS.add) return;
    SIGNS.add({ id: 'lu-sign', x: STAND.x + 1.75, z: STAND.z + 0.9, r: 1.1, when: () => on(), card: () => ({ tag: 'The sign over the stand', lines: [{ text: 'Tortillería Doña Toña', en: 'Doña Toña’s tortilla stand' }, { text: 'Tortillas hechas a mano', en: 'Handmade tortillas' }] }) });
  }
  const MARK = {};
  function mapMark(dpr) {
    if (!B || !on() || !(G.state.lu && G.state.lu.met)) return null;
    const k = String(dpr);
    if (!MARK[k]) { const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr); const c = cv.getContext('2d'); c.scale(dpr, dpr); c.fillStyle = '#f5c518'; c.strokeStyle = '#2b2235'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(4, 13); c.quadraticCurveTo(4, 3, 9, 3); c.quadraticCurveTo(14, 3, 14, 13); c.lineTo(15.5, 14.5); c.lineTo(2.5, 14.5); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#8a5a12'; c.beginPath(); c.arc(9, 16, 1.6, 0, TAU); c.fill(); MARK[k] = cv; }
    return { x: STAND.x, z: STAND.z, img: MARK[k] };
  }

  // ================================================================ start, and the test hooks
  function init(game) {
    G = game; ZHF.bind(game); MUI.bind(game);
    if (typeof LEX !== 'undefined') LEX.register(PH.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', es: p.es, en: p.en, note: p.note, region: p.region, register: p.register, icon: p.icon, alt: { es: p.keys.slice() } })));
    registerIcons();
    try { registerBattle(); } catch (e) { console.error('[lucha] battle', e); }
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'lu')) QUESTS.LIST.push(quest());
    signs();
    setInterval(() => { if (on()) keepFar(); }, 30000);
  }
  try { registerBattle(); } catch (e) { /* (battle files not loaded on this page) */ }
  const TEST = {
    fast(v = true) { MUI.fast = v; },
    setup(fl) { Object.assign(G.state.flags, { hatched: true, rosa: true }, fl || {}); },
    async enterNow() { STORY.run(() => enter({ quiet: true })); for (let i = 0; i < 80 && !(inside && !rbusy); i++) { await window.__g.go(0.05); await new Promise(r => setTimeout(r, 30)); } return inside; },
    async drive(sec = 18) {
      const g = window.__g, log = [], t0 = performance.now();
      while (performance.now() - t0 < sec * 1000) {
        if (MUI.cur) { log.push('card: ' + MUI.cur.model); await Promise.race([MUI.cur.submit(MUI.cur.model || 'x'), new Promise(r => setTimeout(r, 2000))]); await g.go(0.05); continue; }
        if (MUI.hcur) { log.push('call: ' + MUI.hcur.model); MUI.hcur.submit(MUI.hcur.model); await g.go(0.05); continue; }
        const ch = document.querySelector('#choose:not(.hidden)'); if (ch) { ch.querySelector('button').click(); log.push('choose'); await g.go(0.1); continue; }
        if (STORY.line) { const s = (STORY.line.name || '') + ': ' + String(STORY.line.text || '').slice(0, 44); if (log[log.length - 1] !== s) log.push(s); if (!STORY.line.full) STORY.line.shown = 1e6; await g.press(); continue; }
        if (!STORY.busy && !MUI.isOpen && !MUI.hud.open_ && !rbusy) { log.push('END'); break; }
        await g.go(0.25);
      }
      return log;
    },
    get FIGHT() { return FIGHT; }, get R() { return R; }, get B() { return B; },
  };
  return {
    init, build, quest, hatOn, mapMark, enter, leave, registerBattle,
    get inside() { return inside; },
    get OUTSIDE() { return inside ? OUT() : null; },
    interactables() { return inside ? roomItems() : []; },
    update(dt, t) { roomUpdate(dt, t); },
    curiosities() { return []; },
    target() { if (!inside || !R) return null; const c = R.campana; return { x: c.x, z: c.z + 0.8, hint: '{mimo} points at La Campana.' }; },
    get busy() { return rbusy || FIGHT.on; },
    ROOM_AT: { x: X0, y: Y0, z: Z0 },
    _: { S: () => S(), PH, LT, QUIZ, BEATS, ORD, SPOT, STAND, CH, orderCheck, nowCheck, ordCheck, meet, chapter2, chapter3, chapter4, chapter5, training, welcome, buildRoom, PROVIDER, roomItems, t: TEST },
  };
})();
