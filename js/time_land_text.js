'use strict';
// TLTXT: the words of each region's land long ago and tomorrow (TIME.land, time_land.js; DESIGN.md 21.1), and what people say about
// it, in five languages. zh / ja follow CJK.md's notation.
//   TLTXT.WORDS[region] = { past: [...], future: [...] }   LEX items (kind 'word', ids w.tf_<region>_<key>), registered when TIME
//                                                           starts (TLTXT.register) and listed in a «The land» section on the region's
//                                                           own journal page; each is met in a Look or a line
//   TLTXT.LINES[key] = [{ en, es, pt, de, zh, ja }]         a person's «The land» lines (time_land_regions.js says who and when)
//   TLTXT.check() → [] when all's well (every zh / ja string against CJK.validate, every word complete, no word twice in Mimo's memory)
const TLTXT = (() => {
  const L = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const GD = { m: 'm', f: 'f', n: 'n' };
  // W(region key, word key, en, es, pt, de, zh, ja, genders es·pt·de, plurals es·pt·de, articles)
  const W = (rk, k, en, es, pt, de, zh, ja, g, pl, art) => {
    const o = { id: 'w.tf_' + rk + '_' + k, kind: 'word', en, es, pt, de, zh, ja };
    if (g) o.g = { es: GD[g[0]], pt: GD[g[1]], de: GD[g[2]] };
    if (pl) o.pl = { es: pl[0], pt: pl[1], de: pl[2] };
    if (art) o.art = art;
    return o;
  };
  const WORDS = {};
  const LINES = {};

  // ================================================================ Molinar
  // long ago: the woods came up to the town walls, round small fields with hedges · tomorrow: a dust bowl
  WORDS.molinar = {
    past: [
      W('ml', 'oak', 'oak', 'roble', 'carvalho', 'Eiche', '[橡树|xiàng shù]', '[樫|かし]', 'mmf', ['robles', 'carvalhos', 'Eichen']),
      W('ml', 'chestnut', 'chestnut tree', 'castaño', 'castanheiro', 'Kastanienbaum', '[栗子树|lì zi shù]', '[栗|くり]', 'mmm', ['castaños', 'castanheiros', 'Kastanienbäume']),
      W('ml', 'acorn', 'acorn', 'bellota', 'bolota', 'Eichel', '[橡子|xiàng zǐ]', 'どんぐり', 'fff', ['bellotas', 'bolotas', 'Eicheln']),
      W('ml', 'woodpecker', 'woodpecker', 'pájaro carpintero', 'pica-pau', 'Specht', '[啄木鸟|zhuó mù niǎo]', 'キツツキ', 'mmm', ['pájaros carpinteros', 'pica-paus', 'Spechte']),
      W('ml', 'boar', 'wild boar', 'jabalí', 'javali', 'Wildschwein', '[野猪|yě zhū]', 'イノシシ', 'mmn', ['jabalíes', 'javalis', 'Wildschweine']),
      W('ml', 'squirrel', 'squirrel', 'ardilla', 'esquilo', 'Eichhörnchen', '[松鼠|sōng shǔ]', 'リス', 'fmn', ['ardillas', 'esquilos', 'Eichhörnchen']),
      W('ml', 'branch', 'branch', 'rama', 'galho', 'Ast', '[树枝|shù zhī]', '[枝|えだ]', 'fmm', ['ramas', 'galhos', 'Äste']),
      W('ml', 'bark', 'bark', 'corteza', 'casca', 'Rinde', '[树皮|shù pí]', '[樹皮|じゅひ]', 'fff'),
      W('ml', 'root', 'root', 'raíz', 'raiz', 'Wurzel', '[树根|shù gēn]', '[根|ね]', 'fff', ['raíces', 'raízes', 'Wurzeln']),
      W('ml', 'grove', 'grove', 'arboleda', 'arvoredo', 'Hain', '[树林|shù lín]', '[林|はやし]', 'fmm'),
      W('ml', 'axe', 'axe', 'hacha', 'machado', 'Axt', '[斧头|fǔ tou]', '[斧|おの]', 'fmf', ['hachas', 'machados', 'Äxte'], { es: 'el' }),
      W('ml', 'woodcutter', 'woodcutter', 'leñador', 'lenhador', 'Holzfäller', '[樵夫|qiáo fū]', 'きこり', 'mmm', ['leñadores', 'lenhadores', 'Holzfäller']),
    ],
    future: [
      W('ml', 'drought', 'drought', 'sequía', 'seca', 'Dürre', '[干旱|gān hàn]', '[日照|ひで]り', 'fff'),
      W('ml', 'duststorm', 'dust storm', 'polvareda', 'nuvem de poeira', 'Staubsturm', '[沙尘暴|shā chén bào]', '[砂嵐|すなあらし]', 'ffm'),
      W('ml', 'furrow', 'furrow', 'surco', 'sulco', 'Furche', '[犁沟|lí gōu]', '[畝|うね]', 'mmf', ['surcos', 'sulcos', 'Furchen']),
      W('ml', 'clod', 'clod', 'terrón', 'torrão', 'Erdklumpen', '[土块|tǔ kuài]', '[土塊|つちくれ]', 'mmm', ['terrones', 'torrões', 'Erdklumpen']),
      W('ml', 'stump', 'stump', 'tocón', 'toco', 'Baumstumpf', '[树桩|shù zhuāng]', '[切|き]り[株|かぶ]', 'mmm', ['tocones', 'tocos', 'Baumstümpfe']),
      W('ml', 'stubble', 'stubble', 'rastrojo', 'restolho', 'Stoppelfeld', '[麦茬|mài chá]', '[刈|か]り[株|かぶ]', 'mmn'),
      W('ml', 'windbreak', 'windbreak', 'cortavientos', 'quebra-vento', 'Windschutz', '[防风林|fáng fēng lín]', '[防風林|ぼうふうりん]', 'mmm'),
      W('ml', 'tumbleweed', 'tumbleweed', 'planta rodadora', 'cardo-russo', 'Steppenläufer', '[风滚草|fēng gǔn cǎo]', 'タンブルウィード', 'fmm', ['plantas rodadoras', 'cardos-russos', 'Steppenläufer']),
      W('ml', 'rain', 'rain', 'lluvia', 'chuva', 'Regen', '[雨|yǔ]', '[雨|あめ]', 'ffm'),
      W('ml', 'ear', 'ear of wheat', 'espiga', 'espiga', 'Ähre', '[麦穗|mài suì]', '[穂|ほ]', 'fff', ['espigas', 'espigas', 'Ähren']),
      W('ml', 'hoe', 'hoe', 'azada', 'enxada', 'Hacke', '[锄头|chú tou]', '[鍬|くわ]', 'fff'),
      W('ml', 'ditch', 'irrigation ditch', 'acequia', 'canal de rega', 'Bewässerungsgraben', '[水渠|shuǐ qú]', '[用水路|ようすいろ]', 'fmm'),
    ],
  };
  // long ago: the people of then tell what they did (the preterite, I and you: Molinar's step), and ask you
  LINES['molinar.past.fina'] = [
    L('Yesterday I went to the {w.tf_ml_grove} for {w.ml_firewood}, and I saw a {w.tf_ml_squirrel} with an {w.tf_ml_acorn}! Did you see the {w.tf_ml_oak:pl} past the gate?',
      '¡Ayer fui a la arboleda por leña y vi una ardilla con una bellota! ¿Viste los robles detrás de la puerta?',
      'Ontem eu fui ao arvoredo buscar lenha e vi um esquilo com uma bolota! Você viu os carvalhos depois do portão?',
      'Gestern bin ich in den Hain gegangen, um Brennholz zu holen, und ich habe ein Eichhörnchen mit einer Eichel gesehen! Hast du die Eichen hinter dem Tor gesehen?',
      '[昨天|zuó tiān] [我|wǒ] [去|qù] [树林|shù lín] [捡|jiǎn] [柴火|chái huo] ， [看见|kàn jiàn] [了|le] [一|yī] [只|zhī] [松鼠|sōng shǔ] [拿着|ná zhe] [橡子|xiàng zǐ] ！ [你|nǐ] [看见|kàn jiàn] [门|mén] [外|wài] [的|de] [橡树|xiàng shù] [了|le] [吗|ma] ？',
      '[昨日|きのう] 、 [林|はやし] へ [薪|まき] を [取|と]り に [行|い]きました 。 どんぐり を [持|も]った リス を [見|み]ました よ ！ [門|もん] の [外|そと] の [樫|かし] を [見|み]ました か ？'),
    L('Last year I planted two {w.tf_ml_chestnut:pl} by the west gate. Did you ever touch an old tree’s {w.tf_ml_bark}? It’s full of {w.ml_moss}.',
      'El año pasado planté dos castaños junto a la puerta oeste. ¿Tocaste alguna vez la corteza de un árbol viejo? Está llena de musgo.',
      'No ano passado eu plantei dois castanheiros perto do portão oeste. Você já tocou a casca de uma árvore velha? Está cheia de musgo.',
      'Letztes Jahr habe ich zwei Kastanienbäume am Westtor gepflanzt. Hast du schon mal die Rinde eines alten Baumes angefasst? Sie ist voller Moos.',
      '[去年|qù nián] [我|wǒ] [在|zài] [西门|xī mén] [旁边|páng biān] [种|zhòng] [了|le] [两|liǎng] [棵|kē] [栗子树|lì zi shù] 。 [你|nǐ] [摸过|mō guo] [老|lǎo] [树|shù] [的|de] [树皮|shù pí] [吗|ma] ？ [上面|shàng miàn] [都|dōu] [是|shì] [苔藓|tái xiǎn] 。',
      '[去年|きょねん] 、 [西|にし] の [門|もん] の そば に [栗|くり] を [二本|にほん] [植|う]えました 。 [古|ふる]い [木|き] の [樹皮|じゅひ] に [触|さわ]った こと が あります か ？ [苔|こけ] で いっぱい です よ 。'),
  ];
  LINES['molinar.past.master'] = [
    L('Last night I carved a clock case out of {w.tf_ml_oak} wood. Did you see the {w.tf_ml_root:pl} of the old one by the north gate? As thick as my arm!',
      'Anoche tallé una caja de reloj de madera de roble. ¿Viste las raíces del roble viejo junto a la puerta norte? ¡Gruesas como mi brazo!',
      'Ontem à noite eu entalhei uma caixa de relógio em madeira de carvalho. Você viu as raízes do carvalho velho perto do portão norte? Grossas como o meu braço!',
      'Gestern Abend habe ich ein Uhrgehäuse aus Eichenholz geschnitzt. Hast du die Wurzeln der alten Eiche am Nordtor gesehen? So dick wie mein Arm!',
      '[昨天|zuó tiān] [晚上|wǎn shang] [我|wǒ] [用|yòng] [橡树|xiàng shù] [木头|mù tou] [刻|kè] [了|le] [一个|yī gè] [钟|zhōng] [壳|ké] 。 [你|nǐ] [看见|kàn jiàn] [北门|běi mén] [旁边|páng biān] [那|nà] [棵|kē] [老|lǎo] [橡树|xiàng shù] [的|de] [树根|shù gēn] [了|le] [吗|ma] ？ [跟|gēn] [我|wǒ] [的|de] [胳膊|gē bo] [一样|yī yàng] [粗|cū] ！',
      '[昨夜|ゆうべ] 、 [樫|かし] の [木|き] で [時計|とけい] の [箱|はこ] を [彫|ほ]りました 。 [北|きた] の [門|もん] の そば の [古|ふる]い [樫|かし] の [根|ね] を [見|み]ました か ？ わたし の [腕|うで] ぐらい [太|ふと]い です よ ！'),
  ];
  // tomorrow: what will be (the simple future in every person: Molinar's step), and what they fear
  LINES['molinar.future.trigo'] = [
    L('Without {w.tf_ml_rain} there will be no harvest. But next week we’ll sow again, you’ll see.',
      'Sin lluvia no habrá cosecha. Pero la semana que viene sembraremos otra vez, ya verás.',
      'Sem chuva não haverá colheita. Mas na semana que vem nós semearemos de novo, você verá.',
      'Ohne Regen wird es keine Ernte geben. Aber nächste Woche werden wir wieder säen, du wirst sehen.',
      '[没有|méi yǒu] [雨|yǔ] ， [就|jiù] [不会|bù huì] [有|yǒu] [收成|shōu cheng] 。 [可是|kě shì] [下|xià] [个|gè] [星期|xīng qī] [我们|wǒ men] [会|huì] [再|zài] [播种|bō zhǒng] ， [你|nǐ] [会|huì] [看到|kàn dào] [的|de] 。',
      '[雨|あめ] が [降|ふ]らなければ 、 [収穫|しゅうかく] は ない でしょう 。 でも [来週|らいしゅう] 、 また [種|たね] を まく つもり です 。 [見|み]て いて ください 。'),
    L('If nobody digs the {w.tf_ml_ditch} again, the wind will take the soil. Next week we’ll plant a new {w.tf_ml_windbreak}.',
      'Si nadie cava la acequia otra vez, el viento se llevará la tierra. La semana que viene plantaremos un cortavientos nuevo.',
      'Se ninguém cavar o canal de rega de novo, o vento levará a terra. Na semana que vem nós plantaremos um quebra-vento novo.',
      'Wenn niemand den Bewässerungsgraben wieder gräbt, wird der Wind die Erde wegtragen. Nächste Woche werden wir einen neuen Windschutz pflanzen.',
      '[要是|yào shi] [没有|méi yǒu] [人|rén] [再|zài] [挖|wā] [水渠|shuǐ qú] ， [风|fēng] [会|huì] [把|bǎ] [土|tǔ] [吹走|chuī zǒu] 。 [下|xià] [个|gè] [星期|xīng qī] [我们|wǒ men] [会|huì] [种|zhòng] [新|xīn] [的|de] [防风林|fáng fēng lín] 。',
      'だれ も [用水路|ようすいろ] を [掘|ほ]らなければ 、 [風|かぜ] が [土|つち] を [運|はこ]んで しまう でしょう 。 [来週|らいしゅう] 、 [新|あたら]しい [防風林|ぼうふうりん] を [植|う]える つもり です 。'),
  ];
  LINES['molinar.future.felix'] = [
    L('Tomorrow I’ll carry water to the {w.tf_ml_furrow:pl}. Will you bring the seeds? After the {w.tf_ml_duststorm}, everything will have to be sown again.',
      'Mañana llevaré agua a los surcos. ¿Tú traerás las semillas? Después de la polvareda, habrá que sembrarlo todo otra vez.',
      'Amanhã eu levarei água para os sulcos. Você trará as sementes? Depois da nuvem de poeira, será preciso semear tudo de novo.',
      'Morgen werde ich Wasser zu den Furchen bringen. Wirst du die Samen mitbringen? Nach dem Staubsturm werden wir alles neu säen müssen.',
      '[明天|míng tiān] [我|wǒ] [会|huì] [把|bǎ] [水|shuǐ] [送到|sòng dào] [犁沟|lí gōu] [里|lǐ] 。 [你|nǐ] [会|huì] [带|dài] [种子|zhǒng zi] [来|lái] [吗|ma] ？ [沙尘暴|shā chén bào] [以后|yǐ hòu] ， [一切|yī qiè] [都|dōu] [得|děi] [重新|chóng xīn] [种|zhòng] 。',
      '[明日|あした] 、 [畝|うね] に [水|みず] を [運|はこ]ぶ つもり です 。 あなた は [種|たね] を [持|も]って [来|く]る でしょう ？ [砂嵐|すなあらし] の あと は 、 [全部|ぜんぶ] まき [直|なお]さなければ なりません 。'),
  ];

  // ================================================================ the Bloom Gardens
  // long ago: wilder at the edges, and the brook that's dry today runs round the valley · tomorrow: a thorny desert, dunes
  WORDS.gardens = {
    past: [
      W('gd', 'willow', 'willow', 'sauce', 'salgueiro', 'Weide', '[柳树|liǔ shù]', '[柳|やなぎ]', 'mmf', ['sauces', 'salgueiros', 'Weiden']),
      W('gd', 'dragonfly', 'dragonfly', 'libélula', 'libélula', 'Libelle', '[蜻蜓|qīng tíng]', 'トンボ', 'fff', ['libélulas', 'libélulas', 'Libellen']),
      W('gd', 'meadow', 'meadow', 'pradera', 'prado', 'Wiese', '[草地|cǎo dì]', '[草原|そうげん]', 'fmf'),
      W('gd', 'brook', 'brook', 'riachuelo', 'riacho', 'Bach', '[小溪|xiǎo xī]', '[小川|おがわ]', 'mmm'),
      W('gd', 'clover', 'clover', 'trébol', 'trevo', 'Klee', '[三叶草|sān yè cǎo]', 'クローバー', 'mmm'),
      W('gd', 'poppy', 'poppy', 'amapola', 'papoula', 'Mohn', '[虞美人|yú měi rén]', 'ケシ', 'ffm', ['amapolas', 'papoulas', 'Mohnblumen']),
      W('gd', 'kingfisher', 'kingfisher', 'martín pescador', 'martim-pescador', 'Eisvogel', '[翠鸟|cuì niǎo]', 'カワセミ', 'mmm'),
      W('gd', 'current', 'current', 'corriente', 'correnteza', 'Strömung', '[水流|shuǐ liú]', '[流|なが]れ', 'fff'),
      W('gd', 'steppingstone', 'stepping stone', 'pasadera', 'pedra de passagem', 'Trittstein', '[踏脚石|tà jiǎo shí]', '[飛|と]び[石|いし]', 'ffm', ['pasaderas', 'pedras de passagem', 'Trittsteine']),
      W('gd', 'bumblebee', 'bumblebee', 'abejorro', 'mamangava', 'Hummel', '[熊蜂|xióng fēng]', 'マルハナバチ', 'mff', ['abejorros', 'mamangavas', 'Hummeln']),
      W('gd', 'dandelion', 'dandelion', 'diente de león', 'dente-de-leão', 'Löwenzahn', '[蒲公英|pú gōng yīng]', 'タンポポ', 'mmm', ['dientes de león', 'dentes-de-leão', 'Löwenzahn']),
      W('gd', 'grasshopper', 'grasshopper', 'saltamontes', 'gafanhoto', 'Heuschrecke', '[蚱蜢|zhà měng]', 'バッタ', 'mmf', ['saltamontes', 'gafanhotos', 'Heuschrecken']),
    ],
    future: [
      W('gd', 'dune', 'dune', 'duna', 'duna', 'Düne', '[沙丘|shā qiū]', '[砂丘|さきゅう]', 'fff', ['dunas', 'dunas', 'Dünen']),
      W('gd', 'desert', 'desert', 'desierto', 'deserto', 'Wüste', '[沙漠|shā mò]', '[砂漠|さばく]', 'mmf'),
      W('gd', 'mirage', 'mirage', 'espejismo', 'miragem', 'Fata Morgana', '[海市蜃楼|hǎi shì shèn lóu]', '[蜃気楼|しんきろう]', 'mff'),
      W('gd', 'cactus', 'cactus', 'cactus', 'cacto', 'Kaktus', '[仙人掌|xiān rén zhǎng]', 'サボテン', 'mmm', ['cactus', 'cactos', 'Kakteen']),
      W('gd', 'scrub', 'scrub', 'matorral', 'mato', 'Gestrüpp', '[灌木丛|guàn mù cóng]', '[茂|しげ]み', 'mmn'),
      W('gd', 'lizard', 'lizard', 'lagartija', 'lagartixa', 'Eidechse', '[蜥蜴|xī yì]', 'トカゲ', 'fff', ['lagartijas', 'lagartixas', 'Eidechsen']),
      W('gd', 'scorpion', 'scorpion', 'escorpión', 'escorpião', 'Skorpion', '[蝎子|xiē zi]', 'サソリ', 'mmm', ['escorpiones', 'escorpiões', 'Skorpione']),
      W('gd', 'thirst', 'thirst', 'sed', 'sede', 'Durst', '[口渴|kǒu kě]', '[喉|のど]の[渇|かわ]き', 'ffm'),
      W('gd', 'riverbed', 'riverbed', 'cauce', 'leito', 'Flussbett', '[河床|hé chuáng]', '[川床|かわどこ]', 'mmn'),
      W('gd', 'oasis', 'oasis', 'oasis', 'oásis', 'Oase', '[绿洲|lǜ zhōu]', 'オアシス', 'mmf'),
      W('gd', 'canteen', 'water bottle', 'cantimplora', 'cantil', 'Feldflasche', '[水壶|shuǐ hú]', '[水筒|すいとう]', 'fmf'),
      W('gd', 'sandstorm', 'sandstorm', 'tormenta de arena', 'tempestade de areia', 'Sandsturm', '[沙暴|shā bào]', '[砂嵐|すなあらし]', 'ffm'),
    ],
  };
  // long ago: how the land was (the imperfect for descriptions: the gardens' step)
  LINES['gardens.past.keeper'] = [
    L('When I was a girl, the {w.tf_gd_meadow} was full of {w.tf_gd_poppy:pl}, and there were {w.tf_gd_dragonfly:pl} over the {w.tf_gd_brook}.',
      'Cuando yo era niña, la pradera estaba llena de amapolas y había libélulas sobre el riachuelo.',
      'Quando eu era menina, o prado era cheio de papoulas e havia libélulas sobre o riacho.',
      'Als ich ein Mädchen war, war die Wiese voller Mohn, und über dem Bach gab es Libellen.',
      '[我|wǒ] [小|xiǎo] [的|de] [时候|shí hou] ， [草地|cǎo dì] [上|shàng] [满是|mǎn shì] [虞美人|yú měi rén] ， [小溪|xiǎo xī] [上|shàng] [有|yǒu] [很多|hěn duō] [蜻蜓|qīng tíng] 。',
      'わたし が [子|こ]ども の とき 、 [草原|そうげん] は ケシ で いっぱい でした 。 [小川|おがわ] の [上|うえ] に は トンボ が いました 。'),
  ];
  LINES['gardens.past.painter'] = [
    L('This morning the {w.tf_gd_brook} was so clear you could see every {w.tf_gd_steppingstone}. There was a {w.tf_gd_kingfisher} in the {w.tf_gd_willow}.',
      'Esta mañana el riachuelo estaba tan claro que se veía cada pasadera. Había un martín pescador en el sauce.',
      'Hoje de manhã o riacho estava tão limpo que dava para ver cada pedra de passagem. Havia um martim-pescador no salgueiro.',
      'Heute Morgen war der Bach so klar, dass man jeden Trittstein sah. In der Weide gab es einen Eisvogel.',
      '[今天|jīn tiān] [早上|zǎo shang] [小溪|xiǎo xī] [很|hěn] [清|qīng] ， [每|měi] [块|kuài] [踏脚石|tà jiǎo shí] [都|dōu] [看得见|kàn de jiàn] 。 [柳树|liǔ shù] [上|shàng] [有|yǒu] [一|yī] [只|zhī] [翠鸟|cuì niǎo] 。',
      '[今朝|けさ] 、 [小川|おがわ] は とても きれい で 、 [飛|と]び[石|いし] が [全部|ぜんぶ] [見|み]えました 。 [柳|やなぎ] に カワセミ が いました 。'),
    L('The {w.tf_gd_current} was slow and cool, and the bank was full of {w.tf_gd_dandelion:pl} and {w.tf_gd_clover}.',
      'La corriente era lenta y fresca, y la orilla estaba llena de dientes de león y trébol.',
      'A correnteza era lenta e fresca, e a margem estava cheia de dentes-de-leão e trevo.',
      'Die Strömung war langsam und kühl, und das Ufer war voller Löwenzahn und Klee.',
      '[水流|shuǐ liú] [很|hěn] [慢|màn] ， [很|hěn] [凉|liáng] ， [岸边|àn biān] [满是|mǎn shì] [蒲公英|pú gōng yīng] [和|hé] [三叶草|sān yè cǎo] 。',
      '[流|なが]れ は ゆっくり で 、 [涼|すず]しかった です 。 [岸|きし] は タンポポ と クローバー で いっぱい でした 。'),
  ];
  // tomorrow: wishes and polite asking (the conditional: the gardens' step)
  LINES['gardens.future.flora'] = [
    L('I’d love to hear the {w.tf_gd_brook} again. Here there was water… now there’s only {w.tf_gd_desert}. Could you help me find some?',
      'Me encantaría oír el riachuelo otra vez. Aquí había agua… ahora solo hay desierto. ¿Podrías ayudarme a buscarla?',
      'Eu adoraria ouvir o riacho de novo. Aqui havia água… agora só há deserto. Você poderia me ajudar a procurar?',
      'Ich würde so gern den Bach wieder hören. Hier gab es Wasser … jetzt gibt es nur Wüste. Könntest du mir helfen, welches zu finden?',
      '[我|wǒ] [很|hěn] [希望|xī wàng] [能|néng] [再|zài] [听到|tīng dào] [小溪|xiǎo xī] [的|de] [声音|shēng yīn] 。 [这里|zhè lǐ] [以前|yǐ qián] [有|yǒu] [水|shuǐ] … [现在|xiàn zài] [只有|zhǐ yǒu] [沙漠|shā mò] 。 [你|nǐ] [能不能|néng bu néng] [帮|bāng] [我|wǒ] [找|zhǎo] [水|shuǐ] ？',
      'また [小川|おがわ] の [音|おと] が [聞|き]きたい です 。 ここ に は [水|みず] が ありました … [今|いま] は [砂漠|さばく] だけ です 。 [探|さが]す の を [手伝|てつだ]って いただけます か ？'),
    L('I’d like a little shade, nothing more. Could a {w.gd_palm} ever grow in this {w.tf_gd_dune}? I’d love that.',
      'Querría un poco de sombra, nada más. ¿Podría crecer una palmera en esta duna? Me encantaría.',
      'Eu queria um pouco de sombra, nada mais. Uma palmeira poderia crescer nesta duna? Eu adoraria.',
      'Ich hätte gern ein bisschen Schatten, mehr nicht. Könnte auf dieser Düne je eine Palme wachsen? Das würde ich so gern sehen.',
      '[我|wǒ] [想|xiǎng] [要|yào] [一点|yī diǎn] [树荫|shù yīn] ， [就|jiù] [这样|zhè yàng] 。 [这个|zhè ge] [沙丘|shā qiū] [上|shàng] [能不能|néng bu néng] [长出|zhǎng chū] [椰子树|yē zi shù] ？ [我|wǒ] [希望|xī wàng] [能|néng] 。',
      '[少|すこ]し [日陰|ひかげ] が ほしい です 。 それ だけ です 。 この [砂丘|さきゅう] に ヤシ が [育|そだ]つ と いい です ね 。'),
  ];
  LINES['gardens.future.melisa'] = [
    L('I’d like to plant something that can stand the heat. Could you bring me your {w.tf_gd_canteen}? The bees would come back, I’m sure.',
      'Me gustaría plantar algo que aguante el calor. ¿Podrías traerme tu cantimplora? Las abejas volverían, estoy segura.',
      'Eu gostaria de plantar algo que aguente o calor. Você poderia me trazer o seu cantil? As abelhas voltariam, tenho certeza.',
      'Ich würde gern etwas pflanzen, das die Hitze aushält. Könntest du mir deine Feldflasche bringen? Die Bienen würden zurückkommen, da bin ich sicher.',
      '[我|wǒ] [想|xiǎng] [种|zhòng] [一些|yī xiē] [耐热|nài rè] [的|de] [植物|zhí wù] 。 [你|nǐ] [能|néng] [把|bǎ] [你|nǐ] [的|de] [水壶|shuǐ hú] [给|gěi] [我|wǒ] [吗|ma] ？ [蜜蜂|mì fēng] [一定|yī dìng] [会|huì] [回来|huí lái] [的|de] 。',
      '[暑|あつ]さ に [強|つよ]い [花|はな] を [植|う]えたい です 。 [水筒|すいとう] を [持|も]って きて いただけます か ？ ミツバチ は きっと [戻|もど]って [来|く]る でしょう 。'),
  ];

  // ================================================================ the Mirror Lake
  // long ago: that winter's hard frost, bare trees, thin ice on the shallows · tomorrow: the lake shrinking, a crust of salt
  WORDS.lake = {
    past: [
      W('lk', 'freeze', 'frost (a freeze)', 'helada', 'geada forte', 'Frost', '[严寒|yán hán]', '[凍|い]てつく [寒|さむ]さ', 'ffm'),
      W('lk', 'floe', 'ice floe', 'témpano', 'bloco de gelo', 'Eisscholle', '[浮冰|fú bīng]', '[流氷|りゅうひょう]', 'mmf', ['témpanos', 'blocos de gelo', 'Eisschollen']),
      W('lk', 'thinice', 'thin ice', 'hielo fino', 'gelo fino', 'dünnes Eis', '[薄冰|báo bīng]', '[薄|うす]い [氷|こおり]', 'mmn'),
      W('lk', 'alder', 'alder', 'aliso', 'amieiro', 'Erle', '[桤木|qī mù]', 'ハンノキ', 'mmf', ['alisos', 'amieiros', 'Erlen']),
      W('lk', 'birch', 'birch', 'abedul', 'bétula', 'Birke', '[桦树|huà shù]', '[白樺|しらかば]', 'mff', ['abedules', 'bétulas', 'Birken']),
      W('lk', 'twig', 'twig', 'ramita', 'graveto', 'Zweig', '[细枝|xì zhī]', '[小枝|こえだ]', 'fmm', ['ramitas', 'gravetos', 'Zweige']),
      W('lk', 'swan', 'swan', 'cisne', 'cisne', 'Schwan', '[天鹅|tiān é]', 'ハクチョウ', 'mmm', ['cisnes', 'cisnes', 'Schwäne']),
      W('lk', 'breath', 'breath (you can see)', 'vaho', 'bafo', 'Atemwolke', '[哈气|hā qì]', '[白|しろ]い [息|いき]', 'mmf'),
      W('lk', 'berry', 'berry', 'baya', 'baga', 'Beere', '[浆果|jiāng guǒ]', '[木|き] の [実|み]', 'fff', ['bayas', 'bagas', 'Beeren']),
      W('lk', 'skate', 'to skate', 'patinar', 'patinar', 'Schlittschuh laufen', '[滑冰|huá bīng]', 'スケートする'),
      W('lk', 'crystal', 'ice crystal', 'cristal de hielo', 'cristal de gelo', 'Eiskristall', '[冰晶|bīng jīng]', '[氷|こおり] の [結晶|けっしょう]', 'mmm', ['cristales de hielo', 'cristais de gelo', 'Eiskristalle']),
      W('lk', 'robin', 'robin', 'petirrojo', 'pisco-de-peito-ruivo', 'Rotkehlchen', '[知更鸟|zhī gēng niǎo]', 'コマドリ', 'mmn', ['petirrojos', 'piscos-de-peito-ruivo', 'Rotkehlchen']),
    ],
    future: [
      W('lk', 'waterlevel', 'water level', 'nivel del agua', 'nível da água', 'Wasserstand', '[水位|shuǐ wèi]', '[水位|すいい]', 'mmm'),
      W('lk', 'evaporate', 'to evaporate', 'evaporarse', 'evaporar', 'verdunsten', '[蒸发|zhēng fā]', '[蒸発|じょうはつ]する'),
      W('lk', 'aground', 'stranded (a boat)', 'encallado', 'encalhado', 'gestrandet', '[搁浅|gē qiǎn]', '[座礁|ざしょう]した'),
      W('lk', 'saltcrust', 'salt crust', 'costra de sal', 'crosta de sal', 'Salzkruste', '[盐壳|yán ké]', '[塩|しお] の [層|そう]', 'fff'),
      W('lk', 'pile', 'pier post', 'pilote', 'estaca', 'Pfahl', '[桩子|zhuāng zi]', '[杭|くい]', 'mfm', ['pilotes', 'estacas', 'Pfähle']),
      W('lk', 'keel', 'keel', 'quilla', 'quilha', 'Kiel', '[龙骨|lóng gǔ]', '[竜骨|りゅうこつ]', 'ffm'),
      W('lk', 'recede', 'to recede', 'retroceder', 'recuar', 'zurückweichen', '[退|tuì]', '[引|ひ]く'),
      W('lk', 'silt', 'silt', 'cieno', 'lodo', 'Schlick', '[淤泥|yū ní]', 'ヘドロ', 'mmm'),
      W('lk', 'mark', 'mark (a line)', 'marca', 'marca', 'Markierung', '[记号|jì hao]', '[印|しるし]', 'fff', ['marcas', 'marcas', 'Markierungen']),
      W('lk', 'dryup', 'to dry up', 'secarse', 'secar', 'austrocknen', '[干涸|gān hé]', '[干上|ひあ]がる'),
      W('lk', 'turtle', 'turtle', 'tortuga', 'tartaruga', 'Schildkröte', '[乌龟|wū guī]', 'カメ', 'fff', ['tortugas', 'tartarugas', 'Schildkröten']),
      W('lk', 'cane', 'reed bed', 'carrizo', 'caniço', 'Röhricht', '[芦苇丛|lú wěi cóng]', '[葦原|あしはら]', 'mmn'),
    ],
  };
  // long ago: what they did that frosty morning (irregular preterites: the lake's step)
  LINES['lake.past.mender'] = [
    L('Last night there was a terrible {w.tf_lk_freeze}. This morning I went to the shore and I couldn’t break the {w.tf_lk_thinice} with my foot.',
      'Anoche hizo una helada tremenda. Esta mañana fui a la orilla y no pude romper el hielo fino con el pie.',
      'Ontem à noite fez uma geada forte. Hoje de manhã eu fui à margem e não pude quebrar o gelo fino com o pé.',
      'Letzte Nacht war ein schrecklicher Frost. Heute Morgen bin ich ans Ufer gegangen und konnte das dünne Eis mit dem Fuß nicht brechen.',
      '[昨天|zuó tiān] [晚上|wǎn shang] [特别|tè bié] [冷|lěng] 。 [今天|jīn tiān] [早上|zǎo shang] [我|wǒ] [去|qù] [了|le] [岸边|àn biān] ， [用|yòng] [脚|jiǎo] [踩|cǎi] [不|bù] [破|pò] [薄冰|báo bīng] 。',
      '[昨夜|ゆうべ] は [凍|い]てつく [寒|さむ]さ でした 。 [今朝|けさ] [岸|きし] に [行|い]きました が 、 [足|あし] で [薄|うす]い [氷|こおり] を [割|わ]れません でした 。'),
  ];
  LINES['lake.past.pepe'] = [
    L('Yesterday I came to the pier and I saw two {w.tf_lk_swan:pl}! I had to hide behind the {w.tf_lk_alder} so they wouldn’t fly off.',
      '¡Ayer vine al muelle y vi dos cisnes! Tuve que esconderme detrás del aliso para que no se fueran volando.',
      'Ontem eu vim ao cais e vi dois cisnes! Tive que me esconder atrás do amieiro para eles não voarem.',
      'Gestern bin ich zum Steg gekommen und habe zwei Schwäne gesehen! Ich musste mich hinter der Erle verstecken, damit sie nicht wegfliegen.',
      '[昨天|zuó tiān] [我|wǒ] [来|lái] [到|dào] [码头|mǎ tóu] ， [看见|kàn jiàn] [了|le] [两|liǎng] [只|zhī] [天鹅|tiān é] ！ [我|wǒ] [只好|zhǐ hǎo] [躲|duǒ] [在|zài] [桤木|qī mù] [后面|hòu miàn] ， [不|bù] [让|ràng] [它们|tā men] [飞|fēi] [走|zǒu] 。',
      '[昨日|きのう] [桟橋|さんばし] に [来|き]て 、 ハクチョウ を [二羽|にわ] [見|み]ました ！ [飛|と]んで [行|い]かない よう に 、 ハンノキ の [後|うし]ろ に [隠|かく]れました 。'),
  ];
  // tomorrow: what will be (irregular futures: the lake's step), and what they fear
  LINES['lake.future.lalo'] = [
    L('If the {w.tf_lk_waterlevel} keeps going down, the ferry won’t be able to go out. Tomorrow I’ll make a new {w.tf_lk_mark} on the {w.tf_lk_pile}.',
      'Si el nivel del agua sigue bajando, el ferry no podrá salir. Mañana haré una marca nueva en el pilote.',
      'Se o nível da água continuar baixando, a balsa não poderá sair. Amanhã eu farei uma marca nova na estaca.',
      'Wenn der Wasserstand weiter sinkt, wird die Fähre nicht hinausfahren können. Morgen werde ich eine neue Markierung an den Pfahl machen.',
      '[要是|yào shi] [水位|shuǐ wèi] [一直|yī zhí] [下降|xià jiàng] ， [渡船|dù chuán] [就|jiù] [不能|bù néng] [出发|chū fā] [了|le] 。 [明天|míng tiān] [我|wǒ] [会|huì] [在|zài] [桩子|zhuāng zi] [上|shàng] [做|zuò] [一个|yī gè] [新|xīn] [记号|jì hao] 。',
      '[水位|すいい] が [下|さ]がり[続|つづ]けたら 、 フェリー は [出|で]られない でしょう 。 [明日|あした] 、 [杭|くい] に [新|あたら]しい [印|しるし] を つける つもり です 。'),
  ];
  LINES['lake.future.bartolo'] = [
    L('The water will come back, you’ll see. That day we’ll all go out and pull the boats that are {w.tf_lk_aground} off the {w.tf_lk_silt}.',
      'El agua volverá, ya verás. Ese día saldremos todos a sacar las barcas encalladas del cieno.',
      'A água voltará, você vai ver. Nesse dia nós sairemos todos para tirar os barcos encalhados do lodo.',
      'Das Wasser wird zurückkommen, du wirst sehen. An dem Tag werden wir alle hinausgehen und die gestrandeten Boote aus dem Schlick ziehen.',
      '[水|shuǐ] [会|huì] [回来|huí lai] [的|de] ， [你|nǐ] [等着|děng zhe] [看|kàn] 。 [那|nà] [天|tiān] [我们|wǒ men] [会|huì] [一起|yī qǐ] [出去|chū qù] ， [把|bǎ] [搁浅|gē qiǎn] [的|de] [船|chuán] [从|cóng] [淤泥|yū ní] [里|lǐ] [拉|lā] [出来|chū lai] 。',
      '[水|みず] は [戻|もど]って [来|く]る でしょう 。 その [日|ひ] は みんな で [出|で]かけて 、 [座礁|ざしょう]した [船|ふね] を ヘドロ から [引|ひ]き[出|だ]す つもり です 。'),
  ];

  // ================================================================ the Quarry Caves
  // long ago: pines on the slopes round the camp, a mountain stream in a wooden flume, pale spoil heaps · tomorrow: dead pines, scree
  WORDS.quarry = {
    past: [
      W('qr', 'pinewood', 'pine forest', 'pinar', 'pinhal', 'Kiefernwald', '[松林|sōng lín]', '[松林|まつばやし]', 'mmm', ['pinares', 'pinhais', 'Kiefernwälder']),
      W('qr', 'resin', 'resin (pine sap)', 'resina', 'resina', 'Harz', '[松脂|sōng zhī]', '[松脂|まつやに]', 'ffn'),
      W('qr', 'flume', 'flume (a wooden channel)', 'canaleta', 'calha', 'Rinne', '[木水道|mù shuǐ dào]', '[樋|とい]', 'fff', ['canaletas', 'calhas', 'Rinnen']),
      W('qr', 'trough', 'water trough', 'abrevadero', 'bebedouro', 'Trog', '[水槽|shuǐ cáo]', '[水桶|みずおけ]', 'mmm', ['abrevaderos', 'bebedouros', 'Tröge']),
      W('qr', 'trout', 'trout', 'trucha', 'truta', 'Forelle', '[鳟鱼|zūn yú]', '[鱒|ます]', 'fff', ['truchas', 'trutas', 'Forellen']),
      W('qr', 'foam', 'foam', 'espuma', 'espuma', 'Schaum', '[泡沫|pào mò]', '[泡|あわ]', 'ffm'),
      W('qr', 'log', 'log', 'tronco', 'tora', 'Baumstamm', '[原木|yuán mù]', '[丸太|まるた]', 'mfm', ['troncos', 'toras', 'Baumstämme']),
      W('qr', 'sawdust', 'sawdust', 'serrín', 'serragem', 'Sägemehl', '[锯末|jù mò]', 'おがくず', 'mfn'),
      W('qr', 'spoil', 'spoil heap (waste rock)', 'escombrera', 'monte de entulho', 'Abraumhalde', '[废石堆|fèi shí duī]', 'ぼた[山|やま]', 'fmf', ['escombreras', 'montes de entulho', 'Abraumhalden']),
      W('qr', 'torrent', 'mountain stream', 'torrente', 'riacho de montanha', 'Sturzbach', '[山涧|shān jiàn]', '[渓流|けいりゅう]', 'mmm', ['torrentes', 'riachos de montanha', 'Sturzbäche']),
      W('qr', 'marmot', 'marmot', 'marmota', 'marmota', 'Murmeltier', '[土拨鼠|tǔ bō shǔ]', 'マーモット', 'ffn', ['marmotas', 'marmotas', 'Murmeltiere']),
      W('qr', 'badger', 'badger', 'tejón', 'texugo', 'Dachs', '[獾|huān]', '[穴熊|あなぐま]', 'mmm', ['tejones', 'texugos', 'Dachse']),
    ],
    future: [
      W('qr', 'scree', 'scree (loose stones)', 'pedregal', 'pedregal', 'Geröll', '[乱石|luàn shí]', 'ガレ[場|ば]', 'mmn'),
      W('qr', 'landslide', 'landslide', 'derrumbe', 'desmoronamento', 'Erdrutsch', '[塌方|tā fāng]', '[崖崩|がけくず]れ', 'mmm', ['derrumbes', 'desmoronamentos', 'Erdrutsche']),
      W('qr', 'erosion', 'erosion', 'erosión', 'erosão', 'Erosion', '[侵蚀|qīn shí]', '[浸食|しんしょく]', 'fff'),
      W('qr', 'crumble', 'to crumble', 'desmoronarse', 'desmoronar', 'zerbröckeln', '[崩塌|bēng tā]', '[崩|くず]れる'),
      W('qr', 'pebble', 'pebble', 'guijarro', 'seixo', 'Kiesel', '[卵石|luǎn shí]', '[小石|こいし]', 'mmm', ['guijarros', 'seixos', 'Kiesel']),
      W('qr', 'thistle', 'thistle', 'cardo', 'cardo', 'Distel', '[蓟|jì]', '[薊|あざみ]', 'mmf', ['cardos', 'cardos', 'Disteln']),
      W('qr', 'nettle', 'nettle', 'ortiga', 'urtiga', 'Brennnessel', '[荨麻|qián má]', '[刺草|いらくさ]', 'fff', ['ortigas', 'urtigas', 'Brennnesseln']),
      W('qr', 'scrap', 'scrap metal', 'chatarra', 'sucata', 'Schrott', '[废铁|fèi tiě]', '[屑鉄|くずてつ]', 'ffm'),
      W('qr', 'gully', 'gully', 'barranco', 'ravina', 'Schlucht', '[沟壑|gōu hè]', '[溝|みぞ]', 'mff', ['barrancos', 'ravinas', 'Schluchten']),
      W('qr', 'ruin', 'ruin', 'ruina', 'ruína', 'Ruine', '[废墟|fèi xū]', '[廃墟|はいきょ]', 'fff', ['ruinas', 'ruínas', 'Ruinen']),
      W('qr', 'wolf', 'wolf', 'lobo', 'lobo', 'Wolf', '[狼|láng]', '[狼|おおかみ]', 'mmm', ['lobos', 'lobos', 'Wölfe']),
      W('qr', 'gush', 'to spring up (water)', 'brotar', 'brotar', 'sprudeln', '[涌出|yǒng chū]', '[湧|わ]き[出|で]る'),
    ],
  };
  // long ago: what they used to do (the imperfect for habits: the quarry's step)
  LINES['quarry.past.grandpa'] = [
    L('When I was a boy, I went down to the {w.tf_qr_torrent} every morning. There were {w.tf_qr_trout:pl} in the {w.tf_qr_foam}, and a {w.tf_qr_marmot} always whistled at me from the rocks.',
      'Cuando era niño, bajaba al torrente cada mañana. Había truchas en la espuma, y una marmota siempre me silbaba desde las rocas.',
      'Quando eu era menino, descia até o riacho toda manhã. Havia trutas na espuma, e uma marmota sempre assobiava para mim das pedras.',
      'Als ich ein Junge war, ging ich jeden Morgen zum Sturzbach hinunter. Im Schaum gab es Forellen, und ein Murmeltier pfiff mich von den Felsen aus immer an.',
      '[我|wǒ] [小|xiǎo] [时候|shí hou] [每天|měi tiān] [早上|zǎo shang] [都|dōu] [下|xià] [到|dào] [山涧|shān jiàn] [去|qù] 。 [泡沫|pào mò] [里|lǐ] [常常|cháng cháng] [有|yǒu] [鳟鱼|zūn yú] ， [一|yī] [只|zhī] [土拨鼠|tǔ bō shǔ] [总是|zǒng shì] [在|zài] [石头|shí tou] [上|shàng] [对|duì] [我|wǒ] [吹|chuī] [口哨|kǒu shào] 。',
      '[子供|こども] の [頃|ころ] は 、 [毎朝|まいあさ] [渓流|けいりゅう] へ [下|お]りた もの です 。 [泡|あわ] の [中|なか] に [鱒|ます] が いて 、 マーモット が いつも [岩|いわ] の [上|うえ] から [口笛|くちぶえ] を [吹|ふ]いて いました 。'),
  ];
  LINES['quarry.past.smith'] = [
    L('Before the {w.tf_qr_flume}, I carried buckets up from the {w.tf_qr_torrent} every day. Now the water comes down by itself, to my forge and to the mules’ {w.tf_qr_trough}.',
      'Antes de la canaleta, cada día subía cubos del torrente. Ahora el agua baja sola, hasta mi fragua y el abrevadero de las mulas.',
      'Antes da calha, todo dia eu subia baldes do riacho. Agora a água desce sozinha, até a minha forja e o bebedouro das mulas.',
      'Vor der Rinne trug ich jeden Tag Eimer vom Sturzbach herauf. Jetzt kommt das Wasser von selbst herunter, bis zu meiner Schmiede und zum Trog der Maultiere.',
      '[以前|yǐ qián] [没有|méi yǒu] [木水道|mù shuǐ dào] [的|de] [时候|shí hou] ， [我|wǒ] [每天|měi tiān] [都|dōu] [从|cóng] [山涧|shān jiàn] [提|tí] [水|shuǐ] [上来|shàng lai] 。 [现在|xiàn zài] [水|shuǐ] [自己|zì jǐ] [流|liú] [下来|xià lai] ， [流|liú] [到|dào] [我|wǒ] [的|de] [铁匠铺|tiě jiang pù] ， [也|yě] [流|liú] [到|dào] [骡子|luó zi] [的|de] [水槽|shuǐ cáo] 。',
      '[樋|とい] が できる [前|まえ] は 、 [毎日|まいにち] [渓流|けいりゅう] から [水|みず] を [運|はこ]んだ もの です 。 [今|いま] は [水|みず] が [自分|じぶん] で [流|なが]れて [来|き]ます 。 [鍛冶場|かじば] に も 、 ラバ の [水桶|みずおけ] に も 。'),
  ];
  // tomorrow: guessing (the future of probability: the quarry's step), and what they fear
  LINES['quarry.future.cande'] = [
    L('Where will the {w.tf_qr_torrent} be now? Under the {w.tf_qr_scree}, I suppose. Every winter there’s another {w.tf_qr_landslide}.',
      '¿Dónde estará el torrente ahora? Estará debajo del pedregal, supongo. Cada invierno hay otro derrumbe.',
      'Onde estará o riacho agora? Estará debaixo do pedregal, acho. Todo inverno há outro desmoronamento.',
      'Wo wird der Sturzbach jetzt wohl sein? Wohl unter dem Geröll. Jeden Winter gibt es einen neuen Erdrutsch.',
      '[山涧|shān jiàn] [现在|xiàn zài] [会|huì] [在|zài] [哪里|nǎ lǐ] [呢|ne] ？ [大概|dà gài] [在|zài] [乱石|luàn shí] [下面|xià miàn] [吧|ba] 。 [每年|měi nián] [冬天|dōng tiān] [都|dōu] [有|yǒu] [新|xīn] [的|de] [塌方|tā fāng] 。',
      '[渓流|けいりゅう] は [今|いま] どこ に ある でしょう ？ ガレ[場|ば] の [下|した] かも しれません 。 [毎年|まいとし] [冬|ふゆ] に なる と 、 また [崖崩|がけくず]れ が [起|お]きます 。'),
  ];
  LINES['quarry.future.lucho'] = [
    L('Who will live up there now, among the dead pines? The {w.tf_qr_wolf:pl}, I suppose. And that {w.tf_qr_scrap} by the rails will be all that’s left of the carts.',
      '¿Quién vivirá allá arriba ahora, entre los pinos muertos? Los lobos, supongo. Y esa chatarra junto a los rieles será todo lo que queda de las vagonetas.',
      'Quem viverá lá em cima agora, entre os pinheiros mortos? Os lobos, acho. E aquela sucata junto aos trilhos será tudo o que resta dos vagões.',
      'Wer wird jetzt wohl da oben zwischen den toten Kiefern wohnen? Die Wölfe, nehme ich an. Und der Schrott bei den Schienen wird wohl alles sein, was von den Loren übrig ist.',
      '[现在|xiàn zài] [谁|shéi] [会|huì] [住|zhù] [在|zài] [上面|shàng miàn] [那些|nà xiē] [枯死|kū sǐ] [的|de] [松树|sōng shù] [中间|zhōng jiān] [呢|ne] ？ [大概|dà gài] [是|shì] [狼|láng] [吧|ba] 。 [铁轨|tiě guǐ] [边|biān] [那|nà] [堆|duī] [废铁|fèi tiě] ， [可能|kě néng] [就是|jiù shì] [矿车|kuàng chē] [剩下|shèng xià] [的|de] [全部|quán bù] [了|le] 。',
      '[今|いま] 、 [上|うえ] の [枯|か]れた [松|まつ] の [間|あいだ] に [誰|だれ] が [住|す]んで いる でしょう ？ [狼|おおかみ] かも しれません 。 [線路|せんろ] の そば の [屑鉄|くずてつ] が 、 トロッコ の [残|のこ]り の すべて でしょう 。'),
  ];

  // ================================================================ the Frost Peaks
  // long ago: the glacier down to the tower's crag, powder snow banked against the houses · tomorrow: the glacier gone, a gray moraine
  WORDS.peaks = {
    past: [
      W('pk', 'glacier', 'glacier', 'glaciar', 'geleira', 'Gletscher', '[冰川|bīng chuān]', '[氷河|ひょうが]', 'mfm', ['glaciares', 'geleiras', 'Gletscher']),
      W('pk', 'tongue', 'the glacier’s tongue', 'lengua de hielo', 'língua de gelo', 'Gletscherzunge', '[冰舌|bīng shé]', '[氷舌|ひょうぜつ]', 'fff', ['lenguas de hielo', 'línguas de gelo', 'Gletscherzungen']),
      W('pk', 'serac', 'serac (a tower of ice)', 'serac', 'serac', 'Sérac', '[冰塔|bīng tǎ]', 'セラック', 'mmm', ['seracs', 'seracs', 'Séracs']),
      W('pk', 'icearch', 'ice arch', 'arco de hielo', 'arco de gelo', 'Eisbogen', '[冰拱|bīng gǒng]', '[氷|こおり] の アーチ', 'mmm', ['arcos de hielo', 'arcos de gelo', 'Eisbögen']),
      W('pk', 'blueice', 'blue ice', 'hielo azul', 'gelo azul', 'blaues Eis', '[蓝冰|lán bīng]', '[青|あお]い [氷|こおり]', 'mmn'),
      W('pk', 'stoat', 'stoat (in its white winter coat)', 'armiño', 'arminho', 'Hermelin', '[白鼬|bái yòu]', 'オコジョ', 'mmn', ['armiños', 'arminhos', 'Hermeline']),
      W('pk', 'ptarmigan', 'ptarmigan', 'perdiz blanca', 'lagópode', 'Schneehuhn', '[雷鸟|léi niǎo]', '[雷鳥|らいちょう]', 'fmn', ['perdices blancas', 'lagópodes', 'Schneehühner']),
      W('pk', 'chamois', 'chamois', 'rebeco', 'camurça', 'Gämse', '[岩羚羊|yán líng yáng]', 'シャモア', 'mff', ['rebecos', 'camurças', 'Gämsen']),
      W('pk', 'fir', 'fir tree', 'abeto', 'abeto', 'Tanne', '[冷杉|lěng shān]', '[樅|もみ]', 'mmf', ['abetos', 'abetos', 'Tannen']),
      W('pk', 'iceaxe', 'ice axe', 'piolet', 'picareta de gelo', 'Eispickel', '[冰镐|bīng gǎo]', 'ピッケル', 'mfm', ['piolets', 'picaretas de gelo', 'Eispickel']),
      W('pk', 'powder', 'powder snow', 'nieve en polvo', 'neve fofa', 'Pulverschnee', '[粉雪|fěn xuě]', '[粉雪|こなゆき]', 'ffm'),
      W('pk', 'slide', 'to slide (slowly)', 'deslizarse', 'deslizar', 'gleiten', '[滑动|huá dòng]', '[滑|すべ]る'),
    ],
    future: [
      W('pk', 'moraine', 'moraine (the stones a glacier leaves)', 'morrena', 'morena', 'Moräne', '[冰碛|bīng qì]', 'モレーン', 'fff', ['morrenas', 'morenas', 'Moränen']),
      W('pk', 'bare', 'bare rock', 'roca viva', 'rocha nua', 'nackter Fels', '[裸岩|luǒ yán]', '[岩肌|いわはだ]', 'ffm'),
      W('pk', 'scar', 'scar', 'cicatriz', 'cicatriz', 'Narbe', '[伤疤|shāng bā]', '[傷跡|きずあと]', 'fff', ['cicatrices', 'cicatrizes', 'Narben']),
      W('pk', 'polished', 'polished (smooth)', 'pulido', 'polido', 'glatt geschliffen', '[磨光|mó guāng]', '[磨|みが]かれた'),
      W('pk', 'rockfall', 'rockfall', 'desprendimiento', 'desprendimento', 'Steinschlag', '[落石|luò shí]', '[落石|らくせき]', 'mmm', ['desprendimientos', 'desprendimentos', 'Steinschläge']),
      W('pk', 'remnant', 'what’s left (a remnant)', 'vestigio', 'vestígio', 'Rest', '[残迹|cán jì]', '[名残|なごり]', 'mmm', ['vestigios', 'vestígios', 'Reste']),
      W('pk', 'melt', 'to melt', 'derretirse', 'derreter', 'schmelzen', '[融化|róng huà]', '[溶|と]ける'),
      W('pk', 'drip', 'to drip', 'gotear', 'pingar', 'tropfen', '[滴|dī]', '[滴|したた]る'),
      W('pk', 'meltwater', 'meltwater', 'agua de deshielo', 'água de degelo', 'Schmelzwasser', '[融水|róng shuǐ]', '[雪解|ゆきど]け[水|みず]', 'ffn', null, { es: 'el' }),
      W('pk', 'rivulet', 'little stream', 'riachuelo', 'riachinho', 'Bächlein', '[小溪|xiǎo xī]', '[小川|おがわ]', 'mmn', ['riachuelos', 'riachinhos', 'Bächlein']),
      W('pk', 'gentian', 'gentian (a blue mountain flower)', 'genciana', 'genciana', 'Enzian', '[龙胆|lóng dǎn]', 'リンドウ', 'ffm', ['gencianas', 'gencianas', 'Enziane']),
      W('pk', 'edelweiss', 'edelweiss', 'flor de las nieves', 'edelvais', 'Edelweiß', '[雪绒花|xuě róng huā]', 'エーデルワイス', 'ffn', ['flores de las nieves', 'edelvais', 'Edelweiß']),
    ],
  };
  // long ago: one story, what happened against what was going on (the preterite and the imperfect: the peaks' step)
  LINES['peaks.past.teo'] = [
    L('Yesterday, when I went up, the {w.tf_pk_glacier} was shining blue. I was resting under a {w.tf_pk_fir} when a {w.tf_pk_chamois} crossed the {w.tf_pk_tongue}.',
      'Ayer, cuando subí, el glaciar brillaba azul. Descansaba debajo de un abeto cuando un rebeco cruzó la lengua de hielo.',
      'Ontem, quando eu subi, a geleira brilhava azul. Eu descansava debaixo de um abeto quando uma camurça atravessou a língua de gelo.',
      'Als ich gestern hinaufgestiegen bin, leuchtete der Gletscher blau. Ich ruhte mich unter einer Tanne aus, als eine Gämse über die Gletscherzunge lief.',
      '[昨天|zuó tiān] [我|wǒ] [上去|shàng qù] [的|de] [时候|shí hou] ， [冰川|bīng chuān] [闪着|shǎn zhe] [蓝光|lán guāng] 。 [我|wǒ] [正在|zhèng zài] [冷杉|lěng shān] [下|xià] [休息|xiū xi] ， [一|yī] [只|zhī] [岩羚羊|yán líng yáng] [走|zǒu] [过|guò] [了|le] [冰舌|bīng shé] 。',
      '[昨日|きのう] [登|のぼ]った とき 、 [氷河|ひょうが] が [青|あお]く [光|ひか]って いました 。 [樅|もみ] の [下|した] で [休|やす]んで いた とき 、 シャモア が [氷舌|ひょうぜつ] を [渡|わた]りました 。'),
  ];
  LINES['peaks.past.driver'] = [
    L('I was coming up with the mules when a {w.tf_pk_serac} broke off the glacier. Luckily I had my {w.tf_pk_iceaxe}, and we were far below it.',
      'Subía con las mulas cuando un serac se rompió del glaciar. Por suerte llevaba mi piolet, y estábamos muy abajo.',
      'Eu subia com as mulas quando um serac se soltou da geleira. Por sorte eu levava a minha picareta de gelo, e estávamos bem abaixo.',
      'Ich kam gerade mit den Maultieren herauf, als ein Sérac vom Gletscher abbrach. Zum Glück hatte ich meinen Eispickel dabei, und wir waren weit unten.',
      '[我|wǒ] [正在|zhèng zài] [带着|dài zhe] [骡子|luó zi] [上山|shàng shān] ， [一|yī] [座|zuò] [冰塔|bīng tǎ] [从|cóng] [冰川|bīng chuān] [上|shàng] [断|duàn] [了|le] [下来|xià lai] 。 [幸好|xìng hǎo] [我|wǒ] [带|dài] [着|zhe] [冰镐|bīng gǎo] ， [我们|wǒ men] [也|yě] [离|lí] [得|de] [很|hěn] [远|yuǎn] 。',
      'ラバ と [登|のぼ]って いた とき 、 セラック が [氷河|ひょうが] から [崩|くず]れました 。 [幸|さいわ]い ピッケル を [持|も]って いて 、 [私|わたし]たち は ずっと [下|した] に いました 。'),
  ];
  // tomorrow: advice and guesses (the conditional: the peaks' step), and what they fear
  LINES['peaks.future.lia'] = [
    L('If I were you, I wouldn’t climb the {w.tf_pk_moraine}. There could be a {w.tf_pk_rockfall}, and the rocks up there {w.tf_pk_drip} all day.',
      'Yo que tú, no subiría a la morrena. Podría haber un desprendimiento, y las rocas de allá arriba gotean todo el día.',
      'No seu lugar, eu não subiria a morena. Poderia haver um desprendimento, e as pedras lá em cima pingam o dia todo.',
      'An deiner Stelle würde ich nicht auf die Moräne klettern. Es könnte einen Steinschlag geben, und die Felsen da oben tropfen den ganzen Tag.',
      '[要是|yào shi] [我|wǒ] [是|shì] [你|nǐ] ， [我|wǒ] [不|bù] [会|huì] [爬|pá] [冰碛|bīng qì] 。 [可能|kě néng] [会|huì] [有|yǒu] [落石|luò shí] ， [上面|shàng miàn] [的|de] [石头|shí tou] [一整天|yī zhěng tiān] [都|dōu] [在|zài] [滴|dī] [水|shuǐ] 。',
      'わたし だったら 、 モレーン に は [登|のぼ]りません 。 [落石|らくせき] が ある かも しれない し 、 [上|うえ] の [岩|いわ] は [一日中|いちにちじゅう] [滴|したた]って います 。'),
  ];
  LINES['peaks.future.teo'] = [
    L('The glacier? It would be about forty years ago that it began to {w.tf_pk_melt}. Today it would be smaller than the inn.',
      '¿El glaciar? Sería hace unos cuarenta años cuando empezó a derretirse. Hoy sería más pequeño que la posada.',
      'A geleira? Seria há uns quarenta anos que ela começou a derreter. Hoje seria menor que a pousada.',
      'Der Gletscher? Es wäre wohl vor ungefähr vierzig Jahren gewesen, als er zu schmelzen begann. Heute wäre er wohl kleiner als das Gasthaus.',
      '[冰川|bīng chuān] [吗|ma] ？ [它|tā] [大概|dà gài] [是|shì] [四十|sì shí] [年|nián] [前|qián] [开始|kāi shǐ] [融化|róng huà] [的|de] 。 [现在|xiàn zài] [可能|kě néng] [比|bǐ] [客栈|kè zhàn] [还|hái] [小|xiǎo] 。',
      '[氷河|ひょうが] です か ？ [溶|と]け[始|はじ]めた の は 、 [四十年|よんじゅうねん] ぐらい [前|まえ] でしょう 。 [今|いま] は [宿屋|やどや] より [小|ちい]さい でしょう 。'),
  ];

  // ================================================================ Port Brisa
  // long ago: wooded headlands round the bay, a wider beach, green hills behind the walls · tomorrow: the sea risen into the lanes
  WORDS.port = {
    past: [
      W('pb', 'cape', 'cape (a headland)', 'cabo', 'cabo', 'Kap', '[海角|hǎi jiǎo]', '[岬|みさき]', 'mmn', ['cabos', 'cabos', 'Kaps']),
      W('pb', 'cliff', 'cliff (by the sea)', 'acantilado', 'falésia', 'Klippe', '[悬崖|xuán yá]', '[崖|がけ]', 'mff', ['acantilados', 'falésias', 'Klippen']),
      W('pb', 'inlet', 'inlet (a little bay)', 'ensenada', 'enseada', 'Bucht', '[小海湾|xiǎo hǎi wān]', '[入|い]り[江|え]', 'fff', ['ensenadas', 'enseadas', 'Buchten']),
      W('pb', 'stonepine', 'stone pine', 'pino piñonero', 'pinheiro-manso', 'Pinie', '[伞松|sǎn sōng]', 'カサマツ', 'mmf', ['pinos piñoneros', 'pinheiros-mansos', 'Pinien']),
      W('pb', 'corkoak', 'cork oak', 'alcornoque', 'sobreiro', 'Korkeiche', '[栓皮栎|shuān pí lì]', 'コルクガシ', 'mmf', ['alcornoques', 'sobreiros', 'Korkeichen']),
      W('pb', 'heather', 'heather', 'brezo', 'urze', 'Heidekraut', '[石南|shí nán]', 'ヒース', 'mfn'),
      W('pb', 'rosemary', 'rosemary', 'romero', 'alecrim', 'Rosmarin', '[迷迭香|mí dié xiāng]', 'ローズマリー', 'mmm'),
      W('pb', 'breeze', 'breeze', 'brisa', 'brisa', 'Brise', '[微风|wēi fēng]', 'そよ[風|かぜ]', 'fff'),
      W('pb', 'tern', 'tern (a sea bird)', 'charrán', 'andorinha-do-mar', 'Seeschwalbe', '[燕鸥|yàn ōu]', 'アジサシ', 'mff', ['charranes', 'andorinhas-do-mar', 'Seeschwalben']),
      W('pb', 'umbrella', 'beach umbrella', 'sombrilla', 'guarda-sol', 'Sonnenschirm', '[遮阳伞|zhē yáng sǎn]', 'ビーチパラソル', 'fmm', ['sombrillas', 'guarda-sóis', 'Sonnenschirme']),
      W('pb', 'conch', 'conch shell', 'caracola', 'búzio', 'Tritonshorn', '[海螺|hǎi luó]', 'ほら[貝|がい]', 'fmn', ['caracolas', 'búzios', 'Tritonshörner']),
      W('pb', 'sandcastle', 'sandcastle', 'castillo de arena', 'castelo de areia', 'Sandburg', '[沙堡|shā bǎo]', '[砂|すな] の [城|しろ]', 'mmf', ['castillos de arena', 'castelos de areia', 'Sandburgen']),
    ],
    future: [
      W('pb', 'storm', 'storm at sea (and its surge)', 'temporal', 'temporal', 'Sturmflut', '[风暴潮|fēng bào cháo]', '[高潮|たかしお]', 'mmf', ['temporales', 'temporais', 'Sturmfluten']),
      W('pb', 'flooded', 'flooded', 'inundado', 'inundado', 'überflutet', '[被淹|bèi yān]', '[水没|すいぼつ]した'),
      W('pb', 'saltwater', 'salt water', 'agua salada', 'água salgada', 'Salzwasser', '[咸水|xián shuǐ]', '[塩水|しおみず]', 'ffn', null, { es: 'el' }),
      W('pb', 'boardwalk', 'boardwalk', 'pasarela de madera', 'passadiço de madeira', 'Holzsteg', '[木栈道|mù zhàn dào]', '[木道|もくどう]', 'fmm', ['pasarelas de madera', 'passadiços de madeira', 'Holzstege']),
      W('pb', 'barrier', 'barrier', 'barrera', 'barreira', 'Barriere', '[屏障|píng zhàng]', '[防壁|ぼうへき]', 'fff', ['barreras', 'barreiras', 'Barrieren']),
      W('pb', 'seawall', 'sea wall', 'malecón', 'paredão', 'Ufermauer', '[防波堤|fáng bō dī]', '[防波堤|ぼうはてい]', 'mmf', ['malecones', 'paredões', 'Ufermauern']),
      W('pb', 'hightide', 'high tide', 'marea alta', 'maré alta', 'Flut', '[涨潮|zhǎng cháo]', '[満潮|まんちょう]', 'fff'),
      W('pb', 'sunk', 'under water (sunk)', 'sumergido', 'submerso', 'versunken', '[沉没|chén mò]', '[沈|しず]んだ'),
      W('pb', 'overflow', 'to overflow', 'desbordarse', 'transbordar', 'überlaufen', '[溢出|yì chū]', '[溢|あふ]れる'),
      W('pb', 'bail', 'to bail out (water)', 'achicar', 'esgotar', 'ausschöpfen', '[舀水|yǎo shuǐ]', '[水|みず] を [汲|く]み[出|だ]す'),
      W('pb', 'saltmarsh', 'salt marsh', 'marisma', 'sapal', 'Salzwiese', '[盐沼|yán zhǎo]', '[塩|しお] の [湿地|しっち]', 'fmf', ['marismas', 'sapais', 'Salzwiesen']),
      W('pb', 'sealavender', 'sea lavender', 'limonio', 'limónio', 'Strandflieder', '[补血草|bǔ xuè cǎo]', 'ハマサジ', 'mmm'),
    ],
  };
  // long ago: what was going on, cut off by what happened (the progressive and the preterite: the port's step)
  LINES['port.past.fisher'] = [
    L('I was rowing round the {w.tf_pb_cape} when a {w.tf_pb_tern} dived right next to the boat. Up on the {w.tf_pb_cliff}, the {w.tf_pb_stonepine:pl} were swaying in the {w.tf_pb_breeze}.',
      'Estaba remando alrededor del cabo cuando un charrán se zambulló justo al lado de la barca. Arriba, en el acantilado, los pinos piñoneros se mecían con la brisa.',
      'Eu estava remando em volta do cabo quando uma andorinha-do-mar mergulhou bem do lado do barco. Lá em cima, na falésia, os pinheiros-mansos balançavam com a brisa.',
      'Ich ruderte gerade um das Kap, als eine Seeschwalbe direkt neben dem Boot tauchte. Oben auf der Klippe wiegten sich die Pinien in der Brise.',
      '[我|wǒ] [正在|zhèng zài] [绕着|rào zhe] [海角|hǎi jiǎo] [划船|huá chuán] [的|de] [时候|shí hou] ， [一|yī] [只|zhī] [燕鸥|yàn ōu] [就|jiù] [在|zài] [船|chuán] [边|biān] [扎|zhā] [进|jìn] [了|le] [水里|shuǐ lǐ] 。 [悬崖|xuán yá] [上|shàng] ， [伞松|sǎn sōng] [在|zài] [微风|wēi fēng] [里|lǐ] [摇晃|yáo huàng] 。',
      '[岬|みさき] の [周|まわ]り を [漕|こ]いで いた とき 、 アジサシ が [船|ふね] の すぐ [横|よこ] に [潜|もぐ]りました 。 [崖|がけ] の [上|うえ] で は 、 カサマツ が そよ[風|かぜ] に [揺|ゆ]れて いました 。'),
  ];
  LINES['port.past.mason'] = [
    L('I was carving a stone down on the beach when a girl came running up to show me a {w.tf_pb_conch}. The beach was so wide then, you could build a {w.tf_pb_sandcastle} anywhere.',
      'Estaba tallando una piedra en la playa cuando una niña llegó corriendo para enseñarme una caracola. La playa era tan ancha que se podía hacer un castillo de arena en cualquier sitio.',
      'Eu estava esculpindo uma pedra na praia quando uma menina chegou correndo para me mostrar um búzio. A praia era tão larga que dava para fazer um castelo de areia em qualquer lugar.',
      'Ich meißelte gerade einen Stein am Strand, als ein Mädchen angerannt kam, um mir ein Tritonshorn zu zeigen. Der Strand war damals so breit, dass man überall eine Sandburg bauen konnte.',
      '[我|wǒ] [正在|zhèng zài] [海滩|hǎi tān] [上|shàng] [刻|kè] [石头|shí tou] [的|de] [时候|shí hou] ， [一个|yī gè] [女孩|nǚ hái] [拿着|ná zhe] [一|yī] [个|gè] [海螺|hǎi luó] [跑|pǎo] [过来|guò lai] [给|gěi] [我|wǒ] [看|kàn] 。 [那时|nà shí] [海滩|hǎi tān] [很|hěn] [宽|kuān] ， [到处|dào chù] [都|dōu] [能|néng] [堆|duī] [沙堡|shā bǎo] 。',
      '[浜|はま] で [石|いし] を [彫|ほ]って いた とき 、 [女|おんな]の[子|こ] が ほら[貝|がい] を [見|み]せ に [走|はし]って [来|き]ました 。 [浜|はま] は とても [広|ひろ]くて 、 どこ に でも [砂|すな] の [城|しろ] が [作|つく]れました 。'),
  ];
  // tomorrow: wishes (the present subjunctive: the port's step), and what they fear
  LINES['port.future.marino'] = [
    L('I hope the {w.tf_pb_saltwater} doesn’t come any higher. I want the {w.tf_pb_boardwalk} to hold until the {w.tf_pb_hightide} goes down.',
      'Ojalá que el agua salada no suba más. Quiero que la pasarela de madera aguante hasta que baje la marea alta.',
      'Tomara que a água salgada não suba mais. Quero que o passadiço de madeira aguente até a maré alta baixar.',
      'Hoffentlich steigt das Salzwasser nicht noch höher. Ich wünsche mir, dass der Holzsteg hält, bis die Flut zurückgeht.',
      '[希望|xī wàng] [咸水|xián shuǐ] [别|bié] [再|zài] [涨|zhǎng] [了|le] 。 [希望|xī wàng] [木栈道|mù zhàn dào] [能|néng] [撑|chēng] [到|dào] [涨潮|zhǎng cháo] [退|tuì] [去|qù] 。',
      '[塩水|しおみず] が これ [以上|いじょう] [上|あ]がりません ように 。 [満潮|まんちょう] が [引|ひ]く まで 、 [木道|もくどう] が [持|も]って ほしい です 。'),
  ];
  LINES['port.future.tere'] = [
    L('Look at my boat, {w.tf_pb_sunk}… I hope someone helps me {w.tf_pb_bail} it out. And I want them to build a {w.tf_pb_barrier} on the {w.tf_pb_seawall} before the next {w.tf_pb_storm}.',
      'Mira mi barca, sumergida… Ojalá que alguien me ayude a achicarla. Y quiero que pongan una barrera en el malecón antes del próximo temporal.',
      'Olha o meu barco, submerso… Tomara que alguém me ajude a esgotar a água dele. E quero que ponham uma barreira no paredão antes do próximo temporal.',
      'Schau dir mein Boot an, versunken… Hoffentlich hilft mir jemand, es auszuschöpfen. Und ich wünsche mir, dass sie eine Barriere auf die Ufermauer bauen, bevor die nächste Sturmflut kommt.',
      '[你|nǐ] [看|kàn] [我|wǒ] [的|de] [船|chuán] ， [都|dōu] [沉没|chén mò] [了|le] … [希望|xī wàng] [有|yǒu] [人|rén] [帮|bāng] [我|wǒ] [把|bǎ] [水|shuǐ] [舀|yǎo] [出来|chū lai] 。 [我|wǒ] [也|yě] [希望|xī wàng] [他们|tā men] [在|zài] [下|xià] [一|yī] [次|cì] [风暴潮|fēng bào cháo] [以前|yǐ qián] [在|zài] [防波堤|fáng bō dī] [上|shàng] [建|jiàn] [一道|yī dào] [屏障|píng zhàng] 。',
      '[私|わたし] の [船|ふね] を [見|み]て 、 [沈|しず]んで しまった … [誰|だれ] か が [水|みず] を [汲|く]み[出|だ]して くれます ように 。 [次|つぎ] の [高潮|たかしお] の [前|まえ] に 、 [防波堤|ぼうはてい] に [防壁|ぼうへき] を [作|つく]って ほしい です 。'),
  ];

  // ================================================================ the rest: registered, met, checked
  const all = () => { const out = []; for (const R of Object.values(WORDS)) for (const w of ['past', 'future']) out.push(...(R[w] || [])); return out; };
  // into Mimo's memory (once; an id already there is left as it is), and the zh / ja readings into the typed-answer dictionary
  function register() {
    if (typeof LEX === 'undefined') return 0;
    const add = all().filter(w => !LEX.item(w.id));
    if (add.length) LEX.register(add);
    try { if (typeof CJK !== 'undefined' && CJK.addSource) for (const w of all()) for (const l of ['zh', 'ja']) if (w[l]) CJK.addSource(w[l]); } catch (e) { /* */ }
    return add.length;
  }
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  function check() {
    const out = [];
    const cj = (s, l, where) => {
      if (!s || typeof CJK === 'undefined' || !CJK.validate) return;
      const p = CJK.validate(String(s).replace(/\{[^}]+\}/g, l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ'), l);
      if (p && p.length) out.push(`${where} (${l}): ${p.join('; ')}`);
    };
    const ids = new Set();
    for (const [rid, R] of Object.entries(WORDS)) for (const w of ['past', 'future']) for (const it of R[w] || []) {
      if (ids.has(it.id)) out.push(`word ${it.id} twice`); ids.add(it.id);
      for (const l of LANGS.concat('en')) if (!it[l]) out.push(`word ${it.id}: no ${l}`);
      cj(it.zh, 'zh', it.id); cj(it.ja, 'ja', it.id);
      if (it.pl && LANGS.slice(0, 3).some(l => !it.pl[l])) out.push(`word ${it.id}: a plural is missing`);
    }
    for (const [key, list] of Object.entries(LINES)) list.forEach((T, i) => {
      for (const l of LANGS.concat('en')) if (!T[l]) out.push(`line ${key}.${i}: no ${l}`);
      cj(T.zh, 'zh', key + '.' + i); cj(T.ja, 'ja', key + '.' + i);
      const slots = String(T.en || '').match(/\{w\.[a-z_0-9]+/g) || [];
      for (const s of slots) { const id = s.slice(1); if (typeof LEX !== 'undefined' && LEX.item && !LEX.item(id)) out.push(`line ${key}.${i}: ${id} isn't a word`); }
    });
    // no word twice in Mimo's memory: an es / pt / de form of ours that another word already has (same meaning, two ids)
    if (typeof LEX !== 'undefined' && LEX.ids) {
      const bare = s => String(s || '').toLowerCase().replace(/^(el|la|los|las|un|una|unos|unas)\s+/, '').trim();      // («la escarcha» is «escarcha»)
      const mine = new Set(all().map(w => w.id)), seen = {};
      for (const id of LEX.ids()) { if (mine.has(id) || !/^w\./.test(id)) continue; const it = LEX.item(id); if (it && it.es) seen[bare(it.es)] = id; }
      for (const w of all()) { const o = seen[bare(w.es)]; if (o) out.push(`word ${w.id} («${w.es}») is already in Mimo's memory as ${o}`); }
    }
    // every word met somewhere: a Look's word, or a slot in a Look's or a person's line (time_land_regions.js)
    if (typeof TIME !== 'undefined' && TIME.land && TIME.land.LANDS) {
      const met = new Set(), grab = s => { (String(s || '').match(/\{w\.[a-z_0-9]+/g) || []).forEach(x => met.add(x.slice(1))); };
      for (const S of Object.values(TIME.land.LANDS)) {
        for (const L0 of S.looks.concat((S.heal && S.heal.looks) || [])) { met.add(L0.id); grab(typeof L0.line === 'function' ? '' : L0.line); (L0.words || []).forEach(id => met.add(id)); }
        for (const Ln of S.lines.concat((S.heal && S.heal.lines) || [])) grab(Ln.T && Ln.T.en);
      }
      for (const w of all()) if (!met.has(w.id)) out.push(`word ${w.id} («${w.es}») is never met`);
    }
    return out;
  }
  return { WORDS, LINES, L, register, check, all };
})();
