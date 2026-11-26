'use strict';
// The Mirror Lake, tomorrow: the words (DESIGN.md 18.10 "T2a", game/TIME.md "The Mirror Lake long ago and tomorrow"). Every line in
// es / pt / de, zh and ja in CJK.md's notation, and the English the weave mixes from ({w.lf_*}: this world's words, registered in
// Mimo's memory by time_lake.js from WORDS below). lake_future.js is the place, lake_future_dungeon.js the drowned grotto,
// lake_time_boss.js the Gray Toad; time_lake.js (LAKET) says, demonstrates and grades them (MOLT.grade).
// The grammar rung (TIME.md §8): irregular futures (es tendré, haré, podré, saldré, vendré, diré, pondré, in every person):
// promises wake the frozen («¡Vendremos todos!», «Harás una barca nueva»), {mimo} follows plans («{mimo} pondrá la tabla»), and
// the Gray Toad's dark predictions are answered with promises. «ir a» + infinitive still counts (an A). pt: the futuro do presente,
// with fazer / dizer / trazer irregular (farei, direi, trarei), «vou» + infinitive an A; de: «werden» + the infinitive at the end
// («ich werde kommen», «du wirst bauen», «sie wird fahren»); zh: 会 (will: a promise, a guess), 要 (going to), 打算 (plan to),
// contrasted; ja: plans with ～予定 です / つもり, guesses with ～でしょう.
// The cast (each language names its own where it's a new face; today's people keep their names): Lalo (grown, the only one still
// talking), old Bartolo, Marina, Vicente, Delia the net mender, Lucho (a teenager now), old Pepe.
const LFTXT = (() => {
  const L = (en, es, pt, de, zh, ja, o) => Object.assign({ en, es, pt, de, zh, ja }, o || {});
  const CAST = {
    lalo: L('Lalo', 'Lalo', 'Lalo', 'Lalo', '[拉洛|Lā luò]', 'ラロ'),
    bartolo: L('Bartolo', 'Bartolo', 'Bartolo', 'Bartolo', '[巴托洛|Bā tuō luò]', 'バルトロ'),
    marina: L('Marina', 'Marina', 'Marina', 'Marina', '[玛丽娜|Mǎ lì nà]', 'マリーナ'),
    vicente: L('Vicente', 'Vicente', 'Vicente', 'Vicente', '[维森特|Wéi sēn tè]', 'ビセンテ'),
    delia: L('Delia', 'Delia', 'Delia', 'Delia', '[黛莉亚|Dài lì yà]', 'デリア'),
    lucho: L('Lucho', 'Lucho', 'Lucho', 'Lucho', '[卢乔|Lú qiáo]', 'ルチョ'),
    pepe: L('old Pepe', 'el viejo Pepe', 'o velho Pepe', 'der alte Pepe', '[佩佩|Pèi pèi] [爷爷|yé ye]', 'ペペ じいさん'),
  };
  // ------------------------------------------------------------ what people say (mixed by the weave; EN on request)
  const LINES = {
    // Lalo, by the rusted ferry: the only one still talking
    'lalo.hello': L('Hey! Someone with color! Everyone here went {w.lf_gray} and {w.lf_still}. Even the lake doesn’t move. I swim every day so I don’t freeze too.',
      '¡Eh! ¡Alguien con color! Aquí todos se quedaron grises y quietos. Hasta el lago no se mueve. Yo nado cada día para no congelarme también.',
      'Ei! Alguém com cor! Aqui todo mundo ficou cinza e parado. Nem o lago se mexe. Eu nado todo dia pra não congelar também.',
      'He! Jemand mit Farbe! Hier sind alle grau und still geworden. Sogar der See bewegt sich nicht. Ich schwimme jeden Tag, damit ich nicht auch erstarre.',
      '[嘿|hēi] ！ [有|yǒu] [颜色|yán sè] [的|de] [人|rén] ！ [这里|zhè lǐ] [大家|dà jiā] [都|dōu] [变|biàn] [得|de] [又|yòu] [灰|huī] [又|yòu] [不|bù] [动|dòng] 。 [连|lián] [湖|hú] [都|dōu] [不|bù] [动|dòng] [了|le] 。 [我|wǒ] [每天|měi tiān] [游泳|yóu yǒng] ， [才|cái] [没有|méi yǒu] [冻住|dòng zhù] 。',
      'おーい ！ [色|いろ] の ある [人|ひと] だ ！ ここ の みんな は [灰色|はいいろ] に なって 、 [動|うご]かない 。 [湖|みずうみ] まで [止|と]まって る 。 おれ は [凍|こお]らない ように 、 [毎日|まいにち] [泳|およ]いで る ん だ 。'),
    'lalo.ferry': L('Look at the old {w.lp_ferry}: all {w.lf_rust}. Bartolo got old, and nobody learned to run it. Now nobody crosses.',
      'Mira el ferry viejo: todo oxidado. Bartolo se hizo viejo, y nadie aprendió a llevarlo. Ahora nadie cruza.',
      'Olha a balsa velha: toda enferrujada. O Bartolo ficou velho, e ninguém aprendeu a levar. Agora ninguém atravessa.',
      'Schau dir die alte Fähre an: ganz verrostet. Bartolo ist alt geworden, und niemand hat gelernt, sie zu fahren. Jetzt fährt keiner mehr hinüber.',
      '[你|nǐ] [看|kàn] [那|nà] [艘|sōu] [旧|jiù] [渡船|dù chuán] ： [全|quán] [生锈|shēng xiù] [了|le] 。 [巴托洛|Bā tuō luò] [老|lǎo] [了|le] ， [没有|méi yǒu] [人|rén] [学会|xué huì] [开|kāi] [船|chuán] 。 [现在|xiàn zài] [谁|shéi] [都|dōu] [不|bù] [过|guò] [湖|hú] [了|le] 。',
      '[古|ふる]い フェリー を [見|み]て 。 さび だらけ だ 。 バルトロ さん が [年|とし] を とって 、 だれ も [動|うご]かし[方|かた] を [習|なら]わなかった 。 [今|いま] は だれ も [渡|わた]らない 。'),
    'lalo.wake': L('They’re frozen until someone gives them a {w.lf_promise}: a tomorrow. You try! Promise each one what will happen: in tomorrow’s words.',
      'Están congelados hasta que alguien les promete un mañana. ¡Inténtalo tú! Promete a cada uno lo que pasará: con las palabras de mañana.',
      'Eles estão congelados até alguém prometer um amanhã. Tenta você! Promete pra cada um o que vai acontecer: com as palavras de amanhã.',
      'Sie sind erstarrt, bis ihnen jemand ein Morgen verspricht. Versuch du es! Versprich jedem, was passieren wird: mit den Worten von morgen.',
      '[他们|tā men] [冻住|dòng zhù] [了|le] ， [要|yào] [有|yǒu] [人|rén] [答应|dā ying] [他们|tā men] [一个|yī gè] [明天|míng tiān] 。 [你|nǐ] [试试|shì shi] ！ [用|yòng] [明天|míng tiān] [的|de] [话|huà] ， [答应|dā ying] [每|měi] [个|gè] [人|rén] [会|huì] [发生|fā shēng] [什么|shén me] 。',
      'みんな 、 だれか が [明日|あした] を [約束|やくそく] する まで [凍|こお]った まま なん だ 。 やって みて ！ [明日|あした] の [言葉|ことば] で 、 [一人|ひとり] ずつ に [約束|やくそく] して 。'),
    'lalo.seal': L('And see the gray {w.lf_seal} on the old arch, out on the {w.lp_mud}? The bay {w.lf_dried_up} last year. When the village wakes up, it’ll crack.',
      '¿Y ves el sello gris en el arco viejo, allá en el barro? La bahía se secó el año pasado. Cuando el pueblo despierte, se romperá.',
      'E está vendo o selo cinza no arco velho, lá na lama? A baía secou no ano passado. Quando a vila acordar, ele vai rachar.',
      'Und siehst du das graue Siegel am alten Bogen, dort draußen im Schlamm? Die Bucht ist letztes Jahr ausgetrocknet. Wenn das Dorf aufwacht, bricht es.',
      '[你|nǐ] [看见|kàn jiàn] [泥|ní] [地|dì] [里|lǐ] [那个|nà ge] [旧|jiù] [拱门|gǒng mén] [上|shàng] [的|de] [灰色|huī sè] [封印|fēng yìn] [了|le] [吗|ma] ？ [去年|qù nián] [湖湾|hú wān] [干|gān] [了|le] 。 [村子|cūn zi] [醒|xǐng] [过来|guò lai] [的|de] [时候|shí hou] ， [它|tā] [会|huì] [裂开|liè kāi] 。',
      'それ に 、 [泥|どろ] の [向|む]こう 、 [古|ふる]い アーチ に [灰色|はいいろ] の [封印|ふういん] が ある だろ ？ [去年|きょねん] 、 [入|い]り[江|え] が [干上|ひあ]がった ん だ 。 [村|むら] が [目|め] を [覚|さ]ませば 、 [割|わ]れる でしょう 。'),
    'lalo.again': L('Promise them a tomorrow! Then the seal on the arch will crack.', '¡Promételes un mañana! Entonces el sello del arco se romperá.', 'Promete um amanhã pra eles! Aí o selo do arco vai rachar.', 'Versprich ihnen ein Morgen! Dann bricht das Siegel am Bogen.',
      '[答应|dā ying] [他们|tā men] [一个|yī gè] [明天|míng tiān] ！ [然后|rán hòu] [拱门|gǒng mén] [上|shàng] [的|de] [封印|fēng yìn] [会|huì] [裂开|liè kāi] 。', '[明日|あした] を [約束|やくそく] して あげて ！ そう すれば 、 アーチ の [封印|ふういん] は [割|わ]れる でしょう 。'),
    'lalo.open': L('The seal cracked! The {w.lp_grotto} on the old island is open… Go on: I’ll come right behind you.',
      '¡El sello se rompió! La gruta de la isla vieja está abierta… Ve: yo iré detrás de ti.',
      'O selo rachou! A gruta da ilha velha está aberta… Vai: eu vou logo atrás.',
      'Das Siegel ist gebrochen! Die Grotte auf der alten Insel ist offen … Geh nur: Ich komme gleich hinter dir.',
      '[封印|fēng yìn] [裂开|liè kāi] [了|le] ！ [老|lǎo] [岛|dǎo] [上|shàng] [的|de] [洞穴|dòng xué] [开|kāi] [了|le] … [去|qù] [吧|ba] ， [我|wǒ] [马上|mǎ shàng] [跟|gēn] [过去|guò qu] 。',
      '[封印|ふういん] が [割|わ]れた ！ [古|ふる]い [島|しま] の [洞窟|どうくつ] が [開|あ]いた … [行|い]って 。 おれ も すぐ [後|あと] から [行|い]く 。'),
    'lalo.after': L('The lake is moving again! Look at the color coming back. Tomorrow I’ll swim to the island… and the day after, I’ll take the ferry.',
      '¡El lago se mueve otra vez! Mira cómo vuelve el color. Mañana nadaré hasta la isla… y pasado mañana, llevaré el ferry.',
      'O lago está se mexendo de novo! Olha a cor voltando. Amanhã eu vou nadar até a ilha… e depois de amanhã, vou levar a balsa.',
      'Der See bewegt sich wieder! Schau, wie die Farbe zurückkommt. Morgen schwimme ich zur Insel … und übermorgen fahre ich die Fähre.',
      '[湖|hú] [又|yòu] [动|dòng] [起来|qǐ lai] [了|le] ！ [你|nǐ] [看|kàn] ， [颜色|yán sè] [回来|huí lai] [了|le] 。 [明天|míng tiān] [我|wǒ] [要|yào] [游|yóu] [到|dào] [岛|dǎo] [上|shàng] … [后天|hòu tiān] [我|wǒ] [要|yào] [开|kāi] [渡船|dù chuán] 。',
      '[湖|みずうみ] が また [動|うご]いて る ！ [色|いろ] が [戻|もど]って [来|く]る 。 [明日|あした] は [島|しま] まで [泳|およ]ぐ つもり … あさって は フェリー を [動|うご]かす [予定|よてい] だ 。'),
    'lalo.captain': L('Ahoy! Bartolo taught me the {w.lp_ferry}, years ago. Now I’m the ferryman. Want to cross? Tomorrow I’ll take you.',
      '¡Ah del barco! Bartolo me enseñó el ferry hace años. Ahora el barquero soy yo. ¿Quieres cruzar? Mañana te llevaré.',
      'Ô de bordo! O Bartolo me ensinou a balsa anos atrás. Agora o barqueiro sou eu. Quer atravessar? Amanhã eu te levo.',
      'Ahoi! Bartolo hat mir vor Jahren die Fähre beigebracht. Jetzt bin ich der Fährmann. Willst du hinüber? Morgen bringe ich dich.',
      '[喂|wèi] ， [船|chuán] [上|shàng] [的|de] ！ [好|hǎo] [多|duō] [年|nián] [前|qián] [巴托洛|Bā tuō luò] [教|jiāo] [会|huì] [了|le] [我|wǒ] [开|kāi] [渡船|dù chuán] 。 [现在|xiàn zài] [我|wǒ] [是|shì] [船夫|chuán fū] 。 [要|yào] [过|guò] [湖|hú] [吗|ma] ？ [明天|míng tiān] [我|wǒ] [送|sòng] [你|nǐ] 。',
      'おーい ！ [何年|なんねん] も [前|まえ] 、 バルトロ さん が フェリー を [教|おし]えて くれた 。 [今|いま] は おれ が [船頭|せんどう] だ 。 [渡|わた]りたい ？ [明日|あした] 、 [乗|の]せて [行|い]く [予定|よてい] だ よ 。'),
    // the frozen (hushed: only their *starred* words get through, each language's in the English's order, one for one; an English
    // star of more than a word is joined with no-break spaces,  , so story.js's hushLine reads it as one)
    'marina.frozen': L('…nobody… *will come*… the lake *party*… nobody…', '…nadie… *vendrá*… la *fiesta* del lago… nadie…', '…ninguém… *virá*… a *festa* do lago… ninguém…', '…niemand … *wird kommen* … das *Fest* am See … niemand …',
      '… [没有|méi yǒu] [人|rén] … *[会|huì] [来|lái]* … [湖|hú] [边|biān] [的|de] *[晚会|wǎn huì]* … [没有|méi yǒu] [人|rén] …', '… だれ も … *[来|こ]ない* … [湖|みずうみ] の *お[祭|まつ]り* … だれ も …'),
    'marina.awake': L('We will come… all of us? Oh! My yellow house, my lake… I can see the color again.',
      '¿Vendremos todos…? ¡Ay! Mi casa amarilla, mi lago… vuelvo a ver el color.',
      'Viremos todos…? Ai! A minha casa amarela, o meu lago… estou vendo a cor de novo.',
      'Wir werden alle kommen …? Oh! Mein gelbes Haus, mein See … ich sehe wieder Farben.',
      '[我们|wǒ men] [都|dōu] [会|huì] [来|lái] … ？ [哎|āi] ！ [我|wǒ] [的|de] [黄|huáng] [房子|fáng zi] ， [我|wǒ] [的|de] [湖|hú] … [我|wǒ] [又|yòu] [看见|kàn jiàn] [颜色|yán sè] [了|le] 。',
      'みんな [来|く]る でしょう か … ？ まあ ！ わたし の [黄色|きいろ] い [家|いえ] 、 わたし の [湖|みずうみ] … また [色|いろ] が [見|み]える 。'),
    'vicente.frozen': L('… *boats*… I *won’t make* any more… nobody…', '…*barcas*… ya no *haré* más… nadie…', '…*barcos*… não *farei* mais… ninguém…', '… *Boote* … ich *werde keine mehr bauen* … niemand …',
      '… *[船|chuán]* … [我|wǒ] *[不会|bù huì] [再|zài] [做|zuò]* [了|le] … [没有|méi yǒu] [人|rén] …', '… *[船|ふね]* は … もう *[作|つく]らない* … だれ も …'),
    'vicente.awake': L('A new boat? I will make one… yes, I will. My father always said: if it’s wood, I make it.',
      '¿Una barca nueva? La haré… sí, la haré. Mi padre siempre decía: si es de madera, la hago yo.',
      'Um barco novo? Eu farei… sim, farei. O meu pai sempre dizia: se é de madeira, eu faço.',
      'Ein neues Boot? Ich werde eins bauen … ja, das werde ich. Mein Vater hat immer gesagt: Wenn es aus Holz ist, mache ich es.',
      '[新|xīn] [船|chuán] ？ [我|wǒ] [会|huì] [做|zuò] … [对|duì] ， [我|wǒ] [会|huì] [做|zuò] 。 [我|wǒ] [爸爸|bà ba] [总|zǒng] [说|shuō] ： [只要|zhǐ yào] [是|shì] [木头|mù tou] [的|de] ， [我|wǒ] [都|dōu] [做|zuò] 。',
      '[新|あたら]しい [船|ふね] ？ [作|つく]る つもり だ … ああ 、 [作|つく]る さ 。 [親父|おやじ] は いつも [言|い]って た 。 [木|き] の もの なら 、 なんでも [作|つく]る って 。'),
    'delia.frozen': L('…the children… *won’t have*… *nets*…', '…los niños… no *tendrán*… *redes*…', '…as crianças… não *terão*… *redes*…', '… die Kinder … *werden keine haben* … *Netze* …',
      '… [孩子|hái zi] [们|men] … *[不会|bù huì] [有|yǒu]* … *[渔网|yú wǎng]* …', '… [子|こ]ども たち は … *[持|も]たない* … *[網|あみ]* …'),
    'delia.awake': L('New nets for the children? Then I’ll need my big needle. Where did I leave it… oh, the color!',
      '¿Redes nuevas para los niños? Entonces necesitaré mi aguja grande. ¿Dónde la dejé…? ¡Ay, el color!',
      'Redes novas pras crianças? Então vou precisar da minha agulha grande. Onde deixei… ai, a cor!',
      'Neue Netze für die Kinder? Dann brauche ich meine große Nadel. Wo habe ich sie … oh, die Farbe!',
      '[孩子|hái zi] [们|men] [会|huì] [有|yǒu] [新|xīn] [渔网|yú wǎng] ？ [那|nà] [我|wǒ] [需要|xū yào] [我|wǒ] [的|de] [大|dà] [针|zhēn] 。 [放|fàng] [在|zài] [哪里|nǎ lǐ] [了|le] … [哎|āi] ， [颜色|yán sè] ！',
      '[子|こ]ども たち に [新|あたら]しい [網|あみ] ？ それ なら 、 [大|おお]きい [針|はり] が いる わ 。 どこ に [置|お]いた かしら … まあ 、 [色|いろ] が ！'),
    'bartolo.frozen': L('…the ferry… *won’t go out*… never… *again*…', '…el ferry… no *saldrá*… nunca… *más*…', '…a balsa… não *sairá*… nunca… *mais*…', '… die Fähre … *wird nicht fahren* … nie … *mehr* …',
      '… [渡船|dù chuán] … *[不会|bù huì] [开|kāi]* … [永远|yǒng yuǎn] … *[再|zài]* [也|yě] [不|bù] …', '… フェリー は … *[出|で]ない* … もう … *[二度|にど]と* …'),
    'bartolo.awake': L('The ferry will go out tomorrow? Ha… These old hands can’t row any more. But somebody’s hands will.',
      '¿El ferry saldrá mañana? Ja… Estas manos viejas ya no pueden remar. Pero otras manos podrán.',
      'A balsa sairá amanhã? Ha… Estas mãos velhas não conseguem mais remar. Mas outras mãos vão poder.',
      'Die Fähre wird morgen fahren? Ha … Diese alten Hände können nicht mehr rudern. Aber andere Hände werden es können.',
      '[渡船|dù chuán] [明天|míng tiān] [会|huì] [开|kāi] ？ [哈|hā] … [这|zhè] [双|shuāng] [老|lǎo] [手|shǒu] [已经|yǐ jīng] [划|huá] [不|bù] [动|dòng] [了|le] 。 [可是|kě shì] [别人|bié rén] [的|de] [手|shǒu] [会|huì] [行|xíng] 。',
      'フェリー が [明日|あした] [出|で]る ？ はは … この [年寄|としよ]り の [手|て] は 、 もう こげない 。 でも 、 だれか の [手|て] が こぐ でしょう 。'),
    'lucho.frozen': L('…my *paper boat*… *won’t sail*… no wind…', '…mi *barquito de papel*… no *saldrá*… no hay viento…', '…o meu *barquinho de papel*… não *sairá*… não tem vento…', '… mein *Papierschiff* … *wird nicht fahren* … kein Wind …',
      '… [我|wǒ] [的|de] *[纸船|zhǐ chuán]* … *[不会|bù huì] [走|zǒu]* … [没有|méi yǒu] [风|fēng] …', '… ぼく の *[紙|かみ]の[船|ふね]* … *[出|で]ない* … [風|かぜ] が ない …'),
    'lucho.awake': L('I’ll go sailing? Me? …Hey, I’m not gray any more! Help me with my paper boat?',
      '¿Saldré a navegar? ¿Yo? …¡Eh, ya no estoy gris! ¿Me ayudas con mi barquito?',
      'Vou sair pra navegar? Eu? …Ei, não estou mais cinza! Me ajuda com o meu barquinho?',
      'Ich werde segeln gehen? Ich? … He, ich bin nicht mehr grau! Hilfst du mir mit meinem Papierschiff?',
      '[我|wǒ] [会|huì] [去|qù] [划船|huá chuán] ？ [我|wǒ] ？ … [嘿|hēi] ， [我|wǒ] [不|bù] [灰|huī] [了|le] ！ [帮|bāng] [我|wǒ] [放|fàng] [纸船|zhǐ chuán] [好|hǎo] [吗|ma] ？',
      'ぼく が [船|ふね] に [乗|の]る ？ ぼく が ？ … あれ 、 もう [灰色|はいいろ] じゃない ！ [紙|かみ]の[船|ふね] 、 [手伝|てつだ]って くれる ？'),
    'lucho.boat': L('It’s sailing! The lake is moving a little again. One day I’ll build a real one with Vicente.',
      '¡Navega! El lago se mueve un poquito otra vez. Algún día haré uno de verdad con Vicente.',
      'Está navegando! O lago está se mexendo um pouquinho de novo. Um dia eu farei um de verdade com o Vicente.',
      'Es fährt! Der See bewegt sich wieder ein bisschen. Eines Tages werde ich mit Vicente ein echtes bauen.',
      '[它|tā] [漂|piāo] [走|zǒu] [了|le] ！ [湖|hú] [又|yòu] [有|yǒu] [一点|yī diǎn] [动|dòng] [了|le] 。 [总有一天|zǒng yǒu yī tiān] [我|wǒ] [会|huì] [跟|gēn] [维森特|Wéi sēn tè] [做|zuò] [一|yī] [条|tiáo] [真|zhēn] [船|chuán] 。',
      '[走|はし]った ！ [湖|みずうみ] が また [少|すこ]し [動|うご]いて る 。 いつか ビセンテ さん と 、 [本物|ほんもの] の [船|ふね] を [作|つく]る つもり だ よ 。'),
    'pepe.frozen': L('…I *won’t fish*… the fish… *won’t come back*…', '…ya no *pescaré*… los peces… no *volverán*…', '…não *pescarei* mais… os peixes… não *voltarão*…', '… ich *werde nicht mehr angeln* … die Fische … *werden nicht zurückkommen* …',
      '… [我|wǒ] *[不会|bù huì] [再|zài] [钓鱼|diào yú]* [了|le] … [鱼|yú] … *[不会|bù huì] [回来|huí lai]* [了|le] …', '… もう *[釣|つ]り は しない* … [魚|さかな] は … *[戻|もど]って [来|こ]ない* …'),
    'pepe.awake': L('I’ll have lots of fish? Then I’ll be here, with my old rod. Like back then, when I was young.',
      '¿Tendré muchos peces? Entonces aquí estaré, con mi caña vieja. Como cuando era joven.',
      'Terei muitos peixes? Então eu estarei aqui, com a minha vara velha. Como quando eu era jovem.',
      'Ich werde viele Fische fangen? Dann werde ich hier sein, mit meiner alten Angel. Wie damals, als ich jung war.',
      '[我|wǒ] [会|huì] [有|yǒu] [很多|hěn duō] [鱼|yú] ？ [那|nà] [我|wǒ] [会|huì] [在|zài] [这里|zhè lǐ] ， [拿|ná] [着|zhe] [我|wǒ] [的|de] [旧|jiù] [鱼竿|yú gān] 。 [像|xiàng] [当年|dāng nián] [一样|yī yàng] 。',
      '[魚|さかな] が たくさん [釣|つ]れる でしょう か ？ それ なら 、 [古|ふる]い [竿|さお] を [持|も]って 、 ここ に いる よ 。 [若|わか]い ころ の よう に 。'),
    // after: Marina's lake party, Bartolo's warning
    'marina.party': L('The lake party is next week, like the old days! Lanterns over the pier, music, everyone on the water.',
      '¡La fiesta del lago es la semana que viene, como antes! Faroles sobre el muelle, música, todos en el agua.',
      'A festa do lago é na semana que vem, como antigamente! Lanternas em cima do píer, música, todo mundo na água.',
      'Das Seefest ist nächste Woche, wie früher! Laternen über dem Steg, Musik, alle auf dem Wasser.',
      '[下|xià] [个|gè] [星期|xīng qī] [有|yǒu] [湖|hú] [边|biān] [晚会|wǎn huì] ， [跟|gēn] [以前|yǐ qián] [一样|yī yàng] ！ [码头|mǎ tóu] [上|shàng] [挂|guà] [灯笼|dēng long] ， [有|yǒu] [音乐|yīn yuè] ， [大家|dà jiā] [都|dōu] [在|zài] [水|shuǐ] [上|shàng] 。',
      '[来週|らいしゅう] は [湖|みずうみ] の お[祭|まつ]り よ 。 [昔|むかし] の よう に ！ [桟橋|さんばし] に ちょうちん 、 [音楽|おんがく] 、 みんな [水|みず] の [上|うえ] 。'),
    'marina.partyDone': L('Look at the lanterns! Next week the whole lake will shine. You will come, won’t you?',
      '¡Mira los faroles! La semana que viene todo el lago brillará. Vendrás, ¿verdad?',
      'Olha as lanternas! Na semana que vem o lago inteiro vai brilhar. Você virá, né?',
      'Schau dir die Laternen an! Nächste Woche wird der ganze See leuchten. Du kommst doch, oder?',
      '[你|nǐ] [看|kàn] [这些|zhè xiē] [灯笼|dēng long] ！ [下|xià] [个|gè] [星期|xīng qī] [整个|zhěng gè] [湖|hú] [都|dōu] [会|huì] [发光|fā guāng] 。 [你|nǐ] [会|huì] [来|lái] [吧|ba] ？',
      'ちょうちん を [見|み]て ！ [来週|らいしゅう] は [湖|みずうみ] じゅう が [光|ひか]る でしょう 。 [来|き]て くれる わ よ ね ？'),
    'bartolo.why': L('Why did the ferry rust? Lalo never learned. Nobody taught him. If somebody had…',
      '¿Por qué se oxidó el ferry? Lalo nunca aprendió. Nadie le enseñó. Si alguien le hubiera enseñado…',
      'Por que a balsa enferrujou? O Lalo nunca aprendeu. Ninguém ensinou. Se alguém tivesse ensinado…',
      'Warum ist die Fähre verrostet? Lalo hat es nie gelernt. Niemand hat es ihm beigebracht. Wenn jemand …',
      '[渡船|dù chuán] [为什么|wèi shén me] [生锈|shēng xiù] [了|le] ？ [拉洛|Lā luò] [从来|cóng lái] [没|méi] [学|xué] [过|guo] 。 [没有|méi yǒu] [人|rén] [教|jiāo] [他|tā] 。 [要是|yào shi] [有|yǒu] [人|rén] [教|jiāo] …',
      'フェリー が なぜ さびた か ？ ラロ は [一度|いちど] も [習|なら]わなかった 。 だれ も [教|おし]えなかった 。 もし だれか が …'),
    // today: Bartolo hears the warning, and Lalo comes to learn
    'bartolo.heard': L('Nobody will be able to cross…? Hm. That sounds like something I’d say, with a few more years on me. Lalo! Come here, kid. Starting today, you’re learning the ferry.',
      '¿Nadie podrá cruzar…? Mm. Eso suena a algo que yo diría, con unos años más encima. ¡Lalo! Ven aquí, chico. Desde hoy, aprendes el ferry.',
      'Ninguém vai poder atravessar…? Hum. Isso parece coisa que eu diria, com uns anos a mais. Lalo! Vem cá, garoto. A partir de hoje, você aprende a balsa.',
      'Niemand wird hinüberfahren können …? Hm. Das klingt nach etwas, das ich sagen würde, mit ein paar Jahren mehr. Lalo! Komm her, Junge. Ab heute lernst du die Fähre.',
      '[没有|méi yǒu] [人|rén] [能|néng] [过|guò] [湖|hú] … ？ [嗯|en] 。 [这|zhè] [像|xiàng] [是|shì] [老|lǎo] [了|le] [以后|yǐ hòu] [的|de] [我|wǒ] [会|huì] [说|shuō] [的|de] [话|huà] 。 [拉洛|Lā luò] ！ [过来|guò lai] ， [小|xiǎo] [家伙|jiā huo] 。 [从|cóng] [今天|jīn tiān] [起|qǐ] ， [你|nǐ] [学|xué] [开|kāi] [渡船|dù chuán] 。',
      'だれ も [渡|わた]れない … ？ ふむ 。 [年|とし] を とった おれ が [言|い]い そう な こと だ 。 ラロ ！ こっち へ [来|こ]い 。 [今日|きょう] から 、 フェリー を [習|なら]う ん だ 。'),
    'bartolo.teaching': L('Lalo comes every afternoon now. He steers with his tongue sticking out, but he’s learning. In ten years, he’ll be better than me.',
      'Lalo viene todas las tardes ahora. Lleva el timón con la lengua afuera, pero aprende. En diez años, será mejor que yo.',
      'O Lalo vem toda tarde agora. Ele pilota com a língua de fora, mas está aprendendo. Daqui a dez anos, vai ser melhor que eu.',
      'Lalo kommt jetzt jeden Nachmittag. Er steuert mit herausgestreckter Zunge, aber er lernt. In zehn Jahren ist er besser als ich.',
      '[拉洛|Lā luò] [现在|xiàn zài] [每天|měi tiān] [下午|xià wǔ] [都|dōu] [来|lái] 。 [他|tā] [掌舵|zhǎng duò] [的|de] [时候|shí hou] [吐|tǔ] [着|zhe] [舌头|shé tou] ， [可是|kě shì] [学|xué] [得|de] [很|hěn] [快|kuài] 。 [十|shí] [年|nián] [后|hòu] ， [他|tā] [会|huì] [比|bǐ] [我|wǒ] [还|hái] [好|hǎo] 。',
      'ラロ は [今|いま] 、 [毎日|まいにち] [午後|ごご] に [来|く]る 。 [舌|した] を [出|だ]して かじ を とる が 、 ちゃんと [覚|おぼ]えて る 。 [十年後|じゅうねんご] に は 、 おれ より うまく なる でしょう 。'),
    'lalo.learning': L('Bartolo’s teaching me the ferry! Every afternoon. Tomorrow I’ll steer all the way to the first buoy!',
      '¡Bartolo me enseña el ferry! Todas las tardes. ¡Mañana llevaré el timón hasta la primera boya!',
      'O Bartolo está me ensinando a balsa! Toda tarde. Amanhã eu vou pilotar até a primeira boia!',
      'Bartolo bringt mir die Fähre bei! Jeden Nachmittag. Morgen steuere ich bis zur ersten Boje!',
      '[巴托洛|Bā tuō luò] [在|zài] [教|jiāo] [我|wǒ] [开|kāi] [渡船|dù chuán] ！ [每天|měi tiān] [下午|xià wǔ] 。 [明天|míng tiān] [我|wǒ] [要|yào] [一直|yī zhí] [开|kāi] [到|dào] [第一|dì yī] [个|gè] [浮标|fú biāo] ！',
      'バルトロ さん が フェリー を [教|おし]えて くれる ん だ ！ [毎日|まいにち] [午後|ごご] 。 [明日|あした] は [最初|さいしょ] の ブイ まで 、 かじ を とる [予定|よてい] ！'),
  };
  // ------------------------------------------------------------ the demonstrations (whole in the language, the shown words glossed)
  const DEMO = {
    'd.lalo1': L('Tomorrow I’ll go out early. I’ll make a new raft. I’ll be cold, but I’ll be able to cross the lake. I’ll come every day!',
      'Mañana saldré temprano. Haré una balsa nueva. Tendré frío, pero podré cruzar el lago. ¡Vendré cada día!',
      'Amanhã sairei cedo. Farei uma balsa nova. Terei frio, mas poderei atravessar o lago. Virei todo dia!',
      'Morgen werde ich früh losgehen. Ich werde ein neues Floß bauen. Mir wird kalt sein, aber ich werde über den See kommen. Ich werde jeden Tag kommen!',
      '[明天|míng tiān] [我|wǒ] [要|yào] [早|zǎo] [点|diǎn] [出门|chū mén] 。 [我|wǒ] [打算|dǎ suàn] [做|zuò] [一|yī] [个|gè] [新|xīn] [木筏|mù fá] 。 [会|huì] [很|hěn] [冷|lěng] ， [可是|kě shì] [我|wǒ] [会|huì] [过|guò] [湖|hú] 。 [我|wǒ] [每天|měi tiān] [都|dōu] [会|huì] [来|lái] ！',
      '[明日|あした] は [早|はや]く [出|で]かける [予定|よてい] だ 。 [新|あたら]しい いかだ を [作|つく]る つもり 。 [寒|さむ]い でしょう けど 、 [湖|みずうみ] を [渡|わた]れる でしょう 。 [毎日|まいにち] [来|く]る よ ！'),
    'q.lalo': L('And you? Will you come tomorrow?', '¿Y tú? ¿Vendrás mañana?', 'E você? Virá amanhã?', 'Und du? Wirst du morgen kommen?',
      '[你|nǐ] [呢|ne] ？ [你|nǐ] [明天|míng tiān] [会|huì] [来|lái] [吗|ma] ？', 'きみ は ？ [明日|あした] [来|く]る ？'),
    'd.lalo2': L('Marina says nobody will come. But we’ll all come! Vicente will make boats again. The children will have nets. And the ferry will go out, you’ll see.',
      'Marina dice que nadie vendrá. ¡Pero todos vendremos! Vicente hará barcas otra vez. Los niños tendrán redes. Y el ferry saldrá, ya verás.',
      'A Marina diz que ninguém virá. Mas todos nós viremos! O Vicente fará barcos de novo. As crianças terão redes. E a balsa sairá, você vai ver.',
      'Marina sagt, niemand wird kommen. Aber wir werden alle kommen! Vicente wird wieder Boote bauen. Die Kinder werden Netze haben. Und die Fähre wird fahren, du wirst sehen.',
      '[玛丽娜|Mǎ lì nà] [说|shuō] [没有|méi yǒu] [人|rén] [会|huì] [来|lái] 。 [可是|kě shì] [我们|wǒ men] [都|dōu] [会|huì] [来|lái] ！ [维森特|Wéi sēn tè] [会|huì] [再|zài] [做|zuò] [船|chuán] 。 [孩子|hái zi] [们|men] [会|huì] [有|yǒu] [渔网|yú wǎng] 。 [渡船|dù chuán] [也|yě] [会|huì] [开|kāi] ， [你|nǐ] [等|děng] [着|zhe] [看|kàn] 。',
      'マリーナ さん は 、 だれ も [来|こ]ない と [言|い]う 。 でも 、 みんな [来|く]る でしょう ！ ビセンテ さん は また [船|ふね] を [作|つく]る でしょう 。 [子|こ]ども たち は [網|あみ] を [持|も]つ でしょう 。 フェリー も [出|で]る [予定|よてい] だ 。 [見|み]て て ！'),
    'd.warn': L('Listen, and take it back with you: if nobody teaches Lalo, nobody will be able to cross the lake. The ferry will rust.',
      'Escucha, y llévatelo: si nadie le enseña a Lalo, nadie podrá cruzar el lago. El ferry se oxidará.',
      'Escuta, e leva isso com você: se ninguém ensinar o Lalo, ninguém poderá atravessar o lago. A balsa vai enferrujar.',
      'Hör zu und nimm es mit: Wenn niemand Lalo etwas beibringt, wird niemand über den See fahren können. Die Fähre wird rosten.',
      '[听|tīng] [着|zhe] ， [把|bǎ] [这|zhè] [句|jù] [话|huà] [带|dài] [回去|huí qu] ： [要是|yào shi] [没有|méi yǒu] [人|rén] [教|jiāo] [拉洛|Lā luò] ， [就|jiù] [没有|méi yǒu] [人|rén] [能|néng] [过|guò] [湖|hú] 。 [渡船|dù chuán] [会|huì] [生锈|shēng xiù] 。',
      'よく [聞|き]いて 、 [持|も]って [帰|かえ]って くれ 。 だれ も ラロ に [教|おし]えなければ 、 だれ も [湖|みずうみ] を [渡|わた]れない でしょう 。 フェリー は さびる でしょう 。'),
    'd.party': L('Lalo will bring the boats. Delia will put up the lanterns. And I’ll make the soup!',
      'Lalo traerá las barcas. Delia pondrá los faroles. ¡Y yo haré la sopa!',
      'O Lalo trará os barcos. A Delia porá as lanternas. E eu farei a sopa!',
      'Lalo wird die Boote bringen. Delia wird die Laternen aufhängen. Und ich werde die Suppe kochen!',
      '[拉洛|Lā luò] [会|huì] [带|dài] [船|chuán] [来|lái] 。 [黛莉亚|Dài lì yà] [要|yào] [挂|guà] [灯笼|dēng long] 。 [我|wǒ] [打算|dǎ suàn] [做|zuò] [汤|tāng] ！',
      'ラロ は [船|ふね] を [持|も]って [来|く]る でしょう 。 デリア さん は ちょうちん を つける [予定|よてい] 。 わたし は スープ を [作|つく]る つもり ！'),
    'q.party1': L('Will you come to the party?', '¿Vendrás a la fiesta?', 'Você virá à festa?', 'Wirst du zum Fest kommen?', '[你|nǐ] [会|huì] [来|lái] [晚会|wǎn huì] [吗|ma] ？', 'お[祭|まつ]り に [来|く]る [予定|よてい] ？'),
    'q.party2': L('And what will you do there?', '¿Y qué harás allí?', 'E o que você fará lá?', 'Und was wirst du dort machen?', '[你|nǐ] [打算|dǎ suàn] [做|zuò] [什么|shén me] ？', 'そこ で [何|なに] を する つもり ？'),
    // Lalo in the drowned grotto: he follows you in, and asks what you will do, room by room
    'd.f0': L('I came after you! It smells of old mud in here. I won’t be scared: I’ll have my lamp.',
      '¡Vine detrás de ti! Aquí huele a barro viejo. Yo no tendré miedo: tendré mi lámpara.',
      'Eu vim atrás de você! Aqui tem cheiro de lama velha. Eu não terei medo: terei a minha lanterna.',
      'Ich bin dir nachgekommen! Hier riecht es nach altem Schlamm. Ich werde keine Angst haben: Ich werde meine Lampe haben.',
      '[我|wǒ] [跟|gēn] [着|zhe] [你|nǐ] [来|lái] [了|le] ！ [这里|zhè lǐ] [一|yī] [股|gǔ] [老|lǎo] [泥|ní] [味|wèi] 。 [我|wǒ] [不会|bù huì] [害怕|hài pà] ： [我|wǒ] [会|huì] [拿|ná] [着|zhe] [灯|dēng] 。',
      'おれ も [来|き]た ！ [古|ふる]い [泥|どろ] の におい が する 。 [怖|こわ]く ない でしょう 。 ランプ を [持|も]って [行|い]く つもり だ 。'),
    'd.f1': L('This is the old rowboat that sank. The hatch is shut from inside. I won’t fit through that little window, but {mimo} will be able to.',
      'Esta es la barca vieja que se hundió. La escotilla está cerrada por dentro. Yo no podré pasar por esa ventanita, pero {mimo} podrá.',
      'Este é o barco velho que afundou. A escotilha está fechada por dentro. Eu não poderei passar por aquela janelinha, mas o {mimo} poderá.',
      'Das ist das alte Ruderboot, das gesunken ist. Die Luke ist von innen zu. Ich werde nicht durch das kleine Fenster passen, aber {mimo} wird es schaffen.',
      '[这|zhè] [是|shì] [那|nà] [条|tiáo] [沉|chén] [了|le] [的|de] [旧|jiù] [小船|xiǎo chuán] 。 [舱门|cāng mén] [从|cóng] [里面|lǐ miàn] [关|guān] [着|zhe] 。 [我|wǒ] [钻|zuān] [不|bù] [过|guò] [那|nà] [个|gè] [小|xiǎo] [窗户|chuāng hu] ， [可是|kě shì] {mimo} [会|huì] [过去|guò qu] [的|de] 。',
      'これ は [沈|しず]んだ [古|ふる]い ボート だ 。 ハッチ は [中|なか] から [閉|し]まって いる 。 おれ は あの [小|ちい]さな [窓|まど] を [通|とお]れない でしょう 。 でも {mimo} なら [通|とお]れる でしょう 。'),
    'd.f2': L('The pool is too deep. {mimo} will make a bridge of the dry reeds, right? And when we find the boy’s voice, I’ll say his name, really loud.',
      'El estanque es muy hondo. {mimo} hará un puente con los juncos secos, ¿verdad? Y cuando encontremos la voz del niño, yo diré su nombre muy alto.',
      'O lago aqui é fundo demais. O {mimo} fará uma ponte com os juncos secos, né? E quando a gente achar a voz do menino, eu direi o nome dele bem alto.',
      'Der Teich ist zu tief. {mimo} wird eine Brücke aus dem trockenen Schilf bauen, oder? Und wenn wir die Stimme des Jungen finden, werde ich seinen Namen ganz laut sagen.',
      '[水池|shuǐ chí] [太|tài] [深|shēn] [了|le] 。 {mimo} [会|huì] [用|yòng] [干|gān] [芦苇|lú wěi] [搭|dā] [一|yī] [座|zuò] [桥|qiáo] ， [对|duì] [吧|ba] ？ [找到|zhǎo dào] [男孩|nán hái] [的|de] [声音|shēng yīn] [以后|yǐ hòu] ， [我|wǒ] [会|huì] [大声|dà shēng] [说|shuō] [他|tā] [的|de] [名字|míng zi] 。',
      'この [池|いけ] は [深|ふか]すぎる 。 {mimo} が [枯|か]れた [葦|あし] で [橋|はし] を [作|つく]る でしょう ？ あの [子|こ] の [声|こえ] が [見|み]つかったら 、 おれ は [大|おお]きな [声|こえ] で [名前|なまえ] を [言|い]う つもり だ 。'),
    'd.f3': L('Is that… the old Frog King? He went gray. He croaks about tomorrow as if it were already lost.',
      '¿Ese es… el viejo Rey Sapo? Se volvió gris. Croa sobre el mañana como si ya estuviera perdido.',
      'Aquele é… o velho Rei Sapo? Ficou cinza. Ele coaxa sobre o amanhã como se já estivesse perdido.',
      'Ist das … der alte Froschkönig? Er ist grau geworden. Er quakt über das Morgen, als wäre es schon verloren.',
      '[那|nà] [是|shì] … [老|lǎo] [蛙王|wā wáng] [吗|ma] ？ [他|tā] [变|biàn] [灰|huī] [了|le] 。 [他|tā] [说|shuō] [起|qǐ] [明天|míng tiān] ， [好像|hǎo xiàng] [明天|míng tiān] [已经|yǐ jīng] [没有|méi yǒu] [了|le] 。',
      'あれ は … [年|とし] を とった カエル の [王様|おうさま] ？ [灰色|はいいろ] に なった 。 [明日|あした] なんて もう ない みたい に 、 [明日|あした] の こと を [鳴|な]いて いる 。'),
  };
  const MARKS = {
    'd.lalo1': { es: [['saldré', 'I’ll go out'], ['Haré', 'I’ll make'], ['Tendré', 'I’ll have'], ['podré', 'I’ll be able'], ['Vendré', 'I’ll come']], pt: [['sairei', 'I’ll go out'], ['Farei', 'I’ll make'], ['Terei', 'I’ll have'], ['poderei', 'I’ll be able'], ['Virei', 'I’ll come']],
      de: [['werde', 'will'], ['losgehen', 'go out'], ['bauen', 'build'], ['kommen', 'come']], zh: [['[要|yào]', 'going to'], ['[打算|dǎ suàn]', 'plan to'], ['[会|huì]', 'will']], ja: [['[予定|よてい]', 'plan'], ['つもり', 'intend to'], ['でしょう', '(it) will, probably']] },
    'q.lalo': { es: [['Vendrás', 'will you come']], pt: [['Virá', 'will (you) come']], de: [['Wirst du', 'will you'], ['kommen', 'come']], zh: [['[会|huì] [来|lái]', 'will come']], ja: [['[来|く]る', 'come']] },
    'd.lalo2': { es: [['vendrá', 'will come'], ['vendremos', 'we’ll come'], ['hará', 'will make'], ['tendrán', 'they’ll have'], ['saldrá', 'will go out']], pt: [['virá', 'will come'], ['viremos', 'we’ll come'], ['fará', 'will make'], ['terão', 'they’ll have'], ['sairá', 'will go out']],
      de: [['wird', 'will'], ['werden', 'will'], ['bauen', 'build'], ['haben', 'have'], ['fahren', 'go (by boat)']], zh: [['[会|huì] [来|lái]', 'will come'], ['[会|huì] [再|zài] [做|zuò]', 'will make again'], ['[会|huì] [有|yǒu]', 'will have'], ['[会|huì] [开|kāi]', 'will go']],
      ja: [['[来|く]る でしょう', 'will come'], ['[作|つく]る でしょう', 'will make'], ['[持|も]つ でしょう', 'will have'], ['[出|で]る [予定|よてい]', 'is due to go out']] },
    'd.warn': { es: [['si nadie', 'if nobody'], ['enseña', 'teaches'], ['podrá', 'will be able'], ['se oxidará', 'will rust']], pt: [['se ninguém', 'if nobody'], ['ensinar', 'teaches'], ['poderá', 'will be able'], ['enferrujar', 'rust']],
      de: [['Wenn niemand', 'if nobody'], ['beibringt', 'teaches'], ['können', 'be able'], ['rosten', 'rust']], zh: [['[要是|yào shi]', 'if'], ['[教|jiāo]', 'teach'], ['[能|néng]', 'can'], ['[生锈|shēng xiù]', 'rust']], ja: [['[教|おし]えなければ', 'if (nobody) teaches'], ['[渡|わた]れない でしょう', 'won’t be able to cross'], ['さびる', 'rust']] },
    'd.party': { es: [['traerá', 'will bring'], ['pondrá', 'will put'], ['haré', 'I’ll make']], pt: [['trará', 'will bring'], ['porá', 'will put'], ['farei', 'I’ll make']], de: [['wird', 'will'], ['bringen', 'bring'], ['aufhängen', 'hang up'], ['kochen', 'cook']],
      zh: [['[会|huì] [带|dài]', 'will bring'], ['[要|yào] [挂|guà]', 'is going to hang'], ['[打算|dǎ suàn] [做|zuò]', 'plan to make']], ja: [['[持|も]って [来|く]る でしょう', 'will bring'], ['つける [予定|よてい]', 'is to put up'], ['[作|つく]る つもり', 'intend to make']] },
    'q.party1': { es: [['Vendrás', 'will you come']], pt: [['virá', 'will (you) come']], de: [['Wirst du', 'will you'], ['kommen', 'come']], zh: [['[会|huì] [来|lái]', 'will come']], ja: [['[来|く]る [予定|よてい]', 'plan to come']] },
    'q.party2': { es: [['harás', 'will you do']], pt: [['fará', 'will (you) do']], de: [['wirst du', 'will you'], ['machen', 'do']], zh: [['[打算|dǎ suàn] [做|zuò]', 'plan to do']], ja: [['する つもり', 'intend to do']] },
    'd.f0': { es: [['tendré', 'I’ll have'], ['miedo', 'fear'], ['lámpara', 'lamp']], pt: [['terei', 'I’ll have'], ['medo', 'fear'], ['lanterna', 'lamp']], de: [['werde', 'will'], ['Angst haben', 'be scared'], ['Lampe', 'lamp']], zh: [['[不会|bù huì] [害怕|hài pà]', 'won’t be scared'], ['[灯|dēng]', 'lamp']], ja: [['[怖|こわ]く ない でしょう', 'won’t be scary'], ['ランプ', 'lamp']] },
    'd.f1': { es: [['podré', 'I’ll be able'], ['podrá', 'will be able'], ['escotilla', 'hatch'], ['ventanita', 'little window']], pt: [['poderei', 'I’ll be able'], ['poderá', 'will be able'], ['escotilha', 'hatch'], ['janelinha', 'little window']],
      de: [['werde', 'will'], ['schaffen', 'manage'], ['Luke', 'hatch'], ['Fenster', 'window']], zh: [['[会|huì] [过去|guò qu]', 'will get through'], ['[舱门|cāng mén]', 'hatch'], ['[窗户|chuāng hu]', 'window']], ja: [['[通|とお]れる でしょう', 'will get through'], ['ハッチ', 'hatch'], ['[窓|まど]', 'window']] },
    'd.f2': { es: [['hará', 'will make'], ['puente', 'bridge'], ['diré', 'I’ll say']], pt: [['fará', 'will make'], ['ponte', 'bridge'], ['direi', 'I’ll say']], de: [['wird', 'will'], ['Brücke', 'bridge'], ['sagen', 'say']], zh: [['[会|huì] [搭|dā]', 'will build'], ['[桥|qiáo]', 'bridge'], ['[会|huì] [说|shuō]', 'will say']], ja: [['[作|つく]る でしょう', 'will make'], ['[橋|はし]', 'bridge'], ['[言|い]う つもり', 'intend to say']] },
    'd.f3': { es: [['viejo', 'old'], ['gris', 'gray'], ['perdido', 'lost']], pt: [['velho', 'old'], ['cinza', 'gray'], ['perdido', 'lost']], de: [['alte', 'old'], ['grau', 'gray'], ['verloren', 'lost']], zh: [['[老|lǎo]', 'old'], ['[灰|huī]', 'gray']], ja: [['[灰色|はいいろ]', 'gray']] },
  };
  // ------------------------------------------------------------ the pattern cards: the irregular future; {mimo}'s plans
  const CARDS = {
    fut: { tag: 'The future, irregular: I · you · he / she',
      es: { ex: [['tendré · tendrás · tendrá', 'will have'], ['haré · harás · hará', 'will do, make'], ['podré · podrás · podrá', 'will be able'], ['saldré · saldrás · saldrá', 'will go out'], ['vendré · vendrás · vendrá', 'will come'], ['diré · dirás · dirá', 'will say'], ['vendremos · tendrán', 'we’ll come · they’ll have']],
        note: 'The endings stay (-é, -ás, -á, -emos, -án), but these verbs change the front: tener → tendr-, hacer → har-, poder → podr-, salir → saldr-, venir → vendr-, decir → dir-, poner → pondr-. «Ir a» + the verb works too.' },
      pt: { ex: [['farei · fará · faremos', 'will do, make'], ['direi · dirá · diremos', 'will say'], ['trarei · trará · trarão', 'will bring'], ['terei · poderei · sairei', 'will have · be able · go out'], ['virei · virá · viremos', 'will come']],
        note: 'The futuro do presente: the whole verb + -ei, -á, -emos, -ão. Three are irregular: fazer → far-, dizer → dir-, trazer → trar-. In speech, «vou fazer» is fine too.' },
      de: { ex: [['ich werde kommen', 'I’ll come'], ['du wirst bauen', 'you’ll build'], ['sie wird fahren', 'it (the ferry) will go'], ['wir werden kommen', 'we’ll come'], ['sie werden haben', 'they’ll have']],
        note: '«werden» + the infinitive at the very end. werden: ich werde, du wirst, er / sie / es wird, wir werden, ihr werdet, sie werden.' },
      zh: { ex: [['[我|wǒ] [会|huì] [来|lái]', 'I will come (a promise)'], ['[我|wǒ] [要|yào] [去|qù]', 'I’m going to go (a plan)'], ['[我|wǒ] [打算|dǎ suàn] [做|zuò]', 'I plan to make'], ['[渡船|dù chuán] [会|huì] [开|kāi]', 'the ferry will go']],
        note: '会 + verb: it will happen (a promise, a guess). 要 + verb: you’re about to, or you want to. 打算 + verb: you plan to. Promises to the frozen take 会.' },
      ja: { ex: [['[来|く]る [予定|よてい] です', 'is due to come (a plan)'], ['[作|つく]る つもり です', 'intend to make'], ['[来|く]る でしょう', 'will come, probably (a guess)'], ['[出|で]る でしょう', 'will go out, probably']],
        note: 'Plans: the plain verb + 予定です or つもりです. Guesses about tomorrow: + でしょう. A promise to the frozen can take either.' } },
    plan: { tag: 'Plans with irregular futures',
      es: { ex: [['pondrá…', 'will put'], ['saldrá…', 'will go out'], ['hará…', 'will make']], note: 'In the Future, Mimo follows plans (he / she / it): «pondrá…», «saldrá…», «hará…». «Va a…» works too.' },
      pt: { ex: [['porá…', 'will put'], ['sairá…', 'will go out'], ['fará…', 'will make']], note: '«O Mimo porá…», «sairá…», «fará…», or «vai pôr…».' },
      de: { ex: [['wird … legen', 'will lay'], ['wird … klettern', 'will climb'], ['wird … bauen', 'will build']], note: '«Mimo wird» + the infinitive at the end.' },
      zh: { ex: [['[会|huì] [放|fàng]', 'will put'], ['[要|yào] [出去|chū qu]', 'is going out'], ['[打算|dǎ suàn] [搭|dā]', 'plans to build']], note: 'Mimo + 会 / 要 / 打算 + the verb.' },
      ja: { ex: [['[置|お]く [予定|よてい]', 'is to put'], ['[出|で]る つもり', 'intends to go out'], ['[作|つく]る つもり', 'intends to make']], note: 'Mimo が … + 予定 or つもり.' } },
  };
  const TIPS = {
    pres: { es: 'That’s today. Tomorrow needs tomorrow’s words: «{form}».', pt: 'That’s today. Tomorrow needs tomorrow’s words: «{form}».', de: 'That’s today. Tomorrow: «werden» + the verb at the end, «{form}».',
      zh: 'That’s today: 会 / 要 / 打算 before the verb, «{form}».', ja: 'That’s today: a plan or a guess, «{form}».' },
    past: { es: 'That’s yesterday! Tomorrow’s words: «{form}».', pt: 'That’s yesterday! Tomorrow’s words: «{form}».', de: 'That’s yesterday! Tomorrow’s words: «{form}».', zh: 'That’s yesterday (了)! «{form}».', ja: 'That’s yesterday (～た)! «{form}».' },
    alt: { es: '«ir a» works too! Tomorrow’s own words: «{form}».', pt: '«vou» + the verb works too! The futuro do presente: «{form}».' },
    person: { es: 'Mind who: «{form}».', pt: 'Mind who: «{form}».', de: 'Mind who: «{form}».', zh: '«{form}»', ja: '«{form}»' },
    more: { es: 'Right! The whole sentence for an S: «{form}».', pt: 'Right! The whole sentence for an S: «{form}».', de: 'Right! The whole sentence for an S: «{form}».', zh: 'Right! Say who, too: «{form}».', ja: 'Right! The whole sentence for an S: «{form}».' },
  };
  // ------------------------------------------------------------ the tasks (MOLT.grade): want (tomorrow's own words: S), alt («ir a» / «vou»:
  // A), person (B), past ("That's yesterday!") and pres ("That's today"): say it again. zh / ja in the notation.
  const T = o => o;
  const F = (title, fr, ch, model, want, x = {}) => T(Object.assign({ title, frame: fr, chips: ch, model, want }, x));
  const TASKS = {
    come: F('{lalo} asks if you’ll come tomorrow. Promise, about yourself.',
      { es: 'Sí, ___ mañana.', pt: 'Sim, ___ amanhã.', de: 'Ja, ich werde morgen ___.', zh: '[我|wǒ] [明天|míng tiān] ___ 。', ja: 'うん 、 [明日|あした] ___ 。' },
      { es: [['vendré', 'I’ll come']], pt: [['virei', 'I’ll come']], de: [['kommen', 'come']], zh: [['[会|huì] [来|lái]', 'will come']], ja: [['[来|く]る [予定|よてい]', 'plan to come']] },
      L('Yes, I’ll come tomorrow.', 'Sí, vendré mañana.', 'Sim, virei amanhã.', 'Ja, ich werde morgen kommen.', '[我|wǒ] [明天|míng tiān] [会|huì] [来|lái] 。', 'うん 、 [明日|あした] [来|く]る [予定|よてい] 。'),
      { es: ['vendré'], pt: ['virei'], de: [['werde', 'kommen']], zh: [['[会|huì]', '[来|lái]'], ['[要|yào]', '[来|lái]']], ja: [['[来|く]る', '[予定|よてい]'], ['[来|く]る', 'つもり'], ['[来|く]る', 'でしょう']] },
      { alt: { es: [['voy', 'venir']], pt: [['vou', 'vir']], ja: ['[来|き]ます'] }, person: { es: ['vendrá', 'vendrás'], pt: ['virá'], de: [['wird', 'kommen'], ['wirst', 'kommen']] },
        past: { es: ['vine', 'vino'], pt: ['vim', 'veio'], de: [['bin', 'gekommen'], 'kam'], zh: [['[来|lái]', '[了|le]']], ja: ['[来|き]た', '[来|き]ました'] },
        pres: { es: ['vengo', 'viene'], pt: ['venho', 'vem'], de: ['komme', 'kommt'], zh: ['[来|lái]'], ja: ['[来|く]る'] }, more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
    marina: F('Marina is frozen: «nobody will come». Promise her: we’ll all come.',
      { es: '¡___ todos!', pt: '___ todos!', de: 'Wir werden alle ___!', zh: '[我们|wǒ men] [都|dōu] ___ ！', ja: 'みんな ___ ！' },
      { es: [['Vendremos', 'we’ll come']], pt: [['Viremos', 'we’ll come']], de: [['kommen', 'come']], zh: [['[会|huì] [来|lái]', 'will come']], ja: [['[来|く]る でしょう', 'will come']] },
      L('We’ll all come!', '¡Vendremos todos!', 'Viremos todos!', 'Wir werden alle kommen!', '[我们|wǒ men] [都|dōu] [会|huì] [来|lái] ！', 'みんな [来|く]る でしょう ！'),
      { es: ['vendremos'], pt: ['viremos'], de: [['werden', 'kommen']], zh: [['[会|huì]', '[来|lái]']], ja: [['[来|く]る', 'でしょう'], ['[来|く]る', '[予定|よてい]']] },
      { alt: { es: [['vamos', 'venir']], pt: [['vamos', 'vir']], ja: ['[来|き]ます'] }, person: { es: ['vendrán', 'vendrá', 'vendré'], pt: ['virão', 'virá', 'virei'], de: [['wird', 'kommen'], ['werde', 'kommen']] },
        past: { es: ['vinimos'], pt: ['viemos'], de: [['sind', 'gekommen']], zh: [['[来|lái]', '[了|le]']], ja: ['[来|き]た'] }, pres: { es: ['venimos', 'vienen'], pt: ['vem'], de: [['wir', 'kommen']], zh: ['[来|lái]'], ja: ['[来|く]る'] }, more: { de: ['wir'], zh: ['[我们|wǒ men]'] } }),
    vicente: F('Vicente is frozen: «I won’t make boats». Promise him what he’ll do.',
      { es: '___ una barca nueva.', pt: 'Você ___ um barco novo.', de: 'Du ___ ein neues Boot bauen.', zh: '[你|nǐ] ___ [新|xīn] [船|chuán] 。', ja: '[新|あたら]しい [船|ふね] を ___ 。' },
      { es: [['Harás', 'you’ll make']], pt: [['fará', 'will make']], de: [['wirst', 'will']], zh: [['[会|huì] [做|zuò]', 'will make']], ja: [['[作|つく]る でしょう', 'will make']] },
      L('You’ll make a new boat.', 'Harás una barca nueva.', 'Você fará um barco novo.', 'Du wirst ein neues Boot bauen.', '[你|nǐ] [会|huì] [做|zuò] [新|xīn] [船|chuán] 。', '[新|あたら]しい [船|ふね] を [作|つく]る でしょう 。'),
      { es: ['harás'], pt: ['fará'], de: [['wirst', 'bauen']], zh: [['[会|huì]', '[做|zuò]']], ja: [['[作|つく]る', 'でしょう'], ['[作|つく]る', 'つもり']] },
      { alt: { es: [['vas', 'hacer']], pt: [['vai', 'fazer']], ja: ['[作|つく]ります'] }, person: { es: ['haré', 'hará'], pt: ['farei'], de: [['werde', 'bauen'], ['wird', 'bauen']] },
        past: { es: ['hiciste', 'hice'], pt: ['fez', 'fiz'], de: [['hast', 'gebaut']], zh: [['[做|zuò]', '[了|le]']], ja: ['[作|つく]った'] }, pres: { es: ['haces', 'hace', 'hacer'], pt: ['faz'], de: ['baust'], zh: ['[做|zuò]'], ja: ['[作|つく]る'] }, more: { es: ['barca'], pt: ['barco'], de: ['boot'] } }),
    delia: F('Delia is frozen: «the children won’t have nets». Promise her what they’ll have.',
      { es: 'Los niños ___ redes nuevas.', pt: 'As crianças ___ redes novas.', de: 'Die Kinder ___ neue Netze haben.', zh: '[孩子|hái zi] [们|men] ___ [新|xīn] [渔网|yú wǎng] 。', ja: '[子|こ]ども たち は [新|あたら]しい [網|あみ] を ___ 。' },
      { es: [['tendrán', 'they’ll have']], pt: [['terão', 'they’ll have']], de: [['werden', 'will']], zh: [['[会|huì] [有|yǒu]', 'will have']], ja: [['[持|も]つ でしょう', 'will have']] },
      L('The children will have new nets.', 'Los niños tendrán redes nuevas.', 'As crianças terão redes novas.', 'Die Kinder werden neue Netze haben.', '[孩子|hái zi] [们|men] [会|huì] [有|yǒu] [新|xīn] [渔网|yú wǎng] 。', '[子|こ]ども たち は [新|あたら]しい [網|あみ] を [持|も]つ でしょう 。'),
      { es: ['tendrán'], pt: ['terão'], de: [['werden', 'haben']], zh: [['[会|huì]', '[有|yǒu]']], ja: [['[持|も]つ', 'でしょう'], ['[持|も]つ', '[予定|よてい]']] },
      { alt: { es: [['van', 'tener']], pt: [['vão', 'ter']] }, person: { es: ['tendrá', 'tendré', 'tendremos'], pt: ['terá'], de: [['wird', 'haben']] },
        past: { es: ['tuvieron'], pt: ['tiveram'], de: ['hatten'], zh: [['[有|yǒu]', '[了|le]']], ja: ['[持|も]った'] }, pres: { es: ['tienen'], pt: ['têm'], de: ['haben'], zh: ['[有|yǒu]'], ja: ['[持|も]つ'] }, more: { es: ['redes'], pt: ['redes'], de: ['netze'] } }),
    bartolo: F('Old Bartolo is frozen: «the ferry won’t go out». Promise him what it will do.',
      { es: 'El ferry ___ mañana.', pt: 'A balsa ___ amanhã.', de: 'Die Fähre ___ morgen fahren.', zh: '[渡船|dù chuán] [明天|míng tiān] ___ 。', ja: 'フェリー は [明日|あした] ___ 。' },
      { es: [['saldrá', 'will go out']], pt: [['sairá', 'will go out']], de: [['wird', 'will']], zh: [['[会|huì] [开|kāi]', 'will go']], ja: [['[出|で]る [予定|よてい] です', 'is due to go out']] },
      L('The ferry will go out tomorrow.', 'El ferry saldrá mañana.', 'A balsa sairá amanhã.', 'Die Fähre wird morgen fahren.', '[渡船|dù chuán] [明天|míng tiān] [会|huì] [开|kāi] 。', 'フェリー は [明日|あした] [出|で]る [予定|よてい] です 。'),
      { es: ['saldrá'], pt: ['sairá'], de: [['wird', 'fahren']], zh: [['[会|huì]', '[开|kāi]']], ja: [['[出|で]る', '[予定|よてい]'], ['[出|で]る', 'でしょう']] },
      { alt: { es: [['va', 'salir']], pt: [['vai', 'sair']], ja: ['[出|で]ます'] }, person: { es: ['saldré', 'saldrás'], pt: ['sairei'], de: [['werde', 'fahren']] },
        past: { es: ['salió'], pt: ['saiu'], de: [['ist', 'gefahren'], 'fuhr'], zh: [['[开|kāi]', '[了|le]']], ja: ['[出|で]た'] }, pres: { es: ['sale'], pt: ['sai'], de: ['fährt'], zh: ['[开|kāi]'], ja: ['[出|で]る'] }, more: { es: ['ferry'], pt: ['balsa'], de: ['fähre'] } }),
    lucho: F('Lucho is frozen by his paper boat. Promise him: you’ll go sailing.',
      { es: '___ a navegar.', pt: 'Você ___ pra navegar.', de: 'Du ___ segeln gehen.', zh: '[你|nǐ] ___ [去|qù] [划船|huá chuán] 。', ja: '[船|ふね] に ___ 。' },
      { es: [['Saldrás', 'you’ll go out']], pt: [['sairá', 'will go out']], de: [['wirst', 'will']], zh: [['[会|huì]', 'will']], ja: [['[乗|の]る でしょう', 'will ride']] },
      L('You’ll go sailing.', 'Saldrás a navegar.', 'Você sairá pra navegar.', 'Du wirst segeln gehen.', '[你|nǐ] [会|huì] [去|qù] [划船|huá chuán] 。', '[船|ふね] に [乗|の]る でしょう 。'),
      { es: ['saldrás'], pt: ['sairá'], de: [['wirst', 'gehen']], zh: [['[会|huì]', '[去|qù]']], ja: [['[乗|の]る', 'でしょう'], ['[乗|の]る', '[予定|よてい]']] },
      { alt: { es: [['vas', 'salir']], pt: [['vai', 'sair']] }, past: { es: ['saliste'], pt: ['saiu'], de: [['bist', 'gegangen']], zh: [['[去|qù]', '[了|le]']], ja: ['[乗|の]った'] }, pres: { es: ['sales'], pt: ['sai'], de: ['gehst'], zh: ['[去|qù]'], ja: ['[乗|の]る'] } }),
    pepe: F('Old Pepe is frozen: «I won’t fish». Promise him what he’ll have.',
      { es: '___ muchos peces.', pt: 'Você ___ muitos peixes.', de: 'Du ___ viele Fische fangen.', zh: '[你|nǐ] ___ [很多|hěn duō] [鱼|yú] 。', ja: '[魚|さかな] が たくさん ___ 。' },
      { es: [['Tendrás', 'you’ll have']], pt: [['terá', 'will have']], de: [['wirst', 'will']], zh: [['[会|huì] [有|yǒu]', 'will have']], ja: [['[釣|つ]れる でしょう', 'will bite']] },
      L('You’ll have lots of fish.', 'Tendrás muchos peces.', 'Você terá muitos peixes.', 'Du wirst viele Fische fangen.', '[你|nǐ] [会|huì] [有|yǒu] [很多|hěn duō] [鱼|yú] 。', '[魚|さかな] が たくさん [釣|つ]れる でしょう 。'),
      { es: ['tendrás'], pt: ['terá'], de: [['wirst', 'fangen']], zh: [['[会|huì]', '[有|yǒu]']], ja: [['[釣|つ]れる', 'でしょう']] },
      { alt: { es: [['vas', 'tener']], pt: [['vai', 'ter']] }, past: { es: ['tuviste'], pt: ['teve'], de: [['hast', 'gefangen']], zh: [['[有|yǒu]', '[了|le]']], ja: ['[釣|つ]れた'] }, pres: { es: ['tienes'], pt: ['tem'], de: ['fängst'], zh: ['[有|yǒu]'], ja: ['[釣|つ]れる'] } }),
    warn: F('Read old Bartolo’s warning from tomorrow to today’s Bartolo, word for word.',
      { es: 'Si nadie le enseña a Lalo, nadie ___ cruzar el lago.', pt: 'Se ninguém ensinar o Lalo, ninguém ___ atravessar o lago.', de: 'Wenn niemand Lalo etwas beibringt, wird niemand über den See fahren ___.', zh: '[要是|yào shi] [没有|méi yǒu] [人|rén] [教|jiāo] [拉洛|Lā luò] ， [就|jiù] [没有|méi yǒu] [人|rén] ___ [过|guò] [湖|hú] 。', ja: 'だれ も ラロ に [教|おし]えなければ 、 だれ も [湖|みずうみ] を ___ 。' },
      { es: [['podrá', 'will be able']], pt: [['poderá', 'will be able']], de: [['können', 'be able']], zh: [['[能|néng]', 'can']], ja: [['[渡|わた]れない でしょう', 'won’t be able to cross']] },
      L('If nobody teaches Lalo, nobody will be able to cross the lake.', 'Si nadie le enseña a Lalo, nadie podrá cruzar el lago.', 'Se ninguém ensinar o Lalo, ninguém poderá atravessar o lago.', 'Wenn niemand Lalo etwas beibringt, wird niemand über den See fahren können.',
        '[要是|yào shi] [没有|méi yǒu] [人|rén] [教|jiāo] [拉洛|Lā luò] ， [就|jiù] [没有|méi yǒu] [人|rén] [能|néng] [过|guò] [湖|hú] 。', 'だれ も ラロ に [教|おし]えなければ 、 だれ も [湖|みずうみ] を [渡|わた]れない でしょう 。'),
      { es: ['podrá'], pt: ['poderá'], de: [['wird', 'können']], zh: [['[能|néng]', '[过|guò]']], ja: [['[渡|わた]れない', 'でしょう']] },
      { alt: { es: [['va', 'poder']], pt: [['vai', 'poder']] }, past: { es: ['pudo'], pt: ['pôde'], de: ['konnte'], ja: ['[渡|わた]れなかった'] }, pres: { es: ['puede'], pt: ['pode'], de: ['kann'], ja: ['[渡|わた]れない'] }, more: { es: ['lalo'], pt: ['lalo'], de: ['lalo'] } }),
    party1: F('Marina asks if you’ll come to the lake party. Promise, about yourself.',
      { es: 'Sí, ___ a la fiesta.', pt: 'Sim, ___ à festa.', de: 'Ja, ich werde zum Fest ___.', zh: '[我|wǒ] ___ 。', ja: 'うん 、 お[祭|まつ]り に ___ 。' },
      { es: [['vendré', 'I’ll come']], pt: [['virei', 'I’ll come']], de: [['kommen', 'come']], zh: [['[会|huì] [来|lái]', 'will come']], ja: [['[来|く]る [予定|よてい]', 'plan to come']] },
      L('Yes, I’ll come to the party.', 'Sí, vendré a la fiesta.', 'Sim, virei à festa.', 'Ja, ich werde zum Fest kommen.', '[我|wǒ] [会|huì] [来|lái] 。', 'うん 、 お[祭|まつ]り に [来|く]る [予定|よてい] 。'),
      { es: ['vendré'], pt: ['virei'], de: [['werde', 'kommen']], zh: [['[会|huì]', '[来|lái]']], ja: [['[来|く]る', '[予定|よてい]'], ['[来|く]る', 'つもり'], ['[行|い]く', '[予定|よてい]'], ['[行|い]く', 'つもり']] },
      { alt: { es: [['voy', 'venir'], ['voy', 'ir']], pt: [['vou', 'vir'], ['vou', 'ir']], ja: ['[来|き]ます', '[行|い]きます'] }, past: { es: ['vine'], pt: ['vim'], de: [['bin', 'gekommen']], zh: [['[来|lái]', '[了|le]']], ja: ['[来|き]た'] },
        pres: { es: ['vengo'], pt: ['venho'], de: ['komme'], zh: ['[来|lái]'], ja: ['[来|く]る'] }, more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
    party2: F('Marina asks what you’ll do at the party. Say it in tomorrow’s words.',
      { es: '___ la música.', pt: '___ a música.', de: 'Ich werde Musik ___.', zh: '[我|wǒ] ___ [唱歌|chàng gē] 。', ja: '[歌|うた]う ___ 。' },
      { es: [['Haré', 'I’ll make'], ['Pondré', 'I’ll put on']], pt: [['Farei', 'I’ll make']], de: [['machen', 'make']], zh: [['[打算|dǎ suàn]', 'plan to']], ja: [['つもり', 'intend to']] },
      L('I’ll make the music.', 'Haré la música.', 'Farei a música.', 'Ich werde Musik machen.', '[我|wǒ] [打算|dǎ suàn] [唱歌|chàng gē] 。', '[歌|うた]う つもり 。', { en_zh: 'I plan to sing.', en_ja: 'I intend to sing.' }),
      { es: ['haré', 'pondré', 'traeré', 'diré', 'tocaré', 'cantaré', 'bailaré'], pt: ['farei', 'trarei', 'direi', 'porei', 'tocarei', 'cantarei', 'dançarei'], de: [['werde', 'machen'], ['werde', 'spielen'], ['werde', 'singen'], ['werde', 'tanzen'], ['werde', 'bringen']], zh: ['[打算|dǎ suàn]', '[要|yào]', '[会|huì]'], ja: ['つもり', '[予定|よてい]'] },
      { alt: { es: [['voy', 'a']], pt: ['vou'] }, past: { es: ['hice', 'puse', 'toqué', 'canté'], pt: ['fiz', 'pus', 'toquei', 'cantei'], de: [['habe', 'gemacht'], ['habe', 'gespielt']], zh: ['[了|le]'], ja: ['[歌|うた]った', '[踊|おど]った'] },
        pres: { es: ['hago', 'pongo', 'toco', 'canto', 'bailo'], pt: ['faço', 'ponho', 'toco', 'canto', 'danço'], de: ['mache', 'spiele', 'singe', 'tanze'] } }),
    // Lalo's questions in the drowned grotto (each language its own: SEALQ)
    fear: F('{lalo} asks you something. Answer about yourself, in tomorrow’s words.',
      { es: 'No, no ___ miedo.', pt: 'Não, não ___ medo.', de: 'Nein, ich ___ keine Angst haben.', zh: '[我|wǒ] ___ 。', ja: 'ううん 、 ___ 。' },
      { es: [['tendré', 'I’ll have']], pt: [['terei', 'I’ll have']], de: [['werde', 'will']], zh: [['[不会|bù huì] [害怕|hài pà]', 'won’t be scared']], ja: [['[怖|こわ]く ない でしょう', 'won’t be scary']] },
      L('No, I won’t be scared.', 'No, no tendré miedo.', 'Não, não terei medo.', 'Nein, ich werde keine Angst haben.', '[我|wǒ] [不会|bù huì] [害怕|hài pà] 。', 'ううん 、 [怖|こわ]く ない でしょう 。'),
      { es: ['tendré'], pt: ['terei'], de: [['werde', 'haben']], zh: [['[不会|bù huì]', '[害怕|hài pà]'], ['[会|huì]', '[害怕|hài pà]']], ja: [['[怖|こわ]く', 'でしょう']] },
      { alt: { es: [['voy', 'tener']], pt: [['vou', 'ter']] }, person: { es: ['tendrás', 'tendrá'], pt: ['terá'], de: [['wirst', 'haben']] },
        past: { es: ['tuve'], pt: ['tive'], de: ['hatte'], zh: [['[害怕|hài pà]', '[了|le]']], ja: ['[怖|こわ]かった'] }, pres: { es: ['tengo'], pt: ['tenho'], de: ['habe'], zh: ['[害怕|hài pà]'], ja: ['[怖|こわ]く ない'] }, more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
    pass: F('{lalo} asks you something. Answer about yourself, in tomorrow’s words.',
      { es: 'Sí, ___ pasar.', pt: 'Sim, ___ passar.', de: 'Ja, ich werde durchkommen ___.', zh: '[我|wǒ] ___ 。', ja: 'うん 、 ___ 。' },
      { es: [['podré', 'I’ll be able']], pt: [['poderei', 'I’ll be able']], de: [['können', 'be able']], zh: [['[会|huì] [过去|guò qu]', 'will get through']], ja: [['[通|とお]れる でしょう', 'will get through']] },
      L('Yes, I’ll be able to get through.', 'Sí, podré pasar.', 'Sim, poderei passar.', 'Ja, ich werde durchkommen können.', '[我|wǒ] [会|huì] [过去|guò qu] 。', 'うん 、 [通|とお]れる でしょう 。'),
      { es: ['podré'], pt: ['poderei'], de: [['werde', 'können']], zh: [['[会|huì]', '[过去|guò qu]'], ['[能|néng]', '[过去|guò qu]']], ja: [['[通|とお]れる', 'でしょう']] },
      { alt: { es: [['voy', 'poder']], pt: [['vou', 'poder']] }, person: { es: ['podrás', 'podrá'], pt: ['poderá'], de: [['wirst', 'können']] },
        past: { es: ['pude'], pt: ['pude'], de: ['konnte'], zh: [['[过去|guò qu]', '[了|le]']], ja: ['[通|とお]れた'] }, pres: { es: ['puedo'], pt: ['posso'], de: ['kann'], zh: ['[过去|guò qu]'], ja: ['[通|とお]れる'] }, more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
    name: F('{lalo} asks you something. Answer about yourself, in tomorrow’s words.',
      { es: 'Sí, ___ su nombre.', pt: 'Sim, ___ o nome dele.', de: 'Ja, ich werde seinen Namen ___.', zh: '[我|wǒ] ___ [他|tā] [的|de] [名字|míng zi] 。', ja: 'うん 、 [名前|なまえ] を ___ 。' },
      { es: [['diré', 'I’ll say']], pt: [['direi', 'I’ll say']], de: [['sagen', 'say']], zh: [['[会|huì] [说|shuō]', 'will say']], ja: [['[言|い]う つもり', 'intend to say']] },
      L('Yes, I’ll say his name.', 'Sí, diré su nombre.', 'Sim, direi o nome dele.', 'Ja, ich werde seinen Namen sagen.', '[我|wǒ] [会|huì] [说|shuō] [他|tā] [的|de] [名字|míng zi] 。', 'うん 、 [名前|なまえ] を [言|い]う つもり 。'),
      { es: ['diré'], pt: ['direi'], de: [['werde', 'sagen']], zh: [['[会|huì]', '[说|shuō]']], ja: [['[言|い]う', 'つもり'], ['[言|い]う', 'でしょう'], ['[言|い]う', '[予定|よてい]']] },
      { alt: { es: [['voy', 'decir']], pt: [['vou', 'dizer']] }, person: { es: ['dirás', 'dirá'], pt: ['dirá'], de: [['wirst', 'sagen']] },
        past: { es: ['dije'], pt: ['disse'], de: [['habe', 'gesagt']], zh: [['[说|shuō]', '[了|le]']], ja: ['[言|い]った'] }, pres: { es: ['digo'], pt: ['digo'], de: ['sage'], zh: ['[说|shuō]'], ja: ['[言|い]う'] }, more: { es: ['nombre'], pt: ['nome'], de: ['ich'], zh: ['[我|wǒ]'] } }),
    will: F('{lalo} asks what you’ll do now. Say it in tomorrow’s words.',
      { es: '___ una fiesta.', pt: '___ uma festa.', de: 'Ich werde ein Fest ___.', zh: '[我|wǒ] ___ [办|bàn] [一个|yī gè] [晚会|wǎn huì] 。', ja: 'お[祭|まつ]り を する ___ 。' },
      { es: [['Haré', 'I’ll make']], pt: [['Farei', 'I’ll make']], de: [['machen', 'make']], zh: [['[打算|dǎ suàn]', 'plan to']], ja: [['つもり', 'intend to']] },
      L('I’ll throw a party.', 'Haré una fiesta.', 'Farei uma festa.', 'Ich werde ein Fest machen.', '[我|wǒ] [打算|dǎ suàn] [办|bàn] [一个|yī gè] [晚会|wǎn huì] 。', 'お[祭|まつ]り を する つもり 。'),
      { es: ['haré', 'pondré', 'diré', 'saldré', 'vendré'], pt: ['farei', 'direi', 'trarei', 'sairei', 'virei'], de: [['werde', 'machen'], ['werde', 'feiern']], zh: ['[打算|dǎ suàn]', '[要|yào]', '[会|huì]'], ja: ['つもり', '[予定|よてい]'] },
      { alt: { es: [['voy', 'a']], pt: ['vou'] }, past: { es: ['hice'], pt: ['fiz'], de: [['habe', 'gemacht']], zh: ['[了|le]'], ja: ['した'] }, pres: { es: ['hago'], pt: ['faço'], de: ['mache'] }, more: { de: ['ich'] } }),
  };
  // {mimo}'s plans (the 3rd person, tomorrow's irregular words): a task each
  const PLAN = {
    plank: F('In the Future, {mimo} follows plans. Tell it what it will do with the plank.',
      { es: '{mimo} ___ la tabla sobre el barro.', pt: 'O {mimo} ___ a tábua na lama.', de: '{mimo} wird das Brett auf den Schlamm ___.', zh: '{mimo} ___ [把|bǎ] [木板|mù bǎn] [放|fàng] [在|zài] [泥|ní] [上|shàng] 。', ja: '{mimo} が [板|いた] を [泥|どろ] の [上|うえ] に ___ 。' },
      { es: [['pondrá', 'will put']], pt: [['porá', 'will put']], de: [['legen', 'lay']], zh: [['[会|huì]', 'will'], ['[要|yào]', 'is going to']], ja: [['[置|お]く [予定|よてい]', 'is to put']] },
      L('{mimo} will put the plank on the mud.', '{mimo} pondrá la tabla sobre el barro.', 'O {mimo} porá a tábua na lama.', '{mimo} wird das Brett auf den Schlamm legen.', '{mimo} [会|huì] [把|bǎ] [木板|mù bǎn] [放|fàng] [在|zài] [泥|ní] [上|shàng] 。', '{mimo} が [板|いた] を [泥|どろ] の [上|うえ] に [置|お]く [予定|よてい] 。'),
      { es: ['pondrá'], pt: ['porá'], de: [['wird', 'legen']], zh: [['[会|huì]', '[放|fàng]'], ['[要|yào]', '[放|fàng]'], ['[打算|dǎ suàn]', '[放|fàng]']], ja: [['[置|お]く', '[予定|よてい]'], ['[置|お]く', 'つもり'], ['[置|お]く', 'でしょう']] },
      { icon: 'push', alt: { es: [['va', 'poner']], pt: [['vai', 'pôr']] }, person: { es: ['pondré'], pt: ['porei'] }, past: { es: ['puso'], pt: ['pôs'], de: [['hat', 'gelegt']], zh: [['[放|fàng]', '[了|le]']], ja: ['[置|お]いた'] },
        pres: { es: ['pone', 'pon', 'poner'], pt: ['põe'], de: ['legt'], zh: ['[放|fàng]'], ja: ['[置|お]く', '[置|お]いて'] }, more: { es: ['tabla'], pt: ['tabua'], de: ['brett'], zh: ['[木板|mù bǎn]'], ja: ['[板|いた]'] } }),
    window: F('The hatch is shut from inside. Tell {mimo} its plan: out through the little window.',
      { es: '{mimo} ___ por la ventana.', pt: 'O {mimo} ___ pela janela.', de: '{mimo} wird durch das Fenster ___.', zh: '{mimo} ___ [从|cóng] [窗户|chuāng hu] [出去|chū qu] 。', ja: '{mimo} が [窓|まど] から ___ 。' },
      { es: [['saldrá', 'will go out']], pt: [['sairá', 'will go out']], de: [['klettern', 'climb']], zh: [['[要|yào]', 'is going to']], ja: [['[出|で]る つもり', 'intends to go out']] },
      L('{mimo} will go out through the window.', '{mimo} saldrá por la ventana.', 'O {mimo} sairá pela janela.', '{mimo} wird durch das Fenster klettern.', '{mimo} [要|yào] [从|cóng] [窗户|chuāng hu] [出去|chū qu] 。', '{mimo} が [窓|まど] から [出|で]る つもり 。'),
      { es: ['saldrá'], pt: ['sairá'], de: [['wird', 'klettern'], ['wird', 'steigen'], ['wird', 'gehen']], zh: [['[要|yào]', '[出去|chū qu]'], ['[会|huì]', '[出去|chū qu]']], ja: [['[出|で]る', 'つもり'], ['[出|で]る', '[予定|よてい]'], ['[出|で]る', 'でしょう']] },
      { icon: 'climb', alt: { es: [['va', 'salir']], pt: [['vai', 'sair']] }, past: { es: ['salió'], pt: ['saiu'], de: [['ist', 'geklettert']], zh: [['[出去|chū qu]', '[了|le]']], ja: ['[出|で]た'] },
        pres: { es: ['sale', 'sal', 'salir'], pt: ['sai'], de: ['klettert'], zh: ['[出去|chū qu]'], ja: ['[出|で]る', '[出|で]て'] }, more: { es: ['ventana'], pt: ['janela'], de: ['fenster'], zh: ['[窗户|chuāng hu]'], ja: ['[窓|まど]'] } }),
    bridge: F('The pool is deep. Tell {mimo} its plan: a bridge of dry reeds.',
      { es: '{mimo} ___ un puente con los juncos.', pt: 'O {mimo} ___ uma ponte com os juncos.', de: '{mimo} wird eine Brücke aus Schilf ___.', zh: '{mimo} ___ [用|yòng] [芦苇|lú wěi] [搭|dā] [一|yī] [座|zuò] [桥|qiáo] 。', ja: '{mimo} が [葦|あし] で [橋|はし] を ___ 。' },
      { es: [['hará', 'will make']], pt: [['fará', 'will make']], de: [['bauen', 'build']], zh: [['[会|huì]', 'will'], ['[打算|dǎ suàn]', 'plans to']], ja: [['[作|つく]る つもり', 'intends to make']] },
      L('{mimo} will make a bridge of the reeds.', '{mimo} hará un puente con los juncos.', 'O {mimo} fará uma ponte com os juncos.', '{mimo} wird eine Brücke aus Schilf bauen.', '{mimo} [会|huì] [用|yòng] [芦苇|lú wěi] [搭|dā] [一|yī] [座|zuò] [桥|qiáo] 。', '{mimo} が [葦|あし] で [橋|はし] を [作|つく]る つもり 。'),
      { es: ['hará'], pt: ['fará'], de: [['wird', 'bauen']], zh: [['[会|huì]', '[搭|dā]'], ['[打算|dǎ suàn]', '[搭|dā]'], ['[要|yào]', '[搭|dā]']], ja: [['[作|つく]る', 'つもり'], ['[作|つく]る', '[予定|よてい]'], ['[作|つく]る', 'でしょう']] },
      { icon: 'push', alt: { es: [['va', 'hacer']], pt: [['vai', 'fazer']] }, past: { es: ['hizo'], pt: ['fez'], de: [['hat', 'gebaut']], zh: [['[搭|dā]', '[了|le]']], ja: ['[作|つく]った'] },
        pres: { es: ['hace', 'haz', 'hacer'], pt: ['faz'], de: ['baut'], zh: ['[搭|dā]'], ja: ['[作|つく]る', '[作|つく]って'] }, more: { es: ['puente'], pt: ['ponte'], de: ['brucke'], zh: ['[桥|qiáo]'], ja: ['[橋|はし]'] } }),
    boat: F('No wind for Lucho’s paper boat. Tell {mimo} its plan: into the water.',
      { es: '{mimo} ___ el barquito en el agua.', pt: 'O {mimo} ___ o barquinho na água.', de: '{mimo} wird das Schiffchen ins Wasser ___.', zh: '{mimo} ___ [把|bǎ] [纸船|zhǐ chuán] [放|fàng] [到|dào] [水|shuǐ] [里|lǐ] 。', ja: '{mimo} が [紙|かみ]の[船|ふね] を [水|みず] に ___ 。' },
      { es: [['pondrá', 'will put']], pt: [['porá', 'will put']], de: [['setzen', 'set']], zh: [['[会|huì]', 'will']], ja: [['[浮|う]かべる つもり', 'intends to float']] },
      L('{mimo} will put the little boat in the water.', '{mimo} pondrá el barquito en el agua.', 'O {mimo} porá o barquinho na água.', '{mimo} wird das Schiffchen ins Wasser setzen.', '{mimo} [会|huì] [把|bǎ] [纸船|zhǐ chuán] [放|fàng] [到|dào] [水|shuǐ] [里|lǐ] 。', '{mimo} が [紙|かみ]の[船|ふね] を [水|みず] に [浮|う]かべる つもり 。'),
      { es: ['pondrá'], pt: ['porá'], de: [['wird', 'setzen'], ['wird', 'legen']], zh: [['[会|huì]', '[放|fàng]'], ['[要|yào]', '[放|fàng]']], ja: [['[浮|う]かべる', 'つもり'], ['[浮|う]かべる', '[予定|よてい]'], ['[浮|う]かべる', 'でしょう']] },
      { icon: 'push', alt: { es: [['va', 'poner']], pt: [['vai', 'pôr']] }, past: { es: ['puso'], pt: ['pôs'], de: [['hat', 'gesetzt']], zh: [['[放|fàng]', '[了|le]']], ja: ['[浮|う]かべた'] },
        pres: { es: ['pone', 'pon'], pt: ['põe'], de: ['setzt'], zh: ['[放|fàng]'], ja: ['[浮|う]かべる'] }, more: { es: ['barquito'], pt: ['barquinho'], de: ['schiffchen'], zh: ['[纸船|zhǐ chuán]'] } }),
  };
  const ROOMS = [
    { name: 'The Gray Mud', sub: 'The drowned grotto, tomorrow · the way in' },
    { name: 'The Sunken Boat', sub: 'The drowned grotto, tomorrow · a wreck in the rock' },
    { name: 'The Silent Pool', sub: 'The drowned grotto, tomorrow · deeper in' },
    { name: 'The Dry Throne', sub: 'The drowned grotto, tomorrow · where the king sat' },
  ];
  const SEALQ = {
    fear: L('And you? Will you be scared?', '¿Y tú? ¿Tendrás miedo?', 'E você? Terá medo?', 'Und du? Wirst du Angst haben?', '[你|nǐ] [呢|ne] ？ [你|nǐ] [会|huì] [害怕|hài pà] [吗|ma] ？', 'きみ は ？ [怖|こわ]い でしょう か ？'),
    pass: L('Will you be able to get through?', '¿Podrás pasar?', 'Você poderá passar?', 'Wirst du durchkommen können?', '[你|nǐ] [会|huì] [过去|guò qu] [吗|ma] ？', '[通|とお]れる でしょう か ？'),
    name: L('Will you say his name?', '¿Dirás su nombre?', 'Você dirá o nome dele?', 'Wirst du seinen Namen sagen?', '[你|nǐ] [会|huì] [说|shuō] [他|tā] [的|de] [名字|míng zi] [吗|ma] ？', 'あの [子|こ] の [名前|なまえ] を [言|い]う でしょう か ？'),
    will: L('And now? What will you do?', '¿Y ahora? ¿Qué harás?', 'E agora? O que você fará?', 'Und jetzt? Was wirst du machen?', '[现在|xiàn zài] [呢|ne] ？ [你|nǐ] [打算|dǎ suàn] [做|zuò] [什么|shén me] ？', '[今|いま] から 、 [何|なに] を する つもり ？'),
  };
  const SEALQ_MARKS = {
    fear: { es: [['Tendrás', 'will you have']], pt: [['Terá', 'will (you) have']], de: [['Wirst du', 'will you'], ['haben', 'have']], zh: [['[会|huì] [害怕|hài pà]', 'will be scared']], ja: [['[怖|こわ]い でしょう か', 'will it be scary?']] },
    pass: { es: [['Podrás', 'will you be able']], pt: [['poderá', 'will (you) be able']], de: [['Wirst du', 'will you'], ['können', 'be able']], zh: [['[会|huì] [过去|guò qu]', 'will get through']], ja: [['[通|とお]れる でしょう か', 'will (you) get through?']] },
    name: { es: [['Dirás', 'will you say']], pt: [['dirá', 'will (you) say']], de: [['Wirst du', 'will you'], ['sagen', 'say']], zh: [['[会|huì] [说|shuō]', 'will say']], ja: [['[言|い]う でしょう か', 'will (you) say?']] },
    will: { es: [['harás', 'will you do']], pt: [['fará', 'will (you) do']], de: [['wirst du', 'will you'], ['machen', 'do']], zh: [['[打算|dǎ suàn] [做|zuò]', 'plan to do']], ja: [['する つもり', 'intend to do']] },
  };
  // ------------------------------------------------------------ the fight: the Gray Toad (lake_time_boss.js); {mimo}: the player's name
  const FIGHT = {
    intro: L('Croak… Who comes to my dry throne? Nobody will come. Nobody comes any more.', 'Croac… ¿Quién viene a mi trono seco? Nadie vendrá. Ya nadie viene.', 'Croac… Quem vem ao meu trono seco? Ninguém virá. Ninguém vem mais.',
      'Quaak … Wer kommt zu meinem trockenen Thron? Niemand wird kommen. Keiner kommt mehr.', '[呱|guā] … [谁|shéi] [来|lái] [我|wǒ] [的|de] [干|gān] [王座|wáng zuò] ？ [没有|méi yǒu] [人|rén] [会|huì] [来|lái] 。 [再|zài] [也|yě] [没有|méi yǒu] [人|rén] [来|lái] [了|le] 。',
      'ゲロ … わし の [乾|かわ]いた [玉座|ぎょくざ] に だれ が [来|く]る ？ だれ も [来|こ]ない でしょう 。 もう だれ も [来|こ]ない 。'),
    coach: L('It’s tomorrow! Watch which way it puffs up, and say it: «The toad will attack from above!» Or give {mimo} a plan.', '¡Es el mañana! Mira hacia dónde se infla y dilo: «¡El sapo atacará por arriba!» O dale un plan a {mimo}.',
      'É o amanhã! Olha pra onde ele se infla e diz: «O sapão vai atacar por cima!» Ou dá um plano pro {mimo}.', 'Das ist das Morgen! Schau, wohin sie sich aufbläht, und sag es: «Die Kröte wird von oben angreifen!» Oder gib {mimo} einen Plan.',
      '[这|zhè] [是|shì] [明天|míng tiān] ！ [看|kàn] [它|tā] [往|wǎng] [哪|nǎ] [边|biān] [鼓|gǔ] [起来|qǐ lai] ， [说|shuō] [出来|chū lai] ： “ [蛤蟆|há ma] [会|huì] [从|cóng] [上面|shàng miàn] [攻击|gōng jī] 。 ” [或者|huò zhě] [给|gěi] {mimo} [一个|yī gè] [计划|jì huà] 。',
      '[明日|あした] の [世界|せかい] だ ！ どっち に ふくらむ か [見|み]て 、 [言|い]って ： 「 ガマ は [上|うえ] から [来|く]る でしょう 。 」 それ か 、 {mimo} に [計画|けいかく] を 。'),
    now: L('That’s today! Here, say what will happen!', '¡Eso es hoy! ¡Aquí di lo que pasará!', 'Isso é hoje! Aqui, diz o que vai acontecer!', 'Das ist heute! Hier sag, was passieren wird!', '[那|nà] [是|shì] [今天|jīn tiān] ！ [这里|zhè lǐ] [要|yào] [说|shuō] [会|huì] [发生|fā shēng] [什么|shén me] ！', 'それ は [今日|きょう] だ よ ！ ここ で は 、 これから の こと を [言|い]って ！'),
    plan: L('Croak?! My dust!', '¡¿Croac?! ¡Mi polvo!', 'Croac?! A minha poeira!', 'Quak?! Mein Staub!', '[呱|guā] ？ ！ [我|wǒ] [的|de] [灰|huī] ！', 'ゲロ ？ ！ わし の [灰|はい] が ！'),
    missed: L('You… saw it coming?', '¿Lo… viste venir?', 'Você… viu isso chegando?', 'Du … hast es kommen sehen?', '[你|nǐ] … [早|zǎo] [就|jiù] [看出来|kàn chū lai] [了|le] ？', '[見|み]え … て いた の か ？'),
    phase2: L('Enough! Tomorrow is gray. I know it. Listen to my predictions!', '¡Basta! El mañana es gris. Lo sé. ¡Escucha mis predicciones!', 'Chega! O amanhã é cinza. Eu sei. Escuta as minhas previsões!', 'Genug! Das Morgen ist grau. Ich weiß es. Hör dir meine Vorhersagen an!',
      '[够|gòu] [了|le] ！ [明天|míng tiān] [是|shì] [灰色|huī sè] [的|de] 。 [我|wǒ] [知道|zhī dào] 。 [听听|tīng ting] [我|wǒ] [的|de] [预言|yù yán] ！', 'もう いい ！ [明日|あした] は [灰色|はいいろ] だ 。 わかって いる 。 わし の [予言|よげん] を [聞|き]け ！'),
    d1: L('Nobody will come to the lake. Never again!', '¡Nadie vendrá al lago! ¡Nunca más!', 'Ninguém virá ao lago! Nunca mais!', 'Niemand wird an den See kommen! Nie wieder!', '[没有|méi yǒu] [人|rén] [会|huì] [来|lái] [湖|hú] [边|biān] ！ [再|zài] [也|yě] [不会|bù huì] ！', 'だれ も [湖|みずうみ] に [来|こ]ない でしょう ！ [二度|にど]と ！'),
    d2: L('And nobody will be able to cross it!', '¡Y nadie podrá cruzarlo!', 'E ninguém poderá atravessar!', 'Und niemand wird ihn überqueren können!', '[也|yě] [没有|méi yǒu] [人|rén] [能|néng] [过|guò] [湖|hú] ！', 'そして 、 だれ も [渡|わた]れない でしょう ！'),
    promise: L('Answer with a promise: say the opposite, in tomorrow’s words! «Everyone will come!»', '¡Contesta con una promesa: di lo contrario, con las palabras de mañana! «¡Todos vendrán!»', 'Responde com uma promessa: diz o contrário, com as palavras de amanhã! «Todos virão!»',
      'Antworte mit einem Versprechen: Sag das Gegenteil, mit den Worten von morgen! «Alle werden kommen!»', '[用|yòng] [承诺|chéng nuò] [回答|huí dá] ： [说|shuō] [相反|xiāng fǎn] [的|de] [话|huà] ！ “ [大家|dà jiā] [都|dōu] [会|huì] [来|lái] ！ ”', '[約束|やくそく] で [答|こた]えて 。 [反対|はんたい] の こと を [言|い]って ！ 「 みんな [来|く]る でしょう ！ 」'),
    shrink: L('Croak… everyone? Hmph. Then… then…', 'Croac… ¿todos? Bah. Entonces… entonces…', 'Croac… todos? Hunf. Então… então…', 'Quak … alle? Pah. Dann … dann …', '[呱|guā] … [大家|dà jiā] ？ [哼|hēng] 。 [那|nà] … [那|nà] …', 'ゲロ … みんな ？ ふん 。 なら … なら …'),
    win: L('…Then tomorrow isn’t gray. I was so sure. Here… I kept this, all these years. A man’s voice.', '…Entonces el mañana no es gris. Estaba tan seguro. Toma… guardé esto todos estos años. La voz de un hombre.',
      '…Então o amanhã não é cinza. Eu tinha tanta certeza. Toma… guardei isto todos esses anos. A voz de um homem.', '… Dann ist das Morgen nicht grau. Ich war mir so sicher. Hier … das habe ich all die Jahre aufbewahrt. Die Stimme eines Mannes.',
      '… [那|nà] [明天|míng tiān] [不|bù] [是|shì] [灰色|huī sè] [的|de] 。 [我|wǒ] [本来|běn lái] [那么|nà me] [肯定|kěn dìng] 。 [给|gěi] … [这么|zhè me] [多|duō] [年|nián] [我|wǒ] [一直|yī zhí] [留|liú] [着|zhe] [它|tā] 。 [一个|yī gè] [男人|nán rén] [的|de] [声音|shēng yīn] 。',
      '… なら 、 [明日|あした] は [灰色|はいいろ] じゃ ない の か 。 あんな に [信|しん]じて いた のに 。 ほれ … [何年|なんねん] も とって おいた 。 [男|おとこ] の [人|ひと] の [声|こえ] だ 。'),
  };
  // the Gray Toad's two dark predictions: answer each with the opposite promise
  const BOSSQ = {
    come: F('The Gray Toad croaks: «Nobody will come». Answer with a promise.',
      { es: '¡Todos ___!', pt: 'Todos ___!', de: 'Alle werden ___!', zh: '[大家|dà jiā] [都|dōu] ___ ！', ja: 'みんな ___ ！' },
      { es: [['vendrán', 'will come']], pt: [['virão', 'will come']], de: [['kommen', 'come']], zh: [['[会|huì] [来|lái]', 'will come']], ja: [['[来|く]る でしょう', 'will come']] },
      L('Everyone will come!', '¡Todos vendrán!', 'Todos virão!', 'Alle werden kommen!', '[大家|dà jiā] [都|dōu] [会|huì] [来|lái] ！', 'みんな [来|く]る でしょう ！'),
      { es: ['vendrán', 'vendremos'], pt: ['virão', 'viremos'], de: [['werden', 'kommen']], zh: [['[会|huì]', '[来|lái]']], ja: [['[来|く]る', 'でしょう'], ['[来|く]る', '[予定|よてい]']] },
      { alt: { es: [['van', 'venir'], ['vamos', 'venir']], pt: [['vão', 'vir'], ['vamos', 'vir']] }, person: { es: ['vendrá', 'vendré'], pt: ['virá'] },
        past: { es: ['vinieron', 'vinimos'], pt: ['vieram'], de: [['sind', 'gekommen']], zh: [['[来|lái]', '[了|le]']], ja: ['[来|き]た'] }, pres: { es: ['vienen', 'venimos'], pt: ['vem'], de: ['kommen'], zh: ['[来|lái]'], ja: ['[来|く]る'] } }),
    cross: F('The Gray Toad croaks: «Nobody will be able to cross». Answer with a promise.',
      { es: '¡___ cruzar!', pt: '___ atravessar!', de: 'Wir werden hinüberfahren ___!', zh: '[我们|wǒ men] ___ [过|guò] [湖|hú] ！', ja: '[湖|みずうみ] を ___ ！' },
      { es: [['Podremos', 'we’ll be able']], pt: [['Poderemos', 'we’ll be able']], de: [['können', 'be able']], zh: [['[会|huì]', 'will'], ['[能|néng]', 'can']], ja: [['[渡|わた]れる でしょう', 'will be able to cross']] },
      L('We’ll be able to cross!', '¡Podremos cruzar!', 'Poderemos atravessar!', 'Wir werden hinüberfahren können!', '[我们|wǒ men] [会|huì] [过|guò] [湖|hú] ！', '[湖|みずうみ] を [渡|わた]れる でしょう ！'),
      { es: ['podremos', 'podrán', 'podrá'], pt: ['poderemos', 'poderão', 'poderá'], de: [['werden', 'können'], ['wird', 'können']], zh: [['[会|huì]', '[过|guò]'], ['[能|néng]', '[过|guò]']], ja: [['[渡|わた]れる', 'でしょう'], ['[渡|わた]る', '[予定|よてい]']] },
      { alt: { es: [['vamos', 'poder']], pt: [['vamos', 'poder']] }, past: { es: ['pudimos'], pt: ['pudemos'], de: ['konnten'], ja: ['[渡|わた]った', '[渡|わた]れた'] }, pres: { es: ['podemos'], pt: ['podemos'], de: ['können'], ja: ['[渡|わた]れる'] } }),
  };
  // the Gray Toad in the battle (a species of its own in every language: predictions name it)
  const SPECIES = { es: { w: 'sapo', pl: 'sapos', g: 'm', en: 'toad' }, pt: { w: 'sapão', pl: 'sapões', g: 'm', en: 'toad' }, de: { w: 'Kröte', pl: 'Kröten', gen: 'Kröte', g: 'f', en: 'toad' },
    zh: { w: '[蛤蟆|há ma]', en: 'toad', g: 'm', cl: '只', cls: ['只'] }, ja: { w: 'ガマ', en: 'toad', g: 'm' } };
  const NAMES = {
    boss: L('the Gray Toad', 'el Sapo Gris', 'o Sapão Cinzento', 'die Graue Kröte', '[灰|huī] [蛤蟆|há ma]', '[灰色|はいいろ] の ガマ'),
    sign: L('Ferry school', 'Escuela de barqueros', 'Escola de barqueiros', 'Fährschule', '[船夫|chuán fū] [学校|xué xiào]', '[船頭|せんどう] [学校|がっこう]'),
    grotto: L('The Drowned Grotto', 'La Gruta Ahogada', 'A Gruta Afogada', 'Die Ertrunkene Grotte', '[淹没|yān mò] [的|de] [洞穴|dòng xué]', '[沈|しず]んだ [洞窟|どうくつ]'),
  };
  const LORE = ['El Sapo Gris: el rey sapo, viejo y callado, que solo croa malos presagios.', 'O Sapão Cinzento: o rei sapo, velho e calado, que só coaxa maus presságios.', 'Die Graue Kröte: der alte, verstummte Froschkönig, der nur noch Unheil quakt.',
    '[灰|huī] [蛤蟆|há ma] ： [又|yòu] [老|lǎo] [又|yòu] [沉默|chén mò] [的|de] [蛙王|wā wáng] ， [只|zhǐ] [会|huì] [说|shuō] [坏|huài] [预言|yù yán] 。', '[灰色|はいいろ] の ガマ ： [年|とし] を とって [黙|だま]りこんだ カエル の [王様|おうさま] 。 [悪|わる]い [予言|よげん] しか [鳴|な]かない 。', 'The Gray Toad: the old, silent Frog King, croaking only dark predictions.'];
  // ------------------------------------------------------------ things to Look at tomorrow (each word said aloud and glossed)
  const LOOKS = {
    'look.ferry': { w: L('rust', 'el óxido', 'a ferrugem', 'der Rost', '[锈|xiù]', 'さび'), t: 'The old ferry, half sunk at its dock, eaten by rust. Nobody has run it in years.' },
    'look.mud': { w: L('mud flat', 'el lodazal', 'o lodaçal', 'das Watt', '[泥滩|ní tān]', '[干潟|ひがた]'), t: 'Where the north bay was, gray mud, cracked like old paint. The lake is shrinking.' },
    'look.crack': { w: L('crack (in the mud)', 'la grieta', 'a rachadura', 'der Riss', '[裂纹|liè wén]', 'ひび'), t: 'The dry mud split into a thousand pieces. Nothing grows.' },
    'look.boat': { w: L('wreck', 'el casco', 'o casco', 'das Wrack', '[残骸|cán hái]', '[残骸|ざんがい]'), t: 'A rowboat lying on its side in the mud, gray as stone.' },
    'look.lantern': { w: L('lantern (paper)', 'el farol de papel', 'a lanterna de papel', 'die Papierlaterne', '[纸灯笼|zhǐ dēng long]', 'ちょうちん'), t: 'A paper lantern, gray and torn, left from a party nobody remembers.' },
    'look.post': { w: L('buoy', 'la boya', 'a boia', 'die Boje', '[浮标|fú biāo]', 'ブイ'), t: 'A buoy stuck in the mud, its bell silent.' },
    'look.reeds': { w: L('dry reeds', 'los juncos secos', 'os juncos secos', 'das trockene Schilf', '[干|gān] [芦苇|lú wěi]', '[枯|か]れた [葦|あし]'), t: 'Reeds gone dry and brittle. They crackle in a wind that isn’t there.' },
    'look.net': { w: L('torn net', 'la red rota', 'a rede rasgada', 'das kaputte Netz', '[破|pò] [渔网|yú wǎng]', '[破|やぶ]れた [網|あみ]'), t: 'Delia’s net, half mended, the needle still in it.' },
    'look.sign': { w: L('sign', 'el letrero', 'a placa', 'das Schild', '[牌子|pái zi]', '[看板|かんばん]'), t: 'A sign where the pier starts, gray: «Ferry · closed». Someone wrote under it: «until tomorrow».' },
  };
  // ------------------------------------------------------------ the words of tomorrow (the teaching table: each is heard in use, in the
  // line, demonstration or Look named last, before any box asks for it). en ~ es ~ pt ~ de ~ zh ~ ja ~ where it's taught
  const WORDS = `lake ~ el lago ~ o lago ~ der See ~ [湖|hú] ~ [湖|みずうみ] ~ lalo.hello
gray ~ gris ~ cinza ~ grau ~ [灰色|huī sè] ~ [灰色|はいいろ] ~ lalo.hello
still (not moving) ~ quieto ~ parado ~ still ~ [不|bù] [动|dòng] ~ [動|うご]かない ~ lalo.hello
to freeze ~ congelarse ~ congelar ~ erstarren ~ [冻住|dòng zhù] ~ [凍|こお]る ~ lalo.hello
rust ~ el óxido ~ a ferrugem ~ der Rost ~ [锈|xiù] ~ さび ~ lalo.ferry, look.ferry
rusted ~ oxidado ~ enferrujado ~ verrostet ~ [生锈|shēng xiù] ~ さびた ~ lalo.ferry
to learn ~ aprender ~ aprender ~ lernen ~ [学会|xué huì] ~ [習|なら]う ~ lalo.ferry
to cross ~ cruzar ~ atravessar ~ hinüberfahren ~ [过|guò] [湖|hú] ~ [渡|わた]る ~ lalo.ferry
promise ~ la promesa ~ a promessa ~ das Versprechen ~ [承诺|chéng nuò] ~ [約束|やくそく] ~ lalo.wake
to promise ~ prometer ~ prometer ~ versprechen ~ [答应|dā ying] ~ [約束|やくそく] する ~ lalo.wake
frozen ~ congelado ~ congelado ~ erstarrt ~ [冻住|dòng zhù] [的|de] ~ [凍|こお]った ~ lalo.wake
seal ~ el sello ~ o selo ~ das Siegel ~ [封印|fēng yìn] ~ [封印|ふういん] ~ lalo.seal
bay ~ la bahía ~ a baía ~ die Bucht ~ [湖湾|hú wān] ~ [入|い]り[江|え] ~ lalo.seal
dried up ~ se secó ~ secou ~ ausgetrocknet ~ [干涸|gān hé] ~ [干上|ひあ]がった ~ lalo.seal
last year ~ el año pasado ~ o ano passado ~ letztes Jahr ~ [去年|qù nián] ~ [去年|きょねん] ~ lalo.seal
village ~ el pueblo ~ a vila ~ das Dorf ~ [村子|cūn zi] ~ [村|むら] ~ lalo.seal
to wake up ~ despertar ~ acordar ~ aufwachen ~ [醒|xǐng] ~ [目|め] を [覚|さ]ます ~ lalo.seal
to crack ~ romperse ~ rachar ~ brechen ~ [裂开|liè kāi] ~ [割|わ]れる ~ lalo.seal
to go out ~ salir ~ sair ~ losgehen ~ [出门|chū mén] ~ [出|で]かける ~ d.lalo1
early ~ temprano ~ cedo ~ früh ~ [早|zǎo] ~ [早|はや]く ~ d.lalo1
raft ~ la balsa ~ a jangada ~ das Floß ~ [木筏|mù fá] ~ いかだ ~ d.lalo1
to make ~ hacer ~ fazer ~ machen ~ [做|zuò] ~ [作|つく]る ~ d.lalo1
cold ~ el frío ~ o frio ~ kalt ~ [冷|lěng] ~ [寒|さむ]い ~ d.lalo1
to be able ~ poder ~ poder ~ können ~ [能|néng] ~ できる ~ d.lalo1
tomorrow ~ mañana ~ amanhã ~ morgen ~ [明天|míng tiān] ~ [明日|あした] ~ q.lalo
to come ~ venir ~ vir ~ kommen ~ [来|lái] ~ [来|く]る ~ q.lalo
nobody ~ nadie ~ ninguém ~ niemand ~ [没有|méi yǒu] [人|rén] ~ だれ も ~ d.lalo2
everyone ~ todos ~ todos ~ alle ~ [大家|dà jiā] ~ みんな ~ d.lalo2
again ~ otra vez ~ de novo ~ wieder ~ [再|zài] ~ また ~ d.lalo2
children ~ los niños ~ as crianças ~ die Kinder ~ [孩子|hái zi] [们|men] ~ [子|こ]ども たち ~ d.lalo2
to have ~ tener ~ ter ~ haben ~ [有|yǒu] ~ [持|も]つ ~ d.lalo2
you'll see ~ ya verás ~ você vai ver ~ du wirst sehen ~ [等着|děng zhe] [看|kàn] ~ [見|み]て て ~ d.lalo2
party ~ la fiesta ~ a festa ~ das Fest ~ [晚会|wǎn huì] ~ お[祭|まつ]り ~ marina.frozen
color ~ el color ~ a cor ~ die Farbe ~ [颜色|yán sè] ~ [色|いろ] ~ marina.awake
new boat ~ la barca nueva ~ o barco novo ~ das neue Boot ~ [新|xīn] [船|chuán] ~ [新|あたら]しい [船|ふね] ~ vicente.awake
to need ~ necesitar ~ precisar ~ brauchen ~ [需要|xū yào] ~ いる ~ delia.awake
old hands ~ las manos viejas ~ as mãos velhas ~ die alten Hände ~ [老|lǎo] [手|shǒu] ~ [年寄|としよ]り の [手|て] ~ bartolo.awake
paper boat ~ el barquito de papel ~ o barquinho de papel ~ das Papierschiff ~ [纸船|zhǐ chuán] ~ [紙|かみ]の[船|ふね] ~ lucho.frozen
to sail ~ navegar ~ navegar ~ segeln ~ [航行|háng xíng] ~ [船|ふね] に [乗|の]る ~ lucho.awake
real ~ de verdad ~ de verdade ~ echt ~ [真|zhēn] ~ [本物|ほんもの] ~ lucho.boat
someday ~ algún día ~ um dia ~ eines Tages ~ [总有一天|zǒng yǒu yī tiān] ~ いつか ~ lucho.boat
fish ~ el pez ~ o peixe ~ der Fisch ~ [鱼|yú] ~ [魚|さかな] ~ pepe.frozen
to fish ~ pescar ~ pescar ~ angeln ~ [钓鱼|diào yú] ~ [釣|つ]り を する ~ pepe.frozen
like back then ~ como cuando ~ como quando ~ wie damals ~ [像|xiàng] [当年|dāng nián] ~ ころ の よう に ~ pepe.awake
next week ~ la semana que viene ~ na semana que vem ~ nächste Woche ~ [下|xià] [个|gè] [星期|xīng qī] ~ [来週|らいしゅう] ~ marina.party
music ~ la música ~ a música ~ die Musik ~ [音乐|yīn yuè] ~ [音楽|おんがく] ~ marina.party
like the old days ~ como antes ~ como antigamente ~ wie früher ~ [跟|gēn] [以前|yǐ qián] [一样|yī yàng] ~ [昔|むかし] の よう に ~ marina.party
the whole lake ~ todo el lago ~ o lago inteiro ~ der ganze See ~ [整个|zhěng gè] [湖|hú] ~ [湖|みずうみ] じゅう ~ marina.partyDone
to bring ~ traer ~ trazer ~ bringen ~ [带|dài] ~ [持|も]って [来|く]る ~ d.party
to put up ~ poner ~ pôr ~ aufhängen ~ [挂|guà] ~ つける ~ d.party
to dance ~ bailar ~ dançar ~ tanzen ~ [跳舞|tiào wǔ] ~ [踊|おど]る ~ q.party2
to teach ~ enseñar ~ ensinar ~ beibringen ~ [教|jiāo] ~ [教|おし]える ~ bartolo.why
if ~ si ~ se ~ wenn ~ [要是|yào shi] ~ もし ~ d.warn
starting today ~ desde hoy ~ a partir de hoje ~ ab heute ~ [从|cóng] [今天|jīn tiān] [起|qǐ] ~ [今日|きょう] から ~ bartolo.heard
every afternoon ~ todas las tardes ~ toda tarde ~ jeden Nachmittag ~ [每天|měi tiān] [下午|xià wǔ] ~ [毎日|まいにち] [午後|ごご] ~ bartolo.teaching
helm ~ el timón ~ o leme ~ das Steuer ~ [舵|duò] ~ かじ ~ bartolo.teaching
tongue ~ la lengua ~ a língua ~ die Zunge ~ [舌头|shé tou] ~ [舌|した] ~ bartolo.teaching
in ten years ~ en diez años ~ daqui a dez anos ~ in zehn Jahren ~ [十|shí] [年|nián] [后|hòu] ~ [十年後|じゅうねんご] ~ bartolo.teaching
better ~ mejor ~ melhor ~ besser ~ [更|gèng] [好|hǎo] ~ うまく ~ bartolo.teaching
to steer ~ llevar el timón ~ pilotar ~ steuern ~ [掌舵|zhǎng duò] ~ かじ を とる ~ lalo.learning
buoy ~ la boya ~ a boia ~ die Boje ~ [浮标|fú biāo] ~ ブイ ~ lalo.learning, look.post
the day after tomorrow ~ pasado mañana ~ depois de amanhã ~ übermorgen ~ [后天|hòu tiān] ~ あさって ~ lalo.after
to move ~ moverse ~ mexer-se ~ sich bewegen ~ [动|dòng] ~ [動|うご]く ~ lalo.after
years ~ los años ~ os anos ~ die Jahre ~ [年|nián] ~ [年|ねん] ~ lalo.captain
to take across ~ llevar ~ levar ~ hinüberbringen ~ [送|sòng] ~ [乗|の]せて [行|い]く ~ lalo.captain
lamp ~ la lámpara ~ a lanterna ~ die Lampe ~ [灯|dēng] ~ ランプ ~ d.f0
smell ~ el olor ~ o cheiro ~ der Geruch ~ [味|wèi] ~ におい ~ d.f0
sunken ~ hundido ~ afundado ~ gesunken ~ [沉|chén] [了|le] [的|de] ~ [沈|しず]んだ ~ d.f1
hatch ~ la escotilla ~ a escotilha ~ die Luke ~ [舱门|cāng mén] ~ ハッチ ~ d.f1
from inside ~ por dentro ~ por dentro ~ von innen ~ [从|cóng] [里面|lǐ miàn] ~ [中|なか] から ~ d.f1
little window ~ la ventanita ~ a janelinha ~ das kleine Fenster ~ [小|xiǎo] [窗户|chuāng hu] ~ [小|ちい]さな [窓|まど] ~ d.f1
pool ~ el estanque ~ a lagoa ~ der Teich ~ [水池|shuǐ chí] ~ [池|いけ] ~ d.f2
deep ~ hondo ~ fundo ~ tief ~ [深|shēn] ~ [深|ふか]い ~ d.f2
to say ~ decir ~ dizer ~ sagen ~ [说|shuō] ~ [言|い]う ~ d.f2
loud ~ alto ~ alto ~ laut ~ [大声|dà shēng] ~ [大|おお]きな [声|こえ] ~ d.f2
old ~ viejo ~ velho ~ alt ~ [老|lǎo] ~ [年|とし] を とった ~ d.f3
lost ~ perdido ~ perdido ~ verloren ~ [失去|shī qù] ~ なくした ~ d.f3
to puff up ~ inflarse ~ inflar-se ~ sich aufblähen ~ [鼓|gǔ] [起来|qǐ lai] ~ ふくらむ ~ f.coach
from above ~ por arriba ~ por cima ~ von oben ~ [从|cóng] [上面|shàng miàn] ~ [上|うえ] から ~ f.coach
to attack ~ atacar ~ atacar ~ angreifen ~ [攻击|gōng jī] ~ [攻撃|こうげき] する ~ f.coach
plan ~ el plan ~ o plano ~ der Plan ~ [计划|jì huà] ~ [計画|けいかく] ~ f.coach
dust ~ el polvo ~ a poeira ~ der Staub ~ [灰|huī] ~ [灰|はい] ~ f.plan
prediction ~ la predicción ~ a previsão ~ die Vorhersage ~ [预言|yù yán] ~ [予言|よげん] ~ f.phase2
never again ~ nunca más ~ nunca mais ~ nie wieder ~ [再|zài] [也|yě] [不会|bù huì] ~ [二度|にど]と ~ f.d1
the opposite ~ lo contrario ~ o contrário ~ das Gegenteil ~ [相反|xiāng fǎn] ~ [反対|はんたい] ~ f.promise
sure ~ seguro ~ certo ~ sicher ~ [肯定|kěn dìng] ~ [信|しん]じて いた ~ f.win
to keep ~ guardar ~ guardar ~ aufbewahren ~ [留|liú] ~ とって おく ~ f.win
mud flat ~ el lodazal ~ o lodaçal ~ das Watt ~ [泥滩|ní tān] ~ [干潟|ひがた] ~ look.mud
crack (in the mud) ~ la grieta ~ a rachadura ~ der Riss ~ [裂纹|liè wén] ~ ひび ~ look.crack
wreck ~ el casco ~ o casco ~ das Wrack ~ [残骸|cán hái] ~ [残骸|ざんがい] ~ look.boat
paper lantern ~ el farol de papel ~ a lanterna de papel ~ die Papierlaterne ~ [纸灯笼|zhǐ dēng long] ~ ちょうちん ~ look.lantern
dry reeds ~ los juncos secos ~ os juncos secos ~ das trockene Schilf ~ [干|gān] [芦苇|lú wěi] ~ [枯|か]れた [葦|あし] ~ look.reeds
torn net ~ la red rota ~ a rede rasgada ~ das kaputte Netz ~ [破|pò] [渔网|yú wǎng] ~ [破|やぶ]れた [網|あみ] ~ look.net
sign ~ el letrero ~ a placa ~ das Schild ~ [牌子|pái zi] ~ [看板|かんばん] ~ look.sign
closed ~ cerrado ~ fechado ~ geschlossen ~ [关门|guān mén] ~ [休業|きゅうぎょう] ~ look.sign
until tomorrow ~ hasta mañana ~ até amanhã ~ bis morgen ~ [明天|míng tiān] [见|jiàn] ~ [明日|あした] まで ~ look.sign`;
  // the table keys teach their words when said (time_lake.js LAKET.teach)
  const stamp = (O, pre = '') => Object.entries(O).forEach(([k, T0]) => { if (T0 && typeof T0 === 'object') T0._k = pre + k; });
  stamp(LINES); stamp(DEMO); stamp(LOOKS); stamp(SEALQ, 'q.'); stamp(FIGHT, 'f.');
  const en = (T0, l) => (T0 && (T0['en_' + l] || T0.en)) || '';
  return { L, CAST, LINES, DEMO, MARKS, CARDS, TIPS, TASKS, PLAN, ROOMS, SEALQ, SEALQ_MARKS, FIGHT, BOSSQ, SPECIES, NAMES, LORE, LOOKS, WORDS, en };
})();
