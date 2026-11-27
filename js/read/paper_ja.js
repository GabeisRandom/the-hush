'use strict';
// 「 谷のこだま新聞 」, the weekly edition in Japanese (paper.js is the engine; the shape is at the top of paper_es.js; the
// corner store's day paper has the same masthead, townlife.js). Standard Japanese in the CJK.md notation; B1 for editions 1–2,
// B2 for 3–4; Alba's own town life only, with threads from week to week (Alba's first Tanabata, the library's hundred new
// books, Murakami-san's wobbly bench, the roof over Market Street and its swallows, the summer radio exercises). The reader is
// never gendered.

PAPER.add('ja', {
  mast: ['[谷|たに] の こだま [新聞|しんぶん]', 'The Valley Echo'], sub: ['[毎週|まいしゅう] [土曜日|どようび] の [新聞|しんぶん]', 'Weekly edition'], start: 3,
  labels: { lead: ['[一面|いちめん]', 'Front page'], news: ['アルバ の ニュース', 'Alba news'], letter: ['[読者|どくしゃ] の [声|こえ]', 'Letters to the editor'], column: ['[読|よ]みもの', 'Column'],
    ads: ['お[知|し]らせ', 'Small ads'], weather: ['[天気|てんき]', 'The weather'], no: ['No.', 'No.'], town: ['アルバ', 'Alba'] },
  desk: { title: ['ラジオ アルバ の [六時|ろくじ] の ニュース から', 'From Radio Alba’s newsroom: your items for the six o’clock news'],
    empty: ['ラジオ アルバ の [六時|ろくじ] の ニュース は 、 もうすぐ ここ で [読|よ]めます 。', 'Coming soon on this page: Radio Alba’s six o’clock items.'] },
  weather: { tags: ['warm', 'wet'], row: ['{d.n} ： {s.say} 。 {s.tip}', '{d.en}: {s.en}. {s.tipEn}'], rowT: ['{d.n} ： {s.say} 。 [気温|きおん] は {s.w} [度|ど] 。 {s.tip}', '{d.en}: {s.en}, {s.n} degrees. {s.tipEn}'],
    ask: ['[新聞|しんぶん] に よる と 、 {d.n} の [天気|てんき] は どう です か ？', 'According to the paper, what’s the weather on {d.en}?'] },
  found: { ad: ['{p.n} で 、 {i.t} が [見|み]つかりました 。 [落|お]とした [人|ひと] は 、 [図書館|としょかん] の [文田|ふみた] さん の ところ へ どうぞ 。', 'Found {p.enAt}: {i.en}. The owner can collect it from Fumita-san at the library.'],
    ask: ['お[知|し]らせ に よる と 、 {p.n} で [何|なに] が [見|み]つかりました か ？', 'According to the small ads, what was found {p.enAt}?'] },
  tf: [['[正|ただ]しい', 'True'], ['[正|ただ]しくない', 'False'], ['[書|か]いて いない', 'Not said']],
  editions: [
    // ============================================================ No. 1 (B1): Alba's first Tanabata, a hundred new books, a broken bench
    { id: 'ja.p1', n: 1, band: 3,
      lead: { head: ['アルバ で はじめて の [七夕|たなばた]', 'Alba’s first Tanabata star festival'], by: ['[記者|きしゃ] [水野|みずの] [美里|みさと]', 'By reporter Misato Mizuno'], text: [
        ['[来週|らいしゅう] の [日曜日|にちようび] 、 アルバ の [広場|ひろば] で 、 はじめて の [七夕|たなばた] が あります 。 [広場|ひろば] に [大|おお]きな [竹|たけ] を [立|た]てて 、 みんな の [願|ねが]い を [飾|かざ]ります 。', 'Next Sunday, Alba’s square will hold its first Tanabata. A big bamboo will go up in the square, hung with everyone’s wishes.'],
        ['この [七夕|たなばた] を [考|かんが]えた の は 、 [元|もと] [小学校|しょうがっこう] の [先生|せんせい] の [星野|ほしの] さん です 。 「 [子|こ]ども の ころ 、 [七夕|たなばた] が いちばん [好|す]きでした 。 [星|ほし] に [願|ねが]い を [送|おく]る の は 、 すてき でしょう 」 と [話|はな]して います 。', 'The idea came from Hoshino-san, a retired primary school teacher. “Tanabata was my favorite day as a child. Sending a wish up to the stars is a lovely thing, isn’t it?” he says.'],
        ['[願|ねが]い は 、 [長|なが]い [色紙|いろがみ] に [書|か]きます 。 [紙|かみ] と ペン は 、 [今週|こんしゅう] から [図書館|としょかん] と パン[屋|や] に [置|お]いて あります 。 だれ でも 、 [何枚|なんまい] でも [書|か]けます 。', 'Wishes are written on long strips of colored paper. From this week, paper and pens are waiting at the library and the bakery. Anyone can write as many as they like.'],
        ['その [日|ひ] は 、 [夕方|ゆうがた] [五時|ごじ] から [竹|たけ] に [願|ねが]い を [飾|かざ]って 、 [夜|よる] は みんな で [星|ほし] を [見|み]ます 。 [雨|あめ] が [降|ふ]ったら 、 [竹|たけ] は [図書館|としょかん] の [中|なか] に [入|い]れます 。', 'On the day, the wishes go up on the bamboo from five in the evening, and at night everyone will look at the stars together. If it rains, the bamboo moves inside the library.'],
      ] },
      news: { head: ['[図書館|としょかん] に [新|あたら]しい [本|ほん] が [百冊|ひゃくさつ]', 'A hundred new books at the library'], text: [
        ['[今月|こんげつ] 、 アルバ の [図書館|としょかん] に 、 [新|あたら]しい [本|ほん] が [百冊|ひゃくさつ] [届|とど]きました 。 [町|まち] の [人|ひと] たち が 、 [家|いえ] で [読|よ]み[終|お]わった [本|ほん] を [持|も]って きて くれた の です 。', 'This month a hundred new books arrived at Alba’s library: townspeople brought in the books they had finished reading at home.'],
        ['「 [絵本|えほん] から [料理|りょうり] の [本|ほん] まで 、 いろいろ あります 。 [棚|たな] が たりなく なって 、 うれしい [問題|もんだい] です 」 と 、 [文田|ふみた] さん は [笑|わら]って います 。', '“There’s everything from picture books to cookbooks. We’ve run out of shelf space, which is a happy problem,” Fumita-san says with a laugh.'],
        ['[子|こ]ども は 、 [新|あたら]しい 「 [本|ほん] の ふくろ 」 で 、 [一度|いちど] に [五冊|ごさつ] まで [借|か]りられます 。 ふくろ は 、 [図書館|としょかん] で ただ で もらえます 。', 'With the new “book bag,” children can borrow up to five books at a time. The bags are free at the library.'],
      ] },
      letter: { head: ['[広場|ひろば] の ベンチ が こわれて います', 'The bench in the square is broken'], by: ['[村上|むらかみ] ハツ 、 [広場|ひろば] の [近|ちか]く に [住|す]む [八十二歳|はちじゅうにさい]', 'Hatsu Murakami, 82, who lives near the square'], text: [
        ['[新聞|しんぶん] の みなさん 、 こんにちは 。 [私|わたし] は [毎朝|まいあさ] 、 [広場|ひろば] まで [歩|ある]いて 、 [噴水|ふんすい] の [前|まえ] の ベンチ で [休|やす]みます 。 でも 、 [先月|せんげつ] から 、 その ベンチ の [足|あし] が [一本|いっぽん] こわれて います 。', 'Hello to everyone at the paper. Every morning I walk to the square and rest on the bench by the fountain. But since last month one of its legs has been broken.'],
        ['[座|すわ]る と ベンチ が [動|うご]いて 、 とても こわい です 。 [町役場|まちやくば] の かた 、 [早|はや]く [直|なお]して いただけません か 。 よろしく お[願|ねが]い します 。', 'When I sit down the bench rocks, and it’s very frightening. Could someone at the town hall please fix it soon? Thank you kindly.'],
      ] },
      column: { head: ['[今週|こんしゅう] の ことば ： 「 [梅雨|つゆ] 」', 'This week’s word: “tsuyu”'], by: ['[岡本|おかもと] ヨネ 、 [元|もと] [国語|こくご] の [先生|せんせい]', 'Yone Okamoto, a retired Japanese teacher'], text: [
        ['「 [梅雨|つゆ] 」 は 、 [夏|なつ] の [前|まえ] の 、 [長|なが]い [雨|あめ] の [季節|きせつ] です 。 [漢字|かんじ] で は 、 「 [梅|うめ] 」 と 「 [雨|あめ] 」 と [書|か]きます 。 [梅|うめ] が [大|おお]きく なる ころ に [降|ふ]る [雨|あめ] だ から です 。', '“Tsuyu” is the long rainy season before summer. It’s written with the characters for “plum” and “rain,” because it’s the rain that falls as the plums grow big.'],
        ['[雨|あめ] は いや だ と [言|い]う [人|ひと] も います が 、 [梅雨|つゆ] の [雨|あめ] が ない と 、 [田|た]んぼ も [畑|はたけ] も [困|こま]ります 。 かさ を さして 、 [雨|あめ] の [音|おと] を [楽|たの]しんで みましょう 。', 'Some people say they hate the rain, but without the tsuyu rain the rice paddies and fields would be in trouble. Open your umbrella and try enjoying the sound of the rain.'],
      ] },
      ads: [
        ['[折|お]り[紙|がみ] [教室|きょうしつ] 。 [毎週|まいしゅう] [水曜日|すいようび] の [午後|ごご] [三時|さんじ] から 、 [図書館|としょかん] の [二階|にかい] で 、 [丸山|まるやま] さん が [教|おし]えます 。 [紙|かみ] は ただ です 。', 'Origami class, Wednesdays from 3 p.m., upstairs at the library, taught by Maruyama-san. Paper is free.'],
        ['[青|あお]い [自転車|じてんしゃ] を [売|う]ります 。 かご つき で 、 ほとんど [新|あたら]しい です 。 コイン [三十枚|さんじゅうまい] 。 [市場|いちば] [通|どお]り の [四番|よんばん] へ 。', 'For sale: a blue bicycle with a basket, almost new. Thirty coins. Market Street, number 4.'],
        ['ボランティア [募集|ぼしゅう] ： [土曜日|どようび] に 、 [学校|がっこう] の かべ を ペンキ で ぬります 。 [終|お]わったら 、 みんな で おにぎり を [食|た]べます 。 [人|ひと] が [多|おお]い ほど 、 [早|はや]く [終|お]わります ！', 'Volunteers wanted to paint the school wall on Saturday. Afterwards, rice balls for everyone, eaten together. The more of us, the sooner we finish!'],
      ],
      items: [
        { type: 'mc', ask: ['[七夕|たなばた] は 、 どこ で あります か ？', 'Where will Tanabata be held?'], opts: [['アルバ の [広場|ひろば]', 'In Alba’s square'], ['[学校|がっこう] の [中|なか]', 'Inside the school'], ['[湖|みずうみ] の そば', 'By the lake']], key: 0, at: 0 },
        { type: 'short', ask: ['[星野|ほしの] さん は 、 [昔|むかし] [何|なん] の [仕事|しごと] を して いました か ？', 'What did Hoshino-san do before retiring?'], want: { lemmas: ['[先生|せんせい]', '[小学校|しょうがっこう]'] }, model: ['[小学校|しょうがっこう] の [先生|せんせい] でした 。', 'A primary school teacher.'], at: 1 },
        { type: 'tfn', ask: ['[子|こ]ども は 、 [一度|いちど] に [十冊|じゅっさつ] [借|か]りられます 。', 'Children can borrow ten books at a time.'], key: false, at: 6 },
        { type: 'mc', ask: ['「 [梅雨|つゆ] 」 は 、 どうして 「 [梅|うめ] 」 と [書|か]きます か ？', 'Why is “tsuyu” written with “plum”?'], opts: [['[梅|うめ] が [大|おお]きく なる ころ の [雨|あめ] だ から', 'It’s the rain of the season when plums grow big'], ['[梅|うめ] の [花|はな] は [雨|あめ] が きらい だ から', 'Plum blossoms hate rain'], ['[梅|うめ] は [雨|あめ] の [色|いろ] だ から', 'Plums are the color of rain']], key: 0, at: 9 },
      ] },
    // ============================================================ No. 2 (B1): three hundred wishes, the most-borrowed book, the bench mended
    { id: 'ja.p2', n: 2, band: 3,
      lead: { head: ['[七夕|たなばた] に [願|ねが]い が [三百枚|さんびゃくまい]', 'Three hundred wishes for Tanabata'], by: ['[記者|きしゃ] [水野|みずの] [美里|みさと]', 'By reporter Misato Mizuno'], text: [
        ['[日曜日|にちようび] の [七夕|たなばた] に は 、 [子|こ]ども から お[年寄|としよ]り まで 、 たくさん の [人|ひと] が [来|き]ました 。 [竹|たけ] に [飾|かざ]られた [願|ねが]い は 、 [全部|ぜんぶ] で [三百枚|さんびゃくまい] を [超|こ]えました 。', 'Sunday’s Tanabata drew a crowd, from little children to the very old. In all, more than three hundred wishes hung on the bamboo.'],
        ['いちばん [多|おお]かった [願|ねが]い は 、 「 [家族|かぞく] が [元気|げんき] で います よう に 」 でした 。 [二番目|にばんめ] は 、 「 テスト で いい [点|てん] が とれます よう に 」 。', 'The most common wish was “May my family stay well.” In second place: “May I get a good mark on my test.”'],
        ['[五歳|ごさい] の ユウナ ちゃん は 、 「 [猫|ねこ] に なれます よう に 」 と [書|か]きました 。 「 [猫|ねこ] は 、 [一日中|いちにちじゅう] [寝|ね]て いて いい から 」 だ そう です 。', 'Five-year-old Yuna wrote, “I wish I could be a cat.” “Because cats are allowed to sleep all day,” she explained.'],
        ['[残念|ざんねん] です が 、 [夜|よる] は [雨|あめ] で 、 [星|ほし] は [見|み]えません でした 。 でも [星野|ほしの] さん は 、 「 [雲|くも] の [上|うえ] で は 、 [星|ほし] は ちゃんと [光|ひか]って います よ 」 と [笑|わら]って いました 。 [来年|らいねん] も やる そう です 。', 'Sadly it rained that night, and nobody saw the stars. But Hoshino-san just laughed: “Above the clouds, the stars are shining all the same.” There’ll be another next year.'],
      ] },
      news: { head: ['[新|あたら]しい [本|ほん] で 、 いちばん [人気|にんき] は ？', 'Which new book is the most popular?'], text: [
        ['[先週|せんしゅう] [図書館|としょかん] に [届|とど]いた [百冊|ひゃくさつ] の [本|ほん] の [中|なか] で 、 いちばん [借|か]りられた の は 、 [恐竜|きょうりゅう] の [本|ほん] でした 。 [一週間|いっしゅうかん] で [九回|きゅうかい] も [借|か]りられました 。', 'Of the hundred books that came to the library last week, the most borrowed was a book about dinosaurs: nine loans in a single week.'],
        ['[二番目|にばんめ] は 、 [意外|いがい] に も 、 [古|ふる]い [料理|りょうり] の [本|ほん] です 。 「 [母|はは] の [味|あじ] を [思|おも]い[出|だ]した 」 と 、 [何人|なんにん] も の [人|ひと] が [言|い]って いた そう です 。', 'Second, surprisingly, was an old cookbook. Several people said it reminded them of their mother’s cooking.'],
        ['[本|ほん] の ふくろ は 、 もう [五十人|ごじゅうにん] [以上|いじょう] の [子|こ]ども が もらって いきました 。 [文田|ふみた] さん は 、 「 ふくろ が たりなく なりそう です 」 と うれしそう です 。', 'More than fifty children have already taken home a book bag. “We may run out of bags,” Fumita-san says happily.'],
      ] },
      letter: { head: ['ベンチ 、 ありがとう ！', 'Thank you for the bench!'], by: ['[村上|むらかみ] ハツ', 'Hatsu Murakami'], text: [
        ['[先週|せんしゅう] の [新聞|しんぶん] に 、 [広場|ひろば] の ベンチ の こと を [書|か]いた [村上|むらかみ] です 。 [新聞|しんぶん] が [出|で]た [次|つぎ] の [日|ひ] 、 [大工|だいく] さん が [来|き]て 、 すぐ に [直|なお]して くれました 。', 'This is Murakami, who wrote about the bench in the square in last week’s paper. The day after the paper came out, a carpenter came and fixed it straight away.'],
        ['その うえ 、 [近所|きんじょ] の [子|こ]ども たち が 、 ベンチ に [花|はな] の [絵|え] を かいて くれました 。 [今|いま] で は 、 アルバ で いちばん きれい な ベンチ です 。 みなさん 、 ほんとう に ありがとう 。', 'On top of that, the neighborhood children painted flowers on it. Now it’s the prettiest bench in Alba. Thank you all, truly.'],
      ] },
      column: { head: ['[文田|ふみた] さん の おすすめ の [本|ほん]', 'Fumita-san’s book pick'], by: ['[文田|ふみた] 、 アルバ [図書館|としょかん]', 'Fumita, Alba library'], text: [
        ['[今週|こんしゅう] の おすすめ は 、 [日本|にほん] の [昔話|むかしばなし] 「 つる の おんがえし 」 です 。 [貧|まず]しい おじいさん が 、 わな に かかった つる を [助|たす]けます 。 すると 、 ある [雪|ゆき] の [夜|よる] 、 [若|わか]い [娘|むすめ] が [家|いえ] に やって [来|き]ます 。', 'This week’s pick is the Japanese folk tale «The Crane’s Return of a Favor». A poor old man frees a crane caught in a trap. Then one snowy night, a young woman comes to his house.'],
        ['[娘|むすめ] は 、 「 [部屋|へや] で [布|ぬの] を [作|つく]って いる [間|あいだ] 、 [絶対|ぜったい] に [見|み]ないで ください 」 と [言|い]います 。 [約束|やくそく] を [守|まも]る の は 、 どうして こんな に むずかしい の でしょう 。 [短|みじか]い お[話|はなし] です が 、 [大人|おとな] に も おすすめ です 。 [図書館|としょかん] に [三冊|さんさつ] あります 。', 'She says, “While I make cloth in that room, you must never look in.” Why is keeping a promise so hard? It’s a short story, but I recommend it for grown-ups too. The library has three copies.'],
      ] },
      ads: [
        ['[猫|ねこ] の お[世話|せわ] を します 。 [旅行|りょこう] の [間|あいだ] 、 [毎日|まいにち] ごはん と [水|みず] を あげ に [行|い]きます 。 [一日|いちにち] コイン [二枚|にまい] 。 [市場|いちば] [通|どお]り の [七番|ななばん] へ 。', 'Cat-sitting: while you travel, I’ll come every day with food and water. Two coins a day. Market Street, number 7.'],
        ['[古|ふる]い ピアノ を ゆずります 。 ただ です が 、 [運|はこ]ぶ [人|ひと] は [自分|じぶん] で [探|さが]して ください 。 [音|おと] は 、 まだ [少|すこ]し きれい です 。', 'Old piano free to a good home. It costs nothing, but you’ll need to find your own movers. It still sounds a little bit nice.'],
        ['[七夕|たなばた] の [竹|たけ] の [片付|かたづ]け を [手伝|てつだ]って くれる [人|ひと] は 、 [土曜日|どようび] の [朝|あさ] [九時|くじ] に [広場|ひろば] へ 。 [星野|ほしの] より 。', 'Anyone who can help take down the Tanabata bamboo: Saturday, 9 a.m., in the square. —Hoshino'],
      ],
      items: [
        { type: 'short', ask: ['[竹|たけ] の [願|ねが]い は 、 [全部|ぜんぶ] で [何枚|なんまい] [以上|いじょう] でした か ？', 'How many wishes were on the bamboo, at least?'], want: { number: 300, numberWords: ['[三百|さんびゃく]', 'さんびゃくまい'] }, model: ['[三百枚|さんびゃくまい] [以上|いじょう] でした 。', 'More than three hundred.'], at: 0 },
        { type: 'mc', ask: ['ユウナ ちゃん は 、 どんな [願|ねが]い を [書|か]きました か ？', 'What wish did Yuna write?'], opts: [['[猫|ねこ] に なりたい', 'To become a cat'], ['テスト で いい [点|てん] を とりたい', 'A good test mark'], ['[家族|かぞく] が [元気|げんき] で いて ほしい', 'For her family to stay well']], key: 0, at: 2 },
        { type: 'tfn', ask: ['[七夕|たなばた] の [夜|よる] は 、 [星|ほし] が よく [見|み]えました 。', 'The stars were clearly visible on the night of Tanabata.'], key: false, at: 3 },
        { type: 'mc', ask: ['[広場|ひろば] の ベンチ は 、 [今|いま] どう なって います か ？', 'What is the bench in the square like now?'], opts: [['もう [動|うご]かない し 、 [花|はな] の [絵|え] が ある', 'Fixed, with flowers painted on it'], ['まだ こわれて いる', 'Still broken'], ['[新|あたら]しい ベンチ に なった', 'Replaced with a new one']], key: 0, at: 8 },
      ] },
    // ============================================================ No. 3 (B2): a roof over Market Street?, radio exercises, the swallows
    { id: 'ja.p3', n: 3, band: 4,
      lead: { head: ['[市場|いちば] [通|どお]り に [屋根|やね] を ？ [町|まち] で [話|はな]し[合|あ]い', 'A roof over Market Street? The town talks it over'], by: ['[記者|きしゃ] [水野|みずの] [美里|みさと]', 'By reporter Misato Mizuno'], text: [
        ['[町役場|まちやくば] は [今週|こんしゅう] 、 [市場|いちば] [通|どお]り の [上|うえ] に [長|なが]い [屋根|やね] を つける 、 と いう [計画|けいかく] を [出|だ]しました 。 [雨|あめ] の [日|ひ] でも 、 かさ なし で [買|か]い[物|もの] が できる よう に する ため です 。', 'This week the town hall put forward a plan for a long roof over Market Street, so that people can shop without an umbrella even on rainy days.'],
        ['[野菜|やさい] を [売|う]って いる [島田|しまだ] さん は 、 [賛成|さんせい] です 。 「 [梅雨|つゆ] の [間|あいだ] は 、 お[客|きゃく]さん が [半分|はんぶん] に なります 。 [屋根|やね] が あれば 、 [雨|あめ] の [日|ひ] も [通|とお]り が にぎやか に なる でしょう 」 。', 'Shimada-san, who sells vegetables, is in favor. “During the rainy season we lose half our customers. With a roof, the street would be lively on rainy days too.”'],
        ['でも 、 [心配|しんぱい] する [声|こえ] も あります 。 [市場|いちば] [通|どお]り の お[店|みせ] の [屋根|やね] の [下|した] に は 、 [毎年|まいとし] つばめ が [巣|す] を [作|つく]ります 。 [長|なが]い [屋根|やね] が できたら 、 つばめ は もう [来|こ]ない かも しれません 。', 'But there are worried voices too. Every year swallows nest under the eaves of the shops on Market Street. If a long roof goes up, the swallows may not come back.'],
        ['[木曜日|もくようび] の [夜|よる] 、 [町役場|まちやくば] で [町|まち] の [人|ひと] の [集|あつ]まり が あります 。 だれ でも [意見|いけん] を [言|い]えます 。 [子|こ]ども の [意見|いけん] も 、 ぜひ [聞|き]きたい そう です 。', 'On Thursday evening there will be a residents’ meeting at the town hall. Anyone can speak, and they say they’d very much like to hear from children too.'],
      ] },
      news: { head: ['[朝|あさ] の ラジオ [体操|たいそう] 、 [始|はじ]まる', 'Morning radio exercises begin'], text: [
        ['[夏休|なつやす]み の [間|あいだ] 、 [毎朝|まいあさ] [六時半|ろくじはん] から 、 [広場|ひろば] で ラジオ [体操|たいそう] を します 。 ラジオ アルバ が 、 [体操|たいそう] の [音楽|おんがく] を [流|なが]して くれます 。', 'All through the summer holidays there will be radio exercises in the square every morning from six-thirty. Radio Alba will play the exercise music.'],
        ['[来|き]た [子|こ]ども は 、 カード に スタンプ を もらえます 。 [休|やす]まず に [全部|ぜんぶ] [来|き]た [子|こ]ども に は 、 [最後|さいご] の [日|ひ] に [小|ちい]さな プレゼント が あります 。', 'Children who come get a stamp on their card. Those who don’t miss a single day get a small present on the last day.'],
        ['[大人|おとな] も 、 もちろん [参加|さんか] できます 。 [一日目|いちにちめ] の [今朝|けさ] は 、 [四十人|よんじゅうにん] が [集|あつ]まりました 。 いちばん [元気|げんき] だった の は 、 [九十歳|きゅうじゅっさい] の [栄吉|えいきち] さん でした 。', 'Grown-ups can of course join in. This morning, the first day, forty people came. The liveliest of all was Eikichi-san, who is ninety.'],
      ] },
      letter: { head: ['つばめ の [巣|す] は [二十三|にじゅうさん]', 'Twenty-three swallows’ nests'], by: ['ミナミ 、 [十二歳|じゅうにさい]', 'Minami, 12'], text: [
        ['[私|わたし] は [三年前|さんねんまえ] から 、 [毎年|まいとし] [市場|いちば] [通|どお]り の つばめ の [巣|す] を [数|かぞ]えて います 。 [今年|ことし] は [二十三|にじゅうさん] [個|こ] ありました 。 [去年|きょねん] より 、 [三|みっ]つ [増|ふ]えました 。', 'For three years now I’ve counted the swallows’ nests on Market Street every year. This year there were twenty-three, three more than last year.'],
        ['[屋根|やね] が あれば 、 [雨|あめ] の [日|ひ] は [便利|べんり] だ と [思|おも]います 。 でも 、 つばめ の [家|いえ] が なくなる の は 、 かなしい です 。 どちら も [守|まも]る [方法|ほうほう] は 、 ない の でしょう か 。', 'I think a roof would be handy on rainy days. But it would be sad if the swallows lost their homes. Isn’t there some way to protect both?'],
      ] },
      column: { head: ['[夏|なつ] を すずしく すごす [知恵|ちえ]', 'Old wisdom for a cool summer'], by: ['[岡本|おかもと] ヨネ', 'Yone Okamoto'], text: [
        ['[昔|むかし] の [人|ひと] は 、 [機械|きかい] を [使|つか]わず に 、 [夏|なつ] を すずしく すごして いました 。 たとえば 、 [夕方|ゆうがた] に [家|いえ] の [前|まえ] の [道|みち] に [水|みず] を まく 、 「 [打|う]ち[水|みず] 」 。 [水|みず] が [消|き]える とき に 、 まわり の [空気|くうき] が [冷|ひ]える の です 。', 'Long ago people kept cool in summer without machines. Take “uchimizu”: sprinkling water on the road outside the house in the evening. As the water dries up, the air around it cools.'],
        ['それ から 、 [窓|まど] に [風鈴|ふうりん] を つるす の も おすすめ です 。 きれい な [音|おと] を [聞|き]く と 、 [体|からだ] より [先|さき] に 、 [心|こころ] が すずしく なります 。 [今年|ことし] の [夏|なつ] は 、 ぜひ [試|ため]して みて ください 。', 'Hanging a wind chime in the window is another good one. Hear its pretty sound, and your heart cools down before your body does. Do give it a try this summer.'],
      ] },
      ads: [
        ['ゆかた の [着方|きかた] を [教|おし]えます 。 [一回|いっかい] コイン [五枚|ごまい] 。 [土曜日|どようび] の [午後|ごご] 、 [町役場|まちやくば] の [会議室|かいぎしつ] で 。 ゆかた が ない [人|ひと] に は 、 [貸|か]します 。', 'Learn to put on a yukata: five coins a session, Saturday afternoons in the town hall meeting room. Yukatas lent to anyone without one.'],
        ['[子|こ]ども の [自転車|じてんしゃ] を [探|さが]して います 。 [小|ちい]さく なった [自転車|じてんしゃ] が あったら 、 ゆずって ください 。 [手作|てづく]り の ジャム と [交換|こうかん] します 。', 'Wanted: a child’s bicycle. If yours has been outgrown, I’ll swap it for homemade jam.'],
        ['ラジオ [体操|たいそう] の スタンプ カード は 、 [広場|ひろば] で [毎朝|まいあさ] もらえます 。 [名前|なまえ] を [書|か]いて 、 [毎日|まいにち] [持|も]って きて ください 。', 'Radio exercise stamp cards are handed out in the square every morning. Write your name on yours and bring it every day.'],
      ],
      items: [
        { type: 'mc', ask: ['[町役場|まちやくば] は 、 [市場|いちば] [通|どお]り に [何|なに] を つけたい の です か ？', 'What does the town hall want to put over Market Street?'], opts: [['[長|なが]い [屋根|やね]', 'A long roof'], ['[新|あたら]しい [信号|しんごう]', 'New traffic lights'], ['[大|おお]きな [時計|とけい]', 'A big clock']], key: 0, at: 0 },
        { type: 'short', ask: ['[屋根|やね] が できたら 、 [何|なに] が [来|こ]なく なる かも しれません か ？', 'What might stop coming if the roof is built?'], want: { lemmas: ['つばめ'] }, model: ['つばめ が [来|こ]なく なる かも しれません 。', 'The swallows might stop coming.'], at: 2 },
        { type: 'tfn', ask: ['ラジオ [体操|たいそう] に は 、 [大人|おとな] は [参加|さんか] できません 。', 'Grown-ups can’t join the radio exercises.'], key: false, at: 6 },
        { type: 'mc', ask: ['「 [打|う]ち[水|みず] 」 で は 、 [何|なに] を します か ？', 'What do you do for “uchimizu”?'], opts: [['[道|みち] に [水|みず] を まく', 'Sprinkle water on the road'], ['[窓|まど] を [全部|ぜんぶ] [閉|し]める', 'Close every window'], ['[冷|つめ]たい お[茶|ちゃ] を [飲|の]む', 'Drink cold tea']], key: 0, at: 9 },
      ] },
    // ============================================================ No. 4 (B2): «swallow windows», ninety and never missed a day, a vegetable seller's change of heart
    { id: 'ja.p4', n: 4, band: 4,
      lead: { head: ['[決|き]まりました ： [屋根|やね] に 「 つばめ の [窓|まど] 」', 'Decided: the roof gets “swallow windows”'], by: ['[記者|きしゃ] [水野|みずの] [美里|みさと]', 'By reporter Misato Mizuno'], text: [
        ['[木曜日|もくようび] の [集|あつ]まり は 、 [三時間|さんじかん] [近|ちか]く つづきました 。 [最後|さいご] に 、 みんな が [賛成|さんせい] できる [答|こた]え が [見|み]つかりました 。 [屋根|やね] は つくります が 、 つばめ の [巣|す] の ある ところ に は 、 [穴|あな] を [開|あ]けて おく の です 。', 'Thursday’s meeting went on for nearly three hours. In the end they found an answer everyone could agree to: the roof will be built, but with openings left wherever there are swallows’ nests.'],
        ['この アイデア を [出|だ]した の は 、 この [新聞|しんぶん] に [手紙|てがみ] を [書|か]いた 、 [十二歳|じゅうにさい] の ミナミ さん です 。 ミナミ さん は 、 [自分|じぶん] で かいた [巣|す] の [地図|ちず] を [持|も]って 、 [集|あつ]まり で [話|はな]しました 。', 'The idea came from Minami, 12, who had written to this paper. She brought a map of the nests she had drawn herself and spoke at the meeting.'],
        ['[会場|かいじょう] から は 、 [大|おお]きな [拍手|はくしゅ] が [起|お]こりました 。 [野菜|やさい] を [売|う]って いる [島田|しまだ] さん も 、 「 これ なら 、 お[客|きゃく]さん も つばめ も 、 [雨|あめ] に ぬれません ね 」 と うれしそう でした 。', 'The hall broke into loud applause. Shimada-san the vegetable seller was delighted too: “This way neither the customers nor the swallows get wet.”'],
        ['[屋根|やね] を つくる の は 、 つばめ が [南|みなみ] へ [帰|かえ]った あと の 、 [秋|あき] から です 。 [穴|あな] の [形|かたち] は 、 [町|まち] の [子|こ]ども たち が [考|かんが]える そう です 。', 'Work on the roof starts in autumn, after the swallows have flown south. The town’s children will design the shape of the openings.'],
      ] },
      news: { head: ['[一日|いちにち] も [休|やす]まない [九十歳|きゅうじゅっさい]', 'Ninety and hasn’t missed a day'], text: [
        ['[広場|ひろば] の ラジオ [体操|たいそう] は 、 [三週目|さんしゅうめ] に [入|はい]りました 。 [毎朝|まいあさ] 、 [五十人|ごじゅうにん] ぐらい の [人|ひと] が [集|あつ]まって います 。', 'The radio exercises in the square are now in their third week, with around fifty people coming every morning.'],
        ['その [中|なか] で 、 まだ [一日|いちにち] も [休|やす]んで いない [大人|おとな] が 、 [一人|ひとり] だけ います 。 [九十歳|きゅうじゅっさい] の [栄吉|えいきち] さん です 。 「 [体|からだ] を [動|うご]かす と 、 [朝|あさ] ごはん が おいしく なる ん だ よ 」 と [話|はな]して います 。', 'Among them, just one grown-up hasn’t missed a single day: Eikichi-san, who is ninety. “Moving your body makes breakfast taste better,” he says.'],
        ['[栄吉|えいきち] さん の スタンプ カード を [見|み]た [子|こ]ども たち は 、 「 [負|ま]けない ぞ 」 と 、 [前|まえ] より も [早|はや]く [来|く]る よう に なりました 。 ラジオ アルバ は 、 [最後|さいご] の [日|ひ] に [特別|とくべつ] な [音楽|おんがく] を [流|なが]す そう です 。', 'When the children saw Eikichi-san’s stamp card, they vowed not to be beaten and started arriving earlier. Radio Alba says it will play special music on the last day.'],
      ] },
      letter: { head: ['つばめ を [守|まも]って くれて 、 ありがとう', 'Thank you for protecting the swallows'], by: ['[島田|しまだ] 、 [市場|いちば] [通|どお]り で [野菜|やさい] を [売|う]って います', 'Shimada, vegetable seller on Market Street'], text: [
        ['[正直|しょうじき] に [言|い]う と 、 [私|わたし] は はじめ 、 つばめ の こと を あまり [考|かんが]えて いません でした 。 お[店|みせ] の [前|まえ] が [汚|よご]れる ので 、 [少|すこ]し [困|こま]って いた くらい です 。', 'To be honest, at first I hardly gave the swallows a thought. If anything, I was a little annoyed that they made a mess outside my shop.'],
        ['でも 、 ミナミ さん の [地図|ちず] を [見|み]て 、 [気持|きも]ち が [変|か]わりました 。 [二十三|にじゅうさん] の [家族|かぞく] が 、 [毎年|まいとし] [私|わたし] たち の [通|とお]り に [帰|かえ]って くる の です 。 [今|いま] は [巣|す] の [下|した] に [板|いた] を つけて 、 [毎朝|まいあさ] ひな を [見|み]る の が [楽|たの]しみ です 。', 'But Minami’s map changed my mind. Twenty-three families come back to our street every year. Now I’ve put a board under the nest, and watching the chicks every morning is my joy.'],
      ] },
      column: { head: ['[文田|ふみた] さん の おすすめ の [本|ほん]', 'Fumita-san’s book pick'], by: ['[文田|ふみた] 、 アルバ [図書館|としょかん]', 'Fumita, Alba library'], text: [
        ['[夏|なつ] の おすすめ は 、 [昔話|むかしばなし] の 「 [浦島太郎|うらしまたろう] 」 です 。 [若|わか]い [漁師|りょうし] が 、 [海|うみ] の そば で こまって いた [亀|かめ] を [助|たす]けます 。 [助|たす]けて もらった [亀|かめ] は 、 [漁師|りょうし] を [海|うみ] の [底|そこ] の [美|うつく]しい お[城|しろ] へ [連|つ]れて [行|い]きます 。', 'My summer pick is the folk tale «Urashima Taro». A young fisherman helps a turtle in trouble by the sea. To thank him, the turtle takes him to a beautiful palace at the bottom of the sea.'],
        ['でも 、 [楽|たの]しい [時間|じかん] は すぐ に [過|す]ぎます 。 [家|いえ] に [帰|かえ]る と 、 [何|なに] もかも が [変|か]わって いました 。 [時間|じかん] の [大切|たいせつ]さ を 、 [静|しず]か に [教|おし]えて くれる お[話|はなし] です 。 [図書館|としょかん] に は 、 [絵本|えほん] と [大人|おとな] [向|む]け の [本|ほん] が あります 。', 'But happy times pass quickly. When he returns home, everything has changed. It’s a story that quietly teaches how precious time is. The library has a picture-book version and one for grown-ups.'],
      ] },
      ads: [
        ['いなく なった オウム を [探|さが]して います 。 [黄色|きいろ] で 、 「 おはよう 」 と [言|い]えます 。 [見|み]かけたら 、 [図書館|としょかん] まで [知|し]らせて ください 。', 'Looking for a lost parrot. It’s yellow and can say “Good morning.” If you see it, please let the library know.'],
        ['すいか [割|わ]り [大会|たいかい] ！ [土曜日|どようび] の [午後|ごご] 、 [学校|がっこう] の [庭|にわ] で 。 [目|め] かくし は [用意|ようい] します 。 [割|わ]れた すいか は 、 みんな で [食|た]べます 。', 'Watermelon-splitting contest! Saturday afternoon in the school grounds. Blindfolds provided. We eat the split watermelons together.'],
        ['[市場|いちば] [通|どお]り の [屋根|やね] の 「 つばめ の [窓|まど] 」 の 、 [形|かたち] の アイデア を [募集|ぼしゅう] します 。 [絵|え] を かいて 、 [町役場|まちやくば] の [箱|はこ] へ 。 しめきり は [八月|はちがつ] [三十一日|さんじゅういちにち] です 。', 'Ideas wanted for the shape of the “swallow windows” in the Market Street roof. Draw a picture and drop it in the box at the town hall. Deadline: 31 August.'],
      ],
      items: [
        { type: 'mc', ask: ['[屋根|やね] は 、 どう する こと に なりました か ？', 'What was decided about the roof?'], opts: [['つばめ の [巣|す] の ところ に [穴|あな] を [開|あ]けて つくる', 'Build it, with openings where the nests are'], ['つくらない', 'Not build it at all'], ['[巣|す] を [全部|ぜんぶ] [動|うご]かして から つくる', 'Move all the nests, then build it']], key: 0, at: 0 },
        { type: 'short', ask: ['ミナミ さん は 、 [集|あつ]まり に [何|なに] を [持|も]って [行|い]きました か ？', 'What did Minami bring to the meeting?'], want: { lemmas: ['[地図|ちず]'] }, model: ['[自分|じぶん] で かいた [巣|す] の [地図|ちず] を [持|も]って [行|い]きました 。', 'A map of the nests she had drawn herself.'], at: 1 },
        { type: 'tfn', ask: ['[栄吉|えいきち] さん は 、 ラジオ [体操|たいそう] を [一日|いちにち] も [休|やす]んで いません 。', 'Eikichi-san hasn’t missed a single day of radio exercises.'], key: true, at: 5 },
        { type: 'mc', ask: ['「 [浦島太郎|うらしまたろう] 」 で 、 [亀|かめ] は [漁師|りょうし] を どこ へ [連|つ]れて [行|い]きます か ？', 'In «Urashima Taro», where does the turtle take the fisherman?'], opts: [['[海|うみ] の [底|そこ] の お[城|しろ]', 'A palace at the bottom of the sea'], ['[山|やま] の [上|うえ] の [寺|てら]', 'A temple on a mountain'], ['[月|つき] の [上|うえ]', 'The moon']], key: 0, at: 9 },
      ] },
  ],
});
