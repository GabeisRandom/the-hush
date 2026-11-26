'use strict';
// Alba long ago, after Chapter 2 (DESIGN.md 18.6 "T1a"; game/TIME.md): every word of it. alba_past.js is the people, the
// main path, the side quests and the cross-time effects; alba_past_stage.js the dungeon under the theater's stage and the two
// interiors of then; alba_past_boss.js the Prompter; alba_past_music.js the songs.
//   The day: a few days after the concert. The festival's bunting is still up, but the town is quiet and a little ashamed.
//   Elio is gone (he ran off alone, the night of the laughter; his dad is out on the roads looking for him), Aurora locked
//   the theater, and at night something whispers under its stage. The people of then remember that night and tell it in
//   the past: the preterite for what someone did («Elio subió al escenario»), the imperfect for how it was («tenía miedo»).
//   The player only conjugates in the third person here (the first and second person are Molinar's rung, TIME.md §8);
//   people use any person in their own lines.
// Every line in es / pt / de, zh and ja in CJK.md's notation, and en. People's lines go through the weave (STORY.sayInline:
// mixed, EN on request); demonstrations through STORY.demoLine (whole in the language, the shown words glossed: MARKS).
// One global, APTXT: CAST, CHAT, LINES, DEMO, MARKS, TASKS, WHISPERS, LOOKS, CARDS, WORDS, ECHO, NAMES, check().
const APTXT = (() => {
  const L = (en, es, pt, de, zh, ja, o) => Object.assign({ en, es, pt, de, zh, ja }, o || {});
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const isC = l => l === 'zh' || l === 'ja';

  // ------------------------------------------------------------ the cast (the cemetery's people of then keep their names;
  // the new ones have each language's own: young Marta is today's baker as a girl, young Hugo today's sweeper, with all his hair)
  const CAST = {
    elena: L('Elena', 'Elena', 'Elena', 'Elena', '[埃莱娜|Āi lái nà]', 'エレナ'),
    julian: L('Julián', 'Julián', 'Julián', 'Julián', '[胡利安|Hú lì ān]', 'フリアン'),
    felix: L('Félix', 'Félix', 'Félix', 'Félix', '[费利克斯|Fèi lì kè sī]', 'フェリックス'),
    clara: L('Clara', 'Clara', 'Clara', 'Clara', '[克拉拉|Kè lā lā]', 'クララ'),
    mateo: L('Mateo', 'Mateo', 'Mateo', 'Mateo', '[马特奥|Mǎ tè ào]', 'マテオ'),
    aurora: L('Aurora', 'Aurora', 'Aurora', 'Aurora', '[奥罗拉|Ào luó lā]', 'オーロラ'),
    pilar: L('Pilar', 'Pilar', 'Pilar', 'Pilar', '[皮拉尔|Pí lā ěr]', 'ピラール'),
    tina: L('young Tina', 'Tina', 'Tina', 'Tina', '[蒂娜|Dì nà]', 'ティナ'),
    marta: L('young Marta', 'Martita', 'Martinha', 'kleine Marta', '[小|Xiǎo] [玛尔塔|Mǎ ěr tǎ]', 'マルタ ちゃん'),
    hugo: L('young Hugo', 'Huguito', 'Huguinho', 'kleiner Hugo', '[小|Xiǎo] [雨果|Yǔ guǒ]', 'ウーゴ くん'),
    tomi: L('Tomi', 'Tomi', 'Tomi', 'Tomi', '[托米|Tuō mǐ]', 'トミ'),
    canela: L('Canela', 'Canela', 'Canela', 'Zimt', '[肉桂|Ròu guì]', 'シナモン'),
    lorenzo: L('Lorenzo', 'Lorenzo', 'Lorenzo', 'Lorenzo', '[洛伦索|Luò lún suǒ]', 'ロレンソ'),
    elio: L('Elio', 'Elio', 'Elio', 'Elio', '[艾利欧|Ài lì ōu]', 'エリオ'),
    noa: L('Noa', 'Noa', 'Noa', 'Noa', '[诺娅|Nuò yà]', 'ノア'),
    rosita: L('young Rosa', 'Rosita', 'Rosinha', 'Rosi', '[小|Xiǎo] [罗莎|Luó shā]', 'ロサ ちゃん'),
    prompter: L('the Prompter', 'el Apuntador', 'o Ponto', 'der Souffleur', '[提词人|tí cí rén]', 'プロンプター'),
    memory: L('A memory', 'Un recuerdo', 'Uma lembrança', 'Eine Erinnerung', '[回忆|huí yì]', '[思|おも]い[出|で]'),
  };

  // ------------------------------------------------------------ small talk: everyone of then has a few lines (in turn), after
  // the concert. (Never about the player's gender; PG; the past in each, a little.)
  const CHAT = {
    elena: [
      L('Good morning. The bread comes out warm, even if the town is sad.', 'Buenos días. El pan sale calentito, aunque el pueblo está triste.', 'Bom dia. O pão sai quentinho, mesmo com a cidade triste.', 'Guten Morgen. Das Brot kommt warm aus dem Ofen, auch wenn das Dorf traurig ist.',
        '[早上好|zǎo shang hǎo] 。 [面包|miàn bāo] [还是|hái shì] [热|rè] [的|de] ， [可是|kě shì] [镇上|zhèn shang] [的|de] [人|rén] [都|dōu] [很|hěn] [难过|nán guò] 。', 'おはよう 。 パン は あたたかい けど 、 [町|まち] は [悲|かな]しい わ ね 。'),
      L('Before, the whole quarter used to sing while the bread rose.', 'Antes, todo el barrio cantaba mientras el pan crecía.', 'Antes, o bairro inteiro cantava enquanto o pão crescia.', 'Früher hat das ganze Viertel gesungen, während das Brot aufging.',
        '[以前|yǐ qián] ， [面包|miàn bāo] [发|fā] [起来|qǐ lái] [的|de] [时候|shí hou] ， [整个|zhěng gè] [街区|jiē qū] [都|dōu] [在|zài] [唱歌|chàng gē] 。', '[前|まえ] は 、 パン が ふくらむ [間|あいだ] 、 みんな で [歌|うた]って いた の よ 。'),
    ],
    julian: [
      L('Today the class is very quiet. The children don’t want to read aloud.', 'Hoy la clase está muy callada. Los niños no quieren leer en voz alta.', 'Hoje a turma está muito quieta. As crianças não querem ler em voz alta.', 'Heute ist die Klasse ganz still. Die Kinder wollen nicht laut vorlesen.',
        '[今天|jīn tiān] [班|bān] [上|shàng] [很|hěn] [安静|ān jìng] 。 [孩子|hái zi] [们|men] [不|bù] [想|xiǎng] [大声|dà shēng] [读书|dú shū] 。', '[今日|きょう] の クラス は とても [静|しず]か です 。 [子|こ]ども たち は [声|こえ] に [出|だ]して [読|よ]みたがりません 。'),
      L('A brave mistake is worth more than a perfect silence.', 'Un error valiente vale más que un silencio perfecto.', 'Um erro corajoso vale mais que um silêncio perfeito.', 'Ein mutiger Fehler ist mehr wert als eine perfekte Stille.',
        '[一个|yī gè] [勇敢|yǒng gǎn] [的|de] [错误|cuò wù] ， [比|bǐ] [完美|wán měi] [的|de] [沉默|chén mò] [更|gèng] [有|yǒu] [价值|jià zhí] 。', '[勇敢|ゆうかん] な まちがい は 、 [完璧|かんぺき] な [沈黙|ちんもく] より [大切|たいせつ] です 。'),
    ],
    felix: [
      L('My fingers want to play… but the piano is behind that locked door.', 'Mis dedos quieren tocar… pero el piano está detrás de esa puerta cerrada.', 'Os meus dedos querem tocar… mas o piano está atrás daquela porta trancada.', 'Meine Finger wollen spielen … aber das Klavier ist hinter dieser verschlossenen Tür.',
        '[我|wǒ] [的|de] [手指|shǒu zhǐ] [想|xiǎng] [弹|tán] … [可是|kě shì] [钢琴|gāng qín] [在|zài] [那扇|nà shàn] [锁|suǒ] [着|zhe] [的|de] [门|mén] [后面|hòu miàn] 。', '[指|ゆび] は [弾|ひ]きたがって いる … でも ピアノ は 、 [鍵|かぎ] の かかった [扉|とびら] の [向|む]こう です 。'),
      L('Music never laughs at anyone. People do.', 'La música no se ríe de nadie. La gente sí.', 'A música não ri de ninguém. As pessoas riem.', 'Musik lacht niemanden aus. Menschen schon.',
        '[音乐|yīn yuè] [从来|cóng lái] [不|bù] [笑|xiào] [别人|bié rén] 。 [人|rén] [才|cái] [会|huì] 。', '[音楽|おんがく] は だれ も [笑|わら]わない 。 [笑|わら]う の は [人|ひと] です 。'),
    ],
    clara: [
      L('I sew and sew, but I don’t know who for. The choir doesn’t sing any more.', 'Coso y coso, pero no sé para quién. El coro ya no canta.', 'Eu costuro e costuro, mas não sei pra quem. O coral não canta mais.', 'Ich nähe und nähe, aber ich weiß nicht, für wen. Der Chor singt nicht mehr.',
        '[我|wǒ] [缝|féng] [啊|a] [缝|féng] ， [可是|kě shì] [不|bù] [知道|zhī dào] [为|wèi] [谁|shéi] [缝|féng] 。 [合唱团|hé chàng tuán] [不|bù] [唱|chàng] [了|le] 。', '[縫|ぬ]って 、 [縫|ぬ]って … でも 、 だれ の ため か わからない 。 [合唱団|がっしょうだん] は もう [歌|うた]わない の 。'),
      L('A broken thread can be sewn. A broken voice too, can’t it?', 'Un hilo roto se puede coser. Una voz rota también, ¿no?', 'Uma linha rompida dá pra costurar. Uma voz quebrada também, né?', 'Einen gerissenen Faden kann man nähen. Eine gebrochene Stimme auch, oder?',
        '[断|duàn] [了|le] [的|de] [线|xiàn] [可以|kě yǐ] [缝|féng] [好|hǎo] 。 [断|duàn] [了|le] [的|de] [声音|shēng yīn] [也|yě] [可以|kě yǐ] ， [对|duì] [吧|ba] ？', '[切|き]れた [糸|いと] は [縫|ぬ]えます 。 [折|お]れた [声|こえ] も 、 きっと ね 。'),
    ],
    mateo: [
      L('I carry letters all over the valley. I know every door… and every dog.', 'Llevo cartas a todo el valle. Conozco cada puerta… y cada perro.', 'Eu levo cartas pro vale inteiro. Conheço cada porta… e cada cachorro.', 'Ich bringe Briefe ins ganze Tal. Ich kenne jede Tür … und jeden Hund.',
        '[我|wǒ] [给|gěi] [整个|zhěng gè] [山谷|shān gǔ] [送|sòng] [信|xìn] 。 [每|měi] [扇|shàn] [门|mén] [我|wǒ] [都|dōu] [认识|rèn shi] … [每|měi] [只|zhī] [狗|gǒu] [也|yě] [是|shì] 。', '[谷|たに] じゅう に [手紙|てがみ] を [届|とど]けて います 。 どの [家|いえ] の [戸|と] も … どの [犬|いぬ] も [知|し]って います よ 。'),
      L('Letters are patient. They wait years, if they have to.', 'Las cartas son pacientes. Esperan años, si hace falta.', 'As cartas são pacientes. Esperam anos, se for preciso.', 'Briefe sind geduldig. Sie warten Jahre, wenn es sein muss.',
        '[信|xìn] [很|hěn] [有|yǒu] [耐心|nài xīn] 。 [需要|xū yào] [的|de] [话|huà] ， [它们|tā men] [会|huì] [等|děng] [好|hǎo] [多|duō] [年|nián] 。', '[手紙|てがみ] は [気|き] が [長|なが]い 。 [何年|なんねん] でも [待|ま]ちます 。'),
    ],
    aurora: [
      L('My watch stopped that night, at eight. I don’t want to fix it.', 'Mi reloj se paró esa noche, a las ocho. No lo quiero arreglar.', 'O meu relógio parou naquela noite, às oito. Eu não quero consertar.', 'Meine Uhr ist an dem Abend stehen geblieben, um acht. Ich will sie nicht reparieren.',
        '[那天|nà tiān] [晚上|wǎn shang] [八|bā] [点|diǎn] ， [我|wǒ] [的|de] [表|biǎo] [停|tíng] [了|le] 。 [我|wǒ] [不|bù] [想|xiǎng] [修|xiū] 。', 'あの [夜|よる] の [八時|はちじ] に 、 わたし の [時計|とけい] は [止|と]まりました 。 [直|なお]したく ない の 。'),
      L('I built this theater so we could all sing together. And that night, we all laughed together.', 'Construí este teatro para cantar todos juntos. Y esa noche, nos reímos todos juntos.', 'Eu construí este teatro pra gente cantar junto. E naquela noite, a gente riu junto.', 'Ich habe dieses Theater gebaut, damit wir alle zusammen singen. Und an dem Abend haben wir alle zusammen gelacht.',
        '[我|wǒ] [建|jiàn] [这个|zhè ge] [剧院|jù yuàn] ， [是|shì] [为了|wèi le] [大家|dà jiā] [一起|yī qǐ] [唱歌|chàng gē] 。 [可是|kě shì] [那天|nà tiān] [晚上|wǎn shang] ， [大家|dà jiā] [一起|yī qǐ] [笑|xiào] [了|le] 。', 'みんな で [歌|うた]う ため に 、 この [劇場|げきじょう] を [建|た]てました 。 でも あの [夜|よる] 、 みんな で [笑|わら]って しまった 。'),
    ],
    pilar: [
      L('Ding, dong! … No. Today the bell doesn’t ring.', '¡Din, don! … No. Hoy la campana no suena.', 'Dim, dom! … Não. Hoje o sino não toca.', 'Bim, bam! … Nein. Heute läutet die Glocke nicht.',
        '[叮|dīng] ， [咚|dōng] ！ … [不|bù] 。 [今天|jīn tiān] [钟|zhōng] [不|bù] [响|xiǎng] 。', 'ディン 、 ドン ！ … いいえ 。 [今日|きょう] は [鐘|かね] を [鳴|な]らしません 。'),
      L('I used to ring the bell before every concert. It was my favorite job.', 'Antes tocaba la campana antes de cada concierto. Era mi trabajo favorito.', 'Antes eu tocava o sino antes de cada concerto. Era o meu trabalho favorito.', 'Früher habe ich vor jedem Konzert die Glocke geläutet. Das war meine liebste Arbeit.',
        '[以前|yǐ qián] [每|měi] [次|cì] [音乐会|yīn yuè huì] [前|qián] ， [我|wǒ] [都|dōu] [敲|qiāo] [钟|zhōng] 。 [那|nà] [是|shì] [我|wǒ] [最|zuì] [喜欢|xǐ huan] [的|de] [工作|gōng zuò] 。', '[前|まえ] は 、 コンサート の たび に [鐘|かね] を [鳴|な]らして いました 。 いちばん [好|す]き な [仕事|しごと] でした 。'),
    ],
    tina: [
      L('Rosa is my friend. She didn’t laugh that night.', 'Rosita es mi amiga. Ella no se rio esa noche.', 'A Rosinha é minha amiga. Ela não riu naquela noite.', 'Rosi ist meine Freundin. Sie hat an dem Abend nicht gelacht.',
        '[小|Xiǎo] [罗莎|Luó shā] [是|shì] [我|wǒ] [的|de] [朋友|péng you] 。 [那天|nà tiān] [晚上|wǎn shang] [她|tā] [没有|méi yǒu] [笑|xiào] 。', 'ロサ ちゃん は わたし の [友|とも]だち 。 あの [夜|よる] 、 ロサ ちゃん は [笑|わら]わなかった 。'),
      L('When I grow up, I’m going to live on this street forever.', 'De grande, voy a vivir en esta calle para siempre.', 'Quando eu crescer, vou morar nesta rua pra sempre.', 'Wenn ich groß bin, wohne ich für immer in dieser Straße.',
        '[长大|zhǎng dà] [以后|yǐ hòu] ， [我|wǒ] [要|yào] [一直|yī zhí] [住|zhù] [在|zài] [这条|zhè tiáo] [街|jiē] [上|shàng] 。', '[大|おお]きく なったら 、 ずっと この [通|とお]り に [住|す]む の 。'),
    ],
    marta: [
      L('Elena says the dough listens. That’s why I sing to it.', 'Elena dice que la masa escucha. Por eso le canto.', 'A Elena diz que a massa escuta. Por isso eu canto pra ela.', 'Elena sagt, der Teig hört zu. Darum singe ich ihm was vor.',
        '[埃莱娜|Āi lái nà] [说|shuō] [面团|miàn tuán] [会|huì] [听|tīng] 。 [所以|suǒ yǐ] [我|wǒ] [给|gěi] [它|tā] [唱歌|chàng gē] 。', 'エレナ さん は 、 [生地|きじ] は [聞|き]いて いる って [言|い]う の 。 だから [歌|うた]って あげる の 。'),
      L('Canela, no! That bread isn’t for cats!', '¡Canela, no! ¡Ese pan no es para gatos!', 'Canela, não! Esse pão não é pra gato!', 'Zimt, nein! Das Brot ist nicht für Katzen!',
        '[肉桂|Ròu guì] ， [不|bù] [行|xíng] ！ [那个|nà ge] [面包|miàn bāo] [不是|bú shì] [给|gěi] [猫|māo] [吃|chī] [的|de] ！', 'シナモン 、 だめ ！ その パン は ねこ の じゃ ない の ！'),
    ],
    hugo: [
      L('Look at my hair! My mom says I look like a lion.', '¡Mira mi pelo! Mi mamá dice que parezco un león.', 'Olha o meu cabelo! A minha mãe diz que eu pareço um leão.', 'Schau mal meine Haare! Meine Mama sagt, ich sehe aus wie ein Löwe.',
        '[你|nǐ] [看|kàn] [我|wǒ] [的|de] [头发|tóu fa] ！ [我|wǒ] [妈妈|mā ma] [说|shuō] [我|wǒ] [像|xiàng] [一|yī] [头|tóu] [狮子|shī zi] 。', 'ぼく の かみ 、 [見|み]て ！ お[母|かあ]さん は 、 ライオン みたい って [言|い]う んだ 。'),
      L('When I grow up I’m going to be a sweeper, like my dad. I’ll sweep all of Alba!', 'De grande voy a ser barrendero, como mi papá. ¡Voy a barrer toda Alba!', 'Quando eu crescer vou ser gari, que nem o meu pai. Vou varrer Alba inteira!', 'Wenn ich groß bin, werde ich Straßenkehrer, wie mein Papa. Ich fege ganz Alba!',
        '[长大|zhǎng dà] [以后|yǐ hòu] [我|wǒ] [要|yào] [当|dāng] [清洁工|qīng jié gōng] ， [跟|gēn] [我|wǒ] [爸爸|bà ba] [一样|yī yàng] 。 [我|wǒ] [要|yào] [扫|sǎo] [整个|zhěng gè] [阿尔巴|Ā ěr bā] ！', '[大|おお]きく なったら 、 お[父|とう]さん みたい に そうじ の [仕事|しごと] を する 。 アルバ を ぜんぶ はく ん だ ！'),
    ],
    tomi: [
      L('Teacher Julián says mistakes are brave. I have lots!', 'El maestro Julián dice que los errores son valientes. ¡Yo tengo muchos!', 'O professor Julián diz que os erros são corajosos. Eu tenho um monte!', 'Herr Julián sagt, Fehler sind mutig. Ich habe ganz viele!',
        '[胡利安|Hú lì ān] [老师|lǎo shī] [说|shuō] [错误|cuò wù] [很|hěn] [勇敢|yǒng gǎn] 。 [我|wǒ] [的|de] [错误|cuò wù] [可|kě] [多|duō] [了|le] ！', 'フリアン [先生|せんせい] は 、 まちがい は [勇敢|ゆうかん] だ って 。 ぼく 、 いっぱい ある よ ！'),
      L('Elio used to sit there, by the window. Now his chair is empty.', 'Elio se sentaba allí, junto a la ventana. Ahora su silla está vacía.', 'O Elio sentava ali, perto da janela. Agora a cadeira dele está vazia.', 'Elio hat da gesessen, am Fenster. Jetzt ist sein Stuhl leer.',
        '[艾利欧|Ài lì ōu] [以前|yǐ qián] [坐|zuò] [在|zài] [那里|nà lǐ] ， [窗户|chuāng hu] [旁边|páng biān] 。 [现在|xiàn zài] [他|tā] [的|de] [椅子|yǐ zi] [空|kōng] [着|zhe] 。', 'エリオ くん は 、 あそこ の [窓|まど] の そば に [座|すわ]って いた 。 [今|いま] は 、 いす が [空|あ]いて いる 。'),
    ],
  };

  // ------------------------------------------------------------ lines (1): Noa at the duck pond's crack (Chapter 4's opening, and
  // the report); the people's memories of that night (after their demonstrations); Aurora and the key
  const LINES = {
    'open.hear': L('Can you hear me? It’s me, Noa! I’m still inside the great {w.clock}… but through every crack, I can hear yesterday and tomorrow.',
      '¿Me oyes? ¡Soy yo, Noa! Sigo dentro del gran reloj… pero por cada grieta oigo el ayer y el mañana.',
      'Você me ouve? Sou eu, a Noa! Eu ainda estou dentro do grande relógio… mas por cada fenda eu escuto o ontem e o amanhã.',
      'Hörst du mich? Ich bin’s, Noa! Ich bin immer noch in der großen Uhr … aber durch jeden Riss höre ich das Gestern und das Morgen.',
      '[你|nǐ] [听得见|tīng de jiàn] [吗|ma] ？ [是|shì] [我|wǒ] ， [诺娅|Nuò yà] ！ [我|wǒ] [还在|hái zài] [大|dà] [钟|zhōng] [里|lǐ] … [可是|kě shì] [从|cóng] [每|měi] [一|yī] [道|dào] [裂缝|liè fèng] ， [我|wǒ] [都|dōu] [能|néng] [听到|tīng dào] [昨天|zuó tiān] [和|hé] [明天|míng tiān] 。',
      '[聞|き]こえる ？ わたし 、 ノア ！ まだ [大|おお]きな [時計|とけい] の [中|なか] に いる の 。 でも 、 どの [裂|さ]け[目|め] から も 、 [昨日|きのう] と [明日|あした] が [聞|き]こえる の 。'),
    'open.broke': L('When the theater laughed, Elio’s voice broke. What he never got to say broke into echoes, and they scattered through every place’s yesterday and tomorrow.',
      'Cuando el teatro se rio, la voz de Elio se rompió. Lo que nunca pudo decir se rompió en ecos, y los ecos se perdieron en el ayer y el mañana de cada lugar.',
      'Quando o teatro riu, a voz do Elio quebrou. O que ele nunca conseguiu dizer virou ecos, e os ecos se perderam no ontem e no amanhã de cada lugar.',
      'Als das Theater gelacht hat, ist Elios Stimme zerbrochen. Was er nie sagen konnte, ist in Echos zerfallen, und die Echos haben sich im Gestern und Morgen jedes Ortes verloren.',
      '[剧院|jù yuàn] [里|lǐ] [的|de] [人|rén] [笑|xiào] [的|de] [时候|shí hou] ， [艾利欧|Ài lì ōu] [的|de] [声音|shēng yīn] [碎|suì] [了|le] 。 [他|tā] [没|méi] [说出|shuō chū] [的|de] [话|huà] [变成|biàn chéng] [了|le] [回声|huí shēng] ， [散|sàn] [落|luò] [在|zài] [每个|měi gè] [地方|dì fang] [的|de] [昨天|zuó tiān] [和|hé] [明天|míng tiān] [里|lǐ] 。',
      '[劇場|げきじょう] が [笑|わら]った とき 、 エリオ くん の [声|こえ] は こわれた の 。 [言|い]えなかった ことば は こだま に なって 、 いろんな [場所|ばしょ] の [昨日|きのう] と [明日|あした] に ちらばった 。'),
    'open.two': L('Here in Alba there are two. One is under the old theater’s stage, long ago. The other is in tomorrow’s theater.',
      'Aquí en Alba hay dos. Uno está debajo del escenario del teatro viejo, hace mucho tiempo. El otro está en el teatro de mañana.',
      'Aqui em Alba tem dois. Um está debaixo do palco do teatro velho, há muito tempo. O outro está no teatro de amanhã.',
      'Hier in Alba gibt es zwei. Eines ist unter der Bühne des alten Theaters, vor langer Zeit. Das andere ist im Theater von morgen.',
      '[阿尔巴|Ā ěr bā] [这里|zhè lǐ] [有|yǒu] [两个|liǎng gè] 。 [一个|yī gè] [在|zài] [很久以前|hěn jiǔ yǐ qián] [的|de] [老|lǎo] [剧院|jù yuàn] [舞台|wǔ tái] [下面|xià miàn] 。 [另|lìng] [一个|yī gè] [在|zài] [明天|míng tiān] [的|de] [剧院|jù yuàn] [里|lǐ] 。',
      'アルバ に は ふたつ ある 。 ひとつ は 、 [昔|むかし] の [古|ふる]い [劇場|げきじょう] の [舞台|ぶたい] の [下|した] 。 もう ひとつ は 、 [明日|あした] の [劇場|げきじょう] に ある 。'),
    'open.go': L('Start in the Past. Ask the people of then about the night of the concert. Bring his words back, and come tell me here.',
      'Empieza por el Ayer. Pregúntale a la gente de entonces por la noche del concierto. Trae sus palabras y vuelve a contármelo aquí.',
      'Começa pelo Ontem. Pergunta pro pessoal daquela época sobre a noite do concerto. Traz as palavras dele e volta aqui pra me contar.',
      'Fang im Gestern an. Frag die Leute von damals nach dem Abend des Konzerts. Bring seine Worte zurück und erzähl es mir hier.',
      '[先|xiān] [去|qù] [过去|guò qù] 。 [问问|wèn wen] [那时候|nà shí hou] [的|de] [人|rén] [音乐会|yīn yuè huì] [那天|nà tiān] [晚上|wǎn shang] [的|de] [事|shì] 。 [把|bǎ] [他|tā] [的|de] [话|huà] [带|dài] [回来|huí lái] ， [再|zài] [来|lái] [这里|zhè lǐ] [告诉|gào su] [我|wǒ] 。',
      'まず 、 [昨日|きのう] へ [行|い]って 。 その ころ の [人|ひと] たち に 、 コンサート の [夜|よる] の こと を [聞|き]いて 。 [彼|かれ] の ことば を [持|も]って [帰|かえ]って 、 ここ で [教|おし]えて ね 。'),
    'report.next': L('Now there’s the other echo: the one in tomorrow’s theater. This crack goes to the Future too.',
      'Ahora falta el otro eco: el del teatro de mañana. Esta grieta también va al Mañana.',
      'Agora falta o outro eco: o do teatro de amanhã. Esta fenda também vai pro Amanhã.',
      'Jetzt fehlt noch das andere Echo: das im Theater von morgen. Dieser Riss führt auch ins Morgen.',
      '[现在|xiàn zài] [还|hái] [差|chà] [另|lìng] [一个|yī gè] [回声|huí shēng] ： [在|zài] [明天|míng tiān] [的|de] [剧院|jù yuàn] [里|lǐ] 。 [这|zhè] [道|dào] [裂缝|liè fèng] [也|yě] [通|tōng] [到|dào] [明天|míng tiān] 。',
      'あと は 、 もう ひとつ の こだま 。 [明日|あした] の [劇場|げきじょう] に ある の 。 この [裂|さ]け[目|め] は [明日|あした] に も つながって いる よ 。'),
    // after each memory (step 1): what came after
    'felix.after': L('Yes… And I did nothing. Since that night, I haven’t played the piano.',
      'Sí… Y yo no hice nada. Desde esa noche, no toco el piano.', 'É… E eu não fiz nada. Desde aquela noite, eu não toco piano.',
      'Ja … Und ich habe nichts gemacht. Seit dem Abend spiele ich kein Klavier mehr.',
      '[是|shì] [啊|a] … [我|wǒ] [什么|shén me] [也|yě] [没|méi] [做|zuò] 。 [从|cóng] [那天|nà tiān] [晚上|wǎn shang] [起|qǐ] ， [我|wǒ] [不|bù] [再|zài] [弹|tán] [钢琴|gāng qín] [了|le] 。',
      'ええ … わたし は [何|なに] も しなかった 。 あの [夜|よる] から 、 ピアノ を [弾|ひ]いて いません 。'),
    'clara.after': L('Yes. He was scared… And I laughed a little. I’m so ashamed.',
      'Sí. Tenía miedo… Y yo me reí un poquito. Me da mucha vergüenza.', 'É. Ele tinha medo… E eu ri um pouquinho. Tenho muita vergonha.',
      'Ja. Er hatte Angst … Und ich habe ein bisschen gelacht. Ich schäme mich so.',
      '[是|shì] [的|de] 。 [他|tā] [很|hěn] [害怕|hài pà] … [我|wǒ] [也|yě] [笑|xiào] [了|le] [一下|yī xià] 。 [我|wǒ] [真|zhēn] [不|bù] [好意思|hǎo yì si] 。',
      'ええ 。 こわかった の よ … わたし も 、 すこし [笑|わら]って しまった 。 はずかしい わ 。'),
    'mateo.after': L('The next day, Elio was gone. His dad is looking for him all over the valley.',
      'Al día siguiente, Elio ya no estaba. Su papá lo está buscando por todo el valle.', 'No dia seguinte, o Elio já não estava mais aqui. O pai dele está procurando ele pelo vale todo.',
      'Am nächsten Tag war Elio weg. Sein Papa sucht ihn im ganzen Tal.',
      '[第二天|dì èr tiān] ， [艾利欧|Ài lì ōu] [就|jiù] [不见|bú jiàn] [了|le] 。 [他|tā] [爸爸|bà ba] [正在|zhèng zài] [整个|zhěng gè] [山谷|shān gǔ] [找|zhǎo] [他|tā] 。',
      'つぎ の [日|ひ] 、 エリオ くん は もう いなかった 。 お[父|とう]さん が [谷|たに] じゅう を [探|さが]して います 。'),
    'elena.after': L('Now his dad doesn’t come for bread any more. He’s out on the roads, looking for Elio.',
      'Ahora su papá ya no viene por pan. Está buscando a Elio por los caminos.', 'Agora o pai dele não vem mais buscar pão. Ele está procurando o Elio pelas estradas.',
      'Jetzt kommt sein Papa nicht mehr zum Brotholen. Er sucht Elio auf allen Wegen.',
      '[现在|xiàn zài] [他|tā] [爸爸|bà ba] [不|bù] [来|lái] [买|mǎi] [面包|miàn bāo] [了|le] 。 [他|tā] [在|zài] [路|lù] [上|shàng] [到处|dào chù] [找|zhǎo] [艾利欧|Ài lì ōu] 。',
      '[今|いま] は 、 お[父|とう]さん も パン を [買|か]い に [来|こ]ない 。 [道|みち] で エリオ くん を [探|さが]して いる の 。'),
    // Aurora, by the theater's locked door (step 2)
    'aurora.whisper': L('But at night, under the stage, there’s a whisper… like a prompter repeating lies.',
      'Pero de noche, debajo del escenario, se oye un susurro… como un apuntador que repite mentiras.',
      'Mas de noite, debaixo do palco, dá pra ouvir um sussurro… como um ponto repetindo mentiras.',
      'Aber nachts hört man unter der Bühne ein Flüstern … wie ein Souffleur, der Lügen wiederholt.',
      '[可是|kě shì] [晚上|wǎn shang] ， [舞台|wǔ tái] [下面|xià miàn] [有|yǒu] [人|rén] [在|zài] [小声|xiǎo shēng] [说话|shuō huà] … [像|xiàng] [一个|yī gè] [提词人|tí cí rén] ， [一直|yī zhí] [说|shuō] [假话|jiǎ huà] 。',
      'でも 、 [夜|よる] に なる と 、 [舞台|ぶたい] の [下|した] から ささやき が [聞|き]こえる の 。 うそ を くりかえす プロンプター みたい に 。'),
    'aurora.ask': L('Why do you want to go down there? Tell me one thing that happened that night.',
      '¿Por qué quieres bajar? Dime una cosa que pasó esa noche.', 'Por que você quer descer? Me diz uma coisa que aconteceu naquela noite.',
      'Warum willst du da runter? Sag mir eine Sache, die an dem Abend passiert ist.',
      '[你|nǐ] [为什么|wèi shén me] [要|yào] [下去|xià qù] ？ [告诉|gào su] [我|wǒ] [那天|nà tiān] [晚上|wǎn shang] [发生|fā shēng] [的|de] [一件|yī jiàn] [事|shì] 。',
      'どうして [下|した] に [行|い]きたい の ？ あの [夜|よる] に あった こと を 、 ひとつ [教|おし]えて 。'),
    'aurora.key': L('Then you understand. Here’s the theater’s key. Be careful down there.',
      'Entonces lo entiendes. Toma la llave del teatro. Ten cuidado ahí abajo.', 'Então você entende. Pega a chave do teatro. Cuidado lá embaixo.',
      'Dann verstehst du es. Hier, der Schlüssel zum Theater. Pass da unten auf.',
      '[那|nà] [你|nǐ] [明白|míng bai] [了|le] 。 [这|zhè] [是|shì] [剧院|jù yuàn] [的|de] [钥匙|yào shi] 。 [在|zài] [下面|xià miàn] [要|yào] [小心|xiǎo xīn] 。',
      'それ なら 、 わかって いる の ね 。 [劇場|げきじょう] の [鍵|かぎ] よ 。 [下|した] で は [気|き] を つけて 。'),
    'aurora.after': L('Go on. And if the whisper lies to you… tell it how it really was.',
      'Anda. Y si el susurro te miente… dile cómo fue de verdad.', 'Vai. E se o sussurro mentir pra você… diz pra ele como foi de verdade.',
      'Geh nur. Und wenn das Flüstern dich anlügt … sag ihm, wie es wirklich war.',
      '[去|qù] [吧|ba] 。 [如果|rú guǒ] [那个|nà ge] [声音|shēng yīn] [骗|piàn] [你|nǐ] … [就|jiù] [告诉|gào su] [它|tā] [真正|zhēn zhèng] [发生|fā shēng] [了|le] [什么|shén me] 。',
      '[行|い]って らっしゃい 。 ささやき が うそ を ついたら … [本当|ほんとう] は どう だった か 、 [言|い]って あげて 。'),
  };

  // ------------------------------------------------------------ lines (2): the side quests and the small tasks
  Object.assign(LINES, {
    // «Félix's lost page» (cross-time: it hangs framed in the library's window, today and tomorrow)
    'felix.page': L('That night I lost a page of my song. The last one. I think it stayed under the stage.',
      'Esa noche perdí una página de mi canción. La última. Creo que se quedó debajo del escenario.',
      'Naquela noite eu perdi uma página da minha música. A última. Acho que ficou debaixo do palco.',
      'An dem Abend habe ich eine Seite von meinem Lied verloren. Die letzte. Ich glaube, sie ist unter der Bühne geblieben.',
      '[那天|nà tiān] [晚上|wǎn shang] [我|wǒ] [丢|diū] [了|le] [一|yī] [页|yè] [乐谱|yuè pǔ] ， [最后|zuì hòu] [一|yī] [页|yè] 。 [我|wǒ] [想|xiǎng] [它|tā] [还|hái] [在|zài] [舞台|wǔ tái] [下面|xià miàn] 。',
      'あの [夜|よる] 、 [曲|きょく] の [楽譜|がくふ] を [一枚|いちまい] なくした ん です 。 [最後|さいご] の [一枚|いちまい] 。 [舞台|ぶたい] の [下|した] に ある と [思|おも]う 。'),
    'felix.where': L('My page! Where was it?', '¡Mi página! ¿Dónde estaba?', 'A minha página! Onde ela estava?', 'Meine Seite! Wo war sie?',
      '[我|wǒ] [的|de] [乐谱|yuè pǔ] ！ [它|tā] [之前|zhī qián] [在|zài] [哪里|nǎ lǐ] ？', 'わたし の [楽譜|がくふ] ！ どこ に あった ん です か ？'),
    'felix.thanks': L('Thank you! Now I can finish my song. I’ll put it in a frame, in the library. That way the whole town can see it.',
      '¡Gracias! Ahora puedo terminar mi canción. La voy a poner en un marco, en la biblioteca. Así todo el pueblo la puede ver.',
      'Obrigado! Agora eu posso terminar a minha música. Vou colocar ela num quadro, na biblioteca. Assim a cidade toda pode ver.',
      'Danke! Jetzt kann ich mein Lied fertig schreiben. Ich hänge die Seite in einem Rahmen in die Bibliothek. Dann kann das ganze Dorf sie sehen.',
      '[谢谢|xiè xie] ！ [现在|xiàn zài] [我|wǒ] [能|néng] [写完|xiě wán] [我|wǒ] [的|de] [歌|gē] [了|le] 。 [我|wǒ] [要|yào] [把|bǎ] [它|tā] [放|fàng] [在|zài] [镜框|jìng kuàng] [里|lǐ] ， [挂|guà] [在|zài] [图书馆|tú shū guǎn] 。 [这样|zhè yàng] [大家|dà jiā] [都|dōu] [能|néng] [看到|kàn dào] 。',
      'ありがとう ！ これ で [曲|きょく] を [完成|かんせい] できる 。 [額|がく] に [入|い]れて 、 [図書館|としょかん] に かざります 。 みんな が [見|み]られる よう に 。'),
    'felix.again': L('When the theater opens again, I’ll play it. The whole song, to the last note.',
      'Cuando el teatro abra otra vez, la voy a tocar. Toda la canción, hasta la última nota.',
      'Quando o teatro abrir de novo, eu vou tocar. A música inteira, até a última nota.',
      'Wenn das Theater wieder aufmacht, spiele ich es. Das ganze Lied, bis zur letzten Note.',
      '[剧院|jù yuàn] [再|zài] [开门|kāi mén] [的|de] [时候|shí hou] ， [我|wǒ] [要|yào] [弹|tán] [这|zhè] [首|shǒu] [歌|gē] ， [一直|yī zhí] [弹|tán] [到|dào] [最后|zuì hòu] [一个|yī gè] [音|yīn] 。',
      '[劇場|げきじょう] が また [開|ひら]いたら 、 この [曲|きょく] を [弾|ひ]きます 。 [最後|さいご] の [音|おと] まで 。'),
    // «Rosa's letter» (cross-time: today, the postman brings Doña Rosa her own letter, forty years late)
    'rosita.ask': L('I wrote Elio a letter. I want to tell him I didn’t laugh. Will you help me? What else should I write?',
      'Escribí una carta para Elio. Quiero decirle que yo no me reí. ¿Me ayudas? ¿Qué más le pongo?',
      'Eu escrevi uma carta pro Elio. Quero dizer que eu não ri. Me ajuda? O que mais eu escrevo?',
      'Ich habe Elio einen Brief geschrieben. Ich will ihm sagen, dass ich nicht gelacht habe. Hilfst du mir? Was schreibe ich noch?',
      '[我|wǒ] [给|gěi] [艾利欧|Ài lì ōu] [写|xiě] [了|le] [一|yī] [封|fēng] [信|xìn] 。 [我|wǒ] [想|xiǎng] [告诉|gào su] [他|tā] [我|wǒ] [没有|méi yǒu] [笑|xiào] 。 [你|nǐ] [帮|bāng] [我|wǒ] [好|hǎo] [吗|ma] ？ [还|hái] [写|xiě] [什么|shén me] [呢|ne] ？',
      'エリオ くん に [手紙|てがみ] を [書|か]いた の 。 わたし は [笑|わら]わなかった って 、 [伝|つた]えたい 。 [手伝|てつだ]って くれる ？ [何|なに] を [書|か]けば いい かな ？'),
    'rosita.more': L('Now you: tell me one more kind thing about him, in the past.',
      'Ahora tú: dime otra cosa bonita de él, en pasado.', 'Agora você: me diz mais uma coisa bonita dele, no passado.',
      'Jetzt du: Sag mir noch etwas Schönes über ihn, in der Vergangenheit.',
      '[现在|xiàn zài] [你|nǐ] [说|shuō] ： [以前|yǐ qián] [他|tā] [还有|hái yǒu] [什么|shén me] [好|hǎo] [的|de] [地方|dì fang] ？',
      '[次|つぎ] は あなた 。 エリオ くん の いい ところ を 、 もう ひとつ [教|おし]えて 。'),
    'rosita.post': L('Done! Will you take it to Mateo, the postman? He’s in the Old Quarter.',
      '¡Listo! ¿Se la llevas a Mateo, el cartero? Está en el barrio viejo.',
      'Pronto! Você leva pro Mateo, o carteiro? Ele está no bairro antigo.',
      'Fertig! Bringst du ihn zu Mateo, dem Briefträger? Er ist im alten Viertel.',
      '[写好|xiě hǎo] [了|le] ！ [你|nǐ] [帮|bāng] [我|wǒ] [交给|jiāo gěi] [邮差|yóu chāi] [马特奥|Mǎ tè ào] [好|hǎo] [吗|ma] ？ [他|tā] [在|zài] [老|lǎo] [城区|chéng qū] 。',
      'できた ！ [郵便屋|ゆうびんや] さん の マテオ さん に [渡|わた]して くれる ？ [古|ふる]い [町|まち] に いる よ 。'),
    'rosita.wait': L('Did Mateo take my letter? I hope it reaches him…', '¿Mateo se llevó mi carta? Ojalá le llegue…', 'O Mateo levou a minha carta? Tomara que chegue…', 'Hat Mateo meinen Brief genommen? Hoffentlich kommt er an …',
      '[马特奥|Mǎ tè ào] [拿走|ná zǒu] [我|wǒ] [的|de] [信|xìn] [了|le] [吗|ma] ？ [希望|xī wàng] [它|tā] [能|néng] [送到|sòng dào] …', 'マテオ さん 、 [手紙|てがみ] を [持|も]って いった ？ [届|とど]く と いい な …'),
    'mateo.letter': L('A letter for Elio? Who wrote it?', '¿Una carta para Elio? ¿Quién la escribió?', 'Uma carta pro Elio? Quem escreveu?', 'Ein Brief für Elio? Wer hat ihn geschrieben?',
      '[给|gěi] [艾利欧|Ài lì ōu] [的|de] [信|xìn] ？ [小|Xiǎo] [罗莎|Luó shā] [做|zuò] [了|le] [什么|shén me] ？', 'エリオ くん へ の [手紙|てがみ] ？ だれ が [書|か]いた ん です か ？'),
    'mateo.keep': L('But I don’t know where he is… I’ll keep it in the drawer of letters that wait. Someday it’ll arrive.',
      'Pero no sé dónde está… La voy a guardar en el cajón de las cartas que esperan. Algún día va a llegar.',
      'Mas eu não sei onde ele está… Vou guardar na gaveta das cartas que esperam. Um dia ela chega.',
      'Aber ich weiß nicht, wo er ist … Ich lege ihn in die Schublade für die wartenden Briefe. Eines Tages kommt er an.',
      '[可是|kě shì] [我|wǒ] [不|bù] [知道|zhī dào] [他|tā] [在|zài] [哪里|nǎ lǐ] … [我|wǒ] [把|bǎ] [它|tā] [放|fàng] [在|zài] [等|děng] [人|rén] [的|de] [信|xìn] [的|de] [抽屉|chōu ti] [里|lǐ] 。 [总有一天|zǒng yǒu yī tiān] [会|huì] [送到|sòng dào] [的|de] 。',
      'でも 、 どこ に いる か わからない … [待|ま]って いる [手紙|てがみ] の [引|ひ]き[出|だ]し に しまって おきます 。 いつか きっと [届|とど]きます よ 。'),
    'rosa.letter': L('Look what the postman brought me! A letter from forty years ago… I wrote it as a girl, for Elio. It never reached him. And here’s a line someone told me to write… someone who looked a lot like you.',
      '¡Mira lo que me trajo el cartero! Una carta de hace cuarenta años… La escribí yo, de niña, para Elio. Nunca le llegó. Y aquí hay una frase que me dictó alguien… alguien que se parecía mucho a ti.',
      'Olha o que o carteiro me trouxe! Uma carta de quarenta anos atrás… Fui eu que escrevi, quando era menina, pro Elio. Nunca chegou. E aqui tem uma frase que alguém me ditou… alguém muito parecido com você.',
      'Schau, was der Briefträger gebracht hat! Ein Brief von vor vierzig Jahren … Ich habe ihn als Mädchen für Elio geschrieben. Er ist nie angekommen. Und hier steht ein Satz, den mir jemand gesagt hat … jemand, der dir sehr ähnlich sah.',
      '[你|nǐ] [看|kàn] [邮差|yóu chāi] [给|gěi] [我|wǒ] [送来|sòng lái] [了|le] [什么|shén me] ！ [一|yī] [封|fēng] [四十|sì shí] [年|nián] [前|qián] [的|de] [信|xìn] … [是|shì] [我|wǒ] [小|xiǎo] [时候|shí hou] [写|xiě] [给|gěi] [艾利欧|Ài lì ōu] [的|de] 。 [他|tā] [没|méi] [收到|shōu dào] 。 [这里|zhè lǐ] [有|yǒu] [一|yī] [句|jù] [话|huà] [是|shì] [别人|bié rén] [告诉|gào su] [我|wǒ] [的|de] … [那个|nà ge] [人|rén] [很|hěn] [像|xiàng] [你|nǐ] 。',
      '[見|み]て 、 [郵便屋|ゆうびんや] さん が [持|も]って きて くれた の ！ [四十年|よんじゅうねん] [前|まえ] の [手紙|てがみ] … わたし が [子|こ]ども の ころ 、 エリオ くん に [書|か]いた の 。 [届|とど]かなかった のね 。 ここ に 、 だれか が [教|おし]えて くれた ことば が ある … あなた に そっくり な [人|ひと] だった わ 。'),
    'frosa.letter': L('I’ve kept the letter for Elio. When we find him, I’ll give it to him myself.',
      'La carta para Elio la tengo guardada. Cuando lo encontremos, se la daré yo misma.',
      'A carta pro Elio está guardada comigo. Quando a gente achar ele, eu mesma vou entregar.',
      'Den Brief für Elio habe ich aufbewahrt. Wenn wir ihn finden, gebe ich ihn ihm selbst.',
      '[给|gěi] [艾利欧|Ài lì ōu] [的|de] [信|xìn] [我|wǒ] [一直|yī zhí] [留|liú] [着|zhe] 。 [找到|zhǎo dào] [他|tā] [的|de] [时候|shí hou] ， [我|wǒ] [会|huì] [亲手|qīn shǒu] [交给|jiāo gěi] [他|tā] 。',
      'エリオ くん へ の [手紙|てがみ] 、 ずっと [持|も]って いる の 。 [見|み]つけたら 、 わたし が [自分|じぶん] で [渡|わた]す わ 。'),
    // «The choir's robes» (Clara)
    'clara.ask': L('I want to sew new robes for the choir. But I lost the pattern… What were the ones that night like? You saw them.',
      'Quiero coser túnicas nuevas para el coro. Pero perdí el patrón… ¿Cómo eran las de esa noche? Tú las viste.',
      'Eu quero costurar túnicas novas pro coral. Mas perdi o molde… Como eram as daquela noite? Você viu.',
      'Ich will neue Gewänder für den Chor nähen. Aber ich habe das Schnittmuster verloren … Wie waren die von dem Abend? Du hast sie gesehen.',
      '[我|wǒ] [想|xiǎng] [给|gěi] [合唱团|hé chàng tuán] [缝|féng] [新|xīn] [长袍|cháng páo] 。 [可是|kě shì] [纸样|zhǐ yàng] [丢|diū] [了|le] … [那天|nà tiān] [晚上|wǎn shang] [的|de] [长袍|cháng páo] [是|shì] [什么|shén me] [样子|yàng zi] [的|de] ？ [你|nǐ] [看见|kàn jiàn] [过|guo] 。',
      '[合唱団|がっしょうだん] の [新|あたら]しい ローブ を [縫|ぬ]いたい の 。 でも 、 [型紙|かたがみ] を なくして しまって … あの [夜|よる] の ローブ は どんな だった ？ あなた 、 [見|み]た でしょう ？'),
    'clara.thanks': L('That’s it! Red, with a white collar… and big. Children grow so fast!',
      '¡Eso es! Rojas, con cuello blanco… y grandes. ¡Los niños crecen muy rápido!',
      'Isso! Vermelhas, com gola branca… e grandes. As crianças crescem muito rápido!',
      'Genau! Rot, mit weißem Kragen … und groß. Kinder wachsen so schnell!',
      '[对|duì] ！ [红色|hóng sè] [的|de] ， [白|bái] [领子|lǐng zi] ， [很|hěn] [大|dà] 。 [孩子|hái zi] [们|men] [长|zhǎng] [得|de] [很|hěn] [快|kuài] ！',
      'そう ！ [赤|あか]くて 、 [白|しろ]い [襟|えり] で 、 [大|おお]きい 。 [子|こ]ども は すぐ [大|おお]きく なる から ね ！'),
    // «Brave mistakes» (Julián and his pupils)
    'julian.ask': L('My pupils wrote about yesterday. They have brave mistakes! Will you help me correct them? They’re inside.',
      'Mis alumnos escribieron sobre ayer. ¡Tienen errores valientes! ¿Me ayudas a corregirlos? Están adentro.',
      'Os meus alunos escreveram sobre ontem. Eles têm erros corajosos! Me ajuda a corrigir? Eles estão lá dentro.',
      'Meine Schüler haben über gestern geschrieben. Sie haben mutige Fehler gemacht! Hilfst du mir beim Verbessern? Sie sind drinnen.',
      '[我|wǒ] [的|de] [学生|xué sheng] [写|xiě] [了|le] [昨天|zuó tiān] [的|de] [事|shì] 。 [他们|tā men] [的|de] [错误|cuò wù] [很|hěn] [勇敢|yǒng gǎn] ！ [你|nǐ] [帮|bāng] [我|wǒ] [改|gǎi] [一下|yī xià] [好|hǎo] [吗|ma] ？ [他们|tā men] [在|zài] [里面|lǐ miàn] 。',
      '[生徒|せいと] たち が 、 [昨日|きのう] の こと を [書|か]きました 。 [勇敢|ゆうかん] な まちがい が いっぱい ！ [直|なお]す の を [手伝|てつだ]って くれます か ？ [中|なか] に います よ 。'),
    'julian.thanks': L('Very good! Brave mistakes teach us. Here: a gold star.',
      '¡Muy bien! Los errores valientes nos enseñan. Toma: una estrella dorada.', 'Muito bem! Os erros corajosos ensinam a gente. Toma: uma estrela dourada.',
      'Sehr gut! Mutige Fehler bringen uns etwas bei. Hier: ein goldener Stern.',
      '[很|hěn] [好|hǎo] ！ [勇敢|yǒng gǎn] [的|de] [错误|cuò wù] [教|jiāo] [我们|wǒ men] [东西|dōng xi] 。 [给|gěi] [你|nǐ] ， [一|yī] [颗|kē] [金|jīn] [星星|xīng xing] 。',
      'よく できました ！ [勇敢|ゆうかん] な まちがい は 、 [先生|せんせい] です 。 はい 、 [金|きん] の [星|ほし] 。'),
    // Elena's bread for Pilar
    'elena.bread': L('Will you take this bread to Pilar? She’s at the theater, with her bell. I baked it this morning.',
      '¿Le llevas este pan a Pilar? Está en el teatro, con su campana. Lo horneé esta mañana.',
      'Você leva esse pão pra Pilar? Ela está no teatro, com o sino. Eu assei hoje de manhã.',
      'Bringst du Pilar dieses Brot? Sie ist am Theater, mit ihrer Glocke. Ich habe es heute Morgen gebacken.',
      '[你|nǐ] [能|néng] [把|bǎ] [这个|zhè ge] [面包|miàn bāo] [带|dài] [给|gěi] [皮拉尔|Pí lā ěr] [吗|ma] ？ [她|tā] [在|zài] [剧院|jù yuàn] [门口|mén kǒu] 。 [我|wǒ] [今天|jīn tiān] [早上|zǎo shang] [烤|kǎo] [了|le] [面包|miàn bāo] 。',
      'この パン 、 ピラール さん に [持|も]って いって くれる ？ [劇場|げきじょう] の [前|まえ] に いる わ 。 [今朝|けさ] [焼|や]いた の よ 。'),
    'pilar.bread': L('Warm bread! Who baked it?', '¡Pan calentito! ¿Quién lo horneó?', 'Pão quentinho! Quem assou?', 'Warmes Brot! Wer hat es gebacken?',
      '[热|rè] [面包|miàn bāo] ！ [埃莱娜|Āi lái nà] [今天|jīn tiān] [早上|zǎo shang] [做|zuò] [了|le] [什么|shén me] ？', '[焼|や]きたて の パン ！ だれ が [焼|や]いた の ？'),
    'pilar.thanks': L('Delicious! Since that night I haven’t rung the theater’s bell… but tomorrow I’ll ring it again. For Elena!',
      '¡Qué rico! Desde esa noche no toco la campana del teatro… pero mañana la toco otra vez. ¡Por Elena!',
      'Que delícia! Desde aquela noite eu não toco o sino do teatro… mas amanhã eu toco de novo. Pela Elena!',
      'Lecker! Seit dem Abend läute ich die Theaterglocke nicht mehr … aber morgen läute ich sie wieder. Für Elena!',
      '[真|zhēn] [香|xiāng] ！ [从|cóng] [那天|nà tiān] [晚上|wǎn shang] [起|qǐ] ， [我|wǒ] [就|jiù] [不|bù] [敲|qiāo] [剧院|jù yuàn] [的|de] [钟|zhōng] [了|le] … [可是|kě shì] [明天|míng tiān] [我|wǒ] [要|yào] [再|zài] [敲|qiāo] ！',
      'おいしい ！ あの [夜|よる] から 、 [劇場|げきじょう] の [鐘|かね] を [鳴|な]らして いない けど … [明日|あした] 、 また [鳴|な]らします ！'),
    // young Tina, who doesn't want to sing any more
    'tina.ask': L('Since that night, I don’t want to sing. What if they laugh at me? … In the choir, Rosa sang so well. Her voice was so pretty. And mine?',
      'Desde esa noche, no quiero cantar. ¿Y si se ríen de mí? … En el coro, Rosita cantaba muy bien. Su voz era muy bonita. ¿Y la mía?',
      'Desde aquela noite eu não quero cantar. E se rirem de mim? … No coral, a Rosinha cantava muito bem. A voz dela era muito bonita. E a minha?',
      'Seit dem Abend will ich nicht mehr singen. Und wenn sie über mich lachen? … Im Chor hat Rosi so schön gesungen. Ihre Stimme war so schön. Und meine?',
      '[从|cóng] [那天|nà tiān] [晚上|wǎn shang] [起|qǐ] ， [我|wǒ] [不|bù] [想|xiǎng] [唱歌|chàng gē] [了|le] 。 [要是|yào shi] [大家|dà jiā] [笑|xiào] [我|wǒ] [怎么办|zěn me bàn] ？ … [那时候|nà shí hou] [在|zài] [合唱团|hé chàng tuán] [里|lǐ] ， [小|Xiǎo] [罗莎|Luó shā] [的|de] [声音|shēng yīn] [很|hěn] [好听|hǎo tīng] 。 [我|wǒ] [的|de] [呢|ne] ？',
      'あの [夜|よる] から 、 [歌|うた]いたく ない の 。 [笑|わら]われたら どう しよう … [合唱団|がっしょうだん] で 、 ロサ ちゃん の [声|こえ] は とても きれい だった 。 わたし の は ？'),
    'tina.thanks': L('Really? … Then I’ll sing again. Quietly at first!', '¿De verdad? … Entonces voy a cantar otra vez. ¡Bajito primero!', 'Sério? … Então eu vou cantar de novo. Baixinho primeiro!', 'Wirklich? … Dann singe ich wieder. Erst ganz leise!',
      '[真|zhēn] [的|de] [吗|ma] ？ … [那|nà] [我|wǒ] [再|zài] [唱|chàng] [吧|ba] 。 [先|xiān] [小声|xiǎo shēng] [唱|chàng] ！', 'ほんとう ？ … じゃあ 、 また [歌|うた]う 。 [最初|さいしょ] は [小|ちい]さな [声|こえ] で ！'),
    // young Marta, Elena's apprentice (the bakery of then)
    'marta.ask': L('I’m learning to make bread with Elena. Did she knead the dough first? Or bake it first? I get mixed up! What did she do first?',
      'Estoy aprendiendo a hacer pan con Elena. ¿Primero amasó la masa? ¿O primero la horneó? ¡Me confundo! ¿Qué hizo primero?',
      'Eu estou aprendendo a fazer pão com a Elena. Primeiro ela amassou a massa? Ou primeiro assou? Eu me confundo! O que ela fez primeiro?',
      'Ich lerne bei Elena Brot backen. Hat sie zuerst den Teig geknetet? Oder zuerst gebacken? Ich bringe alles durcheinander! Was hat sie zuerst gemacht?',
      '[我|wǒ] [在|zài] [跟|gēn] [埃莱娜|Āi lái nà] [学|xué] [做|zuò] [面包|miàn bāo] 。 [她|tā] [先|xiān] [揉|róu] [了|le] [面|miàn] ？ [还是|hái shì] [先|xiān] [烤|kǎo] [了|le] ？ [我|wǒ] [搞|gǎo] [混|hùn] [了|le] ！ [她|tā] [先|xiān] [做|zuò] [了|le] [什么|shén me] ？',
      'エレナ さん に パン の [作|つく]り[方|かた] を [習|なら]って いる の 。 [先|さき] に [生地|きじ] を こねた ？ それとも [先|さき] に [焼|や]いた ？ わからなく なっちゃった ！ [最初|さいしょ] に [何|なに] を した の かな ？'),
    'marta.thanks': L('Of course! The dough first. Someday I’ll have my own bakery in the plaza!',
      '¡Claro! Primero la masa. ¡Algún día voy a tener mi propia panadería en la plaza!',
      'Claro! Primeiro a massa. Um dia eu vou ter a minha própria padaria na praça!',
      'Klar! Zuerst der Teig. Eines Tages habe ich meine eigene Bäckerei am Platz!',
      '[对|duì] ！ [先|xiān] [揉|róu] [面|miàn] 。 [总有一天|zǒng yǒu yī tiān] ， [我|wǒ] [要|yào] [在|zài] [广场|guǎng chǎng] [开|kāi] [自己|zì jǐ] [的|de] [面包店|miàn bāo diàn] ！',
      'そっか ！ [先|さき] に [生地|きじ] ね 。 いつか 、 [広場|ひろば] で [自分|じぶん] の パン[屋|や] を [開|ひら]く ん だ ！'),
  });

  // ------------------------------------------------------------ demonstrations (whole in the language, said aloud, the shown words
  // glossed: STORY.demoLine with MARKS). Each one teaches what's asked right after it. (de, zh and ja: Félix's and Elena's memories
  // also teach the line each language's Elio got wrong, which the Prompter's last lie is about.)
  const DEMO = {
    'mem.felix': L('That night I was playing the piano. Elio went up on the stage and said one word wrong. Everyone laughed.',
      'Esa noche yo tocaba el piano. Elio subió al escenario y dijo una palabra mal. Todos se rieron.',
      'Naquela noite eu tocava piano. O Elio subiu no palco e disse uma palavra errada. Todo mundo riu.',
      'An dem Abend habe ich Klavier gespielt. Elio ist auf die Bühne gegangen und hat ein Wort falsch gesagt: „Glucken“ statt „Glocken“. Alle haben gelacht.',
      '[那天|nà tiān] [晚上|wǎn shang] [我|wǒ] [在|zài] [弹|tán] [钢琴|gāng qín] 。 [艾利欧|Ài lì ōu] [上|shàng] [了|le] [舞台|wǔ tái] 。 [他|tā] [想|xiǎng] [说|shuō] “ [大家|dà jiā] [好|hǎo] ” ， [可是|kě shì] [说成|shuō chéng] [了|le] “ [打架|dǎ jià] [好|hǎo] ” 。 [大家|dà jiā] [都|dōu] [笑|xiào] [了|le] 。',
      'その [夜|よる] 、 わたし は ピアノ を [弾|ひ]いて いました 。 エリオ くん が [舞台|ぶたい] に [上|あ]がった 。 「 [親切|しんせつ] 」 と [言|い]いたかった のに 、 「 [新鮮|しんせん] 」 と [言|い]って しまった 。 みんな が [笑|わら]った 。',
      { en_de: 'That night I was playing the piano. Elio went up on the stage and said one word wrong: «Glucken» (broody hens) instead of «Glocken» (bells). Everyone laughed.',
        en_zh: 'That night I was playing the piano. Elio went up on the stage. He wanted to say «大家好» (hello, everyone), but it came out «打架好» (fighting, hello). Everyone laughed.',
        en_ja: 'That night I was playing the piano. Elio went up on the stage. He wanted to say «親切» (kind), but he said «新鮮» (fresh). Everyone laughed.' }),
    'mem.clara': L('I was in the front row. Elio was very scared. His hands were shaking.',
      'Yo estaba en la primera fila. Elio tenía mucho miedo. Le temblaban las manos.',
      'Eu estava na primeira fila. O Elio tinha muito medo. As mãos dele tremiam.',
      'Ich war in der ersten Reihe. Elio hatte große Angst. Seine Hände haben gezittert.',
      '[我|wǒ] [坐|zuò] [在|zài] [第一|dì yī] [排|pái] 。 [那时候|nà shí hou] [艾利欧|Ài lì ōu] [很|hěn] [害怕|hài pà] ， [手|shǒu] [一直|yī zhí] [在|zài] [抖|dǒu] 。',
      'わたし は いちばん [前|まえ] の [席|せき] に いました 。 エリオ くん は とても こわかった 。 [手|て] が ふるえて いました 。'),
    'mem.mateo': L('That night, Elio ran down this street. He wasn’t wearing his red cap.',
      'Esa noche, Elio corrió por esta calle. No llevaba su gorra roja.',
      'Naquela noite, o Elio correu por esta rua. Ele não estava com o boné vermelho.',
      'An dem Abend ist Elio durch diese Straße gerannt. Er hatte seine rote Mütze nicht auf.',
      '[那天|nà tiān] [晚上|wǎn shang] ， [艾利欧|Ài lì ōu] [从|cóng] [这条|zhè tiáo] [街|jiē] [跑|pǎo] [了|le] [过去|guò qù] 。 [他|tā] [没有|méi yǒu] [戴|dài] [他|tā] [的|de] [红|hóng] [帽子|mào zi] 。',
      'その [夜|よる] 、 エリオ くん は この [道|みち] を [走|はし]って いった 。 [赤|あか]い [帽子|ぼうし] を かぶって いなかった 。'),
    'mem.elena': L('Elio and his dad arrived in winter. Every morning, Elio came for bread and said “thank you” very quietly.',
      'Elio y su papá llegaron en invierno. Cada mañana, Elio venía por pan y decía «gracias» muy bajito.',
      'O Elio e o pai dele chegaram no inverno. Toda manhã, o Elio vinha buscar pão e dizia «obrigado» bem baixinho.',
      'Elio und sein Papa sind im Winter gekommen. Elio mochte unsere Glocken so sehr! Jeden Morgen hat er Brot geholt und ganz leise „danke“ gesagt.',
      '[艾利欧|Ài lì ōu] [和|hé] [爸爸|bà ba] [冬天|dōng tiān] [来到|lái dào] [了|le] [这里|zhè lǐ] 。 [以前|yǐ qián] [他|tā] [每天|měi tiān] [早上|zǎo shang] [来|lái] [买|mǎi] [面包|miàn bāo] ， [小声|xiǎo shēng] [说|shuō] “ [谢谢|xiè xie] ” 。',
      'エリオ くん と お[父|とう]さん は [冬|ふゆ] に [来|き]た の 。 [毎朝|まいあさ] パン を [買|か]い に [来|き]て 、 [小|ちい]さな [声|こえ] で 「 ありがとう 」 って [言|い]って いた わ 。',
      { en_de: 'Elio and his dad came in winter. Elio liked our bells so much! Every morning he came for bread and said “thank you” very quietly.' }),
    'aurora.locked': L('That night I locked the theater. Since then, nobody has gone in.',
      'Esa noche cerré el teatro con llave. Desde entonces, nadie entró.',
      'Naquela noite eu tranquei o teatro. Desde então, ninguém entrou.',
      'An dem Abend habe ich das Theater abgeschlossen. Seitdem war niemand drin.',
      '[那天|nà tiān] [晚上|wǎn shang] [我|wǒ] [把|bǎ] [剧院|jù yuàn] [锁|suǒ] [上|shàng] [了|le] 。 [从|cóng] [那以后|nà yǐ hòu] ， [没有|méi yǒu] [人|rén] [进去|jìn qù] [过|guo] 。',
      'あの [夜|よる] 、 わたし が [劇場|げきじょう] に [鍵|かぎ] を かけました 。 それ から 、 だれ も [入|はい]って いません 。'),
    // under the stage: the memories of that night (each a person of then, as a sepia ghost)
    'r1.mem': L('That night, the oil lamp was lit. Lorenzo pushed the moon aside… and opened the way.',
      'Esa noche, la lámpara estaba encendida. Lorenzo empujó la luna a un lado… y abrió el camino.',
      'Naquela noite, o lampião estava aceso. O Lorenzo empurrou a lua pro lado… e abriu o caminho.',
      'An dem Abend war die Lampe an. Lorenzo hat den Mond zur Seite geschoben … und den Weg frei gemacht.',
      '[那天|nà tiān] [晚上|wǎn shang] ， [油灯|yóu dēng] [亮|liàng] [着|zhe] 。 [洛伦索|Luò lún suǒ] [把|bǎ] [月亮|yuè liang] [推|tuī] [开|kāi] [了|le] … [路|lù] [就|jiù] [通|tōng] [了|le] 。',
      'あの [夜|よる] 、 ランプ が ついて いました 。 ロレンソ さん が [月|つき] を [押|お]した … そして 、 [道|みち] が [開|ひら]いた 。'),
    'r2.mem': L('That night, the robes were red. Before the concert, Clara blew the dust off every one: whoosh!',
      'Esa noche, las túnicas eran rojas. Antes del concierto, Clara sopló el polvo de cada una: ¡fu!',
      'Naquela noite, as túnicas eram vermelhas. Antes do concerto, a Clara soprou a poeira de cada uma: fuu!',
      'An dem Abend waren die Gewänder rot. Vor dem Konzert hat Clara den Staub von jedem weggepustet: Fff!',
      '[那天|nà tiān] [晚上|wǎn shang] ， [长袍|cháng páo] [是|shì] [红色|hóng sè] [的|de] 。 [音乐会|yīn yuè huì] [前|qián] ， [克拉拉|Kè lā lā] [把|bǎ] [灰尘|huī chén] [都|dōu] [吹|chuī] [走|zǒu] [了|le] ： [呼|hū] ！',
      'あの [夜|よる] 、 ローブ は [赤|あか]かった 。 コンサート の [前|まえ] に 、 クララ さん が ほこり を [吹|ふ]いた の 。 ふーっ ！'),
    'r3.mem': L('That night, the trapdoor was open. Elio came down the ladder and hid here. I saw him.',
      'Esa noche, la trampilla estaba abierta. Elio bajó por la escalera y se escondió aquí. Yo lo vi.',
      'Naquela noite, o alçapão estava aberto. O Elio desceu pela escada e se escondeu aqui. Eu vi.',
      'An dem Abend war die Falltür offen. Elio ist die Leiter hinuntergeklettert und hat sich hier versteckt. Ich habe es gesehen.',
      '[那天|nà tiān] [晚上|wǎn shang] ， [活板门|huó bǎn mén] [开|kāi] [着|zhe] 。 [艾利欧|Ài lì ōu] [从|cóng] [梯子|tī zi] [上|shàng] [下来|xià lái] [了|le] ， [躲|duǒ] [在|zài] [这里|zhè lǐ] 。 [我|wǒ] [看见|kàn jiàn] [了|le] 。',
      'あの [夜|よる] 、 [上|うえ] の [扉|とびら] が [開|あ]いて いました 。 エリオ くん は はしご を [下|お]りて 、 ここ に かくれた 。 わたし 、 [見|み]た の 。'),
    'r4.aurora': L('No! The curtain was open. And the theater was full of people.',
      '¡No! La cortina estaba abierta. Y el teatro estaba lleno de gente.',
      'Não! A cortina estava aberta. E o teatro estava cheio de gente.',
      'Nein! Der Vorhang war offen. Und das Theater war voll.',
      '[不|bù] ！ [幕布|mù bù] [是|shì] [开|kāi] [着|zhe] [的|de] 。 [剧院|jù yuàn] [里|lǐ] [坐满|zuò mǎn] [了|le] [人|rén] 。',
      'いいえ ！ [幕|まく] は [開|あ]いて いました 。 [劇場|げきじょう] も いっぱい でした 。'),
    'letter.demo': L('Look, here I put: “That night, Elio was very brave. He was always kind.”',
      'Mira, aquí puse: «Esa noche, Elio fue muy valiente. Siempre era amable.»',
      'Olha, aqui eu escrevi: «Naquela noite, o Elio foi muito corajoso. Ele sempre era gentil.»',
      'Schau, hier steht: „An dem Abend war Elio sehr mutig. Er war immer nett.“',
      '[你|nǐ] [看|kàn] ， [我|wǒ] [写|xiě] [了|le] ： “ [那天|nà tiān] [晚上|wǎn shang] ， [艾利欧|Ài lì ōu] [很|hěn] [勇敢|yǒng gǎn] 。 [以前|yǐ qián] [他|tā] [一直|yī zhí] [很|hěn] [友好|yǒu hǎo] 。 ”',
      '[見|み]て 。 「 あの [夜|よる] 、 エリオ くん は とても [勇敢|ゆうかん] だった 。 いつも やさしかった 」 って [書|か]いた の 。'),
  };
  // the lines a demonstration's words are glossed in: [as written (zh / ja: notation tokens), English]
  const MARKS = {
    'mem.felix': { es: [['tocaba', 'was playing'], ['subió', 'went up'], ['escenario', 'stage'], ['se rieron', 'laughed']], pt: [['tocava', 'was playing'], ['subiu', 'went up'], ['palco', 'stage'], ['riu', 'laughed']],
      de: [['gegangen', 'went (ist … gegangen)'], ['Bühne', 'stage'], ['gesagt', 'said'], ['gelacht', 'laughed']],
      zh: [['[上|shàng] [了|le]', 'went up onto'], ['[舞台|wǔ tái]', 'stage'], ['[想|xiǎng] [说|shuō]', 'wanted to say'], ['[笑|xiào] [了|le]', 'laughed']],
      ja: [['[上|あ]がった', 'went up'], ['[舞台|ぶたい]', 'stage'], ['[言|い]いたかった', 'wanted to say'], ['[笑|わら]った', 'laughed']] },
    'mem.clara': { es: [['estaba', 'was'], ['primera fila', 'front row'], ['tenía mucho miedo', 'was very scared'], ['temblaban', 'were shaking']], pt: [['estava', 'was'], ['primeira fila', 'front row'], ['tinha muito medo', 'was very scared'], ['tremiam', 'were shaking']],
      de: [['war', 'was'], ['ersten Reihe', 'front row'], ['hatte große Angst', 'was very scared'], ['gezittert', 'shaken']],
      zh: [['[第一|dì yī] [排|pái]', 'the front row'], ['[那时候|nà shí hou]', 'back then'], ['[害怕|hài pà]', 'scared'], ['[抖|dǒu]', 'shake']],
      ja: [['いちばん [前|まえ] の [席|せき]', 'the front row'], ['こわかった', 'was scared'], ['ふるえて いました', 'were shaking']] },
    'mem.mateo': { es: [['corrió', 'ran'], ['calle', 'street'], ['llevaba', 'was wearing'], ['gorra', 'cap']], pt: [['correu', 'ran'], ['rua', 'street'], ['boné', 'cap']], de: [['gerannt', 'ran (ist … gerannt)'], ['Straße', 'street'], ['Mütze', 'cap']],
      zh: [['[跑|pǎo] [了|le]', 'ran'], ['[街|jiē]', 'street'], ['[戴|dài]', 'wear (a hat)']], ja: [['[走|はし]って いった', 'ran off'], ['[道|みち]', 'street'], ['かぶって いなかった', 'wasn’t wearing']] },
    'mem.elena': { es: [['llegaron', 'they arrived'], ['invierno', 'winter'], ['venía', 'came (every day)'], ['decía', 'would say']], pt: [['chegaram', 'they arrived'], ['inverno', 'winter'], ['vinha', 'came (every day)'], ['dizia', 'would say']],
      de: [['gekommen', 'come (sind … gekommen: they came)'], ['Winter', 'winter'], ['mochte', 'liked'], ['Glocken', 'bells']],
      zh: [['[冬天|dōng tiān]', 'winter'], ['[来到|lái dào] [了|le]', 'came to'], ['[以前|yǐ qián]', 'back then']], ja: [['[冬|ふゆ]', 'winter'], ['[来|き]た', 'came'], ['[言|い]って いた', 'used to say']] },
    'aurora.locked': { es: [['cerré', 'I locked (cerrar)'], ['con llave', 'with the key'], ['nadie entró', 'nobody went in']], pt: [['tranquei', 'I locked'], ['ninguém entrou', 'nobody went in']], de: [['abgeschlossen', 'locked'], ['niemand', 'nobody']],
      zh: [['[锁|suǒ] [上|shàng] [了|le]', 'locked'], ['[进去|jìn qù] [过|guo]', 'has gone in']], ja: [['[鍵|かぎ] を かけました', 'locked'], ['[入|はい]って いません', 'hasn’t gone in']] },
    'r1.mem': { es: [['estaba encendida', 'was lit'], ['lámpara', 'lamp'], ['empujó', 'pushed'], ['luna', 'moon']], pt: [['estava aceso', 'was lit'], ['lampião', 'oil lamp'], ['empurrou', 'pushed'], ['lua', 'moon']],
      de: [['war', 'was'], ['an', 'on (lit)'], ['geschoben', 'pushed'], ['Mond', 'moon']], zh: [['[亮|liàng] [着|zhe]', 'was lit'], ['[油灯|yóu dēng]', 'oil lamp'], ['[推|tuī] [开|kāi] [了|le]', 'pushed away'], ['[月亮|yuè liang]', 'moon']],
      ja: [['ついて いました', 'was on'], ['ランプ', 'lamp'], ['[押|お]した', 'pushed'], ['[月|つき]', 'moon']] },
    'r2.mem': { es: [['eran rojas', 'were red'], ['túnicas', 'robes'], ['sopló', 'blew'], ['polvo', 'dust']], pt: [['eram vermelhas', 'were red'], ['túnicas', 'robes'], ['soprou', 'blew'], ['poeira', 'dust']],
      de: [['waren', 'were'], ['rot', 'red'], ['Gewänder', 'robes'], ['weggepustet', 'blew away'], ['Staub', 'dust']], zh: [['[是|shì] [红色|hóng sè] [的|de]', 'were red'], ['[长袍|cháng páo]', 'robes'], ['[吹|chuī] [走|zǒu] [了|le]', 'blew away'], ['[灰尘|huī chén]', 'dust']],
      ja: [['[赤|あか]かった', 'were red'], ['ローブ', 'robes'], ['[吹|ふ]いた', 'blew'], ['ほこり', 'dust']] },
    'r3.mem': { es: [['trampilla', 'trapdoor'], ['estaba abierta', 'was open'], ['bajó', 'came down'], ['escalera', 'ladder'], ['se escondió', 'hid']], pt: [['alçapão', 'trapdoor'], ['estava aberto', 'was open'], ['desceu', 'came down'], ['escada', 'ladder'], ['se escondeu', 'hid']],
      de: [['Falltür', 'trapdoor'], ['war offen', 'was open'], ['hinuntergeklettert', 'climbed down'], ['Leiter', 'ladder'], ['versteckt', 'hidden']],
      zh: [['[活板门|huó bǎn mén]', 'trapdoor'], ['[开|kāi] [着|zhe]', 'was open'], ['[下来|xià lái] [了|le]', 'came down'], ['[梯子|tī zi]', 'ladder'], ['[躲|duǒ]', 'hide']],
      ja: [['[扉|とびら]', 'door (the trapdoor)'], ['[開|あ]いて いました', 'was open'], ['[下|お]りて', 'came down'], ['はしご', 'ladder'], ['かくれた', 'hid']] },
    'r4.aurora': { es: [['No', 'no'], ['estaba abierta', 'was open'], ['cortina', 'curtain'], ['lleno', 'full']], pt: [['Não', 'no'], ['estava aberta', 'was open'], ['cortina', 'curtain'], ['cheio', 'full']],
      de: [['Nein', 'no'], ['war offen', 'was open'], ['Vorhang', 'curtain'], ['voll', 'full']], zh: [['[不|bù]', 'no'], ['[开|kāi] [着|zhe]', 'was open'], ['[幕布|mù bù]', 'curtain'], ['[坐满|zuò mǎn] [了|le]', 'was full']],
      ja: [['いいえ', 'no'], ['[開|あ]いて いました', 'was open'], ['[幕|まく]', 'curtain'], ['いっぱい でした', 'was full']] },
    'letter.demo': { es: [['fue', 'was'], ['valiente', 'brave'], ['era', 'was'], ['amable', 'kind']], pt: [['foi', 'was'], ['corajoso', 'brave'], ['era', 'was'], ['gentil', 'kind']], de: [['war', 'was'], ['mutig', 'brave'], ['nett', 'kind']],
      zh: [['[勇敢|yǒng gǎn]', 'brave'], ['[友好|yǒu hǎo]', 'friendly, kind']], ja: [['[勇敢|ゆうかん] だった', 'was brave'], ['やさしかった', 'was kind']] },
    echo: { es: [['llegamos', 'we arrived'], ['invierno', 'winter']], pt: [['chegamos', 'we arrived'], ['inverno', 'winter']], de: [['liebe', 'love'], ['Glocken', 'bells']],
      zh: [['[大家|dà jiā] [好|hǎo]', 'hello, everyone'], ['[叫|jiào]', 'am called']], ja: [['みなさん', 'everyone'], ['[親切|しんせつ]', 'kind']] },
  };
  // Elio's echo (CH4.word): the line he got wrong at the concert, said right (es / pt: past_text.js 'pa.elio.practice'; de, zh and ja:
  // the sentence the slip ruined); its English by language
  const ECHO = { es: 'Mi papá y yo llegamos en invierno.', pt: 'Meu pai e eu chegamos no inverno.', de: 'Ich liebe eure Glocken!',
    zh: '[大家|dà jiā] [好|hǎo] ！ [我|wǒ] [叫|jiào] [艾利欧|Ài lì ōu] 。', ja: 'アルバ の みなさん は 、 とても [親切|しんせつ] です 。',
    en: { es: 'My dad and I arrived in winter.', pt: 'My dad and I arrived in winter.', de: 'I love your bells!', zh: 'Hello, everyone! My name is Elio.', ja: 'The people of Alba are very kind.' } };

  // ------------------------------------------------------------ the tasks: what you say, graded S–D (alba_past.js AP.grade)
  // frame (the box, ___ the blank), chips ([word, English]), model (the whole sentence: «?» and after two misses), want (one must be
  // there: a string, or a list that must all be there), alt (right, a little off: A, with tipAlt), other (the other past: B), pres
  // (now, not then: "That's now. It already happened"), more (the rest of the sentence: one of them for an S), lie (what the
  // Prompter said: not a correction), wrong (a right-sounding wrong answer, with tipWrong). zh / ja items in CJK.md's notation.
  const TK6 = o => o;
  const TASKS = {
    // step 1: the people of then about the night of the concert
    'ask.felix': TK6({ title: 'Félix asks: «What did Elio do?» Tell him what happened, in the past.',
      frame: { es: 'Elio ___ al escenario.', pt: 'O Elio ___ no palco.', de: 'Elio ist auf die Bühne ___.', zh: '[艾利欧|Ài lì ōu] ___ [舞台|wǔ tái] 。', ja: 'エリオ くん は [舞台|ぶたい] に ___ 。' },
      chips: { es: [['subió', 'went up']], pt: [['subiu', 'went up']], de: [['gegangen', 'went']], zh: [['[上|shàng] [了|le]', 'went up onto']], ja: [['[上|あ]がった', 'went up']] },
      model: L('Elio went up on the stage.', 'Elio subió al escenario.', 'O Elio subiu no palco.', 'Elio ist auf die Bühne gegangen.', '[艾利欧|Ài lì ōu] [上|shàng] [了|le] [舞台|wǔ tái] 。', 'エリオ くん は [舞台|ぶたい] に [上|あ]がった 。'),
      want: { es: ['subió'], pt: ['subiu'], de: [['ist', 'gegangen'], ['ist', 'gestiegen']], zh: [['[上|shàng]', '[了|le]']], ja: ['[上|あ]がった', '[上|あ]がりました'] },
      alt: { de: ['ging', 'stieg'] }, other: { es: ['subía'], pt: ['subia'] },
      pres: { es: ['sube', 'subir', 'subo'], pt: ['sobe', 'subir'], de: ['geht', 'gehen', 'steigt'], zh: ['[上|shàng]'], ja: ['[上|あ]がる', '[上|あ]がります', '[上|あ]がって'] },
      more: { es: ['escenario'], pt: ['palco'], de: ['bühne'], zh: ['[舞台|wǔ tái]'], ja: ['[舞台|ぶたい]'] } }),
    'ask.clara': TK6({ title: 'Clara asks: «How was Elio?» Tell her how he was.',
      frame: { es: 'Elio ___ miedo.', pt: 'O Elio ___ medo.', de: 'Elio ___ Angst.', zh: '[那时候|nà shí hou] [艾利欧|Ài lì ōu] [很|hěn] ___ 。', ja: 'エリオ くん は ___ 。' },
      chips: { es: [['tenía', 'had (tenía miedo: was scared)']], pt: [['tinha', 'had (tinha medo: was scared)']], de: [['hatte', 'had (Angst haben: be scared)']], zh: [['[害怕|hài pà]', 'scared']], ja: [['こわかった', 'was scared']] },
      model: L('Elio was scared.', 'Elio tenía miedo.', 'O Elio tinha medo.', 'Elio hatte Angst.', '[那时候|nà shí hou] [艾利欧|Ài lì ōu] [很|hěn] [害怕|hài pà] 。', 'エリオ くん は こわかった 。'),
      want: { es: ['tenía'], pt: ['tinha'], de: ['hatte'], zh: [['[害怕|hài pà]']], ja: ['こわかった', '[怖|こわ]かった'] },
      alt: { de: [['hat', 'gehabt']] }, other: { es: ['tuvo'], pt: ['teve'] },
      pres: { es: ['tiene', 'tener'], pt: ['tem', 'ter'], de: ['hat', 'haben'], ja: ['こわい', '[怖|こわ]い'] },
      more: { es: ['miedo'], pt: ['medo'], de: ['angst'], zh: ['[那时候|nà shí hou]', '[那天|nà tiān]', '[以前|yǐ qián]'], ja: ['エリオ'] } }),
    'ask.mateo': TK6({ title: 'Mateo asks: «What did Elio do that night?»',
      frame: { es: 'Elio ___ por la calle.', pt: 'O Elio ___ pela rua.', de: 'Elio ist durch die Straße ___.', zh: '[艾利欧|Ài lì ōu] ___ 。', ja: 'エリオ くん は [道|みち] を ___ 。' },
      chips: { es: [['corrió', 'ran']], pt: [['correu', 'ran']], de: [['gerannt', 'ran']], zh: [['[跑|pǎo] [了|le]', 'ran']], ja: [['[走|はし]った', 'ran']] },
      model: L('Elio ran down the street.', 'Elio corrió por la calle.', 'O Elio correu pela rua.', 'Elio ist durch die Straße gerannt.', '[艾利欧|Ài lì ōu] [跑|pǎo] [了|le] 。', 'エリオ くん は [道|みち] を [走|はし]った 。'),
      want: { es: ['corrió'], pt: ['correu'], de: [['ist', 'gerannt'], ['ist', 'gelaufen']], zh: [['[跑|pǎo]', '[了|le]']], ja: ['[走|はし]った', '[走|はし]りました', '[走|はし]って いった'] },
      alt: { de: ['rannte', 'lief'] }, other: { es: ['corría'], pt: ['corria'] },
      pres: { es: ['corre', 'correr', 'corro'], pt: ['corre', 'correr'], de: ['rennt', 'läuft', 'rennen'], zh: ['[跑|pǎo]'], ja: ['[走|はし]る', '[走|はし]ります', '[走|はし]って'] },
      more: { es: ['calle'], pt: ['rua'], de: ['straße'], ja: ['[道|みち]'] } }),
    'ask.elena': TK6({ title: 'Elena asks: «When did Elio and his dad arrive?»',
      frame: { es: 'Elio y su papá ___ en invierno.', pt: 'O Elio e o pai ___ no inverno.', de: 'Elio und sein Papa sind im Winter ___.', zh: '[艾利欧|Ài lì ōu] [和|hé] [爸爸|bà ba] ___ [来到|lái dào] [了|le] [这里|zhè lǐ] 。', ja: 'エリオ くん と お[父|とう]さん は [冬|ふゆ] に ___ 。' },
      chips: { es: [['llegaron', 'arrived (they)']], pt: [['chegaram', 'arrived (they)']], de: [['gekommen', 'come']], zh: [['[冬天|dōng tiān]', 'in winter']], ja: [['[来|き]た', 'came']] },
      model: L('Elio and his dad arrived in winter.', 'Elio y su papá llegaron en invierno.', 'O Elio e o pai chegaram no inverno.', 'Elio und sein Papa sind im Winter gekommen.', '[艾利欧|Ài lì ōu] [和|hé] [爸爸|bà ba] [冬天|dōng tiān] [来到|lái dào] [了|le] [这里|zhè lǐ] 。', 'エリオ くん と お[父|とう]さん は [冬|ふゆ] に [来|き]た 。'),
      want: { es: ['llegaron'], pt: ['chegaram'], de: [['sind', 'gekommen'], ['sind', 'angekommen']], zh: [['[冬天|dōng tiān]', '[了|le]']], ja: ['[来|き]た', '[来|き]ました'] },
      alt: { es: ['llegó'], pt: ['chegou'], de: ['kamen'] }, tipAlt: { es: 'Right! Two of them arrived: «llegaron».', pt: 'Right! Two of them arrived: «chegaram».' },
      other: { es: ['llegaban'], pt: ['chegavam'] },
      pres: { es: ['llegan', 'llegar'], pt: ['chegam', 'chegar'], de: ['kommen'], zh: [['[冬天|dōng tiān]']], ja: ['[来|く]る', '[来|き]ます'] },
      tipPres: { zh: 'It already happened: «冬天来到了这里» (了: it happened).' },
      more: { es: ['invierno'], pt: ['inverno'], de: ['winter'], zh: ['[来|lái]'], ja: ['[冬|ふゆ]'] } }),
    // step 2: Aurora, one thing that happened that night (any of them)
    key: TK6({ title: 'Aurora wants to know what you understood. Tell her one thing that happened that night, in the past.',
      frame: { es: 'Elio ___…', pt: 'O Elio ___…', de: 'Elio ___…', zh: '[艾利欧|Ài lì ōu] ___ 。', ja: 'エリオ くん は ___ 。' },
      chips: { es: [['subió', 'went up'], ['tenía miedo', 'was scared'], ['corrió', 'ran']], pt: [['subiu', 'went up'], ['tinha medo', 'was scared'], ['correu', 'ran']],
        de: [['ist … gegangen', 'went'], ['hatte Angst', 'was scared'], ['ist … gerannt', 'ran']], zh: [['[上|shàng] [了|le] [舞台|wǔ tái]', 'went up onto the stage'], ['[很|hěn] [害怕|hài pà]', 'was scared'], ['[跑|pǎo] [了|le]', 'ran']],
        ja: [['[上|あ]がった', 'went up'], ['こわかった', 'was scared'], ['[走|はし]った', 'ran']] },
      model: L('Elio was scared.', 'Elio tenía miedo.', 'O Elio tinha medo.', 'Elio hatte Angst.', '[那时候|nà shí hou] [艾利欧|Ài lì ōu] [很|hěn] [害怕|hài pà] 。', 'エリオ くん は こわかった 。'),
      want: { es: ['subió', 'corrió', 'dijo', 'tenía', 'estaba', 'llegaron', 'llegó', 'rieron'], pt: ['subiu', 'correu', 'disse', 'tinha', 'estava', 'chegaram', 'chegou', 'riu', 'riram'],
        de: [['ist', 'gegangen'], ['ist', 'gerannt'], ['hat', 'gesagt'], 'hatte', 'war', ['haben', 'gelacht'], ['sind', 'gekommen'], 'mochte'],
        zh: [['[上|shàng]', '[了|le]'], ['[跑|pǎo]', '[了|le]'], ['[笑|xiào]', '[了|le]'], ['[说|shuō]', '[了|le]'], ['[害怕|hài pà]'], ['[冬天|dōng tiān]']],
        ja: ['[上|あ]がった', '[走|はし]った', '[笑|わら]った', '[言|い]った', 'こわかった', '[来|き]た', '[上|あ]がりました', '[走|はし]りました', '[笑|わら]いました'] },
      alt: { de: ['ging', 'rannte', 'sagte', 'lachten', 'kamen'] }, other: { es: ['subía', 'corría', 'decía', 'tuvo', 'estuvo'], pt: ['subia', 'corria', 'dizia', 'teve', 'esteve'] },
      pres: { es: ['sube', 'corre', 'dice', 'tiene', 'está'], pt: ['sobe', 'corre', 'diz', 'tem', 'está'], de: ['geht', 'rennt', 'sagt', 'hat', 'ist'], zh: ['[跑|pǎo]', '[上|shàng]'], ja: ['[上|あ]がる', '[走|はし]る', '[笑|わら]う', 'こわい'] },
      more: { es: ['elio', 'todos'], pt: ['elio', 'todo'], de: ['elio', 'alle'], zh: ['[艾利欧|Ài lì ōu]', '[大家|dà jiā]'], ja: ['エリオ', 'みんな'] } }),
    // under the stage: each room's scene (the imperfect) and deed (the preterite)
    'r1.scene': TK6({ title: 'The prop room is dark and gray. Set the scene as it was that night: the lamp.',
      frame: { es: 'La lámpara ___ encendida.', pt: 'O lampião ___ aceso.', de: 'Die Lampe ___ an.', zh: '[那时候|nà shí hou] [油灯|yóu dēng] ___ 。', ja: 'ランプ が ___ 。' },
      chips: { es: [['estaba', 'was']], pt: [['estava', 'was']], de: [['war', 'was']], zh: [['[亮|liàng] [着|zhe]', 'was lit']], ja: [['ついて いました', 'was on']] },
      model: L('The lamp was lit.', 'La lámpara estaba encendida.', 'O lampião estava aceso.', 'Die Lampe war an.', '[那时候|nà shí hou] [油灯|yóu dēng] [亮|liàng] [着|zhe] 。', 'ランプ が ついて いました 。'),
      want: { es: ['estaba'], pt: ['estava'], de: ['war'], zh: [['[亮|liàng]', '[着|zhe]'], ['[亮|liàng]', '[那时候|nà shí hou]']], ja: ['ついて いました', 'ついて いた', 'ついてた'] },
      alt: { de: [['ist', 'gewesen']] }, other: { es: ['estuvo'], pt: ['esteve'] },
      pres: { es: ['está'], pt: ['está', 'tá'], de: ['ist'], zh: ['[亮|liàng]'], ja: ['ついて います', 'ついて いる', 'ついてる', 'つく'] },
      tipPres: { zh: 'It already happened: «那时候油灯亮着» (那时候: back then; 着: a state that went on).' },
      more: { es: ['encendida', 'prendida'], pt: ['aceso', 'acesa'], de: ['an'], zh: ['[那时候|nà shí hou]', '[那天|nà tiān]'], ja: ['ランプ'] } }),
    'r1.deed': TK6({ title: 'The painted moon blocks the way on. Tell {mimo} what it did, as a memory.',
      frame: { es: '{mimo} ___ la luna.', pt: 'O {mimo} ___ a lua.', de: '{mimo} hat den Mond ___.', zh: '{mimo} ___ [月亮|yuè liang] 。', ja: '{mimo} が [月|つき] を ___ 。' },
      chips: { es: [['empujó', 'pushed']], pt: [['empurrou', 'pushed']], de: [['geschoben', 'pushed']], zh: [['[推|tuī] [开|kāi] [了|le]', 'pushed away']], ja: [['[押|お]した', 'pushed']] },
      model: L('{mimo} pushed the moon.', '{mimo} empujó la luna.', 'O {mimo} empurrou a lua.', '{mimo} hat den Mond geschoben.', '{mimo} [推|tuī] [开|kāi] [了|le] [月亮|yuè liang] 。', '{mimo} が [月|つき] を [押|お]した 。'),
      want: { es: ['empujó'], pt: ['empurrou'], de: [['hat', 'geschoben'], ['hat', 'weggeschoben']], zh: [['[推|tuī]', '[了|le]']], ja: ['[押|お]した', '[押|お]しました'] },
      alt: { de: ['schob'] }, other: { es: ['empujaba'], pt: ['empurrava'] },
      pres: { es: ['empuja', 'empujar'], pt: ['empurra', 'empurrar'], de: ['schiebt', 'schieben', 'schieb'], zh: ['[推|tuī]'], ja: ['[押|お]す', '[押|お]して', '[押|お]します'] },
      more: { es: ['luna'], pt: ['lua'], de: ['mond'], zh: ['[月亮|yuè liang]'], ja: ['[月|つき]'] } }),
    'r2.scene': TK6({ title: 'The choir’s robes hang gray. Tell how they were that night.',
      frame: { es: 'Las túnicas ___ rojas.', pt: 'As túnicas ___ vermelhas.', de: 'Die Gewänder ___ rot.', zh: '[那时候|nà shí hou] [长袍|cháng páo] [是|shì] ___ [的|de] 。', ja: 'ローブ は ___ 。' },
      chips: { es: [['eran', 'were']], pt: [['eram', 'were']], de: [['waren', 'were']], zh: [['[红色|hóng sè]', 'red']], ja: [['[赤|あか]かった', 'were red']] },
      model: L('The robes were red.', 'Las túnicas eran rojas.', 'As túnicas eram vermelhas.', 'Die Gewänder waren rot.', '[那时候|nà shí hou] [长袍|cháng páo] [是|shì] [红色|hóng sè] [的|de] 。', 'ローブ は [赤|あか]かった 。'),
      want: { es: ['eran'], pt: ['eram'], de: ['waren'], zh: [['[红|hóng]', '[那时候|nà shí hou]'], ['[红|hóng]', '[那天|nà tiān]'], ['[红|hóng]', '[以前|yǐ qián]']], ja: ['[赤|あか]かった', '[赤|あか] でした', '[赤|あか] だった'] },
      alt: { es: ['estaban'], pt: ['estavam'], de: [['sind', 'gewesen']] }, tipAlt: { es: 'Right! A color is what something is like: «eran rojas».', pt: 'Right! A color is what something is like: «eram vermelhas».' },
      other: { es: ['fueron'], pt: ['foram'] },
      pres: { es: ['son', 'están'], pt: ['são', 'estão'], de: ['sind'], zh: ['[红|hóng]'], ja: ['[赤|あか]い', '[赤|あか] です'] },
      tipPres: { zh: 'It already happened: «那时候长袍是红色的» (那时候: back then).' },
      more: { es: ['rojas'], pt: ['vermelhas'], de: ['rot'], ja: ['ローブ'] } }),
    'r2.deed': TK6({ title: 'Gray dust swirls over the way on. Tell {mimo} what it did, as a memory.',
      frame: { es: '{mimo} ___ el polvo.', pt: 'O {mimo} ___ a poeira.', de: '{mimo} hat den Staub ___.', zh: '{mimo} ___ [灰尘|huī chén] 。', ja: '{mimo} が ほこり を ___ 。' },
      chips: { es: [['sopló', 'blew']], pt: [['soprou', 'blew']], de: [['weggepustet', 'blew away']], zh: [['[吹|chuī] [走|zǒu] [了|le]', 'blew away']], ja: [['[吹|ふ]いた', 'blew']] },
      model: L('{mimo} blew the dust.', '{mimo} sopló el polvo.', 'O {mimo} soprou a poeira.', '{mimo} hat den Staub weggepustet.', '{mimo} [吹|chuī] [走|zǒu] [了|le] [灰尘|huī chén] 。', '{mimo} が ほこり を [吹|ふ]いた 。'),
      want: { es: ['sopló'], pt: ['soprou'], de: [['hat', 'weggepustet'], ['hat', 'gepustet']], zh: [['[吹|chuī]', '[了|le]']], ja: ['[吹|ふ]いた', '[吹|ふ]きました'] },
      alt: { de: ['pustete'] }, other: { es: ['soplaba'], pt: ['soprava'] },
      pres: { es: ['sopla', 'soplar'], pt: ['sopra', 'soprar'], de: ['pustet', 'pusten'], zh: ['[吹|chuī]'], ja: ['[吹|ふ]く', '[吹|ふ]いて', '[吹|ふ]きます'] },
      more: { es: ['polvo'], pt: ['poeira'], de: ['staub'], zh: ['[灰尘|huī chén]'], ja: ['ほこり'] } }),
    'r3.scene': TK6({ title: 'The trapdoor overhead is shut and gray. Tell how it was that night.',
      frame: { es: 'La trampilla ___ abierta.', pt: 'O alçapão ___ aberto.', de: 'Die Falltür ___ offen.', zh: '[那时候|nà shí hou] [活板门|huó bǎn mén] ___ 。', ja: '[上|うえ] の [扉|とびら] が ___ 。' },
      chips: { es: [['estaba', 'was']], pt: [['estava', 'was']], de: [['war', 'was']], zh: [['[开|kāi] [着|zhe]', 'was open']], ja: [['[開|あ]いて いました', 'was open']] },
      model: L('The trapdoor was open.', 'La trampilla estaba abierta.', 'O alçapão estava aberto.', 'Die Falltür war offen.', '[那时候|nà shí hou] [活板门|huó bǎn mén] [开|kāi] [着|zhe] 。', '[上|うえ] の [扉|とびら] が [開|あ]いて いました 。'),
      want: { es: ['estaba'], pt: ['estava'], de: ['war'], zh: [['[开|kāi]', '[着|zhe]'], ['[开|kāi]', '[那时候|nà shí hou]']], ja: ['[開|あ]いて いました', '[開|あ]いて いた', '[開|あ]いてた'] },
      alt: { de: [['ist', 'gewesen']] }, other: { es: ['estuvo'], pt: ['esteve'] },
      pres: { es: ['está'], pt: ['está', 'tá'], de: ['ist'], zh: ['[开|kāi]'], ja: ['[開|あ]いて います', '[開|あ]いて いる', '[開|あ]いてる', '[開|あ]く'] },
      tipPres: { zh: 'It already happened: «那时候活板门开着» (那时候: back then; 着: it stayed open).' },
      more: { es: ['abierta'], pt: ['aberto'], de: ['offen'], zh: ['[那时候|nà shí hou]', '[那天|nà tiān]'], ja: ['[扉|とびら]'] } }),
    'r3.deed': TK6({ title: 'Replay the memory: what did Elio do that night?',
      frame: { es: 'Elio ___ por la escalera.', pt: 'O Elio ___ pela escada.', de: 'Elio ist die Leiter ___.', zh: '[艾利欧|Ài lì ōu] [从|cóng] [梯子|tī zi] [上|shàng] ___ 。', ja: 'エリオ くん は はしご を ___ 。' },
      chips: { es: [['bajó', 'came down']], pt: [['desceu', 'came down']], de: [['hinuntergeklettert', 'climbed down']], zh: [['[下来|xià lái] [了|le]', 'came down']], ja: [['[下|お]りた', 'came down']] },
      model: L('Elio came down the ladder.', 'Elio bajó por la escalera.', 'O Elio desceu pela escada.', 'Elio ist die Leiter hinuntergeklettert.', '[艾利欧|Ài lì ōu] [从|cóng] [梯子|tī zi] [上|shàng] [下来|xià lái] [了|le] 。', 'エリオ くん は はしご を [下|お]りた 。'),
      want: { es: ['bajó'], pt: ['desceu'], de: [['ist', 'hinuntergeklettert'], ['ist', 'runtergeklettert'], ['ist', 'geklettert'], ['ist', 'hinuntergestiegen'], ['ist', 'gestiegen']], zh: [['[下来|xià lái]', '[了|le]'], ['[下|xià]', '[了|le]']], ja: ['[下|お]りた', '[下|お]りました'] },
      alt: { de: ['kletterte', 'stieg'] }, other: { es: ['bajaba'], pt: ['descia'] },
      pres: { es: ['baja', 'bajar'], pt: ['desce', 'descer'], de: ['klettert', 'klettern', 'steigt'], zh: ['[下来|xià lái]'], ja: ['[下|お]りる', '[下|お]ります', '[下|お]りて'] },
      more: { es: ['escalera'], pt: ['escada'], de: ['leiter'], zh: ['[梯子|tī zi]'], ja: ['はしご'] } }),
    // the prompter's box: the practice correction (Aurora's memory shows it first)
    'r4.fix': TK6({ title: 'The whisper lies: «The theater was empty…» Correct it: say how it really was.',
      frame: { es: 'No, el teatro estaba ___.', pt: 'Não, o teatro estava ___.', de: 'Nein, das Theater war ___.', zh: '[不|bù] ， [剧院|jù yuàn] ___ 。', ja: 'いいえ 、 [劇場|げきじょう] は ___ 。' },
      chips: { es: [['lleno', 'full']], pt: [['cheio', 'full']], de: [['voll', 'full']], zh: [['[坐满|zuò mǎn] [了|le] [人|rén]', 'was full of people']], ja: [['いっぱい でした', 'was full']] },
      model: L('No, the theater was full.', 'No, el teatro estaba lleno.', 'Não, o teatro estava cheio.', 'Nein, das Theater war voll.', '[不|bù] ， [剧院|jù yuàn] [坐满|zuò mǎn] [了|le] [人|rén] 。', 'いいえ 、 [劇場|げきじょう] は いっぱい でした 。'),
      lie: { es: ['vacío'], pt: ['vazio'], de: ['leer'], zh: ['[没有|méi yǒu]'], ja: ['がらがら'] },
      want: { es: [['estaba', 'lleno']], pt: [['estava', 'cheio']], de: [['war', 'voll']], zh: [['[满|mǎn]']], ja: ['いっぱい でした', 'いっぱい だった', '[満員|まんいん] でした', '[満員|まんいん] だった'] },
      alt: { de: [['ist', 'gewesen', 'voll']] }, other: { es: [['estuvo', 'lleno']], pt: [['esteve', 'cheio']] },
      pres: { es: [['está', 'lleno']], pt: [['está', 'cheio']], de: [['ist', 'voll']], ja: ['いっぱい です', 'いっぱい だ'] },
      fact: { es: ['lleno'], pt: ['cheio'], de: ['voll'], ja: ['いっぱい', '[満員|まんいん]'] },
      more: { zh: ['[了|le]'] } }),
    // «Félix's lost page»
    page: TK6({ title: 'Félix asks where his page was. Tell him, as it was.',
      frame: { es: '___ en el baúl.', pt: '___ no baú.', de: 'Sie ___ in der Truhe.', zh: '[它|tā] [之前|zhī qián] ___ [箱子|xiāng zi] [里|lǐ] 。', ja: '[箱|はこ] の [中|なか] に ___ 。' },
      chips: { es: [['Estaba', 'It was']], pt: [['Estava', 'It was']], de: [['war', 'was']], zh: [['[在|zài]', 'was (in)']], ja: [['ありました', 'was (there)']] },
      model: L('It was in the trunk.', 'Estaba en el baúl.', 'Estava no baú.', 'Sie war in der Truhe.', '[它|tā] [之前|zhī qián] [在|zài] [箱子|xiāng zi] [里|lǐ] 。', '[箱|はこ] の [中|なか] に ありました 。'),
      want: { es: ['estaba'], pt: ['estava'], de: ['war'], zh: [['[在|zài]', '[箱子|xiāng zi]']], ja: ['ありました', 'あった'] },
      alt: { de: [['ist', 'gewesen']] }, other: { es: ['estuvo'], pt: ['esteve'] },
      pres: { es: ['está'], pt: ['está', 'tá'], de: ['ist'], ja: ['あります', 'ある'] },
      more: { es: ['baúl'], pt: ['baú'], de: ['truhe'], zh: ['[之前|zhī qián]', '[那时候|nà shí hou]'], ja: ['[箱|はこ]'] } }),
    // «Rosa's letter»: one more kind thing about Elio (any past sentence about him), then who wrote it (for Mateo)
    letter: TK6({ title: 'Tell young Rosa one more kind thing about Elio, in the past, for her letter.',
      frame: { es: 'Elio ___ muy ___.', pt: 'O Elio ___ muito ___.', de: 'Elio ___ sehr ___.', zh: '[那时候|nà shí hou] [艾利欧|Ài lì ōu] [很|hěn] ___ 。', ja: 'エリオ くん は ___ 。' },
      chips: { es: [['era', 'was'], ['amable', 'kind'], ['valiente', 'brave']], pt: [['era', 'was'], ['gentil', 'kind'], ['corajoso', 'brave']], de: [['war', 'was'], ['nett', 'kind'], ['mutig', 'brave']],
        zh: [['[友好|yǒu hǎo]', 'friendly, kind'], ['[勇敢|yǒng gǎn]', 'brave']], ja: [['やさしかった', 'was kind'], ['[勇敢|ゆうかん] だった', 'was brave']] },
      model: L('Elio was very kind.', 'Elio era muy amable.', 'O Elio era muito gentil.', 'Elio war sehr nett.', '[那时候|nà shí hou] [艾利欧|Ài lì ōu] [很|hěn] [友好|yǒu hǎo] 。', 'エリオ くん は やさしかった 。'),
      want: { es: ['era', 'fue', 'habló', 'tenía', 'estaba', 'dijo', 'cantó', 'llegó'], pt: ['era', 'foi', 'falou', 'tinha', 'estava', 'disse', 'cantou', 'chegou'], de: ['war', ['hat', 'gesprochen'], ['hat', 'gesagt'], 'hatte', 'mochte'],
        zh: [['[友好|yǒu hǎo]'], ['[勇敢|yǒng gǎn]'], ['[可爱|kě ài]'], ['[亲切|qīn qiè]'], ['[善良|shàn liáng]']], ja: ['やさしかった', '[優|やさ]しかった', '[勇敢|ゆうかん] だった', '[勇敢|ゆうかん] でした', '[親切|しんせつ] だった', '[親切|しんせつ] でした', 'かっこよかった', 'いい [子|こ] だった'] },
      alt: { de: ['sprach', 'sagte'] },
      pres: { es: ['es', 'habla', 'tiene', 'está'], pt: ['é', 'fala', 'tem', 'está'], de: ['ist', 'spricht', 'hat'], ja: ['やさしい', '[優|やさ]しい', '[勇敢|ゆうかん] です', '[親切|しんせつ] です'] },
      more: { es: ['amable', 'valiente', 'bien', 'bueno', 'simpático', 'bonito', 'lindo'], pt: ['gentil', 'corajoso', 'legal', 'bom', 'bonito', 'lindo'], de: ['nett', 'mutig', 'lieb', 'gut', 'freundlich'],
        zh: ['[那时候|nà shí hou]', '[以前|yǐ qián]', '[那天|nà tiān]'], ja: ['エリオ'] } }),
    mateo: TK6({ title: 'Mateo asks about the letter. Tell him what young Rosa did.',
      frame: { es: 'Rosita la ___.', pt: 'A Rosinha ___.', de: 'Rosi hat ihn ___.', zh: '[小|Xiǎo] [罗莎|Luó shā] [给|gěi] [艾利欧|Ài lì ōu] ___ [一|yī] [封|fēng] [信|xìn] 。', ja: 'ロサ ちゃん が ___ 。' },
      chips: { es: [['escribió', 'wrote']], pt: [['escreveu', 'wrote']], de: [['geschrieben', 'written']], zh: [['[写|xiě] [了|le]', 'wrote']], ja: [['[書|か]いた', 'wrote']] },
      model: L('Young Rosa wrote it.', 'Rosita la escribió.', 'A Rosinha escreveu.', 'Rosi hat ihn geschrieben.', '[小|Xiǎo] [罗莎|Luó shā] [给|gěi] [艾利欧|Ài lì ōu] [写|xiě] [了|le] [一|yī] [封|fēng] [信|xìn] 。', 'ロサ ちゃん が [書|か]いた 。'),
      want: { es: ['escribió'], pt: ['escreveu'], de: [['hat', 'geschrieben']], zh: [['[写|xiě]', '[了|le]']], ja: ['[書|か]いた', '[書|か]きました'] },
      alt: { de: ['schrieb'] }, other: { es: ['escribía'], pt: ['escrevia'] },
      pres: { es: ['escribe', 'escribir'], pt: ['escreve', 'escrever'], de: ['schreibt', 'schreiben'], zh: ['[写|xiě]'], ja: ['[書|か]く', '[書|か]きます'] },
      more: { es: ['rosita'], pt: ['rosinha'], de: ['rosi'], zh: ['[信|xìn]'], ja: ['ロサ'] } }),
  };
  Object.assign(TASKS, {
    // «The choir's robes» (Clara): how they were (the imperfect: eran, tenían)
    'robe.color': Object.assign({}, TASKS['r2.scene'], { title: 'Clara asks: «What color were the robes?»' }),
    'robe.collar': TK6({ title: 'Clara asks: «And the collar?» Tell her what they had.',
      frame: { es: '___ un cuello blanco.', pt: '___ uma gola branca.', de: 'Sie ___ einen weißen Kragen.', zh: '[那时候|nà shí hou] [长袍|cháng páo] [有|yǒu] ___ [的|de] [领子|lǐng zi] 。', ja: '[白|しろ]い [襟|えり] が ___ 。' },
      chips: { es: [['Tenían', 'they had'], ['cuello', 'collar']], pt: [['Tinham', 'they had'], ['gola', 'collar']], de: [['hatten', 'had'], ['Kragen', 'collar']], zh: [['[白色|bái sè]', 'white'], ['[领子|lǐng zi]', 'collar']], ja: [['ありました', 'there was (they had)'], ['[襟|えり]', 'collar']] },
      model: L('They had a white collar.', 'Tenían un cuello blanco.', 'Tinham uma gola branca.', 'Sie hatten einen weißen Kragen.', '[那时候|nà shí hou] [长袍|cháng páo] [有|yǒu] [白色|bái sè] [的|de] [领子|lǐng zi] 。', '[白|しろ]い [襟|えり] が ありました 。'),
      want: { es: ['tenían'], pt: ['tinham'], de: ['hatten'], zh: [['[白|bái]', '[领子|lǐng zi]', '[那时候|nà shí hou]'], ['[白|bái]', '[领子|lǐng zi]', '[以前|yǐ qián]']], ja: ['ありました', 'あった'] },
      alt: { de: [['haben', 'gehabt']] }, other: { es: ['tuvieron'], pt: ['tiveram'] },
      pres: { es: ['tienen'], pt: ['têm', 'tem'], de: ['haben'], zh: [['[白|bái]', '[领子|lǐng zi]']], ja: ['あります', 'ある'] },
      tipPres: { zh: 'Back then: «那时候长袍有白色的领子».' },
      more: { es: ['cuello'], pt: ['gola'], de: ['kragen'], ja: ['[襟|えり]'] } }),
    'robe.size': TK6({ title: 'Clara asks: «And were they big or small?»',
      frame: { es: 'Eran muy ___.', pt: 'Eram muito ___.', de: 'Sie waren sehr ___.', zh: '[那时候|nà shí hou] [长袍|cháng páo] [很|hěn] ___ 。', ja: 'とても ___ 。' },
      chips: { es: [['grandes', 'big']], pt: [['grandes', 'big']], de: [['groß', 'big']], zh: [['[大|dà]', 'big']], ja: [['[大|おお]きかった', 'were big']] },
      model: L('They were very big.', 'Eran muy grandes.', 'Eram muito grandes.', 'Sie waren sehr groß.', '[那时候|nà shí hou] [长袍|cháng páo] [很|hěn] [大|dà] 。', 'とても [大|おお]きかった 。'),
      want: { es: ['eran'], pt: ['eram'], de: ['waren'], zh: [['[大|dà]', '[那时候|nà shí hou]'], ['[大|dà]', '[以前|yǐ qián]']], ja: ['[大|おお]きかった', '[大|おお]きかった です'] },
      alt: { es: ['estaban'], pt: ['estavam'], de: [['sind', 'gewesen']] }, other: { es: ['fueron'], pt: ['foram'] },
      pres: { es: ['son'], pt: ['são'], de: ['sind'], zh: ['[大|dà]'], ja: ['[大|おお]きい', '[大|おお]きい です'] },
      tipPres: { zh: 'Back then: «那时候长袍很大».' },
      more: { es: ['grandes'], pt: ['grandes'], de: ['groß', 'gross'] } }),
    // «Brave mistakes» (Julián's pupils): each slate says yesterday in the present; you write it in the past
    'slate.hugo': TK6({ title: 'Young Hugo’s slate says «yesterday» but tells it in the present. Write it as it happened.',
      frame: { es: 'Ayer mi papá ___ la plaza.', pt: 'Ontem o meu pai ___ a praça.', de: 'Gestern hat mein Papa den Platz ___.', zh: '[昨天|zuó tiān] [我|wǒ] [爸爸|bà ba] ___ [广场|guǎng chǎng] 。', ja: '[昨日|きのう] 、 お[父|とう]さん は [広場|ひろば] を ___ 。' },
      chips: { es: [['barrió', 'swept']], pt: [['varreu', 'swept']], de: [['gefegt', 'swept']], zh: [['[扫|sǎo] [了|le]', 'swept']], ja: [['そうじ しました', 'cleaned']] },
      model: L('Yesterday my dad swept the plaza.', 'Ayer mi papá barrió la plaza.', 'Ontem o meu pai varreu a praça.', 'Gestern hat mein Papa den Platz gefegt.', '[昨天|zuó tiān] [我|wǒ] [爸爸|bà ba] [扫|sǎo] [了|le] [广场|guǎng chǎng] 。', '[昨日|きのう] 、 お[父|とう]さん は [広場|ひろば] を そうじ しました 。'),
      want: { es: ['barrió'], pt: ['varreu'], de: [['hat', 'gefegt']], zh: [['[扫|sǎo]', '[了|le]']], ja: ['そうじ しました', 'そうじ した', '[掃除|そうじ] しました', '[掃除|そうじ] した'] },
      alt: { de: ['fegte'] }, other: { es: ['barría'], pt: ['varria'] },
      pres: { es: ['barre', 'barrer'], pt: ['varre', 'varrer'], de: ['fegt', 'fegen'], zh: ['[扫|sǎo]'], ja: ['そうじ します', 'そうじ する'] },
      more: { es: ['plaza'], pt: ['praça'], de: ['platz'], zh: ['[广场|guǎng chǎng]'], ja: ['[広場|ひろば]'] } }),
    'slate.tomi': TK6({ title: 'Tomi’s slate: his grandma and the choir, yesterday. Write it as it happened.',
      frame: { es: 'Ayer mi abuela ___ en el coro.', pt: 'Ontem a minha avó ___ no coral.', de: 'Gestern hat meine Oma im Chor ___.', zh: '[昨天|zuó tiān] [我|wǒ] [奶奶|nǎi nai] [在|zài] [合唱团|hé chàng tuán] ___ [歌|gē] 。', ja: '[昨日|きのう] 、 おばあちゃん は [合唱団|がっしょうだん] で ___ 。' },
      chips: { es: [['cantó', 'sang']], pt: [['cantou', 'sang']], de: [['gesungen', 'sung']], zh: [['[唱|chàng] [了|le]', 'sang']], ja: [['[歌|うた]いました', 'sang']] },
      model: L('Yesterday my grandma sang in the choir.', 'Ayer mi abuela cantó en el coro.', 'Ontem a minha avó cantou no coral.', 'Gestern hat meine Oma im Chor gesungen.', '[昨天|zuó tiān] [我|wǒ] [奶奶|nǎi nai] [在|zài] [合唱团|hé chàng tuán] [唱|chàng] [了|le] [歌|gē] 。', '[昨日|きのう] 、 おばあちゃん は [合唱団|がっしょうだん] で [歌|うた]いました 。'),
      want: { es: ['cantó'], pt: ['cantou'], de: [['hat', 'gesungen']], zh: [['[唱|chàng]', '[了|le]']], ja: ['[歌|うた]いました', '[歌|うた]った'] },
      alt: { de: ['sang'] }, other: { es: ['cantaba'], pt: ['cantava'] },
      pres: { es: ['canta', 'cantar'], pt: ['canta', 'cantar'], de: ['singt', 'singen'], zh: ['[唱|chàng]'], ja: ['[歌|うた]います', '[歌|うた]う'] },
      more: { es: ['coro'], pt: ['coral'], de: ['chor'], zh: ['[合唱团|hé chàng tuán]'], ja: ['[合唱団|がっしょうだん]'] } }),
    'slate.pili': TK6({ title: 'One more slate: Pilar and her bell, yesterday. Write it as it happened.',
      frame: { es: 'Ayer Pilar ___ la campana.', pt: 'Ontem a Pilar ___ o sino.', de: 'Gestern hat Pilar die Glocke ___.', zh: '[昨天|zuó tiān] [皮拉尔|Pí lā ěr] ___ [钟|zhōng] 。', ja: '[昨日|きのう] 、 ピラール さん は [鐘|かね] を ___ 。' },
      chips: { es: [['tocó', 'rang']], pt: [['tocou', 'rang']], de: [['geläutet', 'rung']], zh: [['[敲|qiāo] [了|le]', 'rang']], ja: [['[鳴|な]らしました', 'rang']] },
      model: L('Yesterday Pilar rang the bell.', 'Ayer Pilar tocó la campana.', 'Ontem a Pilar tocou o sino.', 'Gestern hat Pilar die Glocke geläutet.', '[昨天|zuó tiān] [皮拉尔|Pí lā ěr] [敲|qiāo] [了|le] [钟|zhōng] 。', '[昨日|きのう] 、 ピラール さん は [鐘|かね] を [鳴|な]らしました 。'),
      want: { es: ['tocó'], pt: ['tocou'], de: [['hat', 'geläutet']], zh: [['[敲|qiāo]', '[了|le]']], ja: ['[鳴|な]らしました', '[鳴|な]らした'] },
      alt: { de: ['läutete'] }, other: { es: ['tocaba'], pt: ['tocava'] },
      pres: { es: ['toca', 'tocar'], pt: ['toca', 'tocar'], de: ['läutet', 'läuten'], zh: ['[敲|qiāo]'], ja: ['[鳴|な]らします', '[鳴|な]らす'] },
      more: { es: ['campana'], pt: ['sino'], de: ['glocke'], zh: ['[钟|zhōng]'], ja: ['[鐘|かね]'] } }),
    // Elena's bread for Pilar
    bread: TK6({ title: 'Pilar asks who baked the bread.',
      frame: { es: 'Elena lo ___.', pt: 'A Elena ___.', de: 'Elena hat es ___.', zh: '[埃莱娜|Āi lái nà] ___ [面包|miàn bāo] 。', ja: 'エレナ さん が ___ 。' },
      chips: { es: [['horneó', 'baked']], pt: [['assou', 'baked']], de: [['gebacken', 'baked']], zh: [['[烤|kǎo] [了|le]', 'baked']], ja: [['[焼|や]いた', 'baked']] },
      model: L('Elena baked it.', 'Elena lo horneó.', 'A Elena assou.', 'Elena hat es gebacken.', '[埃莱娜|Āi lái nà] [烤|kǎo] [了|le] [面包|miàn bāo] 。', 'エレナ さん が [焼|や]いた 。'),
      want: { es: ['horneó'], pt: ['assou'], de: [['hat', 'gebacken']], zh: [['[烤|kǎo]', '[了|le]']], ja: ['[焼|や]いた', '[焼|や]きました'] },
      alt: { de: ['backte', 'buk'] }, other: { es: ['horneaba'], pt: ['assava'] },
      pres: { es: ['hornea', 'hornear'], pt: ['assa', 'assar'], de: ['backt', 'bäckt', 'backen'], zh: ['[烤|kǎo]'], ja: ['[焼|や]く', '[焼|や]きます'] },
      more: { es: ['elena'], pt: ['elena'], de: ['elena'], zh: ['[面包|miàn bāo]'], ja: ['エレナ'] } }),
    // young Tina: her voice was pretty too
    tina: TK6({ title: 'Young Tina is scared to sing again. Tell her how her voice was, at the concert.',
      frame: { es: 'Tu voz ___ muy bonita.', pt: 'A sua voz ___ muito bonita.', de: 'Deine Stimme ___ sehr schön.', zh: '[那时候|nà shí hou] [你|nǐ] [的|de] [声音|shēng yīn] [也|yě] [很|hěn] ___ 。', ja: 'ティナ ちゃん の [声|こえ] も ___ 。' },
      chips: { es: [['era', 'was']], pt: [['era', 'was']], de: [['war', 'was']], zh: [['[好听|hǎo tīng]', 'nice to hear, pretty']], ja: [['きれい だった', 'was pretty']] },
      model: L('Your voice was very pretty.', 'Tu voz era muy bonita.', 'A sua voz era muito bonita.', 'Deine Stimme war sehr schön.', '[那时候|nà shí hou] [你|nǐ] [的|de] [声音|shēng yīn] [也|yě] [很|hěn] [好听|hǎo tīng] 。', 'ティナ ちゃん の [声|こえ] も きれい だった 。'),
      want: { es: ['era'], pt: ['era'], de: ['war'], zh: [['[好听|hǎo tīng]']], ja: ['きれい だった', 'きれい でした'] },
      alt: { de: [['ist', 'gewesen']] }, other: { es: ['fue'], pt: ['foi'] },
      pres: { es: ['es'], pt: ['é'], de: ['ist'], ja: ['きれい です', 'きれい だ'] },
      more: { es: ['bonita', 'linda', 'hermosa'], pt: ['bonita', 'linda'], de: ['schön', 'schon'], zh: ['[那时候|nà shí hou]', '[以前|yǐ qián]'], ja: ['[声|こえ]'] } }),
    // young Marta: what Elena did first
    marta: TK6({ title: 'Young Marta asks what Elena did first: the dough, or the oven?',
      frame: { es: 'Elena ___ la masa.', pt: 'A Elena ___ a massa.', de: 'Sie hat zuerst den Teig ___.', zh: '[她|tā] [先|xiān] ___ [面|miàn] 。', ja: '[最初|さいしょ] に [生地|きじ] を ___ 。' },
      chips: { es: [['amasó', 'kneaded']], pt: [['amassou', 'kneaded']], de: [['geknetet', 'kneaded']], zh: [['[揉|róu] [了|le]', 'kneaded']], ja: [['こねた', 'kneaded']] },
      model: L('Elena kneaded the dough.', 'Elena amasó la masa.', 'A Elena amassou a massa.', 'Sie hat zuerst den Teig geknetet.', '[她|tā] [先|xiān] [揉|róu] [了|le] [面|miàn] 。', '[最初|さいしょ] に [生地|きじ] を こねた 。'),
      want: { es: ['amasó'], pt: ['amassou'], de: [['hat', 'geknetet']], zh: [['[揉|róu]', '[了|le]']], ja: ['こねた', 'こねました'] },
      wrong: { es: ['horneó'], pt: ['assou'], de: ['gebacken'], zh: ['[烤|kǎo]'], ja: ['[焼|や]いた'] }, tipWrong: 'Not first! Bread starts with the dough.',
      alt: { de: ['knetete'] }, other: { es: ['amasaba'], pt: ['amassava'] },
      pres: { es: ['amasa', 'amasar'], pt: ['amassa', 'amassar'], de: ['knetet', 'kneten'], zh: ['[揉|róu]'], ja: ['こねる', 'こねます'] },
      more: { es: ['masa'], pt: ['massa'], de: ['teig'], zh: ['[面|miàn]'], ja: ['[生地|きじ]'] } }),
  });

  // ------------------------------------------------------------ the Prompter's whispers (the boss): a lie about that night, and what
  // really happened. Four masks: the cap, the stage, how he was, then each language's last lie (es / pt: when they came; de: the bells;
  // zh: «大家好»; ja: «親切»). 'robes' is the spare, for a lie you've already cracked.
  const W5 = (lie, task) => ({ lie, task });
  const WHISPERS = {
    cap: W5(L('Elio’s cap was blue…', 'La gorra de Elio era azul…', 'O boné do Elio era azul…', 'Elios Mütze war blau …', '[艾利欧|Ài lì ōu] [的|de] [帽子|mào zi] [是|shì] [蓝色|lán sè] [的|de] …', 'エリオ くん の [帽子|ぼうし] は [青|あお]かった …'),
      TK6({ frame: { es: 'No, la gorra era ___.', pt: 'Não, o boné era ___.', de: 'Nein, die Mütze war ___.', zh: '[不|bù] ， [他|tā] [的|de] [帽子|mào zi] [是|shì] ___ [的|de] 。', ja: 'いいえ 、 [帽子|ぼうし] は ___ 。' },
        chips: { es: [['roja', 'red']], pt: [['vermelho', 'red']], de: [['rot', 'red']], zh: [['[红色|hóng sè]', 'red']], ja: [['[赤|あか]かった', 'was red']] },
        model: L('No, the cap was red.', 'No, la gorra era roja.', 'Não, o boné era vermelho.', 'Nein, die Mütze war rot.', '[不|bù] ， [他|tā] [的|de] [帽子|mào zi] [是|shì] [红色|hóng sè] [的|de] 。', 'いいえ 、 [帽子|ぼうし] は [赤|あか]かった 。'),
        lie: { es: ['azul'], pt: ['azul'], de: ['blau'], zh: ['[蓝|lán]'], ja: ['[青|あお]'] },
        want: { es: [['era', 'roja']], pt: [['era', 'vermelho']], de: [['war', 'rot']], zh: [['[红|hóng]']], ja: ['[赤|あか]かった', '[赤|あか] でした', '[赤|あか] だった'] },
        other: { es: [['fue', 'roja']], pt: [['foi', 'vermelho']] }, pres: { es: [['es', 'roja']], pt: [['é', 'vermelho']], de: [['ist', 'rot']], ja: ['[赤|あか]い', '[赤|あか] です'] },
        fact: { es: ['roja'], pt: ['vermelho'], de: ['rot'], ja: ['[赤|あか]'] } })),
    stage: W5(L('That night, Elio stayed home…', 'Esa noche, Elio se quedó en casa…', 'Naquela noite, o Elio ficou em casa…', 'An dem Abend ist Elio zu Hause geblieben …', '[那天|nà tiān] [晚上|wǎn shang] ， [艾利欧|Ài lì ōu] [待|dāi] [在|zài] [家|jiā] [里|lǐ] …', 'その [夜|よる] 、 エリオ くん は [家|いえ] に いた …'),
      TK6({ frame: { es: 'No, Elio ___ al escenario.', pt: 'Não, o Elio ___ no palco.', de: 'Nein, Elio ist auf die Bühne ___.', zh: '[不|bù] ， [艾利欧|Ài lì ōu] ___ [舞台|wǔ tái] 。', ja: 'いいえ 、 エリオ くん は [舞台|ぶたい] に ___ 。' },
        chips: { es: [['subió', 'went up']], pt: [['subiu', 'went up']], de: [['gegangen', 'went']], zh: [['[上|shàng] [了|le]', 'went up onto']], ja: [['[上|あ]がった', 'went up']] },
        model: L('No, Elio went up on the stage.', 'No, Elio subió al escenario.', 'Não, o Elio subiu no palco.', 'Nein, Elio ist auf die Bühne gegangen.', '[不|bù] ， [艾利欧|Ài lì ōu] [上|shàng] [了|le] [舞台|wǔ tái] 。', 'いいえ 、 エリオ くん は [舞台|ぶたい] に [上|あ]がった 。'),
        lie: { es: ['casa'], pt: ['casa'], de: ['hause', 'geblieben'], zh: ['[家|jiā]'], ja: ['[家|いえ]'] },
        want: { es: ['subió'], pt: ['subiu'], de: [['ist', 'gegangen'], ['ist', 'gestiegen']], zh: [['[上|shàng]', '[了|le]']], ja: ['[上|あ]がった', '[上|あ]がりました'] },
        alt: { de: ['ging', 'stieg'] }, other: { es: ['subía'], pt: ['subia'] }, pres: { es: ['sube'], pt: ['sobe'], de: ['geht', 'steigt'], ja: ['[上|あ]がる', '[上|あ]がります'] },
        fact: { es: ['escenario'], pt: ['palco'], de: ['bühne'], zh: ['[舞台|wǔ tái]'], ja: ['[舞台|ぶたい]'] } })),
    scared: W5(L('Elio was calm… very calm…', 'Elio estaba tranquilo… muy tranquilo…', 'O Elio estava tranquilo… muito tranquilo…', 'Elio war ganz ruhig … ganz ruhig …', '[艾利欧|Ài lì ōu] [那时|nà shí] [很|hěn] [平静|píng jìng] … [很|hěn] [平静|píng jìng] …', 'エリオ くん は [平気|へいき] だった … [平気|へいき] だった …'),
      TK6({ frame: { es: 'No, Elio ___ miedo.', pt: 'Não, o Elio ___ medo.', de: 'Nein, Elio ___ Angst.', zh: '[不|bù] ， [他|tā] [很|hěn] ___ 。', ja: 'いいえ 、 エリオ くん は ___ 。' },
        chips: { es: [['tenía', 'had (tenía miedo: was scared)']], pt: [['tinha', 'had (tinha medo: was scared)']], de: [['hatte', 'had']], zh: [['[害怕|hài pà]', 'scared']], ja: [['こわかった', 'was scared']] },
        model: L('No, Elio was scared.', 'No, Elio tenía miedo.', 'Não, o Elio tinha medo.', 'Nein, Elio hatte Angst.', '[不|bù] ， [他|tā] [很|hěn] [害怕|hài pà] 。', 'いいえ 、 エリオ くん は こわかった 。'),
        lie: { es: ['tranquilo'], pt: ['tranquilo'], de: ['ruhig'], zh: ['[平静|píng jìng]'], ja: ['[平気|へいき]'] },
        want: { es: [['tenía', 'miedo'], ['estaba', 'nervioso'], ['estaba', 'asustado']], pt: [['tinha', 'medo'], ['estava', 'nervoso'], ['estava', 'com medo']], de: [['hatte', 'angst'], ['war', 'nervös']],
          zh: [['[害怕|hài pà]'], ['[紧张|jǐn zhāng]']], ja: ['こわかった', '[怖|こわ]かった'] },
        alt: { de: [['hat', 'gehabt']] }, other: { es: [['tuvo', 'miedo']], pt: [['teve', 'medo']] }, pres: { es: [['tiene', 'miedo']], pt: [['tem', 'medo']], de: [['hat', 'angst']], ja: ['こわい', '[怖|こわ]い'] },
        fact: { es: ['miedo'], pt: ['medo'], de: ['angst'] } })),
    final: W5(L('Elio and his dad came in summer…', 'Elio y su papá llegaron en verano…', 'O Elio e o pai chegaram no verão…', 'Elio mochte die Glocken nicht …', '[艾利欧|Ài lì ōu] [想|xiǎng] [跟|gēn] [大家|dà jiā] [打架|dǎ jià] …', 'エリオ くん は 、 みんな が 「 [新鮮|しんせん] 」 だ と [言|い]った …',
      { en_de: 'Elio didn’t like the bells …', en_zh: 'Elio wanted to fight everyone… (打架, dǎjià: to fight)', en_ja: 'Elio said everyone was “fresh”… (新鮮, shinsen)' }),
      TK6({ frame: { es: 'No, llegaron en ___.', pt: 'Não, chegaram no ___.', de: 'Doch! Elio ___ die Glocken.', zh: '[不|bù] ， [他|tā] [想|xiǎng] [说|shuō] “ ___ ” 。', ja: 'いいえ 、 「 ___ 」 と [言|い]いたかった 。' },
        chips: { es: [['invierno', 'winter']], pt: [['inverno', 'winter']], de: [['mochte', 'liked']], zh: [['[大家|dà jiā] [好|hǎo]', 'hello, everyone']], ja: [['[親切|しんせつ]', 'kind']] },
        model: L('No, they came in winter.', 'No, llegaron en invierno.', 'Não, chegaram no inverno.', 'Doch! Elio mochte die Glocken.', '[不|bù] ， [他|tā] [想|xiǎng] [说|shuō] “ [大家|dà jiā] [好|hǎo] ” 。', 'いいえ 、 「 [親切|しんせつ] 」 と [言|い]いたかった 。',
          { en_de: 'Yes, he did! Elio liked the bells.', en_zh: 'No, he wanted to say «大家好» (hello, everyone).', en_ja: 'No, he wanted to say «親切» (kind).' }),
        lie: { es: ['verano'], pt: ['verão'], de: ['nicht'], zh: ['[打架|dǎ jià]'], ja: ['[新鮮|しんせん]'] },
        want: { es: [['llegaron', 'invierno']], pt: [['chegaram', 'inverno']], de: [['mochte', 'glocken']], zh: [['[大家|dà jiā]', '[好|hǎo]']], ja: [['[親切|しんせつ]', 'かった']] },
        alt: { es: [['llegó', 'invierno']], pt: [['chegou', 'inverno']], de: [['hat', 'gemocht']] }, other: { es: [['llegaban', 'invierno']], pt: [['chegavam', 'inverno']] },
        pres: { es: [['llegan', 'invierno']], pt: [['chegam', 'inverno']], de: ['mag'], ja: [['[親切|しんせつ]', 'たい']] },
        tipAlt: { de: 'Right! (To say «yes, he did» against a «nicht», German says «Doch!».)' },
        veto: { de: ['nicht'] }, more: { de: ['doch'] },
        fact: { es: ['invierno'], pt: ['inverno'], de: ['glocken'], ja: ['[親切|しんせつ]'] } })),
    robes: W5(L('The choir’s robes were blue…', 'Las túnicas del coro eran azules…', 'As túnicas do coral eram azuis…', 'Die Gewänder vom Chor waren blau …', '[合唱团|hé chàng tuán] [的|de] [长袍|cháng páo] [是|shì] [蓝色|lán sè] [的|de] …', '[合唱団|がっしょうだん] の ローブ は [青|あお]かった …'),
      TK6({ frame: { es: 'No, eran ___.', pt: 'Não, eram ___.', de: 'Nein, sie waren ___.', zh: '[不|bù] ， [是|shì] ___ [的|de] 。', ja: 'いいえ 、 ___ 。' },
        chips: { es: [['rojas', 'red']], pt: [['vermelhas', 'red']], de: [['rot', 'red']], zh: [['[红色|hóng sè]', 'red']], ja: [['[赤|あか]かった', 'were red']] },
        model: L('No, they were red.', 'No, eran rojas.', 'Não, eram vermelhas.', 'Nein, sie waren rot.', '[不|bù] ， [是|shì] [红色|hóng sè] [的|de] 。', 'いいえ 、 [赤|あか]かった 。'),
        lie: { es: ['azules'], pt: ['azuis'], de: ['blau'], zh: ['[蓝|lán]'], ja: ['[青|あお]'] },
        want: { es: [['eran', 'rojas']], pt: [['eram', 'vermelhas']], de: [['waren', 'rot']], zh: [['[红|hóng]']], ja: ['[赤|あか]かった', '[赤|あか] でした'] },
        alt: { es: [['estaban', 'rojas']], pt: [['estavam', 'vermelhas']] }, other: { es: [['fueron', 'rojas']], pt: [['foram', 'vermelhas']] },
        pres: { es: [['son', 'rojas']], pt: [['são', 'vermelhas']], de: [['sind', 'rot']], ja: ['[赤|あか]い'] },
        fact: { es: ['rojas'], pt: ['vermelhas'], de: ['rot'], ja: ['[赤|あか]'] } })),
  };
  // the Prompter's other lines in the fight, and the coach's (Aurora's memory, over your shoulder): [text, English] per language
  const FIGHT = {
    shh: L('Shhh…!', '¡Chsss…!', 'Shhh…!', 'Pssst …!', '[嘘|xū] … ！', 'しーっ … ！'),
    crack: L('No… it wasn’t like that… it wasn’t…!', '¡No… no fue así… no fue así!', 'Não… não foi assim… não foi!', 'Nein … so war es nicht … nicht so …!',
      '[不|bù] … [不是|bú shì] [那样|nà yàng] … [不是|bú shì] … ！', 'ちがう … そう じゃ なかった … ちがう … ！'),
    masks: L('Correct it! Say what really happened: «No, …»', '¡Corrígelo! Di lo que pasó de verdad: «No, …»', 'Corrige! Diz o que aconteceu de verdade: «Não, …»', 'Verbessere es! Sag, was wirklich passiert ist: „Nein, …“',
      '[纠正|jiū zhèng] [它|tā] ！ [说出|shuō chū] [真正|zhēn zhèng] [发生|fā shēng] [的|de] [事|shì] ： “ [不|bù] ， … ”', '[直|なお]して ！ [本当|ほんとう] に あった こと を [言|い]って 。 「 いいえ 、 … 」'),
    cmd: L('Hits don’t hurt it. It’s held together by lies: correct them!', 'Los golpes no le hacen nada. ¡Lo sostienen sus mentiras! Corrígelas.', 'Os golpes não fazem nada. São as mentiras que seguram ele! Corrige.',
      'Schläge tun ihm nichts. Es hält sich an seinen Lügen fest: Verbessere sie!', '[打|dǎ] [它|tā] [没有|méi yǒu] [用|yòng] 。 [它|tā] [靠|kào] [谎话|huǎng huà] [活着|huó zhe] ： [纠正|jiū zhèng] [它们|tā men] ！',
      '[叩|たた]いて も [効|き]かない 。 うそ で できて いる の 。 うそ を [直|なお]して ！'),
    now: L('That’s now. It already happened! Say it in the past.', 'Eso es ahora. ¡Ya pasó! Dilo en pasado.', 'Isso é agora. Já aconteceu! Fala no passado.', 'Das ist jetzt. Es ist schon passiert! Sag es in der Vergangenheit.',
      '[那|nà] [是|shì] [现在|xiàn zài] 。 [事情|shì qing] [已经|yǐ jīng] [发生|fā shēng] [了|le] ！', 'それ は [今|いま] の こと 。 もう [終|お]わった こと よ ！ [過去|かこ] で [言|い]って 。'),
    lie: L('That’s what it said! Say how it really was.', '¡Eso es lo que dice él! Di cómo fue de verdad.', 'Isso é o que ele diz! Fala como foi de verdade.', 'Das sagt es doch! Sag, wie es wirklich war.',
      '[那|nà] [是|shì] [它|tā] [说|shuō] [的|de] ！ [说说|shuō shuo] [真正|zhēn zhèng] [的|de] [样子|yàng zi] 。', 'それ は あいつ の うそ ！ [本当|ほんとう] は どう だった ？'),
    yes: L('That’s how it was! One of its masks cracked.', '¡Así fue! Se le rompió una máscara.', 'Foi assim! Uma máscara rachou.', 'So war es! Eine Maske ist zersprungen.',
      '[就是|jiù shì] [这样|zhè yàng] ！ [一个|yī gè] [面具|miàn jù] [裂|liè] [开|kāi] [了|le] 。', 'そう だった ！ [仮面|かめん] が ひとつ [割|わ]れた 。'),
    last: L('It has no lies left…', 'Ya no le quedan mentiras…', 'Não sobrou nenhuma mentira…', 'Es hat keine Lügen mehr …', '[它|tā] [没有|méi yǒu] [谎话|huǎng huà] [了|le] …', 'もう 、 うそ は [残|のこ]って いない …'),
  };
  // its name, the bestiary's line
  const NAMES = {
    boss: CAST.prompter,
    lore: L('It lived in the prompter’s box and whispered lies about a night everyone remembered.', 'Vivía en la concha del apuntador y susurraba mentiras sobre una noche que todos recordaban.',
      'Morava na caixa do ponto e sussurrava mentiras sobre uma noite que todo mundo lembrava.', 'Es wohnte im Souffleurkasten und flüsterte Lügen über einen Abend, an den sich alle erinnerten.',
      '[它|tā] [住|zhù] [在|zài] [提词|tí cí] [小屋|xiǎo wū] [里|lǐ] ， [对|duì] [大家|dà jiā] [都|dōu] [记得|jì de] [的|de] [那个|nà ge] [晚上|wǎn shang] [说|shuō] [谎|huǎng] 。', 'プロンプター の [席|せき] に すみ 、 だれ も が [覚|おぼ]えて いる [夜|よる] に ついて 、 うそ を ささやいた 。'),
    key: L('the theater’s key', 'la llave del teatro', 'a chave do teatro', 'der Theaterschlüssel', '[剧院|jù yuàn] [的|de] [钥匙|yào shi]', '[劇場|げきじょう] の [鍵|かぎ]'),
    star: L('a gold star', 'una estrella dorada', 'uma estrela dourada', 'ein goldener Stern', '[金|jīn] [星星|xīng xing]', '[金|きん] の [星|ほし]'),
    song: L('Alba’s Song', 'La canción de Alba', 'A canção de Alba', 'Das Lied von Alba', '[阿尔巴|Ā ěr bā] [之|zhī] [歌|gē]', 'アルバ の [歌|うた]'),
    ch4: L('Elio’s words', 'Las palabras de Elio', 'As palavras do Elio', 'Elios Worte', '[艾利欧|Ài lì ōu] [的|de] [话|huà]', 'エリオ の ことば'),
    under: L('Under the stage', 'Debajo del escenario', 'Debaixo do palco', 'Unter der Bühne', '[舞台|wǔ tái] [下面|xià miàn]', '[舞台|ぶたい] の [下|した]'),
    closed: L('CLOSED', 'CERRADO', 'FECHADO', 'GESCHLOSSEN', '[关门|guān mén]', '[休館|きゅうかん]'),
  };

  // ------------------------------------------------------------ the pattern cards (shown before the tasks that need them)
  const CARDS = {
    under: { tag: 'Under the stage: how it was, then what happened',
      es: { ex: [['estaba encendida', 'was lit (how it was)'], ['eran rojas', 'were red (how it was)'], ['empujó', 'pushed (what happened)'], ['bajó', 'came down (what happened)']], note: 'Down here, every puzzle is a memory. First set the scene, how it was (the imperfect: «estaba», «eran»). Then replay the deed, what happened (the preterite: «empujó», «bajó»).' },
      pt: { ex: [['estava aceso', 'was lit (how it was)'], ['eram vermelhas', 'were red (how it was)'], ['empurrou', 'pushed (what happened)'], ['desceu', 'came down (what happened)']], note: 'Down here, every puzzle is a memory. First set the scene, how it was (the imperfeito: «estava», «eram»). Then replay the deed, what happened (the pretérito: «empurrou», «desceu»).' },
      de: { ex: [['war an', 'was on (how it was)'], ['waren rot', 'were red (how it was)'], ['hat … geschoben', 'pushed (what happened)'], ['ist … hinuntergeklettert', 'climbed down (what happened)']], note: 'Down here, every puzzle is a memory. How it was: «war», «waren», even in speech. What happened: the Perfekt, «hat … geschoben», «ist … geklettert» (moving somewhere takes «ist»).' },
      zh: { ex: [['[那时候|nà shí hou]', 'back then'], ['[亮|liàng] [着|zhe]', 'was lit (着: a state that went on)'], ['[推|tuī] [开|kāi] [了|le]', 'pushed away (了: it happened)'], ['[下来|xià lái] [了|le]', 'came down']], note: 'Down here, every puzzle is a memory. 那时候 sets the time; 着 says how something stayed; 了 after a verb says it happened.' },
      ja: { ex: [['ついて いました', 'was on (how it was)'], ['[赤|あか]かった', 'was red (い → かった)'], ['[押|お]した', 'pushed (what happened)'], ['[下|お]りた', 'came down']], note: 'Down here, every puzzle is a memory. How it was: ～ていました, and い-adjectives: い → かった. What happened: the た-form.' } },
    fix: { tag: 'Correcting a memory',
      es: { ex: [['No, la cortina estaba abierta.', 'No, the curtain was open.'], ['No, el teatro estaba lleno.', 'No, the theater was full.']], note: 'The whisper lies about that night. Say how it really was, in the past: «No, …» and the true thing. The present («está») won’t do: it already happened.' },
      pt: { ex: [['Não, a cortina estava aberta.', 'No, the curtain was open.'], ['Não, o teatro estava cheio.', 'No, the theater was full.']], note: 'The whisper lies about that night. Say how it really was, in the past: «Não, …» and the true thing. The present («está») won’t do: it already happened.' },
      de: { ex: [['Nein, der Vorhang war offen.', 'No, the curtain was open.'], ['Doch! Er mochte die Glocken.', 'Yes, he did! He liked the bells.']], note: 'The whisper lies about that night. Say how it really was, in the past: «Nein, … war …». Against a lie with «nicht», German says «Doch!».' },
      zh: { ex: [['[不|bù] ， [幕布|mù bù] [是|shì] [开|kāi] [着|zhe] [的|de] 。', 'No, the curtain was open.'], ['[不|bù] ， [剧院|jù yuàn] [坐满|zuò mǎn] [了|le] [人|rén] 。', 'No, the theater was full.']], note: 'The whisper lies about that night. Say «不，» and how it really was.' },
      ja: { ex: [['いいえ 、 [幕|まく] は [開|あ]いて いました 。', 'No, the curtain was open.'], ['いいえ 、 [劇場|げきじょう] は いっぱい でした 。', 'No, the theater was full.']], note: 'The whisper lies about that night. Say «いいえ、» and how it really was, in the past (～ました, ～でした, ～かった).' } },
    robes: { tag: 'How they were',
      es: { ex: [['eran rojas', 'were red'], ['tenían un cuello blanco', 'had a white collar'], ['eran grandes', 'were big']], note: 'Describing how something was: the imperfect. «ser» → «era / eran»; «tener» → «tenía / tenían».' },
      pt: { ex: [['eram vermelhas', 'were red'], ['tinham uma gola branca', 'had a white collar'], ['eram grandes', 'were big']], note: 'Describing how something was: the imperfeito. «ser» → «era / eram»; «ter» → «tinha / tinham».' },
      de: { ex: [['waren rot', 'were red'], ['hatten einen weißen Kragen', 'had a white collar'], ['waren groß', 'were big']], note: 'How something was: «war / waren», «hatte / hatten», even in speech.' },
      zh: { ex: [['[那时候|nà shí hou] … [是|shì] [红色|hóng sè] [的|de]', 'back then … was red'], ['[有|yǒu] [白色|bái sè] [的|de] [领子|lǐng zi]', 'had a white collar'], ['[很|hěn] [大|dà]', 'was big']], note: '那时候 (back then) makes it a memory; the words stay the same.' },
      ja: { ex: [['[赤|あか]かった', 'were red'], ['[白|しろ]い [襟|えり] が ありました', 'had a white collar'], ['[大|おお]きかった', 'were big']], note: 'How it was: い → かった; ～ます → ～ました.' } },
    board: { tag: 'Yesterday: it already happened',
      es: { ex: [['toca → tocó', 'rings → rang'], ['canta → cantó', 'sings → sang'], ['barre → barrió', 'sweeps → swept']], note: '«Ayer» means it already happened: the preterite. -ar verbs: -a → -ó. -er verbs: -e → -ió.' },
      pt: { ex: [['toca → tocou', 'rings → rang'], ['canta → cantou', 'sings → sang'], ['varre → varreu', 'sweeps → swept']], note: '«Ontem» means it already happened. -ar verbs: -a → -ou. -er verbs: -e → -eu.' },
      de: { ex: [['läutet → hat … geläutet', 'rings → rang'], ['singt → hat … gesungen', 'sings → sang'], ['fegt → hat … gefegt', 'sweeps → swept']], note: '«Gestern»: in speech, the Perfekt: «hat», and the participle at the very end.' },
      zh: { ex: [['[敲|qiāo] → [敲|qiāo] [了|le]', 'ring → rang'], ['[唱|chàng] → [唱|chàng] [了|le]', 'sing → sang'], ['[扫|sǎo] → [扫|sǎo] [了|le]', 'sweep → swept']], note: '«昨天» says when; 了 after the verb says it’s done.' },
      ja: { ex: [['[鳴|な]らします → [鳴|な]らしました', 'rings → rang'], ['[歌|うた]います → [歌|うた]いました', 'sings → sang'], ['そうじ します → そうじ しました', 'cleans → cleaned']], note: '«昨日»: it already happened: ～ます → ～ました.' } },
  };

  // ------------------------------------------------------------ things to Look at (the words of then: the word in the language,
  // glossed, said aloud; alba_past_stage.js and alba_past.js place them)
  const LK = (w, t) => ({ w, t });
  const LOOKS = {
    // the prop room
    moon: LK(L('the cardboard moon', 'la luna de cartón', 'a lua de papelão', 'der Pappmond', '[纸板|zhǐ bǎn] [月亮|yuè liang]', 'ボール[紙|がみ] の [月|つき]'), 'A big painted moon, for the night scenes.'),
    lamp: LK(L('the oil lamp', 'la lámpara de aceite', 'o lampião', 'die Öllampe', '[油灯|yóu dēng]', '[石油|せきゆ]ランプ'), 'An oil lamp on a hook, gray with dust.'),
    horse: LK(L('the wooden horse', 'el caballo de madera', 'o cavalo de madeira', 'das Holzpferd', '[木马|mù mǎ]', '[木馬|もくば]'), 'A wooden horse on wheels, for a play about a knight.'),
    ptree: LK(L('the paper tree', 'el árbol de papel', 'a árvore de papel', 'der Papierbaum', '[纸|zhǐ] [树|shù]', '[紙|かみ] の [木|き]'), 'A paper tree, every leaf cut out by hand.'),
    crate: LK(L('the crate', 'el cajón', 'o caixote', 'die Kiste', '[木箱|mù xiāng]', '[木箱|きばこ]'), 'Old crates, stamped «TEATRO DE ALBA».'),
    pulley: LK(L('the pulley', 'la polea', 'a roldana', 'der Flaschenzug', '[滑轮|huá lún]', '[滑車|かっしゃ]'), 'A pulley and its rope, for flying the moon up and down.'),
    backdrop: LK(L('the backdrop', 'el telón de fondo', 'o pano de fundo', 'der Bühnenprospekt', '[背景|bèi jǐng] [布|bù]', '[背景|はいけい] の [幕|まく]'), 'A rolled-up backdrop: a village under the stars.'),
    hammer: LK(L('the hammer', 'el martillo', 'o martelo', 'der Hammer', '[锤子|chuí zi]', '[金槌|かなづち]'), 'Lorenzo the carpenter’s hammer, still on the bench.'),
    workbench: LK(L('the workbench', 'el banco de trabajo', 'a bancada', 'die Werkbank', '[工作台|gōng zuò tái]', '[作業台|さぎょうだい]'), 'Lorenzo built the stage and every chair at this bench.'),
    // the costume racks
    robes: LK(L('the robes', 'las túnicas', 'as túnicas', 'die Gewänder', '[长袍|cháng páo]', 'ローブ'), 'The choir’s robes, in a row.'),
    trunk: LK(L('the trunk', 'el baúl', 'o baú', 'die Truhe', '[箱子|xiāng zi]', '[箱|はこ]'), 'A big old trunk, its lid half open.'),
    wig: LK(L('the wig', 'la peluca', 'a peruca', 'die Perücke', '[假发|jiǎ fà]', 'かつら'), 'A curly white wig, for a king.'),
    mirror: LK(L('the mirror', 'el espejo', 'o espelho', 'der Spiegel', '[镜子|jìng zi]', '[鏡|かがみ]'), 'A dressing-room mirror with little bulbs round it.'),
    hats: LK(L('the hats', 'los sombreros', 'os chapéus', 'die Hüte', '[帽子|mào zi]', '[帽子|ぼうし]'), 'A tower of hats: a crown, a sailor’s cap, a witch’s hat.'),
    buttons: LK(L('the buttons', 'los botones', 'os botões', 'die Knöpfe', '[扣子|kòu zi]', 'ボタン'), 'A jar of buttons, every color there is.'),
    rack: LK(L('the costume rack', 'el perchero', 'a arara', 'der Kleiderständer', '[衣架|yī jià]', 'ハンガー ラック'), 'Racks of costumes on squeaky wheels.'),
    dressform: LK(L('the dress form', 'el maniquí', 'o manequim', 'die Schneiderpuppe', '[人台|rén tái]', 'トルソー'), 'Clara’s dress form, a robe half pinned on it.'),
    // the trapdoor lift
    trapdoor: LK(L('the trapdoor', 'la trampilla', 'o alçapão', 'die Falltür', '[活板门|huó bǎn mén]', '[迫|せ]り の [扉|とびら]'), 'A square trapdoor in the ceiling: the stage is right above it.'),
    ladder: LK(L('the ladder', 'la escalera de mano', 'a escada de mão', 'die Leiter', '[梯子|tī zi]', 'はしご'), 'A wooden ladder up to the trapdoor.'),
    weight: LK(L('the counterweight', 'el contrapeso', 'o contrapeso', 'das Gegengewicht', '[配重|pèi zhòng]', 'おもり'), 'Iron weights on a rope: they lift the platform to the stage.'),
    sandbags: LK(L('the sandbags', 'los sacos de arena', 'os sacos de areia', 'die Sandsäcke', '[沙袋|shā dài]', '[砂袋|すなぶくろ]'), 'Sandbags, to hold the ropes down.'),
    crank: LK(L('the crank', 'la manivela', 'a manivela', 'die Kurbel', '[摇把|yáo bǎ]', 'ハンドル'), 'A big iron crank for the lift.'),
    lift: LK(L('the stage lift', 'la plataforma', 'a plataforma', 'die Hebebühne', '[升降台|shēng jiàng tái]', '[迫|せ]り'), 'The lift: it carries a singer up through the floor of the stage.'),
    // the prompter's box
    shell: LK(L('the prompter’s box', 'la concha del apuntador', 'a caixa do ponto', 'der Souffleurkasten', '[提词|tí cí] [小屋|xiǎo wū]', 'プロンプター の [席|せき]'), 'A little wooden hood at the front of the stage. Whoever sits in it whispers the lines.'),
    script: LK(L('the script', 'el libreto', 'o roteiro', 'das Textbuch', '[剧本|jù běn]', '[台本|だいほん]'), 'A script, open at the concert’s page. One line is circled: Elio’s.'),
    footlights: LK(L('the footlights', 'las candilejas', 'a ribalta', 'das Rampenlicht', '[脚灯|jiǎo dēng]', 'フットライト'), 'The backs of the footlights, seen from below.'),
    curtain: LK(L('the curtain', 'la cortina', 'a cortina', 'der Vorhang', '[幕布|mù bù]', '[幕|まく]'), 'The curtain’s heavy hem hangs through a slot. It was open that night.'),
    stand: LK(L('the music stand', 'el atril', 'a estante de partitura', 'der Notenständer', '[谱架|pǔ jià]', '[譜面台|ふめんだい]'), 'A music stand, fallen on its side.'),
    handbell: LK(L('the little bell', 'la campanilla', 'a sineta', 'das Glöckchen', '[小|xiǎo] [铃铛|líng dang]', '[呼|よ]び[鈴|りん]'), 'The prompter’s little bell, to warn the singers.'),
    // the bakery of then
    oven: LK(L('the wood oven', 'el horno de leña', 'o forno a lenha', 'der Holzofen', '[柴火|chái huo] [烤炉|kǎo lú]', 'まき の かまど'), 'A wood oven, warm and humming.'),
    flour: LK(L('the flour sacks', 'los sacos de harina', 'os sacos de farinha', 'die Mehlsäcke', '[面粉|miàn fěn] [袋|dài]', '[小麦粉|こむぎこ] の [袋|ふくろ]'), 'Sacks of flour from the mills of Molinar.'),
    dough: LK(L('the dough', 'la masa', 'a massa', 'der Teig', '[面团|miàn tuán]', '[生地|きじ]'), 'Dough, rising under a cloth.'),
    pin: LK(L('the rolling pin', 'el rodillo', 'o rolo de massa', 'das Nudelholz', '[擀面杖|gǎn miàn zhàng]', 'めん[棒|ぼう]'), 'A rolling pin, worn smooth by many hands.'),
    basket: LK(L('the bread basket', 'la cesta del pan', 'a cesta de pão', 'der Brotkorb', '[面包|miàn bāo] [篮|lán]', 'パン かご'), 'Round loaves, still warm.'),
    scale: LK(L('the scale', 'la balanza', 'a balança', 'die Waage', '[秤|chèng]', 'はかり'), 'A brass scale with little weights.'),
    apron: LK(L('the apron', 'el delantal', 'o avental', 'die Schürze', '[围裙|wéi qún]', 'エプロン'), 'An apron on a hook, white with flour.'),
    gramophone: LK(L('the gramophone', 'el gramófono', 'o gramofone', 'das Grammofon', '[留声机|liú shēng jī]', '[蓄音機|ちくおんき]'), 'A gramophone with a big brass horn. Elena plays it while the bread rises.'),
    records: LK(L('the records', 'los discos', 'os discos', 'die Schallplatten', '[唱片|chàng piàn]', 'レコード'), 'A stack of records in paper sleeves.'),
    // the schoolroom of then
    blackboard: LK(L('the blackboard', 'la pizarra', 'o quadro-negro', 'die Tafel', '[黑板|hēi bǎn]', '[黒板|こくばん]'), 'Today’s lesson, in Julián’s neat hand.'),
    slate: LK(L('the slate', 'la pizarrita', 'a lousa', 'die Schiefertafel', '[石板|shí bǎn]', '[石板|せきばん]'), 'A pupil’s slate, with a sentence about yesterday.'),
    inkwell: LK(L('the inkwell', 'el tintero', 'o tinteiro', 'das Tintenfass', '[墨水瓶|mò shuǐ píng]', 'インク[壺|つぼ]'), 'An inkwell set into the desk. Blue fingers everywhere.'),
    abacus: LK(L('the abacus', 'el ábaco', 'o ábaco', 'der Abakus', '[算盘|suàn pán]', 'そろばん'), 'A wooden abacus with red and white beads.'),
    globe: LK(L('the globe', 'el globo terráqueo', 'o globo', 'der Globus', '[地球仪|dì qiú yí]', '[地球儀|ちきゅうぎ]'), 'An old globe. Some countries on it have other names now.'),
    map: LK(L('the map of the valley', 'el mapa del valle', 'o mapa do vale', 'die Karte vom Tal', '[山谷|shān gǔ] [地图|dì tú]', '[谷|たに] の [地図|ちず]'), 'The valley’s eight bells, each with a little drawing.'),
    desk: LK(L('the school desk', 'el pupitre', 'a carteira', 'die Schulbank', '[课桌|kè zhuō]', '[机|つくえ]'), 'A desk by the window. Nobody sits there now: it was Elio’s.'),
    chalk: LK(L('the chalk', 'la tiza', 'o giz', 'die Kreide', '[粉笔|fěn bǐ]', 'チョーク'), 'A box of chalk, the sticks worn short.'),
    satchel: LK(L('the school bag', 'la mochila', 'a mochila', 'der Schulranzen', '[书包|shū bāo]', 'ランドセル'), 'A leather school bag on a hook.'),
    cat: LK(L('the cat', 'la gata', 'a gata', 'die Katze', '[猫|māo]', 'ねこ'), 'Canela, Elena’s cat, asleep on a flour sack. One ear twitches.'),
    // outside the theater, long ago
    padlock: LK(L('the padlock', 'el candado', 'o cadeado', 'das Vorhängeschloss', '[挂锁|guà suǒ]', '[南京錠|なんきんじょう]'), 'A heavy padlock on the theater’s doors.'),
    doornote: LK(L('the note on the door', 'la nota de la puerta', 'o bilhete na porta', 'der Zettel an der Tür', '[门|mén] [上|shàng] [的|de] [纸条|zhǐ tiáo]', '[扉|とびら] の [張|は]り[紙|がみ]'), 'In Aurora’s handwriting:'),
  };
  // the other words of then, met in the lines, the demonstrations and the tasks (the journal's "Words of then" lists every one)
  const W7 = (k, en, es, pt, de, zh, ja) => ({ k, en, es, pt, de, zh, ja });
  const EXTRA = [
    W7('theater', 'the theater', 'el teatro', 'o teatro', 'das Theater', '[剧院|jù yuàn]', '[劇場|げきじょう]'), W7('stage', 'the stage', 'el escenario', 'o palco', 'die Bühne', '[舞台|wǔ tái]', '[舞台|ぶたい]'),
    W7('concert', 'the concert', 'el concierto', 'o concerto', 'das Konzert', '[音乐会|yīn yuè huì]', 'コンサート'), W7('choir', 'the choir', 'el coro', 'o coral', 'der Chor', '[合唱团|hé chàng tuán]', '[合唱団|がっしょうだん]'),
    W7('prompter', 'the prompter', 'el apuntador', 'o ponto', 'der Souffleur', '[提词人|tí cí rén]', 'プロンプター'), W7('audience', 'the audience', 'el público', 'a plateia', 'das Publikum', '[观众|guān zhòng]', '[観客|かんきゃく]'),
    W7('row', 'the front row', 'la primera fila', 'a primeira fila', 'die erste Reihe', '[第一|dì yī] [排|pái]', 'いちばん [前|まえ] の [席|せき]'), W7('song', 'the song', 'la canción', 'a música', 'das Lied', '[歌|gē]', '[曲|きょく]'),
    W7('page', 'the page', 'la página', 'a página', 'die Seite', '[乐谱|yuè pǔ]', '[楽譜|がくふ]'), W7('piano', 'the piano', 'el piano', 'o piano', 'das Klavier', '[钢琴|gāng qín]', 'ピアノ'),
    W7('key', 'the key', 'la llave', 'a chave', 'der Schlüssel', '[钥匙|yào shi]', '[鍵|かぎ]'), W7('letter', 'the letter', 'la carta', 'a carta', 'der Brief', '[信|xìn]', '[手紙|てがみ]'),
    W7('drawer', 'the drawer', 'el cajón', 'a gaveta', 'die Schublade', '[抽屉|chōu ti]', '[引|ひ]き[出|だ]し'), W7('postman', 'the postman', 'el cartero', 'o carteiro', 'der Briefträger', '[邮差|yóu chāi]', '[郵便屋|ゆうびんや] さん'),
    W7('baker', 'the baker', 'la panadera', 'a padeira', 'die Bäckerin', '[面包师|miàn bāo shī]', 'パン[屋|や] さん'), W7('teacher', 'the schoolteacher', 'el maestro', 'o professor', 'der Lehrer', '[老师|lǎo shī]', '[先生|せんせい]'),
    W7('pupil', 'the pupils', 'los alumnos', 'os alunos', 'die Schüler', '[学生|xué sheng]', '[生徒|せいと]'), W7('pianist', 'the pianist', 'el pianista', 'o pianista', 'der Pianist', '[钢琴家|gāng qín jiā]', 'ピアニスト'),
    W7('seamstress', 'the seamstress', 'la costurera', 'a costureira', 'die Schneiderin', '[裁缝|cái feng]', '[仕立屋|したてや] さん'), W7('carpenter', 'the carpenter', 'el carpintero', 'o carpinteiro', 'der Tischler', '[木匠|mù jiang]', '[大工|だいく] さん'),
    W7('apprentice', 'the apprentice', 'la aprendiz', 'a aprendiz', 'der Lehrling', '[学徒|xué tú]', '[見習|みなら]い'), W7('cap', 'the cap', 'la gorra', 'o boné', 'die Mütze', '[帽子|mào zi]', '[帽子|ぼうし]'),
    W7('collar', 'the collar', 'el cuello', 'a gola', 'der Kragen', '[领子|lǐng zi]', '[襟|えり]'), W7('pattern', 'the sewing pattern', 'el patrón', 'o molde', 'das Schnittmuster', '[纸样|zhǐ yàng]', '[型紙|かたがみ]'),
    W7('thread', 'the thread', 'el hilo', 'a linha', 'der Faden', '[线|xiàn]', '[糸|いと]'), W7('dust', 'the dust', 'el polvo', 'a poeira', 'der Staub', '[灰尘|huī chén]', 'ほこり'),
    W7('mask', 'the mask', 'la máscara', 'a máscara', 'die Maske', '[面具|miàn jù]', '[仮面|かめん]'), W7('street', 'the street', 'la calle', 'a rua', 'die Straße', '[街|jiē]', '[道|みち]'),
    W7('valley', 'the valley', 'el valle', 'o vale', 'das Tal', '[山谷|shān gǔ]', '[谷|たに]'), W7('road', 'the roads', 'los caminos', 'as estradas', 'die Wege', '[路|lù]', '[道|みち]'),
    W7('winter', 'winter', 'el invierno', 'o inverno', 'der Winter', '[冬天|dōng tiān]', '[冬|ふゆ]'), W7('summer', 'summer', 'el verano', 'o verão', 'der Sommer', '[夏天|xià tiān]', '[夏|なつ]'),
    W7('thatnight', 'that night', 'esa noche', 'naquela noite', 'an dem Abend', '[那天|nà tiān] [晚上|wǎn shang]', 'あの [夜|よる]'), W7('then', 'back then', 'entonces', 'naquela época', 'damals', '[那时候|nà shí hou]', 'その ころ'),
    W7('nextday', 'the next day', 'al día siguiente', 'no dia seguinte', 'am nächsten Tag', '[第二天|dì èr tiān]', 'つぎ の [日|ひ]'), W7('since', 'since then', 'desde entonces', 'desde então', 'seitdem', '[从|cóng] [那以后|nà yǐ hòu]', 'それ から'),
    W7('someday', 'someday', 'algún día', 'um dia', 'eines Tages', '[总有一天|zǒng yǒu yī tiān]', 'いつか'), W7('ago', 'forty years ago', 'hace cuarenta años', 'quarenta anos atrás', 'vor vierzig Jahren', '[四十|sì shí] [年|nián] [前|qián]', '[四十年|よんじゅうねん] [前|まえ]'),
    W7('memory', 'the memory', 'el recuerdo', 'a lembrança', 'die Erinnerung', '[回忆|huí yì]', '[思|おも]い[出|で]'), W7('lie', 'the lie', 'la mentira', 'a mentira', 'die Lüge', '[谎话|huǎng huà]', 'うそ'),
    W7('truth', 'how it really was', 'de verdad', 'de verdade', 'wirklich', '[真正|zhēn zhèng]', '[本当|ほんとう]'), W7('whisper', 'the whisper', 'el susurro', 'o sussurro', 'das Flüstern', '[小声|xiǎo shēng] [说话|shuō huà]', 'ささやき'),
    W7('echo', 'the echo', 'el eco', 'o eco', 'das Echo', '[回声|huí shēng]', 'こだま'), W7('voice', 'the voice', 'la voz', 'a voz', 'die Stimme', '[声音|shēng yīn]', '[声|こえ]'),
    W7('mistake', 'the mistake', 'el error', 'o erro', 'der Fehler', '[错误|cuò wù]', 'まちがい'), W7('word', 'a word', 'una palabra', 'uma palavra', 'ein Wort', '[词|cí]', '[言葉|ことば]'),
    W7('scared', 'was scared', 'tenía miedo', 'tinha medo', 'hatte Angst', '[很|hěn] [害怕|hài pà]', 'こわかった'), W7('ashamed', 'ashamed', 'me da vergüenza', 'tenho vergonha', 'ich schäme mich', '[不|bù] [好意思|hǎo yì si]', 'はずかしい'),
    W7('brave', 'brave', 'valiente', 'corajoso', 'mutig', '[勇敢|yǒng gǎn]', '[勇敢|ゆうかん]'), W7('kind', 'kind', 'amable', 'gentil', 'nett', '[友好|yǒu hǎo]', 'やさしい'),
    W7('calm', 'calm', 'tranquilo', 'tranquilo', 'ruhig', '[平静|píng jìng]', '[平気|へいき]'), W7('quiet', 'quiet', 'callado', 'quieto', 'still', '[安静|ān jìng]', '[静|しず]か'),
    W7('full', 'full', 'lleno', 'cheio', 'voll', '[满|mǎn]', 'いっぱい'), W7('empty', 'empty', 'vacío', 'vazio', 'leer', '[空|kōng]', 'がらがら'),
    W7('open', 'open', 'abierto', 'aberto', 'offen', '[开|kāi] [着|zhe]', '[開|あ]いて いる'), W7('closed', 'closed', 'cerrado', 'fechado', 'zu', '[关|guān] [着|zhe]', '[閉|し]まって いる'),
    W7('lit', 'lit', 'encendido', 'aceso', 'an', '[亮|liàng] [着|zhe]', 'ついて いる'), W7('red', 'red', 'rojo', 'vermelho', 'rot', '[红色|hóng sè]', '[赤|あか]い'),
    W7('blue', 'blue', 'azul', 'azul', 'blau', '[蓝色|lán sè]', '[青|あお]い'), W7('white', 'white', 'blanco', 'branco', 'weiß', '[白色|bái sè]', '[白|しろ]い'),
    W7('big', 'big', 'grande', 'grande', 'groß', '[大|dà]', '[大|おお]きい'), W7('warm', 'warm (bread)', 'calentito', 'quentinho', 'warm', '[热|rè]', 'あたたかい'),
    W7('wentup', 'went up', 'subió', 'subiu', 'ist … gegangen', '[上|shàng] [了|le]', '[上|あ]がった'), W7('said', 'said', 'dijo', 'disse', 'hat … gesagt', '[说|shuō] [了|le]', '[言|い]った'),
    W7('laughed', 'laughed (they)', 'se rieron', 'riram', 'haben gelacht', '[笑|xiào] [了|le]', '[笑|わら]った'), W7('ran', 'ran', 'corrió', 'correu', 'ist … gerannt', '[跑|pǎo] [了|le]', '[走|はし]った'),
    W7('arrived', 'arrived (they)', 'llegaron', 'chegaram', 'sind … gekommen', '[来到|lái dào] [了|le]', '[来|き]た'), W7('locked', 'locked', 'cerró con llave', 'trancou', 'hat … abgeschlossen', '[锁|suǒ] [上|shàng] [了|le]', '[鍵|かぎ] を かけた'),
    W7('wentin', 'went in', 'entró', 'entrou', 'ist … hineingegangen', '[进去|jìn qù] [了|le]', '[入|はい]った'), W7('camedown', 'came down', 'bajó', 'desceu', 'ist … hinuntergeklettert', '[下来|xià lái] [了|le]', '[下|お]りた'),
    W7('hid', 'hid', 'se escondió', 'se escondeu', 'hat sich versteckt', '[躲|duǒ] [了|le]', 'かくれた'), W7('pushed', 'pushed', 'empujó', 'empurrou', 'hat … geschoben', '[推|tuī] [了|le]', '[押|お]した'),
    W7('blew', 'blew', 'sopló', 'soprou', 'hat … gepustet', '[吹|chuī] [了|le]', '[吹|ふ]いた'), W7('lost', 'lost', 'perdió', 'perdeu', 'hat … verloren', '[丢|diū] [了|le]', 'なくした'),
    W7('stayed', 'stayed', 'se quedó', 'ficou', 'ist … geblieben', '[待|dāi] [在|zài]', 'いた'), W7('wrote', 'wrote', 'escribió', 'escreveu', 'hat … geschrieben', '[写|xiě] [了|le]', '[書|か]いた'),
    W7('baked', 'baked', 'horneó', 'assou', 'hat … gebacken', '[烤|kǎo] [了|le]', '[焼|や]いた'), W7('kneaded', 'kneaded', 'amasó', 'amassou', 'hat … geknetet', '[揉|róu] [了|le]', 'こねた'),
    W7('swept', 'swept', 'barrió', 'varreu', 'hat … gefegt', '[扫|sǎo] [了|le]', 'そうじ した'), W7('sang', 'sang', 'cantó', 'cantou', 'hat … gesungen', '[唱|chàng] [了|le]', '[歌|うた]った'),
    W7('rang', 'rang', 'tocó', 'tocou', 'hat … geläutet', '[敲|qiāo] [了|le]', '[鳴|な]らした'), W7('playing', 'was playing (the piano)', 'tocaba', 'tocava', 'habe … gespielt', '[在|zài] [弹|tán]', '[弾|ひ]いて いました'),
    W7('wearing', 'was wearing', 'llevaba', 'estava com', 'hatte … auf', '[戴|dài]', 'かぶって いた'), W7('shaking', 'were shaking', 'temblaban', 'tremiam', 'haben gezittert', '[抖|dǒu]', 'ふるえて いた'),
    W7('was', 'was (how it was)', 'estaba / era', 'estava / era', 'war', '[那时候|nà shí hou] …', 'でした'), W7('had', 'had (how it was)', 'tenía / tenían', 'tinha / tinham', 'hatte / hatten', '[有|yǒu]', 'ありました'),
    W7('liked', 'liked', 'le gustaban', 'gostava', 'mochte', '[喜欢|xǐ huan]', '[好|す]き だった'), W7('wanted', 'wanted to say', 'quería decir', 'queria dizer', 'wollte sagen', '[想|xiǎng] [说|shuō]', '[言|い]いたかった'),
    W7('kept', 'kept', 'guardó', 'guardou', 'hat … aufbewahrt', '[留|liú] [着|zhe]', 'しまって おいた'), W7('frame', 'the frame', 'el marco', 'o quadro', 'der Rahmen', '[镜框|jìng kuàng]', '[額|がく]'),
    W7('library', 'the library', 'la biblioteca', 'a biblioteca', 'die Bibliothek', '[图书馆|tú shū guǎn]', '[図書館|としょかん]'), W7('star', 'a gold star', 'una estrella dorada', 'uma estrela dourada', 'ein goldener Stern', '[金|jīn] [星星|xīng xing]', '[金|きん] の [星|ほし]'),
    W7('festival', 'the festival', 'la fiesta', 'a festa', 'das Fest', '[节日|jié rì]', 'お[祭|まつ]り'), W7('bunting', 'the bunting', 'los banderines', 'as bandeirinhas', 'die Wimpel', '[彩旗|cǎi qí]', '[旗|はた]'),
    W7('bread', 'the bread', 'el pan', 'o pão', 'das Brot', '[面包|miàn bāo]', 'パン'), W7('bell', 'the theater’s bell', 'la campana del teatro', 'o sino do teatro', 'die Theaterglocke', '[剧院|jù yuàn] [的|de] [钟|zhōng]', '[劇場|げきじょう] の [鐘|かね]'),
    W7('quietly', 'very quietly', 'muy bajito', 'bem baixinho', 'ganz leise', '[小声|xiǎo shēng]', '[小|ちい]さな [声|こえ] で'), W7('everyone', 'everyone', 'todos', 'todo mundo', 'alle', '[大家|dà jiā]', 'みんな'),
    W7('nobody', 'nobody', 'nadie', 'ninguém', 'niemand', '[没有|méi yǒu] [人|rén]', 'だれ も'), W7('first', 'first', 'primero', 'primeiro', 'zuerst', '[先|xiān]', '[最初|さいしょ] に'),
    W7('pretty', 'pretty', 'bonita', 'bonita', 'schön', '[好听|hǎo tīng]', 'きれい'), W7('note', 'the last note', 'la última nota', 'a última nota', 'die letzte Note', '[最后|zuì hòu] [一个|yī gè] [音|yīn]', '[最後|さいご] の [音|おと]'),
  ];
  // every word of then, for the journal: the Looks' words, then the rest
  const WORDS = Object.entries(LOOKS).map(([k, o]) => Object.assign({ k, look: true }, o.w)).concat(EXTRA);

  // ------------------------------------------------------------ every zh / ja string against CJK.md's rules: [] when all's well
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return ['no CJK'];
    const out = [], v = (s, l, where) => {
      if (!s || typeof s !== 'string') return;
      const p = CJK.validate(s.replace(/\{[^}]+\}/g, l === 'zh' ? '[它|tā]' : 'それ').replace(/___/g, l === 'zh' ? '[它|tā]' : 'それ'), l);
      if (p.length) out.push(`${where} (${l}): ${p.join('; ')} «${s}»`);
    };
    const each = (T, where) => { for (const l of ['zh', 'ja']) if (T && T[l]) [].concat(T[l]).forEach(x => (Array.isArray(x) ? x.forEach(y => v(y, l, where)) : v(x, l, where))); };
    for (const [k, T] of Object.entries(CAST)) each(T, 'cast ' + k);
    for (const [k, list] of Object.entries(CHAT)) list.forEach((T, i) => each(T, `chat ${k}.${i}`));
    for (const [k, T] of Object.entries(LINES)) each(T, k);
    for (const [k, T] of Object.entries(DEMO)) each(T, 'demo ' + k);
    for (const [k, M] of Object.entries(MARKS)) for (const l of ['zh', 'ja']) (M[l] || []).forEach(m => v(m[0], l, 'mark ' + k));
    for (const l of ['zh', 'ja']) v(ECHO[l], l, 'echo');
    const task = (T, where) => {
      for (const f of ['frame', 'model', 'want', 'alt', 'other', 'pres', 'more', 'lie', 'wrong', 'fact']) each(T[f], `${where} ${f}`);
      for (const l of ['zh', 'ja']) ((T.chips || {})[l] || []).forEach(c => v(c[0], l, `${where} chip`));
    };
    for (const [k, T] of Object.entries(TASKS)) task(T, 'task ' + k);
    for (const [k, W] of Object.entries(WHISPERS)) { each(W.lie, 'whisper ' + k); task(W.task, 'whisper ' + k); }
    for (const [k, T] of Object.entries(FIGHT)) each(T, 'fight ' + k);
    for (const [k, T] of Object.entries(NAMES)) each(T, 'name ' + k);
    for (const [k, C] of Object.entries(CARDS)) for (const l of ['zh', 'ja']) ((C[l] && C[l].ex) || []).forEach(e => v(e[0], l, 'card ' + k));
    for (const w of WORDS) for (const l of ['zh', 'ja']) v(w[l], l, 'word ' + w.k);
    return out;
  }
  // ------------------------------------------------------------ grading what you type (S–D before misses; alba_past.js and the boss
  // take a letter off per miss, two for «?»). Order: want (right) → alt (A) → other (B) → lie (what it said) → wrong → pres (now, not
  // then) → fact (the right thing with no verb: B) → none. zh / ja items match through CJK.contains (characters, pinyin or rōmaji).
  const nrm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const fold = (s, lg) => { let t = nrm(s); if (lg === 'de') t = t.replace(/ae/g, 'a').replace(/oe/g, 'o').replace(/ue/g, 'u'); return t; };
  const words = (s, lg) => ' ' + fold(s, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ';
  function has(text, item, lg) {
    if (Array.isArray(item)) return item.every(x => has(text, x, lg));
    if (isC(lg)) return typeof CJK !== 'undefined' && !!CJK.contains(text, item, lg);
    return words(text, lg).includes(' ' + fold(item, lg).replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim() + ' ');
  }
  const accented = (text, item, lg) => { if (isC(lg) || Array.isArray(item)) return true; const t = ' ' + String(text).toLowerCase().replace(/[¡!¿?.,;:«»"“”„()]/g, ' ').replace(/\s+/g, ' ') + ' '; return t.includes(' ' + String(item).toLowerCase() + ' '); };
  const firstOf = (list, text, lg) => ((list && list[lg]) || []).find(x => has(text, x, lg));
  const plainOf = (s, lg) => (isC(lg) && typeof CJK !== 'undefined' ? CJK.plain(String(s || ''), { lang: lg }) : String(s || ''));
  const TIPS = { pres: 'That’s now. It already happened: «{form}».', other: 'That’s the other past. Here: «{form}».', alt: 'Right!', altDe: 'Right! In speech Germans would say «{form}».', fact: 'Right! Now the whole sentence, in the past: «{form}».' };
  // (only the blank typed, «Estaba» for «___ en el baúl.»: also graded as the frame filled in, and the better of the two counts. When
  // the frame alone would already pass, «Eran muy ___.», the blank has to hold the chip's word: «grandes».)
  const RANK = r => (r.ok ? 10 - 'SABCD'.indexOf(r.letter) : r.kind === 'none' ? 0 : 1);
  function grade(T, text, lg, mimo) {
    const r = grade1(T, text, lg, mimo), t = String(text == null ? '' : text).trim().replace(/[.。!！]+$/, '');
    if ((r.ok && r.letter === 'S') || !t || /^[?？]+$/.test(t)) return r;
    const fr = plainOf(String((T.frame || {})[lg] || '').replace(/\{mimo\}/g, mimo || 'Mimo'), lg);
    if (!fr.includes('___')) return r;
    const r2 = grade1(T, fr.replace('___', t), lg, mimo);
    if (r2.ok && grade1(T, fr.replace('___', ' '), lg, mimo).ok && !((T.chips || {})[lg] || []).some(c => has(t, c[0], lg))) return r;
    return RANK(r2) > RANK(r) ? r2 : r;
  }
  function grade1(T, text, lg, mimo) {
    const model = plainOf(String((T.model || {})[lg] || '').replace(/\{mimo\}/g, mimo || 'Mimo'), lg).replace(/\s*[.。]\s*$/, '');
    const tip = (o, k) => String((o && o[lg]) || (k === 'alt' && lg === 'de' ? TIPS.altDe : TIPS[k] || '')).replace('{form}', model);
    if (firstOf(T.veto, text, lg)) return { ok: false, kind: 'lie', why: `That’s what it whispered! How was it really? «${model}»` };     // (de: «… nicht» is the lie itself)
    // (P6a, accents.js: an accent missing costs nothing, a tip shows it; unless what you typed is another form the task tells apart,
    // as typed: then the A stays, and why says why)
    const w = firstOf(T.want, text, lg);
    if (w) {
      const more = !(T.more && T.more[lg] && T.more[lg].length) || T.more[lg].some(x => has(text, x, lg));
      const others = ['alt', 'other', 'lie', 'wrong', 'pres', 'fact'].flatMap(k => ((T[k] || {})[lg] || []).flat());
      const ac = typeof ACCENTS !== 'undefined' ? ACCENTS.judge(text, w, lg, { others }) : { keep: !accented(text, w, lg), why: `Accent: «${plainOf(Array.isArray(w) ? w.join(' … ') : w, lg)}»`, tip: '' };
      return { ok: true, kind: 'right', letter: !ac.keep && more ? 'S' : 'A', why: ac.keep ? ac.why : !more ? `Right! The whole sentence for an S: «${model}»` : 'Just right!', tip: ac.tip || '' };
    }
    if (firstOf(T.alt, text, lg)) return { ok: true, kind: 'alt', letter: 'A', why: tip(T.tipAlt, 'alt') };
    if (firstOf(T.other, text, lg)) return { ok: true, kind: 'other', letter: 'B', why: tip(T.tipOther, 'other') };
    if (firstOf(T.lie, text, lg)) return { ok: false, kind: 'lie', why: `That’s what it whispered! How was it really? «${model}»` };
    if (firstOf(T.wrong, text, lg)) return { ok: false, kind: 'wrong', why: String((T.tipWrong && (T.tipWrong[lg] || T.tipWrong)) || 'Not quite…') };
    if (firstOf(T.pres, text, lg)) return { ok: false, kind: 'pres', why: tip(T.tipPres, 'pres') };
    if (firstOf(T.fact, text, lg)) return { ok: true, kind: 'fact', letter: 'B', why: tip(null, 'fact') };
    return { ok: false, kind: 'none' };
  }
  // (rōmaji capitalizes names mid-sentence: the katakana names here)
  if (typeof CJK !== 'undefined' && CJK.addNames) { try { CJK.addNames(['エレナ', 'フリアン', 'フェリックス', 'クララ', 'マテオ', 'オーロラ', 'ピラール', 'ティナ', 'マルタ', 'ウーゴ', 'トミ', 'シナモン', 'ロレンソ', 'エリオ', 'ノア', 'ロサ']); } catch (e) { /* */ } }

  return { L, LANGS, isC, CAST, CHAT, LINES, DEMO, MARKS, ECHO, TASKS, WHISPERS, FIGHT, NAMES, CARDS, LOOKS, EXTRA, WORDS, check, grade, has, plainOf };
})();
