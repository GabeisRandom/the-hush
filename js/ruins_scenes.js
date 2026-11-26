'use strict';
// The Sunken Ruins, region 7 (ruins.js has the layout, the words and the graders; game/REGIONS.md): the lines, the build and
// the game side.
//   · You land at the pier in the cove with Quino and «El Viento Sur» (RUINS.arrive(), from Port Brisa's long pier; Quino sails
//     you back with RUINS.leave()).
//   · Up the gully a sand slide blocks the way. Fermín the digger is at it: «¡Cava, Fermín, cava!» (a demonstration: the word
//     highlighted and glossed, EN on request), then Mimo asks, you teach it «cava / cava / grab», 挖, 掘って, and Mimo digs the
//     slide away in seconds (flags.ruinsDig, ruinsSlide). The sand worms come out from then on.
//   · The dig camp is gray: the storm (the Hush) buried everyone's things. Elvira, the head archaeologist, has Mimo dig up
//     Fermín's hat and hands it back: «¡Fermín! ¡Es tu sombrero!» — «¡Mi sombrero!» (the possessive, heard; ruinsChief).
//   · Four buried things (mounds round the camp: «¡Cava!»), four owners. You give each one back in a sentence: «¡Es tu
//     despertador!» (gradeYours, S–D); the wrong thing gets «¡Eso no es mío!». Each owner wakes up into their morning, out
//     loud: «¡Me levanto!», «Me seco la cara», «Me pongo los lentes», «Me peino» (reflexives, heard; ruinsThings).
//   · Salomé reads the first of the Wall of Days' six carved panels aloud; you read the other five (SIGNS.read: the language,
//     🔊, EN on request): the bell keeper's day, in the reflexive (ruinsWall).
//   · The Door of Days opens for someone who tells it their own morning: three different things you do, «Me levanto. Me lavo
//     la cara. Me visto.» (gradeRoutine, first person; ruinsDoor). Inside: ruins_temple.js.
//   · After the temple's bell (ruinsFree), report to Elvira (ruinsReport): Noa went north, to the Gray Marsh.
//   · Side quest: Tula's jar (four pieces under flagged mounds round the canyon).
// RUINS.build(scene, { terrainAt }) → { colliders, platforms, moving, group, people, update(dt, t, you), fog(you, fog), objects,
//   stats() }; RUINS.init(game), arrive(), leave(), interactables(), target(), sync(), roamOk(state), person(id), LINES, T, sayT.

// ================================================================ the lines: T(en, es, pt, de, zh, ja) (zh / ja: CJK.md)
(() => {
  const C = RUINS;
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const RL = {
    // Quino and «El Viento Sur» (Port Brisa's big ship)
    'q.land': T('Land ho! The south-east coast. I’ll wait here at the pier with the ship. When you want to go back to Port Brisa, come and find me.',
      '¡Tierra a la vista! La costa del sureste. Yo los espero aquí en el muelle, con el barco. Cuando quieran volver a Puerto Brisa, búsquenme.',
      'Terra à vista! A costa sudeste. Eu espero vocês aqui no píer, com o navio. Quando quiserem voltar para o Porto Brisa, é só me procurar.',
      'Land in Sicht! Die Südostküste. Ich warte hier am Steg mit dem Schiff. Wenn ihr nach Port Brisa zurückwollt, kommt einfach zu mir.',
      '[看到|kàn dào] [陆地|lù dì] [了|le] ！ [东南|dōng nán] [海岸|hǎi àn] 。 [我|wǒ] [和|hé] [船|chuán] [在|zài] [码头|mǎ tóu] [等|děng] [你们|nǐ men] 。 [想|xiǎng] [回|huí] [微风港|Wēi fēng gǎng] [的话|de huà] ， [就|jiù] [来|lái] [找|zhǎo] [我|wǒ] 。',
      '[陸|りく] だ ！ [南東|なんとう] の [海岸|かいがん] だ 。 わし は [船|ふね] と いっしょ に [桟橋|さんばし] で [待|ま]って いる 。 ブリサ [港|こう] に [帰|かえ]りたく なったら 、 わし の ところ に [来|き]て くれ 。'),
    'q.back': T('Back to Port Brisa? All aboard!', '¿De vuelta a Puerto Brisa? ¡Todos a bordo!', 'De volta para o Porto Brisa? Todos a bordo!', 'Zurück nach Port Brisa? Alle an Bord!',
      '[回|huí] [微风港|Wēi fēng gǎng] ？ [大家|dà jiā] [上船|shàng chuán] ！', 'ブリサ [港|こう] に [帰|かえ]る か ？ みんな [乗|の]って ！'),
    'q.out': T('Back already? All aboard! Next stop: the south-east coast.', '¿Otra vez al sur? ¡Todos a bordo! Próxima parada: la costa del sureste.', 'De novo para o sul? Todos a bordo! Próxima parada: a costa sudeste.', 'Wieder in den Süden? Alle an Bord! Nächster Halt: die Südostküste.',
      '[又|yòu] [去|qù] [南边|nán biān] ？ [大家|dà jiā] [上船|shàng chuán] ！ [下|xià] [一|yí] [站|zhàn] ： [东南|dōng nán] [海岸|hǎi àn] 。', 'また [南|みなみ] へ か ？ みんな [乗|の]って ！ [次|つぎ] は [南東|なんとう] の [海岸|かいがん] だ 。'),
    'q.chat': T('Sand in my boots, sand in my beard… Ah, the desert!', 'Arena en las botas, arena en la barba… ¡Ay, el desierto!', 'Areia nas botas, areia na barba… Ai, o deserto!', 'Sand in den Stiefeln, Sand im Bart … Ach, die Wüste!',
      '[靴子|xuē zi] [里|lǐ] [有|yǒu] [沙子|shā zi] ， [胡子|hú zi] [里|lǐ] [也|yě] [有|yǒu] [沙子|shā zi] … [唉|ài] ， [沙漠|shā mò] ！', 'ブーツ に [砂|すな] 、 ひげ に も [砂|すな] … ああ 、 [砂漠|さばく] だ な ！'),
    // Fermín the digger, at the sand slide in the gully
    'f.hello': T('Hello! Off the big ship? How wonderful! I’m Fermín. The storm buried the path up to the camp, and I’ve been digging for three days…',
      '¡Hola! ¿Llegaron en el barco grande? ¡Qué alegría! Soy Fermín. La tormenta enterró el camino al campamento, y llevo tres días cavando…',
      'Olá! Vocês vieram no navio grande? Que alegria! Eu sou o Fermín. A tempestade enterrou o caminho para o acampamento, e estou cavando há três dias…',
      'Hallo! Seid ihr mit dem großen Schiff gekommen? Wie schön! Ich bin Fermín. Der Sturm hat den Weg zum Lager verschüttet, und ich grabe schon seit drei Tagen …',
      '[你好|nǐ hǎo] ！ [你们|nǐ men] [是|shì] [坐|zuò] [大船|dà chuán] [来|lái] [的|de] [吗|ma] ？ [太好了|tài hǎo le] ！ [我|wǒ] [叫|jiào] [费尔明|Fèi ěr míng] 。 [风暴|fēng bào] [把|bǎ] [去|qù] [营地|yíng dì] [的|de] [路|lù] [埋|mái] [了|le] ， [我|wǒ] [已经|yǐ jīng] [挖|wā] [了|le] [三|sān] [天|tiān] [了|le] …',
      'こんにちは ！ [大|おお]きな [船|ふね] で [来|き]た ん です か ？ うれしい な ！ フェルミン です 。 [嵐|あらし] で キャンプ へ の [道|みち] が [埋|う]まって しまって 、 もう [三日|みっか] も [掘|ほ]って いる ん です …'),
    'f.demo': T('Dig, Fermín, dig! … Phew. I dig and dig, and the sand slides back down.', '¡Cava, Fermín, cava! … Uf. Cavo y cavo, y la arena vuelve a caer.', 'Cava, Fermín, cava! … Ufa. Eu cavo e cavo, e a areia volta a cair.',
      'Grab, Fermín, grab! … Puh. Ich grabe und grabe, und der Sand rutscht wieder runter.',
      '[挖|wā] ， [费尔明|Fèi ěr míng] ， [挖|wā] ！ … [呼|hū] 。 [我|wǒ] [挖|wā] [了|le] [又|yòu] [挖|wā] ， [沙子|shā zi] [又|yòu] [滑|huá] [下来|xià lái] [了|le] 。',
      '[掘|ほ]って 、 フェルミン 、 [掘|ほ]って ！ … ふう 。 [掘|ほ]って も [掘|ほ]って も 、 [砂|すな] が また [落|お]ちて くる 。'),
    'f.ask': T('Your little friend has big paws… Can it dig? Go on, tell it!', 'Tu amiguito tiene patas grandes… ¿Sabe cavar? ¡Anda, díselo!', 'O seu amiguinho tem patas grandes… Será que sabe cavar? Vai, fala!',
      'Was für große Pfoten! Kann das Kleine graben? Los, sag’s ihm!', '[你|nǐ] [的|de] [小|xiǎo] [朋友|péng you] [爪子|zhuǎ zi] [好|hǎo] [大|dà] … [它|tā] [会|huì] [挖|wā] [吗|ma] ？ [快|kuài] [告诉|gào su] [它|tā] ！',
      'その [子|こ] 、 [大|おお]きな [足|あし] です ね … [掘|ほ]れる かな ？ ほら 、 [言|い]って みて ！'),
    'f.done': T('In two minutes! Amazing! The camp is up the gully. Look for Elvira, our boss. But careful… since the storm, everyone up there is strange. Gray.',
      '¡En dos minutos! ¡Increíble! El campamento está arriba. Busquen a Elvira, la jefa. Pero cuidado… desde la tormenta, todos allá arriba están raros. Grises.',
      'Em dois minutos! Incrível! O acampamento fica lá em cima. Procurem a Elvira, a chefe. Mas cuidado… desde a tempestade, todo mundo lá em cima está estranho. Cinza.',
      'In zwei Minuten! Unglaublich! Das Lager ist da oben. Sucht Elvira, unsere Chefin. Aber Vorsicht … seit dem Sturm sind alle da oben komisch. Grau.',
      '[两|liǎng] [分钟|fēn zhōng] ！ [太|tài] [厉害|lì hai] [了|le] ！ [营地|yíng dì] [在|zài] [上面|shàng miàn] 。 [去|qù] [找|zhǎo] [我们|wǒ men] [的|de] [队长|duì zhǎng] [埃尔维拉|Āi ěr wéi lā] 。 [不过|bú guò] [小心|xiǎo xīn] … [风暴|fēng bào] [以后|yǐ hòu] ， [上面|shàng miàn] [的|de] [人|rén] [都|dōu] [怪怪的|guài guài de] ， [灰灰的|huī huī de] 。',
      '[二分|にふん] で ！ すごい ！ キャンプ は この [上|うえ] です 。 リーダー の エルビラ さん を [探|さが]して ください 。 でも [気|き] を つけて … [嵐|あらし] の あと 、 [上|うえ] の みんな は [様子|ようす] が おかしい ん です 。 [灰色|はいいろ] で 。'),
    'f.chat': T('Watch out for the sand worms! They hide under the sand… and pop up when you least expect it.', '¡Cuidado con los gusanos de arena! Se esconden bajo la arena… y salen cuando menos lo esperas.',
      'Cuidado com as minhocas de areia! Elas se escondem debaixo da areia… e saem quando você menos espera.', 'Pass auf die Sandwürmer auf! Sie verstecken sich unter dem Sand … und kommen raus, wenn du es am wenigsten erwartest.',
      '[小心|xiǎo xīn] [沙虫|shā chóng] ！ [它们|tā men] [躲|duǒ] [在|zài] [沙子|shā zi] [下面|xià miàn] … [突然|tū rán] [就|jiù] [钻|zuān] [出来|chū lái] 。', 'ミミズ に [気|き] を つけて ！ [砂|すな] の [下|した] に [隠|かく]れて いて … [急|きゅう] に [出|で]て くる ん です 。'),
    'f.hat': T('My hat! Thank you! I thought the sand ate it.', '¡Mi sombrero! ¡Gracias! Creía que se lo había comido la arena.', 'O meu chapéu! Obrigado! Eu achei que a areia tinha comido.', 'Mein Hut! Danke! Ich dachte, der Sand hat ihn gefressen.',
      '[我|wǒ] [的|de] [帽子|mào zi] ！ [谢谢|xiè xie] ！ [我|wǒ] [还|hái] [以为|yǐ wéi] [被|bèi] [沙子|shā zi] [吃|chī] [了|le] 。', 'ぼく の [帽子|ぼうし] ！ ありがとう ！ [砂|すな] に [食|た]べられた か と [思|おも]った 。'),
    'x.rest': T('Ouch, those worms! Rest a bit here in the shade.', '¡Ay, esos gusanos! Descansa un poco aquí, a la sombra.', 'Ai, essas minhocas! Descansa um pouco aqui na sombra.', 'Autsch, diese Würmer! Ruh dich hier im Schatten ein bisschen aus.',
      '[哎呀|āi yā] ， [那些|nà xiē] [沙虫|shā chóng] ！ [在|zài] [这里|zhè lǐ] [阴凉|yīn liáng] [处|chù] [休息|xiū xi] [一下|yí xià] [吧|ba] 。', 'いたた 、 あの ミミズ たち ！ ここ の [日陰|ひかげ] で [少|すこ]し [休|やす]んで ください 。'),
    // Elvira, the head archaeologist
    'e.hello': T('Visitors! And a little creature that digs: Fermín told me. I’m Elvira, the head of this dig. Three days ago a storm came, gray and silent. It buried everything… our things, our tools, and our words.',
      '¡Visitas! Y una criatura que cava: me lo contó Fermín. Soy Elvira, la jefa de la excavación. Hace tres días llegó una tormenta, gris y callada. Lo enterró todo… nuestras cosas, nuestras herramientas y nuestras palabras.',
      'Visitas! E uma criaturinha que cava: o Fermín me contou. Eu sou a Elvira, a chefe da escavação. Há três dias chegou uma tempestade, cinza e calada. Ela enterrou tudo… as nossas coisas, as nossas ferramentas e as nossas palavras.',
      'Besuch! Und ein kleines Wesen, das gräbt: Fermín hat es mir erzählt. Ich bin Elvira, die Leiterin der Grabung. Vor drei Tagen kam ein Sturm, grau und still. Er hat alles begraben … unsere Sachen, unser Werkzeug und unsere Wörter.',
      '[有|yǒu] [客人|kè rén] ！ [还有|hái yǒu] [一个|yí gè] [会|huì] [挖|wā] [的|de] [小|xiǎo] [家伙|jiā huo] ： [费尔明|Fèi ěr míng] [告诉|gào su] [我|wǒ] [了|le] 。 [我|wǒ] [是|shì] [埃尔维拉|Āi ěr wéi lā] ， [这里|zhè lǐ] [的|de] [队长|duì zhǎng] 。 [三|sān] [天|tiān] [前|qián] [来|lái] [了|le] [一|yì] [场|chǎng] [风暴|fēng bào] ， [灰色|huī sè] [的|de] ， [没有|méi yǒu] [声音|shēng yīn] 。 [它|tā] [埋|mái] [了|le] [一切|yí qiè] … [我们|wǒ men] [的|de] [东西|dōng xi] 、 [工具|gōng jù] ， [还有|hái yǒu] [我们|wǒ men] [的|de] [话|huà] 。',
      'お[客|きゃく]さん ！ それ に 、 [掘|ほ]れる [小|ちい]さな [子|こ] も 。 フェルミン から [聞|き]きました 。 わたし は エルビラ 、 この [発掘|はっくつ] の リーダー です 。 [三日|みっか] [前|まえ] 、 [灰色|はいいろ] の [静|しず]か な [嵐|あらし] が [来|き]て 、 ぜんぶ [埋|う]めて しまいました … わたしたち の [物|もの] も 、 [道具|どうぐ] も 、 [言葉|ことば] も 。'),
    'e.hatAsk': T('Look: that little mound of sand by the canopy. That’s where Fermín’s hat blew in the storm. Can your friend dig it out?',
      'Mira: ese montoncito de arena junto al toldo. Ahí cayó el sombrero de Fermín con la tormenta. ¿Tu amiguito puede sacarlo?',
      'Olha: aquele montinho de areia perto do toldo. Foi ali que o chapéu do Fermín caiu na tempestade. O seu amiguinho consegue tirar?',
      'Schau: der kleine Sandhaufen beim Sonnendach. Da ist Fermíns Hut im Sturm gelandet. Kann das Kleine ihn ausgraben?',
      '[你|nǐ] [看|kàn] ： [棚子|péng zi] [旁边|páng biān] [那个|nà ge] [小|xiǎo] [沙堆|shā duī] 。 [费尔明|Fèi ěr míng] [的|de] [帽子|mào zi] [被|bèi] [风暴|fēng bào] [吹|chuī] [到|dào] [那里|nà lǐ] [了|le] 。 [你|nǐ] [的|de] [小|xiǎo] [朋友|péng you] [能|néng] [挖|wā] [出来|chū lái] [吗|ma] ？',
      '[見|み]て 、 テント の [横|よこ] の [小|ちい]さな [砂山|すなやま] 。 [嵐|あらし] で フェルミン の [帽子|ぼうし] が あそこ に [飛|と]んだ の 。 その [子|こ] 、 [掘|ほ]り[出|だ]せる ？'),
    'e.demo': T('Fermín! Look! It’s your hat!', '¡Fermín! ¡Mira! ¡Es tu sombrero!', 'Fermín! Olha! É o seu chapéu!', 'Fermín! Schau! Das ist dein Hut!',
      '[费尔明|Fèi ěr míng] ！ [你|nǐ] [看|kàn] ！ [这|zhè] [是|shì] [你|nǐ] [的|de] [帽子|mào zi] ！', 'フェルミン ！ [見|み]て ！ フェルミン さん の [帽子|ぼうし] です よ ！'),
    'e.quest': T('Everyone here lost something in the storm, and without it they’re stuck. Darío can’t wake up without his alarm clock. Nadia can’t dry her face without her towel. Salomé can’t read without her glasses. And Gaspar… his comb. Dig their things up and give each one back. Tell them whose it is, the way I told Fermín!',
      'Aquí todos perdieron algo en la tormenta, y sin eso no pueden seguir. Darío no se despierta sin su despertador. Nadia no se seca la cara sin su toalla. Salomé no puede leer sin sus lentes. Y Gaspar… su peine. Desentierren sus cosas y devuélvanselas. ¡Díganles de quién es, como yo con Fermín!',
      'Aqui todo mundo perdeu alguma coisa na tempestade, e sem ela ninguém consegue continuar. O Darío não acorda sem o despertador dele. A Nadia não se enxuga sem a toalha dela. A Salomé não consegue ler sem os óculos dela. E o Gaspar… o pente dele. Desenterrem as coisas e devolvam. Digam de quem é, como eu fiz com o Fermín!',
      'Hier hat jeder im Sturm etwas verloren, und ohne das geht nichts mehr. Darío wacht ohne seinen Wecker nicht auf. Nadia kann sich ohne ihr Handtuch nicht abtrocknen. Salomé kann ohne ihre Brille nicht lesen. Und Gaspar … sein Kamm. Grabt ihre Sachen aus und gebt sie zurück. Sagt ihnen, wem es gehört, so wie ich bei Fermín!',
      '[这里|zhè lǐ] [每个|měi gè] [人|rén] [都|dōu] [在|zài] [风暴|fēng bào] [里|lǐ] [丢|diū] [了|le] [东西|dōng xi] ， [没有|méi yǒu] [它|tā] [就|jiù] [动|dòng] [不|bù] [了|liǎo] 。 [达里奥|Dá lǐ ào] [没有|méi yǒu] [闹钟|nào zhōng] [就|jiù] [醒|xǐng] [不|bù] [来|lái] 。 [娜迪娅|Nà dí yà] [没有|méi yǒu] [毛巾|máo jīn] [擦|cā] [不|bù] [干|gān] [脸|liǎn] 。 [萨洛梅|Sà luò méi] [没有|méi yǒu] [眼镜|yǎn jìng] [看|kàn] [不|bù] [了|liǎo] [字|zì] 。 [还有|hái yǒu] [加斯帕尔|Jiā sī pà ěr] … [他|tā] [的|de] [梳子|shū zi] 。 [把|bǎ] [东西|dōng xi] [挖|wā] [出来|chū lái] ， [还给|huán gěi] [他们|tā men] 。 [像|xiàng] [我|wǒ] [对|duì] [费尔明|Fèi ěr míng] [那样|nà yàng] ， [告诉|gào su] [他们|tā men] [这|zhè] [是|shì] [谁|shéi] [的|de] ！',
      'ここ の みんな は [嵐|あらし] で [何|なに] か を なくして 、 それ が ない と [動|うご]けない の 。 ダリオ は めざまし が ない と [起|お]きられない 。 ナディア は タオル が ない と [顔|かお] を ふけない 。 サロメ は めがね が ない と [読|よ]めない 。 そして ガスパル は … くし 。 みんな の [物|もの] を [掘|ほ]り[出|だ]して 、 [返|かえ]して あげて 。 わたし が フェルミン に した よう に 、 だれ の [物|もの] か [言|い]って ね ！'),
    'e.more': T('There are still things buried round the camp. Look for little mounds of sand!', 'Todavía hay cosas enterradas por el campamento. ¡Busquen montoncitos de arena!', 'Ainda tem coisas enterradas pelo acampamento. Procurem montinhos de areia!',
      'Rund ums Lager ist noch einiges vergraben. Sucht nach kleinen Sandhaufen!', '[营地|yíng dì] [周围|zhōu wéi] [还|hái] [埋|mái] [着|zhe] [东西|dōng xi] 。 [找|zhǎo] [找|zhao] [小|xiǎo] [沙堆|shā duī] ！',
      'キャンプ の まわり に は 、 まだ [埋|う]まって いる [物|もの] が あります 。 [小|ちい]さな [砂山|すなやま] を [探|さが]して ！'),
    'e.things': T('Everyone’s awake! Thank you! Now Salomé can read again. Go with her to the old town: the Wall of Days tells the story of the temple’s bell keeper.',
      '¡Todos despiertos! ¡Gracias! Ahora Salomé puede leer otra vez. Vayan con ella al pueblo antiguo: el Muro de los Días cuenta la historia de la campanera del templo.',
      'Todo mundo acordado! Obrigada! Agora a Salomé consegue ler de novo. Vão com ela até a cidade antiga: o Muro dos Dias conta a história da sineira do templo.',
      'Alle sind wach! Danke! Jetzt kann Salomé wieder lesen. Geht mit ihr in die alte Stadt: Die Mauer der Tage erzählt die Geschichte der Glöcknerin des Tempels.',
      '[大家|dà jiā] [都|dōu] [醒|xǐng] [了|le] ！ [谢谢|xiè xie] ！ [萨洛梅|Sà luò méi] [又|yòu] [能|néng] [看|kàn] [字|zì] [了|le] 。 [跟|gēn] [她|tā] [去|qù] [古城|gǔ chéng] [吧|ba] ： [日子|rì zi] [墙|qiáng] [上|shàng] [刻|kè] [着|zhe] [神庙|shén miào] [守钟人|shǒu zhōng rén] [的|de] [故事|gù shi] 。',
      'みんな [起|お]きた ！ ありがとう ！ これ で サロメ も また [読|よ]めます 。 いっしょ に [古|ふる]い [町|まち] へ [行|い]って ください 。 「 [日々|ひび] の [壁|かべ] 」 に は 、 [神殿|しんでん] の [鐘守|かねもり] の [話|はなし] が [書|か]いて あります 。'),
    'e.door': T('The Door of Days only opens for someone who tells it their own morning. The temple is at the north end of the canyon. Good luck!',
      'La Puerta de los Días solo se abre para quien le cuenta su propia mañana. El templo está al norte del cañón. ¡Suerte!',
      'A Porta dos Dias só abre para quem conta a ela a sua própria manhã. O templo fica no norte do cânion. Boa sorte!',
      'Die Tür der Tage geht nur auf, wenn man ihr vom eigenen Morgen erzählt. Der Tempel liegt am Nordende der Schlucht. Viel Glück!',
      '[日子|rì zi] [之|zhī] [门|mén] [只|zhǐ] [为|wèi] [讲|jiǎng] [出|chū] [自己|zì jǐ] [早晨|zǎo chen] [的|de] [人|rén] [打开|dǎ kāi] 。 [神庙|shén miào] [在|zài] [峡谷|xiá gǔ] [的|de] [北|běi] [头|tóu] 。 [祝|zhù] [你们|nǐ men] [好运|hǎo yùn] ！',
      '「 [日々|ひび] の [扉|とびら] 」 は 、 [自分|じぶん] の [朝|あさ] を [話|はな]した [人|ひと] に だけ [開|ひら]きます 。 [神殿|しんでん] は [谷|たに] の [北|きた] の [端|はし] です 。 がんばって ！'),
    'e.report': T('The temple’s bell! I heard it from here! A hundred years of silence… and today it rang. And look: everyone’s color is back. Thank you.',
      '¡La campana del templo! ¡La oí desde aquí! Cien años de silencio… y hoy sonó. Y miren: a todos les volvió el color. Gracias, de verdad.',
      'O sino do templo! Eu ouvi daqui! Cem anos de silêncio… e hoje ele tocou. E olhem: a cor de todo mundo voltou. Obrigada, de verdade.',
      'Die Glocke des Tempels! Ich habe sie bis hier gehört! Hundert Jahre Stille … und heute hat sie geläutet. Und schaut: Alle haben ihre Farbe zurück. Danke, wirklich.',
      '[神庙|shén miào] [的|de] [钟|zhōng] ！ [我|wǒ] [在|zài] [这里|zhè lǐ] [都|dōu] [听到|tīng dào] [了|le] ！ [一百|yì bǎi] [年|nián] [的|de] [安静|ān jìng] … [今天|jīn tiān] [它|tā] [响|xiǎng] [了|le] 。 [你们|nǐ men] [看|kàn] ， [大家|dà jiā] [的|de] [颜色|yán sè] [都|dōu] [回来|huí lái] [了|le] 。 [真|zhēn] [的|de] [谢谢|xiè xie] [你们|nǐ men] 。',
      '[神殿|しんでん] の [鐘|かね] ！ ここ まで [聞|き]こえました ！ [百年|ひゃくねん] の [沈黙|ちんもく] … そして [今日|きょう] 、 [鳴|な]った 。 [見|み]て 、 みんな の [色|いろ] も [戻|もど]った 。 [本当|ほんとう] に ありがとう 。'),
    'e.next': T('A girl with a notebook came through here last week, asking about the bell. She said she was going north next, to the gray marsh at the foot of the Old Tower. Quino’s ship will take you back to Port Brisa, and the marsh road starts past Alba’s old cemetery.',
      'Una chica con un cuaderno pasó por aquí la semana pasada, preguntando por la campana. Dijo que después iba al norte, a la ciénaga gris, al pie de la Torre Vieja. El barco de Quino los lleva de vuelta a Puerto Brisa, y el camino de la ciénaga sale del cementerio viejo de Alba.',
      'Uma moça com um caderno passou por aqui semana passada, perguntando sobre o sino. Ela disse que depois ia para o norte, para o pântano cinza, ao pé da Torre Velha. O navio do Quino leva vocês de volta ao Porto Brisa, e o caminho do pântano começa no cemitério velho de Alba.',
      'Letzte Woche kam ein Mädchen mit einem Notizbuch hier vorbei und hat nach der Glocke gefragt. Sie sagte, sie geht als Nächstes nach Norden, ins graue Moor am Fuß des Alten Turms. Quinos Schiff bringt euch zurück nach Port Brisa, und der Weg ins Moor beginnt beim alten Friedhof von Alba.',
      '[上|shàng] [个|ge] [星期|xīng qī] [有|yǒu] [个|gè] [拿|ná] [着|zhe] [笔记本|bǐ jì běn] [的|de] [女孩|nǚ hái] [来|lái] [过|guo] [这里|zhè lǐ] ， [问|wèn] [起|qǐ] [那|nà] [口|kǒu] [钟|zhōng] 。 [她|tā] [说|shuō] [她|tā] [要|yào] [往|wǎng] [北|běi] [走|zǒu] ， [去|qù] [古塔|gǔ tǎ] [脚下|jiǎo xià] [的|de] [灰色|huī sè] [沼泽|zhǎo zé] 。 [基诺|Jī nuò] [的|de] [船|chuán] [会|huì] [送|sòng] [你们|nǐ men] [回|huí] [微风港|Wēi fēng gǎng] ， [去|qù] [沼泽|zhǎo zé] [的|de] [路|lù] [从|cóng] [阿尔巴|Ā ěr bā] [的|de] [老|lǎo] [墓地|mù dì] [出发|chū fā] 。',
      '[先週|せんしゅう] 、 ノート を [持|も]った [女|おんな]の[子|こ] が ここ に [来|き]て 、 [鐘|かね] の こと を [聞|き]いて いました 。 [次|つぎ] は [北|きた] の 、 [古|ふる]い [塔|とう] の ふもと の [灰色|はいいろ] の [沼|ぬま] に [行|い]く と [言|い]って いました 。 キノ さん の [船|ふね] で ブリサ [港|こう] に [帰|かえ]れます 。 [沼|ぬま] へ の [道|みち] は 、 アルバ の [古|ふる]い [墓地|ぼち] から です 。'),
    'e.chat': T('We’ll be digging here for years. Come back whenever you like!', 'Vamos a excavar aquí durante años. ¡Vuelvan cuando quieran!', 'A gente vai escavar aqui por anos. Voltem quando quiserem!', 'Wir graben hier noch jahrelang. Kommt wieder, wann ihr wollt!',
      '[我们|wǒ men] [还要|hái yào] [在|zài] [这里|zhè lǐ] [挖|wā] [好|hǎo] [多|duō] [年|nián] 。 [随时|suí shí] [回来|huí lái] ！', 'ここ で は まだ [何年|なんねん] も [掘|ほ]ります 。 いつ でも [来|き]て ね ！'),
    // the four with something lost: hushed until it's back, then their morning out loud (a demonstration of the reflexive)
    'd.h': T('*Zzz*… five more *minutes*… *zzz*…', '*Zzz*… cinco *minutos* más… *zzz*…', '*Zzz*… mais cinco *minutos*… *zzz*…', '*Zzz* … noch fünf *Minuten* … *zzz* …',
      '*[呼|hū]* … [再|zài] [睡|shuì] [五|wǔ] *[分钟|fēn zhōng]* … *[呼|hū]* …', '*ぐう* … あと [五|ご] *[分|ふん]* … *ぐう* …'),
    'd.up': T('Huh?! My alarm clock! I’m up, I’m up! I get up, I wash my face… and coffee!', '¿¡Eh?! ¡Mi despertador! ¡Ya me levanto, ya me levanto! Me levanto, me lavo la cara… ¡y un café!',
      'Hã?! O meu despertador! Já vou, já vou! Eu me levanto, lavo o rosto… e um café!', 'Hä?! Mein Wecker! Ich steh ja schon auf! Ich stehe auf, ich wasche mir das Gesicht … und einen Kaffee!',
      '[啊|á] ？ ！ [我|wǒ] [的|de] [闹钟|nào zhōng] ！ [我|wǒ] [起来|qǐ lái] [了|le] ， [起来|qǐ lái] [了|le] ！ [我|wǒ] [起床|qǐ chuáng] ， [洗|xǐ] [脸|liǎn] … [再|zài] [来|lái] [杯|bēi] [咖啡|kā fēi] ！',
      'えっ ？ ！ ぼく の めざまし ！ [起|お]きます 、 [起|お]きます ！ [起|お]きて 、 [顔|かお] を [洗|あら]って … それ から コーヒー ！'),
    'd.chat': T('Without my alarm clock I’d sleep all day. Thank you!', 'Sin mi despertador, duermo todo el día. ¡Gracias!', 'Sem o meu despertador, eu durmo o dia inteiro. Obrigado!', 'Ohne meinen Wecker schlafe ich den ganzen Tag. Danke!',
      '[没有|méi yǒu] [闹钟|nào zhōng] ， [我|wǒ] [能|néng] [睡|shuì] [一|yì] [整|zhěng] [天|tiān] 。 [谢谢|xiè xie] ！', 'めざまし が ない と 、 [一日中|いちにちじゅう] [寝|ね]て しまう ん です 。 ありがとう ！'),
    'n.h': T('*Water*… my *face*… so *wet*…', '*Agua*… mi *cara*… tan *mojada*…', '*Água*… o meu *rosto*… tão *molhado*…', '*Wasser* … mein *Gesicht* … so *nass* …',
      '*[水|shuǐ]* … [我|wǒ] [的|de] *[脸|liǎn]* … [好|hǎo] *[湿|shī]* …', '*[水|みず]* … *[顔|かお]* が … *びしょびしょ* …'),
    'n.up': T('My towel! Thank you! I dry my face… ahh, much better. Now I comb my hair, and off to work!', '¡Mi toalla! ¡Gracias! Me seco la cara… ¡ay, mucho mejor! Ahora me peino, ¡y a trabajar!',
      'A minha toalha! Obrigada! Eu me enxugo… ai, bem melhor! Agora eu me penteio, e mãos à obra!', 'Mein Handtuch! Danke! Ich trockne mir das Gesicht ab … ah, viel besser! Jetzt kämme ich mich, und dann an die Arbeit!',
      '[我|wǒ] [的|de] [毛巾|máo jīn] ！ [谢谢|xiè xie] ！ [我|wǒ] [擦干|cā gān] [脸|liǎn] … [啊|a] ， [舒服|shū fu] [多|duō] [了|le] ！ [现在|xiàn zài] [我|wǒ] [梳头|shū tóu] ， [然后|rán hòu] [去|qù] [干活|gàn huó] ！',
      'わたし の タオル ！ ありがとう ！ [顔|かお] を ふいて … ああ 、 すっきり ！ [次|つぎ] は [髪|かみ] を とかして 、 お[仕事|しごと] ！'),
    'n.chat': T('I’m the camp’s cook. Today: bread, dates and mint tea!', 'Soy la cocinera del campamento. Hoy hay pan, dátiles y té de menta.', 'Eu sou a cozinheira do acampamento. Hoje tem pão, tâmaras e chá de hortelã.', 'Ich bin die Köchin im Lager. Heute gibt es Brot, Datteln und Minztee.',
      '[我|wǒ] [是|shì] [营地|yíng dì] [的|de] [厨师|chú shī] 。 [今天|jīn tiān] [有|yǒu] [面包|miàn bāo] 、 [枣|zǎo] [和|hé] [薄荷茶|bò he chá] 。', 'わたし は キャンプ の コック です 。 [今日|きょう] は パン と なつめ と ミント ティー ！'),
    's.h': T('*Letters*… all *blurry*… I *can’t* *read*…', '*Letras*… todo *borroso*… no *puedo* *leer*…', '*Letras*… tudo *borrado*… não *consigo* *ler*…', '*Buchstaben* … alles *verschwommen* … ich *kann* nicht *lesen* …',
      '*[字|zì]* … [都|dōu] *[模糊|mó hu]* … [我|wǒ] *[看|kàn]* [不|bù] *[清|qīng]* …', '*[文字|もじ]* … ぜんぶ *ぼやけて* … *[読|よ]めない* …'),
    's.up': T('My glasses! I put on my glasses, and… I can read again! Come with me to the Wall of Days: it tells a whole day in the old town.',
      '¡Mis lentes! Me pongo los lentes y… ¡puedo leer otra vez! Vengan conmigo al Muro de los Días: cuenta un día entero del pueblo antiguo.',
      'Os meus óculos! Eu coloco os óculos e… consigo ler de novo! Venham comigo até o Muro dos Dias: ele conta um dia inteiro da cidade antiga.',
      'Meine Brille! Ich setze mir die Brille auf und … ich kann wieder lesen! Kommt mit zur Mauer der Tage: Sie erzählt einen ganzen Tag in der alten Stadt.',
      '[我|wǒ] [的|de] [眼镜|yǎn jìng] ！ [我|wǒ] [戴上|dài shang] [眼镜|yǎn jìng] … [又|yòu] [能|néng] [看|kàn] [字|zì] [了|le] ！ [跟|gēn] [我|wǒ] [去|qù] [日子|rì zi] [墙|qiáng] [吧|ba] ： [上面|shàng miàn] [讲|jiǎng] [的|de] [是|shì] [古城|gǔ chéng] [里|lǐ] [的|de] [一|yì] [整|zhěng] [天|tiān] 。',
      'わたし の めがね ！ めがね を かけて … また [読|よ]める ！ 「 [日々|ひび] の [壁|かべ] 」 に [来|き]て ください 。 [古|ふる]い [町|まち] の [一日|いちにち] が ぜんぶ [書|か]いて ある ん です 。'),
    's.wallGo': T('That’s the first one. Now you read the rest: each panel is one moment of her day.', 'Ese es el primero. Ahora lean ustedes los demás: cada panel es un momento de su día.',
      'Esse é o primeiro. Agora leiam vocês os outros: cada painel é um momento do dia dela.', 'Das ist das erste. Jetzt lest ihr den Rest: Jedes Bild ist ein Moment aus ihrem Tag.',
      '[这|zhè] [是|shì] [第一|dì yī] [幅|fú] 。 [剩下|shèng xià] [的|de] [你们|nǐ men] [自己|zì jǐ] [读|dú] [吧|ba] ： [每|měi] [一|yì] [幅|fú] [都|dōu] [是|shì] [她|tā] [一天|yì tiān] [里|lǐ] [的|de] [一|yí] [个|gè] [时刻|shí kè] 。',
      'これ が [一枚目|いちまいめ] 。 [残|のこ]り は [読|よ]んで みて ください 。 [一枚|いちまい] ずつ 、 [彼女|かのじょ] の [一日|いちにち] の ひとこま です 。'),
    's.wallDone': T('She got up, washed, combed her hair, got dressed… and rang the bell, every day. The Door of Days wants the same: tell it YOUR morning. «I get up…»',
      'Se levantaba, se lavaba, se peinaba, se vestía… y tocaba la campana, todos los días. La Puerta de los Días quiere lo mismo: cuéntale TU mañana. «Me levanto…»',
      'Ela se levantava, se lavava, se penteava, se vestia… e tocava o sino, todo dia. A Porta dos Dias quer o mesmo: conte a ela a SUA manhã. «Eu me levanto…»',
      'Sie stand auf, wusch sich, kämmte sich, zog sich an … und läutete die Glocke, jeden Tag. Die Tür der Tage will dasselbe: Erzähl ihr DEINEN Morgen. «Ich stehe auf …»',
      '[她|tā] [起床|qǐ chuáng] 、 [洗|xǐ] [脸|liǎn] 、 [梳头|shū tóu] 、 [穿|chuān] [衣服|yī fu] … [然后|rán hòu] [敲|qiāo] [钟|zhōng] ， [天天|tiān tiān] [如此|rú cǐ] 。 [日子|rì zi] [之|zhī] [门|mén] [也|yě] [想|xiǎng] [听|tīng] [这个|zhè ge] ： [讲讲|jiǎng jiang] [你|nǐ] [自己|zì jǐ] [的|de] [早晨|zǎo chen] 。 「 [我|wǒ] [起床|qǐ chuáng] … 」',
      '[彼女|かのじょ] は [起|お]きて 、 [顔|かお] を [洗|あら]って 、 [髪|かみ] を とかして 、 [服|ふく] を [着|き]て … [毎日|まいにち] [鐘|かね] を [鳴|な]らしました 。 「 [日々|ひび] の [扉|とびら] 」 も [同|おな]じ こと を [聞|き]きたい の 。 あなた の [朝|あさ] を [話|はな]して 。 「 [起|お]きます … 」'),
    's.chat': T('I read old stones. Some of these carvings are three thousand years old!', 'Yo leo piedras viejas. ¡Algunas de estas inscripciones tienen tres mil años!', 'Eu leio pedras antigas. Algumas destas inscrições têm três mil anos!',
      'Ich lese alte Steine. Manche dieser Inschriften sind dreitausend Jahre alt!', '[我|wǒ] [读|dú] [古老|gǔ lǎo] [的|de] [石头|shí tou] 。 [有些|yǒu xiē] [刻字|kè zì] [已经|yǐ jīng] [三千|sān qiān] [年|nián] [了|le] ！',
      'わたし は [古|ふる]い [石|いし] を [読|よ]みます 。 [三千年|さんぜんねん] [前|まえ] の [文字|もじ] も ある ん です よ ！'),
    'g.h': T('My *hair*… the *wind*… *sand*… *everywhere*…', 'Mi *pelo*… el *viento*… *arena*… por *todas* partes…', 'O meu *cabelo*… o *vento*… *areia*… em *todo* lugar…', 'Meine *Haare* … der *Wind* … *Sand* … *überall* …',
      '[我|wǒ] [的|de] *[头发|tóu fa]* … *[风|fēng]* … *[沙子|shā zi]* … *[到处|dào chù]* [都|dōu] [是|shì] …', '*[髪|かみ]* が … *[風|かぜ]* … *[砂|すな]* … *どこ* に でも …'),
    'g.up': T('My comb! I comb my hair… there. Now I look like a serious archaeologist again!', '¡Mi peine! Me peino… listo. ¡Ahora parezco otra vez un arqueólogo serio!', 'O meu pente! Eu me penteio… pronto. Agora eu pareço de novo um arqueólogo sério!',
      'Mein Kamm! Ich kämme mich … so. Jetzt sehe ich wieder wie ein ernster Archäologe aus!', '[我|wǒ] [的|de] [梳子|shū zi] ！ [我|wǒ] [梳|shū] [梳|shu] [头|tóu] … [好|hǎo] [了|le] 。 [现在|xiàn zài] [我|wǒ] [又|yòu] [像|xiàng] [个|gè] [认真|rèn zhēn] [的|de] [考古学家|kǎo gǔ xué jiā] [了|le] ！',
      'ぼく の くし ！ [髪|かみ] を とかして … よし 。 これ で また まじめ な [考古学者|こうこがくしゃ] に [見|み]える ！'),
    'g.chat': T('I draw the dig’s maps. The temple goes down deep. Very deep.', 'Yo dibujo los mapas de la excavación. El templo baja muy hondo. Muy, muy hondo.', 'Eu desenho os mapas da escavação. O templo desce fundo. Muito fundo.',
      'Ich zeichne die Karten der Grabung. Der Tempel geht tief hinunter. Sehr tief.', '[我|wǒ] [画|huà] [考古|kǎo gǔ] [地图|dì tú] 。 [神庙|shén miào] [往|wǎng] [下|xià] [很|hěn] [深|shēn] 。 [非常|fēi cháng] [深|shēn] 。',
      'ぼく は [発掘|はっくつ] の [地図|ちず] を [描|か]いて います 。 [神殿|しんでん] は ずっと [下|した] まで 、 とても [深|ふか]い ん です 。'),
    'x.notmine': T('Hm? That’s not mine!', '¿Eh? ¡Eso no es mío!', 'Hã? Isso não é meu!', 'Hm? Das gehört mir nicht!', '[咦|yí] ？ [这|zhè] [不|bú] [是|shì] [我|wǒ] [的|de] ！', 'え ？ それ 、 わたし の じゃ ありません よ ！'),
    // Tula, the camp's kid, and her jar (a side quest)
    't.hello': T('My jar! The storm broke it into four pieces, and the sand ate them! Can you find them? Your friend can dig, right?',
      '¡Mi vasija! La tormenta la rompió en cuatro pedazos, ¡y la arena se los comió! ¿Me ayudas a encontrarlos? Tu amiguito sabe cavar, ¿no?',
      'O meu jarro! A tempestade quebrou ele em quatro pedaços, e a areia comeu tudo! Você me ajuda a achar? O seu amiguinho sabe cavar, né?',
      'Mein Krug! Der Sturm hat ihn in vier Stücke zerbrochen, und der Sand hat sie gefressen! Hilfst du mir, sie zu finden? Das Kleine da kann doch graben, oder?',
      '[我|wǒ] [的|de] [罐子|guàn zi] ！ [风暴|fēng bào] [把|bǎ] [它|tā] [打|dǎ] [成|chéng] [了|le] [四|sì] [块|kuài] ， [沙子|shā zi] [把|bǎ] [碎片|suì piàn] [都|dōu] [吃|chī] [掉|diào] [了|le] ！ [你|nǐ] [能|néng] [帮|bāng] [我|wǒ] [找|zhǎo] [吗|ma] ？ [你|nǐ] [的|de] [小|xiǎo] [朋友|péng you] [会|huì] [挖|wā] ， [对|duì] [吧|ba] ？',
      'わたし の つぼ ！ [嵐|あらし] で [四|よっ]つ に [割|わ]れて 、 [砂|すな] が かけら を [食|た]べちゃった ！ [探|さが]して くれる ？ その [子|こ] 、 [掘|ほ]れる ん でしょ ？'),
    't.more': T('Little mounds of sand with a flag on top: that’s where the pieces are!', 'Montoncitos de arena con una banderita: ¡ahí están los pedazos!', 'Montinhos de areia com uma bandeirinha: os pedaços estão ali!',
      'Kleine Sandhaufen mit einem Fähnchen drauf: Da sind die Stücke!', '[插|chā] [着|zhe] [小|xiǎo] [旗子|qí zi] [的|de] [小|xiǎo] [沙堆|shā duī] ： [碎片|suì piàn] [就|jiù] [在|zài] [那里|nà lǐ] ！',
      '[小|ちい]さな [旗|はた] が [立|た]って いる [砂山|すなやま] ！ そこ に かけら が ある の ！'),
    't.done': T('All four! I glue them… there! It’s a bit wonky, but it’s mine. Thank you! Here, these coins are for you.',
      '¡Los cuatro! Los pego… ¡listo! Está un poco torcida, pero es mía. ¡Gracias! Toma, estas monedas son para ti.',
      'Os quatro! Eu colo… pronto! Ficou meio torto, mas é meu. Obrigada! Toma, essas moedas são para você.',
      'Alle vier! Ich klebe sie … fertig! Er ist ein bisschen schief, aber er ist meiner. Danke! Hier, die Münzen sind für dich.',
      '[四|sì] [块|kuài] [都|dōu] [齐|qí] [了|le] ！ [我|wǒ] [粘|zhān] [起来|qǐ lái] … [好|hǎo] [了|le] ！ [有点|yǒu diǎn] [歪|wāi] ， [可|kě] [它|tā] [是|shì] [我|wǒ] [的|de] 。 [谢谢|xiè xie] ！ [这些|zhè xiē] [硬币|yìng bì] [给|gěi] [你|nǐ] 。',
      '[四|よっ]つ ぜんぶ ！ くっつけて … できた ！ ちょっと ゆがんで る けど 、 わたし の だ よ 。 ありがとう ！ はい 、 この コイン あげる 。'),
    't.chat': T('When I grow up, I’ll be an archaeologist like Elvira!', '¡De grande voy a ser arqueóloga, como Elvira!', 'Quando eu crescer, vou ser arqueóloga, igual à Elvira!', 'Wenn ich groß bin, werde ich Archäologin, wie Elvira!',
      '[我|wǒ] [长大|zhǎng dà] [了|le] [要|yào] [当|dāng] [考古学家|kǎo gǔ xué jiā] ， [像|xiàng] [埃尔维拉|Āi ěr wéi lā] [一样|yí yàng] ！', '[大|おお]きく なったら 、 エルビラ さん みたい な [考古学者|こうこがくしゃ] に なる ！'),
    // the Door of Days' inscription
    'door.read': T('Tell me your morning.', 'Cuéntame tu mañana.', 'Conte-me a sua manhã.', 'Erzähl mir deinen Morgen.', '[给|gěi] [我|wǒ] [讲讲|jiǎng jiang] [你|nǐ] [的|de] [早晨|zǎo chen] 。', 'あなた の [朝|あさ] を [話|はな]して 。'),
    // the Great Worm (ruins_temple.js), and after
    'k.wake': T('Who’s digging in MY sand?! This bell is mine! Under the sand, nobody can touch me!', '¡¿Quién cava en MI arena?! ¡Esta campana es mía! ¡Bajo la arena nadie me puede tocar!',
      'Quem está cavando na MINHA areia?! Este sino é meu! Debaixo da areia, ninguém me toca!', 'Wer gräbt in MEINEM Sand?! Diese Glocke gehört mir! Unter dem Sand kann mich keiner treffen!',
      '[谁|shéi] [在|zài] [挖|wā] [我|wǒ] [的|de] [沙子|shā zi] ？ ！ [这|zhè] [口|kǒu] [钟|zhōng] [是|shì] [我|wǒ] [的|de] ！ [在|zài] [沙子|shā zi] [下面|xià miàn] ， [谁|shéi] [也|yě] [碰|pèng] [不|bú] [到|dào] [我|wǒ] ！',
      'わし の [砂|すな] を [掘|ほ]る の は だれ だ ？ ！ この [鐘|かね] は わし の もの だ ！ [砂|すな] の [下|した] なら 、 だれ も わし に さわれ ない ぞ ！'),
    'k.after': T('Ugh… so bright up here… I only wanted a quiet place to sleep. Ring your bell. I’ll go back down, where it’s dark.', 'Uf… qué luz… Yo solo quería un lugar tranquilo para dormir. Toquen su campana. Yo me voy abajo, donde está oscuro.',
      'Ufa… quanta luz… Eu só queria um lugar quieto para dormir. Toquem o sino. Eu vou lá para baixo, onde é escuro.', 'Uff … so hell hier … Ich wollte nur einen ruhigen Platz zum Schlafen. Läutet eure Glocke. Ich gehe nach unten, wo es dunkel ist.',
      '[唉|ài] … [好|hǎo] [亮|liàng] … [我|wǒ] [只|zhǐ] [想|xiǎng] [找|zhǎo] [个|gè] [安静|ān jìng] [的|de] [地方|dì fang] [睡觉|shuì jiào] 。 [你们|nǐ men] [敲|qiāo] [钟|zhōng] [吧|ba] 。 [我|wǒ] [回|huí] [下面|xià miàn] [黑|hēi] [的|de] [地方|dì fang] [去|qù] 。',
      'うう … まぶしい … [静|しず]か に [眠|ねむ]れる [場所|ばしょ] が ほしかった だけ だ 。 [鐘|かね] を [鳴|な]らせ 。 わし は [暗|くら]い [下|した] へ [帰|かえ]る 。'),
  };
  // what the demonstrations show (the word highlighted, glossed small; EN on request): per line, per language
  const MARKS = {
    'f.demo': ['v.dig'],
    'f.hat': { es: [['Mi', 'my']], pt: [['meu', 'my']], de: [['Mein', 'my']], zh: [['[我|wǒ] [的|de]', 'my']], ja: [['ぼく の', 'my']] },
    'e.demo': { es: [['Es tu', 'it’s your']], pt: [['É o seu', 'it’s your']], de: [['Das ist dein', 'that’s your']], zh: [['[你|nǐ] [的|de]', 'your']], ja: [['フェルミン さん の', 'Fermín’s']] },
    'd.up': { es: [['me levanto', 'I get up'], ['me lavo', 'I wash']], pt: [['me levanto', 'I get up'], ['lavo o rosto', 'I wash my face']], de: [['stehe auf', 'get up'], ['wasche mir', 'wash (my)']],
      zh: [['[起床|qǐ chuáng]', 'get up'], ['[洗|xǐ] [脸|liǎn]', 'wash my face']], ja: [['[起|お]きて', 'get up'], ['[顔|かお] を [洗|あら]って', 'wash my face']] },
    'n.up': { es: [['Me seco', 'I dry'], ['me peino', 'I comb my hair']], pt: [['me enxugo', 'I dry off'], ['me penteio', 'I comb my hair']], de: [['trockne mir', 'dry (my)'], ['kämme mich', 'comb my hair']],
      zh: [['[擦干|cā gān]', 'dry'], ['[梳头|shū tóu]', 'comb my hair']], ja: [['ふいて', 'wipe dry'], ['[髪|かみ] を とかして', 'comb my hair']] },
    's.up': { es: [['Mis', 'my'], ['Me pongo', 'I put on']], pt: [['meus', 'my'], ['coloco', 'I put on']], de: [['Meine', 'my'], ['setze mir', 'put on (myself)']],
      zh: [['[我|wǒ] [的|de]', 'my'], ['[戴上|dài shang]', 'put on']], ja: [['わたし の', 'my'], ['かけて', 'put on']] },
    'g.up': { es: [['Mi', 'my'], ['Me peino', 'I comb my hair']], pt: [['meu', 'my'], ['me penteio', 'I comb my hair']], de: [['Mein', 'my'], ['kämme mich', 'comb my hair']],
      zh: [['[我|wǒ] [的|de]', 'my'], ['[梳|shū] [梳|shu] [头|tóu]', 'comb my hair']], ja: [['ぼく の', 'my'], ['[髪|かみ] を とかして', 'comb my hair']] },
    'panel0': { es: [['se levanta', 'gets up']], pt: [['se levanta', 'gets up']], de: [['steht', 'gets'], ['auf', 'up']], zh: [['[起床|qǐ chuáng]', 'gets up']], ja: [['[起|お]きます', 'gets up']] },
  };
  // the Wall of Days: the bell keeper's day in six carved panels (reading: the reflexive, third person)
  const PANELS_T = [
    T('Every morning, the bell keeper gets up with the sun.', 'Cada mañana, la campanera se levanta con el sol.', 'Toda manhã, a sineira se levanta com o sol.', 'Jeden Morgen steht die Glöcknerin mit der Sonne auf.',
      '[每天|měi tiān] [早上|zǎo shang] ， [守钟人|shǒu zhōng rén] [跟|gēn] [太阳|tài yáng] [一起|yì qǐ] [起床|qǐ chuáng] 。', '[毎朝|まいあさ] 、 [鐘守|かねもり] は [日|ひ] の [出|で] と いっしょ に [起|お]きます 。'),
    T('She washes her face at the fountain.', 'Se lava la cara en la fuente.', 'Ela lava o rosto na fonte.', 'Sie wäscht sich am Brunnen das Gesicht.',
      '[她|tā] [在|zài] [泉|quán] [边|biān] [洗|xǐ] [脸|liǎn] 。', '[泉|いずみ] で [顔|かお] を [洗|あら]います 。'),
    T('She combs her long hair and gets dressed.', 'Se peina el pelo largo y se viste.', 'Ela se penteia e se veste.', 'Sie kämmt sich die langen Haare und zieht sich an.',
      '[她|tā] [梳|shū] [长|cháng] [头发|tóu fa] ， [穿|chuān] [衣服|yī fu] 。', '[長|なが]い [髪|かみ] を とかして 、 [服|ふく] を [着|き]ます 。'),
    T('She has breakfast: bread and dates.', 'Desayuna pan y dátiles.', 'Ela toma café da manhã: pão e tâmaras.', 'Sie frühstückt Brot und Datteln.',
      '[她|tā] [吃|chī] [早饭|zǎo fàn] ： [面包|miàn bāo] [和|hé] [枣|zǎo] 。', '[朝|あさ]ごはん に パン と なつめ を [食|た]べます 。'),
    T('She climbs up to the temple and rings the bell, and the town wakes up.', 'Sube al templo y toca la campana, y el pueblo se despierta.', 'Ela sobe ao templo e toca o sino, e a cidade acorda.',
      'Sie steigt auf den Tempel und läutet die Glocke, und die Stadt wacht auf.', '[她|tā] [爬|pá] [上|shàng] [神庙|shén miào] ， [敲|qiāo] [钟|zhōng] ， [全城|quán chéng] [都|dōu] [醒|xǐng] [了|le] 。',
      '[神殿|しんでん] に [登|のぼ]って [鐘|かね] を [鳴|な]らす と 、 [町|まち] が [目|め] を [覚|さ]まします 。'),
    T('At night she goes to bed late, and dreams of the bell.', 'Por la noche se acuesta tarde y sueña con la campana.', 'À noite, ela se deita tarde e sonha com o sino.', 'Abends geht sie spät ins Bett und träumt von der Glocke.',
      '[晚上|wǎn shang] [她|tā] [很|hěn] [晚|wǎn] [睡觉|shuì jiào] ， [梦见|mèng jiàn] [那|nà] [口|kǒu] [钟|zhōng] 。', '[夜|よる] は おそく [寝|ね]て 、 [鐘|かね] の [夢|ゆめ] を [見|み]ます 。'),
  ];
  // what each carving shows (the card's note: the picture, never the sentence's English)
  const PANEL_PIC = ['A woman stretches beside her bed. Behind her, the sun comes up.', 'She bends over a fountain, water in her hands.', 'A long comb in her hair; a robe over her arm.',
    'A little table: a loaf of bread, a bowl of dates.', 'She climbs the temple steps. Above her, the bell; below, the houses open their doors.', 'The moon. She lies in bed, smiling, a little bell in a cloud over her head.'];
  // Noa's page, from the temple's bell chamber
  const PAGE = {
    es: ['En los muros está tallado el día de la campanera: se levantaba, se lavaba la cara, tocaba la campana. Cien años después, nadie la toca. Dicen que el Silencio es más espeso en la ciénaga, al pie de la Torre Vieja. Voy para allá.'],
    pt: ['Nos muros está esculpido o dia da sineira: ela se levantava, lavava o rosto, tocava o sino. Cem anos depois, ninguém toca. Dizem que o Silêncio é mais forte no pântano, ao pé da Torre Velha. Vou para lá.'],
    de: ['An den Wänden ist der Tag der Glöcknerin eingeritzt: Sie stand auf, wusch sich das Gesicht, läutete die Glocke. Hundert Jahre später läutet sie niemand mehr. Man sagt, im Moor am Fuß des Alten Turms ist die Stille am dichtesten. Da gehe ich als Nächstes hin.'],
    zh: ['[墙|qiáng] [上|shàng] [刻|kè] [着|zhe] [守钟人|shǒu zhōng rén] [的|de] [一天|yì tiān] ： [她|tā] [起床|qǐ chuáng] ， [洗|xǐ] [脸|liǎn] ， [敲|qiāo] [钟|zhōng] 。 [一百|yì bǎi] [年|nián] [后|hòu] ， [没有|méi yǒu] [人|rén] [敲|qiāo] [了|le] 。 [听说|tīng shuō] [古塔|gǔ tǎ] [脚下|jiǎo xià] [的|de] [沼泽|zhǎo zé] [里|lǐ] ， [寂静|Jì jìng] [最|zuì] [浓|nóng] 。 [我|wǒ] [下|xià] [一|yí] [站|zhàn] [就|jiù] [去|qù] [那里|nà lǐ] 。'],
    ja: ['[壁|かべ] に は [鐘守|かねもり] の [一日|いちにち] が [刻|きざ]まれて いる 。 [起|お]きて 、 [顔|かお] を [洗|あら]って 、 [鐘|かね] を [鳴|な]らした 。 [百年|ひゃくねん] [後|ご] 、 だれ も [鳴|な]らさない 。 [古|ふる]い [塔|とう] の ふもと の [沼|ぬま] で は 、 [静寂|せいじゃく] が いちばん [濃|こ]い そう だ 。 [次|つぎ] は そこ へ [行|い]く 。'],
    en: ['The bell keeper’s day is carved on the walls: she got up, washed her face, rang the bell. A hundred years later, nobody rings it. They say the Hush is thickest in the marsh at the foot of the Old Tower. I’m going there next.'],
  };
  if (typeof LINES !== 'undefined' && !LINES['page.ruins']) LINES['page.ruins'] = PAGE;
  // Fermín's demonstration in the shared LINES too (the Old Tower's floor 7 plaque recaps «cava» with it: 'ruins.demo.dig')
  if (typeof LINES !== 'undefined' && !LINES['ruins.demo.dig']) { const D = RL['f.demo']; LINES['ruins.demo.dig'] = { es: [D.es], pt: [D.pt], de: [D.de], zh: [D.zh], ja: [D.ja], en: [D.en] }; }
  // the people's names (zh / ja: the notation, shown in the mode's text)
  const NAMES = { quino: ['Quino', '[基诺|Jī nuò]', 'キノ'], fermin: ['Fermín', '[费尔明|Fèi ěr míng]', 'フェルミン'], elvira: ['Elvira', '[埃尔维拉|Āi ěr wéi lā]', 'エルビラ'],
    dario: ['Darío', '[达里奥|Dá lǐ ào]', 'ダリオ'], nadia: ['Nadia', '[娜迪娅|Nà dí yà]', 'ナディア'], salome: ['Salomé', '[萨洛梅|Sà luò méi]', 'サロメ'], gaspar: ['Gaspar', '[加斯帕尔|Jiā sī pà ěr]', 'ガスパル'],
    tula: ['Tula', '[图拉|Tú lā]', 'トゥラ'], worm: ['the Great Worm', '[大沙虫|dà shā chóng]', '[大|おお]ミミズ'] };
  const WORM_NAME = { es: 'el Gran Gusano', pt: 'a Minhocona', de: 'der Riesenwurm', en: 'the Great Worm' };
  function nameOf(id) {
    const N = NAMES[id], l = (typeof UI !== 'undefined' && UI.lang) || 'es'; if (!N) return id;
    if (id === 'worm' && WORM_NAME[l]) return WORM_NAME[l];
    if ((l === 'zh' || l === 'ja') && typeof CJK !== 'undefined') return CJK.plain(N[l === 'zh' ? 1 : 2], { lang: l });
    return N[0];
  }
  // (zh / ja: the dictionary that reads what you type, and the readings, learn every line here)
  if (typeof CJK !== 'undefined' && CJK.addSource) {
    const all = [];
    for (const t of Object.values(RL).concat(PANELS_T)) all.push(t.zh, t.ja);
    all.push(...PAGE.zh, ...PAGE.ja); for (const n of Object.values(NAMES)) all.push(n[1], n[2]);
    for (const s of all) if (s) { try { CJK.addSource(s); } catch (e) { /* */ } }
  }
  Object.assign(C, { LINES: RL, T, MARKS, PANELS_T, PANEL_PIC, PAGE, NAMES, nameOf });
})();

// ================================================================ the build
(() => {
  const C = RUINS, INK = C.INK;
  const { SPOT, PIER, SHIP, SLIDE, TEMPLE, DOOR, WALL, PANELS, BUILDINGS, THINGS, SHARDS, POOL, CAVE, FLOOR } = C;
  const HAT = C.HAT = { x: 151.4, z: 17.0 };                   // Fermín's hat, under a mound by the canopy (Elvira's demonstration)
  const WATER_Y = WORLD.L.water;
  const LOOKS = {
    quino: { shirt: '#2f3f6a', pants: '#3f3a4a', skin: '#a8714a', hair: '#e8e4dc', hat: 'captain', hatCol: '#2f3f6a', beard: true, old: true, wide: 1.15 },
    fermin: { shirt: '#c98e4a', pants: '#5a4a3a', skin: '#b07850', hair: '#2e2420', hat: 'straw', hatCol: '#d9b46a', band: '#8a5a3a', beard: true, scarf: '#e2574c' },
    fermin0: { shirt: '#c98e4a', pants: '#5a4a3a', skin: '#b07850', hair: '#2e2420', beard: true, scarf: '#e2574c' },
    elvira: { shirt: '#f2e3c4', pants: '#7a6a52', skin: '#c98e62', hair: '#8a8580', hat: 'straw', hatCol: '#e8d9a8', band: '#4c7fd8', bun: true, scarf: '#4c9a8a' },
    dario: { shirt: '#e0a43c', pants: '#4a4f66', skin: '#d9a27a', hair: '#3a2b26', mustache: true },
    nadia: { shirt: '#e2574c', pants: '#6b5a3e', skin: '#8a5a3a', hair: '#1f1a18', hat: 'bandana', hatCol: '#f2c94c', apron: '#f4efe2' },
    salome: { shirt: '#5f8fbf', skirt: '#6b4a3a', skin: '#efc29a', hair: '#8a4a2a', bun: true },
    gaspar: { shirt: '#5fb257', pants: '#3f3a4a', skin: '#a8714a', hair: '#2e2420', wide: 1.1 },
    tula: { shirt: '#f2c94c', skirt: '#c9643f', skin: '#c98e62', hair: '#3a2b26', kid: true, pigtails: true },
  };
  // (Darío sleeps in the hammock until his alarm clock is back)
  const HAMMOCK = { x: SPOT.hammock.x, z: SPOT.hammock.z, len: 3.2, y: 0.95 };
  const FOUNTAIN = { x: 132.4, z: -0.6 };
  // the old town's broken walls: [x0, z0, x1, z1, height] (axis-aligned), and its columns: [x, z, height]
  const RUIN_WALLS = [[126.8, -7.4, 131.2, -7.4, 1.7], [131.2, -7.4, 131.2, -4.2, 1.2], [135.0, -8.2, 138.6, -8.2, 2.0], [135.0, -8.2, 135.0, -5.4, 1.4],
    [126.8, 4.2, 130.8, 4.2, 1.0], [126.8, 4.2, 126.8, 7.6, 1.9], [139.6, -1.6, 141.6, -1.6, 0.8], [129.0, 7.8, 132.0, 7.8, 0.7]];
  const COLUMNS = [[129.2, 2.6, 2.9], [131.6, 2.6, 1.3], [134.0, 2.6, 3.3], [136.4, 2.6, 0.9], [137.8, -3.6, 2.4], [125.9, -2.4, 1.1]];
  const SAND = '#e2c088', SAND_D = '#cfa86c', STONE = '#e3b98a', STONE_D = '#c99a68', WOOD = '#8a5f3e', WOOD_D = '#5a3a24', CANVAS = '#e9e0c8';

  // ---------------------------------------------------------------- the carvings on the Wall of Days (canvas pictures)
  function drawPanel(c, i, w, h) {
    c.fillStyle = '#e8c690'; c.fillRect(0, 0, w, h);
    const R = rng(91 + i * 7);
    for (let k = 0; k < 90; k++) { c.fillStyle = R() < 0.5 ? 'rgba(160,110,60,0.12)' : 'rgba(255,240,210,0.2)'; c.fillRect(R() * w, R() * h, 2 + R() * 6, 2 + R() * 4); }
    c.strokeStyle = '#a8784a'; c.lineWidth = 10; c.strokeRect(8, 8, w - 16, h - 16);
    const ln = (pts, lw = 7) => { c.lineWidth = lw; c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); };
    const carve = fn => { c.save(); c.translate(2, 2); c.strokeStyle = 'rgba(255,240,205,0.7)'; c.fillStyle = 'rgba(255,240,205,0.7)'; fn(); c.restore(); c.strokeStyle = '#7a4a2a'; c.fillStyle = '#7a4a2a'; fn(); };
    c.lineCap = 'round'; c.lineJoin = 'round';
    // a figure in a long robe: head, body, arms (a: [left angle, right angle] from straight down), at (x, y) its feet, s its size
    const keeper = (x, y, s, a = [0.3, -0.3], lean = 0) => {
      const top = y - s, sh = top + s * 0.28;
      c.beginPath(); c.arc(x + lean * s * 0.3, top + s * 0.1, s * 0.1, 0, TAU); c.fill();
      ln([[x + lean * s * 0.3, sh - s * 0.08], [x - s * 0.18, y], [x + s * 0.18, y], [x + lean * s * 0.3, sh - s * 0.08]], 5);
      for (const [k, an] of a.entries()) { const sx = x + lean * s * 0.3 + (k ? 1 : -1) * s * 0.06; ln([[sx, sh], [sx + Math.sin(an) * s * 0.34, sh + Math.cos(an) * s * 0.34]], 6); }
    };
    carve(() => {
      if (i === 0) {          // up with the sun: rays, a bed, arms up
        c.beginPath(); c.arc(w * 0.74, h * 0.34, 34, Math.PI, TAU); c.stroke();
        for (let k = 0; k < 7; k++) { const an = Math.PI + (k + 0.5) * Math.PI / 7; ln([[w * 0.74 + Math.cos(an) * 46, h * 0.34 + Math.sin(an) * 46], [w * 0.74 + Math.cos(an) * 66, h * 0.34 + Math.sin(an) * 66]], 5); }
        ln([[w * 0.1, h * 0.8], [w * 0.1, h * 0.66], [w * 0.42, h * 0.66], [w * 0.42, h * 0.8]], 6); ln([[w * 0.1, h * 0.7], [w * 0.42, h * 0.7]], 5);
        keeper(w * 0.6, h * 0.86, h * 0.5, [2.7, -2.7]);
      } else if (i === 1) {   // the fountain: a basin, water, hands to the face
        ln([[w * 0.12, h * 0.7], [w * 0.52, h * 0.7], [w * 0.46, h * 0.86], [w * 0.18, h * 0.86], [w * 0.12, h * 0.7]]);
        for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(w * 0.32, h * 0.62, 18 + k * 12, Math.PI * 1.15, Math.PI * 1.85); c.stroke(); }
        keeper(w * 0.7, h * 0.86, h * 0.52, [2.2, -2.2], -0.5);
        for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(w * 0.6 + k * 8, h * 0.44 + (k % 2) * 10, 3, 0, TAU); c.fill(); }
      } else if (i === 2) {   // a comb in long hair, a robe over the arm
        keeper(w * 0.4, h * 0.86, h * 0.56, [2.6, 0.5]);
        ln([[w * 0.36, h * 0.38], [w * 0.3, h * 0.66]], 4); ln([[w * 0.44, h * 0.38], [w * 0.5, h * 0.62]], 4);
        ln([[w * 0.32, h * 0.22], [w * 0.5, h * 0.22]], 7); for (let k = 0; k < 6; k++) ln([[w * 0.33 + k * 0.034 * w, h * 0.22], [w * 0.33 + k * 0.034 * w, h * 0.27]], 3);
        ln([[w * 0.66, h * 0.4], [w * 0.86, h * 0.4], [w * 0.82, h * 0.82], [w * 0.7, h * 0.82], [w * 0.66, h * 0.4]], 5);
      } else if (i === 3) {   // breakfast: bread and dates on a little table
        ln([[w * 0.14, h * 0.62], [w * 0.86, h * 0.62]], 8); ln([[w * 0.22, h * 0.62], [w * 0.22, h * 0.86]]); ln([[w * 0.78, h * 0.62], [w * 0.78, h * 0.86]]);
        c.beginPath(); c.ellipse(w * 0.36, h * 0.52, 46, 22, 0, 0, TAU); c.stroke(); for (let k = 0; k < 3; k++) ln([[w * 0.28 + k * 22, h * 0.45], [w * 0.31 + k * 22, h * 0.58]], 4);
        c.beginPath(); c.arc(w * 0.68, h * 0.52, 36, 0, Math.PI); c.stroke();
        for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(w * 0.6 + k * 10, h * 0.48 - (k % 2) * 6, 7, 11, 0.3, 0, TAU); c.fill(); }
      } else if (i === 4) {   // up the temple steps, the bell above, the town's doors open below
        for (let k = 0; k < 4; k++) ln([[w * (0.3 + k * 0.08), h * (0.86 - k * 0.1)], [w * (0.38 + k * 0.08), h * (0.86 - k * 0.1)], [w * (0.38 + k * 0.08), h * (0.76 - k * 0.1)]], 5);
        c.beginPath(); c.moveTo(w * 0.72, h * 0.16); c.quadraticCurveTo(w * 0.64, h * 0.2, w * 0.64, h * 0.36); c.lineTo(w * 0.8, h * 0.36); c.quadraticCurveTo(w * 0.8, h * 0.2, w * 0.72, h * 0.16); c.stroke();
        keeper(w * 0.58, h * 0.58, h * 0.3, [2.4, -0.6]);
        for (let k = 0; k < 3; k++) { const x = w * (0.08 + k * 0.08); ln([[x, h * 0.9], [x, h * 0.78], [x + 26, h * 0.72], [x + 52, h * 0.78], [x + 52, h * 0.9]], 4); }
        for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(w * 0.84 + k * 14, h * 0.26 + k * 10, 10 + k * 6, -0.8, 0.8); c.stroke(); }
      } else {                // night: the moon, stars, asleep, the bell in a dream
        c.beginPath(); c.arc(w * 0.2, h * 0.24, 30, 0.6, Math.PI * 1.75); c.arc(w * 0.27, h * 0.2, 26, Math.PI * 1.6, 0.75, true); c.fill();
        for (let k = 0; k < 6; k++) { const x = w * (0.42 + (k * 0.09) % 0.5), y = h * (0.12 + (k % 3) * 0.07); ln([[x - 7, y], [x + 7, y]], 3); ln([[x, y - 7], [x, y + 7]], 3); }
        ln([[w * 0.14, h * 0.84], [w * 0.14, h * 0.7], [w * 0.86, h * 0.7], [w * 0.86, h * 0.84]], 6);
        c.beginPath(); c.arc(w * 0.24, h * 0.64, 14, 0, TAU); c.fill(); ln([[w * 0.3, h * 0.66], [w * 0.8, h * 0.66]], 10);
        c.beginPath(); c.arc(w * 0.58, h * 0.4, 30, 0, TAU); c.stroke(); for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(w * 0.38 - k * 14, h * 0.52 + k * 8, 6 - k * 1.5, 0, TAU); c.stroke(); }
        c.beginPath(); c.moveTo(w * 0.58, h * 0.31); c.quadraticCurveTo(w * 0.53, h * 0.34, w * 0.53, h * 0.45); c.lineTo(w * 0.63, h * 0.45); c.quadraticCurveTo(w * 0.63, h * 0.34, w * 0.58, h * 0.31); c.fill();
      }
    });
    c.fillStyle = '#7a4a2a'; c.font = 'bold 34px Georgia, serif'; c.textAlign = 'center'; c.fillText(['I', 'II', 'III', 'IV', 'V', 'VI'][i], w / 2, h - 22);
  }
  // the map on Gaspar's easel
  function drawMapBoard(c, w, h) {
    c.fillStyle = '#f4e8cc'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#c8643c'; c.lineWidth = 6; c.beginPath(); c.moveTo(w * 0.3, 0); c.bezierCurveTo(w * 0.2, h * 0.4, w * 0.5, h * 0.6, w * 0.35, h); c.stroke();
    c.beginPath(); c.moveTo(w * 0.75, 0); c.bezierCurveTo(w * 0.85, h * 0.4, w * 0.6, h * 0.6, w * 0.8, h); c.stroke();
    c.fillStyle = '#3f8fb5'; c.beginPath(); c.ellipse(w * 0.55, h * 0.88, 50, 22, 0, 0, TAU); c.fill();
    c.fillStyle = '#9a5a8a'; c.fillRect(w * 0.45, h * 0.08, 60, 24);
    c.strokeStyle = '#2b2235'; c.lineWidth = 3; c.setLineDash([8, 6]); c.beginPath(); c.moveTo(w * 0.55, h * 0.8); c.lineTo(w * 0.52, h * 0.45); c.lineTo(w * 0.55, h * 0.2); c.stroke(); c.setLineDash([]);
    c.fillStyle = '#e2574c'; c.font = 'bold 40px Georgia, serif'; c.fillText('✕', w * 0.5, h * 0.2);
  }

  // ---------------------------------------------------------------- the build
  function build(scene, { terrainAt }) {
    const group = new THREE.Group(); group.name = 'ruins'; scene.add(group);
    const colliders = [], platforms = [], moving = [], people = [];
    const Hh = (x, z) => terrainAt(x, z);
    const Kit = () => GARDENS.Kit(), GG = GARDENS.GEO;
    const sub = (x, y, z, ry = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; group.add(g); return g; };
    const objects = {};

    // the water: the cove and its channel out into the sea cave, and the oasis pool
    {
      const wm = new THREE.MeshToonMaterial({ color: '#3f9fc0', gradientMap: TK.grad, transparent: true, opacity: 0.86, emissive: new THREE.Color('#0d3a4a') });
      const cove = new THREE.Mesh(new THREE.PlaneGeometry(34, 34, 1, 1), wm); cove.rotation.x = -Math.PI / 2; cove.position.set(136.5, WATER_Y, 61); group.add(cove);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(POOL.r + 0.4, 24), wm); pool.rotation.x = -Math.PI / 2; pool.position.set(POOL.x, WATER_Y + 0.02, POOL.z); group.add(pool);
      // the sea cave: dark inside, its rock arch over the channel
      const dark = new THREE.Mesh(new THREE.PlaneGeometry(CAVE.w + 8, CAVE.h + 6), new THREE.MeshBasicMaterial({ color: '#141a24' })); dark.position.set(CAVE.x, CAVE.h / 2 - 2, CAVE.z + 1.9); dark.rotation.y = Math.PI; group.add(dark);
      const k = Kit(), R = rng(17);
      for (const s of [-1, 1]) for (let j = 0; j < 7; j++) k.add(GG.ico1, CAVE.x + s * (CAVE.w / 2 + 0.6 + R() * 0.6), -1.5 + j * 1.8, CAVE.z + R() * 0.8, 1.8 + R() * 0.8, 1.4 + R() * 0.5, 1.6 + R() * 0.6, ['#c8643c', '#b4532f', '#d9834f'][j % 3], { ry: R() * 3, ink: 0.04 });
      for (let j = 0; j <= 8; j++) { const a = Math.PI * j / 8; k.add(GG.ico1, CAVE.x + Math.cos(a) * (CAVE.w / 2 + 0.6), 9.6 + Math.sin(a) * 2.4, CAVE.z + 0.3, 1.9, 1.5, 1.8, ['#b4532f', '#c96f45', '#a9492c'][j % 3], { ry: j, ink: 0.04 }); }
      k.build(group);
    }
    // the pier (a platform you walk on), and «El Viento Sur» tied up beside it
    {
      const k = Kit(), len = PIER.z1 - PIER.z0, zc = (PIER.z0 + PIER.z1) / 2;
      k.box(PIER.x, PIER.y - 0.08, zc, PIER.w, 0.16, len, '#9a7048', { ink: 0.02 });
      for (let z = PIER.z0 + 0.4; z < PIER.z1; z += 0.62) k.box(PIER.x, PIER.y + 0.005, z, PIER.w + 0.06, 0.02, 0.06, '#7a5434', { ink: 0 });
      for (let z = PIER.z0 + 1; z <= PIER.z1; z += 2.4) for (const s of [-1, 1]) k.add(GG.cyl6, PIER.x + s * (PIER.w / 2 + 0.05), PIER.y - 1.4, z, 0.13, 3.2, 0.13, WOOD_D, { ink: 0.01 });
      for (const s of [-1, 1]) k.add(GG.cyl6, PIER.x + s * 0.9, PIER.y + 0.3, PIER.z1 - 0.5, 0.1, 0.6, 0.1, WOOD_D, { ink: 0.01 });
      k.build(group);
      platforms.push({ box: [PIER.x - PIER.w / 2, PIER.x + PIER.w / 2, PIER.z0, PIER.z1], top: PIER.y });
      // the ship: bow to the north (local −z), its own group so it can sail in and out
      const sg = sub(SHIP.x, 0, SHIP.z, 0), sk = Kit(), L = SHIP.len, Bm = SHIP.beam;
      sk.box(0, 0.1, 0.4, Bm, 1.6, L - 0.8, '#2f3f5a', { ink: 0.03 }).box(0, 0.95, 0.4, Bm + 0.1, 0.1, L - 0.6, '#e8e0cf', { ink: 0.01 }).box(0, -0.45, 0.4, Bm - 0.3, 0.4, L - 1.2, '#a8332c', { ink: 0.01 });
      sk.add(GG.prism, 0, 0.1, 0.4 - (L - 0.8) / 2, Bm, 2.2, 1.6, '#2f3f5a', { rx: -Math.PI / 2, ink: 0.03 });      // (the bow: a wedge pointing north)
      sk.box(0, 1.5, 2.6, 2.4, 1.1, 2.8, '#f4efe2', { ink: 0.02 }).box(0, 2.1, 2.6, 2.7, 0.12, 3.1, '#a8332c', { ink: 0.01 });
      for (const s of [-1, 1]) sk.box(s * 1.21, 1.55, 2.6, 0.02, 0.4, 1.8, '#3d5a7a', { ink: 0 });
      sk.add(GG.cyl6, 0, 4.4, -0.8, 0.12, 7.2, 0.12, WOOD_D, { ink: 0.012 }).box(0, 7.4, -0.8, 0.5, 0.08, 0.08, WOOD_D, { ink: 0 });
      sk.add(GG.prism, 0, 1.6, -1.0, 3.2, 5.0, 0.06, '#f6f1e6', { ry: Math.PI / 2, ink: 0.012 });
      sk.box(0, 7.8, -0.8, 0.02, 0.5, 0.8, '#e2574c', { ink: 0 });
      for (let i = 0; i < 4; i++) sk.add(GG.cyl, Bm / 2 + 0.02, 0.5, -3.4 + i * 2.2, 0.28, 0.06, 0.28, '#f4efe2', { rz: Math.PI / 2, ink: 0.006 });
      sk.build(sg); objects.ship = sg; sg.userData.home = { x: SHIP.x, z: SHIP.z };
    }
    // the sand slide that blocks the gully (Mimo digs it away)
    {
      const g = sub(SLIDE.x, Hh(SLIDE.x, SLIDE.z) - 0.2, SLIDE.z), k = Kit(), R = rng(5);
      k.add(GG.sphere, 0, 0, 0, SLIDE.r, 2.3, SLIDE.r * 0.85, SAND, { ink: 0.03 });
      for (let i = 0; i < 6; i++) { const a = R() * TAU, d = 1.6 + R() * 1.6; k.add(GG.sphere, Math.cos(a) * d, 0.6 + R() * 0.8, Math.sin(a) * d * 0.8, 1.0 + R() * 0.6, 0.7 + R() * 0.4, 0.9 + R() * 0.5, R() < 0.5 ? SAND : SAND_D, { ink: 0.02 }); }
      k.build(g); objects.slide = g;
      objects.slideSolid = { x: SLIDE.x, z: SLIDE.z, r: SLIDE.r - 0.2 }; moving.push(objects.slideSolid);
      // Fermín's tools by the slide: a wheelbarrow, a bucket
      const t = Kit(), x = SPOT.ferminDig.x + 1.6, z = SPOT.ferminDig.z + 1.2, y = Hh(x, z);
      t.box(x, y + 0.45, z, 0.8, 0.36, 1.1, '#5f7f8a', { ry: 0.4, ink: 0.015 }).add(GG.cyl, x - 0.2, y + 0.22, z - 0.65, 0.22, 0.08, 0.22, '#3a3046', { rz: Math.PI / 2, ry: 0.4, ink: 0.008 });
      t.add(GG.cyl, x - 1.0, y + 0.22, z + 0.8, 0.22, 0.44, 0.22, '#9aa4ae', { ink: 0.01 });
      t.build(group);
    }
    // the dig camp: the canopy, the tents, the hammock, the basin, the desk, the map easel, the fire, the dig site, crates
    {
      const k = Kit(), R = rng(29);
      for (const b of BUILDINGS) {
        const y = Hh(b.x, b.z);
        if (b.kind === 'canopy') {
          k.at(b.x, y, b.z, b.rot);
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) k.add(GG.cyl6, sx * (b.w / 2 - 0.2), 1.3, sz * (b.d / 2 - 0.2), 0.07, 2.6, 0.07, WOOD_D, { ink: 0.01 });
          for (let i = 0; i < 6; i++) k.box(-b.w / 2 + (i + 0.5) * b.w / 6, 2.62, 0, b.w / 6, 0.05, b.d + 0.3, i % 2 ? '#c9643f' : CANVAS, { ink: 0.008 });
          k.box(0, 0.78, -0.3, 3.4, 0.08, 1.1, '#a87850', { ink: 0.015 });
          for (const sx of [-1.5, 1.5]) for (const sz of [-0.75, 0.15]) k.add(GG.cyl6, sx, 0.38, sz, 0.05, 0.76, 0.05, WOOD_D, { ink: 0 });
          k.add(GG.cyl, -1.0, 0.98, -0.4, 0.2, 0.32, 0.2, '#c96f45', { ink: 0.01 }).add(GG.sphere, -0.3, 0.9, -0.2, 0.18, 0.12, 0.14, '#f4efe2', { ink: 0.008 }).box(0.7, 0.84, -0.3, 0.7, 0.03, 0.5, '#f4e8cc', { ry: 0.2, ink: 0.006 });
          k.add(GG.cyl, 1.3, 0.95, -0.5, 0.12, 0.26, 0.12, '#d9a43c', { ink: 0.008 });
          k.free();
          colliders.push({ obox: 1, x: b.x, z: b.z - 0.3, hw: 1.8, hd: 0.65, rot: b.rot });
          for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = Math.cos(b.rot), s = Math.sin(b.rot), lx = sx * (b.w / 2 - 0.2), lz = sz * (b.d / 2 - 0.2); colliders.push({ x: b.x + lx * c + lz * s, z: b.z - lx * s + lz * c, r: 0.12 }); }
        } else if (b.kind === 'tent') {
          k.at(b.x, y, b.z, b.rot);
          k.add(GG.prism, 0, 0, 0, b.w, 2.0, b.d, ['#d8c08a', '#c9b07a', '#bfae86'][BUILDINGS.indexOf(b) % 3], { ink: 0.03 });
          k.add(GG.prism, 0, 0.02, b.d / 2 + 0.01, 1.0, 1.3, 0.02, '#4a3a2a', { ink: 0 });
          for (const s of [-1, 1]) k.rod(GG.cyl6, [s * (b.w / 2 + 0.6), 0, b.d / 2 + 0.4], [s * 0.2, 1.9, b.d / 2], 0.015, '#8a7a5a', 0);
          k.free();
          colliders.push({ obox: 1, x: b.x, z: b.z, hw: b.w / 2, hd: b.d / 2, rot: b.rot });
        }
      }
      // the hammock between two posts (Darío in it)
      { const H0 = HAMMOCK, y = Hh(H0.x, H0.z);
        for (const s of [-1, 1]) k.add(GG.cyl6, H0.x + s * (H0.len / 2 + 0.3), y + 0.8, H0.z, 0.08, 1.6, 0.08, WOOD_D, { ink: 0.012 });
        for (let i = 0; i < 8; i++) { const u = (i + 0.5) / 8 - 0.5, sag = 0.28 * (1 - 4 * u * u); k.box(H0.x + u * H0.len, y + H0.y - sag, H0.z, H0.len / 8 + 0.02, 0.05, 0.9, i % 2 ? '#4c9a8a' : '#e9c45a', { ink: 0.006 }); }
        for (const s of [-1, 1]) k.rod(GG.cyl6, [H0.x + s * (H0.len / 2 + 0.3), y + 1.5, H0.z], [H0.x + s * H0.len / 2, y + H0.y, H0.z], 0.02, '#8a7a5a', 0);
        colliders.push({ obox: 1, x: H0.x, z: H0.z, hw: H0.len / 2 + 0.4, hd: 0.5, rot: 0 }); }
      // Nadia's wash basin, Salomé's desk, Gaspar's easel, the fire, the dig site
      { const B0 = SPOT.basin, y = Hh(B0.x, B0.z);
        k.add(GG.cyl6, B0.x, y + 0.4, B0.z, 0.12, 0.8, 0.12, WOOD_D, { ink: 0.01 }).add(GG.cyl, B0.x, y + 0.86, B0.z, 0.42, 0.16, 0.42, '#9aa4ae', { ink: 0.012 }).add(GG.cyl, B0.x, y + 0.93, B0.z, 0.36, 0.02, 0.36, '#7fc4dc', { ink: 0 });
        colliders.push({ x: B0.x, z: B0.z, r: 0.45 }); }
      { const D0 = SPOT.desk, y = Hh(D0.x, D0.z);
        k.box(D0.x, y + 0.74, D0.z, 1.6, 0.06, 0.8, '#a87850', { ink: 0.012 });
        for (const sx of [-0.7, 0.7]) for (const sz of [-0.32, 0.32]) k.add(GG.cyl6, D0.x + sx, y + 0.37, D0.z + sz, 0.04, 0.74, 0.04, WOOD_D, { ink: 0 });
        k.box(D0.x - 0.3, y + 0.78, D0.z, 0.5, 0.02, 0.36, '#fffaf0', { ry: 0.2, ink: 0.004 }).box(D0.x + 0.35, y + 0.79, D0.z + 0.05, 0.4, 0.04, 0.3, '#c96f45', { ry: -0.3, ink: 0.006 });
        k.add(GG.cyl, D0.x + 0.1, y + 0.8, D0.z - 0.22, 0.06, 0.02, 0.06, '#d9e6ee', { rx: Math.PI / 2, ink: 0.004 });
        colliders.push({ obox: 1, x: D0.x, z: D0.z, hw: 0.85, hd: 0.45, rot: 0 }); }
      { const E0 = SPOT.board, y = Hh(E0.x, E0.z);
        k.rod(GG.cyl6, [E0.x - 0.5, y, E0.z - 0.3], [E0.x - 0.3, y + 1.9, E0.z - 0.5], 0.03, WOOD, 0).rod(GG.cyl6, [E0.x + 0.5, y, E0.z - 0.3], [E0.x + 0.3, y + 1.9, E0.z - 0.5], 0.03, WOOD, 0).rod(GG.cyl6, [E0.x, y, E0.z - 1.0], [E0.x, y + 1.8, E0.z - 0.55], 0.03, WOOD, 0);
        const cv = document.createElement('canvas'); cv.width = 256; cv.height = 320; drawMapBoard(cv.getContext('2d'), 256, 320);
        const map = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.25), new THREE.MeshToonMaterial({ map: new THREE.CanvasTexture(cv), gradientMap: TK.grad })); map.position.set(E0.x, y + 1.25, E0.z - 0.4); map.rotation.x = -0.12; group.add(map);
        colliders.push({ x: E0.x, z: E0.z - 0.5, r: 0.5 }); }
      { const F0 = SPOT.fire, y = Hh(F0.x, F0.z);
        for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; k.add(GG.ico, F0.x + Math.cos(a) * 0.7, y + 0.12, F0.z + Math.sin(a) * 0.7, 0.2, 0.15, 0.2, '#9a8a7a', { ry: i, ink: 0.01 }); }
        for (let i = 0; i < 3; i++) k.add(GG.cyl6, F0.x, y + 0.2, F0.z, 0.07, 0.9, 0.07, WOOD_D, { ry: i * 1.05, rz: Math.PI / 2, ink: 0.008 });
        k.add(GG.cyl, F0.x, y + 0.42, F0.z, 0.2, 0.28, 0.2, '#3a3f48', { ink: 0.01 });
        colliders.push({ x: F0.x, z: F0.z, r: 0.8 }); }
      { const S0 = SPOT.digsite, y = Hh(S0.x, S0.z);
        k.box(S0.x, y + 0.02, S0.z, 3.2, 0.04, 2.2, '#bf9a62', { ink: 0 });
        for (const sx of [-1.6, 1.6]) for (const sz of [-1.1, 1.1]) k.add(GG.cyl6, S0.x + sx, y + 0.25, S0.z + sz, 0.03, 0.5, 0.03, WOOD, { ink: 0 });
        for (const sz of [-1.1, 1.1]) k.box(S0.x, y + 0.42, S0.z + sz, 3.2, 0.01, 0.01, '#f4efe2', { ink: 0 });
        for (const sx of [-1.6, 1.6]) k.box(S0.x + sx, y + 0.42, S0.z, 0.01, 0.01, 2.2, '#f4efe2', { ink: 0 });
        k.add(GG.cyl, S0.x + 2.2, y + 0.2, S0.z - 0.6, 0.2, 0.4, 0.2, '#e2574c', { ink: 0.01 }).add(GG.cyl, S0.x + 2.0, y + 0.08, S0.z + 0.5, 0.45, 0.06, 0.45, '#a87850', { ink: 0.01 }); }
      // crates and barrels by the tents; shovels leaning
      for (const [x, z, s] of [[155.4, 18.0, 0.8], [156.0, 19.0, 0.6], [150.2, 27.6, 0.7], [145.0, 9.2, 0.7], [156.2, 11.4, 0.8]]) { const y = Hh(x, z); k.box(x, y + s / 2, z, s, s, s, '#b8955a', { ry: R() * 2, ink: 0.015 }); colliders.push({ x, z, r: s * 0.7 }); }
      for (const [x, z] of [[154.8, 16.4], [146.0, 26.2]]) { const y = Hh(x, z); k.add(GG.cyl, x, y + 0.45, z, 0.32, 0.9, 0.32, '#8a5a3a', { ink: 0.015 }); colliders.push({ x, z, r: 0.38 }); }
      for (const [x, z, a] of [[154.6, 23.4, 0.3], [146.6, 11.2, -0.2]]) { const y = Hh(x, z); k.add(GG.cyl6, x, y + 0.7, z, 0.035, 1.4, 0.035, WOOD, { rz: a, ink: 0.006 }).box(x + Math.sin(a) * 0.7, y + 0.05, z, 0.26, 0.04, 0.32, '#a9b4c2', { ink: 0.006 }); }
      // Tula's little table with the broken jar
      { const x = SPOT.tula.x + 0.9, z = SPOT.tula.z - 0.5, y = Hh(x, z);
        k.box(x, y + 0.5, z, 0.8, 0.05, 0.6, '#a87850', { ink: 0.01 }).add(GG.cyl6, x, y + 0.25, z, 0.05, 0.5, 0.05, WOOD_D, { ink: 0 });
        k.add(GG.half, x - 0.1, y + 0.53, z, 0.2, 0.18, 0.2, '#c96f45', { ink: 0.008 });
        colliders.push({ x, z, r: 0.45 }); }
      k.build(group);
    }
    // the oasis: palms round the pool, reeds
    {
      const k = Kit(), R = rng(43);
      const palms = [[126.4, 23.0], [127.8, 30.2], [134.6, 30.0], [135.4, 21.4], [125.0, 27.4]];
      for (const [x, z] of palms) {
        const y = Hh(x, z), h = 4.6 + R() * 1.6, lean = (R() - 0.5) * 0.5, lz = (R() - 0.5) * 0.5;
        const top = [x + lean * h * 0.35, y + h, z + lz * h * 0.35];
        let prev = [x, y, z];
        for (let i = 1; i <= 5; i++) { const u = i / 5, p = [x + lean * h * 0.35 * u * u, y + h * u, z + lz * h * 0.35 * u * u]; k.rod(GG.cyl6, prev, p, 0.2 - u * 0.06, i % 2 ? '#9a7048' : '#8a6040', 0.01); prev = p; }
        for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + R(); k.add(GG.sphere, top[0] + Math.cos(a) * 1.0, top[1] - 0.25, top[2] + Math.sin(a) * 1.0, 1.25, 0.09, 0.32, i % 2 ? '#5fae4f' : '#4f9a45', { ry: -a, rz: 0.35, ink: 0.008 }); }
        k.add(GG.sphere, top[0], top[1] - 0.15, top[2], 0.26, 0.22, 0.26, '#7a5a2a', { ink: 0.008 });
        colliders.push({ x, z, r: 0.32 });
      }
      for (let i = 0; i < 16; i++) { const a = R() * TAU, d = POOL.r + 0.3 + R() * 0.8, x = POOL.x + Math.cos(a) * d, z = POOL.z + Math.sin(a) * d; k.add(GG.cyl6, x, Hh(x, z) + 0.45, z, 0.03, 0.9 + R() * 0.5, 0.03, '#7a9a4a', { rz: (R() - 0.5) * 0.4, ink: 0 }); }
      k.build(group);
    }
    // the old town: broken walls, columns, the bell keeper's dry fountain; the giant head in the nook
    {
      const k = Kit(), R = rng(71);
      for (const [x0, z0, x1, z1, h] of RUIN_WALLS) {
        const x = (x0 + x1) / 2, z = (z0 + z1) / 2, alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0), len = Math.hypot(x1 - x0, z1 - z0), y = Hh(x, z);
        const n = Math.max(2, Math.round(len / 0.9));
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n - 0.5, hh = h * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.7 + x))), px = alongX ? x + u * len : x, pz = alongX ? z : z + u * len;
          k.box(px, y + hh / 2 - 0.1, pz, alongX ? len / n + 0.02 : 0.5, hh, alongX ? 0.5 : len / n + 0.02, i % 2 ? STONE : STONE_D, { ink: 0.02 });
        }
        colliders.push({ obox: 1, x, z, hw: alongX ? len / 2 : 0.3, hd: alongX ? 0.3 : len / 2, rot: 0 });
      }
      for (const [x, z, h] of COLUMNS) { const y = Hh(x, z); k.add(GG.cyl, x, y + h / 2, z, 0.38, h, 0.38, STONE, { ink: 0.02 }).add(GG.box, x, y + 0.12, z, 0.95, 0.24, 0.95, STONE_D, { ink: 0.015 }); if (h > 2.5) k.box(x, y + h + 0.1, z, 0.9, 0.22, 0.9, STONE_D, { ink: 0.015 }); colliders.push({ x, z, r: 0.48 }); }
      for (let i = 0; i < 9; i++) { const x = 125 + R() * 16, z = -7 + R() * 14; if (Math.hypot(x - FOUNTAIN.x, z - FOUNTAIN.z) < 2.5) continue; k.add(GG.ico, x, Hh(x, z) + 0.15, z, 0.3 + R() * 0.3, 0.2, 0.3 + R() * 0.2, STONE_D, { ry: R() * 3, ink: 0.012 }); }
      { const F0 = FOUNTAIN, y = Hh(F0.x, F0.z);
        k.add(GG.cyl, F0.x, y + 0.3, F0.z, 1.5, 0.6, 1.5, STONE, { ink: 0.025 }).add(GG.cyl, F0.x, y + 0.58, F0.z, 1.2, 0.06, 1.2, SAND_D, { ink: 0 }).add(GG.cyl, F0.x, y + 0.9, F0.z, 0.3, 1.2, 0.3, STONE_D, { ink: 0.015 }).add(GG.cyl, F0.x, y + 1.5, F0.z, 0.6, 0.14, 0.6, STONE, { ink: 0.015 });
        colliders.push({ x: F0.x, z: F0.z, r: 1.6 }); }
      // the Wall of Days: tall, along the old town's west side, its six panels facing east
      { const len = WALL.z1 - WALL.z0 + 1.6, zc = (WALL.z0 + WALL.z1) / 2, y = Hh(WALL.x + 1, zc);
        k.box(WALL.x - 0.2, y + 2.0, zc, 0.8, 4.4, len, '#d9a46a', { ink: 0.03 }).box(WALL.x - 0.2, y + 4.3, zc, 1.0, 0.3, len + 0.3, '#c98e5a', { ink: 0.02 });
        for (const P of PANELS) k.box(WALL.x + 0.22, y + 1.9, P.z, 0.08, 2.5, 1.95, '#b8844e', { ink: 0.01 });
        colliders.push({ obox: 1, x: WALL.x - 0.2, z: zc, hw: 0.5, hd: len / 2, rot: 0 });
        objects.panels = PANELS.map(P => {
          const cv = document.createElement('canvas'); cv.width = 256; cv.height = 320; drawPanel(cv.getContext('2d'), P.i, 256, 320);
          const m = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 2.2), new THREE.MeshToonMaterial({ map: new THREE.CanvasTexture(cv), gradientMap: TK.grad })); m.position.set(WALL.x + 0.27, y + 1.9, P.z); m.rotation.y = Math.PI / 2; group.add(m);
          const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color: '#fff3b0', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })); gl.scale.set(2.6, 3.0, 1); gl.position.set(WALL.x + 0.5, y + 1.9, P.z); group.add(gl);
          return { mesh: m, glow: gl, x: WALL.x + 1.4, z: P.z, y: y + 1.9 };
        }); }
      // the giant stone head, half in the sand
      { const x = 156.6, z = -4.4, y = Hh(x, z) - 0.6;
        k.add(GG.sphere, x, y + 1.4, z, 1.9, 2.1, 1.7, '#d99460', { ry: -0.6, ink: 0.04 }).box(x - 0.95, y + 1.2, z + 1.05, 0.5, 0.9, 0.6, '#c98e5a', { ry: -0.6, ink: 0.02 });
        for (const s of [-1, 1]) k.box(x - 0.7 + s * 0.45, y + 1.85, z + 1.15 + s * 0.6, 0.5, 0.18, 0.2, '#8f3f28', { ry: -0.6, ink: 0.01 });
        k.add(GG.sphere, x + 0.6, y - 0.1, z + 0.4, 2.6, 0.8, 2.2, SAND, { ink: 0.02 });
        colliders.push({ x, z, r: 2.0 }); }
      k.build(group);
    }
    // the temple's top in the sand, and the Door of Days (three suns: your morning lights them)
    {
      const k = Kit(), T0 = TEMPLE, y = Hh(T0.x, T0.z + 3.0);
      k.box(T0.x, y + 0.3, T0.z, T0.w + 1.4, 0.6, T0.d + 1.0, STONE_D, { ink: 0.03 }).box(T0.x, y + 0.75, T0.z - 0.2, T0.w + 0.6, 0.4, T0.d + 0.4, STONE, { ink: 0.025 });
      for (let i = 0; i < 6; i++) { const x = T0.x - T0.w / 2 + 1.1 + i * (T0.w - 2.2) / 5; if (Math.abs(x - DOOR.x) < 2) continue; k.add(GG.cyl, x, y + 2.7, T0.z + T0.d / 2 - 0.4, 0.42, 3.8, 0.42, STONE, { ink: 0.025 }); }
      k.box(T0.x, y + 4.8, T0.z, T0.w + 0.6, 0.6, T0.d + 0.4, '#d9a46a', { ink: 0.03 }).add(GG.prism, T0.x, y + 5.1, T0.z, T0.w + 0.4, 2.2, T0.d + 0.2, '#e3a76c', { ry: Math.PI / 2, ink: 0.03 });
      k.box(T0.x, y + 2.6, T0.z - 0.4, T0.w - 0.4, 4.0, T0.d - 1.2, '#c98e5a', { ink: 0.02 });
      // the doorway's frame
      for (const s of [-1, 1]) k.box(DOOR.x + s * 1.6, y + 2.0, DOOR.z + 0.1, 0.5, 4.0, 0.7, '#d9a46a', { ink: 0.02 });
      k.box(DOOR.x, y + 4.15, DOOR.z + 0.1, 3.8, 0.5, 0.8, '#d9a46a', { ink: 0.02 });
      // sand piled against it
      const R = rng(9);
      for (let i = 0; i < 10; i++) { const x = T0.x - T0.w / 2 + R() * T0.w, z = T0.z + T0.d / 2 + R() * 1.2; if (Math.abs(x - DOOR.x) < 2.4) continue; k.add(GG.sphere, x, y + 0.2, z, 1.2 + R(), 0.8 + R() * 0.6, 1.0 + R() * 0.6, SAND, { ink: 0.02 }); }
      k.build(group);
      colliders.push({ obox: 1, x: T0.x, z: T0.z - 0.2, hw: T0.w / 2 + 0.6, hd: T0.d / 2 + 0.3, rot: 0 });
      // the door: a stone slab with three suns and the inscription above (it sinks when it opens)
      const dg = sub(DOOR.x, y, DOOR.z + 0.25), dk = Kit();
      dk.box(0, 1.75, 0, 2.7, 3.5, 0.35, '#b8844e', { ink: 0.025 });
      dk.build(dg);
      const suns = [-0.8, 0, 0.8].map((dx, i) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 18), new THREE.MeshToonMaterial({ color: '#a8784a', gradientMap: TK.grad })); m.rotation.x = Math.PI / 2; m.position.set(dx, 2.5 - (i === 1 ? 0.2 : 0), 0.2); dg.add(m); return m; });
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96;
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv), transparent: true })); sign.position.set(DOOR.x, y + 4.15, DOOR.z + 0.52); group.add(sign);
      const drawSign = l => { const c = cv.getContext('2d'); if (typeof SIGNS !== 'undefined') SIGNS.paint(c, 512, 96, { text: (C.LINES['door.read'] || {})[l] || '', edge: '#8a5a3a', face: '#f0d9a8' }); sign.material.map.needsUpdate = true; };
      if (typeof SIGNS !== 'undefined') SIGNS.board(drawSign); else drawSign('es');
      objects.door = { g: dg, suns, y0: y, solid: { obox: 1, x: DOOR.x, z: DOOR.z + 0.3, hw: 1.4, hd: 0.35, rot: 0 }, sign };
      moving.push(objects.door.solid);
      const hole = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 3.5), new THREE.MeshBasicMaterial({ color: '#141017' })); hole.position.set(DOOR.x, y + 1.75, DOOR.z + 0.05); group.add(hole);
      if (typeof SIGNS !== 'undefined') SIGNS.add({ id: 'ruins.door', x: DOOR.x, z: DOOR.z + 2.2, y: y + 4, r: 2.2, card: l => ({ tag: 'The Door of Days', lines: [{ text: (C.LINES['door.read'] || {})[l] || '', en: C.LINES['door.read'].en }] }), when: () => !(C.G && C.G.state.flags.ruinsDoor) });
    }
    // the mounds: the camp's four lost things, Fermín's hat, and Tula's four pieces (each a little flag)
    {
      objects.mounds = {};
      const mound = (id, at, flag) => {
        const y = Hh(at.x, at.z), g = sub(at.x, y, at.z, (at.x * 7) % 3), k = Kit();
        k.add(GG.sphere, 0, 0.02, 0, 0.75, 0.38, 0.7, SAND, { ink: 0.015 }).add(GG.sphere, 0.3, 0.12, 0.2, 0.35, 0.22, 0.3, SAND_D, { ink: 0.008 });
        if (flag) k.add(GG.cyl6, -0.3, 0.55, -0.1, 0.02, 1.0, 0.02, WOOD_D, { ink: 0 }).box(-0.12, 0.92, -0.1, 0.34, 0.2, 0.02, '#e2574c', { ink: 0.004 });
        k.build(g, { hull: false });
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.sparkTex, color: '#fff3b0', transparent: true, opacity: 0, depthWrite: false })); sp.scale.setScalar(0.5); sp.position.set(0, 0.7, 0); g.add(sp);
        objects.mounds[id] = { g, sp, x: at.x, z: at.z, y };
      };
      mound('hat', HAT);
      for (const T0 of THINGS) mound(T0.id, T0.at);
      for (const S0 of SHARDS) mound('shard' + S0.id, S0, true);
    }
    // the canyon rim: hoodoos against the sky (up on the mesas)
    {
      const k = Kit(), R = rng(123), spots = [];
      for (let n = 0; n < 400 && spots.length < 16; n++) {
        const x = 104 + R() * 80, z = -40 + R() * 106, od = C.openDist(x, z);
        if (od < 9 || od > 20 || !C.inBox(x, z, -6) || spots.some(s => Math.hypot(s[0] - x, s[1] - z) < 9)) continue;
        spots.push([x, z]);
      }
      for (const [x, z] of spots) {
        const y = Hh(x, z), n = 3 + Math.floor(R() * 3); let yy = y - 0.5;
        for (let i = 0; i < n; i++) { const r = 1.3 - i * 0.18 + R() * 0.3, h = 1.4 + R() * 1.2; k.add(GG.cyl, x + (R() - 0.5) * 0.3, yy + h / 2, z + (R() - 0.5) * 0.3, r, h, r * (0.85 + R() * 0.3), ['#c8643c', '#d9834f', '#b4532f', '#e3a76c'][i % 4], { ry: R() * 3, ink: 0.04 }); yy += h * 0.92; }
        k.add(GG.sphere, x, yy + 0.4, z, 1.5, 0.6, 1.4, '#a9492c', { ink: 0.04 });
      }
      k.build(group);
    }
    // the edges: the canyon's floor ends where its red walls start (world.js's tree wall doesn't reach in here): solids along the
    // foot of the rock, every metre or so
    {
      let n = 0;
      for (let x = 112; x <= 172; x += 1.1) for (let z = -32; z <= 74; z += 1.1) {
        const od = C.openDist(x, z), wd = C.waterDist(x, z);
        if (od < 1.0 || od > 2.1 || wd < 1.2) continue;
        if (Hh(x, z) < FLOOR + 0.5) continue;
        colliders.push({ x, z, r: 0.8 }); n++;
      }
      objects.edgeCount = n;
    }

    // ---------------------------------------------------------------- the people (gardens.js's makers)
    const mk = (id, at, look, o = {}) => {
      const def = { id, name: C.nameOf ? C.nameOf(id) : id, x: at.x, z: at.z, yaw: at.yaw || 0, look, pose: o.pose || 'idle', hushPose: 'hushed' };
      const p = GARDENS.makePerson(def, group, { hushed: !!o.hushed, gray: !!o.hushed, pose: o.hushed ? 'hushed' : o.pose || 'idle' });
      p.y = o.y !== undefined ? o.y : Hh(at.x, at.z); people.push(p);
      return p;
    };
    mk('quino', SPOT.captain, LOOKS.quino, { y: PIER.y });
    const fe = mk('fermin', SPOT.ferminDig, LOOKS.fermin0, { pose: 'hold' });
    fe.shovel = (() => { const g = new THREE.Group(), k = Kit(); k.add(GG.cyl6, 0, 0.1, 0.38, 0.03, 1.3, 0.03, WOOD, { rx: 0.5, ink: 0.006 }).box(0, -0.45, 0.72, 0.24, 0.32, 0.04, '#a9b4c2', { rx: 0.5, ink: 0.006 }); k.build(g); g.position.set(0, 0.9, 0); fe.root.add(g); return g; })();
    mk('elvira', SPOT.elvira, LOOKS.elvira, { pose: 'think' });
    const da = mk('dario', SPOT.dario, LOOKS.dario, { hushed: true });
    da.lying = true; da.root.rotation.order = 'YXZ';
    mk('nadia', SPOT.nadia, LOOKS.nadia, { hushed: true });
    const sa = mk('salome', SPOT.salome, LOOKS.salome, { hushed: true });
    sa.glasses = (() => { const g = new THREE.Group(), k = Kit(); for (const s of [-1, 1]) k.add(GG.cyl, s * 0.09, 0, 0, 0.075, 0.015, 0.075, '#2b2235', { rx: Math.PI / 2, ink: 0 }); k.box(0, 0.01, 0, 0.06, 0.015, 0.015, '#2b2235', { ink: 0 }); k.build(g, { hull: false }); g.position.set(0, 0.25, 0.235); g.visible = false; sa.head.add(g); return g; })();
    const ga = mk('gaspar', SPOT.gaspar, LOOKS.gaspar, { hushed: true });
    ga.mess = (() => { const g = new THREE.Group(), k = Kit(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; k.add(GG.cone, Math.cos(a) * 0.18, 0.44, Math.sin(a) * 0.18 - 0.02, 0.06, 0.26, 0.06, '#2e2420', { rx: Math.sin(a) * 0.9, rz: -Math.cos(a) * 0.9, ink: 0.006 }); } k.build(g, { hull: false }); ga.head.add(g); return g; })();
    mk('tula', SPOT.tula, LOOKS.tula, { pose: 'sniff' });
    objects.LOOKS = LOOKS;

    // ---------------------------------------------------------------- per frame
    const S = { t: 0 };
    function update(dt, t, you) {
      S.t = t;
      const near = you && Math.hypot(you.x - 142, you.z - 16) < 90;
      if (near) for (const p of people) {
        if (p.hidden) { p.root.visible = false; continue; }
        p.root.visible = true;
        GARDENS.animatePerson(p, dt, t, p.lying ? null : you);
        if (p.shovel) { p.shovelK = Math.max(0, (p.shovelK || 0) - dt * 2.2); p.shovel.rotation.x = -1.0 * Math.sin((1 - p.shovelK) * Math.PI) * (p.shovelK > 0 ? 1 : 0); }
        if (p.lying) { p.root.rotation.x = -Math.PI / 2; p.root.position.set(HAMMOCK.x - HAMMOCK.len / 2 + 0.25, Hh(HAMMOCK.x, HAMMOCK.z) + HAMMOCK.y + 0.12, HAMMOCK.z); p.root.rotation.y = -Math.PI / 2; p.body.rotation.z = Math.sin(t * 0.8) * 0.03; }
        else p.root.rotation.x = 0;
      }
      // the mounds twinkle when they can be dug; the unread panels glow a little
      if (you && objects.mounds) for (const m of Object.values(objects.mounds)) if (m.g.visible) { const d = Math.hypot(you.x - m.x, you.z - m.z); m.sp.material.opacity = m.can ? clamp(1.2 - d / 10, 0, 0.9) * (0.6 + 0.4 * Math.sin(t * 5 + m.x)) : 0; }
      if (objects.panels) for (const P of objects.panels) P.glow.material.opacity = P.lit ? 0.18 + 0.1 * Math.sin(t * 2.5 + P.z) : 0;
      if (objects.door) for (const s of objects.door.suns) if (s.userData.lit) s.material.emissive.setRGB(0.5 + 0.2 * Math.sin(t * 3), 0.35, 0.05);
    }
    // a warm haze in the canyon (after world3d.js sets the fog for the frame)
    const HAZE = new THREE.Color('#f1d7ac');
    function fog(Y, fogObj) { if (!fogObj) return; const k = C.inBox(Y.x, Y.z) ? 1 - smoothstep(6, 26, C.openDist(Y.x, Y.z)) : 0; S.fogK = k; if (k > 0.01) fogObj.color.lerp(HAZE, 0.5 * k); }
    const stats = () => { let tris = 0, calls = 0; group.traverse(o => { if ((o.isMesh || o.isSprite) && o.visible) { calls++; const g = o.geometry; if (g && g.attributes && g.attributes.position) tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return { tris: Math.round(tris), meshes: calls, colliders: colliders.length, people: people.length, edges: objects.edgeCount }; };
    const out = { colliders, platforms, moving, group, people, update, fog, stats, objects, HAMMOCK, FOUNTAIN };
    C.built = out;
    return out;
  }
  Object.assign(C, { build, LOOKS, HAMMOCK, FOUNTAIN, RUIN_WALLS, COLUMNS, drawPanel });
})();

// ================================================================ the game side
(() => {
  const C = RUINS, SPOT = C.SPOT, V = (x, y, z) => new THREE.Vector3(x, y, z);
  let G = null, B = null, synced = '', busyArrive = false;
  const S = () => { const s = G.state; const r = s.ruins || (s.ruins = {}); r.found = r.found || []; r.given = r.given || {}; r.panels = r.panels || {}; r.shards = r.shards || []; r.suns = r.suns || []; return r; };
  const F = () => G.state.flags;
  const mimo = () => G.state.mimoName || 'Mimo';
  const lang = () => G.state.lang || 'es';
  const cjk = l => l === 'zh' || l === 'ja';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const ex = w => (UI.lang === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  const verbs = () => ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing', 'v.climb', 'v.blow', 'v.call', 'v.dig'].filter(id => LEX.item(id));
  const person = id => (B ? B.people.find(p => p.id === id) || null : null);
  const lock = on => { G.sim.lock = on ? 1 : 0; };
  const plainOf = src => (cjk(lang()) && typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(src, { lang: lang() }) : src);
  const near = (a, b, r) => !!a && !!b && Math.hypot(a.x - b.x, a.z - b.z) < r;
  const inRegion = Y => C.inBox(Y.x, Y.z) && C.openDist(Y.x, Y.z) < 8;
  const solved = () => { try { if (typeof BFX !== 'undefined' && BFX.solved) BFX.solved(); else Sound.play('chest'); } catch (e) { /* (no sound) */ } };
  const unsolid = o => { if (o) { o.x = o.z = 1e5; } };
  const THING_EN = { alarm: 'alarm clock', towel: 'towel', glasses: 'glasses', comb: 'comb' };
  const UP_KEY = { dario: 'd.up', nadia: 'n.up', salome: 's.up', gaspar: 'g.up' };
  const H_KEY = { dario: 'd.h', nadia: 'n.h', salome: 's.h', gaspar: 'g.h' };
  const CHAT_KEY = { dario: 'd.chat', nadia: 'n.chat', salome: 's.chat', gaspar: 'g.chat' };
  // the possessive as a word you're shown (after Elvira's demonstration)
  const POSS = { es: ['tu', 'your'], pt: ['o seu', 'your'], de: ['dein', 'your'], zh: ['[你|nǐ] [的|de]', 'your'], ja: ['さん の', '’s (whose)'] };

  // someone says a line (a T table): mixed by the weave; o.hush: what the Hush left of it; o.demo: a demonstration (the shown
  // words highlighted and glossed, EN on request)
  function sayT(p, T, o = {}) {
    if (!p || !T) return Promise.resolve();
    const l = lang();
    let text = T[l] || '';
    if (!cjk(l)) text = text.replace(/\{mimo\}/g, mimo());
    if (p.id && C.NAMES[p.id]) p.name = C.nameOf(p.id);
    if (o.hush && STORY.sayHushed) return STORY.sayHushed(p, text, T.en || '', { key: 'ruins.' + (o.key || p.id) });
    if (o.demo && STORY.demoLine) return STORY.demoLine(p, T, o.marks || C.MARKS[o.demo] || null);
    p.lines = { en: T.en || '', [l]: text };
    return STORY.sayInline(p, false);
  }
  const L = k => C.LINES[k];
  const sayKey = (p, k, o) => sayT(p, L(k), o);
  const demoKey = (p, k, marks) => sayT(p, L(k), { demo: k, marks });
  function learnUse(verb, ms) {
    const first = !LEX.taught(verb);
    LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
    if (first) { G.sim.emit('learned', { id: verb }); UI.toast(`${mimo()} learned «${LEX.form(verb)}»!`); }
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
  }
  function restore(p, instant, pose) {
    if (!p) return;
    p.hushed = false; p.set(pose || 'idle', false);
    if (!instant) { G.w3d.fx.sparkle(p.x, p.y + 1.3, p.z, 22, ['#ffd166', '#fff3a0', '#f2a65a']); Sound.play('learned'); }
  }
  function shotOf(p, o = {}) {
    const Y = G.sim.you, dx = p.x - Y.x, dz = p.z - Y.z, dl = Math.hypot(dx, dz) || 1, sx = -dz / dl, sz = dx / dl, side = o.side || 1;
    return { pos: V(p.x - dx / dl * (o.back || 4.2) + sx * side * (o.out || 3.2), (p.y || 0.8) + (o.up || 2.4), p.z - dz / dl * (o.back || 4.2) + sz * side * (o.out || 3.2)), look: V((p.x + Y.x) / 2, (p.y || 0.8) + 1.2, (p.z + Y.z) / 2), dur: o.dur || 0.8 };
  }
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; M.x = x + Math.cos(yaw) * 1.1; M.z = z - Math.sin(yaw) * 1.1; M.hidden = false; M.wander = null; M.station = null; M.look = null; G.sim.snap();
  }
  // Mimo digs: off to the spot, then paws at the sand in a cloud of it
  async function mimoDig(at, look, sec = 1.6) {
    const M = G.sim.mimo;
    G.sim.mimoGo(at, look);
    for (let t = 0; t < 3 && Math.hypot(M.x - at.x, M.z - at.z) > 1.0; t += 0.1) await wait(0.1);
    M.glow = 1;
    for (let t = 0; t < sec; t += 0.18) {
      if ((t / 0.18) % 3 < 1) M.hop = { t: 0 };
      Sound.play('land', 3 + Math.random() * 4);
      G.w3d.fx.puff(M.x + (Math.random() - 0.5) * 0.8, M.ry + 0.25, M.z + (Math.random() - 0.5) * 0.8, 3, 0.22 + Math.random() * 0.1, '#e2c088', 0.6);
      await wait(0.18);
    }
    Sound.play('poof');
  }
  // the other verbs, at sand: each does its own little thing
  async function wrongVerb(verb, at) {
    const M = G.sim.mimo;
    G.sim.mimoGo({ x: at.x + 1.4, z: at.z + 1.4 }, at); await wait(0.6);
    if (LEX.taught(verb)) LEX.attempt(verb, { ok: true, hints: 0, ms: 3000, mode: 'command' });
    G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
    const say = s => STORY.think(s, 4);
    if (verb === 'v.push') { Sound.play('land', 6); say('{mimo} pushes the sand. It just slides back.'); }
    else if (verb === 'v.jump') { M.hop = { t: 0 }; Sound.play('jump'); say('{mimo} jumps on it… and sinks in up to its knees.'); }
    else if (verb === 'v.hit') { Sound.play('hit'); say('{mimo} bonks the sand. Pff. Sand everywhere, and just as much left.'); }
    else if (verb === 'v.blow') { Sound.play('blow'); say('{mimo} blows. A little sand flies up… and right back into its face.'); }
    else if (verb === 'v.climb') say('{mimo} tries to climb it. The sand slides out from under its paws.');
    else if (verb === 'v.eat') say('{mimo} takes a bite… and spits it out. Sand is not food!');
    else if (verb === 'v.swim') say('{mimo} looks for water. Not here: only sand.');
    else if (verb === 'v.sing') { Sound.play('sing'); say('{mimo} sings to the sand. The sand doesn’t care.'); }
    else if (verb === 'v.call') { Sound.play('chirp'); say('{mimo} calls. Nobody comes to move the sand.'); }
    else if (verb === 'v.throw') { Sound.play('whiff'); say('{mimo} throws a handful of sand. Then another. That would take a year.'); }
    else say('{mimo} tries… but the sand stays where it is.');
    G.sim.mimoGo(null, null);
  }
  // tell Mimo what to do with some sand (the first time a box; once «cava» worked, E does it)
  async function askDig(title, at, hint) {
    const st = S();
    if (st.quickDig && LEX.taught('v.dig')) { learnUse('v.dig', 2500); return true; }
    const r = await UI.command({ name: mimo(), icon: 'dig', title, verbs: verbs(), answer: 'v.dig' });
    if (!r || r.cancelled) return false;
    if (!r.verb) { G.sim.mimoSay('…?', 1.4); G.sim.mimo.tiltT = 1.4; STORY.think(hint || '{mimo} tilts its head. What did Fermín do with his shovel?', 5); return false; }
    if (r.verb !== 'v.dig') { await wrongVerb(r.verb, at); return false; }
    learnUse('v.dig', r.ms); st.quickDig = true;
    return true;
  }

  // ---------------------------------------------------------------- the way in and out: «El Viento Sur»
  async function arrive() {
    if (busyArrive) return; busyArrive = true;
    const f = F(), first = !f.ruins;
    try {
      lock(true);
      await UI.fade(1, 650);
      f.ruins = true;
      const sh = B && B.objects.ship;
      teleport(C.LANDING.x, C.LANDING.z, C.LANDING.yaw);              // (on the pier, behind the camera: the ship sails in out of the sea cave)
      const q = person('quino'); if (q) q.hidden = true;
      if (sh) sh.position.z = 71;
      G.cam.override = { pos: V(141.6, 4.8, 50.4), look: V(137.4, 1.4, 63.5), dur: 0.01 };
      if (first) UI.chapter('The Sunken Ruins', 'The south-east coast · the seventh bell');
      await wait(0.3);
      await UI.fade(0, 900);
      Sound.play('swoosh');
      if (sh) await tween(4.2, k => { const e = 1 - Math.pow(1 - k, 2.2); sh.position.z = lerp(71, C.SHIP.z, e); sh.rotation.z = Math.sin(k * 9) * 0.025; sh.position.y = Math.sin(k * 7) * 0.06; });
      if (sh) { sh.position.set(C.SHIP.x, 0, C.SHIP.z); sh.rotation.z = 0; }
      Sound.play('land', 4);
      await wait(0.5);
      await UI.fade(1, 300);
      if (q) q.hidden = false;
      G.cam.override = null; G.cam.snap(C.LANDING.yaw, 0.3, 8.5);
      await UI.fade(0, 400);
      if (first && q) {
        lock(true);
        G.cam.override = shotOf(q, { back: 3.6, out: 2.4 });
        await sayKey(q, 'q.land');
        G.cam.override = null;
        await STORY.you('A canyon of red rock… and somewhere in here, the seventh {w.bell}. Let’s go, {mimo}!');
      }
    } finally { lock(false); G.cam.override = null; busyArrive = false; }
    G.save();
  }
  async function leave() {
    const q = person('quino');
    if (q) await sayKey(q, 'q.back');
    lock(true);
    try {
      await UI.fade(1, 650);
      const D = typeof PORT !== 'undefined' && PORT.DOCK ? PORT.DOCK : { x: -254.4, z: -71, yaw: Math.PI / 2 };
      teleport(D.x, D.z, D.yaw);
      G.cam.override = null; G.cam.snap(D.yaw, 0.3, 8.5);
      await wait(0.2);
      await UI.fade(0, 650);
    } finally { lock(false); }
    G.save();
  }

  // ---------------------------------------------------------------- Fermín and the sand slide: «¡Cava!»
  async function ferminScene() {
    const f = F(), fe = person('fermin'); if (!fe) return;
    lock(true);
    const shot = { pos: V(fe.x - 3.6, fe.y + 2.4, fe.z + 4.2), look: V(fe.x + 0.3, fe.y + 1.1, fe.z - 1.6), dur: 0.9 };
    G.cam.override = shot;
    await sayKey(fe, 'f.hello');
    // he digs while he says it (the demonstration): the shovel swings, sand flies
    let digging = true;
    (async () => { while (digging) { fe.shovelK = 1; Sound.play('land', 5); G.w3d.fx.puff(fe.x + Math.sin(fe.yaw) * 1.1, fe.y + 0.4, fe.z + Math.cos(fe.yaw) * 1.1, 3, 0.25, '#e2c088', 0.6); await wait(0.55); } })();
    await demoKey(fe, 'f.demo');
    digging = false;
    await STORY.youWord('«', STORY.wordPart('v.dig'), '»… Fermín says it every time he digs!');
    G.cam.override = null; lock(false);
    f.ruinsDig = true; G.save();
    if (!LEX.taught('v.dig')) {
      const r = await STORY.teachWord('v.dig', { spot: SPOT.slideWatch, look: { x: fe.x, z: fe.z }, title: `${mimo()} is watching Fermín and his shovel. What is he doing?` });
      if (r && r.ok) await sayKey(fe, 'f.ask');
    } else await sayKey(fe, 'f.ask');
  }
  async function ferminTalk() {
    const f = F(), fe = person('fermin'); if (!fe) return;
    if (!f.ruinsDig) return ferminScene();
    if (!LEX.taught('v.dig')) { const r = await STORY.teachWord('v.dig', { spot: SPOT.slideWatch, look: { x: fe.x, z: fe.z }, title: `${mimo()} is watching Fermín and his shovel. What is he doing?` }); if (r && r.ok) await sayKey(fe, 'f.ask'); return; }
    if (!f.ruinsSlide) return sayKey(fe, 'f.ask');
    return sayKey(fe, 'f.chat');
  }
  async function slideScene() {
    const f = F(), SL = C.SLIDE;
    const ok = await askDig(`A slide of sand fills the gully up to the camp, too steep to climb. What should ${mimo()} do?`, SL, LEX.taught('v.dig') ? '{mimo} tilts its head. What did Fermín do with his shovel?' : '{mimo} looks at the sand… then at Fermín and his shovel.');
    if (!ok) return;
    lock(true);
    G.cam.override = { pos: V(SL.x - 6.2, 4.6, SL.z + 7.4), look: V(SL.x, 1.4, SL.z), dur: 0.8 };
    await mimoDig({ x: SL.x - 1.0, z: SL.z + 3.0 }, SL, 2.0);
    const g = B.objects.slide; Sound.play('poof');
    await tween(1.4, k => { g.scale.set(1 + k * 0.25, Math.max(0.02, 1 - k), 1 + k * 0.25); if (Math.random() < 0.3) G.w3d.fx.puff(SL.x + (Math.random() - 0.5) * 5, 0.9, SL.z + (Math.random() - 0.5) * 4, 3, 0.4, '#e2c088', 0.8); });
    g.visible = false; unsolid(B.objects.slideSolid); solved();
    f.ruinsSlide = true; G.save();
    await wait(0.3);
    const fe = person('fermin');
    if (fe) { fe.look = G.sim.mimo; await sayKey(fe, 'f.done'); fe.look = null; }
    G.cam.override = null; lock(false); G.sim.mimoGo(null, null);
    placeFermin();
    await STORY.you('The way up to the camp is open! Let’s find Elvira, {mimo}.');
  }
  function placeFermin() {
    const fe = person('fermin'); if (!fe) return;
    const at = F().ruinsSlide ? SPOT.ferminCamp : SPOT.ferminDig;
    fe.x = at.x; fe.z = at.z; fe.y = WORLD.terrainAt(at.x, at.z); fe.baseYaw = fe.yaw = at.yaw;
  }

  // ---------------------------------------------------------------- Elvira, and Fermín's hat (the possessive, heard)
  async function elviraScene() {
    const e = person('elvira'); if (!e) return;
    lock(true);
    G.cam.override = shotOf(e, { back: 4.2, out: 3.0 });
    await sayKey(e, 'e.hello');
    const H0 = C.HAT;
    G.cam.override = { pos: V(H0.x + 2.6, 3.4, H0.z + 5.0), look: V(H0.x, 0.8, H0.z), dur: 0.9 };
    e.look = H0;
    await sayKey(e, 'e.hatAsk');
    e.look = null; G.cam.override = null; lock(false);
    S().hatAsked = true; G.save(); sync(true);
  }
  async function hatScene() {
    const st = S(), H0 = C.HAT;
    const ok = await askDig(`Fermín’s hat is somewhere under this little mound of sand. What should ${mimo()} do?`, H0);
    if (!ok) return;
    lock(true);
    G.cam.override = { pos: V(H0.x + 3.0, 3.0, H0.z + 4.6), look: V(H0.x, 0.6, H0.z), dur: 0.8 };
    await mimoDig({ x: H0.x + 0.9, z: H0.z + 0.9 }, H0, 1.4);
    const m = B.objects.mounds.hat; m.g.visible = false; st.hatDug = true;
    // the hat pops out; Fermín comes over, and Elvira hands it to him
    const hat = hatMesh(); hat.position.set(H0.x, 0.9, H0.z); G.w3d.scene.add(hat);
    Sound.play('chest'); await tween(0.5, k => { hat.position.y = 0.9 + Math.sin(k * Math.PI) * 1.2; hat.rotation.y = k * 6; });
    const e = person('elvira'), fe = person('fermin');
    if (fe) { fe.x = H0.x + 1.6; fe.z = H0.z - 1.4; fe.y = WORLD.terrainAt(fe.x, fe.z); fe.look = e; G.w3d.fx.puff(fe.x, fe.y + 0.3, fe.z, 6, 0.3, '#e2c088'); }
    if (e) { e.x = H0.x - 0.6; e.z = H0.z - 1.2; e.y = WORLD.terrainAt(e.x, e.z); e.look = fe; e.set('hold', false); hat.position.set(e.x + 0.3, e.y + 1.15, e.z + 0.25); }
    G.cam.override = { pos: V(H0.x + 0.9, 2.4, H0.z + 3.6), look: V(H0.x + 0.5, 1.4, H0.z - 1.3), dur: 0.7 };
    await wait(0.4);
    await demoKey(e, 'e.demo');
    G.w3d.scene.remove(hat);
    if (fe) { fe.def.look = C.LOOKS.fermin; fe.set('happy', false); G.w3d.fx.sparkle(fe.x, fe.y + 2, fe.z, 12, ['#ffd166', '#fff3a0']); }
    if (e) e.set('think', false);
    await demoKey(fe, 'f.hat');
    const l = lang(), PW = POSS[l] || POSS.es;
    await STORY.youWord('«', STORY.wordPart(null, PW[0], PW[1]), l === 'ja' ? '»… that’s how you say whose it is: «フェルミン さん の …»!' : '»… that’s how you say whose it is!');
    if (e) { G.cam.override = shotOf(e, { back: 3.8, out: 2.6 }); await sayKey(e, 'e.quest'); }
    if (fe) { fe.set('idle', false); fe.look = null; }
    if (e) e.look = null;
    placeHome();
    G.cam.override = null; lock(false);
    F().ruinsChief = true; G.save(); sync(true);
    await STORY.you('Four lost things, four owners. Dig them up, {mimo}, and I’ll say whose each one is!');
  }
  function hatMesh() {
    const g = new THREE.Group(), k = GARDENS.Kit(), GG = GARDENS.GEO;
    k.add(GG.cyl, 0, 0, 0, 0.42, 0.03, 0.42, '#d9b46a', { ink: 0.012 }).add(GG.cyl, 0, 0.08, 0, 0.2, 0.16, 0.2, '#d9b46a', { ink: 0.012 }).add(GG.cyl, 0, 0.03, 0, 0.205, 0.05, 0.205, '#8a5a3a', { ink: 0 });
    k.build(g); return g;
  }
  function placeHome() {
    const e = person('elvira'); if (e) { e.x = SPOT.elvira.x; e.z = SPOT.elvira.z; e.y = WORLD.terrainAt(e.x, e.z); e.baseYaw = SPOT.elvira.yaw; }
    placeFermin();
  }
  async function elviraTalk() {
    const f = F(), st = S(), e = person('elvira'); if (!e) return;
    if (QUESTS.reportDue && QUESTS.reportDue('elvira')) return reportScene();
    if (!f.ruinsChief) { if (!st.hatAsked) return elviraScene(); return sayKey(e, 'e.hatAsk'); }
    if (f.ruinsReport) return sayKey(e, 'e.chat');
    if (f.ruinsFree) return reportScene();
    if (!f.ruinsThings) return sayKey(e, st.found.length || Object.keys(st.given).length ? 'e.more' : 'e.quest');
    if (!f.ruinsWall) return sayKey(e, 'e.things');
    return sayKey(e, 'e.door');
  }

  // ---------------------------------------------------------------- the lost things: dig them up, give them back
  const bag = () => { const st = S(); return st.found.filter(id => { const t = C.THINGS.find(x => x.id === id); return t && !st.given[t.owner]; }); };
  async function digThing(T0) {
    const st = S(), at = T0.at;
    const ok = await askDig(`Something is buried under this little mound of sand. What should ${mimo()} do?`, at);
    if (!ok) return;
    lock(true);
    await mimoDig({ x: at.x + 0.9, z: at.z + 0.9 }, at, 1.2);
    B.objects.mounds[T0.id].g.visible = false;
    if (!st.found.includes(T0.id)) st.found.push(T0.id);
    Sound.play('chest'); G.w3d.fx.sparkle(at.x, 1.4, at.z, 14, ['#ffd166', '#fff3a0']);
    lock(false); G.sim.mimoGo(null, null); G.save(); sync(true);
    STORY.introduce(T0.word);
    UI.toast(`${mimo()} dug up: ${THING_EN[T0.id]}!`);
    await STORY.youWord(T0.id === 'glasses' ? 'Some ' : 'A ', STORY.wordPart(T0.word), '! Whose is it? Let’s give it back.');
  }
  async function giveScene(p) {
    const st = S(), l = lang(), T0 = C.THINGS.find(t => t.owner === p.id); if (!T0) return;
    const have = bag(); if (!have.length) return sayKey(p, H_KEY[p.id], { hush: true });
    const nm = C.nameOf(p.id), list = have.map(id => THING_EN[id]).join(', ');
    const frame = cjk(l) && typeof CJK !== 'undefined' ? CJK.plain(C.YOURS_FRAME[l], { lang: l }) : C.YOURS_FRAME[l] || C.YOURS_FRAME.es;
    const r = await UI.command({ name: mimo(), icon: have.length === 1 ? have[0] : 'dig', title: `${nm} lost something in the storm. You’re carrying: ${list}. Give it back, and say whose it is!`, verbs: [],
      placeholder: 'say whose it is…', hint: `Like Elvira to Fermín: ${frame} (? shows an example)`, model: plainOf(C.yoursModel(T0.id, l, p.id)), modelEn: `It’s your ${THING_EN[T0.id]}!` });
    if (!r || r.cancelled) return;
    const g = C.gradeYours(r.text, l, T0.id, p.id);
    if (g.wrongThing && g.thing) {
      if (!have.includes(g.thing)) { Sound.play('wrong'); STORY.think(`You haven’t got the ${THING_EN[g.thing]}. ${have.length ? 'You’re carrying: ' + list + '.' : ''}`, 5); return; }
      Sound.play('wrong'); lock(true); G.cam.override = shotOf(p, { back: 3.4, out: 2.2 });
      p.hushed = false; p.set('idle', true);
      await sayKey(p, 'x.notmine');
      p.hushed = true; p.set('hushed', true); G.cam.override = null; lock(false);
      STORY.think(`The ${THING_EN[g.thing]} isn’t ${nm}’s. Whose could it be?`, 4.5);
      return;
    }
    if (g.wrongWho) { Sound.play('wrong'); STORY.think(g.wrongWho === 'me' ? `That says it’s yours! Tell ${nm} it’s theirs: ${frame}` : `That says it’s someone else’s! Tell ${nm} it’s theirs: ${frame}`, 5.5); return; }
    if (!g.ok) { Sound.play('wrong'); G.sim.mimoSay('…?', 1.4); STORY.think(`${nm} doesn’t understand. Say what it is, and whose: ${frame} (? shows an example)`, 5.5); return; }
    if (!have.includes(T0.id)) { STORY.think(`That’s right, but you haven’t found ${nm}’s ${THING_EN[T0.id]} yet. Look for mounds of sand!`, 5); return; }
    UI.toast(`${g.letter} · ${g.reason}`);
    Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    st.given[p.id] = g.letter; G.save();
    await wakeUp(p, T0);
    if (C.THINGS.every(t => st.given[t.owner]) && !F().ruinsThings) await allBack();
  }
  async function wakeUp(p, T0) {
    lock(true);
    const H0 = B.HAMMOCK;
    G.cam.override = shotOf(p, { back: 3.6, out: 2.6 });
    G.w3d.fx.sparkle(p.x, p.y + 1.2, p.z, 10, ['#ffd166']);
    await wait(0.4);
    if (p.id === 'dario') {        // the alarm rings: he tumbles out of the hammock
      for (let k = 0; k < 6; k++) { Sound.play('tick'); await wait(0.12); }
      Sound.play('chime');
      p.lying = false; p.x = H0.x; p.z = H0.z + 1.2; p.y = WORLD.terrainAt(p.x, p.z); p.baseYaw = p.yaw = 0;
      G.w3d.fx.puff(p.x, p.y + 0.3, p.z, 10, 0.35, '#e2c088');
      Sound.play('land', 6);
    }
    restore(p, false, p.id === 'dario' ? 'happy' : 'idle');
    if (p.id === 'salome' && p.glasses) p.glasses.visible = true;
    if (p.id === 'gaspar' && p.mess) p.mess.visible = false;
    await wait(0.3);
    await demoKey(p, UP_KEY[p.id]);
    p.set('idle', false);
    G.cam.override = null; lock(false); G.save(); sync(true);
  }
  async function allBack() {
    const f = F(), e = person('elvira'), sa = person('salome');
    f.ruinsThings = true; G.save();
    lock(true);
    if (e) { G.cam.override = shotOf(e, { back: 4.0, out: 3.0 }); await sayKey(e, 'e.things'); }
    G.cam.override = null; lock(false);
    if (sa) { sa.x = SPOT.salomeWall.x; sa.z = SPOT.salomeWall.z; sa.y = WORLD.terrainAt(sa.x, sa.z); sa.baseYaw = SPOT.salomeWall.yaw; G.w3d.fx.puff(sa.x, sa.y + 0.3, sa.z, 6, 0.3, '#e2c088'); }
    sync(true);
    await STORY.you('Salomé went ahead to the old town. The Wall of Days, {mimo}!');
  }
  async function folkTalk(p) {
    const st = S();
    if (p.hushed) { if (bag().length) return giveScene(p); return sayKey(p, H_KEY[p.id], { hush: true }); }
    if (p.id === 'salome' && F().ruinsThings && !F().ruinsWall) return salomeWall();
    return sayKey(p, CHAT_KEY[p.id]);
  }

  // ---------------------------------------------------------------- the Wall of Days: Salomé reads the first panel, you read the rest
  async function salomeWall() {
    const st = S(), sa = person('salome'), l = lang(); if (!sa) return;
    if (st.panels[0]) { const left = C.PANELS.filter(P => !st.panels[P.i]).length; if (!left) return sayKey(sa, 's.wallDone'); return sayKey(sa, 's.wallGo'); }
    lock(true);
    const P0 = B.objects.panels[0];
    G.cam.override = { pos: V(P0.x + 3.4, P0.y + 0.9, P0.z + 3.0), look: V(C.WALL.x, P0.y, P0.z - 0.6), dur: 0.9 };
    sa.look = { x: C.WALL.x, z: P0.z };
    await sayT(sa, C.PANELS_T[0], { demo: 'panel0' });
    sa.look = null;
    st.panels[0] = true; G.save();
    await sayKey(sa, 's.wallGo');
    G.cam.override = null; lock(false); sync(true);
  }
  async function readPanel(i) {
    const st = S(), l = lang(), T0 = C.PANELS_T[i];
    if (typeof SIGNS === 'undefined' || !SIGNS.read) return;
    await SIGNS.read({ tag: `The Wall of Days · ${['I', 'II', 'III', 'IV', 'V', 'VI'][i]} of VI`, lines: [{ text: T0[l] || T0.es, en: T0.en }], note: `(The carving: ${C.PANEL_PIC[i]})` });
    if (!st.panels[i]) {
      st.panels[i] = true; G.save(); sync(true);
      const n = C.PANELS.filter(P => st.panels[P.i]).length;
      UI.toast(`The Wall of Days: ${n}/6 read`);
      G.sim.mimo.happy = 1.2;
      if (n >= 6 && !F().ruinsWall) {
        F().ruinsWall = true; G.save(); solved();
        const sa = person('salome');
        if (sa) { lock(true); G.cam.override = shotOf(sa, { back: 3.6, out: 2.4 }); await sayKey(sa, 's.wallDone'); G.cam.override = null; lock(false); }
        await STORY.you('Tell the door my own morning… Then let’s go to the temple, at the north end, {mimo}.');
      }
    }
  }

  // ---------------------------------------------------------------- the Door of Days: tell it your own morning (three things)
  const DOOR_ORDER = ['getup', 'wash', 'dress', 'brush', 'comb', 'shower', 'eat', 'wake'];
  async function doorScene() {
    const f = F(), st = S(), l = lang(), D = B.objects.door;
    if (f.ruinsDoor) return enterTemple();
    if (!f.ruinsWall) { STORY.think('A stone door with three carved suns. Words over it… Salomé would know how to read the old town’s walls first.', 5); return; }
    while (st.suns.length < 3) {
      const nextKey = DOOR_ORDER.find(k => !st.suns.includes(k)) || 'getup';
      const fr = (C.ROUT_FRAME[l] || C.ROUT_FRAME.es)[0], frame = cjk(l) && typeof CJK !== 'undefined' ? CJK.plain(fr, { lang: l }) : fr;
      const r = await UI.command({ name: 'the Door of Days', icon: 'temple', title: `The Door of Days: “Tell me your morning.” Tell it one thing you do in the morning (${st.suns.length}/3 suns lit).`, verbs: [],
        placeholder: 'say what you do in the morning…', hint: `Your own morning, like the Wall: ${frame} (? shows an example)`, model: plainOf(C.routineModel(nextKey, l, 1)), modelEn: C.ROUT_EN[nextKey] });
      if (!r || r.cancelled) return;
      const g = C.gradeRoutine(r.text, l, { person: 1 });
      if (!g.key) { Sound.play('wrong'); STORY.think(`The suns stay dark. Tell it something you do in the morning: ${frame} (? shows an example)`, 5.5); continue; }
      if (g.wrongPerson) { Sound.play('wrong'); STORY.think(g.slips[0] ? g.slips[0].why : 'That’s someone else’s morning. Tell it YOURS.', 5.5); continue; }
      if (st.suns.includes(g.key)) { Sound.play('wrong'); STORY.think('The door already heard that one. Something else you do in the morning!', 4.5); continue; }
      UI.toast(`${g.letter} · ${g.reason}`);
      Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
      st.suns.push(g.key); G.save();
      const sun = D.suns[st.suns.length - 1]; sun.userData.lit = true; sun.material.color.set('#ffd166');
      G.w3d.fx.sparkle(C.DOOR.x + sun.position.x, D.y0 + sun.position.y, C.DOOR.z + 0.6, 12, ['#ffd166', '#fff3a0']); Sound.play('chime');
    }
    await openDoor(true);
  }
  async function openDoor(anim) {
    const f = F(), D = B.objects.door;
    if (anim) {
      lock(true);
      G.cam.override = { pos: V(C.DOOR.x + 3.2, D.y0 + 2.6, C.DOOR.z + 7.4), look: V(C.DOOR.x, D.y0 + 1.8, C.DOOR.z), dur: 0.8 };
      await wait(0.6); Sound.play('gears');
      await tween(2.4, k => { D.g.position.y = D.y0 - k * 3.6; if (Math.random() < 0.3) G.w3d.fx.puff(C.DOOR.x + (Math.random() - 0.5) * 2.6, D.y0 + 0.2, C.DOOR.z + 0.7, 2, 0.3, '#e2c088'); });
      solved();
    }
    D.g.position.y = D.y0 - 3.6; unsolid(D.solid);
    f.ruinsDoor = true; G.save();
    if (anim) { G.cam.override = null; lock(false); await STORY.you('The Door of Days is open! Steps go down into the dark, under the sand… The {w.bell} must be at the bottom.'); }
  }
  function enterTemple() {
    if (typeof RUINS_TEMPLE !== 'undefined' && RUINS_TEMPLE.enter) return RUINS_TEMPLE.enter();
    STORY.think('Steps go down into the dark… (the sunken temple is coming soon!)', 4);
  }

  // ---------------------------------------------------------------- the report (after the temple's bell), and Tula's jar
  async function reportScene() {
    const f = F(), e = person('elvira'); if (!e) return;
    lock(true);
    G.cam.override = shotOf(e, { back: 4.0, out: 3.0 });
    await STORY.you('Elvira! The temple’s {w.bell} is ringing again, down under the sand!');
    await sayKey(e, 'e.report');
    G.cam.override = { pos: V(e.x + 2, e.y + 6.5, e.z + 6), look: V(e.x - 30, e.y + 12, e.z - 80), dur: 1.4 };     // (far to the north: home)
    await wait(0.7);
    await sayKey(e, 'e.next');
    G.cam.override = null; lock(false);
    f.ruinsReport = true; G.save();
    await STORY.you('The Gray Marsh, past Alba’s old cemetery… Seven bells, {mimo}. One more. Quino’s ship first!');
  }
  async function tulaTalk() {
    const st = S(), t = person('tula'); if (!t) return;
    if (st.tulaDone) return sayKey(t, 't.chat');
    if (!st.tula) { st.tula = true; G.save(); sync(true); await sayKey(t, 't.hello'); await STORY.you('Four pieces under little flags… We’ll find them, Tula!'); return; }
    if (st.shards.length >= C.SHARDS.length) {
      lock(true); G.cam.override = shotOf(t, { back: 3.0, out: 2.0 });
      t.set('cheer', false); await sayKey(t, 't.done'); t.set('idle', false);
      st.tulaDone = true; G.state.coins = (G.state.coins || 0) + 12; Sound.play('chest'); UI.toast('Tula’s jar is whole again! · +12 coins');
      G.cam.override = null; lock(false); G.save(); sync(true); return;
    }
    return sayKey(t, 't.more');
  }
  async function digShard(S0) {
    const st = S();
    const ok = await askDig(`A little red flag sticks out of a mound of sand. A piece of Tula’s jar? What should ${mimo()} do?`, S0);
    if (!ok) return;
    lock(true);
    await mimoDig({ x: S0.x + 0.9, z: S0.z + 0.9 }, S0, 1.0);
    B.objects.mounds['shard' + S0.id].g.visible = false;
    if (!st.shards.includes(S0.id)) st.shards.push(S0.id);
    Sound.play('chest'); G.w3d.fx.sparkle(S0.x, 1.2, S0.z, 10, ['#c96f45', '#ffd166']);
    lock(false); G.sim.mimoGo(null, null); G.save(); sync(true);
    UI.toast(`A piece of Tula’s jar: ${st.shards.length}/4`);
    if (st.shards.length >= C.SHARDS.length) STORY.think('All four pieces! Back to Tula at the camp.', 4);
  }

  // ---------------------------------------------------------------- what you can press E on
  function interactables() {
    if (!G || !B) return [];
    const f = F(), st = S(), Y = G.sim.you, list = [];
    if (!C.inBox(Y.x, Y.z) || C.openDist(Y.x, Y.z) > 6) return list;
    const dig = () => (st.quickDig && LEX.taught('v.dig') ? `«${ex(LEX.form('v.dig'))}»` : `Tell ${mimo()}`);
    const q = person('quino'); if (q) list.push({ x: q.x, z: q.z, y: q.y, r: 2.4, label: 'Sail back', run: leave });
    const fe = person('fermin'); if (fe) list.push({ x: fe.x, z: fe.z, y: fe.y, r: 2.4, label: 'Talk', run: ferminTalk, who: 'fermin', p: fe });
    if (!f.ruinsSlide) { if (f.ruinsDig && LEX.taught('v.dig')) list.push({ x: SPOT.slideFront.x, z: SPOT.slideFront.z, r: 2.8, label: dig(), run: slideScene }); return list; }
    const e = person('elvira');
    const rep = typeof QUESTS !== 'undefined' && QUESTS.reportDue && QUESTS.reportDue('elvira');
    if (e) list.push({ x: e.x, z: e.z, y: e.y, r: 2.6, label: rep ? 'Report' : 'Talk', run: elviraTalk, who: 'elvira', p: e });
    const M = B.objects.mounds;
    if (st.hatAsked && !st.hatDug) list.push({ x: C.HAT.x, z: C.HAT.z, r: 2.0, label: dig(), run: hatScene });
    if (f.ruinsChief) for (const T0 of C.THINGS) if (!st.found.includes(T0.id) && M[T0.id]) list.push({ x: T0.at.x, z: T0.at.z, r: 2.0, label: dig(), run: () => digThing(T0) });
    if (st.tula) for (const S0 of C.SHARDS) if (!st.shards.includes(S0.id)) list.push({ x: S0.x, z: S0.z, r: 2.0, label: dig(), run: () => digShard(S0) });
    for (const id of ['dario', 'nadia', 'salome', 'gaspar']) {
      const p = person(id); if (!p) continue;
      const lab = p.hushed ? (f.ruinsChief && bag().length ? 'Give back' : 'Look') : 'Talk';
      list.push({ x: p.x, z: p.z, y: p.y, r: id === 'dario' && p.lying ? 2.8 : 2.3, label: lab, run: () => folkTalk(p), who: id, p });
    }
    const t = person('tula'); if (t) list.push({ x: t.x, z: t.z, y: t.y, r: 2.2, label: st.tula && !st.tulaDone && st.shards.length >= 4 ? 'Give the pieces' : 'Talk', run: tulaTalk, who: 'tula', p: t });
    if (st.panels[0]) for (const P of B.objects.panels) list.push({ x: P.x, z: P.z, y: P.y, r: 1.5, label: 'Read', run: () => readPanel(B.objects.panels.indexOf(P)) });
    if (f.ruinsWall || f.ruinsDoor) { const D = C.SPOT.doorFront; list.push({ x: D.x, z: D.z, r: 2.6, label: f.ruinsDoor ? 'Go in' : 'Tell the door', run: doorScene }); }
    return list;
  }
  // where the compass points: the next thing to do here
  function nearest(list) { const Y = G.sim.you; let b = null; for (const p of list) if (p && (!b || Math.hypot(p.x - Y.x, p.z - Y.z) < Math.hypot(b.x - Y.x, b.z - Y.z))) b = p; return b; }
  function wayIn() { return (typeof PORT !== 'undefined' && PORT.person && PORT.person('quino')) || (typeof PORT !== 'undefined' && PORT.SPOT && PORT.SPOT.quino) || null; }
  function target() {
    if (!G || !B) return null;
    const f = F(), st = S(), Y = G.sim.you;
    if (!C.inBox(Y.x, Y.z, 4)) return f.ruinsReport ? null : wayIn();
    if (!f.ruinsDig) return person('fermin');
    if (!f.ruinsSlide) return LEX.taught('v.dig') ? SPOT.slideFront : person('fermin');
    if (!f.ruinsChief) return st.hatAsked ? C.HAT : person('elvira');
    if (!f.ruinsThings) {
      const b = bag();
      if (b.length) return nearest(b.map(id => person(C.THINGS.find(t => t.id === id).owner)));
      return nearest(C.THINGS.filter(t => !st.found.includes(t.id)).map(t => t.at));
    }
    if (!f.ruinsWall) { if (!st.panels[0]) return person('salome'); return nearest(B.objects.panels.filter(P => !st.panels[B.objects.panels.indexOf(P)])); }
    if (!f.ruinsFree) return SPOT.doorFront;
    if (!f.ruinsReport) return person('elvira');
    return person('quino');
  }

  // ---------------------------------------------------------------- per frame (outdoors, when no scene runs): the scenes that start by themselves
  function tick(dt, Y) {
    if (!G || !B || !C.inBox(Y.x, Y.z)) return;
    const f = F(), st = S();
    if (!f.ruins) return;
    const fe = person('fermin');
    if (!f.ruinsDig && fe && near(Y, fe, 7.5)) { STORY.run(ferminScene); return; }
    if (f.ruinsSlide && !f.ruinsChief && !st.hatAsked && near(Y, SPOT.campIn, 6.5)) { STORY.run(elviraScene); return; }
  }
  // the world as the save says (after a load, and as things change)
  function sync(force) {
    if (!G || !B) return;
    const f = F(), st = S(), O = B.objects;
    const key = [!!f.ruinsSlide, !!f.ruinsChief, !!st.hatAsked, !!st.hatDug, st.found.join(','), Object.keys(st.given).sort().join(','), !!f.ruinsThings, Object.keys(st.panels).join(','), !!f.ruinsWall, st.suns.join(','), !!f.ruinsDoor, !!f.ruinsFree, !!st.tula, st.shards.join(','), !!st.tulaDone, G.state.lang].join('|');
    if (key === synced && !force) return;
    const first = !synced; synced = key;
    O.slide.visible = !f.ruinsSlide; if (f.ruinsSlide) unsolid(O.slideSolid); else { O.slideSolid.x = C.SLIDE.x; O.slideSolid.z = C.SLIDE.z; }
    placeFermin();
    const fe = person('fermin');
    if (fe && f.ruinsChief && fe.def.look !== C.LOOKS.fermin) { fe.def.look = C.LOOKS.fermin; fe.set('idle', false); }
    if (fe && fe.shovel) fe.shovel.visible = !f.ruinsSlide;
    // the mounds: gone once dug; twinkling once they can be
    const M = O.mounds, dig = LEX.taught('v.dig');
    M.hat.g.visible = !st.hatDug; M.hat.can = dig && st.hatAsked;
    for (const T0 of C.THINGS) { M[T0.id].g.visible = !st.found.includes(T0.id); M[T0.id].can = dig && !!f.ruinsChief; }
    for (const S0 of C.SHARDS) { const m = M['shard' + S0.id]; m.g.visible = !st.shards.includes(S0.id); m.can = dig && !!st.tula; }
    // the four: gray until their thing is back (all of them once the bell rings)
    for (const T0 of C.THINGS) {
      const p = person(T0.owner); if (!p) continue;
      const back = !!st.given[T0.owner] || !!f.ruinsFree;
      if (back && p.hushed) restore(p, true);
      if (!back && !p.hushed) { p.hushed = true; p.set('hushed', true); }
      if (p.id === 'dario') { p.lying = !back; if (back) { const H0 = B.HAMMOCK; p.x = H0.x; p.z = H0.z + 1.2; p.y = WORLD.terrainAt(p.x, p.z); p.baseYaw = 0; } }
      if (p.id === 'salome') { if (p.glasses) p.glasses.visible = back; const at = f.ruinsThings ? SPOT.salomeWall : SPOT.salome; p.x = at.x; p.z = at.z; p.y = WORLD.terrainAt(p.x, p.z); p.baseYaw = at.yaw; }
      if (p.id === 'gaspar' && p.mess) p.mess.visible = !back;
    }
    // the Wall of Days (the unread panels glow once Salomé has started), the Door of Days
    O.panels.forEach((P, i) => { P.lit = !!st.panels[0] && !st.panels[i]; });
    O.door.suns.forEach((s, i) => { const lit = f.ruinsDoor || i < st.suns.length; s.userData.lit = lit; s.material.color.set(lit ? '#ffd166' : '#a8784a'); if (!lit) s.material.emissive.setRGB(0, 0, 0); });
    if (f.ruinsDoor) openDoorNow();
    if (f.ruinsFree) liftPatch(first);
  }
  function openDoorNow() { const D = B.objects.door; D.g.position.y = D.y0 - 3.6; unsolid(D.solid); }
  function liftPatch(instant) {
    const i = WORLD.L.hush.findIndex(h => h.ruins);
    if (i >= 0 && WORLD.L.hush[i].a > 0.001) G.w3d.liftHush(i, instant);
  }

  // ---------------------------------------------------------------- the module's hooks
  function init(game) {
    G = game; B = C.built || null;
    if (C.registerWords) C.registerWords();
    if (B) { const up0 = B.update; B.update = (dt, t, you) => { sync(); up0(dt, t, you); }; }
    if (STORY.extra) STORY.extra.push({ interactables, tick });
    // (story.js's zones: { id, test(x, z), run() }, each fires once; here, the chapter cards as you go up the canyon)
    if (STORY._test && STORY._test.zones) STORY._test.zones.push(
      { id: 'ruinscamp', test: (x, z) => !!G.state.flags.ruinsChief && Math.hypot(x - SPOT.campIn.x, z - SPOT.campIn.z) < 7, run: () => UI.chapter('The Dig Camp', 'The Sunken Ruins · four lost things') },
      { id: 'ruinsold', test: (x, z) => !!G.state.flags.ruinsThings && Math.hypot(x - 132.5, z) < 8, run: () => UI.chapter('The Old Town', 'The Sunken Ruins · the Wall of Days') },
      { id: 'ruinscourt', test: (x, z) => !!G.state.flags.ruinsWall && Math.hypot(x - SPOT.courtIn.x, z - SPOT.courtIn.z) < 5, run: () => UI.chapter('The Temple Court', 'The Sunken Ruins · the Door of Days') });
    // a lost fight with the sand worms: you wake up at the camp, not in Alba (it's a long way by sea)
    const rb0 = STORY.roamerBattle;
    STORY.roamerBattle = async function (ri) {
      const grp = WORLD.L.roamers[ri];
      if (!grp || grp.area !== 'ruins') return rb0.call(this, ri);
      const r = await G.fight({ foes: grp.foes, place: { x: grp.x, z: grp.z, biome: grp.biome } });
      if (r && r.outcome === 'win') { G.roamerBeaten(ri); UI.toast('The sand worms burrow away!'); G.save(); return; }
      if (r && r.outcome === 'lose') {
        await UI.fade(1, 400);
        teleport(SPOT.campIn.x, SPOT.campIn.z, Math.PI);
        G.cam.snap(Math.PI, 0.3, 8.5);
        await UI.fade(0, 500);
        const fe = person('fermin'); if (fe && F().ruinsSlide) await sayKey(fe, 'x.rest');
      }
    };
    sync(true);
  }
  const roamOk = s => !!(s && s.flags && s.flags.ruinsSlide);
  const thingsN = s => C.THINGS.filter(t => s.ruins && s.ruins.given && s.ruins.given[t.owner]).length;
  const panelsN = s => C.PANELS.filter(P => s.ruins && s.ruins.panels && s.ruins.panels[P.i]).length;
  const sunsN = s => (s.ruins && s.ruins.suns ? s.ruins.suns.length : 0);
  const shardsN = s => (s.ruins && s.ruins.shards ? s.ruins.shards.length : 0);
  Object.assign(C, { init, arrive, leave, interactables, target, wayIn, tick, sync, sayT, sayKey, person, restore, learnUse, roamOk, thingsN, panelsN, sunsN, shardsN, askDig, mimoDig, teleport, openDoor, liftPatch,
    _: { S, ferminScene, slideScene, elviraScene, hatScene, digThing, giveScene, wakeUp, allBack, salomeWall, readPanel, doorScene, reportScene, tulaTalk, digShard, bag } });
  Object.defineProperty(C, 'G', { get: () => G, configurable: true });
})();
