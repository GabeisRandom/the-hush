'use strict';
// Free talk in Japanese (ja): standard Japanese in the CJK.md notation ([漢字|かんじ], okurigana outside, particles as their own
// tokens), written natively at each band (A1 ≈ JLPT N5 … B2 ≈ N2). It follows content_es.js's shape (TALK.md), never its words.
// Adults in town speak politely (です / ます) to you; kids and close friends talk casually. Rosa keeps です / ます for ranks 1–2;
// at rank 3 she suggests dropping 敬語 between you, and from then on she talks casually (an older lady's casual: …わ, …のよ,
// …かしら). Your answers may be polite or plain; mixing the two in one answer is only a small slip (the pack's 'polite' check).
// Never genders the player (no 彼 / 彼女 about you, nothing gendered in the models). PG, no alcohol (tea, barley tea, juice).
// ja in talk.js: {echo} is only ever the word that answered (its dictionary form), and {f.key.past} / {f.key.you} are never
// filled, so plans and stories are remembered as 'text' (your sentence, said right) and quoted back in 「」.
//   Rosa: ranks 1–5 (A1 → B2) · the librarian 文田さん: ranks 1–3 · small talk: three scenes each at A1, A2 and B1
//   «ぴよ» (the phone): Rosa's first texts, the neighbors' group, and the 町内会's festival group (Natsu, Tetsu, Shige, Otoha)
//   Bruno, Marta, Bartolo and Cande: ranks 1–3
// the words a reaction can look for: a word by its dictionary form (the pack's lemma in characters, whichever way it was typed)
const JA_TALK = (() => {
  const key = w => String((typeof CJK !== 'undefined' ? CJK.chars(w.lemma || w.t || '', { lang: 'ja' }) : (w.lemma || w.t || ''))).replace(/\s+/g, '');
  const said = (r, ...ls) => ((r && r.a && r.a.words) || []).some(w => !w.punct && ls.includes(key(w)));
  // «いちごが好き。でも、バナナは好きじゃない»: a no that isn't all no
  const mixed = r => said(r, 'でも', 'けど', 'けれど', 'けれども', 'しかし');
  // keep(key, who): a reaction (put it first) that never fires, but remembers your sentence, said right, in the notation, so it
  // reads well in both modes when it's quoted back («{f.plan}») and on the journal's People page. (talk.js's 'text' facts are
  // plain text in the mode you typed in, which romanizes badly inside a line.)
  const srcOf = r => (r && r.a ? (r.a.fixedSrc || (r.a.words || []).map(w => w.src || w.t).filter(Boolean).join(' ')) : '');
  const keep = (key, who) => ({ if: { test: r => {
    try {
      const v = r && r.understood && !r.gaveUp ? srcOf(r).replace(/\s+/g, ' ').trim() : '';
      if (v && (typeof CJK === 'undefined' || !CJK.validate(v, 'ja').length)) TALK.state.facts[key] = { v, who, at: Math.round((TALK.game && TALK.game.state && TALK.game.state.time) || 0), lang: 'ja' };
    } catch (e) { /* (never in the way of the talk) */ }
    return false;
  } }, say: [['…', '(never said: it only remembers)']] });
  return { said, mixed, keep };
})();
(() => {
  if (typeof TALK === 'undefined') return;
  const { mixed } = JA_TALK;

  // ============================================================ Rosa, rank 1 (A1): getting to know each other
  const FEEL = ['元気', 'いい', '良い', '楽しい', 'まあまあ', '疲れる', '眠い', '忙しい', '嬉しい', '悲しい', '寂しい', '大丈夫', '暇', '最高', '病気', '風邪',
    'お腹', '普通', '幸せ', 'つまらない', '痛い', '怖い', '不安', '緊張する', '退屈', '最低'];
  const FRUIT = ['りんご', 'バナナ', 'みかん', 'オレンジ', '梨', 'いちご', 'ぶどう', 'すいか', '桃', '柿', 'メロン', 'レモン', 'さくらんぼ', 'マンゴー', 'パイナップル', '果物'];
  const rosa1 = {
    id: 'rosa.1', who: 'rosa', band: 1, title: { en: 'Getting to know each other' },
    open: [['あら 、 また [来|き]て くれた ん です ね ！ うれしい です 。', 'Oh, you came back! I’m so glad.']],
    turns: [
      { id: 'how', goal: 'Tell her how you are today.',
        ask: ['[今日|きょう] は お[元気|げんき] です か ？', 'How are you today?'],
        simpler: ['[元気|げんき] です か ？ [疲|つか]れて います か ？', 'Are you well? Are you tired?'],
        want: { topic: 'feeling', lemmas: FEEL },
        starter: ['___ です 。', 'I’m ___.'],
        example: ['はい 、 [元気|げんき] です 。 ロサ さん は ？', 'Yes, I’m well. And you, Rosa?'],
        model: ['[元気|げんき] です 。', 'I’m well.'],
        remember: { mood: 'match' },
        react: [
          { if: { question: true, val: '-' }, say: [['あら 、 それ は いけません ね 。 わたし ？ わたし は [元気|げんき] です よ 。 はい 、 りんご を どうぞ 。 [元気|げんき] が [出|で]ます よ 。', 'Oh, that’s no good. Me? I’m fine. Here, have an apple. It’ll perk you up.']], mood: 'sad' },
          { if: { question: true }, say: [['おかげさま で 、 [元気|げんき] です よ 。 [聞|き]いて くれて 、 ありがとう 。 [今日|きょう] は りんご が たくさん [売|う]れました 。', 'I’m well, thank you (“thanks to you”). Thanks for asking. I sold lots of apples today.']], mood: 'happy' },
          { if: { val: '-' }, say: [['あら 、 [大丈夫|だいじょうぶ] です か ？ はい 、 りんご を どうぞ 。 りんご は [元気|げんき] の もと です よ 。', 'Oh dear, are you all right? Here, have an apple. Apples are where good health comes from.']], mood: 'sad' },
          { if: { val: '+' }, say: [['よかった ！ それ が [一番|いちばん] です 。', 'Good! That’s what matters most.']], mood: 'happy' },
          { say: [['そう です か 。 まあ 、 ゆっくり して いって ください ね 。', 'I see. Well, do stay a while.']] },
        ] },
      { id: 'from', goal: 'Tell her where you’re from (a country, a town, or just “far away”).',
        ask: ['あなた は 、 この あたり の [人|ひと] じゃ ない です よ ね 。 どこ から [来|き]ました か ？', 'You’re not from around here, are you? Where did you come from?'],
        simpler: ['どこ から [来|き]ました か ？ [国|くに] は どこ です か ？', 'Where did you come from? What country?'],
        want: { name: true, topic: 'place', lemmas: ['国', '町', '遠い', '外国', '村', '田舎', '都会', '島', '山', '海', '北', '南', '東', '西', '出身'] },
        starter: ['___ から [来|き]ました 。', 'I came from ___.'],
        example: ['アメリカ から [来|き]ました 。 [海|うみ] の [近|ちか]く の [小|ちい]さい [町|まち] です 。', 'I came from America. A little town near the sea.'],
        model: ['[遠|とお]い [国|くに] から [来|き]ました 。', 'I came from a faraway country.'],
        react: [
          { if: { name: true }, remember: { home: 'name' }, say: [['まあ 、 そんな [遠|とお]く から ！ ノア も 、 いつも 「 [遠|とお]く へ [行|い]きたい 」 と [言|い]って いました 。', 'My, from so far away! Noa always used to say “I want to go somewhere far away.”']], mood: 'surprised' },
          { if: { lemmas: ['遠い', '外国'] }, remember: { home: 'match' }, say: [['[遠|とお]い ところ から 、 よく [来|き]ました ね 。 [疲|つか]れた でしょう 。', 'You came all that way. You must be tired.']], mood: 'surprised' },
          { remember: { home: 'match' }, say: [['そう です か 。 ようこそ 、 アルバ へ ！ ノア も 、 [知|し]らない [場所|ばしょ] の [話|はなし] が [大好|だいす]き でした 。', 'I see. Welcome to Alba! Noa loved hearing about places she didn’t know, too.']] },
        ] },
      { id: 'fruit', goal: 'Tell her which fruit you like (or that you don’t like fruit).',
        ask: ['わたし は [果物|くだもの] を [売|う]って います 。 どんな [果物|くだもの] が [好|す]き です か ？', 'I sell fruit. What kind of fruit do you like?'],
        simpler: ['りんご ？ みかん ？ どの [果物|くだもの] が [好|す]き です か ？', 'Apples? Mandarins? Which fruit do you like?'],
        want: { topic: 'food', lemmas: FRUIT },
        starter: ['___ が [好|す]き です 。', 'I like ___.'],
        example: ['いちご が [大好|だいす]き です 。 でも 、 バナナ は あまり [好|す]き じゃ ない です 。', 'I love strawberries. But I don’t really like bananas.'],
        model: ['りんご が [好|す]き です 。', 'I like apples.'],
        remember: { fruit: 'match' },
        react: [
          { if: { lemmas: ['りんご'], neg: false }, say: [['りんご ！ うち の りんご は 、 アルバ で [一番|いちばん] [甘|あま]い ん です よ 。', 'Apples! Mine are the sweetest in all of Alba, you know.']], mood: 'happy' },
          { if: { lemmas: ['みかん'], neg: false }, say: [['みかん ！ [冬|ふゆ] は 、 こたつ で みかん が [一番|いちばん] です ね 。', 'Mandarins! In winter, mandarins at the kotatsu are the best, aren’t they.']], mood: 'happy' },
          { if: { neg: true, nofact: 'fruitNo', test: r => !mixed(r) }, fact: { fruitNo: 'yes' }, say: [['えっ 、 [果物|くだもの] が [好|す]き じゃ ない ん です か ？ あら まあ … 。 じゃあ 、 マルタ さん の パン は どう です か ？', 'What, you don’t like fruit? Oh my… Well then, how about Marta’s bread?']], mood: 'surprised' },
          { say: [['{echo|いい です ね ！} わたし も [大好|だいす]き です 。 [今度|こんど] 、 [一番|いちばん] いい の を とって おきます ね 。', '{echo|Lovely!} I love those too. Next time I’ll keep the best one for you.']], mood: 'happy' },
        ] },
      { id: 'mimo', goal: 'Tell her what {mimo} likes to eat.',
        ask: ['それ で 、 {mimo} ちゃん は 、 [何|なに] を [食|た]べる の が [好|す]き です か ？', 'And {mimo}? What does it like to eat?'],
        simpler: ['{mimo} ちゃん は [何|なに] を [食|た]べます か ？ りんご ？ パン ？', 'What does {mimo} eat? Apples? Bread?'],
        want: { topic: 'food', lemmas: FRUIT.concat(['パン', 'チーズ', 'クッキー', 'はちみつ', '言葉', '全部', '何']) },
        starter: ['___ が [好|す]き です 。', 'It likes ___.'],
        example: ['りんご が [大好|だいす]き です 。 でも 、 にんじん は [食|た]べません 。', 'It loves apples. But it won’t eat carrots.'],
        model: ['パン が [好|す]き です 。', 'It likes bread.'],
        remember: { mimoFood: 'match' },
        react: [
          { if: { lemmas: ['言葉'] }, say: [['[言葉|ことば] ？ ふふ 、 おもしろい [子|こ] です ね 。 じゃあ 、 たくさん [話|はな]して あげて ください 。', 'Words? Hehe, what a funny little one. Then talk to it a lot.']], mood: 'happy' },
          { if: { lemmas: ['全部', '何'] }, say: [['ふふ 、 [見|み]れば わかります 。 まるい お[腹|なか] です もの ね 。', 'Hehe, I can tell just by looking. Such a round little tummy.']], mood: 'happy' },
          { say: [['{echo|まあ ！} {mimo} ちゃん は グルメ です ね 。', '{echo|My!} {mimo} is quite the gourmet.']], mood: 'happy' },
        ] },
      { id: 'alba', goal: 'Do you like Alba? Say so, and why if you can («…から»).',
        ask: ['アルバ に は 、 もう [慣|な]れました か ？ アルバ は [好|す]き です か ？', 'Have you settled in to Alba yet? Do you like it?'],
        simpler: ['アルバ は [好|す]き です か ？ はい ？ いいえ ？', 'Do you like Alba? Yes? No?'],
        want: { yesno: true },
        starter: ['はい 、 ___ から 、 [好|す]き です 。', 'Yes, I like it, because ___.'],
        example: ['はい 、 [大好|だいす]き です 。 [町|まち] の [人|ひと] が とても [優|やさ]しい です から 。', 'Yes, I love it. Because the people in town are so kind.'],
        model: ['はい 、 [好|す]き です 。', 'Yes, I like it.'],
        remember: { likesAlba: 'yesno' },
        react: [
          { if: { yes: true, reason: true }, say: [['まあ 、 うれしい ！ みんな に [言|い]って おきます ね 。', 'Oh, how lovely! I’ll tell everyone.']], mood: 'happy' },
          { if: { yes: true }, say: [['よかった ！ [小|ちい]さい [町|まち] です けど 、 みんな [優|やさ]しい ん です よ 。', 'Good! It’s a small town, but everyone’s kind.']], mood: 'happy' },
          { if: { no: true }, say: [['そう です か … 。 まあ 、 まだ [来|き]た ばかり です から ね 。 そのうち [好|す]き に なります よ 。', 'I see… Well, you’ve only just arrived. You’ll come to like it.']], mood: 'sad' },
          { say: [['そう です か 。 ゆっくり [慣|な]れて ください ね 。', 'I see. Take your time settling in.']] },
        ] },
    ],
    close: [['じゃあ 、 わたし は お[店|みせ] に [戻|もど]ります 。 お[話|はなし] できて 、 [楽|たの]しかった です 。 また [来|き]て ください ね 。', 'Well, I’ll get back to my stall. It was lovely talking with you. Do come again.']],
  };

  // ============================================================ Rosa, rank 2 (A2): this morning, your plans (つもり / 予定), family, yesterday
  const rosa2 = {
    id: 'rosa.2', who: 'rosa', band: 2, title: { en: 'This morning, your plans, and your family' },
    open: [['あ 、 いらっしゃい ！ ちょうど お[茶|ちゃ] を いれた ところ です 。 [一緒|いっしょ] に どう です か ？', 'Oh, welcome! I’ve just made some tea. Will you join me?']],
    turns: [
      { id: 'breakfast', goal: 'Tell her what you had this morning (in the past: «食べました», «飲みました»).',
        ask: ['[今朝|けさ] は 、 [何|なに] を [食|た]べました か ？', 'What did you eat this morning?'],
        simpler: ['[朝|あさ]ご[飯|はん] は ？ パン ？ ご[飯|はん] ？ [何|なに] を [食|た]べました か ？', 'Breakfast? Bread? Rice? What did you eat?'],
        want: { topic: ['food', 'drink'], lemmas: ['何も', '朝ご飯'], time: 'past' },
        tips: { time: 'She asked about this morning: use the past, like «食べました» or «飲みました».' },
        starter: ['___ を [食|た]べました 。', 'I ate ___.'],
        example: ['ご[飯|はん] と [味噌汁|みそしる] を [食|た]べました 。 それ から 、 お[茶|ちゃ] を [飲|の]みました 。', 'I had rice and miso soup. Then I drank some tea.'],
        model: ['パン を [食|た]べました 。', 'I ate bread.'],
        remember: { breakfast: 'match' },
        react: [
          { if: { lemmas: ['パン', 'メロンパン', 'あんパン', 'カレーパン'] }, say: [['{echo|パン ？} マルタ さん の パン です か ？ あそこ の パン 、 おいしい です よ ね 。', '{echo|Bread?} Marta’s bread? Her bread is so good, isn’t it.']], next: 'marta' },
          { if: { lemmas: ['りんご'] }, say: [['りんご ！ きっと うち の りんご でしょう ？ ふふ 。', 'An apple! I bet it was one of mine? Hehe.']], mood: 'happy' },
          { if: { lemmas: ['ご飯', '味噌汁', '納豆', '卵', '魚', '鮭', 'おにぎり', '豆腐'] }, say: [['まあ 、 ちゃんと した [朝|あさ]ご[飯|はん] ！ えらい です ね 。', 'My, a proper breakfast! Good for you.']], mood: 'happy' },
          { if: { neg: true }, say: [['えっ 、 [何|なに]も [食|た]べて ない ん です か ？ だめ です よ ！ はい 、 りんご 。', 'What, you haven’t eaten anything? That won’t do! Here, an apple.']], mood: 'surprised' },
          { say: [['{echo|まあ ！} おいしそう です ね 。', '{echo|Oh!} That sounds delicious.']], mood: 'happy' },
        ] },
      { id: 'marta', follow: true, goal: 'Do you like Marta’s bread? Tell her.',
        ask: ['マルタ さん の パン 、 [好|す]き です か ？', 'Do you like Marta’s bread?'],
        simpler: ['マルタ さん の パン は 、 おいしい です か ？', 'Is Marta’s bread good?'],
        want: { yesno: true },
        starter: ['はい 、 ___ 。', 'Yes, ___.'],
        example: ['はい 、 [大好|だいす]き です 。 [特|とく]に メロンパン が おいしい です 。', 'Yes, I love it. The melon bread is especially good.'],
        model: ['はい 、 [好|す]き です 。', 'Yes, I like it.'],
        react: [
          { if: { yes: true }, say: [['でしょう ？ [秘密|ひみつ] は はちみつ だ そう です よ 。', 'Isn’t it? They say her secret is honey.']], mood: 'happy' },
          { if: { no: true }, say: [['あら … 。 マルタ さん に は [内緒|ないしょ] に して おきます ね 。', 'Oh dear… I’ll keep that a secret from Marta.']], mood: 'surprised' },
          { say: [['ふふ 、 そう です か 。', 'Hehe, I see.']] },
        ] },
      { id: 'weekend', goal: 'Tell her what you plan to do this weekend, with «つもり» («…つもりです»).',
        ask: ['[週末|しゅうまつ] は 、 [何|なに] を する つもり です か ？', 'What are you planning to do this weekend?'],
        simpler: ['[週末|しゅうまつ] は [休|やす]みます か ？ [出|で]かけます か ？ [何|なに] を する つもり です か ？', 'Will you rest this weekend? Go out? What are you planning to do?'],
        want: { any: true, time: 'future' },
        tips: { time: 'Say it as a plan: «～つもりです» (I plan to…), for example «本を読むつもりです».' },
        starter: ['[週末|しゅうまつ] は ___ つもり です 。', 'This weekend I plan to ___.'],
        example: ['[週末|しゅうまつ] は 、 {mimo} と [一緒|いっしょ] に [湖|みずうみ] へ [行|い]く つもり です 。 [魚|さかな] を [見|み]たい です 。', 'This weekend I plan to go to the lake with {mimo}. I want to see the fish.'],
        model: ['[本|ほん] を [読|よ]む つもり です 。', 'I plan to read a book.'],
        react: [
          JA_TALK.keep('plan', 'rosa'),
          { if: { lemmas: ['練習', '練習する', 'ブルーノ', '戦う', '運動する'] }, say: [['ブルーノ さん と ？ あの [人|ひと] 、 [休|やす]み を [知|し]らない ん です よ 。 [無理|むり] しないで ね 。', 'With Bruno? That man doesn’t know what a day off is. Don’t overdo it.']], mood: 'surprised' },
          { if: { lemmas: ['ノア', '探す', '塔'] }, say: [['ノア を [探|さが]す ん です ね … 。 [気|き] を つけて ください ね 。', 'You’re going to look for Noa… Please be careful.']], mood: 'sad' },
          { if: { lemmas: ['寝る', '休む'] }, say: [['それ が いい です 。 [休|やす]む の も [大切|たいせつ] です よ 。', 'Good idea. Resting matters too.']], mood: 'happy' },
          { if: { lemmas: ['祭り', '夏祭り', '花火', '盆踊り', 'ナツ'] }, say: [['お[祭|まつ]り ！ いい です ね え 。 わたし も [若|わか]い [頃|ころ] は 、 [毎年|まいとし] [行|い]きました よ 。', 'A festival! How lovely. When I was young, I went every year too.']], mood: 'happy' },
          { say: [['まあ 、 [楽|たの]しそう な [予定|よてい] です ね 。', 'My, that sounds like a fun plan.']], mood: 'happy' },
        ] },
      { id: 'tomorrow', goal: 'And tomorrow? Tell her what you’ll do («明日は…予定です», or simply «…ます»).',
        ask: ['じゃあ 、 [明日|あした] の [予定|よてい] は ？', 'And what are your plans for tomorrow?'],
        simpler: ['[明日|あした] は [何|なに] を します か ？', 'What will you do tomorrow?'],
        want: { any: true },
        starter: ['[明日|あした] は ___ [予定|よてい] です 。', 'Tomorrow I’m planning to ___.'],
        example: ['[明日|あした] は [朝|あさ] から [図書館|としょかん] へ [行|い]く [予定|よてい] です 。 [午後|ごご] は ブルーノ さん と [練習|れんしゅう] します 。', 'Tomorrow I’m going to the library first thing. In the afternoon I’m training with Bruno.'],
        model: ['[明日|あした] は [町|まち] を [散歩|さんぽ] します 。', 'Tomorrow I’ll take a walk around town.'],
        react: [
          JA_TALK.keep('next', 'rosa'),
          { if: { lemmas: ['図書館', '本', '読む'] }, say: [['[図書館|としょかん] ！ [文田|ふみた] さん に よろしく 。 ノア も 、 あそこ が [大好|だいす]き でした 。', 'The library! Say hello to Mr. Fumita for me. Noa loved it there too.']], mood: 'happy' },
          { if: { lemmas: ['市場', '買い物', '買い物する', '買う'] }, say: [['お[買|か]い[物|もの] なら 、 うち に も [寄|よ]って ね 。 [安|やす]く します よ 。', 'If you’re shopping, stop by my stall too. I’ll give you a good price.']], mood: 'happy' },
          { if: { neg: true }, say: [['[何|なに]も しない [日|ひ] も 、 いい もの です よ 。', 'A day of doing nothing is a fine thing too.']] },
          { say: [['いい です ね 。 いい [一日|いちにち] に なります よう に 。', 'Lovely. I hope it’s a good day.']], mood: 'happy' },
        ] },
      { id: 'family', goal: 'Tell her about your brothers and sisters (or that you have none: «いません», «一人っ子です»).',
        ask: ['ご[家族|かぞく] の こと も [聞|き]かせて ください 。 [兄弟|きょうだい] は います か ？', 'Tell me about your family too. Do you have brothers or sisters?'],
        simpler: ['[兄弟|きょうだい] は います か ？ [何人|なんにん] です か ？', 'Do you have brothers or sisters? How many?'],
        want: { yesno: true, topic: 'family', number: true },
        starter: ['___ が います 。 / [兄弟|きょうだい] は いません 。', 'I have ___. / I don’t have any.'],
        example: ['はい 、 [姉|あね] が [一人|ひとり] と 、 [弟|おとうと] が [一人|ひとり] います 。', 'Yes, I have an older sister and a younger brother.'],
        model: ['はい 、 [兄|あに] が [一人|ひとり] います 。', 'Yes, I have an older brother.'],
        remember: { siblings: 'number', family: { tag: 'family' } },
        react: [
          { if: { num: [3, 30] }, say: [['まあ 、 にぎやか ！ お[家|うち] は いつも お[祭|まつ]り みたい だった でしょう ね 。', 'My, what a lively bunch! Your home must always have felt like a festival.']], mood: 'surprised' },
          { if: { lemmas: ['一人っ子'] }, say: [['わたし も [一人|ひとり]っ[子|こ] でした 。 でも 、 ノア は わたし の [孫|まご] みたい な もの です 。', 'I was an only child too. But Noa is like a granddaughter to me.']] },
          { if: { no: true }, say: [['わたし も [兄弟|きょうだい] は いません でした 。 でも 、 ノア は わたし の [孫|まご] みたい な もの です 。', 'I didn’t have any brothers or sisters either. But Noa is like a granddaughter to me.']] },
          { if: { yes: true }, say: [['いい です ね 。 きっと 、 みんな あなた に [会|あ]いたがって います よ 。', 'How nice. I’m sure they all miss you.']], mood: 'happy' },
          { say: [['そう です か 。 [家族|かぞく] は [大切|たいせつ] です ね 。', 'I see. Family is precious.']] },
        ] },
      { id: 'yesterday', goal: 'Tell her what you did yesterday (in the past: «行きました», «しました»).',
        ask: ['[昨日|きのう] は [何|なに] を しました か ？', 'What did you do yesterday?'],
        simpler: ['[昨日|きのう] 、 [散歩|さんぽ] しました か ？ [買|か]い[物|もの] ？ [何|なに] を しました か ？', 'Yesterday, did you take a walk? Go shopping? What did you do?'],
        want: { any: true, time: 'past' },
        tips: { time: 'It’s about yesterday: use the past, like «行きました», «しました», «会いました».' },
        starter: ['[昨日|きのう] は ___ 。', 'Yesterday I ___.'],
        example: ['[昨日|きのう] は [町|まち] を [散歩|さんぽ] して 、 ブルーノ さん と [話|はな]しました 。', 'Yesterday I walked around town and talked with Bruno.'],
        model: ['[昨日|きのう] は [散歩|さんぽ] を しました 。', 'Yesterday I went for a walk.'],
        react: [
          JA_TALK.keep('did', 'rosa'),
          { if: { lemmas: ['戦う', 'だまりっこ', '勝つ', '大だまりっこ'] }, say: [['だまりっこ と [戦|たたか]った ん です か ？ まあ 、 [勇|いさ]ましい ！', 'You fought the Hushlings? My, how brave!']], mood: 'surprised' },
          { say: [['まあ 、 いい [一日|いちにち] でした ね 。', 'My, what a good day.']], mood: 'happy' },
        ] },
      { id: 'number', goal: 'She learned to use «ぴよ». Will you send her messages? Tell her.',
        ask: ['そう だ ！ ニコ ちゃん に 、 [携帯|けいたい] の 「 ぴよ 」 を [教|おし]えて もらった ん です 。 わたし の [番号|ばんごう] 、 [教|おし]えます ね 。 メッセージ 、 くれます か ？', 'Oh, I know! Nico taught me how to use «Piyo» on my phone. I’ll give you my number. Will you send me messages?'],
        simpler: ['メッセージ 、 くれます か ？ はい ？ いいえ ？', 'Will you send me messages? Yes? No?'],
        want: { yesno: true },
        starter: ['はい 、 ___ 。', 'Yes, ___.'],
        example: ['はい 、 もちろん ！ [毎日|まいにち] [送|おく]ります 。', 'Yes, of course! I’ll send you one every day.'],
        model: ['はい 、 [送|おく]ります 。', 'Yes, I’ll send you messages.'],
        react: [
          { if: { yes: true }, say: [['うれしい ！ わたし 、 [打|う]つ の は [遅|おそ]い けど 、 スタンプ は [得意|とくい] です よ 。 ふふ 。', 'How lovely! I’m slow at typing, but I’m very good at stickers. Hehe.']], mood: 'happy' },
          { if: { no: true }, say: [['あら 、 いじわる ！ じゃあ 、 わたし から [送|おく]ります ね 。', 'Oh, how mean! Then I’ll send them to you.']], mood: 'surprised' },
          { say: [['じゃあ 、 わたし から [送|おく]ります ね 。', 'Then I’ll send you some.']] },
        ] },
    ],
    close: [['はい 、 これ が わたし の [番号|ばんごう] です 。 [気|き] を つけて ね 。 いってらっしゃい ！', 'Here’s my number. Take care. Off you go!']],
  };

  // ============================================================ rewards, memories, phrases (ranks 1–2)
  const memories = {
    'rosa.1': [
      ['[知|し]って います か ？ ノア は [小|ちい]さい [頃|ころ] 、 [毎朝|まいあさ] うち の お[店|みせ] に [来|き]て いました 。', 'Did you know? When Noa was little, she came to my stall every morning.'],
      ['りんご を [一|ひと]つ ずつ 、 [布|ぬの] で ぴかぴか に みがいて くれた ん です 。', 'She polished the apples one by one with a cloth until they shone.'],
      ['お[礼|れい] に 、 [一番|いちばん] きれい な りんご を [紙|かみ] で [包|つつ]んで あげました 。 あなた を [見|み]て いる と 、 あの [頃|ころ] を [思|おも]い[出|だ]します 。', 'As thanks, I’d wrap the prettiest apple in paper for her. Looking at you reminds me of those days.'],
    ],
    'rosa.2': [
      ['うち の [人|ひと] は ね 、 [秋|あき] に なる と 、 [軒下|のきした] に [柿|かき] を [干|ほ]して いました 。', 'My husband used to hang persimmons under the eaves every autumn.'],
      ['オレンジ [色|いろ] の カーテン みたい で 、 [町|まち] の [子供|こども]たち が [見|み]に [来|き]ました 。', 'They looked like an orange curtain, and the town’s children would come to see them.'],
      ['あの [人|ひと] が いなく なって から も 、 わたし は [毎年|まいとし] [干|ほ]して います 。 [今年|ことし] は 、 あなた に も [一|ひと]つ あげます ね 。', 'Even since he’s been gone, I hang them every year. This year, I’ll give you one too.'],
    ],
  };
  const phrases = {
    'ph.talk.ja.okagesama': { t: 'おかげさま で 。', en: 'I’m well, thank you. (Literally: thanks to you.)', note: 'Rosa says it when you ask how she is. It thanks the people around you for your good luck, even if they did nothing special.' },
    'ph.talk.ja.itterasshai': { t: 'いってらっしゃい ！ ／ いって きます ！', en: 'Off you go (and come back)! / I’m off (and I’ll be back)!', note: 'The pair said every time someone leaves home. Rosa says the first when you leave her stall; you answer with the second.' },
  };
  const rewards = {
    rosa: { 1: { phrase: 'ph.talk.ja.okagesama', coins: 5 }, 2: { phrase: 'ph.talk.ja.itterasshai', cosmetic: 'ja_ume', number: true } },
  };

  // Rosa's rank-2 gift in Japanese games: a little plum blossom of folded silk (つまみ細工, tsumami-zaiku), her mother's, pinned at
  // the root of {mimo}'s right ear (the paper flower takes the left); two tiny beads hang from it
  TALK.cosmetic('ja_ume', { name: { en: 'a folded-silk plum blossom (tsumami-zaiku), from Rosa' }, build(M) {
    if (typeof TK === 'undefined' || !M || !M.ears || !M.ears[1]) return null;
    const g = new THREE.Group();
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + Math.PI / 2; g.add(TK.part(TK.G.sphere, i % 2 ? '#f48fb1' : '#e2366f', [Math.cos(a) * 0.062, Math.sin(a) * 0.062, 0], [0.046, 0.05, 0.016], { ink: 0.007 })); }
    g.add(TK.part(TK.G.sphere, '#ffe08a', [0, 0, 0.016], [0.028, 0.028, 0.016], { ink: 0.006 }));
    for (const k of [-1, 1]) g.add(TK.part(TK.G.sphere, '#d9d9e8', [k * 0.022, -0.105 - (k > 0 ? 0.02 : 0), 0], [0.014, 0.014, 0.014], { ink: 0.004 }));
    g.position.set(0.04, 0.07, 0.06); g.rotation.set(-0.25, 0, -0.3);
    M.ears[1].add(g); return g;
  } });

  TALK.content('ja', { scenes: [rosa1, rosa2], rewards, memories, phrases });
})();

// ============================================================================ Rosa, ranks 3–5 (B1 → B2)
// At rank 3 she asks to drop 敬語 between you, and talks casually from then on. Her own story unfolds: the pen pal she wrote
// to for ten years and never met (3), her late husband's shamisen and why she stopped singing the ondo (4), and singing again (5).
(() => {
  if (typeof TALK === 'undefined') return;

  // ------------------------------------------------------------ Rosa, rank 3 (B1): a story from your past
  const rosa3 = {
    id: 'rosa.3', who: 'rosa', band: 3, title: { en: 'When you were younger (and no more keigo)' },
    open: [['あら 、 いらっしゃい 。 [大風車|だいふうしゃ] の [鐘|かね] 、 ここ まで [聞|き]こえました よ 。', 'Oh, welcome. I could hear the Great Mill’s bell all the way from here.'],
      ['ねえ 、 [一|ひと]つ お[願|ねが]い が ある ん です けど … 。 わたしたち 、 もう お[友達|ともだち] でしょう ？ だから 、 [敬語|けいご] は もう やめません か ？', 'Say, I have a favor to ask… We’re friends now, aren’t we? So shall we stop using keigo with each other?']],
    turns: [
      { id: 'keigo', goal: 'She suggests dropping polite speech (敬語) between you. Answer her: you can try plain speech now («うん、いいよ»).',
        ask: ['これ から は 、 ふつう に [話|はな]そう よ 。 ね 、 いい でしょう ？', 'From now on, let’s just talk normally. OK?'],
        simpler: ['ため[口|ぐち] で いい ？ うん ？ ううん ？', 'Casual speech, all right? Yes? No?'],
        want: { yesno: true },
        starter: ['うん 、 ___ 。', 'Yeah, ___.'],
        example: ['うん 、 いい よ ！ うれしい な 。', 'Yeah, sure! That makes me happy.'],
        model: ['うん 、 いい よ 。', 'Yeah, OK.'],
        react: [
          { if: { yes: true }, say: [['よかった ！ じゃあ 、 [今日|きょう] から わたしたち は 、 ため[口|ぐち] [仲間|なかま] ね 。 ふふ 。', 'Great! Then from today we’re casual-talk buddies. Hehe.']], mood: 'happy' },
          { if: { no: true }, say: [['あら 、 まじめ ね 。 じゃあ 、 あなた は [好|す]きな よう に [話|はな]して 。 わたし は ふつう に [話|はな]す わ ね 。', 'Oh, how proper. Then you talk however you like. I’ll just talk normally.']] },
          { say: [['ふふ 、 ゆっくり [慣|な]れれば いい わ 。 わたし は ふつう に [話|はな]す わ ね 。', 'Hehe, you can get used to it slowly. I’ll just talk normally.']] },
        ] },
      { id: 'plan', when: { fact: 'plan' }, goal: 'Did you do what you told her you’d do? Tell her, in the past («うん、行った» / «ううん、行けなかった»).',
        ask: ['そう いえば 、 この [前|まえ] 、 [週末|しゅうまつ] の [予定|よてい] を [教|おし]えて くれた わ よ ね 。 「 {f.plan} 」 って 。 あれ 、 どう だった ？', 'By the way, the other day you told me your weekend plans: {f.plan}. How did that go?'],
        simpler: ['[週末|しゅうまつ] の [予定|よてい] 、 できた ？ できなかった ？', 'Your weekend plan: did you manage it, or not?'],
        want: { yesno: true, time: 'past' },
        tips: { time: 'It already happened: answer in the past, like «行った», «できた», or «行けなかった».' },
        starter: ['うん 、 ___ た 。 / ううん 、 ___ なかった 。', 'Yes, I ___. / No, I didn’t ___.'],
        example: ['ううん 、 [結局|けっきょく] [行|い]けなかった 。 [雨|あめ] が [降|ふ]った から 。 でも 、 [来週|らいしゅう] [行|い]く つもり 。', 'No, in the end I couldn’t go, because it rained. But I’m planning to go next week.'],
        model: ['うん 、 できた よ 。 [楽|たの]しかった 。', 'Yeah, I did. It was fun.'],
        react: [
          { if: { no: true, reason: true }, say: [['それ じゃ 、 しかたない わ ね 。 [予定|よてい] は [予定|よてい] よ 。 また [今度|こんど] ね 。', 'Well, that can’t be helped. Plans are just plans. Next time, then.']] },
          { if: { no: true }, say: [['そう 。 まあ 、 [予定|よてい] は [変|か]わる もの よ 。 [気|き] に しない で 。', 'I see. Well, plans change. Don’t worry about it.']] },
          { if: { yes: true }, say: [['えらい ！ [言|い]った こと を ちゃんと やる [人|ひと] 、 わたし [大好|だいす]き よ 。', 'Good for you! I love people who do what they say they’ll do.']], mood: 'happy' },
          { say: [['そう 。 いろいろ ある わ よ ね 。', 'I see. Things happen, don’t they.']] },
        ] },
      { id: 'mill', goal: 'Tell her what happened at the Great Mill (in the past: «登った», «見た», «鳴らした»).',
        ask: ['それ で 、 [大風車|だいふうしゃ] で は [何|なに] が あった の ？ [全部|ぜんぶ] [聞|き]かせて ！', 'So what happened at the Great Mill? Tell me everything!'],
        simpler: ['[風車|ふうしゃ] に [登|のぼ]った ？ [何|なに] を [見|み]た ？ [何|なに] を した ？', 'Did you climb the windmill? What did you see? What did you do?'],
        want: { any: true, time: 'past' },
        tips: { time: 'It already happened: tell it in the past, like «登った», «見た», «鳴らした».' },
        starter: ['[風車|ふうしゃ] に [登|のぼ]って 、 ___ 。', 'I climbed the windmill and ___.'],
        example: ['{mimo} と [一緒|いっしょ] に [大風車|だいふうしゃ] の [上|うえ] まで [登|のぼ]って 、 だまりっこ と [戦|たたか]って 、 [最後|さいご] に [鐘|かね] を [鳴|な]らした 。', 'I climbed to the top of the Great Mill with {mimo}, fought the Hushlings, and at the end I rang the bell.'],
        model: ['[風車|ふうしゃ] に [登|のぼ]って 、 [鐘|かね] を [鳴|な]らした 。', 'I climbed the windmill and rang the bell.'],
        react: [
          JA_TALK.keep('did', 'rosa'),
          { if: { lemmas: ['シロ', '時計屋'] }, say: [['シロ さん に [会|あ]った の ？ あの [時計屋|とけいや] さん 、 わたし の [古|ふる]い [友達|ともだち] な の よ 。 [若|わか]い [頃|ころ] は 、 わたし の [歌|うた] に [合|あ]わせて 、 よく [口笛|くちぶえ] を [吹|ふ]いて た わ 。', 'You met Ciro? That clockmaker is an old friend of mine. When we were young, he used to whistle along to my songs.']], mood: 'happy' },
          { if: { lemmas: ['戦う', 'だまりっこ', '大だまりっこ', '勝つ', '倒す'] }, say: [['まあ ！ わたし は ここ で 、 のんき に りんご を [売|う]って た の に … 。', 'My! And here I was, selling apples without a care in the world…']], mood: 'surprised' },
          { if: { lemmas: ['鐘', '鳴らす', '鳴る', '音'] }, say: [['あの [鐘|かね] の [音|おと] 、 [何週間|なんしゅうかん] ぶり だった かしら 。 [鳥|とり] まで [歌|うた]い[出|だ]した の よ 。', 'How many weeks had it been since we heard that bell? Even the birds started singing.']], mood: 'happy' },
          { if: { val: '-' }, say: [['[大変|たいへん] だった の ね … 。 でも 、 [無事|ぶじ] で よかった 。', 'That sounds hard… But I’m glad you’re safe.']], mood: 'sad' },
          { say: [['すごい [冒険|ぼうけん] ！ ノア も きっと [喜|よろこ]んで る わ 。', 'What an adventure! Noa must be so happy about it.']], mood: 'happy' },
        ] },
      { id: 'kid', goal: 'What were you like as a kid, and what did you like doing? (in the past: «…のが好きだった», «よく…た»)',
        ask: ['[今度|こんど] は あなた の [番|ばん] よ 。 [子供|こども] の [頃|ころ] 、 どんな [子|こ] だった ？ [何|なに] を する の が [好|す]き だった ？', 'Now it’s your turn. What were you like as a child? What did you like doing?'],
        simpler: ['[子供|こども] の [頃|ころ] 、 よく [何|なに] を して [遊|あそ]んだ ？', 'When you were little, what did you often play?'],
        want: { any: true, time: 'past' },
        tips: { time: 'She’s asking about back then: use the past, like «好きだった», «よく遊んだ», «…していた».' },
        starter: ['[子供|こども] の [頃|ころ] 、 よく ___ 。', 'When I was a kid, I often ___.'],
        example: ['[子供|こども] の [頃|ころ] は 、 [本|ほん] を [読|よ]む の が [大好|だいす]き で 、 [毎日|まいにち] [図書館|としょかん] に [行|い]って いた 。', 'As a kid I loved reading, and I went to the library every day.'],
        model: ['よく [外|そと] で [遊|あそ]んで いた 。', 'I often played outside.'],
        react: [
          JA_TALK.keep('kid', 'rosa'),
          { if: { lemmas: ['本', '読む', '図書館', '漫画', '絵本', '小説'] }, say: [['ノア と [同|おな]じ ！ あの [子|こ] 、 [歩|ある]きながら [本|ほん] を [読|よ]んで 、 うち の お[店|みせ] に ぶつかった こと が ある の 。 みかん が [全部|ぜんぶ] [転|ころ]がって … ふふ 。', 'Just like Noa! Once she was reading as she walked and bumped right into my stall. All the mandarins went rolling… hehe.']], mood: 'happy' },
          { if: { lemmas: ['遊ぶ', 'サッカー', '野球', '走る', '外', '公園', '川', '泳ぐ', '自転車', '鬼ごっこ', 'かくれんぼ', '虫取り'] }, say: [['ふふ 、 きっと [泥|どろ]だらけ で [家|うち] に [帰|かえ]って た ん でしょう ね 。', 'Hehe, I bet you came home covered in mud.']], mood: 'happy' },
          { if: { lemmas: ['歌う', '歌', '音楽', 'ピアノ', 'ギター', '踊る', 'ダンス'] }, say: [['わたし と [同|おな]じ ね ！ わたし も [十歳|じゅっさい] の [頃|ころ] から 、 [広場|ひろば] で [歌|うた]って た の よ 。', 'Just like me! I was singing in the square from the time I was ten.']], mood: 'happy' },
          { if: { lemmas: ['絵', '描く'] }, say: [['ノア も よく [絵|え] を [描|か]いて た わ 。 うち の [包|つつ]み[紙|がみ] の [裏|うら] に 、 [地図|ちず] ばかり 。', 'Noa used to draw all the time too. On the back of my wrapping paper — always maps.']], mood: 'happy' },
          { say: [['いい わ ね 。 [子供|こども] の [頃|ころ] の [思|おも]い[出|で] は 、 [宝物|たからもの] よ 。', 'How lovely. Childhood memories are treasures.']] },
        ] },
      { id: 'hanabi', goal: 'Have you ever seen fireworks? Answer with «～たことがある» («見たことがある» / «見たことがない»), and where if you can.',
        ask: [['[昔|むかし] は ね 、 アルバ でも [夏|なつ] に [花火|はなび] が あった の よ 。 [川|かわ] の [上|うえ] に 、 [大|おお]きな [花|はな] が いっぱい [咲|さ]いて ね 。', 'In the old days, Alba had fireworks in summer too. Big flowers blooming all over the sky above the river.'],
          ['あなた は 、 [花火|はなび] を [見|み]た こと が ある ？ どこ で ？', 'Have you ever seen fireworks? Where?']],
        simpler: ['[花火|はなび] 、 [見|み]た こと ある ？ うん ？ ううん ？', 'Have you ever seen fireworks? Yes? No?'],
        want: { yesno: true, time: 'past' },
        tips: { time: 'Use the “have you ever” shape: the past + «ことがある», like «見たことがある» or «見たことがない».' },
        starter: ['うん 、 ___ で [見|み]た こと が ある 。 / ううん 、 [見|み]た こと が ない 。', 'Yes, I’ve seen them in ___. / No, I’ve never seen them.'],
        example: ['うん 、 ある よ 。 [子供|こども] の [頃|ころ] 、 [家族|かぞく] と [海|うみ] で [見|み]た こと が ある 。 すごく きれい だった 。', 'Yes, I have. As a kid I saw them by the sea with my family. They were so beautiful.'],
        model: ['うん 、 [見|み]た こと が ある 。', 'Yes, I’ve seen them.'],
        remember: { hanabi: 'yesno' },
        react: [
          { if: { no: true }, say: [['[一度|いちど] も ？ じゃあ 、 ナツ ちゃん の [夏祭|なつまつ]り で 、 [絶対|ぜったい] [見|み]なきゃ ！ 「 たまやー 」 って [叫|さけ]ぶ の よ 。', 'Never? Then you absolutely have to see them at Natsu’s summer festival! You shout “Tamaya!”']], mood: 'surprised' },
          { if: { yes: true }, say: [['いい わ ね 。 [花火|はなび] って 、 [見|み]た [後|あと] 、 ちょっと さびしく なる の よ ね 。 [線香花火|せんこうはなび] の [玉|たま] が [落|お]ちる [時|とき] みたい に 。', 'Lovely. Fireworks always leave you a little lonely afterwards, don’t they. Like when the glowing bead of a sparkler drops.']] },
          { say: [['そう 。 [今度|こんど] の お[祭|まつ]り で 、 [一緒|いっしょ] に [見|み]よう ね 。', 'I see. Let’s watch them together at the next festival.']], mood: 'happy' },
        ] },
      { id: 'penpal', goal: 'How did you and Noa become pen pals? Tell her what happened, in your own words.',
        ask: [['わたし ね 、 [十五|じゅうご] の [時|とき] 、 [遠|とお]い [町|まち] の [女|おんな] の [子|こ] と [文通|ぶんつう] を [始|はじ]めた の 。 [十年|じゅうねん] 、 [毎月|まいつき] [手紙|てがみ] を [書|か]いた わ 。', 'When I was fifteen, I started writing letters with a girl in a faraway town. For ten years, I wrote every single month.'],
          ['あなた と ノア も 、 [手紙|てがみ] の [友達|ともだち] でしょう ？ どうやって [知|し]り[合|あ]った の ？', 'You and Noa are pen pals too, aren’t you? How did you two get to know each other?']],
        simpler: ['ノア と は 、 どうやって [友達|ともだち] に なった の ？', 'How did you and Noa become friends?'],
        want: { any: true, time: 'past' },
        tips: { time: 'It’s how it happened: tell it in the past, like «知り合った», «書いた», «なった».' },
        starter: ['___ で [知|し]り[合|あ]った 。', 'We got to know each other through ___.'],
        example: ['[学校|がっこう] の [授業|じゅぎょう] で 、 [遠|とお]く の [人|ひと] に [手紙|てがみ] を [書|か]いた の 。 その [相手|あいて] が ノア だった 。', 'In a class at school, we wrote letters to someone far away. That someone turned out to be Noa.'],
        model: ['[手紙|てがみ] を [書|か]いて 、 [友達|ともだち] に なった 。', 'We wrote letters and became friends.'],
        react: [
          { if: { lemmas: ['手紙', '書く', '学校', '授業'] }, say: [['まあ 、 [手紙|てがみ] から [始|はじ]まった の ね 。 ノア は [手紙|てがみ] が [来|く]る と 、 いつも うち まで [走|はし]って きて 、 [読|よ]んで くれた の よ 。', 'So it all began with letters. Whenever a letter came, Noa would run all the way to my stall and read it to me.']], mood: 'happy' },
          { say: [['そう 。 [縁|えん] って 、 [不思議|ふしぎ] ね 。', 'I see. The ties that bring people together are a mystery, aren’t they.']] },
        ] },
    ],
    close: [['[昔|むかし] の [話|はなし] を して たら 、 [若|わか]く なった [気|き] が する わ 。 ありがとう ね 。', 'Talking about the old days makes me feel young again. Thank you.']],
  };

  // ------------------------------------------------------------ Rosa, rank 4 (B1+): opinions, with reasons
  const rosa4 = {
    id: 'rosa.4', who: 'rosa', band: 3, title: { en: 'What do you think? (opinions and reasons)' },
    open: [['[二|ふた]つ [目|め] の [鐘|かね] も [鳴|な]った わ ね ！ [湖|みずうみ] に [色|いろ] が [戻|もど]った って 。', 'The second bell has rung too! They say the lake has its color back.'],
      ['[今日|きょう] は ね 、 ちょっと まじめ な [話|はなし] を して も いい ？ あなた の [考|かんが]え が [聞|き]きたい の 。', 'Today, may I talk about something a little serious? I want to hear what you think.']],
    turns: [
      { id: 'lake', goal: 'What did you think of Remanso, the lake village? Tell her.',
        ask: ['まず 、 レマンソ は どう だった ？', 'First: how was Remanso?'],
        simpler: ['レマンソ 、 [湖|みずうみ] の [村|むら] 。 よかった ？ どう だった ？', 'Remanso, the lake village. Did you like it? How was it?'],
        want: { any: true },
        starter: ['レマンソ は ___ 。', 'Remanso was ___.'],
        example: ['とても よかった 。 [湖|みずうみ] が [鏡|かがみ] みたい に きれい で 、 [村|むら] の [人|ひと] も [優|やさ]しかった 。', 'I really liked it. The lake was as beautiful as a mirror, and the villagers were kind.'],
        model: ['きれい な [村|むら] だった 。', 'It was a pretty village.'],
        react: [
          { if: { lemmas: ['バルトロ', '船', 'フェリー'] }, say: [['バルトロ さん ？ あの [人|ひと] 、 [歌|うた] は [下手|へた] だ けど 、 [声|こえ] だけ は [大|おお]きい の よ ね 。 ふふ 。', 'Bartolo? That man can’t sing to save his life, but his voice sure is loud. Hehe.']], mood: 'happy' },
          { if: { lemmas: ['魚', '釣る'] }, say: [['レマンソ の [焼|や]き[魚|ざかな] ！ おみやげ に [一|ひと]つ [欲|ほ]しかった わ 。', 'Remanso’s grilled fish! I wish you’d brought me one.']], mood: 'happy' },
          { if: { lemmas: ['湖', '水', '鏡', '島', '灯台'] }, say: [['[昔|むかし] は ね 、 [桟橋|さんばし] から [魚|さかな] が [見|み]える くらい 、 [水|みず] が きれい だった の よ 。', 'In the old days, the water was so clear you could see the fish from the pier.']] },
          { if: { val: '-' }, say: [['そう … 。 [場所|ばしょ] に も 、 [相性|あいしょう] が ある もの ね 。', 'I see… Places and people don’t always click.']] },
          { say: [['わたし は [若|わか]い [頃|ころ] に [一度|いちど] だけ [行|い]った わ 。 [船|ふね] で [気分|きぶん] が [悪|わる]く なって … 。 ふふ 。', 'I only went once, when I was young. I got seasick on the boat… hehe.']] },
        ] },
      { id: 'city', goal: 'City or countryside: which would you rather live in? Say why («…から» or «…ので»).',
        ask: [['アルバ の [若|わか]い [人|ひと] は ね 、 みんな [都会|とかい] へ [行|い]って しまう の 。 [都会|とかい] の ほう が [仕事|しごと] が ある から って 。', 'Alba’s young people all end up moving to the city. There’s more work in the city, they say.'],
          ['あなた は 、 [都会|とかい] と [田舎|いなか] 、 どっち に [住|す]みたい ？ どうして ？', 'Which would you rather live in, the city or the countryside? Why?']],
        simpler: ['[都会|とかい] ？ [田舎|いなか] ？ どっち が いい ？ どうして ？', 'The city? The countryside? Which is better? Why?'],
        want: { lemmas: ['都会', '田舎', '町', '村', '両方', 'どっち', '場合'], reason: true },
        tips: { reason: 'She asked why: add a reason with «…から» or «…ので».' },
        starter: ['___ の ほう が いい 。 ___ から 。', 'I’d rather ___. Because ___.'],
        example: ['[田舎|いなか] の ほう が いい な 。 [都会|とかい] は [便利|べんり] だ けど 、 [田舎|いなか] は [静|しず]か で 、 [人|ひと] が [優|やさ]しい から 。', 'I’d rather the countryside. The city is convenient, but the countryside is quiet, and people are kind.'],
        model: ['[田舎|いなか] に [住|す]みたい 。 [静|しず]か だ から 。', 'I’d like to live in the countryside. Because it’s quiet.'],
        react: [
          { if: { lemmas: ['両方', '場合'] }, say: [['そう ね 。 [人|ひと] に よる わ よ ね 。 [十人十色|じゅうにんといろ] よ 。', 'True. It depends on the person. Ten people, ten colors.']] },
          { if: { lemmas: ['田舎', '村'], neg: false }, say: [['でしょう ？ [都会|とかい] じゃ 、 [誰|だれ] も りんご を おまけ して くれない わ よ 。 ふふ 。', 'Right? In the city, nobody throws in an extra apple for you. Hehe.']], mood: 'happy' },
          { if: { lemmas: ['都会'] }, say: [['そう ね え 。 [便利|べんり] な の は [確|たし]か ね 。 でも 、 [都会|とかい] で [風邪|かぜ] を ひいたら 、 [誰|だれ] が おかゆ を [作|つく]って くれる の ？', 'Hmm. It’s convenient, that’s true. But if you catch a cold in the city, who’ll make you rice porridge?']] },
          { say: [['おもしろい [考|かんが]え ね 。 そう は [思|おも]わなかった わ 。', 'What an interesting way to see it. I hadn’t thought of that.']] },
        ] },
      { id: 'keigo', goal: 'Is keigo (polite speech) necessary? Give your opinion with «…と思う», and a reason if you can.',
        ask: [['ねえ 、 [敬語|けいご] って 、 [難|むずか]しい でしょう ？ わたし も [若|わか]い [頃|ころ] 、 よく [間違|まちが]えた わ 。', 'Keigo is hard, isn’t it? I got it wrong all the time when I was young.'],
          ['[敬語|けいご] は [必要|ひつよう] だ と [思|おも]う ？ あなた の [意見|いけん] を [聞|き]かせて 。', 'Do you think keigo is necessary? Tell me your opinion.']],
        simpler: ['[敬語|けいご] は [大切|たいせつ] ？ [要|い]らない ？ どう [思|おも]う ？', 'Is keigo important? Not needed? What do you think?'],
        want: { any: true, opinion: true },
        tips: { opinion: 'She asked what you think: use «…と思う» (or «…と思います»).' },
        starter: ['___ と [思|おも]う 。 ___ から 。', 'I think ___. Because ___.'],
        example: ['[必要|ひつよう] だ と [思|おも]う 。 [年上|としうえ] の [人|ひと] に は 、 [丁寧|ていねい] に [話|はな]したい から 。 でも 、 [友達|ともだち] と は ため[口|ぐち] が いい な 。', 'I think it’s necessary. Because I want to speak respectfully to older people. But with friends, casual speech is nicer.'],
        model: ['[大切|たいせつ] だ と [思|おも]う 。', 'I think it’s important.'],
        react: [
          { if: { lemmas: ['必要', '大切', '大事', '丁寧'], neg: false }, say: [['わたし も そう [思|おも]う 。 でも 、 [仲良|なかよ]く なったら 、 やめて も いい の 。 わたしたち みたい に ね 。', 'I think so too. But once you’re close, you can stop. Like us.']], mood: 'happy' },
          { if: { neg: true }, say: [['ふふ 、 [正直|しょうじき] ね 。 [大丈夫|だいじょうぶ] 、 [気持|きも]ち が [伝|つた]われば 、 それ で いい の よ 。', 'Hehe, how honest. Don’t worry: as long as your feelings come across, that’s what counts.']] },
          { if: { lemmas: ['難しい', '大変'] }, say: [['ふふ 、 [正直|しょうじき] ね 。 [大丈夫|だいじょうぶ] 、 [気持|きも]ち が [伝|つた]われば 、 それ で いい の よ 。', 'Hehe, how honest. Don’t worry: as long as your feelings come across, that’s what counts.']] },
          { say: [['なるほど ね 。 いい [意見|いけん] だ わ 。', 'I see. That’s a good point.']] },
        ] },
      { id: 'letters', goal: 'Letters or phone messages: which do you prefer, and why?',
        ask: ['[手紙|てがみ] と メッセージ 、 どっち が [好|す]き ？ どうして ？', 'Letters or messages: which do you like better? Why?'],
        simpler: ['[手紙|てがみ] ？ メッセージ ？ どっち が いい ？', 'Letters? Messages? Which is better?'],
        want: { lemmas: ['手紙', 'メッセージ', 'メール', '携帯', 'スマホ', '電話', '両方', 'どっち'], reason: true },
        tips: { reason: 'She asked why: add a reason with «…から».' },
        starter: ['___ の ほう が [好|す]き 。 ___ から 。', 'I prefer ___. Because ___.'],
        example: ['[手紙|てがみ] の ほう が [好|す]き 。 [時間|じかん] は かかる けど 、 [字|じ] を [見|み]る と 、 その [人|ひと] の [気持|きも]ち が わかる から 。', 'I prefer letters. They take time, but when you see the handwriting, you can tell how the person feels.'],
        model: ['メッセージ の ほう が [好|す]き 。 すぐ [届|とど]く から 。', 'I prefer messages. Because they arrive right away.'],
        react: [
          { if: { lemmas: ['手紙'], neg: false }, say: [['わかる ！ [字|じ] を [見|み]る と 、 その [人|ひと] の [顔|かお] が [見|み]える の よ ね 。', 'I know! When you see the handwriting, you can see the person’s face.']], mood: 'happy' },
          { if: { lemmas: ['メッセージ', 'メール', '携帯', 'スマホ'] }, say: [['そう ね 。 ぴよ なら 、 すぐ [返事|へんじ] が [来|く]る もの ね 。 わたし も [最近|さいきん] 、 スタンプ に はまって る の 。 ふふ 。', 'True. With Piyo the answer comes right away. I’ve been hooked on stickers lately myself. Hehe.']], mood: 'happy' },
          { say: [['どっち に も 、 いい ところ が ある わ よ ね 。', 'Both have their good points, don’t they.']] },
        ] },
      { id: 'festival', goal: 'Should old festivals like the Festival of Voices be kept going? Say yes or no, and why.',
        ask: [['[昔|むかし] 、 アルバ で は [毎年|まいとし] [春|はる] に 、 「 [声|こえ] の [祭|まつ]り 」 が あった の 。 みんな で [鐘|かね] を [鳴|な]らして 、 [自分|じぶん] の [名前|なまえ] を [大|おお]きな [声|こえ] で [言|い]う の よ 。', 'Long ago, every spring, Alba had the Festival of Voices. Everyone rang the bells together and said their own name out loud.'],
          ['「 もう [古|ふる]い 」 って [言|い]う [人|ひと] も いる けど … 。 あなた は 、 [古|ふる]い お[祭|まつ]り は [続|つづ]けた ほう が いい と [思|おも]う ？ どうして ？', 'Some people say it’s old-fashioned… Do you think old festivals should be kept going? Why?']],
        simpler: ['[古|ふる]い お[祭|まつ]り 、 [続|つづ]けた ほう が いい ？ どうして ？', 'Old festivals: should they be kept going? Why?'],
        want: { yesno: true, reason: true },
        tips: { reason: 'She asked why: add a reason with «…から».' },
        starter: ['うん 、 [続|つづ]けた ほう が いい と [思|おも]う 。 ___ から 。', 'Yes, I think they should be kept going. Because ___.'],
        example: ['うん 、 [続|つづ]けた ほう が いい と [思|おも]う 。 お[祭|まつ]り が ある と 、 [町|まち] の みんな が [集|あつ]まって 、 [話|はな]す から 。 [今|いま] は [静寂|せいじゃく] が ある から 、 [特|とく]に [大切|たいせつ] だ よ 。', 'Yes, I think they should. Because when there’s a festival, everyone in town gets together and talks. And now, with the Hush around, it matters even more.'],
        model: ['うん 、 [大切|たいせつ] だ と [思|おも]う 。 みんな が [集|あつ]まる から 。', 'Yes, I think it matters. Because everyone gets together.'],
        remember: { festival: 'yesno' },
        react: [
          { if: { yes: true, reason: true }, say: [['[本当|ほんとう] に そう ね 。 あなた が [言|い]う と 、 [説得力|せっとくりょく] が ある わ 。', 'That’s so true. When you say it, it really convinces me.']], mood: 'happy' },
          { if: { yes: true }, say: [['よかった 、 [同|おな]じ [意見|いけん] ね ！', 'Good, we think alike!']], mood: 'happy' },
          { if: { no: true, reason: true }, say: [['そう … 。 わたし と は [違|ちが]う [考|かんが]え だ けど 、 わかる わ 。 [十人十色|じゅうにんといろ] よ ね 。', 'I see… It’s not how I see it, but I understand. Ten people, ten colors.']] },
          { if: { no: true }, say: [['あら … 。 いつか [気|き] が [変|か]わったら 、 [教|おし]えて ね 。', 'Oh… If you ever change your mind, tell me.']], mood: 'sad' },
          { say: [['そう 。 [考|かんが]えて くれて 、 ありがとう 。', 'I see. Thank you for thinking about it.']] },
        ] },
      { id: 'sing', goal: 'Should Rosa sing again, even if her voice isn’t what it was? Tell her what you think, and why.',
        ask: [['[実|じつ] は ね … わたし 、 その お[祭|まつ]り で 、 [音頭|おんど] を [歌|うた]って いた の 。 でも 、 もう [昔|むかし] みたい な [声|こえ] は [出|で]ない し 、 [恥|は]ずかしい わ 。', 'Actually… I used to sing the ondo at that festival. But my voice isn’t what it used to be, and I’d be embarrassed.'],
          ['[下手|へた] でも 、 また [歌|うた]った ほう が いい と [思|おも]う ？ どうして ？', 'Do you think I should sing again, even if I sing badly? Why?']],
        simpler: ['ロサ さん は 、 また [歌|うた]った ほう が いい ？ どうして ？', 'Should Rosa sing again? Why?'],
        want: { yesno: true, reason: true },
        tips: { reason: 'She asked why: add a reason with «…から».' },
        starter: ['うん 、 [歌|うた]った ほう が いい と [思|おも]う 。 ___ から 。', 'Yes, I think you should sing. Because ___.'],
        example: ['もちろん ！ [下手|へた] でも [大丈夫|だいじょうぶ] だ よ 。 ロサ さん の [声|こえ] を [聞|き]いたら 、 みんな も [一緒|いっしょ] に [歌|うた]う と [思|おも]う から 。', 'Of course! It’s fine even if it’s not perfect. Because when everyone hears your voice, Rosa, I think they’ll sing along.'],
        model: ['うん 、 [歌|うた]った ほう が いい と [思|おも]う 。 みんな が [喜|よろこ]ぶ から 。', 'Yes, I think you should sing. Because everyone will be happy.'],
        react: [
          { if: { yes: true }, say: [['[本当|ほんとう] に そう [思|おも]う ？ … もう 、 [照|て]れる じゃない 。 じゃあ 、 ちょっと だけ 、 [練習|れんしゅう] して みよう かしら 。', 'You really think so? …Oh, you’re making me blush. Well then, maybe I’ll practice, just a little.']], mood: 'happy' },
          { if: { no: true, reason: true }, say: [['ふふ 、 [正直|しょうじき] ね 。 [本当|ほんとう] の こと を [言|い]って くれて 、 ありがとう 。', 'Hehe, how honest. Thank you for telling me the truth.']] },
          { if: { no: true }, say: [['そう よ ね … 。 わたし に は 、 りんご を [売|う]る の が [似合|にあ]って る わ 。', 'You’re right… Selling apples suits me better.']], mood: 'sad' },
          { say: [['… [考|かんが]えて みる わ 。', '…I’ll think about it.']] },
        ] },
    ],
    close: [['[今日|きょう] は いっぱい [考|かんが]えた わ 。 あなた の そういう ところ 、 [好|す]き よ 。 ちゃんと [自分|じぶん] の [意見|いけん] を [言|い]う ところ 。', 'I did a lot of thinking today. That’s what I like about you: you say what you really think.']],
  };

  // ------------------------------------------------------------ Rosa, rank 5 (B2): what would you do if…
  const rosa5 = {
    id: 'rosa.5', who: 'rosa', band: 4, title: { en: 'What would you do if…?' },
    open: [['[三|みっ]つ [目|め] の [鐘|かね] … 。 [谷|たに] が [少|すこ]し ずつ [目|め] を [覚|さ]まして いる [気|き] が する わ 。', 'The third bell… I can feel the valley waking up, little by little.'],
      ['[今日|きょう] は ね 、 [答|こた]え の ない [質問|しつもん] ばかり よ 。 [覚悟|かくご] して ね 。 ふふ 。', 'Today it’s nothing but questions with no right answer. Brace yourself. Hehe.']],
    turns: [
      { id: 'back', goal: 'If you could go back in time, when would you go back to, and why? Use «もし…たら» (or «…なら») and «…から».',
        ask: ['もし [過去|かこ] に [戻|もど]る こと が できたら 、 いつ に [戻|もど]りたい ？ どうして ？', 'If you could go back in time, when would you go back to? Why?'],
        simpler: ['[昔|むかし] に [戻|もど]れる なら 、 いつ が いい ？ どうして ？', 'If you could go back, when would be best? Why?'],
        want: { any: true, time: 'hypo', reason: true },
        tips: { time: 'It’s a “what if”: use «もし…たら» or «…なら», like «もし戻れるなら…».', reason: 'Add why, with «…から».' },
        starter: ['もし [戻|もど]れる なら 、 ___ に [戻|もど]りたい 。 ___ から 。', 'If I could, I’d go back to ___. Because ___.'],
        example: ['もし [戻|もど]る こと が できたら 、 [十歳|じゅっさい] の [夏|なつ] に [戻|もど]りたい 。 おばあちゃん が まだ [元気|げんき] で 、 [毎日|まいにち] [一緒|いっしょ] に [料理|りょうり] を して いた から 。', 'If I could go back, I’d go back to the summer I was ten. Because my grandma was still well, and we cooked together every day.'],
        model: ['もし [戻|もど]れる なら 、 [子供|こども] の [頃|ころ] に [戻|もど]りたい 。 [楽|たの]しかった から 。', 'If I could, I’d go back to my childhood. Because it was fun.'],
        react: [
          JA_TALK.keep('back', 'rosa'),
          { if: { lemmas: ['おばあちゃん', 'おじいちゃん', 'おばあさん', 'おじいさん', '祖母', '祖父', '母', '父', 'お母さん', 'お父さん', '家族'] }, say: [['わかる わ 。 [大切|たいせつ] な [人|ひと] は 、 いなく なって から 、 どれ だけ [大切|たいせつ] だった か わかる の よ ね 。', 'I understand. With the people we love, it’s only once they’re gone that we see how much they meant.']], mood: 'sad' },
          { say: [['そう 。 わたし は ね 、 [声|こえ] の [祭|まつ]り の [夜|よる] に [戻|もど]りたい 。 もう [一度|いちど] 、 うち の [人|ひと] の [三味線|しゃみせん] で [歌|うた]いたい の 。', 'I see. Me, I’d go back to the night of the Festival of Voices. To sing just once more with my husband’s shamisen.']] },
        ] },
      { id: 'hush', goal: 'If the Hush reached your hometown, what would you do?',
        ask: ['もし [静寂|せいじゃく] が 、 あなた の [故郷|ふるさと] に [来|き]たら 、 どう する ？', 'If the Hush came to your hometown, what would you do?'],
        simpler: ['あなた の [町|まち] が [静|しず]か に なったら 、 どう する ？', 'If your town went quiet, what would you do?'],
        want: { any: true },
        starter: ['すぐ ___ と [思|おも]う 。', 'I think I’d ___ right away.'],
        example: ['もし [静寂|せいじゃく] が [来|き]たら 、 すぐ [家|いえ] に [帰|かえ]って 、 [家族|かぞく] と [一緒|いっしょ] に [大|おお]きな [声|こえ] で [歌|うた]う と [思|おも]う 。 [町|まち] の [鐘|かね] も [全部|ぜんぶ] [鳴|な]らす 。', 'If the Hush came, I think I’d go straight home and sing at the top of my voice with my family. And I’d ring every bell in town.'],
        model: ['すぐ [家|いえ] に [帰|かえ]って 、 [家族|かぞく] を [助|たす]ける 。', 'I’d go straight home and help my family.'],
        react: [
          { if: { lemmas: ['歌う', '歌', '鐘', '鳴らす', '声', '話す', '音楽', '太鼓'] }, say: [['そう 、 それ よ ！ [声|こえ] は わたしたち の [一番|いちばん] の [武器|ぶき] な の 。', 'Yes, that’s it! Our voices are the best weapon we have.']], mood: 'happy' },
          { if: { lemmas: ['家族', '帰る', '助ける', '手伝う'] }, say: [['あなた の [家族|かぞく] は [幸|しあわ]せ ね 。 あなた みたい な [人|ひと] が いて 。', 'Your family is lucky, having someone like you.']], mood: 'happy' },
          { say: [['なるほど 。 でも 、 [一人|ひとり] で [全部|ぜんぶ] [背負|せお]わない で ね 。', 'I see. But don’t carry it all on your own.']] },
        ] },
      { id: 'self', goal: 'If you met yourself as a child, what would you tell them? Use «もし会ったら、…って言う».',
        ask: ['もし [子供|こども] の [頃|ころ] の [自分|じぶん] に [会|あ]ったら 、 [何|なん] て [言|い]って あげる ？', 'If you met yourself as a child, what would you tell them?'],
        simpler: ['[小|ちい]さい [頃|ころ] の [自分|じぶん] に 、 [一言|ひとこと] 。 [何|なん] て [言|い]う ？', 'One word to your little self. What would you say?'],
        want: { any: true, time: 'hypo' },
        tips: { time: 'Keep the “what if”: «もし子供の頃の自分に会ったら、…って言う».' },
        starter: ['もし [会|あ]ったら 、 「 ___ 」 って [言|い]う 。', 'If I met them, I’d say “___”.'],
        example: ['もし [会|あ]ったら 、 「 [間違|まちが]えて も [大丈夫|だいじょうぶ] 。 たくさん [話|はな]して 、 たくさん [遊|あそ]んで 」 って [言|い]う 。', 'If I met them, I’d say: “It’s OK to make mistakes. Talk a lot, and play a lot.”'],
        model: ['もし [会|あ]ったら 、 「 がんばって 」 って [言|い]う 。', 'If I met them, I’d say “Hang in there.”'],
        react: [
          { if: { lemmas: ['間違える', '大丈夫', '怖い', '心配', '心配する'] }, say: [['それ 、 わたし も [言|い]って ほしかった わ 。 [若|わか]い [頃|ころ] 、 [間違|まちが]える の が [怖|こわ]くて 、 [歌|うた]えなかった [日|ひ] が ある の よ 。', 'I wish someone had told me that. When I was young, there were days I couldn’t sing because I was afraid of getting it wrong.']] },
          { say: [['いい [言葉|ことば] ね 。 きっと その [子|こ] 、 [喜|よろこ]ぶ わ 。', 'What lovely words. I’m sure that little one would be happy to hear them.']], mood: 'happy' },
        ] },
      { id: 'mayor', goal: 'If you were Alba’s mayor, what would you do first, and why? Use «もし…だったら» and «…から».',
        ask: ['もし あなた が アルバ の [町長|ちょうちょう] だったら 、 [最初|さいしょ] に [何|なに] を する ？ どうして ？', 'If you were Alba’s mayor, what would you do first? Why?'],
        simpler: ['あなた が アルバ の [町長|ちょうちょう] なら 、 [何|なに] を する ？', 'If you were Alba’s mayor, what would you do?'],
        want: { any: true, time: 'hypo', reason: true },
        tips: { time: 'It’s a “what if”: «もし町長だったら…».', reason: 'Add why, with «…から».' },
        starter: ['もし [町長|ちょうちょう] だったら 、 まず ___ 。 ___ から 。', 'If I were mayor, first I’d ___. Because ___.'],
        example: ['もし [町長|ちょうちょう] だったら 、 まず [全部|ぜんぶ] の [鐘|かね] を [直|なお]す 。 [鐘|かね] が [鳴|な]れば 、 [静寂|せいじゃく] が [逃|に]げる から 。', 'If I were mayor, first I’d fix all the bells. Because when the bells ring, the Hush runs away.'],
        model: ['もし [町長|ちょうちょう] だったら 、 [毎年|まいとし] お[祭|まつ]り を する 。 みんな が [話|はな]す から 。', 'If I were mayor, I’d hold a festival every year. Because then everyone talks.'],
        react: [
          { if: { lemmas: ['鐘', '直す'] }, say: [['いい わ ね ！ わたし 、 あなた に [一票|いっぴょう] 。', 'Wonderful! You’ve got my vote.']], mood: 'happy' },
          { if: { lemmas: ['祭り', '歌う', '歌', '音楽', 'パーティー', '花火'] }, say: [['じゃあ 、 わたし は [一番|いちばん] [前|まえ] で [歌|うた]う わ 。 ふふ 、 [冗談|じょうだん] よ 。 … たぶん ね 。', 'Then I’ll sing right at the front. Hehe, just kidding. …Probably.']], mood: 'happy' },
          { if: { lemmas: ['図書館', '学校', '本', '勉強', '勉強する'] }, say: [['[文田|ふみた] さん が [泣|な]いて [喜|よろこ]ぶ わ よ 。', 'Mr. Fumita would weep for joy.']], mood: 'happy' },
          { say: [['あなた なら 、 いい [町長|ちょうちょう] に なる わ 。', 'You’d make a good mayor.']], mood: 'happy' },
        ] },
      { id: 'noa', goal: 'If you found Noa tomorrow, what’s the first thing you’d say to her?',
        ask: ['もし [明日|あした] 、 ノア に [会|あ]えたら 、 [最初|さいしょ] に [何|なん] て [言|い]う ？', 'If you could meet Noa tomorrow, what’s the first thing you’d say?'],
        simpler: ['ノア に [会|あ]ったら 、 [何|なん] て [言|い]う ？', 'If you met Noa, what would you say?'],
        want: { any: true },
        starter: ['「 ___ 」 って [言|い]う と [思|おも]う 。', 'I think I’d say “___”.'],
        example: ['まず 「 おかえり 」 って [言|い]う と [思|おも]う 。 それ から 、 ロサ さん が [毎日|まいにち] [待|ま]って いた こと を [話|はな]す 。', 'First I think I’d say “Welcome home.” And then I’d tell her how you waited for her every single day, Rosa.'],
        model: ['「 [一緒|いっしょ] に [帰|かえ]ろう 」 って [言|い]う 。', 'I’d say “Let’s go home together.”'],
        react: [
          { if: { lemmas: ['帰る', 'おかえり', 'おかえりなさい', '家', 'うち'] }, say: [['… そう 。 そう [言|い]って あげて 。 わたし は ここ で 、 りんご を [用意|ようい] して [待|ま]って る から 。', '…Yes. Say that to her. I’ll be right here, with apples ready, waiting.']], mood: 'sad' },
          { say: [['あの [子|こ] 、 きっと [泣|な]く わ 。 [泣|な]き[虫|むし] だ から 。', 'She’ll cry, I’m sure. She’s such a crybaby.']], mood: 'sad' },
        ] },
      { id: 'advice', goal: 'If someone you love were too scared of mistakes to speak, what would you tell them? (and why, if you can)',
        ask: [['[最後|さいご] の [質問|しつもん] よ 。 これ は ちょっと [難|むずか]しい わ 。', 'Last question. This one’s a little hard.'],
          ['もし [大切|たいせつ] な [人|ひと] が 、 [間違|まちが]える の が [怖|こわ]くて [話|はな]せなかったら 、 [何|なん] て [言|い]って あげる ？', 'If someone you love were so afraid of making mistakes that they couldn’t speak, what would you tell them?']],
        simpler: ['[話|はな]す の が [怖|こわ]い [人|ひと] に 、 [何|なん] て [言|い]う ？', 'What would you say to someone who’s afraid to speak?'],
        want: { any: true },
        starter: ['「 ___ 」 って [言|い]う 。', 'I’d say “___”.'],
        example: ['「 [間違|まちが]えて も いい よ 。 [誰|だれ] も [笑|わら]わない から 、 ゆっくり [話|はな]して 」 って [言|い]う 。 [間違|まちが]えながら 、 みんな [上手|じょうず] に なる ん だ から 。', 'I’d say: “It’s fine to make mistakes. Nobody will laugh, so take your time.” Because everyone gets better by making mistakes.'],
        model: ['「 [大丈夫|だいじょうぶ] 。 [間違|まちが]えて も いい よ 」 って [言|い]う 。', 'I’d say: “It’s OK. It’s fine to make mistakes.”'],
        react: [
          { if: { reason: true }, say: [['… それ 、 あなた が わたし に [言|い]って くれた こと と [同|おな]じ ね 。 いい [言葉|ことば] を [言|い]う [人|ひと] は 、 [自分|じぶん] で も [守|まも]らなきゃ だめ よ 。 ふふ 。', '…That’s just what you told me, you know. People who say such good things have to live by them too. Hehe.']], mood: 'happy' },
          { say: [['[優|やさ]しい わ ね 。 [本当|ほんとう] に 。', 'You’re kind. Truly.']], mood: 'happy' },
        ] },
    ],
    close: [['ありがとう 。 [長|なが]い [冬|ふゆ] の [後|あと] に 、 [縁側|えんがわ] で ひなたぼっこ を して いる みたい な [気分|きぶん] よ 。', 'Thank you. I feel like I’m sitting in the sun on the veranda after a long winter.']],
  };

  const memories = {
    'rosa.3': [
      ['その [文通|ぶんつう] の [友達|ともだち] は ね 、 [山|やま] の [向|む]こう の [町|まち] に [住|す]んで いた の 。', 'That pen pal of mine lived in a town on the other side of the mountains.'],
      ['[好|す]きな [歌|うた] の こと 、 [家族|かぞく] の こと 、 [何|なん]でも [書|か]いた わ 。 でも 、 [一度|いちど] も [会|あ]えなかった 。', 'I wrote to her about everything: the songs I loved, my family. But we never once met.'],
      ['[手紙|てがみ] は [今|いま] も [全部|ぜんぶ] 、 [箱|はこ] に とって ある の 。 だから ね 、 あなた と ノア の [話|はなし] を [聞|き]いた [時|とき] 、 なんだか [泣|な]きそう に なった の よ 。', 'I still keep every one of her letters in a box. So when I heard about you and Noa, I nearly cried.'],
    ],
    'rosa.4': [
      ['うち の [人|ひと] は ね 、 [三味線|しゃみせん] が [上手|じょうず] だった の 。', 'My husband was wonderful on the shamisen.'],
      ['お[祭|まつ]り の [夜|よる] は 、 あの [人|ひと] が [弾|ひ]いて 、 わたし が [歌|うた]った 。 アルバ で [一番|いちばん] にぎやか な [夫婦|ふうふ] だった わ 。', 'On festival nights he played and I sang. We were the noisiest couple in all of Alba.'],
      ['[十年|じゅうねん] [前|まえ] に あの [人|ひと] が [亡|な]くなって 、 [三味線|しゃみせん] は [押|お]し[入|い]れ に しまった 。 わたし の [声|こえ] も 、 [一緒|いっしょ] に ね 。', 'Ten years ago he passed away, and I put the shamisen away in the closet. And my voice along with it.'],
    ],
    'rosa.5': [
      ['[次|つぎ] の お[祭|まつ]り で 、 わたし 、 もう [一度|いちど] [音頭|おんど] を [歌|うた]う こと に した わ 。', 'I’ve decided to sing the ondo once more, at the next festival.'],
      ['テツ さん が [太鼓|たいこ] を [叩|たた]いて くれる って 。 うち の [人|ひと] の [三味線|しゃみせん] は 、 [押|お]し[入|い]れ から [出|だ]して 、 ステージ の [横|よこ] に [置|お]く の 。 あの [人|ひと] も [聞|き]ける よう に 。', 'Tetsu says he’ll play the drum for me. And I’ve taken my husband’s shamisen out of the closet, to set beside the stage. So he can listen too.'],
      ['[七転|ななころ]び [八起|やお]き よ 。 [間違|まちが]えたら 、 また [歌|うた]えば いい の 。', 'Fall down seven times, get up eight. If I get it wrong, I’ll just sing again.'],
    ],
  };
  const phrases = {
    'ph.talk.ja.natsukashii': { t: '[懐|なつ]かしい ！', en: 'That brings back memories! (How nostalgic!)', note: 'Rosa sighs it about the old days. One word for the warm feeling of remembering something dear.' },
    'ph.talk.ja.juunin': { t: '[十人十色|じゅうにんといろ]', en: 'Ten people, ten colors. (Everyone sees it their own way.)', note: 'A four-character saying for when people disagree, and that’s fine. Rosa, after you argue with her.' },
    'ph.talk.ja.nanakorobi': { t: '[七転|ななころ]び [八起|やお]き', en: 'Fall down seven times, get up eight.', note: 'A four-character saying about never giving up. Rosa, about singing again after ten years.' },
  };
  const rewards = {
    rosa: { 3: { phrase: 'ph.talk.ja.natsukashii', coins: 10 }, 4: { phrase: 'ph.talk.ja.juunin', coins: 15 }, 5: { phrase: 'ph.talk.ja.nanakorobi', coins: 25 } },
  };
  TALK.content('ja', { scenes: [rosa3, rosa4, rosa5], rewards, memories, phrases });
})();

// ============================================================================ 文田さん, Alba's librarian: ranks 1–3
// (the bond 'librarian' is registered by js/read/library.js; his menu offers "Talk freely"). An old gentleman in a green cardigan
// and a red bow tie, a little theatrical (はっはっは), in love with reading aloud; he knew Noa since she was small. He speaks
// politely to you, and the models answer him politely too.
//   rank 1 (A1) books and you · rank 2 (A2) what you've read, what you'll read · rank 3 (B1) the boy who read to the rabbits
(() => {
  if (typeof TALK === 'undefined') return;
  const BOOKS = ['漫画', '小説', '絵本', '昔話', '推理小説', '物語', '詩', '歴史', '料理', '旅行', '動物', '冒険', '魔法', '怖い', '面白い', '雑誌', '新聞', '辞書', '本', '全部', '何'];
  const lib1 = {
    id: 'librarian.1', who: 'librarian', band: 1, title: { en: 'Books and you' },
    open: [['やあ 、 いらっしゃい ！ [今日|きょう] は [静|しず]か です から 、 ゆっくり お[話|はなし] しましょう 。', 'Hello, welcome! It’s quiet today, so let’s have a nice long chat.'],
      ['… おっと 、 「 [静|しず]か 」 は いけません ね 。 ここ で は 、 [声|こえ] に [出|だ]して [読|よ]む ん でした 。 はっはっは 。', '…Oops, “quiet” won’t do, will it. Here, we read aloud. Ha ha ha.']],
    turns: [
      { id: 'like', goal: 'Do you like books? Tell him.',
        ask: ['あなた は 、 [本|ほん] が [好|す]き です か ？', 'Do you like books?'],
        simpler: ['[本|ほん] 、 [好|す]き です か ？ はい ？ いいえ ？', 'Books: do you like them? Yes? No?'],
        want: { yesno: true },
        starter: ['はい 、 ___ 。', 'Yes, ___.'],
        example: ['はい 、 [大好|だいす]き です 。 [毎日|まいにち] [読|よ]みます 。', 'Yes, I love them. I read every day.'],
        model: ['はい 、 [好|す]き です 。', 'Yes, I like them.'],
        react: [
          { if: { yes: true }, say: [['すばらしい ！ では 、 ここ は あなた の 、 [二|ふた]つ [目|め] の [家|いえ] です ね 。', 'Splendid! Then this is your second home.']], mood: 'happy' },
          { if: { no: true }, say: [['ほう 、 [正直|しょうじき] で よろしい 。 でも 、 きっと [好|す]き に させて みせます よ 。 はっはっは 。', 'Ah, honest — good. But I’ll make you love them yet. Ha ha ha.']] },
          { say: [['ふむ 。 では 、 [一緒|いっしょ] に [探|さが]しましょう 。 あなた の [一冊|いっさつ] を 。', 'Hmm. Then let’s look for it together: your book.']] },
        ] },
      { id: 'kind', goal: 'What kind of books do you like? (comics, novels, folk tales, picture books…)',
        ask: ['どんな [本|ほん] が [好|す]き です か ？', 'What kind of books do you like?'],
        simpler: ['[漫画|まんが] ？ [小説|しょうせつ] ？ [絵本|えほん] ？ どんな [本|ほん] です か ？', 'Comics? Novels? Picture books? What kind?'],
        want: { topic: ['story', 'hobby', 'art'], lemmas: BOOKS },
        starter: ['___ が [好|す]き です 。', 'I like ___.'],
        example: ['[漫画|まんが] と [推理小説|すいりしょうせつ] が [好|す]き です 。 [怖|こわ]い [話|はなし] も [好|す]き です 。', 'I like comics and mystery novels. I like scary stories too.'],
        model: ['[漫画|まんが] が [好|す]き です 。', 'I like comics.'],
        react: [
          { if: { lemmas: ['漫画'] }, say: [['[漫画|まんが] ！ [立派|りっぱ] な [本|ほん] です よ 。 [絵|え] と [言葉|ことば] が 、 [手|て] を つないで いる ん です 。', 'Comics! Fine books indeed. Pictures and words, holding hands.']], mood: 'happy' },
          { if: { lemmas: ['推理小説'] }, say: [['[推理小説|すいりしょうせつ] ！ [犯人|はんにん] は … いえいえ 、 [言|い]いません よ 。', 'Mysteries! The culprit is… no, no, I won’t say.']], mood: 'happy' },
          { if: { lemmas: ['昔話', '絵本'] }, say: [['わたし も [大好|だいす]き です 。 [今度|こんど] 、 [一緒|いっしょ] に [読|よ]みましょう 。', 'I love those too. Let’s read one together sometime.']], mood: 'happy' },
          { if: { lemmas: ['怖い'] }, say: [['おお 、 [怖|こわ]い [話|はなし] ！ [夜|よる] の [図書館|としょかん] で [読|よ]む と 、 [最高|さいこう] です よ 。', 'Ooh, scary stories! They’re best read in the library at night.']], mood: 'surprised' },
          { say: [['{echo|ほう ！} いい [趣味|しゅみ] です ね 。', '{echo|Oh!} Excellent taste.']], mood: 'happy' },
        ] },
      { id: 'when', goal: 'When do you read? (in the morning, at night, before bed, on the train…)',
        ask: ['いつ [本|ほん] を [読|よ]みます か ？', 'When do you read?'],
        simpler: ['[朝|あさ] ？ [夜|よる] ？ いつ [読|よ]みます か ？', 'In the morning? At night? When do you read?'],
        want: { topic: 'time', lemmas: ['朝', '夜', '晩', '毎日', '週末', '休み', '前', '電車', 'バス', '寝る', '時々', 'いつも'] },
        starter: ['___ [読|よ]みます 。', 'I read ___.'],
        example: ['[夜|よる] 、 [寝|ね]る [前|まえ] に [読|よ]みます 。 [週末|しゅうまつ] は [朝|あさ] から [読|よ]みます 。', 'At night, before I go to sleep. On weekends I read from the morning on.'],
        model: ['[夜|よる] [読|よ]みます 。', 'I read at night.'],
        react: [
          { if: { lemmas: ['寝る'] }, say: [['[寝|ね]る [前|まえ] の [本|ほん] は 、 いい [夢|ゆめ] を [連|つ]れて きます よ 。', 'A book before bed brings good dreams.']], mood: 'happy' },
          { if: { lemmas: ['電車', 'バス'] }, say: [['ほう ！ [窓|まど] の [外|そと] と 、 [本|ほん] の [中|なか] 。 [二|ふた]つ の [景色|けしき] が [見|み]えます ね 。', 'Oh! The view out of the window and the view inside the book: two at once.']], mood: 'happy' },
          { say: [['いい です ね 。 [本|ほん] は いつ でも [待|ま]って います 。', 'Lovely. Books are always waiting for you.']] },
        ] },
      { id: 'aloud', goal: 'Do you read aloud? Tell him.',
        ask: ['[本|ほん] を 、 [声|こえ] に [出|だ]して [読|よ]みます か ？', 'Do you read aloud?'],
        simpler: ['[大|おお]きい [声|こえ] で [読|よ]みます か ？ はい ？ いいえ ？', 'Do you read in a loud voice? Yes? No?'],
        want: { yesno: true },
        starter: ['はい 、 ___ 。 ／ いいえ 、 ___ 。', 'Yes, ___. / No, ___.'],
        example: ['いいえ 、 あまり [読|よ]みません 。 ちょっと [恥|は]ずかしい です 。', 'No, not much. It’s a little embarrassing.'],
        model: ['はい 、 [読|よ]みます 。', 'Yes, I do.'],
        react: [
          { if: { yes: true }, say: [['すばらしい ！ [声|こえ] に [出|だ]す と 、 [言葉|ことば] が [体|からだ] に [入|はい]って きます 。', 'Splendid! When you read aloud, the words get into your body.']], mood: 'happy' },
          { if: { no: true }, say: [['では 、 [今日|きょう] から [始|はじ]めましょう 。 ここ なら 、 [誰|だれ] も [笑|わら]いません よ 。', 'Then let’s start today. Here, nobody will laugh.']] },
          { say: [['ふむ 。 ここ で は 、 いつ でも [声|こえ] を [出|だ]して いい ん です よ 。', 'Hmm. Here you can always read out loud, you know.']] },
        ] },
      { id: 'kana', goal: 'Hiragana, katakana or kanji: which do you like best? (and why, if you can)',
        ask: ['ひらがな 、 カタカナ 、 [漢字|かんじ] 。 どれ が [一番|いちばん] [好|す]き です か ？', 'Hiragana, katakana, kanji. Which do you like best?'],
        simpler: ['ひらがな ？ カタカナ ？ [漢字|かんじ] ？', 'Hiragana? Katakana? Kanji?'],
        want: { lemmas: ['ひらがな', 'カタカナ', '漢字', '全部', '字'] },
        starter: ['___ が [一番|いちばん] [好|す]き です 。', 'I like ___ best.'],
        example: ['[漢字|かんじ] が [一番|いちばん] [好|す]き です 。 [難|むずか]しい けど 、 [絵|え] みたい で きれい です から 。', 'I like kanji best. They’re hard, but they’re beautiful, like little pictures.'],
        model: ['ひらがな が [好|す]き です 。', 'I like hiragana.'],
        react: [
          { if: { lemmas: ['漢字'] }, say: [['わたし も です ！ 「 [森|もり] 」 は 、 [木|き] が [三|みっ]つ 。 [森|もり] [先生|せんせい] の [寺子屋|てらこや] で 、 たくさん [覚|おぼ]えて ください ね 。', 'Me too! 森, the forest, is three trees. Learn lots of them at Mori-sensei’s terakoya.']], mood: 'happy' },
          { if: { lemmas: ['ひらがな'] }, say: [['ひらがな は 、 [丸|まる]くて [優|やさ]しい [字|じ] です ね 。', 'Hiragana are round, gentle letters.']], mood: 'happy' },
          { if: { lemmas: ['カタカナ'] }, say: [['カタカナ は 、 かっこいい です よ ね 。 [角|かど] が あって 。', 'Katakana are cool, aren’t they. All those sharp corners.']], mood: 'happy' },
          { say: [['どの [字|じ] に も 、 それぞれ の [良|よ]さ が あります ね 。', 'Every script has something good about it.']] },
        ] },
    ],
    close: [['では 、 [今日|きょう] から あなた も 、 この [図書館|としょかん] の [仲間|なかま] です 。', 'Well then, from today, you’re one of this library’s friends too.']],
  };

  const lib2 = {
    id: 'librarian.2', who: 'librarian', band: 2, title: { en: 'What you’ve read, what you’ll read' },
    open: [['おや 、 また [会|あ]えました ね 。 さあ 、 どうぞ 、 [座|すわ]って ください 。', 'Oh, we meet again. Come, please sit down.']],
    turns: [
      { id: 'last', goal: 'Have you read anything lately? Tell him what, and how it was (in the past: «読みました», «面白かったです»).',
        ask: ['[最近|さいきん] 、 [何|なに] か [読|よ]みました か ？ どう でした か ？', 'Have you read anything lately? How was it?'],
        simpler: ['[最近|さいきん] 、 どんな [本|ほん] を [読|よ]みました か ？', 'What have you read lately?'],
        want: { any: true, time: 'past' },
        tips: { time: 'He asked about something you already read: use the past, like «読みました», «面白かったです».' },
        starter: ['___ を [読|よ]みました 。 ___ 。', 'I read ___. It was ___.'],
        example: ['この [図書館|としょかん] の [昔話|むかしばなし] を [読|よ]みました 。 [短|みじか]くて 、 [面白|おもしろ]かった です 。', 'I read one of this library’s folk tales. It was short and fun.'],
        model: ['[漫画|まんが] を [読|よ]みました 。 [面白|おもしろ]かった です 。', 'I read a comic. It was fun.'],
        react: [
          { if: { lemmas: ['昔話', '鶴', '恩返し'] }, say: [['おお 、 「 つる の おんがえし 」 です ね ！ あれ は 、 わたし が [書|か]き[直|なお]した ん です よ 。 [読|よ]みやすかった でしょう ？', 'Ah, “The Crane’s Gift”! I retold that one myself, you know. Easy to read, wasn’t it?']], mood: 'happy' },
          { if: { neg: true }, say: [['[忙|いそが]しかった ん です ね 。 [本|ほん] は [逃|に]げません から 、 [大丈夫|だいじょうぶ] 。', 'You’ve been busy, then. Books don’t run away, don’t worry.']] },
          { if: { val: '-' }, say: [['[面白|おもしろ]くない [本|ほん] も ある 。 それ を [知|し]る の も 、 [読書|どくしょ] です 。', 'Some books aren’t fun. Finding that out is part of reading too.']] },
          { say: [['いい です ね 。 [読|よ]んだ [本|ほん] は 、 [心|こころ] の [本棚|ほんだな] に [並|なら]びます 。', 'Lovely. Every book you read goes on the bookshelf in your heart.']], mood: 'happy' },
        ] },
      { id: 'child', goal: 'What did you read as a child? (in the past: «読んでいました», «好きでした»)',
        ask: ['[子供|こども] の [頃|ころ] は 、 どんな [本|ほん] を [読|よ]んで いました か ？', 'What kind of books did you read as a child?'],
        simpler: ['[小|ちい]さい [頃|ころ] 、 [好|す]きな [本|ほん] は [何|なん] でした か ？', 'When you were little, what was your favorite book?'],
        want: { any: true, time: 'past' },
        tips: { time: 'It’s about your childhood: use the past, like «読んでいました», «好きでした».' },
        starter: ['[子供|こども] の [頃|ころ] は 、 ___ を [読|よ]んで いました 。', 'As a child I used to read ___.'],
        example: ['[子供|こども] の [頃|ころ] は 、 [動物|どうぶつ] の [絵本|えほん] が [大好|だいす]き でした 。 [毎晩|まいばん] 、 [母|はは] が [読|よ]んで くれました 。', 'As a child I loved picture books about animals. My mother read them to me every night.'],
        model: ['[漫画|まんが] を よく [読|よ]んで いました 。', 'I used to read comics a lot.'],
        react: [
          { if: { lemmas: ['母', '父', 'お母さん', 'お父さん', 'おばあちゃん', 'おじいちゃん', '祖母', '祖父', '家族'] }, say: [['[読|よ]んで もらった [本|ほん] は 、 [一生|いっしょう] [忘|わす]れません ね 。 [声|こえ] まで [覚|おぼ]えて いる もの です 。', 'Books someone read to you, you never forget. You even remember their voice.']], mood: 'happy' },
          { if: { lemmas: ['漫画'] }, say: [['わたし も です よ 。 [授業中|じゅぎょうちゅう] に [読|よ]んで 、 [先生|せんせい] に よく [取|と]り[上|あ]げられました 。 はっはっは 。', 'Me too. I read them in class, and my teachers were always confiscating them. Ha ha ha.']], mood: 'happy' },
          { say: [['いい [本|ほん] を [読|よ]んで いました ね 。', 'You were reading good books.']] },
        ] },
      { id: 'next', goal: 'What are you planning to read next? Use «つもり» («…を読むつもりです»).',
        ask: ['[今度|こんど] の お[休|やす]み に は 、 [何|なに] を [読|よ]む つもり です か ？', 'What are you planning to read on your next day off?'],
        simpler: ['[次|つぎ] は 、 どんな [本|ほん] を [読|よ]みます か ？', 'What book will you read next?'],
        want: { any: true, time: 'future' },
        tips: { time: 'Say it as a plan: «…を読むつもりです».' },
        starter: ['___ を [読|よ]む つもり です 。', 'I’m planning to read ___.'],
        example: ['[推理小説|すいりしょうせつ] を [読|よ]む つもり です 。 おすすめ は あります か ？', 'I’m planning to read a mystery. Do you have a recommendation?'],
        model: ['[絵本|えほん] を [読|よ]む つもり です 。', 'I’m planning to read a picture book.'],
        react: [
          { if: { lemmas: ['推理小説', '小説'] }, say: [['では 、 [青|あお]い [表紙|ひょうし] の 、 [上|うえ] から [三段目|さんだんめ] の [本|ほん] を どうぞ 。 [最後|さいご] の ページ から [読|よ]んで は いけません よ 。', 'Then try the one with the blue cover, third shelf from the top. And no reading the last page first.']], mood: 'happy' },
          { if: { lemmas: ['絵本', '昔話'] }, say: [['[絵本|えほん] は 、 [大人|おとな] が [読|よ]んで も いい ん です よ 。 [大人|おとな] に こそ 、 いい ん です 。', 'Picture books are fine for grown-ups too. In fact, grown-ups need them most.']], mood: 'happy' },
          { say: [['いい [計画|けいかく] です ね 。', 'A fine plan.']], mood: 'happy' },
        ] },
      { id: 'help', goal: 'He asks you to read a picture book to the children next Saturday. Say yes or no (if no, say why).',
        ask: [['[来週|らいしゅう] の [土曜日|どようび] 、 [子供|こども]たち に [絵本|えほん] を [読|よ]む [会|かい] が あります 。', 'Next Saturday we have a story time, reading picture books to the children.'],
          ['あなた も 、 [一冊|いっさつ] [読|よ]んで くれません か ？', 'Would you read one book for them too?']],
        simpler: ['[土曜日|どようび] 、 [子供|こども]たち に [本|ほん] を [読|よ]みます か ？ はい ？ いいえ ？', 'On Saturday, will you read a book to the children? Yes? No?'],
        want: { yesno: true },
        starter: ['はい 、 ___ 。 ／ すみません 、 ___ から 。', 'Yes, ___. / Sorry, because ___.'],
        example: ['はい 、 ぜひ ！ いい [練習|れんしゅう] に も なります から 。', 'Yes, I’d love to! It’ll be good practice for me too.'],
        model: ['はい 、 [読|よ]みます 。', 'Yes, I’ll read.'],
        react: [
          { if: { yes: true }, say: [['ありがとう ！ [子供|こども]たち は 、 [新|あたら]しい [声|こえ] が [大好|だいす]き な ん です 。', 'Thank you! The children love a new voice.']], mood: 'happy' },
          { if: { no: true, reason: true }, say: [['わかりました 。 また [今度|こんど] 、 お[願|ねが]い します ね 。', 'I understand. Another time, then.']] },
          { if: { no: true }, say: [['おや 、 [残念|ざんねん] 。 でも 、 いつ でも [待|ま]って います よ 。', 'Oh, what a shame. But I’ll be waiting, any time.']] },
          { say: [['では 、 [気|き] が [向|む]いたら 、 [来|き]て ください 。', 'Then come if you feel like it.']] },
        ] },
      { id: 'spot', goal: 'Which spot in this library do you like best? (by the window, near the clock, the reading nook…)',
        ask: ['この [図書館|としょかん] で 、 どこ が [一番|いちばん] [好|す]き です か ？', 'Which spot in this library do you like best?'],
        simpler: ['[窓|まど] の そば ？ [時計|とけい] の [近|ちか]く ？ どこ が [好|す]き です か ？', 'By the window? Near the clock? Where do you like?'],
        want: { any: true },
        starter: ['___ が [一番|いちばん] [好|す]き です 。', 'I like ___ best.'],
        example: ['[大|おお]きな [時計|とけい] の [近|ちか]く が [一番|いちばん] [好|す]き です 。 [静|しず]か で 、 [明|あか]るい です から 。', 'I like it best near the big clock. It’s quiet and bright.'],
        model: ['[窓|まど] の そば が [好|す]き です 。', 'I like it by the window.'],
        react: [
          { if: { lemmas: ['時計'] }, say: [['[時計|とけい] の [近|ちか]く … 。 ノア さん も 、 いつも そこ に [座|すわ]って いました 。 [不思議|ふしぎ] です ね 。', 'Near the clock… Noa always sat there too. How curious.']], mood: 'surprised' },
          { if: { lemmas: ['窓'] }, say: [['[窓|まど] の そば は 、 [午後|ごご] の [光|ひかり] が いい ん です よ 。', 'By the window the afternoon light is lovely.']], mood: 'happy' },
          { say: [['いい [場所|ばしょ] を [見|み]つけました ね 。', 'You’ve found a good spot.']], mood: 'happy' },
        ] },
    ],
    close: [['また いつ でも [来|き]て ください 。 [本|ほん] たち が [待|ま]って います 。', 'Come back any time. The books will be waiting.']],
  };

  const lib3 = {
    id: 'librarian.3', who: 'librarian', band: 3, title: { en: 'The boy who read to the rabbits' },
    open: [['… [実|じつ] は 、 [今日|きょう] は あなた に 、 [少|すこ]し [昔|むかし] の [話|はなし] を したい の です 。 わたし が 、 [声|こえ] を [出|だ]せなかった [頃|ころ] の [話|はなし] です 。', 'Actually, today I’d like to tell you a story from long ago. From the time when I couldn’t speak up.']],
    turns: [
      { id: 'shy', goal: 'Have you ever been scared to speak in front of people? Tell him.',
        ask: [['わたし は [子供|こども] の [頃|ころ] 、 とても [恥|は]ずかしがり[屋|や] でした 。 [国語|こくご] の [時間|じかん] に [音読|おんどく] が ある と 、 [朝|あさ] から お[腹|なか] が [痛|いた]く なりました 。', 'As a boy I was terribly shy. On days when we had to read aloud in Japanese class, my stomach hurt from the morning on.'],
          ['あなた は 、 [人|ひと] の [前|まえ] で [話|はな]す の が [怖|こわ]かった こと が あります か ？', 'Have you ever been scared of speaking in front of people?']],
        simpler: ['[人|ひと] の [前|まえ] で [話|はな]す の 、 [怖|こわ]かった こと が あります か ？', 'Has speaking in front of people ever scared you?'],
        want: { yesno: true },
        starter: ['はい 、 あります 。 ／ いいえ 、 ___ 。', 'Yes, I have. / No, ___.'],
        example: ['はい 、 あります 。 [学校|がっこう] で [発表|はっぴょう] を した [時|とき] 、 とても [緊張|きんちょう] しました 。', 'Yes, I have. When I gave a presentation at school, I was really nervous.'],
        model: ['はい 、 あります 。', 'Yes, I have.'],
        react: [
          { if: { yes: true }, say: [['そう です か 。 では 、 わたしたち は [仲間|なかま] です ね 。', 'I see. Then we’re in the same club.']], next: 'story' },
          { if: { no: true }, say: [['ほう 、 うらやましい ！ わたし は 、 [自分|じぶん] の [名前|なまえ] を [言|い]う の も [怖|こわ]かった の に 。', 'My, I envy you! I was scared even to say my own name.']], mood: 'surprised' },
          { say: [['ふむ 。 [誰|だれ] に でも 、 [怖|こわ]い もの は ある もの です 。', 'Hmm. Everyone is afraid of something.']] },
        ] },
      { id: 'story', follow: true, goal: 'Tell him what happened that time (in the past: «…しました», «…でした»).',
        ask: ['よかったら 、 その [時|とき] の こと を [話|はな]して ください 。 [何|なに] が あった ん です か ？', 'If you like, tell me about that time. What happened?'],
        simpler: ['いつ でした か ？ [何|なに] が ありました か ？', 'When was it? What happened?'],
        want: { any: true, time: 'past' },
        tips: { time: 'Tell it as it happened: use the past, like «緊張しました», «言えませんでした».' },
        starter: ['___ の [時|とき] 、 ___ 。', 'When ___, I ___.'],
        example: ['[中学校|ちゅうがっこう] の [時|とき] 、 クラス の [前|まえ] で [作文|さくぶん] を [読|よ]みました 。 [緊張|きんちょう] して 、 [何|なに]も [言|い]えません でした 。', 'In middle school I read an essay in front of the class. I was so nervous I couldn’t say a word.'],
        model: ['[学校|がっこう] で [発表|はっぴょう] を して 、 とても [緊張|きんちょう] しました 。', 'I gave a presentation at school and got really nervous.'],
        react: [
          { say: [['わかります 。 [心臓|しんぞう] が [口|くち] から [出|で]そう に なります よ ね 。', 'I understand. It feels like your heart might jump right out of your mouth.']] },
        ] },
      { id: 'rabbits', goal: 'What would you suggest to someone who’s afraid to speak? Give a reason («…から» / «…ので»).',
        ask: [['ある [日|ひ] 、 [先生|せんせい] が わたし を 、 [学校|がっこう] の うさぎ の [係|かかり] に しました 。 そして 、 こう [言|い]った ん です 。', 'One day, my teacher put me in charge of the school’s rabbits. And she said this:'],
          ['「 うさぎ に [本|ほん] を [読|よ]んで あげて 。 うさぎ は [笑|わら]わない から 」 。', '“Read books to the rabbits. Rabbits don’t laugh.”'],
          ['[毎日|まいにち] [読|よ]んで いたら 、 [少|すこ]し ずつ [声|こえ] が [出|で]る よう に なりました 。 … あなた なら 、 [話|はな]す の が [怖|こわ]い [人|ひと] に 、 どんな [方法|ほうほう] を すすめます か ？ どうして ？', 'Reading to them every day, little by little my voice came back. …What would you suggest to someone who’s afraid to speak? Why?']],
        simpler: ['[話|はな]す の が [怖|こわ]い [人|ひと] 。 [何|なに] を すれば いい と [思|おも]います か ？', 'Someone is afraid to speak. What do you think they should do?'],
        want: { any: true, reason: true },
        tips: { reason: 'He asked why: add a reason with «…から» or «…ので».' },
        starter: ['___ と いい と [思|おも]います 。 ___ から です 。', 'I think it helps to ___. Because ___.'],
        example: ['[毎日|まいにち] [少|すこ]し ずつ 、 [好|す]きな [人|ひと] と [話|はな]す と いい と [思|おも]います 。 [優|やさ]しい [人|ひと] の [前|まえ] なら 、 [怖|こわ]く ない から です 。', 'I think it helps to talk a little every day with someone you like. Because in front of kind people, it isn’t scary.'],
        model: ['[歌|うた] を [歌|うた]う と いい と [思|おも]います 。 [楽|たの]しい から です 。', 'I think singing helps. Because it’s fun.'],
        react: [
          { if: { lemmas: ['犬', '猫', 'ペット', '動物', 'うさぎ', 'ミモ'] }, say: [['はっはっは ！ [動物|どうぶつ] は [最高|さいこう] の [聞|き]き[手|て] です 。 {mimo} ちゃん も です ね 。', 'Ha ha ha! Animals are the best listeners. {mimo} too, I’d say.']], mood: 'happy' },
          { if: { lemmas: ['歌', '歌う'] }, say: [['[歌|うた] ！ [歌|うた] なら 、 [声|こえ] が [自然|しぜん] に [出|で]ます ね 。 いい [考|かんが]え です 。', 'Singing! When you sing, your voice comes out on its own. A good idea.']], mood: 'happy' },
          { say: [['なるほど 。 とても いい [方法|ほうほう] です 。 [今度|こんど] 、 [誰|だれ] か に [教|おし]えて あげましょう 。', 'I see. A very good way. Let’s teach it to someone, one of these days.']], mood: 'happy' },
        ] },
      { id: 'mistake', goal: 'Have you ever made an embarrassing mistake in Japanese? Tell him what happened (in the past).',
        ask: ['[日本語|にほんご] で 、 [間違|まちが]えて [恥|は]ずかしかった こと は あります か ？ [教|おし]えて ください 。', 'Have you ever made an embarrassing mistake in Japanese? Tell me about it.'],
        simpler: ['[日本語|にほんご] で 、 どんな [間違|まちが]い を しました か ？', 'What mistakes have you made in Japanese?'],
        want: { any: true, time: 'past' },
        tips: { time: 'Tell what happened: use the past, like «言いました», «言ってしまいました».' },
        starter: ['「 ___ 」 と [言|い]いたかった の に 、 「 ___ 」 と [言|い]って しまいました 。', 'I wanted to say “___”, but I said “___” by mistake.'],
        example: ['はい 。 「 かわいい 」 と [言|い]いたかった の に 、 「 こわい 」 と [言|い]って しまいました 。 [赤|あか]ちゃん の お[母|かあ]さん は 、 びっくり して いました 。', 'Yes. I wanted to say “kawaii” (cute), but I said “kowai” (scary) instead. The baby’s mother was shocked.'],
        model: ['はい 、 [言葉|ことば] を [間違|まちが]えました 。 みんな [笑|わら]いました 。', 'Yes, I used the wrong word. Everyone laughed.'],
        react: [
          { if: { lemmas: ['可愛い', '怖い'] }, say: [['はっはっは ！ その [間違|まちが]い は 、 [有名|ゆうめい] です よ 。 でも 、 [赤|あか]ちゃん は きっと [笑|わら]って いました 。', 'Ha ha ha! That one’s a famous mistake. But I bet the baby was laughing.']], mood: 'happy' },
          { if: { lemmas: ['笑う'] }, say: [['[笑|わら]われる の は つらい です ね 。 でも 、 [一緒|いっしょ] に [笑|わら]えば 、 それ は もう [失敗|しっぱい] じゃ ありません 。', 'Being laughed at hurts. But if you laugh along, it isn’t a failure anymore.']] },
          { say: [['[間違|まちが]い は 、 [言葉|ことば] を [覚|おぼ]える [一番|いちばん] の [近道|ちかみち] です よ 。', 'Mistakes are the best shortcut to learning words.']] },
        ] },
      { id: 'why', goal: 'Why did you decide to learn Japanese? Give your reason («…から» / «…ので»).',
        ask: ['[最後|さいご] に 、 [一|ひと]つ 。 どうして [日本語|にほんご] を [勉強|べんきょう] しよう と [思|おも]った ん です か ？', 'One last thing. Why did you decide to learn Japanese?'],
        simpler: ['[日本語|にほんご] を [勉強|べんきょう] する [理由|りゆう] は [何|なん] です か ？', 'What’s your reason for learning Japanese?'],
        want: { any: true, reason: true },
        tips: { reason: 'He asked why: give your reason with «…から» or «…ので».' },
        starter: ['___ から 、 [勉強|べんきょう] を [始|はじ]めました 。', 'I started learning because ___.'],
        example: ['[日本|にほん] の アニメ が [大好|だいす]き だった から です 。 いつか 、 [日本語|にほんご] だけ で [見|み]たい ん です 。', 'Because I loved Japanese anime. One day I want to watch it in Japanese alone.'],
        model: ['[日本|にほん] の [文化|ぶんか] に [興味|きょうみ] が ある から です 。', 'Because I’m interested in Japanese culture.'],
        react: [
          { if: { lemmas: ['アニメ', '漫画', '歌', 'ゲーム'] }, say: [['オトハ さん と ススム くん に は 、 もう [会|あ]いました か ？ あの [二人|ふたり] と [話|はな]したら 、 [一晩中|ひとばんじゅう] アニメ の [話|はなし] です よ 。', 'Have you met Otoha and Susumu yet? Talk with those two and it’s anime all night long.']], mood: 'happy' },
          { say: [['すばらしい [理由|りゆう] です 。 その [気持|きも]ち を 、 [忘|わす]れないで ください 。', 'A wonderful reason. Don’t ever forget that feeling.']], mood: 'happy' },
        ] },
    ],
    close: [['[話|はな]して くれて 、 ありがとう 。 うさぎ の [話|はなし] は 、 ノア さん の ほか に は 、 [初|はじ]めて [話|はな]しました 。', 'Thank you for telling me. Apart from Noa, you’re the first person I’ve told about the rabbits.']],
  };

  const memories = {
    'librarian.1': [
      ['ノア さん は [小|ちい]さい [頃|ころ] 、 まだ [字|じ] が [読|よ]めない の に 、 [毎日|まいにち] [絵本|えほん] を [借|か]りに [来|き]ました 。', 'When Noa was little, before she could even read, she came to borrow picture books every day.'],
      ['[絵|え] だけ を [見|み]て 、 [自分|じぶん] で お[話|はなし] を [作|つく]って いた ん です よ 。', 'She’d look only at the pictures and make up her own stories.'],
      ['[正直|しょうじき] に [言|い]う と 、 あの [子|こ] の お[話|はなし] の ほう が 、 [本|ほん] より [面白|おもしろ]かった です 。', 'To be honest, her stories were more fun than the books.'],
    ],
    'librarian.2': [
      ['この [図書館|としょかん] は 、 わたし の [祖父|そふ] が [始|はじ]めました 。 [最初|さいしょ] は 、 [本|ほん] が [三十冊|さんじゅっさつ] しか ありません でした 。', 'My grandfather started this library. At first there were only thirty books.'],
      ['[町|まち] の [人|ひと] が 、 [一冊|いっさつ] ずつ [持|も]って きて くれて 、 [今|いま] は [一万冊|いちまんさつ] を [超|こ]えました 。', 'The townspeople brought them one at a time, and now there are more than ten thousand.'],
      ['だから 、 ここ の [本|ほん] は [全部|ぜんぶ] 、 [誰|だれ] か の [思|おも]い[出|で] な ん です よ 。', 'So every book here is somebody’s memory.'],
    ],
    'librarian.3': [
      ['あの うさぎ の [名前|なまえ] は 、 「 もち 」 でした 。 [白|しろ]くて 、 [丸|まる]くて 、 [耳|みみ] が [長|なが]くて … ちょうど {mimo} ちゃん みたい でした 。', 'That rabbit’s name was Mochi. White, round, with long ears… just like {mimo}.'],
      ['[卒業式|そつぎょうしき] の [日|ひ] 、 わたし は [学校|がっこう] の みんな の [前|まえ] で 、 お[礼|れい] の [言葉|ことば] を [読|よ]みました 。', 'On graduation day, I read the thank-you speech in front of the whole school.'],
      ['[声|こえ] は ふるえて いました が 、 [最後|さいご] まで [読|よ]めました 。 [一番|いちばん] [前|まえ] の [席|せき] で 、 [先生|せんせい] が [泣|な]いて いました 。', 'My voice was shaking, but I read it to the end. In the front row, my teacher was crying.'],
    ],
  };
  const phrases = {
    'ph.talk.ja.narauyori': { t: '[習|なら]う より [慣|な]れろ', en: 'Practice beats studying. (Get used to it, rather than learn it.)', note: 'Mr. Fumita’s favorite saying: you learn a language by using it, not only by studying it.' },
    'ph.talk.ja.dokusho': { t: '[読書|どくしょ] の [秋|あき]', en: 'Autumn, the season for reading.', note: 'In Japan, the long, cool evenings of autumn are “the season for reading”. Mr. Fumita says every season is.' },
    'ph.talk.ja.keizoku': { t: '[継続|けいぞく] は [力|ちから] なり 。', en: 'Keeping at it is strength.', note: 'An old saying: a little, every day, wins. Mr. Fumita read to the rabbits every day until his voice came back.' },
  };
  const rewards = { librarian: { 1: { phrase: 'ph.talk.ja.narauyori', coins: 5 }, 2: { phrase: 'ph.talk.ja.dokusho', coins: 10 }, 3: { phrase: 'ph.talk.ja.keizoku', coins: 15 } } };
  TALK.content('ja', { scenes: [lib1, lib2, lib3], memories, phrases, rewards });
})();

// ============================================================================ small talk with anyone in town (after the big one on the hill)
// Generic: no names they couldn't know, and nothing that genders the speaker (anyone, young or old, may say these lines).
// Strangers speak politely. Rooted in everyday Japanese small talk: the weather («いい天気ですね» → «そうですね»), «どちらへ?» and
// the polite non-answer «ちょっとそこまで», a compliment on your Japanese and the modest «いえいえ、まだまだです», the seasons.
(() => {
  if (typeof TALK === 'undefined') return;
  const PLACES = ['家', 'うち', '市場', '広場', 'パン屋', '果物屋', '図書館', '森', '塔', '野原', '風車', '湖', '池', '丘', 'モリナール', 'レマンソ', '散歩', '店', '公園', '駅', '神社', 'そこ', 'ちょっと'];
  const small = [
    // ---------------------------------------------------------------- A1
    { id: 'ja.s1.tenki', band: 1, title: { en: 'Nice weather, isn’t it?' },
      turns: [
        { id: 'weather', goal: 'They remark on the weather. Agree, the way people do («そうですね»), or say how the weather is for you.',
          ask: ['こんにちは ！ [今日|きょう] は いい [天気|てんき] です ね 。', 'Hello! Lovely weather today, isn’t it.'],
          simpler: ['いい [天気|てんき] です ね 。 そう [思|おも]います か ？', 'Nice weather, isn’t it? Do you think so?'],
          want: { any: true },
          starter: ['そう です ね 。 ___ 。', 'It is, isn’t it. ___.'],
          example: ['そう です ね 。 [暖|あたた]かくて 、 [気持|きも]ち いい です 。', 'It is, isn’t it. It’s warm and pleasant.'],
          model: ['そう です ね 。', 'It is, isn’t it.'],
          react: [
            { if: { lemmas: ['暑い', '寒い', '雨', '風'] }, say: [['そう です ね 。 お[体|からだ] に [気|き] を つけて ください ね 。', 'Yes, indeed. Do take care of yourself.']] },
            { if: { neg: true }, say: [['あら 、 そう です か ？ [人|ひと] それぞれ です ね 。', 'Oh, you think not? Everyone’s different, I suppose.']] },
            { say: [['[本当|ほんとう] に 。 こんな [日|ひ] は 、 [散歩|さんぽ] したく なります ね 。', 'Truly. Days like this make you want to go for a walk.']], mood: 'happy' },
          ] },
        { id: 'where', goal: 'Tell them where you’re going (or just «ちょっとそこまで», the polite way to keep it to yourself).',
          ask: ['どちら へ お[出|で]かけ です か ？', 'Where are you off to?'],
          simpler: ['どこ へ [行|い]きます か ？', 'Where are you going?'],
          want: { topic: ['place', 'town'], lemmas: PLACES },
          starter: ['___ へ [行|い]きます 。', 'I’m going to ___.'],
          example: ['ちょっと そこ まで 。 パン[屋|や] へ [行|い]きます 。', 'Just over there. I’m going to the bakery.'],
          model: ['[図書館|としょかん] へ [行|い]きます 。', 'I’m going to the library.'],
          react: [
            { if: { lemmas: ['パン屋', 'パン'] }, say: [['マルタ さん の パン ！ いい です ね 。 いってらっしゃい 。', 'Marta’s bread! Lovely. Off you go.']], mood: 'happy' },
            { if: { lemmas: ['塔'] }, say: [['[古|ふる]い [塔|とう] へ ？ [危|あぶ]ない です よ 。 [気|き] を つけて 。', 'To the old tower? It’s dangerous. Be careful.']], mood: 'surprised' },
            { if: { lemmas: ['ちょっと', 'そこ'] }, say: [['ふふ 、 「 ちょっと そこ まで 」 です ね 。 いってらっしゃい 。', 'Hehe, “just over there”, I see. Off you go.']], mood: 'happy' },
            { say: [['そう です か 。 いってらっしゃい ！', 'I see. Off you go, then!']] },
          ] },
      ],
      close: [['では 、 また 。', 'Well, see you.']] },
    { id: 'ja.s1.tabemono', band: 1, title: { en: 'Food and drinks' },
      turns: [
        { id: 'food', goal: 'Tell them what food you like.',
          ask: ['こんにちは 。 [好|す]きな [食|た]べ[物|もの] は [何|なん] です か ？', 'Hello. What’s your favorite food?'],
          simpler: ['パン ？ ご[飯|はん] ？ [何|なに] が [好|す]き です か ？', 'Bread? Rice? What do you like?'],
          want: { topic: 'food', lemmas: ['全部', '何'] },
          starter: ['___ が [好|す]き です 。', 'I like ___.'],
          example: ['お[寿司|すし] と ラーメン が [大好|だいす]き です 。', 'I love sushi and ramen.'],
          model: ['カレー が [好|す]き です 。', 'I like curry.'],
          remember: { food: 'match' },
          react: [
            { if: { neg: true, test: r => !JA_TALK.mixed(r) }, say: [['そう です か 。 [好|この]み は [人|ひと] それぞれ です ね 。', 'I see. Everyone has their own taste.']] },
            { say: [['{echo|いい です ね ！} わたし も [好|す]き です 。', '{echo|Sounds good!} I like that too.']], mood: 'happy' },
          ] },
        { id: 'drink', goal: 'Tea or coffee? Tell them what you like to drink.',
          ask: ['[飲|の]み[物|もの] は ？ お[茶|ちゃ] と コーヒー 、 どっち が [好|す]き です か ？', 'And to drink? Which do you like better, tea or coffee?'],
          simpler: ['お[茶|ちゃ] ？ コーヒー ？ ジュース ？', 'Tea? Coffee? Juice?'],
          want: { topic: 'drink', lemmas: ['お茶', '茶', '紅茶', 'コーヒー', '水', 'お水', '牛乳', 'ミルク', 'ジュース', '麦茶', 'ウーロン茶', 'ソーダ', '両方', 'どっち'] },
          starter: ['___ の ほう が [好|す]き です 。', 'I like ___ better.'],
          example: ['お[茶|ちゃ] の ほう が [好|す]き です 。 [夏|なつ] は [冷|つめ]たい [麦茶|むぎちゃ] が [一番|いちばん] です 。', 'I like tea better. In summer, cold barley tea is the best.'],
          model: ['お[茶|ちゃ] が [好|す]き です 。', 'I like tea.'],
          react: [
            { if: { lemmas: ['麦茶'] }, say: [['[麦茶|むぎちゃ] ！ [夏|なつ] の [味|あじ] です ね 。', 'Barley tea! The taste of summer.']], mood: 'happy' },
            { if: { lemmas: ['お茶', '茶', '紅茶'] }, say: [['わたし も です 。 お[茶|ちゃ] を [飲|の]む と 、 ほっと します よ ね 。', 'Me too. A cup of tea always helps you relax, doesn’t it.']], mood: 'happy' },
            { if: { lemmas: ['コーヒー'] }, say: [['コーヒー ！ [朝|あさ] は 、 あれ が ない と [起|お]きられません よ ね 。', 'Coffee! Without it, you can’t get up in the morning, right?']], mood: 'happy' },
            { say: [['いい です ね 。', 'Sounds nice.']] },
          ] },
      ],
      close: [['なんだか お[腹|なか] が すいて きました 。 では 、 また ！', 'All this is making me hungry. See you!']] },
    { id: 'ja.s1.jouzu', band: 1, title: { en: '“Your Japanese is so good!”' },
      turns: [
        { id: 'jouzu', goal: 'They compliment your Japanese. Answer modestly, the way people do («いえいえ、まだまだです»).',
          ask: ['あれ ？ [日本語|にほんご] 、 お[上手|じょうず] です ね ！', 'Oh? Your Japanese is very good!'],
          simpler: ['[日本語|にほんご] が [上手|じょうず] です ね 。', 'Your Japanese is good.'],
          want: { any: true },
          starter: ['いえいえ 、 ___ 。', 'Oh no, ___.'],
          example: ['いえいえ 、 まだまだ です 。 [毎日|まいにち] [練習|れんしゅう] して います 。', 'Oh no, I still have a long way to go. I practice every day.'],
          model: ['いえいえ 、 まだまだ です 。', 'Oh no, I still have a long way to go.'],
          react: [
            { if: { lemmas: ['まだ', 'まだまだ'] }, say: [['ふふ 、 その [答|こた]え も 、 ばっちり です ね ！', 'Hehe, that answer is spot on too!']], mood: 'happy' },
            { if: { lemmas: ['ありがとう', 'ありがとうございます'] }, say: [['どういたしまして 。 [本当|ほんとう] に お[上手|じょうず] です よ 。', 'You’re welcome. You really are good.']], mood: 'happy' },
            { say: [['いえいえ 、 [本当|ほんとう] です よ 。', 'No, no, I mean it.']], mood: 'happy' },
          ] },
        { id: 'from', goal: 'Tell them where you’re from.',
          ask: ['どちら から いらっしゃいました か ？', 'Where are you from?'],
          simpler: ['どこ から [来|き]ました か ？', 'Where did you come from?'],
          want: { name: true, topic: 'place', lemmas: ['国', '町', '遠い', '外国', '村', '田舎', '都会', '島', '出身'] },
          starter: ['___ から [来|き]ました 。', 'I came from ___.'],
          example: ['カナダ から [来|き]ました 。 [冬|ふゆ] が とても [寒|さむ]い [国|くに] です 。', 'I came from Canada. It’s a country with very cold winters.'],
          model: ['[遠|とお]い [国|くに] から [来|き]ました 。', 'I came from a faraway country.'],
          react: [
            { if: { name: true }, say: [['まあ 、 [遠|とお]く から ！ ようこそ 、 アルバ へ 。', 'My, from so far away! Welcome to Alba.']], mood: 'surprised' },
            { say: [['そう です か 。 ゆっくり して いって ください ね 。', 'I see. Do make yourself at home.']] },
          ] },
        { id: 'long', goal: 'How long have you been learning Japanese? (三か月, 一年, 二週間…)',
          ask: ['[日本語|にほんご] は 、 どの くらい [勉強|べんきょう] して います か ？', 'How long have you been studying Japanese?'],
          simpler: ['[一年|いちねん] ？ [二年|にねん] ？ どの くらい です か ？', 'One year? Two? How long?'],
          want: { number: true, lemmas: ['少し', 'ちょっと', '最近', '始める'] },
          starter: ['___ ぐらい です 。', 'About ___.'],
          example: ['[三|さん]か[月|げつ] ぐらい です 。 まだ [始|はじ]めた ばかり です 。', 'About three months. I’ve only just started.'],
          model: ['[一年|いちねん] です 。', 'One year.'],
          react: [
            { if: { lemmas: ['最近', '始める', '少し', 'ちょっと'] }, say: [['それ で その [日本語|にほんご] ？ すごい ！', 'And you already speak like that? Amazing!']], mood: 'surprised' },
            { say: [['すごい ！ その [調子|ちょうし] です 。', 'Amazing! Keep it up.']], mood: 'happy' },
          ] },
      ],
      close: [['がんばって ください ね ！', 'Keep at it!']] },
    { id: 'ja.s1.mimo', band: 1, title: { en: 'Your little friend' },
      turns: [
        { id: 'name', goal: 'Tell them your little friend’s name.',
          ask: ['わあ 、 かわいい ！ この [子|こ] 、 お[名前|なまえ] は ？', 'Aww, how cute! What’s its name?'],
          simpler: ['この [子|こ] の [名前|なまえ] は [何|なん] です か ？', 'What is this little one’s name?'],
          want: { name: true, lemmas: ['ミモ', '名前'], any: true },
          starter: ['___ と [言|い]います 。', 'Its name is ___.'],
          example: ['{mimo} と [言|い]います 。 わたし の [一番|いちばん] の [友達|ともだち] です 。', 'Its name is {mimo}. It’s my best friend.'],
          model: ['{mimo} です 。', 'It’s {mimo}.'],
          react: [{ say: [['{mimo} ちゃん ！ かわいい [名前|なまえ] です ね 。', '{mimo}! What a cute name.']], mood: 'happy' }] },
        { id: 'eat', goal: 'Tell them what {mimo} eats.',
          ask: ['[何|なに] を [食|た]べる ん です か ？', 'What does it eat?'],
          simpler: ['[果物|くだもの] ？ パン ？ [何|なに] を [食|た]べます か ？', 'Fruit? Bread? What does it eat?'],
          want: { topic: 'food', lemmas: ['全部', '何', '言葉'] },
          starter: ['___ を [食|た]べます 。', 'It eats ___.'],
          example: ['[何|なん]でも [食|た]べます 。 でも 、 りんご が [一番|いちばん] [好|す]き です 。', 'It eats everything. But it likes apples best.'],
          model: ['[果物|くだもの] を [食|た]べます 。', 'It eats fruit.'],
          react: [
            { if: { lemmas: ['言葉'] }, say: [['[言葉|ことば] を ？ ふふ 、 おもしろい ！', 'Words? Hehe, how funny!']], mood: 'happy' },
            { say: [['へえ ！ かわいい です ね 。', 'Oh, how cute!']], mood: 'happy' },
          ] },
        { id: 'met', goal: 'Where did you meet {mimo}? Tell them.',
          ask: ['どこ で [会|あ]った ん です か ？', 'Where did you two meet?'],
          simpler: ['この [子|こ] と は 、 どこ で [会|あ]いました か ？', 'Where did you meet this little one?'],
          want: { any: true },
          starter: ['___ で [会|あ]いました 。', 'We met at ___.'],
          example: ['[駅|えき] で [会|あ]いました 。 [卵|たまご] から [生|う]まれた ん です 。', 'We met at the station. It hatched from an egg.'],
          model: ['[森|もり] で [会|あ]いました 。', 'We met in the forest.'],
          react: [
            { if: { lemmas: ['卵', '生まれる'] }, say: [['[卵|たまご] から ？ [信|しん]じられない ！ すごい お[話|はなし] です ね 。', 'From an egg? Unbelievable! What a story.']], mood: 'surprised' },
            { say: [['そう です か 。 [仲良|なかよ]し です ね 。', 'I see. You two are good friends.']], mood: 'happy' },
          ] },
      ],
      close: [['じゃあ 、 またね 、 {mimo} ちゃん ！', 'Bye for now, {mimo}!']] },
    // ---------------------------------------------------------------- A2: the past and plans come in
    { id: 'ja.s2.kinou', band: 2, title: { en: 'Yesterday and tomorrow' },
      turns: [
        { id: 'yesterday', goal: 'Tell them what you did yesterday (in the past).',
          ask: ['こんにちは 。 [昨日|きのう] は [何|なに] を しました か ？', 'Hello. What did you do yesterday?'],
          simpler: ['[昨日|きのう] 、 [散歩|さんぽ] しました か ？ [仕事|しごと] ？ [何|なに] を しました か ？', 'Yesterday, did you take a walk? Work? What did you do?'],
          want: { any: true, time: 'past' },
          tips: { time: 'It’s about yesterday: use the past, like «行きました», «買いました».' },
          starter: ['[昨日|きのう] は ___ 。', 'Yesterday I ___.'],
          example: ['[昨日|きのう] は モリナール の [市場|いちば] へ [行|い]って 、 はちみつ を [買|か]いました 。', 'Yesterday I went to Molinar’s market and bought honey.'],
          model: ['[昨日|きのう] は [森|もり] を [散歩|さんぽ] しました 。', 'Yesterday I took a walk in the forest.'],
          react: [
            { if: { lemmas: ['はちみつ', '市場'] }, say: [['モリナール の はちみつ ！ あれ は [本当|ほんとう] に おいしい です よ ね 。', 'Molinar honey! It’s really delicious, isn’t it.']], mood: 'happy' },
            { say: [['へえ 、 いい [一日|いちにち] でした ね 。', 'Oh, sounds like a good day.']] },
          ] },
        { id: 'tomorrow', goal: 'Tell them your plan for tomorrow («…予定です», «…つもりです»).',
          ask: ['[明日|あした] は 、 [何|なに] を する [予定|よてい] です か ？', 'What are your plans for tomorrow?'],
          simpler: ['[明日|あした] は [何|なに] を します か ？', 'What will you do tomorrow?'],
          want: { any: true },
          starter: ['[明日|あした] は ___ [予定|よてい] です 。', 'Tomorrow I plan to ___.'],
          example: ['[明日|あした] は [友達|ともだち] と [湖|みずうみ] へ [行|い]く [予定|よてい] です 。 [天気|てんき] が いい と いい です ね 。', 'Tomorrow I’m going to the lake with a friend. I hope the weather’s good.'],
          model: ['[明日|あした] は [休|やす]む [予定|よてい] です 。', 'Tomorrow I plan to rest.'],
          react: [
            { if: { lemmas: ['休む', '寝る'] }, say: [['それ が [一番|いちばん] です 。 ゆっくり [休|やす]んで ください 。', 'That’s the best plan. Get some good rest.']], mood: 'happy' },
            { say: [['いい です ね ！ [楽|たの]しんで ください 。', 'Sounds great! Enjoy it.']], mood: 'happy' },
          ] },
      ],
      close: [['では 、 また 。 お[気|き] を つけて 。', 'Well, see you. Take care.']] },
    { id: 'ja.s2.shumi', band: 2, title: { en: 'Hobbies' },
      turns: [
        { id: 'hobby', goal: 'Tell them about your hobby.',
          ask: ['ご[趣味|しゅみ] は [何|なん] です か ？', 'What are your hobbies?'],
          simpler: ['[休|やす]み の [日|ひ] は 、 [何|なに] を します か ？', 'What do you do on your days off?'],
          want: { topic: ['hobby', 'sport', 'music', 'art', 'story'], lemmas: ['読む', '歌う', '料理', '料理する', '散歩', '散歩する', '旅行', '旅行する', '泳ぐ', '走る', '描く', '写真', '撮る', '踊る', '釣る', '映画', 'ゲーム', '本', '音楽', '趣味'] },
          starter: ['___ が [趣味|しゅみ] です 。 ／ ___ の が [好|す]き です 。', 'My hobby is ___. / I like ___ing.'],
          example: ['[写真|しゃしん] を [撮|と]る の が [趣味|しゅみ] です 。 [特|とく]に 、 [山|やま] の [写真|しゃしん] が [好|す]き です 。', 'My hobby is taking photos. I especially like photos of mountains.'],
          model: ['[料理|りょうり] が [趣味|しゅみ] です 。', 'My hobby is cooking.'],
          react: [
            { if: { lemmas: ['料理', '料理する'] }, say: [['[料理|りょうり] ！ [得意|とくい] な [料理|りょうり] は [何|なん] です か ？ [今度|こんど] 、 [教|おし]えて ください 。', 'Cooking! What’s your best dish? Teach me sometime.']], mood: 'happy' },
            { if: { lemmas: ['読む', '本', '小説', '漫画'] }, say: [['[本|ほん] なら 、 [北|きた] の [通|とお]り の [図書館|としょかん] が おすすめ です よ 。', 'If it’s books you like, try the library on the north street.']], mood: 'happy' },
            { say: [['すてき ！ いい [趣味|しゅみ] です ね 。', 'Lovely! What a nice hobby.']], mood: 'happy' },
          ] },
        { id: 'since', goal: 'Since when? Answer with «…からです» or «…前に始めました».',
          ask: ['いつ から です か ？', 'Since when?'],
          simpler: ['[子供|こども] の [頃|ころ] から ？ [最近|さいきん] ？', 'Since you were a child? Recently?'],
          want: { any: true },
          starter: ['___ から です 。', 'Since ___.'],
          example: ['[高校|こうこう] の [時|とき] から です 。 [友達|ともだち] に [教|おし]えて もらいました 。', 'Since high school. A friend taught me.'],
          model: ['[子供|こども] の [頃|ころ] から です 。', 'Since I was a child.'],
          react: [
            { if: { lemmas: ['最近', '先月', '先週', '去年'] }, say: [['[始|はじ]めた ばかり ！ これ から が [楽|たの]しみ です ね 。', 'You’ve only just started! The best is yet to come.']], mood: 'happy' },
            { say: [['[長|なが]い です ね ！ [続|つづ]けて いる の は 、 すごい です 。', 'That’s a long time! It’s great that you’ve kept it up.']], mood: 'happy' },
          ] },
      ],
      close: [['いい お[話|はなし] を [聞|き]きました 。 では 、 また ！', 'That was nice to hear. See you!']] },
    { id: 'ja.s2.kisetsu', band: 2, title: { en: 'The seasons' },
      turns: [
        { id: 'season', goal: 'Which season do you like best? Say why («…から»).',
          ask: ['アルバ は 、 [季節|きせつ] が きれい です ね 。 あなた は 、 どの [季節|きせつ] が [一番|いちばん] [好|す]き です か ？', 'Alba is lovely in every season. Which season do you like best?'],
          simpler: ['[春|はる] ？ [夏|なつ] ？ [秋|あき] ？ [冬|ふゆ] ？', 'Spring? Summer? Autumn? Winter?'],
          want: { lemmas: ['春', '夏', '秋', '冬', '季節', '全部'], reason: true },
          tips: { reason: 'Add why, with «…から».' },
          starter: ['___ が [一番|いちばん] [好|す]き です 。 ___ から です 。', 'I like ___ best. Because ___.'],
          example: ['[秋|あき] が [一番|いちばん] [好|す]き です 。 [涼|すず]しくて 、 [紅葉|こうよう] が きれい です から 。', 'I like autumn best. Because it’s cool, and the autumn leaves are beautiful.'],
          model: ['[夏|なつ] が [好|す]き です 。 お[祭|まつ]り が ある から です 。', 'I like summer. Because there are festivals.'],
          react: [
            { if: { lemmas: ['春'] }, say: [['[春|はる] は [桜|さくら] です ね 。 お[花見|はなみ] 、 したい です ね え 。', 'Spring means cherry blossoms. I’d love to go blossom-viewing.']], mood: 'happy' },
            { if: { lemmas: ['夏'] }, say: [['[夏|なつ] は お[祭|まつ]り と [花火|はなび] ！ いい です ね 。', 'Summer: festivals and fireworks! Lovely.']], mood: 'happy' },
            { if: { lemmas: ['秋'] }, say: [['[秋|あき] は 、 [食|た]べ[物|もの] が おいしい です よ ね 。', 'In autumn the food is so good, isn’t it.']], mood: 'happy' },
            { if: { lemmas: ['冬'] }, say: [['[冬|ふゆ] は [雪|ゆき] が きれい です ね 。 [雪|ゆき]だるま を [作|つく]りたく なります 。', 'In winter the snow is beautiful. It makes you want to build a snowman.']], mood: 'happy' },
            { say: [['なるほど 。 どの [季節|きせつ] も 、 いい ところ が あります ね 。', 'I see. Every season has its good points.']] },
          ] },
        { id: 'do', goal: 'What do you often do in that season?',
          ask: ['その [季節|きせつ] に は 、 よく [何|なに] を します か ？', 'What do you often do in that season?'],
          simpler: ['その [季節|きせつ] 、 [何|なに] を します か ？', 'What do you do in that season?'],
          want: { any: true },
          starter: ['よく ___ 。', 'I often ___.'],
          example: ['よく [山|やま] へ [行|い]って 、 [写真|しゃしん] を [撮|と]ります 。 あたたかい お[茶|ちゃ] を [飲|の]みながら 、 [本|ほん] も [読|よ]みます 。', 'I often go to the mountains and take photos. I also read, with a cup of warm tea.'],
          model: ['よく [散歩|さんぽ] を します 。', 'I often take walks.'],
          react: [{ say: [['いい です ね 。 [季節|きせつ] を [楽|たの]しんで います ね 。', 'How nice. You really enjoy the seasons.']], mood: 'happy' }] },
      ],
      close: [['[季節|きせつ] の [変|か]わり[目|め] です から 、 [風邪|かぜ] に [気|き] を つけて ！', 'The seasons are changing, so watch out for colds!']] },
    // ---------------------------------------------------------------- B1: reasons, opinions, stories
    { id: 'ja.s3.tabi', band: 3, title: { en: 'Your journey so far' },
      turns: [
        { id: 'best', goal: 'Of the places you’ve been, which was best, and why? («…が一番よかったです。…から»)',
          ask: ['[旅|たび] を して いる ん です よ ね 。 [今|いま] まで で 、 どこ が [一番|いちばん] よかった です か ？ どうして ？', 'You’re traveling, aren’t you. Of everywhere so far, where was best? Why?'],
          simpler: ['どこ が [一番|いちばん] よかった です か ？', 'Where was the best?'],
          want: { any: true, reason: true },
          tips: { reason: 'Add why, with «…から» or «…ので».' },
          starter: ['___ が [一番|いちばん] よかった です 。 ___ から です 。', '___ was the best. Because ___.'],
          example: ['レマンソ が [一番|いちばん] よかった です 。 [湖|みずうみ] が [静|しず]か で 、 [夕日|ゆうひ] が とても きれい だった から です 。', 'Remanso was the best. Because the lake was calm and the sunset was beautiful.'],
          model: ['モリナール が よかった です 。 [市場|いちば] が [楽|たの]しかった から です 。', 'Molinar was great. Because the market was fun.'],
          react: [
            { if: { lemmas: ['モリナール', '風車', '市場'] }, say: [['モリナール の [風車|ふうしゃ] ！ [一度|いちど] [見|み]て みたい です 。', 'Molinar’s windmills! I’d love to see them once.']], mood: 'happy' },
            { if: { lemmas: ['レマンソ', '湖'] }, say: [['レマンソ の [湖|みずうみ] は 、 [鏡|かがみ] みたい だ そう です ね 。', 'They say Remanso’s lake is like a mirror.']], mood: 'happy' },
            { if: { lemmas: ['アルバ'] }, say: [['アルバ ！ うれしい こと を [言|い]って くれます ね 。', 'Alba! What a nice thing to say.']], mood: 'happy' },
            { say: [['[行|い]って みたく なりました 。', 'Now I want to go there.']] },
          ] },
        { id: 'next', goal: 'Where are you planning to go next? Use «つもり» or «予定».',
          ask: ['これ から 、 どこ へ [行|い]く つもり です か ？', 'Where are you planning to go next?'],
          simpler: ['[次|つぎ] は どこ へ [行|い]きます か ？', 'Where will you go next?'],
          want: { any: true, time: 'future' },
          tips: { time: 'Say it as a plan: «…へ行くつもりです» or «…へ行く予定です».' },
          starter: ['___ へ [行|い]く つもり です 。', 'I’m planning to go to ___.'],
          example: ['[北|きた] の [古|ふる]い [塔|とう] へ [行|い]く つもり です 。 [友達|ともだち] を [探|さが]して いる ん です 。', 'I’m planning to go to the old tower up north. I’m looking for a friend.'],
          model: ['[山|やま] の ほう へ [行|い]く [予定|よてい] です 。', 'I’m planning to head toward the mountains.'],
          react: [
            { if: { lemmas: ['塔'] }, say: [['あの [塔|とう] へ ？ … [無理|むり] を しないで ください ね 。', 'To that tower? …Please don’t take any risks.']], mood: 'sad' },
            { say: [['いい [旅|たび] に なります よう に 。', 'I hope it’s a good journey.']], mood: 'happy' },
          ] },
        { id: 'miss', goal: 'What do you miss most while you’re traveling, and why? («…が恋しいです»)',
          ask: ['[旅|たび] を して いる と 、 [何|なに] が [一番|いちばん] [恋|こい]しく なります か ？', 'When you’re traveling, what do you miss the most?'],
          simpler: ['[家|いえ] の [何|なに] が [恋|こい]しい です か ？ [家族|かぞく] ？ ご[飯|はん] ？', 'What do you miss from home? Family? The food?'],
          want: { any: true },
          starter: ['___ が [一番|いちばん] [恋|こい]しい です 。', 'What I miss most is ___.'],
          example: ['[母|はは] の [料理|りょうり] が [一番|いちばん] [恋|こい]しい です 。 [特|とく]に 、 [寒|さむ]い [日|ひ] の スープ です 。', 'I miss my mom’s cooking most. Especially her soup on cold days.'],
          model: ['[家族|かぞく] が [恋|こい]しい です 。', 'I miss my family.'],
          react: [
            { if: { lemmas: ['家族', '母', '父', 'お母さん', 'お父さん', '兄弟', '友達'] }, say: [['わかります 。 [遠|とお]く に いる と 、 もっと [大切|たいせつ] に [感|かん]じます よ ね 。', 'I understand. When you’re far away, they feel even more precious.']], mood: 'sad' },
            { if: { lemmas: ['料理', 'ご飯', 'スープ', '味'] }, say: [['[故郷|ふるさと] の [味|あじ] は 、 [忘|わす]れられません よ ね 。', 'You never forget the taste of home.']] },
            { say: [['そう です か 。 いつか 、 [帰|かえ]れます よう に 。', 'I see. I hope you can go back one day.']] },
          ] },
      ],
      close: [['[気|き] を つけて 、 いい [旅|たび] を ！', 'Take care, and have a good journey!']] },
    { id: 'ja.s3.nihongo', band: 3, title: { en: 'Learning Japanese' },
      turns: [
        { id: 'hard', goal: 'What do you think is hardest about Japanese, and why? («…と思います。…から»)',
          ask: ['[日本語|にほんご] の [勉強|べんきょう] は 、 [何|なに] が [一番|いちばん] [難|むずか]しい と [思|おも]います か ？ どうして ？', 'What do you think is the hardest thing about learning Japanese? Why?'],
          simpler: ['[漢字|かんじ] ？ [敬語|けいご] ？ [何|なに] が [難|むずか]しい です か ？', 'Kanji? Keigo? What’s hard?'],
          want: { any: true, opinion: true, reason: true },
          tips: { opinion: 'Say what you think: «…と思います».', reason: 'Add why, with «…から».' },
          starter: ['___ が [一番|いちばん] [難|むずか]しい と [思|おも]います 。 ___ から です 。', 'I think ___ is the hardest. Because ___.'],
          example: ['[敬語|けいご] が [一番|いちばん] [難|むずか]しい と [思|おも]います 。 [相手|あいて] が [変|か]わる と 、 [話|はな]し[方|かた] も [変|か]わる から です 。', 'I think keigo is the hardest. Because when the person you’re talking to changes, the way you speak changes too.'],
          model: ['[漢字|かんじ] が [一番|いちばん] [難|むずか]しい と [思|おも]います 。 [数|かず] が [多|おお]い から です 。', 'I think kanji are the hardest. Because there are so many of them.'],
          react: [
            { if: { lemmas: ['漢字'] }, say: [['わかります 。 でも 、 [一|ひと]つ [覚|おぼ]える たび に 、 [世界|せかい] が [少|すこ]し [広|ひろ]がります よ 。', 'I understand. But every one you learn makes the world a little bigger.']] },
            { if: { lemmas: ['敬語'] }, say: [['[敬語|けいご] は 、 ここ で [生|う]まれ[育|そだ]った [人|ひと] に も [難|むずか]しい ん です よ 。 [安心|あんしん] して ください 。', 'Keigo is hard even for people born and raised here, you know. Rest easy.']], mood: 'happy' },
            { if: { lemmas: ['聞く', '速い', '早い'] }, say: [['[速|はや]い [話|はなし] は 、 [大変|たいへん] です よ ね 。 ゆっくり [話|はな]します ね 。', 'Fast talk is tough, isn’t it. I’ll speak slowly.']] },
            { say: [['なるほど 。 でも 、 とても [上手|じょうず] です よ 。', 'I see. But you’re very good.']] },
          ] },
        { id: 'how', goal: 'How do you usually study? Tell them your methods.',
          ask: ['ふだん は 、 どうやって [勉強|べんきょう] して います か ？', 'How do you usually study?'],
          simpler: ['[本|ほん] ？ アニメ ？ どうやって [勉強|べんきょう] して います か ？', 'Books? Anime? How do you study?'],
          want: { any: true },
          starter: ['___ で [勉強|べんきょう] して います 。', 'I study with ___.'],
          example: ['[毎朝|まいあさ] 、 [単語|たんご] を [十個|じゅっこ] [覚|おぼ]えて 、 [夜|よる] は アニメ を [日本語|にほんご] で [見|み]て います 。', 'Every morning I learn ten words, and at night I watch anime in Japanese.'],
          model: ['[本|ほん] を [読|よ]んで 、 [勉強|べんきょう] して います 。', 'I study by reading books.'],
          react: [
            { if: { lemmas: ['アニメ', '漫画', 'ゲーム', '歌'] }, say: [['いい です ね 。 [楽|たの]しく [勉強|べんきょう] できます ね 。', 'Nice. That way studying is fun.']], mood: 'happy' },
            { if: { lemmas: ['本', '読む', '小説'] }, say: [['[図書館|としょかん] の [文田|ふみた] さん に 、 [聞|き]いて みて ください 。 いい [本|ほん] を たくさん [知|し]って います よ 。', 'Ask Mr. Fumita at the library. He knows lots of good books.']], mood: 'happy' },
            { say: [['いい [方法|ほうほう] です ね 。 [続|つづ]ける の が [一番|いちばん] [大切|たいせつ] です 。', 'Good method. Keeping it up is what matters most.']] },
          ] },
        { id: 'use', goal: 'Once you’re good at it, what do you want to do in Japanese? («…たら、…たいです»)',
          ask: ['もっと [上手|じょうず] に なったら 、 [日本語|にほんご] で [何|なに] を したい です か ？', 'Once you’re even better, what would you like to do in Japanese?'],
          simpler: ['[日本語|にほんご] で 、 [何|なに] が したい です か ？', 'What do you want to do in Japanese?'],
          want: { any: true },
          starter: ['[上手|じょうず] に なったら 、 ___ たい です 。', 'Once I’m good at it, I want to ___.'],
          example: ['[上手|じょうず] に なったら 、 [字幕|じまく] なし で [映画|えいが] を [見|み]たい です 。 それ から 、 [日本|にほん] を [旅行|りょこう] したい です 。', 'Once I’m good at it, I want to watch films without subtitles. And then I want to travel around Japan.'],
          model: ['[日本語|にほんご] で [友達|ともだち] と [話|はな]したい です 。', 'I want to talk with friends in Japanese.'],
          react: [
            { if: { lemmas: ['旅行', '旅行する', '旅'] }, say: [['いい です ね 。 きっと [楽|たの]しい [旅|たび] に なります よ 。', 'Lovely. I’m sure it’ll be a wonderful trip.']], mood: 'happy' },
            { say: [['その [日|ひ] は 、 すぐ [来|き]ます よ 。', 'That day will come soon.']], mood: 'happy' },
          ] },
      ],
      close: [['[応援|おうえん] して います ！ がんばって ください ね 。', 'I’m rooting for you! Keep at it.']] },
    { id: 'ja.s3.ame', band: 3, title: { en: 'Rainy days' },
      turns: [
        { id: 'rainy', goal: 'How do you spend rainy days?',
          ask: ['[最近|さいきん] 、 [雨|あめ] が [多|おお]い です ね 。 [雨|あめ] の [日|ひ] は 、 [何|なに] を して [過|す]ごします か ？', 'It’s been raining a lot lately. How do you spend rainy days?'],
          simpler: ['[雨|あめ] の [日|ひ] 、 [何|なに] を します か ？', 'What do you do on rainy days?'],
          want: { any: true },
          starter: ['[雨|あめ] の [日|ひ] は 、 ___ 。', 'On rainy days, I ___.'],
          example: ['[雨|あめ] の [日|ひ] は 、 [家|いえ] で [本|ほん] を [読|よ]んで 、 [料理|りょうり] も します 。 [雨|あめ] の [音|おと] を [聞|き]く の が [好|す]き です 。', 'On rainy days I read at home, and cook too. I like listening to the sound of the rain.'],
          model: ['[家|いえ] で [映画|えいが] を [見|み]ます 。', 'I watch movies at home.'],
          react: [{ say: [['いい です ね 。 [雨|あめ] の [日|ひ] は 、 [時間|じかん] が ゆっくり [流|なが]れます ね 。', 'Nice. On rainy days, time flows slowly, doesn’t it.']], mood: 'happy' }] },
        { id: 'kid', goal: 'What did you do on rainy days as a child? (in the past: «…ていました»)',
          ask: ['[子供|こども] の [頃|ころ] 、 [雨|あめ] の [日|ひ] は 、 [何|なに] を して いました か ？', 'When you were a child, what did you do on rainy days?'],
          simpler: ['[小|ちい]さい [頃|ころ] 、 [雨|あめ] の [日|ひ] は ？', 'When you were little, on rainy days?'],
          want: { any: true, time: 'past' },
          tips: { time: 'It’s about your childhood: use the past, like «遊んでいました», «見ていました».' },
          starter: ['[子供|こども] の [頃|ころ] は 、 ___ て いました 。', 'As a kid, I used to ___.'],
          example: ['[子供|こども] の [頃|ころ] は 、 [傘|かさ] を [持|も]って 、 [外|そと] で [遊|あそ]んで いました 。 [服|ふく] が いつも ぬれて いました 。', 'As a kid, I took my umbrella and played outside. My clothes were always soaked.'],
          model: ['[家|いえ] で ゲーム を して いました 。', 'I used to play games at home.'],
          react: [
            { if: { lemmas: ['外', '遊ぶ', '傘'] }, say: [['ふふ 、 お[母|かあ]さん に [怒|おこ]られた でしょう ？', 'Hehe, I bet you got scolded at home.']], mood: 'happy' },
            { say: [['ふふ 、 [懐|なつ]かしい です ね 。', 'Hehe, that brings back memories.']], mood: 'happy' },
          ] },
        { id: 'snow', goal: 'Rain or snow: which do you prefer, and why? («…のほうが好きです。…から»)',
          ask: ['[雨|あめ] と [雪|ゆき] 、 どっち が [好|す]き です か ？ どうして ？', 'Rain or snow: which do you like better? Why?'],
          simpler: ['[雨|あめ] ？ [雪|ゆき] ？ どっち が [好|す]き ？', 'Rain? Snow? Which do you like?'],
          want: { lemmas: ['雨', '雪', '両方', 'どっち'], reason: true },
          tips: { reason: 'Add why, with «…から».' },
          starter: ['___ の ほう が [好|す]き です 。 ___ から です 。', 'I prefer ___. Because ___.'],
          example: ['[雪|ゆき] の ほう が [好|す]き です 。 [町|まち] が [白|しろ]く なって 、 とても [静|しず]か に なる から です 。', 'I prefer snow. Because the town turns white and goes so quiet.'],
          model: ['[雨|あめ] の ほう が [好|す]き です 。 [涼|すず]しい から です 。', 'I prefer rain. Because it’s cool.'],
          react: [
            { if: { lemmas: ['雪'], neg: false }, say: [['[雪|ゆき] の [日|ひ] の [静|しず]か さ は 、 [静寂|せいじゃく] と は [違|ちが]って 、 [優|やさ]しい です ね 。', 'The quiet of a snowy day isn’t like the Hush. It’s gentle.']] },
            { if: { lemmas: ['雨'], neg: false }, say: [['[雨|あめ] の [音|おと] 、 わたし も [好|す]き です 。', 'I like the sound of rain too.']], mood: 'happy' },
            { say: [['なるほど 。', 'I see.']] },
          ] },
      ],
      close: [['[傘|かさ] 、 [忘|わす]れないで ください ね 。', 'Don’t forget your umbrella.']] },
  ];
  TALK.content('ja', { small });
})();

// ============================================================================ «ぴよ» (the phone): stickers, photos, chats, threads
// The app's own mascot is a round yellow chick (ぴよ is a chick's peep): its stickers (スタンプ) say the things people send in
// Japanese chats. Three threads: Rosa's first texts (after the hill), the neighbors' group (Bruno's morning radio exercises,
// Marta's melon bread), and the 町内会 (the neighborhood association) getting Natsu's summer festival ready: Natsu types on
// her grandpa's phone, Tetsu sends voice notes (he can't type), Shige builds the yagura, Otoha takes the reception desk.
(() => {
  if (typeof PHONE === 'undefined' || !PHONE.art) return;
  const INK = '#2b2235', TAU = Math.PI * 2;
  const FONT = px => `900 ${px}px "Yu Gothic UI", "Yu Gothic", "Meiryo", "Hiragino Sans", "Noto Sans CJK JP", sans-serif`;
  const word = (c, s, x, y, px, fill) => { c.save(); c.font = FONT(px); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = Math.max(5, px / 6); c.strokeStyle = INK; c.strokeText(s, x, y); c.fillStyle = fill; c.fillText(s, x, y); c.restore(); };
  // ぴよ: round and yellow, a tuft, a little orange beak; o: { tilt, eyes: 'happy' | 'sleep' | 'wide', cheer (wings up), extra(c) }
  function chick(c, x, y, s, o = {}) {
    c.save(); c.translate(x, y); c.rotate(o.tilt || 0); c.scale(s, s); c.lineJoin = 'round'; c.lineCap = 'round'; c.lineWidth = 5; c.strokeStyle = INK;
    c.fillStyle = '#ff9f43'; [-1, 1].forEach(k => { c.beginPath(); c.ellipse(k * 20, 50, 12, 6, 0, 0, TAU); c.fill(); c.stroke(); });
    [-1, 1].forEach(k => { c.beginPath(); if (o.cheer) c.ellipse(k * 54, -14, 12, 24, -k * 0.6, 0, TAU); else c.ellipse(k * 50, 10, 12, 22, k * 0.5, 0, TAU); c.fillStyle = '#ffcb3c'; c.fill(); c.stroke(); });
    c.beginPath(); c.arc(0, 0, 50, 0, TAU); c.fillStyle = '#ffe066'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-8, -48); c.quadraticCurveTo(-6, -72, 7, -66); c.quadraticCurveTo(0, -58, 8, -49); c.fillStyle = '#ffe066'; c.fill(); c.stroke();
    c.fillStyle = INK; c.lineWidth = 4.5;
    [-1, 1].forEach(k => { c.beginPath(); if (o.eyes === 'happy') { c.arc(k * 17, -4, 7, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } else if (o.eyes === 'sleep') { c.moveTo(k * 17 - 7, -6); c.quadraticCurveTo(k * 17, 0, k * 17 + 7, -6); c.stroke(); } else if (o.eyes === 'wide') { c.arc(k * 17, -6, 8, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.stroke(); c.beginPath(); c.fillStyle = INK; c.arc(k * 17, -6, 3.5, 0, TAU); c.fill(); } else { c.ellipse(k * 17, -6, 5, 7, 0, 0, TAU); c.fill(); } });
    c.fillStyle = 'rgba(255,120,120,.55)'; [-1, 1].forEach(k => { c.beginPath(); c.ellipse(k * 31, 12, 8, 5, 0, 0, TAU); c.fill(); });
    c.beginPath(); c.moveTo(-9, 5); c.lineTo(9, 5); c.lineTo(0, o.eyes === 'wide' ? 22 : 16); c.closePath(); c.fillStyle = '#ff9f43'; c.fill(); c.lineWidth = 3.5; c.stroke();
    if (o.extra) { c.lineWidth = 4; c.strokeStyle = INK; o.extra(c); }
    c.restore();
  }
  const stk = (s, col, o) => (c, w, h) => { chick(c, w / 2, h / 2 + 36, 1.0, o); word(c, s, w / 2, 42, Math.min(52, Math.floor((w - 26) / [...s].length)), col); };
  const heart = (c, x, y, r, col) => { c.save(); c.translate(x, y); c.beginPath(); c.moveTo(0, r); c.bezierCurveTo(-r * 1.6, -r * 0.1, -r * 0.8, -r * 1.4, 0, -r * 0.5); c.bezierCurveTo(r * 0.8, -r * 1.4, r * 1.6, -r * 0.1, 0, r); c.fillStyle = col; c.fill(); c.stroke(); c.restore(); };
  const spark = (c, x, y, r, col) => { c.save(); c.translate(x, y); c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, q = i % 2 ? r * 0.38 : r; c.lineTo(Math.cos(a) * q, Math.sin(a) * q); } c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 3; c.stroke(); c.restore(); };
  PHONE.art('ja_yoroshiku', stk('よろしく！', '#ff7aa2', { tilt: 0.38, eyes: 'happy' }));
  PHONE.art('ja_ryokai', stk('りょうかい！', '#21a493', { eyes: 'happy', extra: c => { c.save(); c.translate(48, -30); c.rotate(-0.5); c.beginPath(); c.ellipse(0, 0, 11, 20, 0, 0, TAU); c.fillStyle = '#ffcb3c'; c.fill(); c.stroke(); c.restore(); } }));
  PHONE.art('ja_arigato', stk('ありがとう', '#e8457a', { eyes: 'happy', extra: c => { heart(c, 0, 34, 14, '#ff5c8a'); } }));
  PHONE.art('ja_ganbare', stk('がんばれ！', '#ff8a3d', { cheer: true, eyes: 'happy', extra: c => { c.beginPath(); c.rect(-46, -34, 92, 12); c.fillStyle = '#fff'; c.fill(); c.stroke(); c.beginPath(); c.arc(0, -28, 5, 0, TAU); c.fillStyle = '#e8453a'; c.fill(); } }));
  PHONE.art('ja_oyasumi', stk('おやすみ', '#5b6bd6', { eyes: 'sleep', extra: c => { c.beginPath(); c.moveTo(-30, -38); c.quadraticCurveTo(10, -92, 46, -52); c.lineTo(20, -36); c.closePath(); c.fillStyle = '#8fa8ff'; c.fill(); c.stroke(); c.beginPath(); c.arc(48, -52, 7, 0, TAU); c.fillStyle = '#fff'; c.fill(); c.stroke(); c.font = FONT(20); c.fillStyle = '#5b6bd6'; c.fillText('z', 62, -20); c.fillText('z', 74, -36); } }));
  PHONE.art('ja_tanoshimi', stk('たのしみ！', '#f2b01e', { cheer: true, eyes: 'happy', extra: c => { spark(c, -70, -50, 13, '#ffd23f'); spark(c, 72, -56, 10, '#ff8fae'); spark(c, 78, 30, 8, '#7fd6c2'); } }));
  PHONE.art('ja_bikkuri', stk('えっ！？', '#3f7fc9', { eyes: 'wide', extra: c => { [-1, 1].forEach(k => { c.beginPath(); c.moveTo(k * 62, -50); c.lineTo(k * 74, -66); c.moveTo(k * 66, -38); c.lineTo(k * 84, -44); c.stroke(); }); } }));
  // photos (500 × 360): Marta's tray of melon bread and curry buns · Natsu's lanterns at dusk
  PHONE.art('ja_pan', (c, w, h) => {
    c.fillStyle = '#fff1d6'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(232,69,122,.18)'; for (let x = 0; x < w; x += 40) for (let y = 0; y < h; y += 40) if (((x + y) / 40) % 2 === 0) c.fillRect(x, y, 40, 40);
    c.lineJoin = 'round'; c.lineWidth = 6; c.strokeStyle = INK;
    c.beginPath(); c.rect(40, 70, w - 80, h - 120); c.fillStyle = '#b07a4a'; c.fill(); c.stroke();
    for (const [x, y] of [[140, 150], [250, 230]]) {
      c.beginPath(); c.arc(x, y, 62, 0, TAU); c.fillStyle = '#f2d36b'; c.fill(); c.stroke();
      c.save(); c.beginPath(); c.arc(x, y, 58, 0, TAU); c.clip(); c.lineWidth = 3; c.strokeStyle = 'rgba(160,110,40,.7)';
      for (let k = -4; k <= 4; k++) { c.beginPath(); c.moveTo(x + k * 22 - 70, y - 70); c.lineTo(x + k * 22 + 70, y + 70); c.stroke(); c.beginPath(); c.moveTo(x + k * 22 + 70, y - 70); c.lineTo(x + k * 22 - 70, y + 70); c.stroke(); }
      c.restore();
    }
    for (const [x, y] of [[370, 140], [380, 245]]) {
      c.beginPath(); c.ellipse(x, y, 70, 44, -0.15, 0, TAU); c.fillStyle = '#c9822e'; c.fill(); c.stroke();
      c.fillStyle = '#8a5320'; for (let k = 0; k < 14; k++) { const a = k * 2.4, r = 10 + (k * 13) % 30; c.beginPath(); c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, 3.2, 0, TAU); c.fill(); }
    }
  });
  PHONE.art('ja_chouchin', (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3b2f73'); g.addColorStop(0.6, '#c45a8c'); g.addColorStop(1, '#ffb26b'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,244,190,.8)'; for (let i = 0; i < 18; i++) { c.beginPath(); c.arc((i * 97) % w, (i * 53) % (h * 0.45), 1.6 + (i % 3), 0, TAU); c.fill(); }
    c.fillStyle = '#2b2235'; c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * 0.82); c.lineTo(w * 0.25, h * 0.8); c.lineTo(w * 0.3, h * 0.7); c.lineTo(w * 0.36, h * 0.8); c.lineTo(w, h * 0.82); c.lineTo(w, h); c.fill();
    c.lineWidth = 4; c.strokeStyle = INK; c.beginPath(); c.moveTo(-10, 60); c.quadraticCurveTo(w / 2, 150, w + 10, 60); c.stroke();
    for (let i = 0; i < 5; i++) {
      const t = (i + 0.5) / 5, x = t * w, y = 60 + (1 - Math.pow(2 * t - 1, 2)) * 45 + 46;
      const glow = c.createRadialGradient(x, y, 10, x, y, 80); glow.addColorStop(0, 'rgba(255,214,120,.55)'); glow.addColorStop(1, 'rgba(255,214,120,0)'); c.fillStyle = glow; c.fillRect(x - 80, y - 80, 160, 160);
      c.beginPath(); c.moveTo(x, y - 44); c.lineTo(x, y - 30); c.stroke();
      c.beginPath(); c.ellipse(x, y, 28, 32, 0, 0, TAU); c.fillStyle = i % 2 ? '#fff4dc' : '#e8453a'; c.fill(); c.lineWidth = 5; c.stroke();
      c.lineWidth = 2; for (const dy of [-18, -6, 6, 18]) { c.beginPath(); c.ellipse(x, y + dy, Math.sqrt(Math.max(0, 1 - (dy / 32) * (dy / 32))) * 28, 3, 0, 0, Math.PI); c.stroke(); }
      c.lineWidth = 4; c.fillStyle = INK; c.fillRect(x - 15, y - 36, 30, 8); c.fillRect(x - 15, y + 28, 30, 8);
    }
  });
})();

(() => {
  if (typeof TALK === 'undefined') return;
  const chats = {
    rosa: { title: 'ロサ さん', members: ['rosa'], face: 'rosa', sub: { ja: 'オンライン', en: 'online' } },
    alba: { title: 'アルバ ご[近所|きんじょ] 🔔', members: ['rosa', 'baker', 'bruno', 'kid'], avatar: { emoji: '🔔', bg: '#ece4ff' }, group: true },
    chounai: { title: 'アルバ [町内会|ちょうないかい] 🏮', members: ['natsu', 'tetsu', 'shige', 'otoha', 'rosa'], avatar: { emoji: '🏮', bg: '#ffe0d6' }, group: true },
  };
  const members = {
    rosa: { name: 'ロサ', en: 'Rosa', color: '#a3417a', face: 'rosa' }, baker: { name: 'マルタ', en: 'Marta', color: '#b86a1b', face: 'baker' },
    bruno: { name: 'ブルーノ', en: 'Bruno', color: '#2f6fae', face: 'bruno' }, kid: { name: 'ニコ', en: 'Nico', color: '#2e8b57', face: 'kid' },
    natsu: { name: 'ナツ', en: 'Natsu', color: '#d6453a', face: 'natsu', look: { kid: true, skin: '#f6d0ae', hair: '#2b1d24', dress: '#2f5fa8', hairdo: 'pigtails', bg: '#ffe0d6' } },
    tetsu: { name: 'テツ', en: 'Tetsu', color: '#2f3f7a', face: 'tetsu', look: { skin: '#e8b48a', hair: '#e8e4dc', dress: '#2f3f7a', hat: 'band', hatColor: '#fbfbf6', bg: '#e6ecff' } },
    shige: { name: 'シゲ', en: 'Shige', color: '#6b4a2e', face: 'shige', look: { skin: '#e2b088', hair: '#f4f2ee', dress: '#7d9cba', hairdo: 'bald', bg: '#e9f1e4' } },
    otoha: { name: 'オトハ', en: 'Otoha', color: '#13786b', face: 'otoha', look: { kid: true, skin: '#f6d0ae', hair: '#3a2430', dress: '#7fd6c2', hairdo: 'pony', bg: '#fff0f6' } },
  };
  const threads = [
    // ------------------------------------------------------------ Rosa's first texts, after the big one on the hill
    { id: 'ja.rosa.hill', chat: 'rosa', band: 2, when: { contact: 'rosa', flag: 'boss' }, delay: 40,
      steps: [
        { who: 'rosa', t: 'こんにちは ！ ロサ です 🍎 [見|み]て ください 、 メッセージ が [送|おく]れました ！ ニコ ちゃん に [教|おし]えて もらいました 。', en: 'Hello! It’s Rosa 🍎 Look, I managed to send a message! Nico taught me.' },
        { who: 'rosa', t: '[町|まち] の みんな が 、 あなた の [話|はなし] を して います よ 。 [丘|おか] の [大|おお]だまりっこ に [勝|か]った って ！', en: 'The whole town is talking about you. They say you beat the big Hushling on the hill!' },
        { who: 'rosa', sticker: 'ja_bikkuri' },
        { turn: { id: 'how', goal: 'Tell her how it went on the hill.',
          ask: { who: 'rosa', t: 'どう でした か ？ [全部|ぜんぶ] [聞|き]かせて ください ！', en: 'How did it go? Tell me everything!' },
          simpler: { who: 'rosa', t: '[勝|か]ちました か ？ [大変|たいへん] でした か ？', en: 'Did you win? Was it hard?' },
          want: { any: true },
          starter: ['___ でした 。', 'It was ___.'], example: ['[大変|たいへん] でした けど 、 {mimo} が がんばって 、 [勝|か]ちました ！', 'It was tough, but {mimo} did great, and we won!'], model: ['[勝|か]ちました 。 でも 、 [大変|たいへん] でした 。', 'We won. But it was hard.'],
          react: [
            { if: { lemmas: ['勝つ', '倒す', '戦う', 'ジャンプ'] }, say: [{ who: 'rosa', t: 'やっぱり ！ すごい ！ 👏', en: 'I knew it! Amazing! 👏' }] },
            { if: { val: '-' }, say: [{ who: 'rosa', t: 'まあ … 。 でも 、 [無事|ぶじ] で よかった です 。', en: 'Oh dear… But I’m so glad you’re safe.' }] },
            { say: [{ who: 'rosa', t: 'すごい ！ もう [市場|いちば] の みんな に [話|はな]しちゃいました 。 ふふ 。', en: 'Amazing! I’ve already told everyone at the market. Hehe.' }] },
          ] } },
        { who: 'rosa', audio: ['[外|そと] は [危|あぶ]ない です から 、 [気|き] を つけて ね 。 ちゃんと ご[飯|はん] も [食|た]べて ください よ 。 りんご 、 とって おきます から 。', 'It’s dangerous out there, so be careful. And make sure you eat properly. I’m saving some apples for you.'] },
        { turn: { id: 'next', goal: 'Tell her what you plan to do next, with «つもり» («…つもりです»).',
          ask: { who: 'rosa', t: 'これ から 、 どう する つもり です か ？', en: 'What are you planning to do now?' },
          simpler: { who: 'rosa', t: 'どこ へ [行|い]きます か ？ [休|やす]みます か ？', en: 'Where will you go? Will you rest?' },
          want: { any: true, time: 'future' },
          tips: { time: 'Say it as a plan: «…つもりです».' },
          starter: ['___ つもり です 。', 'I’m planning to ___.'], example: ['[東|ひがし] の モリナール へ [行|い]く つもり です 。 [時計屋|とけいや] の シロ さん に [会|あ]いたい です 。', 'I’m planning to go east to Molinar. I want to meet Ciro the clockmaker.'], model: ['[少|すこ]し [休|やす]む つもり です 。', 'I’m planning to rest a little.'],
          react: [
            JA_TALK.keep('next', 'rosa'),
            { if: { lemmas: ['モリナール', 'シロ', '時計屋', '東', '風車'] }, say: [{ who: 'rosa', t: 'モリナール ！ シロ さん に よろしく [伝|つた]えて ください ね 。 [古|ふる]い お[友達|ともだち] な ん です 。', en: 'Molinar! Say hello to Ciro for me. He’s an old friend.' }] },
            { if: { lemmas: ['休む', '寝る'] }, say: [{ who: 'rosa', t: 'それ が いい です 。 ゆっくり [休|やす]んで ね 。', en: 'Good idea. Get some proper rest.' }] },
            { say: [{ who: 'rosa', t: 'がんばって ！ ここ で [待|ま]って います から ね 。', en: 'Good luck! I’ll be right here.' }] },
          ] } },
        { who: 'rosa', sticker: 'ja_ganbare' },
      ] },
    // ------------------------------------------------------------ the neighbors' group: Bruno's morning radio exercises, Marta's bread
    { id: 'ja.alba.group', chat: 'alba', band: 2, when: { contact: 'rosa', flag: 'ch1', after: 'ja.rosa.hill' }, delay: 60,
      steps: [
        { sys: 'ロサ さん が あなた を 「 アルバ ご[近所|きんじょ] 🔔 」 に [招待|しょうたい] しました', en: 'Rosa added you to the group “Alba Neighbors 🔔”' },
        { who: 'rosa', t: 'みなさん 、 [紹介|しょうかい] します ！ {mimo} ちゃん と [一緒|いっしょ] に [来|き]た 、 わたし の [新|あたら]しい お[友達|ともだち] です 🎉', en: 'Everyone, let me introduce someone! My new friend, who came with {mimo} 🎉' },
        { who: 'baker', t: 'はじめまして ！ パン[屋|や] の マルタ です 。 いつ でも [寄|よ]って ください ね 。', en: 'Nice to meet you! I’m Marta from the bakery. Drop by any time.' },
        { who: 'bruno', t: '[明日|あした] の [朝|あさ] [七時|しちじ] 、 [広場|ひろば] で ラジオ [体操|たいそう] ！ [来|く]る [人|ひと] ？', en: 'Tomorrow, 7 a.m., radio exercises in the square! Who’s coming?' },
        { who: 'kid', audio: ['はい ！ はい ！ ぼく も [行|い]く ！ スタンプ カード に 、 はんこ を [押|お]して もらう ん だ ！', 'Me! Me! I’m coming too! I’m going to get a stamp on my stamp card!'] },
        { turn: { id: 'taisou', goal: 'Answer Bruno: are you coming to the morning radio exercises (ラジオ体操) at seven?',
          ask: { who: 'bruno', t: 'あなた は ？ [来|き]ます か ？', en: 'And you? Are you coming?' },
          simpler: { who: 'bruno', t: '[明日|あした] の [朝|あさ] [七時|しちじ] 。 [来|き]ます か ？ はい ？ いいえ ？', en: 'Tomorrow, 7 a.m. Coming? Yes? No?' },
          want: { yesno: true },
          starter: ['はい 、 [行|い]きます 。 ／ すみません 、 ___ から 。', 'Yes, I’ll come. / Sorry, because ___.'], example: ['はい 、 [行|い]きます ！ {mimo} も [連|つ]れて [行|い]きます 。', 'Yes, I’ll be there! I’ll bring {mimo} too.'], model: ['はい 、 [行|い]きます 。', 'Yes, I’ll come.'],
          react: [
            { if: { yes: true }, say: [{ who: 'bruno', t: 'よし ！ [七時|しちじ] に [広場|ひろば] [集合|しゅうごう] ！ 💪', en: 'Great! Seven o’clock, meet in the square! 💪' }, { who: 'baker', t: '[終|お]わったら 、 [焼|や]きたて の パン を [持|も]って いきます ね 。', en: 'Afterwards I’ll bring some fresh bread.' }] },
            { if: { no: true, reason: true }, say: [{ who: 'bruno', t: 'そう か … 。 じゃあ 、 [次|つぎ] は ぜひ ！', en: 'I see… Next time, then!' }] },
            { if: { no: true }, say: [{ who: 'bruno', t: 'えっ 、 [朝|あさ] は [苦手|にがて] ？', en: 'What, not a morning person?' }, { who: 'rosa', t: 'ブルーノ さん 、 [七時|しちじ] は [早|はや]すぎます よ 。 ふふ 。', en: 'Bruno, seven is too early. Hehe.' }] },
            { say: [{ who: 'bruno', t: '[待|ま]って ます よ ！', en: 'I’ll be waiting!' }] },
          ] } },
        { who: 'baker', img: 'ja_pan', t: '[焼|や]きたて ！ メロンパン と カレーパン です 🥐', en: 'Fresh from the oven! Melon bread and curry buns 🥐' },
        { turn: { id: 'pan', goal: 'Tell Marta which you like better: sweet bread (melon bread) or savory (curry buns), and why if you can.',
          ask: { who: 'baker', t: 'みなさん は 、 [甘|あま]い パン と しょっぱい パン 、 どっち が [好|す]き です か ？', en: 'Which do you all like better, sweet bread or savory bread?' },
          simpler: { who: 'baker', t: 'メロンパン ？ カレーパン ？', en: 'Melon bread? Curry bun?' },
          want: { lemmas: ['甘い', 'しょっぱい', 'メロンパン', 'カレーパン', 'あんパン', '両方', 'どっち', '全部', 'パン'] },
          starter: ['___ の ほう が [好|す]き です 。', 'I like ___ better.'], example: ['[甘|あま]い パン の ほう が [好|す]き です 。 メロンパン が [一番|いちばん] です 。', 'I like sweet bread better. Melon bread is the best.'], model: ['カレーパン が [好|す]き です 。', 'I like curry buns.'],
          react: [
            { if: { lemmas: ['甘い', 'メロンパン', 'あんパン'], neg: false }, say: [{ who: 'baker', t: 'やっぱり ！ [明日|あした] 、 [一|ひと]つ とって おきます ね 。', en: 'I knew it! I’ll keep one aside for you tomorrow.' }] },
            { if: { lemmas: ['しょっぱい', 'カレーパン'], neg: false }, say: [{ who: 'baker', t: 'うれしい ！ カレーパン は 、 わたし の [自信作|じしんさく] な ん です 。', en: 'I’m so glad! The curry bun is my pride and joy.' }] },
            { say: [{ who: 'baker', t: 'どっち も おいしい です よ ね ！', en: 'They’re both delicious, aren’t they!' }] },
          ] } },
        { who: 'kid', sticker: 'mimo_jump' },
      ] },
    // ------------------------------------------------------------ the 町内会 (the neighborhood association) gets the summer festival ready
    // (matsuri.js: after Natsu's second chapter, the games; not once the festival night is done)
    { id: 'ja.chounai', chat: 'chounai', band: 2, when: { test: s => !!(s.mt && s.mt.ch && s.mt.ch[2] && !s.mt.ch[5]) }, delay: 50,
      steps: [
        { sys: 'ナツ が あなた を 「 アルバ [町内会|ちょうないかい] 🏮 」 に [招待|しょうたい] しました', en: 'Natsu added you to the group “Alba Neighborhood Association 🏮”' },
        { who: 'natsu', t: 'やっほー ！ ナツ だ よ ！ おじいちゃん の スマホ で [打|う]って る の 📱', en: 'Heyyy! It’s Natsu! I’m typing on Grandpa’s phone 📱' },
        { who: 'natsu', t: '[夏祭|なつまつ]り の じゅんび 、 てつだって ！ [今日|きょう] から 、 あなた も [町内会|ちょうないかい] の メンバー ね ！', en: 'Help us get the summer festival ready! From today, you’re a member of the neighborhood association too!' },
        { who: 'tetsu', audio: ['えー 、 テツ だ 。 [字|じ] を [打|う]つ の は どうも [苦手|にがて] で な 。 [今年|ことし] の [祭|まつ]り も 、 [町内会|ちょうないかい] みんな で やる ぞ 。 よろしく [頼|たの]む 。', 'Ahem, Tetsu here. I’m no good at typing. This year the whole association puts on the festival together. I’m counting on you.'] },
        { who: 'shige', t: 'やぐら は おれ が [建|た]てる 。 [木|き] は もう [用意|ようい] した 。', en: 'I’ll build the yagura. The wood’s ready.' },
        { who: 'natsu', t: 'おじいちゃん が 「 シゲ 、 [去年|きょねん] みたい に [曲|ま]がった やぐら は だめ だ ぞ 」 って 。 （ [笑|わら] ）', en: 'Grandpa says: “Shige, no crooked yagura like last year.” (lol)' },
        { who: 'shige', t: '[曲|ま]がって ない 。 あれ は [味|あじ] だ 。', en: 'It wasn’t crooked. That was character.' },
        { who: 'otoha', t: 'わたし 、 [受付|うけつけ] やります ！ [歌|うた] は … まだ ちょっと [無理|むり] です けど 😅', en: 'I’ll take the reception desk! Singing is… still a bit much for me 😅' },
        { who: 'rosa', t: 'わたし は 、 かき[氷|ごおり] の りんご シロップ を [作|つく]ります よ 🍎', en: 'I’ll make apple syrup for the shaved ice 🍎' },
        { who: 'natsu', t: 'じゃあ 、 とうばん を [決|き]めよう ！ [土曜日|どようび] の [夕方|ゆうがた] と 、 [夜|よる] が ある よ 。', en: 'OK, let’s decide the shifts! There’s Saturday early evening, and night.' },
        { turn: { id: 'touban', goal: 'Natsu is making the shift list (当番) for Saturday: early evening or night? Pick one, and say why if you can.',
          ask: { who: 'natsu', t: 'あなた は 、 [夕方|ゆうがた] と [夜|よる] 、 どっち が いい ？', en: 'Which do you want, early evening or night?' },
          simpler: { who: 'natsu', t: '[夕方|ゆうがた] ？ [夜|よる] ？', en: 'Evening? Night?' },
          want: { lemmas: ['夕方', '夜', '晩', '両方', 'どっち'] },
          starter: ['___ が いい です 。', '___ is good for me.'], example: ['[花火|はなび] が [見|み]たい から 、 [夜|よる] が いい です 。', 'I want to see the fireworks, so night is good for me.'], model: ['[夕方|ゆうがた] が いい です 。', 'Early evening is good for me.'],
          react: [
            { if: { lemmas: ['両方'] }, say: [{ who: 'natsu', t: 'りょうほう ！ すごい ！ おじいちゃん が 「 えらい ！ 」 って 。', en: 'Both! Amazing! Grandpa says “Well done!”' }] },
            { if: { lemmas: ['夜', '晩'] }, say: [{ who: 'natsu', t: '[夜|よる] ね ！ [花火|はなび] 、 いっしょ に [見|み]よう ね ！', en: 'Night it is! Let’s watch the fireworks together!' }] },
            { if: { lemmas: ['夕方'] }, say: [{ who: 'natsu', t: '[夕方|ゆうがた] ね ！ じゃあ 、 [屋台|やたい] の じゅんび だ ！', en: 'Evening it is! Then you’re on stall setup!' }] },
            { say: [{ who: 'natsu', t: 'りょうかい ！ [書|か]いて おく ね 。', en: 'Got it! I’ll write you down.' }] },
          ] } },
        { who: 'tetsu', audio: ['[回覧板|かいらんばん] より 、 こっち の ほう が [早|はや]い な 。 がっはっは 。', 'This is quicker than passing round the notice board. Ha ha ha!'] },
        { who: 'natsu', img: 'ja_chouchin', t: 'ちょうちん 、 つけて みた ！ きれい でしょ ？', en: 'I tried lighting the lanterns! Pretty, right?' },
        { turn: { id: 'fun', goal: 'Tell Natsu what you’re looking forward to most at the festival (and why, if you can).',
          ask: { who: 'natsu', t: 'お[祭|まつ]り で 、 [何|なに] が [一番|いちばん] たのしみ ？', en: 'What are you looking forward to most at the festival?' },
          simpler: { who: 'natsu', t: 'たこ[焼|や]き ？ [花火|はなび] ？ [盆踊|ぼんおど]り ？', en: 'Takoyaki? Fireworks? The bon dance?' },
          want: { any: true },
          starter: ['___ が [一番|いちばん] [楽|たの]しみ です 。', 'I’m looking forward to ___ the most.'], example: ['[盆踊|ぼんおど]り が [一番|いちばん] [楽|たの]しみ です 。 [浴衣|ゆかた] を [着|き]て 、 みんな と [踊|おど]りたい です 。', 'I’m most looking forward to the bon dance. I want to wear a yukata and dance with everyone.'], model: ['[花火|はなび] が [楽|たの]しみ です 。', 'I’m looking forward to the fireworks.'],
          react: [
            { if: { lemmas: ['太鼓'] }, say: [{ who: 'natsu', t: 'おじいちゃん が 「 わし の [太鼓|たいこ] 、 しっかり [聞|き]け よ 」 って ！', en: 'Grandpa says: “Then listen well to my drum!”' }] },
            { if: { lemmas: ['花火', '線香花火'] }, say: [{ who: 'natsu', t: 'たまやー ！ 🎆', en: 'Tamaya! 🎆' }] },
            { if: { lemmas: ['かき氷', 'りんご', 'シロップ'] }, say: [{ who: 'rosa', t: 'りんご シロップ の かき[氷|ごおり] 、 [食|た]べに [来|き]て ください ね 。', en: 'Come and have some shaved ice with apple syrup.' }] },
            { if: { lemmas: ['盆踊り', '踊る', 'ダンス', '浴衣'] }, say: [{ who: 'natsu', t: 'いっしょ に [踊|おど]ろう ！ ナツ が [教|おし]えて あげる ！', en: 'Let’s dance together! I’ll teach you!' }] },
            { if: { lemmas: ['金魚', '金魚すくい'] }, say: [{ who: 'natsu', t: '[金魚|きんぎょ]すくい は ね 、 ナツ 、 [名人|めいじん] だ よ ！', en: 'I’m a goldfish-scooping master, you know!' }] },
            { if: { lemmas: ['たこ焼き', '焼きそば', '綿あめ', '屋台'] }, say: [{ who: 'natsu', t: 'わかる ！ [屋台|やたい] の ご[飯|はん] は 、 なんで あんなに おいしい ん だろう ね ！', en: 'I know! Why is festival-stall food so good?!' }] },
            { say: [{ who: 'natsu', t: 'いい ね ！ ぜったい [来|き]て ね ！', en: 'Nice! You have to come!' }] },
          ] } },
        { who: 'natsu', sticker: 'ja_tanoshimi' },
      ] },
  ];
  TALK.content('ja', { chats, members, threads });
})();

// ============================================================================ Bruno and Marta, ranks 1–3
// Bruno (the coach by the bell tower): polite, short, energetic (よし！ ファイト！); his own story is the smallest boy in the
// school football club, two years on the bench and his lone morning practice (朝練). Marta (the baker): warm and busy; her own
// story is the stone-hard first loaf she baked as a girl in her grandmother's bakery. Both say です / ます to you, and the models
// answer politely.
(() => {
  if (typeof TALK === 'undefined') return;
  const SPORTS = ['スポーツ', 'サッカー', '野球', 'テニス', 'バスケ', '水泳', '泳ぐ', '走る', 'ダンス', '踊る', '体操', '運動', '運動する', '散歩', '散歩する', '練習'];
  const bruno1 = {
    id: 'bruno.1', who: 'bruno', band: 1, title: { en: 'Warming up' },
    open: [['よし 、 [来|き]ました ね ！ [今日|きょう] は [練習|れんしゅう] の [前|まえ] に 、 [少|すこ]し [話|はな]しましょう 。', 'Right, you’re here! Today, before training, let’s talk a bit.']],
    turns: [
      { id: 'how', goal: 'Tell him how you feel today.',
        ask: ['[今日|きょう] の [調子|ちょうし] は どう です か ？', 'How are you feeling today?'],
        simpler: ['[元気|げんき] です か ？ [疲|つか]れて います か ？', 'Are you full of energy? Tired?'],
        want: { topic: 'feeling', lemmas: ['元気', 'いい', '疲れる', '眠い', 'まあまあ', '大丈夫', '最高', '調子'] },
        starter: ['___ です 。', 'I’m ___.'], example: ['[元気|げんき] です ！ [今日|きょう] は たくさん [練習|れんしゅう] したい です 。', 'I’m full of energy! I want to train a lot today.'], model: ['[元気|げんき] です 。', 'I’m fine.'],
        react: [
          { if: { val: '-' }, say: [['そう です か 。 じゃあ 、 [今日|きょう] は ゆっくり やりましょう 。 [休|やす]む の も [練習|れんしゅう] です 。', 'I see. Then we’ll take it easy today. Resting is training too.']] },
          { say: [['よし ！ その [調子|ちょうし] です ！', 'Great! That’s the spirit!']], mood: 'happy' },
        ] },
      { id: 'sport', goal: 'Do you like sports? Which one?',
        ask: ['スポーツ は [好|す]き です か ？ [何|なん] の スポーツ が [好|す]き です か ？', 'Do you like sports? Which sport do you like?'],
        simpler: ['サッカー ？ [水泳|すいえい] ？ [何|なに] が [好|す]き です か ？', 'Football? Swimming? What do you like?'],
        want: { topic: 'sport', lemmas: SPORTS, yesno: true },
        starter: ['___ が [好|す]き です 。', 'I like ___.'], example: ['はい 、 サッカー が [大好|だいす]き です 。 [子供|こども] の [頃|ころ] から やって います 。', 'Yes, I love football. I’ve played it since I was a kid.'], model: ['テニス が [好|す]き です 。', 'I like tennis.'],
        react: [
          { if: { lemmas: ['サッカー'] }, say: [['サッカー ！ わたし も [昔|むかし] 、 やって いました よ 。', 'Football! I used to play it too.']], mood: 'happy' },
          { if: { neg: true }, say: [['[大丈夫|だいじょうぶ] ！ ここ で は 、 [言葉|ことば] が スポーツ です 。', 'No problem! Here, words are the sport.']] },
          { say: [['{echo|いい です ね ！} [体|からだ] を [動|うご]かす の は 、 [最高|さいこう] です 。', '{echo|Nice!} Moving your body is the best.']], mood: 'happy' },
        ] },
      { id: 'when', goal: 'Morning or evening: when do you like to train?',
        ask: ['[練習|れんしゅう] は 、 [朝|あさ] と [夜|よる] 、 どっち が いい です か ？', 'For training, which is better: morning or evening?'],
        simpler: ['[朝|あさ] ？ [夜|よる] ？', 'Morning? Evening?'],
        want: { lemmas: ['朝', '夜', '晩', '夕方', '昼', '午前', '午後', '両方', 'どっち'] },
        starter: ['___ が いい です 。', '___ is better.'], example: ['[朝|あさ] が いい です 。 [朝|あさ] は [頭|あたま] も [体|からだ] も [元気|げんき] です から 。', 'Morning is better. In the morning, my head and body are both fresh.'], model: ['[朝|あさ] が いい です 。', 'Morning is better.'],
        react: [
          { if: { lemmas: ['朝', '午前'] }, say: [['さすが ！ [明日|あした] の [朝|あさ] [七時|しちじ] 、 [広場|ひろば] で ラジオ [体操|たいそう] です よ ！', 'That’s the way! Tomorrow, 7 a.m., radio exercises in the square!']], mood: 'happy' },
          { say: [['なるほど 。 [自分|じぶん] に [合|あ]う [時間|じかん] が [一番|いちばん] です 。', 'I see. The time that suits you is the best time.']] },
        ] },
      { id: 'mimo', goal: 'Is {mimo} strong? Say what {mimo} is good at.',
        ask: ['{mimo} ちゃん は 、 [何|なに] が [得意|とくい] です か ？', 'What is {mimo} good at?'],
        simpler: ['{mimo} ちゃん は 、 [何|なに] が [上手|じょうず] です か ？ ジャンプ ？', 'What is {mimo} good at? Jumping?'],
        want: { any: true },
        starter: ['___ が [得意|とくい] です 。', 'It’s good at ___.'], example: ['ジャンプ が [得意|とくい] です 。 [食|た]べる の も [得意|とくい] です 。', 'It’s good at jumping. And at eating.'], model: ['ジャンプ が [上手|じょうず] です 。', 'It’s good at jumping.'],
        react: [
          { if: { lemmas: ['食べる'] }, say: [['はっはっは ！ それ も [立派|りっぱ] な [才能|さいのう] です 。', 'Ha ha ha! That’s a fine talent too.']], mood: 'happy' },
          { say: [['いい [相棒|あいぼう] です ね 。 [一緒|いっしょ] に [強|つよ]く なりましょう ！', 'What a partner. Let’s get stronger together!']], mood: 'happy' },
        ] },
    ],
    close: [['よし 、 [話|はなし] は [終|お]わり ！ [練習|れんしゅう] を [始|はじ]めましょう 。 ファイト ！', 'Right, enough talk! Let’s start training. Fight on!']],
  };
  const bruno2 = {
    id: 'bruno.2', who: 'bruno', band: 2, title: { en: 'Your routine, your plans' },
    open: [['お 、 いい [顔|かお] を して います ね 。 [今日|きょう] は 、 あなた の [毎日|まいにち] の こと を [聞|き]かせて ください 。', 'Oh, you look good today. Tell me about your daily routine.']],
    turns: [
      { id: 'up', goal: 'What time did you get up today? (in the past: «…時に起きました»)',
        ask: ['[今朝|けさ] は [何時|なんじ] に [起|お]きました か ？', 'What time did you get up this morning?'],
        simpler: ['[六時|ろくじ] ？ [八時|はちじ] ？ [何時|なんじ] に [起|お]きました か ？', 'Six? Eight? What time did you get up?'],
        want: { number: true, time: 'past' },
        tips: { time: 'This morning already happened: «…時に起きました».' },
        starter: ['___ [時|じ] に [起|お]きました 。', 'I got up at ___.'], example: ['[六時|ろくじ] に [起|お]きました 。 それ から 、 [少|すこ]し [走|はし]りました 。', 'I got up at six. Then I went for a short run.'], model: ['[七時|しちじ] に [起|お]きました 。', 'I got up at seven.'],
        react: [
          { if: { num: [3, 6] }, say: [['[早|はや]い ！ わたし より [早|はや]い じゃ ない です か ！', 'Early! That’s earlier than me!']], mood: 'surprised' },
          { if: { num: [9, 12] }, say: [['はっはっは 、 ゆっくり です ね 。 たまに は いい です よ 。', 'Ha ha ha, a late start. Now and then, that’s fine.']] },
          { say: [['いい です ね 。 [早起|はやお]き は [三文|さんもん] の [得|とく] です 。', 'Good. The early bird gets the worm, as they say.']], mood: 'happy' },
        ] },
      { id: 'every', goal: 'What do you do every morning? Tell him your routine.',
        ask: ['[毎朝|まいあさ] 、 [何|なに] を します か ？', 'What do you do every morning?'],
        simpler: ['[朝|あさ] ご[飯|はん] ？ [散歩|さんぽ] ？ [毎朝|まいあさ] [何|なに] を します か ？', 'Breakfast? A walk? What do you do every morning?'],
        want: { any: true },
        starter: ['[毎朝|まいあさ] ___ 。', 'Every morning I ___.'], example: ['[毎朝|まいあさ] 、 [顔|かお] を [洗|あら]って 、 [朝|あさ]ご[飯|はん] を [食|た]べて 、 {mimo} と [散歩|さんぽ] します 。', 'Every morning I wash my face, eat breakfast and go for a walk with {mimo}.'], model: ['[毎朝|まいあさ] 、 [朝|あさ]ご[飯|はん] を [食|た]べます 。', 'Every morning I eat breakfast.'],
        react: [
          { if: { lemmas: ['走る', '散歩', '散歩する', '体操', '運動する'] }, say: [['すばらしい ！ [体|からだ] は [毎日|まいにち] の [積|つ]み[重|かさ]ね です 。', 'Splendid! A strong body is built day by day.']], mood: 'happy' },
          { say: [['なるほど 。 [毎日|まいにち] [同|おな]じ こと を する の は 、 [大切|たいせつ] です 。', 'I see. Doing the same thing every day matters.']] },
        ] },
      { id: 'weekend', goal: 'What are you planning to do this weekend to stay active? Use «つもり».',
        ask: ['[週末|しゅうまつ] は 、 [何|なに] か [運動|うんどう] を する つもり です か ？', 'Are you planning to do any exercise this weekend?'],
        simpler: ['[週末|しゅうまつ] 、 [走|はし]ります か ？ [泳|およ]ぎます か ？', 'This weekend, will you run? Swim?'],
        want: { any: true, time: 'future' },
        tips: { time: 'Say it as a plan: «…つもりです».' },
        starter: ['___ つもり です 。', 'I’m planning to ___.'], example: ['[湖|みずうみ] で [泳|およ]ぐ つもり です 。 それ から 、 [山|やま] に も [登|のぼ]りたい です 。', 'I’m planning to swim in the lake. And I want to climb a mountain too.'], model: ['[走|はし]る つもり です 。', 'I’m planning to go running.'],
        react: [
          { if: { lemmas: ['泳ぐ', '湖'] }, say: [['いい です ね ！ でも 、 [湖|みずうみ] の [水|みず] は [冷|つめ]たい です よ 。', 'Great! But the lake water is cold, mind you.']], mood: 'surprised' },
          { if: { neg: true }, say: [['[休|やす]む の も [大事|だいじ] です 。 でも 、 [月曜日|げつようび] は [練習|れんしゅう] です よ ！', 'Resting matters too. But Monday, it’s training!']] },
          { say: [['よし ！ その [意気|いき] です ！', 'Yes! That’s the spirit!']], mood: 'happy' },
        ] },
      { id: 'times', goal: 'How many times a week will you train with him? (週に…回)',
        ask: ['[一週間|いっしゅうかん] に [何回|なんかい] 、 [練習|れんしゅう] に [来|き]ます か ？', 'How many times a week will you come to train?'],
        simpler: ['[一回|いっかい] ？ [三回|さんかい] ？', 'Once? Three times?'],
        want: { number: true },
        starter: ['[週|しゅう] に ___ [回|かい] [来|き]ます 。', 'I’ll come ___ times a week.'], example: ['[週|しゅう] に [三回|さんかい] [来|き]ます 。 [月曜日|げつようび] と [水曜日|すいようび] と [金曜日|きんようび] です 。', 'I’ll come three times a week: Monday, Wednesday and Friday.'], model: ['[週|しゅう] に [二回|にかい] [来|き]ます 。', 'I’ll come twice a week.'],
        react: [
          { if: { num: [5, 7] }, say: [['[毎日|まいにち] ！ … あなた 、 わたし より コーチ に [向|む]いて います よ 。', 'Every day! …You’d make a better coach than me.']], mood: 'surprised' },
          { say: [['よし 、 [約束|やくそく] です よ ！ [待|ま]って います 。', 'Right, it’s a promise! I’ll be waiting.']], mood: 'happy' },
        ] },
    ],
    close: [['いい [計画|けいかく] です 。 [続|つづ]ける こと が 、 [一番|いちばん] の [力|ちから] です から ね 。', 'A good plan. Keeping at it is the greatest strength.']],
  };
  const bruno3 = {
    id: 'bruno.3', who: 'bruno', band: 3, title: { en: 'Getting back up' },
    open: [['[実|じつ] は ね 、 わたし も 、 [昔|むかし] は [弱|よわ]かった ん です よ 。 [信|しん]じられない でしょう ？', 'You know, I used to be weak too. Hard to believe, right?']],
    turns: [
      { id: 'bench', goal: 'He sat on the bench for two years. Have you ever kept practicing something hard for a long time? Tell him (～たことがある).',
        ask: [['[中学校|ちゅうがっこう] の サッカー [部|ぶ] で 、 わたし は [一番|いちばん] [小|ちい]さくて 、 [二年|にねん] 、 ずっと ベンチ でした 。', 'In the middle-school football club, I was the smallest, and I sat on the bench for two whole years.'],
          ['あなた は 、 [難|むずか]しい こと を 、 [長|なが]い [間|あいだ] [練習|れんしゅう] した こと が あります か ？', 'Have you ever practiced something difficult for a long time?']],
        simpler: ['[何|なに] か を 、 ずっと [練習|れんしゅう] した こと が あります か ？', 'Have you ever practiced something for a long time?'],
        want: { any: true, time: 'past' },
        tips: { time: 'Use the “have you ever” shape: «…したことがあります», or tell what you did, in the past.' },
        starter: ['はい 、 ___ を [練習|れんしゅう] した こと が あります 。', 'Yes, I’ve practiced ___.'], example: ['はい 、 [十年|じゅうねん] 、 ピアノ を [練習|れんしゅう] した こと が あります 。 [毎日|まいにち] [一時間|いちじかん] [弾|ひ]きました 。', 'Yes, I practiced the piano for ten years. I played an hour every day.'], model: ['はい 、 [日本語|にほんご] を [毎日|まいにち] [練習|れんしゅう] しました 。', 'Yes, I’ve practiced Japanese every day.'],
        react: [
          { if: { lemmas: ['日本語', '漢字', '言葉'] }, say: [['[日本語|にほんご] ！ それ は [立派|りっぱ] な [練習|れんしゅう] です 。 [毎日|まいにち] の [朝練|あされん] と [同|おな]じ です よ 。', 'Japanese! That’s real training. Just like daily morning practice.']], mood: 'happy' },
          { say: [['すごい ！ [続|つづ]けられる [人|ひと] は 、 [強|つよ]い です 。', 'Amazing! People who keep going are strong.']], mood: 'happy' },
        ] },
      { id: 'fail', goal: 'Tell him about a time you failed at something (in the past), and what you did next.',
        ask: ['[失敗|しっぱい] した [時|とき] は 、 どう しました か ？ [話|はな]して ください 。', 'When you failed at something, what did you do? Tell me.'],
        simpler: ['[失敗|しっぱい] した こと 、 あります か ？ [何|なに] を しました か ？', 'Have you ever failed? What did you do?'],
        want: { any: true, time: 'past' },
        tips: { time: 'Tell what happened, in the past: «…しました», «…でした».' },
        starter: ['___ の [時|とき] 、 [失敗|しっぱい] しました 。 でも 、 ___ 。', 'When ___, I failed. But ___.'], example: ['[試験|しけん] に [落|お]ちた [時|とき] 、 とても [悲|かな]しかった です 。 でも 、 もう [一度|いちど] [勉強|べんきょう] して 、 [次|つぎ] は [合格|ごうかく] しました 。', 'When I failed an exam, I was really sad. But I studied again, and passed the next time.'], model: ['[試合|しあい] に [負|ま]けました 。 でも 、 また [練習|れんしゅう] しました 。', 'I lost a match. But I kept practicing.'],
        react: [
          { if: { lemmas: ['もう', '一度', 'また', '練習', '練習する', '勉強する', '頑張る'] }, say: [['それ です ！ [転|ころ]んだら 、 [立|た]てば いい 。 [何度|なんど] でも 。', 'That’s it! If you fall, you stand up. As many times as it takes.']], mood: 'happy' },
          { say: [['[話|はな]して くれて 、 ありがとう 。 [失敗|しっぱい] は 、 [練習|れんしゅう] の [一部|いちぶ] です 。', 'Thank you for telling me. Failing is part of training.']] },
        ] },
      { id: 'quit', goal: 'When you feel like giving up, what do you do? Give a reason («…から»).',
        ask: [['わたし は ベンチ で 、 [何度|なんど] も やめたく なりました 。 でも 、 [毎朝|まいあさ] 、 [一人|ひとり] で [朝練|あされん] を [続|つづ]けました 。', 'On that bench, I wanted to quit again and again. But every morning, I kept practicing alone.'],
          ['あなた は 、 あきらめたく なった [時|とき] 、 どう します か ？ どうして ？', 'When you feel like giving up, what do you do? Why?']],
        simpler: ['やめたい [時|とき] 、 [何|なに] を します か ？', 'When you want to quit, what do you do?'],
        want: { any: true, reason: true },
        tips: { reason: 'He asked why: add a reason with «…から».' },
        starter: ['___ ます 。 ___ から です 。', 'I ___. Because ___.'], example: ['[友達|ともだち] に [話|はな]します 。 [一人|ひとり] で [考|かんが]える より 、 [元気|げんき] が [出|で]る から です 。', 'I talk to a friend. Because it cheers me up more than thinking alone.'], model: ['[少|すこ]し [休|やす]みます 。 [休|やす]む と 、 また がんばれる から です 。', 'I rest a little. Because after a rest, I can try again.'],
        react: [
          { if: { lemmas: ['友達', '家族', '話す'] }, say: [['いい です ね 。 [一人|ひとり] で がんばらなくて も いい ん です 。', 'Good. You don’t have to do it all alone.']], mood: 'happy' },
          { say: [['なるほど 。 [自分|じぶん] の やり[方|かた] を [知|し]って いる の は 、 [強|つよ]い です 。', 'I see. Knowing your own way is a strength.']] },
        ] },
    ],
    close: [['[最後|さいご] の [大会|たいかい] で 、 わたし は やっと [試合|しあい] に [出|で]ました 。 [負|ま]けました けど ね 。 でも 、 あの [日|ひ] の こと は 、 [一生|いっしょう] [忘|わす]れません 。', 'At my last tournament, I finally got to play. We lost, mind you. But I’ll never forget that day.']],
  };

  // ------------------------------------------------------------ Marta, the baker
  const BREAD = ['パン', 'メロンパン', 'あんパン', 'カレーパン', 'ケーキ', 'クッキー', '甘い', 'しょっぱい', 'チーズ', 'はちみつ', '全部', '両方'];
  const baker1 = {
    id: 'baker.1', who: 'baker', band: 1, title: { en: 'At the bakery' },
    open: [['いらっしゃいませ ！ あ 、 あなた でした か 。 [焼|や]きたて です よ 。', 'Welcome! Oh, it’s you. Everything’s fresh from the oven.']],
    turns: [
      { id: 'bread', goal: 'Which bread do you like? Tell her.',
        ask: ['どの パン が [好|す]き です か ？', 'Which bread do you like?'],
        simpler: ['メロンパン ？ あんパン ？ カレーパン ？', 'Melon bread? Bean bun? Curry bun?'],
        want: { topic: 'food', lemmas: BREAD },
        starter: ['___ が [好|す]き です 。', 'I like ___.'], example: ['あんパン が [好|す]き です 。 [甘|あま]くて 、 おいしい です 。', 'I like sweet bean buns. They’re sweet and delicious.'], model: ['メロンパン が [好|す]き です 。', 'I like melon bread.'],
        remember: { food: 'match' },
        react: [
          { if: { lemmas: ['あんパン'] }, say: [['あんパン ！ あんこ は 、 [毎朝|まいあさ] わたし が [作|つく]って いる ん です よ 。', 'Bean buns! I make the bean paste myself every morning.']], mood: 'happy' },
          { say: [['{echo|うれしい ！} [今日|きょう] の は 、 [特|とく]に いい [出来|でき] です よ 。', '{echo|Lovely!} Today’s batch came out especially well.']], mood: 'happy' },
        ] },
      { id: 'breakfast', goal: 'For breakfast, bread or rice? Tell her.',
        ask: ['[朝|あさ]ご[飯|はん] は 、 パン です か ？ ご[飯|はん] です か ？', 'For breakfast, do you have bread or rice?'],
        simpler: ['[朝|あさ] 、 パン を [食|た]べます か ？', 'Do you eat bread in the morning?'],
        want: { lemmas: ['パン', 'ご飯', '米', 'おにぎり', '両方', '何も', 'シリアル', '果物'] , topic: 'food' },
        starter: ['___ です 。', 'I have ___.'], example: ['[平日|へいじつ] は パン で 、 [週末|しゅうまつ] は ご[飯|はん] と [味噌汁|みそしる] です 。', 'On weekdays bread, and on weekends rice and miso soup.'], model: ['パン です 。', 'Bread.'],
        react: [
          { if: { lemmas: ['パン'], neg: false }, say: [['やった ！ じゃあ 、 [毎朝|まいあさ] うち に [来|き]て ください ね 。', 'Yay! Then come by every morning.']], mood: 'happy' },
          { if: { lemmas: ['ご飯', '米', 'おにぎり'] }, say: [['ご[飯|はん][派|は] です ね 。 … [負|ま]けません よ ！ ふふ 。', 'A rice person, I see. …I won’t give up on you! Hehe.']] },
          { say: [['なるほど 。', 'I see.']] },
        ] },
      { id: 'how', goal: 'She asks how many melon breads you want. Say a number (メロンパンを…つ / …個ください).',
        ask: ['メロンパン 、 いくつ [要|い]ります か ？', 'How many melon breads would you like?'],
        simpler: ['[一|ひと]つ ？ [二|ふた]つ ？', 'One? Two?'],
        want: { number: true, lemmas: ['いくつ', '全部'] },
        starter: ['___ ください 。', '___, please.'], example: ['[三|みっ]つ ください 。 {mimo} と [友達|ともだち] の [分|ぶん] です 。', 'Three, please. For {mimo} and a friend too.'], model: ['[二|ふた]つ ください 。', 'Two, please.'],
        react: [
          { if: { num: [4, 99] }, say: [['そんな に ！ パーティー です か ？ ふふ 、 [袋|ふくろ] に [入|い]れます ね 。', 'That many! Is it a party? Hehe, I’ll put them in a bag.']], mood: 'surprised' },
          { say: [['はい 、 どうぞ 。 [一|ひと]つ 、 おまけ です 。', 'Here you go. And one extra, on the house.']], mood: 'happy' },
        ] },
      { id: 'sweet', goal: 'Do you like sweet things? Tell her.',
        ask: ['[甘|あま]い もの は [好|す]き です か ？', 'Do you like sweet things?'],
        simpler: ['ケーキ は [好|す]き です か ？', 'Do you like cake?'],
        want: { yesno: true },
        starter: ['はい 、 ___ 。', 'Yes, ___.'], example: ['はい 、 [大好|だいす]き です 。 [特|とく]に ケーキ が [好|す]き です 。', 'Yes, I love them. Especially cake.'], model: ['はい 、 [好|す]き です 。', 'Yes, I like them.'],
        react: [
          { if: { yes: true }, say: [['わたし も ！ [甘|あま]い もの は 、 [心|こころ] の ご[飯|はん] です 。', 'Me too! Sweet things are food for the heart.']], mood: 'happy' },
          { if: { no: true }, say: [['じゃあ 、 [今度|こんど] は チーズ の パン を [焼|や]きます ね 。', 'Then next time I’ll bake you a cheese bread.']] },
          { say: [['ふふ 、 そう です か 。', 'Hehe, I see.']] },
        ] },
    ],
    close: [['また [来|き]て ください ね 。 [毎朝|まいあさ] [六時|ろくじ] から [開|あ]いて います 。', 'Come again. I’m open every morning from six.']],
  };
  const baker2 = {
    id: 'baker.2', who: 'baker', band: 2, title: { en: 'Cooking, plans and a cake' },
    open: [['あ 、 ちょうど よかった ！ ちょっと [相談|そうだん] が ある ん です 。', 'Oh, perfect timing! I want to ask you something.']],
    turns: [
      { id: 'cook', goal: 'Can you cook? What can you make?',
        ask: ['あなた は 、 [料理|りょうり] が できます か ？ [何|なに] が [作|つく]れます か ？', 'Can you cook? What can you make?'],
        simpler: ['[料理|りょうり] 、 します か ？', 'Do you cook?'],
        want: { yesno: true, topic: 'food' },
        starter: ['___ が [作|つく]れます 。', 'I can make ___.'], example: ['はい 、 カレー と オムレツ が [作|つく]れます 。 でも 、 パン は [作|つく]った こと が ありません 。', 'Yes, I can make curry and omelets. But I’ve never made bread.'], model: ['はい 、 カレー が [作|つく]れます 。', 'Yes, I can make curry.'],
        react: [
          { if: { neg: true, test: r => !JA_TALK.mixed(r) }, say: [['[大丈夫|だいじょうぶ] ！ [今度|こんど] 、 [一緒|いっしょ] に パン を [焼|や]きましょう 。', 'No problem! Let’s bake bread together sometime.']] },
          { say: [['すごい ！ [今度|こんど] 、 [食|た]べさせて ください ね 。', 'Amazing! Let me taste it sometime.']], mood: 'happy' },
        ] },
      { id: 'last', goal: 'What did you eat last night? (in the past)',
        ask: ['[昨日|きのう] の [晩|ばん]ご[飯|はん] は 、 [何|なに] を [食|た]べました か ？', 'What did you have for dinner last night?'],
        simpler: ['[昨日|きのう] の [夜|よる] 、 [何|なに] を [食|た]べました か ？', 'What did you eat last night?'],
        want: { topic: ['food', 'drink'], time: 'past' },
        tips: { time: 'Last night already happened: «…を食べました».' },
        starter: ['___ を [食|た]べました 。', 'I ate ___.'], example: ['[焼|や]きそば を [作|つく]って 、 [友達|ともだち] と [食|た]べました 。', 'I made yakisoba and ate it with a friend.'], model: ['ラーメン を [食|た]べました 。', 'I had ramen.'],
        react: [{ say: [['{echo|いい です ね ！} [聞|き]いて いる だけ で 、 お[腹|なか] が すきます 。', '{echo|Nice!} Just hearing about it makes me hungry.']], mood: 'happy' }] },
      { id: 'cake', goal: 'She’s baking a birthday cake for Nico. What should she put on it? Say what you think («…がいいと思います»).',
        ask: [['[来週|らいしゅう] 、 ニコ くん の [誕生日|たんじょうび] な ん です 。 ケーキ を [焼|や]く つもり です 。', 'Next week is Nico’s birthday. I’m planning to bake a cake.'],
          ['[上|うえ] に 、 [何|なに] を のせたら いい と [思|おも]います か ？', 'What do you think I should put on top?']],
        simpler: ['いちご ？ チョコレート ？ [何|なに] が いい です か ？', 'Strawberries? Chocolate? What would be good?'],
        want: { topic: 'food', lemmas: ['いちご', 'チョコレート', 'りんご', '果物', 'はちみつ', 'クッキー', 'アイス'] },
        starter: ['___ が いい と [思|おも]います 。', 'I think ___ would be good.'], example: ['いちご が いい と [思|おも]います 。 [赤|あか]くて 、 かわいい から です 。', 'I think strawberries would be good. Because they’re red and cute.'], model: ['チョコレート が いい と [思|おも]います 。', 'I think chocolate would be good.'],
        react: [
          { if: { lemmas: ['いちご'] }, say: [['いちご ！ [定番|ていばん] です ね 。 ニコ くん 、 [喜|よろこ]ぶ わ 。', 'Strawberries! The classic. Nico will be so happy.']], mood: 'happy' },
          { say: [['{echo|いい アイデア ！} それ に します 。', '{echo|Good idea!} That’s what I’ll do.']], mood: 'happy' },
        ] },
      { id: 'come', goal: 'Will you come to Nico’s party next Saturday? Say yes or no (if no, why).',
        ask: ['[来週|らいしゅう] の [土曜日|どようび] 、 パーティー に [来|き]て くれます か ？', 'Will you come to the party next Saturday?'],
        simpler: ['パーティー 、 [来|き]ます か ？ はい ？ いいえ ？', 'The party: will you come? Yes? No?'],
        want: { yesno: true },
        starter: ['はい 、 ___ 。', 'Yes, ___.'], example: ['はい 、 [行|い]きます ！ [何|なに] か [持|も]って いきます ね 。', 'Yes, I’ll come! I’ll bring something.'], model: ['はい 、 [行|い]きます 。', 'Yes, I’ll come.'],
        react: [
          { if: { yes: true }, say: [['よかった ！ ニコ くん に は 、 まだ [秘密|ひみつ] です よ 。', 'Wonderful! Keep it a secret from Nico for now.']], mood: 'happy' },
          { if: { no: true }, say: [['[残念|ざんねん] … 。 じゃあ 、 ケーキ を [一切|ひとき]れ 、 とって おきます ね 。', 'Too bad… Then I’ll keep a slice of cake for you.']], mood: 'sad' },
          { say: [['[来|こ]られたら 、 ぜひ ！', 'Come if you can!']] },
        ] },
    ],
    close: [['ありがとう 。 あなた に [相談|そうだん] して 、 よかった です 。', 'Thank you. I’m glad I asked you.']],
  };
  const baker3 = {
    id: 'baker.3', who: 'baker', band: 3, title: { en: 'The stone bread' },
    open: [['[今日|きょう] は お[客|きゃく] さん が [少|すく]ない から 、 わたし の [昔|むかし] の [話|はなし] 、 [聞|き]いて くれます か ？', 'Not many customers today, so will you listen to a story from when I was young?']],
    turns: [
      { id: 'first', goal: 'Tell her about the first time you cooked something by yourself (in the past).',
        ask: ['あなた が [初|はじ]めて [一人|ひとり] で [料理|りょうり] を した の は 、 いつ でした か ？ [何|なに] を [作|つく]りました か ？', 'When was the first time you cooked by yourself? What did you make?'],
        simpler: ['[初|はじ]めて [作|つく]った [料理|りょうり] は [何|なん] でした か ？', 'What was the first dish you made?'],
        want: { any: true, time: 'past' },
        tips: { time: 'Tell it in the past: «…を作りました», «…でした».' },
        starter: ['___ の [時|とき] 、 ___ を [作|つく]りました 。', 'When I was ___, I made ___.'], example: ['[十歳|じゅっさい] の [時|とき] 、 [母|はは] の ため に [卵焼|たまごや]き を [作|つく]りました 。 [少|すこ]し [焦|こ]げました けど 、 [母|はは] は [全部|ぜんぶ] [食|た]べて くれました 。', 'When I was ten, I made a rolled omelet for my mom. It burned a little, but she ate it all.'], model: ['[子供|こども] の [頃|ころ] 、 おにぎり を [作|つく]りました 。', 'As a kid, I made onigiri.'],
        react: [
          { if: { lemmas: ['母', 'お母さん', '父', 'お父さん', '家族', 'おばあちゃん', '祖母'] }, say: [['[家族|かぞく] の ため に … 。 いい [話|はなし] です ね 。', 'For your family… What a lovely story.']], mood: 'happy' },
          { say: [['ふふ 、 [最初|さいしょ] の [料理|りょうり] って 、 [忘|わす]れられません よ ね 。', 'Hehe, you never forget your first dish, do you.']], mood: 'happy' },
        ] },
      { id: 'flop', goal: 'Her first loaf came out hard as a stone. Have you ever made a funny mistake you laugh about now? Tell her (in the past).',
        ask: [['わたし の [祖母|そぼ] は 、 [小|ちい]さな パン [屋|や] を やって いました 。 わたし が [初|はじ]めて [焼|や]いた パン は 、 [石|いし] みたい に [固|かた]かった ん です 。', 'My grandmother ran a little bakery. The first bread I ever baked was hard as a stone.'],
          ['あなた は 、 [今|いま] は [笑|わら]える [失敗|しっぱい] が あります か ？', 'Do you have a mistake you can laugh about now?']],
        simpler: ['[面白|おもしろ]い [失敗|しっぱい] 、 ありました か ？', 'Have you ever made a funny mistake?'],
        want: { any: true, time: 'past' },
        tips: { time: 'Tell what happened, in the past: «…ました».' },
        starter: ['___ を [間違|まちが]えて 、 ___ 。', 'I mixed up ___, and ___.'], example: ['[砂糖|さとう] と [塩|しお] を [間違|まちが]えて 、 しょっぱい ケーキ を [作|つく]りました 。 みんな [笑|わら]いました 。', 'I mixed up the sugar and salt and made a salty cake. Everyone laughed.'], model: ['[友達|ともだち] の [名前|なまえ] を [間違|まちが]えました 。', 'I got a friend’s name wrong.'],
        react: [
          { if: { lemmas: ['砂糖', '塩'] }, say: [['あはは ！ それ 、 わたし も 、 [一度|いちど] やりました ！', 'Ahaha! I did that once too!']], mood: 'happy' },
          { say: [['ふふ 、 [失敗|しっぱい] は 、 [後|あと] で いい [話|はなし] に なります ね 。', 'Hehe, mistakes make good stories later.']], mood: 'happy' },
        ] },
      { id: 'why', goal: 'Her grandmother ate the whole stone loaf. Why do you think she did? Give your opinion («…と思います。…から»).',
        ask: [['[祖母|そぼ] は 、 その [固|かた]い パン を 、 [全部|ぜんぶ] [食|た]べて くれました 。 「 [最初|さいしょ] は 、 みんな [石|いし] を [焼|や]く の よ 」 って [笑|わら]いながら 。', 'My grandmother ate that whole hard loaf. Laughing, she said: “Everyone bakes stones at first.”'],
          ['どうして [祖母|そぼ] は 、 [全部|ぜんぶ] [食|た]べた と [思|おも]います か ？', 'Why do you think she ate all of it?']],
        simpler: ['おばあさん は 、 どうして [食|た]べました か ？', 'Why did her grandmother eat it?'],
        want: { any: true, opinion: true, reason: true },
        tips: { opinion: 'Say what you think: «…と思います».', reason: 'Add why, with «…から».' },
        starter: ['___ と [思|おも]います 。', 'I think ___.'], example: ['マルタ さん を [応援|おうえん] したかった ので 、 [全部|ぜんぶ] [食|た]べた と [思|おも]います 。 [失敗|しっぱい] して も 、 [続|つづ]けて ほしかった ん です よ 。', 'I think she ate it all because she wanted to cheer you on. She wanted you to keep going, even after a failure.'], model: ['マルタ さん が [好|す]き だった ので 、 [食|た]べた と [思|おも]います 。', 'I think she ate it because she loved you.'],
        react: [{ say: [['… そう です ね 。 あの [日|ひ] から 、 わたし は [毎朝|まいあさ] パン を [焼|や]いて います 。', '…Yes, I think so too. And since that day, I’ve baked bread every morning.']], mood: 'happy' }] },
    ],
    close: [['[今日|きょう] の パン 、 [一|ひと]つ どうぞ 。 もう [石|いし] じゃ ありません よ 。 ふふ 。', 'Here, have one of today’s loaves. It’s not a stone anymore. Hehe.']],
  };

  const memories = {
    'bruno.1': [['わたし が [最初|さいしょ] に [教|おし]えた の は 、 ノア でした 。 [走|はし]る の は [遅|おそ]かった けど 、 [声|こえ] は [一番|いちばん] [大|おお]きかった です 。', 'The first person I ever coached was Noa. She was slow at running, but she had the loudest voice.']],
    'bruno.2': [['[毎朝|まいあさ] の ラジオ [体操|たいそう] 、 [最初|さいしょ] は わたし [一人|ひとり] でした 。 [今|いま] は ニコ くん も 、 [町|まち] の お[年寄|としよ]り も [来|き]ます 。', 'At first, I did the morning radio exercises all alone. Now Nico comes, and the town’s old folks too.']],
    'bruno.3': [['[監督|かんとく] が [言|い]った [言葉|ことば] 、 [今|いま] でも [覚|おぼ]えて います 。 「 [努力|どりょく] は [裏切|うらぎ]らない 」 。', 'I still remember what my coach said: “Effort never betrays you.”'],
      ['だから 、 あなた が [毎日|まいにち] [話|はな]す の を [見|み]る と 、 うれしい ん です よ 。', 'That’s why it makes me happy to see you speaking every day.']],
    'baker.1': [['うち の パン [屋|や] の [朝|あさ] は 、 [四時|よじ] に [始|はじ]まります 。 [町|まち] で [一番|いちばん] [早|はや]く [起|お]きる の は 、 わたし と パン [生地|きじ] です 。', 'My bakery’s day begins at four. The first ones up in town are me and the dough.']],
    'baker.2': [['ノア は 、 [誕生日|たんじょうび] に いつも 、 メロンパン を ケーキ の かわり に [頼|たの]みました 。 ろうそく を [立|た]てた メロンパン です 。', 'For her birthday, Noa always asked for a melon bread instead of a cake. A melon bread with candles in it.']],
    'baker.3': [['[祖母|そぼ] の パン [屋|や] は 、 もう ありません 。 でも 、 [祖母|そぼ] の レシピ は 、 [全部|ぜんぶ] ここ に あります 。', 'My grandmother’s bakery is gone now. But all her recipes are right here.'],
      ['[固|かた]い パン を [焼|や]いて しまう [日|ひ] も 、 まだ あります 。 そんな [日|ひ] は 、 [祖母|そぼ] の [声|こえ] を [思|おも]い[出|だ]す ん です 。', 'There are still days when my bread comes out hard. On those days, I remember her voice.']],
  };
  const phrases = {
    'ph.talk.ja.fight': { t: 'ファイト ！', en: 'Fight on! (Go for it!)', note: 'Bruno’s cheer. In Japan people shout it to cheer someone on, in sport and in life.' },
    'ph.talk.ja.hayaoki': { t: '[早起|はやお]き は [三文|さんもん] の [得|とく]', en: 'Getting up early pays off. (The early bird gets the worm.)', note: 'An old saying: getting up early earns you “three mon”, a few old coins. Bruno, about your mornings.' },
    'ph.talk.ja.doryoku': { t: '[努力|どりょく] は [裏切|うらぎ]らない', en: 'Effort never betrays you.', note: 'Bruno’s old coach’s words, from his two years on the bench.' },
    'ph.talk.ja.yakitate': { t: '[焼|や]きたて です よ ！', en: 'Fresh from the oven!', note: 'Marta calls it out every morning. ～たて: freshly done (焼きたて, できたて, 炊きたて).' },
    'ph.talk.ja.otanoshimi': { t: 'お[楽|たの]しみ に ！', en: 'Look forward to it! (Wait and see!)', note: 'Marta, about Nico’s secret birthday cake. Say it when you’re keeping a nice surprise.' },
    'ph.talk.ja.shippai': { t: '[失敗|しっぱい] は [成功|せいこう] の もと', en: 'Failure is the root of success.', note: 'A saying for after a mistake. Marta’s grandmother, eating the stone bread.' },
  };
  const rewards = {
    bruno: { 1: { phrase: 'ph.talk.ja.fight', coins: 5 }, 2: { phrase: 'ph.talk.ja.hayaoki', coins: 10 }, 3: { phrase: 'ph.talk.ja.doryoku', coins: 15 } },
    baker: { 1: { phrase: 'ph.talk.ja.yakitate', coins: 5 }, 2: { phrase: 'ph.talk.ja.otanoshimi', coins: 10 }, 3: { phrase: 'ph.talk.ja.shippai', coins: 15 } },
  };
  TALK.content('ja', { scenes: [bruno1, bruno2, bruno3, baker1, baker2, baker3], memories, phrases, rewards });
})();

// ============================================================================ Bartolo and Cande, ranks 1–3
// Bartolo (Remanso's ferryman, on his boat «レマンソ丸»): an old boatman, loud and jolly (わっはっは), a little vain about his
// lake; he talks casually to you, and the models answer him politely. His story: the typhoon night the lighthouse went dark and
// he sang the boats home. Cande (the miners' camp boss): dry, practical, fond of Pío the canary; her story: lost in the mine
// as a young miner, she followed a canary's song out. Both are older, so the models stay polite.
(() => {
  if (typeof TALK === 'undefined') return;
  const bartolo1 = {
    id: 'bartolo.1', who: 'bartolo', band: 1, title: { en: 'On the pier' },
    open: [['おう 、 [来|き]た か ！ わし の 「 レマンソ [丸|まる] 」 へ 、 ようこそ ！ わっはっは ！', 'Hey, you made it! Welcome aboard my “Remanso Maru”! Wahaha!']],
    turns: [
      { id: 'lake', goal: 'Do you like the lake? Tell him.',
        ask: ['どう だ 、 この [湖|みずうみ] 。 きれい だろう ？ [好|す]き か ？', 'Well? Isn’t this lake beautiful? Do you like it?'],
        simpler: ['[湖|みずうみ] 、 [好|す]き か ？ はい ？ いいえ ？', 'The lake: do you like it? Yes? No?'],
        want: { yesno: true },
        starter: ['はい 、 ___ 。', 'Yes, ___.'], example: ['はい 、 とても きれい です 。 [鏡|かがみ] みたい です 。', 'Yes, it’s really beautiful. Like a mirror.'], model: ['はい 、 [好|す]き です 。', 'Yes, I like it.'],
        react: [
          { if: { yes: true }, say: [['だろう ！ [谷|たに] で [一番|いちばん] の [湖|みずうみ] だ ！ わっはっは ！', 'Of course! The finest lake in the valley! Wahaha!']], mood: 'happy' },
          { if: { no: true }, say: [['なに ！ … まあ 、 [夕方|ゆうがた] に また [来|き]な 。 [気|き] が [変|か]わる ぞ 。', 'What! …Well, come back at sunset. You’ll change your mind.']], mood: 'surprised' },
          { say: [['ふむ 。 ゆっくり [見|み]て いき な 。', 'Hm. Take your time and have a good look.']] },
        ] },
      { id: 'swim', goal: 'Can you swim? Tell him («泳げます» / «泳げません»).',
        ask: ['あんた 、 [泳|およ]げる か ？', 'Can you swim?'],
        simpler: ['[水|みず] の [中|なか] 、 [泳|およ]げます か ？', 'In the water: can you swim?'],
        want: { yesno: true, lemmas: ['泳ぐ', '水泳'] },
        starter: ['はい 、 [泳|およ]げます 。 ／ いいえ 、 [泳|およ]げません 。', 'Yes, I can swim. / No, I can’t.'], example: ['はい 、 [泳|およ]げます 。 でも 、 [冷|つめ]たい [水|みず] は [苦手|にがて] です 。', 'Yes, I can. But I’m not good with cold water.'], model: ['はい 、 [泳|およ]げます 。', 'Yes, I can swim.'],
        react: [
          { if: { no: true }, say: [['[心配|しんぱい] する な 。 わし の [船|ふね] は 、 [一度|いちど] も [沈|しず]んだ こと が ない ！', 'Don’t worry. My boat has never once sunk!']] },
          { say: [['いい ぞ 。 でも 、 この [湖|みずうみ] は [冷|つめ]たい から な 。', 'Good. But this lake is cold, mind.']] },
        ] },
      { id: 'fish', goal: 'Do you like fish? Which one?',
        ask: ['[魚|さかな] は [好|す]き か ？ わし は [毎朝|まいあさ] [釣|つ]る ん だ 。', 'Do you like fish? I catch some every morning.'],
        simpler: ['[魚|さかな] 、 [食|た]べます か ？', 'Do you eat fish?'],
        want: { yesno: true, topic: 'food' },
        starter: ['はい 、 ___ が [好|す]き です 。', 'Yes, I like ___.'], example: ['はい 、 [好|す]き です 。 [特|とく]に [焼|や]いた [魚|さかな] が [好|す]き です 。', 'Yes, I do. I especially like grilled fish.'], model: ['はい 、 [魚|さかな] が [好|す]き です 。', 'Yes, I like fish.'],
        react: [
          { if: { yes: true }, say: [['よし ！ [今度|こんど] 、 わし の [焼|や]き[魚|ざかな] を [食|く]わせて やる 。', 'Great! Next time I’ll treat you to my grilled fish.']], mood: 'happy' },
          { say: [['そう か 。 まあ 、 [人|ひと] それぞれ だ 。', 'Is that so. Well, to each their own.']] },
        ] },
      { id: 'boat', goal: 'Boat or bridge: which do you like better for crossing?',
        ask: ['[橋|はし] と [船|ふね] 、 どっち が いい ？ もちろん [船|ふね] だろう ？', 'Bridge or boat, which is better? The boat, surely?'],
        simpler: ['[橋|はし] ？ [船|ふね] ？', 'Bridge? Boat?'],
        want: { lemmas: ['橋', '船', 'フェリー', '両方', 'どっち'] },
        starter: ['___ の ほう が いい です 。', '___ is better.'], example: ['[船|ふね] の ほう が いい です 。 [風|かぜ] が [気持|きも]ち いい です から 。', 'The boat is better. Because the breeze feels nice.'], model: ['[船|ふね] が いい です 。', 'The boat is better.'],
        react: [
          { if: { lemmas: ['船', 'フェリー'] }, say: [['わっはっは ！ わかって る な 、 あんた ！', 'Wahaha! You know what’s what!']], mood: 'happy' },
          { if: { lemmas: ['橋'] }, say: [['[橋|はし] ！ … [橋|はし] は [歌|うた] を [歌|うた]わない ぞ 。', 'The bridge! …A bridge doesn’t sing to you, you know.']], mood: 'sad' },
          { say: [['ふむ 。', 'Hm.']] },
        ] },
    ],
    close: [['よし 、 [出航|しゅっこう] だ ！ しっかり つかまって な ！', 'Right, we’re casting off! Hold on tight!']],
  };
  const bartolo2 = {
    id: 'bartolo.2', who: 'bartolo', band: 2, title: { en: 'The ferry and your week' },
    open: [['おう ！ また わし の [船|ふね] に [乗|の]り に [来|き]た な ？', 'Hey! Back for another ride on my boat?']],
    turns: [
      { id: 'today', goal: 'What did you do today? (in the past)',
        ask: ['[今日|きょう] は [何|なに] を した ん だ ？', 'What did you do today?'],
        simpler: ['[今日|きょう] 、 どこ へ [行|い]きました か ？ [何|なに] を しました か ？', 'Where did you go today? What did you do?'],
        want: { any: true, time: 'past' },
        tips: { time: 'Tell what you did today, in the past: «行きました», «しました».' },
        starter: ['[今日|きょう] は ___ 。', 'Today I ___.'], example: ['[今日|きょう] は [村|むら] を [散歩|さんぽ] して 、 [桟橋|さんばし] で [焼|や]き[魚|ざかな] を [食|た]べました 。', 'Today I walked around the village and ate grilled fish on the pier.'], model: ['[今日|きょう] は [湖|みずうみ] を [見|み]ました 。', 'Today I looked at the lake.'],
        react: [
          { if: { lemmas: ['魚'] }, say: [['わし の [友達|ともだち] の [店|みせ] だ な 。 うまい だろう ？', 'That’s my friend’s stall. Good, isn’t it?']], mood: 'happy' },
          { say: [['そう か 、 いい [一日|いちにち] だ な 。', 'I see, a good day then.']] },
        ] },
      { id: 'island', goal: 'Are you planning to go to the island tomorrow? Tell him («予定です» / «つもりです»).',
        ask: ['[明日|あした] 、 [島|しま] へ [行|い]く [予定|よてい] は ある か ？', 'Any plans to go to the island tomorrow?'],
        simpler: ['[明日|あした] 、 [島|しま] へ [行|い]きます か ？', 'Will you go to the island tomorrow?'],
        want: { yesno: true },
        starter: ['はい 、 ___ [予定|よてい] です 。', 'Yes, I’m planning to ___.'], example: ['はい 、 [灯台|とうだい] を [見|み]に [行|い]く [予定|よてい] です 。', 'Yes, I’m planning to go and see the lighthouse.'], model: ['はい 、 [行|い]く つもり です 。', 'Yes, I’m planning to go.'],
        react: [
          { if: { yes: true }, say: [['よし ！ [朝|あさ] [一番|いちばん] の [船|ふね] で [連|つ]れて いって やる ！', 'Great! I’ll take you on the first boat in the morning!']], mood: 'happy' },
          { say: [['そう か 。 いつ でも [乗|の]せて やる ぞ 。', 'I see. I’ll take you any time.']] },
        ] },
      { id: 'time', goal: 'What time do you want to take the boat? (…時)',
        ask: ['[何時|なんじ] の [船|ふね] に [乗|の]りたい ？', 'What time do you want to sail?'],
        simpler: ['[八時|はちじ] ？ [十時|じゅうじ] ？', 'Eight? Ten?'],
        want: { number: true },
        starter: ['___ [時|じ] の [船|ふね] に [乗|の]りたい です 。', 'I’d like the ___ o’clock boat.'], example: ['[朝|あさ] は ゆっくり したい ので 、 [九時|くじ] の [船|ふね] に [乗|の]りたい です 。', 'I like a slow morning, so I’d like the nine o’clock boat.'], model: ['[十時|じゅうじ] の [船|ふね] に [乗|の]りたい です 。', 'I’d like the ten o’clock boat.'],
        react: [
          { if: { num: [4, 7] }, say: [['[早|はや]い な ！ [気|き] に [入|い]った ぞ 。', 'Early! I like it.']], mood: 'happy' },
          { say: [['よし 、 [待|ま]って る ぞ 。 [遅|おく]れる な よ ！', 'Right, I’ll be waiting. Don’t be late!']] },
        ] },
      { id: 'song', goal: 'He loves to sing. Do you like singing? What kind of songs?',
        ask: ['わし は [歌|うた] が [大好|だいす]き で な 。 あんた は 、 [歌|うた] は [好|す]き か ？', 'I love singing, you know. Do you like to sing?'],
        simpler: ['[歌|うた] 、 [好|す]き です か ？', 'Do you like songs?'],
        want: { yesno: true, topic: 'music' },
        starter: ['はい 、 ___ 。', 'Yes, ___.'], example: ['はい 、 [好|す]き です 。 でも 、 [下手|へた] です 。 ふふ 。', 'Yes, I do. But I’m bad at it. Hehe.'], model: ['はい 、 [好|す]き です 。', 'Yes, I like it.'],
        react: [
          { if: { lemmas: ['下手'] }, say: [['わっはっは ！ わし も だ ！ [下手|へた] な [歌|うた] は 、 [大|おお]きな [声|こえ] で [歌|うた]え ば いい ん だ 。', 'Wahaha! Me too! If you sing badly, just sing loudly.']], mood: 'happy' },
          { say: [['いい ぞ ！ [今度|こんど] 、 [船|ふね] の [上|うえ] で [一緒|いっしょ] に [歌|うた]おう ！', 'Good! Next time, let’s sing together on the boat!']], mood: 'happy' },
        ] },
    ],
    close: [['じゃあ な ！ [湖|みずうみ] は 、 いつ でも あんた を [待|ま]って る ぞ 。', 'See you! The lake will always be waiting for you.']],
  };
  const bartolo3 = {
    id: 'bartolo.3', who: 'bartolo', band: 3, title: { en: 'The night of the typhoon' },
    open: [['[今日|きょう] は [静|しず]か な [湖|みずうみ] だ な 。 … ちょっと 、 [昔|むかし] の [話|はなし] を して も いい か ？', 'The lake’s calm today. …Mind if I tell you an old story?']],
    turns: [
      { id: 'storm', goal: 'Tell him about a big storm or typhoon you remember (in the past). What did you do?',
        ask: [['[若|わか]い [頃|ころ] 、 ひどい [台風|たいふう] の [夜|よる] が あった 。 [灯台|とうだい] の [明|あ]かり が [消|き]えて 、 [漁|りょう] の [船|ふね] が [帰|かえ]れなく なった ん だ 。', 'When I was young, there was a terrible typhoon night. The lighthouse went dark, and the fishing boats couldn’t find their way home.'],
          ['あんた は 、 [大|おお]きな [嵐|あらし] の [日|ひ] を [覚|おぼ]えて いる か ？ その [時|とき] 、 [何|なに] を して いた ？', 'Do you remember a day with a big storm? What were you doing?']],
        simpler: ['[嵐|あらし] の [日|ひ] 、 [何|なに] を しました か ？', 'On a stormy day, what did you do?'],
        want: { any: true, time: 'past' },
        tips: { time: 'Tell it as it happened: «…ていました», «…しました».' },
        starter: ['[嵐|あらし] の [日|ひ] 、 ___ 。', 'On the day of the storm, I ___.'], example: ['[子供|こども] の [頃|ころ] 、 [台風|たいふう] で [電気|でんき] が [消|き]えました 。 [家族|かぞく] と ろうそく の [下|した] で 、 トランプ を しました 。', 'As a kid, the power went out in a typhoon. I played cards with my family by candlelight.'], model: ['[家|いえ] で [窓|まど] の [外|そと] を [見|み]て いました 。', 'I watched outside the window at home.'],
        react: [
          { if: { lemmas: ['家族', '母', '父', '一緒'] }, say: [['[嵐|あらし] の [夜|よる] は 、 [家族|かぞく] が [近|ちか]く に いる と [安心|あんしん] だ な 。', 'On a stormy night, it’s a comfort to have your family close.']] },
          { say: [['そう か 。 [嵐|あらし] の [夜|よる] は 、 [誰|だれ] でも [怖|こわ]い もん だ 。', 'I see. Everyone’s afraid on a stormy night.']] },
        ] },
      { id: 'sing', goal: 'He sang so loudly that the boats followed his voice home. What do you think of that? Give your opinion («…と思います»).',
        ask: [['わし は [桟橋|さんばし] の [先|さき] に [立|た]って 、 [一晩中|ひとばんじゅう] [歌|うた]った 。 [下手|へた] な [歌|うた] を 、 [大|おお]きな [声|こえ] で な 。', 'I stood at the end of the pier and sang all night. Badly, but loud.'],
          ['[漁師|りょうし] たち は 、 わし の [声|こえ] を [聞|き]いて 、 [全員|ぜんいん] [帰|かえ]って きた 。 … どう [思|おも]う ？', 'The fishermen heard my voice, and every one of them made it home. …What do you think?']],
        simpler: ['バルトロ さん の [歌|うた] 、 すごい と [思|おも]います か ？', 'Do you think Bartolo’s singing was amazing?'],
        want: { any: true, opinion: true },
        tips: { opinion: 'Say what you think: «…と思います».' },
        starter: ['___ と [思|おも]います 。', 'I think ___.'], example: ['とても [勇気|ゆうき] が ある と [思|おも]います 。 [下手|へた] でも 、 [声|こえ] は [人|ひと] を [助|たす]ける ん です ね 。', 'I think it was really brave. Even sung badly, a voice can save people.'], model: ['すごい と [思|おも]います 。', 'I think it’s amazing.'],
        react: [
          { if: { lemmas: ['勇気', '助ける', '声'] }, say: [['… ありがとう よ 。 あの [夜|よる] から 、 わし は [歌|うた] を やめない と [決|き]めた ん だ 。', '…Thanks. From that night on, I decided I’d never stop singing.']], mood: 'happy' },
          { say: [['わっはっは ！ [照|て]れる な あ 。', 'Wahaha! You’re making me blush.']], mood: 'happy' },
        ] },
      { id: 'you', goal: 'If you were on the pier that night, what would you do? Use «もし…たら» or «…なら».',
        ask: ['もし あんた が あの [夜|よる] 、 [桟橋|さんばし] に いたら 、 どう する ？', 'If you’d been on the pier that night, what would you have done?'],
        simpler: ['あの [夜|よる] 、 あなた なら [何|なに] を します か ？', 'That night, what would you do?'],
        want: { any: true, time: 'hypo' },
        tips: { time: 'It’s a “what if”: «もし…いたら、…» or «わたしなら…».' },
        starter: ['もし [桟橋|さんばし] に いたら 、 ___ 。', 'If I’d been on the pier, I’d ___.'], example: ['もし [桟橋|さんばし] に いたら 、 [一緒|いっしょ] に [歌|うた]います 。 [二人|ふたり] なら 、 [声|こえ] が もっと [遠|とお]く まで [届|とど]きます から 。', 'If I’d been on the pier, I’d sing with you. With two of us, our voices would carry further.'], model: ['わたし なら 、 [一緒|いっしょ] に [歌|うた]います 。', 'Me, I’d sing with you.'],
        react: [
          { if: { lemmas: ['歌う', '歌', '一緒'] }, say: [['いい ぞ ！ [次|つぎ] の [嵐|あらし] は 、 [二人|ふたり] で [歌|うた]おう ！ わっはっは ！', 'Great! Next storm, we’ll sing together! Wahaha!']], mood: 'happy' },
          { say: [['ふむ 、 [頼|たの]もしい な 。', 'Hm, you’re someone to count on.']] },
        ] },
    ],
    close: [['[灯台|とうだい] が また [光|ひか]って 、 わし も [安心|あんしん] した よ 。 あんた の おかげ だ 。', 'With the lighthouse shining again, I can rest easy. Thanks to you.']],
  };

  // ------------------------------------------------------------ Cande, the miners' camp boss
  const cande1 = {
    id: 'cande.1', who: 'cande', band: 1, title: { en: 'Tea at the camp' },
    open: [['お 、 [来|き]た ね 。 まあ 、 [座|すわ]って 。 [今|いま] 、 [何|なに] か [飲|の]む もの を [出|だ]す よ 。', 'Oh, you came. Well, sit down. I’ll get you something to drink.']],
    turns: [
      { id: 'drink', goal: 'Tea or coffee? Tell her.',
        ask: ['お[茶|ちゃ] と コーヒー 、 どっち が いい ？', 'Tea or coffee, which do you want?'],
        simpler: ['お[茶|ちゃ] ？ コーヒー ？', 'Tea? Coffee?'],
        want: { topic: 'drink', lemmas: ['お茶', '茶', 'コーヒー', '水', '麦茶', 'ジュース', '両方', 'どっち'] },
        starter: ['___ を お[願|ねが]い します 。', '___, please.'], example: ['お[茶|ちゃ] を お[願|ねが]い します 。 あたたかい の が いい です 。', 'Tea, please. A hot one would be nice.'], model: ['お[茶|ちゃ] が いい です 。', 'Tea, please.'],
        react: [
          { if: { lemmas: ['コーヒー'] }, say: [['いい ね 。 ここ の コーヒー は 、 [石|いし] みたい に [濃|こ]い よ 。', 'Good. The coffee here is as strong as rock.']], mood: 'happy' },
          { say: [['はい よ 。 [熱|あつ]い から 、 [気|き] を つけて 。', 'Here you go. It’s hot, careful.']] },
        ] },
      { id: 'tired', goal: 'Are you tired from the climb? Tell her.',
        ask: ['ここ まで [登|のぼ]って きて 、 [疲|つか]れた でしょう ？', 'You must be tired after the climb up here?'],
        simpler: ['[疲|つか]れました か ？', 'Are you tired?'],
        want: { yesno: true, topic: 'feeling' },
        starter: ['はい 、 ___ 。 ／ いいえ 、 ___ 。', 'Yes, ___. / No, ___.'], example: ['はい 、 ちょっと [疲|つか]れました 。 でも 、 [景色|けしき] が きれい でした 。', 'Yes, I’m a bit tired. But the view was beautiful.'], model: ['はい 、 [疲|つか]れました 。', 'Yes, I’m tired.'],
        react: [
          { if: { no: true }, say: [['へえ 、 [強|つよ]い ね 。 うち の [鉱夫|こうふ] に なる ？', 'Huh, you’re tough. Want to be one of my miners?']], mood: 'surprised' },
          { say: [['だろう ね 。 ゆっくり [休|やす]み な 。', 'I bet. Take a good rest.']] },
        ] },
      { id: 'mountain', goal: 'Do you like the mountains? Tell her.',
        ask: ['[山|やま] は [好|す]き ？', 'Do you like the mountains?'],
        simpler: ['[山|やま] 、 [好|す]き です か ？', 'Do you like mountains?'],
        want: { yesno: true },
        starter: ['はい 、 ___ 。', 'Yes, ___.'], example: ['はい 、 [好|す]き です 。 [空気|くうき] が おいしい です から 。', 'Yes, I do. The air is so fresh.'], model: ['はい 、 [好|す]き です 。', 'Yes, I like them.'],
        react: [
          { if: { yes: true }, say: [['わかって る ね 。 [山|やま] は うそ を つかない 。', 'You get it. The mountains don’t lie.']], mood: 'happy' },
          { say: [['まあ 、 [慣|な]れる よ 。', 'Well, you’ll get used to them.']] },
        ] },
      { id: 'pio', goal: 'What do you think of Pío, her canary?',
        ask: ['この [子|こ] は ピオ 。 わたし の カナリア 。 どう ？', 'This is Pío. My canary. What do you think?'],
        simpler: ['ピオ 、 かわいい ？', 'Pío: cute?'],
        want: { any: true },
        starter: ['___ です 。', 'It’s ___.'], example: ['とても かわいい です 。 [黄色|きいろ] が きれい です ね 。', 'It’s really cute. Its yellow is lovely.'], model: ['かわいい です 。', 'It’s cute.'],
        react: [
          { if: { lemmas: ['可愛い', 'きれい', '好き'] }, say: [['でしょう 。 … ピオ 、 [聞|き]いた ？ ほめられた よ 。', 'Isn’t it. …Pío, did you hear? Someone’s praising you.']], mood: 'happy' },
          { say: [['ふん 。 ピオ は 、 [誰|だれ] より も [歌|うた] が うまい ん だ よ 。', 'Hmph. Pío sings better than anyone, you know.']] },
        ] },
    ],
    close: [['ゆっくり して いき な 。 [仕事|しごと] が ある から 、 わたし は [戻|もど]る よ 。', 'Stay as long as you like. I’ve got work, so I’ll get back to it.']],
  };
  const cande2 = {
    id: 'cande.2', who: 'cande', band: 2, title: { en: 'Shifts and plans' },
    open: [['また [来|き]た の ？ ちょうど [休憩|きゅうけい] の [時間|じかん] だ よ 。', 'Back again? It’s just my break.']],
    turns: [
      { id: 'sleep', goal: 'How many hours did you sleep last night? (in the past: «…時間寝ました»)',
        ask: ['[昨日|きのう] は 、 [何時間|なんじかん] [寝|ね]た ？', 'How many hours did you sleep last night?'],
        simpler: ['[六時間|ろくじかん] ？ [八時間|はちじかん] ？', 'Six hours? Eight?'],
        want: { number: true, time: 'past' },
        tips: { time: 'Last night already happened: «…時間寝ました».' },
        starter: ['___ [時間|じかん] [寝|ね]ました 。', 'I slept ___ hours.'], example: ['[七時間|ななじかん] [寝|ね]ました 。 でも 、 まだ [眠|ねむ]い です 。', 'I slept seven hours. But I’m still sleepy.'], model: ['[八時間|はちじかん] [寝|ね]ました 。', 'I slept eight hours.'],
        react: [
          { if: { num: [1, 5] }, say: [['それ じゃ [足|た]りない よ 。 [今夜|こんや] は [早|はや]く [寝|ね]な 。', 'That’s not enough. Go to bed early tonight.']], mood: 'surprised' },
          { say: [['いい ね 。 [寝|ね]る の も [仕事|しごと] の うち だ よ 。', 'Good. Sleeping is part of the job.']] },
        ] },
      { id: 'tomorrow', goal: 'What are you planning to do tomorrow? («…予定です» / «…つもりです»)',
        ask: ['[明日|あした] は 、 どう する [予定|よてい] ？', 'What are your plans for tomorrow?'],
        simpler: ['[明日|あした] は [何|なに] を します か ？', 'What will you do tomorrow?'],
        want: { any: true },
        starter: ['[明日|あした] は ___ [予定|よてい] です 。', 'Tomorrow I plan to ___.'], example: ['[明日|あした] は [鉱山|こうざん] の [奥|おく] へ [行|い]く [予定|よてい] です 。 [銅鑼|どら] を [探|さが]します 。', 'Tomorrow I plan to go deep into the mine. I’ll look for the gong.'], model: ['[明日|あした] は [山|やま] を [歩|ある]く つもり です 。', 'Tomorrow I’m planning to walk in the mountains.'],
        react: [
          { if: { lemmas: ['鉱山', '銅鑼', 'トンネル', '洞窟'] }, say: [['[一人|ひとり] で [行|い]く の は だめ 。 ランプ と 、 わたし の [笛|ふえ] を [持|も]って いき な 。', 'Don’t go alone. Take a lamp, and my whistle.']], mood: 'surprised' },
          { say: [['そう 。 [気|き] を つけて ね 。', 'I see. Be careful.']] },
        ] },
      { id: 'eat', goal: 'After a long day, what do you want to eat?',
        ask: ['[仕事|しごと] の [後|あと] 、 [何|なに] が [食|た]べたい ？', 'After work, what do you feel like eating?'],
        simpler: ['[何|なに] が [食|た]べたい です か ？', 'What do you want to eat?'],
        want: { topic: 'food', lemmas: ['全部', '何'] },
        starter: ['___ が [食|た]べたい です 。', 'I want to eat ___.'], example: ['[温|あたた]かい ラーメン が [食|た]べたい です 。 [寒|さむ]い です から 。', 'I want some hot ramen. Because it’s cold.'], model: ['カレー が [食|た]べたい です 。', 'I want to eat curry.'],
        react: [
          { if: { lemmas: ['カレー'] }, say: [['[今夜|こんや] は カレー だ よ ！ [鉱夫|こうふ] の カレー は 、 [世界一|せかいいち] だ 。', 'Tonight it’s curry! Miners’ curry is the best in the world.']], mood: 'happy' },
          { say: [['{echo|いい ね 。} [今度|こんど] 、 [作|つく]って あげる よ 。', '{echo|Nice.} I’ll make it for you sometime.']], mood: 'happy' },
        ] },
    ],
    close: [['さて 、 [休憩|きゅうけい] [終|お]わり 。 [話|はな]せて よかった よ 。', 'Right, break’s over. Glad we talked.']],
  };
  const cande3 = {
    id: 'cande.3', who: 'cande', band: 3, title: { en: 'A voice in the dark' },
    open: [['… ピオ の おばあちゃん の [話|はなし] 、 した こと あった っけ ？', '…Did I ever tell you about Pío’s grandmother?']],
    turns: [
      { id: 'lost', goal: 'Have you ever been lost? Tell her when, and what happened (～たことがある, the past).',
        ask: [['わたし は [若|わか]い [頃|ころ] 、 [鉱山|こうざん] の [中|なか] で [道|みち] に [迷|まよ]った こと が ある 。 ランプ も [消|き]えて 、 [真|ま]っ[暗|くら] だった 。', 'When I was young, I once got lost inside the mine. My lamp went out too; it was pitch black.'],
          ['あんた は 、 [道|みち] に [迷|まよ]った こと が ある ？ どう なった ？', 'Have you ever been lost? What happened?']],
        simpler: ['[道|みち] に [迷|まよ]った こと 、 あります か ？', 'Have you ever lost your way?'],
        want: { any: true, time: 'past' },
        tips: { time: 'Use the “have you ever” shape, «迷ったことがあります», or tell what happened in the past.' },
        starter: ['はい 、 ___ で [迷|まよ]った こと が あります 。', 'Yes, I once got lost in ___.'], example: ['はい 、 [大|おお]きな [駅|えき] で [迷|まよ]った こと が あります 。 [知|し]らない [人|ひと] が [助|たす]けて くれました 。', 'Yes, I once got lost in a big station. A stranger helped me.'], model: ['はい 、 [森|もり] で [迷|まよ]った こと が あります 。', 'Yes, I once got lost in a forest.'],
        react: [
          { if: { lemmas: ['助ける', '人', '教える'] }, say: [['[優|やさ]しい [人|ひと] が いて 、 よかった ね 。', 'Good thing someone kind was there.']] },
          { say: [['[怖|こわ]かった でしょう 。 [迷|まよ]う と 、 [時間|じかん] が [長|なが]く [感|かん]じる よ ね 。', 'That must have been scary. When you’re lost, time feels so long.']] },
        ] },
      { id: 'song', goal: 'She found her way out by following a canary’s song. What helps you when you’re scared? Give a reason («…から»).',
        ask: [['[暗|くら]い [中|なか] で 、 [小|ちい]さな [歌|うた] が [聞|き]こえた 。 ピオ の おばあちゃん の カナリア だ よ 。 その [声|こえ] に ついて いって 、 [外|そと] に [出|で]られた 。', 'In the dark, I heard a little song. It was Pío’s grandmother, the canary. I followed that voice, and made it out.'],
          ['あんた は 、 [怖|こわ]い [時|とき] 、 [何|なに] が [助|たす]け に なる ？ どうして ？', 'When you’re scared, what helps you? Why?']],
        simpler: ['[怖|こわ]い [時|とき] 、 [何|なに] を します か ？', 'When you’re scared, what do you do?'],
        want: { any: true, reason: true },
        tips: { reason: 'She asked why: add a reason with «…から».' },
        starter: ['___ が [助|たす]け に なります 。 ___ から です 。', '___ helps me. Because ___.'], example: ['[好|す]きな [歌|うた] を [歌|うた]います 。 [歌|うた]う と 、 [心|こころ] が [落|お]ち[着|つ]く から です 。', 'I sing a song I love. Because singing calms my heart.'], model: ['[友達|ともだち] と [話|はな]します 。 [安心|あんしん] する から です 。', 'I talk to a friend. Because it makes me feel safe.'],
        react: [
          { if: { lemmas: ['歌', '歌う', '音楽'] }, say: [['ほら ね 。 [歌|うた] は 、 [暗|くら]い [所|ところ] で も [道|みち] に なる 。', 'See? A song can be a path, even in the dark.']], mood: 'happy' },
          { say: [['なるほど ね 。 [自分|じぶん] の 「 [歌|うた] 」 が ある の は 、 いい こと だ よ 。', 'I see. It’s good to have your own “song”.']] },
        ] },
      { id: 'pio', goal: 'Should she take Pío down into the mine again? Say what you think («…と思います»), and why.',
        ask: ['[銅鑼|どら] が [鳴|な]らない [今|いま] 、 ピオ を [鉱山|こうざん] に [連|つ]れて いく べき だ と [思|おも]う ？', 'With the gong silent, do you think I should take Pío down the mine?'],
        simpler: ['ピオ は 、 [鉱山|こうざん] に [行|い]く ほう が いい ？', 'Should Pío go into the mine?'],
        want: { any: true, opinion: true },
        tips: { opinion: 'Say what you think: «…と思います».' },
        starter: ['___ と [思|おも]います 。 ___ から です 。', 'I think ___. Because ___.'], example: ['[連|つ]れて いった ほう が いい と [思|おも]います 。 ピオ の [歌|うた] は 、 [静寂|せいじゃく] より [強|つよ]い から です 。', 'I think you should take it. Because Pío’s song is stronger than the Hush.'], model: ['[連|つ]れて いかない ほう が いい と [思|おも]います 。', 'I think it’s better not to take it.'],
        react: [
          { if: { neg: true }, say: [['… そう だ ね 。 ピオ は 、 ここ で わたしたち を [待|ま]って いて もらおう 。', '…You’re right. Pío can wait for us here.']] },
          { say: [['… わかった 。 ピオ 、 [一緒|いっしょ] に [行|い]こう 。 また 、 [道|みち] を [教|おし]えて ね 。', '…All right. Pío, let’s go together. Show us the way again.']], mood: 'happy' },
        ] },
    ],
    close: [['ありがとう 。 あんた と [話|はな]す と 、 なんだか [暗|くら]い トンネル に [光|ひかり] が [入|はい]る みたい だ よ 。', 'Thanks. Talking with you is like light getting into a dark tunnel.']],
  };

  const memories = {
    'bartolo.1': [['この [船|ふね] は 、 わし の じいさん が [作|つく]った ん だ 。 [名前|なまえ] も じいさん が つけた 。 「 レマンソ [丸|まる] 」 … [単純|たんじゅん] だろう ？ わっはっは ！', 'My grandfather built this boat. He named it too: “Remanso Maru”… Not very imaginative, eh? Wahaha!']],
    'bartolo.2': [['[若|わか]い [頃|ころ] は ね 、 [毎晩|まいばん] [湖|みずうみ] の [上|うえ] で [歌|うた]って いた 。 [魚|さかな] が [逃|に]げる って 、 よく [怒|おこ]られた もん だ 。', 'When I was young, I sang out on the lake every night. They were always scolding me for scaring off the fish.']],
    'bartolo.3': [['あの [嵐|あらし] の [夜|よる] 、 [最後|さいご] に [帰|かえ]って きた [船|ふね] に は 、 [若|わか]い [漁師|りょうし] と 、 [小|ちい]さな [息子|むすこ] が [乗|の]って いた 。', 'That stormy night, the last boat home carried a young fisherman and his little son.'],
      ['その [息子|むすこ] は 、 [今|いま] 、 [船|ふね] を [作|つく]って いる 。 [理由|りゆう] は 、 わかる だろう ？', 'That son builds boats now. You can guess why, eh?']],
    'cande.1': [['[鉱夫|こうふ] は ね 、 [昔|むかし] から カナリア を [連|つ]れて [鉱山|こうざん] に [入|はい]る ん だ 。 [空気|くうき] が [悪|わる]い と 、 [歌|うた] を やめる から ね 。', 'Miners have always taken canaries into the mine. If the air goes bad, they stop singing.']],
    'cande.2': [['ノア が ここ に いた [時|とき] 、 [毎晩|まいばん] みんな に [本|ほん] を [読|よ]んで くれた 。 [鉱夫|こうふ] たち 、 [子供|こども] みたい に [聞|き]いて た よ 。', 'When Noa was here, she read to everyone every night. The miners listened like children.']],
    'cande.3': [['あの カナリア の [名前|なまえ] も 、 ピオ だった 。 だから この [子|こ] も ピオ 。 わたし の [命|いのち] の [恩人|おんじん] の [名前|なまえ] だ よ 。', 'That canary was called Pío too. So this one is Pío. It’s the name of the one who saved my life.']],
  };
  const phrases = {
    'ph.talk.ja.wahaha': { t: 'わっはっは ！', en: 'Wahaha! (a big, booming laugh)', note: 'Bartolo’s laugh. Japanese writes laughs as words: ははは, ふふ, わっはっは.' },
    'ph.talk.ja.yoroshikutanomu': { t: 'よろしく [頼|たの]む ぞ ！', en: 'I’m counting on you!', note: 'An old man’s casual よろしくお願いします. Bartolo, handing you the oars.' },
    'ph.talk.ja.kaze': { t: '[船|ふね] は [風|かぜ] まかせ', en: 'A boat goes where the wind takes it. (Go with the flow.)', note: 'Bartolo, about the typhoon night and everything since.' },
    'ph.talk.ja.otsukare': { t: 'お[疲|つか]れ [様|さま] ！', en: 'Thanks for your hard work! (Good job today!)', note: 'Said at the end of work, to the people you worked with. Cande says it to every miner, every evening.' },
    'ph.talk.ja.yasumu': { t: '[休|やす]む の も [仕事|しごと] の うち', en: 'Resting is part of the job.', note: 'Cande, sending you to bed early.' },
    'ph.talk.ja.inochi': { t: '[命|いのち] の [恩人|おんじん]', en: 'the one who saved my life', note: 'Cande, about the canary that sang her out of the dark mine.' },
  };
  const rewards = {
    bartolo: { 1: { phrase: 'ph.talk.ja.wahaha', coins: 5 }, 2: { phrase: 'ph.talk.ja.yoroshikutanomu', coins: 10 }, 3: { phrase: 'ph.talk.ja.kaze', coins: 15 } },
    cande: { 1: { phrase: 'ph.talk.ja.otsukare', coins: 5 }, 2: { phrase: 'ph.talk.ja.yasumu', coins: 10 }, 3: { phrase: 'ph.talk.ja.inochi', coins: 15 } },
  };
  TALK.content('ja', { scenes: [bartolo1, bartolo2, bartolo3, cande1, cande2, cande3], memories, phrases, rewards });
})();
