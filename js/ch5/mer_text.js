'use strict';
// Chapter 5, «Meridiana», wave 1 (CH5-W1; DESIGN.md 21.22): every line, name, sign, task and talk, in English and Spanish here; pt / de /
// zh / ja merge in through MERTXT.add(lang, pack) (mer_text_pt.js …). zh / ja in CJK.md's notation.
//   L[key] = { en, es, pt, … }   a line (story lines go through the weave; family lines are whole English: en only)
//   NAMES, STOPS, CAST (speakers, by language), SIGNS (readable boards), CARDS (letters, envelopes, announcements)
//   SC[id] = { who, reg: 'formal' | 'casual', band, turns: [{ id, goal, need?, react: [{ if, k }] }] }: a TALK scene; each turn's lines
//            are L keys «sc.turn.a» (asked), «.s» (starter), «.e» (example), «.m» (model), «.r» / «.r2»… (reactions); its want, per
//            language: W['sc.turn'][lang]
//   MERTXT.scene(id, lang) → the TALK scene in that language (with the register check on every turn: mer_reg.js)
const MERTXT = (() => {
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const L = {}, W = {}, SC = {};
  const T = (k, en, es) => { L[k] = Object.assign(L[k] || {}, { en, es }); };
  const E = (k, en) => { L[k] = Object.assign(L[k] || {}, { en }); };          // (whole English: the family, your own thoughts)

  // ------------------------------------------------------------ names
  const NAMES = {
    city: { en: 'Meridiana', es: 'Meridiana', pt: 'Meridiana', de: 'Meridiana', zh: '[正午城|Zhèng wǔ chéng]', ja: 'メリディアナ' },
    street: { en: 'Calle del Faro', es: 'Calle del Faro' },
    home: { en: 'Calle del Faro 12', es: 'Calle del Faro 12' },
    pet: { en: 'La Pajarera', es: 'La Pajarera' },
    noise: { en: 'the noise', es: 'el ruido' },
    din: { en: 'bullicio', es: 'bullicio' },
    meg: { en: 'the Megáfono', es: 'el Megáfono' },
    preg: { en: 'the Gran Pregón', es: 'el Gran Pregón' },
  };
  // the tram's stops (and the districts' names on the mini-map's tab)
  const STOPS = {
    centro: { en: 'Barrio del Faro', es: 'Barrio del Faro', color: '#d9734a', line: 2 },
    uni: { en: 'Ciudad Universitaria', es: 'Ciudad Universitaria', color: '#3f7fc4', line: 2 },
    puerto: { en: 'Mercado del Puerto', es: 'Mercado del Puerto', color: '#2f8f8a', line: 2 },
    casa: { en: 'Home: Calle del Faro 12', es: 'Calle del Faro 12', color: '#b8864f' },
  };
  // the people: their name in each language and their look (finale.js FIN.person / talk_ui's portrait)
  const CAST = {
    noa: { name: { en: 'Noa', es: 'Noa' }, look: { skin: '#f0c9a2', hair: '#3a2a24', hairdo: 'tails', ribbon: '#f2c94c', dress: '#2f8f8a', vest: '#e2683f', h: 0.92 } },
    mom: { name: { en: 'Mom' }, look: { skin: '#f1cfb4', hair: '#b5793d', hairdo: 'bun', dress: '#5a7fb8', vest: '#f4ecdc', h: 1.0, glasses: true } },
    dad: { name: { en: 'Dad' }, look: { skin: '#e9c3a6', hair: '#6b4a32', hairdo: 'short', dress: '#7a8c5a', vest: '#e8dcc0', h: 1.06, stache: true, hair2: '#6b4a32', wide: 1.08 } },
    ollie: { name: { en: 'Ollie' }, look: { skin: '#f1cfb4', hair: '#c08a4a', hairdo: 'short', dress: '#e2533f', vest: '#2f5f8a', kid: true, h: 0.82, hat: 'cap', hatColor: '#2f5f8a' } },
    clerk: { name: { en: 'Don Anselmo', es: 'Don Anselmo' }, look: { skin: '#d9a87e', hair: '#d8d2c8', hairdo: 'bald', dress: '#3f4f6f', vest: '#c9b27a', stache: true, hair2: '#e8e4dc', hat: 'flat', hatColor: '#3f4f6f', h: 0.98 } },
    conductor: { name: { en: 'The conductor', es: 'La revisora' }, look: { skin: '#c98e62', hair: '#2e2420', hairdo: 'bun', dress: '#2f4f7f', vest: '#d8b84a', hat: 'cap', hatColor: '#2f4f7f', h: 1.0 } },
    ortega: { name: { en: 'Lic. Ortega', es: 'Lic. Ortega' }, look: { skin: '#d9a27a', hair: '#2b2420', hairdo: 'bun', dress: '#7a3f5a', vest: '#efe4d0', glasses: true, h: 1.0 } },
    ibarra: { name: { en: 'Prof. Ibarra', es: 'Prof. Ibarra' }, look: { skin: '#c98e62', hair: '#8a8a8a', hairdo: 'short', dress: '#5a4a3a', vest: '#d8c39a', beard: true, hair2: '#9a9a9a', glasses: true, h: 1.04 } },
    rocio: { name: { en: 'Rocío', es: 'Rocío' }, look: { skin: '#e9b98f', hair: '#4a2a1a', hairdo: 'tails', dress: '#3f8a6a', vest: '#f2e2c4', h: 0.96, glasses: true } },
    ivan: { name: { en: 'Iván', es: 'Iván' }, look: { skin: '#d9a87e', hair: '#1f1a18', hairdo: 'short', dress: '#e8a33a', vest: '#3a5a8a', h: 0.98 } },
    ramon: { name: { en: 'Don Ramón', es: 'Don Ramón' }, look: { skin: '#c98e62', hair: '#2e2420', hairdo: 'short', dress: '#3f6f9a', apron: '#e8e0d0', stache: true, hair2: '#2e2420', wide: 1.18, h: 1.04 } },
    mari: { name: { en: 'Doña Mari', es: 'Doña Mari' }, look: { skin: '#b97a52', hair: '#2b2235', hairdo: 'bun', dress: '#d9554a', apron: '#f2f2ea', h: 0.97, wide: 1.1 } },
    pilar: { name: { en: 'Doña Pilar', es: 'Doña Pilar' }, look: { skin: '#e9c3a6', hair: '#cfc8c0', hairdo: 'bun', dress: '#6f5a9a', shawl: '#e8b83e', h: 0.94, glasses: true } },
    lupita: { name: { en: 'Lupita', es: 'Lupita' }, look: { skin: '#c98e62', hair: '#1f1a18', hairdo: 'braids', ribbon: '#e2453a', dress: '#f2c94c', apron: '#5fae4f', h: 0.95 } },
    celes: { name: { en: 'Don Celestino', es: 'Don Celestino' }, look: { skin: '#e0b089', hair: '#eeeae2', hairdo: 'bald', dress: '#5f7f4a', vest: '#e8d4b0', stache: true, hair2: '#eeeae2', glasses: true, h: 0.94, prop: 'cane' } },
    speaker: { name: { en: 'Speaker', es: 'Altavoz' } },
  };

  // ------------------------------------------------------------ the story (es; English)
  // Noa's news, in Alba by the duck pond (after the credits)
  T('news.call', 'Hey! Come here, come here! I’ve got news!', '¡Oye! ¡Ven, ven! ¡Tengo noticias!');
  T('news.1', 'A letter came from the University of Meridiana. Look!', 'Llegó una carta de la Universidad de Meridiana. ¡Mira!');
  T('news.2', 'They accepted me! I’m going to study science in the city.', '¡Me aceptaron! Voy a estudiar ciencias en la ciudad.');
  T('news.3', 'But I’ve never left the valley… Will you come with me?', 'Pero nunca he salido del valle… ¿Vienes conmigo?');
  E('you.news1', 'Meridiana? …That’s where I grew up. My family still lives there.');
  T('news.4', 'Really? You never told me! Then you’re going to show me the city.', '¿En serio? ¡Nunca me lo contaste! Entonces tú me vas a enseñar la ciudad.');
  E('you.news2', 'I lived there for years… and I never really listened to anyone. Maybe this time I can.');
  T('news.5', 'The letter comes with two tickets. We have to get them at the station’s ticket office.', 'La carta trae dos pasajes. Hay que recogerlos en la taquilla de la estación.');
  E('think.news', 'Alba’s ticket office… It was always locked, with its clock stopped at eight.');
  // the ticket office
  E('look.office', 'The ticket office is open. Its clock, stopped at eight for years, is ticking again.');
  E('look.officeShut', 'The station house is locked. Through the window: an empty ticket office, and a clock stopped at eight.');
  E('think.tickets', 'Two return tickets to Meridiana. The train’s coming in.');
  E('think.board', 'Not yet: the tickets first, at the ticket office.');
  // the ride (captions: your thoughts, in English, like the opening's)
  const RIDE = ['The same carriage. The same seat by the window.', 'Noa hasn’t taken her eyes off the window since Alba.', 'Last time, the signs were just shapes. Now I can read every one.', 'Meridiana. I grew up there… and I never really listened.'];
  T('ride.sign1', 'Emergency exit', 'Salida de emergencia');
  T('ride.sign2', 'Next station: Meridiana – Barrio del Faro', 'Próxima estación: Meridiana – Barrio del Faro');
  T('ride.ann', 'Ladies and gentlemen: we will shortly arrive in Meridiana, Barrio del Faro station. The doors will open on the left-hand side. Connection with the tram, line 2. Thank you for traveling with us.',
    'Señoras y señores pasajeros: en breve llegaremos a Meridiana, estación Barrio del Faro. Las puertas se abrirán del lado izquierdo. Correspondencia con el tranvía, línea dos. Gracias por viajar con nosotros.');
  T('ride.q', 'Which side will the doors open on?', '¿De qué lado se abrirán las puertas?');
  T('ride.qL', 'the left', 'del lado izquierdo'); T('ride.qR', 'the right', 'del lado derecho'); T('ride.qB', 'both sides', 'de los dos lados');
  E('think.rideOK', 'The left. I understood the whole announcement. The whole thing!');
  E('think.rideNo', 'The left, actually: «{L:ride.qL}». Close. I’ll hear it next time.');
  // arriving: the noise
  T('arr.1', 'So many people! Is it always this loud?', '¡Cuánta gente! ¿Siempre es así de ruidoso?');
  T('arr.2', 'Sorry… excuse me… Calle del Faro…?', 'Perdón… disculpe… ¿la calle del Faro…?');
  E('think.arr', 'Nobody even turned around. In Alba, I was the stranger. Here, she is.');
  T('arr.3', 'Nobody listens to me here… You’d better do the talking.', 'Aquí nadie me escucha… Mejor habla tú.');
  T('crowd.1', 'Did you see the game?', '¿Viste el partido?'); T('crowd.2', 'I’m late, I’m late!', '¡Voy tarde, voy tarde!'); T('crowd.3', 'Two for ten, two for ten!', '¡Dos por diez, dos por diez!');
  T('crowd.4', 'I told you already!', '¡Ya te lo dije!'); T('crowd.5', 'Who’s next?', '¿Quién sigue?'); T('crowd.6', 'Listen to me!', '¡Escúchame!');
  // Ollie on the corner (Spanish with his friends and to test you; English once he knows you speak it)
  T('ollie.hey', 'What’s up?! No way, you’re here!', '¿Qué onda? ¡No manches, ya llegaste!');
  E('ollie.en1', 'Wait. You actually speak it now? Like, for real?');
  E('ollie.en2', 'This is Noa? Hi! I’m Ollie, the younger, cooler one.');
  T('noa.ollie', 'Nice to meet you, Ollie! You talk just like the people here.', '¡Mucho gusto, Ollie! Hablas como la gente de aquí.');
  E('ollie.din1', 'Oh no. {Dins}. They’ve been all over the street since spring. They come out of all the shouting.');
  E('ollie.din2', 'Here’s the trick: if you say the same thing twice, they shout it right back at you. Say it another way!');
  T('noa.din', 'What are those things? They look like they’re made of nothing but words!', '¿Qué son esas cosas? ¡Parecen hechas de puras palabras!');
  E('ollie.won', 'Okay, that was actually cool. Mom is going to freak out. Come on: number 12, the green door.');
  // home: the family (whole English)
  E('home.mom1', 'Look at you! Come here, come here.');
  E('home.mom2', 'And you must be Noa. We’ve heard so much about you. Welcome to our little chaos.');
  E('home.dad1', 'Perfect timing. Dinner’s almost ready, if this oven decides to cooperate.');
  E('home.ollie1', 'Dad. They speak it now. Like, actually speak it. They just beat a whole street of {dins}.');
  E('home.dad2', 'Really? Then maybe you could help me with something. I bought a kettle at the harbor market last week, and it died on day two.');
  E('home.dad3', 'I went back with the receipt and tried to explain. He talked louder, I talked louder, and nobody understood anybody.');
  E('home.mom3', 'Twelve years in this city, and we still only know «{hola}» and «{gracias}». We always meant to learn. There was always tomorrow.');
  E('you.home', 'I get it. I grew up here, and I never really listened either.');
  E('home.noa1', 'Your letters taught me English. I never thought I’d get to use it at a real dinner table.');
  E('home.mom4', 'Well, it’s perfect. Better than half my office.');
  E('home.dad4', 'So: tomorrow, the university. And if you get a minute… the kettle?');
  E('home.ollie2', 'Tram line 2, from the stop by the station. My old card’s on the counter: top it up at the machine. And watch out for {dins}.');
  E('home.night', 'That night, in my old room, the city came in through the window. For the first time, I could pick out the words.');
  E('home.chat.mom', 'Your father’s been practicing «{cuanto}» in the mirror. Don’t tell him I told you.');
  E('home.chat.mom2', 'I’m so glad you’re home. Even if it’s only for a while.');
  E('home.chat.dad', 'The port’s cranes are mine, more or less. Well, I keep them running. Ask me anything about cranes.');
  E('home.chat.dad2', 'Your mother says I should take a class. She’s right. Don’t tell her I said that.');
  E('home.chat.ollie', 'At school they call me «{oli}». It sounds cooler in {langName}.');
  E('home.chat.ollie2', 'You say «{usted}» to teachers and old people, «{tu}» to me. If you «{usted}» me, I’m moving out.');
  // the university
  T('uni.arr1', 'Look at the clock tower! And so many people…', '¡Mira la torre del reloj! Y cuánta gente…');
  T('uni.arr2', 'The letter says enrollment is at Student Services.', 'La carta dice que la inscripción es en Servicios Escolares.');
  T('uni.turn', 'Number A-42, please go to window three.', 'Turno A cuarenta y dos, pase a la ventanilla tres.');
  T('uni.turnQ', 'Which window are you called to?', '¿A qué ventanilla te llaman?');
  E('think.turn', 'My number: A-42. Window three. I heard it!');
  E('think.turnNo', 'Window three: «{L:uni.win3}». Okay, there.');
  T('uni.win3', 'window three', 'ventanilla tres');
  T('noa.enrolled', 'We did it! Well… you did. I couldn’t get a word out.', '¡Lo logramos! Bueno… lo lograste tú. Yo me quedé sin palabras.');
  T('ibarra.1', 'Welcome to the Faculty of Science! Today I’ll start with a question: what is sound?', '¡Bienvenidos a la Facultad de Ciencias! Hoy empiezo con una pregunta: ¿qué es el sonido?');
  T('ibarra.2', 'Sound is a vibration. When someone speaks, the air moves in waves, and those waves reach our ears.', 'El sonido es una vibración. Cuando alguien habla, el aire se mueve en ondas, y esas ondas llegan a nuestros oídos.');
  T('ibarra.3', 'But listening isn’t the same as hearing. You hear with your ears… you listen with your attention.', 'Pero escuchar no es lo mismo que oír. Se oye con los oídos… se escucha con atención.');
  T('ibarra.4', 'That’s why noise isn’t louder sound. Noise is sound that nobody listens to…', 'Por eso el ruido no es sonido más fuerte. El ruido es sonido que nadie escucha…');
  T('meg.1', 'BLAH BLAH BLAH! NOBODY LISTENS! EVERYBODY TALKS!', '¡BLA BLA BLA! ¡NADIE ESCUCHA! ¡TODOS HABLAN!');
  T('ibarra.5', 'Thank you. You see? One voice that listens is worth more than a thousand that shout.', 'Gracias. ¿Ven? Una voz que escucha vale más que mil que gritan.');
  T('ibarra.6', 'Now our new students will introduce themselves. Who’s first? You, Miss Noa?', 'Ahora los nuevos estudiantes se presentan. ¿Quién empieza? ¿Usted, señorita Noa?');
  T('noa.freeze', 'I… it’s just… there are so many people…', 'Yo… es que… hay tanta gente…');
  E('think.talk', 'In Alba, Noa always spoke up for me. My turn.');
  T('noa.thanks', 'In Alba, I spoke for you. Today you spoke for me. Thank you.', 'En Alba, yo hablaba por ti. Hoy hablaste tú por mí. Gracias.');
  E('home2.mom', 'So? How did it go?');
  E('home2.noa', 'I’m officially a university student!');
  E('home2.dad', 'Fantastic! That’s wonderful, Noa. …And the kettle?');
  E('home2.ollie', 'Dad. Priorities.');
  // the harbor market
  E('mk.dad1', 'This is the place. The stall with the blue awning. That’s the man.');
  T('ramon.call', 'Come on in, come on in! Blenders, irons, kettles! Everything cheap!', '¡Pásele, pásele! ¡Licuadoras, planchas, teteras! ¡Todo barato!');
  E('mk.dad.k1', 'Tell him it stopped working after two days. And that I’ve got the receipt.');
  E('mk.dad.k2', 'Honestly? Another kettle. A good one, one that lasts.');
  E('mk.dad.done', 'You did in two minutes what I couldn’t do in a week. Thank you. Really.');
  T('preg.1', 'TWO FOR TEN! FIVE FOR NOTHING! CHEAP, CHEAP! NOBODY ASKS!', '¡DOS POR DIEZ! ¡CINCO POR NADA! ¡BARATO, BARATO! ¡NADIE PREGUNTA!');
  T('mk.after', 'Hey… Lupita, how much are you selling the tomatoes for? Ah, that’s a good price.', 'Oiga… doña Lupita, ¿a cuánto da los jitomates? Ah, buen precio.');
  E('mk.dad.after', 'Look at that. They’re actually talking to each other.');
  E('home3.mom', 'Martin, is that a new kettle?');
  E('home3.dad', 'Twelve years, and the first refund I’ve ever gotten in this city. Well. Exchange.');
  E('home3.mom2', 'Maybe it’s time we learned more than «{hola}». Would you help us? Not to talk for us forever… just to start.');
  E('home3.ollie', 'I’ll teach you too. Slang costs extra.');
  E('home3.you', 'Deal. All of you.');
  // the pet shop
  T('cel.1', 'That little bird…! It can’t be! Is it from the blue egg?', '¡Ese pajarito…! ¡No puede ser! ¿Es del huevo azul?');
  E('think.cel', 'The old pet shop. Everything in here used to sound like music I couldn’t follow.');
  T('cel.2', 'Do you remember what I told you that day? You just kept saying «sí, sí».', '¿Se acuerda de lo que le dije aquel día? Usted solo decía «sí, sí».');
  E('you.cel', 'I didn’t understand a word back then.');
  T('cel.3', 'I told you: it’s an echo-bird egg. Whatever hatches from it learns to speak by listening. Speak to it kindly, and it speaks kindly.', 'Le dije: es un huevo de ave eco. Lo que nace de él aprende a hablar escuchando. Si le hablan con cariño, habla con cariño.');
  T('cel.4', 'There were two eggs, you know. The other went to someone who never had time to listen.', 'Eran dos huevos, ¿sabe? El otro se lo llevó alguien que nunca tenía tiempo de escuchar.');
  T('cel.5', 'I hope someone has spoken to that little bird… kindly.', 'Ojalá que alguien le haya hablado a ese pajarito… con cariño.');
  T('cel.chat', 'Mimo looks healthy and happy. You must talk to it a lot.', 'Mimo se ve sano y contento. Seguro que le habla mucho.');
  // the tram
  T('tram.ann.centro', 'Next stop: Barrio del Faro. Connection with the train.', 'Próxima parada: Barrio del Faro. Correspondencia con el tren.');
  T('tram.ann.uni', 'Next stop: Ciudad Universitaria. Please exit by the right-hand door.', 'Próxima parada: Ciudad Universitaria. Bajen por la puerta derecha, por favor.');
  T('tram.ann.puerto', 'Next stop: Mercado del Puerto. Mind the gap when you get off.', 'Próxima parada: Mercado del Puerto. Cuidado con el escalón al bajar.');
  T('tram.where', 'Where to?', '¿A dónde?');
  T('tram.m.title', 'Card machine · Choose an option', 'Máquina de tarjetas · Elija una opción');
  T('tram.m.buy', 'Buy a new card', 'Comprar tarjeta nueva'); T('tram.m.top', 'Top up a card', 'Recargar tarjeta'); T('tram.m.bal', 'Check the balance', 'Consultar saldo');
  T('tram.m.ok', 'Top-up complete: monthly pass active.', 'Recarga exitosa: abono mensual activado.');
  T('tram.m.bal0', 'Balance: 0 rides. Top up your card.', 'Saldo: 0 viajes. Recargue su tarjeta.');
  E('think.tramBuy', 'I already have Ollie’s old card. I just need to top it up.');
  // Mimo and the noise, on a district's first visit
  E('think.din', '{Dins}. Remember Ollie’s trick: say it another way.');
  E('tip.reg', 'Meridiana talks two ways: «{usted}» to officials, vendors and elders, «{tu}» to friends and family. The chip under a name says which.');

  // ------------------------------------------------------------ the tasks: TALK scenes (formal or casual, by setting)
  const S = (id, def) => { SC[id] = Object.assign({ id, band: 3 }, def); };
  const R = (k, iff) => (iff ? { if: iff, k } : { k });
  // the ticket office (Alba)
  S('ticket', { who: 'clerk', reg: 'formal', turns: [
    { id: 'buy', goal: 'Ask politely for two tickets to Meridiana (the letter pays for them).', react: [R('r')] },
    { id: 'ret', goal: 'Say you want return tickets, and why (you’ll come back to Alba).', react: [R('r2', { reason: true }), R('r')] },
    { id: 'when', goal: 'Ask when the next train leaves (or from which platform).', react: [R('r')] }] });
  T('ticket.buy.a', 'Good afternoon! The ticket office is open again, after so many years. How may I help you?', '¡Buenas tardes! La taquilla volvió a abrir, después de tantos años. ¿En qué le puedo servir?');
  T('ticket.buy.s', 'Good afternoon. I’d like ___', 'Buenas tardes. Quisiera ___');
  T('ticket.buy.e', 'Could you give me two tickets to Meridiana, please?', '¿Me podría dar dos boletos para Meridiana, por favor?');
  T('ticket.buy.m', 'Good afternoon. I’d like two tickets to Meridiana, please. Here’s the letter.', 'Buenas tardes. Quisiera dos boletos a Meridiana, por favor. Aquí tiene la carta.');
  T('ticket.buy.r', 'With pleasure. Yes, it says so here: two tickets paid by the university.', 'Con mucho gusto. Sí, aquí dice: dos pasajes pagados por la universidad.');
  T('ticket.ret.a', 'Would you like them one-way or return?', '¿Los quiere sencillos o de ida y vuelta?');
  T('ticket.ret.s', 'Return, ___', 'De ida y vuelta, ___');
  T('ticket.ret.e', 'Return, please. We’re coming back to visit everyone.', 'De ida y vuelta, por favor. Vamos a regresar a visitar a todos.');
  T('ticket.ret.m', 'Return, please, because we’re coming back to Alba.', 'De ida y vuelta, por favor, porque vamos a volver a Alba.');
  T('ticket.ret.r', 'Very well: return.', 'Muy bien: de ida y vuelta.');
  T('ticket.ret.r2', 'How nice! Alba will always be waiting for you.', '¡Qué bueno! Alba siempre los va a esperar.');
  T('ticket.when.a', 'All set. Any questions before you board?', 'Listo. ¿Tiene alguna pregunta antes de subir al tren?');
  T('ticket.when.s', 'What time ___?', '¿A qué hora ___?');
  T('ticket.when.e', 'Which platform does the next train leave from?', '¿De qué andén sale el próximo tren?');
  T('ticket.when.m', 'Yes: what time does the next train to Meridiana leave?', 'Sí: ¿a qué hora sale el próximo tren a Meridiana?');
  T('ticket.when.r', 'In a few minutes, from the only platform we have. Have a good trip! And say hello to the city for me.', 'Sale en unos minutos, del único andén que tenemos. ¡Buen viaje! Y salúdeme a la ciudad.');
  // the conductor, on the train
  S('conductor', { who: 'conductor', reg: 'formal', turns: [
    { id: 'tix', goal: 'Hand her your tickets, politely.', react: [R('r')] },
    { id: 'first', goal: 'Tell her the city is your hometown, but it’s your friend’s first time.', react: [R('r')] }] });
  T('conductor.tix.a', 'Good afternoon. May I see your tickets, please?', 'Buenas tardes. ¿Me permiten sus boletos, por favor?');
  T('conductor.tix.s', 'Of course. Here ___', 'Sí, claro. Aquí ___');
  T('conductor.tix.e', 'Here they are. They’re from the university.', 'Aquí están. Son de la universidad.');
  T('conductor.tix.m', 'Of course. Here are our tickets.', 'Sí, claro. Aquí tiene nuestros boletos.');
  T('conductor.tix.r', 'Thank you. Is it your first time in Meridiana?', 'Gracias. ¿Es su primera vez en Meridiana?');
  T('conductor.first.a', 'Is it your first time in Meridiana?', '¿Es la primera vez que van a Meridiana?');
  T('conductor.first.s', 'I grew up there, but ___', 'Yo crecí allí, pero ___');
  T('conductor.first.e', 'No, I lived there. But it’s my friend’s first time.', 'No, yo vivía allí. Pero mi amiga va por primera vez.');
  T('conductor.first.m', 'I grew up there, but for my friend it’s the first time.', 'Yo crecí allí, pero para mi amiga es la primera vez.');
  T('conductor.first.r', 'Welcome, then! You’ll like it… although it’s been very noisy lately.', '¡Bienvenidos, entonces! Les va a gustar… aunque últimamente hay mucho ruido.');
  // Ollie on the corner (casual)
  S('ollie', { who: 'ollie', reg: 'casual', band: 2, turns: [{ id: 'trip', goal: 'Answer your little brother casually: how was the trip?', react: [R('r')] }] });
  T('ollie.trip.a', 'What’s up? How was the trip?', '¿Qué onda? ¿Qué tal el viaje?');
  T('ollie.trip.s', 'Great! The trip ___', '¡Bien! El viaje ___');
  T('ollie.trip.e', 'Pretty good! Long, but really nice.', '¡Muy bien! Largo, pero muy bonito.');
  T('ollie.trip.m', 'Good! It was a long trip, but really nice. And what’s up with you?', '¡Bien! Fue un viaje largo, pero muy bonito. ¿Y tú qué onda?');
  T('ollie.trip.r', 'No way! You speak {langName}!', '¡No manches! ¡Hablas español!');
  // Student Services: Noa's enrollment (formal)
  S('enroll', { who: 'ortega', reg: 'formal', turns: [
    { id: 'why', goal: 'Explain that your friend Noa was accepted to the Faculty of Science and wants to enroll.', react: [R('r')] },
    { id: 'docs', goal: 'Hand them over and ask whether she needs any other document.', react: [R('r')] },
    { id: 'miss', goal: 'Ask politely where it could be, and what you can do.', react: [R('r')] }] });
  T('enroll.why.a', 'Good morning. How can I help you?', 'Buenos días. ¿En qué le puedo ayudar?');
  T('enroll.why.s', 'Good morning. My friend Noa ___', 'Buenos días. Mi amiga Noa ___');
  T('enroll.why.e', 'My friend was accepted in Science and would like to enroll.', 'Mi amiga fue aceptada en Ciencias y quisiera inscribirse.');
  T('enroll.why.m', 'Good morning. My friend Noa was accepted to the Faculty of Science, and she would like to enroll.', 'Buenos días. A mi amiga Noa la aceptaron en la Facultad de Ciencias, y quisiera inscribirse.');
  T('enroll.why.r', 'Gladly. May I see the admission letter and your friend’s ID?', 'Con gusto. ¿Me permite la carta de admisión y una identificación de su amiga?');
  T('enroll.docs.a', 'The admission letter and an ID, please.', 'La carta de admisión y una identificación, por favor.');
  T('enroll.docs.s', 'Here you are. ___?', 'Aquí tiene. ¿___?');
  T('enroll.docs.e', 'Here you are. Do you need anything else?', 'Aquí tiene. ¿Necesita algo más?');
  T('enroll.docs.m', 'Of course: here are the letter and her ID. Do you need any other document?', 'Claro, aquí tiene la carta y su identificación. ¿Necesita algún otro documento?');
  T('enroll.docs.r', 'Let me check the system…', 'Déjeme revisar en el sistema…');
  T('enroll.miss.a', 'Hmm. Her school transcript is missing. According to the system, it was sent by her school on Monday, but it hasn’t arrived here.', 'Mmm. Falta el certificado de estudios. Según el sistema, fue enviado por su escuela el lunes, pero aquí no ha llegado.');
  T('enroll.miss.s', 'I see. Where ___?', 'Entiendo. ¿Dónde ___?');
  T('enroll.miss.e', 'Where could it be? What can we do?', '¿Dónde podría estar? ¿Qué podemos hacer?');
  T('enroll.miss.m', 'I see. Do you know where it could be? What can we do?', 'Entiendo. ¿Sabe dónde podría estar? ¿Qué podemos hacer nosotros?');
  T('enroll.miss.r', 'Ask at the library: the internal mail is delivered there. If you find it, bring it to me and we’ll finish the enrollment.', 'Pregunten en la biblioteca: allí se entrega el correo interno. Si lo encuentran, tráiganmelo y terminamos la inscripción.');
  // the library (formal)
  S('rocio', { who: 'rocio', reg: 'formal', turns: [{ id: 'env', goal: 'Ask whether an envelope for Noa arrived in the internal mail (her school sent her transcript).', react: [R('r')] }] });
  T('rocio.env.a', 'Thank you! With that noise, nobody could even think. How can I help you?', '¡Gracias! Con ese ruido no se podía ni pensar. ¿En qué les puedo ayudar?');
  T('rocio.env.s', 'We’re looking for ___', 'Buscamos ___');
  T('rocio.env.e', 'Did an envelope for Noa arrive? It’s her transcript.', '¿Llegó un sobre para Noa? Es su certificado.');
  T('rocio.env.m', 'We’re looking for an envelope for Noa. It’s her transcript: it was sent by her school.', 'Buscamos un sobre para Noa. Es su certificado de estudios: fue enviado por su escuela.');
  T('rocio.env.r', 'Oh, yes! It came here by mistake. Here it is.', '¡Ah, sí! Llegó aquí por error. Aquí está.');
  // telling Student Services what happened (formal; the passive)
  S('report', { who: 'ortega', reg: 'formal', band: 4, turns: [{ id: 'what', goal: 'Tell her what happened to it, in the passive (it was sent…, it was delivered…).', need: ['passive'], react: [R('r')] }] });
  T('report.what.a', 'Did you find it? What happened to the transcript?', '¿Lo encontraron? ¿Qué pasó con el certificado?');
  T('report.what.s', 'The transcript was ___', 'El certificado fue ___');
  T('report.what.e', 'It was sent on Monday, but it was delivered to the library.', 'Fue enviado el lunes, pero fue entregado en la biblioteca.');
  T('report.what.m', 'Yes. The transcript was sent on Monday, but it was delivered to the library by mistake.', 'Sí. El certificado fue enviado el lunes, pero fue entregado en la biblioteca por error.');
  T('report.what.r', 'Now I understand. Thank you for explaining. Miss Noa: your enrollment is complete. Welcome to the university!', 'Ahora entiendo. Muchas gracias por explicármelo. Señorita Noa: su inscripción está completa. ¡Bienvenida a la universidad!');
  // Iván's notebook (casual: a student; the passive)
  S('ivan', { who: 'ivan', reg: 'casual', band: 4, turns: [{ id: 'where', goal: 'Tell him where his notebook was found, in the passive (it was found…).', need: ['passive'], react: [R('r')] }] });
  T('ivan.lost', 'Have you seen a green notebook? It’s my lab notebook… I have an exam tomorrow!', '¿No han visto un cuaderno verde? Es mi cuaderno de laboratorio… ¡Mañana tengo examen!');
  T('ivan.where.a', 'My notebook! Where was it?', '¡Mi cuaderno! ¿Dónde estaba?');
  T('ivan.where.s', 'It was found ___', 'Fue encontrado ___');
  T('ivan.where.e', 'It was found in the cafeteria.', 'Fue encontrado en la cafetería.');
  T('ivan.where.m', 'It was found on a table in the cafeteria.', 'Fue encontrado en una mesa de la cafetería.');
  T('ivan.where.r', 'Phew! Thanks. Without it, I couldn’t have studied for tomorrow.', '¡Uf! Gracias. Sin él, no podía estudiar para mañana.');
  // tutoring Iván (casual: explain a process)
  S('tutor', { who: 'ivan', reg: 'casual', band: 4, turns: [{ id: 'how', goal: 'Explain the echo experiment in three steps, in order ({seqEx}): put the mic by the wall, clap once, measure how long the echo takes.', need: ['seq'], react: [R('r')] }] });
  T('ivan.ask', 'Hey, can you explain the echo experiment to me? I didn’t get it in class.', 'Oye, ¿me explicas el experimento del eco? En clase no le entendí.');
  T('tutor.how.a', 'So how is it done? Step by step.', 'A ver, ¿cómo se hace? Paso por paso.');
  T('tutor.how.s', 'First, ___. Then, ___. Finally, ___.', 'Primero se ___. Luego se ___. Al final se ___.');
  T('tutor.how.e', 'First you put the mic by the wall, then you clap.', 'Primero se pone el micrófono junto a la pared, luego se aplaude.');
  T('tutor.how.m', 'First, you put the microphone by the wall. Then you clap once. Finally, you measure how long the echo takes.', 'Primero se pone el micrófono junto a la pared. Luego se aplaude una vez. Al final se mide cuánto tarda el eco.');
  T('tutor.how.r', 'Ohhh! Now I get it. You explain it better than the professor. Don’t tell him I said that.', '¡Aaah! Ya entendí. Lo explicas mejor que el profe. No le digas que dije eso.');
  // Dad's kettle (formal; you translate for Dad)
  S('kettle', { who: 'ramon', reg: 'formal', band: 4, turns: [
    { id: 'what', goal: 'Tell {ramon} what Dad said: the kettle stopped working after two days, and he has the receipt.', react: [R('r')] },
    { id: 'insist', goal: 'Insist politely: the receipt says there’s a one-month guarantee. Ask (with {condEx}) whether he could exchange it or give the money back.', need: ['cond'], react: [R('r')] },
    { id: 'pref', goal: 'Tell him what Dad prefers, reporting it (Dad says that…): another kettle, a good one that lasts.', need: ['report'], react: [R('r')] }] });
  T('kettle.what.a', 'What can I do for you?', '¿Qué se le ofrece?');
  T('kettle.what.s', 'Good morning. My dad bought ___', 'Buenos días. Mi papá compró ___');
  T('kettle.what.e', 'My dad bought this kettle here, and it stopped working.', 'Mi papá compró esta tetera aquí, y dejó de funcionar.');
  T('kettle.what.m', 'Good morning. My dad bought this kettle here last week, but it stopped working after two days. Here’s the receipt.', 'Buenos días. Mi papá compró esta tetera aquí la semana pasada, pero dejó de funcionar a los dos días. Aquí está el recibo.');
  T('kettle.what.r', 'A refund? Oh, no! We don’t do refunds here. What’s sold is sold!', '¿Devolución? ¡Uy, no! Aquí no hacemos devoluciones. ¡Lo que se vende, se vende!');
  T('kettle.insist.a', 'Anything else?', '¿Algo más?');
  T('kettle.insist.s', 'I understand, but according to the receipt ___', 'Entiendo, pero según el recibo ___');
  T('kettle.insist.e', 'The receipt says it has a guarantee. Could you exchange it?', 'El recibo dice que tiene garantía. ¿Podría cambiarla?');
  T('kettle.insist.m', 'I understand, but according to the receipt it has a one-month guarantee. Could you exchange it or give us the money back?', 'Entiendo, pero según el recibo tiene garantía de un mes. ¿Podría cambiarla o devolvernos el dinero?');
  T('kettle.insist.r', 'Let’s see… «guarantee: thirty days». Hmm… you’re right. What does your dad prefer: another kettle or the money?', 'A ver… «garantía: treinta días». Mmm… tiene razón. ¿Qué prefiere su papá: otra tetera o el dinero?');
  T('kettle.pref.a', 'What does your dad prefer?', '¿Qué prefiere su papá?');
  T('kettle.pref.s', 'My dad says that ___', 'Mi papá dice que ___');
  T('kettle.pref.e', 'He says he prefers another kettle.', 'Dice que prefiere otra tetera.');
  T('kettle.pref.m', 'My dad says he prefers another kettle, a good one that lasts.', 'Mi papá dice que prefiere otra tetera, una buena que dure.');
  T('kettle.pref.r', 'This is the best one I’ve got! And… sorry. With so much noise around here, nobody listens to anybody anymore.', '¡Esta es la mejor que tengo! Y… disculpen. Con tanto ruido aquí, uno ya no escucha a nadie.');
  // the fish quarrel (formal to both; say what one means to the other)
  S('fish', { who: 'mari', reg: 'formal', band: 4, turns: [
    { id: 'p', goal: '{pilar} says the fish she bought this morning isn’t fresh: it smells. Tell {mari} what she means, in other words ({meansEx}).', need: ['report'], react: [R('r')] },
    { id: 'm', goal: 'Tell {pilar} what {mari} says: she’ll exchange it, and in this heat fish has to go in the fridge.', need: ['report'], react: [R('r')] }] });
  T('fish.pil', 'This fish isn’t fresh! I bought it this morning and it already smells!', '¡Este pescado no está fresco! ¡Lo compré esta mañana y ya huele!');
  T('fish.mar', 'My fish is the freshest in the port! You don’t know anything!', '¡Mi pescado es el más fresco del puerto! ¡Usted no sabe nada!');
  T('fish.p.a', 'What is she saying? I can’t hear a thing with all this shouting!', '¿Qué dice? ¡Con tanto grito no oigo nada!');
  T('fish.p.s', 'Doña Mari, what she means is that ___', 'Doña Mari, lo que ella quiere decir es que ___');
  T('fish.p.e', 'She says she bought it this morning and it isn’t fresh.', 'Dice que lo compró esta mañana y que no está fresco.');
  T('fish.p.m', 'Doña Mari, what she means is that she bought the fish this morning and it doesn’t seem fresh to her.', 'Doña Mari, lo que la señora quiere decir es que compró el pescado esta mañana y no le parece fresco.');
  T('fish.p.r', 'Oh! Well… let’s see… yes, this one is from yesterday. I’ll exchange it. But tell her that in this heat, fish goes straight into the fridge!', '¡Ah! Pues… a ver… sí, este es de ayer. Se lo cambio. ¡Pero dígale que con este calor el pescado va directo al refrigerador!');
  T('fish.m.a', 'And what did she say?', '¿Y qué dijo?');
  T('fish.m.s', 'She says that ___', 'Dice que ___');
  T('fish.m.e', 'She says she’ll exchange it.', 'Dice que se lo cambia.');
  T('fish.m.m', 'Ma’am, she says she’ll exchange it, and that in this heat you have to keep fish in the fridge.', 'Señora, dice que se lo cambia, y que con este calor hay que guardar el pescado en el refrigerador.');
  T('fish.m.r', 'Oh, well. Thank you. At last someone listens to us.', 'Ah, bueno. Gracias. Por fin alguien nos escucha.');
  // Lupita's scale (formal)
  S('scale', { who: 'lupita', reg: 'formal', band: 3, turns: [{ id: 'kilo', goal: 'Politely say the scale seems wrong: you asked for a kilo and there’s less.', react: [R('r')] }] });
  T('scale.kilo.a', 'Your kilo of mangoes! What else can I get you?', '¡Su kilo de mangos! ¿Qué más le doy?');
  T('scale.kilo.s', 'Excuse me, I think the scale ___', 'Disculpe, creo que la báscula ___');
  T('scale.kilo.e', 'Excuse me, I think there’s less than a kilo here.', 'Disculpe, creo que aquí hay menos de un kilo.');
  T('scale.kilo.m', 'Excuse me, I think the scale isn’t right: I asked for a kilo and there’s less here.', 'Disculpe, creo que la báscula no está bien: pedí un kilo y aquí hay menos.');
  T('scale.kilo.r', 'Oh, sorry! With all the shouting I didn’t even notice. Here, I’ll add two more mangoes.', '¡Ay, perdón! Con tanto grito ni me fijé. Tenga, le pongo dos mangos más.');
  // the pet shop (formal: an elder)
  S('celes', { who: 'celes', reg: 'formal', turns: [{ id: 'egg', goal: 'Tell him yes, you bought it here, and introduce Mimo (where it hatched, its name).', react: [R('r')] }] });
  T('celes.egg.a', 'You’re the one who bought the blue egg, aren’t you? What hatched?', 'Usted es quien compró el huevo azul, ¿verdad? ¿Qué nació?');
  T('celes.egg.s', 'Yes, I bought it here. ___', 'Sí, lo compré aquí. ___');
  T('celes.egg.e', 'Yes. It hatched in Alba. Its name is Mimo.', 'Sí. Nació en Alba. Se llama Mimo.');
  T('celes.egg.m', 'Yes, I bought it here. It hatched in Alba, and its name is Mimo.', 'Sí, lo compré aquí. Nació en Alba y se llama Mimo.');
  T('celes.egg.r', 'Mimo! What a good name.', '¡Mimo! Qué buen nombre.');
  // the wants (es); the other languages add theirs
  const w = (k, l, o) => { (W[k] = W[k] || {})[l] = o; };
  w('ticket.buy', 'es', { lemmas: ['boleto', 'billete', 'pasaje'] }); w('ticket.ret', 'es', { lemmas: ['vuelta', 'regreso', 'regresar', 'volver'] }); w('ticket.when', 'es', { lemmas: ['hora', 'salir', 'andén', 'próximo', 'cuándo', 'tren'] });
  w('conductor.tix', 'es', { lemmas: ['aquí', 'boleto', 'tener', 'claro', 'estar'] }); w('conductor.first', 'es', { lemmas: ['crecer', 'vivir', 'primero', 'primera', 'vez', 'amigo', 'amiga'] });
  w('ollie.trip', 'es', { lemmas: ['viaje', 'bien', 'largo', 'bonito', 'padre', 'genial', 'chido', 'cansado', 'tren'] });
  w('enroll.why', 'es', { lemmas: ['inscribir', 'inscribirse', 'inscripción', 'aceptar', 'admitir', 'matricular', 'facultad', 'estudiar'] }); w('enroll.docs', 'es', { lemmas: ['documento', 'necesitar', 'faltar', 'otro', 'algo', 'más'] });
  w('enroll.miss', 'es', { lemmas: ['dónde', 'hacer', 'poder', 'buscar', 'estar', 'pasar'] }); w('rocio.env', 'es', { lemmas: ['sobre', 'certificado', 'correo', 'llegar', 'carta', 'buscar'] });
  w('report.what', 'es', { lemmas: ['enviar', 'entregar', 'mandar', 'certificado', 'biblioteca', 'error', 'perder'] }); w('ivan.where', 'es', { lemmas: ['encontrar', 'cafetería', 'mesa', 'hallar'] });
  w('tutor.how', 'es', { lemmas: ['primero', 'luego', 'después', 'final', 'micrófono', 'aplaudir', 'medir', 'eco'] });
  w('kettle.what', 'es', { lemmas: ['funcionar', 'dejar', 'recibo', 'tetera', 'día', 'comprar'] }); w('kettle.insist', 'es', { lemmas: ['garantía', 'cambiar', 'devolver', 'dinero', 'recibo', 'mes'] });
  w('kettle.pref', 'es', { lemmas: ['preferir', 'otro', 'otra', 'tetera', 'durar', 'bueno', 'buena'] });
  w('fish.p', 'es', { lemmas: ['fresco', 'oler', 'comprar', 'mañana', 'pescado', 'querer', 'decir'] }); w('fish.m', 'es', { lemmas: ['cambiar', 'refrigerador', 'calor', 'guardar', 'decir', 'nevera'] });
  w('scale.kilo', 'es', { lemmas: ['báscula', 'kilo', 'pesar', 'menos', 'faltar', 'pedir'] }); w('celes.egg', 'es', { lemmas: ['comprar', 'huevo', 'nacer', 'llamar', 'Mimo', 'Alba'] });

  // ------------------------------------------------------------ the structures a turn needs (need: […]) and their tips
  const NEED = {
    passive: { es: /\b(fue|fueron|ha sido|han sido|habia sido|había sido|será|sera)\s+\w+(ado|ido|ada|ida|ados|idos|adas|idas|to|ta|cho|cha|so|sa)\b|\bse\s+(envi|entreg|mand|perdi|encontr|recibi|hall|dej|llev|pus|mand)\w*/i },
    seq: { es: /\b(primero|luego|después|despues|al final|por último|por ultimo|finalmente|entonces)\b/i },
    cond: { es: /\b(podría|podria|quisiera|querría|querria|le importaría|le importaria|sería|seria|me gustaría|me gustaria|tendría|tendria)\b/i },
    report: { es: /\b(dice que|dijo que|quiere decir|lo que (ella|él|el|la señora|el señor|mi papá|mi papa) (quiere decir|dice)|o sea|según (ella|él|el))\b/i },
  };
  const NEED_TIP = {
    passive: { es: 'Say it in the passive: «El certificado fue enviado…», «fue encontrado…» (ser + participle), or «se envió…».' },
    seq: { es: 'Put the steps in order with «primero…, luego…, al final…».' },
    cond: { es: 'Soften it with the conditional: «¿Podría…?», «Quisiera…», «¿Le importaría…?».' },
    report: { es: 'Report it: «Dice que…», «Lo que quiere decir es que…».' },
  };
  NEED_TIP.passive.en = NEED_TIP.passive.es;

  // ------------------------------------------------------------ English that names the city's things in the save's language
  // The quest panel, your thoughts and the family's lines are English, but they name what's around you in the language you're
  // playing in, through slots: {street} {home} {pet} (places), {centro} {uni} {puerto} (the stops), {din} {dins} {Dins} (the noise's
  // creatures), {meg} {preg} (its bosses), a person ({ramon}, {mari}, {ivan}…), and QV's words: the register's {usted} / {tu}, the
  // phrases the family knows ({hola}, {gracias}, {cuanto}), Ollie's nickname {oli}, the language's name {langName}, the structures'
  // examples ({passiveEx}, {foundEx}, {seqEx}, {askEx}); {L:key} is a line of the language. Other slots ({mimo}, {w.…}) stay as they
  // are, for the weave. zh / ja come out in the player's script (characters or romanization).
  const QV = { es: { usted: 'usted', tu: 'tú', langName: 'Spanish', hola: 'hola', gracias: 'gracias', cuanto: '¿Cuánto cuesta?', oli: 'Oli',
    passiveEx: '«fue enviado…», «fue entregado…»', foundEx: '«Fue encontrado en…»', seqEx: 'first…, then…, finally…, with «se»', askEx: '«¿Puedes…?», «Necesito que…»',
    condEx: '«¿podría…?»', meansEx: '«Lo que ella quiere decir es que…»' } };
  // per-language English where a slot can't say it (EN[key][lang])
  const ENL = {};
  // ------------------------------------------------------------ merging a language in
  function add(lang, P = {}) {
    if (P.QV) QV[lang] = Object.assign({}, QV[lang] || {}, P.QV);
    for (const [k, v] of Object.entries(P.EN || {})) (ENL[k] = ENL[k] || {})[lang] = v;
    for (const [k, v] of Object.entries(P.L || {})) (L[k] = L[k] || {})[lang] = v;
    for (const [k, v] of Object.entries(P.NAMES || {})) (NAMES[k] = NAMES[k] || {})[lang] = v;
    for (const [k, v] of Object.entries(P.STOPS || {})) (STOPS[k] = STOPS[k] || {})[lang] = v;
    for (const [k, v] of Object.entries(P.CAST || {})) { const c = CAST[k] = CAST[k] || { name: {} }; c.name[lang] = v; }
    for (const [k, v] of Object.entries(P.W || {})) (W[k] = W[k] || {})[lang] = v;
    for (const [k, v] of Object.entries(P.NEED || {})) NEED[k][lang] = v;
    for (const [k, v] of Object.entries(P.NEED_TIP || {})) NEED_TIP[k][lang] = v;
    for (const [k, v] of Object.entries(P.SIGNS || {})) (SIGNS[k] = SIGNS[k] || {})[lang] = v;
    // (a card: its text, or { text, tag })
    if (P.CARDS) for (const [k, v] of Object.entries(P.CARDS)) { const c = CARDS[k] = CARDS[k] || {}; if (v && typeof v === 'object') { c[lang] = v.text; if (v.tag) (c.tag = c.tag || {})[lang] = v.tag; } else c[lang] = v; }
    if (P.din) DIN_WORDS[lang] = P.din;
    if (P.TALKPTS) TALKPTS[lang] = P.TALKPTS;
    if (P.LORE) LORE[lang] = P.LORE;
  }
  // the noise creatures' bestiary lore, per language (es is mer_noise.js's own): LORE[lang] = { din, din_meg, din_preg }
  const LORE = {};
  // ------------------------------------------------------------ the boards you can read (Read: the language, EN on request)
  const SIGNS = {
    station: { en: 'Barrio del Faro · Station', es: 'Estación · Barrio del Faro' },
    tram: { en: 'Tram · Line 2 · Barrio del Faro ⇄ Ciudad Universitaria ⇄ Mercado del Puerto', es: 'Tranvía · Línea 2 · Barrio del Faro ⇄ Ciudad Universitaria ⇄ Mercado del Puerto' },
    street: { en: 'Calle del Faro', es: 'Calle del Faro' },
    pet: { en: 'The Aviary · Birds and pets since 1961', es: 'La Pajarera · Aves y mascotas desde 1961' },
    bakery: { en: 'The Sunflower Bakery · Fresh bread', es: 'Panadería El Girasol · Pan recién horneado' },
    shop: { en: 'Doña Cuca’s Store · Open until 10', es: 'Abarrotes Doña Cuca · Abierto hasta las 10' },
    laundry: { en: 'The Bubble Laundromat · Self-service', es: 'Lavandería La Burbuja · Autoservicio' },
    home: { en: 'Calle del Faro 12', es: 'Calle del Faro 12' },
    uni: { en: 'University of Meridiana · Faculty of Science', es: 'Universidad de Meridiana · Facultad de Ciencias' },
    office: { en: 'Student Services · Windows 1–4 · Take a number', es: 'Servicios Escolares · Ventanillas 1–4 · Tome su turno' },
    library: { en: 'Central Library · Silence, please', es: 'Biblioteca Central · Silencio, por favor' },
    lab: { en: 'Science Building · Laboratories', es: 'Edificio de Ciencias · Laboratorios' },
    theater: { en: 'Open-Air Theater · Welcome lecture today, 12:00', es: 'Teatro al Aire Libre · Hoy, 12:00: clase de bienvenida' },
    cafe: { en: 'The Test Tube Café', es: 'Cafetería La Probeta' },
    notice: { en: 'Notices: Choir auditions Thursday at 5 · Lost: a green lab notebook (ask Iván, 1st year) · Room for rent near campus, students only', es: 'Avisos: Audiciones del coro el jueves a las 5 · Se perdió un cuaderno verde de laboratorio (preguntar por Iván, primer año) · Se renta cuarto cerca del campus, solo estudiantes' },
    market: { en: 'Harbor Market · Fish · Fruit · Household goods', es: 'Mercado del Puerto · Pescados · Frutas · Artículos del hogar' },
    ramon: { en: 'Ramón’s Appliances · Repairs · Guarantee 30 days', es: 'Aparatos Don Ramón · Reparaciones · Garantía 30 días' },
    fish: { en: 'Mari’s Fish · Caught today', es: 'Pescados Doña Mari · Del día' },
    fruit: { en: 'Lupita’s Fruit · Mangoes, papayas, tomatoes', es: 'Frutas Lupita · Mango, papaya, jitomate' },
    port: { en: 'Port Office · Opening hours 8–15', es: 'Capitanía del Puerto · Horario 8 a 15' },
  };
  const CARDS = {
    letter: { tag: { en: 'University of Meridiana · Student Services', es: 'Universidad de Meridiana · Servicios Escolares' },
      en: 'Dear Noa: We are pleased to inform you that you have been admitted to the Faculty of Science. Enrollment takes place in person at Student Services: please bring this letter and an ID. This letter includes two paid train tickets: one for the student and one for a companion.',
      es: 'Estimada Noa: Nos complace informarle que ha sido admitida en la Facultad de Ciencias. La inscripción se realiza en persona en Servicios Escolares: le rogamos traer esta carta y una identificación. Esta carta incluye dos pasajes de tren pagados: uno para la estudiante y otro para un acompañante.' },
    envelope: { tag: { en: 'An envelope', es: 'Un sobre' }, en: 'To: Student Services · Re: Noa’s school transcript · Sent: Monday, by the School of Alba · Delivered: the library (by mistake)', es: 'Para: Servicios Escolares · Asunto: certificado de estudios de Noa · Enviado: lunes, por la Escuela de Alba · Entregado: biblioteca (por error)' },
    turnTicket: { tag: { en: 'Take a number', es: 'Tome su turno' }, en: 'Student Services · Enrollment · Your number: A-42 · Please wait until your number is called.', es: 'Servicios Escolares · Inscripciones · Su turno: A-42 · Espere a que lo llamen.' },
    talk: { tag: { en: 'Noa’s welcome talk', es: 'La presentación de Noa' }, en: 'Introduce Noa to everyone, in three or four sentences: who she is, where she comes from, what she’ll study and why, and one thing you ask of them.', es: '' },
  };
  // the short talk (four points, each a TALK want; graded like a writing task)
  const TALKPTS = { es: [{ want: { lemmas: ['presentar', 'llamar', 'Noa', 'amiga'] }, en: 'who she is' }, { want: { lemmas: ['venir', 'Alba', 'valle', 'pueblo', 'ser'] }, en: 'where she’s from' },
    { want: { lemmas: ['estudiar', 'ciencia', 'ciencias', 'querer', 'entender'] }, en: 'what she’ll study (and why)' }, { want: { lemmas: ['escuchar', 'pedir', 'esperar', 'ojalá', 'ayudar', 'bienvenido', 'bienvenida'] }, en: 'what you ask of them' }] };
  T('talk.model', 'Let me introduce Noa. She comes from Alba, a village in the valley. She’s going to study science because she wants to understand how the world works. I ask you one thing: listen to her, because she has a lot to say.',
    'Les presento a Noa. Viene de Alba, un pueblo del valle. Va a estudiar ciencias porque quiere entender cómo funciona el mundo. Les pido una cosa: escúchenla, porque tiene mucho que decir.');
  T('talk.frame', 'Let me introduce ___. She comes from ___. She’s going to study ___ because ___. I ask you ___.', 'Les presento a ___. Viene de ___. Va a estudiar ___ porque ___. Les pido ___.');
  // the noise creatures in battle (battle/lang.js species shape), per language. en: the plain English gloss (the meet lesson's «Look! A
  // megaphone.»); name: the boss's own name
  const DIN_WORDS = { es: { din: { w: 'bullicio', pl: 'bullicios', g: 'm', en: 'noise-maker' }, din_meg: { w: 'megáfono', pl: 'megáfonos', g: 'm', en: 'megaphone', name: 'el Megáfono' }, din_preg: { w: 'pregón', pl: 'pregones', g: 'm', en: 'market cry', name: 'el Gran Pregón' } } };

  // ------------------------------------------------------------ reading it out
  const isCl = l => l === 'zh' || l === 'ja';
  const line = (k, l) => { const x = L[k]; if (!x) return { t: '', en: '' }; return { t: x[l] != null ? x[l] : '', en: q(x.en || '', l) }; };
  const pick = (T0, l) => (T0 ? (T0[l] != null ? T0[l] : T0.en || T0.es || '') : '');
  const name = (k, l) => { const c = CAST[k]; return c ? pick(c.name, l) : k; };
  const shown = (s, l) => { try { return isCl(l) && typeof CJK !== 'undefined' && /\[[^\]|]+\|[^\]]+\]/.test(String(s)) ? CJK.plain(String(s), { lang: l }) : String(s); } catch (e) { return String(s); } };
  const cap = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  function q(s, l) {
    if (!s || String(s).indexOf('{') < 0) return s;
    const V = Object.assign({}, QV.es, QV[l] || {}), D = DIN_WORDS[l] || DIN_WORDS.es;
    return String(s).replace(/\{([A-Za-z]+(?::[A-Za-z0-9.]+)?)\}/g, (all, k) => {
      let v = null;
      if (k.startsWith('L:')) { const x = L[k.slice(2)]; v = x ? (x[l] != null && x[l] !== '' ? x[l] : x.en) : null; }
      else if (k === 'din' || k === 'dins' || k === 'Dins') { const d = D.din || {}; v = k === 'din' ? d.w : isCl(l) ? d.w : d.pl || d.w; if (k === 'Dins') v = cap(shown(v, l)); }
      else if (k === 'meg' || k === 'preg' || k === 'street' || k === 'home' || k === 'pet' || k === 'city') v = pick(NAMES[k], l);
      else if (STOPS[k] && k !== 'casa') v = pick(STOPS[k], l);
      else if (CAST[k] && CAST[k].name) v = name(k, l);
      else if (V[k] != null) v = V[k];
      return v == null ? all : shown(v, l);
    });
  }
  // a line's English for this save (whole-English lines: the family, your thoughts), its slots filled in
  const en = (k, l) => { const x = L[k]; if (!x) return k; return q((ENL[k] && ENL[k][l]) || x.en || '', l); };
  // a TALK scene in a language: the turns' lines, wants and the register check (+ the structures a turn needs)
  function scene(id, lang, o = {}) {
    const D = SC[id]; if (!D) return null;
    const ln = k => { const x = line(k, lang); return x.t || x.en ? [x.t, x.en] : null; };
    const reg = o.reg || D.reg;
    return { id: 'mer.' + id, band: D.band || 3, who: null,
      turns: D.turns.filter(tn => !o.only || o.only.includes(tn.id)).map(tn => {
        const b = `${id}.${tn.id}`;
        return { id: tn.id, ask: ln(b + '.a'), goal: q(tn.goal, lang), want: (W[b] || {})[lang] || { any: true }, starter: ln(b + '.s'), example: ln(b + '.e'), model: ln(b + '.m'),
          react: (tn.react || [{ k: 'r' }]).map(r => Object.assign({ say: ln(`${b}.${r.k}`) }, r.if ? { if: r.if } : {})),
          tips: Object.fromEntries((tn.need || []).map(n => [n, (NEED_TIP[n] || {})[lang] || (NEED_TIP[n] || {}).es || ''])),
          check(r) { needCheck(r, tn.need || [], lang); if (reg && typeof REG !== 'undefined') REG.apply(r, reg, lang); } };
      }) };
  }
  // a structure the turn needs (the passive, the steps in order, the softening conditional, reported speech): missing, it's a real mistake
  function needCheck(r, needs, lang) {
    if (!r || !r.understood || !needs.length) return;
    for (const n of needs) {
      const re = (NEED[n] || {})[lang]; if (!re) continue;
      const txt = isCl(lang) && typeof CJK !== 'undefined' ? String(r.text) + ' ' + CJK.canon(String(r.text), lang) : String(r.text);
      if (re.test(txt)) continue;
      const tip = (NEED_TIP[n] || {})[lang] || (NEED_TIP[n] || {}).es || '';
      (r.errors = r.errors || []).push({ code: 'need.' + n, sev: 'major', at: null, fix: '', tip, want: true });
      r.major = (r.major || 0) + 1; r.met = false; r.missing = (r.missing || []).concat('need.' + n);
      r.grade = 'SABCD'[Math.max('SABCD'.indexOf(r.grade || 'S'), r.major >= 2 ? 3 : 2)];
      r.tips = [...new Set((r.tips || []).concat(tip))];
    }
  }
  // tests(lang): every TALK turn's model (both scripts in zh / ja) reads A or better, with its register and its structure checked like a
  // turn in play; and a wrong-register twin is caught (casual to an official: a real mistake; formal to your brother: a note)
  const TWINS = {
    es: [['ticket.buy', '¿Me puedes dar dos boletos para Meridiana, por favor?'], ['enroll.docs', 'Aquí tienes. ¿Necesitas algo más?'], ['kettle.insist', 'Oye, ¿me la cambias o me devuelves el dinero?'], ['ollie.trip', 'Muy bien, gracias. ¿Y usted cómo está?']],
    pt: [['ticket.buy', 'Tu me dá duas passagens pra Meridiana?'], ['enroll.docs', 'Tá aqui, mano. Tu precisa de mais alguma coisa?'], ['kettle.insist', 'Valeu, cara, mas tu troca a chaleira?'], ['ollie.trip', 'Foi ótima. E o senhor, como está?']],
    de: [['ticket.buy', 'Kannst du mir zwei Fahrkarten nach Meridiana geben?'], ['enroll.docs', 'Hier, bitte. Brauchst du noch etwas?'], ['kettle.insist', 'Hey, tauschst du den Wasserkocher um?'], ['ollie.trip', 'Gut, danke. Und wie geht es Ihnen?']],
    zh: [['ticket.buy', '[你|nǐ] [给|gěi] [我|wǒ] [两|liǎng] [张|zhāng] [票|piào] 。'], ['enroll.docs', '[给|gěi] [你|nǐ] 。 [你|nǐ] [还|hái] [要|yào] [什么|shén me] ？'], ['kettle.insist', '[你|nǐ] [换|huàn] [一个|yí gè] [吧|ba] 。'], ['ollie.trip', '[您好|nín hǎo] ， [您|nín] [最近|zuì jìn] [怎么样|zěn me yàng] ？']],
    ja: [['ticket.buy', 'メリディアナ まで の [切符|きっぷ] 、 [二枚|にまい] ちょうだい 。'], ['enroll.docs', 'はい 、 これ 。 [他|ほか] に なんか いる ？'], ['kettle.insist', 'ねえ 、 これ [交換|こうかん] して くれる ？'], ['ollie.trip', 'とても [楽|たの]しかった です 。 [元気|げんき] でした か 。']],
  };
  function tests(l) {
    const out = { pass: 0, fail: 0, fails: [] }, cj = isCl(l) && typeof CJK !== 'undefined';
    if (typeof TALK === 'undefined' || !TALK.judge) return Object.assign(out, { fail: 1, fails: ['no TALK'] });
    const was = typeof LEX !== 'undefined' ? LEX.lang : null;
    try {
      if (typeof LEX !== 'undefined') LEX.lang = l;
      for (const id of Object.keys(SC)) {
        const sc = scene(id, l); if (!sc) continue;
        for (const tn of sc.turns) {
          const m = tn.model && tn.model[0]; if (!m) { out.fail++; out.fails.push(`${l} ${id}.${tn.id}: no model`); continue; }
          for (const form of cj ? ['chars', 'roman'] : ['plain']) {
            const txt = form === 'roman' ? CJK.roman(m, { lang: l }) : cj ? CJK.chars(m, { lang: l }) : m;
            let r = null; try { r = TALK.judge(txt, tn.want, { lang: l }); tn.check(r); } catch (e) { r = { grade: 'ERR ' + e.message, tips: [] }; }
            if (r && r.understood && 'SA'.includes(r.grade)) out.pass++;
            else { out.fail++; out.fails.push(`${l} ${id}.${tn.id} model (${form}) → ${r && r.grade}${r && !r.understood ? ' (not understood)' : ''}: ${(r && r.tips || []).slice(0, 2).join(' / ')} «${txt}»`); }
          }
        }
      }
      for (const [key, t] of TWINS[l] || []) {
        const [id] = key.split('.'), want = (SC[id] || {}).reg;
        for (const form of cj ? ['chars', 'roman'] : ['plain']) {
          const txt = form === 'roman' ? CJK.roman(t, { lang: l }) : cj ? CJK.chars(t, { lang: l }) : t, g = REG.grade(txt, want, l), ok = want === 'formal' ? g.sev === 'major' || g.sev === 'minor' : g.sev === 'minor';
          if (ok) out.pass++; else { out.fail++; out.fails.push(`${l} twin ${key} (${want}, ${form}) not caught: read ${g.read.reg} «${txt}»`); }
        }
      }
    } finally { if (typeof LEX !== 'undefined' && was) LEX.lang = was; }
    return out;
  }
  // check(): every line and task has its language, zh / ja pass CJK.validate
  function check(langs = LANGS) {
    const out = [];
    for (const l of langs) {
      const skip = k => L[k].es === undefined;       // (whole-English lines: the family, your thoughts)
      for (const [k, v] of Object.entries(L)) { if (skip(k) || v[l] !== undefined) continue; out.push(`${l}: line ${k}`); }
      for (const [k, v] of Object.entries(L)) if (isCl(l) && v[l] && typeof CJK !== 'undefined') for (const p of CJK.validate(v[l], l)) out.push(`${l}: ${k}: ${p}`);
      for (const id of Object.keys(SC)) for (const tn of SC[id].turns) if (!(W[`${id}.${tn.id}`] || {})[l]) out.push(`${l}: want ${id}.${tn.id}`);
      for (const k of Object.keys(SIGNS)) if (SIGNS[k][l] === undefined) out.push(`${l}: sign ${k}`);
      for (const k of Object.keys(STOPS)) if (STOPS[k][l] === undefined) out.push(`${l}: stop ${k}`);
      for (const k of Object.keys(CAST)) if (!['mom', 'dad', 'ollie'].includes(k) && CAST[k].name[l] === undefined) out.push(`${l}: name ${k}`);
      for (const n of Object.keys(NEED)) if (!NEED[n][l]) out.push(`${l}: need ${n}`);
      if (!TALKPTS[l]) out.push(`${l}: talk points`);
      if (!DIN_WORDS[l]) out.push(`${l}: noise creatures' words`);
      if (l !== 'es' && !LORE[l]) out.push(`${l}: the noise's lore`);
      if (l !== 'es') for (const k of Object.keys(QV.es)) if (!(QV[l] || {})[k]) out.push(`${l}: slot word ${k}`);
      for (const k of ['street', 'home', 'pet', 'meg', 'preg']) if (NAMES[k][l] === undefined) out.push(`${l}: name ${k}`);
      if (isCl(l) && typeof CJK !== 'undefined') {
        const more = [...Object.values(SIGNS).map(s => s[l]), ...Object.values(CARDS).flatMap(c => [c[l], c.tag && c.tag[l]]), ...Object.values(NAMES).map(n => n[l]), ...Object.values(STOPS).map(s => s[l]),
          ...Object.values(CAST).map(c => c.name[l]), ...Object.values(DIN_WORDS[l] || {}).flatMap(d => [d.w, d.pl, d.name]), ...Object.values(LORE[l] || {})].filter(x => typeof x === 'string' && x);
        for (const s of more) for (const p of CJK.validate(s, l)) out.push(`${l}: «${s.slice(0, 30)}»: ${p}`);
        // (the slot words are English with the language's words in it: each bracketed word on its own)
        for (const s of Object.values(QV[l] || {})) for (const m of String(s).match(/\[[^\]|]+\|[^\]]+\]/g) || []) for (const p of CJK.validate(m, l)) out.push(`${l}: slot «${m}»: ${p}`);
      }
      for (const k of ['letter', 'envelope', 'turnTicket']) if (!CARDS[k][l]) out.push(`${l}: card ${k}`);
    }
    return out;
  }
  return { L, W, SC, NAMES, STOPS, CAST, SIGNS, CARDS, NEED, NEED_TIP, TALKPTS, DIN_WORDS, RIDE, LANGS, QV, ENL, LORE, TWINS, add, line, pick, name, scene, needCheck, check, tests, q, en };
})();
