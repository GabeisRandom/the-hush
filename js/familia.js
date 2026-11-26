'use strict';
// Vó Dita and the family group chat (Portuguese games only; SIDES.md). The user wants side content from everyday culture:
// the family group on the phone, the grandma's «Bom dia!» flower pictures and five-minute voice messages, the uncle's pavê
// joke, the Sunday lunch. Everyday Brazil.
//
// WHO: Vó Dita (Benedita), Malu's grandmother and Vô Tião's wife (carnaval.js), on her woven «cadeira de fio» by her front door
// in the back lane by the bell tower, squinting at her phone. The group «Família Ribeiro 🌻»: Vô Tião (never types), their
// daughter Tia Sônia and her husband Tio Zeca (in Molinar), their kids Davi (19, works at Remanso's docks) and Lari (16),
// and Malu (on her mom's phone). Since the Hush came, nobody answers Vó in the group.
// The phone: «Prosa», an original chat app (familia_ui.js: PRS). Vó gives you Vô Tião's old phone.
// CHAPTERS (gated like the other side characters: Rosa's welcome, the big Hushling, bells 1, 2, 3):
//   1 Entrando no grupo: «Bom dia, família!», «E a senhora?» (the respectful «you»), answering her «Bom dia» flower picture,
//     «Manda uma figurinha!», «Um beijo!»
//   2 Internetês: Vó asks you in private what the grandkids mean: vc, tb, pq, blz, sdds, tmj, kkkkk, 👍 (joinha), 🙏; then
//     you text like them («sdds de vc», «vou tb, blz?»)
//   3 Os áudios: Vó's long voice note (a pt-BR voice reads it, with a transcript and a 2x button): what's for lunch, what
//     time, what the neighbor's dog ate; your own áudio back; Tio Zeca's áudio: «É pavê ou pra comer?» «É pra comer, tio!»
//   4 O almoço de domingo: who brings what («Eu levo o…»), a forwarded hoax and a kind «Melhor conferir antes de repassar»,
//     directions for Davi from the station («Pega a rua do norte», «vira à esquerda»)
//   5 O Silêncio no grupo: the Hush mutes the group (gray hearts, «visto por último há uma semana»); you write to Davi, Lari,
//     Tia Sônia and Tio Zeca one by one; the video call where everyone talks at once; then the real Sunday lunch at a long
//     table in the lane: «Saúde!», «Passa a farofa!», «Tá uma delícia, vó!». {mimo} gets Vó's little chinelos (flip-flops).
// SONG: 'pt_almoco' «Domingo na Vó» (samba-rock in G at 104, swung: a nylon guitar's chop, Rhodes, a finger bass, congas,
// a whistled hook answered by a flugelhorn, and a pressure cooker hissing at the end of the verse); 'fm_ping' (the app's
// message sound).
// API: FAMILIA.init(game) · FAMILIA.build(scene, env) → { colliders, group, people, update } · FAMILIA.mapMark(dpr) ·
// FAMILIA.quest() · FAMILIA._ (tests: FAMILIA._.t). State: G.state.fm. Phrases: ph.fm.* (region 'O grupo da família').

const FAMILIA = (() => {
  const esc = s => CVUI.esc(s), has = (t, k) => CVUI.has(t, k), N = s => CVUI.N(s);
  let G = null, B = null;
  const MIMO = () => (G && G.state && G.state.mimoName) || 'Mimo';
  // ================================================================ the family (the group's members: names, colors, faces)
  const FAM = {
    vo: { name: 'Vó Dita', color: '#d6286f', icon: 'fmVo' }, tiao: { name: 'Vô Tião', color: '#2f5fb5', icon: 'cvVo' },
    sonia: { name: 'Tia Sônia', color: '#8a4fd8', icon: 'fmSonia' }, zeca: { name: 'Tio Zeca', color: '#d0601a', icon: 'fmZeca' },
    davi: { name: 'Davi', color: '#13866a', icon: 'fmDavi' }, lari: { name: 'Lari', color: '#c2185b', icon: 'fmLari' }, malu: { name: 'Malu', color: '#b08400', icon: 'cvKid' },
  };
  const GROUP = 'familia', GROUP_TITLE = 'Família Ribeiro 🌻';
  // ================================================================ the Phrasebook (LEX kind 'phrase'; pt only)
  const R_FM = 'O grupo da família';
  const PH = [
    { id: 'ph.fm.bomdia', pt: 'Bom dia, família!', en: 'Good morning, family!', note: 'The first message of the day in a Brazilian family group, often with a flower picture.', sit: 'It’s 7 a.m. Greet the family group!', keys: ['bom dia familia', 'bom dia gente', 'bom dia'] },
    { id: 'ph.fm.senhora', pt: 'E a senhora?', en: 'And you? (to an older woman, respectfully)', note: '«A senhora» / «o senhor» is the polite «you» for grandparents and older people. With friends: «E você?».', sit: 'Grandma asks how you are. Answer, and ask her back politely.', keys: ['e a senhora', 'a senhora'] },
    { id: 'ph.fm.figurinha', pt: 'Manda uma figurinha!', en: 'Send a sticker!', note: 'A chat sticker is a «figurinha» (a collectible sticker, too).', sit: 'Ask your cousin to send a sticker.', keys: ['manda uma figurinha', 'manda figurinha', 'manda outra figurinha'] },
    { id: 'ph.fm.beijo', pt: 'Um beijo!', en: 'Lots of love! (literally «a kiss»)', note: 'How Brazilians end messages to family and friends. Short: «bjs». A hug: «um abraço» («abs»).', sit: 'Say bye to your family in the chat.', keys: ['um beijo', 'beijo', 'beijos', 'bjs'] },
    { id: 'ph.fm.internetes', pt: 'vc, tb, pq, blz', en: 'você, também, porque, beleza (texting shorthand)', note: 'Internetês: «vc» = você, «tb» = também, «pq» = porque, «blz» = beleza, «tmj» = tamo junto.', sit: 'Write «você» the way your cousin texts it.', keys: ['vc'] },
    { id: 'ph.fm.sdds', pt: 'Que saudade!', en: 'I miss you so much!', note: '«Saudade» is the longing for someone or something you love. Texting: «sdds».', sit: 'You haven’t seen your cousin in months. Tell her!', keys: ['que saudade', 'saudade', 'saudades', 'sdds'] },
    { id: 'ph.fm.kkk', pt: 'Kkkkk', en: 'Hahaha', note: 'Brazilians laugh in text with «kkkkk» (the more k’s, the funnier) or a softer «rs» (risos).', sit: 'Your uncle’s joke is terrible, and hilarious. Laugh in text!', keys: ['kkk', 'kkkk', 'kkkkk', 'kkkkkk', 'rs', 'rsrs'] },
    { id: 'ph.fm.joinha', pt: 'Joinha!', en: 'Thumbs up! 👍', note: '👍 is a «joinha». To young people a lone 👍 can feel a little dry!', sit: 'Grandma sends 👍. What do Brazilians call it?', keys: ['joinha'] },
    { id: 'ph.fm.audio', pt: 'Manda um áudio!', en: 'Send a voice message!', note: 'Brazilians love «áudios». Grandma’s are famous for lasting five minutes.', sit: 'Typing is too slow for your aunt. Ask her to send a voice message.', keys: ['manda um audio', 'manda audio'] },
    { id: 'ph.fm.avisa', pt: 'Me avisa, tá?', en: 'Let me know, okay?', note: '«Tá?» at the end softens a request.', sit: 'Ask your cousin to let you know when he arrives.', keys: ['me avisa', 'avisa'] },
    { id: 'ph.fm.meiodia', pt: 'Ao meio-dia.', en: 'At noon.', note: 'Sunday lunch is «ao meio-dia» or «à uma da tarde»… and it always starts late.', sit: 'What time is Sunday lunch?', keys: ['ao meio dia', 'meio dia'] },
    { id: 'ph.fm.pave', pt: 'É pavê ou pra comer?', en: 'Is it pavê, or is it for eating?', note: 'The uncle joke at every family lunch: «pavê» sounds like «pra ver» (for looking at). The answer: «Ai, tio…»', register: 'slang', sit: 'You’re the uncle at the table. Make the joke about the dessert.', keys: ['e pave ou pra comer', 'pave ou pra comer'] },
    { id: 'ph.fm.levo', pt: 'Eu levo o pudim!', en: 'I’ll bring the pudding!', note: '«Eu levo…» = I’ll bring… «Quem leva o quê?» = Who brings what?', sit: 'Everyone says what they’ll bring to lunch. Your turn!', keys: ['eu levo', 'levo'] },
    { id: 'ph.fm.conferir', pt: 'Melhor conferir antes de repassar.', en: 'Better check before forwarding.', note: 'Kind words for the relative who forwards everything.', sit: 'Your aunt forwards a scary message without checking. Say it gently.', keys: ['conferir antes de repassar', 'melhor conferir', 'conferir antes'] },
    { id: 'ph.fm.verdade', pt: 'Será que é verdade?', en: 'Could that be true?', note: '«Será que…?» wonders out loud: «Será que vai chover?»', sit: 'A strange message arrives. Wonder if it’s true.', keys: ['sera que e verdade', 'sera que'] },
    { id: 'ph.fm.pega', pt: 'Pega a rua do norte.', en: 'Take the north street.', note: '«Pegar» (to grab) also means to take a street, a bus, a train: «pega o trem».', sit: 'Tell your cousin which street to take.', keys: ['pega a rua', 'pega a rua do norte'] },
    { id: 'ph.fm.saude', pt: 'Saúde!', en: 'Cheers! (literally «health»)', note: 'The toast, with any drink. Guaraná counts!', sit: 'Everyone raises a glass. Make the toast!', keys: ['saude'] },
    { id: 'ph.fm.delicia', pt: 'Tá uma delícia!', en: 'It’s delicious!', note: 'The compliment every cook wants to hear.', sit: 'Grandma’s macarronada is amazing. Tell her!', keys: ['ta uma delicia', 'uma delicia', 'delicia'] },
    { id: 'ph.fm.passa', pt: 'Passa a farofa, por favor!', en: 'Pass the farofa, please!', note: '«Farofa» is toasted cassava flour, at every Sunday lunch.', sit: 'The farofa is at the other end of the table. Ask for it!', keys: ['passa a farofa', 'me passa a farofa'] },
    { id: 'ph.fm.saudadevcs', pt: 'Que saudade de vocês!', en: 'I missed you all so much!', note: '«Vocês» = you all.', sit: 'The whole family is on the video call. Tell them!', keys: ['que saudade de voces', 'saudade de voces'] },
  ];
  PH.forEach(p => { p.kind = 'phrase'; p.region = R_FM; p.register = p.register || 'casual'; p.icon = 'fmPhone'; });
  const PHI = Object.fromEntries(PH.map(p => [p.id, p]));
  // ================================================================ what they say out loud (pt with the English under it; never about the
  // player's gender). {mimo}: {mimo}'s name
  const L1 = (pt, en) => ({ pt: [pt], en: [en] });
  const LT = {
    'fm.vo.hi': L1('Ai, esse celular!… Oi, meu bem! Você chegou agora em Alba, né? Eu sou a Dita, a avó da Malu.', 'Oh, this phone!… Hi, dear! You’ve just come to Alba, haven’t you? I’m Dita, Malu’s grandma.'),
    'fm.vo.group': L1('Eu tenho um grupo da família no celular. Mas, desde que o Silêncio chegou, ninguém me responde mais.', 'I have a family group chat on my phone. But since the Hush came, nobody answers me anymore.'),
    'fm.vo.tiao0': L1('E o Tião fica lá no banco da praça, quietinho… nem olha o celular.', 'And Tião just sits on the plaza bench, all quiet… he doesn’t even look at his phone.'),
    'fm.vo.tiao1': L1('O Tião voltou a falar, graças a Deus! Mas celular ele não usa, não.', 'Tião is talking again, thank goodness! But phones? He won’t touch one.'),
    'fm.vo.phone': L1('Toma: o celular velho do Tião. Assim você entra no grupo e me ajuda a acordar essa família!', 'Here: Tião’s old phone. That way you can join the group and help me wake this family up!'),
    'fm.vo.done1': L1('Ai, que alegria! Já tem gente falando no grupo!', 'Oh, what a joy! People are already talking in the group!'),
    'fm.vo.ch2': L1('Meu bem, os meus netos escrevem tudo pela metade! Me ajuda a entender?', 'Dear, my grandkids write everything in halves! Will you help me understand?'),
    'fm.vo.done2': L1('Agora eu sou craque no internetês! Kkkk', 'Now I’m an internetês ace! Kkkk'),
    'fm.vo.ch3': L1('Escrever cansa a vista. Eu prefiro mandar áudio!', 'Typing tires my eyes. I’d rather send voice messages!'),
    'fm.vo.done3': L1('Viu? Áudio é muito mais prático. Mesmo que seja de cinco minutos!', 'See? Voice messages are so much easier. Even five-minute ones!'),
    'fm.vo.ch4': L1('Domingo vai ter almoço de família! Bora organizar pelo grupo?', 'There’s a family lunch on Sunday! Shall we organize it through the group?'),
    'fm.vo.done4': L1('Tudo combinado! Agora é só esperar o domingo.', 'Everything’s settled! Now we just wait for Sunday.'),
    'fm.vo.sad': L1('Faz uma semana que ninguém responde no grupo. Nem o Davi, que sempre manda figurinha…', 'It’s been a week and nobody answers in the group. Not even Davi, who always sends stickers…'),
    'fm.vo.alone': L1('Acho que domingo eu vou almoçar sozinha.', 'I think I’ll be having Sunday lunch alone.'),
    'fm.vo.welcome': L1('Que bom ver todo mundo aqui! Sentem, sentem, que a comida esfria!', 'How good to see everyone here! Sit down, sit down, the food’s getting cold!'),
    'fm.sonia.lunch': L1('Mãe, essa macarronada tá igualzinha à de quando eu era criança.', 'Mom, this macarronada tastes exactly like when I was a kid.'),
    'fm.davi.lunch': L1('Vó, a senhora tinha razão: a gente precisava disso.', 'Grandma, you were right: we needed this.'),
    'fm.lari.lunch': L1('Olha: até guardei o celular! Kkkk', 'Look: I even put my phone away! Kkkk'),
    'fm.zeca.lunch': L1('Sogrinha, que banquete! E o pavê, hein? É pavê ou pra comer?', 'Mother-in-law, what a feast! And the pavê, huh? Is it pavê, or is it for eating?'),
    'fm.vo.gift': L1('E pra você, {mimo}: um par de chinelos! Assim o Biscoito não come os seus. Kkkk', 'And for you, {mimo}: a pair of flip-flops! So Biscoito won’t eat yours. Kkkk'),
    'fm.vo.end': L1('Isso que é domingo: a família toda junta, todo mundo falando ao mesmo tempo!', 'That’s what Sunday is: the whole family together, everyone talking at once!'),
    'fm.vo.idle1': L1('Já tomou café? Tem bolo de fubá na cozinha!', 'Have you had breakfast? There’s cornmeal cake in the kitchen!'),
    'fm.vo.idle2': L1('Leva um casaquinho, que vai esfriar!', 'Take a little jacket, it’s going to get cold!'),
    'fm.vo.idle3': L1('Mandei bom dia no grupo. Você viu? Tinha flor e tudo!', 'I sent good morning in the group. Did you see? It had flowers and everything!'),
    'fm.vo.idle4': L1('Agora o grupo não para! Até de madrugada tem gente mandando figurinha.', 'Now the group never stops! People send stickers even in the middle of the night.'),
    'fm.vo.wait': L1('Calma, meu bem! A vó ainda tá se ajeitando com esse celular. Volta mais tarde!', 'Easy, dear! Grandma’s still getting the hang of this phone. Come back later!'),
  };

  // ================================================================ faces and pictures (paper cutouts; the phone's pictures and stickers)
  function registerIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const add = (k, fn) => { if (!ICONS.keys.includes(k)) ICONS.add(k, fn); };
    const face = (c, p, h, skin, o = {}) => {
      h.shape(c, p, h.ell(0, 6, 26, 28), skin);
      if (!p) return;
      h.dot(c, -9, 6, 3.2, h.INK); h.dot(c, 9, 6, 3.2, h.INK); h.dot(c, -8, 5, 1.1, '#fff'); h.dot(c, 10, 5, 1.1, '#fff');
      h.dot(c, -16, 15, 4.5, 'rgba(255,120,150,0.45)'); h.dot(c, 16, 15, 4.5, 'rgba(255,120,150,0.45)');
      c.beginPath(); c.arc(0, 15, o.grin ? 9 : 7, 0.2, Math.PI - 0.2); c.lineWidth = 2.2; c.strokeStyle = h.INK; c.stroke();
    };
    add('fmVo', (c, p, h) => {      // Vó Dita: a gray bun, round glasses, little pearl earrings
      h.shape(c, p, h.ell(0, -30, 14, 11), '#d9d6de'); face(c, p, h, '#c98e62');
      h.shape(c, p, cc => { cc.moveTo(-26, 2); cc.bezierCurveTo(-28, -30, 28, -30, 26, 2); cc.quadraticCurveTo(0, -14, -26, 2); cc.closePath(); }, '#d9d6de');
      if (!p) return;
      [-10, 10].forEach(x => { c.beginPath(); c.arc(x, 6, 7.5, 0, TAU); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke(); });
      h.dot(c, -27, 16, 3, '#fffaf0'); h.dot(c, 27, 16, 3, '#fffaf0');
    });
    add('fmSonia', (c, p, h) => {   // Tia Sônia: big brown curls, gold hoops
      for (let i = 0; i < 9; i++) { const a = Math.PI * (0.9 + 1.2 * i / 8); h.shape(c, p, h.ell(Math.cos(a) * 26, -2 + Math.sin(a) * 26, 11, 11), '#6b3b25'); }
      face(c, p, h, '#e8b48a', { grin: true });
      if (p) { c.lineWidth = 2.4; c.strokeStyle = '#e8b828'; [-27, 27].forEach(x => { c.beginPath(); c.arc(x, 20, 5, 0, TAU); c.stroke(); }); }
    });
    add('fmZeca', (c, p, h) => {    // Tio Zeca: bald on top, a big mustache, a huge grin
      h.shape(c, p, h.ell(-25, 0, 6, 10), '#3a2b26'); h.shape(c, p, h.ell(25, 0, 6, 10), '#3a2b26');
      face(c, p, h, '#d9a37a', { grin: true });
      if (p) { h.shape(c, 1, h.ell(-7, 11, 9, 4, 0.25), '#3a2b26', 1.4); h.shape(c, 1, h.ell(7, 11, 9, 4, -0.25), '#3a2b26', 1.4); }
    });
    add('fmDavi', (c, p, h) => {    // Davi: short curls, a cap on backwards
      face(c, p, h, '#8d5a3c', { grin: true });
      h.shape(c, p, cc => { cc.moveTo(-27, -2); cc.bezierCurveTo(-27, -34, 27, -34, 27, -2); cc.quadraticCurveTo(0, -12, -27, -2); cc.closePath(); }, '#2f7fe0');
      h.shape(c, p, h.rr(16, -14, 18, 7, 3), '#2f7fe0');
    });
    add('fmLari', (c, p, h) => {    // Lari: long straight hair, a scrunchie, a little star sticker on her cheek
      h.shape(c, p, h.rr(-30, -18, 60, 52, 14), '#2b1d18'); face(c, p, h, '#f0c7a0');
      h.shape(c, p, cc => { cc.moveTo(-27, 0); cc.bezierCurveTo(-27, -32, 27, -32, 27, 0); cc.quadraticCurveTo(10, -18, -27, 0); cc.closePath(); }, '#2b1d18');
      h.shape(c, p, h.ell(-24, -22, 6, 5), '#ff6fae');
      if (p) h.dot(c, 18, 12, 2.6, '#ffd23f');
    });
    add('fmPhone', (c, p, h) => {   // the Phrasebook's icon: a coral phone with a heart on its screen
      h.shape(c, p, h.rr(-20, -36, 40, 72, 9), '#ff7a59'); h.shape(c, p, h.rr(-14, -26, 28, 46, 4), '#fff6ec');
      if (p) { h.shape(c, 1, cc => { cc.moveTo(0, 8); cc.bezierCurveTo(-16, -4, -8, -16, 0, -8); cc.bezierCurveTo(8, -16, 16, -4, 0, 8); cc.closePath(); }, '#ff4f9a', 1.4); h.dot(c, 0, 29, 3, '#fff6ec'); }
    });
    add('fmChinelo', (c, p, h) => {  // a flip-flop (the gift)
      h.shape(c, p, cc => { cc.ellipse(0, 4, 18, 34, 0.15, 0, TAU); }, '#ff7a59');
      if (p) { c.beginPath(); c.moveTo(-12, 10); c.quadraticCurveTo(-2, -22, 0, -22); c.quadraticCurveTo(2, -22, 12, 10); c.lineWidth = 4; c.strokeStyle = '#fffaf0'; c.stroke(); h.dot(c, 0, -22, 4, '#ffd23f'); }
    });
  }
  // ---------------- Mimo, drawn for the stickers (its bean body, ears, big eyes, the gem)
  function mimo(c, x, y, s, o = {}) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = c.lineCap = 'round';
    const INK = '#2b2235', fi = (f, lw = 5) => { c.fillStyle = f; c.fill(); c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); };
    for (const sx of [-1, 1]) { c.save(); c.translate(sx * 30, -78); c.rotate(sx * (0.15 + (o.ears || 0))); c.beginPath(); c.ellipse(0, -40, 17, 52, 0, 0, TAU); fi('#fbf1df'); c.beginPath(); c.ellipse(0, -36, 8, 36, 0, 0, TAU); c.fillStyle = '#ff9b88'; c.fill(); c.restore(); }
    c.beginPath(); c.moveTo(0, -80); c.bezierCurveTo(80, -80, 88, 20, 78, 66); c.quadraticCurveTo(68, 100, 0, 100); c.quadraticCurveTo(-68, 100, -78, 66); c.bezierCurveTo(-88, 20, -80, -80, 0, -80); fi('#fbf1df');
    c.beginPath(); c.ellipse(0, 48, 44, 32, 0, 0, TAU); c.fillStyle = '#fffaf2'; c.fill();
    c.beginPath(); c.moveTo(0, -74); c.lineTo(11, -61); c.lineTo(0, -48); c.lineTo(-11, -61); c.closePath(); fi('#2fd0c2', 3);
    for (const sx of [-1, 1]) {
      if (o.happy) { c.beginPath(); c.arc(sx * 26, -14, 9, Math.PI + 0.3, -0.3); c.lineWidth = 5; c.strokeStyle = INK; c.stroke(); }
      else { c.beginPath(); c.ellipse(sx * 26, -16, 8, 12, 0, 0, TAU); c.fillStyle = INK; c.fill(); c.beginPath(); c.arc(sx * 26 + 3, -20, 3, 0, TAU); c.fillStyle = '#fff'; c.fill(); }
      c.beginPath(); c.ellipse(sx * 48, 6, 10, 6, 0, 0, TAU); c.fillStyle = 'rgba(255,140,150,.55)'; c.fill();
    }
    if (o.tear) { c.beginPath(); c.moveTo(-30, -2); c.quadraticCurveTo(-38, 14, -30, 18); c.quadraticCurveTo(-22, 14, -30, -2); c.fillStyle = '#7fd0ff'; c.fill(); }
    c.beginPath(); c.arc(0, 6, o.happy ? 10 : 6, 0.2, Math.PI - 0.2); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
    c.restore();
  }
  const sparkle = (c, x, y, r, col) => { c.save(); c.translate(x, y); c.fillStyle = col; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.restore(); };
  // the «Bom dia» text: big, cursive, glittering, as every grandma's pictures have it
  function glitterText(c, text, x, y, px, cols) {
    c.save(); c.font = `italic 900 ${px}px "Segoe Script", "Brush Script MT", "Comic Sans MS", cursive`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const g = c.createLinearGradient(x - px * 2.5, y - px / 2, x + px * 2.5, y + px / 2); cols.forEach((col, i) => g.addColorStop(i / (cols.length - 1), col));
    c.lineWidth = px * 0.16; c.strokeStyle = '#ffffff'; c.strokeText(text, x, y); c.lineWidth = px * 0.06; c.strokeStyle = '#7a2a52'; c.strokeText(text, x, y); c.fillStyle = g; c.fillText(text, x, y);
    c.restore();
  }
  function flower(c, x, y, r, petal, mid, n = 12) { for (let i = 0; i < n; i++) { const a = i / n * TAU; c.beginPath(); c.ellipse(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.42, r * 0.2, a, 0, TAU); c.fillStyle = petal; c.fill(); c.lineWidth = 1.5; c.strokeStyle = 'rgba(80,40,30,.35)'; c.stroke(); } c.beginPath(); c.arc(x, y, r * 0.36, 0, TAU); c.fillStyle = mid; c.fill(); }
  function rose(c, x, y, r, col) { c.save(); c.translate(x, y); for (let i = 3; i >= 0; i--) { c.beginPath(); c.arc(0, 0, r * (0.35 + i * 0.22), 0, TAU); c.fillStyle = i % 2 ? col : '#ffffff22'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(90,10,40,.4)'; c.beginPath(); c.arc(-r * 0.1 * i, 0, r * (0.25 + i * 0.2), Math.PI * 0.2, Math.PI * 1.6); c.stroke(); } c.restore(); }
  function registerArts() {
    PRS.art('bomdia1', (c, W, H) => {      // a sunflower, a cup of coffee, the morning sun
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffcf6b'); g.addColorStop(0.6, '#ffefc2'); g.addColorStop(1, '#fff8e8'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.arc(W * 0.78, H * 0.22, 60, 0, TAU); c.fill();
      c.strokeStyle = '#3f8a3a'; c.lineWidth = 8; c.beginPath(); c.moveTo(130, 380); c.quadraticCurveTo(120, 300, 140, 230); c.stroke();
      flower(c, 140, 200, 70, '#ffc21f', '#6b3b25', 14);
      c.fillStyle = '#ffffff'; c.strokeStyle = '#7a4a32'; c.lineWidth = 5; c.beginPath(); c.moveTo(300, 270); c.lineTo(400, 270); c.lineTo(390, 350); c.quadraticCurveTo(350, 365, 310, 350); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.arc(408, 300, 18, -1.2, 1.2); c.stroke(); c.fillStyle = '#6b3b25'; c.beginPath(); c.ellipse(350, 272, 48, 8, 0, 0, TAU); c.fill();
      [[330, 240], [350, 225], [370, 242]].forEach(([x, y]) => { c.strokeStyle = 'rgba(120,80,60,.45)'; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y + 18); c.quadraticCurveTo(x - 10, y, x, y - 18); c.stroke(); });
      for (let i = 0; i < 26; i++) sparkle(c, (i * 97) % W, 20 + (i * 53) % (H - 40), 4 + (i % 4) * 2, i % 3 ? '#ffffff' : '#ffe066');
      glitterText(c, 'Bom dia!', W / 2, 70, 74, ['#ff4f9a', '#ff8a2a', '#ffd23f']);
      glitterText(c, 'Abençoado dia! 🙏', W / 2 + 40, H - 38, 30, ['#8a4fd8', '#ff4f9a']);
    });
    PRS.art('bomdia2', (c, W, H) => {      // roses on pink, sparkles, a little message
      const g = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.7); g.addColorStop(0, '#ffe1ee'); g.addColorStop(1, '#ff9cc4'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      [[110, 250, 54, '#e2335f'], [190, 300, 44, '#ff6f91'], [70, 320, 40, '#c2185b'], [400, 270, 50, '#e2335f'], [450, 330, 38, '#ff6f91']].forEach(([x, y, r, col]) => { c.fillStyle = '#3f8a3a'; c.beginPath(); c.ellipse(x + r * 0.7, y + r * 0.6, r * 0.5, r * 0.22, 0.6, 0, TAU); c.fill(); rose(c, x, y, r, col); });
      for (let i = 0; i < 40; i++) sparkle(c, (i * 83) % W, 10 + (i * 41) % (H - 20), 3 + (i % 5) * 2, i % 2 ? '#ffffff' : '#ffe066');
      glitterText(c, 'Bom dia!', W / 2, 80, 76, ['#ffffff', '#ffd23f', '#ff8a2a']);
      glitterText(c, 'Um lindo dia pra você 🌹', W / 2, 160, 30, ['#7a2a52', '#c2185b']);
    });
    PRS.art('bomdia3', (c, W, H) => {      // a gray morning (the Hush): the same flowers, faded
      c.fillStyle = '#d9d6de'; c.fillRect(0, 0, W, H); c.globalAlpha = 0.55;
      flower(c, 150, 230, 70, '#bdb8c4', '#8f8a99', 14); flower(c, 330, 260, 54, '#bdb8c4', '#8f8a99', 12);
      c.globalAlpha = 1; glitterText(c, 'Bom dia…', W / 2, 80, 70, ['#9d98ab', '#8f8a99']);
    });
    PRS.art('mimoDance', (c, W, H) => { mimo(c, W / 2, H / 2 + 20, 0.82, { happy: true, ears: 0.25 }); c.font = '900 46px "Segoe UI Symbol", sans-serif'; c.fillStyle = '#ff7a59'; c.fillText('♪', 26, 70); c.fillStyle = '#8a4fd8'; c.fillText('♫', W - 60, 60); });
    PRS.art('mimoHeart', (c, W, H) => { mimo(c, W / 2, H / 2 + 22, 0.78, { happy: true }); c.save(); c.translate(W / 2, H * 0.78); c.beginPath(); c.moveTo(0, 20); c.bezierCurveTo(-46, -10, -24, -46, 0, -22); c.bezierCurveTo(24, -46, 46, -10, 0, 20); c.closePath(); c.fillStyle = '#ff4f9a'; c.fill(); c.lineWidth = 5; c.strokeStyle = '#2b2235'; c.stroke(); c.restore(); });
    PRS.art('mimoCry', (c, W, H) => { mimo(c, W / 2, H / 2 + 20, 0.82, { tear: true, ears: -0.35 }); });
    PRS.art('mimoJoinha', (c, W, H) => { mimo(c, W / 2 - 12, H / 2 + 20, 0.78, { happy: true }); c.save(); c.translate(W * 0.74, H * 0.62); c.fillStyle = '#ffd23f'; c.strokeStyle = '#2b2235'; c.lineWidth = 5; c.beginPath(); c.roundRect ? c.roundRect(-26, -10, 44, 40, 10) : c.rect(-26, -10, 44, 40); c.fill(); c.stroke(); c.beginPath(); c.roundRect ? c.roundRect(-14, -46, 18, 42, 8) : c.rect(-14, -46, 18, 42); c.fill(); c.stroke(); c.restore(); });
    // the way from the station to Vó's house: the road, Alba's plaza, the north street, the back lane, a pin
    PRS.art('mapa', (c, W, H) => {
      c.fillStyle = '#efe6cf'; c.fillRect(0, 0, W, H); c.lineCap = c.lineJoin = 'round';
      const road = (pts, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); };
      road([[250, 372], [250, 300], [245, 210]], 22, '#fbf6ea'); road([[245, 210], [245, 160]], 18, '#fbf6ea'); road([[245, 120], [245, 40]], 18, '#fbf6ea'); road([[245, 64], [140, 64]], 14, '#fbf6ea');
      c.fillStyle = '#f4ead4'; c.beginPath(); c.arc(245, 140, 34, 0, TAU); c.fill(); c.fillStyle = '#7fc8f0'; c.beginPath(); c.arc(245, 140, 9, 0, TAU); c.fill();
      c.setLineDash([10, 9]); road([[250, 372], [250, 300], [245, 210], [245, 174]], 6, '#ff7a59'); road([[245, 106], [245, 64], [158, 64]], 6, '#ff7a59'); c.setLineDash([]);
      c.fillStyle = '#2f7f78'; c.fillRect(226, 350, 48, 22); c.fillStyle = '#e0503f'; c.fillRect(236, 340, 28, 12);
      c.fillStyle = '#5aa86a'; c.fillRect(146, 76, 40, 28); c.strokeStyle = '#2b2235'; c.lineWidth = 2; c.strokeRect(146, 76, 40, 28);
      c.fillStyle = '#ff4f9a'; c.beginPath(); c.arc(166, 48, 12, Math.PI, 0); c.lineTo(166, 72); c.closePath(); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(166, 48, 5, 0, TAU); c.fill();
      c.font = '800 25px Bahnschrift, "Segoe UI", sans-serif'; c.fillStyle = '#2b2235'; c.textAlign = 'left';
      c.fillText('Estação 🚆', 284, 366); c.fillText('Praça', 290, 150); c.fillText('Rua do norte', 262, 98); c.fillText('Casa da Vó 🏡', 96, 134);
    });
  }
  // ================================================================ places (Vó's house is the one with the green door on the back lane, by
  // Malu's HQ: its door at (−17.7, −171.7), facing the lane; the Sunday table goes out in the lane in front of it)
  const TOWER = { x: -26, z: -166 };
  const SPOT = { chair: { x: -19.35, z: -171.05, yaw: -2.5 }, door: { x: -17.7, z: -171.7 }, table: { x: -16.6, z: -173.0, len: 6.2, wid: 1.15 },
    you5: { x: -15.5, z: -174.35 }, cam5: [[-10.6, 3.5, -171.6], [-17.6, 0.7, -173.1]] };
  // the lunch: who sits where (x, z, yaw); Malu and Vô Tião are lent by carnaval.js and stand
  const SEATS = { vo: [-20.3, -173.0, Math.PI / 2], sonia: [-18.75, -172.1, Math.PI], davi: [-17.15, -172.1, Math.PI], lari: [-15.55, -172.1, Math.PI],
    zeca: [-18.75, -173.9, 0], malu: [-17.15, -174.15, 0], tiao: [-12.95, -173.0, -Math.PI / 2] };
  const S = () => { const s = G.state; if (!s.fm) s.fm = {}; const o = s.fm; o.ch = o.ch || {}; o.log = o.log || {}; o.back = o.back || {}; return o; };
  const shown = () => !!(G && G.state && G.state.lang === 'pt' && G.state.flags && G.state.flags.hatched);
  const flags = () => (G && G.state && G.state.flags) || {};
  const fill = s => String(s).replace(/\{mimo\}/g, () => MIMO());
  const lineOf = key => { const v = LT[key]; if (!v) return { pt: key, en: key }; return { pt: fill(v.pt[0]), en: fill(v.en[0]) }; };
  const tiaoAwake = () => !!(G && G.state && G.state.cv && G.state.cv.ch && G.state.cv.ch[5]);

  // ================================================================ the 3D: Vó on her chair, and (for the finale) the Sunday table
  const LOOK = {
    vo: { skin: '#c98e62', hair: '#d9d6de', shirt: '#7fb0e0', sleeve: '#7fb0e0', pants: '#7fb0e0', shoes: '#ff7a59', glasses: true, old: true, apron: '#fff4dc' },
    sonia: { skin: '#e8b48a', hair: '#6b3b25', shirt: '#8a4fd8', sleeve: '#8a4fd8', pants: '#2f3a4a', shoes: '#2b2235' },
    zeca: { skin: '#d9a37a', hair: '#3a2b26', bald: true, mustache: true, shirt: '#ff8a2a', sleeve: '#ff8a2a', pants: '#3a3346', shoes: '#2b2235', belly: true, wide: 1.12 },
    davi: { skin: '#8d5a3c', hair: '#1d1512', hat: 'beanie', hatCol: '#2f7fe0', band: '#2f7fe0', shirt: '#19b37a', sleeve: '#19b37a', pants: '#26336a', shoes: '#f4f1ea' },
    lari: { skin: '#f0c7a0', hair: '#2b1d18', shirt: '#ff6fae', sleeve: '#ff6fae', pants: '#26336a', shoes: '#f4f1ea' },
  };
  // the woven «cadeira de fio»: a dark metal frame strung with colored cords (the chair on every Brazilian sidewalk)
  function fioChair(k, x, y, z, yaw, cols) {
    k.frame(x, y, z, yaw);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.rod([sx * 0.22, 0, sz * 0.2], [sx * 0.2, 0.44, sz * 0.18], 0.014, '#2b2235', { ink: 0 });
    for (let i = 0; i < 7; i++) k.box(0, 0.45, -0.18 + i * 0.06, 0.42, 0.018, 0.028, cols[i % cols.length], { ink: 0 });
    for (let i = 0; i < 6; i++) k.box(0, 0.55 + i * 0.07, -0.22 - i * 0.012, 0.42, 0.028, 0.018, cols[(i + 1) % cols.length], { rx: -0.18, ink: 0 });
    k.rod([-0.2, 0.44, -0.2], [-0.21, 0.95, -0.27], 0.014, '#2b2235', { ink: 0 }).rod([0.2, 0.44, -0.2], [0.21, 0.95, -0.27], 0.014, '#2b2235', { ink: 0 }).rod([-0.21, 0.95, -0.27], [0.21, 0.95, -0.27], 0.014, '#2b2235', { ink: 0 });
    k.free();
  }
  function plasticChair(k, x, y, z, yaw) {
    k.frame(x, y, z, yaw);
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) k.rod([sx * 0.2, 0, sz * 0.19], [sx * 0.19, 0.43, sz * 0.17], 0.02, '#f4f1ea', { ink: 0.006 });
    k.box(0, 0.45, 0, 0.42, 0.04, 0.4, '#f4f1ea', { ink: 0.008 }).box(0, 0.7, -0.2, 0.42, 0.42, 0.035, '#f4f1ea', { rx: -0.12, ink: 0.008 });
    k.free();
  }
  // a floral oilcloth for the table (the plastic tablecloth with little flowers)
  const clothTex = () => ZHF.canvasTex(512, 128, (c, w, h) => {
    w = w || 512; h = h || 128; c.fillStyle = '#fffaf0'; c.fillRect(0, 0, w, h);
    const cols = ['#ff6f91', '#ffd23f', '#2f7fe0', '#ff8a2a'];
    for (let i = 0; i < 60; i++) { const x = (i * 71) % w, y = ((i * 37) % h), col = cols[i % 4]; for (let p = 0; p < 5; p++) { const a = p / 5 * TAU; c.fillStyle = col; c.beginPath(); c.arc(x + Math.cos(a) * 4.5, y + Math.sin(a) * 4.5, 3.2, 0, TAU); c.fill(); } c.fillStyle = '#7a4a32'; c.beginPath(); c.arc(x, y, 2, 0, TAU); c.fill(); c.fillStyle = '#5aa84a'; c.beginPath(); c.ellipse(x + 8, y + 6, 4, 2, 0.6, 0, TAU); c.fill(); }
    c.strokeStyle = '#ff7a59'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
  });
  function person(look, id, at, gy, o) {
    const p = ZHF.person(look, o || {}); p.id = id; p.nameSrc = (FAM[id] || {}).name || '';
    p.x = at[0]; p.z = at[1]; p.y = gy(p.x, p.z); p.yaw = p.baseYaw = at[2] || 0; p.noTurn = true; p.story = !!FAM[id];
    return p;
  }
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    const root = new THREE.Group(); root.name = 'familia'; scene.add(root); root.visible = false;
    const colliders = [], solid = c => { c.x0 = c.x; c.z0 = c.z; colliders.push(c); return c; };
    // ---------------- Vó Dita on her chair by her door, a little potted plant, her phone
    const C = SPOT.chair, cy = gy(C.x, C.z), k = ZHF.Kit();
    fioChair(k, C.x, cy, C.z, C.yaw, ['#19b3a6', '#ff7a59', '#ffd23f']);
    k.frame(C.x + 0.75, cy, C.z + 0.45, 0).cyl(0, 0.16, 0, 0.16, 0.32, '#c96a3c', { ink: 0.01 }).ball(0, 0.42, 0, 0.2, 0.17, 0.2, '#4c9a40', { ink: 0.008 }).ball(0.07, 0.55, 0.05, 0.05, 0.05, 0.05, '#ff6f91', { ink: 0 }).free();
    ZHF.bake(root, k);
    colliders.push(solid({ x: C.x, z: C.z, r: 0.38 }), solid({ x: C.x + 0.75, z: C.z + 0.45, r: 0.2 }));
    const people = [];
    const vo = person(LOOK.vo, 'vo', [C.x, C.z, C.yaw], gy, { sit: true, seatY: 0.47 });
    { const kh = ZHF.Kit(); kh.ball(0, 0.1, -0.24, 0.12, 0.11, 0.1, LOOK.vo.hair, { ink: 0.01 }); for (const s of [-1, 1]) kh.ball(s * 0.25, -0.06, 0.02, 0.022, 0.022, 0.022, '#fffaf0', { ink: 0 }); ZHF.bake(vo.head, kh); }
    const phone = new THREE.Group(), kp = ZHF.Kit(); kp.box(0, 0, 0.04, 0.09, 0.16, 0.018, '#ff7a59', { ink: 0.006 }); kp.add(ZHF.GEO.box, '#fff6ec', 0, 0, 0.051, 0.072, 0.13, 0.004, 0, 0, 0, { glow: true }); ZHF.bake(phone, kp);
    phone.rotation.set(-0.9, 0, 0); vo.arms[1].userData.hand.add(phone); vo.phone = phone;
    root.add(vo.root); people.push(vo);
    // ---------------- the Sunday table (only for the finale): the oilcloth, the food, plastic chairs, lights over the lane
    const fest = new THREE.Group(); root.add(fest); fest.visible = false;
    const T = SPOT.table, ty = gy(T.x, T.z), kf = ZHF.Kit(), x0 = T.x - T.len / 2, x1 = T.x + T.len / 2;
    for (const [lx, lz] of [[x0 + 0.2, -0.45], [x1 - 0.2, -0.45], [x0 + 0.2, 0.45], [x1 - 0.2, 0.45], [T.x, -0.45], [T.x, 0.45]]) kf.rod([lx, ty, T.z + lz], [lx, ty + 0.72, T.z + lz], 0.03, '#8a5f3e', { ink: 0.006 });
    kf.box(T.x, ty + 0.74, T.z, T.len, 0.05, T.wid, '#d9c4a0', { ink: 0.01 });
    // the food: macarronada, roast chicken, farofa, maionese, rice, beans, the pavê, two bottles of guaraná, plates and cups
    const dish = (x, z, r, col, top, o = {}) => { kf.add(ZHF.GEO.cyl, '#fbf8f2', x, ty + 0.79, z, r, 0.03, r * (o.oval || 1), 0, 0, 0, { ink: 0.005 }); if (top) kf.ball(x, ty + 0.81, z, r * 0.8, 0.07, r * 0.8 * (o.oval || 1), top, { ink: 0 }); };
    dish(T.x - 1.2, T.z, 0.32, '#fbf8f2', '#e2583a', { oval: 0.7 }); for (let i = 0; i < 5; i++) kf.ball(T.x - 1.35 + i * 0.07, ty + 0.87, T.z - 0.05 + (i % 2) * 0.08, 0.045, 0.03, 0.045, '#c2312a', { ink: 0 });
    dish(T.x + 0.2, T.z - 0.1, 0.24, '#fbf8f2', null); kf.ball(T.x + 0.2, ty + 0.88, T.z - 0.1, 0.17, 0.11, 0.13, '#b8702e', { ink: 0.008 }).ball(T.x + 0.34, ty + 0.86, T.z - 0.1, 0.05, 0.05, 0.05, '#b8702e', { ink: 0 });
    kf.add(ZHF.GEO.cyl, '#c96a3c', T.x - 0.25, ty + 0.81, T.z + 0.32, 0.13, 0.08, 0.13, 0, 0, 0, { ink: 0.006 }).ball(T.x - 0.25, ty + 0.86, T.z + 0.32, 0.11, 0.03, 0.11, '#e6c98a', { ink: 0 });
    kf.add(ZHF.GEO.cyl, '#fbf8f2', T.x + 1.1, ty + 0.81, T.z + 0.25, 0.14, 0.08, 0.14, 0, 0, 0, { ink: 0.006 }).ball(T.x + 1.1, ty + 0.86, T.z + 0.25, 0.12, 0.04, 0.12, '#f2e2a0', { ink: 0 });
    kf.add(ZHF.GEO.cyl, '#fbf8f2', T.x + 1.1, ty + 0.81, T.z - 0.28, 0.13, 0.07, 0.13, 0, 0, 0, { ink: 0.006 }).ball(T.x + 1.1, ty + 0.85, T.z - 0.28, 0.11, 0.03, 0.11, '#fbf8f2', { ink: 0 });
    kf.add(ZHF.GEO.cyl, '#7a4a32', T.x - 2.2, ty + 0.81, T.z + 0.28, 0.13, 0.07, 0.13, 0, 0, 0, { ink: 0.006 }).ball(T.x - 2.2, ty + 0.85, T.z + 0.28, 0.11, 0.03, 0.11, '#4a2a1e', { ink: 0 });
    kf.box(T.x + 2.1, ty + 0.83, T.z + 0.05, 0.42, 0.1, 0.28, '#d9f0ff', { ink: 0.006 }).box(T.x + 2.1, ty + 0.81, T.z + 0.05, 0.4, 0.04, 0.26, '#f2e2a0', { ink: 0 }).box(T.x + 2.1, ty + 0.855, T.z + 0.05, 0.4, 0.03, 0.26, '#6b3b25', { ink: 0 });
    for (const [bx, bz] of [[T.x - 0.6, T.z - 0.32], [T.x + 1.6, T.z + 0.3]]) kf.cyl(bx, ty + 0.92, bz, 0.05, 0.3, '#2f8f3c', { ink: 0.006 }).cyl(bx, ty + 0.91, bz, 0.052, 0.08, '#e0503f', { ink: 0 }).cyl(bx, ty + 1.1, bz, 0.02, 0.07, '#2f8f3c', { ink: 0 });
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const px = T.x - 2.15 + i * 1.6, pz = T.z + s * 0.42; kf.add(ZHF.GEO.cyl, '#fbf8f2', px, ty + 0.785, pz, 0.15, 0.015, 0.15, 0, 0, 0, { ink: 0.004 }).cyl(px + 0.22, ty + 0.83, pz, 0.04, 0.1, '#e0503f', { ink: 0.004 }); }
    // the chairs: mismatched white plastic ones (borrowed from the neighbors), Vó's own at the head
    for (const id of ['sonia', 'davi', 'lari', 'zeca']) { const [sx, sz, syaw] = SEATS[id]; plasticChair(kf, sx, gy(sx, sz), sz, syaw); }
    fioChair(kf, SEATS.vo[0], gy(SEATS.vo[0], SEATS.vo[1]), SEATS.vo[1], SEATS.vo[2], ['#ff7a59', '#ffd23f', '#19b3a6']);
    // a string of lights over the lane, from Vó's house to a pole across it
    const pole = { x: T.x, z: T.z - 2.05 }; kf.rod([pole.x, gy(pole.x, pole.z), pole.z], [pole.x, gy(pole.x, pole.z) + 2.9, pole.z], 0.04, '#8a5f3e');
    const L0 = [T.x - 3.0, ty + 2.6, -170.75], L1 = [pole.x, ty + 2.85, pole.z], L2 = [T.x + 3.0, ty + 2.6, -170.75];
    for (const [A, Bp] of [[L0, L1], [L1, L2]]) { for (let i = 0; i < 7; i++) { const u = i / 6, x = lerp(A[0], Bp[0], u), y = lerp(A[1], Bp[1], u) - Math.sin(u * Math.PI) * 0.3, z = lerp(A[2], Bp[2], u); kf.ball(x, y - 0.06, z, 0.05, 0.065, 0.05, ['#ffe58a', '#ffd0a0', '#fff6c0'][i % 3], { glow: true }); } kf.rod(A, Bp, 0.006, '#2b2235', { ink: 0 }); }
    ZHF.bake(fest, kf);
    const cloth = ZHF.plane(T.len + 0.2, T.wid + 0.2, clothTex()); cloth.rotation.x = -Math.PI / 2; cloth.position.set(T.x, ty + 0.772, T.z); fest.add(cloth);
    const festSolid = [solid({ obox: 1, x: T.x, z: T.z, hw: T.len / 2 + 0.3, hd: T.wid / 2 + 0.55, rot: 0 })];
    // the family (finale only), seated
    const fam = {};
    for (const id of ['sonia', 'davi', 'lari', 'zeca']) { const p = person(LOOK[id], id, SEATS[id], gy, { sit: true, seatY: 0.47 }); p.root.visible = false; p.hidden = true; fest.add(p.root); people.push(p); fam[id] = p; }
    { const kh = ZHF.Kit(); kh.ball(0, 0.0, -0.08, 0.27, 0.32, 0.22, LOOK.lari.hair, { ink: 0.01 }); kh.add(ZHF.GEO.tor, '#ff6fae', 0, 0.08, -0.25, 0.06, 0.06, 0.06, 0, 0, 0, { ink: 0 }); ZHF.bake(fam.lari.head, kh); }
    { const kh = ZHF.Kit(); for (let i = 0; i < 7; i++) { const a = Math.PI * (0.85 + 1.3 * i / 6); kh.ball(Math.cos(a) * 0.25, 0.06 + Math.sin(a) * 0.2, -0.05, 0.1, 0.1, 0.1, LOOK.sonia.hair, { ink: 0.008 }); } ZHF.bake(fam.sonia.head, kh); }
    B = { scene, root, colliders, people, vo, fest, fam, cloth, festSolid, gy, chatter: [] };
    return { colliders, group: root, people, update };
  }
  // ---------------- the chatter at the table: little speech bubbles popping up over everyone's heads at once
  const CHATTER = ['Passa a farofa!', 'Tá uma delícia!', 'Quem quer mais?', 'E o trabalho, como tá?', 'Kkkkk', 'Que saudade!', 'Vó, me ensina a receita?', 'Tem mais guaraná?',
    'Lembra daquele Natal?', 'Olha a foto!', 'Ai, tio…', 'Eu quero o pedaço maior!', 'Senta direito, Malu!', 'Que calor!', 'Repete, vó!', 'Kkkkkkk', 'Me passa o arroz?', 'Ninguém mexe no pavê!'];
  function bubbleSprite(text) {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const c = cv.getContext('2d');
    c.font = '800 30px "Segoe UI", sans-serif'; const w = Math.min(244, c.measureText(text).width + 30);
    c.fillStyle = '#fffaf0'; c.strokeStyle = '#2b2235'; c.lineWidth = 4; c.beginPath(); const x = (256 - w) / 2;
    if (c.roundRect) c.roundRect(x, 8, w, 58, 18); else c.rect(x, 8, w, 58); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(118, 64); c.lineTo(128, 88); c.lineTo(140, 64); c.fill(); c.stroke(); c.fillRect(116, 58, 26, 8);
    c.fillStyle = '#2b2235'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 128, 38, 236);
    const tex = new THREE.CanvasTexture(cv), sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
    sp.scale.set(1.5, 0.56, 1); sp.renderOrder = 5; return sp;
  }
  function chatterStep(dt) {
    const L = B.chatter;
    if (FEAST.talk) { FEAST.next -= dt; if (FEAST.next <= 0) { FEAST.next = 0.32 + Math.random() * 0.35; const who = FEAST.talkers[Math.floor(Math.random() * FEAST.talkers.length)]; if (who) { const sp = bubbleSprite(CHATTER[Math.floor(Math.random() * CHATTER.length)]); sp.position.set(who.x + (Math.random() - 0.5) * 0.3, (who.y || 0) + (who.top || 1.6) + 0.15, who.z); B.root.add(sp); L.push({ sp, t: 0 }); try { Sound.play('blip', 'town'); } catch (e) { /* */ } } } }
    for (let i = L.length - 1; i >= 0; i--) { const b = L[i]; b.t += dt; b.sp.position.y += dt * 0.35; b.sp.material.opacity = b.t < 1.6 ? 1 : Math.max(0, 1 - (b.t - 1.6) / 0.6); if (b.t > 2.2) { B.root.remove(b.sp); b.sp.material.map.dispose(); b.sp.material.dispose(); L.splice(i, 1); } }
  }

  // ================================================================ the music
  const MUS = { name: null, level: 0, duck: 0.25 };
  (function addSongs() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const K = Sound.kit;
    // ---------------- «Domingo na Vó» (pt_almoco): samba-rock in G, 104, swung. A nylon guitar chops the «balanço» in
    // sixteenths, a Rhodes holds the jazzy chords (Cmaj9 Bm7 E9 Am9 D13…), a finger bass swings and walks into each
    // chord, congas and a cowbell, a backbeat snare; a whistled hook (someone happy in the kitchen), a flugelhorn answering in
    // the bridge; and a pressure cooker hissing at the end of the verse.
    const CHS = K.CH('C3: E3 G3 B3 D4, C3: E3 G3 B3 D4, B2: D3 F#3 A3, E2: D3 G#3 B3 F#4, A2: C3 E3 G3 B3, A2: C3 E3 G3 B3, D2: C3 F#3 B3 E4, D2: C3 F#3 B3 E4,' +
      'C3: E3 G3 B3 D4, C3: E3 G3 B3 D4, B2: D3 F#3 A3, E2: D3 G#3 B3 F#4, A2: C3 E3 G3, D2: C3 F#3 A3, G2: B2 D3 F#3 A3, G2: B2 D3 F#3 A3,' +
      'E2: D3 G3 B3, E2: D3 G3 B3, A2: C#3 G3 B3, A2: C#3 G3 B3, A2: C3 E3 G3, A2: C3 E3 G3, D2: C3 F#3 A3, D2: C3 F#3 A3,' +
      'E2: D3 G3 B3, E2: D3 G3 B3, A2: C#3 G3 B3, A2: C#3 G3 B3, A2: C3 E3 G3, D2: C3 F#3 A3, G2: B2 D3 F#3 A3, D2: C3 F#3 A3');
    const HOOK = K.mel('r/2 E5/2 G5/2 B5/3 A5/1 G5/2 E5/4 | r/2 D5/2 F#5/2 A5/2 G#5/2 B5/4 r/2 | r/2 C6/2 B5/2 A5/2 G5/2 E5/2 C5/4 | D5/3 E5/1 F#5/2 A5/2 B5/4 r/4 |' +
      'r/2 E5/2 G5/2 B5/3 A5/1 G5/2 E5/4 | r/2 D6/2 C6/2 B5/2 G#5/2 E5/4 r/2 | r/2 A5/2 C6/2 E6/2 D6/2 C6/2 A5/2 F#5/2 | G5/6 r/2 D5/2 E5/2 G5/4 |' +
      'r/4 B4/2 D5/2 E5/4 G5/4 | F#5/2 E5/2 C#5/4 r/2 A4/2 B4/2 C#5/2 | r/4 C5/2 E5/2 G5/4 A5/4 | F#5/2 E5/2 D5/4 r/2 A4/2 C5/2 D5/2 |' +
      'r/4 B5/2 A5/2 G5/2 E5/2 D5/4 | C#5/3 E5/1 G5/4 F#5/2 E5/2 C#5/4 | r/2 C5/2 E5/2 A5/2 F#5/2 E5/2 D5/2 C5/2 | B4/4 D5/4 G5/8');
    const KICK = K.pat('x.....x...x.....'), SN = K.pat('....x..-....x..-'), CB = K.pat('x..x..x...x.x...'), GTR = [1, 0, 0.5, 0.9, 0, 0.5, 0.9, 0, 1, 0, 0.5, 0.9, 0, 0.5, 0.9, 0];
    const CONGA = { 3: 'slap', 6: 'hi', 7: 'lo', 11: 'slap', 14: 'hi', 15: 'lo' };
    Sound.addSong('pt_almoco', { bpm: 104, len: 256, swing: 0.14, vol: 0.4, verb: 0.12, echo: 0.07, echoSteps: 3,
      play(i, t, s16) {
        const bar = (i >> 4) & 15, s = i & 15, h = bar * 2 + (s >> 3), C = CHS[h], R = C[0], Bsec = bar >= 8, nh = CHS[(h + 1) & 31];
        // drums: a samba-rock kick, the backbeat (and its ghosts), swung hats, the cowbell, congas, a ganzá
        if (KICK[s]) K.kick(t, s === 0 ? 0.85 : 0.6);
        if (SN[s]) K.snare(t, SN[s] > 0.5 ? 0.42 : 0.12);
        K.hat(t, (s & 1) ? 0.55 : 0.3); if (s === 14 && (bar & 1)) K.hat(t, 0.4, true);
        if (CB[s] && !Bsec) K.cowbell(t, 0.5, (s & 4) !== 0);
        const cg = CONGA[s]; if (cg) K.conga(t, cg, 0.75);
        if (!(s & 1)) K.shaker(t, (s & 3) === 2 ? 0.8 : 0.4);
        if (Bsec && (s === 4 || s === 12)) K.claps(t, 0.45);
        // the finger bass: root, its octave, the fifth, a flat seventh, then a walk into the next chord
        const bs = { 0: [R, 3], 3: [R + 12, 1], 4: [R + 7, 2], 7: [R + 10, 1] }[s & 7];
        if (bs) K.fbass(bs[0], t, bs[1] * s16 * 0.95, (s & 7) === 0 ? 0.95 : 0.7);
        if ((s & 7) === 6 && nh[0] !== R) K.fbass(nh[0] - 1, t, s16 * 0.9, 0.6);
        // the guitar's balanço: muted chords in sixteenths, down and up; the Rhodes on the beat, anticipating the next chord
        const gv = GTR[s]; if (gv) K.strum(C.slice(1).map(m => m + 12), t, gv * 0.55, 0.075, 1.5, (s & 1) === 1 || s % 3 === 2);
        if ((s & 7) === 0) for (let k = 1; k < C.length; k++) K.epiano(C[k] + 12, t, 3 * s16, 0.42);
        if ((s & 7) === 7) for (let k = 1; k < nh.length; k++) K.epiano(nh[k] + 12, t, 2 * s16, 0.3);
        // the hook: whistled in the verse, a flugelhorn in the bridge
        const n = HOOK[i]; if (n) K.lead(n[0] + (Bsec ? -12 : 0), t, n[1] * s16 * 0.9, Bsec ? 'flugel' : 'whistle', Bsec ? 0.8 : 0.85);
        // Sunday: the pressure cooker's hiss at the end of each verse
        if ((bar === 7 || bar === 15) && s === 12) K.brush(t, 1.6, 0.7);
        if ((bar === 7 || bar === 15) && s >= 13) K.shaker(t, 0.9);
        if (i === 0 || i === 128) K.crash(t, 0.45);
      } });
    // the app's message sound: two quick marimba notes
    Sound.addSong('fm_ping', { bpm: 300, len: 4, vol: 0.45, verb: 0.05, play(i, t) { if (i === 0) K.marimba(81, t, 0.9); if (i === 1) K.marimba(88, t, 0.8); } });
  })();
  let pingT = 0;
  function ping() {
    const now = performance.now(); if (now - pingT < 250) return; pingT = now;
    try { if (Sound.ctx && Sound.ctx.state === 'running' && Sound.out && Sound.songs.includes('fm_ping')) Sound.deck('fm_ping', Sound.out, { loop: false }); else Sound.play('pip'); } catch (e) { /* no audio */ }
  }
  // ---------------- {mimo}'s chinelos (the finale's gift): coral soles, white straps, a little yellow flower
  let CHIN = null;
  function chinelos() {
    if (CHIN || !G || !G.cast || !G.cast.mimo || !G.cast.mimo.body) return CHIN;
    const g = new THREE.Group(), k = ZHF.Kit();
    for (const s of [-1, 1]) {
      k.box(s * 0.14, 0.012, 0.2, 0.2, 0.032, 0.34, '#ff7a59', { ink: 0.008 });
      k.rod([s * 0.14, 0.03, 0.32], [s * 0.14 - 0.085, 0.085, 0.16], 0.013, '#fffaf0', { ink: 0.004 }).rod([s * 0.14, 0.03, 0.32], [s * 0.14 + 0.085, 0.085, 0.16], 0.013, '#fffaf0', { ink: 0.004 });
      k.ball(s * 0.14, 0.045, 0.32, 0.026, 0.026, 0.026, '#ffd23f', { ink: 0 });
    }
    ZHF.bake(g, k); g.visible = false; G.cast.mimo.body.add(g); CHIN = g; return g;
  }
  const chinelosOn = () => !!(G && G.state && G.state.lang === 'pt' && G.state.fm && G.state.fm.chinelos && !G.state.fm.chinelosOff);

  // ================================================================ every frame
  const FEAST = { on: false, talk: false, next: 0, talkers: [], who: {} };
  let lookT = 2;
  function update(dt, t, you) {
    if (!B) return;
    const on = shown() && !(G.indoors && G.indoors()), Y = G.sim.you, st = on ? S() : null;
    const near = on && (FEAST.on || Math.hypot(Y.x - TOWER.x, Y.z - TOWER.z) < 170);
    B.root.visible = near;
    for (const c of B.colliders) { const off = !on || (B.festSolid.includes(c) && !FEAST.on); c.x = c.x0 + (off ? 1e5 : 0); c.z = c.z0; }
    B.vo.hidden = !on;
    B.fest.visible = on && FEAST.on;
    for (const p of Object.values(B.fam)) { p.root.visible = FEAST.on && !!FEAST.who[p.id]; p.hidden = !p.root.visible; }
    if (G.cast) { const ch = chinelos(); if (ch) ch.visible = chinelosOn(); }
    if (!on) { ZHF.music.want('fm', null, 0); ZHF.music.frame(t); return; }
    ZHF.music.want('fm', MUS.level > 0 ? MUS.name : null, MUS.level, { duck: MUS.duck }); ZHF.music.frame(t);
    if (!near) return;
    // Vó looks at her phone, now and then up at you (or laughs at the group)
    const v = B.vo;
    if (LENT.vo && !FEAST.on) { const a = LENT.vo; v.x = a.x; v.z = a.z; v.y = B.gy(a.x, a.z) + (a.dy || 0); v.yaw = v.baseYaw = a.yaw || 0; v.pose = a.pose || 'cheer'; v.hop = a.hop || 0; ZHF.animate(v, dt, t, null); return; }
    if (!FEAST.on) {
      // (the 'cards' pose: head bent, both hands forward: reading her phone; 'sulk' when the group's gone quiet)
      if ((lookT -= dt) <= 0) { lookT = 2.5 + Math.random() * 4; v.headTurn = Math.random() < 0.4 ? 0.35 : 0; v.nod = !VO_SAD.on && Math.random() < 0.3 ? 0.5 : 0; }
      if (!VO_SAD.scene) v.pose = VO_SAD.on ? 'sulk' : 'cards';
      ZHF.animate(v, dt, t, null);
    }
    if (FEAST.on) { ZHF.animate(v, dt, t, null); for (const p of Object.values(B.fam)) if (p.root.visible) ZHF.animate(p, dt, t, null); chatterStep(dt); }
  }
  const VO_SAD = { on: false, scene: false };
  // other modules can borrow Vó for a scene (baile.js: Kauã's baile at the pond): she sits where they say, in their pose
  // ({ x, z, yaw, pose, hop, dy }: change the object's fields to move her), until lent back with null
  const LENT = { vo: null };
  function lend(who, at) {
    if (who !== 'vo' || !B) return;
    LENT.vo = at || null;
    if (!at) { const v = B.vo, C = SPOT.chair; v.x = C.x; v.z = C.z; v.y = B.gy(v.x, v.z); v.yaw = v.baseYaw = C.yaw; v.pose = 'cards'; v.hop = 0; v.faceAt = null; }
  }

  // ================================================================ the phone: the chats live in the save (G.state.fm.log), so the group's
  // history is there whenever you open it
  const PRIV = ['davi', 'lari', 'sonia', 'zeca'];
  function linkChats() {
    const st = S();
    const mk = (id, def) => { const c = PRS.chat(id, def); if (!st.log[id]) st.log[id] = []; c.msgs = st.log[id]; if (c.msgs.length > 160) c.msgs.splice(0, c.msgs.length - 160); return c; };
    mk(GROUP, { title: GROUP_TITLE, avatar: { emoji: '🌻', bg: '#ffe9a8' }, members: ['vo', 'tiao', 'sonia', 'zeca', 'davi', 'lari', 'malu'] });
    mk('vo', { title: 'Vó Dita', avatar: { icon: 'fmVo', bg: '#ffe3ec' }, members: ['vo'], sub: 'online', hidden: !st.pv });
    for (const id of PRIV) mk(id, { title: FAM[id].name, avatar: { icon: FAM[id].icon, bg: '#e8f4ff' }, members: [id], sub: 'online', hidden: !st.pv5 });
  }
  // a chapter's messages: where each chat stood when it began (so a chapter left halfway starts over cleanly)
  function begin(n, ids) { const st = S(); st.marks = st.marks || {}; const m = st.marks[n] || (st.marks[n] = {}); for (const id of ids) { const c = PRS.chat(id); if (m[id] === undefined) m[id] = c.msgs.length; else c.msgs.length = Math.min(c.msgs.length, m[id]); } }
  function finish(n) { const st = S(); if (st.marks) delete st.marks[n]; }
  const post = (chat, who, text, en, o) => PRS.post(chat, Object.assign({ from: who, text, en }, o || {}));
  const ask = (chat, o) => PRS.ask(chat, o);
  const quitThought = () => think('Vó Dita: «Depois a gente continua, meu bem!» (we’ll carry on later, dear!)', 3.5);

  // ================================================================ scenes (out in the world)
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  function speaker(who) {
    if (who === 'vo') return B.vo;
    if (B.fam[who]) return B.fam[who];
    return null;
  }
  function say(who, key) {
    const p = speaker(who); if (!p || typeof STORY === 'undefined') return Promise.resolve();
    const L = lineOf(key); p.name = (FAM[who] || {}).name || ''; p.lines = { en: L.en, pt: L.pt };
    return STORY.sayInline(p, true);
  }
  const you = text => STORY.you(text), think = (text, s) => STORY.think(text, s);
  const lock = on => { if (G) G.sim.lock = on ? 1 : 0; };
  function standAt(at, look) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = at.x; Y.z = at.z; Y.yaw = Math.atan2(look.x - Y.x, look.z - Y.z);
    M.x = at.x + Math.cos(Y.yaw) * 0.9; M.z = at.z - Math.sin(Y.yaw) * 0.9; M.station = null; M.wander = null; M.look = { x: look.x, z: look.z };
    [Y.x, Y.z] = WORLD.pushOut(Y.x, Y.z, 0.4); [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3); G.sim.snap();
  }
  const standBy = () => { const v = B.vo, d = 1.8; standAt({ x: v.x + Math.sin(v.baseYaw) * d, z: v.z + Math.cos(v.baseYaw) * d }, v); };
  function shotVo() { const v = B.vo, f = { x: v.x + Math.sin(v.baseYaw) * 3.2, z: v.z + Math.cos(v.baseYaw) * 3.2 }, s = { x: Math.cos(v.baseYaw) * 1.3, z: -Math.sin(v.baseYaw) * 1.3 }; G.cam.override = { pos: V3(f.x + s.x, v.y + 1.6, f.z + s.z), look: V3(v.x, v.y + 0.75, v.z) }; }
  const shot = (p, l) => { G.cam.override = { pos: V3(p[0], p[1], p[2]), look: V3(l[0], l[1], l[2]) }; };
  async function scene(fn) {
    lock(true);
    try { await fn(); } catch (e) { console.error('[familia] scene', e); }
    finally { G.cam.override = null; lock(false); if (G.sim.mimo) G.sim.mimo.look = null; if (!FEAST.on) G.fx.hush = 0; if (G.save) G.save(); }
  }
  const coins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; try { Sound.play('chest'); } catch (e) { /* */ } UI.toast(`${why}: +${n} coins`); };
  const teachAll = ids => ids.forEach(id => CVUI.teach(id));
  async function phone(id, fn) {
    linkChats(); PRS.open(id);
    try { return await fn(); } finally { PRS.close(); if (G.save) G.save(); }
  }

  // ================================================================ chapter 1: entrando no grupo (joining the group)
  async function meet() {
    const st = S();
    await scene(async () => {
      standBy(); shotVo(); VO_SAD.scene = true; B.vo.pose = 'wave';
      await say('vo', 'fm.vo.hi'); B.vo.pose = 'cards';
      await say('vo', 'fm.vo.group'); await say('vo', tiaoAwake() ? 'fm.vo.tiao1' : 'fm.vo.tiao0');
      B.vo.pose = 'point'; await say('vo', 'fm.vo.phone'); B.vo.pose = 'cards'; VO_SAD.scene = false;
      st.met = true; st.phone = true;
      UI.toast('You got Vô Tião’s old phone, with «Prosa», the family’s chat app.');
    });
    const go = await UI.choose('Vó Dita: «Vamos lá, meu bem?» (Shall we, dear?)', [{ label: 'Chapter 1: Entrando no grupo, now', sub: 'join the family group on the phone', value: 1 }, { label: 'Later', value: 0 }]);
    if (go) await chapter1();
  }
  async function chapter1() {
    const st = S(); linkChats(); begin(1, [GROUP]);
    const g = GROUP, sayIt = (w, t, e, o) => post(g, w, t, e, o);
    const r = await phone(g, async () => {
      if (!PRS.chat(g).msgs.length) {      // what was there before you joined: a week of Vó talking to nobody
        PRS.push(g, { day: 'Semana passada' });
        PRS.push(g, { from: 'vo', text: 'Bom dia, família! 🌻', en: 'Good morning, family! 🌻', img: 'bomdia1', t: '06:58' });
        PRS.push(g, { from: 'vo', text: 'Gente??? Ninguém responde 😢', en: 'Folks??? Nobody answers 😢', t: '19:40' });
        PRS.push(g, { from: 'vo', text: 'Quem vem almoçar no domingo?', en: 'Who’s coming for lunch on Sunday?', t: '20:15' });
        PRS.push(g, { day: 'Hoje' }); PRS.push(g, { sys: 'Vó Dita adicionou você' });
        PRS.chat(g).unread = 0; PRS.show(g);
      }
      await sayIt('vo', 'Gente, olha quem chegou! 🥰', 'Folks, look who’s here! 🥰');
      let gr = await ask(g, { kind: 'Your message', goal: 'Say good morning to the whole family.', model: 'Bom dia, família!', modelEn: 'Good morning, family!', keys: ['bom dia', 'oi gente', 'oi familia', 'ola', 'boa tarde', 'boa noite', 'oi', 'e ai', 'ola familia'] });
      if (gr === 'quit') return gr;
      await sayIt('vo', 'Bom dia, meu bem! Que alegria ter você aqui! 😍 Tudo bem?', 'Good morning, dear! What a joy to have you here! 😍 How are you?');
      gr = await ask(g, { goal: 'Say you’re fine, and ask her back. To a grandma, Brazilians say «a senhora» (the respectful «you»).', model: 'Tudo bem, e a senhora?', modelEn: 'Fine, and you?',
        check: t => {
          if (!has(t, ['bem', 'otimo', 'beleza', 'tranquilo', 'suave', 'tudo certo', 'joia', 'tudo otimo', 'bem e'])) return { ok: false, why: 'Say how you are: «Tudo bem!», «Tô bem!»…' };
          if (has(t, 'senhora')) return { ok: true, note: '«a senhora»: just right with a grandma!' };
          return { ok: true, minor: true, note: has(t, ['e voce', 'e vc', 'e tu']) ? 'With a grandma, «e a senhora?» is warmer than «e você?»' : 'Ask her back: «E a senhora?»' };
        } });
      if (gr === 'quit') return gr;
      await sayIt('vo', 'Tudo ótimo, graças a Deus! 🙏', 'All great, thank God! 🙏');
      await sayIt('vo', '', '', { img: 'bomdia2' });
      await sayIt('vo', 'Gostou? Fui eu que escolhi! 😊', 'Do you like it? I picked it myself! 😊');
      gr = await ask(g, { goal: 'Answer her flower picture, warmly.', model: 'Que linda, vó! Bom dia pra senhora também!', modelEn: 'So pretty, Grandma! Good morning to you too!',
        check: t => has(t, ['linda', 'lindo', 'lindas', 'lindos', 'amei', 'adorei', 'bonita', 'bonito', 'maravilhosa', 'que fofa', 'fofo', 'perfeita', 'obrigado', 'obrigada', 'valeu', 'bom dia', 'amem'])
          ? { ok: true, minor: !has(t, ['linda', 'lindo', 'amei', 'adorei', 'bonita', 'maravilhosa', 'fofa']), note: 'She’ll love that.' } : { ok: false, why: 'Something warm: «Que linda!», «Amei!», «Bom dia pra senhora também!»' } });
      if (gr === 'quit') return gr;
      await sayIt('malu', '', '', { sticker: 'mimoDance' });
      await sayIt('malu', 'KKKKK é a figurinha do Mimo!! 🥳 (é a Malu, no celular da mamãe)', 'LOL it’s the Mimo sticker!! 🥳 (it’s Malu, on mom’s phone)');
      await sayIt('vo', 'O que é figurinha? 🤔', 'What’s a «figurinha»? 🤔');
      gr = await ask(g, { goal: 'A «figurinha» is a sticker. Ask Malu to send another one!', model: 'Manda outra figurinha, Malu!', modelEn: 'Send another sticker, Malu!',
        check: t => has(t, ['manda', 'mande', 'envia', 'envie', 'mais uma', 'outra']) && has(t, ['figurinha', 'figurinhas', 'sticker', 'outra', 'mais uma']) ? { ok: true, minor: !has(t, ['figurinha', 'figurinhas']), note: has(t, 'figurinha') ? '' : '«Manda outra figurinha!»' } : { ok: false, why: 'Ask her: «Manda outra figurinha!»' } });
      if (gr === 'quit') return gr;
      await sayIt('malu', '', '', { sticker: 'mimoHeart' });
      await sayIt('malu', 'Pronto! 💛', 'There you go! 💛');
      await sayIt('vo', 'Ai, que coisa mais fofa! Agora eu tenho que fazer o almoço. Beijo, gente! 😘', 'Oh, how cute! Now I have to make lunch. Kisses, everyone! 😘');
      gr = await ask(g, { goal: 'Say bye with a kiss, the Brazilian way.', model: 'Um beijo, vó! 😘', modelEn: 'Lots of love, Grandma!',
        check: t => has(t, ['beijo', 'beijos', 'bjs', 'bjo', 'beijao', 'beijinho', 'abraco', 'abracos', 'abs', 'tchau', 'ate mais', 'ate logo']) ? { ok: true, minor: !has(t, ['beijo', 'beijos', 'bjs', 'bjo', 'beijao', 'beijinho']), note: has(t, ['beijo', 'beijos', 'bjs', 'beijinho']) ? '' : 'Family chats end with a kiss: «Um beijo!» «Bjs!»' } : { ok: false, why: '«Um beijo, vó!» or «Bjs!»' } });
      if (gr === 'quit') return gr;
      await sayIt('vo', '😘😘😘');
      return 'done';
    });
    if (r === 'quit') { quitThought(); return; }
    finish(1); st.ch[1] = true; teachAll(['ph.fm.bomdia', 'ph.fm.senhora', 'ph.fm.figurinha', 'ph.fm.beijo']);
    await scene(async () => { standBy(); shotVo(); VO_SAD.scene = true; B.vo.pose = 'cheer'; await say('vo', 'fm.vo.done1'); B.vo.pose = 'cards'; VO_SAD.scene = false; });
    coins(4, 'Vó Dita slips you some coins «pro lanche» (for a snack)');
  }

  // ================================================================ chapter 2: internetês (texting Portuguese)
  const NET = [
    ['vc', 'Você!', ['voce'], 'you', 'Meu bem, te chamei no privado. Me explica: o que é «vc»?', 'Dear, I messaged you privately. Explain it to me: what’s «vc»?'],
    ['tb', 'Também!', ['tambem'], 'too, also', 'E «tb»?', 'And «tb»?'],
    ['pq', 'Porque!', ['porque', 'por que', 'por quê'], 'because (or «por quê?»: why?)', 'E «pq»? 🤔', 'And «pq»? 🤔'],
    ['blz', 'Beleza!', ['beleza'], 'okay, all good', 'E «blz»?', 'And «blz»?'],
    ['sdds', 'Saudades!', ['saudade', 'saudades'], 'I miss you', 'E «sdds»? 🥺', 'And «sdds»? 🥺'],
    ['tmj', 'Tamo junto!', ['tamo junto', 'tamos juntos', 'estamos juntos'], 'we’re in this together', 'E «tmj»?', 'And «tmj»?'],
  ];
  async function chapter2() {
    const st = S(); st.pv = true; linkChats(); PRS.chat('vo').hidden = false; begin(2, [GROUP, 'vo']);
    await scene(async () => { standBy(); shotVo(); await say('vo', 'fm.vo.ch2'); });
    const r = await phone(GROUP, async () => {
      const g = GROUP;
      await post(g, 'davi', 'oi gnt, vc tb vem no domingo? pq eu n sei se vou kkkkk', 'hi everyone, are you coming Sunday too? cuz idk if I’m going lol');
      await post(g, 'lari', 'blz, tmj rs', 'okay, got your back :)');
      await post(g, 'davi', 'sdds da vó 🥺', 'miss you grandma 🥺');
      await post(g, 'vo', 'Gente, não entendi NADA 😅', 'Folks, I didn’t understand a THING 😅');
      PRS.show('vo');
      for (const [abbr, model, keys, en, q, qEn] of NET) {
        await post('vo', 'vo', q, qEn);
        const gr = await ask('vo', { kind: 'Internetês', goal: `Tell Vó what «${abbr}» stands for (${en}).`, model, modelEn: en, keys });
        if (gr === 'quit') return gr;
        await post('vo', 'vo', CVUI.pick(['Ahhh! 😮', 'Entendi! 👍', 'Olha só! 😄', 'Que coisa! Kkkk']), '');
      }
      await post('vo', 'vo', 'E esse «kkkkk»? O Davi tá passando mal?? 😟', 'And this «kkkkk»? Is Davi feeling sick?? 😟');
      let gr = await ask('vo', { kind: 'Internetês', goal: 'No: «kkkkk» is how Brazilians laugh in text. Tell her!', model: 'Não, vó! É risada!', modelEn: 'No, Grandma! It’s laughter!', check: t => has(t, ['risada', 'rindo', 'rir', 'gargalhada', 'haha', 'rs', 'risos', 'rir muito']) ? { ok: true } : { ok: false, why: '«É risada!» (it’s laughter!)' } });
      if (gr === 'quit') return gr;
      await post('vo', 'vo', 'E os bonequinhos? O que quer dizer esse: 👍', 'And the little pictures? What does this one mean: 👍');
      gr = await ask('vo', { kind: 'Emojis', goal: 'What do Brazilians call 👍? (A thumbs-up: «joinha»!)', model: 'É joinha!', modelEn: 'It’s a thumbs-up!', check: t => has(t, ['joinha']) ? { ok: true, note: 'Careful: to young people, a lone 👍 can feel a bit dry!' } : has(t, ['ok', 'beleza', 'tudo certo', 'certo', 'combinado', 'positivo', 'legal']) ? { ok: true, minor: true, note: 'Its name is «joinha»!' } : { ok: false, why: '«É joinha!» (thumbs up)' } });
      if (gr === 'quit') return gr;
      await post('vo', 'vo', 'E esse aqui: 🙏', 'And this one: 🙏');
      gr = await ask('vo', { kind: 'Emojis', goal: 'What does 🙏 say? (Thanks, please, or amém.)', model: 'É obrigado, ou amém!', modelEn: 'It’s thank you, or amen!', check: t => has(t, ['obrigado', 'obrigada', 'amem', 'por favor', 'gratidao', 'valeu', 'gracas', 'agradecer']) ? { ok: true } : { ok: false, why: '«É obrigado!» or «Amém!»' } });
      if (gr === 'quit') return gr;
      await post('vo', 'vo', 'Agora me ensina a falar igual a eles. Como eu escrevo «saudades de você» bem curtinho?', 'Now teach me to talk like them. How do I write «saudades de você» nice and short?');
      gr = await ask('vo', { kind: 'Write it in internetês', goal: 'Write «saudades de você» the short way.', model: 'sdds de vc', modelEn: 'miss you', check: t => { const a = has(t, 'sdds'), b = has(t, 'vc'); return a && b ? { ok: true } : a || b ? { ok: true, minor: true, note: '«sdds de vc»' } : { ok: false, why: '«sdds» + «vc»…' }; } });
      if (gr === 'quit') return gr;
      await post('vo', 'vo', 'Ai, que chique! 😎 Vou mandar pro Davi!', 'Oh, how fancy! 😎 I’m sending it to Davi!');
      PRS.show(g);
      await post(g, 'vo', 'sdds de vc, Davi!! 😂', 'miss you, Davi!! 😂');
      await post(g, 'davi', 'KKKKKKK a vó tá craque!!', 'LOLOL grandma’s a pro!!');
      await post(g, 'lari', 'amei vó kkkk', 'love it grandma lol');
      gr = await ask(g, { kind: 'Your message', goal: 'Now answer Davi his way: you’re going on Sunday too. Short, in internetês!', model: 'Vou tb, blz?', modelEn: 'I’m going too, okay?',
        check: t => { const go = has(t, ['vou', 'to indo', 'vamo', 'eu vou', 'bora', 'colo', 'vou sim']), ab = has(t, ['tb', 'blz', 'vc', 'tmj', 'kkk', 'kkkk', 'rs', 'pq', 'sdds']); return go ? { ok: true, minor: !ab, note: ab ? '' : 'Try the internetês: «tb», «blz»…' } : { ok: false, why: 'Say you’re going too: «Vou tb!»' }; } });
      if (gr === 'quit') return gr;
      await post(g, 'davi', 'tmj!! 🤜🤛', 'got your back!! 🤜🤛');
      return 'done';
    });
    if (r === 'quit') { quitThought(); return; }
    finish(2); st.ch[2] = true; teachAll(['ph.fm.internetes', 'ph.fm.sdds', 'ph.fm.kkk', 'ph.fm.joinha']);
    await scene(async () => { standBy(); shotVo(); VO_SAD.scene = true; B.vo.pose = 'cheer'; await say('vo', 'fm.vo.done2'); B.vo.pose = 'cards'; VO_SAD.scene = false; });
    coins(4, 'Vó Dita pays you in bolo de fubá (and coins)');
  }

  // ================================================================ chapter 3: os áudios (the voice messages)
  const AUDIO1 = { dur: '4:58', pt: 'Oi, gente, é a vó… Ó, domingo agora eu vou fazer aquela macarronada, viu? Com frango assado e farofa. O almoço é ao meio-dia, mas vocês sabem que aqui sempre atrasa um pouquinho, né? Ah! E o Biscoito, o cachorro da vizinha, comeu o meu chinelo de novo! Acredita? Enfim… quem vem, me avisa, tá? Beijo da vó!',
    en: 'Hi, everyone, it’s Grandma… Listen, this Sunday I’m making that macarronada, okay? With roast chicken and farofa. Lunch is at noon, but you know it always runs a little late here, right? Oh! And Biscoito, the neighbor’s dog, ate my flip-flop again! Can you believe it? Anyway… whoever’s coming, let me know, okay? Kisses from Grandma!' };
  const AUDIO_ZECA = { dur: '0:07', pt: 'Fala, família! O tio Zeca aqui! Domingo vai ter sobremesa? Eu levo o pavê. Mas é pavê… ou é pra comer? Kkkkk!', en: 'Hey, family! Uncle Zeca here! Is there dessert on Sunday? I’ll bring the pavê. But is it pavê… or is it for eating? Hahaha!' };
  async function chapter3() {
    const st = S(); linkChats(); begin(3, [GROUP]);
    await scene(async () => { standBy(); shotVo(); await say('vo', 'fm.vo.ch3'); });
    const r = await phone(GROUP, async () => {
      const g = GROUP;
      await post(g, 'vo', 'Gente, vou mandar um áudio, que é mais fácil 😅', 'Folks, I’ll send a voice message, it’s easier 😅');
      const a1 = await post(g, 'vo', '', '', { audio: AUDIO1, text: undefined });
      await post(g, 'davi', 'Vó, áudio de 5 minutos não!! 😂', 'Grandma, not a 5-minute voice message!! 😂');
      await post(g, 'lari', 'coloca no 2x kkkk', 'put it on 2x lol');
      await PRS.listen(g, a1);
      await post(g, 'davi', 'Gente, resume pra mim? O que a vó vai fazer de almoço?', 'Can someone sum it up for me? What’s grandma making for lunch?');
      let gr = await ask(g, { kind: 'What did she say?', goal: 'Tell Davi what Vó is cooking.', model: 'Macarronada, com frango e farofa!', modelEn: 'Macarronada, with chicken and farofa!',
        check: t => { const m = has(t, ['macarronada', 'macarrao']), f = has(t, ['frango', 'farofa']); return m ? { ok: true, minor: !f, note: f ? '' : '…com frango assado e farofa, too!' } : f ? { ok: true, minor: true, note: 'The main dish: «macarronada»!' } : { ok: false, why: 'Play it again: what is she making on Sunday?' }; } });
      if (gr === 'quit') return gr;
      await post(g, 'lari', 'E que horas é o almoço?', 'And what time is lunch?');
      gr = await ask(g, { kind: 'What did she say?', goal: 'Tell Lari what time lunch is.', model: 'Ao meio-dia!', modelEn: 'At noon!',
        check: t => has(t, ['meio dia', 'meiodia']) ? { ok: true, minor: !has(t, ['ao meio dia']), note: has(t, ['ao meio dia']) ? '' : '«ao meio-dia» (at noon)' } : /\b12\b|12h|12:00/.test(String(t)) ? { ok: true, minor: true, note: 'Brazilians say «ao meio-dia».' } : { ok: false, why: 'Listen again for the time…' } });
      if (gr === 'quit') return gr;
      await post(g, 'davi', 'E o que o Biscoito aprontou? kkkk', 'And what did Biscoito get up to? lol');
      gr = await ask(g, { kind: 'What did she say?', goal: 'Tell Davi what the neighbor’s dog ate.', model: 'Comeu o chinelo da vó!', modelEn: 'He ate Grandma’s flip-flop!', check: t => has(t, ['chinelo', 'chinelos']) ? { ok: true, minor: !has(t, ['comeu', 'comendo']), note: '' } : { ok: false, why: 'It was something she wears on her feet…' } });
      if (gr === 'quit') return gr;
      await post(g, 'vo', 'E aí, quem vem? Me manda um áudio! 🎤', 'So, who’s coming? Send me a voice message! 🎤');
      gr = await ask(g, { kind: 'Your áudio', goal: 'Send Vó a voice message: say you’re coming (and maybe when you’ll get there).', model: 'Oi, vó! Eu vou, sim! Chego ao meio-dia.', modelEn: 'Hi, Grandma! I’m coming, for sure! I’ll get there at noon.', audio: true,
        check: t => has(t, ['vou', 'eu vou', 'to indo', 'vamos', 'claro', 'com certeza', 'sim', 'chego', 'estarei', 'vou sim']) ? { ok: true, minor: !has(t, ['vou', 'chego']), note: '' } : { ok: false, why: 'Tell her you’re coming: «Eu vou, sim!»' } });
      if (gr === 'quit') return gr;
      await post(g, 'vo', '', '', { audio: { dur: '0:09', pt: 'Ai, que bom! Então eu vou fazer comida pra um batalhão! Kkkk', en: 'Oh, wonderful! Then I’ll cook for an army! Haha' } });
      const az = await post(g, 'zeca', '', '', { audio: AUDIO_ZECA });
      await PRS.listen(g, az);
      await post(g, 'lari', 'ai tio… 🙄', 'oh, uncle… 🙄');
      gr = await ask(g, { kind: 'The uncle joke', goal: 'Answer Tio Zeca’s joke the way every Brazilian family does: it’s for eating! (Or roll your eyes: «Ai, tio…»)', model: 'É pra comer, tio! Kkkk', modelEn: 'It’s for eating, uncle! Haha',
        check: t => has(t, ['pra comer', 'para comer', 'ai tio', 'kkk', 'kkkk', 'haha', 'rs', 'tio']) ? { ok: true, minor: !has(t, ['pra comer', 'para comer', 'ai tio']), note: '«Pavê» sounds like «pra ver» (for looking at). Every family has this uncle!' } : { ok: false, why: '«É pra comer, tio!» or «Ai, tio…»' } });
      if (gr === 'quit') return gr;
      await post(g, 'zeca', 'KKKKK essa nunca falha! 😂', 'HAHA this one never fails! 😂');
      return 'done';
    });
    if (r === 'quit') { quitThought(); return; }
    finish(3); st.ch[3] = true; teachAll(['ph.fm.audio', 'ph.fm.avisa', 'ph.fm.meiodia', 'ph.fm.pave']);
    await scene(async () => { standBy(); shotVo(); VO_SAD.scene = true; B.vo.pose = 'cheer'; await say('vo', 'fm.vo.done3'); B.vo.pose = 'cards'; VO_SAD.scene = false; });
    coins(5, 'Tio Zeca sends you coins «pro pavê» (for the pavê)');
  }
  // ================================================================ chapter 4: o almoço de domingo (planning it in the group)
  const FOODS = [
    { id: 'pudim', keys: ['pudim'], pt: 'o pudim', en: 'the flan' }, { id: 'suco', keys: ['suco', 'sucos'], pt: 'o suco', en: 'the juice' },
    { id: 'salada', keys: ['salada'], pt: 'a salada', en: 'the salad' }, { id: 'paodequeijo', keys: ['pao de queijo', 'paes de queijo'], pt: 'o pão de queijo', en: 'the cheese bread' },
    { id: 'brigadeiro', keys: ['brigadeiro', 'brigadeiros'], pt: 'os brigadeiros', en: 'the brigadeiros' }, { id: 'sorvete', keys: ['sorvete'], pt: 'o sorvete', en: 'the ice cream' },
    { id: 'refri', keys: ['refrigerante', 'refri', 'guarana'], pt: 'o refri', en: 'the soda' }, { id: 'farofa', keys: ['farofa'], pt: 'a farofa', en: 'the farofa' },
    { id: 'arroz', keys: ['arroz'], pt: 'o arroz', en: 'the rice' }, { id: 'torta', keys: ['torta'], pt: 'a torta', en: 'the pie' }, { id: 'fruta', keys: ['fruta', 'frutas', 'melancia', 'abacaxi'], pt: 'as frutas', en: 'the fruit' },
  ];
  async function chapter4() {
    const st = S(); linkChats(); begin(4, [GROUP]);
    await scene(async () => { standBy(); shotVo(); await say('vo', 'fm.vo.ch4'); });
    const r = await phone(GROUP, async () => {
      const g = GROUP;
      await post(g, 'vo', 'Família, vamos organizar o almoço de domingo! Quem leva o quê? 📝', 'Family, let’s organize Sunday lunch! Who’s bringing what? 📝');
      await post(g, 'vo', 'Eu faço a macarronada e o frango. 🍝🍗', 'I’m making the macarronada and the chicken. 🍝🍗');
      await post(g, 'sonia', 'Eu levo a maionese! 🥗', 'I’ll bring the maionese! 🥗 (Brazilian potato salad)');
      await post(g, 'zeca', 'E eu, o pavê! 😏', 'And me, the pavê! 😏');
      await post(g, 'lari', 'eu levo o bolo de chocolate 🎂', 'I’ll bring the chocolate cake 🎂');
      await post(g, 'davi', 'guaraná fica comigo 🥤', 'guaraná’s on me 🥤');
      await post(g, 'vo', 'E você, meu bem? Vai levar o quê?', 'And you, dear? What will you bring?');
      let gr = await ask(g, { kind: 'Your message', goal: 'Say what you’ll bring: «Eu levo…» (o pudim, o suco, a salada, o pão de queijo, os brigadeiros…)', model: 'Eu levo o pudim!', modelEn: 'I’ll bring the flan!',
        check: t => { const f = FOODS.find(x => has(t, x.keys)), lv = has(t, ['levo', 'trago', 'vou levar', 'posso levar', 'eu levo', 'fico com']); if (f && lv) return { ok: true, said: f.id }; if (f) return { ok: true, minor: true, note: 'Say it like the others: «Eu levo…»' }; if (lv) return { ok: true, minor: true, note: 'Name the food: «Eu levo o pudim!»' }; return { ok: false, why: '«Eu levo…» and something to eat or drink.' }; } });
      if (gr === 'quit') return gr;
      { const last = PRS.chat(g).msgs.filter(m => m.from === 'me').pop(), f = last && FOODS.find(x => has(last.text || '', x.keys)); st.brings = f ? f.id : 'pudim'; }
      await post(g, 'vo', 'Que delícia! 😋', 'Yum! 😋');
      // the forwarded message: a gentle «check before you forward»
      await post(g, 'sonia', '↪ Encaminhada\n⚠️URGENTE⚠️ Médicos confirmam: tomar banho depois do almoço dá congestão!!! Repasse pra todos os grupos!!!', '↪ Forwarded\n⚠️URGENT⚠️ Doctors confirm: taking a shower after lunch gives you indigestion!!! Forward to every group!!!');
      await post(g, 'vo', 'Ai, meu Deus! Será que é verdade? 😨 Vou repassar!', 'Oh my goodness! Could it be true? 😨 I’m forwarding it!');
      gr = await ask(g, { kind: 'Kindly', goal: 'Gently stop the chain: suggest checking before forwarding. (Kind words: nobody’s in trouble.)', model: 'Calma, vó! Melhor conferir antes de repassar.', modelEn: 'Easy, Grandma! Better check before forwarding.',
        check: t => has(t, ['conferir', 'verificar', 'checar', 'pesquisar', 'confirmar', 'fake', 'mentira', 'boato', 'nao e verdade', 'nao repassa', 'nao repasse', 'antes de repassar', 'antes de compartilhar', 'nao compartilha', 'confere', 'verifica', 'checa']) ? { ok: true, minor: !has(t, ['calma', 'vo', 'tia', 'melhor', 'por favor', 'acho']), note: 'Kind and clear.' } : { ok: false, why: 'Suggest checking first: «Melhor conferir antes de repassar.»' } });
      if (gr === 'quit') return gr;
      await post(g, 'sonia', 'Ai, é mesmo… nem conferi. Vou apagar! Valeu pelo toque! 😅', 'Oh, you’re right… I didn’t even check. I’ll delete it! Thanks for the heads-up! 😅');
      await post(g, 'vo', 'Muito bem! Aqui em casa a gente confere antes. 👍', 'Well done! In this house we check first. 👍');
      // directions for Davi, who's coming by train
      await post(g, 'davi', 'Gente, eu vou de trem. Da estação, como eu chego na casa da vó? Faz tanto tempo… 😬', 'Folks, I’m coming by train. From the station, how do I get to grandma’s? It’s been so long… 😬');
      await post(g, 'vo', 'Olha o mapinha! 📍', 'Look at the little map! 📍', { img: 'mapa' });
      gr = await ask(g, { kind: 'Directions 1/3', goal: 'From the station: follow the road (a estrada) to Alba’s plaza.', model: 'Segue a estrada até a praça de Alba.', modelEn: 'Follow the road to Alba’s plaza.',
        check: t => has(t, ['segue', 'siga', 'vai', 'va', 'pega', 'continua', 'anda']) && has(t, ['praca', 'alba', 'estrada', 'reto']) ? { ok: true, minor: !has(t, 'praca'), note: '' } : { ok: false, why: '«Segue a estrada até a praça…»' } });
      if (gr === 'quit') return gr;
      gr = await ask(g, { kind: 'Directions 2/3', goal: 'At the plaza: take the north street (a rua do norte).', model: 'Na praça, pega a rua do norte.', modelEn: 'At the plaza, take the north street.',
        check: t => has(t, 'norte') ? { ok: true, minor: !has(t, ['pega', 'segue', 'siga', 'vai', 'sobe', 'entra']), note: '«Pega a rua do norte» (pegar: to take a street)' } : { ok: false, why: '«Na praça, pega a rua do norte.»' } });
      if (gr === 'quit') return gr;
      gr = await ask(g, { kind: 'Directions 3/3', goal: 'Then turn left into the back lane: Vó’s is the house with the green door.', model: 'Depois, vira à esquerda. A casa da vó é a da porta verde!', modelEn: 'Then turn left. Grandma’s is the one with the green door!',
        check: t => has(t, 'esquerda') ? { ok: true, minor: !has(t, ['vira', 'vire', 'dobra']), note: '' } : has(t, 'direita') ? { ok: false, why: 'Walking north, the back lane is on the left: «vira à esquerda».' } : { ok: false, why: '«Vira à esquerda…»' } });
      if (gr === 'quit') return gr;
      await post(g, 'davi', 'Valeu!! Agora não tem erro 🙌', 'Thanks!! Now I can’t get lost 🙌');
      await post(g, 'zeca', 'Davi, sabe por que o livro de matemática vive triste? Porque tem muitos problemas! Kkkkk', 'Davi, know why the math book is always sad? Because it has so many problems! Hahaha');
      await post(g, 'lari', 'tio pelo amor de deus 😂', 'uncle, for the love of god 😂');
      return 'done';
    });
    if (r === 'quit') { quitThought(); return; }
    finish(4); st.ch[4] = true; teachAll(['ph.fm.levo', 'ph.fm.conferir', 'ph.fm.verdade', 'ph.fm.pega']);
    await scene(async () => { standBy(); shotVo(); VO_SAD.scene = true; B.vo.pose = 'cheer'; await say('vo', 'fm.vo.done4'); B.vo.pose = 'cards'; VO_SAD.scene = false; });
    coins(5, 'Davi sends you coins «pela ajuda» (for the help)');
  }

  // ================================================================ chapter 5: o Silêncio no grupo (the Hush mutes the family), and the lunch
  const BACK = {      // what each of them answers, once you write
    davi: { model: 'Davi, a vó tá com saudade! Vem pro almoço de domingo?', en: 'Davi, Grandma misses you! Come to Sunday lunch?', re: [['Caramba… é verdade, eu sumi. Tô com vergonha 😔', 'Wow… it’s true, I disappeared. I’m embarrassed 😔'], ['Pode deixar: domingo eu tô lá! 🚆', 'Count on it: on Sunday I’ll be there! 🚆']] },
    lari: { model: 'Lari, a vó sente sua falta! Vem no domingo?', en: 'Lari, Grandma misses you! Come on Sunday?', re: [['ai… eu fiquei tão ocupada que esqueci de todo mundo 🥺', 'oh… I got so busy I forgot about everyone 🥺'], ['vou mandar um áudio pra vó agora!', 'I’m sending grandma a voice message right now!']] },
    sonia: { model: 'Tia, a vó tá sozinha. Vamos fazer o almoço de domingo?', en: 'Auntie, Grandma’s all alone. Shall we have Sunday lunch?', re: [['Ai, minha mãe… 😢 Você tem razão.', 'Oh, my mom… 😢 You’re right.'], ['Vou ligar pra ela agora mesmo!', 'I’m calling her right now!']] },
    zeca: { model: 'Tio, a família precisa de você! E do pavê! 😂', en: 'Uncle, the family needs you! And the pavê! 😂', re: [['Kkkkk tá bom, tá bom!', 'Hahaha okay, okay!'], ['O pavê vai! E eu junto! 💪', 'The pavê is coming! And me with it! 💪']] },
  };
  const backCheck = t => {
    const love = has(t, ['saudade', 'sdds', 'falta', 'sozinha', 'triste', 'precisa', 'vo', 'avo', 'vovo', 'familia', 'mae', 'sogra', 'ama', 'amo', 'carinho']), come = has(t, ['almoco', 'domingo', 'vem', 'venha', 'vamos', 'bora', 'volta', 'aparece', 'liga', 'responde', 'visita', 'vai', 'pave']);
    if (love && come) return { ok: true, note: '' };
    if (love || come) return { ok: true, minor: true, note: love ? 'Invite them too: «Vem pro almoço de domingo?»' : 'Tell them why: «A vó tá com saudade!»' };
    return { ok: false, why: 'Tell them Vó misses them, and invite them: «A vó tá com saudade! Vem pro almoço?»' };
  };
  async function chapter5() {
    const st = S(); linkChats(); begin(5, [GROUP, ...PRIV]);
    VO_SAD.on = true;
    await scene(async () => { standBy(); shotVo(); G.fx.hush = 0.3; await say('vo', 'fm.vo.sad'); await say('vo', 'fm.vo.alone'); await you('The Hush got into her family group. Nobody reads, nobody answers… Let’s bring them back, one by one.'); });
    let grades = [];
    const r = await phone(GROUP, async () => {
      const g = GROUP;
      PRS.mute(g, true, 'visto por último há uma semana');
      await post(g, 'vo', 'Bom dia, família… 🌻', 'Good morning, family… 🌻', { img: 'bomdia3' });
      await post(g, 'vo', 'Gente?', 'Folks?');
      await post(g, 'vo', 'Alguém aí?', 'Anyone there?');
      await post(g, 'vo', 'Tô com saudade de vocês… 😢', 'I miss you all… 😢');
      st.pv5 = true; linkChats();
      for (const id of PRIV) { PRS.chat(id).hidden = false; if (!st.back[id]) PRS.mute(id, true, 'visto por último há 9 dias'); }
      // write to each of them, in private: whichever you pick
      for (let guard = 0; PRIV.some(id => !st.back[id]) && guard < 30; guard++) {
        const want = PRIV.find(id => !st.back[id]);
        const id = await PRS.pickChat({ want, task: ['Bring them back', `Write to them in private, one by one: pick someone. (${PRIV.filter(k => st.back[k]).length}/4 back)`] });
        if (!PRIV.includes(id) || st.back[id]) { if (id === g || id === 'vo') try { UI.toast('Write to Davi, Lari, Tia Sônia and Tio Zeca in private!'); } catch (e) { /* */ } continue; }
        PRS.show(id);
        const b = BACK[id];
        const gr = await ask(id, { kind: `To ${FAM[id].name}`, goal: `Write to ${FAM[id].name}: Vó misses them, and invite them to Sunday lunch.`, model: b.model, modelEn: b.en, check: backCheck });
        if (gr === 'quit') return gr;
        grades.push(gr);
        PRS.mute(id, false); PRS.read(id);
        for (const [pt, en] of b.re) await post(id, id, pt, en);
        st.back[id] = true;
      }
      // the group wakes up
      PRS.show(g); PRS.mute(g, false); PRS.read(g);
      await post(g, 'davi', 'VÓ!!! 😭❤️', 'GRANDMA!!! 😭❤️');
      await post(g, 'lari', '', '', { audio: { dur: '0:06', pt: 'Vó, desculpa a demora! Te amo muito!', en: 'Grandma, sorry it took so long! I love you so much!' } });
      await post(g, 'sonia', 'Mãe, domingo a gente tá aí! ❤️', 'Mom, on Sunday we’ll be there! ❤️');
      await post(g, 'zeca', 'Pavê confirmado! 😂', 'Pavê confirmed! 😂');
      await post(g, 'malu', '', '', { sticker: 'mimoHeart' });
      await post(g, 'vo', 'Ai, meu coração… 😭❤️ Vamos fazer uma chamada de vídeo?', 'Oh, my heart… 😭❤️ Shall we do a video call?');
      let gr = await ask(g, { kind: 'Your message', goal: 'Say yes: start the video call!', model: 'Bora! Liga, vó!', modelEn: 'Let’s go! Call, Grandma!', keys: ['bora', 'liga', 'sim', 'vamos', 'chamada', 'video', 'claro', 'vamo', 'com certeza'] });
      if (gr === 'quit') return gr;
      grades.push(gr);
      // the video call: everyone at once, the classic way (somebody's finger on the camera)
      const call = PRS.callView(['vo', 'sonia', 'zeca', 'davi', 'lari', 'malu'].map(k => ({ key: k, name: FAM[k].name, icon: FAM[k].icon })), 'Chamada de vídeo · Família Ribeiro 🌻');
      const chaos = [['vo', 'Tá me ouvindo?? Tá travando!'], ['davi', 'Vó, tira o dedo da câmera kkkk'], ['zeca', 'Alô? Alô? 📢'], ['lari', 'oi gente!!'], ['sonia', 'Mãe, a senhora tá linda!'], ['malu', 'Eu tô aqui! Eu tô aqui!'], ['vo', 'Quem tá falando?'], ['zeca', 'Todo mundo ao mesmo tempo, igual sempre! Kkkk']];
      for (const [k, txt] of chaos) { call.say(k, txt); try { Sound.play('blip', 'town'); } catch (e) { /* */ } await new Promise(res => setTimeout(res, PRS.fast ? 10 : 600)); }
      gr = await ask(g, { kind: 'On the call', goal: 'Everyone’s talking at once. Tell them how much you missed them all!', model: 'Oi, gente! Que saudade de vocês!', modelEn: 'Hi, everyone! I missed you all so much!',
        check: t => has(t, ['saudade', 'sdds']) ? { ok: true, minor: !has(t, ['de voces', 'de vcs', 'voces']), note: has(t, ['voces', 'vcs']) ? '' : '«Que saudade de vocês!» (you all)' } : has(t, ['oi gente', 'oi familia', 'ola']) ? { ok: true, minor: true, note: '«Que saudade de vocês!»' } : { ok: false, why: '«Que saudade de vocês!»' } });
      if (gr === 'quit') return gr;
      grades.push(gr);
      call.say('vo', 'Domingo, todo mundo aqui! Meio-dia! 🍝'); await new Promise(res => setTimeout(res, PRS.fast ? 10 : 1400));
      call.end();
      return 'done';
    });
    G.fx.hush = 0;
    if (r === 'quit') { VO_SAD.on = false; quitThought(); return; }
    VO_SAD.on = false;
    const lg = await lunch();
    if (!lg) { think('Vó Dita: «Domingo que vem a gente almoça junto, viu?» (next Sunday we eat together, okay?)', 4); return; }
    finish(5); st.ch[5] = true; st.parGrades = grades.concat(lg);
    teachAll(['ph.fm.saude', 'ph.fm.delicia', 'ph.fm.passa', 'ph.fm.saudadevcs']);
    coins(20, 'The whole family passes the hat («uma vaquinha») for you');
    think(`${MIMO()} keeps looking at its new chinelos. The family group hasn’t stopped buzzing since.`, 5);
  }
  // ---------------- the Sunday lunch, at the long table in the lane: everyone talking at once
  const music = (name, level) => { MUS.name = name; MUS.level = level; };
  function feastOn() {
    FEAST.on = true; FEAST.who = { sonia: true, davi: true, lari: true, zeca: true }; FEAST.talk = false; FEAST.next = 0;
    const v = B.vo; v.x = SEATS.vo[0]; v.z = SEATS.vo[1]; v.y = B.gy(v.x, v.z); v.yaw = v.baseYaw = SEATS.vo[2]; v.pose = 'cheer'; VO_SAD.scene = true;
    FEAST.talkers = [v, ...Object.values(B.fam)];
    if (typeof CARNAVAL !== 'undefined' && CARNAVAL.lend) {
      CARNAVAL.lend('malu', { x: SEATS.malu[0], z: SEATS.malu[1], yaw: SEATS.malu[2], pose: 'cheer' });
      if (tiaoAwake()) CARNAVAL.lend('tiao', { x: SEATS.tiao[0], z: SEATS.tiao[1], yaw: SEATS.tiao[2], pose: 'idle' });
    }
    standAt(SPOT.you5, { x: SPOT.table.x, z: SPOT.table.z }); const M = G.sim.mimo; M.x = SPOT.you5.x + 1.0; M.z = SPOT.you5.z + 0.05; G.sim.snap();
    lock(true);
  }
  function feastOff() {
    FEAST.on = false; FEAST.talk = false;
    for (const b of B.chatter) { B.root.remove(b.sp); b.sp.material.map.dispose(); b.sp.material.dispose(); } B.chatter.length = 0;
    const v = B.vo, C = SPOT.chair; v.x = C.x; v.z = C.z; v.y = B.gy(v.x, v.z); v.yaw = v.baseYaw = C.yaw; v.pose = 'cards'; VO_SAD.scene = false;
    if (typeof CARNAVAL !== 'undefined' && CARNAVAL.lend) { CARNAVAL.lend('malu', null); CARNAVAL.lend('tiao', null); }
    for (const p of Object.values(B.fam)) p.pose = 'idle';
    MUS.level = 0; G.cam.override = null; lock(false); G.fx.hush = 0;
  }
  const LUNCH_CALLS = [
    { model: 'É pra comer, tio!', modelEn: 'It’s for eating, uncle!', keys: ['pra comer', 'para comer', 'ai tio', 'kkk', 'kkkk', 'tio'], title: 'Tio Zeca, of course: «É pavê ou pra comer?» Answer him!', icon: '🍮', who: 'zeca' },
    { model: 'Saúde!', modelEn: 'Cheers!', keys: ['saude', 'um brinde', 'brinde', 'tim tim', 'viva'], title: 'Everyone raises a glass of guaraná. Make the toast!', icon: '🥤', who: 'all' },
    { model: 'Passa a farofa, por favor!', modelEn: 'Pass the farofa, please!', title: 'The farofa is at the other end of the table. Ask for it!', icon: '🥣', who: 'davi',
      check: t => has(t, ['passa', 'passe', 'me passa', 'pode passar', 'me da', 'me de', 'alcanca']) && has(t, 'farofa') ? { ok: true, minor: !has(t, ['por favor', 'pf', 'pfv', 'por gentileza']), note: has(t, ['por favor', 'pf']) ? '' : '«…por favor!»' } : { ok: false, why: '«Passa a farofa, por favor!»' } },
    { model: 'Tá uma delícia, vó!', modelEn: 'It’s delicious, Grandma!', keys: ['delicia', 'gostoso', 'gostosa', 'maravilhoso', 'maravilhosa', 'que delicia', 'bom demais', 'ta otimo', 'perfeito', 'perfeita'], title: 'Tell Vó the macarronada is delicious!', icon: '🍝', who: 'vo' },
  ];
  async function lunch() {
    let quit = false; const grades = [];
    try {
      await UI.fade(1, 500); feastOn(); shot(...SPOT.cam5); await UI.fade(0, 500);
      music('pt_almoco', 0.5);
      await say('vo', 'fm.vo.welcome');
      FEAST.talk = true;
      await ZHF.wait(2.4);
      for (const [who, key] of [['sonia', 'fm.sonia.lunch'], ['davi', 'fm.davi.lunch'], ['lari', 'fm.lari.lunch'], ['zeca', 'fm.zeca.lunch']]) { const p = B.fam[who]; p.pose = 'point'; await say(who, key); p.pose = 'idle'; }
      CVUI.hud.open('O almoço de domingo');
      for (let i = 0; i < LUNCH_CALLS.length; i++) {
        const c = LUNCH_CALLS[i];
        CVUI.hud.cue({ icon: c.icon, title: c.title, sub: `Say it in Portuguese! (${i + 1}/${LUNCH_CALLS.length})`, bar: i / LUNCH_CALLS.length });
        const g = await CVUI.hud.call({ model: c.model, modelEn: c.modelEn, keys: c.keys, check: c.check });
        if (g === 'quit') { quit = true; break; }
        grades.push(g);
        const all = [B.vo, ...Object.values(B.fam)];
        if (c.who === 'all') { all.forEach(p => { p.pose = 'cheer'; }); for (let k = 0; k < 4; k++) { try { Sound.play('chime'); } catch (e) { /* */ } await ZHF.wait(0.15); } }
        else { const p = c.who === 'vo' ? B.vo : B.fam[c.who]; if (p) p.pose = 'cheer'; G.sim.mimo.happy = 1; }
        await ZHF.wait(1.3); all.forEach(p => { p.pose = p === B.vo ? 'cheer' : 'idle'; });
      }
      CVUI.hud.close();
      if (quit) return null;
      // the gift: {mimo}'s chinelos
      const M = G.sim.mimo; shot([M.x + 1.4, 1.6, M.z - 1.6], [M.x, 0.4, M.z]);
      await say('vo', 'fm.vo.gift');
      const st = S(); st.chinelos = true; st.chinelosOff = false; const ch = chinelos(); if (ch) ch.visible = true;
      M.happy = 2; M.glow = 1; G.sim.emit('learned', {}); UI.toast(`${MIMO()} wears Vó Dita’s little chinelos!`);
      shot(...SPOT.cam5); FEAST.next = 0;
      await say('vo', 'fm.vo.end');
      await ZHF.wait(2.5);
      await UI.fade(1, 600);
      return grades;
    } finally { CVUI.hud.close(); feastOff(); if (G.save) G.save(); await UI.fade(0, 500); }
  }
  // ================================================================ the menu
  const CH = [
    { n: 1, title: 'Entrando no grupo', sub: 'join the family group on the phone', gate: f => !!f.rosa, wait: 'after Rosa’s welcome', run: chapter1 },
    { n: 2, title: 'Internetês', sub: 'vc, tb, pq, kkkkk and the emojis', gate: f => !!f.boss, wait: 'after the big Hushling on the hill', run: chapter2 },
    { n: 3, title: 'Os áudios', sub: 'Vó’s famous voice messages', gate: f => (f.bells || 0) >= 1, wait: 'after the first bell', run: chapter3 },
    { n: 4, title: 'O almoço de domingo', sub: 'plan the family lunch in the group', gate: f => (f.bells || 0) >= 2, wait: 'after the second bell', run: chapter4 },
    { n: 5, title: 'O Silêncio no grupo', sub: 'bring the family back together', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell', run: chapter5 },
  ];
  // the group, just to read (and, once a day, Vó's «Bom dia» picture)
  function browse() {
    const st = S(); linkChats();
    const today = new Date().toDateString();
    if (st.ch[1] && st.lastBD !== today) { st.lastBD = today; PRS.push(GROUP, { day: 'Hoje' }); PRS.push(GROUP, { from: 'vo', text: CVUI.pick(['Bom dia, família! ☀️', 'Bom dia! Que Deus abençoe o dia de vocês! 🙏', 'Bom diaaa! Café tá pronto! ☕']), en: 'Good morning, family!', img: CVUI.pick(['bomdia1', 'bomdia2']) }); if (st.ch[5]) { PRS.push(GROUP, { from: 'davi', text: 'bom dia vó!! ❤️', en: 'morning grandma!! ❤️' }); PRS.push(GROUP, { from: 'malu', sticker: 'mimoDance' }); } }
    return new Promise(res => { PRS.onClose = () => { if (G.save) G.save(); res(); }; PRS.open(GROUP); });
  }
  let talking = false;
  async function voTalk() { if (talking) return; talking = true; try { await voTalk0(); } finally { talking = false; } }
  async function voTalk0() {
    const st = S(), f = flags();
    if (!st.met) return meet();
    const next = CH.find(c => !st.ch[c.n]), opts = [];
    if (next) opts.push(next.gate(f) ? { label: `Chapter ${next.n}: ${next.title}`, sub: next.sub, value: 'next' } : { label: `Chapter ${next.n}: ${next.title}`, sub: `later: ${next.wait}`, value: 'wait' });
    if (st.ch[1]) opts.push({ label: 'Open the family group', sub: GROUP_TITLE + ' on «Prosa»', value: 'phone' });
    opts.push({ label: 'Chat', value: 'chat' });
    if (st.chinelos) opts.push({ label: st.chinelosOff ? `Put the chinelos back on ${MIMO()}` : `Take ${MIMO()}’s chinelos off`, value: 'chin' });
    const v = await UI.choose('Vó Dita: «Oi, meu bem! Senta aqui um pouquinho.» (Hi, dear! Sit with me a little.)', opts);
    if (v === 'next') return next.run();
    if (v === 'wait') return scene(async () => { standBy(); shotVo(); await say('vo', 'fm.vo.wait'); });
    if (v === 'phone') return browse();
    if (v === 'chat') { st.chat = (st.chat || 0) + 1; return scene(async () => { standBy(); shotVo(); await say('vo', st.ch[5] ? 'fm.vo.idle4' : ['fm.vo.idle1', 'fm.vo.idle2', 'fm.vo.idle3'][st.chat % 3]); }); }
    if (v === 'chin') { st.chinelosOff = !st.chinelosOff; UI.toast(st.chinelosOff ? 'Chinelos off.' : `${MIMO()} slips on its chinelos.`); if (G.save) G.save(); }
  }
  const PROVIDER = {
    interactables() {
      if (!B || !shown() || PRS.busy || CVUI.busy || FEAST.on || (G.indoors && G.indoors())) return [];
      const L = [], Y = G.sim.you, v = B.vo;
      if (Math.hypot(Y.x - v.x, Y.z - v.z) < 12) L.push({ x: v.x, z: v.z, y: B.gy(v.x, v.z), r: 2.2, label: 'Talk', run: voTalk });
      return L;
    },
    tick(dt, Y) {
      if (!B || !shown()) return;
      const st = S();
      if (!st.seen && Math.hypot(Y.x - B.vo.x, Y.z - B.vo.z) < 8) { st.seen = true; think('An old lady on a colorful woven chair squints at her phone and sighs: «Ai, esse celular…»', 4.5); }
    },
  };
  // ================================================================ the quest (quests.js LIST: pt games only)
  function quest() {
    const y = s => s.fm || {}, ch = (s, n) => !!(y(s).ch && y(s).ch[n]), at = () => (B ? { x: B.vo.x, z: B.vo.z } : SPOT.chair);
    const step = (n, text, why, hint) => ({ get text() { const c = CH[n - 1]; return c && !c.gate(flags()) ? text : text.replace(/ \(after [^)]*\)$/, ''); }, why, done: s => ch(s, n), target: at, hint });
    return {
      id: 'fm', kind: 'side', title: 'Vó Dita’s family group', giver: 'Vó Dita, on her chair by the bell tower',
      started: s => s.lang === 'pt' && !!y(s).met,
      steps: [
        step(1, 'Join the family group', '«Bom dia, família!», «E a senhora?» for a grandma, warm words for her flower pictures, stickers («figurinhas») and «Um beijo!»', '{mimo} points at the old lady with the phone.'),
        step(2, 'Internetês: vc, tb, pq… (after the big Hushling on the hill)', 'Vó can’t read her grandkids’ texts. Explain vc, tb, pq, blz, sdds, tmj, kkkkk, 👍 and 🙏, then text like them.', '{mimo} taps an imaginary phone.'),
        step(3, 'Os áudios: Vó’s voice messages (after the first bell)', 'Listen to her five-minute áudio and say what she said; send your own áudio; survive Tio Zeca’s pavê joke.', '{mimo} cups its ears.'),
        step(4, 'Plan the Sunday lunch in the group (after the second bell)', 'Who brings what («Eu levo…»), a forwarded hoax («Melhor conferir antes de repassar»), directions for Davi.', '{mimo} sniffs, dreaming of macarronada.'),
        step(5, 'O Silêncio no grupo (after the third bell)', 'The Hush has silenced the family group. Bring them back, one by one.', '{mimo} hops toward Vó Dita’s door.'),
      ],
      story: [
        { when: s => !!y(s).met, text: 'Vó Dita, Malu’s grandmother and Vô Tião’s wife, runs the family group «Família Ribeiro 🌻». Since the Hush came nobody answers her. She gave you Vô Tião’s old phone.' },
        { when: s => ch(s, 1), text: 'You joined the group: «Bom dia, família!», «E a senhora?», a sticker from Malu, «Um beijo!»' },
        { when: s => ch(s, 2), text: 'You taught Vó the grandkids’ internetês: now she signs off «sdds de vc».' },
        { when: s => ch(s, 3), text: 'You listened to Vó’s famous áudio (4:58), sent your own, and answered the pavê joke.' },
        { when: s => ch(s, 4), text: 'The Sunday lunch is planned: who brings what, a hoax kindly stopped, and Davi knows the way.' },
        { when: s => ch(s, 5), text: 'The Hush silenced the group, and you brought everyone back: a chaotic video call, then the real Sunday lunch in the lane, everyone talking at once. {mimo} wears Vó’s little chinelos.' },
      ],
    };
  }
  // ================================================================ the mini-map: Vó's chair (a coral badge with a speech bubble)
  const MARK = {};
  function mapMark(dpr) {
    if (!B || !shown()) return null;
    if (!MARK[dpr]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = '#ff7a59'; c.strokeStyle = '#2b2235'; c.lineWidth = 1.4; c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 2, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(s / 2, s / 2 - 0.5, 4.6, 3.4, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(s / 2 - 2, s / 2 + 2); c.lineTo(s / 2 - 3.5, s / 2 + 5); c.lineTo(s / 2 + 0.5, s / 2 + 2.5); c.fill();
      MARK[dpr] = cv;
    }
    return { x: B.vo.x, z: B.vo.z, img: MARK[dpr] };
  }
  // ================================================================ start
  function init(game) {
    G = game; ZHF.bind(game); CVUI.bind(game); PRS.bind(game);
    registerIcons(); registerArts();
    for (const [k, m] of Object.entries(FAM)) PRS.member(k, { name: m.name, color: m.color });
    PRS.onPing = ping;
    if (typeof LEX !== 'undefined') LEX.register(PH.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', pt: p.pt, en: p.en, note: p.note, region: p.region, register: p.register, icon: p.icon, alt: p.keys ? { pt: p.keys } : undefined })));
    if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v;
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'fm')) QUESTS.LIST.push(quest());
    // Vó's own front door (alba-house-25 today; found by where it is): no «Go in» to a stranger's house in pt games
    if (typeof INTERIORS !== 'undefined' && INTERIORS.claim) {
      let doorId;
      INTERIORS.claim(id => {
        if (!shown()) return false;
        if (doorId === undefined) { try { const d = INTERIORS.doors(G).find(q => Math.hypot(q.x - SPOT.door.x, q.z - SPOT.door.z) < 1); doorId = d ? d.id : null; } catch (e) { doorId = null; } }
        return id === doorId;
      });
    }
    setInterval(() => { if (shown()) CVUI.keepFar(PH.map(p => p.id)); }, 30000);
  }
  // ================================================================ tests (the game never calls these)
  const TEST = {
    fast(on = true) { CVUI.fast = on; PRS.fast = on; },
    setup(fl) { Object.assign(G.state.flags, { hatched: true, rosa: true }, fl || {}); },
    // answer whatever's waiting (the phone, a card, the call bar) with its model answer
    panel() { if (PRS.cur) { const m = PRS.cur.model; PRS.cur.submit(m); return 'prs: ' + m; } if (CVUI.cur) { const m = CVUI.cur.model; CVUI.cur.submit(m); return 'cv card: ' + m; } if (CVUI.hcur) { const m = CVUI.hcur.model; CVUI.hcur.submit(m); return 'cv bar: ' + m; } return null; },
    drive(o = {}) { return ZHF.drive(Object.assign({ panel: () => TEST.panel(), busy: () => PRS.busy || CVUI.busy || FEAST.on }, o)); },
    get B() { return B; }, get FEAST() { return FEAST; }, get MUS() { return MUS; }, VO_SAD,
  };
  return {
    init, build, update, quest, mapMark, chinelosOn, lend, interactables: () => [],
    person: id => (B && id === 'vo' ? B.vo : null),      // (Vó's rig, for a scene somewhere else: baile.js)
    get busy() { return FEAST.on || PRS.busy; },
    _: { S: () => S(), LT, PH, FAM, NET, FOODS, BACK, AUDIO1, meet, chapter1, chapter2, chapter3, chapter4, chapter5, lunch, feastOn, feastOff, voTalk, browse, linkChats, PROVIDER, CH, SPOT, SEATS, t: TEST },
  };
})();
