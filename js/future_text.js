'use strict';
// The Future («el Mañana», DESIGN.md 13.2 and 17.2b; game/REGIONS.md): every word the realm says, in es / pt / de / zh / ja and
// the English the weave mixes from, plus the realm's graders (a promise in the future, a wish in the conditional, an «if» trap,
// the plan to ring the bell). zh / ja are in CJK.md's notation. Used by future.js (the place) and future_scenes.js (the story).
//   FTXT.ML[key]     a mixed line: T(en, es, pt, de, zh, ja)           (STORY.sayInline: the weave mixes it, EN on request)
//   FTXT.DEMO[key]   a demonstration, lines.js shape, merged into LINES (STORY.demoAt: whole in the language, the shown words
//                    glossed: FTXT.MARKS[key])
//   FTXT.HUSH[id]    a frozen person's surviving words (*starred*), for STORY.sayHushed
//   FTXT.TASK[id]    a promise to wake someone: the verb, the thing, the model sentence, the frame
//   FTXT.grade.*     future(text, id), wish(text), trap(text), ring(text) → { ok, letter, reason, tip, heard, kind }
const FTXT = (() => {
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const L1 = (es, pt, de, zh, ja, en) => ({ es: [es], pt: [pt], de: [de], zh: [zh], ja: [ja], en: [en] });
  const lang = () => (typeof LEX !== 'undefined' && LEX.lang) || 'es';
  const isC = l => l === 'zh' || l === 'ja';
  const pick = (o, l) => { l = l || lang(); return o ? (o[l] != null ? o[l] : o.en) : ''; };
  // the plain text in the save's language (zh / ja: the mode's text, never brackets)
  const plain = (s, l) => { l = l || lang(); return isC(l) && typeof CJK !== 'undefined' ? CJK.plain(String(s || ''), { lang: l }) : String(s || ''); };

  // ------------------------------------------------------------ names
  const NAMES = {
    future: T('the Future', 'el Mañana', 'o Amanhã', 'das Morgen', '[明天|míng tiān]', '[明日|あした]'),
    silence: T('the Great Silence', 'el Gran Silencio', 'o Grande Silêncio', 'die Große Stille', '[大寂静|Dà Jì jìng]', '[大静寂|だいせいじゃく]'),
    fest: T('the Festival of Voices', 'la Fiesta de las Voces', 'a Festa das Vozes', 'das Fest der Stimmen', '[声音节|Shēng yīn jié]', '「 [声|こえ] の [祭|まつ]り 」'),
    motto: T('Every voice counts', 'Toda voz cuenta', 'Toda voz conta', 'Jede Stimme zählt', '[每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù]', 'どの [声|こえ] も [大切|たいせつ]'),
    cont: T('To be continued…', 'Continuará…', 'Continua…', 'Fortsetzung folgt…', '[未完待续|wèi wán dài xù] ……', 'つづく …'),
    banner: T('FESTIVAL OF VOICES', 'FIESTA DE LAS VOCES', 'FESTA DAS VOZES', 'FEST DER STIMMEN', '[声音节|Shēng yīn jié]', '[声|こえ] の [祭|まつ]り'),
  };
  // the speakers (STORY.show swaps these Latin names for their zh / ja ones itself)
  const WHO = { noa: 'Noa', rosa: 'Rosa', tito: 'Tito', marta: 'Marta', bruno: 'Bruno', nico: 'Nico' };

  // ------------------------------------------------------------ mixed lines: T(en, es, pt, de, zh, ja)
  // Noa (older, an echo from tomorrow) talks to you as the friend she is: tú / você / du / 你 / casual ja. Rosa, Tito, Marta and
  // Bruno are grown-ups: polite in ja. Nico is a teen now: casual. Nobody ever genders the player.
  const ML = {
    'f.arr1': T('You came… just like I wrote in my notebook. It’s me, Noa. Older, I know.',
      'Viniste… tal como lo escribí en mi cuaderno. Soy yo, Noa. Mayor, ya lo sé.',
      'Você veio… do jeitinho que eu escrevi no meu caderno. Sou eu, a Noa. Mais velha, eu sei.',
      'Du bist gekommen… genau wie ich es in mein Heft geschrieben habe. Ich bin’s, Noa. Älter, ich weiß.',
      '[你|nǐ] [来|lái] [了|le] … [就|jiù] [像|xiàng] [我|wǒ] [在|zài] [本子|běn zi] [里|lǐ] [写|xiě] [的|de] [那样|nà yàng] 。 [是|shì] [我|wǒ] ， [诺娅|Nuò yà] 。 [我|wǒ] [老|lǎo] [了|le] [一些|yī xiē] ， [我|wǒ] [知道|zhī dào] 。',
      '[来|き]て くれた ん だ ね … ノート に [書|か]いた とおり 。 わたし だ よ 、 ノア 。 [大人|おとな] に なった でしょ 。'),
    'f.arr3': T('In your today, yes. This is tomorrow: Alba as it will be if nobody speaks up.',
      'En tu hoy, sí. Esto es el mañana: Alba como será si nadie habla.',
      'No seu hoje, sim. Isto é o amanhã: Alba como vai ser se ninguém falar.',
      'In deinem Heute, ja. Das hier ist das Morgen: Alba, wie es sein wird, wenn niemand spricht.',
      '[在|zài] [你|nǐ] [的|de] [今天|jīn tiān] ， [是|shì] [的|de] 。 [这里|zhè lǐ] [是|shì] [明天|míng tiān] ： [如果|rú guǒ] [没有|méi yǒu] [人|rén] [说话|shuō huà] ， [阿尔巴|Ā ěr bā] [就|jiù] [会|huì] [变成|biàn chéng] [这样|zhè yàng] 。',
      'あなた の [今日|きょう] で は 、 そう 。 ここ は [明日|あした] 。 だれ も [話|はな]さなかったら 、 アルバ は こう なる の 。'),
    'f.arr4': T('His silence spread everywhere. The eight {w.bell:pl} cracked, one by one. People stopped talking… and froze.',
      'Su silencio se extendió por todas partes. Las ocho campanas se rompieron, una por una. La gente dejó de hablar… y se quedó quieta.',
      'O silêncio dele se espalhou por todo lado. Os oito sinos racharam, um por um. As pessoas pararam de falar… e congelaram.',
      'Seine Stille hat sich überall ausgebreitet. Die acht Glocken sind gesprungen, eine nach der anderen. Die Leute haben aufgehört zu reden… und sind erstarrt.',
      '[他|tā] [的|de] [寂静|jì jìng] [传遍|chuán biàn] [了|le] [每个|měi gè] [地方|dì fang] 。 [八|bā] [口|kǒu] [钟|zhōng] [一|yī] [口|kǒu] [一|yī] [口|kǒu] [地|de] [裂|liè] [了|le] 。 [人们|rén men] [不再|bù zài] [说话|shuō huà] … [然后|rán hòu] [就|jiù] [僵住|jiāng zhù] [了|le] 。',
      'あの [人|ひと] の [静寂|せいじゃく] が 、 どこ に でも [広|ひろ]がった 。 [八|やっ]つ の [鐘|かね] は 、 [一|ひと]つ ずつ ひび が [入|はい]った 。 みんな [話|はな]さなく なって … [固|かた]まった の 。'),
    'f.arr5': T('But tomorrow isn’t written yet. Come to the plaza. I’ll show you.',
      'Pero el mañana todavía no está escrito. Ven a la plaza. Te lo enseñaré.',
      'Mas o amanhã ainda não está escrito. Vem pra praça. Eu vou te mostrar.',
      'Aber das Morgen ist noch nicht geschrieben. Komm zum Platz. Ich werde es dir zeigen.',
      '[可是|kě shì] [明天|míng tiān] [还|hái] [没有|méi yǒu] [写|xiě] [好|hǎo] 。 [到|dào] [广场|guǎng chǎng] [来|lái] 。 [我|wǒ] [会|huì] [给|gěi] [你|nǐ] [看|kàn] 。',
      'でも 、 [明日|あした] は まだ [書|か]かれて ない 。 [広場|ひろば] に [来|き]て 。 [見|み]せて あげる 。'),
    // the plaza: Nico, and what Noa shows you
    'f.pl1': T('This is Nico. He played here every day. Listen: he still has a few words left.',
      'Este es Nico. Jugaba aquí todos los días. Escucha: todavía le quedan unas palabras.',
      'Esse é o Nico. Ele brincava aqui todo dia. Escuta: ainda sobraram umas palavras.',
      'Das ist Nico. Er hat hier jeden Tag gespielt. Hör mal: Ein paar Wörter hat er noch.',
      '[这|zhè] [是|shì] [尼科|Ní kē] 。 [他|tā] [以前|yǐ qián] [每天|měi tiān] [在|zài] [这里|zhè lǐ] [玩|wán] 。 [你|nǐ] [听|tīng] ： [他|tā] [还|hái] [剩下|shèng xià] [几|jǐ] [个|gè] [词|cí] 。',
      'この [子|こ] は ニコ 。 [毎日|まいにち] ここ で [遊|あそ]んで た の 。 [聞|き]いて 。 まだ [少|すこ]し [言葉|ことば] が [残|のこ]って る 。'),
    'f.nico.wake': T('We’ll… play? We’ll play! Tomorrow we’ll play!',
      '¿Ju… jugaremos? ¡Jugaremos! ¡Mañana jugaremos!',
      'A gente… vai brincar? Vamos brincar! Amanhã a gente vai brincar!',
      'Wir werden… spielen? Wir werden spielen! Morgen werden wir spielen!',
      '[我们|wǒ men] … [会|huì] [玩|wán] ？ [我们|wǒ men] [会|huì] [玩|wán] ！ [明天|míng tiān] [我们|wǒ men] [会|huì] [玩|wán] ！',
      '[遊|あそ]ぶ … つもり ？ [遊|あそ]ぶ ！ [明日|あした] 、 [遊|あそ]ぶ ぞ ！'),
    'f.pl2': T('See? A plan. A promise. Words about tomorrow wake them up.',
      '¿Ves? Un plan. Una promesa. Las palabras de mañana los despiertan.',
      'Viu? Um plano. Uma promessa. As palavras de amanhã acordam eles.',
      'Siehst du? Ein Plan. Ein Versprechen. Wörter über morgen wecken sie auf.',
      '[看到|kàn dào] [了|le] [吗|ma] ？ [一个|yī gè] [计划|jì huà] ， [一个|yī gè] [承诺|chéng nuò] 。 [关于|guān yú] [明天|míng tiān] [的|de] [话|huà] [能|néng] [叫醒|jiào xǐng] [他们|tā men] 。',
      'ね ？ [予定|よてい] 。 [約束|やくそく] 。 [明日|あした] の [言葉|ことば] が 、 みんな を [起|お]こす の 。'),
    'f.pl3': T('In this tomorrow, nobody made plans anymore, so nothing could change. Give them their tomorrow back: say what WILL happen.',
      'En este mañana, ya nadie hacía planes, y nada podía cambiar. Devuélveles su mañana: di lo que pasará.',
      'Neste amanhã, ninguém fazia mais planos, e nada podia mudar. Devolve o amanhã deles: diz o que vai acontecer.',
      'In diesem Morgen hat niemand mehr Pläne gemacht, also konnte sich nichts ändern. Gib ihnen ihr Morgen zurück: Sag, was passieren wird.',
      '[在|zài] [这个|zhè ge] [明天|míng tiān] ， [没有|méi yǒu] [人|rén] [再|zài] [做|zuò] [计划|jì huà] ， [所以|suǒ yǐ] [什么|shén me] [都|dōu] [变|biàn] [不|bù] [了|liǎo] 。 [把|bǎ] [明天|míng tiān] [还给|huán gěi] [他们|tā men] ： [说说|shuō shuo] [将要|jiāng yào] [发生|fā shēng] [的|de] [事|shì] 。',
      'この [明日|あした] で は 、 だれ も [予定|よてい] を [立|た]てなく なった 。 だから 、 [何|なに] も [変|か]われなかった 。 みんな に [明日|あした] を [返|かえ]して あげて 。 これから [起|お]きる こと を [言|い]って 。'),
    'f.pl4': T('Rosa, Tito, Marta… they’re all around the plaza, frozen. Wake each one with a promise.',
      'Rosa, Tito, Marta… están todos por la plaza, quietos. Despierta a cada uno con una promesa.',
      'A Rosa, o Tito, a Marta… estão todos pela praça, parados. Acorda cada um com uma promessa.',
      'Rosa, Tito, Marta… sie sind alle hier am Platz, erstarrt. Weck jeden mit einem Versprechen.',
      '[罗莎|Luó shā] [奶奶|nǎi nai] 、 [蒂托|Dì tuō] 、 [玛尔塔|Mǎ ěr tǎ] … [他们|tā men] [都|dōu] [在|zài] [广场|guǎng chǎng] [这边|zhè biān] ， [一动|yī dòng] [不|bù] [动|dòng] 。 [用|yòng] [一个|yī gè] [承诺|chéng nuò] [叫醒|jiào xǐng] [每|měi] [一|yī] [个|gè] [人|rén] 。',
      'ロサ さん 、 ティト 、 マルタ … みんな [広場|ひろば] の あたり で [固|かた]まって る 。 [一人|ひとり] ずつ 、 [約束|やくそく] で [起|お]こして 。'),
    // after waking: Rosa, Tito, Marta
    'f.rosa.wake': T('I’ll sell apples? Yes! Tomorrow I’ll sell the best apples in Alba!',
      '¿Venderé manzanas? ¡Sí! ¡Mañana venderé las mejores manzanas de Alba!',
      'Eu vou vender maçãs? Vou! Amanhã eu vou vender as melhores maçãs de Alba!',
      'Ich werde Äpfel verkaufen? Ja! Morgen werde ich die besten Äpfel von Alba verkaufen!',
      '[我|wǒ] [会|huì] [卖|mài] [苹果|píng guǒ] ？ [对|duì] ！ [明天|míng tiān] [我|wǒ] [会|huì] [卖|mài] [阿尔巴|Ā ěr bā] [最|zuì] [好|hǎo] [的|de] [苹果|píng guǒ] ！',
      'りんご を [売|う]る ？ ええ ！ [明日|あした] は 、 アルバ で いちばん の りんご を [売|う]る つもり です よ ！'),
    'f.rosa.chat': T('Tomorrow… I hadn’t said that word in years. Thank you, dear.',
      'Mañana… hacía años que no decía esa palabra. Gracias, cariño.',
      'Amanhã… fazia anos que eu não falava essa palavra. Obrigada, meu bem.',
      'Morgen… dieses Wort habe ich seit Jahren nicht gesagt. Danke, Liebes.',
      '[明天|míng tiān] … [这个|zhè ge] [词|cí] [我|wǒ] [好多|hǎo duō] [年|nián] [没|méi] [说|shuō] [了|le] 。 [谢谢|xiè xie] [你|nǐ] ， [孩子|hái zi] 。',
      '[明日|あした] … その [言葉|ことば] 、 [何年|なんねん] も [言|い]って いなかった わ 。 ありがとう ね 。'),
    'f.tito.wake': T('I’ll play? Of course! Tomorrow I’ll play in the plaza, and everyone will sing!',
      '¿Tocaré? ¡Claro! ¡Mañana tocaré en la plaza, y todos cantarán!',
      'Eu vou tocar? Claro! Amanhã eu vou tocar na praça, e todo mundo vai cantar!',
      'Ich werde spielen? Na klar! Morgen werde ich auf dem Platz spielen, und alle werden singen!',
      '[我|wǒ] [会|huì] [弹|tán] ？ [当然|dāng rán] ！ [明天|míng tiān] [我|wǒ] [会|huì] [在|zài] [广场|guǎng chǎng] [上|shang] [弹|tán] ， [大家|dà jiā] [都|dōu] [会|huì] [唱歌|chàng gē] ！',
      '[弾|ひ]く ？ もちろん ！ [明日|あした] は [広場|ひろば] で [弾|ひ]く つもり です 。 みんな [歌|うた]う でしょう ！'),
    'f.tito.chat': T('My fingers remember every song. Tomorrow, the plaza will dance.',
      'Mis dedos recuerdan todas las canciones. Mañana, la plaza bailará.',
      'Os meus dedos lembram de todas as músicas. Amanhã, a praça vai dançar.',
      'Meine Finger erinnern sich an jedes Lied. Morgen wird der Platz tanzen.',
      '[我|wǒ] [的|de] [手指|shǒu zhǐ] [记得|jì de] [每|měi] [一|yī] [首|shǒu] [歌|gē] 。 [明天|míng tiān] ， [广场|guǎng chǎng] [会|huì] [跳舞|tiào wǔ] 。',
      '[指|ゆび] が 、 ぜんぶ の [歌|うた] を [覚|おぼ]えて います 。 [明日|あした] は 、 [広場|ひろば] が [踊|おど]る でしょう 。'),
    'f.marta.wake': T('We’ll bake bread! Tomorrow the oven will be warm again, and Alba will smell of bread.',
      '¡Hornearemos pan! Mañana el horno estará caliente otra vez, y Alba olerá a pan.',
      'Vamos assar pão! Amanhã o forno vai estar quente de novo, e Alba vai cheirar a pão.',
      'Wir werden Brot backen! Morgen wird der Ofen wieder warm sein, und Alba wird nach Brot duften.',
      '[我们|wǒ men] [要|yào] [烤|kǎo] [面包|miàn bāo] ！ [明天|míng tiān] [烤箱|kǎo xiāng] [会|huì] [再|zài] [热|rè] [起来|qǐ lai] ， [阿尔巴|Ā ěr bā] [会|huì] [满|mǎn] [是|shì] [面包|miàn bāo] [香|xiāng] 。',
      'パン を [焼|や]く ん です ね ！ [明日|あした] は オーブン が また [温|あたた]かく なる でしょう 。 アルバ じゅう 、 パン の いい におい に なります よ 。'),
    'f.marta.chat': T('Tomorrow I’ll bake a loaf just for you. And one for {mimo}.',
      'Mañana hornearé un pan solo para ti. Y otro para {mimo}.',
      'Amanhã eu vou assar um pão só pra você. E outro pro {mimo}.',
      'Morgen werde ich ein Brot nur für dich backen. Und eins für {mimo}.',
      '[明天|míng tiān] [我|wǒ] [会|huì] [专门|zhuān mén] [给|gěi] [你|nǐ] [烤|kǎo] [一个|yī gè] [面包|miàn bāo] 。 [也|yě] [给|gěi] {mimo} [烤|kǎo] [一个|yī gè] 。',
      '[明日|あした] 、 あなた の ため に パン を [焼|や]く つもり です 。 {mimo} の ぶん も ね 。'),
    'f.nico.chat': T('Tomorrow, the plaza. Don’t forget, okay? You promised!',
      'Mañana, en la plaza. No te olvides, ¿eh? ¡Lo prometiste!',
      'Amanhã, na praça. Não esquece, tá? Você prometeu!',
      'Morgen, auf dem Platz. Nicht vergessen, ja? Du hast es versprochen!',
      '[明天|míng tiān] ， [广场|guǎng chǎng] 。 [别|bié] [忘|wàng] [了|le] ， [好|hǎo] [吗|ma] ？ [你|nǐ] [答应|dā ying] [过|guo] [的|de] ！',
      '[明日|あした] 、 [広場|ひろば] で ね 。 [忘|わす]れない で よ ？ [約束|やくそく] した から ね ！'),
    // the report to Noa, and on to Bruno
    'f.rep1': T('Three voices back! Listen… the plaza is almost humming.',
      '¡Tres voces de vuelta! Escucha… la plaza casi canta.',
      'Três vozes de volta! Escuta… a praça quase canta.',
      'Drei Stimmen sind zurück! Hör mal… der Platz summt fast.',
      '[三|sān] [个|gè] [声音|shēng yīn] [回来|huí lái] [了|le] ！ [你|nǐ] [听|tīng] … [广场|guǎng chǎng] [快|kuài] [要|yào] [唱|chàng] [起来|qǐ lai] [了|le] 。',
      '[三|みっ]つ の [声|こえ] が [戻|もど]った ！ [聞|き]いて … [広場|ひろば] が [歌|うた]いだし そう 。'),
    'f.rep2': T('Now Bruno, at his yard. Hushlings nest there now. He’ll teach {mimo} to fight in tomorrow: here, what you say WILL happen… hits harder.',
      'Ahora Bruno, en su patio. Ahí anidan los calladitos. Él le enseñará a {mimo} a pelear en el mañana: aquí, lo que dices que pasará… pega más fuerte.',
      'Agora o Bruno, no quintal dele. Os caladinhos fizeram ninho lá. Ele vai ensinar o {mimo} a lutar no amanhã: aqui, o que você diz que vai acontecer… bate mais forte.',
      'Jetzt Bruno, in seinem Hof. Dort nisten jetzt Schweiglinge. Er wird {mimo} zeigen, wie man im Morgen kämpft: Hier trifft das, was passieren wird… härter.',
      '[现在|xiàn zài] [去|qù] [找|zhǎo] [布鲁诺|Bù lǔ nuò] ， [他|tā] [在|zài] [院子|yuàn zi] [里|lǐ] 。 [那里|nà lǐ] [有|yǒu] [小默默|xiǎo mò mò] 。 [他|tā] [会|huì] [教|jiāo] {mimo} [在|zài] [明天|míng tiān] [战斗|zhàn dòu] ： [在|zài] [这里|zhè lǐ] ， [你|nǐ] [说|shuō] [将要|jiāng yào] [发生|fā shēng] [的|de] [事|shì] … [会|huì] [打|dǎ] [得|de] [更|gèng] [重|zhòng] 。',
      '[次|つぎ] は ブルーノ 。 [庭|にわ] に いる よ 。 そこ に だまりっこ が [住|す]みついて る 。 ブルーノ が {mimo} に [明日|あした] の [戦|たたか]い [方|かた] を [教|おし]えて くれる 。 ここ で は 、 これから [起|お]きる こと を [言|い]う と … もっと [強|つよ]く [当|あ]たる の 。'),
    'f.noa.chat': T('Every word you say about tomorrow brings a little color back. Can you see it?',
      'Cada palabra que dices sobre el mañana trae un poco de color. ¿Lo ves?',
      'Cada palavra que você diz sobre o amanhã traz um pouco de cor. Está vendo?',
      'Jedes Wort, das du über morgen sagst, bringt ein bisschen Farbe zurück. Siehst du es?',
      '[你|nǐ] [说|shuō] [的|de] [每|měi] [一|yī] [句|jù] [关于|guān yú] [明天|míng tiān] [的|de] [话|huà] ， [都|dōu] [带回|dài huí] [一点|yī diǎn] [颜色|yán sè] 。 [你|nǐ] [看到|kàn dào] [了|le] [吗|ma] ？',
      '[明日|あした] の [言葉|ことば] を [一|ひと]つ [言|い]う たび に 、 [色|いろ] が [少|すこ]し [戻|もど]る 。 [見|み]える ？'),
    // Bruno
    'f.bruno.wake': T('We’ll train? Ha! We will! And {mimo} will be stronger than ever.',
      '¿Entrenaremos? ¡Ja! ¡Entrenaremos! Y {mimo} será más fuerte que nunca.',
      'A gente vai treinar? Rá! Vamos treinar! E o {mimo} vai ficar mais forte do que nunca.',
      'Wir werden trainieren? Ha! Das werden wir! Und {mimo} wird stärker sein als je zuvor.',
      '[我们|wǒ men] [会|huì] [练功|liàn gōng] ？ [哈|hā] ！ [当然|dāng rán] ！ {mimo} [会|huì] [比|bǐ] [以前|yǐ qián] [更|gèng] [强|qiáng] 。',
      '[練習|れんしゅう] ？ はは ！ [練習|れんしゅう] しましょう ！ {mimo} は もっと [強|つよ]く なる でしょう 。'),
    'f.b2': T('Did you see? It waited… then hit twice as hard. Say what {mimo} WILL do, and it lands next turn, stronger. Say two, and they stack!',
      '¿Viste? Esperó… y pegó el doble de fuerte. Di lo que hará {mimo}, y llega el próximo turno, más fuerte. ¡Di dos, y se suman!',
      'Viu? Ele esperou… e bateu com o dobro da força. Diz o que o {mimo} vai fazer, e chega no próximo turno, mais forte. Diz dois, e eles se somam!',
      'Hast du gesehen? {mimo} hat gewartet… und doppelt so fest getroffen. Sag, was {mimo} tun wird, und es kommt in der nächsten Runde, stärker. Sag zwei, und sie addieren sich!',
      '[看到|kàn dào] [了|le] [吗|ma] ？ {mimo} [等|děng] [了|le] [一下|yī xià] … [然后|rán hòu] [打|dǎ] [得|de] [重|zhòng] [两|liǎng] [倍|bèi] 。 [说出|shuō chū] {mimo} [将要|jiāng yào] [做|zuò] [的|de] [事|shì] ， [下|xià] [一|yī] [回合|huí hé] [就|jiù] [会|huì] [更|gèng] [强|qiáng] 。 [说|shuō] [两|liǎng] [个|gè] ， [就|jiù] [会|huì] [叠加|dié jiā] ！',
      '[見|み]ました か ？ [待|ま]って … [二倍|にばい] の [強|つよ]さ で [当|あ]たりました 。 {mimo} が これから する こと を [言|い]う と 、 [次|つぎ] の ターン に [強|つよ]く [当|あ]たります 。 [二|ふた]つ [言|い]えば 、 [重|かさ]なります よ ！'),
    'f.b.go': T('Hushlings at the yard gate! Show me, in tomorrow’s words!',
      '¡Calladitos en la puerta del patio! ¡Muéstrame, con palabras de mañana!',
      'Caladinhos no portão do quintal! Me mostra, com palavras de amanhã!',
      'Schweiglinge am Hoftor! Zeig’s mir, mit Wörtern von morgen!',
      '[院子|yuàn zi] [门口|mén kǒu] [有|yǒu] [小默默|xiǎo mò mò] ！ [用|yòng] [明天|míng tiān] [的|de] [话|huà] [给|gěi] [我|wǒ] [看看|kàn kan] ！',
      '[庭|にわ] の [門|もん] に だまりっこ が ！ [明日|あした] の [言葉|ことば] で 、 [見|み]せて ください ！'),
    'f.b.won': T('That’s how you talk! Tomorrow… no: today, we won!',
      '¡Así se habla! Mañana… no: ¡hoy ganamos!',
      'É assim que se fala! Amanhã… não: hoje a gente ganhou!',
      'So spricht man! Morgen… nein: Heute haben wir gewonnen!',
      '[说|shuō] [得|de] [好|hǎo] ！ [明天|míng tiān] … [不|bù] ， [今天|jīn tiān] [我们|wǒ men] [赢|yíng] [了|le] ！',
      'それ で こそ ！ [明日|あした] … いや 、 [今日|きょう] 、 [勝|か]ちました ！'),
    'f.b.lost': T('Ow… They’re tough, here in tomorrow. Breathe, and we’ll try again. We WILL win.',
      'Uf… Aquí en el mañana son duros. Respira, y lo intentaremos otra vez. Ganaremos.',
      'Ai… Aqui no amanhã eles são duros. Respira, e a gente vai tentar de novo. Vamos ganhar.',
      'Uff… Hier im Morgen sind sie zäh. Atme durch, und wir werden es noch mal versuchen. Wir werden gewinnen.',
      '[哎|āi] … [明天|míng tiān] [这里|zhè lǐ] [的|de] [它们|tā men] [很|hěn] [厉害|lì hai] 。 [喘|chuǎn] [口|kǒu] [气|qì] ， [我们|wǒ men] [会|huì] [再|zài] [试|shì] [一|yī] [次|cì] 。 [我们|wǒ men] [会|huì] [赢|yíng] [的|de] 。',
      'いたた … [明日|あした] の だまりっこ は [手強|てごわ]い です ね 。 [一息|ひといき] ついて 、 もう [一度|いちど] やりましょう 。 [勝|か]つ でしょう 。'),
    'f.b.chat': T('My old bones say: tomorrow we’ll train again. And the day after.',
      'Mis huesos viejos dicen: mañana entrenaremos otra vez. Y pasado mañana también.',
      'Meus ossos velhos dizem: amanhã a gente vai treinar de novo. E depois de amanhã também.',
      'Meine alten Knochen sagen: Morgen werden wir wieder trainieren. Und übermorgen auch.',
      '[我|wǒ] [这|zhè] [把|bǎ] [老|lǎo] [骨头|gǔ tou] [说|shuō] ： [明天|míng tiān] [我们|wǒ men] [还|hái] [会|huì] [练功|liàn gōng] 。 [后天|hòu tiān] [也|yě] [会|huì] 。',
      '[年|とし] を とった [体|からだ] が [言|い]って います 。 [明日|あした] も [練習|れんしゅう] する でしょう 。 あさって も 。'),
  };

  // ------------------------------------------------------------ the frozen: what the Hush left of their words (*starred*)
  const HUSH = {
    nico: T('… *play*… *ball*… *nobody*… *comes*…', '… *jugar*… *pelota*… *nadie*… *viene*…', '… *brincar*… *bola*… *ninguém*… *vem*…', '… *spielen*… *Ball*… *niemand*… *kommt*…',
      '… *[玩|wán]* … *[球|qiú]* … *[没人|méi rén]* … *[来|lái]* …', '… *[遊|あそ]ぶ* … *ボール* … *[誰|だれ]も* … *[来|こ]ない* …'),
    rosa: T('… *sell*… *apples*… *nobody*… *buys*…', '… *vender*… *manzanas*… ya *nadie*… *compra*…', '… *vender*… *maçãs*… *ninguém*… *compra*…', '… *verkaufen*… *Äpfel*… *niemand*… *kauft*…',
      '… *[卖|mài]* … *[苹果|píng guǒ]* … *[没人|méi rén]* … *[买|mǎi]* …', '… *[売|う]る* … *りんご* … *[誰|だれ]も* … *[買|か]わない* …'),
    tito: T('… *play*… my *guitar*… no *music*…', '… *tocar*… mi *guitarra*… sin *música*…', '… *tocar*… meu *violão*… sem *música*…', '… *spielen*… meine *Gitarre*… keine *Musik*…',
      '… *[弹|tán]* … [我|wǒ] [的|de] *[吉他|jí tā]* … [没有|méi yǒu] *[音乐|yīn yuè]* …', '… *[弾|ひ]く* … わたし の *ギター* … *[音楽|おんがく]* が ない …'),
    marta: T('… *bake*… *bread*… the *oven*… *cold*…', '… *hornear*… *pan*… el *horno*… *frío*…', '… *assar*… *pão*… o *forno*… *frio*…', '… *backen*… *Brot*… der *Ofen*… *kalt*…',
      '… *[烤|kǎo]* … *[面包|miàn bāo]* … *[烤箱|kǎo xiāng]* … *[冷|lěng]* …', '… *[焼|や]く* … *パン* … *オーブン* … *[冷|つめ]たい* …'),
    bruno: T('… *train*… *little* one… *strong*…', '… *entrenar*… el *pequeño*… *fuerte*…', '… *treinar*… o *pequeno*… *forte*…', '… *trainieren*… der *Kleine*… *stark*…',
      '… *[练功|liàn gōng]* … *[小|xiǎo]* [家伙|jiā huo] … *[强|qiáng]* …', '… *[練習|れんしゅう]* … *[小|ちい]さい* [子|こ] … *[強|つよ]く* …'),
    crowd: T('… … …', '… … …', '… … …', '… … …', '… … …', '… … …'),
  };

  // ------------------------------------------------------------ demonstrations (whole in the language, the shown words glossed)
  // lines.js shape (L1: [es], [pt], … [en]); merged into LINES for STORY.demoAt. MARKS: what each one shows, per language.
  const DEMO = {
    'fut.demo.nico': L1('Nico. Mañana jugaremos en la plaza. Te lo prometo.', 'Nico. Amanhã nós vamos brincar na praça. Eu prometo.', 'Nico. Morgen werden wir auf dem Platz spielen. Versprochen.',
      '[尼科|Ní kē] 。 [明天|míng tiān] [我们|wǒ men] [会|huì] [在|zài] [广场|guǎng chǎng] [上|shang] [玩|wán] 。 [我|wǒ] [保证|bǎo zhèng] 。', 'ニコ 。 [明日|あした] 、 [広場|ひろば] で いっしょ に [遊|あそ]ぶ つもり だ よ 。 [約束|やくそく] する 。',
      'Nico. Tomorrow we’ll play in the plaza. I promise.'),
    'fut.demo.jump': L1('¡Mira! Aquí manda el mañana. ¡{mimo} saltará sobre el muñeco!', 'Olha! Aqui quem manda é o amanhã. O {mimo} vai pular no boneco!', 'Schau! Hier hat das Morgen das Sagen. {mimo} wird auf die Puppe springen!',
      '[看|kàn] ！ [这里|zhè lǐ] [明天|míng tiān] [说了算|shuō le suàn] 。 {mimo} [会|huì] [跳到|tiào dào] [木人|mù rén] [上|shang] ！', '[見|み]て ください ！ ここ で は [明日|あした] が [決|き]めます 。 {mimo} は [人形|にんぎょう] に [跳|と]びかかる でしょう ！',
      'Watch! Here, tomorrow is in charge. {mimo} will jump on the dummy!'),
    'fut.demo.predict': L1('¡Y escúchalos! «¡El azul atacará por arriba!» Dilo antes, y lo esquivas perfecto.', 'E escuta eles! «O azul vai atacar por cima!» Fala antes, e você desvia perfeito.', 'Und hör ihnen zu! «Der Blaue wird von oben angreifen!» Sag es vorher, und du weichst perfekt aus.',
      '[还有|hái yǒu] ， [听|tīng] [它们|tā men] [说话|shuō huà] ！ “ [蓝色|lán sè] [的|de] [会|huì] [从|cóng] [上面|shàng miàn] [攻击|gōng jī] ！ ” [先|xiān] [说|shuō] [出来|chū lai] ， [你|nǐ] [就|jiù] [能|néng] [完美|wán měi] [躲开|duǒ kāi] 。',
      'それ に 、 [敵|てき] の [声|こえ] を [聞|き]いて ！ 「 [青|あお]い の が [上|うえ] から [攻撃|こうげき] する でしょう ！ 」 [先|さき] に [言|い]えば 、 [完璧|かんぺき] に よけられます 。',
      'And listen to them! «The blue one will attack from above!» Say it first, and you dodge it perfectly.'),
    'fut.demo.wish': L1('Me gustaría oír la campana otra vez… solo una vez más.', 'Eu gostaria de ouvir o sino de novo… só mais uma vez.', 'Ich würde so gern die Glocke noch einmal hören… nur noch ein Mal.',
      '[我|wǒ] [希望|xī wàng] [能|néng] [再|zài] [听到|tīng dào] [钟声|zhōng shēng] … [再|zài] [一|yī] [次|cì] [就|jiù] [好|hǎo] 。', 'もう [一度|いちど] 、 [鐘|かね] の [音|おと] が [聞|き]けたら いい な … [一度|いちど] だけ で いい から 。',
      'I’d like to hear the {w.bell} again… just once more.'),
    'fut.demo.trap': L1('Va a bajar sobre nosotros. ¡Pon una trampa! Así: «Si baja, {mimo} lo golpeará».', 'Ele vai descer em cima da gente. Arma uma armadilha! Assim: «Se ele descer, o {mimo} vai bater nele».', 'Sie wird auf uns herunterkommen. Stell eine Falle! So: «Wenn sie kommt, wird {mimo} sie schlagen».',
      '[它|tā] [会|huì] [扑|pū] [下来|xià lai] 。 [设|shè] [个|gè] [陷阱|xiàn jǐng] ！ [这样|zhè yàng] [说|shuō] ： “ [如果|rú guǒ] [它|tā] [下来|xià lai] ， {mimo} [就|jiù] [打|dǎ] [它|tā] ！ ”', '[降|お]りて くる でしょう 。 わな を しかけましょう ！ こう [言|い]って ： 「 [降|お]りて きたら 、 {mimo} が [打|う]つ ！ 」',
      'It’s going to come down on us. Set a trap! Like this: «If it comes down, {mimo} will hit it».'),
    'fut.demo.ring': L1('Sonará, si lo decimos todos juntos. Dilo con ellos: ¡vamos a tocar la campana!', 'Vai tocar, se todo mundo falar junto. Fala com eles: vamos tocar o sino!', 'Sie wird läuten, wenn wir es alle zusammen sagen. Sag es mit ihnen: Wir werden die Glocke läuten!',
      '[会|huì] [响|xiǎng] [的|de] ， [只要|zhǐ yào] [我们|wǒ men] [一起|yī qǐ] [说|shuō] 。 [跟|gēn] [大家|dà jiā] [一起|yī qǐ] [说|shuō] ： [我们|wǒ men] [要|yào] [敲钟|qiāo zhōng] ！', 'みんな で [言|い]えば 、 [鳴|な]る よ 。 いっしょ に [言|い]って 。 みんな で [鐘|かね] を [鳴|な]らす つもり だ ！',
      'It will, if we all say it together. Say it with them: we’re going to ring the {w.bell}!'),
  };
  const MARKS = {
    'fut.demo.nico': { es: [['jugaremos', 'we will play'], ['Mañana', 'tomorrow']], pt: [['vamos brincar', 'are going to play'], ['Amanhã', 'tomorrow']], de: [['werden wir', 'we will'], ['spielen', 'play'], ['Morgen', 'tomorrow']],
      zh: [['[会|huì]', 'will'], ['[明天|míng tiān]', 'tomorrow']], ja: [['つもり', 'intend to (will)'], ['[明日|あした]', 'tomorrow']] },
    'fut.demo.jump': { es: [['saltará', 'will jump']], pt: [['vai pular', 'is going to jump']], de: [['wird', 'will'], ['springen', 'jump']], zh: [['[会|huì]', 'will'], ['[跳到|tiào dào]', 'jump onto']], ja: [['[跳|と]びかかる', 'leap at'], ['でしょう', 'will (surely)']] },
    'fut.demo.predict': { es: [['atacará', 'will attack'], ['por arriba', 'from above']], pt: [['vai atacar', 'is going to attack'], ['por cima', 'from above']], de: [['wird', 'will'], ['von oben', 'from above'], ['angreifen', 'attack']],
      zh: [['[攻击|gōng jī]', 'attack'], ['[上面|shàng miàn]', 'above']], ja: [['[上|うえ]', 'above'], ['[攻撃|こうげき]', 'attack'], ['でしょう', 'will (surely)']] },
    'fut.demo.wish': { es: [['Me gustaría', 'I would like'], ['oír', 'to hear']], pt: [['gostaria', 'would like'], ['ouvir', 'to hear']], de: [['würde', 'would'], ['gern', '(like) to'], ['hören', 'hear']],
      zh: [['[希望|xī wàng]', 'wish, hope'], ['[钟声|zhōng shēng]', 'the bell’s sound']], ja: [['[聞|き]けたら', 'if (I) could hear'], ['いい', 'good'], ['な', '(it would be…)']] },
    'fut.demo.trap': { es: [['Si', 'if'], ['baja', 'it comes down'], ['golpeará', 'will hit']], pt: [['Se', 'if'], ['descer', 'comes down'], ['vai bater', 'is going to hit']], de: [['Wenn', 'if, when'], ['kommt', 'comes'], ['schlagen', 'hit']],
      zh: [['[如果|rú guǒ]', 'if'], ['[就|jiù]', 'then']], ja: [['きたら', 'if (it) comes'], ['[打|う]つ', 'hit (will hit)']] },
    'fut.demo.ring': { es: [['vamos a tocar', 'we are going to ring'], ['campana', 'bell']], pt: [['vamos tocar', 'we are going to ring'], ['sino', 'bell']], de: [['werden', 'will'], ['läuten', 'ring'], ['Glocke', 'bell']],
      zh: [['[要|yào]', 'going to'], ['[敲钟|qiāo zhōng]', 'ring the bell']], ja: [['[鳴|な]らす', 'ring'], ['つもり', 'intend to (will)']] },
  };
  if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(DEMO)) if (!LINES[k]) LINES[k] = v;

  // ------------------------------------------------------------ the conditional (the tower door), the Great Silence, the bell, the end
  Object.assign(ML, {
    'f.c1': T('The bell tower. Its door is sealed with Hush. Promises won’t open it: the Silence swallowed every promise ever made to it.',
      'La torre de la campana. Su puerta está sellada con Silencio. Las promesas no la abren: el Silencio se tragó todas las promesas que le hicieron.',
      'A torre do sino. A porta está selada com Silêncio. Promessas não abrem: o Silêncio engoliu todas as promessas que fizeram pra ele.',
      'Der Glockenturm. Seine Tür ist mit Stille versiegelt. Versprechen öffnen sie nicht: Die Stille hat jedes Versprechen verschluckt, das man ihr gemacht hat.',
      '[钟楼|zhōng lóu] 。 [门|mén] [被|bèi] [寂静|Jì jìng] [封住|fēng zhù] [了|le] 。 [承诺|chéng nuò] [打不开|dǎ bù kāi] [它|tā] ： [寂静|Jì jìng] [吞掉|tūn diào] [了|le] [所有|suǒ yǒu] [对|duì] [它|tā] [许下|xǔ xià] [的|de] [承诺|chéng nuò] 。',
      '[鐘|かね] の [塔|とう] 。 [扉|とびら] が [静寂|せいじゃく] で ふさがれて る 。 [約束|やくそく] で は [開|あ]かない 。 [静寂|せいじゃく] は 、 [今|いま] まで の [約束|やくそく] を ぜんぶ [飲|の]みこんだ の 。'),
    'f.c2': T('A wish. What you WOULD like. The Silence can’t swallow a wish… it doesn’t know what one is.',
      'Un deseo. Lo que te gustaría. El Silencio no puede tragarse un deseo… no sabe qué es.',
      'Um desejo. O que você gostaria. O Silêncio não consegue engolir um desejo… ele nem sabe o que é.',
      'Ein Wunsch. Was du gern hättest. Die Stille kann keinen Wunsch verschlucken… sie weiß nicht, was das ist.',
      '[一个|yī gè] [愿望|yuàn wàng] 。 [你|nǐ] [希望|xī wàng] [的|de] [事|shì] 。 [寂静|Jì jìng] [吞|tūn] [不|bù] [下|xià] [愿望|yuàn wàng] … [它|tā] [不|bù] [知道|zhī dào] [愿望|yuàn wàng] [是|shì] [什么|shén me] 。',
      '[願|ねが]い 。 こう だったら いい な 、 と [思|おも]う こと 。 [静寂|せいじゃく] は [願|ねが]い を [飲|の]みこめない 。 [願|ねが]い が [何|なに] か 、 [知|し]らない から 。'),
    'f.door.open': T('It’s cracking! A wish it can’t swallow… Go on, it’s open!',
      '¡Se está rompiendo! Un deseo que no puede tragarse… ¡Vamos, está abierta!',
      'Está rachando! Um desejo que ele não consegue engolir… Vai, está aberta!',
      'Sie bricht! Ein Wunsch, den sie nicht verschlucken kann… Los, sie ist offen!',
      '[裂开|liè kāi] [了|le] ！ [它|tā] [吞|tūn] [不|bù] [下|xià] [的|de] [愿望|yuàn wàng] … [快|kuài] ， [门|mén] [开|kāi] [了|le] ！',
      '[割|わ]れて いく ！ [飲|の]みこめない [願|ねが]い … [行|い]こう 、 [開|あ]いた よ ！'),
    'f.s1': T('There it is: the Great Silence. Everything the hooded one never said… grown huge.',
      'Ahí está: el Gran Silencio. Todo lo que el encapuchado nunca dijo… hecho enorme.',
      'Lá está: o Grande Silêncio. Tudo o que o encapuzado nunca disse… ficou enorme.',
      'Da ist sie: die Große Stille. Alles, was der Kapuzenmann nie gesagt hat… riesig geworden.',
      '[就是|jiù shì] [它|tā] ： [大寂静|Dà Jì jìng] 。 [兜帽人|dōu mào rén] [从来|cóng lái] [没|méi] [说|shuō] [出口|chū kǒu] [的|de] [话|huà] … [全|quán] [变|biàn] [大|dà] [了|le] 。',
      'あれ が [大静寂|だいせいじゃく] 。 フード の [男|おとこ] が [一度|いちど] も [言|い]わなかった [言葉|ことば] … それ が [大|おお]きく なった の 。'),
    'f.s2': T('Here it comes!', '¡Ahí viene!', 'Lá vem ele!', 'Da kommt sie!', '[它|tā] [来|lái] [了|le] ！', '[来|く]る よ ！'),
    'f.s.lost': T('It pulled back up into the tower… Catch your breath. We’ll beat it: I know it.',
      'Volvió a subir a la torre… Respira. Lo venceremos: lo sé.',
      'Voltou pra torre… Respira. A gente vai vencer ele: eu sei.',
      'Sie hat sich in den Turm zurückgezogen… Atme durch. Wir werden sie besiegen: Ich weiß es.',
      '[它|tā] [退回|tuì huí] [塔|tǎ] [里|lǐ] [了|le] … [喘|chuǎn] [口|kǒu] [气|qì] 。 [我们|wǒ men] [会|huì] [打败|dǎ bài] [它|tā] [的|de] ， [我|wǒ] [知道|zhī dào] 。',
      '[塔|とう] に [戻|もど]って いった … [一息|ひといき] ついて 。 きっと [勝|か]てる 。 わかって る 。'),
    'f.s3': T('It’s shrinking… it’s only fog now. The {w.bell}! It’s free!',
      'Se está encogiendo… ya solo es niebla. ¡La campana! ¡Está libre!',
      'Está encolhendo… agora é só névoa. O sino! Está livre!',
      'Sie schrumpft… jetzt ist sie nur noch Nebel. Die Glocke! Sie ist frei!',
      '[它|tā] [在|zài] [变|biàn] [小|xiǎo] … [只|zhǐ] [剩下|shèng xià] [雾|wù] [了|le] 。 [钟|zhōng] ！ [钟|zhōng] [自由|zì yóu] [了|le] ！',
      '[小|ちい]さく なって いく … もう ただ の [霧|きり] だ 。 [鐘|かね] ！ [鐘|かね] が [自由|じゆう] に なった ！'),
    'f.f1': T('The {w.bell} is cracked… will it still ring?', 'La campana está rota… ¿sonará todavía?', 'O sino está rachado… será que ainda vai tocar?', 'Die Glocke hat einen Sprung… wird sie noch läuten?',
      '[钟|zhōng] [裂|liè] [了|le] … [它|tā] [还|hái] [会|huì] [响|xiǎng] [吗|ma] ？', '[鐘|かね] に ひび が … まだ [鳴|な]る でしょう か ？'),
    'f.f3': T('Listen… all eight {w.bell:pl}, even the far ones!', 'Escuchen… ¡las ocho campanas, hasta las de lejos!', 'Escutem… os oito sinos, até os de longe!', 'Hört mal… alle acht Glocken, sogar die fernen!',
      '[听|tīng] … [八|bā] [口|kǒu] [钟|zhōng] [都|dōu] [响|xiǎng] [了|le] ， [连|lián] [远处|yuǎn chù] [的|de] [也|yě] [响|xiǎng] [了|le] ！', '[聞|き]いて … [八|やっ]つ の [鐘|かね] が ぜんぶ ！ [遠|とお]く の [鐘|かね] まで ！'),
    'f.f4': T('And tomorrow we’ll celebrate the Festival of Voices! Like in the old days!', '¡Y mañana celebraremos la Fiesta de las Voces! ¡Como antes!', 'E amanhã a gente vai celebrar a Festa das Vozes! Como antigamente!', 'Und morgen werden wir das Fest der Stimmen feiern! Wie früher!',
      '[明天|míng tiān] [我们|wǒ men] [要|yào] [过|guò] [声音节|Shēng yīn jié] ！ [就|jiù] [像|xiàng] [以前|yǐ qián] [一样|yī yàng] ！', '[明日|あした] は 「 [声|こえ] の [祭|まつ]り 」 を [開|ひら]く [予定|よてい] です ！ [昔|むかし] みたい に ！'),
    'f.f5': T('Every voice counts!', '¡Toda voz cuenta!', 'Toda voz conta!', 'Jede Stimme zählt!', '[每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù] ！', 'どの [声|こえ] も [大切|たいせつ] ！'),
    'f.f6': T('Go on: Noa is waiting by the tower’s clock. I think she has something to tell you.', 'Anda: Noa te espera junto al reloj de la torre. Creo que quiere decirte algo.', 'Vai: a Noa está te esperando perto do relógio da torre. Acho que ela quer te contar uma coisa.', 'Geh nur: Noa wartet an der Turmuhr. Ich glaube, sie will dir etwas sagen.',
      '[去|qù] [吧|ba] ： [诺娅|Nuò yà] [在|zài] [钟楼|zhōng lóu] [的|de] [钟|zhōng] [旁边|páng biān] [等|děng] [你|nǐ] 。 [她|tā] [好像|hǎo xiàng] [有|yǒu] [话|huà] [要|yào] [跟|gēn] [你|nǐ] [说|shuō] 。', 'さあ 、 ノア さん が [塔|とう] の [時計|とけい] の そば で [待|ま]って います よ 。 [何|なに] か [話|はな]したい こと が ある みたい です 。'),
    'f.e1': T('You did it. This tomorrow won’t come now: you spoke, so it changed.', 'Lo lograste. Este mañana ya no llegará: hablaste, y cambió.', 'Você conseguiu. Este amanhã não vai mais chegar: você falou, e ele mudou.', 'Du hast es geschafft. Dieses Morgen wird jetzt nicht kommen: Du hast gesprochen, also hat es sich verändert.',
      '[你|nǐ] [做到|zuò dào] [了|le] 。 [这个|zhè ge] [明天|míng tiān] [不会|bù huì] [来|lái] [了|le] ： [你|nǐ] [说话|shuō huà] [了|le] ， [所以|suǒ yǐ] [它|tā] [变|biàn] [了|le] 。', 'やった ね 。 この [明日|あした] は 、 もう [来|こ]ない 。 あなた が [話|はな]した から 、 [変|か]わった の 。'),
    'f.e2': T('But the Hush has a source. It began with one voice that went quiet. His.', 'Pero el Silencio tiene un origen. Empezó con una voz que se calló. La suya.', 'Mas o Silêncio tem uma origem. Começou com uma voz que se calou. A dele.', 'Aber die Stille hat einen Ursprung. Sie begann mit einer Stimme, die verstummt ist. Seiner.',
      '[可是|kě shì] [寂静|Jì jìng] [有|yǒu] [一个|yī gè] [源头|yuán tóu] 。 [它|tā] [是|shì] [从|cóng] [一个|yī gè] [不再|bù zài] [说话|shuō huà] [的|de] [声音|shēng yīn] [开始|kāi shǐ] [的|de] 。 [他|tā] [的|de] 。', 'でも 、 [静寂|せいじゃく] に は [始|はじ]まり が ある 。 [黙|だま]って しまった [一|ひと]つ の [声|こえ] から [始|はじ]まった の 。 あの [人|ひと] の [声|こえ] 。'),
    'f.e3': T('Look: I drew him, the way the Past showed you. «Every voice counts»… his too.', 'Mira: lo dibujé, como te lo mostró el Ayer. «Toda voz cuenta»… también la suya.', 'Olha: eu desenhei ele, do jeito que o Ontem te mostrou. «Toda voz conta»… a dele também.', 'Schau: Ich habe ihn gezeichnet, so wie das Gestern ihn dir gezeigt hat. «Jede Stimme zählt»… seine auch.',
      '[你|nǐ] [看|kàn] ： [我|wǒ] [把|bǎ] [他|tā] [画|huà] [下来|xià lai] [了|le] ， [就|jiù] [像|xiàng] [昨天|zuó tiān] [给|gěi] [你|nǐ] [看|kàn] [的|de] [那样|nà yàng] 。 “ [每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù] ” … [他|tā] [的|de] [也|yě] [算|suàn] 。', '[見|み]て 。 [昨日|きのう] が [見|み]せて くれた とおり に 、 あの [人|ひと] を [描|か]いた の 。 「 どの [声|こえ] も [大切|たいせつ] 」 … あの [人|ひと] の [声|こえ] も 。'),
    'f.e4': T('Go back to your today. I’m still in the clock, at the top of the tower. Find the place where his voice stopped… and give it back to him. I’ll be waiting.',
      'Vuelve a tu hoy. Sigo en el reloj, en lo alto de la torre. Busca el lugar donde se calló su voz… y devuélvesela. Te estaré esperando.',
      'Volta pro seu hoje. Eu ainda estou no relógio, no alto da torre. Procura o lugar onde a voz dele se calou… e devolve pra ele. Vou estar te esperando.',
      'Geh zurück in dein Heute. Ich bin noch in der Uhr, oben im Turm. Finde den Ort, an dem seine Stimme verstummt ist… und gib sie ihm zurück. Ich werde auf dich warten.',
      '[回到|huí dào] [你|nǐ] [的|de] [今天|jīn tiān] [去|qù] 。 [我|wǒ] [还|hái] [在|zài] [塔顶|tǎ dǐng] [的|de] [大钟|dà zhōng] [里|lǐ] 。 [找到|zhǎo dào] [他|tā] [的|de] [声音|shēng yīn] [停下|tíng xià] [的|de] [地方|dì fang] … [把|bǎ] [声音|shēng yīn] [还给|huán gěi] [他|tā] 。 [我|wǒ] [会|huì] [等|děng] [你|nǐ] 。',
      'あなた の [今日|きょう] に [帰|かえ]って 。 わたし は まだ [塔|とう] の [上|うえ] の [時計|とけい] の [中|なか] 。 あの [人|ひと] の [声|こえ] が [止|と]まった [場所|ばしょ] を [見|み]つけて … [声|こえ] を [返|かえ]して あげて 。 [待|ま]って る から 。'),
  });

  // ------------------------------------------------------------ the promises: who, the verb, the thing, the model, the frame
  // verb: es/pt/de the infinitive (alt: more that count); zh/ja: the word in the notation (alt likewise). thing: the object,
  // which an S wants (zh/ja: in the notation). model: the sentence "? / I don't know" shows. Every model is taught first: Noa's
  // demonstration with Nico (and the pattern card) shows the forms; each person's surviving words give the verb and the thing.
  const TASK = {
    rosa: { verb: { es: 'vender', pt: 'vender', de: 'verkaufen', zh: '[卖|mài]', ja: '[売|う]る' }, alt: { zh: ['[出售|chū shòu]'], ja: ['うる'] },
      thing: { es: ['manzana'], pt: ['maçã', 'maca'], de: ['apfel', 'äpfel', 'aepfel'], zh: ['[苹果|píng guǒ]'], ja: ['りんご'] },
      model: T('Tomorrow we’ll sell apples.', 'Mañana venderemos manzanas.', 'Amanhã nós vamos vender maçãs.', 'Morgen werden wir Äpfel verkaufen.', '[明天|míng tiān] [我们|wǒ men] [会|huì] [卖|mài] [苹果|píng guǒ] 。', '[明日|あした] 、 りんご を [売|う]る つもり です 。'),
      doing: 'frozen at her empty apple stall' },
    tito: { verb: { es: 'tocar', pt: 'tocar', de: 'spielen', zh: '[弹|tán]', ja: '[弾|ひ]く' }, alt: { zh: ['[弹奏|tán zòu]'], ja: ['ひく'] },
      thing: { es: ['guitarra', 'musica', 'cancion'], pt: ['violao', 'violão', 'guitarra', 'musica'], de: ['gitarre', 'musik', 'lied'], zh: ['[吉他|jí tā]', '[音乐|yīn yuè]'], ja: ['ギター', '[音楽|おんがく]'] },
      model: T('Tomorrow you’ll play the guitar.', 'Mañana tocarás la guitarra.', 'Amanhã você vai tocar violão.', 'Morgen wirst du Gitarre spielen.', '[明天|míng tiān] [你|nǐ] [会|huì] [弹|tán] [吉他|jí tā] 。', '[明日|あした] 、 ギター を [弾|ひ]く でしょう 。'),
      doing: 'frozen by the fountain, his guitar silent in his hands' },
    marta: { verb: { es: 'hornear', pt: 'assar', de: 'backen', zh: '[烤|kǎo]', ja: '[焼|や]く' }, alt: { es: ['cocinar', 'hacer'], pt: ['fazer', 'cozinhar'], zh: ['[做|zuò]'], ja: ['やく', '[作|つく]る'] },
      thing: { es: ['pan'], pt: ['pao', 'pão'], de: ['brot'], zh: ['[面包|miàn bāo]'], ja: ['パン'] },
      model: T('Tomorrow we’ll bake bread.', 'Mañana hornearemos pan.', 'Amanhã nós vamos assar pão.', 'Morgen werden wir Brot backen.', '[明天|míng tiān] [我们|wǒ men] [要|yào] [烤|kǎo] [面包|miàn bāo] 。', '[明日|あした] 、 パン を [焼|や]く [予定|よてい] です 。'),
      doing: 'frozen at the bakery’s cold oven door' },
    bruno: { verb: { es: 'entrenar', pt: 'treinar', de: 'trainieren', zh: '[练功|liàn gōng]', ja: '[練習|れんしゅう]' }, alt: { es: ['practicar'], pt: ['praticar'], de: ['üben', 'ueben', 'trainiere'], zh: ['[练|liàn]', '[训练|xùn liàn]', '[练习|liàn xí]'], ja: ['トレーニング', '[訓練|くんれん]', '[特訓|とっくん]'] },
      thing: {},
      model: T('Tomorrow we’ll train.', 'Mañana entrenaremos.', 'Amanhã nós vamos treinar.', 'Morgen werden wir trainieren.', '[明天|míng tiān] [我们|wǒ men] [会|huì] [练功|liàn gōng] 。', '[明日|あした] 、 いっしょ に [練習|れんしゅう] する つもり です 。'),
      doing: 'frozen mid-swing in his yard, his practice dummies knocked flat' },
  };
  // the box's hint: the frame (a promise about tomorrow, in each language's own way)
  const FRAME = {
    future: T('A promise about tomorrow, in tomorrow’s words', 'Mañana ___emos… (we’ll) · Mañana ___ás… (you’ll) · vamos a ___', 'Amanhã nós vamos ___ … · Amanhã você vai ___ …', 'Morgen werden wir … ___ (the verb goes last)',
      '[明天|míng tiān] [我们|wǒ men] [会|huì] ___ … · [要|yào] / [将|jiāng] / [打算|dǎ suàn] ___', '[明日|あした] 、 … ___ つもり です · [予定|よてい] です · でしょう'),
    wish: T('A wish: what you would like', 'Me gustaría + ___ (I’d like to…)', 'Eu gostaria de ___ … (I’d like to…)', 'Ich würde gern … ___ (I’d like to…)', '[我|wǒ] [希望|xī wàng] … · [要是|yào shi] … [就|jiù] [好|hǎo] [了|le]', '… ___ たら いい な'),
    trap: T('A trap: if it does that, {mimo} will do this', 'Si ___ , {mimo} lo ___á', 'Se ele ___ , o {mimo} vai ___', 'Wenn sie ___ (verb last), wird {mimo} sie ___', '[如果|rú guǒ] [它|tā] ___ ， {mimo} [就|jiù] ___', '___ たら 、 {mimo} が ___'),
    ring: T('A plan for all of us', '¡Vamos a ___ la campana!', 'Vamos ___ o sino!', 'Wir werden die Glocke ___!', '[我们|wǒ men] [要|yào] ___ ！', 'みんな で [鐘|かね] を ___ つもり だ ！'),
  };
  const MODEL = {
    wish: T('I’d like to hear the bell.', 'Me gustaría oír la campana.', 'Eu gostaria de ouvir o sino.', 'Ich würde gern die Glocke hören.', '[我|wǒ] [希望|xī wàng] [能|néng] [听到|tīng dào] [钟声|zhōng shēng] 。', '[鐘|かね] の [音|おと] が [聞|き]けたら いい な 。'),
    trap: T('If it comes down, {mimo} will hit it!', 'Si baja, {mimo} lo golpeará.', 'Se ele descer, o {mimo} vai bater nele.', 'Wenn sie kommt, wird {mimo} sie schlagen.', '[如果|rú guǒ] [它|tā] [下来|xià lai] ， {mimo} [就|jiù] [打|dǎ] [它|tā] 。', '[降|お]りて きたら 、 {mimo} が [打|う]つ 。'),
    ring: T('We’re going to ring the bell!', '¡Vamos a tocar la campana!', 'Vamos tocar o sino!', 'Wir werden die Glocke läuten!', '[我们|wǒ men] [要|yào] [敲钟|qiāo zhōng] ！', 'みんな で [鐘|かね] を [鳴|な]らす つもり だ ！'),
  };

  // ------------------------------------------------------------ the pattern cards (a page of the pattern notebook, shown once)
  // rows: [the language, its English]; zh / ja in the notation (the card shows them with their readings)
  const CARD = {
    future: {
      es: { title: 'Mañana… (the future)', rows: [['jugar → jugaré', 'I’ll play'], ['jugarás', 'you’ll play'], ['jugará', 'he / she will play'], ['jugaremos', 'we’ll play'], ['jugarán', 'they’ll play'], ['voy a jugar · vamos a jugar', 'I’m / we’re going to play']], note: 'The whole verb + é, ás, á, emos, án. Or «ir a» + the verb.' },
      pt: { title: 'Amanhã… (the future)', rows: [['vou brincar', 'I’m going to play'], ['você vai brincar', 'you’re going to play'], ['ele / ela vai brincar', 'he / she is going to play'], ['nós vamos · a gente vai brincar', 'we’re going to play'], ['brincarei · brincaremos', 'I’ll play · we’ll play (as in books)']], note: '«ir» + the verb, the way people talk. Or the whole verb + ei, á, emos, ão.' },
      de: { title: 'Morgen… (the future)', rows: [['ich werde spielen', 'I will play'], ['du wirst spielen', 'you will play'], ['er / sie wird spielen', 'he / she will play'], ['wir werden spielen', 'we will play'], ['Morgen werden wir Äpfel verkaufen.', 'Tomorrow we’ll sell apples.']], note: '«werden» + the verb, and the verb goes to the very end.' },
      zh: { title: '[明天|míng tiān] … (the future)', rows: [['[我|wǒ] [会|huì] [玩|wán]', 'I will play'], ['[我们|wǒ men] [要|yào] [卖|mài] [苹果|píng guǒ]', 'we’re going to sell apples'], ['[我|wǒ] [打算|dǎ suàn] [烤|kǎo] [面包|miàn bāo]', 'I plan to bake bread'], ['[将|jiāng]', 'will (as in books)']], note: '会 (will), 要 (going to), 将 (will, written), 打算 (plan to), right before the verb.' },
      ja: { title: '[明日|あした] … (the future)', rows: [['[遊|あそ]ぶ つもり です', 'I intend to play'], ['[売|う]る [予定|よてい] です', 'it’s planned: (we’ll) sell'], ['[弾|ひ]く でしょう', '(you) will probably play'], ['[明日|あした] 、 パン を [焼|や]く つもり です', 'Tomorrow I’ll bake bread']], note: 'The plain verb + つもり (intend to), 予定 (planned), でしょう (will, surely).' },
    },
    cond: {
      es: { title: 'Me gustaría… (would)', rows: [['me gustaría oír', 'I’d like to hear'], ['me gustaría hablar', 'I’d like to talk'], ['sería bonito', 'it would be nice'], ['Si baja, Mimo lo golpeará.', 'If it comes down, Mimo will hit it.']], note: 'Wishes: the whole verb + ía. Traps: «si» + now, then the future.' },
      pt: { title: 'Eu gostaria… (would)', rows: [['eu gostaria de ouvir', 'I’d like to hear'], ['eu gostaria de falar', 'I’d like to talk'], ['seria lindo', 'it would be lovely'], ['Se ele descer, o Mimo vai bater nele.', 'If it comes down, Mimo will hit it.']], note: 'Wishes: the whole verb + ia. Traps: «se» + the verb (like the whole verb), then the future.' },
      de: { title: 'Ich würde gern… (would)', rows: [['ich würde gern hören', 'I’d like to hear'], ['ich würde gern reden', 'I’d like to talk'], ['ich möchte', 'I’d like'], ['Wenn sie kommt, wird Mimo sie schlagen.', 'If it comes, Mimo will hit it.']], note: 'Wishes: «würde gern» + the verb at the end. Traps: «wenn» sends its verb to the end.' },
      zh: { title: '[希望|xī wàng] … · [如果|rú guǒ] … [就|jiù] …', rows: [['[我|wǒ] [希望|xī wàng] [能|néng] [听到|tīng dào]', 'I wish I could hear'], ['[要是|yào shi] … [就|jiù] [好|hǎo] [了|le]', 'it would be nice if…'], ['[如果|rú guǒ] [它|tā] [下来|xià lai] ， [米莫|Mǐ mò] [就|jiù] [打|dǎ] [它|tā]', 'if it comes down, Mimo hits it']], note: 'Wishes: 希望. Traps: 如果 (if) …, 就 (then) ….' },
      ja: { title: '… たら (if, would)', rows: [['[聞|き]けたら いい な', 'it would be nice if I could hear'], ['[話|はな]せたら いい な', 'it would be nice if we could talk'], ['[降|お]りて きたら 、 ミモ が [打|う]つ', 'if it comes down, Mimo hits it']], note: 'The past form + ら: 来た → 来たら. Wishes: …たら いい な.' },
    },
  };

  // ------------------------------------------------------------ the graders
  // Each returns { ok, letter (S–C), reason, kind, tip }. ok: the words do what they should (wake someone, open the door, set the
  // trap, ring the bell). kind when not ok: 'today' (the right verb, but not in the future), 'wrongverb' (a future, but of
  // another verb), 'present' (a wish said as a want), 'nosi' (no «if»), 'nofuture' (no future after the «if»), 'nothing'.
  const lowT = s => String(s == null ? '' : s).toLowerCase().normalize('NFC').replace(/[¡!¿?.,;:«»"“”„()…—–\-]/g, ' ').replace(/\s+/g, ' ').trim();
  const fl = s => lowT(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const rx = src => new RegExp('(?:^| )(?:' + src + ')(?= |$)');
  function lev(a, b) { let p = Array.from({ length: b.length + 1 }, (_, j) => j); for (let i = 1; i <= a.length; i++) { const c = [i]; for (let j = 1; j <= b.length; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[b.length]; }
  const R = (ok, letter, reason, o) => Object.assign({ ok, letter: letter || null, reason: reason || '' }, o || {});
  const down = (letter, n = 1) => 'SABCD'[Math.min(4, 'SABCD'.indexOf(letter) + n)];
  // (the word typed in characters counts as itself, whatever the dictionary reads it as: 弹 is tán here, not dàn)
  const cjHas = (text, src, l) => {
    if (typeof CJK === 'undefined') return false;
    try { const ch = CJK.chars(src, { lang: l }).replace(/\s+/g, ''); if (/[぀-ヿ一-鿿]/.test(ch) && String(text || '').replace(/\s+/g, '').includes(ch)) return true; } catch (e) { /* */ }
    try { return !!CJK.contains(text, src, l); } catch (e) { return false; }
  };
  const cjPos = (text, src, l) => {
    try {
      const raw = String(text || '').replace(/\s+/g, ''), ch = CJK.chars(src, { lang: l }).replace(/\s+/g, '');
      if (/[一-鿿]/.test(raw) && raw.includes(ch)) return raw.indexOf(ch);
      const c = CJK.canon(text, l), w = CJK.canon(src, l); return w ? c.indexOf(w) : -1;
    } catch (e) { return -1; }
  };
  const thingIn = (t, text, l) => { const th = (t.thing && t.thing[l]) || []; if (!th.length) return true; return isC(l) ? th.some(w => cjHas(text, w, l)) : th.some(w => fl(text).includes(fl(w))); };
  // es / pt: the future's endings, and the verbs whose future stem isn't the whole verb
  const END = { es: ['é', 'ás', 'á', 'emos', 'éis', 'án'], pt: ['ei', 'ás', 'á', 'emos', 'eis', 'ão'] };
  const ENDF = { es: ['e', 'as', 'a', 'emos', 'eis', 'an'], pt: ['ei', 'as', 'a', 'emos', 'eis', 'ao'] };
  const IRR = { es: { hacer: 'har', tener: 'tendr', poder: 'podr', salir: 'saldr', venir: 'vendr', decir: 'dir', querer: 'querr', saber: 'sabr', poner: 'pondr' }, pt: { fazer: 'far', dizer: 'dir', trazer: 'trar' } };
  const IR = { es: '(?:voy|vas|va|vamos|vais|van)', pt: '(?:vou|vais|vai|vamos|vao|vão)' };
  const stemOf = (v, l) => (IRR[l] && IRR[l][v]) || v;
  // any future at all (es / pt), for "that's a future, but of another verb"
  const anyFut = (F, l) => (l === 'es' ? /(?:^| )[a-zñ]{2,}(?:re|ras|ra|remos|reis|ran)(?= |$)/.test(F) || rx(IR.es + ' a [a-zñ]+(?:ar|er|ir)').test(F)
    : /(?:^| )[a-zç]{2,}(?:rei|ras|ra|remos|reis|rao)(?= |$)/.test(F) || rx(IR.pt + ' [a-zç]+(?:ar|er|ir|or)').test(F));

  // the future typed without its accent (P6a, accents.js): it costs nothing, a tip shows it («golpeara» read as «golpeará»), unless
  // what you typed is, as typed, another tense this task tells apart: then the A stays, and the reason says why
  function accFut(L, F, sf, st, l, fin) {
    const ws = F.split(' '), m = ws.findIndex(w => w.startsWith(sf) && ENDF[l].includes(w.slice(sf.length)));
    const typed = (L.split(' ')[m] || ws[m] || ''), right = m >= 0 ? st + END[l][ENDF[l].indexOf(ws[m].slice(sf.length))] : '';
    const ac = typeof ACCENTS !== 'undefined' && typed && right ? ACCENTS.word(typed, right, l) : { keep: true, why: '' };
    return ac.keep ? fin('A', ac.why || 'an accent is missing') : fin('S', 'tomorrow’s words', { tip: ac.tip });
  }
  function futRomance(text, t, l) {
    const L = lowT(text), F = fl(text), verbs = [t.verb[l]].concat((t.alt && t.alt[l]) || []), thing = thingIn(t, text, l);
    const fin = (letter, reason, o) => R(true, thing ? letter : down(letter), thing ? reason : reason + (reason ? '; ' : '') + 'say what, too', Object.assign({ kind: 'future' }, o));
    for (const v of verbs) {
      const st = stemOf(v, l), sf = fl(st), vf = fl(v);
      if (rx(st + '(?:' + END[l].join('|') + ')').test(L)) return fin('S', 'tomorrow’s words');
      if (rx(sf + '(?:' + ENDF[l].join('|') + ')').test(F)) return accFut(L, F, sf, st, l, fin);
      if (l === 'es' && rx(IR.es + ' a ' + vf).test(F)) return fin('S', '«ir a» + the verb');
      if (l === 'es' && rx(IR.es + ' ' + vf).test(F)) return fin('B', '«ir a» + the verb: don’t forget «a»');
      if (l === 'pt' && rx(IR.pt + ' ' + vf).test(F)) return fin('S', '«ir» + the verb');
      if (l === 'pt' && rx(IR.pt + ' a ' + vf).test(F)) return fin('B', 'no «a» after «vamos / vai»');
      if (l === 'es' && st !== v && rx(vf + '(?:' + ENDF[l].join('|') + ')').test(F)) return fin('B', `this one’s future is «${st}…»`);
    }
    // the right verb, but not tomorrow's form: today (or yesterday)
    for (const v of verbs) { const s = fl(v).slice(0, Math.max(3, fl(v).length - 2)), m = F.match(new RegExp('(?:^| )(' + s + '[a-zç]*)(?= |$)')); if (m) return R(false, null, '', { kind: 'today', heard: m[1] }); }
    // a near miss on the future (one letter off)
    for (const v of verbs) for (const w of F.split(' ')) for (const e of ENDF[l]) if (w.length > 4 && lev(w, fl(stemOf(v, l)) + e) === 1) return R(true, 'C', `spelling: «${stemOf(v, l)}${END[l][ENDF[l].indexOf(e)]}»`, { kind: 'future' });
    if (anyFut(F, l)) return R(false, null, '', { kind: 'wrongverb' });
    return R(false, null, '', { kind: 'nothing' });
  }
  const WERDEN = ['werde', 'wirst', 'wird', 'werden', 'werdet'];
  function futDE(text, t) {
    const ws = fl(text).split(' ').filter(Boolean), verbs = [t.verb.de].concat((t.alt && t.alt.de) || []).map(fl), thing = thingIn(t, text, 'de');
    const iw = ws.findIndex(w => WERDEN.includes(w)), iv = ws.findIndex((w, i) => i > iw && verbs.includes(w));
    if (iw >= 0 && iv > iw) {
      const last = iv === ws.length - 1, letter = last ? 'S' : 'A';
      return R(true, thing ? letter : down(letter), (last ? 'tomorrow’s words' : 'the verb goes at the very end') + (thing ? '' : '; say what, too'), { kind: 'future' });
    }
    if (iw >= 0) { for (const w of ws.slice(iw + 1)) for (const v of verbs) if (w.length > 4 && lev(w, v) <= 2) return R(true, 'B', `spelling: «${t.verb.de}»`, { kind: 'future' }); if (/en$/.test(ws[ws.length - 1] || '')) return R(false, null, '', { kind: 'wrongverb' }); }
    const stems = verbs.map(v => v.replace(/e?n$/, '')), hit = ws.find(w => stems.some(s => s.length > 2 && w.startsWith(s)));
    if (hit) return R(false, null, '', { kind: 'today', heard: hit });
    return R(false, null, '', { kind: 'nothing' });
  }
  const MK_ZH = ['[会|huì]', '[要|yào]', '[将|jiāng]', '[打算|dǎ suàn]', '[准备|zhǔn bèi]'];
  const MK_JA = ['つもり', '[予定|よてい]', 'でしょう', 'だろう', 'でしょ'];
  function futZH(text, t) {
    const verbs = [t.verb.zh].concat((t.alt && t.alt.zh) || []), v = verbs.find(x => cjHas(text, x, 'zh')), mk = MK_ZH.find(m => cjHas(text, m, 'zh')), thing = thingIn(t, text, 'zh');
    if (v && mk) {
      const ok = cjPos(text, mk, 'zh') <= cjPos(text, v, 'zh');
      const letter = ok ? 'S' : 'B';
      return R(true, thing ? letter : down(letter), (ok ? 'tomorrow’s words' : '会 / 要 go right before the verb') + (thing ? '' : '; say what, too'), { kind: 'future' });
    }
    if (v) return R(false, null, '', { kind: 'today', heard: plain(v, 'zh') });
    if (mk) return R(false, null, '', { kind: 'wrongverb' });
    return R(false, null, '', { kind: 'nothing' });
  }
  const VOL_JA = { rosa: '[売|う]ろう', tito: '[弾|ひ]こう', marta: '[焼|や]こう', bruno: 'しよう' };
  // (the cleanup pass, 2026-11-20) the task's verb in any form the dictionary reads, in characters, kana or rōmaji: «弾きます»,
  // «hikimasu» are the plain verb as much as «弾く» (a past, a «want», a «not» or an «if» aren't)
  function jaVerbAnyForm(text, verbs) {
    if (typeof DICT === 'undefined' || !DICT.ready || !DICT.ready() || (typeof LEX !== 'undefined' && LEX.lang !== 'ja')) return null;
    let a = null; try { a = DICT.analyze(String(text || '')); } catch (e) { return null; }
    const key = s => { try { return CJK.chars(String(s || ''), { lang: 'ja' }).replace(/\s+/g, ''); } catch (e) { return ''; } };
    const can = s => { try { return CJK.canon(String(s || ''), 'ja'); } catch (e) { return ''; } };
    const keys = verbs.map(x => ({ c: key(x), r: can(x) }));
    const w = ((a && a.words) || []).find(x => x.pos === 'v' && x.id && !x.unknown && keys.some(k => (k.c && k.c === key(x.lemma)) || (k.r && k.r === can(x.lemma))));
    const f = (w && w.f) || {};
    return w && f.tense !== 'past' && !f.want && !f.neg && !f.cond && !f.pot && f.mood !== 'vol' ? w : null;
  }
  function futJA(text, t, id) {
    const verbs = [t.verb.ja].concat((t.alt && t.alt.ja) || []), mk = MK_JA.find(m => cjHas(text, m, 'ja')), thing = thingIn(t, text, 'ja');
    const v = verbs.find(x => cjHas(text, x, 'ja')) || (jaVerbAnyForm(text, verbs) ? verbs[0] : null);
    if (v && mk) return R(true, thing ? 'S' : 'A', 'tomorrow’s words' + (thing ? '' : '; say what, too'), { kind: 'future' });
    if (VOL_JA[id] && cjHas(text, VOL_JA[id], 'ja')) return R(true, 'A', 'a «let’s» works too; つもり is the promise', { kind: 'future' });
    if (v) return R(true, 'B', 'the plain verb can mean tomorrow; with つもり it’s a promise', { kind: 'future' });
    if (mk) return R(false, null, '', { kind: 'wrongverb' });
    return R(false, null, '', { kind: 'nothing' });
  }
  function future(text, id, l = lang()) {
    const t = TASK[id]; if (!t || !String(text || '').trim()) return R(false, null, '', { kind: 'nothing' });
    return l === 'de' ? futDE(text, t) : l === 'zh' ? futZH(text, t) : l === 'ja' ? futJA(text, t, id) : futRomance(text, t, l === 'pt' ? 'pt' : 'es');
  }

  // a wish (the conditional): «me gustaría…», «eu gostaria de…», «ich würde gern…», 希望 / 要是…就好了, …たら いい な
  function wish(text, l = lang()) {
    const L = lowT(text), F = fl(text);
    if (l === 'es') {
      const m = L.match(/(?:^| )(?:me|nos|te|le) gustar(í|i)a(?:n)?(?: ([a-záéíóúñ]+))?/);
      // («gustaria» without its accent is no other word: it costs nothing, a tip shows it; P6a)
      if (m) { const inf = m[2] && /(?:ar|er|ir|ír)$/.test(m[2]), tip = m[1] === 'í' ? '' : typeof ACCENTS !== 'undefined' ? ACCENTS.tip('gustaría', 'es', 'gustaria') : 'Tip: «gustaría»'; return R(true, inf ? 'S' : 'A', inf ? 'a wish' : 'say what you’d like to do: «me gustaría oír…»', { kind: 'wish', tip }); }
      if (/(?:^| )[a-záéíóúñ]{2,}r(?:ía|ías|íamos|ían)(?= |$)/.test(L)) return R(true, 'A', 'a wish! Noa’s way: «me gustaría…»', { kind: 'wish' });
      if (rx('(?:me|nos) gusta|quiero|queremos').test(F)) return R(false, null, '', { kind: 'present' });
    } else if (l === 'pt') {
      if (rx('gostaria(?:mos)? de [a-zç]+(?:ar|er|ir|or)').test(F)) return R(true, 'S', 'a wish', { kind: 'wish' });
      if (rx('gostaria(?:mos)?').test(F)) return R(true, 'A', '«gostaria de» + the verb', { kind: 'wish' });
      if (/(?:^| )[a-zç]{2,}r(?:ia|iamos|iam)(?= |$)/.test(F)) return R(true, 'A', 'a wish! Noa’s way: «eu gostaria de…»', { kind: 'wish' });
      if (rx('gosto|quero|queremos').test(F)) return R(false, null, '', { kind: 'present' });
    } else if (l === 'de') {
      const ws = F.split(' '), umlaut = /würde|wuerde/.test(L), iw = ws.findIndex(w => /^(?:wurde|wuerde|wurden|wuerden|wurdest|wuerdest)$/.test(w));
      // («wurde» without its umlaut is another word, "became": the A stays, and says why; P6a, accents.js)
      if (iw >= 0) { const gern = ws.includes('gern') || ws.includes('gerne'), last = /en$|n$/.test(ws[ws.length - 1] || ''), why = !umlaut && typeof ACCENTS !== 'undefined' ? ACCENTS.word(L.split(' ')[iw] || 'wurde', 'würde', 'de').why : ''; return R(true, umlaut && gern && last ? 'S' : 'A', !umlaut ? why || 'the umlaut: «würde»' : !gern ? 'add «gern»: «ich würde gern…»' : !last ? 'the verb goes last' : 'a wish', { kind: 'wish' }); }
      if (rx('mochte|moechte|mochten|moechten|hatte gern|haette gern').test(F)) return R(true, 'A', 'a wish too! Noa’s way: «ich würde gern…»', { kind: 'wish' });
      if (rx('will|wollen|mag').test(F)) return R(false, null, '', { kind: 'present' });
    } else if (l === 'zh') {
      if (cjHas(text, '[希望|xī wàng]', 'zh') || (cjHas(text, '[就|jiù]', 'zh') && cjHas(text, '[好|hǎo]', 'zh') && (cjHas(text, '[要是|yào shi]', 'zh') || cjHas(text, '[如果|rú guǒ]', 'zh')))) return R(true, 'S', 'a wish', { kind: 'wish' });
      if (cjHas(text, '[想|xiǎng]', 'zh')) return R(true, 'A', '想 is «want»; a wish: 希望', { kind: 'wish' });
    } else if (l === 'ja') {
      if (['たら いい', 'ば いい', 'と いい', 'たら よかった'].some(p => cjHas(text, p, 'ja'))) return R(true, 'S', 'a wish', { kind: 'wish' });
      if (cjHas(text, 'たい', 'ja')) return R(true, 'A', '〜たい is «want»; a wish: 〜たら いい な', { kind: 'wish' });
    }
    return R(false, null, '', { kind: 'nothing' });
  }

  // an «if» trap: «Si baja, Mimo lo golpeará», «Se ele descer, o Mimo vai bater nele», «Wenn sie kommt, wird Mimo sie schlagen»,
  // 如果…就…, …たら、ミモが打つ
  const PRON_DE = ['sie', 'er', 'es', 'die', 'der', 'das', 'stille', 'grosse', 'grose', 'grossen'];
  function trap(text, l = lang()) {
    const L = lowT(text), F = fl(text), ws = F.split(' ').filter(Boolean);
    if (l === 'es' || l === 'pt') {
      const si = ws.indexOf(l === 'es' ? 'si' : 'se'); if (si < 0) return R(false, null, '', { kind: 'nosi' });
      const after = ws.slice(si + 1), futRe = l === 'es' ? /^[a-zñ]{2,}(?:re|ras|ra|remos|ran)$/ : /^[a-zç]{2,}(?:rei|ras|ra|remos|rao)$/;
      const futs = after.filter(w => futRe.test(w)).length + (l === 'es' ? (rx(IR.es + ' a [a-zñ]+(?:ar|er|ir)').test(after.join(' ')) ? 1 : 0) : (rx(IR.pt + ' [a-zç]+(?:ar|er|ir|or)').test(after.join(' ')) ? 1 : 0));
      if (!futs) return R(false, null, '', { kind: 'nofuture' });
      if (futs >= 2) return R(true, 'B', l === 'es' ? 'after «si», what it does now: «si baja»' : 'after «se», the verb like the whole verb: «se ele descer»', { kind: 'trap' });
      if (l === 'pt') { const subj = after.slice(0, 4).some(w => /(?:ar|er|ir|or)$/.test(w) || w === 'vier' || w === 'for'); return R(true, subj ? 'S' : 'B', subj ? 'a trap' : 'after «se», for what’s still to come: «se ele descer» (not «desce»)', { kind: 'trap' }); }
      const acc = /(?:rá|rán|ré|rás|remos)(?= |$)/.test(L) || rx(IR.es + ' a').test(F);
      if (acc) return R(true, 'S', 'a trap', { kind: 'trap' });
      // (the future without its accent, «golpeara»: it costs nothing, a tip shows it, unless it's another tense the task tells apart; P6a)
      const k = after.findIndex(w => futRe.test(w)), typed = k >= 0 ? (L.split(' ').filter(Boolean)[si + 1 + k] || after[k]) : '', right = typed.replace(/r(e|a|as|an)$/, (x, e) => 'r' + { e: 'é', a: 'á', as: 'ás', an: 'án' }[e]);
      const ac = typeof ACCENTS !== 'undefined' && typed && right !== typed ? ACCENTS.word(typed, right, 'es') : { keep: true, why: '' };
      return ac.keep ? R(true, 'A', ac.why || 'an accent: «golpeará»', { kind: 'trap' }) : R(true, 'S', 'a trap', { kind: 'trap', tip: ac.tip });
    }
    if (l === 'de') {
      const iw = ws.findIndex(w => w === 'wenn' || w === 'falls'); if (iw < 0) return R(false, null, '', { kind: 'nosi' });
      const iwd = ws.findIndex((w, i) => i > iw && WERDEN.includes(w)); if (iwd < 0) return R(false, null, '', { kind: 'nofuture' });
      const before = ws[iwd - 1] || '', verbLast = iwd - 1 > iw && !PRON_DE.includes(before);
      return R(true, verbLast ? 'S' : 'A', verbLast ? 'a trap' : 'after «wenn», its verb goes last: «wenn sie kommt»', { kind: 'trap' });
    }
    if (l === 'zh') {
      const ru = cjHas(text, '[如果|rú guǒ]', 'zh') || cjHas(text, '[要是|yào shi]', 'zh'), jiu = cjHas(text, '[就|jiù]', 'zh');
      if (ru && jiu) return R(true, 'S', 'a trap', { kind: 'trap' });
      if (ru) return R(true, 'A', 'add 就 (then): 如果…，就…', { kind: 'trap' });
      if (jiu) return R(true, 'B', 'start with 如果 (if)', { kind: 'trap' });
      return R(false, null, '', { kind: 'nosi' });
    }
    if (l === 'ja') {
      const c = (() => { try { return CJK.canon(text, 'ja'); } catch (e) { return ''; } })();
      const tara = /t(?:t)?ara|dara/.test(c), ba = /eba/.test(c), to = cjHas(text, 'と', 'ja');
      const hit = ['[打|う]つ', 'うつ', 'たたく', '[攻撃|こうげき]', '[打|う]って', '[跳|と]ぶ'].some(w => cjHas(text, w, 'ja'));
      if ((tara || ba) && hit) return R(true, 'S', 'a trap', { kind: 'trap' });
      if (tara || ba) return R(true, 'A', 'then say what {mimo} will do: …が 打つ', { kind: 'trap' });
      if (to && hit) return R(true, 'B', 'the trap form is たら: 来たら、…', { kind: 'trap' });
      return R(false, null, '', { kind: 'nosi' });
    }
    return R(false, null, '', { kind: 'nothing' });
  }

  // the plan for everyone: «¡Vamos a tocar la campana!», «Vamos tocar o sino!», «Wir werden die Glocke läuten!», 我们要敲钟, 鳴らす つもり
  function ring(text, l = lang()) {
    const L = lowT(text), F = fl(text);
    if (l === 'es') {
      const bell = /campana/.test(F);
      if (rx(IR.es + ' a (?:tocar|sonar|repicar)').test(F) || rx('(?:tocare|tocaremos|tocaran|tocara)').test(F)) return R(true, bell ? (/tocaré|tocaremos|tocarán|tocará/.test(L) || / a (?:tocar|sonar|repicar)/.test(F) ? 'S' : 'A') : 'A', bell ? 'a plan for everyone' : 'say what: «la campana»', { kind: 'ring' });
      if (rx('toquemos').test(F)) return R(true, 'B', '«toquemos» is «let’s»; tomorrow’s words: «vamos a tocar»', { kind: 'ring' });
      if (rx('tocamos|toco|toca').test(F)) return R(false, null, '', { kind: 'today', heard: (F.match(/tocamos|toco|toca/) || [''])[0] });
    } else if (l === 'pt') {
      const bell = /sino/.test(F);
      if (rx(IR.pt + ' (?:tocar|bater|badalar)').test(F) || rx('tocaremos|tocarei|tocarao').test(F)) return R(true, bell ? 'S' : 'A', bell ? 'a plan for everyone' : 'say what: «o sino»', { kind: 'ring' });
      if (rx('tocamos|toco|toca').test(F)) return R(false, null, '', { kind: 'today', heard: (F.match(/tocamos|toco|toca/) || [''])[0] });
    } else if (l === 'de') {
      const ws = F.split(' '), bell = ws.some(w => /^glocke/.test(w)), iw = ws.findIndex(w => WERDEN.includes(w)), iv = ws.findIndex((w, i) => i > iw && /^(?:lauten|laeuten|klingeln|schlagen|lauten)$/.test(w));
      if (iw >= 0 && iv > iw) return R(true, bell && iv === ws.length - 1 ? 'S' : 'A', !bell ? 'say what: «die Glocke»' : iv === ws.length - 1 ? 'a plan for everyone' : 'the verb goes last', { kind: 'ring' });
      if (ws[0] && /^(?:lauten|laeuten)$/.test(ws[0]) && ws[1] === 'wir') return R(true, 'B', '«läuten wir» is «let’s»; tomorrow’s words: «wir werden … läuten»', { kind: 'ring' });
      if (ws.some(w => /^(?:laut|lauten|laeut)/.test(w))) return R(false, null, '', { kind: 'today', heard: ws.find(w => /^(?:laut|laeut)/.test(w)) });
    } else if (l === 'zh') {
      const hit = ['[敲|qiāo]', '[撞|zhuàng]', '[打|dǎ]', '[摇|yáo]', '[响|xiǎng]'].some(w => cjHas(text, w, 'zh')) && cjHas(text, '[钟|zhōng]', 'zh'), mk = MK_ZH.find(m => cjHas(text, m, 'zh'));
      if (hit && mk) return R(true, 'S', 'a plan for everyone', { kind: 'ring' });
      if (hit && cjHas(text, '[吧|ba]', 'zh')) return R(true, 'B', '吧 is «let’s»; tomorrow’s words: 我们要敲钟', { kind: 'ring' });
      if (hit) return R(false, null, '', { kind: 'today', heard: '' });
    } else if (l === 'ja') {
      const hit = ['[鳴|な]らす', 'ならす', '[鐘|かね] を つく', '[鳴|な]らし'].some(w => cjHas(text, w, 'ja')), mk = MK_JA.find(m => cjHas(text, m, 'ja'));
      if (hit && mk) return R(true, 'S', 'a plan for everyone', { kind: 'ring' });
      if (cjHas(text, '[鳴|な]らそう', 'ja') || cjHas(text, 'ならそう', 'ja')) return R(true, 'A', 'a «let’s» works too; つもり is the plan', { kind: 'ring' });
      if (hit) return R(true, 'B', 'the plain verb can mean tomorrow; with つもり it’s a plan', { kind: 'ring' });
    }
    return R(false, null, '', { kind: 'nothing' });
  }
  const grade = { future, wish, trap, ring, _: { lowT, fl, lev } };

  return { T, L1, NAMES, WHO, ML, HUSH, DEMO, MARKS, TASK, FRAME, MODEL, CARD, grade, pick, plain, isC, lang };
})();
