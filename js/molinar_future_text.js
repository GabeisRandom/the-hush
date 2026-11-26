'use strict';
// Molinar, tomorrow: the words (DESIGN.md 18.6 "T1c", game/TIME.md §11). Every line in es / pt / de, zh and ja in CJK.md's
// notation, and the English the weave mixes from. molinar_future.js is the place, molinar_future_mill.js the silent Great Mill,
// molinar_time_boss.js the Gray Miller; time_molinar.js (MOLT) says, demonstrates and grades them.
// The grammar rung (TIME.md §8): the simple future in every person, regular («moleré, molerás, molerá, moleremos, molerán») with
// «la semana que viene»: you promise the frozen people what they (or you, or all of you) will do, and they wake. Mimo's commands
// are plans («{mimo} soplará»). pt: the futuro do presente (moerei, moerá, moeremos, moerão; «vou + infinitive» still counts);
// de: «werden» in every person, the verb last; zh: 会 / 要 with the person, 下个星期; ja: ～つもり / ～ます / でしょう with 来週.
// The cast: today's Molinar, older and gray: Trigo (the miller's grandkid, the only one still talking), Ciro, Marga, Tomás, Lupe,
// Dani and Félix.
const MFTXT = (() => {
  const L = (en, es, pt, de, zh, ja, o) => Object.assign({ en, es, pt, de, zh, ja }, o || {});
  const CAST = {
    trigo: L('Trigo', 'Trigo', 'Trigo', 'Trigo', '[小麦|Xiǎo mài]', 'コムギ'),
    ciro: L('Ciro', 'Ciro', 'Ciro', 'Ciro', '[西罗|Xī luó]', 'シロ'),
    marga: L('Marga', 'Marga', 'Marga', 'Marga', '[玛尔加|Mǎ ěr jiā]', 'マルガ'),
    tomas: L('Tomás', 'Tomás', 'Tomás', 'Tomás', '[托马斯|Tuō mǎ sī]', 'トマス'),
    lupe: L('Lupe', 'Lupe', 'Lupe', 'Lupe', '[露佩|Lù pèi]', 'ルペ'),
    dani: L('Dani', 'Dani', 'Dani', 'Dani', '[达尼|Dá ní]', 'ダニ'),
    felix: L('Félix', 'Félix', 'Félix', 'Félix', '[费利克斯|Fèi lì kè sī]', 'フェリックス'),
  };
  // ------------------------------------------------------------ what people say (mixed by the weave; EN on request)
  const LINES = {
    'trigo.hello': L('You can see me? Everyone else went gray. I talk to the mill every day, so the Hush can’t take my words.',
      '¿Me ves? Todos los demás se pusieron grises. Yo le hablo al molino todos los días, para que el Silencio no se lleve mis palabras.',
      'Você me vê? Todo mundo ficou cinza. Eu falo com o moinho todo dia, pro Silêncio não levar as minhas palavras.',
      'Du siehst mich? Alle anderen sind grau geworden. Ich rede jeden Tag mit der Mühle, damit die Stille meine Wörter nicht nimmt.',
      '[你|nǐ] [看得见|kàn de jiàn] [我|wǒ] ？ [别人|bié rén] [都|dōu] [变|biàn] [灰|huī] [了|le] 。 [我|wǒ] [每天|měi tiān] [跟|gēn] [磨坊|mò fáng] [说话|shuō huà] ， [这样|zhè yàng] [寂静|Jì jìng] [就|jiù] [拿|ná] [不|bù] [走|zǒu] [我|wǒ] [的|de] [话|huà] 。',
      'ぼく が [見|み]える ？ ほか の みんな は [灰色|はいいろ] に なっちゃった 。 ぼく は [毎日|まいにち] 、 [風車|ふうしゃ] に [話|はな]しかけて る ん だ 。 [静寂|せいじゃく] に [言葉|ことば] を [取|と]られない よう に 。'),
    'trigo.wake': L('They’re not gone, only {w.ml_frozen}. Promise them a {w.ml_tomorrow}, and they’ll wake up. Promise them what they’ll do!',
      'No se fueron, solo están congelados. Promételes un mañana y despertarán. ¡Promételes lo que harán!',
      'Eles não foram embora, só estão congelados. Promete um amanhã pra eles, e eles acordarão. Promete o que eles vão fazer!',
      'Sie sind nicht weg, nur erstarrt. Versprich ihnen ein Morgen, dann werden sie aufwachen. Versprich ihnen, was sie tun werden!',
      '[他们|tā men] [没|méi] [走|zǒu] ， [只是|zhǐ shì] [冻住|dòng zhù] [了|le] 。 [答应|dā ying] [他们|tā men] [一个|yī gè] [明天|míng tiān] ， [他们|tā men] [就|jiù] [会|huì] [醒|xǐng] 。 [告诉|gào su] [他们|tā men] [明天|míng tiān] [会|huì] [做|zuò] [什么|shén me] ！',
      'みんな いなく なった ん じゃ ない 。 [固|かた]まって る だけ 。 [明日|あした] を [約束|やくそく] したら 、 [目|め] を [覚|さ]ます よ 。 [明日|あした] [何|なに] を する か 、 [約束|やくそく] して あげて ！'),
    'trigo.seal': L('The mill’s door is sealed with gray. When the town wakes up, the {w.ml_seal} will crack.',
      'La puerta del molino está sellada de gris. Cuando el pueblo despierte, el sello se romperá.',
      'A porta do moinho está selada de cinza. Quando a cidade acordar, o selo vai rachar.',
      'Die Tür der Mühle ist grau versiegelt. Wenn die Stadt aufwacht, wird das Siegel brechen.',
      '[磨坊|mò fáng] [的|de] [门|mén] [被|bèi] [灰色|huī sè] [封住|fēng zhù] [了|le] 。 [镇子|zhèn zi] [醒|xǐng] [过来|guò lai] [以后|yǐ hòu] ， [封印|fēng yìn] [就|jiù] [会|huì] [裂开|liè kāi] 。',
      '[風車|ふうしゃ] の ドア は 、 [灰色|はいいろ] で ふさがれて いる 。 [町|まち] が [目|め] を [覚|さ]ませば 、 [封|ふう] は [割|わ]れる よ 。'),
    'trigo.open': L('The seal cracked! The town is waking up. Go in: whatever stopped the mill is up at the top.',
      '¡El sello se rompió! El pueblo está despertando. Entra: lo que paró el molino está arriba del todo.',
      'O selo rachou! A cidade está acordando. Entra: o que parou o moinho está lá no alto.',
      'Das Siegel ist gebrochen! Die Stadt wacht auf. Geh rein: Was die Mühle angehalten hat, ist ganz oben.',
      '[封印|fēng yìn] [裂开|liè kāi] [了|le] ！ [镇子|zhèn zi] [在|zài] [醒|xǐng] [过来|guò lai] 。 [进去|jìn qu] [吧|ba] ： [让|ràng] [磨坊|mò fáng] [停|tíng] [下来|xià lai] [的|de] [东西|dōng xi] [就|jiù] [在|zài] [最|zuì] [上面|shàng miàn] 。',
      '[封|ふう] が [割|わ]れた ！ [町|まち] が [目|め] を [覚|さ]まして いる 。 [入|はい]って ！ [風車|ふうしゃ] を [止|と]めた もの は 、 いちばん [上|うえ] に いる よ 。'),
    'trigo.after': L('The sails! They’re turning! Tomorrow… tomorrow we’ll grind wheat again.',
      '¡Las aspas! ¡Están girando! Mañana… mañana moleremos trigo otra vez.',
      'As pás! Estão girando! Amanhã… amanhã moeremos trigo de novo.',
      'Die Flügel! Sie drehen sich! Morgen … morgen werden wir wieder Weizen mahlen.',
      '[风帆|fēng fān] ！ [转|zhuàn] [起来|qǐ lai] [了|le] ！ [明天|míng tiān] … [明天|míng tiān] [我们|wǒ men] [又|yòu] [会|huì] [磨|mó] [麦子|mài zi] [了|le] 。',
      '[羽根|はね] だ ！ [回|まわ]って る ！ [明日|あした] … [明日|あした] は また [麦|むぎ] を [挽|ひ]く ん だ 。'),
    'trigo.again': L('Promise them what they’ll do tomorrow. That’s all it takes.',
      'Promételes lo que harán mañana. No hace falta más.',
      'Promete o que eles vão fazer amanhã. Só isso.',
      'Versprich ihnen, was sie morgen tun werden. Mehr braucht es nicht.',
      '[答应|dā ying] [他们|tā men] [明天|míng tiān] [会|huì] [做|zuò] [什么|shén me] 。 [就|jiù] [这么|zhè me] [简单|jiǎn dān] 。',
      '[明日|あした] [何|なに] を する か 、 [約束|やくそく] して あげて 。 それ だけ で いい ん だ 。'),
    // the frozen: what the Hush leaves of their words (*starred* words survive, as the hushed say them)
    'tomas.frozen': L('*Bread*… nobody *buys*… *tomorrow*…', '*Pan*… nadie *compra*… *mañana*…', '*Pão*… ninguém *compra*… *amanhã*…', '*Brot* … keiner *kauft* … *morgen* …',
      '*[面包|miàn bāo]* … [没|méi] [人|rén] *[买|mǎi]* … *[明天|míng tiān]* …', '*パン* … だれ も *[買|か]わない* … *[明日|あした]* …'),
    'lupe.frozen': L('*Fruit*… the *children*… don’t *come* anymore…', '*Fruta*… los *niños*… ya no *vienen*…', '*Fruta*… as *crianças*… não *vêm* mais…', '*Obst* … die *Kinder* … *kommen* nicht mehr …',
      '*[水果|shuǐ guǒ]* … [孩子|hái zi] [们|men] … [不再|bù zài] *[来|lái]* [了|le] …', '*くだもの* … *[子|こ]ども* たち … もう *[来|こ]ない* …'),
    'marga.frozen': L('My *cart*… the *wheat*… the *mill* doesn’t *turn*…', 'Mi *carreta*… el *trigo*… el *molino* no *gira*…', 'A minha *carroça*… o *trigo*… o *moinho* não *gira*…', 'Mein *Karren* … der *Weizen* … die *Mühle* *dreht* sich nicht …',
      '[我|wǒ] [的|de] *[车|chē]* … *[麦子|mài zi]* … *[磨坊|mò fáng]* [不|bù] *[转|zhuàn]* …', '*[荷車|にぐるま]* … *[麦|むぎ]* … *[風車|ふうしゃ]* が *[回|まわ]らない* …'),
    'ciro.frozen': L('The *clock*… *stopped*… *nobody* speaks…', 'El *reloj*… se *paró*… *nadie* habla…', 'O *relógio*… *parou*… *ninguém* fala…', 'Die *Uhr* … ist *stehen* geblieben … *niemand* spricht …',
      '*[钟|zhōng]* … *[停|tíng]* [了|le] … *[没|méi]* [人|rén] [说话|shuō huà] …', '*[時計|とけい]* … *[止|と]まった* … *だれ* も [話|はな]さない …'),
    'dani.frozen': L('My *pinwheel*… doesn’t *spin*… no *wind*…', 'Mi *molinillo*… no *gira*… no hay *viento*…', 'O meu *cata-vento*… não *gira*… não tem *vento*…', 'Mein *Windrad* … *dreht* sich nicht … kein *Wind* …',
      '[我|wǒ] [的|de] *[风车|fēng chē]* … [不|bù] *[转|zhuàn]* … [没有|méi yǒu] *[风|fēng]* …', 'ぼく の *[風車|かざぐるま]* … *[回|まわ]らない* … *[風|かぜ]* が ない …'),
    'felix.frozen': L('*Welcome*… to… *Molinar*…', '*Bienvenidos*… a… *Molinar*…', '*Bem-vindos*… a… *Molinar*…', '*Willkommen* … in … *Molinar* …',
      '*[欢迎|huān yíng]* … [来到|lái dào] … *[磨坊镇|Mò fáng zhèn]* …', '*ようこそ* … *モリナール* … へ …'),
    // woken: theirs again
    'tomas.awake': L('Bread! Tomorrow I’ll sell bread again! Thank you for the {w.ml_promise}.', '¡Pan! ¡Mañana venderé pan otra vez! Gracias por la promesa.', 'Pão! Amanhã venderei pão de novo! Obrigado pela promessa.', 'Brot! Morgen werde ich wieder Brot verkaufen! Danke für das Versprechen.',
      '[面包|miàn bāo] ！ [明天|míng tiān] [我|wǒ] [会|huì] [再|zài] [卖|mài] [面包|miàn bāo] ！ [谢谢|xiè xie] [你|nǐ] [的|de] [承诺|chéng nuò] 。', 'パン ！ [明日|あした] 、 また パン を [売|う]ります ！ [約束|やくそく] 、 ありがとう ございます 。'),
    'lupe.awake': L('The children will buy fruit! I’ll get the sweetest apples ready.', '¡Los niños comprarán fruta! Prepararé las manzanas más dulces.', 'As crianças comprarão frutas! Vou separar as maçãs mais doces.', 'Die Kinder werden Obst kaufen! Ich werde die süßesten Äpfel vorbereiten.',
      '[孩子|hái zi] [们|men] [会|huì] [来|lái] [买|mǎi] [水果|shuǐ guǒ] ！ [我|wǒ] [要|yào] [准备|zhǔn bèi] [最|zuì] [甜|tián] [的|de] [苹果|píng guǒ] 。', '[子|こ]ども たち が くだもの を [買|か]いに [来|く]る ！ いちばん [甘|あま]い りんご を [用意|ようい] します ね 。'),
    'marga.awake': L('We’ll take the wheat together! My cart still rolls, see? On that old stone wheel.', '¡Llevaremos el trigo juntos! Mi carreta todavía rueda, ¿ves? Con esa vieja rueda de piedra.', 'Levaremos o trigo juntos! A minha carroça ainda roda, viu? Com aquela velha roda de pedra.', 'Wir werden den Weizen zusammen bringen! Mein Karren rollt noch, siehst du? Auf dem alten Steinrad.',
      '[我们|wǒ men] [会|huì] [一起|yī qǐ] [送|sòng] [麦子|mài zi] ！ [我|wǒ] [的|de] [车|chē] [还|hái] [能|néng] [走|zǒu] ， [你|nǐ] [看|kàn] ？ [靠|kào] [那个|nà ge] [老|lǎo] [石|shí] [轮子|lún zi] 。', 'いっしょ に [麦|むぎ] を [運|はこ]びましょう ！ わたし の [荷車|にぐるま] 、 まだ [動|うご]く でしょう ？ あの [古|ふる]い [石|いし] の [車輪|しゃりん] で 。'),
    'marga.awake0': L('We’ll take the wheat together! If only my cart had a wheel… it broke years ago.', '¡Llevaremos el trigo juntos! Si mi carreta tuviera rueda… se rompió hace años.', 'Levaremos o trigo juntos! Se a minha carroça tivesse roda… quebrou faz anos.', 'Wir werden den Weizen zusammen bringen! Wenn mein Karren nur ein Rad hätte … es ist vor Jahren kaputtgegangen.',
      '[我们|wǒ men] [会|huì] [一起|yī qǐ] [送|sòng] [麦子|mài zi] ！ [要是|yào shi] [我|wǒ] [的|de] [车|chē] [有|yǒu] [轮子|lún zi] [就|jiù] [好|hǎo] [了|le] … [好|hǎo] [几|jǐ] [年|nián] [前|qián] [就|jiù] [坏|huài] [了|le] 。', 'いっしょ に [麦|むぎ] を [運|はこ]びましょう ！ [荷車|にぐるま] に [車輪|しゃりん] が あれば … [何年|なんねん] も [前|まえ] に [壊|こわ]れた ん です 。'),
    'ciro.awake': L('My clock will chime again… yes. Now I remember. The mill stopped because nobody oiled its gears. Nobody reminded anybody.', 'Mi reloj sonará otra vez… sí. Ahora recuerdo. El molino se paró porque nadie aceitó los engranajes. Nadie se lo recordó a nadie.', 'O meu relógio tocará de novo… sim. Agora eu lembro. O moinho parou porque ninguém passou óleo nas engrenagens. Ninguém lembrou ninguém.', 'Meine Uhr wird wieder schlagen … ja. Jetzt erinnere ich mich. Die Mühle ist stehen geblieben, weil keiner die Zahnräder geölt hat. Keiner hat keinen daran erinnert.',
      '[我|wǒ] [的|de] [钟|zhōng] [会|huì] [再|zài] [响|xiǎng] … [对|duì] 。 [我|wǒ] [想起来|xiǎng qǐ lai] [了|le] 。 [磨坊|mò fáng] [停|tíng] [了|le] ， [因为|yīn wèi] [没|méi] [人|rén] [给|gěi] [齿轮|chǐ lún] [上|shàng] [油|yóu] 。 [谁|shéi] [也|yě] [没|méi] [提醒|tí xǐng] [谁|shéi] 。', 'わたし の [時計|とけい] は また [鳴|な]る … そう だ 。 [思|おも]い[出|だ]しました 。 [風車|ふうしゃ] が [止|と]まった の は 、 だれ も [歯車|はぐるま] に [油|あぶら] を ささなかった から です 。 だれ も [声|こえ] を かけなかった 。'),
    'ciro.warn': L('Take this to me… the me of your today. I’ll understand. Read it to me, word for word.', 'Llévale esto a mí… al yo de tu hoy. Lo entenderé. Léemelo, palabra por palabra.', 'Leva isto pra mim… o eu do seu hoje. Eu vou entender. Lê pra mim, palavra por palavra.', 'Bring das zu mir … zu dem Ich in deinem Heute. Ich werde es verstehen. Lies es mir vor, Wort für Wort.',
      '[把|bǎ] [这个|zhè ge] [带|dài] [给|gěi] [我|wǒ] … [你|nǐ] [的|de] [今天|jīn tiān] [里|lǐ] [的|de] [我|wǒ] 。 [我|wǒ] [会|huì] [明白|míng bai] [的|de] 。 [一|yī] [个|gè] [字|zì] [一|yī] [个|gè] [字|zì] [地|de] [念|niàn] [给|gěi] [我|wǒ] [听|tīng] 。', 'これ を わたし に [届|とど]けて ください … あなた の [今日|きょう] の わたし に 。 わかる はず です 。 ひと[言|こと] ずつ 、 [読|よ]んで あげて ください 。'),
    'dani.awake': L('I’ll play with my friends next week! And my pinwheel… will it spin?', '¡La semana que viene jugaré con mis amigos! Y mi molinillo… ¿girará?', 'Na semana que vem eu brincarei com os meus amigos! E o meu cata-vento… vai girar?', 'Nächste Woche werde ich mit meinen Freunden spielen! Und mein Windrad … wird es sich drehen?',
      '[下个星期|xià ge xīng qī] [我|wǒ] [会|huì] [跟|gēn] [朋友|péng you] [一起|yī qǐ] [玩|wán] ！ [那|nà] [我|wǒ] [的|de] [风车|fēng chē] … [会|huì] [转|zhuàn] [吗|ma] ？', '[来週|らいしゅう] 、 [友|とも]だち と [遊|あそ]ぶ よ ！ ぼく の [風車|かざぐるま] は … [回|まわ]る かな ？'),
    'dani.spin': L('It spins! It spins! Next week everyone will want one.', '¡Gira! ¡Gira! La semana que viene todos querrán uno.', 'Gira! Gira! Na semana que vem todo mundo vai querer um.', 'Es dreht sich! Es dreht sich! Nächste Woche werden alle eins wollen.',
      '[转|zhuàn] [了|le] ！ [转|zhuàn] [了|le] ！ [下个星期|xià ge xīng qī] [大家|dà jiā] [都|dōu] [会|huì] [想要|xiǎng yào] [一个|yī gè] 。', '[回|まわ]った ！ [回|まわ]った ！ [来週|らいしゅう] は 、 みんな ほしがる よ 。'),
    'felix.awake': L('Welcome to Molinar! Tomorrow I’ll greet every traveler again.', '¡Bienvenidos a Molinar! Mañana saludaré a todos los viajeros otra vez.', 'Bem-vindos a Molinar! Amanhã cumprimentarei todos os viajantes de novo.', 'Willkommen in Molinar! Morgen werde ich wieder jeden Reisenden begrüßen.',
      '[欢迎|huān yíng] [来到|lái dào] [磨坊镇|Mò fáng zhèn] ！ [明天|míng tiān] [我|wǒ] [会|huì] [再|zài] [欢迎|huān yíng] [每|měi] [一|yī] [个|gè] [旅人|lǚ rén] 。', 'モリナール へ ようこそ ！ [明日|あした] から 、 また [旅|たび] の [人|ひと] に あいさつ します よ 。'),
    // the market day, next week (Lupe's plan)
    'lupe.plan': L('Next week, a market day! Like the old times. But who will bring what?', '¡La semana que viene, día de mercado! Como en los viejos tiempos. Pero ¿quién traerá qué?', 'Na semana que vem, dia de feira! Como nos velhos tempos. Mas quem vai trazer o quê?', 'Nächste Woche ein Markttag! Wie in alten Zeiten. Aber wer wird was mitbringen?',
      '[下个星期|xià ge xīng qī] ， [赶集|gǎn jí] [日|rì] ！ [跟|gēn] [以前|yǐ qián] [一样|yī yàng] 。 [可是|kě shì] [谁|shéi] [会|huì] [带|dài] [什么|shén me] [来|lái] [呢|ne] ？', '[来週|らいしゅう] 、 [市|いち] の [日|ひ] に しましょう ！ [昔|むかし] みたい に 。 でも 、 だれ が [何|なに] を [持|も]って くる でしょう ？'),
    'lupe.planned': L('A market day, next week! I can almost hear it already.', '¡Un día de mercado, la semana que viene! Ya casi lo oigo.', 'Um dia de feira, na semana que vem! Eu já quase escuto.', 'Ein Markttag, nächste Woche! Ich kann ihn schon fast hören.',
      '[下个星期|xià ge xīng qī] [的|de] [赶集|gǎn jí] [日|rì] ！ [我|wǒ] [好像|hǎo xiàng] [已经|yǐ jīng] [听到|tīng dào] [了|le] 。', '[来週|らいしゅう] は [市|いち] の [日|ひ] ！ もう [聞|き]こえて くる みたい です 。'),
    // today: Ciro hears tomorrow's warning; Marga and her cart
    'ciro.heard': L('«If nobody speaks, the mill will stop»… My master always said: oil the gears every week. I’m off to the Great Mill with my oil can, right now.',
      '«Si nadie habla, el molino se parará»… Mi maestro siempre decía: aceita los engranajes cada semana. Ahora mismo voy al Gran Molino con mi aceitera.',
      '«Se ninguém falar, o moinho parará»… O meu mestre sempre dizia: passa óleo nas engrenagens toda semana. Vou agora mesmo pro Grande Moinho com a minha almotolia.',
      '«Wenn niemand spricht, wird die Mühle stehen bleiben» … Mein Meister hat immer gesagt: Öl die Zahnräder jede Woche. Ich gehe sofort mit meiner Ölkanne zur Großen Mühle.',
      '“ [如果|rú guǒ] [没有|méi yǒu] [人|rén] [说话|shuō huà] ， [磨坊|mò fáng] [会|huì] [停|tíng] [下来|xià lai] ” … [我|wǒ] [师傅|shī fu] [总|zǒng] [说|shuō] ： [每|měi] [个|gè] [星期|xīng qī] [给|gěi] [齿轮|chǐ lún] [上|shàng] [油|yóu] 。 [我|wǒ] [现在|xiàn zài] [就|jiù] [带|dài] [油壶|yóu hú] [去|qù] [大磨坊|Dà mò fáng] 。',
      '「 だれ も [話|はな]さない と 、 [風車|ふうしゃ] は [止|と]まる 」 … [先生|せんせい] は いつも [言|い]って いました 。 [歯車|はぐるま] に は [毎週|まいしゅう] [油|あぶら] を させ 、 と 。 [今|いま] すぐ 、 [油|あぶら] さし を [持|も]って [大風車|だいふうしゃ] へ [行|い]きます 。'),
    'ciro.oiled': L('I oiled the Great Mill’s gears this morning. They sound like new. And I’ll do it again next week.',
      'Esta mañana aceité los engranajes del Gran Molino. Suenan como nuevos. Y la semana que viene lo haré otra vez.',
      'Hoje de manhã eu passei óleo nas engrenagens do Grande Moinho. Estão soando como novas. E na semana que vem eu passarei de novo.',
      'Heute Morgen habe ich die Zahnräder der Großen Mühle geölt. Sie klingen wie neu. Und nächste Woche werde ich es wieder tun.',
      '[今天|jīn tiān] [早上|zǎo shang] [我|wǒ] [给|gěi] [大磨坊|Dà mò fáng] [的|de] [齿轮|chǐ lún] [上|shàng] [了|le] [油|yóu] 。 [听|tīng] [起来|qǐ lai] [跟|gēn] [新|xīn] [的|de] [一样|yī yàng] 。 [下个星期|xià ge xīng qī] [我|wǒ] [还|hái] [会|huì] [再|zài] [上|shàng] 。',
      '[今朝|けさ] 、 [大風車|だいふうしゃ] の [歯車|はぐるま] に [油|あぶら] を さしました 。 [新品|しんぴん] みたい な [音|おと] です 。 [来週|らいしゅう] も 、 また さす つもり です 。'),
    'marga.broken': L('My old cart is broken, by the Great Mill. A wheel split in two! It was my grandma Fina’s cart, the first one in Molinar.',
      'Mi vieja carreta está rota, junto al Gran Molino. ¡Una rueda partida en dos! Era la carreta de mi abuela Fina, la primera de Molinar.',
      'A minha carroça velha está quebrada, do lado do Grande Moinho. Uma roda partida no meio! Era a carroça da minha avó, a Dona Zuza, a primeira de Molinar.',
      'Mein alter Karren ist kaputt, bei der Großen Mühle. Ein Rad in zwei Teile gebrochen! Es war der Karren meiner Oma Frieda, der erste in Molinar.',
      '[我|wǒ] [的|de] [旧|jiù] [车|chē] [坏|huài] [了|le] ， [就|jiù] [在|zài] [大磨坊|Dà mò fáng] [旁边|páng biān] 。 [一|yī] [个|gè] [轮子|lún zi] [裂|liè] [成|chéng] [两|liǎng] [半|bàn] ！ [那|nà] [是|shì] [我|wǒ] [奶奶|nǎi nai] [桂花|Guì huā] [的|de] [车|chē] ， [磨坊镇|Mò fáng zhèn] [的|de] [第一|dì yī] [辆|liàng] 。',
      '[古|ふる]い [荷車|にぐるま] が 、 [大風車|だいふうしゃ] の そば で [壊|こわ]れちゃった ん です 。 [車輪|しゃりん] が [真|ま]っ[二|ぷた]つ ！ おばあちゃん の ハナ が [作|つく]った 、 モリナール で [最初|さいしょ] の [荷車|にぐるま] な のに 。'),
    'marga.mended': L('My cart has a new wheel! Grandma always said: «If the cart breaks, look by the Great Mill.» And there it was: a round stone, like a wheel!',
      '¡Mi carreta tiene una rueda nueva! Mi abuela siempre decía: «Si la carreta se rompe, busca junto al Gran Molino.» ¡Y allí estaba: una piedra redonda, como una rueda!',
      'A minha carroça tem uma roda nova! A minha avó sempre dizia: «Se a carroça quebrar, procura do lado do Grande Moinho.» E estava lá: uma pedra redonda, igual a uma roda!',
      'Mein Karren hat ein neues Rad! Oma hat immer gesagt: «Wenn der Karren kaputtgeht, such bei der Großen Mühle.» Und da war er: ein runder Stein, wie ein Rad!',
      '[我|wǒ] [的|de] [车|chē] [有|yǒu] [新|xīn] [轮子|lún zi] [了|le] ！ [奶奶|nǎi nai] [总|zǒng] [说|shuō] ： “ [车|chē] [坏|huài] [了|le] ， [就|jiù] [去|qù] [大磨坊|Dà mò fáng] [旁边|páng biān] [找|zhǎo] 。 ” [那里|nà lǐ] [真|zhēn] [有|yǒu] [一|yī] [块|kuài] [圆|yuán] [石头|shí tou] ， [跟|gēn] [轮子|lún zi] [一样|yī yàng] ！',
      '[荷車|にぐるま] に [新|あたら]しい [車輪|しゃりん] が つきました ！ おばあちゃん は いつも [言|い]って いました 。 「 [荷車|にぐるま] が [壊|こわ]れたら 、 [大風車|だいふうしゃ] の そば を [探|さが]しなさい 」 って 。 ほんとう に ありました 。 [車輪|しゃりん] みたい な 、 [丸|まる]い [石|いし] が ！'),
    // ---------------------------------------------------------- tomorrow's town, in turn (Trigo's after you've met; the others' once
    // they're awake; {w.ml_*}: Molinar's own words, met as they're said, mixed in by the weave)
    'trigo.t1': L('Every {w.ml_dawn} I check the {w.ml_wind}. Not a breath… but tomorrow, who knows?',
      'Cada amanecer miro el viento. Ni un soplo… pero mañana, ¿quién sabe?',
      'Todo amanhecer eu olho o vento. Nem um sopro… mas amanhã, quem sabe?',
      'Bei jedem Tagesanbruch prüfe ich den Wind. Kein Hauch … aber morgen, wer weiß?',
      '[每天|měi tiān] [黎明|lí míng] [我|wǒ] [都|dōu] [看|kàn] [风|fēng] 。 [一|yī] [点|diǎn] [风|fēng] [也|yě] [没有|méi yǒu] … [可是|kě shì] [明天|míng tiān] [谁|shéi] [知道|zhī dào] [呢|ne] ？',
      '[毎朝|まいあさ] 、 [夜明|よあ]け に [風|かぜ] を たしかめる ん だ 。 そよ と も [吹|ふ]かない … でも 、 [明日|あした] は どう かな ？'),
    'trigo.t2': L('A {w.ml_cloud} of gray {w.ml_flour} every time a door opens. I’ve stopped counting my sneezes.',
      'Una nube de harina gris cada vez que se abre una puerta. Ya no cuento mis estornudos.',
      'Uma nuvem de farinha cinza toda vez que uma porta abre. Já parei de contar os meus espirros.',
      'Eine Wolke aus grauem Mehl, jedes Mal, wenn eine Tür aufgeht. Ich zähle mein Niesen nicht mehr.',
      '[每次|měi cì] [开|kāi] [门|mén] ， [都|dōu] [扬|yáng] [起|qǐ] [一|yī] [团|tuán] [灰|huī] [面粉|miàn fěn] [的|de] [云|yún] 。 [我|wǒ] [打|dǎ] [的|de] [喷嚏|pēn tì] [早就|zǎo jiù] [数|shǔ] [不|bù] [清|qīng] [了|le] 。',
      'ドア が [開|あ]く たび に 、 [灰色|はいいろ] の [小麦粉|こむぎこ] の [雲|くも] 。 くしゃみ は もう [数|かぞ]えて ない よ 。'),
    'trigo.t3': L('Grandpa’s {w.ml_millstone} is still up there. Tomorrow it will grind again. A {w.ml_promise} is a promise.',
      'La piedra de molino del abuelo sigue allá arriba. Mañana volverá a moler. Una promesa es una promesa.',
      'A mó do vovô continua lá em cima. Amanhã ela vai moer de novo. Promessa é promessa.',
      'Opas Mühlstein ist immer noch da oben. Morgen wird er wieder mahlen. Ein Versprechen ist ein Versprechen.',
      '[爷爷|yé ye] [的|de] [磨盘|mò pán] [还|hái] [在|zài] [上面|shàng miàn] 。 [明天|míng tiān] [它|tā] [会|huì] [再|zài] [磨|mó] 。 [承诺|chéng nuò] [就|jiù] [是|shì] [承诺|chéng nuò] 。',
      'おじいちゃん の [石臼|いしうす] は 、 まだ [上|うえ] に ある 。 [明日|あした] 、 また [挽|ひ]く よ 。 [約束|やくそく] は [約束|やくそく] だ 。'),
    'trigo.t4': L('I tell the mill about the {w.ml_future} every day. It never answers. But it’s {w.ml_silent}, not deaf.',
      'Todos los días le hablo al molino del futuro. Nunca contesta. Pero está silencioso, no sordo.',
      'Todo dia eu falo do futuro pro moinho. Ele nunca responde. Mas ele está silencioso, não surdo.',
      'Jeden Tag erzähle ich der Mühle von der Zukunft. Sie antwortet nie. Aber sie ist stumm, nicht taub.',
      '[我|wǒ] [每天|měi tiān] [跟|gēn] [磨坊|mò fáng] [讲|jiǎng] [未来|wèi lái] 。 [它|tā] [从来|cóng lái] [不|bù] [回答|huí dá] 。 [可是|kě shì] [它|tā] [只是|zhǐ shì] [沉默|chén mò] ， [不|bù] [是|shì] [聋|lóng] 。',
      '[毎日|まいにち] 、 [風車|ふうしゃ] に [未来|みらい] の [話|はなし] を する 。 [返事|へんじ] は ない 。 でも 、 [静|しず]か な だけ で 、 ちゃんと [聞|き]いて る と [思|おも]う 。'),
    'marga.m1': L('Next {w.ml_summer}, the biggest {w.ml_harvest} in years. My old cart will carry it all.',
      'El verano que viene, la cosecha más grande en años. Mi vieja carreta lo llevará todo.',
      'No verão que vem, a maior colheita em anos. A minha carroça velha levará tudo.',
      'Nächsten Sommer die größte Ernte seit Jahren. Mein alter Karren wird alles tragen.',
      '[明年|míng nián] [夏天|xià tiān] ， [会|huì] [是|shì] [这|zhè] [些|xiē] [年|nián] [最|zuì] [好|hǎo] [的|de] [收成|shōu cheng] 。 [我|wǒ] [的|de] [老|lǎo] [车|chē] [会|huì] [把|bǎ] [它|tā] [全|quán] [运|yùn] [走|zǒu] 。',
      '[来年|らいねん] の [夏|なつ] は 、 [何年|なんねん] ぶり か の [大|だい] [収穫|しゅうかく] に なる でしょう 。 わたし の [古|ふる]い [荷車|にぐるま] で 、 ぜんぶ [運|はこ]びます よ 。'),
    'marga.m2': L('The fields need {w.ml_seeds}. I have a sack of them, and a {w.ml_wateringcan} with {w.ml_only} one hole.',
      'Los campos necesitan semillas. Tengo un saco, y una regadera con un solo agujero.',
      'Os campos precisam de sementes. Eu tenho um saco, e um regador com um furo só.',
      'Die Felder brauchen Samen. Ich habe einen Sack voll und eine Gießkanne mit nur einem Loch.',
      '[田|tián] [里|lǐ] [需要|xū yào] [种子|zhǒng zi] 。 [我|wǒ] [有|yǒu] [一|yī] [袋|dài] ， [还有|hái yǒu] [一个|yī gè] [只|zhǐ] [漏|lòu] [一个|yī gè] [洞|dòng] [的|de] [喷壶|pēn hú] 。',
      '[畑|はたけ] に は [種|たね] が いります 。 [一袋|ひとふくろ] あります 。 それ と 、 [穴|あな] が [一|ひと]つ だけ の じょうろ も 。'),
    'marga.m3': L('Look at my {w.ml_wrinkles}! Forty years of sun, wind and flour dust.',
      '¡Mira mis arrugas! Cuarenta años de sol, viento y polvo de harina.',
      'Olha as minhas rugas! Quarenta anos de sol, vento e pó de farinha.',
      'Schau dir meine Falten an! Vierzig Jahre Sonne, Wind und Mehlstaub.',
      '[看|kàn] [我|wǒ] [的|de] [皱纹|zhòu wén] ！ [四十|sì shí] [年|nián] [的|de] [太阳|tài yang] 、 [风|fēng] [和|hé] [面粉|miàn fěn] [灰|huī] 。',
      'この しわ を [見|み]て ！ [四十年|よんじゅうねん] 、 [日|ひ] と [風|かぜ] と [粉|こな] ぼこり の おかげ です よ 。'),
    'tomas.t1': L('My stall is {w.ml_closed}, but not for long. Look: the {w.ml_broom} is ready.',
      'Mi puesto está cerrado, pero no por mucho tiempo. Mira: la escoba está lista.',
      'A minha barraca está fechada, mas não por muito tempo. Olha: a vassoura está pronta.',
      'Mein Stand ist geschlossen, aber nicht mehr lange. Schau: Der Besen steht bereit.',
      '[我|wǒ] [的|de] [摊子|tān zi] [关门|guān mén] [了|le] ， [不过|bù guò] [不会|bù huì] [太|tài] [久|jiǔ] 。 [你|nǐ] [看|kàn] ： [扫帚|sào zhou] [准备|zhǔn bèi] [好|hǎo] [了|le] 。',
      'うち の [屋台|やたい] は [閉店|へいてん] して います が 、 すぐ に [開|あ]けます よ 。 ほら 、 ほうき も [用意|ようい] して あります 。'),
    'tomas.t2': L('Fresh bread for every {w.ml_traveler}, and for every {w.ml_neighbor} too. Like before.',
      'Pan fresco para cada viajero, y para cada vecino también. Como antes.',
      'Pão fresco pra cada viajante, e pra cada vizinho também. Como antes.',
      'Frisches Brot für jeden Reisenden und für jeden Nachbarn auch. Wie früher.',
      '[给|gěi] [每|měi] [个|gè] [旅人|lǚ rén] [新鲜|xīn xiān] [的|de] [面包|miàn bāo] ， [也|yě] [给|gěi] [每|měi] [个|gè] [邻居|lín jū] 。 [跟|gēn] [以前|yǐ qián] [一样|yī yàng] 。',
      '[旅|たび] の [人|ひと] に も 、 [近所|きんじょ] の [人|ひと] に も 、 [焼|や]きたて の パン を 。 [昔|むかし] みたい に ね 。'),
    'tomas.t3': L('Pass me a {w.ml_handkerchief}… this gray flour gets into everything.',
      'Pásame un pañuelo… esta harina gris se mete en todo.',
      'Me passa um lenço… essa farinha cinza entra em tudo.',
      'Gib mir mal ein Taschentuch … dieses graue Mehl kommt überall rein.',
      '[给|gěi] [我|wǒ] [一|yī] [块|kuài] [手帕|shǒu pà] … [这|zhè] [灰|huī] [面粉|miàn fěn] [什么|shén me] [地方|dì fang] [都|dōu] [钻|zuān] 。',
      'ハンカチ を [取|と]って ください … この [灰色|はいいろ] の [粉|こな] 、 どこ に でも [入|はい]る ん です 。'),
    'lupe.l1': L('{w.ml_fruit}, as {w.ml_sweet} as honey! Well… it will be, next {w.ml_summer}.',
      '¡Fruta, dulce como la miel! Bueno… lo será, el verano que viene.',
      'Fruta, doce que nem mel! Bom… vai ser, no verão que vem.',
      'Obst, so süß wie Honig! Na ja … das wird es sein, nächsten Sommer.',
      '[水果|shuǐ guǒ] ， [像|xiàng] [蜂蜜|fēng mì] [一样|yī yàng] [甜|tián] ！ [好|hǎo] [吧|ba] … [明年|míng nián] [夏天|xià tiān] [会|huì] [是|shì] [的|de] 。',
      'くだもの 、 はちみつ みたい に [甘|あま]い ！ … まあ 、 [来年|らいねん] の [夏|なつ] に は ね 。'),
    'lupe.l2': L('My {w.ml_flowerpot} by the door… everything in it dried up. I’ll plant new flowers.',
      'Mi maceta junto a la puerta… todo se secó. Plantaré flores nuevas.',
      'O meu vaso de flor do lado da porta… secou tudo. Vou plantar flores novas.',
      'Mein Blumentopf an der Tür … alles ist vertrocknet. Ich werde neue Blumen pflanzen.',
      '[门口|mén kǒu] [的|de] [花盆|huā pén] … [里面|lǐ miàn] [的|de] [花|huā] [全|quán] [干|gān] [死|sǐ] [了|le] 。 [我|wǒ] [会|huì] [种|zhòng] [新|xīn] [的|de] [花|huā] 。',
      'ドア の そば の [植木鉢|うえきばち] … ぜんぶ [枯|か]れて しまいました 。 [新|あたら]しい [花|はな] を [植|う]える つもり です 。'),
    'lupe.l3': L('A {w.ml_marketday} needs music, and a {w.ml_flag} on every stall.',
      'Un día de mercado necesita música, y una bandera en cada puesto.',
      'Um dia de feira precisa de música, e uma bandeira em cada barraca.',
      'Ein Markttag braucht Musik und eine Fahne an jedem Stand.',
      '[赶集日|gǎn jí rì] [要|yào] [有|yǒu] [音乐|yīn yuè] ， [每|měi] [个|gè] [摊子|tān zi] [上|shàng] [都|dōu] [要|yào] [有|yǒu] [旗子|qí zi] 。',
      '[市|いち] の [日|ひ] に は 、 [音楽|おんがく] と 、 どの [屋台|やたい] に も [旗|はた] が いります ね 。'),
    'ciro.c1': L('My {w.ml_cane} and I walk slowly now. But my ears {w.ml_still} hear every clock in the valley.',
      'Mi bastón y yo caminamos despacio ahora. Pero mis oídos todavía oyen cada reloj del valle.',
      'Eu e a minha bengala andamos devagar agora. Mas os meus ouvidos ainda escutam cada relógio do vale.',
      'Mein Stock und ich gehen jetzt langsam. Aber meine Ohren hören noch jede Uhr im Tal.',
      '[我|wǒ] [和|hé] [我|wǒ] [的|de] [拐杖|guǎi zhàng] [现在|xiàn zài] [走|zǒu] [得|de] [很|hěn] [慢|màn] 。 [可是|kě shì] [我|wǒ] [的|de] [耳朵|ěr duo] [还|hái] [听得见|tīng de jiàn] [山谷|shān gǔ] [里|lǐ] [每|měi] [一|yī] [个|gè] [钟|zhōng] 。',
      '[杖|つえ] と いっしょ に 、 ゆっくり [歩|ある]く よう に なりました 。 でも 、 [耳|みみ] は まだ [谷|たに] じゅう の [時計|とけい] を [聞|き]いて います 。'),
    'ciro.c2': L('{w.ml_grayhair}, glasses, a cane… but I keep every {w.ml_memory}. Every one.',
      'Canas, anteojos, un bastón… pero guardo cada recuerdo. Cada uno.',
      'Cabelos brancos, óculos, uma bengala… mas eu guardo cada lembrança. Cada uma.',
      'Graue Haare, eine Brille, ein Stock … aber ich bewahre jede Erinnerung. Jede einzelne.',
      '[白发|bái fà] 、 [眼镜|yǎn jìng] 、 [拐杖|guǎi zhàng] … [可是|kě shì] [每|měi] [一|yī] [个|gè] [回忆|huí yì] [我|wǒ] [都|dōu] [留|liú] [着|zhe] 。 [每|měi] [一|yī] [个|gè] 。',
      '[白髪|しらが] 、 めがね 、 [杖|つえ] … でも 、 [思|おも]い[出|で] は ぜんぶ [取|と]って あります 。 ひとつ [残|のこ]らず 。'),
    'ciro.c3': L('My master’s {w.ml_sundial} still stands by the shop. Only the sun remembers how to read it.',
      'El reloj de sol de mi maestro sigue junto a la tienda. Solo el sol recuerda cómo leerlo.',
      'O relógio de sol do meu mestre continua do lado da loja. Só o sol lembra como ler.',
      'Die Sonnenuhr meines Meisters steht immer noch beim Laden. Nur die Sonne weiß noch, wie man sie liest.',
      '[我|wǒ] [师傅|shī fu] [的|de] [日晷|rì guǐ] [还|hái] [在|zài] [店|diàn] [旁边|páng biān] 。 [只有|zhǐ yǒu] [太阳|tài yang] [还|hái] [记得|jì de] [怎么|zěn me] [看|kàn] [它|tā] 。',
      '[先生|せんせい] の [日時計|ひどけい] は 、 まだ [店|みせ] の そば に あります 。 [読|よ]み[方|かた] を [覚|おぼ]えて いる の は 、 お[日|ひ]さま だけ です 。'),
    'dani.d1': L('I drew the whole town in {w.ml_chalk}, the way it’ll look. With flags. Lots of flags.',
      'Dibujé todo el pueblo con tiza, como se verá. Con banderas. Muchas banderas.',
      'Eu desenhei a cidade inteira com giz, do jeito que ela vai ficar. Com bandeiras. Muitas bandeiras.',
      'Ich habe die ganze Stadt mit Kreide gemalt, so wie sie aussehen wird. Mit Fahnen. Vielen Fahnen.',
      '[我|wǒ] [用|yòng] [粉笔|fěn bǐ] [画|huà] [了|le] [整个|zhěng gè] [镇子|zhèn zi] [以后|yǐ hòu] [的|de] [样子|yàng zi] 。 [有|yǒu] [旗子|qí zi] ， [好多|hǎo duō] [旗子|qí zi] 。',
      'チョーク で 、 [町|まち] の これ から の [姿|すがた] を [描|か]いた ん だ 。 [旗|はた] も 。 [旗|はた] が いっぱい 。'),
    'dani.d2': L('My {w.ml_pinwheel} needs {w.ml_wind}… or {mimo}’s big cheeks!',
      'Mi molinillo necesita viento… ¡o los cachetes de {mimo}!',
      'O meu cata-vento precisa de vento… ou das bochechas do {mimo}!',
      'Mein Windrad braucht Wind … oder {mimo}s dicke Backen!',
      '[我|wǒ] [的|de] [风车|fēng chē] [需要|xū yào] [风|fēng] … [或者|huò zhě] {mimo} [鼓|gǔ] [起|qǐ] [来|lái] [的|de] [腮帮子|sāi bāng zi] ！',
      'ぼく の [風車|かざぐるま] に は [風|かぜ] が いる … それ か 、 {mimo} の ほっぺ ！'),
    'dani.d3': L('Next year the town {w.ml_gate} will be {w.ml_colorful}. Every color I can find!',
      'El año que viene, el portón del pueblo será colorido. ¡Con todos los colores que encuentre!',
      'No ano que vem, o portão da cidade vai ser colorido. Com todas as cores que eu achar!',
      'Nächstes Jahr wird das Stadttor bunt sein. In allen Farben, die ich finde!',
      '[明年|míng nián] [镇子|zhèn zi] [的|de] [大门|dà mén] [会|huì] [变成|biàn chéng] [彩色|cǎi sè] [的|de] 。 [我|wǒ] [找到|zhǎo dào] [什么|shén me] [颜色|yán sè] [就|jiù] [用|yòng] [什么|shén me] [颜色|yán sè] ！',
      '[来年|らいねん] 、 [町|まち] の [門|もん] は カラフル に なる よ 。 [見|み]つけた [色|いろ] 、 ぜんぶ [使|つか]う ん だ ！'),
    'felix.f1': L('{w.ml_welcome}! I said it to every {w.ml_traveler} for forty years. Then the gray came.',
      '¡Bienvenidos! Se lo dije a cada viajero durante cuarenta años. Luego vino lo gris.',
      'Bem-vindos! Eu disse isso pra cada viajante durante quarenta anos. Aí veio o cinza.',
      'Willkommen! Das habe ich vierzig Jahre lang jedem Reisenden gesagt. Dann kam das Grau.',
      '[欢迎|huān yíng] ！ [四十|sì shí] [年|nián] [来|lái] [我|wǒ] [对|duì] [每|měi] [个|gè] [旅人|lǚ rén] [都|dōu] [这么|zhè me] [说|shuō] 。 [后来|hòu lái] [灰色|huī sè] [来|lái] [了|le] 。',
      'ようこそ ！ [四十年|よんじゅうねん] 、 [旅|たび] の [人|ひと] みんな に そう [言|い]って きました 。 それ から 、 [灰色|はいいろ] が [来|き]た ん です 。'),
    'felix.f2': L('This {w.ml_gate} has seen a lot. Lately, only gray ones. Tomorrow, everyone again.',
      'Este portón ha visto mucho. Últimamente, solo gente gris. Mañana, a todos otra vez.',
      'Este portão já viu muita coisa. Ultimamente, só gente cinza. Amanhã, todo mundo de novo.',
      'Dieses Tor hat viel gesehen. In letzter Zeit nur Graue. Morgen wieder alle.',
      '[这|zhè] [座|zuò] [大门|dà mén] [见过|jiàn guo] [很多|hěn duō] 。 [最近|zuì jìn] [只有|zhǐ yǒu] [灰色|huī sè] [的|de] [人|rén] 。 [明天|míng tiān] ， [大家|dà jiā] [都|dōu] [会|huì] [再|zài] [来|lái] 。',
      'この [門|もん] は 、 いろいろ [見|み]て きました 。 [最近|さいきん] は [灰色|はいいろ] の [人|ひと] だけ 。 [明日|あした] は 、 また みんな が [来|く]る でしょう 。'),
  };
  // ------------------------------------------------------------ the demonstrations (whole in the language, the shown words glossed)
  const DEMO = {
    'trigo.demo1': L('Tomorrow I’ll grind the wheat, and you’ll turn the sails.', 'Mañana yo moleré el trigo, y tú girarás las aspas.', 'Amanhã eu moerei o trigo, e você girará as pás.', 'Morgen werde ich das Korn mahlen, und du wirst die Flügel drehen.',
      '[明天|míng tiān] [我|wǒ] [会|huì] [磨|mó] [麦子|mài zi] ， [你|nǐ] [会|huì] [转|zhuàn] [风帆|fēng fān] 。', '[明日|あした] 、 ぼく は [麦|むぎ] を [挽|ひ]く つもり 。 きみ は [羽根|はね] を [回|まわ]します 。'),
    'trigo.demo2': L('Marga will carry the sacks, the children will play… and next week, we’ll all sing!', 'Marga llevará los sacos, los niños jugarán… ¡y la semana que viene cantaremos todos!', 'A Marga levará os sacos, as crianças brincarão… e na semana que vem, todos nós cantaremos!', 'Marga wird die Säcke tragen, die Kinder werden spielen … und nächste Woche werden wir alle singen!',
      '[玛尔加|Mǎ ěr jiā] [会|huì] [搬|bān] [袋子|dài zi] ， [孩子|hái zi] [们|men] [要|yào] [玩|wán] … [下个星期|xià ge xīng qī] [我们|wǒ men] [都|dōu] [会|huì] [唱歌|chàng gē] ！', 'マルガ さん は [袋|ふくろ] を [運|はこ]びます 。 [子|こ]ども たち は [遊|あそ]ぶ でしょう 。 [来週|らいしゅう] は 、 みんな で [歌|うた]う つもり ！'),
    'warn': L('If nobody speaks, the mill will stop.', 'Si nadie habla, el molino se parará.', 'Se ninguém falar, o moinho parará.', 'Wenn niemand spricht, wird die Mühle stehen bleiben.',
      '[如果|rú guǒ] [没有|méi yǒu] [人|rén] [说话|shuō huà] ， [磨坊|mò fáng] [会|huì] [停|tíng] [下来|xià lai] 。', 'だれ も [話|はな]さない と 、 [風車|ふうしゃ] は [止|と]まる でしょう 。'),
    'room1': L('In here nothing moves now… but plans still work. Say what {mimo} will do, then work the bellows: the plan happens!', 'Aquí dentro nada se mueve ahora… pero los planes sí funcionan. Di lo que hará {mimo} y luego sopla con el fuelle: ¡el plan se cumplirá!', 'Aqui dentro nada se mexe agora… mas os planos funcionam. Diz o que o {mimo} fará, e depois aperta o fole: o plano acontecerá!', 'Hier drin bewegt sich jetzt nichts … aber Pläne funktionieren. Sag, was {mimo} tun wird, dann drück den Blasebalg: Der Plan wird passieren!',
      '[这里|zhè lǐ] [现在|xiàn zài] [什么|shén me] [都|dōu] [不|bù] [动|dòng] … [可是|kě shì] [计划|jì huà] [有用|yǒu yòng] 。 [说|shuō] {mimo} [会|huì] [做|zuò] [什么|shén me] ， [再|zài] [拉|lā] [风箱|fēng xiāng] ： [计划|jì huà] [就|jiù] [会|huì] [实现|shí xiàn] ！', 'ここ で は [今|いま] 、 [何|なに] も [動|うご]かない … でも 、 [予定|よてい] は [動|うご]く 。 {mimo} が する こと を [言|い]って 、 ふいご を [押|お]して ！ [予定|よてい] どおり に なる よ ！'),
  };
  // Trigo's voice through the speaking tube, inside the silent mill (demonstrations: the form is shown before the seal asks for it)
  Object.assign(DEMO, {
    'tube.seal': L('The seal wants to know who will go up first. Tell it: «I will go up!»', 'El sello quiere saber quién subirá primero. Dile: «¡Yo subiré!»', 'O selo quer saber quem subirá primeiro. Diz pra ele: «Eu subirei!»', 'Das Siegel will wissen, wer zuerst hochsteigen wird. Sag ihm: «Ich werde hochsteigen!»',
      '[封印|fēng yìn] [想|xiǎng] [知道|zhī dào] [谁|shéi] [会|huì] [先|xiān] [上去|shàng qu] 。 [告诉|gào su] [它|tā] ： “ [我|wǒ] [会|huì] [上去|shàng qu] ！ ”', '[封|ふう] は 、 だれ が [先|さき] に [上|のぼ]る か [知|し]りたい ん だ 。 [言|い]って あげて ： 「 わたし が [上|のぼ]ります ！ 」'),
    'tube.oil': L('Rusted solid! Grandpa says gears need a promise of oil. Tell them: «Tomorrow we’ll oil the gears!»', '¡Oxidados del todo! Mi abuelo dice que los engranajes necesitan una promesa de aceite. Diles: «¡Mañana aceitaremos los engranajes!»', 'Enferrujadas de vez! Meu avô diz que engrenagem precisa de uma promessa de óleo. Diz: «Amanhã passaremos óleo nas engrenagens!»', 'Völlig verrostet! Opa sagt, Zahnräder brauchen ein Versprechen von Öl. Sag ihnen: «Morgen werden wir die Zahnräder ölen!»',
      '[全|quán] [锈|xiù] [住|zhù] [了|le] ！ [爷爷|yé ye] [说|shuō] [齿轮|chǐ lún] [需要|xū yào] [一个|yī gè] [上|shàng] [油|yóu] [的|de] [承诺|chéng nuò] 。 [告诉|gào su] [它们|tā men] ： “ [明天|míng tiān] [我们|wǒ men] [会|huì] [给|gěi] [齿轮|chǐ lún] [上|shàng] [油|yóu] ！ ”', 'すっかり さびて る ！ おじいちゃん が [言|い]う に は 、 [歯車|はぐるま] に は [油|あぶら] の [約束|やくそく] が いる ん だ って 。 [言|い]って あげて ： 「 [明日|あした] 、 [歯車|はぐるま] に [油|あぶら] を さす つもり です ！ 」'),
    'tube.turn': L('The canvas is down! Now tell the sails what the mills will do. «The mills will turn!»', '¡La lona cayó! Ahora diles a las aspas lo que harán los molinos. «¡Los molinos girarán!»', 'A lona caiu! Agora diz pras pás o que os moinhos farão. «Os moinhos girarão!»', 'Die Plane ist unten! Jetzt sag den Flügeln, was die Mühlen tun werden. «Die Mühlen werden sich drehen!»',
      '[帆布|fān bù] [掉|diào] [下来|xià lai] [了|le] ！ [现在|xiàn zài] [告诉|gào su] [风帆|fēng fān] [风车|fēng chē] [会|huì] [怎么样|zěn me yàng] 。 “ [风车|fēng chē] [会|huì] [转|zhuàn] [起来|qǐ lai] ！ ”', 'ぬの が [落|お]ちた ！ [今度|こんど] は [羽根|はね] に 、 [風車|ふうしゃ] が どう なる か [言|い]って 。 「 [風車|ふうしゃ] は また [回|まわ]る でしょう ！ 」'),
    'tube.oiled': L('The gears… they shine! Somebody oiled them a long time ago. They’ll turn!', '¡Los engranajes… brillan! Alguien los aceitó hace mucho tiempo. ¡Girarán!', 'As engrenagens… brilham! Alguém passou óleo nelas faz muito tempo. Elas girarão!', 'Die Zahnräder … sie glänzen! Jemand hat sie vor langer Zeit geölt. Sie werden sich drehen!',
      '[齿轮|chǐ lún] … [在|zài] [发光|fā guāng] ！ [很久|hěn jiǔ] [以前|yǐ qián] [有人|yǒu rén] [给|gěi] [它们|tā men] [上|shàng] [过|guo] [油|yóu] 。 [它们|tā men] [会|huì] [转|zhuàn] [的|de] ！', '[歯車|はぐるま] が … [光|ひか]って る ！ ずっと [前|まえ] に 、 だれ か が [油|あぶら] を さして くれた ん だ 。 [回|まわ]る よ ！'),
  });
  // tomorrow's town shows its own words in use: plans, in every person (each once, in that person's turn)
  Object.assign(DEMO, {
    'trigo.demo3': L('Tomorrow the sails will creak a little, then they’ll turn. And we’ll rebuild the whole town.',
      'Mañana las aspas crujirán un poco, y luego girarán. Y nosotros reconstruiremos todo el pueblo.',
      'Amanhã as pás rangerão um pouco, e depois girarão. E nós reconstruiremos a cidade inteira.',
      'Morgen werden die Flügel ein bisschen knarren, und dann werden sie sich drehen. Und wir werden die ganze Stadt wieder aufbauen.',
      '[明天|míng tiān] [风帆|fēng fān] [会|huì] [先|xiān] [嘎吱|gā zhī] [响|xiǎng] [几|jǐ] [声|shēng] ， [然后|rán hòu] [转|zhuàn] [起来|qǐ lai] 。 [我们|wǒ men] [会|huì] [重建|chóng jiàn] [整个|zhěng gè] [镇子|zhèn zi] 。',
      '[明日|あした] 、 [羽根|はね] は [少|すこ]し きしむ でしょう 。 それ から [回|まわ]る よ 。 ぼく たち は 、 [町|まち] を ぜんぶ [建|た]て[直|なお]す つもり だ 。'),
    'trigo.demo4': L('Soon the whole town will speak again! Nobody will cough or sneeze: we’ll sweep away the gray flour that covers the square.',
      '¡Pronto todo el pueblo hablará otra vez! Nadie toserá ni estornudará: barreremos la harina gris que cubre la plaza.',
      'Logo a cidade inteira falará de novo! Ninguém tossirá nem espirrará: varreremos a farinha cinza que cobre a praça.',
      'Bald wird die ganze Stadt wieder sprechen! Niemand wird husten oder niesen: Wir werden das graue Mehl wegfegen, das den Platz bedeckt.',
      '[很快|hěn kuài] [整个|zhěng gè] [镇子|zhèn zi] [会|huì] [再|zài] [说话|shuō huà] ！ [没有|méi yǒu] [人|rén] [会|huì] [咳嗽|ké sou] [或|huò] [打喷嚏|dǎ pēn tì] ： [我们|wǒ men] [会|huì] [扫|sǎo] [掉|diào] [盖住|gài zhù] [广场|guǎng chǎng] [的|de] [灰|huī] [面粉|miàn fěn] 。',
      'もう すぐ 、 [町|まち] の みんな が また [話|はな]す ！ もう だれ も せき を しない し 、 くしゃみ も しない 。 [広場|ひろば] を [覆|おお]う [灰色|はいいろ] の [粉|こな] を 、 [掃|は]いて しまう ん だ 。'),
    'marga.demo': L('Next month we’ll sow the wheat, and in summer we’ll harvest it together.',
      'El mes que viene sembraremos el trigo, y en verano lo cosecharemos juntos.',
      'No mês que vem semearemos o trigo, e no verão colheremos juntos.',
      'Nächsten Monat werden wir den Weizen säen, und im Sommer werden wir ihn zusammen ernten.',
      '[下|xià] [个|gè] [月|yuè] [我们|wǒ men] [会|huì] [播种|bō zhǒng] [麦子|mài zi] ， [夏天|xià tiān] [我们|wǒ men] [会|huì] [一起|yī qǐ] [收割|shōu gē] 。',
      '[来月|らいげつ] は [麦|むぎ] の [種|たね] を まく つもり です 。 [夏|なつ] に は 、 いっしょ に [収穫|しゅうかく] する でしょう 。'),
    'tomas.demo': L('Tomorrow I’ll sweep the stall, I’ll open early, and I’ll bake. And you’ll buy the first loaf!',
      'Mañana barreré el puesto, abriré temprano y hornearé. ¡Y tú comprarás el primer pan!',
      'Amanhã eu varrerei a barraca, abrirei cedo e assarei pão. E você comprará o primeiro!',
      'Morgen werde ich den Stand fegen, früh aufmachen und backen. Und du wirst das erste Brot kaufen!',
      '[明天|míng tiān] [我|wǒ] [会|huì] [扫|sǎo] [摊子|tān zi] ， [早|zǎo] [早|zǎo] [开|kāi] [门|mén] ， [还|hái] [会|huì] [烤|kǎo] [面包|miàn bāo] 。 [你|nǐ] [会|huì] [买|mǎi] [第一|dì yī] [个|gè] ！',
      '[明日|あした] 、 [屋台|やたい] を [掃|は]いて 、 [早|はや]く [開|あ]けて 、 パン を [焼|や]きます 。 [最初|さいしょ] の パン は 、 あなた が [買|か]う でしょう ！'),
    'lupe.demo': L('Next week we’ll decorate the square, we’ll plant flowers, and we’ll invite the whole valley!',
      '¡La semana que viene adornaremos la plaza, plantaremos flores e invitaremos a todo el valle!',
      'Na semana que vem enfeitaremos a praça, plantaremos flores e convidaremos o vale inteiro!',
      'Nächste Woche werden wir den Platz schmücken, Blumen pflanzen und das ganze Tal einladen!',
      '[下个星期|xià ge xīng qī] [我们|wǒ men] [会|huì] [装饰|zhuāng shì] [广场|guǎng chǎng] ， [种|zhòng] [花|huā] ， [还|hái] [会|huì] [邀请|yāo qǐng] [整个|zhěng gè] [山谷|shān gǔ] [的|de] [人|rén] ！',
      '[来週|らいしゅう] は [広場|ひろば] を [飾|かざ]って 、 [花|はな] を [植|う]えて 、 [谷|たに] じゅう の [人|ひと] を [招待|しょうたい] する つもり です ！'),
    'ciro.demo': L('Tomorrow I’ll fix the big clock, and next week it will chime. Nobody will forget the hour again.',
      'Mañana arreglaré el reloj grande, y la semana que viene sonará. Nadie olvidará la hora otra vez.',
      'Amanhã eu consertarei o relógio grande, e na semana que vem ele tocará. Ninguém esquecerá a hora de novo.',
      'Morgen werde ich die große Uhr reparieren, und nächste Woche wird sie schlagen. Niemand wird die Stunde mehr vergessen.',
      '[明天|míng tiān] [我|wǒ] [会|huì] [修|xiū] [好|hǎo] [大|dà] [钟|zhōng] ， [下个星期|xià ge xīng qī] [它|tā] [会|huì] [响|xiǎng] 。 [再|zài] [也|yě] [没有|méi yǒu] [人|rén] [会|huì] [忘记|wàng jì] [时间|shí jiān] 。',
      '[明日|あした] 、 [大|おお]きな [時計|とけい] を [直|なお]す つもり です 。 [来週|らいしゅう] に は [鳴|な]る でしょう 。 もう だれ も [時間|じかん] を [忘|わす]れない でしょう 。'),
    'dani.demo': L('Next year my friends and I will paint the gate, and we’ll celebrate with music all night!',
      '¡El año que viene mis amigos y yo pintaremos el portón, y celebraremos con música toda la noche!',
      'No ano que vem eu e os meus amigos pintaremos o portão, e comemoraremos com música a noite toda!',
      'Nächstes Jahr werden meine Freunde und ich das Tor streichen, und wir werden die ganze Nacht mit Musik feiern!',
      '[明年|míng nián] [我|wǒ] [和|hé] [朋友|péng you] [们|men] [会|huì] [把|bǎ] [大门|dà mén] [涂|tú] [成|chéng] [彩色|cǎi sè] ， [还|hái] [会|huì] [放|fàng] [着|zhe] [音乐|yīn yuè] [庆祝|qìng zhù] [一|yī] [整|zhěng] [夜|yè] ！',
      '[来年|らいねん] 、 [友|とも]だち と [門|もん] を [塗|ぬ]る つもり 。 それ から 、 [一晩中|ひとばんじゅう] [音楽|おんがく] で [祝|いわ]う ん だ ！'),
    'felix.demo': L('Tomorrow I’ll greet the travelers, and they’ll visit the market. They’ll share our bread!',
      'Mañana saludaré a los viajeros, y ellos visitarán el mercado. ¡Compartirán nuestro pan!',
      'Amanhã eu cumprimentarei os viajantes, e eles visitarão o mercado. Dividirão o nosso pão!',
      'Morgen werde ich die Reisenden begrüßen, und sie werden den Markt besuchen. Sie werden unser Brot teilen!',
      '[明天|míng tiān] [我|wǒ] [会|huì] [跟|gēn] [旅人|lǚ rén] [们|men] [打招呼|dǎ zhāo hu] ， [他们|tā men] [会|huì] [参观|cān guān] [市场|shì chǎng] 。 [他们|tā men] [会|huì] [跟|gēn] [我们|wǒ men] [分享|fēn xiǎng] [面包|miàn bāo] ！',
      '[明日|あした] 、 [旅|たび] の [人|ひと] たち に あいさつ する つもり です 。 [市場|いちば] を [訪|たず]ねて 、 パン を [分|わ]け[合|あ]う でしょう ！'),
  });
  const MARKS = {
    'tube.seal': { es: [['subirá', 'will go up'], ['Yo subiré', 'I’ll go up']], pt: [['subirá', 'will go up'], ['Eu subirei', 'I’ll go up']], de: [['hochsteigen wird', 'will climb up'], ['Ich werde', 'I will']], zh: [['[会|huì] [先|xiān] [上去|shàng qu]', 'will go up first'], ['[我|wǒ] [会|huì] [上去|shàng qu]', 'I’ll go up']], ja: [['[上|のぼ]ります', 'will go up']] },
    'tube.oil': { es: [['aceitaremos', 'we’ll oil']], pt: [['passaremos óleo', 'we’ll oil']], de: [['werden wir', 'we will'], ['ölen', 'oil']], zh: [['[上|shàng] [油|yóu]', 'oil']], ja: [['さす つもり', 'plan to put on'], ['[油|あぶら]', 'oil']] },
    'tube.turn': { es: [['harán', 'will do'], ['girarán', 'will turn']], pt: [['farão', 'will do'], ['girarão', 'will turn']], de: [['tun werden', 'will do'], ['werden sich drehen', 'will turn']], zh: [['[会|huì] [转|zhuàn] [起来|qǐ lai]', 'will start turning']], ja: [['[回|まわ]る でしょう', 'will (surely) turn']] },
    'tube.oiled': { es: [['aceitó', 'oiled'], ['Girarán', 'they’ll turn']], pt: [['passou óleo', 'oiled'], ['girarão', 'they’ll turn']], de: [['geölt', 'oiled']], zh: [['[上|shàng] [过|guo] [油|yóu]', 'were oiled']], ja: [['さして くれた', 'put (oil) on (for us)']] },
    'trigo.demo1': { es: [['Mañana', 'tomorrow'], ['moleré', 'I’ll grind'], ['girarás', 'you’ll turn']], pt: [['Amanhã', 'tomorrow'], ['moerei', 'I’ll grind'], ['girará', '(you) will turn']],
      de: [['Morgen', 'tomorrow'], ['werde ich', 'I will'], ['mahlen', 'grind'], ['wirst', 'you will'], ['drehen', 'turn']], zh: [['[明天|míng tiān]', 'tomorrow'], ['[会|huì]', 'will'], ['[磨|mó]', 'grind']],
      ja: [['[明日|あした]', 'tomorrow'], ['[挽|ひ]く つもり', 'intend to grind'], ['[回|まわ]します', 'will turn']] },
    'trigo.demo2': { es: [['llevará', 'she’ll carry'], ['jugarán', 'they’ll play'], ['la semana que viene', 'next week'], ['cantaremos', 'we’ll sing']], pt: [['levará', 'she’ll carry'], ['brincarão', 'they’ll play'], ['na semana que vem', 'next week'], ['cantaremos', 'we’ll sing']],
      de: [['wird', 'will'], ['werden', 'will'], ['nächste Woche', 'next week'], ['singen', 'sing']], zh: [['[要|yào]', 'going to'], ['[下个星期|xià ge xīng qī]', 'next week'], ['[唱歌|chàng gē]', 'sing']],
      ja: [['[運|はこ]びます', 'will carry'], ['[遊|あそ]ぶ でしょう', 'will probably play'], ['[来週|らいしゅう]', 'next week'], ['[歌|うた]う つもり', 'plan to sing']] },
    'warn': { es: [['Si', 'if'], ['nadie', 'nobody'], ['se parará', 'will stop']], pt: [['Se', 'if'], ['ninguém', 'nobody'], ['parará', 'will stop']], de: [['Wenn', 'if'], ['niemand', 'nobody'], ['stehen bleiben', 'stop']],
      zh: [['[如果|rú guǒ]', 'if'], ['[没有|méi yǒu] [人|rén]', 'nobody'], ['[停|tíng] [下来|xià lai]', 'stop']], ja: [['だれ も', 'nobody'], ['[止|と]まる でしょう', 'will stop']] },
    'room1': { es: [['hará', 'will do'], ['fuelle', 'bellows'], ['se cumplirá', 'will happen']], pt: [['fará', 'will do'], ['fole', 'bellows'], ['acontecerá', 'will happen']], de: [['tun wird', 'will do'], ['Blasebalg', 'bellows']],
      zh: [['[会|huì] [做|zuò]', 'will do'], ['[风箱|fēng xiāng]', 'bellows']], ja: [['[予定|よてい]', 'plan'], ['ふいご', 'bellows']] },
    'trigo.demo3': { es: [['crujirán', 'they’ll creak'], ['girarán', 'they’ll turn'], ['reconstruiremos', 'we’ll rebuild']], pt: [['rangerão', 'they’ll creak'], ['girarão', 'they’ll turn'], ['reconstruiremos', 'we’ll rebuild']],
      de: [['knarren', 'creak'], ['werden sie sich drehen', 'they’ll turn'], ['wieder aufbauen', 'rebuild']], zh: [['[嘎吱|gā zhī] [响|xiǎng]', 'creak'], ['[转|zhuàn] [起来|qǐ lai]', 'start turning'], ['[重建|chóng jiàn]', 'rebuild']],
      ja: [['きしむ でしょう', 'will (probably) creak'], ['[回|まわ]る', 'will turn'], ['[建|た]て[直|なお]す つもり', 'plan to rebuild']] },
    'trigo.demo4': { es: [['hablará', 'will speak'], ['toserá', 'will cough'], ['estornudará', 'will sneeze'], ['barreremos', 'we’ll sweep'], ['cubre', 'covers']],
      pt: [['falará', 'will speak'], ['tossirá', 'will cough'], ['espirrará', 'will sneeze'], ['varreremos', 'we’ll sweep'], ['cobre', 'covers']],
      de: [['sprechen', 'speak'], ['husten', 'cough'], ['niesen', 'sneeze'], ['wegfegen', 'sweep away'], ['bedeckt', 'covers']],
      zh: [['[说话|shuō huà]', 'speak'], ['[咳嗽|ké sou]', 'cough'], ['[打喷嚏|dǎ pēn tì]', 'sneeze'], ['[扫|sǎo] [掉|diào]', 'sweep away'], ['[盖住|gài zhù]', 'cover']],
      ja: [['[話|はな]す', 'will speak'], ['せき を しない', 'won’t cough'], ['くしゃみ', 'sneeze'], ['[覆|おお]う', 'cover'], ['[掃|は]いて しまう', 'sweep away']] },
    'marga.demo': { es: [['El mes que viene', 'next month'], ['sembraremos', 'we’ll sow'], ['trigo', 'wheat'], ['cosecharemos', 'we’ll harvest'], ['juntos', 'together']],
      pt: [['No mês que vem', 'next month'], ['semearemos', 'we’ll sow'], ['trigo', 'wheat'], ['colheremos', 'we’ll harvest'], ['juntos', 'together']],
      de: [['Nächsten Monat', 'next month'], ['säen', 'sow'], ['Weizen', 'wheat'], ['ernten', 'harvest'], ['zusammen', 'together']],
      zh: [['[下|xià] [个|gè] [月|yuè]', 'next month'], ['[播种|bō zhǒng]', 'sow'], ['[麦子|mài zi]', 'wheat'], ['[收割|shōu gē]', 'harvest'], ['[一起|yī qǐ]', 'together']],
      ja: [['[来月|らいげつ]', 'next month'], ['[種|たね] を まく つもり', 'plan to sow'], ['[収穫|しゅうかく] する でしょう', 'will (surely) harvest'], ['いっしょ に', 'together']] },
    'tomas.demo': { es: [['barreré', 'I’ll sweep'], ['abriré', 'I’ll open'], ['hornearé', 'I’ll bake'], ['comprarás', 'you’ll buy']], pt: [['varrerei', 'I’ll sweep'], ['abrirei', 'I’ll open'], ['assarei', 'I’ll bake'], ['comprará', '(you) will buy']],
      de: [['fegen', 'sweep'], ['aufmachen', 'open'], ['backen', 'bake'], ['wirst', 'you will'], ['kaufen', 'buy']], zh: [['[扫|sǎo]', 'sweep'], ['[开|kāi] [门|mén]', 'open (the shop)'], ['[烤|kǎo]', 'bake'], ['[买|mǎi]', 'buy']],
      ja: [['[掃|は]いて', 'sweep (and)'], ['[開|あ]けて', 'open (and)'], ['[焼|や]きます', 'will bake'], ['[買|か]う でしょう', 'will (surely) buy']] },
    'lupe.demo': { es: [['adornaremos', 'we’ll decorate'], ['plantaremos', 'we’ll plant'], ['invitaremos', 'we’ll invite']], pt: [['enfeitaremos', 'we’ll decorate'], ['plantaremos', 'we’ll plant'], ['convidaremos', 'we’ll invite']],
      de: [['schmücken', 'decorate'], ['pflanzen', 'plant'], ['einladen', 'invite']], zh: [['[装饰|zhuāng shì]', 'decorate'], ['[种|zhòng]', 'plant'], ['[邀请|yāo qǐng]', 'invite']],
      ja: [['[飾|かざ]って', 'decorate (and)'], ['[植|う]えて', 'plant (and)'], ['[招待|しょうたい] する つもり', 'plan to invite']] },
    'ciro.demo': { es: [['arreglaré', 'I’ll fix'], ['sonará', 'it’ll chime'], ['olvidará', 'will forget']], pt: [['consertarei', 'I’ll fix'], ['tocará', 'it’ll chime'], ['esquecerá', 'will forget']],
      de: [['reparieren', 'fix'], ['schlagen', 'chime'], ['vergessen', 'forget']], zh: [['[修|xiū] [好|hǎo]', 'fix'], ['[响|xiǎng]', 'chime'], ['[忘记|wàng jì]', 'forget']],
      ja: [['[直|なお]す つもり', 'plan to fix'], ['[鳴|な]る でしょう', 'will (surely) chime'], ['[忘|わす]れない でしょう', 'won’t forget']] },
    'dani.demo': { es: [['El año que viene', 'next year'], ['pintaremos', 'we’ll paint'], ['portón', 'gate'], ['celebraremos', 'we’ll celebrate']], pt: [['No ano que vem', 'next year'], ['pintaremos', 'we’ll paint'], ['portão', 'gate'], ['comemoraremos', 'we’ll celebrate']],
      de: [['Nächstes Jahr', 'next year'], ['streichen', 'paint'], ['Tor', 'gate'], ['feiern', 'celebrate']], zh: [['[明年|míng nián]', 'next year'], ['[涂|tú]', 'paint'], ['[大门|dà mén]', 'gate'], ['[庆祝|qìng zhù]', 'celebrate']],
      ja: [['[来年|らいねん]', 'next year'], ['[塗|ぬ]る つもり', 'plan to paint'], ['[門|もん]', 'gate'], ['[祝|いわ]う', 'celebrate']] },
    'felix.demo': { es: [['saludaré', 'I’ll greet'], ['viajeros', 'travelers'], ['visitarán', 'they’ll visit'], ['Compartirán', 'they’ll share']], pt: [['cumprimentarei', 'I’ll greet'], ['viajantes', 'travelers'], ['visitarão', 'they’ll visit'], ['Dividirão', 'they’ll share']],
      de: [['begrüßen', 'greet'], ['Reisenden', 'travelers'], ['besuchen', 'visit'], ['teilen', 'share']], zh: [['[打招呼|dǎ zhāo hu]', 'greet'], ['[参观|cān guān]', 'visit'], ['[分享|fēn xiǎng]', 'share']],
      ja: [['あいさつ する つもり', 'plan to greet'], ['[訪|たず]ねて', 'visit (and)'], ['[分|わ]け[合|あ]う でしょう', 'will share']] },
  };
  const CARDS = {
    fut: { tag: 'Tomorrow: I, you, everyone',
      es: { ex: [['moleré', 'I’ll grind'], ['molerás', 'you’ll grind'], ['molerá', 'he / she will grind'], ['moleremos', 'we’ll grind'], ['molerán', 'they’ll grind'], ['la semana que viene', 'next week']],
        note: 'The future: the whole verb + é, ás, á, emos, án (moler → moleré). The same endings for -ar, -er and -ir verbs. «Mañana», «la semana que viene».' },
      pt: { ex: [['moerei', 'I’ll grind'], ['você moerá', 'you’ll grind'], ['ele / ela moerá', 'he / she will grind'], ['moeremos', 'we’ll grind'], ['eles moerão', 'they’ll grind'], ['na semana que vem', 'next week']],
        note: 'The futuro do presente: the whole verb + ei, á, emos, ão (moer → moerei). In speech «vou moer» says the same. «Amanhã», «na semana que vem».' },
      de: { ex: [['ich werde mahlen', 'I will grind'], ['du wirst mahlen', 'you will grind'], ['er / sie wird mahlen', 'he / she will grind'], ['wir werden mahlen', 'we will grind'], ['sie werden mahlen', 'they will grind'], ['nächste Woche', 'next week']],
        note: '«werden» changes with the person (werde, wirst, wird, werden), and the verb waits at the very end. «Morgen», «nächste Woche».' },
      zh: { ex: [['[我|wǒ] [会|huì] [磨|mó]', 'I will grind'], ['[你|nǐ] [会|huì] [转|zhuàn]', 'you will turn'], ['[孩子|hái zi] [们|men] [要|yào] [玩|wán]', 'the kids are going to play'], ['[下个星期|xià ge xīng qī]', 'next week']],
        note: 'Chinese verbs don’t change with the person: say who, then 会 (will) or 要 (going to), then the verb. Time words go up front: 明天, 下个星期.' },
      ja: { ex: [['[挽|ひ]く つもり です', 'I intend to grind'], ['[回|まわ]します', '(you) will turn'], ['[遊|あそ]ぶ でしょう', '(they) will probably play'], ['[来週|らいしゅう]', 'next week']],
        note: 'Japanese verbs don’t change with the person: ～ます can mean «will», つもり is your plan, でしょう a promise or a guess. 明日, 来週.' } },
  };
  // ------------------------------------------------------------ the promises (time_molinar.js MOLT.grade): want (S: the right person), person
  // (a future, but someone else's: B), alt («ir a» / «vou» + the verb, or no person said: A), pres (today: say it again), past (yesterday)
  const TIPS = {
    person: { es: 'Tomorrow’s words, but for someone else. Here: «{form}».', pt: 'Tomorrow’s words, but for someone else. Here: «{form}».', de: '«werden» changes with the person. Here: «{form}».', zh: 'Say who: «{form}».', ja: '«{form}»' },
    pres: { es: 'That’s today. Tomorrow needs tomorrow’s words: «{form}».', pt: 'That’s today. Tomorrow needs tomorrow’s words: «{form}».', de: 'That’s today. Tomorrow needs «werden»: «{form}».', zh: 'That’s today: 会 / 要 before the verb, «{form}».', ja: 'That’s today: つもり, ～ます or でしょう, «{form}».' },
    past: { es: 'That’s yesterday! Tomorrow’s words: «{form}».', pt: 'That’s yesterday! Tomorrow’s words: «{form}».', de: 'That’s yesterday! Tomorrow: «{form}».', zh: 'That’s yesterday (了)! Tomorrow: «{form}».', ja: 'That’s yesterday (～た)! Tomorrow: «{form}».' },
    alt: { es: '«ir a» works too! Tomorrow’s own words: «{form}».', pt: '«ir» + the verb works too! The futuro do presente: «{form}».', zh: 'Say who, too: «{form}».', de: 'Right! The verb goes last: «{form}».', ja: 'Right! The whole promise: «{form}».' },
    more: { es: 'Right! The whole promise for an S: «{form}».', pt: 'Right! The whole promise for an S: «{form}».', de: 'Right! The whole promise for an S: «{form}».', zh: 'Right! The whole promise for an S: «{form}».', ja: 'Right! The whole promise for an S: «{form}».' },
  };
  const P = (o) => o;
  const TASKS = {
    marga: P({ title: 'Wake Marga: promise what you’ll both do tomorrow (we).',
      frame: { es: 'Mañana ___ el trigo al molino.', pt: 'Amanhã ___ o trigo ao moinho.', de: 'Morgen ___ wir den Weizen zur Mühle ___.', zh: '[明天|míng tiān] [我们|wǒ men] ___ [麦子|mài zi] 。', ja: '[明日|あした] 、 いっしょ に [麦|むぎ] を ___ 。' },
      chips: { es: [['llevaremos', 'we’ll take']], pt: [['levaremos', 'we’ll take']], de: [['werden', 'will (we)'], ['bringen', 'bring']], zh: [['[会|huì] [送|sòng]', 'will take']], ja: [['[運|はこ]ぶ つもり です', 'plan to carry']] },
      model: L('Tomorrow we’ll take the wheat to the mill.', 'Mañana llevaremos el trigo al molino.', 'Amanhã levaremos o trigo ao moinho.', 'Morgen werden wir den Weizen zur Mühle bringen.', '[明天|míng tiān] [我们|wǒ men] [会|huì] [送|sòng] [麦子|mài zi] 。', '[明日|あした] 、 いっしょ に [麦|むぎ] を [運|はこ]ぶ つもり です 。'),
      want: { es: ['llevaremos'], pt: ['levaremos'], de: [['werden', 'bringen'], ['werden', 'tragen'], ['werden', 'fahren']], zh: [['[我们|wǒ men]', '[会|huì]', '[送|sòng]'], ['[我们|wǒ men]', '[要|yào]', '[送|sòng]']], ja: ['[運|はこ]ぶ つもり', '[運|はこ]びます', '[運|はこ]ぶ でしょう', '[運|はこ]びましょう'] },
      person: { es: ['llevaré', 'llevarás', 'llevará', 'llevarán'], pt: ['levarei', 'levará', 'levarão'], de: [['werde', 'bringen'], ['wird', 'bringen'], ['wirst', 'bringen']] },
      alt: { es: [['vamos', 'a', 'llevar']], pt: [['vamos', 'levar']], zh: [['[会|huì]', '[送|sòng]'], ['[要|yào]', '[送|sòng]']] },
      pres: { es: ['llevamos', 'llevo', 'lleva', 'llevar'], pt: ['levamos', 'levo', 'leva', 'levar'], de: ['bringen', 'bringe', 'bringt'], zh: ['[送|sòng]'], ja: ['[運|はこ]んで', '[運|はこ]ぶ'] },
      past: { es: ['llevé', 'llevó'], pt: ['levei', 'levou'], ja: ['[運|はこ]んだ', '[運|はこ]びました'] },
      more: { es: ['trigo'], pt: ['trigo'], de: ['weizen', 'korn'], zh: ['[麦子|mài zi]'], ja: ['[明日|あした]', 'いっしょ'] } }),
    tomas: P({ title: 'Wake Tomás: promise what he’ll do tomorrow (you).',
      frame: { es: 'Mañana ___ pan otra vez.', pt: 'Amanhã você ___ pão de novo.', de: 'Morgen ___ du wieder Brot ___.', zh: '[明天|míng tiān] [你|nǐ] ___ [面包|miàn bāo] 。', ja: '[明日|あした] 、 また パン を ___ 。' },
      chips: { es: [['venderás', 'you’ll sell']], pt: [['venderá', '(you) will sell']], de: [['wirst', 'will (you)'], ['verkaufen', 'sell']], zh: [['[会|huì] [卖|mài]', 'will sell']], ja: [['[売|う]ります', 'will sell']] },
      model: L('Tomorrow you’ll sell bread again.', 'Mañana venderás pan otra vez.', 'Amanhã você venderá pão de novo.', 'Morgen wirst du wieder Brot verkaufen.', '[明天|míng tiān] [你|nǐ] [会|huì] [再|zài] [卖|mài] [面包|miàn bāo] 。', '[明日|あした] 、 また パン を [売|う]ります よ 。'),
      want: { es: ['venderás'], pt: ['venderá'], de: [['wirst', 'verkaufen']], zh: [['[你|nǐ]', '[会|huì]', '[卖|mài]'], ['[你|nǐ]', '[要|yào]', '[卖|mài]']], ja: ['[売|う]ります', '[売|う]る でしょう', '[売|う]る つもり'] },
      person: { es: ['venderé', 'venderá', 'venderemos', 'venderán'], pt: ['venderei', 'venderemos', 'venderão'], de: [['werde', 'verkaufen'], ['wird', 'verkaufen'], ['werden', 'verkaufen']] },
      alt: { es: [['vas', 'a', 'vender']], pt: [['vai', 'vender']], zh: [['[会|huì]', '[卖|mài]'], ['[要|yào]', '[卖|mài]']] },
      pres: { es: ['vendes', 'vende', 'vender', 'vendo'], pt: ['vende', 'vender', 'vendo'], de: ['verkaufst', 'verkauft', 'verkaufe'], zh: ['[卖|mài]'], ja: ['[売|う]って', '[売|う]る'] },
      past: { es: ['vendiste', 'vendió', 'vendí'], pt: ['vendeu', 'vendi'], ja: ['[売|う]った', '[売|う]りました'] },
      more: { es: ['pan'], pt: ['pao', 'pão'], de: ['brot'], zh: ['[面包|miàn bāo]'], ja: ['パン'] } }),
    lupe: P({ title: 'Wake Lupe: promise what the children will do tomorrow (they).',
      frame: { es: 'Mañana los niños ___ fruta.', pt: 'Amanhã as crianças ___ frutas.', de: 'Morgen ___ die Kinder Obst ___.', zh: '[明天|míng tiān] [孩子|hái zi] [们|men] ___ [水果|shuǐ guǒ] 。', ja: '[明日|あした] 、 [子|こ]ども たち が くだもの を ___ 。' },
      chips: { es: [['comprarán', 'they’ll buy']], pt: [['comprarão', 'they’ll buy']], de: [['werden', 'will (they)'], ['kaufen', 'buy']], zh: [['[会|huì] [买|mǎi]', 'will buy']], ja: [['[買|か]う でしょう', 'will (probably) buy']] },
      model: L('Tomorrow the children will buy fruit.', 'Mañana los niños comprarán fruta.', 'Amanhã as crianças comprarão frutas.', 'Morgen werden die Kinder Obst kaufen.', '[明天|míng tiān] [孩子|hái zi] [们|men] [会|huì] [买|mǎi] [水果|shuǐ guǒ] 。', '[明日|あした] 、 [子|こ]ども たち が くだもの を [買|か]う でしょう 。'),
      want: { es: ['comprarán'], pt: ['comprarão'], de: [['werden', 'kaufen']], zh: [['[孩子|hái zi]', '[会|huì]', '[买|mǎi]'], ['[孩子|hái zi]', '[要|yào]', '[买|mǎi]']], ja: ['[買|か]う でしょう', '[買|か]います', '[買|か]う だろう'] },
      person: { es: ['compraré', 'comprarás', 'comprará', 'compraremos'], pt: ['comprarei', 'comprará', 'compraremos'], de: [['wird', 'kaufen'], ['werde', 'kaufen'], ['wirst', 'kaufen']] },
      alt: { es: [['van', 'a', 'comprar']], pt: [['vão', 'comprar']], zh: [['[会|huì]', '[买|mǎi]'], ['[要|yào]', '[买|mǎi]']] },
      pres: { es: ['compran', 'compra', 'comprar'], pt: ['compram', 'compra', 'comprar'], de: ['kaufen', 'kauft', 'kaufe'], zh: ['[买|mǎi]'], ja: ['[買|か]って', '[買|か]う'] },
      past: { es: ['compraron', 'compró'], pt: ['compraram', 'comprou'], ja: ['[買|か]った', '[買|か]いました'] },
      more: { es: ['ninos', 'niños'], pt: ['criancas', 'crianças'], de: ['kinder'], zh: ['[水果|shuǐ guǒ]'], ja: ['[子|こ]ども'] } }),
    ciro: P({ title: 'Wake Ciro: promise what his clock will do tomorrow (it).',
      frame: { es: 'Mañana tu reloj ___ otra vez.', pt: 'Amanhã o seu relógio ___ de novo.', de: 'Morgen ___ deine Uhr wieder ___.', zh: '[明天|míng tiān] [你|nǐ] [的|de] [钟|zhōng] ___ 。', ja: '[明日|あした] 、 [時計|とけい] は また ___ 。' },
      chips: { es: [['sonará', 'it’ll chime']], pt: [['tocará', 'it’ll chime']], de: [['wird', 'will (it)'], ['schlagen', 'chime']], zh: [['[会|huì] [响|xiǎng]', 'will ring']], ja: [['[鳴|な]る でしょう', 'will (surely) chime']] },
      model: L('Tomorrow your clock will chime again.', 'Mañana tu reloj sonará otra vez.', 'Amanhã o seu relógio tocará de novo.', 'Morgen wird deine Uhr wieder schlagen.', '[明天|míng tiān] [你|nǐ] [的|de] [钟|zhōng] [会|huì] [再|zài] [响|xiǎng] 。', '[明日|あした] 、 [時計|とけい] は また [鳴|な]る でしょう 。'),
      want: { es: ['sonará'], pt: ['tocará'], de: [['wird', 'schlagen'], ['wird', 'läuten'], ['wird', 'ticken'], ['wird', 'gehen']], zh: [['[钟|zhōng]', '[会|huì]', '[响|xiǎng]'], ['[钟|zhōng]', '[要|yào]', '[响|xiǎng]']], ja: ['[鳴|な]る でしょう', '[鳴|な]ります', '[鳴|な]る だろう'] },
      person: { es: ['sonaré', 'sonarás', 'sonarán', 'sonaremos'], pt: ['tocarei', 'tocarão', 'tocaremos'], de: [['werden', 'schlagen'], ['werde', 'schlagen'], ['wirst', 'schlagen']] },
      alt: { es: [['va', 'a', 'sonar']], pt: [['vai', 'tocar']], zh: [['[会|huì]', '[响|xiǎng]'], ['[要|yào]', '[响|xiǎng]']] },
      pres: { es: ['suena', 'sonar'], pt: ['toca', 'tocar'], de: ['schlägt', 'tickt', 'läutet'], zh: ['[响|xiǎng]'], ja: ['[鳴|な]って', '[鳴|な]る'] },
      past: { es: ['sonó'], pt: ['tocou'], ja: ['[鳴|な]った', '[鳴|な]りました'] },
      more: { es: ['reloj'], pt: ['relogio', 'relógio'], de: ['uhr'], zh: ['[钟|zhōng]'], ja: ['[時計|とけい]'] } }),
    dani: P({ title: 'Wake Dani: promise what he’ll do next week (you).',
      frame: { es: 'La semana que viene ___ con tus amigos.', pt: 'Na semana que vem você ___ com os seus amigos.', de: 'Nächste Woche ___ du mit deinen Freunden ___.', zh: '[下个星期|xià ge xīng qī] [你|nǐ] ___ 。', ja: '[来週|らいしゅう] 、 [友|とも]だち と ___ 。' },
      chips: { es: [['jugarás', 'you’ll play']], pt: [['brincará', '(you) will play']], de: [['wirst', 'will (you)'], ['spielen', 'play']], zh: [['[会|huì] [跟|gēn] [朋友|péng you] [玩|wán]', 'will play with friends']], ja: [['[遊|あそ]ぶ でしょう', 'will (surely) play']] },
      model: L('Next week you’ll play with your friends.', 'La semana que viene jugarás con tus amigos.', 'Na semana que vem você brincará com os seus amigos.', 'Nächste Woche wirst du mit deinen Freunden spielen.', '[下个星期|xià ge xīng qī] [你|nǐ] [会|huì] [跟|gēn] [朋友|péng you] [一起|yī qǐ] [玩|wán] 。', '[来週|らいしゅう] 、 [友|とも]だち と [遊|あそ]ぶ でしょう 。'),
      want: { es: ['jugarás'], pt: ['brincará'], de: [['wirst', 'spielen']], zh: [['[你|nǐ]', '[会|huì]', '[玩|wán]'], ['[你|nǐ]', '[要|yào]', '[玩|wán]']], ja: ['[遊|あそ]ぶ でしょう', '[遊|あそ]びます', '[遊|あそ]ぶ よ', '[遊|あそ]ぶ だろう'] },
      person: { es: ['jugaré', 'jugará', 'jugaremos', 'jugarán'], pt: ['brincarei', 'brincaremos', 'brincarão'], de: [['werde', 'spielen'], ['wird', 'spielen'], ['werden', 'spielen']] },
      alt: { es: [['vas', 'a', 'jugar']], pt: [['vai', 'brincar']], zh: [['[会|huì]', '[玩|wán]'], ['[要|yào]', '[玩|wán]']] },
      pres: { es: ['juegas', 'juega', 'jugar', 'juego'], pt: ['brinca', 'brincar'], de: ['spielst', 'spielt', 'spiele'], zh: ['[玩|wán]'], ja: ['[遊|あそ]んで', '[遊|あそ]ぶ'] },
      past: { es: ['jugaste', 'jugó'], pt: ['brincou'], ja: ['[遊|あそ]んだ', '[遊|あそ]びました'] },
      more: { es: ['semana'], pt: ['semana'], de: ['woche'], zh: ['[下个星期|xià ge xīng qī]'], ja: ['[来週|らいしゅう]'] } }),
    felix: P({ title: 'Wake Félix: promise what he’ll do tomorrow (you).',
      frame: { es: 'Mañana ___ a todos.', pt: 'Amanhã você ___ todo mundo.', de: 'Morgen ___ du alle ___.', zh: '[明天|míng tiān] [你|nǐ] ___ [大家|dà jiā] 。', ja: '[明日|あした] 、 みんな に ___ 。' },
      chips: { es: [['saludarás', 'you’ll greet']], pt: [['cumprimentará', '(you) will greet']], de: [['wirst', 'will (you)'], ['begrüßen', 'greet']], zh: [['[会|huì] [欢迎|huān yíng]', 'will welcome']], ja: [['あいさつ する でしょう', 'will (surely) greet']] },
      model: L('Tomorrow you’ll greet everyone.', 'Mañana saludarás a todos.', 'Amanhã você cumprimentará todo mundo.', 'Morgen wirst du alle begrüßen.', '[明天|míng tiān] [你|nǐ] [会|huì] [欢迎|huān yíng] [大家|dà jiā] 。', '[明日|あした] 、 みんな に あいさつ する でしょう 。'),
      want: { es: ['saludarás'], pt: ['cumprimentará'], de: [['wirst', 'begrüßen'], ['wirst', 'grüßen']], zh: [['[你|nǐ]', '[会|huì]', '[欢迎|huān yíng]'], ['[你|nǐ]', '[要|yào]', '[欢迎|huān yíng]']], ja: ['あいさつ する でしょう', 'あいさつ します', 'あいさつ する つもり'] },
      person: { es: ['saludaré', 'saludará', 'saludaremos', 'saludarán'], pt: ['cumprimentarei', 'cumprimentaremos'], de: [['werde', 'begrüßen'], ['wird', 'begrüßen']] },
      alt: { es: [['vas', 'a', 'saludar']], pt: [['vai', 'cumprimentar']], zh: [['[会|huì]', '[欢迎|huān yíng]']] },
      pres: { es: ['saludas', 'saluda', 'saludar'], pt: ['cumprimenta', 'cumprimentar'], de: ['begrüßt', 'begrüße', 'grüßt'], zh: ['[欢迎|huān yíng]'], ja: ['あいさつ して', 'あいさつ する'] },
      past: { es: ['saludaste', 'saludó'], pt: ['cumprimentou'], ja: ['あいさつ した', 'あいさつ しました'] },
      more: { es: ['todos'], pt: ['todo'], de: ['alle'], zh: ['[大家|dà jiā]'], ja: ['みんな'] } }),
    // the silent mill: its seals
    first: P({ title: 'A gray seal over the hatch asks who will go up. Answer: I will!',
      frame: { es: '¡Yo ___!', pt: 'Eu ___!', de: 'Ich ___ ___!', zh: '[我|wǒ] ___ ！', ja: 'わたし が ___ ！' },
      chips: { es: [['subiré', 'I’ll go up']], pt: [['subirei', 'I’ll go up']], de: [['werde', 'will (I)'], ['hochsteigen', 'climb up']], zh: [['[会|huì] [上去|shàng qu]', 'will go up']], ja: [['[上|のぼ]ります', 'will go up']] },
      model: L('I’ll go up!', '¡Yo subiré!', 'Eu subirei!', 'Ich werde hochsteigen!', '[我|wǒ] [会|huì] [上去|shàng qu] ！', 'わたし が [上|のぼ]ります ！'),
      want: { es: ['subiré'], pt: ['subirei'], de: [['werde', 'hochsteigen'], ['werde', 'steigen'], ['werde', 'klettern'], ['werde', 'hochklettern'], ['werde', 'hochgehen'], ['werde', 'gehen']], zh: [['[我|wǒ]', '[会|huì]', '[上|shàng]'], ['[我|wǒ]', '[要|yào]', '[上|shàng]']], ja: ['[上|のぼ]ります', '[上|のぼ]る つもり', '[登|のぼ]ります', '[登|のぼ]る つもり', '[行|い]きます'] },
      person: { es: ['subirás', 'subirá', 'subiremos', 'subirán'], pt: ['subirá', 'subiremos', 'subirão'], de: [['wirst', 'hochsteigen'], ['wird', 'hochsteigen'], ['werden', 'hochsteigen']] },
      alt: { es: [['voy', 'a', 'subir']], pt: [['vou', 'subir']], zh: [['[会|huì]', '[上去|shàng qu]'], ['[要|yào]', '[上去|shàng qu]']] },
      pres: { es: ['subo', 'sube', 'subir'], pt: ['subo', 'sobe', 'subir'], de: ['steige', 'steigt', 'klettere'], zh: ['[上去|shàng qu]'], ja: ['[上|のぼ]って', '[登|のぼ]って'] },
      past: { es: ['subí', 'subió'], pt: ['subi', 'subiu'], ja: ['[上|のぼ]った', '[登|のぼ]った'] } }),
    oil: P({ title: 'The rusted gears need a promise: tomorrow we’ll oil them (we).',
      frame: { es: 'Mañana ___ los engranajes.', pt: 'Amanhã ___ óleo nas engrenagens.', de: 'Morgen ___ wir die Zahnräder ___.', zh: '[明天|míng tiān] [我们|wǒ men] ___ 。', ja: '[明日|あした] 、 [歯車|はぐるま] に [油|あぶら] を ___ 。' },
      chips: { es: [['aceitaremos', 'we’ll oil']], pt: [['passaremos', 'we’ll put']], de: [['werden', 'will (we)'], ['ölen', 'oil']], zh: [['[会|huì] [给|gěi] [齿轮|chǐ lún] [上|shàng] [油|yóu]', 'will oil the gears']], ja: [['さす つもり です', 'plan to put on']] },
      model: L('Tomorrow we’ll oil the gears.', 'Mañana aceitaremos los engranajes.', 'Amanhã passaremos óleo nas engrenagens.', 'Morgen werden wir die Zahnräder ölen.', '[明天|míng tiān] [我们|wǒ men] [会|huì] [给|gěi] [齿轮|chǐ lún] [上|shàng] [油|yóu] 。', '[明日|あした] 、 [歯車|はぐるま] に [油|あぶら] を さす つもり です 。'),
      want: { es: ['aceitaremos'], pt: ['passaremos', 'lubrificaremos'], de: [['werden', 'ölen'], ['werden', 'schmieren']], zh: [['[我们|wǒ men]', '[会|huì]', '[油|yóu]'], ['[我们|wǒ men]', '[要|yào]', '[油|yóu]']], ja: ['さす つもり', 'さします', 'さしましょう'] },
      person: { es: ['aceitaré', 'aceitarás', 'aceitará', 'aceitarán'], pt: ['passarei', 'passará', 'passarão'], de: [['werde', 'ölen'], ['wird', 'ölen'], ['wirst', 'ölen']] },
      alt: { es: [['vamos', 'a', 'aceitar']], pt: [['vamos', 'passar']], zh: [['[会|huì]', '[油|yóu]'], ['[要|yào]', '[油|yóu]']] },
      pres: { es: ['aceitamos', 'aceita', 'aceitar'], pt: ['passamos', 'passa', 'passar'], de: ['ölen', 'ölt', 'öle'], zh: [['[上|shàng]', '[油|yóu]']], ja: ['さして', 'さす'] },
      past: { es: ['aceité', 'aceitó'], pt: ['passei', 'passou'], ja: ['さした', 'さしました'] },
      more: { es: ['engranajes'], pt: ['engrenagens'], de: ['zahnrader', 'zahnräder'], zh: ['[齿轮|chǐ lún]'], ja: ['[歯車|はぐるま]'] } }),
    turn: P({ title: 'Trigo’s voice through the speaking tube: what will the mills do? (they)',
      frame: { es: 'Los molinos ___ otra vez.', pt: 'Os moinhos ___ de novo.', de: 'Die Mühlen ___ sich wieder ___.', zh: '[风车|fēng chē] ___ 。', ja: '[風車|ふうしゃ] は また ___ 。' },
      chips: { es: [['girarán', 'they’ll turn']], pt: [['girarão', 'they’ll turn']], de: [['werden', 'will (they)'], ['drehen', 'turn']], zh: [['[会|huì] [再|zài] [转|zhuàn] [起来|qǐ lai]', 'will turn again']], ja: [['[回|まわ]る でしょう', 'will (surely) turn']] },
      model: L('The mills will turn again.', 'Los molinos girarán otra vez.', 'Os moinhos girarão de novo.', 'Die Mühlen werden sich wieder drehen.', '[风车|fēng chē] [会|huì] [再|zài] [转|zhuàn] [起来|qǐ lai] 。', '[風車|ふうしゃ] は また [回|まわ]る でしょう 。'),
      want: { es: ['girarán'], pt: ['girarão'], de: [['werden', 'drehen']], zh: [['[风车|fēng chē]', '[会|huì]', '[转|zhuàn]'], ['[风车|fēng chē]', '[要|yào]', '[转|zhuàn]']], ja: ['[回|まわ]る でしょう', '[回|まわ]ります', '[回|まわ]る だろう'] },
      person: { es: ['giraré', 'girarás', 'girará', 'giraremos'], pt: ['girará', 'girarei', 'giraremos'], de: [['wird', 'drehen'], ['werde', 'drehen']] },
      alt: { es: [['van', 'a', 'girar']], pt: [['vão', 'girar']], zh: [['[会|huì]', '[转|zhuàn]'], ['[要|yào]', '[转|zhuàn]']] },
      pres: { es: ['giran', 'gira', 'girar'], pt: ['giram', 'gira', 'girar'], de: ['drehen', 'dreht'], zh: ['[转|zhuàn]'], ja: ['[回|まわ]って', '[回|まわ]る'] },
      past: { es: ['giraron', 'giró'], pt: ['giraram', 'girou'], ja: ['[回|まわ]った', '[回|まわ]りました'] },
      more: { es: ['molinos'], pt: ['moinhos'], de: ['muhlen', 'mühlen'], zh: ['[风车|fēng chē]'], ja: ['[風車|ふうしゃ]'] } }),
    // the Gray Miller stops only for promises about the town
    town: P({ title: 'The Gray Miller won’t stop for hits. Promise what the town will do!',
      frame: { es: 'El pueblo ___.', pt: 'A cidade ___.', de: 'Die Stadt ___ ___.', zh: '[镇上|zhèn shang] [的|de] [人|rén] ___ 。', ja: '[町|まち] の [人|ひと] は ___ 。' },
      chips: { es: [['hablará', 'will speak']], pt: [['falará', 'will speak']], de: [['wird', 'will (it)'], ['sprechen', 'speak']], zh: [['[会|huì] [说话|shuō huà]', 'will speak']], ja: [['[話|はな]す でしょう', 'will (surely) speak']] },
      model: L('The town will speak.', 'El pueblo hablará.', 'A cidade falará.', 'Die Stadt wird sprechen.', '[镇上|zhèn shang] [的|de] [人|rén] [会|huì] [说话|shuō huà] 。', '[町|まち] の [人|ひと] は [話|はな]す でしょう 。'),
      want: { es: ['hablará', 'hablarán', 'hablaremos', 'cantará', 'cantarán'], pt: ['falará', 'falarão', 'falaremos', 'cantará', 'cantarão'], de: [['wird', 'sprechen'], ['werden', 'sprechen'], ['wird', 'reden'], ['werden', 'reden'], ['werden', 'singen'], ['wird', 'singen']],
        zh: [['[会|huì]', '[说话|shuō huà]'], ['[要|yào]', '[说话|shuō huà]'], ['[会|huì]', '[唱歌|chàng gē]']], ja: ['[話|はな]す でしょう', '[話|はな]します', '[話|はな]す だろう', '[話|はな]す つもり', '[歌|うた]う でしょう'] },
      person: { es: ['hablaré', 'hablarás'], pt: ['falarei'], de: [['werde', 'sprechen'], ['wirst', 'sprechen']] },
      alt: { es: [['va', 'a', 'hablar'], ['van', 'a', 'hablar'], ['vamos', 'a', 'hablar']], pt: [['vai', 'falar'], ['vão', 'falar'], ['vamos', 'falar']] },
      pres: { es: ['habla', 'hablan', 'hablar'], pt: ['fala', 'falam', 'falar'], de: ['spricht', 'sprechen', 'redet'], zh: ['[说话|shuō huà]'], ja: ['[話|はな]して', '[話|はな]す'] },
      past: { es: ['habló', 'hablaron'], pt: ['falou', 'falaram'], ja: ['[話|はな]した', '[話|はな]しました'] } }),
    grind: P({ title: 'Once more: promise what everyone will do tomorrow (they).',
      frame: { es: 'Mañana todos ___ trigo.', pt: 'Amanhã todos ___ trigo.', de: 'Morgen ___ alle Korn ___.', zh: '[明天|míng tiān] [大家|dà jiā] ___ [麦子|mài zi] 。', ja: '[明日|あした] 、 みんな で [麦|むぎ] を ___ 。' },
      chips: { es: [['molerán', 'they’ll grind']], pt: [['moerão', 'they’ll grind']], de: [['werden', 'will (they)'], ['mahlen', 'grind']], zh: [['[会|huì] [磨|mó]', 'will grind']], ja: [['[挽|ひ]く でしょう', 'will (surely) grind']] },
      model: L('Tomorrow everyone will grind wheat.', 'Mañana todos molerán trigo.', 'Amanhã todos moerão trigo.', 'Morgen werden alle Korn mahlen.', '[明天|míng tiān] [大家|dà jiā] [会|huì] [磨|mó] [麦子|mài zi] 。', '[明日|あした] 、 みんな で [麦|むぎ] を [挽|ひ]く でしょう 。'),
      want: { es: ['molerán', 'moleremos', 'molerá'], pt: ['moerão', 'moeremos', 'moerá'], de: [['werden', 'mahlen'], ['wird', 'mahlen']], zh: [['[会|huì]', '[磨|mó]'], ['[要|yào]', '[磨|mó]']], ja: ['[挽|ひ]く でしょう', '[挽|ひ]きます', '[挽|ひ]く つもり', '[挽|ひ]く だろう'] },
      person: { es: ['moleré', 'molerás'], pt: ['moerei'], de: [['werde', 'mahlen'], ['wirst', 'mahlen']] },
      alt: { es: [['van', 'a', 'moler'], ['vamos', 'a', 'moler']], pt: [['vão', 'moer'], ['vamos', 'moer']] },
      pres: { es: ['muelen', 'muele', 'moler', 'molemos'], pt: ['moem', 'mói', 'moer'], de: ['mahlen', 'mahlt'], ja: ['[挽|ひ]いて', '[挽|ひ]く'] },
      past: { es: ['molieron', 'molió'], pt: ['moeram', 'moeu'], ja: ['[挽|ひ]いた', '[挽|ひ]きました'] },
      more: { es: ['trigo'], pt: ['trigo'], de: ['korn', 'weizen'], zh: ['[麦子|mài zi]'], ja: ['[麦|むぎ]'] } }),
    // Lupe's market day: who will bring what (he, we)
    bread: P({ title: 'Lupe’s plan for next week: what will Tomás bring? (he)',
      frame: { es: 'Tomás ___ pan.', pt: 'O Tomás ___ pão.', de: 'Tomás ___ Brot ___.', zh: '[托马斯|Tuō mǎ sī] ___ [面包|miàn bāo] 。', ja: 'トマス さん は パン を ___ 。' },
      chips: { es: [['traerá', 'he’ll bring']], pt: [['levará', 'he’ll bring']], de: [['wird', 'will (he)'], ['mitbringen', 'bring along']], zh: [['[会|huì] [带|dài]', 'will bring']], ja: [['[持|も]って くる でしょう', 'will (surely) bring']] },
      model: L('Tomás will bring bread.', 'Tomás traerá pan.', 'O Tomás levará pão.', 'Tomás wird Brot mitbringen.', '[托马斯|Tuō mǎ sī] [会|huì] [带|dài] [面包|miàn bāo] 。', 'トマス さん は パン を [持|も]って くる でしょう 。'),
      want: { es: ['traerá', 'llevará'], pt: ['levará'], de: [['wird', 'mitbringen'], ['wird', 'bringen']], zh: [['[会|huì]', '[带|dài]'], ['[要|yào]', '[带|dài]']], ja: ['[持|も]って くる でしょう', '[持|も]って きます', '[持|も]って くる だろう'] },
      person: { es: ['traeré', 'traerás', 'traeremos', 'traerán'], pt: ['levarei', 'levaremos', 'levarão'], de: [['werde', 'mitbringen'], ['wirst', 'mitbringen'], ['werden', 'mitbringen']] },
      alt: { es: [['va', 'a', 'traer']], pt: [['vai', 'levar']] },
      pres: { es: ['trae', 'traer', 'lleva'], pt: ['leva', 'levar'], de: ['bringt', 'bringen'], zh: ['[带|dài]'], ja: ['[持|も]って くる'] },
      past: { es: ['trajo'], pt: ['levou'], ja: ['[持|も]って きた'] },
      more: { es: ['pan'], pt: ['pao', 'pão'], de: ['brot'], zh: ['[面包|miàn bāo]'], ja: ['パン'] } }),
    sing: P({ title: 'And what will all of you do at the market? (we)',
      frame: { es: 'Nosotros ___.', pt: 'Nós ___.', de: 'Wir ___ ___.', zh: '[我们|wǒ men] ___ 。', ja: 'みんな で ___ 。' },
      chips: { es: [['cantaremos', 'we’ll sing']], pt: [['cantaremos', 'we’ll sing']], de: [['werden', 'will (we)'], ['singen', 'sing']], zh: [['[会|huì] [唱歌|chàng gē]', 'will sing']], ja: [['[歌|うた]う つもり です', 'plan to sing']] },
      model: L('We’ll sing.', 'Nosotros cantaremos.', 'Nós cantaremos.', 'Wir werden singen.', '[我们|wǒ men] [会|huì] [唱歌|chàng gē] 。', 'みんな で [歌|うた]う つもり です 。'),
      want: { es: ['cantaremos', 'bailaremos'], pt: ['cantaremos', 'dançaremos'], de: [['werden', 'singen'], ['werden', 'tanzen']], zh: [['[我们|wǒ men]', '[会|huì]', '[唱|chàng]'], ['[我们|wǒ men]', '[要|yào]', '[唱|chàng]'], ['[我们|wǒ men]', '[会|huì]', '[跳舞|tiào wǔ]']], ja: ['[歌|うた]う つもり', '[歌|うた]います', '[歌|うた]いましょう', '[踊|おど]る つもり'] },
      person: { es: ['cantaré', 'cantarás', 'cantará', 'cantarán'], pt: ['cantarei', 'cantará', 'cantarão'], de: [['werde', 'singen'], ['wird', 'singen'], ['wirst', 'singen']] },
      alt: { es: [['vamos', 'a', 'cantar']], pt: [['vamos', 'cantar']], zh: [['[会|huì]', '[唱|chàng]'], ['[要|yào]', '[唱|chàng]']] },
      pres: { es: ['cantamos', 'canta', 'cantar'], pt: ['cantamos', 'canta', 'cantar'], de: ['singen', 'singt'], zh: ['[唱歌|chàng gē]'], ja: ['[歌|うた]って', '[歌|うた]う'] },
      past: { es: ['canté', 'cantó'], pt: ['cantei', 'cantou'], ja: ['[歌|うた]った', '[歌|うた]いました'] } }),
    // today: read Ciro tomorrow's warning
    warn: P({ title: 'Read Ciro the warning from tomorrow, word for word.',
      frame: { es: 'Si nadie habla, el molino ___.', pt: 'Se ninguém falar, o moinho ___.', de: 'Wenn niemand spricht, ___ die Mühle stehen ___.', zh: '[如果|rú guǒ] [没有|méi yǒu] [人|rén] [说话|shuō huà] ， [磨坊|mò fáng] ___ 。', ja: 'だれ も [話|はな]さない と 、 [風車|ふうしゃ] は ___ 。' },
      chips: { es: [['se parará', 'will stop']], pt: [['parará', 'will stop']], de: [['wird', 'will'], ['bleiben', 'stay']], zh: [['[会|huì] [停|tíng] [下来|xià lai]', 'will stop']], ja: [['[止|と]まる でしょう', 'will (surely) stop']] },
      model: L('If nobody speaks, the mill will stop.', 'Si nadie habla, el molino se parará.', 'Se ninguém falar, o moinho parará.', 'Wenn niemand spricht, wird die Mühle stehen bleiben.', '[如果|rú guǒ] [没有|méi yǒu] [人|rén] [说话|shuō huà] ， [磨坊|mò fáng] [会|huì] [停|tíng] [下来|xià lai] 。', 'だれ も [話|はな]さない と 、 [風車|ふうしゃ] は [止|と]まる でしょう 。'),
      want: { es: ['parará'], pt: ['parará'], de: [['wird', 'bleiben'], ['wird', 'anhalten'], ['wird', 'stoppen']], zh: [['[会|huì]', '[停|tíng]'], ['[要|yào]', '[停|tíng]']], ja: ['[止|と]まる でしょう', '[止|と]まります', '[止|と]まる だろう'] },
      alt: { es: [['va', 'a', 'parar']], pt: [['vai', 'parar']] },
      pres: { es: ['para', 'parar'], pt: ['para', 'parar'], de: ['bleibt', 'steht', 'hält'], zh: ['[停|tíng]'], ja: ['[止|と]まって', '[止|と]まる'] },
      past: { es: ['paró'], pt: ['parou'], ja: ['[止|と]まった', '[止|と]まりました'] },
      more: { es: ['nadie'], pt: ['ninguem', 'ninguém'], de: ['niemand'], zh: ['[如果|rú guǒ]'], ja: ['だれ'] } }),
  };
  // Mimo's plans (3rd person future): the forms per verb; its frames per task
  const FV = {
    'v.blow': { es: ['soplará'], pt: ['soprará'], de: [['wird', 'pusten'], ['wird', 'blasen'], ['wird', 'wegpusten'], ['wird', 'anpusten'], ['wird', 'wegblasen'], ['wird', 'anblasen']], zh: [['[会|huì]', '[吹|chuī]'], ['[要|yào]', '[吹|chuī]']], ja: ['[吹|ふ]く つもり', '[吹|ふ]きます', '[吹|ふ]く でしょう'],
      ir: { es: [['va', 'a', 'soplar']], pt: [['vai', 'soprar']] } },
    'v.push': { es: ['empujará'], pt: ['empurrará'], de: [['wird', 'schieben']], zh: [['[会|huì]', '[推|tuī]'], ['[要|yào]', '[推|tuī]']], ja: ['[押|お]す つもり', '[押|お]します', '[押|お]す でしょう'],
      ir: { es: [['va', 'a', 'empujar']], pt: [['vai', 'empurrar']] } },
    'v.climb': { es: ['trepará', 'subirá'], pt: ['subirá'], de: [['wird', 'klettern'], ['wird', 'hochklettern']], zh: [['[会|huì]', '[爬|pá]'], ['[要|yào]', '[爬|pá]']], ja: ['[登|のぼ]る つもり', '[登|のぼ]ります', '[登|のぼ]る でしょう'],
      ir: { es: [['va', 'a', 'trepar'], ['va', 'a', 'subir']], pt: [['vai', 'subir']] } },
  };
  const PLAN = {
    dust: { verb: 'v.blow', title: 'Gray flour blocks the hatch. Say what {mimo} will do, then pump the bellows.',
      frame: { es: '{mimo} ___ el polvo.', pt: 'O {mimo} ___ a poeira.', de: '{mimo} wird den Staub ___.', zh: '{mimo} ___ [灰尘|huī chén] 。', ja: '{mimo} が [粉|こな] を ___ 。' },
      model: L('{mimo} will blow the dust away.', '{mimo} soplará el polvo.', 'O {mimo} soprará a poeira.', '{mimo} wird den Staub wegpusten.', '{mimo} [会|huì] [吹|chuī] [走|zǒu] [灰尘|huī chén] 。', '{mimo} が [粉|こな] を [吹|ふ]く つもり だ 。'),
      more: { es: ['polvo'], pt: ['poeira'], de: ['staub'], zh: ['[灰尘|huī chén]'], ja: ['[粉|こな]'] } },
    gear: { verb: 'v.push', title: 'The big gear hangs loose. Say what {mimo} will do with it.',
      frame: { es: '{mimo} ___ el engranaje.', pt: 'O {mimo} ___ a engrenagem.', de: '{mimo} wird das Zahnrad ___.', zh: '{mimo} ___ [齿轮|chǐ lún] 。', ja: '{mimo} が [歯車|はぐるま] を ___ 。' },
      model: L('{mimo} will push the gear.', '{mimo} empujará el engranaje.', 'O {mimo} empurrará a engrenagem.', '{mimo} wird das Zahnrad schieben.', '{mimo} [会|huì] [推|tuī] [齿轮|chǐ lún] 。', '{mimo} が [歯車|はぐるま] を [押|お]す つもり だ 。'),
      more: { es: ['engranaje'], pt: ['engrenagem'], de: ['zahnrad'], zh: ['[齿轮|chǐ lún]'], ja: ['[歯車|はぐるま]'] } },
    cloth: { verb: 'v.climb', title: 'The gray canvas is tied up the mast. Say what {mimo} will do.',
      frame: { es: '{mimo} ___ al mástil.', pt: 'O {mimo} ___ no mastro.', de: '{mimo} wird auf den Mast ___.', zh: '{mimo} ___ [桅杆|wéi gān] 。', ja: '{mimo} が [柱|はしら] に ___ 。' },
      model: L('{mimo} will climb the mast.', '{mimo} trepará al mástil.', 'O {mimo} subirá no mastro.', '{mimo} wird auf den Mast klettern.', '{mimo} [会|huì] [爬|pá] [上|shàng] [桅杆|wéi gān] 。', '{mimo} が [柱|はしら] に [登|のぼ]る つもり だ 。'),
      more: { es: ['mastil', 'mástil'], pt: ['mastro'], de: ['mast'], zh: ['[桅杆|wéi gān]'], ja: ['[柱|はしら]'] } },
    pinwheel: { verb: 'v.blow', title: 'Dani’s pinwheel needs wind. Say what {mimo} will do.',
      frame: { es: '{mimo} ___ el molinillo.', pt: 'O {mimo} ___ o cata-vento.', de: '{mimo} wird das Windrad ___.', zh: '{mimo} ___ [风车|fēng chē] 。', ja: '{mimo} が [風車|かざぐるま] を ___ 。' },
      model: L('{mimo} will blow on the pinwheel.', '{mimo} soplará el molinillo.', 'O {mimo} soprará o cata-vento.', '{mimo} wird das Windrad anpusten.', '{mimo} [会|huì] [吹|chuī] [风车|fēng chē] 。', '{mimo} が [風車|かざぐるま] を [吹|ふ]く つもり だ 。'),
      more: { es: ['molinillo'], pt: ['cata'], de: ['windrad'], zh: ['[风车|fēng chē]'], ja: ['[風車|かざぐるま]'] } },
  };
  const ROOMS = [
    { name: 'The Gray Grain Floor', sub: 'The silent Great Mill · the ground floor' },
    { name: 'The Rusted Gears', sub: 'The silent Great Mill · the 2nd floor' },
    { name: 'The Still Sails', sub: 'The silent Great Mill · the 3rd floor' },
    { name: 'The Gray Millstone', sub: 'The silent Great Mill · the very top' },
  ];
  // the fight: the Gray Miller (molinar_time_boss.js)
  const FIGHT = {
    intro: L('Nobody speaks. Nobody will grind. Tomorrow… only gray dust.', 'Nadie habla. Nadie molerá. Mañana… solo polvo gris.', 'Ninguém fala. Ninguém moerá. Amanhã… só poeira cinza.', 'Niemand spricht. Niemand wird mahlen. Morgen … nur grauer Staub.',
      '[没有|méi yǒu] [人|rén] [说话|shuō huà] 。 [没有|méi yǒu] [人|rén] [会|huì] [磨|mó] [面|miàn] 。 [明天|míng tiān] … [只有|zhǐ yǒu] [灰|huī] [尘|chén] 。', 'だれ も [話|はな]さない 。 だれ も [挽|ひ]かない 。 [明日|あした] は … [灰色|はいいろ] の [粉|こな] だけ 。'),
    dust: L('Dust!', '¡Polvo!', 'Poeira!', 'Staub!', '[灰|huī] ！', '[粉|こな] ！'),
    coach: L('Plans work here! Say what {mimo} will do: «{mimo} will jump…»', '¡Aquí funcionan los planes! Di lo que hará {mimo}: «{mimo} saltará…»', 'Aqui os planos funcionam! Diz o que o {mimo} fará: «O {mimo} pulará…»', 'Hier funktionieren Pläne! Sag, was {mimo} tun wird: «{mimo} wird springen …»',
      '[这里|zhè lǐ] [计划|jì huà] [有用|yǒu yòng] ！ [说|shuō] {mimo} [会|huì] [做|zuò] [什么|shén me] ： “ {mimo} [会|huì] [跳|tiào] … ”', 'ここ で は [予定|よてい] が [効|き]く ！ {mimo} が [何|なに] を する か [言|い]って ： 「 {mimo} が [跳|と]ぶ つもり … 」'),
    now: L('That’s today! Up here, everything is tomorrow.', '¡Eso es hoy! Aquí arriba, todo es mañana.', 'Isso é hoje! Aqui em cima, tudo é amanhã.', 'Das ist heute! Hier oben ist alles morgen.',
      '[那|nà] [是|shì] [今天|jīn tiān] ！ [这|zhè] [上面|shàng miàn] ， [一切|yī qiè] [都|dōu] [是|shì] [明天|míng tiān] 。', 'それ は [今日|きょう] だ ！ ここ で は 、 ぜんぶ [明日|あした] な ん だ 。'),
    sack: L('My sacks… my gray sacks!', '¡Mis sacos… mis sacos grises!', 'Meus sacos… meus sacos cinza!', 'Meine Säcke … meine grauen Säcke!', '[我|wǒ] [的|de] [袋子|dài zi] … [我|wǒ] [的|de] [灰|huī] [袋子|dài zi] ！', 'わし の [袋|ふくろ] … [灰色|はいいろ] の [袋|ふくろ] が ！'),
    phase2: L('It doesn’t matter. The stone keeps grinding. The town will be silent.', 'No importa. La piedra sigue moliendo. El pueblo callará.', 'Não importa. A pedra continua moendo. A cidade calará.', 'Egal. Der Stein mahlt weiter. Die Stadt wird schweigen.',
      '[没|méi] [关系|guān xi] 。 [石磨|shí mò] [还|hái] [在|zài] [磨|mó] 。 [镇子|zhèn zi] [会|huì] [沉默|chén mò] 。', 'かまわん 。 [石臼|いしうす] は [回|まわ]り [続|つづ]ける 。 [町|まち] は [黙|だま]る だろう 。'),
    promise: L('Hits won’t stop him! Promise what the town will do!', '¡Los golpes no lo paran! ¡Prométele lo que hará el pueblo!', 'Os golpes não param ele! Promete o que a cidade fará!', 'Schläge halten ihn nicht auf! Versprich, was die Stadt tun wird!',
      '[打|dǎ] [他|tā] [没|méi] [用|yòng] ！ [告诉|gào su] [他|tā] [镇上|zhèn shang] [的|de] [人|rén] [会|huì] [做|zuò] [什么|shén me] ！', '[打|う]って も [止|と]まらない ！ [町|まち] の [人|ひと] が [何|なに] を する か 、 [約束|やくそく] して ！'),
    slow: L('The town… will speak? The stone… slows…', '¿El pueblo… hablará? La piedra… va más despacio…', 'A cidade… falará? A pedra… está mais devagar…', 'Die Stadt … wird sprechen? Der Stein … wird langsamer …',
      '[镇子|zhèn zi] … [会|huì] [说话|shuō huà] ？ [石磨|shí mò] … [慢|màn] [下来|xià lai] [了|le] …', '[町|まち] が … [話|はな]す ？ [石臼|いしうす] が … [遅|おそ]く なる …'),
    win: L('…Then tomorrow… we’ll grind. Wheat, not words.', '…Entonces mañana… moleremos. Trigo, no palabras.', '…Então amanhã… moeremos. Trigo, não palavras.', '… Dann werden wir morgen … mahlen. Weizen, nicht Wörter.',
      '… [那|nà] [明天|míng tiān] … [我们|wǒ men] [会|huì] [磨|mó] 。 [磨|mó] [麦子|mài zi] ， [不|bù] [磨|mó] [话|huà] 。', '… なら [明日|あした] は … [挽|ひ]こう 。 [言葉|ことば] で は なく 、 [麦|むぎ] を 。'),
  };
  const SPECIES = { es: { w: 'molinero', pl: 'molineros', g: 'm', en: 'Gray Miller' }, pt: { w: 'moleiro', pl: 'moleiros', g: 'm', en: 'Gray Miller' },
    de: { w: 'Müller', pl: 'Müller', gen: 'Müllers', g: 'm', en: 'Gray Miller' }, zh: { w: '[磨坊主|mò fáng zhǔ]', en: 'Gray Miller', g: 'm', cl: '个', cls: ['个', '位'] }, ja: { w: '[粉屋|こなや]', en: 'Gray Miller', g: 'm' } };
  const NAMES = {
    boss: L('the Gray Miller', 'el Molinero Gris', 'o Moleiro Cinza', 'der Graue Müller', '[灰色|huī sè] [磨坊主|mò fáng zhǔ]', '[灰色|はいいろ] の [粉屋|こなや]'),
    note: L('Oiled, as the warning said', 'Aceitados, como dijo el aviso', 'Lubrificadas, como disse o aviso', 'Geölt, wie die Warnung sagte', '[上|shàng] [好|hǎo] [油|yóu] [了|le] ， [就|jiù] [像|xiàng] [警告|jǐng gào] [说|shuō] [的|de]', '[注意書|ちゅういが]き の とおり 、 [油|あぶら] を さした'),
    noteNow: L('Oiled. It won’t stop!', 'Aceitados. ¡No se parará!', 'Lubrificadas. Não vai parar!', 'Geölt. Sie wird nicht stehen bleiben!', '[上|shàng] [好|hǎo] [油|yóu] [了|le] 。 [它|tā] [不会|bù huì] [停|tíng] ！', '[油|あぶら] を さした 。 [止|と]まらない ぞ ！'),
  };
  const LORE = ['El Molinero Gris: muele palabras hasta hacerlas polvo. Solo se para con una promesa.', 'O Moleiro Cinza: mói palavras até virarem pó. Só para com uma promessa.', 'Der Graue Müller mahlt Wörter zu Staub. Nur ein Versprechen hält ihn an.',
    '[灰色|huī sè] [磨坊主|mò fáng zhǔ] [把|bǎ] [话|huà] [磨|mó] [成|chéng] [灰|huī] 。 [只有|zhǐ yǒu] [承诺|chéng nuò] [能|néng] [让|ràng] [他|tā] [停|tíng] [下|xià] 。', '[灰色|はいいろ] の [粉屋|こなや] は 、 [言葉|ことば] を [粉|こな] に [挽|ひ]く 。 [約束|やくそく] だけ が それ を [止|と]める 。', 'The Gray Miller grinds words to dust. Only a promise stops him.'];
  // ------------------------------------------------------------ things to Look at (MOLT.look: the word, said aloud and glossed, then
  // what it is; molinar_future.js puts each one where it stands). id: its word (WORDS below, or the Past's); t: English
  const LOOKS = {
    'look.sails': { id: 'w.ml_stopped', t: 'The Great Mill’s {w.ml_sails}, stopped halfway round. When the wind comes, they creak… and stay where they are.' },
    'look.ivy': { id: 'w.ml_ivy', t: 'Ivy climbing the Great Mill’s plinth, thick and dark. Nobody has cut it in years.' },
    'look.dust': { id: 'w.ml_layer', t: 'A {w.ml_thick} gray layer of flour over the flagstones. There are footprints in it: only {trigo}’s.' },
    'look.sacks': { id: 'w.ml_flour', t: 'Old sacks of flour, gone gray and hard as stone.' },
    'look.tarps': { id: 'w.ml_canvas', t: 'Gray canvas tied over the stalls. Underneath, only crates.' },
    'look.empty': { id: 'w.ml_empty', t: 'The market square, empty. No voices, no carts, no music. Just the gray.' },
    'look.closed': { id: 'w.ml_closed', t: 'A board nailed across the bakery stall. «Closed», it says, in faded letters.' },
    'look.grass': { id: 'w.ml_grass', t: 'Grass pushing up between the flagstones. Nobody walks here any more.' },
    'look.moss': { id: 'w.ml_moss', t: 'Soft green moss on the bench where people used to sit and talk.' },
    'look.pots': { id: 'w.ml_withered', t: 'A {w.ml_flowerpot} by every door, and every flower in them withered and gray.' },
    'look.broom': { id: 'w.ml_broom', t: 'An old broom leaning on the bakery stall, its bristles gray with flour.' },
    'look.chalk': { id: 'w.ml_chalk', t: 'Chalk drawings on the flagstones, half rubbed out: windmills, a sun, people holding hands.' },
    'look.board': { id: 'w.ml_board', t: 'A notice board by the well, with a {w.ml_list} of plans for the town. It’s empty.' },
    'look.seeds': { id: 'w.ml_seeds', t: 'A sack of seeds, and a rusty {w.ml_wateringcan}. Someone was going to plant… and stopped.' },
    'look.handkerchief': { id: 'w.ml_handkerchief', t: 'A handkerchief on the bench, gray with flour. Somebody sneezed here a lot.' },
    'look.tiles': { id: 'w.ml_tile', t: 'Roof tiles fallen into the street. Up on the {w.ml_roof}, a hole the rain comes through.' },
    'look.flag': { id: 'w.ml_flag', t: 'A flag on the well’s pole, torn and gray. It used to be red and gold.' },
    'look.gate': { id: 'w.ml_gate', t: 'The town gate. Painted over it, half gone: «{w.ml_welcome}».' },
    'look.clock': { id: 'w.ml_grandclock', t: 'Ciro’s grandfather clock, stopped at ten past three. Its {w.ml_pendulum} hangs still.' },
    'look.well': { id: 'w.ml_well', t: 'The well. The bucket comes up full of gray flour instead of water.' },
    'look.pinwheel': { id: 'w.ml_pinwheel', t: '{dani}’s pinwheel on its stick. Red, yellow, blue and green… under the gray.' },
  };
  // the notice board's plans, one for each person who's awake (molinar_future.js: «Plans for the town»), in English with words
  const BOARD = {
    marga: '{marga}: next {w.ml_summer}, the {w.ml_harvest}. Everyone to the fields!', tomas: '{tomas}: fresh bread at {w.ml_dawn}, for every {w.ml_traveler}.',
    lupe: '{lupe}: a {w.ml_marketday}, with a {w.ml_flag} on every stall.', ciro: '{ciro}: the big clock will chime again.',
    dani: '{dani}: paint the {w.ml_gate}. Every color!', felix: '{felix}: «{w.ml_welcome}» to every {w.ml_traveler}.',
  };
  // ------------------------------------------------------------ the words of tomorrow (MOLT.registerWords: LEX items, kind 'word', ids
  // w.ml_<key>, none shared with the Past's table; «@w.ml_…» lists one of the Past's words that tomorrow uses again). key ~ en ~ es ~
  // pt ~ de ~ zh ~ ja ~ where (this file's keys). The first block: the words the main path already showed; then tomorrow's town.
  const WORDS = `@w.ml_climb ~ ~ ~ ~ ~ ~ ~ tube.seal
@w.ml_to_oil ~ ~ ~ ~ ~ ~ ~ tube.oil, tube.oiled
@w.ml_turn ~ ~ ~ ~ ~ ~ ~ trigo.demo1, tube.turn, trigo.demo3
@w.ml_gears ~ ~ ~ ~ ~ ~ ~ tube.oil
do ~ to do ~ hacer ~ fazer ~ tun ~ [做|zuò] ~ する ~ tube.turn, room1
tomorrow ~ tomorrow ~ =mañana ~ =amanhã ~ =morgen ~ [明天|míng tiān] ~ [明日|あした] ~ trigo.demo1, trigo.wake
grind ~ to grind ~ moler ~ moer ~ mahlen ~ [磨|mó] ~ [挽|ひ]く ~ trigo.demo1
carry ~ to carry, to take ~ llevar ~ levar ~ tragen ~ [搬|bān] ~ [運|はこ]ぶ ~ trigo.demo2
play ~ to play ~ jugar ~ brincar ~ spielen ~ [玩|wán] ~ [遊|あそ]ぶ ~ trigo.demo2
nextweek ~ next week ~ =la semana que viene ~ =na semana que vem ~ =nächste Woche ~ [下个星期|xià ge xīng qī] ~ [来週|らいしゅう] ~ trigo.demo2
sing ~ to sing ~ cantar ~ cantar ~ singen ~ [唱歌|chàng gē] ~ [歌|うた]う ~ trigo.demo2
if ~ if ~ =si ~ =se ~ =wenn ~ [如果|rú guǒ] ~ もし ~ warn
nobody ~ nobody ~ =nadie ~ =ninguém ~ =niemand ~ [没有|méi yǒu] [人|rén] ~ だれ も ~ warn, trigo.demo4
stop ~ to stop ~ pararse ~ parar ~ stehen bleiben ~ [停|tíng] ~ [止|と]まる ~ warn
bellows ~ bellows ~ el fuelle ~ o fole ~ der Blasebalg ~ [风箱|fēng xiāng] ~ ふいご ~ room1
cometrue ~ to come true, to happen ~ cumplirse ~ acontecer ~ passieren ~ [实现|shí xiàn] ~ [実現|じつげん] する ~ room1
plan ~ plan ~ el plan ~ o plano ~ der Plan ~ [计划|jì huà] ~ [予定|よてい] ~ room1
stopped ~ stopped, still ~ =parado ~ =parado ~ =still ~ [静止|jìng zhǐ] ~ [止|と]まった ~ look.sails
creak ~ to creak ~ crujir ~ ranger ~ knarren ~ [嘎吱|gā zhī] [响|xiǎng] ~ きしむ ~ trigo.demo3
rebuild ~ to rebuild ~ reconstruir ~ reconstruir ~ wieder aufbauen ~ [重建|chóng jiàn] ~ [建|た]て[直|なお]す ~ trigo.demo3
ivy ~ ivy ~ la hiedra ~ a hera ~ der Efeu ~ [常春藤|cháng chūn téng] ~ ツタ ~ look.ivy
moss ~ moss ~ el musgo ~ o musgo ~ das Moos ~ [青苔|qīng tái] ~ こけ ~ look.moss
silent ~ silent ~ =silencioso ~ =silencioso ~ =stumm ~ [沉默|chén mò] ~ [静|しず]か ~ trigo.t4
future ~ the future ~ el futuro ~ o futuro ~ die Zukunft ~ [未来|wèi lái] ~ [未来|みらい] ~ trigo.t4
dawn ~ dawn ~ el amanecer ~ o amanhecer ~ der Tagesanbruch ~ [黎明|lí míng] ~ [夜明|よあ]け ~ trigo.t1
wind ~ wind ~ el viento ~ o vento ~ der Wind ~ [风|fēng] ~ [風|かぜ] ~ trigo.t1, dani.d2
cloud ~ cloud ~ la nube ~ a nuvem ~ die Wolke ~ [云|yún] ~ [雲|くも] ~ trigo.t2
@w.ml_flour ~ ~ ~ ~ ~ ~ ~ trigo.t2, look.sacks
@w.ml_millstone ~ ~ ~ ~ ~ ~ ~ trigo.t3
promise ~ promise ~ la promesa ~ a promessa ~ das Versprechen ~ [承诺|chéng nuò] ~ [約束|やくそく] ~ trigo.t3, tomas.awake
frozen ~ frozen ~ =congelado ~ =congelado ~ =erstarrt ~ [冻住|dòng zhù] ~ [固|かた]まった ~ trigo.wake
wakeup ~ to wake up ~ despertar ~ acordar ~ aufwachen ~ [醒|xǐng] ~ [目|め] を [覚|さ]ます ~ trigo.wake
seal ~ seal ~ el sello ~ o selo ~ das Siegel ~ [封印|fēng yìn] ~ [封|ふう] ~ trigo.seal
crack ~ to crack ~ romperse ~ rachar ~ brechen ~ [裂开|liè kāi] ~ [割|わ]れる ~ trigo.seal, trigo.open
speak ~ to speak ~ hablar ~ falar ~ sprechen ~ [说话|shuō huà] ~ [話|はな]す ~ trigo.demo4
cough ~ to cough ~ toser ~ tossir ~ husten ~ [咳嗽|ké sou] ~ せき を する ~ trigo.demo4
sneeze ~ to sneeze ~ estornudar ~ espirrar ~ niesen ~ [打喷嚏|dǎ pēn tì] ~ くしゃみ を する ~ trigo.demo4
sweep ~ to sweep ~ barrer ~ varrer ~ fegen ~ [扫|sǎo] ~ [掃|は]く ~ trigo.demo4, tomas.demo
cover ~ to cover ~ cubrir ~ cobrir ~ bedecken ~ [盖住|gài zhù] ~ [覆|おお]う ~ trigo.demo4
@w.ml_sails ~ ~ ~ ~ ~ ~ ~ look.sails
layer ~ layer ~ la capa ~ a camada ~ die Schicht ~ [层|céng] ~ [層|そう] ~ look.dust
thick ~ thick ~ =grueso ~ =grosso ~ =dick ~ [厚|hòu] ~ [厚|あつ]い ~ look.dust
@w.ml_canvas ~ ~ ~ ~ ~ ~ ~ look.tarps
empty ~ empty ~ =vacío ~ =vazio ~ =leer ~ [空|kōng] ~ [空|から]っぽ ~ look.empty
closed ~ closed ~ =cerrado ~ =fechado ~ =geschlossen ~ [关门|guān mén] ~ [閉店|へいてん] ~ look.closed, tomas.t1
grass ~ grass ~ la hierba ~ a grama ~ das Gras ~ [草|cǎo] ~ [草|くさ] ~ look.grass
flowerpot ~ flowerpot ~ la maceta ~ o vaso de flor ~ der Blumentopf ~ [花盆|huā pén] ~ [植木鉢|うえきばち] ~ look.pots, lupe.l2
withered ~ withered ~ =marchito ~ =murcho ~ =verwelkt ~ [枯萎|kū wěi] ~ [枯|か]れた ~ look.pots
broom ~ broom ~ la escoba ~ a vassoura ~ der Besen ~ [扫帚|sào zhou] ~ ほうき ~ look.broom, tomas.t1
chalk ~ chalk ~ la tiza ~ o giz ~ die Kreide ~ [粉笔|fěn bǐ] ~ チョーク ~ look.chalk, dani.d1
board ~ notice board ~ la cartelera ~ o mural ~ das Schwarze Brett ~ [布告栏|bù gào lán] ~ [掲示板|けいじばん] ~ look.board
list ~ list ~ la lista ~ a lista ~ die Liste ~ [清单|qīng dān] ~ リスト ~ look.board
handkerchief ~ handkerchief ~ el pañuelo ~ o lenço ~ das Taschentuch ~ [手帕|shǒu pà] ~ ハンカチ ~ look.handkerchief, tomas.t3
tile ~ roof tile ~ la teja ~ a telha ~ der Dachziegel ~ [瓦片|wǎ piàn] ~ [瓦|かわら] ~ look.tiles
roof ~ roof ~ el tejado ~ o telhado ~ das Dach ~ [屋顶|wū dǐng] ~ [屋根|やね] ~ look.tiles
flag ~ flag ~ la bandera ~ a bandeira ~ die Fahne ~ [旗子|qí zi] ~ [旗|はた] ~ look.flag, lupe.l3
gate ~ gate ~ el portón ~ o portão ~ das Tor ~ [大门|dà mén] ~ [門|もん] ~ look.gate, felix.f2, dani.d3, dani.demo
welcome ~ welcome ~ =bienvenidos ~ =bem-vindos ~ =Willkommen ~ [欢迎|huān yíng] ~ ようこそ ~ look.gate, felix.f1
@w.ml_grandclock ~ ~ ~ ~ ~ ~ ~ look.clock
@w.ml_pendulum ~ ~ ~ ~ ~ ~ ~ look.clock
@w.ml_well ~ ~ ~ ~ ~ ~ ~ look.well
pinwheel ~ pinwheel ~ el molinillo ~ o cata-vento ~ das Windrad ~ [风车|fēng chē] ~ [風車|かざぐるま] ~ look.pinwheel, dani.d2
summer ~ summer ~ el verano ~ o verão ~ der Sommer ~ [夏天|xià tiān] ~ [夏|なつ] ~ marga.m1, lupe.l1
harvest ~ harvest ~ la cosecha ~ a colheita ~ die Ernte ~ [收成|shōu cheng] ~ [収穫|しゅうかく] ~ marga.m1
seeds ~ seeds ~ las semillas ~ as sementes ~ die Samen ~ [种子|zhǒng zi] ~ [種|たね] ~ look.seeds, marga.m2
wateringcan ~ watering can ~ la regadera ~ o regador ~ die Gießkanne ~ [喷壶|pēn hú] ~ じょうろ ~ look.seeds, marga.m2
only ~ only ~ =solo ~ =só ~ =nur ~ [只|zhǐ] ~ だけ ~ marga.m2
wrinkles ~ wrinkles ~ las arrugas ~ as rugas ~ die Falten ~ [皱纹|zhòu wén] ~ しわ ~ marga.m3
nextmonth ~ next month ~ =el mes que viene ~ =no mês que vem ~ =nächsten Monat ~ [下|xià] [个|gè] [月|yuè] ~ [来月|らいげつ] ~ marga.demo
sow ~ to sow ~ sembrar ~ semear ~ säen ~ [播种|bō zhǒng] ~ [種|たね] を まく ~ marga.demo
reap ~ to harvest ~ cosechar ~ colher ~ ernten ~ [收割|shōu gē] ~ [収穫|しゅうかく] する ~ marga.demo
together ~ together ~ =juntos ~ =juntos ~ =zusammen ~ [一起|yī qǐ] ~ いっしょ に ~ marga.demo
@w.ml_wheat ~ ~ ~ ~ ~ ~ ~ marga.demo
traveler ~ traveler ~ el viajero ~ o viajante ~ der Reisende ~ [旅人|lǚ rén] ~ [旅|たび] の [人|ひと] ~ tomas.t2, felix.f1, felix.demo
neighbor ~ neighbor ~ el vecino ~ o vizinho ~ der Nachbar ~ [邻居|lín jū] ~ [近所|きんじょ] の [人|ひと] ~ tomas.t2
open ~ to open ~ abrir ~ abrir ~ aufmachen ~ [开|kāi] ~ [開|あ]ける ~ tomas.demo
@w.ml_bake ~ ~ ~ ~ ~ ~ ~ tomas.demo
@w.ml_buy ~ ~ ~ ~ ~ ~ ~ tomas.demo
fruit ~ fruit ~ la fruta ~ a fruta ~ das Obst ~ [水果|shuǐ guǒ] ~ くだもの ~ lupe.l1
sweet ~ sweet ~ =dulce ~ =doce ~ =süß ~ [甜|tián] ~ [甘|あま]い ~ lupe.l1
marketday ~ market day ~ el día de mercado ~ o dia de feira ~ der Markttag ~ [赶集日|gǎn jí rì] ~ [市|いち] の [日|ひ] ~ lupe.l3
plant ~ to plant ~ plantar ~ plantar ~ pflanzen ~ [种|zhòng] ~ [植|う]える ~ lupe.demo, lupe.l2
decorate ~ to decorate ~ adornar ~ enfeitar ~ schmücken ~ [装饰|zhuāng shì] ~ [飾|かざ]る ~ lupe.demo
invite ~ to invite ~ invitar ~ convidar ~ einladen ~ [邀请|yāo qǐng] ~ [招待|しょうたい] する ~ lupe.demo
cane ~ cane ~ el bastón ~ a bengala ~ der Stock ~ [拐杖|guǎi zhàng] ~ [杖|つえ] ~ ciro.c1
still ~ still (yet) ~ =todavía ~ =ainda ~ =noch ~ [还|hái] ~ まだ ~ ciro.c1
grayhair ~ gray hair ~ las canas ~ os cabelos brancos ~ =graue Haare ~ [白发|bái fà] ~ [白髪|しらが] ~ ciro.c2
memory ~ a memory ~ el recuerdo ~ a lembrança ~ die Erinnerung ~ [回忆|huí yì] ~ [思|おも]い[出|で] ~ ciro.c2
@w.ml_sundial ~ ~ ~ ~ ~ ~ ~ ciro.c3
@w.ml_fix ~ ~ ~ ~ ~ ~ ~ ciro.demo
chime ~ to chime ~ sonar ~ tocar ~ schlagen ~ [响|xiǎng] ~ [鳴|な]る ~ ciro.demo
forget ~ to forget ~ olvidar ~ esquecer ~ vergessen ~ [忘记|wàng jì] ~ [忘|わす]れる ~ ciro.demo
colorful ~ colorful ~ =colorido ~ =colorido ~ =bunt ~ [彩色|cǎi sè] ~ カラフル ~ dani.d3
nextyear ~ next year ~ =el año que viene ~ =no ano que vem ~ =nächstes Jahr ~ [明年|míng nián] ~ [来年|らいねん] ~ dani.demo
@w.ml_paint ~ ~ ~ ~ ~ ~ ~ dani.demo
celebrate ~ to celebrate ~ celebrar ~ comemorar ~ feiern ~ [庆祝|qìng zhù] ~ [祝|いわ]う ~ dani.demo
greet ~ to greet ~ saludar ~ cumprimentar ~ begrüßen ~ [打招呼|dǎ zhāo hu] ~ あいさつ する ~ felix.demo
visit ~ to visit ~ visitar ~ visitar ~ besuchen ~ [参观|cān guān] ~ [訪|たず]ねる ~ felix.demo
share ~ to share ~ compartir ~ dividir ~ teilen ~ [分享|fēn xiǎng] ~ [分|わ]ける ~ felix.demo`;
  // the table keys teach their words when said (time_molinar.js MOLT.teach): 'f:' + the key
  const stamp = (O, pre) => Object.entries(O || {}).forEach(([k, T0]) => { if (T0 && typeof T0 === 'object' && !T0._mk) T0._mk = pre + k; });
  stamp(LINES, 'f:'); stamp(DEMO, 'f:'); stamp(LOOKS, 'f:'); stamp(FIGHT, 'f:f.');
  const en = (T, l) => (T && (T['en_' + l] || T.en)) || '';
  return { L, CAST, LINES, DEMO, MARKS, CARDS, TIPS, TASKS, FV, PLAN, ROOMS, FIGHT, SPECIES, NAMES, LORE, LOOKS, BOARD, WORDS, en };
})();
