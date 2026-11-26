'use strict';
// Kauã's later chapters (Portuguese games only; game/SIDES.md; 2026-11-13). phonk.js runs his first three chapters, his
// menu and his voice; this file plugs in with PHONK.use(BAILE's hooks) and talks through PHONK.api. Progress lives in
// state.phonk with the rest of his story (c4s / ask / verses / vg / c4, c5s / c5 / mic / micOff).
//
//   4. «Rimas da quebrada» (after the second bell). Kauã wants to throw a baile at the pond for the whole neighborhood, with
//      a new beat (not his headphone phonk: a funk carioca tamborzão, "so even Vó Dita dances") and a «crônica» of Alba's
//      people for its lyrics. His crew's slang first (a lesson: «Pega a visão», «Demorou!», «Fechou!», «Na moral»,
//      «quebrada»). Then you go and ask four neighbors about themselves, typed: Vó Dita and Dona Rosa politely, with «a
//      senhora»; Malu and Marta with «você». Back at the pond, the rhyme notebook: he raps a line about each of them and you
//      write the next one. It has to rhyme, fit the beat (its syllables, counted as you type) and say something about them.
//      Then «Rap de Alba» plays with your lines in it. «É nóis!»
//   5. «O Baile da Lagoa» (after the third bell). The neighbors come to the pond and you run the mixing desk: each request
//      (too quiet; Malu wants her drums; the bass is too much for Vó; Nico wants the ducks; Marta misses the brass) is a
//      typed command, and the beat changes as you say it. Then the baile: you're the MC («Alba, cadê você?», «Bota a mão pro
//      alto!», «Faz barulho!») until the Hush rolls in over the pond and the music fades to gray. Your own verses wake each
//      neighbor up again, and the crowd's «Alba não se cala!» drives it off. Mimo gets a microphone (a cosmetic held at its
//      side, so it never clashes with the headphones), and the string lights stay up over the pond.
// 14 phrases (ph.br_*, region 'Brasil'), a key item (k.rhymes: his rhyme notebook), coins. Song: 'pt_baile'.
// For the baile it borrows Vó Dita (FAMILIA.lend), Malu and the awake Vô Tião (CARNAVAL.lend), and moves Rosa, Marta,
// Bruno and Nico (G.sim.npc), putting everyone back afterwards.
// Needs THREE, core.js, audio.js, zhfolk.js (ZHF), carnaval_ui.js (CVUI) and phonk.js (PHONK) at load.

const BAILE = (() => {
  let G = null;
  const P = () => PHONK.api;
  const isPT = () => !!(G && G.state && G.state.lang === 'pt');
  const indoors = () => !!(G && G.indoors && G.indoors());
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const MIMO = () => (G && G.state && G.state.mimoName) || 'Mimo';
  const esc = s => CVUI.esc(s), N = s => CVUI.N(s), has = (t, l) => CVUI.has(t, l);
  const snd = k => { try { Sound.play(k); } catch (e) { /* no audio */ } };
  const wait = s => ZHF.wait(s);
  const flags = () => (G && G.state && G.state.flags) || {};
  function S() { const p = P().S(); p.ask = p.ask || {}; p.verses = p.verses || {}; p.vg = p.vg || {}; return p; }
  const yawTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z);
  const BPM = 150;

  // ================================================================ where things are: the baile on the meadow east of the pond, Kauã's
  // crate (16.6, −180.2) at its west end, facing the crowd
  const FLOOR = { x: 21.2, z: -179.6 };
  const SPOT = {
    you: { x: 21.4, z: -179.4 },
    vo: { x: 19.7, z: -183.3 }, malu: { x: 18.8, z: -176.9 }, tiao: { x: 17.7, z: -176.2 },
    rosa: { x: 22.5, z: -182.7 }, baker: { x: 23.9, z: -179.0 }, bruno: { x: 23.3, z: -176.6 }, kid: { x: 20.9, z: -176.2 },
    speaker: { x: 17.2, z: -182.7 }, table: { x: 21.4, z: -185.0 },
    poles: [[18.6, -174.6], [24.7, -175.2], [24.5, -185.6], [18.2, -185.8]],
    crowd: [[20.2, -181.2], [22.8, -180.9], [22.6, -177.9], [19.6, -177.2], [23.4, -183.4], [24.1, -177.4]],
    cam: [[26.4, 4.5, -177.2], [18.6, 1.15, -180.4]],
  };

  // ================================================================ phrases (the journal's Phrasebook), icons
  const PH = (id, pt, en, note, register, alt) => ({ id: 'ph.br_' + id, kind: 'phrase', pt, en, note, region: 'Brasil', register, icon: 'ph_slang', alt: alt ? { pt: alt } : undefined });
  const PHRASES = [
    PH('pegaavisao', 'Pega a visão.', 'Get this / Take note.', 'São Paulo slang to start something important: «Pega a visão: …». «Pegou a visão?» = got it?', 'slang', ['pega a visao', 'pegou a visao', 'pega visao']),
    PH('demorou', 'Demorou!', 'Sure! / Let’s do it!', 'Literally “it took long”, but it’s a happy yes: «Bora? — Demorou!»', 'slang', ['demoro', 'demorou mano']),
    PH('fechou', 'Fechou!', 'Deal! / Done!', 'Literally “it closed”: the plan is settled. «Sábado na lagoa? — Fechou!»', 'slang', ['fechado', 'ta fechado', 'fechou mano']),
    PH('namoral', 'Na moral.', 'Honestly / For real.', '«Na moral, ficou lindo» = honestly, it’s beautiful. «Na moral, me ajuda?» = seriously, help me out?', 'slang', ['na moral mano']),
    PH('quebrada', 'a quebrada', 'the hood, the neighborhood', 'São Paulo slang for your own neighborhood, said with love: «a minha quebrada».', 'slang', ['quebrada', 'minha quebrada']),
    PH('enois', 'É nóis!', 'That’s us! / We’ve got this!', 'São Paulo slang, spelled the way it’s said («nós» = we): pride, teamwork, or a thank-you between friends.', 'slang', ['é nós', 'e nois', 'e nos', 'é noix', 'enois']),
    PH('senhora', 'a senhora', 'you (to an older woman: “ma’am”)', 'With older people, Brazilians say «o senhor» (to a man) and «a senhora» (to a woman) instead of «você»: «A senhora gosta de música?»', 'polite', ['o senhor']),
    PH('role', 'rolê', 'an outing, hanging out', '«Bora dar um rolê?» = want to go hang out / take a walk?', 'slang', ['role', 'dar um role', 'um role']),
    PH('maoproalto', 'Bota a mão pro alto!', 'Hands up!', 'The MC’s call («pro» = «para o»). Also just «Mão pro alto!»', 'casual', ['mao pro alto', 'maos pro alto', 'bota a mao pra cima', 'mao pra cima', 'levanta a mao']),
    PH('fazbarulho', 'Faz barulho!', 'Make some noise!', 'To a crowd: «Faz barulho, Alba!» (to many people, also «Façam barulho!»)', 'casual', ['facam barulho', 'faz barulho ai']),
    PH('cadevoce', 'Cadê você?', 'Where are you?', '«Cadê» = where is / where are (everyday Brazilian): «Cadê o Mimo?» MCs shout «Cadê a galera?»', 'casual', ['cade voce', 'cade vc', 'cade a galera']),
    PH('aumenta', 'Aumenta o som!', 'Turn it up!', '«Aumentar» = to raise. Also «Aumenta o volume!»', 'casual', ['aumenta o volume', 'aumenta ai']),
    PH('abaixa', 'Abaixa o som!', 'Turn it down!', '«Abaixar» = to lower. «Abaixa o grave» = turn the bass down.', 'casual', ['abaixa o volume', 'diminui o som', 'diminui o volume']),
    PH('todomundo', 'Todo mundo junto!', 'Everybody together!', '«Todo mundo» = everybody, with a singular verb: «Todo mundo dança!»', 'casual', ['todos juntos']),
  ];
  const KEY = { id: 'k.rhymes', kind: 'key', es: 'cuaderno de rimas', pt: 'caderno de rimas', de: 'Reimheft', en: 'Kauã’s rhyme notebook', g: { es: 'm', pt: 'm', de: 'n' }, icon: 'bl_book' };
  if (typeof LEX !== 'undefined') LEX.register(PHRASES.concat([KEY]).filter(w => !LEX.item(w.id)));
  const PIDS = PHRASES.map(p => p.id);
  if (typeof ICONS !== 'undefined' && ICONS.add) {
    const add = (k, fn) => { if (!ICONS.keys.includes(k)) ICONS.add(k, fn); };
    add('bl_mic', (c, p, h) => {             // a handheld microphone: dark handle, silver grille, a green ring
      h.shape(c, p, h.poly([[-9, -4], [9, -4], [6, 36], [-6, 36]]), '#2b2235');
      h.shape(c, p, h.rr(-12, -10, 24, 9, 3), '#4cff8a');
      h.shape(c, p, h.ell(0, -24, 19, 18), '#c9ced8');
      if (p) { c.strokeStyle = 'rgba(43,34,53,.45)'; c.lineWidth = 1.5; for (let i = -12; i <= 12; i += 6) { c.beginPath(); c.moveTo(i, -40); c.lineTo(i, -8); c.stroke(); } h.dot(c, -6, -31, 4, 'rgba(255,255,255,.75)'); }
    });
    add('bl_book', (c, p, h) => {            // the rhyme notebook: a spiral notebook, lines, a pencil
      h.shape(c, p, h.rr(-30, -34, 58, 68, 6), '#ffd23f'); h.shape(c, p, h.rr(-22, -28, 46, 56, 3), '#fffaf0');
      if (p) { c.strokeStyle = '#7fb3e6'; c.lineWidth = 2; for (let y = -16; y <= 20; y += 9) { c.beginPath(); c.moveTo(-18, y); c.lineTo(20, y); c.stroke(); } for (let y = -28; y <= 26; y += 9) h.dot(c, -30, y, 3.4, h.INK); }
      h.shape(c, p, h.poly([[18, 30], [36, -10], [42, -6], [24, 34], [16, 38]]), '#ff7a59');
    });
  }

  // ================================================================ lines (lines.js's format: pt [simpler, richer], en; through PHONK's
  // voice for Kauã, and our own for the neighbors). Never the player's gender.
  const LT = {
    // ---- chapter 4
    'bl.c4.hi': { pt: ['Pega a visão: eu tive uma ideia!', 'Pega a visão: eu tive uma ideia mó grande, véi!'], en: ['«Pega a visão» (get this): I had an idea!', '«Pega a visão» (get this): I had a «mó» (super) big idea, «véi» (dude)!'] },
    'bl.c4.baile': {
      pt: ['Um baile! Aqui na lagoa, pra Alba inteira!', 'Um baile! Aqui na lagoa, pra quebrada inteira: a Vó Dita, a Malu, a Dona Rosa, todo mundo dançando junto!'],
      en: ['A «baile» (a dance party)! Right here at the pond, for all of Alba!', 'A «baile» (a dance party)! Right here at the pond, for the whole «quebrada» (neighborhood): Vó Dita, Malu, Dona Rosa, everyone dancing together!'] },
    'bl.c4.notphonk': {
      pt: ['Mas phonk é o meu som de fone. Pro baile, tem que ser tamborzão!', 'Mas phonk é o meu som de fone, sozinho. Pro baile tem que ser funk carioca das antigas: tamborzão! Até a Vó Dita dança.'],
      en: ['But phonk is my headphones sound. For a baile, it’s got to be «tamborzão»!', 'But phonk is my alone-with-headphones sound. A baile needs old-school Rio funk: «tamborzão» (the big-drum beat)! Even Vó Dita dances to it.'] },
    'bl.c4.listen': {
      pt: ['Escuta o beat novo: tum-tum… pá!', 'Escuta só o beat novo: o tambor grave, tum-tum… e as palmas, pá! Sente o tamborzão?'],
      en: ['Listen to the new beat: «tum-tum… pá!»', 'Just listen to the new beat: the deep drum, «tum-tum»… and the claps, «pá!» Feel the «tamborzão»?'] },
    'bl.c4.lyrics': {
      pt: ['A letra vai ser sobre a nossa gente: a Vó Dita, a Malu, a Marta e a Dona Rosa.', 'E a letra vai ser uma crônica da quebrada: a Vó Dita, a Malu, a Marta da padaria e a Dona Rosa. Cê conversa com eles, e depois a gente escreve as rimas.'],
      en: ['The lyrics will be about our people: Vó Dita, Malu, Marta and Dona Rosa.', 'And the lyrics will be a «crônica» (a portrait) of the «quebrada»: Vó Dita, Malu, Marta from the bakery and Dona Rosa. You go talk to them, and then we write the rhymes.'] },
    'bl.c4.respect': {
      pt: ['Com a Vó Dita e a Dona Rosa, é «a senhora», hein? Respeito!', 'Só uma coisa: com a Vó Dita e a Dona Rosa, é «a senhora», hein? Gíria é com a galera. Com os mais velhos, respeito!'],
      en: ['With Vó Dita and Dona Rosa it’s «a senhora» (ma’am), okay? Respect!', 'Just one thing: with Vó Dita and Dona Rosa, it’s «a senhora» (the polite “you”, ma’am), okay? Slang is for the crew. With elders, respect!'] },
    'bl.c4.go': { pt: ['Partiu? Eu fico aqui afiando o lápis.', 'Partiu? Eu fico aqui afiando o lápis e o beat.'], en: ['«Partiu?» (off you go?) I’ll stay here sharpening my pencil.', '«Partiu?» (off you go?) I’ll stay here sharpening my pencil and the beat.'] },
    'bl.c4.wait': { pt: ['Ainda falta conversar com {n}. Tô te esperando!', 'Ainda falta conversar com {n}. Na moral, sem pressa: eu tô aqui afiando o lápis.'], en: ['You still have to talk to {n}. I’m waiting!', 'You still have to talk to {n}. «Na moral» (honestly), no rush: I’m here sharpening my pencil.'] },
    'bl.c4.write': {
      pt: ['Agora a gente escreve! Eu faço um verso, e você faz o outro.', 'Agora sim: caderno na mão! Eu faço o primeiro verso, você faz o segundo. Tem que rimar, caber no beat e falar da pessoa.'],
      en: ['Now we write! I do one line, you do the next.', 'Now we’re talking: notebook in hand! I write the first line, you write the second. It has to rhyme, fit the beat and be about the person.'] },
    'bl.c4.done': { pt: ['Ficou brabo! Bora gravar?', 'Ficou brabo demais! Bora gravar? Microfone na mão!'], en: ['That’s «brabo» (killer)! Shall we record?', 'It came out «brabo demais» (way too good)! Shall we record? Mic in hand!'] },
    'bl.c4.rap': {
      pt: ['«Rap de Alba»! No Rio dos anos 90, muita música de funk se chamava «Rap do…» ou «Rap da…».', '«Rap de Alba»! Sabia? No Rio dos anos 90, muita música de funk se chamava «Rap do…» ou «Rap da…». É uma homenagem!'],
      en: ['«Rap de Alba»! In 90s Rio, lots of funk songs were called «Rap do…» or «Rap da…» (Rap of…).', '«Rap de Alba»! Did you know? In 90s Rio, lots of funk songs were called «Rap do…» or «Rap da…» (Rap of…). It’s a tribute!'] },
    'bl.c4.end': {
      pt: ['Valeu demais! Agora só falta o baile.', 'Valeu demais! Com essa letra, o baile vai ser histórico. Agora só falta a hora certa.'],
      en: ['Thanks a lot! Now all that’s missing is the baile.', 'Thanks a ton! With these lyrics, the baile is going to be legendary. Now we just need the right moment.'] },
    'bl.c4.later': {
      pt: ['Mas o Silêncio ainda tá forte. Quando mais um sino tocar, é baile!', 'Mas o Silêncio ainda tá forte demais pra uma festa. Quando mais um sino tocar, aí é baile, tá ligado?'],
      en: ['But the Hush is still strong. When one more bell rings, it’s baile time!', 'But the Hush is still too strong for a party. When one more bell rings, then it’s baile time, «tá ligado?» (you know?)'] },
    // the neighbors' answers
    'bl.vo.ans': {
      pt: ['Ai, eu amo! Quando eu era moça, eu dançava samba-rock no clube todo sábado!', 'Ai, meu bem, eu amo! Quando eu era moça, eu dançava samba-rock no clube todo sábado. Ninguém me segurava!'],
      en: ['Oh, I love it! When I was young, I danced samba-rock at the club every Saturday!', 'Oh, dear, I love it! When I was young, I danced samba-rock at the club every Saturday. Nobody could stop me!'] },
    'bl.vo.polite': { pt: ['Hihi, comigo é «a senhora», meu bem. Mas tudo bem!', 'Hihi! Comigo é «a senhora», meu bem… mas tudo bem, eu sei que a intenção foi boa.'], en: ['Hehe, with me it’s «a senhora» (ma’am), dear. But that’s all right!', 'Hehe! With me it’s «a senhora» (ma’am), dear… but that’s all right, I know you meant well.'] },
    'bl.vo.more': { pt: ['E manda um beijo pro Kauã! Ele cresceu ouvindo o meu rádio.', 'E manda um beijo pro Kauã! Esse menino cresceu ouvindo samba no meu rádio, sabia?'], en: ['And give Kauã a kiss from me! He grew up listening to my radio.', 'And give Kauã a kiss from me! That boy grew up listening to samba on my radio, did you know?'] },
    'bl.malu.ans': {
      pt: ['O tamborim! É pequenininho, mas faz um barulhão!', 'O tamborim! É pequenininho, mas faz um barulhão: tá-tá-tá-tá! E o surdo do Vô Tião é o coração do bloco.'],
      en: ['The tamborim! It’s tiny, but it makes a huge noise!', 'The tamborim! It’s teeny tiny, but it makes a huge racket: «tá-tá-tá-tá»! And Vô Tião’s surdo is the heart of the bloco.'] },
    'bl.malu.more': { pt: ['Você vai escrever uma música sobre mim? Que demais!', 'Você vai escrever uma música sobre mim? Que demais! Coloca que eu sou a chefe da bateria!'], en: ['You’re writing a song about me? That’s amazing!', 'You’re writing a song about me? That’s amazing! Put in that I’m the boss of the drum section!'] },
    'bl.marta.ans': {
      pt: ['Às quatro da manhã! O pão de queijo tem que sair quentinho.', 'Às quatro da manhã, todo dia! O forno não espera, e o pão de queijo tem que sair quentinho pra Alba.'],
      en: ['At four in the morning! The cheese bread has to come out warm.', 'At four in the morning, every day! The oven doesn’t wait, and the cheese bread has to come out warm for Alba.'] },
    'bl.marta.more': { pt: ['Um baile? Eu levo pão de queijo pra todo mundo!', 'Um baile na lagoa? Que coisa boa! Eu levo pão de queijo pra todo mundo.'], en: ['A baile? I’ll bring cheese bread for everyone!', 'A baile at the pond? How lovely! I’ll bring cheese bread for everyone.'] },
    'bl.rosa.ans': {
      pt: ['Desde menina! Eu conheço cada pedra desta cidade.', 'Desde menina! Eu conheço cada pedra desta cidade, e cada pessoa também. Alba é a minha casa.'],
      en: ['Since I was a girl! I know every stone in this town.', 'Since I was a girl! I know every stone in this town, and every person too. Alba is my home.'] },
    'bl.rosa.polite': { pt: ['Hm! «A senhora», por favor! Brincadeira… quase.', 'Hm! «A senhora», por favor! Brincadeira… quase. Os jovens de hoje!'], en: ['Hm! «A senhora» (ma’am), please! Just kidding… sort of.', 'Hm! «A senhora» (ma’am), please! Just kidding… sort of. Young people these days!'] },
    'bl.rosa.more': { pt: ['Um baile? Faz anos que eu não danço. Eu vou!', 'Um baile? Faz anos que eu não danço… Pode contar comigo!'], en: ['A baile? I haven’t danced in years. I’ll come!', 'A baile? I haven’t danced in years… You can count on me!'] },
    // ---- chapter 5
    'bl.c5.hi': { pt: ['Mais um sino tocou! Sabe o que isso quer dizer?', 'Cê ouviu? Mais um sino tocou! Sabe o que isso quer dizer, né?'], en: ['Another bell rang! You know what that means?', 'You hear that? Another bell rang! You know what that means, right?'] },
    'bl.c5.yes': {
      pt: ['É baile! Hoje, aqui na lagoa!', 'É baile, mano! Hoje, aqui na lagoa. Já chamei a quebrada inteira: a Malu vem com a bateria, e a Vó Dita vai trazer bolo de fubá!'],
      en: ['It’s baile time! Today, right here at the pond!', 'It’s baile time, «mano» (bro)! Today, right here at the pond. I’ve called the whole «quebrada»: Malu’s bringing the drums, and Vó Dita’s bringing «bolo de fubá» (cornmeal cake)!'] },
    'bl.c5.mesa': {
      pt: ['Mas o som tem que ficar perfeito. Hoje quem comanda a mesa é você!', 'Mas o som tem que ficar perfeito, e hoje quem comanda a mesa de som é você. Eu só aperto os botões!'],
      en: ['But the sound has to be perfect. Tonight you’re running the desk!', 'But the sound has to be perfect, and tonight you’re running the mixing desk. I just push the buttons!'] },
    'bl.c5.ready': { pt: ['Ficou perfeito! Tá na hora!', 'Ficou perfeito, na moral! Olha a galera chegando… Tá na hora!'], en: ['Perfect! It’s time!', 'It’s perfect, «na moral» (honestly)! Look, everyone’s here… It’s time!'] },
    'bl.c5.open': { pt: ['Boa noite, Alba! Chegou o Baile da Lagoa!', 'Boa noite, Alba! Chegou o Baile da Lagoa! E hoje, no microfone: quem escreveu a letra comigo, e o {mimo}!'], en: ['Good evening, Alba! The Pond Baile is here!', 'Good evening, Alba! The Pond Baile is here! And tonight on the mic: the one who wrote the lyrics with me, and {mimo}!'] },
    'bl.c5.hush1': { pt: ['O Silêncio! Ele quer acabar com o baile!', 'Olha lá! O Silêncio chegou! Ele quer apagar o nosso baile!'], en: ['The Hush! It wants to end the baile!', 'Look! The Hush is here! It wants to snuff out our baile!'] },
    'bl.c5.hush2': {
      pt: ['A nossa letra! Canta os seus versos: cada um acorda uma pessoa!', 'A letra, mano! A crônica da quebrada! Canta os seus versos, bem alto: cada um acorda uma pessoa!'],
      en: ['Our lyrics! Sing your verses: each one wakes someone up!', 'The lyrics, «mano» (bro)! The «crônica» of the «quebrada»! Sing your verses, loud: each one wakes someone up!'] },
    'bl.c5.final': { pt: ['Agora todo mundo junto! O refrão!', 'Agora todo mundo junto, o refrão, bem alto! Puxa aí!'], en: ['Now everybody together! The chorus!', 'Now everybody together, the chorus, really loud! You start it!'] },
    'bl.c5.win': { pt: ['Isso! Alba não se cala!', 'Isso, Alba! Ninguém cala a quebrada!'], en: ['Yes! «Alba não se cala!» (Alba won’t be silenced!)', 'Yes, Alba! Nobody silences the «quebrada»!'] },
    'bl.c5.gift': { pt: ['Toma, {mimo}: um microfone. Agora você é MC!', 'Toma, {mimo}: um microfone só seu. A partir de hoje, é MC {mimo} na área!'], en: ['Here, {mimo}: a microphone. Now you’re an MC!', 'Here, {mimo}: a microphone all your own. From today on, MC {mimo} is in the house!'] },
    'bl.c5.sweet': {
      pt: ['Antes, eu ouvia música sozinho, de fone. Hoje a quebrada inteira dançou junto.', 'Sabe… antes eu ouvia música sozinho, de fone, pra não ouvir o silêncio. Hoje a quebrada inteira dançou junto. Valeu por tudo.'],
      en: ['I used to listen to music alone, headphones on. Today the whole neighborhood danced together.', 'You know… I used to listen to music alone, headphones on, so I wouldn’t hear the silence. Today the whole «quebrada» danced together. Thanks for everything.'] },
    'bl.c5.lights': { pt: ['E as luzes ficam! A lagoa agora é nossa pista.', 'E as luzes ficam aí, viu? A lagoa agora é a pista de dança da quebrada.'], en: ['And the lights stay! The pond is our dance floor now.', 'And the lights are staying up, okay? The pond is the neighborhood’s dance floor now.'] },
    'bl.c5.role': { pt: ['Amanhã, bora dar um rolê pela quebrada?', 'Amanhã, bora dar um rolê pela quebrada? Eu, você e o {mimo}, de fone e microfone!'], en: ['Tomorrow, want to «dar um rolê» (go hang out) around the neighborhood?', 'Tomorrow, want to «dar um rolê» (go hang out) around the «quebrada»? You, me and {mimo}, headphones and mic!'] },
    'bl.quit': { pt: ['De boa, depois a gente continua.', 'De boa, mano. Depois a gente continua, eu tô sempre aqui.'], en: ['«De boa» (no worries), we’ll carry on later.', '«De boa, mano» (no worries, bro). We’ll carry on later, I’m always here.'] },
  };
  if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v;
  const lineFor = key => { const L = LT[key], tier = typeof LEX !== 'undefined' && LEX.tier ? LEX.tier() : 1, i = Math.max(1, Math.min(tier, L.pt.length)) - 1; return { pt: L.pt[i].replace(/\{mimo\}/g, MIMO()), en: L.en[Math.min(i, L.en.length - 1)].replace(/\{mimo\}/g, MIMO()) }; };

  // ================================================================ the song: «Baile da Lagoa», a funk carioca tamborzão (150 bpm, straight,
  // B♭ major: B♭ Gm E♭ F). A big low drum in a «tum-tum … tum-tum» figure with an 808 under it (no slides), hand claps on 2
  // and 4, an atabaque running in between, a crowd chant (two voices, «ô-a»), no hi-hats. A' adds a whistle synth answering
  // the chant; B is the «montagem» (Vó's samba-rock guitar chops, the tower bell, a new chant: «Al-ba não se ca-la»); C is
  // the breakdown: the whole crowd clapping on every beat, «ê!» shouts, then the drum comes back under a riser. Live layers
  // (MIX, read as each step is scheduled): the bloco's bateria (surdo + tamborim), Kauã's ducks (quack chops), the brass
  // stabs, the bass level, and thin (the Hush: only the drums get through).
  const MIX = { drums: 1, bass: 1, chant: 1, gtr: 1, bateria: 1, patos: 1, metal: 1, thin: false };
  const MIXES = {
    full: { drums: 1, bass: 1, chant: 1, gtr: 1, bateria: 1, patos: 1, metal: 1, thin: false },
    draft: { drums: 1, bass: 1, chant: 1, gtr: 0, bateria: 0, patos: 0, metal: 0, thin: false },       // (chapter 4: his first draft)
    desk: { drums: 1, bass: 1.7, chant: 1, gtr: 1, bateria: 0, patos: 0, metal: 0, thin: false },      // (chapter 5: before you fix it)
  };
  const setMix = name => Object.assign(MIX, MIXES[name] || MIXES.full);
  function addSong() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const K = Sound.kit;
    const ROOT = [34, 31, 39, 41];                                                          // B♭1 G1 E♭2 F2
    const STAB = [[62, 65, 70], [62, 67, 70], [63, 67, 70], [60, 65, 69]];                // B♭ Gm E♭ F
    const GTR = [[58, 62, 65, 69], [55, 62, 65, 70], [51, 55, 58, 62], [57, 60, 65, 69]];   // B♭maj7 Gm7 E♭maj7 F
    const TUM = [K.pat('x..x....x..x....'), K.pat('x..x....x..x..o.')];
    const PA = [K.pat('....x.......x...'), K.pat('....x..-....x..o')];
    const ATA = ['..h..s.h..l..s.h', '..h..s.hm.l..s.l'];
    const TAMB = K.pat('x..o..x.x..o..x.'), GT = K.pat('...x..o...x..o..');
    const HOOK = K.mel('F5/3 F5 D5/2 F5 G5 F5/4 | D5/3 D5 A#4/2 C5/4 r/4 | G5/3 G5 D#5/2 G5 A#5 G5/4 | F5/3 G5 A5/2 C6/4 r/4');
    const WHIS = K.mel('A#5/2 r/1 A#5/1 G5/2 F5 D5 F5 G5/4 | F5/3 G5 A#5/2 C6/4 r/4 | D#6/2 r/1 D#6/1 C6/2 A#5 G5 A#5 C6/4 | D6/3 C6 A5/2 F5/4 r/4');
    const HOOK2 = K.mel('A#4/2 D5 F5/3 F5/1 G5/2 F5/6 | r/4 D5/2 C5 A#4/8 | A#4/2 D5 F5/3 F5/1 G5/2 A#5/6 | r/4 A5/2 G5 F5/8');
    const ata = (c, t, v) => { if (c === 'h') K.conga(t, 'hi', v); else if (c === 'l') K.conga(t, 'lo', v); else if (c === 's') K.conga(t, 'slap', v); else if (c === 'm') K.conga(t, 'mute', v); };
    const chant = (m, t, len, v = 1) => { K.vox(m - 12, t, len, 0.5 * v, 'o', 'a'); K.vox(m - 24, t, len, 0.32 * v, 'o', 'o'); };
    const quack = (t, v = 1) => { K.vox(76, t, 0.09, 0.55 * v, 'e', 'a'); K.vox(74, t + 0.1, 0.09, 0.45 * v, 'e', 'a'); };
    Sound.addSong('pt_baile', { bpm: BPM, len: 272, from: 16, swing: 0, vol: 0.4, verb: 0.08, echo: 0.06, echoSteps: 3,
      play(i, t, s16) {
        const M = MIX;
        if (i < 16) {                    // the intro: the atabaque alone, a riser, «ê!», his duck tag
          ata(ATA[0][i], t, 0.9);
          if (i === 0) K.swell(t, 16 * s16, 0.8);
          if (i === 12) K.vox(65, t, 0.16, 0.5, 'e', 'e');
          if (i === 14) quack(t, 0.9);
          return;
        }
        const j = i - 16, sec = j >> 6, bar = (j >> 4) & 3, s = j & 15, thin = !!M.thin;
        if (j === 0) K.crash(t, 0.7);
        // the big drum with the 808, the claps; in the breakdown the crowd claps every beat, then the drum comes back
        if (sec < 3 || bar >= 2) {
          const tum = TUM[bar & 1][s];
          if (tum && M.drums) { K.tom(t, 70, 1.5 * tum * M.drums); if (M.bass) K.sub808(ROOT[bar] + (s === 11 ? 12 : 0), t, (s === 0 || s === 8 ? 3 : 4) * s16, 0.95 * Math.min(1.8, M.bass)); }
          const pa = PA[bar & 1][s];
          if (pa && M.drums) { K.hclap(t, 0.85 * pa); if (pa >= 1) K.rim(t, 0.35); }
        } else {
          if (!(s & 3)) K.claps(t, 0.95);
          if (s === 0 || s === 8) K.vox(s ? 67 : 70, t, 0.18, 0.45, 'e', 'e');
        }
        if (sec === 3 && bar === 3 && s === 0) K.swell(t, 16 * s16, 0.9);
        ata(ATA[bar & 1][s], t, thin ? 0.5 : 0.75);
        if (thin) return;
        // the chant, the whistle's answer, the montagem
        if (sec <= 1) { const n = HOOK[bar * 16 + s]; if (n && M.chant) chant(n[0], t, n[1] * s16); }
        if (sec === 1) { const n = WHIS[bar * 16 + s]; if (n) K.lead(n[0], t, n[1] * s16 * 0.9, 'whistle', 0.7); }
        if (sec === 2) {
          const n = HOOK2[bar * 16 + s]; if (n && M.chant) chant(n[0], t, n[1] * s16);
          if (M.gtr && GT[s]) K.strum(GTR[bar], t, GT[s] * 0.9, 0.12, 1.3, s === 6 || s === 13);
          if (bar === 0 && s === 0) K.bell(46, t, 0.9);
        }
        // the live layers: the brass, the bloco's bateria, the ducks
        if (M.metal && sec < 3 && (s === 6 || s === 10 || (sec === 0 && s === 0))) K.polybrass(STAB[bar], t, (s === 10 ? 3 : 2) * s16, M.metal);
        if (M.bateria && sec < 3) { if (s === 4 || s === 12) K.surdo(t, true, 0.9 * M.bateria); else if (s === 0 || s === 8) K.surdo(t, false, 0.5 * M.bateria); if (TAMB[s]) K.tamborim(t, 0.8 * TAMB[s] * M.bateria); }
        if (M.patos && (((bar & 1) && s === 14) || (sec === 2 && s === 7 && !(bar & 1)))) quack(t, M.patos);
      } });
  }
  addSong();

  // ================================================================ the baile's set: string lights on four poles round the floor (they stay
  // up after chapter 5), the speaker stack by his crate, Vó's chair, the cake table, a crowd, the Hush as a cloud
  let B = null;
  const BL = { on: false, show: false, busy: false, music: null, level: 0, cut: 16000, hush: 0, hushT: 0, burst: 0, jump: 0, dance: false, homes: null, lent: {}, wake: {}, poseT: {}, pops: [], camO: null };
  const BULBS = ['#ffe58a', '#ff7aa8', '#7fe0ff', '#a6ff8a', '#ffb35c'];
  const SPK = [[-0.38, 0.38], [0.38, 0.38], [-0.38, 1.1], [0.38, 1.1]];
  const CROWD = [
    { skin: '#8d5a3c', hair: '#1d1512', shirt: '#ffd23f', sleeve: '#169b52', pants: '#26336a', shoes: '#f6f2ea' },
    { skin: '#f0c7a0', hair: '#6b3b25', shirt: '#ff6f91', pants: '#3f4a5a', shoes: '#2b2235', glasses: true },
    { skin: '#5e3a28', hair: '#1d1512', shirt: '#2fd0c2', pants: '#2b2235', shoes: '#ffffff', hat: 'flat', hatCol: '#d64b3c' },
    { skin: '#c98e62', hair: '#2b1d18', shirt: '#8a4fd8', pants: '#4a5a6a', shoes: '#2b2235', kid: true },
    { skin: '#e8b48a', hair: '#c9c3b4', shirt: '#ff8a2a', pants: '#26336a', shoes: '#2b2235', old: true },
    { skin: '#a8714a', hair: '#1d1512', shirt: '#f6f2ea', sleeve: '#2f7fe0', pants: '#2f7fe0', shoes: '#ffd23f', kid: true },
  ];
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    const root = new THREE.Group(); root.name = 'baile'; scene.add(root); root.visible = false;
    const colliders = [], solid = c => { c.x0 = c.x; c.z0 = c.z; colliders.push(c); return c; };
    // the lights: a loop round the four poles and two strings across, bulbs in five colors
    const lights = new THREE.Group(); root.add(lights);
    const kl = ZHF.Kit(), tops = SPOT.poles.map(([x, z]) => { const y = gy(x, z); kl.rod([x, y, z], [x, y + 3.0, z], 0.05, '#8a5f3e', { ink: 0.008 }); kl.ball(x, y + 3.02, z, 0.07, 0.05, 0.07, '#5b3a22', { ink: 0 }); return [x, y + 2.92, z]; });
    const strand = (A, C, n, sag) => {
      const pts = []; for (let i = 0; i <= n; i++) { const u = i / n; pts.push([A[0] + (C[0] - A[0]) * u, A[1] + (C[1] - A[1]) * u - Math.sin(u * Math.PI) * sag, A[2] + (C[2] - A[2]) * u]); }
      for (let i = 0; i < n; i++) kl.rod(pts[i], pts[i + 1], 0.008, '#2b2235', { ink: 0 });
      for (let i = 1; i < n; i++) kl.ball(pts[i][0], pts[i][1] - 0.08, pts[i][2], 0.065, 0.085, 0.065, BULBS[i % BULBS.length], { glow: true });
    };
    for (let i = 0; i < 4; i++) strand(tops[i], tops[(i + 1) % 4], 9, 0.32);
    strand(tops[0], tops[2], 13, 0.55); strand(tops[1], tops[3], 13, 0.55);
    ZHF.bake(lights, kl);
    for (const [x, z] of SPOT.poles) solid({ x, z, r: 0.16 });
    // the rest only for the baile itself
    const set = new THREE.Group(); root.add(set); set.visible = false;
    // the speaker stack («o paredão»): four boxes and a tweeter, cones that pump with the beat, neon rings (his green)
    const sp = SPOT.speaker, fy = yawTo(sp, FLOOR), sg = new THREE.Group(); sg.position.set(sp.x, gy(sp.x, sp.z), sp.z); sg.rotation.y = fy; set.add(sg);
    const ks = ZHF.Kit();
    for (const [cx, cy] of SPK) ks.box(cx, cy, 0, 0.72, 0.72, 0.55, '#2b2235', { ink: 0.012 });
    ks.box(0, 1.62, 0.02, 0.9, 0.3, 0.45, '#2b2235', { ink: 0.012 }).box(0, 1.62, 0.25, 0.7, 0.07, 0.02, '#4cff8a', { ink: 0, glow: true });
    ZHF.bake(sg, ks);
    const coneMat = TK.toon('#6b6578'), ringMat = new THREE.MeshBasicMaterial({ color: '#4cff8a' });
    const cones = SPK.map(([cx, cy]) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.17, 0.07, 18), coneMat); m.rotation.x = Math.PI / 2; m.position.set(cx, cy, 0.28); sg.add(m);
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.022, 6, 22), ringMat); r.position.set(cx, cy, 0.3); sg.add(r);
      return m;
    });
    const setSolid = [solid({ obox: 1, x: sp.x, z: sp.z, hw: 0.8, hd: 0.34, rot: fy })];
    // Vó's chair (white plastic, facing the floor), the cake table: bolo de fubá, Marta's pão de queijo, guaraná, cups
    const kf = ZHF.Kit(), cv = SPOT.vo, cvy = gy(cv.x, cv.z);
    kf.frame(cv.x, cvy, cv.z, yawTo(cv, FLOOR));
    kf.box(0, 0.44, 0, 0.48, 0.05, 0.44, '#fbf8f2', { ink: 0.008 }).box(0, 0.76, -0.21, 0.48, 0.5, 0.05, '#fbf8f2', { ink: 0.008 });
    for (const [lx, lz] of [[-0.2, 0.18], [0.2, 0.18], [-0.2, -0.18], [0.2, -0.18]]) kf.rod([lx, 0, lz], [lx, 0.44, lz], 0.025, '#fbf8f2', { ink: 0.004 });
    const tb = SPOT.table, ty = gy(tb.x, tb.z);
    kf.frame(tb.x, ty, tb.z, yawTo(tb, FLOOR));
    kf.box(0, 0.74, 0, 1.3, 0.05, 0.62, '#e0503f', { ink: 0.008 });
    for (const [lx, lz] of [[-0.58, 0.24], [0.58, 0.24], [-0.58, -0.24], [0.58, -0.24]]) kf.rod([lx, 0, lz], [lx, 0.73, lz], 0.025, '#c8ced8', { ink: 0.004 });
    kf.cyl(-0.35, 0.775, 0, 0.2, 0.02, '#fbf8f2', { ink: 0.004 }).cyl(-0.35, 0.85, 0, 0.16, 0.13, '#e8b84a', { ink: 0.008 }).cyl(-0.35, 0.92, 0, 0.045, 0.02, '#8a5f2a', { ink: 0 });
    kf.cyl(0.18, 0.775, 0.05, 0.17, 0.02, '#fbf8f2', { ink: 0.004 });
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; kf.ball(0.18 + Math.cos(a) * 0.08, 0.81, 0.05 + Math.sin(a) * 0.08, 0.04, 0.035, 0.04, '#e8c070', { ink: 0 }); }
    for (const bx of [0.45, 0.56]) kf.cyl(bx, 0.92, -0.16, 0.045, 0.3, '#2f8f3c', { ink: 0.005 }).cyl(bx, 0.9, -0.16, 0.047, 0.08, '#e0503f', { ink: 0 }).cyl(bx, 1.1, -0.16, 0.02, 0.06, '#2f8f3c', { ink: 0 });
    for (let i = 0; i < 4; i++) kf.cyl(0.05 + i * 0.13, 0.81, -0.2, 0.035, 0.09, '#fbf8f2', { ink: 0.004 });
    ZHF.bake(set, kf);
    setSolid.push(solid({ x: cv.x, z: cv.z, r: 0.34 }), solid({ obox: 1, x: tb.x, z: tb.z, hw: 0.7, hd: 0.36, rot: yawTo(tb, FLOOR) }));
    // the crowd: six of the neighbors' friends and kids, dancing (only for the baile)
    const crowd = CROWD.map((look, i) => {
      const p = ZHF.person(look); const [x, z] = SPOT.crowd[i]; p.x = x; p.z = z; p.y = gy(x, z); p.yaw = p.baseYaw = yawTo({ x, z }, { x: 16.6, z: -180.2 }); p.noTurn = true; p.hidden = true; p.root.visible = false;
      p.ph = i * 0.37; set.add(p.root); return p;
    });
    // the Hush: a gray cloud that rolls in over the floor
    const cloud = new THREE.Group(); root.add(cloud); cloud.visible = false;
    const puffs = [];
    for (let i = 0; i < 9; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.MeshBasicMaterial({ color: i % 3 ? '#57536a' : '#6d6880', transparent: true, opacity: 0, depthWrite: false }));
      const a = i / 9 * TAU; m.userData = { a, r: 1.2 + (i % 3) * 0.8, h: 4.6 + (i % 4) * 0.55, s: 1.4 + (i % 3) * 0.45 }; cloud.add(m); puffs.push(m);
    }
    WORLD.addSolids(colliders);
    B = { scene, root, lights, set, cones, crowd, cloud, puffs, colliders, setSolid, gy, GY: gy(FLOOR.x, FLOOR.z) };
    return B;
  }

  // ---------------------------------------------------------------- Mimo's microphone (the chapter 5 gift): held at its side, tilted up
  // to its mouth, so it never meets the headphones (head), the tiara or hat (head), the chinelos (feet) or the apron (belly)
  let MICG = null;
  function mic() {
    if (MICG || !G || !G.cast || !G.cast.mimo || !G.cast.mimo.body) return MICG;
    const g = new THREE.Group(), k = ZHF.Kit();
    k.rod([0, -0.14, 0], [0, 0.04, 0], 0.03, '#2b2235', { ink: 0.006 });
    k.cyl(0, 0.05, 0, 0.036, 0.035, '#4cff8a', { ink: 0.004 });
    k.ball(0, 0.11, 0, 0.06, 0.06, 0.06, '#c9ced8', { ink: 0.008 });
    ZHF.bake(g, k);
    g.position.set(0.33, 0.12, 0.17); g.rotation.set(0.25, 0, 0.25);
    g.visible = false; G.cast.mimo.body.add(g); MICG = g; return g;
  }
  const micOn = () => !!(isPT() && G.state.phonk && G.state.phonk.mic && !G.state.phonk.micOff);

  // ---------------------------------------------------------------- speech pops: a paper bubble that floats up over someone and fades
  // (the line by the weave, DESIGN.md 17.3: mixed, the English with the words you know in Portuguese, whole in Portuguese as the
  // weave rises; one line, never with its English under it)
  function pop(x, y, z, pt, en) {
    if (!B) return;
    if (en && typeof STORY !== 'undefined' && STORY.mixLine) { try { const m = STORY.mixLine(pt, en, { key: 'blp:' + en }); if (m.parts) pt = m.parts.map(p => p.s + (p.gl ? ` (${p.gl})` : '')).join(''); } catch (e) { /* (as written) */ } }
    en = '';
    const w = 512, h = en ? 150 : 100;
    const tex = ZHF.canvasTex(w, h, c => {
      c.fillStyle = '#fffaf0'; c.strokeStyle = '#2b2235'; c.lineWidth = 7;
      c.beginPath(); if (c.roundRect) c.roundRect(6, 6, w - 12, h - 12, 26); else c.rect(6, 6, w - 12, h - 12); c.fill(); c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#2b2235';
      let fs = 46; c.font = `800 ${fs}px Bahnschrift, "Segoe UI", sans-serif`; while (c.measureText(pt).width > w - 44 && fs > 22) { fs -= 2; c.font = `800 ${fs}px Bahnschrift, "Segoe UI", sans-serif`; }
      c.fillText(pt, w / 2, en ? 54 : h / 2);
      if (en) { let f2 = 28; c.font = `italic 600 ${f2}px "Segoe UI", sans-serif`; while (c.measureText(en).width > w - 44 && f2 > 16) { f2 -= 2; c.font = `italic 600 ${f2}px "Segoe UI", sans-serif`; } c.fillStyle = '#6b6577'; c.fillText(en, w / 2, 110); }
    });
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false }));
    s.scale.set(3.3, 3.3 * h / w, 1); s.position.set(x, y, z); s.renderOrder = 30; B.root.add(s);
    BL.pops.push({ s, t: 0, y0: y, life: 3.4 });
  }
  const spotOf = who => who === 'kaua' ? { x: P().KAUA.x, z: P().KAUA.z, h: 2.9 } : SPOT[who] ? { x: SPOT[who].x, z: SPOT[who].z, h: who === 'kid' || who === 'malu' ? 2.3 : 2.6 } : { x: FLOOR.x, z: FLOOR.z, h: 2.6 };
  function popAt(who, pt, en) { const s = spotOf(who); pop(s.x, B.gy(s.x, s.z) + s.h, s.z, pt, en); }
  // a pose for someone at the baile (Vó and Malu are lent rigs; the town's people only wave or don't)
  function poseOf(who, pose) {
    if (who === 'vo' || who === 'malu' || who === 'tiao') BL.poseT[who] = { pose, t: 2.6 };
    else if (who === 'kaua') P().KA.cheer = 0.9;
    else { const n = G.sim.npc(who); if (n) n.wave = pose === 'cheer' || pose === 'wave'; }
  }

  // ---------------------------------------------------------------- music: one request at a time, on ZHF's deck (it ducks the area's music)
  function music(name, level, cut) { BL.music = name ? { name } : null; BL.level = name ? (level || 0.4) : 0; BL.cut = cut || 16000; }
  const canSay = () => !!(window.speechSynthesis && speechSynthesis.getVoices().some(v => /^pt/i.test(String(v.lang).replace('_', '-'))));
  function shot(pos, look, dur = 1.0) { BL.camO = { pos: V3(pos[0], B.GY + pos[1], pos[2]), look: V3(look[0], B.GY + look[1], look[2]), dur }; G.cam.override = BL.camO; }

  // ---------------------------------------------------------------- the baile on and off: the set, the neighbors borrowed and put back
  const NPCS = ['rosa', 'baker', 'bruno', 'kid'];
  function baileOn() {
    if (BL.on || !B) return;
    BL.on = true; BL.show = true; BL.hush = BL.hushT = 0; BL.burst = 0; BL.wake = {}; BL.poseT = {}; BL.dance = false; BL.jump = 0;
    B.set.visible = true; B.crowd.forEach(p => { p.root.visible = true; p.hidden = false; p.pose = 'idle'; });
    BL.lent.vo = { x: SPOT.vo.x, z: SPOT.vo.z, yaw: yawTo(SPOT.vo, FLOOR), pose: 'idle', hop: 0, dy: 0 };
    BL.lent.malu = { x: SPOT.malu.x, z: SPOT.malu.z, yaw: yawTo(SPOT.malu, FLOOR), pose: 'idle' };
    BL.lent.tiao = { x: SPOT.tiao.x, z: SPOT.tiao.z, yaw: yawTo(SPOT.tiao, FLOOR), pose: 'drum' };
    try { if (typeof FAMILIA !== 'undefined' && FAMILIA.lend) FAMILIA.lend('vo', BL.lent.vo); } catch (e) { console.warn('[baile] lend vo', e); }
    try { if (typeof CARNAVAL !== 'undefined' && CARNAVAL.lend) { CARNAVAL.lend('malu', BL.lent.malu); if (CARNAVAL.tiaoAwake && CARNAVAL.tiaoAwake()) CARNAVAL.lend('tiao', BL.lent.tiao); } } catch (e) { console.warn('[baile] lend', e); }
    BL.homes = {};
    const K = P().KAUA;
    for (const id of NPCS) { const n = G.sim.npc(id); if (!n) continue; BL.homes[id] = { x: n.x, z: n.z, yaw: n.yaw, baseYaw: n.baseYaw }; Object.assign(n, { x: SPOT[id].x, z: SPOT[id].z, look: { x: K.x, z: K.z }, walking: false, wave: true }); }
    const Y = G.sim.you; Y.x = SPOT.you.x; Y.z = SPOT.you.z; Y.yaw = yawTo(SPOT.you, K); Y.vx = Y.vz = 0; Y.y = Y.ry = WORLD.groundAt(Y.x, Y.z);
    try { G.sim.snap(); } catch (e) { /* */ }
    shot(...SPOT.cam);
  }
  function baileOff() {
    if (!BL.on) return;
    BL.on = false; BL.show = false; BL.dance = false; BL.hush = BL.hushT = 0; BL.burst = 0;
    if (B) { B.set.visible = false; B.cloud.visible = false; B.crowd.forEach(p => { p.root.visible = false; p.hidden = true; }); }
    try { if (typeof FAMILIA !== 'undefined' && FAMILIA.lend) FAMILIA.lend('vo', null); } catch (e) { /* */ }
    try { if (typeof CARNAVAL !== 'undefined' && CARNAVAL.lend) { CARNAVAL.lend('malu', null); CARNAVAL.lend('tiao', null); } } catch (e) { /* */ }
    BL.lent = {};
    for (const id of Object.keys(BL.homes || {})) { const n = G.sim.npc(id), h = BL.homes[id]; if (n) Object.assign(n, { x: h.x, z: h.z, yaw: h.yaw, baseYaw: h.baseYaw, look: null, walking: false, wave: false }); }
    BL.homes = null; MIX.thin = false; music(null);
    if (BL.mimoAt) { G.sim.mimoGo(null, null); BL.mimoAt = null; }      // (stopped during the gift: Mimo comes back to you)
    if (G.fx) G.fx.hush = 0;
    G.cam.override = null; BL.camO = null;
    for (const p of BL.pops) { B.root.remove(p.s); p.s.material.map.dispose(); p.s.material.dispose(); } BL.pops.length = 0;
    try { G.sim.snap(); } catch (e) { /* */ }
  }

  // ---------------------------------------------------------------- every frame (from PHONK.update)
  function update(dt, t, Y) {
    if (!B || !G) return;
    const on = isPT() && !indoors(), st = on && G.state.phonk ? G.state.phonk : null;
    const lightsUp = !!(st && (st.c5 || BL.on)), near = on && (BL.on || (!!Y && Math.hypot(Y.x - FLOOR.x, Y.z - FLOOR.z) < 150));
    B.root.visible = near && lightsUp; B.lights.visible = lightsUp; B.set.visible = BL.on;
    for (const c of B.colliders) { const off = !on || (B.setSolid.includes(c) ? !BL.on : !lightsUp); c.x = c.x0 + (off ? 1e5 : 0); c.z = c.z0; }
    const m = mic(); if (m) m.visible = micOn() && !G.sim.mimo.hidden;
    // the Hush (chapter 5): the world grays, the music thins and muffles
    if (BL.on) {
      BL.hush += (BL.hushT - BL.hush) * Math.min(1, dt * 1.6);
      if (G.fx) G.fx.hush = BL.hush * 0.85;
      MIX.thin = BL.hush > 0.55;
    }
    const cut = BL.on ? Math.min(BL.cut, 16000 - 15200 * BL.hush) : BL.cut, lvl = BL.level * (1 - 0.45 * BL.hush);
    ZHF.music.want('bl', on && BL.music ? BL.music.name : null, BL.music ? lvl : 0, { cut, duck: BL.music ? 0.12 : 1 }); ZHF.music.frame(t);
    for (let i = BL.pops.length - 1; i >= 0; i--) {
      const p = BL.pops[i]; p.t += dt; p.s.position.y = p.y0 + Math.min(1, p.t / 0.5) * 0.35 + p.t * 0.08; p.s.material.opacity = p.t < 0.2 ? p.t / 0.2 : Math.max(0, 1 - (p.t - p.life + 0.6) / 0.6);
      if (p.t >= p.life) { B.root.remove(p.s); p.s.material.map.dispose(); p.s.material.dispose(); BL.pops.splice(i, 1); }
    }
    if (!BL.on) return;
    // everyone dances on the beat (game time; close enough), or stands frozen and gray in the Hush
    const beat = t * BPM / 60, ph = beat - Math.floor(beat), pulse = Math.exp(-ph * 6), frozen = BL.hush > 0.5;
    B.cones.forEach((c, i) => { const k = BL.music && !frozen ? pulse * (i < 2 ? 1 : 0.6) : 0; c.position.z = 0.28 + k * 0.05; c.scale.setScalar(1 + k * 0.08); });
    if (BL.jump > 0) BL.jump -= dt;
    B.crowd.forEach((p, i) => {
      const dancing = BL.dance && !frozen, half = Math.floor(beat + p.ph) % 2 === 0;
      p.pose = frozen ? 'sulk' : BL.jump > 0 ? 'cheer' : dancing ? (Math.floor((beat + i * 3) / 8) % 3 === 0 ? 'cheer' : (Math.floor((beat + i) / 4) % 2 ? 'wave' : 'idle')) : 'idle';
      p.hop = dancing ? (BL.jump > 0 ? 0.32 : 0.12) * Math.abs(Math.sin((beat + p.ph) * Math.PI)) * (half ? 1 : 0.7) : 0;
      p.body.rotation.z = dancing ? Math.sin((beat + p.ph) * Math.PI) * 0.12 : 0;
      ZHF.animate(p, dt, t, null);
    });
    for (const k of Object.keys(BL.poseT)) if ((BL.poseT[k].t -= dt) <= 0) delete BL.poseT[k];
    const look = (id, dance, rest) => (frozen && !BL.wake[id] ? 'sulk' : BL.poseT[id] ? BL.poseT[id].pose : BL.dance || BL.jump > 0 ? dance : rest);
    if (BL.lent.vo) { BL.lent.vo.pose = look('vo', 'cheer', 'idle'); BL.lent.vo.hop = BL.dance && (!frozen || BL.wake.vo) ? 0.04 * pulse : 0; }
    if (BL.lent.malu) BL.lent.malu.pose = look('malu', 'drum', MIX.bateria > 0 ? 'drum' : 'idle');
    if (BL.lent.tiao) BL.lent.tiao.pose = look('tiao', 'drum', MIX.bateria > 0 ? 'drum' : 'idle');
    for (const id of ['rosa', 'baker']) { const n = G.sim.npc(id); if (n && BL.homes && BL.homes[id]) n.wave = !(frozen && !BL.wake[id]) && (BL.dance || BL.jump > 0); }
    for (const id of ['bruno', 'kid']) { const n = G.sim.npc(id); if (n && BL.homes && BL.homes[id]) n.wave = !frozen && (BL.dance || BL.jump > 0); }
    // the cloud: in with the Hush, round and round over the floor; it bursts when the crowd sings
    const show = BL.hush > 0.02 || BL.burst > 0; B.cloud.visible = show;
    if (show) {
      if (BL.burst > 0) BL.burst = Math.max(0, BL.burst - dt / 1.4);
      const k = BL.burst > 0 ? 1 + (1 - BL.burst) * 2.2 : 1, op = BL.burst > 0 ? 0.55 * BL.burst : 0.55 * Math.min(1, BL.hush * 1.3);
      B.puffs.forEach((m, i) => { const u = m.userData, a = u.a + t * 0.35; m.position.set(FLOOR.x - 1.2 + Math.cos(a) * u.r * k, B.GY + u.h + Math.sin(t * 0.9 + i) * 0.25 + (1 - BL.hush) * 3.5 * (BL.burst > 0 ? 0 : 1), FLOOR.z + Math.sin(a) * u.r * k); m.scale.setScalar(u.s * k * (0.9 + 0.1 * Math.sin(t * 1.3 + i))); m.material.opacity = op; });
    }
  }

  // ================================================================ the look: the rhyme notebook's flow meter (inside CVUI's card) and the
  // lyric card for «Rap de Alba»
  function css() {
    if (document.getElementById('bl-css')) return;
    const s = document.createElement('style'); s.id = 'bl-css'; s.textContent = `
#cvov .bl-flow { width: min(560px, 100%); background: #fff8e6; border: 2px dashed rgba(43,34,53,.25); border-radius: 14px; padding: 8px 12px; display: flex; flex-direction: column; gap: 6px; }
#cvov .bl-row { display: flex; align-items: center; gap: 8px; }
#cvov .bl-row b { width: 52px; font: 800 13px Bahnschrift, sans-serif; color: #8a4f80; flex: none; }
#cvov .bl-dots { display: flex; gap: 3px; flex: 1; min-height: 19px; align-items: center; padding: 3px 5px; border-radius: 99px; background: linear-gradient(90deg, rgba(43,34,53,.05) 0 95px, rgba(25,179,122,.2) 95px 200px, rgba(43,34,53,.05) 200px 245px, rgba(214,40,111,.12) 245px); }
#cvov .bl-dots i { width: 12px; height: 12px; border-radius: 50%; background: #b9b3c8; flex: none; }
#cvov .bl-dots i.in { background: #19b37a; } #cvov .bl-dots i.over { background: #d6286f; } #cvov .bl-dots em { font-size: 12px; opacity: .5; }
#cvov .bl-n { font: 800 15px Bahnschrift, sans-serif; width: 26px; text-align: right; flex: none; }
#cvov .bl-meta { display: flex; gap: 8px; flex-wrap: wrap; font: 700 13px "Trebuchet MS", sans-serif; }
#cvov .bl-meta span { padding: 1px 9px; border-radius: 99px; border: 2px solid rgba(43,34,53,.2); background: #fff; }
#cvov .bl-meta span.ok { border-color: #19b37a; color: #13786b; } #cvov .bl-meta span.meh { border-color: #e0a020; color: #9a6a00; } #cvov .bl-meta span.no { border-color: #d6286f; color: #d6286f; }
#bl-lyr { position: fixed; z-index: 10; left: 50%; bottom: 20px; transform: translateX(-50%); width: min(760px, calc(100vw - 28px)); box-sizing: border-box; background: #fffaf0; color: #2b2235; border: 3px solid #2b2235;
  border-radius: 20px; box-shadow: 0 0 0 6px #fff, 0 0 0 9px #4cff8a, 0 12px 0 5px rgba(43,34,53,.18); padding: 10px 18px 14px; font: 15px/1.35 "Segoe UI", system-ui, sans-serif; }
#bl-lyr.hidden { display: none; } #bl-lyr .hd { display: flex; align-items: center; gap: 10px; }
#bl-lyr .tag { font: 800 11px "Segoe UI", sans-serif; letter-spacing: .1em; text-transform: uppercase; opacity: .6; }
#bl-lyr .hd b { font: 900 21px Bahnschrift, "Segoe UI", sans-serif; } #bl-lyr .sp { flex: 1; }
#bl-lyr button { border: 2px solid #2b2235; border-radius: 10px; background: transparent; color: #2b2235; font: 800 12px "Segoe UI", sans-serif; padding: 3px 9px; cursor: pointer; }
#bl-lyr .ly { min-height: 92px; margin-top: 8px; font: 700 22px/1.35 Bahnschrift, "Segoe UI", sans-serif; }
#bl-lyr .ly div { opacity: .35; } #bl-lyr .ly div.on { opacity: 1; } #bl-lyr .ly i { display: block; font: italic 600 14px "Segoe UI", sans-serif; opacity: .7; margin-bottom: 4px; }
#bl-lyr:not(.en-on) .ly i { display: none; } #bl-lyr.en-on .bl-enb { background: #ffe36e; }
#bl-lyr .ly .y { color: #c2412f; } #bl-lyr .ly .all { color: #13786b; }
body.bl-lyr .bubble, body.bl-lyr #thought, body.bl-lyr .prompt, body.bl-lyr #objective { display: none !important; }`;
    document.head.appendChild(s);
  }
  const say4 = (key, vars) => P().speak(key, vars, true);
  const coins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; snd('chest'); UI.toast(`${why}: +${n} coins`); };

  // ================================================================ chapter 4: «Rimas da quebrada». The four interviews (typed questions,
  // out in town), then the notebook at the pond
  const npcAt = id => { const n = G.sim.npc(id); return n ? n : null; };
  const ASK = {
    vo: { name: 'Vó Dita', the: 'a Vó Dita', icon: '👵', top: 2.25, at: () => (typeof FAMILIA !== 'undefined' && FAMILIA.person ? FAMILIA.person('vo') : null), polite: true,
      model: 'A senhora gosta de música?', modelEn: 'Do you like music, ma’am?', title: 'Ask Vó Dita if she likes music. Politely: «a senhora»!',
      check: t => (has(t, ['gosta', 'curte', 'ama', 'adora']) && has(t, ['musica', 'musicas', 'samba', 'dancar', 'cantar']) ? { ok: true, minor: !has(t, ['senhora', 'sra', 'o senhor']) } : { ok: false, why: 'Ask if she likes music: «… gosta de música?»' }),
      ans: 'bl.vo.ans', politeKey: 'bl.vo.polite', more: 'bl.vo.more', fact: 'When she was young, she danced samba-rock at the club every Saturday. Kauã grew up with her radio.' },
    malu: { name: 'Malu', the: 'a Malu', icon: '🥁', top: 2.05, at: () => (typeof CARNAVAL !== 'undefined' && CARNAVAL.person ? CARNAVAL.person('malu') : null),
      model: 'Qual é o seu instrumento favorito?', modelEn: 'What’s your favorite instrument?', title: 'Ask Malu what her favorite instrument is.',
      check: t => (has(t, ['instrumento', 'instrumentos']) && has(t, ['qual', 'que', 'quais']) ? { ok: true, minor: !has(t, ['favorito', 'preferido', 'favorita', 'preferida', 'mais gosta', 'gosta mais']) } : { ok: false, why: 'Ask «Qual é o seu instrumento favorito?»' }),
      ans: 'bl.malu.ans', more: 'bl.malu.more', fact: 'The tamborim: tiny, but a huge racket («tá-tá-tá-tá»). Vô Tião’s surdo is the heart of the bloco.' },
    marta: { name: 'Marta', the: 'a Marta', icon: '🥐', top: 2.3, at: () => npcAt('baker'),
      model: 'Que horas você acorda?', modelEn: 'What time do you wake up?', title: 'Ask Marta what time she wakes up.',
      check: t => (has(t, ['que horas', 'a que horas', 'qual hora', 'qual horario', 'quando', 'que hora']) && has(t, ['acorda', 'levanta', 'acordar', 'levantar', 'acordas']) ? { ok: true } : { ok: false, why: 'Ask «Que horas você acorda?»' }),
      ans: 'bl.marta.ans', more: 'bl.marta.more', fact: 'At four every morning: the oven doesn’t wait, and the cheese bread comes out warm.' },
    rosa: { name: 'Dona Rosa', the: 'a Dona Rosa', icon: '🌹', top: 2.3, at: () => npcAt('rosa'), polite: true,
      model: 'Há quanto tempo a senhora mora em Alba?', modelEn: 'How long have you lived in Alba, ma’am?', title: 'Ask Dona Rosa how long she’s lived in Alba. Politely: «a senhora»!',
      check: t => (has(t, ['quanto tempo', 'desde quando', 'faz quanto tempo', 'ha quanto tempo', 'quantos anos']) && has(t, ['mora', 'vive', 'morar', 'viver', 'esta']) ? { ok: true, minor: !has(t, ['senhora', 'sra']) } : { ok: false, why: 'Ask «Há quanto tempo a senhora mora em Alba?»' }),
      ans: 'bl.rosa.ans', politeKey: 'bl.rosa.polite', more: 'bl.rosa.more', fact: 'Since she was a girl: she knows every stone in town, and every person.' },
  };
  const ORDER4 = ['vo', 'malu', 'marta', 'rosa'];
  // one of them says a line (their own rig if they have one; the bubble over where they stand)
  async function sayAs(id, key) {
    const A = ASK[id], p = A && A.at(); if (!p) return;
    const L = lineFor(key), proxy = { id: 'bl-' + id, name: A.name, x: p.x, z: p.z, y: p.y !== undefined ? p.y : WORLD.groundAt(p.x, p.z), top: A.top, lines: { pt: L.pt, en: L.en } };
    p.talking = true;
    try { await STORY.sayInline(proxy, true); } finally { p.talking = false; }
  }
  // a two-shot from the side of the line between you and them
  function shot2(p) {
    const Y = G.sim.you, dx = p.x - Y.x, dz = p.z - Y.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L, mx = (p.x + Y.x) / 2, mz = (p.z + Y.z) / 2, d = 3.4 + L * 0.45, y = WORLD.groundAt(mx, mz);
    G.cam.override = { pos: V3(mx - uz * d - ux * 0.6, y + 2.0, mz + ux * d - uz * 0.6), look: V3(mx, y + 1.0, mz), dur: 0.9 };
  }
  async function interview(id) {
    const A = ASK[id], st = S(), p = A.at(); if (!p || st.ask[id] || BL.busy) return;
    BL.busy = true; P().lock(true);
    const Y = G.sim.you; Y.yaw = yawTo(Y, p);
    try {
      shot2(p);
      CVUI.hud.open('Rimas da quebrada · ' + A.name);
      CVUI.hud.cue({ icon: A.icon, title: A.title, sub: 'Ask in Portuguese · ? shows how · Esc: later', bar: ORDER4.filter(k => st.ask[k]).length / 4 });
      let minor = false;
      const g = await CVUI.hud.call({ model: A.model, modelEn: A.modelEn, placeholder: 'ask in Portuguese…', check: t => { const r = A.check(t); if (r.ok) minor = !!r.minor; return r; } });
      CVUI.hud.close();
      if (!CVUI.GR.includes(g)) return;
      st.ask[id] = g; G.save();
      await sayAs(id, A.ans);
      if (A.polite && minor) await sayAs(id, A.politeKey);
      if (A.polite) CVUI.teach('ph.br_senhora');
      if (A.more) await sayAs(id, A.more);
      UI.toast(`In Kauã’s notebook, ${A.name}: ${A.fact}`);
      if (ORDER4.every(k => st.ask[k])) STORY.think('Everyone’s talked! Back to Kauã at the pond, to write their verses.', 4.5);
    } finally { CVUI.hud.close(); P().lock(false); G.cam.override = null; BL.busy = false; G.save(); }
  }

  // ---------------------------------------------------------------- the rhyme notebook: he raps a line, you write the next
  const VERSE = {
    vo: { name: 'Vó Dita', a: 'A Vó Dita manda áudio de montão,', aEn: 'Vó Dita sends voice messages by the ton,', cue: 'montão', rhyme: ['ao'], show: '-ão',
      model: 'e dança samba-rock que nem furacão!', modelEn: 'and dances samba-rock like a hurricane!',
      about: ['samba', 'rock', 'danc', 'salao', 'clube', 'sabado', 'audio', 'radio', 'baile', 'furacao', 'celular', 'figurinha', 'vo', 'vovo', 'moca', 'grupo', 'macarronada', 'netos', 'neta', 'ritmo'],
      words: 'samba-rock, dança, sábado, clube, rádio', rhymes: 'coração, furacão, salão, chão, mão, canção, emoção' },
    malu: { name: 'Malu', a: 'A Malu comanda a bateria assim:', aEn: 'Malu leads the drum section like this:', cue: 'assim', rhyme: ['im'], show: '-im',
      model: 'tá-tá-tá-tá no tamborim!', modelEn: '«tá-tá-tá-tá» on the tamborim!',
      about: ['tambor', 'bloco', 'bateria', 'surdo', 'apito', 'carnaval', 'tiao', 'batuque', 'barulh', 'toca', 'samba', 'ta', 'pequen', 'chefe', 'comanda', 'mestre', 'malu', 'menina', 'tamborim'],
      words: 'tamborim, bloco, surdo, Vô Tião, barulhão, chefe', rhymes: 'tamborim, mim, fim, sim, jardim, pudim' },
    marta: { name: 'Marta', a: 'Marta acorda cedo, faz pão de queijo,', aEn: 'Marta gets up early, makes cheese bread,', cue: 'queijo', rhyme: ['ejo', 'eijo'], show: '-ejo',
      model: 'quem passa na padaria manda um beijo!', modelEn: 'everyone passing the bakery blows her a kiss!',
      about: ['pao', 'paes', 'padaria', 'forno', 'cedo', 'manha', 'quatro', 'quent', 'cafe', 'massa', 'padeira', 'cheiro', 'fome', 'marta', 'acorda'],
      words: 'padaria, forno, quatro da manhã, quentinho, café', rhymes: 'beijo, desejo, vejo, sertanejo, festejo' },
    rosa: { name: 'Dona Rosa', a: 'Dona Rosa conhece toda a cidade,', aEn: 'Dona Rosa knows the whole town,', cue: 'cidade', rhyme: ['ade'], show: '-ade',
      model: 'e trata todo mundo com amizade!', modelEn: 'and treats everyone like a friend!',
      about: ['menina', 'pedra', 'rua', 'alba', 'casa', 'pessoa', 'mundo', 'conhec', 'historia', 'amizade', 'bondade', 'carinho', 'chapeu', 'vizinh', 'rosa', 'cuida', 'acolh', 'oculos', 'lar'],
      words: 'desde menina, cada pessoa, a casa dela, os vizinhos', rhymes: 'amizade, verdade, bondade, vontade, felicidade' },
  };
  // syllables, near enough for a rap line: each run of vowels counts once per vowel, except the falling diphthongs (ai, ei,
  // oi, ui, au, eu, iu, ou, ão, ãe, õe…); the u in que / qui / gue / gui is silent, in qua / gua a glide
  const VOW = 'aeiouáàâãéêíóôõúü';
  const DIPH = /^(ai|ei|oi|ui|au|eu|iu|ou|ão|ãe|õe|ãi|éi|ói|éu|áu|ái|ôu)$/;
  function syllables(text) {
    let n = 0;
    for (const w0 of String(text || '').toLowerCase().split(/[^a-záàâãéêíóôõúüç]+/)) {
      if (!w0) continue;
      const w = w0.replace(/([qg])u(?=[eiéêí])/g, '$1').replace(/([qg])u(?=[aoáóâô])/g, '$1w');
      let c = 0;
      for (let i = 0; i < w.length;) {
        if (!VOW.includes(w[i])) { i++; continue; }
        let j = i; while (j < w.length && VOW.includes(w[j])) j++;
        for (let k = i; k < j;) { if (k + 1 < j && DIPH.test(w.slice(k, k + 2))) k += 2; else k++; c++; }
        i = j;
      }
      n += Math.max(1, c);
    }
    return n;
  }
  function judgeVerse(V, text) {
    const words = N(text).split(' ').filter(Boolean), last = words[words.length - 1] || '', syl = syllables(text);
    const rep = !!last && last === N(V.cue), rh = !!last && !rep && last.length > 2 && V.rhyme.some(s => last.endsWith(s));
    const ab = words.some(w => V.about.some(k => (k.length >= 4 ? w.startsWith(k) : w === k)));
    return { words, last, syl, rep, rh, ab, fits: syl >= 5 && syl <= 16, sweet: syl >= 7 && syl <= 13 };
  }
  function verseCheck(V, text) {
    const J = judgeVerse(V, text);
    if (J.words.length < 2) return { ok: false, why: 'Write a whole line, not just one word!' };
    if (J.rep) return { ok: false, why: `«${esc(V.cue)}» again? End on a different word that rhymes (<b>${V.show}</b>).` };
    if (!J.rh) return { ok: false, why: `It has to rhyme with «${esc(V.cue)}»: end on a word in <b>${V.show}</b> (${esc(V.rhymes)}…).` };
    if (J.syl < 5) return { ok: false, why: `Only ${J.syl} syllables: the beat’s left hanging («sobrou beat»). Say a bit more!` };
    if (J.syl > 16) return { ok: false, why: `${J.syl} syllables: you trampled the beat («atropelou o beat»)! Make it shorter.` };
    const notes = [];
    if (!J.ab) notes.push(`for an S, say something about her (${esc(V.words)})`);
    if (!J.sweet) notes.push(J.syl < 7 ? 'a little short for the beat' : 'a little long for the beat');
    return { ok: true, minor: !J.ab || !J.sweet, said: text, note: notes.length ? notes.join(' · ') : 'rimou, cabe no beat e fala dela! 🔥' };
  }
  const dotRow = n => { let h = ''; for (let i = 1; i <= Math.min(n, 20); i++) h += `<i class="${i > 16 ? 'over' : i >= 7 && i <= 13 ? 'in' : ''}"></i>`; return h; };
  function flowLive(V, text, el) {
    const q = s => el.querySelector(s); if (!q('.bl-flow')) return;
    const kN = syllables(V.a), J = judgeVerse(V, text || '');
    q('.bl-dots.k').innerHTML = dotRow(kN); q('.bl-n.k').textContent = kN;
    q('.bl-dots.y').innerHTML = J.syl ? dotRow(J.syl) : '<em>type your line…</em>'; q('.bl-n.y').textContent = J.syl || '';
    const rh = q('.bl-rh'); rh.className = 'bl-rh ' + (J.rh ? 'ok' : J.rep ? 'no' : ''); rh.textContent = `rima ${V.show} ${J.rh ? '✓' : J.rep ? '✗ same word' : '…'}`;
    const sy = q('.bl-sy'); sy.className = 'bl-sy ' + (J.sweet ? 'ok' : J.fits ? 'meh' : J.syl ? 'no' : ''); sy.textContent = `${J.syl} sílabas ${J.sweet ? '✓' : J.syl > 13 ? '· muito longo' : J.syl ? '· curto' : ''}`;
    const ab = q('.bl-ab'); ab.className = 'bl-ab ' + (J.ab ? 'ok' : ''); ab.textContent = `sobre a ${V.name} ${J.ab ? '✓' : '…'}`;
  }
  function verseStep(id, i) {
    const V = VERSE[id], A = ASK[id];
    return { kind: `Verso ${i + 1}/4 · ${V.name}`, say: [V.a, V.aEn],
      art: el => { el.innerHTML = `<div class="bl-flow"><div class="bl-row"><b>Kauã</b><span class="bl-dots k"></span><span class="bl-n k"></span></div><div class="bl-row"><b>Você</b><span class="bl-dots y"></span><span class="bl-n y"></span></div><div class="bl-meta"><span class="bl-rh"></span><span class="bl-sy"></span><span class="bl-ab"></span></div></div>`; flowLive(V, '', el); },
      live: (text, el) => flowLive(V, text, el),
      gl: `Your line: rhyme with <b>«${esc(V.cue)}»</b> (${V.show}), fit the beat (7–13 syllables: the green zone), and say something about her.`,
      note: `What ${esc(V.name)} told you: <i>${esc(A.fact)}</i><br>Words about her: ${esc(V.words)} · rhymes: ${esc(V.rhymes)}`,
      model: V.model, modelEn: V.modelEn, placeholder: 'your line, in Portuguese…', check: t => verseCheck(V, t),
      then: r => { const st = S(); st.verses[id] = String(r.text || '').trim().replace(/\s+/g, ' '); st.vg[id] = r.grade; G.save(); } };
  }
  async function writeVerses() {
    css(); setMix('draft'); music('pt_baile', 0.2);
    try {
      const r = await CVUI.steps(ORDER4.map(verseStep), { title: 'O caderno de rimas', sub: '«Rap de Alba» · Kauã & você', face: 'bl_book', name: 'Kauã (DJ Lagoa)', intro: ['Bora! Eu começo, você termina.', 'Let’s go! I start, you finish.'] });
      return !r.quit;
    } finally { music(null); }
  }

  // ---------------------------------------------------------------- «Rap de Alba»: his lines, yours, and the chorus, on the new beat
  const CHORUS = [{ who: 'all', pt: 'Ô, ô, Alba não se cala!', en: 'Oh, oh, Alba won’t be silenced!' }, { who: 'all', pt: 'O som da quebrada é o som da nossa fala!', en: 'The sound of the neighborhood is the sound of our voices!' }];
  function rapLines() {
    const st = S(), out = [];
    for (const id of ORDER4) {
      const V = VERSE[id], mine = st.verses[id];
      out.push({ who: 'k', pt: V.a, en: V.aEn }, { who: 'y', pt: mine || V.model, en: !mine || N(mine) === N(V.model) ? V.modelEn : '' });
      if (id === 'malu' || id === 'rosa') out.push(...CHORUS);
    }
    return out;
  }
  const LYR = { el: null, on: false, skip: false };
  async function waitSkip(sec) { for (let g = 0; g < sec && !LYR.skip; g += 0.1) await wait(0.1); }
  async function rapTrack() {
    css();
    if (!LYR.el) { const el = document.createElement('div'); el.id = 'bl-lyr'; el.className = 'hidden'; document.body.appendChild(el); LYR.el = el; }
    const lines = rapLines(), el = LYR.el, voice = canSay(), beat = 60 / BPM;
    // (the song in Portuguese; each line's English only on request, EN: DESIGN.md 17.3)
    el.innerHTML = `<div class="hd"><span class="tag">DJ Lagoa feat. você &amp; ${esc(MIMO())}</span><b>«Rap de Alba»</b><span class="sp"></span><button type="button" class="bl-enb" title="The lines in English">EN</button><button type="button" class="bl-skip">Skip (Esc)</button></div><div class="ly"></div>`;
    el.classList.remove('hidden', 'en-on'); document.body.classList.add('bl-lyr'); LYR.on = true; LYR.skip = false;
    el.querySelector('.bl-skip').onclick = () => { LYR.skip = true; };
    el.querySelector('.bl-enb').onclick = e => { el.classList.toggle('en-on'); e.currentTarget.blur(); };
    const keys = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); LYR.skip = true; } };
    addEventListener('keydown', keys, true);
    setMix('full'); music('pt_baile', 0.5); BL.show = true; P().stage(true); Input.typing = true;
    try {
      const ly = el.querySelector('.ly');
      ly.innerHTML = `<div class="on all" style="text-align:center">DJ Lagoa · «Rap de Alba» 🎤</div>`;
      await waitSkip(beat * 8);
      for (let i = 0; i < lines.length && !LYR.skip; i++) {
        const L = lines[i], nx = lines[i + 1];
        ly.innerHTML = `<div class="on ${L.who}">${esc(L.pt)}${L.en ? `<i>${esc(L.en)}</i>` : ''}</div>` + (nx ? `<div class="${nx.who}">${esc(nx.pt)}</div>` : '');
        if (L.who === 'y') { if (voice) CVUI.say(L.pt); G.sim.mimo.happy = 0.5; P().KA.cheer = 0.6; }
        if (L.who === 'all') { G.sim.mimo.happy = 0.6; }
        await waitSkip(beat * 8);
      }
      if (!LYR.skip) { ly.innerHTML = `<div class="on all" style="text-align:center">Valeu, Alba! 🎤</div>`; await waitSkip(beat * 6); }
    } finally { removeEventListener('keydown', keys, true); el.classList.add('hidden'); document.body.classList.remove('bl-lyr'); LYR.on = false; music(null); BL.show = false; P().stage(false); Input.typing = false; }
  }

  // ---------------------------------------------------------------- chapter 4, start to end
  async function chapter4() {
    const st = S();
    if (st.c4s) return talk();
    P().twoShot();
    await say4('bl.c4.hi');
    await say4('bl.c4.baile');
    const item = (id, sit, keys) => { const p = PHRASES.find(x => x.id === id); return { id, pt: p.pt, en: p.en, note: p.note, sit, keys }; };
    const r = await CVUI.lesson({ title: 'A gíria da galera', sub: 'how Kauã’s crew talks', face: 'ph_slang', name: 'Kauã (DJ Lagoa)', intro: ['Pega a visão: é assim que a galera fala!', 'Get this: that’s how the crew talks!'],
      items: [
        item('ph.br_pegaavisao', 'You’re about to tell your friends something important. You start with…', ['pega a visao', 'pegou a visao']),
        item('ph.br_demorou', 'Kauã: «Bora fazer um baile?» Say yes, his way!', ['demorou', 'demoro']),
        item('ph.br_fechou', 'Saturday at the pond: it’s settled. Seal the deal!', ['fechou', 'fechado', 'ta fechado']),
        item('ph.br_namoral', '“Honestly, your beat is awesome.” Honestly = …', ['na moral']),
        item('ph.br_quebrada', 'What does Kauã call his neighborhood, with love?', ['quebrada', 'a quebrada', 'minha quebrada', 'nossa quebrada']),
      ] });
    if (r.quit) { await say4('bl.quit'); return; }
    st.c4s = true; G.save();
    await say4('bl.c4.notphonk');
    setMix('draft'); music('pt_baile', 0.42); BL.show = true;
    try { await say4('bl.c4.listen'); await wait(3.4); } finally { BL.show = false; music(null); }
    await say4('bl.c4.lyrics');
    await say4('bl.c4.respect');
    CVUI.teach('ph.br_senhora');
    await say4('bl.c4.go');
    UI.toast('Chapter 4: «Rimas da quebrada». Ask Vó Dita, Malu, Marta and Dona Rosa (look for «Ask»).');
  }
  // the rest of chapter 4, once all four have been asked: the notebook, the track, the thanks
  async function chapter4b() {
    const st = S();
    P().twoShot();
    await say4('bl.c4.write');
    if (!(await writeVerses())) { await say4('bl.quit'); return; }
    P().twoShot();
    await say4('bl.c4.done');
    await say4('bl.c4.rap');
    await rapTrack();
    st.c4 = true; G.save();
    const pay = { S: 15, A: 12, B: 9, C: 6, D: 4 };
    coins(20 + ORDER4.reduce((a, k) => a + (pay[st.vg[k]] || 4), 0), 'Rap de Alba');
    G.state.bag = G.state.bag || {}; G.state.bag['k.rhymes'] = 1;
    await UI.card(`<canvas width="140" height="140"></canvas><div class="tag">Key item</div><div class="big">o caderno de rimas</div><div class="sub">Kauã’s rhyme notebook, with your four verses in it · <b>E</b></div>`, { kind: 'reveal', icon: 'bl_book', say: 'caderno de rimas' });
    await say4('bl.c4.end');
    await P().sayBack('ph.br_enois', { title: 'Answer him his way: «É nóis!» (That’s us!)' });
    if (!P().chOpen(5)) await say4('bl.c4.later');
    G.save();
  }

  // ================================================================ chapter 5: «O Baile da Lagoa»
  // the mixing desk: each request is a typed command, and the beat changes as you say it
  const PUT = ['coloca', 'coloque', 'poe', 'bota', 'liga', 'solta', 'manda', 'traz', 'adiciona', 'acrescenta', 'entra', 'volta', 'quero', 'toca'];
  const DESK = [
    { who: 'kaua', icon: '🔈', name: 'Kauã', line: ['Tá muito baixo! Lá da padaria ninguém escuta.', 'It’s way too quiet! Nobody can hear it from the bakery.'], model: 'Aumenta o som!', modelEn: 'Turn it up!', ph: 'ph.br_aumenta',
      check: t => (has(t, ['aumenta', 'aumente', 'aumentar', 'sobe', 'mais alto', 'mais volume', 'mais som']) ? { ok: true } : has(t, ['abaixa', 'diminui', 'menos']) ? { ok: false, why: 'The other way: it’s too quiet! «Aumenta…»' } : { ok: false, why: 'Make it louder: «Aumenta o som!»' }),
      set: () => { BL.level = 0.5; } },
    { who: 'malu', icon: '🥁', name: 'Malu', line: ['Ei! Cadê o batuque do meu bloco?', 'Hey! Where’s my bloco’s drumming?'], model: 'Coloca a bateria!', modelEn: 'Put the drums in!',
      check: t => (has(t, PUT) && has(t, ['bateria', 'batuque', 'surdo', 'tamborim', 'tambor', 'tambores', 'bloco', 'percussao']) ? { ok: true } : { ok: false, why: 'Bring in the bloco’s drums: «Coloca a bateria!»' }),
      set: () => { MIX.bateria = 1; } },
    { who: 'vo', icon: '👵', name: 'Vó Dita', line: ['Ai, meu Deus, que grave é esse? O meu coração tá pulando!', 'Oh my, what’s this bass? My heart’s jumping!'], model: 'Abaixa o grave!', modelEn: 'Turn the bass down!', ph: 'ph.br_abaixa',
      check: t => { const down = has(t, ['abaixa', 'abaixe', 'abaixar', 'diminui', 'diminua', 'diminuir', 'menos', 'baixa', 'tira']); if (down && has(t, ['grave', 'graves', 'baixo', 'bass', 'batida'])) return { ok: true }; if (down) return { ok: true, minor: true }; return { ok: false, why: 'Too much bass for Vó: «Abaixa o grave!»' }; },
      set: () => { MIX.bass = 0.6; } },
    { who: 'kid', icon: '🦆', name: 'Nico', line: ['Cadê os patos do Kauã? Eu quero os patos!', 'Where are Kauã’s ducks? I want the ducks!'], model: 'Coloca os patos!', modelEn: 'Put the ducks in!',
      check: t => (has(t, PUT) && has(t, ['patos', 'pato', 'quack', 'qua']) ? { ok: true } : has(t, ['patos', 'pato']) ? { ok: true, minor: true } : { ok: false, why: 'Put the ducks in: «Coloca os patos!»' }),
      set: () => { MIX.patos = 1; } },
    { who: 'baker', icon: '🎺', name: 'Marta', line: ['Tá faltando um metal, sabe? Um trompete, uma coisa assim!', 'There’s some brass missing, you know? A trumpet, something like that!'], model: 'Põe o metal!', modelEn: 'Bring in the brass!',
      check: t => (has(t, PUT) && has(t, ['metal', 'metais', 'trompete', 'trompetes', 'sopro', 'sopros', 'corneta', 'trombone']) ? { ok: true } : has(t, ['metal', 'metais', 'trompete']) ? { ok: true, minor: true } : { ok: false, why: 'Bring in the brass: «Põe o metal!»' }),
      set: () => { MIX.metal = 1; } },
  ];
  // the MC's calls, and the crowd's answers
  const crowdPop = (idx, pt, en) => idx.forEach(i => { const [x, z] = SPOT.crowd[i]; pop(x, B.gy(x, z) + 2.25, z, pt, en); });
  const MC = [
    { icon: '📣', title: 'Wake the crowd up: «Alba, cadê você?»', sub: 'Alba, where are you? (they shout back «Aqui!», here!)', model: 'Alba, cadê você?', modelEn: 'Alba, where are you?', ph: 'ph.br_cadevoce',
      keys: ['cade voce', 'cade vc', 'cade a galera', 'cade alba', 'alba cade', 'cade voces'], react: () => { crowdPop([0, 2, 4], 'Aqui!', 'Here!'); popAt('malu', 'Aquiii!', ''); BL.jump = 1.2; } },
    { icon: '🙌', title: '«Bota a mão pro alto!»', sub: 'Hands up! («pro» = «para o»)', model: 'Bota a mão pro alto!', modelEn: 'Hands up!', ph: 'ph.br_maoproalto',
      keys: ['mao pro alto', 'maos pro alto', 'mao para o alto', 'maos para o alto', 'mao pra cima', 'maos pra cima', 'levanta a mao', 'levantem as maos', 'mao no alto'], react: () => { BL.jump = 2.6; ['vo', 'malu', 'tiao'].forEach(w => poseOf(w, 'cheer')); } },
    { icon: '🔊', title: '«Faz barulho!»', sub: 'Make some noise!', model: 'Faz barulho!', modelEn: 'Make some noise!', ph: 'ph.br_fazbarulho',
      keys: ['faz barulho', 'facam barulho', 'barulho'], react: () => { crowdPop([1, 3, 5], 'Uhuuu!', ''); popAt('rosa', 'Uhuuu!', ''); snd('fanfare'); BL.jump = 1.6; } },
    { icon: '🤝', title: '«Todo mundo junto!»', sub: 'Everybody together!', model: 'Todo mundo junto!', modelEn: 'Everybody together!', ph: 'ph.br_todomundo',
      keys: ['todo mundo junto', 'todos juntos', 'todo mundo', 'galera junta'], react: () => { BL.jump = 2.2; popAt('bruno', 'Bora!', 'Let’s go!'); } },
  ];
  const WAKE = { vo: ['Olha eu dançando, gente!', 'Look at me dancing, everyone!'], malu: ['Bateria, comigo!', 'Drums, with me!'], marta: ['Pão de queijo pra todo mundo!', 'Cheese bread for everyone!'], rosa: ['Faz anos que eu não danço assim!', 'I haven’t danced like this in years!'] };
  const whoOf = id => (id === 'marta' ? 'baker' : id);
  function wakeUp(id) {
    BL.wake[id] = true; if (id === 'marta') BL.wake.baker = true; if (id === 'malu') BL.wake.tiao = true;
    BL.hushT = Math.max(0.6, BL.hushT - 0.1);
    const w = whoOf(id), s = spotOf(w);
    try { G.w3d.fx.sparkle(s.x, B.gy(s.x, s.z) + 1.2, s.z, 18); } catch (e) { /* */ }
    snd('learned'); popAt(w, WAKE[id][0], WAKE[id][1]); poseOf(w, 'cheer');
  }
  // you say your own verse back, out loud: close enough counts (most of its words, or the rhyme and over half)
  function echoCheck(line, text) {
    const a = N(line).split(' ').filter(Boolean), b = N(text).split(' ').filter(Boolean);
    if (!b.length || !a.length) return { ok: false };
    const setB = new Set(b), hit = a.filter(w => setB.has(w)).length / a.length, lastOk = b[b.length - 1] === a[a.length - 1];
    if (hit >= 0.85 || (hit >= 0.6 && lastOk)) return { ok: true, minor: hit < 0.85 };
    return { ok: false, why: `Your own line: «${esc(line)}»` };
  }
  async function hudCall(cue, call) { CVUI.hud.cue(cue); return CVUI.hud.call(call); }
  // the set piece, start to end (→ the grades, or null if you stopped)
  async function baile() {
    const st = S(), grades = [], total = DESK.length + MC.length + ORDER4.length + 1;
    let n = 0;
    try {
      await UI.fade(1, 450); baileOn(); setMix('desk'); music('pt_baile', 0.16); await UI.fade(0, 450);
      // 1. the mixing desk
      if (!st.c5mix) {
        CVUI.hud.open('A mesa de som · the mixing desk');
        for (const D of DESK) {
          // (the request by the weave, DESIGN.md 17.3: mixed, whole in Portuguese as the weave rises; never with its English under it)
          let req = esc(D.line[0]);
          try { if (typeof STORY !== 'undefined' && STORY.mixHTML) req = STORY.mixHTML(D.line[0], D.line[1], { key: 'bl:' + D.line[1] }).html; } catch (e) { /* (as written) */ }
          popAt(D.who, D.line[0]); poseOf(D.who, 'point');
          const g = await hudCall({ icon: D.icon, title: `${esc(D.name)}: «${req}»`, sub: 'Tell the desk what to do!', bar: n++ / total },
            { model: D.model, modelEn: D.modelEn, check: D.check, placeholder: 'a command, in Portuguese…' });
          if (!CVUI.GR.includes(g)) return null;
          grades.push(g); D.set(); snd('chop'); if (D.ph) CVUI.teach(D.ph);
          popAt(D.who, CVUI.pick(['Isso!', 'Agora sim!', 'Perfeito!']), ''); poseOf(D.who, 'cheer');
          await wait(1.8);
        }
        CVUI.hud.close(); st.c5mix = true; G.save();
      } else { MIX.bateria = 1; MIX.bass = 0.6; MIX.patos = 1; MIX.metal = 1; BL.level = 0.5; n += DESK.length; }
      // 2. the baile: everyone dances, you're the MC
      await say4('bl.c5.ready');
      BL.dance = true; music('pt_baile', 0.52);
      await say4('bl.c5.open');
      CVUI.hud.open('O Baile da Lagoa · you’re the MC');
      for (const C of MC) {
        const g = await hudCall({ icon: C.icon, title: C.title, sub: C.sub, bar: n++ / total }, { model: C.model, modelEn: C.modelEn, keys: C.keys });
        if (!CVUI.GR.includes(g)) return null;
        grades.push(g); CVUI.teach(C.ph); C.react(); P().KA.cheer = 0.8; G.sim.mimo.happy = 0.6;
        await wait(1.9);
      }
      CVUI.hud.close();
      // 3. the Hush rolls in over the pond: gray, muffled, everyone frozen
      BL.hushT = 1; snd('whiff');
      await wait(2.8);
      await say4('bl.c5.hush1');
      await say4('bl.c5.hush2');
      CVUI.hud.open('O Silêncio! · your verses');
      for (const id of ORDER4) {
        const V = VERSE[id], line = st.verses[id] || V.model;
        const g = await hudCall({ icon: ASK[id].icon, title: `Kauã: «${esc(V.a)}»`, sub: `Your line, loud! It wakes ${esc(V.name)} up: «${esc(line)}»`, bar: n++ / total },
          { model: line, check: t => echoCheck(line, t), placeholder: 'your verse…' });
        if (!CVUI.GR.includes(g)) return null;
        grades.push(g); wakeUp(id);
        await wait(1.6);
      }
      CVUI.hud.close();
      await say4('bl.c5.final');
      CVUI.hud.open('Todo mundo junto!');
      const gF = await hudCall({ icon: '📣', title: 'The chorus, everybody: «Alba não se cala!»', sub: 'Alba won’t be silenced! Shout it!', bar: n++ / total }, { model: 'Alba não se cala!', modelEn: 'Alba won’t be silenced!', keys: ['nao se cala', 'alba nao se cala', 'nao se calam'] });
      CVUI.hud.close();
      if (!CVUI.GR.includes(gF)) return null;
      grades.push(gF);
      // 4. it bursts: color back, the full beat, everyone jumping
      BL.hushT = 0; BL.burst = 1; BL.jump = 3.2; MIX.thin = false; music('pt_baile', 0.55); snd('fanfare');
      try { for (let i = 0; i < 4; i++) G.w3d.fx.sparkle(FLOOR.x + Math.cos(i * 1.6) * 2.4, B.GY + 3.5, FLOOR.z + Math.sin(i * 1.6) * 2.4, 22); } catch (e) { /* */ }
      ORDER4.forEach(id => { BL.wake[id] = true; });
      crowdPop([0, 1, 2, 3, 4, 5], 'Alba não se cala!', '');
      await wait(2.4);
      await say4('bl.c5.win');
      // the gift: Mimo's microphone
      // (Mimo hops out in front of the crowd, facing the camera, for its gift; then back to dancing by the crate)
      const M = G.sim.mimo, GIFT = { x: 18.9, z: -179.0 }, Y = G.sim.you, CAM = { x: 26, z: -177.6 };
      Object.assign(Y, { x: 19.9, z: -178.2, vx: 0, vz: 0 }); Y.yaw = yawTo(Y, CAM); Y.y = Y.ry = WORLD.groundAt(Y.x, Y.z);
      G.sim.mimoGo(GIFT, CAM); BL.mimoAt = GIFT; await wait(1.1);
      shot([23.0, 1.8, -178.2], [19.3, 0.72, -178.7], 0.8);
      await say4('bl.c5.gift');
      st.mic = true; st.micOff = false; const mg = mic(); if (mg) mg.visible = true; M.happy = 2; M.glow = 1; snd('chest');
      await UI.card(`<canvas width="140" height="140"></canvas><div class="tag">For ${esc(MIMO())}</div><div class="big">o microfone</div><div class="sub">MC ${esc(MIMO())}’s mic (put it away or back from Kauã’s menu) · <b>E</b></div>`, { kind: 'reveal', icon: 'bl_mic', say: 'microfone' });
      await wait(0.8);
      G.sim.mimoGo(P().DANCE_AT, { x: P().KAUA.x, z: P().KAUA.z }); BL.mimoAt = null;
      Object.assign(Y, { x: SPOT.you.x, z: SPOT.you.z, vx: 0, vz: 0 }); Y.yaw = yawTo(Y, P().KAUA); Y.y = Y.ry = WORLD.groundAt(Y.x, Y.z);
      shot(...SPOT.cam);
      await say4('bl.c5.sweet');
      await P().sayBack('ph.br_tamojunto', { recall: true });
      await say4('bl.c5.lights');
      await say4('bl.c5.role'); CVUI.teach('ph.br_role');
      return grades;
    } finally {
      CVUI.hud.close();
      if (BL.on) { await UI.fade(1, 500); baileOff(); await UI.fade(0, 500); }
      G.save();
    }
  }
  async function chapter5() {
    const st = S();
    P().twoShot();
    if (!st.c5s) {
      await say4('bl.c5.hi');
      CVUI.hud.open('O Baile da Lagoa');
      const g0 = await hudCall({ icon: '🎉', title: 'Kauã: «Sabe o que isso quer dizer?» Tell him!', sub: 'It means… a party! The Brazilian word for a dance party.', bar: 0 },
        { model: 'É baile!', modelEn: 'It’s baile time!', keys: ['baile', 'e baile', 'festa', 'e festa', 'o baile', 'baile funk'] });
      CVUI.hud.close();
      if (!CVUI.GR.includes(g0)) { await say4('bl.quit'); return; }
      await say4('bl.c5.yes');
      await say4('bl.c5.mesa');
      st.c5s = true; G.save();
    }
    const grades = await baile();
    if (!grades) { P().twoShot(); await say4('bl.quit'); return; }
    st.c5 = true; st.c5g = grades;
    const pay = { S: 8, A: 6, B: 4, C: 3, D: 2 };
    coins(60 + grades.reduce((a, g) => a + (pay[g] || 2), 0), 'O Baile da Lagoa');
    G.save();
    UI.toast(`Chapter 5 done: the lights stay up over the pond. MC ${MIMO()} has its microphone!`);
  }

  // ================================================================ hooks for phonk.js: talking, his menu, the quest
  // Talk to Kauã with a chapter halfway: the interviews still to do, the notebook, or the baile again
  async function talk() {
    const st = S();
    if (st.c4s && !st.c4) {
      const left = ORDER4.filter(k => !st.ask[k]);
      if (left.length) { const names = left.map(k => ASK[k].the); await say4('bl.c4.wait', { n: names.length > 1 ? names.slice(0, -1).join(', ') + ' e ' + names[names.length - 1] : names[0] }); return true; }
      await chapter4b(); return true;
    }
    if (st.c5s && !st.c5 && P().chOpen(5)) { await chapter5(); return true; }
    return false;
  }
  function chapter(n) { return n === 4 ? chapter4() : n === 5 ? chapter5() : null; }
  function menuItems() {
    const st = S(), o = [];
    if (st.c4) { o.push({ label: 'Listen to «Rap de Alba»', sub: 'the neighborhood’s crônica, with your verses', value: 'x:rap' }); o.push({ label: 'Rewrite your verses', sub: 'the rhyme notebook, again', value: 'x:write' }); }
    if (st.mic) o.push({ label: st.micOff ? `Give ${MIMO()} its microphone` : `Put ${MIMO()}’s microphone away`, value: 'x:mic' });
    return o;
  }
  async function menuPick(v) {
    const st = S();
    if (v === 'x:rap') { await rapTrack(); return true; }
    if (v === 'x:write') { if (await writeVerses()) { P().twoShot(); await say4('bl.c4.done'); } return true; }
    if (v === 'x:mic') { st.micOff = !st.micOff; G.sim.mimo.happy = 0.8; UI.toast(st.micOff ? `${MIMO()} puts its microphone away.` : `MC ${MIMO()} is back on the mic!`); G.save(); return true; }
    return false;
  }
  // the «Ask» spots: a little toward you from each neighbor (so it's ours, not their own «Talk», that you're nearest)
  function interactables() {
    if (!G || !isPT() || indoors() || BL.on || BL.busy) return [];
    const st = S(); if (!st.c4s || st.c4) return [];
    const out = [], Y = G.sim.you;
    for (const id of ORDER4) {
      if (st.ask[id]) continue;
      const p = ASK[id].at(); if (!p) continue;
      const dx = Y.x - p.x, dz = Y.z - p.z, d = Math.hypot(dx, dz); if (d > 14) continue;
      const k = d > 0.01 ? Math.min(0.45, d * 0.5) / d : 0;
      out.push({ x: p.x + dx * k, z: p.z + dz * k, r: 2.5, label: 'Ask (perguntar)', run: () => interview(id) });
    }
    return out;
  }
  function questSteps(later) {
    const st = s => s.phonk || {}, asked = s => ORDER4.filter(k => (st(s).ask || {})[k]).length, home = () => ({ x: P().SEAT.x, z: P().SEAT.z });
    const nextAsk = () => {
      const s = (G && G.state.phonk) || {}; if (!s.c4s) return home();
      const Y = G.sim.you, list = ORDER4.filter(k => !(s.ask || {})[k]).map(k => ASK[k].at()).filter(Boolean);
      list.sort((a, b) => Math.hypot(a.x - Y.x, a.z - Y.z) - Math.hypot(b.x - Y.x, b.z - Y.z));
      return list[0] ? { x: list[0].x, z: list[0].z } : home();
    };
    return [
      Object.assign(later(4, 'Rimas da quebrada: ask Alba’s people ({n}/4)'), { n: s => asked(s),
        why: 'Kauã is writing a «crônica» of the neighborhood for his baile. Talk to him first; then ask Vó Dita and Dona Rosa (politely: «a senhora»), Malu and Marta about themselves.',
        done: s => asked(s) >= 4 || !!st(s).c4, target: nextAsk, hint: '{mimo} hops toward someone with a story to tell.' }),
      { text: 'Write their verses with Kauã', why: 'Back at the pond: he raps a line about each of them, and you write the next one. It has to rhyme, fit the beat and be about them.',
        done: s => !!st(s).c4, target: home, hint: '{mimo} taps out a rhythm. Back to the pond!' },
      Object.assign(later(5, 'O Baile da Lagoa'), { why: 'The whole neighborhood at the pond: run the sound, be the MC, and don’t let the Hush silence the baile.',
        done: s => !!st(s).c5, target: home, hint: '{mimo} is already dancing. Baile at the pond!' }),
    ];
  }
  function questStory() {
    const st = s => s.phonk || {};
    return [
      { when: s => !!st(s).c4s, text: 'Kauã wants to throw a baile at the pond for the whole neighborhood, with a new beat (a funk carioca tamborzão: not phonk, “so even Vó Dita dances”) and a «crônica» of Alba’s people for its lyrics.' },
      { when: s => !!st(s).c4, text: 'You asked Vó Dita, Malu, Marta and Dona Rosa about themselves and wrote their verses with Kauã: «Rap de Alba». «É nóis!»' },
      { when: s => !!st(s).c5, text: 'The Baile da Lagoa: you ran the sound and the mic. When the Hush rolled in, your own verses woke the neighbors back up, and «Alba não se cala!» drove it off. {mimo} got a microphone, and the lights stay up over the pond.' },
    ];
  }
  function init(game) { G = game; try { mic(); } catch (e) { /* */ } setInterval(() => { if (isPT()) CVUI.keepFar(PIDS.filter(id => LEX.item(id) && LEX.taught(id))); }, 30000); }
  const HOOKS = {
    init, build, update, interactables, talk, chapter, menuItems, menuPick, questSteps, questStory, phraseIds: () => PIDS.slice(),
    show: () => BL.show, musicOn: () => !!BL.music, beat: t => (BL.music ? t * BPM / 60 : undefined), busyNow: () => BL.on || BL.busy || LYR.on,
  };
  if (typeof PHONK !== 'undefined' && PHONK.use) PHONK.use(HOOKS);

  // ================================================================ tests
  const TEST = {
    // the story at chapter n (the flags SIDES.md gates on), Kauã's earlier chapters done
    setup(n) {
      const f = G.state.flags; Object.assign(f, { hatched: true, guide: true, rosa: true, escort: true, escorted: true, lessons: 2 });
      if (n >= 2) f.boss = true; if (n >= 3) f.bells = Math.max(f.bells || 0, n - 2);
      const st = S();
      if (n >= 4) { Object.assign(st, { met: true, recorder: true, ch1: true, c2s: true, c3s: true, built: true, won: true }); ['ducks', 'bell', 'train', 'sheep', 'frogs'].forEach(k => { st.samples[k] = true; st.heard[k] = true; }); f.mimoPhones = true; st.phonesOn = true; }
      if (n >= 5) { st.c4s = true; st.c4 = true; ORDER4.forEach(k => { st.ask[k] = st.ask[k] || 'A'; }); }
      return st;
    },
    // ZHF.drive's o.panel: answer whatever card or call bar is up (o.answer(cur) / o.call(hcur), else the model)
    panel(o = {}) {
      if (LYR.on && o.skipLyrics !== false) { LYR.skip = true; return 'lyrics: skipped'; }
      const c = CVUI.cur; if (c && c.submit) { const m = (o.answer && o.answer(c)) || c.model; c.submit(m); return 'card: ' + m; }
      const h = CVUI.hcur; if (h && h.submit) { const m = (o.call && o.call(h)) || h.model; h.submit(m); return 'call: ' + m; }
      return null;
    },
    drive(o = {}) {
      return ZHF.drive(Object.assign({ panel: () => TEST.panel(o), busy: () => BL.on || BL.busy || LYR.on || CVUI.busy,
        say: () => { const i = document.getElementById('command-input'); return i ? i.placeholder : ''; } }, o));
    },
    syllables, judgeVerse, verseCheck, echoCheck,
  };
  return {
    init, build, update, interactables, chapter4, chapter4b, chapter5, talk, mic, micOn,
    get busy() { return BL.on || BL.busy || LYR.on; },
    _: { S: () => S(), LT, PHRASES, SPOT, FLOOR, ASK, VERSE, DESK, MC, MIX, MIXES, BL, LYR, ORDER4, interview, writeVerses, rapTrack, baile, baileOn, baileOff, setMix, music, pop, t: TEST, get B() { return B; } },
  };
})();
