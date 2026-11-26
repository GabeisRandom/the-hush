'use strict';
// A practice paper in the format of the JLPT N5 (EX2, DESIGN.md 21.2 C; formats.js FORMATS.jlpt, the December 2020 structure).
// Our own sentences and questions in CJK.md's notation ([漢字|かな], okurigana outside, particles their own tokens); ⟦…⟧ is a
// word shown as written with no reading over it (the kanji-reading and spelling questions, where the reading is the answer).
// 言語知識（文字・語彙） 4 mondai, 21 items · 言語知識（文法）・読解 6 mondai, 22 items · 聴解 4 mondai, 24 items, each played
// once. Scored as the JLPT is: two scoring sections, each with its minimum. No speaking or writing: the cover says so.
(() => {
  if (typeof MOCK === 'undefined') return;
  const mc = (ask, opts, words) => ({ type: 'mc', ask, opts, key: 0, words: words || [] });
  const id = s => 'ja.jlpt.n5.' + s;
  const V = { m: { name: '[男|おとこ] の [人|ひと]', pitch: 0.88 }, f: { name: '[女|おんな] の [人|ひと]', pitch: 1.14 }, n: { name: 'ナレーター', pitch: 1.0, rate: 0.95 }, t: { name: '[先生|せんせい]', pitch: 1.04 } };
  const say = (who, text, en) => ({ who, text, en });
  const clip = (n, lines) => ({ label: [String(n), String(n)], lines });

  MOCK.add('ja', 'jlpt', 'N5', {
    sections: { moji: [id('m1'), id('m2'), id('m3'), id('m4')], bunpo: [id('b1'), id('b2'), id('b3'), id('b4'), id('b5'), id('b6')], chokai: [id('c1'), id('c2'), id('c3'), id('c4')] },
    tasks: [
      // ================================================================ 言語知識（文字・語彙） 20 min, 21 items
      { id: id('m1'), part: 'read', tarea: 1, title: ['[漢字|かんじ] [読|よ]み', 'Kanji reading'],
        intro: ['＿ の ことば は ひらがな で どう かきます か 。 １ ・ ２ ・ ３ ・ ４ から いちばん いい もの を ひとつ えらんで ください 。', 'How is the underlined word written in hiragana? Choose the best answer.'],
        text: [['[下線|かせん] の ことば を ひらがな で [読|よ]んで ください 。', 'Read the underlined words in hiragana.']],
        items: [mc(['[私|わたし] は ⟦毎朝⟧ コーヒー を [飲|の]みます 。', 'I drink coffee every morning.'], [['まいあさ', 'maiasa'], ['まいにち', 'mainichi'], ['まいばん', 'maiban'], ['まえあさ', 'maeasa']], ['[毎朝|まいあさ]']),
          mc(['この [店|みせ] の ⟦魚⟧ は おいしい です 。', 'The fish at this shop is tasty.'], [['さかな', 'sakana'], ['さけ', 'sake'], ['にく', 'niku'], ['かい', 'kai']], ['[魚|さかな]']),
          mc(['⟦来週⟧ 、 [友達|ともだち] と [山|やま] に [行|い]きます 。', 'Next week I’m going to the mountains with a friend.'], [['らいしゅう', 'raishū'], ['らいしゅ', 'raishu'], ['こんしゅう', 'konshū'], ['らいげつ', 'raigetsu']], ['[来週|らいしゅう]']),
          mc(['[駅|えき] の ⟦北⟧ に [本屋|ほんや] が あります 。', 'There’s a bookshop north of the station.'], [['きた', 'kita'], ['みなみ', 'minami'], ['ひがし', 'higashi'], ['にし', 'nishi']], ['[北|きた]']),
          mc(['きのう は ⟦雨⟧ でした 。', 'It rained yesterday.'], [['あめ', 'ame'], ['ゆき', 'yuki'], ['かぜ', 'kaze'], ['くもり', 'kumori']], ['[雨|あめ]']),
          mc(['この かばん は ⟦高い⟧ です 。', 'This bag is expensive.'], [['たかい', 'takai'], ['ひくい', 'hikui'], ['やすい', 'yasui'], ['ながい', 'nagai']], ['[高|たか]い']),
          mc(['⟦午後⟧ [三時|さんじ] に [会|あ]いましょう 。', 'Let’s meet at three in the afternoon.'], [['ごご', 'gogo'], ['ごぜん', 'gozen'], ['ごあと', 'goato'], ['ごうご', 'gōgo']], ['[午後|ごご]'])] },

      { id: id('m2'), part: 'read', tarea: 2, title: ['[表記|ひょうき]', 'Orthography'],
        intro: ['＿ の ことば は どう かきます か 。 １ ・ ２ ・ ３ ・ ４ から いちばん いい もの を ひとつ えらんで ください 。', 'How is the underlined word written? Choose the best answer.'],
        text: [['[下線|かせん] の ことば を [漢字|かんじ] で [書|か]く と 、 どれ です か 。', 'Which is the underlined word written in kanji?']],
        items: [mc(['あした ⟦がっこう⟧ に [行|い]きます 。', 'I’m going to school tomorrow.'], [['⟦学校⟧', 'gakkō (right)'], ['⟦学交⟧', 'wrong kanji'], ['⟦字校⟧', 'wrong kanji'], ['⟦学枚⟧', 'wrong kanji']], ['[学校|がっこう]']),
          mc(['この ⟦くるま⟧ は [新|あたら]しい です 。', 'This car is new.'], [['⟦車⟧', 'kuruma (right)'], ['⟦東⟧', 'wrong kanji'], ['⟦単⟧', 'wrong kanji'], ['⟦軍⟧', 'wrong kanji']], ['[車|くるま]']),
          mc(['[毎日|まいにち] [友達|ともだち] と [日本語|にほんご] で ⟦はなします⟧ 。', 'Every day I speak Japanese with friends.'], [['⟦話します⟧', 'hanashimasu (right)'], ['⟦語します⟧', 'wrong kanji'], ['⟦詁します⟧', 'wrong kanji'], ['⟦読します⟧', 'wrong kanji']], ['[話|はな]す']),
          mc(['つぎ の かど を ⟦みぎ⟧ に [曲|ま]がって ください 。', 'Please turn right at the next corner.'], [['⟦右⟧', 'migi (right)'], ['⟦左⟧', 'wrong kanji'], ['⟦石⟧', 'wrong kanji'], ['⟦古⟧', 'wrong kanji']], ['[右|みぎ]']),
          mc(['⟦やすみ⟧ の [日|ひ] は [何|なに] を します か 。', 'What do you do on your days off?'], [['⟦休み⟧', 'yasumi (right)'], ['⟦体み⟧', 'wrong kanji'], ['⟦木み⟧', 'wrong kanji'], ['⟦本み⟧', 'wrong kanji']], ['[休|やす]み'])] },

      { id: id('m3'), part: 'read', tarea: 3, title: ['[文脈|ぶんみゃく] [規定|きてい]', 'Words in context'],
        intro: ['（ ） に なに を いれます か 。 １ ・ ２ ・ ３ ・ ４ から いちばん いい もの を ひとつ えらんで ください 。', 'What goes in the blank? Choose the best answer.'],
        text: [['[文|ぶん] に [合|あ]う ことば を えらんで ください 。', 'Choose the word that fits the sentence.']],
        items: [mc(['[暑|あつ]い です から 、 まど を （ ） ください 。', 'It’s hot, so please ( ) the window.'], [['あけて', 'open'], ['しめて', 'close'], ['つけて', 'switch on'], ['けして', 'switch off']], ['あける']),
          mc(['この [本|ほん] は とても （ ） です 。 [毎晩|まいばん] [読|よ]んで います 。', 'This book is very ( ). I read it every night.'], [['おもしろい', 'interesting'], ['いたい', 'painful'], ['わるい', 'bad'], ['くらい', 'dark']], ['おもしろい']),
          mc(['きのう 、 [友達|ともだち] に [手紙|てがみ] を （ ） 。 あした [郵便局|ゆうびんきょく] で [出|だ]します 。', 'Yesterday I ( ) a letter to a friend. Tomorrow I’ll post it at the post office.'], [['かきました', 'wrote'], ['よみました', 'read'], ['ききました', 'heard'], ['もらいました', 'received']], ['[手紙|てがみ]']),
          mc(['[部屋|へや] が くらい です から 、 でんき を （ ） ください 。', 'The room is dark, so please ( ) the light.'], [['つけて', 'switch on'], ['あけて', 'open'], ['しめて', 'close'], ['けして', 'switch off']], ['つける']),
          mc(['[私|わたし] は [毎朝|まいあさ] シャワー を （ ） 。', 'I ( ) a shower every morning.'], [['あびます', 'take'], ['はいります', 'enter'], ['あらいます', 'wash'], ['いれます', 'put in']], ['あびる']),
          mc(['この りんご は [一|ひと]つ [百|ひゃく] （ ） です 。', 'These apples are a hundred ( ) each.'], [['えん', 'yen'], ['かい', 'times'], ['まい', '(flat things)'], ['ほん', '(long things)']], ['[円|えん]'])] },

      { id: id('m4'), part: 'read', tarea: 4, title: ['[言|い]い[換|か]え [類義|るいぎ]', 'Paraphrases'],
        intro: ['＿ の ぶん と だいたい おなじ いみ の ぶん が あります 。 １ ・ ２ ・ ３ ・ ４ から いちばん いい もの を ひとつ えらんで ください 。', 'Choose the sentence that means roughly the same as the underlined one.'],
        text: [['[同|おな]じ いみ の [文|ぶん] を えらんで ください 。', 'Choose the sentence with the same meaning.']],
        items: [mc(['⟦この へや は せまい です⟧ 。', 'This room is small.'], [['この へや は ひろく ない です 。', 'This room isn’t big.'], ['この へや は くらく ない です 。', 'This room isn’t dark.'], ['この へや は あかるい です 。', 'This room is bright.'], ['この へや は きれい です 。', 'This room is clean.']], ['せまい']),
          mc(['⟦おととい デパート に いきました⟧ 。', 'I went to the department store the day before yesterday.'], [['[二日|ふつか] [前|まえ] に デパート に いきました 。', 'I went to the department store two days ago.'], ['きのう デパート に いきました 。', 'I went yesterday.'], ['あさって デパート に いきます 。', 'I’ll go the day after tomorrow.'], ['[三日|みっか] [前|まえ] に デパート に いきました 。', 'I went three days ago.']], ['おととい']),
          mc(['⟦あの ひと は りょうり が じょうず です⟧ 。', 'That person is good at cooking.'], [['あの ひと は とても おいしい りょうり を つくります 。', 'That person makes very tasty food.'], ['あの ひと は りょうり が きらい です 。', 'That person hates cooking.'], ['あの ひと は りょうり が へた です 。', 'That person is bad at cooking.'], ['あの ひと は りょうり を たべません 。', 'That person doesn’t eat food.']], ['じょうず'])] },

      // ================================================================ 言語知識（文法）・読解 40 min, 22 items
      { id: id('b1'), part: 'read', tarea: 1, title: ['[文法|ぶんぽう] [形式|けいしき] の [判断|はんだん]', 'Grammar forms'],
        intro: ['（ ） に [何|なに] を [入|い]れます か 。 １ ・ ２ ・ ３ ・ ４ から いちばん いい もの を ひとつ えらんで ください 。', 'What goes in the blank? Choose the best answer.'],
        text: [['[文|ぶん] に [合|あ]う もの を えらんで ください 。', 'Choose what fits the sentence.']],
        items: [mc(['[私|わたし] は [毎日|まいにち] バス （ ） [学校|がっこう] へ [行|い]きます 。', 'I go to school ( ) bus every day.'], [['で', 'by'], ['に', 'to'], ['を', '(object)'], ['が', '(subject)']], ['で']),
          mc(['つくえ の [上|うえ] （ ） [本|ほん] が あります 。', 'There’s a book ( ) the desk.'], [['に', 'on'], ['で', 'at (action)'], ['を', '(object)'], ['へ', 'toward']], ['に']),
          mc(['きのう は [寒|さむ]かった です が 、 [今日|きょう] は あまり （ ） 。', 'Yesterday was cold, but today it’s not very ( ).'], [['[寒|さむ]く ありません', 'cold (negative)'], ['[寒|さむ]い です', 'cold'], ['[寒|さむ]かった です', 'was cold'], ['[寒|さむ]く ありました', '(wrong form)']], ['あまり']),
          mc(['「 [何|なに] を [飲|の]みます か 。 」 「 コーヒー （ ） いい です 。 」', '“What will you drink?” “Coffee ( ) fine.”'], [['が', '(that one)'], ['を', '(object)'], ['に', 'to'], ['で', 'with']], ['が']),
          mc(['この [部屋|へや] は [静|しず]か （ ） 、 きれい です 。', 'This room is quiet ( ) clean.'], [['で', 'and'], ['に', '(adverb)'], ['な', '(before a noun)'], ['と', 'with']], ['[静|しず]か']),
          mc(['[週末|しゅうまつ] は [映画館|えいがかん] で [新|あたら]しい [映画|えいが] を （ ） 。', 'At the weekend I want to ( ) the new film at the cinema.'], [['[見|み]たい です', 'want to see'], ['[見|み]たく です', '(wrong form)'], ['[見|み]る たい です', '(wrong form)'], ['[見|み]た です', '(wrong form)']], ['たい']),
          mc(['[田中|たなか]さん は [今|いま] 、 [電話|でんわ] を （ ） います 。', 'Mr. Tanaka is ( ) a phone call now.'], [['かけて', 'making (-te)'], ['かける', 'make'], ['かけた', 'made'], ['かけ', '(stem)']], ['かける']),
          mc(['[駅|えき] から [家|いえ] まで [歩|ある]いて [十分|じゅっぷん] （ ） です 。', 'From the station to my house it’s ( ) ten minutes on foot.'], [['ぐらい', 'about'], ['ごろ', 'around (a time)'], ['より', 'than'], ['ずつ', 'each']], ['ぐらい']),
          mc(['[寝|ね]る [前|まえ] （ ） 、 [歯|は] を みがきます 。', 'I brush my teeth ( ) going to bed.'], [['に', 'before (mae ni)'], ['で', 'at'], ['を', '(object)'], ['へ', 'toward']], ['[前|まえ]'])] },

      { id: id('b2'), part: 'read', tarea: 2, title: ['[文|ぶん] の [組|く]み[立|た]て', 'Sentence building'],
        intro: ['★ に [入|はい]る もの は どれ です か 。 １ ・ ２ ・ ３ ・ ４ から いちばん いい もの を ひとつ えらんで ください 。', 'Which word goes in the ★ slot? Choose the best answer.'],
        text: [['[四|よっ]つ の ことば を [正|ただ]しい [順番|じゅんばん] に [並|なら]べて 、 ★ に [入|はい]る ことば を えらびます 。', 'Put the four words in the right order and choose the one that goes in ★.']],
        items: [mc(['[私|わたし] の [趣味|しゅみ] は ＿ ＿ ★ ＿ です 。', 'My hobby is ＿ ＿ ★ ＿.'], [['とる', 'take'], ['こと', 'thing (nominalizer)'], ['を', '(object)'], ['[写真|しゃしん]', 'photos']], ['[趣味|しゅみ]']),
          mc(['これ は ＿ ＿ ★ ＿ です 。', 'This is ＿ ＿ ★ ＿.'], [['[作|つく]った', 'made'], ['[母|はは]', 'my mother'], ['が', '(subject)'], ['ケーキ', 'cake']], ['[作|つく]る']),
          mc(['[私|わたし] は ＿ ＿ ★ ＿ [行|い]きました 。', 'I went ＿ ＿ ★ ＿.'], [['[公園|こうえん]', 'the park'], ['[日曜日|にちようび] に', 'on Sunday'], ['[友達|ともだち] と', 'with a friend'], ['へ', 'to']], ['[公園|こうえん]']),
          mc(['あそこ で ＿ ＿ ★ ＿ は [山田|やまだ]さん です 。', 'The ＿ ＿ ★ ＿ over there is Mr. Yamada.'], [['[読|よ]んで いる', 'is reading'], ['[新聞|しんぶん]', 'a newspaper'], ['を', '(object)'], ['[人|ひと]', 'person']], ['[読|よ]む'])] },

      { id: id('b3'), part: 'read', tarea: 3, title: ['[文章|ぶんしょう] の [文法|ぶんぽう]', 'Grammar in a text'],
        intro: ['[文章|ぶんしょう] を [読|よ]んで 、 （ １４ ） から （ １７ ） に [何|なに] を [入|い]れる か 、 いちばん いい もの を えらんで ください 。', 'Read the text and choose the best answer for blanks 14 to 17.'],
        head: [['[私|わたし] の [町|まち] 　 マリア ・ ロペス', 'My town · María López']],
        text: [['[私|わたし] は [先月|せんげつ] 、 アルバ に [来|き]ました 。 アルバ は [小|ちい]さい [町|まち] です が 、 [店|みせ] や レストラン が たくさん あります 。', 'I came to Alba last month. Alba is a small town, but there are lots of shops and restaurants.'],
          ['[町|まち] の [西|にし] に は [大|おお]きい [湖|みずうみ] が あります 。 [私|わたし] は [週末|しゅうまつ] 、 よく [湖|みずうみ] へ [行|い]きます 。', 'To the west of the town there’s a big lake. I often go to the lake at the weekend.'],
          ['（ １４ ） 、 [湖|みずうみ] の [近|ちか]く で [友達|ともだち] と [魚|さかな] を （ １５ ） 。 とても [楽|たの]しかった です 。', '(14), I (15) fish with friends near the lake. It was great fun.'],
          ['[来月|らいげつ] は [山|やま] に （ １６ ） たい です 。 [山|やま] から [見|み]る [町|まち] は きっと きれい （ １７ ） 。', 'Next month I want to (16) the mountain. The town seen from the mountain will surely (17) beautiful.']],
        items: [mc(['（ １４ ）', '(14)'], [['[先週|せんしゅう] は', 'last week'], ['[来週|らいしゅう] は', 'next week'], ['[明日|あした] は', 'tomorrow'], ['[毎週|まいしゅう] は', 'every week']], ['[先週|せんしゅう]']),
          mc(['（ １５ ）', '(15)'], [['[釣|つ]りました', 'caught'], ['[釣|つ]ります', 'catch'], ['[釣|つ]って います', 'am catching'], ['[釣|つ]りましょう', 'let’s catch']], ['[釣|つ]る']),
          mc(['（ １６ ）', '(16)'], [['[登|のぼ]り', 'climb (stem)'], ['[登|のぼ]る', 'climb'], ['[登|のぼ]って', 'climb (-te)'], ['[登|のぼ]った', 'climbed']], ['[登|のぼ]る']),
          mc(['（ １７ ）', '(17)'], [['でしょう', 'will surely be'], ['だった', 'was'], ['です か', 'is it?'], ['じゃ ない', 'isn’t']], ['でしょう'])] },

      { id: id('b4'), part: 'read', tarea: 4, title: ['[内容|ないよう] [理解|りかい] （ [短文|たんぶん] ）', 'Short texts'],
        intro: ['つぎ の （ １ ） と （ ２ ） の [文章|ぶんしょう] を [読|よ]んで 、 [質問|しつもん] に [答|こた]えて ください 。', 'Read texts (1) and (2) and answer the questions.'],
        blocks: [
          { label: ['（ １ ）', '(1)'], kind: 'note', text: [['[田中|たなか]さん へ', 'To Mr. Tanaka'], ['[今日|きょう] の [会議|かいぎ] は [三時|さんじ] から [四時|よじ] に なりました 。', 'Today’s meeting has moved from three to four.'], ['[会議|かいぎ] の [前|まえ] に 、 この [紙|かみ] を [五枚|ごまい] コピー して ください 。', 'Before the meeting, please make five copies of this sheet.'], ['[山本|やまもと]', 'Yamamoto']] },
          { label: ['（ ２ ）', '(2)'], kind: 'chat', text: [['リサさん 、 あした の パーティー です が 、 [仕事|しごと] が ある ので 、 [七時|しちじ] ごろ [行|い]きます 。', 'Lisa, about tomorrow’s party: I have work, so I’ll come around seven.'], ['[飲|の]み[物|もの] を [買|か]って [行|い]きます から 、 リサさん は [何|なに] も [買|か]わないで ください 。 ケン', 'I’ll buy the drinks and bring them, so please don’t buy anything. Ken']] }],
        items: [mc(['（ １ ） [田中|たなか]さん は [会議|かいぎ] の [前|まえ] に [何|なに] を します か 。', '(1) What will Mr. Tanaka do before the meeting?'], [['[紙|かみ] を コピー します 。', 'Copy a sheet of paper.'], ['[三時|さんじ] に [会議|かいぎ] に [行|い]きます 。', 'Go to the meeting at three.'], ['[山本|やまもと]さん に [電話|でんわ] します 。', 'Phone Yamamoto.'], ['[紙|かみ] を [五枚|ごまい] [買|か]います 。', 'Buy five sheets of paper.']], ['[会議|かいぎ]']),
          mc(['（ ２ ） ケンさん は あした [何|なに] を します か 。', '(2) What will Ken do tomorrow?'], [['[七時|しちじ] ごろ [飲|の]み[物|もの] を [持|も]って [行|い]きます 。', 'Bring drinks around seven.'], ['[仕事|しごと] を [休|やす]みます 。', 'Take the day off work.'], ['リサさん と [飲|の]み[物|もの] を [買|か]いに [行|い]きます 。', 'Go shopping for drinks with Lisa.'], ['パーティー に [行|い]きません 。', 'Not go to the party.']], ['[飲|の]み[物|もの]'])] },

      { id: id('b5'), part: 'read', tarea: 5, title: ['[内容|ないよう] [理解|りかい] （ [中文|ちゅうぶん] ）', 'A mid-length text'],
        intro: ['つぎ の [文章|ぶんしょう] を [読|よ]んで 、 [質問|しつもん] に [答|こた]えて ください 。', 'Read the text and answer the questions.'],
        head: [['[私|わたし] の [趣味|しゅみ]', 'My hobby']],
        text: [['[私|わたし] の [趣味|しゅみ] は [料理|りょうり] です 。 [国|くに] で は [毎日|まいにち] [母|はは] と いっしょ に [料理|りょうり] を [作|つく]りました 。', 'My hobby is cooking. Back home I cooked with my mother every day.'],
          ['アルバ に [来|き]て から 、 こちら の [料理|りょうり] も [作|つく]りたい と [思|おも]いました 。', 'Since coming to Alba, I’ve wanted to cook the food here too.'],
          ['[先週|せんしゅう] 、 [友達|ともだち] の ゆみさん が [私|わたし] の [家|いえ] に [来|き]て 、 カレー の [作|つく]り[方|かた] を [教|おし]えて くれました 。', 'Last week my friend Yumi came to my house and taught me how to make curry.'],
          ['ゆみさん の カレー は [私|わたし] の [国|くに] の カレー より あまくて 、 [辛|から]く ありません でした 。', 'Yumi’s curry was sweeter than the curry from my country, and it wasn’t spicy.'],
          ['[今度|こんど] は [私|わたし] が ゆみさん に [国|くに] の [料理|りょうり] を [作|つく]って あげたい です 。', 'Next time I want to make a dish from my country for Yumi.']],
        items: [mc(['この [人|ひと] は [国|くに] で だれ と [料理|りょうり] を [作|つく]りました か 。', 'Who did this person cook with back home?'], [['お[母|かあ]さん', 'their mother'], ['ゆみさん', 'Yumi'], ['[友達|ともだち]', 'friends'], ['ひとり で', 'alone']], ['[料理|りょうり]']),
          mc(['この [人|ひと] は これ から [何|なに] を したい です か 。', 'What does this person want to do next?'], [['ゆみさん に [国|くに] の [料理|りょうり] を [作|つく]りたい 。', 'Cook a dish from home for Yumi.'], ['ゆみさん に カレー の [作|つく]り[方|かた] を [聞|き]きたい 。', 'Ask Yumi how to make curry.'], ['あまい カレー を [食|た]べたい 。', 'Eat sweet curry.'], ['[国|くに] へ [帰|かえ]りたい 。', 'Go back home.']], ['[作|つく]る'])] },

      { id: id('b6'), part: 'read', tarea: 6, kind: 'sign', title: ['[情報|じょうほう] [検索|けんさく]', 'Finding information'],
        intro: ['[右|みぎ] の [案内|あんない] を [見|み]て 、 [質問|しつもん] に [答|こた]えて ください 。', 'Look at the notice and answer the question.'],
        head: [['アルバ [図書館|としょかん] の [案内|あんない]', 'Alba Library information']],
        text: [['[月曜日|げつようび] ： お[休|やす]み', 'Monday: closed'], ['[火曜日|かようび] ～ [金曜日|きんようび] ： 9:00 ～ 19:00', 'Tuesday to Friday: 9:00 to 19:00'],
          ['[土曜日|どようび] ・ [日曜日|にちようび] ： 10:00 ～ 17:00', 'Saturday and Sunday: 10:00 to 17:00'], ['[本|ほん] は [一人|ひとり] [五冊|ごさつ] まで 、 [二週間|にしゅうかん] [借|か]りる こと が できます 。', 'Each person can borrow up to five books for two weeks.']],
        items: [mc(['マリアさん は [土曜日|どようび] の [朝|あさ] 、 [本|ほん] を [借|か]りたい です 。 [何時|なんじ] から [行|い]く こと が できます か 。', 'María wants to borrow books on Saturday morning. From what time can she go?'], [['[十時|じゅうじ]', '10:00'], ['[九時|くじ]', '9:00'], ['[月曜日|げつようび] の [九時|くじ]', 'Monday at 9:00'], ['[五時|ごじ]', '5:00']], ['[図書館|としょかん]'])] },

      // ================================================================ 聴解 30 min, 24 items, each recording played once
      { id: id('c1'), part: 'listen', tarea: 1, title: ['[課題|かだい] [理解|りかい]', 'Task-based listening'],
        intro: ['[問題|もんだい] １ で は 、 はじめ に [質問|しつもん] を [聞|き]いて ください 。 それ から [話|はなし] を [聞|き]いて 、 いちばん いい もの を ひとつ えらんで ください 。', 'In mondai 1, first hear the question, then the conversation, and choose the best answer.'],
        voices: V,
        clips: [clip(1, [say('n', '[男|おとこ] の [人|ひと] と [女|おんな] の [人|ひと] が [話|はな]して います 。 [男|おとこ] の [人|ひと] は [何|なに] を [買|か]います か 。', 'A man and a woman are talking. What will the man buy?'), say('f', '[明日|あした] の パーティー 、 [何|なに] を [買|か]いましょう か 。', 'What shall we buy for tomorrow’s party?'), say('m', 'ジュース と おかし は どう です か 。', 'How about juice and snacks?'), say('f', 'ジュース は [私|わたし] が もう [買|か]いました 。', 'I’ve already bought the juice.'), say('m', 'じゃあ 、 [私|わたし] は おかし と くだもの を [買|か]います 。', 'Then I’ll buy snacks and fruit.')]),
          clip(2, [say('n', '[女|おんな] の [人|ひと] が [話|はな]して います 。 [女|おんな] の [人|ひと] は [本|ほん] を どこ に [置|お]きます か 。', 'A woman is talking. Where will she put the book?'), say('f', 'この [本|ほん] 、 どこ に [置|お]きましょう か 。', 'Where shall I put this book?'), say('m', 'つくえ の [上|うえ] に お[願|ねが]いします 。 あ 、 いいえ 、 [本棚|ほんだな] の [中|なか] に [入|い]れて ください 。', 'On the desk, please. Oh, no, put it in the bookcase.')]),
          clip(3, [say('n', '[二人|ふたり] は [何時|なんじ] に [会|あ]います か 。', 'What time will the two meet?'), say('m', '[明日|あした] 、 [駅|えき] で [十時|じゅうじ] に [会|あ]いましょう 。', 'Let’s meet at the station at ten tomorrow.'), say('f', 'すみません 、 [十時|じゅうじ] は ちょっと … 。 [十時半|じゅうじはん] は どう です か 。', 'Sorry, ten is a bit… How about ten-thirty?'), say('m', 'いい です よ 。 じゃあ 、 [十時半|じゅうじはん] に 。', 'Sure. Ten-thirty, then.')]),
          clip(4, [say('n', '[女|おんな] の [人|ひと] は [何番|なんばん] の バス に [乗|の]ります か 。', 'Which bus will the woman take?'), say('f', 'すみません 、 [病院|びょういん] へ [行|い]きたい ん です が … 。', 'Excuse me, I’d like to get to the hospital…'), say('m', '[三番|さんばん] の バス に [乗|の]って ください 。 [五番|ごばん] も [行|い]きます が 、 [時間|じかん] が かかります よ 。', 'Take the number three bus. Number five goes too, but it takes longer.'), say('f', 'ありがとう ございます 。', 'Thank you very much.')]),
          clip(5, [say('n', '[先生|せんせい] が [話|はな]して います 。 [学生|がくせい] は [今日|きょう] 、 どこ の [宿題|しゅくだい] を します か 。', 'A teacher is talking. Which homework will the students do today?'), say('t', '[今日|きょう] の [宿題|しゅくだい] は [二十|にじゅう] ページ と [二十一|にじゅういち] ページ です 。 [二十二|にじゅうに] ページ は [来週|らいしゅう] します 。', 'Today’s homework is pages twenty and twenty-one. We’ll do page twenty-two next week.')]),
          clip(6, [say('n', '[男|おとこ] の [人|ひと] は [明日|あした] 、 [何|なに] を [持|も]って [行|い]きます か 。', 'What will the man bring tomorrow?'), say('m', '[明日|あした] の ピクニック 、 [何|なに] を [持|も]って [行|い]きます か 。', 'What shall I bring to tomorrow’s picnic?'), say('f', 'お[弁当|べんとう] は [私|わたし] が [作|つく]ります 。 [山田|やまだ]さん は [飲|の]み[物|もの] を お[願|ねが]いします 。', 'I’ll make the lunch boxes. Mr. Yamada, please bring drinks.'), say('m', 'わかりました 。 カメラ も [持|も]って [行|い]きます ね 。', 'Got it. I’ll bring a camera too.')]),
          clip(7, [say('n', '[女|おんな] の [人|ひと] は どの シャツ を [買|か]います か 。', 'Which shirt will the woman buy?'), say('f', '[白|しろ]い シャツ と [青|あお]い シャツ 、 どちら が いい です か 。', 'The white shirt or the blue one, which is better?'), say('m', '[青|あお]い の が いい です よ 。', 'The blue one is better.'), say('f', 'じゃあ 、 [青|あお]い の に します 。', 'Then I’ll take the blue one.')])],
        items: [mc(['[男|おとこ] の [人|ひと] は [何|なに] を [買|か]います か 。', 'What will the man buy?'], [['おかし と くだもの', 'snacks and fruit'], ['ジュース と おかし', 'juice and snacks'], ['ジュース と くだもの', 'juice and fruit'], ['おかし だけ', 'only snacks']], ['くだもの']),
          mc(['[本|ほん] を どこ に [置|お]きます か 。', 'Where will she put the book?'], [['[本棚|ほんだな] の [中|なか]', 'in the bookcase'], ['つくえ の [上|うえ]', 'on the desk'], ['いす の [上|うえ]', 'on the chair'], ['かばん の [中|なか]', 'in the bag']], ['[置|お]く']),
          mc(['[二人|ふたり] は [何時|なんじ] に [会|あ]います か 。', 'What time will they meet?'], [['[十時半|じゅうじはん]', '10:30'], ['[十時|じゅうじ]', '10:00'], ['[九時半|くじはん]', '9:30'], ['[十一時|じゅういちじ]', '11:00']], ['[会|あ]う']),
          mc(['[何番|なんばん] の バス に [乗|の]ります か 。', 'Which bus will she take?'], [['[三番|さんばん]', 'number 3'], ['[五番|ごばん]', 'number 5'], ['[四番|よんばん]', 'number 4'], ['[八番|はちばん]', 'number 8']], ['[乗|の]る']),
          mc(['[学生|がくせい] は [今日|きょう] 、 どこ の [宿題|しゅくだい] を します か 。', 'Which homework will the students do today?'], [['[二十|にじゅう] ページ と [二十一|にじゅういち] ページ', 'pages 20 and 21'], ['[二十一|にじゅういち] ページ と [二十二|にじゅうに] ページ', 'pages 21 and 22'], ['[二十二|にじゅうに] ページ だけ', 'only page 22'], ['[二十|にじゅう] ページ だけ', 'only page 20']], ['[宿題|しゅくだい]']),
          mc(['[男|おとこ] の [人|ひと] は [何|なに] を [持|も]って [行|い]きます か 。', 'What will the man bring?'], [['[飲|の]み[物|もの] と カメラ', 'drinks and a camera'], ['お[弁当|べんとう] と [飲|の]み[物|もの]', 'lunch boxes and drinks'], ['お[弁当|べんとう] と カメラ', 'lunch boxes and a camera'], ['カメラ だけ', 'only a camera']], ['[持|も]つ']),
          mc(['[女|おんな] の [人|ひと] は どの シャツ を [買|か]います か 。', 'Which shirt will the woman buy?'], [['[青|あお]い シャツ', 'the blue shirt'], ['[白|しろ]い シャツ', 'the white shirt'], ['[赤|あか]い シャツ', 'a red shirt'], ['[黒|くろ]い シャツ', 'a black shirt']], ['[青|あお]い'])] },

      { id: id('c2'), part: 'listen', tarea: 2, title: ['ポイント [理解|りかい]', 'Listening for key points'],
        intro: ['[問題|もんだい] ２ で は 、 はじめ に [質問|しつもん] を [聞|き]いて ください 。 それ から [話|はなし] を [聞|き]いて 、 いちばん いい もの を ひとつ えらんで ください 。', 'In mondai 2, first hear the question, then the conversation, and choose the best answer.'],
        voices: V,
        clips: [clip(8, [say('n', '[女|おんな] の [人|ひと] は きのう [何|なに] を しました か 。', 'What did the woman do yesterday?'), say('m', 'きのう は [何|なに] を しました か 。', 'What did you do yesterday?'), say('f', '[友達|ともだち] と [映画|えいが] を [見|み] に [行|い]きました 。 その [後|あと] 、 レストラン で [晩|ばん]ごはん を [食|た]べました 。', 'I went to see a film with a friend. After that, we had dinner at a restaurant.')]),
          clip(9, [say('n', '[男|おとこ] の [人|ひと] の [家族|かぞく] は [何人|なんにん] です か 。', 'How many people are in the man’s family?'), say('f', '[田中|たなか]さん の ご[家族|かぞく] は [何人|なんにん] です か 。', 'How many people are in your family, Mr. Tanaka?'), say('m', '[両親|りょうしん] と [姉|あね] と [私|わたし] です 。 [弟|おとうと] も います が 、 [今|いま] は [外国|がいこく] に います 。', 'My parents, my older sister and me. I have a younger brother too, but he’s abroad now.')]),
          clip(10, [say('n', '[男|おとこ] の [人|ひと] は どうして きのう [学校|がっこう] を [休|やす]みました か 。', 'Why did the man miss school yesterday?'), say('f', 'きのう 、 どうして [学校|がっこう] を [休|やす]みました か 。', 'Why were you off school yesterday?'), say('m', '[頭|あたま] が [痛|いた]かった ん です 。 でも 、 [今日|きょう] は もう [元気|げんき] です 。', 'I had a headache. But I’m fine today.')]),
          clip(11, [say('n', '[女|おんな] の [人|ひと] は [毎朝|まいあさ] [何時|なんじ] に [起|お]きます か 。', 'What time does the woman get up every morning?'), say('m', '[毎朝|まいあさ] [何時|なんじ] に [起|お]きます か 。', 'What time do you get up every morning?'), say('f', '[六時|ろくじ] です 。 でも 、 [日曜日|にちようび] は [九時|くじ] ごろ [起|お]きます 。', 'At six. But on Sundays I get up around nine.')]),
          clip(12, [say('n', '[二人|ふたり] は どこ で [昼|ひる]ごはん を [食|た]べます か 。', 'Where will the two have lunch?'), say('f', 'お[昼|ひる] 、 どこ で [食|た]べましょう か 。 [食堂|しょくどう] は [人|ひと] が [多|おお]い です ね 。', 'Where shall we eat at lunchtime? The cafeteria is crowded.'), say('m', 'じゃあ 、 [公園|こうえん] で [食|た]べましょう 。 [天気|てんき] も いい です から 。', 'Then let’s eat in the park. The weather’s nice too.')]),
          clip(13, [say('n', '[男|おとこ] の [人|ひと] は [今日|きょう] 、 [何|なに] で [会社|かいしゃ] に [行|い]きます か 。', 'How is the man getting to work today?'), say('f', '[会社|かいしゃ] まで [何|なに] で [行|い]きます か 。', 'How do you get to work?'), say('m', 'いつも は [自転車|じてんしゃ] です が 、 [雨|あめ] の [日|ひ] は バス で [行|い]きます 。 [今日|きょう] は [雨|あめ] です から 、 バス です 。', 'Usually by bike, but on rainy days I take the bus. It’s raining today, so the bus.')])],
        items: [mc(['[女|おんな] の [人|ひと] は きのう [何|なに] を しました か 。', 'What did the woman do yesterday?'], [['[映画|えいが] を [見|み]て 、 [晩|ばん]ごはん を [食|た]べました 。', 'Saw a film and had dinner.'], ['[映画|えいが] を [見|み]て 、 [買|か]い[物|もの] を しました 。', 'Saw a film and went shopping.'], ['[家|いえ] で [映画|えいが] を [見|み]ました 。', 'Watched a film at home.'], ['レストラン で [働|はたら]きました 。', 'Worked at a restaurant.']], ['[映画|えいが]']),
          mc(['[男|おとこ] の [人|ひと] の [家族|かぞく] は [何人|なんにん] です か 。', 'How many are in the man’s family?'], [['[五人|ごにん]', 'five'], ['[四人|よにん]', 'four'], ['[三人|さんにん]', 'three'], ['[六人|ろくにん]', 'six']], ['[家族|かぞく]']),
          mc(['どうして [学校|がっこう] を [休|やす]みました か 。', 'Why did he miss school?'], [['[頭|あたま] が [痛|いた]かった から', 'he had a headache'], ['[熱|ねつ] が あった から', 'he had a fever'], ['[忙|いそが]しかった から', 'he was busy'], ['[雨|あめ] が [降|ふ]った から', 'it rained']], ['[頭|あたま]']),
          mc(['[女|おんな] の [人|ひと] は [毎朝|まいあさ] [何時|なんじ] に [起|お]きます か 。', 'What time does she get up every morning?'], [['[六時|ろくじ]', 'six'], ['[九時|くじ]', 'nine'], ['[七時|しちじ]', 'seven'], ['[八時|はちじ]', 'eight']], ['[起|お]きる']),
          mc(['[二人|ふたり] は どこ で [昼|ひる]ごはん を [食|た]べます か 。', 'Where will they have lunch?'], [['[公園|こうえん]', 'in the park'], ['[食堂|しょくどう]', 'in the cafeteria'], ['[教室|きょうしつ]', 'in the classroom'], ['レストラン', 'at a restaurant']], ['[公園|こうえん]']),
          mc(['[男|おとこ] の [人|ひと] は [今日|きょう] 、 [何|なに] で [会社|かいしゃ] に [行|い]きます か 。', 'How is he getting to work today?'], [['バス', 'by bus'], ['[自転車|じてんしゃ]', 'by bike'], ['[電車|でんしゃ]', 'by train'], ['[歩|ある]いて', 'on foot']], ['バス'])] },

      { id: id('c3'), part: 'listen', tarea: 3, title: ['[発話|はつわ] [表現|ひょうげん]', 'What do you say?'],
        intro: ['[問題|もんだい] ３ で は 、 [話|はなし] を [聞|き]いて ください 。 [何|なん] と [言|い]います か 。 いちばん いい もの を ひとつ えらんで ください 。', 'In mondai 3, listen to the situation. What do you say? Choose the best answer.'],
        voices: V,
        clips: [clip(14, [say('n', '[友達|ともだち] の [家|いえ] に [入|はい]ります 。 [何|なん] と [言|い]います か 。', 'You’re going into a friend’s house. What do you say?')]),
          clip(15, [say('n', '[朝|あさ] 、 [先生|せんせい] に [会|あ]いました 。 [何|なん] と [言|い]います か 。', 'You meet your teacher in the morning. What do you say?')]),
          clip(16, [say('n', '[店|みせ] で りんご が ほしい です 。 [何|なん] と [言|い]います か 。', 'At a shop, you want some apples. What do you say?')]),
          clip(17, [say('n', '[友達|ともだち] に [本|ほん] を [借|か]りたい です 。 [何|なん] と [言|い]います か 。', 'You want to borrow a book from a friend. What do you say?')]),
          clip(18, [say('n', '[今日|きょう] は [友達|ともだち] の [誕生日|たんじょうび] です 。 [何|なん] と [言|い]います か 。', 'Today is your friend’s birthday. What do you say?')])],
        items: [mc(['[友達|ともだち] の [家|いえ] に [入|はい]ります 。', 'Going into a friend’s house.'], [['おじゃまします 。', 'Sorry to intrude.'], ['いってきます 。', 'I’m off.'], ['おやすみなさい 。', 'Good night.']], ['おじゃまします']),
          mc(['[朝|あさ] 、 [先生|せんせい] に [会|あ]いました 。', 'Meeting your teacher in the morning.'], [['おはよう ございます 。', 'Good morning.'], ['こんばんは 。', 'Good evening.'], ['さようなら 。', 'Goodbye.']], ['おはよう']),
          mc(['[店|みせ] で りんご が ほしい です 。', 'Wanting apples at a shop.'], [['りんご を ください 。', 'Apples, please.'], ['りんご を どうぞ 。', 'Here are some apples.'], ['りんご が あります 。', 'There are apples.']], ['ください']),
          mc(['[友達|ともだち] に [本|ほん] を [借|か]りたい です 。', 'Wanting to borrow a friend’s book.'], [['この [本|ほん] 、 [貸|か]して ください 。', 'Please lend me this book.'], ['この [本|ほん] 、 [借|か]りて ください 。', 'Please borrow this book.'], ['この [本|ほん] 、 [読|よ]みましょう か 。', 'Shall I read this book?']], ['[貸|か]す']),
          mc(['[今日|きょう] は [友達|ともだち] の [誕生日|たんじょうび] です 。', 'Your friend’s birthday.'], [['お[誕生日|たんじょうび] おめでとう 。', 'Happy birthday.'], ['ありがとう ございます 。', 'Thank you very much.'], ['ごちそうさま でした 。', 'Thanks for the meal.']], ['おめでとう'])] },

      { id: id('c4'), part: 'listen', tarea: 4, title: ['[即時|そくじ] [応答|おうとう]', 'Quick responses'],
        intro: ['[問題|もんだい] ４ で は 、 [文|ぶん] を [聞|き]いて 、 いちばん いい [返事|へんじ] を ひとつ えらんで ください 。', 'In mondai 4, listen to the sentence and choose the best reply.'],
        voices: V,
        clips: [clip(19, [say('m', 'お[名前|なまえ] は ？', 'Your name?')]), clip(20, [say('f', '[今日|きょう] は [何曜日|なんようび] です か 。', 'What day is it today?')]),
          clip(21, [say('m', 'コーヒー 、 もう [一杯|いっぱい] いかが です か 。', 'Would you like another cup of coffee?')]), clip(22, [say('f', 'ここ に [座|すわ]って も いい です か 。', 'May I sit here?')]),
          clip(23, [say('m', '[駅|えき] は どこ です か 。', 'Where’s the station?')]), clip(24, [say('f', 'いっしょ に [昼|ひる]ごはん を [食|た]べません か 。', 'Won’t you have lunch with me?')])],
        items: [mc(null, [['[山田|やまだ] です 。', 'It’s Yamada.'], ['[二十歳|はたち] です 。', 'I’m twenty.'], ['[日本|にほん] です 。', 'Japan.']], ['[名前|なまえ]']),
          mc(null, [['[水曜日|すいようび] です 。', 'Wednesday.'], ['[三日|みっか] です 。', 'The third.'], ['[十時|じゅうじ] です 。', 'Ten o’clock.']], ['[曜日|ようび]']),
          mc(null, [['いいえ 、 けっこう です 。', 'No, thank you.'], ['はい 、 [一杯|いっぱい] です 。', 'Yes, one cup.'], ['いいえ 、 [飲|の]みました 。', 'No, I drank it.']], ['けっこう']),
          mc(null, [['はい 、 どうぞ 。', 'Yes, go ahead.'], ['はい 、 [座|すわ]りました 。', 'Yes, I sat down.'], ['いいえ 、 [座|すわ]って ください 。', 'No, please sit.']], ['どうぞ']),
          mc(null, [['あの [銀行|ぎんこう] の [隣|となり] です 。', 'Next to that bank.'], ['[電車|でんしゃ] で [行|い]きます 。', 'I go by train.'], ['[十分|じゅっぷん] です 。', 'Ten minutes.']], ['[隣|となり]']),
          mc(null, [['いい です ね 。 [食|た]べましょう 。', 'Sounds good. Let’s eat.'], ['はい 、 [食|た]べません 。', 'Yes, I won’t eat.'], ['ごちそうさま でした 。', 'Thanks for the meal.']], ['いっしょ'])] },
    ],
  });
})();
