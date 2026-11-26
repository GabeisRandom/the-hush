'use strict';
// The story of the slice: Noa's letters, a glimpse of the old tower, the last stop, Mimo hatching,
// the Hush rolling over the Quiet Forest, Alba (Rosa), Bruno's training, the field, the big one on
// the hill, and the way north. Scripts are async functions; waits run on game time, so tests can
// fast-forward. Story beats are acted out in short scenes with lines that wait for you
// (DESIGN.md 12.4); people speak through the weave (UI.weaveParts), so you always understand them.

const STORY = (() => {
  let G = null;                 // the game: { sim, w3d, cast, cam, state, save(), fight(), cutaway(), fx }
  let clock = 0, waiters = [], tweens = [];
  let busy = false;             // a script is running
  let line = null, thought = null;
  let curiosityCool = 2.5, reviewCool = 40, focusWord = null;
  // speakers' names: zh / ja in the CJK.md notation, shown in the mode's plain text (布鲁诺 in characters, Bùlǔnuò in pinyin)
  const NAMES = { rosa: { es: 'Doña Rosa', pt: 'Dona Rosa', de: 'Oma Rosa', zh: '[罗莎|Luó shā] [奶奶|nǎi nai]', ja: 'ロサ さん' },
    kid: { _: 'Nico', zh: '[尼科|Ní kē]', ja: 'ニコ' }, baker: { _: 'Marta', zh: '[玛尔塔|Mǎ ěr tǎ]', ja: 'マルタ' }, bruno: { _: 'Bruno', zh: '[布鲁诺|Bù lǔ nuò]', ja: 'ブルーノ' } };
  const nameOf = who => {
    const N = NAMES[who]; if (!N) return who; if (typeof N !== 'object') return N;
    const v = N[UI.lang] || N._ || N.es || who;
    return typeof CJK !== 'undefined' && CJK.isCJK(UI.lang) && N[UI.lang] ? CJK.plain(v) : v;
  };
  // Latin speaker name -> [zh, ja] in the CJK.md notation (zh/ja games show these in the mode's plain text; es/pt/de unchanged)
  const SPEAKER_CJ = {};
  [
    ['Mimo', '[米莫|Mǐ mò]', 'ミモ'], ['Noa', '[诺娅|Nuò yà]', 'ノア'], ['Rosa', '[罗莎|Luó shā]', 'ロサ'],
    ['Bruno', '[布鲁诺|Bù lǔ nuò]', 'ブルーノ'], ['Marta', '[玛尔塔|Mǎ ěr tǎ]', 'マルタ'], ['Nico', '[尼科|Ní kē]', 'ニコ'],
    ['Hugo', '[雨果|Yǔ guǒ]', 'ウーゴ'], ['Ciro', '[西罗|Xī luó]', 'シロ'], ['Marga', '[玛尔加|Mǎ ěr jiā]', 'マルガ'],
    ['Marina', '[玛丽娜|Mǎ lì nà]', 'マリーナ'], ['Bartolo', '[巴托洛|Bā tuō luò]', 'バルトロ'], ['Lalo', '[拉洛|Lā luò]', 'ラロ'],
    ['Aurora', '[奥罗拉|Ào luó lā]', 'オーロラ'], ['Vicente', '[维森特|Wéi sēn tè]', 'ビセンテ'], ['Cande', '[坎德|Kǎn dé]', 'カンデ'],
    ['Pío', '[皮奥|Pí ào]', 'ピオ'], ['Paco', '[帕科|Pà kē]', 'パコ'], ['Rocío', '[罗西奥|Luó xī ào]', 'ロシオ'],
    ['Lucho', '[卢乔|Lú qiáo]', 'ルチョ'], ['Maite', '[迈特|Mài tè]', 'マイテ'], ['Efraín', '[埃弗拉因|Āi fú lā yīn]', 'エフライン'],
    ['Lupe', '[卢佩|Lú pèi]', 'ルペ'], ['Chepe', '[切佩|Qiē pèi]', 'チェペ'], ['Gil', '[吉尔|Jí ěr]', 'ギル'],
    ['Elena', '[埃莱娜|Āi lái nà]', 'エレナ'], ['Flora', '[芙洛拉|Fú luò lā]', 'フローラ'], ['Melisa', '[梅丽莎|Méi lì shā]', 'メリッサ'],
    ['Tomasa', '[托玛莎|Tuō mǎ shā]', 'トマサ'], ['Polo', '[波洛|Bō luò]', 'ポロ'], ['Lola', '[萝拉|Luó lā]', 'ローラ'],
    ['Rafa', '[拉法|Lā fǎ]', 'ラファ'], ['Clara', '[克拉拉|Kè lā lā]', 'クララ'], ['Nando', '[南多|Nán duō]', 'ナンド'],
    ['Pili', '[皮莉|Pí lì]', 'ピリ'], ['Inés', '[伊内斯|Yī nèi sī]', 'イネス'], ['Teo', '[特奥|Tè ào]', 'テオ'],
    ['Tobías', '[托比亚斯|Tuō bǐ yà sī]', 'トビアス'], ['Lía', '[莉娅|Lì yà]', 'リア'], ['Tito', '[蒂托|Dì tuō]', 'ティト'],
    ['Pedro', '[佩德罗|Pèi dé luó]', 'ペドロ'], ['Amparo', '[安帕罗|Ān pà luó]', 'アンパロ'], ['Nora', '[诺拉|Nuò lā]', 'ノラ'],
    ['Iker', '[伊克尔|Yī kè ěr]', 'イケル'], ['Mateo', '[马特奥|Mǎ tè ào]', 'マテオ'], ['Lena', '[莱娜|Lái nà]', 'レナ'],
    ['Mila', '[米拉|Mǐ lā]', 'ミラ'], ['Vera', '[维拉|Wéi lā]', 'ベラ'], ['Sofia', '[索菲娅|Suǒ fēi yà]', 'ソフィア'],
    ['Jonas', '[乔纳斯|Qiáo nà sī]', 'ジョナス'], ['Rubén', '[鲁文|Lǔ wén]', 'ルベン'], ['Lucas', '[卢卡斯|Lú kǎ sī]', 'ルーカス'],
    ['Otto', '[奥托|Ào tuō]', 'オットー'], ['Max', '[马克斯|Mǎ kè sī]', 'マックス'], ['Leo', '[莱奥|Lái ào]', 'レオ'],
    ['Ana', '[安娜|Ān nà]', 'アナ'], ['Bea', '[贝亚|Bèi yà]', 'ベア'], ['Emil', '[埃米尔|Āi mǐ ěr]', 'エミール'],
    ['Rita', '[丽塔|Lì tǎ]', 'リタ'], ['Paula', '[保拉|Bǎo lā]', 'パウラ'], ['Marco', '[马可|Mǎ kě]', 'マルコ'],
    ['Tomás', '[托马斯|Tuō mǎ sī]', 'トマス'], ['Nina', '[妮娜|Nī nà]', 'ニーナ'], ['Simón', '[西蒙|Xī méng]', 'シモン'],
    ['Félix', '[费利克斯|Fèi lì kè sī]', 'フェリックス'], ['Pepa', '[佩帕|Pèi pà]', 'ペパ'], ['Dani', '[达尼|Dá ní]', 'ダニ'],
    ['Chelo', '[切洛|Qiē luò]', 'チェロ'], ['Luz', '[卢斯|Lú sī]', 'ルス'], ['Toni', '[托尼|Tuō ní]', 'トニ'],
    ['Carmen', '[卡门|Kǎ mén]', 'カルメン'], ['Sara', '[萨拉|Sà lā]', 'サラ'], ['Quique', '[基克|Jī kè]', 'キケ'],
    ['Nuria', '[努里娅|Nǔ lǐ yà]', 'ヌリア'], ['Ramón', '[拉蒙|Lā méng]', 'ラモン'], ['Pepe', '[佩佩|Pèi pèi]', 'ペペ'],
    ['Delia', '[德利娅|Dé lì yà]', 'デリア'], ['Chema', '[切马|Qiē mǎ]', 'チェマ'], ['Tere', '[特蕾|Tè lěi]', 'テレ'],
    ['Cata', '[卡塔|Kǎ tǎ]', 'カタ'], ['Fausto', '[福斯托|Fú sī tuō]', 'ファウスト'], ['Celia', '[塞利娅|Sài lì yà]', 'セリア'],
    ['Moncho', '[蒙乔|Méng qiáo]', 'モンチョ'], ['Lino', '[利诺|Lì nuò]', 'リノ'], ['Mar', '[玛尔|Mǎ ěr]', 'マル'],
    ['Quino', '[基诺|Jī nuò]', 'キノ'], ['Bento', '[本托|Běn tuō]', 'ベント'], ['Dalia', '[达莉娅|Dá lì yà]', 'ダリア'],
    ['Abel', '[阿贝尔|Ā bèi ěr]', 'アベル'], ['Dora', '[多拉|Duō lā]', 'ドラ'], ['Greta', '[格蕾塔|Gé lěi tǎ]', 'グレタ'],
    ['Rui', '[鲁伊|Lǔ yī]', 'ルイ'], ['Wei', '[魏|Wèi]', 'ウェイ'], ['Yuki', '[小雪|Xiǎo xuě]', 'ユキ'],
    ['Omar', '[奥马尔|Ào mǎ ěr]', 'オマール'], ['Mari', '[玛丽|Mǎ lì]', 'マリ'], ['Pía', '[皮娅|Pí yà]', 'ピア'],
    ['Tavo', '[塔沃|Tǎ wò]', 'タボ'],
  ].forEach(([n, zh, ja]) => { SPEAKER_CJ[n] = { zh, ja }; });
  if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['ミモ', 'ノア', 'ロサ', 'ブルーノ', 'マルタ', 'ニコ', 'ウーゴ', 'シロ', 'マルガ', 'マリーナ', 'バルトロ', 'ラロ', 'オーロラ', 'ビセンテ', 'カンデ', 'ピオ', 'パコ', 'ロシオ', 'ルチョ', 'マイテ', 'エフライン', 'ルペ', 'チェペ', 'ギル', 'エレナ', 'フローラ', 'メリッサ', 'トマサ', 'ポロ', 'ローラ', 'ラファ', 'クララ', 'ナンド', 'ピリ', 'イネス', 'テオ', 'トビアス', 'リア', 'ティト', 'ペドロ', 'アンパロ', 'ノラ', 'イケル', 'マテオ', 'レナ', 'ミラ', 'ベラ', 'ソフィア', 'ジョナス', 'ルベン', 'ルーカス', 'オットー', 'マックス', 'レオ', 'アナ', 'ベア', 'エミール', 'リタ', 'パウラ', 'マルコ', 'トマス', 'ニーナ', 'シモン', 'フェリックス', 'ペパ', 'ダニ', 'チェロ', 'ルス', 'トニ', 'カルメン', 'サラ', 'キケ', 'ヌリア', 'ラモン', 'ペペ', 'デリア', 'チェマ', 'テレ', 'カタ', 'ファウスト', 'セリア', 'モンチョ', 'リノ', 'マル', 'キノ', 'ベント', 'ダリア', 'アベル', 'ドラ', 'グレタ', 'ルイ', 'ウェイ', 'ユキ', 'オマール', 'マリ', 'ピア', 'タボ']);

  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // ------------------------------------------------------------ lines added for DESIGN.md 16 (merged into lines.js's LINES)
  // Report-backs (Bruno after the field) and demonstrations: someone uses a word while doing it, and it's shown in the language
  // with the English under it, before anyone asks you for it (7.9: hear it first). Same shape as lines.js: [simple, richer].
  const LINES16 = {
    'bruno.report': {
      es: ['¡Lo lograste! El campo está libre.', '¡Lo lograste! El campo está libre otra vez, y el color vuelve.'],
      pt: ['Você conseguiu! O campo está livre.', 'Você conseguiu! O campo está livre de novo, e a cor está voltando.'],
      de: ['Geschafft! Das Feld ist frei.', 'Geschafft! Das Feld ist wieder frei, und die Farbe kommt zurück.'],
      zh: ['[你|nǐ] [做到|zuò dào] [了|le] ！ [田野|tián yě] [里|lǐ] [没有|méi yǒu] [小默默|xiǎo mò mò] [了|le] 。', '[你|nǐ] [做到|zuò dào] [了|le] ！ [田野|tián yě] [里|lǐ] [的|de] [小默默|xiǎo mò mò] [都|dōu] [被|bèi] [赶走|gǎn zǒu] [了|le] ， [颜色|yán sè] [也|yě] [回来|huí lái] [了|le] 。'],
      ja: ['やりました ね ！ [野原|のはら] から だまりっこ が いなく なりました 。', 'やりました ね ！ [野原|のはら] から だまりっこ が いなく なって 、 [色|いろ] も [戻|もど]って きました 。'],
      en: ['You did it! The {c.field} is free.', 'You did it! The {c.field} is free again, and the color is coming back.'] },
    'bruno.report2': {
      es: ['Ahora, el calladón de la colina. Está en el camino al norte.', 'Ahora, el calladón de la colina. Está justo en el camino al norte, el camino a la {w.tower}. Sube tú primero: ¡yo voy detrás!'],
      pt: ['Agora, o caladão da colina. Ele está no caminho pro norte.', 'Agora, o caladão da colina. Ele está bem no caminho pro norte, o caminho da {w.tower}. Sobe primeiro: eu vou logo atrás!'],
      de: ['Jetzt der Riesenschweigling auf dem Hügel. Er sitzt auf dem Weg nach Norden.', 'Jetzt der Riesenschweigling auf dem Hügel. Er sitzt genau auf dem Weg nach Norden, dem Weg zum {w.tower}. Geh du vor, ich komme gleich nach!'],
      zh: ['[现在|xiàn zài] [是|shì] [山坡|shān pō] [上|shàng] [的|de] [大默默|dà mò mò] 。 [它|tā] [挡|dǎng] [在|zài] [往|wǎng] [北|běi] [的|de] [路|lù] [上|shàng] 。', '[现在|xiàn zài] [轮到|lún dào] [山坡|shān pō] [上|shàng] [的|de] [大默默|dà mò mò] [了|le] 。 [它|tā] [正好|zhèng hǎo] [挡|dǎng] [在|zài] [往|wǎng] [北|běi] [的|de] [路|lù] [上|shàng] ， [就|jiù] [是|shì] [去|qù] {w.tower} [的|de] [路|lù] 。 [你|nǐ] [先|xiān] [上去|shàng qù] ， [我|wǒ] [马上|mǎ shàng] [就|jiù] [来|lái] ！'],
      ja: ['[次|つぎ] は [丘|おか] の [大|おお]だまりっこ です 。 [北|きた] へ の [道|みち] に います 。', '[次|つぎ] は [丘|おか] の [大|おお]だまりっこ です 。 ちょうど [北|きた] へ の [道|みち] 、 {w.tower} へ [行|い]く [道|みち] に いる ん です 。 [先|さき] に [行|い]って ください 。 [私|わたし] も すぐ [行|い]きます ！'],
      en: ['Now, the big one on the {c.hill}. It sits on the road {c.north}.', 'Now, the big one on the {c.hill}. It sits right on the road {c.north}, the road to the {w.tower}. You go first: I’ll be right behind you!'] },
    // Marga, pushing her cart, before Mimo asks what she's doing
    'farmer.demo': {
      es: ['¡Uf! ¡Empuja, Marga, empuja!', '¡Uf! ¡Empuja, Marga, empuja! Esta carreta pesa muchísimo…'],
      pt: ['Ufa! Empurra, Marga, empurra!', 'Ufa! Empurra, Marga, empurra! Essa carroça pesa demais…'],
      de: ['Uff! Schieb, Marga, schieb!', 'Uff! Schieb, Marga, schieb! Dieser Karren ist so schwer…'],
      zh: ['[哎哟|āi yō] ！ [推|tuī] [啊|a] ， [玛尔加|Mǎ ěr jiā] ， [推|tuī] ！', '[哎哟|āi yō] ！ [推|tuī] [啊|a] ， [玛尔加|Mǎ ěr jiā] ， [推|tuī] ！ [这|zhè] [辆|liàng] [车|chē] [真|zhēn] [重|zhòng] [啊|a] …'],
      ja: ['よいしょ ！ [押|お]して 、 マルガ 、 [押|お]して ！', 'よいしょ ！ [押|お]して 、 マルガ 、 [押|お]して ！ この [荷車|にぐるま] 、 [本当|ほんとう] に [重|おも]い …'],
      en: ['Phew! Push, Marga, push!', 'Phew! Push, Marga, push! This cart is soooo heavy…'] },
    // Lalo in the river, before Mimo asks what he's doing
    'lalo.demo': {
      es: ['¡Mira! ¡Nado como un pez! ¡Ven, nada!', '¡Mira! ¡Nado como un pez! Oye, pequeñín, ven al agua: ¡nada conmigo!'],
      pt: ['Olha! Eu nado igual a um peixe! Vem, nada!', 'Olha! Eu nado igual a um peixe! Ei, pequenininho, vem pra água: nada comigo!'],
      de: ['Schau! Ich schwimme wie ein Fisch! Komm, schwimm!', 'Schau! Ich schwimme wie ein Fisch! He, du Kleiner, komm ins Wasser: schwimm mit mir!'],
      zh: ['[看|kàn] ！ [我|wǒ] [游|yóu] [得|de] [像|xiàng] [鱼|yú] [一样|yī yàng] ！ [来|lái] ， [游泳|yóu yǒng] ！', '[看|kàn] ！ [我|wǒ] [游|yóu] [得|de] [像|xiàng] [鱼|yú] [一样|yī yàng] ！ [小|xiǎo] [家伙|jiā huo] ， [下来|xià lái] [吧|ba] ： [跟|gēn] [我|wǒ] [一起|yī qǐ] [游泳|yóu yǒng] ！'],
      ja: ['[見|み]て ！ [魚|さかな] みたい に [泳|およ]げる よ ！ ほら 、 [泳|およ]いで ！', '[見|み]て ！ [魚|さかな] みたい に [泳|およ]げる よ ！ ねえ 、 おちびちゃん 、 [水|みず] に おいで よ 。 いっしょ に [泳|およ]いで ！'],
      en: ['Look! I swim like a fish! Come on, swim!', 'Look! I swim like a fish! Hey, little one, come into the {w.water}: swim with me!'] },
    // arriving in Remanso: Mar asks Lino where her cat is («¿Dónde está…?» heard before you have to ask it), then who Marina is
    'remanso.ask': {
      es: ['Lino, ¿dónde está mi gato?', 'Oye, Lino, ¿dónde está mi gato? No lo veo por ningún lado.'],
      pt: ['Lino, onde está o meu gato?', 'Ei, Lino, onde está o meu gato? Não acho ele em lugar nenhum.'],
      de: ['Lino, wo ist meine Katze?', 'Du, Lino, wo ist meine Katze? Ich sehe sie nirgends.'],
      zh: ['[利诺|Lì nuò] ， [我|wǒ] [的|de] [猫|māo] [在|zài] [哪里|nǎ lǐ] ？', '[喂|wèi] ， [利诺|Lì nuò] ， [我|wǒ] [的|de] [猫|māo] [在|zài] [哪里|nǎ lǐ] ？ [我|wǒ] [到处|dào chù] [都|dōu] [找不到|zhǎo bù dào] [它|tā] 。'],
      ja: ['リノ さん 、 [猫|ねこ] は どこ です か ？', 'リノ さん 、 うち の [猫|ねこ] は どこ です か ？ どこ に も いない ん です 。'],
      en: ['Lino, where’s my {w.cat}?', 'Hey, Lino, where’s my {w.cat}? I can’t find him anywhere.'] },
    'remanso.there': {
      es: ['¿Tu gato? Está debajo de la barca. ¡Mira!', '¿Tu gato? Está ahí, debajo de la barca. ¡Mira, se le ve la cola!'],
      pt: ['O seu gato? Está debaixo do barco. Olha!', 'O seu gato? Está ali, debaixo do barco. Olha, dá pra ver o rabo!'],
      de: ['Deine Katze? Sie ist unter dem Boot. Schau!', 'Deine Katze? Die ist da drüben, unter dem Boot. Schau, man sieht den Schwanz!'],
      zh: ['[你|nǐ] [的|de] [猫|māo] ？ [在|zài] [船|chuán] [下面|xià miàn] 。 [你|nǐ] [看|kàn] ！', '[你|nǐ] [的|de] [猫|māo] ？ [就|jiù] [在|zài] [那边|nà biān] [的|de] [船|chuán] [下面|xià miàn] 。 [你|nǐ] [看|kàn] ， [能|néng] [看见|kàn jiàn] [它|tā] [的|de] [尾巴|wěi ba] ！'],
      ja: ['[猫|ねこ] ？ [船|ふね] の [下|した] に います よ 。 ほら ！', '[猫|ねこ] ？ あそこ 、 [船|ふね] の [下|した] に います よ 。 ほら 、 しっぽ が [見|み]えます ！'],
      en: ['Your {w.cat}? He’s under the boat. Look!', 'Your {w.cat}? He’s over there, under the boat. Look, you can see his tail!'] },
    'remanso.marina': {
      es: ['¿La jefa? Es Marina. Sabe todo del lago. ¿Dónde está? No sé… ¡Pregunten!', '¿La jefa del pueblo? Es Marina: sabe todo del lago y de la campana. ¿Dónde está ahora? Ay, no sé… ¡Pregunten por ahí!'],
      pt: ['A chefe? É a Marina. Ela sabe tudo do lago. Onde ela está? Não sei… Perguntem!', 'A chefe do vilarejo? É a Marina: ela sabe tudo do lago e do sino. Onde ela está agora? Ai, não sei… Perguntem por aí!'],
      de: ['Die Chefin? Das ist Marina. Sie weiß alles über den See. Wo sie ist? Keine Ahnung… Fragt herum!', 'Die Chefin vom Dorf? Das ist Marina: Sie weiß alles über den See und die Glocke. Wo ist sie gerade? Ach, keine Ahnung… Fragt einfach herum!'],
      zh: ['[村长|cūn zhǎng] ？ [是|shì] [玛丽娜|Mǎ lì nà] 。 [湖|hú] [的|de] [事|shì] [她|tā] [全|quán] [知道|zhī dào] 。 [她|tā] [在|zài] [哪里|nǎ lǐ] ？ [我|wǒ] [不|bù] [知道|zhī dào] … [你们|nǐ men] [问问|wèn wen] [别人|bié rén] [吧|ba] ！', '[我们|wǒ men] [村|cūn] [的|de] [村长|cūn zhǎng] ？ [是|shì] [玛丽娜|Mǎ lì nà] ： [湖|hú] [和|hé] [钟|zhōng] [的|de] [事|shì] [她|tā] [全|quán] [知道|zhī dào] 。 [她|tā] [现在|xiàn zài] [在|zài] [哪里|nǎ lǐ] ？ [哎|āi] ， [我|wǒ] [不|bù] [知道|zhī dào] … [你们|nǐ men] [去|qù] [问问|wèn wen] [别人|bié rén] [吧|ba] ！'],
      ja: ['[村長|そんちょう] さん ？ マリーナ さん です 。 [湖|みずうみ] の こと は [何|なん] でも [知|し]って います 。 どこ に いる か は … わかりません 。 [聞|き]いて みて ください ！', '[村長|そんちょう] さん ？ マリーナ さん です よ 。 [湖|みずうみ] の こと も 、 [鐘|かね] の こと も 、 [何|なん] でも [知|し]って います 。 [今|いま] どこ に いる か は … うーん 、 わかりません 。 だれか に [聞|き]いて みて ください ！'],
      en: ['The boss? That’s Marina. She knows everything about the lake. Where is she? I don’t know… Ask around!', 'The head of the village? That’s Marina: she knows everything about the lake and the {w.bell}. Where is she now? Oh, I don’t know… Ask around!'] },
    // Marina: Bartolo's lost things, and where to look (under, on top of, inside: what you'll tell him)
    'marina.lost': {
      es: ['Bartolo perdió sus cosas. ¿Están debajo de algo? ¿Encima? ¿Dentro?', 'Y Bartolo perdió sus cosas: el {w.oar}, el {w.lantern}, la {w.rope}… Búsquenlas bien: ¿están debajo de algo? ¿Encima de un barco? ¿Dentro de algo? Luego díganle dónde están.'],
      pt: ['O Bartolo perdeu as coisas dele. Estão debaixo de algo? Em cima? Dentro?', 'E o Bartolo perdeu as coisas dele: o {w.oar}, a {w.lantern}, a {w.rope}… Procurem bem: estão debaixo de alguma coisa? Em cima de um barco? Dentro de alguma coisa? Depois digam pra ele onde estão.'],
      de: ['Bartolo hat seine Sachen verloren. Sind sie unter etwas? Auf etwas? In etwas?', 'Und Bartolo hat seine Sachen verloren: das {w.oar}, die {w.lantern}, das {w.rope}… Sucht gut: Sind sie unter etwas? Auf einem Boot? In etwas drin? Dann sagt ihm, wo sie sind.'],
      zh: ['[巴托洛|Bā tuō luò] [的|de] [东西|dōng xi] [丢|diū] [了|le] 。 [在|zài] [什么|shén me] [下面|xià miàn] ？ [上面|shàng miàn] ？ [里面|lǐ miàn] ？', '[还有|hái yǒu] ， [巴托洛|Bā tuō luò] [的|de] [东西|dōng xi] [丢|diū] [了|le] ： {w.oar} 、 {w.lantern} 、 {w.rope} … [好好|hǎo hǎo] [找找|zhǎo zhao] ： [在|zài] [什么|shén me] [东西|dōng xi] [下面|xià miàn] ？ [在|zài] [船|chuán] [上面|shàng miàn] ？ [在|zài] [什么|shén me] [里面|lǐ miàn] ？ [然后|rán hòu] [告诉|gào su] [他|tā] [东西|dōng xi] [在|zài] [哪里|nǎ lǐ] 。'],
      ja: ['バルトロ さん は [物|もの] を なくしました 。 [何|なに]か の [下|した] ？ [上|うえ] ？ [中|なか] ？', 'それ に 、 バルトロ さん は [物|もの] を なくした ん です 。 {w.oar} 、 {w.lantern} 、 {w.rope} … よく [探|さが]して ください 。 [何|なに]か の [下|した] ？ [船|ふね] の [上|うえ] ？ [何|なに]か の [中|なか] ？ [見|み]つけたら 、 どこ に ある か [教|おし]えて あげて ください 。'],
      en: ['Bartolo lost his things. Are they under something? On top? Inside?', 'And Bartolo lost his things: his {w.oar}, his {w.lantern}, his {w.rope}… Look carefully: are they under something? On top of a boat? Inside something? Then tell him where they are.'] },
  };
  if (typeof LINES !== 'undefined') for (const k of Object.keys(LINES16)) if (!LINES[k]) LINES[k] = LINES16[k];
  // «Where is…?» as you'd ask it (the frame for the ask box, and the gloss after you hear it): zh / ja in the notation
  const WHERE_Q = { es: '¿Dónde está…?', pt: 'Onde está…?', de: 'Wo ist…?', zh: '… [在|zài] [哪里|nǎ lǐ] ？', ja: '… は どこ です か ？' };
  const WHERE_FRAME = { es: '¿Dónde está ___?', pt: 'Onde está ___?', de: 'Wo ist ___?', zh: '___ [在|zài] [哪里|nǎ lǐ] ？', ja: '___ は どこ です か ？' };

  // ------------------------------------------------------------ game-time helpers
  const wait = s => new Promise(r => waiters.push({ at: clock + s, r }));
  const tween = (s, fn) => new Promise(r => tweens.push({ t0: clock, s, fn, r }));
  const exclaim = w => (UI.lang === 'es' ? '¡' + cap(w) + '!' : cap(w) + '!');
  const ask = () => (UI.lang === 'es' ? '¿…?' : '…?');
  const lock = on => { G.sim.lock = on ? 1 : 0; };

  // ------------------------------------------------------------ the mix (DESIGN.md 16, playtest 5)
  // The user: "Everything should be a mix until it all eventually becomes your target language." No line is shown whole in the
  // language with all its English under it. A line is the English with the words you know in the language: the weave's slots
  // ({w.*} Mimo's words, {c.*} everyday ones), then, in the plain stretches between them, the words you've met in talks and
  // reading (js/talk/mix.js, MIX). Whole sentences in the language come as the weave rises (UI.fullLine: a growing share from
  // 0.48, every line from 0.70), with nothing under them. The English is a button (EN in the bubble), never the default.
  const mixOn = () => { try { return typeof MIX !== 'undefined' && MIX.ok(); } catch (e) { return false; } };
  // the English line, woven: its slots first, then the dictionary's words in the stretches between them (t: the line in the language)
  function mixParts(t, en, o = {}) {
    const parts = UI.weaveParts(en || '');
    if (!t || !mixOn()) return parts;
    let tl = String(t).replace(/\{mimo\}/g, UI.mimoName || 'Mimo');
    if (!isCJ()) tl = UI.plainText(tl);
    const out = [];
    // (the whole English, its slots in English: a stretch's subject, its sentence's start, its "?" can sit past a slot)
    const enOf = p => (p.id && p.tl ? (p.en || p.s) : (p.s || '')), all = parts.map(enOf).join('');
    let pre = '';
    for (const p of parts) {
      if (p.id || !p.s || !/\p{L}/u.test(p.s)) { out.push(p); pre += enOf(p); continue; }
      let ps = null; try { ps = MIX.parts(tl, p.s, { force: o.force, w: o.w, pre, post: all.slice(pre.length + p.s.length) }); } catch (e) { ps = null; }
      if (ps && ps.length) out.push(...ps); else out.push(p);
      pre += p.s;
    }
    return out;
  }
  // count a line's woven words once, as it's said (the weave's through LEX, the dictionary's through MIX)
  function noteParts(ps) {
    const dict = ps.filter(p => p.tl && (p.lex || p.did)), lex = ps.filter(p => p.tl && !p.lex && !p.did);
    if (dict.length && mixOn()) { try { MIX.note(dict); } catch (e) { /* */ } }
    UI.noteWoven(lex);
  }
  // A line for show(): whole in the language when the weave says so (o.whole: a song, sung in the language), else mixed.
  // t: the line in the language (zh / ja: the notation), en: its English (slots allowed). o: { key (which lines go whole first:
  // always the same ones), whole, mixT / mixEn (a richer pair to mix from), force }
  function mixLine(t, en, o = {}) {
    const W = LEX.weave(), enPlain = UI.weavePlain(en || '', { english: true });
    if (t && (o.whole || !en || UI.fullLine(o.key || en || t, W))) return { text: t, len: UI.plainLen(t), en: enPlain, under: false, say: UI.sayText(t) };
    const parts = mixParts(o.mixT || t, o.mixEn || en, o);
    noteParts(parts);
    return { parts, len: UI.partsLen(parts), en: o.mixEn ? UI.weavePlain(o.mixEn, { english: true }) : enPlain, under: false, say: t ? UI.sayText(t) : '' };
  }
  // The same mix for the side characters' own panels, cards and bubbles (DESIGN.md 17.3: teachers, kids, shops, the telenovela),
  // as HTML, once per line said: { html, en (the whole English, for their EN button), full (whole in the language), say }.
  // o: mixLine's (key, whole, force). (zh / ja: CJK fills {mimo} itself, 米莫 / ミモ)
  function mixHTML(t, en, o = {}) {
    const m = mixLine(t, en, o);
    return { html: m.parts ? UI.partsHTML(m.parts) : UI.words(isCJ() ? String(m.text) : String(m.text).replace(/\{mimo\}/g, UI.mimoName || 'Mimo')), en: m.en, full: !m.parts, say: m.say };
  }

  // ------------------------------------------------------------ lines that wait for you (E)
  // (o.under, English under a line, is gone: ui.js shows a line's English only when you press EN)
  function show(o) {
    if (o && o.name && typeof CJK !== 'undefined' && CJK.isCJK(UI.lang) && SPEAKER_CJ[o.name]) o = Object.assign({}, o, { name: CJK.plain(SPEAKER_CJ[o.name][UI.lang]) });
    if (o && o.under) o = Object.assign({}, o, { under: false });
    return new Promise(r => { line = Object.assign({ shown: 0, full: false }, o, { resolve: () => { if (o.done) o.done(); r(); } }); });
  }
  // A townsperson's own line (from town.js: { en, es, pt, de }), said through the mix like the rest. (full, from the side
  // characters: once "whole in the language, the English under it"; now every line mixes. A song, «♪ …», or full === 'tl'
  // stays whole in the language, with nothing under it: it's sung, and you write it down.)
  function sayInline(p, full) {
    const lines = p.lines || {}, text = lines[UI.lang] || '', en = lines.en || '';
    const o = mixLine(text, en, { key: (p.id || p.name || '') + ':' + en, whole: full === 'tl' || /^\s*♪/.test(text) });
    p.talking = true;
    return show(Object.assign(o, { who: 'town', name: p.name || '', at: p, done: () => { p.talking = false; } }));
  }
  // Small talk for everyone without a line of their own (DESIGN.md 14.6: you can talk to anyone). Each
  // person always says the same one (picked by their id); A1–A2, and never about the player's gender.
  const CHAT = {
    alba: [
      { en: 'Good morning! What a lovely day.', es: '¡Buenos días! Qué día tan bonito.', pt: 'Bom dia! Que dia lindo.', de: 'Guten Morgen! Was für ein schöner Tag.' },
      { en: 'Have you tried Marta’s bread? It’s the best in town.', es: '¿Ya probaste el pan de Marta? Es el mejor del pueblo.', pt: 'Já provou o pão da Marta? É o melhor da cidade.', de: 'Hast du schon Martas Brot probiert? Es ist das beste im Dorf.' },
      { en: 'It’s so quiet lately. Even the birds sing less.', es: 'Últimamente todo está muy callado. Hasta los pájaros cantan menos.', pt: 'Anda tudo tão quieto. Até os passarinhos cantam menos.', de: 'In letzter Zeit ist alles so still. Sogar die Vögel singen weniger.' },
      { en: 'The bell in the tower hasn’t rung in weeks.', es: 'La campana de la torre no suena desde hace semanas.', pt: 'O sino da torre não toca há semanas.', de: 'Die Glocke im Turm hat seit Wochen nicht geläutet.' },
      { en: 'Bruno trains in his yard every morning. He says it keeps him young.', es: 'Bruno entrena en su patio todas las mañanas. Dice que así se mantiene joven.', pt: 'O Bruno treina no quintal todas as manhãs. Ele diz que é isso que o mantém jovem.', de: 'Bruno trainiert jeden Morgen in seinem Hof. Er sagt, das hält ihn jung.' },
      { en: 'If you see the old tower up north, don’t go near it.', es: 'Si ves la torre vieja del norte, no te acerques.', pt: 'Se você vir a torre velha no norte, não chegue perto.', de: 'Wenn du den alten Turm im Norden siehst, geh nicht hin.' },
      { en: 'Talk a lot! They say the silence can’t take your words if you keep using them.', es: '¡Habla mucho! Dicen que el silencio no se lleva tus palabras si las sigues usando.', pt: 'Fale bastante! Dizem que o silêncio não leva as suas palavras se você continuar usando.', de: 'Rede viel! Man sagt, die Stille nimmt dir deine Wörter nicht, wenn du sie weiter benutzt.' },
    ],
    molinar: [
      { en: 'Good wind today. The mills are turning fast.', es: 'Hoy hay buen viento. Los molinos giran rápido.', pt: 'Hoje está ventando bem. Os moinhos estão girando rápido.', de: 'Heute ist guter Wind. Die Mühlen drehen sich schnell.' },
      { en: 'Hi! Have you seen the market yet?', es: '¡Hola! ¿Ya viste el mercado?', pt: 'Oi! Já viu o mercado?', de: 'Hallo! Warst du schon auf dem Markt?' },
      { en: 'Our flour goes to every town in the valley.', es: 'Nuestra harina va a todos los pueblos del valle.', pt: 'A nossa farinha vai para todas as cidades do vale.', de: 'Unser Mehl geht in jedes Dorf im Tal.' },
      { en: 'Ciro the clockmaker knows everything about the bells.', es: 'Ciro, el relojero, sabe todo sobre las campanas.', pt: 'O Ciro, o relojoeiro, sabe tudo sobre os sinos.', de: 'Ciro, der Uhrmacher, weiß alles über die Glocken.' },
      { en: 'Watch out for the armadillos in the hills. They roll!', es: 'Cuidado con los armadillos de las colinas. ¡Ruedan!', pt: 'Cuidado com os tatus nas colinas. Eles rolam!', de: 'Pass auf die Gürteltiere in den Hügeln auf. Die rollen!' },
      { en: 'When the Great Mill stopped, the whole town went quiet.', es: 'Cuando el Gran Molino se paró, todo el pueblo se quedó callado.', pt: 'Quando o Grande Moinho parou, a cidade inteira ficou quieta.', de: 'Als die Große Mühle stehen blieb, wurde die ganze Stadt still.' },
    ],
    remanso: [
      { en: 'The fish are biting today.', es: 'Hoy pican los peces.', pt: 'Hoje os peixes estão mordendo a isca.', de: 'Heute beißen die Fische.' },
      { en: 'From the end of the pier you can see the island.', es: 'Desde el final del muelle se ve la isla.', pt: 'Do fim do píer dá para ver a ilha.', de: 'Vom Ende des Stegs sieht man die Insel.' },
      { en: 'Bartolo used to sing while he rowed. Now he says nothing.', es: 'Bartolo cantaba mientras remaba. Ahora no dice nada.', pt: 'O Bartolo cantava enquanto remava. Agora não diz nada.', de: 'Bartolo hat beim Rudern immer gesungen. Jetzt sagt er nichts mehr.' },
      { en: 'The lighthouse has been dark for days.', es: 'El faro lleva días apagado.', pt: 'O farol está apagado há dias.', de: 'Der Leuchtturm ist seit Tagen dunkel.' },
      { en: 'Careful on the boards. They’re slippery!', es: 'Cuidado con las tablas. ¡Resbalan!', pt: 'Cuidado com as tábuas. Elas escorregam!', de: 'Vorsicht auf den Brettern. Die sind rutschig!' },
      { en: 'The frogs croak all night. I can’t sleep!', es: 'Las ranas croan toda la noche. ¡No puedo dormir!', pt: 'Os sapos coaxam a noite toda. Não consigo dormir!', de: 'Die Frösche quaken die ganze Nacht. Ich kann nicht schlafen!' },
    ],
  };
  // zh / ja (CJK.md), in the same order: [zh, ja] per line. Adults talk to you politely in ja.
  Object.entries({
    alba: [['[早上好|zǎo shang hǎo] ！ [今天|jīn tiān] [天气|tiān qì] [真|zhēn] [好|hǎo] 。', 'おはよう ございます ！ いい [天気|てんき] です ね 。'],
      ['[你|nǐ] [尝|cháng] [过|guo] [玛尔塔|Mǎ ěr tǎ] [的|de] [面包|miàn bāo] [吗|ma] ？ [是|shì] [镇上|zhèn shang] [最|zuì] [好|hǎo] [的|de] 。', 'マルタ さん の パン 、 [食|た]べた こと あります か ？ [町|まち] で いちばん です よ 。'],
      ['[最近|zuì jìn] [太|tài] [安静|ān jìng] [了|le] 。 [连|lián] [鸟|niǎo] [都|dōu] [不|bù] [怎么|zěn me] [唱|chàng] [了|le] 。', '[最近|さいきん] 、 とても [静|しず]か です ね 。 [鳥|とり] も あまり [歌|うた]わなく なりました 。'],
      ['[钟楼|zhōng lóu] [的|de] [钟|zhōng] [好|hǎo] [几|jǐ] [个|gè] [星期|xīng qī] [没|méi] [响|xiǎng] [了|le] 。', '[塔|とう] の [鐘|かね] が 、 [何週間|なんしゅうかん] も [鳴|な]って いません 。'],
      ['[布鲁诺|Bù lǔ nuò] [每天|měi tiān] [早上|zǎo shang] [在|zài] [院子|yuàn zi] [里|lǐ] [练功|liàn gōng] 。 [他|tā] [说|shuō] [这样|zhè yàng] [能|néng] [保持|bǎo chí] [年轻|nián qīng] 。', 'ブルーノ さん は [毎朝|まいあさ] 、 [庭|にわ] で [鍛|きた]えて います 。 [若|わか]さ の [秘訣|ひけつ] だ そう です よ 。'],
      ['[如果|rú guǒ] [你|nǐ] [看到|kàn dào] [北边|běi biān] [的|de] [古塔|gǔ tǎ] ， [别|bié] [靠近|kào jìn] 。', '[北|きた] の [古|ふる]い [塔|とう] を [見|み]て も 、 [近|ちか]づかない で ください ね 。'],
      ['[多|duō] [说话|shuō huà] ！ [听说|tīng shuō] [只要|zhǐ yào] [一直|yī zhí] [用|yòng] ， [寂静|Jì jìng] [就|jiù] [拿|ná] [不|bù] [走|zǒu] [你|nǐ] [的|de] [话|huà] 。', 'たくさん [話|はな]して ！ [言葉|ことば] を [使|つか]って いれば 、 [静寂|せいじゃく] に [取|と]られない そう です よ 。']],
    molinar: [['[今天|jīn tiān] [风|fēng] [不错|bù cuò] 。 [风车|fēng chē] [转|zhuàn] [得|de] [很|hěn] [快|kuài] 。', '[今日|きょう] は いい [風|かぜ] です ね 。 [風車|ふうしゃ] が [速|はや]く [回|まわ]って います 。'],
      ['[你好|nǐ hǎo] ！ [你|nǐ] [去|qù] [过|guo] [市场|shì chǎng] [了|le] [吗|ma] ？', 'こんにちは ！ もう [市場|いちば] を [見|み]ました か ？'],
      ['[我们|wǒ men] [的|de] [面粉|miàn fěn] [送到|sòng dào] [山谷|shān gǔ] [里|lǐ] [每|měi] [个|gè] [村子|cūn zi] 。', 'ここ の [小麦粉|こむぎこ] は 、 [谷|たに] の すべて の [町|まち] に [届|とど]きます 。'],
      ['[西罗|Xī luó] [是|shì] [钟表匠|zhōng biǎo jiàng] ， [钟|zhōng] [的|de] [事|shì] [他|tā] [全|quán] [知道|zhī dào] 。', '[時計屋|とけいや] の シロ さん は 、 [鐘|かね] の こと を [何|なん] でも [知|し]って います 。'],
      ['[小心|xiǎo xīn] [山坡|shān pō] [上|shàng] [的|de] [犰狳|qiú yú] 。 [它们|tā men] [会|huì] [滚|gǔn] ！', '[丘|おか] の アルマジロ に [気|き] を つけて 。 [転|ころ]がって きます よ ！'],
      ['[大磨坊|Dà mò fáng] [停|tíng] [了|le] [以后|yǐ hòu] ， [整个|zhěng gè] [镇子|zhèn zi] [都|dōu] [安静|ān jìng] [了|le] 。', '[大風車|だいふうしゃ] が [止|と]まって から 、 [町中|まちじゅう] が [静|しず]か に なりました 。']],
    remanso: [['[今天|jīn tiān] [鱼|yú] [很|hěn] [好|hǎo] [钓|diào] 。', '[今日|きょう] は よく [釣|つ]れます よ 。'],
      ['[从|cóng] [码头|mǎ tóu] [尽头|jìn tóu] [能|néng] [看见|kàn jiàn] [那|nà] [座|zuò] [岛|dǎo] 。', '[桟橋|さんばし] の [先|さき] から 、 [島|しま] が [見|み]えます 。'],
      ['[巴托洛|Bā tuō luò] [以前|yǐ qián] [边|biān] [划船|huá chuán] [边|biān] [唱歌|chàng gē] 。 [现在|xiàn zài] [一|yī] [句|jù] [话|huà] [也|yě] [不|bù] [说|shuō] 。', 'バルトロ さん は [昔|むかし] 、 [舟|ふね] を こぎ ながら [歌|うた]って いました 。 [今|いま] は [何|なに] も [言|い]いません 。'],
      ['[灯塔|dēng tǎ] [已经|yǐ jīng] [黑|hēi] [了|le] [好|hǎo] [几|jǐ] [天|tiān] [了|le] 。', '[灯台|とうだい] は 、 [何日|なんにち] も [消|き]えた まま です 。'],
      ['[木板|mù bǎn] [上|shàng] [小心|xiǎo xīn] ， [很|hěn] [滑|huá] ！', '[板|いた] の [上|うえ] は [気|き] を つけて 。 [滑|すべ]ります よ ！'],
      ['[青蛙|qīng wā] [叫|jiào] [了|le] [一|yī] [整|zhěng] [夜|yè] 。 [我|wǒ] [睡|shuì] [不|bù] [着|zháo] ！', 'カエル が [一晩中|ひとばんじゅう] [鳴|な]いて いて 、 [眠|ねむ]れません ！']],
  }).forEach(([k, rows]) => rows.forEach(([zh, ja], i) => { if (CHAT[k] && CHAT[k][i]) Object.assign(CHAT[k][i], { zh, ja }); }));
  const idSeed = id => [...String(id || 'x')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  function chat(p, region) { const pool = CHAT[region] || CHAT.alba; return sayInline(Object.assign(p, { lines: p.lines || pool[idSeed(p.id || p.name) % pool.length] })); }
  // Hugo the sweeper is going bald, and his hair grows back as the story goes on (town.js hairAt, DESIGN.md 14.8).
  // Ask him what happened to it and you get one word. Nothing else.
  const HUGO_HAIR = { en: 'Nothing.', es: 'Nada.', pt: 'Nada.', de: 'Nichts.', zh: '[没|méi] [什么|shén me] 。', ja: 'べつに 。' };
  async function hugoTalk(p) {
    lock(true);
    const pick = await UI.choose('Hugo', [{ label: 'Chat', value: 'chat' }, { label: 'What happened to your hair?', value: 'hair' }]);
    lock(false);
    if (pick === 'chat') return chat(p, 'alba');
    if (pick !== 'hair') return;
    await you('Hugo… what happened to your hair?');
    p.talking = true;
    await show(Object.assign(mixLine(HUGO_HAIR[UI.lang] || '', HUGO_HAIR.en, { key: 'hugo.hair' }), { who: 'town', name: p.name, at: p, done: () => { p.talking = false; } }));
  }
  // More ways to talk (free talk, js/talk/: DESIGN.md 15.3). Every Talk asks the hooks in STORY.talkHooks when you press E: a hook
  // is fn(item) → [{ label, sub, run }] or null, item the Talk interactable ({ x, z, who: the story's id, p: the person, region }).
  // With an offer, Talk opens a little menu like Hugo's (Chat runs the usual Talk); with none, nothing changes.
  const talkHooks = [];
  function talkMenu(it) {
    if (!it || it.label !== 'Talk' || !talkHooks.length) return it && it.run;
    return async () => {
      let more = [];
      for (const h of talkHooks) { try { const o = h(it); if (o && o.length) more = more.concat(o); } catch (e) { console.error('[talk hook]', e); } }
      if (!more.length) return it.run();
      const nm = it.p && it.p.name ? it.p.name : it.who ? nameOf(it.who) : '';
      const title = nm && typeof CJK !== 'undefined' && CJK.isCJK(UI.lang) && SPEAKER_CJ[nm] ? CJK.plain(SPEAKER_CJ[nm][UI.lang]) : nm;
      lock(true);
      const pick = await UI.choose(title || 'Talk', [{ label: 'Chat', value: 'chat' }].concat(more.map((o, i) => ({ label: o.label, sub: o.sub, value: i }))));
      lock(false);
      if (pick === 'chat') return it.run();
      if (pick !== null && more[pick]) return more[pick].run();
    };
  }
  // The hushed (DESIGN.md 14.6): they talk flat and slow, and the Hush has eaten most of their words.
  // What's left (*starred*) hints at what it is: it takes the words of people who stopped using them.
  const HUSHED = {
    pedro: { en: 'I was always *afraid* to say things *wrong*. So I *stopped* talking. Then the *gray* came… and took the *rest*.',
      es: 'Siempre tuve *miedo* de decir las cosas *mal*. Así que *dejé* de hablar. Luego vino lo *gris*… y se llevó *lo* *demás*.',
      pt: 'Eu sempre tive *medo* de falar *errado*. Então eu *parei* de falar. Aí veio o *cinza*… e levou *o* *resto*.',
      de: 'Ich hatte immer *Angst*, etwas *falsch* zu sagen. Also *hörte* ich auf zu reden. Dann kam das *Grau* … und nahm *den* *Rest*.' },
    ruben: { en: '*Fish*… fresh *fish*… I used to *shout* it… every *morning*…', es: '*Pescado*… *pescado* fresco… antes lo *gritaba*… cada *mañana*…',
      pt: '*Peixe*… *peixe* fresco… eu *gritava* isso… toda *manhã*…', de: '*Fisch* … frischer *Fisch* … ich hab es *gerufen* … jeden *Morgen* …' },
    nina: { en: 'My *song*… I *forgot* how it *goes*…', es: 'Mi *canción*… *olvidé* cómo *era*…', pt: 'A minha *música*… eu *esqueci* como *era*…', de: 'Mein *Lied* … ich hab *vergessen*, wie es *geht* …' },
    simon: { en: 'The *tower*… a *voice* from the *tower*… it said: *quiet*…', es: 'La *torre*… una *voz* desde la *torre*… dijo: *silencio*…',
      pt: 'A *torre*… uma *voz* lá da *torre*… disse: *silêncio*…', de: 'Der *Turm* … eine *Stimme* vom *Turm* … sie sagte: *still* …' },
    gil: { en: '*Cheap*… everything *cheap*… nobody *asks*… so I don’t *say*…', es: '*Barato*… todo *barato*… nadie *pregunta*… así que no *digo*…',
      pt: '*Barato*… tudo *barato*… ninguém *pergunta*… então eu não *falo*…', de: '*Billig* … alles *billig* … keiner *fragt* … also *sag* ich nichts …' },
    bartolo: { en: 'The *island*… the *bell*… so *quiet* out there…', es: 'La *isla*… la *campana*… qué *callado* está todo…', pt: 'A *ilha*… o *sino*… tão *quieto* lá…', de: 'Die *Insel* … die *Glocke* … so *still* da draußen …' },
    _any: { en: '… … …', es: '… … …', pt: '… … …', de: '… … …' },
  };
  // zh / ja (CJK.md notation): flat, half-swallowed fragments; each *starred* word that survives the Hush is a single token
  Object.entries({
    pedro: ['[我|wǒ] [一直|yī zhí] *[害怕|hài pà]* [说|shuō] *[错|cuò]* 。 [所以|suǒ yǐ] [我|wǒ] *[不|bù]* [再|zài] [说话|shuō huà] 。 [后来|hòu lái] *[灰色|huī sè]* [来|lái] [了|le] … [拿走|ná zǒu] [了|le] *[剩下|shèng xià]* [的|de] 。',
      'いつも 、 [間違|まちが]える の が *[怖|こわ]かった* 。 だから *[話|はな]す* の を *やめた* 。 それ から *[灰色|はいいろ]* が [来|き]て … *[残|のこ]り* を [持|も]って いった 。'],
    ruben: ['*[鱼|yú]* … [新鲜|xīn xiān] [的|de] *[鱼|yú]* … [我|wǒ] [以前|yǐ qián] [天天|tiān tiān] *[喊|hǎn]* … [每天|měi tiān] *[早上|zǎo shang]* …',
      '*[魚|さかな]* … [新鮮|しんせん] な *[魚|さかな]* … [前|まえ] は *[叫|さけ]んで* いた … *[毎朝|まいあさ]* …'],
    nina: ['[我|wǒ] [的|de] *[歌|gē]* … [我|wǒ] *[忘了|wàng le]* [怎么|zěn me] *[唱|chàng]* …', 'わたし の *[歌|うた]* … どう *[歌|うた]う* か … *[忘|わす]れた* …'],
    simon: ['*[塔|tǎ]* … *[塔|tǎ]* [里|lǐ] [有|yǒu] [一|yī] [个|gè] *[声音|shēng yīn]* … [它|tā] [说|shuō] ： *[安静|ān jìng]* …', '*[塔|とう]* … *[塔|とう]* から の *[声|こえ]* … [言|い]った … *[静|しず]かに* …'],
    gil: ['*[便宜|pián yi]* … [全|quán] [都|dōu] *[便宜|pián yi]* … [没|méi] [人|rén] *[问|wèn]* … [所以|suǒ yǐ] [我|wǒ] [也|yě] [不|bù] *[说|shuō]* …', '*[安|やす]い* … ぜんぶ *[安|やす]い* … だれ も *[聞|き]かない* … だから *[言|い]わない* …'],
    bartolo: ['*[岛|dǎo]* … *[钟|zhōng]* … [那边|nà biān] [好|hǎo] *[安静|ān jìng]* …', '*[島|しま]* … *[鐘|かね]* … あそこ は とても *[静|しず]か* …'],
    _any: ['… … …', '… … …'],
  }).forEach(([k, [zh, ja]]) => { if (HUSHED[k]) Object.assign(HUSHED[k], { zh, ja }); });
  function blankOut(s, seed) {
    const R = rng(seed);
    return s.split(' ').map(w => {
      if (/^[¿¡]?\*.*\*[.,…!?]*$/.test(w)) return w.replace(/\*/g, '');      // (a starred word survives, «¿*Dónde*…» too)
      if (/^[….]+$/.test(w) || /^[。、，！？：；「」“”]+$/.test(w)) return w;      // (zh / ja punctuation is its own token: it stays)
      const m = w.match(/^(.*?)([.,…!?;:]*)$/);
      return R() < 0.55 ? '▬' + m[2] : w;
    }).join(' ');
  }
  // A hushed line, mixed (DESIGN.md 16): the Hush eats most of the words, and the ones that survive (*starred*) are the clue, so
  // they come in the language, glossed small, in the blanked English (the k-th starred word of each line, when both have as
  // many; else the usual mix). As the weave rises, the whole line in the language, blanked the same way, with nothing under it.
  // tl / en: the starred lines (zh / ja: the notation); seed: whose blanks; key: which lines go whole first.
  function hushLine(tl, en, seed, key) {
    tl = String(tl || ''); en = String(en || '');
    const starsT = (tl.match(/\*[^*]+\*/g) || []).map(s => s.slice(1, -1)), starsE = (en.match(/\*[^*]+\*/g) || []);
    if (tl && UI.fullLine(key, LEX.weave())) {
      const t0 = isCJ() ? tl.replace(/\[[^\]]*\]/g, m => m.replace(/ /g, ' ')) : tl;      // (a bracket's pinyin stays whole while words are blanked)
      const text = starsT.length ? blankOut(t0, seed).replace(/ /g, ' ') : tl;     // (a line with no starred words is already what's left of it)
      return { text, len: UI.plainLen(text), en: blankOut(en, seed), under: false };
    }
    if (!tl || !starsT.length || starsT.length !== starsE.length) { const enB = blankOut(en, seed), parts = mixParts(tl.replace(/\*/g, ''), enB); return { parts, len: UI.partsLen(parts), en: enB, under: false }; }
    // the same blanks blankOut() makes (the same rng, word by word), with each starred word swapped for the language's
    const R = rng(seed), parts = []; let buf = '', k = 0;
    en.split(' ').forEach((w, i) => {
      const sp = i ? ' ' : '';
      if (/^\*.*\*[.,…!?]*$/.test(w)) { const m = w.match(/^\*(.*)\*(.*)$/); parts.push({ s: buf + sp }); buf = ''; parts.push(wordPart(null, starsT[k++], m[1])); buf = m[2]; return; }
      if (/^[….]+$/.test(w)) { buf += sp + w; return; }
      const m = w.match(/^(.*?)([.,…!?;:]*)$/); buf += sp + (R() < 0.55 ? '▬' + m[2] : w);
    });
    if (buf) parts.push({ s: buf });
    const out = parts.filter(p => p.s || p.src);
    return { parts: out, len: UI.partsLen(out), en: blankOut(en, seed), under: false };
  }
  // the regions' hushed people (caves.js, gardens.js, mine.js) say theirs through here too
  function sayHushed(p, tl, en, o = {}) {
    const seed = o.seed != null ? o.seed : idSeed(p.id || p.name);
    p.talking = true;
    return show(Object.assign(hushLine(tl, en, seed, o.key || 'hushed.' + (p.id || p.name)), { who: 'town', name: p.name || '…', at: p, say: '', hushed: true, done: () => { p.talking = false; } }));
  }
  function hushedTalk(p) {
    const L = HUSHED[p.id] || HUSHED._any;
    G.sim.mimo.scared = Math.max(G.sim.mimo.scared, 2.5);
    return sayHushed(p, L[UI.lang] || '', L.en, { seed: idSeed(p.id), key: 'hushed.' + p.id });
  }
  // Someone says a line from lines.js. Early on that's English with words in the language woven
  // in; once your pace and words allow, it's the whole line in the language with the English under it.
  // (DESIGN.md 16: a mix, never the whole line with its English under it. The mixed line is the richest English, with the words
  // you know from the richest line in the language; a whole line in the language is the one for your level, EN on request.)
  function say(who, key) {
    const npc = G.sim.npc(who);
    if (npc) npc.talking = true;
    const L = UI.lineFor(key, LEX.tier()), R = UI.lineFor(key, 9);    // (the lines.js picker; a zh / ja line not written yet → the English weave)
    const o = mixLine(L.text, L.en || L.weave, { key, mixT: R.text || L.text, mixEn: L.weave });
    return show(Object.assign(o, { who, name: nameOf(who), done: () => { if (npc) npc.talking = false; } }));
  }
  // Your own lines, in English (words Mimo knows show in the language).
  function you(text) { const parts = UI.weaveParts(text); return show({ who: 'you', name: 'You', parts, len: UI.partsLen(parts) }); }
  // Mimo can't talk yet: just sounds, and words you've taught it.
  function mimoLine(text) { const parts = UI.weaveParts(text); Sound.play('babble'); return show({ who: 'mimo', name: G.state.mimoName, parts, len: UI.partsLen(parts) }); }
  // A passing thought that floats by on its own (for small things; story lines use you()).
  function think(text, s) { thought = { html: UI.weave(text), t: s || clamp(text.length * 0.065, 3.5, 7) }; }

  // ------------------------------------------------------------ demonstrations (DESIGN.md 7.9 and 16: you hear it before you're asked)
  const isCJ = () => typeof CJK !== 'undefined' && CJK.isCJK(UI.lang);
  // Someone uses a word while doing the thing (playtest 5: no English under it). The sentence is whole in the language and said
  // out loud, with the word being shown highlighted and glossed small; the action, the picture and the words you already know
  // carry the rest, and EN gives the English on request. marks: what's being shown, as LEX ids (a verb, a word) and/or
  // [the words as written (zh / ja: notation tokens), their English], one list or one per language ({ es: […], … }).
  const CJ_CHUNK = /(?:[^\s[\]]*\[[^\]]*\])+[^\s[\]]*|\S+/g;
  const escRe = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  function markList(marks) {
    const l = UI.lang, M = Array.isArray(marks) ? marks : (marks && marks[l]) || [], out = [];
    for (const m of M) {
      if (typeof m === 'string') {                     // a LEX id: its forms in the language, and its English
        const it = LEX.item(m); if (!it) continue;
        for (const f of [isCJ() ? LEX.src(m) : LEX.form(m)].concat((it.alt && it.alt[l]) || [])) if (f) out.push({ w: String(f), en: it.en || '', g: m });
      } else if (Array.isArray(m) && m[0]) out.push({ w: String(m[0]), en: m[1] || '', g: m[0] });
    }
    return out.sort((a, b) => b.w.length - a.w.length);       // (longest first: «no le gustan» before «le gustan»)
  }
  function demoHTML(t, marks) {
    const M = markList(marks), done = new Set(); if (!M.length) return '';
    const glossOnce = m => (done.has(m.g) ? '' : (done.add(m.g), `<span class="gl">(${esc(m.en)})</span>`));
    if (isCJ()) {          // chunk by chunk (MIX.tlHTML's way): a word's run of tokens wrapped, spaces between words in pinyin / rōmaji
      const l = UI.lang, roman = CJK.mode(l) !== 'chars', ch = String(t).match(CJ_CHUNK) || [], tag = new Array(ch.length).fill(null);
      for (const m of M) { const toks = m.w.match(CJ_CHUNK) || []; if (!toks.length) continue; for (let i = 0; i + toks.length <= ch.length; i++) if (!tag.slice(i, i + toks.length).some(Boolean) && toks.every((x, j) => ch[i + j] === x)) for (let j = 0; j < toks.length; j++) tag[i + j] = { m, last: j === toks.length - 1 }; }
      let out = '', cap = true;
      ch.forEach((c, i) => {
        const pun = !/\[/.test(c) && /^[\p{P}\p{S}]+$/u.test(c), h = CJK.html(c, { lang: l, cap }), g = tag[i];
        out += (out && roman && !pun ? ' ' : '') + (g ? `<span class="w" data-en="${esc(g.m.en)}">${h}</span>${g.last ? glossOnce(g.m) : ''}` : h);
        cap = pun ? /[。！？.!?「『“]/.test(c) || cap : false;
      });
      return out;
    }
    // es / pt / de: the line as the weave shows it ({w.*} slots highlighted), then each mark wrapped where it stands as a word
    const html = UI.words(String(t).replace(/\{mimo\}/g, UI.mimoName || 'Mimo'));
    const re = new RegExp(`(^|[^\\p{L}])(${M.map(m => escRe(esc(m.w))).join('|')})(?![\\p{L}])`, 'giu');
    return html.split(/(<[^>]*>)/).map(seg => (seg.startsWith('<') ? seg : seg.replace(re, (all, pre, w) => {
      const m = M.find(x => esc(x.w).toLowerCase() === w.toLowerCase());
      return m ? `${pre}<span class="w" data-en="${esc(m.en)}">${w}</span>${glossOnce(m)}` : all;
    }))).join('');
  }
  // the line object: typed out as the plain line, then shown with its marks (ui.js drawLine: L.html once the line is out)
  function demoObj(t, en, marks) {
    const sayIt = UI.sayText(t);
    setTimeout(() => { try { UI.speak(sayIt); } catch (e) { /* (no voice on this PC) */ } }, 250);
    return { text: t, html: demoHTML(t, marks) || null, len: UI.plainLen(t), en: UI.weavePlain(en || '', { english: true }), under: false, say: sayIt, demo: true };
  }
  // the marks of the story's own demonstrations (the regions pass theirs to demoLine)
  const DEMO_MARKS = {
    'farmer.demo': ['v.push'], 'lalo.demo': ['v.swim'],
    'remanso.ask': { es: [['dónde está', 'where is'], 'w.cat'], pt: [['onde está', 'where is'], 'w.cat'], de: [['wo ist', 'where is'], 'w.cat'], zh: [['[在|zài] [哪里|nǎ lǐ]', 'where is'], 'w.cat'], ja: [['どこ', 'where'], 'w.cat'] },
    'remanso.there': { es: [['debajo de', 'under'], ['barca', 'boat']], pt: [['debaixo do', 'under the'], ['barco', 'boat']], de: [['unter dem', 'under the'], ['Boot', 'boat']], zh: [['[下面|xià miàn]', 'under'], ['[船|chuán]', 'boat']], ja: [['[下|した]', 'under'], ['[船|ふね]', 'boat']] },
    'remanso.marina': { es: [['jefa', 'the boss'], ['Pregunten', 'ask']], pt: [['chefe', 'the boss'], ['Perguntem', 'ask']], de: [['Chefin', 'the boss'], ['Fragt', 'ask']], zh: [['[村长|cūn zhǎng]', 'the village head'], ['[问问|wèn wen]', 'ask']], ja: [['[村長|そんちょう]', 'the village head'], ['[聞|き]いて', 'ask']] },
    'marina.lost': { es: [['debajo', 'under'], ['Encima', 'on top'], ['Dentro', 'inside']], pt: [['debaixo', 'under'], ['Em cima', 'on top'], ['Dentro', 'inside']], de: [['unter', 'under'], ['Auf', 'on top of'], ['In', 'in']],
      zh: [['[下面|xià miàn]', 'under'], ['[上面|shàng miàn]', 'on top'], ['[里面|lǐ miàn]', 'inside']], ja: [['[下|した]', 'under'], ['[上|うえ]', 'on top'], ['[中|なか]', 'inside']] },
  };
  // a demonstration over a person (p: { x, y, z, top }), from a lines.js key
  function demoAt(p, key, name, marks) {
    const L = UI.lineFor(key, LEX.tier());
    if (!L.text || !p) return sayAt(p, key, name);
    p.talking = true;
    return show(Object.assign(demoObj(L.text, L.en, marks || DEMO_MARKS[key]), { who: 'town', name: name || p.name || '', at: p, done: () => { p.talking = false; } }));
  }
  // the same from a { en, es, pt, de, zh, ja } table (the regions' demonstrations); no line in the language: the mix
  function demoLine(p, T, marks) {
    const t = (T && T[UI.lang]) || '';
    if (!t || !p) { if (p) { p.lines = { en: (T && T.en) || '', [UI.lang]: t }; return sayInline(p); } return Promise.resolve(); }
    p.talking = true;
    return show(Object.assign(demoObj(t.replace(/\{mimo\}/g, UI.mimoName || 'Mimo'), T.en, marks), { who: 'town', name: p.name || '', at: p, done: () => { p.talking = false; } }));
  }
  // the same for the story's own people (Rosa, Bruno…), by their id
  function sayFull(who, key, marks) {
    const npc = G.sim.npc(who), L = UI.lineFor(key, LEX.tier());
    if (!L.text) return say(who, key);
    if (npc) npc.talking = true;
    return show(Object.assign(demoObj(L.text, L.en, marks || DEMO_MARKS[key]), { who, name: nameOf(who), done: () => { if (npc) npc.talking = false; } }));
  }
  // A word (a LEX id) or a phrase (src: es/pt/de text, or zh / ja notation; en: its English) as a woven part: in the language,
  // highlighted, with its English gloss after it (zh / ja: with its reading)
  function wordPart(id, src0, en0) {
    const it = id ? LEX.item(id) || {} : {}, en = en0 || it.en || '';
    if (isCJ()) { const src = src0 || LEX.src(id); return { s: CJK.plain(src, { lang: UI.lang, cap: false }), id: id || 'phrase', tl: true, en, gl: en, src, cap: false, len: CJK.len(src, { lang: UI.lang, cap: false }) }; }
    return { s: src0 || LEX.form(id), id: id || 'phrase', tl: true, en, gl: en };
  }
  // your own line with that word in it: youWord('«', wordPart('v.push'), '»… she says it every time she pushes!')
  function youWord(before, part, after) {
    const parts = UI.weaveParts(before).concat([part], UI.weaveParts(after || ''));
    return show({ who: 'you', name: 'You', parts, len: UI.partsLen(parts) });
  }
  // A word someone is about to say, and you'll be asked for: from the next woven line on it shows in the language, glossed
  function introduce(id) {
    if (!LEX.item(id) || LEX.taught(id) || (isCJ() && !LEX.has(id))) return;
    LEX.expose(id); const s = LEX.st(id); if (s.stage <= LEX.STAGE.SEEN) s.adm = true;
  }
  // the plain text of a phrase in the save's language (zh / ja notation → the mode's text)
  const phraseOf = T => { const t = T[UI.lang] || T.es; return isCJ() ? CJK.plain(t, { lang: UI.lang, cap: false }) : t; };

  // ------------------------------------------------------------ teaching Mimo
  async function teachWord(id, o = {}) {
    const { sim } = G, M = sim.mimo;
    if (o.spot) sim.mimoGo(o.spot, o.look || o.spot);
    else if (o.look) sim.mimoGo(null, o.look);
    await wait(0.5);
    M.tiltT = 99; sim.mimoSay(ask(), 99);
    G.state.teaching = true;
    // frame Mimo and the thing it's asking about, above the teach box
    const tgt = o.look || o.spot;
    if (tgt) {
      // A three-quarter side view of Mimo looking at the thing, from the side away from you,
      // so you don't stand in the way; the other side if something solid blocks the view.
      const Y = sim.you;
      let dx = tgt.x - M.x, dz = tgt.z - M.z, d = Math.hypot(dx, dz);
      if (d < 0.6) { dx = M.x - Y.x; dz = M.z - Y.z; d = Math.hypot(dx, dz) || 1; }
      dx /= d; dz /= d;
      const px = -dz, pz = dx, away = (Y.x - M.x) * px + (Y.z - M.z) * pz > 0 ? -1 : 1;
      const blocked = (cx, cz) => { let n = 0; for (let k = 0; k <= 4; k++) { const qx0 = lerp(cx, M.x, k / 5), qz0 = lerp(cz, M.z, k / 5); const [qx, qz] = WORLD.pushOut(qx0, qz0, 0.7); if (Math.hypot(qx - qx0, qz - qz0) > 0.01) n++; if (Math.abs(qx0) < 2.4 && Math.abs(qz0 - 60.3) < 0.9) n += 2; if (Math.hypot(qx0 - Y.x, qz0 - Y.z) < 0.8) n += 2; } return n; };
      const sides = [away, -away].map(s => ({ x: M.x + px * s * 4.2 - dx * 1.8, z: M.z + pz * s * 4.2 - dz * 1.8 }));
      const c = blocked(sides[0].x, sides[0].z) <= blocked(sides[1].x, sides[1].z) ? sides[0] : sides[1];
      const reach = Math.min(d, 6) * 0.35;
      G.cam.override = { pos: V(c.x, M.ry + 2.4, c.z), look: V(M.x + dx * reach, M.ry + 0.15, M.z + dz * reach) };
    }
    const r = await UI.teach(id, { name: G.state.mimoName, review: o.review, title: o.title });
    G.state.teaching = false;
    G.cam.override = null;
    M.tiltT = 0; M.say = null;
    if (r.ok) {
      const first = !LEX.taught(id);
      if (r.learned) LEX.learnt(id);              // you were shown it: it comes back for a review soon
      else LEX.attempt(id, { ok: true, hints: r.hints, ms: r.ms, mode: o.review ? 'review' : 'teach' });
      M.happy = 1.5; M.glow = 1;
      // Mimo says back the word you taught it: your word if you used another accepted one ("seta")
      const said = (r.typed && LEX.matchForm(id, r.typed)) || LEX.form(id), other = said !== LEX.form(id);
      sim.mimoSay(exclaim(said), 2.6);
      M.babbleT = 30 + Math.random() * 20;        // and no random babbling over it
      sim.emit(first ? 'learned' : 'reviewed', { id });
      // (typed without its accent: right all the same, with a tip; P6a, accents.js)
      const tw = String(r.typed || '').trim().split(/\s+/).pop(), accTip = typeof ACCENTS !== 'undefined' && tw && ACCENTS.isLat() && ACCENTS.same(tw, said) && !ACCENTS.exactly(tw, said) ? ' · ' + ACCENTS.tip(said, undefined, tw) : '';
      UI.toast(r.learned ? `You learned «${said}» together. ${G.state.mimoName} will ask again soon!`
        : (first ? `${G.state.mimoName} learned «${said}»` : `${G.state.mimoName} remembers «${said}»${r.hints ? '' : ' ✓'}`) + (other ? ` (around here they also say «${LEX.form(id)}»)` : '') + accTip);
    } else {
      if (r.hints) LEX.attempt(id, { ok: false, hints: r.hints, ms: 15000, mode: o.review ? 'review' : 'teach' });
      M.sad = 1.6; sim.mimoSay('…', 1.4);
    }
    sim.mimoGo(null, null);
    // a breather before Mimo asks about anything else
    curiosityCool = Math.max(curiosityCool, 20); reviewCool = Math.max(reviewCool, 25);
    G.save();
    return r;
  }

  // ------------------------------------------------------------ the prologue: letters, the old tower, the last stop, the egg
  async function prologue() {
    const { sim, w3d, cast } = G;
    busy = true; lock(true);
    Sound.setSong('title');
    await UI.fade(1, 500);
    // the journey: you board the train with a surprise for Noa (an egg from the pet shop back home)
    // and reread her letters on the way; the last one is strange (DESIGN.md 12.10)
    const readLetters = async () => { for (let i = 0; i < LETTERS.length; i++) await UI.letter(i, { last: i === LETTERS.length - 1 }); };
    if (G.cutaway && G.hasCutaway && G.hasCutaway('journey')) await G.cutaway('journey', null, { onPause: readLetters });
    else await readLetters();
    // far to the north: who's behind the Hush (a cutaway, like a peek at the villain)
    if (G.cutaway) await G.cutaway('open', ['Far to the north stands an old tower.', 'Something up there is swallowing every word.', 'And somewhere, a letter is losing its words.']);
    // the platform: you, the egg in your hands, the train still steaming behind you
    w3d.drawSign(SIGN[UI.lang]);
    sim.you.x = 3.4; sim.you.z = 61.8; sim.you.yaw = Math.PI; sim.snap();
    cast.hero.hands.add(cast.egg.root); cast.egg.root.position.set(0, -0.08, 0.06); cast.egg.root.scale.setScalar(0.9);
    cast.hero.holding = cast.egg;
    G.cam.snap(Math.PI, 0.22, 7.5);
    await UI.fade(0, 900);
    await UI.chapter('The End of the Line', 'Chapter 0');
    await you('The last stop. Noa said she’d wait for me here… but there’s nobody on the platform.');
    await you('Maybe she’s just running late. I can’t wait to see her face when she sees her surprise…');
    await hatch();
    // the train pulls out once Mimo has its first word
    w3d.train.departs(); Sound.play('whistle');
    G.sim.mimo.happy = 1; G.sim.mimo.look = { x: 40, z: WORLD.L.rails };
    await you('Bye, {w.train}!');
    G.sim.mimo.look = null;
    await you('Okay, {mimo}. Noa wasn’t here to meet us, and her last {w.letter} was so strange. Her village is north of here, through the forest. Let’s go find her.');
    // (tell the player, plainly, that Mimo can always show the way)
    G.sim.mimo.happy = 1; G.sim.mimoSay('!', 1.2); Sound.play('chirp');
    await you('And if I ever get lost… you’ll show me the way, won’t you, {mimo}?');
    lock(false); busy = false;
    G.state.flags.hatched = true;           // (quests.js shows its tip next: the tracker, the quest log's key, and Q)
    G.save();
  }
  async function hatch() {
    const { sim, cast, w3d, cam } = G, Y = sim.you, egg = cast.egg;
    cam.override = { pos: V(Y.x + 0.6, Y.ry + 1.5, Y.z - 3.4), look: V(Y.x, Y.ry + 0.75, Y.z - 0.4) };
    think('…It’s moving!', 2);
    for (let k = 0; k < 3; k++) {
      Sound.play('crack');
      await tween(0.45, t => { egg.wob.rotation.z = Math.sin(t * Math.PI * 6) * 0.25 * (1 - t); egg.glow.material.opacity = 0.3 + k * 0.2; });
      await wait(0.5);
    }
    // set the egg down on the platform
    const floor = V(Y.x, Y.ry, Y.z - 0.75);
    w3d.scene.add(egg.root); egg.root.position.copy(floor); egg.root.scale.setScalar(0.9);
    cast.hero.holding = null;
    await wait(0.6);
    Sound.play('hatch');
    w3d.fx.sparkle(floor.x, floor.y + 0.4, floor.z, 22);
    await tween(0.5, t => { egg.upper.position.set(t * 0.5, 0.27 + Math.sin(t * Math.PI) * 0.8 + t * 0.2, 0); egg.upper.rotation.z = -t * 2.4; egg.glow.material.opacity = 1 - t * 0.4; });
    const M = sim.mimo;
    M.hidden = false; M.x = floor.x; M.z = floor.z; M.y = M.ry = floor.y; M.yaw = 0; M.look = { x: Y.x, z: Y.z };
    cast.mimo.root.visible = true; cast.mimoShadow.visible = true;
    await tween(0.45, t => cast.mimo.root.scale.setScalar(0.85 * easeOutBack(t, 2.4)));
    await tween(0.6, t => { egg.upper.position.y = lerp(1.27, -0.2, t); egg.root.scale.setScalar(0.9 * (1 - t)); egg.glow.material.opacity = 0.6 * (1 - t); });
    egg.root.visible = false;
    await wait(0.4);
    M.blink = 0.15; await wait(0.5); M.blink = 0.15; await wait(0.4);
    sim.mimoSay(ask(), 1.6); M.tiltT = 1.6; Sound.play('chirp');
    await wait(1.4);
    M.happy = 0.9; Sound.play('babble');
    await wait(1.2);
    cam.override = null;
    await you('Oh no… you hatched already? You were supposed to be Noa’s surprise!');
    G.state.mimoName = await UI.ask('The egg hatched! What will you call your new friend?', 'Mimo');
    UI.mimoName = G.state.mimoName;
    await you('{mimo}. Hi, {mimo}. I guess we’ll go and find Noa together, then.');
    // the first word: the train Noa wrote about, puffing away down the line
    await you('{mimo} keeps staring at the train. Noa’s letter had a word for it…');
    await teachWord('w.train', { look: { x: w3d.train.x, z: WORLD.L.rails }, first: true });
  }

  // ------------------------------------------------------------ the Hush rolls in (as you enter the forest)
  async function hushWave() {
    const { sim, w3d, cam } = G, Y = sim.you, M = sim.mimo;
    lock(true);
    G.fx.birds = 0.9;
    sim.mimoGo(null, { x: Y.x, z: Y.z - 12 });
    await you('Listen, {mimo}! Birds!');
    // low beside you, looking north up the path at the treetops
    cam.override = { pos: V(Y.x + 3.2, Y.ry + 1.5, Y.z + 3.6), look: V(Y.x - 1.2, Y.ry + 5.2, Y.z - 22) };
    await wait(1.3);
    w3d.hushWave(Y.x, Y.z - 42);          // a gray wave comes rolling over the treetops from the north
    Sound.play('swoosh');
    await wait(1.7);
    // it washes over you: the color drains, and the birdsong stops
    G.fx.birds = 0;
    await tween(0.7, k => { G.fx.hush = k * 0.95; });
    M.scared = 8; Sound.play('whimper');
    await wait(1.2);
    await tween(1.6, k => { G.fx.hush = 0.95 - k * 0.55; });
    sim.mimoGo({ x: Y.x - Math.sin(Y.yaw) * 0.9, z: Y.z - Math.cos(Y.yaw) * 0.9 }, { x: Y.x, z: Y.z });   // hides behind you
    cam.override = { pos: V(Y.x - 2.8, Y.ry + 1.7, Y.z - 3.4), look: V(Y.x, Y.ry + 0.8, Y.z + 0.4) };
    await wait(0.8);
    await you('…It’s all gone quiet.');
    await mimoLine('…!');
    await you('Noa wrote that the birds stopped singing. Was it… that gray wave? What was that?');
    await you('Don’t worry, {mimo}. We’ll find Noa. Her {c.village} is just north of here.');
    cam.override = null; sim.mimoGo(null, null);
    lock(false);
    G.state.flags.hushwave = true; G.save();
    G.fx.birds = null;
    await tween(2.5, k => { G.fx.hush = 0.4 * (1 - k); });
  }

  // ------------------------------------------------------------ things in the world
  const PAGES = [
    { key: 'page.stone', word: 'w.stone', x: 6.2, z: 33.6, label: 'Read' },
    { key: 'page.mushroom', word: 'w.mushroom', x: 33.8, z: 38.2, label: 'Read' },
    { key: 'page.fox', word: 'w.fox', x: -26.2, z: 10.8, label: 'Read' },
    { key: 'page.bird', word: 'w.bird', x: 24.2, z: -12.6, label: 'Read' },
    { key: 'page.bridge', word: 'w.bridge', x: -16.8, z: 21.4, label: 'Read' },
  ];
  const nearestTo = (list, x, z) => list.reduce((b, t) => (Math.hypot(t.x - x, t.z - z) < Math.hypot(b.x - x, b.z - z) ? t : b), list[0]);
  // Spots where Mimo gets curious about a word you've seen (if the pace controller allows a new one).
  function curiosities() {
    const tree = nearestTo(WORLD.trees, 3, 49), flower = nearestTo(WORLD.flowers, -1, 44);
    return [
      { id: 'w.tree', x: tree.x, z: tree.z, r: 7 },
      { id: 'w.flower', x: flower.x, z: flower.z, r: 6 },
      { id: 'w.water', x: 2, z: streamZ(2), r: 7 },
      { id: 'w.stone', x: 2.6, z: streamZ(2.6), r: 7 },
      { id: 'w.mushroom', x: 30, z: 36, r: 8 },
      { id: 'w.fox', x: -30.5, z: 13, r: 7 },
      { id: 'w.bird', x: 26.2, z: -12.2, r: 6 },
      { id: 'w.bridge', x: -19, z: 27, r: 6 },
      { id: 'w.bread', x: 3.5, z: -157, r: 6 },          // at the bakery
    ].concat(typeof CEMETERY !== 'undefined' && CEMETERY.curiosities ? CEMETERY.curiosities() : []);     // (north of Alba: the graves, candles, crows…)
  }
  // Where to find something to point at when a word is due for review.
  function reviewSpot(id, x, z) {
    const near = (list, r) => { const n = nearestTo(list, x, z); return n && Math.hypot(n.x - x, n.z - z) < r ? n : null; };
    switch (id) {
      case 'w.tree': return near(WORLD.trees, 8);
      case 'w.flower': return near(WORLD.flowers, 8);
      case 'w.mushroom': return near(WORLD.shrooms, 8);
      case 'w.stone': return near(WORLD.rocks, 8);
      case 'w.water': return Math.abs(z - streamZ(x)) < 9 && z > 15 && z < 45 ? { x, z: streamZ(x) } : null;
      case 'w.train': return z > 46 && G.w3d.train.here ? { x: G.w3d.train.x, z: G.w3d.train.z } : null;    // (only when it's in at the platform)
      case 'w.tower': return z < -40 ? WORLD.L.tower : null;
      case 'w.house': case 'w.bread': case 'w.apple': return Math.hypot(x - WORLD.L.basket.x, z - WORLD.L.basket.z) < 10 ? WORLD.L.basket : null;
      default: return null;
    }
  }
  const pickedCount = S => (S.pickedRing || []).length + (S.picked || []).length;
  // Things you can press E on.
  function interactables() {
    const S = G.state, list = [];
    const room = G.indoorMod && G.indoorMod();
    if (room) return room.interactables();      // indoors (the Great Mill, a house, the Corn Society's hall): only its things
    // the houses' doors (interiors.js): everyone's home is open, bigger on the inside
    if (typeof INTERIORS !== 'undefined' && S.flags.hatched) {
      const Y = G.sim.you;
      if (INTERIORS.doorPrompts) list.push(...INTERIORS.doorPrompts(Y.x, Y.z));      // ('Go in' / 'Knock'; a quiet door, like Marina's, shows nothing)
      else if (INTERIORS.doors) for (const d of INTERIORS.doors(G)) if (!d.quiet && Math.abs(d.x - Y.x) < 5 && Math.abs(d.z - Y.z) < 5)
        list.push({ x: d.x, z: d.z, r: 1.8, label: d.locked ? 'Knock' : 'Go in', run: () => d.locked ? think(d.lockedText || 'Nobody answers. It’s locked.') : INTERIORS.enter(d.id) });
    }
    // the corn maze's own things outside (cornmaze.js: the scouts, the hatch, its signs)
    if (typeof CORN !== 'undefined' && CORN.interactables) list.push(...CORN.interactables());
    if (typeof CEMETERY !== 'undefined' && CEMETERY.interactables) list.push(...CEMETERY.interactables());     // (north of Alba: cemetery.js)
    // town life, the kids' games and hustlers, and the language's own character (each gives [] where it doesn't belong;
    // Adi first, so his Deliver / Ask win a tie with a townsperson's Talk)
    for (const M of [typeof ADOLF !== 'undefined' && ADOLF, typeof TOWNLIFE !== 'undefined' && TOWNLIFE, typeof MINIGAMES !== 'undefined' && MINIGAMES,
      typeof DOMINO !== 'undefined' && DOMINO, typeof PHONK !== 'undefined' && PHONK, typeof SIGNS !== 'undefined' && SIGNS,
      typeof ROMANCE !== 'undefined' && ROMANCE]) if (M && M.interactables) list.push(...M.interactables());
    PAGES.forEach(p => list.push({ x: p.x, z: p.z, r: 2.2, label: S.pages.includes(p.key) ? 'Read again' : 'Read', run: () => readPage(p) }));
    list.push({ x: 0, z: 60.9, r: 2.4, label: 'Read', run: async () => { think(`«${SIGN[UI.lang]}» … that must mean “last stop”.`); } });
    // the station: its locked little house, the line running off into the woods, and the train when it's in
    if (G.sim.you.z > 50) {
      const H = WORLD.L.stationHouse;
      list.push({ x: H.x + 0.4, z: H.z + H.d / 2 + 0.9, r: 2.2, label: 'Look', run: async () => think('The station house is locked. Through the window: an empty ticket office, and a clock stopped at eight.') });
      list.push({ x: 21, z: 64.6, r: 3.2, label: 'Look', run: async () => think('The tracks run off into the deep forest and vanish into a tunnel, back the way the train came. No way to follow them on foot.') });
      const tr = G.w3d.train;
      if (tr.here && S.flags.hatched) list.push({ x: tr.car.x, z: 65.6, r: 3.2, label: 'Board', run: async () => { G.sim.mimo.look = { x: G.sim.you.x, z: G.sim.you.z }; await you('Not without Noa.'); G.sim.mimo.look = null; } });
    }
    if (!S.flags.chest) list.push({ x: -23.2, z: 46.2, r: 2.4, label: 'Open', run: openChest });
    // (you don't know the Hush by name until Rosa tells you)
    list.push({ x: -30.5, z: 13, r: 2.6, label: 'Look', run: async () => { G.sim.mimo.scared = 3; Sound.play('whimper'); think(S.flags.rosa ? 'The fox doesn’t move at all. The Hush took its voice.' : 'The fox doesn’t move at all. It’s like something took its voice.'); } });
    list.push({ x: 26.2, z: -12.2, r: 2.4, label: 'Look', run: async () => { G.sim.mimo.scared = 2; think(S.flags.rosa ? 'A little bird, frozen mid-song. The Hush got it too.' : 'A little bird, frozen mid-song. Was it that gray wave?'); } });
    const R = G.sim.npc('rosa');
    // (who / p / region: for the Talk hooks above, talkMenu)
    if (R) list.push({ x: R.x, z: R.z, r: 3, label: 'Talk', who: 'rosa', p: R, run: S.flags.rosa ? rosaAgain : rosaScene });
    const kid = G.sim.npc('kid'); if (kid) list.push({ x: kid.x, z: kid.z, r: 2.8, label: 'Talk', who: 'kid', p: kid, region: 'alba', run: () => say('kid', 'kid.bark') });
    const baker = G.sim.npc('baker'); if (baker) list.push({ x: baker.x, z: baker.z, r: 2.8, label: 'Talk', who: 'baker', p: baker, run: bakerQuest });
    const bruno = G.sim.npc('bruno'); if (bruno && (S.flags.rosa || S.flags.escort)) list.push({ x: bruno.x, z: bruno.z, r: 3, label: reportDue('bruno') ? 'Report' : 'Talk', who: 'bruno', p: bruno, run: brunoScene });
    // the training yard's dummies: practice any time after Bruno's first lesson (battle/ has a practice mode)
    if ((S.flags.lessons || 0) >= 1 && typeof BATTLE !== 'undefined' && BATTLE.practice !== false && Math.abs(G.sim.you.x + 26.6) < 6 && Math.abs(G.sim.you.z + 159) < 6)
      list.push({ x: -26.6, z: -158.3, r: 2.6, label: 'Train', run: trainScene });
    // everyone in Alba (and Molinar, and Remanso) has something to say, even the hushed
    const town = G.town, Y0 = G.sim.you;
    const near = p => Math.abs(p.x - Y0.x) < 4 && Math.abs(p.z - Y0.z) < 4;
    const talkTo = (p, region) => p.hushed ? hushedTalk(p) : chat(p, region);
    if (town && town.people) town.people.forEach(p => { if (near(p)) list.push({ x: p.x, z: p.z, r: 2.4, label: 'Talk', who: p.id, p, region: 'alba', run: p.id === 'hugo' ? () => hugoTalk(p) : () => talkTo(p, 'alba') }); });
    // Chapter 1: the Windmill Hills and Molinar
    const mol = G.molinar;
    if (mol && Y0.x > 85) {
      // stall keepers sell (you stand at the stall's front); everyone else with a line talks
      const shops = typeof SHOP !== 'undefined' && SHOP.open, keepers = new Set(shops ? (mol.stalls || []).filter(st => !st.hushed).map(st => st.keeper) : []);
      if (mol.people) mol.people.forEach(p => { if (!p.story && p.id !== 'farmer' && p.id !== 'ciro' && !keepers.has(p.id) && near(p)) list.push({ x: p.x, z: p.z, r: 2.4, label: 'Talk', who: p.id, p, region: 'molinar', run: () => talkTo(p, 'molinar') }); });
      const F = mPerson('farmer'); if (F && S.flags.ch1) list.push({ x: F.x, z: F.z, r: 2.8, label: 'Talk', run: farmerTalk });
      const C = mPerson('ciro'); if (C) list.push({ x: C.x, z: C.z, r: 2.8, label: reportDue('ciro') ? 'Report' : 'Talk', run: S.flags.ciro ? ciroAgain : ciroScene });
      if (shops) (mol.stalls || []).forEach(st => { const K = mPerson(st.keeper); if (K && !K.hushed && !st.hushed) { const at = st.front || K; list.push({ x: at.x, z: at.z, r: 2.6, label: 'Shop', run: () => openShop(st) }); } });
      const md = mol.landmarks && (mol.landmarks.millDoor || mol.landmarks.mill); if (md) list.push({ x: md.x, z: md.z, r: 3, label: S.flags.ciro && !S.flags.millFree ? 'Go in' : 'Look', run: millDoor });
    }
    if (!S.flags.boulder && S.flags.hatched) { const B = WORLD.L.boulder; list.push({ x: B.x - 1.8, z: B.z, r: 4.2, label: `Tell ${S.mimoName}`, run: boulderScene }); }
    // Region 2: the river crossing, Remanso's people (ask them where things are), Marina, Bartolo
    const lk = G.lake;
    if (S.flags.hatched && Y0.x < -95 && Y0.x > -135 && Math.abs(Y0.z - WORLD.L.crossing.z) < 8) {
      const D = DOCKS(), d = S.flags.raftWest ? D.west : D.east;
      list.push({ x: d.x, z: d.z, r: 2.6, label: S.flags.raftUsed ? `«${exclaim(LEX.form('v.swim'))}»` : `Tell ${S.mimoName}`, run: raftScene });
    }
    if (lk && Y0.x < -95) {
      const L0 = lPerson('lalo'); if (L0 && S.flags.ch1) list.push({ x: L0.x, z: L0.z, r: 4.5, label: 'Talk', run: laloTalk });
      if (lk.people) lk.people.forEach(p => {
        if (p.story || ['lalo', 'marina', 'bartolo'].includes(p.id) || !near(p)) return;
        if (p.answers && !p.hushed) list.push({ x: p.x, z: p.z, r: 2.4, label: 'Ask', run: () => askScene(p) });
        else list.push({ x: p.x, z: p.z, r: 2.4, label: 'Talk', who: p.id, p, region: 'remanso', run: () => talkTo(p, 'remanso') });
      });
      const Mr = lPerson('marina'); if (Mr) list.push({ x: Mr.x, z: Mr.z, r: 2.8, label: 'Talk', run: S.flags.marina ? () => sayAt(Mr, S.flags.lakeFree ? 'marina.after' : S.flags.bartolo ? 'marina.ferry' : 'marina.next', 'Marina') : marinaScene });
      // Bartolo (isle.js, milestone 2): tell him where his lost things are; then the ferry, the island and the lighthouse
      const Bt = lPerson('bartolo'); if (Bt && !S.flags.ferryIsle) list.push({ x: Bt.x, z: Bt.z, r: 2.6, label: S.flags.bartoloQuest && !S.flags.bartolo ? 'Tell Bartolo' : 'Talk', run: bartoloLook });
      if (typeof ISLE !== 'undefined' && ISLE.outside) list.push(...ISLE.outside());
    }
    // the glowing mushrooms in the fairy ring, for Marta
    if (S.flags.quest === 'asked' && pickedCount(S) < 3) {
      WORLD.ring.forEach((m, i) => { if (!(S.pickedRing || []).includes(i)) list.push({ x: m.x, z: m.z, r: 2.4, label: 'Pick', run: () => pick(i) }); });
    }
    return list;
  }
  // Bruno's training yard (DESIGN.md 14.7): practice fights against his straw dummies, any time and with
  // nothing at stake (no coins, no losing). You pick what to practice; Bruno coaches.
  async function trainScene() {
    const S = G.state;
    lock(true);
    const pick = await UI.choose('Bruno: “Want to practice? What shall we work on?”', [
      { label: 'Actions', sub: 'jump, hit, throw…', value: 'verbs' },
      { label: 'Colors', sub: 'the red one, the blue one…', value: 'colors' },
      { label: 'Left, middle and right', sub: 'which one do you mean?', value: 'positions' },
      { label: 'A bit of everything', sub: 'mixed', value: 'mixed' },
    ]);
    lock(false);
    if (!pick) return;
    S.flags.trained = (S.flags.trained || 0) + 1;
    await G.fight({ practice: true, focus: pick, place: { x: WORLD.L.yard.x, z: WORLD.L.yard.z }, coach: { name: 'Bruno' } });
    G.save();
  }
  // Marta's side quest (M20): three glowing mushrooms from the fairy ring for her special bread.
  async function bakerQuest() {
    const S = G.state;
    if (S.flags.quest === 'done') return say('baker', 'baker.bark');
    if (!S.flags.quest) {
      await say('baker', 'baker.ask');
      await you('A ring of glowing {w.mushroom:pl} in the forest? I’ll find it!');
      S.flags.quest = 'asked'; S.pickedRing = S.pickedRing || [];
      return G.save();
    }
    if (pickedCount(S) < 3) return say('baker', 'baker.wait');
    await say('baker', 'baker.thanks');
    S.flags.quest = 'done';
    await teachWord('w.bread', { look: G.sim.npc('baker') });
    G.save();
  }
  async function pick(i) {
    const S = G.state, m = WORLD.ring[i];
    S.pickedRing = S.pickedRing || [];
    S.pickedRing.push(i);
    G.w3d.hideRing(i);
    Sound.play('pip'); G.w3d.fx.sparkle(m.x, WORLD.terrainAt(m.x, m.z) + 0.4, m.z, 10, ['#9ff5e8', '#fff3a0']);
    LEX.expose('w.mushroom');
    const n = Math.min(3, pickedCount(S));
    UI.toast(`${cap(UI.weavePlain('{w.mushroom}'))} ${n}/3`);
    G.save();
    if (n >= 3) await you('That’s three! Back to Marta in Alba.');
  }
  async function readPage(p) {
    const S = G.state, first = !S.pages.includes(p.key);
    Sound.play('page');
    await UI.page(p.key, p.word);
    if (!first) return;             // (pages stay pinned to their posts: read them again whenever you like)
    S.pages.push(p.key);
    UI.toast(`Noa’s notebook page (${PAGES.filter(q => S.pages.includes(q.key)).length}/5)`);
    G.save();
    curiosityCool = 1.2;      // Mimo will want this word soon, if the pace allows
    focusWord = p.word;
  }
  async function openChest() {
    const S = G.state;
    S.flags.chest = true;
    G.cast.chestOpen();
    Sound.play('chest');
    G.w3d.fx.sparkle(-23.2, WORLD.terrainAt(-23.2, 46.2) + 1, 46.2, 24);
    await wait(0.8);
    await UI.reveal('w.star');
    await UI.card('<div class="tag">A note in the chest</div><div class="note">For my friend, if you ever find my secret place. I made this star for you. —N</div><div class="sub">E</div>', { kind: 'note' });
    await teachWord('w.star', { look: { x: -23.2, z: 46.2 } });
  }

  // ------------------------------------------------------------ Alba: Rosa
  async function rosaScene() {
    const S = G.state, { sim, cam } = G, R = sim.npc('rosa');
    S.flags.rosa = true;
    await say('rosa', 'rosa.greet');
    await you('{w.hello}! I’m looking for my pen pal, Noa. She sent me this {w.letter}.');
    await say('rosa', 'rosa.letter');
    // Rosa turns to the north, and the camera follows her gaze to the old tower on the skyline
    // (from up over her shoulder, so the tower stands clear above Alba's rooftops, not behind her stall)
    const T = WORLD.L.tower, dx = T.x - R.x, dz = T.z - R.z, d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d, px = -uz, pz = ux;
    R.look = T;
    // (a slow pan up to the tower while she talks, and a slow one back: her lines stay up the whole time)
    cam.override = { pos: V(R.x - ux * 6 - px * 3.5, R.y + 5.5, R.z - uz * 6 - pz * 3.5), look: V(R.x + ux * 40, 15, R.z + uz * 40), dur: 2.6, back: 2.0 };
    await wait(0.9);
    await say('rosa', 'rosa.where');
    await say('rosa', 'rosa.hush');
    cam.override = null; R.look = null;
    await you('The old {w.tower}… Then that’s where I’m going.');
    await say('rosa', 'rosa.alone');
    introduce('w.apple');               // (she says «manzana» as she hands it over, glossed: Mimo asks for it right after)
    await say('rosa', 'rosa.apple');
    await teachWord('w.apple', { spot: { x: WORLD.L.basket.x + 0.8, z: WORLD.L.basket.z + 1.2 }, look: WORLD.L.basket });
    await say('rosa', 'rosa.praise');
    await say('rosa', 'rosa.next');
    G.save();
  }
  const rosaAgain = () => { const S = G.state; return say('rosa', S.flags.boss ? 'rosa.after' : (S.flags.lessons || 0) >= 2 ? 'rosa.field' : 'rosa.again'); };

  // ------------------------------------------------------------ the old road: Bruno finds you, trains Mimo, walks you to Alba
  async function guideScene() {
    const S = G.state, { sim, cam } = G, Y = sim.you, B = sim.npc('bruno');
    lock(true);
    B.look = Y;
    sim.mimoGo(null, { x: B.x, z: B.z });
    cam.override = { pos: V(Y.x + 2.6, Y.ry + 2.2, Y.z + 3.6), look: V((Y.x + B.x) / 2, Y.ry + 1.1, (Y.z + B.z) / 2) };
    await wait(0.6);
    if (!S.flags.guideMet) {           // (on a retry after losing, he goes straight to the lesson)
      await say('bruno', 'bruno.road1');
      await you('Hi! I’m on my way to visit my pen pal, Noa. Is her {c.village} up this road?');
      await say('bruno', 'bruno.road2');
      S.flags.guideMet = true;
    }
    // a Hushling hops out of the grass, and Bruno sees the chance for a lesson
    G.showAmbush(-1, true);
    sim.mimo.scared = 4; Sound.play('whimper');
    await wait(0.6);
    await say('bruno', 'bruno.why');
    await say('bruno', 'bruno.train');
    cam.override = null; sim.mimoGo(null, null); B.look = null;
    lock(false);
    const r = await G.fight({ tutorial: 'verbs' });
    G.showAmbush(-1, false);
    if (r.outcome !== 'win') { S.flags.z_guide = false; if (r.outcome === 'lose') await lostOnRoad(); return; }   // try again
    S.flags.lessons = 1; S.flags.guide = true; S.flags.escort = true;
    G.save();
    await say('bruno', 'bruno.follow');
  }
  // Bruno walks ahead up the road, waits for you if you fall behind; Hushlings jump out on the way.
  let escortIdx = 0, escortNag = 6, ambushCool = 0;
  function escortStep(dt) {
    ambushCool -= dt;
    const S = G.state, sim = G.sim, Y = sim.you, B = sim.npc('bruno'), P = WORLD.PATH;
    // how far along the road you are, and Bruno
    const yi = pathIndex(Y.x, Y.z), bi = pathIndex(B.x, B.z);
    escortIdx = Math.max(escortIdx, Math.min(P.length - 1, yi + 3));
    const [tx, tz] = P[escortIdx], gap = Math.hypot(B.x - Y.x, B.z - Y.z), dx = tx - B.x, dz = tz - B.z, dd = Math.hypot(dx, dz);
    const behind = bi < yi - 1;          // you ran on ahead: he hurries after you (he only waits when you're the one behind)
    B.walking = false;
    if ((gap < 9 || behind) && dd > 0.4) {
      const sp = Math.min(dd, (behind && gap > 5 ? 7.5 : 3.4) * dt); B.x += (dx / dd) * sp; B.z += (dz / dd) * sp; B.y = sim.ground(B.x, B.z);
      B.look = { x: B.x + dx, z: B.z + dz }; B.walking = true;
    } else B.look = gap > 4 ? Y : null;
    const solid = WORLD.extra.find(c => c.npc === 'bruno'); if (solid) { solid.x = B.x; solid.z = B.z; }
    if (gap > 14 && (escortNag -= dt) <= 0) { escortNag = 14; think('Bruno is waiting up the road.'); }
    // ambushes on the road
    WORLD.L.ambush.forEach((a, i) => {
      if (!S.flags['ambush' + i] && !busy && ambushCool <= 0 && Math.hypot(Y.x - a.x, Y.z - a.z) < 9) run(() => ambushScene(i));
    });
    // the gate: Bruno welcomes you to Alba (once he's caught up with you)
    if (!busy && gap < 12 && Math.hypot(Y.x - WORLD.L.gate.x, Y.z - WORLD.L.gate.z) < 7) run(welcomeScene);
  }
  function pathIndex(x, z) { const P = WORLD.PATH; let k = 0, bd = 1e9; for (let i = 0; i < P.length; i++) { const d = Math.hypot(P[i][0] - x, P[i][1] - z); if (d < bd) { bd = d; k = i; } } return k; }
  // If Bruno has fallen far behind when something happens, he catches up (a puff, and he's there).
  function bringBruno() {
    const B = G.sim.npc('bruno'), Y = G.sim.you, P = WORLD.PATH;
    if (Math.hypot(B.x - Y.x, B.z - Y.z) < 10) return;
    const [qx, qz] = P[Math.max(0, pathIndex(Y.x, Y.z) - 2)];
    G.w3d.fx.puff(B.x, B.y, B.z, 6, 0.25);
    B.x = qx + 1.2; B.z = qz; B.y = G.sim.ground(B.x, B.z);
    const solid = WORLD.extra.find(c => c.npc === 'bruno'); if (solid) { solid.x = B.x; solid.z = B.z; }
  }
  async function ambushScene(i) {
    const S = G.state, a = WORLD.L.ambush[i], B = G.sim.npc('bruno');
    S.flags['ambush' + i] = 'seen';
    bringBruno();
    G.showAmbush(i, true); Sound.play('shout');
    B.look = a;
    await say('bruno', 'bruno.ambush');
    const r = await G.fight({ foes: a.foes, place: { x: a.x, z: a.z } });
    G.showAmbush(i, false);
    if (r.outcome === 'win') { S.flags['ambush' + i] = true; G.save(); await say('bruno', 'bruno.nice'); }
    else { S.flags['ambush' + i] = false; ambushCool = 10; if (r.outcome === 'lose') await lostOnRoad(); }
  }
  async function lostOnRoad() {
    await UI.fade(1, 400);
    const B = G.sim.npc('bruno'), Y = G.sim.you;
    Y.x = B.x - 1.5; Y.z = B.z + 1.5; G.sim.mimo.x = Y.x + 1; G.sim.mimo.z = Y.z + 1; G.sim.snap();
    await UI.fade(0, 500);
    await say('bruno', 'rosa.rest');
  }
  async function welcomeScene() {
    const S = G.state, B = G.sim.npc('bruno'), Y = G.sim.you;
    S.flags.escorted = true; S.flags.escort = false;
    B.look = Y;
    await say('bruno', 'bruno.welcome');
    // Bruno heads off to his training yard by the bell tower
    const [bx, bz, by] = WORLD.L.people.brunoYard;
    G.w3d.fx.puff(B.x, B.y, B.z, 6, 0.25);
    B.x = bx; B.z = bz; B.baseYaw = by; B.look = null; B.y = G.sim.ground(bx, bz);
    const solid = WORLD.extra.find(c => c.npc === 'bruno'); if (solid) { solid.x = bx; solid.z = bz; }
    G.save();
  }

  // ------------------------------------------------------------ part 2: Bruno's yard, the field, the big one on the hill
  const fieldCenter = () => { const g = WORLD.L.fieldGroups; return { x: g.reduce((a, b) => a + b.x, 0) / g.length, z: g.reduce((a, b) => a + b.z, 0) / g.length }; };
  // After the field (DESIGN.md 16: every main task ends by reporting back): Bruno walks out to Alba's east gate to watch, and
  // waits there. Talk to him: he says what's next, and the camera follows his look to the big one on the hill.
  const brunoPost = () => ({ x: WORLD.L.eastGate.x + 3.6, z: WORLD.L.eastGate.z + 1.8 });
  const reportDue = who => typeof QUESTS !== 'undefined' && QUESTS.reportDue && !!QUESTS.reportDue(who);
  // (force: right after the field's last fight, behind the fade. Otherwise not while he's in front of you, or he'd pop; and
  // once nothing's due (you went straight to the hill), he goes home to his yard.)
  function brunoToPost(force) {
    const B = G.sim.npc('bruno'), P = brunoPost(), Y = G.sim.you; if (!B || (busy && !force)) return;
    const atPost = Math.hypot(B.x - P.x, B.z - P.z) < 1.5, due = reportDue('bruno');
    if (!!due === atPost) return;
    const [hx, hz, hy] = WORLD.L.people.brunoYard, to = due ? { x: P.x, z: P.z, yaw: Math.PI / 2 } : { x: hx, z: hz, yaw: hy };
    if (!force && Math.hypot(Y.x - B.x, Y.z - B.z) < 14) return;
    B.x = to.x; B.z = to.z; B.y = G.sim.ground(to.x, to.z); B.baseYaw = B.yaw = to.yaw; B.look = null;
    G.w3d.fx.puff(B.x, B.y, B.z, 6, 0.25);
    const solid = WORLD.extra.find(c => c.npc === 'bruno'); if (solid) { solid.x = B.x; solid.z = B.z; }
  }
  async function reportField() {
    const S = G.state, { sim, cam } = G, B = sim.npc('bruno'), Y = sim.you, H = WORLD.L.boss;
    lock(true);
    B.look = Y;
    cam.override = { pos: V(B.x + (Y.x - B.x) * 0.5 + 2.8, B.y + 2.3, B.z + (Y.z - B.z) * 0.5 + 3.4), look: V((B.x + Y.x) / 2, B.y + 1.2, (B.z + Y.z) / 2), dur: 0.8 };
    await say('bruno', 'bruno.report');
    await you('They’re gone! Every last one. What now, Bruno?');
    // his look, and the camera, go up to the gray hill: the big one, right on the road north
    B.look = H;
    const hy = WORLD.terrainAt(H.x, H.z);
    cam.override = { pos: V(B.x + 4, B.y + 6.5, B.z + 6), look: V(H.x, hy + 2.2, H.z), dur: 1.6 };
    await wait(1.0);
    await say('bruno', 'bruno.report2');
    cam.override = null; B.look = null;
    await you('The big one on the {c.hill}. Let’s go, {mimo}!');
    S.flags.rep_field = true;
    // back to his yard (he'll catch up with you on the hill)
    const [bx, bz, by] = WORLD.L.people.brunoYard;
    G.w3d.fx.puff(B.x, B.y, B.z, 6, 0.25);
    B.x = bx; B.z = bz; B.baseYaw = by; B.y = sim.ground(bx, bz);
    const solid = WORLD.extra.find(c => c.npc === 'bruno'); if (solid) { solid.x = bx; solid.z = bz; }
    lock(false); G.save();
  }
  async function brunoScene() {
    const S = G.state, { sim, cam } = G, B = sim.npc('bruno');
    if (reportDue('bruno')) return reportField();
    if (S.flags.boss) return say('bruno', 'bruno.done');
    if ((S.flags.lessons || 0) >= 2) return say('bruno', 'bruno.after');
    if (S.flags.escort) return say('bruno', 'bruno.wait');
    if (!S.flags.lessons) {          // (saves from before the road: he teaches the basics here)
      await say('bruno', 'bruno.hi');
      await you('Rosa said you could teach us to fight. We need to get to the old {w.tower}.');
      await say('bruno', 'bruno.why');
      await say('bruno', 'bruno.train');
      const r = await G.fight({ tutorial: 'verbs' });
      if (r.outcome !== 'win') return lost(r);
      S.flags.lessons = 1; G.save();
    }
    await say('bruno', S.flags.guide ? 'bruno.yard' : 'bruno.again');
    const r2 = await G.fight({ tutorial: 'targets' });
    if (r2.outcome !== 'win') return lost(r2);
    S.flags.lessons = 2; G.save();
    // Bruno points east: the field, then the big one on the hill, right on the road north
    // high crane shots over the rooftops, so nothing blocks the view
    const F = fieldCenter(), H = WORLD.L.boss;
    B.look = F;
    cam.override = { pos: V(B.x + 12, B.y + 9, B.z - 1), look: V(F.x, WORLD.terrainAt(F.x, F.z) + 0.5, F.z), dur: 1.8 };
    await wait(1.0);
    await say('bruno', 'bruno.fields');
    await say('bruno', 'bruno.quest');          // why it matters: the field is going gray
    B.look = H;
    cam.override = { pos: V(F.x - 12, WORLD.terrainAt(F.x, F.z) + 10, F.z + 4), look: V(H.x, WORLD.terrainAt(H.x, H.z) + 2, H.z), dur: 1.6 };
    await wait(1.0);
    await say('bruno', 'bruno.road');
    cam.override = null; B.look = null;
    await say('bruno', 'bruno.how');            // and what to do: walk up to them, fight with words
    await you('Got it: chase the Hushlings out of the field, then get past the big one on the hill. Then on to the {w.tower}, and Noa. Let’s go, {mimo}!');
    G.save();
  }
  async function lost(r) {
    if (r.outcome !== 'lose') return;
    await UI.fade(1, 400);
    G.respawn();
    await UI.fade(0, 500);
    await say('rosa', 'rosa.rest');
  }
  // the field's count (Bruno's task): the three groups he sent you after; the third one done, you know where to go next
  async function fieldCleared() {
    const S = G.state, n = (S.cleared || []).length;
    G.save();
    if (n < 3) { UI.toast(`Hushlings chased out of the field: ${n}/3`); return; }
    brunoToPost(true);
    await you('The field’s quiet now… in a good way. Bruno will want to hear about this: he said he’d watch from the east gate.');
  }
  async function fieldBattle(gi) {
    const S = G.state, grp = WORLD.L.fieldGroups[gi];
    const r = await G.fight({ foes: grp.foes, place: { x: grp.x, z: grp.z } });
    if (r.outcome === 'win') {
      S.cleared = S.cleared || []; if (!S.cleared.includes(gi)) S.cleared.push(gi);
      await fieldCleared();
    } else await lost(r);
  }
  // Hushlings roaming the forest, the road and the field: practice fights. They come back after a while.
  // (DESIGN.md 16, the bug: "I killed a ton of hushlings but my quest wasn't updating". Four roaming groups live in the field
  // too, and they look just like Bruno's three, but only those three counted. Now a group you beat in the field counts while
  // the task is on: the nearest of Bruno's groups still standing scatters with it.)
  const inField = grp => grp.area === 'field' || (Math.abs(grp.x - 58) < 30 && Math.abs(grp.z + 160) < 45);
  async function roamerBattle(ri) {
    const S = G.state, grp = WORLD.L.roamers[ri];
    const ally = typeof grp.ally === 'function' ? grp.ally() : null;     // (the Gray Marsh: Bruno fights at your side, marsh_battle.js)
    const r = await G.fight({ foes: grp.foes, place: { x: grp.x, z: grp.z, biome: grp.biome }, coach: ally ? Object.assign({ ally: true }, ally) : undefined });     // (biome: the frogs fight on the lake's lily pads)
    if (r.outcome === 'win') {
      G.roamerBeaten(ri);
      S.cleared = S.cleared || [];
      if ((S.flags.lessons || 0) >= 2 && !S.flags.boss && S.cleared.length < 3 && inField(grp)) {
        const left = WORLD.L.fieldGroups.map((g, i) => ({ g, i })).filter(o => !S.cleared.includes(o.i))
          .sort((a, b) => Math.hypot(a.g.x - grp.x, a.g.z - grp.z) - Math.hypot(b.g.x - grp.x, b.g.z - grp.z));
        if (left.length) { const o = left[0]; S.cleared.push(o.i); G.w3d.fx.puff(o.g.x, WORLD.terrainAt(o.g.x, o.g.z) + 0.3, o.g.z, 12, 0.35, '#c8c6d8'); }
        await fieldCleared();
        return;
      }
      UI.toast(grp.foes.every(f => f.shadow) ? 'The shadows melt away!' : grp.foes.every(f => f.kind === 'frog') ? 'The frogs hop away!' : 'Hushlings chased off!'); G.save();
    }
    else if (r.outcome === 'lose') { if (S.flags.escorted || S.flags.rosa) await lost(r); else await lostOnRoad(); }
  }
  async function bossScene() {
    const S = G.state, { sim, cam } = G, Y = sim.you, B = sim.npc('bruno');
    const home = { x: B.x, z: B.z };
    lock(true);
    await you('That’s… a really big one.');
    B.x = Y.x - 1.4; B.z = Y.z + 1.6; B.y = sim.ground(B.x, B.z);
    G.w3d.fx.puff(B.x, B.y, B.z, 8, 0.3);
    await say('bruno', 'bruno.hill');
    lock(false);
    const r = await G.fight({ tutorial: 'parts', foes: [{ kind: 'hushling_big', color: 'red' }], place: { x: WORLD.L.boss.x, z: WORLD.L.boss.z } });
    if (r.outcome !== 'win') { B.x = home.x; B.z = home.z; sim.snap(); return lost(r); }
    S.flags.boss = true; G.save();
    lock(true);
    G.w3d.liftHush(WORLD.L.hush.findIndex(h => h.boss));
    Sound.play('learned');
    await wait(1.2);
    await you('The gray is draining away… the color’s coming back!');
    await say('bruno', 'bruno.done');
    B.x = home.x; B.z = home.z; sim.snap();
    await you('Something fluttered down where it was sitting. Another page from Noa’s notebook!');
    Sound.play('page');
    await UI.page('page.tower', 'w.tower');
    if (!S.pages.includes('page.tower')) S.pages.push('page.tower');
    const T = WORLD.L.tower;
    await teachWord('w.tower', { look: T });
    // the way north: the camera follows the road to the old tower
    // you walk up to the top of the hill, where the big one sat, and look north: over your shoulder, the tower
    const top = WORLD.L.boss;
    Y.x = top.x; Y.z = top.z; sim.mimo.x = top.x + 1; sim.mimo.z = top.z + 0.6; sim.snap();
    const dx = T.x - Y.x, dz = T.z - Y.z, d = Math.hypot(dx, dz), ux = dx / d, uz = dz / d;
    Y.yaw = Math.atan2(ux, uz);
    cam.override = { pos: V(Y.x - ux * 3.4 - uz * 1.4, Y.ry + 2.3, Y.z - uz * 3.4 + ux * 1.4), look: V(Y.x + ux * 40, Y.ry + 7, Y.z + uz * 40) };
    await wait(1.2);
    await you('There it is: the old {w.tower}. Hold on, Noa. We’re coming.');
    cam.override = null;
    G.save();
    if (G.cutaway) { await G.cutaway('end', ['Far to the north, someone noticed.', 'A little color had come back to the world.', 'High in the old tower, a stopped clock gave a single tick.']); await UI.fade(0, 700); }
    // Bruno catches up with you on the hilltop: the tower's door is shut, but the clockmaker in Molinar knows why (Chapter 1)
    B.x = Y.x - 1.6; B.z = Y.z + 1.8; B.y = sim.ground(B.x, B.z); B.look = Y; G.w3d.fx.puff(B.x, B.y, B.z, 8, 0.3);
    await say('bruno', 'bruno.shut');
    await you('Then we go to Molinar first. Thanks, Bruno!');
    await say('bruno', 'bruno.east');
    B.look = null; B.x = home.x; B.z = home.z; B.y = sim.ground(home.x, home.z); sim.snap();
    lock(false);
    S.flags.ch1 = true; G.save();
  }

  // ------------------------------------------------------------ Chapter 1, region 1: the road east, the hills, Molinar (DESIGN.md 14.2)
  // Every verb the "tell Mimo" box listens for (battle verbs come from battle/lang.js; push from there too, or below)
  const VERBS = ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim'];
  function ensureVerbs() {
    // the battle's words (verbs, colors…) are normally registered when the first fight starts; the
    // overworld needs its verbs before that (after loading a save, say)
    const BI = typeof BATTLE !== 'undefined' && BATTLE._ && BATTLE._.ITEMS;
    if (BI && !BATTLE._.registered) { LEX.register(BI); BATTLE._.registered = true; }
    if (!LEX.item('v.push')) LEX.register([{ id: 'v.push', kind: 'verb', es: 'empuja', pt: 'empurra', de: 'schieb', en: 'push', icon: 'push' }]);
    // swim (region 2): «nada» is also what Lalo *is doing* (es/pt); German accepts schwimmt / schwimmen too
    if (!LEX.item('v.swim')) LEX.register([{ id: 'v.swim', kind: 'verb', es: 'nada', pt: 'nada', de: 'schwimm', en: 'swim', icon: 'swim', alt: { pt: ['nade'], de: ['schwimme', 'schwimmt', 'schwimmen'] } }]);
    const P = LEX.item('v.push');
    P.icon = P.icon && ICONS.keys.includes(P.icon) ? P.icon : 'push';
    P.alt = P.alt || {};       // the farmer *is* pushing: «empuja» / «empurra» say both; in German accept «schiebt» and «schieben» too
    P.alt.de = Array.from(new Set([...(P.alt.de || []), 'schiebe', 'schiebt', 'schieben']));
    [['v.jump', 'jump'], ['v.hit', 'hit'], ['v.throw', 'throw'], ['v.eat', 'eat']].forEach(([id, ic]) => { const it = LEX.item(id); if (it && !(it.icon && ICONS.keys.includes(it.icon) && it.icon !== 'star')) it.icon = ic; });
  }
  // Molinar's people (molinar.js), and a lines.js line said by one of them: their bubble sits over them
  const mPerson = id => G.molinar && G.molinar.people ? G.molinar.people.find(p => p.id === id) || null : null;
  function sayAt(p, key, name) {
    if (!p) return Promise.resolve();
    const L = UI.lineFor(key, LEX.tier()), R = UI.lineFor(key, 9);          // (the mix, as say(): DESIGN.md 16)
    const o = mixLine(L.text, L.en || L.weave, { key, mixT: R.text || L.text, mixEn: L.weave });
    p.talking = true;
    return show(Object.assign(o, { who: 'town', name: name || p.name || '', at: p, done: () => { p.talking = false; } }));
  }
  // Marga, pushing her cart in the hills: Mimo learns its first verb by watching (DESIGN.md 13.1)
  // (DESIGN.md 16: first you hear it. She pushes, and says it, in the language with the English under it; then Mimo asks.)
  function shotOf(p, k = 0.35) {
    const Y = G.sim.you, py = p.y !== undefined ? p.y : WORLD.terrainAt(p.x, p.z), dx = p.x - Y.x, dz = p.z - Y.z, d = Math.hypot(dx, dz) || 1;
    return { pos: V(Y.x + dx * k - dz / d * 3.2, py + 2.4, Y.z + dz * k + dx / d * 3.2), look: V(p.x, py + 1.0, p.z), dur: 0.8 };
  }
  async function farmerScene() {
    const S = G.state, F = mPerson('farmer'); if (!F) return;
    S.flags.farmerSeen = true;
    const watch = G.molinar.landmarks && G.molinar.landmarks.farmerWatch;      // a spot by the road with a good view of her
    lock(true);
    G.cam.override = shotOf(F);
    await demoAt(F, 'farmer.demo', 'Marga');
    await youWord('«', wordPart('v.push'), '»… Marga says it every time she pushes her cart!');
    G.cam.override = null; lock(false);
    const r = await teachWord('v.push', { spot: watch || undefined, look: { x: F.x, z: F.z }, title: `${S.mimoName} is watching the farmer. What is she doing?` });
    if (r && r.ok) { await sayAt(F, 'farmer.push', 'Marga'); if (!S.flags.boulder) await sayAt(F, 'farmer.rock', 'Marga'); }
    G.save();
  }
  async function farmerTalk() {
    const S = G.state, F = mPerson('farmer');
    if (!LEX.taught('v.push')) return farmerScene();
    return sayAt(F, S.flags.boulder ? 'farmer.thanks' : 'farmer.rock', 'Marga');
  }
  // The boulder in the pass: tell Mimo what to do (verbs are the keys)
  async function boulderScene() {
    const S = G.state, B = WORLD.L.boulder, name = S.mimoName, M = G.sim.mimo;
    const r = await UI.command({ name, icon: 'stone', title: `A huge rock blocks the pass. What should ${name} do?`, verbs: VERBS,
      hint: LEX.taught('v.push') ? '' : 'Type a sentence in the language, like a command.' });
    if (!r || r.cancelled) return;
    if (r.verb === 'v.push') {
      const first = !LEX.taught('v.push');
      LEX.attempt('v.push', { ok: true, hints: 0, ms: r.ms, mode: 'command' });     // (you knew the word already? then Mimo learns it right here)
      if (first) { G.sim.emit('learned', { id: 'v.push' }); UI.toast(`${name} learned «${LEX.form('v.push')}»!`); }
      G.sim.mimoSay(exclaim(LEX.form('v.push')), 1.6);
      lock(true);
      const gy = WORLD.terrainAt(B.x, B.z);
      G.cam.override = { pos: V(B.x - 10, gy + 3.6, B.z - 2.2), look: V(B.x + 4, gy + 0.8, B.z + 1.8) };     // down the road, through the gap
      await G.pushBoulder();
      S.flags.boulder = true; G.save();
      await wait(0.5);
      G.cam.override = null; lock(false);
      await you('It rolled right out of the way! The road to Molinar is open.');
      return;
    }
    if (r.verb) {       // another verb: Mimo does that instead, and the rock doesn't care
      G.sim.mimoSay(exclaim(LEX.form(r.verb)), 1.4);
      if (LEX.taught(r.verb)) LEX.attempt(r.verb, { ok: true, hints: 0, ms: r.ms, mode: 'command' });
      if (r.verb === 'v.jump') { M.hop = { t: 0 }; think('{mimo} hops up and down in front of the rock. It doesn’t move.'); }
      else if (r.verb === 'v.hit') { Sound.play('hit'); M.sad = 1.2; think('{mimo} bonks the rock. Ouch! It doesn’t budge.'); }
      else if (r.verb === 'v.throw') think('{mimo} throws a pebble at the rock. Plink. Nothing.');
      else think('{mimo} tries, but the rock doesn’t care.');
      return;
    }
    G.sim.mimoSay('…?', 1.4); M.tiltT = 1.4;
    think(LEX.taught('v.push') ? '{mimo} tilts its head. Which word did it learn from the farmer?' : '{mimo} doesn’t know a word for this yet. The farmer back in the hills pushes her cart all day…');
  }
  async function arriveMolinar() {
    const S = G.state;
    S.flags.molinar = true; G.save();
    await UI.chapter('Molinar', 'The town of mills');
    if (!S.flags.ciro) await you('What a market! The clockmaker must be around here somewhere.');
  }
  async function ciroScene() {
    const S = G.state, C = mPerson('ciro'); if (!C) return;
    lock(true);
    await sayAt(C, 'ciro.hello', 'Ciro');
    await you('{w.hello}! I’m looking for my pen pal, Noa. And the door of the old {w.tower} is shut.');
    await sayAt(C, 'ciro.noa', 'Ciro');
    await sayAt(C, 'ciro.bells', 'Ciro');
    await you('Eight bells… So we have to make them all ring again?');
    await sayAt(C, 'ciro.mill', 'Ciro');
    S.flags.ciro = true; lock(false); G.save();
  }
  const ciroAgain = async () => {
    const S = G.state, C = mPerson('ciro');
    if (!S.flags.millFree) return sayAt(C, 'ciro.again', 'Ciro');
    if (!S.flags.ciroBell) return reportMill();
    return sayAt(C, 'ciro.next', 'Ciro');
  };
  // Report back to Ciro after the Great Mill (DESIGN.md 16): the first bell, and where the next one is (west, at the lake)
  async function reportMill() {
    const S = G.state, C = mPerson('ciro'), { cam } = G, Y = G.sim.you; if (!C) return;
    lock(true);
    const cy = C.y !== undefined ? C.y : WORLD.terrainAt(C.x, C.z);
    // (P7b, playtest 7: his clock shop stands right behind him and filled both shots. The two-shot is now from your side, on the
    // square's side of the pair; the look west is a crane shot up over the roofs. Raycast-checked from 45 spots around him.)
    const sq = (G.molinar && G.molinar.landmarks && G.molinar.landmarks.square) || { x: C.x + 1, z: C.z - 1.7 };
    const fl = Math.hypot(sq.x - C.x, sq.z - C.z) || 1, fx = (sq.x - C.x) / fl, fz = (sq.z - C.z) / fl;      // (toward the square: away from his shop)
    const ul = Math.hypot(Y.x - C.x, Y.z - C.z), ux = ul > 0.2 ? (Y.x - C.x) / ul : fx, uz = ul > 0.2 ? (Y.z - C.z) / ul : fz;
    const sd = -uz * fx + ux * fz < 0 ? -1 : 1, mx = (C.x + Y.x) / 2, mz = (C.z + Y.z) / 2;
    cam.override = { pos: V(mx + ux * 1.4 - uz * sd * 3.6 + fx * 0.8, cy + 2.4, mz + uz * 1.4 + ux * sd * 3.6 + fz * 0.8), look: V(mx, cy + 1.2, mz), dur: 0.8 };
    await you('Ciro! Did you hear it? The bell at the top of the Great Mill!');
    await sayAt(C, 'ciro.firstbell', 'Ciro');
    S.flags.ciroBell = true; G.save();
    // the camera rises over the roofs and looks west, past Alba: the way to the Mirror Lake
    cam.override = { pos: V(C.x + 6, cy + 18, C.z - 2), look: V(C.x - 120, cy + 2, C.z - 8), dur: 1.8 };
    await wait(1.2);
    await sayAt(C, 'ciro.next', 'Ciro');
    cam.override = null;
    await you('The Mirror Lake, west of Alba. Let’s go, {mimo}!');
    lock(false); G.save();
  }
  // The market: you buy by asking, in whole sentences (shop.js)
  async function openShop(stall) {
    const S = G.state, K = mPerson(stall.keeper);
    if (typeof SHOP === 'undefined' || !SHOP.open) { think('This stall isn’t open yet.'); return; }
    if (K) K.talking = true;
    S.teaching = true;           // the world waits, like for the teach box
    try {
      const r = await SHOP.open({ lang: S.lang, stall: { id: stall.id, keeper: { id: stall.keeper, name: K ? K.name : '' } }, coins: S.coins || 0, bag: Object.assign({}, S.bag || {}), mimoName: S.mimoName,
        asked: S.shopAsked || [] });          // (the prices you've already asked about)
      if (r) { S.coins = r.coins; S.bag = r.bag || S.bag; if (r.asked) S.shopAsked = r.asked; if ((r.bought || []).some(b => b.id === 'w.hat')) S.flags.hat = true; }
    } catch (e) { console.error('[shop]', e); }
    S.teaching = false; if (K) K.talking = false;
    G.save();
  }
  // ------------------------------------------------------------ Chapter 1, region 2: the Reed River, Remanso, the Mirror Lake (DESIGN.md 14.5)
  const lPerson = id => G.lake && G.lake.people ? G.lake.people.find(p => p.id === id) || null : null;
  // the river docks and the raft's two resting spots (lake.js), or world.js's rough ones without it
  const DOCKS = () => {
    const K = typeof LAKE !== 'undefined' && LAKE.landmarks, C = WORLD.L.crossing;
    return K && K.riverDockEast ? { east: K.riverDockEast, west: K.riverDockWest, raftEast: K.raftHome, raftWest: K.raftAway }
      : { east: C.east, west: C.west, raftEast: { x: -115.8, z: -150 }, raftWest: { x: -120.2, z: -150 } };
  };
  // Lalo, swimming by the broken bridge: Mimo learns «nada» by watching
  async function laloScene() {
    const S = G.state, P = lPerson('lalo'); if (!P) return;
    S.flags.laloSeen = true;
    const E = DOCKS().east;
    // first you hear it: he swims and calls to Mimo (in the language, the English under it); then Mimo asks for the word
    lock(true);
    G.cam.override = shotOf(P, 0.45);
    await demoAt(P, 'lalo.demo', 'Lalo');
    await youWord('«', wordPart('v.swim'), '»… Lalo wants {mimo} to come and swim with him!');
    G.cam.override = null; lock(false);
    const r = await teachWord('v.swim', { spot: { x: E.x + 0.6, z: E.z - 3.2 }, look: { x: P.x, z: P.z }, title: `${S.mimoName} is watching the kid in the river. What is he doing?` });
    if (r && r.ok) { await sayAt(P, 'lalo.swim', 'Lalo'); if (!S.flags.raftUsed) await sayAt(P, 'lalo.raft', 'Lalo'); await sayAt(P, 'lalo.marina', 'Lalo'); }
    G.save();
  }
  async function laloTalk() {
    const S = G.state, P = lPerson('lalo');
    if (!LEX.taught('v.swim')) return laloScene();
    return sayAt(P, S.flags.raftUsed ? 'lalo.marina' : 'lalo.raft', 'Lalo');
  }
  // The raft over the Reed River: tell Mimo «¡Nada!» and it swims across, pulling you with a rope
  async function raftScene() {
    const S = G.state, name = S.mimoName, M = G.sim.mimo;
    if (!S.flags.raftUsed) {
      const r = await UI.command({ name, icon: 'swim', title: `The bridge is broken, but a raft is tied to the dock. What should ${name} do?`, verbs: VERBS, answer: 'v.swim' });
      if (!r || r.cancelled) return;
      if (r.verb !== 'v.swim') {
        if (r.verb) { G.sim.mimoSay(exclaim(LEX.form(r.verb)), 1.4); if (LEX.taught(r.verb)) LEX.attempt(r.verb, { ok: true, hints: 0, ms: r.ms, mode: 'command' }); }
        if (r.verb === 'v.jump') { M.hop = { t: 0 }; think('{mimo} hops onto the raft and back. It’s still tied up.'); }
        else if (r.verb === 'v.push') think('{mimo} pushes the raft. It bobs on its rope… but nobody’s pulling it across.');
        else if (r.verb) think('{mimo} tries, but the raft just bobs there.');
        else { G.sim.mimoSay('…?', 1.4); M.tiltT = 1.4; think(LEX.taught('v.swim') ? '{mimo} tilts its head. Which word did Lalo teach it?' : '{mimo} looks at the water… and at Lalo, splashing about.'); }
        return;
      }
      const first = !LEX.taught('v.swim');
      LEX.attempt('v.swim', { ok: true, hints: 0, ms: r.ms, mode: 'command' });
      if (first) { G.sim.emit('learned', { id: 'v.swim' }); UI.toast(`${name} learned «${LEX.form('v.swim')}»!`); }
    } else LEX.attempt('v.swim', { ok: true, hints: 0, ms: 3000, mode: 'command' });
    G.sim.mimoSay(exclaim(LEX.form('v.swim')), 1.4);
    await rideRaft();
  }
  let rope = null;
  async function rideRaft() {
    const S = G.state, raft = G.lake && G.lake.objects && G.lake.objects.raft; if (!raft) return;
    const D = DOCKS(), west = !!S.flags.raftWest, A = west ? D.raftWest : D.raftEast, B = west ? D.raftEast : D.raftWest, to = west ? D.east : D.west;
    const dir = Math.sign(B.x - A.x), Y = G.sim.you, M = G.sim.mimo, root = G.cast.mimo.root, wy = WORLD.L.water;
    if (!rope) { rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1, 6), TK.toon('#d8c08a', { rim: 0 })); G.w3d.scene.add(rope); }
    // (lake.js keeps the raft's deck platform under the raft as it moves)
    const setAt = x => { raft.position.x = x; raft.position.z = A.z; };
    lock(true);
    setAt(A.x); Y.x = A.x; Y.z = A.z; Y.yaw = dir < 0 ? -Math.PI / 2 : Math.PI / 2; G.sim.snap();
    G.cam.override = { pos: V(A.x - dir * 3, wy + 4.2, A.z + 8), look: V((A.x + B.x) / 2, wy + 0.6, A.z) };
    // Mimo hops into the water ahead of the raft and swims, pulling the rope
    M.hidden = true; rope.visible = true; Sound.play('jump');
    const v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0); let splash = 0;
    await tween(3.4, k => {
      const e = k * k * (3 - 2 * k), x = lerp(A.x, B.x, e);
      setAt(x); Y.x = x; Y.z = A.z;
      const mx = x + dir * 2.1, my = wy - 0.12 + Math.sin(k * 26) * 0.05;
      root.position.set(mx, my, A.z); root.rotation.set(0, dir < 0 ? -Math.PI / 2 : Math.PI / 2, 0); root.rotateX(0.35);
      const a = new THREE.Vector3(x + dir * 1.2, wy + 0.35, A.z), b = new THREE.Vector3(mx - dir * 0.2, my + 0.25, A.z);
      rope.position.copy(a).add(b).multiplyScalar(0.5); rope.scale.set(1, a.distanceTo(b), 1); rope.quaternion.setFromUnitVectors(up, v.copy(b).sub(a).normalize());
      if ((splash -= 1 / 60) <= 0) { splash = 0.22; G.w3d.fx.puff(mx, wy + 0.05, A.z, 3, 0.16, '#e9f6ff'); }
    });
    rope.visible = false;
    // everyone onto the far dock
    Y.x = to.x; Y.z = to.z; G.sim.snap();
    M.hidden = false; M.x = to.x + dir * 1.1; M.z = to.z + 0.9; M.y = M.ry = G.sim.ground(M.x, M.z); M.happy = 1.2; Sound.play('land', 5);
    root.rotation.set(0, 0, 0);
    S.flags.raftWest = !west; S.flags.raftUsed = true;
    G.cam.override = null; lock(false); G.save();
  }
  // Asking where something is (DESIGN.md 14.5): «¿Dónde está…?» / «Onde está…?» / «Wo ist…?»
  // (milestone 2: Bartolo's lost things come first, so «¿Dónde está el remo de Bartolo?» asks about the oar, not Bartolo; zh / ja
  // compare CJK.canon's romanisation, as parts of the whole question)
  const ASK = {
    q: { es: /\bdonde\b/, pt: /\b(onde|cade)\b/, de: /\bwo\b/, zh: /nali|naer|nar|shenmedifang/, ja: /doko/ },
    v: { es: /\besta\b/, pt: /\b(esta|fica)\b/, de: /\bist\b/, zh: /zai/, ja: /desu|arimasu|imasu|aru|iru/ },
    targets: {
      oar: { es: ['remo'], pt: ['remo'], de: ['ruder', 'paddel'], zh: ['chuanjiang', 'jiang'], ja: ['ooru', 'oru', 'kai'] },
      lantern: { es: ['farol', 'linterna'], pt: ['lanterna', 'lampiao'], de: ['laterne', 'lampe'], zh: ['madeng', 'deng'], ja: ['rantan'] },
      rope: { es: ['cuerda', 'soga', 'mecate'], pt: ['corda'], de: ['seil', 'tau'], zh: ['shengzi', 'sheng'], ja: ['roopu', 'ropu', 'tsuna'] },
      marina: { es: ['marina'], pt: ['marina'], de: ['marina'], zh: ['malina'], ja: ['mariina', 'marina'] },
      bartolo: { es: ['bartolo', 'barquero'], pt: ['bartolo', 'barqueiro'], de: ['bartolo', 'fahrmann'], zh: ['batuoluo', 'baiduren'], ja: ['barutoro', 'sendou', 'sendo'] },
      ferry: { es: ['ferri', 'balsa', 'barco', 'barca'], pt: ['balsa', 'barco', 'barca'], de: ['fahre', 'boot', 'schiff'], zh: ['duchuan'], ja: ['ferii', 'feri'] },
      island: { es: ['isla'], pt: ['ilha'], de: ['insel'], zh: ['dao'], ja: ['shima'] }, bell: { es: ['campana'], pt: ['sino'], de: ['glocke'], zh: ['zhong'], ja: ['kane'] } },
    name: { marina: { es: 'Marina', pt: 'a Marina', de: 'Marina', zh: '玛丽娜', ja: 'マリーナ', en: 'Marina' }, bartolo: { es: 'Bartolo', pt: 'o Bartolo', de: 'Bartolo', zh: '巴托洛', ja: 'バルトロ', en: 'Bartolo' },
      ferry: { es: 'el barco', pt: 'o barco', de: 'das Boot', zh: '渡船', ja: 'フェリー', en: 'the boat' }, island: { es: 'la isla', pt: 'a ilha', de: 'die Insel', zh: '岛', ja: '島', en: 'the island' },
      bell: { es: 'la campana', pt: 'o sino', de: 'die Glocke', zh: '钟', ja: '鐘', en: 'the bell' }, oar: { es: 'el remo', pt: 'o remo', de: 'das Ruder', zh: '船桨', ja: 'オール', en: 'the oar' },
      lantern: { es: 'el farol', pt: 'a lanterna', de: 'die Laterne', zh: '马灯', ja: 'ランタン', en: 'the lantern' }, rope: { es: 'la cuerda', pt: 'a corda', de: 'das Seil', zh: '绳子', ja: 'ロープ', en: 'the rope' } },
    model: { es: t => `¿Dónde está ${t}?`, pt: t => `Onde está ${t}?`, de: t => `Wo ist ${t}?`, zh: t => `${t}在哪里？`, ja: t => `${t}はどこですか？` },
  };
  const cjkLang = lang => lang === 'zh' || lang === 'ja';
  function parseAsk(text, lang) {
    const L = ASK.q[lang] ? lang : 'es', cj = cjkLang(L) && typeof CJK !== 'undefined' && CJK.canon;
    const n = cj ? CJK.canon(text, L) : norm(text).replace(/[^a-z0-9\s]/g, ' ');
    let target = null; for (const [k, ws] of Object.entries(ASK.targets)) if ((ws[L] || []).some(w => (cj ? n.includes(w) : new RegExp('\\b' + w).test(n)))) { target = k; break; }
    return { target, q: ASK.q[L].test(n), v: ASK.v[L].test(n) };
  }
  async function askScene(p) {
    const S = G.state, f = S.flags, lang = ASK.model[S.lang] ? S.lang : 'es', told = (S.lakeQ && S.lakeQ.told) || {};
    // the question to suggest: Marina, then Bartolo's things you haven't found or asked about yet, then the island
    const want = !f.marina ? 'marina' : f.bartoloQuest && !f.bartolo ? (['oar', 'lantern', 'rope'].find(id => !told[id] && !f['asked_' + id]) || 'island') : 'island';
    const model = ASK.model[lang](ASK.name[want][lang]);
    p.talking = true;
    // (DESIGN.md 16: the frame you heard on the way in, «¿Dónde está ___?», on the box, so asking is building on it, not guessing)
    const r = await UI.command({ name: S.mimoName, icon: 'wave', title: `What do you want to ask ${p.name}?`, verbs: [], placeholder: 'ask a question…', hint: `Ask where something or someone is: «${phraseOf(WHERE_FRAME)}» (? shows an example)`, model, modelEn: `Where is ${ASK.name[want].en}?` });
    p.talking = false;
    if (!r || r.cancelled) { if (p.lines) await sayInline(p); return; }
    const a = parseAsk(r.text, lang), ans = a.target && p.answers && p.answers[a.target];
    if (!ans || !a.q) { await sayAt(p, 'ask.huh', p.name); return; }
    const good = ASK.model[lang](ASK.name[a.target][lang]);
    if (!a.v) UI.toast(`Close! Better: «${good}»`); else Sound.play('review');
    p.talking = true;
    // (the answer, mixed like every line: DESIGN.md 16. A line nobody wrote in zh / ja yet: its English)
    await show(Object.assign(mixLine(ans[S.lang] || '', ans.en, { key: 'ask.' + (p.id || p.name) + '.' + a.target }), { who: 'town', name: p.name, at: p, done: () => { p.talking = false; } }));
    S.flags['asked_' + a.target] = true;
    if (a.target === 'marina') S.flags.askedMarina = true;
    G.save();
  }
  // Arriving in Remanso (DESIGN.md 16): two neighbors by the gate show you how to ask where something is («¿Dónde está mi
  // gato?» «Está debajo de la barca.»), in the language with the English under it; then one of them tells you who Marina is
  // (the head of the village) and that nobody knows where she is right now: ask around.
  async function arriveRemanso() {
    const S = G.state;
    S.flags.remanso = true; G.save();
    await UI.chapter('Remanso', 'The village on the lake');
    if (S.flags.marina) return;
    const Mr = lPerson('mar'), Ln = lPerson('lino');
    if (!Mr || !Ln || S.flags.whereDemo) { await you('A whole village on the water! Marina is the head of Remanso… but where is she? I’ll have to ask someone.'); return; }
    S.flags.whereDemo = true;
    lock(true);
    await you('A whole village on the water! Who’s in charge here?');
    const Y = G.sim.you, mx = (Mr.x + Ln.x) / 2, mz = (Mr.z + Ln.z) / 2, my = Mr.y !== undefined ? Mr.y : WORLD.terrainAt(mx, mz);
    const dx = Y.x - mx, dz = Y.z - mz, d = Math.hypot(dx, dz) || 1;
    G.cam.override = { pos: V(mx + dx / d * 3.6 - dz / d * 2.4, my + 2.1, mz + dz / d * 3.6 + dx / d * 2.4), look: V(mx, my + 1.1, mz), dur: 0.9 };
    await demoAt(Mr, 'remanso.ask', 'Mar');
    await demoAt(Ln, 'remanso.there', 'Lino');
    await youWord('«', wordPart(null, WHERE_Q[UI.lang] || WHERE_Q.es, 'where is…?'), '» So that’s how you ask where someone is!');
    await you('Excuse me! Who’s in charge of Remanso?');
    await sayAt(Mr, 'remanso.marina', 'Mar');        // (who Marina is: a story line, so the mix, not a demonstration)
    G.cam.override = null; lock(false);
    await you('Marina, the head of the village. Then let’s ask where she is!');
    G.save();
  }
  async function marinaScene() {
    const S = G.state, Mr = lPerson('marina'); if (!Mr) return;
    lock(true);
    await sayAt(Mr, 'marina.hello', 'Marina');
    await you('{w.hello}! Ciro the clockmaker sent us. We’re ringing the eight bells, and Molinar’s rings again already.');
    await sayAt(Mr, 'marina.bell', 'Marina');
    await sayAt(Mr, 'marina.bartolo', 'Marina');
    await sayAt(Mr, 'marina.next', 'Marina');
    // what you'll tell Bartolo, heard first: under, on top of, inside (and the names of his things)
    await demoAt(Mr, 'marina.lost', 'Marina');
    S.flags.marina = true; lock(false); G.save();
  }
  // Bartolo, hushed: his lost things, the sentences that give him his words back, the ferry (isle.js, milestone 2)
  const bartoloLook = async () => {
    const Bt = lPerson('bartolo'); if (!Bt) return;
    if (G.state.flags.marina && !G.state.flags.bartoloQuest) ['w.oar', 'w.lantern', 'w.rope'].forEach(introduce);     // (his things, woven in glossed as he points)
    if (typeof ISLE !== 'undefined' && ISLE.bartolo) return ISLE.bartolo({ hushed: () => hushedTalk(Bt) });
    await hushedTalk(Bt);
    think('Bartolo stares out at the island, gray and still.', 5);
  };

  // the Great Mill (mill.js): open once Ciro has told you about the bells
  const millDoor = async () => {
    const S = G.state;
    if (S.flags.millFree) { think('The sails are turning again, and the mill hums inside. The first bell rang here.', 4); return; }
    if (!S.flags.ciro) { think('A huge door, stuck shut. Something moves inside… Maybe someone in town knows about the mill.', 5); return; }
    if (typeof MILL !== 'undefined') await MILL.enter();
  };

  // Seeming lost (no closer to the goal for over a minute, and far from it): Mimo tugs at you and you
  // remember it can show the way. Stops once you've used Q a few times.
  const lostT = { t: 0, best: 1e9, cool: 60, tx: 0, tz: 0 };
  let roomWas = null, roomGrace = 0, postT = 0;       // (the room you were in last frame, and the pause on E after going in or out)
  function lostCheck(dt, Y) {
    const S = G.state, tg = QUESTS.target(), L = lostT;
    L.cool -= dt;
    if (!tg || (S.flags.qUsed || 0) >= 4) return;
    if (Math.hypot(tg.x - L.tx, tg.z - L.tz) > 10) { L.tx = tg.x; L.tz = tg.z; L.best = 1e9; L.t = 0; }   // (a new goal)
    const d = Math.hypot(tg.x - Y.x, tg.z - Y.z);
    if (d < L.best - 12) { L.best = d; L.t = 0; } else L.t += dt;
    if (L.t > 70 && d > 22 && L.cool <= 0) {
      L.t = 0; L.best = d; L.cool = 150;
      const M = G.sim.mimo; M.perk = 1; M.tiltT = 1.2; G.sim.mimoSay('?', 1.4); Sound.play('chirp');
      think(`Not sure where to go? Press ${KEYS.keys('look').split(' / ')[0]} and {mimo} will show me the way.`, 6);
    }
  }
  // Arriving in Alba, the first thing to do is ask Rosa (Noa's neighbor, at the fruit stall) about Noa. Wander off before
  // that and Mimo keeps tugging you back: it runs a few steps toward her stall, points, and you remember why.
  const rosaNag = { cool: 0, n: 0 };
  function rosaNudge(dt, Y) {
    const S = G.state;
    if (S.flags.rosa || !S.flags.hatched) return;
    const town = WORLD.L.town, inTown = Math.hypot(Y.x - town.x, Y.z - town.z) < town.r + 30;
    if (!S.flags.escorted && !inTown) return;            // (not there yet: Bruno is still walking you to Alba)
    const R = G.sim.npc('rosa'); if (!R) return;
    const d = Math.hypot(R.x - Y.x, R.z - Y.z);
    rosaNag.cool -= dt;
    if (d < 34) { if (rosaNag.cool < 4) rosaNag.cool = 4; return; }      // (near enough: by the gate you're ~26 away)
    if (rosaNag.cool > 0) return;
    rosaNag.cool = 13; rosaNag.n++;
    const sim = G.sim, M = sim.mimo, ux = (R.x - Y.x) / d, uz = (R.z - Y.z) / d;
    M.perk = 1; M.happy = 0; sim.mimoSay('!', 1.6); Sound.play('chirp');
    sim.mimoGo({ x: Y.x + ux * 2.6, z: Y.z + uz * 2.6 }, { x: R.x, z: R.z });
    wait(1.8).then(() => { if (!busy) sim.mimoGo(null, null); });
    const lines = ['{mimo} tugs at your sleeve and points back toward the fruit stall. Noa’s neighbor, Rosa! She might know where Noa is.',
      '{mimo} won’t budge. It keeps looking back at the fruit stall… Right: first, ask Rosa about Noa.',
      '{mimo} hops in front of you and chirps at the fruit stall. Rosa first, then everything else!'];
    think(lines[(rosaNag.n - 1) % lines.length], 5.5);
  }
  // ------------------------------------------------------------ Ask Mimo (Q): Mimo shows you the way to the goal
  async function askMimo() {
    const { sim, w3d } = G, Y = sim.you, M = sim.mimo;
    let t = QUESTS.target(), roomHint = null;
    G.state.flags.qUsed = (G.state.flags.qUsed || 0) + 1; lostT.t = 0;
    // in a house the way on is back outside; a room with its own goal (the Corn Society's hall: its leader, then the
    // ladder) points there (the mill has its own goals)
    const room = G.indoorMod && G.indoorMod();
    if (room && !(typeof MILL !== 'undefined' && room === MILL)) {
      const rt = room.target && room.target();
      if (!rt) { sim.mimoSay('!', 1.4); Sound.play('chirp'); think('{mimo} points at the door. The way on is outside!'); return; }
      t = rt; roomHint = rt.hint || '{mimo} points the way. Over there!';
    }
    if (!t) { think('{mimo} looks around happily. Nothing to do right now!'); return; }
    const dx = t.x - Y.x, dz = t.z - Y.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
    const w = QUESTS.word();
    sim.mimoSay(w && LEX.taught(w) ? exclaim(LEX.form(w)) : '!', 2);
    M.glow = 1; Sound.play('chirp');
    if (d < 3.5) { M.happy = 1; think('{mimo} bounces on the spot. It’s right here!'); return; }
    const step = Math.min(4.5, d * 0.6);
    sim.mimoGo({ x: Y.x + ux * step, z: Y.z + uz * step }, { x: t.x, z: t.z });
    think(roomHint || QUESTS.hint(), 5.5);
    for (let k = 1; k <= 7; k++) {
      await wait(0.13);
      const x = Y.x + ux * k * 1.8, z = Y.z + uz * k * 1.8;
      w3d.fx.sparkle(x, WORLD.groundAt(x, z, Y.ry + 2) + 0.6, z, 5, ['#fff3a0', '#7ff7ea']);
    }
    await wait(1.6);
    sim.mimoGo(null, null);
  }

  // ------------------------------------------------------------ spot checks (DESIGN.md 14.8)
  // Every few minutes of play, Mimo checks one word the weave has been slipping into the English lines (seen at least three
  // times, glossed at first): does «manzana» really mean something to you yet? Right counts toward more of the language;
  // "Not sure" or a wrong guess sends the word back to English for a while (it comes again later). Nothing is lost.
  let spotCool = 150 + Math.random() * 90;
  function spotOptions(id) {
    const it = LEX.item(id), en = String(it.en || '').toLowerCase(), kind = it.kind || 'word';
    const pool = LEX.ids().filter(j => j !== id && /^w\./.test(j)).map(j => LEX.item(j))
      .filter(o => o && o.en && (o.kind || 'word') === kind && o.en.toLowerCase() !== en);
    const mix = a => a.map(o => [Math.random(), o]).sort((x, y) => x[0] - y[0]).map(q => q[1]);
    const picks = [], have = new Set([en]);
    // (wrong answers from words you've met first, so the right one doesn't stand out as the only familiar word)
    for (const o of mix(pool.filter(o => LEX.seen(o.id))).concat(mix(pool.filter(o => !LEX.seen(o.id))))) {
      const e = o.en.toLowerCase(); if (have.has(e)) continue;
      have.add(e); picks.push(o.en); if (picks.length >= 3) break;
    }
    return mix([it.en].concat(picks));
  }
  async function spotCheck(id) {
    const sim = G.sim, M = sim.mimo, it = LEX.item(id), word = LEX.form(id), right = it.en;
    M.perk = 1; M.tiltT = 99; sim.mimoSay(word + '?', 99); Sound.play('chirp');
    lock(true);
    await wait(0.5);
    const pick = await UI.choose(`Quick check! ${G.state.mimoName} keeps hearing «${word}». What does it mean?`,
      spotOptions(id).map(en => ({ label: en, value: en })).concat([{ label: 'Not sure', sub: 'it goes back to English for a while', value: '?' }]));
    lock(false);
    M.tiltT = 0; M.say = null;
    curiosityCool = Math.max(curiosityCool, 15); reviewCool = Math.max(reviewCool, 20);
    if (pick === null) { LEX.checkResult(id, null); return; }          // (Esc: skipped, asked again another time)
    const ok = pick === right;
    LEX.checkResult(id, ok);
    if (ok) {
      M.happy = 1.5; M.glow = 1; sim.mimoSay(exclaim(word), 2.2); sim.emit('reviewed', { id });
      UI.toast(`«${word}» = ${right} ✓ It’s sticking. A little more ${(UI.LANGNAME || {})[UI.lang] || 'of the language'} will come in.`);
    } else {
      M.tiltT = 1.2; sim.mimoSay('…', 1.4);
      UI.toast(`«${word}» means “${right}”. Back to English for now: you’ll meet it again later.`);
    }
    G.save();
  }

  // ------------------------------------------------------------ places that react when you arrive
  // scene: true means it's a scene and waits until nothing else is running
  const zones = [
    { id: 'hushwave', scene: true, test: (x, z) => z < 49 && z > 15 && !G.state.flags.rosa, run: () => run(hushWave) },
    { id: 'hush', test: (x, z) => WORLD.hushAt(x, z) > 0.55, run: () => { G.sim.mimo.scared = 3; think('Everything sounds muffled here… even my footsteps.'); } },
    { id: 'lookout', test: (x, z) => Math.hypot(x - 28, z + 10) < 3.4 && G.sim.you.y > 3.2, run: () => think('Rooftops, up north! That must be Noa’s village.') },
    { id: 'glade', test: (x, z) => Math.hypot(x + 23, z - 45) < 4, run: () => think('A tiny clearing, hidden away. Was this Noa’s secret place?') },
    { id: 'exit', test: (x, z) => z < -31, run: () => think('Birds! I can hear them again. And far to the north… a dark old tower.', 6) },
    { id: 'guide', scene: true, test: (x, z) => z < -38 && !G.state.flags.rosa && !G.state.flags.guide, run: () => run(guideScene) },
    { id: 'gate', test: (x, z) => Math.hypot(x - WORLD.L.gate.x, z - WORLD.L.gate.z) < 4, run: () => UI.chapter('Alba', 'Noa’s village') },
    // Chapter 1: out of Alba's east gate, the pass, Molinar
    { id: 'east', test: (x, z) => !!G.state.flags.ch1 && x > 44 && x < 92 && Math.abs(z + 150) < 18, run: () => UI.chapter('The Windmill Hills', 'Chapter 1 · The Eight Bells') },
    { id: 'pass', test: (x, z) => !G.state.flags.boulder && Math.hypot(x - WORLD.L.boulder.x, z - WORLD.L.boulder.z) < 9, run: () => think('A huge rock blocks the pass. Maybe {mimo} can do something about it (E).', 5) },
    { id: 'molinar', scene: true, test: (x, z) => Math.hypot(x - WORLD.L.molinarGate.x, z - WORLD.L.molinarGate.z) < 6, run: () => run(arriveMolinar) },
    // Region 2: the road west, Remanso
    { id: 'west', test: (x, z) => !!G.state.flags.millFree && x < -62 && x > -108 && Math.abs(z + 150) < 16, run: () => UI.chapter('The Reed Meadows', 'Chapter 1 · The second bell') },
    { id: 'remanso', scene: true, test: (x, z) => x < -136 && x > -150 && Math.abs(z + 151) < 10, run: () => run(arriveRemanso) },
  ];

  // ------------------------------------------------------------ per frame
  function update(dt, inp) {
    clock += dt;
    for (let i = waiters.length - 1; i >= 0; i--) if (clock >= waiters[i].at) { const w = waiters[i]; waiters.splice(i, 1); w.r(); }
    for (let i = tweens.length - 1; i >= 0; i--) { const tw = tweens[i], k = Math.min(1, (clock - tw.t0) / tw.s); tw.fn(k); if (k >= 1) { tweens.splice(i, 1); tw.r(); } }
    if (thought && (thought.t -= dt) <= 0) thought = null;
    if (line) {
      const len = line.len;
      const before = Math.floor(line.shown / 2);
      line.shown = Math.min(len, line.shown + dt * (line.hushed ? 16 : 38));     // (the hushed talk slow and flat)
      if (Math.floor(line.shown / 2) !== before && line.shown < len) Sound.play('blip', line.who, line.hushed ? { monotone: true } : undefined);
      line.full = line.shown >= len;
      if (inp.interact || inp.jumpPressed) { if (!line.full) line.shown = len; else { const l = line; line = null; Sound.play('click'); l.resolve(); } }
      return;
    }
    const S = G.state, Y = G.sim.you;
    if (!S.flags.hatched || S.teaching || G.journalOpen) return;
    const roomNow = (G.indoorMod && G.indoorMod()) || null, inRoom = !!roomNow;       // (rooms float far off over the woods: no outdoor zones in there)
    // just in or just out: a short pause before E works again, so a press as the fade lifts doesn't turn you straight
    // round (you arrive right by "Leave", and come out standing on "Go in")
    if (roomNow !== roomWas) { roomWas = roomNow; roomGrace = 0.8; }
    if (roomGrace > 0) roomGrace -= dt;
    // (a zone without a test or run function is skipped, so one module's half-made zone can't stop every frame)
    if (!inRoom) for (const z of zones) if (typeof z.test === 'function' && typeof z.run === 'function' && !S.flags['z_' + z.id] && !(z.scene && busy) && z.test(Y.x, Y.z)) { S.flags['z_' + z.id] = true; z.run(); }
    if (busy) return;
    if (S.flags.escort && !S.flags.escorted && !inRoom) { escortStep(dt); if (busy) return; }
    // Marga pushing her cart catches Mimo's eye (once, if it doesn't know «empuja» yet)
    // Lalo swimming by the broken bridge catches Mimo's eye (once, if it doesn't know «nada» yet)
    if (S.flags.ch1 && !S.flags.laloSeen && !inRoom && Y.x < -100 && Y.x > -135) { const P = lPerson('lalo'); if (P && !LEX.taught('v.swim') && Math.hypot(P.x - Y.x, P.z - Y.z) < 13) { run(laloScene); return; } }
    if (S.flags.ch1 && !S.flags.farmerSeen && !inRoom && Y.x > 100 && Y.x < 140) { const F = mPerson('farmer'); if (F && !LEX.taught('v.push') && Math.hypot(F.x - Y.x, F.z - Y.z) < 13) { run(farmerScene); return; } }
    // the nearest thing to press E on
    let best = null, bd = 1e9;
    for (const it of interactables()) { const d = Math.hypot(it.x - Y.x, it.z - Y.z); if (d < it.r && d < bd) { bd = d; best = it; } }
    G.prompt = roomGrace > 0 ? null : best;
    if (best && inp.interact && roomGrace <= 0) { run(talkMenu(best)); return; }
    if (inp.look) { run(askMimo); return; }
    // indoors: the mill has no trees or flowers to ask about (the forest is far below); a house has its furniture
    const room = G.indoorMod && G.indoorMod();
    if (room && !room.curiosities) return;
    if (!room) { lostCheck(dt, Y); rosaNudge(dt, Y); if ((postT -= dt) <= 0) { postT = 1; brunoToPost(); } }     // (Bruno waits at the east gate to hear about the field)
    // a spot check now and then: outdoors, after Rosa, and not while you're running about
    if (!room && S.flags.rosa && (spotCool -= dt) <= 0 && Y.speed < 6) {
      const id = LEX.checkDue();
      if (!id) spotCool = 30;
      else { spotCool = 180 + Math.random() * 150; run(() => spotCheck(id)); return; }
    }
    // Mimo gets curious about a word you've seen but haven't taught yet, or wants a review
    curiosityCool -= dt; reviewCool -= dt;
    if (curiosityCool <= 0 && Y.speed < 6) {
      curiosityCool = 2;
      const near = (room ? room.curiosities() : curiosities()).filter(c => !LEX.taught(c.id) && LEX.seen(c.id) && Math.hypot(c.x - Y.x, c.z - Y.z) < c.r);
      const c = near.find(c => c.id === focusWord) || near[0];
      if (c && LEX.mayIntroduce()) { curiosityCool = 18; run(() => teachWord(c.id, { spot: { x: c.x + (Y.x - c.x) * 0.3, z: c.z + (Y.z - c.z) * 0.3 }, look: c })); return; }
    }
    if (reviewCool <= 0 && !room) {             // (reviews point at things outdoors)
      reviewCool = 6;
      // (phrases have no spot in the world to point at: the people who taught them quiz you instead)
      for (const id of LEX.due(12).filter(id => { const it = LEX.item(id); return !it || it.kind !== 'phrase'; }).slice(0, 4)) {
        const s = reviewSpot(id, Y.x, Y.z);
        if (s) { reviewCool = 45 + Math.random() * 30; curiosityCool = Math.max(curiosityCool, 10); run(() => teachWord(id, { review: true, spot: { x: s.x + (Y.x - s.x) * 0.4, z: s.z + (Y.z - s.z) * 0.4 }, look: s })); return; }
      }
    }
    // Mimo babbles words it knows, now and then: only while you stand still, and never over
    // something it's already saying (it used to blurt a random word right after you taught it one)
    const M = G.sim.mimo;
    if (!M.say && Y.still > 1.5 && (M.babbleT -= dt) <= 0) {
      M.babbleT = 25 + Math.random() * 25;
      const ids = LEX.taughtList().filter(id => id.startsWith('w.'));
      if (ids.length) G.sim.mimoSay(exclaim(LEX.form(ids[(Math.random() * ids.length) | 0])), 1.8);
    }
  }
  async function run(fn) {
    busy = true; G.prompt = null;
    try { await fn(); } catch (e) { console.error(e); }
    busy = false;
  }
  return {
    init(game) { G = game; ensureVerbs(); },
    prologue, update, run, teachWord, say, you, think, wait, tween, fieldBattle, roamerBattle, bossScene, askMimo,
    sayInline, sayAt,      // (townsfolk's lines with the weave and the voice blips: interiors.js and cornmaze.js use them)
    talkHooks, talkMenu,   // (free talk, js/talk/: more options on a Talk)
    get line() { return line; }, get thought() { return thought; }, get busy() { return busy; },
    PAGES,
    _test: { curiosities, interactables, reviewSpot, zones, hushWave, rosaScene, brunoScene, guideScene, welcomeScene, boulderScene, farmerScene, ciroScene, openShop, arriveMolinar, spotCheck, spotOptions, get spotCool() { return spotCool; }, set spotCool(v) { spotCool = v; },
      reportField, reportMill, brunoToPost, arriveRemanso, laloScene, marinaScene, askScene, fieldCleared },
    // (DESIGN.md 16) the demonstration kit, for the regions' scenes: a sentence whole in the language with the shown word
    // highlighted and glossed (demoAt / demoLine / sayFull; EN on request, never English under it), your own line with a word in
    // the language and its gloss, a word let into the weave before it's asked
    demoAt, demoLine, sayFull, wordPart, youWord, introduce, phraseOf, LINES16,
    // (the mix: every line is the English with your words in the language, whole in the language as the weave rises; a hushed
    // line keeps its surviving words in the language; mixHTML: the same for a panel of its own)
    mixLine, mixHTML, sayHushed, hushLine,
    mixParts,              // (the pieces alone, nothing counted: mix-test.html's audit mixes every line through it)
  };
})();

// ============================================================ Region 3, the Quarry Caves (caves.js, mine.js): the story's hooks
// (Appended for region 3: the code above stays as it is.) STORY's own interactables() and per-frame checks live inside its
// closure, so this section wraps STORY.update: the providers in STORY.extra (each { interactables(), tick(dt, you) }; caves.js
// adds itself in CAVES.init) join the race for the nearest thing to press E on, and their per-frame checks run while no scene
// does. A new region can push itself here the same way. Zones go straight into STORY._test.zones (the same array).
(() => {
  const base = STORY.update, init0 = STORY.init, extra = STORY.extra = STORY.extra || [];
  let G = null, grace = 0, roomWas = null;
  STORY.init = function (game) { G = game; return init0.call(this, game); };
  const near = (list, Y) => { let best = null, bd = 1e9; for (const it of list) { const d = Math.hypot(it.x - Y.x, it.z - Y.z); if (d < it.r && d < bd) { bd = d; best = it; } } return [best, bd]; };
  STORY.update = function (dt, inp) {
    if (!G || !extra.length) return base(dt, inp);
    const S = G.state, Y = G.sim.you, room = (G.indoorMod && G.indoorMod()) || null;
    if (room !== roomWas) { roomWas = room; grace = 0.8; }
    if (grace > 0) grace -= dt;
    const ready = S.flags.hatched && !S.teaching && !G.journalOpen && !STORY.busy && !STORY.line && !room;
    let mine = null, md = 1e9;
    if (ready) { const all = []; for (const P of extra) if (P.interactables) { try { all.push(...P.interactables()); } catch (e) { console.error('[story extra]', e); } } [mine, md] = near(all, Y); }
    // whose E is it: the story's own nearest thing, or ours?
    let ours = false;
    if (mine) { const [, td] = near(STORY._test.interactables(), Y); ours = md <= td; }
    if (ours && inp && inp.interact && grace <= 0) { base(dt, Object.assign({}, inp, { interact: false })); G.prompt = null; STORY.run(STORY.talkMenu ? STORY.talkMenu(mine) : mine.run); return; }
    base(dt, inp);
    if (ours && !STORY.busy && !STORY.line) G.prompt = grace > 0 ? null : mine;
    if (ready && !STORY.busy && !STORY.line) for (const P of extra) if (P.tick) { try { P.tick(dt, Y); } catch (e) { console.error('[story extra]', e); } }
  };
})();
