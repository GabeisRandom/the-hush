'use strict';
// Who lives in Molinar's houses (DESIGN.md 16, playtest 4: "explore the house and its UNIQUE residents"). One profile per
// house, like Alba's (interiors_alba.js): its theme (interiors_rooms.js), its people (a name, a look, a personality,
// lines in every language with the English, said through the weave) and its pets. Then Molinar's side quests
// (interiors_quests.js is their engine): the new baby, the cuckoo clocks, the puppy, the cold, the bread, the trip.
(() => {
  if (typeof INTERIORS === 'undefined' || !INTERIORS.home) return;
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const H = (id, p) => INTERIORS.home(id, p);
  const P = (id, name, role, at, look, lines, o) => Object.assign({ id, name, role, at, look, lines }, o || {});
  const PET = (id, kind, name, color, at, o) => Object.assign({ id, kind, name, color, at }, o || {});
  const st = q => (typeof HQ !== 'undefined' && HQ ? HQ.stage(q) : 0);
  // names said the zh / ja way (for CJK.md's houses table)
  INTERIORS.names({ Teodoro: ['[特奥多罗|Tè ào duō luó]', 'テオドロ'], Clementina: ['[克莱门蒂娜|Kè lái mén dì nà]', 'クレメンティーナ'], Pura: ['[普拉|Pǔ lā]', 'プーラ'],
    'Joaquín': ['[华金|Huá jīn]', 'ホアキン'], Benito: ['[贝尼托|Bèi ní tuō]', 'ベニート'] });

  // 01 the new parents, and Paz, two weeks old (their quest: congratulations, with Gloria's blanket)
  H('molinar-house-01', { theme: 'newParents', people: [
    P('raquel', 'Raquel', 'woman', 'rock', { skin: '#e6b48c', hair: '#3a2b26', hairdo: 'long', dress: '#8fb0d9' }, [
      T('Shh… she just fell asleep. Come in, but on tiptoe!', '¡Shh! Se acaba de dormir. Pasa, pero de puntillas.', 'Shh… ela acabou de dormir. Entra, mas na pontinha dos pés!', 'Pst … sie ist gerade eingeschlafen. Komm rein, aber auf Zehenspitzen!',
        '[嘘|xū] … [她|tā] [刚|gāng] [睡着|shuì zháo] 。 [进来|jìn lái] [吧|ba] ， [不过|bù guò] [脚步|jiǎo bù] [要|yào] [轻|qīng] [一点|yī diǎn] ！', 'しー … [今|いま] [寝|ね]た ところ な の 。 どうぞ 、 でも そっと ね ！'),
      T('The neighbors bring something every day: a {w.cake}, flowers, tiny socks…', 'Los vecinos traen algo todos los días: un {w.cake}, flores, calcetines chiquititos…', 'Os vizinhos trazem alguma coisa todo dia: um {w.cake}, flores, meinhas pequenininhas…', 'Die Nachbarn bringen jeden Tag etwas: einen {w.cake}, Blumen, winzige Söckchen …',
        '[邻居|lín jū] [们|men] [每天|měi tiān] [都|dōu] [送|sòng] [东西|dōng xi] [来|lái] ： {w.cake} 、 [花|huā] 、 [小小|xiǎo xiǎo] [的|de] [袜子|wà zi] …', '[近所|きんじょ] の [人|ひと] が [毎日|まいにち] [何|なに]か [持|も]って きて くれる の 。 {w.cake} 、 [花|はな] 、 [小|ちい]さな くつした …'),
      T('We haven’t slept in a week. But look at her. Worth it!', 'Hace una semana que no dormimos. Pero mírala. ¡Vale la pena!', 'Faz uma semana que a gente não dorme. Mas olha pra ela. Vale a pena!', 'Wir haben seit einer Woche nicht geschlafen. Aber sieh sie dir an. Das ist es wert!',
        '[我们|wǒ men] [一|yī] [个|gè] [星期|xīng qī] [没|méi] [睡好|shuì hǎo] [了|le] 。 [可是|kě shì] [你|nǐ] [看|kàn] [她|tā] 。 [值得|zhí de] ！', '[一週間|いっしゅうかん] 、 ちゃんと [寝|ね]て ない の 。 でも [見|み]て 、 この [子|こ] 。 それ でも しあわせ ！'),
    ], { job: 'cradle', prop: 'baby' })],
    up: { people: [
      P('andres', 'Andrés', 'man', 'sleep', { skin: '#c98e62', hair: '#2e2420', dress: '#3f6f9a', legs: true, pants: '#3a4466', beard: true, h: 1.03 }, [
        T('Zzz… I’m awake… I’m awake… Zzz…', 'Zzz… Estoy despierto… estoy despierto… Zzz…', 'Zzz… Tô acordado… tô acordado… Zzz…', 'Zzz … Ich bin wach … ich bin wach … Zzz …',
          '[呼|hū] [呼|hū] … [我|wǒ] [醒|xǐng] [着|zhe] [呢|ne] … [醒|xǐng] [着|zhe] [呢|ne] … [呼|hū] [呼|hū] …', 'すう すう … [起|お]きて る よ … [起|お]きて る … すう すう …'),
        T('Is it my turn with the baby? … No? Five more minutes, then.', '¿Me toca con la bebé? … ¿No? Cinco minutitos más, entonces.', 'É a minha vez com a bebê? … Não? Então mais cinco minutinhos.', 'Bin ich mit dem Baby dran? … Nein? Dann noch fünf Minuten.',
          '[轮到|lún dào] [我|wǒ] [看|kān] [宝宝|bǎo bao] [了|le] [吗|ma] ？ … [没有|méi yǒu] ？ [那|nà] [再|zài] [睡|shuì] [五|wǔ] [分钟|fēn zhōng] 。', '[赤|あか]ちゃん 、 ぼく の [番|ばん] ？ … ちがう ？ じゃあ 、 あと [五分|ごふん] だけ 。'),
      ])] } });
  // 02 the kite maker
  H('molinar-house-02', { theme: 'kites', people: [
    P('raul', 'Raúl', 'man', 'hero', { skin: '#c98e62', hair: '#2e2420', hairdo: 'curly', dress: '#e0743c', legs: true, pants: '#3a4466', beard: true, hat: 'cap', hatColor: '#3f6fb5' }, [
      T('Up, up, up! The best wind in the valley blows right here in Molinar.', '¡Arriba, arriba! El mejor viento del valle sopla aquí mismo, en Molinar.', 'Sobe, sobe, sobe! O melhor vento do vale sopra bem aqui, em Molinar.', 'Hoch, hoch, hoch! Der beste Wind im ganzen Tal weht genau hier in Molinar.',
        '[飞|fēi] [呀|ya] ， [飞|fēi] [呀|ya] ！ [山谷|shān gǔ] [里|lǐ] [最|zuì] [好|hǎo] [的|de] [风|fēng] [就|jiù] [在|zài] [磨坊镇|Mò fáng zhèn] 。', 'あがれ 、 あがれ ！ [谷|たに] で いちばん いい [風|かぜ] は 、 この モリナール に [吹|ふ]く ん だ 。'),
      T('A kite is a letter to the sky. This one says “hello”.', 'Una cometa es una carta para el cielo. Esta dice «hola».', 'Uma pipa é uma carta pro céu. Esta diz «oi».', 'Ein Drachen ist ein Brief an den Himmel. Der hier sagt „Hallo“.',
        '[风筝|fēng zheng] [是|shì] [写|xiě] [给|gěi] [天空|tiān kōng] [的|de] [信|xìn] 。 [这|zhè] [个|gè] [说|shuō] “ [你好|nǐ hǎo] ” 。', '[凧|たこ] は [空|そら] へ の [手紙|てがみ] です 。 これ は 「 こんにちは 」 って [言|い]って る ん です よ 。'),
      T('When the wind stops, I fix kites. When it blows, I fly them. A simple life!', 'Cuando no hay viento, arreglo cometas. Cuando sopla, las vuelo. ¡Una vida sencilla!', 'Quando o vento para, eu conserto pipas. Quando ele sopra, eu solto. Uma vida simples!', 'Wenn der Wind still ist, repariere ich Drachen. Wenn er weht, lasse ich sie steigen. Ein einfaches Leben!',
        '[没有|méi yǒu] [风|fēng] [的|de] [时候|shí hou] ， [我|wǒ] [修|xiū] [风筝|fēng zheng] 。 [有|yǒu] [风|fēng] [的|de] [时候|shí hou] ， [我|wǒ] [放|fàng] [风筝|fēng zheng] 。 [简单|jiǎn dān] [的|de] [生活|shēng huó] ！', '[風|かぜ] が ない [日|ひ] は [凧|たこ] を なおす 。 [風|かぜ] が ある [日|ひ] は [凧|たこ] を あげる 。 シンプル な [暮|く]らし さ ！'),
    ], { job: 'sew' })] });
  // 03 the cuckoo-clock collector, and Bigotes upstairs (his quest: what time is it?)
  H('molinar-house-03', { theme: 'cuckoo', people: [
    P('teodoro', 'Teodoro', 'grandpa', 'hero', { skin: '#efc29a', hair: '#d8d8d8', hairdo: 'bald', stache: true, glasses: true, loupe: true, dress: '#6b4a7a', legs: true, pants: '#3a3436', h: 0.94 }, [
      T('Tick, tock… cuckoo! Forty-two clocks, and no two agree.', '¡Tic, tac… cucú! Cuarenta y dos relojes, y ninguno está de acuerdo.', 'Tique-taque… cuco! Quarenta e dois relógios, e nenhum concorda com o outro.', 'Tick, tack … kuckuck! Zweiundvierzig Uhren, und keine geht wie die andere.',
        '[滴答|dī dā] [滴答|dī dā] … [布谷|bù gǔ] ！ [四十二|sì shí èr] [个|gè] [钟|zhōng] ， [没有|méi yǒu] [两|liǎng] [个|gè] [一样|yī yàng] [的|de] 。', 'チク タク … カッコー ！ [四十二|よんじゅうに] [個|こ] の [時計|とけい] 、 どれ も [時間|じかん] が ちがう ん です 。'),
      T('This one was my grandfather’s. It’s always ten minutes late. Just like him!', 'Este era de mi abuelo. Siempre va diez minutos tarde. ¡Igual que él!', 'Este era do meu avô. Sempre atrasa dez minutos. Igualzinho a ele!', 'Die hier war von meinem Opa. Sie geht immer zehn Minuten nach. Genau wie er!',
        '[这|zhè] [个|gè] [是|shì] [我|wǒ] [爷爷|yé ye] [的|de] 。 [它|tā] [总是|zǒng shì] [慢|màn] [十|shí] [分钟|fēn zhōng] 。 [跟|gēn] [他|tā] [一模一样|yī mú yī yàng] ！', 'これ は [祖父|そふ] の [時計|とけい] です 。 いつも [十分|じゅっぷん] おくれる ん です 。 [祖父|そふ] と そっくり ！'),
      T('When the Hush came, they all stopped at once. I wound every one by hand.', 'Cuando llegó el Silencio, todos se pararon a la vez. Les di cuerda uno por uno.', 'Quando o Silêncio chegou, todos pararam de uma vez. Eu dei corda em cada um, com a mão.', 'Als die Stille kam, blieben alle auf einmal stehen. Ich habe jede einzelne von Hand aufgezogen.',
        '[寂静|Jì jìng] [来|lái] [的|de] [时候|shí hou] ， [它们|tā men] [一下子|yī xià zi] [全|quán] [停|tíng] [了|le] 。 [我|wǒ] [一|yī] [个|gè] [一|yī] [个|gè] [用|yòng] [手|shǒu] [上|shàng] [好|hǎo] [发条|fā tiáo] 。', '[静寂|せいじゃく] が [来|き]た とき 、 ぜんぶ [一度|いちど] に [止|と]まりました 。 [一|ひと]つ ずつ 、 [手|て] で ねじ を [巻|ま]きました よ 。'),
    ], { job: 'think' })],
    up: { pets: [PET('bigotes', 'cat', 'Bigotes', '#8a8f9e', 'catbed', { pose: 'sleep' })] } });
  // 04 the sailmaker
  H('molinar-house-04', { theme: 'sailmaker', people: [
    P('bernardo', 'Bernardo', 'man', 'hero', { skin: '#dcae86', hair: '#5a5048', dress: '#3f6fb5', legs: true, pants: '#4a3a33', beard: true, hat: 'flat', hatColor: '#3a3040' }, [
      T('Sails for the mills, sails for the boats on the lake. Same needle!', 'Velas para los molinos, velas para los barcos del lago. ¡La misma aguja!', 'Velas pros moinhos, velas pros barcos do lago. A mesma agulha!', 'Segel für die Mühlen, Segel für die Boote auf dem See. Dieselbe Nadel!',
        '[给|gěi] [风车|fēng chē] [做|zuò] [帆|fān] ， [也|yě] [给|gěi] [湖|hú] [上|shàng] [的|de] [船|chuán] [做|zuò] [帆|fān] 。 [用|yòng] [的|de] [是|shì] [同|tóng] [一|yī] [根|gēn] [针|zhēn] ！', '[風車|ふうしゃ] の [帆|ほ] も 、 [湖|みずうみ] の [舟|ふね] の [帆|ほ] も 。 [同|おな]じ [針|はり] です よ ！'),
      T('The wind is free. The sail is not! Ha!', 'El viento es gratis. ¡La vela no! ¡Ja!', 'O vento é de graça. A vela, não! Rá!', 'Der Wind ist umsonst. Das Segel nicht! Ha!',
        '[风|fēng] [是|shì] [免费|miǎn fèi] [的|de] 。 [帆|fān] [可|kě] [不|bù] [是|shì] ！ [哈|hā] ！', '[風|かぜ] は ただ 。 [帆|ほ] は ただ じゃ ない ！ はは ！'),
      T('My daughter lives by the lake, in Remanso. She sails with what I sew.', 'Mi hija vive junto al lago, en Remanso. Navega con lo que yo coso.', 'A minha filha mora perto do lago, em Remanso. Ela navega com o que eu costuro.', 'Meine Tochter wohnt am See, in Remanso. Sie segelt mit dem, was ich nähe.',
        '[我|wǒ] [女儿|nǚ ér] [住|zhù] [在|zài] [湖|hú] [边|biān] [的|de] [静水村|Jìng shuǐ cūn] 。 [我|wǒ] [缝|féng] [的|de] [帆|fān] ， [她|tā] [拿|ná] [去|qù] [航行|háng xíng] 。', '[娘|むすめ] は [湖|みずうみ] の そば の レマンソ に [住|す]んで います 。 わたし が ぬった [帆|ほ] で 、 [娘|むすめ] が [舟|ふね] を [走|はし]らせる ん です 。'),
    ], { job: 'sew' })] });
  // 05 the mapmaker, and Diego upstairs
  H('molinar-house-05', { theme: 'mapmaker', people: [
    P('lucia', 'Lucía', 'woman', 'desk', { skin: '#f0c7a0', hair: '#7a3f2a', hairdo: 'bun', dress: '#4f8a7a', glasses: true }, [
      T('Careful, the ink is still wet! I’m drawing the road to the lake.', '¡Cuidado, la tinta está fresca! Estoy dibujando el camino al lago.', 'Cuidado, a tinta ainda está molhada! Estou desenhando o caminho até o lago.', 'Vorsicht, die Tinte ist noch nass! Ich zeichne gerade den Weg zum See.',
        '[小心|xiǎo xīn] ， [墨水|mò shuǐ] [还|hái] [没|méi] [干|gān] ！ [我|wǒ] [在|zài] [画|huà] [去|qù] [湖|hú] [边|biān] [的|de] [路|lù] 。', '[気|き] を つけて 、 インク が まだ かわいて ない の ！ [湖|みずうみ] へ の [道|みち] を [描|か]いて いる ところ 。'),
      T('A map is a promise: “You can get there.” I like promises.', 'Un mapa es una promesa: «Puedes llegar.» Me gustan las promesas.', 'Um mapa é uma promessa: «Você consegue chegar lá.» Eu gosto de promessas.', 'Eine Karte ist ein Versprechen: „Du kommst da hin.“ Ich mag Versprechen.',
        '[地图|dì tú] [是|shì] [一|yī] [个|gè] [承诺|chéng nuò] ： “ [你|nǐ] [到|dào] [得|de] [了|liǎo] 。 ” [我|wǒ] [喜欢|xǐ huan] [承诺|chéng nuò] 。', '[地図|ちず] は [約束|やくそく] です 。 「 ここ まで [行|い]ける よ 」 って 。 [約束|やくそく] 、 [好|す]き な ん です 。'),
      T('Since the Hush, the roads feel longer. The map says they’re the same.', 'Desde el Silencio, los caminos parecen más largos. El mapa dice que son iguales.', 'Desde o Silêncio, os caminhos parecem mais longos. O mapa diz que são os mesmos.', 'Seit der Stille fühlen sich die Wege länger an. Die Karte sagt, sie sind gleich.',
        '[寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [路|lù] [好像|hǎo xiàng] [变|biàn] [长|cháng] [了|le] 。 [可是|kě shì] [地图|dì tú] [说|shuō] [一样|yī yàng] [长|cháng] 。', '[静寂|せいじゃく] の [後|あと] 、 [道|みち] が [長|なが]く [感|かん]じる の 。 [地図|ちず] で は [同|おな]じ なのに 。'),
    ], { job: 'write' })],
    up: { people: [
      P('diego', 'Diego', 'kid', 'desk', { skin: '#f0c7a0', hair: '#7a3f2a', hairdo: 'curly', dress: '#e0743c', legs: true, pants: '#3a4466', h: 0.7 }, [
        T('I’m making a map of my room. The {w.bed}, the {w.window}, the {w.door}… done!', 'Estoy haciendo un mapa de mi cuarto. La {w.bed}, la {w.window}, la {w.door}… ¡listo!', 'Tô fazendo um mapa do meu quarto. A {w.bed}, a {w.window}, a {w.door}… pronto!', 'Ich mache eine Karte von meinem Zimmer. Das {w.bed}, das {w.window}, die {w.door} … fertig!',
          '[我|wǒ] [在|zài] [画|huà] [我|wǒ] [房间|fáng jiān] [的|de] [地图|dì tú] 。 {w.bed} 、 {w.window} 、 {w.door} … [画|huà] [好|hǎo] [了|le] ！', 'ぼく の [部屋|へや] の [地図|ちず] を [作|つく]って る ん だ 。 {w.bed} 、 {w.window} 、 {w.door} … できた ！'),
        T('When I grow up, I’ll draw a map of the sky. Every {w.star}!', 'Cuando sea grande, voy a dibujar un mapa del cielo. ¡Cada {w.star}!', 'Quando eu crescer, vou desenhar um mapa do céu. Cada {w.star}!', 'Wenn ich groß bin, zeichne ich eine Karte vom Himmel. Jeden {w.star}!',
          '[我|wǒ] [长大|zhǎng dà] [以后|yǐ hòu] ， [要|yào] [画|huà] [一|yī] [张|zhāng] [天空|tiān kōng] [的|de] [地图|dì tú] 。 [每|měi] [一|yī] [颗|kē] {w.star} ！', '[大|おお]きく なったら 、 [空|そら] の [地図|ちず] を [描|か]く ん だ 。 {w.star} を ぜんぶ ！'),
      ], { job: 'write' })] } });
  // 06 the herbalist
  H('molinar-house-06', { theme: 'herbalist', people: [
    P('esperanza', 'Esperanza', 'grandma', 'hero', { skin: '#c98e62', hair: '#f4f1ea', hairdo: 'bun', dress: '#6b7a4a', apron: '#e8dcc0', glasses: true, h: 0.86, w: 1.05 }, [
      T('Chamomile for sleep, mint for the tummy, lavender for… everything!', 'Manzanilla para dormir, menta para la barriga y lavanda para… ¡todo!', 'Camomila pra dormir, hortelã pra barriga e lavanda pra… tudo!', 'Kamille zum Schlafen, Minze für den Bauch und Lavendel für … alles!',
        '[洋甘菊|yáng gān jú] [助|zhù] [睡眠|shuì mián] ， [薄荷|bò he] [治|zhì] [肚子|dù zi] ， [薰衣草|xūn yī cǎo] [嘛|ma] … [什么|shén me] [都|dōu] [管|guǎn] ！', 'カモミール は [眠|ねむ]り に 、 ミント は おなか に 、 ラベンダー は … なんでも ！'),
      T('Smell this! … Too strong? Good. It’s for colds.', '¡Huele esto! … ¿Muy fuerte? Bien. Es para el resfriado.', 'Cheira isso! … Forte demais? Ótimo. É pra resfriado.', 'Riech mal! … Zu stark? Gut. Das ist gegen Erkältung.',
        '[闻|wén] [闻|wen] [这个|zhè ge] ！ … [太|tài] [冲|chòng] [了|le] ？ [那|nà] [就|jiù] [对|duì] [了|le] 。 [这|zhè] [是|shì] [治|zhì] [感冒|gǎn mào] [的|de] 。', 'これ 、 におって みて ！ … [強|つよ]すぎる ？ よし 。 かぜ に [効|き]く ん です よ 。'),
      T('The best medicine? A cup of {w.tea} and a good talk.', '¿La mejor medicina? Una taza de {w.tea} y una buena charla.', 'O melhor remédio? Uma xícara de {w.tea} e uma boa conversa.', 'Die beste Medizin? Eine Tasse {w.tea} und ein gutes Gespräch.',
        '[最|zuì] [好|hǎo] [的|de] [药|yào] ？ [一|yī] [杯|bēi] {w.tea} ， [再|zài] [加上|jiā shàng] [好好|hǎo hǎo] [聊|liáo] [一|yī] [聊|liao] 。', 'いちばん の [薬|くすり] ？ {w.tea} [一杯|いっぱい] と 、 たのしい おしゃべり です よ 。'),
    ], { job: 'stir', prop: 'spoon' })] });
  // 07 the grandpa who built windmills, and Tomi upstairs with his paper ones
  H('molinar-house-07', { theme: 'windmillKid', people: [
    P('gregorio', 'Gregorio', 'grandpa', 'hero', { skin: '#e6b48c', hair: '#e0ddd6', hairdo: 'bald', stache: true, dress: '#8a5f3e', legs: true, pants: '#5a5048', hat: 'flat', hatColor: '#6b5a4a', h: 0.94 }, [
      T('My grandson makes paper windmills. Hundreds! The windowsill is full.', 'Mi nieto hace molinitos de papel. ¡Cientos! La ventana está llena.', 'O meu neto faz cataventos de papel. Centenas! A janela está cheia.', 'Mein Enkel bastelt Papierwindmühlen. Hunderte! Das Fensterbrett ist voll.',
        '[我|wǒ] [孙子|sūn zi] [做|zuò] [纸|zhǐ] [风车|fēng chē] 。 [好|hǎo] [几百|jǐ bǎi] [个|gè] ！ [窗台|chuāng tái] [上|shàng] [都|dōu] [摆|bǎi] [满|mǎn] [了|le] 。', '[孫|まご] が [紙|かみ] の [風車|かざぐるま] を [作|つく]る ん です 。 [何百|なんびゃく] も ！ [窓|まど] が いっぱい です よ 。'),
      T('I built half the windmills in this valley. Now I watch the little paper ones turn.', 'Construí la mitad de los molinos de este valle. Ahora miro girar los de papel.', 'Eu construí metade dos moinhos deste vale. Agora eu fico vendo os de papel girarem.', 'Ich habe die Hälfte der Windmühlen in diesem Tal gebaut. Jetzt schaue ich den kleinen aus Papier beim Drehen zu.',
        '[这|zhè] [个|gè] [山谷|shān gǔ] [一半|yī bàn] [的|de] [风车|fēng chē] [是|shì] [我|wǒ] [盖|gài] [的|de] 。 [现在|xiàn zài] [我|wǒ] [看|kàn] [纸|zhǐ] [风车|fēng chē] [转|zhuàn] 。', 'この [谷|たに] の [風車|ふうしゃ] の [半分|はんぶん] は 、 わたし が [建|た]てた ん です 。 [今|いま] は [紙|かみ] の [風車|かざぐるま] が [回|まわ]る の を [見|み]て います 。'),
    ], { job: 'think' })],
    up: { people: [
      P('tomi', 'Tomi', 'kid', 'floor', { skin: '#e6b48c', hair: '#3a2b26', hairdo: 'curly', dress: '#4f9a5a', legs: true, pants: '#3a4466', h: 0.66, eyes: 'happy' }, [
        T('Blow! … See? It turns! That’s the wind. You can’t see it, but it’s there.', '¡Sopla! … ¿Ves? ¡Gira! Es el viento. No se ve, pero está ahí.', 'Sopra! … Viu? Gira! É o vento. Não dá pra ver, mas ele está aí.', 'Puste! … Siehst du? Es dreht sich! Das ist der Wind. Man sieht ihn nicht, aber er ist da.',
          '[吹|chuī] ！ … [看见|kàn jiàn] [了|le] [吗|ma] ？ [转|zhuàn] [了|le] ！ [那|nà] [是|shì] [风|fēng] 。 [看|kàn] [不|bù] [见|jiàn] ， [可是|kě shì] [它|tā] [在|zài] 。', 'ふー ！ … [見|み]た ？ [回|まわ]った ！ それ が [風|かぜ] だ よ 。 [見|み]えない けど 、 ちゃんと いる ん だ 。'),
        T('I’m building a windmill as big as the Great Mill. Well… a little smaller.', 'Estoy construyendo un molino tan grande como el Gran Molino. Bueno… un poquito más chico.', 'Tô construindo um moinho do tamanho do Grande Moinho. Bom… um pouquinho menor.', 'Ich baue eine Windmühle, so groß wie die Große Mühle. Na ja … ein bisschen kleiner.',
          '[我|wǒ] [在|zài] [做|zuò] [一|yī] [个|gè] [跟|gēn] [大磨坊|Dà mò fáng] [一样|yī yàng] [大|dà] [的|de] [风车|fēng chē] 。 [好|hǎo] [吧|ba] … [小|xiǎo] [一点|yī diǎn] 。', '[大風車|だいふうしゃ] と [同|おな]じ くらい [大|おお]きい [風車|ふうしゃ] を [作|つく]って る ん だ 。 まあ … ちょっと [小|ちい]さい けど 。'),
      ])] } });
  // 08 the shepherd, old Canela by the fire and Pipo the puppy (their quest: sit!)
  H('molinar-house-08', { theme: 'shepherd', people: [
    P('fermin', 'Fermín', 'grandpa', 'arm', { skin: '#c98e62', hair: '#bdb8b0', hairdo: 'bald', beard: true, dress: '#6b7a4a', legs: true, pants: '#4a3a33', hat: 'flat', hatColor: '#4a3a33', h: 0.96, scarf: '#c9553f' }, [
      T('Two hundred sheep, and every one has a name. Don’t test me!', 'Doscientas ovejas, y cada una tiene nombre. ¡No me pongas a prueba!', 'Duzentas ovelhas, e cada uma tem nome. Não me testa!', 'Zweihundert Schafe, und jedes hat einen Namen. Stell mich nicht auf die Probe!',
        '[两百|liǎng bǎi] [只|zhī] [羊|yáng] ， [每|měi] [一|yī] [只|zhī] [都|dōu] [有|yǒu] [名字|míng zi] 。 [不信|bù xìn] [你|nǐ] [考考|kǎo kao] [我|wǒ] ！', '[羊|ひつじ] が [二百匹|にひゃっぴき] 、 みんな [名前|なまえ] が ある ん だ 。 [試|ため]して みる かい ？'),
      T('Canela is old now. Twelve years she worked with me. Now she sleeps by the fire.', 'Canela ya está viejita. Trabajó doce años conmigo. Ahora duerme junto al fuego.', 'A Canela já está velhinha. Trabalhou doze anos comigo. Agora ela dorme perto do fogo.', 'Canela ist jetzt alt. Zwölf Jahre hat sie mit mir gearbeitet. Jetzt schläft sie am Feuer.',
        '[肉桂|Ròu guì] [老|lǎo] [了|le] 。 [它|tā] [跟|gēn] [我|wǒ] [干|gàn] [了|le] [十二|shí èr] [年|nián] [活|huó] 。 [现在|xiàn zài] [它|tā] [在|zài] [火|huǒ] [边|biān] [睡觉|shuì jiào] 。', 'シナモン は もう [年|とし] だ 。 [十二年|じゅうにねん] 、 いっしょ に [働|はたら]いた 。 [今|いま] は [火|ひ] の そば で [寝|ね]て いる よ 。'),
      T('The puppy? That’s Pipo. He’s learning. Slowly. Very slowly.', '¿El cachorro? Es Pipo. Está aprendiendo. Despacio. Muy despacio.', 'O filhote? É o Pipo. Ele está aprendendo. Devagar. Bem devagar.', 'Der Welpe? Das ist Pipo. Er lernt noch. Langsam. Sehr langsam.',
        '[那|nà] [只|zhī] [小狗|xiǎo gǒu] ？ [它|tā] [叫|jiào] [皮波|Pí bō] 。 [它|tā] [在|zài] [学|xué] 。 [慢慢|màn màn] [学|xué] 。 [非常|fēi cháng] [慢|màn] 。', '[子犬|こいぬ] ？ ピポ だ よ 。 [勉強中|べんきょうちゅう] だ 。 ゆっくり 。 とても ゆっくり 。'),
    ], { job: 'read', prop: 'book' })],
    pets: [PET('canela', 'dog', 'Canela', '#b8743a', 'pet', { pose: 'lie', opt: { ear: '#7a4a2a' } }),
      PET('pipo', 'dog', 'Pipo', '#f2e6d0', 'dog', { pose: () => (st('hq.sit') >= 2 ? 'sit' : 'lie'), opt: { s: 0.72, ear: '#c9a27a', collar: '#d9483b' } })] });
  // 09 the jam maker, and Michi asleep in the back room
  H('molinar-house-09', { theme: 'jam', people: [
    P('clementina', 'Clementina', 'woman', 'hero', { skin: '#f0c7a0', hair: '#c98a4a', hairdo: 'pony', dress: '#c9443a', apron: '#fdf8ee', w: 1.05 }, [
      T('Strawberry, peach, fig… and today, orange! Want a taste? Careful, it’s hot!', 'Fresa, durazno, higo… ¡y hoy, naranja! ¿Pruebas? ¡Cuidado, que quema!', 'Morango, pêssego, figo… e hoje, laranja! Quer provar? Cuidado, tá quente!', 'Erdbeere, Pfirsich, Feige … und heute Orange! Probieren? Vorsicht, heiß!',
        '[草莓|cǎo méi] 、 [桃子|táo zi] 、 [无花果|wú huā guǒ] … [今天|jīn tiān] [是|shì] [橙子|chéng zi] ！ [尝|cháng] [一|yī] [口|kǒu] ？ [小心|xiǎo xīn] [烫|tàng] ！', 'いちご 、 もも 、 いちじく … [今日|きょう] は オレンジ ！ [味見|あじみ] する ？ [熱|あつ]い から [気|き] を つけて ！'),
      T('My secret? Less sugar, more patience.', '¿Mi secreto? Menos azúcar, más paciencia.', 'O meu segredo? Menos açúcar, mais paciência.', 'Mein Geheimnis? Weniger Zucker, mehr Geduld.',
        '[我|wǒ] [的|de] [秘诀|mì jué] ？ [少|shǎo] [放|fàng] [糖|táng] ， [多|duō] [点|diǎn] [耐心|nài xīn] 。', 'ひみつ ？ [砂糖|さとう] は [少|すく]なめ 、 がまん は [多|おお]め 。'),
      T('Every jar has a label with the day I made it. Every jar is a little diary.', 'Cada frasco tiene una etiqueta con el día en que lo hice. Cada frasco es un pequeño diario.', 'Cada pote tem uma etiqueta com o dia em que eu fiz. Cada pote é um diariozinho.', 'Auf jedem Glas steht der Tag, an dem ich es gemacht habe. Jedes Glas ist ein kleines Tagebuch.',
        '[每|měi] [个|gè] [罐子|guàn zi] [上|shàng] [都|dōu] [写|xiě] [着|zhe] [做|zuò] [的|de] [日子|rì zi] 。 [每|měi] [个|gè] [罐子|guàn zi] [都|dōu] [是|shì] [一|yī] [本|běn] [小|xiǎo] [日记|rì jì] 。', 'どの びん に も 、 [作|つく]った [日|ひ] の ラベル が ある の 。 びん は [小|ちい]さな [日記|にっき] な の よ 。'),
    ], { job: 'stir', prop: 'spoon' })],
    up: { pets: [PET('michi', 'cat', 'Michi', '#3a3436', 'catbed', { pose: 'sleep' })] } });
  // (houses 10–17 below)
})();
(() => {
  if (typeof INTERIORS === 'undefined' || !INTERIORS.home) return;
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const H = (id, p) => INTERIORS.home(id, p);
  const P = (id, name, role, at, look, lines, o) => Object.assign({ id, name, role, at, look, lines }, o || {});
  // 10 the weaver (she weaves the new baby's blanket)
  H('molinar-house-10', { theme: 'weaver', people: [
    P('gloria', 'Gloria', 'grandma', 'hero', { skin: '#a8714a', hair: '#e0ddd6', hairdo: 'bun', dress: '#7a5ab0', glasses: true, h: 0.87, w: 1.04, scarf: '#f2c14e' }, [
      T('Click, clack. The loom talks all day, so I don’t have to.', 'Clic, clac. El telar habla todo el día, así yo no tengo que hablar.', 'Clique, claque. O tear fala o dia todo, aí eu não preciso falar.', 'Klick, klack. Der Webstuhl redet den ganzen Tag, dann muss ich es nicht.',
        '[咔嗒|kā dā] [咔嗒|kā dā] 。 [织布机|zhī bù jī] [整天|zhěng tiān] [说话|shuō huà] ， [我|wǒ] [就|jiù] [不用|bù yòng] [说|shuō] [了|le] 。', 'カタン 、 コトン 。 [機|はた] が [一日中|いちにちじゅう] しゃべって くれる から 、 わたし は [黙|だま]って いられる の 。'),
      T('Every {w.rug} in Molinar came from this loom. Every one!', 'Cada {w.rug} de Molinar salió de este telar. ¡Todas!', 'Cada {w.rug} de Molinar saiu deste tear. Todos!', 'Jeder {w.rug} in Molinar kommt von diesem Webstuhl. Jeder einzelne!',
        '[磨坊镇|Mò fáng zhèn] [的|de] [每|měi] [一|yī] [块|kuài] {w.rug} [都|dōu] [是|shì] [这|zhè] [台|tái] [织布机|zhī bù jī] [织|zhī] [的|de] 。 [每|měi] [一|yī] [块|kuài] ！', 'モリナール の {w.rug} は 、 ぜんぶ この [機|はた] で [織|お]った の 。 ぜんぶ よ ！'),
      T('Red for the hearth, yellow for the wheat, blue for the sky. That’s Molinar.', 'Rojo por el fuego, amarillo por el trigo, azul por el cielo. Eso es Molinar.', 'Vermelho pela lareira, amarelo pelo trigo, azul pelo céu. Isso é Molinar.', 'Rot für das Herdfeuer, Gelb für den Weizen, Blau für den Himmel. Das ist Molinar.',
        '[红色|hóng sè] [是|shì] [炉火|lú huǒ] ， [黄色|huáng sè] [是|shì] [麦子|mài zi] ， [蓝色|lán sè] [是|shì] [天空|tiān kōng] 。 [这|zhè] [就|jiù] [是|shì] [磨坊镇|Mò fáng zhèn] 。', '[赤|あか] は [暖炉|だんろ] 、 [黄色|きいろ] は [麦|むぎ] 、 [青|あお] は [空|そら] 。 それ が モリナール よ 。'),
    ], { job: 'sew' })] });
  // 11 the hat maker, and Martina upstairs in a hat too big for her
  H('molinar-house-11', { theme: 'hatter', people: [
    P('matias', 'Matías', 'man', 'hero', { skin: '#efc29a', hair: '#3a2b26', dress: '#3a3040', legs: true, pants: '#2f3440', stache: true, hat: 'beret', hatColor: '#c9443a' }, [
      T('Every head deserves a {w.hat}! Let me guess your size… normal. Always normal.', '¡Toda cabeza merece un {w.hat}! A ver tu talla… normal. Siempre normal.', 'Toda cabeça merece um {w.hat}! Deixa eu adivinhar o seu tamanho… normal. Sempre normal.', 'Jeder Kopf verdient einen {w.hat}! Mal sehen, deine Größe … normal. Immer normal.',
        '[每|měi] [个|gè] [脑袋|nǎo dai] [都|dōu] [配|pèi] [得|de] [上|shàng] [一|yī] [顶|dǐng] {w.hat} ！ [我|wǒ] [猜|cāi] [猜|cai] [你|nǐ] [的|de] [尺寸|chǐ cùn] … [中号|zhōng hào] 。 [永远|yǒng yuǎn] [是|shì] [中号|zhōng hào] 。', 'どんな [頭|あたま] に も {w.hat} を ！ サイズ を [当|あ]てて みよう … ふつう 。 いつも ふつう さ 。'),
      T('A straw hat for the fields, a beret for artists, a cap for the kids.', 'Un sombrero de paja para el campo, una boina para los artistas, una gorra para los niños.', 'Um chapéu de palha pro campo, uma boina pros artistas, um boné pras crianças.', 'Einen Strohhut fürs Feld, eine Baskenmütze für Künstler, eine Kappe für die Kinder.',
        '[下地|xià dì] [戴|dài] [草帽|cǎo mào] ， [画家|huà jiā] [戴|dài] [贝雷帽|bèi léi mào] ， [小孩|xiǎo hái] [戴|dài] [鸭舌帽|yā shé mào] 。', '[畑|はたけ] に は [麦|むぎ]わら[帽子|ぼうし] 、 [画家|がか] に は ベレー[帽|ぼう] 、 [子|こ]ども に は キャップ 。'),
      T('People say hats are old-fashioned. People are wrong.', 'La gente dice que los sombreros están pasados de moda. La gente se equivoca.', 'O pessoal diz que chapéu é coisa antiga. O pessoal está errado.', 'Die Leute sagen, Hüte sind altmodisch. Die Leute irren sich.',
        '[大家|dà jiā] [都|dōu] [说|shuō] [帽子|mào zi] [过时|guò shí] [了|le] 。 [大家|dà jiā] [都|dōu] [错|cuò] [了|le] 。', '[帽子|ぼうし] は [古|ふる]い って みんな [言|い]う 。 みんな まちがって る 。'),
    ], { job: 'sew' })],
    up: { people: [
      P('martina', 'Martina', 'kid', 'stand', { skin: '#efc29a', hair: '#3a2b26', hairdo: 'pigtails', dress: '#e86a9a', h: 0.7, hat: 'straw', hatColor: '#e8c57a' }, [
        T('This hat makes me look taller. Right? RIGHT?', 'Este sombrero me hace ver más alta. ¿Verdad? ¿¡VERDAD!?', 'Esse chapéu me deixa mais alta. Né? NÉ?', 'Mit dem Hut sehe ich größer aus. Oder? ODER?',
          '[戴|dài] [上|shàng] [这|zhè] [顶|dǐng] [帽子|mào zi] ， [我|wǒ] [看起来|kàn qǐ lái] [更|gèng] [高|gāo] 。 [对|duì] [吧|ba] ？ [对|duì] [吧|ba] ？', 'この [帽子|ぼうし] 、 [背|せ] が [高|たか]く [見|み]える でしょ ？ ね ？ ね ！'),
        T('Dad makes hats. I make hats for my dolls. Same thing!', 'Papá hace sombreros. Yo hago sombreros para mis muñecas. ¡Es lo mismo!', 'O papai faz chapéus. Eu faço chapéus pras minhas bonecas. É a mesma coisa!', 'Papa macht Hüte. Ich mache Hüte für meine Puppen. Das ist dasselbe!',
          '[爸爸|bà ba] [做|zuò] [帽子|mào zi] 。 [我|wǒ] [给|gěi] [娃娃|wá wa] [做|zuò] [帽子|mào zi] 。 [一样|yī yàng] [的|de] ！', 'パパ は [帽子|ぼうし] を [作|つく]る 。 わたし は [人形|にんぎょう] の [帽子|ぼうし] を [作|つく]る 。 [同|おな]じ だ よ ！'),
      ])] } });
  // 12 the flower seller
  H('molinar-house-12', { theme: 'florist', people: [
    P('yolanda', 'Yolanda', 'woman', 'hero', { skin: '#c98e62', hair: '#2e2420', hairdo: 'long', dress: '#e86a7a', apron: '#4f9a5a', hat: 'flower', hatColor: '#f2c14e' }, [
      T('Hello! Roses, daisies, sunflowers… which {w.flower} do you like best?', '¡Hola! Rosas, margaritas, girasoles… ¿qué {w.flower} te gusta más?', 'Oi! Rosas, margaridas, girassóis… de qual {w.flower} você gosta mais?', 'Hallo! Rosen, Gänseblümchen, Sonnenblumen … welche {w.flower} magst du am liebsten?',
        '[你好|nǐ hǎo] ！ [玫瑰|méi gui] 、 [雏菊|chú jú] 、 [向日葵|xiàng rì kuí] … [你|nǐ] [最|zuì] [喜欢|xǐ huan] [哪|nǎ] [种|zhǒng] {w.flower} ？', 'こんにちは ！ バラ 、 デイジー 、 ひまわり … どの {w.flower} が いちばん [好|す]き ？'),
      T('Flowers don’t need words. They say everything.', 'Las flores no necesitan palabras. Lo dicen todo.', 'As flores não precisam de palavras. Elas dizem tudo.', 'Blumen brauchen keine Worte. Sie sagen alles.',
        '[花|huā] [不|bù] [需要|xū yào] [说话|shuō huà] 。 [它们|tā men] [什么|shén me] [都|dōu] [说|shuō] [了|le] 。', '[花|はな] に [言葉|ことば] は いらない の 。 [花|はな] は なんでも [伝|つた]えて くれる 。'),
      T('In spring, the whole house smells like a garden. In winter… like soup.', 'En primavera, toda la casa huele a jardín. En invierno… a sopa.', 'Na primavera, a casa toda cheira a jardim. No inverno… a sopa.', 'Im Frühling riecht das ganze Haus nach Garten. Im Winter … nach Suppe.',
        '[春天|chūn tiān] ， [整个|zhěng gè] [屋子|wū zi] [都|dōu] [是|shì] [花园|huā yuán] [的|de] [味道|wèi dào] 。 [冬天|dōng tiān] … [是|shì] [汤|tāng] [的|de] [味道|wèi dào] 。', '[春|はる] は [家中|いえじゅう] が [花畑|はなばたけ] の におい 。 [冬|ふゆ] は … スープ の におい 。'),
    ], { job: 'water', prop: 'can' })] });
  // 13 the cook, and Eusebio in bed upstairs with a cold (their quest: get well soon)
  H('molinar-house-13', { theme: 'sickbed', people: [
    P('socorro', 'Socorro', 'grandma', 'cook', { skin: '#dcae86', hair: '#d8d8d8', hairdo: 'bun', dress: '#4f8a7a', apron: '#fdf8ee', h: 0.88, w: 1.08 }, [
      T('My Eusebio has a cold. A big one. He says it’s the end of the world.', 'Mi Eusebio tiene un resfriado. Uno grande. Dice que es el fin del mundo.', 'O meu Eusebio está resfriado. Um resfriado daqueles. Ele diz que é o fim do mundo.', 'Mein Eusebio ist erkältet. Richtig erkältet. Er sagt, das ist das Ende der Welt.',
        '[我|wǒ] [家|jiā] [欧塞维奥|Ōu sài wéi ào] [感冒|gǎn mào] [了|le] ， [很|hěn] [重|zhòng] [的|de] [感冒|gǎn mào] 。 [他|tā] [说|shuō] [是|shì] [世界|shì jiè] [末日|mò rì] 。', 'うち の エウセビオ が かぜ を ひいた の 。 ひどい かぜ 。 [世界|せかい] の [終|お]わり だ って [言|い]う の よ 。'),
      T('Chicken {w.soup}. My mother’s recipe. It fixes everything.', '{w.soup} de pollo. La receta de mi mamá. Lo cura todo.', '{w.soup} de galinha. A receita da minha mãe. Cura tudo.', 'Eine {w.soup} mit Huhn. Das Rezept meiner Mutter. Die hilft gegen alles.',
        '[鸡|jī] {w.soup} 。 [我|wǒ] [妈妈|mā ma] [的|de] [方子|fāng zi] 。 [什么|shén me] [病|bìng] [都|dōu] [能|néng] [治|zhì] 。', 'チキン {w.soup} 。 [母|はは] の レシピ です 。 なんでも [治|なお]る の よ 。'),
      T('He’s a terrible patient. He wants to get up and work!', 'Es un paciente terrible. ¡Quiere levantarse a trabajar!', 'Ele é um paciente terrível. Quer levantar pra trabalhar!', 'Er ist ein schrecklicher Patient. Er will aufstehen und arbeiten!',
        '[他|tā] [是|shì] [个|gè] [最|zuì] [不|bù] [听话|tīng huà] [的|de] [病人|bìng rén] 。 [总|zǒng] [想|xiǎng] [起来|qǐ lái] [干活|gàn huó] ！', 'ほんと に [困|こま]った [病人|びょうにん] よ 。 [起|お]きて [働|はたら]きたがる ん だ から ！'),
    ], { job: 'cook', prop: 'spoon' })],
    up: { people: [
      P('eusebio', 'Eusebio', 'grandpa', 'sleep', { skin: '#e6b48c', hair: '#c9c4bb', hairdo: 'bald', stache: true, dress: '#7a4a4a', legs: true, pants: '#4a3a33', h: 0.95 }, [
        T('Cough, cough… I’m fine. I’m FINE.', '¡Cof, cof! … Estoy bien. ¡Estoy BIEN!', 'Cof, cof… Tô bem. Tô BEM!', 'Hust, hust … Mir geht’s gut. Mir geht’s GUT!',
          '[咳|ké] [咳|ké] … [我|wǒ] [没事|méi shì] 。 [真|zhēn] [的|de] [没事|méi shì] ！', 'ゴホ 、 ゴホ … [大丈夫|だいじょうぶ] 。 [本当|ほんとう] に [大丈夫|だいじょうぶ] ！'),
        T('Don’t tell Socorro, but the soup is the best part of being sick.', 'No le digas a Socorro, pero la sopa es lo mejor de estar enfermo.', 'Não conta pra Socorro, mas a sopa é a melhor parte de ficar doente.', 'Sag’s nicht Socorro, aber die Suppe ist das Beste am Kranksein.',
          '[别|bié] [告诉|gào su] [索科罗|Suǒ kē luó] ， [生病|shēng bìng] [最|zuì] [好|hǎo] [的|de] [地方|dì fang] [就|jiù] [是|shì] [能|néng] [喝|hē] [她|tā] [的|de] [汤|tāng] 。', 'ソコロ に は [内緒|ないしょ] だ けど 、 [病気|びょうき] の いちばん いい ところ は 、 あの スープ だ よ 。'),
      ])] } });
  // 14 the music teacher and Gabi, her pupil
  H('molinar-house-14', { theme: 'musicTeacher', people: [
    P('beatriz', 'Beatriz', 'woman', 'hero', { skin: '#f0c7a0', hair: '#5a3020', hairdo: 'bun', dress: '#7a5ab0', glasses: true, scarf: '#fdf8ee' }, [
      T('Do, re, mi… Oh, a visitor! Sit, sit. Do you play?', 'Do, re, mi… ¡Ay, una visita! Siéntate, siéntate. ¿Tocas algo?', 'Dó, ré, mi… Ah, visita! Senta, senta. Você toca alguma coisa?', 'Do, re, mi … Oh, Besuch! Setz dich, setz dich. Spielst du ein Instrument?',
        '[哆|duō] 、 [来|lái] 、 [咪|mī] … [哎|āi] ， [有|yǒu] [客人|kè rén] ！ [坐|zuò] ， [坐|zuò] 。 [你|nǐ] [会|huì] [弹|tán] [什么|shén me] [吗|ma] ？', 'ド 、 レ 、 ミ … あら 、 お[客|きゃく]さん ！ どうぞ 、 [座|すわ]って 。 [何|なに]か [弾|ひ]けます か ？'),
      T('Since the Hush, my piano sounds a little sad. So I play happy songs. Louder!', 'Desde el Silencio, mi piano suena un poco triste. Así que toco canciones alegres. ¡Más fuerte!', 'Desde o Silêncio, o meu piano soa meio triste. Então eu toco músicas alegres. Mais alto!', 'Seit der Stille klingt mein Klavier ein bisschen traurig. Also spiele ich fröhliche Lieder. Lauter!',
        '[寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [我|wǒ] [的|de] [钢琴|gāng qín] [听起来|tīng qǐ lái] [有点|yǒu diǎn] [伤心|shāng xīn] 。 [所以|suǒ yǐ] [我|wǒ] [弹|tán] [快乐|kuài lè] [的|de] [歌|gē] 。 [弹|tán] [得|de] [更|gèng] [大声|dà shēng] ！', '[静寂|せいじゃく] の [後|あと] 、 ピアノ が [少|すこ]し [悲|かな]しそう な [音|おと] に なりました 。 だから [明|あか]るい [曲|きょく] を [弾|ひ]く の 。 もっと [大|おお]きく ！'),
      T('Practice every day. Ten minutes is better than nothing!', 'Practica todos los días. ¡Diez minutos es mejor que nada!', 'Pratique todo dia. Dez minutos é melhor que nada!', 'Übe jeden Tag. Zehn Minuten sind besser als nichts!',
        '[每天|měi tiān] [练习|liàn xí] 。 [十|shí] [分钟|fēn zhōng] [也|yě] [比|bǐ] [不|bù] [练|liàn] [好|hǎo] ！', '[毎日|まいにち] [練習|れんしゅう] して ね 。 [十分|じゅっぷん] で も 、 しない より ずっと いい ！'),
    ], { job: 'keys' }),
    P('gabi', 'Gabi', 'kid', 'sit', { skin: '#a8714a', hair: '#1f1a18', hairdo: 'pony', dress: '#2f8f86', legs: true, pants: '#3a4466', h: 0.72 }, [
      T('I practice every day! … Almost every day. … Some days.', '¡Practico todos los días! … Casi todos los días. … Algunos días.', 'Eu pratico todo dia! … Quase todo dia. … Alguns dias.', 'Ich übe jeden Tag! … Fast jeden Tag. … An manchen Tagen.',
        '[我|wǒ] [每天|měi tiān] [都|dōu] [练习|liàn xí] ！ … [差不多|chà bu duō] [每天|měi tiān] 。 … [有|yǒu] [的|de] [时候|shí hou] 。', '[毎日|まいにち] [練習|れんしゅう] して る よ ！ … ほぼ [毎日|まいにち] 。 … たまに 。'),
      T('My teacher says I have good ears. I think she means for music.', 'Mi profe dice que tengo buen oído. Creo que lo dice por la música.', 'A minha professora diz que eu tenho bom ouvido. Acho que ela tá falando de música.', 'Meine Lehrerin sagt, ich habe gute Ohren. Ich glaube, sie meint für Musik.',
        '[老师|lǎo shī] [说|shuō] [我|wǒ] [的|de] [耳朵|ěr duo] [很|hěn] [好|hǎo] 。 [我|wǒ] [想|xiǎng] [她|tā] [是|shì] [说|shuō] [音乐|yīn yuè] 。', '[先生|せんせい] が 、 わたし は [耳|みみ] が いい って 。 [音楽|おんがく] の こと だ と [思|おも]う 。'),
    ], { job: 'sit' })] });
  // 15 the toy maker
  H('molinar-house-15', { theme: 'toymaker', people: [
    P('severino', 'Severino', 'grandpa', 'hero', { skin: '#efc29a', hair: '#f4f1ea', hairdo: 'bald', beard: true, glasses: true, dress: '#c9553f', apron: '#8a5f3e', legs: true, pants: '#3a4466', h: 0.93 }, [
      T('A horse, a top, a little train… every toy here was a block of wood once.', 'Un caballo, un trompo, un trencito… cada juguete de aquí fue un bloque de madera.', 'Um cavalo, um pião, um trenzinho… cada brinquedo aqui já foi um bloco de madeira.', 'Ein Pferd, ein Kreisel, eine kleine Eisenbahn … jedes Spielzeug hier war mal ein Holzklotz.',
        '[木马|mù mǎ] 、 [陀螺|tuó luó] 、 [小|xiǎo] [火车|huǒ chē] … [这里|zhè lǐ] [每|měi] [个|gè] [玩具|wán jù] [以前|yǐ qián] [都|dōu] [是|shì] [一|yī] [块|kuài] [木头|mù tou] 。', '[馬|うま] 、 こま 、 [小|ちい]さな [汽車|きしゃ] … ここ の おもちゃ は 、 みんな もと は [木|き] の かたまり です 。'),
      T('The best toy? One you can fix with your own hands.', '¿El mejor juguete? Uno que puedas arreglar con tus manos.', 'O melhor brinquedo? Um que dá pra consertar com as próprias mãos.', 'Das beste Spielzeug? Eines, das man selbst reparieren kann.',
        '[最|zuì] [好|hǎo] [的|de] [玩具|wán jù] ？ [是|shì] [自己|zì jǐ] [能|néng] [修|xiū] [的|de] [那|nà] [种|zhǒng] 。', 'いちばん いい おもちゃ ？ [自分|じぶん] で なおせる おもちゃ です よ 。'),
      T('Try the rocking horse! … Too big? Nobody is too big for a rocking horse.', '¡Prueba el caballito! … ¿Muy grande? Nadie es demasiado grande para un caballito.', 'Experimenta o cavalinho de balanço! … Grande demais? Ninguém é grande demais pra um cavalinho.', 'Probier das Schaukelpferd! … Zu groß? Niemand ist zu groß für ein Schaukelpferd.',
        '[试试|shì shi] [摇摇马|yáo yáo mǎ] ！ … [太|tài] [大|dà] [了|le] ？ [骑|qí] [摇摇马|yáo yáo mǎ] ， [谁|shéi] [都|dōu] [不|bù] [嫌|xián] [大|dà] 。', '[木馬|もくば] に [乗|の]って みて ！ … [大|おお]きすぎる ？ [木馬|もくば] に [大|おお]きすぎる [人|ひと] なんて いません よ 。'),
    ], { job: 'tinker', prop: 'tool' })] });
  // 16 the photographer
  H('molinar-house-16', { theme: 'photographer', people: [
    P('ximena', 'Ximena', 'woman', 'hero', { skin: '#c98e62', hair: '#1f1a18', hairdo: 'pony', dress: '#3a3436', legs: true, pants: '#3a4466', hat: 'beret', hatColor: '#d9483b' }, [
      T('Smile! … Oh, you moved. Again! Smile!', '¡Sonríe! … Ay, te moviste. ¡Otra vez! ¡Sonríe!', 'Sorria! … Ah, você mexeu. De novo! Sorria!', 'Lächeln! … Oh, du hast gewackelt. Noch mal! Lächeln!',
        '[笑|xiào] [一|yī] [个|gè] ！ … [哎|āi] ， [你|nǐ] [动|dòng] [了|le] 。 [再|zài] [来|lái] ！ [笑|xiào] [一|yī] [个|gè] ！', 'はい 、 チーズ ！ … あ 、 [動|うご]いた 。 もう [一回|いっかい] ！ チーズ ！'),
      T('Every face in Molinar is on my wall. Look, there’s the baker!', 'Todas las caras de Molinar están en mi pared. Mira, ¡ahí está la panadera!', 'Todos os rostos de Molinar estão na minha parede. Olha, ali está a padeira!', 'Jedes Gesicht in Molinar hängt an meiner Wand. Schau, da ist die Bäckerin!',
        '[磨坊镇|Mò fáng zhèn] [每|měi] [个|gè] [人|rén] [的|de] [脸|liǎn] [都|dōu] [在|zài] [我|wǒ] [的|de] [墙|qiáng] [上|shàng] 。 [你|nǐ] [看|kàn] ， [那|nà] [是|shì] [面包师|miàn bāo shī] ！', 'モリナール の みんな の [顔|かお] が [壁|かべ] に ある の 。 [見|み]て 、 パン[屋|や]さん ！'),
      T('After the Hush, people forgot how to smile. So I take pictures of the ones who still do.', 'Después del Silencio, la gente se olvidó de sonreír. Así que fotografío a los que todavía sonríen.', 'Depois do Silêncio, as pessoas esqueceram de sorrir. Então eu fotografo quem ainda sorri.', 'Nach der Stille haben die Leute das Lächeln vergessen. Also fotografiere ich die, die noch lächeln.',
        '[寂静|Jì jìng] [以后|yǐ hòu] ， [大家|dà jiā] [都|dōu] [忘|wàng] [了|le] [怎么|zěn me] [笑|xiào] 。 [所以|suǒ yǐ] [我|wǒ] [专门|zhuān mén] [拍|pāi] [还|hái] [会|huì] [笑|xiào] [的|de] [人|rén] 。', '[静寂|せいじゃく] の [後|あと] 、 みんな [笑|わら]う の を [忘|わす]れちゃった 。 だから 、 まだ [笑|わら]える [人|ひと] を [撮|と]って いる の 。'),
    ], { job: 'think', prop: 'camera' })] });
  // 17 two old friends at the chess table (forty years of afternoons)
  H('molinar-house-17', { theme: 'chess', people: [
    P('alonso', 'Alonso', 'grandpa', 'sit', { skin: '#dcae86', hair: '#d8d8d8', hairdo: 'bald', glasses: true, stache: true, dress: '#5a6a8a', legs: true, pants: '#4a3a33', h: 0.94 }, [
      T('Shh! She’s thinking. She’s been thinking for twenty minutes.', '¡Shh! Está pensando. Lleva veinte minutos pensando.', 'Shh! Ela tá pensando. Faz vinte minutos que ela tá pensando.', 'Pst! Sie denkt nach. Seit zwanzig Minuten denkt sie nach.',
        '[嘘|xū] ！ [她|tā] [在|zài] [想|xiǎng] 。 [已经|yǐ jīng] [想|xiǎng] [了|le] [二十|èr shí] [分钟|fēn zhōng] [了|le] 。', 'しー ！ [考|かんが]え[中|ちゅう] だ 。 もう [二十分|にじゅっぷん] も [考|かんが]えて る 。'),
      T('Forty years we’ve played, every afternoon. She wins. I don’t mind. Much.', 'Cuarenta años jugando cada tarde. Ella gana. No me importa. Mucho.', 'Quarenta anos jogando toda tarde. Ela ganha. Eu não ligo. Muito.', 'Vierzig Jahre spielen wir jeden Nachmittag. Sie gewinnt. Das macht mir nichts. Na ja.',
        '[我们|wǒ men] [每天|měi tiān] [下午|xià wǔ] [下棋|xià qí] ， [下|xià] [了|le] [四十|sì shí] [年|nián] 。 [她|tā] [赢|yíng] 。 [我|wǒ] [不|bù] [在乎|zài hu] 。 [不|bù] [太|tài] [在乎|zài hu] 。', '[四十年|よんじゅうねん] 、 [毎日|まいにち] [午後|ごご] に [指|さ]して る 。 [勝|か]つ の は [彼女|かのじょ] 。 [気|き] に しない よ 。 ちょっと しか 。'),
    ], { job: 'think' }),
    P('adela', 'Adela', 'grandma', 'sit', { skin: '#f0c7a0', hair: '#f4f1ea', hairdo: 'bun', dress: '#b8607a', glasses: true, h: 0.87, eyes: 'happy' }, [
      T('Check! … No, wait. Not check. … Your move, Alonso.', '¡Jaque! … No, espera. No es jaque. … Te toca, Alonso.', 'Xeque! … Não, espera. Não é xeque. … Sua vez, Alonso.', 'Schach! … Nein, warte. Kein Schach. … Du bist dran, Alonso.',
        '[将军|jiāng jūn] ！ … [不|bù] ， [等等|děng deng] 。 [不|bù] [是|shì] [将军|jiāng jūn] 。 … [该|gāi] [你|nǐ] [了|le] ， [阿隆索|Ā lóng suǒ] 。', 'チェック ！ … あ 、 [待|ま]って 。 ちがった 。 … アロンソ 、 あなた の [番|ばん] よ 。'),
      T('He says he lets me win. Ha!', 'Dice que me deja ganar. ¡Ja!', 'Ele diz que me deixa ganhar. Rá!', 'Er sagt, er lässt mich gewinnen. Ha!',
        '[他|tā] [说|shuō] [他|tā] [是|shì] [让|ràng] [我|wǒ] [赢|yíng] [的|de] 。 [哈|hā] ！', 'わざと [勝|か]たせて る って [言|い]う の 。 ふふ ！'),
    ], { job: 'think' })] });
})();
(() => {
  if (typeof INTERIORS === 'undefined' || !INTERIORS.home) return;
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const H = (id, p) => INTERIORS.home(id, p);
  const P = (id, name, role, at, look, lines, o) => Object.assign({ id, name, role, at, look, lines }, o || {});
  const PET = (id, kind, name, color, at, o) => Object.assign({ id, kind, name, color, at }, o || {});
  // 18 the candy maker
  H('molinar-house-18', { theme: 'candy', people: [
    P('rosita', 'Rosita', 'woman', 'hero', { skin: '#f0c7a0', hair: '#c98a4a', hairdo: 'curly', dress: '#e86a9a', apron: '#fdf8ee', w: 1.08 }, [
      T('Caramels, lemon drops, chocolate… Don’t touch! … Okay, one.', 'Caramelos, gotitas de limón, chocolate… ¡No toques! … Bueno, uno.', 'Balas, pastilhas de limão, chocolate… Não mexe! … Tá bom, um.', 'Karamellen, Zitronenbonbons, Schokolade … Nicht anfassen! … Na gut, eins.',
        '[焦糖|jiāo táng] 、 [柠檬|níng méng] [糖|táng] 、 [巧克力|qiǎo kè lì] … [别|bié] [碰|pèng] ！ … [好|hǎo] [吧|ba] ， [一|yī] [颗|kē] 。', 'キャラメル 、 レモン あめ 、 チョコレート … さわらない で ！ … じゃあ 、 [一|ひと]つ だけ 。'),
      T('The kids of Molinar know where I live. Every afternoon: knock, knock!', 'Los niños de Molinar saben dónde vivo. Todas las tardes: ¡toc, toc!', 'As crianças de Molinar sabem onde eu moro. Toda tarde: toc, toc!', 'Die Kinder von Molinar wissen, wo ich wohne. Jeden Nachmittag: klopf, klopf!',
        '[磨坊镇|Mò fáng zhèn] [的|de] [孩子|hái zi] [们|men] [都|dōu] [知道|zhī dào] [我|wǒ] [住|zhù] [哪里|nǎ lǐ] 。 [每天|měi tiān] [下午|xià wǔ] ： [咚|dōng] [咚|dōng] ！', 'モリナール の [子|こ]ども たち は 、 わたし の [家|いえ] を [知|し]って る の 。 [毎日|まいにち] [午後|ごご] に 、 トン トン ！'),
      T('A sweet a day keeps the sadness away. That’s not a real saying. It should be!', 'Un dulce al día aleja la tristeza. No es un dicho de verdad. ¡Pero debería serlo!', 'Um docinho por dia espanta a tristeza. Não é um ditado de verdade. Mas devia ser!', 'Ein Bonbon am Tag vertreibt die Traurigkeit. Das ist kein echtes Sprichwort. Sollte es aber sein!',
        '[一天|yī tiān] [一|yī] [颗|kē] [糖|táng] ， [烦恼|fán nǎo] [都|dōu] [跑光|pǎo guāng] 。 [这|zhè] [不|bù] [是|shì] [真|zhēn] [的|de] [俗话|sú huà] 。 [不过|bù guò] [应该|yīng gāi] [是|shì] ！', '[一日|いちにち] [一|ひと]つ の あめ で 、 かなしみ は [飛|と]んで いく 。 [本当|ほんとう] の ことわざ じゃ ない けど 。 そう なる べき よ ！'),
    ], { job: 'stir', prop: 'spoon' })] });
  // 19 the old miller (of the Great Mill)
  H('molinar-house-19', { theme: 'oldMiller', people: [
    P('lorenzo', 'Lorenzo', 'grandpa', 'sit', { skin: '#e6b48c', hair: '#f4f1ea', hairdo: 'bald', beard: true, dress: '#efe6d2', legs: true, pants: '#6b5a4a', hat: 'flat', hatColor: '#d8d0c0', h: 0.93 }, [
      T('Fifty years I worked at the Great Mill. My hands still smell of flour.', 'Cincuenta años trabajé en el Gran Molino. Mis manos todavía huelen a harina.', 'Trabalhei cinquenta anos no Grande Moinho. As minhas mãos ainda têm cheiro de farinha.', 'Fünfzig Jahre habe ich in der Großen Mühle gearbeitet. Meine Hände riechen noch nach Mehl.',
        '[我|wǒ] [在|zài] [大磨坊|Dà mò fáng] [干|gàn] [了|le] [五十|wǔ shí] [年|nián] 。 [我|wǒ] [的|de] [手|shǒu] [到|dào] [现在|xiàn zài] [还|hái] [有|yǒu] [面粉|miàn fěn] [的|de] [味道|wèi dào] 。', '[大風車|だいふうしゃ] で [五十年|ごじゅうねん] [働|はたら]いた 。 [今|いま] で も [手|て] から [小麦粉|こむぎこ] の におい が する よ 。'),
      T('This model? I made it from memory. Every beam, every sail.', '¿Esta maqueta? La hice de memoria. Cada viga, cada aspa.', 'Esta maquete? Eu fiz de memória. Cada viga, cada pá.', 'Dieses Modell? Das habe ich aus dem Gedächtnis gebaut. Jeden Balken, jeden Flügel.',
        '[这|zhè] [个|gè] [模型|mó xíng] ？ [我|wǒ] [凭|píng] [记忆|jì yì] [做|zuò] [的|de] 。 [每|měi] [根|gēn] [梁|liáng] ， [每|měi] [片|piàn] [帆|fān] 。', 'この [模型|もけい] ？ [記憶|きおく] だけ で [作|つく]った ん だ 。 [梁|はり] も [羽根|はね] も 、 ぜんぶ 。'),
      T('{w.bread} tastes better when you know who milled the flour.', 'El {w.bread} sabe mejor cuando sabes quién molió la harina.', 'O {w.bread} fica mais gostoso quando você sabe quem moeu a farinha.', 'Das {w.bread} schmeckt besser, wenn man weiß, wer das Mehl gemahlen hat.',
        '[知道|zhī dào] [是|shì] [谁|shéi] [磨|mò] [的|de] [面粉|miàn fěn] ， {w.bread} [就|jiù] [更|gèng] [好吃|hǎo chī] 。', 'だれ が [粉|こな] を ひいた か [知|し]って いる と 、 {w.bread} は もっと おいしい 。'),
    ], { job: 'sit' })] });
  // 20 the runner (a teenager) and his mom
  H('molinar-house-20', { theme: 'runner', people: [
    P('nico', 'Nicolás', 'kid', 'floor', { skin: '#a8714a', hair: '#2e2420', hairdo: 'curly', dress: '#4fb3a9', legs: true, pants: '#2f3440', h: 0.86, hat: 'bandana', hatColor: '#e0743c' }, [
      T('Hi! I just ran to the windmills and back. Twice! Want to race?', '¡Hola! Acabo de correr hasta los molinos y volver. ¡Dos veces! ¿Echamos una carrera?', 'Oi! Acabei de correr até os moinhos e voltar. Duas vezes! Vamos apostar corrida?', 'Hi! Ich bin gerade zu den Windmühlen und zurück gelaufen. Zweimal! Wollen wir um die Wette laufen?',
        '[嗨|hāi] ！ [我|wǒ] [刚|gāng] [跑到|pǎo dào] [风车|fēng chē] [那里|nà lǐ] [又|yòu] [跑|pǎo] [回来|huí lái] 。 [跑|pǎo] [了|le] [两|liǎng] [趟|tàng] ！ [比|bǐ] [一|yī] [比|bǐ] [吗|ma] ？', 'やあ ！ [風車|ふうしゃ] まで [走|はし]って [帰|かえ]って きた ところ 。 [二回|にかい] も ！ [競走|きょうそう] する ？'),
      T('My coach says: “Slow is smooth, smooth is fast.” I just run fast.', 'Mi entrenador dice: «Lento es suave, suave es rápido». Yo solo corro rápido.', 'O meu treinador diz: «Devagar é suave, suave é rápido». Eu só corro rápido.', 'Mein Trainer sagt: „Langsam ist sauber, sauber ist schnell.“ Ich renne einfach schnell.',
        '[我|wǒ] [的|de] [教练|jiào liàn] [说|shuō] ： “ [慢|màn] [就|jiù] [是|shì] [稳|wěn] ， [稳|wěn] [就|jiù] [是|shì] [快|kuài] 。 ” [我|wǒ] [就|jiù] [只|zhǐ] [会|huì] [快|kuài] [跑|pǎo] 。', 'コーチ は 「 ゆっくり は ていねい 、 ていねい は [速|はや]い 」 って [言|い]う 。 ぼく は ただ [速|はや]く [走|はし]る だけ 。'),
    ], { job: 'sit' }),
    P('carla', 'Carla', 'woman', 'cook', { skin: '#a8714a', hair: '#2e2420', hairdo: 'pony', dress: '#e6b84a', apron: '#fdf8ee' }, [
      T('Nicolás! Shoes OFF in the house! … Sorry. Hello!', '¡Nicolás! ¡Los zapatos FUERA en la casa! … Perdón. ¡Hola!', 'Nicolás! Tira o tênis dentro de casa! … Desculpa. Oi!', 'Nicolás! Schuhe AUS im Haus! … Entschuldigung. Hallo!',
        '[尼古拉斯|Ní gǔ lā sī] ！ [进|jìn] [屋|wū] [要|yào] [脱|tuō] [鞋|xié] ！ … [不好意思|bù hǎo yì si] 。 [你好|nǐ hǎo] ！', 'ニコラス ！ [家|いえ] の [中|なか] で は くつ を ぬいで ！ … あ 、 ごめんなさい 。 こんにちは ！'),
      T('He runs everywhere. To school, to the bakery, to the bathroom…', 'Corre a todas partes. A la escuela, a la panadería, al baño…', 'Ele corre pra todo lado. Pra escola, pra padaria, pro banheiro…', 'Er rennt überallhin. Zur Schule, zur Bäckerei, aufs Klo …',
        '[他|tā] [到|dào] [哪里|nǎ lǐ] [都|dōu] [用|yòng] [跑|pǎo] [的|de] 。 [去|qù] [学校|xué xiào] 、 [去|qù] [面包店|miàn bāo diàn] 、 [去|qù] [厕所|cè suǒ] …', 'どこ に でも [走|はし]って [行|い]く の 。 [学校|がっこう] に も 、 パン[屋|や] に も 、 トイレ に も …'),
    ], { job: 'cook', prop: 'spoon' })] });
  // 21 the widow with the radio (her quest: a loaf of bread from the bakery)
  H('molinar-house-21', { theme: 'widow', people: [
    P('pura', 'Pura', 'grandma', 'rock', { skin: '#efc29a', hair: '#f4f1ea', hairdo: 'bun', dress: '#3a3040', glasses: true, h: 0.85, w: 1.03, scarf: '#8a4f7d' }, [
      T('Come in, come in. I don’t get many visitors now. Sit with me a little.', 'Pasa, pasa. Ya casi no tengo visitas. Siéntate conmigo un ratito.', 'Entra, entra. Quase ninguém me visita agora. Senta um pouquinho comigo.', 'Komm rein, komm rein. Ich bekomme kaum noch Besuch. Setz dich ein bisschen zu mir.',
        '[进来|jìn lái] ， [进来|jìn lái] 。 [现在|xiàn zài] [很少|hěn shǎo] [有|yǒu] [人|rén] [来|lái] [看|kàn] [我|wǒ] 。 [陪|péi] [我|wǒ] [坐|zuò] [一下|yī xià] [吧|ba] 。', 'どうぞ 、 どうぞ 。 もう あまり お[客|きゃく]さん が [来|こ]ない の 。 [少|すこ]し [座|すわ]って いって ね 。'),
      T('That’s my Joaquín, by the radio. Fifty-one years married. He sang terribly. I miss it.', 'Ese es mi Joaquín, junto a la radio. Cincuenta y un años casados. Cantaba fatal. Lo extraño.', 'Esse é o meu Joaquín, perto do rádio. Cinquenta e um anos de casados. Ele cantava muito mal. Sinto falta.', 'Das ist mein Joaquín, da beim Radio. Einundfünfzig Jahre verheiratet. Er hat furchtbar gesungen. Ich vermisse es.',
        '[收音机|shōu yīn jī] [旁边|páng biān] [那|nà] [是|shì] [我|wǒ] [的|de] [华金|Huá jīn] 。 [我们|wǒ men] [结婚|jié hūn] [五十一|wǔ shí yī] [年|nián] 。 [他|tā] [唱歌|chàng gē] [难听|nán tīng] [极|jí] [了|le] 。 [我|wǒ] [好|hǎo] [想|xiǎng] [再|zài] [听|tīng] [一|yī] [次|cì] 。', 'ラジオ の そば の [写真|しゃしん] が 、 うち の ホアキン 。 [五十一年|ごじゅういちねん] [連|つ]れ[添|そ]った の 。 [歌|うた] が ほんとう に [下手|へた] で ね 。 それ が なつかしい の 。'),
      T('My knees don’t like the hill to the bakery anymore. Getting old is not for the weak!', 'Mis rodillas ya no quieren subir la cuesta de la panadería. ¡Hacerse vieja no es para débiles!', 'Os meus joelhos não gostam mais da ladeira da padaria. Envelhecer não é pra fracos!', 'Meine Knie mögen den Hügel zur Bäckerei nicht mehr. Alt werden ist nichts für Schwache!',
        '[我|wǒ] [的|de] [膝盖|xī gài] [爬|pá] [不|bù] [动|dòng] [去|qù] [面包店|miàn bāo diàn] [的|de] [坡|pō] [了|le] 。 [变老|biàn lǎo] [可|kě] [不|bù] [容易|róng yì] ！', 'パン[屋|や] へ の [坂|さか] が 、 もう [膝|ひざ] に つらくて 。 [年|とし] を とる の は [楽|らく] じゃ ない わ ！'),
    ], { job: 'knit', prop: 'knit' })] });
  // 22 the bookbinder
  H('molinar-house-22', { theme: 'bookbinder', people: [
    P('hernan', 'Hernán', 'man', 'hero', { skin: '#efc29a', hair: '#5a5048', dress: '#5a4a7a', apron: '#8a5f3e', legs: true, pants: '#3a3436', glasses: true, beard: true }, [
      T('A {w.book} is a house for words. I build the houses.', 'Un {w.book} es una casa para las palabras. Yo construyo las casas.', 'Um {w.book} é uma casa para as palavras. Eu construo as casas.', 'Ein {w.book} ist ein Haus für Wörter. Ich baue die Häuser.',
        '{w.book} [是|shì] [文字|wén zì] [的|de] [房子|fáng zi] 。 [我|wǒ] [负责|fù zé] [盖|gài] [房子|fáng zi] 。', '{w.book} は [言葉|ことば] の [家|いえ] です 。 わたし は その [家|いえ] を [建|た]てる ん です 。'),
      T('This one is three hundred years old. Its cover was falling off. Now look at it!', 'Este tiene trescientos años. Se le caía la tapa. ¡Y míralo ahora!', 'Este aqui tem trezentos anos. A capa estava caindo. Agora olha só!', 'Das hier ist dreihundert Jahre alt. Der Einband ist abgefallen. Und jetzt schau es dir an!',
        '[这|zhè] [本|běn] [有|yǒu] [三百|sān bǎi] [年|nián] [了|le] 。 [封面|fēng miàn] [都|dōu] [快|kuài] [掉|diào] [了|le] 。 [现在|xiàn zài] [你|nǐ] [看|kàn] ！', 'これ は [三百年|さんびゃくねん] [前|まえ] の [本|ほん] です 。 [表紙|ひょうし] が とれかけて いた 。 [今|いま] は どう です ！'),
      T('Smell that? Old paper and glue. Better than perfume.', '¿Hueles eso? Papel viejo y cola. Mejor que un perfume.', 'Sentiu o cheiro? Papel velho e cola. Melhor que perfume.', 'Riechst du das? Altes Papier und Leim. Besser als Parfüm.',
        '[闻到|wén dào] [了|le] [吗|ma] ？ [旧|jiù] [纸|zhǐ] [和|hé] [胶水|jiāo shuǐ] 。 [比|bǐ] [香水|xiāng shuǐ] [还|hái] [好闻|hǎo wén] 。', 'におい 、 わかります か ？ [古|ふる]い [紙|かみ] と のり 。 [香水|こうすい] より いい におい です 。'),
    ], { job: 'tinker', prop: 'tool' })] });
  // 23 the violinist
  H('molinar-house-23', { theme: 'violinist', people: [
    P('sol', 'Sol', 'woman', 'hero', { skin: '#f0c7a0', hair: '#1f1a18', hairdo: 'long', dress: '#2f8f86', scarf: '#f2c14e' }, [
      T('You heard me? Sorry. The neighbors say I play too early. Music doesn’t sleep!', '¿Me oíste? Perdón. Los vecinos dicen que toco muy temprano. ¡La música no duerme!', 'Você me ouviu? Desculpa. Os vizinhos dizem que eu toco cedo demais. A música não dorme!', 'Du hast mich gehört? Entschuldige. Die Nachbarn sagen, ich spiele zu früh. Musik schläft nicht!',
        '[你|nǐ] [听见|tīng jiàn] [了|le] ？ [不好意思|bù hǎo yì si] 。 [邻居|lín jū] [说|shuō] [我|wǒ] [拉|lā] [得|de] [太|tài] [早|zǎo] 。 [音乐|yīn yuè] [不|bù] [睡觉|shuì jiào] [嘛|ma] ！', '[聞|き]こえた ？ ごめんなさい 。 [近所|きんじょ] の [人|ひと] に 、 [朝|あさ] が [早|はや]すぎる って [言|い]われる の 。 [音楽|おんがく] は [眠|ねむ]らない の よ ！'),
      T('When the Hush came, I played every day. Silence doesn’t like music.', 'Cuando llegó el Silencio, toqué todos los días. Al silencio no le gusta la música.', 'Quando o Silêncio chegou, eu toquei todo dia. O silêncio não gosta de música.', 'Als die Stille kam, habe ich jeden Tag gespielt. Die Stille mag keine Musik.',
        '[寂静|Jì jìng] [来|lái] [的|de] [时候|shí hou] ， [我|wǒ] [每天|měi tiān] [都|dōu] [拉|lā] [琴|qín] 。 [寂静|jì jìng] [不|bù] [喜欢|xǐ huan] [音乐|yīn yuè] 。', '[静寂|せいじゃく] が [来|き]た とき 、 [毎日|まいにち] [弾|ひ]きました 。 [静寂|せいじゃく] は [音楽|おんがく] が きらい だ から 。'),
      T('One day I’ll play at the inn. A real concert! … Maybe.', 'Algún día voy a tocar en la posada. ¡Un concierto de verdad! … A lo mejor.', 'Um dia eu vou tocar na pousada. Um show de verdade! … Quem sabe.', 'Eines Tages spiele ich im Gasthaus. Ein richtiges Konzert! … Vielleicht.',
        '[总有一天|zǒng yǒu yī tiān] [我|wǒ] [要|yào] [在|zài] [旅店|lǚ diàn] [开|kāi] [音乐会|yīn yuè huì] 。 [真正|zhēn zhèng] [的|de] [音乐会|yīn yuè huì] ！ … [也许|yě xǔ] [吧|ba] 。', 'いつか [宿屋|やどや] で [弾|ひ]きたい の 。 [本物|ほんもの] の コンサート ！ … たぶん ね 。'),
    ], { job: 'strum', prop: 'violin' })] });
  // 24 the locksmith
  H('molinar-house-24', { theme: 'locksmith', people: [
    P('cesar', 'César', 'man', 'hero', { skin: '#c98e62', hair: '#2e2420', dress: '#5a6a8a', apron: '#3a3436', legs: true, pants: '#2f3440', stache: true, hat: 'cap', hatColor: '#3a3436' }, [
      T('Lost your key? Everyone in Molinar has lost a key. I know every door in town!', '¿Perdiste tu llave? Todo Molinar ha perdido alguna llave. ¡Conozco todas las puertas del pueblo!', 'Perdeu a sua chave? Todo mundo em Molinar já perdeu uma chave. Eu conheço todas as portas da cidade!', 'Schlüssel verloren? Jeder in Molinar hat schon mal einen Schlüssel verloren. Ich kenne jede Tür im Ort!',
        '[钥匙|yào shi] [丢|diū] [了|le] ？ [磨坊镇|Mò fáng zhèn] [每|měi] [个|gè] [人|rén] [都|dōu] [丢|diū] [过|guo] [钥匙|yào shi] 。 [镇上|zhèn shang] [每|měi] [一|yī] [扇|shàn] [门|mén] [我|wǒ] [都|dōu] [认识|rèn shi] ！', '[鍵|かぎ] を なくした ？ モリナール の みんな が 、 [一度|いちど] は [鍵|かぎ] を なくして る 。 [町|まち] の ドア は ぜんぶ [知|し]って る よ ！'),
      T('Every lock has a little song. Click, click, clack… open!', 'Cada cerradura tiene su cancioncita. Clic, clic, clac… ¡abierta!', 'Cada fechadura tem uma musiquinha. Clique, clique, claque… aberta!', 'Jedes Schloss hat ein kleines Lied. Klick, klick, klack … offen!',
        '[每|měi] [把|bǎ] [锁|suǒ] [都|dōu] [有|yǒu] [一|yī] [首|shǒu] [小|xiǎo] [歌|gē] 。 [咔|kā] 、 [咔|kā] 、 [嗒|dā] … [开|kāi] [了|le] ！', 'どの [錠|じょう] に も 、 [小|ちい]さな [歌|うた] が ある 。 カチ 、 カチ 、 カチャ … [開|あ]いた ！'),
      T('I only open doors for their owners. That’s the locksmith’s rule.', 'Solo abro puertas a sus dueños. Es la regla del cerrajero.', 'Eu só abro portas para os donos. É a regra do chaveiro.', 'Ich öffne Türen nur für ihre Besitzer. Das ist die Regel des Schlossers.',
        '[我|wǒ] [只|zhǐ] [给|gěi] [主人|zhǔ rén] [开|kāi] [门|mén] 。 [这|zhè] [是|shì] [锁匠|suǒ jiàng] [的|de] [规矩|guī ju] 。', 'ドア を [開|あ]ける の は 、 [持|も]ち[主|ぬし] の ため だけ 。 それ が [鍵屋|かぎや] の きまり さ 。'),
    ], { job: 'tinker', prop: 'tool' })] });
  // 25 the young traveler, leaving tomorrow (his quest: a good trip)
  H('molinar-house-25', { theme: 'packing', people: [
    P('ulises', 'Ulises', 'man', 'stand', { skin: '#dcae86', hair: '#c98a4a', hairdo: 'curly', dress: '#3f6fb5', legs: true, pants: '#c9b48a', h: 0.98, hat: 'cap', hatColor: '#e0743c' }, [
      T('Tomorrow I leave! First Remanso, then the sea, then… everywhere!', '¡Mañana me voy! Primero a Remanso, luego al mar, y luego… ¡a todas partes!', 'Amanhã eu vou embora! Primeiro Remanso, depois o mar, depois… o mundo todo!', 'Morgen geht’s los! Erst nach Remanso, dann ans Meer, dann … überallhin!',
        '[明天|míng tiān] [我|wǒ] [就|jiù] [出发|chū fā] [了|le] ！ [先|xiān] [去|qù] [静水村|Jìng shuǐ cūn] ， [再|zài] [去|qù] [海边|hǎi biān] ， [然后|rán hòu] … [到处|dào chù] [去|qù] ！', '[明日|あした] 、 [出発|しゅっぱつ] する ん だ ！ まず レマンソ 、 それ から [海|うみ] 、 それ から … どこ へ でも ！'),
      T('My mom cried. My grandma made me a sandwich. A very big sandwich.', 'Mi mamá lloró. Mi abuela me hizo un sándwich. Un sándwich enorme.', 'A minha mãe chorou. A minha avó fez um sanduíche pra mim. Um sanduíche enorme.', 'Meine Mama hat geweint. Meine Oma hat mir ein Brot geschmiert. Ein riesiges Brot.',
        '[我|wǒ] [妈妈|mā ma] [哭|kū] [了|le] 。 [我|wǒ] [奶奶|nǎi nai] [给|gěi] [我|wǒ] [做|zuò] [了|le] [一|yī] [个|gè] [三明治|sān míng zhì] 。 [超级|chāo jí] [大|dà] [的|de] [三明治|sān míng zhì] 。', '[母|はは] は [泣|な]いた 。 [祖母|そぼ] は サンドイッチ を [作|つく]って くれた 。 すごく [大|おお]きい サンドイッチ 。'),
      T('Have you ever been far from home? Is it scary? … It’s exciting. I think.', '¿Alguna vez estuviste lejos de casa? ¿Da miedo? … Es emocionante. Creo.', 'Você já ficou longe de casa? Dá medo? … É emocionante. Eu acho.', 'Warst du schon mal weit weg von zu Hause? Ist das gruselig? … Es ist aufregend. Glaube ich.',
        '[你|nǐ] [离开|lí kāi] [过|guo] [家|jiā] [很|hěn] [远|yuǎn] [吗|ma] ？ [可怕|kě pà] [吗|ma] ？ … [很|hěn] [刺激|cì jī] 。 [我|wǒ] [想|xiǎng] 。', '[家|いえ] から [遠|とお]く へ [行|い]った こと 、 ある ？ こわい ？ … わくわく する よ ね 。 たぶん 。'),
    ], { job: 'think' })] });
  // the farmhouse: Marga's father, who makes the cheese while she's out with her cart, and Tigre
  H('molinar-farmhouse', { theme: 'farm', people: [
    P('benito', 'Benito', 'grandpa', 'hero', { skin: '#c98e62', hair: '#d8d8d8', hairdo: 'bald', stache: true, dress: '#4f8a4a', apron: '#e8d9b8', legs: true, pants: '#4a3a33', hat: 'straw', hatColor: '#e8c57a', h: 0.95 }, [
      INTERIORS._.SAY.farmCheese,
      T('Fresh milk this morning, {w.cheese} in a month. Good things take time.', 'Leche fresca esta mañana, {w.cheese} en un mes. Lo bueno se hace esperar.', 'Leite fresco hoje de manhã, {w.cheese} daqui a um mês. O que é bom demora.', 'Frische Milch heute früh, {w.cheese} in einem Monat. Gut Ding will Weile haben.',
        '[今天|jīn tiān] [早上|zǎo shang] [是|shì] [鲜|xiān] [牛奶|niú nǎi] ， [一|yī] [个|gè] [月|yuè] [后|hòu] [就|jiù] [是|shì] {w.cheese} 。 [好|hǎo] [东西|dōng xi] [要|yào] [慢慢|màn màn] [来|lái] 。', '[朝|あさ] は しぼりたて の [牛乳|ぎゅうにゅう] 、 [一|いっ]か[月|げつ] [後|ご] に は {w.cheese} 。 いい もの は [時間|じかん] が かかる 。'),
      T('Marga pushes that cart up the hill every day. She gets that from her mother.', 'Marga sube esa carreta por la colina todos los días. Eso lo sacó de su mamá.', 'A Marga empurra aquela carroça morro acima todo dia. Isso ela puxou da mãe.', 'Marga schiebt den Karren jeden Tag den Hügel hoch. Das hat sie von ihrer Mutter.',
        '[玛尔加|Mǎ ěr jiā] [每天|měi tiān] [推|tuī] [着|zhe] [车|chē] [上|shàng] [山坡|shān pō] 。 [这|zhè] [一点|yī diǎn] [像|xiàng] [她|tā] [妈妈|mā ma] 。', 'マルガ は [毎日|まいにち] 、 あの [荷車|にぐるま] を [押|お]して [丘|おか] を [登|のぼ]る 。 [母親|ははおや] ゆずり だ よ 。'),
    ], { job: 'stir' })],
    pets: [PET('tigre', 'cat', 'Tigre', '#e0a050', 'cat', { pose: 'sleep' })] });
})();
// ============================================================ Molinar's side quests (the engine: interiors_quests.js)
// Each: someone uses the phrase first (in a woven line, the phrase in the language and out loud), then you say it, graded S–D.
(() => {
  if (typeof HQ === 'undefined' || !HQ) return;
  const { T, n } = HQ;
  const P = pid => HQ.person(pid);
  const say = (pid, L) => HQ.say(P(pid), L);
  const ask = async (task, o) => { const r = await HQ.ask(task, o); return r && !r.cancelled ? r.grade : null; };
  const worse = (a, b) => 'SABCD'[Math.max('SABCD'.indexOf(a || 'S'), 'SABCD'.indexOf(b || 'S'))];
  const G = () => HQ.G;
  const hqS = () => (G().state.hq = G().state.hq || {});
  // a grade said in one scene and rewarded in a later one
  const saveG = (q, g) => { const s = hqS(); s.grades = s.grades || {}; s.grades[q.id + ':g'] = worse(s.grades[q.id + ':g'], g); };
  const gotG = q => (hqS().grades || {})[q.id + ':g'] || 'B';
  const fadeRefresh = async door => { try { await UI.fade(1, 220); INTERIORS.refresh(door); await UI.fade(0, 220); } catch (e) { console.error('[hq]', e); } };
  const COMMON = HQ.COMMON || { later: T('No rush. Come back when you’re ready.', 'Sin prisa. Vuelve cuando quieras.', 'Sem pressa. Volta quando quiser.', 'Keine Eile. Komm wieder, wenn du so weit bist.',
    '[不|bù] [着急|zháo jí] 。 [准备|zhǔn bèi] [好|hǎo] [了|le] [再|zài] [来|lái] 。', 'あわてない で 。 [準備|じゅんび] が できたら 、 また [来|き]て ね 。') };

  // ---- 1. A blanket for the new baby (a delivery between neighbors) · «¡Felicidades!»
  HQ.phrase({ id: 'ph.hq.congrats', en: 'Congratulations!', es: '¡Felicidades!', pt: 'Parabéns!', de: 'Herzlichen Glückwunsch!', zh: '[恭喜|gōng xǐ] ！', ja: 'おめでとう ございます ！', note: 'For a new baby, a wedding, a new job. es also «¡Felicitaciones!», de short «Glückwunsch!», zh «恭喜恭喜！», ja to a friend «おめでとう！».' });
  HQ.keep({ id: 'k.hqBlanket', en: 'Gloria’s baby blanket', es: 'mantita', pt: 'mantinha', de: 'Babydecke', zh: '[小|xiǎo] [毯子|tǎn zi]', ja: '[赤|あか]ちゃん の [毛布|もうふ]', g: { es: 'f', pt: 'f', de: 'f' }, icon: 'gift' });
  const Q1 = HQ.quest({ id: 'hq.baby', home: 'molinar-house-10', homes: { gloria: 'molinar-house-10', raquel: 'molinar-house-01' }, done: 2, coins: 7, phrase: 'ph.hq.congrats',
    title: () => 'A blanket for the new baby', who: () => `${n('gloria')}, the weaver in Molinar`,
    steps: [{ until: 2, text: () => `Take Gloria’s blanket to ${n('raquel')}, and congratulate her`, why: 'Raquel and Andrés just had a baby girl. Their house is on the square’s east side, the one with the crib in the window.', hint: '{mimo} points toward the square.', at: ['molinar-house-01', 'raquel'] }],
    story: () => 'Gloria wove a yellow blanket for Raquel’s new baby. You took it over and said congratulations. The baby is called Paz.',
    lines: {
      offer: T('A new baby at Raquel’s house! I wove her a little blanket. Yellow, like the wheat.', '¡Hay una bebé nueva en la casa de Raquel! Le tejí una mantita. Amarilla, como el trigo.', 'Tem uma bebê nova na casa da Raquel! Eu teci uma mantinha pra ela. Amarela, como o trigo.', 'Bei Raquel gibt es ein neues Baby! Ich habe ihr eine kleine Decke gewebt. Gelb, wie der Weizen.',
        '[拉克尔|Lā kè ěr] [家|jiā] [有|yǒu] [小|xiǎo] [宝宝|bǎo bao] [了|le] ！ [我|wǒ] [给|gěi] [她|tā] [织|zhī] [了|le] [一|yī] [条|tiáo] [小|xiǎo] [毯子|tǎn zi] 。 [黄色|huáng sè] [的|de] ， [像|xiàng] [麦子|mài zi] [一样|yī yàng] 。', 'ラケル さん の [家|いえ] に [赤|あか]ちゃん が [生|う]まれた の ！ [小|ちい]さな [毛布|もうふ] を [織|お]った の よ 。 [麦|むぎ] みたい な [黄色|きいろ] 。'),
      demo: T('When a baby is born, everybody says: “Congratulations!” It’s the happiest word there is.', 'Cuando nace un bebé, todos dicen: «¡Felicidades!» Es la palabra más feliz que hay.', 'Quando nasce um bebê, todo mundo diz: «Parabéns!» É a palavra mais feliz que existe.', 'Wenn ein Baby kommt, sagen alle: „Herzlichen Glückwunsch!“ Das sind die fröhlichsten Worte, die es gibt.',
        '[有|yǒu] [宝宝|bǎo bao] [出生|chū shēng] [的|de] [时候|shí hou] ， [大家|dà jiā] [都|dōu] [说|shuō] ： “ [恭喜|gōng xǐ] ！ ” [这|zhè] [是|shì] [最|zuì] [快乐|kuài lè] [的|de] [一|yī] [句|jù] [话|huà] 。', '[赤|あか]ちゃん が [生|う]まれる と 、 みんな 「 おめでとう ございます ！ 」 って [言|い]う の 。 いちばん しあわせ な [言葉|ことば] よ 。'),
      please: T('My legs are slow, and the blanket is ready. Could you take it to her? And congratulate them for me!', 'Mis piernas son lentas, y la mantita ya está lista. ¿Se la llevas? ¡Y felicítalos de mi parte!', 'As minhas pernas são lentas, e a mantinha já está pronta. Você leva pra ela? E dá os parabéns por mim!', 'Meine Beine sind langsam, und die Decke ist fertig. Bringst du sie hin? Und gratulier ihnen von mir!',
        '[我|wǒ] [腿脚|tuǐ jiǎo] [慢|màn] ， [毯子|tǎn zi] [已经|yǐ jīng] [织|zhī] [好|hǎo] [了|le] 。 [你|nǐ] [能|néng] [帮|bāng] [我|wǒ] [送|sòng] [过去|guò qù] [吗|ma] ？ [再|zài] [替|tì] [我|wǒ] [说|shuō] [声|shēng] [恭喜|gōng xǐ] ！', '[足|あし] が [遅|おそ]くて ね 。 [毛布|もうふ] は もう できた の 。 [届|とど]けて くれる ？ わたし の かわり に 、 おめでとう も [言|い]って ね ！'),
      wait: T('Did you take the blanket to Raquel’s? The house with the new baby!', '¿Ya le llevaste la mantita a Raquel? ¡La casa de la bebé nueva!', 'Já levou a mantinha pra Raquel? A casa da bebê nova!', 'Hast du Raquel die Decke schon gebracht? Das Haus mit dem neuen Baby!',
        '[毯子|tǎn zi] [送|sòng] [到|dào] [拉克尔|Lā kè ěr] [家|jiā] [了|le] [吗|ma] ？ [就是|jiù shì] [有|yǒu] [小|xiǎo] [宝宝|bǎo bao] [的|de] [那|nà] [家|jiā] ！', 'ラケル さん に [毛布|もうふ] 、 [届|とど]けた ？ [赤|あか]ちゃん の いる [家|いえ] よ ！'),
      thanks: T('From Gloria? Oh, it’s beautiful! And so soft… Thank you! Her name is Paz, by the way.', '¿De Gloria? ¡Ay, qué preciosa! Y tan suavecita… ¡Gracias! Por cierto, se llama Paz.', 'Da Gloria? Ai, que linda! E tão macia… Obrigada! Aliás, o nome dela é Paz.', 'Von Gloria? Oh, die ist wunderschön! Und so weich … Danke! Sie heißt übrigens Paz.',
        '[格洛丽亚|Gé luò lì yà] [织|zhī] [的|de] ？ [哎呀|āi yā] ， [真|zhēn] [漂亮|piào liang] ！ [好|hǎo] [软|ruǎn] … [谢谢|xiè xie] ！ [对|duì] [了|le] ， [她|tā] [叫|jiào] [帕斯|Pà sī] 。', 'グロリア さん から ？ まあ 、 きれい ！ それ に ふわふわ … ありがとう ！ そう そう 、 この [子|こ] の [名前|なまえ] は パス です 。'),
      after: T('Paz sleeps better under Gloria’s blanket. Maybe it’s magic.', 'Paz duerme mejor con la mantita de Gloria. A lo mejor es mágica.', 'A Paz dorme melhor com a mantinha da Gloria. Vai ver que é mágica.', 'Paz schläft unter Glorias Decke besser. Vielleicht ist sie verzaubert.',
        '[盖|gài] [着|zhe] [格洛丽亚|Gé luò lì yà] [的|de] [毯子|tǎn zi] ， [帕斯|Pà sī] [睡|shuì] [得|de] [更|gèng] [好|hǎo] 。 [也许|yě xǔ] [有|yǒu] [魔法|mó fǎ] 。', 'グロリア さん の [毛布|もうふ] だ と 、 パス は よく [眠|ねむ]る の 。 [魔法|まほう] かも しれません ね 。'),
      news: T('Raquel sent word: the blanket fits! And the baby is called Paz. What a good name.', 'Raquel me mandó a decir: ¡la mantita le queda perfecta! Y la bebé se llama Paz. Qué buen nombre.', 'A Raquel mandou dizer: a mantinha serviu direitinho! E a bebê se chama Paz. Que nome bonito.', 'Raquel hat Bescheid gegeben: Die Decke passt! Und das Baby heißt Paz. Was für ein schöner Name.',
        '[拉克尔|Lā kè ěr] [捎|shāo] [话|huà] [来|lái] [说|shuō] ， [毯子|tǎn zi] [正|zhèng] [合适|hé shì] ！ [宝宝|bǎo bao] [叫|jiào] [帕斯|Pà sī] 。 [多|duō] [好|hǎo] [的|de] [名字|míng zi] 。', 'ラケル さん から [聞|き]いた わ 。 [毛布|もうふ] 、 ぴったり だった って ！ [赤|あか]ちゃん は パス ちゃん 。 いい [名前|なまえ] ね 。'),
    },
    tasks: { congrats: { en: 'Congratulations!', model: { es: '¡Felicidades!', pt: 'Parabéns!', de: 'Herzlichen Glückwunsch!', zh: '[恭喜|gōng xǐ] ！', ja: 'おめでとう ございます ！' },
      ok: { es: ['¡Felicitaciones!', '¡Muchas felicidades!', '¡Felicidades a los dos!', '¡Felicidades, Raquel!', '¡Enhorabuena!'], pt: ['Parabéns pela bebê!', 'Parabéns pra vocês!', 'Meus parabéns!', 'Parabéns, Raquel!'], de: ['Glückwunsch!', 'Herzlichen Glückwunsch zur Geburt!', 'Herzlichen Glückwunsch, Raquel!', 'Alles Gute!'],
        zh: ['[恭喜|gōng xǐ] [恭喜|gōng xǐ] ！', '[恭喜|gōng xǐ] [你们|nǐ men] ！'], ja: ['おめでとう ！', 'おめでとう ございます 、 ラケル さん ！', 'ご[出産|しゅっさん] おめでとう ございます ！'] },
      keys: { es: [['felicidades', 'felicitaciones', 'enhorabuena']], pt: [['parabens']], de: [['gluckwunsch']], zh: [['gongxi']], ja: [['omedeto']] } } },
    talk: {
      gloria: st => (st === 0 ? async () => { HQ.lock(true); await say('gloria', Q1.lines.offer); await HQ.demo(P('gloria'), Q1.lines.demo, Q1.tasks.congrats); await say('gloria', Q1.lines.please); HQ.give('k.hqBlanket'); HQ.setStage('hq.baby', 1); UI.toast(`🎁 ${HQ.itemName('k.hqBlanket')} (in your bag)`); }
        : st === 1 ? () => say('gloria', Q1.lines.wait)
        : st >= 2 && Math.random() < 0.5 ? () => say('gloria', Q1.lines.news) : null),
      raquel: st => (st === 1 ? async () => {
        HQ.lock(true); await HQ.me('Gloria, the weaver, made something for the baby…');
        const g = await ask(Q1.tasks.congrats, { title: `Give ${n('raquel')} the blanket, and congratulate her!`, icon: 'gift' });
        if (!g) { await say('raquel', COMMON.later); return; }
        HQ.take('k.hqBlanket'); await say('raquel', Q1.lines.thanks); HQ.setStage('hq.baby', 2); HQ.reward(Q1, g);
      } : st >= 2 && Math.random() < 0.5 ? () => say('raquel', Q1.lines.after) : null),
    },
    mark: { gloria: st => (st === 0 ? '!' : null), raquel: st => (st === 1 ? '◆' : null) } });

  // ---- 2. Forty-two clocks (a favor between neighbors) · «¿Qué hora es?», then «Son las tres»
  HQ.phrase({ id: 'ph.hq.time', en: 'What time is it?', es: '¿Qué hora es?', pt: 'Que horas são?', de: 'Wie spät ist es?', zh: '[现在|xiàn zài] [几|jǐ] [点|diǎn] ？', ja: '[今|いま] [何時|なんじ] です か ？', note: 'The answer: es «Son las tres» (but «Es la una»), pt «São três horas», de «Es ist drei Uhr», zh «三点», ja «三時です».' });
  HQ.keep({ id: 'k.hqCuckoo', en: 'a little wooden cuckoo', es: 'cuquito de madera', pt: 'cuquinho de madeira', de: 'Holzkuckuck', zh: '[木头|mù tou] [布谷鸟|bù gǔ niǎo]', ja: '[木|き] の カッコー', g: { es: 'm', pt: 'm', de: 'm' }, icon: 'bird' });
  const ALMA = () => INTERIORS.displayName('kid', 'Alma');
  const Q2 = HQ.quest({ id: 'hq.time', home: 'molinar-house-03', homes: { teodoro: 'molinar-house-03', alma: 'molinar-clockmaker' }, done: 3, coins: 8, phrase: 'ph.hq.time', keep: 'k.hqCuckoo',
    title: () => 'Forty-two clocks', who: () => `${n('teodoro')}, the clock collector in Molinar`,
    steps: [{ until: 2, text: () => `Ask ${ALMA()} at the clockmaker’s: “What time is it?”`, why: 'Teodoro’s forty-two clocks all say something else. Ciro’s apprentice always knows the right time.', hint: '{mimo} points at the shop with the big clock.', at: ['molinar-clockmaker', 'alma'] },
      { until: 3, text: () => `Tell ${n('teodoro')} the time`, why: 'He’s waiting by his clocks, key in hand, to set them all.', hint: '{mimo} hops back toward Teodoro’s house.', at: ['molinar-house-03', 'teodoro'] }],
    story: () => 'Teodoro’s forty-two clocks all said something else. You asked Alma at the clockmaker’s what time it was, and now all forty-two say three o’clock.',
    lines: {
      offer: T('Look at them! This one says two, that one says five… Which one is right? I don’t know anymore!', '¡Míralos! Este dice las dos, ese dice las cinco… ¿Cuál tiene razón? ¡Ya no lo sé!', 'Olha só! Este diz duas, aquele diz cinco… Qual está certo? Eu não sei mais!', 'Schau sie dir an! Die hier sagt zwei, die da sagt fünf … Welche hat recht? Ich weiß es nicht mehr!',
        '[你|nǐ] [看|kàn] ！ [这|zhè] [个|gè] [说|shuō] [两|liǎng] [点|diǎn] ， [那|nà] [个|gè] [说|shuō] [五|wǔ] [点|diǎn] … [哪|nǎ] [个|gè] [对|duì] ？ [我|wǒ] [也|yě] [不|bù] [知道|zhī dào] [了|le] ！', '[見|み]て ください ！ これ は [二時|にじ] 、 あれ は [五時|ごじ] … どれ が [正|ただ]しい ？ もう わかりません ！'),
      demo: T('Alma, at the clockmaker’s, always knows. Just ask her: “What time is it?”', 'Alma, la de la relojería, siempre lo sabe. Pregúntale: «¿Qué hora es?»', 'A Alma, da relojoaria, sempre sabe. É só perguntar: «Que horas são?»', 'Alma beim Uhrmacher weiß es immer. Frag sie einfach: „Wie spät ist es?“',
        '[钟表店|zhōng biǎo diàn] [的|de] [阿尔玛|Ā ěr mǎ] [总是|zǒng shì] [知道|zhī dào] 。 [你|nǐ] [就|jiù] [问|wèn] [她|tā] ： “ [现在|xiàn zài] [几|jǐ] [点|diǎn] ？ ”', '[時計屋|とけいや] の アルマ さん なら 、 いつも [知|し]って います 。 「 [今|いま] [何時|なんじ] です か ？ 」 と [聞|き]いて ください 。'),
      please: T('Then come back and tell me. My knees and the stairs at Ciro’s… not friends.', 'Luego vuelve y me dices. Mis rodillas y la escalera de Ciro… no se llevan bien.', 'Depois volta e me conta. Os meus joelhos e a escada do Ciro… não se dão bem.', 'Dann komm zurück und sag es mir. Meine Knie und Ciros Treppe … keine Freunde.',
        '[然后|rán hòu] [回来|huí lái] [告诉|gào su] [我|wǒ] 。 [我|wǒ] [的|de] [膝盖|xī gài] [和|hé] [西罗|Xī luó] [家|jiā] [的|de] [楼梯|lóu tī] … [合|hé] [不|bù] [来|lái] 。', 'それ から 、 [戻|もど]って [教|おし]えて ください 。 わたし の [膝|ひざ] と シロ さん の [階段|かいだん] は … [仲|なか] が [悪|わる]くて ね 。'),
      wait: T('Did you ask Alma? The clockmaker’s is the shop with the big clock.', '¿Le preguntaste a Alma? La relojería es la tienda del reloj grande.', 'Perguntou pra Alma? A relojoaria é a loja do relógio grande.', 'Hast du Alma gefragt? Der Uhrmacher ist der Laden mit der großen Uhr.',
        '[你|nǐ] [问|wèn] [阿尔玛|Ā ěr mǎ] [了|le] [吗|ma] ？ [钟表店|zhōng biǎo diàn] [就是|jiù shì] [有|yǒu] [大|dà] [钟|zhōng] [的|de] [那|nà] [家|jiā] [店|diàn] 。', 'アルマ さん に [聞|き]きました か ？ [時計屋|とけいや] は 、 [大|おお]きな [時計|とけい] の ある [店|みせ] です よ 。'),
      three: T('Let me look at the master clock… It’s three o’clock! Exactly three.', 'A ver el reloj maestro… ¡Son las tres! Las tres en punto.', 'Deixa eu ver o relógio-mestre… São três horas! Três em ponto.', 'Ich schau mal auf die Hauptuhr … Es ist drei Uhr! Genau drei.',
        '[我|wǒ] [看看|kàn kan] [主|zhǔ] [钟|zhōng] … [三|sān] [点|diǎn] ！ [正好|zhèng hǎo] [三|sān] [点|diǎn] 。', 'いちばん [正確|せいかく] な [時計|とけい] を [見|み]る ね … [三時|さんじ] です ！ ちょうど [三時|さんじ] 。'),
      hello: T('Tell Don Teodoro that Ciro says hello. And that he has too many clocks!', 'Dile a don Teodoro que Ciro le manda saludos. ¡Y que tiene demasiados relojes!', 'Diz pro seu Teodoro que o Ciro mandou um abraço. E que ele tem relógio demais!', 'Sag Herrn Teodoro schöne Grüße von Ciro. Und dass er zu viele Uhren hat!',
        '[告诉|gào su] [特奥多罗|Tè ào duō luó] [爷爷|yé ye] ， [西罗|Xī luó] [问|wèn] [他|tā] [好|hǎo] 。 [还有|hái yǒu] ， [他|tā] [的|de] [钟|zhōng] [太|tài] [多|duō] [了|le] ！', 'テオドロ さん に 、 シロ さん が よろしく って 。 それ と 、 [時計|とけい] が [多|おお]すぎる って ！'),
      thanks: T('It’s three o’clock! … There. Forty-two clocks, all saying the same thing. Listen!', '¡Son las tres! … Listo. Cuarenta y dos relojes diciendo lo mismo. ¡Escucha!', 'São três horas! … Pronto. Quarenta e dois relógios dizendo a mesma coisa. Escuta!', 'Es ist drei Uhr! … So. Zweiundvierzig Uhren, die alle dasselbe sagen. Hör mal!',
        '[三|sān] [点|diǎn] ！ … [好|hǎo] [了|le] 。 [四十二|sì shí èr] [个|gè] [钟|zhōng] ， [全|quán] [都|dōu] [一样|yī yàng] [了|le] 。 [你|nǐ] [听|tīng] ！', '[三時|さんじ] です ！ … よし 。 [四十二|よんじゅうに] [個|こ] の [時計|とけい] が 、 ぜんぶ [同|おな]じ 。 [聞|き]いて ！'),
      cuckoo: T('Cuckoo! Cuckoo! Cuckoo! … Here, take this little cuckoo. It’s never late.', '¡Cucú! ¡Cucú! ¡Cucú! … Toma este cuquito. Nunca llega tarde.', 'Cuco! Cuco! Cuco! … Toma este cuquinho. Ele nunca atrasa.', 'Kuckuck! Kuckuck! Kuckuck! … Hier, nimm diesen kleinen Kuckuck. Der ist nie zu spät.',
        '[布谷|bù gǔ] ！ [布谷|bù gǔ] ！ [布谷|bù gǔ] ！ … [这|zhè] [只|zhī] [小|xiǎo] [布谷鸟|bù gǔ niǎo] [送|sòng] [给|gěi] [你|nǐ] 。 [它|tā] [从来|cóng lái] [不|bù] [迟到|chí dào] 。', 'カッコー ！ カッコー ！ カッコー ！ … この [小|ちい]さな カッコー を どうぞ 。 [一度|いちど] も おくれた こと が ない ん です よ 。'),
      after: T('Three clocks are already wrong again. It’s a hobby, not a job!', 'Tres relojes ya están mal otra vez. ¡Es un pasatiempo, no un trabajo!', 'Três relógios já estão errados de novo. É um passatempo, não um trabalho!', 'Drei Uhren gehen schon wieder falsch. Das ist ein Hobby, keine Arbeit!',
        '[又|yòu] [有|yǒu] [三|sān] [个|gè] [钟|zhōng] [不|bù] [准|zhǔn] [了|le] 。 [这|zhè] [是|shì] [爱好|ài hào] ， [不|bù] [是|shì] [工作|gōng zuò] ！', 'もう [三|みっ]つ の [時計|とけい] が また ずれて います 。 これ は [趣味|しゅみ] です 、 [仕事|しごと] じゃ ない ！'),
    },
    tasks: {
      ask: { en: 'What time is it?', model: { es: '¿Qué hora es?', pt: 'Que horas são?', de: 'Wie spät ist es?', zh: '[现在|xiàn zài] [几|jǐ] [点|diǎn] ？', ja: '[今|いま] [何時|なんじ] です か ？' },
        ok: { es: ['¿Qué horas son?', '¿Qué hora es, Alma?', 'Perdón, ¿qué hora es?', '¿Me dices la hora?'], pt: ['Que hora é?', 'Que horas são, Alma?', 'Você sabe que horas são?'], de: ['Wie viel Uhr ist es?', 'Wie spät ist es, Alma?', 'Entschuldigung, wie spät ist es?'],
          zh: ['[几|jǐ] [点|diǎn] [了|le] ？', '[现在|xiàn zài] [几|jǐ] [点|diǎn] [了|le] ？', '[请问|qǐng wèn] ， [现在|xiàn zài] [几|jǐ] [点|diǎn] ？'], ja: ['[何時|なんじ] です か ？', '[今|いま] [何時|なんじ] ？', 'すみません 、 [今|いま] [何時|なんじ] です か ？'] },
        keys: { es: [['hora', 'horas']], pt: [['horas', 'hora']], de: [['spat', 'uhr']], zh: [['jidian']], ja: [['nanji']] } },
      three: { en: 'It’s three o’clock.', model: { es: 'Son las tres.', pt: 'São três horas.', de: 'Es ist drei Uhr.', zh: '[三|sān] [点|diǎn] 。', ja: '[三時|さんじ] です 。' },
        ok: { es: ['Las tres.', 'Son las tres en punto.', 'Son las tres, don Teodoro.'], pt: ['Três horas.', 'São três.', 'São três em ponto.', 'São três horas em ponto.'], de: ['Drei Uhr.', 'Es ist drei.', 'Es ist genau drei Uhr.'],
          zh: ['[现在|xiàn zài] [三|sān] [点|diǎn] 。', '[三|sān] [点|diǎn] [整|zhěng] 。', '[三|sān] [点|diǎn] [了|le] 。'], ja: ['[三時|さんじ] 。', '[今|いま] [三時|さんじ] です 。', 'ちょうど [三時|さんじ] です 。'] },
        keys: { es: [['tres']], pt: [['tres']], de: [['drei']], zh: [['sandian']], ja: [['sanji']] } },
    },
    talk: {
      teodoro: st => (st === 0 ? async () => { HQ.lock(true); await say('teodoro', Q2.lines.offer); await HQ.demo(P('teodoro'), Q2.lines.demo, Q2.tasks.ask); await say('teodoro', Q2.lines.please); HQ.setStage('hq.time', 1); }
        : st === 1 ? () => say('teodoro', Q2.lines.wait)
        : st === 2 ? async () => {
          HQ.lock(true); await HQ.me('I asked Alma, at the clockmaker’s!');
          const g = await ask(Q2.tasks.three, { title: `Tell ${n('teodoro')} the time`, icon: 'clock' });
          if (!g) { await say('teodoro', COMMON.later); return; }
          saveG(Q2, g); await HQ.demo(P('teodoro'), Q2.lines.thanks, Q2.tasks.three); await say('teodoro', Q2.lines.cuckoo); HQ.setStage('hq.time', 3); HQ.reward(Q2, gotG(Q2));
        } : st >= 3 && Math.random() < 0.5 ? () => say('teodoro', Q2.lines.after) : null),
      alma: st => (st === 1 ? async () => {
        HQ.lock(true);
        const g = await ask(Q2.tasks.ask, { title: `Ask ${ALMA()}: “What time is it?”`, icon: 'clock' });
        if (!g) return;
        saveG(Q2, g); await HQ.demo(P('alma'), Q2.lines.three, Q2.tasks.three); await say('alma', Q2.lines.hello); HQ.setStage('hq.time', 2);
      } : null),
    },
    mark: { teodoro: st => (st === 0 ? '!' : st === 2 ? '◆' : null), alma: st => (st === 1 ? '◆' : null) } });

  // ---- 3. Pipo won't sit (a pet) · «¡Siéntate!»
  HQ.phrase({ id: 'ph.hq.sit', en: 'Sit!', es: '¡Siéntate!', pt: 'Senta!', de: 'Sitz!', zh: '[坐|zuò] ！', ja: 'おすわり ！', note: 'To a dog. To a person: es «Siéntate» (polite «Siéntese»), pt «Senta aí», de «Setz dich», zh «坐吧», ja «座って».' });
  HQ.keep({ id: 'k.hqWhistle', en: 'Fermín’s old shepherd’s whistle', es: 'silbato de pastor', pt: 'apito de pastor', de: 'Hirtenpfeife', zh: '[牧羊|mù yáng] [哨子|shào zi]', ja: '[羊飼|ひつじか]い の [笛|ふえ]', g: { es: 'm', pt: 'm', de: 'f' }, icon: 'music' });
  const Q3 = HQ.quest({ id: 'hq.sit', home: 'molinar-house-08', done: 3, coins: 6, phrase: 'ph.hq.sit', keep: 'k.hqWhistle',
    title: () => 'Pipo won’t sit', who: () => `${n('fermin')}, the shepherd in Molinar`,
    steps: [{ until: 2, text: () => 'Tell Pipo the puppy to sit', why: 'Fermín’s old dog Canela learned it in one word. The puppy only rolls around for him.', hint: '{mimo} watches the puppy roll around.', at: ['molinar-house-08', 'pipo'] },
      { until: 3, text: () => `Show ${n('fermin')}`, why: 'He’s in his armchair by the fire, pretending not to watch.', hint: '{mimo} trots over to the armchair.', at: ['molinar-house-08', 'fermin'] }],
    story: () => 'Pipo, Fermín’s puppy, never listened. You told him to sit, and he sat, very straight and very proud.',
    lines: {
      offer: T('Pipo! Pipo, no! … He won’t listen to me. He just rolls around on the floor.', '¡Pipo! ¡Pipo, no! … No me hace caso. Solo se revuelca en el piso.', 'Pipo! Pipo, não! … Ele não me escuta. Só fica rolando no chão.', 'Pipo! Pipo, nein! … Er hört nicht auf mich. Er wälzt sich nur auf dem Boden.',
        '[皮波|Pí bō] ！ [皮波|Pí bō] ， [不|bù] [行|xíng] ！ … [它|tā] [不|bù] [听|tīng] [我|wǒ] [的|de] 。 [只|zhǐ] [会|huì] [在|zài] [地上|dì shang] [打滚|dǎ gǔn] 。', 'ピポ ！ ピポ 、 だめ ！ … [言|い]う こと を [聞|き]かない ん だ 。 [床|ゆか] で ごろごろ する だけ 。'),
      demo: T('Watch Canela. Canela, sit! … See? One word: “Sit!” Twelve years, and she never forgot it.', 'Mira a Canela. Canela, ¡siéntate! … ¿Ves? Una palabra: «¡Siéntate!» Doce años, y nunca se le olvidó.', 'Olha a Canela. Canela, senta! … Viu? Uma palavra: «Senta!» Doze anos, e ela nunca esqueceu.', 'Schau dir Canela an. Canela, sitz! … Siehst du? Ein Wort: „Sitz!“ Zwölf Jahre, und sie hat es nie vergessen.',
        '[你|nǐ] [看|kàn] [肉桂|Ròu guì] 。 [肉桂|Ròu guì] ， [坐|zuò] ！ … [看见|kàn jiàn] [了|le] [吗|ma] ？ [就|jiù] [一|yī] [个|gè] [字|zì] ： “ [坐|zuò] ！ ” [十二|shí èr] [年|nián] [了|le] ， [它|tā] [从来|cóng lái] [没|méi] [忘|wàng] [过|guo] 。', 'シナモン を [見|み]て て 。 シナモン 、 おすわり ！ … ほら ね ？ [一言|ひとこと] だけ 。 「 おすわり ！ 」 [十二年|じゅうにねん] 、 [一度|いちど] も [忘|わす]れなかった 。'),
      please: T('Pipo is too young to learn from an old man. Maybe from you? Tell him: “Sit!”', 'Pipo es muy joven para aprender de un viejo. ¿A lo mejor de ti? Dile: «¡Siéntate!»', 'O Pipo é novo demais pra aprender com um velho. Quem sabe com você? Diz pra ele: «Senta!»', 'Pipo ist zu jung, um von einem alten Mann zu lernen. Vielleicht von dir? Sag ihm: „Sitz!“',
        '[皮波|Pí bō] [太|tài] [小|xiǎo] [了|le] ， [不|bù] [听|tīng] [老头|lǎo tóu] [的|de] 。 [也许|yě xǔ] [听|tīng] [你|nǐ] [的|de] ？ [你|nǐ] [跟|gēn] [它|tā] [说|shuō] ： “ [坐|zuò] ！ ”', 'ピポ は [若|わか]すぎて 、 じいさん の [言|い]う こと は [聞|き]かない 。 [君|きみ] なら どう かな ？ 「 おすわり ！ 」 って [言|い]って ごらん 。'),
      wait: T('Pipo is by the table. Go on, tell him!', 'Pipo está junto a la mesa. ¡Anda, díselo!', 'O Pipo tá perto da mesa. Vai, fala pra ele!', 'Pipo liegt beim Tisch. Los, sag es ihm!',
        '[皮波|Pí bō] [在|zài] [桌子|zhuō zi] [旁边|páng biān] 。 [去|qù] [吧|ba] ， [跟|gēn] [它|tā] [说|shuō] ！', 'ピポ は テーブル の そば だ 。 さあ 、 [言|い]って ごらん ！'),
      roll: T('Arf! (Pipo rolls over and wags his tail.)', '¡Guau! (Pipo se da vuelta y mueve la cola.)', 'Au! (O Pipo rola e abana o rabo.)', 'Wuff! (Pipo rollt sich herum und wedelt mit dem Schwanz.)',
        '[汪|wāng] ！ （ [皮波|Pí bō] [打|dǎ] [了|le] [个|gè] [滚|gǔn] ， [摇|yáo] [着|zhe] [尾巴|wěi ba] 。 ）', 'ワン ！ （ ピポ が ころん と [転|ころ]がって 、 しっぽ を [振|ふ]る 。 ）'),
      sits: T('Arf! (Pipo sits. Very straight. Very proud.)', '¡Guau! (Pipo se sienta. Muy derechito. Muy orgulloso.)', 'Au! (O Pipo senta. Bem retinho. Todo orgulhoso.)', 'Wuff! (Pipo sitzt. Ganz gerade. Ganz stolz.)',
        '[汪|wāng] ！ （ [皮波|Pí bō] [坐|zuò] [下|xià] [了|le] 。 [坐|zuò] [得|de] [笔直|bǐ zhí] ， [很|hěn] [得意|dé yì] 。 ）', 'ワン ！ （ ピポ が すわった 。 [背|せ]すじ を のばして 、 とくい そう 。 ）'),
      thanks: T('He sat! For you! Ha! Take my old whistle. You’ve got a shepherd’s voice.', '¡Se sentó! ¡Contigo! ¡Ja! Toma mi silbato viejo. Tienes voz de pastor.', 'Ele sentou! Com você! Rá! Toma o meu apito velho. Você tem voz de pastor.', 'Er sitzt! Bei dir! Ha! Nimm meine alte Pfeife. Du hast eine Hirtenstimme.',
        '[它|tā] [坐|zuò] [下|xià] [了|le] ！ [听|tīng] [你|nǐ] [的|de] ！ [哈|hā] ！ [我|wǒ] [的|de] [旧|jiù] [哨子|shào zi] [给|gěi] [你|nǐ] 。 [你|nǐ] [有|yǒu] [牧羊人|mù yáng rén] [的|de] [嗓子|sǎng zi] 。', 'すわった ！ [君|きみ] の [言|い]う こと を [聞|き]いた ！ はは ！ この [古|ふる]い [笛|ふえ] を やろう 。 [君|きみ] は [羊飼|ひつじか]い の [声|こえ] を して いる 。'),
      after: T('Now Pipo sits for everyone. Even for the postman. Especially for the postman.', 'Ahora Pipo se sienta para todos. Hasta para el cartero. Sobre todo para el cartero.', 'Agora o Pipo senta pra todo mundo. Até pro carteiro. Principalmente pro carteiro.', 'Jetzt sitzt Pipo für alle. Sogar für den Postboten. Vor allem für den Postboten.',
        '[现在|xiàn zài] [皮波|Pí bō] [对|duì] [谁|shéi] [都|dōu] [坐|zuò] [下|xià] 。 [连|lián] [邮递员|yóu dì yuán] [也|yě] [是|shì] 。 [尤其|yóu qí] [是|shì] [邮递员|yóu dì yuán] 。', '[今|いま] じゃ ピポ は だれ に でも おすわり する 。 [郵便屋|ゆうびんや]さん に も 。 とくに [郵便屋|ゆうびんや]さん に ね 。'),
    },
    tasks: { sit: { en: 'Sit!', model: { es: '¡Siéntate!', pt: 'Senta!', de: 'Sitz!', zh: '[坐|zuò] ！', ja: 'おすわり ！' },
      ok: { es: ['¡Sentado!', '¡Siéntate, Pipo!', '¡Pipo, siéntate!', '¡Sentado, Pipo!', '¡Sienta!'], pt: ['Senta, Pipo!', 'Pipo, senta!', 'Sentado!', 'Senta aí!'], de: ['Sitz, Pipo!', 'Pipo, sitz!', 'Mach Sitz!'],
        zh: ['[坐下|zuò xià] ！', '[皮波|Pí bō] ， [坐|zuò] ！', '[坐|zuò] ， [皮波|Pí bō] ！'], ja: ['ピポ 、 おすわり ！', 'おすわり 、 ピポ ！', 'すわれ ！'] },
      keys: { es: [['sientate', 'sentado', 'sienta']], pt: [['senta', 'sentado']], de: [['sitz']], zh: [['zuo']], ja: [['osuwari', 'suware']] } } },
    talk: {
      fermin: st => (st === 0 ? async () => { HQ.lock(true); await say('fermin', Q3.lines.offer); await HQ.demo(P('fermin'), Q3.lines.demo, Q3.tasks.sit); await say('fermin', Q3.lines.please); HQ.setStage('hq.sit', 1); }
        : st === 1 ? () => say('fermin', Q3.lines.wait)
        : st === 2 ? async () => { HQ.lock(true); await HQ.me('Look! Pipo sat!'); await say('fermin', Q3.lines.thanks); HQ.setStage('hq.sit', 3); HQ.reward(Q3, gotG(Q3)); }
        : Math.random() < 0.5 ? () => say('fermin', Q3.lines.after) : null),
      pipo: st => (st === 1 ? async () => {
        HQ.lock(true); await say('pipo', Q3.lines.roll);
        const g = await ask(Q3.tasks.sit, { title: 'Tell Pipo: “Sit!”', icon: 'star' });
        if (!g) return;
        saveG(Q3, g); HQ.setStage('hq.sit', 2); await fadeRefresh('molinar-house-08');
        const p = P('pipo'); if (p) { p.S.purr = 3; await HQ.say(p, Q3.lines.sits); }
      } : null),
    },
    mark: { fermin: st => (st === 0 ? '!' : st === 2 ? '◆' : null), pipo: st => (st === 1 ? '◆' : null) } });
  // ---- 4. Soup for Eusebio (a favor, upstairs) · «¡Que te mejores!»
  HQ.phrase({ id: 'ph.hq.better', en: 'Get well soon!', es: '¡Que te mejores!', pt: 'Melhoras!', de: 'Gute Besserung!', zh: '[早日|zǎo rì] [康复|kāng fù] ！', ja: 'お[大事|だいじ] に ！', note: 'To someone who is ill. Polite: es «¡Que se mejore!», zh «祝您早日康复！», ja «お大事になさってください».' });
  HQ.keep({ id: 'k.hqSoup', en: 'a bowl of Socorro’s soup', es: 'tazón de sopa', pt: 'tigela de sopa', de: 'Schüssel Suppe', zh: '[一|yī] [碗|wǎn] [汤|tāng]', ja: 'スープ の お[椀|わん]', g: { es: 'm', pt: 'f', de: 'f' }, icon: 'soup' });
  const Q4 = HQ.quest({ id: 'hq.mejor', home: 'molinar-house-13', done: 3, coins: 7, phrase: 'ph.hq.better',
    title: () => 'Soup for Eusebio', who: () => `${n('socorro')}, a cook in Molinar`,
    steps: [{ until: 2, text: () => `Take the soup up to ${n('eusebio')}: “Get well soon!”`, why: 'He has a cold and won’t come down. Socorro showed you what to say.', hint: '{mimo} sniffs the soup and looks at the stairs.', at: ['molinar-house-13', 'eusebio'] },
      { until: 3, text: () => `Tell ${n('socorro')} he ate it`, why: 'She’s downstairs at the stove, pretending not to worry.', hint: '{mimo} hops back down the stairs.', at: ['molinar-house-13', 'socorro'] }],
    story: () => 'Eusebio had a cold and wouldn’t come down. You took Socorro’s soup up to him and wished him well. He ate it all, and smiled.',
    lines: {
      offer: T('The soup is ready, but Eusebio won’t come down. Stubborn man!', 'La sopa está lista, pero Eusebio no quiere bajar. ¡Qué terco!', 'A sopa está pronta, mas o Eusebio não quer descer. Que teimoso!', 'Die Suppe ist fertig, aber Eusebio will nicht runterkommen. So ein Sturkopf!',
        '[汤|tāng] [好|hǎo] [了|le] ， [可是|kě shì] [欧塞维奥|Ōu sài wéi ào] [不肯|bù kěn] [下楼|xià lóu] 。 [真|zhēn] [固执|gù zhí] ！', 'スープ が できた のに 、 エウセビオ が [下|お]りて こない の 。 [頑固|がんこ] な [人|ひと] ！'),
      demo: T('Take it up to him, would you? And tell him what we always say here: “Get well soon!”', '¿Se la subes tú? Y dile lo que siempre decimos aquí: «¡Que te mejores!»', 'Você leva pra ele lá em cima? E fala o que a gente sempre diz aqui: «Melhoras!»', 'Bringst du sie ihm hoch? Und sag ihm, was wir hier immer sagen: „Gute Besserung!“',
        '[你|nǐ] [能|néng] [帮|bāng] [我|wǒ] [端|duān] [上去|shàng qù] [吗|ma] ？ [再|zài] [跟|gēn] [他|tā] [说|shuō] [我们|wǒ men] [常|cháng] [说|shuō] [的|de] [那|nà] [句|jù] [话|huà] ： “ [早日|zǎo rì] [康复|kāng fù] ！ ”', '[二階|にかい] に [持|も]って いって くれる ？ それ で 、 いつも の [言葉|ことば] を [言|い]って あげて 。 「 お[大事|だいじ] に ！ 」'),
      wait: T('He’s upstairs. Careful, the bowl is hot!', 'Está arriba. ¡Cuidado, que el tazón quema!', 'Ele tá lá em cima. Cuidado, a tigela tá quente!', 'Er ist oben. Vorsicht, die Schüssel ist heiß!',
        '[他|tā] [在|zài] [楼上|lóu shàng] 。 [小心|xiǎo xīn] ， [碗|wǎn] [很|hěn] [烫|tàng] ！', '[二階|にかい] に いる わ 。 お[椀|わん] が [熱|あつ]い から [気|き] を つけて ！'),
      grumble: T('Soup? I’m not hungry… Well. Maybe a little.', '¿Sopa? No tengo hambre… Bueno. Un poquito.', 'Sopa? Não tô com fome… Bom. Talvez um pouquinho.', 'Suppe? Ich hab keinen Hunger … Na gut. Ein bisschen vielleicht.',
        '[汤|tāng] ？ [我|wǒ] [不|bù] [饿|è] … [好|hǎo] [吧|ba] 。 [喝|hē] [一点|yī diǎn] [吧|ba] 。', 'スープ ？ おなか は すいて ない … まあ 。 [少|すこ]し だけ 。'),
      thanks: T('Mmm… Thank you. You know, I feel better already. Don’t tell Socorro!', 'Mmm… Gracias. ¿Sabes? Ya me siento mejor. ¡No le digas a Socorro!', 'Hum… Obrigado. Sabe? Já tô me sentindo melhor. Não conta pra Socorro!', 'Mmm … Danke. Weißt du was? Mir geht’s schon besser. Sag’s nicht Socorro!',
        '[真|zhēn] [好喝|hǎo hē] … [谢谢|xiè xie] 。 [你|nǐ] [知道|zhī dào] [吗|ma] ？ [我|wǒ] [已经|yǐ jīng] [好|hǎo] [多|duō] [了|le] 。 [别|bié] [告诉|gào su] [索科罗|Suǒ kē luó] ！', 'うまい … ありがとう 。 もう よく なって きた よ 。 ソコロ に は [内緒|ないしょ] だ ぞ ！'),
      happy: T('He ate it all? And he smiled? You’re good medicine.', '¿Se la tomó toda? ¿Y sonrió? Eres buena medicina.', 'Ele tomou tudo? E sorriu? Você é um ótimo remédio.', 'Er hat alles gegessen? Und gelächelt? Du bist gute Medizin.',
        '[他|tā] [全|quán] [喝|hē] [完|wán] [了|le] ？ [还|hái] [笑|xiào] [了|le] ？ [你|nǐ] [真|zhēn] [是|shì] [一|yī] [剂|jì] [良药|liáng yào] 。', 'ぜんぶ [飲|の]んだ の ？ [笑|わら]った の ？ あなた は いい お[薬|くすり] ね 。'),
      after: T('Tomorrow I’m getting up. Tomorrow! … Or the day after.', 'Mañana me levanto. ¡Mañana! … O pasado mañana.', 'Amanhã eu levanto. Amanhã! … Ou depois de amanhã.', 'Morgen stehe ich auf. Morgen! … Oder übermorgen.',
        '[明天|míng tiān] [我|wǒ] [就|jiù] [起来|qǐ lái] 。 [明天|míng tiān] ！ … [或者|huò zhě] [后天|hòu tiān] 。', '[明日|あした] は [起|お]きる ぞ 。 [明日|あした] ！ … いや 、 あさって 。'),
    },
    tasks: { better: { en: 'Get well soon!', model: { es: '¡Que te mejores!', pt: 'Melhoras!', de: 'Gute Besserung!', zh: '[早日|zǎo rì] [康复|kāng fù] ！', ja: 'お[大事|だいじ] に ！' },
      ok: { es: ['¡Que se mejore!', '¡Que te mejores pronto!', '¡Mejórate!', '¡Mejórate pronto!', '¡Que se mejore pronto!'], pt: ['Melhoras pro senhor!', 'Estimo melhoras!', 'Fica bom logo!', 'Melhoras, seu Eusebio!'], de: ['Gute Besserung, Eusebio!', 'Werd schnell wieder gesund!', 'Werden Sie schnell gesund!'],
        zh: ['[祝|zhù] [你|nǐ] [早日|zǎo rì] [康复|kāng fù] ！', '[祝|zhù] [您|nín] [早日|zǎo rì] [康复|kāng fù] ！', '[快|kuài] [点|diǎn] [好|hǎo] [起来|qǐ lái] ！'], ja: ['お[大事|だいじ] に して ください 。', 'お[大事|だいじ] に なさって ください 。', '[早|はや]く よく なって ください ！'] },
      keys: { es: [['mejores', 'mejore', 'mejorate']], pt: [['melhoras', 'melhora']], de: [['besserung', 'gesund']], zh: [['kangfu', 'haoqilai']], ja: [['daiji']] } } },
    talk: {
      socorro: st => (st === 0 ? async () => { HQ.lock(true); await say('socorro', Q4.lines.offer); await HQ.demo(P('socorro'), Q4.lines.demo, Q4.tasks.better); HQ.give('k.hqSoup'); HQ.setStage('hq.mejor', 1); UI.toast(`🍲 ${HQ.itemName('k.hqSoup')} (in your bag)`); }
        : st === 1 ? () => say('socorro', Q4.lines.wait)
        : st === 2 ? async () => { HQ.lock(true); await HQ.me('He ate it all. And he smiled!'); await say('socorro', Q4.lines.happy); HQ.setStage('hq.mejor', 3); HQ.reward(Q4, gotG(Q4)); } : null),
      eusebio: st => (st === 1 ? async () => {
        HQ.lock(true); await say('eusebio', Q4.lines.grumble);
        const g = await ask(Q4.tasks.better, { title: `Give ${n('eusebio')} the soup: “Get well soon!”`, icon: 'soup' });
        if (!g) { await say('eusebio', COMMON.later); return; }
        HQ.take('k.hqSoup'); saveG(Q4, g); await say('eusebio', Q4.lines.thanks); HQ.setStage('hq.mejor', 2);
      } : st >= 3 && Math.random() < 0.5 ? () => say('eusebio', Q4.lines.after) : null),
    },
    mark: { socorro: st => (st === 0 ? '!' : st === 2 ? '◆' : null), eusebio: st => (st === 1 ? '◆' : null) } });

  // ---- 5. Bread for Doña Pura (an errand to the bakery) · «Un pan, por favor»
  HQ.phrase({ id: 'ph.hq.bread', en: 'A loaf of bread, please.', es: 'Un pan, por favor.', pt: 'Um pão, por favor.', de: 'Ein Brot, bitte.', zh: '[请|qǐng] [给|gěi] [我|wǒ] [一个|yī gè] [面包|miàn bāo] 。', ja: 'パン を [一|ひと]つ ください 。', note: 'Swap in what you want: es «Dos panes, por favor», pt «Dois pães, por favor», de «Zwei Brötchen, bitte», zh «请给我两个面包», ja «…を二つください».' });
  HQ.keep({ id: 'k.hqLoaf', en: 'a warm loaf for Doña Pura', es: 'pan calentito', pt: 'pão quentinho', de: 'warmes Brot', zh: '[热|rè] [面包|miàn bāo]', ja: '[焼|や]きたて の パン', g: { es: 'm', pt: 'm', de: 'n' }, icon: 'bread' });
  HQ.keep({ id: 'k.hqScarf', en: 'a scarf Pura knitted', es: 'bufanda tejida', pt: 'cachecol de tricô', de: 'gestrickter Schal', zh: '[手织|shǒu zhī] [围巾|wéi jīn]', ja: '[手編|てあ]み の マフラー', g: { es: 'f', pt: 'm', de: 'm' }, icon: 'gift' });
  const ENC = () => INTERIORS.displayName('woman', 'Encarna');
  const Q5 = HQ.quest({ id: 'hq.bread', home: 'molinar-house-21', homes: { pura: 'molinar-house-21', baker: 'molinar-bakery' }, done: 3, coins: 8, phrase: 'ph.hq.bread', keep: 'k.hqScarf',
    title: () => 'Bread for Doña Pura', who: () => `${n('pura')}, a widow in Molinar`,
    steps: [{ until: 2, text: () => `At the bakery, ask ${ENC()} for a loaf of bread`, why: 'Pura’s knees don’t like the hill anymore. She told you what to say.', hint: '{mimo} sniffs the air… the bakery is by the square.', at: ['molinar-bakery', 'baker'] },
      { until: 3, text: () => `Bring the bread to ${n('pura')}`, why: 'She’s waiting in her rocking chair, by Joaquín’s photo.', hint: '{mimo} carries the smell of warm bread all the way back.', at: ['molinar-house-21', 'pura'] }],
    story: () => 'Pura couldn’t walk up the hill to the bakery anymore. You asked Encarna for a loaf, and she sent it for free: Pura taught her to bake.',
    lines: {
      offer: T('Would you do an old woman a favor? I’d love some fresh bread, but that hill…', '¿Me harías un favor? Me encantaría un pan fresquito, pero esa cuesta…', 'Você me faria um favor? Eu queria tanto um pão fresquinho, mas aquela ladeira…', 'Tust du einer alten Frau einen Gefallen? Ich hätte so gern frisches Brot, aber dieser Hügel …',
        '[你|nǐ] [能|néng] [帮|bāng] [我|wǒ] [这|zhè] [个|gè] [老太太|lǎo tài tai] [一|yī] [个|gè] [忙|máng] [吗|ma] ？ [我|wǒ] [好|hǎo] [想|xiǎng] [吃|chī] [新鲜|xīn xiān] [的|de] [面包|miàn bāo] ， [可是|kě shì] [那|nà] [个|gè] [坡|pō] …', 'おばあちゃん の お[願|ねが]い 、 [聞|き]いて くれる ？ [焼|や]きたて の パン が [食|た]べたい けど 、 あの [坂|さか] が ね …'),
      demo: T('At the bakery, you just say: “A loaf of bread, please.” Encarna knows me.', 'En la panadería solo dices: «Un pan, por favor.» Encarna me conoce.', 'Na padaria, é só dizer: «Um pão, por favor.» A Encarna me conhece.', 'In der Bäckerei sagst du einfach: „Ein Brot, bitte.“ Encarna kennt mich.',
        '[在|zài] [面包店|miàn bāo diàn] [你|nǐ] [就|jiù] [说|shuō] ： “ [请|qǐng] [给|gěi] [我|wǒ] [一个|yī gè] [面包|miàn bāo] 。 ” [恩卡尔纳|Ēn kǎ ěr nà] [认识|rèn shi] [我|wǒ] 。', 'パン[屋|や] で は 、 「 パン を [一|ひと]つ ください 。 」 って [言|い]えば いい の 。 エンカルナ さん は わたし を [知|し]って る から 。'),
      wait: T('The bakery is by the square. Just follow the smell!', 'La panadería está junto a la plaza. ¡Sigue el olor!', 'A padaria fica perto da praça. É só seguir o cheiro!', 'Die Bäckerei ist am Platz. Folg einfach dem Duft!',
        '[面包店|miàn bāo diàn] [在|zài] [广场|guǎng chǎng] [旁边|páng biān] 。 [跟着|gēn zhe] [香味|xiāng wèi] [走|zǒu] [就|jiù] [行|xíng] ！', 'パン[屋|や] は [広場|ひろば] の そば よ 。 いい におい を たどって ね ！'),
      baker: T('For Doña Pura? Then it’s free. She taught me to bake when I was little!', '¿Para doña Pura? Entonces es gratis. ¡Ella me enseñó a hornear cuando era chiquita!', 'Pra dona Pura? Então é de graça. Ela me ensinou a fazer pão quando eu era pequena!', 'Für Oma Pura? Dann ist es umsonst. Sie hat mir das Backen beigebracht, als ich klein war!',
        '[给|gěi] [普拉|Pǔ lā] [奶奶|nǎi nai] [的|de] ？ [那|nà] [就|jiù] [不|bù] [要|yào] [钱|qián] 。 [我|wǒ] [小|xiǎo] [时候|shí hou] ， [是|shì] [她|tā] [教|jiāo] [我|wǒ] [烤|kǎo] [面包|miàn bāo] [的|de] ！', 'プーラ さん に ？ じゃあ 、 お[代|だい] は いらない わ 。 [小|ちい]さい ころ 、 パン の [焼|や]き[方|かた] を [教|おし]えて くれた の ！'),
      thanks: T('Still warm! Oh, it smells like Sunday. Thank you, thank you. Here, I knitted this scarf. Take it!', '¡Todavía calentito! Ay, huele a domingo. Gracias, gracias. Toma, tejí esta bufanda. ¡Llévatela!', 'Ainda quentinho! Ai, tem cheiro de domingo. Obrigada, obrigada. Toma, eu tricotei este cachecol. Leva!', 'Noch warm! Oh, das riecht nach Sonntag. Danke, danke. Hier, diesen Schal habe ich gestrickt. Nimm ihn!',
        '[还是|hái shi] [热|rè] [的|de] ！ [哎|āi] ， [有|yǒu] [星期天|xīng qī tiān] [的|de] [味道|wèi dào] 。 [谢谢|xiè xie] ， [谢谢|xiè xie] 。 [这|zhè] [条|tiáo] [围巾|wéi jīn] [是|shì] [我|wǒ] [织|zhī] [的|de] ， [你|nǐ] [拿|ná] [着|zhe] ！', 'まだ あたたかい ！ [日曜日|にちようび] の におい が する わ 。 ありがとう 、 ありがとう 。 この マフラー 、 わたし が [編|あ]んだ の 。 もらって ！'),
      after: T('Encarna sends me bread every morning now. Your idea, I think!', 'Ahora Encarna me manda pan todas las mañanas. ¡Idea tuya, creo!', 'Agora a Encarna me manda pão toda manhã. Ideia sua, eu acho!', 'Jetzt schickt mir Encarna jeden Morgen Brot. Deine Idee, glaube ich!',
        '[现在|xiàn zài] [恩卡尔纳|Ēn kǎ ěr nà] [每天|měi tiān] [早上|zǎo shang] [给|gěi] [我|wǒ] [送|sòng] [面包|miàn bāo] 。 [我|wǒ] [猜|cāi] [是|shì] [你|nǐ] [的|de] [主意|zhǔ yi] ！', '[今|いま] は エンカルナ さん が [毎朝|まいあさ] パン を [届|とど]けて くれる の 。 あなた の アイデア でしょう ？'),
    },
    tasks: { bread: { en: 'A loaf of bread, please.', model: { es: 'Un pan, por favor.', pt: 'Um pão, por favor.', de: 'Ein Brot, bitte.', zh: '[请|qǐng] [给|gěi] [我|wǒ] [一个|yī gè] [面包|miàn bāo] 。', ja: 'パン を [一|ひと]つ ください 。' },
      ok: { es: ['Quiero un pan, por favor.', 'Me da un pan, por favor.', 'Me das un pan, por favor.', 'Un pan para doña Pura, por favor.', 'Hola, un pan, por favor.'], pt: ['Quero um pão, por favor.', 'Me dá um pão, por favor.', 'Um pão pra dona Pura, por favor.', 'Oi, um pão, por favor.'], de: ['Ich hätte gern ein Brot, bitte.', 'Ein Brot für Oma Pura, bitte.', 'Hallo, ein Brot, bitte.', 'Bitte ein Brot.'],
        zh: ['[我|wǒ] [要|yào] [一个|yī gè] [面包|miàn bāo] 。', '[一个|yī gè] [面包|miàn bāo] ， [谢谢|xiè xie] 。', '[请|qǐng] [给|gěi] [我|wǒ] [一个|yī gè] [面包|miàn bāo] ， [谢谢|xiè xie] 。'], ja: ['パン [一|ひと]つ ください 。', 'パン を ください 。', 'パン を [一|ひと]つ お[願|ねが]い します 。'] },
      keys: { es: [['pan'], ['por favor', 'porfa']], pt: [['pao'], ['por favor']], de: [['brot'], ['bitte']], zh: [['mianbao'], ['qing', 'yao', 'xiexie']], ja: [['pan'], ['kudasai', 'onegai']] } } },
    talk: {
      pura: st => (st === 0 ? async () => { HQ.lock(true); await say('pura', Q5.lines.offer); await HQ.demo(P('pura'), Q5.lines.demo, Q5.tasks.bread); HQ.setStage('hq.bread', 1); }
        : st === 1 ? () => say('pura', Q5.lines.wait)
        : st === 2 ? async () => { HQ.lock(true); await HQ.me('Your bread, still warm!'); HQ.take('k.hqLoaf'); await say('pura', Q5.lines.thanks); HQ.setStage('hq.bread', 3); HQ.reward(Q5, gotG(Q5)); }
        : Math.random() < 0.5 ? () => say('pura', Q5.lines.after) : null),
      baker: st => (st === 1 ? async () => {
        HQ.lock(true);
        const g = await ask(Q5.tasks.bread, { title: `Ask ${ENC()} for a loaf of bread`, icon: 'bread' });
        if (!g) return;
        saveG(Q5, g); await say('baker', Q5.lines.baker); HQ.give('k.hqLoaf'); HQ.setStage('hq.bread', 2); UI.toast(`🍞 ${HQ.itemName('k.hqLoaf')} (in your bag)`);
      } : null),
    },
    mark: { pura: st => (st === 0 ? '!' : st === 2 ? '◆' : null), baker: st => (st === 1 ? '◆' : null) } });

  // ---- 6. Packing for the trip (find three things, then say goodbye) · his list, then «¡Buen viaje!»
  HQ.phrase({ id: 'ph.hq.trip', en: 'Have a good trip!', es: '¡Buen viaje!', pt: 'Boa viagem!', de: 'Gute Reise!', zh: '[一路|yī lù] [顺风|shùn fēng] ！', ja: '[気|き] を つけて ！', note: 'ja: «気をつけて！» (take care) is what you say to someone setting off; «いってらっしゃい！» when they leave home. zh also «一路平安！».' });
  HQ.keep({ id: 'k.hqCompass', en: 'Ulises’s old compass', es: 'brújula vieja', pt: 'bússola velha', de: 'alter Kompass', zh: '[旧|jiù] [指南针|zhǐ nán zhēn]', ja: '[古|ふる]い コンパス', g: { es: 'f', pt: 'f', de: 'm' }, icon: 'star' });
  const PACK = ['w.hat', 'w.apple', 'w.book'];
  const packed = () => (hqS()['hq.trip:found'] = hqS()['hq.trip:found'] || []);
  const Q6 = HQ.quest({ id: 'hq.trip', home: 'molinar-house-25', done: 3, coins: 9, phrase: 'ph.hq.trip', keep: 'k.hqCompass',
    title: () => 'Packing for the trip', who: () => `${n('ulises')}, who leaves Molinar tomorrow`,
    steps: [{ until: 2, text: () => `Find ${n('ulises')}’s three things in his house`, why: 'His {w.hat}, one {w.apple} for the road, and his {w.book}. They’re all somewhere in the room.', hint: '{mimo} sniffs around the room…', at: ['molinar-house-25'] },
      { until: 3, text: () => `Wish ${n('ulises')} a good trip`, why: 'He’s all packed now, and a little nervous.', hint: '{mimo} hops over to the suitcases.', at: ['molinar-house-25', 'ulises'] }],
    story: () => 'Ulises was leaving Molinar to see the world and couldn’t find anything. You found his hat, an apple and his book, and wished him a good trip.',
    lines: {
      offer: T('Tomorrow I leave, and I can’t find anything! The boat won’t wait!', '¡Mañana me voy y no encuentro nada! ¡El barco no va a esperar!', 'Amanhã eu vou embora e não acho nada! O barco não vai esperar!', 'Morgen fahre ich los und finde nichts! Das Boot wartet nicht!',
        '[明天|míng tiān] [就|jiù] [要|yào] [走|zǒu] [了|le] ， [可是|kě shì] [我|wǒ] [什么|shén me] [都|dōu] [找|zhǎo] [不|bù] [到|dào] ！ [船|chuán] [可|kě] [不|bù] [等|děng] [人|rén] ！', '[明日|あした] [出発|しゅっぱつ] な のに 、 [何|なに] も [見|み]つからない ！ [船|ふね] は [待|ま]って くれない よ ！'),
      list: T('I need three things: my {w.hat}, one {w.apple} for the road, and my {w.book}.', 'Necesito tres cosas: mi {w.hat}, una {w.apple} para el camino y mi {w.book}.', 'Preciso de três coisas: o meu {w.hat}, uma {w.apple} pra viagem e o meu {w.book}.', 'Ich brauche drei Dinge: meinen {w.hat}, einen {w.apple} für unterwegs und mein {w.book}.',
        '[我|wǒ] [需要|xū yào] [三|sān] [样|yàng] [东西|dōng xi] ： [我|wǒ] [的|de] {w.hat} 、 [路|lù] [上|shàng] [吃|chī] [的|de] {w.apple} ， [还有|hái yǒu] [我|wǒ] [的|de] {w.book} 。', '[三|みっ]つ [要|い]る ん だ 。 ぼく の {w.hat} 、 [道|みち] で [食|た]べる {w.apple} 、 それ と ぼく の {w.book} 。'),
      please: T('They’re all somewhere in this room. Can you help me look?', 'Están en algún lugar de este cuarto. ¿Me ayudas a buscar?', 'Estão em algum lugar deste quarto. Você me ajuda a procurar?', 'Die sind alle irgendwo hier im Zimmer. Hilfst du mir suchen?',
        '[都|dōu] [在|zài] [这个|zhè ge] [房间|fáng jiān] [里|lǐ] 。 [你|nǐ] [能|néng] [帮|bāng] [我|wǒ] [找|zhǎo] [吗|ma] ？', 'ぜんぶ この [部屋|へや] の どこ か に ある ん だ 。 いっしょ に [探|さが]して くれる ？'),
      found: T('My {w.hat}! My {w.apple}! My {w.book}! You found everything!', '¡Mi {w.hat}! ¡Mi {w.apple}! ¡Mi {w.book}! ¡Lo encontraste todo!', 'O meu {w.hat}! A minha {w.apple}! O meu {w.book}! Você achou tudo!', 'Mein {w.hat}! Mein {w.apple}! Mein {w.book}! Du hast alles gefunden!',
        '[我|wǒ] [的|de] {w.hat} ！ [我|wǒ] [的|de] {w.apple} ！ [我|wǒ] [的|de] {w.book} ！ [你|nǐ] [全|quán] [找到|zhǎo dào] [了|le] ！', 'ぼく の {w.hat} ！ {w.apple} ！ {w.book} ！ ぜんぶ [見|み]つけて くれた ！'),
      demo: T('Everyone in Molinar tells me: “Have a good trip!” I never get tired of it.', 'Todo Molinar me dice: «¡Buen viaje!» Nunca me canso de oírlo.', 'Todo mundo em Molinar me diz: «Boa viagem!» Eu nunca canso de ouvir.', 'Alle in Molinar sagen mir: „Gute Reise!“ Davon kriege ich nie genug.',
        '[磨坊镇|Mò fáng zhèn] [的|de] [人|rén] [都|dōu] [跟|gēn] [我|wǒ] [说|shuō] ： “ [一路|yī lù] [顺风|shùn fēng] ！ ” [我|wǒ] [怎么|zěn me] [听|tīng] [都|dōu] [听|tīng] [不|bù] [够|gòu] 。', 'モリナール の みんな が 「 [気|き] を つけて ！ 」 って [言|い]って くれる 。 [何度|なんど] [聞|き]いて も うれしい ん だ 。'),
      bye: T('Thank you! I’ll write to you. From everywhere! Here, take my old compass. I bought a new one.', '¡Gracias! Te voy a escribir. ¡Desde todas partes! Toma mi brújula vieja. Compré una nueva.', 'Obrigado! Vou te escrever. De todo lugar! Toma a minha bússola velha. Comprei uma nova.', 'Danke! Ich schreibe dir. Von überall! Hier, nimm meinen alten Kompass. Ich habe einen neuen gekauft.',
        '[谢谢|xiè xie] ！ [我|wǒ] [会|huì] [给|gěi] [你|nǐ] [写信|xiě xìn] 。 [从|cóng] [世界|shì jiè] [各地|gè dì] ！ [这|zhè] [个|gè] [旧|jiù] [指南针|zhǐ nán zhēn] [给|gěi] [你|nǐ] ， [我|wǒ] [买|mǎi] [了|le] [新|xīn] [的|de] 。', 'ありがとう ！ [手紙|てがみ] を [書|か]く よ 。 いろんな ところ から ！ この [古|ふる]い コンパス 、 あげる 。 [新|あたら]しい の を [買|か]った ん だ 。'),
      after: T('Last night I dreamed of the sea. Tomorrow I see it for real!', 'Anoche soñé con el mar. ¡Mañana lo veo de verdad!', 'Ontem à noite eu sonhei com o mar. Amanhã eu vejo de verdade!', 'Heute Nacht habe ich vom Meer geträumt. Morgen sehe ich es wirklich!',
        '[昨天|zuó tiān] [晚上|wǎn shang] [我|wǒ] [梦见|mèng jiàn] [了|le] [大海|dà hǎi] 。 [明天|míng tiān] [就|jiù] [能|néng] [真|zhēn] [的|de] [看到|kàn dào] [了|le] ！', 'ゆうべ 、 [海|うみ] の [夢|ゆめ] を [見|み]た ん だ 。 [明日|あした] は [本物|ほんもの] を [見|み]る ！'),
    },
    tasks: { trip: { en: 'Have a good trip!', model: { es: '¡Buen viaje!', pt: 'Boa viagem!', de: 'Gute Reise!', zh: '[一路|yī lù] [顺风|shùn fēng] ！', ja: '[気|き] を つけて ！' },
      ok: { es: ['¡Buen viaje, Ulises!', '¡Que tengas buen viaje!', '¡Feliz viaje!', '¡Que te vaya bien!'], pt: ['Boa viagem, Ulises!', 'Faça uma boa viagem!', 'Tenha uma boa viagem!'], de: ['Gute Reise, Ulises!', 'Gute Fahrt!', 'Eine gute Reise!', 'Ich wünsch dir eine gute Reise!'],
        zh: ['[一路|yī lù] [平安|píng ān] ！', '[祝|zhù] [你|nǐ] [一路|yī lù] [顺风|shùn fēng] ！'], ja: ['いってらっしゃい ！', 'お[気|き] を つけて ！', 'いい [旅|たび] を ！'] },
      keys: { es: [['viaje']], pt: [['viagem']], de: [['reise', 'fahrt']], zh: [['yilu']], ja: [['kiotsukete', 'itterasshai']] } } },
    talk: {
      ulises: st => (st === 0 ? async () => { HQ.lock(true); await say('ulises', Q6.lines.offer); await HQ.demo(P('ulises'), Q6.lines.list, PACK); await say('ulises', Q6.lines.please); HQ.setStage('hq.trip', 1); }
        : st === 1 ? () => HQ.demo(P('ulises'), Q6.lines.list, PACK)
        : st === 2 ? async () => {
          HQ.lock(true); await say('ulises', Q6.lines.found); await HQ.demo(P('ulises'), Q6.lines.demo, Q6.tasks.trip);
          const g = await ask(Q6.tasks.trip, { title: `Wish ${n('ulises')} a good trip!`, icon: 'wave' });
          if (!g) { await say('ulises', COMMON.later); return; }
          await say('ulises', Q6.lines.bye); HQ.setStage('hq.trip', 3); HQ.reward(Q6, g);
        } : Math.random() < 0.5 ? () => say('ulises', Q6.lines.after) : null),
    },
    // three places to look: the hat stand, the kitchen, the bookcase (each has one of the things)
    extras: (st, ctx) => {
      if (st !== 1 || ctx.floor) return [];
      const M = ctx.marks, cook = ctx.room && ctx.room.spots.find(s => s.type === 'cook'), out = [], got = packed();
      const spots = { 'w.hat': M.hat, 'w.apple': cook ? { x: cook.x, z: cook.z } : null, 'w.book': M.books };
      const where = { 'w.hat': 'On the hat stand: his {w.hat}!', 'w.apple': 'By the stove: a shiny {w.apple}!', 'w.book': 'On the bookcase: his {w.book}!' };
      for (const id of PACK) { const m = spots[id]; if (!m || got.includes(id)) continue;
        out.push({ x: m.x, z: m.z, r: 1.25, label: 'Look', run: async () => {
          if (got.includes(id) || HQ.stage('hq.trip') !== 1) return;
          HQ.mimo('!'); Sound.play('chirp'); got.push(id); HQ.think(where[id], 4);
          if (PACK.every(w => got.includes(w))) { HQ.setStage('hq.trip', 2); Sound.play('review'); UI.toast('🧳 All three found! Take them to Ulises.'); }
          else if (G().save) G().save();
        } }); }
      return out;
    },
    mark: { ulises: st => (st === 0 ? '!' : st === 2 ? '◆' : null) } });
})();
