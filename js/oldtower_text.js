'use strict';
// The Old Tower's words (oldtower.js, oldtower_boss.js; DESIGN.md 17.1, game/REGIONS.md): every line in es / pt / de, zh and
// ja (CJK.md's notation) and en. Spoken lines go into lines.js's LINES (keys 'ot.*') and are said through the story's shared
// say functions, so they follow the game's rule for showing a line: people (Noa crying out, the hooded figure) through the
// weave (STORY.sayAt: the English with the words you know in the language), Noa's echoes as demonstrations (STORY.demoAt: the
// language, with the new word glossed; the new word is the {w.*} slot). English on request (EN). Your own lines are English
// with your words woven in (STORY.you). The figure's lines are short, in words you know. Loads before oldtower.js.
//   OTXT.FLOORS[i]: the floor's sentence (verb + a thing): model, frame, the thing's chip and forms, extra verb forms
//   OTXT.NAMES, OTXT.FIGHT (battle lines as [text, en]), OTXT.CAPS (the fall into the past), OTXT.pick(T, l), OTXT.check()
//   OTXT.words(): at init, the things the floors need as words (w.fog, w.sand) if no region has them yet, the birds' plural
const OTXT = (() => {
  const L = (es, pt, de, zh, ja, en) => ({ es: [es], pt: [pt], de: [de], zh: [zh], ja: [ja], en: [en] });

  // ------------------------------------------------------------ lines
  const LINES_OT = {
    // the inscription over the door, and the yard's old sign
    'ot.sign': L('Ocho {w.bell:pl}. Una puerta.', 'Oito {w.bell:pl}. Uma porta.', 'Acht {w.bell:pl}. Eine Tür.',
      '[八|bā] [口|kǒu] {w.bell} ， [一|yī] [扇|shàn] [门|mén] 。', '[八|やっ]つ の {w.bell} 、 [一|ひと]つ の [扉|とびら] 。', 'Eight {w.bell:pl}. One door.'),
    // Noa's echoes: her voice, caught in the tower when she climbed it (the Hush keeps the words it takes). Each floor's says the
    // floor's sentence while she does it: a demonstration, the floor's thing as its {w.*} slot (the new word, glossed)
    'ot.noa.in': L('¿Hola? ¿Hay alguien aquí? …La puerta se cerró.', 'Olá? Tem alguém aqui? …A porta fechou.', 'Hallo? Ist hier jemand? …Die Tür ist zu.',
      '[你好|nǐ hǎo] ？ [有|yǒu] [人|rén] [吗|ma] ？ … [门|mén] [关上|guān shàng] [了|le] 。', 'すみません ！ だれ か います か ？ … [扉|とびら] が [閉|し]まっちゃった 。',
      '{w.hello}? Is anyone here? …The door shut behind me.'),
    'ot.noa.1': L('¡Brr, qué fría! Vamos, Noa: ¡nada hasta la {w.rope}!', 'Brr, que fria! Vai, Noa: nada até a {w.rope}!', 'Brr, ist das kalt! Los, Noa: schwimm zum {w.rope}!',
      '[好|hǎo] [冷|lěng] ！ [加油|jiā yóu] ， [诺娅|Nuò yà] ： [游|yóu] [到|dào] {w.rope} [那里|nà lǐ] ！', '[冷|つめ]たい ！ がんばれ 、 ノア 。 {w.rope} まで [泳|およ]げ ！',
      'Brr, the {w.water} is cold! Come on, Noa: swim to the {w.rope}!'),
    'ot.noa.2': L('¡Uf, no se mueve! Hay una {w.stone}… ¡Empuja la {w.stone}, Noa!', 'Ufa, não mexe! Tem uma {w.stone}… Empurra a {w.stone}, Noa!', 'Uff, es bewegt sich nicht! Da ist ein {w.stone}… Schieb den {w.stone}, Noa!',
      '[哎呀|āi yā] ， [动不了|dòng bù liǎo] ！ [有|yǒu] [一块|yī kuài] {w.stone} … [推|tuī] {w.stone} ， [诺娅|Nuò yà] ！', 'うーん 、 [動|うご]かない ！ {w.stone} が ある … {w.stone} を [押|お]せ 、 ノア ！',
      'Ugh, it won’t move! There’s a {w.stone}… Push the {w.stone}, Noa!'),
    'ot.noa.3': L('Qué oscuro… Los {w.crystal:pl} escuchan. ¡Canta a los {w.crystal:pl}, Noa!', 'Que escuro… Os {w.crystal:pl} escutam. Canta para os {w.crystal:pl}, Noa!', 'So dunkel… Die {w.crystal:pl} hören zu. Sing für die {w.crystal:pl}, Noa!',
      '[好|hǎo] [黑|hēi] [啊|a] … {w.crystal} [在|zài] [听|tīng] 。 [对|duì] [着|zhe] {w.crystal} [唱歌|chàng gē] ， [诺娅|Nuò yà] ！', '[暗|くら]い … {w.crystal} は [聞|き]いて いる 。 {w.crystal} に [歌|うた]え 、 ノア ！',
      'So dark… The {w.crystal:pl} are listening. Sing to the {w.crystal:pl}, Noa!'),
    'ot.noa.4': L('¿Un {w.tree}, en la {w.tower}? El camino está arriba. ¡Trepa al {w.tree}, Noa!', 'Uma {w.tree}, na {w.tower}? O caminho está lá em cima. Sobe na {w.tree}, Noa!', 'Ein {w.tree}, im {w.tower}? Der Weg ist da oben. Kletter auf den {w.tree}, Noa!',
      '{w.tower} [里|lǐ] [有|yǒu] [一棵|yī kē] {w.tree} ？ [路|lù] [在|zài] [上面|shàng miàn] 。 [爬|pá] {w.tree} ， [诺娅|Nuò yà] ！', '{w.tower} の [中|なか] に {w.tree} ？ [道|みち] は [上|うえ] だ 。 {w.tree} に [登|のぼ]れ 、 ノア ！',
      'A {w.tree}, in the {w.tower}? The way is up there. Climb the {w.tree}, Noa!'),
    'ot.noa.5': L('Esta {w.fog} gris… No veo nada. ¡Sopla la {w.fog}, Noa!', 'Essa {w.fog} cinza… Não vejo nada. Sopra a {w.fog}, Noa!', 'Dieser graue {w.fog}… Ich sehe nichts. Puste den {w.fog} weg, Noa!',
      '[灰色|huī sè] [的|de] {w.fog} … [什么|shén me] [都|dōu] [看不见|kàn bù jiàn] 。 [把|bǎ] {w.fog} [吹|chuī] [走|zǒu] ， [诺娅|Nuò yà] ！', '[灰色|はいいろ] の {w.fog} … [何|なに] も [見|み]えない 。 {w.fog} を [吹|ふ]け 、 ノア ！',
      'This gray {w.fog}… I can’t see a thing. Blow the {w.fog} away, Noa!'),
    'ot.noa.6': L('¡Los {w.bird:pl}! Ellos llegan a la {w.rope}. ¡Llama a los {w.bird:pl}, Noa!', 'Os {w.bird:pl}! Eles alcançam a {w.rope}. Chama os {w.bird:pl}, Noa!', 'Die {w.bird:pl}! Sie kommen an das {w.rope}. Ruf die {w.bird:pl}, Noa!',
      '{w.bird} ！ [它们|tā men] [够得着|gòu de zháo] {w.rope} 。 [叫|jiào] {w.bird} [过来|guò lái] ， [诺娅|Nuò yà] ！', '{w.bird} ！ {w.rope} に [届|とど]く 。 {w.bird} を [呼|よ]べ 、 ノア ！',
      'The {w.bird:pl}! They can reach the {w.rope}. Call the {w.bird:pl}, Noa!'),
    'ot.noa.7': L('Hay {w.sand} por todos lados… La puerta está debajo. ¡Cava en la {w.sand}, Noa!', 'Tem {w.sand} pra todo lado… A porta está embaixo. Cava na {w.sand}, Noa!', 'Überall {w.sand}… Die Tür ist darunter. Grab im {w.sand}, Noa!',
      '[到处|dào chù] [都|dōu] [是|shì] {w.sand} … [门|mén] [在|zài] [下面|xià miàn] 。 [在|zài] {w.sand} [里|lǐ] [挖|wā] ， [诺娅|Nuò yà] ！', '{w.sand} だらけ … [扉|とびら] は [下|した] に ある 。 {w.sand} を [掘|ほ]れ 、 ノア ！',
      'There’s {w.sand} everywhere… The door is under it. Dig in the {w.sand}, Noa!'),
    'ot.noa.8': L('Sombras por todos lados… ¿Dónde está la {w.door}? ¡Ilumina la {w.door}, Noa!', 'Sombras pra todo lado… Cadê a {w.door}? Ilumina a {w.door}, Noa!', 'Überall Schatten… Wo ist die {w.door}? Leucht die {w.door} an, Noa!',
      '[到处|dào chù] [都|dōu] [是|shì] [影子|yǐng zi] … {w.door} [在|zài] [哪里|nǎ lǐ] ？ [照亮|zhào liàng] {w.door} ， [诺娅|Nuò yà] ！', '[影|かげ] だらけ … {w.door} は どこ ？ {w.door} を [照|て]らせ 、 ノア ！',
      'Shadows everywhere… Where’s the {w.door}? Light up the {w.door}, Noa!'),
    'ot.noa.steps': L('Hay alguien arriba. Oigo pasos.', 'Tem alguém lá em cima. Estou ouvindo passos.', 'Da oben ist jemand. Ich höre Schritte.',
      '[上面|shàng miàn] [有|yǒu] [人|rén] 。 [我|wǒ] [听到|tīng dào] [脚步声|jiǎo bù shēng] [了|le] 。', '[上|うえ] に だれ か いる 。 [足音|あしおと] が [聞|き]こえる 。',
      'Someone is up there, in the {w.tower}. I can hear steps.'),
    'ot.noa.book': L('¡Mi cuaderno! ¿Dónde está mi cuaderno? Estaba aquí…', 'Meu caderno! Cadê o meu caderno? Estava aqui…', 'Mein Heft! Wo ist mein Heft? Es war doch hier…',
      '[我|wǒ] [的|de] [本子|běn zi] ！ [我|wǒ] [的|de] [本子|běn zi] [在|zài] [哪里|nǎ lǐ] ？ [刚才|gāng cái] [还|hái] [在|zài] [这里|zhè lǐ] …', '[私|わたし] の ノート ！ ノート は どこ ？ ここ に あった のに …',
      'My notebook! Where’s my notebook? It was right here…'),
    'ot.noa.who': L('¿Quién eres? ¡Mis palabras! ¡Devuélvelas!', 'Quem é você? Minhas palavras! Devolve!', 'Wer bist du? Meine Wörter! Gib sie zurück!',
      '[你|nǐ] [是|shì] [谁|shéi] ？ [我|wǒ] [的|de] [话|huà] ！ [还给|huán gěi] [我|wǒ] ！', 'あなた は だれ ？ [私|わたし] の [言葉|ことば] ！ [返|かえ]して ！',
      'Who are you? My words! Give them back!'),
    // the top: Noa in the great clock (said through the weave)
    'ot.noa.help': L('¡Aquí! ¡Estoy en el {w.clock}!', 'Aqui! Estou no {w.clock}!', 'Hier! Ich bin in der {w.clock}!',
      '[这里|zhè lǐ] ！ [我|wǒ] [在|zài] {w.clock} [里|lǐ] ！', 'ここ ！ {w.clock} の [中|なか] ！', 'Here! I’m in the {w.clock}!'),
    // the hooded figure: short, in words you know, said through the weave like anyone's (his English keeps a word of yours)
    'ot.hood.shh': L('Shh…', 'Shh…', 'Pst…', '[嘘|xū] …', 'しーっ …', 'Shh…'),
    'ot.hood.up': L('Aquí arriba, en la {w.tower}, nadie habla.', 'Aqui em cima, na {w.tower}, ninguém fala.', 'Hier oben im {w.tower} spricht niemand.',
      '{w.tower} [上|shàng] ， [没有|méi yǒu] [人|rén] [说话|shuō huà] 。', 'この {w.tower} で は 、 だれ も [話|はな]さない 。', 'Up here in the {w.tower}, nobody talks.'),
    'ot.hood.hurt': L('Las palabras duelen. El silencio, no.', 'As palavras doem. O silêncio, não.', 'Wörter tun weh. Die Stille nicht.',
      '[话|huà] [会|huì] [伤|shāng] [人|rén] 。 [寂静|jì jìng] [不|bù] [会|huì] 。', '[言葉|ことば] は いたい 。 [静寂|せいじゃく] は いたく ない 。', 'Words hurt. {c.silence} doesn’t.'),
    'ot.hood.laugh': L('Una palabra mal… y todo el pueblo se ríe.', 'Uma palavra errada… e a vila inteira ri.', 'Ein falsches Wort… und das ganze Dorf lacht.',
      '[说|shuō] [错|cuò] [一个|yī gè] [词|cí] … [全|quán] [村|cūn] [都|dōu] [笑|xiào] 。', '[一|ひと]つ [間違|まちが]える と … [村|むら] の みんな が [笑|わら]う 。', 'One wrong word… and the whole {c.village} laughs.'),
    'ot.hood.here': L('Aquí, nadie se ríe.', 'Aqui, ninguém ri.', 'Hier lacht niemand.',
      '[这里|zhè lǐ] ， [没有|méi yǒu] [人|rén] [笑|xiào] 。', 'ここ で は 、 だれ も [笑|わら]わない 。', 'Here, nobody laughs. Only {c.silence}.'),
  };
  if (typeof LINES !== 'undefined') for (const k of Object.keys(LINES_OT)) if (!LINES[k]) LINES[k] = LINES_OT[k];
  // The things the floors need as words: the fog and the sand (unless a region has them already: then theirs is used), the
  // birds' plural, and zh / ja for the door (interiors.js fills those in; a gap here only ever adds, never replaces)
  function words() {
    if (typeof LEX === 'undefined') return;
    if (!LEX.item('w.fog')) LEX.register([{ id: 'w.fog', kind: 'word', es: 'niebla', pt: 'névoa', de: 'Nebel', en: 'fog', zh: '[雾|wù]', ja: '[霧|きり]', g: { es: 'f', pt: 'f', de: 'm' }, icon: 'fog', alt: { es: ['neblina', 'bruma'], pt: ['neblina'] } }]);
    if (!LEX.item('w.sand')) LEX.register([{ id: 'w.sand', kind: 'word', es: 'arena', pt: 'areia', de: 'Sand', en: 'sand', zh: '[沙子|shā zi]', ja: '[砂|すな]', g: { es: 'f', pt: 'f', de: 'm' }, icon: 'sand', alt: { zh: ['[沙|shā]'] } }]);
    const fill = (id, o) => { const it = LEX.item(id); if (!it) return; for (const [k, v] of Object.entries(o)) if (k === 'pl') { it.pl = it.pl || {}; for (const [l, w] of Object.entries(v)) if (!it.pl[l]) it.pl[l] = w; } else if (!it[k]) it[k] = v; };
    fill('w.bird', { pl: { es: 'pájaros', pt: 'pássaros', de: 'Vögel', zh: '[鸟|niǎo]', ja: '[鳥|とり]' } });
    fill('w.crystal', { pl: { zh: '[水晶|shuǐ jīng]', ja: '[水晶|すいしょう]' } });
    fill('w.bell', { zh: '[钟|zhōng]', ja: '[鐘|かね]', pl: { es: 'campanas', pt: 'sinos', de: 'Glocken', zh: '[钟|zhōng]', ja: '[鐘|かね]' } });
    fill('w.door', { zh: '[门|mén]', ja: '[扉|とびら]' });
    fill('w.clock', { zh: '[大钟|dà zhōng]', ja: '[時計|とけい]' });
    if (typeof ICONS !== 'undefined' && ICONS.add) {
      const k = ICONS.keys;
      if (!k.includes('fog')) ICONS.add('fog', (c, p, h) => { [[-14, 6, 20, 12], [8, 2, 22, 14], [-2, -10, 18, 12], [18, -8, 12, 9]].forEach(([x, y, rx, ry]) => h.shape(c, p, h.ell(x, y, rx, ry), '#c9c6d6')); });
      if (!k.includes('sand')) ICONS.add('sand', (c, p, h) => { h.shape(c, p, h.poly([[-36, 22], [-12, -6], [4, -14], [22, -2], [38, 22]]), '#e8c98a'); if (p) [[-8, 8], [6, 2], [16, 12], [-20, 14]].forEach(([x, y]) => h.dot(c, x, y, 1.8, '#b8945a')); });
      if (!k.includes('crystal')) ICONS.add('crystal', (c, p, h) => { h.shape(c, p, h.poly([[0, -34], [14, -6], [8, 28], [-8, 28], [-14, -6]]), '#9fe8f0'); });
      if (!k.includes('dig')) ICONS.add('dig', (c, p, h) => { h.shape(c, p, h.poly([[-30, 26], [-8, 4], [10, 6], [30, 26]]), '#c9a46a'); h.shape(c, p, h.poly([[6, -30], [12, -28], [0, 6], [-6, 4]]), '#8a5f3e'); });
      if (!k.includes('light')) ICONS.add('light', (c, p, h) => { h.shape(c, p, h.ell(0, 0, 16, 16), '#ffe07a'); if (p) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 22, Math.sin(a) * 22); c.lineTo(Math.cos(a) * 32, Math.sin(a) * 32); c.lineWidth = 3; c.strokeStyle = h.INK; c.stroke(); } });
    }
  }

  // ------------------------------------------------------------ the floors: one verb each, in a whole sentence
  // verb: the LEX id; thing: the LEX id of the thing (if the game has it) and its forms (plurals too); frame: the sentence with
  // the thing left out (___), chip: the thing as it fits in the frame; model: the whole sentence; more: extra forms of the verb
  // to accept (Noa's own: zh / ja plain imperatives, German with -e). zh / ja in the notation.
  const F = (o) => o;
  const FLOORS = [
    F({ id: 'flood', verb: 'v.swim', thing: 'w.rope', icon: 'swim',
      forms: { es: ['cuerda'], pt: ['corda'], de: ['seil'], zh: ['[绳子|shéng zi]', '[绳|shéng]'], ja: ['ロープ', '[縄|なわ]', 'つな'] },
      frame: { es: '¡Nada hasta la ___!', pt: 'Nada até a ___!', de: 'Schwimm zum ___!', zh: '[游|yóu] [到|dào] ___ [那里|nà lǐ] ！', ja: '___ まで [泳|およ]いで ！' },
      chip: { es: 'cuerda', pt: 'corda', de: 'Seil', zh: '[绳子|shéng zi]', ja: 'ロープ', en: 'rope' },
      model: { es: '¡Nada hasta la cuerda!', pt: 'Nada até a corda!', de: 'Schwimm zum Seil!', zh: '[游|yóu] [到|dào] [绳子|shéng zi] [那里|nà lǐ] ！', ja: 'ロープ まで [泳|およ]いで ！', en: 'Swim to the rope!' },
      more: { de: ['schwimme'], zh: ['[游|yóu]'], ja: ['[泳|およ]げ', '[泳|およ]ぐ'] } }),
    F({ id: 'gears', verb: 'v.push', thing: 'w.stone', icon: 'push',
      forms: { es: ['piedra', 'piedras'], pt: ['pedra', 'pedras'], de: ['stein', 'steine'], zh: ['[石头|shí tou]', '[石|shí]'], ja: ['[石|いし]'] },
      frame: { es: '¡Empuja la ___!', pt: 'Empurra a ___!', de: 'Schieb den ___!', zh: '[推|tuī] ___ ！', ja: '___ を [押|お]して ！' },
      chip: { es: 'piedra', pt: 'pedra', de: 'Stein', zh: '[石头|shí tou]', ja: '[石|いし]', en: 'stone' },
      model: { es: '¡Empuja la piedra!', pt: 'Empurra a pedra!', de: 'Schieb den Stein!', zh: '[推|tuī] [石头|shí tou] ！', ja: '[石|いし] を [押|お]して ！', en: 'Push the stone!' },
      more: { de: ['schiebe'], ja: ['[押|お]せ', '[押|お]す'] } }),
    F({ id: 'stairs', verb: 'v.sing', thing: 'w.crystal', icon: 'crystal',
      forms: { es: ['cristales', 'cristal'], pt: ['cristais', 'cristal'], de: ['kristalle', 'kristall', 'kristallen'], zh: ['[水晶|shuǐ jīng]'], ja: ['[水晶|すいしょう]'] },
      frame: { es: '¡Canta a los ___!', pt: 'Canta para os ___!', de: 'Sing für die ___!', zh: '[对|duì] [着|zhe] ___ [唱歌|chàng gē] ！', ja: '___ に [歌|うた]って ！' },
      chip: { es: 'cristales', pt: 'cristais', de: 'Kristalle', zh: '[水晶|shuǐ jīng]', ja: '[水晶|すいしょう]', en: 'crystals' },
      model: { es: '¡Canta a los cristales!', pt: 'Canta para os cristais!', de: 'Sing für die Kristalle!', zh: '[对|duì] [着|zhe] [水晶|shuǐ jīng] [唱歌|chàng gē] ！', ja: '[水晶|すいしょう] に [歌|うた]って ！', en: 'Sing to the crystals!' },
      more: { es: ['cántales'], ja: ['[歌|うた]え', '[歌|うた]う'] } }),
    F({ id: 'tree', verb: 'v.climb', thing: 'w.tree', icon: 'tree',
      forms: { es: ['árbol', 'arbol'], pt: ['árvore', 'arvore'], de: ['baum'], zh: ['[树|shù]'], ja: ['[木|き]'] },
      frame: { es: '¡Trepa al ___!', pt: 'Sobe na ___!', de: 'Kletter auf den ___!', zh: '[爬|pá] ___ ！', ja: '___ に [登|のぼ]って ！' },
      chip: { es: 'árbol', pt: 'árvore', de: 'Baum', zh: '[树|shù]', ja: '[木|き]', en: 'tree' },
      model: { es: '¡Trepa al árbol!', pt: 'Sobe na árvore!', de: 'Kletter auf den Baum!', zh: '[爬|pá] [树|shù] ！', ja: '[木|き] に [登|のぼ]って ！', en: 'Climb the tree!' },
      more: { es: ['sube'], pt: ['suba'], de: ['klettere'], zh: ['[爬上|pá shàng]'], ja: ['[登|のぼ]れ', '[登|のぼ]る'] } }),
    F({ id: 'fog', verb: 'v.blow', thing: 'w.fog', icon: 'blow',
      forms: { es: ['niebla', 'neblina', 'bruma'], pt: ['névoa', 'nevoa', 'neblina'], de: ['nebel'], zh: ['[雾|wù]', '[雾气|wù qì]'], ja: ['[霧|きり]'] },
      frame: { es: '¡Sopla la ___!', pt: 'Sopra a ___!', de: 'Puste den ___ weg!', zh: '[把|bǎ] ___ [吹|chuī] [走|zǒu] ！', ja: '___ を [吹|ふ]いて ！' },
      chip: { es: 'niebla', pt: 'névoa', de: 'Nebel', zh: '[雾|wù]', ja: '[霧|きり]', en: 'fog' },
      model: { es: '¡Sopla la niebla!', pt: 'Sopra a névoa!', de: 'Puste den Nebel weg!', zh: '[把|bǎ] [雾|wù] [吹|chuī] [走|zǒu] ！', ja: '[霧|きり] を [吹|ふ]いて ！', en: 'Blow the fog away!' },
      more: { de: ['puste', 'pust', 'blas', 'blase'], ja: ['[吹|ふ]け', '[吹|ふ]く'] } }),
    F({ id: 'loft', verb: 'v.call', thing: 'w.bird', icon: 'bird',
      forms: { es: ['pájaros', 'pajaros', 'pájaro', 'pajaro', 'pajaritos', 'pájaritos'], pt: ['pássaros', 'passaros', 'pássaro', 'passarinhos'], de: ['vögel', 'vogel', 'voegel'], zh: ['[鸟|niǎo]', '[小鸟|xiǎo niǎo]', '[鸟儿|niǎo ér]'], ja: ['[鳥|とり]', '[小鳥|ことり]', 'とり'] },
      frame: { es: '¡Llama a los ___!', pt: 'Chama os ___!', de: 'Ruf die ___!', zh: '[叫|jiào] ___ [过来|guò lái] ！', ja: '___ を [呼|よ]んで ！' },
      chip: { es: 'pájaros', pt: 'pássaros', de: 'Vögel', zh: '[鸟|niǎo]', ja: '[鳥|とり]', en: 'birds' },
      model: { es: '¡Llama a los pájaros!', pt: 'Chama os pássaros!', de: 'Ruf die Vögel!', zh: '[叫|jiào] [鸟|niǎo] [过来|guò lái] ！', ja: '[鳥|とり] を [呼|よ]んで ！', en: 'Call the birds!' },
      more: { de: ['rufe'], ja: ['[呼|よ]べ', '[呼|よ]ぶ'] } }),
    F({ id: 'sand', verb: 'v.dig', thing: 'w.sand', icon: 'dig',
      forms: { es: ['arena'], pt: ['areia'], de: ['sand'], zh: ['[沙子|shā zi]', '[沙|shā]'], ja: ['[砂|すな]', 'すな'] },
      frame: { es: '¡Cava en la ___!', pt: 'Cava na ___!', de: 'Grab im ___!', zh: '[在|zài] ___ [里|lǐ] [挖|wā] ！', ja: '___ を [掘|ほ]って ！' },
      chip: { es: 'arena', pt: 'areia', de: 'Sand', zh: '[沙子|shā zi]', ja: '[砂|すな]', en: 'sand' },
      model: { es: '¡Cava en la arena!', pt: 'Cava na areia!', de: 'Grab im Sand!', zh: '[在|zài] [沙子|shā zi] [里|lǐ] [挖|wā] ！', ja: '[砂|すな] を [掘|ほ]って ！', en: 'Dig in the sand!' },
      more: { es: ['cave', 'excava'], pt: ['cave', 'escava'], de: ['grabe', 'grab'], zh: ['[挖|wā]'], ja: ['[掘|ほ]れ', '[掘|ほ]る', '[掘|ほ]って'] } }),
    F({ id: 'shadows', verb: 'v.light', thing: 'w.door', icon: 'light',
      forms: { es: ['puerta'], pt: ['porta'], de: ['tür', 'tur', 'tuer'], zh: ['[门|mén]'], ja: ['[扉|とびら]', 'ドア', 'とびら'] },
      frame: { es: '¡Ilumina la ___!', pt: 'Ilumina a ___!', de: 'Leucht die ___ an!', zh: '[照亮|zhào liàng] ___ ！', ja: '___ を [照|て]らして ！' },
      chip: { es: 'puerta', pt: 'porta', de: 'Tür', zh: '[门|mén]', ja: '[扉|とびら]', en: 'door' },
      model: { es: '¡Ilumina la puerta!', pt: 'Ilumina a porta!', de: 'Leucht die Tür an!', zh: '[照亮|zhào liàng] [门|mén] ！', ja: '[扉|とびら] を [照|て]らして ！', en: 'Light up the door!' },
      more: { es: ['ilumine'], pt: ['ilumine'], de: ['leuchte', 'leucht'], zh: ['[照亮|zhào liàng]', '[照|zhào]'], ja: ['[照|て]らせ', '[照|て]らす', '[照|て]らして'] } }),
  ];
  // the fallback words for the three new regions' verbs, if their own files haven't registered them (oldtower.js init)
  const VERB_FALLBACK = {
    'v.dig': { id: 'v.dig', kind: 'verb', es: 'cava', pt: 'cava', de: 'grab', en: 'dig', zh: '[挖|wā]', ja: '[掘|ほ]って', icon: 'dig', alt: { es: ['cave', 'excava'], pt: ['cave', 'escava'], de: ['grabe', 'graben', 'grabt'], zh: ['[挖掘|wā jué]'], ja: ['[掘|ほ]れ', '[掘|ほ]る'] } },
    'v.light': { id: 'v.light', kind: 'verb', es: 'ilumina', pt: 'ilumina', de: 'leucht', en: 'light up', zh: '[照亮|zhào liàng]', ja: '[照|て]らして', icon: 'light', alt: { es: ['ilumine'], pt: ['ilumine'], de: ['leuchte', 'leuchten', 'leuchtet'], zh: ['[照|zhào]'], ja: ['[照|て]らせ', '[照|て]らす'] } },
    'v.call': { id: 'v.call', kind: 'verb', es: 'llama', pt: 'chama', de: 'ruf', en: 'call', zh: '[叫|jiào]', ja: '[呼|よ]んで', icon: 'call', alt: { es: ['llame'], pt: ['chame'], de: ['rufe', 'rufen', 'ruft'], zh: ['[叫来|jiào lái]', '[喊|hǎn]'], ja: ['[呼|よ]べ', '[呼|よ]ぶ'] } },
  };
  // the things the game may not have as words yet (the fog, the sand): shown with their English, never taught
  const THING_FALLBACK = {
    'w.fog': { es: 'niebla', pt: 'névoa', de: 'Nebel', zh: '[雾|wù]', ja: '[霧|きり]', en: 'fog' },
    'w.sand': { es: 'arena', pt: 'areia', de: 'Sand', zh: '[沙子|shā zi]', ja: '[砂|すな]', en: 'sand' },
  };

  // ------------------------------------------------------------ names (speakers, signs)
  const NAMES = {
    hood: { es: 'El Encapuchado', pt: 'O Encapuzado', de: 'Der Kapuzenmann', zh: '[兜帽人|dōu mào rén]', ja: 'フード の [男|おとこ]', en: 'The hooded figure' },
    clock: { es: 'el gran reloj', pt: 'o grande relógio', de: 'die große Uhr', zh: '[大钟|dà zhōng]', ja: '[大時計|おおどけい]', en: 'the great clock' },
    past: { es: 'el Ayer', pt: 'o Ontem', de: 'das Gestern', zh: '[昨天|zuó tiān]', ja: '[昨日|きのう]', en: 'the Past' },
    cont: { es: 'Continuará…', pt: 'Continua…', de: 'Fortsetzung folgt…', zh: '[未完待续|wèi wán dài xù] ……', ja: 'つづく …', en: 'To be continued…' },
    tower: { es: 'La Torre Vieja', pt: 'A Torre Velha', de: 'Der Alte Turm', zh: '[古塔|Gǔ tǎ]', ja: '[古|ふる]い [塔|とう]', en: 'The Old Tower' },
  };
  // the battle's species entry for the hooded figure (battle/lang.js's shape; zh / ja: the notation)
  const SPECIES = {
    es: { w: 'encapuchado', pl: 'encapuchados', g: 'm', en: 'hooded figure' },
    pt: { w: 'encapuzado', pl: 'encapuzados', g: 'm', en: 'hooded figure' },
    de: { w: 'Kapuzenmann', pl: 'Kapuzenmänner', gen: 'Kapuzenmanns', g: 'm', en: 'hooded figure' },
    zh: { w: '[兜帽人|dōu mào rén]', en: 'hooded figure', g: 'm', cl: '个', cls: ['个', '位'] },
    ja: { w: 'フード の [男|おとこ]', en: 'hooded figure', g: 'm', alt: ['フード [男|おとこ]'] },
  };

  // ------------------------------------------------------------ the fight's lines: [text, English] (battle/ui.js shows zh / ja through CJK.html)
  const T6 = (es, pt, de, zh, ja, en) => ({ es, pt, de, zh, ja, en });
  const FIGHT = {
    come: T6('Ven. Dame tus palabras.', 'Vem. Me dá as suas palavras.', 'Komm. Gib mir deine Wörter.', '[来|lái] [吧|ba] 。 [把|bǎ] [你|nǐ] [的|de] [话|huà] [给|gěi] [我|wǒ] 。', '[来|こ]い 。 [言葉|ことば] を よこせ 。', 'Come. Give me your words.'),
    thanks: T6('…Gracias.', '…Obrigado.', '…Danke.', '… [谢谢|xiè xie] 。', '… ありがとう 。', '…Thank you.'),
    steal: T6('¡Nos roba las palabras!', 'Ele rouba as nossas palavras!', 'Er klaut unsere Wörter!', '[他|tā] [偷|tōu] [我们|wǒ men] [的|de] [话|huà] ！', '[言葉|ことば] を とられた ！', 'He’s stealing our words!'),
    again: T6('¡Otra palabra! ¡Dile otra!', 'Outra palavra! Fala outra!', 'Ein anderes Wort! Sag ein anderes!', '[换|huàn] [一个|yī gè] [词|cí] ！', 'ほか の [言葉|ことば] ！', 'Another word! Say another one!'),
    speak: T6('¡No te calles! ¡Habla!', 'Não se cala! Fala!', 'Sei nicht still! Sprich!', '[别|bié] [沉默|chén mò] ！ [说话|shuō huà] ！', '[黙|だま]らないで ！ [話|はな]して ！', 'Don’t go quiet! Speak!'),
    enough: T6('Basta.', 'Chega.', 'Genug.', '[够|gòu] [了|le] 。', 'もう いい 。', 'Enough.'),
    final: T6('¿Quieres hablar? Habla… con el ayer.', 'Quer falar? Fala… com o ontem.', 'Du willst reden? Rede… mit dem Gestern.',
      '[想|xiǎng] [说话|shuō huà] ？ [去|qù] [跟|gēn] [昨天|zuó tiān] [说|shuō] [吧|ba] 。', '[話|はな]したい ？ なら … [昨日|きのう] と [話|はな]せ 。',
      'You want to talk? Then talk… to yesterday.'),
    noa: T6('¡Noa!', 'Noa!', 'Noa!', '[诺娅|Nuò yà] ！', 'ノア ！', 'Noa!'),
    // where his throw comes from, whispered (the dodge words: «por arriba» = ↓ duck, «por abajo» = ↑ jump)
    high: T6('por arriba', 'por cima', 'oben', '[上面|shàng miàn]', '[上|うえ]', 'up high'),
    low: T6('por abajo', 'por baixo', 'unten', '[下面|xià miàn]', '[下|した]', 'down low'),
  };
  // the fall into the past (oldtower_boss.js's cutscene): narration in English with your words woven in
  const CAPS = ['The great {w.clock} ran backward…', 'Hours, days, years fell away like pages.', 'And far below, yesterday was waiting.'];

  // ------------------------------------------------------------ helpers
  const isC = l => l === 'zh' || l === 'ja';
  // T's entry in the language (zh / ja: plain text in the mode, unless raw), else the English
  function pick(T, l, raw) {
    const v = T && (T[l] !== undefined ? T[l] : T.en);
    if (v === undefined || v === null) return '';
    return isC(l) && !raw && typeof CJK !== 'undefined' ? CJK.plain(v, { lang: l }) : v;
  }
  // a line's {w.*} slots filled in with the words (es / pt / de: the form; zh / ja: the notation, then the mode's plain text)
  function fillSlots(text, l) {
    const s = String(text == null ? '' : text).replace(/\{(w\.[a-z_]+)(:pl)?\}/g, (_, id, pl) => {
      if (typeof LEX === 'undefined' || !LEX.item(id)) return id.slice(2);
      const it = LEX.item(id);
      if (l === 'en') return pl ? it.enPl || (it.en || id.slice(2)) + 's' : it.en || id.slice(2);
      return (pl && it.pl && it.pl[l]) || it[l] || it.en || id.slice(2);
    });
    return isC(l) && typeof CJK !== 'undefined' ? CJK.plain(s, { lang: l }) : s;
  }
  // every zh / ja string, checked against CJK.md's rules: [] when all's well
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return ['no CJK'];
    const out = [], v = (s, l, where) => { const p = CJK.validate(s, l); if (p.length) out.push(`${where} (${l}): ${p.join('; ')} «${s}»`); };
    for (const [k, Lx] of Object.entries(LINES_OT)) for (const l of ['zh', 'ja']) (Lx[l] || []).forEach(s => v(s, l, k));
    FLOORS.forEach((f, i) => { for (const l of ['zh', 'ja']) { v(f.model[l], l, 'floor ' + i + ' model'); v(f.chip[l], l, 'floor ' + i + ' chip'); v(f.frame[l].replace('___', l === 'zh' ? '[它|tā]' : 'それ'), l, 'floor ' + i + ' frame'); f.forms[l].forEach(s => v(s, l, 'floor ' + i + ' form')); (f.more[l] || []).forEach(s => v(s, l, 'floor ' + i + ' more')); } });
    for (const [k, T] of Object.entries(NAMES)) for (const l of ['zh', 'ja']) v(T[l], l, 'name ' + k);
    for (const [k, T] of Object.entries(FIGHT)) for (const l of ['zh', 'ja']) v(T[l], l, 'fight ' + k);
    for (const l of ['zh', 'ja']) { v(SPECIES[l].w, l, 'species'); (SPECIES[l].alt || []).forEach(s => v(s, l, 'species alt')); }
    for (const [k, T] of Object.entries(VERB_FALLBACK)) for (const l of ['zh', 'ja']) { v(T[l], l, 'verb ' + k); ((T.alt || {})[l] || []).forEach(s => v(s, l, 'verb alt ' + k)); }
    for (const [k, T] of Object.entries(THING_FALLBACK)) for (const l of ['zh', 'ja']) v(T[l], l, 'thing ' + k);
    return out;
  }
  return { LINES: LINES_OT, FLOORS, VERB_FALLBACK, THING_FALLBACK, NAMES, SPECIES, FIGHT, CAPS, pick, check, isC, words, fillSlots };
})();
