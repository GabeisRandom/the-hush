'use strict';
// Port Brisa, the game side (region 6; DESIGN.md 17.1). port.js has the map, the build, the question grader and the first lines;
// port_fort.js the sea fort and its bell; port_music.js the two songs.
//   The road: the fog on it lifts with the fifth bell. At the moat, Marino calls the gulls and Mimo learns «llama» by watching him
//   (heard first, then taught), and calls the flock down on Abel's roof: he wakes and lowers the drawbridge.
//   Dora, the harbor master. Five hushed sailors to ask about Noa: before each one, Marino asks a question with the same question
//   word (qué, de dónde, quién, adónde, por qué), and only then do you ask (PORT.ask.grade, S–D). Their answers lead to the sea fort.
//   Tell Dora; she models the ticket sentences. At Eloy's booth: ask when the boat goes («¿Cuándo sale el barco…?»), then buy a
//   ticket by asking for it («Un boleto para el fuerte, por favor»: PORT.buy.grade, S–D; 4 coins). Call the fort boat from the end
//   of the ferry pier («¡Llama!»); Tere rows you out to the fort (port_fort.js). After the harbor bell: report to Dora (she models
//   «¿Cómo vamos a las ruinas?»), ask Quino at the long pier how to get there, and the big ship sails for the Sunken Ruins
//   (RUINS.arrive()) once you board with your ticket.
//   Side quests: Omar's crabs (beat three crab gangs round the harbor) and the travelers' words (three hushed travelers).
//   PORT.init(game) · interactables() · target() · wayIn() · tick(dt, you) · sync() · crabsOn(state) · person(id) · sayT(p, T, o)
//   PORT.buy.grade(text, lang) → { ok, wrong, letter, reason, slips, soft, model } · PORT.NAMES · PORT._ (scenes, test hooks)
// State: state.port { asked: { greta: 'S', … }, eloyWhen, paid, crabs, trav: { amaia: 'A', … }, quickCall, … }.
(() => {
  const P = PORT, T = P.T;

  // ---------------------------------------------------------------- names (zh / ja in the CJK.md notation; es / pt / de as they are)
  const NAMES = {
    marino: ['Marino', '[马里诺|Mǎ lǐ nuò]', 'マリノ'], abel: ['Abel', '[阿贝尔|Ā bèi ěr]', 'アベル'], dora: ['Dora', '[多拉|Duō lā]', 'ドラ'],
    greta: ['Greta', '[格蕾塔|Gé lěi tǎ]', 'グレタ'], rui: ['Rui', '[鲁伊|Lǔ yī]', 'ルイ'], wei: ['Wei', '[魏|Wèi]', 'ウェイ'], yuki: ['Yuki', '[小雪|Xiǎo xuě]', 'ユキ'],
    omar: ['Omar', '[奥马尔|Ào mǎ ěr]', 'オマール'], tito: ['Eloy', '[埃洛伊|Āi luò yī]', 'エロイ'], tere: ['Tere', '[特蕾|Tè lěi]', 'テレ'], quino: ['Quino', '[基诺|Jī nuò]', 'キノ'],
    f1: ['Mari', '[玛丽|Mǎ lì]', 'マリ'], f2: ['Iñigo', '[伊尼戈|Yī ní gē]', 'イニゴ'], f3: ['Pía', '[皮娅|Pí yà]', 'ピア'], f4: ['Gus', '[古斯|Gǔ sī]', 'ガス'],
    f5: ['Chela', '[切拉|Qiē lā]', 'チェラ'], f6: ['Tavo', '[塔沃|Tǎ wò]', 'タボ'],
    amaia: ['Amaia', '[阿玛娅|Ā mǎ yà]', 'アマイア'], nuno: ['Nuno', '[努诺|Nǔ nuò]', 'ヌノ'], ilse: ['Ilse', '[伊尔莎|Yī ěr shā]', 'イルゼ'],
  };
  if (typeof CJK !== 'undefined' && CJK.addNames) CJK.addNames(['マリノ', 'エロイ', 'イニゴ', 'ガス', 'チェラ', 'アマイア', 'ヌノ', 'イルゼ', 'キノ', 'ミソ']);

  // ---------------------------------------------------------------- lines (T(en, es, pt, de, zh, ja)); the en is the weave's, with slots
  // (port.js's PL has the rest: n.after, n.open, d.hello…; these replace a few of them and add the new scenes')
  const NL = {
    // Marino, the harbor kid who calls the gulls («tú» to you)
    'mn.hi': T('Shh! The drawbridge is up, and Abel, the bridge keeper, is fast asleep in his booth. He went gray, like everyone in Port Brisa. But the {w.gull:pl} still come when I call them!',
      '¡Shh! El puente levadizo está levantado, y Abel, el guardián del puente, duerme en su caseta. Se puso gris, como todos en Puerto Brisa. ¡Pero las gaviotas todavía vienen cuando las llamo!',
      'Psiu! A ponte levadiça está levantada, e o Abel, o guarda da ponte, está dormindo na cabine dele. Ele ficou cinza, como todo mundo no Porto Brisa. Mas as gaivotas ainda vêm quando eu chamo!',
      'Pst! Die Zugbrücke ist oben, und Abel, der Brückenwärter, schläft tief in seinem Häuschen. Er ist grau geworden, wie alle in Port Brisa. Aber die Möwen kommen immer noch, wenn ich sie rufe!',
      '[嘘|xū] ！ [吊桥|diào qiáo] [吊|diào] [起来|qǐ lái] [了|le] ， [守桥|shǒu qiáo] [的|de] [阿贝尔|Ā bèi ěr] [在|zài] [小屋|xiǎo wū] [里|lǐ] [睡着|shuì zháo] [了|le] 。 [他|tā] [跟|gēn] [微风港|Wēi fēng gǎng] [的|de] [人|rén] [一样|yī yàng] ， [变成|biàn chéng] [了|le] [灰色|huī sè] 。 [可是|kě shì] [我|wǒ] [一|yī] [叫|jiào] ， [海鸥|hǎi ōu] [还是|hái shì] [会|huì] [来|lái] ！',
      'しーっ ！ はね[橋|ばし] が [上|あ]がった まま だ よ 。 [橋|はし] の [番人|ばんにん] の アベル は [小屋|こや] で ぐっすり [寝|ね]て る 。 ブリサ [港|こう] の みんな と [同|おな]じ で 、 [灰色|はいいろ] に なっちゃった 。 でも 、 カモメ は [呼|よ]べば まだ [来|く]る ん だ ！'),
    'mn.demo': T('Look! I call the {w.gull:pl}… and they come! You call them too!', '¡Mira! Llamo a las gaviotas… ¡y vienen! ¡Llama tú también!', 'Olha! Eu chamo as gaivotas… e elas vêm! Chama você também!', 'Schau! Ich rufe die Möwen… und sie kommen! Ruf du auch!',
      '[你|nǐ] [看|kàn] ！ [我|wǒ] [叫|jiào] [海鸥|hǎi ōu] … [它们|tā men] [就|jiù] [来|lái] [了|le] ！ [你|nǐ] [也|yě] [叫|jiào] ！', '[見|み]て ！ カモメ を [呼|よ]ぶ と … [来|く]る ん だ ！ いっしょ に [呼|よ]んで ！'),
    'mn.again': T('Call the {w.gull:pl}! Abel’s booth is right inside the gate: they’ll land on his roof and wake him up.', '¡Llama a las gaviotas! La caseta de Abel está justo detrás de la puerta: se van a posar en su techo y lo van a despertar.', 'Chama as gaivotas! A cabine do Abel fica logo atrás do portão: elas vão pousar no telhado e acordar ele.', 'Ruf die Möwen! Abels Häuschen ist gleich hinter dem Tor: Sie landen auf seinem Dach und wecken ihn auf.',
      '[叫|jiào] [海鸥|hǎi ōu] [吧|ba] ！ [阿贝尔|Ā bèi ěr] [的|de] [小屋|xiǎo wū] [就|jiù] [在|zài] [门|mén] [后面|hòu miàn] ： [海鸥|hǎi ōu] [会|huì] [落|luò] [在|zài] [屋顶|wū dǐng] [上|shàng] ， [把|bǎ] [他|tā] [吵醒|chǎo xǐng] 。', 'カモメ を [呼|よ]んで ！ アベル の [小屋|こや] は [門|もん] の すぐ [後|うし]ろ 。 [屋根|やね] に とまって 、 [起|お]こして くれる よ 。'),
    // Marino asks first, before each sailor (heard before you ask: each question word in use), then says who to ask
    'mq.what': T('And you? What are you doing here, in Port Brisa?', '¿Y tú? ¿Qué haces aquí, en Puerto Brisa?', 'E você? O que você está fazendo aqui no Porto Brisa?', 'Und du? Was machst du hier in Port Brisa?',
      '[那|nà] [你|nǐ] [呢|ne] ？ [你|nǐ] [在|zài] [微风港|Wēi fēng gǎng] [做|zuò] [什么|shén me] ？', 'で 、 あなた は ？ ブリサ [港|こう] で [何|なに] を して いる の ？'),
    'mq.what2': T('Greta, on the fishing pier, is busy with something. Go and ask her what she’s doing!', 'Greta, en el muelle de los pescadores, está ocupada con algo. ¡Ve y pregúntale qué hace!', 'A Greta, no píer dos pescadores, está ocupada com alguma coisa. Vai lá e pergunta o que ela está fazendo!', 'Greta auf dem Fischersteg ist mit irgendwas beschäftigt. Geh hin und frag sie, was sie macht!',
      '[渔船|yú chuán] [码头|mǎ tou] [上|shàng] [的|de] [格蕾塔|Gé lěi tǎ] [在|zài] [忙|máng] [着|zhe] [什么|shén me] 。 [去|qù] [问|wèn] [问|wen] [她|tā] [在|zài] [做|zuò] [什么|shén me] ！', '[漁師|りょうし] の [桟橋|さんばし] の グレタ が 、 [何|なに] か で いそがしそう 。 [何|なに] を して いる か [聞|き]いて みて ！'),
    'mq.from': T('And where do you come from? You’re not from here!', '¿Y de dónde vienes? ¡Tú no eres de aquí!', 'E de onde você vem? Você não é daqui!', 'Und woher kommst du? Du bist nicht von hier!',
      '[那|nà] [你|nǐ] [从|cóng] [哪里|nǎ lǐ] [来|lái] ？ [你|nǐ] [不|bù] [是|shì] [这里|zhè lǐ] [的|de] [人|rén] ！', 'あなた は どこ から [来|き]た の ？ ここ の [人|ひと] じゃ ない よ ね ！'),
    'mq.from2': T('Old Rui, on his bench by the fish market, comes from far away too. Ask him where he comes from!', 'El viejo Rui, en su banco junto a la lonja, también viene de lejos. ¡Pregúntale de dónde viene!', 'O velho Rui, no banco perto do mercado de peixe, também vem de longe. Pergunta de onde ele vem!', 'Der alte Rui auf seiner Bank beim Fischmarkt kommt auch von weit her. Frag ihn, woher er kommt!',
      '[鱼市|yú shì] [旁边|páng biān] [长椅|cháng yǐ] [上|shàng] [的|de] [老|lǎo] [鲁伊|Lǔ yī] [也|yě] [是|shì] [从|cóng] [很|hěn] [远|yuǎn] [的|de] [地方|dì fang] [来|lái] [的|de] 。 [问|wèn] [问|wen] [他|tā] [从|cóng] [哪里|nǎ lǐ] [来|lái] ！', '[魚市場|うおいちば] の [前|まえ] の ベンチ に いる ルイ じいさん も 、 [遠|とお]く から [来|き]た ん だ 。 どこ から [来|き]た か [聞|き]いて みて ！'),
    'mq.who': T('Who has something to eat? I’m so hungry!', '¿Quién tiene algo de comer? ¡Tengo mucha hambre!', 'Quem tem alguma coisa pra comer? Estou com muita fome!', 'Wer hat was zu essen? Ich habe so einen Hunger!',
      '[谁|shéi] [有|yǒu] [吃|chī] [的|de] ？ [我|wǒ] [好|hǎo] [饿|è] ！', 'だれ か 、 [食|た]べ[物|もの] を [持|も]って る ？ おなか ぺこぺこ ！'),
    'mq.who2': T('Wei sells soup at his cart in the plaza, and he knows everyone. Ask him who has the boat {w.ticket:pl}!', 'Wei vende sopa en su carrito de la plaza y conoce a todo el mundo. ¡Pregúntale quién tiene los boletos del barco!', 'O Wei vende sopa no carrinho da praça e conhece todo mundo. Pergunta quem tem as passagens do barco!', 'Wei verkauft Suppe an seinem Wagen auf dem Platz und kennt jeden. Frag ihn, wer die Fahrkarten für das Boot hat!',
      '[魏|Wèi] [在|zài] [广场|guǎng chǎng] [的|de] [小车|xiǎo chē] [卖|mài] [汤|tāng] ， [他|tā] [谁|shéi] [都|dōu] [认识|rèn shi] 。 [问|wèn] [问|wen] [他|tā] [谁|shéi] [有|yǒu] [船票|chuán piào] ！', 'ウェイ は [広場|ひろば] の [屋台|やたい] で スープ を [売|う]って いて 、 みんな を [知|し]って る 。 だれ が [船|ふね] の きっぷ を [持|も]って いる か [聞|き]いて みて ！'),
    'mq.to': T('Hey, {mimo}! Where are you going so fast?', '¡Eh, {mimo}! ¿Adónde vas tan rápido?', 'Ei, {mimo}! Para onde você vai tão rápido?', 'He, {mimo}! Wohin gehst du so schnell?',
      '[喂|wèi] ， {mimo} ！ [你|nǐ] [这么|zhè me] [急|jí] ， [去|qù] [哪里|nǎ lǐ] ？', 'ねえ 、 {mimo} ！ そんな に [急|いそ]いで 、 どこ に [行|い]く の ？'),
    'mq.to2': T('Yuki, on the ferry pier, keeps looking out at the sea {w.fort}… Ask her where she’s going!', 'Yuki, en el muelle del ferry, no deja de mirar el fuerte del mar… ¡Pregúntale adónde va!', 'A Yuki, no píer da balsa, não para de olhar para o forte do mar… Pergunta para onde ela vai!', 'Yuki auf dem Fährsteg schaut die ganze Zeit zur Seefestung hinüber… Frag sie, wohin sie fährt!',
      '[渡船|dù chuán] [码头|mǎ tou] [上|shàng] [的|de] [小雪|Xiǎo xuě] [一直|yī zhí] [看|kàn] [着|zhe] [海上|hǎi shàng] [城堡|chéng bǎo] … [问|wèn] [问|wen] [她|tā] [去|qù] [哪里|nǎ lǐ] ！', 'フェリー の [桟橋|さんばし] の ユキ が 、 ずっと [海|うみ] の [砦|とりで] を [見|み]て る … どこ に [行|い]く か [聞|き]いて みて ！'),
    'mq.why': T('{mimo}, why are you scared? They’re only {w.crab:pl}!', '{mimo}, ¿por qué tienes miedo? ¡Solo son cangrejos!', '{mimo}, por que você tem medo? São só caranguejos!', '{mimo}, warum hast du Angst? Das sind doch nur Krabben!',
      '{mimo} ， [你|nǐ] [为什么|wèi shén me] [害怕|hài pà] ？ [只是|zhǐ shì] [螃蟹|páng xiè] [啊|a] ！', '{mimo} 、 どうして こわい の ？ ただ の カニ だ よ ！'),
    'mq.why2': T('Omar is even more scared than {mimo}: he’s been up on his crates all day. Ask him why he’s afraid!', 'Omar tiene todavía más miedo que {mimo}: lleva todo el día subido a sus cajas. ¡Pregúntale por qué tiene miedo!', 'O Omar tem ainda mais medo que o {mimo}: está em cima das caixas o dia inteiro. Pergunta por que ele tem medo!', 'Omar hat noch mehr Angst als {mimo}: Er sitzt schon den ganzen Tag auf seinen Kisten. Frag ihn, warum er Angst hat!',
      '[奥马尔|Ào mǎ ěr] [比|bǐ] {mimo} [还|hái] [害怕|hài pà] ： [他|tā] [在|zài] [箱子|xiāng zi] [上|shàng] [待|dāi] [了|le] [一|yī] [整|zhěng] [天|tiān] 。 [问|wèn] [问|wen] [他|tā] [为什么|wèi shén me] [害怕|hài pà] ！', 'オマール は {mimo} より もっと こわがって る 。 [一日中|いちにちじゅう] [箱|はこ] の [上|うえ] に いる ん だ 。 どうして こわい の か [聞|き]いて みて ！'),
    'mn.chat2': T('You asked everyone! Now you sound like a real Port Brisa sailor.', '¡Les preguntaste a todos! Ahora hablas como un marinero de Puerto Brisa de verdad.', 'Você perguntou pra todo mundo! Agora você fala como um marinheiro de verdade do Porto Brisa.', 'Du hast alle gefragt! Jetzt redest du wie ein echter Seemann aus Port Brisa.',
      '[你|nǐ] [问|wèn] [了|le] [每|měi] [一|yī] [个|gè] [人|rén] ！ [现在|xiàn zài] [你|nǐ] [说话|shuō huà] [像|xiàng] [真正|zhēn zhèng] [的|de] [微风港|Wēi fēng gǎng] [水手|shuǐ shǒu] ！', 'みんな に [聞|き]けた ね ！ もう ブリサ [港|こう] の ほんもの の [船乗|ふなの]り みたい ！'),
    // Dora: what the sailors said, and how to get a ticket (the two sentences, heard whole before you say them)
    'd.done': T('So Noa went out to the sea {w.fort}, and then the fog came… The fort {w.boat} is still out there. To get there, you’ll need a {w.ticket} from Eloy, at the blue booth on the quay.',
      'Así que Noa fue al fuerte del mar, y después llegó la niebla… El barco del fuerte sigue allá. Para ir, van a necesitar un boleto. Se lo compran a Eloy, en la taquilla azul del muelle.',
      'Então a Noa foi para o forte do mar, e depois veio a neblina… O barco do forte ainda está lá. Para ir, vocês vão precisar de uma passagem. É só comprar com o Eloy, na bilheteria azul do cais.',
      'Noa ist also zur Seefestung gefahren, und dann kam der Nebel… Das Festungsboot liegt immer noch da draußen. Um hinzukommen, braucht ihr eine Fahrkarte. Die kauft ihr bei Eloy, am blauen Schalter am Kai.',
      '[原来|yuán lái] [诺娅|Nuò yà] [去|qù] [了|le] [海上|hǎi shàng] [城堡|chéng bǎo] ， [然后|rán hòu] [雾|wù] [就|jiù] [来|lái] [了|le] … [城堡|chéng bǎo] [的|de] [船|chuán] [还|hái] [在|zài] [那边|nà biān] 。 [要|yào] [去|qù] [那里|nà lǐ] ， [你们|nǐ men] [得|děi] [有|yǒu] [船票|chuán piào] 。 [在|zài] [码头|mǎ tou] [的|de] [蓝色|lán sè] [售票亭|shòu piào tíng] [找|zhǎo] [埃洛伊|Āi luò yī] [买|mǎi] 。',
      'つまり 、 ノア は [海|うみ] の [砦|とりで] に [行|い]って 、 その [後|あと] [霧|きり] が [来|き]た の ね … [砦|とりで] の [船|ふね] は まだ [向|む]こう に ある 。 [行|い]く に は きっぷ が [要|い]る わ 。 [岸壁|がんぺき] の [青|あお]い [売|う]り[場|ば] で 、 エロイ から [買|か]って 。'),
    'd.model': T('At the booth, first ask Eloy: «When does the boat leave for the fort?». Then ask him for one: «A ticket to the fort, please».',
      'En la taquilla, primero pregúntale a Eloy: «¿Cuándo sale el barco al fuerte?». Después pídele uno: «Un boleto para el fuerte, por favor».',
      'Na bilheteria, primeiro pergunta pro Eloy: «Quando sai o barco para o forte?». Depois pede uma: «Uma passagem para o forte, por favor».',
      'Am Schalter fragst du Eloy zuerst: «Wann fährt das Boot zur Festung?». Dann bittest du um eine: «Eine Fahrkarte zur Festung, bitte».',
      '[到|dào] [了|le] [售票亭|shòu piào tíng] ， [先|xiān] [问|wèn] [埃洛伊|Āi luò yī] ： “ [船|chuán] [什么时候|shén me shí hou] [去|qù] [城堡|chéng bǎo] ？ ” [然后|rán hòu] [跟|gēn] [他|tā] [说|shuō] ： “ [请|qǐng] [给|gěi] [我|wǒ] [一|yī] [张|zhāng] [去|qù] [城堡|chéng bǎo] [的|de] [船票|chuán piào] 。 ”',
      '[売|う]り[場|ば] で は 、 まず エロイ に [聞|き]いて 。 「 [船|ふね] は いつ [砦|とりで] に [行|い]きます か ？ 」 それ から 、 「 [砦|とりで] まで の きっぷ を [一枚|いちまい] ください 」 。'),
    'd.again': T('Ask the sailors good questions, and their words will come back. Who saw the girl with the notebook?', 'Háganles buenas preguntas a los marineros y les vuelven las palabras. ¿Quién vio a la chica del cuaderno?', 'Façam boas perguntas aos marinheiros, e as palavras deles voltam. Quem viu a menina do caderno?', 'Stellt den Seeleuten gute Fragen, dann kommen ihre Worte zurück. Wer hat das Mädchen mit dem Notizbuch gesehen?',
      '[好好|hǎo hǎo] [问|wèn] [水手们|shuǐ shǒu men] [问题|wèn tí] ， [他们|tā men] [的|de] [话|huà] [就|jiù] [会|huì] [回来|huí lái] 。 [谁|shéi] [看见|kàn jiàn] [了|le] [那个|nà gè] [拿|ná] [本子|běn zi] [的|de] [女孩|nǚ hái] ？', '[船乗|ふなの]り たち に いい [質問|しつもん] を すれば 、 [言葉|ことば] が [戻|もど]って くる わ 。 ノート の [女|おんな]の[子|こ] を だれ が [見|み]た の か しら ？'),
    'd.ticket': T('Eloy’s booth is the blue one, right there on the quay. Ask him when the boat leaves, then ask him for a {w.ticket}.', 'La taquilla de Eloy es la azul, ahí en el muelle. Pregúntale cuándo sale el barco y después pídele un boleto.', 'A bilheteria do Eloy é a azul, ali no cais. Pergunta quando sai o barco e depois pede uma passagem.', 'Eloys Schalter ist der blaue, da drüben am Kai. Frag ihn, wann das Boot fährt, und dann bitte um eine Fahrkarte.',
      '[埃洛伊|Āi luò yī] [的|de] [售票亭|shòu piào tíng] [是|shì] [码头|mǎ tou] [上|shàng] [那个|nà gè] [蓝色|lán sè] [的|de] 。 [先|xiān] [问|wèn] [他|tā] [船|chuán] [什么时候|shén me shí hou] [开|kāi] ， [再|zài] [买|mǎi] [票|piào] 。', 'エロイ の [売|う]り[場|ば] は 、 あそこ の [青|あお]い の よ 。 [船|ふね] が いつ [出|で]る か [聞|き]いて から 、 きっぷ を [頼|たの]んで ね 。'),
    // Eloy, the ticket clerk (formal: «usted»; ja polite)
    't.when': T('The fort {w.boat}? It leaves every morning at nine… but not today. It’s out at the fort, and Tere, its skipper, has gone gray. Today it leaves when somebody calls it!',
      '¿El barco del fuerte? Sale todas las mañanas a las nueve… pero hoy no. Está allá en el fuerte, y Tere, la patrona, está gris. ¡Hoy sale cuando alguien lo llama!',
      'O barco do forte? Sai toda manhã às nove… mas hoje não. Ele está lá no forte, e a Tere, a mestra do barco, está cinza. Hoje ele sai quando alguém chama!',
      'Das Festungsboot? Es fährt jeden Morgen um neun… aber heute nicht. Es liegt drüben an der Festung, und Tere, die Schifferin, ist grau geworden. Heute fährt es, wenn es jemand ruft!',
      '[去|qù] [城堡|chéng bǎo] [的|de] [船|chuán] ？ [每天|měi tiān] [早上|zǎo shang] [九|jiǔ] [点|diǎn] [开|kāi] … [可是|kě shì] [今天|jīn tiān] [不行|bù xíng] 。 [船|chuán] [在|zài] [城堡|chéng bǎo] [那边|nà biān] ， [船长|chuán zhǎng] [特蕾|Tè lěi] [变成|biàn chéng] [了|le] [灰色|huī sè] 。 [今天|jīn tiān] [有|yǒu] [人|rén] [叫|jiào] [它|tā] ， [它|tā] [才|cái] [开|kāi] ！',
      '[砦|とりで] へ の [船|ふね] です か ？ [毎朝|まいあさ] [九時|くじ] に [出|で]ます … でも 、 [今日|きょう] は だめ です 。 [船|ふね] は [砦|とりで] に あって 、 [船長|せんちょう] の テレ は [灰色|はいいろ] です 。 [今日|きょう] は 、 だれ か が [呼|よ]べば [出|で]ます よ ！'),
    't.price': T('A {w.ticket} to the {w.fort}? Four coins, please. Thank you! And remember: the {w.boat} won’t come by itself. Call it from the end of the ferry pier!',
      '¿Un boleto para el fuerte? Son cuatro monedas, por favor. ¡Gracias! Y recuerde: el barco no viene solo. ¡Llámelo desde la punta del muelle del ferry!',
      'Uma passagem para o forte? São quatro moedas, por favor. Obrigado! E lembre: o barco não vem sozinho. Chame ele da ponta do píer da balsa!',
      'Eine Fahrkarte zur Festung? Vier Münzen, bitte. Danke! Und denken Sie daran: Das Boot kommt nicht von allein. Rufen Sie es vom Ende des Fährstegs!',
      '[去|qù] [城堡|chéng bǎo] [的|de] [船票|chuán piào] ？ [四|sì] [个|gè] [金币|jīn bì] 。 [谢谢|xiè xie] ！ [别|bié] [忘了|wàng le] ： [船|chuán] [不会|bù huì] [自己|zì jǐ] [过来|guò lái] 。 [在|zài] [渡船|dù chuán] [码头|mǎ tou] [的|de] [尽头|jìn tóu] [叫|jiào] [它|tā] ！',
      '[砦|とりで] まで の きっぷ です ね 。 コイン [四枚|よんまい] です 。 ありがとう ございます ！ [船|ふね] は [自分|じぶん] で は [来|き]ません 。 フェリー の [桟橋|さんばし] の [先|さき] から [呼|よ]んで ください ！'),
    't.free': T('A {w.ticket} to the {w.fort}? The first trip in days: today it’s free! But remember: the {w.boat} won’t come by itself. Call it from the end of the ferry pier!',
      '¿Un boleto para el fuerte? Es el primer viaje en días: ¡hoy es gratis! Pero recuerde: el barco no viene solo. ¡Llámelo desde la punta del muelle del ferry!',
      'Uma passagem para o forte? É a primeira viagem em dias: hoje é de graça! Mas lembre: o barco não vem sozinho. Chame ele da ponta do píer da balsa!',
      'Eine Fahrkarte zur Festung? Die erste Fahrt seit Tagen: Heute ist sie gratis! Aber denken Sie daran: Das Boot kommt nicht von allein. Rufen Sie es vom Ende des Fährstegs!',
      '[去|qù] [城堡|chéng bǎo] [的|de] [船票|chuán piào] ？ [好|hǎo] [几|jǐ] [天|tiān] [来|lái] [第一|dì yī] [趟|tàng] ， [今天|jīn tiān] [免费|miǎn fèi] ！ [别|bié] [忘了|wàng le] ： [船|chuán] [不会|bù huì] [自己|zì jǐ] [过来|guò lái] 。 [在|zài] [渡船|dù chuán] [码头|mǎ tou] [的|de] [尽头|jìn tóu] [叫|jiào] [它|tā] ！',
      '[砦|とりで] まで の きっぷ です ね 。 [何日|なんにち] ぶり の [便|びん] なので 、 [今日|きょう] は ただ です ！ [船|ふね] は [自分|じぶん] で は [来|き]ません 。 フェリー の [桟橋|さんばし] の [先|さき] から [呼|よ]んで ください ！'),
    't.which': T('A {w.ticket}, yes… but to where? Say where you’re going: to the {w.fort}?', 'Un boleto, sí… ¿pero adónde? Dígame adónde va: ¿al fuerte?', 'Uma passagem, sim… mas para onde? Me diga para onde vai: para o forte?', 'Eine Fahrkarte, ja… aber wohin? Sagen Sie mir, wohin Sie fahren: zur Festung?',
      '[船票|chuán piào] ， [好|hǎo] … [可是|kě shì] [去|qù] [哪里|nǎ lǐ] [的|de] ？ [去|qù] [城堡|chéng bǎo] [吗|ma] ？', 'きっぷ です ね … どこ まで です か ？ [砦|とりで] まで です か ？'),
    't.huh': T('Sorry? This is the {w.ticket} booth. Do you want a {w.ticket}?', '¿Perdón? Esto es la taquilla. ¿Quiere un boleto?', 'Como? Aqui é a bilheteria. Quer uma passagem?', 'Wie bitte? Das ist der Fahrkartenschalter. Möchten Sie eine Fahrkarte?',
      '[什么|shén me] ？ [这里|zhè lǐ] [是|shì] [售票亭|shòu piào tíng] 。 [您|nín] [要|yào] [票|piào] [吗|ma] ？', 'はい ？ ここ は きっぷ [売|う]り[場|ば] です 。 きっぷ です か ？'),
    // Tere, the fort boat's skipper (gray until the bell; then glad)
    'te.h': T('*The fort*… the *boat*… *home*…', 'El *fuerte*… el *barco*… a *casa*…', 'O *forte*… o *barco*… pra *casa*…', 'Die *Festung*… das *Boot*… *nach Hause*…', '[城堡|chéng bǎo] … [船|chuán] … [回家|huí jiā] …', '[砦|とりで] … [船|ふね] … [家|いえ] …'),
    'te.free': T('The fog’s gone! {c.thanks}! Hop in, both of you: I’ll take you anywhere in the bay.', '¡Se fue la niebla! ¡Gracias! Suban los dos: los llevo adonde quieran en la bahía.', 'A neblina foi embora! Obrigada! Subam os dois: eu levo vocês aonde quiserem na baía.', 'Der Nebel ist weg! Danke! Steigt ein, ihr zwei: Ich bringe euch, wohin ihr wollt, in der ganzen Bucht.',
      '[雾|wù] [散|sàn] [了|le] ！ [谢谢|xiè xie] ！ [你们|nǐ men] [俩|liǎ] [上船|shàng chuán] [吧|ba] ： [港湾|gǎng wān] [里|lǐ] [去|qù] [哪里|nǎ lǐ] [我|wǒ] [都|dōu] [送|sòng] [你们|nǐ men] 。', '[霧|きり] が [晴|は]れた ！ ありがとう ！ ふたり とも [乗|の]って 。 [湾|わん] の どこ へ でも [連|つ]れて いく よ 。'),
    // Quino, the big ship's boatman: the sea's too rough (no Sunken Ruins yet)
    'q.rough': T('All aboard? Not today, I’m afraid. The {w.sea} is too rough down south. Come back another day!', '¿Todos a bordo? Hoy no, lo siento. El mar está muy agitado allá en el sur. ¡Vuelvan otro día!', 'Todos a bordo? Hoje não, sinto muito. O mar está muito agitado lá no sul. Voltem outro dia!', 'Alle an Bord? Heute leider nicht. Das Meer ist im Süden zu rau. Kommt an einem anderen Tag wieder!',
      '[上船|shàng chuán] ？ [今天|jīn tiān] [不行|bù xíng] ， [对不起|duì bu qǐ] 。 [南边|nán biān] [的|de] [海|hǎi] [浪|làng] [太|tài] [大|dà] [了|le] 。 [改天|gǎi tiān] [再|zài] [来|lái] [吧|ba] ！', '[乗船|じょうせん] ？ [今日|きょう] は [無理|むり] だ 、 すまない 。 [南|みなみ] の [海|うみ] が [荒|あ]れて いる 。 また [今度|こんど] [来|き]て くれ ！'),
    'q.ticket': T('The ship to the south-east coast? You’ll need a {w.ticket} from Eloy’s booth first.', '¿El barco a la costa del sureste? Primero necesitan un boleto de la taquilla de Eloy.', 'O navio para a costa sudeste? Primeiro vocês precisam de uma passagem da bilheteria do Eloy.', 'Das Schiff zur Südostküste? Zuerst braucht ihr eine Fahrkarte vom Schalter bei Eloy.',
      '[去|qù] [东南|dōng nán] [海岸|hǎi àn] [的|de] [船|chuán] ？ [先|xiān] [去|qù] [埃洛伊|Āi luò yī] [那里|nà lǐ] [买|mǎi] [票|piào] 。', '[南東|なんとう] の [海岸|かいがん] へ の [船|ふね] か ？ まず エロイ の [売|う]り[場|ば] で きっぷ を [買|か]って くれ 。'),
    // after the bell: Dora shows how to ask the way («¿Cómo vamos…?», heard before you ask Quino), and Quino's answer
    'd.how': T('How do you get to the ruins? Ask Quino, the big ship’s boatman, at the long pier: «How do we get to the ruins?». He knows everything about that ship.',
      '¿Cómo llegar a las ruinas? Pregúntenle a Quino, el del barco grande, en el muelle largo: «¿Cómo vamos a las ruinas?». Él sabe todo de ese barco.',
      'Como chegar às ruínas? Perguntem pro Quino, do navio grande, no píer comprido: «Como vamos para as ruínas?». Ele sabe tudo desse navio.',
      'Wie man zu den Ruinen kommt? Fragt Quino vom großen Schiff, am langen Steg: «Wie kommen wir zu den Ruinen?». Er weiß alles über das Schiff.',
      '[怎么|zěn me] [去|qù] [遗迹|yí jì] ？ [去|qù] [长|cháng] [码头|mǎ tou] [问|wèn] [大船|dà chuán] [的|de] [基诺|Jī nuò] ： “ [我们|wǒ men] [怎么|zěn me] [去|qù] [遗迹|yí jì] ？ ” [那|nà] [艘|sōu] [船|chuán] [的|de] [事|shì] [他|tā] [都|dōu] [知道|zhī dào] 。',
      '[遺跡|いせき] へ の [行|い]き[方|かた] ？ [長|なが]い [桟橋|さんばし] に いる [大|おお]きな [船|ふね] の キノ に [聞|き]いて 。 「 [遺跡|いせき] へ は どう やって [行|い]きます か ？ 」 あの [船|ふね] の こと は 、 [何|なん]でも [知|し]って いる わ 。'),
    'q.how': T('How? On my ship, of course! Three days down the coast, to the south-east. Do you have a {w.ticket}?',
      '¿Cómo? ¡En mi barco, claro! Son tres días por la costa, hacia el sureste. ¿Tienen boleto?',
      'Como? No meu navio, claro! São três dias pela costa, para o sudeste. Vocês têm passagem?',
      'Wie? Mit meinem Schiff natürlich! Drei Tage an der Küste entlang, nach Südosten. Habt ihr eine Fahrkarte?',
      '[怎么|zěn me] [去|qù] ？ [当然|dāng rán] [坐|zuò] [我|wǒ] [的|de] [船|chuán] ！ [沿着|yán zhe] [海岸|hǎi àn] [往|wǎng] [东南|dōng nán] [开|kāi] [三|sān] [天|tiān] 。 [你们|nǐ men] [有|yǒu] [船票|chuán piào] [吗|ma] ？',
      'どう やって ？ もちろん 、 わし の [船|ふね] で だ ！ [海岸|かいがん] に そって [南東|なんとう] へ [三日|みっか] だ 。 きっぷ は ある か ？'),
    'q.dora': T('The harbor {w.bell}! You rang it? Then go and tell Dora, on the quay: she’s been waiting for news. Come back after!',
      '¡La campana del puerto! ¿Ustedes la tocaron? Entonces vayan a contárselo a Dora, en el muelle: está esperando noticias. ¡Luego vuelvan!',
      'O sino do porto! Foram vocês que tocaram? Então vão contar pra Dora, no cais: ela está esperando notícias. Depois voltem!',
      'Die Hafenglocke! Ihr habt sie geläutet? Dann erzählt es Dora am Kai: Sie wartet auf Neuigkeiten. Kommt danach wieder!',
      '[港口|gǎng kǒu] [的|de] [钟|zhōng] ！ [是|shì] [你们|nǐ men] [敲|qiāo] [的|de] [吗|ma] ？ [那|nà] [快|kuài] [去|qù] [码头|mǎ tou] [告诉|gào su] [多拉|Duō lā] ， [她|tā] [在|zài] [等|děng] [消息|xiāo xi] 。 [然后|rán hòu] [再|zài] [回来|huí lái] ！',
      '[港|みなと] の [鐘|かね] ！ [鳴|な]らした の は [君|きみ] たち か ？ じゃあ 、 [岸壁|がんぺき] の ドラ に [知|し]らせて こい 。 [知|し]らせ を [待|ま]って いる ぞ 。 それ から また [来|こ]い ！'),
    // Omar's crabs (a side quest), and his thanks
    'o.quest': T('You can hit them from behind? Then… could you chase the {w.crab:pl} away? Three gangs of them: one on the beach, one in the south street, one up the road by the moat.',
      '¿Tú sabes pegarles por detrás? Entonces… ¿puedes espantar a los cangrejos? Son tres pandillas: una en la playa, otra en la calle del sur y otra en el camino, junto al foso.',
      'Você sabe bater neles por trás? Então… você pode espantar os caranguejos? São três bandos: um na praia, outro na rua do sul e outro na estrada, perto do fosso.',
      'Du kannst sie von hinten schlagen? Dann… kannst du die Krabben verjagen? Es sind drei Banden: eine am Strand, eine in der Südstraße und eine draußen am Weg beim Graben.',
      '[你|nǐ] [会|huì] [从|cóng] [后面|hòu miàn] [打|dǎ] [它们|tā men] ？ [那|nà] … [你|nǐ] [能|néng] [把|bǎ] [螃蟹|páng xiè] [赶走|gǎn zǒu] [吗|ma] ？ [一共|yī gòng] [三|sān] [群|qún] ： [一|yī] [群|qún] [在|zài] [海滩|hǎi tān] ， [一|yī] [群|qún] [在|zài] [南街|nán jiē] ， [一|yī] [群|qún] [在|zài] [护城河|hù chéng hé] [边|biān] [的|de] [路|lù] [上|shàng] 。',
      '[後|うし]ろ から [叩|たた]ける の ？ じゃあ … カニ を [追|お]い[払|はら]って くれない か ？ [三|みっ]つ の [群|む]れ が いる 。 [浜|はま] と 、 [南|みなみ] の [通|とお]り と 、 [堀|ほり] の そば の [道|みち] だ 。'),
    'o.thanks': T('All three gangs, gone! I’m coming down. Slowly… Here: this shell whistle was my grandpa’s. Blow it, and the {w.gull:pl} answer!',
      '¡Las tres pandillas, fuera! Ya bajo. Despacito… Toma: este silbato de concha era de mi abuelo. ¡Lo soplas y las gaviotas contestan!',
      'Os três bandos, embora! Já vou descer. Devagarinho… Toma: este apito de concha era do meu avô. Você sopra, e as gaivotas respondem!',
      'Alle drei Banden sind weg! Ich komme runter. Ganz langsam… Hier: Diese Muschelpfeife war von meinem Opa. Du pustest hinein, und die Möwen antworten!',
      '[三|sān] [群|qún] [螃蟹|páng xiè] [都|dōu] [走|zǒu] [了|le] ！ [我|wǒ] [下来|xià lái] [了|le] 。 [慢慢|màn màn] [地|de] … [给|gěi] [你|nǐ] ， [这个|zhè ge] [贝壳|bèi ké] [哨子|shào zi] [是|shì] [我|wǒ] [爷爷|yé ye] [的|de] 。 [一|yī] [吹|chuī] ， [海鸥|hǎi ōu] [就|jiù] [会|huì] [回答|huí dá] ！',
      '[三|みっ]つ とも いなく なった ！ [降|お]りる よ 。 ゆっくり … ほら 、 この [貝|かい] の [笛|ふえ] は じいちゃん の だ 。 [吹|ふ]けば 、 カモメ が [返事|へんじ] を する ん だ ！'),
    'o.wait': T('Are they gone? There were three gangs… Tell me when they’re all gone.', '¿Ya se fueron? Eran tres pandillas… Avísame cuando se vayan todas.', 'Já foram embora? Eram três bandos… Me avisa quando forem todos.', 'Sind sie weg? Es waren drei Banden… Sag Bescheid, wenn alle weg sind.',
      '[它们|tā men] [走|zǒu] [了|le] [吗|ma] ？ [一共|yī gòng] [三|sān] [群|qún] … [都|dōu] [走|zǒu] [了|le] [告诉|gào su] [我|wǒ] 。', 'もう いない ？ [三|みっ]つ の [群|む]れ が いた ん だ … ぜんぶ いなく なったら [教|おし]えて 。'),
    // the travelers waiting for the big ship (a side quest): a hushed line, then their answer
    'tr.h': T('*The ship*… *far*… *waiting*…', 'El *barco*… *lejos*… *esperando*…', 'O *navio*… *longe*… *esperando*…', 'Das *Schiff*… *weit*… *warten*…', '[船|chuán] … [很|hěn] [远|yuǎn] … [等|děng] …', '[船|ふね] … [遠|とお]い … [待|ま]って る …'),
    'tr.amaia': T('I come from the south-east coast, from a canyon of red sand. The big ship takes three days! There are old ruins down there, half under the sand.',
      'Vengo de la costa del sureste, de un cañón de arena roja. ¡El barco grande tarda tres días! Allá abajo hay ruinas antiguas, medio enterradas en la arena.',
      'Eu venho da costa sudeste, de um cânion de areia vermelha. O navio grande leva três dias! Lá embaixo tem ruínas antigas, meio enterradas na areia.',
      'Ich komme von der Südostküste, aus einer Schlucht aus rotem Sand. Das große Schiff braucht drei Tage! Da unten gibt es alte Ruinen, halb im Sand begraben.',
      '[我|wǒ] [从|cóng] [东南|dōng nán] [海岸|hǎi àn] [来|lái] ， [那里|nà lǐ] [有|yǒu] [一个|yī gè] [红沙|hóng shā] [峡谷|xiá gǔ] 。 [大船|dà chuán] [要|yào] [开|kāi] [三|sān] [天|tiān] ！ [那里|nà lǐ] [有|yǒu] [古老|gǔ lǎo] [的|de] [遗迹|yí jì] ， [一半|yī bàn] [埋|mái] [在|zài] [沙子|shā zi] [里|lǐ] 。',
      '[南東|なんとう] の [海岸|かいがん] から [来|き]ました 。 [赤|あか]い [砂|すな] の [谷|たに] が ある ん です 。 [大|おお]きい [船|ふね] で [三日|みっか] かかります ！ そこ に は 、 [半分|はんぶん] [砂|すな] に うまった [古|ふる]い [遺跡|いせき] が あります 。'),
    'tr.nuno': T('I’m going to Molinar, to my grandma’s mill. She makes the best bread in the valley! I haven’t seen her in a year.',
      'Voy a Molinar, al molino de mi abuela. ¡Hace el mejor pan del valle! Hace un año que no la veo.',
      'Eu vou para Molinar, para o moinho da minha avó. Ela faz o melhor pão do vale! Faz um ano que eu não vejo ela.',
      'Ich fahre nach Molinar, zur Mühle meiner Oma. Sie backt das beste Brot im ganzen Tal! Ich habe sie seit einem Jahr nicht gesehen.',
      '[我|wǒ] [去|qù] [磨坊镇|Mò fáng zhèn] ， [去|qù] [我|wǒ] [奶奶|nǎi nai] [的|de] [磨坊|mò fáng] 。 [她|tā] [做|zuò] [的|de] [面包|miàn bāo] [是|shì] [山谷|shān gǔ] [里|lǐ] [最|zuì] [好|hǎo] [的|de] ！ [我|wǒ] [一|yī] [年|nián] [没|méi] [见|jiàn] [她|tā] [了|le] 。',
      'モリナール に [行|い]きます 。 おばあちゃん の [風車|ふうしゃ] [小屋|ごや] です 。 [谷|たに] で いちばん おいしい パン を [焼|や]く ん です よ ！ もう [一年|いちねん] [会|あ]って いません 。'),
    'tr.ilse': T('I’m drawing a map of the whole coast! Look: here’s Port Brisa… the sea {w.fort}… and down here, far to the south, the old ruins.',
      '¡Estoy dibujando un mapa de toda la costa! Mira: aquí está Puerto Brisa… el fuerte del mar… y aquí abajo, lejos en el sur, las ruinas antiguas.',
      'Estou desenhando um mapa da costa inteira! Olha: aqui é o Porto Brisa… o forte do mar… e aqui embaixo, longe no sul, as ruínas antigas.',
      'Ich zeichne eine Karte der ganzen Küste! Schau: Hier ist Port Brisa… die Seefestung… und hier unten, weit im Süden, die alten Ruinen.',
      '[我|wǒ] [在|zài] [画|huà] [整个|zhěng gè] [海岸|hǎi àn] [的|de] [地图|dì tú] ！ [你|nǐ] [看|kàn] ： [这里|zhè lǐ] [是|shì] [微风港|Wēi fēng gǎng] … [海上|hǎi shàng] [城堡|chéng bǎo] … [下面|xià miàn] [这里|zhè lǐ] ， [很|hěn] [远|yuǎn] [的|de] [南边|nán biān] ， [是|shì] [古老|gǔ lǎo] [的|de] [遗迹|yí jì] 。',
      '[海岸|かいがん] ぜんぶ の [地図|ちず] を [描|か]いて いる ん です ！ [見|み]て ： ここ が ブリサ [港|こう] … [海|うみ] の [砦|とりで] … そして ずっと [南|みなみ] の ここ に 、 [古|ふる]い [遺跡|いせき] 。'),
    'tr.chat': T('Thank you! A good question is like a good ticket: it takes you places.', '¡Gracias! Una buena pregunta es como un buen boleto: te lleva lejos.', 'Obrigado! Uma boa pergunta é como uma boa passagem: leva você longe.', 'Danke! Eine gute Frage ist wie eine gute Fahrkarte: Sie bringt dich weit.',
      '[谢谢|xiè xie] ！ [好|hǎo] [问题|wèn tí] [就|jiù] [像|xiàng] [好|hǎo] [船票|chuán piào] ： [能|néng] [带|dài] [你|nǐ] [去|qù] [很|hěn] [远|yuǎn] [的|de] [地方|dì fang] 。', 'ありがとう ！ いい [質問|しつもん] は いい きっぷ と [同|おな]じ 。 [遠|とお]く まで [連|つ]れて いって くれる 。'),
  };
  // (lines from port.js that changed with the rewrite: Tito is Eloy now; the ticket is bought, not given)
  NL['t.how'] = T('With a {w.ticket}, and the {w.boat}! The boat won’t come by itself… Call it from the end of the ferry pier!', '¡Con boleto y con barco! El barco no viene solo… ¡Llámelo desde la punta del muelle del ferry!', 'Com passagem e com barco! O barco não vem sozinho… Chame ele da ponta do píer da balsa!', 'Mit Fahrkarte und mit Boot! Das Boot kommt nicht von allein… Rufen Sie es vom Ende des Fährstegs!',
    '[要|yào] [有|yǒu] [票|piào] ， [也|yě] [要|yào] [有|yǒu] [船|chuán] ！ [船|chuán] [不会|bù huì] [自己|zì jǐ] [过来|guò lái] … [在|zài] [渡船|dù chuán] [码头|mǎ tou] [的|de] [尽头|jìn tóu] [叫|jiào] [它|tā] [吧|ba] ！', 'きっぷ と [船|ふね] で です よ ！ [船|ふね] は [自分|じぶん] で は [来|き]ません … フェリー の [桟橋|さんばし] の [先|さき] から [呼|よ]んで ください ！');
  Object.assign(P.LINES, NL);
  // (Wei and Yuki in the zh lines: the names CJK.md uses, 魏 and 小雪)
  for (const t of Object.values(P.LINES)) if (t && t.zh) t.zh = t.zh.replace(/\[伟\|Wěi\]/g, '[魏|Wèi]').replace(/\[由纪\|Yóu jì\]/g, '[小雪|Xiǎo xuě]').replace(/\[蒂托\|Dì tuō\]/g, '[埃洛伊|Āi luò yī]').replace(/\[特蕾\|Tè léi\]/g, '[特蕾|Tè lěi]');
  for (const t of Object.values(P.LINES)) if (t) for (const l of ['en', 'es', 'pt', 'de']) if (t[l]) t[l] = t[l].replace(/\bTito\b/g, 'Eloy');
  for (const t of Object.values(P.LINES)) if (t && t.ja) t.ja = t.ja.replace(/ティト/g, 'エロイ');

  // ---------------------------------------------------------------- the travelers' questions (port.js's grader: new keys, the same checks)
  const QS = P.ask.QS;
  QS.tr_from = Object.assign({}, QS.from, { who: 'amaia', title: 'Ask Amaia where she comes from.', en: 'where she comes from' });
  QS.tr_to = Object.assign({}, QS.where_go, { who: 'nuno', title: 'Ask Nuno where he’s going.', en: 'where he’s going' });
  QS.tr_what = Object.assign({}, QS.what_do, { who: 'ilse', title: 'Ask Ilse what she’s doing.', en: 'what she’s doing' });
  // (after the bell: how to get to the ruins, asked of Quino; «cómo» and «ir», heard from Dora first)
  QS.how_ruins = Object.assign({}, QS.how_go, { who: 'quino', icon: 'boat', title: 'Ask Quino how you get to the ruins.', en: 'how you get to the ruins',
    model: { es: '¿Cómo vamos a las ruinas?', pt: 'Como vamos para as ruínas?', de: 'Wie kommen wir zu den Ruinen?', zh: '[我们|wǒ men] [怎么|zěn me] [去|qù] [遗迹|yí jì] ？', ja: '[遺跡|いせき] へ は どう やって [行|い]きます か ？', en: 'How do we get to the ruins?' } });
  // the question frames on the ask box (a gap for the rest)
  const FRAME = {
    what: { es: '«¿Qué ___?»', pt: '«O que ___?»', de: '«Was ___?»', zh: '“ ___ [什么|shén me] ？ ”', ja: '「 [何|なに] を ___ か ？ 」' },
    from: { es: '«¿De dónde ___?»', pt: '«De onde ___?»', de: '«Woher ___?»', zh: '“ ___ [从|cóng] [哪里|nǎ lǐ] [来|lái] ？ ”', ja: '「 どこ から ___ か ？ 」' },
    who: { es: '«¿Quién ___?»', pt: '«Quem ___?»', de: '«Wer ___?»', zh: '“ [谁|shéi] ___ ？ ”', ja: '「 だれ が ___ か ？ 」' },
    to: { es: '«¿Adónde ___?»', pt: '«Para onde ___?»', de: '«Wohin ___?»', zh: '“ ___ [去|qù] [哪里|nǎ lǐ] ？ ”', ja: '「 どこ に ___ か ？ 」' },
    why: { es: '«¿Por qué ___?»', pt: '«Por que ___?»', de: '«Warum ___?»', zh: '“ ___ [为什么|wèi shén me] ___ ？ ”', ja: '「 どうして ___ か ？ 」' },
    when: { es: '«¿Cuándo ___?»', pt: '«Quando ___?»', de: '«Wann ___?»', zh: '“ ___ [什么时候|shén me shí hou] ___ ？ ”', ja: '「 いつ ___ か ？ 」' },
    how: { es: '«¿Cómo ___?»', pt: '«Como ___?»', de: '«Wie ___?»', zh: '“ ___ [怎么|zěn me] ___ ？ ”', ja: '「 ___ どう やって ___ か ？ 」' },
    buy: { es: '«Un boleto para ___, por favor»', pt: '«Uma passagem para ___, por favor»', de: '«Eine Fahrkarte zur ___, bitte»', zh: '“ [请|qǐng] [给|gěi] [我|wǒ] [一|yī] [张|zhāng] [去|qù] ___ [的|de] [船票|chuán piào] ”', ja: '「 ___ まで の きっぷ を ください 」' },
  };

  // ---------------------------------------------------------------- buying the ticket by asking for it: PORT.buy.grade(text, lang)
  // → { ok (a ticket was asked for), wrong: null | 'what' (no ticket in it), letter S–D, reason, slips, soft, model }. es / pt / de:
  // the ticket word, where to («para el fuerte»: else Eloy asks where to), the article's gender (un boleto, uma passagem, eine
  // Fahrkarte), a request (quiero / me da / ¿me da…? / or just the thing and «por favor»); «por favor» / «bitte» earns the S.
  // zh: 票 / 船票, the measure word 张 (not 个), 去城堡 for where to, 请 or 我要 / 我想要; ja: きっぷ, 一枚 (soft), 砦まで,
  // ください / お願いします. Each kind of slip counts once: 0 → S (A with only soft notes), 1 → B, 2 → C, 3+ → D.
  const nrm = s => String(s).toLowerCase().replace(/ß/g, 'ss').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const canon = (t, l) => { try { return typeof CJK !== 'undefined' && CJK.canon ? CJK.canon(t, l) : String(t).toLowerCase().replace(/\s+/g, ''); } catch (e) { return String(t).toLowerCase(); } };
  const BUY_MODEL = { es: 'Un boleto para el fuerte, por favor.', pt: 'Uma passagem para o forte, por favor.', de: 'Eine Fahrkarte zur Festung, bitte.', zh: '[请|qǐng] [给|gěi] [我|wǒ] [一|yī] [张|zhāng] [去|qù] [城堡|chéng bǎo] [的|de] [船票|chuán piào] 。', ja: '[砦|とりで] まで の きっぷ を [一枚|いちまい] ください 。', en: 'A ticket to the fort, please.' };
  function buyGrade(text, l) {
    const lang = BUY_MODEL[l] ? l : 'es', raw = String(text || ''), low = raw.toLowerCase(), n = nrm(raw);
    const out = { ok: false, wrong: null, letter: null, reason: '', slips: [], soft: [], model: BUY_MODEL[lang], noWhere: false };
    const slip = (kind, why) => { if (!out.slips.some(s => s.kind === kind)) out.slips.push({ kind, why }); };
    const soft = (kind, why) => { if (!out.soft.some(s => s.kind === kind)) out.soft.push({ kind, why }); };
    if (lang === 'es') {
      const tk = n.match(/\b(boletos?|billetes?|pasajes?|tickets?|entradas?)\b/); if (!tk) { out.wrong = 'what'; return fin(out); }
      if (!/\b(para|al|a)\s+(el\s+)?fuerte\b/.test(n)) { out.noWhere = true; slip('where', 'Say where to: «para el fuerte»'); }
      if (/\b(una|la)\s+(boleto|billete|pasaje|ticket)\b/.test(n)) slip('gender', '«boleto» is masculine: «un boleto»');
      else if (!/\b(un|el|dos|tres|mi|unos)\s+(boletos?|billetes?|pasajes?|tickets?|entradas?)\b/.test(n)) soft('article', 'With its article: «un boleto»');
      if (/\b(quiero|quisiera|me da|me das|deme|dame|me vende|necesito|me puede dar|podria)\b/.test(n)) { /* a request */ } else if (!/\bpor favor\b/.test(n)) slip('ask', 'Ask for it: «Quiero un boleto…» or «Un boleto…, por favor»');
      if (!/\bpor favor\b/.test(n)) soft('please', 'Add «por favor»: it’s polite');
    } else if (lang === 'pt') {
      const tk = n.match(/\b(passagens?|passagem|bilhetes?|tickets?|ingressos?)\b/); if (!tk) { out.wrong = 'what'; return fin(out); }
      if (!/\b(para|pro|pra|ao)\s+(o\s+)?forte\b/.test(n)) { out.noWhere = true; slip('where', 'Say where to: «para o forte»'); }
      if (/\b(um|o)\s+(passagem|passagens)\b/.test(n)) slip('gender', '«passagem» is feminine: «uma passagem»');
      else if (!/\b(uma|a|duas|um|o)\s+(passagens?|passagem|bilhetes?|tickets?)\b/.test(n)) soft('article', 'With its article: «uma passagem»');
      if (/\b(quero|queria|me da|me de|me ve|me vende|preciso|pode me dar)\b/.test(n)) { /* a request */ } else if (!/\bpor favor\b/.test(n)) slip('ask', 'Ask for it: «Quero uma passagem…» or «Uma passagem…, por favor»');
      if (!/\bpor favor\b/.test(n)) soft('please', 'Add «por favor»: it’s polite');
    } else if (lang === 'de') {
      const tk = n.match(/\b(fahrkarten?|tickets?|karten?|fahrscheine?|fahrschein)\b/); if (!tk) { out.wrong = 'what'; return fin(out); }
      if (!/\b(zur|zu der|nach der|bis zur|fur die)\s+festung\b|\bfestung\b/.test(n)) { out.noWhere = true; slip('where', 'Say where to: «zur Festung»'); }
      else if (/\b(zum|zu dem|zu die|nach)\s+festung\b/.test(n)) slip('case', '«die Festung» → «zur Festung» (zu + der)');
      if (/\bein\s+(fahrkarte|karte)\b/.test(n)) slip('gender', '«die Fahrkarte»: «eine Fahrkarte»');
      if (/\b(fahrkarte|karte|fahrschein|ticket)\b/.test(low) && !/\b(Fahrkarte|Karte|Fahrschein|Ticket)n?\b/.test(raw)) soft('caps', 'Nouns take a capital: «die Fahrkarte»');
      if (/\b(mochte|mochten|hatte gern|hatte gerne|will|brauche|kann ich|konnte ich|geben sie mir|bekomme)\b/.test(n)) { /* a request */ } else if (!/\bbitte\b/.test(n)) slip('ask', 'Ask for it: «Ich möchte eine Fahrkarte…» or «Eine Fahrkarte…, bitte»');
      if (!/\bbitte\b/.test(n)) soft('please', 'Add «bitte»: it’s polite');
    } else if (lang === 'zh') {
      const c = canon(raw, 'zh'), roman = !/[㐀-鿿]/.test(raw), has = (ch, py) => raw.includes(ch) || (py && c.includes(py));
      if (!has('票', 'piao')) { out.wrong = 'what'; return fin(out); }
      if (!(has('城堡', 'chengbao') || has('堡', null))) { out.noWhere = true; slip('where', 'Say where to: «去城堡的船票»'); }
      if (has('个票', 'gepiao') || has('个船票', 'gechuanpiao')) slip('measure', 'A ticket takes 张: «一张票»');
      else if (!has('张', 'zhang')) soft('measure', 'With its measure word: «一张船票»');
      if (!(has('请', 'qing') || has('要', 'yao') || has('给我', 'geiwo') || has('买', 'mai'))) slip('ask', 'Ask for it: «我要…» or «请给我…»');
      if (!has('请', 'qing') && !has('谢谢', 'xiexie')) soft('please', 'Start with 请: it’s polite');
      void roman;
    } else {
      const c = canon(raw, 'ja'), has = (s, r) => raw.includes(s) || (r && c.includes(r));
      if (!(has('きっぷ', 'kippu') || has('切符', null) || has('チケット', 'chiketto') || has('券', null))) { out.wrong = 'what'; return fin(out); }
      if (!(has('砦', 'toride') || has('とりで', null))) { out.noWhere = true; slip('where', 'Say where to: «砦まで»'); }
      if (!(has('ください', 'kudasai') || has('下さい', null) || has('お願い', 'onegai') || has('おねがい', null) || has('ほしい', 'hoshii'))) slip('ask', 'Ask for it: «…をください» or «お願いします»');
      if (!(has('枚', 'mai'))) soft('counter', 'Say how many: «一枚» (ichimai)');
      if (!(has('を', null) || / o /.test(' ' + nrm(raw) + ' ') || c.includes('kippuo') || c.includes('chikettoo'))) soft('wo', 'With を before ください (fine to drop with friends)');
    }
    out.ok = true;
    return fin(out);
  }
  function fin(out) {
    const k = out.slips.length;
    out.letter = out.wrong ? null : k === 0 ? (out.soft.length ? 'A' : 'S') : k === 1 ? 'B' : k === 2 ? 'C' : 'D';
    out.reason = out.wrong ? '' : out.letter === 'S' ? 'Perfect!' : out.letter === 'A' ? out.soft[0].why : out.slips[0].why;
    return out;
  }
  Object.assign(P, { NAMES, buy: { grade: buyGrade, MODEL: BUY_MODEL }, FRAME });
})();
// ================================================================ the game side: the road, Marino and the drawbridge, Dora, the sailors, the ticket, the boat
(() => {
  const P = PORT, SPOT = P.SPOT, V = (x, y, z) => new THREE.Vector3(x, y, z);
  let G = null, B = null, synced = '', nudgeCool = 0, curCool = 20, boatPlat = null, riding = false;
  const S = () => { const s = G.state; s.port = s.port || {}; s.port.asked = s.port.asked || {}; s.port.trav = s.port.trav || {}; s.port.demo = s.port.demo || {}; return s.port; };
  const F = () => G.state.flags;
  const mimo = () => G.state.mimoName || 'Mimo';
  const lang = () => G.state.lang || 'es';
  const cjk = l => l === 'zh' || l === 'ja';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const ex = w => (UI.lang === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  const plainOf = src => (cjk(lang()) && typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(src, { lang: lang() }) : src);
  const frameOf = src => (cjk(lang()) && typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(src, { lang: lang(), cap: false }) : src);
  const verbs = () => ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing', 'v.climb', 'v.blow', 'v.call'].filter(id => LEX.item(id));
  const person = id => (B ? B.people.find(p => p.id === id) || null : null);
  const lock = on => { G.sim.lock = on ? 1 : 0; };
  const nameOf = id => { const n = P.NAMES[id === 'nico' ? 'marino' : id]; if (!n) return id; const l = lang(); return l === 'zh' ? plainOf(n[1]) : l === 'ja' ? plainOf(n[2]) : n[0]; };
  const idSeed = id => [...String(id || 'x')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const near = (a, b, r) => Math.hypot(a.x - b.x, a.z - b.z) < r;
  const inRegion = Y => Y.x < -128 && Y.z > -142 && Y.z < -30;
  // the sailors: who asks what (port.js QS keys), their lines' prefix, and the question Marino asks first
  const SAILORS = [
    { id: 'greta', key: 'what_do', k: 'g', demo: 'what' }, { id: 'rui', key: 'from', k: 'r', demo: 'from' }, { id: 'wei', key: 'who_has', k: 'w', demo: 'who' },
    { id: 'yuki', key: 'where_go', k: 'y', demo: 'to' }, { id: 'omar', key: 'why_afraid', k: 'o', demo: 'why' }];
  const TRAVELERS = [{ id: 'amaia', key: 'tr_from', frame: 'from' }, { id: 'nuno', key: 'tr_to', frame: 'to' }, { id: 'ilse', key: 'tr_what', frame: 'what' }];
  const askedN = () => SAILORS.filter(s => S().asked[s.id]).length;
  const travN = () => TRAVELERS.filter(t => S().trav[t.id]).length;
  const crabsOn = s => !!(s && s.flags && s.flags.portGate && s.port && s.port.asked && s.port.asked.omar);
  const PRICE = 4;
  // the Hush eats most of a hushed line's words; the *starred* ones survive (as story.js and gardens.js do it)
  function blank(s, seed) {
    if (!s) return s;
    const R = rng(seed);
    s = s.replace(/\*([^*]+)\*/g, (m, inner) => inner.split(' ').map(w => `*${w}*`).join(' '));      // («*long ago*» → «*long* *ago*»)
    return s.split(' ').map(w => {
      if (/^[¿¡]?\*.*\*[.,…!?！？。]*$/.test(w)) return w.replace(/\*/g, '');
      if (/^[….…]+$/.test(w)) return w;
      const m = w.match(/^(.*?)([.,…!?;:]*)$/);
      return R() < 0.55 ? '▬' + m[2] : w;
    }).join(' ');
  }
  // someone says a line (a T table), through the weave (the mix). o.demo: a demonstration instead (STORY.demoLine: whole in the
  // language and said aloud, with o.demo's marks highlighted and glossed; EN on request); o.hush: gray, flat, words eaten
  function sayT(p, T, o = {}) {
    if (!p || !T) return Promise.resolve();
    const l = lang();
    if (P.NAMES[p.id === 'nico' ? 'marino' : p.id]) p.name = nameOf(p.id);      // (anyone else keeps the name they came with)
    if (o.demo && !o.hush && T[l] && STORY.demoLine) return STORY.demoLine(p, T, o.demo);
    let text = T[l] || '', en = T.en || '';
    if (!cjk(l)) text = text.replace(/\{mimo\}/g, mimo());
    if (o.hush) { const seed = idSeed(p.id); text = cjk(l) ? text.replace(/\*/g, '') : blank(text, seed); en = blank(en, seed + 1); }
    p.lines = { en, [l]: text };
    const pr = STORY.sayInline(p);
    const L = STORY.line;
    if (L && o.hush) { L.hushed = true; L.say = ''; }
    return pr;
  }
  // what each demonstration shows (STORY.demoLine's marks): Marino's questions (the question word and its irregular verb: hacer,
  // venir, tener, ir), Dora's ticket sentences, Omar's «from the front / from behind»
  const Q_MARK = {
    what: { es: [['Qué', 'what'], ['haces', 'you’re doing']], pt: [['O que', 'what'], ['está fazendo', 'are doing']], de: [['Was', 'what'], ['machst', 'are doing']], zh: [['[什么|shén me]', 'what'], ['[做|zuò]', 'do']], ja: [['[何|なに]', 'what'], ['して いる', 'are doing']] },
    from: { es: [['de dónde', 'where from'], ['vienes', 'you come']], pt: [['de onde', 'where from'], ['vem', 'come']], de: [['woher', 'where from'], ['kommst', 'come']], zh: [['[从|cóng] [哪里|nǎ lǐ] [来|lái]', 'come from where']], ja: [['どこ から', 'where from'], ['[来|き]た', 'came']] },
    who: { es: [['Quién', 'who'], ['tiene', 'has']], pt: [['Quem', 'who'], ['tem', 'has']], de: [['Wer', 'who'], ['hat', 'has']], zh: [['[谁|shéi]', 'who'], ['[有|yǒu]', 'has']], ja: [['だれ', 'who'], ['[持|も]って る', 'has']] },
    to: { es: [['Adónde', 'where to'], ['vas', 'you go']], pt: [['Para onde', 'where to'], ['vai', 'go']], de: [['Wohin', 'where to'], ['gehst', 'go']], zh: [['[去|qù] [哪里|nǎ lǐ]', 'go where']], ja: [['どこ に', 'where to'], ['[行|い]く', 'go']] },
    why: { es: [['por qué', 'why'], ['tienes miedo', 'you’re scared']], pt: [['por que', 'why'], ['tem medo', 'are scared']], de: [['warum', 'why'], ['hast du Angst', 'are you scared']], zh: [['[为什么|wèi shén me]', 'why'], ['[害怕|hài pà]', 'scared']], ja: [['どうして', 'why'], ['こわい', 'scared']] },
  };
  const MODEL_MARK = { es: [['Cuándo sale', 'when does … leave'], ['Un boleto para el fuerte', 'a ticket to the fort'], ['por favor', 'please']],
    pt: [['Quando sai', 'when does … leave'], ['Uma passagem para o forte', 'a ticket to the fort'], ['por favor', 'please']],
    de: [['Wann fährt', 'when does … go'], ['Eine Fahrkarte zur Festung', 'a ticket to the fort'], ['bitte', 'please']],
    zh: [['[什么时候|shén me shí hou]', 'when'], ['[请|qǐng] [给|gěi] [我|wǒ]', 'please give me'], ['[一|yī] [张|zhāng]', 'one (ticket)'], ['[船票|chuán piào]', 'boat ticket']],
    ja: [['いつ', 'when'], ['[砦|とりで] まで', 'to the fort'], ['きっぷ', 'ticket'], ['[一枚|いちまい] ください', 'one, please']] };
  const HOW_MARK = { es: [['Cómo vamos', 'how do we get'], ['las ruinas', 'the ruins']], pt: [['Como vamos', 'how do we get'], ['as ruínas', 'the ruins']],
    de: [['Wie kommen wir', 'how do we get'], ['zu den Ruinen', 'to the ruins']], zh: [['[我们|wǒ men] [怎么|zěn me] [去|qù]', 'how do we get to'], ['[遗迹|yí jì]', 'the ruins']], ja: [['どう やって', 'how'], ['[遺跡|いせき]', 'the ruins']] };
  const FRONT_BACK = { es: [['Por delante', 'from the front'], ['por detrás', 'from behind']], pt: [['Pela frente', 'from the front'], ['por trás', 'from behind']],
    de: [['Von vorne', 'from the front'], ['von hinten', 'from behind']], zh: [['[从|cóng] [前面|qián miàn]', 'from the front'], ['[从|cóng] [后面|hòu miàn]', 'from behind']], ja: [['[前|まえ] から', 'from the front'], ['[後|うし]ろ から', 'from behind']] };
  const L = k => P.LINES[k];
  const sayKey = (p, k, o) => sayT(p, L(k), o);
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${mimo()} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  // a gray person gets their colors (and words) back
  function restore(p, instant, pose) {
    if (!p) return;
    p.hushed = false; p.set(pose || p.def.pose || 'idle', false);
    if (!instant) { G.w3d.fx.sparkle(p.x, p.y + 1.3, p.z, 22, ['#ffd166', '#fff3a0', '#8fd3f4']); Sound.play('learned'); }
  }
  function hush(p) { if (p && !p.hushed) { p.hushed = true; p.set(p.def.hushPose || 'hushed', true); } }
  async function untilNear(spot, r, max) { const M = G.sim.mimo; for (let t = 0; t < max && Math.hypot(M.x - spot.x, M.z - spot.z) > r; t += 0.1) await wait(0.1); }
  // a shot of a person (and you), from your side
  function shotOf(p, o = {}) {
    const Y = G.sim.you, dx = p.x - Y.x, dz = p.z - Y.z, dl = Math.hypot(dx, dz) || 1, sx = -dz / dl, sz = dx / dl, side = o.side || 1;
    return { pos: V(p.x - dx / dl * (o.back || 4.2) + sx * side * (o.out || 3.2), (p.y || 0.6) + (o.up || 2.4), p.z - dz / dl * (o.back || 4.2) + sz * side * (o.out || 3.2)), look: V((p.x + Y.x) / 2, (p.y || 0.6) + 1.2, (p.z + Y.z) / 2), dur: o.dur || 0.8 };
  }
  // Marino walks over (quickly) to a spot
  async function marinoTo(at, look) {
    const m = person('nico'); if (!m) return;
    const x0 = m.x, z0 = m.z, d = Math.hypot(at.x - x0, at.z - z0);
    if (d > 0.3) { m.look = at; await tween(Math.min(1.6, 0.25 + d / 9), k => { m.x = lerp(x0, at.x, k); m.z = lerp(z0, at.z, k); m.y = WORLD.groundAt(m.x, m.z, 2); }); }
    m.baseYaw = look ? Math.atan2(look.x - m.x, look.z - m.z) : m.baseYaw; m.look = look || null;
  }

  // ---------------------------------------------------------------- the road, and Marino at the moat: «llama»
  async function arriveRoad() {
    const f = F(); f.portRoad = true; G.save();
    for (const id of ['w.gull', 'w.boat', 'w.sea', 'w.harbor']) if (LEX.item(id)) LEX.expose(id);
    await UI.chapter('The Brisa Road', 'Chapter 1 · The sixth bell');
    await STORY.you('The fog’s gone! The road goes south… I can smell the {w.sea}. Port Brisa must be close.');
  }
  async function marinoScene() {
    const f = F(), m = person('nico'); if (!m) return;
    f.nico = true;
    lock(true); m.look = G.sim.you;
    G.cam.override = { pos: V(m.x + 4.2, m.y + 2.5, m.z - 3.0), look: V(m.x - 1.5, m.y + 1.4, m.z + 1.5), dur: 0.9 };
    await sayKey(m, 'mn.hi');
    await STORY.you('{w.hello}! We need to get into the city. Our friend Noa might be in there.');
    m.look = null; G.cam.override = null; lock(false);
    G.save();
    if (!LEX.taught('v.call')) await watchMarino();
    else await sayKey(m, 'mn.again');
  }
  // he calls, and the gulls come down to him: heard whole in the language (and said aloud) before Mimo is asked the word
  async function watchMarino() {
    const m = person('nico'); if (!m) return;
    lock(true);
    G.cam.override = { pos: V(m.x + 5.0, m.y + 3.4, m.z - 2.4), look: V(m.x - 0.8, m.y + 2.2, m.z + 0.6), dur: 0.8 };
    m.calling = true; Sound.play('chirp'); await wait(0.6); Sound.play('chirp');
    await sayKey(m, 'mn.demo', { demo: ['v.call'] });
    await STORY.youWord('«', STORY.wordPart('v.call'), '»… Marino calls the {w.gull:pl}, and they come down to him!');
    G.cam.override = null; lock(false);
    const r = await STORY.teachWord('v.call', { spot: { x: SPOT.watch.x, z: SPOT.watch.z }, look: { x: m.x, z: m.z }, title: `${mimo()} is watching Marino and the gulls. What is he doing?` });
    m.calling = false;
    if (r && r.ok) await sayKey(m, 'n.after');
    G.save();
  }
  async function marinoTalk() {
    const f = F(), m = person('nico'); if (!m) return;
    if (!f.nico) return marinoScene();
    if (!f.portGate) { if (!LEX.taught('v.call')) return watchMarino(); return sayKey(m, 'mn.again'); }
    if (f.askedAll) return sayKey(m, 'mn.chat2');
    return sayKey(m, 'n.chat');
  }
  // the moat: tell Mimo what to do («¡Llama!»): the gulls land on Abel's roof, he wakes and lowers the drawbridge
  async function bridgeScene() {
    const f = F(), M = G.sim.mimo, st = S();
    if (f.portGate) return;
    let verb = st.quickCall ? 'v.call' : null, ms = 3000;
    if (!verb) {
      const r = await UI.command({ name: mimo(), icon: 'gull', title: `The drawbridge is up, and the moat is deep. Abel, the bridge keeper, is asleep in his booth just inside the gate. What should ${mimo()} do?`, verbs: verbs(), answer: 'v.call' });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); M.tiltT = 1.4; STORY.think(LEX.taught('v.call') ? '{mimo} tilts its head. What did Marino do with the {w.gull:pl}?' : '{mimo} looks at the moat… then at Marino and his {w.gull:pl}.', 5); return; }
      verb = r.verb; ms = r.ms;
    }
    const at = { x: SPOT.moatEdge.x + 0.6, z: SPOT.moatEdge.z - 1.4 };
    if (verb !== 'v.call') {
      if (LEX.taught(verb)) LEX.attempt(verb, { ok: true, hints: 0, ms, mode: 'command' });
      G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
      G.sim.mimoGo(at, { x: P.GATE.x, z: P.GATE.z }); await wait(0.9);
      if (verb === 'v.swim') { Sound.play('poof'); STORY.think('{mimo} paddles across the moat… but the wall is too high, and the bridge is still up. Brrr! Back out.', 4.5); }
      else if (verb === 'v.push') { Sound.play('land', 6); STORY.think('{mimo} pushes the end of the bridge’s chain. It doesn’t budge: it’s locked from inside.', 4.5); }
      else if (verb === 'v.jump') { M.hop = { t: 0 }; Sound.play('jump'); STORY.think('{mimo} hops at the gate. Much too high!', 4); }
      else if (verb === 'v.sing') { Sound.play('sing'); STORY.think('{mimo} sings at the walls. From the booth inside… a snore.', 4); }
      else if (verb === 'v.blow') { Sound.play('blow'); STORY.think('{mimo} blows and blows. The drawbridge doesn’t even creak.', 4); }
      else if (verb === 'v.throw') { Sound.play('whiff'); STORY.think('{mimo} throws a pebble over the wall. Plink! Abel snores on.', 4); }
      else if (verb === 'v.climb') STORY.think('{mimo} tries to climb the wall. The stones are too smooth.', 4);
      else STORY.think('{mimo} tries, but the bridge stays up.', 4);
      G.sim.mimoGo(null, null);
      return;
    }
    learnUse('v.call', ms); st.quickCall = true;
    lock(true);
    const bo = SPOT.booth, ab = person('abel'), m = person('nico');
    G.sim.mimoGo(at, { x: P.GATE.x, z: P.GATE.z }); await untilNear(at, 1.0, 3);
    M.hop = { t: 0 }; Sound.play('chirp'); await wait(0.2); Sound.play('chirp');
    // the whole flock comes in over the moat and settles on the booth's roof
    G.cam.override = { pos: V(-157.5, 6.4, -96.5), look: V(bo.x, 3.0, bo.z), dur: 1.0 };
    if (B.gullsTo) B.gullsTo({ x: bo.x, y: P.CITY.y + 3.4, z: bo.z, r: 1.1 }, 12);
    for (let k = 0; k < 6; k++) { Sound.play('chirp'); await wait(0.35); }
    await wait(0.6);
    // Abel wakes, his colors come back, and he lowers the bridge
    G.cam.override = { pos: V(-160.2, 3.4, -91.0), look: V(ab ? ab.x : bo.x, 1.6, ab ? ab.z : bo.z), dur: 0.9 };
    if (ab) { restore(ab, false); ab.look = { x: P.GATE.x + 4, z: P.GATE.z }; }
    await wait(0.4);
    if (ab) await sayKey(ab, 'a.wake');
    if (B.gullsTo) B.gullsTo(null);
    G.cam.override = { pos: V(-150.5, 5.0, -97.5), look: V(-161, 0.6, -86.5), dur: 0.9 };
    Sound.play('gears'); B.setBridge(true); f.portGate = true; G.save();
    await wait(1.6); Sound.play('land', 14);
    if (ab) ab.look = null;
    if (m) { m.look = G.sim.you; await sayKey(m, 'n.open'); m.look = null; }
    G.cam.override = null; lock(false); G.sim.mimoGo(null, null);
    placeMarino();
  }

  // ---------------------------------------------------------------- the city, and Dora
  async function arriveCity() {
    const f = F(); f.port = true; G.save();
    for (const id of ['w.gull', 'w.boat', 'w.sea', 'w.harbor', 'w.fort', 'w.crab', 'w.ticket']) if (LEX.item(id)) LEX.expose(id);
    await UI.chapter('Port Brisa', 'Chapter 1 · The sixth bell');
    if (!f.dora) await STORY.you('So many {w.boat:pl}… but everyone’s gray and still, like the miners were. Who’s in charge of a harbor? Marino said: Dora.');
  }
  async function doraScene() {
    const d = person('dora'); if (!d) return;
    lock(true);
    G.cam.override = shotOf(d, { back: 3.8, out: 3.0 }); d.look = G.sim.you;
    await sayKey(d, 'd.hello');
    await STORY.you('{w.hello}! We’re looking for our friend Noa: a girl with a notebook. Have you seen her?');
    G.cam.override = { pos: V(-228, 5.2, -84), look: V(-262, 2.6, -88), dur: 1.0 };      // (the bay, the fort out on its islet)
    await sayKey(d, 'd.hush');
    G.cam.override = Object.assign(shotOf(d, { back: 3.8, out: 3.0 }), { dur: 0.9 });
    await sayKey(d, 'd.ask');
    await sayKey(d, 'd.list');
    d.look = null; G.cam.override = null; lock(false);
    F().dora = true; G.save();
    await STORY.you('Five sailors. Marino will know how to ask them… Let’s go, {mimo}.');
  }
  // after the five answers: Noa went to the sea fort. Dora says how to get a ticket, and shows how to ask for one
  async function doraTold() {
    const d = person('dora'); if (!d) return;
    lock(true);
    G.cam.override = shotOf(d, { back: 3.8, out: 3.0 }); d.look = G.sim.you;
    await STORY.you('Dora! Yuki rowed Noa out to the sea {w.fort} yesterday, to see the old {w.bell}. Then the fog came, and Yuki came back alone.');
    await sayKey(d, 'd.done');
    G.cam.override = { pos: V(-226.6, 3.6, -88.4), look: V(SPOT.kiosk.x, 1.8, SPOT.kiosk.z), dur: 0.9 };      // (the blue booth)
    await sayKey(d, 'd.model', { demo: MODEL_MARK });
    d.look = null; G.cam.override = null; lock(false);
    F().doraTold = true; G.save();
  }
  // Report back to Dora after the harbor bell (DESIGN.md 16): the sixth bell, and the big ship south to the Sunken Ruins
  async function reportDora() {
    const d = person('dora'), f = F(); if (!d) return;
    lock(true);
    G.cam.override = shotOf(d, { back: 3.8, out: 3.0 }); d.look = G.sim.you;
    await STORY.you('Dora! The harbor {w.bell} is ringing again, out at the sea {w.fort}!');
    await sayKey(d, 'd.free');
    f.portSixth = true; G.save();
    G.cam.override = { pos: V(-238.5, 4.2, -60.5), look: V(SPOT.ship.x - 2, 2.6, SPOT.ship.z), dur: 1.2 };      // (the big ship at the long pier)
    await wait(0.6);
    await sayKey(d, 'd.next');
    G.cam.override = Object.assign(shotOf(d, { back: 3.8, out: 3.0 }), { dur: 0.9 });
    await sayKey(d, 'd.how', { demo: HOW_MARK });
    d.look = null; G.cam.override = null; lock(false);
    const Q = P.ask.QS.how_ruins;
    await STORY.youWord('«', STORY.wordPart(null, Q.model[lang()] || Q.model.es, Q.model.en.toLowerCase()), '»… so that’s how you ask the way!');
    await STORY.you('The Sunken Ruins… Noa’s page said so too. The big ship, then. Let’s ask its boatman, {mimo}.');
    G.save();
  }
  async function doraTalk() {
    const f = F(), d = person('dora');
    if (!f.dora) return doraScene();
    if (f.portFree) { if (!f.portSixth) return reportDora(); return S().quinoHow ? sayKey(d, 'd.next') : sayKey(d, 'd.how', { demo: HOW_MARK }); }
    if (f.askedAll && !f.doraTold) return doraTold();
    if (f.ticket) return sayKey(d, 'd.boat');
    if (f.doraTold) return sayKey(d, 'd.ticket');
    return sayKey(d, 'd.again');
  }

  // ---------------------------------------------------------------- the sailors: Marino asks first, then you do
  const YOU_ANSWER = {
    what: 'Me? I’m looking for my friend Noa!', from: 'From far away! We came by {w.train}, to visit Noa.', who: 'Ha! {mimo} is always hungry, Marino.',
    to: '{mimo}! Come back! We’re not going anywhere yet.', why: 'It’s okay, {mimo}. They’re only {w.crab:pl}.',
  };
  const ASK_EN = { what: 'what someone is doing', from: 'where someone comes from', who: 'who has something', to: 'where someone is going', why: 'why', when: 'when' };
  async function marinoDemo(s, p) {
    const m = person('nico'), M = G.sim.mimo, Y = G.sim.you; if (!m) return;
    lock(true);
    // he comes running over, between you and the sailor
    const dx = Y.x - p.x, dz = Y.z - p.z, dl = Math.hypot(dx, dz) || 1, at = { x: Y.x - dz / dl * 1.8 + dx / dl * 0.4, z: Y.z + dx / dl * 1.8 + dz / dl * 0.4 };
    if (WORLD.groundAt(at.x, at.z, 2) < -0.2) { at.x = Y.x + 1.4; at.z = Y.z + 1.0; }
    await marinoTo(at, Y);
    G.cam.override = { pos: V((m.x + Y.x) / 2 + dz / dl * 3.6 + dx / dl * 2.4, m.y + 2.3, (m.z + Y.z) / 2 - dx / dl * 3.6 + dz / dl * 2.4), look: V((m.x + Y.x) / 2, m.y + 1.2, (m.z + Y.z) / 2), dur: 0.8 };
    if (s.demo === 'to') { const run = { x: Y.x + dx / dl * -2.5, z: Y.z + dz / dl * -2.5 }; G.sim.mimoGo(run, p); await wait(0.6); }
    if (s.demo === 'why') { M.scared = 3; G.sim.mimoGo({ x: Y.x + dx / dl * 0.9, z: Y.z + dz / dl * 0.9 }, p); }
    if (s.demo === 'who') { M.hop = { t: 0 }; Sound.play('chirp'); }
    m.look = s.demo === 'to' || s.demo === 'why' ? M : Y;
    await sayKey(m, 'mq.' + s.demo, { demo: Q_MARK[s.demo] });
    await STORY.you(YOU_ANSWER[s.demo]);
    G.sim.mimoGo(null, null);
    m.look = p;
    await sayKey(m, 'mq.' + s.demo + '2');
    const Q = P.ask.QS[s.key], src = Q.model[lang()] || Q.model.es;
    await STORY.youWord('«', STORY.wordPart(null, src, Q.model.en.toLowerCase()), `»… so that’s how you ask ${ASK_EN[s.demo]}!`);
    m.look = null; G.cam.override = null; lock(false);
    S().demo[s.demo] = true; G.save();
  }
  async function sailorTalk(p) {
    const s = SAILORS.find(x => x.id === p.id), st = S(), f = F();
    if (!s) return;
    if (st.asked[p.id]) {
      if (p.id === 'omar') return omarAfter(p);
      return sayKey(p, s.k + '.chat');
    }
    await sayKey(p, s.k + '.h', { hush: true });     // (the few words the Hush left them)
    if (!f.dora) { G.sim.mimo.scared = 2.5; STORY.think('Gray and silent, like everyone here. Maybe the harbor master knows what happened.', 5); return; }
    if (!st.demo[s.demo]) await marinoDemo(s, p);
    return askScene(p, s.key, s.demo, async g => {
      st.asked[p.id] = g.letter; G.save();
      restore(p, false, p.id === 'omar' ? 'scared' : null);
      lock(true);
      G.cam.override = shotOf(p, { back: 3.6, out: 2.8 });
      await sayKey(p, s.k + '.ans', p.id === 'omar' ? { demo: FRONT_BACK } : {});
      if (p.id === 'omar') {         // (his answer is how you beat a crab: «por detrás», heard before the crabs come out)
        await STORY.youWord('«', STORY.wordPart(null, BEHIND[lang()] || BEHIND.es, 'from behind'), '»… from behind! So that’s how you beat a {w.crab}.');
        await sayKey(p, 'o.quest');
        st.crabs = st.crabs || 0;
      }
      G.cam.override = null; lock(false);
      if (askedN() >= SAILORS.length && !F().askedAll) {
        F().askedAll = true; G.save();
        await STORY.you('Greta, Rui, Wei, Omar… and Yuki rowed Noa out to the sea {w.fort}! Let’s tell Dora.');
      }
    });
  }
  const BEHIND = { es: 'por detrás', pt: 'por trás', de: 'von hinten', zh: '[从|cóng] [后面|hòu miàn]', ja: '[後|うし]ろ から' };
  const HIS = { greta: 'her', yuki: 'her', amaia: 'her', ilse: 'her', rui: 'his', wei: 'his', omar: 'his', nuno: 'his', tito: 'his', quino: 'his' };      // (the people's, never the player's)
  // ask someone a question (port.js's grader), graded S–D; wrong question words and non-questions get a hint
  async function askScene(p, key, frameKind, onRight) {
    const Q = P.ask.QS[key], l = lang(), nm = nameOf(p.id), FR = P.FRAME[frameKind] || P.FRAME.what;
    const r = await UI.command({ name: mimo(), icon: Q.icon, title: Q.title.replace(/\bTito\b/g, nameOf('tito')).replace(/^Ask (\w+)/, `Ask ${nm}`), verbs: [], placeholder: 'ask a question…',
      hint: `Like Marino asked: ${frameOf(FR[l] || FR.es)} (? shows an example)`, model: plainOf(Q.model[l] || Q.model.es), modelEn: Q.model.en });
    if (!r || r.cancelled) return;
    const g = P.ask.grade(r.text, l, key);
    if (g.wrong === 'none') { Sound.play('wrong'); G.sim.mimoSay('…?', 1.4); STORY.think(`That’s not a question yet. Start with a question word, like Marino did: ${frameOf(FR[l] || FR.es)}`, 5.5); return; }
    if (g.wrong === 'qword') { Sound.play('wrong'); p.hop = true; setTimeout(() => { p.hop = false; }, 600); STORY.think(`${nm} shakes ${HIS[p.id] || 'their'} head slowly. That’s a good question… but about something else. Ask ${Q.en}!`, 5.5); return; }
    UI.toast(`${g.letter} · ${g.reason}`);
    Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    await onRight(g);
  }
  async function omarAfter(p) {
    const st = S();
    if (st.crabsDone) return sayKey(p, 'o.chat');
    if ((st.crabs || 0) >= 3) return omarThanks(p);
    return sayKey(p, 'o.wait');
  }
  async function omarThanks(p) {
    const st = S(), M = G.sim.mimo;
    lock(true);
    G.cam.override = shotOf(p, { back: 3.6, out: 2.8 });
    // he climbs down off his crates
    const g0 = SPOT.omarGround, y0 = p.y, y1 = WORLD.terrainAt(g0.x, g0.z);
    await tween(0.9, k => { p.x = lerp(SPOT.omar.x, g0.x, k); p.z = lerp(SPOT.omar.z, g0.z, k); p.y = lerp(y0, y1, k) + Math.sin(k * Math.PI) * 0.4; });
    p.set('idle', false); p.lift = 0;
    await sayKey(p, 'o.thanks');
    st.crabsDone = true; G.state.coins = (G.state.coins || 0) + 12; G.state.bag = G.state.bag || {}; G.state.bag['k.shellWhistle'] = 1;
    if (LEX.item('k.shellWhistle')) LEX.expose('k.shellWhistle');
    Sound.play('chest'); UI.toast('Omar gave you a shell whistle · +12 coins'); M.happy = 2;
    G.cam.override = null; lock(false); G.save();
  }

  // ---------------------------------------------------------------- Eloy's booth: when the boat leaves, then a ticket, asked for and paid
  async function eloyTalk() {
    const f = F(), st = S(), e = person('tito'); if (!e) return;
    if (f.ticket) return sayKey(e, f.portFree ? 't.chat' : 't.how');
    if (!f.doraTold) { await sayKey(e, 't.h', { hush: true }); STORY.think('The ticket clerk is gray behind his window. First: who saw Noa? Ask the sailors.', 5); return; }
    if (!st.eloyWhen) {
      await sayKey(e, 't.h', { hush: true });
      return askScene(e, 'when_go', 'when', async g => {
        st.eloyWhen = g.letter; G.save();
        restore(e, false);
        lock(true); G.cam.override = { pos: V(SPOT.kioskWin.x + 2.6, 2.6, SPOT.kioskWin.z + 3.0), look: V(e.x, 1.7, e.z), dur: 0.8 };
        await sayKey(e, 't.when');
        G.cam.override = null; lock(false);
        await buyScene(e);
      });
    }
    return buyScene(e);
  }
  async function buyScene(e) {
    const f = F(), st = S(), l = lang(), FR = P.FRAME.buy;
    const r = await UI.command({ name: mimo(), icon: 'ticket', title: `Buy a ticket to the sea fort: ask ${nameOf('tito')} for one.`, verbs: [], placeholder: 'ask for a ticket…',
      hint: `Like Dora said: ${frameOf(FR[l] || FR.es)} (? shows an example)`, model: plainOf(P.buy.MODEL[l] || P.buy.MODEL.es), modelEn: P.buy.MODEL.en });
    if (!r || r.cancelled) return;
    const g = P.buy.grade(r.text, l);
    if (g.wrong === 'what') { Sound.play('wrong'); await sayKey(e, 't.huh'); return; }
    if (g.noWhere) { Sound.play('pip'); await sayKey(e, 't.which'); STORY.think('Say where the ticket is for: to the sea {w.fort}.', 4.5); return; }
    UI.toast(`${g.letter} · ${g.reason}`);
    Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    const pay = (G.state.coins || 0) >= PRICE;
    lock(true); G.cam.override = { pos: V(SPOT.kioskWin.x + 2.6, 2.6, SPOT.kioskWin.z + 3.0), look: V(e.x, 1.7, e.z), dur: 0.8 };
    await sayKey(e, pay ? 't.price' : 't.free');
    if (pay) G.state.coins -= PRICE;
    G.state.bag = G.state.bag || {}; G.state.bag['k.portTicket'] = 1; if (LEX.item('k.portTicket')) LEX.expose('k.portTicket');
    st.ticketGrade = g.letter; f.ticket = true; Sound.play('learned'); UI.toast(pay ? `A ticket to the sea fort · −${PRICE} coins` : 'A ticket to the sea fort · free today!');
    G.cam.override = null; lock(false); G.save();
    await STORY.you('A {w.ticket}! Now… to the end of the ferry pier, and call the {w.boat}.');
  }

  // ---------------------------------------------------------------- the fort boat: call it from the end of the ferry pier, and ride
  async function callBoatScene() {
    const f = F(), st = S(), M = G.sim.mimo;
    if (!f.ticket) { STORY.think('The fort {w.boat} is out by the sea {w.fort}. Eloy, at the blue booth, sells the {w.ticket:pl}…', 4.5); return; }
    if (st.boatAt === 'pier') return rideBoat(true);
    let verb = st.quickBoat ? 'v.call' : null, ms = 3000;
    if (!verb) {
      const r = await UI.command({ name: mimo(), icon: 'boat', title: `The fort’s boat is tied up out at the sea fort, and Tere, its skipper, is gray. What should ${mimo()} do?`, verbs: verbs(), answer: 'v.call' });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); M.tiltT = 1.4; STORY.think('Eloy said the {w.boat} won’t come by itself… What did {mimo} do for Abel?', 5); return; }
      verb = r.verb; ms = r.ms;
      if (verb !== 'v.call') {
        if (LEX.taught(verb)) LEX.attempt(verb, { ok: true, hints: 0, ms, mode: 'command' });
        G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
        STORY.think(verb === 'v.swim' ? '{mimo} looks at the water… It’s much too far to swim with you.' : verb === 'v.blow' ? '{mimo} blows toward the fort. The waves don’t care.' : '{mimo} tries, but the {w.boat} is far away, out by the fort.', 4.5);
        return;
      }
    }
    learnUse('v.call', ms); st.quickBoat = true;
    lock(true);
    const fo = P.FORT;
    G.sim.mimoGo({ x: SPOT.pierEnd.x + 0.6, z: SPOT.pierEnd.z + 0.8 }, fo); await wait(0.5);
    M.hop = { t: 0 }; Sound.play('chirp'); await wait(0.2); Sound.play('chirp');
    G.cam.override = { pos: V(-247.5, 5.0, -80.5), look: V(fo.x + 3, 1.6, fo.z - 1.5), dur: 1.0 };
    if (B.gullsTo) B.gullsTo({ x: SPOT.boatFort.x, y: 2.6, z: SPOT.boatFort.z, r: 1.4 }, 10);
    for (let k = 0; k < 4; k++) { Sound.play('chirp'); await wait(0.4); }
    await B.boatTo(SPOT.boatPier, 6.5);
    st.boatAt = 'pier'; f.boatCalled = true;
    if (B.gullsTo) B.gullsTo(null);
    const y = person('yuki');
    if (y && !y.hushed) { G.cam.override = shotOf(y, { back: 3.4, out: 2.6 }); await sayKey(y, 'y.boat'); }
    G.cam.override = null; lock(false); G.sim.mimoGo(null, null); G.save();
    await rideBoat(true);
  }
  // the ride: you and Mimo aboard, Tere at the helm (gray, but she knows the way by heart; glad after the bell)
  async function rideBoat(out) {
    const f = F(), st = S(), Y = G.sim.you, M = G.sim.mimo, b = B.boat;
    if (riding) return; riding = true;
    lock(true); G.state._autosave = -120;
    try {
      // aboard (at the pier or the fort's dock), then across
      const from = out ? SPOT.boatPier : SPOT.boatFort, to = out ? SPOT.boatFort : SPOT.boatPier;
      if (Math.hypot(b.x - from.x, b.z - from.z) > 0.5) B.setBoat(from, 0);
      await UI.fade(1, 260);
      M.hidden = true; Y.x = b.x - 0.1; Y.z = b.z; G.sim.snap();
      G.cam.override = { pos: V(b.x + (out ? 6 : -6), 3.4, b.z + 7.5), look: V(b.x + (out ? -4 : 4), 0.8, b.z), dur: 0.01 };
      await UI.fade(0, 300);
      const tere = B.objects.tere;
      if (f.portFree && tere) { /* she's glad now */ }
      const pr = B.boatTo(to, out ? 7.5 : 6.5);
      await tween(out ? 7.5 : 6.5, k => {
        Y.x = b.x - Math.cos(b.yaw) * 0.2; Y.z = b.z + Math.sin(b.yaw) * 0.2; Y.yaw = Math.atan2(to.x - from.x, to.z - from.z);
        const o = G.cam.override; if (o) { o.pos.set(b.x + (out ? 5.5 : -5.5) - k * (out ? 4 : -4), 3.2, b.z + 7.0); o.look.set(b.x + (out ? -5 : 5), 0.9, b.z - 0.5); }
        if (Math.random() < 0.08) G.w3d.fx.puff(b.x + Math.cos(b.yaw) * 1.9, -0.3, b.z - Math.sin(b.yaw) * 1.9, 2, 0.16, '#e9f6ff');
      });
      await pr;
      st.boatAt = out ? 'fort' : 'pier';
      const off = out ? SPOT.landing : SPOT.pierEnd;
      Y.x = off.x; Y.z = off.z; Y.yaw = out ? -Math.PI / 2 : Math.PI / 2; M.hidden = false; M.x = off.x + (out ? -0.4 : 0.6); M.z = off.z + 1.0; M.station = null; G.sim.snap();
      G.cam.override = null; G.cam.snap(Y.yaw, 0.3, 8.5);
    } finally { lock(false); riding = false; G.state._autosave = 0; }
    if (out && !f.fortLanded) {
      f.fortLanded = true; G.save();
      await UI.chapter('The Sea Fort', 'Port Brisa · the harbor bell');
      await STORY.you('The sea {w.fort}… Its gate is right there. The harbor {w.bell} is at the very top.');
    }
    G.save();
  }
  // the fort's gate: in (port_fort.js)
  async function fortGate() {
    if (typeof PORTFORT !== 'undefined' && PORTFORT.enter) return PORTFORT.enter();
    STORY.think('The gate is wrapped in gray seaweed… (the sea fort is coming soon!)', 4);
  }

  // ---------------------------------------------------------------- the big ship to the Sunken Ruins (region 7)
  // after the bell and the report to Dora: ask Quino how to get to the ruins («¿Cómo vamos a las ruinas?», Dora's model), then board
  async function quinoTalk() {
    const f = F(), q = person('quino'), st = S(); if (!q) return;
    if (!f.portFree) return sayKey(q, 'q.h', { hush: true });
    if (!f.portSixth) return sayKey(q, 'q.dora');
    if (!st.quinoHow) return askScene(q, 'how_ruins', 'how', async g => {
      st.quinoHow = g.letter; G.save();
      lock(true); G.cam.override = shotOf(q, { back: 3.6, out: 2.8 });
      await sayKey(q, 'q.how');
      G.cam.override = null; lock(false);
      await boardShip(q);
    });
    return boardShip(q);
  }
  async function boardShip(q) {
    if (!F().ticket) return sayKey(q, 'q.ticket');
    if (typeof RUINS === 'undefined' || !RUINS.arrive) return sayKey(q, 'q.rough');
    await sayKey(q, 'q.board');
    try { await RUINS.arrive(); } catch (e) { console.error('[port] RUINS.arrive', e); await UI.fade(0, 300); }      // (region 7 takes it from here: the voyage, and the landing)
    G.save();
  }

  // ---------------------------------------------------------------- the travelers (a side quest): three hushed travelers, three questions
  async function travelerTalk(p) {
    const t = TRAVELERS.find(x => x.id === p.id), st = S();
    if (st.trav[p.id]) return sayKey(p, 'tr.chat');
    if (!F().portFree) await sayKey(p, 'tr.h', { hush: true });      // (after the bell their words are back: just ask)
    if (!F().dora) return;
    return askScene(p, t.key, t.frame, async g => {
      st.trav[p.id] = g.letter; G.save();
      restore(p, false);
      lock(true); G.cam.override = shotOf(p, { back: 3.4, out: 2.6 });
      await sayKey(p, 'tr.' + p.id);
      G.cam.override = null; lock(false);
      if (travN() >= TRAVELERS.length && !st.travDone) { st.travDone = true; G.state.coins = (G.state.coins || 0) + 10; Sound.play('chest'); UI.toast('The travelers’ words are back! · +10 coins'); G.save(); }
    });
  }
  async function folkTalk(p) {
    if (!F().portFree) return sayT(p, P.FOLK_HUSHED, { hush: true });
    return sayT(p, P.FOLK[idSeed(p.id) % P.FOLK.length]);
  }

  // ---------------------------------------------------------------- what you can press E on (outdoors, round the road, the city and the bay)
  function interactables() {
    if (!G || !B) return [];
    const f = F(), st = S(), list = [], Y = G.sim.you;
    if (!inRegion(Y) || !P.open(G.state)) return list;
    const say = () => (st.quickCall ? `«${ex(LEX.form('v.call'))}»` : `Tell ${mimo()}`);
    const m = person('nico'); if (m) list.push({ x: m.x, z: m.z, y: m.y, r: 2.4, label: 'Talk', run: marinoTalk, who: 'marino', p: m });
    if (!f.portGate) { list.push({ x: SPOT.moatEdge.x + 0.4, z: SPOT.moatEdge.z - 1.4, r: 2.6, label: say(), run: bridgeScene }); return list; }
    const ab = person('abel'); if (ab) list.push({ x: ab.x, z: ab.z, y: ab.y, r: 2.3, label: 'Talk', run: () => sayKey(ab, 'a.chat') });
    const d = person('dora');
    const rep = typeof QUESTS !== 'undefined' && QUESTS.reportDue && QUESTS.reportDue('dora');
    if (d) list.push({ x: d.x, z: d.z, y: d.y, r: 2.6, label: rep ? 'Report' : 'Talk', run: doraTalk, who: 'dora', p: d });
    for (const s of SAILORS) { const p = person(s.id); if (p) list.push({ x: p.x, z: p.z, y: p.y, r: 2.4, label: st.asked[s.id] ? 'Talk' : f.dora ? 'Ask' : 'Look', run: () => sailorTalk(p) }); }
    const e = person('tito'); if (e) list.push({ x: SPOT.kioskWin.x, z: SPOT.kioskWin.z, y: P.CITY.y, r: 1.9, label: f.ticket ? 'Talk' : f.doraTold ? 'Ask' : 'Look', run: eloyTalk });
    // the end of the ferry pier: call the boat (or board it); at the fort: back, and the gate
    if (near(Y, SPOT.pierEnd, 4)) list.push({ x: SPOT.pierEnd.x, z: SPOT.pierEnd.z, y: 0.75, r: 2.4, label: !f.ticket ? 'Look' : st.boatAt === 'pier' ? 'Ride to the fort' : st.quickBoat ? `«${ex(LEX.form('v.call'))}»` : `Tell ${mimo()}`, run: callBoatScene });
    if (near(Y, SPOT.landing, 5)) {
      list.push({ x: SPOT.landing.x + 0.8, z: SPOT.landing.z + 0.6, y: 0.75, r: 1.8, label: 'Ride back', run: () => rideBoat(false) });
      list.push({ x: SPOT.fortGate.x + 0.6, z: SPOT.fortGate.z, y: P.FORT.y, r: 2.0, label: 'Go in', run: fortGate });
    }
    const q = person('quino'); if (q) list.push({ x: q.x, z: q.z, y: q.y, r: 2.4, label: f.portFree && f.portSixth && !st.quinoHow ? 'Ask' : f.portFree && f.portSixth && f.ticket && typeof RUINS !== 'undefined' && RUINS.arrive ? 'Board the ship' : 'Talk', run: quinoTalk });
    for (const t of TRAVELERS) { const p = person(t.id); if (p) list.push({ x: p.x, z: p.z, y: p.y, r: 2.2, label: st.trav[t.id] ? 'Talk' : f.dora ? 'Ask' : 'Look', run: () => travelerTalk(p) }); }
    for (const p of B.people) if (p.folk) list.push({ x: p.x, z: p.z, y: p.y, r: 2.0, label: 'Talk', run: () => folkTalk(p) });
    return list;
  }
  // where the compass points: the next thing to do here
  function target() {
    const f = F(), st = S(), Y = G.sim.you;
    if (!P.open(G.state)) return wayIn();
    if (!f.nico || !f.portGate) { if (!inRegion(Y) || Y.z < -112) return wayIn(); return !f.nico || !LEX.taught('v.call') ? person('nico') || SPOT.nico : SPOT.moatEdge; }
    if (!inRegion(Y)) return wayIn();
    if (!f.port) return SPOT.enter;
    if (!f.dora) return person('dora') || SPOT.dora;
    if (!f.askedAll) {
      const left = SAILORS.filter(s => !st.asked[s.id]).map(s => person(s.id)).filter(Boolean);
      if (left.length) return left.reduce((b, p) => (!b || Math.hypot(p.x - Y.x, p.z - Y.z) < Math.hypot(b.x - Y.x, b.z - Y.z) ? p : b), null);
    }
    if (!f.doraTold) return person('dora') || SPOT.dora;
    if (!f.ticket) return SPOT.kioskWin;
    if (!f.portFree) return near(Y, P.FORT, 9) ? SPOT.fortGate : SPOT.pierEnd;
    if (!f.portSixth) return near(Y, P.FORT, 9) ? SPOT.landing : person('dora') || SPOT.dora;
    return person('quino') || SPOT.quino;
  }
  // the way here: west out of Alba, over the Reed River, to Remanso; then the road south from the village's south houses
  function wayIn() {
    const Y = G.sim.you, s = G.state, C = WORLD.L.crossing, K = typeof LAKE !== 'undefined' && LAKE.landmarks, dock = (K && K.riverDockEast) || C.east;
    if (Y.x > C.x + 1) return Y.x > -50 ? { x: -53, z: -150 } : (s.flags.raftWest ? { x: C.x + 4, z: C.z } : dock);
    if (P.roadDist(Y.x, Y.z) > 7 && !inRegion(Y)) return SPOT.roadIn;
    const R = P.ROAD_PTS;
    let k = 0, bd = 1e9; R.forEach(([x, z], i) => { const d = Math.hypot(x - Y.x, z - Y.z); if (d < bd) { bd = d; k = i; } });
    if (!P.open(s) && Y.z < P.FOG.z) return P.FOG;
    const p = R[Math.min(R.length - 1, k + 2)];
    return k + 2 >= R.length ? SPOT.moatEdge : { x: p[0], z: p[1] };
  }

  // ---------------------------------------------------------------- every frame (the story's hooks): the fog, arrivals, Marino, words to teach
  function tick(dt, Y) {
    if (!G || !B) return;
    const f = F();
    nudgeCool -= dt; curCool -= dt;
    if (!P.open(G.state)) {
      if (nudgeCool <= 0 && Math.hypot(Y.x - P.FOG.x, Y.z - P.FOG.z) < 11) {
        nudgeCool = 25; G.sim.mimo.scared = 2.5;
        STORY.think('A thick gray fog lies across the road south. The Hush is too strong here… Maybe once the fifth {w.bell} rings, it will lift.', 6);
      }
      return;
    }
    if (!f.portRoad && P.roadDist(Y.x, Y.z) < 6 && Y.z > P.FOG.z + 1.5) { STORY.run(arriveRoad); return; }
    const m = person('nico');
    if (!f.nico && m && Math.hypot(Y.x - m.x, Y.z - m.z) < 9) { STORY.run(marinoScene); return; }
    if (f.portGate && !f.port && P.inCity(Y.x, Y.z, -1)) { STORY.run(arriveCity); return; }
    // a word Mimo is curious about (seen, not taught yet): the gulls, the boats, the sea, the crabs, the fort, the ticket
    if (curCool <= 0 && f.port && Y.speed < 6 && LEX.mayIntroduce && LEX.mayIntroduce()) {
      curCool = 4;
      const spots = [['w.boat', { x: -241.0, z: -95.2 }], ['w.sea', { x: -236.0, z: -84.0 }], ['w.gull', { x: -236.0, z: -101.0 }], ['w.harbor', { x: -233.0, z: -72.0 }],
        ['w.fort', SPOT.pierEnd], ['w.ticket', SPOT.kioskWin], ['w.crab', SPOT.beach]];
      for (const [id, at] of spots) {
        if (!LEX.item(id) || LEX.taught(id) || !LEX.seen(id) || Math.hypot(Y.x - at.x, Y.z - at.z) > 7) continue;
        curCool = 60; STORY.run(() => STORY.teachWord(id, { spot: { x: at.x + (Y.x - at.x) * 0.4, z: at.z + (Y.z - at.z) * 0.4 }, look: at })); return;
      }
    }
  }
  // the look of things follows the save: the fog, the bridge, who's gray, the boat, the bell, the color
  function sync() {
    if (!G || !B) return;
    const f = F(), st = S(), open = P.open(G.state);
    const key = [open, !!f.portGate, Object.keys(st.asked).sort().join(','), !!st.eloyWhen, Object.keys(st.trav).sort().join(','), !!st.crabsDone, st.boatAt || '', !!f.portFree, G.state.lang].join('|');
    if (key === synced) return;
    const first = !synced;
    synced = key;
    B.setFog(open);
    if (open) liftPatch('portGate', first);
    B.setBridge(!!f.portGate, first || !B.bridgeOnce); B.bridgeOnce = true;
    const ab = person('abel'); if (ab && f.portGate && ab.hushed) restore(ab, true);
    for (const s of SAILORS) { const p = person(s.id); if (!p) continue; if (st.asked[s.id] || f.portFree) { if (p.hushed) restore(p, true, s.id === 'omar' && !st.crabsDone ? 'scared' : null); } }
    const om = person('omar'); if (om && st.crabsDone) { om.x = SPOT.omarGround.x; om.z = SPOT.omarGround.z; om.y = WORLD.terrainAt(om.x, om.z); om.lift = 0; if (om.pose === 'scared') om.set('idle', false); }
    const e = person('tito'); if (e && (st.eloyWhen || f.portFree) && e.hushed) restore(e, true);
    for (const t of TRAVELERS) { const p = person(t.id); if (p && (st.trav[t.id] || f.portFree) && p.hushed) restore(p, true); }
    for (const p of B.people) if (p.folk && f.portFree && p.hushed) restore(p, true);
    const q = person('quino'); if (q && f.portFree && q.hushed) restore(q, true);
    if (f.portFree && B.objects.tere && !B.objects.tere.awake) { B.objects.tere.awake = true; B.objects.tere.set('idle', false); }
    if (first) B.setBoat(st.boatAt === 'pier' ? SPOT.boatPier : SPOT.boatFort, 0);
    B.setBell(!!f.portFree);
    if (f.portFree) liftPatch('port', first);
    if (first) placeMarino();
  }
  function liftPatch(tag, instant) {
    const i = WORLD.L.hush.findIndex(h => h[tag]);
    if (i >= 0 && WORLD.L.hush[i].a > 0.001) G.w3d.liftHush(i, instant);
  }
  // Marino: by the moat until the bridge is down, then just inside the gate (he runs over to you for each question)
  function placeMarino() {
    const m = person('nico'); if (!m) return;
    const at = F().portGate ? { x: -173.4, z: -82.6, yaw: Math.PI / 2 } : SPOT.nico;
    m.x = at.x; m.z = at.z; m.y = WORLD.groundAt(at.x, at.z, 2); m.baseYaw = at.yaw; m.look = null;
  }

  // ---------------------------------------------------------------- more people: Quino, and the three travelers (gardens.js's makers)
  const LOOKS = {
    quino: { shirt: '#2f3f6a', pants: '#3f3a4a', skin: '#a8714a', hair: '#e8e4dc', hat: 'captain', hatCol: '#2f3f6a', beard: true, old: true, wide: 1.15 },
    amaia: { shirt: '#e2574c', pants: '#4a4f66', skin: '#efc29a', hair: '#5a3a24', hat: 'bandana', hatCol: '#f2c94c', pony: true, scarf: '#4c7fd8' },
    nuno: { shirt: '#5fb257', pants: '#3f5f7a', skin: '#c98e62', hair: '#2e2420', hat: 'cap', hatCol: '#e2574c' },
    ilse: { shirt: '#b9a2ff', skirt: '#3f5f7a', skin: '#f0c7a0', hair: '#e8c46a', bun: true, scarf: '#f4efe2' },
  };
  function addPeople() {
    if (!B || typeof GARDENS === 'undefined' || !GARDENS.makePerson) return;
    const add = (id, at, o = {}) => {
      if (person(id)) return;
      const def = { id, name: P.NAMES[id] ? P.NAMES[id][0] : id, x: at.x, z: at.z, yaw: at.yaw || 0, look: LOOKS[id], pose: 'idle', hushPose: 'hushed' };
      const p = GARDENS.makePerson(def, B.group, { hushed: true, gray: true, pose: 'hushed' });
      p.y = o.y !== undefined ? o.y : WORLD.terrainAt(p.x, p.z); p.folk = false; p.traveler = !!o.traveler;
      B.people.push(p);
      if (o.y === undefined) WORLD.addSolids([{ x: p.x, z: p.z, r: 0.4 }]);
    };
    add('quino', SPOT.quino, { y: 0.75 });
    add('amaia', SPOT.trav1, { traveler: true }); add('nuno', SPOT.trav2, { traveler: true }); add('ilse', SPOT.trav3, { traveler: true });
    // suitcases by the travelers
    const k = B.Kit(), GEO = B.GEO;
    for (const [id, dx, dz, col] of [['amaia', 0.6, 0.5, '#8a5a3a'], ['nuno', -0.6, 0.6, '#4c7fd8'], ['ilse', 0.6, -0.4, '#c9643f']]) {
      const p = person(id); if (!p) continue;
      const y = WORLD.terrainAt(p.x + dx, p.z + dz);
      k.box(p.x + dx, y + 0.32, p.z + dz, 0.7, 0.56, 0.3, col, { ry: 0.3, ink: 0.012 }).box(p.x + dx, y + 0.66, p.z + dz, 0.26, 0.08, 0.06, '#3a3046', { ry: 0.3, ink: 0 });
    }
    k.build(B.group);
  }
  // a little moving deck under you on the fort boat (world.js platforms: you ride it like the piers)
  function boatDeck() {
    if (boatPlat || !WORLD.addPlatforms) return;
    boatPlat = { box: [0, 0, 0, 0], top: 0.18 };
    WORLD.addPlatforms([boatPlat]);
  }
  function deckFrame() { if (!boatPlat || !B) return; const b = B.boat; boatPlat.box[0] = b.x - 1.7; boatPlat.box[1] = b.x + 1.7; boatPlat.box[2] = b.z - 0.85; boatPlat.box[3] = b.z + 0.85; }

  // ---------------------------------------------------------------- the module's hooks
  function init(game) {
    G = game; B = game.port || null;
    P.registerWords();
    if (typeof LEX !== 'undefined') {
      const add = [{ id: 'k.portTicket', kind: 'key', es: 'boleto del barco', pt: 'passagem do barco', de: 'Bootsfahrkarte', zh: '[船票|chuán piào]', ja: '[船|ふね] の きっぷ', en: 'boat ticket', g: { es: 'm', pt: 'f', de: 'f' }, icon: 'ticket' },
        { id: 'k.shellWhistle', kind: 'key', es: 'silbato de concha', pt: 'apito de concha', de: 'Muschelpfeife', zh: '[贝壳|bèi ké] [哨子|shào zi]', ja: '[貝|かい] の [笛|ふえ]', en: 'shell whistle', g: { es: 'm', pt: 'm', de: 'f' }, icon: 'sea' }].filter(it => !LEX.item(it.id));
      if (add.length) LEX.register(add);
    }
    if (B) {
      addPeople(); boatDeck();
      const up0 = B.update;
      B.update = (dt, t, you) => { sync(); up0(dt, t, you); deckFrame(); };
    }
    // a crab gang beaten round the harbor counts for Omar
    const rb = G.roamerBeaten;
    G.roamerBeaten = ri => { rb(ri); const r = WORLD.L.roamers[ri]; if (r && r.area === 'port' && S().asked.omar && !S().crabsDone) { S().crabs = Math.min(3, (S().crabs || 0) + 1); UI.toast(`Crab gangs chased off: ${S().crabs}/3`); } };
    if (STORY.extra) STORY.extra.push({ interactables, tick });
    // (zh / ja: the dictionary that reads what you type learns these words)
    if (typeof CJK !== 'undefined' && CJK.addSource) for (const t of Object.values(P.LINES)) for (const s of [t && t.zh, t && t.ja]) if (s) { try { CJK.addSource(s); } catch (e) { /* (optional) */ } }
  }
  Object.assign(P, { init, interactables, target, wayIn, tick, sync, crabsOn, person, sayT, restore, learnUse, liftPatch, SAILORS, TRAVELERS,
    _: { S, MARKS: { Q_MARK, MODEL_MARK, FRONT_BACK, HOW_MARK }, arriveRoad, marinoScene, watchMarino, bridgeScene, arriveCity, doraScene, doraTold, reportDora, sailorTalk, marinoDemo, askScene, eloyTalk, buyScene, callBoatScene, rideBoat, quinoTalk, travelerTalk, omarThanks, placeMarino, askedN, travN } });
  Object.defineProperty(P, 'G', { get: () => G, configurable: true });
  Object.defineProperty(P, 'built', { get: () => B, configurable: true });
})();
