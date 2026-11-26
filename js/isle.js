'use strict';
// The Mirror Lake, milestone 2 (DESIGN.md 14.5): Bartolo's words, the ferry, the old lighthouse on the island (the second
// dungeon, shaped like mill.js), the giant frog by the bell, Noa's page, and the second bell.
//   • Bartolo (story.js calls ISLE.bartolo): the Hush took his words, and his oar, lantern and rope are lost around Remanso.
//     He can only point. You find them (or ask: «¿Dónde está el remo?») and tell him where each one is, in a sentence graded
//     S–D like an attack (WHERE.grade: «El remo está debajo del muelle»). Each right one gives him back a word of
//     «¡Vamos a la isla!», and his colour comes back a little; with the third he can talk again.
//   • The ferry (rideFerry): from Remanso's ferry dock to the island's jetty and back, Bartolo singing as he rows.
//   • The old lighthouse: three round rooms floating high over the far woods (like the mill's: walls facing inward, so the
//     camera looks in), every action a sentence to Mimo in the "tell Mimo" box. Look-alikes need a position, like the
//     frogs do in battle: «la palanca de la derecha», «el jarrón del medio», «encima de la lámpara».
//       0 the flooded hall: «¡Nada!» across the water, then the lever the plaque names (left / right) lowers the bridge
//       1 the store room:  frogs jump you; three jars on a high rack, and the keeper's note says which one holds the key
//       2 the lamp room:   the lamp's shutters are latched on top: «¡Salta encima de la lámpara!» Light!
//   • Outside again: the beam finds the bell, and a giant frog surfaces beside it on its lily pad, with two look-alike
//     helpers that swap pads (left / right): the boss. Then Noa's page (north: the mountains, the quarry), and you ring the
//     bell yourself («¡Golpea la campana!»): the lake's colour comes back, bell 2 of 8, flags.lakeFree, and Bartolo
//     points north, to the Quarry Caves.
// State: state.isle (the rooms and the finale), state.lakeQ (Bartolo's things: seen, told); flags bartoloQuest, bartolo,
// ferryIsle, isleLanded, lakeFree, bells (askScene's flags asked_oar / asked_lantern / asked_rope count as knowing where).
//   ISLE.init(game) · enter() · leave() · update(dt, t) (indoors) · outdoor(dt, t) (main.js, every frame: the lake's state)
//   ISLE.interactables() (indoors) · outside() (outdoors: story.js adds them) · target() · bartolo(o) · rideFerry(toIsle)
//   ISLE.inside · ISLE.OUTSIDE · ISLE.WHERE (Bartolo's sentences) · ISLE.quest (the quest steps' targets) · ISLE._ (tests)
// Lines in es (Latin American), pt-BR, de, en (the weave) and zh / ja in game/CJK.md's notation; they merge into LINES.
const ISLE = (() => {
  let G = null;
  const { part, G: GEO } = TK;
  const Y0 = 300, RAD = 6.6, WH = 5.4;
  const ROOMS = [
    { id: 'hall', name: 'The Flooded Hall', sub: 'The old lighthouse · the ground floor', x: 108, z: 44 },
    { id: 'store', name: 'The Store Room', sub: 'The old lighthouse · the middle floor', x: 108, z: 16 },
    { id: 'lamp', name: 'The Lamp Room', sub: 'The old lighthouse · the top', x: 108, z: -12 },
  ];
  const VERBS = ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim'];
  const ITEMS = ['oar', 'lantern', 'rope'];
  const WORD = { oar: 'w.oar', lantern: 'w.lantern', rope: 'w.rope' };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const S = () => G.state.isle || (G.state.isle = {});
  const Q = () => { const q = G.state.lakeQ || (G.state.lakeQ = {}); q.seen = q.seen || {}; q.told = q.told || {}; return q; };
  const F = () => G.state.flags;
  const lang = () => UI.lang || (G && G.state.lang) || 'es';
  const ex = w => (UI.lang === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const lk = () => (G && G.lake) || null;
  const bart = () => { const L = lk(); return (L && L.objects && L.objects.bartolo) || null; };
  const W = () => (typeof LAKE !== 'undefined' ? LAKE.WATER : -0.4);
  const told = id => !!Q().told[id];
  const toldN = () => ITEMS.filter(told).length;
  const known = id => !!(Q().seen[id] || F()['asked_' + id]);
  let inside = false, cur = -1, quick = {}, scene = false, sig = '';

  // ------------------------------------------------------------ new words (Mimo can learn them), and their pictures
  const NEW_WORDS = [
    { id: 'w.oar', es: 'remo', pt: 'remo', de: 'Ruder', en: 'oar', zh: '[船桨|chuán jiǎng]', ja: 'オール', g: { es: 'm', pt: 'm', de: 'n' },
      pl: { es: 'remos', pt: 'remos', de: 'Ruder' }, icon: 'oar', alt: { de: ['Paddel', 'das Paddel', 'ein Paddel'] } },
    { id: 'w.lantern', es: 'farol', pt: 'lanterna', de: 'Laterne', en: 'lantern', zh: '[马灯|mǎ dēng]', ja: 'ランタン', g: { es: 'm', pt: 'f', de: 'f' },
      pl: { es: 'faroles', pt: 'lanternas', de: 'Laternen' }, icon: 'lantern', alt: { es: ['linterna', 'la linterna', 'una linterna'], pt: ['lampião', 'o lampião', 'um lampião'] } },
    { id: 'w.rope', es: 'cuerda', pt: 'corda', de: 'Seil', en: 'rope', zh: '[绳子|shéng zi]', ja: 'ロープ', g: { es: 'f', pt: 'f', de: 'n' },
      pl: { es: 'cuerdas', pt: 'cordas', de: 'Seile' }, icon: 'rope', alt: { es: ['soga', 'la soga', 'una soga', 'mecate', 'el mecate'], de: ['Tau', 'das Tau'] } },
    { id: 'w.island', es: 'isla', pt: 'ilha', de: 'Insel', en: 'island', zh: '[岛|dǎo]', ja: '[島|しま]', g: { es: 'f', pt: 'f', de: 'f' },
      pl: { es: 'islas', pt: 'ilhas', de: 'Inseln' }, icon: 'island' },
    { id: 'w.mountain', es: 'montaña', pt: 'montanha', de: 'Berg', en: 'mountain', zh: '[山|shān]', ja: '[山|やま]', g: { es: 'f', pt: 'f', de: 'm' },
      pl: { es: 'montañas', pt: 'montanhas', de: 'Berge' }, icon: 'mountain' },
  ];
  NEW_WORDS.forEach(w => { if (!LEX.item(w.id)) LEX.register([Object.assign({ kind: 'word' }, w)]); });
  if (typeof WORDS !== 'undefined' && Array.isArray(WORDS)) NEW_WORDS.forEach(w => { if (!WORDS.some(x => x.id === w.id)) WORDS.push(LEX.item(w.id)); });
  const bellCJK = () => { const b = LEX.item('w.bell'); if (b && !b.zh) { b.zh = '[钟|zhōng]'; b.ja = '[鐘|かね]'; } };       // (phonk.js registers the bell, after this file: init does it)
  if (typeof ICONS !== 'undefined' && ICONS.add) {
    const add = (k, fn) => { if (!ICONS.keys.includes(k)) ICONS.add(k, fn); };
    add('oar', (c, p, h) => {
      h.shape(c, p, h.poly([[-35, 27], [-29, 33], [12, -8], [6, -14]]), '#b07a48');
      h.shape(c, p, h.ell(21, -22, 18, 9, -Math.PI / 4), '#9a6a3f');
      if (p) { h.dot(c, 31, -32, 4, '#d9483b'); h.shape(c, 1, h.ell(-33, 31, 5, 5), '#8a5f3e', 1.6); }
    });
    add('lantern', (c, p, h) => {
      h.shape(c, p, h.rr(-16, -18, 32, 38, 4), '#ffe9a0');
      h.shape(c, p, h.rr(-21, -25, 42, 9, 3), '#3d4652'); h.shape(c, p, h.rr(-19, 19, 38, 9, 3), '#3d4652');
      h.shape(c, p, h.poly([[-13, -25], [0, -36], [13, -25]]), '#3d4652');
      if (p) { c.beginPath(); c.arc(0, -39, 7, Math.PI, 0); c.lineWidth = 2.6; c.strokeStyle = h.INK; c.stroke(); h.dot(c, 0, 1, 7, '#ffb347'); h.dot(c, -2, -1, 2.5, '#fff6d8'); }
    });
    add('rope', (c, p, h) => {
      h.shape(c, p, h.ell(0, 8, 33, 21), '#c9a66b'); h.shape(c, p, h.ell(0, 5, 23, 14), '#b8955a'); h.shape(c, p, h.ell(0, 3, 12, 7), '#a8864f');
      if (p) { c.beginPath(); c.moveTo(29, 12); c.quadraticCurveTo(42, 22, 36, 34); c.lineWidth = 5; c.strokeStyle = '#a8864f'; c.stroke(); }
    });
    add('island', (c, p, h) => {
      h.shape(c, p, h.ell(0, 24, 42, 12), '#4aa8d8'); h.shape(c, p, h.ell(0, 17, 31, 10), '#6fbf5a');
      h.shape(c, p, h.poly([[-8, 15], [-5, -24], [5, -24], [8, 15]]), '#f1ece0'); h.shape(c, p, h.poly([[-9, -24], [0, -36], [9, -24]]), '#c4574a');
      if (p) { c.fillStyle = '#c4574a'; c.fillRect(-7, -7, 14, 5); h.dot(c, 0, -18, 3, '#ffe9a0'); }
    });
    add('mountain', (c, p, h) => {
      h.shape(c, p, h.poly([[-40, 28], [-12, -22], [14, 28]]), '#8a8fa6'); h.shape(c, p, h.poly([[-8, 28], [16, -34], [40, 28]]), '#9fa4ba');
      if (p) h.shape(c, 1, h.poly([[9, -20], [16, -34], [24, -19], [17, -15]]), '#fdfdfd', 1.6);
    });
  }

  // ------------------------------------------------------------ what people say (merged into LINES: STORY.sayAt and UI.page use them)
  const LT = {
    'bartolo.free': {
      es: ['¡Vamos a la isla!', '¡Vamos a la isla! … ¡Ja! ¡Mi voz! ¡Puedo hablar otra vez!'],
      pt: ['Vamos pra ilha!', 'Vamos pra ilha! … Rá! A minha voz! Eu consigo falar de novo!'],
      de: ['Auf zur Insel!', 'Auf zur Insel! … Ha! Meine Stimme! Ich kann wieder sprechen!'],
      en: ['Let’s go to the {w.island}!', 'Let’s go to the {w.island}! … Ha! My voice! I can talk again!'],
      zh: ['[走|zǒu] ， [去|qù] [岛|dǎo] [上|shàng] ！', '[走|zǒu] ， [去|qù] [岛|dǎo] [上|shàng] ！ … [哈|hā] ！ [我|wǒ] [的|de] [声音|shēng yīn] ！ [我|wǒ] [又|yòu] [能|néng] [说话|shuō huà] [了|le] ！'],
      ja: ['[島|しま] へ [行|い]こう ！', '[島|しま] へ [行|い]こう ！ … ハハ ！ [声|こえ] が [出|で]た ！ また [話|はな]せる ぞ ！'] },
    'bartolo.thanks': {
      es: ['Gracias. Me devolvieron mis palabras.', 'Gracias, de verdad. El Silencio me quitó las palabras… y ustedes me las devolvieron, una por una.'],
      pt: ['Obrigado. Vocês me devolveram as minhas palavras.', 'Obrigado, de verdade. O Silêncio levou as minhas palavras… e vocês me devolveram, uma por uma.'],
      de: ['Danke. Ihr habt mir meine Worte zurückgegeben.', 'Danke, wirklich. Die Stille hat mir die Worte genommen … und ihr habt sie mir zurückgegeben, eins nach dem anderen.'],
      en: ['{c.thanks}. You gave me my words back.', '{c.thanks}, really. The Hush took my words… and you gave them back to me, one by one.'],
      zh: ['[谢谢|xiè xie] 。 [你们|nǐ men] [把|bǎ] [我|wǒ] [的|de] [话|huà] [还给|huán gěi] [了|le] [我|wǒ] 。',
        '[真|zhēn] [的|de] [谢谢|xiè xie] [你们|nǐ men] 。 [寂静|Jì jìng] [拿走|ná zǒu] [了|le] [我|wǒ] [的|de] [话|huà] … [你们|nǐ men] [一|yī] [个|gè] [一|yī] [个|gè] [地|de] [还给|huán gěi] [了|le] [我|wǒ] 。'],
      ja: ['ありがとう 。 [言葉|ことば] を [返|かえ]して くれた な 。', '[本当|ほんとう] に ありがとう 。 [静寂|せいじゃく] に [言葉|ことば] を [取|と]られた が … [君|きみ]たち が ひとつ ずつ [返|かえ]して くれた 。'] },
    'bartolo.ready': {
      es: ['El ferry está listo. ¿Vamos?', 'El ferry está listo, y mi remo también. Cuando quieran, los llevo a la isla.'],
      pt: ['A balsa está pronta. Vamos?', 'A balsa está pronta, e o meu remo também. Quando quiserem, eu levo vocês pra ilha.'],
      de: ['Die Fähre ist bereit. Los geht’s?', 'Die Fähre ist bereit, und mein Ruder auch. Wann immer ihr wollt, bringe ich euch zur Insel.'],
      en: ['The ferry’s ready. Shall we?', 'The ferry’s ready, and so is my {w.oar}. Whenever you like, I’ll take you to the {w.island}.'],
      zh: ['[渡船|dù chuán] [准备|zhǔn bèi] [好|hǎo] [了|le] 。 [走|zǒu] [吗|ma] ？',
        '[渡船|dù chuán] [准备|zhǔn bèi] [好|hǎo] [了|le] ， [我|wǒ] [的|de] [船桨|chuán jiǎng] [也|yě] [在|zài] 。 [你们|nǐ men] [什么|shén me] [时候|shí hou] [想|xiǎng] [去|qù] ， [我|wǒ] [就|jiù] [送|sòng] [你们|nǐ men] [去|qù] [岛|dǎo] [上|shàng] 。'],
      ja: ['フェリー は [準備|じゅんび] できた 。 [行|い]こう か ？', 'フェリー も オール も [準備|じゅんび] できた 。 いつ でも [島|しま] へ [連|つ]れて [行|い]く ぞ 。'] },
    'bartolo.again': {
      es: ['¿Vamos a la isla? ¡El ferry está listo!'], pt: ['Vamos pra ilha? A balsa está pronta!'], de: ['Fahren wir zur Insel? Die Fähre ist bereit!'],
      en: ['Shall we go to the {w.island}? The ferry’s ready!'],
      zh: ['[去|qù] [岛|dǎo] [上|shàng] [吗|ma] ？ [渡船|dù chuán] [准备|zhǔn bèi] [好|hǎo] [了|le] ！'],
      ja: ['[島|しま] へ [行|い]く か ？ フェリー は [準備|じゅんび] できて いる ぞ ！'] },
    'bartolo.song': {
      es: ['♪ Rema, rema, barquero… ♪', '♪ Rema que rema, barquero, que el agua canta contigo… ♪'],
      pt: ['♪ Rema, rema, barqueiro… ♪', '♪ Rema, rema, barqueiro, que a água canta com você… ♪'],
      de: ['♪ Rudre, rudre, Fährmann … ♪', '♪ Rudre, rudre, Fährmann, das Wasser singt mit dir … ♪'],
      en: ['♪ Row, row, ferryman… ♪', '♪ Row and row, ferryman, the {w.water} sings along with you… ♪'],
      zh: ['♪ [划|huá] [呀|ya] [划|huá] ， [摆渡|bǎi dù] [人|rén] … ♪', '♪ [划|huá] [呀|ya] [划|huá] ， [摆渡|bǎi dù] [人|rén] ， [湖水|hú shuǐ] [陪|péi] [你|nǐ] [唱歌|chàng gē] … ♪'],
      ja: ['♪ こげ 、 こげ 、 [船頭|せんどう] さん … ♪', '♪ こげ よ こげ 、 [船頭|せんどう] さん 、 [水|みず] も いっしょ に [歌|うた]う よ … ♪'] },
    // the long ride out to the island (rideFerry): the islets, the gulls, the lighthouse ahead, a second verse; and coming home
    'bartolo.islets': {
      es: ['¿Ven esas islitas? Son las Hermanas.', '¿Ven esas islitas? Las llamamos «las Hermanas». De niño, nadaba de una a otra.'],
      pt: ['Estão vendo aquelas ilhotas? São as Irmãs.', 'Estão vendo aquelas ilhotas? A gente chama de «as Irmãs». Quando eu era menino, nadava de uma pra outra.'],
      de: ['Seht ihr die kleinen Inseln? Das sind die Schwestern.', 'Seht ihr die kleinen Inseln? Wir nennen sie „die Schwestern“. Als Kind bin ich von einer zur anderen geschwommen.'],
      en: ['See those little {w.island:pl}? They’re the Sisters.', 'See those little {w.island:pl}? We call them “the Sisters”. As a boy, I swam from one to the other.'],
      zh: ['[看到|kàn dào] [那些|nà xiē] [小岛|xiǎo dǎo] [了|le] [吗|ma] ？ [它们|tā men] [叫|jiào] [姐妹|jiě mèi] [岛|dǎo] 。',
        '[看到|kàn dào] [那些|nà xiē] [小岛|xiǎo dǎo] [了|le] [吗|ma] ？ [我们|wǒ men] [叫|jiào] [它们|tā men] [姐妹|jiě mèi] [岛|dǎo] 。 [我|wǒ] [小|xiǎo] [时候|shí hou] [从|cóng] [这个|zhè ge] [游|yóu] [到|dào] [那个|nà ge] 。'],
      ja: ['あの [小|ちい]さい [島|しま] が [見|み]える か ？ [姉妹|しまい] の [島|しま] だ 。', 'あの [小|ちい]さい [島|しま] が [見|み]える か ？ わしら は [姉妹|しまい] の [島|しま] と [呼|よ]んで いる 。 [子|こ]ども の ころ 、 [島|しま] から [島|しま] へ [泳|およ]いだ もん だ 。'] },
    'bartolo.birds': {
      es: ['¡Miren, los pájaros!', '¡Miren, los pájaros! Desde el Silencio no venían al lago. ¡Ya vuelven!'],
      pt: ['Olhem, os pássaros!', 'Olhem, os pássaros! Desde o Silêncio eles não vinham ao lago. Estão voltando!'],
      de: ['Schaut, die Vögel!', 'Schaut, die Vögel! Seit der Stille sind sie nicht mehr an den See gekommen. Jetzt kommen sie zurück!'],
      en: ['Look, the {w.bird:pl}!', 'Look, the {w.bird:pl}! Since the Hush, they stopped coming to the lake. Now they’re back!'],
      zh: ['[看|kàn] ， [鸟|niǎo] ！', '[看|kàn] ， [鸟|niǎo] ！ [寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [它们|tā men] [就|jiù] [不|bù] [来|lái] [湖|hú] [上|shàng] [了|le] 。 [现在|xiàn zài] [回来|huí lái] [了|le] ！'],
      ja: ['[見|み]て 、 [鳥|とり] だ ！', '[見|み]て 、 [鳥|とり] だ ！ [静寂|せいじゃく] から ずっと [湖|みずうみ] に [来|こ]なかった が … [帰|かえ]って きた ぞ ！'] },
    'bartolo.light': {
      es: ['¡Miren! El faro de la isla.', '¡Miren allá adelante! Ese es el faro de la isla. La isla está lejos, pero ya casi llegamos.'],
      pt: ['Olhem! O farol da ilha.', 'Olhem lá na frente! Aquele é o farol da ilha. A ilha fica longe, mas a gente já está quase chegando.'],
      de: ['Schaut! Der Leuchtturm auf der Insel.', 'Schaut da vorne! Das ist der Leuchtturm auf der Insel. Die Insel ist weit weg, aber wir sind fast da.'],
      en: ['Look! The lighthouse on the {w.island}.', 'Look up ahead! That’s the lighthouse on the {w.island}. The {w.island} is far, but we’re nearly there.'],
      zh: ['[看|kàn] ！ [岛|dǎo] [上|shàng] [的|de] [灯塔|dēng tǎ] 。', '[看|kàn] [前面|qián miàn] ！ [那|nà] [是|shì] [岛|dǎo] [上|shàng] [的|de] [灯塔|dēng tǎ] 。 [岛|dǎo] [很|hěn] [远|yuǎn] ， [不过|bú guò] [我们|wǒ men] [快|kuài] [到|dào] [了|le] 。'],
      ja: ['[見|み]て ！ [島|しま] の [灯台|とうだい] だ 。', '[前|まえ] を [見|み]て ！ あれ が [島|しま] の [灯台|とうだい] だ 。 [島|しま] は [遠|とお]い が 、 もう すぐ [着|つ]く ぞ 。'] },
    'bartolo.song2': {
      es: ['♪ Rema, rema, que ya se ve el faro… ♪', '♪ Rema que rema, barquero, que el faro nos llama desde la isla… ♪'],
      pt: ['♪ Rema, rema, que já dá pra ver o farol… ♪', '♪ Rema, rema, barqueiro, que o farol chama a gente lá da ilha… ♪'],
      de: ['♪ Rudre, rudre, da ist schon der Leuchtturm … ♪', '♪ Rudre, rudre, Fährmann, der Leuchtturm ruft uns von der Insel … ♪'],
      en: ['♪ Row, row, the lighthouse is in sight… ♪', '♪ Row and row, ferryman, the lighthouse calls us from the {w.island}… ♪'],
      zh: ['♪ [划|huá] [呀|ya] [划|huá] ， [看见|kàn jiàn] [灯塔|dēng tǎ] [了|le] … ♪', '♪ [划|huá] [呀|ya] [划|huá] ， [摆渡|bǎi dù] [人|rén] ， [灯塔|dēng tǎ] [在|zài] [岛|dǎo] [上|shàng] [叫|jiào] [我们|wǒ men] … ♪'],
      ja: ['♪ こげ 、 こげ 、 [灯台|とうだい] が [見|み]えた … ♪', '♪ こげ よ こげ 、 [船頭|せんどう] さん 、 [島|しま] の [灯台|とうだい] が [呼|よ]んで いる … ♪'] },
    'bartolo.home': {
      es: ['¡Ya se ve Remanso!', '¡Ya se ve Remanso! ¿Ven la casa amarilla? Es la de Marina.'],
      pt: ['Já dá pra ver Remanso!', 'Já dá pra ver Remanso! Estão vendo a casa amarela? É a da Marina.'],
      de: ['Da ist schon Remanso!', 'Da ist schon Remanso! Seht ihr das gelbe Haus? Das ist Marinas.'],
      en: ['There’s Remanso!', 'There’s Remanso! See the yellow {w.house}? That’s Marina’s.'],
      zh: ['[看到|kàn dào] [静水村|Jìng shuǐ cūn] [了|le] ！', '[看到|kàn dào] [静水村|Jìng shuǐ cūn] [了|le] ！ [看到|kàn dào] [那|nà] [座|zuò] [黄色|huáng sè] [的|de] [房子|fáng zi] [了|le] [吗|ma] ？ [那|nà] [是|shì] [玛丽娜|Mǎ lì nà] [的|de] [家|jiā] 。'],
      ja: ['レマンソ が [見|み]えて きた ！', 'レマンソ が [見|み]えて きた ！ [黄色|きいろ]い [家|いえ] が [見|み]える か ？ マリーナ の [家|いえ] だ 。'] },
    'bartolo.wait': {
      es: ['Aquí los espero. ¡Cuidado en el faro!', 'Yo los espero aquí, en el ferry. ¡Cuidado en el faro: dicen que algo vive allá adentro!'],
      pt: ['Eu espero vocês aqui. Cuidado no farol!', 'Eu espero vocês aqui, na balsa. Cuidado no farol: dizem que tem alguma coisa lá dentro!'],
      de: ['Ich warte hier. Vorsicht im Leuchtturm!', 'Ich warte hier auf der Fähre auf euch. Vorsicht im Leuchtturm: Man sagt, da drin wohnt etwas!'],
      en: ['I’ll wait here. Careful in the lighthouse!', 'I’ll wait for you here, on the ferry. Careful in the lighthouse: they say something lives in there!'],
      zh: ['[我|wǒ] [在|zài] [这里|zhè lǐ] [等|děng] [你们|nǐ men] 。 [灯塔|dēng tǎ] [里|lǐ] [要|yào] [小心|xiǎo xīn] ！',
        '[我|wǒ] [在|zài] [船|chuán] [上|shàng] [等|děng] [你们|nǐ men] 。 [小心|xiǎo xīn] [灯塔|dēng tǎ] ： [听说|tīng shuō] [里面|lǐ miàn] [住|zhù] [着|zhe] [什么|shén me] [东西|dōng xi] ！'],
      ja: ['ここ で [待|ま]って いる よ 。 [灯台|とうだい] で は [気|き] を つけて ！',
        'わし は フェリー で [待|ま]って いる よ 。 [灯台|とうだい] で は [気|き] を つけて な 。 [中|なか] に [何|なに]か が [住|す]んで いる らしい ！'] },
    'bartolo.frog': {
      es: ['¡Cuidado! ¡Una rana gigante!', '¡Cuidado! ¡Una rana gigante, al lado de la campana! ¡Por eso no suena!'],
      pt: ['Cuidado! Um sapo gigante!', 'Cuidado! Um sapo gigante, do lado do sino! É por isso que ele não toca!'],
      de: ['Vorsicht! Ein Riesenfrosch!', 'Vorsicht! Ein Riesenfrosch, direkt neben der Glocke! Darum läutet sie nicht!'],
      en: ['Careful! A giant frog!', 'Careful! A giant frog, right next to the {w.bell}! That’s why it doesn’t ring!'],
      zh: ['[小心|xiǎo xīn] ！ [一|yī] [只|zhī] [巨大|jù dà] [的|de] [青蛙|qīng wā] ！',
        '[小心|xiǎo xīn] ！ [钟|zhōng] [旁边|páng biān] [有|yǒu] [一|yī] [只|zhī] [巨大|jù dà] [的|de] [青蛙|qīng wā] ！ [怪不得|guài bù de] [钟|zhōng] [不|bù] [响|xiǎng] ！'],
      ja: ['[気|き] を つけて ！ [巨大|きょだい]な カエル だ ！', '[気|き] を つけて ！ [鐘|かね] の [横|よこ] に [巨大|きょだい]な カエル が いる ！ だから [鐘|かね] が [鳴|な]らない んだ ！'] },
    'bartolo.north': {
      es: ['¡La segunda campana! La próxima está al norte, en las Cuevas de la Cantera.',
        '¡Escuchen: la segunda campana! Yo sé dónde está la próxima: al norte, en las Cuevas de la Cantera, debajo de las montañas. Los mineros tenían una campana grande… y ya no suena.'],
      pt: ['O segundo sino! O próximo fica no norte, nas Cavernas da Pedreira.',
        'Escutem: o segundo sino! Eu sei onde fica o próximo: no norte, nas Cavernas da Pedreira, debaixo das montanhas. Os mineiros tinham um sino grande… e ele não toca mais.'],
      de: ['Die zweite Glocke! Die nächste ist im Norden, in den Steinbruchhöhlen.',
        'Hört doch: die zweite Glocke! Ich weiß, wo die nächste ist: im Norden, in den Steinbruchhöhlen unter den Bergen. Die Bergleute hatten eine große Glocke … und die läutet nicht mehr.'],
      en: ['The second {w.bell}! The next one is up {c.north}, in the Quarry Caves.',
        'Listen: the second {w.bell}! I know where the next one is: up {c.north}, in the Quarry Caves, under the {w.mountain:pl}. The miners had a big {w.bell}… and it doesn’t ring anymore.'],
      zh: ['[第二|dì èr] [口|kǒu] [钟|zhōng] ！ [下|xià] [一|yī] [口|kǒu] [在|zài] [北边|běi biān] [的|de] [采石场|cǎi shí chǎng] [洞穴|dòng xué] 。',
        '[听|tīng] ！ [第二|dì èr] [口|kǒu] [钟|zhōng] ！ [我|wǒ] [知道|zhī dào] [下|xià] [一|yī] [口|kǒu] [在|zài] [哪里|nǎ lǐ] ： [在|zài] [北边|běi biān] [的|de] [采石场|cǎi shí chǎng] [洞穴|dòng xué] ， [在|zài] [山|shān] [下面|xià miàn] 。 [矿工|kuàng gōng] [们|men] [有|yǒu] [一|yī] [口|kǒu] [大|dà] [钟|zhōng] … [现在|xiàn zài] [不|bù] [响|xiǎng] [了|le] 。'],
      ja: ['[二番目|にばんめ] の [鐘|かね] だ ！ [次|つぎ] は [北|きた] の [採石場|さいせきじょう] の [洞窟|どうくつ] だ 。',
        '[聞|き]け ！ [二番目|にばんめ] の [鐘|かね] だ ！ [次|つぎ] の [鐘|かね] の [場所|ばしょ] は [知|し]って いる 。 [北|きた] の [採石場|さいせきじょう] の [洞窟|どうくつ] 、 [山|やま] の [下|した] だ 。 [鉱夫|こうふ]たち に は [大|おお]きな [鐘|かね] が あった が … もう [鳴|な]らない 。'] },
    'bartolo.after': {
      es: ['¡Qué bonito suena el lago! Cuando quieran, volvemos a Remanso.'], pt: ['Que bonito o som do lago! Quando quiserem, a gente volta pra Remanso.'],
      de: ['Wie schön der See klingt! Wenn ihr wollt, fahren wir zurück nach Remanso.'], en: ['How lovely the lake sounds! Whenever you like, we’ll go back to Remanso.'],
      zh: ['[湖|hú] [的|de] [声音|shēng yīn] [真|zhēn] [好听|hǎo tīng] ！ [你们|nǐ men] [想|xiǎng] [回|huí] [静水村|Jìng shuǐ cūn] [的话|de huà] ， [随时|suí shí] [可以|kě yǐ] 。'],
      ja: ['[湖|みずうみ] の [音|おと] は いい な ！ いつ でも レマンソ へ [戻|もど]れる ぞ 。'] },
    'marina.ferry': {
      es: ['¡Bartolo habla otra vez! Vayan a la isla.', '¡Bartolo habla otra vez! Lo oigo cantar desde mi casa. Ahora sí: vayan a la isla y toquen nuestra campana.'],
      pt: ['O Bartolo fala de novo! Vão pra ilha.', 'O Bartolo fala de novo! Eu escuto ele cantar daqui de casa. Agora sim: vão pra ilha e toquem o nosso sino.'],
      de: ['Bartolo spricht wieder! Fahrt zur Insel.', 'Bartolo spricht wieder! Ich höre ihn bis zu meinem Haus singen. Jetzt aber los: Fahrt zur Insel und läutet unsere Glocke.'],
      en: ['Bartolo talks again! Go to the {w.island}.', 'Bartolo talks again! I can hear him singing from my {w.house}. Now go: to the {w.island}, and ring our {w.bell}.'],
      zh: ['[巴托洛|Bā tuō luò] [又|yòu] [能|néng] [说话|shuō huà] [了|le] ！ [去|qù] [岛|dǎo] [上|shàng] [吧|ba] 。',
        '[巴托洛|Bā tuō luò] [又|yòu] [能|néng] [说话|shuō huà] [了|le] ！ [我|wǒ] [在|zài] [家|jiā] [里|lǐ] [都|dōu] [听到|tīng dào] [他|tā] [唱歌|chàng gē] [了|le] 。 [现在|xiàn zài] [去|qù] [岛|dǎo] [上|shàng] ， [敲响|qiāo xiǎng] [我们|wǒ men] [的|de] [钟|zhōng] [吧|ba] ！'],
      ja: ['バルトロ が また [話|はな]せる よう に なった ！ [島|しま] へ [行|い]って ください 。',
        'バルトロ が また [話|はな]せる よう に なった ！ [家|いえ] まで [歌|うた] が [聞|き]こえます 。 さあ 、 [島|しま] へ [行|い]って 、 [私|わたし]たち の [鐘|かね] を [鳴|な]らして ください 。'] },
    'marina.after': {
      es: ['¡La campana suena otra vez! Gracias.', '¡Escuchen! ¡Nuestra campana suena otra vez, y el lago tiene color! Gracias de todo corazón. Bartolo dice que la próxima campana está al norte.'],
      pt: ['O sino toca de novo! Obrigada.', 'Escutem! O nosso sino toca de novo, e o lago tem cor outra vez! Muito obrigada, de coração. O Bartolo diz que o próximo sino fica no norte.'],
      de: ['Die Glocke läutet wieder! Danke.', 'Hört ihr? Unsere Glocke läutet wieder, und der See hat wieder Farbe! Danke, von Herzen. Bartolo sagt, die nächste Glocke ist im Norden.'],
      en: ['The {w.bell} rings again! {c.thanks:f}.', 'Listen! Our {w.bell} rings again, and the lake has its colors back! {c.thanks:f}, from the bottom of my heart. Bartolo says the next {w.bell} is up {c.north}.'],
      zh: ['[钟|zhōng] [又|yòu] [响|xiǎng] [了|le] ！ [谢谢|xiè xie] 。',
        '[听|tīng] ！ [我们|wǒ men] [的|de] [钟|zhōng] [又|yòu] [响|xiǎng] [了|le] ， [湖|hú] [也|yě] [有|yǒu] [颜色|yán sè] [了|le] ！ [真心|zhēn xīn] [谢谢|xiè xie] [你们|nǐ men] 。 [巴托洛|Bā tuō luò] [说|shuō] [下|xià] [一|yī] [口|kǒu] [钟|zhōng] [在|zài] [北边|běi biān] 。'],
      ja: ['[鐘|かね] が また [鳴|な]って います ！ ありがとう 。',
        '[聞|き]いて ！ [私|わたし]たち の [鐘|かね] が また [鳴|な]って 、 [湖|みずうみ] に [色|いろ] が [戻|もど]りました ！ [心|こころ] から ありがとう 。 バルトロ に よる と 、 [次|つぎ] の [鐘|かね] は [北|きた] に ある そう です 。'] },
    // Noa's notebook page, found where the giant frog sat (her own language; English with the card)
    'page.lake': {
      es: ['Desde la isla se ven las {w.mountain:pl} del norte. Mañana voy a la cantera: dicen que allí hay otra campana.'],
      pt: ['Da ilha dá pra ver as {w.mountain:pl} do norte. Amanhã eu vou pra pedreira: dizem que lá tem outro sino.'],
      de: ['Von der Insel sieht man die {w.mountain:pl} im Norden. Morgen gehe ich zum Steinbruch: Dort gibt es noch eine Glocke, sagt man.'],
      en: ['From the island you can see the mountains up north. Tomorrow I’m going to the quarry: they say there’s another bell there.'],
      zh: ['[从|cóng] [岛|dǎo] [上|shàng] [能|néng] [看到|kàn dào] [北边|běi biān] [的|de] {w.mountain} 。 [明天|míng tiān] [我|wǒ] [去|qù] [采石场|cǎi shí chǎng] ： [听说|tīng shuō] [那里|nà lǐ] [还有|hái yǒu] [一|yī] [口|kǒu] [钟|zhōng] 。'],
      ja: ['[島|しま] から [北|きた] の {w.mountain} が [見|み]える 。 [明日|あした] 、 [採石場|さいせきじょう] へ [行|い]く 。 そこ に も [鐘|かね] が ある らしい 。'] },
    // the lighthouse keeper's plaque in the flooded hall, and his note in the store room (which one depends on the save)
    'isle.lever.left': {
      es: ['La palanca de la izquierda abre la reja.'], pt: ['A alavanca da esquerda abre o portão.'], de: ['Der linke Hebel öffnet das Gitter.'],
      en: ['The lever on the left opens the gate.'], zh: ['[左边|zuǒ biān] [的|de] [拉杆|lā gān] [打开|dǎ kāi] [铁门|tiě mén] 。'],
      ja: ['[左|ひだり] の レバー で [門|もん] が [開|ひら]きます 。'] },
    'isle.lever.right': {
      es: ['La palanca de la derecha abre la reja.'], pt: ['A alavanca da direita abre o portão.'], de: ['Der rechte Hebel öffnet das Gitter.'],
      en: ['The lever on the right opens the gate.'], zh: ['[右边|yòu biān] [的|de] [拉杆|lā gān] [打开|dǎ kāi] [铁门|tiě mén] 。'],
      ja: ['[右|みぎ] の レバー で [門|もん] が [開|ひら]きます 。'] },
    'isle.jar.left': {
      es: ['La llave está en el jarrón de la izquierda.'], pt: ['A chave está no vaso da esquerda.'], de: ['Der Schlüssel ist in der linken Vase.'],
      en: ['The key is in the jar on the left.'], zh: ['[钥匙|yào shi] [在|zài] [左边|zuǒ biān] [的|de] [花瓶|huā píng] [里|lǐ] 。'],
      ja: ['[鍵|かぎ] は [左|ひだり] の [花瓶|かびん] の [中|なか] です 。'] },
    'isle.jar.middle': {
      es: ['La llave está en el jarrón del medio.'], pt: ['A chave está no vaso do meio.'], de: ['Der Schlüssel ist in der mittleren Vase.'],
      en: ['The key is in the middle jar.'], zh: ['[钥匙|yào shi] [在|zài] [中间|zhōng jiān] [的|de] [花瓶|huā píng] [里|lǐ] 。'],
      ja: ['[鍵|かぎ] は [中央|ちゅうおう] の [花瓶|かびん] の [中|なか] です 。'] },
    'isle.jar.right': {
      es: ['La llave está en el jarrón de la derecha.'], pt: ['A chave está no vaso da direita.'], de: ['Der Schlüssel ist in der rechten Vase.'],
      en: ['The key is in the jar on the right.'], zh: ['[钥匙|yào shi] [在|zài] [右边|yòu biān] [的|de] [花瓶|huā píng] [里|lǐ] 。'],
      ja: ['[鍵|かぎ] は [右|みぎ] の [花瓶|かびん] の [中|なか] です 。'] },
  };
  if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v;
  const lineOf = (key, L = lang()) => { const e = LT[key]; return e ? ((e[L] || e.en)[0]) : key; };

  // ------------------------------------------------------------ telling Bartolo where his things are (graded S–D, like an attack)
  // Each item is somewhere: the oar under the pier, the lantern on top of the red boat, the rope inside the barrel. A sentence
  // that names the thing, says where (the right position word) and names the place counts; the grade comes from the slips:
  // the article and its gender, the verb («está», not «es»), «del» / «do», German's dative after unter / auf / in, and the
  // boat's colour (there are several boats). zh / ja: lenient for now (the thing, the position and the place, in any order).
  const WANT = { oar: 'under', lantern: 'top', rope: 'inside' };
  const WD = {
    es: {
      noun: { oar: [['remo', 'm']], lantern: [['farol', 'm'], ['linterna', 'f'], ['lampara', 'f']], rope: [['cuerda', 'f'], ['soga', 'f'], ['mecate', 'm']] },
      art: { m: ['el', 'un'], f: ['la', 'una'], any: ['el', 'la', 'un', 'una', 'su', 'tu', 'mi', 'los', 'las'] },
      verb: ['esta', 'estan', 'queda', 'quedo', 'encuentra'], there: ['hay'], ser: ['es', 'son'],
      place: { oar: [['muelle', 'm'], ['embarcadero', 'm']], lantern: [['barco', 'm'], ['bote', 'm'], ['barca', 'f'], ['lancha', 'f']], rope: [['barril', 'm'], ['tonel', 'm'], ['barrica', 'f']] },
      pos: { under: ['debajo', 'abajo', 'bajo'], top: ['encima', 'arriba', 'sobre'], inside: ['dentro', 'adentro'], behind: ['detras', 'atras'], front: ['delante', 'enfrente', 'frente'], next: ['lado', 'junto', 'cerca'], left: ['izquierda'], right: ['derecha'] },
      on: ['en'], needDe: ['debajo', 'abajo', 'encima', 'arriba', 'dentro', 'adentro', 'detras', 'atras', 'delante', 'cerca', 'lado'],
      red: { m: 'rojo', f: 'roja' }, colors: ['azul', 'verde', 'amarillo', 'amarilla', 'blanco', 'blanca', 'negro', 'negra', 'naranja', 'morado', 'morada'],
      verbWord: 'está' },
    pt: {
      noun: { oar: [['remo', 'm']], lantern: [['lanterna', 'f'], ['lampiao', 'm'], ['luminaria', 'f']], rope: [['corda', 'f'], ['cabo', 'm']] },
      art: { m: ['o', 'um'], f: ['a', 'uma'], any: ['o', 'a', 'um', 'uma', 'seu', 'sua', 'meu', 'minha', 'os', 'as'] },
      verb: ['esta', 'estao', 'fica', 'ficam', 'ta'], there: ['tem', 'ha'], ser: [],
      place: { oar: [['pier', 'm'], ['cais', 'm'], ['trapiche', 'm'], ['deque', 'm']], lantern: [['barco', 'm'], ['bote', 'm'], ['barquinho', 'm'], ['canoa', 'f']], rope: [['barril', 'm'], ['tonel', 'm'], ['barrica', 'f']] },
      pos: { under: ['debaixo', 'embaixo', 'sob', 'baixo'], top: ['cima', 'sobre', 'acima'], inside: ['dentro'], behind: ['atras', 'tras', 'detras'], front: ['frente'], next: ['lado', 'perto', 'junto'], left: ['esquerda'], right: ['direita'] },
      on: ['no', 'na', 'em', 'num', 'numa'], needDe: ['debaixo', 'embaixo', 'baixo', 'cima', 'acima', 'dentro', 'atras', 'tras', 'frente', 'lado', 'perto'],
      red: { m: 'vermelho', f: 'vermelha' }, colors: ['azul', 'verde', 'amarelo', 'amarela', 'branco', 'branca', 'preto', 'preta', 'laranja', 'roxo', 'roxa'],
      verbWord: 'está' },
    de: {
      noun: { oar: [['ruder', 'n'], ['paddel', 'n']], lantern: [['laterne', 'f'], ['lampe', 'f']], rope: [['seil', 'n'], ['tau', 'n'], ['strick', 'm']] },
      art: { m: ['der', 'ein'], f: ['die', 'eine'], n: ['das', 'ein'], any: ['der', 'die', 'das', 'ein', 'eine', 'sein', 'seine', 'bartolos', 'dein', 'deine', 'mein', 'meine'] },
      verb: ['ist', 'liegt', 'steht', 'hangt', 'schwimmt', 'treibt', 'sind', 'liegen'], there: ['gibt'], ser: [],
      place: { oar: [['steg', 'm'], ['pier', 'm'], ['anleger', 'm'], ['bootssteg', 'm']], lantern: [['boot', 'n'], ['ruderboot', 'n'], ['kahn', 'm'], ['schiff', 'n']], rope: [['fass', 'n'], ['holzfass', 'n'], ['tonne', 'f']] },
      pos: { under: ['unter', 'unterm', 'darunter', 'unten'], top: ['auf', 'aufm', 'oben', 'obendrauf', 'drauf', 'darauf'], inside: ['in', 'im', 'drin', 'drinnen', 'innen', 'darin'],
        behind: ['hinter', 'hinterm', 'dahinter', 'hinten'], front: ['vor', 'vorm', 'davor', 'vorne'], next: ['neben', 'daneben', 'bei', 'beim'], left: ['links', 'linken', 'linke'], right: ['rechts', 'rechten', 'rechte'] },
      on: [], contracted: ['im', 'unterm', 'aufm', 'hinterm', 'vorm', 'beim'],
      colors: ['blauen', 'blaue', 'grunen', 'grune', 'gelben', 'gelbe', 'weißen', 'weiße', 'weissen', 'schwarzen', 'schwarze'],
      verbWord: 'ist' },
  };
  const WC = {        // zh / ja: CJK.canon's romanisation (toneless pinyin; rōmaji), matched as parts of the whole sentence
    zh: { noun: { oar: ['chuanjiang', 'jiang'], lantern: ['madeng', 'tideng', 'deng'], rope: ['shengzi', 'sheng'] },
      pos: { under: ['xiamian', 'xiabian', 'dixia', 'xia'], top: ['shangmian', 'shangbian', 'shang'], inside: ['limian', 'libian', 'li'] },
      place: { oar: ['matou'], lantern: ['chuan'], rope: ['mutong', 'tong'] } },
    ja: { noun: { oar: ['ooru', 'oru', 'kai'], lantern: ['rantan'], rope: ['roopu', 'ropu', 'tsuna'] },
      pos: { under: ['shita'], top: ['ue'], inside: ['naka'] },
      place: { oar: ['sanbashi'], lantern: ['fune', 'booto', 'boto'], rope: ['taru'] } },
  };
  const MODEL = {
    oar: { es: 'El remo está debajo del muelle.', pt: 'O remo está debaixo do píer.', de: 'Das Ruder ist unter dem Steg.', en: 'The oar is under the pier.',
      zh: '[船桨|chuán jiǎng] [在|zài] [码头|mǎ tóu] [下面|xià miàn] 。', ja: 'オール は [桟橋|さんばし] の [下|した] に あります 。' },
    lantern: { es: 'El farol está encima del barco rojo.', pt: 'A lanterna está em cima do barco vermelho.', de: 'Die Laterne ist auf dem roten Boot.', en: 'The lantern is on top of the red boat.',
      zh: '[马灯|mǎ dēng] [在|zài] [红|hóng] [船|chuán] [上|shàng] 。', ja: 'ランタン は [赤|あか]い [船|ふね] の [上|うえ] に あります 。' },
    rope: { es: 'La cuerda está dentro del barril.', pt: 'A corda está dentro do barril.', de: 'Das Seil ist im Fass.', en: 'The rope is in the barrel.',
      zh: '[绳子|shéng zi] [在|zài] [木桶|mù tǒng] [里|lǐ] 。', ja: 'ロープ は [樽|たる] の [中|なか] に あります 。' },
  };
  const plainCJK = s => (typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(s) : String(s).replace(/\[([^|\]]+)\|[^\]]*\]/g, '$1').replace(/ /g, ''));
  const model = (id, L = lang()) => { const m = MODEL[id] || MODEL.oar, s = m[L] || m.en; return L === 'zh' || L === 'ja' ? plainCJK(s) : s; };
  const SLIP = { article: 'Article missing', gender: 'Gender slip', number: 'One thing: «está», not «están»', serestar: 'Where something is takes «estar»: «está», not «es»',
    contraction: { es: '«de + el» becomes «del»', pt: '«de + o» becomes «do», «de + a» «da»' }, prep: 'Linking word slip («de»)', which: 'Which boat? Say its colour',
    case: 'Case slip: after «unter», «auf» or «in», where something is takes «dem» / «der»', ending: 'Ending slip: «auf dem roten Boot»' };
  const SOFT = { accent: 'Accent missing', style: 'Almost perfect: say exactly where (under, on top of, inside)' };
  function grade(text, L = lang()) {
    if (L === 'zh' || L === 'ja') return gradeCJK(text, L);
    const D = WD[L] || WD.es, raw = String(text || '').toLowerCase(), toks = norm(text).split(' ').filter(Boolean);
    // 1. the thing
    let item = null, ni = -1, g = null;
    for (let i = 0; i < toks.length && !item; i++) for (const id of ITEMS) { const m = D.noun[id].find(([w]) => w === toks[i]); if (m) { item = id; ni = i; g = m[1]; break; } }
    if (!item) return { ok: false, why: 'item' };
    const slips = [], soft = [];
    // 2. its article
    const art = toks[ni - 1];
    if (!art || !D.art.any.includes(art)) { if (!(L === 'de' && /s$/.test(art || '') && art !== 'das')) slips.push('article'); }
    else { const ag = ['m', 'f', 'n'].filter(k => D.art[k] && D.art[k].includes(art)); if (ag.length && !ag.includes(g)) slips.push('gender'); }
    // 3. the verb
    const hasThere = D.there.some(v => toks.includes(v)), vi = toks.findIndex(t => D.verb.includes(t));
    if (vi < 0 && !hasThere) { if (toks.some(t => D.ser.includes(t))) slips.push('serestar', 'serestar'); else slips.push('verb'); }
    else if (vi >= 0) {
      if ((L === 'es' && toks[vi] === 'estan') || (L === 'pt' && toks[vi] === 'estao') || (L === 'de' && ['sind', 'liegen'].includes(toks[vi]))) slips.push('number');
      if ((L === 'es' || L === 'pt') && toks[vi] === 'esta' && !/está/.test(raw)) soft.push('accent');
    }
    // 4. where: a position word (the specific ones first; es «en», pt «no / na» say only "in / on")
    let pi = -1, pk = null;
    for (let i = 0; i < toks.length && pi < 0; i++) for (const [k, ws] of Object.entries(D.pos)) if (ws.includes(toks[i])) { pi = i; pk = k; break; }
    if (pi < 0) { const oi = toks.findIndex((t, i) => i > ni && D.on.includes(t)); if (oi >= 0) { pi = oi; pk = 'on'; } }
    if (pi < 0) return { ok: false, why: 'pos', item };
    if (pk === 'on') { if (item === 'oar') return { ok: false, why: 'wrongPos', item, said: pk }; soft.push('style'); }
    else if (pk !== WANT[item]) return { ok: false, why: 'wrongPos', item, said: pk };
    // 5. …and the place
    let li = -1, lg = null;
    for (let i = pi + 1; i < toks.length && li < 0; i++) { const m = D.place[item].find(([w]) => w === toks[i] || (L === 'de' && toks[i].endsWith(w) && toks[i].length - w.length <= 6)); if (m) { li = i; lg = m[1]; } }
    if (li < 0) {
      const other = ITEMS.some(id => id !== item && D.place[id].some(([w]) => toks.slice(pi + 1).includes(w)));
      return { ok: false, why: other ? 'wrongPlace' : 'place', item };
    }
    const between = toks.slice(pi + 1, li), pw = toks[pi];
    // 6. the little words between the position and the place
    if (L === 'es') {
      const m = lg === 'm', needDe = D.needDe.includes(pw) && pk !== 'on';
      const b = between.filter(t => t !== D.red.m && t !== D.red.f);
      if (needDe) {
        if (b[0] === 'de' && b[1] === 'el') slips.push('contraction');
        else if (b[0] === 'del') { if (!m) slips.push('gender'); }
        else if (b[0] === 'de' && b[1] === 'la') { if (m) slips.push('gender'); }
        else if (b[0] === 'de' && (b[1] === 'un' || b[1] === 'una')) { if ((b[1] === 'un') !== m) slips.push('gender'); }
        else if (b[0] === 'de') slips.push('article');
        else slips.push('prep');
      } else if (pk !== 'on' || !['el', 'la', 'un', 'una'].includes(b[0])) {
        if (['el', 'la', 'un', 'una'].includes(b[0])) { if ((b[0] === 'el' || b[0] === 'un') !== m) slips.push('gender'); }
        else if (b[0] === 'del' || b[0] === 'de') slips.push('prep');
        else slips.push('article');
      }
    } else if (L === 'pt') {
      const m = lg === 'm', needDe = D.needDe.includes(pw);
      const b = between.filter(t => t !== D.red.m && t !== D.red.f && t !== 'em');
      if (pk === 'on') { if (['no', 'num'].includes(pw) !== m) slips.push('gender'); }
      else if (needDe) {
        if (b[0] === 'de' && (b[1] === 'o' || b[1] === 'a')) slips.push('contraction');
        else if (b[0] === 'do' || b[0] === 'dum') { if (!m) slips.push('gender'); }
        else if (b[0] === 'da' || b[0] === 'duma') { if (m) slips.push('gender'); }
        else if (b[0] === 'de') { if (!(b[1] === 'um' || b[1] === 'uma')) slips.push('article'); }
        else slips.push('prep');
      } else {
        if (['o', 'a', 'um', 'uma'].includes(b[0])) { if ((b[0] === 'o' || b[0] === 'um') !== m) slips.push('gender'); }
        else if (b[0] === 'do' || b[0] === 'da') slips.push('prep');
        else slips.push('article');
      }
    } else {
      const contracted = D.contracted.includes(pw);
      const a = between.find(t => ['dem', 'der', 'den', 'das', 'die', 'des', 'einem', 'einer', 'einen', 'ein', 'eine'].includes(t));
      if (!contracted) {
        if (!a) slips.push('article');
        else if (['den', 'das', 'die', 'des', 'einen', 'ein', 'eine'].includes(a)) slips.push('case', 'case');
        else if ((a === 'der' || a === 'einer') !== (lg === 'f')) slips.push('gender');
      } else if (lg === 'f') slips.push('gender');
    }
    // 7. which boat: the red one (the colour after the noun in es / pt, before it in German, agreeing)
    if (item === 'lantern') {
      const after = toks.slice(li + 1, li + 3), around = between.concat(after);
      if (L === 'de') {
        const adj = between.find(t => /^rot/.test(t));
        if (adj) { if (adj !== 'roten') slips.push('ending'); }
        else if (D.colors.some(c => around.includes(c))) return { ok: false, why: 'wrongPlace', item };
        else slips.push('which');
      } else {
        const right = D.red[lg], wrongG = D.red[lg === 'm' ? 'f' : 'm'];
        if (around.includes(right)) { /* ok */ }
        else if (around.includes(wrongG)) slips.push('gender');
        else if (D.colors.some(c => around.includes(c))) return { ok: false, why: 'wrongPlace', item };
        else slips.push('which');
      }
    }
    // (an accent is a tip, never a grade: «esta» read as «está»; P6a, accents.js)
    const counted = soft.filter(k => !(typeof ACCENTS !== 'undefined' ? ACCENTS.free(k) : false)), tip = soft.includes('accent') ? 'Tip: «está», with its accent' : '';
    const n = slips.length, letter = n === 0 ? (counted.length ? 'A' : 'S') : n === 1 ? 'B' : n === 2 ? 'C' : 'D';
    const k0 = slips[0], why = k0 === 'verb' ? `The verb is missing: «${D.verbWord}»` : k0 === 'contraction' ? SLIP.contraction[L] || SLIP.contraction.es : k0 ? SLIP[k0] : counted[0] ? SOFT[counted[0]] : 'Perfect sentence!' + (tip ? ' · ' + tip : '');
    return { ok: true, item, grade: letter, slips, soft, reason: why, better: model(item, L), tip };
  }
  function gradeCJK(text, L) {
    const D = WC[L], c = typeof CJK !== 'undefined' && CJK.canon ? CJK.canon(text, L) : String(text || '').toLowerCase().replace(/[^a-z]/g, '');
    const item = ITEMS.find(id => D.noun[id].some(w => c.includes(w)));
    if (!item) return { ok: false, why: 'item' };
    const want = WANT[item], said = Object.keys(D.pos).find(k => D.pos[k].some(w => c.includes(w)));
    if (!said) return { ok: false, why: 'pos', item };
    if (!D.pos[want].some(w => c.includes(w))) return { ok: false, why: 'wrongPos', item, said };
    if (!D.place[item].some(w => c.includes(w))) return { ok: false, why: 'place', item };
    return { ok: true, item, grade: 'S', slips: [], soft: [], reason: 'Perfect sentence!', better: model(item, L) };
  }
  const WHERE = { grade, model, WANT, items: ITEMS };

  // ------------------------------------------------------------ Bartolo (story.js: ISLE.bartolo({ hushed }) when you talk to him)
  // His last words before the Hush, coming back one at a time (one per thing you tell him about)
  const CHUNKS = { es: ['¡Vamos', 'a la', 'isla!'], pt: ['Vamos', 'pra', 'ilha!'], de: ['Auf', 'zur', 'Insel!'], en: ['Let’s go', 'to the', 'island!'],
    zh: ['[走|zǒu] ，', '[去|qù]', '[岛|dǎo] [上|shàng] ！'], ja: ['[島|しま]', 'へ', '[行|い]こう ！'] };
  const partialLine = (L, n) => (CHUNKS[L] || CHUNKS.en).map((w, i) => (i < n ? w : '▬▬')).join(' ');
  const plainChunk = (L, n) => { const c = (CHUNKS[L] || CHUNKS.en)[n - 1] || ''; return (L === 'zh' || L === 'ja' ? plainCJK(c) : c).replace(/[¡!，！ ]+$|^[¡]/g, ''); };
  function itemPos(id) {
    const L = lk(); if (!L) return null;
    if (id === 'lantern') { const v = new THREE.Vector3(); L.objects.items.lantern.getWorldPosition(v); return { x: v.x, y: v.y, z: v.z }; }
    const P = LAKE.layout.lost[id];
    return { x: P.x, y: id === 'rope' ? WORLD.terrainAt(P.x, P.z) + 0.9 : W() + 0.1, z: P.z };
  }
  const WHERE_EN = { oar: 'It’s under the pier!', lantern: 'It’s on top of the red boat!', rope: 'It’s inside the barrel, by Vicente’s boat!' };
  async function bartolo(o = {}) {
    const f = F(), B = bart(); if (!B) return;
    if (f.bartolo) return STORY.sayAt(B, f.lakeFree ? 'bartolo.after' : f.ferryIsle ? 'bartolo.wait' : 'bartolo.again', 'Bartolo');
    if (!f.marina) { if (o.hushed) await o.hushed(); STORY.think('Bartolo stares out at the island, gray and still.', 4); return; }
    if (!f.bartoloQuest) return bartoloStart(o);
    return tellBartolo();
  }
  // he turns, slowly, and points at his ferry: the oar's gone from its lock, the lantern from its pole, the rope from the deck
  async function bartoloStart(o) {
    const f = F(), B = bart(), L = lk(), fr = L.objects.ferry.position;
    scene = true; G.sim.lock = 1;
    try {
      if (o.hushed) await o.hushed();
      L.pinPerson('bartolo', { x: B.x, z: B.z, y: B.y, yaw: Math.atan2(fr.x - B.x, fr.z - B.z), face: false });
      G.cam.override = { pos: V(B.x + 3.2, B.y + 2.8, B.z + 4.4), look: V(fr.x - 0.5, W() + 0.6, fr.z), dur: 1.3, back: 1.0 };
      await wait(1.6);
      await STORY.you('He’s pointing at his ferry… The {w.oar}’s gone. And the {w.lantern}, and the {w.rope}.');
      await STORY.you('He can’t ask anyone where they are. But we can find them, {mimo}, and tell him!');
      f.bartoloQuest = true; sig = '';
      UI.toast('Find Bartolo’s things, then tell him where each one is');
    } finally { G.cam.override = null; L.pinPerson('bartolo', null); G.sim.lock = 0; scene = false; }
    G.save();
  }
  async function tellBartolo() {
    const q = Q(), L = lang(), left = ITEMS.filter(id => !told(id)), next = left.find(known) || left[0];
    const r = await UI.command({ name: 'Bartolo', icon: 'wave', title: 'Bartolo waits, gray and silent. Tell him where one of his things is.', verbs: [], placeholder: 'say where it is…',
      hint: 'Name the thing, then where it is: under…, on top of…, inside…', model: model(next, L), modelEn: model(next, 'en') });
    if (!r || r.cancelled) return;
    const gr = grade(r.text, L);
    if (!gr.ok) return reactNo(gr);
    if (told(gr.item)) { STORY.think(`Bartolo already has his {${WORD[gr.item]}} back. What about the others?`, 4); return; }
    return reactYes(gr, q);
  }
  async function reactNo(gr) {
    const B = bart(), M = G.sim.mimo, L = lang(), form = id => (LEX.item(WORD[id]) ? LEX.form(WORD[id], { article: true }) : id);
    Sound.play('wrong'); M.tiltT = 1.4;
    if (gr.why === 'item') { STORY.think(`Bartolo looks at you, puzzled. Which thing? Name it: «${ITEMS.map(form).join('», «')}».`, 6); return; }
    // (zh / ja: the place words in the mode's plain text: 在…下面 / zài … xiàmiàn, …の下 / … no shita)
    const cjPos = { zh: ['[在|zài] … [下面|xià miàn]', '[在|zài] … [上面|shàng miàn]', '[在|zài] … [里面|lǐ miàn]'], ja: ['… の [下|した]', '… の [上|うえ]', '… の [中|なか]'] }[L];
    if (gr.why === 'pos') { STORY.think(`Bartolo waits… but where is it? Say where: ${cjPos && typeof CJK !== 'undefined' ? cjPos.map(s => '«' + CJK.plain(s, { lang: L, cap: false }) + '»').join(', ') : { es: '«debajo de…», «encima de…», «dentro de…»', pt: '«debaixo de…», «em cima de…», «dentro de…»', de: '«unter…», «auf…», «in…»' }[L] || 'under…, on top of…, inside…'}`, 6); return; }
    if (gr.why === 'place') { STORY.think('Bartolo nods slowly… under what? On top of what? Say the place too.', 5); return; }
    // somewhere else: he looks there, and slowly shakes his head
    const P = itemPos(gr.item); if (B && P) { lk().pinPerson('bartolo', { x: B.x, z: B.z, y: B.y, yaw: Math.atan2(P.x - B.x, P.z - B.z) + 0.9, face: false }); await wait(0.9); lk().pinPerson('bartolo', null); }
    STORY.think(`Bartolo looks there… and slowly shakes his head. That’s not where his {${WORD[gr.item]}} is.`, 5);
  }
  async function reactYes(gr, q) {
    const B = bart(), L = lk(), id = gr.item, P = itemPos(id);
    scene = true; G.sim.lock = 1;
    try {
      const coins = { S: 3, A: 2, B: 1, C: 1, D: 1 }[gr.grade] || 1;
      G.state.coins = (G.state.coins || 0) + coins;
      Sound.play(gr.grade === 'S' ? 'chest' : gr.grade === 'A' ? 'review' : 'pip');
      UI.toast(`${gr.grade} · ${gr.reason}${gr.grade !== 'S' ? `  Better: «${gr.better}»` : ''}  +${coins} coin${coins > 1 ? 's' : ''}`);
      if (LEX.item(WORD[id])) LEX.attempt(WORD[id], { ok: !gr.slips.includes('gender') && !gr.slips.includes('article'), hints: 0, ms: 4000, mode: 'command' });
      // he looks where you said, and his eyes light up; Mimo dashes off and brings it back to the ferry
      L.pinPerson('bartolo', { x: B.x, z: B.z, y: B.y, yaw: Math.atan2(P.x - B.x, P.z - B.z), face: false });
      await wait(0.7);
      await fetchItem(id, P);
      q.told[id] = true; sig = '';
      const n = toldN();
      L.setPersonHush('bartolo', 1 - n * 0.22);
      G.w3d.fx.sparkle(B.x, B.y + 1.6, B.z, 16, ['#fff3a0', '#7ff7ea']); Sound.play('learned');
      L.pinPerson('bartolo', null);
      await wait(0.4);
      UI.toast(`Bartolo got a word back: «${plainChunk(lang(), n)}» (${n}/3)`);
      if (n < 3) await sayPartial(n);         // (the third: he says it all, in colour, in bartoloFree)
      G.save();
      if (n >= 3) await bartoloFree();
    } finally { L.pinPerson('bartolo', null); G.cam.override = null; G.sim.lock = 0; scene = false; }
    G.save();
  }
  async function sayPartial(n) {
    const B = bart(), L = lang();
    const p = { id: 'bartolo', name: 'Bartolo', lines: { [L]: partialLine(L, n), en: partialLine('en', n) }, get x() { return B.x; }, get y() { return B.y; }, get z() { return B.z; }, top: B.top };
    await STORY.sayInline(p, true);
  }
  async function fetchItem(id, P) {
    const M = G.sim.mimo, Y = G.sim.you, root = G.cast.mimo.root, sh = G.cast.mimoShadow, fr = lk().objects.ferry.position;
    G.sim.mimoGo({ x: Y.x + (P.x - Y.x) * 0.08, z: Y.z + (P.z - Y.z) * 0.08 }, P); M.perk = 1; Sound.play('chirp');
    await wait(0.55);
    G.w3d.fx.puff(M.x, M.ry + 0.3, M.z, 8, 0.25); Sound.play('swoosh');
    M.hidden = true; root.visible = false; if (sh) sh.visible = false;
    await wait(0.6);
    G.w3d.fx.puff(P.x, P.y + 0.2, P.z, 10, 0.3); lk().setItem(id, false); Sound.play('pip');
    await wait(0.6);
    lk().setFerryGear({ oar: told('oar') || id === 'oar', lantern: told('lantern') || id === 'lantern', rope: told('rope') || id === 'rope' });
    G.w3d.fx.puff(fr.x, W() + 0.7, fr.z, 10, 0.3); Sound.play('land', 6);
    await wait(0.35);
    M.x = Y.x + 1.0; M.z = Y.z + 0.7; M.y = M.ry = G.sim.ground(M.x, M.z); M.hidden = false; root.visible = true; if (sh) sh.visible = true;
    M.happy = 1.2; G.w3d.fx.puff(M.x, M.ry + 0.3, M.z, 8, 0.25);
    G.sim.mimoGo(null, null);
  }
  // the third word: the gray drains out of him, and he can talk again
  async function bartoloFree() {
    const f = F(), B = bart(), L = lk();
    G.cam.override = { pos: V(B.x + 2.4, B.y + 2.0, B.z + 3.8), look: V(B.x, B.y + 1.1, B.z), dur: 1.0 };
    await wait(0.9);
    Sound.play('hatch');
    await tween(1.6, k => { L.setPersonHush('bartolo', lerp(0.34, 0, k)); });
    L.setPersonHush('bartolo', 0); f.bartolo = true; sig = '';
    G.w3d.fx.sparkle(B.x, B.y + 1.2, B.z, 26, ['#fff3a0', '#7ff7ea', '#ffd76a']); Sound.play('learned');
    await wait(0.5);
    await STORY.sayAt(B, 'bartolo.free', 'Bartolo');
    await STORY.sayAt(B, 'bartolo.thanks', 'Bartolo');
    await STORY.you('You’re welcome! We have to get to the {w.island}: the lake’s {w.bell} is out there.');
    await STORY.sayAt(B, 'bartolo.ready', 'Bartolo');
    G.cam.override = null;
    G.save();
  }
  // a look at one of his things, where it's lost: the first time, Mimo wants its name
  async function lookItem(id) {
    const q = Q(), P = itemPos(id), w = WORD[id], Y = G.sim.you;
    if (!q.seen[id]) {
      q.seen[id] = true; G.save();
      if (LEX.item(w) && !LEX.taught(w)) {
        STORY.think(`Bartolo’s {${w}}! ${WHERE_EN[id]}`, 4);
        await STORY.teachWord(w, { spot: { x: Y.x + (P.x - Y.x) * 0.45, z: Y.z + (P.z - Y.z) * 0.45 }, look: P, title: `${G.state.mimoName} found one of Bartolo’s things! What is it?` });
      }
    }
    STORY.think(`Bartolo’s {${w}}! ${WHERE_EN[id]} Now to tell Bartolo where it is.`, 5);
  }

  // ------------------------------------------------------------ the ferry: Remanso's ferry dock ⇄ the island's jetty, Bartolo rowing and singing
  function pathOf(pts) {          // a Catmull-Rom through pts, by arc length: at(u) → { x, z }
    const Sm = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < 12; k++) { const t = k / 12, t2 = t * t, t3 = t2 * t; Sm.push([0, 1].map(j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
    }
    Sm.push(pts[pts.length - 1]);
    const Ls = [0]; for (let i = 1; i < Sm.length; i++) Ls.push(Ls[i - 1] + Math.hypot(Sm[i][0] - Sm[i - 1][0], Sm[i][1] - Sm[i - 1][1]));
    const total = Ls[Ls.length - 1];
    const at = u => { const d = clamp(u, 0, 1) * total; let i = 1; while (i < Ls.length - 1 && Ls[i] < d) i++; const k = (d - Ls[i - 1]) / Math.max(1e-6, Ls[i] - Ls[i - 1]); return { x: lerp(Sm[i - 1][0], Sm[i][0], k), z: lerp(Sm[i - 1][1], Sm[i][1], k) }; };
    return { total, at, dir(u) { const a = at(u - 0.003), b = at(u + 0.003), l = Math.hypot(b.x - a.x, b.z - a.z) || 1; return { x: (b.x - a.x) / l, z: (b.z - a.z) / l }; } };
  }
  const YAW = Math.PI / 2;        // (moored, the ferry lies bow east both ways: its bow to Remanso's dock, its stern, with Bartolo's oar, to the island's jetty)
  const deckAt = (fx, fz, yaw, lx, lz) => ({ x: fx + lx * Math.cos(yaw) + lz * Math.sin(yaw), z: fz - lx * Math.sin(yaw) + lz * Math.cos(yaw) });
  const deck = (fx, fz, lx, lz) => deckAt(fx, fz, YAW, lx, lz);
  // Lighthouse Island, far out on the grown lake (lake.js layout.island): spots on and round it are kept relative to it
  const IS = (typeof LAKE !== 'undefined' && LAKE.layout.island) || { x: -340, z: -172, r: 9 }, isl = (dx, dz) => ({ x: +(IS.x + dx).toFixed(2), z: +(IS.z + dz).toFixed(2) });
  const onIsle = P => Math.hypot(P.x - IS.x, P.z - IS.z) < IS.r + 9;        // (on the island, or its jetty)
  const JETTY_AT = isl(9.7, 1.6), DOCK_AT = { x: -187.5, z: -152.0 };
  function placeFerry(atIsle) {
    const L = lk(); if (!L) return;
    const Fr = L.objects.ferry, P = atIsle ? LAKE.layout.ferryIsle : LAKE.layout.ferry;
    Fr.position.set(P.x, W(), P.z); Fr.rotation.y = YAW;
    if (atIsle) L.pinPerson('bartolo', Object.assign(deck(P.x, P.z, 0, -2.3), { y: W() + 0.44, yaw: -Math.PI / 2, face: true }));
    else L.pinPerson('bartolo', null);
  }
  // The ride (DESIGN.md 16: "the boat ride kinda felt underwhelming"). Out to the island it's about 45 s: Bartolo backs off the
  // dock and swings the ferry round, rows across the bay and through the strait past the islets, gulls come and circle the ferry,
  // the lighthouse grows ahead, and by the island he swings round again and backs up to the jetty. He sings in a bubble of his own
  // that doesn't wait for E; you think out loud. The way back is shorter, bow first all the way.
  const RIDE = { out: 40, back: 26 };          // seconds under way (after the boarding beat)
  let chantEl = null, chantT = 0, gulls = null;
  const scr = new THREE.Vector3();
  // Bartolo's line (or a verse of his song) over his head, by the weave like every line (DESIGN.md 17.3): what he says is mixed
  // (STORY.mixHTML: the English with the words you know in the language, whole in the language as the weave rises), his song
  // («♪ …») is sung whole in the language; the English only on request (EN in the bubble), never under it by default
  function chant(key, sec = 5.5) {
    if (!chantEl) { chantEl = document.createElement('div'); chantEl.id = 'isle-chant'; document.body.appendChild(chantEl); }
    const Lx = UI.lineFor(key, LEX.tier()), en = UI.weavePlain(Lx.en || '', { english: true });       // (as STORY.sayAt: the tier's own English)
    const m = Lx.text && typeof STORY !== 'undefined' && STORY.mixHTML ? STORY.mixHTML(Lx.text, Lx.en || Lx.weave || '', { key: 'isle.' + key, whole: /^\s*♪/.test(Lx.text) }) : null;
    const body = m ? m.html : Lx.text ? UI.partial(Lx.text, 1e9) : UI.weave(Lx.weave || Lx.en || '');
    chantEl.className = 'bubble on';
    chantEl.innerHTML = `<div class="who">Bartolo${Lx.text && en ? '<span class="tools"><button type="button" data-act="en" title="Show this line in English">EN</button></span>' : ''}</div>`
      + `<div class="line">${body}</div>${Lx.text && en ? `<div class="en hidden">${esc(en)}</div>` : ''}`;
    const b = chantEl.querySelector('[data-act="en"]');
    if (b) b.onclick = e => { e.stopPropagation(); chantEl.querySelector('.en').classList.toggle('hidden'); chantT = Math.max(chantT, 4); };     // (and it stays up a moment to read)
    chantT = sec; Sound.play('blip', 'town');
  }
  function chantFrame(dt, B) {
    if (!chantEl) return;
    if ((chantT -= dt) <= 0 || !B) { chantEl.className = 'bubble'; chantEl.style.visibility = 'hidden'; return; }
    scr.set(B.x, B.y + (B.top || 1.6) + 0.35, B.z).project(G.w3d.camera);
    UI.place(chantEl, { x: (scr.x * 0.5 + 0.5) * innerWidth, y: (-scr.y * 0.5 + 0.5) * innerHeight, on: scr.z < 1 && Math.abs(scr.x) < 1.1 && Math.abs(scr.y) < 1.1 }, -6);
  }
  // gulls: they come in from all round, circle the ferry for a while, and wheel away again (two instanced meshes: bodies, wings)
  function ensureGulls() {
    if (gulls) return gulls;
    const { merge, M4, toon } = TK, n = 9, sph = new THREE.SphereGeometry(1, 8, 6), box = new THREE.BoxGeometry(1, 1, 1);
    const body = merge([{ geo: sph, m: M4(0, 0, 0, 0.16, 0.14, 0.34), color: '#fdf8ee' }, { geo: sph, m: M4(0, 0.08, 0.3, 0.11), color: '#fdf8ee' },
      { geo: new THREE.ConeGeometry(1, 1, 6), m: M4(0, 0.07, 0.44, 0.03, 0.12, 0.03, 0, Math.PI / 2), color: '#f2b43c' }, { geo: box, m: M4(0, 0.02, -0.36, 0.16, 0.03, 0.14), color: '#9aa4ad' }]);
    const wing = merge([{ geo: box, m: M4(0.31, 0, 0, 0.62, 0.03, 0.26), color: '#e9edf0' }, { geo: box, m: M4(0.6, 0.004, -0.02, 0.1, 0.035, 0.22), color: '#4a4f58' }]);
    const mat = toon('#ffffff', { vc: 1, rim: 0.25 }), B = new THREE.InstancedMesh(body, mat, n), Wg = new THREE.InstancedMesh(wing, mat, n * 2);
    B.frustumCulled = Wg.frustumCulled = false; B.visible = Wg.visible = false; G.w3d.scene.add(B, Wg);
    const R = rng(77), list = Array.from({ length: n }, (_, i) => ({ a0: (i / n) * TAU + R() * 0.4, r: 6 + R() * 5, h: 4.5 + R() * 3.5, w: (R() < 0.75 ? 1 : -1) * (0.75 + R() * 0.4) }));
    return (gulls = { B, Wg, list, n, t: -1, m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(0, 0, 0, 'YXZ'), v: new THREE.Vector3(), s: new THREE.Vector3(1, 1, 1), l: new THREE.Matrix4(), cT: 0 });
  }
  function gullFrame(dt, p, w) {
    const g = gulls; if (!g || g.t < 0) return;
    g.t += dt; const u = g.t, inT = smoothstep(0, 3, u), outT = smoothstep(9.5, 14, u);
    if (u > 14) { g.B.visible = g.Wg.visible = false; g.t = -1; return; }
    g.list.forEach((o, i) => {
      const a = o.a0 + u * o.w * 0.6, r = lerp(48, o.r, inT) + outT * 70, x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      const y = w + lerp(20, o.h, inT) + outT * 18 + Math.sin(u * 1.7 + i * 2) * 0.5, yaw = Math.atan2(-Math.sin(a) * o.w, Math.cos(a) * o.w), flap = Math.sin(u * 9 + i * 1.3) * 0.55 + 0.1;
      g.m.compose(g.v.set(x, y, z), g.q.setFromEuler(g.e.set(0, yaw, -0.3 * Math.sign(o.w))), g.s.set(1, 1, 1)); g.B.setMatrixAt(i, g.m);
      for (const sd of [1, -1]) { g.l.makeRotationZ(sd > 0 ? flap : Math.PI - flap).setPosition(sd * 0.1, 0.06, 0); g.Wg.setMatrixAt(i * 2 + (sd > 0 ? 0 : 1), g.l.premultiply(g.m)); }
    });
    g.B.instanceMatrix.needsUpdate = g.Wg.instanceMatrix.needsUpdate = true;
    if (u < 11 && (g.cT -= dt) <= 0) { g.cT = 0.5 + Math.random() * 0.9; Sound.play('chirp'); }
  }
  async function rideFerry(toIsle) {
    const L = lk(), Fr = L && L.objects.ferry, B = bart(); if (!Fr || !B) return;
    const f = F(), Y = G.sim.you, M = G.sim.mimo, w = W();
    placeFerry(!toIsle);
    scene = true; G.state._autosave = -120; G.sim.lock = 1;
    const pts = LAKE.layout.ferryPath, path = pathOf(toIsle ? pts : pts.slice().reverse()), D = path.total;
    // speed: speeds up, rows steadily, slows down (a trapezoid); the heading: out to the island it backs off the dock bow east,
    // swings round by the north to go bow first, and by the island swings back (by the north, clear of the bell) to back up to the
    // jetty; home again it goes bow first all the way
    const T = toIsle ? RIDE.out : RIDE.back, ta = toIsle ? 6 : 4, td = toIsle ? 7 : 5, vmax = D / (T - (ta + td) / 2);
    const sAt = t => (t < ta ? 0.5 * vmax * t * t / ta : t < T - td ? vmax * (t - ta / 2) : D - 0.5 * vmax * (T - t) * (T - t) / td);
    const yawAt = (t, h) => {
      if (!toIsle) return h + angDiff(h, YAW) * Math.max(1 - smoothstep(0, 3, t), smoothstep(T - 4, T, t));
      if (t < 2.6 || t >= T - 4.5) return YAW;
      if (t < 8) { let g = h; while (g < YAW) g += TAU; return lerp(YAW, g, smoothstep(2.6, 8, t)); }
      if (t < T - 10) return h;
      let g = YAW; while (g > h) g -= TAU; return lerp(h, g, smoothstep(T - 10, T - 4.5, t));
    };
    const put = (p, yaw, mv) => {
      Fr.position.set(p.x, w, p.z); Fr.rotation.y = yaw;
      const a = deckAt(p.x, p.z, yaw, -0.6, 0.6); Y.x = a.x; Y.z = a.z;
      const m = deckAt(p.x, p.z, yaw, 0.75, 1.5); M.x = m.x; M.z = m.z; M.station = m; M.look = { x: p.x + mv.x * 9, z: p.z + mv.z * 9 };
      L.pinPerson('bartolo', Object.assign(deckAt(p.x, p.z, yaw, 0, -2.3), { y: w + 0.44, yaw, steer: true, face: false }));
    };
    // the camera: a few shots that ride along ([start s, camera at, looking at]); and what happens on the way ([at s, do])
    const P3 = a => V(a[0], a[1], a[2]);
    const shots = toIsle ? [
      [0, p => [p.x + 2.5, w + 4.6, p.z + 8.6], p => [p.x - 2.0, w + 0.9, p.z - 0.8]],          // pulling out from the dock
      [6.5, p => [p.x + 1.5, w + 2.8, p.z + 10.5], p => [p.x - 8, w + 1.0, p.z - 3]],           // alongside, low: the islets slide past
      [15.5, p => [p.x + 6, w + 2.2, p.z + 4.5], p => [p.x - 5, w + 4.6, p.z - 2]],             // up at the gulls
      [23.5, (p, mv) => [p.x - mv.x * 4 - mv.z * 0.6, w + 4.8, p.z - mv.z * 4 + mv.x * 0.6], (p, mv) => [p.x + mv.x * 14, w + 1.0, p.z + mv.z * 14]],   // behind you, over the canopy: the lighthouse ahead
      [T - 8.5, () => [IS.x + 26, w + 7, IS.z - 11], p => [p.x - 1, w + 1.2, p.z]],              // from the island: the ferry swings round
    ] : [
      [0, p => [p.x - 2.5, w + 4.6, p.z + 8.6], p => [p.x + 2.0, w + 0.9, p.z - 0.8]],
      [7, p => [p.x - 1.5, w + 2.8, p.z + 10.5], p => [p.x + 8, w + 1.0, p.z - 3]],
      [15, p => [p.x - 5.2, w + 3.4, p.z + 1.6], () => [-182, w + 3, -158]],                     // Remanso ahead: Marina's yellow house
    ];
    const beats = toIsle ? [
      [0.8, () => chant('bartolo.song', 6)],
      [7.5, () => STORY.think('Bye, Remanso! The village gets smaller and smaller…', 4)],
      [10.5, () => chant('bartolo.islets', 6.5)],
      [16, () => { ensureGulls(); gulls.t = 0; gulls.B.visible = gulls.Wg.visible = true; M.perk = 1; G.sim.mimoSay('!', 1.4); }],
      [17.5, () => chant('bartolo.birds', 5.5)],
      [19.8, () => STORY.think('Look at all the {w.bird:pl}, {mimo}! They’re following the ferry.', 4)],
      [24.5, () => chant('bartolo.light', 6)],
      [31, () => chant('bartolo.song2', 6)],
      [T - 6, () => STORY.think(f.lakeFree ? 'The {w.island}! And the lighthouse, so tall up close!' : 'The {w.water} goes gray out here… the {w.bell} must be close.', 4.5)],
    ] : [
      [0.8, () => chant('bartolo.song', 6)],
      [12, () => chant('bartolo.home', 6)],
    ];
    try {
      const p0 = path.at(0), d0 = path.dir(0); put(p0, toIsle ? YAW : yawAt(0, Math.atan2(d0.x, d0.z)), d0); Y.yaw = Math.atan2(d0.x, d0.z); G.sim.snap();
      await wait(0.8);
      let tPrev = 0, shot = -1, beat = 0, splashT = 0;
      await tween(T, k => {
        const t = k * T, dt = Math.max(0, t - tPrev); tPrev = t;
        const s = sAt(t), p = path.at(s / D), mv = path.dir(s / D), h = Math.atan2(mv.x, mv.z), yaw = yawAt(t, h) + Math.sin(t * 1.3) * 0.02;
        put(p, yaw, mv); Y.yaw = dampAngle(Y.yaw, h, 3, dt);
        while (shot + 1 < shots.length && t >= shots[shot + 1][0]) { shot++; G.cam.override = { pos: P3(shots[shot][1](p, mv)), look: P3(shots[shot][2](p, mv)), dur: shot ? 2.4 : 1.0 }; }
        const o = G.cam.override; if (o && shot >= 0) { o.pos.set(...shots[shot][1](p, mv)); o.look.set(...shots[shot][2](p, mv)); }
        while (beat < beats.length && t >= beats[beat][0]) beats[beat++][1]();
        chantFrame(dt, B); gullFrame(dt, p, w);
        const sp = s < D - 0.5 ? (t < ta ? t / ta : t > T - td ? (T - t) / td : 1) : 0;      // (spray where the ferry's been, while it's under way)
        if (sp > 0.15 && (splashT -= dt) <= 0) { splashT = 0.3 / sp; G.w3d.fx.puff(p.x - mv.x * 3.6, w + 0.05, p.z - mv.z * 3.6, 3, 0.18, '#e9f6ff'); }
      });
      placeFerry(!!toIsle); f.ferryIsle = !!toIsle; sig = '';
      const off = toIsle ? JETTY_AT : DOCK_AT;
      Y.x = off.x; Y.z = off.z; M.station = null; M.look = null; M.x = off.x + (toIsle ? -0.6 : 0.6); M.z = off.z + 0.8; G.sim.snap();
      G.cam.override = null; G.cam.snap(toIsle ? -Math.PI / 2 : Math.PI / 2, 0.3, 8.5);
    } finally {
      G.sim.lock = 0; scene = false; M.station = null; G.state._autosave = 0;
      chantT = 0; chantFrame(0, null); if (gulls) { gulls.B.visible = gulls.Wg.visible = false; gulls.t = -1; }
    }
    if (toIsle && !f.isleLanded) {
      f.isleLanded = true; G.save();
      await UI.chapter('Lighthouse Island', 'Chapter 1 · The second bell');
      await STORY.sayAt(B, 'bartolo.wait', 'Bartolo');
      await STORY.you('The old lighthouse… its door is right up the path. Come on, {mimo}!');
    }
    G.save();
  }

  // ------------------------------------------------------------ outdoors: the lake follows the story (a load, a test, a scene's end)
  let sparkT = 0;
  function applyOutdoor() {
    const L = lk(); if (!L) return;
    const f = F(), st = S();
    for (const id of ITEMS) L.setItem(id, !!f.bartoloQuest && !f.bartolo && !told(id));
    L.setFerryGear({ oar: f.bartolo || told('oar'), lantern: f.bartolo || told('lantern'), rope: f.bartolo || told('rope') });
    L.setPersonHush('bartolo', f.bartolo ? 0 : 1 - toldN() * 0.22);
    placeFerry(!!f.ferryIsle);
    L.setLighthouseLit(!!st.lamp);
    if (f.lakeFree) {
      if (L.buoyHushed) L.setBuoyHushed(false);
      const hi = WORLD.L.hush.findIndex(h => h.buoy); if (hi >= 0 && WORLD.L.hush[hi].a > 0.002) G.w3d.liftHush(hi, true);
    }
    outdoorExtra();
  }
  function outdoor(dt, t) {
    if (!G || !lk() || !G.state || !G.state.flags.hatched) return;
    const f = F(), st = S();
    if (!scene && !STORY.busy) {
      const s = [f.bartoloQuest, f.bartolo, told('oar'), told('lantern'), told('rope'), f.ferryIsle, st.lamp, st.boss, st.page, f.lakeFree].map(v => (v ? 1 : 0)).join('');
      if (s !== sig) { sig = s; applyOutdoor(); }
    }
    outdoorFrame(dt, t);
    // sparkles over Bartolo's things while you look for them
    if (f.bartoloQuest && !f.bartolo && (sparkT -= dt) <= 0) {
      sparkT = 1.3; const Y = G.sim.you;
      for (const id of ITEMS) if (!told(id)) { const P = itemPos(id); if (P && Math.hypot(P.x - Y.x, P.z - Y.z) < 30) G.w3d.fx.sparkle(P.x, P.y + 0.35, P.z, 4, ['#fff3a0', '#7ff7ea']); }
    }
  }
  // what you can press E on outdoors (story.js adds these west of the river): Bartolo's things, the ferry, the island
  function outside() {
    const list = []; if (!G || !lk()) return list;
    const f = F(), st = S(), Y = G.sim.you, name = G.state.mimoName;
    if (f.bartoloQuest && !f.bartolo) for (const id of ITEMS) if (!told(id)) { const P = itemPos(id); if (P) list.push({ x: P.x, z: P.z, r: id === 'oar' ? 2.2 : 2.6, label: 'Look', run: () => lookItem(id) }); }
    if (f.bartolo && !f.ferryIsle) list.push({ x: -190.0, z: -152.0, r: 1.7, label: 'Ride the ferry', run: () => rideFerry(true) });
    if (f.bartolo && f.ferryIsle && Y.x > -196 && Y.x < -182) list.push({ x: -189.9, z: -152.0, r: 2.0, label: 'Wave to Bartolo', run: async () => { STORY.think('Bartolo waves back from the island, far out… and rows the ferry over.', 4); placeFerry(false); F().ferryIsle = false; sig = ''; G.save(); } });
    if (onIsle(Y)) {        // on the island
      const D = LAKE.landmarks.lighthouseDoor;
      if (D) list.push({ x: D.x + 0.3, z: D.z, r: 2.0, label: st.lamp ? 'Go in' : 'Go in', run: enter });
      if (f.ferryIsle) {
        const B = bart(); if (B && f.bartolo) list.push({ x: B.x, z: B.z, r: 1.5, label: 'Talk', run: () => STORY.sayAt(B, f.lakeFree ? 'bartolo.after' : 'bartolo.wait', 'Bartolo') });
        const at = isl(11.8, 2.4); list.push({ x: at.x, z: at.z, r: 1.3, label: 'Ride back to Remanso', run: () => rideFerry(false) });
      }
      list.push(...finaleSpots(name));
    }
    return list;
  }

  // ------------------------------------------------------------ the quest steps' compass targets (quests.js)
  const quest = {
    bartolo() {
      const f = F(), B = bart(); if (!f.bartoloQuest || !B) return B ? { x: B.x, z: B.z } : null;
      const Y = G.sim.you, open = ITEMS.filter(id => !told(id) && !known(id)).map(itemPos).filter(Boolean);
      if (!open.length) return { x: B.x, z: B.z };
      return open.reduce((b, p) => (!b || Math.hypot(p.x - Y.x, p.z - Y.z) < Math.hypot(b.x - Y.x, b.z - Y.z) ? p : b), null);
    },
    ferry() { return F().ferryIsle ? JETTY_AT : { x: -190.0, z: -152.0 }; },
    lighthouse() { if (inside) return target(); if (!F().ferryIsle && !onIsle(G.sim.you)) return { x: -190.0, z: -152.0 }; const D = LAKE.landmarks.lighthouseDoor; return D ? { x: D.x, z: D.z } : null; },
    bell() { if (inside) return target(); if (!F().ferryIsle && !onIsle(G.sim.you)) return { x: -190.0, z: -152.0 }; const st = S(); if (!st.lamp) return quest.lighthouse(); return st.boss ? { x: LAKE.landmarks.buoy.x, z: LAKE.landmarks.buoy.z } : LAKE.landmarks.frogPad; },
  };

  // ------------------------------------------------------------ the old lighthouse: three round rooms, high over the far woods
  // (x 108, z 44 / 16 / −12, y 300: out of sight, like the mill's). The walls are a cylinder drawn from the inside only, so the
  // camera, south of the room, looks in over the near side; the way out (or down) is a dark patch on the floor by that side.
  let built = false, MAT = null;
  const rooms = [];
  const grp = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const unsolid = s => { s.x = s.z = 1e5; };
  const onWall = (R, a, inset = 0.06) => ({ x: R.x + Math.cos(a) * (RAD - inset), z: R.z + Math.sin(a) * (RAD - inset), yaw: Math.atan2(-Math.cos(a), -Math.sin(a)) });
  function mats() {
    if (MAT) return MAT;
    const tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const flags = tex(256, 256, c => {          // flagstones
      c.fillStyle = '#8f9599'; c.fillRect(0, 0, 256, 256);
      const cols = ['#b5babc', '#aab0b3', '#bec2c1', '#a3aaae'], R = rng(17);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) { c.fillStyle = cols[(i + j * 3) % 4]; const x = i * 64 - (j % 2) * 32; for (const ox of [0, 256]) c.fillRect(x + ox + 3, j * 64 + 3, 58, 58); }
      c.fillStyle = 'rgba(255,255,255,0.1)'; for (let k = 0; k < 60; k++) c.fillRect(R() * 256, R() * 256, 7, 2);
    }, 3.2, 3.2);
    const wall = tex(512, 256, c => {           // whitewashed stone, a red line and a blue-gray band: the lighthouse's colours, inside
      c.fillStyle = '#ece6da'; c.fillRect(0, 0, 512, 256);
      c.strokeStyle = 'rgba(120,108,96,0.28)'; c.lineWidth = 2;
      for (let y = 10, row = 0; y < 192; y += 26, row++) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); for (let x = (row % 2) * 40; x < 512; x += 80) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, Math.min(192, y + 26)); c.stroke(); } }
      c.fillStyle = '#4f7590'; c.fillRect(0, 198, 512, 58); c.fillStyle = '#c4574a'; c.fillRect(0, 191, 512, 8);
    }, 5, 1);
    const glass = tex(512, 256, c => {          // the lamp room: tall windows all round, sky and lake beyond
      const gr = c.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#bfe6f7'); gr.addColorStop(0.55, '#eef9ff'); gr.addColorStop(0.6, '#7fb8d6'); gr.addColorStop(0.78, '#4f8fb6'); gr.addColorStop(1, '#4f8fb6');
      c.fillStyle = gr; c.fillRect(0, 0, 512, 256);
      c.fillStyle = '#3d4652'; for (let x = 0; x < 512; x += 64) c.fillRect(x, 0, 8, 256); c.fillRect(0, 0, 512, 10); c.fillRect(0, 118, 512, 6);
      c.fillStyle = 'rgba(255,255,255,0.35)'; for (let x = 18; x < 512; x += 64) c.fillRect(x, 22, 6, 86);
      c.fillStyle = '#5f6b74'; c.fillRect(0, 196, 512, 60); c.fillStyle = '#c4574a'; c.fillRect(0, 191, 512, 6);
    }, 5, 1);
    const water = tex(128, 128, c => { c.fillStyle = '#5c8aa2'; c.fillRect(0, 0, 128, 128); c.strokeStyle = 'rgba(225,242,250,0.4)'; c.lineWidth = 2; const R = rng(5); for (let k = 0; k < 14; k++) { c.beginPath(); c.ellipse(R() * 128, R() * 128, 9 + R() * 8, 2.5, 0, 0, TAU); c.stroke(); } }, 2.5, 1);
    MAT = {
      floor: new THREE.MeshToonMaterial({ map: flags, gradientMap: TK.grad }),
      wall: new THREE.MeshToonMaterial({ map: wall, gradientMap: TK.grad, side: THREE.BackSide }),
      glass: new THREE.MeshToonMaterial({ map: glass, gradientMap: TK.grad, side: THREE.BackSide }),
      water: new THREE.MeshToonMaterial({ map: water, gradientMap: TK.grad, transparent: true, opacity: 0.93 }), waterTex: water,
      hole: new THREE.MeshBasicMaterial({ color: '#1b1612' }), window: new THREE.MeshBasicMaterial({ color: '#ffe7a8' }),
    };
    return MAT;
  }
  function shell(R, g, glassy) {
    const M = mats();
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(RAD, RAD, 0.4, 40), M.floor); floor.position.set(R.x, Y0 - 0.2, R.z); floor.receiveShadow = true; g.add(floor);
    const wall = new THREE.Mesh(new THREE.CylinderGeometry(RAD, RAD, WH, 40, 1, true), glassy ? M.glass : M.wall); wall.position.set(R.x, Y0 + WH / 2, R.z); wall.receiveShadow = true; g.add(wall);
    g.add(part(new THREE.TorusGeometry(RAD - 0.08, 0.1, 6, 48), '#6b4a2e', [R.x, Y0 + 0.08, R.z], null, { rot: [Math.PI / 2, 0, 0], ink: 0 }));
    // the way out, or down: a dark opening in the floor by the near (south) side, with a rail each side
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.1), M.hole); hole.rotation.x = -Math.PI / 2; hole.position.set(R.x, Y0 + 0.012, R.z + RAD - 1.0); g.add(hole);
    for (const sx of [-1.07, 1.07]) g.add(part(GEO.box, '#6b4a2e', [R.x + sx, Y0 + 0.08, R.z + RAD - 1.0], [0.14, 0.16, 1.1], { ink: 0 }));
    // solids: sixteen boxes round the wall; the floor, a platform
    const ring = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, r = RAD + 0.25; ring.push({ obox: 1, x: R.x + Math.cos(a) * r, z: R.z + Math.sin(a) * r, hw: r * Math.tan(Math.PI / 16) + 0.3, hd: 0.3, rot: Math.atan2(-Math.cos(a), -Math.sin(a)) }); }
    WORLD.addSolids(ring);
    WORLD.addPlatforms([{ box: [R.x - RAD, R.x + RAD, R.z - RAD, R.z + RAD], top: Y0 }]);
  }
  function porthole(g, R, a, y) {
    const s = onWall(R, a), w = grp(g, s.x, Y0 + y, s.z); w.rotation.y = s.yaw;
    w.add(new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), mats().window));
    w.add(part(new THREE.TorusGeometry(0.45, 0.07, 6, 20), '#5f6b74', [0, 0, 0.02], null, { ink: 0 }));
    w.add(part(GEO.box, '#5f6b74', [0, 0, 0.03], [0.06, 0.86, 0.04], { ink: 0 }));
  }
  // an arched opening in the wall at angle a (stairs up into the dark), facing into the room
  function archway(g, R, a, w = 1.6, h = 2.4) {
    const s = onWall(R, a, 0.05), d = grp(g, s.x, Y0, s.z), M = mats(), hh = h - w / 2; d.rotation.y = s.yaw;
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(w, hh), M.hole); hole.position.set(0, hh / 2, 0.01); d.add(hole);
    const top = new THREE.Mesh(new THREE.CircleGeometry(w / 2, 16, 0, Math.PI), M.hole); top.position.set(0, hh, 0.01); d.add(top);
    for (const sx of [-1, 1]) d.add(part(GEO.box, '#8f8778', [sx * (w / 2 + 0.12), hh / 2, 0.06], [0.24, hh, 0.16], { ink: 0.01 }));
    d.add(part(new THREE.TorusGeometry(w / 2 + 0.12, 0.12, 6, 16, Math.PI), '#8f8778', [0, hh, 0.06], null, { ink: 0.01 }));
    for (let k = 0; k < 3; k++) d.add(part(GEO.box, '#8d8a80', [0, 0.1 + k * 0.2, 0.95 - k * 0.3], [w, 0.2, 0.36], { ink: 0.008 }));
    return { g: d, x: s.x, z: s.z, yaw: s.yaw };
  }
  // a plaque or a note on a post, its words in the save's language (repainted if the language changes)
  function wrapText(c, text, maxW) {
    const words = /\s/.test(text) ? text.split(' ') : [...text], lines = []; let ln = '';
    const sep = /\s/.test(text) ? ' ' : '';
    for (const w of words) { const t = ln ? ln + sep + w : w; if (c.measureText(t).width > maxW && ln) { lines.push(ln); ln = w; } else ln = t; }
    if (ln) lines.push(ln); return lines;
  }
  function signPost(g, x, z, keyFn, paper) {
    const cv = document.createElement('canvas'); cv.width = 512; cv.height = 256;
    const tex = new THREE.CanvasTexture(cv), post = grp(g, x, Y0, z);
    const paint = () => {
      const c = cv.getContext('2d'), L = lang(), e = LT[keyFn()], s = e ? ((e[L] || e.en)[0]) : '', text = L === 'zh' || L === 'ja' ? plainCJK(s) : s;
      c.clearRect(0, 0, 512, 256);
      c.fillStyle = paper ? '#d8cdb4' : '#9a7a3a'; c.fillRect(0, 0, 512, 256); c.fillStyle = paper ? '#fffaf0' : '#e8d49a'; c.fillRect(14, 14, 484, 228);
      if (!paper) { c.strokeStyle = '#7a5a26'; c.lineWidth = 5; c.strokeRect(28, 28, 456, 200); }
      c.fillStyle = '#2b2235'; c.textAlign = 'center'; c.textBaseline = 'middle';
      let px = 56, lines = [];
      for (; px > 20; px -= 2) { c.font = `800 ${px}px Bahnschrift, "Segoe UI", sans-serif`; lines = wrapText(c, text, 420); if (lines.length * px * 1.18 < 186) break; }
      lines.forEach((ln, i) => c.fillText(ln, 256, 128 + (i - (lines.length - 1) / 2) * px * 1.18));
      tex.needsUpdate = true;
    };
    if (typeof SIGNS !== 'undefined' && SIGNS.board) SIGNS.board(() => paint()); else paint();
    post.add(part(GEO.box, '#6b4a2e', [0, 0.55, 0], [0.12, 1.1, 0.12], { ink: 0 }));
    const board = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.65), new THREE.MeshBasicMaterial({ map: tex })); board.position.set(0, 1.35, 0.07); board.rotation.x = -0.25; post.add(board);
    post.add(part(GEO.box, paper ? '#8a6a4a' : '#7a5a26', [0, 1.35, 0.02], [1.4, 0.74, 0.06], { rot: [-0.25, 0, 0], ink: 0.01 }));
    WORLD.extra.push({ x, z, r: 0.3 });
    return { x, z, g: post, paint };
  }
  function jarMesh(parent) {
    const g = new THREE.Group(); parent.add(g);
    const prof = [[0, 0], [0.24, 0.02], [0.33, 0.2], [0.32, 0.42], [0.21, 0.6], [0.15, 0.7], [0.2, 0.78], [0.18, 0.81], [0, 0.81]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(part(new THREE.LatheGeometry(prof, 18), '#c9784a', [0, 0, 0], null, { ink: 0.015 }));
    g.add(part(new THREE.CylinderGeometry(0.335, 0.335, 0.08, 18), '#3f6fb5', [0, 0.32, 0], null, { ink: 0 }));
    return g;
  }
  function keyMesh(parent) {
    const g = new THREE.Group(); parent.add(g);
    g.add(part(new THREE.TorusGeometry(0.1, 0.035, 6, 14), '#e6b84a', [0, 0, -0.16], null, { rot: [Math.PI / 2, 0, 0], ink: 0.006 }));
    g.add(part(GEO.box, '#e6b84a', [0, 0, 0.06], [0.05, 0.05, 0.34], { ink: 0.006 }));
    g.add(part(GEO.box, '#e6b84a', [0.05, 0, 0.19], [0.08, 0.05, 0.05], { ink: 0 }));
    return g;
  }
  function build() {
    if (built) return; built = true;
    const scene = G.w3d.scene;
    ROOMS.forEach((R, i) => { const g = new THREE.Group(); g.visible = false; scene.add(g); shell(R, g, i === 2); rooms[i] = { R, g, i }; });
    buildHall(rooms[0]); buildStore(rooms[1]); buildLamp(rooms[2]);
    applyState();
  }
  // 0 · the flooded hall: water across the middle, the stairs beyond it behind a gate, two levers, the keeper's plaque
  function buildHall(room) {
    const R = room.R, g = room.g, M = mats(), st = S();
    const z0 = R.z - 2.6, z1 = R.z + 0.6, half = z => Math.sqrt(Math.max(0, RAD * RAD - (z - R.z) * (z - R.z))) - 0.05;
    room.pool = { z0, z1 };
    const shp = new THREE.Shape(), N = 12;
    for (let i = 0; i <= N; i++) { const z = lerp(z0, z1, i / N), p = [-half(z), -(z - R.z)]; if (i) shp.lineTo(...p); else shp.moveTo(...p); }
    for (let i = N; i >= 0; i--) { const z = lerp(z0, z1, i / N); shp.lineTo(half(z), -(z - R.z)); }
    const wgeo = new THREE.ShapeGeometry(shp); wgeo.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(wgeo, M.water); water.position.set(R.x, Y0 + 0.04, R.z); water.receiveShadow = true; g.add(water);
    for (const z of [z0, z1]) g.add(part(GEO.box, '#9a9f9f', [R.x, Y0 + 0.07, z], [half(z) * 2 - 0.1, 0.16, 0.24], { ink: 0.01 }));
    // you can't wade in: solids across the water, the middle one (the bridge's way) goes when the bridge comes down
    const zc = (z0 + z1) / 2, hd = (z1 - z0) / 2;
    WORLD.addSolids([{ obox: 1, x: R.x - 4.1, z: zc, hw: 3.1, hd, rot: 0 }, { obox: 1, x: R.x + 4.1, z: zc, hw: 3.1, hd, rot: 0 }]);
    room.ford = { obox: 1, x: R.x, z: zc, hw: 1.05, hd, rot: 0 }; WORLD.extra.push(room.ford);
    room.swimFrom = { x: R.x + 0.5, z: z1 + 0.75 }; room.swimTo = { x: R.x + 0.5, z: z0 - 0.85 };
    // the bridge: sunk under the water (a dark shape you can just see) until the right lever raises it
    const br = grp(g, R.x, Y0 - 0.5, z0); room.bridge = br;
    for (let i = 0; i < 6; i++) br.add(part(GEO.box, ['#a8875a', '#9a7a52', '#b08d5e'][i % 3], [0, 0, 0.27 + i * 0.53], [2.0, 0.1, 0.5], { ink: 0.01 }));
    for (const s of [-1, 1]) br.add(part(GEO.box, '#6b4a2e', [s * 0.95, 0.06, 1.6], [0.1, 0.12, 3.2], { ink: 0 }));
    // the stairs up, behind a gate of iron bars
    const A = archway(g, R, -Math.PI / 2); room.up = { x: R.x, z: R.z - RAD + 2.0 };
    room.gate = grp(A.g, 0, 0, 0.32);
    for (let k = -2; k <= 2; k++) room.gate.add(part(GEO.cyl, '#3d4652', [k * 0.34, 1.15, 0], [0.06, 2.3, 0.06], { ink: 0 }));
    room.gate.add(part(GEO.box, '#3d4652', [0, 2.2, 0], [1.6, 0.12, 0.12], { ink: 0 })); room.gate.add(part(GEO.box, '#3d4652', [0, 0.5, 0], [1.6, 0.1, 0.1], { ink: 0 }));
    room.gateSolid = { x: R.x, z: R.z - RAD + 1.0, r: 0.95 }; WORLD.extra.push(room.gateSolid);
    // two levers on the far side, alike: left and right
    room.levers = [-1, 1].map(s => {
      const x = R.x + s * 3.0, z = R.z - 4.6, lv = grp(g, x, Y0, z);
      lv.add(part(GEO.box, '#5f6b74', [0, 0.55, 0], [0.5, 1.1, 0.3], { ink: 0.01 }));
      const arm = grp(lv, 0, 1.0, 0.16); arm.add(part(GEO.cyl, '#8d6a46', [0, 0.38, 0], [0.07, 0.76, 0.07], { ink: 0 })); arm.add(part(GEO.sphere, '#d9483b', [0, 0.78, 0], [0.14, 0.14, 0.14], { ink: 0.01 }));
      arm.rotation.x = -0.5; WORLD.addSolids([{ x, z, r: 0.42 }]);
      return { side: s < 0 ? 'left' : 'right', x, z, g: lv, arm };
    });
    porthole(g, R, -Math.PI / 2 - 0.9, 3.4); porthole(g, R, -Math.PI / 2 + 0.9, 3.4); porthole(g, R, Math.PI, 2.6); porthole(g, R, 0, 2.6);
    room.plaque = signPost(g, R.x - 3.3, R.z + 3.4, () => 'isle.lever.' + (st.leverSide || 'right'), false);
    // an old rowing boat sunk at one end of the water, and a coil of rope, for the look of it
    g.add(part(GEO.sphere, '#8a9aa3', [R.x + 4.3, Y0 - 0.05, zc], [0.7, 0.25, 1.3], { rot: [0, 0.3, 0.15], ink: 0.012 }));
    g.add(part(new THREE.TorusGeometry(0.3, 0.07, 6, 16), '#c9a66b', [R.x + 3.6, Y0 + 0.07, R.z + 3.8], null, { rot: [Math.PI / 2, 0, 0], ink: 0.006 }));
  }
  // 1 · the store room: three jars alike on a high rack, the keeper's note, the padlocked door to the stairs up (east)
  function buildStore(room) {
    const R = room.R, g = room.g, st = S();
    const rz = R.z - 4.4;            // the rack, along the far side
    for (const sx of [-3.2, -1.07, 1.07, 3.2]) g.add(part(GEO.box, '#7f6440', [R.x + sx, Y0 + 1.4, rz], [0.14, 2.8, 0.14], { ink: 0.008 }));
    for (const y of [1.3, 2.6]) g.add(part(GEO.box, '#a8875a', [R.x, Y0 + y, rz], [6.6, 0.1, 0.7], { ink: 0.01 }));
    for (const [dx, c] of [[-2.3, '#b07a48'], [0.2, '#8a9aa3'], [2.2, '#b07a48']]) g.add(part(GEO.box, c, [R.x + dx, Y0 + 1.6, rz], [0.8, 0.5, 0.5], { ink: 0.01 }));
    WORLD.addSolids([{ obox: 1, x: R.x, z: rz, hw: 3.35, hd: 0.45, rot: 0 }]);
    room.jars = [-2.2, 0, 2.2].map((dx, i) => { const j = jarMesh(g); j.position.set(R.x + dx, Y0 + 2.65, rz); return { i, x: R.x + dx, z: rz, g: j, alive: true }; });
    room.key = keyMesh(g); room.key.visible = false;
    room.note = signPost(g, R.x - 4.0, R.z + 2.4, () => 'isle.jar.' + ['left', 'middle', 'right'][st.keyJar !== undefined ? st.keyJar : 1], true);
    // the stairs up: through the east wall, padlocked and chained
    const A = archway(g, R, 0); room.door = { x: R.x + RAD - 1.0, z: R.z }; room.up = { x: R.x + RAD - 2.2, z: R.z };
    room.chain = grp(A.g, 0, 0, 0.3);
    for (let k = 0; k < 7; k++) room.chain.add(part(new THREE.TorusGeometry(0.1, 0.03, 4, 10), '#5f6670', [-0.66 + k * 0.22, 1.25 + Math.sin(k / 6 * Math.PI) * -0.18, 0], null, { rot: [0, k % 2 ? Math.PI / 2 : 0, 0], ink: 0 }));
    room.padlock = grp(A.g, 0, 1.05, 0.36);
    room.padlock.add(part(GEO.box, '#c99a3e', [0, 0, 0], [0.34, 0.3, 0.14], { ink: 0.008 })); room.padlock.add(part(new THREE.TorusGeometry(0.11, 0.035, 6, 12, Math.PI), '#8a8f98', [0, 0.15, 0], null, { ink: 0 }));
    room.doorSolid = { x: R.x + RAD - 0.9, z: R.z, r: 0.95 }; WORLD.extra.push(room.doorSolid);
    // the store itself: crates, barrels, rope, old oars, a net
    const B = (x, z, w, h, d, c, ry = 0) => { g.add(part(GEO.box, c, [R.x + x, Y0 + h / 2, R.z + z], [w, h, d], { rot: [0, ry, 0], ink: 0.012 })); };
    B(-4.6, -1.6, 1.0, 0.9, 1.0, '#b07a48', 0.2); B(-4.5, -1.5, 0.8, 0.7, 0.8, '#c08a55', 0.5); WORLD.addSolids([{ x: R.x - 4.6, z: R.z - 1.6, r: 0.75 }]);
    for (const [x, z] of [[3.9, 2.9], [4.6, 2.1]]) { g.add(part(new THREE.CylinderGeometry(0.38, 0.38, 0.9, 12), '#8a6a4a', [R.x + x, Y0 + 0.45, R.z + z], null, { ink: 0.012 })); WORLD.addSolids([{ x: R.x + x, z: R.z + z, r: 0.42 }]); }
    g.add(part(new THREE.TorusGeometry(0.32, 0.08, 6, 16), '#c9a66b', [R.x - 2.6, Y0 + 0.08, R.z + 3.9], null, { rot: [Math.PI / 2, 0, 0], ink: 0.006 }));
    for (const s of [0, 1]) g.add(part(GEO.cyl, '#b07a48', [R.x - 5.7 + s * 0.3, Y0 + 1.1, R.z + 1.2 + s * 0.4], [0.05, 2.2, 0.05], { rot: [0.25, 0, 0.12], ink: 0.006 }));
    porthole(g, R, -Math.PI / 2 - 1.15, 3.6); porthole(g, R, -Math.PI / 2 + 1.15, 3.6); porthole(g, R, Math.PI, 2.8);
  }
  // 2 · the lamp room: the great lamp in the middle, its iron shutters latched by a catch on top; the keeper's table
  function buildLamp(room) {
    const R = room.R, g = room.g, C = { x: R.x, z: R.z - 0.3 }, lg = grp(g, C.x, Y0, C.z);
    room.lampAt = C; room.lampG = lg;
    lg.add(part(new THREE.CylinderGeometry(0.85, 1.0, 1.0, 20), '#5f6b74', [0, 0.5, 0], null, { ink: 0.02 }));
    room.lensMat = new THREE.MeshBasicMaterial({ color: '#8f9aa3' });
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.3, 20), room.lensMat); lens.position.y = 1.65; lg.add(lens);
    for (let k = 0; k < 4; k++) lg.add(part(new THREE.TorusGeometry(0.63, 0.03, 4, 24), '#c99a3e', [0, 1.1 + k * 0.36, 0], null, { rot: [Math.PI / 2, 0, 0], ink: 0 }));
    room.shutters = [0, 1, 2, 3].map(k => { const a = k * Math.PI / 2, s = grp(lg, Math.sin(a) * 0.72, 1.0, Math.cos(a) * 0.72); s.rotation.y = a; s.add(part(GEO.box, '#3d4652', [0, 0.66, 0], [0.98, 1.32, 0.06], { ink: 0.012 })); return s; });
    lg.add(part(new THREE.CylinderGeometry(0.35, 0.9, 0.36, 20), '#3d4652', [0, 2.48, 0], null, { ink: 0.015 }));
    room.knob = part(GEO.sphere, '#e2483a', [0, 2.72, 0], [0.16, 0.14, 0.16], { ink: 0.01 }); lg.add(room.knob);
    room.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#ffd98a', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    room.glow.scale.setScalar(5.5); room.glow.position.set(0, 1.7, 0); lg.add(room.glow);
    WORLD.extra.push({ x: C.x, z: C.z, r: 1.15 });
    // the keeper's table (left of the lamp): a logbook, a cup
    const T = { x: R.x - 3.4, z: R.z + 0.8 }, tg = grp(g, T.x, Y0, T.z); room.table = T;
    tg.add(part(GEO.box, '#a8875a', [0, 0.85, 0], [1.6, 0.1, 1.0], { ink: 0.012 }));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) tg.add(part(GEO.box, '#7f6440', [sx * 0.68, 0.42, sz * 0.4], [0.1, 0.84, 0.1], { ink: 0 }));
    tg.add(part(GEO.box, '#3f6fb5', [-0.3, 0.93, 0.05], [0.42, 0.06, 0.3], { ink: 0.006 }));
    tg.add(part(new THREE.CylinderGeometry(0.08, 0.07, 0.14, 10), '#fdf8ee', [0.35, 0.97, -0.1], null, { ink: 0.006 }));
    WORLD.extra.push({ obox: 1, x: T.x, z: T.z, hw: 0.85, hd: 0.55, rot: 0 });
    // a spare oil can and a coil of rope by the wall
    g.add(part(new THREE.CylinderGeometry(0.22, 0.25, 0.5, 12), '#c4574a', [R.x + 3.8, Y0 + 0.25, R.z + 2.4], null, { ink: 0.01 }));
    g.add(part(new THREE.TorusGeometry(0.3, 0.07, 6, 16), '#c9a66b', [R.x + 4.2, Y0 + 0.07, R.z - 2.2], null, { rot: [Math.PI / 2, 0, 0], ink: 0.006 }));
  }
  // after a load: each room the way the saved progress says (the lever and the key jar are picked once, per save)
  function applyState() {
    const st = S(), r0 = rooms[0], r1 = rooms[1], r2 = rooms[2];
    if (!st.leverSide) st.leverSide = Math.random() < 0.5 ? 'left' : 'right';
    if (st.keyJar === undefined) st.keyJar = Math.floor(Math.random() * 3);
    r0.plaque.paint(); r1.note.paint();
    if (st.lever) { r0.gate.position.y = 2.4; r0.bridge.position.y = Y0 + 0.1; unsolid(r0.gateSolid); unsolid(r0.ford); const lv = r0.levers.find(l => l.side === st.leverSide); if (lv) lv.arm.rotation.x = 0.6; }
    (st.broken || []).forEach(i => { const j = r1.jars[i]; if (j) { j.alive = false; j.g.visible = false; } });
    if (st.door) { r1.padlock.visible = false; r1.chain.visible = false; unsolid(r1.doorSolid); }
    if (st.lamp) { r2.shutters.forEach(s => { s.rotation.x = 1.25; }); r2.knob.scale.y = 0.4; }
  }

  // ------------------------------------------------------------ telling Mimo (the verb is the key; look-alikes need where)
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${G.state.mimoName} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  // t: { kind, verbs (the ones that do the job), icon, title, hint, at(), right(verb) }; once it has worked, E repeats it
  async function tell(t) {
    let verb = quick[t.kind] || null, ms = 0;
    if (!verb) {
      const r = await UI.command({ name: G.state.mimoName, icon: t.icon, title: t.title, verbs: VERBS, answer: t.verbs[0] });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); G.sim.mimo.tiltT = 1.4; STORY.think('{mimo} tilts its head. ' + t.hint, 4); return; }
      verb = r.verb; ms = r.ms;
      if (t.verbs.includes(verb)) quick[t.kind] = verb;
    }
    if (t.verbs.includes(verb) || LEX.taught(verb)) learnUse(verb, ms);
    if (!t.verbs.includes(verb)) { await wrong(t, verb); return; }
    await t.right(verb);
  }
  // where-words, per language (zh / ja: in CJK.canon's romanisation)
  const POSW = {
    es: { left: ['izquierda', 'izquierdo', 'izq'], right: ['derecha', 'derecho'], middle: ['medio', 'centro', 'central', 'mitad'], top: ['encima', 'arriba', 'sobre'], under: ['debajo', 'abajo', 'bajo'] },
    pt: { left: ['esquerda', 'esquerdo'], right: ['direita', 'direito'], middle: ['meio', 'centro', 'central'], top: ['cima', 'sobre', 'acima'], under: ['debaixo', 'embaixo', 'baixo', 'sob'] },
    de: { left: ['links', 'linke', 'linken', 'linker', 'linkes', 'linkem'], right: ['rechts', 'rechte', 'rechten', 'rechter', 'rechtes', 'rechtem'], middle: ['mitte', 'mittlere', 'mittleren', 'mittlerer', 'mittleres', 'mittel'],
      top: ['auf', 'oben', 'drauf', 'darauf', 'obendrauf'], under: ['unter', 'unten', 'darunter'] },
    zh: { left: ['zuobian', 'zuomian'], right: ['youbian', 'youmian'], middle: ['zhongjian'], top: ['shangmian', 'shangbian', 'shang'], under: ['xiamian', 'xiabian', 'xia'] },
    ja: { left: ['hidari'], right: ['migi'], middle: ['mannaka', 'chuuou', 'chuou'], top: ['ue'], under: ['shita'] },
  };
  const NOUNW = {
    lamp: { es: ['lampara', 'farol', 'faro', 'luz'], pt: ['lampada', 'luminaria', 'lampiao', 'farol', 'luz'], de: ['lampe', 'licht', 'laterne', 'leuchte'], zh: ['deng'], ja: ['ranpu', 'raito', 'akari'] },
    table: { es: ['mesa'], pt: ['mesa'], de: ['tisch'], zh: ['zhuozi', 'zhuo'], ja: ['teeburu', 'tsukue'] },
  };
  function heard(text, L, table) {
    const out = new Set(), D = table;
    if (L === 'zh' || L === 'ja') { const c = typeof CJK !== 'undefined' && CJK.canon ? CJK.canon(text, L) : ''; for (const [k, v] of Object.entries(D)) { const ws = v[L] || v; if (Array.isArray(ws) && ws.some(w => c.includes(w))) out.add(k); } return out; }
    const toks = norm(text).split(' ');
    for (const [k, v] of Object.entries(D)) { const ws = Array.isArray(v) ? v : v[L] || v.es; if (toks.some(t => ws.includes(t))) out.add(k); }
    return out;
  }
  const posOf = (text, L) => heard(text, L, POSW[L] || POSW.es);
  const nounOf = (text, L) => heard(text, L, NOUNW);
  const WHICH = { es: '¿Cuál?', pt: 'Qual?', de: 'Welcher?', zh: '哪个？', ja: 'どれ？' };
  const whichHint = opts => (opts.length >= 3 ? 'Say which one: left, middle or right.' : 'Say which one: left or right.');
  // frames for "I don't know": the sentence with the where left blank (the plaque or the note says it)
  const FRAMES = {
    lever: { es: '¡Golpea la palanca de la ___!', pt: 'Bate na alavanca da ___!', de: 'Schlag den ___ Hebel!', zh: '打___的拉杆！', ja: '___のレバーを打って！', en: 'Hit the lever on the ___!' },
    jar: { es: '¡Lanza una piedra al jarrón de la ___!', pt: 'Joga uma pedra no vaso da ___!', de: 'Wirf einen Stein auf die ___ Vase!', zh: '扔石头打___的花瓶！', ja: '___の花瓶に石を投げて！', en: 'Throw a stone at the jar on the ___!' },
    lamp: { es: '¡Salta encima de la ___!', pt: 'Pula em cima da ___!', de: 'Spring auf die ___!', zh: '跳到___上面！', ja: '___の上に跳んで！', en: 'Jump on top of the ___!' },
  };
  // a sentence for one of several look-alikes: the verb, and which one («la de la derecha»); without it Mimo asks «¿Cuál?»
  async function tellWhich(t) {
    const L = lang(), name = G.state.mimoName, fr = t.frame || {};
    const r = await UI.command({ name, icon: t.icon, title: t.title, verbs: VERBS, answer: t.verbs[0], model: fr[L] || fr.es, modelEn: fr.en });
    if (!r || r.cancelled) return;
    if (!r.verb) { G.sim.mimoSay('…?', 1.4); G.sim.mimo.tiltT = 1.4; STORY.think('{mimo} tilts its head. ' + t.hint, 5); return; }
    if (t.verbs.includes(r.verb) || LEX.taught(r.verb)) learnUse(r.verb, r.ms);
    if (r.verb === 'v.swim' && t.swim) return t.swim();
    if (!t.verbs.includes(r.verb)) { await wrong(t, r.verb); return; }
    const opts = t.options(), pos = posOf(r.text, L);
    const pick = opts.length === 1 ? opts[0] : opts.find(k => pos.has(k));
    if (!pick) {
      G.sim.mimoSay(WHICH[L] || '?', 1.8); G.sim.mimo.tiltT = 1.8; Sound.play('click');
      const said = ['left', 'middle', 'right'].find(k => pos.has(k));
      STORY.think(said ? `There’s no ${said} one any more… ${whichHint(opts)}` : `{mimo} looks from one to the other… Which one? ${whichHint(opts)}`, 5);
      return;
    }
    await t.right(r.verb, pick, r);
  }
  async function wrong(t, verb) {
    if (verb === 'v.swim' && t.swim) { await t.swim(); return; }
    const M = G.sim.mimo, at = t.at ? t.at() : { x: G.sim.you.x, z: G.sim.you.z };
    G.sim.mimoGo({ x: at.x + 1.0, z: at.z + 1.0 }, at); await wait(0.6);
    if (verb === 'v.jump') { M.hop = { t: 0 }; Sound.play('jump'); STORY.think('{mimo} hops up and down. Nothing happens.', 3); }
    else if (verb === 'v.hit') { Sound.play('hit'); M.sad = 1.2; STORY.think('{mimo} bonks it. Ouch! Nothing happens.', 3); }
    else if (verb === 'v.throw') { Sound.play('whiff'); STORY.think('{mimo} throws a pebble at it. Plink. Nothing.', 3); }
    else if (verb === 'v.push') { Sound.play('land', 6); STORY.think('{mimo} pushes with all its might. Nothing moves.', 3); }
    else if (verb === 'v.eat') STORY.think('{mimo} sniffs it… and decides it’s not food.', 3);
    else if (verb === 'v.swim') { M.tiltT = 1.2; STORY.think('{mimo} looks around for water to swim in… not here!', 3); }
    G.sim.mimoGo(null, null);
  }
  // Mimo flies along an arc (onto the table, the lamp…): the simulation lets go of it meanwhile
  async function mimoArc(to, y1, dur = 0.7) {
    const M = G.sim.mimo, root = G.cast.mimo.root, p0 = root.position.clone();
    M.hidden = true;
    await tween(dur, k => { root.position.set(lerp(p0.x, to.x, k), lerp(p0.y, y1, k) + Math.sin(k * Math.PI) * 1.3, lerp(p0.z, to.z, k)); });
    Sound.play('pip');
  }
  async function mimoLand(y = Y0) {
    const M = G.sim.mimo, Y = G.sim.you, root = G.cast.mimo.root, p0 = root.position.clone(), to = { x: Y.x + 1.1, z: Y.z + 0.6 };
    await tween(0.55, k => { root.position.set(lerp(p0.x, to.x, k), lerp(p0.y, y, k) + Math.sin(k * Math.PI) * 0.8, lerp(p0.z, to.z, k)); });
    M.x = to.x; M.z = to.z; M.y = M.ry = y; M.hidden = false; M.land = 0; Sound.play('land', 4);
  }
  // Mimo swims from a to b (a hop in, paddling across, a hop out), at the water's level wy. o.in false: it's in the water
  // already (start paddling from where it is); o.out false: it stays in the water at b (hidden from the simulation)
  async function swimPath(a, b, wy, ground, o = {}) {
    const M = G.sim.mimo, root = G.cast.mimo.root, p0 = root.position.clone(), dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
    const s0 = o.in === false ? { x: p0.x, z: p0.z } : { x: a.x + ux * 0.8, z: a.z + uz * 0.8 }, s1 = o.out === false ? { x: b.x, z: b.z } : { x: b.x - ux * 0.6, z: b.z - uz * 0.6 };
    M.hidden = true;
    if (o.in !== false) {
      Sound.play('jump');
      await tween(0.35, k => root.position.set(lerp(p0.x, s0.x, k), lerp(p0.y, wy, k) + Math.sin(k * Math.PI) * 0.5, lerp(p0.z, s0.z, k)));
      G.w3d.fx.puff(s0.x, wy + 0.05, s0.z, 8, 0.2, '#e9f6ff'); Sound.play('poof');
    }
    let sp = 0; const dur = clamp(Math.hypot(s1.x - s0.x, s1.z - s0.z) / 2.4, 0.8, 4);
    await tween(dur, k => {
      const x = lerp(s0.x, s1.x, k), z = lerp(s0.z, s1.z, k);
      root.position.set(x, wy - 0.12 + Math.sin(k * 30) * 0.04, z); root.rotation.set(0, Math.atan2(ux, uz), 0); root.rotateX(0.35);
      if ((sp -= 1 / 60) <= 0) { sp = 0.18; G.w3d.fx.puff(x, wy + 0.05, z, 3, 0.15, '#e9f6ff'); }
    });
    if (o.out === false) return;
    const q0 = root.position.clone();
    await tween(0.35, k => root.position.set(lerp(q0.x, b.x, k), lerp(q0.y, ground, k) + Math.sin(k * Math.PI) * 0.5, lerp(q0.z, b.z, k)));
    root.rotation.set(0, Math.atan2(ux, uz), 0);
    M.x = b.x; M.z = b.z; M.y = M.ry = ground; M.yaw = Math.atan2(ux, uz); M.hidden = false; M.land = 0; Sound.play('land', 4);
  }

  // ------------------------------------------------------------ the puzzles
  // 0: «¡Nada!» across the water; then the lever the plaque names: «¡Golpea la palanca de la derecha!»
  function tellHall(room) {
    const name = G.state.mimoName;
    if (!room.across) return tell({ kind: 'pool', verbs: ['v.swim'], icon: 'swim', title: `The stairs are across the water. What should ${name} do?`, hint: 'The water is in the way… but someone who swims could cross it.',
      at: () => room.swimFrom, right: () => swimAcross(room, false) });
    return tellWhich({ kind: 'lever', verbs: ['v.hit', 'v.push'], icon: 'hit', title: `${name} is across the water, by two levers that look the same. Which one should it pull?`, frame: FRAMES.lever,
      hint: 'Two levers, the same. Say which one: left or right. The plaque by the door knows.', at: () => ({ x: room.R.x, z: room.R.z - 4.6 }),
      options: () => ['left', 'right'], swim: () => swimAcross(room, true), right: (verb, side) => pullLever(room, side) });
  }
  async function swimAcross(room, back) {
    const a = back ? room.swimTo : room.swimFrom, b = back ? room.swimFrom : room.swimTo;
    G.sim.mimoGo({ x: a.x, z: a.z }, b); await wait(0.7);
    await swimPath(a, b, Y0 + 0.04, Y0);
    room.across = !back;
    G.sim.mimoGo(back ? null : { x: b.x, z: b.z }, back ? null : { x: G.sim.you.x, z: G.sim.you.z });
    if (!back) STORY.think('{mimo} made it across! Now, which lever…?', 3);
  }
  async function pullLever(room, side) {
    const st = S(), lv = room.levers.find(l => l.side === side), M = G.sim.mimo;
    G.sim.mimoGo({ x: lv.x + 0.25, z: lv.z + 1.0 }, { x: lv.x, z: lv.z }); await wait(0.8);
    M.hop = { t: 0 }; Sound.play('hit'); await wait(0.2);
    Sound.play('click'); await tween(0.25, k => { lv.arm.rotation.x = lerp(-0.5, 0.6, k); });
    if (side !== st.leverSide) {       // the other one: a gush of water from the ceiling, right onto Mimo
      await wait(0.3);
      G.w3d.fx.puff(lv.x, Y0 + 2.6, lv.z + 0.8, 16, 0.32, '#cfe9f5'); Sound.play('poof'); M.sad = 1.4; G.sim.mimoSay('…!', 1.2);
      STORY.think('Splash! A gush of water from the ceiling, right onto {mimo}. Not that lever!', 4);
      await wait(0.9); await tween(0.3, k => { lv.arm.rotation.x = lerp(0.6, -0.5, k); });
      G.sim.mimoGo({ x: room.swimTo.x, z: room.swimTo.z }, { x: G.sim.you.x, z: G.sim.you.z });
      return;
    }
    st.lever = true; G.save();
    Sound.play('chest'); Sound.play('land', 12);
    await tween(1.1, k => { room.gate.position.y = 2.4 * k; room.bridge.position.y = lerp(Y0 - 0.5, Y0 + 0.1, k * k * (3 - 2 * k)); });
    unsolid(room.gateSolid); unsolid(room.ford);
    G.w3d.fx.puff(room.R.x, Y0 + 0.2, (room.pool.z0 + room.pool.z1) / 2, 12, 0.3, '#e9f6ff');
    UI.toast('Clank! The gate lifts, and a little bridge rises out of the water.');
    room.across = false; G.sim.mimoGo(null, null);
  }
  // 1: the jar the note names: «¡Lanza una piedra al jarrón del medio!» (break another and the rest shift: two left are left and right)
  const liveJars = room => room.jars.filter(j => j.alive).sort((a, b) => a.x - b.x);
  const jarLabels = n => (n >= 3 ? ['left', 'middle', 'right'] : n === 2 ? ['left', 'right'] : ['middle']);
  function tellJars(room) {
    const name = G.state.mimoName;
    return tellWhich({ kind: 'jar', verbs: ['v.throw'], icon: 'throw', title: `Jars that look the same, way up on the rack. Which one should ${name} aim at?`, frame: FRAMES.jar,
      hint: 'They’re too high to reach… something could fly up there. And say which jar: the note knows.', at: () => ({ x: room.R.x, z: room.R.z - 3.4 }),
      options: () => jarLabels(liveJars(room).length), right: (verb, label) => throwAtJar(room, liveJars(room)[jarLabels(liveJars(room).length).indexOf(label)]) });
  }
  async function throwAtJar(room, j) {
    if (!j) return;
    const st = S(), M = G.sim.mimo;
    G.sim.mimoGo({ x: j.x + 0.4, z: room.R.z - 2.9 }, { x: j.x, z: j.z }); await wait(0.8);
    const pebble = part(GEO.ico1, '#a3a196', [0, 0, 0], [0.14, 0.12, 0.13], { ink: 0.01 }); G.w3d.scene.add(pebble);
    const p0 = V(M.x, Y0 + 0.9, M.z), p1 = V(j.x, Y0 + 2.95, j.z + 0.1);
    M.hop = { t: 0 }; Sound.play('whiff');
    await tween(0.5, k => { pebble.position.set(lerp(p0.x, p1.x, k), lerp(p0.y, p1.y, k) + Math.sin(k * Math.PI) * 1.0, lerp(p0.z, p1.z, k)); pebble.rotation.x += 0.4; });
    G.w3d.scene.remove(pebble);
    Sound.play('crack'); Sound.play('poof'); G.w3d.fx.puff(j.x, Y0 + 2.95, j.z, 14, 0.3, '#d9a37a');
    await tween(0.18, k => j.g.scale.setScalar(1 - k));
    j.g.visible = false; j.alive = false; st.broken = (st.broken || []).concat([j.i]);
    if (j.i !== st.keyJar) {
      const n = liveJars(room).length;
      STORY.think(`Crash! Just dust and old seeds… no key in that one. ${n === 2 ? 'Two left now: the one on the left and the one on the right.' : n === 1 ? 'Only one left!' : ''}`, 5);
      G.sim.mimoGo(null, null); G.save(); return;
    }
    // the key drops, ting: Mimo takes it to the padlock on the door upstairs
    const key = room.key; key.visible = true;
    await tween(0.6, k => key.position.set(j.x, lerp(Y0 + 2.9, Y0 + 0.08, k * k), j.z + 0.5));
    Sound.play('click'); G.w3d.fx.sparkle(j.x, Y0 + 0.3, j.z + 0.5, 12);
    G.sim.mimoGo({ x: j.x + 0.2, z: j.z + 1.2 }, { x: j.x, z: j.z + 0.5 }); await wait(0.8); key.visible = false; Sound.play('pip'); M.happy = 1;
    G.sim.mimoGo({ x: room.door.x - 1.3, z: room.door.z + 0.2 }, room.door); await wait(1.4);
    M.hop = { t: 0 }; Sound.play('chest');
    await tween(0.5, k => { room.padlock.position.y = lerp(1.05, 0.1, k * k); room.chain.visible = k < 0.4; });
    room.padlock.visible = false; unsolid(room.doorSolid); st.door = true;
    G.sim.mimoGo(null, null);
    UI.toast('The key! Click: the padlock drops off the door to the stairs.'); G.save();
  }
  // 2: «¡Salta encima de la lámpara!» (the table's a fine place to stand, but the catch is on top of the lamp)
  function tellLamp(room) {
    const name = G.state.mimoName;
    return tellWhich({ kind: 'lamp', verbs: ['v.jump'], icon: 'jump', title: `The great lamp is latched shut. What should ${name} do?`, frame: FRAMES.lamp,
      hint: 'The catch is up on top of the lamp. Someone bouncy could get up there… say on top of what.', at: () => room.lampAt,
      options: () => ['top'], right: (verb, k, r) => jumpOnto(room, r) });
  }
  async function jumpOnto(room, r) {
    const L = lang(), what = nounOf(r.text, L), pos = posOf(r.text, L), M = G.sim.mimo, T = room.table, C = room.lampAt;
    if (what.has('table') && !what.has('lamp')) {
      G.sim.mimoGo({ x: T.x + 1.1, z: T.z + 0.7 }, T); await wait(0.7);
      await mimoArc({ x: T.x, z: T.z }, Y0 + 0.92, 0.55); Sound.play('land', 6);
      STORY.think('{mimo} hops up onto the table. What a view! But the lamp stays dark… its catch is on top of the lamp.', 5);
      await wait(1.0); await mimoLand(); return;
    }
    if (!what.has('lamp') || !pos.has('top')) {
      G.sim.mimoGo({ x: C.x + 1.3, z: C.z + 1.3 }, C); await wait(0.6); M.hop = { t: 0 }; Sound.play('jump');
      STORY.think(what.has('lamp') ? '{mimo} hops next to the lamp… The catch is on TOP of it. Say on top of what!' : '{mimo} hops on the spot… Up where? On top of what?', 5);
      return;
    }
    G.sim.mimoGo({ x: C.x + 1.4, z: C.z + 1.2 }, C); await wait(0.7);
    await mimoArc({ x: C.x, z: C.z }, Y0 + 2.62, 0.7);
    Sound.play('land', 8); await tween(0.15, k => { room.knob.scale.y = lerp(1, 0.4, k); }); Sound.play('click');
    G.w3d.fx.sparkle(C.x, Y0 + 2.9, C.z, 12);
    await tween(0.6, k => { room.shutters.forEach(s => { s.rotation.x = 1.25 * k * k; }); }); Sound.play('land', 10);
    await wait(0.3); await mimoLand();
    await lampLit(room);
  }
  async function readNote(kind) {
    const st = S(), key = kind === 'lever' ? 'isle.lever.' + (st.leverSide || 'right') : 'isle.jar.' + ['left', 'middle', 'right'][st.keyJar !== undefined ? st.keyJar : 1];
    const L = lang(), e = LT[key], s = (e[L] || e.en)[0], text = L === 'zh' || L === 'ja' ? plainCJK(s) : s, en = e.en[0];
    Sound.play('page');
    const card = { tag: kind === 'lever' ? 'A brass plaque by the door' : 'A note, pinned to a post', lines: [{ text, en }], note: '— the lighthouse keeper' };
    if (typeof SIGNS !== 'undefined' && SIGNS.read) await SIGNS.read(card);
    else await UI.card(`<div class="tag">${esc(card.tag)}</div><div class="note">${esc(text)}</div><div class="sub">${esc(en)} · E</div>`, { kind: 'note' });
  }

  // ------------------------------------------------------------ what you can press E on inside, and where the compass points
  function interactables() {
    const list = [], st = S(), room = rooms[cur]; if (!room) return list;
    const R = room.R, name = G.state.mimoName, say = kind => (quick[kind] ? `«${ex(LEX.form(quick[kind]))}»` : `Tell ${name}`);
    list.push({ x: R.x, z: R.z + RAD - 1.1, y: Y0, r: 1.7, label: cur === 0 ? 'Leave the lighthouse' : 'Go down', run: () => (cur === 0 ? leave() : go(cur - 1, 'above')) });
    if (cur === 0) {
      list.push({ x: room.plaque.x, z: room.plaque.z + 0.7, y: Y0, r: 1.6, label: 'Read', run: () => readNote('lever') });
      if (!st.lever) list.push({ x: R.x, z: room.pool.z1 + 1.1, y: Y0, r: 2.6, label: room.across ? `Tell ${name}` : say('pool'), run: () => tellHall(room) });
      else list.push({ x: room.up.x, z: room.up.z, y: Y0, r: 2.2, label: 'Climb the stairs', run: () => go(1) });
    }
    if (cur === 1) {
      list.push({ x: room.note.x, z: room.note.z + 0.7, y: Y0, r: 1.6, label: 'Read', run: () => readNote('jar') });
      if (!st.door) {
        list.push({ x: R.x, z: R.z - 3.0, y: Y0, r: 2.6, label: `Tell ${name}`, run: () => tellJars(room) });
        list.push({ x: room.up.x, z: room.up.z, y: Y0, r: 1.3, label: 'Look', run: async () => STORY.think('A big padlock on the door to the stairs. The key must be somewhere in here…', 4) });
      } else list.push({ x: room.up.x, z: room.up.z, y: Y0, r: 2.2, label: 'Climb the stairs', run: () => go(2) });
    }
    if (cur === 2) {
      const C = room.lampAt;
      if (!st.lamp) list.push({ x: C.x + 0.4, z: C.z + 2.1, y: Y0, r: 2.8, label: say('lamp'), run: () => tellLamp(room) });
      else list.push({ x: C.x + 0.4, z: C.z + 2.1, y: Y0, r: 2.4, label: 'Look', run: async () => STORY.think('The great lamp shines out over the whole lake again.', 3) });
    }
    return list;
  }
  function target() {
    const st = S(), room = rooms[cur]; if (!room) return null;
    const R = room.R, out = { x: R.x, z: R.z + RAD - 1.1, hint: '{mimo} points at the way down.' };
    if (cur === 0) return st.lever ? Object.assign({}, room.up, { hint: '{mimo} points at the stairs. Up we go!' }) : room.across ? { x: R.x, z: R.z - 4.4, hint: '{mimo} waves from beside the levers. Which one? The plaque by the door says.' } : { x: R.x, z: room.pool.z1 + 1.1, hint: '{mimo} looks at the water… and back at you.' };
    if (cur === 1) return st.door ? Object.assign({}, room.up, { hint: '{mimo} points at the open door to the stairs.' }) : { x: R.x, z: R.z - 3.0, hint: '{mimo} points up at the jars. The note on the post says which one.' };
    if (cur === 2) return st.lamp ? out : Object.assign({}, room.lampAt, { hint: '{mimo} stares at the lamp’s catch, way up on top.' });
    return out;
  }

  // ------------------------------------------------------------ moving between rooms, in and out
  function teleport(x, z, yaw) { const Y = G.sim.you, M = G.sim.mimo; Y.x = x; Y.z = z; Y.yaw = yaw; M.x = x + 1.1; M.z = z + 0.8; M.hidden = false; M.station = null; G.cast.mimo.root.visible = true; G.sim.snap(); }
  function show(i) { rooms.forEach((r, k) => { r.g.visible = k === i; }); cur = i; quick = {}; if (rooms[i]) rooms[i].across = false; }
  function hideAll() { rooms.forEach(r => { r.g.visible = false; }); cur = -1; quick = {}; }
  async function enter() {
    build();
    await UI.fade(1, 450);
    inside = true; G.w3d.setInterior({ fog: '#22323a', near: 18, far: 50 });
    show(0); const R = ROOMS[0]; teleport(R.x, R.z + 4.6, Math.PI); G.cam.snap(Math.PI, 0.62, 10.5);
    await UI.fade(0, 450);
    const st = S();
    if (!st.seen0) { st.seen0 = true; UI.chapter(R.name, R.sub); STORY.think('The whole floor is flooded! The stairs are across the water, behind a gate. Two levers over there… and a plaque by the door.', 6); }
    G.save();
  }
  async function leave() {
    await UI.fade(1, 450);
    hideAll(); inside = false; G.w3d.setInterior(null);
    const O = ISLE.OUTSIDE; teleport(O.x, O.z, O.yaw); G.cam.snap(O.yaw, 0.3, 8.5);
    await UI.fade(0, 450);
  }
  async function go(i, from = 'below') {
    await UI.fade(1, 350);
    show(i);
    const R = ROOMS[i], room = rooms[i];
    if (from === 'above') { const u = room.up, dx = R.x - u.x, dz = R.z - u.z; teleport(u.x + Math.sign(dx) * 0.8, u.z + Math.sign(dz) * 0.8, Math.atan2(dx, dz)); }
    else teleport(R.x, R.z + 4.6, Math.PI);
    G.cam.snap(Math.PI, 0.62, 10.5);
    await UI.fade(0, 350);
    const st = S();
    if (!st['seen' + i]) {
      st['seen' + i] = true; UI.chapter(R.name, R.sub);
      if (i === 1 && !st.ambush) {      // frogs from the flooded hall jump you as you come up
        await wait(1.2);
        await STORY.you('Frogs! They hopped up here out of the flooded hall. Get ready, {mimo}!');
        const r = await G.fight({ foes: [{ kind: 'frog', color: 'yellow', size: 'small' }, { kind: 'frog', color: 'yellow', size: 'small' }, { kind: 'hushling', color: 'blue', size: 'small' }], place: Object.assign(isl(3, 0), { biome: 'lake' }) });
        if (r && r.outcome === 'win') st.ambush = true; else { st['seen' + i] = false; await go(i - 1, 'above'); return; }
        STORY.think('Three jars up on a high rack, all the same… and the door to the stairs is padlocked. There’s a note pinned to that post.', 6);
      }
      if (i === 2) STORY.think('The great lamp, dark and gray. Its shutters are latched… the catch is right on top of it.', 6);
    }
    G.save();
  }
  function update(dt, t) {
    if (!inside || cur < 0) return;
    const room = rooms[cur], st = S();
    if (G.sim.lock && !STORY.busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    if (cur === 0) { const M = mats(); M.waterTex.offset.x = (M.waterTex.offset.x + dt * 0.03) % 1; M.waterTex.offset.y = Math.sin(t * 0.5) * 0.04; }
    if (cur === 2) {
      room.lit = damp(room.lit || 0, st.lamp ? 1 : 0, 2.5, dt);
      room.lensMat.color.set('#8f9aa3').lerp(new THREE.Color('#fff1b0'), room.lit);
      room.glow.material.opacity = room.lit * (0.75 + 0.15 * Math.sin(t * 3));
    }
  }
  // ------------------------------------------------------------ outside again: the beam, the giant frog by the bell, Noa's page, the bell
  let frogs = null, pageFloat = null;
  const STORY_SPOT = isl(9.3, 1.6);          // (on the island's jetty: where you face the frog, fetch the page, ring the bell)
  function lilyPad(r, flower) {
    const g = new THREE.Group();
    g.add(part(new THREE.CylinderGeometry(r, r, 0.08, 24, 1, false, 0.35, TAU - 0.7), '#5aa84a', [0, 0, 0], null, { ink: 0.012 }));
    for (let k = 0; k < 5; k++) { const a = 0.8 + k * 1.1; g.add(part(GEO.box, '#3f8a3a', [Math.cos(a) * r * 0.45, 0.045, Math.sin(a) * r * 0.45], [r * 0.8, 0.012, 0.03], { rot: [0, -a, 0], ink: 0 })); }
    if (flower) {
      for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; g.add(part(GEO.sphere, '#f6a9c5', [-r * 0.55 + Math.cos(a) * 0.13, 0.11, -r * 0.3 + Math.sin(a) * 0.13], [0.1, 0.06, 0.16], { rot: [0, -a, 0], ink: 0 })); }
      g.add(part(GEO.sphere, '#ffd447', [-r * 0.55, 0.13, -r * 0.3], [0.08, 0.06, 0.08], { ink: 0 }));
    }
    return g;
  }
  function ensureFrogs() {
    if (frogs) return frogs;
    const g = new THREE.Group(); g.visible = false; G.w3d.scene.add(g);
    const P = LAKE.layout.frogPads, w = W(), J = STORY_SPOT;
    const mk = (color, size, s) => {
      let m = null; try { if (typeof BATTLE !== 'undefined' && BATTLE.buildFoe) m = BATTLE.buildFoe('frog', color, { size }); } catch (e) { console.warn('[isle] frog model', e); }
      if (!m) { m = new THREE.Group(); m.add(part(GEO.sphere, '#7fa86a', [0, 0.4, 0], [0.5, 0.4, 0.55], { ink: 0.02 })); }
      m.scale.multiplyScalar(s); return m;
    };
    const one = (p, color, size, s, flower) => {
      const pad = lilyPad(p.r, flower); pad.position.set(p.x, w + 0.02, p.z); g.add(pad);
      const m = mk(color, size, s); m.position.set(p.x, w + 0.06, p.z); m.rotation.y = Math.atan2(J.x - p.x, J.z - p.z); g.add(m);
      return { pad, m, p, y0: w + 0.06, mood: 'idle' };
    };
    frogs = { g, boss: one(P.boss, 'green', 'big', 2.1, true), left: one(P.left, 'blue', 'small', 1.3, false), right: one(P.right, 'blue', 'small', 1.3, true) };
    return frogs;
  }
  function ensurePage() {
    if (pageFloat) return pageFloat;
    const P = LAKE.layout.frogPads.boss, g = new THREE.Group(); g.position.set(P.x + 0.4, W() + 0.04, P.z - 1.0); g.visible = false; G.w3d.scene.add(g);
    g.add(lilyPad(0.55, false));
    const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ color: '#fffaf0', side: THREE.DoubleSide })); sheet.rotation.set(-Math.PI / 2, 0, 0.3); sheet.position.y = 0.07; g.add(sheet);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3b0', transparent: true, opacity: 0.5, depthWrite: false })); glow.scale.setScalar(1.4); glow.position.y = 0.25; g.add(glow);
    g.userData.glow = glow;
    pageFloat = g; return g;
  }
  function outdoorExtra() {        // (applyOutdoor: the frogs by the bell while the lamp is lit and the fight not won; the page until it's read)
    const st = S();
    if (st.lamp && !st.boss) { ensureFrogs(); frogs.g.visible = true; for (const k of ['boss', 'left', 'right']) { frogs[k].m.position.y = frogs[k].y0; frogs[k].m.visible = true; } }
    else if (frogs) frogs.g.visible = false;
    ensurePage().visible = !!st.boss && !st.page;
  }
  function outdoorFrame(dt, t) {
    if (frogs && frogs.g.visible) for (const k of ['boss', 'left', 'right']) {
      const f = frogs[k], m = f.m;
      if (m.userData.animate) { m.userData.mood = f.mood; m.userData.animate(dt, t + (k === 'boss' ? 0 : k === 'left' ? 1.3 : 2.1), 0); }
      f.pad.position.y = W() + 0.02 + Math.sin(t * 1.3 + f.p.x) * 0.02;
    }
    if (pageFloat && pageFloat.visible) { pageFloat.position.y = W() + 0.04 + Math.sin(t * 1.6) * 0.03; pageFloat.userData.glow.material.opacity = 0.4 + 0.2 * Math.sin(t * 3); }
  }
  function finaleSpots(name) {
    const st = S(), f = F(), list = [], at = STORY_SPOT;
    if (!f.isleLanded) return list;
    if (st.lamp && !st.boss) list.push({ x: at.x, z: at.z, r: 1.7, label: 'Face the frog', run: frogFight });
    else if (st.boss && !st.page) list.push({ x: at.x, z: at.z, r: 1.7, label: 'Look', run: fetchPage });
    else if (st.page && !f.lakeFree) list.push({ x: at.x, z: at.z, r: 1.7, label: quick.bell ? `«${ex(LEX.form(quick.bell))}»` : `Tell ${name}`, run: tellBell });
    return list;
  }
  // the lamp shines again: outside, its beam sweeps over the water and stops on the bell… and something big comes up beside it
  async function lampLit(room) {
    const st = S(), L = lk(), w = W(), P = LAKE.layout.frogPads.boss, lamp = LAKE.landmarks.lighthouse;
    scene = true; G.sim.lock = 1;
    try {
      st.lamp = true; G.save();
      await wait(0.8);
      await STORY.you('It’s lit! The light is pouring out over the whole lake…');
      await UI.fade(1, 700);
      hideAll(); inside = false; G.w3d.setInterior(null);
      L.setLighthouseLit(true);
      const yaw = Math.atan2(P.x - lamp.x, P.z - lamp.z);
      L.aimBeam(yaw - 1.4, 0.42);
      teleport(STORY_SPOT.x, STORY_SPOT.z, Math.atan2(P.x - STORY_SPOT.x, P.z - STORY_SPOT.z));
      ensureFrogs(); frogs.g.visible = true;
      for (const k of ['boss', 'left', 'right']) { frogs[k].m.position.y = w - 2.8; frogs[k].mood = 'idle'; }
      G.cam.override = { pos: V(IS.x + 19.4, 4.8, IS.z - 1.4), look: V(IS.x + 8.5, 1.6, IS.z + 9.6), dur: 0.01 };
      await UI.fade(0, 800);
      L.aimBeam(yaw, 0.42);                // (the beam swings across the water to the bell)
      await wait(2.2);
      for (let k = 0; k < 4; k++) { G.w3d.fx.puff(P.x + (Math.random() - 0.5) * 1.2, w + 0.08, P.z + (Math.random() - 0.5) * 1.2, 5, 0.22, '#e9f6ff'); Sound.play('pip'); await wait(0.32); }
      Sound.play('swoosh');
      await tween(0.9, k => { frogs.boss.m.position.y = lerp(w - 2.8, frogs.boss.y0, easeOutBack(k, 1.6)); });
      G.w3d.fx.puff(P.x, w + 0.3, P.z, 18, 0.45, '#e9f6ff'); Sound.play('croak'); Sound.play('shout'); frogs.boss.mood = 'alert';
      G.cam.override = { pos: V(P.x - 3.6, 2.9, P.z - 6.4), look: V(P.x + 0.4, 1.4, P.z), dur: 0.9 };      // (from the island's side: the buoy isn't in the way)
      await wait(1.1);
      for (const k of ['left', 'right']) {
        const f = frogs[k]; G.w3d.fx.puff(f.p.x, w + 0.2, f.p.z, 10, 0.3, '#e9f6ff'); Sound.play('jump');
        await tween(0.4, u => { f.m.position.y = lerp(w - 1.6, f.y0, easeOutBack(u, 2)); }); f.mood = 'alert';
      }
      Sound.play('croak');
      const B = bart(); if (B) await STORY.sayAt(B, 'bartolo.frog', 'Bartolo');
      await STORY.you('So that’s why the {w.bell} can’t ring: a giant frog, sitting right beside it! Get ready, {mimo}!');
    } finally { G.cam.override = null; L.aimBeam(null); G.sim.lock = 0; scene = false; sig = ''; }
    await frogFight();
  }
  // the boss: the giant frog on its lily pad (it stays put: too heavy to hop), and two look-alike helpers that swap pads
  async function frogFight() {
    const st = S(), P = LAKE.layout.frogPads.boss;
    const r = await G.fight({ foes: [{ kind: 'frog', color: 'blue', size: 'small' }, { kind: 'frog', color: 'green', size: 'big', hp: 18, giant: 2.1 }, { kind: 'frog', color: 'blue', size: 'small' }],
      place: { x: P.x, z: P.z, biome: 'lake' } });
    if (!r || r.outcome !== 'win') { STORY.think(r && r.outcome === 'lose' ? 'Ouch… Catch your breath, then face it again.' : 'The giant frog settles back beside the bell, croaking.', 4); return; }
    st.boss = true; G.save();
    await afterFrog();
  }
  async function afterFrog() {
    const w = W(), P = LAKE.layout.frogPads.boss;
    scene = true; G.sim.lock = 1;
    try {
      ensureFrogs(); frogs.g.visible = true;
      G.cam.override = { pos: V(P.x - 3.6, 2.9, P.z - 6.6), look: V(P.x + 0.4, 1.0, P.z), dur: 0.01 };
      await wait(0.7);
      Sound.play('croak'); frogs.boss.mood = 'happy'; frogs.left.mood = frogs.right.mood = 'happy';
      await wait(0.9);
      // one last croak (a friendly one), and they dive back into the lake
      for (const k of ['left', 'right', 'boss']) {
        const f = frogs[k]; Sound.play('jump');
        await tween(0.45, u => { f.m.position.y = f.y0 + Math.sin(u * Math.PI) * 1.2 - u * u * 2.8; });
        G.w3d.fx.puff(f.p.x, w + 0.1, f.p.z, 12, 0.32, '#e9f6ff'); Sound.play('poof'); f.m.visible = false;
      }
      frogs.g.visible = false;
      ensurePage().visible = true; Sound.play('page');
      await wait(0.7);
      await STORY.you('Something’s floating where the frog was sitting… a page from Noa’s notebook!');
    } finally { G.cam.override = null; G.sim.lock = 0; scene = false; sig = ''; }
    await fetchPage();
  }
  // Mimo swims out for Noa's page and brings it back to the jetty
  async function fetchPage() {
    const st = S(), w = W(), pg = ensurePage(), at = { x: pg.position.x, z: pg.position.z }, edge = { x: STORY_SPOT.x + 1.0, z: STORY_SPOT.z + 0.75 };
    scene = true; G.sim.lock = 1;
    try {
      pg.visible = true;
      G.cam.override = { pos: V(edge.x - 4.3, 3.8, edge.z - 1.9), look: V(at.x - 0.2, 0.3, at.z - 2.6), dur: 1.0, back: 1.0 };     // (from the island's side: the ferry isn't in the way)
      G.sim.mimoGo(edge, at); await wait(0.8);
      await swimPath(edge, at, w, null, { out: false });
      pg.visible = false; Sound.play('pip'); G.w3d.fx.sparkle(at.x, w + 0.4, at.z, 10);
      await swimPath(at, edge, w, G.sim.ground(edge.x, edge.z), { in: false });
      G.sim.mimoGo(null, null); G.sim.mimo.happy = 1.2;
      G.cam.override = null;
      Sound.play('page');
      await UI.page('page.lake', 'w.mountain');
      st.page = true; if (!G.state.pages.includes('page.lake')) G.state.pages.push('page.lake');
      await STORY.you('Noa went north, to the {w.mountain:pl}… and the quarry. But first, let’s ring this {w.bell}, {mimo}!');
    } finally { G.cam.override = null; G.sim.lock = 0; scene = false; sig = ''; }
    G.save();
  }
  // the bell: «¡Golpea la campana!» (Mimo swims out to the buoy and gives it a good whack); a swim just goes round it
  function tellBell() {
    const name = G.state.mimoName;
    return tell({ kind: 'bell', verbs: ['v.hit'], icon: 'hit', title: `The lake’s bell floats out there on its buoy, gray and silent. What should ${name} do?`, hint: 'A bell rings when something strikes it…',
      at: () => ({ x: STORY_SPOT.x + 1.0, z: STORY_SPOT.z + 0.8 }), right: ringBell, swim: swimRound });
  }
  async function swimRound() {
    const w = W(), Bu = LAKE.landmarks.buoy, edge = { x: STORY_SPOT.x + 1.0, z: STORY_SPOT.z + 0.75 };
    scene = true; G.sim.lock = 1;
    try {
      G.sim.mimoGo(edge, Bu); await wait(0.6);
      await swimPath(edge, { x: Bu.x - 1.2, z: Bu.z - 1.0 }, w, null, { out: false });
      await swimPath({ x: Bu.x - 1.2, z: Bu.z - 1.0 }, { x: Bu.x + 1.2, z: Bu.z + 0.6 }, w, null, { in: false, out: false });
      await swimPath({ x: Bu.x + 1.2, z: Bu.z + 0.6 }, edge, w, G.sim.ground(edge.x, edge.z), { in: false });
      G.sim.mimoGo(null, null);
      STORY.think('{mimo} swims a happy lap round the buoy… The bell needs a good whack, though!', 4);
    } finally { G.sim.lock = 0; scene = false; }
  }
  async function ringBell() {
    const f = F(), L = lk(), w = W(), Bu = LAKE.landmarks.buoy, M = G.sim.mimo, edge = { x: STORY_SPOT.x + 1.0, z: STORY_SPOT.z + 0.75 }, near = { x: Bu.x - 0.8, z: Bu.z - 1.3 };
    scene = true; G.sim.lock = 1;
    try {
      G.cam.override = { pos: V(Bu.x + 4.8, 3.2, Bu.z + 5.6), look: V(Bu.x - 0.6, 0.9, Bu.z - 1.2), dur: 1.0 };      // (from the south: the ferry's out of the way)
      G.sim.mimoGo(edge, Bu); await wait(0.7);
      await swimPath(edge, near, w, null, { out: false });
      await mimoArc({ x: Bu.x, z: Bu.z - 0.3 }, w + 0.55, 0.6);        // up onto the buoy's raft…
      Sound.play('hit'); M.happy = 1;
      for (let k = 0; k < 3; k++) { Sound.play('bell'); Sound.play('bigbell'); L.ringBuoy(5); G.w3d.fx.sparkle(Bu.x, w + 2.2, Bu.z, 16); await wait(0.9); }
      f.lakeFree = true; f.bells = Math.max(2, f.bells || 0); sig = '';
      L.setBuoyHushed(false);
      const hi = WORLD.L.hush.findIndex(h => h.buoy); if (hi >= 0) G.w3d.liftHush(hi);
      G.save();
      await swimPath(near, edge, w, G.sim.ground(edge.x, edge.z));      // …and back to the jetty
      G.sim.mimoGo(null, null);
    } finally { G.cam.override = null; G.sim.lock = 0; scene = false; }
    await finale();
  }
  // the colour floods back over the lake; bell 2 of 8; Bartolo knows where the next one is: north, under the mountains
  async function finale() {
    const L = lk(), B = bart(), Y = G.sim.you;
    scene = true; G.sim.lock = 1;
    try {
      G.cam.override = { pos: V(IS.x + 25.5, 12, IS.z - 10), look: V(IS.x + 11, 0, IS.z + 8), dur: 1.6 };
      for (let k = 0; k < 3; k++) { Sound.play('bell'); L.ringBuoy(4); await wait(1.1); }
      await UI.chapter('The second bell', '2 of 8 · The Mirror Lake sings again');
      G.cam.override = null;
      await wait(0.6);
      await STORY.you('Listen… the whole lake is ringing! Two bells down, six to go.');
      if (B) {
        const fp = LAKE.layout.ferryIsle;
        L.pinPerson('bartolo', Object.assign(deck(fp.x, fp.z, 0, -2.3), { y: W() + 0.44, yaw: Math.PI, face: false }));
        G.cam.override = { pos: V(Y.x - 1.0, Y.ry + 2.3, Y.z + 2.4), look: V(Y.x - 2, Y.ry + 9, Y.z - 70), dur: 1.8, back: 1.2 };     // (over your shoulder, north to the mountains)
        await wait(1.2);
        await STORY.sayAt(B, 'bartolo.north', 'Bartolo');
        G.cam.override = null; placeFerry(true);
      }
      if (LEX.item('w.mountain') && !LEX.taught('w.mountain')) await STORY.teachWord('w.mountain', { look: { x: Y.x + 8, z: Y.z - 80 }, title: `${G.state.mimoName} stares at the mountains far to the north. What are they called?` });
      await STORY.you('The Quarry Caves, up north under the {w.mountain:pl}. That’s where Noa went. Let’s go, {mimo}!');
    } finally { G.cam.override = null; G.sim.lock = 0; scene = false; sig = ''; }
    G.save();
  }

  return {
    init(game) { G = game; bellCJK(); },
    enter, update, interactables, target, outdoor, outside, bartolo, rideFerry, quest, WHERE, ROOMS,
    get inside() { return inside; }, get room() { return cur; }, get busy() { return scene; },
    get OUTSIDE() { const D = typeof LAKE !== 'undefined' && LAKE.landmarks.lighthouseDoor; return D ? { x: D.x + 1.4, z: D.z, yaw: Math.PI / 2 } : Object.assign(isl(4, 0), { yaw: Math.PI / 2 }); },
    _: { S, Q, applyOutdoor, placeFerry, itemPos, lookItem, tellBartolo, partialLine, bartoloFree, fetchItem, chant, get sig() { return sig; }, set sig(v) { sig = v; },
      rooms, build, applyState, go, leave, tellHall, tellJars, tellLamp, swimAcross, pullLever, throwAtJar, jumpOnto, liveJars, posOf, nounOf,
      lampLit, frogFight, afterFrog, fetchPage, tellBell, ringBell, finale, ensureFrogs, get frogs() { return frogs; }, STORY_SPOT, JETTY_AT },
  };
})();
