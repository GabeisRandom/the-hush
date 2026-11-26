'use strict';
// Who lives in Remanso's houses (DESIGN.md 16, playtest 4: "explore the house and its UNIQUE residents"). One profile
// per house, like Alba's and Molinar's: its theme (interiors_rooms.js), its people and pets. Then Remanso's side
// quests (interiors_quests.js is their engine): dinner for the fisher girls, a parrot's good morning, a lost shell, and
// a mother and son who argued about the color of a boat.
(() => {
  if (typeof INTERIORS === 'undefined' || !INTERIORS.home) return;
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const H = (id, p) => INTERIORS.home(id, p);
  const P = (id, name, role, at, look, lines, o) => Object.assign({ id, name, role, at, look, lines }, o || {});
  const PET = (id, kind, name, color, at, o) => Object.assign({ id, kind, name, color, at }, o || {});
  const st = q => (typeof HQ !== 'undefined' && HQ ? HQ.stage(q) : 0);
  // names said the zh / ja way (for CJK.md's houses table)
  INTERIORS.names({ Dolores: ['[多洛雷斯|Duō luò léi sī]', 'ドロレス'], Abril: ['[阿布里尔|Ā bù lǐ ěr]', 'アブリル'], Rebeca: ['[蕾贝卡|Lěi bèi kǎ]', 'レベカ'], Arturo: ['[阿图罗|Ā tú luó]', 'アルトゥーロ'],
    Esteban: ['[埃斯特班|Āi sī tè bān]', 'エステバン'], Pancho: ['[潘乔|Pān qiáo]', 'パンチョ'], Leonor: ['[莱奥诺尔|Lái ào nuò ěr]', 'レオノール'], Lourdes: ['[卢尔德斯|Lú ěr dé sī]', 'ルルデス'] });
  INTERIORS.names({ Perico: ['[佩里科|Pèi lǐ kē]', 'ペリコ'], Galleta: ['[饼干|Bǐng gān]', 'クッキー'] }, { pet: true });

  // A the fishers: Dolores at the stove, her girls playing pirates in the back room (their quest: dinner's ready)
  const girls = (at, back) => [
    P('abril', 'Abril', 'kid', at[0], { skin: '#c98e62', hair: '#2e2420', hairdo: 'pony', dress: '#2f8f86', legs: true, pants: '#3a4466', h: 0.78, hat: 'bandana', hatColor: '#d9483b' }, back ? [
      T('We’re building a boat out of the bunk bed. Don’t tell Mom!', 'Estamos haciendo un barco con la litera. ¡No le digas a mamá!', 'A gente tá fazendo um barco com o beliche. Não conta pra mamãe!', 'Wir bauen aus dem Stockbett ein Boot. Sag’s nicht Mama!',
        '[我们|wǒ men] [在|zài] [用|yòng] [上下铺|shàng xià pù] [做|zuò] [一|yī] [条|tiáo] [船|chuán] 。 [别|bié] [告诉|gào su] [妈妈|mā ma] ！', '[二段|にだん]ベッド で [船|ふね] を [作|つく]って る の 。 ママ に は ないしょ ！'),
      T('I’m the captain. Eva is the crew. And the fish.', 'Yo soy la capitana. Eva es la tripulación. Y el pez.', 'Eu sou a capitã. A Eva é a tripulação. E o peixe.', 'Ich bin die Kapitänin. Eva ist die Mannschaft. Und der Fisch.',
        '[我|wǒ] [是|shì] [船长|chuán zhǎng] 。 [埃娃|Āi wá] [是|shì] [船员|chuán yuán] 。 [也|yě] [是|shì] [鱼|yú] 。', 'わたし が [船長|せんちょう] 。 エバ は [乗組員|のりくみいん] 。 それ と [魚|さかな] 。'),
    ] : [
      T('Mom’s fish is the best in Remanso. The best in the world!', 'El pescado de mamá es el mejor de Remanso. ¡Del mundo!', 'O peixe da mamãe é o melhor de Remanso. Do mundo!', 'Mamas Fisch ist der beste in Remanso. Der beste der Welt!',
        '[妈妈|mā ma] [做|zuò] [的|de] [鱼|yú] [是|shì] [静水村|Jìng shuǐ cūn] [最|zuì] [好吃|hǎo chī] [的|de] 。 [全|quán] [世界|shì jiè] [最|zuì] [好吃|hǎo chī] ！', 'ママ の [魚|さかな] は レマンソ で いちばん 。 [世界|せかい] で いちばん ！'),
    ], { when: () => (st('hq.fish') >= 2) !== !!back }),
    P('eva', 'Eva', 'kid', at[1], { skin: '#c98e62', hair: '#2e2420', hairdo: 'pigtails', dress: '#f2c14e', h: 0.7, eyes: 'happy' }, back ? [
      T('Blub, blub. I’m a fish. Fish don’t talk. Blub.', 'Glu, glu. Soy un pez. Los peces no hablan. Glu.', 'Blub, blub. Eu sou um peixe. Peixe não fala. Blub.', 'Blubb, blubb. Ich bin ein Fisch. Fische reden nicht. Blubb.',
        '[咕嘟|gū dū] [咕嘟|gū dū] 。 [我|wǒ] [是|shì] [鱼|yú] 。 [鱼|yú] [不|bù] [说话|shuō huà] 。 [咕嘟|gū dū] 。', 'ぶく ぶく 。 わたし は [魚|さかな] 。 [魚|さかな] は しゃべらない の 。 ぶく 。'),
      T('Abril always gets to be the captain. Tomorrow it’s my turn!', 'Abril siempre es la capitana. ¡Mañana me toca a mí!', 'A Abril sempre é a capitã. Amanhã é a minha vez!', 'Abril ist immer die Kapitänin. Morgen bin ich dran!',
        '[总是|zǒng shì] [阿布里尔|Ā bù lǐ ěr] [当|dāng] [船长|chuán zhǎng] 。 [明天|míng tiān] [轮到|lún dào] [我|wǒ] ！', 'いつも アブリル が [船長|せんちょう] 。 [明日|あした] は わたし の [番|ばん] ！'),
    ] : [
      T('I’m not a fish anymore. I’m a girl who eats fish. Mmm!', 'Ya no soy un pez. Soy una niña que come pescado. ¡Mmm!', 'Eu não sou mais um peixe. Sou uma menina que come peixe. Hum!', 'Ich bin kein Fisch mehr. Ich bin ein Mädchen, das Fisch isst. Mmm!',
        '[我|wǒ] [不|bù] [是|shì] [鱼|yú] [了|le] 。 [我|wǒ] [是|shì] [吃|chī] [鱼|yú] [的|de] [小|xiǎo] [女孩|nǚ hái] 。 [真|zhēn] [香|xiāng] ！', 'もう [魚|さかな] じゃ ない よ 。 [魚|さかな] を [食|た]べる [女|おんな]の[子|こ] 。 おいしい ！'),
    ], { when: () => (st('hq.fish') >= 2) !== !!back }),
  ];
  // (in the back room, Eva stands by the wardrobe: the middle of the rug is where you come in)
  H('remanso-hA', { theme: 'fisherFamily', people: [
    P('dolores', 'Dolores', 'woman', 'cook', { skin: '#c98e62', hair: '#3a2b26', hairdo: 'bun', dress: '#3f6f9a', apron: '#e8dcc0', w: 1.06, hat: 'bandana', hatColor: '#f2c14e' }, [
      T('Fried fish tonight! I caught it myself this morning.', '¡Esta noche, pescado frito! Lo pesqué yo misma esta mañana.', 'Hoje tem peixe frito! Eu mesma pesquei hoje de manhã.', 'Heute gibt’s gebratenen Fisch! Den habe ich heute Morgen selbst gefangen.',
        '[今天|jīn tiān] [晚上|wǎn shang] [吃|chī] [炸鱼|zhá yú] ！ [是|shì] [我|wǒ] [今天|jīn tiān] [早上|zǎo shang] [自己|zì jǐ] [钓|diào] [的|de] 。', '[今夜|こんや] は [魚|さかな] の フライ ！ [今朝|けさ] 、 わたし が [釣|つ]った の よ 。'),
      T('My girls want to be fishers too. I tell them: first, learn to wait.', 'Mis niñas también quieren ser pescadoras. Yo les digo: primero, aprendan a esperar.', 'As minhas meninas também querem ser pescadoras. Eu digo: primeiro, aprendam a esperar.', 'Meine Mädchen wollen auch Fischerinnen werden. Ich sage ihnen: Lernt erst mal warten.',
        '[我|wǒ] [的|de] [女儿|nǚ ér] [们|men] [也|yě] [想|xiǎng] [当|dāng] [渔夫|yú fū] 。 [我|wǒ] [跟|gēn] [她们|tā men] [说|shuō] ： [先|xiān] [学会|xué huì] [等|děng] 。', '[娘|むすめ] たち も [漁師|りょうし] に なりたい って 。 まず は [待|ま]つ こと を [覚|おぼ]えなさい 、 って [言|い]って る の 。'),
      T('The lake gives, the lake takes. Today it gave!', 'El lago da, el lago quita. ¡Hoy dio!', 'O lago dá, o lago tira. Hoje ele deu!', 'Der See gibt, der See nimmt. Heute hat er gegeben!',
        '[湖|hú] [会|huì] [给|gěi] ， [也|yě] [会|huì] [拿|ná] 。 [今天|jīn tiān] [它|tā] [给|gěi] [了|le] ！', '[湖|みずうみ] は くれる し 、 [取|と]って も いく 。 [今日|きょう] は くれた ！'),
    ], { job: 'cook', prop: 'spoon' })].concat(girls(['sit', 'sit'], false)),
    up: { people: girls(['bed', 'stand'], true) } });
  // B the old sailor and Perico, his parrot (their quest: good morning)
  const SQUAWK = T('Squawk!', '¡Croac!', 'Cróóó!', 'Krah!', '[嘎|gā] ！', 'ギャー ！');
  const MORNING = T('Good morning! Squawk! Good morning!', '¡Buenos días! ¡Croac! ¡Buenos días!', 'Bom dia! Cróóó! Bom dia!', 'Guten Morgen! Krah! Guten Morgen!', '[早上好|zǎo shang hǎo] ！ [嘎|gā] ！ [早上好|zǎo shang hǎo] ！', 'おはよう ！ ギャー ！ おはよう ！');
  H('remanso-hB', { theme: 'sailor', people: [
    P('arturo', 'Arturo', 'grandpa', 'arm', { skin: '#c98e62', hair: '#f4f1ea', hairdo: 'bald', beard: true, dress: '#3f6fb5', legs: true, pants: '#2f3440', hat: 'captain', hatColor: '#2f3440', h: 0.95 }, [
      T('Ahoy! Forty years at sea, and now I sail an armchair. It doesn’t rock enough.', '¡Ah del barco! Cuarenta años en el mar, y ahora navego un sillón. No se mece lo suficiente.', 'Ô de bordo! Quarenta anos no mar, e agora eu navego numa poltrona. Ela não balança o bastante.', 'Ahoi! Vierzig Jahre auf See, und jetzt segle ich einen Sessel. Der schaukelt nicht genug.',
        '[喂|wèi] ！ [我|wǒ] [在|zài] [海上|hǎi shang] [四十|sì shí] [年|nián] ， [现在|xiàn zài] [只能|zhǐ néng] [开|kāi] [扶手椅|fú shǒu yǐ] 。 [摇|yáo] [得|de] [不|bù] [够|gòu] 。', 'おーい ！ [海|うみ] で [四十年|よんじゅうねん] 、 [今|いま] は ひじかけいす で [航海|こうかい] さ 。 ゆれ が [足|た]りない ！'),
      T('That telescope saw whales, storms, and one mermaid. Maybe.', 'Ese catalejo vio ballenas, tormentas y una sirena. Creo.', 'Aquela luneta viu baleias, tempestades e uma sereia. Acho.', 'Das Fernrohr hat Wale gesehen, Stürme und eine Meerjungfrau. Glaube ich.',
        '[那|nà] [个|gè] [望远镜|wàng yuǎn jìng] [见过|jiàn guo] [鲸鱼|jīng yú] 、 [暴风雨|bào fēng yǔ] ， [还有|hái yǒu] [一|yī] [条|tiáo] [美人鱼|měi rén yú] 。 [大概|dà gài] 。', 'あの [望遠鏡|ぼうえんきょう] は クジラ も 、 [嵐|あらし] も 、 [人魚|にんぎょ] も [見|み]た 。 たぶん な 。'),
      T('Perico has sailed with me for thirty years. He knows one word. One!', 'Perico navegó conmigo treinta años. Sabe una palabra. ¡Una!', 'O Perico navegou comigo por trinta anos. Ele sabe uma palavra. Uma!', 'Perico ist dreißig Jahre mit mir gesegelt. Er kann ein Wort. Ein einziges!',
        '[佩里科|Pèi lǐ kē] [跟|gēn] [我|wǒ] [航行|háng xíng] [了|le] [三十|sān shí] [年|nián] 。 [它|tā] [只|zhǐ] [会|huì] [一|yī] [个|gè] [词|cí] 。 [就|jiù] [一|yī] [个|gè] ！', 'ペリコ は [三十年|さんじゅうねん] 、 わし と [航海|こうかい] した 。 [言葉|ことば] は [一|ひと]つ しか [知|し]らん 。 [一|ひと]つ だけ ！'),
    ], { job: 'read', prop: 'book' })],
    pets: [PET('perico', 'parrot', 'Perico', '#3fae5a', 'parrot', { lines: [SQUAWK], when: () => st('hq.parrot') < 2 }),
      PET('perico', 'parrot', 'Perico', '#3fae5a', 'parrot', { lines: [MORNING], when: () => st('hq.parrot') >= 2 })] });
  // C the net mender
  H('remanso-hC', { theme: 'netMender', people: [
    P('esteban', 'Esteban', 'grandpa', 'hero', { skin: '#a8714a', hair: '#e0ddd6', hairdo: 'bald', beard: true, dress: '#5d6b70', legs: true, pants: '#3a3436', hat: 'beanie', hatColor: '#d9483b', h: 0.94 }, [
      T('A hole in the net is a door for the fish. I close the doors.', 'Un agujero en la red es una puerta para los peces. Yo cierro las puertas.', 'Um buraco na rede é uma porta pros peixes. Eu fecho as portas.', 'Ein Loch im Netz ist eine Tür für die Fische. Ich mache die Türen zu.',
        '[网|wǎng] [上|shàng] [的|de] [洞|dòng] [是|shì] [鱼|yú] [的|de] [门|mén] 。 [我|wǒ] [负责|fù zé] [关|guān] [门|mén] 。', '[網|あみ] の [穴|あな] は 、 [魚|さかな] の [出口|でぐち] 。 わし は その [出口|でぐち] を ふさぐ ん だ 。'),
      T('My hands are old, but they remember every knot.', 'Mis manos son viejas, pero se acuerdan de cada nudo.', 'As minhas mãos são velhas, mas lembram de cada nó.', 'Meine Hände sind alt, aber sie kennen jeden Knoten.',
        '[我|wǒ] [的|de] [手|shǒu] [老|lǎo] [了|le] ， [可是|kě shì] [每|měi] [个|gè] [结|jié] [都|dōu] [还|hái] [记得|jì de] 。', '[手|て] は [年|とし] を とった が 、 [結|むす]び[目|め] は ぜんぶ [覚|おぼ]えて いる 。'),
      T('Sit, sit. Mending is better with company. And in silence. Both.', 'Siéntate, siéntate. Remendar es mejor con compañía. Y en silencio. Las dos cosas.', 'Senta, senta. Remendar é melhor com companhia. E em silêncio. As duas coisas.', 'Setz dich, setz dich. Flicken geht besser mit Gesellschaft. Und in Ruhe. Beides.',
        '[坐|zuò] ， [坐|zuò] 。 [补|bǔ] [网|wǎng] [最|zuì] [好|hǎo] [有|yǒu] [人|rén] [陪|péi] 。 [也|yě] [要|yào] [安静|ān jìng] 。 [两|liǎng] [样|yàng] [都|dōu] [要|yào] 。', 'まあ 、 [座|すわ]り なさい 。 [網|あみ] の つくろい は 、 だれ か と いっしょ が いい 。 [静|しず]か に な 。 [両方|りょうほう] だ 。'),
    ], { job: 'sew' })] });
  // L1 the shell collectors: Rebeca downstairs, her little brother Fede upstairs (their quest: the pink shell)
  H('remanso-L1', { theme: 'shells', people: [
    P('rebeca', 'Rebeca', 'kid', 'sit', { skin: '#efc29a', hair: '#8a4a2a', hairdo: 'long', dress: '#4f9a5a', h: 0.84 }, [
      T('Every shell on these shelves, we found on the shore. Every single one!', 'Cada concha de estos estantes la encontramos en la orilla. ¡Todas!', 'Cada concha dessas prateleiras a gente achou na beira do lago. Todas!', 'Jede Muschel in diesen Regalen haben wir am Ufer gefunden. Jede einzelne!',
        '[架子|jià zi] [上|shàng] [的|de] [每|měi] [个|gè] [贝壳|bèi ké] [都|dōu] [是|shì] [我们|wǒ men] [在|zài] [岸|àn] [边|biān] [捡|jiǎn] [的|de] 。 [每|měi] [一|yī] [个|gè] ！', '[棚|たな] の [貝殻|かいがら] は ぜんぶ 、 [岸|きし] で [拾|ひろ]った の 。 ぜんぶ よ ！'),
      T('My little brother Fede sorts them by color. I sort them by size. We argue a lot.', 'Mi hermanito Fede las ordena por color. Yo, por tamaño. Discutimos mucho.', 'O meu irmãozinho Fede separa por cor. Eu, por tamanho. A gente briga muito.', 'Mein kleiner Bruder Fede sortiert sie nach Farbe. Ich nach Größe. Wir streiten viel.',
        '[我|wǒ] [弟弟|dì di] [费德|Fèi dé] [按|àn] [颜色|yán sè] [分|fēn] 。 [我|wǒ] [按|àn] [大小|dà xiǎo] [分|fēn] 。 [我们|wǒ men] [常常|cháng cháng] [吵架|chǎo jià] 。', '[弟|おとうと] の フェデ は [色|いろ] で [分|わ]ける 。 わたし は [大|おお]きさ で [分|わ]ける 。 よく けんか する の 。'),
    ], { job: 'sit' })],
    up: { people: [
      P('fede', 'Fede', 'kid', 'floor', { skin: '#efc29a', hair: '#8a4a2a', hairdo: 'curly', dress: '#e0743c', legs: true, pants: '#3a4466', h: 0.64 }, [
        T('My best shell is gone! The pink one! I looked everywhere…', '¡Mi mejor concha desapareció! ¡La rosada! Busqué por todas partes…', 'A minha melhor concha sumiu! A cor-de-rosa! Eu procurei em todo lugar…', 'Meine beste Muschel ist weg! Die rosa! Ich hab überall gesucht …',
          '[我|wǒ] [最|zuì] [好|hǎo] [的|de] [贝壳|bèi ké] [不|bù] [见|jiàn] [了|le] ！ [粉色|fěn sè] [的|de] [那|nà] [个|gè] ！ [我|wǒ] [到处|dào chù] [都|dōu] [找|zhǎo] [过|guo] [了|le] …', 'いちばん の [貝殻|かいがら] が ない ！ ピンク の ！ どこ も [探|さが]した のに …'),
      ], { job: 'sit', when: () => st('hq.shell') < 3 }),
      P('fede', 'Fede', 'kid', 'floor', { skin: '#efc29a', hair: '#8a4a2a', hairdo: 'curly', dress: '#e0743c', legs: true, pants: '#3a4466', h: 0.64, eyes: 'happy' }, [
        T('My pink shell! I keep it under my pillow now. Shh!', '¡Mi concha rosada! Ahora la guardo debajo de la almohada. ¡Shh!', 'A minha concha cor-de-rosa! Agora eu guardo debaixo do travesseiro. Shh!', 'Meine rosa Muschel! Jetzt bewahre ich sie unter dem Kopfkissen auf. Pst!',
          '[我|wǒ] [的|de] [粉色|fěn sè] [贝壳|bèi ké] ！ [现在|xiàn zài] [我|wǒ] [把|bǎ] [它|tā] [放|fàng] [在|zài] [枕头|zhěn tou] [下面|xià miàn] 。 [嘘|xū] ！', 'ピンク の [貝殻|かいがら] ！ [今|いま] は [枕|まくら] の [下|した] に しまって る ん だ 。 しー ！'),
      ], { job: 'sit', when: () => st('hq.shell') >= 3 })] } });
  // L2 the letter writer, who hasn't written to her son in a year (their quest: I'm sorry)
  const LEONOR = { skin: '#efc29a', hair: '#e0ddd6', hairdo: 'bun', dress: '#8fb0c9', glasses: true, h: 0.87, scarf: '#fdf8ee' };
  const LE_LETTERS = T('Letters, letters… I used to write one every week. To my son.', 'Cartas, cartas… Antes escribía una cada semana. A mi hijo.', 'Cartas, cartas… Eu escrevia uma toda semana. Pro meu filho.', 'Briefe, Briefe … Früher habe ich jede Woche einen geschrieben. An meinen Sohn.',
    '[信|xìn] ， [信|xìn] … [我|wǒ] [以前|yǐ qián] [每|měi] [个|gè] [星期|xīng qī] [都|dōu] [写|xiě] [一|yī] [封|fēng] 。 [写|xiě] [给|gěi] [我|wǒ] [儿子|ér zi] 。', '[手紙|てがみ] 、 [手紙|てがみ] … [前|まえ] は [毎週|まいしゅう] [書|か]いて いた の 。 [息子|むすこ] に 。');
  H('remanso-L2', { theme: 'letters', people: [
    P('leonor', 'Leonor', 'grandma', 'desk', LEONOR, [LE_LETTERS,
      T('That clock stopped the day we argued. I never wound it again.', 'Ese reloj se paró el día que discutimos. Nunca le volví a dar cuerda.', 'Aquele relógio parou no dia em que a gente brigou. Nunca mais dei corda nele.', 'Die Uhr ist an dem Tag stehen geblieben, an dem wir gestritten haben. Ich habe sie nie wieder aufgezogen.',
        '[那|nà] [个|gè] [钟|zhōng] [在|zài] [我们|wǒ men] [吵架|chǎo jià] [那|nà] [天|tiān] [停|tíng] [了|le] 。 [我|wǒ] [再|zài] [也|yě] [没|méi] [上|shàng] [过|guo] [发条|fā tiáo] 。', 'あの [時計|とけい] は 、 けんか した [日|ひ] に [止|と]まった の 。 それ から 、 ねじ を [巻|ま]いて いない 。'),
    ], { job: 'write', prop: 'letter', when: () => st('hq.sorry') < 3 }),
    P('leonor', 'Leonor', 'grandma', 'desk', LEONOR, [
      T('Pancho comes for dinner on Sundays now. And the clock is ticking again.', 'Ahora Pancho viene a cenar los domingos. Y el reloj vuelve a andar.', 'Agora o Pancho vem jantar aos domingos. E o relógio voltou a andar.', 'Jetzt kommt Pancho sonntags zum Abendessen. Und die Uhr tickt wieder.',
        '[现在|xiàn zài] [潘乔|Pān qiáo] [每|měi] [个|gè] [星期天|xīng qī tiān] [都|dōu] [来|lái] [吃|chī] [晚饭|wǎn fàn] 。 [那|nà] [个|gè] [钟|zhōng] [也|yě] [又|yòu] [走|zǒu] [了|le] 。', '[今|いま] は パンチョ が [毎週|まいしゅう] [日曜日|にちようび] に [晩|ばん]ごはん を [食|た]べ に [来|く]る の 。 [時計|とけい] も また [動|うご]いて いる わ 。'),
      LE_LETTERS], { job: 'write', prop: 'letter', when: () => st('hq.sorry') >= 3 })] });
  // L3 the boat painter (green boats only; his mother says blue)
  const PANCHO = { skin: '#dcae86', hair: '#3a2b26', dress: '#2f8f86', apron: '#e8dcc0', legs: true, pants: '#3a4466', beard: true, hat: 'cap', hatColor: '#2f8f86' };
  const PA_LOVE = T('A boat is like a person. Paint it with love, and it floats better.', 'Un barco es como una persona. Si lo pintas con cariño, flota mejor.', 'Um barco é como uma pessoa. Se você pinta com carinho, ele flutua melhor.', 'Ein Boot ist wie ein Mensch. Wenn man es mit Liebe streicht, schwimmt es besser.',
    '[船|chuán] [就|jiù] [像|xiàng] [人|rén] 。 [用|yòng] [心|xīn] [去|qù] [刷|shuā] ， [它|tā] [就|jiù] [浮|fú] [得|de] [更|gèng] [好|hǎo] 。', '[船|ふね] は [人|ひと] と [同|おな]じ だ 。 [心|こころ] を こめて [塗|ぬ]れば 、 よく [浮|う]く 。');
  H('remanso-L3', { theme: 'boatPainter', people: [
    P('pancho', 'Pancho', 'man', 'stand', PANCHO, [
      T('Green! Every boat should be green. My mother says blue. That’s why we don’t talk.', '¡Verde! Todos los barcos deberían ser verdes. Mi mamá dice que azules. Por eso no nos hablamos.', 'Verde! Todo barco devia ser verde. A minha mãe diz que azul. Por isso a gente não se fala.', 'Grün! Jedes Boot sollte grün sein. Meine Mutter sagt blau. Deshalb reden wir nicht miteinander.',
        '[绿色|lǜ sè] ！ [每|měi] [条|tiáo] [船|chuán] [都|dōu] [应该|yīng gāi] [是|shì] [绿色|lǜ sè] [的|de] 。 [我|wǒ] [妈|mā] [说|shuō] [是|shì] [蓝色|lán sè] 。 [所以|suǒ yǐ] [我们|wǒ men] [不|bù] [说话|shuō huà] [了|le] 。', '[緑|みどり] ！ [船|ふね] は ぜんぶ [緑|みどり] で ある べき だ 。 [母|はは] は [青|あお] だ って 。 だから [口|くち] を きいて ない ん だ 。'),
      PA_LOVE], { job: 'paint', prop: 'brush', propColor: '#2f8f86', when: () => st('hq.sorry') < 3 }),
    P('pancho', 'Pancho', 'man', 'stand', PANCHO, [
      T('Blue and green. Half and half. Mom’s idea. It’s… actually beautiful.', 'Azul y verde. Mitad y mitad. Idea de mamá. Es… la verdad, precioso.', 'Azul e verde. Metade e metade. Ideia da mamãe. Ficou… lindo, na verdade.', 'Blau und grün. Halb und halb. Mamas Idee. Es ist … ehrlich gesagt wunderschön.',
        '[蓝色|lán sè] [和|hé] [绿色|lǜ sè] ， [一半|yī bàn] [一半|yī bàn] 。 [是|shì] [我|wǒ] [妈|mā] [的|de] [主意|zhǔ yi] 。 [其实|qí shí] … [挺|tǐng] [好看|hǎo kàn] [的|de] 。', '[青|あお] と [緑|みどり] 、 [半分|はんぶん] ずつ 。 [母|はは] の アイデア だ 。 [実|じつ] は … きれい なん だ 。'),
      PA_LOVE], { job: 'paint', prop: 'brush', propColor: '#3f6fb5', when: () => st('hq.sorry') >= 3 })] });
  // S1 the weather watcher, and Sombra asleep upstairs
  H('remanso-S1', { theme: 'weather', people: [
    P('lourdes', 'Lourdes', 'woman', 'desk', { skin: '#e6b48c', hair: '#5a5048', hairdo: 'bun', dress: '#5a7ab8', glasses: true, scarf: '#f2c14e' }, [
      T('Clouds from the west: rain by dinner. Clouds from the east: rain by lunch. I’m always right!', 'Nubes del oeste: lluvia para la cena. Nubes del este: lluvia para el almuerzo. ¡Siempre acierto!', 'Nuvens do oeste: chuva na hora do jantar. Nuvens do leste: chuva na hora do almoço. Eu sempre acerto!', 'Wolken aus dem Westen: Regen zum Abendessen. Wolken aus dem Osten: Regen zum Mittagessen. Ich habe immer recht!',
        '[西边|xī biān] [来|lái] [的|de] [云|yún] ： [晚饭|wǎn fàn] [前|qián] [下雨|xià yǔ] 。 [东边|dōng biān] [来|lái] [的|de] [云|yún] ： [午饭|wǔ fàn] [前|qián] [下雨|xià yǔ] 。 [我|wǒ] [从来|cóng lái] [没|méi] [错|cuò] [过|guo] ！', '[西|にし] から の [雲|くも] は 、 [夕飯|ゆうはん] まで に [雨|あめ] 。 [東|ひがし] から の [雲|くも] は 、 お[昼|ひる] まで に [雨|あめ] 。 いつも [当|あ]たる の よ ！'),
      T('Thirty notebooks of skies. Every day since I was a girl.', 'Treinta cuadernos de cielos. Todos los días desde que era niña.', 'Trinta cadernos de céus. Todo dia, desde menina.', 'Dreißig Hefte voller Himmel. Jeden Tag, seit ich ein Mädchen war.',
        '[三十|sān shí] [本|běn] [天空|tiān kōng] [的|de] [笔记|bǐ jì] 。 [从|cóng] [小|xiǎo] [到|dào] [现在|xiàn zài] ， [每天|měi tiān] [都|dōu] [写|xiě] 。', '[空|そら] の ノート が [三十冊|さんじゅっさつ] 。 [子|こ]ども の ころ から 、 [毎日|まいにち] [書|か]いて いる の 。'),
      T('Hear the wind chime? When it sings like that, the fish are hungry.', '¿Oyes el móvil de viento? Cuando suena así, los peces tienen hambre.', 'Ouviu o sininho de vento? Quando ele toca assim, os peixes estão com fome.', 'Hörst du das Windspiel? Wenn es so klingt, haben die Fische Hunger.',
        '[听到|tīng dào] [风铃|fēng líng] [了|le] [吗|ma] ？ [它|tā] [这样|zhè yàng] [响|xiǎng] [的|de] [时候|shí hou] ， [鱼|yú] [就|jiù] [饿|è] [了|le] 。', '[風鈴|ふうりん] が [聞|き]こえる ？ あんな ふう に [鳴|な]る と 、 [魚|さかな] が おなか を すかせて いる の よ 。'),
    ], { job: 'write' })],
    up: { pets: [PET('sombra', 'cat', 'Sombra', '#3a3436', 'catbed', { pose: 'sleep' })] } });
  // S2 the grandma, her grandson Manu, and Galleta the turtle
  H('remanso-S2', { theme: 'turtle', people: [
    P('herminia', 'Herminia', 'grandma', 'rock', { skin: '#dcae86', hair: '#f4f1ea', hairdo: 'bun', dress: '#4f9a5a', apron: '#fdf8ee', h: 0.86, w: 1.05, eyes: 'happy' }, [
      T('This is Galleta. She’s my grandson’s turtle. And somehow, my job.', 'Esta es Galleta. Es la tortuga de mi nieto. Y no sé cómo, mi trabajo.', 'Esta é a Galleta. É a tartaruga do meu neto. E, não sei como, o meu trabalho.', 'Das ist Galleta. Die Schildkröte von meinem Enkel. Und irgendwie meine Arbeit.',
        '[这|zhè] [是|shì] [饼干|Bǐng gān] 。 [是|shì] [我|wǒ] [孙子|sūn zi] [的|de] [乌龟|wū guī] 。 [不知道|bù zhī dào] [怎么|zěn me] [的|de] ， [成|chéng] [了|le] [我|wǒ] [的|de] [工作|gōng zuò] 。', 'この [子|こ] は クッキー 。 [孫|まご] の カメ です 。 なぜ か 、 わたし が お[世話|せわ] を して いる の 。'),
      T('Galleta is older than my grandson. Turtles are patient. Grandmas too.', 'Galleta es más vieja que mi nieto. Las tortugas son pacientes. Las abuelas también.', 'A Galleta é mais velha que o meu neto. Tartarugas são pacientes. Avós também.', 'Galleta ist älter als mein Enkel. Schildkröten sind geduldig. Omas auch.',
        '[饼干|Bǐng gān] [比|bǐ] [我|wǒ] [孙子|sūn zi] [年纪|nián jì] [还|hái] [大|dà] 。 [乌龟|wū guī] [很|hěn] [有|yǒu] [耐心|nài xīn] 。 [奶奶|nǎi nai] [也|yě] [是|shì] 。', 'クッキー は [孫|まご] より [年上|としうえ] な の 。 カメ は [気長|きなが] です 。 おばあちゃん も ね 。'),
    ], { job: 'knit', prop: 'knit' }),
    P('manu', 'Manu', 'kid', 'floor', { skin: '#dcae86', hair: '#3a2b26', hairdo: 'curly', dress: '#3d7fd1', legs: true, pants: '#3a4466', h: 0.66 }, [
      T('Galleta can’t run, but she always gets there. Grandma says that’s a lesson.', 'Galleta no puede correr, pero siempre llega. La abuela dice que eso es una lección.', 'A Galleta não sabe correr, mas sempre chega. A vovó diz que isso é uma lição.', 'Galleta kann nicht rennen, aber sie kommt immer an. Oma sagt, das ist eine Lektion.',
        '[饼干|Bǐng gān] [跑|pǎo] [不|bù] [快|kuài] ， [可是|kě shì] [总是|zǒng shì] [能|néng] [到|dào] 。 [奶奶|nǎi nai] [说|shuō] [这|zhè] [是|shì] [一|yī] [个|gè] [道理|dào li] 。', 'クッキー は [走|はし]れない けど 、 いつも ちゃんと [着|つ]く ん だ 。 おばあちゃん は 、 それ が [大事|だいじ] な こと だ って 。'),
      T('I tried to teach her tricks. She blinked. Twice.', 'Intenté enseñarle trucos. Parpadeó. Dos veces.', 'Eu tentei ensinar truques pra ela. Ela piscou. Duas vezes.', 'Ich wollte ihr Kunststücke beibringen. Sie hat geblinzelt. Zweimal.',
        '[我|wǒ] [想|xiǎng] [教|jiāo] [它|tā] [玩|wán] [把戏|bǎ xì] 。 [它|tā] [眨|zhǎ] [了|le] [眨|zhǎ] [眼|yǎn] 。 [眨|zhǎ] [了|le] [两|liǎng] [次|cì] 。', '[芸|げい] を [教|おし]えよう と した ん だ 。 まばたき した 。 [二回|にかい] 。'),
    ], { job: 'sit' })],
    pets: [PET('galleta', 'turtle', 'Galleta', null, 'turtle')] });
})();
// ============================================================ Remanso's side quests (the engine: interiors_quests.js)
(() => {
  if (typeof HQ === 'undefined' || !HQ) return;
  const { T, n } = HQ;
  const P = pid => HQ.person(pid);
  const say = (pid, L) => HQ.say(P(pid), L);
  const ask = async (task, o) => { const r = await HQ.ask(task, o); return r && !r.cancelled ? r.grade : null; };
  const worse = (a, b) => 'SABCD'[Math.max('SABCD'.indexOf(a || 'S'), 'SABCD'.indexOf(b || 'S'))];
  const G = () => HQ.G;
  const hqS = () => (G().state.hq = G().state.hq || {});
  const saveG = (q, g) => { const s = hqS(); s.grades = s.grades || {}; s.grades[q.id + ':g'] = worse(s.grades[q.id + ':g'], g); };
  const gotG = q => (hqS().grades || {})[q.id + ':g'] || 'B';
  const fadeRefresh = async door => { try { await UI.fade(1, 220); INTERIORS.refresh(door); await UI.fade(0, 220); } catch (e) { console.error('[hq]', e); } };
  const COMMON = HQ.COMMON || { later: T('No rush. Come back when you’re ready.', 'Sin prisa. Vuelve cuando quieras.', 'Sem pressa. Volta quando quiser.', 'Keine Eile. Komm wieder, wenn du so weit bist.',
    '[不|bù] [着急|zháo jí] 。 [准备|zhǔn bèi] [好|hǎo] [了|le] [再|zài] [来|lái] 。', 'あわてない で 。 [準備|じゅんび] が できたら 、 また [来|き]て ね 。') };

  // ---- 1. Dinner's ready! (a favor: call the girls from the back room) · «¡A comer!»
  HQ.phrase({ id: 'ph.hq.dinner', en: 'Dinner’s ready!', es: '¡A comer!', pt: 'A comida está pronta!', de: 'Das Essen ist fertig!', zh: '[吃饭|chī fàn] [了|le] ！', ja: 'ごはん です よ ！', note: 'What you call out when the food is on the table. es also «¡La cena está lista!», pt «Vem comer!», de «Essen!», ja to family «ごはんだよ！».' });
  const Q1 = HQ.quest({ id: 'hq.fish', home: 'remanso-hA', done: 3, coins: 6, phrase: 'ph.hq.dinner',
    title: () => 'Dinner’s ready!', who: () => `${n('dolores')}, a fisher in Remanso`,
    steps: [{ until: 2, text: () => 'Call the girls to dinner', why: 'Abril and Eva are playing pirates in the back room. Dolores’s hands smell of fish.', hint: '{mimo} points at the door to the back room.', at: ['remanso-hA', 'abril'] },
      { until: 3, text: () => `Tell ${n('dolores')} they’re coming`, why: 'She’s at the stove with the fried fish.', hint: '{mimo} sniffs the fish… mmm.', at: ['remanso-hA', 'dolores'] }],
    story: () => 'Dolores fried the fish she caught, and her girls were playing pirates in the back room. You called them to dinner, and they came running.',
    lines: {
      offer: T('The fish is ready, and the girls are in the back room. Playing pirates, I think.', 'El pescado está listo, y las niñas están en el cuarto de atrás. Jugando a los piratas, creo.', 'O peixe está pronto, e as meninas estão no quarto dos fundos. Brincando de pirata, eu acho.', 'Der Fisch ist fertig, und die Mädchen sind im hinteren Zimmer. Sie spielen Piraten, glaube ich.',
        '[鱼|yú] [做|zuò] [好|hǎo] [了|le] ， [女儿|nǚ ér] [们|men] [在|zài] [后面|hòu miàn] [的|de] [房间|fáng jiān] 。 [好像|hǎo xiàng] [在|zài] [玩|wán] [海盗|hǎi dào] [游戏|yóu xì] 。', '[魚|さかな] が できた けど 、 [娘|むすめ] たち は [奥|おく] の [部屋|へや] 。 [海賊|かいぞく] ごっこ を して る みたい 。'),
      demo: T('In this house, when the food is on the table, we shout: “Dinner’s ready!” And everyone comes running.', 'En esta casa, cuando la comida está en la mesa, gritamos: «¡A comer!» Y todos vienen corriendo.', 'Nesta casa, quando a comida está na mesa, a gente grita: «A comida está pronta!» E todo mundo vem correndo.', 'Wenn bei uns das Essen auf dem Tisch steht, rufen wir: „Das Essen ist fertig!“ Und alle kommen angerannt.',
        '[在|zài] [我们|wǒ men] [家|jiā] ， [饭菜|fàn cài] [上|shàng] [桌|zhuō] [的|de] [时候|shí hou] ， [我们|wǒ men] [就|jiù] [喊|hǎn] ： “ [吃饭|chī fàn] [了|le] ！ ” [大家|dà jiā] [都|dōu] [跑|pǎo] [过来|guò lái] 。', 'うち で は 、 ごはん が できたら 「 ごはん です よ ！ 」 って [呼|よ]ぶ の 。 そう する と 、 みんな [走|はし]って くる 。'),
      please: T('My hands smell of fish. Could you call them for me?', 'Tengo las manos oliendo a pescado. ¿Las llamas tú?', 'As minhas mãos estão cheirando a peixe. Você chama elas pra mim?', 'Meine Hände riechen nach Fisch. Rufst du sie für mich?',
        '[我|wǒ] [手|shǒu] [上|shàng] [都|dōu] [是|shì] [鱼|yú] [腥|xīng] [味|wèi] 。 [你|nǐ] [帮|bāng] [我|wǒ] [叫|jiào] [她们|tā men] [好|hǎo] [吗|ma] ？', '[手|て] が [魚|さかな] くさくて 。 [呼|よ]んで きて くれる ？'),
      wait: T('The back room! Through that door.', '¡El cuarto de atrás! Por esa puerta.', 'O quarto dos fundos! Por aquela porta.', 'Das hintere Zimmer! Durch die Tür da.',
        '[后面|hòu miàn] [的|de] [房间|fáng jiān] ！ [从|cóng] [那|nà] [扇|shàn] [门|mén] [进去|jìn qù] 。', '[奥|おく] の [部屋|へや] よ ！ あの ドア から 。'),
      pirates: T('Halt! Who goes there? This is a pirate ship!', '¡Alto! ¿Quién va? ¡Este es un barco pirata!', 'Alto lá! Quem vem lá? Este é um navio pirata!', 'Halt! Wer da? Das ist ein Piratenschiff!',
        '[站住|zhàn zhù] ！ [是|shì] [谁|shéi] ？ [这|zhè] [是|shì] [海盗|hǎi dào] [船|chuán] ！', '[止|と]まれ ！ だれ だ ？ ここ は [海賊船|かいぞくせん] だ ぞ ！'),
      run: T('Fish? FISH! Eva, come on! Race you!', '¿Pescado? ¡PESCADO! ¡Eva, vamos! ¡Te echo una carrera!', 'Peixe? PEIXE! Eva, vamos! Quem chegar por último…!', 'Fisch? FISCH! Eva, komm! Wer zuerst da ist!',
        '[鱼|yú] ？ [有|yǒu] [鱼|yú] ！ [埃娃|Āi wá] ， [快|kuài] [走|zǒu] ！ [比|bǐ] [谁|shéi] [快|kuài] ！', '[魚|さかな] ？ [魚|さかな] だ ！ エバ 、 [行|い]こう ！ [競走|きょうそう] だ よ ！'),
      thanks: T('Look at them run! Thank you. Sit, eat with us. There’s plenty!', '¡Mira cómo corren! Gracias. Siéntate, come con nosotras. ¡Hay de sobra!', 'Olha como correm! Obrigada. Senta, come com a gente. Tem de sobra!', 'Schau, wie sie rennen! Danke. Setz dich, iss mit uns. Es ist genug da!',
        '[你|nǐ] [看|kàn] [她们|tā men] [跑|pǎo] [得|de] ！ [谢谢|xiè xie] 。 [坐|zuò] [下|xià] [一起|yī qǐ] [吃|chī] [吧|ba] 。 [多|duō] [的|de] [是|shì] ！', 'ほら 、 [走|はし]って きた ！ ありがとう 。 [座|すわ]って 、 いっしょ に [食|た]べて 。 たくさん ある から ！'),
    },
    tasks: { dinner: { en: 'Dinner’s ready!', model: { es: '¡A comer!', pt: 'A comida está pronta!', de: 'Das Essen ist fertig!', zh: '[吃饭|chī fàn] [了|le] ！', ja: 'ごはん です よ ！' },
      ok: { es: ['¡La cena está lista!', '¡A cenar!', '¡A comer, niñas!', '¡Niñas, a comer!', '¡La comida está lista!'], pt: ['Vem comer!', 'Venham comer!', 'O jantar está pronto!', 'Hora de comer!', 'A comida tá pronta!'], de: ['Essen ist fertig!', 'Essen!', 'Abendessen!', 'Das Abendessen ist fertig!', 'Kommt essen!'],
        zh: ['[吃饭|chī fàn] [啦|la] ！', '[开饭|kāi fàn] [了|le] ！', '[快|kuài] [来|lái] [吃饭|chī fàn] ！'], ja: ['ごはん だ よ ！', 'ごはん です ！', 'ごはん よ ！'] },
      keys: { es: [['comer', 'cena', 'cenar', 'comida']], pt: [['comida', 'comer', 'jantar']], de: [['essen', 'abendessen']], zh: [['chifan', 'kaifan']], ja: [['gohan']] } } },
    talk: Object.assign({
      dolores: st => (st === 0 ? async () => { HQ.lock(true); await say('dolores', Q1.lines.offer); await HQ.demo(P('dolores'), Q1.lines.demo, Q1.tasks.dinner); await say('dolores', Q1.lines.please); HQ.setStage('hq.fish', 1); }
        : st === 1 ? () => say('dolores', Q1.lines.wait)
        : st === 2 ? async () => { HQ.lock(true); await HQ.me('They’re coming. Running, actually!'); await say('dolores', Q1.lines.thanks); HQ.setStage('hq.fish', 3); HQ.reward(Q1, gotG(Q1)); } : null),
    }, ...['abril', 'eva'].map(pid => ({ [pid]: st => (st === 1 ? async () => {
      HQ.lock(true); await say('abril', Q1.lines.pirates);
      const g = await ask(Q1.tasks.dinner, { title: 'Call the girls: “Dinner’s ready!”', icon: 'soup' });
      if (!g) return;
      saveG(Q1, g); await say('abril', Q1.lines.run); HQ.setStage('hq.fish', 2); await fadeRefresh('remanso-hA');
    } : null) }))),
    mark: { dolores: st => (st === 0 ? '!' : st === 2 ? '◆' : null), abril: st => (st === 1 ? '◆' : null) } });

  // ---- 2. Perico's good morning (a pet) · «¡Buenos días!»
  HQ.phrase({ id: 'ph.hq.morning', en: 'Good morning!', es: '¡Buenos días!', pt: 'Bom dia!', de: 'Guten Morgen!', zh: '[早上好|zǎo shang hǎo] ！', ja: 'おはよう ございます ！', note: 'es / pt: until lunch. ja to friends: «おはよう！». zh also «早！».' });
  HQ.keep({ id: 'k.hqBottle', en: 'a ship in a bottle from Arturo', es: 'barco en una botella', pt: 'navio na garrafa', de: 'Buddelschiff', zh: '[瓶中船|píng zhōng chuán]', ja: 'ボトルシップ', g: { es: 'm', pt: 'm', de: 'n' }, icon: 'boat' });
  const Q2 = HQ.quest({ id: 'hq.parrot', home: 'remanso-hB', done: 3, coins: 7, phrase: 'ph.hq.morning', keep: 'k.hqBottle',
    title: () => 'Perico’s good morning', who: () => `${n('arturo')}, an old sailor in Remanso`,
    steps: [{ until: 2, text: () => 'Say good morning to Perico the parrot', why: 'Thirty years at sea with Arturo, and Perico only squawks. Maybe a new voice will help.', hint: '{mimo} eyes the parrot on its perch. The parrot eyes {mimo}.', at: ['remanso-hB', 'perico'] },
      { until: 3, text: () => `Tell ${n('arturo')}`, why: 'He’s in his armchair, pretending not to listen.', hint: '{mimo} hops to the armchair.', at: ['remanso-hB', 'arturo'] }],
    story: () => 'Perico, Arturo’s parrot, only ever said “Squawk!” You wished him good morning, and he said it back. Now he says it at midnight too.',
    lines: {
      offer: T('Thirty years, and Perico only says “Squawk!” Every sailor’s parrot talks. Mine squawks.', 'Treinta años, y Perico solo dice «¡Croac!». Todos los loros de marinero hablan. El mío grazna.', 'Trinta anos, e o Perico só diz «Cróóó!». Todo papagaio de marinheiro fala. O meu grasna.', 'Dreißig Jahre, und Perico sagt nur „Krah!“. Jeder Seemannspapagei spricht. Meiner krächzt.',
        '[三十|sān shí] [年|nián] [了|le] ， [佩里科|Pèi lǐ kē] [只|zhǐ] [会|huì] [说|shuō] “ [嘎|gā] ！ ” [水手|shuǐ shǒu] [的|de] [鹦鹉|yīng wǔ] [都|dōu] [会|huì] [说话|shuō huà] ， [我|wǒ] [的|de] [只|zhǐ] [会|huì] [叫|jiào] 。', '[三十年|さんじゅうねん] も たつ のに 、 ペリコ は 「 ギャー ！ 」 しか [言|い]わん 。 [船乗|ふなの]り の オウム は みんな しゃべる のに 、 うち の は [鳴|な]く だけ だ 。'),
      demo: T('Every morning I tell him: “Good morning, Perico!” And every morning: “Squawk!”', 'Cada mañana le digo: «¡Buenos días, Perico!» Y cada mañana: «¡Croac!»', 'Toda manhã eu digo: «Bom dia, Perico!» E toda manhã: «Cróóó!»', 'Jeden Morgen sage ich: „Guten Morgen, Perico!“ Und jeden Morgen: „Krah!“',
        '[每天|měi tiān] [早上|zǎo shang] [我|wǒ] [都|dōu] [说|shuō] ： “ [早上好|zǎo shang hǎo] ， [佩里科|Pèi lǐ kē] ！ ” [每天|měi tiān] [早上|zǎo shang] [它|tā] [都|dōu] [说|shuō] ： “ [嘎|gā] ！ ”', '[毎朝|まいあさ] 「 おはよう ございます 、 ペリコ ！ 」 と [言|い]う 。 [毎朝|まいあさ] 、 「 ギャー ！ 」 だ 。'),
      please: T('Maybe he’s tired of my voice. You try! Say good morning to him.', 'A lo mejor ya se cansó de mi voz. ¡Prueba tú! Dale los buenos días.', 'Vai ver ele cansou da minha voz. Tenta você! Dá bom dia pra ele.', 'Vielleicht kann er meine Stimme nicht mehr hören. Versuch du es! Sag ihm Guten Morgen.',
        '[也许|yě xǔ] [它|tā] [听|tīng] [腻|nì] [了|le] [我|wǒ] [的|de] [声音|shēng yīn] 。 [你|nǐ] [试试|shì shi] ！ [跟|gēn] [它|tā] [说|shuō] [早上好|zǎo shang hǎo] 。', 'わし の [声|こえ] に [飽|あ]きた の かも な 。 [君|きみ] が やって みて くれ ！ おはよう 、 って [言|い]って やって 。'),
      wait: T('Go on, he’s on his perch. He doesn’t bite. Much.', 'Anda, está en su percha. No muerde. Mucho.', 'Vai, ele tá no poleiro. Ele não morde. Muito.', 'Na los, er sitzt auf seiner Stange. Er beißt nicht. Meistens.',
        '[去|qù] [吧|ba] ， [它|tā] [在|zài] [架子|jià zi] [上|shàng] 。 [它|tā] [不|bù] [咬|yǎo] [人|rén] 。 [不|bù] [太|tài] [咬|yǎo] 。', 'さあ 、 [止|と]まり[木|ぎ] に いる よ 。 かまない から 。 あまり 。'),
      squawk: T('Squawk!', '¡Croac!', 'Cróóó!', 'Krah!', '[嘎|gā] ！', 'ギャー ！'),
      repeat: T('… … Good morning! Good morning! Squawk!', '… … ¡Buenos días! ¡Buenos días! ¡Croac!', '… … Bom dia! Bom dia! Cróóó!', '… … Guten Morgen! Guten Morgen! Krah!',
        '… … [早上好|zǎo shang hǎo] ！ [早上好|zǎo shang hǎo] ！ [嘎|gā] ！', '… … おはよう ございます ！ おはよう ございます ！ ギャー ！'),
      thanks: T('He talked! Thirty years! Ha ha! Take this ship in a bottle. I built it on a long, calm night.', '¡Habló! ¡Treinta años! ¡Ja, ja! Toma este barco en una botella. Lo hice en una noche larga y tranquila.', 'Ele falou! Trinta anos! Rá, rá! Toma este navio na garrafa. Eu fiz numa noite longa e calma.', 'Er hat gesprochen! Dreißig Jahre! Ha ha! Nimm dieses Buddelschiff. Ich habe es in einer langen, ruhigen Nacht gebaut.',
        '[它|tā] [说话|shuō huà] [了|le] ！ [三十|sān shí] [年|nián] [啊|a] ！ [哈哈|hā hā] ！ [这|zhè] [个|gè] [瓶中船|píng zhōng chuán] [给|gěi] [你|nǐ] 。 [是|shì] [我|wǒ] [在|zài] [一|yī] [个|gè] [安静|ān jìng] [的|de] [长夜|cháng yè] [里|lǐ] [做|zuò] [的|de] 。', 'しゃべった ！ [三十年|さんじゅうねん] だ ぞ ！ はっはっは ！ この ボトルシップ を やろう 。 [長|なが]い [静|しず]か な [夜|よる] に [作|つく]った ん だ 。'),
      after: T('Now he says good morning at midnight too. Thanks a lot!', 'Ahora también da los buenos días a medianoche. ¡Muchas gracias, eh!', 'Agora ele dá bom dia até à meia-noite. Muito obrigado, viu!', 'Jetzt sagt er auch um Mitternacht Guten Morgen. Vielen Dank auch!',
        '[现在|xiàn zài] [半夜|bàn yè] [它|tā] [也|yě] [说|shuō] [早上好|zǎo shang hǎo] 。 [真是|zhēn shì] [谢谢|xiè xie] [你|nǐ] [了|le] ！', '[今|いま] じゃ 、 [真夜中|まよなか] に も 「 おはよう 」 だ 。 まったく 、 ありがとう よ ！'),
    },
    tasks: { morning: { en: 'Good morning!', model: { es: '¡Buenos días!', pt: 'Bom dia!', de: 'Guten Morgen!', zh: '[早上好|zǎo shang hǎo] ！', ja: 'おはよう ございます ！' },
      ok: { es: ['¡Buenos días, Perico!', '¡Buen día!', '¡Buen día, Perico!'], pt: ['Bom dia, Perico!'], de: ['Guten Morgen, Perico!', 'Morgen!', 'Moin!'],
        zh: ['[早|zǎo] ！', '[早上好|zǎo shang hǎo] ， [佩里科|Pèi lǐ kē] ！', '[早安|zǎo ān] ！'], ja: ['おはよう ！', 'おはよう 、 ペリコ ！', 'おはよう ございます 、 ペリコ ！'] },
      keys: { es: [['buenos dias', 'buen dia']], pt: [['bom dia']], de: [['morgen', 'moin']], zh: [['zao']], ja: [['ohayo']] } } },
    talk: {
      arturo: st => (st === 0 ? async () => { HQ.lock(true); await say('arturo', Q2.lines.offer); await HQ.demo(P('arturo'), Q2.lines.demo, Q2.tasks.morning); await say('arturo', Q2.lines.please); HQ.setStage('hq.parrot', 1); }
        : st === 1 ? () => say('arturo', Q2.lines.wait)
        : st === 2 ? async () => { HQ.lock(true); await HQ.me('Perico said it! Good morning!'); await say('arturo', Q2.lines.thanks); HQ.setStage('hq.parrot', 3); HQ.reward(Q2, gotG(Q2)); }
        : Math.random() < 0.5 ? () => say('arturo', Q2.lines.after) : null),
      perico: st => (st === 1 ? async () => {
        HQ.lock(true); await say('perico', Q2.lines.squawk);
        const g = await ask(Q2.tasks.morning, { title: 'Say good morning to Perico', icon: 'bird' });
        if (!g) return;
        saveG(Q2, g); await HQ.wait(0.4); await HQ.demo(P('perico'), Q2.lines.repeat, Q2.tasks.morning); HQ.setStage('hq.parrot', 2); await fadeRefresh('remanso-hB');
      } : null),
    },
    mark: { arturo: st => (st === 0 ? '!' : st === 2 ? '◆' : null), perico: st => (st === 1 ? '◆' : null) } });

  // ---- 3. The pink shell (a lost thing, upstairs) · «¡La encontré!»
  HQ.phrase({ id: 'ph.hq.found', en: 'I found it!', es: '¡La encontré!', pt: 'Achei!', de: 'Gefunden!', zh: '[找到|zhǎo dào] [了|le] ！', ja: '[見|み]つけた ！', note: 'es: «la» for a feminine thing (la concha), «lo» for a masculine one: «¡Lo encontré!». de in full: «Ich hab’s gefunden!».' });
  HQ.keep({ id: 'k.hqShell', en: 'Fede’s pink shell', es: 'concha rosada', pt: 'concha cor-de-rosa', de: 'rosa Muschel', zh: '[粉色|fěn sè] [贝壳|bèi ké]', ja: 'ピンク の [貝殻|かいがら]', g: { es: 'f', pt: 'f', de: 'f' }, icon: 'star' });
  HQ.keep({ id: 'k.hqShell2', en: 'Fede’s second-best shell', es: 'concha', pt: 'concha', de: 'Muschel', zh: '[贝壳|bèi ké]', ja: '[貝殻|かいがら]', g: { es: 'f', pt: 'f', de: 'f' }, icon: 'star' });
  const Q3 = HQ.quest({ id: 'hq.shell', home: 'remanso-L1', done: 3, coins: 7, phrase: 'ph.hq.found', keep: 'k.hqShell2',
    title: () => 'The pink shell', who: () => `${n('rebeca')}, a shell collector in Remanso`,
    steps: [{ until: 2, text: () => 'Find Fede’s pink shell, upstairs', why: 'Fede, Rebeca’s little brother, lost his favorite shell and won’t come down. He hides everything under the bed.', hint: '{mimo} sniffs at the stairs.', at: ['remanso-L1'] },
      { until: 3, text: () => `Give ${n('fede')} his shell: “I found it!”`, why: 'He’s on the floor of his room, upstairs.', hint: '{mimo} bounces toward Fede.', at: ['remanso-L1', 'fede'] }],
    story: () => 'Fede lost his pink shell. You found it under his bed, and he gave you his second-best one.',
    lines: {
      offer: T('Fede is upstairs, crying. He lost his pink shell, his favorite. He won’t come down.', 'Fede está arriba llorando. Perdió su concha rosada, su favorita. No quiere bajar.', 'O Fede tá lá em cima chorando. Ele perdeu a concha cor-de-rosa, a favorita dele. Não quer descer.', 'Fede ist oben und weint. Er hat seine rosa Muschel verloren, seine Lieblingsmuschel. Er will nicht runterkommen.',
        '[费德|Fèi dé] [在|zài] [楼上|lóu shàng] [哭|kū] 。 [他|tā] [把|bǎ] [最|zuì] [喜欢|xǐ huan] [的|de] [粉色|fěn sè] [贝壳|bèi ké] [弄丢|nòng diū] [了|le] 。 [他|tā] [不肯|bù kěn] [下来|xià lái] 。', 'フェデ が [二階|にかい] で [泣|な]いて る の 。 お[気|き]に[入|い]り の ピンク の [貝殻|かいがら] を なくしちゃった 。 [下|お]りて こない の 。'),
      demo: T('On the shore, when we find a good one, we shout: “I found it!” Will you look for it, please?', 'En la orilla, cuando encontramos una buena, gritamos: «¡La encontré!» ¿Se la buscas, porfa?', 'Na beira do lago, quando a gente acha uma boa, a gente grita: «Achei!» Procura pra ele, por favor?', 'Am Ufer, wenn wir eine schöne finden, rufen wir: „Gefunden!“ Suchst du sie für ihn, bitte?',
        '[在|zài] [岸|àn] [边|biān] ， [我们|wǒ men] [找到|zhǎo dào] [好|hǎo] [贝壳|bèi ké] [就|jiù] [大喊|dà hǎn] ： “ [找到|zhǎo dào] [了|le] ！ ” [你|nǐ] [能|néng] [帮|bāng] [他|tā] [找|zhǎo] [找|zhao] [吗|ma] ？', '[岸|きし] で いい [貝殻|かいがら] を [見|み]つけたら 、 「 [見|み]つけた ！ 」 って さけぶ の 。 フェデ の ため に [探|さが]して くれる ？'),
      wait: T('His room is upstairs. He hides everything under the bed. Everything!', 'Su cuarto está arriba. Esconde todo debajo de la cama. ¡Todo!', 'O quarto dele é lá em cima. Ele esconde tudo debaixo da cama. Tudo!', 'Sein Zimmer ist oben. Er versteckt alles unter dem Bett. Alles!',
        '[他|tā] [的|de] [房间|fáng jiān] [在|zài] [楼上|lóu shàng] 。 [他|tā] [什么|shén me] [都|dōu] [藏|cáng] [在|zài] [床|chuáng] [底下|dǐ xia] 。 [什么|shén me] [都|dōu] ！', '[部屋|へや] は [二階|にかい] よ 。 なんでも ベッド の [下|した] に かくす の 。 なんでも ！'),
      happy: T('My shell! My pink shell! Nobody in Remanso finds shells like you!', '¡Mi concha! ¡Mi concha rosada! ¡Nadie en Remanso encuentra conchas como tú!', 'A minha concha! A minha concha cor-de-rosa! Ninguém em Remanso acha conchas como você!', 'Meine Muschel! Meine rosa Muschel! Niemand in Remanso findet Muscheln so gut wie du!',
        '[我|wǒ] [的|de] [贝壳|bèi ké] ！ [我|wǒ] [的|de] [粉色|fěn sè] [贝壳|bèi ké] ！ [静水村|Jìng shuǐ cūn] [没有|méi yǒu] [人|rén] [比|bǐ] [你|nǐ] [更|gèng] [会|huì] [找|zhǎo] [贝壳|bèi ké] ！', 'ぼく の [貝殻|かいがら] ！ ピンク の [貝殻|かいがら] ！ レマンソ で いちばん の [貝殻|かいがら] [探|さが]し だ ね ！'),
      gift: T('Here, take this one. It’s my second best. That’s a lot!', 'Toma, esta es para ti. Es la segunda mejor. ¡Eso es mucho!', 'Toma, essa é pra você. É a segunda melhor. Isso é muito!', 'Hier, die ist für dich. Das ist meine zweitbeste. Das ist viel!',
        '[这|zhè] [个|gè] [给|gěi] [你|nǐ] 。 [是|shì] [我|wǒ] [第二|dì èr] [好|hǎo] [的|de] 。 [很|hěn] [厉害|lì hai] [的|de] ！', 'これ 、 あげる 。 [二番目|にばんめ] に いい [貝殻|かいがら] だ よ 。 すごい ん だ から ！'),
    },
    tasks: { found: { en: 'I found it!', model: { es: '¡La encontré!', pt: 'Achei!', de: 'Gefunden!', zh: '[找到|zhǎo dào] [了|le] ！', ja: '[見|み]つけた ！' },
      ok: { es: ['¡Lo encontré!', '¡La encontré, Fede!', '¡Encontré tu concha!', '¡Aquí está!'], pt: ['Achei a concha!', 'Achei, Fede!', 'Encontrei!', 'Aqui está!'], de: ['Ich hab sie gefunden!', 'Ich habe sie gefunden!', 'Gefunden, Fede!', 'Hier ist sie!'],
        zh: ['[我|wǒ] [找到|zhǎo dào] [了|le] ！', '[找到|zhǎo dào] [啦|la] ！', '[在|zài] [这里|zhè lǐ] ！'], ja: ['あった ！', '[見|み]つけた よ ！', '[見|み]つけました ！'] },
      keys: { es: [['encontre']], pt: [['achei', 'encontrei']], de: [['gefunden']], zh: [['zhaodao']], ja: [['mitsuke', 'atta']] } } },
    talk: {
      rebeca: st => (st === 0 ? async () => { HQ.lock(true); await say('rebeca', Q3.lines.offer); await HQ.demo(P('rebeca'), Q3.lines.demo, Q3.tasks.found); HQ.setStage('hq.shell', 1); }
        : st === 1 ? () => say('rebeca', Q3.lines.wait) : null),
      fede: st => (st === 2 ? async () => {
        HQ.lock(true); await HQ.me('Look what was under your bed…');
        const g = await ask(Q3.tasks.found, { title: `Give ${n('fede')} his shell: “I found it!”`, icon: 'star' });
        if (!g) { await say('fede', COMMON.later); return; }
        HQ.take('k.hqShell'); await say('fede', Q3.lines.happy); await say('fede', Q3.lines.gift); HQ.setStage('hq.shell', 3); HQ.reward(Q3, g); await fadeRefresh('remanso-L1');
      } : null),
    },
    // under the bed, upstairs: a pink shell peeking out
    extras: (st, ctx) => {
      const m = ctx.marks.underbed; if (st !== 1 || ctx.floor !== 1 || !m) return [];
      return [{ x: m.x + 0.3 * Math.sign(m.x || 1), z: m.z + 1.1, r: 1.2, label: 'Look', run: async () => {
        HQ.mimo('!'); Sound.play('chirp'); await HQ.wait(0.4); if (HQ.stage('hq.shell') !== 1) return;
        HQ.think('Under the bed: socks, a ball, a sock with no friend… and a pink shell!', 5);
        HQ.give('k.hqShell'); HQ.setStage('hq.shell', 2); Sound.play('review'); INTERIORS.refresh('remanso-L1', { props: true });
      } }];
    },
    props: (st, ctx) => { const m = ctx.marks.underbed; if (st >= 2 || ctx.floor !== 1 || !m) return [];
      // (by the foot of the bed, where the camera can see it peeking out)
      return [{ x: m.x + 0.3 * Math.sign(m.x || 1), z: m.z + 0.9, rot: 0.6, draw: (k, GEO) => { k.ball(0, 0.04, 0, 0.07, '#f6a6c1', { geo: GEO.ball6, ry2: 0.04, ink: 0.003 }); k.add(GEO.cone6, 0.06, 0.04, 0, 0.03, 0.06, 0.03, '#f6c1d0', { rz: -1.3, ink: 0.002 }); } }]; },
    mark: { rebeca: st => (st === 0 ? '!' : null), fede: st => (st === 2 ? '◆' : null) } });

  // ---- 4. A letter after a year (a delivery between mother and son) · «Lo siento»
  HQ.phrase({ id: 'ph.hq.sorry', en: 'I’m sorry.', es: 'Lo siento.', pt: 'Desculpa.', de: 'Es tut mir leid.', zh: '[对不起|duì bu qǐ] 。', ja: 'ごめんなさい 。', note: 'es «Perdón» for small things (a bump). pt «Sinto muito» when something sad happened. de «Entschuldigung» to get past someone. ja «すみません» to strangers.' });
  HQ.keep({ id: 'k.hqLetter', en: 'Leonor’s letter to her son', es: 'carta', pt: 'carta', de: 'Brief', zh: '[信|xìn]', ja: '[手紙|てがみ]', g: { es: 'f', pt: 'f', de: 'm' }, icon: 'letter' });
  const Q4 = HQ.quest({ id: 'hq.sorry', home: 'remanso-L2', homes: { leonor: 'remanso-L2', pancho: 'remanso-L3' }, done: 3, coins: 9, phrase: 'ph.hq.sorry',
    title: () => 'A letter after a year', who: () => `${n('leonor')}, who writes letters in Remanso`,
    steps: [{ until: 2, text: () => `Take Leonor’s letter to ${n('pancho')}, her son`, why: 'They argued a year ago, about the color of a boat. He paints boats at the edge of the village.', hint: '{mimo} points toward the boat painter’s workshop.', at: ['remanso-L3', 'pancho'] },
      { until: 3, text: () => `Tell ${n('leonor')} what Pancho said`, why: 'She’s at her desk, pretending to write.', hint: '{mimo} hurries back to Leonor’s house.', at: ['remanso-L2', 'leonor'] }],
    story: () => 'Leonor and her son Pancho argued about the color of a boat, and didn’t speak for a year. You took her letter to him and brought back two words: “I’m sorry.”',
    lines: {
      offer: T('My son Pancho and I argued about the color of a boat. A boat! Now we don’t speak.', 'Mi hijo Pancho y yo discutimos por el color de un barco. ¡Un barco! Y ahora no nos hablamos.', 'Eu e o meu filho Pancho brigamos por causa da cor de um barco. Um barco! E agora a gente não se fala.', 'Mein Sohn Pancho und ich haben uns über die Farbe eines Bootes gestritten. Eines Bootes! Jetzt reden wir nicht mehr.',
        '[我|wǒ] [和|hé] [我|wǒ] [儿子|ér zi] [潘乔|Pān qiáo] [为了|wèi le] [一|yī] [条|tiáo] [船|chuán] [的|de] [颜色|yán sè] [吵架|chǎo jià] 。 [一|yī] [条|tiáo] [船|chuán] [啊|a] ！ [现在|xiàn zài] [我们|wǒ men] [都|dōu] [不|bù] [说话|shuō huà] [了|le] 。', '[息子|むすこ] の パンチョ と 、 [船|ふね] の [色|いろ] で けんか した の 。 [船|ふね] よ ！ それ で 、 [今|いま] は [口|くち] も きかない 。'),
      letter: T('I wrote him a letter. The first in a year. Could you take it to him? He paints boats, at the edge of the village.', 'Le escribí una carta. La primera en un año. ¿Se la llevas? Pinta barcos, en la orilla del pueblo.', 'Eu escrevi uma carta pra ele. A primeira em um ano. Você leva pra ele? Ele pinta barcos, na beira do vilarejo.', 'Ich habe ihm einen Brief geschrieben. Den ersten seit einem Jahr. Bringst du ihn hin? Er streicht Boote, am Rand vom Dorf.',
        '[我|wǒ] [给|gěi] [他|tā] [写|xiě] [了|le] [一|yī] [封|fēng] [信|xìn] ， [一|yī] [年|nián] [来|lái] [的|de] [第|dì] [一|yī] [封|fēng] 。 [你|nǐ] [能|néng] [帮|bāng] [我|wǒ] [送|sòng] [去|qù] [吗|ma] ？ [他|tā] [在|zài] [村|cūn] [边|biān] [刷|shuā] [船|chuán] 。', '[手紙|てがみ] を [書|か]いた の 。 [一年|いちねん] ぶり 。 [届|とど]けて くれる ？ [村|むら] の はずれ で 、 [船|ふね] を [塗|ぬ]って いる わ 。'),
      wait: T('Did he read it? … Don’t tell me. Yes, tell me.', '¿La leyó? … No me digas. Sí, dime.', 'Ele leu? … Não me conta. Conta, sim.', 'Hat er ihn gelesen? … Sag nichts. Doch, sag’s mir.',
        '[他|tā] [看|kàn] [了|le] [吗|ma] ？ … [别|bié] [告诉|gào su] [我|wǒ] 。 [不|bù] ， [告诉|gào su] [我|wǒ] 。', '[読|よ]んだ ？ … [言|い]わない で 。 やっぱり [言|い]って 。'),
      read: T('A letter? From my mother? … She says she’s sorry. Then tell her I’m sorry too. Tell her: “I’m sorry.”', '¿Una carta? ¿De mi mamá? … Dice que lo siente. Entonces dile que yo también. Dile: «Lo siento.»', 'Uma carta? Da minha mãe? … Ela pede desculpa. Então diz que eu também. Diz pra ela: «Desculpa.»', 'Ein Brief? Von meiner Mutter? … Es tut ihr leid. Dann sag ihr, mir auch. Sag ihr: „Es tut mir leid.“',
        '[一|yī] [封|fēng] [信|xìn] ？ [我|wǒ] [妈|mā] [写|xiě] [的|de] ？ … [她|tā] [说|shuō] [对不起|duì bu qǐ] 。 [那|nà] [你|nǐ] [告诉|gào su] [她|tā] ， [我|wǒ] [也|yě] [是|shì] 。 [跟|gēn] [她|tā] [说|shuō] ： “ [对不起|duì bu qǐ] 。 ”', '[手紙|てがみ] ？ [母|はは] から ？ … ごめんなさい 、 って 。 じゃあ 、 おれ も だ って [伝|つた]えて 。 「 ごめんなさい 。 」 って 。'),
      blue: T('And tell her the boat can be blue. Half blue.', 'Y dile que el barco puede ser azul. Medio azul.', 'E diz pra ela que o barco pode ser azul. Meio azul.', 'Und sag ihr, das Boot darf blau sein. Halb blau.',
        '[还|hái] [告诉|gào su] [她|tā] ， [船|chuán] [可以|kě yǐ] [是|shì] [蓝色|lán sè] [的|de] 。 [一半|yī bàn] [蓝色|lán sè] 。', 'それ と 、 [船|ふね] は [青|あお] で も いい って 。 [半分|はんぶん] だけ 。'),
      thanks: T('He said that? My Pancho? … Then I’ll wind the clock again. Thank you, from my heart.', '¿Dijo eso? ¿Mi Pancho? … Entonces voy a darle cuerda al reloj otra vez. Gracias, de corazón.', 'Ele disse isso? O meu Pancho? … Então eu vou dar corda no relógio de novo. Obrigada, de coração.', 'Das hat er gesagt? Mein Pancho? … Dann ziehe ich die Uhr wieder auf. Danke, von Herzen.',
        '[他|tā] [这么|zhè me] [说|shuō] [的|de] ？ [我|wǒ] [的|de] [潘乔|Pān qiáo] ？ … [那|nà] [我|wǒ] [就|jiù] [再|zài] [给|gěi] [钟|zhōng] [上|shàng] [发条|fā tiáo] 。 [真心|zhēn xīn] [谢谢|xiè xie] [你|nǐ] 。', 'そう [言|い]った の ？ うち の パンチョ が ？ … じゃあ 、 [時計|とけい] の ねじ を また [巻|ま]く わ 。 [心|こころ] から ありがとう 。'),
    },
    tasks: { sorry: { en: 'I’m sorry.', model: { es: 'Lo siento.', pt: 'Desculpa.', de: 'Es tut mir leid.', zh: '[对不起|duì bu qǐ] 。', ja: 'ごめんなさい 。' },
      ok: { es: ['Lo siento mucho.', 'Dice que lo siente.', 'Él lo siente.', 'Perdón.', 'Perdóname.'], pt: ['Me desculpa.', 'Desculpe.', 'Sinto muito.', 'Ele pede desculpa.'], de: ['Tut mir leid.', 'Es tut ihm leid.', 'Entschuldigung.'],
        zh: ['[他|tā] [说|shuō] [对不起|duì bu qǐ] 。', '[真|zhēn] [对不起|duì bu qǐ] 。'], ja: ['ごめん 。', 'ごめんなさい って 。', 'すみません 。'] },
      keys: { es: [['siento', 'siente', 'perdon', 'perdoname']], pt: [['desculpa', 'desculpe', 'sinto']], de: [['leid', 'entschuldigung']], zh: [['duibuqi']], ja: [['gomen', 'sumimasen']] } } },
    talk: {
      leonor: st => (st === 0 ? async () => { HQ.lock(true); await say('leonor', Q4.lines.offer); await say('leonor', Q4.lines.letter); HQ.give('k.hqLetter'); HQ.setStage('hq.sorry', 1); UI.toast(`✉️ ${HQ.itemName('k.hqLetter')} (in your bag)`); }
        : st === 1 ? () => say('leonor', Q4.lines.wait)
        : st === 2 ? async () => {
          HQ.lock(true); await HQ.me('Pancho read your letter. He said…');
          const g = await ask(Q4.tasks.sorry, { title: `Tell ${n('leonor')} what Pancho said: “I’m sorry.”`, icon: 'letter' });
          if (!g) { await say('leonor', COMMON.later); return; }
          saveG(Q4, g); await say('leonor', Q4.lines.thanks); HQ.setStage('hq.sorry', 3); HQ.reward(Q4, gotG(Q4)); INTERIORS.refresh('remanso-L3'); await fadeRefresh('remanso-L2');
        } : null),
      pancho: st => (st === 1 ? async () => {
        HQ.lock(true); await HQ.me('This is from your mother…'); HQ.take('k.hqLetter');
        await HQ.demo(P('pancho'), Q4.lines.read, Q4.tasks.sorry); await say('pancho', Q4.lines.blue); HQ.setStage('hq.sorry', 2);
      } : null),
    },
    mark: { leonor: st => (st === 0 ? '!' : st === 2 ? '◆' : null), pancho: st => (st === 1 ? '◆' : null) } });
})();
