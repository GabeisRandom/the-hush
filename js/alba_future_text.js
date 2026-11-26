'use strict';
// Alba tomorrow (Round T1b, DESIGN.md 18.6; game/TIME.md): every word of Chapter 4's Future part in Alba, in es / pt / de / zh / ja
// (zh / ja in CJK.md's notation) and the English the weave mixes from, plus the graders for tomorrow's A2 rung: the simple future
// and «ir a» (plans, promises, predictions; 1st, 2nd and 3rd person), «me gustaría» (wishes) and «si» + present → future (traps).
//   AFTXT.LINES[key]  a mixed line: L(en, es, pt, de, zh, ja)           (STORY.sayInline: the weave mixes it, EN on request)
//   AFTXT.DEMO[key]   a demonstration (STORY.demoLine: whole in the language, the shown words glossed: AFTXT.MARKS[key])
//   AFTXT.HUSH[key]   what the Hush left of a line (*starred* words), for STORY.sayHushed
//   AFTXT.TASKS[key]  a graded task: title, frame (___ the blank), chips ([word, English]), model, grade: { kind, … }
//   AFTXT.CHAT[id]    each person's rotating lines · AFTXT.SIGNS[key] readable signs · AFTXT.FIGHT[key] the boss fight's bubbles
//   AFTXT.WORDS       the words of tomorrow (the teaching table) · AFTXT.ECHO Elio's line · AFTXT.grade(key, text, lang)
//   AFTXT.check()     every zh / ja string against CJK.validate: [] when all's well
// Nobody ever genders the player: es / pt / de lines to you are neutral («¿Vamos?», never «¿Listos?»).
const AFTXT = (() => {
  const L = (en, es, pt, de, zh, ja, o) => Object.assign({ en, es, pt, de, zh, ja }, o || {});
  const isC = l => l === 'zh' || l === 'ja';

  // ------------------------------------------------------------ names: tomorrow's people and places (each language its own)
  const NAMES = {
    beto: L('Beto', 'Beto', 'Beto', 'Beto', '[贝托|Bèi tuō]', 'ベト'),
    sofi: L('Sofi', 'Sofi', 'Sofi', 'Sofi', '[索菲|Suǒ fēi]', 'ソフィ'),
    luci: L('Luci', 'Luci', 'Luci', 'Luci', '[露西|Lù xī]', 'ルシ'),
    sami: L('Sami', 'Sami', 'Sami', 'Sami', '[萨米|Sà mǐ]', 'サミ'),
    nilo: L('Nilo', 'Nilo', 'Nilo', 'Nilo', '[尼洛|Ní luò]', 'ニロ'),
    tadeo: L('Tadeo', 'Tadeo', 'Tadeu', 'Tadeo', '[塔德奥|Tǎ dé ào]', 'タデオ'),
    cat: L('Migas', 'Migas', 'Farelo', 'Krümel', '[小麦|Xiǎo mài]', 'コムギ', { en_pt: 'Farelo', en_de: 'Krümel', en_zh: 'Xiaomai', en_ja: 'Komugi' }),
    noa: L('Noa', 'Noa', 'Noa', 'Noa', '[诺娅|Nuò yà]', 'ノア'),
    theater: L('the old theater', 'el viejo teatro', 'o velho teatro', 'das alte Theater', '[老|lǎo] [剧院|jù yuàn]', '[古|ふる]い [劇場|げきじょう]'),
    gallery: L('the Laughing Gallery', 'la Galería que se ríe', 'a Galeria que Ri', 'die Lachende Galerie', '[大笑|dà xiào] [的|de] [看台|kàn tái]', '[笑|わら]う [客席|きゃくせき]'),
    foyer: L('the foyer', 'el vestíbulo', 'o saguão', 'das Foyer', '[门厅|mén tīng]', 'ロビー'),
    balc: L('the balconies', 'los palcos', 'os camarotes', 'die Logen', '[包厢|bāo xiāng]', 'ボックス[席|せき]'),
    loft: L('the fly loft', 'el telar', 'o urdimento', 'der Schnürboden', '[舞台|wǔ tái] [上方|shàng fāng]', 'すのこ'),
    stage: L('the stage', 'el escenario', 'o palco', 'die Bühne', '[舞台|wǔ tái]', '[舞台|ぶたい]'),
    bakery: L('the bakery', 'la panadería', 'a padaria', 'die Bäckerei', '[面包店|miàn bāo diàn]', 'パン[屋|や]'),
    library: L('the new library', 'la biblioteca nueva', 'a biblioteca nova', 'die neue Bibliothek', '[新|xīn] [图书馆|tú shū guǎn]', '[新|あたら]しい [図書館|としょかん]'),
    tram: L('Solar tram', 'Tranvía solar', 'Bonde solar', 'Solarbahn', '[太阳能|tài yáng néng] [电车|diàn chē]', 'ソーラー [電車|でんしゃ]'),
  };

  // ------------------------------------------------------------ mixed lines
  // Noa (inside the great clock: her voice through the duck pond's crack) talks to you as a friend: tú / você / du / 你 / casual
  // ja. Marta, Tadeo, Beto, Nilo and Luci are grown-ups: polite in ja. Sami and the kids of today are casual.
  const LINES = {
    // step 1: Noa, through the three-way crack
    // (it follows right on from the report to Noa at the end of the Past's steps, at the same crack: so no "Can you hear me?")
    'n.f1': L('One more thing… The boy’s words are free. I heard them from here, inside the great clock.',
      'Una cosa más… Las palabras del niño están libres. Las oí desde aquí, dentro del gran reloj.',
      'Mais uma coisa… As palavras do menino estão livres. Eu ouvi daqui, de dentro do grande relógio.',
      'Noch etwas … Die Worte des Jungen sind frei. Ich habe sie von hier gehört, aus der großen Uhr.',
      '[还有|hái yǒu] [一件|yī jiàn] [事|shì] … [那个|nà ge] [男孩|nán hái] [的|de] [话|huà] [自由|zì yóu] [了|le] 。 [我|wǒ] [在|zài] [大钟|dà zhōng] [里|lǐ] [听到|tīng dào] [了|le] 。',
      'もう ひとつ … あの [子|こ] の [言葉|ことば] は [自由|じゆう] に なった 。 [大|おお]きな [時計|とけい] の [中|なか] から [聞|き]こえた よ 。'),
    'n.f2': L('Now listen. Tomorrow is healed… almost. One place stayed gray: the old theater, where the Hush was born.',
      'Ahora escucha. El mañana está curado… casi. Un lugar se quedó gris: el viejo teatro, donde nació el Silencio.',
      'Agora escuta. O amanhã está curado… quase. Um lugar ficou cinza: o velho teatro, onde o Silêncio nasceu.',
      'Jetzt hör zu. Das Morgen ist geheilt… fast. Ein Ort ist grau geblieben: das alte Theater, wo die Stille geboren wurde.',
      '[现在|xiàn zài] [听|tīng] [我|wǒ] [说|shuō] 。 [明天|míng tiān] [好|hǎo] [了|le] … [差不多|chà bu duō] 。 [只有|zhǐ yǒu] [一个|yī gè] [地方|dì fang] [还是|hái shi] [灰色|huī sè] [的|de] ： [老|lǎo] [剧院|jù yuàn] ， [寂静|Jì jìng] [出生|chū shēng] [的|de] [地方|dì fang] 。',
      'よく [聞|き]いて 。 [明日|あした] は [治|なお]った … ほとんど ね 。 [一|ひと]つ だけ 、 [灰色|はいいろ] の まま の [場所|ばしょ] が ある 。 [古|ふる]い [劇場|げきじょう] 。 [静寂|せいじゃく] が [生|う]まれた [場所|ばしょ] だ よ 。'),
    'n.f3': L('His last words are still in there, in tomorrow’s theater: the end of the speech he never finished.',
      'Sus últimas palabras siguen ahí dentro, en el teatro del mañana: el final del discurso que nunca terminó.',
      'As últimas palavras dele ainda estão lá dentro, no teatro do amanhã: o fim do discurso que ele nunca terminou.',
      'Seine letzten Worte sind noch da drin, im Theater von morgen: das Ende der Rede, die er nie beendet hat.',
      '[他|tā] [最后|zuì hòu] [的|de] [话|huà] [还|hái] [在|zài] [里面|lǐ miàn] ， [在|zài] [明天|míng tiān] [的|de] [剧院|jù yuàn] [里|lǐ] ： [是|shì] [他|tā] [没|méi] [说完|shuō wán] [的|de] [那|nà] [段|duàn] [话|huà] [的|de] [结尾|jié wěi] 。',
      'あの [人|ひと] の [最後|さいご] の [言葉|ことば] は 、 まだ [中|なか] に ある 。 [明日|あした] の [劇場|げきじょう] に 。 [最後|さいご] まで [言|い]えなかった スピーチ の 、 [終|お]わり の [言葉|ことば] だ よ 。'),
    'n.f4': L('Go through to tomorrow and find Marta: she’s planning the Festival of Voices. Then bring his words back to me, here.',
      'Cruza al mañana y busca a Marta: está preparando la Fiesta de las Voces. Luego tráeme sus palabras, aquí.',
      'Atravessa pro amanhã e procura a Marta: ela está preparando a Festa das Vozes. Depois me traz as palavras dele, aqui.',
      'Geh hinüber ins Morgen und such Marta: Sie bereitet das Fest der Stimmen vor. Dann bring mir seine Worte zurück, hierher.',
      '[穿过|chuān guò] [裂缝|liè fèng] [去|qù] [明天|míng tiān] ， [找|zhǎo] [玛尔塔|Mǎ ěr tǎ] ： [她|tā] [在|zài] [准备|zhǔn bèi] [声音节|Shēng yīn jié] 。 [然后|rán hòu] [把|bǎ] [他|tā] [的|de] [话|huà] [带回|dài huí] [这里|zhè lǐ] [给|gěi] [我|wǒ] 。',
      '[明日|あした] へ [行|い]って 、 マルタ さん を [探|さが]して 。 「 [声|こえ] の [祭|まつ]り 」 の [準備|じゅんび] を して いる の 。 それ から 、 あの [人|ひと] の [言葉|ことば] を ここ に [持|も]って [帰|かえ]って ね 。'),
    // step 2: Marta, by the bell tower
    'm.t1': L('You came back! I haven’t forgotten your promise. The Festival of Voices will happen… but where?',
      '¡Volviste! No he olvidado tu promesa. La Fiesta de las Voces se hará… pero ¿dónde?',
      'Você voltou! Eu não esqueci a sua promessa. A Festa das Vozes vai acontecer… mas onde?',
      'Du bist zurück! Ich habe dein Versprechen nicht vergessen. Das Fest der Stimmen wird stattfinden… aber wo?',
      '[你|nǐ] [回来|huí lai] [了|le] ！ [我|wǒ] [没|méi] [忘|wàng] [你|nǐ] [的|de] [承诺|chéng nuò] 。 [声音节|Shēng yīn jié] [会|huì] [办|bàn] [的|de] … [可是|kě shì] [在|zài] [哪里|nǎ lǐ] [办|bàn] [呢|ne] ？',
      '[戻|もど]って きて くれた ん です ね ！ [約束|やくそく] 、 [忘|わす]れて いません よ 。 「 [声|こえ] の [祭|まつ]り 」 は [開|ひら]きます … でも 、 どこ で ？'),
    'm.t2': L('I want to hold it in the old theater. That’s where the last festival ended, about forty years ago… with laughter.',
      'Quiero hacerla en el viejo teatro. Allí terminó la última fiesta, hace unos cuarenta años… con risas.',
      'Eu quero fazer no velho teatro. Foi lá que a última festa acabou, uns quarenta anos atrás… com risadas.',
      'Ich will es im alten Theater feiern. Dort hat das letzte Fest geendet, vor etwa vierzig Jahren… mit Gelächter.',
      '[我|wǒ] [想|xiǎng] [在|zài] [老|lǎo] [剧院|jù yuàn] [办|bàn] 。 [大约|dà yuē] [四十|sì shí] [年|nián] [前|qián] ， [最后|zuì hòu] [一|yī] [次|cì] [节日|jié rì] [就是|jiù shì] [在|zài] [那里|nà lǐ] [结束|jié shù] [的|de] … [在|zài] [一片|yī piàn] [笑声|xiào shēng] [中|zhōng] 。',
      '[古|ふる]い [劇場|げきじょう] で [開|ひら]きたい ん です 。 [四十年|よんじゅうねん] ぐらい [前|まえ] 、 [最後|さいご] の お[祭|まつ]り は あそこ で [終|お]わった ん です … [笑|わら]い[声|ごえ] の [中|なか] で 。'),
    'm.t3': L('They say its doors are sealed with gray. Tadeo the carpenter is up there trying to open them. But first: a plan!',
      'Dicen que sus puertas están selladas con gris. Tadeo, el carpintero, está allí intentando abrirlas. Pero primero: ¡un plan!',
      'Dizem que as portas estão seladas de cinza. O Tadeu, o carpinteiro, está lá tentando abrir. Mas primeiro: um plano!',
      'Man sagt, seine Türen sind mit Grau versiegelt. Tadeo, der Tischler, versucht dort oben, sie zu öffnen. Aber zuerst: ein Plan!',
      '[听说|tīng shuō] [剧院|jù yuàn] [的|de] [门|mén] [被|bèi] [灰色|huī sè] [封住|fēng zhù] [了|le] 。 [木匠|mù jiang] [塔德奥|Tǎ dé ào] [正在|zhèng zài] [那里|nà lǐ] [想办法|xiǎng bàn fǎ] [打开|dǎ kāi] 。 [不过|bù guò] [先|xiān] [要|yào] [有|yǒu] [一个|yī gè] [计划|jì huà] ！',
      '[扉|とびら] が [灰色|はいいろ] で ふさがれて いる そう です 。 [大工|だいく] の タデオ さん が [開|あ]けよう と して います 。 でも 、 まず は [計画|けいかく] です ！'),
    'm.t4': L('Ask Tito, Sofi and Beto what they’ll do at the festival, and write it in my notebook. Tito is right here; Sofi is painting by the duck pond; Beto drives the tram on the main street.',
      'Pregúntales a Tito, Sofi y Beto qué harán en la fiesta, y escríbelo en mi cuaderno. Tito está aquí; Sofi pinta junto al estanque de los patos; Beto conduce el tranvía en la calle mayor.',
      'Pergunta pro Tito, pra Sofi e pro Beto o que eles vão fazer na festa, e escreve no meu caderno. O Tito está aqui; a Sofi está pintando perto do lago dos patos; o Beto dirige o bonde na rua principal.',
      'Frag Tito, Sofi und Beto, was sie auf dem Fest machen werden, und schreib es in mein Heft. Tito ist gleich hier; Sofi malt am Ententeich; Beto fährt die Straßenbahn auf der Hauptstraße.',
      '[去|qù] [问问|wèn wen] [蒂托|Dì tuō] 、 [索菲|Suǒ fēi] [和|hé] [贝托|Bèi tuō] [在|zài] [节日|jié rì] [上|shàng] [会|huì] [做|zuò] [什么|shén me] ， [写|xiě] [在|zài] [我|wǒ] [的|de] [本子|běn zi] [上|shàng] 。 [蒂托|Dì tuō] [就|jiù] [在|zài] [这里|zhè lǐ] ； [索菲|Suǒ fēi] [在|zài] [鸭子|yā zi] [池塘|chí táng] [边|biān] [画画|huà huà] ； [贝托|Bèi tuō] [在|zài] [大街|dà jiē] [上|shàng] [开|kāi] [电车|diàn chē] 。',
      'ティト さん 、 ソフィ さん 、 ベト さん に 、 お[祭|まつ]り で [何|なに] を する つもり か [聞|き]いて 、 わたし の ノート に [書|か]いて ください 。 ティト さん は ここ に います 。 ソフィ さん は アヒル の [池|いけ] の そば で [絵|え] を [描|か]いて います 。 ベト さん は [大通|おおどお]り で [電車|でんしゃ] を [運転|うんてん] して います 。'),
    'm.plan': L('Music, posters and a tram for everyone! Now all that’s missing is the theater. Go and help Tadeo in the Old Quarter, through the north gate.',
      '¡Música, carteles y un tranvía para todos! Ahora solo falta el teatro. Ve a ayudar a Tadeo en el Barrio Viejo, por la puerta norte.',
      'Música, cartazes e um bonde pra todo mundo! Agora só falta o teatro. Vai ajudar o Tadeu no Bairro Velho, pelo portão norte.',
      'Musik, Plakate und eine Straßenbahn für alle! Jetzt fehlt nur noch das Theater. Geh und hilf Tadeo im Alten Viertel, durch das Nordtor.',
      '[音乐|yīn yuè] 、 [海报|hǎi bào] ， [还有|hái yǒu] [送|sòng] [大家|dà jiā] [的|de] [电车|diàn chē] ！ [现在|xiàn zài] [只|zhǐ] [差|chà] [剧院|jù yuàn] [了|le] 。 [从|cóng] [北门|běi mén] [出去|chū qu] ， [到|dào] [老城区|lǎo chéng qū] [帮|bāng] [塔德奥|Tǎ dé ào] [吧|ba] 。',
      '[音楽|おんがく] 、 ポスター 、 みんな の [電車|でんしゃ] ！ あと は [劇場|げきじょう] だけ です 。 [北門|きたもん] から [旧市街|きゅうしがい] へ [行|い]って 、 タデオ さん を [手伝|てつだ]って ください 。'),
    'm.later': L('My notebook is filling up! Tito, Sofi, Beto… everyone has a plan for tomorrow.',
      '¡Mi cuaderno se está llenando! Tito, Sofi, Beto… todos tienen un plan para mañana.',
      'O meu caderno está ficando cheio! Tito, Sofi, Beto… todo mundo tem um plano pra amanhã.',
      'Mein Heft wird voll! Tito, Sofi, Beto… alle haben einen Plan für morgen.',
      '[我|wǒ] [的|de] [本子|běn zi] [快|kuài] [写满|xiě mǎn] [了|le] ！ [蒂托|Dì tuō] 、 [索菲|Suǒ fēi] 、 [贝托|Bèi tuō] … [大家|dà jiā] [都|dōu] [有|yǒu] [明天|míng tiān] [的|de] [计划|jì huà] 。',
      'ノート が いっぱい に なって きました ！ ティト さん 、 ソフィ さん 、 ベト さん … みんな [明日|あした] の [計画|けいかく] が あります 。'),
    // step 4: Tadeo, at the sealed doors
    't.t1': L('Hello! Are you here for the theater? Marta told me about you. Look at these doors: gray as felt… and cold.',
      '¡Hola! ¿Vienes por el teatro? Marta me habló de ti. Mira estas puertas: grises como el fieltro… y frías.',
      'Olá! Você veio por causa do teatro? A Marta me falou de você. Olha estas portas: cinzentas como feltro… e frias.',
      'Hallo! Kommst du wegen des Theaters? Marta hat mir von dir erzählt. Schau dir diese Türen an: grau wie Filz… und kalt.',
      '[你好|nǐ hǎo] ！ [你|nǐ] [是|shì] [为了|wèi le] [剧院|jù yuàn] [来|lái] [的|de] [吧|ba] ？ [玛尔塔|Mǎ ěr tǎ] [跟|gēn] [我|wǒ] [说|shuō] [过|guo] [你|nǐ] 。 [你|nǐ] [看|kàn] [这|zhè] [两|liǎng] [扇|shàn] [门|mén] ： [灰|huī] [得|de] [像|xiàng] [毛毡|máo zhān] … [还|hái] [冰冰|bīng bīng] [的|de] 。',
      'こんにちは ！ [劇場|げきじょう] の こと で [来|き]た ん です か ？ マルタ さん から [聞|き]いて います 。 この [扉|とびら] を [見|み]て ください 。 フェルト みたい に [灰色|はいいろ] で … [冷|つめ]たい 。'),
    't.t2': L('I’ve tried my hammer, my saw, my crowbar. Nothing. Listen… it whispers.',
      'Probé el martillo, la sierra, la palanca. Nada. Escucha… susurra.',
      'Eu tentei o martelo, o serrote, o pé de cabra. Nada. Escuta… está sussurrando.',
      'Ich habe Hammer, Säge und Brecheisen probiert. Nichts. Hör mal… es flüstert.',
      '[锤子|chuí zi] 、 [锯子|jù zi] 、 [撬棍|qiào gùn] ， [我|wǒ] [都|dōu] [试|shì] [过|guo] [了|le] 。 [没用|méi yòng] 。 [你|nǐ] [听|tīng] … [它|tā] [在|zài] [小声|xiǎo shēng] [说话|shuō huà] 。',
      'ハンマー も 、 のこぎり も 、 バール も [試|ため]しました 。 だめ でした 。 [聞|き]いて … ささやいて います 。'),
    't.half': L('Look! One corner is melting. Keep going!', '¡Mira! Una esquina se está derritiendo. ¡Sigue!', 'Olha! Um canto está derretendo. Continua!', 'Schau! Eine Ecke schmilzt. Weiter so!',
      '[你|nǐ] [看|kàn] ！ [一个|yī gè] [角|jiǎo] [在|zài] [融化|róng huà] 。 [继续|jì xù] ！', '[見|み]て ！ [角|かど] が [溶|と]けて きた 。 その [調子|ちょうし] ！'),
    't.open': L('It’s cracking… they’re open! I’ll come in with you: I’ve studied the theater’s old plans. I know every rope and board in there.',
      'Se está rompiendo… ¡están abiertas! Entraré contigo: estudié los planos viejos del teatro. Conozco cada cuerda y cada tabla de ahí dentro.',
      'Está rachando… abriram! Eu vou entrar com você: eu estudei as plantas antigas do teatro. Conheço cada corda e cada tábua lá dentro.',
      'Es bricht… sie sind offen! Ich komme mit dir rein: Ich habe die alten Pläne vom Theater studiert. Ich kenne da drin jedes Seil und jedes Brett.',
      '[裂开|liè kāi] [了|le] … [门|mén] [开|kāi] [了|le] ！ [我|wǒ] [跟|gēn] [你|nǐ] [一起|yī qǐ] [进去|jìn qu] ： [我|wǒ] [研究|yán jiū] [过|guo] [剧院|jù yuàn] [的|de] [旧|jiù] [图纸|tú zhǐ] ， [里面|lǐ miàn] [的|de] [每|měi] [根|gēn] [绳子|shéng zi] 、 [每|měi] [块|kuài] [木板|mù bǎn] [我|wǒ] [都|dōu] [知道|zhī dào] 。',
      '[割|わ]れて いく … [開|あ]いた ！ いっしょ に [入|はい]ります よ 。 [劇場|げきじょう] の [古|ふる]い [図面|ずめん] を [勉強|べんきょう] した ので 、 [中|なか] の ロープ も [板|いた] も 、 ぜんぶ [知|し]って います 。'),
    't.wait': L('Talk to Marta first: the festival needs a plan before it needs a theater!',
      'Habla primero con Marta: ¡la fiesta necesita un plan antes que un teatro!',
      'Fala primeiro com a Marta: a festa precisa de um plano antes de um teatro!',
      'Sprich zuerst mit Marta: Das Fest braucht einen Plan, bevor es ein Theater braucht!',
      '[先|xiān] [去|qù] [跟|gēn] [玛尔塔|Mǎ ěr tǎ] [说|shuō] [吧|ba] ： [节日|jié rì] [先|xiān] [要|yào] [有|yǒu] [计划|jì huà] ， [再|zài] [要|yào] [剧院|jù yuàn] ！',
      'まず は マルタ さん と [話|はな]して ください 。 お[祭|まつ]り に は 、 [劇場|げきじょう] より [先|さき] に [計画|けいかく] が [必要|ひつよう] です ！'),
    // the theater tomorrow: Tadeo, room by room
    'h.foyer1': L('The foyer. See the masks over the stairs? Every time we get close, they laugh us back down.',
      'El vestíbulo. ¿Ves las máscaras sobre la escalera? Cada vez que nos acercamos, se ríen y nos echan para atrás.',
      'O saguão. Está vendo as máscaras em cima da escada? Toda vez que a gente chega perto, elas riem e empurram a gente pra trás.',
      'Das Foyer. Siehst du die Masken über der Treppe? Jedes Mal, wenn wir näher kommen, lachen sie uns zurück.',
      '[这|zhè] [是|shì] [门厅|mén tīng] 。 [看到|kàn dào] [楼梯|lóu tī] [上面|shàng miàn] [的|de] [面具|miàn jù] [了|le] [吗|ma] ？ [我们|wǒ men] [一|yī] [靠近|kào jìn] ， [它们|tā men] [就|jiù] [笑|xiào] ， [把|bǎ] [我们|wǒ men] [笑|xiào] [回去|huí qu] 。',
      'ロビー です 。 [階段|かいだん] の [上|うえ] の [仮面|かめん] 、 [見|み]えます か ？ [近|ちか]づく たび に 、 [笑|わら]って [押|お]し[戻|もど]して きます 。'),
    'h.foyer2': L('And the fallen chandelier blocks the way up. Heavy… but {mimo} is strong.',
      'Y la lámpara caída tapa la subida. Pesa mucho… pero {mimo} es fuerte.',
      'E o lustre caído bloqueia a subida. É pesado… mas o {mimo} é forte.',
      'Und der umgestürzte Leuchter versperrt den Weg nach oben. Schwer… aber {mimo} ist stark.',
      '[掉下来|diào xià lai] [的|de] [吊灯|diào dēng] [挡住|dǎng zhù] [了|le] [上楼|shàng lóu] [的|de] [路|lù] 。 [很|hěn] [重|zhòng] … [可是|kě shì] {mimo} [很|hěn] [有|yǒu] [力气|lì qi] 。',
      'それ に 、 [落|お]ちた シャンデリア が [上|うえ] へ の [道|みち] を ふさいで います 。 [重|おも]い … でも {mimo} は [力持|ちからも]ち です 。'),
    'h.foyer3': L('The stairs are free! Up to the balconies.', '¡La escalera está libre! Arriba, a los palcos.', 'A escada está livre! Pra cima, pros camarotes.', 'Die Treppe ist frei! Hinauf zu den Logen.',
      '[楼梯|lóu tī] [通|tōng] [了|le] ！ [上|shàng] [包厢|bāo xiāng] [去|qù] 。', '[階段|かいだん] が [通|とお]れる ！ ボックス[席|せき] へ [上|あ]がりましょう 。'),
    'h.balc1': L('The balconies: three boxes, a mask in each. Before a mask laughs, it moves… up, or down.',
      'Los palcos: tres palcos, una máscara en cada uno. Antes de reírse, la máscara se mueve… arriba o abajo.',
      'Os camarotes: três camarotes, uma máscara em cada um. Antes de rir, a máscara se mexe… pra cima ou pra baixo.',
      'Die Logen: drei Logen, in jeder eine Maske. Bevor eine Maske lacht, bewegt sie sich… nach oben oder nach unten.',
      '[这|zhè] [是|shì] [包厢|bāo xiāng] ： [三|sān] [个|gè] [包厢|bāo xiāng] ， [每|měi] [个|gè] [里面|lǐ miàn] [有|yǒu] [一个|yī gè] [面具|miàn jù] 。 [面具|miàn jù] [笑|xiào] [之前|zhī qián] [会|huì] [动|dòng] … [往|wǎng] [上|shàng] ， [或者|huò zhě] [往|wǎng] [下|xià] 。',
      'ボックス[席|せき] です 。 [三|みっ]つ の ボックス に 、 [仮面|かめん] が [一|ひと]つ ずつ 。 [笑|わら]う [前|まえ] に 、 [仮面|かめん] は [動|うご]きます … [上|うえ] か [下|した] に 。'),
    'h.balc2': L('All three are quiet! The rope ladder up to the fly loft is free.', '¡Las tres están calladas! La escalera de cuerda hacia el telar está libre.', 'As três estão quietas! A escada de corda pro urdimento está livre.', 'Alle drei sind still! Die Strickleiter zum Schnürboden ist frei.',
      '[三个|sān gè] [面具|miàn jù] [都|dōu] [安静|ān jìng] [了|le] ！ [去|qù] [舞台|wǔ tái] [上方|shàng fāng] [的|de] [绳梯|shéng tī] [可以|kě yǐ] [爬|pá] [了|le] 。', '[三|みっ]つ とも [静|しず]か に なった ！ すのこ へ の なわばしご が [使|つか]えます 。'),
    'h.loft1': L('The fly loft: ropes, sandbags, the curtain’s rigging. If I pull this lever, the sandbag will drop and the curtain will go up… and the masks up there will swoop down on us.',
      'El telar: cuerdas, sacos de arena, los aparejos del telón. Si tiro de esta palanca, el saco caerá y el telón subirá… y las máscaras de arriba bajarán sobre nosotros.',
      'O urdimento: cordas, sacos de areia, o mecanismo da cortina. Se eu puxar esta alavanca, o saco vai cair e a cortina vai subir… e as máscaras lá de cima vão descer em cima da gente.',
      'Der Schnürboden: Seile, Sandsäcke, die Technik vom Vorhang. Wenn ich diesen Hebel ziehe, wird der Sack fallen und der Vorhang hochgehen… und die Masken da oben werden auf uns herunterkommen.',
      '[这|zhè] [是|shì] [舞台|wǔ tái] [上方|shàng fāng] ： [绳子|shéng zi] 、 [沙袋|shā dài] 、 [幕布|mù bù] [的|de] [机关|jī guān] 。 [如果|rú guǒ] [我|wǒ] [拉|lā] [这个|zhè ge] [拉杆|lā gān] ， [沙袋|shā dài] [就|jiù] [会|huì] [掉|diào] [下去|xià qu] ， [幕布|mù bù] [就|jiù] [会|huì] [升|shēng] [起来|qǐ lai] … [上面|shàng miàn] [的|de] [面具|miàn jù] [也|yě] [会|huì] [扑|pū] [下来|xià lai] 。',
      'すのこ です 。 ロープ 、 [砂袋|すなぶくろ] 、 [幕|まく] の [仕掛|しか]け 。 この レバー を [引|ひ]いたら 、 [砂袋|すなぶくろ] が [落|お]ちて 、 [幕|まく] が [上|あ]がります … そして 、 [上|うえ] の [仮面|かめん] が [飛|と]び[降|お]りて くる でしょう 。'),
    'h.loft2': L('Good! But look: the big sandbag is swinging back… it’ll hit the rigging! One more trap.',
      '¡Bien! Pero mira: el saco grande vuelve balanceándose… ¡golpeará los aparejos! Otra trampa.',
      'Boa! Mas olha: o saco grande está voltando… vai bater no mecanismo! Mais uma armadilha.',
      'Gut! Aber schau: Der große Sandsack schwingt zurück… er wird die Technik treffen! Noch eine Falle.',
      '[好|hǎo] ！ [可是|kě shì] [你|nǐ] [看|kàn] ： [大|dà] [沙袋|shā dài] [荡|dàng] [回来|huí lai] [了|le] … [它|tā] [会|huì] [撞|zhuàng] [坏|huài] [机关|jī guān] ！ [再|zài] [设|shè] [一个|yī gè] [陷阱|xiàn jǐng] 。',
      'いい ぞ ！ でも [見|み]て 、 [大|おお]きな [砂袋|すなぶくろ] が [戻|もど]って くる … [仕掛|しか]け に ぶつかる でしょう ！ もう [一|ひと]つ わな を 。'),
    'h.loft3': L('The curtain is up, and the way down to the stage is open. Shall we?', 'El telón está arriba, y el camino al escenario está abierto. ¿Vamos?', 'A cortina subiu, e o caminho pro palco está aberto. Vamos?', 'Der Vorhang ist oben, und der Weg hinunter zur Bühne ist frei. Gehen wir?',
      '[幕布|mù bù] [升|shēng] [起来|qǐ lai] [了|le] ， [去|qù] [舞台|wǔ tái] [的|de] [路|lù] [也|yě] [通|tōng] [了|le] 。 [走|zǒu] [吧|ba] ？', '[幕|まく] が [上|あ]がりました 。 [舞台|ぶたい] へ の [道|みち] も [開|ひら]きました 。 [行|い]きましょう か ？'),
    'h.stage1': L('The stage… and out there, the seats. Rows and rows of gray seats, and on every one, a laughing mask.',
      'El escenario… y allí, las butacas. Filas y filas de butacas grises, y en cada una, una máscara que se ríe.',
      'O palco… e lá, as poltronas. Fileiras e fileiras de poltronas cinzentas, e em cada uma, uma máscara rindo.',
      'Die Bühne… und da draußen die Sitze. Reihen über Reihen grauer Sitze, und auf jedem eine lachende Maske.',
      '[舞台|wǔ tái] … [那边|nà biān] [是|shì] [座位|zuò wèi] 。 [一排|yī pái] [又|yòu] [一排|yī pái] [灰色|huī sè] [的|de] [座位|zuò wèi] ， [每个|měi gè] [座位|zuò wèi] [上|shàng] [都|dōu] [有|yǒu] [一个|yī gè] [在|zài] [笑|xiào] [的|de] [面具|miàn jù] 。',
      '[舞台|ぶたい] … そして 、 [向|む]こう に は [客席|きゃくせき] 。 [灰色|はいいろ] の [席|せき] が [何列|なんれつ] も [並|なら]んで いて 、 どの [席|せき] に も [笑|わら]う [仮面|かめん] が ある 。'),
    'h.stage2': L('That’s it: the fear of being laughed at, grown huge. The Laughing Gallery. Remember: plans, predictions, traps.',
      'Eso es: el miedo a que se rían de ti, hecho enorme. La Galería que se ríe. Recuerda: planes, predicciones, trampas.',
      'É isso: o medo de que riam de você, que ficou enorme. A Galeria que Ri. Lembra: planos, previsões, armadilhas.',
      'Das ist es: die Angst, ausgelacht zu werden, riesig geworden. Die Lachende Galerie. Denk dran: Pläne, Vorhersagen, Fallen.',
      '[就是|jiù shì] [它|tā] ： [怕|pà] [被|bèi] [人|rén] [笑|xiào] [的|de] [恐惧|kǒng jù] ， [长得|zhǎng de] [好|hǎo] [大|dà] 。 [大笑|dà xiào] [的|de] [看台|kàn tái] 。 [记住|jì zhù] ： [计划|jì huà] 、 [预言|yù yán] 、 [陷阱|xiàn jǐng] 。',
      'あれ です 。 [笑|わら]われる の が [怖|こわ]い [気持|きも]ち が 、 [大|おお]きく なった もの 。 「 [笑|わら]う [客席|きゃくせき] 」 。 [忘|わす]れないで 。 [計画|けいかく] 、 [予言|よげん] 、 わな 。'),
    'h.lost': L('It laughed us off the stage… Catch your breath. We’ll face it again.', 'Nos echó del escenario a carcajadas… Respira. Lo intentaremos otra vez.', 'Ela expulsou a gente do palco com risada… Respira. A gente vai tentar de novo.', 'Sie hat uns von der Bühne gelacht… Atme durch. Wir versuchen es noch einmal.',
      '[它|tā] [把|bǎ] [我们|wǒ men] [笑|xiào] [下|xià] [了|le] [舞台|wǔ tái] … [喘|chuǎn] [口|kǒu] [气|qì] 。 [我们|wǒ men] [会|huì] [再|zài] [试|shì] [一|yī] [次|cì] 。', '[笑|わら]われて 、 [舞台|ぶたい] から [追|お]い[出|だ]された … [一息|ひといき] ついて 。 また [挑戦|ちょうせん] しましょう 。'),
    // the echo, and after it
    'e.tadeo': L('Did you hear that? A voice, like a boy’s… but older.', '¿Lo oíste? Una voz, como la de un niño… pero mayor.', 'Você ouviu? Uma voz, como a de um menino… mas mais velha.', 'Hast du das gehört? Eine Stimme, wie die eines Jungen… aber älter.',
      '[你|nǐ] [听到|tīng dào] [了|le] [吗|ma] ？ [一个|yī gè] [声音|shēng yīn] ， [像|xiàng] [男孩|nán hái] [的|de] … [可是|kě shì] [更|gèng] [成熟|chéng shú] 。', '[聞|き]こえました か ？ [男|おとこ] の [子|こ] みたい な [声|こえ] … でも 、 もっと [大人|おとな] の [声|こえ] 。'),
    'e.after': L('The seats have their color back… red velvet! I’ll run and tell Marta. Meet us out front!',
      'Las butacas recuperaron su color… ¡terciopelo rojo! Voy corriendo a decírselo a Marta. ¡Nos vemos afuera!',
      'As poltronas ganharam a cor de volta… veludo vermelho! Vou correndo contar pra Marta. A gente se vê lá fora!',
      'Die Sitze haben ihre Farbe zurück… roter Samt! Ich laufe und sage es Marta. Wir treffen uns draußen!',
      '[座位|zuò wèi] [的|de] [颜色|yán sè] [回来|huí lai] [了|le] … [红|hóng] [丝绒|sī róng] ！ [我|wǒ] [跑去|pǎo qù] [告诉|gào su] [玛尔塔|Mǎ ěr tǎ] 。 [外面|wài miàn] [见|jiàn] ！',
      '[席|せき] に [色|いろ] が [戻|もど]りました … [赤|あか]い ビロード ！ マルタ さん に [知|し]らせて きます 。 [外|そと] で [会|あ]いましょう ！'),
    // the festival (step 8)
    'fe.marta1': L('Tadeo ran to tell me! The doors are open? Then tonight: the Festival of Voices, in the theater, like before!',
      '¡Tadeo vino corriendo a decírmelo! ¿Las puertas están abiertas? Entonces esta noche: ¡la Fiesta de las Voces, en el teatro, como antes!',
      'O Tadeu veio correndo me contar! As portas estão abertas? Então hoje à noite: a Festa das Vozes, no teatro, como antigamente!',
      'Tadeo ist gleich zu mir gerannt! Die Türen sind offen? Dann heute Abend: das Fest der Stimmen, im Theater, wie früher!',
      '[塔德奥|Tǎ dé ào] [跑来|pǎo lái] [告诉|gào su] [我|wǒ] [了|le] ！ [门|mén] [开|kāi] [了|le] ？ [那|nà] [今天|jīn tiān] [晚上|wǎn shang] ： [声音节|Shēng yīn jié] ， [就|jiù] [在|zài] [剧院|jù yuàn] ， [像|xiàng] [以前|yǐ qián] [一样|yī yàng] ！',
      'タデオ さん が [走|はし]って [知|し]らせ に [来|き]て くれました ！ [扉|とびら] が [開|あ]いた ？ それ なら [今夜|こんや] 、 「 [声|こえ] の [祭|まつ]り 」 を [劇場|げきじょう] で 、 [昔|むかし] の よう に ！'),
    'fe.open': L('This is the Festival of Voices! Tonight, every voice counts.', '¡Esta es la Fiesta de las Voces! Esta noche, toda voz cuenta.', 'Esta é a Festa das Vozes! Hoje à noite, toda voz conta.', 'Willkommen zum Fest der Stimmen! Heute Abend zählt jede Stimme.',
      '[欢迎|huān yíng] [来到|lái dào] [声音节|Shēng yīn jié] ！ [今天|jīn tiān] [晚上|wǎn shang] ， [每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù] 。', '「 [声|こえ] の [祭|まつ]り 」 へ ようこそ ！ [今夜|こんや] は 、 どの [声|こえ] も [大切|たいせつ] です 。'),
    'fe.sami': L('H-hello… I’m Sami. Yesterday I said: tomorrow I’ll talk with everyone. Well… today is tomorrow!',
      'Ho-hola… Me llamo Sami. Ayer dije: mañana hablaré con todos. Pues… ¡hoy es mañana!',
      'O-oi… Eu sou a Sami. Ontem eu disse: amanhã eu vou falar com todo mundo. Então… hoje é amanhã!',
      'H-hallo… Ich bin Sami. Gestern habe ich gesagt: Morgen werde ich mit allen reden. Tja… heute ist morgen!',
      '[你|nǐ] … [你好|nǐ hǎo] … [我|wǒ] [叫|jiào] [萨米|Sà mǐ] 。 [昨天|zuó tiān] [我|wǒ] [说|shuō] ： [明天|míng tiān] [我|wǒ] [会|huì] [跟|gēn] [大家|dà jiā] [说话|shuō huà] 。 [现在|xiàn zài] … [今天|jīn tiān] [就是|jiù shì] [明天|míng tiān] ！',
      'こ 、 こんにちは … サミ です 。 [昨日|きのう] 、 「 [明日|あした] は みんな と [話|はな]す 」 って [言|い]いました 。 だから … [今日|きょう] が その [明日|あした] です ！'),
    'fe.tito': L('And now… music!', '¡Y ahora… música!', 'E agora… música!', 'Und jetzt… Musik!', '[现在|xiàn zài] … [音乐|yīn yuè] [开始|kāi shǐ] ！', 'それ で は … [音楽|おんがく] ！'),
    'fe.all': L('Every voice counts!', '¡Toda voz cuenta!', 'Toda voz conta!', 'Jede Stimme zählt!', '[每|měi] [一|yī] [个|gè] [声音|shēng yīn] [都|dōu] [算数|suàn shù] ！', 'どの [声|こえ] も [大切|たいせつ] ！'),
    'fe.marta2': L('Thank you. Forty years we waited for this night. Now go: someone is waiting for those words of his.',
      'Gracias. Cuarenta años esperamos esta noche. Ahora ve: alguien está esperando esas palabras suyas.',
      'Obrigada. Quarenta anos a gente esperou por esta noite. Agora vai: tem alguém esperando aquelas palavras dele.',
      'Danke. Vierzig Jahre haben wir auf diesen Abend gewartet. Jetzt geh: Jemand wartet auf seine Worte.',
      '[谢谢|xiè xie] [你|nǐ] 。 [这个|zhè ge] [晚上|wǎn shang] [我们|wǒ men] [等|děng] [了|le] [四十|sì shí] [年|nián] 。 [去|qù] [吧|ba] ： [有|yǒu] [人|rén] [在|zài] [等|děng] [他|tā] [的|de] [那|nà] [句|jù] [话|huà] 。',
      'ありがとう 。 [四十年|よんじゅうねん] 、 この [夜|よる] を [待|ま]って いました 。 さあ 、 [行|い]って ください 。 あの [人|ひと] の [言葉|ことば] を [待|ま]って いる [人|ひと] が います 。'),
    // step 9: the report, at the pond's crack
    'n.r1': L('I heard it all the way in here: «Thank you, Alba!» His speech has a beginning and an end now.',
      'Lo oí hasta aquí dentro: «¡Gracias, Alba!». Su discurso ya tiene un principio y un final.',
      'Eu ouvi aqui de dentro: «Obrigado, Alba!». O discurso dele já tem começo e fim.',
      'Ich habe es bis hier drin gehört: «Danke, Alba!» Seine Rede hat jetzt einen Anfang und ein Ende.',
      '[我|wǒ] [在|zài] [这里|zhè lǐ] [都|dōu] [听到|tīng dào] [了|le] ： “ [谢谢|xiè xie] ， [阿尔巴|Ā ěr bā] ！ ” [他|tā] [的|de] [演讲|yǎn jiǎng] [现在|xiàn zài] [有|yǒu] [开头|kāi tóu] ， [也|yě] [有|yǒu] [结尾|jié wěi] [了|le] 。',
      'ここ まで [聞|き]こえた よ 。 「 ありがとう 、 アルバ ！ 」 あの [人|ひと] の スピーチ に 、 [始|はじ]まり と [終|お]わり が できた ね 。'),
    'n.r2': L('Alba’s two echoes are free. Now the cracks in Molinar are opening: his silent years are out there, in the bells’ lands.',
      'Los dos ecos de Alba están libres. Ahora se abren las grietas de Molinar: sus años de silencio están ahí fuera, en las tierras de las campanas.',
      'Os dois ecos de Alba estão livres. Agora as fendas de Molinar estão se abrindo: os anos de silêncio dele estão lá fora, nas terras dos sinos.',
      'Albas zwei Echos sind frei. Jetzt öffnen sich die Risse in Molinar: Seine stillen Jahre sind da draußen, in den Ländern der Glocken.',
      '[阿尔巴|Ā ěr bā] [的|de] [两个|liǎng gè] [回声|huí shēng] [都|dōu] [自由|zì yóu] [了|le] 。 [现在|xiàn zài] [磨坊镇|Mò fáng zhèn] [的|de] [裂缝|liè fèng] [正在|zhèng zài] [打开|dǎ kāi] ： [他|tā] [沉默|chén mò] [的|de] [那些|nà xiē] [年|nián] ， [就|jiù] [在|zài] [那些|nà xiē] [有|yǒu] [钟|zhōng] [的|de] [地方|dì fang] 。',
      'アルバ の [二|ふた]つ の こだま は [自由|じゆう] に なった 。 [今|いま] 、 モリナール の [裂|さ]け[目|め] が [開|ひら]き はじめて いる 。 あの [人|ひと] の [黙|だま]って いた [年月|としつき] は 、 [鐘|かね] の [国|くに] に ある 。'),
    'n.r3': L('Go on. I’ll be listening, at every crack.', 'Adelante. Estaré escuchando, en cada grieta.', 'Vai lá. Vou estar ouvindo, em cada fenda.', 'Geh nur. Ich werde zuhören, an jedem Riss.',
      '[去|qù] [吧|ba] 。 [每|měi] [一|yī] [道|dào] [裂缝|liè fèng] ， [我|wǒ] [都|dōu] [会|huì] [听|tīng] [着|zhe] 。', '[行|い]って 。 どの [裂|さ]け[目|め] から も 、 [聞|き]いて いる から ね 。'),
    'n.again': L('Tomorrow’s theater is waiting. Marta and the people of tomorrow will help you.', 'El teatro del mañana te espera. Marta y la gente del mañana te ayudarán.', 'O teatro do amanhã está esperando. A Marta e o pessoal do amanhã vão te ajudar.', 'Das Theater von morgen wartet. Marta und die Leute von morgen werden dir helfen.',
      '[明天|míng tiān] [的|de] [剧院|jù yuàn] [在|zài] [等|děng] [你|nǐ] 。 [玛尔塔|Mǎ ěr tǎ] [和|hé] [明天|míng tiān] [的|de] [人们|rén men] [会|huì] [帮|bāng] [你|nǐ] 。', '[明日|あした] の [劇場|げきじょう] が [待|ま]って いる よ 。 マルタ さん と [明日|あした] の みんな が [手伝|てつだ]って くれる 。'),
    // ◆ the time capsule (today changes tomorrow): Beto tomorrow, the plaza kids today
    'c.beto1': L('Funny thing: when we were kids, Sofi, Luci and I wanted to bury a time capsule by the willow at the duck pond. We never did. We forgot!',
      'Qué cosa: de niños, Sofi, Luci y yo queríamos enterrar una cápsula del tiempo junto al sauce del estanque. Nunca lo hicimos. ¡Se nos olvidó!',
      'Engraçado: quando a gente era criança, eu, a Sofi e a Luci queríamos enterrar uma cápsula do tempo perto do salgueiro do lago. Nunca enterramos. A gente esqueceu!',
      'Lustig: Als Kinder wollten Sofi, Luci und ich eine Zeitkapsel bei der Weide am Ententeich vergraben. Wir haben es nie gemacht. Vergessen!',
      '[说来|shuō lái] [好笑|hǎo xiào] ： [我们|wǒ men] [小|xiǎo] [时候|shí hou] ， [索菲|Suǒ fēi] 、 [露西|Lù xī] [和|hé] [我|wǒ] [想|xiǎng] [在|zài] [池塘|chí táng] [边|biān] [的|de] [柳树|liǔ shù] [下|xià] [埋|mái] [一个|yī gè] [时间|shí jiān] [胶囊|jiāo náng] 。 [可|kě] [我们|wǒ men] [一直|yī zhí] [没|méi] [埋|mái] 。 [忘|wàng] [了|le] ！',
      'おもしろい [話|はなし] が ある ん です 。 [子|こ]ども の ころ 、 ソフィ と ルシ と ぼく で 、 [池|いけ] の [柳|やなぎ] の [下|した] に タイム カプセル を [埋|う]めよう と しました 。 でも 、 [結局|けっきょく] [埋|う]めなかった 。 [忘|わす]れちゃった ん です ！'),
    'c.beto2': L('Nobody reminded us…', 'Nadie nos lo recordó…', 'Ninguém lembrou a gente…', 'Niemand hat uns daran erinnert…', '[没有|méi yǒu] [人|rén] [提醒|tí xǐng] [我们|wǒ men] …', 'だれ も [教|おし]えて くれなかった し …'),
    'c.luci0': L('We have a box! We’re going to bury it by the willow, and open it in ten years!',
      '¡Tenemos una caja! ¡Vamos a enterrarla junto al sauce y a abrirla en diez años!',
      'A gente tem uma caixa! A gente vai enterrar perto do salgueiro e abrir daqui a dez anos!',
      'Wir haben eine Kiste! Wir werden sie bei der Weide vergraben und in zehn Jahren öffnen!',
      '[我们|wǒ men] [有|yǒu] [一个|yī gè] [盒子|hé zi] ！ [我们|wǒ men] [要|yào] [把|bǎ] [它|tā] [埋|mái] [在|zài] [柳树|liǔ shù] [下|xià] ， [十|shí] [年|nián] [后|hòu] [再|zài] [打开|dǎ kāi] ！',
      '[箱|はこ] が ある の ！ [柳|やなぎ] の [下|した] に [埋|う]めて 、 [十年後|じゅうねんご] に [開|あ]ける つもり ！'),
    'c.sofi0': L('And mine: «I’ll paint the whole town!»', 'Y el mío: «¡Pintaré todo el pueblo!»', 'E o meu: «Eu vou pintar a cidade inteira!»', 'Und meins: «Ich werde das ganze Dorf malen!»',
      '[我|wǒ] [的|de] ： “ [我|wǒ] [会|huì] [画|huà] [整个|zhěng gè] [小镇|xiǎo zhèn] ！ ”', 'わたし の は ： 「 [町|まち] を ぜんぶ [描|か]く つもり ！ 」'),
    'c.luci1': L('Mine: «I’ll read every book in Alba!» Now you! What will you do in ten years?',
      'El mío: «¡Leeré todos los libros de Alba!». ¡Ahora tú! ¿Qué harás en diez años?',
      'O meu: «Eu vou ler todos os livros de Alba!». Agora você! O que você vai fazer daqui a dez anos?',
      'Meins: «Ich werde jedes Buch in Alba lesen!» Jetzt du! Was wirst du in zehn Jahren machen?',
      '[我|wǒ] [的|de] ： “ [我|wǒ] [会|huì] [读完|dú wán] [阿尔巴|Ā ěr bā] [所有|suǒ yǒu] [的|de] [书|shū] ！ ” [该|gāi] [你|nǐ] [了|le] ！ [十|shí] [年|nián] [后|hòu] [你|nǐ] [会|huì] [做|zuò] [什么|shén me] ？',
      'わたし の は ： 「 アルバ の [本|ほん] を ぜんぶ [読|よ]む つもり ！ 」 [次|つぎ] は あなた ！ [十年後|じゅうねんご] 、 [何|なに] を する つもり ？'),
    'c.bury': L('Into the box! Now we bury it by the willow… See you in ten years, box!', '¡A la caja! Ahora la enterramos junto al sauce… ¡Hasta dentro de diez años, caja!', 'Pra caixa! Agora a gente enterra perto do salgueiro… Até daqui a dez anos, caixa!', 'Ab in die Kiste! Jetzt vergraben wir sie bei der Weide… Bis in zehn Jahren, Kiste!',
      '[放进|fàng jìn] [盒子|hé zi] ！ [现在|xiàn zài] [把|bǎ] [它|tā] [埋|mái] [在|zài] [柳树|liǔ shù] [下|xià] … [盒子|hé zi] ， [十|shí] [年|nián] [后|hòu] [见|jiàn] ！', '[箱|はこ] に [入|い]れて ！ [柳|やなぎ] の [下|した] に [埋|う]めよう … [箱|はこ] さん 、 [十年後|じゅうねんご] に ね ！'),
    'c.again': L('Ten years is sooo long! Will you remember where it is?', '¡Diez años es muchísimo! ¿Te acordarás de dónde está?', 'Dez anos é muuuito tempo! Você vai lembrar onde está?', 'Zehn Jahre sind sooo lang! Wirst du dich erinnern, wo sie ist?',
      '[十|shí] [年|nián] [好|hǎo] [长|cháng] [啊|a] ！ [你|nǐ] [会|huì] [记得|jì de] [它|tā] [在|zài] [哪里|nǎ lǐ] [吗|ma] ？', '[十年|じゅうねん] って 、 すごく [長|なが]い ！ どこ に ある か 、 [覚|おぼ]えて いる でしょう か ？'),
    'c.beto3': L('You found it?! «I’ll drive a train»… well, a tram! Close enough. And Luci did read every book. Almost.',
      '¡¿La encontraste?! «Conduciré un tren»… bueno, ¡un tranvía! Casi. Y Luci sí leyó todos los libros. Casi todos.',
      'Você achou?! «Eu vou dirigir um trem»… bom, um bonde! Quase. E a Luci leu mesmo todos os livros. Quase todos.',
      'Du hast sie gefunden?! «Ich werde einen Zug fahren»… na ja, eine Straßenbahn! Fast. Und Luci hat wirklich jedes Buch gelesen. Fast jedes.',
      '[你|nǐ] [找到|zhǎo dào] [了|le] ？ “ [我|wǒ] [会|huì] [开|kāi] [火车|huǒ chē] ” … [好吧|hǎo ba] ， [是|shì] [电车|diàn chē] ！ [差不多|chà bu duō] 。 [露西|Lù xī] [也|yě] [真的|zhēn de] [读|dú] [了|le] [所有|suǒ yǒu] [的|de] [书|shū] 。 [差不多|chà bu duō] [所有|suǒ yǒu] 。',
      '[見|み]つけた ん です か ？ 「 [汽車|きしゃ] を [運転|うんてん] する 」 … まあ 、 [路面電車|ろめんでんしゃ] だ けど ！ ほぼ [正解|せいかい] 。 ルシ も [本当|ほんとう] に [本|ほん] を ぜんぶ [読|よ]んだ ん です よ 。 ほとんど ね 。'),
    // ◆ the dry pond (a warning from tomorrow changes today): Sofi tomorrow, Hugo today
    'p.sofi1': L('The duck pond dried up years ago. After a big storm, leaves blocked the little channel that feeds it, and nobody cleaned it.',
      'El estanque de los patos se secó hace años. Después de una gran tormenta, las hojas taparon el canalito que lo llena, y nadie lo limpió.',
      'O lago dos patos secou faz anos. Depois de uma tempestade grande, as folhas entupiram o canalzinho que enche o lago, e ninguém limpou.',
      'Der Ententeich ist vor Jahren ausgetrocknet. Nach einem großen Sturm haben Blätter den kleinen Kanal verstopft, der ihn füllt, und niemand hat ihn sauber gemacht.',
      '[鸭子|yā zi] [池塘|chí táng] [好|hǎo] [几|jǐ] [年|nián] [前|qián] [就|jiù] [干|gān] [了|le] 。 [一|yī] [场|chǎng] [大|dà] [暴风雨|bào fēng yǔ] [以后|yǐ hòu] ， [树叶|shù yè] [堵住|dǔ zhù] [了|le] [给|gěi] [池塘|chí táng] [供水|gōng shuǐ] [的|de] [小|xiǎo] [水渠|shuǐ qú] ， [没有|méi yǒu] [人|rén] [去|qù] [清理|qīng lǐ] 。',
      'アヒル の [池|いけ] は 、 [何年|なんねん] も [前|まえ] に [干上|ひあ]がりました 。 [大|おお]きな [嵐|あらし] の あと 、 [池|いけ] に [水|みず] を [運|はこ]ぶ [小|ちい]さな [水路|すいろ] が [葉|は]っぱ で つまって 、 だれ も [掃除|そうじ] しなかった ん です 。'),
    'p.hugo1': L('The duck pond? It’s lovely. Why?', '¿El estanque de los patos? Está precioso. ¿Por qué?', 'O lago dos patos? Está lindo. Por quê?', 'Der Ententeich? Der ist wunderschön. Warum?',
      '[鸭子|yā zi] [池塘|chí táng] ？ [挺|tǐng] [好|hǎo] [的|de] [啊|a] 。 [怎么|zěn me] [了|le] ？', 'アヒル の [池|いけ] ？ きれい です よ 。 どうして ？'),
    'p.hugo2': L('Dry? Our pond? Not while I’ve got a broom! I’ll clean that channel today… and every autumn.',
      '¿Seco? ¿Nuestro estanque? ¡No mientras yo tenga escoba! Limpiaré ese canal hoy… y cada otoño.',
      'Seco? O nosso lago? Não enquanto eu tiver vassoura! Vou limpar esse canal hoje… e todo outono.',
      'Trocken? Unser Teich? Nicht, solange ich einen Besen habe! Ich werde den Kanal heute sauber machen… und jeden Herbst.',
      '[干|gān] [了|le] ？ [我们|wǒ men] [的|de] [池塘|chí táng] ？ [只要|zhǐ yào] [我|wǒ] [有|yǒu] [扫帚|sào zhou] ， [就|jiù] [不会|bù huì] ！ [我|wǒ] [今天|jīn tiān] [就|jiù] [去|qù] [清理|qīng lǐ] [水渠|shuǐ qú] … [以后|yǐ hòu] [每|měi] [年|nián] [秋天|qiū tiān] [都|dōu] [会|huì] 。',
      '[干上|ひあ]がる ？ うち の [池|いけ] が ？ ほうき が ある かぎり 、 そう は させません ！ [今日|きょう] 、 [水路|すいろ] を [掃除|そうじ] します … [毎年|まいとし] の [秋|あき] も 。'),
    'p.hugo3': L('Clean as a whistle. Every autumn, I promised!', 'Limpio como una patena. ¡Cada otoño, lo prometí!', 'Limpinho. Todo outono, eu prometi!', 'Blitzsauber. Jeden Herbst, versprochen!',
      '[干干净净|gān gān jìng jìng] 。 [每|měi] [年|nián] [秋天|qiū tiān] ， [我|wǒ] [保证|bǎo zhèng] ！', 'ぴかぴか です よ 。 [毎年|まいとし] [秋|あき] に 、 [約束|やくそく] です ！'),
    'p.sofi2': L('The pond is full! Old Hugo still cleans that channel every autumn. He says someone warned him once, long ago…',
      '¡El estanque está lleno! El viejo Hugo todavía limpia ese canal cada otoño. Dice que una vez, hace mucho, alguien le avisó…',
      'O lago está cheio! O velho Hugo ainda limpa aquele canal todo outono. Ele diz que uma vez, faz muito tempo, alguém avisou ele…',
      'Der Teich ist voll! Der alte Hugo macht den Kanal immer noch jeden Herbst sauber. Er sagt, jemand hat ihn einmal gewarnt, vor langer Zeit…',
      '[池塘|chí táng] [满|mǎn] [了|le] ！ [雨果|Yǔ guǒ] [爷爷|yé ye] [每|měi] [年|nián] [秋天|qiū tiān] [还|hái] [在|zài] [清理|qīng lǐ] [那|nà] [条|tiáo] [水渠|shuǐ qú] 。 [他|tā] [说|shuō] [很|hěn] [久|jiǔ] [以前|yǐ qián] ， [有|yǒu] [人|rén] [提醒|tí xǐng] [过|guo] [他|tā] …',
      '[池|いけ] が いっぱい ！ ウーゴ さん は 、 [今|いま] も [毎年|まいとし] [秋|あき] に あの [水路|すいろ] を [掃除|そうじ] して います 。 ずっと [前|まえ] に 、 だれ か が [教|おし]えて くれた ん です って …'),
    // ◆ Sami's first words, and ◆ the guest book (the new library: Luci)
    'sa.luci1': L('That’s Sami. New in town. Sami hasn’t said a word since arriving… at the old school, the other kids laughed.',
      'Esa es Sami. Es nueva en el pueblo. No ha dicho ni una palabra desde que llegó… en su otra escuela, los demás niños se reían.',
      'Aquela é a Sami. Ela é nova na cidade. Não disse uma palavra desde que chegou… na outra escola, as outras crianças riam.',
      'Das ist Sami. Sie ist neu im Dorf. Seit sie hier ist, hat sie kein Wort gesagt… in der alten Schule haben die anderen Kinder gelacht.',
      '[那|nà] [是|shì] [萨米|Sà mǐ] ， [刚|gāng] [搬来|bān lái] [的|de] 。 [她|tā] [来|lái] [了|le] [以后|yǐ hòu] [一|yī] [句|jù] [话|huà] [也|yě] [没|méi] [说|shuō] [过|guo] … [在|zài] [以前|yǐ qián] [的|de] [学校|xué xiào] ， [别的|bié de] [孩子|hái zi] [笑|xiào] [她|tā] 。',
      'あの [子|こ] は サミ 。 [引|ひ]っ[越|こ]して きた ばかり な ん です 。 [来|き]て から 、 [一言|ひとこと] も [話|はな]して いません … [前|まえ] の [学校|がっこう] で 、 ほか の [子|こ] に [笑|わら]われた ん です って 。'),
    'sa.r1': L('…R-really?', '…¿D-de verdad?', '…S-sério?', '…W-wirklich?', '… [真|zhēn] … [真的|zhēn de] [吗|ma] ？', '… ほ 、 [本当|ほんとう] ？'),
    'sa.r2': L('Then… tomorrow I’ll try. At the festival!', 'Entonces… mañana lo intentaré. ¡En la fiesta!', 'Então… amanhã eu vou tentar. Na festa!', 'Dann… morgen werde ich es versuchen. Auf dem Fest!',
      '[那|nà] … [明天|míng tiān] [我|wǒ] [会|huì] [试试|shì shi] 。 [在|zài] [节日|jié rì] [上|shàng] ！', 'じゃあ … [明日|あした] 、 やって みる 。 お[祭|まつ]り で ！'),
    'sa.luci2': L('Look at that smile. Thank you.', 'Mira qué sonrisa. Gracias.', 'Olha esse sorriso. Obrigada.', 'Schau dir dieses Lächeln an. Danke.',
      '[看|kàn] [她|tā] [笑|xiào] [得|de] [多|duō] [开心|kāi xīn] 。 [谢谢|xiè xie] [你|nǐ] 。', 'あの [笑顔|えがお] 。 ありがとう ございます 。'),
    'gb.luci1': L('Everyone who visits writes one line in the guest book: something they’ll do tomorrow. Read a few!',
      'Todos los que vienen escriben una línea en el libro de visitas: algo que harán mañana. ¡Lee algunas!',
      'Todo mundo que vem escreve uma linha no livro de visitas: uma coisa que vai fazer amanhã. Lê algumas!',
      'Alle, die herkommen, schreiben eine Zeile ins Gästebuch: etwas, das sie morgen machen werden. Lies ein paar!',
      '[每个|měi gè] [来|lái] [的|de] [人|rén] [都|dōu] [在|zài] [留言簿|liú yán bù] [上|shàng] [写|xiě] [一|yī] [句|jù] ： [明天|míng tiān] [会|huì] [做|zuò] [的|de] [一|yī] [件|jiàn] [事|shì] 。 [你|nǐ] [读读|dú du] [看|kàn] ！',
      '[来|き]た [人|ひと] は みんな 、 [芳名録|ほうめいろく] に [一行|いちぎょう] [書|か]きます 。 [明日|あした] する つもり の こと を 。 [少|すこ]し [読|よ]んで みて ！'),
    'gb.luci2': L('Lovely! Now you’re part of the library’s story.', '¡Qué bonito! Ahora eres parte de la historia de la biblioteca.', 'Que lindo! Agora você faz parte da história da biblioteca.', 'Wie schön! Jetzt bist du ein Teil der Geschichte der Bibliothek.',
      '[真|zhēn] [好|hǎo] ！ [现在|xiàn zài] [你|nǐ] [也|yě] [是|shì] [图书馆|tú shū guǎn] [故事|gù shi] [的|de] [一|yī] [部分|bù fen] [了|le] 。', 'すてき ！ これ で あなた も 、 この [図書館|としょかん] の [物語|ものがたり] の [一部|いちぶ] です 。'),
    // ◆ bread for the festival (the bakery tomorrow: Nilo)
    'br.nilo1': L('For the festival I’ll bake something special. But what?', 'Para la fiesta hornearé algo especial. Pero ¿qué?', 'Pra festa eu vou assar uma coisa especial. Mas o quê?', 'Für das Fest werde ich etwas Besonderes backen. Aber was?',
      '[为了|wèi le] [节日|jié rì] ， [我|wǒ] [会|huì] [烤|kǎo] [一|yī] [种|zhǒng] [特别|tè bié] [的|de] [面包|miàn bāo] 。 [可是|kě shì] [烤|kǎo] [什么|shén me] [呢|ne] ？', 'お[祭|まつ]り の ため に 、 [特別|とくべつ] な もの を [焼|や]く つもり です 。 でも 、 [何|なに] を ？'),
    'br.nilo2': L('Good choice! I’ll bake it tonight… Here, the first one is yours!', '¡Buena elección! Lo hornearé esta noche… Toma, ¡el primero es para ti!', 'Boa escolha! Vou assar hoje à noite… Toma, o primeiro é seu!', 'Gute Wahl! Ich werde es heute Abend backen… Hier, das erste ist für dich!',
      '[好|hǎo] [主意|zhǔ yi] ！ [我|wǒ] [今天|jīn tiān] [晚上|wǎn shang] [就|jiù] [烤|kǎo] … [给|gěi] ， [第一个|dì yī gè] [给|gěi] [你|nǐ] ！', 'いい ね ！ [今夜|こんや] [焼|や]きます … はい 、 [最初|さいしょ] の [一|ひと]つ は あなた に ！'),
    'br.nilo3': L('Tonight the oven will be busy. The whole festival will smell of bread!', 'Esta noche el horno estará ocupado. ¡Toda la fiesta olerá a pan!', 'Hoje à noite o forno vai trabalhar muito. A festa inteira vai ter cheiro de pão!', 'Heute Abend wird der Ofen viel zu tun haben. Das ganze Fest wird nach Brot duften!',
      '[今天|jīn tiān] [晚上|wǎn shang] [烤箱|kǎo xiāng] [会|huì] [很|hěn] [忙|máng] 。 [整个|zhěng gè] [节日|jié rì] [都|dōu] [会|huì] [有|yǒu] [面包|miàn bāo] [的|de] [香味|xiāng wèi] ！', '[今夜|こんや] は オーブン が [大忙|おおいそが]し でしょう 。 お[祭|まつ]り じゅう 、 パン の いい におい が する でしょう ！'),
  };
  // what the Hush left of a line (STORY.sayHushed): the theater's sealed doors, whispering their fear (the same count of *starred*
  // words in every language, so the surviving words line up with the English)
  const HUSH = {
    seal: L('… *laugh*… *everyone*… *laugh*…', '… *reirán*… *todos*… *reirán*…', '… *rirão*… *todos*… *rirão*…', '… *lachen*… *alle*… *lachen*…',
      '… *[笑|xiào]* … *[大家|dà jiā]* … *[笑|xiào]* …', '… *[笑|わら]う* … *みんな* … *[笑|わら]う* …'),
  };

  // ------------------------------------------------------------ each person's own lines, said in turn (Talk → Chat)
  const CHAT = {
    beto: [
      L('Next stop: the plaza! The tram runs on sunshine: the panels on its roof drink the light.', '¡Próxima parada: la plaza! El tranvía funciona con sol: los paneles del techo se beben la luz.', 'Próxima parada: a praça! O bonde funciona com sol: os painéis no teto bebem a luz.', 'Nächster Halt: der Platz! Die Straßenbahn fährt mit Sonne: Die Paneele auf dem Dach trinken das Licht.',
        '[下|xià] [一|yī] [站|zhàn] ： [广场|guǎng chǎng] ！ [这|zhè] [辆|liàng] [电车|diàn chē] [靠|kào] [太阳|tài yáng] [开|kāi] ： [车顶|chē dǐng] [上|shàng] [的|de] [板子|bǎn zi] [会|huì] [吸|xī] [阳光|yáng guāng] 。', '[次|つぎ] は [広場|ひろば] ！ この [電車|でんしゃ] は [太陽|たいよう] で [走|はし]る ん です 。 [屋根|やね] の パネル が [光|ひかり] を [飲|の]みます 。'),
      L('When I was little, I wanted to drive a train. Well… a tram is almost a train!', 'De pequeño quería conducir un tren. Bueno… ¡un tranvía es casi un tren!', 'Quando eu era pequeno, queria dirigir um trem. Bom… um bonde é quase um trem!', 'Als Kind wollte ich einen Zug fahren. Na ja… eine Straßenbahn ist fast ein Zug!',
        '[我|wǒ] [小|xiǎo] [时候|shí hou] [想|xiǎng] [开|kāi] [火车|huǒ chē] 。 [好吧|hǎo ba] … [电车|diàn chē] [也|yě] [差不多|chà bu duō] [是|shì] [火车|huǒ chē] ！', '[子|こ]ども の ころ 、 [汽車|きしゃ] を [運転|うんてん] したかった ん です 。 まあ … [路面電車|ろめんでんしゃ] も [汽車|きしゃ] みたい な もの です ！'),
      L('Tomorrow it’ll be sunny: the tram will run all day.', 'Mañana hará sol: el tranvía andará todo el día.', 'Amanhã vai fazer sol: o bonde vai rodar o dia todo.', 'Morgen wird es sonnig: Die Straßenbahn wird den ganzen Tag fahren.',
        '[明天|míng tiān] [会|huì] [是|shì] [晴天|qíng tiān] ： [电车|diàn chē] [会|huì] [开|kāi] [一整天|yī zhěng tiān] 。', '[明日|あした] は [晴|は]れる でしょう 。 [電車|でんしゃ] は [一日中|いちにちじゅう] [走|はし]る でしょう 。'),
    ],
    sofi: [
      L('I’m painting the duck pond… from memory. It was so pretty when we were kids.', 'Estoy pintando el estanque de los patos… de memoria. Era tan bonito cuando éramos niños.', 'Estou pintando o lago dos patos… de memória. Era tão bonito quando a gente era criança.', 'Ich male den Ententeich… aus dem Gedächtnis. Er war so schön, als wir Kinder waren.',
        '[我|wǒ] [在|zài] [画|huà] [鸭子|yā zi] [池塘|chí táng] … [凭|píng] [记忆|jì yì] [画|huà] 。 [我们|wǒ men] [小|xiǎo] [时候|shí hou] ， [它|tā] [好|hǎo] [漂亮|piào liang] 。', 'アヒル の [池|いけ] を [描|か]いて います … [思|おも]い[出|で] から 。 [子|こ]ども の ころ 、 とても きれい でした 。'),
      L('Color is coming back to Alba. I want to paint all of it!', 'El color está volviendo a Alba. ¡Quiero pintarlo todo!', 'A cor está voltando pra Alba. Eu quero pintar tudo!', 'Die Farbe kommt nach Alba zurück. Ich will alles malen!',
        '[颜色|yán sè] [回到|huí dào] [阿尔巴|Ā ěr bā] [了|le] 。 [我|wǒ] [想|xiǎng] [全部|quán bù] [画|huà] [下来|xià lai] ！', 'アルバ に [色|いろ] が [戻|もど]って きました 。 ぜんぶ [描|か]きたい ！'),
    ],
    sofiFull: [
      L('The pond is full again! Tomorrow I’ll paint it as it is now.', '¡El estanque está lleno otra vez! Mañana lo pintaré como es ahora.', 'O lago está cheio de novo! Amanhã eu vou pintar ele como é agora.', 'Der Teich ist wieder voll! Morgen werde ich ihn so malen, wie er jetzt ist.',
        '[池塘|chí táng] [又|yòu] [满|mǎn] [了|le] ！ [明天|míng tiān] [我|wǒ] [会|huì] [画|huà] [它|tā] [现在|xiàn zài] [的|de] [样子|yàng zi] 。', '[池|いけ] が また いっぱい ！ [明日|あした] 、 [今|いま] の [池|いけ] を [描|か]く つもり です 。'),
    ],
    luci: [
      L('This is the new library! Every book here was a gift from someone in town.', '¡Esta es la biblioteca nueva! Cada libro lo regaló alguien del pueblo.', 'Esta é a biblioteca nova! Cada livro foi um presente de alguém da cidade.', 'Das ist die neue Bibliothek! Jedes Buch hier hat jemand aus dem Dorf geschenkt.',
        '[这|zhè] [是|shì] [新|xīn] [图书馆|tú shū guǎn] ！ [这里|zhè lǐ] [的|de] [每|měi] [本|běn] [书|shū] [都|dōu] [是|shì] [镇上|zhèn shang] [的|de] [人|rén] [送|sòng] [的|de] 。', 'ここ が [新|あたら]しい [図書館|としょかん] です ！ どの [本|ほん] も 、 [町|まち] の だれ か が くれた [本|ほん] な ん です よ 。'),
      L('Shh… just kidding! In this library you can talk as much as you like.', 'Shh… ¡es broma! En esta biblioteca puedes hablar todo lo que quieras.', 'Shh… brincadeira! Nesta biblioteca você pode falar o quanto quiser.', 'Pst… nur ein Witz! In dieser Bibliothek darfst du so viel reden, wie du willst.',
        '[嘘|xū] … [开玩笑|kāi wán xiào] [的|de] ！ [在|zài] [这个|zhè ge] [图书馆|tú shū guǎn] ， [你|nǐ] [想|xiǎng] [说|shuō] [多少|duō shǎo] [话|huà] [都|dōu] [可以|kě yǐ] 。', 'シーッ … [冗談|じょうだん] です ！ この [図書館|としょかん] で は 、 いくら [話|はな]して も いい ん です よ 。'),
      L('As a kid I said I’d read every book in Alba. I’m still working on it!', 'De pequeña dije que leería todos los libros de Alba. ¡Todavía estoy en ello!', 'Quando eu era pequena, eu disse que ia ler todos os livros de Alba. Ainda estou nessa!', 'Als Kind habe ich gesagt, ich würde jedes Buch in Alba lesen. Ich bin noch dabei!',
        '[我|wǒ] [小|xiǎo] [时候|shí hou] [说|shuō] [过|guo] ， [我|wǒ] [要|yào] [读完|dú wán] [阿尔巴|Ā ěr bā] [所有|suǒ yǒu] [的|de] [书|shū] 。 [我|wǒ] [还|hái] [在|zài] [读|dú] [呢|ne] ！', '[子|こ]ども の ころ 、 アルバ の [本|ほん] を ぜんぶ [読|よ]む って [言|い]いました 。 まだ [読|よ]んで いる [途中|とちゅう] です ！'),
    ],
    sami: [
      L('…h-hi.', '…h-hola.', '…o-oi.', '…h-hallo.', '… [你|nǐ] … [你好|nǐ hǎo] 。', '… こ 、 こんにちは 。'),
      L('At my old school, they laughed when I spoke. So now I… don’t.', 'En mi otra escuela se reían cuando hablaba. Así que ahora… no hablo.', 'Na minha outra escola, riam quando eu falava. Então agora eu… não falo.', 'In meiner alten Schule haben sie gelacht, wenn ich gesprochen habe. Also rede ich jetzt… nicht.',
        '[在|zài] [以前|yǐ qián] [的|de] [学校|xué xiào] ， [我|wǒ] [一|yī] [说话|shuō huà] ， [他们|tā men] [就|jiù] [笑|xiào] 。 [所以|suǒ yǐ] [现在|xiàn zài] [我|wǒ] … [不|bù] [说|shuō] [了|le] 。', '[前|まえ] の [学校|がっこう] で 、 わたし が [話|はな]す と 、 みんな [笑|わら]った の 。 だから [今|いま] は … [話|はな]さない 。'),
    ],
    samiBrave: [
      L('Tomorrow I’ll talk with everyone. You said so!', 'Mañana hablaré con todos. ¡Tú lo dijiste!', 'Amanhã eu vou falar com todo mundo. Você disse!', 'Morgen werde ich mit allen reden. Du hast es gesagt!',
        '[明天|míng tiān] [我|wǒ] [会|huì] [跟|gēn] [大家|dà jiā] [说话|shuō huà] 。 [你|nǐ] [说|shuō] [的|de] ！', '[明日|あした] は 、 みんな と [話|はな]す つもり 。 そう [言|い]った でしょ ！'),
    ],
    nilo: [
      L('Fresh bread! Marta taught me everything. Well, almost: she keeps one secret.', '¡Pan recién hecho! Marta me lo enseñó todo. Bueno, casi: se guarda un secreto.', 'Pão fresquinho! A Marta me ensinou tudo. Quer dizer, quase: ela guarda um segredo.', 'Frisches Brot! Marta hat mir alles beigebracht. Na ja, fast alles: Ein Geheimnis behält sie für sich.',
        '[新鲜|xīn xiān] [的|de] [面包|miàn bāo] ！ [玛尔塔|Mǎ ěr tǎ] [什么|shén me] [都|dōu] [教|jiāo] [我|wǒ] [了|le] 。 [好吧|hǎo ba] ， [差不多|chà bu duō] ： [她|tā] [还有|hái yǒu] [一个|yī gè] [秘密|mì mì] 。', '[焼|や]きたて の パン です よ ！ マルタ さん に ぜんぶ [教|おそ]わりました 。 まあ 、 ほとんど ぜんぶ 。 [一|ひと]つ だけ [秘密|ひみつ] が ある ん です 。'),
      L('The oven runs on sunlight now. The bread still tastes like before!', 'Ahora el horno funciona con luz del sol. ¡El pan sigue sabiendo como antes!', 'Agora o forno funciona com luz do sol. O pão continua com o mesmo gosto!', 'Der Ofen läuft jetzt mit Sonnenlicht. Das Brot schmeckt immer noch wie früher!',
        '[现在|xiàn zài] [烤箱|kǎo xiāng] [用|yòng] [太阳|tài yáng] [光|guāng] 。 [面包|miàn bāo] [还是|hái shi] [以前|yǐ qián] [的|de] [味道|wèi dao] ！', 'オーブン は [今|いま] 、 [太陽|たいよう] の [光|ひかり] で [動|うご]きます 。 パン の [味|あじ] は [昔|むかし] の まま です ！'),
      L('{cat}, the cat, sleeps on the flour sacks. Don’t tell Marta.', 'Migas, la gata, duerme en los sacos de harina. No se lo digas a Marta.', 'A Farelo, a gata, dorme nos sacos de farinha. Não conta pra Marta.', 'Krümel, die Katze, schläft auf den Mehlsäcken. Sag’s nicht Marta.',
        '[小麦|Xiǎo mài] [这|zhè] [只|zhī] [猫|māo] [在|zài] [面粉|miàn fěn] [袋|dài] [上|shàng] [睡觉|shuì jiào] 。 [别|bié] [告诉|gào su] [玛尔塔|Mǎ ěr tǎ] 。', '[猫|ねこ] の コムギ は 、 [小麦粉|こむぎこ] の [袋|ふくろ] の [上|うえ] で [寝|ね]て います 。 マルタ さん に は ないしょ です よ 。'),
    ],
    tadeo: [
      L('These doors… I’ll get them open. Somehow.', 'Estas puertas… las abriré. De alguna manera.', 'Estas portas… eu vou abrir. De algum jeito.', 'Diese Türen… ich werde sie aufkriegen. Irgendwie.',
        '[这|zhè] [两|liǎng] [扇|shàn] [门|mén] … [我|wǒ] [会|huì] [打开|dǎ kāi] [的|de] 。 [总会|zǒng huì] [有|yǒu] [办法|bàn fǎ] 。', 'この [扉|とびら] … きっと [開|あ]けて みせます 。 なんとか して 。'),
    ],
    tadeoAfter: [
      L('Every board in this theater: I’ll fix them all. Promise!', 'Cada tabla de este teatro: las arreglaré todas. ¡Prometido!', 'Cada tábua deste teatro: eu vou consertar todas. Prometido!', 'Jedes Brett in diesem Theater: Ich werde sie alle reparieren. Versprochen!',
        '[这个|zhè ge] [剧院|jù yuàn] [的|de] [每|měi] [块|kuài] [木板|mù bǎn] ， [我|wǒ] [都|dōu] [会|huì] [修好|xiū hǎo] 。 [说|shuō] [到|dào] [做到|zuò dào] ！', 'この [劇場|げきじょう] の [板|いた] 、 ぜんぶ [直|なお]す つもり です 。 [約束|やくそく] です ！'),
    ],
  };

  // ------------------------------------------------------------ readable signs (SIGNS.read: each line in the language, its English on request)
  const SIGNS = {
    tram: { tag: 'The solar tram’s stop', lines: [
      L('Solar tram', 'Tranvía solar', 'Bonde solar', 'Solarbahn', '[太阳能|tài yáng néng] [电车|diàn chē]', 'ソーラー [電車|でんしゃ]'),
      L('Next tram: in five minutes', 'Próximo tranvía: en cinco minutos', 'Próximo bonde: em cinco minutos', 'Nächste Bahn: in fünf Minuten', '[下|xià] [一|yī] [班|bān] [电车|diàn chē] ： [五|wǔ] [分钟|fēn zhōng] [后|hòu]', '[次|つぎ] の [電車|でんしゃ] ： [五分後|ごふんご]'),
      L('The last one will leave at ten at night', 'El último saldrá a las diez de la noche', 'O último vai sair às dez da noite', 'Die letzte wird um zehn Uhr abends fahren', '[末班车|mò bān chē] [晚上|wǎn shang] [十|shí] [点|diǎn] [出发|chū fā]', '[最終|さいしゅう] は [夜|よる] [十時|じゅうじ] に [出|で]る [予定|よてい]') ] },
    board: { tag: 'The plaza’s notice board', lines: [
      L('Tomorrow: the Festival of Voices!', 'Mañana: ¡la Fiesta de las Voces!', 'Amanhã: a Festa das Vozes!', 'Morgen: das Fest der Stimmen!', '[明天|míng tiān] ： [声音节|Shēng yīn jié] ！', '[明日|あした] ： 「 [声|こえ] の [祭|まつ]り 」 ！'),
      L('Who will play the drum? Talk to Marta!', '¿Quién tocará el tambor? ¡Habla con Marta!', 'Quem vai tocar o tambor? Fala com a Marta!', 'Wer wird die Trommel spielen? Sprich mit Marta!', '[谁|shéi] [会|huì] [打鼓|dǎ gǔ] ？ [找|zhǎo] [玛尔塔|Mǎ ěr tǎ] ！', 'だれ が [太鼓|たいこ] を [叩|たた]く ？ マルタ さん まで ！'),
      L('The new library will open at nine', 'La biblioteca nueva abrirá a las nueve', 'A biblioteca nova vai abrir às nove', 'Die neue Bibliothek wird um neun öffnen', '[新|xīn] [图书馆|tú shū guǎn] [九|jiǔ] [点|diǎn] [开门|kāi mén]', '[新|あたら]しい [図書館|としょかん] は [九時|くじ] に [開|あ]きます') ] },
    chalk: { tag: 'The bakery’s chalkboard', lines: [
      L('Today: honey bread', 'Hoy: pan de miel', 'Hoje: pão de mel', 'Heute: Honigbrot', '[今天|jīn tiān] ： [蜂蜜|fēng mì] [面包|miàn bāo]', '[今日|きょう] ： はちみつ パン'),
      L('Tomorrow: festival bread!', 'Mañana: ¡pan de la fiesta!', 'Amanhã: pão da festa!', 'Morgen: Festbrot!', '[明天|míng tiān] ： [节日|jié rì] [面包|miàn bāo] ！', '[明日|あした] ： お[祭|まつ]り パン ！') ] },
    guest: { tag: 'The library’s guest book', lines: [
      L('Tomorrow I’ll play the guitar in the plaza. (Tito)', 'Mañana tocaré la guitarra en la plaza. (Tito)', 'Amanhã eu vou tocar violão na praça. (Tito)', 'Morgen werde ich auf dem Platz Gitarre spielen. (Tito)', '[明天|míng tiān] [我|wǒ] [会|huì] [在|zài] [广场|guǎng chǎng] [弹|tán] [吉他|jí tā] 。 （ [蒂托|Dì tuō] ）', '[明日|あした] 、 [広場|ひろば] で ギター を [弾|ひ]く つもり です 。 （ ティト ）'),
      L('Tomorrow I’ll bake bread for the whole town. (Marta)', 'Mañana hornearé pan para todo el pueblo. (Marta)', 'Amanhã eu vou assar pão pra cidade inteira. (Marta)', 'Morgen werde ich Brot für das ganze Dorf backen. (Marta)', '[明天|míng tiān] [我|wǒ] [会|huì] [给|gěi] [全|quán] [镇|zhèn] [烤|kǎo] [面包|miàn bāo] 。 （ [玛尔塔|Mǎ ěr tǎ] ）', '[明日|あした] 、 [町|まち] の みんな に パン を [焼|や]く つもり です 。 （ マルタ ）'),
      L('Tomorrow I’ll train with the kids. (Bruno)', 'Mañana entrenaré con los niños. (Bruno)', 'Amanhã eu vou treinar com as crianças. (Bruno)', 'Morgen werde ich mit den Kindern trainieren. (Bruno)', '[明天|míng tiān] [我|wǒ] [会|huì] [跟|gēn] [孩子们|hái zi men] [练功|liàn gōng] 。 （ [布鲁诺|Bù lǔ nuò] ）', '[明日|あした] 、 [子|こ]ども たち と [練習|れんしゅう] する つもり です 。 （ ブルーノ ）'),
      L('Tomorrow we’ll play football in the plaza. (Nico)', 'Mañana jugaremos al fútbol en la plaza. (Nico)', 'Amanhã a gente vai jogar bola na praça. (Nico)', 'Morgen werden wir auf dem Platz Fußball spielen. (Nico)', '[明天|míng tiān] [我们|wǒ men] [会|huì] [在|zài] [广场|guǎng chǎng] [踢|tī] [足球|zú qiú] 。 （ [尼科|Ní kē] ）', '[明日|あした] 、 [広場|ひろば] で サッカー を する つもり ！ （ ニコ ）'),
      L('Tomorrow the tram will leave at seven. (Beto)', 'Mañana el tranvía saldrá a las siete. (Beto)', 'Amanhã o bonde vai sair às sete. (Beto)', 'Morgen wird die Straßenbahn um sieben abfahren. (Beto)', '[明天|míng tiān] [电车|diàn chē] [会|huì] [在|zài] [七|qī] [点|diǎn] [出发|chū fā] 。 （ [贝托|Bèi tuō] ）', '[明日|あした] 、 [電車|でんしゃ] は [七時|しちじ] に [出|で]る [予定|よてい] です 。 （ ベト ）') ] },
    poster: { tag: 'A poster on the theater’s door', lines: [
      L('The Festival of Voices', 'La Fiesta de las Voces', 'A Festa das Vozes', 'Das Fest der Stimmen', '[声音节|Shēng yīn jié]', '「 [声|こえ] の [祭|まつ]り 」'),
      L('Tonight, in the old theater. Everyone will sing!', 'Esta noche, en el viejo teatro. ¡Todos cantarán!', 'Hoje à noite, no velho teatro. Todo mundo vai cantar!', 'Heute Abend, im alten Theater. Alle werden singen!', '[今天|jīn tiān] [晚上|wǎn shang] ， [在|zài] [老|lǎo] [剧院|jù yuàn] 。 [大家|dà jiā] [都|dōu] [会|huì] [唱歌|chàng gē] ！', '[今夜|こんや] 、 [古|ふる]い [劇場|げきじょう] で 。 みんな で [歌|うた]う つもり ！') ] },
  };

  // the kids' notes in the time capsule (buried today, read tomorrow): what each said they'd be
  const CAPNOTES = {
    beto: L('In ten years, I’ll drive a train!', '¡En diez años, conduciré un tren!', 'Daqui a dez anos, eu vou dirigir um trem!', 'In zehn Jahren werde ich einen Zug fahren!', '[十|shí] [年|nián] [后|hòu] ， [我|wǒ] [会|huì] [开|kāi] [火车|huǒ chē] ！', '[十年後|じゅうねんご] 、 [汽車|きしゃ] を [運転|うんてん] する つもり ！'),
    sofi: L('I’ll paint the whole town!', '¡Pintaré todo el pueblo!', 'Eu vou pintar a cidade inteira!', 'Ich werde das ganze Dorf malen!', '[我|wǒ] [会|huì] [画|huà] [整个|zhěng gè] [小镇|xiǎo zhèn] ！', '[町|まち] を ぜんぶ [描|か]く つもり ！'),
    luci: L('I’ll read every book in Alba!', '¡Leeré todos los libros de Alba!', 'Eu vou ler todos os livros de Alba!', 'Ich werde jedes Buch in Alba lesen!', '[我|wǒ] [会|huì] [读完|dú wán] [阿尔巴|Ā ěr bā] [所有|suǒ yǒu] [的|de] [书|shū] ！', 'アルバ の [本|ほん] を ぜんぶ [読|よ]む つもり ！'),
  };

  // ------------------------------------------------------------ demonstrations: whole in the language, the shown words glossed
  // (STORY.demoLine; each form is heard here before any box asks for it)
  const DEMO = {
    'd.tito': L('At the festival I’ll play the guitar… and everyone will sing!', '¡En la fiesta tocaré la guitarra… y todos cantarán!', 'Na festa eu vou tocar violão… e todo mundo vai cantar!', 'Auf dem Fest werde ich Gitarre spielen… und alle werden singen!',
      '[在|zài] [节日|jié rì] [上|shàng] ， [我|wǒ] [会|huì] [弹|tán] [吉他|jí tā] … [大家|dà jiā] [都|dōu] [会|huì] [唱歌|chàng gē] ！', 'お[祭|まつ]り で は 、 ギター を [弾|ひ]く つもり です … みんな も [歌|うた]う でしょう ！'),
    'd.sofi': L('I’ll paint the festival’s posters. Big ones, full of color!', 'Pintaré los carteles de la fiesta. ¡Grandes y llenos de color!', 'Eu vou pintar os cartazes da festa. Grandes e cheios de cor!', 'Ich werde die Plakate für das Fest malen. Groß und ganz bunt!',
      '[我|wǒ] [会|huì] [给|gěi] [节日|jié rì] [画|huà] [海报|hǎi bào] 。 [又|yòu] [大|dà] [又|yòu] [好看|hǎo kàn] ！', 'お[祭|まつ]り の ポスター を [描|か]く つもり です 。 [大|おお]きくて 、 [色|いろ] いっぱい の ！'),
    'd.beto': L('And I’ll take everyone to the theater in my tram. Free rides!', 'Y yo llevaré a todos al teatro en mi tranvía. ¡Gratis!', 'E eu vou levar todo mundo pro teatro no meu bonde. De graça!', 'Und ich werde alle mit meiner Straßenbahn zum Theater bringen. Umsonst!',
      '[我|wǒ] [会|huì] [开|kāi] [电车|diàn chē] [送|sòng] [大家|dà jiā] [去|qù] [剧院|jù yuàn] 。 [免费|miǎn fèi] ！', 'ぼく は [電車|でんしゃ] で みんな を [劇場|げきじょう] に [運|はこ]ぶ つもり です 。 ただ です よ ！'),
    'd.tadeo': L('It’s afraid. Tell it the opposite. Like this: «Nobody will laugh. Tomorrow I’ll fix these doors.»',
      'Tiene miedo. Hay que decirle lo contrario. Así: «Nadie se reirá. Mañana arreglaré estas puertas.»',
      'Está com medo. Tem que dizer o contrário. Assim: «Ninguém vai rir. Amanhã eu vou consertar estas portas.»',
      'Sie hat Angst. Man muss ihr das Gegenteil sagen. So: «Niemand wird lachen. Morgen werde ich diese Türen reparieren.»',
      '[它|tā] [在|zài] [害怕|hài pà] 。 [要|yào] [跟|gēn] [它|tā] [说|shuō] [相反|xiāng fǎn] [的|de] [话|huà] 。 [像|xiàng] [这样|zhè yàng] ： “ [没有|méi yǒu] [人|rén] [会|huì] [笑|xiào] 。 [明天|míng tiān] [我|wǒ] [会|huì] [修好|xiū hǎo] [这|zhè] [两|liǎng] [扇|shàn] [门|mén] 。 ”',
      '[怖|こわ]がって いる ん です 。 [反対|はんたい] の こと を [言|い]って あげましょう 。 こう です 。 「 だれ も [笑|わら]わない でしょう 。 [明日|あした] 、 この [扉|とびら] を [直|なお]す つもり です 。 」'),
    'd.foyer': L('In here, nothing happens right away. Watch: «{mimo} will jump on the mask.» First they laugh… then it happens!',
      'Aquí dentro nada pasa enseguida. Mira: «{mimo} saltará sobre la máscara». Primero se ríen… ¡y luego pasa!',
      'Aqui dentro nada acontece na hora. Olha: «O {mimo} vai pular na máscara». Primeiro elas riem… e depois acontece!',
      'Hier drin passiert nichts sofort. Schau: «{mimo} wird auf die Maske springen.» Zuerst lachen sie… und dann passiert es!',
      '[在|zài] [这里|zhè lǐ] ， [什么|shén me] [都|dōu] [不会|bù huì] [马上|mǎ shàng] [发生|fā shēng] 。 [你|nǐ] [看|kàn] ： “ {mimo} [会|huì] [跳到|tiào dào] [面具|miàn jù] [上|shàng] 。 ” [它们|tā men] [先|xiān] [笑|xiào] … [然后|rán hòu] [才|cái] [发生|fā shēng] ！',
      'ここ で は 、 すぐ に は [何|なに] も [起|お]きません 。 [見|み]て いて ください 。 「 {mimo} は [仮面|かめん] に [跳|と]ぶ でしょう 。 」 まず [仮面|かめん] が [笑|わら]って … それ から [起|お]きる ん です ！'),
    'd.balc': L('See how that one rises? «It’ll laugh from above!» If it ducks: «It’ll laugh from below!» Say it before it happens, and the laugh can’t reach you.',
      '¿Ves cómo sube esa? «¡Se reirá por arriba!» Si se agacha: «¡Se reirá por abajo!» Si lo dices antes, la risa no te alcanza.',
      'Está vendo como aquela sobe? «Ela vai rir por cima!» Se ela se abaixar: «Ela vai rir por baixo!» Se você disser antes, a risada não te pega.',
      'Siehst du, wie die da hochgeht? «Sie wird von oben lachen!» Wenn sie sich duckt: «Sie wird von unten lachen!» Wenn du es vorher sagst, erreicht dich das Lachen nicht.',
      '[看|kàn] [那个|nà ge] [往|wǎng] [上|shàng] [升|shēng] [了|le] ？ “ [它|tā] [会|huì] [从|cóng] [上面|shàng miàn] [笑|xiào] ！ ” [要是|yào shi] [它|tā] [蹲|dūn] [下|xià] ： “ [它|tā] [会|huì] [从|cóng] [下面|xià miàn] [笑|xiào] ！ ” [提前|tí qián] [说|shuō] [出来|chū lai] ， [笑声|xiào shēng] [就|jiù] [碰不到|pèng bu dào] [你|nǐ] 。',
      'あの [仮面|かめん] 、 [上|うえ] に [上|あ]がった でしょう ？ 「 [上|うえ] から [笑|わら]う でしょう ！ 」 [下|さ]がったら 、 「 [下|した] から [笑|わら]う でしょう ！ 」 [先|さき] に [言|い]えば 、 [笑|わら]い[声|ごえ] は [届|とど]きません 。'),
    'd.loft': L('So first we set a trap: «If they come down, {mimo} will hit them.» «If», and what they do… then what {mimo} will do.',
      'Así que primero ponemos una trampa: «Si bajan, {mimo} las golpeará». «Si» y lo que hacen… luego lo que hará {mimo}.',
      'Então primeiro a gente arma uma armadilha: «Se elas descerem, o {mimo} vai bater nelas». «Se» e o que elas fizerem… depois o que o {mimo} vai fazer.',
      'Also stellen wir zuerst eine Falle: «Wenn sie herunterkommen, wird {mimo} sie schlagen.» «Wenn» und was sie tun… dann, was {mimo} tun wird.',
      '[所以|suǒ yǐ] [我们|wǒ men] [先|xiān] [设|shè] [个|gè] [陷阱|xiàn jǐng] ： “ [如果|rú guǒ] [它们|tā men] [扑|pū] [下来|xià lai] ， {mimo} [就|jiù] [打|dǎ] [它们|tā men] 。 ” [先|xiān] [说|shuō] “ [如果|rú guǒ] ” … [再|zài] [说|shuō] {mimo} [会|huì] [做|zuò] [什么|shén me] 。',
      'だから 、 まず わな を しかけましょう 。 「 [降|お]りて きたら 、 {mimo} が [打|う]つ 。 」 「 たら 」 で [始|はじ]めて … {mimo} が する こと を [言|い]う ん です 。'),
    'd.cap': L('I’m writing mine: «In ten years, I’ll drive a train!»', 'Yo escribo el mío: «¡En diez años, conduciré un tren!»', 'Eu vou escrever o meu: «Daqui a dez anos, eu vou dirigir um trem!»', 'Ich schreibe meins: «In zehn Jahren werde ich einen Zug fahren!»',
      '[我|wǒ] [写|xiě] [我|wǒ] [的|de] ： “ [十|shí] [年|nián] [后|hòu] ， [我|wǒ] [会|huì] [开|kāi] [火车|huǒ chē] ！ ”', 'ぼく の は こう ： 「 [十年後|じゅうねんご] 、 [汽車|きしゃ] を [運転|うんてん] する つもり ！ 」'),
    'd.pond': L('If you can talk to the past… tell old Hugo: «If nobody cleans the channel, the pond will dry up.»',
      'Si puedes hablar con el pasado… díselo al viejo Hugo: «Si nadie limpia el canal, el estanque se secará».',
      'Se você puder falar com o passado… fala pro velho Hugo: «Se ninguém limpar o canal, o lago vai secar».',
      'Wenn du mit der Vergangenheit reden kannst… sag es dem alten Hugo: «Wenn niemand den Kanal sauber macht, wird der Teich austrocknen.»',
      '[如果|rú guǒ] [你|nǐ] [能|néng] [跟|gēn] [过去|guò qù] [说话|shuō huà] … [就|jiù] [告诉|gào su] [雨果|Yǔ guǒ] [爷爷|yé ye] ： “ [如果|rú guǒ] [没有|méi yǒu] [人|rén] [清理|qīng lǐ] [水渠|shuǐ qú] ， [池塘|chí táng] [就|jiù] [会|huì] [干|gān] 。 ”',
      '[過去|かこ] と [話|はな]せる なら … ウーゴ さん に [伝|つた]えて ください 。 「 だれ も [水路|すいろ] を [掃除|そうじ] しなかったら 、 [池|いけ] は [干上|ひあ]がる でしょう 。 」'),
    'd.sami': L('Sami, tomorrow you’ll talk with everyone. And nobody will laugh. You’ll see.', 'Sami, mañana hablarás con todos. Y nadie se reirá. Ya verás.', 'Sami, amanhã você vai falar com todo mundo. E ninguém vai rir. Você vai ver.', 'Sami, morgen wirst du mit allen reden. Und niemand wird lachen. Du wirst sehen.',
      '[萨米|Sà mǐ] ， [明天|míng tiān] [你|nǐ] [会|huì] [跟|gēn] [大家|dà jiā] [说话|shuō huà] 。 [没有|méi yǒu] [人|rén] [会|huì] [笑|xiào] 。 [你|nǐ] [等着|děng zhe] [看|kàn] [吧|ba] 。', 'サミ 、 [明日|あした] は みんな と [話|はな]せる でしょう 。 だれ も [笑|わら]わない でしょう 。 きっと ね 。'),
    'd.book': L('Mine: «Tomorrow I’ll open the library at nine.»', 'El mío: «Mañana abriré la biblioteca a las nueve».', 'O meu: «Amanhã eu vou abrir a biblioteca às nove».', 'Meiner: «Morgen werde ich die Bibliothek um neun öffnen.»',
      '[我|wǒ] [的|de] [是|shì] ： “ [明天|míng tiān] [我|wǒ] [会|huì] [九|jiǔ] [点|diǎn] [开|kāi] [图书馆|tú shū guǎn] 。 ”', 'わたし の は 「 [明日|あした] 、 [九時|くじ] に [図書館|としょかん] を [開|あ]ける つもり です 」 。'),
    'd.bread': L('Me, I’d like a honey bread… And you? What would you like?', 'A mí me gustaría un pan de miel… ¿Y a ti? ¿Qué te gustaría?', 'Eu gostaria de um pão de mel… E você? O que você gostaria?', 'Ich würde gern ein Honigbrot essen… Und du? Was würdest du gern essen?',
      '[我|wǒ] [想|xiǎng] [吃|chī] [蜂蜜|fēng mì] [面包|miàn bāo] … [你|nǐ] [呢|ne] ？ [你|nǐ] [想|xiǎng] [吃|chī] [什么|shén me] ？', 'ぼく は はちみつ パン が いい な … あなた は ？ [何|なに] が いい です か ？'),
  };
  const MARKS = {
    'd.tito': { es: [['tocaré', 'I’ll play'], ['cantarán', 'will sing']], pt: [['vou tocar', 'I’ll play'], ['vai cantar', 'will sing']], de: [['werde', 'will'], ['spielen', 'play'], ['singen', 'sing']],
      zh: [['[会|huì]', 'will'], ['[弹|tán]', 'play (strings)'], ['[唱歌|chàng gē]', 'sing']], ja: [['[弾|ひ]く つもり', 'will play'], ['[歌|うた]う でしょう', 'will sing']] },
    'd.sofi': { es: [['Pintaré', 'I’ll paint'], ['carteles', 'posters']], pt: [['vou pintar', 'I’ll paint'], ['cartazes', 'posters']], de: [['werde', 'will'], ['Plakate', 'posters'], ['malen', 'paint']],
      zh: [['[会|huì]', 'will'], ['[画|huà]', 'paint, draw'], ['[海报|hǎi bào]', 'posters']], ja: [['ポスター', 'posters'], ['[描|か]く つもり', 'will paint']] },
    'd.beto': { es: [['llevaré', 'I’ll take'], ['tranvía', 'tram']], pt: [['vou levar', 'I’ll take'], ['bonde', 'tram']], de: [['werde', 'will'], ['Straßenbahn', 'tram'], ['bringen', 'take, bring']],
      zh: [['[会|huì]', 'will'], ['[电车|diàn chē]', 'tram'], ['[送|sòng]', 'take (someone)']], ja: [['[電車|でんしゃ]', 'tram'], ['[運|はこ]ぶ つもり', 'will carry']] },
    'd.tadeo': { es: [['Nadie se reirá', 'nobody will laugh'], ['arreglaré', 'I’ll fix']], pt: [['Ninguém vai rir', 'nobody will laugh'], ['vou consertar', 'I’ll fix']], de: [['Niemand wird lachen', 'nobody will laugh'], ['reparieren', 'fix']],
      zh: [['[没有|méi yǒu] [人|rén] [会|huì] [笑|xiào]', 'nobody will laugh'], ['[修好|xiū hǎo]', 'fix']], ja: [['だれ も [笑|わら]わない でしょう', 'nobody will laugh'], ['[直|なお]す つもり', 'will fix']] },
    'd.foyer': { es: [['saltará', 'will jump'], ['máscara', 'mask'], ['luego', 'then']], pt: [['vai pular', 'will jump'], ['máscara', 'mask'], ['depois', 'then']], de: [['wird', 'will'], ['springen', 'jump'], ['Maske', 'mask']],
      zh: [['[会|huì]', 'will'], ['[面具|miàn jù]', 'mask'], ['[然后|rán hòu]', 'then']], ja: [['[跳|と]ぶ でしょう', 'will jump'], ['[仮面|かめん]', 'mask']] },
    'd.balc': { es: [['Se reirá', 'it’ll laugh'], ['por arriba', 'from above'], ['por abajo', 'from below']], pt: [['vai rir', 'will laugh'], ['por cima', 'from above'], ['por baixo', 'from below']],
      de: [['wird', 'will'], ['von oben', 'from above'], ['von unten', 'from below'], ['lachen', 'laugh']], zh: [['[会|huì]', 'will'], ['[上面|shàng miàn]', 'above'], ['[下面|xià miàn]', 'below']],
      ja: [['[上|うえ] から', 'from above'], ['[下|した] から', 'from below'], ['[笑|わら]う でしょう', 'will laugh']] },
    'd.loft': { es: [['Si', 'if'], ['bajan', 'they come down'], ['golpeará', 'will hit']], pt: [['Se', 'if'], ['descerem', 'come down'], ['vai bater', 'will hit']], de: [['Wenn', 'if, when'], ['herunterkommen', 'come down'], ['schlagen', 'hit']],
      zh: [['[如果|rú guǒ]', 'if'], ['[就|jiù]', 'then']], ja: [['[降|お]りて きたら', 'if (they) come down'], ['[打|う]つ', 'hit (will hit)']] },
    'd.cap': { es: [['En diez años', 'in ten years'], ['conduciré', 'I’ll drive']], pt: [['Daqui a dez anos', 'in ten years'], ['vou dirigir', 'I’ll drive']], de: [['In zehn Jahren', 'in ten years'], ['werde', 'will'], ['fahren', 'drive']],
      zh: [['[十|shí] [年|nián] [后|hòu]', 'in ten years'], ['[会|huì]', 'will'], ['[开|kāi]', 'drive']], ja: [['[十年後|じゅうねんご]', 'in ten years'], ['[運転|うんてん] する つもり', 'will drive']] },
    'd.pond': { es: [['Si', 'if'], ['limpia', 'cleans'], ['se secará', 'will dry up'], ['canal', 'channel'], ['estanque', 'pond']], pt: [['Se', 'if'], ['limpar', 'cleans'], ['vai secar', 'will dry up'], ['canal', 'channel']],
      de: [['Wenn', 'if'], ['sauber macht', 'cleans'], ['austrocknen', 'dry up'], ['Kanal', 'channel']], zh: [['[如果|rú guǒ]', 'if'], ['[清理|qīng lǐ]', 'clean out'], ['[水渠|shuǐ qú]', 'channel'], ['[干|gān]', 'dry up']],
      ja: [['[掃除|そうじ] しなかったら', 'if (nobody) cleans'], ['[干上|ひあ]がる でしょう', 'will dry up'], ['[水路|すいろ]', 'channel']] },
    'd.sami': { es: [['hablarás', 'you’ll talk'], ['con todos', 'with everyone'], ['nadie se reirá', 'nobody will laugh']], pt: [['vai falar', 'will talk'], ['com todo mundo', 'with everyone'], ['ninguém vai rir', 'nobody will laugh']],
      de: [['wirst', 'will (you)'], ['reden', 'talk'], ['niemand wird lachen', 'nobody will laugh']], zh: [['[会|huì]', 'will'], ['[说话|shuō huà]', 'talk'], ['[没有|méi yǒu] [人|rén] [会|huì] [笑|xiào]', 'nobody will laugh']],
      ja: [['[話|はな]せる でしょう', 'will be able to talk'], ['だれ も [笑|わら]わない でしょう', 'nobody will laugh']] },
    'd.book': { es: [['abriré', 'I’ll open'], ['a las nueve', 'at nine']], pt: [['vou abrir', 'I’ll open'], ['às nove', 'at nine']], de: [['werde', 'will'], ['öffnen', 'open'], ['um neun', 'at nine']],
      zh: [['[会|huì]', 'will'], ['[开|kāi]', 'open'], ['[九|jiǔ] [点|diǎn]', 'nine o’clock']], ja: [['[開|あ]ける つもり', 'will open'], ['[九時|くじ]', 'nine o’clock']] },
    'd.bread': { es: [['me gustaría', 'I’d like'], ['te gustaría', 'would you like']], pt: [['gostaria', 'would like']], de: [['würde gern', 'would like to'], ['würdest', 'would (you)']],
      zh: [['[想|xiǎng]', 'would like'], ['[蜂蜜|fēng mì] [面包|miàn bāo]', 'honey bread']], ja: [['が いい な', 'I’d like (it)'], ['はちみつ パン', 'honey bread']] },
  };

  // ------------------------------------------------------------ the tasks: title (English, {mimo} / {who} filled), frame (the box's
  // hint: ___ is the blank), chips ([the word, its English]), model (? shows it), grade { kind, … } (the graders below):
  //   fut   a future of one of these verbs (verb / alt; person: 1 I · 2 you · 3 he, she, it · 4 we · 6 they, null any; thing: for an S)
  //   fut1  any verb in the first person (a promise, a plan, a wish for yourself); thing: for an S
  //   pred  a prediction with a where (up / down: graded against what the mask showed) · trap  «si» + now, then the future
  //   nadie «nobody will laugh» (the opposite of the seal's fear) · wish  «me gustaría» + what you'd like
  const T5 = (es, pt, de, zh, ja) => ({ es, pt, de, zh, ja });
  const TASKS = {
    'p.tito': { title: 'Write Tito’s plan in Marta’s notebook: what will Tito do at the festival?',
      frame: T5('Tito ___ la guitarra.', 'O Tito vai ___ violão.', 'Tito wird Gitarre ___.', '[蒂托|Dì tuō] [会|huì] ___ [吉他|jí tā] 。', 'ティト さん は ギター を ___ つもり です 。'),
      chips: T5([['tocará', 'he’ll play']], [['tocar', 'play']], [['spielen', 'play']], [['[弹|tán]', 'play']], [['[弾|ひ]く', 'play']]),
      model: L('Tito will play the guitar.', 'Tito tocará la guitarra.', 'O Tito vai tocar violão.', 'Tito wird Gitarre spielen.', '[蒂托|Dì tuō] [会|huì] [弹|tán] [吉他|jí tā] 。', 'ティト さん は ギター を [弾|ひ]く つもり です 。'),
      grade: { kind: 'fut', person: 3, who: T5('tito', 'tito', 'tito', '[蒂托|Dì tuō]', 'ティト'),
        verb: T5('tocar', 'tocar', 'spielen', '[弹|tán]', '[弾|ひ]く'), alt: { zh: ['[弹奏|tán zòu]'], ja: ['ひく'] },
        thing: { es: ['guitarra', 'musica', 'música'], pt: ['violão', 'violao', 'guitarra', 'música', 'musica'], de: ['gitarre', 'musik'], zh: ['[吉他|jí tā]'], ja: ['ギター'] } } },
    'p.sofi': { title: 'Write Sofi’s plan in Marta’s notebook: what will Sofi do?',
      frame: T5('Sofi ___ los carteles.', 'A Sofi vai ___ os cartazes.', 'Sofi wird die Plakate ___.', '[索菲|Suǒ fēi] [会|huì] ___ [海报|hǎi bào] 。', 'ソフィ さん は ポスター を ___ つもり です 。'),
      chips: T5([['pintará', 'she’ll paint']], [['pintar', 'paint']], [['malen', 'paint']], [['[画|huà]', 'paint']], [['[描|か]く', 'paint']]),
      model: L('Sofi will paint the posters.', 'Sofi pintará los carteles.', 'A Sofi vai pintar os cartazes.', 'Sofi wird die Plakate malen.', '[索菲|Suǒ fēi] [会|huì] [画|huà] [海报|hǎi bào] 。', 'ソフィ さん は ポスター を [描|か]く つもり です 。'),
      grade: { kind: 'fut', person: 3, who: T5('sofi', 'sofi', 'sofi', '[索菲|Suǒ fēi]', 'ソフィ'),
        verb: T5('pintar', 'pintar', 'malen', '[画|huà]', '[描|か]く'), alt: { de: ['zeichnen', 'machen'], zh: ['[画画|huà huà]'], ja: ['かく', '[書|か]く'] },
        thing: { es: ['cartel', 'carteles'], pt: ['cartaz', 'cartazes'], de: ['plakat', 'plakate'], zh: ['[海报|hǎi bào]'], ja: ['ポスター'] } } },
    'p.beto': { title: 'Write Beto’s plan in Marta’s notebook: what will Beto do?',
      frame: T5('Beto ___ a todos en el tranvía.', 'O Beto vai ___ todo mundo no bonde.', 'Beto wird alle mit der Straßenbahn ___.', '[贝托|Bèi tuō] [会|huì] [开|kāi] [电车|diàn chē] ___ [大家|dà jiā] 。', 'ベト さん は [電車|でんしゃ] で みんな を ___ つもり です 。'),
      chips: T5([['llevará', 'he’ll take']], [['levar', 'take']], [['bringen', 'take']], [['[送|sòng]', 'take']], [['[運|はこ]ぶ', 'carry']]),
      model: L('Beto will take everyone in the tram.', 'Beto llevará a todos en el tranvía.', 'O Beto vai levar todo mundo no bonde.', 'Beto wird alle mit der Straßenbahn bringen.', '[贝托|Bèi tuō] [会|huì] [开|kāi] [电车|diàn chē] [送|sòng] [大家|dà jiā] 。', 'ベト さん は [電車|でんしゃ] で みんな を [運|はこ]ぶ つもり です 。'),
      grade: { kind: 'fut', person: 3, who: T5('beto', 'beto', 'beto', '[贝托|Bèi tuō]', 'ベト'),
        verb: T5('llevar', 'levar', 'bringen', '[送|sòng]', '[運|はこ]ぶ'), alt: { es: ['traer'], pt: ['trazer'], de: ['fahren'], zh: ['[开|kāi]', '[带|dài]', '[接|jiē]'], ja: ['はこぶ', '[乗|の]せる'] },
        thing: { es: ['tranvia', 'tranvía', 'todos'], pt: ['bonde', 'todo mundo', 'todos'], de: ['strassenbahn', 'straßenbahn', 'alle'], zh: ['[电车|diàn chē]', '[大家|dà jiā]'], ja: ['[電車|でんしゃ]', 'みんな'] } } },
    's.promise': { title: 'The doors are listening. Promise them something you’ll do, tomorrow, at the theater.',
      frame: T5('Mañana ___ en el teatro.', 'Amanhã eu vou ___ no teatro.', 'Morgen werde ich im Theater ___.', '[明天|míng tiān] [我|wǒ] [会|huì] [在|zài] [剧院|jù yuàn] ___ 。', '[明日|あした] 、 [劇場|げきじょう] で ___ つもり です 。'),
      chips: T5([['cantaré', 'I’ll sing'], ['bailaré', 'I’ll dance'], ['ayudaré', 'I’ll help']], [['cantar', 'sing'], ['dançar', 'dance'], ['ajudar', 'help']], [['singen', 'sing'], ['tanzen', 'dance'], ['helfen', 'help']],
        [['[唱歌|chàng gē]', 'sing'], ['[跳舞|tiào wǔ]', 'dance'], ['[帮忙|bāng máng]', 'help']], [['[歌|うた]う', 'sing'], ['[踊|おど]る', 'dance'], ['[手伝|てつだ]う', 'help']]),
      model: L('Tomorrow I’ll sing at the theater.', 'Mañana cantaré en el teatro.', 'Amanhã eu vou cantar no teatro.', 'Morgen werde ich im Theater singen.', '[明天|míng tiān] [我|wǒ] [会|huì] [在|zài] [剧院|jù yuàn] [唱歌|chàng gē] 。', '[明日|あした] 、 [劇場|げきじょう] で [歌|うた]う つもり です 。'),
      grade: { kind: 'fut1', thing: { es: ['teatro'], pt: ['teatro'], de: ['theater'], zh: ['[剧院|jù yuàn]'], ja: ['[劇場|げきじょう]'] }, where: T5('en el teatro', 'no teatro', 'im Theater', '[在|zài] [剧院|jù yuàn]', '[劇場|げきじょう] で') } },
    's.nadie': { title: 'Now the other half: the seal is afraid everyone will laugh. Tell it what will happen instead.',
      frame: T5('Nadie se ___.', 'Ninguém vai ___.', 'Niemand wird ___.', '[没有|méi yǒu] [人|rén] [会|huì] ___ 。', 'だれ も ___ でしょう 。'),
      chips: T5([['reirá', 'will laugh']], [['rir', 'laugh']], [['lachen', 'laugh']], [['[笑|xiào]', 'laugh']], [['[笑|わら]わない', 'won’t laugh']]),
      model: L('Nobody will laugh.', 'Nadie se reirá.', 'Ninguém vai rir.', 'Niemand wird lachen.', '[没有|méi yǒu] [人|rén] [会|huì] [笑|xiào] 。', 'だれ も [笑|わら]わない でしょう 。'),
      grade: { kind: 'nadie' } },
    'f.jump': { title: 'A mask hangs over the stairs. Tell {mimo} what it will do (it happens after the masks laugh).',
      frame: T5('{mimo} ___ sobre la máscara.', 'O {mimo} vai ___ na máscara.', '{mimo} wird auf die Maske ___.', '{mimo} [会|huì] ___ [面具|miàn jù] [上|shàng] 。', '{mimo} は [仮面|かめん] に ___ でしょう 。'),
      chips: T5([['saltará', 'will jump']], [['pular', 'jump']], [['springen', 'jump']], [['[跳到|tiào dào]', 'jump onto']], [['[跳|と]ぶ', 'jump']]),
      model: L('{mimo} will jump on the mask.', '{mimo} saltará sobre la máscara.', 'O {mimo} vai pular na máscara.', '{mimo} wird auf die Maske springen.', '{mimo} [会|huì] [跳到|tiào dào] [面具|miàn jù] [上|shàng] 。', '{mimo} は [仮面|かめん] に [跳|と]ぶ でしょう 。'),
      grade: { kind: 'fut', person: 3, verb: T5('saltar', 'pular', 'springen', '[跳|tiào]', '[跳|と]ぶ'), alt: { pt: ['saltar'], de: ['hupfen', 'hüpfen'], zh: ['[跳到|tiào dào]'], ja: ['とぶ', '[跳|と]びかかる'] },
        thing: { es: ['mascara', 'máscara'], pt: ['máscara', 'mascara'], de: ['maske'], zh: ['[面具|miàn jù]'], ja: ['[仮面|かめん]'] } } },
    'f.hit': { title: 'The second mask! Tell {mimo} what it will do to it.',
      frame: T5('{mimo} ___ la máscara.', 'O {mimo} vai ___ na máscara.', '{mimo} wird die Maske ___.', '{mimo} [会|huì] ___ [面具|miàn jù] 。', '{mimo} は [仮面|かめん] を ___ でしょう 。'),
      chips: T5([['golpeará', 'will hit']], [['bater', 'hit']], [['schlagen', 'hit']], [['[打|dǎ]', 'hit']], [['[打|う]つ', 'hit']]),
      model: L('{mimo} will hit the mask.', '{mimo} golpeará la máscara.', 'O {mimo} vai bater na máscara.', '{mimo} wird die Maske schlagen.', '{mimo} [会|huì] [打|dǎ] [面具|miàn jù] 。', '{mimo} は [仮面|かめん] を [打|う]つ でしょう 。'),
      grade: { kind: 'fut', person: 3, verb: T5('golpear', 'bater', 'schlagen', '[打|dǎ]', '[打|う]つ'), alt: { es: ['pegar'], de: ['hauen'], ja: ['うつ', 'たたく'] },
        thing: { es: ['mascara', 'máscara'], pt: ['máscara', 'mascara'], de: ['maske'], zh: ['[面具|miàn jù]'], ja: ['[仮面|かめん]'] } } },
    'f.push': { title: 'Now the fallen chandelier. Tell {mimo} what it will do.',
      frame: T5('{mimo} ___ la lámpara.', 'O {mimo} vai ___ o lustre.', '{mimo} wird den Leuchter ___.', '{mimo} [会|huì] ___ [吊灯|diào dēng] 。', '{mimo} は シャンデリア を ___ でしょう 。'),
      chips: T5([['empujará', 'will push']], [['empurrar', 'push']], [['schieben', 'push']], [['[推|tuī]', 'push']], [['[押|お]す', 'push']]),
      model: L('{mimo} will push the chandelier.', '{mimo} empujará la lámpara.', 'O {mimo} vai empurrar o lustre.', '{mimo} wird den Leuchter schieben.', '{mimo} [会|huì] [推|tuī] [吊灯|diào dēng] 。', '{mimo} は シャンデリア を [押|お]す でしょう 。'),
      grade: { kind: 'fut', person: 3, verb: T5('empujar', 'empurrar', 'schieben', '[推|tuī]', '[押|お]す'), alt: { de: ['drücken', 'drucken', 'stoßen', 'stossen'], ja: ['おす'] },
        thing: { es: ['lampara', 'lámpara'], pt: ['lustre'], de: ['leuchter'], zh: ['[吊灯|diào dēng]'], ja: ['シャンデリア'] } } },
    'b.pred': { title: 'A mask is moving! Say where it will laugh from, before it does.',
      frame: T5('Se reirá por ___.', 'Ela vai rir por ___.', 'Sie wird von ___ lachen.', '[它|tā] [会|huì] [从|cóng] ___ [笑|xiào] 。', '___ から [笑|わら]う でしょう 。'),
      chips: T5([['arriba', 'above'], ['abajo', 'below']], [['cima', 'above'], ['baixo', 'below']], [['oben', 'above'], ['unten', 'below']], [['[上面|shàng miàn]', 'above'], ['[下面|xià miàn]', 'below']], [['[上|うえ]', 'above'], ['[下|した]', 'below']]),
      model: L('It’ll laugh from above!', '¡Se reirá por arriba!', 'Ela vai rir por cima!', 'Sie wird von oben lachen!', '[它|tā] [会|huì] [从|cóng] [上面|shàng miàn] [笑|xiào] ！', '[上|うえ] から [笑|わら]う でしょう ！'),
      modelDown: L('It’ll laugh from below!', '¡Se reirá por abajo!', 'Ela vai rir por baixo!', 'Sie wird von unten lachen!', '[它|tā] [会|huì] [从|cóng] [下面|xià miàn] [笑|xiào] ！', '[下|した] から [笑|わら]う でしょう ！'),
      grade: { kind: 'pred' } },
    'l.trap1': { title: 'When the curtain rises, the masks will swoop down. Set a trap for {mimo} first.',
      frame: T5('Si bajan, {mimo} las ___.', 'Se elas descerem, o {mimo} vai ___ nelas.', 'Wenn sie herunterkommen, wird {mimo} sie ___.', '[如果|rú guǒ] [它们|tā men] [扑|pū] [下来|xià lai] ， {mimo} [就|jiù] ___ [它们|tā men] 。', '[降|お]りて きたら 、 {mimo} が ___ 。'),
      chips: T5([['golpeará', 'will hit']], [['bater', 'hit']], [['schlagen', 'hit']], [['[打|dǎ]', 'hit']], [['[打|う]つ', 'hit']]),
      model: L('If they come down, {mimo} will hit them.', 'Si bajan, {mimo} las golpeará.', 'Se elas descerem, o {mimo} vai bater nelas.', 'Wenn sie herunterkommen, wird {mimo} sie schlagen.', '[如果|rú guǒ] [它们|tā men] [扑|pū] [下来|xià lai] ， {mimo} [就|jiù] [打|dǎ] [它们|tā men] 。', '[降|お]りて きたら 、 {mimo} が [打|う]つ 。'),
      grade: { kind: 'trap', act: { ja: ['[打|う]つ', 'うつ', 'たたく', '[攻撃|こうげき]', '[跳|と]ぶ'] } } },
    'l.trap2': { title: 'The sandbag is swinging back. Set a trap: if it comes back, {mimo} will push it.',
      frame: T5('Si el saco vuelve, {mimo} lo ___.', 'Se o saco voltar, o {mimo} vai ___ o saco.', 'Wenn der Sack zurückkommt, wird {mimo} ihn ___.', '[如果|rú guǒ] [沙袋|shā dài] [荡|dàng] [回来|huí lai] ， {mimo} [就|jiù] ___ [它|tā] 。', '[砂袋|すなぶくろ] が [戻|もど]って きたら 、 {mimo} が ___ 。'),
      chips: T5([['empujará', 'will push']], [['empurrar', 'push']], [['schieben', 'push']], [['[推|tuī]', 'push']], [['[押|お]す', 'push']]),
      model: L('If the sandbag comes back, {mimo} will push it.', 'Si el saco vuelve, {mimo} lo empujará.', 'Se o saco voltar, o {mimo} vai empurrar o saco.', 'Wenn der Sack zurückkommt, wird {mimo} ihn schieben.', '[如果|rú guǒ] [沙袋|shā dài] [荡|dàng] [回来|huí lai] ， {mimo} [就|jiù] [推|tuī] [它|tā] 。', '[砂袋|すなぶくろ] が [戻|もど]って きたら 、 {mimo} が [押|お]す 。'),
      grade: { kind: 'trap', act: { ja: ['[押|お]す', 'おす', '[止|と]める', '[打|う]つ'] } } },
    'g.promise': { title: 'The seats tremble, afraid. Promise what the audience will do: listen.',
      frame: T5('Nosotros ___.', 'Nós vamos ___.', 'Wir werden ___.', '[我们|wǒ men] [会|huì] ___ 。', 'みんな で ___ つもり です 。'),
      chips: T5([['escucharemos', 'we’ll listen']], [['escutar', 'listen']], [['zuhören', 'listen']], [['[听|tīng]', 'listen']], [['[聞|き]く', 'listen']]),
      model: L('We’ll listen.', 'Escucharemos.', 'Nós vamos escutar.', 'Wir werden zuhören.', '[我们|wǒ men] [会|huì] [听|tīng] 。', 'みんな で [聞|き]く つもり です 。'),
      grade: { kind: 'fut', person: null, verb: T5('escuchar', 'escutar', 'zuhören', '[听|tīng]', '[聞|き]く'),
        alt: { es: ['oír', 'oir', 'aplaudir', 'cantar'], pt: ['ouvir', 'aplaudir', 'cantar'], de: ['zuhoren', 'hören', 'horen', 'klatschen', 'applaudieren', 'lauschen'], zh: ['[倾听|qīng tīng]', '[鼓掌|gǔ zhǎng]'], ja: ['きく', '[拍手|はくしゅ]'] } } },
    'c.you': { title: 'Write your note for the time capsule: what will you do in ten years?',
      frame: T5('En diez años, ___.', 'Daqui a dez anos, eu vou ___.', 'In zehn Jahren werde ich ___.', '[十|shí] [年|nián] [后|hòu] ， [我|wǒ] [会|huì] ___ 。', '[十年後|じゅうねんご] 、 ___ つもり です 。'),
      chips: T5([['viviré', 'I’ll live'], ['hablaré', 'I’ll speak'], ['viajaré', 'I’ll travel']], [['morar', 'live'], ['falar', 'speak'], ['viajar', 'travel']], [['wohnen', 'live'], ['sprechen', 'speak'], ['reisen', 'travel']],
        [['[住|zhù]', 'live'], ['[说|shuō]', 'speak'], ['[旅行|lǚ xíng]', 'travel']], [['[住|す]む', 'live'], ['[話|はな]す', 'speak'], ['[旅行|りょこう] する', 'travel']]),
      model: L('In ten years, I’ll speak {language} really well.', 'En diez años, hablaré español muy bien.', 'Daqui a dez anos, eu vou falar português muito bem.', 'In zehn Jahren werde ich sehr gut Deutsch sprechen.', '[十|shí] [年|nián] [后|hòu] ， [我|wǒ] [会|huì] [说|shuō] [很|hěn] [好|hǎo] [的|de] [中文|zhōng wén] 。', '[十年後|じゅうねんご] 、 [日本語|にほんご] を [上手|じょうず] に [話|はな]す つもり です 。'),
      grade: { kind: 'fut1' } },
    'c.dig': { title: 'Here, under the willow. Tell {mimo} what it will do.',
      frame: T5('{mimo} ___ aquí.', 'O {mimo} vai ___ aqui.', '{mimo} wird hier ___.', '{mimo} [会|huì] [在|zài] [这里|zhè lǐ] ___ 。', '{mimo} は ここ を ___ でしょう 。'),
      chips: T5([['cavará', 'will dig']], [['cavar', 'dig']], [['graben', 'dig']], [['[挖|wā]', 'dig']], [['[掘|ほ]る', 'dig']]),
      model: L('{mimo} will dig here.', '{mimo} cavará aquí.', 'O {mimo} vai cavar aqui.', '{mimo} wird hier graben.', '{mimo} [会|huì] [在|zài] [这里|zhè lǐ] [挖|wā] 。', '{mimo} は ここ を [掘|ほ]る でしょう 。'),
      grade: { kind: 'fut', person: 3, verb: T5('cavar', 'cavar', 'graben', '[挖|wā]', '[掘|ほ]る'), alt: { es: ['excavar'], pt: ['escavar'], de: ['ausgraben'], ja: ['ほる'] } } },
    'p.warn': { title: 'Warn Hugo about tomorrow: «si» and what happens now… then what will happen.',
      frame: T5('Si nadie limpia el canal, el estanque ___.', 'Se ninguém limpar o canal, o lago vai ___.', 'Wenn niemand den Kanal sauber macht, wird der Teich ___.', '[如果|rú guǒ] [没有|méi yǒu] [人|rén] [清理|qīng lǐ] [水渠|shuǐ qú] ， [池塘|chí táng] [就|jiù] [会|huì] ___ 。', 'だれ も [水路|すいろ] を [掃除|そうじ] しなかったら 、 [池|いけ] は ___ でしょう 。'),
      chips: T5([['se secará', 'will dry up']], [['secar', 'dry up']], [['austrocknen', 'dry up']], [['[干|gān]', 'dry up']], [['[干上|ひあ]がる', 'dry up']]),
      model: L('If nobody cleans the channel, the pond will dry up.', 'Si nadie limpia el canal, el estanque se secará.', 'Se ninguém limpar o canal, o lago vai secar.', 'Wenn niemand den Kanal sauber macht, wird der Teich austrocknen.', '[如果|rú guǒ] [没有|méi yǒu] [人|rén] [清理|qīng lǐ] [水渠|shuǐ qú] ， [池塘|chí táng] [就|jiù] [会|huì] [干|gān] 。', 'だれ も [水路|すいろ] を [掃除|そうじ] しなかったら 、 [池|いけ] は [干上|ひあ]がる でしょう 。'),
      grade: { kind: 'trap', act: { ja: ['[干上|ひあ]がる', 'ひあがる', 'でしょう'] }, thing: { es: ['estanque', 'canal', 'agua'], pt: ['lago', 'canal', 'agua', 'água'], de: ['teich', 'kanal', 'wasser'], zh: ['[池塘|chí táng]', '[水渠|shuǐ qú]'], ja: ['[池|いけ]', '[水路|すいろ]'] } } },
    'sa.t1': { title: 'Encourage Sami: tell Sami what will happen tomorrow.',
      frame: T5('Mañana ___ con todos.', 'Amanhã você vai ___ com todo mundo.', 'Morgen wirst du mit allen ___.', '[明天|míng tiān] [你|nǐ] [会|huì] [跟|gēn] [大家|dà jiā] ___ 。', '[明日|あした] は みんな と ___ でしょう 。'),
      chips: T5([['hablarás', 'you’ll talk']], [['falar', 'talk']], [['reden', 'talk']], [['[说话|shuō huà]', 'talk']], [['[話|はな]せる', 'be able to talk']]),
      model: L('Tomorrow you’ll talk with everyone.', 'Mañana hablarás con todos.', 'Amanhã você vai falar com todo mundo.', 'Morgen wirst du mit allen reden.', '[明天|míng tiān] [你|nǐ] [会|huì] [跟|gēn] [大家|dà jiā] [说话|shuō huà] 。', '[明日|あした] は みんな と [話|はな]せる でしょう 。'),
      grade: { kind: 'fut', person: 2, verb: T5('hablar', 'falar', 'reden', '[说话|shuō huà]', '[話|はな]せる'), alt: { es: ['charlar', 'jugar'], pt: ['conversar', 'brincar'], de: ['sprechen', 'spielen'], zh: ['[说|shuō]', '[聊天|liáo tiān]', '[玩|wán]'], ja: ['[話|はな]す', 'はなせる', 'はなす', '[遊|あそ]べる'] } } },
    'gb.you': { title: 'Write your line in the guest book: something you’ll do tomorrow.',
      frame: T5('Mañana ___.', 'Amanhã eu vou ___.', 'Morgen werde ich ___.', '[明天|míng tiān] [我|wǒ] [会|huì] ___ 。', '[明日|あした] 、 ___ つもり です 。'),
      chips: T5([['estudiaré', 'I’ll study'], ['visitaré', 'I’ll visit'], ['leeré', 'I’ll read']], [['estudar', 'study'], ['visitar', 'visit'], ['ler', 'read']], [['lernen', 'study'], ['besuchen', 'visit'], ['lesen', 'read']],
        [['[学习|xué xí]', 'study'], ['[看|kàn]', 'see, visit'], ['[读|dú]', 'read']], [['[勉強|べんきょう] する', 'study'], ['[行|い]く', 'go'], ['[読|よ]む', 'read']]),
      model: L('Tomorrow I’ll read a book from the library.', 'Mañana leeré un libro de la biblioteca.', 'Amanhã eu vou ler um livro da biblioteca.', 'Morgen werde ich ein Buch aus der Bibliothek lesen.', '[明天|míng tiān] [我|wǒ] [会|huì] [读|dú] [一|yī] [本|běn] [图书馆|tú shū guǎn] [的|de] [书|shū] 。', '[明日|あした] 、 [図書館|としょかん] の [本|ほん] を [読|よ]む つもり です 。'),
      grade: { kind: 'fut1' } },
    'br.you': { title: 'Tell Nilo what you’d like for the festival.',
      frame: T5('Me gustaría un pan de ___.', 'Eu gostaria de um pão de ___.', 'Ich würde gern ein ___brot essen.', '[我|wǒ] [想|xiǎng] [吃|chī] ___ [面包|miàn bāo] 。', '___ パン が いい な 。'),
      chips: T5([['queso', 'cheese'], ['chocolate', 'chocolate'], ['naranja', 'orange']], [['queijo', 'cheese'], ['chocolate', 'chocolate'], ['laranja', 'orange']], [['Käse', 'cheese'], ['Schokoladen', 'chocolate'], ['Orangen', 'orange']],
        [['[奶酪|nǎi lào]', 'cheese'], ['[巧克力|qiǎo kè lì]', 'chocolate'], ['[橙子|chéng zi]', 'orange']], [['チーズ', 'cheese'], ['チョコ', 'chocolate'], ['オレンジ', 'orange']]),
      model: L('I’d like a cheese bread.', 'Me gustaría un pan de queso.', 'Eu gostaria de um pão de queijo.', 'Ich würde gern ein Käsebrot essen.', '[我|wǒ] [想|xiǎng] [吃|chī] [奶酪|nǎi lào] [面包|miàn bāo] 。', 'チーズ パン が いい な 。'),
      grade: { kind: 'wish' } },
  };
  TASKS['sa.t2'] = Object.assign({}, TASKS['s.nadie'], { title: 'Sami is still afraid of the laughing. Tell Sami what nobody will do.' });

  // ------------------------------------------------------------ the boss fight's bubbles ([the language, English]): the Laughing
  // Gallery, and Tadeo coaching from the wings
  const FIGHT = {
    laugh: L('HA, HA, HA!', '¡JA, JA, JA!', 'HA, HA, HA!', 'HA, HA, HA!', '[哈哈哈|hā hā hā] ！', 'アハハハ ！'),
    taunt: L('They’ll laugh at you… the way they laughed at him.', 'Se reirán de ti… como se rieron de él.', 'Vão rir de você… como riram dele.', 'Sie werden dich auslachen… so wie sie ihn ausgelacht haben.',
      '[他们|tā men] [会|huì] [笑|xiào] [你|nǐ] … [就|jiù] [像|xiàng] [当年|dāng nián] [笑|xiào] [他|tā] [一样|yī yàng] 。', 'みんな あなた を [笑|わら]う でしょう … あの [子|こ] を [笑|わら]った よう に 。'),
    intro: L('Crack its masks! A plan lands next turn, a right prediction makes its laughter miss, and a trap springs.', '¡Rompe sus máscaras! Un plan llega en el turno siguiente, una predicción acertada hace fallar la risa, y una trampa salta.',
      'Quebra as máscaras! Um plano acontece no turno seguinte, uma previsão certa faz a risada errar, e uma armadilha dispara.', 'Zerbrich ihre Masken! Ein Plan wirkt in der nächsten Runde, eine richtige Vorhersage lässt das Lachen danebengehen, und eine Falle schnappt zu.',
      '[打碎|dǎ suì] [它|tā] [的|de] [面具|miàn jù] ！ [计划|jì huà] [下|xià] [一|yī] [回合|huí hé] [生效|shēng xiào] ， [说|shuō] [对|duì] [的|de] [预言|yù yán] [能|néng] [让|ràng] [笑声|xiào shēng] [落空|luò kōng] ， [陷阱|xiàn jǐng] [会|huì] [启动|qǐ dòng] 。',
      '[仮面|かめん] を [割|わ]って ！ [計画|けいかく] は [次|つぎ] の ターン に [当|あ]たる 。 [予言|よげん] が [当|あ]たれば [笑|わら]い は [外|はず]れる 。 わな も [効|き]く 。'),
    glimpse: L('It’s moving! Say where it’ll laugh from, before it does.', '¡Se mueve! Di por dónde se reirá, antes de que lo haga.', 'Está se mexendo! Diz por onde ela vai rir, antes que ela ria.', 'Sie bewegt sich! Sag, von wo sie lachen wird, bevor sie es tut.',
      '[它|tā] [在|zài] [动|dòng] ！ [在|zài] [它|tā] [笑|xiào] [之前|zhī qián] ， [说出|shuō chū] [它|tā] [会|huì] [从|cóng] [哪里|nǎ lǐ] [笑|xiào] 。', '[動|うご]いて いる ！ [笑|わら]う [前|まえ] に 、 どこ から [笑|わら]う か [言|い]って ！'),
    now: L('That’s today: tomorrow needs tomorrow’s words!', '¡Eso es hoy: el mañana necesita palabras de mañana!', 'Isso é hoje: o amanhã precisa de palavras de amanhã!', 'Das ist heute: Das Morgen braucht Wörter von morgen!',
      '[那|nà] [是|shì] [今天|jīn tiān] ： [明天|míng tiān] [要|yào] [用|yòng] [明天|míng tiān] [的|de] [话|huà] ！', 'それ は [今日|きょう] の [言葉|ことば] ！ [明日|あした] に は [明日|あした] の [言葉|ことば] を ！'),
    plan: L('A plan! It’ll land next turn.', '¡Un plan! Llegará en el próximo turno.', 'Um plano! Vai acontecer no próximo turno.', 'Ein Plan! Er wird in der nächsten Runde wirken.',
      '[一个|yī gè] [计划|jì huà] ！ [下|xià] [一|yī] [回合|huí hé] [会|huì] [生效|shēng xiào] 。', '[計画|けいかく] だ ！ [次|つぎ] の ターン に [当|あ]たる でしょう 。'),
    knew: L('You saw it coming!', '¡Lo viste venir!', 'Você viu chegando!', 'Du hast es kommen sehen!', '[你|nǐ] [早|zǎo] [就|jiù] [看出来|kàn chū lai] [了|le] ！', '[読|よ]めて いた ね ！'),
    trap: L('The trap is set…', 'La trampa está puesta…', 'A armadilha está armada…', 'Die Falle ist gestellt…', '[陷阱|xiàn jǐng] [设好|shè hǎo] [了|le] …', 'わな は しかけた …'),
    sprung: L('Trap!', '¡Trampa!', 'Armadilha!', 'Falle!', '[中|zhòng] [计|jì] [了|le] ！', 'わな だ ！'),
    phase2: L('The masks are gone… it’s just empty seats now, afraid. Tell it what the audience will do: «We’ll listen.»',
      'Las máscaras ya no están… ahora solo son butacas vacías, con miedo. Dile lo que hará el público: «Escucharemos».',
      'As máscaras sumiram… agora são só poltronas vazias, com medo. Diz o que a plateia vai fazer: «Nós vamos escutar».',
      'Die Masken sind weg… jetzt sind es nur leere Sitze, voller Angst. Sag ihr, was das Publikum tun wird: «Wir werden zuhören.»',
      '[面具|miàn jù] [都|dōu] [没有|méi yǒu] [了|le] … [现在|xiàn zài] [只|zhǐ] [剩|shèng] [害怕|hài pà] [的|de] [空|kōng] [座位|zuò wèi] 。 [告诉|gào su] [它|tā] [观众|guān zhòng] [会|huì] [做|zuò] [什么|shén me] ： “ [我们|wǒ men] [会|huì] [听|tīng] 。 ”',
      '[仮面|かめん] は もう ない … [残|のこ]った の は 、 [怖|こわ]がって いる [空|から] の [席|せき] だけ 。 [観客|かんきゃく] が する こと を [言|い]って あげて 。 「 みんな で [聞|き]く つもり です 。 」'),
    nohit: L('Don’t hit it now. It’s only afraid. Promise what the audience will do.', 'No la golpees ahora. Solo tiene miedo. Promete lo que hará el público.', 'Não bate nela agora. Ela só está com medo. Promete o que a plateia vai fazer.', 'Schlag sie jetzt nicht. Sie hat nur Angst. Versprich, was das Publikum tun wird.',
      '[现在|xiàn zài] [别|bié] [打|dǎ] [它|tā] 。 [它|tā] [只是|zhǐ shì] [害怕|hài pà] 。 [承诺|chéng nuò] [观众|guān zhòng] [会|huì] [做|zuò] [什么|shén me] 。', 'もう [打|う]たないで 。 [怖|こわ]がって いる だけ です 。 [観客|かんきゃく] が する こと を [約束|やくそく] して 。'),
    listen: L('…You’ll listen? …Really?', '…¿Escucharán? …¿De verdad?', '…Vão escutar? …De verdade?', '…Ihr werdet zuhören? …Wirklich?', '… [你们|nǐ men] [会|huì] [听|tīng] ？ … [真的|zhēn de] [吗|ma] ？', '… [聞|き]いて くれる の ？ … [本当|ほんとう] に ？'),
    yes: L('Listen… it’s quiet. A good quiet.', 'Escucha… hay silencio. Un silencio bueno.', 'Escuta… está quieto. Um silêncio bom.', 'Hör mal… es ist still. Eine gute Stille.',
      '[你|nǐ] [听|tīng] … [安静|ān jìng] [了|le] 。 [是|shì] [好|hǎo] [的|de] [安静|ān jìng] 。', '[聞|き]いて … [静|しず]か に なった 。 いい [静|しず]けさ です 。'),
    askPlan: L('First mask: tell {mimo} what it will do to it. The plan lands next turn.', 'Primera máscara: dile a {mimo} lo que le hará. El plan llega en el turno siguiente.',
      'Primeira máscara: diz ao {mimo} o que ele vai fazer com ela. O plano acontece no turno seguinte.', 'Erste Maske: Sag {mimo}, was es mit ihr machen wird. Der Plan wirkt in der nächsten Runde.',
      '[第一|dì yī] [个|gè] [面具|miàn jù] ： [告诉|gào su] {mimo} [它|tā] [会|huì] [做|zuò] [什么|shén me] 。 [计划|jì huà] [下|xià] [一|yī] [回合|huí hé] [生效|shēng xiào] 。',
      '[最初|さいしょ] の [仮面|かめん] ： {mimo} が どう する か [言|い]って 。 [計画|けいかく] は [次|つぎ] の ターン に [当|あ]たる 。'),
    askTrap: L('Last mask! They swoop when they laugh. Set a trap: «if they come down, {mimo} will hit them».', '¡Última máscara! Bajan en picado cuando se ríen. Pon una trampa: «Si bajan, {mimo} las golpeará».',
      'Última máscara! Elas mergulham quando riem. Arma uma armadilha: «Se elas descerem, o {mimo} vai bater nelas».', 'Letzte Maske! Sie stürzen herab, wenn sie lachen. Stell eine Falle: «Wenn sie herunterkommen, wird {mimo} sie schlagen».',
      '[最后|zuì hòu] [一个|yī gè] [面具|miàn jù] ！ [它|tā] [笑|xiào] [的|de] [时候|shí hou] [会|huì] [扑|pū] [下来|xià lai] 。 [设|shè] [一个|yī gè] [陷阱|xiàn jǐng] ： “ [如果|rú guǒ] [它们|tā men] [扑|pū] [下来|xià lai] ， {mimo} [就|jiù] [打|dǎ] [它们|tā men] 。 ”',
      '[最後|さいご] の [仮面|かめん] ！ [笑|わら]う と [降|お]りて くる 。 わな を しかけて ： 「 [降|お]りて きたら 、 {mimo} が [打|う]つ 。 」'),
    cmd: L('Hits don’t crack these masks. Tomorrow’s words do: a plan, a prediction, a trap.', 'Los golpes no rompen estas máscaras. Las palabras de mañana, sí: un plan, una predicción, una trampa.',
      'Golpes não quebram essas máscaras. As palavras de amanhã, sim: um plano, uma previsão, uma armadilha.', 'Schläge zerbrechen diese Masken nicht. Wörter von morgen schon: ein Plan, eine Vorhersage, eine Falle.',
      '[打|dǎ] [不|bù] [碎|suì] [这些|zhè xiē] [面具|miàn jù] 。 [明天|míng tiān] [的|de] [话|huà] [才|cái] [能|néng] ： [计划|jì huà] 、 [预言|yù yán] 、 [陷阱|xiàn jǐng] 。',
      'たたいて も [仮面|かめん] は [割|わ]れない 。 [明日|あした] の [言葉|ことば] なら [割|わ]れる ： [計画|けいかく] 、 [予言|よげん] 、 わな 。'),
    crack: L('No… my mask!', '¡No… mi máscara!', 'Não… minha máscara!', 'Nein… meine Maske!', '[不|bù] … [我|wǒ] [的|de] [面具|miàn jù] ！', 'あっ … [仮面|かめん] が ！'),
    other: L('It came from the other side! Watch which way the mask moves.', '¡Vino del otro lado! Mira hacia dónde se mueve la máscara.', 'Veio do outro lado! Olha para onde a máscara se mexe.', 'Es kam von der anderen Seite! Schau, wohin sich die Maske bewegt.',
      '[它|tā] [从|cóng] [另|lìng] [一|yī] [边|biān] [来|lái] [了|le] ！ [看|kàn] [面具|miàn jù] [往|wǎng] [哪|nǎ] [边|biān] [动|dòng] 。', '[反対|はんたい] [側|がわ] から [来|き]た ！ [仮面|かめん] が どっち に [動|うご]く か [見|み]て 。'),
  };
  // the boss in the battle tables (battle/lang.js species), and its bestiary line ([es, pt, de, zh, ja, en])
  const SPECIES = { es: { w: 'galería', pl: 'galerías', g: 'f', en: 'gallery' }, pt: { w: 'galeria', pl: 'galerias', g: 'f', en: 'gallery' }, de: { w: 'Galerie', pl: 'Galerien', g: 'f', en: 'gallery' },
    zh: { w: '[看台|kàn tái]', en: 'gallery', g: 'm', cl: '个', cls: ['个'] }, ja: { w: '[客席|きゃくせき]', en: 'gallery', g: 'm' } };
  const LORE = ['Filas de butacas grises que se ríen: el miedo a que se rían de ti, hecho enorme.', 'Fileiras de poltronas cinzentas que riem: o medo de que riam de você, que ficou enorme.',
    'Reihen grauer Sitze, die lachen: die Angst, ausgelacht zu werden, riesig geworden.', '[一排排|yī pái pái] [会|huì] [笑|xiào] [的|de] [灰色|huī sè] [座位|zuò wèi] ： [怕|pà] [被|bèi] [人|rén] [笑|xiào] [的|de] [恐惧|kǒng jù] ， [变|biàn] [得|de] [巨大|jù dà] 。',
    '[笑|わら]う [灰色|はいいろ] の [席|せき] の [列|れつ] 。 [笑|わら]われる の が [怖|こわ]い [気持|きも]ち が 、 [大|おお]きく なった もの 。', 'Rows of gray seats that laugh: the fear of being laughed at, grown huge.'];
  // Elio's echo in tomorrow's theater: the end of the speech he never finished (Chapter 4, CH4.word)
  const ECHO = L('Thank you, Alba!', '¡Gracias, Alba!', 'Obrigado, Alba!', 'Danke, Alba!', '[谢谢|xiè xie] ， [阿尔巴|Ā ěr bā] ！', 'ありがとう 、 アルバ ！', { where: 'Alba, tomorrow' });

  // ------------------------------------------------------------ the words of tomorrow (the teaching table: each is heard in use, in
  // the line named last, before any box asks for it). One per line: en ~ es ~ pt ~ de ~ zh ~ ja ~ where it's first heard
  const WORDS = `festival ~ la fiesta ~ a festa ~ das Fest ~ [节日|jié rì] ~ お[祭|まつ]り ~ m.t1
theater ~ el teatro ~ o teatro ~ das Theater ~ [剧院|jù yuàn] ~ [劇場|げきじょう] ~ n.f2
stage ~ el escenario ~ o palco ~ die Bühne ~ [舞台|wǔ tái] ~ [舞台|ぶたい] ~ h.stage1
seat ~ la butaca ~ a poltrona ~ der Sitz ~ [座位|zuò wèi] ~ [席|せき] ~ h.stage1
row ~ la fila ~ a fileira ~ die Reihe ~ [排|pái] ~ [列|れつ] ~ h.stage1
audience ~ el público ~ a plateia ~ das Publikum ~ [观众|guān zhòng] ~ [観客|かんきゃく] ~ phase2
mask ~ la máscara ~ a máscara ~ die Maske ~ [面具|miàn jù] ~ [仮面|かめん] ~ h.foyer1
foyer ~ el vestíbulo ~ o saguão ~ das Foyer ~ [门厅|mén tīng] ~ ロビー ~ h.foyer1
stairs ~ la escalera ~ a escada ~ die Treppe ~ [楼梯|lóu tī] ~ [階段|かいだん] ~ h.foyer1
chandelier ~ la lámpara ~ o lustre ~ der Leuchter ~ [吊灯|diào dēng] ~ シャンデリア ~ h.foyer2
heavy ~ pesado ~ pesado ~ schwer ~ [重|zhòng] ~ [重|おも]い ~ h.foyer2
strong ~ fuerte ~ forte ~ stark ~ [有|yǒu] [力气|lì qi] ~ [力持|ちからも]ち ~ h.foyer2
balcony box ~ el palco ~ o camarote ~ die Loge ~ [包厢|bāo xiāng] ~ ボックス[席|せき] ~ h.balc1
fly loft ~ el telar ~ o urdimento ~ der Schnürboden ~ [舞台|wǔ tái] [上方|shàng fāng] ~ すのこ ~ h.loft1
rope ~ la cuerda ~ a corda ~ das Seil ~ [绳子|shéng zi] ~ ロープ ~ h.loft1
sandbag ~ el saco de arena ~ o saco de areia ~ der Sandsack ~ [沙袋|shā dài] ~ [砂袋|すなぶくろ] ~ h.loft1
curtain ~ el telón ~ a cortina ~ der Vorhang ~ [幕布|mù bù] ~ [幕|まく] ~ h.loft1
lever ~ la palanca ~ a alavanca ~ der Hebel ~ [拉杆|lā gān] ~ レバー ~ h.loft1
trap ~ la trampa ~ a armadilha ~ die Falle ~ [陷阱|xiàn jǐng] ~ わな ~ d.loft
board, plank ~ la tabla ~ a tábua ~ das Brett ~ [木板|mù bǎn] ~ [板|いた] ~ t.open
blueprints ~ los planos ~ as plantas ~ die Pläne ~ [图纸|tú zhǐ] ~ [図面|ずめん] ~ t.open
door ~ la puerta ~ a porta ~ die Tür ~ [门|mén] ~ [扉|とびら] ~ t.t1
felt ~ el fieltro ~ o feltro ~ der Filz ~ [毛毡|máo zhān] ~ フェルト ~ t.t1
cold ~ frío ~ frio ~ kalt ~ [冰冰|bīng bīng] [的|de] ~ [冷|つめ]たい ~ t.t1
hammer ~ el martillo ~ o martelo ~ der Hammer ~ [锤子|chuí zi] ~ ハンマー ~ t.t2
saw ~ la sierra ~ o serrote ~ die Säge ~ [锯子|jù zi] ~ のこぎり ~ t.t2
crowbar ~ la palanca ~ o pé de cabra ~ das Brecheisen ~ [撬棍|qiào gùn] ~ バール ~ t.t2
to whisper ~ susurrar ~ sussurrar ~ flüstern ~ [小声|xiǎo shēng] [说话|shuō huà] ~ ささやく ~ t.t2
to melt ~ derretirse ~ derreter ~ schmelzen ~ [融化|róng huà] ~ [溶|と]ける ~ t.half
corner ~ la esquina ~ o canto ~ die Ecke ~ [角|jiǎo] ~ [角|かど] ~ t.half
carpenter ~ el carpintero ~ o carpinteiro ~ der Tischler ~ [木匠|mù jiang] ~ [大工|だいく] ~ m.t3
velvet ~ el terciopelo ~ o veludo ~ der Samt ~ [丝绒|sī róng] ~ ビロード ~ e.after
laughter ~ la risa ~ a risada ~ das Gelächter ~ [笑声|xiào shēng] ~ [笑|わら]い[声|ごえ] ~ m.t2
to laugh ~ reír ~ rir ~ lachen ~ [笑|xiào] ~ [笑|わら]う ~ seal, d.tadeo
nobody ~ nadie ~ ninguém ~ niemand ~ [没有|méi yǒu] [人|rén] ~ だれ も ~ d.tadeo
to fix ~ arreglar ~ consertar ~ reparieren ~ [修好|xiū hǎo] ~ [直|なお]す ~ d.tadeo
fear, afraid ~ el miedo ~ o medo ~ die Angst ~ [害怕|hài pà] ~ [怖|こわ]がる ~ d.tadeo
the opposite ~ lo contrario ~ o contrário ~ das Gegenteil ~ [相反|xiāng fǎn] ~ [反対|はんたい] ~ d.tadeo
to listen ~ escuchar ~ escutar ~ zuhören ~ [听|tīng] ~ [聞|き]く ~ phase2
voice ~ la voz ~ a voz ~ die Stimme ~ [声音|shēng yīn] ~ [声|こえ] ~ fe.open
speech ~ el discurso ~ o discurso ~ die Rede ~ [演讲|yǎn jiǎng] ~ スピーチ ~ n.f3
words ~ las palabras ~ as palavras ~ die Worte ~ [话|huà] ~ [言葉|ことば] ~ n.f1
echo ~ el eco ~ o eco ~ das Echo ~ [回声|huí shēng] ~ こだま ~ n.r2
crack ~ la grieta ~ a fenda ~ der Riss ~ [裂缝|liè fèng] ~ [裂|さ]け[目|め] ~ n.f4
the end ~ el final ~ o fim ~ das Ende ~ [结尾|jié wěi] ~ [終|お]わり ~ n.f3
healed ~ curado ~ curado ~ geheilt ~ [好|hǎo] [了|le] ~ [治|なお]った ~ n.f2
notebook ~ el cuaderno ~ o caderno ~ das Heft ~ [本子|běn zi] ~ ノート ~ m.t4
plan ~ el plan ~ o plano ~ der Plan ~ [计划|jì huà] ~ [計画|けいかく] ~ m.t3
promise ~ la promesa ~ a promessa ~ das Versprechen ~ [承诺|chéng nuò] ~ [約束|やくそく] ~ m.t1
poster ~ el cartel ~ o cartaz ~ das Plakat ~ [海报|hǎi bào] ~ ポスター ~ d.sofi
to paint ~ pintar ~ pintar ~ malen ~ [画|huà] ~ [描|か]く ~ d.sofi
color ~ el color ~ a cor ~ die Farbe ~ [颜色|yán sè] ~ [色|いろ] ~ d.sofi
guitar ~ la guitarra ~ o violão ~ die Gitarre ~ [吉他|jí tā] ~ ギター ~ d.tito
to play (music) ~ tocar ~ tocar ~ spielen ~ [弹|tán] ~ [弾|ひ]く ~ d.tito
to sing ~ cantar ~ cantar ~ singen ~ [唱歌|chàng gē] ~ [歌|うた]う ~ d.tito
everyone ~ todos ~ todo mundo ~ alle ~ [大家|dà jiā] ~ みんな ~ d.tito
tram ~ el tranvía ~ o bonde ~ die Straßenbahn ~ [电车|diàn chē] ~ [電車|でんしゃ] ~ d.beto
to take (someone) ~ llevar ~ levar ~ bringen ~ [送|sòng] ~ [運|はこ]ぶ ~ d.beto
free (no cost) ~ gratis ~ de graça ~ umsonst ~ [免费|miǎn fèi] ~ ただ ~ d.beto
to drive ~ conducir ~ dirigir ~ fahren ~ [开|kāi] ~ [運転|うんてん] する ~ d.cap
train ~ el tren ~ o trem ~ der Zug ~ [火车|huǒ chē] ~ [汽車|きしゃ] ~ d.cap
next stop ~ la próxima parada ~ a próxima parada ~ der nächste Halt ~ [下|xià] [一|yī] [站|zhàn] ~ [次|つぎ] ~ chat beto
sun, sunshine ~ el sol ~ o sol ~ die Sonne ~ [太阳|tài yáng] ~ [太陽|たいよう] ~ chat beto
panel ~ el panel ~ o painel ~ das Paneel ~ [板子|bǎn zi] ~ パネル ~ chat beto
roof ~ el techo ~ o teto ~ das Dach ~ [车顶|chē dǐng] ~ [屋根|やね] ~ chat beto
light ~ la luz ~ a luz ~ das Licht ~ [阳光|yáng guāng] ~ [光|ひかり] ~ chat beto
all day ~ todo el día ~ o dia todo ~ den ganzen Tag ~ [一整天|yī zhěng tiān] ~ [一日中|いちにちじゅう] ~ chat beto
time capsule ~ la cápsula del tiempo ~ a cápsula do tempo ~ die Zeitkapsel ~ [时间|shí jiān] [胶囊|jiāo náng] ~ タイム カプセル ~ c.beto1
to bury ~ enterrar ~ enterrar ~ vergraben ~ [埋|mái] ~ [埋|う]める ~ c.beto1
willow ~ el sauce ~ o salgueiro ~ die Weide ~ [柳树|liǔ shù] ~ [柳|やなぎ] ~ c.beto1
to forget ~ olvidar ~ esquecer ~ vergessen ~ [忘|wàng] ~ [忘|わす]れる ~ c.beto1
to remind ~ recordar ~ lembrar ~ erinnern ~ [提醒|tí xǐng] ~ [教|おし]える ~ c.beto2
box ~ la caja ~ a caixa ~ die Kiste ~ [盒子|hé zi] ~ [箱|はこ] ~ c.luci0
to open ~ abrir ~ abrir ~ öffnen ~ [打开|dǎ kāi] ~ [開|あ]ける ~ c.luci0
in ten years ~ en diez años ~ daqui a dez anos ~ in zehn Jahren ~ [十|shí] [年|nián] [后|hòu] ~ [十年後|じゅうねんご] ~ d.cap
to read ~ leer ~ ler ~ lesen ~ [读|dú] ~ [読|よ]む ~ c.luci1
the whole town ~ todo el pueblo ~ a cidade inteira ~ das ganze Dorf ~ [整个|zhěng gè] [小镇|xiǎo zhèn] ~ [町|まち] を ぜんぶ ~ c.sofi0
to live ~ vivir ~ morar ~ wohnen ~ [住|zhù] ~ [住|す]む ~ c.you chips
to travel ~ viajar ~ viajar ~ reisen ~ [旅行|lǚ xíng] ~ [旅行|りょこう] する ~ c.you chips
to dig ~ cavar ~ cavar ~ graben ~ [挖|wā] ~ [掘|ほ]る ~ (the Past, the Sunken Ruins)
pond ~ el estanque ~ o lago ~ der Teich ~ [池塘|chí táng] ~ [池|いけ] ~ m.t4
duck ~ el pato ~ o pato ~ die Ente ~ [鸭子|yā zi] ~ アヒル ~ m.t4
channel ~ el canal ~ o canal ~ der Kanal ~ [水渠|shuǐ qú] ~ [水路|すいろ] ~ d.pond
leaves ~ las hojas ~ as folhas ~ die Blätter ~ [树叶|shù yè] ~ [葉|は]っぱ ~ p.sofi1
storm ~ la tormenta ~ a tempestade ~ der Sturm ~ [暴风雨|bào fēng yǔ] ~ [嵐|あらし] ~ p.sofi1
to dry up ~ secarse ~ secar ~ austrocknen ~ [干|gān] ~ [干上|ひあ]がる ~ d.pond
to clean ~ limpiar ~ limpar ~ sauber machen ~ [清理|qīng lǐ] ~ [掃除|そうじ] する ~ d.pond
broom ~ la escoba ~ a vassoura ~ der Besen ~ [扫帚|sào zhou] ~ ほうき ~ p.hugo2
autumn ~ el otoño ~ o outono ~ der Herbst ~ [秋天|qiū tiān] ~ [秋|あき] ~ p.hugo2
full ~ lleno ~ cheio ~ voll ~ [满|mǎn] ~ いっぱい ~ p.sofi2
to warn ~ avisar ~ avisar ~ warnen ~ [提醒|tí xǐng] ~ [教|おし]える ~ p.sofi2
memory ~ la memoria ~ a memória ~ das Gedächtnis ~ [记忆|jì yì] ~ [思|おも]い[出|で] ~ chat sofi
library ~ la biblioteca ~ a biblioteca ~ die Bibliothek ~ [图书馆|tú shū guǎn] ~ [図書館|としょかん] ~ chat luci
book ~ el libro ~ o livro ~ das Buch ~ [书|shū] ~ [本|ほん] ~ chat luci
guest book ~ el libro de visitas ~ o livro de visitas ~ das Gästebuch ~ [留言簿|liú yán bù] ~ [芳名録|ほうめいろく] ~ gb.luci1
at nine ~ a las nueve ~ às nove ~ um neun ~ [九|jiǔ] [点|diǎn] ~ [九時|くじ] ~ d.book
story ~ la historia ~ a história ~ die Geschichte ~ [故事|gù shi] ~ [物語|ものがたり] ~ gb.luci2
school ~ la escuela ~ a escola ~ die Schule ~ [学校|xué xiào] ~ [学校|がっこう] ~ sa.luci1
to talk ~ hablar ~ falar ~ reden ~ [说话|shuō huà] ~ [話|はな]す ~ d.sami
with everyone ~ con todos ~ com todo mundo ~ mit allen ~ [跟|gēn] [大家|dà jiā] ~ みんな と ~ d.sami
you’ll see ~ ya verás ~ você vai ver ~ du wirst sehen ~ [等着|děng zhe] [看|kàn] ~ きっと ~ d.sami
smile ~ la sonrisa ~ o sorriso ~ das Lächeln ~ [开心|kāi xīn] ~ [笑顔|えがお] ~ sa.luci2
to try ~ intentar ~ tentar ~ versuchen ~ [试试|shì shi] ~ やって みる ~ sa.r2
honey ~ la miel ~ o mel ~ der Honig ~ [蜂蜜|fēng mì] ~ はちみつ ~ d.bread
cheese ~ el queso ~ o queijo ~ der Käse ~ [奶酪|nǎi lào] ~ チーズ ~ br.you
orange ~ la naranja ~ a laranja ~ die Orange ~ [橙子|chéng zi] ~ オレンジ ~ br.you
oven ~ el horno ~ o forno ~ der Ofen ~ [烤箱|kǎo xiāng] ~ オーブン ~ chat nilo
flour ~ la harina ~ a farinha ~ das Mehl ~ [面粉|miàn fěn] ~ [小麦粉|こむぎこ] ~ chat nilo
sack ~ el saco ~ o saco ~ der Sack ~ [袋|dài] ~ [袋|ふくろ] ~ chat nilo
secret ~ el secreto ~ o segredo ~ das Geheimnis ~ [秘密|mì mì] ~ [秘密|ひみつ] ~ chat nilo
to bake ~ hornear ~ assar ~ backen ~ [烤|kǎo] ~ [焼|や]く ~ br.nilo1
special ~ especial ~ especial ~ besonders ~ [特别|tè bié] ~ [特別|とくべつ] ~ br.nilo1
tonight ~ esta noche ~ hoje à noite ~ heute Abend ~ [今天|jīn tiān] [晚上|wǎn shang] ~ [今夜|こんや] ~ br.nilo2
to smell of ~ oler a ~ ter cheiro de ~ duften nach ~ [香味|xiāng wèi] ~ におい ~ br.nilo3
above, from above ~ por arriba ~ por cima ~ von oben ~ [上面|shàng miàn] ~ [上|うえ] から ~ d.balc
below, from below ~ por abajo ~ por baixo ~ von unten ~ [下面|xià miàn] ~ [下|した] から ~ d.balc
to rise ~ subir ~ subir ~ hochgehen ~ [升|shēng] ~ [上|あ]がる ~ d.balc
to duck down ~ agacharse ~ abaixar-se ~ sich ducken ~ [蹲|dūn] [下|xià] ~ [下|さ]がる ~ d.balc
to come down ~ bajar ~ descer ~ herunterkommen ~ [扑|pū] [下来|xià lai] ~ [降|お]りる ~ d.loft
to come back ~ volver ~ voltar ~ zurückkommen ~ [荡|dàng] [回来|huí lai] ~ [戻|もど]る ~ h.loft2
if ~ si ~ se ~ wenn ~ [如果|rú guǒ] ~ たら ~ d.loft (Chapter 3)
then ~ luego ~ depois ~ dann ~ [然后|rán hòu] ~ それ から ~ d.foyer
right away ~ enseguida ~ na hora ~ sofort ~ [马上|mǎ shàng] ~ すぐ ~ d.foyer
first ~ primero ~ primeiro ~ zuerst ~ [先|xiān] ~ まず ~ d.foyer
to happen ~ pasar ~ acontecer ~ passieren ~ [发生|fā shēng] ~ [起|お]きる ~ d.foyer
forty years ~ cuarenta años ~ quarenta anos ~ vierzig Jahre ~ [四十|sì shí] [年|nián] ~ [四十年|よんじゅうねん] ~ m.t2
like before ~ como antes ~ como antigamente ~ wie früher ~ [像|xiàng] [以前|yǐ qián] [一样|yī yàng] ~ [昔|むかし] の よう に ~ fe.marta1
to help ~ ayudar ~ ajudar ~ helfen ~ [帮|bāng] ~ [手伝|てつだ]う ~ m.plan
north gate ~ la puerta norte ~ o portão norte ~ das Nordtor ~ [北门|běi mén] ~ [北門|きたもん] ~ m.plan
the Old Quarter ~ el Barrio Viejo ~ o Bairro Velho ~ das Alte Viertel ~ [老城区|lǎo chéng qū] ~ [旧市街|きゅうしがい] ~ m.plan
music ~ la música ~ a música ~ die Musik ~ [音乐|yīn yuè] ~ [音楽|おんがく] ~ m.plan
to dance ~ bailar ~ dançar ~ tanzen ~ [跳舞|tiào wǔ] ~ [踊|おど]る ~ s.promise chips
drum ~ el tambor ~ o tambor ~ die Trommel ~ [鼓|gǔ] ~ [太鼓|たいこ] ~ the plaza's board
next ~ próximo ~ próximo ~ nächste ~ [下|xià] [一|yī] [班|bān] ~ [次|つぎ] ~ the tram stop's sign
the last one ~ el último ~ o último ~ die letzte ~ [末班车|mò bān chē] ~ [最終|さいしゅう] ~ the tram stop's sign
in five minutes ~ en cinco minutos ~ em cinco minutos ~ in fünf Minuten ~ [五|wǔ] [分钟|fēn zhōng] [后|hòu] ~ [五分後|ごふんご] ~ the tram stop's sign
to leave, depart ~ salir ~ sair ~ abfahren ~ [出发|chū fā] ~ [出|で]る ~ the tram stop's sign
football ~ el fútbol ~ a bola ~ der Fußball ~ [足球|zú qiú] ~ サッカー ~ the guest book
to train ~ entrenar ~ treinar ~ trainieren ~ [练功|liàn gōng] ~ [練習|れんしゅう] する ~ the guest book
kids ~ los niños ~ as crianças ~ die Kinder ~ [孩子们|hái zi men] ~ [子|こ]ども たち ~ the guest book
honey bread ~ el pan de miel ~ o pão de mel ~ das Honigbrot ~ [蜂蜜|fēng mì] [面包|miàn bāo] ~ はちみつ パン ~ the bakery's chalkboard
I will… (the future) ~ -é, -ás, -á, -emos, -án ~ vou / vai / vamos + verb ~ werden + verb at the end ~ [会|huì] · [要|yào] · [打算|dǎ suàn] ~ つもり · [予定|よてい] · でしょう ~ every demonstration
going to… ~ voy a / vas a / va a + verb ~ vou / vai + verb ~ werden ~ [要|yào] ~ つもり ~ Chapter 3, c.luci0
I would like ~ me gustaría ~ eu gostaria de ~ ich würde gern ~ [想|xiǎng] · [希望|xī wàng] ~ が いい な · たら いい な ~ d.bread (Chapter 3)
if…, then… will ~ si + now, then the future ~ se + verb, then vai + verb ~ wenn … (verb last), wird … ~ [如果|rú guǒ] … [就|jiù] … ~ … たら 、 … ~ d.loft, d.pond`.split('\n').map(r => { const [en, es, pt, de, zh, ja, where] = r.split(' ~ '); return { en, es, pt, de, zh, ja, where }; });

  // ------------------------------------------------------------ the graders → { ok, letter (S–C), reason, kind, heard, dir }
  // ok: the words do the job. kind when not ok: 'today' (the right verb, but now, not tomorrow), 'positive' («they'll laugh»: what
  // the seal fears), 'nodir' (a prediction without where), 'nosi' (a trap without «si»), 'nofuture' (no future after the «si»),
  // 'present' (a wish said as a want), 'nothing'. es / pt / de read through the dictionary (DICT.analyze: each verb's lemma, tense
  // and person) when its pack is ready, else through the patterns below; zh / ja look for the markers (会 要 将 打算 准备; つもり
  // 予定 でしょう だろう) and the verb, in characters, pinyin or kana / rōmaji.
  const lowT = s => String(s == null ? '' : s).toLowerCase().normalize('NFC').replace(/[¡!¿?.,;:«»"“”„()…—–\-]/g, ' ').replace(/\s+/g, ' ').trim();
  const fl = s => lowT(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const R = (ok, letter, reason, o) => Object.assign({ ok, letter: letter || null, reason: reason || '' }, o || {});
  const down = (letter, n = 1) => 'SABCD'[Math.max(0, Math.min(4, 'SABCD'.indexOf(letter) + n))];
  const hasHan = s => /[぀-ヿ㐀-鿿]/.test(String(s || ''));
  function cjHas(text, src, l) {
    if (typeof CJK === 'undefined' || !src) return false;
    try { const ch = CJK.chars(src, { lang: l }).replace(/\s+/g, ''); if (hasHan(ch) && String(text || '').replace(/\s+/g, '').includes(ch)) return true; } catch (e) { /* */ }
    try { return !!CJK.contains(text, src, l); } catch (e) { return false; }
  }
  function cjPos(text, src, l) {
    try {
      const raw = String(text || '').replace(/\s+/g, ''), ch = CJK.chars(src, { lang: l }).replace(/\s+/g, '');
      if (hasHan(raw) && raw.includes(ch)) return raw.indexOf(ch);
      const c = CJK.canon(text, l), w = CJK.canon(src, l); return w ? c.indexOf(w) : -1;
    } catch (e) { return -1; }
  }
  const verbKey = v => fl(v).replace(/\s+/g, '').replace(/se$/, '');      // (reírse, reír → reir)
  // es / pt / de: the futures in a sentence, and the verbs said in the present
  //   → { futs: [{ lemma, person (1 I, 2 you, 3 he/she/it, 4 we, 5 you all, 6 they), form, accent (false: an accent missing), last }], pres: [{ lemma, form }] }
  const ES_IR = { voy: 1, vas: 2, va: 3, vamos: 4, vais: 5, van: 6 }, PT_IR = { vou: 1, vais: 2, vai: 3, vamos: 4, 'vão': 6, vao: 6 }, DE_W = { werde: 1, wirst: 2, wird: 3, werden: 4, werdet: 5 };
  const ES_END = { 'é': 1, 'ás': 2, 'á': 3, emos: 4, 'éis': 5, 'án': 6 }, PT_END = { ei: 1, 'ás': 2, 'á': 3, emos: 4, eis: 5, 'ão': 6 };
  const IRR = { es: { har: 'hacer', tendr: 'tener', podr: 'poder', saldr: 'salir', vendr: 'venir', dir: 'decir', querr: 'querer', sabr: 'saber', pondr: 'poner', habr: 'haber' }, pt: { far: 'fazer', dir: 'dizer', trar: 'trazer' } };
  const NOTFUT = new Set(['para', 'mira', 'cara', 'clara', 'pera', 'fuera', 'afuera', 'madera', 'espera', 'primera', 'tercera', 'escalera', 'carrera', 'aire', 'quiere', 'quieres', 'prefiere', 'muere', 'hiere', 'queremos', 'preferimos', 'agora', 'hora', 'fora', 'cadeira', 'feira', 'madeira', 'primeira', 'carreira', 'bandeira', 'brincadeira', 'cheira']);
  function lexFuts(text, l) {
    if (typeof DICT === 'undefined' || !DICT.ready || !DICT.ready() || (typeof LEX !== 'undefined' && LEX.lang && LEX.lang !== l)) return null;
    let a = null; try { a = DICT.analyze(String(text || '')); } catch (e) { return null; }
    if (!a || !a.words) return null;
    const W = a.words.filter(w => !w.punct), out = { futs: [], pres: [], time: a.time };
    const per = w => (w.f && w.f.person ? (w.f.number === 'p' ? w.f.person + 3 : w.f.person) : null);
    W.forEach((w, i) => {
      if (w.pos !== 'v' || !w.f) return;
      const lem = verbKey(w.lemma || w.t);
      if ((lem === 'ir' || lem === 'werden') && w.f.tense === 'pres') {
        const j = W.findIndex((x, k) => k > i && x.pos === 'v' && x.f && x.f.form === 'inf');
        if (j > i) { const inf = W[j]; out.futs.push({ lemma: verbKey(inf.lemma || inf.t), person: per(w), form: w.t + ' ' + inf.t, accent: true, aux: lem, last: j === W.length - 1, gapA: l === 'es' ? W.slice(i + 1, j).some(x => fl(x.t) === 'a') : l === 'pt' ? W.slice(i + 1, j).some(x => fl(x.t) === 'a') : false }); return; }
      }
      if (w.f.tense === 'fut' && w.f.mood !== 'subj') { const accent = l === 'es' ? !/(?:e|as|a|eis|an)$/.test(lowT(w.t)) || /emos$/.test(lowT(w.t)) : l === 'pt' ? !/(?:as|a|ao)$/.test(lowT(w.t)) || /(?:ei|emos|eis)$/.test(lowT(w.t)) : true; out.futs.push({ lemma: lem, person: per(w), form: w.t, accent, spell: w.spell || null }); return; }
      if (w.f.tense === 'pres' && w.f.form !== 'inf') out.pres.push({ lemma: lem, form: w.t, person: per(w) });
    });
    return out;
  }
  function patFuts(text, l) {
    const L0 = lowT(text), F = fl(text), toks = L0.split(' '), ft = F.split(' '), out = { futs: [], pres: [] };
    if (l === 'de') {
      const iw = ft.findIndex(w => DE_W[w]); if (iw >= 0) { const rest = ft.slice(iw + 1), k = rest.length - 1; const inf = k >= 0 && /(?:en|ern|eln|n)$/.test(rest[k]) ? rest[k] : rest.find(w => /en$/.test(w)); if (inf) out.futs.push({ lemma: verbKey(inf), person: DE_W[ft[iw]] === 4 && ft[iw - 1] === 'sie' ? 6 : DE_W[ft[iw]], form: ft[iw] + ' ' + inf, accent: true, aux: 'werden', last: inf === rest[k] }); }
      return out;
    }
    const IR = l === 'pt' ? PT_IR : ES_IR, END = l === 'pt' ? PT_END : ES_END, irr = IRR[l === 'pt' ? 'pt' : 'es'];
    const infOf = stem => irr[stem] || (/(?:ar|er|ir)$/.test(stem) || (l === 'pt' && /or$/.test(stem)) ? stem : null);
    ft.forEach((w, i) => { if (IR[w] !== undefined) { const nx = ft[i + 1] === 'a' ? ft[i + 2] : ft[i + 1]; if (nx && /(?:ar|er|ir|or)(?:se|me|te|nos|lo|la|le)?$/.test(nx)) out.futs.push({ lemma: verbKey(nx.replace(/(?:se|me|te|nos|lo|la|le)$/, '')), person: IR[w], form: w + ' ' + nx, accent: true, aux: 'ir', gapA: ft[i + 1] === 'a' }); } });
    const re = l === 'pt' ? /^([a-zç]+?r)(ei|ás|á|emos|eis|ão)$/ : /^([a-zñ]+?r)(é|ás|á|emos|éis|án)$/;
    const reF = l === 'pt' ? /^([a-zc]+?r)(ei|as|a|emos|eis|ao)$/ : /^([a-zn]+?r)(e|as|a|emos|eis|an)$/;
    const ENDF = l === 'pt' ? { ei: 1, as: 2, a: 3, emos: 4, eis: 5, ao: 6 } : { e: 1, as: 2, a: 3, emos: 4, eis: 5, an: 6 };
    toks.forEach((w, i) => {
      if (NOTFUT.has(ft[i]) || IR[ft[i]] !== undefined) return;
      let m = w.match(re), acc = true; if (!m) { m = ft[i].match(reF); acc = false; }
      if (!m) return;
      const inf = infOf(m[1]); if (!inf || m[1].length < 3) return;
      out.futs.push({ lemma: verbKey(irr[m[1]] || inf), person: acc ? END[m[2]] : ENDF[m[2]], form: w, accent: acc || /emos$/.test(w) || (l === 'pt' && /(?:ei|eis)$/.test(w)) });
    });
    return out;
  }
  const futsOf = (text, l) => lexFuts(text, l) || patFuts(text, l);
  // a future typed without its accent (P6a, accents.js): it costs nothing, a tip shows it («saldra» → «saldrá»), unless what you
  // typed is, as typed, another tense the task tells apart: then the A stays (keep) and why says why
  const FUT_ACC = { es: { e: 'é', as: 'ás', a: 'á', eis: 'éis', an: 'án' }, pt: { as: 'ás', a: 'á', ao: 'ão' } };
  function futAcc(f, l) {
    if (!f || f.accent) return { keep: false, why: '', tip: '' };
    const typed = String(f.form || '').split(' ').pop(), right = f.spell || typed.replace(/r(e|as|a|eis|an|ao)$/, (x, e) => 'r' + ((FUT_ACC[l] || {})[e] || e));
    if (typeof ACCENTS === 'undefined' || !typed || right === typed) return { keep: true, why: 'an accent is missing', tip: '' };
    const j = ACCENTS.word(typed, right, l);
    return j.keep ? { keep: true, why: j.why, tip: '' } : { keep: false, why: '', tip: j.tip || ACCENTS.tip(right, l, typed) };
  }
  const matchVerb = (lemma, verbs) => verbs.some(v => { const k = verbKey(v); return lemma === k || (k.length > 4 && lemma.startsWith(k.slice(0, -2)) && Math.abs(lemma.length - k.length) <= 2); });
  const thingIn = (spec, text, l) => { const th = (spec && spec[l]) || []; if (!th.length) return true; return isC(l) ? th.some(w => cjHas(text, w, l)) : th.some(w => fl(text).includes(fl(w))); };
  const PERSON_TIP = { es: { 1: 'yo: «-é»', 2: 'tú: «-ás»', 3: 'él / ella: «-á»', 4: 'nosotros: «-emos»', 6: 'ellos: «-án»' }, pt: { 1: 'eu: «vou»', 2: 'você: «vai»', 3: 'ele / ela: «vai»', 4: 'nós: «vamos»', 6: 'eles: «vão»' },
    de: { 1: 'ich: «werde»', 2: 'du: «wirst»', 3: 'er / sie / es: «wird»', 4: 'wir: «werden»', 6: 'sie: «werden»' } };
  const WHO_EN = { 1: 'you (I)', 2: 'the one you’re talking to (you)', 3: 'them (he / she / it)', 4: 'all of you (we)', 6: 'them (they)' };
  // zh / ja: the verbs the dictionary reads in an answer, whatever it's typed in (characters, kana, pinyin, rōmaji) and whatever the
  // form («歌います。», «utaimasu», «弾いています»), so a present-tense answer is heard as one ("that's today", not "not quite")
  //   → [{ t (as typed), chars (its dictionary form in characters), canon (its reading), f (tense, want, neg, asp, cond, mood…) }]
  function cjVerbs(text, l) {
    if (typeof DICT === 'undefined' || !DICT.ready || !DICT.ready() || (typeof LEX !== 'undefined' && LEX.lang && LEX.lang !== l)) return [];
    let a = null; try { a = DICT.analyze(String(text || '')); } catch (e) { return []; }
    const key = s => { try { return CJK.chars(String(s || ''), { lang: l }).replace(/\s+/g, ''); } catch (e) { return ''; } };
    const can = s => { try { return CJK.canon(String(s || ''), l); } catch (e) { return ''; } };
    return ((a && a.words) || []).filter(w => w.pos === 'v' && w.id && !w.unknown).map(w => ({ t: w.t, chars: key(w.lemma), canon: can(w.lemma), f: w.f || {} }));
  }
  // one said for now: not a past, a "want" (〜たい), a "let's" / "surely" (〜ましょう, でしょう), an "if", a "can", a "not"
  const nowOf = (vs, l) => (l === 'zh' ? vs.find(v => !/^[在是有]$/.test(v.chars)) || vs[0]       // (zh: the main verb, not the 在 of «在剧院唱歌»)
    : vs.find(v => v.f.tense !== 'past' && !v.f.want && !v.f.cond && v.f.mood !== 'vol' && !v.f.pot && !v.f.neg));
  // the task's verb among them, in any form (its dictionary form by characters or by reading: 話す ~ はなす ~ hanasu)
  function verbIn(vs, verbs, l) {
    const keys = verbs.map(x => { let c = '', r = ''; try { c = CJK.chars(x, { lang: l }).replace(/\s+/g, ''); r = CJK.canon(x, l); } catch (e) { /* */ } return { c, r }; });
    return vs.find(v => keys.some(k => (k.c && k.c === v.chars) || (k.r && k.r === v.canon))) || null;
  }
  const PAST_ZH = ['[了|le]', '[过|guo]', '[昨天|zuó tiān]', '[以前|yǐ qián]'];
  // a future of this task's verb, in the right person
  function gradeFut(text, g, l) {
    const verbs = [g.verb[l]].concat((g.alt && g.alt[l]) || []), thing = thingIn(g.thing, text, l);
    const fin = (letter, reason, o) => R(true, thing ? letter : down(letter), thing ? reason : reason + '; say what, too', Object.assign({ kind: 'future' }, o || {}));
    if (isC(l)) {
      const MK = l === 'zh' ? ['[会|huì]', '[要|yào]', '[将|jiāng]', '[打算|dǎ suàn]', '[准备|zhǔn bèi]'] : ['つもり', '[予定|よてい]', 'でしょう', 'だろう', 'でしょ'];
      let v = verbs.find(x => cjHas(text, x, l));
      const mk = MK.find(m => cjHas(text, m, l));
      // (ja: the task's verb in another form. «弾きます» is the plain verb too; «弾いています» is now: that's today)
      if (!v && l === 'ja') {
        const hit = verbIn(cjVerbs(text, l), verbs, l);
        let cn = ''; try { cn = CJK.canon(text, 'ja'); } catch (e) { cn = ''; }
        const prog = hit && (hit.f.asp === 'prog' || (hit.f.form === 'te' && (/[てで]\s*い(?:る|ます)/.test(String(text)) || /(?:te|de) ?i(?:ru|masu)/.test(cn))));
        if (prog && !mk) return R(false, null, '', { kind: 'today', heard: hit.t });
        if (hit && hit.f.tense !== 'past' && !hit.f.want && !hit.f.neg && !hit.f.cond && hit.f.mood !== 'vol') v = verbs[0];
      }
      if (v && mk) {
        if (l === 'zh' && cjPos(text, mk, l) > cjPos(text, v, l)) return fin('B', '会 / 要 go right before the verb');
        if (l === 'zh' && g.person === 3 && g.who && cjHas(text, '[我|wǒ]', l) && !cjHas(text, g.who.zh || '', l) && !cjHas(text, '[他|tā]', l) && !cjHas(text, '[她|tā]', l)) return fin('B', `it’s their plan: ${plainOf(g.who.zh, l)}…, not 我`);
        if (l === 'zh' && g.person === 2 && cjHas(text, '[我|wǒ]', l) && !cjHas(text, '[你|nǐ]', l)) return fin('B', 'say it to them: 你会…, not 我');
        return fin('S', 'tomorrow’s words');
      }
      if (v) return l === 'ja' ? fin('B', 'the plain verb can mean tomorrow; with つもり / でしょう it’s a plan') : R(false, null, '', { kind: 'today', heard: plainOf(v, l) });
      return R(false, null, '', { kind: mk ? 'wrongverb' : 'nothing' });
    }
    const F = futsOf(text, l), hit = F.futs.find(f => matchVerb(f.lemma, verbs));
    if (hit) {
      if (hit.gapA && l === 'pt') return fin('B', 'no «a» after «vai / vamos»');
      if (hit.aux === 'ir' && l === 'es' && !hit.gapA) return fin('B', '«ir a» + the verb: don’t forget «a»');
      if (g.person && hit.person && hit.person !== g.person && !(g.person === 2 && hit.person === 3 && (l === 'pt' || /(?:^| )(?:usted|voce|você)(?= |$)/.test(fl(text)))) && !(g.person === 3 && hit.person === 2 && l === 'pt'))
        return fin('B', `the person: it’s ${WHO_EN[g.person]}, ${(PERSON_TIP[l] || {})[g.person] || ''}`, { person: hit.person });
      if (l === 'de' && hit.aux === 'werden' && !hit.last) return fin('A', 'the verb goes at the very end');
      const ac = futAcc(hit, l); if (ac.keep) return fin('A', ac.why);         // (an accent missing: a tip, not a grade; P6a)
      return fin('S', hit.aux === 'ir' ? (l === 'es' ? '«ir a» + the verb' : 'tomorrow’s words') : 'tomorrow’s words', ac.tip ? { tip: ac.tip } : undefined);
    }
    const now = (F.pres || []).find(p => matchVerb(p.lemma, verbs)) || (() => { const ws = fl(text).split(' '); for (const v of verbs) { const s = verbKey(v).slice(0, Math.max(3, verbKey(v).length - 2)), w = ws.find(x => x.startsWith(s)); if (w) return { form: w }; } return null; })();
    if (now) return R(false, null, '', { kind: 'today', heard: now.form });
    if (F.futs.length) return R(false, null, '', { kind: 'wrongverb' });
    return R(false, null, '', { kind: 'nothing' });
  }
  // any verb, about yourself: «Mañana cantaré», «Eu vou estudar», «Ich werde lesen», 我会…, …つもり
  function gradeFut1(text, g, l) {
    const thing = thingIn(g && g.thing, text, l);
    const fin = (letter, reason) => R(true, thing ? letter : down(letter), thing ? reason : reason + (g && g.where ? `; say where, too: «${plainOf(g.where[l] || '', l)}»` : ''), { kind: 'future' });
    if (isC(l)) {
      const vs = cjVerbs(text, l), now = nowOf(vs, l);
      if (l === 'zh') {
        const mk = ['[会|huì]', '[要|yào]', '[将|jiāng]', '[打算|dǎ suàn]', '[准备|zhǔn bèi]', '[想|xiǎng]'].find(m => cjHas(text, m, 'zh'));
        // (no 会 / 要: a verb said plainly is today; one with 了 / 过 / 昨天 is the past, and gets the general hint)
        if (!mk) return R(false, null, '', { kind: now && !PAST_ZH.some(m => cjHas(text, m, 'zh')) ? 'today' : 'nothing', heard: now ? now.t : '' });
        return fin(mk === '[想|xiǎng]' ? 'A' : 'S', mk === '[想|xiǎng]' ? '想 is «want»; a plan: 我会… / 我要…' : 'tomorrow’s words');
      }
      if (cjHas(text, 'つもり', 'ja') || cjHas(text, '[予定|よてい]', 'ja')) return fin('S', 'tomorrow’s words');
      if (cjHas(text, 'でしょう', 'ja') || cjHas(text, 'だろう', 'ja')) return fin('A', 'でしょう is a guess; for your own plan: つもり');
      // (a «want», 歌いたい, as the dictionary reads it: «utaimasu» has "tai" in its letters, but it's no «want»)
      if (vs.length ? vs.some(v => v.f.want) : cjHas(text, 'たい', 'ja')) return fin('B', '〜たい is a «want»; a plan: つもり');
      // (a verb said now, in any script, with or without its «。», «！» or «よ»: that's today)
      const bare = String(text).trim().replace(/[。、！？!?.,…\s]+$/u, '').replace(/(?:よ|ね|な|わ)$/u, '');
      return R(false, null, '', { kind: now || CJK_VERB_END.test(bare) ? 'today' : 'nothing', heard: now ? now.t : String(text).trim() });
    }
    const F = futsOf(text, l), mine = F.futs.find(f => f.person === 1 || f.person === 4), any = F.futs[0];
    if (mine) { if (mine.aux === 'ir' && l === 'es' && !mine.gapA) return fin('B', '«ir a» + the verb: don’t forget «a»'); if (mine.gapA && l === 'pt') return fin('B', 'no «a» after «vou»'); if (l === 'de' && mine.aux === 'werden' && !mine.last) return fin('A', 'the verb goes at the very end'); const ac = futAcc(mine, l); return Object.assign(fin(ac.keep ? 'A' : 'S', ac.keep ? ac.why : 'tomorrow’s words'), ac.tip ? { tip: ac.tip } : {}); }
    if (any) return fin('B', `that’s someone else’s tomorrow; say what YOU will do: ${(PERSON_TIP[l] || {})[1] || ''}`);
    if ((F.pres || []).length) return R(false, null, '', { kind: 'today', heard: F.pres[0].form });
    return R(false, null, '', { kind: 'nothing' });
  }
  const CJK_VERB_END = /[うくぐすつぬぶむる]$|ます$|[了吧]$/;
  // a prediction with where: up (arriba / cima / oben / 上面 / 上) or down (abajo / baixo / unten / 下面 / 下)
  const DIRS = { es: [['arriba', 'up'], ['alto', 'up'], ['abajo', 'down'], ['bajo', 'down']], pt: [['cima', 'up'], ['alto', 'up'], ['baixo', 'down'], ['embaixo', 'down']], de: [['oben', 'up'], ['hoch', 'up'], ['unten', 'down'], ['tief', 'down']] };
  function dirOf(text, l) {
    if (l === 'zh') { for (const [w, d] of [['[上面|shàng miàn]', 'up'], ['[下面|xià miàn]', 'down'], ['[上边|shàng bian]', 'up'], ['[下边|xià bian]', 'down'], ['[从|cóng] [上|shàng]', 'up'], ['[从|cóng] [下|xià]', 'down'], ['[往|wǎng] [上|shàng]', 'up'], ['[往|wǎng] [下|xià]', 'down']]) if (cjHas(text, w, 'zh')) return d; return null; }
    if (l === 'ja') { const raw = String(text || ''); if (/上/.test(raw)) return 'up'; if (/下/.test(raw)) return 'down'; let k = ''; try { k = CJK.canon(raw, 'ja'); } catch (e) { k = ''; } if (/uekara|ueni|uede|uekra/.test(k)) return 'up'; if (/shitakara|shitani|shitade/.test(k)) return 'down'; return null; }
    const ws = fl(text).split(' '); for (const [w, d] of DIRS[l] || []) if (ws.includes(w)) return d; return null;
  }
  function gradePred(text, l) {
    const dir = dirOf(text, l);
    let fut = false, now = null;
    if (isC(l)) {
      fut = l === 'zh' ? ['[会|huì]', '[要|yào]', '[将|jiāng]'].some(m => cjHas(text, m, 'zh')) : ['でしょう', 'だろう', 'つもり', 'でしょ'].some(m => cjHas(text, m, 'ja'));
      // (a verb said now, in any form or script: «笑います», «waraimasu», «攻撃します»)
      const n = fut ? null : nowOf(cjVerbs(text, l), l);
      if (n) now = n.t;
      else if (!fut && (cjHas(text, l === 'zh' ? '[笑|xiào]' : '[笑|わら]う', l) || cjHas(text, l === 'zh' ? '[攻击|gōng jī]' : '[攻撃|こうげき]', l))) now = l === 'zh' ? '笑' : '笑う';
    } else { const F = futsOf(text, l); fut = F.futs.length > 0; if (!fut && (F.pres || []).length) now = F.pres[0].form; }
    if (fut && dir) return R(true, 'S', 'a prediction', { kind: 'pred', dir });
    if (fut) return R(false, null, '', { kind: 'nodir' });
    if (now || dir) return R(false, null, '', { kind: 'today', heard: now || '', dir });
    return R(false, null, '', { kind: 'nothing' });
  }
  // «si» + now, then the future (Chapter 3's traps: FTXT.grade.trap); ja: …たら / …ば, then what will happen
  function gradeTrap(text, g, l) {
    if (l === 'ja') {
      let c = ''; try { c = CJK.canon(text, 'ja'); } catch (e) { c = ''; }
      const cond = /t(?:t)?ara|dara|reba|eba|nara/.test(c), act = ((g && g.act && g.act.ja) || []).some(w => cjHas(text, w, 'ja')) || cjHas(text, 'でしょう', 'ja');
      if (cond && act) return R(true, 'S', 'a trap', { kind: 'trap' });
      if (cond) return R(true, 'A', 'then say what will happen: …', { kind: 'trap' });
      return R(false, null, '', { kind: 'nosi' });
    }
    // (pt: Chapter 3's grader knows «se ele descer»; the plural future subjunctive, «se elas descerem», is just as right)
    const t0 = l === 'pt' ? String(text || '').replace(/(\bse\s+(?:\p{L}+\s+){0,3}?)(\p{L}+[aei])rem\b/iu, '$1$2r') : text;
    let r = null; try { r = typeof FTXT !== 'undefined' && FTXT.grade && FTXT.grade.trap ? FTXT.grade.trap(t0, l) : null; } catch (e) { r = null; }
    if (!r) return R(false, null, '', { kind: 'nothing' });
    if (r.ok && g && g.thing && !thingIn(g.thing, text, l)) return Object.assign({}, r, { letter: down(r.letter), reason: r.reason + '; say what will happen to it, too' });
    return r;
  }
  // «nobody will laugh»: the opposite of the seal's fear
  const NEG = { es: ['nadie', 'ninguno', 'ninguna', 'no', 'nunca', 'jamas'], pt: ['ninguem', 'nenhum', 'nenhuma', 'nao', 'nunca'], de: ['niemand', 'keiner', 'keine', 'nicht', 'nie', 'niemals'] };
  const LAUGH = { es: ['reir', 'burlar', 'reirse', 'burlarse'], pt: ['rir', 'zombar', 'debochar'], de: ['lachen', 'auslachen'] };
  function gradeNadie(text, l) {
    if (l === 'zh') {
      const laugh = cjHas(text, '[笑|xiào]', 'zh'), neg = ['[没有|méi yǒu] [人|rén]', '[没人|méi rén]', '[谁|shéi] [也|yě]', '[谁|shéi] [都|dōu]', '[不会|bù huì]', '[不|bù] [会|huì]'].some(w => cjHas(text, w, 'zh')), fut = cjHas(text, '[会|huì]', 'zh') || cjHas(text, '[要|yào]', 'zh');
      if (laugh && neg && fut) return R(true, 'S', 'a prediction', { kind: 'pred' });
      if (laugh && neg) return R(true, 'A', 'add 会: 没有人会笑', { kind: 'pred' });
      if (laugh && fut) return R(false, null, '', { kind: 'positive' });
      return R(false, null, '', { kind: laugh ? 'today' : 'nothing', heard: laugh ? '笑' : '' });
    }
    if (l === 'ja') {
      // (笑う in any form the dictionary reads: «笑います», «waraimasen»…)
      const lw = verbIn(cjVerbs(text, 'ja'), ['[笑|わら]う'], 'ja');
      const neg = cjHas(text, '[笑|わら]わない', 'ja') || cjHas(text, 'わらわない', 'ja') || cjHas(text, '[笑|わら]いません', 'ja') || !!(lw && lw.f.neg), pos = cjHas(text, '[笑|わら]う', 'ja') || !!(lw && !lw.f.neg && lw.f.tense !== 'past');
      if (neg && (cjHas(text, 'でしょう', 'ja') || cjHas(text, 'だろう', 'ja') || cjHas(text, 'よ', 'ja'))) return R(true, 'S', 'a prediction', { kind: 'pred' });
      if (neg) return R(true, 'A', 'add でしょう: 笑わない でしょう', { kind: 'pred' });
      if (pos && (cjHas(text, 'でしょう', 'ja') || cjHas(text, 'だろう', 'ja'))) return R(false, null, '', { kind: 'positive' });
      return R(false, null, '', { kind: pos ? 'today' : 'nothing', heard: pos ? (lw ? lw.t : '笑う') : '' });
    }
    const F = futsOf(text, l), ws = fl(text).split(' '), neg = (NEG[l] || []).some(w => ws.includes(w));
    const laughF = F.futs.find(f => (LAUGH[l] || []).some(v => matchVerb(f.lemma, [v]))), other = F.futs[0];
    if (laughF && neg) { if (l === 'de' && laughF.aux === 'werden' && !laughF.last) return R(true, 'A', 'the verb goes at the very end', { kind: 'pred' }); const ac = futAcc(laughF, l); return R(true, ac.keep ? 'A' : 'S', ac.keep ? ac.why : 'a prediction', { kind: 'pred', tip: ac.tip }); }
    if (laughF) return R(false, null, '', { kind: 'positive' });
    if (other && neg) return R(true, 'A', 'a prediction! Tadeo’s way: the laughing', { kind: 'pred' });
    const nowLaugh = (F.pres || []).find(p => (LAUGH[l] || []).some(v => matchVerb(p.lemma, [v]))) || (ws.find(w => /^(?:rie|rien|ri|riem|lacht|lachen)$/.test(w)) ? { form: ws.find(w => /^(?:rie|rien|ri|riem|lacht|lachen)$/.test(w)) } : null);
    if (nowLaugh) return R(false, null, '', { kind: 'today', heard: nowLaugh.form });
    return R(false, null, '', { kind: 'nothing' });
  }
  // a wish: «me gustaría…», «eu gostaria de…», «ich würde gern…», 我想… / 希望…, …が いい な
  function gradeWish(text, l) {
    const L0 = lowT(text), F = fl(text);
    // («gustaria» is no other word: no grade lost, a tip; «wurde» is "became": the A stays, and says why; P6a, accents.js)
    if (l === 'es') { if (/(?:^| )(?:me|nos) gustar[ií]a(?:n)?(?= |$)/.test(L0) || /(?:^| )quisiera(?= |$)/.test(L0)) return R(true, 'S', 'a wish', { kind: 'wish', tip: /gustaría|quisiera/.test(L0) ? '' : typeof ACCENTS !== 'undefined' ? ACCENTS.tip('gustaría', 'es', 'gustaria') : 'Tip: «gustaría»' }); if (/(?:^| )(?:quiero|queremos|me gusta)(?= |$)/.test(F)) return R(false, null, '', { kind: 'present' }); }
    if (l === 'pt') { if (/(?:^| )gostaria(?:mos)?(?= |$)/.test(F)) return R(true, 'S', 'a wish', { kind: 'wish' }); if (/(?:^| )queria(?= |$)/.test(F)) return R(true, 'A', 'polite! Nilo’s way: «eu gostaria de…»', { kind: 'wish' }); if (/(?:^| )(?:quero|gosto)(?= |$)/.test(F)) return R(false, null, '', { kind: 'present' }); }
    if (l === 'de') { const ws = F.split(' '), w = ws.findIndex(x => /^(?:wurde|wuerde|wurden|wuerden)$/.test(x)); if (w >= 0) { const gern = ws.includes('gern') || ws.includes('gerne'), um = /würde|wuerde/.test(L0), why = !um && typeof ACCENTS !== 'undefined' ? ACCENTS.word(L0.split(' ')[w] || 'wurde', 'würde', 'de').why : ''; return R(true, gern && um ? 'S' : 'A', !um ? why || 'the umlaut: «würde»' : gern ? 'a wish' : 'add «gern»: «ich würde gern…»', { kind: 'wish' }); } if (/(?:^| )(?:mochte|moechte|hatte gern|haette gern)(?= |$)/.test(F)) return R(true, 'A', 'a wish too! Nilo’s way: «ich würde gern…»', { kind: 'wish' }); if (/(?:^| )(?:will|wollen|mag)(?= |$)/.test(F)) return R(false, null, '', { kind: 'present' }); }
    if (l === 'zh') { if (['[想|xiǎng]', '[希望|xī wàng]', '[想要|xiǎng yào]'].some(w => cjHas(text, w, 'zh'))) return R(true, 'S', 'a wish', { kind: 'wish' }); if (cjHas(text, '[要|yào]', 'zh')) return R(true, 'A', '要 is blunt; a wish: 我想…', { kind: 'wish' }); }
    if (l === 'ja') { if (['が いい', 'が [食|た]べたい', 'が ほしい', 'たら いい', 'を ください', 'が [欲|ほ]しい'].some(w => cjHas(text, w, 'ja')) || /がいい|がほしい|たべたい|たらいい/.test(String(text).replace(/\s+/g, ''))) return R(true, 'S', 'a wish', { kind: 'wish' }); if (cjHas(text, 'ください', 'ja')) return R(true, 'A', 'polite! A wish: …が いい な', { kind: 'wish' }); }
    return R(false, null, '', { kind: 'nothing' });
  }
  const plainOf = (s, l) => (isC(l) && typeof CJK !== 'undefined' ? CJK.plain(String(s || ''), { lang: l }) : String(s || ''));
  // one task's grade: AFTXT.grade('p.tito', text, 'es') (o.dir: what the mask showed, for a prediction)
  function grade(key, text, l, o = {}) {
    const T = TASKS[key], g = T && T.grade; if (!g || !String(text || '').trim()) return R(false, null, '', { kind: 'nothing' });
    try {
      if (g.kind === 'fut') return gradeFut(text, g, l);
      if (g.kind === 'fut1') return gradeFut1(text, g, l);
      if (g.kind === 'trap') return gradeTrap(text, g, l);
      if (g.kind === 'nadie') return gradeNadie(text, l);
      if (g.kind === 'wish') return gradeWish(text, l);
      if (g.kind === 'pred') { const r = gradePred(text, l); if (r.ok && o.dir && r.dir !== o.dir) return Object.assign(r, { letter: 'C', wrongDir: true, reason: 'a prediction, but it’s coming from the other side!' }); return r; }
    } catch (e) { console.error('[alba future] grade', key, e); }
    return R(false, null, '', { kind: 'nothing' });
  }

  // ------------------------------------------------------------ every zh / ja string against CJK.md's rules ([] when all's well)
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return ['no CJK'];
    const out = [], v = (s, l, where) => { if (!s || typeof s !== 'string') return; const p = CJK.validate(s.replace(/\{[^}]+\}/g, l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ').replace(/___/g, l === 'zh' ? '[它|tā]' : 'それ'), l); if (p.length) out.push(`${where} (${l}): ${p.join('; ')} «${s}»`); };
    const each = (T, where) => { for (const l of ['zh', 'ja']) if (T && T[l] != null) [].concat(T[l]).forEach(x => (Array.isArray(x) ? x.forEach(y => (typeof y === 'string' ? v(y, l, where) : null)) : v(x, l, where))); };
    for (const [k, T] of Object.entries(NAMES)) each(T, 'name ' + k);
    for (const [k, T] of Object.entries(LINES)) each(T, k);
    for (const [k, T] of Object.entries(HUSH)) each(T, 'hush ' + k);
    for (const [k, T] of Object.entries(DEMO)) each(T, 'demo ' + k);
    for (const [k, T] of Object.entries(CAPNOTES)) each(T, 'capsule note ' + k);
    for (const [k, list] of Object.entries(CHAT)) list.forEach((T, i) => each(T, `chat ${k}.${i}`));
    for (const [k, S] of Object.entries(SIGNS)) S.lines.forEach((T, i) => each(T, `sign ${k}.${i}`));
    for (const [k, T] of Object.entries(FIGHT)) each(T, 'fight ' + k);
    for (const [k, M] of Object.entries(MARKS)) for (const l of ['zh', 'ja']) (M[l] || []).forEach(m => v(m[0], l, 'mark ' + k));
    for (const [k, T] of Object.entries(TASKS)) {
      for (const f of ['frame', 'model', 'modelDown']) each(T[f], `task ${k} ${f}`);
      for (const l of ['zh', 'ja']) ((T.chips || {})[l] || []).forEach(c => v(c[0], l, `task ${k} chip`));
      const g = T.grade || {};
      for (const f of ['verb', 'who', 'where']) if (g[f]) for (const l of ['zh', 'ja']) if (g[f][l] && /[[\]]/.test(g[f][l])) v(g[f][l], l, `task ${k} ${f}`);
      for (const f of ['alt', 'thing', 'act']) if (g[f]) for (const l of ['zh', 'ja']) ((g[f] || {})[l] || []).forEach(x => v(x, l, `task ${k} ${f}`));
    }
    for (const l of ['zh', 'ja']) { v(SPECIES[l].w, l, 'species'); v(ECHO[l], l, 'echo'); v(LORE[l === 'zh' ? 3 : 4], l, 'lore'); }
    WORDS.forEach((w, i) => { v(w.zh, 'zh', 'word ' + i + ' ' + w.en); v(w.ja, 'ja', 'word ' + i + ' ' + w.en); });
    return out;
  }
  // (the IME and the typed answers' dictionary know every word here)
  if (typeof CJK !== 'undefined' && CJK.addSource) { try { CJK.addSource([NAMES, LINES, HUSH, DEMO, CHAT, FIGHT, TASKS, SIGNS, CAPNOTES]); WORDS.forEach(w => { CJK.addSource(w.zh, 'zh'); CJK.addSource(w.ja, 'ja'); }); } catch (e) { /* (optional) */ } }

  return { L, NAMES, LINES, HUSH, CHAT, SIGNS, CAPNOTES, DEMO, MARKS, TASKS, FIGHT, SPECIES, LORE, ECHO, WORDS, isC, grade, check,
    _: { futsOf, lexFuts, patFuts, gradeFut, gradeFut1, gradePred, gradeTrap, gradeNadie, gradeWish, dirOf, cjHas, cjVerbs, nowOf, verbIn, fl, lowT, plainOf } };
})();
