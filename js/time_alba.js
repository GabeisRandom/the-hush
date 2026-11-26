'use strict';
// Alba in three worlds (DESIGN.md 18.3; game/TIME.md's worked example): the region, its three time cracks, and its two
// cross-time puzzles. Alba's Past is past.js (Chapter 2's Alba of long ago; after the chapter, an ordinary day of then) and its
// Future is future.js (Chapter 3's gray Alba); both stay rooms of their own, and TIME follows them.
//   The cracks (open after Chapter 3, flags.futureDone): the yard's (today ↔ the Past, where the Past's little tear was, in
//   Bruno's yard), the main street's (today ↔ the Future), the duck pond's (all three: you pick where).
//   «The seed» (the Past changes today and tomorrow): the bell ringer's helper wants a tree by the yard, for shade, but the ground
//   is too hard. In the Past Mimo only moves in memories: «Mimo cavó un hoyo», «Mimo plantó la semilla». Today a big tree stands
//   there with «N + Mimo» carved in it, and Bruno knows who planted it; tomorrow it's still there, older.
//   «The promise» (the Future changes today): tomorrow, Marta is putting on the Festival of Voices again, and asks what you'll do
//   at it: «Cantaré en la fiesta». Tomorrow's torn banner mends; today a new banner goes up over the plaza, and Marta tells why.
// Words: ATXT (es, pt, de; zh and ja in CJK.md's notation; en). Flags: TIME.flag('past', 'seedAsked' | 'seedDug' | 'seedPlanted'),
// ('future', 'festAsked' | 'promised'), ('now', 'treeTold' | 'bannerTold'); grades seedDig, seedPlant, promise; TIME.seen('alba.cracks').
const ATXT = (() => {
  const L = (en, es, pt, de, zh, ja, o) => Object.assign({ en, es, pt, de, zh, ja }, o || {});
  // ------------------------------------------------------------ the seed (the Past): the helper, the old bell ringer
  const LINES = {
    'seed.ask': L('Look! {ringer} gave me a seed. I want to plant a tree here, by the yard, so there’s shade.',
      '¡Mira! Don Celestino me dio una semilla. Quiero plantar un árbol aquí, junto al patio, para tener sombra.',
      'Olha! O seu Belarmino me deu uma semente. Eu quero plantar uma árvore aqui, do lado do quintal, pra ter sombra.',
      'Schau mal! Wendelin hat mir einen Samen gegeben. Ich will hier am Hof einen Baum pflanzen, für Schatten.',
      '[你|nǐ] [看|kàn] ！ [钟|Zhōng] [爷爷|yé ye] [给|gěi] [了|le] [我|wǒ] [一|yī] [颗|kē] [种子|zhǒng zi] 。 [我|wǒ] [想|xiǎng] [在|zài] [院子|yuàn zi] [旁边|páng biān] [种|zhòng] [一|yī] [棵|kē] [树|shù] ， [这样|zhè yàng] [就|jiù] [有|yǒu] [树荫|shù yīn] [了|le] 。',
      '[見|み]て ！ ゲンじい が たね を くれた ん だ 。 ここ に [木|き] を [植|う]えたい ん だ 。 [日陰|ひかげ] が できる よう に 。'),
    'seed.demo': L('When I was a boy, my grandfather dug a hole and planted a seed. That’s how it’s done.',
      'Cuando yo era niño, mi abuelo cavó un hoyo y plantó una semilla. Así se hace.',
      'Quando eu era menino, o meu avô cavou um buraco e plantou uma semente. É assim que se faz.',
      'Als ich ein Junge war, hat mein Großvater ein Loch gegraben und einen Samen gepflanzt. So macht man das.',
      '[我|wǒ] [小|xiǎo] [时候|shí hou] ， [我|wǒ] [爷爷|yé ye] [挖|wā] [了|le] [一|yī] [个|gè] [坑|kēng] ， [种|zhòng] [了|le] [一|yī] [颗|kē] [种子|zhǒng zi] 。 [就|jiù] [是|shì] [这样|zhè yàng] [种|zhòng] [的|de] 。',
      'わし が [子|こ]ども の ころ 、 じいさん が [穴|あな] を [掘|ほ]った 。 そして 、 たね を [植|う]えた 。 そう やる ん じゃ 。'),
    'seed.hard': L('But the ground here is so hard… I can’t dig it.',
      'Pero aquí la tierra está muy dura… No puedo cavar.',
      'Mas aqui a terra é muito dura… Eu não consigo cavar.',
      'Aber der Boden hier ist so hart … Ich kann nicht graben.',
      '[可是|kě shì] [这里|zhè lǐ] [的|de] [土|tǔ] [太|tài] [硬|yìng] [了|le] … [我|wǒ] [挖|wā] [不|bù] [动|dòng] 。',
      'でも 、 ここ の [土|つち] 、 すごく かたい ん だ … ぼく じゃ [掘|ほ]れない 。'),
    'seed.dug': L('Wow, what a hole! Now… the seed.',
      '¡Qué hoyo! Ahora… la semilla.',
      'Que buraco! Agora… a semente.',
      'Was für ein Loch! Jetzt … der Samen.',
      '[好|hǎo] [大|dà] [的|de] [坑|kēng] ！ [现在|xiàn zài] … [种子|zhǒng zi] 。',
      'すごい [穴|あな] ！ じゃあ … たね だ ね 。'),
    'seed.thanks': L('We did it! One day it will be a big tree, and everyone will sit in its shade.',
      '¡Lo hicimos! Un día será un árbol grande, y todos se sentarán a su sombra.',
      'A gente conseguiu! Um dia vai ser uma árvore grande, e todo mundo vai sentar na sombra dela.',
      'Wir haben es geschafft! Eines Tages wird das ein großer Baum, und alle werden in seinem Schatten sitzen.',
      '[我们|wǒ men] [成功|chéng gōng] [了|le] ！ [总有一天|zǒng yǒu yī tiān] [它|tā] [会|huì] [长成|zhǎng chéng] [一|yī] [棵|kē] [大|dà] [树|shù] ， [大家|dà jiā] [都|dōu] [会|huì] [在|zài] [树|shù] [下|xià] [乘凉|chéng liáng] 。',
      'やった ！ いつか [大|おお]きな [木|き] に なる よ 。 みんな が その [日陰|ひかげ] で [休|やす]む ん だ 。'),
    'seed.again': L('Look how it grows! I water it every morning.',
      '¡Mira cómo crece! La riego todas las mañanas.',
      'Olha como ela cresce! Eu rego todo dia de manhã.',
      'Schau, wie er wächst! Ich gieße ihn jeden Morgen.',
      '[你|nǐ] [看|kàn] [它|tā] [长|zhǎng] [得|de] [多|duō] [快|kuài] ！ [我|wǒ] [每天|měi tiān] [早上|zǎo shang] [给|gěi] [它|tā] [浇水|jiāo shuǐ] 。',
      'ほら 、 [育|そだ]って る ！ [毎朝|まいあさ] 、 [水|みず] を やって る ん だ 。'),
    // today: Bruno, who knows who planted it (es: his own father)
    'tree.bruno': L('This tree? {helper}, the old bell ringer’s helper, planted it when he was a boy. He always said a little creature helped him dig.',
      '¿Este árbol? Lo plantó mi padre, Nacho, cuando era niño. Siempre decía que un animalito lo ayudó a cavar.',
      'Esta árvore? Foi o seu Zeca que plantou, quando era menino. Ele era o ajudante do sineiro. Sempre dizia que um bichinho ajudou ele a cavar.',
      'Dieser Baum? Den hat der alte Karl gepflanzt, als er ein Junge war. Er war der Helfer vom Glöckner. Er hat immer gesagt, ein kleines Tier hat ihm beim Graben geholfen.',
      '[这|zhè] [棵|kē] [树|shù] ？ [是|shì] [石头|Shí tou] [爷爷|yé ye] [小|xiǎo] [时候|shí hou] [种|zhòng] [的|de] 。 [他|tā] [那时|nà shí] [是|shì] [敲钟人|qiāo zhōng rén] [的|de] [帮手|bāng shǒu] 。 [他|tā] [总|zǒng] [说|shuō] [有|yǒu] [一|yī] [只|zhī] [小|xiǎo] [动物|dòng wù] [帮|bāng] [他|tā] [挖|wā] [了|le] [坑|kēng] 。',
      'この [木|き] です か ？ ふみた さん が [子|こ]ども の ころ に [植|う]えた ん です よ 。 [鐘|かね] つき の [手伝|てつだ]い を して いた [人|ひと] です 。 [小|ちい]さな [生|い]き[物|もの] が [掘|ほ]る の を [手伝|てつだ]って くれた って 、 いつも [言|い]って いました 。',
      { en_es: 'This tree? My father, Nacho, planted it when he was a boy. He always said a little creature helped him dig.' }),
    // ------------------------------------------------------------ the promise (the Future): Marta, Tito, Nico, Noa's echo
    'fest.ask': L('The Festival of Voices… I’m going to hold it again. But will anyone come? Will anyone sing?',
      'La Fiesta de las Voces… la voy a hacer otra vez. Pero ¿vendrá alguien? ¿Cantará alguien?',
      'A Festa das Vozes… eu vou fazer de novo. Mas será que alguém vai vir? Alguém vai cantar?',
      'Das Fest der Stimmen … ich werde es wieder feiern. Aber wird jemand kommen? Wird jemand singen?',
      '[声音节|Shēng yīn jié] … [我|wǒ] [要|yào] [再|zài] [办|bàn] [一|yī] [次|cì] 。 [可是|kě shì] [会|huì] [有|yǒu] [人|rén] [来|lái] [吗|ma] ？ [会|huì] [有|yǒu] [人|rén] [唱歌|chàng gē] [吗|ma] ？',
      '[声|こえ] の [祭|まつ]り … また [開|ひら]く つもり です 。 でも 、 だれ か [来|く]る でしょう か 。 だれ か [歌|うた]う でしょう か 。'),
    'fest.you': L('And you? What will you do at the festival?',
      '¿Y tú? ¿Qué harás tú en la fiesta?',
      'E você? O que você vai fazer na festa?',
      'Und du? Was wirst du auf dem Fest machen?',
      '[你|nǐ] [呢|ne] ？ [你|nǐ] [会|huì] [在|zài] [节日|jié rì] [上|shàng] [做|zuò] [什么|shén me] ？',
      'あなた は ？ お[祭|まつ]り で [何|なに] を する つもり です か ？'),
    'fest.yes': L('A promise! Then there will be a festival. Every voice counts, yours too!',
      '¡Una promesa! Entonces habrá fiesta. Toda voz cuenta, ¡la tuya también!',
      'Uma promessa! Então vai ter festa. Toda voz conta, a sua também!',
      'Ein Versprechen! Dann wird es ein Fest geben. Jede Stimme zählt, deine auch!',
      '[一言为定|yī yán wéi dìng] ！ [那|nà] [就|jiù] [会|huì] [有|yǒu] [节日|jié rì] [了|le] 。 [每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù] ， [你|nǐ] [的|de] [也|yě] [是|shì] ！',
      '[約束|やくそく] です ね ！ それ なら 、 お[祭|まつ]り は きっと ある でしょう 。 どの [声|こえ] も [大切|たいせつ] 、 あなた の [声|こえ] も ！'),
    'fest.noa': L('A promise is a little piece of tomorrow. Take it home with you: today will have to keep it.',
      'Una promesa es un pedacito de mañana. Llévatela a casa: el hoy tendrá que cumplirla.',
      'Uma promessa é um pedacinho do amanhã. Leva ela pra casa: o hoje vai ter que cumprir.',
      'Ein Versprechen ist ein kleines Stück Morgen. Nimm es mit nach Hause: Das Heute wird es halten müssen.',
      '[承诺|chéng nuò] [是|shì] [一|yī] [小|xiǎo] [块|kuài] [明天|míng tiān] 。 [把|bǎ] [它|tā] [带|dài] [回家|huí jiā] [吧|ba] ： [今天|jīn tiān] [会|huì] [替|tì] [你|nǐ] [守住|shǒu zhù] [它|tā] 。',
      '[約束|やくそく] は 、 [明日|あした] の [小|ちい]さな かけら 。 [持|も]って [帰|かえ]って 。 [今日|きょう] が それ を [守|まも]る ん だ よ 。'),
    'fest.again': L('I’ll see you at the festival. Don’t forget your promise!',
      'Nos vemos en la fiesta. ¡No olvides tu promesa!',
      'A gente se vê na festa. Não esquece a sua promessa!',
      'Wir sehen uns auf dem Fest. Vergiss dein Versprechen nicht!',
      '[节日|jié rì] [上|shàng] [见|jiàn] 。 [别|bié] [忘了|wàng le] [你|nǐ] [的|de] [承诺|chéng nuò] ！',
      'お[祭|まつ]り で [会|あ]いましょう 。 [約束|やくそく] 、 [忘|わす]れないで ください ね ！'),
    // today: Marta at her bakery, and the banner
    'banner.marta': L('The strangest thing! Last night I dreamed someone promised to sing at the Festival of Voices. So this morning I thought: why not? This year, Alba will have its festival again!',
      '¡Qué cosa más rara! Anoche soñé que alguien me prometía cantar en la Fiesta de las Voces. Y esta mañana pensé: ¿por qué no? ¡Este año Alba tendrá su fiesta otra vez!',
      'Que coisa estranha! Ontem à noite eu sonhei que alguém me prometia cantar na Festa das Vozes. E hoje de manhã eu pensei: por que não? Este ano Alba vai ter a festa de novo!',
      'Was für eine seltsame Sache! Heute Nacht habe ich geträumt, dass mir jemand versprochen hat, auf dem Fest der Stimmen zu singen. Und heute Morgen dachte ich: Warum nicht? Dieses Jahr wird Alba wieder sein Fest haben!',
      '[真|zhēn] [奇怪|qí guài] ！ [昨天|zuó tiān] [晚上|wǎn shang] [我|wǒ] [梦见|mèng jiàn] [有|yǒu] [人|rén] [答应|dā ying] [我|wǒ] [在|zài] [声音节|Shēng yīn jié] [上|shàng] [唱歌|chàng gē] 。 [今天|jīn tiān] [早上|zǎo shang] [我|wǒ] [想|xiǎng] ： [为什么|wèi shén me] [不|bù] [呢|ne] ？ [今年|jīn nián] ， [阿尔巴|Ā ěr bā] [又|yòu] [要|yào] [过|guò] [声音节|Shēng yīn jié] [了|le] ！',
      '[不思議|ふしぎ] な こと が あった ん です よ ！ ゆうべ 、 だれ か が [声|こえ] の [祭|まつ]り で [歌|うた]う と [約束|やくそく] して くれる [夢|ゆめ] を [見|み]ました 。 それ で [今朝|けさ] 、 [思|おも]った ん です 。 やりましょう ！ [今年|ことし] 、 アルバ で また お[祭|まつ]り を [開|ひら]きます よ ！'),
  };
  // the demonstrations (said whole in the language, the shown words glossed: STORY.demoLine)
  const DEMO = {
    'fest.tito': L('I’ll play the guitar at the festival!', '¡Yo tocaré la guitarra en la fiesta!', 'Eu vou tocar violão na festa!', 'Ich werde auf dem Fest Gitarre spielen!',
      '[我|wǒ] [会|huì] [在|zài] [节日|jié rì] [上|shàng] [弹|tán] [吉他|jí tā] ！', 'お[祭|まつ]り で ギター を [弾|ひ]く つもり です ！'),
    'fest.nico': L('And I’ll sing with everyone!', '¡Y yo cantaré con todos!', 'E eu vou cantar com todo mundo!', 'Und ich werde mit allen singen!',
      '[我|wǒ] [也|yě] [会|huì] [跟|gēn] [大家|dà jiā] [一起|yī qǐ] [唱歌|chàng gē] ！', 'おれ は みんな と [歌|うた]う つもり ！'),
  };
  const MARKS = {
    'seed.demo': { es: [['cavó', 'dug'], ['plantó', 'planted'], ['semilla', 'seed']], pt: [['cavou', 'dug'], ['plantou', 'planted'], ['semente', 'seed']], de: [['gegraben', 'dug'], ['gepflanzt', 'planted'], ['Samen', 'seed']],
      zh: [['[挖|wā] [了|le]', 'dug'], ['[种|zhòng] [了|le]', 'planted'], ['[种子|zhǒng zi]', 'seed']], ja: [['[掘|ほ]った', 'dug'], ['[植|う]えた', 'planted'], ['たね', 'seed']] },
    'fest.tito': { es: [['tocaré', 'I’ll play'], ['fiesta', 'festival']], pt: [['vou tocar', 'I’ll play'], ['festa', 'festival']], de: [['werde', 'will'], ['spielen', 'play']],
      zh: [['[会|huì]', 'will'], ['[弹|tán]', 'play'], ['[节日|jié rì]', 'festival']], ja: [['[弾|ひ]く つもり', 'will play'], ['お[祭|まつ]り', 'festival']] },
    'fest.nico': { es: [['cantaré', 'I’ll sing']], pt: [['vou cantar', 'I’ll sing']], de: [['werde', 'will'], ['singen', 'sing']], zh: [['[唱歌|chàng gē]', 'sing']], ja: [['[歌|うた]う つもり', 'will sing']] },
  };
  // ------------------------------------------------------------ the tasks (past_scenes.js's grading: want / alt / other / pres / more)
  // frame (the box, ___ the blank), chips ([word, English]), model ({mimo}: the player's name for it), want (one must be there),
  // alt (right, a little off: A), other (the other past: B), pres (now, not then: try again), more (the rest of the sentence: an S)
  const TASKS = {
    dig: { title: '{helper} can’t dig the hard ground. Tell {mimo} what it did, as a memory.',
      frame: { es: '{mimo} ___ un hoyo.', pt: 'O {mimo} ___ um buraco.', de: '{mimo} hat ein Loch ___.', zh: '{mimo} ___ [一|yī] [个|gè] [坑|kēng] 。', ja: '{mimo} が [穴|あな] を ___ 。' },
      chips: { es: [['cavó', 'dug']], pt: [['cavou', 'dug']], de: [['gegraben', 'dug']], zh: [['[挖|wā] [了|le]', 'dug']], ja: [['[掘|ほ]った', 'dug']] },
      model: L('{mimo} dug a hole.', '{mimo} cavó un hoyo.', 'O {mimo} cavou um buraco.', '{mimo} hat ein Loch gegraben.', '{mimo} [挖|wā] [了|le] [一|yī] [个|gè] [坑|kēng] 。', '{mimo} が [穴|あな] を [掘|ほ]った 。'),
      want: { es: ['cavó', 'excavó'], pt: ['cavou', 'escavou'], de: [['hat', 'gegraben'], ['hat', 'ausgegraben']], zh: [['[挖|wā]', '[了|le]']], ja: ['[掘|ほ]った', '[掘|ほ]りました'] },
      alt: { de: ['grub'] }, other: { es: ['cavaba'], pt: ['cavava'] },
      pres: { es: ['cava', 'cavar', 'cavo'], pt: ['cava', 'cavar'], de: ['gräbt', 'grab', 'graben'], zh: ['[挖|wā]'], ja: ['[掘|ほ]る', '[掘|ほ]って', '[掘|ほ]ります'] },
      more: { es: ['hoyo', 'agujero'], pt: ['buraco'], de: ['loch'], zh: ['[坑|kēng]', '[洞|dòng]'], ja: ['[穴|あな]'] } },
    plant: { title: 'Now the seed. Tell {mimo} what it did with it, as a memory.',
      frame: { es: '{mimo} ___ la semilla.', pt: 'O {mimo} ___ a semente.', de: '{mimo} hat den Samen ___.', zh: '{mimo} ___ [种子|zhǒng zi] 。', ja: '{mimo} が たね を ___ 。' },
      chips: { es: [['plantó', 'planted']], pt: [['plantou', 'planted']], de: [['gepflanzt', 'planted']], zh: [['[种|zhòng] [了|le]', 'planted']], ja: [['[植|う]えた', 'planted']] },
      model: L('{mimo} planted the seed.', '{mimo} plantó la semilla.', 'O {mimo} plantou a semente.', '{mimo} hat den Samen gepflanzt.', '{mimo} [种|zhòng] [了|le] [种子|zhǒng zi] 。', '{mimo} が たね を [植|う]えた 。'),
      want: { es: ['plantó', 'sembró'], pt: ['plantou', 'semeou'], de: [['hat', 'gepflanzt'], ['hat', 'gesät']], zh: [['[种|zhòng]', '[了|le]']], ja: ['[植|う]えた', '[植|う]えました', 'まいた'] },
      alt: { de: ['pflanzte', 'säte'] }, other: { es: ['plantaba'], pt: ['plantava'] },
      pres: { es: ['planta', 'plantar', 'planto'], pt: ['planta', 'plantar'], de: ['pflanzt', 'pflanze', 'pflanzen'], zh: ['[种|zhòng]'], ja: ['[植|う]える', '[植|う]えて', '[植|う]えます'] },
      more: { es: ['semilla'], pt: ['semente'], de: ['samen'], zh: ['[种子|zhǒng zi]'], ja: ['たね', '[種|たね]'] } },
  };
  // the promise: future_text.js's grader (FTXT.grade.future) with a task of its own, 'tfest'
  const FEST = {
    title: 'Promise Marta what you’ll do at the Festival of Voices, tomorrow.',
    frame: { es: 'Yo ___ en la fiesta.', pt: 'Eu vou ___ na festa.', de: 'Ich werde auf dem Fest ___.', zh: '[我|wǒ] [会|huì] [在|zài] [节日|jié rì] [上|shàng] ___ 。', ja: 'お[祭|まつ]り で ___ つもり です 。' },
    chips: { es: [['cantaré', 'I’ll sing'], ['bailaré', 'I’ll dance'], ['vendré', 'I’ll come']], pt: [['cantar', 'sing'], ['dançar', 'dance'], ['vir', 'come']], de: [['singen', 'sing'], ['tanzen', 'dance'], ['kommen', 'come']],
      zh: [['[唱歌|chàng gē]', 'sing'], ['[跳舞|tiào wǔ]', 'dance'], ['[来|lái]', 'come']], ja: [['[歌|うた]う', 'sing'], ['[踊|おど]る', 'dance'], ['[来|く]る', 'come']] },
    task: { verb: { es: 'cantar', pt: 'cantar', de: 'singen', zh: '[唱|chàng]', ja: '[歌|うた]う' },
      alt: { es: ['bailar', 'venir', 'tocar', 'ir', 'estar', 'hablar', 'decir'], pt: ['dançar', 'dancar', 'vir', 'tocar', 'ir', 'estar', 'falar'], de: ['tanzen', 'kommen', 'spielen', 'sein', 'sprechen', 'sagen'],
        zh: ['[唱歌|chàng gē]', '[跳舞|tiào wǔ]', '[跳|tiào]', '[来|lái]', '[弹|tán]', '[说|shuō]'], ja: ['うたう', '[踊|おど]る', 'おどる', '[来|く]る', 'くる', '[行|い]く', 'いく', '[弾|ひ]く'] },
      thing: { es: ['fiesta'], pt: ['festa'], de: ['fest'], zh: ['[节|jié]'], ja: ['[祭|まつ]り', 'まつり'] },
      model: L('I’ll sing at the festival.', 'Yo cantaré en la fiesta.', 'Eu vou cantar na festa.', 'Ich werde auf dem Fest singen.', '[我|wǒ] [会|huì] [在|zài] [节日|jié rì] [上|shàng] [唱歌|chàng gē] 。', 'お[祭|まつ]り で [歌|うた]う つもり です 。'),
      doing: 'planning the Festival of Voices again' },
    where: { es: 'en la fiesta', pt: 'na festa', de: 'auf dem Fest', zh: '[在|zài] [节日|jié rì] [上|shàng]', ja: 'お[祭|まつ]り で' },
  };
  // ------------------------------------------------------------ names, signs, the carving
  const NAMES = {
    banner: L('FESTIVAL OF VOICES', 'FIESTA DE LAS VOCES', 'FESTA DAS VOZES', 'FEST DER STIMMEN', '[声音节|Shēng yīn jié]', '[声|こえ] の [祭|まつ]り'),
    motto: L('Every voice counts', 'Toda voz cuenta', 'Toda voz conta', 'Jede Stimme zählt', '[每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù]', 'どの [声|こえ] も [大切|たいせつ]'),
    again: L('This year, again!', '¡Este año, otra vez!', 'Este ano, de novo!', 'Dieses Jahr wieder!', '[今年|jīn nián] [又|yòu] [来|lái] [了|le] ！', '[今年|ことし] 、 ふたたび ！'),
  };
  const CARVE = { es: 'N', pt: 'Z', de: 'K', zh: '石', ja: 'ふ' };
  const isC = l => l === 'zh' || l === 'ja';
  const en = (T, l) => (T && (T['en_' + l] || T.en)) || '';
  // every zh / ja string against CJK.md's rules: [] when all's well
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return ['no CJK'];
    const out = [], v = (s, l, where) => { if (!s || typeof s !== 'string') return; const p = CJK.validate(s.replace(/\{[^}]+\}/g, l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ').replace(/___/g, l === 'zh' ? '[它|tā]' : 'それ'), l); if (p.length) out.push(`${where} (${l}): ${p.join('; ')} «${s}»`); };
    const each = (T, where) => { for (const l of ['zh', 'ja']) if (T && T[l]) [].concat(T[l]).forEach(x => (Array.isArray(x) ? x.forEach(y => v(y, l, where)) : v(x, l, where))); };
    for (const [k, T] of Object.entries(LINES)) each(T, k);
    for (const [k, T] of Object.entries(DEMO)) each(T, k);
    for (const [k, T] of Object.entries(NAMES)) each(T, 'name ' + k);
    for (const [k, M] of Object.entries(MARKS)) for (const l of ['zh', 'ja']) (M[l] || []).forEach(m => v(m[0], l, 'mark ' + k));
    for (const [k, T] of Object.entries(TASKS)) { for (const f of ['frame', 'model', 'want', 'alt', 'other', 'pres', 'more']) each(T[f], `task ${k} ${f}`); for (const l of ['zh', 'ja']) ((T.chips || {})[l] || []).forEach(c => v(c[0], l, `task ${k} chip`)); }
    for (const f of ['frame', 'where']) each(FEST[f], 'fest ' + f);
    for (const l of ['zh', 'ja']) { (FEST.chips[l] || []).forEach(c => v(c[0], l, 'fest chip')); v(FEST.task.model[l], l, 'fest model'); v(FEST.task.verb[l], l, 'fest verb'); (FEST.task.alt[l] || []).forEach(x => v(x, l, 'fest alt')); (FEST.task.thing[l] || []).forEach(x => v(x, l, 'fest thing')); }
    return out;
  }
  return { L, LINES, DEMO, MARKS, TASKS, FEST, NAMES, CARVE, isC, en, check };
})();

// ============================================================ Alba's three worlds: the region, its cracks, the puzzles' scenes
const TIME_ALBA = (() => {
  if (typeof TIME === 'undefined') return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd;
  const G = () => A.G;
  const lang = () => A.lang();
  const isCl = l => l === 'zh' || l === 'ja';
  const wait = s => STORY.wait(s);
  const lock = on => { const g = G(); g.sim.lock = on ? 1 : 0; if (!on) g.cam.override = null; };
  const shot = (pos, look, dur = 0.9) => { G().cam.override = { pos, look, dur }; };
  const mimoName = () => (G() && G().state.mimoName) || 'Mimo';
  // {mimo} in the language's text: the player's name for it (zh / ja: 米莫 / ミモ in the notation while it's still Mimo)
  const fillMimo = (t, l = lang()) => { const n = mimoName(); return String(t || '').replace(/\{mimo\}/g, isCl(l) && n === 'Mimo' ? (l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ') : n); };
  // {helper} / {ringer} in the English: the language's own cast (past_text.js); {mimo}: the name
  const fillEn = (t, l = lang()) => (typeof PTXT !== 'undefined' ? PTXT.fill(String(t || ''), l) : String(t || '')).replace(/\{mimo\}/g, mimoName())
    .replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());      // («old Wendelin» starting a sentence)
  const plainT = s => A.plainT(s);
  const down = (letter, n) => 'SABCD'[Math.max(0, Math.min(4, 'SABCD'.indexOf(letter) + n))];

  // ------------------------------------------------------------ where things are
  const SEED = { x: -34.2, z: -159.2 };                                   // just outside the yard's west fence, where the tree will stand
  const HELPER_AT = { x: -33.2, z: -160.9 }, RINGER_AT = { x: -35.7, z: -161.6 };     // (in the Past: the helper by his seed, the old ringer watching)
  const BANNER = { a: { x: -17.2, z: -155.6 }, b: { x: -2.8, z: -155.6 } };     // (the plaza's north side: where tomorrow's banner hangs, torn)
  const CRACK = { yard: { x: -29.6, z: -157.0 }, street: { x: -9.4, z: -128.8 }, pond: { x: 4.5, z: -168.5 } };

  // ------------------------------------------------------------ saying things
  function say(p, key) {
    const T = ATXT.LINES[key]; if (!p || !T) return Promise.resolve();
    const l = lang(); p.lines = { en: fillEn(ATXT.en(T, l), l), [l]: fillMimo(T[l] || '', l) };
    return STORY.sayInline(p);
  }
  function demo(p, key) {
    const T = ATXT.DEMO[key] || ATXT.LINES[key]; if (!p || !T) return Promise.resolve();
    const l = lang(), T2 = { en: fillEn(ATXT.en(T, l), l) };
    ['es', 'pt', 'de', 'zh', 'ja'].forEach(x => { T2[x] = fillMimo(T[x] || '', x); });
    return STORY.demoLine(p, T2, ATXT.MARKS[key]);
  }
  // the people: the Past's (past.js, named by past_text.js's cast), the Future's (future.js)
  const pastP = id => (typeof PAST !== 'undefined' && PAST._ && PAST._.W.people[id]) || null;
  const pastWho = id => { const P = pastP(id); if (!P) return null; if (typeof PTXT !== 'undefined' && PTXT.CAST[id]) P.api.name = PTXT.pick(PTXT.CAST[id], lang()); return P.api; };
  const futP = id => { const B = typeof FUTURE !== 'undefined' && FUTURE._ && FUTURE._.B(); return (B && (id === 'noa' ? B.noa : B.byId[id])) || null; };
  // a two-shot from your side (future_scenes.js's way)
  function frame2(p, side = 1, dist = 4.4) {
    const Y = G().sim.you, dx = p.x - Y.x, dz = p.z - Y.z, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d, y = p.y || gy(p.x, p.z);
    shot(V((p.x + Y.x) / 2 - ux * dist * 0.55 + uz * side * 2.2, y + 2.4, (p.z + Y.z) / 2 - uz * dist * 0.55 - ux * side * 2.2), V((p.x + Y.x) / 2, y + 1.25, (p.z + Y.z) / 2));
  }

  // ------------------------------------------------------------ the region: Alba's Past is past.js, its Future future.js (rooms of
  // their own: TIME follows them), the songs theirs; the Past teaches the preterite and the imperfect, the Future the future and
  // the conditional (Chapters 2 and 3)
  function pastDots() { const W = PAST._ && PAST._.W; return W ? Object.values(W.people).filter(P => P.g.visible).map(P => ({ x: P.api.x, z: P.api.z })) : []; }
  function futDots() { const B = FUTURE._ && FUTURE._.B(); return B ? Object.values(B.byId).map(p => ({ x: p.x, z: p.z })) : []; }
  function restoreFuture(at) {
    const f = G().state.flags;
    if (f.futureIn && !f.futureDone) return 'self';      // (Chapter 3 itself: future.js comes back by itself)
    FUTURE.enter({ at: at || FUTURE.OUTSIDE, quick: true, scene: false, noFade: true });
    return true;
  }
  // (in the Past, after Chapter 2: the bell ringer's helper by his seed, the old ringer watching him)
  function stagePast() {
    const H = pastP('helper'), R = pastP('ringer'); if (!H || !R || !PAST.API) return;
    PAST.API.place(H, HELPER_AT.x, HELPER_AT.z); PAST.API.faceTo(H, SEED.x, SEED.z); PAST.API.show(H, true);
    PAST.API.place(R, RINGER_AT.x, RINGER_AT.z); PAST.API.faceTo(R, SEED.x, SEED.z); PAST.API.show(R, true);
  }
  TIME.region('alba', {
    name: { now: 'Alba', past: 'Alba, long ago', future: 'Alba · tomorrow' },
    color: { past: '#c98a3a', future: '#6f6b84' },
    center: { x: -10, z: -150 }, radius: 46,
    open: s => !!(s && s.flags && s.flags.futureDone),
    grammar: { past: ['pret', 'impf'], future: ['fut', 'cond'] },
    songs: { past: () => (typeof PAST !== 'undefined' ? PAST.song() : 'past'), future: () => (typeof FUTURE !== 'undefined' ? FUTURE.song() : 'future') },
    dress: {
      past: { room: typeof PAST !== 'undefined' ? PAST : null,
        on: (api, at) => PAST.enterAt(at),
        off: async (api, to) => { await PAST.exitTo('now'); if (to) api.teleport(to); },
        entered: () => { if (G().state.flags.pastDone) stagePast(); },
        dots: () => pastDots() },
      future: { room: typeof FUTURE !== 'undefined' ? FUTURE : null,
        on: (api, at) => FUTURE.enter({ at, quick: true, scene: false, noFade: true }),
        off: (api, to) => FUTURE.leave({ to: to || { x: G().sim.you.x, z: G().sim.you.z, yaw: G().sim.you.yaw }, quick: true, noFade: true }),
        restore: (api, at) => restoreFuture(at),
        dots: () => futDots() },
    },
    tick: (api, dt) => tick(dt),
  });
  TIME.crack('alba.yard', { region: 'alba', x: CRACK.yard.x, z: CRACK.yard.z, worlds: ['now', 'past'] });           // (where the Past's little tear was)
  TIME.crack('alba.street', { region: 'alba', x: CRACK.street.x, z: CRACK.street.z, worlds: ['now', 'future'] });
  TIME.crack('alba.pond', { region: 'alba', x: CRACK.pond.x, z: CRACK.pond.z, worlds: ['now', 'past', 'future'] });

  // ------------------------------------------------------------ the pieces: the tree (today, tomorrow), the seedling, the hole, the banners
  // (the tree and its trunk fade, dithered, near the camera and between it and you, like the forest's: world3d.js's way)
  const FADE = { uCamPos: { value: new THREE.Vector3() }, uFocus: { value: new THREE.Vector3() } };
  let FMAT = null;
  function fadeMat() {
    if (FMAT) return FMAT;
    const m = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: TK.grad, vertexColors: true });
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, FADE);
      sh.vertexShader = 'varying vec3 vWP2;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vWP2 = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = 'uniform vec3 uCamPos;\nuniform vec3 uFocus;\nvarying vec3 vWP2;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
        vec3 seg = uFocus - uCamPos; float segL = max(length(seg), 0.001); vec3 dir = seg / segL;
        vec3 rel = vWP2 - uCamPos; float along = dot(rel, dir); float axis = length(rel - dir * along);
        float occl = step(0.0, along) * step(along, segL - 0.8) * (1.0 - smoothstep(0.8, 2.2, axis));
        float nearCam = 1.0 - smoothstep(1.8, 4.2, length(rel));
        if (nearCam > 0.8) discard;
        float fadeAmt = max(occl * 0.85, nearCam);
        if (fadeAmt > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < fadeAmt) discard;`);
    };
    m.customProgramCacheKey = () => 'timeAlbaFade';
    return (FMAT = m);
  }
  function treeGeo(old) {
    const I = TK.G.ico1, pcs = [], tr = old ? 0.62 : 0.5, th = old ? 3.8 : 3.3, bark = old ? '#6d4b33' : '#7c5436';
    pcs.push({ geo: new THREE.CylinderGeometry(tr * 0.62, tr, th, 9), m: TK.M4(0, th / 2, 0, 1), color: bark });
    pcs.push({ geo: new THREE.CylinderGeometry(0.12, 0.2, 1.6, 6), m: TK.M4(0.55, th - 0.4, 0.1, 1, 1, 1, 0, 0, -0.8), color: bark });
    pcs.push({ geo: new THREE.CylinderGeometry(0.1, 0.18, 1.4, 6), m: TK.M4(-0.5, th - 0.6, -0.2, 1, 1, 1, 0, 0.3, 0.9), color: bark });
    const s = old ? 1.22 : 1.0, cols = old ? ['#5f8f4a', '#6a9a52', '#58884a', '#73a35a', '#62924d', '#6c9d55', '#7aa65e'] : ['#4a9440', '#55a346', '#4f9c3f', '#62b04c', '#4b973f', '#5aa84a', '#6ab653'];
    [[0, 4.6, 0, 2.0], [1.6, 4.1, 0.4, 1.5], [-1.5, 4.2, -0.3, 1.6], [0.3, 5.6, -0.4, 1.4], [-0.5, 4.0, 1.4, 1.4], [0.6, 4.1, -1.4, 1.4], [0.1, 6.3, 0.3, 0.9]]
      .forEach(([x, y, z, r], i) => pcs.push({ geo: I, m: TK.M4(x * s, y * s, z * s, r * s), color: cols[i] }));
    return TK.merge(pcs);
  }
  // the letters carved in its bark: the helper's initial, and Mimo's name (the language's own: N, Z, K, 石, ふ)
  function carveTex() {
    const l = lang(), cv = document.createElement('canvas'); cv.width = 256; cv.height = 128;
    const c = cv.getContext('2d'); c.fillStyle = '#6b4a30'; c.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(40,26,16,${0.12 + Math.random() * 0.12})`; c.fillRect(0, Math.random() * 128, 256, 2 + Math.random() * 3); }
    const nm = mimoName() === 'Mimo' && isCl(l) ? (l === 'zh' ? '米莫' : 'ミモ') : mimoName();
    c.font = '700 44px Georgia, "Yu Mincho", "Microsoft YaHei", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#3a2618'; c.fillText(`${ATXT.CARVE[l] || 'N'} + ${nm}`, 128, 66); c.fillStyle = 'rgba(255,230,190,0.35)'; c.fillText(`${ATXT.CARVE[l] || 'N'} + ${nm}`, 127, 64);
    c.strokeStyle = '#3a2618'; c.lineWidth = 3; c.beginPath(); c.ellipse(128, 64, 116, 50, 0, 0, Math.PI * 2); c.stroke();
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return { t, key: l + mimoName() };
  }
  function makeTree(kind) {
    const old = kind === 'future', g = new THREE.Group(), y = gy(SEED.x, SEED.z);
    g.position.set(SEED.x, y, SEED.z); g.rotation.y = old ? 0.7 : 0.3; g.name = 'time-alba-tree-' + kind;
    const m = new THREE.Mesh(treeGeo(old), fadeMat()); m.castShadow = true; m.receiveShadow = true; g.add(m);
    const C = carveTex(), tr = old ? 0.62 : 0.5;
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), new THREE.MeshLambertMaterial({ map: C.t }));
    const face = Math.PI / 2 - g.rotation.y;          // (the letters face the yard, to the east)
    plate.position.set(Math.sin(face) * (tr * 0.86 + 0.02), 1.35, Math.cos(face) * (tr * 0.86 + 0.02)); plate.rotation.y = face; g.add(plate);
    let key = C.key;
    return { obj: g, solids: [{ x: SEED.x, z: SEED.z, r: old ? 0.65 : 0.55 }],
      update() { if (lang() + mimoName() !== key) { const C2 = carveTex(); plate.material.map = C2.t; plate.material.needsUpdate = true; key = C2.key; } } };
  }
  function makeSprout() {
    const g = new THREE.Group(); g.position.set(SEED.x, gy(SEED.x, SEED.z), SEED.z); g.name = 'time-alba-sprout';
    g.add(TK.part(TK.G.sphere, '#7a5a3e', [0, 0.02, 0], [0.55, 0.12, 0.55], { ink: 0.012 }));
    const stem = new THREE.Group(); g.add(stem);
    stem.add(TK.part(TK.G.cyl, '#5aa84a', [0, 0.27, 0], [0.035, 0.5, 0.035], { ink: 0.006 }));
    stem.add(TK.part(TK.G.sphere, '#6ab653', [0.12, 0.5, 0], [0.15, 0.045, 0.08], { ink: 0.006, rot: [0, 0, 0.5] }));
    stem.add(TK.part(TK.G.sphere, '#62b04c', [-0.11, 0.44, 0.02], [0.13, 0.04, 0.07], { ink: 0.006, rot: [0, 0.3, -0.5] }));
    const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff2b0', transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.setScalar(1.3); gl.position.y = 0.45; g.add(gl);
    return { obj: g, update(dt, t) { stem.rotation.z = Math.sin(t * 1.6) * 0.08; stem.rotation.x = Math.sin(t * 1.1 + 1) * 0.05; gl.material.opacity = 0.22 + 0.1 * Math.sin(t * 2); } };
  }
  function makeHole() {
    const g = new THREE.Group(); g.position.set(SEED.x, gy(SEED.x, SEED.z), SEED.z); g.name = 'time-alba-hole';
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), new THREE.MeshBasicMaterial({ color: '#3a2a20' })); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.035; g.add(hole);
    g.add(TK.part(TK.G.sphere, '#8a6a4a', [0.62, 0.04, 0.18], [0.36, 0.15, 0.3], { ink: 0.01 }));
    g.add(TK.part(TK.G.sphere, '#7d5f42', [0.45, 0.03, -0.3], [0.2, 0.09, 0.18], { ink: 0.008 }));
    return g;
  }
  // the festival banner: today's new and bright, tomorrow's mended (where future.js's torn one hangs; that one is hidden then)
  function bannerTex(kind) {
    const l = lang(), cv = document.createElement('canvas'); cv.width = 1024; cv.height = 192;
    const c = cv.getContext('2d'), now = kind === 'now';
    c.fillStyle = now ? '#c9443a' : '#b9584c'; c.fillRect(0, 0, 1024, 192);
    c.fillStyle = now ? '#e8b83e' : '#d2a85a'; c.fillRect(0, 0, 1024, 16); c.fillRect(0, 176, 1024, 16);
    if (!now) { c.setLineDash([10, 8]); c.strokeStyle = '#f4e3c0'; c.lineWidth = 3; [[120, 40, 150, 110], [700, 60, 170, 100]].forEach(([x, y, w, h]) => { c.fillStyle = 'rgba(244,227,192,0.18)'; c.fillRect(x, y, w, h); c.strokeRect(x, y, w, h); }); c.setLineDash([]); }
    const font = isCl(l) ? '"Noto Sans SC","Microsoft YaHei","Yu Gothic",sans-serif' : 'Georgia, serif';
    c.fillStyle = '#fffaf0'; c.textAlign = 'center'; c.textBaseline = 'middle';
    let fs = 64; const t1 = plainT(ATXT.NAMES.banner[l] || ATXT.NAMES.banner.en); c.font = `800 ${fs}px ${font}`; while (c.measureText(t1).width > 900 && fs > 30) { fs -= 2; c.font = `800 ${fs}px ${font}`; } c.fillText(t1, 512, 72);
    const t2 = '« ' + plainT(ATXT.NAMES.motto[l] || ATXT.NAMES.motto.en) + ' »'; c.font = `italic 600 34px ${font}`; c.fillText(t2, 512, 138);
    if (now) { const t3 = plainT(ATXT.NAMES.again[l] || ATXT.NAMES.again.en); c.font = `800 22px ${font}`; const w = c.measureText(t3).width + 30; c.fillStyle = '#2b2235'; c.fillRect(1000 - w, 150, w, 30); c.fillStyle = '#ffd84a'; c.fillText(t3, 1000 - w / 2, 166); }
    const t = new THREE.CanvasTexture(cv); t.anisotropy = 4; return t;
  }
  const bannerKey = () => lang() + (typeof CJK !== 'undefined' && isCl(lang()) && CJK.mode ? CJK.mode(lang()) : '');
  function makeBanner(kind) {
    const { a, b } = BANNER, g = new THREE.Group(); g.name = 'time-alba-banner-' + kind;
    for (const p of [a, b]) { const y0 = gy(p.x, p.z); g.add(TK.part(TK.G.cyl, '#7a5a40', [p.x, y0 + 1.9, p.z], [0.09, 3.8, 0.09], { ink: 0.01 })); g.add(TK.part(TK.G.sphere, '#e8b83e', [p.x, y0 + 3.86, p.z], [0.12, 0.12, 0.12], { ink: 0.008 })); }
    const tex0 = bannerTex(kind), mat = new THREE.MeshLambertMaterial({ map: tex0, emissive: new THREE.Color(kind === 'now' ? '#ffffff' : '#cfc6b8'), emissiveMap: tex0, emissiveIntensity: kind === 'now' ? 0.42 : 0.25, transparent: true, side: THREE.DoubleSide, alphaTest: 0.1 });
    const geo = new THREE.PlaneGeometry(12.6, 1.6, 24, 1), pp = geo.attributes.position;
    for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), u = x / 6.3; pp.setY(i, pp.getY(i) - (1 - u * u) * 0.55); pp.setZ(i, Math.sin(u * 3.1) * 0.08); }
    geo.computeVertexNormals();
    const cloth = new THREE.Mesh(geo, mat); cloth.position.set((a.x + b.x) / 2, gy(a.x, a.z) + 3.2, a.z); cloth.rotation.z = 0.05; g.add(cloth);
    // bunting from the pole tops, out past the cloth's ends (today's only: tomorrow's is mended, not new)
    if (kind === 'now') {
      const pcs = [], COLS = ['#e2453a', '#ffd84a', '#3f7fc9', '#5fae4f', '#ff8fb1', '#fdf8ee'], cone = new THREE.ConeGeometry(1, 1, 4);
      for (const [p, dir] of [[a, -1], [b, 1]]) { const y0 = gy(p.x, p.z) + 3.75; for (let i = 0; i < 7; i++) { const x = p.x + dir * (0.5 + i * 0.55), y = y0 - 0.35 - Math.sin((i / 7) * Math.PI) * 0.25 - i * 0.14; pcs.push({ geo: cone, m: TK.M4(x, y - 0.18, p.z, 0.18, 0.34, 0.035, Math.PI / 2, Math.PI), color: COLS[(i + (dir > 0 ? 3 : 0)) % COLS.length] }); } }
      const bm = new THREE.Mesh(TK.merge(pcs), TK.toon('#ffffff', { vc: 1, rim: 0.15 })); bm.castShadow = false; g.add(bm);
    }
    let key = bannerKey();
    return { obj: g, solids: [{ x: a.x, z: a.z, r: 0.15 }, { x: b.x, z: b.z, r: 0.15 }],
      update() { const k = bannerKey(); if (k !== key) { key = k; mat.map = mat.emissiveMap = bannerTex(kind); mat.needsUpdate = true; } },
      on: kind === 'future' ? v => { const B = FUTURE._ && FUTURE._.B(); if (B && B.banner && B.banner.g) B.banner.g.visible = !v; } : null };
  }

  // ------------------------------------------------------------ grading what you say (S–D: one letter down per miss; "I don't know",
  // the whole sentence on «?», counts as two)
  async function askPast(id, icon) {
    const T0 = ATXT.TASKS[id], lg = lang(); if (!T0 || typeof PAST_SC === 'undefined') return null;
    const T = Object.assign({}, T0, { model: Object.assign({}, T0.model, { [lg]: fillMimo(T0.model[lg] || '', lg) }) });
    const frame = plainT(fillMimo((T0.frame || {})[lg] || '', lg)), chips = ((T0.chips || {})[lg] || []).map(([w, e]) => `${plainT(w)} (${e})`).join(' · ');
    const modelRaw = fillMimo(T0.model[lg] || '', lg), model = plainT(modelRaw);
    let misses = 0;
    for (;;) {
      const r = await UI.command({ name: mimoName(), icon, title: fillEn(T0.title, lg), verbs: [], model: modelRaw, modelEn: fillEn(ATXT.en(T0.model, lg), lg), placeholder: `«${frame}»`,
        hint: `«${frame}»${chips ? ' · ___ = ' + chips : ''}. In the Past, ${mimoName()} only moves in memories. Stuck? ? shows the whole sentence.` });
      if (!r || r.cancelled) return null;
      const h = document.getElementById('command-hint'), peeked = !!(h && /^Try/.test(h.textContent || ''));
      const g = PAST_SC._.grade(T, r.text, lg, 0);
      if (g.ok) {
        const letter = down(g.letter, misses + (peeked ? 2 : 0)), why = /^Just right/.test(g.why || '') && (misses || peeked) ? (peeked ? 'Right, with the example' : 'Right, on another try') : g.why;
        UI.toast(`${letter} · ${why}`); snd(letter === 'S' ? 'chest' : 'review'); return { letter, text: r.text, ms: r.ms };
      }
      misses++; snd('wrong'); G().sim.mimo.tiltT = 1.4;
      STORY.think(g.kind === 'pres' ? g.why : misses >= 2 ? `Like this: «${model}»` : `Not quite… «${frame}»${chips ? ' · ' + chips : ''}`, 6.5);
    }
  }
  async function askPromise() {
    const lg = lang(), F = ATXT.FEST; if (typeof FTXT === 'undefined') return null;
    if (!FTXT.TASK.tfest) FTXT.TASK.tfest = F.task;
    const frame = plainT(F.frame[lg] || ''), chips = (F.chips[lg] || []).map(([w, e]) => `${plainT(w)} (${e})`).join(' · ');
    const modelRaw = F.task.model[lg] || '', model = plainT(modelRaw);
    let misses = 0;
    for (;;) {
      const r = await UI.command({ name: mimoName(), icon: 'star', title: F.title, verbs: [], model: modelRaw, modelEn: F.task.model.en, placeholder: `«${frame}»`,
        hint: `A promise about tomorrow, in tomorrow’s words: «${frame}» · ___ = ${chips}. Stuck? ? shows the whole sentence.` });
      if (!r || r.cancelled) return null;
      const h = document.getElementById('command-hint'), peeked = !!(h && /^Try/.test(h.textContent || ''));
      const g = FTXT.grade.future(r.text, 'tfest', lg);
      if (g.ok || g.kind === 'wrongverb') {        // (any promise about tomorrow counts: singing, dancing or coming are what Marta hoped for)
        const base = g.ok ? g.letter : 'A';
        let reason = !g.ok ? 'A promise! (Marta hoped for singing, dancing or coming along.)' : String(g.reason || 'tomorrow’s words').replace(/say what, too/, `say where, too: «${plainT(F.where[lg] || '')}»`);
        if (/^tomorrow’s words$/.test(reason) && (misses || peeked)) reason = peeked ? 'Tomorrow’s words, with the example' : 'Tomorrow’s words, on another try';
        const letter = down(base, misses + (peeked ? 2 : 0)); UI.toast(`${letter} · ${reason}`); snd(letter === 'S' ? 'chest' : 'review');
        return { letter, text: r.text };
      }
      misses++; snd('wrong'); G().sim.mimoSay('…?', 1.4);
      STORY.think(g.kind === 'today' ? `«${g.heard || '…'}» is today. A promise needs tomorrow’s words: «${frame}» (? shows an example)` : misses >= 2 ? `Like this: «${model}»` : `A promise about tomorrow: «${frame}» · ${chips}`, 6.5);
    }
  }

  // ------------------------------------------------------------ «The seed»: the Past (the preterite: Mimo, told as a memory)
  const lookSeed = () => { const y = gy(SEED.x, SEED.z); shot(V(SEED.x - 3.4, y + 2.3, SEED.z + 4.6), V(SEED.x + 0.4, y + 0.9, SEED.z - 0.8)); };
  async function seedScene() {
    const H = pastWho('helper'), R = pastWho('ringer'); if (!H || !R) return;
    lock(true);
    try {
      stagePast(); lookSeed(); await wait(0.7);
      await say(H, 'seed.ask');
      await demo(R, 'seed.demo');
      await say(H, 'seed.hard');
      TIME.flag('past', 'seedAsked', true); G().save();
    } finally { lock(false); }
    STORY.think(`In the Past, ${mimoName()} only moves in memories: tell it what it did, as if it already happened.`, 5);
    await seedTasks();
  }
  async function seedTasks() {
    const H = () => pastWho('helper');
    if (!TIME.flag('past', 'seedDug')) {
      const r = await askPast('dig', 'dig'); if (!r) { STORY.think(fillEn('{helper} is still waiting by the hard ground.'), 4); return; }
      TIME.grade('seedDig', r.letter);
      if (typeof LEX !== 'undefined' && LEX.item('v.dig')) { try { LEX.attempt('v.dig', { ok: true, hints: 0, ms: r.ms || 3000, mode: 'command' }); } catch (e) { /* */ } }
      await mimoWorks('dig');
      lock(true); try { await say(H(), 'seed.dug'); } finally { lock(false); }
    }
    if (!TIME.flag('past', 'seedPlanted')) {
      const r = await askPast('plant', 'flower'); if (!r) { STORY.think(fillEn('The hole is dug. {helper} holds the seed out to {mimo}.'), 4); return; }
      TIME.grade('seedPlant', r.letter);
      await mimoWorks('plant');
      lock(true); try { await say(H(), 'seed.thanks'); } finally { lock(false); }
      G().save();
      STORY.think('A seed planted long ago… What stands by Bruno’s yard today?', 6);
    }
  }
  // Mimo, in the memory: it digs (dirt flies), then plants (a pat, a sparkle, the seedling)
  async function mimoWorks(what) {
    const g = G(), sim = g.sim, M = sim.mimo, y = gy(SEED.x, SEED.z);
    lock(true);
    try {
      lookSeed();
      sim.mimoGo({ x: SEED.x + 0.75, z: SEED.z + 0.55 }, SEED); await wait(0.8);
      if (what === 'dig') {
        for (let i = 0; i < 4; i++) { M.hop = { t: 0 }; snd('land', 5 + i * 2); g.w3d.fx.puff(SEED.x + (Math.random() - 0.5) * 0.4, y + 0.1, SEED.z + (Math.random() - 0.5) * 0.4, 7, 0.22, '#8a6a4a'); await wait(0.32); }
        TIME.flag('past', 'seedDug', true); TIME.refresh();
      } else {
        M.hop = { t: 0 }; snd('pip'); await wait(0.4); g.w3d.fx.puff(SEED.x, y + 0.1, SEED.z, 6, 0.18, '#8a6a4a'); snd('land', 3); await wait(0.5);
        TIME.flag('past', 'seedPlanted', true); TIME.refresh();
        g.w3d.fx.sparkle(SEED.x, y + 0.6, SEED.z, 18, ['#9ff5a0', '#fff3a0']); snd('learned'); await wait(0.9);
      }
      sim.mimoGo(null, null);
    } finally { lock(false); }
  }
  async function seedAgain() { const H = pastWho('helper'); if (!H) return; lock(true); try { lookSeed(); await say(H, 'seed.again'); } finally { lock(false); } }
  // today and tomorrow: the tree; Bruno knows who planted it
  const carving = () => `${ATXT.CARVE[lang()] || 'N'} + ${mimoName() === 'Mimo' && isCl(lang()) ? (lang() === 'zh' ? '米莫' : 'ミモ') : mimoName()}`;
  async function brunoTree() {
    const g = G(), n = g.sim.npc('bruno'); if (!n) return;
    const p = { id: 'bruno', name: 'Bruno', x: n.x, y: n.y, z: n.z };
    lock(true);
    try { n.talking = true; await say(p, 'tree.bruno'); } finally { n.talking = false; lock(false); }
    if (!TIME.flag('now', 'treeTold')) { TIME.flag('now', 'treeTold', true); g.save(); }
  }

  // ------------------------------------------------------------ «The promise»: the Future (the future: a promise about tomorrow)
  async function promiseScene() {
    const M = futP('marta'), T = futP('tito'), N = futP('nico'); if (!M) return;
    lock(true);
    try {
      frame2(M); await wait(0.5);
      await say(M, 'fest.ask');
      if (T) { frame2(T, -1); await demo(T, 'fest.tito'); }
      if (N) { frame2(N, 1); await demo(N, 'fest.nico'); }
      frame2(M); await say(M, 'fest.you');
      TIME.flag('future', 'festAsked', true); G().save();
    } finally { lock(false); }
    await promiseTask();
  }
  async function promiseTask() {
    const r = await askPromise();
    if (!r) { STORY.think('Marta is still waiting to hear what you’ll do at the festival.', 4.5); return; }
    TIME.grade('promise', r.letter);
    const g = G(), M = futP('marta'), N0 = futP('noa');
    lock(true);
    try {
      if (M) { frame2(M); snd('learned'); g.w3d.fx.sparkle(M.x, (M.y || 0) + 1.4, M.z, 20, ['#ffd166', '#fff3a0', '#9ff5e8']); M.wave = 2.2; await say(M, 'fest.yes'); }
      TIME.flag('future', 'promised', true); TIME.refresh();
      const y = gy(-10, -155.6); shot(V(-10, y + 2.4, -147.8), V(-10, y + 3.0, -155.6), 1.0); await wait(1.2);
      g.w3d.fx.sparkle(-10, y + 3.3, -155.4, 26, ['#ffd166', '#e2453a', '#fff3a0']); snd('chime'); await wait(1.0);
      if (N0 && N0.show !== false) { frame2(N0); await say(N0, 'fest.noa'); }
      g.save();
    } finally { lock(false); }
    STORY.think('A promise made tomorrow… Has anything changed today?', 6);
  }
  async function festAgain() { const M = futP('marta'); if (!M) return; lock(true); try { frame2(M); await say(M, 'fest.again'); } finally { lock(false); } }
  async function martaBanner() {
    const g = G(), n = g.sim.npc('baker'); if (!n) return;
    const p = { id: 'baker', name: 'Marta', x: n.x, y: n.y, z: n.z };
    lock(true);
    try { n.talking = true; await say(p, 'banner.marta'); } finally { n.talking = false; lock(false); }
    if (!TIME.flag('now', 'bannerTold')) { TIME.flag('now', 'bannerTold', true); g.save(); }
  }
  function readBanner() {
    const l = lang(), N = ATXT.NAMES;
    if (typeof SIGNS !== 'undefined' && SIGNS.read) return SIGNS.read({ tag: 'A new banner over the plaza', lines: [{ text: plainT(N.banner[l] || ''), en: 'The Festival of Voices' }, { text: plainT(N.motto[l] || ''), en: 'Every voice counts' }, { text: plainT(N.again[l] || ''), en: N.again.en }] });
    STORY.think(`«${plainT(N.motto[l] || '')}»`, 4);
    return null;
  }

  // ------------------------------------------------------------ the effects: what one world's deeds change in the others
  TIME.effect('alba.tree', { region: 'alba', when: () => !!TIME.flag('past', 'seedPlanted'),
    show: { past: () => makeSprout(), now: () => makeTree('now'), future: () => makeTree('future') },
    act: { past: { x: SEED.x + 0.6, z: SEED.z + 0.2, r: 1.8, label: 'Look', run: async () => STORY.think(fillEn('{helper}’s seedling, by the yard. One day it will be a big {w.tree}.'), 4.5) },
      now: { x: SEED.x + 0.9, z: SEED.z + 0.3, r: 2.0, label: 'Look', run: async () => STORY.think(`A big old {w.tree} shades Bruno’s yard. Carved in its bark: «${carving()}».`, 5.5) },
      future: { x: SEED.x + 1.0, z: SEED.z + 0.3, r: 2.0, label: 'Look', run: async () => STORY.think(`The same {w.tree}, older and bigger. Bruno’s dummies lie flat… but the tree still stands. «${carving()}».`, 5.5) } } });
  TIME.effect('alba.hole', { region: 'alba', when: () => !!TIME.flag('past', 'seedDug') && !TIME.flag('past', 'seedPlanted'), show: { past: () => makeHole() } });
  TIME.effect('alba.banner', { region: 'alba', when: () => !!TIME.flag('future', 'promised'),
    show: { now: () => makeBanner('now'), future: () => makeBanner('future') },
    act: { now: { x: -10, z: -154.8, r: 2.4, label: 'Read', run: readBanner } } });
  // the seed's spot in the Past, once the helper has asked: tell Mimo there
  TIME.spot('alba.seed', { region: 'alba', world: 'past', x: SEED.x + 0.7, z: SEED.z + 0.4, r: 1.9, label: () => `Tell ${mimoName()}`,
    when: () => !!TIME.flag('past', 'seedAsked') && !TIME.flag('past', 'seedPlanted'), run: () => seedTasks() });

  // ------------------------------------------------------------ Talk menus: the helper (the Past), Marta (the Future, and today), Bruno (today)
  if (typeof STORY !== 'undefined' && STORY.talkHooks) STORY.talkHooks.push(it => {
    if (!it || !G() || !TIME.open('alba')) return null;
    const w = TIME.world(), f = (ww, k) => !!TIME.flag(ww, k);
    if (it.who === 'past:helper' && w === 'past') return f('past', 'seedPlanted') ? [{ label: 'The seedling', run: seedAgain }] : [{ label: 'The seed', sub: '◆ side quest', run: () => (f('past', 'seedAsked') ? seedTasks() : seedScene()) }];
    // (Chapter 4's Marta, alba_future.js: while she has a step of her own, that one shows instead: one festival entry at a time)
    if (it.who === 'future:marta' && w === 'future' && typeof ALBA_FUT !== 'undefined' && ALBA_FUT && ALBA_FUT.martaOffers) { try { if (ALBA_FUT.martaOffers().length) return null; } catch (e) { /* */ } }
    if (it.who === 'future:marta' && w === 'future') return f('future', 'promised') ? [{ label: 'The festival', run: festAgain }] : [{ label: 'The festival', sub: '◆ side quest', run: () => (f('future', 'festAsked') ? promiseTask() : promiseScene()) }];
    if (it.who === 'bruno' && w === 'now' && f('past', 'seedPlanted')) return [{ label: 'The big tree by the yard', sub: f('now', 'treeTold') ? '' : '◆ side quest', run: brunoTree }];
    if (it.who === 'baker' && w === 'now' && f('future', 'promised')) return [{ label: 'The new banner', sub: f('now', 'bannerTold') ? '' : '◆ side quest', run: martaBanner }];
    return null;
  });

  // ------------------------------------------------------------ the first time the cracks are open and you're near one: what they are
  let idle = 0;
  function tick(dt) {
    const g = G(); if (!g) return;
    FADE.uCamPos.value.copy(g.w3d.camera.position); FADE.uFocus.value.set(g.sim.you.x, (g.sim.you.ry || 0) + 1.0, g.sim.you.z);
    if (TIME.world() !== 'now' || TIME.seen('alba.cracks') || !TIME.open('alba')) return;
    if (STORY.busy || STORY.line || g.sim.lock || g.journalOpen || g.state.teaching || (g.indoors && g.indoors()) || document.body.classList.contains('in-battle') || document.body.classList.contains('on-title')) { idle = 0; return; }
    const Y = g.sim.you, c = ['alba.yard', 'alba.street', 'alba.pond'].map(id => TIME.CRACKS[id]).find(k => k && Math.hypot(k.x - Y.x, k.z - Y.z) < 16);
    if (!c) { idle = 0; return; }
    if ((idle += dt) < 1.2) return;
    idle = 0; TIME.seen('alba.cracks', true);
    STORY.run(() => intro(c));
  }
  async function crackCard() {
    const l = lang(), nm = w => { const t = TIME.RULES[w].name[l] || TIME.RULES[w].name.en; return isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : A.esc(t); };
    await UI.card(`<div class="tag">Time cracks</div><div class="big" style="font-size:24px">«${nm('past')}» · «${nm('now')}» · «${nm('future')}»</div>`
      + `<div class="sub" style="font-size:14px;line-height:1.45;max-width:440px;margin:8px auto 0;text-align:left">A shimmering tear in the air is a <b>time crack</b>. Step through it (E) to visit the same place in another time.<br>`
      + `• <b>The Past</b>: about 40 years ago. Everything there is told in the past: «${A.esc(plainT(fillMimo(ATXT.TASKS.dig.model[l] || '', l)))}».<br>`
      + `• <b>The Future</b>: what will happen if nobody speaks up. Everything there is told in tomorrow’s words.<br>`
      + `What you do in the Past changes today and tomorrow, and a promise made in the Future can change today. The mini-map shows every crack.</div><div class="sub">E</div>`);
  }
  async function intro(c) {
    const g = G(), Y = g.sim.you, M = g.sim.mimo, cy = gy(c.x, c.z);
    lock(true);
    try {
      M.tiltT = 1.6; snd('chime');
      const dx = Y.x - c.x, dz = Y.z - c.z, d = Math.hypot(dx, dz) || 1;
      shot(V(Y.x + dx / d * 2.4 + dz / d * 1.6, cy + 2.2, Y.z + dz / d * 2.4 - dx / d * 1.6), V(c.x, cy + 1.4, c.z), 1.1);
      await wait(1.2);
      await STORY.you('What’s that? A shimmer in the air… like the tear in the tower’s door.');
      g.w3d.fx.sparkle(c.x, cy + 1.5, c.z, 16, ['#ffe6a8', '#d8e4ff']);
      await crackCard();
      await STORY.you('Every place has a yesterday and a tomorrow… and now {mimo} and I can visit them.');
      g.save();
    } finally { lock(false); }
    STORY.think('Two new side quests are in the quest log: one in the Past, one in the Future.', 5);
  }

  return { SEED, CRACK, BANNER, stagePast, seedScene, seedTasks, promiseScene, promiseTask, brunoTree, martaBanner, intro, crackCard,
    _: { askPast, askPromise, makeTree, makeBanner, makeSprout, makeHole, mimoWorks, FADE, fillMimo, fillEn, say, demo, futP, pastP } };
})();

// ============================================================ the two side quests (QUESTS.LIST: they start when you find the cracks),
// and test hooks (TIME_ALBA._.t)
(() => {
  if (typeof TIME === 'undefined' || !TIME_ALBA || typeof QUESTS === 'undefined') return;
  const TA = TIME_ALBA, A = TIME.API, G = () => A.G, C = TA.CRACK;
  const wf = (s, w, k) => !!(s && s.worlds && s.worlds.flags && s.worlds.flags[w] && s.worlds.flags[w][k]);
  const found = s => !!(s && s.worlds && s.worlds.seen && s.worlds.seen['alba.cracks']);
  const fillEn = t => TA._.fillEn(t);
  const at = (o, hint) => (o ? { x: o.x, z: o.z, hint } : null);
  // where the compass points: someone in the world they're in, or the crack that leads there from where you are
  const via = (want, who) => {
    const w = TIME.world();
    if (w === want) return who();
    if (want === 'past') return w === 'future' ? at(C.pond, '{mimo} looks at the time crack by the duck pond.') : at(C.yard, '{mimo} looks at the time crack in Bruno’s yard.');
    if (want === 'future') return w === 'past' ? at(C.pond, '{mimo} looks at the time crack by the duck pond.') : at(C.street, '{mimo} looks at the time crack on the main street.');
    return w === 'past' ? at(C.yard, '{mimo} looks at the time crack in Bruno’s yard: today is through there.') : at(C.street, '{mimo} looks at the time crack on the main street: today is through there.');
  };
  const pastAt = id => () => { const P = TA._.pastP(id); return P && P.g.visible ? { x: P.api.x, z: P.api.z, hint: '{mimo} points at the bell ringer’s helper, by the yard.' } : null; };
  const futAt = id => () => { const p = TA._.futP(id); return p ? { x: p.x, z: p.z, hint: '{mimo} points at Marta, by the bell tower.' } : null; };
  const npcAt = (id, hint) => () => { const n = G() && G().sim.npc(id); return n ? { x: n.x, z: n.z, hint } : null; };
  if (!QUESTS.LIST.some(q => q.id === 'time.seed')) QUESTS.LIST.push({ id: 'time.seed', kind: 'side',
    get title() { return fillEn('{helper}’s seed'); }, get giver() { return fillEn('{helper}, the bell ringer’s helper, by Bruno’s yard (Alba, long ago)'); },
    started: s => found(s),
    steps: [
      { get text() { return fillEn('In the Past: talk to {helper} by Bruno’s yard'); },
        get why() { return fillEn('Step through the time crack in Bruno’s yard into the Past, about 40 years ago. The old bell ringer’s helper, {helper}, wants to plant something by the yard.'); },
        done: s => wf(s, 'past', 'seedAsked'), target: () => via('past', pastAt('helper')), hint: '{mimo} looks at the time crack in Bruno’s yard.' },
      { get text() { return fillEn('Help {helper} plant the seed: tell {mimo} as a memory ({n}/2)'); }, n: s => (wf(s, 'past', 'seedDug') ? 1 : 0) + (wf(s, 'past', 'seedPlanted') ? 1 : 0),
        get why() { const l = A.lang(), m = ATXT.TASKS.dig.model; return fillEn(`The ground is too hard for {helper}. In the Past, {mimo} only moves in memories: tell it what it did, «${A.plainT(TA._.fillMimo(m[l] || m.en, l))}».`); },
        done: s => wf(s, 'past', 'seedPlanted'), target: () => via('past', () => at({ x: TA.SEED.x + 0.7, z: TA.SEED.z + 0.4 }, '{mimo} sniffs the hard ground by the yard.')), hint: '{mimo} sniffs the hard ground by the yard.' },
      { text: 'Today: ask Bruno about the big tree by his yard',
        why: 'A seed planted about 40 years ago… Step back to today and see what grew by Bruno’s yard. Bruno might know who planted it.',
        done: s => wf(s, 'now', 'treeTold'), target: () => via('now', npcAt('bruno', '{mimo} points at Bruno, in his yard.')), hint: '{mimo} points toward Bruno’s yard.' },
    ] });
  if (!QUESTS.LIST.some(q => q.id === 'time.promise')) QUESTS.LIST.push({ id: 'time.promise', kind: 'side',
    title: 'A promise for the festival', giver: 'Marta, by the bell tower (Alba, tomorrow)',
    started: s => found(s),
    steps: [
      { text: 'In the Future: talk to Marta by the bell tower',
        why: 'Step through the time crack on the main street into the Future: Alba if nobody speaks up. Marta is planning the Festival of Voices again.',
        done: s => wf(s, 'future', 'festAsked'), target: () => via('future', futAt('marta')), hint: '{mimo} looks at the time crack on the main street.' },
      { text: 'Promise Marta what you’ll do at the festival',
        get why() { const l = A.lang(), m = ATXT.FEST.task.model; return `Tomorrow needs tomorrow’s words. A promise: «${A.plainT(m[l] || m.en)}».`; },
        done: s => wf(s, 'future', 'promised'), target: () => via('future', futAt('marta')), hint: '{mimo} points at Marta, by the bell tower.' },
      { text: 'Today: what changed in the plaza? Ask Marta at her bakery',
        why: 'A promise made tomorrow is a piece of tomorrow you bring home. Step back to today and look at the plaza.',
        done: s => wf(s, 'now', 'bannerTold'), target: () => via('now', npcAt('baker', '{mimo} points at Marta’s bakery.')), hint: '{mimo} points toward the plaza.' },
    ] });

  // ------------------------------------------------------------ test hooks (index.html?skip=1: the save goes to the test slot)
  // setup(o): the save just after Chapter 3 (o.seen: false leaves the cracks' first scene to come) · fast(on) · near(id): stand by a
  // crack ('yard', 'street', 'pond') or 'seed' / 'banner' · check(): every zh / ja string
  function setup(o = {}) {
    const g = G(), s = g.state, f = s.flags;
    ['hatched', 'rosa', 'guide', 'escort', 'escorted', 'boss', 'ch1', 'quest', 'tipQuests', 'tipSide', 'z_exit', 'z_guide', 'z_hushwave', 'z_gate', 'z_east', 'z_west', 'z_molinar', 'z_remanso', 'z_pass'].forEach(k => { f[k] = true; });
    Object.assign(f, { lessons: 3, bells: 8, oldDoor: true, oldBag: true, towerLost: true, pastIn: true, pastBell: true, pastApples: true, pastEcho: true, pastNames: true, pastElio: true,
      pastScene: true, pastBoss: true, pastReport: true, pastDone: true, futureOpen: true, futureDone: true, futureIn: false, timeTest: true });
    s.past = Object.assign(s.past || {}, { inside: false, bellSeen: true, applesSeen: true, apples: { awning: true, fountain: true, cart: true }, namesSeen: true, names1: true, names2: true, elioSeen: true,
      remember: true, scene: { s1: true, s2: true, s3: true }, gate: true, concertFought: true });
    s.future = { arrived: true, demo: true, woke: { nico: 'S', rosa: 'S', tito: 'S', marta: 'S', bruno: 'S' }, cards: { future: true }, rep: true, yard: true, cond: true, door: true, out: true, trap: 'S', boss: true, ringDemo: true, rang: true, end: true, k: 1 };
    if (o.seen !== false) TIME.seen('alba.cracks', true);
    // (tests only: the main quest's earlier steps count as done, so its tracker says Chapter 4)
    const main = QUESTS.LIST.find(q => q.id === 'main');
    if (main) main.steps.forEach(st => { if (!st._tt) { const d0 = st.done; st._tt = true; st.done = x => (!/coming soon/i.test(String(st.text || '')) && !!(x.flags && x.flags.timeTest)) || d0(x); } });
    fast(true); TIME.refresh();
    return TIME.world();
  }
  function fast(on = true) { TIME._.fast.on = !!on; if (typeof PAST !== 'undefined' && PAST._) PAST._.W.fastVeil = !!on; }
  function near(id) {
    const p = id === 'seed' ? { x: TA.SEED.x + 1.6, z: TA.SEED.z + 0.9 } : id === 'banner' ? { x: -10, z: -152.6 } : C[id] ? { x: C[id].x + 1.3, z: C[id].z + 1.0 } : null;
    if (!p) return null;
    const g = G(), Y = g.sim.you; Y.x = p.x; Y.z = p.z; g.sim.snap(); g.cam.snap(Y.yaw, 0.28, 8.5);
    return p;
  }
  TA._.t = { setup, fast, near, check: () => ATXT.check() };
})();
