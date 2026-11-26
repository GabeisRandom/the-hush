'use strict';
// The Past («el Ayer»), Chapter 2's first time realm: every word of it (past.js, past_scenes.js; DESIGN.md 13.2, 17.2b;
// game/REGIONS.md). es / pt / de, zh and ja in CJK.md's notation, and en. The people's lines are said through the story's
// shared say functions (STORY.demoLine for a demonstration: whole in the language, the shown words glossed; STORY.sayInline
// for everything else: the weave's mix, EN on request). Your own lines are English with your words woven in (STORY.you).
// The cast changes a little by language, so each language's lines name its own people; the English uses slots ({helper},
// {shy}, {ringer}, {rosita}, {elio}) filled with the language's names (PTXT.fill).
//   The day: the last Festival of Voices, long ago (the B1 books: the bells at dawn, everyone says their name, «Toda voz
//   cuenta»; the shy child the old bell ringer rang the bell for). That evening, at the spring concert in the theater (the Old
//   Quarter, cemetery.js's past era), Elio, a boy new in Alba, says one word wrong. The whole town laughs. He runs, his red cap
//   left on the stage, and never speaks again: the hooded figure. The Hush is born there (the boss).
//   The language: the past. The preterite first, for what happened («tocó»), then the imperfect for how it was («tenía
//   miedo», «estaba llena»). de: the Perfekt in speech, the Präteritum for the scene (Noa's memories, the old stories);
//   zh: 了 / 过 / 没, 以前… for how things were; ja: た-forms, and ～ていました.
// One global, PTXT: LINES (spoken), MARKS (a demonstration's shown words), CAST, NAMES, TASKS, CARDS, FIGHT, fill(), pick(),
// check() (every zh / ja string against CJK.validate). Loads before past.js.
const PTXT = (() => {
  // a line in every language; o.en_<l>: the English for one language (when its line differs)
  const L = (en, es, pt, de, zh, ja, o) => Object.assign({ en, es, pt, de, zh, ja }, o || {});
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const isC = l => l === 'zh' || l === 'ja';

  // ------------------------------------------------------------ the cast (by language: the B1 books' own people)
  // es: the shy girl is Evaristo's grandmother, and the bell ringer's helper is Bruno's father as a boy (he'd ring Alba's
  // bell for years: Bruno climbed behind him, counting the steps); pt: the shy boy is Benedito, the librarian's grandfather,
  // who stuttered (the bell rang three times for him); de: the helper is Karl, Herr Buchholz's grandfather, Alba's last
  // bell ringer; zh: the shy girl is Grandpa Bai's grandmother; ja: the helper is Fumita's grandfather, the bell ringer's
  // helper at the last festival («小さな声も、声だ»).
  const CAST = {
    elio: L('Elio', 'Elio', 'Elio', 'Elio', '[艾利欧|Ài lì ōu]', 'エリオ'),
    rosita: L('young Rosa', 'Rosita', 'Rosinha', 'Rosi', '[小|Xiǎo] [罗莎|Luó shā]', 'ロサ ちゃん'),
    ringer: L('the old bell ringer', 'don Celestino', 'seu Belarmino', 'Wendelin', '[钟|Zhōng] [爷爷|yé ye]', 'ゲンじい'),
    helper: L('the bell ringer’s helper', 'Nacho', 'Zeca', 'Karl', '[小|Xiǎo] [石头|Shí tou]', 'ふみた くん'),
    shy: L('the shy child', 'Adelita', 'Benedito', 'Lieschen', '[小|Xiǎo] [兰|Lán]', 'ハナ ちゃん'),
    noa: L('Noa', 'Noa', 'Noa', 'Noa', '[诺娅|Nuò yà]', 'ノア'),
    aurora: L('Aurora', 'Aurora', 'Aurora', 'Aurora', '[奥罗拉|Ào luó lā]', 'オーロラ'),
    voice: L('A voice', 'Una voz', 'Uma voz', 'Eine Stimme', '[有人|yǒu rén]', 'だれ か'),
  };
  // who's who, in English (the speaker's name under its line in English mode, and the quest texts)
  const WHO_EN = { es: { helper: 'Nacho', shy: 'Adelita', ringer: 'Don Celestino', rosita: 'Rosita' }, pt: { helper: 'Zeca', shy: 'Benedito', ringer: 'Seu Belarmino', rosita: 'Rosinha' },
    de: { helper: 'Karl', shy: 'Lieschen', ringer: 'old Wendelin', rosita: 'Rosi' }, zh: { helper: 'Little Stone', shy: 'Xiao Lan', ringer: 'Grandpa Zhong', rosita: 'little Rosa' },
    ja: { helper: 'Fumita', shy: 'Hana', ringer: 'Gen-jii', rosita: 'Rosa' } };
  const SHE = { es: { shy: 'she' }, pt: { shy: 'he' }, de: { shy: 'she' }, zh: { shy: 'she' }, ja: { shy: 'she' } };
  const NAMES = {
    past: L('the Past', 'el Ayer', 'o Ontem', 'das Gestern', '[昨天|zuó tiān]', '[昨日|きのう]'),
    future: L('the Future', 'el Mañana', 'o Amanhã', 'das Morgen', '[明天|míng tiān]', '[明日|あした]'),
    festival: L('the Festival of Voices', 'la Fiesta de las Voces', 'a Festa das Vozes', 'das Fest der Stimmen', '[声音节|Shēng yīn jié]', '「 [声|こえ] の [祭|まつ]り 」'),
    motto: L('Every voice counts', 'Toda voz cuenta', 'Toda voz conta', 'Jede Stimme zählt', '[每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù]', 'どの [声|こえ] も [大切|たいせつ]'),
    boss: L('the Echo of the Laughter', 'el Eco de la Risa', 'o Eco da Risada', 'das Echo des Gelächters', '[笑声|xiào shēng] [的|de] [回声|huí shēng]', '[笑|わら]い[声|ごえ] の こだま'),
    cap: L('Elio’s red cap', 'la gorra roja de Elio', 'o boné vermelho do Elio', 'Elios rote Mütze', '[艾利欧|Ài lì ōu] [的|de] [红|hóng] [帽子|mào zi]', 'エリオ くん の [赤|あか]い [帽子|ぼうし]'),
    alba: L('Alba, long ago', 'Alba, hace mucho', 'Alba, há muito tempo', 'Alba, vor langer Zeit', '[很久以前|hěn jiǔ yǐ qián] [的|de] [阿尔巴|Ā ěr bā]', '[昔|むかし] の アルバ'),
  };
  // the English with the language's cast in its slots ({helper}…), and «{mimo}» left for the weave
  function fill(s, l) {
    if (s == null) return '';
    const W = WHO_EN[l] || WHO_EN.es;
    return String(s).replace(/\{(helper|shy|ringer|rosita|elio)\}/g, (_, k) => (k === 'elio' ? 'Elio' : W[k] || k)).replace(/\{shyHe\}/g, (SHE[l] || SHE.es).shy);
  }
  // T's entry in a language (zh / ja: plain text in the mode, unless raw), else the English
  function pick(T, l, raw) {
    const v = T && (T[l] !== undefined ? T[l] : T.en);
    if (v == null) return '';
    return isC(l) && !raw && typeof CJK !== 'undefined' ? CJK.plain(v, { lang: l }) : v;
  }
  const en = (T, l) => fill((T && (T['en_' + l] || T.en)) || '', l);

  // ------------------------------------------------------------ lines (1): the arrival, the bell tower, the apples
  const LN = {
    // Noa's echo, at dawn by the bell tower
    'pa.noa.hear': L('Can you hear me? It’s me, Noa! I’m inside the {w.clock}… but from here I can see yesterday.',
      '¿Me oyes? ¡Soy yo, Noa! Estoy dentro del {w.clock}… pero desde aquí veo el ayer.',
      'Está me ouvindo? Sou eu, a Noa! Estou dentro do {w.clock}… mas daqui eu vejo o ontem.',
      'Hörst du mich? Ich bin’s, Noa! Ich bin in der {w.clock} … aber von hier aus sehe ich das Gestern.',
      '[你|nǐ] [听得见|tīng de jiàn] [吗|ma] ？ [是|shì] [我|wǒ] ， [诺娅|Nuò yà] ！ [我|wǒ] [在|zài] {w.clock} [里|lǐ] … [可是|kě shì] [从|cóng] [这里|zhè lǐ] [我|wǒ] [能|néng] [看见|kàn jiàn] [昨天|zuó tiān] 。',
      '[聞|き]こえる ？ わたし 、 ノア ！ {w.clock} の [中|なか] に いる の … でも 、 ここ から [昨日|きのう] が [見|み]える 。'),
    'pa.noa.alba': L('This is Alba, many years ago. Today is the Festival of Voices.',
      'Esto es Alba, hace muchos años. Hoy es la Fiesta de las Voces.',
      'Isto é Alba, muitos anos atrás. Hoje é a Festa das Vozes.',
      'Das ist Alba, vor vielen Jahren. Heute ist das Fest der Stimmen.',
      '[这|zhè] [是|shì] [很多|hěn duō] [年|nián] [以前|yǐ qián] [的|de] [阿尔巴|Ā ěr bā] 。 [今天|jīn tiān] [是|shì] [声音节|Shēng yīn jié] 。',
      'ここ は 、 [何年|なんねん] も [前|まえ] の アルバ 。 [今日|きょう] は 「 [声|こえ] の [祭|まつ]り 」 よ 。'),
    'pa.noa.rule': L('Here, everything has already happened. We can’t change it… but we can understand it.',
      'Aquí todo ya pasó. No podemos cambiarlo… pero sí podemos entenderlo.',
      'Aqui tudo já aconteceu. A gente não pode mudar… mas pode entender.',
      'Hier ist alles schon passiert. Wir können es nicht ändern … aber wir können es verstehen.',
      '[这里|zhè lǐ] [的|de] [一切|yī qiè] [都|dōu] [已经|yǐ jīng] [发生|fā shēng] [了|le] 。 [我们|wǒ men] [不能|bù néng] [改变|gǎi biàn] [它|tā] … [可是|kě shì] [我们|wǒ men] [能|néng] [明白|míng bai] [它|tā] 。',
      'ここ で は 、 ぜんぶ もう [起|お]きた こと 。 [変|か]えられない … でも 、 わかる こと は できる 。'),
    'pa.noa.him': L('The hooded figure lived here, as a child. Something happened today… something that silenced him.',
      'El encapuchado vivió aquí, de niño. Hoy pasó algo… algo que lo calló.',
      'O encapuzado morou aqui, quando era criança. Hoje aconteceu alguma coisa… algo que calou ele.',
      'Der Kapuzenmann hat hier als Kind gewohnt. Heute ist etwas passiert … etwas, das ihn still gemacht hat.',
      '[那|nà] [个|gè] [兜帽人|dōu mào rén] [小|xiǎo] [时候|shí hou] [住|zhù] [在|zài] [这里|zhè lǐ] 。 [今天|jīn tiān] [发生|fā shēng] [了|le] [一|yī] [件|jiàn] [事|shì] … [让|ràng] [他|tā] [再|zài] [也|yě] [不|bù] [说话|shuō huà] [了|le] 。',
      'フード の [男|おとこ] は 、 [子|こ]ども の とき 、 ここ に [住|す]んで いた 。 [今日|きょう] 、 [何|なに]か が [起|お]きた の … [彼|かれ] を [黙|だま]らせた [何|なに]か が 。'),
    'pa.noa.go': L('Go to the {w.bell} tower. I’ll follow you.',
      'Ve a la torre de la {w.bell}. Yo te sigo.',
      'Vai até a torre do {w.bell}. Eu vou com você.',
      'Geh zum Glockenturm. Ich komme mit.',
      '[去|qù] [钟楼|zhōng lóu] [吧|ba] 。 [我|wǒ] [跟着|gēn zhe] [你|nǐ] 。',
      '[鐘|かね] の [塔|とう] へ [行|い]って 。 わたし も [行|い]く 。'),
    // the bell tower: the helper comes down, counting; the old bell ringer (demonstrations: the preterite, I and he)
    'pa.help.demo': L('…a hundred and nineteen, a hundred and twenty! I climbed a hundred and twenty steps, and I rang the {w.bell}!',
      '¡…ciento diecinueve, ciento veinte! ¡Subí ciento veinte escalones y toqué la {w.bell}!',
      '…cento e dezenove, cento e vinte! Subi cento e vinte degraus e toquei o {w.bell}!',
      '… hundertneunzehn, hundertzwanzig! Ich bin hundertzwanzig Stufen hochgestiegen und habe die {w.bell} geläutet!',
      '… [一百一十九|yī bǎi yī shí jiǔ] ， [一百二十|yī bǎi èr shí] ！ [我|wǒ] [爬|pá] [了|le] [一百二十|yī bǎi èr shí] [级|jí] [台阶|tái jiē] ， [敲|qiāo] [了|le] {w.bell} ！',
      '… [百十九|ひゃくじゅうきゅう] 、 [百二十|ひゃくにじゅう] ！ [百二十段|ひゃくにじゅうだん] [登|のぼ]った ！ {w.bell} を [鳴|な]らした ！'),
    'pa.ring.demo': L('{helper} climbed up alone and rang the {w.bell}. Well done, lad!',
      'Nacho subió solo y tocó la {w.bell}. ¡Muy bien, muchacho!',
      'O Zeca subiu sozinho e tocou o {w.bell}. Muito bem, menino!',
      'Karl ist allein hochgestiegen und hat die {w.bell} geläutet. Sehr gut, Junge!',
      '[小|Xiǎo] [石头|Shí tou] [自己|zì jǐ] [爬|pá] [了|le] [上去|shàng qù] ， [敲|qiāo] [了|le] {w.bell} 。 [好|hǎo] [孩子|hái zi] ！',
      'ふみた くん が [一人|ひとり] で [登|のぼ]って 、 {w.bell} を [鳴|な]らしました 。 えらい ぞ ！'),
    'pa.shy.ask': L('What happened? I heard the {w.bell}… Who rang it?',
      '¿Qué pasó? Oí la {w.bell}… ¿Quién la tocó?',
      'O que aconteceu? Eu ouvi o {w.bell}… Quem tocou?',
      'Was ist passiert? Ich habe die {w.bell} gehört … Wer hat geläutet?',
      '[发生|fā shēng] [了|le] [什么|shén me] ？ [我|wǒ] [听见|tīng jiàn] {w.bell} [响|xiǎng] [了|le] … [是|shì] [谁|shéi] [敲|qiāo] [的|de] ？',
      '[何|なに] が あった の ？ {w.bell} が [聞|き]こえた … だれ が [鳴|な]らした の ？'),
    'pa.shy.thanks': L('{helper}? How brave! I… I don’t go up there. I’m scared of it.',
      '¿Nacho? ¡Qué valiente! Yo… yo no subo. Me da miedo.',
      'O Zeca? Que coragem! Eu… eu não subo lá. Tenho medo.',
      'Karl? Wie mutig! Ich … ich steige da nicht hoch. Ich habe Angst.',
      '[小|Xiǎo] [石头|Shí tou] ？ [真|zhēn] [勇敢|yǒng gǎn] ！ [我|wǒ] … [我|wǒ] [不敢|bù gǎn] [上去|shàng qù] 。',
      'ふみた くん ？ すごい ！ わたし は … こわくて [登|のぼ]れない 。'),
    'pa.ring.fest': L('Today is the Festival of Voices. In the plaza, everyone says their {w.name}. Every voice counts!',
      'Hoy es la Fiesta de las Voces. En la plaza, cada uno dice su {w.name}. ¡Toda voz cuenta!',
      'Hoje é a Festa das Vozes. Na praça, cada um diz o seu {w.name}. Toda voz conta!',
      'Heute ist das Fest der Stimmen. Auf dem Platz sagt jeder seinen Namen. Jede Stimme zählt!',
      '[今天|jīn tiān] [是|shì] [声音节|Shēng yīn jié] 。 [在|zài] [广场|guǎng chǎng] [上|shàng] ， [每|měi] [个|gè] [人|rén] [都|dōu] [说|shuō] [自己|zì jǐ] [的|de] [名字|míng zi] 。 [每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù] ！',
      '[今日|きょう] は 「 [声|こえ] の [祭|まつ]り 」 。 [広場|ひろば] で 、 みんな [自分|じぶん] の [名前|なまえ] を [言|い]う ん だ 。 どの [声|こえ] も [大切|たいせつ] ！'),
    'pa.ring.polish': L('We polished the {w.bell} yesterday. Look how it shines, like new!',
      'Ayer pulimos la {w.bell}. ¡Mira cómo brilla, como nueva!',
      'Ontem a gente poliu o {w.bell}. Olha como ele brilha, novinho!',
      'Gestern haben wir die {w.bell} poliert. Schau, wie sie glänzt, wie neu!',
      '[昨天|zuó tiān] [我们|wǒ men] [擦|cā] [了|le] {w.bell} 。 [你|nǐ] [看|kàn] ， [亮|liàng] [得|de] [像|xiàng] [新|xīn] [的|de] [一样|yī yàng] ！',
      '[昨日|きのう] 、 {w.bell} を みがきました 。 ほら 、 [新品|しんぴん] みたい に [光|ひか]って いる ！'),
    // the apples: young Rosa trips (a demonstration), Noa says how Mimo acts in the Past (a demonstration), Rosa's cheers
    'pa.rosa.fall': L('Oh no! My {w.apple:pl} fell!',
      '¡Ay, no! ¡Se cayeron mis {w.apple:pl}!',
      'Ai, não! Caíram as minhas {w.apple:pl}!',
      'Oh nein! Meine Äpfel sind runtergefallen!',
      '[哎呀|āi yā] ！ [我|wǒ] [的|de] [苹果|píng guǒ] [掉|diào] [了|le] ！',
      'あっ ！ りんご が [落|お]ちちゃった ！'),
    'pa.noa.memory': L('Here {mimo} can’t do anything new: it all already happened. Tell it like a memory: “{mimo} jumped.”',
      'Aquí {mimo} no puede hacer nada nuevo: todo ya pasó. Cuéntaselo como un recuerdo: «{mimo} saltó».',
      'Aqui o {mimo} não pode fazer nada novo: tudo já aconteceu. Conta como uma lembrança: «O {mimo} pulou».',
      'Hier kann {mimo} nichts Neues machen: Alles ist schon passiert. Erzähl es wie eine Erinnerung: «{mimo} ist gesprungen».',
      '[在|zài] [这里|zhè lǐ] ， {mimo} [不能|bù néng] [做|zuò] [新|xīn] [的|de] [事|shì] ： [一切|yī qiè] [都|dōu] [已经|yǐ jīng] [发生|fā shēng] [了|le] 。 [要|yào] [像|xiàng] [讲|jiǎng] [回忆|huí yì] [一样|yī yàng] [说|shuō] ： “ {mimo} [跳|tiào] [了|le] ” 。',
      'ここ で は 、 {mimo} は [新|あたら]しい こと が できない 。 ぜんぶ もう [起|お]きた から 。 [思|おも]い[出|で] みたい に [言|い]って ： 「 {mimo} が [跳|と]んだ 」 。'),
    'pa.rosa.jump': L('{mimo} jumped so high! Like a rabbit!',
      '¡{mimo} saltó altísimo! ¡Como un conejo!',
      'O {mimo} pulou bem alto! Que nem um coelho!',
      '{mimo} ist so hoch gesprungen! Wie ein Hase!',
      '{mimo} [跳|tiào] [了|le] [好|hǎo] [高|gāo] ！ [像|xiàng] [兔子|tù zi] [一样|yī yàng] ！',
      '{mimo} 、 すごく [高|たか]く [跳|と]んだ ！ うさぎ みたい ！'),
    'pa.rosa.swim': L('{mimo} swam like a duck!',
      '¡{mimo} nadó como un pato!',
      'O {mimo} nadou que nem um pato!',
      '{mimo} ist geschwommen wie eine Ente!',
      '{mimo} [游|yóu] [了|le] [过去|guò qù] ， [像|xiàng] [鸭子|yā zi] [一样|yī yàng] ！',
      '{mimo} が アヒル みたい に [泳|およ]いだ ！'),
    'pa.rosa.push': L('{mimo} pushed the cart! So strong!',
      '¡{mimo} empujó el carro! ¡Qué fuerte!',
      'O {mimo} empurrou o carrinho! Que forte!',
      '{mimo} hat den Wagen geschoben! So stark!',
      '{mimo} [推|tuī] [了|le] [小车|xiǎo chē] ！ [好|hǎo] [有|yǒu] [力气|lì qi] ！',
      '{mimo} が [荷車|にぐるま] を [押|お]した ！ [力持|ちからも]ち ！'),
    'pa.rosa.thanks': L('Thanks! Here, take this {w.apple}. My dad grows the best ones in Alba.',
      '¡Gracias! Toma una {w.apple}. Mi papá cultiva las mejores de Alba.',
      'Obrigada! Toma uma {w.apple}. O meu pai planta as melhores de Alba.',
      'Danke! Hier, ein Apfel für dich. Mein Papa hat die besten Äpfel in ganz Alba.',
      '[谢谢|xiè xie] ！ [给|gěi] [你|nǐ] [一个|yī gè] [苹果|píng guǒ] 。 [我|wǒ] [爸爸|bà ba] [种|zhòng] [的|de] [苹果|píng guǒ] [是|shì] [阿尔巴|Ā ěr bā] [最|zuì] [好|hǎo] [的|de] 。',
      'ありがとう ！ はい 、 りんご あげる 。 お[父|とう]さん の りんご は アルバ で いちばん おいしい の 。'),
    'pa.rosa.elio': L('Do you know {elio}? He’s new here. Tonight he’s giving a little speech at the theater… and I’m singing in the choir!',
      '¿Conoces a Elio? Es nuevo. Esta noche habla en el teatro… ¡y yo canto en el coro!',
      'Você conhece o Elio? Ele é novo aqui. Hoje à noite ele vai falar no teatro… e eu vou cantar no coral!',
      'Kennst du Elio? Er ist neu hier. Heute Abend spricht er im Theater … und ich singe im Chor!',
      '[你|nǐ] [认识|rèn shi] [艾利欧|Ài lì ōu] [吗|ma] ？ [他|tā] [是|shì] [新|xīn] [来|lái] [的|de] 。 [今天|jīn tiān] [晚上|wǎn shang] [他|tā] [在|zài] [剧院|jù yuàn] [讲话|jiǎng huà] … [我|wǒ] [在|zài] [合唱团|hé chàng tuán] [唱歌|chàng gē] ！',
      'エリオ くん 、 [知|し]ってる ？ [新|あたら]しく [来|き]た [子|こ] なの 。 [今夜|こんや] 、 [劇場|げきじょう] で [話|はな]す ん だ よ … わたし は [合唱|がっしょう] で [歌|うた]う の ！'),
    // the memories' shadows (the Hush, come through the clock with you): the first time fight
    'pa.noa.echoes': L('Careful! Those shadows came with us through the {w.clock}. In a fight too: tell it like a memory!',
      '¡Cuidado! Esas sombras vinieron con nosotros por el {w.clock}. En la pelea también: ¡díselo como un recuerdo!',
      'Cuidado! Essas sombras vieram com a gente pelo {w.clock}. Na luta também: fala como uma lembrança!',
      'Vorsicht! Diese Schatten sind mit uns durch die {w.clock} gekommen. Auch im Kampf: Erzähl es wie eine Erinnerung!',
      '[小心|xiǎo xīn] ！ [这些|zhè xiē] [影子|yǐng zi] [跟着|gēn zhe] [我们|wǒ men] [从|cóng] {w.clock} [里|lǐ] [过来|guò lái] [了|le] 。 [打|dǎ] [的|de] [时候|shí hou] [也|yě] [要|yào] [像|xiàng] [讲|jiǎng] [回忆|huí yì] [一样|yī yàng] [说|shuō] ！',
      '[気|き] を つけて ！ あの [影|かげ] は 、 わたしたち と [一緒|いっしょ] に {w.clock} を [通|とお]って [来|き]た の 。 [戦|たたか]う とき も 、 [思|おも]い[出|で] みたい に [言|い]って ！'),
  };
  // the shown words of each demonstration (marks: [the words as written (zh / ja: notation tokens), their English])
  const MARKS = {
    'pa.help.demo': { es: [['Subí', 'I climbed'], ['toqué', 'I rang']], pt: [['Subi', 'I climbed'], ['toquei', 'I rang']], de: [['hochgestiegen', 'climbed up'], ['geläutet', 'rung']],
      zh: [['[爬|pá] [了|le]', 'climbed'], ['[敲|qiāo] [了|le]', 'rang']], ja: [['[登|のぼ]った', 'climbed'], ['[鳴|な]らした', 'rang']] },
    'pa.ring.demo': { es: [['subió', 'climbed'], ['tocó', 'rang']], pt: [['subiu', 'climbed'], ['tocou', 'rang']], de: [['hochgestiegen', 'climbed up'], ['geläutet', 'rung']],
      zh: [['[爬|pá] [了|le]', 'climbed'], ['[敲|qiāo] [了|le]', 'rang']], ja: [['[登|のぼ]って', 'climbed'], ['[鳴|な]らしました', 'rang']] },
    'pa.rosa.fall': { es: [['Se cayeron', 'fell']], pt: [['Caíram', 'fell']], de: [['runtergefallen', 'fallen down']], zh: [['[掉|diào] [了|le]', 'fell']], ja: [['[落|お]ちちゃった', 'fell, oops']] },
    'pa.noa.memory': { es: [['saltó', 'jumped']], pt: [['pulou', 'jumped']], de: [['ist gesprungen', 'jumped']], zh: [['[跳|tiào] [了|le]', 'jumped']], ja: [['[跳|と]んだ', 'jumped']] },
    'pa.ring.polish': { es: [['pulimos', 'we polished']], pt: [['poliu', 'polished']], de: [['haben', 'have'], ['poliert', 'polished']], zh: [['[擦|cā] [了|le]', 'polished']], ja: [['みがきました', 'polished']] },
  };

  // ------------------------------------------------------------ lines (2): the names, Elio, how it was
  Object.assign(LN, {
    'pa.ring.open': L('Neighbors! The Festival of Voices begins! Everyone, your {w.name}, nice and loud. Every voice counts!',
      '¡Vecinos! ¡Empieza la Fiesta de las Voces! Cada uno, su {w.name}, bien fuerte. ¡Toda voz cuenta!',
      'Vizinhos! Começa a Festa das Vozes! Cada um, o seu {w.name}, bem alto. Toda voz conta!',
      'Nachbarn! Das Fest der Stimmen beginnt! Jeder sagt seinen Namen, schön laut. Jede Stimme zählt!',
      '[乡亲们|xiāng qīn men] ！ [声音节|Shēng yīn jié] [开始|kāi shǐ] [了|le] ！ [每|měi] [个|gè] [人|rén] [大声|dà shēng] [说|shuō] [自己|zì jǐ] [的|de] [名字|míng zi] 。 [每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù] ！',
      'みなさん ！ 「 [声|こえ] の [祭|まつ]り 」 の はじまり だ ！ [一人|ひとり] ずつ 、 [大|おお]きな [声|こえ] で [名前|なまえ] を ！ どの [声|こえ] も [大切|たいせつ] ！'),
    // the shy child's turn: so quiet (pt: Benedito stutters, and gets there); then the old bell ringer (a demonstration)
    'pa.shy.name': L('…{shy}.', '… A-Adelita.', 'Be… Be… Be… Benedito!', '… Lieschen.', '… [小|Xiǎo] [兰|Lán] 。', '… ハナ 。'),
    'pa.ring.forher': L('{shy} said her name! Quietly… but she said it. This ring of the {w.bell} is for her!',
      '¡Adelita dijo su nombre! Bajito… pero lo dijo. ¡Esta campanada es para ella!',
      'O Benedito disse o nome dele! Devagar… mas disse. Essas três badaladas são pra ele!',
      'Lieschen hat ihren Namen gesagt! Leise … aber sie hat ihn gesagt. Dieser Glockenschlag ist für sie!',
      '[小|Xiǎo] [兰|Lán] [说|shuō] [了|le] [她|tā] [的|de] [名字|míng zi] ！ [声音|shēng yīn] [很|hěn] [小|xiǎo] … [可是|kě shì] [她|tā] [说|shuō] [了|le] 。 [这|zhè] [一|yī] [声|shēng] [钟|zhōng] [是|shì] [为|wèi] [她|tā] [敲|qiāo] [的|de] ！',
      'ハナ ちゃん が [名前|なまえ] を [言|い]いました ！ [小|ちい]さな [声|こえ] … でも 、 [言|い]いました 。 この [鐘|かね] は 、 ハナ ちゃん の ため ！',
      { en_pt: '{shy} said his name! Slowly… but he said it. These three rings are for him!' }),
    'pa.elio.name': L('My… my name is Elio.', 'Me… me llamo Elio.', 'Meu… meu nome é Elio.', 'Ich … ich heiße Elio.',
      '[我|wǒ] … [我|wǒ] [叫|jiào] [艾利欧|Ài lì ōu] 。', 'ぼく … ぼく は 、 エリオ です 。'),
    'pa.ring.you': L('And you? Come on! Every voice counts!', '¿Y tú? ¡Ven! ¡Toda voz cuenta!', 'E você? Vem! Toda voz conta!', 'Und du? Komm! Jede Stimme zählt!',
      '[你|nǐ] [呢|ne] ？ [来|lái] [吧|ba] ！ [每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù] ！', 'あなた は ？ さあ ！ どの [声|こえ] も [大切|たいせつ] ！'),
    'pa.noa.notebook': L('He took my notebook… Will you help me remember? Tell me what happened.',
      'Él se llevó mi cuaderno… ¿Me ayudas a recordar? Cuéntame lo que pasó.',
      'Ele levou o meu caderno… Me ajuda a lembrar? Conta o que aconteceu.',
      'Er hat mein Heft mitgenommen … Hilfst du mir beim Erinnern? Erzähl mir, was passiert ist.',
      '[他|tā] [拿走|ná zǒu] [了|le] [我|wǒ] [的|de] [本子|běn zi] … [你|nǐ] [帮|bāng] [我|wǒ] [记住|jì zhù] [好|hǎo] [吗|ma] ？ [告诉|gào su] [我|wǒ] [发生|fā shēng] [了|le] [什么|shén me] 。',
      '[彼|かれ] に ノート を [取|と]られちゃった … [覚|おぼ]えて おく の 、 [手伝|てつだ]って くれる ？ [何|なに] が あった か [教|おし]えて 。'),
    // Elio by the duck pond: his speech (said right, here), what it was like when he came (a demonstration of the imperfect)
    'pa.elio.practice': L('My dad and I arrived in winter. Now we’re very happy here. Thank you, Alba!',
      'Mi papá y yo llegamos en invierno. Ahora estamos muy felices aquí. ¡Gracias, Alba!',
      'Meu pai e eu chegamos no inverno. Agora estamos muito felizes aqui. Obrigado, Alba!',
      'Hallo zusammen! Ich heiße Elio. Ich liebe eure Glocken! Danke, Alba!',
      '[大家|dà jiā] [好|hǎo] ！ [我|wǒ] [叫|jiào] [艾利欧|Ài lì ōu] 。 [我|wǒ] [和|hé] [爸爸|bà ba] [冬天|dōng tiān] [来|lái] [到|dào] [了|le] [这里|zhè lǐ] 。 [谢谢|xiè xie] [阿尔巴|Ā ěr bā] ！',
      'みなさん 、 こんばんは 。 エリオ です 。 アルバ の みなさん は 、 とても [親切|しんせつ] です 。 ありがとう ！',
      { en_de: 'Hello, everyone! My name is Elio. I love your {w.bell:pl}! Thank you, Alba!', en_zh: 'Hello, everyone! My name is Elio. My dad and I came here in winter. Thank you, Alba!',
        en_ja: 'Good evening, everyone. I’m Elio. The people of Alba are very kind. Thank you!' }),
    'pa.elio.heard': L('Did… did you hear me? It’s for tonight, at the theater. I’m practicing.',
      '¿Me… me oíste? Es para esta noche, en el teatro. Estoy practicando.',
      'Você… você me ouviu? É pra hoje à noite, no teatro. Estou treinando.',
      'Hast du … hast du mich gehört? Das ist für heute Abend, im Theater. Ich übe.',
      '[你|nǐ] … [你|nǐ] [听见|tīng jiàn] [了|le] ？ [这|zhè] [是|shì] [今天|jīn tiān] [晚上|wǎn shang] [在|zài] [剧院|jù yuàn] [说|shuō] [的|de] 。 [我|wǒ] [在|zài] [练习|liàn xí] 。',
      '[聞|き]こえ … ちゃった ？ [今夜|こんや] 、 [劇場|げきじょう] で [話|はな]す の 。 [練習|れんしゅう] して る ん だ 。'),
    'pa.elio.story': L('When I arrived, I didn’t know anyone. I couldn’t speak well. I was scared… But {rosita} talked to me first.',
      'Cuando llegué, no conocía a nadie. No hablaba bien. Tenía miedo… Pero Rosita me habló primero.',
      'Quando eu cheguei, eu não conhecia ninguém. Eu não falava bem. Eu tinha medo… Mas a Rosinha falou comigo primeiro.',
      'Als ich angekommen bin, kannte ich niemanden. Ich sprach nicht gut. Ich hatte Angst … Aber Rosi hat als Erste mit mir geredet.',
      '[我|wǒ] [刚|gāng] [来|lái] [的|de] [时候|shí hou] ， [谁|shéi] [都|dōu] [不|bù] [认识|rèn shi] ， [也|yě] [不会|bù huì] [说|shuō] 。 [我|wǒ] [很|hěn] [害怕|hài pà] … [可是|kě shì] [小|Xiǎo] [罗莎|Luó shā] [先|xiān] [跟|gēn] [我|wǒ] [说话|shuō huà] [了|le] 。',
      '[来|き]た とき 、 だれ も [知|し]らなかった 。 うまく [話|はな]せなかった 。 こわかった … でも 、 ロサ ちゃん が [最初|さいしょ] に [話|はな]しかけて くれた 。'),
    'pa.elio.guo': L('I’d never heard a {w.bell} before I came. Have you?', '', '', '', '[以前|yǐ qián] [我|wǒ] [没|méi] [听|tīng] [过|guo] [钟声|zhōng shēng] 。 [你|nǐ] [听|tīng] [过|guo] [吗|ma] ？', ''),
    'pa.elio.you': L('And you? You’re not from here either, are you? What was it like when you arrived?',
      '¿Y tú? Tú tampoco eres de aquí, ¿verdad? ¿Cómo fue cuando llegaste?',
      'E você? Você também não é daqui, né? Como foi quando você chegou?',
      'Und du? Du bist auch nicht von hier, oder? Wie war es, als du angekommen bist?',
      '[你|nǐ] [呢|ne] ？ [你|nǐ] [也|yě] [不是|bù shì] [这里|zhè lǐ] [的|de] [人|rén] [吧|ba] ？ [你|nǐ] [刚|gāng] [来|lái] [的|de] [时候|shí hou] [怎么样|zěn me yàng] ？',
      'あなた は ？ あなた も ここ の [人|ひと] じゃ ない よね ？ [来|き]た とき 、 どう だった ？'),
    'pa.elio.same': L('Just like me! Then… you understand me.', '¡Como yo! Entonces… tú me entiendes.', 'Igual a mim! Então… você me entende.', 'Wie ich! Dann … verstehst du mich.',
      '[跟|gēn] [我|wǒ] [一样|yī yàng] ！ [那|nà] [你|nǐ] [懂|dǒng] [我|wǒ] 。', 'ぼく と [同|おな]じ だ ！ じゃあ … わかって くれる ね 。'),
    'pa.elio.cap': L('My dad gave me this cap. For luck. Tonight at eight, I’ll speak. Will you come?',
      'Mi papá me dio esta gorra. Para la suerte. Esta noche, a las ocho, hablo. ¿Vienes?',
      'O meu pai me deu este boné. Pra dar sorte. Hoje à noite, às oito, eu falo. Você vem?',
      'Mein Papa hat mir diese Mütze geschenkt. Als Glücksbringer. Heute Abend um acht spreche ich. Kommst du?',
      '[这|zhè] [顶|dǐng] [帽子|mào zi] [是|shì] [爸爸|bà ba] [给|gěi] [我|wǒ] [的|de] ， [能|néng] [带来|dài lái] [好运|hǎo yùn] 。 [今天|jīn tiān] [晚上|wǎn shang] [八|bā] [点|diǎn] [我|wǒ] [讲话|jiǎng huà] 。 [你|nǐ] [来|lái] [吗|ma] ？',
      'この [帽子|ぼうし] 、 お[父|とう]さん が くれた ん だ 。 お[守|まも]り なんだ 。 [今夜|こんや] [八時|はちじ] に [話|はな]す よ 。 [来|き]て くれる ？'),
    // how it was: Noa remembers the festival with you (demonstrations of the imperfect; de: the Präteritum of a memory)
    'pa.noa.remember': L('In the present, all of this is gray and silent. Help me remember it: what was it like?',
      'En el presente, todo esto es gris y callado. Ayúdame a recordarlo: ¿cómo era?',
      'No presente, tudo isso é cinza e calado. Me ajuda a lembrar: como era?',
      'In der Gegenwart ist das alles grau und still. Hilf mir, mich zu erinnern: Wie war es?',
      '[在|zài] [现在|xiàn zài] ， [这里|zhè lǐ] [都|dōu] [是|shì] [灰色|huī sè] [的|de] ， [没有|méi yǒu] [声音|shēng yīn] 。 [帮|bāng] [我|wǒ] [记住|jì zhù] ： [以前|yǐ qián] [是|shì] [什么|shén me] [样子|yàng zi] ？',
      '[今|いま] の アルバ は 、 [灰色|はいいろ] で [静|しず]か 。 [覚|おぼ]えて おきたい の 。 どんな ふう だった ？'),
    'pa.noa.s1': L('Look: the fountain was full of {w.flower:pl}.', 'Mira: la fuente estaba llena de {w.flower:pl}.', 'Olha: a fonte estava cheia de {w.flower:pl}.', 'Schau: Der Brunnen war voller Blumen.',
      '[你|nǐ] [看|kàn] ： [以前|yǐ qián] ， [喷泉|pēn quán] [里|lǐ] [都|dōu] [是|shì] [花|huā] 。', '[見|み]て 。 [噴水|ふんすい] は [花|はな] で いっぱい でした 。'),
    'pa.noa.s2': L('The lanterns were shining.', 'Las linternas brillaban.', 'As lanternas brilhavam.', 'Die Laternen leuchteten.',
      '[以前|yǐ qián] ， [灯笼|dēng long] [很|hěn] [亮|liàng] 。', 'ランタン が [光|ひか]って いました 。'),
    'pa.noa.s3': L('Look! {rosita} was singing, and the children were dancing.', '¡Mira! Rosita cantaba y los niños bailaban.', 'Olha! A Rosinha cantava e as crianças dançavam.', 'Schau! Rosi sang, und die Kinder tanzten.',
      '[你|nǐ] [看|kàn] ！ [以前|yǐ qián] [小|Xiǎo] [罗莎|Luó shā] [唱歌|chàng gē] ， [孩子|hái zi] [们|men] [跳舞|tiào wǔ] 。', '[見|み]て ！ ロサ ちゃん が [歌|うた]って いました 。 [子|こ]ども たち は [踊|おど]って いました 。'),
    'pa.noa.thanks6': L('Thank you. Now I won’t forget it. It’s almost eight… let’s go to the theater.',
      'Gracias. Ahora no lo voy a olvidar. Ya casi son las ocho… vamos al teatro.',
      'Obrigada. Agora eu não vou esquecer. Já são quase oito… vamos pro teatro.',
      'Danke. Jetzt vergesse ich es nicht mehr. Es ist fast acht … gehen wir zum Theater.',
      '[谢谢|xiè xie] 。 [现在|xiàn zài] [我|wǒ] [不会|bù huì] [忘|wàng] [了|le] 。 [快|kuài] [八|bā] [点|diǎn] [了|le] … [我们|wǒ men] [去|qù] [剧院|jù yuàn] [吧|ba] 。',
      'ありがとう 。 もう [忘|わす]れない 。 もうすぐ [八時|はちじ] … [劇場|げきじょう] へ [行|い]こう 。'),
  });
  Object.assign(MARKS, {
    'pa.ring.forher': { es: [['dijo', 'said']], pt: [['disse', 'said']], de: [['gesagt', 'said']], zh: [['[说|shuō] [了|le]', 'said']], ja: [['[言|い]いました', 'said']] },
    'pa.elio.practice': { es: [['llegamos', 'we arrived'], ['felices', 'happy']], pt: [['chegamos', 'we arrived'], ['felizes', 'happy']], de: [['Glocken', 'bells']],
      zh: [['[大家|dà jiā] [好|hǎo]', 'hello, everyone'], ['[来|lái] [到|dào] [了|le]', 'came to']], ja: [['[親切|しんせつ]', 'kind']] },
    'pa.elio.story': { es: [['conocía', 'I knew'], ['hablaba', 'I spoke'], ['Tenía miedo', 'I was scared']], pt: [['conhecia', 'I knew'], ['falava', 'I spoke'], ['tinha medo', 'I was scared']],
      de: [['kannte', 'I knew'], ['sprach', 'I spoke'], ['hatte Angst', 'I was scared']], zh: [['[刚|gāng] [来|lái] [的|de] [时候|shí hou]', 'when I’d just come'], ['[害怕|hài pà]', 'scared']],
      ja: [['[知|し]らなかった', 'didn’t know'], ['[話|はな]せなかった', 'couldn’t speak'], ['こわかった', 'was scared']] },
    'pa.elio.guo': { zh: [['[没|méi] [听|tīng] [过|guo]', 'had never heard'], ['[听|tīng] [过|guo]', 'have heard']] },
    'pa.noa.s1': { es: [['estaba', 'was'], ['llena de', 'full of']], pt: [['estava', 'was'], ['cheia de', 'full of']], de: [['war', 'was'], ['voller', 'full of']],
      zh: [['[以前|yǐ qián]', 'back then'], ['[喷泉|pēn quán]', 'fountain']], ja: [['いっぱい でした', 'was full']] },
    'pa.noa.s2': { es: [['brillaban', 'were shining']], pt: [['brilhavam', 'were shining']], de: [['leuchteten', 'shone']], zh: [['[灯笼|dēng long]', 'lanterns'], ['[亮|liàng]', 'bright']], ja: [['[光|ひか]って いました', 'were shining']] },
    'pa.noa.s3': { es: [['cantaba', 'was singing'], ['bailaban', 'were dancing']], pt: [['cantava', 'was singing'], ['dançavam', 'were dancing']], de: [['sang', 'sang'], ['tanzten', 'danced']],
      zh: [['[唱歌|chàng gē]', 'sang'], ['[跳舞|tiào wǔ]', 'danced']], ja: [['[歌|うた]って いました', 'was singing'], ['[踊|おど]って いました', 'were dancing']] },
  });

  // ------------------------------------------------------------ lines (3): the concert, the laughter, after
  Object.assign(LN, {
    'pa.aurora.door': L('Come in, come in! It’s about to start!', '¡Adelante, adelante! ¡Ya empieza!', 'Entrem, entrem! Já vai começar!', 'Herein, herein! Gleich geht’s los!',
      '[请|qǐng] [进|jìn] ， [请|qǐng] [进|jìn] ！ [马上|mǎ shàng] [开始|kāi shǐ] [了|le] ！', 'どうぞ 、 どうぞ ！ もうすぐ [始|はじ]まります よ ！'),
    'pa.aurora.intro': L('And now… {elio}, our new neighbor, would like to say something.',
      'Y ahora… Elio, nuestro vecino nuevo, quiere decirnos algo.',
      'E agora… o Elio, o nosso vizinho novo, quer dizer uma coisa.',
      'Und jetzt … Elio, unser neuer Nachbar, möchte uns etwas sagen.',
      '[现在|xiàn zài] … [我们|wǒ men] [的|de] [新|xīn] [邻居|lín jū] [艾利欧|Ài lì ōu] [想|xiǎng] [跟|gēn] [大家|dà jiā] [说|shuō] [几|jǐ] [句|jù] [话|huà] 。',
      'それ では … [新|あたら]しい ご[近所|きんじょ] の エリオ くん から 、 ひとこと 。'),
    // the slip: one word wrong (es papá → papa, a potato; pt pai → pão, bread; de Glocken → Glucken, broody hens;
    // zh 大家 dàjiā, everyone → 打架 dǎjià, fighting; ja 親切 しんせつ, kind → 新鮮 しんせん, fresh)
    'pa.elio.stage': L('Hello, everyone… My name is Elio. My potato and I…',
      'Hola a todos… Me llamo Elio. Mi papa y yo…',
      'Oi, gente… Meu nome é Elio. Meu pão e eu…',
      'Hallo zusammen … Ich heiße Elio. Ich liebe eure … Glucken!',
      '[打架|dǎ jià] [好|hǎo] ！ … [我|wǒ] [叫|jiào] [艾利欧|Ài lì ōu] …',
      'アルバ の みなさん は … とても [新鮮|しんせん] です ！',
      { en_pt: 'Hi, everyone… My name is Elio. My bread and I…', en_de: 'Hello, everyone… My name is Elio. I love your… broody hens!',
        en_zh: '“Fighting is good!”… My name is Elio…', en_ja: 'The people of Alba are… very fresh!' }),
    'pa.crowd.joke': L('His POTATO? Ha!', '¿Su PAPA? ¡Una papa!', 'O pão dele? Hahaha!', 'Glucken? Er liebt unsere Hühner!',
      '[打架|dǎ jià] ？ [他|tā] [要|yào] [打架|dǎ jià] ！ [哈哈|hā hā] ！', 'しんせん ？ お[魚|さかな] みたい ！ あはは ！',
      { en_pt: 'His bread? Hahaha!', en_de: 'Broody hens? He loves our chickens!', en_zh: 'Fighting? He wants a fight! Haha!', en_ja: 'Fresh? Like a fish! Ahaha!' }),
    'pa.aurora.stop': L('Quiet, please! Every voice counts!', '¡Silencio, por favor! ¡Toda voz cuenta!', 'Silêncio, por favor! Toda voz conta!', 'Ruhe, bitte! Jede Stimme zählt!',
      '[请|qǐng] [安静|ān jìng] ！ [每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù] ！', '[静|しず]か に ！ どの [声|こえ] も [大切|たいせつ] です ！'),
    'pa.noa.born': L('No… That’s how it began. The {c.silence} was born here.', 'No… Así empezó. El Silencio nació aquí.', 'Não… Foi assim que começou. O Silêncio nasceu aqui.',
      'Nein … So hat es angefangen. Die Stille ist hier geboren.', '[不|bù] … [原来|yuán lái] [是|shì] [这样|zhè yàng] [开始|kāi shǐ] [的|de] 。 [寂静|Jì jìng] [是|shì] [在|zài] [这里|zhè lǐ] [出生|chū shēng] [的|de] 。',
      'そんな … こうして [始|はじ]まった の 。 [静寂|せいじゃく] は 、 ここ で [生|う]まれた 。'),
    // after the fight: Noa tells it as it happened (a demonstration: both pasts), and who the boy was
    'pa.noa.retell': L('{elio} was nervous. He said one word wrong… Everybody laughed. And he ran off, all alone, to the north.',
      'Elio estaba nervioso. Dijo «papa», no «papá»… Todos se rieron. Y él se fue, solo, hacia el norte.',
      'O Elio estava nervoso. Disse «pão», não «pai»… Todo mundo riu. E ele foi embora, sozinho, pro norte.',
      'Elio war nervös. Er hat «Glucken» gesagt, nicht «Glocken» … Alle haben gelacht. Und er ist weggelaufen, allein, nach Norden.',
      '[艾利欧|Ài lì ōu] [很|hěn] [紧张|jǐn zhāng] 。 [他|tā] [说|shuō] [了|le] “ [打架|dǎ jià] ” ， [不是|bù shì] “ [大家|dà jiā] ” … [大家|dà jiā] [都|dōu] [笑|xiào] [了|le] 。 [他|tā] [没|méi] [说完|shuō wán] ， [一个人|yī gè rén] [往|wǎng] [北|běi] [跑|pǎo] [了|le] 。',
      'エリオ くん は [緊張|きんちょう] して いました 。 「 [親切|しんせつ] 」 じゃ なくて 、 「 [新鮮|しんせん] 」 って [言|い]って しまった … みんな が [笑|わら]いました 。 そして 、 [一人|ひとり] で [北|きた] へ [走|はし]って [行|い]きました 。'),
    'pa.noa.who': L('That boy… is him. The hooded figure. After that night, he never spoke again.',
      'Ese niño… es él. El encapuchado. Desde esa noche, no volvió a hablar.',
      'Aquele menino… é ele. O encapuzado. Depois daquela noite, ele nunca mais falou.',
      'Dieser Junge … das ist er. Der Kapuzenmann. Seit dieser Nacht hat er nie wieder gesprochen.',
      '[那|nà] [个|gè] [孩子|hái zi] … [就是|jiù shì] [他|tā] 。 [兜帽人|dōu mào rén] 。 [从|cóng] [那|nà] [天|tiān] [晚上|wǎn shang] [起|qǐ] ， [他|tā] [再|zài] [也|yě] [没|méi] [说|shuō] [过|guo] [话|huà] 。',
      'あの [子|こ] … あれ が [彼|かれ] 。 フード の [男|おとこ] 。 あの [夜|よる] から 、 [二度|にど] と [話|はな]さなかった 。'),
    // the report: young Rosa outside the theater, a lantern in her hand
    'pa.rosa.where': L('Where’s {elio}? What happened? I was in the choir, and I couldn’t see…',
      '¿Dónde está Elio? ¿Qué pasó? Yo estaba en el coro y no vi bien…',
      'Cadê o Elio? O que aconteceu? Eu estava no coral e não vi direito…',
      'Wo ist Elio? Was ist passiert? Ich war im Chor und habe nichts gesehen …',
      '[艾利欧|Ài lì ōu] [在|zài] [哪里|nǎ lǐ] ？ [发生|fā shēng] [了|le] [什么|shén me] ？ [我|wǒ] [在|zài] [合唱团|hé chàng tuán] [里|lǐ] ， [没|méi] [看|kàn] [清楚|qīng chu] …',
      'エリオ くん は どこ ？ [何|なに] が あった の ？ わたし 、 [合唱|がっしょう] の [列|れつ] に いて 、 よく [見|み]えなかった …'),
    'pa.rosa.how': L('And him? How was he?', '¿Y él? ¿Cómo estaba?', 'E ele? Como ele estava?', 'Und er? Wie ging es ihm?',
      '[那|nà] [他|tā] [说完|shuō wán] [了|le] [吗|ma] ？', 'エリオ くん は 、 どう だった ？', { en_zh: 'And did he finish what he was saying?' }),
    'pa.rosa.promise': L('I didn’t laugh. Tomorrow I’ll look for him… and tell him his voice counts.',
      'Yo no me reí. Mañana lo busco… y le digo que su voz cuenta.',
      'Eu não ri. Amanhã eu procuro ele… e digo que a voz dele conta.',
      'Ich habe nicht gelacht. Morgen suche ich ihn … und sage ihm, dass seine Stimme zählt.',
      '[我|wǒ] [没|méi] [笑|xiào] 。 [明天|míng tiān] [我|wǒ] [去|qù] [找|zhǎo] [他|tā] … [告诉|gào su] [他|tā] ， [他|tā] [的|de] [声音|shēng yīn] [也|yě] [算数|suàn shù] 。',
      'わたし は [笑|わら]わなかった 。 [明日|あした] 、 [探|さが]して … エリオ くん の [声|こえ] も [大切|たいせつ] だ って [言|い]う 。'),
    'pa.noa.understand': L('We can’t change it… but now we understand it. That counts too.',
      'No podemos cambiarlo… pero ahora lo entendemos. Eso también cuenta.',
      'A gente não pode mudar… mas agora a gente entende. Isso também conta.',
      'Wir können es nicht ändern … aber jetzt verstehen wir es. Das zählt auch.',
      '[我们|wǒ men] [改变|gǎi biàn] [不|bù] [了|liǎo] … [可是|kě shì] [现在|xiàn zài] [我们|wǒ men] [明白|míng bai] [了|le] 。 [这|zhè] [也|yě] [算数|suàn shù] 。',
      '[変|か]えられない … でも 、 [今|いま] は わかる 。 それ も [大切|たいせつ] 。'),
    // the way on: the clock opens the Future's door (a demonstration: a first taste of the future)
    'pa.noa.future': L('Look! The {w.clock} opened another door: Tomorrow. What will happen… if nobody speaks.',
      '¡Mira! El {w.clock} abrió otra puerta: el Mañana. Lo que pasará… si nadie habla.',
      'Olha! O {w.clock} abriu outra porta: o Amanhã. O que vai acontecer… se ninguém falar.',
      'Schau! Die {w.clock} hat noch eine Tür geöffnet: das Morgen. Was passieren wird … wenn niemand spricht.',
      '[你|nǐ] [看|kàn] ！ {w.clock} [打开|dǎ kāi] [了|le] [另|lìng] [一|yī] [扇|shàn] [门|mén] ： [明天|míng tiān] 。 [如果|rú guǒ] [没有|méi yǒu] [人|rén] [说话|shuō huà] ， [会|huì] [发生|fā shēng] [什么|shén me] …',
      '[見|み]て ！ {w.clock} が もう [一|ひと]つ の [扉|とびら] を [開|あ]けた 。 [明日|あした] … だれ も [話|はな]さなかったら 、 どう なる か 。'),
    // the tear you came through (a way back to the present), and Noa when you wander to the edge of the memory
    'pa.noa.edge': L('Don’t go too far! The memory ends out there.', '¡No te alejes! El recuerdo termina ahí.', 'Não vai longe! A lembrança acaba ali.', 'Geh nicht zu weit! Die Erinnerung hört da auf.',
      '[别|bié] [走|zǒu] [太|tài] [远|yuǎn] ！ [回忆|huí yì] [到|dào] [那里|nà lǐ] [就|jiù] [结束|jié shù] [了|le] 。', '[遠|とお]く へ [行|い]かないで ！ [思|おも]い[出|で] は そこ で [終|お]わる の 。'),
  });
  Object.assign(MARKS, {
    'pa.elio.stage': { es: [['papa', 'potato — he meant «papá», dad']], pt: [['pão', 'bread — he meant «pai», dad']], de: [['Glucken', 'broody hens — he meant «Glocken», bells']],
      zh: [['[打架|dǎ jià]', 'fighting — he meant 大家 dàjiā, everyone']], ja: [['[新鮮|しんせん]', 'fresh — he meant 親切 しんせつ, kind']] },
    'pa.noa.retell': { es: [['estaba nervioso', 'was nervous'], ['se rieron', 'laughed'], ['se fue', 'left']], pt: [['estava nervoso', 'was nervous'], ['riu', 'laughed'], ['foi embora', 'left']],
      de: [['war nervös', 'was nervous'], ['gelacht', 'laughed'], ['weggelaufen', 'ran away']], zh: [['[紧张|jǐn zhāng]', 'nervous'], ['[笑|xiào] [了|le]', 'laughed'], ['[没|méi] [说完|shuō wán]', 'didn’t finish'], ['[跑|pǎo] [了|le]', 'ran off']],
      ja: [['[緊張|きんちょう] して いました', 'was nervous'], ['[笑|わら]いました', 'laughed'], ['[走|はし]って [行|い]きました', 'ran off']] },
    'pa.noa.future': { es: [['pasará', 'will happen']], pt: [['vai acontecer', 'will happen']], de: [['passieren wird', 'will happen']], zh: [['[会|huì] [发生|fā shēng]', 'will happen']], ja: [['どう なる', 'what will happen']] },
  });
  // the crowd's laughter (floating over the seats) and a few names shouted at the festival (no translation needed)
  const LAUGHS = { es: ['¡Ja, ja, ja!', '¡Jajaja!', '¡Ja, ja!'], pt: ['Ha, ha, ha!', 'Hahaha!', 'Ha, ha!'], de: ['Ha, ha, ha!', 'Hahaha!', 'Hi, hi!'],
    zh: ['[哈哈哈|hā hā hā] ！', '[哈哈|hā hā] ！', '[嘻嘻|xī xī] ！'], ja: ['あはは ！', 'はは ！', 'くすくす …'], en: ['Ha, ha, ha!', 'Hahaha!', 'Ha, ha!'] };
  const SHOUTS = { es: ['¡TOMI!', '¡Me llamo Luz!', '♪ Ra-món ♪'], pt: ['TOMI!', 'Eu sou a Luz!', '♪ Ra-mon ♪'], de: ['TOMI!', 'Ich bin Luzi!', '♪ Ra-mon ♪'],
    zh: ['[汤米|Tāng mǐ] ！', '[我|wǒ] [叫|jiào] [露西|Lù xī] ！', '♪ [拉蒙|Lā méng] ♪'], ja: ['トミー ！', 'ルス です ！', '♪ ラモン ♪'] };

  // small talk in the plaza (anyone of then: never about the player's gender; a little of the past in each)
  const CHAT = [
    L('What a lovely festival!', '¡Qué fiesta tan bonita!', 'Que festa bonita!', 'Was für ein schönes Fest!', '[多|duō] [热闹|rè nao] [的|de] [节日|jié rì] [啊|a] ！', 'いい お[祭|まつ]り です ね ！'),
    L('There’s a concert at the theater tonight, at eight.', 'Esta noche hay concierto en el teatro, a las ocho.', 'Hoje à noite tem concerto no teatro, às oito.', 'Heute Abend um acht gibt es ein Konzert im Theater.',
      '[今天|jīn tiān] [晚上|wǎn shang] [八|bā] [点|diǎn] ， [剧院|jù yuàn] [有|yǒu] [音乐会|yīn yuè huì] 。', '[今夜|こんや] [八時|はちじ] に 、 [劇場|げきじょう] で コンサート が あります よ 。'),
    L('Did you say your name yet? Every voice counts!', '¿Ya dijiste tu nombre? ¡Toda voz cuenta!', 'Você já disse o seu nome? Toda voz conta!', 'Hast du deinen Namen schon gesagt? Jede Stimme zählt!',
      '[你|nǐ] [说|shuō] [了|le] [你|nǐ] [的|de] [名字|míng zi] [吗|ma] ？ [每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù] ！', 'もう [名前|なまえ] を [言|い]いました か ？ どの [声|こえ] も [大切|たいせつ] ！'),
    L('Yesterday we polished every bell in the valley.', 'Ayer pulimos todas las campanas del valle.', 'Ontem a gente poliu todos os sinos do vale.', 'Gestern haben wir alle Glocken im Tal geputzt.',
      '[昨天|zuó tiān] [我们|wǒ men] [把|bǎ] [山谷|shān gǔ] [里|lǐ] [的|de] [钟|zhōng] [都|dōu] [擦|cā] [了|le] 。', '[昨日|きのう] 、 [谷|たに] の [鐘|かね] を ぜんぶ みがきました 。'),
    L('My grandma says that as a girl, she sang here every spring.', 'Mi abuela dice que de niña cantaba aquí cada primavera.', 'A minha avó diz que, quando era menina, cantava aqui toda primavera.', 'Meine Oma sagt, als Kind hat sie hier jeden Frühling gesungen.',
      '[我|wǒ] [奶奶|nǎi nai] [说|shuō] ， [她|tā] [小|xiǎo] [时候|shí hou] [每|měi] [年|nián] [春天|chūn tiān] [都|dōu] [在|zài] [这里|zhè lǐ] [唱歌|chàng gē] 。', 'おばあちゃん は [子|こ]ども の とき 、 [毎年|まいとし] [春|はる] に ここ で [歌|うた]って いた そう です 。'),
  ];

  // ------------------------------------------------------------ the fight's lines: [text, English]
  const T6 = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const FIGHT = {
    laugh: T6('Ha… ha… HA!', 'Ja… ja… ¡JA!', 'Ha… ha… HA!', 'Ha … ha … HA!', '[哈|hā] … [哈|hā] … [哈|hā] ！', 'は … は … はっ ！'),
    masks: T6('Hit the laughing masks: tell {mimo} as a memory!', '¡Golpea las máscaras! Díselo a {mimo} como un recuerdo.', 'Bate nas máscaras! Fala pro {mimo} como uma lembrança.',
      'Triff die Masken! Erzähl es {mimo} wie eine Erinnerung.', '[打|dǎ] [那些|nà xiē] [面具|miàn jù] ！ [像|xiàng] [讲|jiǎng] [回忆|huí yì] [一样|yī yàng] [告诉|gào su] {mimo} ！', '[仮面|かめん] を [打|う]って ！ {mimo} に [思|おも]い[出|で] みたい に [言|い]って ！'),
    now: T6('That’s how you say it now. Here it’s a memory!', 'Eso es ahora. ¡Aquí es un recuerdo!', 'Isso é agora. Aqui é uma lembrança!', 'Das ist jetzt. Hier ist es eine Erinnerung!',
      '[那|nà] [是|shì] [现在|xiàn zài] 。 [这里|zhè lǐ] [是|shì] [回忆|huí yì] ！', 'それ は [今|いま] の [言|い]い[方|かた] 。 ここ は [思|おも]い[出|で] ！'),
    child: T6('Don’t hit him! He’s only a child. Say how he was.', '¡No lo golpees! Es solo un niño. Di cómo estaba.', 'Não bate nele! É só uma criança. Diz como ele estava.',
      'Schlag ihn nicht! Er ist nur ein Kind. Sag, wie es ihm ging.', '[别|bié] [打|dǎ] [他|tā] ！ [他|tā] [只是|zhǐ shì] [个|gè] [孩子|hái zi] 。 [说说|shuō shuo] [他|tā] [那时|nà shí] [怎么样|zěn me yàng] 。',
      '[打|う]たないで ！ ただ の [子|こ]ども よ 。 どんな [気持|きも]ち だった か 、 [言|い]って 。'),
    nohit: T6('No! Not him…', '¡No! A él no…', 'Não! Nele não…', 'Nein! Nicht ihn …', '[不|bù] ！ [别|bié] [打|dǎ] [他|tā] …', 'だめ ！ [彼|かれ] は …'),
    yes: T6('Yes… He was scared. Now we understand.', 'Sí… Tenía miedo. Ya lo entendemos.', 'É… Ele tinha medo. Agora a gente entende.', 'Ja … Er hatte Angst. Jetzt verstehen wir es.',
      '[是|shì] [的|de] … [他|tā] [很|hěn] [害怕|hài pà] 。 [现在|xiàn zài] [我们|wǒ men] [明白|míng bai] [了|le] 。', 'うん … こわかった ん だ よね 。 [今|いま] は わかる 。'),
  };

  // ------------------------------------------------------------ Mimo's verbs, told as memories (the apples, and the fights)
  // per verb, the forms that tell it in the past («{mimo} saltó»): a string must appear as a word (zh / ja: CJK.contains), a
  // list must all appear (de: the Perfekt's two parts; zh: the verb and 了); de2: the Präteritum (still the past: an A, since
  // in speech it's the Perfekt). The first entry is the one shown.
  const PV = {
    'v.jump': { es: ['saltó', 'brincó'], pt: ['pulou', 'saltou'], de: [['ist', 'gesprungen'], ['ist', 'gehüpft']], de2: ['sprang', 'hüpfte'], zh: [['[跳|tiào]', '[了|le]'], ['[蹦|bèng]', '[了|le]']], ja: ['[跳|と]んだ', '[飛|と]んだ'] },
    'v.swim': { es: ['nadó'], pt: ['nadou'], de: [['ist', 'geschwommen']], de2: ['schwamm'], zh: [['[游|yóu]', '[了|le]']], ja: ['[泳|およ]いだ'] },
    'v.push': { es: ['empujó'], pt: ['empurrou'], de: [['hat', 'geschoben']], de2: ['schob'], zh: [['[推|tuī]', '[了|le]']], ja: ['[押|お]した'] },
    'v.hit': { es: ['golpeó', 'pegó'], pt: ['bateu', 'socou'], de: [['hat', 'geschlagen'], ['hat', 'gehauen']], de2: ['schlug', 'haute'], zh: [['[打|dǎ]', '[了|le]']], ja: ['[打|う]った', '[叩|たた]いた'] },
    'v.throw': { es: ['lanzó', 'tiró'], pt: ['jogou'], de: [['hat', 'geworfen']], de2: ['warf'], zh: [['[扔|rēng]', '[了|le]']], ja: ['[投|な]げた'] },
    'v.eat': { es: ['comió'], pt: ['comeu'], de: [['hat', 'gegessen']], de2: ['aß'], zh: [['[吃|chī]', '[了|le]']], ja: ['[食|た]べた'] },
    'v.sing': { es: ['cantó'], pt: ['cantou'], de: [['hat', 'gesungen']], de2: ['sang'], zh: [['[唱|chàng]', '[了|le]']], ja: ['[歌|うた]った'] },
    'v.climb': { es: ['trepó', 'subió'], pt: ['subiu'], de: [['ist', 'geklettert']], de2: ['kletterte'], zh: [['[爬|pá]', '[了|le]']], ja: ['[登|のぼ]った'] },
    'v.blow': { es: ['sopló'], pt: ['soprou'], de: [['hat', 'gepustet']], de2: ['pustete'], zh: [['[吹|chuī]', '[了|le]']], ja: ['[吹|ふ]いた'] },
    'v.call': { es: ['llamó'], pt: ['chamou'], de: [['hat', 'gerufen']], de2: ['rief'], zh: [['[叫|jiào]', '[了|le]']], ja: ['[呼|よ]んだ'] },
    'v.dig': { es: ['cavó', 'excavó'], pt: ['cavou'], de: [['hat', 'gegraben']], de2: ['grub'], zh: [['[挖|wā]', '[了|le]']], ja: ['[掘|ほ]った'] },
    'v.light': { es: ['iluminó'], pt: ['iluminou'], de: [['hat', 'angeleuchtet'], ['hat', 'geleuchtet']], de2: ['leuchtete'], zh: [['[照亮|zhào liàng]', '[了|le]']], ja: ['[照|て]らした'] },
  };
  // the form to show for a verb in the past («saltó», «ist gesprungen», «跳了», «跳んだ»)
  const pvShow = (id, l) => { const v = PV[id] && PV[id][l] && PV[id][l][0]; return !v ? '' : Array.isArray(v) ? v.join(' ') : v; };

  // ------------------------------------------------------------ the tasks: what you say, graded S–C
  // frame (the box's placeholder, ___ for the blank), chips ([word, English] for the blank), model (the whole sentence, on
  // «?» / "I don't know"), want (the forms the task is about: one must appear), alt (still right, a little off: A), other
  // (the other past: B, with the tip), pres (now, not then: say it again, with the tip), more (the rest of a whole sentence:
  // one of them for an S). Items: a string (a word or a phrase) or a list (all of them). zh / ja: the notation.
  const TASKS = {
    bell: { title: '{shy} missed the {w.bell}. It already happened: tell {shy} who rang it.',
      frame: { es: 'Nacho ___ la campana.', pt: 'O Zeca ___ o sino.', de: 'Karl hat die Glocke ___.', zh: '[小|Xiǎo] [石头|Shí tou] ___ [钟|zhōng] 。', ja: 'ふみた くん が [鐘|かね] を ___ 。' },
      chips: { es: [['tocó', 'rang']], pt: [['tocou', 'rang']], de: [['geläutet', 'rung']], zh: [['[敲|qiāo] [了|le]', 'rang']], ja: [['[鳴|な]らしました', 'rang']] },
      model: L('{helper} rang the bell.', 'Nacho tocó la campana.', 'O Zeca tocou o sino.', 'Karl hat die Glocke geläutet.', '[小|Xiǎo] [石头|Shí tou] [敲|qiāo] [了|le] [钟|zhōng] 。', 'ふみた くん が [鐘|かね] を [鳴|な]らしました 。'),
      want: { es: ['tocó'], pt: ['tocou'], de: [['hat', 'geläutet']], zh: [['[敲|qiāo]', '[了|le]']], ja: ['[鳴|な]らしました', '[鳴|な]らした'] },
      alt: { de: ['läutete'] }, other: { es: ['tocaba'], pt: ['tocava'] },
      pres: { es: ['toca'], pt: ['toca'], de: ['läutet'], zh: ['[敲|qiāo]'], ja: ['[鳴|な]らします', '[鳴|な]らす'] },
      more: { es: ['nacho', 'campana'], pt: ['zeca', 'sino'], de: ['karl', 'glocke'], zh: ['[小|Xiǎo] [石头|Shí tou]', '[钟|zhōng]'], ja: ['ふみた', '[鐘|かね]'] } },
    names1: { title: 'Help Noa remember. What did {shy} do?',
      frame: { es: 'Adelita ___ su nombre.', pt: 'O Benedito ___ o nome dele.', de: 'Lieschen hat ihren Namen ___.', zh: '[小|Xiǎo] [兰|Lán] ___ [她|tā] [的|de] [名字|míng zi] 。', ja: 'ハナ ちゃん は [名前|なまえ] を ___ 。' },
      chips: { es: [['dijo', 'said']], pt: [['disse', 'said']], de: [['gesagt', 'said']], zh: [['[说|shuō] [了|le]', 'said']], ja: [['[言|い]いました', 'said']] },
      model: L('{shy} said her name.', 'Adelita dijo su nombre.', 'O Benedito disse o nome dele.', 'Lieschen hat ihren Namen gesagt.', '[小|Xiǎo] [兰|Lán] [说|shuō] [了|le] [她|tā] [的|de] [名字|míng zi] 。', 'ハナ ちゃん は [名前|なまえ] を [言|い]いました 。', { en_pt: '{shy} said his name.' }),
      want: { es: ['dijo'], pt: ['disse'], de: [['hat', 'gesagt']], zh: [['[说|shuō]', '[了|le]']], ja: ['[言|い]いました', '[言|い]った'] },
      alt: { de: ['sagte'] }, other: { es: ['decía'], pt: ['dizia'] },
      pres: { es: ['dice'], pt: ['diz'], de: ['sagt'], zh: ['[说|shuō]'], ja: ['[言|い]います', '[言|い]う'] },
      more: { es: ['nombre', 'adelita'], pt: ['nome', 'benedito'], de: ['namen', 'name', 'lieschen'], zh: ['[名字|míng zi]'], ja: ['[名前|なまえ]'] } },
    names2: { title: 'And {ringer}? What did he do for {shy}?',
      frame: { es: 'Don Celestino ___ la campana para ella.', pt: 'O seu Belarmino ___ o sino três vezes.', de: 'Wendelin hat die Glocke für sie ___.', zh: '[钟|Zhōng] [爷爷|yé ye] [为|wèi] [她|tā] ___ [钟|zhōng] 。', ja: 'ゲンじい は [鐘|かね] を ___ 。' },
      chips: { es: [['tocó', 'rang']], pt: [['tocou', 'rang']], de: [['geläutet', 'rung']], zh: [['[敲|qiāo] [了|le]', 'rang']], ja: [['[鳴|な]らしました', 'rang']] },
      model: L('{ringer} rang the bell for her.', 'Don Celestino tocó la campana para ella.', 'O seu Belarmino tocou o sino três vezes.', 'Wendelin hat die Glocke für sie geläutet.', '[钟|Zhōng] [爷爷|yé ye] [为|wèi] [她|tā] [敲|qiāo] [了|le] [钟|zhōng] 。', 'ゲンじい は [鐘|かね] を [鳴|な]らしました 。',
        { en_pt: '{ringer} rang the bell three times.' }),
      want: { es: ['tocó'], pt: ['tocou'], de: [['hat', 'geläutet']], zh: [['[敲|qiāo]', '[了|le]']], ja: ['[鳴|な]らしました', '[鳴|な]らした'] },
      alt: { de: ['läutete'] }, other: { es: ['tocaba'], pt: ['tocava'] },
      pres: { es: ['toca'], pt: ['toca'], de: ['läutet'], zh: ['[敲|qiāo]'], ja: ['[鳴|な]らします', '[鳴|な]らす'] },
      more: { es: ['campana'], pt: ['sino'], de: ['glocke'], zh: ['[钟|zhōng]'], ja: ['[鐘|かね]'] } },
    elio: { title: '{elio} asks what it was like when you arrived. How was it, back then?',
      frame: { es: 'Cuando llegué, ___.', pt: 'Quando eu cheguei, ___.', de: 'Als ich angekommen bin, ___.', zh: '[我|wǒ] [刚|gāng] [来|lái] [的|de] [时候|shí hou] ， ___ 。', ja: '[来|き]た とき 、 ___ 。' },
      chips: { es: [['tenía miedo', 'I was scared'], ['no conocía a nadie', 'I didn’t know anyone'], ['no hablaba bien', 'I didn’t speak well']],
        pt: [['eu tinha medo', 'I was scared'], ['eu não conhecia ninguém', 'I didn’t know anyone'], ['eu não falava bem', 'I didn’t speak well']],
        de: [['hatte ich Angst', 'I was scared'], ['kannte ich niemanden', 'I didn’t know anyone'], ['war ich allein', 'I was alone']],
        zh: [['[很|hěn] [害怕|hài pà]', 'I was scared'], ['[谁|shéi] [都|dōu] [不|bù] [认识|rèn shi]', 'I didn’t know anyone'], ['[不会|bù huì] [说|shuō]', 'I couldn’t speak']],
        ja: [['こわかった', 'I was scared'], ['だれ も [知|し]らなかった', 'I didn’t know anyone'], ['さびしかった', 'I was lonely']] },
      model: L('When I arrived, I was scared.', 'Cuando llegué, tenía miedo.', 'Quando eu cheguei, eu tinha medo.', 'Als ich angekommen bin, hatte ich Angst.', '[我|wǒ] [刚|gāng] [来|lái] [的|de] [时候|shí hou] ， [很|hěn] [害怕|hài pà] 。', '[来|き]た とき 、 こわかった です 。'),
      want: { es: ['tenía', 'conocía', 'hablaba', 'estaba', 'era'], pt: ['tinha', 'conhecia', 'falava', 'estava', 'era'], de: ['hatte', 'kannte', 'war', 'sprach'],
        zh: [['[害怕|hài pà]'], ['[认识|rèn shi]'], ['[不会|bù huì]'], ['[孤单|gū dān]']], ja: ['こわかった', '[怖|こわ]かった', '[知|し]らなかった', 'さびしかった', '[寂|さび]しかった', '[話|はな]せなかった'] },
      alt: { de: [['habe', 'gehabt'], ['bin', 'gewesen'], ['habe', 'gekannt']] }, other: { es: ['tuve', 'conocí', 'hablé', 'estuve', 'fui'], pt: ['tive', 'conheci', 'falei', 'estive', 'fui'] },
      pres: { es: ['tengo', 'conozco', 'hablo', 'estoy', 'soy'], pt: ['tenho', 'conheço', 'falo', 'estou', 'sou'], de: ['habe', 'kenne', 'bin', 'spreche'], zh: ['[现在|xiàn zài]'], ja: ['こわい', '[怖|こわ]い', '[知|し]らない', 'さびしい', '[寂|さび]しい'] },
      more: { es: ['miedo', 'nadie', 'bien', 'nervioso', 'nerviosa', 'solo', 'sola'], pt: ['medo', 'ninguem', 'bem', 'sozinho', 'sozinha', 'nervoso', 'nervosa'], de: ['angst', 'niemanden', 'allein', 'nervös', 'einsam'],
        zh: ['[时候|shí hou]', '[以前|yǐ qián]'], ja: ['とき', '[時|とき]', 'さいしょ'] } },
    guo: { only: ['zh'], title: '{elio} had never heard a {w.bell} before. Have you? (过: you have, at some time)',
      frame: { zh: '[我|wǒ] ___ 。' }, chips: { zh: [['[听|tīng] [过|guo]', 'have heard'], ['[没|méi] [听|tīng] [过|guo]', 'have never heard']] },
      model: L('I’ve heard one.', '', '', '', '[我|wǒ] [听|tīng] [过|guo] 。', ''),
      want: { zh: [['[听|tīng]', '[过|guo]']] }, pres: { zh: ['[听|tīng]'] }, more: { zh: ['[我|wǒ]', '[钟声|zhōng shēng]'] } },
    scene1: { title: 'How was the plaza? Tell Noa, the way she told the fountain.',
      frame: { es: 'La plaza estaba ___.', pt: 'A praça estava ___.', de: 'Der Platz war ___.', zh: '[以前|yǐ qián] ， [广场|guǎng chǎng] [上|shàng] ___ 。', ja: '[広場|ひろば] は ___ でした 。' },
      chips: { es: [['llena de gente', 'full of people'], ['muy alegre', 'very cheerful']], pt: [['cheia de gente', 'full of people'], ['muito alegre', 'very cheerful']], de: [['voller Leute', 'full of people'], ['sehr fröhlich', 'very cheerful']],
        zh: [['[有|yǒu] [很多|hěn duō] [人|rén]', 'there were lots of people'], ['[很|hěn] [热闹|rè nao]', 'it was lively']], ja: [['[人|ひと] で いっぱい', 'full of people'], ['にぎやか', 'lively']] },
      model: L('The plaza was full of people.', 'La plaza estaba llena de gente.', 'A praça estava cheia de gente.', 'Der Platz war voller Leute.', '[以前|yǐ qián] ， [广场|guǎng chǎng] [上|shàng] [有|yǒu] [很多|hěn duō] [人|rén] 。', '[広場|ひろば] は [人|ひと] で いっぱい でした 。'),
      want: { es: ['estaba'], pt: ['estava'], de: ['war'], zh: [['[以前|yǐ qián]']], ja: ['でした'] },
      alt: { de: [['ist', 'gewesen']] }, other: { es: ['estuvo'], pt: ['esteve', 'ficou'] },
      pres: { es: ['está'], pt: ['está'], de: ['ist'], zh: ['[现在|xiàn zài]'], ja: ['です'] },
      more: { es: ['llena', 'gente', 'alegre', 'bonita'], pt: ['cheia', 'gente', 'alegre', 'bonita'], de: ['voller', 'leute', 'fröhlich', 'menschen'], zh: ['[人|rén]', '[热闹|rè nao]'], ja: ['[人|ひと]', 'いっぱい', 'にぎやか'] } },
    scene2: { title: 'And the {w.bell}, up in its tower? Tell Noa how it was.',
      frame: { es: 'La campana ___.', pt: 'O sino ___.', de: 'Die Glocke ___.', zh: '[以前|yǐ qián] ， [钟|zhōng] ___ 。', ja: '[鐘|かね] が ___ 。' },
      chips: { es: [['brillaba', 'was shining']], pt: [['brilhava', 'was shining']], de: [['leuchtete', 'shone']], zh: [['[很|hěn] [亮|liàng]', 'was bright']], ja: [['[光|ひか]って いました', 'was shining']] },
      model: L('The bell was shining.', 'La campana brillaba.', 'O sino brilhava.', 'Die Glocke leuchtete.', '[以前|yǐ qián] ， [钟|zhōng] [很|hěn] [亮|liàng] 。', '[鐘|かね] が [光|ひか]って いました 。'),
      want: { es: ['brillaba'], pt: ['brilhava'], de: ['leuchtete', 'glänzte'], zh: [['[以前|yǐ qián]', '[亮|liàng]']], ja: [['[光|ひか]って', 'いました'], ['[光|ひか]って いました']] },
      alt: { de: [['hat', 'geleuchtet'], ['hat', 'geglänzt']] }, other: { es: ['brilló'], pt: ['brilhou'] },
      pres: { es: ['brilla'], pt: ['brilha'], de: ['leuchtet', 'glänzt'], zh: ['[亮|liàng]'], ja: ['います', '[光|ひか]る'] },
      more: { es: ['campana'], pt: ['sino'], de: ['glocke'], zh: ['[钟|zhōng]'], ja: ['[鐘|かね]'] } },
    scene3: { title: 'And the people? Tell Noa what they were doing.',
      frame: { es: 'La gente ___ y ___.', pt: 'As pessoas ___ e ___.', de: 'Die Leute ___ und ___.', zh: '[以前|yǐ qián] ， [大家|dà jiā] ___ 。', ja: 'みんな が ___ 。' },
      chips: { es: [['cantaba', 'was singing'], ['bailaba', 'was dancing']], pt: [['cantavam', 'were singing'], ['dançavam', 'were dancing']], de: [['sangen', 'sang'], ['tanzten', 'danced']],
        zh: [['[唱歌|chàng gē]', 'sang'], ['[跳舞|tiào wǔ]', 'danced']], ja: [['[歌|うた]って いました', 'were singing'], ['[踊|おど]って いました', 'were dancing']] },
      model: L('The people were singing and dancing.', 'La gente cantaba y bailaba.', 'As pessoas cantavam e dançavam.', 'Die Leute sangen und tanzten.', '[以前|yǐ qián] ， [大家|dà jiā] [唱歌|chàng gē] [跳舞|tiào wǔ] 。', 'みんな が [歌|うた]って いました 。'),
      want: { es: ['cantaba', 'bailaba', 'cantaban', 'bailaban'], pt: ['cantavam', 'dançavam', 'cantava', 'dançava'], de: ['sangen', 'tanzten', 'sang', 'tanzte'],
        zh: [['[以前|yǐ qián]', '[唱歌|chàng gē]'], ['[以前|yǐ qián]', '[跳舞|tiào wǔ]']], ja: [['[歌|うた]って', 'いました'], ['[踊|おど]って', 'いました'], ['[笑|わら]って', 'いました']] },
      alt: { de: [['haben', 'gesungen'], ['haben', 'getanzt']] }, other: { es: ['cantó', 'bailó', 'cantaron', 'bailaron'], pt: ['cantaram', 'dançaram'] },
      pres: { es: ['canta', 'baila', 'cantan', 'bailan'], pt: ['cantam', 'dançam', 'canta', 'dança'], de: ['singen', 'tanzen', 'singt', 'tanzt'], zh: ['[唱歌|chàng gē]', '[跳舞|tiào wǔ]'], ja: ['います'] },
      more: { es: ['gente', 'todos'], pt: ['pessoas', 'gente', 'todos'], de: ['leute', 'alle', 'menschen'], zh: ['[大家|dà jiā]', '[人|rén]'], ja: ['みんな'] } },
    report1: { title: '{rosita} missed it. What happened? Tell her.',
      frame: { es: 'Todos se ___. Elio se ___.', pt: 'Todo mundo ___. O Elio foi ___.', de: 'Alle haben ___. Elio ist ___.', zh: '[大家|dà jiā] ___ ， [艾利欧|Ài lì ōu] ___ 。', ja: 'みんな が ___ 。' },
      chips: { es: [['rieron', 'laughed'], ['fue', 'left']], pt: [['riu', 'laughed'], ['embora', 'away']], de: [['gelacht', 'laughed'], ['weggelaufen', 'ran away']],
        zh: [['[笑|xiào] [了|le]', 'laughed'], ['[跑|pǎo] [了|le]', 'ran off']], ja: [['[笑|わら]いました', 'laughed']] },
      model: L('Everybody laughed, and {elio} left.', 'Todos se rieron y Elio se fue.', 'Todo mundo riu e o Elio foi embora.', 'Alle haben gelacht, und Elio ist weggelaufen.',
        '[大家|dà jiā] [都|dōu] [笑|xiào] [了|le] ， [艾利欧|Ài lì ōu] [跑|pǎo] [了|le] 。', 'みんな が [笑|わら]いました 。 エリオ くん は [走|はし]って [行|い]きました 。'),
      want: { es: ['rieron', 'rió', 'fue', 'corrió', 'dijo'], pt: ['riu', 'riram', 'foi', 'correu', 'disse'], de: [['haben', 'gelacht'], ['ist', 'weggelaufen'], ['ist', 'gegangen'], ['hat', 'gesagt']],
        zh: [['[笑|xiào]', '[了|le]'], ['[跑|pǎo]', '[了|le]']], ja: ['[笑|わら]いました', '[笑|わら]った', '[行|い]きました', '[行|い]った'] },
      alt: { de: ['lachten', 'lief', 'rannte'] }, other: { es: ['reían', 'corría'], pt: ['riam', 'ria', 'corria'] },
      pres: { es: ['ríen', 'ríe', 'va', 'corre', 'dice'], pt: ['riem', 'ri', 'vai', 'corre', 'diz'], de: ['lachen', 'lacht', 'läuft', 'geht'], zh: ['[笑|xiào]', '[跑|pǎo]'], ja: ['[笑|わら]います', '[笑|わら]う', '[行|い]きます'] },
      more: { es: ['todos', 'elio'], pt: ['todo', 'elio'], de: ['alle', 'elio'], zh: ['[大家|dà jiā]', '[艾利欧|Ài lì ōu]'], ja: ['みんな', 'エリオ'] } },
    report2: { title: '{rosita} asks how {elio} was. Tell her how it was for him.',
      frame: { es: 'Elio estaba ___.', pt: 'O Elio estava ___.', de: 'Elio war ___.', zh: '[他|tā] ___ 。', ja: 'エリオ くん は ___ 。' },
      chips: { es: [['muy triste', 'very sad'], ['nervioso', 'nervous'], ['solo', 'alone']], pt: [['muito triste', 'very sad'], ['nervoso', 'nervous'], ['sozinho', 'alone']],
        de: [['sehr traurig', 'very sad'], ['nervös', 'nervous'], ['allein', 'alone']], zh: [['[没|méi] [说完|shuō wán]', 'didn’t finish speaking']], ja: [['かなしかった', 'was sad'], ['こわかった', 'was scared']] },
      model: L('{elio} was very sad.', 'Elio estaba muy triste.', 'O Elio estava muito triste.', 'Elio war sehr traurig.', '[他|tā] [没|méi] [说完|shuō wán] 。', 'エリオ くん は とても かなしかった です 。', { en_zh: 'He didn’t finish.' }),
      want: { es: ['estaba', 'tenía'], pt: ['estava', 'tinha'], de: ['war', 'hatte'], zh: [['[没|méi]', '[说完|shuō wán]'], ['[没|méi]', '[说|shuō]']], ja: ['かなしかった', '[悲|かな]しかった', 'こわかった', '[怖|こわ]かった', 'さびしかった', '[寂|さび]しかった'] },
      alt: { de: [['ist', 'gewesen']] }, other: { es: ['estuvo', 'tuvo'], pt: ['esteve', 'teve', 'ficou'] },
      pres: { es: ['está', 'tiene'], pt: ['está', 'tem'], de: ['ist', 'hat'], zh: [['[不|bù]', '[说|shuō]']], ja: ['かなしい', '[悲|かな]しい', 'こわい', '[怖|こわ]い'] },
      more: { es: ['triste', 'solo', 'nervioso', 'miedo'], pt: ['triste', 'sozinho', 'nervoso', 'medo'], de: ['traurig', 'allein', 'nervös', 'angst'], zh: ['[他|tā]', '[艾利欧|Ài lì ōu]'], ja: ['エリオ', 'とても'] },
      tips: { zh: 'For something that didn’t happen, Chinese uses 没, not 不: «他没说完».' } },
    // the fight's last turn: not a hit, a memory understood (past_scenes.js)
    boss: { title: 'Don’t hit him. Say how {elio} was, back then.',
      frame: { es: 'Elio ___.', pt: 'O Elio ___.', de: 'Elio ___.', zh: '[艾利欧|Ài lì ōu] ___ 。', ja: 'エリオ くん は ___ 。' },
      chips: { es: [['tenía miedo', 'was scared'], ['estaba solo', 'was alone']], pt: [['tinha medo', 'was scared'], ['estava sozinho', 'was alone']], de: [['hatte Angst', 'was scared'], ['war allein', 'was alone']],
        zh: [['[很|hěn] [害怕|hài pà]', 'was scared'], ['[很|hěn] [孤单|gū dān]', 'was lonely']], ja: [['こわかった', 'was scared'], ['さびしかった', 'was lonely']] },
      model: L('{elio} was scared.', 'Elio tenía miedo.', 'O Elio tinha medo.', 'Elio hatte Angst.', '[艾利欧|Ài lì ōu] [很|hěn] [害怕|hài pà] 。', 'エリオ くん は こわかった 。'),
      want: { es: ['tenía', 'estaba'], pt: ['tinha', 'estava'], de: ['hatte', 'war'], zh: [['[害怕|hài pà]'], ['[孤单|gū dān]'], ['[难过|nán guò]'], ['[紧张|jǐn zhāng]']], ja: ['こわかった', '[怖|こわ]かった', 'さびしかった', '[寂|さび]しかった', 'かなしかった', '[悲|かな]しかった'] },
      alt: { de: [['hat', 'gehabt'], ['ist', 'gewesen']] }, other: { es: ['tuvo', 'estuvo'], pt: ['teve', 'esteve', 'ficou'] },
      pres: { es: ['tiene', 'está'], pt: ['tem', 'está'], de: ['hat', 'ist'], zh: ['[现在|xiàn zài]'], ja: ['こわい', '[怖|こわ]い', 'さびしい', '[寂|さび]しい'] },
      more: { es: ['miedo', 'solo', 'triste', 'nervioso'], pt: ['medo', 'sozinho', 'triste', 'nervoso'], de: ['angst', 'allein', 'traurig', 'nervös'], zh: ['[很|hěn]'], ja: ['エリオ'] } },
  };
  // the tips when a sentence is in the wrong time (English, with the right form from the task's model)
  const TIP = {
    pres: { es: 'That’s now. It already happened: tell it as a memory, «{form}».', pt: 'That’s now. It already happened: tell it as a memory, «{form}».', de: 'That’s now. It already happened: «{form}».',
      zh: 'It already happened: «{form}» (了 after the verb: it’s done; 以前…: back then).', ja: 'That’s now. It already happened: the past (た, ～ました, ～ていました), «{form}».' },
    other: { es: 'That’s the other past. Here: «{form}».', pt: 'That’s the other past. Here: «{form}».', de: 'Here: «{form}».', zh: '«{form}»', ja: '«{form}»' },
    alt: { de: 'Right! In speech Germans would say «{form}».' },
  };

  // ------------------------------------------------------------ the pattern cards (a grammar point as a move you unlock: DESIGN.md 7.9)
  const CARDS = {
    told: { tag: 'The past: what happened', es: { ex: [['toqué', 'I rang'], ['tocó', 'he / she rang'], ['subí', 'I climbed'], ['subió', 'he / she climbed']], note: 'Something that happened once: the preterite. With -ar verbs, -é for «I», -ó for «he» or «she».' },
      pt: { ex: [['toquei', 'I rang'], ['tocou', 'he / she rang'], ['subi', 'I climbed'], ['subiu', 'he / she climbed']], note: 'Something that happened once: the pretérito. With -ar verbs, -ei for «I», -ou for «he» or «she».' },
      de: { ex: [['ich habe … geläutet', 'I rang'], ['er hat … geläutet', 'he rang'], ['ich bin … hochgestiegen', 'I climbed up']], note: 'In speech, German tells what happened with the Perfekt: «haben» (or «sein» for moving somewhere) and the past participle at the end.' },
      zh: { ex: [['[敲|qiāo] [了|le]', 'rang'], ['[爬|pá] [了|le]', 'climbed']], note: 'Chinese verbs don’t change. 了 after the verb says it happened: it’s done.' },
      ja: { ex: [['[鳴|な]らした', 'rang'], ['[登|のぼ]った', 'climbed'], ['[鳴|な]らしました', 'rang (polite)']], note: 'The た-form says it happened. Polite: ～ました.' } },
    memory: { tag: '{mimo} in the Past', es: { note: 'Here {mimo} only moves in memories. Tell it what it did: «{mimo} saltó». Its verbs end in -a: change the -a to -ó.' },
      pt: { note: 'Here {mimo} only moves in memories. Tell it what it did: «O {mimo} pulou». Its verbs end in -a: change the -a to -ou.' },
      de: { note: 'Here {mimo} only moves in memories. Tell it what it did, in the Perfekt: «{mimo} ist gesprungen», «{mimo} hat geschoben».' },
      zh: { note: 'Here {mimo} only moves in memories. Tell it what it did, with 了: «米莫跳了».' },
      ja: { note: 'Here {mimo} only moves in memories. Tell it what it did: change the command’s て into た. 跳んで → 跳んだ.' } },
    was: { tag: 'How it was', es: { ex: [['tenía miedo', 'I / he was scared'], ['no conocía', 'I didn’t know'], ['estaba', 'was'], ['cantaba', 'was singing']], note: 'For how things were (feelings, a scene, something going on for a while): the imperfect, -aba or -ía. What happened once is the preterite: «llegué», «tocó».' },
      pt: { ex: [['tinha medo', 'I / he was scared'], ['não conhecia', 'I didn’t know'], ['estava', 'was'], ['cantava', 'was singing']], note: 'For how things were (feelings, a scene, something going on for a while): the imperfeito, -ava or -ia. What happened once is the pretérito: «cheguei», «tocou».' },
      de: { ex: [['hatte Angst', 'was scared'], ['kannte', 'knew'], ['war', 'was'], ['sang', 'sang']], note: 'For how things were, German says «war», «hatte», «kannte», even in speech. A memory told like a story (Noa’s notebook) uses this Präteritum for every verb: «sang», «tanzten», «leuchtete».' },
      zh: { ex: [['[刚|gāng] [来|lái] [的|de] [时候|shí hou]', 'when I’d just come'], ['[以前|yǐ qián]', 'back then'], ['[没|méi] [听|tīng] [过|guo]', 'had never heard'], ['[没|méi] [说完|shuō wán]', 'didn’t finish']], note: '以前 (back then) or …的时候 (when…) set the time, and the verbs stay the same. 过: you’ve done it at some time. 没: it didn’t happen.' },
      ja: { ex: [['こわかった', 'was scared (こわい → こわかった)'], ['[知|し]らなかった', 'didn’t know (ない → なかった)'], ['[歌|うた]って いました', 'was singing']], note: 'Feelings in the past: い → かった. A scene, something going on: ～て いました.' } },
  };

  // ------------------------------------------------------------ every zh / ja string against CJK.md's rules: [] when all's well
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return ['no CJK'];
    const out = [], v = (s, l, where) => { if (!s || typeof s !== 'string') return; const p = CJK.validate(s.replace(/\{[^}]+\}/g, l === 'zh' ? '[它|tā]' : 'それ').replace(/___/g, l === 'zh' ? '[它|tā]' : 'それ'), l); if (p.length) out.push(`${where} (${l}): ${p.join('; ')} «${s}»`); };
    const each = (T, where) => { for (const l of ['zh', 'ja']) if (T && T[l]) [].concat(T[l]).forEach(x => (Array.isArray(x) ? x.forEach(y => v(y, l, where)) : v(x, l, where))); };
    for (const [k, T] of Object.entries(LN)) each(T, k);
    for (const [k, T] of Object.entries(CAST)) each(T, 'cast ' + k);
    for (const [k, T] of Object.entries(NAMES)) each(T, 'name ' + k);
    for (const [k, T] of Object.entries(FIGHT)) each(T, 'fight ' + k);
    for (const [k, M] of Object.entries(MARKS)) for (const l of ['zh', 'ja']) (M[l] || []).forEach(m => v(m[0], l, 'mark ' + k));
    for (const [k, P] of Object.entries(PV)) each(P, 'verb ' + k);
    for (const [k, T] of Object.entries(TASKS)) { for (const f of ['frame', 'model', 'want', 'alt', 'other', 'pres', 'more']) each(T[f], `task ${k} ${f}`); for (const l of ['zh', 'ja']) ((T.chips || {})[l] || []).forEach(c => v(c[0], l, `task ${k} chip`)); }
    for (const [k, C] of Object.entries(CARDS)) for (const l of ['zh', 'ja']) ((C[l] && C[l].ex) || []).forEach(e => v(e[0], l, 'card ' + k));
    for (const l of ['zh', 'ja']) { LAUGHS[l].forEach(s => v(s, l, 'laugh')); SHOUTS[l].forEach(s => v(s, l, 'shout')); }
    CHAT.forEach((T, i) => each(T, 'chat ' + i));
    return out;
  }

  return { L, LANGS, CAST, WHO_EN, NAMES, LINES: LN, MARKS, PV, pvShow, TASKS, TIP, CARDS, FIGHT, LAUGHS, SHOUTS, CHAT, fill, pick, en, isC, check };
})();
