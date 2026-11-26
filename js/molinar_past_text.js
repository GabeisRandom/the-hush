'use strict';
// Molinar, long ago: the words (DESIGN.md 18.6 "T1c", game/TIME.md §11). Every line in es / pt / de, zh and ja in CJK.md's
// notation, and the English the weave mixes from. molinar_past.js is the place, molinar_past_mill.js the Great Mill being built,
// molinar_time_boss.js the first armadillo; time_molinar.js (MOLT) says, demonstrates and grades them.
// The grammar rung (TIME.md §8): the preterite in the 1st and 2nd person, regular («preparé / ¿preparaste?», «comí / ¿comiste?»,
// «subí / ¿subiste?») with «ayer, anoche, el año pasado». People ask what YOU did, and you answer in the 1st person; Mimo's commands
// stay in the 3rd-person past («{mimo} empujó la piedra»). pt: the pretérito perfeito (eu -ei / -i, você -ou / -eu / -iu); de: the
// Perfekt with ich / du (haben, and sein for moving); zh: 了 with 我 / 你 and 昨天 / 去年; ja: ～ました / ～た, あなた questions.
// The cast (each language names its own): the miller's family who fed young Elio (the miller, his wife, their kid: today's miller,
// Trigo's grandpa), the head builder and a young builder of the Great Mill, Marga's grandmother with the first cart, and the
// clockmaker who taught Ciro, with young Ciro himself.
const MPTXT = (() => {
  const L = (en, es, pt, de, zh, ja, o) => Object.assign({ en, es, pt, de, zh, ja }, o || {});
  const CAST = {
    miller: L('Cosme', 'Cosme', 'Seu Tonico', 'Konrad', '[吴|Wú] [大叔|dà shū]', 'ゴンゾウ さん'),
    wife: L('Rosaura', 'Rosaura', 'Dona Rosalina', 'Hedwig', '[秀兰|Xiù lán] [婶|shěn]', 'キヨ さん'),
    kid: L('Brosio', 'Brosio', 'Zezinho', 'Hansi', '[小虎|Xiǎo hǔ]', 'タケル'),
    builder: L('Brígida', 'Brígida', 'Dona Tereza', 'Meisterin Gerda', '[石|Shí] [师傅|shī fu]', '[石田|いしだ] [親方|おやかた]'),
    helper: L('Rufo', 'Rufo', 'Juca', 'Bertl', '[阿|Ā] [强|Qiáng]', 'ヤス'),
    fina: L('Fina', 'Fina', 'Dona Zuza', 'Frieda', '[桂花|Guì huā] [姐|jiě]', 'ハナ さん'),
    master: L('Master Leoncio', 'Maestro Leoncio', 'Mestre Firmino', 'Meister Albrecht', '[钟|Zhōng] [师傅|shī fu]', '[時田|ときた] [先生|せんせい]'),
    ciro: L('Ciro', 'Ciro', 'Ciro', 'Ciro', '[西罗|Xī luó]', 'シロ'),
  };
  // ------------------------------------------------------------ what people say (mixed by the weave; EN on request)
  const LINES = {
    // the miller's family, by the Great Mill (the main path)
    'wife.hello': L('Oh! A new face. Come, come: you look hungry.',
      '¡Ay! Una cara nueva. Ven, ven: tienes cara de hambre.',
      'Ah! Uma cara nova. Vem, vem: você está com cara de fome.',
      'Oh! Ein neues Gesicht. Komm, komm: Du siehst hungrig aus.',
      '[哎|āi] ！ [新|xīn] [面孔|miàn kǒng] 。 [过来|guò lai] ， [过来|guò lai] ： [你|nǐ] [看起来|kàn qǐ lai] [饿|è] [了|le] 。',
      'あら ！ [新|あたら]しい お[顔|かお] です ね 。 どうぞ 、 こちら へ 。 おなか が すいて いる みたい です ね 。'),
    'wife.yes': L('Good! Here, a piece of bread for later. Nobody leaves my door hungry.',
      '¡Bien! Toma, un pedazo de pan para luego. Nadie se va de mi puerta con hambre.',
      'Que bom! Toma, um pedaço de pão pra depois. Ninguém sai da minha porta com fome.',
      'Gut! Hier, ein Stück Brot für später. Niemand geht hungrig von meiner Tür weg.',
      '[好|hǎo] ！ [拿着|ná zhe] ， [一|yī] [块|kuài] [面包|miàn bāo] ， [留着|liú zhe] [以后|yǐ hòu] [吃|chī] 。 [从|cóng] [我|wǒ] [家|jiā] [门口|mén kǒu] [走|zǒu] [的|de] [人|rén] [都|dōu] [不会|bù huì] [饿|è] 。',
      'よかった ！ はい 、 あと で [食|た]べる パン です 。 うち の [前|まえ] で は 、 だれ も おなか を すかせません よ 。'),
    'wife.boy': L('Last autumn a boy came through here, alone, in a red cap. I made him soup and he ate it all… but he never said a word. Not even goodbye.',
      'El otoño pasado pasó por aquí un niño, solo, con una gorra roja. Le preparé sopa y se la comió toda… pero nunca dijo nada. Ni adiós.',
      'No outono passado, um menino passou por aqui, sozinho, de boné vermelho. Eu preparei uma sopa pra ele, e ele comeu tudo… mas nunca disse nada. Nem tchau.',
      'Letzten Herbst kam ein Junge hier vorbei, allein, mit einer roten Mütze. Ich habe ihm Suppe gekocht, und er hat alles gegessen … aber er hat nie ein Wort gesagt. Nicht mal Tschüss.',
      '[去年|qù nián] [秋天|qiū tiān] ， [一个|yī gè] [男孩|nán hái] [一个人|yī gè rén] [来|lái] [到|dào] [这里|zhè lǐ] ， [戴|dài] [着|zhe] [红|hóng] [帽子|mào zi] 。 [我|wǒ] [给|gěi] [他|tā] [做|zuò] [了|le] [汤|tāng] ， [他|tā] [全|quán] [喝|hē] [了|le] … [可是|kě shì] [一|yī] [句|jù] [话|huà] [也|yě] [没|méi] [说|shuō] 。 [连|lián] [再见|zài jiàn] [也|yě] [没|méi] [说|shuō] 。',
      '[去年|きょねん] の [秋|あき] 、 [赤|あか]い [帽子|ぼうし] の [男|おとこ] の [子|こ] が [一人|ひとり] で [来|き]ました 。 スープ を [作|つく]って あげたら 、 [全部|ぜんぶ] [食|た]べました 。 でも 、 ひと[言|こと] も [話|はな]しません でした 。 さよなら も 。'),
    'wife.mill': L('Then he went into the mill we’re building… and since then a young armadillo rolls around up there, and the builders can’t finish. Ask {builder}, the head builder. She could use a hand.',
      'Luego se metió en el molino que estamos construyendo… y desde entonces un armadillo joven rueda allá arriba, y los constructores no pueden terminar. Pregúntale a Brígida, la maestra de obras. Le vendría bien una mano.',
      'Depois ele entrou no moinho que estamos construindo… e desde então um tatu jovem fica rolando lá em cima, e os construtores não conseguem terminar. Fala com a Dona Tereza, a mestre de obras. Uma ajuda ia cair bem.',
      'Dann ist er in die Mühle gegangen, die wir gerade bauen … und seitdem rollt da oben ein junges Gürteltier herum, und die Bauleute werden nicht fertig. Frag Meisterin Gerda, die Baumeisterin. Sie kann Hilfe gebrauchen.',
      '[后来|hòu lái] [他|tā] [进|jìn] [了|le] [我们|wǒ men] [正在|zhèng zài] [盖|gài] [的|de] [磨坊|mò fáng] … [从|cóng] [那|nà] [以后|yǐ hòu] ， [一|yī] [只|zhī] [小|xiǎo] [犰狳|qiú yú] [在|zài] [上面|shàng miàn] [滚来滚去|gǔn lái gǔn qù] ， [工人|gōng rén] [们|men] [没法|méi fǎ] [完工|wán gōng] 。 [去|qù] [问问|wèn wen] [石|Shí] [师傅|shī fu] [吧|ba] ， [她|tā] [是|shì] [工头|gōng tóu] 。',
      'それ から 、 [建|た]てて いる [途中|とちゅう] の [風車|ふうしゃ] に [入|はい]って いきました 。 それ [以来|いらい] 、 [上|うえ] で [子|こ]ども の アルマジロ が ころころ [転|ころ]がって いて 、 [大工|だいく] さん たち が [仕事|しごと] を [終|お]えられない ん です 。 [石田|いしだ] [親方|おやかた] に [聞|き]いて みて ください 。'),
    'wife.again': L('Ask {builder} by the plans table. She’s the one who says who goes in.',
      'Pregúntale a Brígida, junto a la mesa de los planos. Ella decide quién entra.',
      'Fala com a Dona Tereza, do lado da mesa das plantas. É ela que decide quem entra.',
      'Frag Meisterin Gerda am Tisch mit den Plänen. Sie entscheidet, wer reingeht.',
      '[去|qù] [图纸|tú zhǐ] [桌|zhuō] [旁边|páng biān] [问问|wèn wen] [石|Shí] [师傅|shī fu] 。 [谁|shéi] [能|néng] [进去|jìn qu] ， [她|tā] [说了算|shuō le suàn] 。',
      '[図面|ずめん] の [机|つくえ] の そば に いる [石田|いしだ] [親方|おやかた] に [聞|き]いて ください 。 [中|なか] に [入|はい]れる か どう か 、 [親方|おやかた] が [決|き]めます 。'),
    'wife.after': L('That boy… he said thank you? To us? Oh. I always knew he wanted to.',
      'Ese niño… ¿dio las gracias? ¿A nosotros? Ay. Yo siempre supe que quería decirlo.',
      'Aquele menino… agradeceu? A gente? Ai. Eu sempre soube que ele queria dizer.',
      'Dieser Junge … hat Danke gesagt? Zu uns? Oh. Ich wusste immer, dass er es sagen wollte.',
      '[那个|nà ge] [孩子|hái zi] … [说|shuō] [谢谢|xiè xie] [了|le] ？ [对|duì] [我们|wǒ men] ？ [哎|āi] 。 [我|wǒ] [一直|yī zhí] [知道|zhī dào] [他|tā] [想|xiǎng] [说|shuō] 。',
      'あの [子|こ] が … ありがとう って ？ わたし たち に ？ まあ 。 [言|い]いたかった ん だ って 、 ずっと [思|おも]って いました よ 。'),
    'miller.hello': L('This mill will grind for the whole valley. Last year we had only small mills on the hills.',
      'Este molino molerá para todo el valle. El año pasado solo teníamos molinos pequeños en las colinas.',
      'Este moinho vai moer pra todo o vale. No ano passado a gente só tinha moinhos pequenos nos morros.',
      'Diese Mühle wird für das ganze Tal mahlen. Letztes Jahr hatten wir nur kleine Mühlen auf den Hügeln.',
      '[这|zhè] [座|zuò] [磨坊|mò fáng] [会|huì] [给|gěi] [整个|zhěng gè] [山谷|shān gǔ] [磨|mò] [面|miàn] 。 [去年|qù nián] [我们|wǒ men] [只有|zhǐ yǒu] [山坡|shān pō] [上|shàng] [的|de] [小|xiǎo] [风车|fēng chē] 。',
      'この [風車|ふうしゃ] は [谷|たに] [中|じゅう] の [粉|こな] を [挽|ひ]きます 。 [去年|きょねん] は [丘|おか] の [小|ちい]さな [風車|ふうしゃ] しか ありません でした 。'),
    'miller.more': L('My wife makes the best soup in Molinar. Ask anyone.',
      'Mi mujer hace la mejor sopa de Molinar. Pregúntale a cualquiera.',
      'Minha mulher faz a melhor sopa de Molinar. Pergunta pra qualquer um.',
      'Meine Frau kocht die beste Suppe in Molinar. Frag, wen du willst.',
      '[我|wǒ] [老婆|lǎo po] [做|zuò] [的|de] [汤|tāng] [是|shì] [磨坊镇|Mò fáng zhèn] [最|zuì] [好|hǎo] [喝|hē] [的|de] 。 [不信|bù xìn] [你|nǐ] [去|qù] [问|wèn] 。',
      'うち の かみさん の スープ は 、 モリナール で いちばん です 。 だれ に [聞|き]いて も そう [言|い]います よ 。'),
    'kid.hello': L('When I grow up I’ll be a miller like my dad! I’ll grind flour all day!',
      '¡Cuando sea grande, seré molinero como mi papá! ¡Voy a moler harina todo el día!',
      'Quando eu crescer, vou ser moleiro igual ao meu pai! Vou moer farinha o dia todo!',
      'Wenn ich groß bin, werde ich Müller wie mein Papa! Ich mahle dann den ganzen Tag Mehl!',
      '[我|wǒ] [长大|zhǎng dà] [以后|yǐ hòu] [要|yào] [像|xiàng] [我|wǒ] [爸爸|bà ba] [一样|yī yàng] [当|dāng] [磨坊|mò fáng] [师傅|shī fu] ！ [一|yī] [整天|zhěng tiān] [磨|mò] [面粉|miàn fěn] ！',
      '[大|おお]きく なったら 、 お[父|とう]さん みたい な [粉屋|こなや] に なる ん だ ！ [一日中|いちにちじゅう] 、 [粉|こな] を [挽|ひ]く よ ！'),
    // the head builder and the young builder (the way into the mill)
    'helper.demo': L('Yesterday I worked all day! And I climbed the ladder ten times.',
      '¡Ayer trabajé todo el día! Y subí la escalera diez veces.',
      'Ontem eu trabalhei o dia inteiro! E subi a escada dez vezes.',
      'Gestern habe ich den ganzen Tag gearbeitet! Und ich bin zehnmal die Leiter hochgestiegen.',
      '[昨天|zuó tiān] [我|wǒ] [干|gàn] [了|le] [一|yī] [整天|zhěng tiān] [的|de] [活|huó] ！ [我|wǒ] [还|hái] [爬|pá] [了|le] [十|shí] [次|cì] [梯子|tī zi] 。',
      '[昨日|きのう] は [一日中|いちにちじゅう] [働|はたら]きました ！ はしご も [十回|じゅっかい] [登|のぼ]りました 。'),
    'helper.hello': L('Careful with the stones! Last week one rolled over my foot.',
      '¡Cuidado con las piedras! La semana pasada una me pasó por encima del pie.',
      'Cuidado com as pedras! Na semana passada uma passou por cima do meu pé.',
      'Vorsicht mit den Steinen! Letzte Woche ist mir einer über den Fuß gerollt.',
      '[小心|xiǎo xīn] [石头|shí tou] ！ [上|shàng] [个|gè] [星期|xīng qī] [有|yǒu] [一|yī] [块|kuài] [从|cóng] [我|wǒ] [脚|jiǎo] [上|shàng] [滚|gǔn] [过去|guò qu] [了|le] 。',
      '[石|いし] に [気|き] を つけて ！ [先週|せんしゅう] 、 [一|ひと]つ が [足|あし] の [上|うえ] を [転|ころ]がりました 。'),
    'builder.hello': L('You want to help build the Great Mill? Good, I need hands. But first, two questions.',
      '¿Quieres ayudar a construir el Gran Molino? Bien, me faltan manos. Pero primero, dos preguntas.',
      'Quer ajudar a construir o Grande Moinho? Ótimo, estou precisando de mãos. Mas antes, duas perguntas.',
      'Du willst helfen, die Große Mühle zu bauen? Gut, ich brauche Hände. Aber zuerst zwei Fragen.',
      '[你|nǐ] [想|xiǎng] [帮|bāng] [忙|máng] [盖|gài] [大磨坊|Dà mò fáng] ？ [好|hǎo] ， [我|wǒ] [正|zhèng] [缺|quē] [人手|rén shǒu] 。 [不过|bù guò] [先|xiān] [问|wèn] [你|nǐ] [两|liǎng] [个|gè] [问题|wèn tí] 。',
      '[大風車|だいふうしゃ] を [建|た]てる の を [手伝|てつだ]いたい ？ いい です ね 、 [人手|ひとで] が [足|た]りない ん です 。 でも 、 まず [二|ふた]つ [聞|き]かせて ください 。'),
    'builder.q1': L('Did you work yesterday?', '¿Trabajaste ayer?', 'Você trabalhou ontem?', 'Hast du gestern gearbeitet?',
      '[你|nǐ] [昨天|zuó tiān] [干活|gàn huó] [了|le] [吗|ma] ？', '[昨日|きのう] 、 [働|はたら]きました か ？'),
    'builder.q2': L('And to come here, did you climb the hill?', 'Y para venir, ¿subiste la colina?', 'E pra chegar aqui, você subiu o morro?', 'Und bist du den Hügel hochgestiegen, um herzukommen?',
      '[那|nà] [你|nǐ] [是|shì] [爬|pá] [了|le] [山坡|shān pō] [过来|guò lai] [的|de] [吗|ma] ？', 'ここ へ [来|く]る ため に 、 [丘|おか] を [登|のぼ]りました か ？'),
    'builder.ok': L('Good. In you go: push the stones, raise the sails. And on every floor, write in the log what you did. Here, a job that isn’t told doesn’t hold.',
      'Bien. Adentro: empujen las piedras, levanten las aspas. Y en cada piso, escribe en el cuaderno lo que hiciste. Aquí, un trabajo que no se cuenta no se sostiene.',
      'Ótimo. Pra dentro: empurrem as pedras, levantem as pás. E em cada andar, escreve no caderno o que você fez. Aqui, trabalho que não se conta não se sustenta.',
      'Gut. Rein mit euch: Schiebt die Steine, hebt die Flügel. Und auf jedem Stockwerk schreibst du ins Bautagebuch, was du gemacht hast. Hier hält eine Arbeit nur, wenn man sie erzählt.',
      '[好|hǎo] 。 [进去|jìn qu] [吧|ba] ： [推|tuī] [石头|shí tou] ， [升|shēng] [风帆|fēng fān] 。 [每|měi] [一|yī] [层|céng] ， [都|dōu] [在|zài] [本子|běn zi] [上|shàng] [写|xiě] [下|xià] [你|nǐ] [做|zuò] [了|le] [什么|shén me] 。 [在|zài] [这里|zhè lǐ] ， [不|bù] [说|shuō] [出来|chū lai] [的|de] [活|huó] [是|shì] [立|lì] [不|bù] [住|zhù] [的|de] 。',
      'よし 。 [中|なか] へ どうぞ 。 [石|いし] を [押|お]して 、 [羽根|はね] を [上|あ]げて ください 。 そして [各階|かくかい] で 、 やった こと を [日誌|にっし] に [書|か]いて ください 。 ここ で は 、 [話|はな]さない [仕事|しごと] は もちません から 。'),
    'builder.again': L('The door’s open. Push, raise, and write it all down!',
      'La puerta está abierta. ¡Empujen, levanten y escríbanlo todo!',
      'A porta está aberta. Empurrem, levantem e escrevam tudo!',
      'Die Tür ist offen. Schieben, heben und alles aufschreiben!',
      '[门|mén] [开|kāi] [着|zhe] [呢|ne] 。 [推|tuī] 、 [升|shēng] ， [都|dōu] [写|xiě] [下来|xià lai] ！',
      'ドア は [開|あ]いて います 。 [押|お]して 、 [上|あ]げて 、 ぜんぶ [書|か]いて ください ！'),
    'builder.done': L('The Great Mill is finished! Look at those sails turn. The whole valley will eat our bread.',
      '¡El Gran Molino está terminado! Mira cómo giran las aspas. Todo el valle comerá nuestro pan.',
      'O Grande Moinho está pronto! Olha as pás girando. O vale inteiro vai comer o nosso pão.',
      'Die Große Mühle ist fertig! Schau, wie sich die Flügel drehen. Das ganze Tal wird unser Brot essen.',
      '[大磨坊|Dà mò fáng] [盖|gài] [好|hǎo] [了|le] ！ [你|nǐ] [看|kàn] [风帆|fēng fān] [转|zhuàn] [起来|qǐ lai] [了|le] 。 [整个|zhěng gè] [山谷|shān gǔ] [都|dōu] [会|huì] [吃|chī] [我们|wǒ men] [的|de] [面包|miàn bāo] 。',
      '[大風車|だいふうしゃ] が できあがりました ！ [羽根|はね] が [回|まわ]って います ね 。 [谷|たに] の みんな が 、 わたし たち の パン を [食|た]べる ん です よ 。'),
    // Marga's grandmother, with the first cart, at the market (twice the size, these days)
    'fina.hello': L('Look at my cart! I made it myself last month. The first cart in Molinar with real wheels!',
      '¡Mira mi carreta! La hice yo misma el mes pasado. ¡La primera carreta de Molinar con ruedas de verdad!',
      'Olha a minha carroça! Eu mesma fiz no mês passado. A primeira carroça de Molinar com rodas de verdade!',
      'Schau dir meinen Karren an! Den habe ich letzten Monat selbst gebaut. Der erste Karren in Molinar mit richtigen Rädern!',
      '[看|kàn] [我|wǒ] [的|de] [小车|xiǎo chē] ！ [上|shàng] [个|gè] [月|yuè] [我|wǒ] [自己|zì jǐ] [做|zuò] [的|de] 。 [磨坊镇|Mò fáng zhèn] [第一|dì yī] [辆|liàng] [有|yǒu] [真|zhēn] [轮子|lún zi] [的|de] [车|chē] ！',
      'わたし の [荷車|にぐるま] 、 [見|み]て ！ [先月|せんげつ] 、 [自分|じぶん] で [作|つく]りました 。 モリナール で [初|はじ]めて の 、 ちゃんと した [車輪|しゃりん] の [荷車|にぐるま] です よ ！'),
    'fina.market': L('The market has twice as many stalls as last year. Everyone wants flour from the new mill!',
      'El mercado tiene el doble de puestos que el año pasado. ¡Todos quieren harina del molino nuevo!',
      'O mercado tem o dobro de barracas do ano passado. Todo mundo quer farinha do moinho novo!',
      'Der Markt hat doppelt so viele Stände wie letztes Jahr. Alle wollen Mehl von der neuen Mühle!',
      '[市场|shì chǎng] [的|de] [摊子|tān zi] [比|bǐ] [去年|qù nián] [多|duō] [了|le] [一倍|yī bèi] 。 [大家|dà jiā] [都|dōu] [想|xiǎng] [要|yào] [新|xīn] [磨坊|mò fáng] [的|de] [面粉|miàn fěn] ！',
      '[市場|いちば] の お[店|みせ] は 、 [去年|きょねん] の [倍|ばい] です 。 みんな 、 [新|あたら]しい [風車|ふうしゃ] の [粉|こな] が ほしい ん です ！'),
    'fina.stone': L('A round stone, the size of a wheel! If my cart ever breaks, I’ll know where to look. I’ll tell my children… and theirs.',
      '¡Una piedra redonda, del tamaño de una rueda! Si mi carreta se rompe algún día, ya sé dónde buscar. Se lo diré a mis hijos… y a los hijos de mis hijos.',
      'Uma pedra redonda, do tamanho de uma roda! Se a minha carroça quebrar um dia, já sei onde procurar. Vou contar pros meus filhos… e pros filhos deles.',
      'Ein runder Stein, so groß wie ein Rad! Wenn mein Karren mal kaputtgeht, weiß ich, wo ich suchen muss. Das sage ich meinen Kindern … und deren Kindern.',
      '[一|yī] [块|kuài] [圆|yuán] [石头|shí tou] ， [跟|gēn] [轮子|lún zi] [一样|yī yàng] [大|dà] ！ [要是|yào shi] [我|wǒ] [的|de] [车|chē] [哪天|nǎ tiān] [坏|huài] [了|le] ， [我|wǒ] [就|jiù] [知道|zhī dào] [去|qù] [哪里|nǎ lǐ] [找|zhǎo] 。 [我|wǒ] [会|huì] [告诉|gào su] [我|wǒ] [的|de] [孩子|hái zi] … [还有|hái yǒu] [孩子|hái zi] [的|de] [孩子|hái zi] 。',
      '[車輪|しゃりん] みたい な 、 [丸|まる]い [石|いし] ！ いつか [荷車|にぐるま] が [壊|こわ]れたら 、 どこ を [探|さが]せば いい か わかります ね 。 [子|こ]ども たち に も 、 [孫|まご] たち に も [伝|つた]えます よ 。'),
    'stone.ask': L('Help me? Push it over there, by the plinth, out of the way. It’ll be useful one day.',
      '¿Me ayudas? Empújala allá, junto a la base del molino, que no estorbe. Algún día servirá para algo.',
      'Me ajuda? Empurra ela pra lá, do lado da base do moinho, pra não atrapalhar. Um dia vai servir pra alguma coisa.',
      'Hilfst du mir? Schieb ihn da rüber, an den Sockel der Mühle, damit er nicht im Weg ist. Eines Tages wird er nützlich sein.',
      '[帮|bāng] [我|wǒ] [个|gè] [忙|máng] [好|hǎo] [吗|ma] ？ [把|bǎ] [它|tā] [推到|tuī dào] [那边|nà biān] [磨坊|mò fáng] [底座|dǐ zuò] [旁边|páng biān] ， [别|bié] [挡|dǎng] [路|lù] 。 [总有一天|zǒng yǒu yī tiān] [会|huì] [有用|yǒu yòng] [的|de] 。',
      '[手伝|てつだ]って くれます か ？ あそこ 、 [風車|ふうしゃ] の [土台|どだい] の そば へ [押|お]して ください 。 じゃま に ならない よう に 。 いつか [役|やく] に [立|た]つ でしょう 。'),
    'kid.thanks': L('Three! You found all three! Here, keep one. The blue one: my lucky marble.',
      '¡Tres! ¡Encontraste las tres! Toma, quédate una. La azul: mi canica de la suerte.',
      'Três! Você encontrou as três! Toma, fica com uma. A azul: a minha bolinha da sorte.',
      'Drei! Du hast alle drei gefunden! Hier, behalt eine. Die blaue: meine Glücksmurmel.',
      '[三|sān] [颗|kē] ！ [你|nǐ] [全|quán] [找到|zhǎo dào] [了|le] ！ [给|gěi] [你|nǐ] [一|yī] [颗|kē] 。 [蓝色|lán sè] [的|de] [那|nà] [颗|kē] ， [是|shì] [我|wǒ] [的|de] [幸运|xìng yùn] [弹珠|dàn zhū] 。',
      '[三|みっ]つ ！ ぜんぶ [見|み]つけて くれた ！ はい 、 [一|ひと]つ あげる 。 [青|あお]い の 。 ぼく の ラッキー ビー[玉|だま] だ よ 。'),
    // the clockmaker who taught Ciro, and young Ciro
    'ciro.lost': L('Oh no, master! A little wheel jumped out of the clock… it’s up on the fruit stall’s awning!',
      '¡Ay, no, maestro! Una ruedita saltó del reloj… ¡está arriba, en el toldo del puesto de fruta!',
      'Ai, não, mestre! Uma rodinha pulou do relógio… está lá em cima, no toldo da barraca de frutas!',
      'Oh nein, Meister! Ein Rädchen ist aus der Uhr gesprungen … es liegt oben auf der Markise vom Obststand!',
      '[糟糕|zāo gāo] ， [师傅|shī fu] ！ [一个|yī gè] [小|xiǎo] [齿轮|chǐ lún] [从|cóng] [钟|zhōng] [里|lǐ] [跳|tiào] [出来|chū lai] [了|le] … [掉|diào] [在|zài] [水果|shuǐ guǒ] [摊|tān] [的|de] [遮阳棚|zhē yáng péng] [上|shàng] [了|le] ！',
      'たいへん です 、 [先生|せんせい] ！ [小|ちい]さな [歯車|はぐるま] が [時計|とけい] から [飛|と]び[出|だ]して … くだもの [屋|や] さん の [日除|ひよ]け の [上|うえ] に ！'),
    'master.hello': L('A good clockmaker listens before he speaks. Then he speaks clearly. Remember that, boy.',
      'Un buen relojero escucha antes de hablar. Y luego habla claro. Recuérdalo, muchacho.',
      'Um bom relojoeiro escuta antes de falar. E depois fala claro. Lembra disso, rapaz.',
      'Ein guter Uhrmacher hört zu, bevor er spricht. Und dann spricht er deutlich. Merk dir das, Junge.',
      '[好|hǎo] [的|de] [钟表匠|zhōng biǎo jiàng] [先|xiān] [听|tīng] ， [再|zài] [说|shuō] 。 [说|shuō] [的|de] [时候|shí hou] [要|yào] [说|shuō] [清楚|qīng chu] 。 [记住|jì zhù] ， [小子|xiǎo zi] 。',
      'いい [時計屋|とけいや] は 、 [話|はな]す [前|まえ] に [聞|き]く 。 そして 、 はっきり [話|はな]す 。 [覚|おぼ]えて おけ よ 。'),
    'ciro.hello': L('I’m Ciro, the apprentice! One day I’ll know every clock in the valley.',
      '¡Soy Ciro, el aprendiz! Un día conoceré todos los relojes del valle.',
      'Eu sou o Ciro, o aprendiz! Um dia vou conhecer todos os relógios do vale.',
      'Ich bin Ciro, der Lehrling! Eines Tages kenne ich jede Uhr im Tal.',
      '[我|wǒ] [是|shì] [西罗|Xī luó] ， [学徒|xué tú] ！ [总有一天|zǒng yǒu yī tiān] [我|wǒ] [会|huì] [认识|rèn shi] [山谷|shān gǔ] [里|lǐ] [所有|suǒ yǒu] [的|de] [钟|zhōng] 。',
      'ぼく 、 シロ ！ [見習|みなら]い です ！ いつか [谷|たに] の [時計|とけい] を ぜんぶ [知|し]る ん です 。'),
    'master.oil': L('And remember this too: oil the gears every week. A machine that nobody looks after goes quiet.',
      'Y recuerda esto también: aceita los engranajes cada semana. Una máquina que nadie cuida se queda callada.',
      'E lembra disto também: passa óleo nas engrenagens toda semana. Uma máquina que ninguém cuida fica calada.',
      'Und merk dir auch das: Öl die Zahnräder jede Woche. Eine Maschine, um die sich keiner kümmert, wird still.',
      '[还|hái] [要|yào] [记住|jì zhù] ： [每|měi] [个|gè] [星期|xīng qī] [都|dōu] [给|gěi] [齿轮|chǐ lún] [上|shàng] [油|yóu] 。 [没有|méi yǒu] [人|rén] [照顾|zhào gù] [的|de] [机器|jī qì] [会|huì] [变|biàn] [安静|ān jìng] 。',
      'それ と 、 これ も [覚|おぼ]えて おけ 。 [歯車|はぐるま] に は [毎週|まいしゅう] [油|あぶら] を さす こと 。 だれ も [世話|せわ] を しない [機械|きかい] は 、 [黙|だま]って しまう ん だ 。'),
    // ---------------------------------------------------------- the town of then, in turn (each person's rotating lines once the
    // main path has passed them; {w.ml_*}: Molinar's own words, met as they're said, mixed in by the weave)
    'wife.k1': L('Come by our {w.ml_kitchen} any time. There’s always soup in the {w.ml_cauldron}.',
      'Pasa por nuestra cocina cuando quieras. Siempre hay sopa en el caldero.',
      'Passa na nossa cozinha quando quiser. Sempre tem sopa no caldeirão.',
      'Komm jederzeit in unsere Küche. Im Kessel ist immer Suppe.',
      '[随时|suí shí] [来|lái] [我们|wǒ men] [的|de] [厨房|chú fáng] [吧|ba] 。 [大锅|dà guō] [里|lǐ] [总是|zǒng shì] [有|yǒu] [汤|tāng] 。',
      'いつ でも うち の [台所|だいどころ] に [来|き]て ください ね 。 [大鍋|おおなべ] に は いつも スープ が あります よ 。'),
    'wife.k2': L('My soup {w.ml_recipe}? One {w.ml_onion}, {w.ml_potatoes}, a pinch of {w.ml_salt}… and patience.',
      '¿La receta de mi sopa? Una cebolla, papas, una pizca de sal… y paciencia.',
      'A receita da minha sopa? Uma cebola, batatas, uma pitada de sal… e paciência.',
      'Das Rezept für meine Suppe? Eine Zwiebel, Kartoffeln, eine Prise Salz … und Geduld.',
      '[我|wǒ] [的|de] [汤|tāng] [的|de] [菜谱|cài pǔ] ？ [一个|yī gè] [洋葱|yáng cōng] ， [几个|jǐ gè] [土豆|tǔ dòu] ， [一点|yī diǎn] [盐|yán] … [还有|hái yǒu] [耐心|nài xīn] 。',
      'スープ の レシピ ？ たまねぎ [一|ひと]つ 、 じゃがいも 、 [塩|しお] を ひとつまみ … あと は 、 [気長|きなが] に [待|ま]つ こと です 。'),
    'wife.k3': L('Last {w.ml_autumn} that quiet boy ate three bowls. {w.ml_hunger} is a heavy thing to carry alone.',
      'El otoño pasado, ese niño callado se comió tres platos. El hambre es algo muy pesado para cargarlo solo.',
      'No outono passado, aquele menino calado comeu três pratos. A fome é uma coisa pesada pra carregar sozinho.',
      'Letzten Herbst hat dieser stille Junge drei Teller gegessen. Hunger ist schwer, wenn man ihn allein trägt.',
      '[去年|qù nián] [秋天|qiū tiān] ， [那个|nà ge] [不|bù] [说话|shuō huà] [的|de] [男孩|nán hái] [吃|chī] [了|le] [三|sān] [碗|wǎn] 。 [饥饿|jī è] [这种|zhè zhǒng] [事|shì] ， [一个人|yī gè rén] [扛|káng] [太|tài] [难|nán] [了|le] 。',
      '[去年|きょねん] の [秋|あき] 、 あの [無口|むくち] な [子|こ] は スープ を [三杯|さんばい] [食|た]べました 。 [空腹|くうふく] を [一人|ひとり] で がまん する の は 、 つらい こと です 。'),
    'wife.k4': L('Take some {w.ml_milk}, it’s still warm. The {w.ml_jug} is on the table.',
      'Toma un poco de leche, todavía está tibia. La jarra está en la mesa.',
      'Toma um pouco de leite, ainda está morno. A jarra está na mesa.',
      'Nimm etwas Milch, sie ist noch warm. Der Krug steht auf dem Tisch.',
      '[喝|hē] [点|diǎn] [牛奶|niú nǎi] [吧|ba] ， [还|hái] [是|shì] [温|wēn] [的|de] 。 [壶|hú] [在|zài] [桌子|zhuō zi] [上|shàng] 。',
      '[牛乳|ぎゅうにゅう] を どうぞ 。 まだ [温|あたた]かい です よ 。 [水差|みずさ]し は テーブル の [上|うえ] です 。'),
    'miller.m1': L('Our {w.ml_flour} goes to every town in the valley. {w.ml_wheat} in at the top, flour out at the bottom.',
      'Nuestra harina va a todos los pueblos del valle. El trigo entra por arriba, y la harina sale por abajo.',
      'A nossa farinha vai pra todas as cidades do vale. O trigo entra por cima, e a farinha sai por baixo.',
      'Unser Mehl geht in jedes Dorf im Tal. Oben kommt der Weizen rein, unten kommt das Mehl raus.',
      '[我们|wǒ men] [的|de] [面粉|miàn fěn] [送到|sòng dào] [山谷|shān gǔ] [里|lǐ] [每|měi] [个|gè] [村子|cūn zi] 。 [麦子|mài zi] [从|cóng] [上面|shàng miàn] [进去|jìn qu] ， [面粉|miàn fěn] [从|cóng] [下面|xià miàn] [出来|chū lai] 。',
      'うち の [小麦粉|こむぎこ] は 、 [谷|たに] の どの [町|まち] に も [届|とど]きます 。 [上|うえ] から [麦|むぎ] を [入|い]れて 、 [下|した] から [粉|こな] が [出|で]て くる ん です 。'),
    'miller.m2': L('When the {w.ml_sails} turn, the {w.ml_millstone} hums. And the bread tastes {w.ml_delicious}.',
      'Cuando giran las aspas, la piedra de molino zumba. Y el pan sabe rico.',
      'Quando as pás giram, a mó zumbe. E o pão fica gostoso.',
      'Wenn sich die Flügel drehen, summt der Mühlstein. Und das Brot schmeckt lecker.',
      '[风帆|fēng fān] [一|yī] [转|zhuàn] ， [磨盘|mò pán] [就|jiù] [嗡嗡|wēng wēng] [响|xiǎng] 。 [面包|miàn bāo] [也|yě] [特别|tè bié] [好吃|hǎo chī] 。',
      '[羽根|はね] が [回|まわ]る と 、 [石臼|いしうす] が うなります 。 そして パン が おいしく なる ん です 。'),
    'miller.m3': L('Look at my {w.ml_apron}: white with flour, every single evening.',
      'Mira mi delantal: blanco de harina, todas las tardes.',
      'Olha o meu avental: branco de farinha, toda tarde.',
      'Schau dir meine Schürze an: jeden Abend weiß vor Mehl.',
      '[你|nǐ] [看|kàn] [我|wǒ] [的|de] [围裙|wéi qún] ： [每天|měi tiān] [晚上|wǎn shang] [都|dōu] [沾满|zhān mǎn] [了|le] [白|bái] [面粉|miàn fěn] 。',
      'わたし の エプロン を [見|み]て ください 。 [毎晩|まいばん] 、 [粉|こな] で [真|ま]っ[白|しろ] です 。'),
    'kid.k1': L('Mom makes bread {w.ml_dough} every morning. I steal a little when she isn’t looking!',
      'Mamá hace masa de pan cada mañana. ¡Yo me robo un poquito cuando no mira!',
      'A mamãe faz massa de pão toda manhã. Eu pego um pouquinho quando ela não está olhando!',
      'Mama macht jeden Morgen Brotteig. Ich nasche ein bisschen, wenn sie nicht hinschaut!',
      '[妈妈|mā ma] [每天|měi tiān] [早上|zǎo shang] [做|zuò] [面团|miàn tuán] 。 [她|tā] [不|bù] [看|kàn] [的|de] [时候|shí hou] ， [我|wǒ] [偷|tōu] [吃|chī] [一点|yī diǎn] ！',
      'お[母|かあ]さん は [毎朝|まいあさ] 、 パン の [生地|きじ] を [作|つく]る ん だ 。 [見|み]て ない とき に 、 ちょっと つまむ ん だ ！'),
    'kid.k2': L('I want a {w.ml_horseshoe} over our door, for luck. {fina} says they work!',
      'Quiero una herradura en nuestra puerta, para la suerte. ¡Fina dice que funcionan!',
      'Eu quero uma ferradura na nossa porta, pra dar sorte. A Dona Zuza diz que funciona!',
      'Ich will ein Hufeisen über unserer Tür, für Glück. Frieda sagt, das hilft!',
      '[我|wǒ] [想|xiǎng] [在|zài] [门|mén] [上|shàng] [挂|guà] [一个|yī gè] [马蹄铁|mǎ tí tiě] ， [带来|dài lái] [好运|hǎo yùn] 。 [桂花|Guì huā] [姐|jiě] [说|shuō] [真|zhēn] [的|de] [有用|yǒu yòng] ！',
      'うち の ドア に [蹄鉄|ていてつ] を つけたい な 。 [幸運|こううん] の お[守|まも]り ！ ハナ さん は [効|き]く って [言|い]って た よ ！'),
    'kid.k3': L('The builders let me push the {w.ml_wheelbarrow}! Only a little way. It’s heavy.',
      '¡Los constructores me dejaron empujar la carretilla! Solo un poquito. Pesa mucho.',
      'Os construtores me deixaram empurrar o carrinho de mão! Só um pouquinho. É pesado.',
      'Die Bauleute haben mich die Schubkarre schieben lassen! Nur ein kleines Stück. Sie ist schwer.',
      '[工人|gōng rén] [们|men] [让|ràng] [我|wǒ] [推|tuī] [手推车|shǒu tuī chē] [了|le] ！ [就|jiù] [推|tuī] [了|le] [一小段|yī xiǎo duàn] 。 [好|hǎo] [重|zhòng] [啊|a] 。',
      '[大工|だいく] さん たち が 、 [一輪車|いちりんしゃ] を [押|お]させて くれた ん だ ！ ちょっと だけ ね 。 [重|おも]かった ！'),
    'builder.b1': L('Every stone {w.ml_block} goes up on the {w.ml_pulley}. Slowly, slowly… one bump and it’s rubble.',
      'Cada bloque de piedra sube con la polea. Despacio, despacio… un golpe y se hace pedazos.',
      'Cada bloco de pedra sobe na roldana. Devagar, devagar… uma batida e vira caco.',
      'Jeder Steinblock geht mit dem Flaschenzug hoch. Langsam, langsam … ein Stoß, und er ist kaputt.',
      '[每|měi] [一|yī] [块|kuài] [石块|shí kuài] [都|dōu] [用|yòng] [滑轮|huá lún] [吊|diào] [上去|shàng qu] 。 [慢|màn] [慢|màn] [来|lái] … [一|yī] [撞|zhuàng] [就|jiù] [碎|suì] [了|le] 。',
      '[石材|せきざい] は ぜんぶ 、 [滑車|かっしゃ] で [上|あ]げます 。 ゆっくり 、 ゆっくり … ぶつけたら 、 こなごな です 。'),
    'builder.b2': L('My {w.ml_plans} say it’ll be the tallest mill in the valley. Every {w.ml_builder} here believes it.',
      'Mis planos dicen que será el molino más alto del valle. Cada constructor de aquí se lo cree.',
      'As minhas plantas dizem que vai ser o moinho mais alto do vale. Cada construtor daqui acredita nisso.',
      'Meine Baupläne sagen, es wird die höchste Mühle im Tal. Jeder Bauarbeiter hier glaubt daran.',
      '[我|wǒ] [的|de] [图纸|tú zhǐ] [说|shuō] ， [这|zhè] [会|huì] [是|shì] [山谷|shān gǔ] [里|lǐ] [最|zuì] [高|gāo] [的|de] [磨坊|mò fáng] 。 [这里|zhè lǐ] [每|měi] [个|gè] [工人|gōng rén] [都|dōu] [相信|xiāng xìn] 。',
      '[図面|ずめん] に よる と 、 [谷|たに] で いちばん [高|たか]い [風車|ふうしゃ] に なります 。 ここ の [大工|だいく] は みんな 、 そう [信|しん]じて います 。'),
    'builder.b3': L('The {w.ml_mast} goes in last, right through the cap. Then the sails, then the bell.',
      'El mástil va al final, justo por el techo del molino. Luego las aspas, y luego la campana.',
      'O mastro vai por último, bem no meio do teto do moinho. Depois as pás, e depois o sino.',
      'Der Mast kommt zuletzt, mitten durch die Haube. Dann die Flügel, dann die Glocke.',
      '[桅杆|wéi gān] [最后|zuì hòu] [装|zhuāng] ， [从|cóng] [屋顶|wū dǐng] [穿|chuān] [过去|guò qu] 。 [然后|rán hòu] [装|zhuāng] [风帆|fēng fān] ， [再|zài] [挂|guà] [钟|zhōng] 。',
      '[柱|はしら] は [最後|さいご] に 、 [屋根|やね] の [真|ま]ん[中|なか] に [立|た]てます 。 それ から [羽根|はね] 、 それ から [鐘|かね] です 。'),
    'helper.h1': L('I mix the {w.ml_mortar} and spread it with a {w.ml_trowel}. My arms are made of stone now!',
      'Yo mezclo la argamasa y la extiendo con la cuchara de albañil. ¡Ya tengo brazos de piedra!',
      'Eu misturo a argamassa e espalho com a colher de pedreiro. Agora eu tenho braços de pedra!',
      'Ich rühre den Mörtel an und streiche ihn mit der Maurerkelle glatt. Meine Arme sind jetzt aus Stein!',
      '[我|wǒ] [和|huò] [灰浆|huī jiāng] ， [再|zài] [用|yòng] [泥刀|ní dāo] [抹|mǒ] [平|píng] 。 [我|wǒ] [的|de] [胳膊|gē bo] [都|dōu] [变成|biàn chéng] [石头|shí tou] [了|le] ！',
      'モルタル を まぜて 、 こて で のばす ん です 。 もう 、 [腕|うで] が [石|いし] みたい です よ ！'),
    'helper.h2': L('The {w.ml_scaffold} sways in the wind. Don’t look down! …I always look down.',
      'El andamio se mece con el viento. ¡No mires abajo! …Yo siempre miro abajo.',
      'O andaime balança com o vento. Não olha pra baixo! …Eu sempre olho pra baixo.',
      'Das Gerüst schwankt im Wind. Nicht nach unten schauen! … Ich schaue immer nach unten.',
      '[脚手架|jiǎo shǒu jià] [被|bèi] [风|fēng] [吹|chuī] [得|de] [摇摇晃晃|yáo yáo huàng huàng] 。 [别|bié] [往|wǎng] [下|xià] [看|kàn] ！ … [我|wǒ] [总是|zǒng shì] [往|wǎng] [下|xià] [看|kàn] 。',
      '[足場|あしば] は [風|かぜ] で ゆれます 。 [下|した] を [見|み]ない で ！ … ぼく は いつも [見|み]ちゃう けど 。'),
    'helper.h3': L('{w.ml_sawdust} in my hair, mortar on my boots… a good day’s work.',
      'Aserrín en el pelo, argamasa en las botas… un buen día de trabajo.',
      'Serragem no cabelo, argamassa nas botas… um bom dia de trabalho.',
      'Sägemehl in den Haaren, Mörtel an den Stiefeln … ein guter Arbeitstag.',
      '[头发|tóu fa] [里|lǐ] [是|shì] [锯末|jù mò] ， [靴子|xuē zi] [上|shàng] [是|shì] [灰浆|huī jiāng] … [今天|jīn tiān] [干|gàn] [得|de] [不错|bù cuò] 。',
      '[髪|かみ] に おがくず 、 [靴|くつ] に モルタル … いい [一日|いちにち] でした 。'),
    'fina.f1': L('Red wheels, a strong {w.ml_axle}… and all of it {w.ml_new}! Nobody in Molinar had a {w.ml_cart} before.',
      'Ruedas rojas, un eje fuerte… ¡y todo nuevo! Nadie en Molinar tenía una carreta antes.',
      'Rodas vermelhas, um eixo forte… e tudo novo! Ninguém em Molinar tinha uma carroça antes.',
      'Rote Räder, eine starke Achse … und alles neu! Vorher hatte niemand in Molinar einen Karren.',
      '[红|hóng] [轮子|lún zi] ， [结实|jiē shi] [的|de] [车轴|chē zhóu] … [全|quán] [是|shì] [新|xīn] [的|de] ！ [以前|yǐ qián] [磨坊镇|Mò fáng zhèn] [没有|méi yǒu] [人|rén] [有|yǒu] [小车|xiǎo chē] 。',
      '[赤|あか]い [車輪|しゃりん] に 、 [丈夫|じょうぶ] な [車軸|しゃじく] … ぜんぶ [新|あたら]しい ！ [前|まえ] は 、 モリナール に [荷車|にぐるま] を [持|も]って いる [人|ひと] は いません でした 。'),
    'fina.f2': L('Fresh {w.ml_eggs} today, from my own hens! And at a good {w.ml_price}, for every {w.ml_customer}.',
      '¡Hoy hay huevos frescos, de mis propias gallinas! Y a buen precio, para cada cliente.',
      'Hoje tem ovos frescos, das minhas próprias galinhas! E com um bom preço, pra cada freguês.',
      'Heute frische Eier, von meinen eigenen Hühnern! Und zu einem guten Preis, für jeden Kunden.',
      '[今天|jīn tiān] [有|yǒu] [新鲜|xīn xiān] [的|de] [鸡蛋|jī dàn] ， [是|shì] [我|wǒ] [自己|zì jǐ] [养|yǎng] [的|de] [鸡|jī] [下|xià] [的|de] ！ [价钱|jià qian] [也|yě] [公道|gōng dao] ， [每|měi] [个|gè] [顾客|gù kè] [都|dōu] [一样|yī yàng] 。',
      '[今日|きょう] は [新鮮|しんせん] な [卵|たまご] が あります よ 。 うち の にわとり の です ！ [値段|ねだん] も お[手頃|てごろ] 。 どの お[客|きゃく]さん に も ね 。'),
    'fina.f3': L('The {w.ml_market} has {w.ml_bunting} from lamp to lamp, and a new {w.ml_stall} every week!',
      '¡El mercado tiene banderines de farol a farol, y un puesto nuevo cada semana!',
      'O mercado tem bandeirinhas de poste a poste, e uma barraca nova toda semana!',
      'Der Markt hat eine Wimpelkette von Laterne zu Laterne, und jede Woche einen neuen Stand!',
      '[市场|shì chǎng] [上|shàng] [从|cóng] [这|zhè] [盏|zhǎn] [灯|dēng] [到|dào] [那|nà] [盏|zhǎn] [灯|dēng] [都|dōu] [挂|guà] [着|zhe] [彩旗|cǎi qí] ， [每|měi] [个|gè] [星期|xīng qī] [都|dōu] [有|yǒu] [新|xīn] [摊子|tān zi] ！',
      '[市場|いちば] は [街灯|がいとう] から [街灯|がいとう] まで [小旗|こばた] で いっぱい 。 [毎週|まいしゅう] 、 [新|あたら]しい [屋台|やたい] が できる ん です よ ！'),
    'fina.f4': L('Bread is {w.ml_cheap} here, honey is {w.ml_expensive}. And the {w.ml_scales} never lie.',
      'Aquí el pan es barato, la miel es cara. Y la balanza nunca miente.',
      'Aqui o pão é barato, o mel é caro. E a balança nunca mente.',
      'Hier ist Brot billig, Honig ist teuer. Und die Waage lügt nie.',
      '[这里|zhè lǐ] [面包|miàn bāo] [便宜|pián yi] ， [蜂蜜|fēng mì] [贵|guì] 。 [秤|chèng] [从来|cóng lái] [不|bù] [骗人|piàn rén] 。',
      'ここ で は パン は [安|やす]くて 、 はちみつ は [高|たか]い 。 はかり は うそ を つきません よ 。'),
    'master.m1': L('A good {w.ml_clockmaker} needs sharp eyes, a {w.ml_magnifier}, and a great deal of patience.',
      'Un buen relojero necesita buena vista, una lupa y muchísima paciencia.',
      'Um bom relojoeiro precisa de olhos atentos, uma lupa e muita paciência.',
      'Ein guter Uhrmacher braucht scharfe Augen, eine Lupe und sehr viel Geduld.',
      '[好|hǎo] [的|de] [钟表匠|zhōng biǎo jiàng] [要|yào] [眼睛|yǎn jing] [好|hǎo] ， [要|yào] [有|yǒu] [放大镜|fàng dà jìng] ， [还要|hái yào] [很|hěn] [多|duō] [耐心|nài xīn] 。',
      'いい [時計屋|とけいや] に は 、 いい [目|め] と 、 [虫眼鏡|むしめがね] と 、 たくさん の [根気|こんき] が いる 。'),
    'master.m2': L('Listen: {w.ml_ticktock}. A healthy clock. A sick one goes tick… tick… and then nothing.',
      'Escucha: tictac. Un reloj sano. Uno enfermo hace tic… tic… y luego nada.',
      'Escuta: tique-taque. Um relógio saudável. Um doente faz tique… tique… e depois nada.',
      'Hör mal: Ticktack. Eine gesunde Uhr. Eine kranke macht tick … tick … und dann nichts.',
      '[你|nǐ] [听|tīng] ： [滴答|dī dā] 。 [这|zhè] [是|shì] [健康|jiàn kāng] [的|de] [钟|zhōng] 。 [生病|shēng bìng] [的|de] [钟|zhōng] [是|shì] [滴|dī] … [滴|dī] … [然后|rán hòu] [就|jiù] [没|méi] [声|shēng] [了|le] 。',
      '[聞|き]け 。 チクタク 。 [元気|げんき] な [時計|とけい] だ 。 [病気|びょうき] の [時計|とけい] は 、 チク … チク … それ から [何|なに] も [聞|き]こえない 。'),
    'master.m3': L('Every {w.ml_minute} counts, boy. Wind the {w.ml_spring}, then check the {w.ml_hands}.',
      'Cada minuto cuenta, muchacho. Dale cuerda al resorte y luego revisa las manecillas.',
      'Cada minuto conta, rapaz. Dá corda na mola e depois confere os ponteiros.',
      'Jede Minute zählt, Junge. Zieh die Feder auf und prüf dann die Zeiger.',
      '[每|měi] [一|yī] [分钟|fēn zhōng] [都|dōu] [重要|zhòng yào] ， [小子|xiǎo zi] 。 [先|xiān] [上|shàng] [发条|fā tiáo] ， [再|zài] [检查|jiǎn chá] [指针|zhǐ zhēn] 。',
      '[一分|いっぷん] [一分|いっぷん] が [大事|だいじ] だ ぞ 。 ぜんまい を [巻|ま]いて 、 [針|はり] を たしかめろ 。'),
    'master.m4': L('On cloudy days my {w.ml_sundial} is useless. On sunny days, my clocks are jealous of it.',
      'Los días nublados, mi reloj de sol no sirve. Los días de sol, mis relojes le tienen envidia.',
      'Nos dias nublados, o meu relógio de sol não serve pra nada. Nos dias de sol, os meus relógios ficam com inveja dele.',
      'An bewölkten Tagen ist meine Sonnenuhr nutzlos. An sonnigen Tagen sind meine Uhren neidisch auf sie.',
      '[阴天|yīn tiān] [的|de] [时候|shí hou] ， [我|wǒ] [的|de] [日晷|rì guǐ] [没|méi] [用|yòng] 。 [晴天|qíng tiān] [的|de] [时候|shí hou] ， [我|wǒ] [的|de] [钟|zhōng] [都|dōu] [嫉妒|jí dù] [它|tā] 。',
      'くもり の [日|ひ] は 、 [日時計|ひどけい] は [役|やく] に [立|た]たん 。 [晴|は]れ の [日|ひ] は 、 [時計|とけい] たち が やきもち を やく 。'),
    'ciro.c1': L('I’m the master’s {w.ml_apprentice}! I sort every {w.ml_screw}: big ones here, tiny ones there.',
      '¡Soy el aprendiz del maestro! Ordeno todos los tornillos: los grandes aquí, los chiquitos allá.',
      'Eu sou o aprendiz do mestre! Eu separo todos os parafusos: os grandes aqui, os pequenininhos ali.',
      'Ich bin der Lehrling vom Meister! Ich sortiere jede Schraube: die großen hierhin, die winzigen dorthin.',
      '[我|wǒ] [是|shì] [师傅|shī fu] [的|de] [学徒|xué tú] ！ [我|wǒ] [负责|fù zé] [分|fēn] [螺丝|luó sī] ： [大|dà] [的|de] [放|fàng] [这里|zhè lǐ] ， [小|xiǎo] [的|de] [放|fàng] [那里|nà lǐ] 。',
      'ぼく 、 [先生|せんせい] の [見習|みなら]い ！ ねじ を [分|わ]ける ん だ 。 [大|おお]きい の は ここ 、 [小|ちい]さい の は あっち 。'),
    'ciro.c2': L('Master says the {w.ml_pendulum} is a clock’s heart. Put your ear close: you can hear it beat.',
      'El maestro dice que el péndulo es el corazón del reloj. Acerca la oreja: se oye latir.',
      'O mestre diz que o pêndulo é o coração do relógio. Chega a orelha perto: dá pra ouvir bater.',
      'Der Meister sagt, das Pendel ist das Herz der Uhr. Halt dein Ohr dran: Man hört es schlagen.',
      '[师傅|shī fu] [说|shuō] [钟摆|zhōng bǎi] [是|shì] [钟|zhōng] [的|de] [心脏|xīn zàng] 。 [把|bǎ] [耳朵|ěr duo] [靠|kào] [过来|guò lai] ： [能|néng] [听到|tīng dào] [它|tā] [在|zài] [跳|tiào] 。',
      '[先生|せんせい] は 、 [振|ふ]り[子|こ] は [時計|とけい] の [心臓|しんぞう] だ って 。 [耳|みみ] を [近|ちか]づけて みて 。 どきどき [聞|き]こえる よ 。'),
    'ciro.c3': L('I use the {w.ml_tweezers} for the tiniest wheels. One sneeze and they’re gone forever!',
      'Uso las pinzas para las rueditas más chiquitas. ¡Un estornudo y se pierden para siempre!',
      'Eu uso a pinça pras rodinhas mais pequenininhas. Um espirro e elas somem pra sempre!',
      'Für die winzigsten Rädchen nehme ich die Pinzette. Einmal niesen, und sie sind für immer weg!',
      '[最|zuì] [小|xiǎo] [的|de] [齿轮|chǐ lún] [我|wǒ] [用|yòng] [镊子|niè zi] [夹|jiā] 。 [打|dǎ] [个|gè] [喷嚏|pēn tì] ， [它们|tā men] [就|jiù] [永远|yǒng yuǎn] [不见|bù jiàn] [了|le] ！',
      'いちばん [小|ちい]さい [歯車|はぐるま] は 、 ピンセット で つまむ ん だ 。 くしゃみ [一回|いっかい] で 、 もう [見|み]つからない よ ！'),
    'ciro.c4': L('One day I’ll have my own {w.ml_workbench}, and a {w.ml_cuckoo} that sings the hours.',
      'Un día tendré mi propio banco de trabajo, y un reloj de cuco que cante las horas.',
      'Um dia eu vou ter a minha própria bancada, e um relógio cuco que canta as horas.',
      'Eines Tages habe ich meine eigene Werkbank und eine Kuckucksuhr, die die Stunden singt.',
      '[总有一天|zǒng yǒu yī tiān] [我|wǒ] [会|huì] [有|yǒu] [自己|zì jǐ] [的|de] [工作台|gōng zuò tái] ， [还有|hái yǒu] [一个|yī gè] [会|huì] [报|bào] [时|shí] [的|de] [布谷鸟钟|bù gǔ niǎo zhōng] 。',
      'いつか 、 [自分|じぶん] の [作業台|さぎょうだい] を [持|も]つ ん だ 。 [時間|じかん] を [歌|うた]う [鳩時計|はとどけい] も ！'),
    'ciro.c5': L('A drop of {w.ml_oil} on every gear, every week. Master checks with his nose!',
      'Una gota de aceite en cada engranaje, cada semana. ¡El maestro lo revisa con la nariz!',
      'Uma gota de óleo em cada engrenagem, toda semana. O mestre confere com o nariz!',
      'Ein Tropfen Öl auf jedes Zahnrad, jede Woche. Der Meister prüft es mit der Nase!',
      '[每|měi] [个|gè] [星期|xīng qī] ， [每|měi] [个|gè] [齿轮|chǐ lún] [上|shàng] [一|yī] [滴|dī] [油|yóu] 。 [师傅|shī fu] [用|yòng] [鼻子|bí zi] [检查|jiǎn chá] ！',
      '[毎週|まいしゅう] 、 どの [歯車|はぐるま] に も [油|あぶら] を [一滴|いってき] 。 [先生|せんせい] は [鼻|はな] で たしかめる ん だ よ ！'),
  };
  // ------------------------------------------------------------ the demonstrations (whole in the language, the shown words glossed)
  const DEMO = {
    'wife.demo': L('Last night I made soup. Yesterday I baked bread. And you? Did you eat yesterday?',
      'Anoche preparé sopa. Ayer horneé pan. ¿Y tú? ¿Comiste ayer?',
      'Ontem à noite eu preparei sopa. Ontem eu assei pão. E você? Você comeu ontem?',
      'Gestern Abend habe ich Suppe gekocht. Gestern habe ich Brot gebacken. Und du? Hast du gestern gegessen?',
      '[昨天|zuó tiān] [晚上|wǎn shang] [我|wǒ] [做|zuò] [了|le] [汤|tāng] 。 [昨天|zuó tiān] [我|wǒ] [烤|kǎo] [了|le] [面包|miàn bāo] 。 [你|nǐ] [呢|ne] ？ [你|nǐ] [昨天|zuó tiān] [吃|chī] [饭|fàn] [了|le] [吗|ma] ？',
      'ゆうべ 、 スープ を [作|つく]りました 。 [昨日|きのう] は パン を [焼|や]きました 。 あなた は ？ [昨日|きのう] 、 ちゃんと [食|た]べました か ？'),
    'helper.demo': LINES['helper.demo'],
    'room1': L('The stones go on those circles. Yesterday I turned the crank, but nothing happened!',
      'Las piedras van en esos círculos. Ayer giré la manivela, ¡pero no pasó nada!',
      'As pedras vão naqueles círculos. Ontem eu girei a manivela, mas não aconteceu nada!',
      'Die Steine gehören auf die Kreise da. Gestern habe ich die Kurbel gedreht, aber nichts ist passiert!',
      '[石头|shí tou] [要|yào] [放|fàng] [在|zài] [那些|nà xiē] [圆圈|yuán quān] [上|shàng] 。 [昨天|zuó tiān] [我|wǒ] [转|zhuàn] [了|le] [绞盘|jiǎo pán] ， [可是|kě shì] [什么|shén me] [也|yě] [没|méi] [发生|fā shēng] ！',
      '[石|いし] は あの [丸|まる] の [上|うえ] に [置|お]きます 。 [昨日|きのう] 、 ハンドル を [回|まわ]しました 。 でも 、 [何|なに] も [起|お]きません でした ！'),
    'room2': L('Yesterday I pulled this lever and the gears went… crack! The big wheel is missing.',
      'Ayer bajé esta palanca y los engranajes… ¡crac! Falta la rueda grande.',
      'Ontem eu baixei esta alavanca e as engrenagens… crac! Falta a roda grande.',
      'Gestern habe ich diesen Hebel gezogen, und die Zahnräder … krach! Das große Rad fehlt.',
      '[昨天|zuó tiān] [我|wǒ] [拉|lā] [了|le] [这个|zhè ge] [拉杆|lā gān] ， [齿轮|chǐ lún] … [咔|kā] ！ [少|shǎo] [了|le] [大|dà] [轮子|lún zi] 。',
      '[昨日|きのう] 、 この レバー を [引|ひ]きました 。 [歯車|はぐるま] が … ガタン ！ [大|おお]きい [車輪|しゃりん] が [足|た]りません 。'),
    'room3': L('Last year I raised the sails of a little mill. These ones are huge!',
      'El año pasado levanté las aspas de un molino pequeño. ¡Estas son enormes!',
      'No ano passado eu levantei as pás de um moinho pequeno. Estas são enormes!',
      'Letztes Jahr habe ich die Flügel einer kleinen Mühle gehoben. Die hier sind riesig!',
      '[去年|qù nián] [我|wǒ] [升|shēng] [了|le] [一|yī] [座|zuò] [小|xiǎo] [风车|fēng chē] [的|de] [风帆|fēng fān] 。 [这些|zhè xiē] [太|tài] [大|dà] [了|le] ！',
      '[去年|きょねん] 、 [小|ちい]さな [風車|ふうしゃ] の [羽根|はね] を [上|あ]げました 。 これ は [大|おお]きい です ね ！'),
    'room4': L('Last year I drew this mill on a piece of paper. And today it’s finished!',
      'El año pasado dibujé este molino en un papel. ¡Y hoy está terminado!',
      'No ano passado eu desenhei este moinho num papel. E hoje ele está pronto!',
      'Letztes Jahr habe ich diese Mühle auf Papier gezeichnet. Und heute ist sie fertig!',
      '[去年|qù nián] [我|wǒ] [在|zài] [纸|zhǐ] [上|shàng] [画|huà] [了|le] [这|zhè] [座|zuò] [磨坊|mò fáng] 。 [今天|jīn tiān] [它|tā] [盖|gài] [好|hǎo] [了|le] ！',
      '[去年|きょねん] 、 この [風車|ふうしゃ] を [紙|かみ] に [描|か]きました 。 [今日|きょう] 、 できあがりました ！'),
    'stone.demo': L('I cut this little millstone myself, last week. Too small for the mill… but too good to throw away.',
      'Yo corté esta piedra pequeña la semana pasada. Demasiado pequeña para el molino… pero demasiado buena para tirarla.',
      'Eu cortei esta pedra pequena na semana passada. Pequena demais pro moinho… mas boa demais pra jogar fora.',
      'Ich habe diesen kleinen Mühlstein letzte Woche selbst gehauen. Zu klein für die Mühle … aber zu schade zum Wegwerfen.',
      '[上|shàng] [个|gè] [星期|xīng qī] [我|wǒ] [自己|zì jǐ] [凿|záo] [了|le] [这|zhè] [块|kuài] [小|xiǎo] [磨盘|mò pán] 。 [给|gěi] [磨坊|mò fáng] [用|yòng] [太|tài] [小|xiǎo] … [扔|rēng] [了|le] [又|yòu] [可惜|kě xī] 。',
      '[先週|せんしゅう] 、 この [小|ちい]さな [石臼|いしうす] を [自分|じぶん] で [彫|ほ]りました 。 [風車|ふうしゃ] に は [小|ちい]さすぎる けど 、 [捨|す]てる の は もったいない 。'),
    'wheel.demo': L('Did you oil the gears, Ciro? — Yes, master! I oiled them this morning.',
      '¿Aceitaste los engranajes, Ciro? — ¡Sí, maestro! Los aceité esta mañana.',
      'Você passou óleo nas engrenagens, Ciro? — Passei, mestre! Passei óleo hoje de manhã.',
      'Hast du die Zahnräder geölt, Ciro? — Ja, Meister! Ich habe sie heute Morgen geölt.',
      '[西罗|Xī luó] ， [你|nǐ] [给|gěi] [齿轮|chǐ lún] [上|shàng] [油|yóu] [了|le] [吗|ma] ？ — [上|shàng] [了|le] ， [师傅|shī fu] ！ [今天|jīn tiān] [早上|zǎo shang] [上|shàng] [的|de] 。',
      'シロ 、 [歯車|はぐるま] に [油|あぶら] を さした か ？ — はい 、 [先生|せんせい] ！ [今朝|けさ] 、 さしました 。'),
    'marbles.demo': L('I lost three marbles in the market! Yesterday I found one. Did you find the others?',
      '¡Perdí tres canicas en el mercado! Ayer encontré una. ¿Encontraste las otras?',
      'Eu perdi três bolinhas de gude no mercado! Ontem eu encontrei uma. Você encontrou as outras?',
      'Ich habe drei Murmeln auf dem Markt verloren! Gestern habe ich eine gefunden. Hast du die anderen gefunden?',
      '[我|wǒ] [在|zài] [市场|shì chǎng] [丢|diū] [了|le] [三|sān] [颗|kē] [弹珠|dàn zhū] ！ [昨天|zuó tiān] [我|wǒ] [找到|zhǎo dào] [了|le] [一|yī] [颗|kē] 。 [你|nǐ] [找到|zhǎo dào] [别的|bié de] [了|le] [吗|ma] ？',
      '[市場|いちば] で ビー[玉|だま] を [三|みっ]つ なくした ！ [昨日|きのう] 、 [一|ひと]つ [見|み]つけた 。 ほか の 、 [見|み]つけた ？'),
    // the town of then shows its own words in use (once each, in each person's turn: I did, did you?)
    'wife.demo2': L('Today I kneaded the dough and I peeled the potatoes. And you? Did you wash your hands?',
      'Hoy amasé la masa y pelé las papas. ¿Y tú? ¿Te lavaste las manos?',
      'Hoje eu sovei a massa e descasquei as batatas. E você? Lavou as mãos?',
      'Heute habe ich den Teig geknetet und die Kartoffeln geschält. Und du? Hast du dir die Hände gewaschen?',
      '[今天|jīn tiān] [我|wǒ] [揉|róu] [了|le] [面团|miàn tuán] ， [还|hái] [削|xiāo] [了|le] [土豆|tǔ dòu] [皮|pí] 。 [你|nǐ] [呢|ne] ？ [你|nǐ] [洗|xǐ] [手|shǒu] [了|le] [吗|ma] ？',
      '[今日|きょう] は [生地|きじ] を こねて 、 じゃがいも を むきました 。 あなた は ？ [手|て] を [洗|あら]いました か ？'),
    'miller.demo': L('Yesterday I sold forty sacks of flour. And you? Did you help {fina} with her cart?',
      'Ayer vendí cuarenta sacos de harina. ¿Y tú? ¿Ayudaste a Fina con su carreta?',
      'Ontem eu vendi quarenta sacos de farinha. E você? Ajudou a Dona Zuza com a carroça?',
      'Gestern habe ich vierzig Säcke Mehl verkauft. Und du? Hast du Frieda mit ihrem Karren geholfen?',
      '[昨天|zuó tiān] [我|wǒ] [卖|mài] [了|le] [四十|sì shí] [袋|dài] [面粉|miàn fěn] 。 [你|nǐ] [呢|ne] ？ [你|nǐ] [帮|bāng] [桂花|Guì huā] [姐|jiě] [推|tuī] [车|chē] [了|le] [吗|ma] ？',
      '[昨日|きのう] 、 [小麦粉|こむぎこ] を [四十|よんじゅう] [袋|ふくろ] [売|う]りました 。 あなた は ？ ハナ さん の [荷車|にぐるま] を [手伝|てつだ]いました か ？'),
    'builder.demo': L('Last week I measured the tower and drew the plans again. Did you see them? They’re on the table.',
      'La semana pasada medí la torre y dibujé los planos otra vez. ¿Los viste? Están en la mesa.',
      'Na semana passada eu medi a torre e desenhei as plantas de novo. Você viu? Estão na mesa.',
      'Letzte Woche habe ich den Turm gemessen und die Baupläne noch mal gezeichnet. Hast du sie gesehen? Sie liegen auf dem Tisch.',
      '[上|shàng] [个|gè] [星期|xīng qī] [我|wǒ] [量|liáng] [了|le] [塔|tǎ] ， [又|yòu] [画|huà] [了|le] [一|yī] [遍|biàn] [图纸|tú zhǐ] 。 [你|nǐ] [看|kàn] [了|le] [吗|ma] ？ [在|zài] [桌子|zhuō zi] [上|shàng] 。',
      '[先週|せんしゅう] 、 [塔|とう] を [測|はか]って 、 [図面|ずめん] を また [描|か]きました 。 [見|み]ました か ？ [机|つくえ] の [上|うえ] に あります よ 。'),
    'helper.demo2': L('The day before yesterday I loaded a hundred bricks into the wheelbarrow. And you? Did you load anything?',
      'Anteayer cargué cien ladrillos en la carretilla. ¿Y tú? ¿Cargaste algo?',
      'Anteontem eu carreguei cem tijolos no carrinho de mão. E você? Carregou alguma coisa?',
      'Vorgestern habe ich hundert Ziegel in die Schubkarre geladen. Und du? Hast du auch etwas geladen?',
      '[前天|qián tiān] [我|wǒ] [往|wǎng] [手推车|shǒu tuī chē] [里|lǐ] [装|zhuāng] [了|le] [一百|yī bǎi] [块|kuài] [砖|zhuān] 。 [你|nǐ] [呢|ne] ？ [你|nǐ] [装|zhuāng] [了|le] [什么|shén me] [吗|ma] ？',
      'おととい 、 [一輪車|いちりんしゃ] に れんが を [百個|ひゃっこ] [積|つ]みました 。 あなた は ？ [何|なに]か [積|つ]みました か ？'),
    'fina.demo': L('Last month I built my cart, and I painted the wheels red. And you? Did you buy anything at the market?',
      'El mes pasado construí mi carreta y pinté las ruedas de rojo. ¿Y tú? ¿Compraste algo en el mercado?',
      'No mês passado eu construí a minha carroça e pintei as rodas de vermelho. E você? Comprou alguma coisa no mercado?',
      'Letzten Monat habe ich meinen Karren gebaut und die Räder rot gestrichen. Und du? Hast du auf dem Markt etwas gekauft?',
      '[上|shàng] [个|gè] [月|yuè] [我|wǒ] [造|zào] [了|le] [我|wǒ] [的|de] [小车|xiǎo chē] ， [还|hái] [把|bǎ] [轮子|lún zi] [涂|tú] [成|chéng] [了|le] [红色|hóng sè] 。 [你|nǐ] [呢|ne] ？ [你|nǐ] [在|zài] [市场|shì chǎng] [买|mǎi] [东西|dōng xi] [了|le] [吗|ma] ？',
      '[先月|せんげつ] 、 [荷車|にぐるま] を [作|つく]って 、 [車輪|しゃりん] を [赤|あか]く [塗|ぬ]りました 。 あなた は ？ [市場|いちば] で [何|なに]か [買|か]いました か ？'),
    'master.demo': L('This morning I fixed a cuckoo clock. Did you clean the workbench, Ciro? — Yes, master! I cleaned it twice!',
      'Esta mañana arreglé un reloj de cuco. ¿Limpiaste el banco de trabajo, Ciro? — ¡Sí, maestro! ¡Lo limpié dos veces!',
      'Hoje de manhã eu consertei um relógio cuco. Você limpou a bancada, Ciro? — Limpei, mestre! Limpei duas vezes!',
      'Heute Morgen habe ich eine Kuckucksuhr repariert. Hast du die Werkbank geputzt, Ciro? — Ja, Meister! Ich habe sie zweimal geputzt!',
      '[今天|jīn tiān] [早上|zǎo shang] [我|wǒ] [修|xiū] [了|le] [一个|yī gè] [布谷鸟钟|bù gǔ niǎo zhōng] 。 [西罗|Xī luó] ， [你|nǐ] [打扫|dǎ sǎo] [工作台|gōng zuò tái] [了|le] [吗|ma] ？ — [打扫|dǎ sǎo] [了|le] ， [师傅|shī fu] ！ [打扫|dǎ sǎo] [了|le] [两|liǎng] [遍|biàn] ！',
      '[今朝|けさ] 、 [鳩時計|はとどけい] を [直|なお]した 。 シロ 、 [作業台|さぎょうだい] を [掃除|そうじ] した か ？ — はい 、 [先生|せんせい] ！ [二回|にかい] [掃除|そうじ] しました ！'),
  };
  // the words each demonstration shows (glossed small where they stand); per language
  const MARKS = {
    'wife.demo': { es: [['Anoche', 'last night'], ['preparé', 'I made'], ['Ayer', 'yesterday'], ['horneé', 'I baked'], ['Comiste', 'did you eat']],
      pt: [['Ontem à noite', 'last night'], ['preparei', 'I made'], ['assei', 'I baked'], ['comeu', 'did (you) eat']],
      de: [['Gestern Abend', 'last night'], ['gekocht', 'cooked'], ['gebacken', 'baked'], ['Hast du', 'have you'], ['gegessen', 'eaten']],
      zh: [['[昨天|zuó tiān] [晚上|wǎn shang]', 'last night'], ['[做|zuò] [了|le]', 'made'], ['[烤|kǎo] [了|le]', 'baked'], ['[吃|chī] [饭|fàn] [了|le] [吗|ma]', 'did (you) eat?']],
      ja: [['ゆうべ', 'last night'], ['[作|つく]りました', 'made'], ['[焼|や]きました', 'baked'], ['[食|た]べました か', 'did (you) eat?']] },
    'helper.demo': { es: [['Ayer', 'yesterday'], ['trabajé', 'I worked'], ['subí', 'I climbed']], pt: [['Ontem', 'yesterday'], ['trabalhei', 'I worked'], ['subi', 'I climbed']],
      de: [['Gestern', 'yesterday'], ['gearbeitet', 'worked'], ['bin', 'have (moving)'], ['hochgestiegen', 'climbed up']],
      zh: [['[昨天|zuó tiān]', 'yesterday'], ['[干|gàn] [了|le]', 'did (work)'], ['[爬|pá] [了|le]', 'climbed']], ja: [['[昨日|きのう]', 'yesterday'], ['[働|はたら]きました', 'worked'], ['[登|のぼ]りました', 'climbed']] },
    'builder.q1': { es: [['Trabajaste', 'did you work']], pt: [['trabalhou', 'did (you) work']], de: [['Hast du', 'have you'], ['gearbeitet', 'worked']], zh: [['[干活|gàn huó] [了|le] [吗|ma]', 'did (you) work?']], ja: [['[働|はたら]きました か', 'did (you) work?']] },
    'builder.q2': { es: [['subiste', 'did you climb'], ['colina', 'hill']], pt: [['subiu', 'did (you) climb'], ['morro', 'hill']], de: [['bist du', 'have you (moving)'], ['hochgestiegen', 'climbed up'], ['Hügel', 'hill']],
      zh: [['[爬|pá] [了|le]', 'climbed'], ['[山坡|shān pō]', 'hill']], ja: [['[登|のぼ]りました か', 'did (you) climb?'], ['[丘|おか]', 'hill']] },
    'room1': { es: [['Ayer', 'yesterday'], ['giré', 'I turned'], ['manivela', 'crank']], pt: [['Ontem', 'yesterday'], ['girei', 'I turned'], ['manivela', 'crank']], de: [['Gestern', 'yesterday'], ['gedreht', 'turned'], ['Kurbel', 'crank']],
      zh: [['[转|zhuàn] [了|le]', 'turned'], ['[绞盘|jiǎo pán]', 'winch']], ja: [['ハンドル', 'crank'], ['[回|まわ]しました', 'turned']] },
    'room2': { es: [['bajé', 'I pulled down'], ['palanca', 'lever'], ['rueda', 'wheel']], pt: [['baixei', 'I pulled down'], ['alavanca', 'lever'], ['roda', 'wheel']], de: [['gezogen', 'pulled'], ['Hebel', 'lever'], ['Rad', 'wheel']],
      zh: [['[拉|lā] [了|le]', 'pulled'], ['[拉杆|lā gān]', 'lever'], ['[轮子|lún zi]', 'wheel']], ja: [['レバー', 'lever'], ['[引|ひ]きました', 'pulled'], ['[車輪|しゃりん]', 'wheel']] },
    'room3': { es: [['El año pasado', 'last year'], ['levanté', 'I raised'], ['aspas', 'sails (of a mill)']], pt: [['No ano passado', 'last year'], ['levantei', 'I raised'], ['pás', 'sails (of a mill)']],
      de: [['Letztes Jahr', 'last year'], ['gehoben', 'raised'], ['Flügel', 'sails (of a mill)']], zh: [['[去年|qù nián]', 'last year'], ['[升|shēng] [了|le]', 'raised'], ['[风帆|fēng fān]', 'sails']], ja: [['[去年|きょねん]', 'last year'], ['[羽根|はね]', 'sails'], ['[上|あ]げました', 'raised']] },
    'room4': { es: [['dibujé', 'I drew'], ['terminado', 'finished']], pt: [['desenhei', 'I drew'], ['pronto', 'finished']], de: [['gezeichnet', 'drawn'], ['fertig', 'finished']],
      zh: [['[画|huà] [了|le]', 'drew'], ['[盖|gài] [好|hǎo] [了|le]', 'is built']], ja: [['[描|か]きました', 'drew'], ['できあがりました', 'is finished']] },
    'stone.demo': { es: [['corté', 'I cut'], ['la semana pasada', 'last week'], ['tirarla', 'throw it away']], pt: [['cortei', 'I cut'], ['na semana passada', 'last week'], ['jogar fora', 'throw away']],
      de: [['gehauen', 'carved'], ['letzte Woche', 'last week'], ['Mühlstein', 'millstone']], zh: [['[凿|záo] [了|le]', 'carved'], ['[磨盘|mò pán]', 'millstone'], ['[上|shàng] [个|gè] [星期|xīng qī]', 'last week']],
      ja: [['[先週|せんしゅう]', 'last week'], ['[石臼|いしうす]', 'millstone'], ['[彫|ほ]りました', 'carved']] },
    'wheel.demo': { es: [['Aceitaste', 'did you oil'], ['aceité', 'I oiled'], ['engranajes', 'gears']], pt: [['passou óleo', 'did (you) oil'], ['Passei', 'I did'], ['engrenagens', 'gears']],
      de: [['geölt', 'oiled'], ['Zahnräder', 'gears']], zh: [['[上|shàng] [油|yóu]', 'oil'], ['[齿轮|chǐ lún]', 'gears']], ja: [['[歯車|はぐるま]', 'gears'], ['[油|あぶら]', 'oil'], ['さしました', '(I) put (oil) on']] },
    'marbles.demo': { es: [['Perdí', 'I lost'], ['canicas', 'marbles'], ['encontré', 'I found'], ['Encontraste', 'did you find']], pt: [['perdi', 'I lost'], ['bolinhas de gude', 'marbles'], ['encontrei', 'I found'], ['encontrou', 'did (you) find']],
      de: [['verloren', 'lost'], ['Murmeln', 'marbles'], ['gefunden', 'found']], zh: [['[丢|diū] [了|le]', 'lost'], ['[弹珠|dàn zhū]', 'marbles'], ['[找到|zhǎo dào] [了|le]', 'found']], ja: [['ビー[玉|だま]', 'marbles'], ['なくした', 'lost'], ['[見|み]つけた', 'found']] },
    'wife.demo2': { es: [['amasé', 'I kneaded'], ['masa', 'dough'], ['pelé', 'I peeled'], ['papas', 'potatoes'], ['Te lavaste', 'did you wash']],
      pt: [['sovei', 'I kneaded'], ['massa', 'dough'], ['descasquei', 'I peeled'], ['batatas', 'potatoes'], ['Lavou', 'did (you) wash']],
      de: [['Teig', 'dough'], ['geknetet', 'kneaded'], ['Kartoffeln', 'potatoes'], ['geschält', 'peeled'], ['gewaschen', 'washed']],
      zh: [['[揉|róu] [了|le]', 'kneaded'], ['[面团|miàn tuán]', 'dough'], ['[削|xiāo] [了|le]', 'peeled'], ['[土豆|tǔ dòu]', 'potatoes'], ['[洗|xǐ]', 'wash']],
      ja: [['[生地|きじ]', 'dough'], ['こねて', 'kneaded (and)'], ['じゃがいも', 'potatoes'], ['むきました', 'peeled'], ['[洗|あら]いました か', 'did (you) wash?']] },
    'miller.demo': { es: [['vendí', 'I sold'], ['harina', 'flour'], ['Ayudaste', 'did you help']], pt: [['vendi', 'I sold'], ['farinha', 'flour'], ['Ajudou', 'did (you) help']],
      de: [['verkauft', 'sold'], ['Mehl', 'flour'], ['geholfen', 'helped']], zh: [['[卖|mài] [了|le]', 'sold'], ['[面粉|miàn fěn]', 'flour'], ['[帮|bāng]', 'help']],
      ja: [['[小麦粉|こむぎこ]', 'flour'], ['[売|う]りました', 'sold'], ['[手伝|てつだ]いました か', 'did (you) help?']] },
    'builder.demo': { es: [['medí', 'I measured'], ['dibujé', 'I drew'], ['planos', 'plans'], ['Los viste', 'did you see them']], pt: [['medi', 'I measured'], ['desenhei', 'I drew'], ['plantas', 'plans'], ['Você viu', 'did you see']],
      de: [['gemessen', 'measured'], ['Baupläne', 'plans'], ['gezeichnet', 'drawn'], ['gesehen', 'seen']], zh: [['[量|liáng] [了|le]', 'measured'], ['[画|huà] [了|le]', 'drew'], ['[图纸|tú zhǐ]', 'plans']],
      ja: [['[測|はか]って', 'measured (and)'], ['[図面|ずめん]', 'plans'], ['[描|か]きました', 'drew']] },
    'helper.demo2': { es: [['Anteayer', 'the day before yesterday'], ['cargué', 'I loaded'], ['ladrillos', 'bricks'], ['carretilla', 'wheelbarrow'], ['Cargaste', 'did you load']],
      pt: [['Anteontem', 'the day before yesterday'], ['carreguei', 'I loaded'], ['tijolos', 'bricks'], ['carrinho de mão', 'wheelbarrow'], ['Carregou', 'did (you) load']],
      de: [['Vorgestern', 'the day before yesterday'], ['Ziegel', 'bricks'], ['Schubkarre', 'wheelbarrow'], ['geladen', 'loaded']],
      zh: [['[前天|qián tiān]', 'the day before yesterday'], ['[手推车|shǒu tuī chē]', 'wheelbarrow'], ['[装|zhuāng] [了|le]', 'loaded'], ['[砖|zhuān]', 'bricks']],
      ja: [['おととい', 'the day before yesterday'], ['[一輪車|いちりんしゃ]', 'wheelbarrow'], ['れんが', 'bricks'], ['[積|つ]みました', 'loaded']] },
    'fina.demo': { es: [['El mes pasado', 'last month'], ['construí', 'I built'], ['pinté', 'I painted'], ['ruedas', 'wheels'], ['Compraste', 'did you buy']],
      pt: [['No mês passado', 'last month'], ['construí', 'I built'], ['pintei', 'I painted'], ['Comprou', 'did (you) buy']],
      de: [['Letzten Monat', 'last month'], ['gebaut', 'built'], ['gestrichen', 'painted'], ['gekauft', 'bought']],
      zh: [['[上|shàng] [个|gè] [月|yuè]', 'last month'], ['[造|zào] [了|le]', 'built'], ['[涂|tú]', 'paint'], ['[买|mǎi]', 'buy']],
      ja: [['[先月|せんげつ]', 'last month'], ['[塗|ぬ]りました', 'painted'], ['[買|か]いました か', 'did (you) buy?']] },
    'master.demo': { es: [['Esta mañana', 'this morning'], ['arreglé', 'I fixed'], ['reloj de cuco', 'cuckoo clock'], ['Limpiaste', 'did you clean'], ['banco de trabajo', 'workbench'], ['limpié', 'I cleaned']],
      pt: [['Hoje de manhã', 'this morning'], ['consertei', 'I fixed'], ['relógio cuco', 'cuckoo clock'], ['limpou', 'did (you) clean'], ['bancada', 'workbench'], ['Limpei', 'I cleaned']],
      de: [['Heute Morgen', 'this morning'], ['Kuckucksuhr', 'cuckoo clock'], ['repariert', 'fixed'], ['Werkbank', 'workbench'], ['geputzt', 'cleaned']],
      zh: [['[今天|jīn tiān] [早上|zǎo shang]', 'this morning'], ['[修|xiū] [了|le]', 'fixed'], ['[布谷鸟钟|bù gǔ niǎo zhōng]', 'cuckoo clock'], ['[打扫|dǎ sǎo]', 'clean'], ['[工作台|gōng zuò tái]', 'workbench']],
      ja: [['[今朝|けさ]', 'this morning'], ['[鳩時計|はとどけい]', 'cuckoo clock'], ['[直|なお]した', 'fixed'], ['[作業台|さぎょうだい]', 'workbench'], ['[掃除|そうじ]', 'cleaning']] },
  };
  // ------------------------------------------------------------ the pattern card: the past, I and you
  const CARDS = {
    me: { tag: 'The past: I and you', es: { ex: [['preparé', 'I made'], ['¿preparaste?', 'did you make?'], ['comí', 'I ate'], ['¿comiste?', 'did you eat?'], ['subí', 'I went up'], ['¿subiste?', 'did you go up?']],
        note: 'To tell what you did: -ar verbs end in -é (preparé), -er and -ir verbs in -í (comí, subí). Asking someone: -aste, -iste. With «ayer» (yesterday), «anoche» (last night), «el año pasado» (last year).' },
      pt: { ex: [['preparei', 'I made'], ['você preparou?', 'did you make?'], ['comi', 'I ate'], ['você comeu?', 'did you eat?'], ['subi', 'I went up'], ['você subiu?', 'did you go up?']],
        note: 'What you did: -ar becomes -ei (preparei), -er and -ir become -i (comi, subi). Asking «você»: -ou, -eu, -iu. With «ontem», «ontem à noite», «no ano passado».' },
      de: { ex: [['ich habe gekocht', 'I cooked'], ['hast du gekocht?', 'did you cook?'], ['ich bin gestiegen', 'I climbed'], ['bist du gestiegen?', 'did you climb?']],
        note: 'What you did, in speech: «ich habe» / «du hast» + the participle at the end. Moving somewhere (gehen, steigen, kommen): «ich bin» / «du bist». With «gestern», «gestern Abend», «letztes Jahr».' },
      zh: { ex: [['[我|wǒ] [做|zuò] [了|le] [汤|tāng]', 'I made soup'], ['[你|nǐ] [吃|chī] [了|le] [吗|ma] ？', 'did you eat?'], ['[我|wǒ] [吃|chī] [了|le]', 'I ate'], ['[昨天|zuó tiān] · [去年|qù nián]', 'yesterday · last year']],
        note: 'Say who (我 I, 你 you), then the verb, then 了: it’s done. Time words go up front: 昨天 (yesterday), 昨天晚上 (last night), 去年 (last year).' },
      ja: { ex: [['[作|つく]りました', 'made (polite)'], ['[食|た]べました か ？', 'did you eat?'], ['[食|た]べた', 'ate (plain)'], ['[昨日|きのう] · ゆうべ · [去年|きょねん]', 'yesterday · last night · last year']],
        note: 'Polite past: ～ました. Asking a grown-up: ～ました か？ (あなた is usually left out). Plain past ～た is for friends and kids.' } },
  };
  // ------------------------------------------------------------ the tasks (time_molinar.js MOLT.grade): what you answer
  // want (S: the right form; an A if an accent is missing or none of `more` is there), alt (still right, a little off: A, its tip),
  // person (the past, but someone else's: B), aux (de: haben / sein: B), pres (now, not then: say it again). zh / ja: the notation.
  // Items: a string must appear as a word (zh / ja: CJK.contains), a list must all appear.
  const T = (o) => o;
  const TIPS = {
    person: { es: 'That’s «he / she». About yourself: «{form}».', pt: 'That’s «ele / ela». About yourself: «{form}».', de: 'That’s «er / sie». About yourself: «ich habe…» / «ich bin…»: «{form}».',
      zh: 'Say it about yourself: 我…了, «{form}».', ja: '«{form}»' },
    pres: { es: 'That’s now. It already happened: «{form}».', pt: 'That’s now. It already happened: «{form}».', de: 'That’s now. It already happened: «{form}».',
      zh: 'It already happened: 了 after the verb, «{form}».', ja: 'That’s now. It already happened: ～ました, «{form}».' },
    aux: { de: 'Moving somewhere takes «sein»: «ich bin … gestiegen». Here: «{form}».' },
    auxH: { de: 'This one takes «haben»: «{form}».' },
    alt: { de: 'Right! In speech Germans would say «{form}».', ja: 'Right! To a grown-up, the polite past sounds better: «{form}».' },
    more: { zh: 'Right! Say who, too: «{form}».', es: 'Right! The whole sentence for an S: «{form}».', pt: 'Right! The whole sentence for an S: «{form}».', de: 'Right! The whole sentence for an S: «{form}».', ja: 'Right! The whole sentence for an S: «{form}».' },
  };
  const TASKS = {
    ate: T({ title: '{wife} asks if you ate yesterday. Tell her, about yourself.',
      frame: { es: 'Sí, ___ ayer.', pt: 'Sim, ___ ontem.', de: 'Ja, ich habe gestern ___.', zh: '[我|wǒ] [昨天|zuó tiān] ___ 。', ja: 'はい 、 ___ 。' },
      chips: { es: [['comí', 'I ate']], pt: [['comi', 'I ate']], de: [['gegessen', 'eaten']], zh: [['[吃|chī] [饭|fàn] [了|le]', 'ate']], ja: [['[食|た]べました', 'ate']] },
      model: L('Yes, I ate yesterday.', 'Sí, comí ayer.', 'Sim, comi ontem.', 'Ja, ich habe gestern gegessen.', '[我|wǒ] [昨天|zuó tiān] [吃|chī] [饭|fàn] [了|le] 。', 'はい 、 [食|た]べました 。'),
      want: { es: ['comí'], pt: ['comi'], de: [['habe', 'gegessen']], zh: [['[吃|chī]', '[了|le]']], ja: ['[食|た]べました'] },
      alt: { de: ['aß'], ja: ['[食|た]べた'] }, person: { es: ['comió'], pt: ['comeu'], de: [['hat', 'gegessen']] },
      pres: { es: ['como', 'come', 'comer'], pt: ['como', 'come', 'comer'], de: ['esse', 'isst', 'essen'], zh: ['[吃|chī]'], ja: ['[食|た]べます', '[食|た]べる'] },
      more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
    worked: T({ title: '{builder} asks: did you work yesterday? Answer about yourself.',
      frame: { es: 'Sí, ___ ayer.', pt: 'Sim, ___ ontem.', de: 'Ja, ich habe gestern ___.', zh: '[我|wǒ] [昨天|zuó tiān] ___ 。', ja: 'はい 、 ___ 。' },
      chips: { es: [['trabajé', 'I worked']], pt: [['trabalhei', 'I worked']], de: [['gearbeitet', 'worked']], zh: [['[干活|gàn huó] [了|le]', 'worked']], ja: [['[働|はたら]きました', 'worked']] },
      model: L('Yes, I worked yesterday.', 'Sí, trabajé ayer.', 'Sim, trabalhei ontem.', 'Ja, ich habe gestern gearbeitet.', '[我|wǒ] [昨天|zuó tiān] [干活|gàn huó] [了|le] 。', 'はい 、 [働|はたら]きました 。'),
      want: { es: ['trabajé'], pt: ['trabalhei'], de: [['habe', 'gearbeitet']], zh: [['[干活|gàn huó]', '[了|le]'], ['[干|gàn]', '[了|le]'], ['[工作|gōng zuò]', '[了|le]']], ja: ['[働|はたら]きました'] },
      alt: { de: ['arbeitete'], ja: ['[働|はたら]いた'] }, person: { es: ['trabajó'], pt: ['trabalhou'], de: [['hat', 'gearbeitet']] },
      pres: { es: ['trabajo', 'trabaja', 'trabajar'], pt: ['trabalho', 'trabalha', 'trabalhar'], de: ['arbeite', 'arbeitet', 'arbeiten'], zh: ['[干活|gàn huó]', '[工作|gōng zuò]'], ja: ['[働|はたら]きます', '[働|はたら]く'] },
      more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
    climbed: T({ title: '{builder} asks: did you climb the hill to come here? Answer about yourself.',
      frame: { es: 'Sí, ___ la colina.', pt: 'Sim, ___ o morro.', de: 'Ja, ich ___ den Hügel ___.', zh: '[我|wǒ] ___ [山坡|shān pō] 。', ja: 'はい 、 ___ 。' },
      chips: { es: [['subí', 'I climbed']], pt: [['subi', 'I climbed']], de: [['bin', '(moving) have'], ['hochgestiegen', 'climbed up']], zh: [['[爬|pá] [了|le]', 'climbed']], ja: [['[登|のぼ]りました', 'climbed']] },
      model: L('Yes, I climbed the hill.', 'Sí, subí la colina.', 'Sim, subi o morro.', 'Ja, ich bin den Hügel hochgestiegen.', '[我|wǒ] [爬|pá] [了|le] [山坡|shān pō] 。', 'はい 、 [登|のぼ]りました 。'),
      want: { es: ['subí'], pt: ['subi'], de: [['bin', 'hochgestiegen'], ['bin', 'gestiegen'], ['bin', 'geklettert'], ['bin', 'hochgeklettert'], ['bin', 'raufgestiegen']], zh: [['[爬|pá]', '[了|le]']], ja: ['[登|のぼ]りました'] },
      alt: { de: ['stieg'], ja: ['[登|のぼ]った'] }, person: { es: ['subió'], pt: ['subiu'], de: [['ist', 'hochgestiegen'], ['ist', 'gestiegen']] },
      aux: { de: [['habe', 'hochgestiegen'], ['habe', 'gestiegen'], ['habe', 'geklettert']] },
      pres: { es: ['subo', 'sube', 'subir'], pt: ['subo', 'sobe', 'subir'], de: ['steige', 'steigt', 'steigen'], zh: ['[爬|pá]'], ja: ['[登|のぼ]ります', '[登|のぼ]る'] },
      more: { es: ['colina'], pt: ['morro'], de: ['ich'], zh: ['[我|wǒ]'] } }),
    crank: T({ title: 'The builders’ log asks: did you turn the crank? Write it, about yourself.',
      frame: { es: 'Sí, ___ la manivela.', pt: 'Sim, ___ a manivela.', de: 'Ja, ich habe die Kurbel ___.', zh: '[我|wǒ] ___ [绞盘|jiǎo pán] 。', ja: 'はい 、 ___ 。' },
      chips: { es: [['giré', 'I turned']], pt: [['girei', 'I turned']], de: [['gedreht', 'turned']], zh: [['[转|zhuàn] [了|le]', 'turned']], ja: [['[回|まわ]しました', 'turned']] },
      model: L('Yes, I turned the crank.', 'Sí, giré la manivela.', 'Sim, girei a manivela.', 'Ja, ich habe die Kurbel gedreht.', '[我|wǒ] [转|zhuàn] [了|le] [绞盘|jiǎo pán] 。', 'はい 、 [回|まわ]しました 。'),
      want: { es: ['giré'], pt: ['girei'], de: [['habe', 'gedreht']], zh: [['[转|zhuàn]', '[了|le]']], ja: ['[回|まわ]しました'] },
      alt: { de: ['drehte'], ja: ['[回|まわ]した'] }, person: { es: ['giró'], pt: ['girou'], de: [['hat', 'gedreht']] },
      pres: { es: ['giro', 'gira', 'girar'], pt: ['giro', 'gira', 'girar'], de: ['drehe', 'dreht', 'drehen'], zh: ['[转|zhuàn]'], ja: ['[回|まわ]します', '[回|まわ]す'] },
      more: { es: ['manivela'], pt: ['manivela'], de: ['kurbel'], zh: ['[我|wǒ]'] } }),
    lever: T({ title: 'The log asks: did you pull the lever? Write it, about yourself.',
      frame: { es: 'Sí, ___ la palanca.', pt: 'Sim, ___ a alavanca.', de: 'Ja, ich habe den Hebel ___.', zh: '[我|wǒ] ___ [拉杆|lā gān] 。', ja: 'はい 、 ___ 。' },
      chips: { es: [['bajé', 'I pulled (down)']], pt: [['baixei', 'I pulled (down)']], de: [['gezogen', 'pulled']], zh: [['[拉|lā] [了|le]', 'pulled']], ja: [['[引|ひ]きました', 'pulled']] },
      model: L('Yes, I pulled the lever.', 'Sí, bajé la palanca.', 'Sim, baixei a alavanca.', 'Ja, ich habe den Hebel gezogen.', '[我|wǒ] [拉|lā] [了|le] [拉杆|lā gān] 。', 'はい 、 [引|ひ]きました 。'),
      want: { es: ['bajé', 'jalé', 'tiré'], pt: ['baixei', 'puxei'], de: [['habe', 'gezogen']], zh: [['[拉|lā]', '[了|le]']], ja: ['[引|ひ]きました'] },
      alt: { de: ['zog'], ja: ['[引|ひ]いた'] }, person: { es: ['bajó', 'jaló'], pt: ['baixou', 'puxou'], de: [['hat', 'gezogen']] },
      pres: { es: ['bajo', 'baja', 'bajar'], pt: ['baixo', 'baixa', 'baixar'], de: ['ziehe', 'zieht', 'ziehen'], zh: ['[拉|lā]'], ja: ['[引|ひ]きます', '[引|ひ]く'] },
      more: { es: ['palanca'], pt: ['alavanca'], de: ['hebel'], zh: ['[我|wǒ]'] } }),
    sails: T({ title: 'The log asks: did you raise the sails? Write it, about yourself.',
      frame: { es: 'Sí, ___ las aspas.', pt: 'Sim, ___ as pás.', de: 'Ja, ich habe die Flügel ___.', zh: '[我|wǒ] ___ [风帆|fēng fān] 。', ja: 'はい 、 ___ 。' },
      chips: { es: [['levanté', 'I raised']], pt: [['levantei', 'I raised']], de: [['gehoben', 'raised']], zh: [['[升|shēng] [了|le]', 'raised']], ja: [['[上|あ]げました', 'raised']] },
      model: L('Yes, I raised the sails.', 'Sí, levanté las aspas.', 'Sim, levantei as pás.', 'Ja, ich habe die Flügel gehoben.', '[我|wǒ] [升|shēng] [了|le] [风帆|fēng fān] 。', 'はい 、 [上|あ]げました 。'),
      want: { es: ['levanté', 'subí'], pt: ['levantei', 'subi'], de: [['habe', 'gehoben'], ['habe', 'hochgezogen']], zh: [['[升|shēng]', '[了|le]']], ja: ['[上|あ]げました'] },
      alt: { de: ['hob'], ja: ['[上|あ]げた'] }, person: { es: ['levantó'], pt: ['levantou'], de: [['hat', 'gehoben']] },
      pres: { es: ['levanto', 'levanta', 'levantar'], pt: ['levanto', 'levanta', 'levantar'], de: ['hebe', 'hebt', 'heben'], zh: ['[升|shēng]'], ja: ['[上|あ]げます', '[上|あ]げる'] },
      more: { es: ['aspas'], pt: ['pas', 'pás'], de: ['flugel', 'flügel'], zh: ['[我|wǒ]'] } }),
    finished: T({ title: '{builder} asks: did you finish the work? Answer about yourself.',
      frame: { es: '¡Sí, ___ el trabajo!', pt: 'Sim, ___ o trabalho!', de: 'Ja, ich habe die Arbeit fertig ___!', zh: '[我|wǒ] ___ ！', ja: 'はい 、 ___ ！' },
      chips: { es: [['terminé', 'I finished']], pt: [['terminei', 'I finished']], de: [['gemacht', 'done']], zh: [['[干|gàn] [完|wán] [了|le]', 'finished (the work)']], ja: [['[終|お]わりました', 'finished']] },
      model: L('Yes, I finished the work!', '¡Sí, terminé el trabajo!', 'Sim, terminei o trabalho!', 'Ja, ich habe die Arbeit fertig gemacht!', '[我|wǒ] [干|gàn] [完|wán] [了|le] ！', 'はい 、 [終|お]わりました ！'),
      want: { es: ['terminé', 'acabé'], pt: ['terminei', 'acabei'], de: [['habe', 'gemacht'], ['habe', 'beendet'], ['habe', 'geschafft']], zh: [['[干|gàn]', '[完|wán]', '[了|le]'], ['[做|zuò]', '[完|wán]', '[了|le]']], ja: ['[終|お]わりました', '[終|お]えました'] },
      alt: { de: ['machte', 'beendete'], ja: ['[終|お]わった', '[終|お]えた'] }, person: { es: ['terminó', 'acabó'], pt: ['terminou', 'acabou'], de: [['hat', 'gemacht'], ['hat', 'beendet']] },
      pres: { es: ['termino', 'termina', 'terminar'], pt: ['termino', 'termina', 'terminar'], de: ['mache', 'macht', 'beende'], zh: ['[干|gàn]', '[做|zuò]'], ja: ['[終|お]わります', '[終|お]わる'] },
      more: { es: ['trabajo', 'molino'], pt: ['trabalho', 'moinho'], de: ['ich'], zh: ['[我|wǒ]'] } }),
    stone: T({ title: '{builder} asks: did you leave the stone by the mill? Answer about yourself.',
      frame: { es: 'Sí, ___ la piedra junto al molino.', pt: 'Sim, ___ a pedra do lado do moinho.', de: 'Ja, ich habe den Stein an die Mühle ___.', zh: '[我|wǒ] ___ 。', ja: 'はい 、 ___ 。' },
      chips: { es: [['dejé', 'I left']], pt: [['deixei', 'I left']], de: [['gelegt', 'put']], zh: [['[放|fàng] [好|hǎo] [了|le]', 'put (it) there']], ja: [['[置|お]きました', 'put']] },
      model: L('Yes, I left the stone by the mill.', 'Sí, dejé la piedra junto al molino.', 'Sim, deixei a pedra do lado do moinho.', 'Ja, ich habe den Stein an die Mühle gelegt.', '[我|wǒ] [放|fàng] [好|hǎo] [了|le] 。', 'はい 、 [置|お]きました 。'),
      want: { es: ['dejé', 'puse'], pt: ['deixei', 'coloquei', 'pus'], de: [['habe', 'gelegt'], ['habe', 'gestellt']], zh: [['[放|fàng]', '[了|le]']], ja: ['[置|お]きました'] },
      alt: { de: ['legte', 'stellte'], ja: ['[置|お]いた'] }, person: { es: ['dejó'], pt: ['deixou'], de: [['hat', 'gelegt']] },
      pres: { es: ['dejo', 'deja', 'dejar'], pt: ['deixo', 'deixa', 'deixar'], de: ['lege', 'legt', 'legen'], zh: ['[放|fàng]'], ja: ['[置|お]きます', '[置|お]く'] },
      more: { es: ['piedra', 'molino'], pt: ['pedra', 'moinho'], de: ['ich'], zh: ['[我|wǒ]'] } }),
    wheel: T({ title: '{master} asks: did you find the little wheel? Answer about yourself.',
      frame: { es: 'Sí, ___ la ruedita.', pt: 'Sim, ___ a rodinha.', de: 'Ja, ich habe das Rädchen ___.', zh: '[我|wǒ] ___ 。', ja: 'はい 、 ___ 。' },
      chips: { es: [['encontré', 'I found']], pt: [['encontrei', 'I found']], de: [['gefunden', 'found']], zh: [['[找到|zhǎo dào] [了|le]', 'found']], ja: [['[見|み]つけました', 'found']] },
      model: L('Yes, I found the little wheel.', 'Sí, encontré la ruedita.', 'Sim, encontrei a rodinha.', 'Ja, ich habe das Rädchen gefunden.', '[我|wǒ] [找到|zhǎo dào] [了|le] 。', 'はい 、 [見|み]つけました 。'),
      want: { es: ['encontré', 'hallé'], pt: ['encontrei', 'achei'], de: [['habe', 'gefunden']], zh: [['[找到|zhǎo dào]', '[了|le]']], ja: ['[見|み]つけました'] },
      alt: { de: ['fand'], ja: ['[見|み]つけた'] }, person: { es: ['encontró'], pt: ['encontrou', 'achou'], de: [['hat', 'gefunden']] },
      pres: { es: ['encuentro', 'encuentra', 'encontrar'], pt: ['encontro', 'encontra', 'encontrar'], de: ['finde', 'findet', 'finden'], zh: ['[找|zhǎo]'], ja: ['[見|み]つけます', '[見|み]つける'] },
      more: { es: ['ruedita', 'rueda'], pt: ['rodinha', 'roda'], de: ['ich'], zh: ['[我|wǒ]'] } }),
    marbles: T({ title: '{kid} asks: how many marbles did you find? Answer about yourself.',
      frame: { es: '___ tres canicas.', pt: '___ três bolinhas.', de: 'Ich habe drei Murmeln ___.', zh: '[我|wǒ] ___ [三|sān] [颗|kē] 。', ja: '[三|みっ]つ ___ 。' },
      chips: { es: [['Encontré', 'I found']], pt: [['Encontrei', 'I found']], de: [['gefunden', 'found']], zh: [['[找到|zhǎo dào] [了|le]', 'found']], ja: [['[見|み]つけた', 'found']] },
      model: L('I found three marbles.', 'Encontré tres canicas.', 'Encontrei três bolinhas.', 'Ich habe drei Murmeln gefunden.', '[我|wǒ] [找到|zhǎo dào] [了|le] [三|sān] [颗|kē] 。', '[三|みっ]つ [見|み]つけた よ 。'),
      want: { es: ['encontré'], pt: ['encontrei', 'achei'], de: [['habe', 'gefunden']], zh: [['[找到|zhǎo dào]', '[了|le]']], ja: ['[見|み]つけた', '[見|み]つけました'] },
      alt: { de: ['fand'] }, person: { es: ['encontró'], pt: ['encontrou'], de: [['hat', 'gefunden']] },
      pres: { es: ['encuentro', 'encuentra', 'encontrar'], pt: ['encontro', 'encontra', 'encontrar'], de: ['finde', 'findet', 'finden'], zh: ['[找|zhǎo]'], ja: ['[見|み]つける', '[見|み]つけます'] },
      more: { es: ['tres', '3'], pt: ['tres', 'três', '3'], de: ['drei', '3'], zh: ['[三|sān]', '3'], ja: ['[三|みっ]つ', '[三|さん]', '3'] } }),
    // the first armadillo's silly questions (the boss's second half)
    pushed: T({ title: 'The little armadillo asks: did you push me? Answer about yourself.',
      frame: { es: '¡Sí, te ___!', pt: 'Sim, eu ___ você!', de: 'Ja, ich habe dich ___!', zh: '[对|duì] ， [我|wǒ] ___ [你|nǐ] ！', ja: 'うん 、 ___ よ ！' },
      chips: { es: [['empujé', 'I pushed']], pt: [['empurrei', 'I pushed']], de: [['geschubst', 'pushed']], zh: [['[推|tuī] [了|le]', 'pushed']], ja: [['[押|お]した', 'pushed']] },
      model: L('Yes, I pushed you!', '¡Sí, te empujé!', 'Sim, eu empurrei você!', 'Ja, ich habe dich geschubst!', '[对|duì] ， [我|wǒ] [推|tuī] [了|le] [你|nǐ] ！', 'うん 、 [押|お]した よ ！'),
      want: { es: ['empujé'], pt: ['empurrei'], de: [['habe', 'geschubst'], ['habe', 'geschoben'], ['habe', 'geschupst']], zh: [['[推|tuī]', '[了|le]']], ja: ['[押|お]した', '[押|お]しました'] },
      alt: { de: ['schubste', 'schob'] }, person: { es: ['empujó'], pt: ['empurrou'], de: [['hat', 'geschubst'], ['hat', 'geschoben']] },
      pres: { es: ['empujo', 'empuja', 'empujar'], pt: ['empurro', 'empurra', 'empurrar'], de: ['schubse', 'schubst', 'schiebe', 'schiebt'], zh: ['[推|tuī]'], ja: ['[押|お]す', '[押|お]します', '[押|お]して'] },
      more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
    cameUp: T({ title: 'It asks: did you climb all the way up here? Answer about yourself.',
      frame: { es: 'Sí, ___ hasta aquí.', pt: 'Sim, ___ até aqui.', de: 'Ja, ich ___ hier ___.', zh: '[我|wǒ] ___ [上来|shàng lai] 。', ja: 'うん 、 ___ 。' },
      chips: { es: [['subí', 'I climbed']], pt: [['subi', 'I climbed']], de: [['bin', '(moving) have'], ['hochgestiegen', 'climbed up']], zh: [['[爬|pá] [了|le]', 'climbed']], ja: [['[登|のぼ]った', 'climbed']] },
      model: L('Yes, I climbed up here.', 'Sí, subí hasta aquí.', 'Sim, subi até aqui.', 'Ja, ich bin hier hochgestiegen.', '[我|wǒ] [爬|pá] [了|le] [上来|shàng lai] 。', 'うん 、 [登|のぼ]った よ 。'),
      want: { es: ['subí'], pt: ['subi'], de: [['bin', 'hochgestiegen'], ['bin', 'gestiegen'], ['bin', 'geklettert'], ['bin', 'hochgeklettert'], ['bin', 'raufgestiegen']], zh: [['[爬|pá]', '[了|le]'], ['[上来|shàng lai]', '[了|le]']], ja: ['[登|のぼ]った', '[登|のぼ]りました', '[来|き]た', '[来|き]ました'] },
      alt: { de: ['stieg'] }, person: { es: ['subió'], pt: ['subiu'], de: [['ist', 'hochgestiegen'], ['ist', 'gestiegen']] },
      aux: { de: [['habe', 'hochgestiegen'], ['habe', 'gestiegen'], ['habe', 'geklettert']] },
      pres: { es: ['subo', 'sube', 'subir'], pt: ['subo', 'sobe', 'subir'], de: ['steige', 'steigt'], zh: ['[爬|pá]'], ja: ['[登|のぼ]る', '[登|のぼ]ります'] },
      more: { de: ['ich'], zh: ['[我|wǒ]'] } }),
  };
  // Mimo, told as a memory (3rd person: past_text.js PTXT.PV has the forms): the box's frame, chips and model per task
  const MEM = {
    stone: { verb: 'v.push', title: 'In the Past, {mimo} only moves in memories. Tell it what it did with the stone.',
      frame: { es: '{mimo} ___ la piedra.', pt: 'O {mimo} ___ a pedra.', de: '{mimo} hat den Stein ___.', zh: '{mimo} ___ [石头|shí tou] 。', ja: '{mimo} が [石|いし] を ___ 。' },
      model: L('{mimo} pushed the stone.', '{mimo} empujó la piedra.', 'O {mimo} empurrou a pedra.', '{mimo} hat den Stein geschoben.', '{mimo} [推|tuī] [了|le] [石头|shí tou] 。', '{mimo} が [石|いし] を [押|お]した 。'),
      more: { es: ['piedra'], pt: ['pedra'], de: ['stein'], zh: ['[石头|shí tou]'], ja: ['[石|いし]'] } },
    wheel: { verb: 'v.push', title: 'Tell {mimo} what it did with the big wheel, as a memory.',
      frame: { es: '{mimo} ___ la rueda.', pt: 'O {mimo} ___ a roda.', de: '{mimo} hat das Rad ___.', zh: '{mimo} ___ [轮子|lún zi] 。', ja: '{mimo} が [車輪|しゃりん] を ___ 。' },
      model: L('{mimo} pushed the wheel.', '{mimo} empujó la rueda.', 'O {mimo} empurrou a roda.', '{mimo} hat das Rad geschoben.', '{mimo} [推|tuī] [了|le] [轮子|lún zi] 。', '{mimo} が [車輪|しゃりん] を [押|お]した 。'),
      more: { es: ['rueda'], pt: ['roda'], de: ['rad'], zh: ['[轮子|lún zi]'], ja: ['[車輪|しゃりん]'] } },
    mast: { verb: 'v.climb', title: 'The sail’s rope is up the mast. Tell {mimo} what it did, as a memory.',
      frame: { es: '{mimo} ___ al mástil.', pt: 'O {mimo} ___ no mastro.', de: '{mimo} ist auf den Mast ___.', zh: '{mimo} ___ [桅杆|wéi gān] 。', ja: '{mimo} が [柱|はしら] に ___ 。' },
      model: L('{mimo} climbed the mast.', '{mimo} trepó al mástil.', 'O {mimo} subiu no mastro.', '{mimo} ist auf den Mast geklettert.', '{mimo} [爬|pá] [了|le] [桅杆|wéi gān] 。', '{mimo} が [柱|はしら] に [登|のぼ]った 。'),
      more: { es: ['mastil', 'mástil'], pt: ['mastro'], de: ['mast'], zh: ['[桅杆|wéi gān]'], ja: ['[柱|はしら]'] } },
    spare: { verb: 'v.push', title: 'Tell {mimo} what it did with the little millstone, as a memory.',
      frame: { es: '{mimo} ___ la piedra pequeña.', pt: 'O {mimo} ___ a pedra pequena.', de: '{mimo} hat den kleinen Stein ___.', zh: '{mimo} ___ [小|xiǎo] [磨盘|mò pán] 。', ja: '{mimo} が [石臼|いしうす] を ___ 。' },
      model: L('{mimo} pushed the little stone.', '{mimo} empujó la piedra pequeña.', 'O {mimo} empurrou a pedra pequena.', '{mimo} hat den kleinen Stein geschoben.', '{mimo} [推|tuī] [了|le] [小|xiǎo] [磨盘|mò pán] 。', '{mimo} が [石臼|いしうす] を [押|お]した 。'),
      more: { es: ['piedra'], pt: ['pedra'], de: ['stein'], zh: ['[磨盘|mò pán]'], ja: ['[石臼|いしうす]'] } },
    awning: { verb: 'v.jump', title: 'The little wheel is up on the awning. Tell {mimo} what it did, as a memory.',
      frame: { es: '{mimo} ___ al toldo.', pt: 'O {mimo} ___ no toldo.', de: '{mimo} ist auf die Markise ___.', zh: '{mimo} ___ [上|shàng] [遮阳棚|zhē yáng péng] 。', ja: '{mimo} が [日除|ひよ]け に ___ 。' },
      model: L('{mimo} jumped onto the awning.', '{mimo} saltó al toldo.', 'O {mimo} pulou no toldo.', '{mimo} ist auf die Markise gesprungen.', '{mimo} [跳|tiào] [上|shàng] [了|le] [遮阳棚|zhē yáng péng] 。', '{mimo} が [日除|ひよ]け に [跳|と]んだ 。'),
      more: { es: ['toldo'], pt: ['toldo'], de: ['markise'], zh: ['[遮阳棚|zhē yáng péng]'], ja: ['[日除|ひよ]け'] } },
  };
  // the present forms of Mimo's verbs (the box: «That's now»), per verb
  const MEM_PRES = {
    'v.push': { es: ['empuja', 'empujar', 'empujo'], pt: ['empurra', 'empurrar'], de: ['schiebt', 'schieb', 'schieben'], zh: ['[推|tuī]'], ja: ['[押|お]して', '[押|お]す', '[押|お]します'] },
    'v.climb': { es: ['trepa', 'trepar', 'sube', 'subir'], pt: ['sobe', 'subir'], de: ['klettert', 'kletter', 'klettern'], zh: ['[爬|pá]'], ja: ['[登|のぼ]って', '[登|のぼ]る', '[登|のぼ]ります'] },
    'v.jump': { es: ['salta', 'saltar', 'brinca'], pt: ['pula', 'pular', 'salta'], de: ['springt', 'spring', 'springen'], zh: ['[跳|tiào]'], ja: ['[跳|と]んで', '[跳|と]ぶ', '[跳|と]びます'] },
  };
  // ------------------------------------------------------------ the dungeon's floors, and the boss's lines
  const ROOMS = [
    { name: 'The Stone Floor', sub: 'The Great Mill, being built · the ground floor' },
    { name: 'The Gear Floor', sub: 'The Great Mill, being built · the 2nd floor' },
    { name: 'The Sail Loft', sub: 'The Great Mill, being built · the 3rd floor' },
    { name: 'The Cap', sub: 'The Great Mill, being built · the very top' },
  ];
  // the builders' log: what each floor's page asks you (the 2nd person, shown), before you write the answer (the 1st)
  const LOGQ = {
    crank: L('Did you turn the crank?', '¿Giraste la manivela?', 'Você girou a manivela?', 'Hast du die Kurbel gedreht?', '[你|nǐ] [转|zhuàn] [了|le] [绞盘|jiǎo pán] [吗|ma] ？', 'ハンドル を [回|まわ]しました か ？'),
    lever: L('Did you pull the lever?', '¿Bajaste la palanca?', 'Você baixou a alavanca?', 'Hast du den Hebel gezogen?', '[你|nǐ] [拉|lā] [了|le] [拉杆|lā gān] [吗|ma] ？', 'レバー を [引|ひ]きました か ？'),
    sails: L('Did you raise the sails?', '¿Levantaste las aspas?', 'Você levantou as pás?', 'Hast du die Flügel gehoben?', '[你|nǐ] [升|shēng] [了|le] [风帆|fēng fān] [吗|ma] ？', '[羽根|はね] を [上|あ]げました か ？'),
    finished: L('And you? Did you finish the work?', '¿Y tú? ¿Terminaste el trabajo?', 'E você? Terminou o trabalho?', 'Und du? Hast du die Arbeit fertig gemacht?', '[你|nǐ] [呢|ne] ？ [你|nǐ] [干|gàn] [完|wán] [了|le] [吗|ma] ？', 'あなた は ？ [仕事|しごと] は [終|お]わりました か ？'),
    stone: L('Did you leave the stone by the mill?', '¿Dejaste la piedra junto al molino?', 'Você deixou a pedra do lado do moinho?', 'Hast du den Stein an die Mühle gelegt?', '[你|nǐ] [把|bǎ] [石头|shí tou] [放|fàng] [在|zài] [磨坊|mò fáng] [旁边|páng biān] [了|le] [吗|ma] ？', '[石|いし] を [風車|ふうしゃ] の そば に [置|お]きました か ？'),
    wheel: L('Did you find the little wheel?', '¿Encontraste la ruedita?', 'Você encontrou a rodinha?', 'Hast du das Rädchen gefunden?', '[你|nǐ] [找到|zhǎo dào] [了|le] [小|xiǎo] [齿轮|chǐ lún] [吗|ma] ？', '[小|ちい]さな [歯車|はぐるま] を [見|み]つけました か ？'),
  };
  const LOGQ_MARKS = {
    crank: { es: [['Giraste', 'did you turn']], pt: [['girou', 'did (you) turn']], de: [['Hast du', 'have you'], ['gedreht', 'turned']], zh: [['[转|zhuàn] [了|le]', 'turned']], ja: [['[回|まわ]しました か', 'did (you) turn?']] },
    lever: { es: [['Bajaste', 'did you pull down']], pt: [['baixou', 'did (you) pull down']], de: [['Hast du', 'have you'], ['gezogen', 'pulled']], zh: [['[拉|lā] [了|le]', 'pulled']], ja: [['[引|ひ]きました か', 'did (you) pull?']] },
    sails: { es: [['Levantaste', 'did you raise']], pt: [['levantou', 'did (you) raise']], de: [['Hast du', 'have you'], ['gehoben', 'raised']], zh: [['[升|shēng] [了|le]', 'raised']], ja: [['[上|あ]げました か', 'did (you) raise?']] },
    finished: { es: [['Terminaste', 'did you finish']], pt: [['Terminou', 'did (you) finish']], de: [['Hast du', 'have you'], ['fertig gemacht', 'finished']], zh: [['[干|gàn] [完|wán] [了|le]', 'finished']], ja: [['[終|お]わりました か', 'did (it) finish?']] },
    stone: { es: [['Dejaste', 'did you leave']], pt: [['deixou', 'did (you) leave']], de: [['Hast du', 'have you'], ['gelegt', 'put']], zh: [['[放|fàng]', 'put']], ja: [['[置|お]きました か', 'did (you) put?']] },
    wheel: { es: [['Encontraste', 'did you find']], pt: [['encontrou', 'did (you) find']], de: [['Hast du', 'have you'], ['gefunden', 'found']], zh: [['[找到|zhǎo dào] [了|le]', 'found']], ja: [['[見|み]つけました か', 'did (you) find?']] },
  };
  // the fight: the first armadillo, young and silly (molinar_time_boss.js); {mimo} is the player's name for Mimo
  const FIGHT = {
    intro: L('Wheee! Round and round! You can’t catch me!', '¡Yujuuu! ¡A rodar! ¡No me atrapas!', 'Iupiii! Rolando! Você não me pega!', 'Juhuuu! Ich rolle! Du kriegst mich nicht!',
      '[哇|wā] [哈|hā] ！ [滚|gǔn] [啊|a] [滚|gǔn] ！ [你|nǐ] [抓|zhuā] [不|bù] [到|dào] [我|wǒ] ！', 'わーい ！ ころころ ！ つかまらない よー ！'),
    roll: L('Here I come!', '¡Allá voy!', 'Lá vou eu!', 'Ich komme!', '[我|wǒ] [来|lái] [啦|la] ！', 'いく よー ！'),
    coach: L('It’s a memory! Tell it what {mimo} did: «{mimo} pushed it!»', '¡Es un recuerdo! Di lo que hizo {mimo}: «¡{mimo} lo empujó!»', 'É uma lembrança! Diz o que o {mimo} fez: «O {mimo} empurrou!»', 'Das ist eine Erinnerung! Sag, was {mimo} gemacht hat: «{mimo} hat es geschoben!»',
      '[这|zhè] [是|shì] [回忆|huí yì] ！ [说|shuō] {mimo} [做|zuò] [了|le] [什么|shén me] ： “ {mimo} [推|tuī] [了|le] [它|tā] ！ ”', 'これ は [思|おも]い[出|で] だ ！ {mimo} が [何|なに] を した か [言|い]って ： 「 {mimo} が [押|お]した ！ 」'),
    now: L('That’s now! Up here everything is a memory!', '¡Eso es ahora! ¡Aquí arriba todo es un recuerdo!', 'Isso é agora! Aqui em cima tudo é lembrança!', 'Das ist jetzt! Hier oben ist alles eine Erinnerung!',
      '[那|nà] [是|shì] [现在|xiàn zài] ！ [这|zhè] [上面|shàng miàn] [一切|yī qiè] [都|dōu] [是|shì] [回忆|huí yì] ！', 'それ は [今|いま] だ よ ！ ここ で は 、 ぜんぶ [思|おも]い[出|で] な ん だ ！'),
    flip: L('It’s on its back! Look at its little legs!', '¡Está boca arriba! ¡Mira esas patitas!', 'Ficou de barriga pra cima! Olha essas perninhas!', 'Es liegt auf dem Rücken! Schau dir die Beinchen an!',
      '[它|tā] [翻|fān] [过来|guò lai] [了|le] ！ [看|kàn] [它|tā] [的|de] [小|xiǎo] [腿|tuǐ] ！', 'ひっくり[返|かえ]った ！ [小|ちい]さい [足|あし] が じたばた して る ！'),
    dizzy: L('Oof, I’m so dizzy… hee hee! Hey, hey! Did you push me?', '¡Uy, qué mareo… ji, ji! ¡Oye, oye! ¿Tú me empujaste?', 'Ai, que tontura… hi, hi! Ei, ei! Você me empurrou?', 'Uff, mir ist so schwindlig … hihi! Hey, hey! Hast du mich geschubst?',
      '[哎呀|āi yā] ， [好|hǎo] [晕|yūn] … [嘻嘻|xī xī] ！ [喂|wèi] ， [喂|wèi] ！ [你|nǐ] [推|tuī] [了|le] [我|wǒ] [吗|ma] ？', 'うわー 、 [目|め] が まわる … えへへ ！ ねえ ねえ ！ ぼく を [押|お]した ？'),
    q2: L('Again, again! And did you climb all the way up here?', '¡Otra vez, otra vez! ¿Y subiste hasta aquí arriba?', 'De novo, de novo! E você subiu até aqui em cima?', 'Nochmal, nochmal! Und bist du bis hier oben hochgestiegen?',
      '[再|zài] [来|lái] ， [再|zài] [来|lái] ！ [你|nǐ] [是|shì] [一路|yī lù] [爬|pá] [上来|shàng lai] [的|de] [吗|ma] ？', 'もう [一回|いっかい] ！ もう [一回|いっかい] ！ ここ まで [登|のぼ]って きた の ？'),
    answer: L('Answer it! What did YOU do? «I pushed…»', '¡Contéstale! ¿Qué hiciste TÚ? «Empujé…»', 'Responde! O que VOCÊ fez? «Empurrei…»', 'Antworte! Was hast DU gemacht? «Ich habe …»',
      '[回答|huí dá] [它|tā] ！ [你|nǐ] [做|zuò] [了|le] [什么|shén me] ？ “ [我|wǒ] … [了|le] ”', '[答|こた]えて あげて ！ あなた は [何|なに] を した ？'),
    giggle: L('Hee hee hee! You’re funny!', '¡Ji, ji, ji! ¡Qué gracioso!', 'Hi, hi, hi! Que engraçado!', 'Hihihi! Du bist lustig!', '[嘻嘻嘻|xī xī xī] ！ [你|nǐ] [真|zhēn] [好玩|hǎo wán] ！', 'えへへへ ！ おもしろい ！'),
    win: L('Okay, okay, I give up! Here… I found this shiny thing. It hums like a voice.', '¡Vale, vale, me rindo! Toma… encontré esta cosa brillante. Zumba como una voz.', 'Tá bom, tá bom, eu desisto! Toma… eu achei essa coisa brilhante. Ela zumbe como uma voz.', 'Okay, okay, ich gebe auf! Hier … ich habe dieses glänzende Ding gefunden. Es summt wie eine Stimme.',
      '[好|hǎo] [啦|la] ， [好|hǎo] [啦|la] ， [我|wǒ] [认输|rèn shū] ！ [给|gěi] … [我|wǒ] [找到|zhǎo dào] [了|le] [这个|zhè ge] [亮晶晶|liàng jīng jīng] [的|de] [东西|dōng xi] 。 [它|tā] [像|xiàng] [声音|shēng yīn] [一样|yī yàng] [嗡嗡|wēng wēng] [响|xiǎng] 。', 'わかった 、 わかった 、 まいった ！ はい … キラキラ した もの 、 [見|み]つけた ん だ 。 [声|こえ] みたい に ブーン って [鳴|な]る よ 。'),
  };
  // the young armadillo in the battle (a species of its own in every language: it's young, so a push flips it at once)
  const SPECIES = { es: { w: 'armadillito', pl: 'armadillitos', g: 'm', en: 'young armadillo' }, pt: { w: 'tatuzinho', pl: 'tatuzinhos', g: 'm', en: 'young armadillo' },
    de: { w: 'Gürteltierchen', pl: 'Gürteltierchen', gen: 'Gürteltierchens', g: 'n', en: 'young armadillo' },
    zh: { w: '[小犰狳|xiǎo qiú yú]', en: 'young armadillo', g: 'm', cl: '只', cls: ['只'] }, ja: { w: 'チビアルマジロ', en: 'young armadillo', g: 'm' } };
  const NAMES = {
    boss: L('the first armadillo', 'el primer armadillo', 'o primeiro tatu', 'das erste Gürteltier', '[第一|dì yī] [只|zhī] [犰狳|qiú yú]', 'はじめて の アルマジロ'),
    log: L('THE BUILDERS’ LOG', 'CUADERNO DE OBRA', 'CADERNO DE OBRA', 'BAUTAGEBUCH', '[工地|gōng dì] [日志|rì zhì]', '[工事|こうじ] [日誌|にっし]'),
  };
  const LORE = ['El primer armadillo de Molinar. Joven, redondo y muy travieso.', 'O primeiro tatu de Molinar. Jovem, redondo e muito arteiro.', 'Das erste Gürteltier von Molinar. Jung, rund und sehr frech.',
    '[磨坊镇|Mò fáng zhèn] [的|de] [第一|dì yī] [只|zhī] [犰狳|qiú yú] 。 [年轻|nián qīng] 、 [圆滚滚|yuán gǔn gǔn] 、 [很|hěn] [调皮|tiáo pí] 。', 'モリナール [最初|さいしょ] の アルマジロ 。 [若|わか]くて 、 [丸|まる]くて 、 いたずら [好|ず]き 。', 'Molinar’s first armadillo. Young, round and very naughty.'];
  // ------------------------------------------------------------ things to Look at (MOLT.look: the word, said aloud and glossed, then
  // what it is; molinar_past.js puts each one where it stands). id: its word (WORDS below); t: English, its {w.ml_*} met too
  const LOOKS = {
    'look.scaffold': { id: 'w.ml_scaffold', t: 'Poles and planks all the way up the Great Mill. The builders climb it all day, singing.' },
    'look.pulley': { id: 'w.ml_pulley', t: 'The hoist’s pulley. A {w.ml_millstone} hangs from its rope, waiting to go up.' },
    'look.blocks': { id: 'w.ml_block', t: 'Stone blocks, stacked high. Each one squared by hand with a {w.ml_chisel}.' },
    'look.timber': { id: 'w.ml_sawdust', t: 'Fresh-cut beams, and sawdust all around them. It smells like a forest.' },
    'look.sails': { id: 'w.ml_canvas', t: 'Two of the Great Mill’s {w.ml_sails} lie on trestles. Their canvas is still white and new.' },
    'look.plans': { id: 'w.ml_plans', t: 'The Great Mill, floor by floor: the stones at the bottom, the gears, the sails, and a bell at the very top. A {w.ml_ruler} holds one corner down.' },
    'look.mortar': { id: 'w.ml_mortar', t: 'A tub of gray mortar, still wet. A {w.ml_trowel} stands up in it.' },
    'look.tools': { id: 'w.ml_mallet', t: 'The builders’ tools on a crate: a wooden mallet, a {w.ml_chisel}, a plumb line.' },
    'look.wheelbarrow': { id: 'w.ml_wheelbarrow', t: 'A wheelbarrow, piled high: {w.ml_brick} on {w.ml_brick} on {w.ml_brick}.' },
    'look.bunting': { id: 'w.ml_bunting', t: 'Little flags, red, gold, blue, green and white, from lamp to lamp across the square.' },
    'look.awning': { id: 'w.ml_awning', t: 'The fruit stall’s striped awning. It keeps the apples cool.' },
    'look.stall': { id: 'w.ml_stall', t: 'A brand-new stall, its wood still pale. The {w.ml_market} is twice as big as last year.' },
    'look.scales': { id: 'w.ml_scales', t: 'Brass scales on the counter: a pan for the cheese, a pan for the weights.' },
    'look.eggs': { id: 'w.ml_eggs', t: 'A basket of brown eggs, still warm. {fina}’s hens are busy.' },
    'look.flour': { id: 'w.ml_flour', t: 'Sacks of flour from the little hill mills. A white cloud puffs up when one is set down.' },
    'look.cart': { id: 'w.ml_cart', t: '{fina}’s new cart: bright wood, red wheels, sacks of {w.ml_wheat}. The first one in Molinar.' },
    'look.grandclock': { id: 'w.ml_grandclock', t: 'A tall clock outside the shop, the master’s pride. Its {w.ml_pendulum} swings: tick, tock.' },
    'look.workbench': { id: 'w.ml_workbench', t: 'The master’s workbench: a {w.ml_magnifier}, {w.ml_tweezers}, a tray where every {w.ml_screw} has its place, and the {w.ml_oilcan}: one drop on each gear, every week.' },
    'look.cuckoo': { id: 'w.ml_cuckoo', t: 'A cuckoo clock waiting to be fixed. Its little wooden bird peeks out, then hides again.' },
    'look.sundial': { id: 'w.ml_sundial', t: 'A stone sundial. Its shadow says it’s almost noon… if you believe the sun.' },
    'look.cauldron': { id: 'w.ml_cauldron', t: 'The builders’ soup, bubbling over the {w.ml_firewood}, a {w.ml_ladle} hooked on the side. It smells of {w.ml_onion}.' },
    'look.dough': { id: 'w.ml_dough', t: 'Bread dough rising under a cloth. Beside it, a {w.ml_jug} of {w.ml_milk}, and a basket of {w.ml_potatoes} waiting for the pot.' },
    'look.oillamp': { id: 'w.ml_oillamp', t: 'An oil lamp on a post by the mill’s door: at night it’s the only light out here. Under it, a {w.ml_horseshoe}, points up, so the luck doesn’t fall out.' },
    'look.well': { id: 'w.ml_well', t: 'The square’s well. A wooden bucket on a rope, and cool water far below.' },
  };
  // ------------------------------------------------------------ the words of long ago (time_molinar.js MOLT.registerWords: LEX items,
  // kind 'word', ids w.ml_<key>; the journal's "Molinar words"). Each is met in use, in the line, demonstration or Look named last,
  // before any box could ask for it. key ~ en ~ es ~ pt ~ de ~ zh ~ ja ~ where (this file's keys: LINES / DEMO / LOOKS, q.* LOGQ).
  // The first block: the words the main path and side quests already showed (their demonstrations' marks); then the town of then.
  const WORDS = `lastnight ~ last night ~ =anoche ~ =ontem à noite ~ =gestern Abend ~ [昨天|zuó tiān] [晚上|wǎn shang] ~ ゆうべ ~ wife.demo
make ~ to make (a meal) ~ preparar ~ preparar ~ kochen ~ [做|zuò] ~ [作|つく]る ~ wife.demo
yesterday ~ yesterday ~ =ayer ~ =ontem ~ =gestern ~ [昨天|zuó tiān] ~ [昨日|きのう] ~ wife.demo, helper.demo, room1
bake ~ to bake ~ hornear ~ assar ~ backen ~ [烤|kǎo] ~ [焼|や]く ~ wife.demo
eat ~ to eat ~ comer ~ comer ~ essen ~ [吃|chī] ~ [食|た]べる ~ wife.demo
work ~ to work ~ trabajar ~ trabalhar ~ arbeiten ~ [干活|gàn huó] ~ [働|はたら]く ~ helper.demo, builder.q1
climb ~ to climb, to go up ~ subir ~ subir ~ steigen ~ [爬|pá] ~ [登|のぼ]る ~ helper.demo, builder.q2
@c.hill ~ ~ ~ ~ ~ ~ ~ builder.q2
turn ~ to turn ~ girar ~ girar ~ drehen ~ [转|zhuàn] ~ [回|まわ]す ~ room1, q.crank
crank ~ crank ~ la manivela ~ a manivela ~ die Kurbel ~ [绞盘|jiǎo pán] ~ ハンドル ~ room1
pull ~ to pull (down) ~ bajar ~ baixar ~ ziehen ~ [拉|lā] ~ [引|ひ]く ~ room2, q.lever
lever ~ lever ~ la palanca ~ a alavanca ~ der Hebel ~ [拉杆|lā gān] ~ レバー ~ room2
wheel ~ wheel ~ la rueda ~ a roda ~ das Rad ~ [轮子|lún zi] ~ [車輪|しゃりん] ~ room2, fina.demo
lastyear ~ last year ~ =el año pasado ~ =no ano passado ~ =letztes Jahr ~ [去年|qù nián] ~ [去年|きょねん] ~ room3
raise ~ to raise ~ levantar ~ levantar ~ heben ~ [升|shēng] ~ [上|あ]げる ~ room3, q.sails
sails ~ sails (of a mill) ~ las aspas ~ as pás ~ die Flügel ~ [风帆|fēng fān] ~ [羽根|はね] ~ room3, miller.m2, look.sails
draw ~ to draw ~ dibujar ~ desenhar ~ zeichnen ~ [画|huà] ~ [描|か]く ~ room4, builder.demo
finish ~ to finish ~ terminar ~ terminar ~ fertig machen ~ [完成|wán chéng] ~ [終|お]わる ~ room4, q.finished
cut ~ to cut (stone) ~ cortar ~ cortar ~ hauen ~ [凿|záo] ~ [彫|ほ]る ~ stone.demo
lastweek ~ last week ~ =la semana pasada ~ =na semana passada ~ =letzte Woche ~ [上|shàng] [个|gè] [星期|xīng qī] ~ [先週|せんしゅう] ~ stone.demo, builder.demo
throwaway ~ to throw away ~ tirar ~ jogar fora ~ wegwerfen ~ [扔|rēng] ~ [捨|す]てる ~ stone.demo
millstone ~ millstone ~ la piedra de molino ~ a mó ~ der Mühlstein ~ [磨盘|mò pán] ~ [石臼|いしうす] ~ stone.demo, miller.m2, look.pulley
to_oil ~ to oil ~ aceitar ~ =passar óleo ~ ölen ~ [上|shàng] [油|yóu] ~ [油|あぶら] を さす ~ wheel.demo, master.oil
oil ~ oil ~ el aceite ~ o óleo ~ das Öl ~ [油|yóu] ~ [油|あぶら] ~ wheel.demo, ciro.c5
gears ~ gears ~ los engranajes ~ as engrenagens ~ die Zahnräder ~ [齿轮|chǐ lún] ~ [歯車|はぐるま] ~ wheel.demo
lose ~ to lose ~ perder ~ perder ~ verlieren ~ [丢|diū] ~ なくす ~ marbles.demo
marbles ~ marbles ~ las canicas ~ as bolinhas de gude ~ die Murmeln ~ [弹珠|dàn zhū] ~ ビー[玉|だま] ~ marbles.demo
find ~ to find ~ encontrar ~ encontrar ~ finden ~ [找到|zhǎo dào] ~ [見|み]つける ~ marbles.demo, q.wheel
leave ~ to leave, to put ~ dejar ~ deixar ~ legen ~ [放|fàng] ~ [置|お]く ~ q.stone
scaffold ~ scaffolding ~ el andamio ~ o andaime ~ das Gerüst ~ [脚手架|jiǎo shǒu jià] ~ [足場|あしば] ~ look.scaffold, helper.h2
pulley ~ pulley ~ la polea ~ a roldana ~ der Flaschenzug ~ [滑轮|huá lún] ~ [滑車|かっしゃ] ~ look.pulley, builder.b1
mortar ~ mortar ~ la argamasa ~ a argamassa ~ der Mörtel ~ [灰浆|huī jiāng] ~ モルタル ~ look.mortar, helper.h1
brick ~ brick ~ el ladrillo ~ o tijolo ~ der Ziegel ~ [砖|zhuān] ~ れんが ~ look.wheelbarrow, helper.demo2
block ~ stone block ~ el bloque ~ o bloco ~ der Steinblock ~ [石块|shí kuài] ~ [石材|せきざい] ~ look.blocks, builder.b1
trowel ~ trowel ~ la cuchara de albañil ~ a colher de pedreiro ~ die Maurerkelle ~ [泥刀|ní dāo] ~ こて ~ look.mortar, helper.h1
chisel ~ chisel ~ el cincel ~ o cinzel ~ der Meißel ~ [凿子|záo zi] ~ のみ ~ look.blocks, look.tools
mallet ~ mallet ~ el mazo ~ o maço ~ der Holzhammer ~ [木槌|mù chuí] ~ [木槌|きづち] ~ look.tools
wheelbarrow ~ wheelbarrow ~ la carretilla ~ o carrinho de mão ~ die Schubkarre ~ [手推车|shǒu tuī chē] ~ [一輪車|いちりんしゃ] ~ look.wheelbarrow, kid.k3, helper.demo2
sawdust ~ sawdust ~ el aserrín ~ a serragem ~ das Sägemehl ~ [锯末|jù mò] ~ おがくず ~ look.timber, helper.h3
builder ~ builder ~ el constructor ~ o construtor ~ der Bauarbeiter ~ [工人|gōng rén] ~ [大工|だいく] ~ builder.b2
plans ~ plans (drawings) ~ los planos ~ as plantas ~ die Baupläne ~ [图纸|tú zhǐ] ~ [図面|ずめん] ~ look.plans, builder.b2, builder.demo
ruler ~ ruler ~ la regla ~ a régua ~ das Lineal ~ [尺子|chǐ zi] ~ [定規|じょうぎ] ~ look.plans
canvas ~ canvas ~ la lona ~ a lona ~ das Segeltuch ~ [帆布|fān bù] ~ [帆布|はんぷ] ~ look.sails
mast ~ mast ~ el mástil ~ o mastro ~ der Mast ~ [桅杆|wéi gān] ~ [柱|はしら] ~ builder.b3
build ~ to build ~ construir ~ construir ~ bauen ~ [造|zào] ~ [建|た]てる ~ fina.demo
load ~ to load ~ cargar ~ carregar ~ laden ~ [装|zhuāng] ~ [積|つ]む ~ helper.demo2
measure ~ to measure ~ medir ~ medir ~ messen ~ [量|liáng] ~ [測|はか]る ~ builder.demo
stall ~ stall ~ el puesto ~ a barraca ~ der Stand ~ [摊子|tān zi] ~ [屋台|やたい] ~ look.stall, fina.f3
bunting ~ bunting ~ los banderines ~ as bandeirinhas ~ die Wimpelkette ~ [彩旗|cǎi qí] ~ [小旗|こばた] ~ look.bunting, fina.f3
awning ~ awning ~ el toldo ~ o toldo ~ die Markise ~ [遮阳棚|zhē yáng péng] ~ [日除|ひよ]け ~ look.awning
scales ~ scales ~ la balanza ~ a balança ~ die Waage ~ [秤|chèng] ~ はかり ~ look.scales, fina.f4
customer ~ customer ~ el cliente ~ o freguês ~ der Kunde ~ [顾客|gù kè] ~ お[客|きゃく]さん ~ fina.f2
price ~ price ~ el precio ~ o preço ~ der Preis ~ [价钱|jià qian] ~ [値段|ねだん] ~ fina.f2
cheap ~ cheap ~ =barato ~ =barato ~ =billig ~ [便宜|pián yi] ~ [安|やす]い ~ fina.f4
expensive ~ expensive ~ =caro ~ =caro ~ =teuer ~ [贵|guì] ~ [高|たか]い ~ fina.f4
flour ~ flour ~ la harina ~ a farinha ~ das Mehl ~ [面粉|miàn fěn] ~ [小麦粉|こむぎこ] ~ look.flour, miller.m1, miller.demo
wheat ~ wheat ~ el trigo ~ o trigo ~ der Weizen ~ [麦子|mài zi] ~ [麦|むぎ] ~ look.cart, miller.m1
eggs ~ eggs ~ los huevos ~ os ovos ~ die Eier ~ [鸡蛋|jī dàn] ~ [卵|たまご] ~ look.eggs, fina.f2
market ~ market ~ el mercado ~ o mercado ~ der Markt ~ [市场|shì chǎng] ~ [市場|いちば] ~ fina.f3, look.stall
sell ~ to sell ~ vender ~ vender ~ verkaufen ~ [卖|mài] ~ [売|う]る ~ miller.demo
buy ~ to buy ~ comprar ~ comprar ~ kaufen ~ [买|mǎi] ~ [買|か]う ~ fina.demo
cart ~ cart ~ la carreta ~ a carroça ~ der Karren ~ [小车|xiǎo chē] ~ [荷車|にぐるま] ~ look.cart, fina.f1
axle ~ axle ~ el eje ~ o eixo ~ die Achse ~ [车轴|chē zhóu] ~ [車軸|しゃじく] ~ fina.f1
new ~ new ~ =nuevo ~ =novo ~ =neu ~ [新|xīn] ~ [新|あたら]しい ~ fina.f1
paint ~ to paint ~ pintar ~ pintar ~ streichen ~ [涂|tú] ~ [塗|ぬ]る ~ fina.demo
clockmaker ~ clockmaker ~ el relojero ~ o relojoeiro ~ der Uhrmacher ~ [钟表匠|zhōng biǎo jiàng] ~ [時計屋|とけいや] ~ master.m1
apprentice ~ apprentice ~ el aprendiz ~ o aprendiz ~ der Lehrling ~ [学徒|xué tú] ~ [見習|みなら]い ~ ciro.c1
pendulum ~ pendulum ~ el péndulo ~ o pêndulo ~ das Pendel ~ [钟摆|zhōng bǎi] ~ [振|ふ]り[子|こ] ~ look.grandclock, ciro.c2
hands ~ clock hands ~ las manecillas ~ os ponteiros ~ die Zeiger ~ [指针|zhǐ zhēn] ~ [針|はり] ~ master.m3
spring ~ spring (of a clock) ~ el resorte ~ a mola ~ die Feder ~ [发条|fā tiáo] ~ ぜんまい ~ master.m3
screw ~ screw ~ el tornillo ~ o parafuso ~ die Schraube ~ [螺丝|luó sī] ~ ねじ ~ look.workbench, ciro.c1
magnifier ~ magnifying glass ~ la lupa ~ a lupa ~ die Lupe ~ [放大镜|fàng dà jìng] ~ [虫眼鏡|むしめがね] ~ look.workbench, master.m1
tweezers ~ tweezers ~ las pinzas ~ a pinça ~ die Pinzette ~ [镊子|niè zi] ~ ピンセット ~ look.workbench, ciro.c3
oilcan ~ oil can ~ la aceitera ~ a almotolia ~ die Ölkanne ~ [油壶|yóu hú] ~ [油|あぶら]さし ~ look.workbench
cuckoo ~ cuckoo clock ~ el reloj de cuco ~ o relógio cuco ~ die Kuckucksuhr ~ [布谷鸟钟|bù gǔ niǎo zhōng] ~ [鳩時計|はとどけい] ~ look.cuckoo, ciro.c4, master.demo
grandclock ~ grandfather clock ~ el reloj de pie ~ o relógio de pé ~ die Standuhr ~ [落地钟|luò dì zhōng] ~ [大時計|おおどけい] ~ look.grandclock
workbench ~ workbench ~ el banco de trabajo ~ a bancada ~ die Werkbank ~ [工作台|gōng zuò tái] ~ [作業台|さぎょうだい] ~ look.workbench, ciro.c4, master.demo
ticktock ~ tick-tock ~ =tictac ~ =tique-taque ~ =ticktack ~ [滴答|dī dā] ~ チクタク ~ master.m2
minute ~ minute ~ el minuto ~ o minuto ~ die Minute ~ [分钟|fēn zhōng] ~ [分|ふん] ~ master.m3
fix ~ to fix ~ arreglar ~ consertar ~ reparieren ~ [修|xiū] ~ [直|なお]す ~ master.demo
clean ~ to clean ~ limpiar ~ limpar ~ putzen ~ [打扫|dǎ sǎo] ~ [掃除|そうじ] する ~ master.demo
sundial ~ sundial ~ el reloj de sol ~ o relógio de sol ~ die Sonnenuhr ~ [日晷|rì guǐ] ~ [日時計|ひどけい] ~ look.sundial, master.m4
kitchen ~ kitchen ~ la cocina ~ a cozinha ~ die Küche ~ [厨房|chú fáng] ~ [台所|だいどころ] ~ wife.k1
cauldron ~ cooking pot ~ el caldero ~ o caldeirão ~ der Kessel ~ [大锅|dà guō] ~ [大鍋|おおなべ] ~ look.cauldron, wife.k1
ladle ~ ladle ~ el cucharón ~ a concha ~ die Schöpfkelle ~ [汤勺|tāng sháo] ~ おたま ~ look.cauldron
dough ~ dough ~ la masa ~ a massa ~ der Teig ~ [面团|miàn tuán] ~ [生地|きじ] ~ look.dough, kid.k1, wife.demo2
salt ~ salt ~ la sal ~ o sal ~ das Salz ~ [盐|yán] ~ [塩|しお] ~ wife.k2
potatoes ~ potatoes ~ las papas ~ as batatas ~ die Kartoffeln ~ [土豆|tǔ dòu] ~ じゃがいも ~ look.dough, wife.k2, wife.demo2
onion ~ onion ~ la cebolla ~ a cebola ~ die Zwiebel ~ [洋葱|yáng cōng] ~ たまねぎ ~ wife.k2, look.cauldron
firewood ~ firewood ~ la leña ~ a lenha ~ das Brennholz ~ [柴火|chái huo] ~ [薪|まき] ~ look.cauldron
apron ~ apron ~ el delantal ~ o avental ~ die Schürze ~ [围裙|wéi qún] ~ エプロン ~ miller.m3
jug ~ jug ~ la jarra ~ a jarra ~ der Krug ~ [壶|hú] ~ [水差|みずさ]し ~ look.dough, wife.k4
milk ~ milk ~ la leche ~ o leite ~ die Milch ~ [牛奶|niú nǎi] ~ [牛乳|ぎゅうにゅう] ~ look.dough, wife.k4
hunger ~ hunger ~ el hambre ~ a fome ~ der Hunger ~ [饥饿|jī è] ~ [空腹|くうふく] ~ wife.k3
recipe ~ recipe ~ la receta ~ a receita ~ das Rezept ~ [菜谱|cài pǔ] ~ レシピ ~ wife.k2
delicious ~ delicious ~ =rico ~ =gostoso ~ =lecker ~ [好吃|hǎo chī] ~ おいしい ~ miller.m2
knead ~ to knead ~ amasar ~ sovar ~ kneten ~ [揉|róu] ~ こねる ~ wife.demo2
peel ~ to peel ~ pelar ~ descascar ~ schälen ~ [削皮|xiāo pí] ~ むく ~ wife.demo2
wash ~ to wash ~ lavar ~ lavar ~ waschen ~ [洗|xǐ] ~ [洗|あら]う ~ wife.demo2
help ~ to help ~ ayudar ~ ajudar ~ helfen ~ [帮|bāng] ~ [手伝|てつだ]う ~ miller.demo
oillamp ~ oil lamp ~ el candil ~ a lamparina ~ die Öllampe ~ [油灯|yóu dēng] ~ オイルランプ ~ look.oillamp
well ~ well ~ el pozo ~ o poço ~ der Brunnen ~ [井|jǐng] ~ [井戸|いど] ~ look.well
horseshoe ~ horseshoe ~ la herradura ~ a ferradura ~ das Hufeisen ~ [马蹄铁|mǎ tí tiě] ~ [蹄鉄|ていてつ] ~ look.oillamp, kid.k2
daybefore ~ the day before yesterday ~ =anteayer ~ =anteontem ~ =vorgestern ~ [前天|qián tiān] ~ おととい ~ helper.demo2
thismorning ~ this morning ~ =esta mañana ~ =hoje de manhã ~ =heute Morgen ~ [今天|jīn tiān] [早上|zǎo shang] ~ [今朝|けさ] ~ master.demo
lastmonth ~ last month ~ =el mes pasado ~ =no mês passado ~ =letzten Monat ~ [上|shàng] [个|gè] [月|yuè] ~ [先月|せんげつ] ~ fina.demo
autumn ~ autumn ~ el otoño ~ o outono ~ der Herbst ~ [秋天|qiū tiān] ~ [秋|あき] ~ wife.k3`;
  // the table keys teach their words when said (time_molinar.js MOLT.teach): 'p:' + the key
  const stamp = (O, pre) => Object.entries(O || {}).forEach(([k, T0]) => { if (T0 && typeof T0 === 'object' && !T0._mk) T0._mk = pre + k; });
  stamp(LINES, 'p:'); stamp(DEMO, 'p:'); stamp(LOOKS, 'p:'); stamp(LOGQ, 'p:q.'); stamp(FIGHT, 'p:f.');
  const en = (T, l) => (T && (T['en_' + l] || T.en)) || '';
  return { L, CAST, LINES, DEMO, MARKS, CARDS, TIPS, TASKS, MEM, MEM_PRES, ROOMS, LOGQ, LOGQ_MARKS, FIGHT, SPECIES, NAMES, LORE, LOOKS, WORDS, en };
})();
