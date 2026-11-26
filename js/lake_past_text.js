'use strict';
// The Mirror Lake, long ago: the words (DESIGN.md 18.10 "T2a", game/TIME.md "The Mirror Lake long ago and tomorrow"). Every line in
// es / pt / de, zh and ja in CJK.md's notation, and the English the weave mixes from ({w.lp_*}: this world's words, registered in
// Mimo's memory by time_lake.js from WORDS below). lake_past.js is the place, lake_past_dungeon.js the frogs' grotto,
// lake_time_boss.js the Frog King; time_lake.js (LAKET) says, demonstrates and grades them (MOLT.grade).
// The grammar rung (TIME.md §8): irregular preterites (es fui, hice, tuve, estuve, dije, vine, pude; and puse, traje), people
// asking what YOU did (you answer in the 1st person) and telling what others did (the 3rd person); {mimo}'s memories are
// irregular too («{mimo} puso…», «fue…», «trajo…», «dijo…»), and the Frog King is told what he did, to his face (the 2nd person).
// pt: the irregular perfeito (fui, fiz, tive, estive, disse, vim, pude, pus, trouxe); de: irregular participles with haben / sein
// (gekommen, gegangen, gerufen, gefunden, geschwommen…) and the Präteritum of sein / haben / können (war, hatte, konnte); zh: 了
// with verbs of moving (来了, 回来了, 钻过去了) and 过 for experience (去过, 来过, 见过); ja: the た-form's sound changes (行った,
// 来た, した, 呼んだ, 歩いた, 泳いだ, 置いた, 言った, 飲んだ).
// The cast (each language names its own): the ferryman (Bartolo's father) and young Bartolo, young Marina (today's village head),
// the boat builder (Vicente's father), the net mender, young Pepe the fisherman, and Elio's dad, searching the shore.
const LPTXT = (() => {
  const L = (en, es, pt, de, zh, ja, o) => Object.assign({ en, es, pt, de, zh, ja }, o || {});
  const CAST = {
    ferryman: L('Ismael', 'don Ismael', 'seu Jacó', 'Fährmann Jost', '[周|Zhōu] [师傅|shī fu]', 'ゲン さん'),
    bartolo: L('young Bartolo', 'Bartolito', 'Bartolinho', 'Bartolo', '[小|xiǎo] [巴托洛|Bā tuō luò]', 'バルトロ くん'),
    marina: L('young Marina', 'Marinita', 'Marininha', 'Marina', '[小|xiǎo] [玛丽娜|Mǎ lì nà]', 'マリーナ ちゃん'),
    builder: L('Anselmo', 'maestro Anselmo', 'mestre Quim', 'Bootsbauer Ewald', '[唐|Táng] [师傅|shī fu]', 'ゴロウ さん'),
    mender: L('Remedios', 'doña Remedios', 'dona Cida', 'Frau Elsbeth', '[何|Hé] [大婶|dà shěn]', 'ミツ さん'),
    pepe: L('young Pepe', 'Pepe', 'Pepe', 'Pepe', '[佩佩|Pèi pèi]', 'ペペ'),
    dad: L('Elio’s dad', 'el papá de Elio', 'o pai do Elio', 'Elios Papa', '[艾利欧|Ài lì ōu] [的|de] [爸爸|bà ba]', 'エリオ くん の お[父|とう]さん'),
  };
  // ------------------------------------------------------------ what people say (mixed by the weave; EN on request)
  const LINES = {
    // the ferryman, at the ferry dock (the main path)
    'ferryman.hello': L('Good afternoon! The {w.lp_ferry} isn’t going out today: the {w.water} is too {w.lp_low}. This {w.lp_winter} the lake went down a lot.',
      '¡Buenas tardes! Hoy el ferry no sale: el agua está muy baja. Este invierno el lago bajó mucho.',
      'Boa tarde! Hoje a balsa não sai: a água está baixa demais. Neste inverno o lago baixou muito.',
      'Guten Tag! Die Fähre fährt heute nicht: Das Wasser ist zu niedrig. Diesen Winter ist der See stark gesunken.',
      '[你好|nǐ hǎo] ！ [今天|jīn tiān] [渡船|dù chuán] [不|bù] [开|kāi] ： [水|shuǐ] [太|tài] [低|dī] [了|le] 。 [今年|jīn nián] [冬天|dōng tiān] [湖水|hú shuǐ] [降|jiàng] [了|le] [很多|hěn duō] 。',
      'こんにちは ！ [今日|きょう] は フェリー を [出|だ]さない よ 。 [水|みず] が [低|ひく]すぎる ん だ 。 この [冬|ふゆ] 、 [湖|みずうみ] が ずいぶん [下|さ]がった 。'),
    'ferryman.go': L('The boy hid in the {w.lp_grotto} on the {w.lp_little_island}. Since then the {w.lp_frog_king} croaks there all night: last night he made so much {w.lp_noise} that nobody slept. The {w.lp_sandbar} is {w.lp_dry} this winter: walk out from the end of the pier.',
      'El niño se escondió en la gruta de la isla chica. Desde entonces el rey sapo croa allí toda la noche: anoche hizo tanto ruido que nadie durmió. Este invierno el banco de arena está seco: sal caminando desde el final del muelle.',
      'O menino se escondeu na gruta da ilhota. Desde então o rei sapo coaxa lá a noite toda: ontem à noite ele fez tanto barulho que ninguém dormiu. Neste inverno o banco de areia está seco: vai andando do fim do píer.',
      'Der Junge hat sich in der Grotte auf der kleinen Insel versteckt. Seitdem quakt dort der Froschkönig die ganze Nacht: Gestern Nacht war er so laut, dass niemand geschlafen hat. Diesen Winter ist die Sandbank trocken: Geh vom Ende des Stegs aus hinüber.',
      '[那个|nà ge] [男孩|nán hái] [躲|duǒ] [进|jìn] [了|le] [小岛|xiǎo dǎo] [上|shàng] [的|de] [洞穴|dòng xué] 。 [从|cóng] [那|nà] [以后|yǐ hòu] ， [蛙王|wā wáng] [整夜|zhěng yè] [在|zài] [那里|nà lǐ] [叫|jiào] ： [昨天|zuó tiān] [晚上|wǎn shang] [他|tā] [吵|chǎo] [得|de] [谁|shéi] [都|dōu] [没|méi] [睡|shuì] [着|zháo] 。 [今年|jīn nián] [冬天|dōng tiān] [沙洲|shā zhōu] [是|shì] [干|gān] [的|de] ： [从|cóng] [码头|mǎ tóu] [尽头|jìn tóu] [走|zǒu] [过去|guò qu] [吧|ba] 。',
      'あの [子|こ] は [小島|こじま] の [洞窟|どうくつ] に [隠|かく]れた 。 それ から 、 カエル の [王様|おうさま] が [一晩中|ひとばんじゅう] [鳴|な]いて いる 。 ゆうべ は うるさくて 、 だれ も [眠|ねむ]れなかった 。 この [冬|ふゆ] は [砂州|さす] が [乾|かわ]いて いる 。 [桟橋|さんばし] の [先|さき] から [歩|ある]いて [行|い]け 。'),
    'ferryman.again': L('The {w.lp_sandbar} starts at the end of the pier. Go on: the boy’s {w.lp_little_island} is waiting.',
      'El banco de arena empieza al final del muelle. Anda: la isla chica del niño te espera.',
      'O banco de areia começa no fim do píer. Vai: a ilhota do menino está te esperando.',
      'Die Sandbank fängt am Ende des Stegs an. Geh nur: Die kleine Insel des Jungen wartet.',
      '[沙洲|shā zhōu] [从|cóng] [码头|mǎ tóu] [尽头|jìn tóu] [开始|kāi shǐ] 。 [去|qù] [吧|ba] ： [男孩|nán hái] [的|de] [小岛|xiǎo dǎo] [在|zài] [等|děng] [你|nǐ] 。',
      '[砂州|さす] は [桟橋|さんばし] の [先|さき] から [始|はじ]まる 。 さあ 、 [行|い]け 。 あの [子|こ] の [小島|こじま] が [待|ま]って いる 。'),
    'ferryman.ask': L('Ask around. Three people saw him: {mender}, mending nets on the beach; young Pepe, fishing off the pier; and little Marina, on the dry shore.',
      'Pregunta por ahí. Tres personas lo vieron: doña Remedios, que remienda redes en la playa; Pepe, que pesca en el muelle; y Marinita, en la orilla seca.',
      'Pergunta por aí. Três pessoas viram o menino: a dona Cida, que remenda redes na praia; o Pepe, que pesca no píer; e a Marininha, na margem seca.',
      'Frag herum. Drei Leute haben ihn gesehen: Frau Elsbeth, die am Strand Netze flickt; Pepe, der am Steg angelt; und die kleine Marina am trockenen Ufer.',
      '[去|qù] [问问|wèn wen] [吧|ba] 。 [有|yǒu] [三|sān] [个|gè] [人|rén] [看见|kàn jiàn] [过|guo] [他|tā] ： [在|zài] [沙滩|shā tān] [上|shàng] [补|bǔ] [渔网|yú wǎng] [的|de] [何|Hé] [大婶|dà shěn] ， [在|zài] [码头|mǎ tóu] [钓鱼|diào yú] [的|de] [佩佩|Pèi pèi] ， [还有|hái yǒu] [干|gān] [岸边|àn biān] [的|de] [小|xiǎo] [玛丽娜|Mǎ lì nà] 。',
      'まわり に [聞|き]いて みな 。 あの [子|こ] を [見|み]た [人|ひと] が [三人|さんにん] いる 。 [浜|はま] で [網|あみ] を つくろって いる ミツ さん 、 [桟橋|さんばし] で [釣|つ]り を して いる ペペ 、 それ に [乾|かわ]いた [岸|きし] に いる マリーナ ちゃん だ 。'),
    'vicente.bench': L('That bench? My father built it, long ago, the winter the lake went down. For a man who waited on the shore every evening, he said. I still oil it every spring.',
      '¿Ese banco? Lo hizo mi padre, hace mucho, el invierno que bajó el lago. Para un hombre que esperaba cada tarde en la orilla, decía. Yo todavía lo aceito cada primavera.',
      'Aquele banco? Meu pai fez, há muito tempo, no inverno em que o lago baixou. Pra um homem que esperava toda tarde na margem, ele dizia. Eu ainda passo óleo nele toda primavera.',
      'Die Bank? Die hat mein Vater gebaut, vor langer Zeit, in dem Winter, als der See gesunken ist. Für einen Mann, der jeden Abend am Ufer gewartet hat, hat er gesagt. Ich öle sie immer noch jeden Frühling.',
      '[那|nà] [张|zhāng] [长椅|cháng yǐ] ？ [是|shì] [我|wǒ] [爸爸|bà ba] [做|zuò] [的|de] ， [很久|hěn jiǔ] [以前|yǐ qián] ， [湖水|hú shuǐ] [降|jiàng] [下去|xià qu] [的|de] [那|nà] [年|nián] [冬天|dōng tiān] 。 [他|tā] [说|shuō] ， [是|shì] [给|gěi] [一个|yī gè] [每天|měi tiān] [傍晚|bàng wǎn] [在|zài] [岸边|àn biān] [等|děng] [人|rén] [的|de] [男人|nán rén] [做|zuò] [的|de] 。 [我|wǒ] [现在|xiàn zài] [每年|měi nián] [春天|chūn tiān] [还|hái] [给|gěi] [它|tā] [上|shàng] [油|yóu] 。',
      'あの ベンチ か ？ ずっと [昔|むかし] 、 [湖|みずうみ] が [下|さ]がった [冬|ふゆ] に 、 [親父|おやじ] が [作|つく]った ん だ 。 [毎日|まいにち] [夕方|ゆうがた] 、 [岸|きし] で [待|ま]って いた [男|おとこ] の [人|ひと] の ため だ って 。 おれ は [今|いま] でも [毎年|まいとし] [春|はる] に [油|あぶら] を ぬって いる よ 。'),
    'ferryman.son': L('My {w.lp_son} wants to be a {w.lp_ferryman} like me. Like my father, and my {w.lp_grandfather}.',
      'Mi hijo quiere ser barquero como yo. Como mi padre, y como mi abuelo.',
      'O meu filho quer ser barqueiro igual a mim. Igual ao meu pai e ao meu avô.',
      'Mein Sohn will Fährmann werden wie ich. Wie mein Vater und mein Großvater.',
      '[我|wǒ] [儿子|ér zi] [想|xiǎng] [像|xiàng] [我|wǒ] [一样|yī yàng] [当|dāng] [船夫|chuán fū] 。 [像|xiàng] [我|wǒ] [爸爸|bà ba] ， [像|xiàng] [我|wǒ] [爷爷|yé ye] 。',
      '[息子|むすこ] は おれ みたい な [船頭|せんどう] に なりたい ん だ 。 おれ の [親父|おやじ] や 、 おじいさん みたい に 。'),
    'ferryman.after': L('The frogs are quiet tonight. And you know what? That man… he stopped on the {w.lp_shore} and looked at the island. I think he heard something.',
      'Esta noche las ranas están calladas. ¿Y sabes qué? Ese hombre… se paró en la orilla y miró la isla. Creo que oyó algo.',
      'Hoje à noite os sapos estão quietos. E sabe? Aquele homem… parou na margem e olhou a ilha. Acho que ele ouviu alguma coisa.',
      'Heute Nacht sind die Frösche still. Und weißt du was? Der Mann … ist am Ufer stehen geblieben und hat zur Insel geschaut. Ich glaube, er hat etwas gehört.',
      '[今天|jīn tiān] [晚上|wǎn shang] [青蛙|qīng wā] [都|dōu] [不|bù] [叫|jiào] [了|le] 。 [你|nǐ] [知道|zhī dào] [吗|ma] ？ [那个|nà ge] [男人|nán rén] … [在|zài] [岸边|àn biān] [停|tíng] [下来|xià lai] ， [看|kàn] [着|zhe] [小岛|xiǎo dǎo] 。 [我|wǒ] [想|xiǎng] [他|tā] [听见|tīng jiàn] [了|le] [什么|shén me] 。',
      '[今夜|こんや] は カエル が [静|しず]か だ 。 それ に な 、 あの [男|おとこ] の [人|ひと] … [岸|きし] で [立|た]ち[止|ど]まって 、 [島|しま] を [見|み]た 。 [何|なに]か [聞|き]こえた ん だ と [思|おも]う 。'),
    // the net mender, on the beach
    'mender.hello': L('Careful with my {w.lp_net}! I mend nets {w.lp_every_day}, with this big {w.lp_needle}… and every {w.lp_evening} I watch the {w.lp_shore}.',
      '¡Cuidado con mi red! Remiendo redes cada día, con esta aguja grande… y cada tarde miro la orilla.',
      'Cuidado com a minha rede! Eu remendo redes todo dia, com esta agulha grande… e toda tarde eu olho a margem.',
      'Vorsicht mit meinem Netz! Ich flicke jeden Tag Netze, mit dieser großen Nadel … und jeden Abend schaue ich aufs Ufer.',
      '[小心|xiǎo xīn] [我|wǒ] [的|de] [渔网|yú wǎng] ！ [我|wǒ] [每天|měi tiān] [用|yòng] [这|zhè] [根|gēn] [大|dà] [针|zhēn] [补|bǔ] [渔网|yú wǎng] … [每天|měi tiān] [傍晚|bàng wǎn] [我|wǒ] [都|dōu] [看|kàn] [着|zhe] [岸边|àn biān] 。',
      '[網|あみ] に [気|き] を つけて ね ！ [毎日|まいにち] 、 この [大|おお]きな [針|はり] で [網|あみ] を つくろって いる の 。 [夕方|ゆうがた] に は いつも [岸|きし] を [見|み]て いる わ 。'),
    'mender.after': L('That man still comes every {w.lp_evening}. But last night he smiled a little. Who knows why.',
      'Ese hombre sigue viniendo cada tarde. Pero anoche sonrió un poco. Quién sabe por qué.',
      'Aquele homem ainda vem toda tarde. Mas ontem à noite ele sorriu um pouco. Quem sabe por quê.',
      'Der Mann kommt immer noch jeden Abend. Aber gestern Abend hat er ein bisschen gelächelt. Wer weiß, warum.',
      '[那个|nà ge] [男人|nán rén] [还是|hái shì] [每天|měi tiān] [傍晚|bàng wǎn] [来|lái] 。 [可是|kě shì] [昨天|zuó tiān] [晚上|wǎn shang] [他|tā] [笑|xiào] [了|le] [一下|yī xià] 。 [谁|shéi] [知道|zhī dào] [为什么|wèi shén me] 。',
      'あの [人|ひと] は 、 まだ [毎日|まいにち] [夕方|ゆうがた] に [来|く]る わ 。 でも ゆうべ は 、 [少|すこ]し [笑|わら]った の 。 どうして かしら ね 。'),
    // young Pepe the fisherman, on the main pier
    'pepe.hello': L('I’m a {w.lp_fisherman}, like my dad. My {w.lp_fishing_rod} is new… and I already lost a {w.lp_hook} a week ago.',
      'Soy pescador, como mi papá. Mi caña es nueva… y ya perdí un anzuelo hace una semana.',
      'Eu sou pescador, igual ao meu pai. A minha vara de pescar é nova… e eu já perdi um anzol há uma semana.',
      'Ich bin Fischer, wie mein Papa. Meine Angel ist neu … und vor einer Woche habe ich schon einen Haken verloren.',
      '[我|wǒ] [是|shì] [渔夫|yú fū] ， [跟|gēn] [我|wǒ] [爸爸|bà ba] [一样|yī yàng] 。 [我|wǒ] [的|de] [鱼竿|yú gān] [是|shì] [新|xīn] [的|de] … [一个|yī gè] [星期|xīng qī] [前|qián] [我|wǒ] [已经|yǐ jīng] [丢|diū] [了|le] [一|yī] [个|gè] [鱼钩|yú gōu] 。',
      'おれ は [漁師|りょうし] だ 。 [親父|おやじ] と [同|おな]じ さ 。 [釣|つ]り[竿|ざお] は [新|あたら]しい けど … [一週間前|いっしゅうかんまえ] に もう [釣|つ]り[針|ばり] を なくした 。'),
    'pepe.after': L('Lots of fish today: the frogs are quiet, and the fish came back. Funny, right?',
      'Hoy hay muchos peces: las ranas están calladas, y los peces volvieron. Qué curioso, ¿no?',
      'Hoje tem muito peixe: os sapos estão quietos, e os peixes voltaram. Engraçado, né?',
      'Heute beißen sie: Die Frösche sind still, und die Fische sind zurückgekommen. Komisch, oder?',
      '[今天|jīn tiān] [鱼|yú] [很多|hěn duō] ： [青蛙|qīng wā] [安静|ān jìng] [了|le] ， [鱼|yú] [也|yě] [回来|huí lai] [了|le] 。 [真|zhēn] [奇怪|qí guài] ， [对|duì] [吧|ba] ？',
      '[今日|きょう] は よく [釣|つ]れる 。 カエル が [静|しず]か に なって 、 [魚|さかな] が [戻|もど]って [来|き]た ん だ 。 [不思議|ふしぎ] だろ ？'),
    // young Marina, on the dry shore (today she's the head of the village, and her house is yellow)
    'marina.hello': L('Look, the {w.lp_lake_bed} is all {w.lp_dry}! You can walk on the {w.lp_mud} and find the {w.lp_pretty} shells.',
      '¡Mira, el fondo del lago está todo seco! Se puede caminar por el barro y encontrar las conchas bonitas.',
      'Olha, o fundo do lago está todo seco! Dá pra andar na lama e achar as conchas bonitas.',
      'Schau, der Seegrund ist ganz trocken! Man kann über den Schlamm laufen und die hübschen Muscheln finden.',
      '[你|nǐ] [看|kàn] ， [湖底|hú dǐ] [全|quán] [干|gān] [了|le] ！ [可以|kě yǐ] [在|zài] [泥|ní] [上|shàng] [走|zǒu] ， [找|zhǎo] [漂亮|piào liang] [的|de] [贝壳|bèi ké] 。',
      '[見|み]て 、 [湖底|こてい] が ぜんぶ [乾|かわ]いて る ！ [泥|どろ] の [上|うえ] を [歩|ある]いて 、 きれい な [貝殻|かいがら] を [見|み]つけられる の 。'),
    'marina.after': L('When I grow up I’ll be the {w.lp_village_head}! And I’ll live in the yellow house at the end of the pier, my grandma’s.',
      '¡Cuando sea grande seré la jefa del pueblo! Y viviré en la casa amarilla del final del muelle, la de mi abuela.',
      'Quando eu crescer, vou ser a chefe do vilarejo! E vou morar na casa amarela do fim do píer, a da minha avó.',
      'Wenn ich groß bin, werde ich die Chefin vom Dorf! Und ich wohne dann im gelben Haus am Ende des Stegs, dem von meiner Oma.',
      '[我|wǒ] [长大|zhǎng dà] [以后|yǐ hòu] [要|yào] [当|dāng] [村长|cūn zhǎng] ！ [还|hái] [要|yào] [住|zhù] [在|zài] [码头|mǎ tóu] [尽头|jìn tóu] [那|nà] [座|zuò] [黄|huáng] [房子|fáng zi] [里|lǐ] ， [我|wǒ] [奶奶|nǎi nai] [的|de] [房子|fáng zi] 。',
      '[大|おお]きく なったら 、 [村長|そんちょう] に なる の ！ それ で 、 [桟橋|さんばし] の [先|さき] の [黄色|きいろ] い [家|いえ] に [住|す]む の 。 おばあちゃん の [家|いえ] よ 。'),
    // young Bartolo, the ferryman's son (today's Bartolo)
    'bartolo.hello': L('I’ll be a {w.lp_ferryman} like my dad! I can already row… a little.',
      '¡Voy a ser barquero como mi papá! Ya sé remar… un poquito.',
      'Eu vou ser barqueiro igual ao meu pai! Eu já sei remar… um pouquinho.',
      'Ich werde Fährmann wie mein Papa! Ich kann schon rudern … ein bisschen.',
      '[我|wǒ] [要|yào] [像|xiàng] [我|wǒ] [爸爸|bà ba] [一样|yī yàng] [当|dāng] [船夫|chuán fū] ！ [我|wǒ] [已经|yǐ jīng] [会|huì] [划船|huá chuán] [了|le] … [一点点|yī diǎn diǎn] 。',
      'ぼく 、 お[父|とう]さん みたい な [船頭|せんどう] に なる ん だ ！ もう こげる よ … ちょっと だけ 。'),
    'bartolo.oarLost': L('My little {w.oar} fell in! Splash! I saw it go… and now I can’t find it. Can {mimo} look?',
      '¡Se me cayó mi remito! ¡Plaf! Lo vi caer… y ahora no lo encuentro. ¿{mimo} puede buscarlo?',
      'O meu remozinho caiu! Tchibum! Eu vi cair… e agora não acho. O {mimo} pode procurar?',
      'Mein kleines Ruder ist reingefallen! Platsch! Ich hab’s fallen sehen … und jetzt finde ich es nicht. Kann {mimo} suchen?',
      '[我|wǒ] [的|de] [小|xiǎo] [桨|jiǎng] [掉|diào] [下去|xià qu] [了|le] ！ [扑通|pū tōng] ！ [我|wǒ] [看见|kàn jiàn] [它|tā] [掉|diào] [了|le] … [现在|xiàn zài] [找不到|zhǎo bù dào] [了|le] 。 {mimo} [能|néng] [帮|bāng] [我|wǒ] [找|zhǎo] [吗|ma] ？',
      'ぼく の [小|ちい]さい オール が [落|お]ちちゃった ！ ポチャン ！ [落|お]ちる の は [見|み]た けど … もう [見|み]つからない 。 {mimo} 、 [探|さが]して くれる ？'),
    'bartolo.oarThanks': L('My oar! Thank you! All {w.lp_wet}… I’ll be {w.lp_the_best} ferryman on the lake!',
      '¡Mi remo! ¡Gracias! Todo mojado… ¡Seré el mejor barquero del lago!',
      'O meu remo! Obrigado! Todo molhado… Eu vou ser o melhor barqueiro do lago!',
      'Mein Ruder! Danke! Ganz nass … Ich werde der beste Fährmann am See!',
      '[我|wǒ] [的|de] [桨|jiǎng] ！ [谢谢|xiè xie] ！ [全|quán] [湿|shī] [了|le] … [我|wǒ] [要|yào] [当|dāng] [湖|hú] [上|shàng] [最|zuì] [棒|bàng] [的|de] [船夫|chuán fū] ！',
      'ぼく の オール ！ ありがとう ！ びしょ ぬれ だ … ぼく 、 [湖|みずうみ] で いちばん の [船頭|せんどう] に なる よ ！'),
    'bartolo.after': L('The king gave the voice back! I’m going to tell everyone. Well… first my dad.',
      '¡El rey devolvió la voz! Voy a contárselo a todos. Bueno… primero a mi papá.',
      'O rei devolveu a voz! Vou contar pra todo mundo. Bom… primeiro pro meu pai.',
      'Der König hat die Stimme zurückgegeben! Ich erzähle es allen. Also … zuerst meinem Papa.',
      '[蛙王|wā wáng] [把|bǎ] [声音|shēng yīn] [还|huán] [回来|huí lai] [了|le] ！ [我|wǒ] [要|yào] [告诉|gào su] [大家|dà jiā] 。 [不过|bù guò] … [先|xiān] [告诉|gào su] [我|wǒ] [爸爸|bà ba] 。',
      '[王様|おうさま] が [声|こえ] を [返|かえ]した ！ みんな に [話|はな]す よ 。 えっと … まず お[父|とう]さん に 。'),
    // the boat builder, by his shed (Vicente's father): the waiting bench
    'builder.hello': L('I’m the {w.lp_boat_builder}. Boats, docks, benches… if it’s {w.lp_wood}, I make it. Hand me that {w.lp_saw}, would you?',
      'Soy el carpintero de barcos. Barcas, muelles, bancos… si es de madera, lo hago yo. ¿Me pasas esa sierra?',
      'Eu sou o carpinteiro de barcos. Barcos, píeres, bancos… se é de madeira, eu faço. Me passa aquela serra?',
      'Ich bin der Bootsbauer. Boote, Stege, Bänke … wenn es aus Holz ist, mache ich es. Gibst du mir mal die Säge?',
      '[我|wǒ] [是|shì] [造船|zào chuán] [木匠|mù jiang] 。 [船|chuán] 、 [码头|mǎ tóu] 、 [长椅|cháng yǐ] … [只要|zhǐ yào] [是|shì] [木头|mù tou] [的|de] ， [我|wǒ] [都|dōu] [做|zuò] 。 [把|bǎ] [那|nà] [把|bǎ] [锯|jù] [递|dì] [给|gěi] [我|wǒ] [好|hǎo] [吗|ma] ？',
      'おれ は [船大工|ふなだいく] だ 。 [船|ふね] 、 [桟橋|さんばし] 、 ベンチ … [木|き] の もの なら 、 なんでも [作|つく]る 。 その のこぎり 、 [取|と]って くれる か ？'),
    'builder.ask': L('Could {mimo} bring me the {w.lp_plank}? It’s by my {w.lp_shed}, and my {w.lp_back} hurts.',
      '¿{mimo} me trae las tablas? Están junto a mi cobertizo, y me duele la espalda.',
      'O {mimo} pode me trazer as tábuas? Estão do lado do meu galpão, e as minhas costas doem.',
      'Kann {mimo} mir die Bretter bringen? Sie liegen an meinem Schuppen, und mein Rücken tut weh.',
      '{mimo} [能|néng] [帮|bāng] [我|wǒ] [把|bǎ] [木板|mù bǎn] [拿|ná] [过来|guò lai] [吗|ma] ？ [就|jiù] [在|zài] [我|wǒ] [的|de] [棚子|péng zi] [旁边|páng biān] ， [我|wǒ] [腰|yāo] [疼|téng] 。',
      '{mimo} 、 [板|いた] を [持|も]って [来|き]て くれる か ？ [小屋|こや] の そば に ある 。 [腰|こし] が [痛|いた]くて な 。'),
    'builder.carve': L('There. Now I’ll carve the {w.lp_words}: «For whoever waits». So he never waits standing up again.',
      'Listo. Ahora tallo las palabras: «Para quien espera». Para que nunca más espere de pie.',
      'Pronto. Agora eu entalho as palavras: «Para quem espera». Pra ele nunca mais esperar em pé.',
      'So. Jetzt schnitze ich die Worte hinein: «Für den, der wartet». Damit er nie wieder im Stehen wartet.',
      '[好|hǎo] [了|le] 。 [现在|xiàn zài] [我|wǒ] [刻|kè] [上|shàng] [这|zhè] [几|jǐ] [个|gè] [字|zì] ： “ [给|gěi] [等待|děng dài] [的|de] [人|rén] ” 。 [让|ràng] [他|tā] [再|zài] [也|yě] [不用|bù yòng] [站|zhàn] [着|zhe] [等|děng] 。',
      'よし 。 [今|いま] から [言葉|ことば] を [彫|ほ]る 。 「 [待|ま]つ [人|ひと] の ため に 」 。 もう [立|た]った まま [待|ま]たなくて いい ように な 。'),
    'builder.done': L('A good {w.lp_bench} lasts a hundred years. {w.lp_maybe} someone will sit on it a long time from now, and wonder who made it.',
      'Un buen banco dura cien años. Quizás alguien se siente aquí dentro de mucho tiempo y se pregunte quién lo hizo.',
      'Um bom banco dura cem anos. Talvez alguém se sente aqui daqui a muito tempo e se pergunte quem fez.',
      'Eine gute Bank hält hundert Jahre. Vielleicht sitzt in ferner Zeit jemand darauf und fragt sich, wer sie gebaut hat.',
      '[一|yī] [张|zhāng] [好|hǎo] [长椅|cháng yǐ] [能|néng] [用|yòng] [一百|yī bǎi] [年|nián] 。 [也许|yě xǔ] [很久|hěn jiǔ] [以后|yǐ hòu] [有|yǒu] [人|rén] [坐|zuò] [在|zài] [这里|zhè lǐ] ， [想|xiǎng] [知道|zhī dào] [是|shì] [谁|shéi] [做|zuò] [的|de] 。',
      'いい ベンチ は [百年|ひゃくねん] もつ 。 ずっと [先|さき] に 、 だれか が ここ に [座|すわ]って 、 だれ が [作|つく]った ん だろう と [思|おも]う かも な 。'),
    // Elio's dad, on the shore, looking at the island
    'dad.1': L('Excuse me… did you see a {w.lp_boy} with a red {w.cap}? He came to the lake {w.lp_with_me}… and then he went off.',
      'Perdona… ¿viste a un niño con una gorra roja? Vino conmigo al lago… y luego se fue.',
      'Com licença… você viu um menino de boné vermelho? Ele veio comigo ao lago… e depois foi embora.',
      'Entschuldige … hast du einen Jungen mit einer roten Mütze gesehen? Er ist mit mir an den See gekommen … und dann ist er weggegangen.',
      '[打扰|dǎ rǎo] [一下|yī xià] … [你|nǐ] [看见|kàn jiàn] [过|guo] [一个|yī gè] [戴|dài] [红|hóng] [帽子|mào zi] [的|de] [男孩|nán hái] [吗|ma] ？ [他|tā] [跟|gēn] [我|wǒ] [来|lái] [了|le] [湖|hú] [边|biān] … [后来|hòu lái] [就|jiù] [走|zǒu] [了|le] 。',
      'すみません … [赤|あか]い [帽子|ぼうし] の [男|おとこ] の [子|こ] を [見|み]ません でした か ？ いっしょ に [湖|みずうみ] へ [来|き]た ん です が … どこか へ [行|い]って しまって 。'),
    'dad.2': L('He’s a {w.lp_quiet} boy. He’s hardly talked since the {w.lp_concert}. But he’s {w.lp_kind}… and I’m so {w.lp_tired}.',
      'Es un niño callado. Desde el concierto casi no habla. Pero es amable… y yo estoy tan cansado.',
      'Ele é um menino calado. Desde o concerto quase não fala. Mas ele é gentil… e eu estou tão cansado.',
      'Er ist ein stiller Junge. Seit dem Konzert redet er kaum. Aber er ist freundlich … und ich bin so müde.',
      '[他|tā] [是|shì] [个|gè] [不|bù] [爱|ài] [说话|shuō huà] [的|de] [孩子|hái zi] 。 [音乐会|yīn yuè huì] [以后|yǐ hòu] [他|tā] [几乎|jī hū] [不|bù] [说话|shuō huà] 。 [可是|kě shì] [他|tā] [心|xīn] [很|hěn] [好|hǎo] … [我|wǒ] [好|hǎo] [累|lèi] 。',
      '[無口|むくち] な [子|こ] です 。 コンサート の あと 、 ほとんど [話|はな]しません 。 でも [優|やさ]しい [子|こ] な ん です … わたし は もう 、 [疲|つか]れました 。'),
    'dad.3': L('Every {w.lp_evening} I call his name along the {w.lp_shore}. Maybe {w.lp_tonight} he’ll answer.',
      'Cada tarde llamo su nombre por la orilla. Quizás esta noche conteste.',
      'Toda tarde eu chamo o nome dele pela margem. Talvez hoje à noite ele responda.',
      'Jeden Abend rufe ich seinen Namen am Ufer entlang. Vielleicht antwortet er heute Nacht.',
      '[每天|měi tiān] [傍晚|bàng wǎn] [我|wǒ] [沿着|yán zhe] [岸边|àn biān] [喊|hǎn] [他|tā] [的|de] [名字|míng zi] 。 [也许|yě xǔ] [今天|jīn tiān] [晚上|wǎn shang] [他|tā] [会|huì] [回答|huí dá] 。',
      '[毎日|まいにち] [夕方|ゆうがた] 、 [岸|きし] で あの [子|こ] の [名前|なまえ] を [呼|よ]んで います 。 [今夜|こんや] は [答|こた]えて くれる かも しれません 。'),
    'dad.after': L('Did you hear that? For a moment I thought… no. It was the {w.lp_wind}. But I’ll wait a little longer.',
      '¿Oíste eso? Por un momento creí… no. Fue el viento. Pero voy a esperar un poco más.',
      'Você ouviu isso? Por um momento eu achei… não. Foi o vento. Mas vou esperar mais um pouco.',
      'Hast du das gehört? Einen Moment lang dachte ich … nein. Das war der Wind. Aber ich warte noch ein bisschen.',
      '[你|nǐ] [听见|tīng jiàn] [了|le] [吗|ma] ？ [刚才|gāng cái] [我|wǒ] [以为|yǐ wéi] … [不|bù] ， [是|shì] [风|fēng] 。 [不过|bù guò] [我|wǒ] [再|zài] [等|děng] [一下|yī xià] 。',
      '[今|いま] の 、 [聞|き]こえました か ？ [一瞬|いっしゅん] 、 [思|おも]った ん です … いいえ 。 [風|かぜ] でした 。 でも 、 もう [少|すこ]し [待|ま]ちます 。'),
  };
  // ------------------------------------------------------------ the demonstrations (whole in the language, the shown words glossed)
  // d.*: someone tells what happened (the 3rd person); q.*: their question to you (the 2nd person), right before the box
  const DEMO = {
    'd.ferry': L('Three days ago a man came to the lake. He went along the whole shore and called «Elio!» a hundred times. His boy was on the little island all day… but he couldn’t answer.',
      'Hace tres días un hombre vino al lago. Fue por toda la orilla y dijo «¡Elio!» cien veces. Su niño estuvo en la isla chica todo el día… pero no pudo contestar.',
      'Três dias atrás um homem veio ao lago. Foi pela margem toda e disse «Elio!» cem vezes. O menino dele esteve na ilhota o dia todo… mas não pôde responder.',
      'Vor drei Tagen ist ein Mann an den See gekommen. Er ist das ganze Ufer entlanggegangen und hat hundertmal «Elio!» gerufen. Sein Junge war den ganzen Tag auf der kleinen Insel … aber er konnte nicht antworten.',
      '[三|sān] [天|tiān] [前|qián] ， [一个|yī gè] [男人|nán rén] [来|lái] [了|le] [湖|hú] [边|biān] 。 [他|tā] [沿着|yán zhe] [岸边|àn biān] [走|zǒu] [了|le] [一|yī] [圈|quān] ， [喊|hǎn] [了|le] [一百|yī bǎi] [次|cì] “ [艾利欧|Ài lì ōu] ！ ” 。 [他|tā] [的|de] [儿子|ér zi] [一整天|yī zhěng tiān] [都|dōu] [在|zài] [小岛|xiǎo dǎo] [上|shàng] … [可是|kě shì] [没|méi] [能|néng] [回答|huí dá] 。',
      '[三日前|みっかまえ] 、 [男|おとこ] の [人|ひと] が [湖|みずうみ] に [来|き]た 。 [岸|きし] を ずっと [歩|ある]いて 、 「 エリオ ！ 」 と [百回|ひゃっかい] も [呼|よ]んだ 。 [息子|むすこ] は [一日中|いちにちじゅう] [小島|こじま] に いた … でも 、 [答|こた]えられなかった 。'),
    'q.ferry': L('And you? How did you come to the lake?', '¿Y tú? ¿Cómo viniste al lago?', 'E você? Como veio ao lago?', 'Und du? Wie bist du an den See gekommen?',
      '[你|nǐ] [呢|ne] ？ [你|nǐ] [怎么|zěn me] [来|lái] [了|le] ？', 'あんた は ？ どう やって [湖|みずうみ] へ [来|き]た ？'),
    'd.mender': L('That man came every evening. He was here until night. Yesterday he brought a lantern, and he said nothing… he just looked at the island.',
      'Ese hombre vino cada tarde. Estuvo aquí hasta la noche. Ayer trajo un farol y no dijo nada… solo miró la isla.',
      'Aquele homem veio toda tarde. Esteve aqui até a noite. Ontem ele trouxe um lampião e não disse nada… só olhou a ilha.',
      'Der Mann ist jeden Abend gekommen. Er war bis zur Nacht hier. Gestern hat er eine Laterne mitgebracht und nichts gesagt … er hat nur zur Insel geschaut.',
      '[那个|nà ge] [男人|nán rén] [每天|měi tiān] [傍晚|bàng wǎn] [都|dōu] [来|lái] 。 [他|tā] [一直|yī zhí] [待|dāi] [到|dào] [晚上|wǎn shang] 。 [昨天|zuó tiān] [他|tā] [拿来|ná lái] [了|le] [一|yī] [盏|zhǎn] [灯笼|dēng long] ， [一|yī] [句|jù] [话|huà] [也|yě] [没|méi] [说|shuō] … [只是|zhǐ shì] [看|kàn] [着|zhe] [小岛|xiǎo dǎo] 。',
      'あの [人|ひと] は [毎日|まいにち] [夕方|ゆうがた] に [来|き]た の 。 [夜|よる] まで ここ に いた わ 。 [昨日|きのう] は ランタン を [持|も]って [来|き]た けど 、 [何|なに] も [言|い]わなかった … [島|しま] を [見|み]て いた だけ 。'),
    'q.mender': L('And you? Were you here yesterday?', '¿Y tú? ¿Estuviste aquí ayer?', 'E você? Esteve aqui ontem?', 'Und du? Warst du gestern hier?',
      '[你|nǐ] [呢|ne] ？ [你|nǐ] [以前|yǐ qián] [来|lái] [过|guo] [这里|zhè lǐ] [吗|ma] ？', 'あなた は ？ [昨日|きのう] 、 ここ に [来|き]ました か ？',
      { en_zh: 'And you? Have you been here before?', en_ja: 'And you? Did you come here yesterday?' }),
    'd.pepe': L('I went out in my rowboat along the whole shore. I looked and looked… but I couldn’t see the boy. Then the frogs made a racket, and I came back.',
      'Yo fui en mi barca por toda la orilla. Busqué y busqué… pero no pude ver al niño. Luego las ranas hicieron un ruidazo, y volví.',
      'Eu fui no meu barco por toda a margem. Procurei e procurei… mas não pude ver o menino. Depois os sapos fizeram um barulhão, e eu voltei.',
      'Ich bin mit meinem Ruderboot am ganzen Ufer entlanggefahren. Ich habe gesucht und gesucht … aber ich konnte den Jungen nicht sehen. Dann haben die Frösche Krach gemacht, und ich bin zurückgekommen.',
      '[我|wǒ] [划|huá] [着|zhe] [小船|xiǎo chuán] [沿着|yán zhe] [岸边|àn biān] [找|zhǎo] [了|le] [一|yī] [圈|quān] 。 [找|zhǎo] [啊|a] [找|zhǎo] … [可是|kě shì] [没|méi] [看见|kàn jiàn] [那个|nà ge] [男孩|nán hái] 。 [后来|hòu lái] [青蛙|qīng wā] [吵|chǎo] [起来|qǐ lai] [了|le] ， [我|wǒ] [就|jiù] [回来|huí lai] [了|le] 。',
      'おれ は ボート で [岸|きし] を ぐるっと [回|まわ]った 。 [探|さが]して [探|さが]して … でも 、 あの [子|こ] は [見|み]えなかった 。 それ から カエル が さわいで 、 [帰|かえ]って [来|き]た 。'),
    'q.pepe': L('And you? Did you go to the little island?', '¿Y tú? ¿Fuiste a la isla chica?', 'E você? Foi até a ilhota?', 'Und du? Bist du zur kleinen Insel gegangen?',
      '[你|nǐ] [呢|ne] ？ [你|nǐ] [去|qù] [过|guo] [小岛|xiǎo dǎo] [吗|ma] ？', 'お[前|まえ] は ？ [島|しま] の [話|はなし] 、 だれか から [聞|き]いた ？',
      { en_zh: 'And you? Have you ever been to the little island?', en_ja: 'And you? Did you hear about the island from someone?' }),
    'd.marina': L('I made a little house of shells on the dry lake bed! The boy saw it… he smiled, but he didn’t say anything. Then the frog king said «Silence!», and he went away.',
      '¡Yo hice una casita de conchas en el fondo seco! El niño la vio… sonrió, pero no dijo nada. Luego el rey sapo dijo «¡Silencio!» y él se fue.',
      'Eu fiz uma casinha de conchas no fundo seco! O menino viu… sorriu, mas não disse nada. Depois o rei sapo disse «Silêncio!» e ele foi embora.',
      'Ich habe auf dem trockenen Seegrund ein Häuschen aus Muscheln gebaut! Der Junge hat es gesehen … er hat gelächelt, aber nichts gesagt. Dann hat der Froschkönig «Ruhe!» gerufen, und er ist weggegangen.',
      '[我|wǒ] [在|zài] [干|gān] [湖底|hú dǐ] [上|shàng] [用|yòng] [贝壳|bèi ké] [搭|dā] [了|le] [个|gè] [小房子|xiǎo fáng zi] ！ [那个|nà ge] [男孩|nán hái] [看见|kàn jiàn] [了|le] … [他|tā] [笑|xiào] [了|le] ， [可是|kě shì] [什么|shén me] [也|yě] [没|méi] [说|shuō] 。 [后来|hòu lái] [蛙王|wā wáng] [喊|hǎn] [了|le] [一|yī] [声|shēng] “ [安静|ān jìng] ！ ” ， [他|tā] [就|jiù] [走|zǒu] [了|le] 。',
      '[乾|かわ]いた [湖底|こてい] に 、 [貝殻|かいがら] で [小|ちい]さな [家|いえ] を [作|つく]った の ！ あの [子|こ] は それ を [見|み]て … [笑|わら]った けど 、 [何|なに] も [言|い]わなかった 。 それ から カエル の [王様|おうさま] が 「 しずか に ！ 」 と [言|い]って 、 あの [子|こ] は [行|い]っちゃった 。'),
    'q.marina': L('And you? What did you say when you got here?', '¿Y tú? ¿Qué dijiste cuando llegaste?', 'E você? O que você disse quando chegou?', 'Und du? Was hast du gerufen, als du gekommen bist?',
      '[你|nǐ] [呢|ne] ？ [你|nǐ] [来|lái] [的|de] [时候|shí hou] [说|shuō] [了|le] [什么|shén me] ？', 'あなた は ？ [来|き]た とき 、 [何|なん] て [言|い]った の ？',
      { en_de: 'And you? What did you call out when you came?' }),
    'd.bench': L('Yesterday I made the legs of a bench. Here, by the water. For that man: every evening he waits… standing up.',
      'Ayer hice las patas de un banco. Aquí, junto al agua. Para ese hombre: cada tarde espera… de pie.',
      'Ontem eu fiz os pés de um banco. Aqui, do lado da água. Pra aquele homem: toda tarde ele espera… em pé.',
      'Gestern habe ich die Beine einer Bank gebaut. Hier, am Wasser. Für den Mann: Jeden Abend wartet er … im Stehen.',
      '[昨天|zuó tiān] [我|wǒ] [做|zuò] [了|le] [一|yī] [张|zhāng] [长椅|cháng yǐ] [的|de] [腿|tuǐ] 。 [就|jiù] [在|zài] [这里|zhè lǐ] ， [水|shuǐ] [边|biān] 。 [给|gěi] [那个|nà ge] [男人|nán rén] ： [他|tā] [每天|měi tiān] [傍晚|bàng wǎn] [都|dōu] [站|zhàn] [着|zhe] [等|děng] 。',
      '[昨日|きのう] 、 ベンチ の [脚|あし] を [作|つく]った 。 ここ 、 [水|みず] の そば に な 。 あの [男|おとこ] の [人|ひと] の ため だ 。 [毎日|まいにち] [夕方|ゆうがた] 、 [立|た]った まま [待|ま]って いる から な 。'),
    'q.bench': L('Good work! And you, what did you do?', '¡Buen trabajo! ¿Y tú qué hiciste?', 'Bom trabalho! E você, o que fez?', 'Gute Arbeit! Und was hast du mir gebracht?',
      '[干|gàn] [得|de] [好|hǎo] ！ [你|nǐ] [做|zuò] [了|le] [什么|shén me] ？', 'よく やった ！ お[前|まえ] は [何|なに] を した ？',
      { en_de: 'Good work! And what did you bring me?' }),
    'd.shells': L('I lost three shells in the mud! The prettiest ones. I put them in my basket, and the basket tipped over…',
      '¡Perdí tres conchas en el barro! Las más bonitas. Las puse en mi cesta, y la cesta se cayó…',
      'Eu perdi três conchas na lama! As mais bonitas. Eu pus no meu cesto, e o cesto caiu…',
      'Ich habe drei Muscheln im Schlamm verloren! Die schönsten. Ich habe sie in meinen Korb getan, und der Korb ist umgefallen …',
      '[我|wǒ] [在|zài] [泥|ní] [里|lǐ] [丢|diū] [了|le] [三|sān] [个|gè] [贝壳|bèi ké] ！ [最|zuì] [漂亮|piào liang] [的|de] 。 [我|wǒ] [放|fàng] [进|jìn] [篮子|lán zi] [里|lǐ] ， [篮子|lán zi] [倒|dǎo] [了|le] … [我|wǒ] [从来|cóng lái] [没|méi] [见|jiàn] [过|guo] [那么|nà me] [漂亮|piào liang] [的|de] [贝壳|bèi ké] ！',
      '[泥|どろ] の [中|なか] で [貝殻|かいがら] を [三|みっ]つ なくした の ！ いちばん きれい な の 。 かご に [入|い]れたら 、 かご が [倒|たお]れちゃって …'),
    'q.shells': L('You found them! How many did you bring?', '¡Las encontraste! ¿Cuántas trajiste?', 'Você achou! Quantas você trouxe?', 'Du hast sie gefunden! Wie viele hast du gefunden?',
      '[你|nǐ] [找到|zhǎo dào] [了|le] ！ [你|nǐ] [见|jiàn] [过|guo] [这么|zhè me] [漂亮|piào liang] [的|de] [贝壳|bèi ké] [吗|ma] ？', '[見|み]つけた ！ いくつ [持|も]って [来|き]た ？',
      { en_zh: 'You found them! Have you ever seen shells this pretty?' }),
    'q.oar': L('You found it! Where did it go?', '¡Lo encontraste! ¿Adónde fue?', 'Você achou! Pra onde ele foi?', 'Du hast es gefunden! Wohin ist es geschwommen?',
      '[你|nǐ] [找到|zhǎo dào] [了|le] ！ [它|tā] [漂|piāo] [到|dào] [哪里|nǎ lǐ] [去|qù] [了|le] ？', '[見|み]つけた ！ どこ へ [行|い]った ？',
      { en_de: 'You found it! Where did it float to?', en_zh: 'You found it! Where did it drift to?' }),
    // young Bartolo in the grotto: he followed you in, and asks what you did, room by room
    'd.r0': L('I came behind you! I was a little scared in the dark… shh, don’t tell my dad.',
      '¡Vine detrás de ti! Tuve un poco de miedo en la oscuridad… shh, no le digas a mi papá.',
      'Eu vim atrás de você! Tive um pouco de medo no escuro… psiu, não conta pro meu pai.',
      'Ich bin hinter dir hergekommen! Ich hatte ein bisschen Angst im Dunkeln … psst, sag’s nicht meinem Papa.',
      '[我|wǒ] [跟|gēn] [着|zhe] [你|nǐ] [进来|jìn lai] [了|le] ！ [我|wǒ] [以前|yǐ qián] [没|méi] [进|jìn] [过|guo] [山洞|shān dòng] … [嘘|xū] ， [别|bié] [告诉|gào su] [我|wǒ] [爸爸|bà ba] 。',
      'ぼく 、 [後|うし]ろ から [走|はし]って [来|き]た ！ [暗|くら]い の 、 ちょっと [怖|こわ]かった … しーっ 、 お[父|とう]さん に は [言|い]わない で 。',
      { en_zh: 'I came in after you! I’ve never been in a cave before… shh, don’t tell my dad.', en_ja: 'I came running after you! The dark was a little scary… shh, don’t tell my dad.' }),
    'd.r1': L('The boy was here! Look, red wool… And I couldn’t get through that tunnel: I’m too big!',
      '¡El niño estuvo aquí! Mira, lana roja… Y yo no pude pasar por ese túnel: ¡soy muy grande!',
      'O menino esteve aqui! Olha, lã vermelha… E eu não pude passar por aquele túnel: eu sou grande demais!',
      'Der Junge war hier! Schau, rote Wolle … Und ich konnte nicht durch den Tunnel: Ich bin zu groß!',
      '[那个|nà ge] [男孩|nán hái] [来|lái] [过|guo] [这里|zhè lǐ] ！ [你|nǐ] [看|kàn] ， [红|hóng] [毛线|máo xiàn] … [我|wǒ] [好不容易|hǎo bù róng yì] [过来|guò lai] [了|le] ， [可是|kě shì] [那个|nà ge] [隧道|suì dào] [我|wǒ] [钻|zuān] [不|bù] [过去|guò qu] ： [我|wǒ] [太|tài] [大|dà] [了|le] ！',
      'あの [子|こ] 、 ここ に いた ん だ ！ [見|み]て 、 [赤|あか]い [毛糸|けいと] … ぼく は さっき 、 やっと ここ に [着|つ]いた 。 でも 、 あの トンネル は [通|とお]れなかった 。 [大|おお]きすぎる ん だ ！'),
    'd.r2': L('Three frogs, three lily pads… and one of them has the key in its mouth! I saw it shine. Which one?',
      'Tres ranas en tres nenúfares… ¡y una tiene la llave en la boca! La vi brillar. ¿Cuál?',
      'Três sapos em três vitórias-régias… e um tem a chave na boca! Eu vi brilhar. Qual?',
      'Drei Frösche auf drei Seerosenblättern … und einer hat den Schlüssel im Maul! Ich hab ihn glänzen sehen. Welcher?',
      '[三|sān] [只|zhī] [青蛙|qīng wā] [在|zài] [三|sān] [片|piàn] [荷叶|hé yè] [上|shàng] … [有|yǒu] [一|yī] [只|zhī] [嘴|zuǐ] [里|lǐ] [有|yǒu] [钥匙|yào shi] ！ [我|wǒ] [看见|kàn jiàn] [它|tā] [发光|fā guāng] [了|le] 。 [哪|nǎ] [一|yī] [只|zhī] ？',
      '[蓮|はす] の [葉|は] の [上|うえ] に カエル が [三匹|さんびき] … [一匹|いっぴき] が [口|くち] に [鍵|かぎ] を くわえて る ！ [光|ひか]った の を [見|み]た 。 どれ ？'),
    'd.r3': L('My dad says the king brought something shiny to his throne… and made the boy go quiet. And the guard only lets frogs through!',
      'Mi papá dice que el rey trajo algo brillante a su trono… y que hizo callar al niño. ¡Y el guardia solo deja pasar a las ranas!',
      'O meu pai diz que o rei trouxe uma coisa brilhante pro trono… e que fez o menino ficar calado. E o guarda só deixa passar sapos!',
      'Mein Papa sagt, der König hat etwas Glänzendes zu seinem Thron gebracht … und den Jungen zum Schweigen gebracht. Und die Wache lässt nur Frösche durch!',
      '[我|wǒ] [爸爸|bà ba] [说|shuō] [蛙王|wā wáng] [拿走|ná zǒu] [了|le] [一个|yī gè] [亮晶晶|liàng jīng jīng] [的|de] [东西|dōng xi] … [还|hái] [让|ràng] [那个|nà ge] [男孩|nán hái] [不|bù] [敢|gǎn] [说话|shuō huà] 。 [卫兵|wèi bīng] [只|zhǐ] [让|ràng] [青蛙|qīng wā] [过去|guò qu] ！',
      'お[父|とう]さん が [言|い]って た 。 [王様|おうさま] は キラキラ した もの を [飲|の]んだ … それ で 、 あの [子|こ] は [声|こえ] が [出|で]なく なった って 。 [見張|みは]り は カエル しか [通|とお]さない ！',
      { en_zh: 'My dad says the frog king took something shiny… and scared the boy into silence. The guard only lets frogs through!', en_ja: 'My dad says the king swallowed something shiny… and that’s why the boy lost his voice. The guard only lets frogs through!' }),
    'd.guard': L('Halt! The king said: «Only frogs!» Ribbit.', '¡Alto! El rey dijo: «¡Solo ranas!» Croac.', 'Alto lá! O rei disse: «Só sapos!» Croac.', 'Halt! Der König hat gesagt: «Nur Frösche!» Quak.',
      '[站住|zhàn zhù] ！ [蛙王|wā wáng] [说|shuō] [了|le] ： “ [只|zhǐ] [让|ràng] [青蛙|qīng wā] [进|jìn] ！ ” [呱|guā] 。', 'とまれ ！ [王様|おうさま] が [言|い]った 。 「 カエル だけ ！ 」 ケロ 。'),
  };
  // the words each demonstration shows (glossed small where they stand); per language
  const MARKS = {
    'd.ferry': { es: [['vino', 'came'], ['Fue', 'went'], ['dijo', 'said'], ['estuvo', 'was'], ['pudo', 'could']], pt: [['veio', 'came'], ['Foi', 'went'], ['disse', 'said'], ['esteve', 'was'], ['pôde', 'could']],
      de: [['gekommen', 'come'], ['entlanggegangen', 'walked along'], ['gerufen', 'called'], ['war', 'was'], ['konnte', 'could']],
      zh: [['[来|lái] [了|le]', 'came'], ['[走|zǒu] [了|le]', 'walked'], ['[喊|hǎn] [了|le]', 'called'], ['[没|méi] [能|néng]', 'couldn’t']], ja: [['[来|き]た', 'came'], ['[歩|ある]いて', 'walked'], ['[呼|よ]んだ', 'called'], ['いた', 'was'], ['[答|こた]えられなかった', 'couldn’t answer']] },
    'q.ferry': { es: [['viniste', 'did you come']], pt: [['veio', 'did (you) come']], de: [['bist du', 'have you (moving)'], ['gekommen', 'come']], zh: [['[来|lái] [了|le]', 'came']], ja: [['[来|き]た', 'came']] },
    'd.mender': { es: [['vino', 'came'], ['Estuvo', 'was'], ['trajo', 'brought'], ['dijo', 'said']], pt: [['veio', 'came'], ['Esteve', 'was'], ['trouxe', 'brought'], ['disse', 'said']],
      de: [['gekommen', 'come'], ['war', 'was'], ['mitgebracht', 'brought'], ['gesagt', 'said']], zh: [['[拿来|ná lái] [了|le]', 'brought'], ['[没|méi] [说|shuō]', 'didn’t say']], ja: [['[来|き]た', 'came'], ['いた', 'was'], ['[持|も]って [来|き]た', 'brought'], ['[言|い]わなかった', 'didn’t say']] },
    'q.mender': { es: [['Estuviste', 'were you']], pt: [['Esteve', 'were (you)']], de: [['Warst du', 'were you']], zh: [['[来|lái] [过|guo]', 'have been (here)']], ja: [['[来|き]ました か', 'did (you) come?']] },
    'd.pepe': { es: [['fui', 'I went'], ['no pude', 'I couldn’t'], ['hicieron', 'made'], ['volví', 'I came back']], pt: [['fui', 'I went'], ['não pude', 'I couldn’t'], ['fizeram', 'made'], ['voltei', 'I came back']],
      de: [['entlanggefahren', 'went along'], ['konnte', 'could'], ['zurückgekommen', 'came back']], zh: [['[找|zhǎo] [了|le]', 'looked'], ['[没|méi] [看见|kàn jiàn]', 'didn’t see'], ['[回来|huí lai] [了|le]', 'came back']],
      ja: [['[回|まわ]った', 'went round'], ['[見|み]えなかった', 'couldn’t see'], ['[帰|かえ]って [来|き]た', 'came back']] },
    'q.pepe': { es: [['Fuiste', 'did you go']], pt: [['Foi', 'did (you) go']], de: [['Bist du', 'have you'], ['gegangen', 'gone']], zh: [['[去|qù] [过|guo]', 'have been (to)']], ja: [['[聞|き]いた', 'heard']] },
    'd.marina': { es: [['hice', 'I made'], ['vio', 'saw'], ['dijo', 'said'], ['se fue', 'went away']], pt: [['fiz', 'I made'], ['viu', 'saw'], ['disse', 'said'], ['foi embora', 'went away']],
      de: [['gebaut', 'built'], ['gesehen', 'seen'], ['gerufen', 'called'], ['weggegangen', 'went away']], zh: [['[搭|dā] [了|le]', 'built'], ['[看见|kàn jiàn] [了|le]', 'saw'], ['[喊|hǎn] [了|le]', 'shouted'], ['[走|zǒu] [了|le]', 'left']],
      ja: [['[作|つく]った', 'made'], ['[言|い]わなかった', 'didn’t say'], ['[言|い]って', 'said'], ['[行|い]っちゃった', 'went off']] },
    'q.marina': { es: [['dijiste', 'did you say']], pt: [['disse', 'did (you) say']], de: [['gerufen', 'called']], zh: [['[说|shuō] [了|le]', 'said']], ja: [['[言|い]った', 'said']] },
    'd.bench': { es: [['hice', 'I made'], ['banco', 'bench'], ['espera', 'waits']], pt: [['fiz', 'I made'], ['banco', 'bench'], ['espera', 'waits']], de: [['gebaut', 'built'], ['Bank', 'bench'], ['wartet', 'waits']],
      zh: [['[做|zuò] [了|le]', 'made'], ['[长椅|cháng yǐ]', 'bench'], ['[等|děng]', 'wait']], ja: [['[作|つく]った', 'made'], ['ベンチ', 'bench'], ['[待|ま]って', 'waiting']] },
    'q.bench': { es: [['hiciste', 'did you do']], pt: [['fez', 'did (you) do']], de: [['gebracht', 'brought']], zh: [['[做|zuò] [了|le]', 'did']], ja: [['した', 'did']] },
    'd.shells': { es: [['Perdí', 'I lost'], ['puse', 'I put'], ['cesta', 'basket']], pt: [['perdi', 'I lost'], ['pus', 'I put'], ['cesto', 'basket']], de: [['verloren', 'lost'], ['getan', 'put'], ['umgefallen', 'fell over']],
      zh: [['[丢|diū] [了|le]', 'lost'], ['[没|méi] [见|jiàn] [过|guo]', 'had never seen']], ja: [['なくした', 'lost'], ['[入|い]れたら', 'when (I) put them in'], ['[倒|たお]れちゃって', 'tipped over']] },
    'q.shells': { es: [['trajiste', 'did you bring']], pt: [['trouxe', 'did (you) bring']], de: [['gefunden', 'found']], zh: [['[见|jiàn] [过|guo]', 'have seen']], ja: [['[持|も]って [来|き]た', 'brought']] },
    'q.oar': { es: [['Adónde fue', 'where did it go']], pt: [['foi', 'went']], de: [['geschwommen', 'floated (swum)']], zh: [['[漂|piāo] [到|dào]', 'drifted to']], ja: [['[行|い]った', 'went']] },
    'd.r0': { es: [['Vine', 'I came'], ['Tuve', 'I had'], ['miedo', 'fear']], pt: [['vim', 'I came'], ['Tive', 'I had'], ['medo', 'fear']], de: [['hergekommen', 'came (here)'], ['hatte', 'had'], ['Angst', 'fear']],
      zh: [['[进来|jìn lai] [了|le]', 'came in'], ['[没|méi] [进|jìn] [过|guo]', 'had never been in']], ja: [['[走|はし]って [来|き]た', 'came running'], ['[怖|こわ]かった', 'was scary']] },
    'd.r1': { es: [['estuvo', 'was'], ['no pude', 'I couldn’t'], ['túnel', 'tunnel']], pt: [['esteve', 'was'], ['não pude', 'I couldn’t'], ['túnel', 'tunnel']], de: [['war', 'was'], ['konnte nicht', 'couldn’t'], ['Tunnel', 'tunnel']],
      zh: [['[来|lái] [过|guo]', 'has been (here)'], ['[过来|guò lai] [了|le]', 'got across'], ['[钻|zuān] [不|bù] [过去|guò qu]', 'can’t squeeze through']], ja: [['いた', 'was'], ['[着|つ]いた', 'got here'], ['[通|とお]れなかった', 'couldn’t get through']] },
    'd.r2': { es: [['nenúfares', 'lily pads'], ['llave', 'key'], ['boca', 'mouth'], ['vi', 'I saw']], pt: [['vitórias-régias', 'lily pads'], ['chave', 'key'], ['boca', 'mouth'], ['vi', 'I saw']],
      de: [['Seerosenblättern', 'lily pads'], ['Schlüssel', 'key'], ['Maul', 'mouth']], zh: [['[荷叶|hé yè]', 'lily pads'], ['[钥匙|yào shi]', 'key'], ['[嘴|zuǐ]', 'mouth']], ja: [['[蓮|はす] の [葉|は]', 'lily pads'], ['[鍵|かぎ]', 'key'], ['[口|くち]', 'mouth']] },
    'd.r3': { es: [['trajo', 'brought'], ['hizo callar', 'made (him) go quiet'], ['trono', 'throne'], ['guardia', 'guard']], pt: [['trouxe', 'brought'], ['fez', 'made'], ['trono', 'throne'], ['guarda', 'guard']],
      de: [['gebracht', 'brought'], ['Thron', 'throne'], ['Wache', 'guard']], zh: [['[拿走|ná zǒu] [了|le]', 'took away'], ['[卫兵|wèi bīng]', 'guard']], ja: [['[飲|の]んだ', 'swallowed'], ['[見張|みは]り', 'guard']] },
    'd.guard': { es: [['dijo', 'said']], pt: [['disse', 'said']], de: [['gesagt', 'said']], zh: [['[说|shuō] [了|le]', 'said']], ja: [['[言|い]った', 'said']] },
  };
  // ------------------------------------------------------------ the pattern cards: the irregular past (I · you · he / she), and
  // {mimo}'s memories with irregular verbs (the grotto)
  const CARDS = {
    irr: { tag: 'The irregular past: I · you · he / she',
      es: { ex: [['fui · fuiste · fue', 'went'], ['hice · hiciste · hizo', 'did, made'], ['tuve · tuviste · tuvo', 'had'], ['estuve · estuviste · estuvo', 'was (somewhere)'], ['dije · dijiste · dijo', 'said'], ['vine · viniste · vino', 'came'], ['pude · pudiste · pudo', 'could'], ['puse · traje', 'I put · I brought']],
        note: 'These verbs change their stem in the past, and they have no accent: «hice», «dijo», «vino». I: -e · you: -iste · he / she: -o. «fui / fue» is «ir» (and «ser»).' },
      pt: { ex: [['fui · foi', 'went (I · you, he, she)'], ['fiz · fez', 'did, made'], ['tive · teve', 'had'], ['estive · esteve', 'was'], ['disse · disse', 'said'], ['vim · veio', 'came'], ['pude · pôde', 'could'], ['pus · trouxe', 'put · brought']],
        note: 'The irregular perfeito: each verb has its own stem. «Eu fiz», «você fez», «ele fez»: with «você», use the he / she form. «Disse» and «trouxe» are the same for I and he.' },
      de: { ex: [['ich bin gegangen', 'I went'], ['ich bin gekommen', 'I came'], ['ich habe gerufen', 'I called'], ['ich habe gefunden', 'I found'], ['ich war · du warst', 'I was · you were'], ['ich hatte · ich konnte', 'I had · I could']],
        note: 'Many participles end in -en and change their vowel: gehen → gegangen, kommen → gekommen, rufen → gerufen, finden → gefunden. Moving somewhere takes «sein». And sein, haben and können are mostly told in the Präteritum: war, hatte, konnte.' },
      zh: { ex: [['[来|lái] [了|le]', 'came'], ['[回来|huí lai] [了|le]', 'came back'], ['[走|zǒu] [了|le]', 'left'], ['[去|qù] [过|guo]', 'have been (to)'], ['[见|jiàn] [过|guo]', 'have seen'], ['[没|méi] [去|qù] [过|guo]', 'have never been']],
        note: '了 after a verb of moving: it happened (来了, 回来了, 走了). 过 after a verb: you have done it before, an experience (我去过那个岛: I’ve been to that island). Never: 没 + verb + 过.' },
      ja: { ex: [['[行|い]く → [行|い]った', 'go → went'], ['[来|く]る → [来|き]た', 'come → came'], ['する → した', 'do → did'], ['[呼|よ]ぶ → [呼|よ]んだ', 'call → called'], ['[歩|ある]く → [歩|ある]いた', 'walk → walked'], ['[言|い]う → [言|い]った', 'say → said']],
        note: 'The plain past changes the verb’s end: -u, -tsu, -ru → -tta; -mu, -bu, -nu → -nda; -ku → -ita; -gu → -ida; -su → -shita. 行く is special: 行った. 来る → 来た, する → した.' } },
    mimo: { tag: 'Memories with irregular verbs',
      es: { ex: [['puso…', 'put'], ['fue…', 'went'], ['trajo…', 'brought'], ['dijo…', 'said'], ['vino…', 'came']],
        note: 'In the Past, Mimo moves only in memories (he / she / it), and these memories are irregular: poner → puso, ir → fue, traer → trajo, decir → dijo, venir → vino.' },
      pt: { ex: [['pôs…', 'put'], ['foi…', 'went'], ['trouxe…', 'brought'], ['disse…', 'said'], ['veio…', 'came']],
        note: 'No Ontem, the memories are irregular: pôr → pôs, ir → foi, trazer → trouxe, dizer → disse, vir → veio.' },
      de: { ex: [['hat … geschoben', 'pushed'], ['ist … gekrochen', 'crawled'], ['ist … geschwommen', 'swam'], ['hat … gerufen', 'called'], ['ist … gekommen', 'came']],
        note: 'Strong verbs change their vowel in the participle: schieben → geschoben, kriechen → gekrochen, schwimmen → geschwommen, rufen → gerufen. Moving somewhere takes «ist».' },
      zh: { ex: [['[放|fàng] [进去|jìn qu] [了|le]', 'put (it) in'], ['[钻|zuān] [过去|guò qu] [了|le]', 'squeezed through'], ['[游|yóu] [过去|guò qu] [了|le]', 'swam over'], ['[回来|huí lai] [了|le]', 'came back']],
        note: 'A verb of moving, then where to (过去: over there, 回来: back, 进去: in), then 了: it happened.' },
      ja: { ex: [['[置|お]く → [置|お]いた', 'put'], ['[通|とお]る → [通|とお]った', 'went through'], ['[泳|およ]ぐ → [泳|およ]いだ', 'swam'], ['[言|い]う → [言|い]った', 'said'], ['[来|く]る → [来|き]た', 'came']],
        note: 'Memories in the plain past: -ku → -ita, -gu → -ida, -ru and -u → -tta. 来る → 来た.' } },
  };
  // ------------------------------------------------------------ the tasks (MOLT.grade): want (S; an A without an accent or without
  // `more`), alt (A, with its tip), aux (de: haben / sein: B), person (the right time, someone else: B), pres (now: say it again)
  const T = o => o;
  const TIPS = {
    person: { es: 'That’s someone else. About yourself: «{form}».', pt: 'That’s someone else. About yourself: «{form}».', de: 'About yourself: «ich…»: «{form}».', zh: 'Say it about yourself: «{form}».', ja: '«{form}»' },
    pres: { es: 'That’s now. It already happened: «{form}».', pt: 'That’s now. It already happened: «{form}».', de: 'That’s now. It already happened: «{form}».',
      zh: 'It already happened: 了 or 过 after the verb, «{form}».', ja: 'That’s now. It already happened: «{form}».' },
    aux: { de: 'Moving somewhere takes «sein»: «ich bin … gekommen». Here: «{form}».' },
    alt: { de: 'Right! In speech Germans would say «{form}».', ja: 'Right! To a grown-up, the polite past sounds better: «{form}».' },
    more: { es: 'Right! The whole sentence for an S: «{form}».', pt: 'Right! The whole sentence for an S: «{form}».', de: 'Right! The whole sentence for an S: «{form}».', zh: 'Right! Say who, too: «{form}».', ja: 'Right! The whole sentence for an S: «{form}».' },
  };
  // the Frog King: you tell him what HE did (the 2nd person); the 3rd person is still right, a little off
  const TIPS_KING = {
    alt: { es: 'Right! To his face, though: «{form}».', de: 'Right! To his face: «{form}».' },
    person: { es: 'That’s you! Tell him what HE did: «{form}».', pt: 'That’s you! Tell him what HE did: «{form}».', de: 'That’s you! Tell him what HE did: «{form}».' },
    pres: TIPS.pres, more: TIPS.more,
  };
  const TASKS = {
    came: T({ title: '{ferryman} asks how you came to the lake. Tell him, about yourself.',
      frame: { es: '___ a pie.', pt: '___ a pé.', de: 'Ich bin zu Fuß ___.', zh: '[我|wǒ] [走路|zǒu lù] ___ 。', ja: '[歩|ある]いて ___ 。' },
      chips: { es: [['Vine', 'I came']], pt: [['Vim', 'I came']], de: [['gekommen', 'come']], zh: [['[来|lái] [了|le]', 'came']], ja: [['[来|き]ました', 'came']] },
      model: L('I came on foot.', 'Vine a pie.', 'Vim a pé.', 'Ich bin zu Fuß gekommen.', '[我|wǒ] [走路|zǒu lù] [来|lái] [了|le] 。', '[歩|ある]いて [来|き]ました 。'),
      want: { es: ['vine'], pt: ['vim'], de: [['bin', 'gekommen']], zh: [['[来|lái]', '[了|le]']], ja: ['[来|き]ました'] },
      alt: { de: ['kam'], ja: ['[来|き]た'] }, aux: { de: [['habe', 'gekommen']] }, person: { es: ['vino', 'viniste'], pt: ['veio'], de: [['ist', 'gekommen']] },
      pres: { es: ['vengo', 'viene', 'venir'], pt: ['venho', 'vem', 'vir'], de: ['komme', 'kommt', 'kommen'], zh: ['[来|lái]'], ja: ['[来|き]ます', '[来|く]る'] },
      more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
    here: T({ title: '{mender} asks if you were here yesterday. Answer about yourself.',
      frame: { es: 'No, no ___ aquí.', pt: 'Não, não ___ aqui.', de: 'Nein, ich ___ nicht hier.', zh: '[我|wǒ] [没|méi] ___ 。', ja: 'いいえ 、 ___ 。' },
      chips: { es: [['estuve', 'I was']], pt: [['estive', 'I was']], de: [['war', 'was']], zh: [['[来|lái] [过|guo]', 'have been (here)']], ja: [['[来|き]ません でした', 'didn’t come']] },
      model: L('No, I wasn’t here.', 'No, no estuve aquí.', 'Não, não estive aqui.', 'Nein, ich war nicht hier.', '[我|wǒ] [没|méi] [来|lái] [过|guo] 。', 'いいえ 、 [来|き]ません でした 。', { en_zh: 'I’ve never been here.', en_ja: 'No, I didn’t come.' }),
      want: { es: ['estuve'], pt: ['estive'], de: ['war'], zh: [['[来|lái]', '[过|guo]']], ja: ['[来|き]ません でした', '[来|き]ました', '[来|こ]なかった', '[来|き]た'] },
      person: { es: ['estuvo', 'estuviste'], pt: ['esteve'], de: ['warst'] },
      pres: { es: ['estoy', 'estar'], pt: ['estou', 'estar'], de: ['bin'], zh: ['[来|lái]'], ja: ['[来|き]ません', '[来|き]ます', '[来|こ]ない'] },
      more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
    went: T({ title: '{pepe} asks you something. Answer about yourself, in the past.',
      frame: { es: 'No, no ___ a la isla.', pt: 'Não, não ___ à ilhota.', de: 'Nein, ich bin nicht zur Insel ___.', zh: '[我|wǒ] [没|méi] ___ 。', ja: 'うん 、 ___ 。' },
      chips: { es: [['fui', 'I went']], pt: [['fui', 'I went']], de: [['gegangen', 'gone']], zh: [['[去|qù] [过|guo]', 'have been (there)']], ja: [['[聞|き]いた', 'heard']] },
      model: L('No, I didn’t go to the island.', 'No, no fui a la isla.', 'Não, não fui à ilhota.', 'Nein, ich bin nicht zur Insel gegangen.', '[我|wǒ] [没|méi] [去|qù] [过|guo] 。', 'うん 、 [聞|き]いた 。', { en_zh: 'I’ve never been.', en_ja: 'Yes, I heard about it.' }),
      want: { es: ['fui'], pt: ['fui'], de: [['bin', 'gegangen']], zh: [['[去|qù]', '[过|guo]']], ja: ['[聞|き]いた', '[聞|き]きました'] },
      alt: { de: ['ging'] }, aux: { de: [['habe', 'gegangen']] }, person: { es: ['fue', 'fuiste'], pt: ['foi'], de: [['ist', 'gegangen']] },
      pres: { es: ['voy', 'va', 'ir'], pt: ['vou', 'vai', 'ir'], de: ['gehe', 'geht'], zh: ['[去|qù]'], ja: ['[聞|き]く', '[聞|き]きます'] },
      more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
    said: T({ title: '{marina} asks what you said when you got here. Answer about yourself.',
      frame: { es: '___ «¡Hola!».', pt: 'Eu ___ «Oi!».', de: 'Ich habe «Hallo!» ___.', zh: '[我|wǒ] ___ “ [你好|nǐ hǎo] ” 。', ja: '「 こんにちは 」 って ___ 。' },
      chips: { es: [['Dije', 'I said']], pt: [['disse', 'said']], de: [['gerufen', 'called']], zh: [['[说|shuō] [了|le]', 'said']], ja: [['[言|い]った', 'said']] },
      model: L('I said «Hello!».', 'Dije «¡Hola!».', 'Eu disse «Oi!».', 'Ich habe «Hallo!» gerufen.', '[我|wǒ] [说|shuō] [了|le] “ [你好|nǐ hǎo] ” 。', '「 こんにちは 」 って [言|い]った 。', { en_de: 'I called «Hello!».' }),
      want: { es: ['dije'], pt: ['disse'], de: [['habe', 'gerufen']], zh: [['[说|shuō]', '[了|le]']], ja: ['[言|い]った', '[言|い]いました'] },
      alt: { de: ['rief'] }, person: { es: ['dijo', 'dijiste'], de: [['hat', 'gerufen']] },
      pres: { es: ['digo', 'dice', 'decir'], pt: ['digo', 'diz', 'dizer'], de: ['rufe', 'ruft', 'rufen'], zh: ['[说|shuō]'], ja: ['[言|い]う', '[言|い]います'] },
      more: { pt: ['eu'], de: ['ich'], zh: ['[我|wǒ]'] } }),
    bench: T({ title: '{builder} asks you something. Answer about yourself, in the past.',
      frame: { es: '___ el banco.', pt: 'Eu ___ o banco.', de: 'Ich habe die Bretter ___.', zh: '[我|wǒ] ___ [长椅|cháng yǐ] 。', ja: 'ベンチ を ___ 。' },
      chips: { es: [['Hice', 'I made']], pt: [['fiz', 'made']], de: [['gebracht', 'brought']], zh: [['[做|zuò] [了|le]', 'made']], ja: [['[作|つく]った', 'made']] },
      model: L('I made the bench.', 'Hice el banco.', 'Eu fiz o banco.', 'Ich habe die Bretter gebracht.', '[我|wǒ] [做|zuò] [了|le] [长椅|cháng yǐ] 。', 'ベンチ を [作|つく]った 。', { en_de: 'I brought the planks.' }),
      want: { es: ['hice', 'puse'], pt: ['fiz', 'pus'], de: [['habe', 'gebracht']], zh: [['[做|zuò]', '[了|le]']], ja: ['[作|つく]った', '[作|つく]りました'] },
      alt: { de: ['brachte'] }, person: { es: ['hizo', 'hiciste'], pt: ['fez'], de: [['hat', 'gebracht']] },
      pres: { es: ['hago', 'hace', 'hacer'], pt: ['faço', 'faz', 'fazer'], de: ['bringe', 'bringt'], zh: ['[做|zuò]'], ja: ['[作|つく]る', '[作|つく]ります'] },
      more: { es: ['banco'], pt: ['banco'], de: ['ich'], zh: ['[我|wǒ]'] } }),
    shells: T({ title: '{marina} asks about the shells. Answer about yourself.',
      frame: { es: '___ tres conchas.', pt: 'Eu ___ três conchas.', de: 'Ich habe drei Muscheln ___.', zh: '[没|méi] ___ ！', ja: '[三|みっ]つ ___ 。' },
      chips: { es: [['Traje', 'I brought']], pt: [['trouxe', 'brought']], de: [['gefunden', 'found']], zh: [['[见|jiàn] [过|guo]', 'have seen']], ja: [['[持|も]って [来|き]た', 'brought']] },
      model: L('I brought three shells.', 'Traje tres conchas.', 'Eu trouxe três conchas.', 'Ich habe drei Muscheln gefunden.', '[没|méi] [见|jiàn] [过|guo] ！', '[三|みっ]つ [持|も]って [来|き]た よ 。', { en_de: 'I found three shells.', en_zh: 'Never seen any!' }),
      want: { es: ['traje'], pt: ['trouxe'], de: [['habe', 'gefunden']], zh: [['[见|jiàn]', '[过|guo]'], ['[看|kàn]', '[过|guo]']], ja: ['[来|き]た', '[来|き]ました'] },
      alt: { de: ['fand'] }, person: { es: ['trajo', 'trajiste'], de: [['hat', 'gefunden']] },
      pres: { es: ['traigo', 'trae', 'traer'], pt: ['trago', 'traz', 'trazer'], de: ['finde', 'findet'], zh: ['[见|jiàn]', '[看|kàn]'], ja: ['[来|く]る', '[来|き]ます'] },
      more: { es: ['tres', '3'], pt: ['eu'], de: ['drei', '3'], ja: ['[三|みっ]つ', '3'] } }),
    oarWhere: T({ title: '{bartolo} asks where his oar went. Tell him.',
      frame: { es: '___ debajo del muelle.', pt: '___ pra debaixo do píer.', de: 'Es ist unter den Steg ___.', zh: '[桨|jiǎng] ___ [码头|mǎ tóu] [下面|xià miàn] [去|qù] [了|le] 。', ja: '[桟橋|さんばし] の [下|した] へ ___ 。' },
      chips: { es: [['Fue', 'it went']], pt: [['Foi', 'it went']], de: [['geschwommen', 'floated (swum)']], zh: [['[漂|piāo] [到|dào]', 'drifted to']], ja: [['[行|い]った', 'went']] },
      model: L('It went under the pier.', 'Fue debajo del muelle.', 'Foi pra debaixo do píer.', 'Es ist unter den Steg geschwommen.', '[桨|jiǎng] [漂|piāo] [到|dào] [码头|mǎ tóu] [下面|xià miàn] [去|qù] [了|le] 。', '[桟橋|さんばし] の [下|した] へ [行|い]った 。', { en_de: 'It floated under the pier.', en_zh: 'The oar drifted under the pier.' }),
      want: { es: ['fue'], pt: ['foi'], de: [['ist', 'geschwommen']], zh: [['[漂|piāo]', '[了|le]'], ['[掉|diào]', '[了|le]']], ja: ['[行|い]った', '[行|い]きました'] },
      alt: { de: ['schwamm'] }, aux: { de: [['hat', 'geschwommen']] }, person: { es: ['fui'] },
      pres: { es: ['va', 'esta'], pt: ['vai', 'esta'], de: ['schwimmt', 'ist unter'], zh: ['[在|zài]'], ja: ['[行|い]く', 'ある'] },
      more: { es: ['debajo', 'muelle'], pt: ['debaixo', 'pier'], de: ['steg'], zh: ['[下面|xià miàn]'], ja: ['[下|した]'] } }),
    // young Bartolo's questions in the grotto (each language its own question: LOGQ)
    fear: T({ title: '{bartolo} asks you something. Answer about yourself, in the past.',
      frame: { es: 'No, no ___ miedo.', pt: 'Não, não ___ medo.', de: 'Nein, ich ___ keine Angst.', zh: '[我|wǒ] [没|méi] ___ 。', ja: 'ううん 、 [歩|ある]いて ___ 。' },
      chips: { es: [['tuve', 'I had']], pt: [['tive', 'I had']], de: [['hatte', 'had']], zh: [['[进|jìn] [过|guo]', 'been in']], ja: [['[来|き]た', 'came']] },
      model: L('No, I wasn’t afraid.', 'No, no tuve miedo.', 'Não, não tive medo.', 'Nein, ich hatte keine Angst.', '[我|wǒ] [没|méi] [进|jìn] [过|guo] 。', 'ううん 、 [歩|ある]いて [来|き]た 。', { en_zh: 'I’ve never been in one.', en_ja: 'No, I came walking.' }),
      want: { es: ['tuve'], pt: ['tive'], de: ['hatte'], zh: [['[进|jìn]', '[过|guo]']], ja: ['[来|き]た', '[歩|ある]いた', '[走|はし]った', '[来|き]ました'] },
      person: { es: ['tuvo', 'tuviste'], pt: ['teve'], de: ['hattest'] },
      pres: { es: ['tengo', 'tiene', 'tener'], pt: ['tenho', 'tem', 'ter'], de: ['habe', 'hast'], zh: ['[进|jìn]'], ja: ['[来|く]る', '[歩|ある]く', '[走|はし]る'] },
      more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
    pass: T({ title: '{bartolo} asks you something. Answer about yourself, in the past.',
      frame: { es: 'Sí, ___ pasar.', pt: 'Sim, ___ passar.', de: 'Ja, ich ___ durchkommen.', zh: '[我|wǒ] ___ 。', ja: 'うん 、 ___ 。' },
      chips: { es: [['pude', 'I could']], pt: [['pude', 'I could']], de: [['konnte', 'could']], zh: [['[过来|guò lai] [了|le]', 'got across']], ja: [['[着|つ]いた', 'got there']] },
      model: L('Yes, I could get through.', 'Sí, pude pasar.', 'Sim, pude passar.', 'Ja, ich konnte durchkommen.', '[我|wǒ] [过来|guò lai] [了|le] 。', 'うん 、 [着|つ]いた 。', { en_zh: 'I got across.', en_ja: 'Yes, I got there.' }),
      want: { es: ['pude'], pt: ['pude'], de: ['konnte'], zh: [['[过来|guò lai]', '[了|le]'], ['[过去|guò qu]', '[了|le]']], ja: ['[着|つ]いた', '[着|つ]きました'] },
      person: { es: ['pudo', 'pudiste'], pt: ['pôde'], de: ['konntest'] },
      pres: { es: ['puedo', 'puede', 'poder'], pt: ['posso', 'pode', 'poder'], de: ['kann'], zh: ['[能|néng]'], ja: ['[着|つ]く', '[着|つ]きます'] },
      more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
    key: T({ title: '{bartolo} asks you something. Answer about yourself, in the past.',
      frame: { es: 'Sí, ___ la llave.', pt: 'Sim, eu ___ a chave.', de: 'Ja, ich habe ihn ___.', zh: '___ ！', ja: 'うん 、 [持|も]って ___ 。' },
      chips: { es: [['traje', 'I brought']], pt: [['trouxe', 'brought']], de: [['gefunden', 'found']], zh: [['[拿来|ná lái] [了|le]', 'brought (it)']], ja: [['[来|き]た', 'came (brought)']] },
      model: L('Yes, I brought the key.', 'Sí, traje la llave.', 'Sim, eu trouxe a chave.', 'Ja, ich habe ihn gefunden.', '[拿来|ná lái] [了|le] ！', 'うん 、 [持|も]って [来|き]た 。', { en_de: 'Yes, I found it.', en_zh: 'Brought it!' }),
      want: { es: ['traje'], pt: ['trouxe'], de: [['habe', 'gefunden']], zh: [['[拿来|ná lái]', '[了|le]'], ['[带来|dài lái]', '[了|le]']], ja: ['[来|き]た', '[来|き]ました'] },
      alt: { de: ['fand'] }, person: { es: ['trajo', 'trajiste'], de: [['hat', 'gefunden']] },
      pres: { es: ['traigo', 'trae'], pt: ['trago', 'traz'], de: ['finde', 'findet'], zh: ['[拿|ná]'], ja: ['[来|く]る'] },
      more: { es: ['llave'], pt: ['eu', 'chave'], de: ['ich'] } }),
    told: T({ title: '{bartolo} asks what you told the king. Answer about yourself.',
      frame: { es: 'Le ___ la verdad.', pt: 'Eu ___ a verdade.', de: 'Ich habe ihm die Wahrheit ___.', zh: '[我|wǒ] ___ [真话|zhēn huà] 。', ja: '[本当|ほんとう] の こと を ___ 。' },
      chips: { es: [['dije', 'I said']], pt: [['disse', 'said']], de: [['gesagt', 'said']], zh: [['[说|shuō] [了|le]', 'said']], ja: [['[言|い]った', 'said']] },
      model: L('I told him the truth.', 'Le dije la verdad.', 'Eu disse a verdade.', 'Ich habe ihm die Wahrheit gesagt.', '[我|wǒ] [说|shuō] [了|le] [真话|zhēn huà] 。', '[本当|ほんとう] の こと を [言|い]った 。'),
      want: { es: ['dije'], pt: ['disse'], de: [['habe', 'gesagt']], zh: [['[说|shuō]', '[了|le]']], ja: ['[言|い]った', '[言|い]いました'] },
      alt: { de: ['sagte'] }, person: { es: ['dijo', 'dijiste'], de: [['hat', 'gesagt']] },
      pres: { es: ['digo', 'dice', 'decir'], pt: ['digo', 'diz'], de: ['sage', 'sagt'], zh: ['[说|shuō]'], ja: ['[言|い]う', '[言|い]います'] },
      more: { es: ['verdad'], pt: ['eu', 'verdade'], de: ['ich'], zh: ['[我|wǒ]'] } }),
  };
  // the Frog King's three vain questions (phase 2 of the fight): what HE did, told to his face
  const BOSSQ = {
    noise: T({ title: 'The Frog King asks what he did last night. Tell him, to his face.',
      frame: { es: '___ mucho ruido.', pt: 'Você ___ muito barulho.', de: 'Du ___ sehr laut!', zh: '[你|nǐ] ___ [一整夜|yī zhěng yè] 。', ja: '[大|おお]きな [声|こえ] で ___ 。' },
      chips: { es: [['Hiciste', 'you made']], pt: [['fez', 'made']], de: [['warst', 'were']], zh: [['[叫|jiào] [了|le]', 'croaked']], ja: [['[鳴|な]いた', 'croaked']] },
      model: L('You made a lot of noise.', 'Hiciste mucho ruido.', 'Você fez muito barulho.', 'Du warst sehr laut!', '[你|nǐ] [叫|jiào] [了|le] [一整夜|yī zhěng yè] 。', '[大|おお]きな [声|こえ] で [鳴|な]いた 。', { en_de: 'You were very loud!', en_zh: 'You croaked all night.', en_ja: 'You croaked very loudly.' }),
      want: { es: ['hiciste'], pt: ['fez'], de: ['warst'], zh: [['[叫|jiào]', '[了|le]'], ['[吵|chǎo]', '[了|le]']], ja: ['[鳴|な]いた', '[鳴|な]きました'] },
      alt: { es: ['hizo'], de: ['war'] }, person: { es: ['hice'], pt: ['fiz'] },
      pres: { es: ['haces', 'hace', 'hacer'], pt: ['faz', 'fazer'], de: ['bist', 'ist'], zh: ['[叫|jiào]', '[吵|chǎo]'], ja: ['[鳴|な]く', '[鳴|な]きます'] },
      more: { es: ['ruido'], pt: ['barulho'], de: ['laut'] } }),
    said: T({ title: 'The Frog King asks what he said. Tell him, to his face.',
      frame: { es: '___ «¡Silencio!».', pt: 'Você ___ «Silêncio!».', de: 'Du hast «Ruhe!» ___.', zh: '[你|nǐ] ___ “ [安静|ān jìng] ！ ” 。', ja: '「 しずか に ！ 」 と ___ 。' },
      chips: { es: [['Dijiste', 'you said']], pt: [['disse', 'said']], de: [['gerufen', 'called']], zh: [['[说|shuō] [了|le]', 'said']], ja: [['[言|い]った', 'said']] },
      model: L('You said «Silence!».', 'Dijiste «¡Silencio!».', 'Você disse «Silêncio!».', 'Du hast «Ruhe!» gerufen.', '[你|nǐ] [说|shuō] [了|le] “ [安静|ān jìng] ！ ” 。', '「 しずか に ！ 」 と [言|い]った 。', { en_de: 'You called «Quiet!».' }),
      want: { es: ['dijiste'], pt: ['disse'], de: [['hast', 'gerufen']], zh: [['[说|shuō]', '[了|le]'], ['[喊|hǎn]', '[了|le]']], ja: ['[言|い]った', '[言|い]いました'] },
      alt: { es: ['dijo'], de: ['riefst', 'rief', ['hat', 'gerufen']] }, person: { es: ['dije'], de: [['habe', 'gerufen']] },
      pres: { es: ['dices', 'dice', 'decir'], pt: ['diz', 'dizer'], de: ['rufst', 'ruft'], zh: ['[说|shuō]', '[喊|hǎn]'], ja: ['[言|い]う', '[言|い]います'] } }),
    brought: T({ title: 'The Frog King asks one more vain question. Tell him what he did, to his face.',
      frame: { es: '___ su voz.', pt: 'Você ___ a voz dele.', de: 'Du ___ seine Stimme!', zh: '[你|nǐ] ___ [他|tā] [的|de] [声音|shēng yīn] 。', ja: 'あの [子|こ] の [声|こえ] を ___ 。' },
      chips: { es: [['Trajiste', 'you brought']], pt: [['trouxe', 'brought']], de: [['hattest', 'had']], zh: [['[拿走|ná zǒu] [了|le]', 'took away']], ja: [['[飲|の]んだ', 'swallowed']] },
      model: L('You brought his voice.', 'Trajiste su voz.', 'Você trouxe a voz dele.', 'Du hattest seine Stimme!', '[你|nǐ] [拿走|ná zǒu] [了|le] [他|tā] [的|de] [声音|shēng yīn] 。', 'あの [子|こ] の [声|こえ] を [飲|の]んだ 。', { en_de: 'You had his voice!', en_zh: 'You took away his voice.', en_ja: 'You swallowed the boy’s voice.' }),
      want: { es: ['trajiste'], pt: ['trouxe'], de: ['hattest'], zh: [['[拿走|ná zǒu]', '[了|le]'], ['[拿|ná]', '[了|le]']], ja: ['[飲|の]んだ', '[飲|の]みました'] },
      alt: { es: ['trajo'], de: ['hatte'] }, person: { es: ['traje'] },
      pres: { es: ['traes', 'trae', 'traer'], pt: ['traz', 'trazer'], de: ['hast', 'hat'], zh: ['[拿|ná]'], ja: ['[飲|の]む', '[飲|の]みます'] },
      more: { es: ['voz'], pt: ['voz'], de: ['stimme'], zh: ['[声音|shēng yīn]'], ja: ['[声|こえ]'] } }),
  };
  // ------------------------------------------------------------ {mimo}'s memories (the 3rd person, irregular): a task each
  const MEM = {
    stone: T({ icon: 'push', title: 'In the Past, {mimo} moves only in memories. Tell it what it did with the stone.',
      frame: { es: '{mimo} ___ la piedra en el hueco.', pt: 'O {mimo} ___ a pedra no buraco.', de: '{mimo} hat den Stein ins Loch ___.', zh: '{mimo} [把|bǎ] [石头|shí tou] ___ 。', ja: '{mimo} が [石|いし] を [穴|あな] に ___ 。' },
      chips: { es: [['puso', 'put']], pt: [['pôs', 'put']], de: [['geschoben', 'pushed']], zh: [['[放|fàng] [进去|jìn qu] [了|le]', 'put in']], ja: [['[置|お]いた', 'put']] },
      model: L('{mimo} put the stone in the hole.', '{mimo} puso la piedra en el hueco.', 'O {mimo} pôs a pedra no buraco.', '{mimo} hat den Stein ins Loch geschoben.', '{mimo} [把|bǎ] [石头|shí tou] [放|fàng] [进去|jìn qu] [了|le] 。', '{mimo} が [石|いし] を [穴|あな] に [置|お]いた 。', { en_de: '{mimo} pushed the stone into the hole.' }),
      want: { es: ['puso'], pt: ['pôs', 'pos'], de: [['hat', 'geschoben']], zh: [['[放|fàng]', '[了|le]'], ['[推|tuī]', '[了|le]']], ja: ['[置|お]いた'] },
      alt: { de: ['schob'], ja: ['[置|お]きました'] }, person: { es: ['puse'], pt: ['pus'] },
      pres: { es: ['pone', 'pon', 'poner'], pt: ['põe', 'poe'], de: ['schiebt', 'schieb', 'schieben'], zh: ['[放|fàng]', '[推|tuī]'], ja: ['[置|お]いて', '[置|お]く'] },
      more: { es: ['piedra'], pt: ['pedra'], de: ['stein'], zh: ['[石头|shí tou]'], ja: ['[石|いし]'] } }),
    tunnel: T({ icon: 'climb', title: 'The tunnel is tiny. Tell {mimo} what it did, as a memory.',
      frame: { es: '{mimo} ___ por el túnel.', pt: 'O {mimo} ___ pelo túnel.', de: '{mimo} ist durch den Tunnel ___.', zh: '{mimo} ___ 。', ja: '{mimo} が トンネル を ___ 。' },
      chips: { es: [['fue', 'went']], pt: [['foi', 'went']], de: [['gekrochen', 'crawled']], zh: [['[钻|zuān] [过去|guò qu] [了|le]', 'squeezed through']], ja: [['[通|とお]った', 'went through']] },
      model: L('{mimo} went through the tunnel.', '{mimo} fue por el túnel.', 'O {mimo} foi pelo túnel.', '{mimo} ist durch den Tunnel gekrochen.', '{mimo} [钻|zuān] [过去|guò qu] [了|le] 。', '{mimo} が トンネル を [通|とお]った 。', { en_de: '{mimo} crawled through the tunnel.', en_zh: '{mimo} squeezed through.' }),
      want: { es: ['fue'], pt: ['foi'], de: [['ist', 'gekrochen'], ['ist', 'gegangen']], zh: [['[钻|zuān]', '[了|le]'], ['[过去|guò qu]', '[了|le]']], ja: ['[通|とお]った'] },
      alt: { de: ['kroch'], ja: ['[通|とお]りました'] }, aux: { de: [['hat', 'gekrochen']] }, person: { es: ['fui'], pt: ['fui'] },
      pres: { es: ['va', 've', 'ir'], pt: ['vai', 'ir'], de: ['kriecht', 'kriech', 'kriechen'], zh: ['[钻|zuān]'], ja: ['[通|とお]って', '[通|とお]る'] },
      more: { es: ['tunel'], pt: ['tunel'], de: ['tunnel'], ja: ['トンネル'] } }),
    croak: T({ icon: 'star', title: 'The guard lets only frogs through. Tell {mimo} what it said, as a memory.',
      frame: { es: '{mimo} ___ «¡croac!».', pt: 'O {mimo} ___ «croac!».', de: '{mimo} hat «Quak!» ___.', zh: '{mimo} ___ “ [呱|guā] [呱|guā] ” 。', ja: '{mimo} が 「 ケロケロ 」 と ___ 。' },
      chips: { es: [['dijo', 'said']], pt: [['disse', 'said']], de: [['gerufen', 'called']], zh: [['[叫|jiào] [了|le]', 'croaked']], ja: [['[言|い]った', 'said']] },
      model: L('{mimo} said «Ribbit!».', '{mimo} dijo «¡croac!».', 'O {mimo} disse «croac!».', '{mimo} hat «Quak!» gerufen.', '{mimo} [叫|jiào] [了|le] “ [呱|guā] [呱|guā] ” 。', '{mimo} が 「 ケロケロ 」 と [言|い]った 。'),
      want: { es: ['dijo'], pt: ['disse'], de: [['hat', 'gerufen'], ['hat', 'gesagt']], zh: [['[叫|jiào]', '[了|le]'], ['[说|shuō]', '[了|le]']], ja: ['[言|い]った'] },
      alt: { de: ['rief'], ja: ['[言|い]いました'] }, person: { es: ['dije'] },
      pres: { es: ['dice', 'di', 'decir'], pt: ['diz', 'dizer'], de: ['ruft', 'ruf', 'rufen'], zh: ['[叫|jiào]', '[说|shuō]'], ja: ['[言|い]って', '[言|い]う'] } }),
    planks: T({ icon: 'push', title: '{builder} needs the planks. Tell {mimo} what it did, as a memory.',
      frame: { es: '{mimo} ___ las tablas.', pt: 'O {mimo} ___ as tábuas.', de: '{mimo} hat die Bretter ___.', zh: '{mimo} ___ [木板|mù bǎn] 。', ja: '{mimo} が [板|いた] を ___ 。' },
      chips: { es: [['trajo', 'brought']], pt: [['trouxe', 'brought']], de: [['gebracht', 'brought']], zh: [['[拿来|ná lái] [了|le]', 'brought']], ja: [['[持|も]って [来|き]た', 'brought']] },
      model: L('{mimo} brought the planks.', '{mimo} trajo las tablas.', 'O {mimo} trouxe as tábuas.', '{mimo} hat die Bretter gebracht.', '{mimo} [拿来|ná lái] [了|le] [木板|mù bǎn] 。', '{mimo} が [板|いた] を [持|も]って [来|き]た 。'),
      want: { es: ['trajo'], pt: ['trouxe'], de: [['hat', 'gebracht']], zh: [['[拿来|ná lái]', '[了|le]'], ['[拿|ná]', '[了|le]']], ja: ['[来|き]た'] },
      alt: { de: ['brachte'], ja: ['[来|き]ました'] }, person: { es: ['traje'] },
      pres: { es: ['trae', 'traer'], pt: ['traz', 'trazer'], de: ['bringt', 'bring', 'bringen'], zh: ['[拿|ná]'], ja: ['[来|く]る', '[来|き]て'] },
      more: { es: ['tablas'], pt: ['tabuas'], de: ['bretter'], zh: ['[木板|mù bǎn]'], ja: ['[板|いた]'] } }),
    oar: T({ icon: 'swim', title: 'Tell {mimo} what it did, as a memory: it came back with the oar.',
      frame: { es: '{mimo} ___ con el remo.', pt: 'O {mimo} ___ com o remo.', de: '{mimo} ist mit dem Ruder ___.', zh: '{mimo} [带|dài] [着|zhe] [桨|jiǎng] ___ 。', ja: '{mimo} が オール を [持|も]って ___ 。' },
      chips: { es: [['vino', 'came']], pt: [['veio', 'came']], de: [['zurückgekommen', 'come back']], zh: [['[回来|huí lai] [了|le]', 'came back']], ja: [['[帰|かえ]って [来|き]た', 'came back']] },
      model: L('{mimo} came back with the oar.', '{mimo} vino con el remo.', 'O {mimo} veio com o remo.', '{mimo} ist mit dem Ruder zurückgekommen.', '{mimo} [带|dài] [着|zhe] [桨|jiǎng] [回来|huí lai] [了|le] 。', '{mimo} が オール を [持|も]って [帰|かえ]って [来|き]た 。'),
      want: { es: ['vino'], pt: ['veio'], de: [['ist', 'zurückgekommen'], ['ist', 'gekommen']], zh: [['[回来|huí lai]', '[了|le]']], ja: ['[来|き]た'] },
      alt: { de: ['kam'], ja: ['[来|き]ました'] }, aux: { de: [['hat', 'zurückgekommen']] }, person: { es: ['vine'], pt: ['vim'] },
      pres: { es: ['viene', 'ven', 'venir'], pt: ['vem', 'vir'], de: ['kommt', 'komm', 'kommen'], zh: ['[回来|huí lai]'], ja: ['[来|く]る', '[来|き]て'] },
      more: { es: ['remo'], pt: ['remo'], de: ['ruder'], zh: ['[桨|jiǎng]'], ja: ['オール'] } }),
  };
  // the frog with the key (the grotto's third room): which one {mimo} went to, said with where it sits
  const FROG = {
    title: 'One frog has the key in its mouth. Tell {mimo} where it went, as a memory.',
    frame: { es: '{mimo} ___ a la rana ___.', pt: 'O {mimo} ___ até o sapo ___.', de: '{mimo} ist zum ___ Frosch ___.', zh: '{mimo} [游|yóu] [到|dào] ___ [的|de] [青蛙|qīng wā] [那里|nà lǐ] [了|le] 。', ja: '{mimo} が ___ の カエル の ところ へ ___ 。' },
    chips: { es: [['fue', 'went'], ['de la izquierda · del medio · de la derecha', 'left · middle · right']], pt: [['foi', 'went'], ['da esquerda · do meio · da direita', 'left · middle · right']],
      de: [['geschwommen', 'swum'], ['linken · mittleren · rechten', 'left · middle · right']], zh: [['[左边|zuǒ biān] · [中间|zhōng jiān] · [右边|yòu biān]', 'left · middle · right']], ja: [['[泳|およ]いだ', 'swam'], ['[左|ひだり] · [真|ま]ん[中|なか] · [右|みぎ]', 'left · middle · right']] },
    verb: { es: 'fue', pt: 'foi', de: ['ist', 'geschwommen'], zh: ['[游|yóu]', '[了|le]'], ja: '[泳|およ]いだ' },
    pos: { es: { left: ['izquierda'], middle: ['medio'], right: ['derecha'] }, pt: { left: ['esquerda'], middle: ['meio'], right: ['direita'] },
      de: { left: ['linken', 'links'], middle: ['mittleren', 'mitte'], right: ['rechten', 'rechts'] }, zh: { left: ['[左边|zuǒ biān]', '[左|zuǒ]'], middle: ['[中间|zhōng jiān]'], right: ['[右边|yòu biān]', '[右|yòu]'] },
      ja: { left: ['[左|ひだり]'], middle: ['[真|ま]ん[中|なか]'], right: ['[右|みぎ]'] } },
    model: {
      left: L('{mimo} went to the frog on the left.', '{mimo} fue a la rana de la izquierda.', 'O {mimo} foi até o sapo da esquerda.', '{mimo} ist zum linken Frosch geschwommen.', '{mimo} [游|yóu] [到|dào] [左边|zuǒ biān] [的|de] [青蛙|qīng wā] [那里|nà lǐ] [了|le] 。', '{mimo} が [左|ひだり] の カエル の ところ へ [泳|およ]いだ 。'),
      middle: L('{mimo} went to the frog in the middle.', '{mimo} fue a la rana del medio.', 'O {mimo} foi até o sapo do meio.', '{mimo} ist zum mittleren Frosch geschwommen.', '{mimo} [游|yóu] [到|dào] [中间|zhōng jiān] [的|de] [青蛙|qīng wā] [那里|nà lǐ] [了|le] 。', '{mimo} が [真|ま]ん[中|なか] の カエル の ところ へ [泳|およ]いだ 。'),
      right: L('{mimo} went to the frog on the right.', '{mimo} fue a la rana de la derecha.', 'O {mimo} foi até o sapo da direita.', '{mimo} ist zum rechten Frosch geschwommen.', '{mimo} [游|yóu] [到|dào] [右边|yòu biān] [的|de] [青蛙|qīng wā] [那里|nà lǐ] [了|le] 。', '{mimo} が [右|みぎ] の カエル の ところ へ [泳|およ]いだ 。'),
    },
    pres: { es: ['va', 've', 'ir'], pt: ['vai', 'ir'], de: ['schwimmt', 'schwimm', 'schwimmen'], zh: ['[游|yóu]'], ja: ['[泳|およ]いで', '[泳|およ]ぐ'] },
    wrong: L('Splash! Wrong frog: that one only had a pebble. Look for the shine again.', '¡Plaf! Esa rana no: solo tenía una piedrita.', 'Tchibum! Esse sapo não: só tinha uma pedrinha.', 'Platsch! Der falsche Frosch: Der hatte nur einen Kiesel.',
      '[扑通|pū tōng] ！ [不|bù] [是|shì] [这|zhè] [只|zhī] ： [它|tā] [嘴|zuǐ] [里|lǐ] [只有|zhǐ yǒu] [小|xiǎo] [石子|shí zǐ] 。', 'ポチャン ！ その カエル じゃない 。 [小石|こいし] しか なかった 。'),
  };
  // ------------------------------------------------------------ the grotto's rooms, and young Bartolo's questions there
  const ROOMS = [
    { name: 'The Reed Gate', sub: 'The frogs’ grotto, long ago · the way in' },
    { name: 'The Echo Hall', sub: 'The frogs’ grotto, long ago · where the boy hid' },
    { name: 'The Pond of Three Frogs', sub: 'The frogs’ grotto, long ago · deeper in' },
    { name: 'The Frog King’s Throne', sub: 'The frogs’ grotto, long ago · the heart of the island' },
  ];
  const LOGQ = {
    fear: L('And you? Were you scared?', '¿Y tú? ¿Tuviste miedo?', 'E você? Teve medo?', 'Und du? Hattest du Angst?', '[你|nǐ] [呢|ne] ？ [你|nǐ] [进|jìn] [过|guo] [山洞|shān dòng] [吗|ma] ？', 'きみ は ？ [走|はし]って [来|き]た ？',
      { en_zh: 'And you? Have you ever been in a cave?', en_ja: 'And you? Did you come running?' }),
    pass: L('Could you get through?', '¿Pudiste pasar?', 'Você pôde passar?', 'Konntest du durchkommen?', '[你|nǐ] [过来|guò lai] [了|le] [吗|ma] ？', '[向|む]こう に [着|つ]いた ？',
      { en_zh: 'Did you get across?', en_ja: 'Did you get to the other side?' }),
    key: L('Did you bring the key?', '¿Trajiste la llave?', 'Você trouxe a chave?', 'Hast du den Schlüssel gefunden?', '[钥匙|yào shi] [拿来|ná lái] [了|le] [吗|ma] ？', '[鍵|かぎ] 、 [持|も]って [来|き]た ？',
      { en_de: 'Did you find the key?' }),
    told: L('What did you say to the king?', '¿Qué le dijiste al rey?', 'O que você disse pro rei?', 'Was hast du dem König gesagt?', '[你|nǐ] [跟|gēn] [蛙王|wā wáng] [说|shuō] [了|le] [什么|shén me] ？', '[王様|おうさま] に [何|なに] を [言|い]った の ？'),
  };
  const LOGQ_MARKS = {
    fear: { es: [['Tuviste', 'did you have']], pt: [['Teve', 'did (you) have']], de: [['Hattest du', 'did you have']], zh: [['[进|jìn] [过|guo]', 'have been in']], ja: [['[走|はし]って [来|き]た', 'came running']] },
    pass: { es: [['Pudiste', 'could you']], pt: [['pôde', 'could (you)']], de: [['Konntest du', 'could you']], zh: [['[过来|guò lai] [了|le]', 'got across']], ja: [['[着|つ]いた', 'got there']] },
    key: { es: [['Trajiste', 'did you bring']], pt: [['trouxe', 'did (you) bring']], de: [['gefunden', 'found']], zh: [['[拿来|ná lái] [了|le]', 'brought']], ja: [['[持|も]って [来|き]た', 'brought']] },
    told: { es: [['dijiste', 'did you say']], pt: [['disse', 'did (you) say']], de: [['gesagt', 'said']], zh: [['[说|shuō] [了|le]', 'said']], ja: [['[言|い]った', 'said']] },
  };
  // ------------------------------------------------------------ the fight: the Frog King (lake_time_boss.js); {mimo}: the player's name
  const FIGHT = {
    intro: L('Ribbit! Who dares? I am the Frog King, the handsomest on the lake! Now find me!', '¡Croac! ¿Quién se atreve? ¡Soy el Rey Sapo, el más guapo del lago! ¡A ver si me encuentras!',
      'Croac! Quem se atreve? Eu sou o Rei Sapo, o mais bonito do lago! Quero ver você me achar!', 'Quak! Wer wagt es? Ich bin der Froschkönig, der Schönste am See! Finde mich doch!',
      '[呱|guā] ！ [谁|shéi] [敢|gǎn] [来|lái] ？ [我|wǒ] [是|shì] [蛙王|wā wáng] ， [湖|hú] [上|shàng] [最|zuì] [帅|shuài] [的|de] ！ [来|lái] [找|zhǎo] [我|wǒ] [呀|ya] ！',
      'ケロッ ！ だれ だ ？ わし は カエル の [王様|おうさま] 、 [湖|みずうみ] で いちばん の [美男子|びなんし] じゃ ！ [見|み]つけて みろ ！'),
    coach: L('It’s a memory! Find the one with the crown, and tell what {mimo} did: «{mimo} jumped on the frog on the left!»', '¡Es un recuerdo! Busca al de la corona y di lo que hizo {mimo}: «¡{mimo} saltó sobre la rana de la izquierda!»',
      'É uma lembrança! Procura o da coroa e diz o que o {mimo} fez: «O {mimo} pulou no sapo da esquerda!»', 'Das ist eine Erinnerung! Such den mit der Krone und sag, was {mimo} gemacht hat: «{mimo} ist auf den linken Frosch gesprungen!»',
      '[这|zhè] [是|shì] [回忆|huí yì] ！ [找|zhǎo] [戴|dài] [王冠|wáng guān] [的|de] [那|nà] [只|zhī] ， [说|shuō] {mimo} [做|zuò] [了|le] [什么|shén me] ： “ {mimo} [跳|tiào] [到|dào] [了|le] [左边|zuǒ biān] [的|de] [青蛙|qīng wā] [上|shàng] ！ ”',
      'これ は [思|おも]い[出|で] だ ！ [王冠|おうかん] の カエル を [見|み]つけて 、 {mimo} が した こと を [言|い]って ： 「 {mimo} が [左|ひだり] の カエル に [飛|と]びのった ！ 」'),
    now: L('That’s now! Here everything is a memory!', '¡Eso es ahora! ¡Aquí todo es un recuerdo!', 'Isso é agora! Aqui tudo é lembrança!', 'Das ist jetzt! Hier ist alles eine Erinnerung!',
      '[那|nà] [是|shì] [现在|xiàn zài] ！ [这里|zhè lǐ] [一切|yī qiè] [都|dōu] [是|shì] [回忆|huí yì] ！', 'それ は [今|いま] だ よ ！ ここ で は 、 ぜんぶ [思|おも]い[出|で] な ん だ ！'),
    wrong: L('Not that one! The king is the one with the crown.', '¡Ese no! El rey es el de la corona.', 'Esse não! O rei é o da coroa.', 'Der nicht! Der König ist der mit der Krone.',
      '[不|bù] [是|shì] [那|nà] [只|zhī] ！ [戴|dài] [王冠|wáng guān] [的|de] [才|cái] [是|shì] [蛙王|wā wáng] 。', 'それ じゃない ！ [王冠|おうかん] の が [王様|おうさま] だ よ 。'),
    hit: L('Ribbit! My crown!', '¡Croac! ¡Mi corona!', 'Croac! A minha coroa!', 'Quak! Meine Krone!', '[呱|guā] ！ [我|wǒ] [的|de] [王冠|wáng guān] ！', 'ケロッ ！ わし の [王冠|おうかん] が ！'),
    hop: L('Catch me if you can!', '¡Atrápame si puedes!', 'Me pega se puder!', 'Fang mich doch!', '[有|yǒu] [本事|běn shi] [就|jiù] [抓|zhuā] [我|wǒ] ！', 'つかまえて みろ ！'),
    phase2: L('Enough, enough! I did nothing wrong. I’m perfect!', '¡Basta, basta! Yo no hice nada malo. ¡Soy perfecto!', 'Chega, chega! Eu não fiz nada de errado. Eu sou perfeito!', 'Genug, genug! Ich habe nichts falsch gemacht. Ich bin perfekt!',
      '[够|gòu] [了|le] ， [够|gòu] [了|le] ！ [我|wǒ] [没|méi] [做|zuò] [错|cuò] [什么|shén me] 。 [我|wǒ] [是|shì] [完美|wán měi] [的|de] ！', 'もう いい ！ わし は [何|なに] も [悪|わる]く ない 。 わし は [完璧|かんぺき] じゃ ！'),
    q1: L('What did I do last night? Something magnificent, surely!', '¿Qué hice yo anoche? ¡Algo magnífico, seguro!', 'O que eu fiz ontem à noite? Algo magnífico, claro!', 'Wie war ich gestern Nacht? Großartig, sicher!',
      '[我|wǒ] [昨天|zuó tiān] [晚上|wǎn shang] [做|zuò] [了|le] [什么|shén me] ？ [一定|yī dìng] [很|hěn] [了不起|liǎo bu qǐ] ！', 'ゆうべ 、 わし は [何|なに] を した ？ すばらしい こと だろう ！', { en_de: 'How was I last night? Magnificent, surely!' }),
    q2: L('Lies! And what did I say, eh?', '¡Mentira! ¿Y qué dije yo, eh?', 'Mentira! E o que eu disse, hein?', 'Lüge! Und was habe ich gerufen, hm?',
      '[胡说|hú shuō] ！ [那|nà] [我|wǒ] [说|shuō] [了|le] [什么|shén me] ？', 'うそ だ ！ じゃあ 、 わし は [何|なん] と [言|い]った ？', { en_de: 'Lies! And what did I call out, hm?' }),
    q3: L('Bah… and what did I bring to my throne? Nothing!', 'Bah… ¿Y qué traje yo a mi trono? ¡Nada!', 'Bah… E o que eu trouxe pro meu trono? Nada!', 'Pah … und was hatte ich im Maul? Nichts!',
      '[哼|hēng] … [我|wǒ] [拿走|ná zǒu] [了|le] [什么|shén me] ？ [什么|shén me] [也|yě] [没|méi] [拿|ná] ！', 'ふん … わし は [何|なに] を [飲|の]んだ ？ [何|なに] も [飲|の]んで おらん ！',
      { en_de: 'Pah… and what did I have in my mouth? Nothing!', en_zh: 'Hmph… and what did I take? Nothing!', en_ja: 'Hmph… and what did I swallow? Nothing!' }),
    answer: L('Tell him to his face what he did! «You made…», «You said…»', '¡Díselo a la cara! «Hiciste…», «Dijiste…»', 'Fala na cara dele! «Você fez…», «Você disse…»', 'Sag es ihm ins Gesicht! «Du warst…», «Du hast … gerufen»',
      '[当面|dāng miàn] [告诉|gào su] [他|tā] ！ “ [你|nǐ] … [了|le] ”', '[本人|ほんにん] に [言|い]って あげて ！ 「 … [鳴|な]いた 」 「 … [言|い]った 」'),
    sulk: L('Ribbit… hmph.', 'Croac… ¡bah!', 'Croac… hunf.', 'Quak … pah.', '[呱|guā] … [哼|hēng] 。', 'ケロ … ふん 。'),
    win: L('All right… it’s true. I brought this to my throne. A little voice… Here. I don’t want to be the only one making noise any more.',
      'Está bien… es verdad. Traje esto a mi trono. Una vocecita… Toma. Ya no quiero ser el único que hace ruido.',
      'Tá bom… é verdade. Eu trouxe isto pro meu trono. Uma vozinha… Toma. Não quero mais ser o único que faz barulho.',
      'Na gut … es stimmt. Ich hatte das hier im Maul. Ein Stimmchen … Hier. Ich will nicht mehr der Einzige sein, der Lärm macht.',
      '[好|hǎo] [吧|ba] … [是|shì] [真|zhēn] [的|de] 。 [我|wǒ] [拿走|ná zǒu] [了|le] [这个|zhè ge] 。 [一个|yī gè] [小小|xiǎo xiǎo] [的|de] [声音|shēng yīn] … [给|gěi] [你|nǐ] 。 [我|wǒ] [不|bù] [想|xiǎng] [再|zài] [一个|yī gè] [人|rén] [吵|chǎo] [了|le] 。',
      'わかった … [本当|ほんとう] じゃ 。 これ を [飲|の]んで おった 。 [小|ちい]さな [声|こえ] … ほれ 。 もう 、 わし だけ が うるさい の は いや じゃ 。'),
  };
  const NAMES = {
    boss: L('the Frog King', 'el Rey Sapo', 'o Rei Sapo', 'der Froschkönig', '[蛙王|wā wáng]', 'カエル の [王様|おうさま]'),
    carving: L('For whoever waits', 'Para quien espera', 'Para quem espera', 'Für den, der wartet', '[给|gěi] [等待|děng dài] [的|de] [人|rén]', '[待|ま]つ [人|ひと] の ため に'),
    grotto: L('The Frogs’ Grotto', 'La Gruta de las Ranas', 'A Gruta dos Sapos', 'Die Froschgrotte', '[青蛙|qīng wā] [洞|dòng]', 'カエル の [洞窟|どうくつ]'),
  };
  const LORE = ['El Rey Sapo del lago. Joven, guapo y muy, muy vanidoso.', 'O Rei Sapo do lago. Jovem, bonito e muito, muito vaidoso.', 'Der Froschkönig vom See. Jung, schön und sehr, sehr eitel.',
    '[湖|hú] [里|lǐ] [的|de] [蛙王|wā wáng] 。 [年轻|nián qīng] 、 [帅气|shuài qi] ， [非常|fēi cháng] [自恋|zì liàn] 。', '[湖|みずうみ] の カエル の [王様|おうさま] 。 [若|わか]くて 、 [美男子|びなんし] で 、 とても うぬぼれ[屋|や] 。', 'The lake’s Frog King. Young, handsome and very, very vain.'];
  // ------------------------------------------------------------ things to Look at (each word said aloud and glossed)
  const LOOKS = {
    'look.heron': { w: L('heron', 'la garza', 'a garça', 'der Reiher', '[鹭鸶|lù sī]', 'サギ'), t: 'A gray heron on one leg, out on the mud. It doesn’t move. It’s waiting for a fish.' },
    'look.tadpoles': { w: L('tadpole', 'el renacuajo', 'o girino', 'die Kaulquappe', '[蝌蚪|kē dǒu]', 'おたまじゃくし'), t: 'Tadpoles wriggling in a puddle on the dry lake bed. Little frogs-to-be. Lots of them.' },
    'look.hut': { w: L('reed hut', 'la choza', 'a cabana', 'die Hütte', '[草屋|cǎo wū]', 'あし の [小屋|こや]'), t: 'A fishers’ hut of reeds and planks, with nets drying on its roof.' },
    'look.post': { w: L('post', 'el poste', 'o poste', 'der Pfosten', '[柱子|zhù zi]', '[柱|はしら]'), t: 'A mooring post at the end of the pier, with deep rope marks in the wood. Today it’s still there.' },
    'look.bucket': { w: L('bucket', 'el cubo', 'o balde', 'der Eimer', '[水桶|shuǐ tǒng]', 'バケツ'), t: 'A bucket of little silver fish: Pepe’s catch.' },
    'look.basket': { w: L('basket', 'la cesta', 'o cesto', 'der Korb', '[篮子|lán zi]', 'かご'), t: 'Marina’s basket, tipped over in the mud.' },
    'look.tar': { w: L('tar', 'la brea', 'o piche', 'der Teer', '[柏油|bǎi yóu]', 'タール'), t: 'A pot of black tar, still warm. For the boats’ seams, so the water stays out.' },
    'look.paint': { w: L('paint', 'la pintura', 'a tinta', 'die Farbe', '[油漆|yóu qī]', 'ペンキ'), t: 'The ferry’s fresh paint, blue and white. It still smells new.' },
    'look.pole': { w: L('punt pole', 'la pértiga', 'a vara', 'die Stake', '[篙|gāo]', 'さお'), t: 'The ferryman’s long pole. When the water’s low, you push off the bottom with it.' },
    'look.frost': { w: L('frost', 'la escarcha', 'a geada', 'der Reif', '[霜|shuāng]', '[霜|しも]'), t: 'Frost on the boards of the pier. It’s a cold winter.' },
    'look.prints': { w: L('footprints', 'las huellas', 'as pegadas', 'die Spuren', '[脚印|jiǎo yìn]', '[足跡|あしあと]'), t: 'Small footprints on the sandbar, going out to the little island. A child’s.' },
    'look.arch': { w: L('arch', 'el arco', 'o arco', 'der Bogen', '[拱门|gǒng mén]', 'アーチ'), t: 'An old stone arch on the little island: the grotto’s mouth. Frogs croak inside.' },
    'look.wool': { w: L('wool', 'la lana', 'a lã', 'die Wolle', '[毛线|máo xiàn]', '[毛糸|けいと]'), t: 'A scrap of red wool caught on the rock, the red of a little cap. The boy hid here, in the dark… and couldn’t call out.' },
    'look.gate': { w: L('gate', 'la reja', 'a grade', 'das Gitter', '[铁栅|tiě zhà]', '[格子|こうし]'), t: 'An old iron gate. Its bolt is on the other side.' },
  };
  // ------------------------------------------------------------ the words of then (the teaching table: each is heard in use, in the
  // line, demonstration or Look named last, before any box asks for it). en ~ es ~ pt ~ de ~ zh ~ ja ~ where it's taught
  const WORDS = `ferry ~ el ferry ~ a balsa ~ die Fähre ~ [渡船|dù chuán] ~ フェリー ~ ferryman.hello
low ~ bajo ~ baixo ~ niedrig ~ [低|dī] ~ [低|ひく]い ~ ferryman.hello
winter ~ el invierno ~ o inverno ~ der Winter ~ [冬天|dōng tiān] ~ [冬|ふゆ] ~ ferryman.hello
to go down (the water) ~ bajar ~ baixar ~ sinken ~ [降|jiàng] ~ [下|さ]がる ~ ferryman.hello
shore ~ la orilla ~ a margem ~ das Ufer ~ [岸边|àn biān] ~ [岸|きし] ~ d.ferry, mender.hello
three days ago ~ hace tres días ~ três dias atrás ~ vor drei Tagen ~ [三|sān] [天|tiān] [前|qián] ~ [三日前|みっかまえ] ~ d.ferry
a hundred times ~ cien veces ~ cem vezes ~ hundertmal ~ [一百|yī bǎi] [次|cì] ~ [百回|ひゃっかい] ~ d.ferry
all day ~ todo el día ~ o dia todo ~ den ganzen Tag ~ [一整天|yī zhěng tiān] ~ [一日中|いちにちじゅう] ~ d.ferry
to answer ~ contestar ~ responder ~ antworten ~ [回答|huí dá] ~ [答|こた]える ~ d.ferry
to hide ~ esconderse ~ esconder-se ~ sich verstecken ~ [躲|duǒ] ~ [隠|かく]れる ~ ferryman.go
grotto ~ la gruta ~ a gruta ~ die Grotte ~ [洞穴|dòng xué] ~ [洞窟|どうくつ] ~ ferryman.go
little island ~ la isla chica ~ a ilhota ~ die kleine Insel ~ [小岛|xiǎo dǎo] ~ [小島|こじま] ~ ferryman.go
frog king ~ el rey sapo ~ o rei sapo ~ der Froschkönig ~ [蛙王|wā wáng] ~ カエル の [王様|おうさま] ~ ferryman.go
noise ~ el ruido ~ o barulho ~ der Lärm ~ [噪音|zào yīn] ~ [音|おと] ~ ferryman.go
sandbar ~ el banco de arena ~ o banco de areia ~ die Sandbank ~ [沙洲|shā zhōu] ~ [砂州|さす] ~ ferryman.go
dry ~ seco ~ seco ~ trocken ~ [干|gān] ~ [乾|かわ]いた ~ ferryman.go
to sleep ~ dormir ~ dormir ~ schlafen ~ [睡|shuì] ~ [眠|ねむ]る ~ ferryman.go
end (of the pier) ~ el final ~ o fim ~ das Ende ~ [尽头|jìn tóu] ~ [先|さき] ~ ferryman.go
son ~ el hijo ~ o filho ~ der Sohn ~ [儿子|ér zi] ~ [息子|むすこ] ~ ferryman.son
ferryman ~ el barquero ~ o barqueiro ~ der Fährmann ~ [船夫|chuán fū] ~ [船頭|せんどう] ~ ferryman.son
grandfather ~ el abuelo ~ o avô ~ der Großvater ~ [爷爷|yé ye] ~ おじいさん ~ ferryman.son
to stop (stand still) ~ pararse ~ parar ~ stehen bleiben ~ [停|tíng] ~ [立|た]ち[止|ど]まる ~ ferryman.after
net ~ la red ~ a rede ~ das Netz ~ [渔网|yú wǎng] ~ [網|あみ] ~ mender.hello
to mend ~ remendar ~ remendar ~ flicken ~ [补|bǔ] ~ つくろう ~ mender.hello
needle ~ la aguja ~ a agulha ~ die Nadel ~ [针|zhēn] ~ [針|はり] ~ mender.hello
every day ~ cada día ~ todo dia ~ jeden Tag ~ [每天|měi tiān] ~ [毎日|まいにち] ~ mender.hello
evening ~ la tarde ~ a tarde ~ der Abend ~ [傍晚|bàng wǎn] ~ [夕方|ゆうがた] ~ mender.hello
until night ~ hasta la noche ~ até a noite ~ bis zur Nacht ~ [到|dào] [晚上|wǎn shang] ~ [夜|よる] まで ~ d.mender
lantern (to carry) ~ el farol ~ o lampião ~ die Laterne ~ [灯笼|dēng long] ~ ランタン ~ d.mender
to smile ~ sonreír ~ sorrir ~ lächeln ~ [笑|xiào] ~ [笑|わら]う ~ mender.after
fisherman ~ el pescador ~ o pescador ~ der Fischer ~ [渔夫|yú fū] ~ [漁師|りょうし] ~ pepe.hello
fishing rod ~ la caña ~ a vara de pescar ~ die Angel ~ [鱼竿|yú gān] ~ [釣|つ]り[竿|ざお] ~ pepe.hello
hook ~ el anzuelo ~ o anzol ~ der Haken ~ [鱼钩|yú gōu] ~ [釣|つ]り[針|ばり] ~ pepe.hello
a week ago ~ hace una semana ~ há uma semana ~ vor einer Woche ~ [一个|yī gè] [星期|xīng qī] [前|qián] ~ [一週間前|いっしゅうかんまえ] ~ pepe.hello
to lose ~ perder ~ perder ~ verlieren ~ [丢|diū] ~ なくす ~ pepe.hello
rowboat ~ la barca ~ o barco a remo ~ das Ruderboot ~ [小船|xiǎo chuán] ~ ボート ~ d.pepe
to look for ~ buscar ~ procurar ~ suchen ~ [找|zhǎo] ~ [探|さが]す ~ d.pepe
racket ~ el ruidazo ~ o barulhão ~ der Krach ~ [吵闹|chǎo nào] ~ さわぎ ~ d.pepe
to come back ~ volver ~ voltar ~ zurückkommen ~ [回来|huí lai] ~ [帰|かえ]って [来|く]る ~ d.pepe
lake bed ~ el fondo del lago ~ o fundo do lago ~ der Seegrund ~ [湖底|hú dǐ] ~ [湖底|こてい] ~ marina.hello
mud ~ el barro ~ a lama ~ der Schlamm ~ [泥|ní] ~ [泥|どろ] ~ marina.hello
pretty ~ bonito ~ bonito ~ hübsch ~ [漂亮|piào liang] ~ きれい ~ marina.hello
shell ~ la concha ~ a concha ~ die Muschel ~ [贝壳|bèi ké] ~ [貝殻|かいがら] ~ marina.hello
little house ~ la casita ~ a casinha ~ das Häuschen ~ [小房子|xiǎo fáng zi] ~ [小|ちい]さな [家|いえ] ~ d.marina
silence ~ el silencio ~ o silêncio ~ die Ruhe ~ [安静|ān jìng] ~ しずか ~ d.marina
to go away ~ irse ~ ir embora ~ weggehen ~ [走|zǒu] ~ [行|い]って しまう ~ d.marina
village head ~ la jefa del pueblo ~ a chefe do vilarejo ~ die Chefin vom Dorf ~ [村长|cūn zhǎng] ~ [村長|そんちょう] ~ marina.after
to row ~ remar ~ remar ~ rudern ~ [划船|huá chuán] ~ こぐ ~ bartolo.hello
a little ~ un poquito ~ um pouquinho ~ ein bisschen ~ [一点点|yī diǎn diǎn] ~ ちょっと ~ bartolo.hello
to fall ~ caerse ~ cair ~ fallen ~ [掉|diào] ~ [落|お]ちる ~ bartolo.oarLost
splash ~ ¡plaf! ~ tchibum ~ platsch ~ [扑通|pū tōng] ~ ポチャン ~ bartolo.oarLost
wet ~ mojado ~ molhado ~ nass ~ [湿|shī] ~ ぬれた ~ bartolo.oarThanks
the best ~ el mejor ~ o melhor ~ der Beste ~ [最|zuì] [棒|bàng] ~ いちばん ~ bartolo.oarThanks
boat builder ~ el carpintero de barcos ~ o carpinteiro de barcos ~ der Bootsbauer ~ [造船|zào chuán] [木匠|mù jiang] ~ [船大工|ふなだいく] ~ builder.hello
saw ~ la sierra ~ a serra ~ die Säge ~ [锯|jù] ~ のこぎり ~ builder.hello
wood ~ la madera ~ a madeira ~ das Holz ~ [木头|mù tou] ~ [木|き] ~ builder.hello
shed ~ el cobertizo ~ o galpão ~ der Schuppen ~ [棚子|péng zi] ~ [小屋|こや] ~ builder.ask
back (of the body) ~ la espalda ~ as costas ~ der Rücken ~ [腰|yāo] ~ [腰|こし] ~ builder.ask
plank ~ la tabla ~ a tábua ~ das Brett ~ [木板|mù bǎn] ~ [板|いた] ~ builder.ask
bench ~ el banco ~ o banco ~ die Bank ~ [长椅|cháng yǐ] ~ ベンチ ~ d.bench
legs (of a bench) ~ las patas ~ os pés ~ die Beine ~ [腿|tuǐ] ~ [脚|あし] ~ d.bench
to wait ~ esperar ~ esperar ~ warten ~ [等|děng] ~ [待|ま]つ ~ d.bench
standing up ~ de pie ~ em pé ~ im Stehen ~ [站|zhàn] [着|zhe] ~ [立|た]った まま ~ d.bench
to carve ~ tallar ~ entalhar ~ schnitzen ~ [刻|kè] ~ [彫|ほ]る ~ builder.carve
words ~ las palabras ~ as palavras ~ die Worte ~ [字|zì] ~ [言葉|ことば] ~ builder.carve
a hundred years ~ cien años ~ cem anos ~ hundert Jahre ~ [一百|yī bǎi] [年|nián] ~ [百年|ひゃくねん] ~ builder.done
maybe ~ quizás ~ talvez ~ vielleicht ~ [也许|yě xǔ] ~ かも ~ builder.done
boy ~ el niño ~ o menino ~ der Junge ~ [男孩|nán hái] ~ [男|おとこ] の [子|こ] ~ dad.1
with me ~ conmigo ~ comigo ~ mit mir ~ [跟|gēn] [我|wǒ] ~ いっしょ に ~ dad.1
quiet (a person) ~ callado ~ calado ~ still ~ [不|bù] [说话|shuō huà] ~ [無口|むくち] ~ dad.2
concert ~ el concierto ~ o concerto ~ das Konzert ~ [音乐会|yīn yuè huì] ~ コンサート ~ dad.2
kind ~ amable ~ gentil ~ freundlich ~ [心|xīn] [好|hǎo] ~ [優|やさ]しい ~ dad.2
tired ~ cansado ~ cansado ~ müde ~ [累|lèi] ~ [疲|つか]れた ~ dad.2
to call ~ llamar ~ chamar ~ rufen ~ [喊|hǎn] ~ [呼|よ]ぶ ~ dad.3
tonight ~ esta noche ~ hoje à noite ~ heute Nacht ~ [今天|jīn tiān] [晚上|wǎn shang] ~ [今夜|こんや] ~ dad.3
wind ~ el viento ~ o vento ~ der Wind ~ [风|fēng] ~ [風|かぜ] ~ dad.after
to hear ~ oír ~ ouvir ~ hören ~ [听见|tīng jiàn] ~ [聞|き]こえる ~ dad.after
reeds ~ los juncos ~ os juncos ~ das Schilf ~ [芦苇|lú wěi] ~ [葦|あし] ~ d.r0
hole ~ el hueco ~ o buraco ~ das Loch ~ [洞|dòng] ~ [穴|あな] ~ d.r0
dark ~ la oscuridad ~ o escuro ~ das Dunkel ~ [黑暗|hēi àn] ~ [暗|くら]い ~ d.r0
fear ~ el miedo ~ o medo ~ die Angst ~ [害怕|hài pà] ~ [怖|こわ]い ~ d.r0
behind ~ detrás ~ atrás ~ hinter ~ [后面|hòu miàn] ~ [後|うし]ろ ~ d.r0
cave ~ la cueva ~ a caverna ~ die Höhle ~ [山洞|shān dòng] ~ [洞穴|ほらあな] ~ q.fear
tunnel ~ el túnel ~ o túnel ~ der Tunnel ~ [隧道|suì dào] ~ トンネル ~ d.r1
too big ~ muy grande ~ grande demais ~ zu groß ~ [太|tài] [大|dà] ~ [大|おお]きすぎる ~ d.r1
wool ~ la lana ~ a lã ~ die Wolle ~ [毛线|máo xiàn] ~ [毛糸|けいと] ~ look.wool
gate (of bars) ~ la reja ~ a grade ~ das Gitter ~ [铁栅|tiě zhà] ~ [格子|こうし] ~ look.gate
other side ~ el otro lado ~ o outro lado ~ die andere Seite ~ [另|lìng] [一|yī] [边|biān] ~ [向|む]こう[側|がわ] ~ q.pass
lily pad ~ el nenúfar ~ a vitória-régia ~ das Seerosenblatt ~ [荷叶|hé yè] ~ [蓮|はす] の [葉|は] ~ d.r2
key ~ la llave ~ a chave ~ der Schlüssel ~ [钥匙|yào shi] ~ [鍵|かぎ] ~ d.r2
mouth ~ la boca ~ a boca ~ das Maul ~ [嘴|zuǐ] ~ [口|くち] ~ d.r2
to shine ~ brillar ~ brilhar ~ glänzen ~ [发光|fā guāng] ~ [光|ひか]る ~ d.r2
throne ~ el trono ~ o trono ~ der Thron ~ [王座|wáng zuò] ~ [玉座|ぎょくざ] ~ d.r3
shiny ~ brillante ~ brilhante ~ glänzend ~ [亮晶晶|liàng jīng jīng] ~ キラキラ ~ d.r3
guard ~ el guardia ~ o guarda ~ die Wache ~ [卫兵|wèi bīng] ~ [見張|みは]り ~ d.r3
crown ~ la corona ~ a coroa ~ die Krone ~ [王冠|wáng guān] ~ [王冠|おうかん] ~ f.coach
handsome ~ guapo ~ bonito ~ schön ~ [帅|shuài] ~ [美男子|びなんし] ~ f.intro
perfect ~ perfecto ~ perfeito ~ perfekt ~ [完美|wán měi] ~ [完璧|かんぺき] ~ f.phase2
magnificent ~ magnífico ~ magnífico ~ großartig ~ [了不起|liǎo bu qǐ] ~ すばらしい ~ f.q1
lie (not true) ~ la mentira ~ a mentira ~ die Lüge ~ [胡说|hú shuō] ~ うそ ~ f.q2
truth ~ la verdad ~ a verdade ~ die Wahrheit ~ [真话|zhēn huà] ~ [本当|ほんとう] の こと ~ q.told
little voice ~ la vocecita ~ a vozinha ~ das Stimmchen ~ [小小|xiǎo xiǎo] [的|de] [声音|shēng yīn] ~ [小|ちい]さな [声|こえ] ~ f.win
heron ~ la garza ~ a garça ~ der Reiher ~ [鹭鸶|lù sī] ~ サギ ~ look.heron
tadpole ~ el renacuajo ~ o girino ~ die Kaulquappe ~ [蝌蚪|kē dǒu] ~ おたまじゃくし ~ look.tadpoles
puddle ~ el charco ~ a poça ~ die Pfütze ~ [水坑|shuǐ kēng] ~ [水|みず]たまり ~ look.tadpoles
reed hut ~ la choza ~ a cabana ~ die Hütte ~ [草屋|cǎo wū] ~ あし の [小屋|こや] ~ look.hut
post ~ el poste ~ o poste ~ der Pfosten ~ [柱子|zhù zi] ~ [柱|はしら] ~ look.post
bucket ~ el cubo ~ o balde ~ der Eimer ~ [水桶|shuǐ tǒng] ~ バケツ ~ look.bucket
basket ~ la cesta ~ o cesto ~ der Korb ~ [篮子|lán zi] ~ かご ~ d.shells, look.basket
to tip over ~ caerse ~ cair ~ umfallen ~ [倒|dǎo] ~ [倒|たお]れる ~ d.shells
tar ~ la brea ~ o piche ~ der Teer ~ [柏油|bǎi yóu] ~ タール ~ look.tar
paint ~ la pintura ~ a tinta ~ die Farbe ~ [油漆|yóu qī] ~ ペンキ ~ look.paint
punt pole ~ la pértiga ~ a vara ~ die Stake ~ [篙|gāo] ~ さお ~ look.pole
frost ~ la escarcha ~ a geada ~ der Reif ~ [霜|shuāng] ~ [霜|しも] ~ look.frost
footprints ~ las huellas ~ as pegadas ~ die Spuren ~ [脚印|jiǎo yìn] ~ [足跡|あしあと] ~ look.prints
arch ~ el arco ~ o arco ~ der Bogen ~ [拱门|gǒng mén] ~ アーチ ~ look.arch
dusk ~ el atardecer ~ o anoitecer ~ die Dämmerung ~ [黄昏|huáng hūn] ~ [夕暮|ゆうぐ]れ ~ echo.scene
dad ~ papá ~ pai ~ Papa ~ [爸爸|bà ba] ~ お[父|とう]さん ~ echo.scene
here ~ aquí ~ aqui ~ hier ~ [这里|zhè lǐ] ~ ここ ~ echo.scene`;
  // the table keys teach their words when said (time_lake.js LAKET.teach)
  const stamp = (O, pre = '') => Object.entries(O).forEach(([k, T0]) => { if (T0 && typeof T0 === 'object') T0._k = pre + k; });
  stamp(LINES); stamp(DEMO); stamp(LOOKS); stamp(LOGQ, 'q.'); stamp(FIGHT, 'f.');
  const en = (T0, l) => (T0 && (T0['en_' + l] || T0.en)) || '';
  return { L, CAST, LINES, DEMO, MARKS, CARDS, TIPS, TIPS_KING, TASKS, BOSSQ, MEM, FROG, ROOMS, LOGQ, LOGQ_MARKS, FIGHT, NAMES, LORE, LOOKS, WORDS, en };
})();
