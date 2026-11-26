'use strict';
// Everything characters say. Each line has a version in each language and an English version.
// - es/pt/de: [simpler, richer], picked by your language level (LEX.tier()), not by where you are
//   in the story (DESIGN.md 7.10). {w.key} puts a word from words.js in, highlighted.
// - en: the same lines in English with slots: {w.key} (a word Mimo can learn), {c.key} (an
//   everyday word), :pl for the plural, :f for the feminine form. Until you're far enough along,
//   people speak this English with words in the language woven in: words Mimo knows always, and
//   more as your pace allows (the weave, DESIGN.md 12.4). The richer English version is used.
// Never assume the player's gender in the language versions.
// - zh/ja: the same tiers, in the CJK.md notation ([汉字|pīn yīn], [漢字|かんじ] with okurigana outside,
//   tokens split by single spaces, full-width punctuation), with the same {w.key} slots as es/pt/de.
//   Adults speak politely to you in ja (です/ます); kids, friends and Noa's notebook are casual.
//   Hushlings: 小默默 (xiǎo mò mò) / だまりっこ; the big one: 大默默 / 大だまりっこ (CJK.md names table).

const LINES = {
  // Rosa, the fruit seller, Noa's neighbor
  'rosa.greet': {
    es: ['¡Hola! ¿Quién eres?', '¡Hola! Tú no eres de aquí, ¿verdad?'],
    pt: ['Oi! Quem é você?', 'Oi! Você não é daqui, né?'],
    de: ['Hallo! Wer bist du?', 'Hallo! Du bist nicht von hier, oder?'],
    zh: ['[你好|nǐ hǎo] ！ [你|nǐ] [是|shì] [谁|shéi] [呀|ya] ？', '[你好|nǐ hǎo] ！ [你|nǐ] [不|bù] [是|shì] [这里|zhè lǐ] [的|de] [人|rén] [吧|ba] ？'],
    ja: ['こんにちは ！ どなた です か ？', 'こんにちは ！ この あたり の [方|かた] じゃ ない です よ ね ？'],
    en: ['{w.hello}! Who are you?', "{w.hello}! You're not from around here, are you?"] },
  'rosa.letter': {
    es: ['¿Una {w.letter} de Noa?', '¿Esa {w.letter} es de Noa? ¡Conozco esa letra!'],
    pt: ['Uma {w.letter} da Noa?', 'Essa {w.letter} é da Noa? Eu conheço essa letra!'],
    de: ['Ein {w.letter} von Noa?', 'Ist der {w.letter} von Noa? Ich kenne diese Schrift!'],
    zh: ['[诺娅|Nuò yà] [的|de] {w.letter} ？', '[这|zhè] [封|fēng] {w.letter} [是|shì] [诺娅|Nuò yà] [写|xiě] [的|de] ？ [我|wǒ] [认得|rèn de] [她|tā] [的|de] [字|zì] ！'],
    ja: ['ノア の {w.letter} です か ？', 'その {w.letter} 、 ノア から です か ？ この [字|じ] 、 よく [知|し]って います ！'],
    en: ['A {w.letter} from Noa?', "Is that {w.letter} from Noa? I'd know that handwriting anywhere!"] },
  'rosa.where': {
    es: ['Noa no está. Se fue a la {w.tower} vieja, al norte.', 'Noa se fue hace tres semanas a la {w.tower} vieja, allá en el norte. Ahí empezó el silencio.'],
    pt: ['A Noa não está. Ela foi para a {w.tower} velha, no norte.', 'A Noa foi há três semanas para a {w.tower} velha, lá no norte. Foi lá que o silêncio começou.'],
    de: ['Noa ist nicht hier. Sie ist zum alten {w.tower} im Norden gegangen.', 'Noa ist vor drei Wochen zum alten {w.tower} im Norden gegangen. Dort hat die Stille angefangen.'],
    zh: ['[诺娅|Nuò yà] [不|bù] [在|zài] 。 [她|tā] [去|qù] [北边|běi biān] [的|de] [古|gǔ] {w.tower} [了|le] 。', '[诺娅|Nuò yà] [三|sān] [个|gè] [星期|xīng qī] [以前|yǐ qián] [去|qù] [了|le] [北边|běi biān] [的|de] [古|gǔ] {w.tower} 。 [寂静|jì jìng] [就|jiù] [是|shì] [从|cóng] [那里|nà lǐ] [开始|kāi shǐ] [的|de] 。'],
    ja: ['ノア は いません 。 [北|きた] の [古|ふる]い {w.tower} へ [行|い]きました 。', 'ノア は [三週間|さんしゅうかん] [前|まえ] に 、 [北|きた] の [古|ふる]い {w.tower} へ [行|い]きました 。 [静寂|せいじゃく] は 、 あそこ から [始|はじ]まった ん です 。'],
    en: ["Noa isn't here. She went to the old {w.tower}, up {c.north}.", "Noa left three weeks ago, for the old {w.tower} up {c.north}. That's where the {c.silence} started."] },
  // Rosa is the first to name it: the Hush
  'rosa.hush': {
    es: ['Desde entonces, el bosque está callado. Es el Silencio.', 'Desde entonces, el bosque está callado. Le decimos «el Silencio». Y aquí la gente habla cada día menos.'],
    pt: ['Desde então, a floresta está quieta. É o Silêncio.', 'Desde então, a floresta está quieta. A gente chama isso de «o Silêncio». E aqui o pessoal fala cada dia menos.'],
    de: ['Seitdem ist der Wald still. Das ist die Stille.', 'Seitdem ist der Wald still. Wir nennen es «die Stille». Und hier reden die Leute jeden Tag weniger.'],
    zh: ['[从|cóng] [那|nà] [以后|yǐ hòu] ， [森林|sēn lín] [就|jiù] [没有|méi yǒu] [声音|shēng yīn] [了|le] 。 [这|zhè] [就|jiù] [是|shì] [寂静|Jì jìng] 。', '[从|cóng] [那|nà] [以后|yǐ hòu] ， [森林|sēn lín] [就|jiù] [没有|méi yǒu] [声音|shēng yīn] [了|le] 。 [我们|wǒ men] [叫|jiào] [它|tā] “ [寂静|Jì jìng] ” 。 [这里|zhè lǐ] [的|de] [人|rén] [说话|shuō huà] [也|yě] [一天|yī tiān] [比|bǐ] [一天|yī tiān] [少|shǎo] 。'],
    ja: ['あれ から 、 [森|もり] は ずっと [静|しず]か です 。 これ が [静寂|せいじゃく] です 。', 'あれ から 、 [森|もり] は ずっと [静|しず]か です 。 [私|わたし]たち は 「 [静寂|せいじゃく] 」 と [呼|よ]んで います 。 それ に 、 ここ の [人|ひと]たち も 、 [毎日|まいにち] [少|すこ]しずつ [話|はな]さなく なって います 。'],
    en: ['Since then, the {c.forest} has gone quiet. It’s the Hush.', 'Since then, the {c.forest} has gone quiet. We call it the Hush. And here, people talk a little less every day.'] },
  'rosa.alone': {
    es: ['¿Sin ayuda? ¡No! Hay calladitos en el camino.', '¿Así, sin ayuda? ¡No, no! El camino al norte está lleno de calladitos.'],
    pt: ['Sem ajuda? Não! Tem caladinhos no caminho.', 'Assim, sem ajuda? Não, não! O caminho pro norte está cheio de caladinhos.'],
    de: ['Ohne Hilfe? Nein! Da sind Schweiglinge.', 'So ganz ohne Hilfe? Nein, nein! Der Weg nach Norden ist voller Schweiglinge.'],
    zh: ['[没|méi] [人|rén] [帮|bāng] [你|nǐ] ？ [不行|bù xíng] ！ [路上|lù shang] [有|yǒu] [小默默|xiǎo mò mò] 。', '[就|jiù] [这样|zhè yàng] ， [没|méi] [人|rén] [帮|bāng] [你|nǐ] ？ [不行|bù xíng] ， [不行|bù xíng] ！ [往|wǎng] [北|běi] [的|de] [路上|lù shang] [到处|dào chù] [都|dōu] [是|shì] [小默默|xiǎo mò mò] ！'],
    ja: ['ひとり で ？ だめ です ！ [道|みち] に だまりっこ が います よ 。', 'そんな 、 ひとり で ？ だめ 、 だめ ！ [北|きた] へ の [道|みち] は 、 だまりっこ で いっぱい です よ 。'],
    en: ['Without help? No! There are Hushlings on the way.', 'Just like that, without help? Oh no, no! The road {c.north} is full of Hushlings.'] },
  'rosa.apple': {
    es: ['Pero primero, come. Toma una {w.apple}.', 'Pero primero, come algo. Toma, una {w.apple} de mi árbol.'],
    pt: ['Mas primeiro, come. Toma uma {w.apple}.', 'Mas primeiro, come alguma coisa. Toma, uma {w.apple} da minha árvore.'],
    de: ['Aber zuerst iss was. Hier, ein {w.apple}.', 'Aber zuerst iss etwas. Hier, ein {w.apple} von meinem Baum.'],
    zh: ['[不过|bù guò] ， [先|xiān] [吃|chī] [点|diǎn] [东西|dōng xi] 。 [给|gěi] [你|nǐ] [一|yī] [个|gè] {w.apple} 。', '[不过|bù guò] ， [你|nǐ] [先|xiān] [吃|chī] [点|diǎn] [东西|dōng xi] [吧|ba] 。 [给|gěi] ， [这|zhè] [是|shì] [我|wǒ] [家|jiā] [树上|shù shang] [摘|zhāi] [的|de] {w.apple} 。'],
    ja: ['でも 、 まず [食|た]べて ください 。 はい 、 {w.apple} を どうぞ 。', 'でも 、 まず [何|なに]か [食|た]べて ください 。 はい 、 うち の [木|き] の {w.apple} です よ 。'],
    en: ['But first, eat. Here, take this {w.apple}.', 'But first, eat something. Here, take this {w.apple} from my tree.'] },
  'rosa.praise': {
    es: ['¡Muy bien!', '¡Qué bien! Tu amiguito aprende rápido.'],
    pt: ['Muito bem!', 'Que legal! Seu amiguinho aprende rápido.'],
    de: ['Sehr gut!', 'Wie schön! Dein kleiner Freund lernt schnell.'],
    zh: ['[很|hěn] [好|hǎo] ！', '[太|tài] [好|hǎo] [了|le] ！ [你|nǐ] [的|de] [小伙伴|xiǎo huǒ bàn] [学|xué] [得|de] [真|zhēn] [快|kuài] 。'],
    ja: ['とても いい です ね ！', 'すごい ！ [小|ちい]さな お[友達|ともだち] は 、 [覚|おぼ]える の が [早|はや]い です ね 。'],
    en: ['{c.verygood}!', '{c.verygood}! Your little {c.friend} learns fast.'] },
  'rosa.next': {
    es: ['Bruno entrena junto al campanario.', 'Los calladitos odian las palabras. Bruno entrena junto al campanario: con él, tu amiguito será aún más fuerte.'],
    pt: ['O Bruno treina perto do campanário.', 'Os caladinhos odeiam palavras. O Bruno treina perto do campanário: com ele, seu amiguinho vai ficar ainda mais forte.'],
    de: ['Bruno trainiert am Glockenturm.', 'Schweiglinge hassen Wörter. Bruno trainiert am Glockenturm: Mit ihm wird dein kleiner Freund noch stärker.'],
    zh: ['[布鲁诺|Bù lǔ nuò] [在|zài] [钟楼|zhōng lóu] [旁边|páng biān] [训练|xùn liàn] 。', '[小默默|xiǎo mò mò] [讨厌|tǎo yàn] [听到|tīng dào] [人|rén] [说话|shuō huà] 。 [布鲁诺|Bù lǔ nuò] [在|zài] [钟楼|zhōng lóu] [旁边|páng biān] [训练|xùn liàn] 。 [跟着|gēn zhe] [他|tā] ， [你|nǐ] [的|de] [小伙伴|xiǎo huǒ bàn] [会|huì] [变得|biàn de] [更|gèng] [强|qiáng] 。'],
    ja: ['ブルーノ さん は 、 [鐘|かね] の [塔|とう] の そば で [練習|れんしゅう] して います 。', 'だまりっこ は 、 [言葉|ことば] が [大嫌|だいきら]い です 。 ブルーノ さん は 、 [鐘|かね] の [塔|とう] の そば で [練習|れんしゅう] して います 。 ブルーノ さん と [一緒|いっしょ] なら 、 [小|ちい]さな お[友達|ともだち] は もっと [強|つよ]く なります よ 。'],
    en: ['Bruno trains people by the bell tower.', 'Hushlings hate words. Bruno trains people by the bell tower: with him, your little {c.friend} will get even stronger.'] },
  'rosa.again': {
    es: ['Bruno está junto al campanario.', 'Noa está en la {w.tower} del norte. Pero primero, entrena con Bruno junto al campanario.'],
    pt: ['O Bruno está perto do campanário.', 'A Noa está na {w.tower} do norte. Mas primeiro, treina com o Bruno perto do campanário.'],
    de: ['Bruno ist am Glockenturm.', 'Noa ist im {w.tower} im Norden. Aber trainiere zuerst mit Bruno am Glockenturm.'],
    zh: ['[布鲁诺|Bù lǔ nuò] [在|zài] [钟楼|zhōng lóu] [旁边|páng biān] 。', '[诺娅|Nuò yà] [在|zài] [北边|běi biān] [的|de] {w.tower} [那里|nà lǐ] 。 [不过|bù guò] [你|nǐ] [先|xiān] [去|qù] [钟楼|zhōng lóu] [旁边|páng biān] ， [跟|gēn] [布鲁诺|Bù lǔ nuò] [训练|xùn liàn] [吧|ba] 。'],
    ja: ['ブルーノ さん は 、 [鐘|かね] の [塔|とう] の そば に います よ 。', 'ノア は [北|きた] の {w.tower} に います 。 でも まず は 、 [鐘|かね] の [塔|とう] の そば で 、 ブルーノ さん と [練習|れんしゅう] して ください ね 。'],
    en: ["Bruno's by the bell tower.", 'Noa is at the {w.tower} up {c.north}. But first, go and train with Bruno by the bell tower.'] },
  'rosa.field': {
    es: ['¡Cuidado en el campo!', '¡Cuidado en el campo! Noa estaría orgullosa de ti.'],
    pt: ['Cuidado no campo!', 'Cuidado no campo! A Noa ia ficar orgulhosa de você.'],
    de: ['Pass im Feld auf!', 'Pass im Feld auf! Noa wäre stolz auf dich.'],
    zh: ['[去|qù] [田野|tián yě] [要|yào] [小心|xiǎo xīn] [啊|a] ！', '[去|qù] [田野|tián yě] [要|yào] [小心|xiǎo xīn] [啊|a] ！ [诺娅|Nuò yà] [一定|yī dìng] [会|huì] [为|wèi] [你|nǐ] [骄傲|jiāo ào] [的|de] 。'],
    ja: ['[野原|のはら] で は 、 [気|き] を つけて ください ね ！', '[野原|のはら] で は 、 [気|き] を つけて ください ね ！ ノア も きっと [喜|よろこ]びます よ 。'],
    en: ['Be careful out in the {c.field}!', 'Be careful out in the {c.field}! Noa would be so proud of you.'] },
  'rosa.after': {
    es: ['¡El color volvió a la colina!', '¡El color volvió a la colina! Ahora… la {w.tower} vieja. Trae a Noa a casa.'],
    pt: ['A cor voltou pro morro!', 'A cor voltou pro morro! Agora… a {w.tower} velha. Traz a Noa pra casa.'],
    de: ['Die Farbe ist zurück auf dem Hügel!', 'Die Farbe ist zurück auf dem Hügel! Jetzt … der alte {w.tower}. Bring Noa nach Hause.'],
    zh: ['[山坡|shān pō] [上|shàng] [的|de] [颜色|yán sè] [回来|huí lái] [了|le] ！', '[山坡|shān pō] [上|shàng] [的|de] [颜色|yán sè] [回来|huí lái] [了|le] ！ [现在|xiàn zài] …… [该|gāi] [去|qù] [那|nà] [座|zuò] [古|gǔ] {w.tower} [了|le] 。 [把|bǎ] [诺娅|Nuò yà] [带|dài] [回家|huí jiā] [吧|ba] 。'],
    ja: ['[丘|おか] に [色|いろ] が [戻|もど]りました ！', '[丘|おか] に [色|いろ] が [戻|もど]りました ！ [次|つぎ] は …… [古|ふる]い {w.tower} です ね 。 ノア を [連|つ]れて [帰|かえ]って きて ください 。'],
    en: ['The color is back on the {c.hill}!', 'The color is back on the {c.hill}! Now… the old {w.tower}. Bring Noa home.'] },
  'rosa.rest': {
    es: ['¡Descansa un poco!', 'Ay, descansa un poco. Toma {w.water}.'],
    pt: ['Descansa um pouco!', 'Ai, descansa um pouquinho. Toma {w.water}.'],
    de: ['Ruh dich aus!', 'Ach, ruh dich ein bisschen aus. Trink etwas {w.water}.'],
    zh: ['[休息|xiū xi] [一下|yī xià] [吧|ba] ！', '[哎呀|āi yā] ， [休息|xiū xi] [一下|yī xià] [吧|ba] 。 [来|lái] ， [喝|hē] [点|diǎn] {w.water} 。'],
    ja: ['[少|すこ]し [休|やす]んで ください ！', 'あらあら 、 [少|すこ]し [休|やす]んで ください 。 はい 、 {w.water} を どうぞ 。'],
    en: ['Rest a bit!', 'Oh, rest a little. Have some {w.water}.'] },
  // Bruno, the Coach: he finds you on the road out of the forest and walks you to Alba
  'bruno.road1': {
    es: ['¡Oye! ¿Vienes del bosque?', '¡Oye, tú! ¿Atravesaste el bosque sin nadie?'],
    pt: ['Ei! Você veio da floresta?', 'Ei, você! Atravessou a floresta sem ninguém?'],
    de: ['Hey! Kommst du aus dem Wald?', 'Hey, du da! Bist du ganz ohne Begleitung durch den Wald gekommen?'],
    zh: ['[喂|wèi] ！ [你|nǐ] [是|shì] [从|cóng] [森林|sēn lín] [来|lái] [的|de] [吗|ma] ？', '[喂|wèi] ， [就|jiù] [是|shì] [你|nǐ] ！ [你|nǐ] [一|yī] [个|gè] [人|rén] [穿过|chuān guò] [了|le] [森林|sēn lín] ？'],
    ja: ['おーい ！ [森|もり] から [来|き]た ん です か ？', 'おーい 、 そこ の [人|ひと] ！ ひとり で [森|もり] を [抜|ぬ]けて [来|き]た ん です か ？'],
    en: ['Hey! Did you come from the {c.forest}?', 'Hey, you there! Did you come through the {c.forest} all on your own?'] },
  'bruno.road2': {
    es: ['Soy Bruno, de Alba. El camino ya no es seguro.', 'Soy Bruno, de Alba, aquí arriba. Pero el camino ya no es seguro: hay calladitos.'],
    pt: ['Eu sou o Bruno, de Alba. O caminho não é mais seguro.', 'Eu sou o Bruno, de Alba, aqui em cima. Mas o caminho não é mais seguro: tem caladinhos.'],
    de: ['Ich bin Bruno, aus Alba. Der Weg ist nicht mehr sicher.', 'Ich bin Bruno, aus Alba, da oben. Aber der Weg ist nicht mehr sicher: Schweiglinge.'],
    zh: ['[我|wǒ] [是|shì] [阿尔巴|Ā ěr bā] [的|de] [布鲁诺|Bù lǔ nuò] 。 [这|zhè] [条|tiáo] [路|lù] [已经|yǐ jīng] [不|bù] [安全|ān quán] [了|le] 。', '[我|wǒ] [是|shì] [布鲁诺|Bù lǔ nuò] ， [就|jiù] [住|zhù] [在|zài] [前面|qián mian] [的|de] [阿尔巴|Ā ěr bā] 。 [可是|kě shì] [这|zhè] [条|tiáo] [路|lù] [已经|yǐ jīng] [不|bù] [安全|ān quán] [了|le] ： [有|yǒu] [小默默|xiǎo mò mò] 。'],
    ja: ['アルバ の ブルーノ です 。 この [道|みち] は 、 もう [安全|あんぜん] じゃ ありません 。', 'ブルーノ です 。 この [先|さき] の アルバ に [住|す]んで います 。 でも 、 この [道|みち] は もう [安全|あんぜん] じゃ ありません 。 だまりっこ が [出|で]る ん です 。'],
    en: ["I’m Bruno, from Alba. The road isn’t safe anymore.", "I’m Bruno, from Alba, just up this road. But the road isn’t safe anymore: there are Hushlings."] },
  'bruno.follow': {
    es: ['¡Bien! Sígueme a Alba.', '¡Muy bien! Ahora quédate cerca: te llevo a Alba. Ten tus palabras listas.'],
    pt: ['Boa! Me segue até Alba.', 'Muito bem! Agora fica perto: eu te levo até Alba. Deixa suas palavras prontas.'],
    de: ['Gut! Folg mir nach Alba.', 'Sehr gut! Bleib jetzt in meiner Nähe: Ich bringe dich nach Alba. Halte deine Wörter bereit.'],
    zh: ['[好|hǎo] ！ [跟|gēn] [我|wǒ] [去|qù] [阿尔巴|Ā ěr bā] 。', '[很|hěn] [好|hǎo] ！ [现在|xiàn zài] [跟紧|gēn jǐn] [我|wǒ] ， [我|wǒ] [带|dài] [你|nǐ] [去|qù] [阿尔巴|Ā ěr bā] 。 [准备|zhǔn bèi] [好|hǎo] [你|nǐ] [的|de] [词|cí] ！'],
    ja: ['よし ！ アルバ まで ついて [来|き]て ください 。', 'よし 、 いい です ね ！ [私|わたし] から [離|はな]れないで ください 。 アルバ まで [連|つ]れて [行|い]きます 。 [言葉|ことば] を [用意|ようい] して おいて ください 。'],
    en: ['Good! Follow me to Alba.', '{c.verygood}! {c.letsgo}: stay close, I’ll take you to Alba. Keep your words ready.'] },
  'bruno.ambush': {
    es: ['¡Cuidado! ¡Calladitos!', '¡Mira, ahí! ¡Calladitos en el camino! ¡Muéstrales tus palabras!'],
    pt: ['Cuidado! Caladinhos!', 'Olha, ali! Caladinhos no caminho! Mostra pra eles as suas palavras!'],
    de: ['Vorsicht! Schweiglinge!', 'Schau, da! Schweiglinge auf dem Weg! Zeig ihnen deine Wörter!'],
    zh: ['[小心|xiǎo xīn] ！ [小默默|xiǎo mò mò] ！', '[看|kàn] ， [那里|nà lǐ] ！ [路上|lù shang] [有|yǒu] [小默默|xiǎo mò mò] ！ [让|ràng] [它们|tā men] [见识|jiàn shi] [一下|yī xià] [你|nǐ] [的|de] [词|cí] ！'],
    ja: ['[危|あぶ]ない ！ だまりっこ です ！', '[見|み]て 、 あそこ ！ [道|みち] に だまりっこ が います ！ [言葉|ことば] の [力|ちから] を [見|み]せて ください ！'],
    en: ['Watch out! Hushlings!', '{c.look}, over there! Hushlings on the road! Show them your words!'] },
  'bruno.nice': {
    es: ['¡Bien hecho!', '¡Bien hecho! Tu amiguito tiene talento.'],
    pt: ['Mandou bem!', 'Mandou bem! Seu amiguinho tem talento.'],
    de: ['Gut gemacht!', 'Gut gemacht! Dein kleiner Freund ist ein Naturtalent.'],
    zh: ['[干|gàn] [得|de] [好|hǎo] ！', '[干|gàn] [得|de] [好|hǎo] ！ [你|nǐ] [的|de] [小伙伴|xiǎo huǒ bàn] [很|hěn] [有|yǒu] [天赋|tiān fù] 。'],
    ja: ['よく やりました ！', 'よく やりました ！ [相棒|あいぼう] に は [才能|さいのう] が あります ね 。'],
    en: ['Nice work!', 'Nice work! Your little {c.friend} is a natural.'] },
  'bruno.wait': {
    es: ['¡Por aquí! No te quedes atrás.', '¡Por aquí! No te quedes atrás, que el camino es largo.'],
    pt: ['Por aqui! Não fica para trás.', 'Por aqui! Não fica para trás, o caminho é longo.'],
    de: ['Hier lang! Bleib nicht zurück.', 'Hier lang! Bleib nicht zurück, der Weg ist noch weit.'],
    zh: ['[这边|zhè biān] ！ [别|bié] [掉队|diào duì] 。', '[这边|zhè biān] ！ [别|bié] [掉队|diào duì] ， [路|lù] [还|hái] [长|cháng] [着|zhe] [呢|ne] 。'],
    ja: ['こっち です ！ [遅|おく]れないで ください 。', 'こっち です ！ [遅|おく]れないで ください 。 [道|みち] は まだ [長|なが]い です よ 。'],
    en: ['This way! Don’t fall behind.', 'This way! Don’t fall behind, it’s still a long way.'] },
  'bruno.welcome': {
    es: ['¡Esto es Alba!', '¡Esto es Alba! ¿Buscas a Noa? Pregúntale a Rosa, la de la fruta: conoce a todo el mundo. Yo estaré en el campanario.'],
    pt: ['Aqui é Alba!', 'Aqui é Alba! Procurando a Noa? Pergunta pra Rosa, da barraca de frutas: ela conhece todo mundo. Eu vou estar no campanário.'],
    de: ['Das ist Alba!', 'Das ist Alba! Du suchst Noa? Frag Rosa am Obststand, sie kennt hier jeden. Ich bin am Glockenturm.'],
    zh: ['[这里|zhè lǐ] [就|jiù] [是|shì] [阿尔巴|Ā ěr bā] ！', '[这里|zhè lǐ] [就|jiù] [是|shì] [阿尔巴|Ā ěr bā] ！ [你|nǐ] [在|zài] [找|zhǎo] [诺娅|Nuò yà] [吗|ma] ？ [去|qù] [问|wèn] [卖|mài] [水果|shuǐ guǒ] [的|de] [罗莎|Luó shā] ， [她|tā] [谁|shéi] [都|dōu] [认识|rèn shi] 。 [我|wǒ] [会|huì] [在|zài] [钟楼|zhōng lóu] [那里|nà lǐ] 。'],
    ja: ['ここ が アルバ です ！', 'ここ が アルバ です ！ ノア を [探|さが]して いる ん です か ？ [果物屋|くだものや] の ロサ さん に [聞|き]いて ください 。 [町|まち] の みんな を [知|し]って います から 。 [私|わたし] は [鐘|かね] の [塔|とう] に います 。'],
    en: ['This is Alba!', 'This is Alba! Looking for Noa? Ask Rosa at the fruit stall: she knows everyone. I’ll be at the bell tower.'] },
  'bruno.yard': {
    es: ['¿Seguimos entrenando?', '¿Seguimos entrenando? Hoy, colores: así sabrá a quién atacar.'],
    pt: ['Vamos continuar treinando?', 'Vamos continuar treinando? Hoje, cores: assim ele sabe quem atacar.'],
    de: ['Trainieren wir weiter?', 'Trainieren wir weiter? Heute: Farben. Dann weiß er, wen er angreifen soll.'],
    zh: ['[继续|jì xù] [训练|xùn liàn] [吗|ma] ？', '[继续|jì xù] [训练|xùn liàn] [吗|ma] ？ [今天|jīn tiān] [练|liàn] [颜色|yán sè] ： [这样|zhè yàng] [它|tā] [就|jiù] [知道|zhī dào] [该|gāi] [打|dǎ] [谁|shéi] [了|le] 。'],
    ja: ['[練習|れんしゅう] を [続|つづ]けます か ？', '[練習|れんしゅう] を [続|つづ]けます か ？ [今日|きょう] は [色|いろ] です 。 そう すれば 、 [相棒|あいぼう] も どれ を [攻撃|こうげき] する か わかります 。'],
    en: ['Shall we keep training?', 'Shall we keep training? Today: colors. So your {c.friend} knows who to go after.'] },
  'bruno.hi': {
    es: ['¡Hola! Soy Bruno.', '¡Hola! Soy Bruno. Rosa me habló de ti.'],
    pt: ['Oi! Eu sou o Bruno.', 'Oi! Eu sou o Bruno. A Rosa me falou de você.'],
    de: ['Hallo! Ich bin Bruno.', 'Hallo! Ich bin Bruno. Rosa hat mir von dir erzählt.'],
    zh: ['[你好|nǐ hǎo] ！ [我|wǒ] [是|shì] [布鲁诺|Bù lǔ nuò] 。', '[你好|nǐ hǎo] ！ [我|wǒ] [是|shì] [布鲁诺|Bù lǔ nuò] 。 [罗莎|Luó shā] [跟|gēn] [我|wǒ] [说|shuō] [过|guo] [你|nǐ] [的|de] [事|shì] 。'],
    ja: ['こんにちは ！ ブルーノ です 。', 'こんにちは ！ ブルーノ です 。 ロサ さん から 、 [話|はなし] は [聞|き]いて います よ 。'],
    en: ["{w.hello}! I'm Bruno.", "{w.hello}! I'm Bruno. Rosa told me about you."] },
  'bruno.why': {
    es: ['Los calladitos traen el silencio. Pero las palabras los asustan.', 'Los calladitos llevan el silencio a todas partes. Pero una palabra dicha en voz alta… ¡eso no lo aguantan!'],
    pt: ['Os caladinhos trazem o silêncio. Mas as palavras assustam eles.', 'Os caladinhos levam o silêncio pra todo lado. Mas uma palavra dita em voz alta… isso eles não aguentam!'],
    de: ['Die Schweiglinge bringen die Stille. Aber Wörter machen ihnen Angst.', 'Die Schweiglinge tragen die Stille überall hin. Aber ein laut gesagtes Wort … das halten sie nicht aus!'],
    zh: ['[小默默|xiǎo mò mò] [会|huì] [带来|dài lái] [寂静|jì jìng] 。 [可是|kě shì] [它们|tā men] [怕|pà] [人|rén] [说话|shuō huà] 。', '[小默默|xiǎo mò mò] [走到|zǒu dào] [哪里|nǎ lǐ] ， [就|jiù] [把|bǎ] [寂静|jì jìng] [带到|dài dào] [哪里|nǎ lǐ] 。 [可是|kě shì] [一|yī] [句|jù] [大声|dà shēng] [说|shuō] [出来|chū lái] [的|de] [话|huà] …… [它们|tā men] [可|kě] [受不了|shòu bù liǎo] ！'],
    ja: ['だまりっこ は 、 [静寂|せいじゃく] を [連|つ]れて きます 。 でも 、 [言葉|ことば] が [怖|こわ]い ん です 。', 'だまりっこ は 、 どこ へ [行|い]って も [静寂|せいじゃく] を [広|ひろ]げます 。 でも 、 [大|おお]きな [声|こえ] で [言|い]った [言葉|ことば] …… それ だけ は [我慢|がまん] できない ん です ！'],
    en: ['The Hushlings bring the {c.silence}. But words scare them.', "The Hushlings carry the {c.silence} everywhere they go. But a word said out loud… that, they can't stand!"] },
  'bruno.train': {
    es: ['Tu amiguito aprende rápido. ¡A entrenar!', 'Tu amiguito aprende palabras rápido, y eso es lo que temen los calladitos. ¡Vamos a entrenar!'],
    pt: ['Seu amiguinho aprende rápido. Vamos treinar!', 'Seu amiguinho aprende palavras rápido, e é disso que os caladinhos têm medo. Bora treinar!'],
    de: ['Dein kleiner Freund lernt schnell. Los, wir trainieren!', 'Dein kleiner Freund lernt schnell Wörter, und genau davor haben Schweiglinge Angst. Lass uns trainieren!'],
    zh: ['[你|nǐ] [的|de] [小伙伴|xiǎo huǒ bàn] [学|xué] [得|de] [很|hěn] [快|kuài] 。 [开始|kāi shǐ] [训练|xùn liàn] [吧|ba] ！', '[你|nǐ] [的|de] [小伙伴|xiǎo huǒ bàn] [学|xué] [词|cí] [学|xué] [得|de] [很|hěn] [快|kuài] ， [这|zhè] [正|zhèng] [是|shì] [小默默|xiǎo mò mò] [最|zuì] [怕|pà] [的|de] 。 [我们|wǒ men] [来|lái] [训练|xùn liàn] [吧|ba] ！'],
    ja: ['[相棒|あいぼう] は 、 [覚|おぼ]える の が [早|はや]い です ね 。 [練習|れんしゅう] しましょう ！', '[相棒|あいぼう] は 、 [言葉|ことば] を [覚|おぼ]える の が [早|はや]い です ね 。 それ こそ 、 だまりっこ が [一番|いちばん] [怖|こわ]がる もの です 。 さあ 、 [練習|れんしゅう] しましょう ！'],
    en: ["Your little {c.friend} learns fast. Let's train!", "Your little {c.friend} learns words fast, and words are what Hushlings fear. So: let's train!"] },
  'bruno.again': {
    es: ['¡Bien! Otra vez.', '¡Muy bien! Ahora, dos a la vez.'],
    pt: ['Boa! De novo.', 'Muito bem! Agora, dois de uma vez.'],
    de: ['Gut! Noch mal.', 'Sehr gut! Jetzt zwei auf einmal.'],
    zh: ['[好|hǎo] ！ [再|zài] [来|lái] [一|yī] [次|cì] 。', '[很|hěn] [好|hǎo] ！ [现在|xiàn zài] ， [一|yī] [次|cì] [来|lái] [两|liǎng] [个|gè] 。'],
    ja: ['よし ！ もう [一回|いっかい] 。', 'とても いい です ！ [今度|こんど] は 、 [二|ふた]つ [同時|どうじ] に 。'],
    en: ['{c.verygood}! Again.', '{c.verygood}! Now, two at once.'] },
  'bruno.fields': {
    es: ['Al este, en el campo, hay calladitos.', 'Mira: al este, en el campo, se están juntando los calladitos.'],
    pt: ['A leste, no campo, tem caladinhos.', 'Olha: a leste, no campo, os caladinhos estão se juntando.'],
    de: ['Im Osten, im Feld, sind Schweiglinge.', 'Schau: Im Osten, im Feld, sammeln sich die Schweiglinge.'],
    zh: ['[东边|dōng biān] [的|de] [田野|tián yě] [里|lǐ] [有|yǒu] [小默默|xiǎo mò mò] 。', '[看|kàn] ： [东边|dōng biān] [的|de] [田野|tián yě] [里|lǐ] ， [小默默|xiǎo mò mò] [越|yuè] [聚|jù] [越|yuè] [多|duō] 。'],
    ja: ['[東|ひがし] の [野原|のはら] に 、 だまりっこ が います 。', '[見|み]て ください 。 [東|ひがし] の [野原|のはら] に 、 だまりっこ が [集|あつ]まって います 。'],
    en: ['To the east, in the {c.field}, there are Hushlings.', '{c.look}: to the east, out in the {c.field}, the Hushlings are gathering.'] },
  'bruno.road': {
    es: ['Y en la colina hay uno grande. Está en el camino al norte.', 'Y en la colina hay uno grandote, justo en el camino al norte. Si quieres llegar a la {w.tower}, tienes que pasar por ahí.'],
    pt: ['E no morro tem um grandão. Ele está no caminho pro norte.', 'E no morro tem um grandão, bem no caminho pro norte. Se você quer chegar na {w.tower}, tem que passar por lá.'],
    de: ['Und auf dem Hügel ist ein großer. Er sitzt auf dem Weg nach Norden.', 'Und auf dem Hügel sitzt ein ganz großer, genau auf dem Weg nach Norden. Wenn du zum {w.tower} willst, musst du da vorbei.'],
    zh: ['[山坡|shān pō] [上|shàng] [还|hái] [有|yǒu] [一|yī] [个|gè] [大|dà] [的|de] 。 [它|tā] [就|jiù] [在|zài] [往|wǎng] [北|běi] [的|de] [路上|lù shang] 。', '[山坡|shān pō] [上|shàng] [还|hái] [有|yǒu] [一|yī] [个|gè] [大家伙|dà jiā huo] ， [正好|zhèng hǎo] [挡|dǎng] [在|zài] [往|wǎng] [北|běi] [的|de] [路上|lù shang] 。 [你|nǐ] [要是|yào shi] [想|xiǎng] [到|dào] {w.tower} [那里|nà lǐ] ， [就|jiù] [得|děi] [过|guò] [它|tā] [这|zhè] [一|yī] [关|guān] 。'],
    ja: ['それ から 、 [丘|おか] に [大|おお]きい の が います 。 [北|きた] へ の [道|みち] に いる ん です 。', 'それ に 、 [丘|おか] に は でっかい の が います 。 ちょうど 、 [北|きた] へ の [道|みち] の [上|うえ] です 。 {w.tower} まで [行|い]きたい なら 、 あそこ を [通|とお]らない と いけません 。'],
    en: ["And on the {c.hill}, there's a big one. It's on the road {c.north}.", "And on the {c.hill} sits a really big one, right on the road {c.north}. If you want to reach the {w.tower}, you'll have to get past it."] },
  'bruno.after': {
    es: ['¡Ve al campo! Está al este.', 'El campo está al este, pasando la puerta del este. Hay tres grupos de calladitos: ¡échalos a todos! Yo te espero aquí.'],
    pt: ['Vai pro campo! Fica a leste.', 'O campo fica a leste, passando o portão do leste. São três grupos de caladinhos: expulsa todos! Eu te espero aqui.'],
    de: ['Geh ins Feld! Es ist im Osten.', 'Das Feld ist im Osten, hinter dem Osttor. Dort sind drei Gruppen Schweiglinge: Verjag sie alle! Ich warte hier auf dich.'],
    zh: ['[去|qù] [田野|tián yě] [吧|ba] ！ [在|zài] [东边|dōng biān] 。', '[田野|tián yě] [在|zài] [东边|dōng biān] ， [出|chū] [了|le] [东门|dōng mén] [就|jiù] [是|shì] 。 [那里|nà lǐ] [有|yǒu] [三|sān] [群|qún] [小默默|xiǎo mò mò] ： [把|bǎ] [它们|tā men] [全|quán] [赶走|gǎn zǒu] ！ [我|wǒ] [在|zài] [这里|zhè lǐ] [等|děng] [你|nǐ] 。'],
    ja: ['[野原|のはら] へ [行|い]って ください ！ [東|ひがし] です 。', '[野原|のはら] は [東|ひがし] です 。 [東|ひがし] の [門|もん] を [出|で]た ところ です 。 だまりっこ の [群|む]れ が [三|みっ]つ あります 。 [全部|ぜんぶ] やっつけて ください ！ [私|わたし] は ここ で [待|ま]って います 。'],
    en: ["Go to the {c.field}! It's to the east.", "The {c.field} is to the east, past the east gate. Three groups of Hushlings: chase them all out! I'll be right here."] },
  // (why the field matters, and what to do there: the quest used to start without either)
  'bruno.quest': {
    es: ['¡Están poniendo gris el campo! Echa a los tres grupos.', 'Por donde pasan, llega el silencio. El campo ya se está poniendo gris. Hay tres grupos: échalos a todos y volverá el color.'],
    pt: ['Eles estão deixando o campo cinza! Expulsa os três grupos.', 'Por onde eles passam, chega o silêncio. O campo já está ficando cinza. São três grupos: expulsa todos e a cor volta.'],
    de: ['Sie machen das Feld grau! Verjag alle drei Gruppen.', 'Wo sie hinkommen, kommt die Stille. Das Feld wird schon grau. Es sind drei Gruppen: Verjag sie alle, dann kommt die Farbe zurück.'],
    zh: ['[它们|tā men] [正在|zhèng zài] [把|bǎ] [田野|tián yě] [变成|biàn chéng] [灰色|huī sè] ！ [把|bǎ] [三|sān] [群|qún] [都|dōu] [赶走|gǎn zǒu] ！', '[它们|tā men] [走到|zǒu dào] [哪里|nǎ lǐ] ， [寂静|jì jìng] [就|jiù] [跟|gēn] [到|dào] [哪里|nǎ lǐ] 。 [田野|tián yě] [已经|yǐ jīng] [开始|kāi shǐ] [变|biàn] [灰|huī] [了|le] 。 [一共|yī gòng] [有|yǒu] [三|sān] [群|qún] ： [把|bǎ] [它们|tā men] [都|dōu] [赶走|gǎn zǒu] ， [颜色|yán sè] [就|jiù] [会|huì] [回来|huí lái] 。'],
    ja: ['だまりっこ が [野原|のはら] を [灰色|はいいろ] に して います ！ [三|みっ]つ の [群|む]れ を [全部|ぜんぶ] やっつけて ください 。', 'だまりっこ が [通|とお]る と 、 [静寂|せいじゃく] が やって きます 。 [野原|のはら] は もう [灰色|はいいろ] に なって きて います 。 [群|む]れ は [三|みっ]つ です 。 [全部|ぜんぶ] やっつけたら 、 [色|いろ] が [戻|もど]って きます よ 。'],
    en: ["They're turning the {c.field} gray! Chase all three groups out.", "Wherever they go, the {c.silence} follows. The {c.field} is already going gray. There are three groups out there: chase them all out, and the color will come back."] },
  'bruno.how': {
    es: ['Acércate a un grupo y pelea con palabras, como practicamos.', 'Acércate a un grupo y te van a saltar encima. Entonces es como el entrenamiento: dile a tu amiguito qué hacer, con palabras.'],
    pt: ['Chega perto de um grupo e luta com palavras, como a gente treinou.', 'Chega perto de um grupo e eles pulam em você. Aí é igual ao treino: fala pro seu amiguinho o que fazer, com palavras.'],
    de: ['Geh nah an eine Gruppe ran und kämpf mit Wörtern, wie wir geübt haben.', 'Geh nah an eine Gruppe ran, dann springen sie dich an. Dann ist es wie im Training: Sag deinem kleinen Freund mit Wörtern, was er tun soll.'],
    zh: ['[走近|zǒu jìn] [一|yī] [群|qún] ， [然后|rán hòu] [用|yòng] [词|cí] [来|lái] [战斗|zhàn dòu] ， [就|jiù] [像|xiàng] [我们|wǒ men] [练习|liàn xí] [的|de] [那样|nà yàng] 。', '[走近|zǒu jìn] [一|yī] [群|qún] ， [它们|tā men] [就|jiù] [会|huì] [扑|pū] [上来|shàng lái] 。 [接下来|jiē xià lái] [就|jiù] [跟|gēn] [训练|xùn liàn] [一样|yī yàng] ： [用|yòng] [词|cí] [告诉|gào su] [你|nǐ] [的|de] [小伙伴|xiǎo huǒ bàn] [该|gāi] [做|zuò] [什么|shén me] 。'],
    ja: ['[群|む]れ に [近|ちか]づいて 、 [言葉|ことば] で [戦|たたか]って ください 。 [練習|れんしゅう] と [同|おな]じ です 。', '[群|む]れ に [近|ちか]づく と 、 [飛|と]びかかって きます 。 そこ から は [練習|れんしゅう] と [同|おな]じ です 。 [何|なに] を する か 、 [相棒|あいぼう] に [言葉|ことば] で [伝|つた]えて ください 。'],
    en: ["Walk up to a group, and fight with words, like we practiced.", "Walk right up to a group and they'll jump you. Then it's just like training: tell your little {c.friend} what to do, in words."] },
  'bruno.hill': {
    es: ['¡Espera! ¡Te ayudo!', '¡Espera! Ese calladón es fuerte. ¡Te ayudo!'],
    pt: ['Espera! Eu te ajudo!', 'Espera! Esse caladão é forte. Eu te ajudo!'],
    de: ['Warte! Ich helfe dir!', 'Warte! Der Riesenschweigling ist stark. Ich helfe dir!'],
    zh: ['[等等|děng deng] ！ [我|wǒ] [来|lái] [帮|bāng] [你|nǐ] ！', '[等等|děng deng] ！ [那个|nà gè] [大默默|dà mò mò] [很|hěn] [厉害|lì hai] 。 [我|wǒ] [来|lái] [帮|bāng] [你|nǐ] ！'],
    ja: ['[待|ま]って ください ！ [手伝|てつだ]います ！', '[待|ま]って ください ！ あの [大|おお]だまりっこ は [強|つよ]い です 。 [手伝|てつだ]います ！'],
    en: ["{c.wait}! I'll help you!", "{c.wait}! That big Hushling is strong. I'll help you!"] },
  'bruno.done': {
    es: ['¡Bravo! El silencio se va.', '¡Bravo! ¿Ves? El color vuelve. El silencio no es tan fuerte.'],
    pt: ['Bravo! O silêncio vai embora.', 'Bravo! Viu? A cor está voltando. O silêncio não é tão forte assim.'],
    de: ['Bravo! Die Stille geht weg.', 'Bravo! Siehst du? Die Farbe kommt zurück. Die Stille ist gar nicht so stark.'],
    zh: ['[好样|hǎo yàng] [的|de] ！ [寂静|jì jìng] [在|zài] [消失|xiāo shī] 。', '[好样|hǎo yàng] [的|de] ！ [看到|kàn dào] [了|le] [吗|ma] ？ [颜色|yán sè] [回来|huí lái] [了|le] 。 [寂静|jì jìng] [也|yě] [没|méi] [那么|nà me] [厉害|lì hai] 。'],
    ja: ['お[見事|みごと] ！ [静寂|せいじゃく] が [消|き]えて いきます 。', 'お[見事|みごと] ！ ほら 、 [色|いろ] が [戻|もど]って きました 。 [静寂|せいじゃく] なんて 、 そんな に [強|つよ]く ない ん です よ 。'],
    en: ['Bravo! The {c.silence} is leaving.', "Bravo! See? The color's coming back. The {c.silence} isn't that strong after all."] },
  'page.tower': {
    es: ['La {w.tower} vieja, en el norte. Ahí empezó el silencio.'], pt: ['A {w.tower} velha, no norte. Foi lá que o silêncio começou.'], de: ['Der alte {w.tower} im Norden. Dort hat die Stille angefangen.'],
    zh: ['[北边|běi biān] [的|de] [古|gǔ] {w.tower} 。 [寂静|jì jìng] [就|jiù] [是|shì] [从|cóng] [那里|nà lǐ] [开始|kāi shǐ] [的|de] 。'],
    ja: ['[北|きた] の [古|ふる]い {w.tower} 。 [静寂|せいじゃく] は 、 あそこ から [始|はじ]まった 。'],
    en: ['The old tower, up north. That’s where the silence started.'] },
  // Chapter 1: the eight bells (DESIGN.md 14.1–14.2)
  'bruno.shut': {
    es: ['La puerta de la {w.tower} está cerrada. El relojero de Molinar sabe por qué.', 'La puerta de la {w.tower} está cerrada desde que llegó el Silencio. El relojero de Molinar conoce esa torre mejor que nadie. Noa también fue a verlo.'],
    pt: ['A porta da {w.tower} está fechada. O relojoeiro de Molinar sabe por quê.', 'A porta da {w.tower} está fechada desde que o Silêncio chegou. O relojoeiro de Molinar conhece aquela torre como ninguém. A Noa também foi falar com ele.'],
    de: ['Die Tür vom {w.tower} ist zu. Der Uhrmacher in Molinar weiß, warum.', 'Die Tür vom {w.tower} ist zu, seit die Stille gekommen ist. Der Uhrmacher in Molinar kennt den Turm besser als jeder andere. Noa war auch bei ihm.'],
    zh: ['{w.tower} [的|de] [门|mén] [关|guān] [着|zhe] 。 [磨坊镇|Mò fáng zhèn] [的|de] [钟表匠|zhōng biǎo jiàng] [知道|zhī dào] [为什么|wèi shén me] 。', '[自从|zì cóng] [寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， {w.tower} [的|de] [门|mén] [就|jiù] [一直|yī zhí] [关|guān] [着|zhe] 。 [磨坊镇|Mò fáng zhèn] [的|de] [钟表匠|zhōng biǎo jiàng] [比|bǐ] [谁|shéi] [都|dōu] [了解|liǎo jiě] [那|nà] [座|zuò] [塔|tǎ] 。 [诺娅|Nuò yà] [也|yě] [去|qù] [找|zhǎo] [过|guo] [他|tā] 。'],
    ja: ['{w.tower} の [扉|とびら] は [閉|し]まって います 。 モリナール の [時計屋|とけいや] さん が 、 [理由|りゆう] を [知|し]って います 。', '[静寂|せいじゃく] が [来|き]て から 、 {w.tower} の [扉|とびら] は ずっと [閉|し]まった まま です 。 モリナール の [時計屋|とけいや] さん は 、 あの [塔|とう] の こと を だれ より も よく [知|し]って います 。 ノア も [会|あ]い に [行|い]きました よ 。'],
    en: ["The {w.tower}'s door is shut. The clockmaker in Molinar knows why.", "The {w.tower}'s door has been shut since the Hush came. The clockmaker in Molinar knows that tower better than anyone. Noa went to see him too."] },
  'bruno.east': {
    es: ['Molinar está al este. Sigue el camino.', 'Molinar, el pueblo de los molinos, está al este, después de las colinas. Sal por la puerta del este y sigue el camino.'],
    pt: ['Molinar fica a leste. Siga o caminho.', 'Molinar, a cidade dos moinhos, fica a leste, depois das colinas. Saia pelo portão do leste e siga o caminho.'],
    de: ['Molinar liegt im Osten. Folg dem Weg.', 'Molinar, die Stadt der Mühlen, liegt im Osten, hinter den Hügeln. Geh durch das Osttor und folg dem Weg.'],
    zh: ['[磨坊镇|Mò fáng zhèn] [在|zài] [东边|dōng biān] 。 [顺着|shùn zhe] [路|lù] [走|zǒu] [就|jiù] [到|dào] [了|le] 。', '[磨坊镇|Mò fáng zhèn] [在|zài] [东边|dōng biān] ， [翻过|fān guò] [那些|nà xiē] [山坡|shān pō] [就|jiù] [是|shì] 。 [那里|nà lǐ] [到处|dào chù] [都|dōu] [是|shì] [风车|fēng chē] 。 [从|cóng] [东门|dōng mén] [出去|chū qù] ， [顺着|shùn zhe] [路|lù] [走|zǒu] 。'],
    ja: ['モリナール は [東|ひがし] です 。 この [道|みち] を [行|い]って ください 。', 'モリナール は [風車|ふうしゃ] の [町|まち] です 。 [東|ひがし] の [丘|おか] を [越|こ]えた ところ に あります 。 [東|ひがし] の [門|もん] から [出|で]て 、 [道|みち] に [沿|そ]って [行|い]って ください 。'],
    en: ['Molinar is to the east. Follow the road.', 'Molinar, the town of mills, is to the east, past the hills. Go out the east gate and follow the road.'] },
  'farmer.push': {
    es: ['¡Eso! Empujo mi carreta.', '¡Eso es! Empujo esta carreta todos los días. ¡Pesa mucho!'],
    pt: ['Isso! Eu empurro minha carroça.', 'Isso mesmo! Eu empurro esta carroça todo dia. Pesa muito!'],
    de: ['Genau! Ich schiebe meinen Karren.', 'Genau! Ich schiebe diesen Karren jeden Tag. Der ist schwer!'],
    zh: ['[对|duì] ！ [我|wǒ] [在|zài] [推|tuī] [车|chē] 。', '[没错|méi cuò] ！ [我|wǒ] [每天|měi tiān] [都|dōu] [推|tuī] [这|zhè] [辆|liàng] [车|chē] 。 [可|kě] [重|zhòng] [了|le] ！'],
    ja: ['そう です ！ [荷車|にぐるま] を [押|お]して います 。', 'その とおり です ！ [毎日|まいにち] 、 この [荷車|にぐるま] を [押|お]して いる ん です よ 。 とても [重|おも]い ん です ！'],
    en: ["That's it! I push my cart.", "That's it! I push this cart every day. It's heavy!"] },
  'farmer.rock': {
    es: ['Hay una {w.stone} enorme en el paso. El camino a Molinar está cerrado.', 'Ay, una {w.stone} enorme bloquea el paso. Nadie puede llegar a Molinar. Tu amiguito es fuerte… ¿por qué no la empuja?'],
    pt: ['Tem uma {w.stone} enorme na passagem. O caminho para Molinar está fechado.', 'Ai, uma {w.stone} enorme está bloqueando a passagem. Ninguém consegue chegar em Molinar. Seu amiguinho é forte… por que ele não empurra?'],
    de: ['Ein riesiger {w.stone} liegt im Pass. Der Weg nach Molinar ist zu.', 'Ach, ein riesiger {w.stone} versperrt den Pass. Niemand kommt nach Molinar. Dein kleiner Freund ist stark… warum schiebt er ihn nicht?'],
    zh: ['[山口|shān kǒu] [那里|nà lǐ] [有|yǒu] [一|yī] [块|kuài] [很|hěn] [大|dà] [的|de] {w.stone} 。 [去|qù] [磨坊镇|Mò fáng zhèn] [的|de] [路|lù] [不|bù] [通|tōng] [了|le] 。', '[唉|ài] ， [一|yī] [块|kuài] [巨大|jù dà] [的|de] {w.stone} [堵住|dǔ zhù] [了|le] [山口|shān kǒu] 。 [谁|shéi] [都|dōu] [去不了|qù bù liǎo] [磨坊镇|Mò fáng zhèn] 。 [你|nǐ] [的|de] [小伙伴|xiǎo huǒ bàn] [力气|lì qi] [很|hěn] [大|dà] …… [为什么|wèi shén me] [不|bù] [让|ràng] [它|tā] [推|tuī] [一|yī] [推|tuī] [呢|ne] ？'],
    ja: ['[峠|とうげ] に [大|おお]きな {w.stone} が あります 。 モリナール へ の [道|みち] が ふさがって います 。', 'ああ 、 [大|おお]きな {w.stone} が [峠|とうげ] を ふさいで いる ん です 。 だれ も モリナール へ [行|い]けません 。 [小|ちい]さな お[友達|ともだち] は [力持|ちからも]ち です ね …… [押|お]して みたら どう です か ？'],
    en: ["There's a huge {w.stone} in the pass. The road to Molinar is blocked.", "Oh, a huge {w.stone} is blocking the pass. Nobody can get to Molinar. Your little {c.friend} is strong… why doesn't it push it?"] },
  'farmer.thanks': {
    es: ['¡El camino está abierto! ¡Gracias!', '¡El camino está abierto otra vez! Mañana llevo mi trigo a Molinar. ¡Gracias, de verdad!'],
    pt: ['O caminho está aberto! Obrigada!', 'O caminho está aberto de novo! Amanhã eu levo meu trigo para Molinar. Obrigada, de verdade!'],
    de: ['Der Weg ist frei! Danke!', 'Der Weg ist wieder frei! Morgen bringe ich mein Korn nach Molinar. Vielen Dank!'],
    zh: ['[路|lù] [通|tōng] [了|le] ！ [谢谢|xiè xie] ！', '[路|lù] [又|yòu] [通|tōng] [了|le] ！ [明天|míng tiān] [我|wǒ] [就|jiù] [把|bǎ] [小麦|xiǎo mài] [运到|yùn dào] [磨坊镇|Mò fáng zhèn] [去|qù] 。 [真|zhēn] [的|de] [太|tài] [谢谢|xiè xie] [你|nǐ] [了|le] ！'],
    ja: ['[道|みち] が [通|とお]れます ！ ありがとう ございます ！', 'また [道|みち] が [通|とお]れる よう に なりました ！ [明日|あした] 、 [小麦|こむぎ] を モリナール へ [運|はこ]びます 。 [本当|ほんとう] に ありがとう ございます ！'],
    en: ['The road is open! {c.thanks:f}!', "The road is open again! Tomorrow I'll take my wheat to Molinar. {c.thanks:f}, really!"] },
  'ciro.hello': {
    es: ['¡Bienvenidos! Soy Ciro, el relojero.', '¡Bienvenidos a mi taller! Soy Ciro, el relojero. Qué raro: hace semanas que nadie cruza el paso.'],
    pt: ['Bem-vindos! Eu sou o Ciro, o relojoeiro.', 'Bem-vindos à minha oficina! Eu sou o Ciro, o relojoeiro. Que estranho: faz semanas que ninguém atravessa a passagem.'],
    de: ['Willkommen! Ich bin Ciro, der Uhrmacher.', 'Willkommen in meiner Werkstatt! Ich bin Ciro, der Uhrmacher. Seltsam: Seit Wochen kommt niemand mehr über den Pass.'],
    zh: ['[欢迎|huān yíng] ！ [我|wǒ] [是|shì] [钟表匠|zhōng biǎo jiàng] [西罗|Xī luó] 。', '[欢迎|huān yíng] [来到|lái dào] [我|wǒ] [的|de] [工作室|gōng zuò shì] ！ [我|wǒ] [是|shì] [钟表匠|zhōng biǎo jiàng] [西罗|Xī luó] 。 [真|zhēn] [奇怪|qí guài] ， [好|hǎo] [几|jǐ] [个|gè] [星期|xīng qī] [没有|méi yǒu] [人|rén] [翻过|fān guò] [山口|shān kǒu] [了|le] 。'],
    ja: ['ようこそ ！ [時計屋|とけいや] の シロ です 。', '[私|わたし] の [工房|こうぼう] へ ようこそ ！ [時計屋|とけいや] の シロ です 。 [珍|めずら]しい です ね 。 もう [何週間|なんしゅうかん] も 、 だれ も [峠|とうげ] を [越|こ]えて [来|こ]なかった ん です よ 。'],
    en: ["Welcome! I'm Ciro, the clockmaker.", "Welcome to my workshop! I'm Ciro, the clockmaker. How odd: nobody's come over the pass in weeks."] },
  'ciro.noa': {
    es: ['¿Noa? Sí, la conozco. Ella quiere abrir la {w.tower}.', '¿Noa? Sí, vino a verme hace tres semanas. Quería abrir la {w.tower}, como ustedes. Después se fue al norte.'],
    pt: ['A Noa? Sim, eu conheço. Ela quer abrir a {w.tower}.', 'A Noa? Sim, ela veio me ver faz três semanas. Queria abrir a {w.tower}, como vocês. Depois foi para o norte.'],
    de: ['Noa? Ja, ich kenne sie. Sie will den {w.tower} öffnen.', 'Noa? Ja, sie war vor drei Wochen hier. Sie wollte den {w.tower} öffnen, genau wie ihr. Dann ist sie nach Norden gegangen.'],
    zh: ['[诺娅|Nuò yà] ？ [对|duì] ， [我|wǒ] [认识|rèn shi] [她|tā] 。 [她|tā] [想|xiǎng] [打开|dǎ kāi] {w.tower} [的|de] [门|mén] 。', '[诺娅|Nuò yà] ？ [对|duì] ， [她|tā] [三|sān] [个|gè] [星期|xīng qī] [以前|yǐ qián] [来|lái] [找|zhǎo] [过|guo] [我|wǒ] 。 [她|tā] [跟|gēn] [你们|nǐ men] [一样|yī yàng] ， [想|xiǎng] [打开|dǎ kāi] {w.tower} [的|de] [门|mén] 。 [后来|hòu lái] [她|tā] [去|qù] [了|le] [北边|běi biān] 。'],
    ja: ['ノア ？ ええ 、 [知|し]って います よ 。 {w.tower} の [扉|とびら] を [開|あ]けたい と [言|い]って いました 。', 'ノア ？ ええ 、 [三週間|さんしゅうかん] [前|まえ] に [会|あ]い に [来|き]ました よ 。 みなさん と [同|おな]じ で 、 {w.tower} の [扉|とびら] を [開|あ]けたがって いました 。 その [後|あと] 、 [北|きた] へ [行|い]きました 。'],
    en: ['Noa? Yes, I know her. She wants to open the {w.tower}.', 'Noa? Yes, she came to see me three weeks ago. She wanted to open the {w.tower}, just like you. Then she went {c.north}.'] },
  'ciro.bells': {
    es: ['La {w.tower} tiene un gran reloj y ocho campanas. Las campanas no suenan. Si suenan, la puerta se abre.', 'La {w.tower} tiene un gran reloj, y ocho campanas, en ocho tierras, le contestaban. El Silencio las calló a todas, y el reloj se paró. Si las ocho vuelven a sonar, la puerta se abre.'],
    pt: ['A {w.tower} tem um grande relógio e oito sinos. Os sinos não tocam. Se eles tocarem, a porta abre.', 'A {w.tower} tem um grande relógio, e oito sinos, em oito terras, respondiam a ele. O Silêncio calou todos, e o relógio parou. Se os oito tocarem de novo, a porta se abre.'],
    de: ['Der {w.tower} hat eine große Uhr und acht Glocken. Die Glocken läuten nicht. Wenn sie läuten, geht die Tür auf.', 'Der {w.tower} hat eine große Uhr, und acht Glocken in acht Ländern haben ihr geantwortet. Die Stille hat sie alle verstummen lassen, und die Uhr ist stehen geblieben. Wenn alle acht wieder läuten, geht die Tür auf.'],
    zh: ['{w.tower} [上|shàng] [有|yǒu] [一|yī] [个|gè] [大|dà] [时钟|shí zhōng] [和|hé] [八|bā] [口|kǒu] [钟|zhōng] 。 [这些|zhè xiē] [钟|zhōng] [都|dōu] [不|bù] [响|xiǎng] [了|le] 。 [只要|zhǐ yào] [它们|tā men] [响|xiǎng] [起来|qǐ lái] ， [门|mén] [就|jiù] [会|huì] [开|kāi] 。', '{w.tower} [上|shàng] [有|yǒu] [一|yī] [个|gè] [大|dà] [时钟|shí zhōng] 。 [以前|yǐ qián] ， [八|bā] [个|gè] [地方|dì fang] [的|de] [八|bā] [口|kǒu] [钟|zhōng] [都|dōu] [会|huì] [回应|huí yìng] [它|tā] 。 [寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [所有|suǒ yǒu] [的|de] [钟|zhōng] [都|dōu] [不|bù] [响|xiǎng] [了|le] ， [时钟|shí zhōng] [也|yě] [停|tíng] [了|le] 。 [要是|yào shi] [八|bā] [口|kǒu] [钟|zhōng] [再|zài] [响|xiǎng] [起来|qǐ lái] ， [门|mén] [就|jiù] [会|huì] [打开|dǎ kāi] 。'],
    ja: ['{w.tower} に は 、 [大|おお]きな [時計|とけい] と [八|やっ]つ の [鐘|かね] が あります 。 [今|いま] は 、 [鐘|かね] が [鳴|な]りません 。 [鐘|かね] が [鳴|な]れば 、 [扉|とびら] が [開|ひら]きます 。', '{w.tower} に は 、 [大|おお]きな [時計|とけい] が あります 。 [昔|むかし] は 、 [八|やっ]つ の [国|くに] に ある [鐘|かね] が 、 その [時計|とけい] に [答|こた]えて いました 。 でも [静寂|せいじゃく] が [鐘|かね] を [全部|ぜんぶ] [黙|だま]らせて 、 [時計|とけい] も [止|と]まって しまいました 。 [八|やっ]つ の [鐘|かね] が また [鳴|な]れば 、 [扉|とびら] が [開|ひら]きます 。'],
    en: ['The {w.tower} has a great clock and eight bells. The bells are silent. If they ring, the door opens.', 'The {w.tower} has a great clock, and eight bells in eight lands used to answer it. The Hush silenced them all, and the clock stopped. If all eight ring again, the door will open.'] },
  'ciro.mill': {
    es: ['Nuestra campana está en el Gran Molino. Pero el molino está callado.', 'La campana de Molinar está arriba, en el Gran Molino. Pero el Silencio entró en el molino y ya no gira. Hay calladitos adentro… y algo más grande.'],
    pt: ['O nosso sino está no Grande Moinho. Mas o moinho está calado.', 'O sino de Molinar fica lá em cima, no Grande Moinho. Mas o Silêncio entrou no moinho e ele não gira mais. Tem caladinhos lá dentro… e uma coisa maior.'],
    de: ['Unsere Glocke ist in der Großen Mühle. Aber die Mühle ist still.', 'Die Glocke von Molinar hängt oben in der Großen Mühle. Aber die Stille ist in die Mühle gekommen, und sie dreht sich nicht mehr. Drinnen sind Schweiglinge… und etwas Größeres.'],
    zh: ['[我们|wǒ men] [的|de] [钟|zhōng] [在|zài] [大磨坊|Dà mò fáng] [里|lǐ] 。 [可是|kě shì] [磨坊|mò fáng] [没有|méi yǒu] [声音|shēng yīn] [了|le] 。', '[磨坊镇|Mò fáng zhèn] [的|de] [钟|zhōng] [挂|guà] [在|zài] [大磨坊|Dà mò fáng] [的|de] [最|zuì] [上面|shàng mian] 。 [可是|kě shì] [寂静|Jì jìng] [进|jìn] [了|le] [磨坊|mò fáng] ， [风车|fēng chē] [再|zài] [也|yě] [不|bù] [转|zhuàn] [了|le] 。 [里面|lǐ mian] [有|yǒu] [小默默|xiǎo mò mò] …… [还|hái] [有|yǒu] [更|gèng] [大|dà] [的|de] [东西|dōng xi] 。'],
    ja: ['[私|わたし]たち の [鐘|かね] は 、 [大風車|だいふうしゃ] に あります 。 でも 、 [風車|ふうしゃ] は [静|しず]か に なって しまいました 。', 'モリナール の [鐘|かね] は 、 [大風車|だいふうしゃ] の [上|うえ] に あります 。 でも 、 [静寂|せいじゃく] が [風車|ふうしゃ] に [入|はい]りこんで 、 もう [回|まわ]りません 。 [中|なか] に は だまりっこ が います …… それ に 、 もっと [大|おお]きな [何|なに]か も 。'],
    en: ['Our bell is in the Great Mill. But the mill is silent.', "Molinar's bell hangs up in the Great Mill. But the Hush got into the mill, and it doesn't turn anymore. There are Hushlings inside… and something bigger."] },
  'page.mill': {
    es: ['Desde aquí arriba se ve la {w.tower}. De noche hay una luz en la ventana. Alguien vive allí.'],
    pt: ['Daqui de cima dá para ver a {w.tower}. De noite tem uma luz na janela. Alguém mora lá.'],
    de: ['Von hier oben sieht man den {w.tower}. Nachts brennt ein Licht im Fenster. Dort wohnt jemand.'],
    zh: ['[在|zài] [这|zhè] [上面|shàng mian] [能|néng] [看到|kàn dào] {w.tower} 。 [晚上|wǎn shang] [窗户|chuāng hu] [里|lǐ] [有|yǒu] [灯光|dēng guāng] 。 [有|yǒu] [人|rén] [住|zhù] [在|zài] [那里|nà lǐ] 。'],
    ja: ['この [上|うえ] から 、 {w.tower} が [見|み]える 。 [夜|よる] は [窓|まど] に [明|あ]かり が つく 。 だれか が [住|す]んで いる 。'],
    en: ['From up here you can see the tower. At night there’s a light in the window. Someone lives there.'] },
  'ciro.firstbell': {
    es: ['¡La primera campana! Una de ocho.', '¡La primera campana! ¿La oyen? Una de ocho. Gracias, de verdad: Molinar vuelve a cantar.'],
    pt: ['O primeiro sino! Um de oito.', 'O primeiro sino! Estão ouvindo? Um de oito. Obrigado, de verdade: Molinar voltou a cantar.'],
    de: ['Die erste Glocke! Eine von acht.', 'Die erste Glocke! Hört ihr sie? Eine von acht. Danke, wirklich: Molinar singt wieder.'],
    zh: ['[第一|dì yī] [口|kǒu] [钟|zhōng] ！ [八|bā] [口|kǒu] [里|lǐ] [的|de] [一|yī] [口|kǒu] 。', '[第一|dì yī] [口|kǒu] [钟|zhōng] ！ [你们|nǐ men] [听到|tīng dào] [了|le] [吗|ma] ？ [八|bā] [口|kǒu] [里|lǐ] [的|de] [一|yī] [口|kǒu] 。 [真|zhēn] [的|de] [谢谢|xiè xie] [你们|nǐ men] ： [磨坊镇|Mò fáng zhèn] [又|yòu] [唱|chàng] [起|qǐ] [歌|gē] [来|lái] [了|le] 。'],
    ja: ['[最初|さいしょ] の [鐘|かね] です ！ [八|やっ]つ の うち の [一|ひと]つ 。', '[最初|さいしょ] の [鐘|かね] です ！ [聞|き]こえます か ？ [八|やっ]つ の うち の [一|ひと]つ です 。 [本当|ほんとう] に ありがとう ございます 。 モリナール が また [歌|うた]って います 。'],
    en: ['The first bell! One of eight.', 'The first bell! Do you hear it? One of eight. {c.thanks}, really: Molinar sings again.'] },
  'ciro.next': {
    es: ['La próxima campana está en el Lago Espejo, al oeste de Alba.', 'La próxima campana está en el Lago Espejo, al oeste de Alba. Dicen que allí la campana flota sobre el agua.'],
    pt: ['O próximo sino está no Lago Espelho, a oeste de Alba.', 'O próximo sino está no Lago Espelho, a oeste de Alba. Dizem que lá o sino flutua na água.'],
    de: ['Die nächste Glocke ist am Spiegelsee, westlich von Alba.', 'Die nächste Glocke ist am Spiegelsee, westlich von Alba. Man sagt, dort schwimmt die Glocke auf dem Wasser.'],
    zh: ['[下|xià] [一|yī] [口|kǒu] [钟|zhōng] [在|zài] [镜湖|Jìng hú] ， [在|zài] [阿尔巴|Ā ěr bā] [的|de] [西边|xī biān] 。', '[下|xià] [一|yī] [口|kǒu] [钟|zhōng] [在|zài] [镜湖|Jìng hú] ， [在|zài] [阿尔巴|Ā ěr bā] [的|de] [西边|xī biān] 。 [听说|tīng shuō] [那里|nà lǐ] [的|de] [钟|zhōng] [浮|fú] [在|zài] [水|shuǐ] [上|shàng] 。'],
    ja: ['[次|つぎ] の [鐘|かね] は 、 アルバ の [西|にし] の [鏡湖|かがみこ] に あります 。', '[次|つぎ] の [鐘|かね] は 、 アルバ の [西|にし] の [鏡湖|かがみこ] に あります 。 そこ で は 、 [鐘|かね] が [水|みず] に [浮|う]いて いる そう です よ 。'],
    en: ['The next bell is at the Mirror Lake, west of Alba.', 'The next bell is at the Mirror Lake, west of Alba. They say the bell there floats on the {w.water}.'] },
  // Region 2: the Mirror Lake (DESIGN.md 14.5)
  'lalo.swim': {
    es: ['¡Sí! ¡Nado aquí todos los días!', '¡Sí! Nado aquí todos los días. El agua está fría, ¡pero me encanta!'],
    pt: ['Sim! Eu nado aqui todo dia!', 'Sim! Eu nado aqui todo dia. A água está fria, mas eu adoro!'],
    de: ['Ja! Ich schwimme hier jeden Tag!', 'Ja! Ich schwimme hier jeden Tag. Das Wasser ist kalt, aber ich liebe es!'],
    zh: ['[对|duì] [呀|ya] ！ [我|wǒ] [每天|měi tiān] [都|dōu] [在|zài] [这里|zhè lǐ] [游泳|yóu yǒng] ！', '[对|duì] [呀|ya] ！ [我|wǒ] [每天|měi tiān] [都|dōu] [在|zài] [这里|zhè lǐ] [游泳|yóu yǒng] 。 [水|shuǐ] [很|hěn] [凉|liáng] ， [可是|kě shì] [我|wǒ] [超|chāo] [喜欢|xǐ huan] ！'],
    ja: ['うん ！ [毎日|まいにち] ここ で [泳|およ]いでる ん だ ！', 'うん ！ [毎日|まいにち] ここ で [泳|およ]いでる ん だ 。 [水|みず] は [冷|つめ]たい けど 、 [大好|だいす]き ！'],
    en: ['Yes! I swim here every day!', 'Yes! I swim here every day. The {w.water}’s cold, but I love it!'] },
  'lalo.raft': {
    es: ['El puente está roto. Pero hay una balsa en el muelle.', 'El puente está roto desde que llegó el Silencio. Pero hay una balsa en el muelle. Tu amiguito nada bien… ¡puede tirar de la balsa!'],
    pt: ['A ponte está quebrada. Mas tem uma balsa no cais.', 'A ponte está quebrada desde que o Silêncio chegou. Mas tem uma balsa no cais. Seu amiguinho nada bem… ele pode puxar a balsa!'],
    de: ['Die Brücke ist kaputt. Aber am Steg liegt ein Floß.', 'Die Brücke ist kaputt, seit die Stille da ist. Aber am Steg liegt ein Floß. Dein kleiner Freund schwimmt gut… er kann das Floß ziehen!'],
    zh: ['[桥|qiáo] [断|duàn] [了|le] 。 [不过|bù guò] [码头|mǎ tou] [那里|nà lǐ] [有|yǒu] [一|yī] [个|gè] [木筏|mù fá] 。', '[寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [桥|qiáo] [就|jiù] [断|duàn] [了|le] 。 [不过|bù guò] [码头|mǎ tou] [那里|nà lǐ] [有|yǒu] [一|yī] [个|gè] [木筏|mù fá] 。 [你|nǐ] [的|de] [小伙伴|xiǎo huǒ bàn] [游泳|yóu yǒng] [游|yóu] [得|de] [很|hěn] [好|hǎo] …… [它|tā] [可以|kě yǐ] [拉|lā] [木筏|mù fá] ！'],
    ja: ['[橋|はし] が [壊|こわ]れてる ん だ 。 でも 、 [桟橋|さんばし] に いかだ が ある よ 。', '[静寂|せいじゃく] が [来|き]て から 、 [橋|はし] が [壊|こわ]れてる ん だ 。 でも 、 [桟橋|さんばし] に いかだ が ある よ 。 その [子|こ] 、 [泳|およ]ぐ の が うまい ね …… いかだ を [引|ひ]っぱれる よ ！'],
    en: ['The {w.bridge} is broken. But there’s a raft at the dock.', 'The {w.bridge} has been broken since the Hush came. But there’s a raft at the dock. Your little {c.friend} swims well… it could pull the raft!'] },
  'lalo.marina': {
    es: ['En Remanso, busca a Marina. Ella sabe todo del lago.', 'Si buscas la campana, habla con Marina, la jefa de Remanso. Ella sabe todo del lago.'],
    pt: ['Em Remanso, procure a Marina. Ela sabe tudo do lago.', 'Se você procura o sino, fale com a Marina, a chefe de Remanso. Ela sabe tudo do lago.'],
    de: ['In Remanso, such Marina. Sie weiß alles über den See.', 'Wenn du die Glocke suchst, sprich mit Marina, der Chefin von Remanso. Sie weiß alles über den See.'],
    zh: ['[到|dào] [了|le] [静水村|Jìng shuǐ cūn] ， [去|qù] [找|zhǎo] [玛丽娜|Mǎ lì nà] 。 [湖|hú] [的|de] [事|shì] [她|tā] [全|quán] [知道|zhī dào] 。', '[你|nǐ] [要是|yào shi] [在|zài] [找|zhǎo] [钟|zhōng] ， [就|jiù] [去|qù] [找|zhǎo] [玛丽娜|Mǎ lì nà] ， [她|tā] [是|shì] [静水村|Jìng shuǐ cūn] [的|de] [村长|cūn zhǎng] 。 [湖|hú] [的|de] [事|shì] [她|tā] [全|quán] [知道|zhī dào] 。'],
    ja: ['レマンソ で 、 マリーナ さん を [探|さが]して ね 。 [湖|みずうみ] の こと 、 [全部|ぜんぶ] [知|し]ってる よ 。', '[鐘|かね] を [探|さが]してる なら 、 マリーナ さん と [話|はな]して ね 。 レマンソ の [村長|そんちょう] さん だ よ 。 [湖|みずうみ] の こと 、 [全部|ぜんぶ] [知|し]ってる ん だ 。'],
    en: ['In Remanso, look for Marina. She knows everything about the lake.', 'If you’re looking for the bell, talk to Marina, the head of Remanso. She knows everything about the lake.'] },
  'marina.hello': {
    es: ['¡Hola! Soy Marina. Bienvenidos a Remanso.', '¡Hola! Soy Marina, la jefa de Remanso. ¡Qué raro ver gente nueva! Desde el Silencio, nadie viene al lago.'],
    pt: ['Oi! Eu sou a Marina. Bem-vindos a Remanso.', 'Oi! Eu sou a Marina, a chefe de Remanso. Que estranho ver gente nova! Desde o Silêncio, ninguém vem ao lago.'],
    de: ['Hallo! Ich bin Marina. Willkommen in Remanso.', 'Hallo! Ich bin Marina, die Chefin von Remanso. Wie seltsam, neue Leute zu sehen! Seit der Stille kommt niemand mehr an den See.'],
    zh: ['[你们|nǐ men] [好|hǎo] ！ [我|wǒ] [是|shì] [玛丽娜|Mǎ lì nà] 。 [欢迎|huān yíng] [来到|lái dào] [静水村|Jìng shuǐ cūn] 。', '[你们|nǐ men] [好|hǎo] ！ [我|wǒ] [是|shì] [玛丽娜|Mǎ lì nà] ， [静水村|Jìng shuǐ cūn] [的|de] [村长|cūn zhǎng] 。 [真|zhēn] [难得|nán dé] [看到|kàn dào] [新|xīn] [面孔|miàn kǒng] ！ [自从|zì cóng] [寂静|Jì jìng] [来|lái] [了|le] ， [就|jiù] [没|méi] [人|rén] [来|lái] [湖边|hú biān] [了|le] 。'],
    ja: ['こんにちは ！ マリーナ です 。 レマンソ へ ようこそ 。', 'こんにちは ！ レマンソ の [村長|そんちょう] 、 マリーナ です 。 [新|あたら]しい [方|かた] に [会|あ]う の は 、 [珍|めずら]しい です ね ！ [静寂|せいじゃく] が [来|き]て から 、 だれ も [湖|みずうみ] に [来|こ]なく なりました 。'],
    en: ['{w.hello}! I’m Marina. Welcome to Remanso.', '{w.hello}! I’m Marina, the head of Remanso. How odd to see new faces! Since the Hush, nobody comes to the lake.'] },
  'marina.bell': {
    es: ['La campana está en el agua, al lado de la isla. Ya no suena.', 'Nuestra campana flota en el agua, al lado de la isla. Antes sonaba con cada ola… ahora está gris y callada.'],
    pt: ['O sino está na água, ao lado da ilha. Ele não toca mais.', 'O nosso sino flutua na água, ao lado da ilha. Antes ele tocava com cada onda… agora está cinza e calado.'],
    de: ['Die Glocke ist im Wasser, neben der Insel. Sie läutet nicht mehr.', 'Unsere Glocke schwimmt im Wasser, neben der Insel. Früher hat sie bei jeder Welle geläutet… jetzt ist sie grau und still.'],
    zh: ['[钟|zhōng] [在|zài] [水|shuǐ] [里|lǐ] ， [在|zài] [小岛|xiǎo dǎo] [旁边|páng biān] 。 [它|tā] [已经|yǐ jīng] [不|bù] [响|xiǎng] [了|le] 。', '[我们|wǒ men] [的|de] [钟|zhōng] [浮|fú] [在|zài] [水|shuǐ] [上|shàng] ， [就|jiù] [在|zài] [小岛|xiǎo dǎo] [旁边|páng biān] 。 [以前|yǐ qián] [每|měi] [来|lái] [一|yī] [个|gè] [浪|làng] ， [它|tā] [就|jiù] [响|xiǎng] [一|yī] [声|shēng] …… [现在|xiàn zài] [它|tā] [又|yòu] [灰|huī] [又|yòu] [静|jìng] 。'],
    ja: ['[鐘|かね] は 、 [島|しま] の そば の [水|みず] に あります 。 もう [鳴|な]りません 。', '[私|わたし]たち の [鐘|かね] は 、 [島|しま] の そば の [水|みず] に [浮|う]いて います 。 [前|まえ] は 、 [波|なみ] が [来|く]る たび に [鳴|な]って いました …… [今|いま] は [灰色|はいいろ] で 、 [黙|だま]った まま です 。'],
    en: ['The bell is in the {w.water}, next to the island. It doesn’t ring anymore.', 'Our bell floats on the {w.water}, next to the island. It used to ring with every wave… now it’s gray and silent.'] },
  'marina.bartolo': {
    es: ['Solo Bartolo va a la isla. Pero Bartolo ya no habla.', 'Solo Bartolo, el barquero, sabe llegar a la isla. Pero el Silencio le quitó las palabras. Está en el muelle, gris, sin hablar.'],
    pt: ['Só o Bartolo vai até a ilha. Mas o Bartolo não fala mais.', 'Só o Bartolo, o barqueiro, sabe chegar na ilha. Mas o Silêncio tirou as palavras dele. Ele está no cais, cinza, sem falar.'],
    de: ['Nur Bartolo fährt zur Insel. Aber Bartolo spricht nicht mehr.', 'Nur Bartolo, der Fährmann, kennt den Weg zur Insel. Aber die Stille hat ihm die Worte genommen. Er steht am Steg, grau, ohne ein Wort.'],
    zh: ['[只有|zhǐ yǒu] [巴托洛|Bā tuō luò] [会|huì] [去|qù] [小岛|xiǎo dǎo] 。 [可是|kě shì] [巴托洛|Bā tuō luò] [已经|yǐ jīng] [不|bù] [说话|shuō huà] [了|le] 。', '[只有|zhǐ yǒu] [船夫|chuán fū] [巴托洛|Bā tuō luò] [知道|zhī dào] [怎么|zěn me] [去|qù] [小岛|xiǎo dǎo] 。 [可是|kě shì] [寂静|Jì jìng] [拿走|ná zǒu] [了|le] [他|tā] [的|de] [话|huà] 。 [他|tā] [站|zhàn] [在|zài] [码头|mǎ tou] [上|shàng] ， [灰灰|huī huī] [的|de] ， [一|yī] [句|jù] [话|huà] [也|yě] [不|bù] [说|shuō] 。'],
    ja: ['[島|しま] へ [行|い]く の は 、 バルトロ さん だけ です 。 でも 、 バルトロ さん は もう [話|はな]しません 。', '[島|しま] へ [行|い]ける の は 、 [船頭|せんどう] の バルトロ さん だけ です 。 でも 、 [静寂|せいじゃく] が バルトロ さん の [言葉|ことば] を [奪|うば]って しまいました 。 [今|いま] は [灰色|はいいろ] の まま 、 [桟橋|さんばし] で [黙|だま]って [立|た]って います 。'],
    en: ['Only Bartolo goes to the island. But Bartolo doesn’t talk anymore.', 'Only Bartolo, the ferryman, knows the way to the island. But the Hush took his words. He stands on the dock, gray, without a word.'] },
  'marina.next': {
    es: ['Bartolo necesita sus palabras. ¿Pueden ayudarlo?', 'Bartolo necesita sus palabras otra vez. Ustedes le enseñan palabras a su amiguito… ¿pueden ayudar a Bartolo también?'],
    pt: ['O Bartolo precisa das palavras dele. Vocês podem ajudar?', 'O Bartolo precisa das palavras dele de novo. Vocês ensinam palavras para o amiguinho de vocês… será que podem ajudar o Bartolo também?'],
    de: ['Bartolo braucht seine Worte. Könnt ihr ihm helfen?', 'Bartolo braucht seine Worte wieder. Ihr bringt eurem kleinen Freund Wörter bei… könnt ihr Bartolo auch helfen?'],
    zh: ['[巴托洛|Bā tuō luò] [需要|xū yào] [找回|zhǎo huí] [他|tā] [的|de] [话|huà] 。 [你们|nǐ men] [能|néng] [帮|bāng] [他|tā] [吗|ma] ？', '[巴托洛|Bā tuō luò] [需要|xū yào] [找回|zhǎo huí] [他|tā] [的|de] [话|huà] 。 [你们|nǐ men] [在|zài] [教|jiāo] [小伙伴|xiǎo huǒ bàn] [学|xué] [词|cí] …… [能|néng] [不|bù] [能|néng] [也|yě] [帮帮|bāng bang] [巴托洛|Bā tuō luò] ？'],
    ja: ['バルトロ さん に は 、 [言葉|ことば] が [必要|ひつよう] です 。 [助|たす]けて くれます か ？', 'バルトロ さん に は 、 また [言葉|ことば] が [必要|ひつよう] な ん です 。 みなさん は 、 [小|ちい]さな お[友達|ともだち] に [言葉|ことば] を [教|おし]えて います よ ね …… バルトロ さん も 、 [助|たす]けて くれません か ？'],
    en: ['Bartolo needs his words. Can you help him?', 'Bartolo needs his words back. You teach your little {c.friend} words… could you help Bartolo too?'] },
  'ask.huh': {
    es: ['¿Cómo? Pregúntame dónde está algo: «¿Dónde está…?»'], pt: ['Como? Me pergunte onde está alguma coisa: «Onde está…?»'], de: ['Wie bitte? Frag mich, wo etwas ist: «Wo ist…?»'],
    zh: ['[你|nǐ] [说|shuō] [什么|shén me] ？ [你|nǐ] [可以|kě yǐ] [问|wèn] [我|wǒ] [什么|shén me] [东西|dōng xi] [在|zài] [哪里|nǎ lǐ] ： “ …… [在|zài] [哪里|nǎ lǐ] ？ ”'],
    ja: ['え ？ [何|なに]か が どこ に ある か 、 [聞|き]いて ください 。 「 …… は どこ です か ？ 」'],
    en: ['Sorry? Ask me where something is: «Where is…?»'] },
  'ciro.again': {
    es: ['El Gran Molino está al noreste. ¡Cuidado adentro!', 'El Gran Molino está al noreste del pueblo. Tranquilos: compren comida en el mercado antes de entrar.'],
    pt: ['O Grande Moinho fica a nordeste. Cuidado lá dentro!', 'O Grande Moinho fica a nordeste da cidade. Com calma: comprem comida no mercado antes de entrar.'],
    de: ['Die Große Mühle ist im Nordosten. Pass drinnen auf!', 'Die Große Mühle steht im Nordosten der Stadt. Ganz ruhig: Kauft auf dem Markt etwas zu essen, bevor ihr reingeht.'],
    zh: ['[大磨坊|Dà mò fáng] [在|zài] [东北边|dōng běi biān] 。 [进去|jìn qù] [以后|yǐ hòu] [要|yào] [小心|xiǎo xīn] ！', '[大磨坊|Dà mò fáng] [在|zài] [镇子|zhèn zi] [的|de] [东北边|dōng běi biān] 。 [别|bié] [着急|zháo jí] ： [进去|jìn qù] [之前|zhī qián] ， [先|xiān] [在|zài] [市场|shì chǎng] [买|mǎi] [点|diǎn] [吃|chī] [的|de] 。'],
    ja: ['[大風車|だいふうしゃ] は [北東|ほくとう] です 。 [中|なか] で は 、 [気|き] を つけて ください ね ！', '[大風車|だいふうしゃ] は 、 [町|まち] の [北東|ほくとう] に あります 。 あわてないで ください 。 [入|はい]る [前|まえ] に 、 [市場|いちば] で [食|た]べ[物|もの] を [買|か]って おいて ください 。'],
    en: ['The Great Mill is to the northeast. Careful inside!', 'The Great Mill stands in the northeast of town. Take it easy: buy some food at the market before you go in.'] },
  // villagers
  'kid.bark': {
    es: ['¡Hola! ¡Qué bonito!', '¡Hola! ¡Qué animal tan bonito!'],
    pt: ['Oi! Que fofo!', 'Oi! Que bichinho fofo!'],
    de: ['Hallo! So süß!', 'Hallo! Was für ein süßes Tier!'],
    zh: ['[你好|nǐ hǎo] ！ [好|hǎo] [可爱|kě ài] ！', '[你好|nǐ hǎo] ！ [这|zhè] [只|zhī] [小|xiǎo] [动物|dòng wù] [好|hǎo] [可爱|kě ài] [呀|ya] ！'],
    ja: ['こんにちは ！ かわいい ！', 'こんにちは ！ わあ 、 かわいい [動物|どうぶつ] ！'],
    en: ['{w.hello}! So cute!', '{w.hello}! What a cute little animal!'] },
  // Marta's side quest: three glowing mushrooms from the fairy ring in the forest
  'baker.ask': {
    es: ['¿Me traes tres {w.mushroom:pl} que brillan? Del bosque.', '¿Me traes tres {w.mushroom:pl} de los que brillan? Crecen en un círculo, en el bosque. ¡Son para mi pan especial!'],
    pt: ['Você me traz três {w.mushroom:pl} que brilham? Da floresta.', 'Você me traz três {w.mushroom:pl} daqueles que brilham? Eles crescem num círculo, na floresta. São para o meu pão especial!'],
    de: ['Bringst du mir drei leuchtende {w.mushroom:pl}? Aus dem Wald.', 'Bringst du mir drei von den leuchtenden {w.mushroom:pl}? Sie wachsen in einem Kreis im Wald. Die sind für mein Spezialbrot!'],
    zh: ['[你|nǐ] [能|néng] [给|gěi] [我|wǒ] [带|dài] [三|sān] [个|gè] [会|huì] [发光|fā guāng] [的|de] {w.mushroom:pl} [来|lái] [吗|ma] ？ [森林|sēn lín] [里|lǐ] [有|yǒu] 。', '[你|nǐ] [能|néng] [给|gěi] [我|wǒ] [带|dài] [三|sān] [个|gè] [会|huì] [发光|fā guāng] [的|de] {w.mushroom:pl} [来|lái] [吗|ma] ？ [它们|tā men] [在|zài] [森林|sēn lín] [里|lǐ] [长|zhǎng] [成|chéng] [一|yī] [圈|quān] 。 [我|wǒ] [要|yào] [用|yòng] [它们|tā men] [做|zuò] [我|wǒ] [的|de] [特别|tè bié] [面包|miàn bāo] ！'],
    ja: ['[光|ひか]る {w.mushroom:pl} を [三|みっ]つ 、 [持|も]って きて くれます か ？ [森|もり] に あります 。', '[光|ひか]る {w.mushroom:pl} を [三|みっ]つ 、 [持|も]って きて くれます か ？ [森|もり] の [中|なか] で 、 [輪|わ] に なって [生|は]えて います 。 [特別|とくべつ] な パン に [使|つか]う ん です ！'],
    en: ['Will you bring me {c.three} glowing {w.mushroom:pl}? From the {c.forest}.', "Will you bring me {c.three} of the glowing {w.mushroom:pl}? They grow in a ring in the {c.forest}, south of here. They're for my special {w.bread}!"] },
  'baker.wait': {
    es: ['¿Y los {w.mushroom:pl}? Tres, por favor.', '¿Encontraste los {w.mushroom:pl} que brillan? Necesito tres.'],
    pt: ['E os {w.mushroom:pl}? Três, por favor.', 'Achou os {w.mushroom:pl} que brilham? Eu preciso de três.'],
    de: ['Und die {w.mushroom:pl}? Drei, bitte.', 'Hast du die leuchtenden {w.mushroom:pl} gefunden? Ich brauche drei.'],
    zh: ['{w.mushroom:pl} [呢|ne] ？ [三|sān] [个|gè] ， [拜托|bài tuō] [了|le] 。', '[你|nǐ] [找到|zhǎo dào] [会|huì] [发光|fā guāng] [的|de] {w.mushroom:pl} [了|le] [吗|ma] ？ [我|wǒ] [需要|xū yào] [三|sān] [个|gè] 。'],
    ja: ['{w.mushroom:pl} は ？ [三|みっ]つ 、 お[願|ねが]い します 。', '[光|ひか]る {w.mushroom:pl} 、 [見|み]つかりました か ？ [三|みっ]つ [必要|ひつよう] な ん です 。'],
    en: ['And the {w.mushroom:pl}? {c.three}, {c.please}.', 'Did you find the glowing {w.mushroom:pl}? I need {c.three}. The ring is in the {c.forest}, south of here.'] },
  'baker.thanks': {
    es: ['¡Gracias! Toma, {w.bread}.', '¡Muchas gracias! Toma un poco de {w.bread} recién hecho.'],
    pt: ['Obrigada! Toma, {w.bread}.', 'Muito obrigada! Toma um pouco de {w.bread} fresquinho.'],
    de: ['Danke! Hier, {w.bread}.', 'Vielen Dank! Hier, ein Stück frisches {w.bread}.'],
    zh: ['[谢谢|xiè xie] ！ [给|gěi] ， {w.bread} 。', '[太|tài] [谢谢|xiè xie] [你|nǐ] [了|le] ！ [来|lái] ， [尝尝|cháng chang] [刚|gāng] [出炉|chū lú] [的|de] {w.bread} 。'],
    ja: ['ありがとう ございます ！ はい 、 {w.bread} を どうぞ 。', '[本当|ほんとう] に ありがとう ございます ！ [焼|や]きたて の {w.bread} を どうぞ 。'],
    en: ['{c.thanks:f}! Here, {w.bread}.', '{c.thanks:f}! Have some fresh {w.bread}.'] },
  'baker.bark': {
    es: ['¡{w.bread}! ¡{w.bread} rico!', 'Buenos días. El {w.bread} está calentito.'],
    pt: ['{w.bread}! {w.bread} gostoso!', 'Bom dia! O {w.bread} está quentinho.'],
    de: ['{w.bread}! Leckeres {w.bread}!', 'Guten Morgen! Das {w.bread} ist noch warm.'],
    zh: ['{w.bread} ！ [好吃|hǎo chī] [的|de] {w.bread} ！', '[早上|zǎo shang] [好|hǎo] 。 {w.bread} [还|hái] [热|rè] [着|zhe] [呢|ne] 。'],
    ja: ['{w.bread} ！ おいしい {w.bread} です よ ！', 'おはよう ございます 。 {w.bread} 、 まだ あたたかい です よ 。'],
    en: ['{w.bread}! Tasty {w.bread}!', 'Good morning. The {w.bread} is still warm.'] },
  // Noa's notebook pages, pinned around the forest (written in Noa's own language)
  'page.stone': {
    es: ['Una {w.stone} del río. ¡Qué fría!'], pt: ['Uma {w.stone} do rio. Que fria!'], de: ['Ein {w.stone} aus dem Bach. So kalt!'],
    zh: ['[河|hé] [里|lǐ] [的|de] [一|yī] [块|kuài] {w.stone} 。 [好|hǎo] [凉|liáng] ！'],
    ja: ['[川|かわ] の {w.stone} 。 [冷|つめ]たい ！'],
    en: ['A stone from the river. So cold!'] },
  'page.mushroom': {
    es: ['Este {w.mushroom} brilla de noche.'], pt: ['Este {w.mushroom} brilha à noite.'], de: ['Dieser {w.mushroom} leuchtet nachts.'],
    zh: ['[这|zhè] [个|gè] {w.mushroom} [晚上|wǎn shang] [会|huì] [发光|fā guāng] 。'],
    ja: ['この {w.mushroom} は 、 [夜|よる] に [光|ひか]る 。'],
    en: ['This mushroom glows at night.'] },
  'page.fox': {
    es: ['Mi amigo el {w.fox} vive aquí.'], pt: ['Minha amiga, a {w.fox}, mora aqui.'], de: ['Mein Freund, der {w.fox}, wohnt hier.'],
    zh: ['[我|wǒ] [的|de] [朋友|péng you] {w.fox} [住|zhù] [在|zài] [这里|zhè lǐ] 。'],
    ja: ['[友達|ともだち] の {w.fox} が 、 ここ に [住|す]んで いる 。'],
    en: ['My friend the fox lives here.'] },
  'page.bird': {
    es: ['Aquí siempre canta un {w.bird}.'], pt: ['Aqui sempre canta um {w.bird}.'], de: ['Hier singt immer ein {w.bird}.'],
    zh: ['[这里|zhè lǐ] [总|zǒng] [有|yǒu] [一|yī] [只|zhī] {w.bird} [在|zài] [唱歌|chàng gē] 。'],
    ja: ['ここ で は 、 いつも {w.bird} が [歌|うた]って いる 。'],
    en: ['A bird always sings here.'] },
  'page.bridge': {
    es: ['Por este {w.bridge} se llega a mi lugar secreto.'], pt: ['Por esta {w.bridge} se chega ao meu lugar secreto.'], de: ['Über diese {w.bridge} komme ich zu meinem geheimen Ort.'],
    zh: ['[过|guò] [了|le] [这|zhè] [座|zuò] {w.bridge} ， [就|jiù] [是|shì] [我|wǒ] [的|de] [秘密|mì mì] [基地|jī dì] 。'],
    ja: ['この {w.bridge} を [渡|わた]る と 、 [私|わたし] の [秘密|ひみつ] の [場所|ばしょ] が ある 。'],
    en: ['This bridge leads to my secret place.'] },
};

// Pick the version for your level: tier 1 → the first, higher tiers → the richer one.
// Returns the line in the language (text), its English (en), and the English to weave (weave).
function line(key, lang, tier) {
  const L = LINES[key]; if (!L) return { text: key, en: '', weave: '' };
  // zh/ja never borrow the Spanish (CJK.md): with no line in the language, text is '' and callers weave the English
  const arr = L[lang] || (lang === 'zh' || lang === 'ja' ? [] : L.es), en = L.en || [];
  const i = Math.max(0, Math.min(arr.length, Math.max(1, tier)) - 1);
  return { text: arr[i] || '', en: en[Math.min(en.length - 1, i)] || '', weave: en[en.length - 1] || '' };
}

// Noa's letters, in English (Noa is learning your language, mistakes and all) with words from
// Noa's language. «▬» marks words the Hush erased.
const LETTERS = [
  { date: 'Spring', body: [
    'Hello friend!!',
    'I am Noa! I practice my English with you, so sorry for the mistakes :)',
    'In my language we say {w.hello}! My house is next to a big forest, and every morning I see a big {w.tree} from my window.',
    'My favorite {w.flower} is the yellow one.',
    'Write me soon!!', '— Noa'] },
  { date: 'Summer', body: [
    '{w.hello}!! (see? I am a good teacher)',
    'Today I swimmed in the river. The {w.water} was sooo cold!',
    'My neighbor Rosa has the best apples of the world. Are you learning my language? Tell me a word in your next letter!',
    '— Noa'] },
  { date: 'Autumn', erased: true, body: [
    'Dear friend,',
    'Something strange is happening here. The forest is very quiet. The birds don\'t ▬▬▬ anymore, and people in the village talk less and less.',
    'And sometimes I write a word, and it ▬▬▬▬ from the page. Like this: ▬▬▬▬▬.',
    'Come visit? Take the {w.train} to the last stop. I will wait for you at ▬▬▬▬',
    '— N▬▬'] },
];
// (zh/ja are in the CJK.md notation: convert them with CJK before drawing the board)
const SIGN = { es: 'Última parada', pt: 'Fim da linha', de: 'Endstation', zh: '[终点站|zhōng diǎn zhàn]', ja: '[終点|しゅうてん]' };
