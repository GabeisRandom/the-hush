'use strict';
// Who lives in Alba's houses (DESIGN.md 16, playtest 4: "explore the house and its UNIQUE residents"). One profile per
// house: its theme (interiors_rooms.js), its people (a name, a look, a personality, lines in every language with the
// English, said through the weave) and its pets. Houses another module takes over keep a profile for the languages where
// they're ordinary houses: 09 (the script school in zh / ja), 10 (the Yıldız Grill in de), 12 (the library), 13 (Otoha
// and Susumu in ja), 25 (Vó Dita's door in pt); 15 (Grandma Mei's) is hers in every language. In German games, 22 is
// Kalle's, 23 Oma Hilde's and 25 Fiete's family's (adolf.js, weihnacht.js), so those three swap residents there.
// Alba's side quests come after the houses (interiors_quests.js is their engine).
(() => {
  if (typeof INTERIORS === 'undefined' || !INTERIORS.home) return;
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const H = (id, p) => INTERIORS.home(id, p);
  const P = (id, name, role, at, look, lines, o) => Object.assign({ id, name, role, at, look, lines }, o || {});
  const PET = (id, kind, name, color, at, o) => Object.assign({ id, kind, name, color, at }, o || {});
  const st = q => (typeof HQ !== 'undefined' && HQ ? HQ.stage(q) : 0);
  // names said the zh / ja way (CJK.md's houses table; translated pet names like the cats')
  INTERIORS.names({ Trufa: ['[松露|Sōng lù]', 'トリュフ'] }, { pet: true });

  // 01 the lamplighter
  H('alba-house-01', { theme: 'lamplighter', people: [
    P('jacinto', 'Jacinto', 'grandpa', 'hero', { skin: '#dcae86', hair: '#e0ddd6', hairdo: 'bald', stache: true, dress: '#3a5a7a', legs: true, pants: '#3a3436', hat: 'flat', hatColor: '#3a3040' }, [
      T('Good morning… I mean, good night! I light the street lamps of Alba every night.', '¡Buenos días… digo, buenas noches! Cada noche enciendo los faroles de Alba.', 'Bom dia… quer dizer, boa noite! Toda noite eu acendo os lampiões de Alba.', 'Guten Morgen … ich meine, gute Nacht! Jede Nacht zünde ich die Laternen in Alba an.',
        '[早上好|zǎo shang hǎo] … [不|bù] ， [晚上好|wǎn shang hǎo] ！ [我|wǒ] [每天|měi tiān] [晚上|wǎn shang] [点亮|diǎn liàng] [阿尔巴|Ā ěr bā] [的|de] [路灯|lù dēng] 。', 'おはよう … いや 、 こんばんは ！ [毎晩|まいばん] 、 アルバ の [街灯|がいとう] を つけて います 。'),
      T('The Hush loves the dark. So every {w.lamp} I light is a little fight!', 'Al Silencio le gusta la oscuridad. ¡Cada {w.lamp} que enciendo es una pequeña pelea!', 'O Silêncio adora o escuro. Cada {w.lamp} que eu acendo é uma pequena luta!', 'Die Stille liebt das Dunkel. Jede {w.lamp}, die ich anzünde, ist ein kleiner Kampf!',
        '[寂静|Jì jìng] [喜欢|xǐ huan] [黑暗|hēi àn] 。 [我|wǒ] [点|diǎn] [的|de] [每|měi] [一|yī] [盏|zhǎn] {w.lamp} ， [都|dōu] [是|shì] [一|yī] [场|chǎng] [小|xiǎo] [战斗|zhàn dòu] ！', '[静寂|せいじゃく] は [暗|くら]やみ が [好|す]き です 。 だから 、 {w.lamp} を つける たび に [小|ちい]さな [戦|たたか]い です ！'),
      T('In the day I sleep. So if I yawn… it’s not you, it’s me!', 'De día duermo. Así que si bostezo… ¡no eres tú, soy yo!', 'De dia eu durmo. Então, se eu bocejar… não é você, sou eu!', 'Tagsüber schlafe ich. Wenn ich also gähne … liegt es nicht an dir, sondern an mir!',
        '[白天|bái tiān] [我|wǒ] [睡觉|shuì jiào] 。 [所以|suǒ yǐ] [我|wǒ] [打|dǎ] [哈欠|hā qian] … [不|bù] [是|shì] [因为|yīn wèi] [你|nǐ] ， [是|shì] [因为|yīn wèi] [我|wǒ] [困|kùn] ！', '[昼間|ひるま] は [寝|ね]て います 。 だから あくび を して も … あなた の せい じゃ ありません よ ！'),
    ], { job: 'tinker', prop: 'tool' })] });
  // 02 the beekeeper
  H('alba-house-02', { theme: 'beekeeper', people: [
    P('amparo', 'Amparo', 'grandma', 'hero', { skin: '#f0c7a0', hair: '#f4f1ea', hairdo: 'bun', dress: '#e6b84a', apron: '#fdf8ee', glasses: true, h: 0.88, w: 1.05, hat: 'straw', hatColor: '#e8c57a' }, [
      T('Come in! Mind the bees. They’re asleep… I hope.', '¡Adelante! Cuidado con las abejas. Están dormidas… espero.', 'Entra! Cuidado com as abelhas. Elas estão dormindo… eu espero.', 'Komm rein! Vorsicht, die Bienen. Sie schlafen … hoffe ich.',
        '[请|qǐng] [进|jìn] ！ [小心|xiǎo xīn] [蜜蜂|mì fēng] 。 [它们|tā men] [在|zài] [睡觉|shuì jiào] … [希望|xī wàng] [吧|ba] 。', 'どうぞ ！ ハチ に [気|き] を つけて 。 [寝|ね]て います … たぶん 。'),
      T('Since the Hush, my bees don’t buzz. They make {w.honey} in silence.', 'Desde el Silencio, mis abejas no zumban. Hacen {w.honey} en silencio.', 'Desde o Silêncio, as minhas abelhas não zumbem. Elas fazem {w.honey} em silêncio.', 'Seit der Stille summen meine Bienen nicht mehr. Sie machen ganz still {w.honey}.',
        '[寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [我|wǒ] [的|de] [蜜蜂|mì fēng] [不|bù] [嗡嗡|wēng wēng] [叫|jiào] [了|le] 。 [它们|tā men] [静静|jìng jìng] [地|de] [做|zuò] {w.honey} 。', '[静寂|せいじゃく] が [来|き]て から 、 ハチ が ブンブン いいません 。 [静|しず]か に {w.honey} を [作|つく]って います 。'),
      T('A spoon of {w.honey} in your tea, and you’ll sing all day!', 'Una cucharada de {w.honey} en tu té, ¡y cantas todo el día!', 'Uma colher de {w.honey} no seu chá, e você canta o dia todo!', 'Ein Löffel {w.honey} in deinen Tee, und du singst den ganzen Tag!',
        '[茶|chá] [里|lǐ] [放|fàng] [一|yī] [勺|sháo] {w.honey} ， [你|nǐ] [就|jiù] [会|huì] [唱|chàng] [一|yī] [整|zhěng] [天|tiān] ！', 'お[茶|ちゃ] に {w.honey} を ひとさじ 。 [一日中|いちにちじゅう] [歌|うた]えます よ ！'),
    ])] });
  // 03 the painter (her quest: the colors)
  H('alba-house-03', { theme: 'painter', people: [
    P('silvia', 'Silvia', 'woman', 'hero', { skin: '#f0c7a0', hair: '#7a3f2a', hairdo: 'bun', dress: '#3f6fb5', apron: '#fdf8ee', hat: 'beret', hatColor: '#d9483b' }, [
      T('Hi! Don’t mind the paint. It’s on everything… even on me.', '¡Hola! No te fijes en la pintura. Está en todo… hasta en mí.', 'Oi! Não liga pra tinta. Está em tudo… até em mim.', 'Hallo! Achte nicht auf die Farbe. Sie ist überall … sogar auf mir.',
        '[你好|nǐ hǎo] ！ [别|bié] [在意|zài yì] [颜料|yán liào] 。 [到处|dào chù] [都|dōu] [是|shì] … [连|lián] [我|wǒ] [身上|shēn shang] [也|yě] [是|shì] 。', 'こんにちは ！ [絵|え]の[具|ぐ] は [気|き] に しない で 。 どこ に でも … わたし に も ついて います 。'),
      T('I paint what the Hush takes away: colors, light, the lake at sunset.', 'Pinto lo que el Silencio se lleva: los colores, la luz, el lago al atardecer.', 'Eu pinto o que o Silêncio leva embora: as cores, a luz, o lago no pôr do sol.', 'Ich male, was die Stille wegnimmt: Farben, Licht, den See im Abendrot.',
        '[我|wǒ] [画|huà] [寂静|Jì jìng] [拿走|ná zǒu] [的|de] [东西|dōng xi] ： [颜色|yán sè] 、 [光|guāng] 、 [日落|rì luò] [时|shí] [的|de] [湖|hú] 。', '[静寂|せいじゃく] が [奪|うば]う もの を [描|か]きます 。 [色|いろ] 、 [光|ひかり] 、 [夕日|ゆうひ] の [湖|みずうみ] 。'),
      T('My favorite color? All of them! Today, maybe blue.', '¿Mi color favorito? ¡Todos! Hoy, quizás el azul.', 'Minha cor favorita? Todas! Hoje, talvez o azul.', 'Meine Lieblingsfarbe? Alle! Heute vielleicht Blau.',
        '[我|wǒ] [最|zuì] [喜欢|xǐ huan] [的|de] [颜色|yán sè] ？ [全部|quán bù] ！ [今天|jīn tiān] [也许|yě xǔ] [是|shì] [蓝色|lán sè] 。', '[好|す]き な [色|いろ] ？ ぜんぶ ！ [今日|きょう] は 、 [青|あお] かな 。'),
    ], { job: 'paint', prop: 'brush' })] });
  // 04 the young dad, the baby, and Coco upstairs (their quest: good night)
  H('alba-house-04', { theme: 'babyFamily', people: [
    P('martin', 'Martín', 'man', 'hero', { skin: '#c98e62', hair: '#2e2420', dress: '#4f8a4a', legs: true, pants: '#3a4466', beard: true, h: 1.04, w: 1.06 }, [
      T('Shh… the baby is sleeping. Finally!', '¡Shh! El bebé está dormido. ¡Por fin!', 'Shh… o bebê está dormindo. Finalmente!', 'Pst … das Baby schläft. Endlich!',
        '[嘘|xū] … [宝宝|bǎo bao] [睡着|shuì zháo] [了|le] 。 [终于|zhōng yú] ！', 'しー … [赤|あか]ちゃん が [寝|ね]ました 。 やっと ！'),
      T('I haven’t slept in weeks. But look at her little nose!', 'Hace semanas que no duermo. ¡Pero mira su naricita!', 'Faz semanas que eu não durmo. Mas olha esse narizinho!', 'Ich habe seit Wochen nicht geschlafen. Aber schau dir das Näschen an!',
        '[我|wǒ] [好|hǎo] [几|jǐ] [个|gè] [星期|xīng qī] [没|méi] [睡好|shuì hǎo] [了|le] 。 [可是|kě shì] [你|nǐ] [看|kàn] [她|tā] [的|de] [小|xiǎo] [鼻子|bí zi] ！', '[何週間|なんしゅうかん] も [寝|ね]て いません 。 でも 、 この [小|ちい]さな [鼻|はな] を [見|み]て ！'),
      T('Coco is upstairs. He says he’s too big to sleep. He’s four.', 'Coco está arriba. Dice que es muy grande para dormir. Tiene cuatro años.', 'O Coco está lá em cima. Ele diz que é grande demais pra dormir. Ele tem quatro anos.', 'Coco ist oben. Er sagt, er ist zu groß zum Schlafen. Er ist vier.',
        '[可可|Kě kě] [在|zài] [楼上|lóu shàng] 。 [他|tā] [说|shuō] [自己|zì jǐ] [太|tài] [大|dà] [了|le] ， [不|bù] [用|yòng] [睡觉|shuì jiào] 。 [他|tā] [才|cái] [四|sì] [岁|suì] 。', 'ココ は [二階|にかい] です 。 もう [大|おお]きい から [寝|ね]ない って 。 まだ [四歳|よんさい] なのに 。'),
    ], { job: 'cradle', prop: 'baby' })],
    up: { people: [
      P('coco', 'Coco', 'kid', s => (st('hq.night') >= 2 ? 'sleep' : 'floor'), { skin: '#c98e62', hair: '#2e2420', hairdo: 'curly', dress: '#3d7fd1', legs: true, h: 0.62 }, [
        T('I’m not sleepy! I’m a big dinosaur! Rawr!', '¡No tengo sueño! ¡Soy un dinosaurio grande! ¡Grrr!', 'Eu não tô com sono! Eu sou um dinossauro grande! Rawr!', 'Ich bin nicht müde! Ich bin ein großer Dinosaurier! Rrroar!',
          '[我|wǒ] [不|bù] [困|kùn] ！ [我|wǒ] [是|shì] [大|dà] [恐龙|kǒng lóng] ！ [嗷|áo] ！', 'ねむく ない ！ ぼく 、 [大|おお]きい [恐竜|きょうりゅう] だ ！ ガオー ！'),
        T('Do you like my drawing? It’s a dinosaur. A big one.', '¿Te gusta mi dibujo? Es un dinosaurio. Uno grande.', 'Gostou do meu desenho? É um dinossauro. Um grandão.', 'Gefällt dir mein Bild? Das ist ein Dinosaurier. Ein großer.',
          '[你|nǐ] [喜欢|xǐ huan] [我|wǒ] [的|de] [画|huà] [吗|ma] ？ [是|shì] [恐龙|kǒng lóng] 。 [大|dà] [恐龙|kǒng lóng] 。', 'ぼく の [絵|え] 、 [好|す]き ？ [恐竜|きょうりゅう] だ よ 。 [大|おお]きい の 。'),
      ], { job: s => (st('hq.night') >= 2 ? 'sleep' : 'stand') })] } });
  // 05 the stamp collector (a retired postman)
  H('alba-house-05', { theme: 'stamps', people: [
    P('honorio', 'Honorio', 'grandpa', 'desk', { skin: '#efc29a', hair: '#d8d8d8', hairdo: 'bald', glasses: true, stache: true, dress: '#3f5f8a', legs: true, pants: '#4a3a33', hat: 'cap', hatColor: '#2f4a7a' }, [
      T('For forty years I carried the {w.letter:pl} of Alba. Now I collect the stamps.', 'Durante cuarenta años llevé las {w.letter:pl} de Alba. Ahora colecciono las estampillas.', 'Por quarenta anos eu levei as {w.letter:pl} de Alba. Agora eu coleciono os selos.', 'Vierzig Jahre lang habe ich die {w.letter:pl} von Alba getragen. Jetzt sammle ich die Briefmarken.',
        '[四十|sì shí] [年|nián] [来|lái] ， [我|wǒ] [给|gěi] [阿尔巴|Ā ěr bā] [送|sòng] {w.letter} 。 [现在|xiàn zài] [我|wǒ] [收集|shōu jí] [邮票|yóu piào] 。', '[四十年|よんじゅうねん] 、 アルバ の {w.letter} を [配|くば]りました 。 [今|いま] は [切手|きって] を [集|あつ]めて います 。'),
      T('This stamp has a {w.bird} on it. And this one, the old {w.tower}. Every stamp is a trip!', 'Esta estampilla tiene un {w.bird}. Y esta, la vieja {w.tower}. ¡Cada estampilla es un viaje!', 'Este selo tem um {w.bird}. E este, a {w.tower} velha. Cada selo é uma viagem!', 'Auf dieser Marke ist ein {w.bird}. Und auf der hier der alte {w.tower}. Jede Briefmarke ist eine Reise!',
        '[这|zhè] [张|zhāng] [邮票|yóu piào] [上|shàng] [有|yǒu] [一|yī] [只|zhī] {w.bird} 。 [这|zhè] [张|zhāng] [是|shì] [古|gǔ] {w.tower} 。 [每|měi] [张|zhāng] [邮票|yóu piào] [都|dōu] [是|shì] [一|yī] [次|cì] [旅行|lǚ xíng] ！', 'この [切手|きって] に は {w.bird} 。 これ は [古|ふる]い {w.tower} 。 [切手|きって] は ぜんぶ [旅|たび] です よ ！'),
      T('Nobody writes {w.letter:pl} now. Since the Hush, people keep their words inside.', 'Ya nadie escribe {w.letter:pl}. Desde el Silencio, la gente se guarda las palabras.', 'Ninguém escreve mais {w.letter:pl}. Desde o Silêncio, o pessoal guarda as palavras pra si.', 'Niemand schreibt mehr {w.letter:pl}. Seit der Stille behalten die Leute ihre Worte für sich.',
        '[现在|xiàn zài] [没有|méi yǒu] [人|rén] [写|xiě] {w.letter} [了|le] 。 [寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [大家|dà jiā] [都|dōu] [把|bǎ] [话|huà] [藏|cáng] [在|zài] [心里|xīn lǐ] 。', 'もう だれ も {w.letter} を [書|か]きません 。 [静寂|せいじゃく] の [後|あと] 、 みんな [言葉|ことば] を [胸|むね] に しまって います 。'),
    ])] });
  // 06 the cyclist
  H('alba-house-06', { theme: 'cyclist', people: [
    P('julia', 'Julia', 'woman', 'hero', { skin: '#a8714a', hair: '#2e2420', hairdo: 'pony', dress: '#2f8f86', legs: true, pants: '#3a4466', hat: 'cap', hatColor: '#e0743c' }, [
      T('Hi! I ride my bike to Molinar and back. Every morning!', '¡Hola! Voy en bici a Molinar y vuelvo. ¡Todas las mañanas!', 'Oi! Eu vou de bicicleta até Molinar e volto. Toda manhã!', 'Hallo! Ich fahre mit dem Rad nach Molinar und zurück. Jeden Morgen!',
        '[你好|nǐ hǎo] ！ [我|wǒ] [每天|měi tiān] [早上|zǎo shang] [骑|qí] [车|chē] [去|qù] [磨坊镇|Mò fáng zhèn] [再|zài] [回来|huí lái] ！', 'こんにちは ！ [毎朝|まいあさ] 、 [自転車|じてんしゃ] で モリナール まで [行|い]って [帰|かえ]って きます ！'),
      T('See the cups? I won them all. Well… most of them.', '¿Ves las copas? Las gané todas. Bueno… casi todas.', 'Tá vendo os troféus? Eu ganhei todos. Bom… quase todos.', 'Siehst du die Pokale? Die habe ich alle gewonnen. Na ja … fast alle.',
        '[看到|kàn dào] [那些|nà xiē] [奖杯|jiǎng bēi] [了|le] [吗|ma] ？ [都|dōu] [是|shì] [我|wǒ] [赢|yíng] [的|de] 。 [好吧|hǎo ba] … [差不多|chà bu duō] [都|dōu] [是|shì] 。', 'トロフィー が [見|み]えます か ？ ぜんぶ [勝|か]ちました 。 まあ … ほとんど 。'),
      T('The hill road is the best. Wind in your face, the {w.flower:pl} going by…', 'El camino de las colinas es el mejor. El viento en la cara, las {w.flower:pl} pasando…', 'A estrada dos morros é a melhor. O vento no rosto, as {w.flower:pl} passando…', 'Der Weg über die Hügel ist der beste. Wind im Gesicht, die {w.flower:pl} fliegen vorbei …',
        '[山坡|shān pō] [上|shàng] [的|de] [路|lù] [最|zuì] [好|hǎo] 。 [风|fēng] [吹|chuī] [在|zài] [脸|liǎn] [上|shàng] ， {w.flower} [一|yī] [朵|duǒ] [朵|duǒ] [飞|fēi] [过|guò] …', '[丘|おか] の [道|みち] が いちばん です 。 [顔|かお] に [風|かぜ] 、 [通|とお]りすぎて いく {w.flower} …'),
    ], { job: 'tinker', prop: 'tool' })] });
  // 07 the young musician; Mango, his cat, up on the wardrobe (their quest: call her down)
  H('alba-house-07', { theme: 'musician', people: [
    P('gael', 'Gael', 'man', 'sofa', { skin: '#a8714a', hair: '#2e2420', dress: '#3a3040', legs: true, pants: '#3a4466', hat: 'beanie', hatColor: '#e0743c' }, [
      T('Hey! Want to hear a song? I wrote it last night.', '¡Hey! ¿Quieres oír una canción? La escribí anoche.', 'E aí! Quer ouvir uma música? Eu escrevi ontem à noite.', 'Hey! Willst du ein Lied hören? Ich hab es gestern Nacht geschrieben.',
        '[嘿|hēi] ！ [想|xiǎng] [听|tīng] [一|yī] [首|shǒu] [歌|gē] [吗|ma] ？ [是|shì] [我|wǒ] [昨天|zuó tiān] [晚上|wǎn shang] [写|xiě] [的|de] 。', 'やあ ！ [歌|うた] 、 [聴|き]きたい ？ [昨日|きのう] の [夜|よる] [書|か]いた ん だ 。'),
      T('The Hush hates music. That’s why I play loud!', 'El Silencio odia la música. ¡Por eso toco fuerte!', 'O Silêncio odeia música. É por isso que eu toco alto!', 'Die Stille hasst Musik. Darum spiele ich laut!',
        '[寂静|Jì jìng] [讨厌|tǎo yàn] [音乐|yīn yuè] 。 [所以|suǒ yǐ] [我|wǒ] [弹|tán] [得|de] [很|hěn] [大声|dà shēng] ！', '[静寂|せいじゃく] は [音楽|おんがく] が [大嫌|だいきら]い 。 だから [大|おお]きい [音|おと] で [弾|ひ]く ん だ ！'),
      T('Mango is the real boss here. I just pay the rent.', 'Mango es la verdadera jefa aquí. Yo solo pago el alquiler.', 'A Mango é a verdadeira chefe aqui. Eu só pago o aluguel.', 'Mango ist hier die echte Chefin. Ich zahle nur die Miete.',
        '[芒果|Máng guǒ] [才|cái] [是|shì] [这里|zhè lǐ] [真正|zhēn zhèng] [的|de] [老板|lǎo bǎn] 。 [我|wǒ] [只|zhǐ] [是|shì] [付|fù] [房租|fáng zū] [的|de] 。', '[本当|ほんとう] の ボス は マンゴー だ よ 。 オレ は [家賃|やちん] を [払|はら]う だけ 。'),
    ], { job: 'strum', prop: 'guitar' })],
    up: { pets: [PET('mango', 'cat', 'Mango', '#e8a050', s => (st('hq.cat') >= 2 ? 'cat' : 'wardrobeTop'), { pose: 'sit' })] } });
  // 08 the candle maker
  H('alba-house-08', { theme: 'candles', people: [
    P('felisa', 'Felisa', 'grandma', 'hero', { skin: '#e6b48c', hair: '#e0ddd6', hairdo: 'bun', dress: '#8a4f7d', apron: '#fdf8ee', h: 0.88, w: 1.05, eyes: 'happy' }, [
      T('Come in! Candles in every corner. The Hush doesn’t like light.', '¡Pasa! Hay velas en cada rincón. Al Silencio no le gusta la luz.', 'Entra! Tem vela em cada canto. O Silêncio não gosta de luz.', 'Komm rein! In jeder Ecke eine Kerze. Die Stille mag kein Licht.',
        '[进来|jìn lái] [吧|ba] ！ [每|měi] [个|gè] [角落|jiǎo luò] [都|dōu] [有|yǒu] [蜡烛|là zhú] 。 [寂静|Jì jìng] [不|bù] [喜欢|xǐ huan] [光|guāng] 。', 'どうぞ ！ どの [角|すみ] に も ろうそく 。 [静寂|せいじゃく] は [光|ひかり] が [嫌|きら]い です 。'),
      T('This one smells of oranges. This one, of rain. Smell!', 'Esta huele a naranja. Esta, a lluvia. ¡Huele!', 'Esta tem cheiro de laranja. Esta, de chuva. Cheira!', 'Die hier riecht nach Orangen. Die da nach Regen. Riech mal!',
        '[这|zhè] [支|zhī] [有|yǒu] [橙子|chéng zi] [的|de] [香味|xiāng wèi] 。 [这|zhè] [支|zhī] [有|yǒu] [雨|yǔ] [的|de] [味道|wèi dao] 。 [闻|wén] [闻|wén] ！', 'これ は オレンジ の [香|かお]り 。 これ は [雨|あめ] の [香|かお]り 。 かいで みて ！'),
      T('I light one for every person I miss. I need a lot of candles.', 'Enciendo una por cada persona que extraño. Necesito muchas velas.', 'Eu acendo uma pra cada pessoa de quem eu sinto saudade. Preciso de muitas velas.', 'Ich zünde eine für jeden an, den ich vermisse. Ich brauche viele Kerzen.',
        '[我|wǒ] [想念|xiǎng niàn] [一|yī] [个|gè] [人|rén] ， [就|jiù] [点|diǎn] [一|yī] [支|zhī] 。 [我|wǒ] [需要|xū yào] [很|hěn] [多|duō] [蜡烛|là zhú] 。', '[会|あ]いたい [人|ひと] の ため に 、 [一本|いっぽん] ずつ つけます 。 たくさん [要|い]ります 。'),
    ], { job: 'tinker', prop: 'tool' })] });
  // 09 the poet (es / pt / de: in zh / ja the door is the script school's)
  H('alba-house-09', { theme: 'poet', people: [
    P('noemi', 'Noemí', 'woman', 'desk', { skin: '#f5cda2', hair: '#3a2b26', hairdo: 'long', dress: '#7a5ab0', scarf: '#f2c14e', glasses: true }, [
      T('Shh! A poem is coming… No. It went away.', '¡Shh! Viene un poema… No. Se fue.', 'Shh! Lá vem um poema… Não. Foi embora.', 'Pst! Gleich kommt ein Gedicht … Nein. Es ist weg.',
        '[嘘|xū] ！ [一|yī] [首|shǒu] [诗|shī] [来|lái] [了|le] … [没有|méi yǒu] 。 [它|tā] [走|zǒu] [了|le] 。', 'しー ！ [詩|し] が [来|く]る … だめ 。 [行|い]って しまった 。'),
      T('I write about the Hush. Words about silence. Funny, isn’t it?', 'Escribo sobre el Silencio. Palabras sobre el silencio. Gracioso, ¿no?', 'Eu escrevo sobre o Silêncio. Palavras sobre o silêncio. Engraçado, né?', 'Ich schreibe über die Stille. Worte über das Schweigen. Komisch, oder?',
        '[我|wǒ] [写|xiě] [寂静|Jì jìng] 。 [用|yòng] [话语|huà yǔ] [写|xiě] [沉默|chén mò] 。 [有|yǒu] [意思|yì si] [吧|ba] ？', '[静寂|せいじゃく] の こと を [書|か]いて います 。 [沈黙|ちんもく] に ついて の [言葉|ことば] 。 おもしろい でしょう ？'),
      T('Every crumpled page is a poem that said no.', 'Cada hoja arrugada es un poema que dijo que no.', 'Cada folha amassada é um poema que disse não.', 'Jedes zerknüllte Blatt ist ein Gedicht, das Nein gesagt hat.',
        '[每|měi] [一|yī] [张|zhāng] [揉皱|róu zhòu] [的|de] [纸|zhǐ] ， [都|dōu] [是|shì] [一|yī] [首|shǒu] [说|shuō] “ [不|bù] ” [的|de] [诗|shī] 。', 'くしゃくしゃ の [紙|かみ] は ぜんぶ 、 「 いや 」 と [言|い]った [詩|し] です 。'),
    ])] });
  // 10 the home baker (not in German games: there it's the Yıldız Grill)
  H('alba-house-10', { theme: 'cakes', people: [
    P('rodrigo', 'Rodrigo', 'man', 'hero', { skin: '#f0c7a0', hair: '#c98a4a', dress: '#e86a7a', apron: '#fdf8ee', legs: true, pants: '#3a4466', h: 1.04, w: 1.12 }, [
      T('Hello! Are you hungry? There’s always {w.cake} here.', '¡Hola! ¿Tienes hambre? Aquí siempre hay {w.cake}.', 'Oi! Tá com fome? Aqui sempre tem {w.cake}.', 'Hallo! Hast du Hunger? Hier gibt es immer {w.cake}.',
        '[你好|nǐ hǎo] ！ [饿|è] [了|le] [吗|ma] ？ [我|wǒ] [这里|zhè lǐ] [总是|zǒng shì] [有|yǒu] {w.cake} 。', 'こんにちは ！ おなか 、 すいて ます か ？ ここ に は いつも {w.cake} が あります よ 。'),
      T('I’m learning to bake. Marta says my {w.cake} is “interesting”.', 'Estoy aprendiendo a hornear. Marta dice que mi {w.cake} es “interesante”.', 'Eu tô aprendendo a fazer bolo. A Marta diz que o meu {w.cake} é “interessante”.', 'Ich lerne backen. Marta sagt, mein {w.cake} ist „interessant“.',
        '[我|wǒ] [在|zài] [学|xué] [烤|kǎo] [蛋糕|dàn gāo] 。 [玛尔塔|Mǎ ěr tǎ] [说|shuō] [我|wǒ] [的|de] {w.cake} “ [很|hěn] [特别|tè bié] ” 。', 'お[菓子|かし][作|づく]り を [勉強中|べんきょうちゅう] です 。 マルタ さん は 、 わたし の {w.cake} は 「 [個性的|こせいてき] 」 だ って 。'),
      T('Today: {w.cake} with chocolate and {w.orange}. Brave, right?', 'Hoy: {w.cake} de chocolate con {w.orange}. Valiente, ¿no?', 'Hoje: {w.cake} de chocolate com {w.orange}. Corajoso, né?', 'Heute: {w.cake} mit Schokolade und {w.orange}. Mutig, oder?',
        '[今天|jīn tiān] [做|zuò] [巧克力|qiǎo kè lì] {w.orange} {w.cake} 。 [很|hěn] [大胆|dà dǎn] [吧|ba] ？', '[今日|きょう] は チョコ と {w.orange} の {w.cake} 。 [大胆|だいたん] でしょう ？'),
    ], { job: 'stir', prop: 'spoon' })] });
  // 11 the stargazer
  H('alba-house-11', { theme: 'stargazer', people: [
    P('leandro', 'Leandro', 'grandpa', 'hero', { skin: '#8a5a3c', hair: '#f4f1ea', hairdo: 'bald', beard: true, glasses: true, dress: '#1f2a5a', legs: true, pants: '#3a3436', h: 0.95 }, [
      T('Good evening! Oh, it’s day. But for me it’s always night.', '¡Buenas noches! Ah, es de día. Pero para mí siempre es de noche.', 'Boa noite! Ah, é de dia. Mas pra mim é sempre noite.', 'Guten Abend! Ach, es ist Tag. Aber für mich ist immer Nacht.',
        '[晚上好|wǎn shang hǎo] ！ [哦|ò] ， [现在|xiàn zài] [是|shì] [白天|bái tiān] 。 [可是|kě shì] [对|duì] [我|wǒ] [来说|lái shuō] ， [永远|yǒng yuǎn] [是|shì] [晚上|wǎn shang] 。', 'こんばんは ！ あ 、 [今|いま] は [昼|ひる] です ね 。 でも わたし に は 、 いつも [夜|よる] です 。'),
      T('Since the Hush, the {w.star:pl} are quieter. But they still shine.', 'Desde el Silencio, las {w.star:pl} están más calladas. Pero todavía brillan.', 'Desde o Silêncio, as {w.star:pl} estão mais quietas. Mas ainda brilham.', 'Seit der Stille sind die {w.star:pl} leiser. Aber sie leuchten noch.',
        '[寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， {w.star} [安静|ān jìng] [多|duō] [了|le] 。 [可是|kě shì] [还|hái] [在|zài] [发光|fā guāng] 。', '[静寂|せいじゃく] の [後|あと] 、 {w.star} も [静|しず]か に なりました 。 でも 、 まだ [光|ひか]って います 。'),
      T('I named a {w.star} after my wife. The brightest one, of course.', 'Le puse a una {w.star} el nombre de mi esposa. La más brillante, claro.', 'Eu dei o nome da minha esposa a uma {w.star}. A mais brilhante, claro.', 'Ich habe einen {w.star} nach meiner Frau benannt. Den hellsten natürlich.',
        '[我|wǒ] [用|yòng] [我|wǒ] [太太|tài tai] [的|de] [名字|míng zi] [给|gěi] [一|yī] [颗|kē] {w.star} [命名|mìng míng] 。 [当然|dāng rán] [是|shì] [最|zuì] [亮|liàng] [的|de] [那|nà] [颗|kē] 。', '[妻|つま] の [名前|なまえ] を {w.star} に つけました 。 もちろん 、 いちばん [明|あか]るい [星|ほし] です 。'),
    ], { job: 'think' })] });
  // 12 Teo's grandma, in the blue house (when it isn't the library)
  H('alba-house-12', { theme: 'knitter', people: [
    P('mercedes', 'Mercedes', 'grandma', 'rock', { skin: '#efc29a', hair: '#e0ddd6', hairdo: 'bun', dress: '#5a7ab8', apron: '#fdf8ee', glasses: true, h: 0.88, w: 1.05 }, [
      INTERIORS._.SAY.teoGran,
      T('I’m knitting a scarf for Teo. Blue, his favorite color.', 'Le estoy tejiendo una bufanda a Teo. Azul, su color favorito.', 'Eu tô tricotando um cachecol pro Teo. Azul, a cor favorita dele.', 'Ich stricke Teo einen Schal. Blau, seine Lieblingsfarbe.',
        '[我|wǒ] [在|zài] [给|gěi] [特奥|Tè ào] [织|zhī] [围巾|wéi jīn] 。 [蓝色|lán sè] [的|de] ， [他|tā] [最|zuì] [喜欢|xǐ huan] [的|de] [颜色|yán sè] 。', 'テオ に マフラー を [編|あ]んで います 。 [青|あお] 。 あの [子|こ] の [好|す]き な [色|いろ] です 。'),
      T('Sit, sit! Have a {w.cookie}. They’re from this morning.', '¡Siéntate, siéntate! Come una {w.cookie}. Son de esta mañana.', 'Senta, senta! Come um {w.cookie}. São de hoje de manhã.', 'Setz dich, setz dich! Nimm einen {w.cookie}. Die sind von heute früh.',
        '[坐|zuò] ， [坐|zuò] ！ [吃|chī] [块|kuài] {w.cookie} [吧|ba] 。 [是|shì] [今天|jīn tiān] [早上|zǎo shang] [做|zuò] [的|de] 。', 'どうぞ 、 [座|すわ]って ！ {w.cookie} を どうぞ 。 [今朝|けさ] [焼|や]いた ん です よ 。'),
    ], { job: 'knit', prop: 'knit', propColor: '#3f6fb5' })], pets: [PET('copito', 'cat', 'Copito', '#f4efe4', 'catbed', { pose: 'sleep' })] });
  // 13 the puppeteer (not in Japanese games: there it's Otoha and Susumu's)
  H('alba-house-13', { theme: 'puppets', people: [
    P('victor', 'Víctor', 'man', 'hero', { skin: '#efc29a', hair: '#3a2b26', dress: '#7a5ab0', legs: true, pants: '#2f3440', stache: true, hat: 'beret', hatColor: '#2b2235' }, [
      T('This is the smallest theater in Alba! Seats: four. Tickets: free.', '¡Este es el teatro más pequeño de Alba! Asientos: cuatro. Entradas: gratis.', 'Este é o menor teatro de Alba! Lugares: quatro. Ingressos: de graça.', 'Das ist das kleinste Theater in Alba! Plätze: vier. Eintritt: frei.',
        '[这|zhè] [是|shì] [阿尔巴|Ā ěr bā] [最|zuì] [小|xiǎo] [的|de] [剧院|jù yuàn] ！ [座位|zuò wèi] ： [四|sì] [个|gè] 。 [门票|mén piào] ： [免费|miǎn fèi] 。', 'アルバ で いちばん [小|ちい]さい [劇場|げきじょう] です ！ [席|せき] は [四|よっ]つ 。 [入場|にゅうじょう] は [無料|むりょう] ！'),
      T('My puppets talk when people don’t. Kids tell them everything!', 'Mis títeres hablan cuando la gente no habla. ¡Los niños les cuentan todo!', 'Os meus fantoches falam quando as pessoas não falam. As crianças contam tudo pra eles!', 'Meine Puppen reden, wenn die Leute schweigen. Kinder erzählen ihnen alles!',
        '[人们|rén men] [不|bù] [说话|shuō huà] [的|de] [时候|shí hou] ， [我|wǒ] [的|de] [木偶|mù ǒu] [说话|shuō huà] 。 [孩子们|hái zi men] [什么|shén me] [都|dōu] [告诉|gào su] [它们|tā men] ！', 'みんな が [話|はな]さない とき 、 わたし の [人形|にんぎょう] が [話|はな]します 。 [子|こ]ども たち は 、 なんでも [話|はな]して くれます よ ！'),
      T('This one is the Hush. Boo! … Too scary? I’ll put it away.', 'Este es el Silencio. ¡Bu! … ¿Muy feo? Lo guardo.', 'Este aqui é o Silêncio. Bu! … Muito assustador? Eu guardo.', 'Das hier ist die Stille. Buh! … Zu gruselig? Ich pack sie weg.',
        '[这个|zhè ge] [是|shì] [寂静|Jì jìng] 。 [呜|wū] ！ … [太|tài] [吓人|xià rén] [了|le] ？ [我|wǒ] [收起来|shōu qǐ lái] 。', 'これ は [静寂|せいじゃく] 。 ばあ ！ … こわすぎ ます か ？ しまいましょう 。'),
    ], { job: 'think' })] });
  // 14 the retired teacher and Nube (their quest: the lost key)
  H('alba-house-14', { theme: 'teacher', people: [
    P('anselmo', 'Anselmo', 'grandpa', 'arm', { skin: '#efc29a', hair: '#e0ddd6', hairdo: 'bald', beard: true, glasses: true, dress: '#5a6a8a', legs: true, pants: '#4a3a33', h: 0.95, scarf: '#c9553f' }, [
      T('Good afternoon! Forty years I taught in that school. Now the books teach me.', '¡Buenas tardes! Cuarenta años enseñé en esa escuela. Ahora los libros me enseñan a mí.', 'Boa tarde! Por quarenta anos eu ensinei naquela escola. Agora são os livros que me ensinam.', 'Guten Tag! Vierzig Jahre habe ich in der Schule da unterrichtet. Jetzt unterrichten mich die Bücher.',
        '[下午好|xià wǔ hǎo] ！ [我|wǒ] [在|zài] [那|nà] [所|suǒ] [学校|xué xiào] [教|jiāo] [了|le] [四十|sì shí] [年|nián] [书|shū] 。 [现在|xiàn zài] [是|shì] [书|shū] [教|jiāo] [我|wǒ] 。', 'こんにちは ！ あの [学校|がっこう] で [四十年|よんじゅうねん] [教|おし]えました 。 [今|いま] は [本|ほん] が わたし に [教|おし]えて くれます 。'),
      T('A mistake is just a word on its way. Never be afraid of mistakes.', 'Un error es solo una palabra que va en camino. Nunca tengas miedo de equivocarte.', 'Um erro é só uma palavra a caminho. Nunca tenha medo de errar.', 'Ein Fehler ist nur ein Wort auf dem Weg. Hab nie Angst vor Fehlern.',
        '[错误|cuò wù] [只是|zhǐ shì] [还|hái] [在|zài] [路上|lù shang] [的|de] [词|cí] 。 [永远|yǒng yuǎn] [不要|bù yào] [怕|pà] [犯错|fàn cuò] 。', '[間違|まちが]い は 、 [途中|とちゅう] の [言葉|ことば] です 。 [間違|まちが]い を こわがらない で 。'),
      T('Nube sleeps on everything I need. Books, letters, my chair…', 'Nube duerme encima de todo lo que necesito. Libros, cartas, mi silla…', 'A Nube dorme em cima de tudo o que eu preciso. Livros, cartas, a minha cadeira…', 'Nube schläft auf allem, was ich brauche. Bücher, Briefe, mein Stuhl …',
        '[云朵|Yún duǒ] [总是|zǒng shì] [睡|shuì] [在|zài] [我|wǒ] [要|yào] [用|yòng] [的|de] [东西|dōng xi] [上|shàng] 。 [书|shū] 、 [信|xìn] 、 [我|wǒ] [的|de] [椅子|yǐ zi] …', 'ソラ は わたし の [使|つか]う もの の [上|うえ] で [寝|ね]ます 。 [本|ほん] 、 [手紙|てがみ] 、 [椅子|いす] …'),
    ], { job: 'read', prop: 'book' })],
    pets: [PET('nube', 'cat', 'Nube', '#f4efe4', 'cat', { pose: 'sleep' })] });
  // 16 the cook and her grandson (their quest: stone soup)
  H('alba-house-16', { theme: 'cook', people: [
    P('consuelo', 'Consuelo', 'grandma', 'hero', { skin: '#e6b48c', hair: '#e0ddd6', hairdo: 'bun', dress: '#b8607a', apron: '#fdf8ee', h: 0.88, w: 1.12 }, [
      T('Come in! You’re just in time. Something is always cooking here.', '¡Pasa! Llegas justo a tiempo. Aquí siempre hay algo en la olla.', 'Entra! Chegou na hora certa. Aqui sempre tem alguma coisa na panela.', 'Komm rein! Genau richtig. Hier kocht immer etwas.',
        '[进来|jìn lái] ！ [你|nǐ] [来|lái] [得|de] [正|zhèng] [好|hǎo] 。 [我|wǒ] [这里|zhè lǐ] [锅|guō] [里|lǐ] [总是|zǒng shì] [有|yǒu] [东西|dōng xi] 。', 'どうぞ ！ ちょうど いい ところ 。 ここ は いつも [何|なに]か [煮|に]て います 。'),
      T('My grandmother cooked here. And her grandmother too. The pot is older than me!', 'Mi abuela cocinaba aquí. Y su abuela también. ¡La olla es más vieja que yo!', 'A minha avó cozinhava aqui. E a avó dela também. A panela é mais velha que eu!', 'Meine Oma hat hier gekocht. Und ihre Oma auch. Der Topf ist älter als ich!',
        '[我|wǒ] [奶奶|nǎi nai] [在|zài] [这里|zhè lǐ] [做饭|zuò fàn] 。 [她|tā] [的|de] [奶奶|nǎi nai] [也|yě] [是|shì] 。 [这|zhè] [口|kǒu] [锅|guō] [比|bǐ] [我|wǒ] [还|hái] [老|lǎo] ！', '[祖母|そぼ] も ここ で [料理|りょうり] を しました 。 [祖母|そぼ] の [祖母|そぼ] も 。 この [鍋|なべ] は わたし より [古|ふる]い ん です よ ！'),
      T('Stone soup! A {w.stone}, {w.water}, and friends to share it.', '¡Sopa de piedra! Una {w.stone}, {w.water} y amigos para compartir.', 'Sopa de pedra! Uma {w.stone}, {w.water} e amigos pra dividir.', 'Steinsuppe! Ein {w.stone}, {w.water} und Freunde zum Teilen.',
        '[石头|shí tou] [汤|tāng] ！ [一|yī] [块|kuài] {w.stone} 、 {w.water} ， [还有|hái yǒu] [一起|yī qǐ] [分享|fēn xiǎng] [的|de] [朋友|péng you] 。', '[石|いし] の スープ ！ {w.stone} と {w.water} と 、 いっしょ に [食|た]べる [友達|ともだち] 。'),
    ], { job: 'stir', prop: 'spoon' }),
    P('juanito', 'Juanito', 'kid', 'sit', { skin: '#e6b48c', hair: '#3a2b26', dress: '#d9483b', legs: true, pants: '#3a4466', hat: 'cap', hatColor: '#d9483b', h: 0.72 }, [
      T('Grandma’s soup is the best in the world. Don’t tell my mom.', 'La sopa de mi abuela es la mejor del mundo. No le digas a mi mamá.', 'A sopa da minha avó é a melhor do mundo. Não conta pra minha mãe.', 'Omas Suppe ist die beste der Welt. Sag’s nicht meiner Mama.',
        '[奶奶|nǎi nai] [的|de] [汤|tāng] [是|shì] [世界|shì jiè] [上|shàng] [最|zuì] [好|hǎo] [的|de] 。 [别|bié] [告诉|gào su] [我|wǒ] [妈妈|mā ma] 。', 'おばあちゃん の スープ は [世界|せかい] で いちばん 。 ママ に は [内緒|ないしょ] だ よ 。'),
      T('I peel the potatoes. It’s an important job!', 'Yo pelo las papas. ¡Es un trabajo importante!', 'Eu descasco as batatas. É um trabalho importante!', 'Ich schäle die Kartoffeln. Das ist ein wichtiger Job!',
        '[我|wǒ] [负责|fù zé] [削|xiāo] [土豆|tǔ dòu] 。 [这|zhè] [是|shì] [很|hěn] [重要|zhòng yào] [的|de] [工作|gōng zuò] ！', 'ぼく は じゃがいも の [皮|かわ] むき 。 [大事|だいじ] な [仕事|しごと] なん だ ！'),
    ])] });
  // 17 the little artist and her mom (their quest: a birthday drawing for the neighbor)
  H('alba-house-17', { theme: 'artistKid', people: [
    P('camila', 'Camila', 'kid', 'floor', { skin: '#f0c7a0', hair: '#8a4a2a', hairdo: 'pigtails', dress: '#e86a9a', h: 0.72, eyes: 'happy' }, [
      T('I draw everything! The {w.cat}, the {w.tree:pl}, you…', '¡Dibujo todo! El {w.cat}, los {w.tree:pl}, a ti…', 'Eu desenho tudo! O {w.cat}, as {w.tree:pl}, você…', 'Ich male alles! Die {w.cat}, die {w.tree:pl}, dich …',
        '[我|wǒ] [什么|shén me] [都|dōu] [画|huà] ！ {w.cat} 、 {w.tree} 、 [还有|hái yǒu] [你|nǐ] …', 'なんでも [描|か]く の ！ {w.cat} も 、 {w.tree} も 、 あなた も …'),
      T('Mom says I’m an artist. Grandpa says I’m a mess. Both!', 'Mamá dice que soy artista. El abuelo dice que soy un desastre. ¡Las dos cosas!', 'A mamãe diz que eu sou artista. O vovô diz que eu sou uma bagunça. As duas coisas!', 'Mama sagt, ich bin eine Künstlerin. Opa sagt, ich bin ein Chaos. Beides!',
        '[妈妈|mā ma] [说|shuō] [我|wǒ] [是|shì] [画家|huà jiā] 。 [爷爷|yé ye] [说|shuō] [我|wǒ] [是|shì] [小|xiǎo] [邋遢|lā ta] 。 [两个|liǎng gè] [都|dōu] [对|duì] ！', 'ママ は わたし を [画家|がか] だ って 。 おじいちゃん は [散|ち]らかし[屋|や] だ って 。 [両方|りょうほう] ！'),
    ], { job: 'desk' }),
    P('luisa', 'Luisa', 'woman', 'cook', { skin: '#f0c7a0', hair: '#8a4a2a', hairdo: 'long', dress: '#4f9a5a', apron: '#fdf8ee' }, [
      T('Hello! Watch your step: crayons on the floor. Always.', '¡Hola! Cuidado dónde pisas: hay crayones en el piso. Siempre.', 'Oi! Cuidado onde pisa: tem giz de cera no chão. Sempre.', 'Hallo! Pass auf, wo du hintrittst: Wachsmalstifte auf dem Boden. Immer.',
        '[你好|nǐ hǎo] ！ [小心|xiǎo xīn] [脚下|jiǎo xià] ： [地|dì] [上|shàng] [有|yǒu] [蜡笔|là bǐ] 。 [一直|yī zhí] [都|dōu] [有|yǒu] 。', 'こんにちは ！ [足元|あしもと] に [気|き] を つけて 。 [床|ゆか] に クレヨン が … いつも ある の 。'),
      T('Camila is so shy with people. But with a crayon, she talks all day!', 'Camila es muy tímida con la gente. ¡Pero con un crayón habla todo el día!', 'A Camila é muito tímida com as pessoas. Mas com um giz de cera, ela fala o dia todo!', 'Camila ist so schüchtern mit Leuten. Aber mit einem Stift redet sie den ganzen Tag!',
        '[卡米拉|Kǎ mǐ lā] [跟|gēn] [人|rén] [在|zài] [一起|yī qǐ] [很|hěn] [害羞|hài xiū] 。 [可是|kě shì] [拿|ná] [着|zhe] [蜡笔|là bǐ] ， [她|tā] [能|néng] [说|shuō] [一|yī] [整|zhěng] [天|tiān] ！', 'カミラ は [人|ひと] の [前|まえ] で は [恥|は]ずかしがり 。 でも クレヨン を [持|も]つ と 、 [一日中|いちにちじゅう] おしゃべり です ！'),
    ])] });
  // 18 the canaries' grandma (the birthday is hers)
  INTERIORS.names({ Kiki: ['[琪琪|Qí qi]', 'キキ'], 'Lulú': ['[露露|Lù lu]', 'ルル'] }, { pet: true });
  H('alba-house-18', { theme: 'birds', people: [
    P('remedios', 'Remedios', 'grandma', 'sit', { skin: '#dcae86', hair: '#f4f1ea', hairdo: 'bun', dress: '#4f8a7a', apron: '#fdf8ee', h: 0.86, w: 1.05, eyes: 'happy' }, [
      T('Shh, listen… My canaries. They still sing, a little. Every morning.', 'Shh, escucha… Mis canarios. Todavía cantan, un poquito. Cada mañana.', 'Shh, escuta… Os meus canários. Eles ainda cantam, um pouquinho. Toda manhã.', 'Pst, hör mal … Meine Kanarienvögel. Sie singen noch, ein bisschen. Jeden Morgen.',
        '[嘘|xū] ， [你|nǐ] [听|tīng] … [我|wǒ] [的|de] [金丝雀|jīn sī què] 。 [它们|tā men] [每天|měi tiān] [早上|zǎo shang] [还|hái] [唱|chàng] [一点|yī diǎn] 。', 'しー 、 [聞|き]いて … わたし の カナリア 。 [毎朝|まいあさ] 、 まだ [少|すこ]し [歌|うた]います 。'),
      T('This one is Kiki, and this one is Lulú. Kiki is the noisy one.', 'Esta es Kiki, y esta es Lulú. Kiki es la ruidosa.', 'Esta é a Kiki, e esta é a Lulú. A Kiki é a barulhenta.', 'Das ist Kiki, und das ist Lulú. Kiki ist die Laute.',
        '[这|zhè] [只|zhī] [叫|jiào] [琪琪|Qí qi] ， [这|zhè] [只|zhī] [叫|jiào] [露露|Lù lu] 。 [琪琪|Qí qi] [最|zuì] [吵|chǎo] 。', 'この [子|こ] は キキ 、 この [子|こ] は ルル 。 キキ は にぎやか な [子|こ] です 。'),
      T('My birthday is soon, you know. At my age, I count {w.bird:pl}, not years.', 'Pronto es mi cumpleaños, ¿sabes? A mi edad, cuento {w.bird:pl}, no años.', 'O meu aniversário é logo, sabia? Na minha idade, eu conto {w.bird:pl}, não anos.', 'Bald ist mein Geburtstag, weißt du? In meinem Alter zähle ich {w.bird:pl}, keine Jahre.',
        '[我|wǒ] [快|kuài] [过|guò] [生日|shēng rì] [了|le] 。 [我|wǒ] [这个|zhè ge] [年纪|nián jì] ， [数|shǔ] [的|de] [是|shì] {w.bird} ， [不|bù] [是|shì] [岁数|suì shu] 。', 'もう すぐ [誕生日|たんじょうび] な ん です よ 。 この [年|とし] に なる と 、 [年|とし] じゃ なくて {w.bird} を [数|かぞ]えます 。'),
    ], { job: 'sit' })],
    pets: [PET('kiki', 'canary', 'Kiki', '#f2c14e', 'canary'), PET('lulu', 'canary', 'Lulú', '#f6e36a', 'canary')] });
  // 19 the angler
  H('alba-house-19', { theme: 'angler', people: [
    P('isidro', 'Isidro', 'grandpa', 'stand', { skin: '#c98e62', hair: '#bdb8b0', hairdo: 'bald', beard: true, dress: '#4f6a4a', legs: true, pants: '#3a4a3a', hat: 'cap', hatColor: '#4f8a4a', h: 0.97 }, [
      T('Ah, you came to hear about the big fish? It was THIS big!', '¿Vienes a oír lo del pez grande? ¡Era ASÍ de grande!', 'Veio ouvir a história do peixe grande? Ele era DESTE tamanho!', 'Du willst die Geschichte vom großen Fisch hören? Er war SO groß!',
        '[你|nǐ] [是|shì] [来|lái] [听|tīng] [大|dà] [鱼|yú] [的|de] [故事|gù shi] [的|de] [吗|ma] ？ [它|tā] [有|yǒu] [这么|zhè me] [大|dà] ！', '[大物|おおもの] の [話|はなし] を [聞|き]き に [来|き]た の かい ？ こんなに [大|おお]きかった ん だ ！'),
      T('Every year the fish gets bigger. Funny, that.', 'Cada año el pez es más grande. Qué curioso.', 'Todo ano o peixe fica maior. Engraçado, né?', 'Jedes Jahr wird der Fisch größer. Komisch, was?',
        '[每|měi] [年|nián] [那|nà] [条|tiáo] [鱼|yú] [都|dōu] [变|biàn] [得|de] [更|gèng] [大|dà] 。 [真|zhēn] [奇怪|qí guài] 。', '[毎年|まいとし] 、 その [魚|さかな] は [大|おお]きく なる 。 [不思議|ふしぎ] だ ね 。'),
      T('Since the Hush, the river is too quiet. The fish don’t even splash.', 'Desde el Silencio, el río está demasiado callado. Los peces ni salpican.', 'Desde o Silêncio, o rio está quieto demais. Os peixes nem espirram água.', 'Seit der Stille ist der Fluss zu ruhig. Die Fische plätschern nicht mal.',
        '[寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [河|hé] [太|tài] [安静|ān jìng] [了|le] 。 [鱼|yú] [连|lián] [水花|shuǐ huā] [都|dōu] [不|bù] [溅|jiàn] 。', '[静寂|せいじゃく] の [後|あと] 、 [川|かわ] が [静|しず]か すぎる 。 [魚|さかな] も はねない 。'),
    ], { prop: 'rod' })] });
  // 20 the seamstress (her quest: a coat for Trufa)
  H('alba-house-20', { theme: 'seamstress', people: [
    P('olga', 'Olga', 'woman', 'hero', { skin: '#efc29a', hair: '#2e2420', hairdo: 'bun', dress: '#c9553f', apron: '#f2e6d0', glasses: true }, [
      T('Hello! Careful, there are pins everywhere. Like little hedgehogs.', '¡Hola! Cuidado, hay alfileres por todas partes. Como erizos pequeños.', 'Oi! Cuidado, tem alfinete pra todo lado. Que nem ouricinhos.', 'Hallo! Vorsicht, überall sind Nadeln. Wie kleine Igel.',
        '[你好|nǐ hǎo] ！ [小心|xiǎo xīn] ， [到处|dào chù] [都|dōu] [是|shì] [大头针|dà tóu zhēn] 。 [像|xiàng] [小|xiǎo] [刺猬|cì wei] [一样|yī yàng] 。', 'こんにちは ！ [気|き] を つけて 、 どこ に でも [針|はり] が ある の 。 [小|ちい]さい ハリネズミ みたい に 。'),
      T('I made half the dresses in Alba. The other half, my mother made.', 'Hice la mitad de los vestidos de Alba. La otra mitad, mi mamá.', 'Eu fiz metade dos vestidos de Alba. A outra metade, a minha mãe fez.', 'Die Hälfte der Kleider in Alba habe ich genäht. Die andere Hälfte meine Mutter.',
        '[阿尔巴|Ā ěr bā] [一半|yī bàn] [的|de] [裙子|qún zi] [是|shì] [我|wǒ] [做|zuò] [的|de] 。 [另|lìng] [一半|yī bàn] [是|shì] [我|wǒ] [妈妈|mā ma] [做|zuò] [的|de] 。', 'アルバ の ドレス の [半分|はんぶん] は わたし が [縫|ぬ]いました 。 あと の [半分|はんぶん] は [母|はは] が 。'),
      T('A button, a thread, a little patience… and anything can be fixed.', 'Un botón, un hilo, un poco de paciencia… y todo se arregla.', 'Um botão, uma linha, um pouco de paciência… e tudo tem conserto.', 'Ein Knopf, ein Faden, ein bisschen Geduld … und alles lässt sich reparieren.',
        '[一|yī] [颗|kē] [扣子|kòu zi] 、 [一|yī] [根|gēn] [线|xiàn] 、 [一点|yī diǎn] [耐心|nài xīn] … [什么|shén me] [都|dōu] [能|néng] [修好|xiū hǎo] 。', 'ボタン [一|ひと]つ 、 [糸|いと] [一本|いっぽん] 、 [少|すこ]し の [根気|こんき] … それ で なんでも [直|なお]せます 。'),
    ], { job: 'sew' })] });
  // 21 the tinkerer
  H('alba-house-21', { theme: 'tinkerer', people: [
    P('ricardo', 'Ricardo', 'man', 'hero', { skin: '#dcae86', hair: '#4a2f27', hairdo: 'curly', dress: '#5a86b8', apron: '#8a5f3e', legs: true, pants: '#3a3436', glasses: true, loupe: true }, [
      T('Hi! If it’s broken, bring it here. If it works, I’ll open it anyway.', '¡Hola! Si está roto, tráelo. Si funciona, lo abro igual.', 'Oi! Se estiver quebrado, traz aqui. Se funcionar, eu abro mesmo assim.', 'Hallo! Wenn es kaputt ist, bring es her. Wenn es geht, mache ich es trotzdem auf.',
        '[你好|nǐ hǎo] ！ [东西|dōng xi] [坏|huài] [了|le] [就|jiù] [拿|ná] [来|lái] 。 [没|méi] [坏|huài] ， [我|wǒ] [也|yě] [要|yào] [打开|dǎ kāi] [看看|kàn kan] 。', 'こんにちは ！ [壊|こわ]れた もの は ここ へ 。 [壊|こわ]れて なくて も 、 [開|あ]けて みます けど ね 。'),
      T('I’m building a radio that hears the Hush. So far it only hears my neighbor.', 'Estoy haciendo una radio que oye al Silencio. Por ahora solo oye a mi vecino.', 'Eu tô montando um rádio que escuta o Silêncio. Por enquanto, ele só escuta o meu vizinho.', 'Ich baue ein Radio, das die Stille hört. Bis jetzt hört es nur meinen Nachbarn.',
        '[我|wǒ] [在|zài] [做|zuò] [一|yī] [台|tái] [能|néng] [听见|tīng jiàn] [寂静|Jì jìng] [的|de] [收音机|shōu yīn jī] 。 [现在|xiàn zài] [只|zhǐ] [听得见|tīng de jiàn] [我|wǒ] [邻居|lín jū] 。', '[静寂|せいじゃく] が [聞|き]こえる ラジオ を [作|つく]って います 。 [今|いま] の ところ 、 [聞|き]こえる の は [隣|となり] の [人|ひと] だけ です 。'),
      T('A {w.clock} that runs backwards? I made one! … By accident.', '¿Un {w.clock} que va hacia atrás? ¡Hice uno! … Sin querer.', 'Um {w.clock} que anda pra trás? Eu fiz um! … Sem querer.', 'Eine {w.clock}, die rückwärts geht? Ich habe eine gebaut! … Aus Versehen.',
        '[倒着|dào zhe] [走|zǒu] [的|de] {w.clock} ？ [我|wǒ] [做|zuò] [过|guo] [一|yī] [个|gè] ！ … [不|bù] [小心|xiǎo xīn] [做|zuò] [的|de] 。', '[逆|ぎゃく] に [回|まわ]る {w.clock} ？ [作|つく]りました よ ！ … うっかり 。'),
    ], { job: 'tinker', prop: 'tool' })] });
  // 22 the puzzle man (Kalle, in German games: adolf.js's careful young man with the crossword)
  const PUZ = [
    T('Shh, I’m thinking. Six across: “a word for quiet”…', 'Shh, estoy pensando. Seis horizontal: “otra palabra para callado”…', 'Shh, tô pensando. Seis na horizontal: “outra palavra pra quieto”…', 'Pst, ich denke nach. Sechs waagerecht: „ein Wort für still“ …',
      '[嘘|xū] ， [我|wǒ] [在|zài] [想|xiǎng] 。 [横|héng] [六|liù] ： “ [安静|ān jìng] [的|de] [另|lìng] [一个|yī gè] [说法|shuō fǎ] ” …', 'しー 、 [考|かんが]え[中|ちゅう] です 。 [横|よこ] の [六|ろく] ： 「 [静|しず]か の [別|べつ] の [言|い]い[方|かた] 」 …'),
    T('A thousand pieces, and the sky is all blue. Why do I do this to myself?', 'Mil piezas, y el cielo es todo azul. ¿Por qué me hago esto?', 'Mil peças, e o céu é todo azul. Por que eu faço isso comigo?', 'Tausend Teile, und der Himmel ist ganz blau. Warum tue ich mir das an?',
      '[一千|yī qiān] [块|kuài] ， [天空|tiān kōng] [全|quán] [是|shì] [蓝色|lán sè] [的|de] 。 [我|wǒ] [为什么|wèi shén me] [要|yào] [折磨|zhé mó] [自己|zì jǐ] ？', 'ピース は [千|せん] 。 [空|そら] は ぜんぶ [青|あお] 。 どうして こんな こと を …'),
    T('A puzzle is like a language: one piece at a time, and suddenly you see the picture.', 'Un rompecabezas es como un idioma: pieza por pieza, y de pronto ves la imagen.', 'Um quebra-cabeça é como uma língua: peça por peça, e de repente você vê a imagem.', 'Ein Puzzle ist wie eine Sprache: Teil für Teil, und plötzlich siehst du das Bild.',
      '[拼图|pīn tú] [就|jiù] [像|xiàng] [一|yī] [门|mén] [语言|yǔ yán] ： [一|yī] [块|kuài] [一|yī] [块|kuài] [地|de] [拼|pīn] ， [突然|tū rán] [你|nǐ] [就|jiù] [看到|kàn dào] [整|zhěng] [幅|fú] [画|huà] [了|le] 。', 'パズル は [言葉|ことば] と [同|おな]じ です 。 [一|ひと]つ ずつ … そして [急|きゅう] に [絵|え] が [見|み]える 。'),
  ];
  const puzLook = { skin: '#f5cda2', hair: '#c98a4a', dress: '#7a5ab0', legs: true, pants: '#3a4466', glasses: true, scarf: '#f2c14e' };
  H('alba-house-22', { theme: 'puzzles', people: [P('samuel', 'Samuel', 'man', 'arm', puzLook, PUZ, { job: 'read', prop: 'paper' })],
    de: { people: [P('kalle', 'Kalle', 'man', 'arm', puzLook, PUZ, { job: 'read', prop: 'paper' })] } });
  // 23 the board-game granny (Oma Hilde, in German games: Fiete's grandma, ruthless at board games)
  const GAMES = [
    T('Do you play? Sit down! I warn you: I never lose.', '¿Juegas? ¡Siéntate! Te aviso: yo nunca pierdo.', 'Você joga? Senta aí! Já aviso: eu nunca perco.', 'Spielst du? Setz dich! Ich warne dich: Ich verliere nie.',
      '[你|nǐ] [会|huì] [玩|wán] [吗|ma] ？ [坐下|zuò xià] ！ [先|xiān] [告诉|gào su] [你|nǐ] ： [我|wǒ] [从来|cóng lái] [不|bù] [输|shū] 。', '[遊|あそ]ぶ ？ [座|すわ]って ！ [言|い]って おく けど 、 わたし は [負|ま]けた こと が ない の 。'),
    T('I knit while I wait for my turn. A scarf a game!', 'Tejo mientras espero mi turno. ¡Una bufanda por partida!', 'Eu tricoto enquanto espero a minha vez. Um cachecol por partida!', 'Ich stricke, während ich warte. Ein Schal pro Spiel!',
      '[等|děng] [轮到|lún dào] [我|wǒ] [的|de] [时候|shí hou] ， [我|wǒ] [就|jiù] [织|zhī] [东西|dōng xi] 。 [一|yī] [局|jú] [一|yī] [条|tiáo] [围巾|wéi jīn] ！', '[自分|じぶん] の [番|ばん] を [待|ま]つ [間|あいだ] 、 [編|あ]み[物|もの] を します 。 [一試合|ひとしあい] で マフラー [一本|いっぽん] ！'),
    T('My grandchildren say I cheat. I don’t cheat. I’m just very, very lucky.', 'Mis nietos dicen que hago trampa. No hago trampa. Solo tengo mucha, mucha suerte.', 'Os meus netos dizem que eu roubo. Eu não roubo. Eu só tenho muita, muita sorte.', 'Meine Enkel sagen, ich schummle. Ich schummle nicht. Ich habe nur sehr, sehr viel Glück.',
      '[我|wǒ] [的|de] [孙子们|sūn zi men] [说|shuō] [我|wǒ] [作弊|zuò bì] 。 [我|wǒ] [没有|méi yǒu] 。 [我|wǒ] [只是|zhǐ shì] [运气|yùn qi] [特别|tè bié] [好|hǎo] 。', '[孫|まご]たち は 、 わたし が ずる を する って 。 しません よ 。 ただ 、 とても とても [運|うん] が いい だけ 。'),
  ];
  const gameLook = { skin: '#f1c7a5', hair: '#e0ddd6', hairdo: 'bun', dress: '#4f9a5a', apron: '#fdf8ee', glasses: true, h: 0.86, w: 1.05, eyes: 'happy' };
  H('alba-house-23', { theme: 'boardgames', people: [P('rosario', 'Rosario', 'grandma', 'rock', gameLook, GAMES, { job: 'knit', prop: 'knit', propColor: '#f2c14e' })],
    de: { people: [P('hilde', 'Hilde', 'grandma', 'rock', gameLook, [GAMES[0],
      T('I’m knitting a hat. For Fiete, my grandson. He’s always cold.', 'Estoy tejiendo un gorro para Fiete, mi nieto.', 'Estou tricotando um gorro pro Fiete, o meu neto.', 'Ich stricke gerade eine Mütze. Für Fiete, meinen Enkel. Ihm ist immer kalt.'), GAMES[2]], { job: 'knit', prop: 'knit', propColor: '#f2c14e' })] } });
  // 24 the dog lover and Trufa (she gets the coat Olga made)
  H('alba-house-24', { theme: 'dogs', people: [
    P('josefa', 'Josefa', 'grandma', 'sofa', { skin: '#e6b48c', hair: '#d8d8d8', hairdo: 'curly', dress: '#b8607a', glasses: true, h: 0.88, w: 1.05 }, [
      T('This is Trufa. Say hello, Trufa! … She’s shy with new people.', 'Esta es Trufa. ¡Saluda, Trufa! … Es tímida con la gente nueva.', 'Esta é a Trufa. Dá oi, Trufa! … Ela é tímida com gente nova.', 'Das ist Trufa. Sag Hallo, Trufa! … Sie ist schüchtern bei Fremden.',
        '[这|zhè] [是|shì] [松露|Sōng lù] 。 [松露|Sōng lù] ， [打|dǎ] [个|gè] [招呼|zhāo hu] ！ … [它|tā] [怕|pà] [生|shēng] 。', 'この [子|こ] は トリュフ 。 トリュフ 、 ごあいさつ ！ … [人見知|ひとみし]り な ん です 。'),
      T('Every morning we walk to the pond and back. Trufa says hello to every duck.', 'Cada mañana caminamos al estanque y volvemos. Trufa saluda a todos los patos.', 'Toda manhã a gente caminha até o lago e volta. A Trufa dá oi pra todos os patos.', 'Jeden Morgen gehen wir zum Teich und zurück. Trufa begrüßt jede Ente.',
        '[每天|měi tiān] [早上|zǎo shang] [我们|wǒ men] [走|zǒu] [到|dào] [池塘|chí táng] [再|zài] [回来|huí lái] 。 [松露|Sōng lù] [跟|gēn] [每|měi] [只|zhī] [鸭子|yā zi] [打|dǎ] [招呼|zhāo hu] 。', '[毎朝|まいあさ] 、 [池|いけ] まで [散歩|さんぽ] します 。 トリュフ は アヒル みんな に あいさつ します 。'),
      T('Winter is coming. My poor Trufa gets so cold…', 'Ya viene el invierno. Mi pobre Trufa tiene tanto frío…', 'O inverno tá chegando. A minha pobre Trufa sente tanto frio…', 'Der Winter kommt. Meine arme Trufa friert so sehr …',
        '[冬天|dōng tiān] [快|kuài] [到|dào] [了|le] 。 [我|wǒ] [可怜|kě lián] [的|de] [松露|Sōng lù] [好|hǎo] [冷|lěng] …', 'もう すぐ [冬|ふゆ] 。 かわいそう な トリュフ は とても [寒|さむ]がり で …'),
    ], { job: 'sit' })],
    pets: [PET('trufa', 'dog', 'Trufa', '#e0b070', 'pet', { pose: 'lie', opt: s => (st('hq.coat') >= 2 ? { coat: '#d9483b', collar: '#3f6fb5', s: 0.8 } : { collar: '#3f6fb5', s: 0.8 }) })] });
  // 25 the busy family (pt: Vó Dita's door; de: Fiete's family's)
  const busyLook = { skin: '#c98e62', hair: '#3a2b26', hairdo: 'pony', dress: '#e0743c', apron: '#fdf8ee' };
  H('alba-house-25', { theme: 'busyFamily', people: [
    P('alicia', 'Alicia', 'woman', 'stand', busyLook, [
      T('Sorry about the mess! Two kids, one dog… no, wait, no dog. It just feels like it.', '¡Perdón por el desorden! Dos niños, un perro… no, espera, no hay perro. Solo lo parece.', 'Desculpa a bagunça! Duas crianças, um cachorro… não, peraí, não tem cachorro. Só parece.', 'Entschuldige das Chaos! Zwei Kinder, ein Hund … nein, warte, kein Hund. Es fühlt sich nur so an.',
        '[不好意思|bù hǎo yì si] ， [家里|jiā lǐ] [很|hěn] [乱|luàn] ！ [两|liǎng] [个|gè] [孩子|hái zi] ， [一|yī] [条|tiáo] [狗|gǒu] … [不|bù] [对|duì] ， [没有|méi yǒu] [狗|gǒu] 。 [只是|zhǐ shì] [感觉|gǎn jué] [像|xiàng] [有|yǒu] 。', '[散|ち]らかって いて ごめんなさい ！ [子|こ]ども が [二人|ふたり] 、 [犬|いぬ] が [一匹|いっぴき] … あ 、 [犬|いぬ] は いません 。 そんな [気|き] が する だけ 。'),
      T('Iker, homework! … He says he’s “resting his eyes”.', '¡Iker, la tarea! … Dice que está “descansando los ojos”.', 'Iker, a lição de casa! … Ele diz que está “descansando os olhos”.', 'Iker, Hausaufgaben! … Er sagt, er „ruht seine Augen aus“.',
        '[伊克尔|Yī kè ěr] ， [写|xiě] [作业|zuò yè] ！ … [他|tā] [说|shuō] [他|tā] [在|zài] “ [让|ràng] [眼睛|yǎn jing] [休息|xiū xi] ” 。', 'イケル 、 [宿題|しゅくだい] ！ … 「 [目|め] を [休|やす]めて る 」 んだ って 。'),
    ]),
    P('iker', 'Iker', 'kid', 'sit', { skin: '#c98e62', hair: '#3a2b26', dress: '#3d7fd1', legs: true, pants: '#3a4466', h: 0.74 }, [
      T('I’m not sleeping. I’m thinking with my eyes closed.', 'No estoy dormido. Estoy pensando con los ojos cerrados.', 'Eu não tô dormindo. Tô pensando de olho fechado.', 'Ich schlafe nicht. Ich denke mit geschlossenen Augen.',
        '[我|wǒ] [没|méi] [睡|shuì] 。 [我|wǒ] [在|zài] [闭|bì] [着|zhe] [眼睛|yǎn jing] [想|xiǎng] [事情|shì qing] 。', '[寝|ね]て ない よ 。 [目|め] を つぶって [考|かんが]えて る の 。'),
      T('Let’s play! Whoever stays quiet loses! Say something! Quick!', '¿Jugamos? ¡El que se queda callado pierde! ¡Di algo! ¡Rápido!', 'Bora brincar? Quem ficar quieto perde! Fala alguma coisa! Rápido!', 'Spielen wir? Wer still ist, verliert! Sag was! Schnell!',
        '[我们|wǒ men] [玩|wán] [吧|ba] ！ [谁|shéi] [不|bù] [说话|shuō huà] [谁|shéi] [就|jiù] [输|shū] ！ [快|kuài] [说|shuō] [点|diǎn] [什么|shén me] ！', '[遊|あそ]ぼう ！ だまった ほう が [負|ま]け ！ なにか [言|い]って ！ はやく ！'),
    ], { job: 'desk' })],
    de: { people: [P('anke', 'Anke', 'woman', 'stand', busyLook, [
      T('Hello! I’m Anke, Fiete’s mom. He’s out planning his Christmas market again.', '', '', 'Hallo! Ich bin Anke, Fietes Mama. Er plant schon wieder seinen Weihnachtsmarkt.'),
      T('Fiete’s boots are always by the door. And never on his feet.', '', '', 'Fietes Stiefel stehen immer an der Tür. Und nie an seinen Füßen.'),
      T('My mother, Oma Hilde, lives two doors down. She beats everyone at board games.', '', '', 'Meine Mutter, Oma Hilde, wohnt zwei Türen weiter. Sie schlägt alle bei Brettspielen.'),
    ])] } });
  // 26 the potter
  H('alba-house-26', { theme: 'potter', people: [
    P('elsa', 'Elsa', 'woman', 'hero', { skin: '#f0c7a0', hair: '#e0b060', hairdo: 'curly', dress: '#8a6a4a', apron: '#c9a07a', hat: 'bandana', hatColor: '#4f8a7a' }, [
      T('Hi! I won’t shake your hand, it’s all clay. Let’s wave instead!', '¡Hola! No te doy la mano, está llena de barro. ¡Mejor saludamos así!', 'Oi! Não vou te dar a mão, tá cheia de barro. Melhor acenar!', 'Hallo! Ich gebe dir lieber nicht die Hand, alles voller Ton. Lieber winken!',
        '[你好|nǐ hǎo] ！ [不|bù] [跟|gēn] [你|nǐ] [握手|wò shǒu] [了|le] ， [手|shǒu] [上|shàng] [都|dōu] [是|shì] [泥|ní] 。 [挥挥手|huī hui shǒu] [吧|ba] ！', 'こんにちは ！ [手|て] は [粘土|ねんど] だらけ だ から 、 [握手|あくしゅ] は やめて おきます 。 [手|て] を ふりましょう ！'),
      T('Every {w.cup} in Alba is a little bit mine. I made the {w.plate:pl} at the inn too!', 'Cada {w.cup} de Alba es un poquito mía. ¡También hice los {w.plate:pl} de la posada!', 'Cada {w.cup} de Alba é um pouquinho minha. Eu também fiz os {w.plate:pl} da pousada!', 'Jede {w.cup} in Alba ist ein bisschen meine. Die {w.plate:pl} im Gasthaus habe ich auch gemacht!',
        '[阿尔巴|Ā ěr bā] [的|de] [每|měi] [个|gè] {w.cup} [都|dōu] [有|yǒu] [一点|yī diǎn] [是|shì] [我|wǒ] [的|de] 。 [旅馆|lǚ guǎn] [的|de] {w.plate} [也|yě] [是|shì] [我|wǒ] [做|zuò] [的|de] ！', 'アルバ の {w.cup} は 、 どれ も [少|すこ]し わたし の もの 。 [宿屋|やどや] の {w.plate} も わたし が [作|つく]りました ！'),
      T('Clay is patient. You press too hard, it tells you. Just like people.', 'El barro es paciente. Si aprietas mucho, te avisa. Como la gente.', 'O barro é paciente. Se você aperta demais, ele avisa. Igualzinho às pessoas.', 'Ton ist geduldig. Drückst du zu fest, sagt er es dir. Genau wie Menschen.',
        '[泥|ní] [很|hěn] [有|yǒu] [耐心|nài xīn] 。 [你|nǐ] [用力|yòng lì] [太|tài] [大|dà] ， [它|tā] [会|huì] [告诉|gào su] [你|nǐ] 。 [跟|gēn] [人|rén] [一样|yī yàng] 。', '[粘土|ねんど] は [我慢強|がまんづよ]い です 。 [強|つよ]く [押|お]しすぎる と 、 [教|おし]えて くれます 。 [人|ひと] と [同|おな]じ 。'),
    ], { job: 'tinker' })] });
  // 27 the world traveler (a grandma)
  H('alba-house-27', { theme: 'traveler', people: [
    P('matilde', 'Matilde', 'grandma', 'sofa', { skin: '#a8714a', hair: '#c9c4bb', hairdo: 'bun', dress: '#d9483b', scarf: '#f2c14e', glasses: true, h: 0.9, hat: 'straw', hatColor: '#d8b080' }, [
      T('Hello! Excuse the suitcases. I just got back… three years ago.', '¡Hola! Perdón por las maletas. Acabo de volver… hace tres años.', 'Oi! Desculpa as malas. Acabei de voltar… faz três anos.', 'Hallo! Entschuldige die Koffer. Ich bin gerade zurück … seit drei Jahren.',
        '[你好|nǐ hǎo] ！ [别|bié] [在意|zài yì] [这些|zhè xiē] [箱子|xiāng zi] 。 [我|wǒ] [刚|gāng] [回来|huí lái] … [三|sān] [年|nián] [前|qián] 。', 'こんにちは ！ スーツケース は [気|き] に しない で 。 [帰|かえ]って きた ばかり … [三年前|さんねんまえ] に 。'),
      T('I’ve seen the sea, the snow, a hundred towers. The best view? This {w.window}.', 'He visto el mar, la nieve, cien torres. ¿La mejor vista? Esta {w.window}.', 'Eu já vi o mar, a neve, cem torres. A melhor vista? Esta {w.window}.', 'Ich habe das Meer gesehen, den Schnee, hundert Türme. Die schönste Aussicht? Dieses {w.window}.',
        '[我|wǒ] [见过|jiàn guo] [大海|dà hǎi] 、 [雪|xuě] 、 [一百|yī bǎi] [座|zuò] [塔|tǎ] 。 [最|zuì] [美|měi] [的|de] [风景|fēng jǐng] ？ [就是|jiù shì] [这|zhè] [扇|shàn] {w.window} 。', '[海|うみ] も 、 [雪|ゆき] も 、 [百|ひゃく] の [塔|とう] も [見|み]ました 。 いちばん の [眺|なが]め ？ この {w.window} です 。'),
      T('In every country I learned one word first: “thank you”. It opens every door.', 'En cada país aprendí primero una palabra: “gracias”. Abre todas las puertas.', 'Em cada país eu aprendi primeiro uma palavra: “obrigada”. Ela abre todas as portas.', 'In jedem Land habe ich zuerst ein Wort gelernt: „danke“. Es öffnet jede Tür.',
        '[在|zài] [每|měi] [个|gè] [国家|guó jiā] ， [我|wǒ] [先|xiān] [学|xué] [一|yī] [个|gè] [词|cí] ： “ [谢谢|xiè xie] ” 。 [它|tā] [能|néng] [打开|dǎ kāi] [每|měi] [一|yī] [扇|shàn] [门|mén] 。', 'どの [国|くに] でも 、 [最初|さいしょ] に [覚|おぼ]えた [言葉|ことば] は 「 ありがとう 」 。 どんな [扉|とびら] も [開|あ]けて くれます 。'),
    ], { job: 'read', prop: 'book' })] });
  // 28 the new neighbors, still in boxes (their quest: ask the new girl her name)
  H('alba-house-28', { theme: 'movingIn', people: [
    P('daniela', 'Daniela', 'woman', 'stand', { skin: '#8a5a3c', hair: '#2e2420', hairdo: 'curly', dress: '#3f6fb5', legs: true, pants: '#3a4466' }, [
      T('Hello! Sorry, we’re still unpacking. We arrived on Monday.', '¡Hola! Perdón, todavía estamos desempacando. Llegamos el lunes.', 'Oi! Desculpa, a gente ainda tá desempacotando. Chegamos na segunda.', 'Hallo! Entschuldige, wir packen noch aus. Wir sind am Montag gekommen.',
        '[你好|nǐ hǎo] ！ [不好意思|bù hǎo yì si] ， [我们|wǒ men] [还|hái] [在|zài] [整理|zhěng lǐ] [行李|xíng li] 。 [我们|wǒ men] [星期一|xīng qī yī] [到|dào] [的|de] 。', 'こんにちは ！ ごめんなさい 、 まだ [荷物|にもつ] を [片付|かたづ]けて います 。 [月曜日|げつようび] に [来|き]た ばかり で 。'),
      T('A new town is hard. Valentina hasn’t made a friend yet.', 'Un pueblo nuevo es difícil. Valentina todavía no tiene amigos.', 'Uma cidade nova é difícil. A Valentina ainda não fez amigos.', 'Ein neuer Ort ist schwer. Valentina hat noch keine Freunde.',
        '[新|xīn] [的|de] [地方|dì fang] [不|bù] [容易|róng yì] 。 [瓦伦蒂娜|Wǎ lún dì nà] [还|hái] [没有|méi yǒu] [朋友|péng you] 。', '[新|あたら]しい [町|まち] は [大変|たいへん] です 。 バレンティナ は まだ [友達|ともだち] が いません 。'),
    ]),
    P('valentina', 'Valentina', 'kid', 'floor', { skin: '#8a5a3c', hair: '#2e2420', hairdo: 'curly', dress: '#f2c14e', h: 0.72 }, [
      T('Um… hi.', 'Eh… hola.', 'Hã… oi.', 'Ähm … hallo.', '[那个|nà ge] … [你好|nǐ hǎo] 。', 'あの … こんにちは 。'),
      T('I collect stars. Paper ones. I have forty-two.', 'Colecciono estrellas. De papel. Tengo cuarenta y dos.', 'Eu coleciono estrelas. De papel. Tenho quarenta e duas.', 'Ich sammle Sterne. Aus Papier. Ich habe zweiundvierzig.',
        '[我|wǒ] [收集|shōu jí] [星星|xīng xing] 。 [纸|zhǐ] [做|zuò] [的|de] 。 [我|wǒ] [有|yǒu] [四十二|sì shí èr] [颗|kē] 。', '[星|ほし] を [集|あつ]めて る の 。 [紙|かみ] の 。 [四十二個|よんじゅうにこ] ある よ 。'),
    ])] });
  // 29 the botanist
  H('alba-house-29', { theme: 'botanist', people: [
    P('oscar', 'Óscar', 'man', 'hero', { skin: '#a8714a', hair: '#2e2420', dress: '#4f8a4a', apron: '#c9a07a', legs: true, pants: '#4a3a33', beard: true, hat: 'straw', hatColor: '#e8c57a' }, [
      T('Careful with the leaves! This one is very old. Older than me.', '¡Cuidado con las hojas! Esta es muy vieja. Más vieja que yo.', 'Cuidado com as folhas! Esta aqui é muito velha. Mais velha que eu.', 'Vorsicht mit den Blättern! Die hier ist sehr alt. Älter als ich.',
        '[小心|xiǎo xīn] [叶子|yè zi] ！ [这|zhè] [盆|pén] [很|hěn] [老|lǎo] [了|le] 。 [比|bǐ] [我|wǒ] [还|hái] [老|lǎo] 。', '[葉|は]っぱ に [気|き] を つけて ！ これ は とても [古|ふる]い ん です 。 わたし より [年上|としうえ] 。'),
      T('I talk to my plants every day. They grow faster. Try it with your words!', 'Les hablo a mis plantas todos los días. Crecen más rápido. ¡Prueba con tus palabras!', 'Eu converso com as minhas plantas todo dia. Elas crescem mais rápido. Tenta com as suas palavras!', 'Ich rede jeden Tag mit meinen Pflanzen. Sie wachsen schneller. Probier es mit deinen Wörtern!',
        '[我|wǒ] [每天|měi tiān] [跟|gēn] [我|wǒ] [的|de] [植物|zhí wù] [说话|shuō huà] 。 [它们|tā men] [长|zhǎng] [得|de] [更|gèng] [快|kuài] 。 [你|nǐ] [也|yě] [试试|shì shi] [你|nǐ] [的|de] [话|huà] ！', '[毎日|まいにち] 、 [植物|しょくぶつ] に [話|はな]しかけます 。 [早|はや]く [育|そだ]つ ん です 。 あなた の [言葉|ことば] で も ためして ！'),
      T('A {w.flower} in the {w.window}, and the house smiles.', 'Una {w.flower} en la {w.window}, y la casa sonríe.', 'Uma {w.flower} na {w.window}, e a casa sorri.', 'Eine {w.flower} am {w.window}, und das Haus lächelt.',
        '[在|zài] {w.window} [上|shàng] [放|fàng] [一|yī] [朵|duǒ] {w.flower} ， [房子|fáng zi] [就|jiù] [笑|xiào] [了|le] 。', '{w.window} に {w.flower} を [一輪|いちりん] 。 [家|いえ] が [笑|わら]います 。'),
    ], { job: 'water', prop: 'can' })] });
  // 30 the carpenter
  H('alba-house-30', { theme: 'carpenter', people: [
    P('emilio', 'Emilio', 'man', 'stand', { skin: '#efc29a', hair: '#6b3b25', dress: '#c9553f', apron: '#8a5f3e', legs: true, pants: '#3a4466', stache: true, h: 1.06, w: 1.1, hat: 'cap', hatColor: '#3f6fb5' }, [
      T('Hello! Mind the sawdust. And the saw. Mostly the saw.', '¡Hola! Cuidado con el aserrín. Y con la sierra. Sobre todo con la sierra.', 'Oi! Cuidado com a serragem. E com o serrote. Principalmente com o serrote.', 'Hallo! Vorsicht mit den Spänen. Und mit der Säge. Vor allem mit der Säge.',
        '[你好|nǐ hǎo] ！ [小心|xiǎo xīn] [木屑|mù xiè] 。 [还有|hái yǒu] [锯子|jù zi] 。 [特别|tè bié] [是|shì] [锯子|jù zi] 。', 'こんにちは ！ おがくず に [気|き] を つけて 。 それ と のこぎり 。 [特|とく] に のこぎり 。'),
      T('I made the {w.table:pl} at the school. The kids carve their names in them. I don’t mind.', 'Hice las {w.table:pl} de la escuela. Los niños graban sus nombres. No me importa.', 'Eu fiz as {w.table:pl} da escola. As crianças gravam os nomes nelas. Eu não ligo.', 'Ich habe die {w.table:pl} in der Schule gebaut. Die Kinder ritzen ihre Namen hinein. Das macht nichts.',
        '[学校|xué xiào] [的|de] {w.table} [是|shì] [我|wǒ] [做|zuò] [的|de] 。 [孩子们|hái zi men] [在|zài] [上面|shàng miàn] [刻|kè] [名字|míng zi] 。 [我|wǒ] [不|bù] [在意|zài yì] 。', '[学校|がっこう] の {w.table} は わたし が [作|つく]りました 。 [子|こ]ども たち が [名前|なまえ] を [彫|ほ]ります 。 [気|き] に しません よ 。'),
      T('This {w.chair} has three legs. It’s not broken. It’s waiting for its fourth.', 'Esta {w.chair} tiene tres patas. No está rota. Está esperando la cuarta.', 'Esta {w.chair} tem três pernas. Não está quebrada. Está esperando a quarta.', 'Dieser {w.chair} hat drei Beine. Er ist nicht kaputt. Er wartet auf das vierte.',
        '[这|zhè] [把|bǎ] {w.chair} [有|yǒu] [三|sān] [条|tiáo] [腿|tuǐ] 。 [不|bù] [是|shì] [坏|huài] [了|le] ， [是|shì] [在|zài] [等|děng] [第四|dì sì] [条|tiáo] 。', 'この {w.chair} は [脚|あし] が [三本|さんぼん] 。 [壊|こわ]れて いません 。 [四本目|よんほんめ] を [待|ま]って いる ん です 。'),
    ], { job: 'tinker', prop: 'tool' })] });
  // 31 the dad with the fish tank, and Nacho upstairs
  H('alba-house-31', { theme: 'aquarium', people: [
    P('pablo', 'Pablo', 'man', 'hero', { skin: '#dcae86', hair: '#4a2f27', dress: '#3f8fc9', legs: true, pants: '#3a4466', glasses: true, beard: true }, [
      T('This is our sea! Well, a little piece of it.', '¡Este es nuestro mar! Bueno, un pedacito.', 'Este é o nosso mar! Bom, um pedacinho dele.', 'Das ist unser Meer! Na ja, ein kleines Stück davon.',
        '[这|zhè] [是|shì] [我们|wǒ men] [的|de] [大海|dà hǎi] ！ [好吧|hǎo ba] ， [一|yī] [小|xiǎo] [块|kuài] [大海|dà hǎi] 。', 'ここ は うち の [海|うみ] です ！ まあ 、 [小|ちい]さな [海|うみ] です けど 。'),
      T('The orange fish is Nacho’s. The yellow one is mine. The blue one is the boss.', 'El pez naranja es de Nacho. El amarillo es mío. El azul es el jefe.', 'O peixe laranja é do Nacho. O amarelo é meu. O azul é o chefe.', 'Der orange Fisch gehört Nacho. Der gelbe mir. Der blaue ist der Chef.',
        '[橙色|chéng sè] [的|de] [鱼|yú] [是|shì] [纳乔|Nà qiáo] [的|de] 。 [黄色|huáng sè] [的|de] [是|shì] [我|wǒ] [的|de] 。 [蓝色|lán sè] [的|de] [是|shì] [老大|lǎo dà] 。', 'オレンジ の [魚|さかな] は ナチョ の 。 [黄色|きいろ]い の は わたし の 。 [青|あお]い の が ボス です 。'),
    ], { job: 'think' })],
    up: { people: [P('nacho', 'Nacho', 'kid', 'desk', { skin: '#dcae86', hair: '#4a2f27', dress: '#f2c14e', legs: true, pants: '#3a4466', h: 0.76, hat: 'cap', hatColor: '#3d7fd1' }, [
      T('Did you know? Some fish sleep with their eyes open. Like Dad.', '¿Sabías? Algunos peces duermen con los ojos abiertos. Como papá.', 'Sabia? Alguns peixes dormem de olho aberto. Igual o papai.', 'Wusstest du? Manche Fische schlafen mit offenen Augen. Wie Papa.',
        '[你|nǐ] [知道|zhī dào] [吗|ma] ？ [有些|yǒu xiē] [鱼|yú] [睁|zhēng] [着|zhe] [眼睛|yǎn jing] [睡觉|shuì jiào] 。 [跟|gēn] [爸爸|bà ba] [一样|yī yàng] 。', '[知|し]って る ？ [目|め] を [開|あ]けた まま [寝|ね]る [魚|さかな] も いる ん だ よ 。 パパ みたい に 。'),
      T('When I grow up, I’ll live on a boat. With fifty fish.', 'Cuando sea grande, voy a vivir en un barco. Con cincuenta peces.', 'Quando eu crescer, vou morar num barco. Com cinquenta peixes.', 'Wenn ich groß bin, wohne ich auf einem Boot. Mit fünfzig Fischen.',
        '[我|wǒ] [长大|zhǎng dà] [以后|yǐ hòu] ， [要|yào] [住|zhù] [在|zài] [船|chuán] [上|shàng] 。 [还要|hái yào] [养|yǎng] [五十|wǔ shí] [条|tiáo] [鱼|yú] 。', '[大|おお]きく なったら 、 [船|ふね] に [住|す]む ん だ 。 [魚|さかな] [五十匹|ごじゅっぴき] と いっしょ に 。'),
    ], { job: 'write' })] } });
})();

// ============================================================ Alba's side quests (the engine: interiors_quests.js)
// Each: someone uses the phrase first (whole, in the language, out loud), then you say it in the box, graded S–D.
(() => {
  if (typeof HQ === 'undefined' || !HQ) return;
  const { T, n } = HQ;
  const P = pid => HQ.person(pid);
  const say = (pid, L) => HQ.say(P(pid), L);
  const ask = async (task, o) => { const r = await HQ.ask(task, o); return r && !r.cancelled ? r.grade : null; };
  const worse = (a, b) => 'SABCD'[Math.max('SABCD'.indexOf(a || 'S'), 'SABCD'.indexOf(b || 'S'))];
  const G = () => HQ.G;
  // a grade said in one scene and rewarded in a later one (stage by stage)
  const saveG = (q, g) => { const s = G().state.hq; s.grades = s.grades || {}; s.grades[q.id + ':g'] = worse(s.grades[q.id + ':g'], g); };
  const fadeRefresh = async (door, props) => { try { await UI.fade(1, 220); INTERIORS.refresh(door, props ? { props: true } : {}); await UI.fade(0, 220); } catch (e) { console.error('[hq]', e); } };
  // lines every quest shares
  const COMMON = HQ.COMMON = HQ.COMMON || {
    later: T('No rush. Come back when you’re ready.', 'Sin prisa. Vuelve cuando quieras.', 'Sem pressa. Volta quando quiser.', 'Keine Eile. Komm wieder, wenn du so weit bist.',
      '[不|bù] [着急|zháo jí] 。 [准备|zhǔn bèi] [好|hǎo] [了|le] [再|zài] [来|lái] 。', 'あわてない で 。 [準備|じゅんび] が できたら 、 また [来|き]て ね 。'),
  };

  // ---- 1. Don Anselmo's key (a lost thing) · «¡Aquí está!»
  HQ.phrase({ id: 'ph.hq.here', en: 'Here it is!', note: 'For something you found. German: «Hier ist er / sie / es!», after der / die / das.', es: '¡Aquí está!', pt: 'Aqui está!', de: 'Hier ist er!', zh: '[在|zài] [这里|zhè lǐ] ！', ja: 'ここ に あります ！' });
  HQ.keep({ id: 'k.hqKey', en: 'Don Anselmo’s key', es: 'llave', pt: 'chave', de: 'Schlüssel', zh: '[钥匙|yào shi]', ja: '[鍵|かぎ]', g: { es: 'f', pt: 'f', de: 'm' }, icon: 'door' });
  const Q1 = HQ.quest({ id: 'hq.key', home: 'alba-house-14', done: 3, coins: 8, phrase: 'ph.hq.here',
    title: () => `${n('anselmo')}’s lost key`, who: () => `${n('anselmo')}, the retired teacher in Alba`,
    steps: [{ until: 2, text: () => `Find ${n('anselmo')}’s key in his house`, why: 'He can’t lock his door without it. It’s somewhere in the room, and his {w.cat} Nube sleeps on everything.', hint: '{mimo} sniffs at the rug…', at: ['alba-house-14'] },
      { until: 3, text: () => `Give ${n('anselmo')} his key: tell him “Here it is!”`, why: 'Say it in the language, the way he said it while he was looking.', hint: '{mimo} hops toward the old teacher.', at: ['alba-house-14', 'anselmo'] }],
    story: () => `${n('anselmo')} lost his key. It was under Nube, his {w.cat}, all along, and you gave it back.`,
    lines: {
      lost: T('Oh! Hello… I can’t find my key. Where is it? Here? No. Here? Not there either! Oh, I want to say “Here it is!”…', '¡Ay! Hola… No encuentro mi llave. ¿Dónde está? ¿Aquí? No. ¿Aquí? ¡Tampoco! Ay, quiero decir «¡aquí está!»…', 'Ai! Oi… Não acho a minha chave. Cadê? Aqui? Não. Aqui? Também não! Ai, eu quero dizer «aqui está!»…', 'Ach! Hallo … Ich finde meinen Schlüssel nicht. Wo ist er? Hier? Nein. Hier? Auch nicht! Ach, ich will endlich sagen: „Hier ist er!“ …',
        '[哎|āi] ！ [你好|nǐ hǎo] … [我|wǒ] [找|zhǎo] [不|bù] [到|dào] [钥匙|yào shi] [了|le] 。 [在|zài] [哪里|nǎ lǐ] ？ [这里|zhè lǐ] ？ [不|bù] [在|zài] 。 [这里|zhè lǐ] ？ [也|yě] [不|bù] [在|zài] ！ [真|zhēn] [想|xiǎng] [说|shuō] [一|yī] [句|jù] ： “ [在|zài] [这里|zhè lǐ] ！ ”', 'ああ ！ こんにちは … [鍵|かぎ] が [見|み]つかりません 。 どこ ？ ここ ？ ない 。 ここ ？ ここ に も ない ！ ああ 、 「 ここ に あります ！ 」 と [言|い]いたい …'),
      help: T('It’s somewhere in this room. Could you look? My eyes aren’t what they were.', 'Está en algún lugar de este cuarto. ¿Puedes buscar? Mis ojos ya no son lo que eran.', 'Está em algum lugar deste quarto. Você pode procurar? Os meus olhos não são mais os mesmos.', 'Er ist irgendwo hier im Zimmer. Kannst du suchen? Meine Augen sind nicht mehr die besten.',
        '[就|jiù] [在|zài] [这个|zhè ge] [房间|fáng jiān] [里|lǐ] 。 [你|nǐ] [能|néng] [帮|bāng] [我|wǒ] [找|zhǎo] [找|zhao] [吗|ma] ？ [我|wǒ] [的|de] [眼睛|yǎn jing] [不|bù] [好|hǎo] [了|le] 。', 'この [部屋|へや] の どこ か に ある はず です 。 [探|さが]して もらえます か ？ もう [目|め] が [悪|わる]くて 。'),
      remind: T('Any luck? Try where Nube likes to sleep… she sleeps on everything.', '¿Algo? Busca donde le gusta dormir a Nube… duerme encima de todo.', 'E aí? Procura onde a Nube gosta de dormir… ela dorme em cima de tudo.', 'Und? Schau mal, wo Nube gern schläft … sie schläft auf allem.',
        '[找到|zhǎo dào] [了|le] [吗|ma] ？ [看看|kàn kan] [云朵|Yún duǒ] [喜欢|xǐ huan] [睡|shuì] [的|de] [地方|dì fang] … [它|tā] [总是|zǒng shì] [睡|shuì] [在|zài] [东西|dōng xi] [上|shàng] 。', 'どう です か ？ ソラ が [寝|ね]る ところ を [見|み]て みて … なんでも [枕|まくら] に します から 。'),
      thanks: T('My key! Here it is! Oh, thank you! Now I can lock my door tonight.', '¡Mi llave! ¡Aquí está! ¡Ay, gracias! Ahora sí puedo cerrar mi puerta esta noche.', 'A minha chave! Aqui está! Ai, obrigado! Agora eu posso trancar a porta hoje à noite.', 'Mein Schlüssel! Hier ist er! Oh, danke! Jetzt kann ich heute Abend meine Tür abschließen.',
        '[我|wǒ] [的|de] [钥匙|yào shi] ！ [在|zài] [这里|zhè lǐ] ！ [太|tài] [谢谢|xiè xie] [你|nǐ] [了|le] ！ [今天|jīn tiān] [晚上|wǎn shang] [我|wǒ] [可以|kě yǐ] [锁|suǒ] [门|mén] [了|le] 。', '[鍵|かぎ] だ ！ ここ に ありました ！ ありがとう ！ これ で [今夜|こんや] 、 ドア に [鍵|かぎ] を かけられます 。'),
    },
    tasks: { here: { en: 'Here it is!', model: { es: '¡Aquí está!', pt: 'Aqui está!', de: 'Hier ist er!', zh: '[在|zài] [这里|zhè lǐ] ！', ja: 'ここ に あります ！' },
      ok: { es: ['¡Aquí está la llave!', 'La llave está aquí', '¡Aquí tiene!', '¡Aquí tienes!', '¡Aquí está su llave!', '¡Aquí está tu llave!'], pt: ['Aqui está a chave!', 'A chave está aqui!', 'Aqui está a sua chave!', 'Tá aqui!'], de: ['Hier ist der Schlüssel!', 'Hier ist dein Schlüssel!', 'Hier ist Ihr Schlüssel!', 'Da ist er!'],
        zh: ['[钥匙|yào shi] [在|zài] [这里|zhè lǐ] ！', '[给|gěi] [你|nǐ] ！', '[在|zài] [这|zhè] ！'], ja: ['ここ です ！', '[鍵|かぎ] は ここ に あります ！', 'ありました ！', 'はい 、 どうぞ ！'] },
      keys: { es: [['aqui', 'aca']], pt: [['aqui']], de: [['hier', 'da']], zh: [['zheli', 'zai zhe', 'gei']], ja: [['koko', 'arimashita']] } } },
    talk: {
      anselmo: st => (st === 0 ? async () => { HQ.lock(true); await HQ.demo(P('anselmo'), Q1.lines.lost, Q1.tasks.here); await say('anselmo', Q1.lines.help); await HQ.me('I’ll look around!'); HQ.setStage('hq.key', 1); HQ.mimo('…?'); }
        : st === 1 ? () => say('anselmo', Q1.lines.remind)
        : st === 2 ? async () => {
          HQ.lock(true); await HQ.me('I found it! It was under Nube.');
          const g = await ask(Q1.tasks.here, { title: `Give ${n('anselmo')} his key. Say: “Here it is!”`, icon: 'door' });
          if (!g) { await say('anselmo', COMMON.later); return; }
          HQ.take('k.hqKey'); await HQ.demo(P('anselmo'), Q1.lines.thanks, Q1.tasks.here); HQ.setStage('hq.key', 3); HQ.reward(Q1, g);
        } : null),
    },
    // three places to look (the desk, the shelf, the cat): only one of them has it
    extras: (st, ctx) => {
      if (st !== 1 || ctx.floor) return [];
      const M = ctx.marks, cat = ctx.room && ctx.room.spots.find(s => s.type === 'cat'), out = [];
      if (M.desk) out.push({ x: M.desk.x, z: M.desk.z, r: 1.3, label: 'Look', run: async () => { HQ.think('Only homework and chalk dust… no key.'); } });
      if (M.shelf) out.push({ x: M.shelf.x, z: M.shelf.z, r: 1.2, label: 'Look', run: async () => { HQ.think('Books, books, books. No key.'); } });
      if (cat) out.push({ x: cat.x, z: cat.z + 0.6, r: 1.3, label: 'Look', run: async () => {
        HQ.mimo('?'); Sound.play('chirp'); await HQ.wait(0.5); if (HQ.stage('hq.key') !== 1) return;
        HQ.think('{mimo} sniffs at Nube… she stretches. Under her: a little brass key!', 5);
        HQ.give('k.hqKey'); HQ.setStage('hq.key', 2); Sound.play('review'); INTERIORS.refresh('alba-house-14', { props: true });
      } });
      return out;
    },
    props: (st, ctx) => { const cat = ctx.room && ctx.room.spots.find(s => s.type === 'cat'); if (st >= 2 || !cat || ctx.floor) return [];
      return [{ x: cat.x + 0.22, z: cat.z + 0.12, rot: 0.7, draw: (k, GEO, W8) => { k.add(GEO.thin, 0, 0.02, 0, 0.07, 0.07, 0.07, W8.brass, { rx: Math.PI / 2, ink: 0 }); k.box(0.13, 0.02, 0, 0.16, 0.015, 0.025, W8.brass, { ink: 0.003 }); k.box(0.19, 0.02, 0.025, 0.03, 0.015, 0.03, W8.brass, { ink: 0 }); } }]; },
    mark: { anselmo: st => (st === 0 ? '!' : st === 2 ? '◆' : null) } });

  // ---- 2. A birthday drawing (a delivery between neighbors) · «¡Feliz cumpleaños!»
  HQ.phrase({ id: 'ph.hq.bday', en: 'Happy birthday!', es: '¡Feliz cumpleaños!', pt: 'Feliz aniversário!', de: 'Alles Gute zum Geburtstag!', zh: '[生日|shēng rì] [快乐|kuài lè] ！', ja: 'お[誕生日|たんじょうび] おめでとう ございます ！', note: 'pt also: «Parabéns!» (congratulations). ja to a friend: «お誕生日おめでとう！».' });
  HQ.keep({ id: 'k.hqDrawing', en: 'Camila’s drawing', es: 'dibujo', pt: 'desenho', de: 'Bild', zh: '[画|huà]', ja: '[絵|え]', g: { es: 'm', pt: 'm', de: 'n' }, icon: 'paper' });
  const Q2 = HQ.quest({ id: 'hq.bday', home: 'alba-house-17', homes: { camila: 'alba-house-17', remedios: 'alba-house-18' }, done: 3, coins: 6, phrase: 'ph.hq.bday',
    title: () => 'A birthday drawing', who: () => `${n('camila')}, a little artist in Alba`,
    steps: [{ until: 2, text: () => `Give ${n('remedios')} Camila’s drawing and wish her a happy birthday`, why: 'Camila is too shy to give it herself. Her neighbor lives next door, in the house with the canaries.', hint: '{mimo} points next door.', at: ['alba-house-18', 'remedios'] },
      { until: 3, text: () => `Tell ${n('camila')} how it went`, why: 'She’s waiting at home, crayons in hand.', hint: '{mimo} points back to Camila’s house.', at: ['alba-house-17', 'camila'] }],
    story: () => `Camila drew a picture for ${n('remedios')}’s birthday. You took it next door and wished her a happy birthday. It hangs on her wall now.`,
    lines: {
      offer: T('Psst! I made a drawing for Doña Remedios next door. It’s her birthday today!', '¡Psst! Hice un dibujo para doña Remedios, la vecina. ¡Hoy es su cumpleaños!', 'Psiu! Eu fiz um desenho pra dona Remedios, a vizinha. Hoje é o aniversário dela!', 'Psst! Ich hab ein Bild für Oma Remedios gemalt, die Nachbarin. Heute ist ihr Geburtstag!',
        '[嘘|xū] ！ [我|wǒ] [给|gěi] [隔壁|gé bì] [的|de] [雷梅迪奥斯|Léi méi dí ào sī] [奶奶|nǎi nai] [画|huà] [了|le] [一|yī] [张|zhāng] [画|huà] 。 [今天|jīn tiān] [是|shì] [她|tā] [的|de] [生日|shēng rì] ！', 'ねえ ！ となり の レメディオス さん に [絵|え] を [描|か]いた の 。 [今日|きょう] は [誕生日|たんじょうび] な ん だ よ ！'),
      demo: T('I practiced all morning: “Happy birthday, Doña Remedios!” But I’m too shy…', 'Practiqué toda la mañana: «¡Feliz cumpleaños, doña Remedios!» Pero me da mucha vergüenza…', 'Eu treinei a manhã toda: «Feliz aniversário, dona Remedios!» Mas eu tenho muita vergonha…', 'Ich hab den ganzen Morgen geübt: „Alles Gute zum Geburtstag, Oma Remedios!“ Aber ich trau mich nicht …',
        '[我|wǒ] [练|liàn] [了|le] [一|yī] [上午|shàng wǔ] ： “ [生日|shēng rì] [快乐|kuài lè] ， [雷梅迪奥斯|Léi méi dí ào sī] [奶奶|nǎi nai] ！ ” [可是|kě shì] [我|wǒ] [太|tài] [害羞|hài xiū] [了|le] …', '[朝|あさ] から [練習|れんしゅう] した の 。 「 お[誕生日|たんじょうび] おめでとう ございます 、 レメディオス さん ！ 」 でも 、 [恥|は]ずかしくて …'),
      please: T('Can you give it to her? And say it for me? Please!', '¿Se lo das tú? ¿Y se lo dices por mí? ¡Porfa!', 'Você entrega pra ela? E fala por mim? Por favor!', 'Kannst du es ihr geben? Und es für mich sagen? Bitte!',
        '[你|nǐ] [能|néng] [帮|bāng] [我|wǒ] [送|sòng] [给|gěi] [她|tā] [吗|ma] ？ [再|zài] [替|tì] [我|wǒ] [说|shuō] [那|nà] [句|jù] [话|huà] ？ [拜托|bài tuō] [啦|la] ！', '[渡|わた]して くれる ？ それ で 、 わたし の かわり に [言|い]って くれる ？ お[願|ねが]い ！'),
      wait: T('Did you give it to her yet? Her house is the next one, with the canaries.', '¿Ya se lo diste? Su casa es la de al lado, la de los canarios.', 'Já entregou? A casa dela é a do lado, a dos canários.', 'Hast du es ihr schon gegeben? Ihr Haus ist gleich nebenan, das mit den Kanarienvögeln.',
        '[你|nǐ] [送|sòng] [去|qù] [了|le] [吗|ma] ？ [她|tā] [家|jiā] [就|jiù] [在|zài] [隔壁|gé bì] ， [有|yǒu] [金丝雀|jīn sī què] [的|de] [那|nà] [家|jiā] 。', 'もう [渡|わた]して くれた ？ [隣|となり] の [家|いえ] 、 カナリア の いる [家|いえ] だ よ 。'),
      thanks: T('For me? From little Camila? Oh, how lovely! Thank you! Here, have some {w.cake}.', '¿Para mí? ¿De la pequeña Camila? ¡Ay, qué bonito! ¡Gracias! Toma, un pedazo de {w.cake}.', 'Pra mim? Da pequena Camila? Ai, que lindo! Obrigada! Toma, um pedaço de {w.cake}.', 'Für mich? Von der kleinen Camila? Oh, wie schön! Danke! Hier, ein Stück {w.cake}.',
        '[给|gěi] [我|wǒ] [的|de] ？ [小|xiǎo] [卡米拉|Kǎ mǐ lā] [画|huà] [的|de] ？ [哎呀|āi yā] ， [真|zhēn] [好看|hǎo kàn] ！ [谢谢|xiè xie] ！ [来|lái] ， [吃|chī] [块|kuài] {w.cake} 。', 'わたし に ？ カミラ ちゃん から ？ まあ 、 すてき ！ ありがとう ！ はい 、 {w.cake} を どうぞ 。'),
      after: T('Camila’s drawing is on my wall now. The canaries like it too.', 'El dibujo de Camila ya está en mi pared. A los canarios también les gusta.', 'O desenho da Camila já está na minha parede. Os canários também gostaram.', 'Camilas Bild hängt jetzt an meiner Wand. Den Kanarienvögeln gefällt es auch.',
        '[卡米拉|Kǎ mǐ lā] [的|de] [画|huà] [现在|xiàn zài] [挂|guà] [在|zài] [我|wǒ] [的|de] [墙|qiáng] [上|shàng] 。 [金丝雀|jīn sī què] [也|yě] [喜欢|xǐ huan] 。', 'カミラ ちゃん の [絵|え] 、 [壁|かべ] に [飾|かざ]りました 。 カナリア たち も [気|き] に [入|い]って います 。'),
      yay: T('She liked it? She put it on her wall?! Yay! You’re great!', '¿Le gustó? ¿¡Lo puso en su pared!? ¡Bien! ¡Eres lo máximo!', 'Ela gostou? Ela pendurou na parede?! Eba! Você é demais!', 'Es hat ihr gefallen? Sie hat es an die Wand gehängt?! Juhu! Du bist super!',
        '[她|tā] [喜欢|xǐ huan] [吗|ma] ？ [挂|guà] [在|zài] [墙|qiáng] [上|shàng] [了|le] ？ [耶|yē] ！ [你|nǐ] [最|zuì] [棒|bàng] [了|le] ！', '[気|き] に [入|い]って くれた ？ [壁|かべ] に [飾|かざ]った の ？ やった ！ ありがとう ！'),
    },
    tasks: { bday: { en: 'Happy birthday!', model: { es: '¡Feliz cumpleaños!', pt: 'Feliz aniversário!', de: 'Alles Gute zum Geburtstag!', zh: '[生日|shēng rì] [快乐|kuài lè] ！', ja: 'お[誕生日|たんじょうび] おめでとう ございます ！' },
      ok: { es: ['¡Feliz cumpleaños, doña Remedios!', '¡Feliz cumple!', 'Feliz cumpleaños, señora Remedios'], pt: ['Feliz aniversário, dona Remedios!', 'Parabéns!', 'Parabéns, dona Remedios!', 'Feliz aniversário pra senhora!'], de: ['Alles Gute zum Geburtstag, Oma Remedios!', 'Herzlichen Glückwunsch zum Geburtstag!', 'Alles Gute zum Geburtstag, Frau Remedios!'],
        zh: ['[祝|zhù] [你|nǐ] [生日|shēng rì] [快乐|kuài lè] ！', '[祝|zhù] [您|nín] [生日|shēng rì] [快乐|kuài lè] ！', '[生日|shēng rì] [快乐|kuài lè] ， [奶奶|nǎi nai] ！'], ja: ['お[誕生日|たんじょうび] おめでとう ！', '[誕生日|たんじょうび] おめでとう ございます ！', 'お[誕生日|たんじょうび] おめでとう ございます 、 レメディオス さん ！'] },
      keys: { es: [['feliz'], ['cumpleanos', 'cumple']], pt: [['feliz', 'parabens'], ['aniversario', 'parabens']], de: [['geburtstag'], ['alles gute', 'gluckwunsch']], zh: [['shengri'], ['kuaile']], ja: [['tanjoubi', 'tanjobi'], ['omedetou', 'omedeto']] } } },
    talk: {
      camila: st => (st === 0 ? async () => { HQ.lock(true); await say('camila', Q2.lines.offer); await HQ.demo(P('camila'), Q2.lines.demo, Q2.tasks.bday); await say('camila', Q2.lines.please); HQ.give('k.hqDrawing'); HQ.setStage('hq.bday', 1); UI.toast(`📄 ${HQ.itemName('k.hqDrawing')} (in your bag)`); }
        : st === 1 ? () => say('camila', Q2.lines.wait)
        : st === 2 ? async () => { HQ.lock(true); await HQ.me('She loved it! It’s on her wall now.'); await say('camila', Q2.lines.yay); HQ.setStage('hq.bday', 3); HQ.coins(3); } : null),
      remedios: st => (st === 1 ? async () => {
        HQ.lock(true); await HQ.me('This is from Camila, next door…');
        const g = await ask(Q2.tasks.bday, { title: `Give ${n('remedios')} the drawing. Wish her a happy birthday!`, icon: 'gift' });
        if (!g) { await say('remedios', COMMON.later); return; }
        HQ.take('k.hqDrawing'); await say('remedios', Q2.lines.thanks); HQ.give('w.cake'); HQ.setStage('hq.bday', 2); HQ.reward(Q2, g);
        INTERIORS.refresh('alba-house-18', { props: true });
      } : st >= 2 ? () => say('remedios', Q2.lines.after) : null),
    },
    props: (st, ctx) => { if (st < 2 || !ctx.door || ctx.door.id !== 'alba-house-18' || ctx.floor) return []; const m = ctx.marks.wall; if (!m) return []; return [{ kind: 'picture', wall: m.x < 0 ? 4 : 2, t: m.z, y: 2.15, cell: 'sunkid', w: 0.45, h: 0.45 }]; },
    mark: { camila: st => (st === 0 ? '!' : st === 2 ? '◆' : null), remedios: st => (st === 1 ? '◆' : null) } });

  // ---- 3. Mango on the wardrobe (a pet) · «¡Ven aquí!»
  HQ.phrase({ id: 'ph.hq.come', en: 'Come here!', es: '¡Ven aquí!', pt: 'Vem aqui!', de: 'Komm her!', zh: '[过来|guò lái] ！', ja: 'おいで ！', note: 'To a friend, a kid or a pet. es also: «¡Ven acá!».' });
  HQ.keep({ id: 'k.hqPick', en: 'Gael’s lucky guitar pick', es: 'púa de la suerte', pt: 'palheta da sorte', de: 'Glücksplektrum', zh: '[幸运|xìng yùn] [拨片|bō piàn]', ja: 'ラッキー ピック', g: { es: 'f', pt: 'f', de: 'n' }, icon: 'music' });
  const Q3 = HQ.quest({ id: 'hq.cat', home: 'alba-house-07', done: 3, coins: 6, phrase: 'ph.hq.come', keep: 'k.hqPick',
    title: () => 'Mango on the wardrobe', who: () => `${n('gael')}, a musician in Alba`,
    steps: [{ until: 2, text: () => 'Call Mango down from the wardrobe, upstairs', why: 'She ran up there when Gael played too loud, and she never comes when he calls.', hint: '{mimo} looks up the stairs.', at: ['alba-house-07'] },
      { until: 3, text: () => `Tell ${n('gael')} she came down`, why: 'He’s downstairs with his guitar, worried.', hint: '{mimo} trots back down the stairs.', at: ['alba-house-07', 'gael'] }],
    story: () => 'Gael’s {w.cat} Mango hid on the wardrobe and wouldn’t come down for him. You called her, and she jumped right down.',
    lines: {
      offer: T('Ugh. Mango is up on the wardrobe again, upstairs. I played too loud and she ran.', 'Uf. Mango está otra vez arriba del ropero, en el cuarto de arriba. Toqué muy fuerte y se escapó.', 'Ah, não. A Mango subiu no guarda-roupa de novo, lá em cima. Eu toquei alto demais e ela fugiu.', 'Ach Mann. Mango sitzt schon wieder oben auf dem Schrank, im Zimmer oben. Ich hab zu laut gespielt, und sie ist abgehauen.',
        '[唉|ài] 。 [芒果|Máng guǒ] [又|yòu] [跑到|pǎo dào] [楼上|lóu shàng] [的|de] [衣柜|yī guì] [上面|shàng miàn] [去|qù] [了|le] 。 [我|wǒ] [弹|tán] [得|de] [太|tài] [大声|dà shēng] ， [它|tā] [就|jiù] [跑|pǎo] [了|le] 。', 'はあ 。 マンゴー が また [二階|にかい] の タンス の [上|うえ] に 。 [大|おお]きい [音|おと] で [弾|ひ]いたら 、 [逃|に]げちゃった 。'),
      demo: T('I always call her: “Come here, Mango! Come here!” She never comes. Not for me.', 'Siempre la llamo: «¡Ven aquí, Mango! ¡Ven aquí!» Nunca viene. Para mí, no.', 'Eu sempre chamo: «Vem aqui, Mango! Vem aqui!» Ela nunca vem. Pra mim, não.', 'Ich rufe sie immer: „Komm her, Mango! Komm her!“ Sie kommt nie. Nicht zu mir.',
        '[我|wǒ] [总是|zǒng shì] [叫|jiào] [它|tā] ： “ [过来|guò lái] ， [芒果|Máng guǒ] ！ [过来|guò lái] ！ ” [它|tā] [从来|cóng lái] [不|bù] [过来|guò lái] 。 [至少|zhì shǎo] [不|bù] [听|tīng] [我|wǒ] [的|de] 。', 'いつも [呼|よ]ぶ ん だ 。 「 おいで 、 マンゴー ！ おいで ！ 」 でも [来|こ]ない 。 オレ の ところ に は ね 。'),
      go: T('Maybe she likes you. Go up and call her!', 'A lo mejor contigo sí. ¡Sube y llámala!', 'Talvez com você ela venha. Sobe e chama ela!', 'Vielleicht mag sie dich. Geh hoch und ruf sie!',
        '[也许|yě xǔ] [它|tā] [喜欢|xǐ huan] [你|nǐ] 。 [上楼|shàng lóu] [叫|jiào] [叫|jiao] [它|tā] [吧|ba] ！', '[君|きみ] の こと は [好|す]き かも 。 [二階|にかい] で [呼|よ]んで みて ！'),
      wait: T('Is she still up there? The stairs are on the side.', '¿Sigue allá arriba? La escalera está a un lado.', 'Ela ainda tá lá em cima? A escada fica do lado.', 'Ist sie noch da oben? Die Treppe ist an der Seite.',
        '[它|tā] [还|hái] [在|zài] [上面|shàng miàn] [吗|ma] ？ [楼梯|lóu tī] [在|zài] [旁边|páng biān] 。', 'まだ [上|うえ] に いる ？ [階段|かいだん] は [横|よこ] だ よ 。'),
      mew: T('Mrrow! (Mango jumps down and rubs against your legs.)', '¡Miau! (Mango baja de un salto y se frota contra tus piernas.)', 'Miau! (A Mango pula pra baixo e se esfrega nas suas pernas.)', 'Miau! (Mango springt herunter und streicht dir um die Beine.)',
        '[喵|miāo] ！ （ [芒果|Máng guǒ] [跳|tiào] [下来|xià lái] ， [蹭|cèng] [你|nǐ] [的|de] [腿|tuǐ] 。 ）', 'ニャー ！ （ マンゴー が [飛|と]び[降|お]りて 、 [足|あし] に すりすり 。 ）'),
      thanks: T('She came down? For you?! Wow. Here, take this pick. It’s my lucky one.', '¿Bajó? ¿¡Por ti!? Guau. Toma esta púa. Es mi púa de la suerte.', 'Ela desceu? Por você?! Uau. Toma esta palheta. É a minha da sorte.', 'Sie ist runtergekommen? Für dich?! Wow. Hier, nimm dieses Plektrum. Mein Glücksplektrum.',
        '[它|tā] [下来|xià lái] [了|le] ？ [因为|yīn wèi] [你|nǐ] ？ [哇|wā] 。 [给|gěi] [你|nǐ] [这个|zhè ge] [拨片|bō piàn] 。 [是|shì] [我|wǒ] [的|de] [幸运|xìng yùn] [拨片|bō piàn] 。', '[降|お]りて きた ？ [君|きみ] の ため に ？ すごい 。 この ピック 、 あげる よ 。 ラッキー ピック な ん だ 。'),
    },
    tasks: { come: { en: 'Come here!', model: { es: '¡Ven aquí!', pt: 'Vem aqui!', de: 'Komm her!', zh: '[过来|guò lái] ！', ja: 'おいで ！' },
      ok: { es: ['¡Ven aquí, Mango!', '¡Mango, ven aquí!', '¡Ven, Mango!', '¡Ven!', '¡Ven acá!', '¡Mango, ven!'], pt: ['Vem aqui, Mango!', 'Mango, vem aqui!', 'Vem, Mango!', 'Vem!', 'Vem cá!', 'Vem cá, Mango!'], de: ['Komm her, Mango!', 'Mango, komm her!', 'Komm, Mango!', 'Komm!', 'Komm hierher!'],
        zh: ['[芒果|Máng guǒ] ， [过来|guò lái] ！', '[过来|guò lái] ， [芒果|Máng guǒ] ！', '[快|kuài] [过来|guò lái] ！'], ja: ['おいで 、 マンゴー ！', 'マンゴー 、 おいで ！', 'こっち に おいで ！'] },
      keys: { es: [['ven', 'vente']], pt: [['vem', 'venha']], de: [['komm', 'komme']], zh: [['guolai']], ja: [['oide', 'kocchi']] } } },
    talk: {
      gael: st => (st === 0 ? async () => { HQ.lock(true); await say('gael', Q3.lines.offer); await HQ.demo(P('gael'), Q3.lines.demo, Q3.tasks.come); await say('gael', Q3.lines.go); HQ.setStage('hq.cat', 1); }
        : st === 1 ? () => say('gael', Q3.lines.wait)
        : st === 2 ? async () => { HQ.lock(true); await HQ.me('She came down! She’s upstairs, purring.'); await say('gael', Q3.lines.thanks); HQ.setStage('hq.cat', 3); HQ.reward(Q3, (G().state.hq.grades || {})['hq.cat:g'] || 'B'); } : null),
      mango: st => (st === 1 ? async () => {
        HQ.lock(true);
        const g = await ask(Q3.tasks.come, { title: 'Call Mango down: “Come here!”', icon: 'cat' });
        if (!g) return;
        saveG(Q3, g);
        const c = P('mango'), Y = G().sim.you, X0 = INTERIORS._.X0, Z0 = INTERIORS._.Z0;
        if (c) { const p0 = c.P.root.position.clone(), tx = Y.x - X0 + 0.6, tz = Y.z - Z0 - 0.5; Sound.play('jump');
          await STORY.tween(0.7, k => { c.P.root.position.set(p0.x + (tx - p0.x) * k, p0.y * (1 - k) + Math.sin(k * Math.PI) * 0.5, p0.z + (tz - p0.z) * k); c.S.x = c.P.root.position.x; c.S.z = c.P.root.position.z; });
          Sound.play('land', 3); c.S.purr = 3; }
        await HQ.say(c, Q3.lines.mew); HQ.setStage('hq.cat', 2);
      } : null),
    },
    mark: { gael: st => (st === 0 ? '!' : st === 2 ? '◆' : null), mango: st => (st === 1 ? '◆' : null) } });

  // ---- 4. Stone soup (a recipe) · the ingredients, then «¡Qué rico!»
  const SOUP = ['w.stone', 'w.water', 'w.mushroom'];      // (let into the weave before she says them)
  HQ.phrase({ id: 'ph.hq.yum', en: 'Delicious!', es: '¡Qué rico!', pt: 'Que delícia!', de: 'Lecker!', zh: '[真|zhēn] [好喝|hǎo hē] ！', ja: 'おいしい ！', note: 'zh: 好喝 for soup and drinks, 好吃 for food you chew.' });
  const Q4 = HQ.quest({ id: 'hq.soup', home: 'alba-house-16', done: 2, coins: 8, phrase: 'ph.hq.yum',
    title: () => 'Stone soup', who: () => `${n('consuelo')}, the cook in Alba`,
    steps: [{ until: 2, text: () => `Tell ${n('juanito')} what’s in the soup, then taste it`, why: 'Doña Consuelo showed you her grandmother’s recipe: what goes in first, then, and last.', hint: '{mimo} sniffs the pot. Mmm…', at: ['alba-house-16', 'juanito'] }],
    story: () => `${n('consuelo')} cooked her grandmother’s stone soup with you: a {w.stone}, {w.water} and {w.mushroom:pl}.`,
    lines: {
      offer: T('Do you know stone soup? It’s my grandmother’s recipe. Watch!', '¿Conoces la sopa de piedra? Es la receta de mi abuela. ¡Mira!', 'Você conhece a sopa de pedra? É a receita da minha avó. Olha!', 'Kennst du Steinsuppe? Das ist das Rezept meiner Oma. Schau!',
        '[你|nǐ] [知道|zhī dào] [石头|shí tou] [汤|tāng] [吗|ma] ？ [是|shì] [我|wǒ] [奶奶|nǎi nai] [的|de] [食谱|shí pǔ] 。 [你|nǐ] [看|kàn] ！', '[石|いし] の スープ 、 [知|し]って います か ？ [祖母|そぼ] の レシピ です 。 [見|み]て て ！'),
      demo: T('First, a {w.stone}. Then {w.water}. And last, {w.mushroom:pl}. That’s all!', 'Primero, una {w.stone}. Luego, {w.water}. Y al final, {w.mushroom:pl}. ¡Y ya!', 'Primeiro, uma {w.stone}. Depois, {w.water}. E por último, {w.mushroom:pl}. Pronto!', 'Zuerst ein {w.stone}. Dann {w.water}. Und zum Schluss {w.mushroom:pl}. Fertig!',
        '[先|xiān] [放|fàng] [一|yī] [块|kuài] {w.stone} 。 [然后|rán hòu] [加|jiā] {w.water} 。 [最后|zuì hòu] [放|fàng] {w.mushroom} 。 [就|jiù] [好|hǎo] [了|le] ！', 'まず 、 {w.stone} 。 それ から 、 {w.water} 。 [最後|さいご] に 、 {w.mushroom} 。 それ だけ ！'),
      tell: T('Juanito always forgets. Tell him what goes in the soup!', 'Juanito siempre se olvida. ¡Dile qué lleva la sopa!', 'O Juanito sempre esquece. Fala pra ele o que vai na sopa!', 'Juanito vergisst es immer. Sag ihm, was in die Suppe kommt!',
        '[胡安尼托|Hú ān ní tuō] [总是|zǒng shì] [忘|wàng] 。 [你|nǐ] [告诉|gào su] [他|tā] [汤|tāng] [里|lǐ] [放|fàng] [什么|shén me] ！', 'フアニート は いつも [忘|わす]れる の 。 スープ に [何|なに] が [入|はい]る か 、 [教|おし]えて あげて ！'),
      q: T('Grandma’s soup… what’s in it again?', 'La sopa de la abuela… ¿qué lleva?', 'A sopa da vovó… o que vai nela mesmo?', 'Omas Suppe … was kommt da noch mal rein?',
        '[奶奶|nǎi nai] [的|de] [汤|tāng] … [里面|lǐ miàn] [有|yǒu] [什么|shén me] [来着|lái zhe] ？', 'おばあちゃん の スープ … [何|なに] が [入|はい]って る ん だっけ ？'),
      taste: T('A stone in soup? … Wow! Delicious!', '¿Una piedra en la sopa? … ¡Mmm! ¡Qué rico!', 'Uma pedra na sopa? … Hum! Que delícia!', 'Ein Stein in der Suppe? … Mmm! Lecker!',
        '[汤|tāng] [里|lǐ] [放|fàng] [石头|shí tou] ？ … [哇|wā] ！ [真|zhēn] [好喝|hǎo hē] ！', 'スープ に [石|いし] ？ … ん ！ おいしい ！'),
      you: T('Your turn! Taste it. What do you say?', '¡Te toca! Pruébala. ¿Qué dices?', 'Sua vez! Experimenta. O que você acha?', 'Du bist dran! Probier mal. Was sagst du?',
        '[该|gāi] [你|nǐ] [了|le] ！ [尝尝|cháng chang] 。 [怎么样|zěn me yàng] ？', 'あなた の [番|ばん] ！ [味見|あじみ] して 。 どう ？'),
      happy: T('Ha! My grandmother would be proud. Thank you for cooking with me!', '¡Ja! Mi abuela estaría orgullosa. ¡Gracias por cocinar conmigo!', 'Rá! A minha avó ia ficar orgulhosa. Obrigada por cozinhar comigo!', 'Ha! Meine Oma wäre stolz. Danke, dass du mit mir gekocht hast!',
        '[哈|hā] ！ [我|wǒ] [奶奶|nǎi nai] [一定|yī dìng] [会|huì] [很|hěn] [骄傲|jiāo ào] 。 [谢谢|xiè xie] [你|nǐ] [陪|péi] [我|wǒ] [做饭|zuò fàn] ！', 'ふふ ！ [祖母|そぼ] も [喜|よろこ]んで いる でしょう 。 いっしょ に [作|つく]って くれて 、 ありがとう ！'),
    },
    tasks: {
      soup: { en: 'a stone, water and mushrooms', keyGrade: 'A', model: { es: 'Una piedra, agua y hongos.', pt: 'Uma pedra, água e cogumelos.', de: 'Ein Stein, Wasser und Pilze.', zh: '[石头|shí tou] 、 [水|shuǐ] [和|hé] [蘑菇|mó gu] 。', ja: '[石|いし] と [水|みず] と きのこ 。' },
        ok: { es: ['Piedra, agua y hongos', 'Lleva una piedra, agua y hongos', 'Una piedra, agua y setas'], pt: ['Pedra, água e cogumelos', 'Leva uma pedra, água e cogumelos'], de: ['Stein, Wasser und Pilze', 'Ein Stein, Wasser und Pilze!'], zh: ['[石头|shí tou] ， [水|shuǐ] ， [蘑菇|mó gu] 。', '[有|yǒu] [石头|shí tou] 、 [水|shuǐ] [和|hé] [蘑菇|mó gu] 。'], ja: ['[石|いし] 、 [水|みず] 、 きのこ 。', '[石|いし] と [水|みず] と きのこ です 。'] },
        keys: { es: [['piedra'], ['agua'], ['hongos', 'hongo', 'setas', 'seta']], pt: [['pedra'], ['agua'], ['cogumelos', 'cogumelo']], de: [['stein'], ['wasser'], ['pilze', 'pilz']], zh: [['shitou'], ['shui'], ['mogu']], ja: [['ishi'], ['mizu'], ['kinoko']] } },
      yum: { en: 'Delicious!', model: { es: '¡Qué rico!', pt: 'Que delícia!', de: 'Lecker!', zh: '[真|zhēn] [好喝|hǎo hē] ！', ja: 'おいしい ！' },
        ok: { es: ['¡Qué rica!', '¡Está rico!', '¡Muy rico!', '¡Qué rica está la sopa!', '¡Delicioso!', '¡Riquísimo!', '¡Qué rico está!'], pt: ['Que gostoso!', 'Delícia!', 'Muito bom!', 'Que delícia de sopa!', 'Que delícia!'], de: ['Sehr lecker!', 'Das ist lecker!', 'Lecker, lecker!', 'Mmm, lecker!', 'Die Suppe ist lecker!'],
          zh: ['[好喝|hǎo hē] ！', '[很|hěn] [好喝|hǎo hē] ！', '[真|zhēn] [好吃|hǎo chī] ！', '[太|tài] [好喝|hǎo hē] [了|le] ！'], ja: ['おいしい です ！', 'すごく おいしい ！', 'おいしい です ね ！'] },
        keys: { es: [['rico', 'rica', 'delicioso', 'riquisimo', 'sabroso']], pt: [['delicia', 'gostoso', 'gostosa']], de: [['lecker']], zh: [['haohe', 'haochi']], ja: [['oishii', 'oishi', 'umai']] } },
    },
    talk: {
      consuelo: st => (st === 0 ? async () => { HQ.lock(true); await say('consuelo', Q4.lines.offer); await HQ.demo(P('consuelo'), Q4.lines.demo, SOUP); await say('consuelo', Q4.lines.tell); HQ.setStage('hq.soup', 1); }
        : st === 1 ? async () => { await HQ.demo(P('consuelo'), Q4.lines.demo, SOUP); await say('consuelo', Q4.lines.tell); } : null),
      juanito: st => (st === 1 ? async () => {
        HQ.lock(true); await say('juanito', Q4.lines.q);
        const g1 = await ask(Q4.tasks.soup, { title: `What’s in the soup? Tell ${n('juanito')}.`, icon: 'soup' });
        if (!g1) return;
        await HQ.demo(P('juanito'), Q4.lines.taste, Q4.tasks.yum); await say('consuelo', Q4.lines.you);
        const g2 = await ask(Q4.tasks.yum, { title: `Taste it, and tell ${n('consuelo')}: it’s delicious!`, icon: 'soup' });
        if (!g2) { await say('consuelo', COMMON.later); return; }
        await say('consuelo', Q4.lines.happy); HQ.setStage('hq.soup', 2); HQ.reward(Q4, worse(g1, g2));
      } : null),
    },
    mark: { consuelo: st => (st === 0 ? '!' : null), juanito: st => (st === 1 ? '◆' : null) } });

  // ---- 5. Coco won't sleep (a favor) · «¡Buenas noches!»
  HQ.phrase({ id: 'ph.hq.night', en: 'Good night!', es: '¡Buenas noches!', pt: 'Boa noite!', de: 'Gute Nacht!', zh: '[晚安|wǎn ān] ！', ja: 'おやすみなさい ！', note: 'es / pt also mean “good evening”. ja to family: «おやすみ».' });
  const Q5 = HQ.quest({ id: 'hq.night', home: 'alba-house-04', done: 3, coins: 6, phrase: 'ph.hq.night',
    title: () => 'Coco won’t sleep', who: () => `${n('martin')}, a young dad in Alba`,
    steps: [{ until: 2, text: () => 'Say good night to Coco, upstairs', why: 'Martín can’t put the baby down, and Coco only sleeps when someone says good night.', hint: '{mimo} tiptoes toward the stairs.', at: ['alba-house-04'] },
      { until: 3, text: () => `Tell ${n('martin')} that Coco is asleep`, why: 'He’s downstairs, rocking the baby.', hint: '{mimo} tiptoes back down.', at: ['alba-house-04', 'martin'] }],
    story: () => 'Coco, the little dinosaur upstairs, wouldn’t go to sleep. You said good night, and he was asleep before you reached the stairs.',
    lines: {
      offer: T('The baby is asleep at last. But listen… Coco is still awake upstairs.', 'Por fin se durmió el bebé. Pero escucha… Coco sigue despierto arriba.', 'O bebê finalmente dormiu. Mas escuta… o Coco ainda tá acordado lá em cima.', 'Das Baby schläft endlich. Aber hör mal … Coco ist oben immer noch wach.',
        '[宝宝|bǎo bao] [终于|zhōng yú] [睡着|shuì zháo] [了|le] 。 [可是|kě shì] [你|nǐ] [听|tīng] … [可可|Kě kě] [还|hái] [在|zài] [楼上|lóu shàng] [没|méi] [睡|shuì] 。', '[赤|あか]ちゃん が やっと [寝|ね]ました 。 でも [聞|き]いて … ココ が [二階|にかい] で まだ [起|お]きて います 。'),
      demo: T('Every night I say: “Good night, my love.” Then he sleeps. Like magic.', 'Cada noche le digo: «Buenas noches, mi amor.» Y se duerme. Como magia.', 'Toda noite eu digo: «Boa noite, meu amor.» E ele dorme. Que nem mágica.', 'Jeden Abend sage ich: „Gute Nacht, mein Schatz.“ Dann schläft er. Wie Zauberei.',
        '[每天|měi tiān] [晚上|wǎn shang] [我|wǒ] [都|dōu] [说|shuō] ： “ [晚安|wǎn ān] ， [宝贝|bǎo bèi] 。 ” [他|tā] [就|jiù] [睡着|shuì zháo] [了|le] 。 [像|xiàng] [魔法|mó fǎ] [一样|yī yàng] 。', '[毎晩|まいばん] 、 「 おやすみなさい 、 いい [子|こ] 。 」 と [言|い]います 。 する と [寝|ね]る ん です 。 [魔法|まほう] みたい に 。'),
      please: T('But I can’t put the baby down. Could you go up and say good night to Coco?', 'Pero no puedo soltar al bebé. ¿Puedes subir y darle las buenas noches a Coco?', 'Mas eu não posso largar o bebê. Você pode subir e dar boa noite pro Coco?', 'Aber ich kann das Baby nicht hinlegen. Kannst du hochgehen und Coco gute Nacht sagen?',
        '[可是|kě shì] [我|wǒ] [放不下|fàng bù xià] [宝宝|bǎo bao] 。 [你|nǐ] [能|néng] [上楼|shàng lóu] [跟|gēn] [可可|Kě kě] [说|shuō] [晚安|wǎn ān] [吗|ma] ？', 'でも 、 [赤|あか]ちゃん を [置|お]けない ん です 。 [二階|にかい] で ココ に 「 おやすみなさい 」 って [言|い]って くれます か ？'),
      wait: T('Is he still up? I can hear him roaring…', '¿Sigue despierto? Lo oigo rugir…', 'Ele ainda tá acordado? Dá pra ouvir ele rugindo…', 'Ist er noch wach? Ich höre ihn brüllen …',
        '[他|tā] [还|hái] [醒|xǐng] [着|zhe] [吗|ma] ？ [我|wǒ] [听见|tīng jiàn] [他|tā] [在|zài] [吼|hǒu] …', 'まだ [起|お]きて る ？ ガオー って [聞|き]こえます …'),
      awake: T('I’m not sleepy! … Okay, a little. Just a little.', '¡No tengo sueño! … Bueno, un poquito. Solo un poquito.', 'Eu não tô com sono! … Tá bom, um pouquinho. Só um pouquinho.', 'Ich bin nicht müde! … Na gut, ein bisschen. Nur ein bisschen.',
        '[我|wǒ] [不|bù] [困|kùn] ！ … [好|hǎo] [吧|ba] ， [有|yǒu] [一点|yī diǎn] 。 [就|jiù] [一点|yī diǎn] 。', 'ねむく ない ！ … まあ 、 ちょっと 。 ちょっと だけ 。'),
      sleep: T('Good night… dinosaur… Zzz…', 'Buenas noches… dinosaurio… Zzz…', 'Boa noite… dinossauro… Zzz…', 'Gute Nacht … Dinosaurier … Zzz …',
        '[晚安|wǎn ān] … [恐龙|kǒng lóng] … [呼|hū] [呼|hū] …', 'おやすみ … [恐竜|きょうりゅう] … すう すう …'),
      zzz: T('Zzz… (Coco is fast asleep.)', 'Zzz… (Coco duerme profundamente.)', 'Zzz… (O Coco está dormindo pesado.)', 'Zzz … (Coco schläft tief und fest.)',
        '[呼|hū] [呼|hū] … （ [可可|Kě kě] [睡|shuì] [得|de] [很|hěn] [香|xiāng] 。 ）', 'すう すう … （ ココ は ぐっすり [寝|ね]て います 。 ）'),
      thanks: T('He’s asleep? Really? You’re a treasure. Thank you!', '¿Se durmió? ¿De verdad? ¡Eres un sol! ¡Gracias!', 'Ele dormiu? Sério? Você é um anjo! Obrigado!', 'Er schläft? Wirklich? Du bist ein Schatz! Danke!',
        '[他|tā] [睡着|shuì zháo] [了|le] ？ [真|zhēn] [的|de] [吗|ma] ？ [你|nǐ] [真|zhēn] [是|shì] [太|tài] [好|hǎo] [了|le] ！ [谢谢|xiè xie] ！', '[寝|ね]ました ？ [本当|ほんとう] に ？ [本当|ほんとう] に [助|たす]かりました ！ ありがとう ！'),
    },
    tasks: { night: { en: 'Good night!', model: { es: '¡Buenas noches!', pt: 'Boa noite!', de: 'Gute Nacht!', zh: '[晚安|wǎn ān] ！', ja: 'おやすみなさい ！' },
      ok: { es: ['¡Buenas noches, Coco!', 'Buenas noches, que descanses', '¡Buenas noches, dinosaurio!'], pt: ['Boa noite, Coco!', 'Boa noite, dinossauro!'], de: ['Gute Nacht, Coco!', 'Schlaf gut!', 'Gute Nacht, schlaf gut!', 'Gute Nacht, kleiner Dinosaurier!'],
        zh: ['[晚安|wǎn ān] ， [可可|Kě kě] ！', '[可可|Kě kě] ， [晚安|wǎn ān] ！'], ja: ['おやすみ ！', 'おやすみ 、 ココ ！', 'おやすみなさい 、 ココ ！'] },
      keys: { es: [['noches']], pt: [['noite']], de: [['nacht', 'schlaf']], zh: [['wanan']], ja: [['oyasumi']] } } },
    talk: {
      martin: st => (st === 0 ? async () => { HQ.lock(true); await say('martin', Q5.lines.offer); await HQ.demo(P('martin'), Q5.lines.demo, Q5.tasks.night); await say('martin', Q5.lines.please); HQ.setStage('hq.night', 1); }
        : st === 1 ? () => say('martin', Q5.lines.wait)
        : st === 2 ? async () => { HQ.lock(true); await HQ.me('Coco is asleep. Like magic!'); await say('martin', Q5.lines.thanks); HQ.setStage('hq.night', 3); HQ.reward(Q5, (G().state.hq.grades || {})['hq.night:g'] || 'B'); } : null),
      coco: st => (st === 1 ? async () => {
        HQ.lock(true); await say('coco', Q5.lines.awake);
        const g = await ask(Q5.tasks.night, { title: 'Say good night to Coco', icon: 'bed' });
        if (!g) return;
        saveG(Q5, g); await HQ.demo(P('coco'), Q5.lines.sleep, Q5.tasks.night); HQ.setStage('hq.night', 2); await fadeRefresh('alba-house-04');
      } : st >= 2 ? () => say('coco', Q5.lines.zzz) : null),
    },
    mark: { martin: st => (st === 0 ? '!' : st === 2 ? '◆' : null), coco: st => (st === 1 ? '◆' : null) } });

  // ---- 6. A coat for Trufa (a delivery between neighbors) · «¡Es para ti!»
  HQ.phrase({ id: 'ph.hq.gift', en: 'It’s for you!', es: '¡Es para ti!', pt: 'É para você!', de: 'Das ist für dich!', zh: '[这|zhè] [是|shì] [给|gěi] [你|nǐ] [的|de] ！', ja: 'これ 、 どうぞ ！', note: 'Polite, to an older person: es «¡Es para usted!», pt «É para a senhora / o senhor!», de «Das ist für Sie!», zh «给您».' });
  HQ.keep({ id: 'k.hqCoat', en: 'a little coat for Trufa', es: 'abriguito', pt: 'casaquinho', de: 'Hundemantel', zh: '[小|xiǎo] [外套|wài tào]', ja: '[小|ちい]さな コート', g: { es: 'm', pt: 'm', de: 'm' }, icon: 'gift' });
  const Q6 = HQ.quest({ id: 'hq.coat', home: 'alba-house-20', homes: { olga: 'alba-house-20', josefa: 'alba-house-24' }, done: 2, coins: 7, phrase: 'ph.hq.gift',
    title: () => 'A coat for Trufa', who: () => `${n('olga')}, the seamstress in Alba`,
    steps: [{ until: 2, text: () => `Take the coat to ${n('josefa')}, and give it to her`, why: 'Olga made it for Trufa, her little dog. She lives on the west side of Alba, in the house full of dog photos.', hint: '{mimo} points west.', at: ['alba-house-24', 'josefa'] }],
    story: () => 'Olga sewed a little coat for Trufa the dog. You took it over, and now Trufa wears it everywhere.',
    lines: {
      offer: T('Look what I made! A little coat for Trufa, Doña Josefa’s dog. Winter is coming.', '¡Mira lo que hice! Un abriguito para Trufa, la perrita de doña Josefa. Ya viene el invierno.', 'Olha o que eu fiz! Um casaquinho pra Trufa, a cachorrinha da dona Josefa. O inverno tá chegando.', 'Schau, was ich gemacht habe! Ein Mäntelchen für Trufa, den Hund von Oma Josefa. Der Winter kommt.',
        '[你|nǐ] [看|kàn] [我|wǒ] [做|zuò] [了|le] [什么|shén me] ！ [给|gěi] [松露|Sōng lù] [的|de] [小|xiǎo] [外套|wài tào] 。 [松露|Sōng lù] [是|shì] [何塞法|Hé sè fǎ] [奶奶|nǎi nai] [的|de] [狗|gǒu] 。 [冬天|dōng tiān] [快|kuài] [到|dào] [了|le] 。', '[見|み]て ！ トリュフ の [小|ちい]さな コート 。 ホセファ さん の [犬|いぬ] です 。 もう すぐ [冬|ふゆ] だ から 。'),
      demo: T('When you give a gift, you say: “It’s for you!” Like this: “Trufa, it’s for you!”', 'Cuando das un regalo, dices: «¡Es para ti!» Así: «¡Trufa, es para ti!»', 'Quando a gente dá um presente, a gente diz: «É pra você!» Assim: «Trufa, é pra você!»', 'Wenn man etwas schenkt, sagt man: „Das ist für dich!“ So: „Trufa, das ist für dich!“',
        '[送|sòng] [礼物|lǐ wù] [的|de] [时候|shí hou] [要|yào] [说|shuō] ： “ [这|zhè] [是|shì] [给|gěi] [你|nǐ] [的|de] ！ ” [像|xiàng] [这样|zhè yàng] ： “ [松露|Sōng lù] ， [这|zhè] [是|shì] [给|gěi] [你|nǐ] [的|de] ！ ”', 'プレゼント を [渡|わた]す とき は 、 「 これ 、 どうぞ ！ 」 と [言|い]います 。 こんな ふう に ： 「 トリュフ 、 これ 、 どうぞ ！ 」'),
      please: T('My machine is busy. Can you take it to her? She lives on the west street.', 'Mi máquina no para. ¿Se lo llevas tú? Vive en la calle del oeste.', 'A minha máquina não para. Você leva pra ela? Ela mora na rua do oeste.', 'Meine Maschine steht nicht still. Bringst du ihn ihr? Sie wohnt an der Weststraße.',
        '[我|wǒ] [的|de] [缝纫机|féng rèn jī] [停|tíng] [不|bù] [下来|xià lái] 。 [你|nǐ] [能|néng] [帮|bāng] [我|wǒ] [送|sòng] [去|qù] [吗|ma] ？ [她|tā] [住|zhù] [在|zài] [西|xī] [街|jiē] 。', 'ミシン が [忙|いそが]しくて 。 [届|とど]けて もらえます か ？ [西|にし] の [通|とお]り に [住|す]んで います 。'),
      wait: T('Did you take the coat to Trufa yet? West street!', '¿Ya le llevaste el abrigo a Trufa? ¡Calle del oeste!', 'Já levou o casaco pra Trufa? Rua do oeste!', 'Hast du Trufa den Mantel schon gebracht? Weststraße!',
        '[外套|wài tào] [送|sòng] [给|gěi] [松露|Sōng lù] [了|le] [吗|ma] ？ [在|zài] [西|xī] [街|jiē] ！', 'トリュフ に コート を [届|とど]けた ？ [西|にし] の [通|とお]り です よ ！'),
      happy: T('A coat? For my Trufa? Olga made it? Oh, look, it fits! Thank you!', '¿Un abrigo? ¿Para mi Trufa? ¿Lo hizo Olga? ¡Ay, mira, le queda perfecto! ¡Gracias!', 'Um casaco? Pra minha Trufa? A Olga que fez? Ai, olha, serviu direitinho! Obrigada!', 'Ein Mantel? Für meine Trufa? Hat Olga ihn gemacht? Oh, schau, er passt! Danke!',
        '[外套|wài tào] ？ [给|gěi] [我|wǒ] [的|de] [松露|Sōng lù] ？ [是|shì] [奥尔加|Ào ěr jiā] [做|zuò] [的|de] ？ [哎呀|āi yā] ， [你|nǐ] [看|kàn] ， [正|zhèng] [合适|hé shì] ！ [谢谢|xiè xie] ！', 'コート ？ うち の トリュフ に ？ オルガ さん が ？ まあ 、 ぴったり ！ ありがとう ！'),
      after: T('Trufa won’t take the coat off. She even sleeps in it!', 'Trufa no se quiere quitar el abrigo. ¡Hasta duerme con él!', 'A Trufa não quer tirar o casaco. Até dorme com ele!', 'Trufa will den Mantel gar nicht mehr ausziehen. Sie schläft sogar darin!',
        '[松露|Sōng lù] [不|bù] [肯|kěn] [脱|tuō] [外套|wài tào] 。 [连|lián] [睡觉|shuì jiào] [都|dōu] [穿|chuān] [着|zhe] ！', 'トリュフ は コート を [脱|ぬ]ぎたがらない の 。 [寝|ね]る とき も [着|き]て います ！'),
    },
    tasks: { gift: { en: 'It’s for you!', model: { es: '¡Es para ti!', pt: 'É para você!', de: 'Das ist für dich!', zh: '[这|zhè] [是|shì] [给|gěi] [你|nǐ] [的|de] ！', ja: 'これ 、 どうぞ ！' },
      ok: { es: ['¡Es para usted!', '¡Es para Trufa!', 'Esto es para ti', 'Es para tu perrita', '¡Es para ella!', 'Esto es para usted'], pt: ['É pra você!', 'É para a senhora!', 'É pra senhora!', 'É para a Trufa!', 'É pra Trufa!', 'Isto é pra você!'], de: ['Das ist für Sie!', 'Das ist für Trufa!', 'Für dich!', 'Für Trufa!', 'Für Sie!', 'Der ist für dich!', 'Der ist für Trufa!'],
        zh: ['[这|zhè] [是|shì] [给|gěi] [您|nín] [的|de] ！', '[给|gěi] [你|nǐ] ！', '[这|zhè] [是|shì] [给|gěi] [松露|Sōng lù] [的|de] ！'], ja: ['どうぞ ！', 'これ 、 トリュフ に ！', 'はい 、 どうぞ ！', 'これ 、 どうぞ 。'] },
      keys: { es: [['para']], pt: [['para', 'pra']], de: [['fur']], zh: [['gei']], ja: [['douzo', 'dozo']] } } },
    talk: {
      olga: st => (st === 0 ? async () => { HQ.lock(true); await say('olga', Q6.lines.offer); await HQ.demo(P('olga'), Q6.lines.demo, Q6.tasks.gift); await say('olga', Q6.lines.please); HQ.give('k.hqCoat'); HQ.setStage('hq.coat', 1); UI.toast(`🎁 ${HQ.itemName('k.hqCoat')} (in your bag)`); }
        : st === 1 ? () => say('olga', Q6.lines.wait) : null),
      josefa: st => (st === 1 ? async () => {
        HQ.lock(true); await HQ.me('Olga, the seamstress, made something for Trufa…');
        const g = await ask(Q6.tasks.gift, { title: `Give ${n('josefa')} the coat: “It’s for you!”`, icon: 'gift' });
        if (!g) { await say('josefa', COMMON.later); return; }
        HQ.take('k.hqCoat'); await say('josefa', Q6.lines.happy); HQ.setStage('hq.coat', 2); HQ.reward(Q6, g); await fadeRefresh('alba-house-24');
      } : st >= 2 && Math.random() < 0.5 ? () => say('josefa', Q6.lines.after) : null),
    },
    mark: { olga: st => (st === 0 ? '!' : null), josefa: st => (st === 1 ? '◆' : null) } });

  // ---- 7. The painter's colors (a little puzzle) · amarillo, azul, roja
  HQ.keep({ id: 'k.hqPainting', en: 'Silvia’s little painting of the lake', es: 'cuadrito del lago', pt: 'quadrinho do lago', de: 'kleines Seebild', zh: '[湖|hú] [的|de] [小|xiǎo] [画|huà]', ja: '[湖|みずうみ] の [小|ちい]さな [絵|え]', g: { es: 'm', pt: 'm', de: 'n' }, icon: 'photo' });
  const Q7 = HQ.quest({ id: 'hq.colors', home: 'alba-house-03', done: 2, coins: 10, keep: 'k.hqPainting',
    title: () => 'Colors for a painter', who: () => `${n('silvia')}, the painter in Alba`,
    steps: [{ until: 2, text: () => `Tell ${n('silvia')} the colors: the sun, the water, the flower`, why: 'Her paint jars have no labels, and her eyes are tired. She told you the colors while she painted.', hint: '{mimo} looks at the paint pots, then at you.', at: ['alba-house-03', 'silvia'] }],
    story: () => 'Silvia was painting the lake at sunset, but couldn’t tell her paints apart. You told her the colors, and she gave you a little painting.',
    lines: {
      offer: T('Oh, perfect timing! I’m painting the lake at sunset… but I can’t tell my paints apart. They have no labels!', '¡Ay, justo a tiempo! Estoy pintando el lago al atardecer… pero no distingo mis pinturas. ¡No tienen etiqueta!', 'Ai, chegou na hora certa! Eu tô pintando o lago no pôr do sol… mas não sei qual tinta é qual. Elas não têm etiqueta!', 'Oh, genau richtig! Ich male den See im Abendrot … aber ich kann meine Farben nicht unterscheiden. Sie haben keine Etiketten!',
        '[哎|āi] ， [你|nǐ] [来|lái] [得|de] [正|zhèng] [好|hǎo] ！ [我|wǒ] [在|zài] [画|huà] [日落|rì luò] [时|shí] [的|de] [湖|hú] … [可是|kě shì] [我|wǒ] [分|fēn] [不|bù] [清|qīng] [颜料|yán liào] 。 [上面|shàng miàn] [没有|méi yǒu] [标签|biāo qiān] ！', 'ちょうど よかった ！ [夕日|ゆうひ] の [湖|みずうみ] を [描|か]いて いる ん です けど … [絵|え]の[具|ぐ] の [区別|くべつ] が つかなくて 。 ラベル が ない の ！'),
      demo: T('The sun is yellow. The water is blue. And the flower is red. Easy… if you can see!', 'El sol es amarillo. El agua es azul. Y la flor es roja. Fácil… ¡si ves bien!', 'O sol é amarelo. A água é azul. E a flor é vermelha. Fácil… se você enxerga bem!', 'Die Sonne ist gelb. Das Wasser ist blau. Und die Blume ist rot. Ganz einfach … wenn man gut sieht!',
        '[太阳|tài yáng] [是|shì] [黄色|huáng sè] [的|de] 。 [水|shuǐ] [是|shì] [蓝色|lán sè] [的|de] 。 [花|huā] [是|shì] [红色|hóng sè] [的|de] 。 [很|hěn] [简单|jiǎn dān] … [如果|rú guǒ] [看得清|kàn de qīng] [的话|de huà] ！', '[太陽|たいよう] は [黄色|きいろ] 。 [水|みず] は [青|あお] 。 [花|はな] は [赤|あか] 。 [簡単|かんたん] … よく [見|み]えれば ね ！'),
      q1: T('My eyes are so tired. Help me! What color is the sun?', 'Tengo los ojos cansados. ¡Ayúdame! ¿De qué color es el sol?', 'Os meus olhos estão cansados. Me ajuda! De que cor é o sol?', 'Meine Augen sind so müde. Hilf mir! Welche Farbe hat die Sonne?',
        '[我|wǒ] [的|de] [眼睛|yǎn jing] [好|hǎo] [累|lèi] 。 [帮帮|bāng bang] [我|wǒ] ！ [太阳|tài yáng] [是|shì] [什么|shén me] [颜色|yán sè] [的|de] ？', '[目|め] が [疲|つか]れて 。 [手伝|てつだ]って ！ [太陽|たいよう] は [何色|なにいろ] ？'),
      q2: T('Good! And the water?', '¡Bien! ¿Y el agua?', 'Isso! E a água?', 'Gut! Und das Wasser?', '[好|hǎo] ！ [那|nà] [水|shuǐ] [呢|ne] ？', 'いい ね ！ [水|みず] は ？'),
      q3: T('And the flower by the shore?', '¿Y la flor de la orilla?', 'E a flor da beira do lago?', 'Und die Blume am Ufer?', '[那|nà] [岸边|àn biān] [的|de] [花|huā] [呢|ne] ？', '[岸|きし] の [花|はな] は ？'),
      done: T('There! The lake at sunset. And this little one is for you!', '¡Listo! El lago al atardecer. ¡Y este chiquito es para ti!', 'Pronto! O lago no pôr do sol. E este pequenininho é pra você!', 'Fertig! Der See im Abendrot. Und das kleine hier ist für dich!',
        '[好|hǎo] [了|le] ！ [日落|rì luò] [时|shí] [的|de] [湖|hú] 。 [这|zhè] [张|zhāng] [小|xiǎo] [画|huà] [送|sòng] [给|gěi] [你|nǐ] ！', 'できた ！ [夕日|ゆうひ] の [湖|みずうみ] 。 この [小|ちい]さい [絵|え] は 、 あなた に ！'),
    },
    tasks: {
      sun: { en: 'yellow', keyGrade: 'A', model: { es: 'Amarillo.', pt: 'Amarelo.', de: 'Gelb.', zh: '[黄色|huáng sè] 。', ja: '[黄色|きいろ] 。' }, ok: { es: ['Es amarillo', 'El sol es amarillo'], pt: ['É amarelo', 'O sol é amarelo'], de: ['Die Sonne ist gelb', 'Sie ist gelb', 'Gelb!'], zh: ['[太阳|tài yáng] [是|shì] [黄色|huáng sè] [的|de] 。', '[黄色|huáng sè] [的|de] 。'], ja: ['[黄色|きいろ] です 。', '[太陽|たいよう] は [黄色|きいろ] です 。'] },
        keys: { es: [['amarillo', 'amarilla']], pt: [['amarelo', 'amarela']], de: [['gelb']], zh: [['huang']], ja: [['kiiro']] } },
      water: { en: 'blue', keyGrade: 'A', model: { es: 'Azul.', pt: 'Azul.', de: 'Blau.', zh: '[蓝色|lán sè] 。', ja: '[青|あお] 。' }, ok: { es: ['Es azul', 'El agua es azul'], pt: ['É azul', 'A água é azul'], de: ['Das Wasser ist blau', 'Es ist blau', 'Blau!'], zh: ['[水|shuǐ] [是|shì] [蓝色|lán sè] [的|de] 。', '[蓝色|lán sè] [的|de] 。'], ja: ['[青|あお] です 。', '[水|みず] は [青|あお] です 。', '[青|あお]い です 。'] },
        keys: { es: [['azul']], pt: [['azul']], de: [['blau']], zh: [['lan']], ja: [['ao']] } },
      flower: { en: 'red', keyGrade: 'B', model: { es: 'Roja.', pt: 'Vermelha.', de: 'Rot.', zh: '[红色|hóng sè] 。', ja: '[赤|あか] 。' }, ok: { es: ['Es roja', 'La flor es roja'], pt: ['É vermelha', 'A flor é vermelha'], de: ['Die Blume ist rot', 'Sie ist rot', 'Rot!'], zh: ['[花|huā] [是|shì] [红色|hóng sè] [的|de] 。', '[红色|hóng sè] [的|de] 。'], ja: ['[赤|あか] です 。', '[赤|あか]い です 。', '[花|はな] は [赤|あか] です 。'] },
        keys: { es: [['roja', 'rojo']], pt: [['vermelha', 'vermelho']], de: [['rot']], zh: [['hong']], ja: [['aka']] } },
    },
    talk: {
      silvia: st => (st < 2 ? async () => {
        HQ.lock(true);
        if (st === 0) { await say('silvia', Q7.lines.offer); HQ.setStage('hq.colors', 1); }
        await HQ.demo(P('silvia'), Q7.lines.demo, [['yellow', Q7.tasks.sun], ['blue', Q7.tasks.water], ['red', Q7.tasks.flower]]);
        await say('silvia', Q7.lines.q1); const a = await ask(Q7.tasks.sun, { title: 'What color is the sun?', icon: 'sc_sun' }); if (!a) return;
        await say('silvia', Q7.lines.q2); const b = await ask(Q7.tasks.water, { title: 'What color is the water?', icon: 'water' }); if (!b) return;
        await say('silvia', Q7.lines.q3); const c = await ask(Q7.tasks.flower, { title: 'What color is the flower? (la flor: it’s feminine in Spanish)', icon: 'flower' }); if (!c) return;
        await say('silvia', Q7.lines.done); HQ.setStage('hq.colors', 2); HQ.reward(Q7, worse(worse(a, b), c)); await fadeRefresh('alba-house-03');
      } : null),
    },
    mark: { silvia: st => (st === 0 ? '!' : st === 1 ? '◆' : null) } });

  // ---- 8. The new girl (a favor) · «¿Cómo te llamas?»
  HQ.phrase({ id: 'ph.hq.name', en: 'What’s your name?', es: '¿Cómo te llamas?', pt: 'Como você se chama?', de: 'Wie heißt du?', zh: '[你|nǐ] [叫|jiào] [什么|shén me] [名字|míng zi] ？', ja: 'お[名前|なまえ] は ？', note: 'The answer: es «Me llamo…», pt «Eu me chamo…», de «Ich heiße…», zh «我叫…», ja «…です».' });
  HQ.keep({ id: 'k.hqStar', en: 'a paper star from Valentina', es: 'estrella de papel', pt: 'estrela de papel', de: 'Papierstern', zh: '[纸|zhǐ] [星星|xīng xing]', ja: '[紙|かみ] の [星|ほし]', g: { es: 'f', pt: 'f', de: 'm' }, icon: 'star' });
  const Q8 = HQ.quest({ id: 'hq.name', home: 'alba-house-28', done: 3, coins: 6, phrase: 'ph.hq.name', keep: 'k.hqStar',
    title: () => 'The new girl', who: () => `${n('daniela')}, new in Alba`,
    steps: [{ until: 2, text: () => 'Ask the new girl her name', why: 'Valentina just moved to Alba and hasn’t made a friend yet. Her mom showed you how to ask.', hint: '{mimo} waves at the girl behind the boxes.', at: ['alba-house-28', 'valentina'] }],
    story: () => 'Valentina just moved to Alba and was too shy to say hello. You asked her name, and she gave you her forty-third paper star.',
    lines: {
      hello: T('Hello! I’m Daniela. And you? What’s your name?', '¡Hola! Me llamo Daniela. ¿Y tú? ¿Cómo te llamas?', 'Oi! Eu me chamo Daniela. E você? Como você se chama?', 'Hallo! Ich heiße Daniela. Und du? Wie heißt du?',
        '[你好|nǐ hǎo] ！ [我|wǒ] [叫|jiào] [达妮埃拉|Dá nī āi lā] 。 [你|nǐ] [呢|ne] ？ [你|nǐ] [叫|jiào] [什么|shén me] [名字|míng zi] ？', 'こんにちは ！ ダニエラ です 。 あなた は ？ お[名前|なまえ] は ？'),
      please: T('Valentina is too shy to say hello first. Could you ask her name? Like I just did!', 'Valentina es muy tímida para saludar primero. ¿Le preguntas cómo se llama? ¡Como hice yo!', 'A Valentina é tímida demais pra falar primeiro. Você pergunta como ela se chama? Igual eu fiz!', 'Valentina ist zu schüchtern, um zuerst Hallo zu sagen. Fragst du sie, wie sie heißt? So wie ich eben!',
        '[瓦伦蒂娜|Wǎ lún dì nà] [太|tài] [害羞|hài xiū] ， [不|bù] [敢|gǎn] [先|xiān] [打|dǎ] [招呼|zhāo hu] 。 [你|nǐ] [能|néng] [问|wèn] [问|wen] [她|tā] [叫|jiào] [什么|shén me] [吗|ma] ？ [就|jiù] [像|xiàng] [我|wǒ] [刚才|gāng cái] [那样|nà yàng] ！', 'バレンティナ は [恥|は]ずかしがり で 、 [自分|じぶん] から あいさつ できない の 。 [名前|なまえ] を [聞|き]いて あげて くれる ？ さっき の わたし みたい に ！'),
      name: T('I’m… Valentina. Do you want to see my paper stars? I have forty-two!', 'Me llamo… Valentina. ¿Quieres ver mis estrellas de papel? ¡Tengo cuarenta y dos!', 'Eu me chamo… Valentina. Quer ver as minhas estrelas de papel? Eu tenho quarenta e duas!', 'Ich heiße … Valentina. Willst du meine Papiersterne sehen? Ich habe zweiundvierzig!',
        '[我|wǒ] [叫|jiào] … [瓦伦蒂娜|Wǎ lún dì nà] 。 [你|nǐ] [想|xiǎng] [看|kàn] [我|wǒ] [的|de] [纸|zhǐ] [星星|xīng xing] [吗|ma] ？ [我|wǒ] [有|yǒu] [四十二|sì shí èr] [颗|kē] ！', 'わたし は … バレンティナ 。 [紙|かみ] の [星|ほし] 、 [見|み]たい ？ [四十二個|よんじゅうにこ] ある の ！'),
      star: T('Look! This star is for you. Number forty-three!', '¡Mira! Esta estrella es para ti. ¡La número cuarenta y tres!', 'Olha! Esta estrela é pra você. A número quarenta e três!', 'Schau! Dieser Stern ist für dich. Nummer dreiundvierzig!',
        '[你|nǐ] [看|kàn] ！ [这|zhè] [颗|kē] [星星|xīng xing] [给|gěi] [你|nǐ] 。 [第|dì] [四十三|sì shí sān] [颗|kē] ！', '[見|み]て ！ この [星|ほし] 、 あげる 。 [四十三個目|よんじゅうさんこめ] ！'),
      thanks: T('She’s talking! She never talks to anyone. Thank you, really.', '¡Está hablando! Nunca habla con nadie. Gracias, de verdad.', 'Ela tá falando! Ela nunca fala com ninguém. Obrigada, de verdade.', 'Sie redet! Sie redet sonst mit niemandem. Danke, wirklich.',
        '[她|tā] [在|zài] [说话|shuō huà] ！ [她|tā] [从来|cóng lái] [不|bù] [跟|gēn] [别人|bié rén] [说话|shuō huà] 。 [真|zhēn] [的|de] [谢谢|xiè xie] [你|nǐ] 。', '[話|はな]して る ！ だれ と も [話|はな]さない のに 。 [本当|ほんとう] に ありがとう 。'),
    },
    tasks: { name: { en: 'What’s your name?', model: { es: '¿Cómo te llamas?', pt: 'Como você se chama?', de: 'Wie heißt du?', zh: '[你|nǐ] [叫|jiào] [什么|shén me] [名字|míng zi] ？', ja: 'お[名前|なまえ] は ？' },
      ok: { es: ['¿Cómo te llamas tú?', '¿Cuál es tu nombre?', 'Hola, ¿cómo te llamas?', '¿Y tú cómo te llamas?'], pt: ['Qual é o seu nome?', 'Como é o seu nome?', 'Oi, como você se chama?', 'Qual o seu nome?', 'Como te chamas?'], de: ['Wie heißt du denn?', 'Hallo, wie heißt du?', 'Wie ist dein Name?'],
        zh: ['[你|nǐ] [叫|jiào] [什么|shén me] ？', '[你|nǐ] [的|de] [名字|míng zi] [是|shì] [什么|shén me] ？', '[你好|nǐ hǎo] ， [你|nǐ] [叫|jiào] [什么|shén me] [名字|míng zi] ？'], ja: ['[名前|なまえ] は ？', '[名前|なまえ] は [何|なん] です か ？', 'お[名前|なまえ] は [何|なん] です か ？', 'お[名前|なまえ] は なんて いう の ？'] },
      keys: { es: [['llamas', 'nombre']], pt: [['chama', 'nome']], de: [['heisst', 'heist', 'name']], zh: [['jiao', 'mingzi']], ja: [['namae']] } } },
    talk: {
      daniela: st => (st === 0 ? async () => { HQ.lock(true); await HQ.demo(P('daniela'), Q8.lines.hello, Q8.tasks.name); await HQ.me('Nice to meet you! (You tell her your name.)'); await say('daniela', Q8.lines.please); HQ.setStage('hq.name', 1); }
        : st === 1 ? () => say('daniela', Q8.lines.please)
        : st === 2 ? async () => { await say('daniela', Q8.lines.thanks); HQ.setStage('hq.name', 3); } : null),
      valentina: st => (st === 1 ? async () => {
        HQ.lock(true);
        const g = await ask(Q8.tasks.name, { title: 'Ask the new girl her name', icon: 'wave' });
        if (!g) return;
        await say('valentina', Q8.lines.name); await say('valentina', Q8.lines.star); HQ.setStage('hq.name', 2); HQ.reward(Q8, g);
      } : null),
    },
    mark: { daniela: st => (st === 0 ? '!' : st === 2 ? '◆' : null), valentina: st => (st === 1 ? '◆' : null) } });
})();
