'use strict';
// Susumu's half of the anime siblings (Japanese games only; anime.js owns the house, the rooms and Otoha; DESIGN.md 14.11).
// The user: "her little brother who tells you fun facts about japanese mangas and shows, he should also be really good at
// dance dance revolution".
//
// Susumu (ススム, 9) lives in the pink house's back room (anime.js: Alba's 'alba-house-13', his room at (−160, 300, 30)).
// He knows every manga fact there is (kept to accurate, evergreen history and culture: no episode counts, no "latest"
// news, no quotes, no likenesses) and he's the undefeated champion of «ヤジルシ★フィーバー» (Yajirushi Fever, "arrow
// fever"), an ORIGINAL arcade dance-step machine with its own look and its own songs (not Konami's game). Its lesson: it
// calls the steps as WORDS, never arrows: みぎ / ひだり / うえ / した (右 左 上 下 with ruby in character mode, fading as you
// learn them), then counters (右 2回: two quick steps), はんたい (do the opposite) and ジャンプ (left and right at once).
// And it's output-first: before battles you declare the match out loud, and you CALL steps for Mimo with words (コール).
// Five chapters, unlocked by the story like Otoha's (Rosa's welcome, the field's big Hushling, bells 1, 2, 3):
//   1 漫画とアニメ: right to left, コマ, 吹き出し, 漫画 vs アニメ · the machine's first lesson (みぎ / ひだり)
//   2 擬音 (sound words): ドキドキ ゴゴゴ シーン キラキラ ワクワク · battle 1 (+ うえ / した, read the words!)
//   3 漫画の歴史: 北斎漫画 (1814), 手塚治虫 "the god of manga", Astro Boy on TV (1963), weekly magazines, color TV anime (1965)
//     · battle 2 (+ counters: 右 2回)
//   4 アニメの世界: 声優, OP / ED, コミケ (since 1975), 少年 / 少女 / 青年 · battle 3 (+ はんたい, ジャンプ)
//   5 ステップ王決定戦: he admits he's scared of losing his title; Mimo's warm-up call; the final. Win: his medal for Mimo.
// Progress: G.state.dance. Songs: four machine tracks through ANIME.MUSIC (Sound.addSong / Sound.kit).
//   DANCE.init(game) (ANIME.init calls it) · DANCE.arrive() (ANIME: you walk into his room) · DANCE.talk() · DANCE.machine()
//   · DANCE.update(dt, t) (ANIME's room update, every frame in his room) · DANCE.busy · DANCE.medalOn() · DANCE._ (tests: DANCE._.t)

const DANCE = (() => {
  let G = null;
  const A = () => (typeof ANIME !== 'undefined' ? ANIME : null);
  const L = () => (G && G.state && G.state.lang) || 'es';
  const isOn = () => L() === 'ja';
  const cmode = () => (typeof CJK !== 'undefined' ? CJK.mode('ja') : 'roman');
  const S = () => {
    const s = G.state;
    if (!s.dance) s.dance = { met: false, ch: 0, facts: {}, wins: {}, losses: {}, best: {}, medal: false, medalOn: false, calls: 0 };
    const d = s.dance; d.facts = d.facts || {}; d.wins = d.wins || {}; d.losses = d.losses || {}; d.best = d.best || {};
    return d;
  };
  const INK = '#2b2235', PINK = '#ff5fa2', TEAL = '#21c4b4', GOLD = '#ffcf3f';
  const FONT = '"Yu Gothic UI", "Yu Gothic", "Meiryo", "Hiragino Kaku Gothic ProN", "Noto Sans CJK JP", sans-serif';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const J = (src, o = {}) => (typeof CJK !== 'undefined' ? CJK.html(src, Object.assign({ lang: 'ja' }, o)) : esc(src));
  const JP = src => (typeof CJK !== 'undefined' ? CJK.plain(src, { lang: 'ja' }) : src);
  const canon = s => { try { return CJK.canon(String(s), 'ja'); } catch (e) { return String(s).toLowerCase(); } };
  const same = (a, b) => { const x = canon(a); return !!x && x === canon(b); };
  const rnd = n => Math.floor(Math.random() * n);
  const pickOf = a => a[rnd(a.length)];
  const sleep = ms => (typeof STORY !== 'undefined' && STORY.wait ? STORY.wait(ms / 1000) : new Promise(r => setTimeout(r, ms)));

  // ============================================================ the facts (まめちしき: "bean knowledge", trivia), chapter by chapter
  // Each: ja (what Susumu says, short), en (the fact, accurate and evergreen). Then a quiz: choice ({ q, opts, right }) or
  // typed ({ q, want: [notation…] }).
  const CHAPTERS = [
    { n: 1, title: '[漫画|まんが] と アニメ', titleEn: 'Manga and anime', level: 1,
      facts: [
        { ja: '[漫画|まんが] は [右|みぎ] から [左|ひだり] へ [読|よ]む ！', en: 'Manga is read right to left. A book starts at what looks like the back cover, and each page goes from the top-right panel to the bottom-left, because Japanese is traditionally written in columns from right to left.' },
        { ja: '[絵|え] の [四角|しかく] は 「 コマ 」 。', en: 'Each box of a comic, a panel, is a コマ (koma).' },
        { ja: 'せりふ の [風船|ふうせん] は 「 [吹|ふ]き[出|だ]し 」 。', en: 'A speech balloon is a 吹き出し (fukidashi): “something that blows out”.' },
        { ja: '[漫画|まんが] は [紙|かみ] の [絵|え] 、 アニメ は [動|うご]く [絵|え] 。', en: '漫画 are comics on paper; アニメ (short for アニメーション, animation) are moving pictures. Lots of anime are made from manga.' },
      ],
      quiz: [
        { q: 'On a manga page, which panel do you read first?', opts: ['the top right', 'the top left', 'the bottom right'], right: 0 },
        { q: 'Type the word for a comic’s panel (the box).', want: ['コマ'] },
        { q: 'What is a 吹き出し?', opts: ['a speech balloon', 'a sound effect', 'a chapter'], right: 0 },
        { q: 'Type the word for “manga”.', want: ['[漫画|まんが]', 'マンガ'] },
      ] },
    { n: 2, title: '[擬音|ぎおん]', titleEn: 'Sound words', level: 2,
      facts: [
        { ja: '[漫画|まんが] に は 、 [音|おと] の [字|じ] が いっぱい ！', en: 'Manga draw sounds right into the picture, as big letters: 擬音 (giongo), sound words. They’re part of the art.' },
        { ja: 'ドキドキ は [胸|むね] の [音|おと] 。', en: 'ドキドキ: a pounding heart (scared, nervous, or in love).' },
        { ja: 'ゴゴゴ は … [怖|こわ]い [空気|くうき] ！', en: 'ゴゴゴ: a deep rumble, drawn behind someone scary even when nothing makes a sound.' },
        { ja: 'シーン は 「 [静|しず]か 」 の [音|おと] 。', en: 'シーン: the “sound” of total silence. Yes, silence has its own sound word.' },
        { ja: 'キラキラ は [光|ひかり] 、 ワクワク は うれしい [気持|きも]ち 。', en: 'Some aren’t sounds at all: キラキラ is a sparkle, ワクワク is excited joy. These are 擬態語 (gitaigo), words that draw a look or a feeling.' },
      ],
      quiz: [
        { q: 'A character’s heart is pounding. Which word?', opts: ['ドキドキ', 'シーン', 'ゴゴゴ'], right: 0 },
        { q: 'Total silence in a manga panel is…', opts: ['シーン', 'キラキラ', 'ワクワク'], right: 0 },
        { q: 'Something scary is coming. The background says…', opts: ['ゴゴゴ', 'ドキドキ', 'キラキラ'], right: 0 },
        { q: 'Type the word for a sparkle.', want: ['キラキラ', 'きらきら'] },
      ] },
    { n: 3, title: '[漫画|まんが] の れきし', titleEn: 'The history of manga', level: 3,
      facts: [
        { ja: '[昔|むかし] 、 [北斎|ほくさい] が 「 [北斎漫画|ほくさいまんが] 」 を [描|か]いた 。', en: 'In 1814 the artist Hokusai started publishing books of quick sketches, the 北斎漫画 (Hokusai Manga): people, animals, faces, waves. They helped make the word “manga” famous.' },
        { ja: '[手塚治虫|てづかおさむ] は 「 [漫画|まんが] の [神様|かみさま] 」 。', en: 'Osamu Tezuka (手塚治虫) is called “the god of manga”. He drew hundreds of stories and gave manga its movie-like style: close-ups, motion, big expressive eyes. He also trained as a doctor!' },
        { ja: 'アトム は 1963 [年|ねん] に テレビ アニメ に なった ！', en: 'His Astro Boy (鉄腕アトム) started on TV on New Year’s Day 1963, one of the very first anime series with a new episode every week.' },
        { ja: '[週刊|しゅうかん] の [漫画|まんが] [雑誌|ざっし] は 、 [辞書|じしょ] みたい に [厚|あつ]い ！', en: 'Big manga magazines come out every week (週刊 = weekly), thick as a dictionary, on cheap colored paper. Two of the big boys’ weeklies both started in 1959. Hit series are collected later into books, 単行本 (tankōbon).' },
        { ja: 'カラー の テレビ アニメ は 1965 [年|ねん] から 。', en: 'Japan’s first TV anime series in color, Tezuka’s Kimba the White Lion (ジャングル大帝), started in 1965.' },
      ],
      quiz: [
        { q: 'Who is called “the god of manga”?', opts: ['手塚治虫 (Tezuka Osamu)', '北斎 (Hokusai)', 'ススム (Susumu)'], right: 0 },
        { q: 'When did Astro Boy start on TV?', opts: ['1963', '1983', '2003'], right: 0 },
        { q: 'What does 週刊 mean?', opts: ['weekly', 'monthly', 'every year'], right: 0 },
        { q: 'Type the word for “weekly”.', want: ['[週刊|しゅうかん]'] },
      ] },
    { n: 4, title: 'アニメ の せかい', titleEn: 'The world of anime', level: 4,
      facts: [
        { ja: 'アニメ の [声|こえ] の [人|ひと] は 「 [声優|せいゆう] 」 。', en: 'Anime voice actors are 声優 (seiyū). In Japan they’re stars with fans of their own, and many of them sing the theme songs too.' },
        { ja: '[最初|さいしょ] の [歌|うた] は オープニング 、 [最後|さいご] は エンディング 。', en: 'Every episode has an opening song (the OP) and an ending song (the ED). Fans sing them at karaoke.' },
        { ja: 'コミケ は 、 [漫画|まんが] の [大|おお]きな お[祭|まつ]り ！', en: 'Comiket (コミケ, the Comic Market) in Tokyo is a giant fair of fan-made comics, 同人誌 (dōjinshi). It started in 1975, and now it’s held twice a year, in summer and winter.' },
        { ja: '[少年|しょうねん] [漫画|まんが] 、 [少女|しょうじょ] [漫画|まんが] … でも 、 だれ が [読|よ]んで も いい ！', en: 'Manga magazines are sorted by who they’re made for: 少年 (shōnen, boys), 少女 (shōjo, girls), 青年 (seinen, young men)… but anyone can read anything.' },
        { ja: 'アニメ は 1 [秒|びょう] に 、 だいたい 12 [枚|まい] の [絵|え] ！', en: 'TV anime is often drawn “on twos”: each drawing stays on screen for two frames, so about 12 drawings make a second.' },
      ],
      quiz: [
        { q: 'What is a 声優?', opts: ['a voice actor', 'a singer of folk songs', 'a manga editor'], right: 0 },
        { q: 'How often is Comiket held?', opts: ['twice a year', 'once every ten years', 'every Sunday'], right: 0 },
        { q: '少女漫画 (shōjo manga) is made for…', opts: ['girls', 'grown-ups only', 'robots'], right: 0 },
        { q: 'Type the word for “voice actor”.', want: ['[声優|せいゆう]'] },
      ] },
    { n: 5, title: 'ステップ [王|おう] [決定戦|けっていせん]', titleEn: 'The King of Steps final', level: 5, facts: [], quiz: [] },
  ];
  const GATES = [s => !!(s.flags.rosa || s.flags.guide), s => !!s.flags.boss, s => (s.flags.bells || 0) >= 1, s => (s.flags.bells || 0) >= 2, s => (s.flags.bells || 0) >= 3];
  const GATE_TEXT = ['after Rosa’s welcome', 'after the big Hushling on the hill', 'after the first bell rings', 'after the second bell', 'after the third bell'];
  const chUnlocked = n => !!G && n >= 1 && n <= 5 && GATES[n - 1](G.state) && S().ch >= n - 1;

  // ============================================================ Susumu's lines (lines.js format; ja, and the English weave)
  const T = (ja, en) => ({ ja: [ja], en: [en] });
  const LT = {
    'su.hi': T('ぼく の [部屋|へや] へ ようこそ ！', 'Welcome to my room!'),
    'su.machine': T('これ が 「 ヤジルシ フィーバー 」 ！ ぼく は 、 ここ の チャンピオン 。', 'This is «Yajirushi Fever»! I’m the champion around here.'),
    'su.how': T('[矢印|やじるし] は ない よ 。 [画面|がめん] の [言葉|ことば] を [読|よ]んで 、 [足|あし] で ふむ ！', 'There are no arrows. Read the words on the screen, and stomp with your feet!'),
    'su.facts': T('[漫画|まんが] の まめちしき 、 [聞|き]きたい ？', 'Want to hear some manga trivia?'),
    'su.quiz': T('じゃ 、 クイズ ！', 'OK, quiz time!'),
    'su.right': T('せいかい ！', 'Correct!'),
    'su.wrong': T('ブブー ！ ちがう よ 。', 'Bzzt! Nope.'),
    'su.lesson': T('よし 、 おどろう ！ まず は [右|みぎ] と [左|ひだり] だけ 。', 'OK, let’s dance! Just right and left, to start.'),
    'su.mitete': T('[見|み]てて ！', 'Watch this!'),
    'su.yours': T('[次|つぎ] は きみ の [番|ばん] ！', 'Now it’s your turn!'),
    'su.battle': T('[勝負|しょうぶ] だ ！', 'It’s a match!'),
    'su.eyes': T('ハンデ ： [目|め] を つぶって やる よ 。', 'Handicap: I’ll do it with my eyes closed.'),
    'su.foot': T('ハンデ ： かた[足|あし] で やる よ 。', 'Handicap: I’ll do it on one foot.'),
    'su.full': T('もう ハンデ は なし ！ [本気|ほんき] で いく よ ！', 'No more handicaps! I’m going all out!'),
    'su.handi2': T('… しょうがない なあ 。 もっと ハンデ を あげる 。', '…Oh, fine. I’ll give you a bigger handicap.'),
    'su.win': T('ぼく の [勝|か]ち ！ でも 、 [上手|じょうず] に なった ね 。', 'I win! But you’re getting good.'),
    'su.lose': T('えーっ ！ [負|ま]けた ！ ？ … くやしい ！', 'Whaaat! I lost?! …So frustrating!'),
    'su.call': T('{mimo} に コール して ！ [言葉|ことば] で 、 ステップ を [教|おし]えて ！', 'Call the steps for {mimo}! Tell it the steps in words!'),
    'su.callok': T('{mimo} 、 [上手|じょうず] ！', '{mimo}, nice moves!'),
    'su.callbad': T('ちがう ちがう ！ よく [見|み]て 。', 'No, no! Look again.'),
    'su.locked': T('[次|つぎ] の まめちしき は … また こんど ！', 'The next trivia is… for next time!'),
    'su.done': T('[漫画|まんが] の こと 、 もう ぼく と [同|おな]じ くらい [知|し]って る ね ！', 'You know about as much about manga as I do now!'),
    'su.chat1': T('[漫画|まんが] は [右|みぎ] から [左|ひだり] ！ [忘|わす]れないで ね 。', 'Manga goes right to left! Don’t forget.'),
    'su.chat2': T('おねえちゃん の [歌|うた] 、 ほんと は [好|す]き 。 ないしょ だ よ 。', 'I actually like my sister’s singing. It’s a secret.'),
    'su.chat3': T('ダイテッコウ の [決|き]め[台詞|ぜりふ] は 「 すすめ ！ 」 。 ぼく の [名前|なまえ] みたい ！', 'Daitekkō’s catchphrase is «Susume!» It’s like my name!'),
    // the final
    'su.f.oto': T('ススム 、 [昨日|きのう] から ずっと [練習|れんしゅう] して る の 。 [負|ま]ける の が [怖|こわ]い ん だ よ 。', 'Susumu has been practicing since yesterday. He’s scared of losing.'),
    'su.f.scared': T('… ほんと は 、 [負|ま]ける の が [怖|こわ]い 。 ステップ [王|おう] じゃ なかったら 、 ぼく 、 なにも ない もん 。', '…Honestly? I’m scared of losing. If I’m not the King of Steps, I’m nothing.'),
    'su.f.oto2': T('ススム は ススム だ よ 。 [勝|か]って も 、 [負|ま]けて も ！', 'Susumu is Susumu. Win or lose!'),
    'su.f.ready': T('… うん 。 よし ！ [最後|さいご] の [勝負|しょうぶ] だ ！', '…Yeah. OK! The final battle!'),
    'su.f.lost': T('[負|ま]けた … 。 でも 、 なんか [楽|たの]しい ！ ライバル が できた ！', 'I lost… But somehow it’s fun! I’ve got a rival!'),
    'su.f.medal': T('これ 、 ステップ [王|おう] の メダル 。 {mimo} に あげる ！', 'This is the King of Steps medal. It’s for {mimo}!'),
    'su.f.won': T('やった ！ … でも 、 [強|つよ]かった よ 。 また [勝負|しょうぶ] しよう ！', 'Yes! …But you were tough. Let’s battle again!'),
    'su.f.again': T('もう [一回|いっかい] ！ ステップ [王|おう] は まだ ぼく だ よ ！', 'Again! I’m still the King of Steps!'),
  };
  function registerLines() { if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v; }
  // the phrases he teaches (the Phrasebook): you say each one at the right moment
  const PHRASES = [
    { id: 'ph.su.mitete', ja: '[見|み]てて ！', en: 'Watch this!', alt: ['みてて ！', '[見|み]てて ね ！'], note: 'Before showing off. From 見る (to watch): “keep watching!”' },
    { id: 'ph.su.shoubu', ja: '[勝負|しょうぶ] ！', en: 'Let’s settle this! (a match!)', alt: ['[勝負|しょうぶ] だ ！', 'しょうぶ ！', 'いざ [勝負|しょうぶ] ！'], note: '勝負 is a match, a contest. Shouted before any game or battle.' },
    { id: 'ph.su.makenai', ja: '[負|ま]けない よ ！', en: 'I won’t lose!', alt: ['[負|ま]けない ！', 'まけない よ ！'], note: '負ける (to lose) → 負けない (won’t lose). Fighting spirit!' },
    { id: 'ph.su.yatta', ja: 'やった ！', en: 'Yes! I did it!', alt: ['やったー ！', 'やった ね ！'], note: 'The moment you win, or anything goes your way.' },
    { id: 'ph.su.kuyashii', ja: 'くやしい ！', en: 'Argh, so frustrating!', alt: ['[悔|くや]しい ！', 'くやしー ！'], note: 'When you lose, or just miss: frustrated and wanting another go.' },
    { id: 'ph.su.otsukare', ja: 'おつかれ ！', en: 'Good game! (good work)', alt: ['おつかれさま ！', 'お[疲|つか]れ ！', 'おつかれ さま ！'], note: 'Said after any effort, a game, a shift: “you must be tired, well done”.' },
    { id: 'ph.su.tensai', ja: '[天才|てんさい] ！', en: 'Genius!', alt: ['てんさい ！', '[天才|てんさい] だ ！'], note: 'Big praise for a great move (or a joke when someone does something silly).' },
  ];
  const ITEMS = [{ id: 'k.stepMedal', kind: 'key', ja: 'ステップ [王|おう] の メダル', en: 'The King of Steps medal', icon: 'medal' }];
  function registerItems() {
    if (typeof LEX === 'undefined' || !LEX.register) return;
    LEX.register(PHRASES.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', ja: p.ja, en: p.en, note: p.note, region: 'Susumu', register: 'casual', icon: 'speech', alt: { ja: p.alt || [] } })));
    LEX.register(ITEMS.filter(it => !LEX.item(it.id)).map(it => Object.assign({}, it)));
  }
  // ============================================================ the machine's songs (its own: five styles, five tempos, five hooks)
  // Each: two bars of intro (its hook), sixteen bars of steps, two to finish. Chords one per bar, four-bar loops.
  const NOTE0 = 32, BARS = 20;
  const TRACKS = [
    { id: 'yochi', level: 1, bpm: 96, swing: 0.16, title: 'よちよち ステップ', titleEn: 'Toddling Steps', prog: ['Dm7', 'Dm7', 'G7', 'G7'], lead: 'square',
      hook: 'D5/3 F5/1 G5/2 A5/2 C6/4 A5/4 | G5/2 F5/2 D5/4 C5/4 D5/4', style: 'boom-bap funk (96 bpm): a lazy kick, a fat snare, a clavinet riff, slap bass, scratchy zaps' },
    { id: 'neon', level: 2, bpm: 118, swing: 0, title: 'ネオン パレード', titleEn: 'Neon Parade', prog: ['Fmaj7', 'Em7', 'Dm7', 'Cmaj7'], lead: 'saw',
      hook: 'C6/2 A5/2 F5/2 A5/2 C6/4 D6/4 | C6/2 A5/2 G5/4 F5/8', style: 'French-house disco (118 bpm): four on the floor, a filter sweeping a chopped chord loop, octave bass' },
    { id: 'conga', level: 3, bpm: 128, swing: 0.04, title: 'コンガ カーニバル', titleEn: 'Conga Carnival', prog: ['G', 'Em7', 'Am7', 'D7'], lead: 'trumpet',
      hook: 'G5/2 B5/2 D6/3 B5/1 A5/2 G5/2 E5/4 | D5/2 E5/2 G5/2 A5/2 B5/8', style: 'Latin house (128 bpm): congas, timbales and a cowbell over a four-on-the-floor, a piano montuno, a brassy hook' },
    { id: 'pico', level: 4, bpm: 150, swing: 0, title: 'ピコピコ ハイパー', titleEn: 'Pico-Pico Hyper', prog: ['C', 'G', 'Am', 'F'], lead: 'square',
      hook: 'E6/1 G6/1 E6/1 C6/1 D6/2 G5/2 C6/2 E6/2 G6/4 | A6/2 G6/2 E6/2 C6/2 D6/8', style: 'chiptune hyperpop (150 bpm): a bouncy 808, pulse-wave arpeggios, a bleepy hook, laser zaps' },
    { id: 'king', level: 5, bpm: 172, swing: 0, title: 'ステップ [王|おう] の テーマ', titleEn: 'Theme of the King of Steps', prog: ['A', 'E', 'F#m', 'D'], lead: 'saw',
      hook: 'E5/2 E5/1 E5/1 F#5/2 E5/2 C#5/2 E5/2 A5/4 | G#5/2 F#5/2 E5/2 C#5/2 E5/8', style: 'happy hardcore (172 bpm): a hard four-on-the-floor, an offbeat bass, piano stabs, a supersaw hook, snare rolls' },
  ];
  const TRACK = id => TRACKS.find(t => t.id === id) || null;
  const BAND = {
    yochi(K, p, t, s16, c, bar) {
      const s = p & 15;
      if ('x.....x..x......'[s] === 'x' || ((bar & 1) && s === 14)) K.kick(t, s ? 0.85 : 1);
      if (s === 4 || s === 12) { K.snare(t, 0.9); K.clap(t, 0.25); }
      if (!(s & 1)) K.hat(t, s & 2 ? 0.35 : 0.5); else if (s === 7 || s === 15) K.hat(t, 0.2);
      for (const [st, iv] of [[0, 0], [3, 12], [6, 7], [10, 10], [11, 12], [14, 7]]) if (st === s) K.slap(c.root + iv, t, 0.8);
      if ([2, 5, 9, 13].includes(s)) c.tones.slice(0, 3).forEach(m => K.clav(m + 12, t, 0.7));
      if (s === 0 && !(bar & 1)) c.tones.forEach(m => K.vibes(m + 12, t, 0.35, 1.2));
      if ((bar & 3) === 3 && s >= 12 && s <= 14) K.zap(t, 0.5, 1800 - s * 60, 300);
    },
    neon(K, p, t, s16, c, bar) {
      const s = p & 15, sweep = 500 + 2700 * ((((bar & 3) * 16) + s) / 64);
      if (!(s & 3)) K.kick(t, 1);
      if (s === 4 || s === 12) K.clap(t, 0.85);
      if ((s & 3) === 2) K.hat(t, 0.55, true); else K.hat(t, 0.16);
      if (!(s & 1)) K.synbass(c.root + (s & 2 ? 12 : 0), t, s16 * 1.3, 0.85);
      if ((s & 3) === 3 || s === 0 || s === 6 || s === 10) c.tones.forEach(m => K.pad(m + 12, t, s16 * 1.4, 'sawtooth', sweep, 0.012));
      if ((bar & 3) === 3 && s === 8) K.swell(t, s16 * 8, 0.8);
    },
    conga(K, p, t, s16, c, bar) {
      const s = p & 15;
      if (!(s & 3)) K.kick(t, 0.95);
      if (s === 4 || s === 12) K.clap(t, 0.55);
      K.shaker(t, s & 1 ? 0.4 : 0.7);
      const cg = { 0: 'lo', 3: 'slap', 6: 'hi', 8: 'lo', 10: 'mute', 11: 'slap', 14: 'hi' }[s]; if (cg) K.conga(t, cg, 0.9);
      if (s === 2 || s === 10) K.cowbell(t, 0.5); if (s === 7 || s === 15) K.timbale(t, true, 0.6);
      for (const [st, iv, l] of [[0, 0, 3], [6, 7, 2], [10, 12, 2], [14, 7, 2]]) if (st === s) K.upright(c.root + iv, t, 0.9, s16 * l);
      if ((s & 3) === 2) c.tones.forEach(m => K.keys(m + 12, t, s16 * 1.2, 0.6));
    },
    pico(K, p, t, s16, c, bar) {
      const s = p & 15;
      if (s === 0 || s === 6 || s === 10) K.kick808(t, 0.9, 0.18);
      if (s === 4 || s === 12) K.snare(t, 0.7);
      K.hat(t, s & 1 ? 0.25 : 0.4);
      K.arp(c.tones[(s + bar) % c.tones.length] + 24 + (s & 4 ? 12 : 0), t, 0.7, s16 * 0.8);
      if (!(s & 3)) K.sub808(c.root, t, s16 * 3, 0.7);
      if ((bar & 1) && s >= 12) K.zap(t, 0.5, 3000, 600);
    },
    king(K, p, t, s16, c, bar) {
      const s = p & 15;
      if (!(s & 3)) K.kick(t, 1);
      if ((s & 3) === 2) K.synbass(c.root + 12, t, s16 * 1.5, 0.9);
      if (s === 4 || s === 12) K.clap(t, 0.7);
      K.hat(t, (s & 3) === 2 ? 0.5 : 0.2, (s & 3) === 2);
      if ((s & 3) === 2 || s === 0) c.tones.forEach(m => K.keys(m + 12, t, s16 * 1.4, 0.7));
      if ((bar & 7) === 7 && s >= 8) K.snare(t, 0.3 + (s - 8) * 0.08);
      if (s === 0 && !(bar & 3)) K.crash(t, 0.8);
    },
  };
  // what's being danced now (the tracks read it: the machine's robot voice calls some steps a beat ahead)
  let CUR = null;
  const HOOKS = {};
  function trackDef(tk) {
    const K = typeof Sound !== 'undefined' && Sound.kit;
    HOOKS[tk.id] = K ? K.mel(tk.hook) : [];
    return { name: 'dn_' + tk.id, bpm: tk.bpm, swing: tk.swing, len: BARS * 16, loopTo: NOTE0,
      play(K2, p, t, s16) {
        const bar = p >> 4, MU = A() && A().MUSIC, c = MU.chordOf(tk.prog[bar & 3]);
        BAND[tk.id](K2, p, t, s16, c, bar);
        const hb = bar < 2 || (bar >= 2 && (((bar - 2) & 7) >= 4) && bar < 18), n = hb ? HOOKS[tk.id][p & 31] : null;
        if (n) K2.lead(n[0], t, n[1] * s16, tk.lead, 0.6);
        if (CUR && CUR.track === tk && CUR.calls[p]) CUR.calls[p].forEach((v, k) => K2.vox(v.m, t + k * s16 * 0.55, s16 * 0.5, 0.55, v.v, v.v));
      } };
  }
  function registerTracks() { const MU = A() && A().MUSIC; if (!MU) return; for (const tk of TRACKS) MU.registerTrack(trackDef(tk)); }

  // ============================================================ the steps: words, never arrows (the chart for each level)
  // A note: { t (sixteenth), d ('L' 'R' 'U' 'D' 'J'), n (a counter: 2 or 3 quick steps), rev (はんたい: do the opposite),
  // tail (a counter's 2nd / 3rd step) }. Level 1: right and left, two columns. 2: all four, one lane (read the word!). 3:
  // counters. 4: はんたい and ジャンプ. 5: all of it, faster.
  const WORD = { L: '[左|ひだり]', R: '[右|みぎ]', U: '[上|うえ]', D: '[下|した]', J: 'ジャンプ' };
  const KANA = { L: 'ひだり', R: 'みぎ', U: 'うえ', D: 'した', J: 'ジャンプ' };
  const OPP = { L: 'R', R: 'L', U: 'D', D: 'U', J: 'J' };
  const COL = { L: '#3f9cff', U: '#ffcf3f', D: '#7ae04a', R: '#ff5a7a', J: '#c78aff' };
  const ARROW = { L: '←', U: '↑', D: '↓', R: '→', J: '←→' };
  const NUMK = { 2: 'に', 3: 'さん' };
  function labelOf(n) {
    let s = WORD[n.d];
    if (n.n > 1) s += ` ${n.n} [回|かい]`;
    if (n.rev) s = '[反対|はんたい] ' + s;
    return s;
  }
  // the robot voice: each mora's vowel, on a little falling tune
  const VOWELS = { L: 'iai', R: 'ii', U: 'ue', D: 'ia', J: 'auu', REV: 'auai' };
  function chartFor(level) {
    const R = rng(4100 + level * 97), notes = [], dirs = level === 1 ? ['L', 'R'] : ['L', 'R', 'U', 'D'];
    let prev = null;
    const pick = () => { let d = dirs[Math.floor(R() * dirs.length)]; if (d === prev && R() < 0.7) d = dirs[(dirs.indexOf(d) + 1 + Math.floor(R() * (dirs.length - 1))) % dirs.length]; prev = d; return d; };
    for (let bar = 0; bar < 16; bar++) {
      const b0 = NOTE0 + bar * 16, ph = bar >> 2;
      let slots;
      if (level === 1) slots = ph === 0 ? [0, 8] : ph < 3 ? [0, 4, 8, 12] : [0, 4, 8, 10, 12];
      else if (level === 2) slots = ph === 0 ? [0, 4, 8, 12] : [0, 4, 8, 12, 14];
      else if (level === 3) slots = ph === 0 ? [0, 4, 8, 12] : [0, 4, 8, 12];
      else if (level === 4) slots = ph === 0 ? [0, 4, 8, 12] : [0, 2, 4, 8, 10, 12];
      else slots = ph === 0 ? [0, 4, 8, 10, 12] : ph === 3 ? [0, 2, 4, 6, 8, 10, 12, 14] : [0, 2, 4, 8, 10, 12, 14];
      let skipTo = -1;
      for (const s of slots) {
        const t = b0 + s; if (t <= skipTo) continue;
        if (level === 1 && ph < 2) { prev = prev === 'R' ? 'L' : 'R'; notes.push({ t, d: prev }); continue; }
        const note = { t, d: pick() };
        if ((level === 3 || level === 5) && ph >= 1 && s === 8 && R() < 0.75) { note.n = R() < 0.7 || level === 3 ? 2 : 3; skipTo = t + (note.n - 1) * 2; }
        if ((level === 4 || level === 5) && ph >= 1 && !note.n && R() < (level === 4 ? 0.3 : 0.22) && s !== 0) note.rev = true;
        if ((level === 4 || level === 5) && ph >= 2 && s === 0 && R() < 0.6) { note.d = 'J'; note.rev = false; }
        notes.push(note);
        if (note.n) for (let k = 1; k < note.n; k++) notes.push({ t: t + k * 2, d: note.d, tail: true });
      }
    }
    for (const n of notes) { n.need = n.d === 'J' ? 'J' : n.rev ? OPP[n.d] : n.d; n.label = n.tail ? '' : labelOf(n); n.res = null; n.got = {}; }
    return notes;
  }
  // where the robot voice calls: a beat ahead of every step at level 1–2, and of every はんたい / ジャンプ / counter after that
  function callsFor(notes, level) {
    const calls = {}, tune = [76, 72, 69, 67];
    for (const n of notes) {
      if (n.tail) continue;
      if (!(level <= 2 || n.rev || n.d === 'J' || n.n)) continue;
      const at = n.t - 4; if (at < 0 || calls[at]) continue;
      const v = (n.rev ? VOWELS.REV : '') + VOWELS[n.d];
      calls[at] = [...v].slice(0, 6).map((x, k) => ({ v: x, m: tune[k % tune.length] - 12 }));
    }
    return calls;
  }
  // ============================================================ the machine's screen (#dn-panel): the dance, and Susumu's facts, quizzes and calls
  let PANEL = null, KEYH = null, RUN = null;
  function css() {
    if (document.getElementById('dn-css')) return;
    const s = document.createElement('style'); s.id = 'dn-css';
    s.textContent = `
      #dn-panel { position: fixed; inset: 0; z-index: 61; display: flex; align-items: center; justify-content: center; background: rgba(10,6,24,.55); font-family: "Segoe UI", sans-serif; }
      #dn-panel.dn-hidden { display: none; }
      #dn-panel .dn-card { width: min(900px, 95vw); max-height: 96vh; overflow: auto; background: linear-gradient(170deg, #1a1030, #2a1550 55%, #3a1a55); border: 4px solid #0d0818; border-radius: 22px; box-shadow: 0 0 0 3px ${PINK}, 0 10px 30px rgba(0,0,0,.5); padding: 12px 16px 10px; color: #f4ecff; box-sizing: border-box; }
      #dn-panel .dn-head { display: flex; align-items: center; gap: 12px; }
      #dn-panel .dn-logo { font: 900 20px ${FONT}; letter-spacing: .02em; color: #fff0fa; text-shadow: 0 0 8px ${PINK}, 0 0 2px #fff; white-space: nowrap; }
      #dn-panel .dn-logo b { color: #e8fffb; text-shadow: 0 0 8px ${TEAL}, 0 0 2px #fff; } #dn-panel .dn-logo i { color: #ffe15a; font-style: normal; text-shadow: 0 0 8px #ffe15a; }
      #dn-panel .dn-song { flex: 1; font: 800 16px ${FONT}; line-height: 1.3; } #dn-panel .dn-song small { display: block; font: 600 12px "Segoe UI"; opacity: .7; }
      #dn-panel .dn-song ruby rt, #dn-panel .dn-big ruby rt, #dn-panel .dn-note ruby rt, #dn-panel .dn-say ruby rt, #dn-panel .dn-q ruby rt, #dn-panel .dn-opt ruby rt { font: 700 .42em/1.1 "Segoe UI", sans-serif; color: #ffd1e8; }
      #dn-panel .dn-x { width: 34px; height: 34px; border-radius: 50%; border: 3px solid #f4ecff; background: transparent; color: #f4ecff; font: 800 15px "Segoe UI"; cursor: pointer; }
      #dn-panel .dn-enb { height: 34px; padding: 0 10px; border-radius: 12px; border: 3px solid #f4ecff; background: transparent; color: #f4ecff; font: 800 13px "Segoe UI"; cursor: pointer; }
      #dn-panel.en-on .dn-enb { background: ${PINK}; }
      #dn-panel:not(.en-on) .dn-say .en, #dn-panel:not(.en-on) .dn-tr { display: none; }
      #dn-panel .w { color: #ffe15a; border-bottom-color: #ffe15a; } #dn-panel .gl { color: #f4ecff; } #dn-panel .dn-big.mx { font-size: 21px; line-height: 1.7; max-width: 680px; }
      #dn-panel .dn-main { display: flex; gap: 14px; margin-top: 10px; align-items: stretch; }
      #dn-panel .dn-stage { position: relative; width: 380px; height: 380px; flex: 0 0 auto; border-radius: 16px; overflow: hidden; background: #0d0818; box-shadow: inset 0 0 0 2px #3a2a5a;
        background-image: linear-gradient(rgba(33,196,180,.12) 1px, transparent 1px); background-size: 100% 32px; }
      #dn-panel .dn-rec { position: absolute; top: 22px; height: 48px; border: 3px dashed rgba(255,255,255,.55); border-radius: 12px; box-sizing: border-box; }
      #dn-panel .dn-rec.hit { border-style: solid; border-color: #ffe15a; box-shadow: 0 0 14px #ffe15a; }
      #dn-panel .dn-colname { position: absolute; top: 4px; font: 800 11px "Segoe UI"; opacity: .7; text-align: center; }
      #dn-panel .dn-note { position: absolute; left: 0; top: 0; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 6px; font: 900 26px ${FONT}; color: #120a24; box-shadow: 0 3px 0 rgba(0,0,0,.35); will-change: transform; box-sizing: border-box; border: 3px solid rgba(255,255,255,.7); }
      #dn-panel .dn-note.rev { border: 4px solid #ff2a2a; box-shadow: 0 0 10px #ff2a2a; }
      #dn-panel .dn-note.tail { height: 20px; width: 20px !important; border-radius: 50%; font-size: 0; }
      #dn-panel .dn-note.done { opacity: 0; transition: opacity .15s; }
      #dn-panel .dn-judge { position: absolute; left: 0; right: 0; top: 150px; text-align: center; font: 900 34px ${FONT}; text-shadow: 0 0 10px currentColor; pointer-events: none; }
      #dn-panel .dn-combo { position: absolute; left: 0; right: 0; top: 196px; text-align: center; font: 800 18px Bahnschrift, "Segoe UI"; opacity: .9; }
      #dn-panel .dn-side { flex: 1; display: flex; flex-direction: column; gap: 10px; min-width: 0; }
      #dn-panel .dn-flash { height: 40px; display: flex; align-items: center; justify-content: space-between; padding: 0 6px; }
      #dn-panel .dn-flash .j { font: 900 30px ${FONT}; text-shadow: 0 0 10px currentColor; display: inline-block; }
      #dn-panel .dn-flash .c { font: 800 18px Bahnschrift, "Segoe UI"; color: #ffe15a; }
      #dn-panel .dn-who { background: rgba(255,255,255,.06); border-radius: 12px; padding: 8px 12px; }
      #dn-panel .dn-who b { font: 800 15px ${FONT}; } #dn-panel .dn-who .pc { float: right; font: 900 22px Bahnschrift, "Segoe UI"; }
      #dn-panel .dn-bar { height: 10px; border-radius: 6px; background: rgba(255,255,255,.12); margin-top: 6px; overflow: hidden; } #dn-panel .dn-bar i { display: block; height: 100%; width: 0; }
      #dn-panel .dn-say { font: 700 16px ${FONT}; line-height: 1.9; min-height: 30px; } #dn-panel .dn-say .nm { display: inline-block; padding: 0 8px; border-radius: 9px; background: ${TEAL}; color: #0d0818; font: 800 12px "Segoe UI"; margin-right: 6px; vertical-align: middle; } #dn-panel .dn-say .en { font: italic 600 13px "Segoe UI"; opacity: .7; margin-left: 8px; }
      #dn-panel .dn-legend { font-size: 12px; opacity: .78; line-height: 1.6; }
      #dn-panel .dn-legend .k { display: inline-block; min-width: 18px; padding: 0 4px; border-radius: 5px; background: rgba(255,255,255,.14); text-align: center; font-weight: 800; }
      #dn-panel .dn-pads { display: flex; gap: 8px; justify-content: center; margin-top: 10px; }
      #dn-panel .dn-pad { width: 64px; height: 52px; border-radius: 12px; border: 3px solid #0d0818; font: 900 26px "Segoe UI"; cursor: pointer; color: #0d0818; box-shadow: 0 4px 0 rgba(0,0,0,.4); }
      #dn-panel .dn-pad.on { transform: translateY(3px); box-shadow: 0 1px 0 rgba(0,0,0,.4); filter: brightness(1.25); }
      #dn-panel .dn-body { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 10px 4px; min-height: 120px; text-align: center; }
      #dn-panel .dn-big { font: 800 30px ${FONT}; line-height: 2; }
      #dn-panel .dn-en { font: 600 15px/1.45 "Segoe UI", sans-serif; opacity: .88; max-width: 640px; }
      #dn-panel .dn-q { font: 700 17px "Segoe UI", sans-serif; }
      #dn-panel .dn-opts { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
      #dn-panel .dn-opt { min-width: 150px; padding: 9px 16px 9px 26px; border-radius: 14px; border: 3px solid #f4ecff; background: rgba(255,255,255,.08); color: #f4ecff; font: 700 17px ${FONT}; cursor: pointer; position: relative; }
      #dn-panel .dn-opt kbd { position: absolute; left: 7px; top: 4px; font: 800 11px "Segoe UI"; opacity: .6; }
      #dn-panel .dn-opt.right { background: #2f8a4a; border-color: #8ff0a8; } #dn-panel .dn-opt.wrong { background: #8a2f3a; border-color: #ff9aa8; }
      #dn-panel .dn-in { font: 700 24px ${FONT}; padding: 6px 12px; border: 3px solid #f4ecff; border-radius: 12px; width: min(420px, 82%); text-align: center; background: #fff; color: ${INK}; }
      #dn-panel .dn-btn { padding: 7px 18px; border: 3px solid #f4ecff; border-radius: 12px; background: ${PINK}; color: #fff; font: 800 15px "Segoe UI", sans-serif; cursor: pointer; }
      #dn-panel .dn-btn.light { background: transparent; }
      #dn-panel .dn-msg { font: 700 15px ${FONT}; min-height: 20px; color: #9ff5e6; } #dn-panel .dn-msg.bad { color: #ff9aa8; }
      #dn-panel .dn-arrows { display: flex; gap: 10px; justify-content: center; }
      #dn-panel .dn-arrows span { width: 62px; height: 62px; border-radius: 14px; display: grid; place-items: center; font: 900 36px "Segoe UI"; color: #0d0818; border: 3px solid #fff; }
      #dn-panel .dn-grade { font: 900 70px Bahnschrift, "Segoe UI"; color: #ffe15a; text-shadow: 0 0 16px #ff5fa2; line-height: 1; }
      #dn-panel .dn-stats { font: 700 15px ${FONT}; line-height: 1.7; }
      #dn-panel .dn-foot { display: flex; justify-content: space-between; font-size: 12px; opacity: .65; padding-top: 6px; }
      #dn-panel.talk .dn-main, #dn-panel.talk .dn-pads { display: none; } #dn-panel:not(.talk) .dn-body { display: none; }
      @keyframes dnpop { 0% { transform: scale(.6); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); } }
      body.in-battle #dn-panel { display: none !important; }`;
    document.head.appendChild(s);
  }
  const LOGO = '<span class="dn-logo">ヤジルシ<i>★</i><b>フィーバー</b></span>';
  function panelEl() {
    if (PANEL) return PANEL;
    css();
    const el = document.createElement('div'); el.id = 'dn-panel'; el.className = 'dn-hidden';
    el.innerHTML = `<div class="dn-card"><div class="dn-head">${LOGO}<div class="dn-song"></div><button class="dn-enb" title="The English">EN</button><button class="dn-x" title="Stop (Esc)">✕</button></div>`
      + '<div class="dn-main"><div class="dn-stage"><div class="dn-recs"></div><div class="dn-notes"></div><div class="dn-judge"></div><div class="dn-combo"></div></div><div class="dn-side"></div></div>'
      + '<div class="dn-pads"></div><div class="dn-body"></div><div class="dn-foot"><span class="l"></span><span class="r"></span></div></div>';
    document.body.appendChild(el);
    const q = s => el.querySelector(s);
    PANEL = { el, song: q('.dn-song'), x: q('.dn-x'), stage: q('.dn-stage'), recs: q('.dn-recs'), notes: q('.dn-notes'), judge: q('.dn-judge'), combo: q('.dn-combo'), side: q('.dn-side'), pads: q('.dn-pads'), body: q('.dn-body'), footL: q('.dn-foot .l'), footR: q('.dn-foot .r') };
    PANEL.x.onclick = () => quit();
    // EN: Susumu's lines, the facts and the titles in English, on request (DESIGN.md 17.3: never under them by default)
    q('.dn-enb').onclick = e => { el.classList.toggle('en-on'); e.currentTarget.blur(); const inp = PANEL.body.querySelector('input'); if (inp) inp.focus(); };
    addEventListener('keydown', e => {
      if (!PANEL || PANEL.el.classList.contains('dn-hidden')) return;
      const inInput = e.target && e.target.tagName === 'INPUT';
      if (e.code === 'Escape' && !inInput) { e.preventDefault(); e.stopPropagation(); quit(); return; }
      if (KEYH && KEYH(e, inInput)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    addEventListener('keyup', e => { if (RUN && RUN.keyUp) RUN.keyUp(e); }, true);
    return PANEL;
  }
  // sub: a line of text, or [the title's English (shown with EN), the rest]
  function openPanel(title, sub, talk) {
    const P = panelEl();
    P.el.classList.toggle('talk', !!talk); P.el.classList.remove('en-on');
    const subHTML = Array.isArray(sub) ? `<span class="dn-tr">${esc(sub[0] || '')}${sub[1] ? ' · ' : ''}</span>${esc(sub[1] || '')}` : esc(sub || '');
    P.song.innerHTML = `${title ? J(title) : ''}${subHTML ? `<small>${subHTML}</small>` : ''}`;
    P.body.innerHTML = ''; P.side.innerHTML = ''; P.notes.innerHTML = ''; P.recs.innerHTML = ''; P.judge.textContent = ''; P.combo.textContent = ''; P.pads.innerHTML = '';
    P.footL.textContent = 'Esc: stop'; P.footR.textContent = '';
    P.el.classList.remove('dn-hidden');
    Input.typing = true; if (G) G.sim.lock = 1;
    return P;
  }
  function closePanel() {
    if (!PANEL) return;
    PANEL.el.classList.add('dn-hidden'); PANEL.body.innerHTML = ''; PANEL.notes.innerHTML = ''; KEYH = null;
    if (typeof CJK !== 'undefined' && CJK.ime && CJK.ime.box) CJK.ime.box.style.display = 'none';
    Input.typing = false; if (G) G.sim.lock = 0;
  }
  const panelOpen = () => !!PANEL && !PANEL.el.classList.contains('dn-hidden');
  function quit() { if (RUN) { RUN.quit = true; if (RUN.wake) RUN.wake({ quit: true }); } else closePanel(); }
  // a line in the language by the weave, like every line (DESIGN.md 17.3): mixed (the English with the words you know in Japanese),
  // whole in Japanese as the weave rises; its English only with EN. → { html, full }
  function mixJ(src, en, key) {
    try { if (typeof STORY !== 'undefined' && STORY.mixHTML && src && en) { const m = STORY.mixHTML(src, en, { key }); return { html: m.html, full: m.full }; } } catch (e) { /* (the line as written) */ }
    return { html: J(src), full: true };
  }
  function suSay(src, en) {
    const el = PANEL && (PANEL.el.classList.contains('talk') ? null : PANEL.side.querySelector('.dn-say'));
    const html = `<span class="nm">${esc(JP('ススム'))}</span>${src ? mixJ(src, en, 'dance:' + en).html : ''}${en ? `<span class="en">${esc(en)}</span>` : ''}`;
    if (el) el.innerHTML = html; else if (PANEL) { const s = PANEL.body.querySelector('.dn-say'); if (s) s.innerHTML = html; }
    if (src && cmode() === 'chars') try { CJK.seen(src, { lang: 'ja' }); } catch (e) { /* (fine) */ }
  }
  const waitWake = () => new Promise(r => { RUN.wake = v => { RUN.wake = null; r(v); }; });

  // ------------------------------------------------------------ the dance: a song's steps, judged; Susumu dancing beside you
  // Timing windows (seconds): パーフェクト ±0.06, グレート ±0.11, グッド ±0.16; else ミス. Points 100 / 70 / 40 / 0.
  const WIN = { p: 0.06, g: 0.11, o: 0.16 };
  const JUDGE = { P: ['パーフェクト ！', '#ffe15a', 100], G: ['グレート ！', '#9ff5e6', 70], O: ['グッド', '#9fb4ff', 40], M: ['ミス …', '#ff7a8a', 0] };
  // Susumu's skill per level (and his handicaps): the chance of each judgment for each of his steps
  const FOE = { demo: [0.97, 0.03, 0, 0], eyes: [0.5, 0.3, 0.12, 0.08], foot: [0.62, 0.25, 0.08, 0.05], full: [0.84, 0.13, 0.02, 0.01], king: [0.9, 0.08, 0.015, 0.005], easy: [0.35, 0.3, 0.2, 0.15] };
  const KEYDIR = { ArrowLeft: 'L', ArrowRight: 'R', ArrowUp: 'U', ArrowDown: 'D', KeyA: 'L', KeyD: 'R', KeyW: 'U', KeyS: 'D' };
  // play one song: o.level, o.track (id), o.foe (a FOE key, or null: alone), o.auto (tests: a hit rate 0..1), o.title
  function dance(o) {
    return new Promise(resolve => {
      const tk = TRACK(o.track) || TRACKS[Math.max(0, (o.level || 1) - 1)], level = o.level || tk.level, MU = A().MUSIC;
      const notes = chartFor(level), cols = level === 1 ? ['L', 'R'] : null, s16 = 60 / tk.bpm / 4;
      const W = { p: WIN.p / s16, g: WIN.g / s16, o: WIN.o / s16 }, PX = 300 * s16, H = 380, REC = 22;
      const P = openPanel(tk.title, [tk.titleEn, `level ${level} · ${tk.style}`]);
      P.footL.textContent = 'Esc: stop'; P.footR.textContent = 'Keys: ← ↑ ↓ → (or A W S D) · the cards say which: read them!';
      const colX = d => (cols ? (d === 'L' ? 40 : 210) : 70), cardW = cols ? 130 : 240;
      P.recs.innerHTML = (cols ? cols : ['C']).map(d => `<div class="dn-rec" data-d="${d}" style="left:${cols ? colX(d) : 70}px;width:${cardW}px"></div>`).join('')
        + (cols ? cols.map(d => `<div class="dn-colname" style="left:${colX(d)}px;width:${cardW}px">${J(WORD[d])}</div>`).join('') : '');
      // the cards (words, coloured by direction; はんたい has a red frame and wants the opposite; counters trail dots)
      P.notes.innerHTML = notes.map((n, i) => `<div class="dn-note${n.rev ? ' rev' : ''}${n.tail ? ' tail' : ''}" data-i="${i}" style="width:${cardW}px;background:${COL[n.d]};display:none">${n.tail ? '' : J(n.label, { cls: 'dn-w' })}</div>`).join('');
      const els = [...P.notes.children];
      P.side.innerHTML = `<div class="dn-flash"><span class="j"></span><span class="c"></span></div><div class="dn-who"><b>You</b><span class="pc you">0%</span><div class="dn-bar"><i class="you" style="background:${TEAL}"></i></div><small class="cy"></small></div>`
        + (o.foe ? `<div class="dn-who"><b>${esc(JP('ススム'))}</b>${o.foe !== 'demo' && o.foe !== 'full' && o.foe !== 'king' ? ` <small>(handicap: ${esc({ eyes: 'eyes closed', foot: 'one foot', easy: 'eyes closed, one foot, dizzy' }[o.foe] || '')})</small>` : ''}<span class="pc foe">0%</span><div class="dn-bar"><i class="foe" style="background:${PINK}"></i></div><small class="cf"></small></div>` : '')
        + `<div class="dn-say"></div><div class="dn-legend">${['L', 'U', 'D', 'R'].filter(d => level > 1 || d === 'L' || d === 'R').map(d => `<span class="k" style="background:${COL[d]};color:#0d0818">${ARROW[d]}</span> ${J(WORD[d])}`).join(' · ')}`
        + `${level >= 3 ? `<br>${J('[右|みぎ] 2 [回|かい]')} = two quick steps` : ''}${level >= 4 ? `<br>${J('[反対|はんたい]')} (red frame) = the opposite way · ${J('ジャンプ')} = ← and → together` : ''}</div>`;
      P.pads.innerHTML = ['L', 'U', 'D', 'R'].map(d => `<button class="dn-pad" data-d="${d}" style="background:${COL[d]}">${ARROW[d]}</button>`).join('');
      const run = RUN = { kind: 'dance', level, tk, notes, score: 0, combo: 0, maxCombo: 0, counts: { P: 0, G: 0, O: 0, M: 0 }, foe: o.foe ? { kind: o.foe, score: 0, combo: 0, max: 0 } : null,
        auto: o.auto, quit: false, i0: 0, done: false, lastPos: -1, held: {} };
      CUR = { track: tk, calls: callsFor(notes, level) };
      if (o.say) suSay(o.say[0], o.say[1]);
      const JE = P.side.querySelector('.dn-flash .j'), CE = P.side.querySelector('.dn-flash .c');
      const flash = (k, n) => {
        const [txt, col] = JUDGE[k]; JE.textContent = txt; JE.style.color = col; JE.style.animation = 'none'; void JE.offsetWidth; JE.style.animation = 'dnpop .25s ease-out';
        CE.textContent = run.combo >= 4 ? `${run.combo} コンボ` : '';
        if (n && k !== 'M') { const r = P.recs.querySelector(cols ? `[data-d="${n.d === 'J' ? 'L' : n.need}"]` : '.dn-rec'); if (r) { r.classList.add('hit'); setTimeout(() => r.classList.remove('hit'), 120); } }
      };
      const mark = (n, k) => {
        n.res = k; run.counts[k]++; run.score += JUDGE[k][2];
        if (k === 'M') run.combo = 0; else { run.combo++; run.maxCombo = Math.max(run.maxCombo, run.combo); }
        const el = els[notes.indexOf(n)]; if (el) el.classList.add('done');
        flash(k, n);
        if (k !== 'M' && !n.tail && cmode() === 'chars' && n.label) try { CJK.seen(n.label, { lang: 'ja' }); } catch (e) { /* (fine) */ }
      };
      const posNow = () => MU.now();
      const press = d => {
        if (run.done) return;
        const pos = posNow(); if (pos < 0) return;
        let best = null, bd = 1e9;
        for (let i = run.i0; i < notes.length; i++) {
          const n = notes[i]; if (n.t - pos > W.o) break; if (n.res) continue;
          const fits = n.need === 'J' ? (d === 'L' || d === 'R') && !n.got[d] : n.need === d;
          const dd = Math.abs(n.t - pos);
          if (fits && dd <= W.o && dd < bd) { bd = dd; best = n; }
        }
        const pad = P.pads.querySelector(`[data-d="${d}"]`); if (pad) { pad.classList.add('on'); setTimeout(() => pad.classList.remove('on'), 90); }
        if (!best) { Sound.play('click'); return; }
        if (best.need === 'J') { best.got[d] = bd; if (best.got.L === undefined || best.got.R === undefined) return; bd = Math.max(best.got.L, best.got.R); }
        mark(best, bd <= W.p ? 'P' : bd <= W.g ? 'G' : 'O');
      };
      run.press = press;
      KEYH = (e, inInput) => { const d = KEYDIR[e.code]; if (d && !e.repeat) { press(d); return true; } return false; };
      P.pads.querySelectorAll('.dn-pad').forEach(b => { b.onpointerdown = ev => { ev.preventDefault(); press(b.dataset.d); }; });
      const foeRoll = () => { const f = FOE[run.foe.kind] || FOE.full, r = Math.random(); return r < f[0] ? 'P' : r < f[0] + f[1] ? 'G' : r < f[0] + f[1] + f[2] ? 'O' : 'M'; };
      const last = notes[notes.length - 1].t;
      run.tick = () => {
        const pos = posNow(); if (pos < 0) return;
        // a loop back to the top means the song ended while a stall skipped its last bars
        if (pos < run.lastPos - 20 && run.lastPos > last) { finish(); return; }
        run.lastPos = Math.max(run.lastPos, pos);
        for (let i = run.i0; i < notes.length; i++) {
          const n = notes[i];
          if (n.t > pos + W.o) break;
          if (!n.res && run.auto !== undefined && n.t <= pos) {
            const k = Math.random() < run.auto ? 'P' : Math.random() < 0.5 ? 'G' : 'M';
            mark(n, k);
          }
          if (!n.res && n.t + W.o < pos) mark(n, 'M');
          if (run.foe && !n.foe && n.t <= pos) { n.foe = foeRoll(); run.foe.score += JUDGE[n.foe][2]; if (n.foe === 'M') run.foe.combo = 0; else { run.foe.combo++; run.foe.max = Math.max(run.foe.max, run.foe.combo); } }
          if (n.res && i === run.i0) run.i0++;
        }
        // the cards rise to the targets
        for (let i = Math.max(0, run.i0 - 4); i < notes.length; i++) {
          const n = notes[i], el = els[i], y = REC + (n.t - pos) * PX;
          if (y > H + 10) { if (i > run.i0 + 40) break; el.style.display = 'none'; continue; }
          if (y < -60) { el.style.display = 'none'; continue; }
          el.style.display = 'flex';
          const x = cols ? colX(n.d === 'J' ? 'L' : n.d) : 70, w = n.tail ? 20 : cardW;
          el.style.transform = `translate(${n.tail ? x + cardW / 2 - 10 : x}px, ${n.tail ? y + 14 : y}px)`;
          if (n.d === 'J' && cols) el.style.width = (210 + cardW - 40) + 'px';
        }
        const tot = notes.length * 100, judged = run.counts.P + run.counts.G + run.counts.O + run.counts.M;
        P.side.querySelector('.pc.you').textContent = `${Math.round((run.score / tot) * 100)}%`;
        P.side.querySelector('i.you').style.width = `${(run.score / tot) * 100}%`;
        P.side.querySelector('.cy').textContent = `${judged}/${notes.length} · best combo ${run.maxCombo}`;
        if (run.foe) { P.side.querySelector('.pc.foe').textContent = `${Math.round((run.foe.score / tot) * 100)}%`; P.side.querySelector('i.foe').style.width = `${(run.foe.score / tot) * 100}%`; P.side.querySelector('.cf').textContent = `combo ${run.foe.combo}`; }
        if (pos > last + 10) finish();
      };
      run.wake = v => { if (v && v.quit) { run.quitted = true; finish(); } };
      MU.start(tk.name ? tk.name : 'dn_' + tk.id, { level: 0.36 });
      function finish() {
        if (run.done) return; run.done = true; run.tick = null; KEYH = null;
        MU.stop();
        CUR = null;
        const tot = notes.length * 100, pct = Math.round((run.score / tot) * 100), foePct = run.foe ? Math.round((run.foe.score / tot) * 100) : null;
        const grade = pct >= 95 ? 'S' : pct >= 85 ? 'A' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : 'D';
        resolve(run.quitted ? { quit: true } : { pct, grade, counts: run.counts, maxCombo: run.maxCombo, full: run.counts.M === 0, foePct, win: run.foe ? pct > foePct : null, level });
      }
    });
  }
  // the results screen: your grade, the counts, and (in a battle) who won
  async function results(r, o = {}) {
    const P = PANEL; if (!P) return;
    P.el.classList.add('talk');
    RUN = { kind: 'results', quit: false };
    P.body.innerHTML = `<div class="dn-grade">${r.grade}</div><div class="dn-stats">${r.pct}% · ${J('パーフェクト')} ${r.counts.P} · ${J('グレート')} ${r.counts.G} · ${J('グッド')} ${r.counts.O} · ${J('ミス')} ${r.counts.M} · best combo ${r.maxCombo}${r.full ? ` · ${J('フルコンボ ！')}` : ''}</div>`
      + (r.foePct !== null && r.foePct !== undefined ? `<div class="dn-big">${r.win ? 'You win!' : 'Susumu wins!'} <small style="font-size:16px">(you ${r.pct}% · ${esc(JP('ススム'))} ${r.foePct}%)</small></div>` : '')
      + `<div class="dn-say"></div><button class="dn-btn" data-a="ok">OK ▸ (Enter)</button>`;
    if (o.say) suSay(o.say[0], o.say[1]);
    Sound.play(r.win || (r.win === null && (r.grade === 'S' || r.grade === 'A')) ? 'fanfare' : 'chest');
    P.body.querySelector('[data-a=ok]').onclick = () => { if (RUN.wake) RUN.wake({}); };
    KEYH = (e, inInput) => { if (!inInput && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE')) { if (RUN.wake) RUN.wake({}); return true; } return false; };
    await waitWake(); KEYH = null;
  }
  // ------------------------------------------------------------ talk mode: trivia cards, quizzes, phrases you say, calls for Mimo
  function waitOk(P) {
    const ok = P.body.querySelector('[data-a=ok]'); if (ok) ok.onclick = () => { if (RUN.wake) RUN.wake({}); };
    KEYH = (e, inInput) => { if (!inInput && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE')) { if (RUN.wake) RUN.wake({}); return true; } return false; };
    return waitWake().then(v => { KEYH = null; return v || {}; });
  }
  async function factsRound(ch) {
    const P = openPanel(ch.title, [ch.titleEn, 'まめちしき, trivia'], true);
    for (let i = 0; i < ch.facts.length; i++) {
      const f = ch.facts[i];
      RUN = { kind: 'facts', i, quit: false };
      const fx = mixJ(f.ja, f.en, 'dance.fact.' + ch.n + '.' + i);          // (the fact by the weave; its English with EN)
      P.body.innerHTML = `<div class="dn-q">${J('まめちしき')} ${i + 1} / ${ch.facts.length}</div><div class="dn-big${fx.full ? '' : ' mx'}">${fx.html}</div><div class="dn-en dn-tr">${esc(f.en)}</div>`
        + `<button class="dn-btn" data-a="ok">${i + 1 < ch.facts.length ? 'Next ▸' : 'Quiz! ▸'} (Enter)</button>`;
      if (cmode() === 'chars') try { CJK.seen(f.ja, { lang: 'ja' }); } catch (e) { /* (fine) */ }
      Sound.play('page');
      const r = await waitOk(P); if (r.quit) return { quit: true };
      S().facts[ch.n + '.' + i] = true;
    }
    return {};
  }
  // a typed answer in the panel: { ok, tries, shown } or { quit }
  function typeIn(P, o) {
    return new Promise(resolve => {
      const run = RUN; let tries = 0, shown = false;
      P.body.insertAdjacentHTML('beforeend', `<input class="dn-in" autocomplete="off" spellcheck="false" placeholder="${esc(cmode() === 'chars' ? 'rōmaji (Space for kanji), then Enter' : 'type it in rōmaji, then Enter')}"><div class="dn-msg"></div><div><button class="dn-btn light" data-a="hint">? Hint</button> <button class="dn-btn" data-a="go">${esc(o.ok || 'Enter ▸')}</button></div>`);
      const inp = P.body.querySelector('.dn-in'), msg = P.body.querySelector('.dn-msg');
      try { if (typeof CJK !== 'undefined' && CJK.attachIME) CJK.attachIME(inp); } catch (e) { /* (plain box) */ }
      setTimeout(() => { try { inp.focus(); } catch (e) { /* (hidden) */ } }, 30);
      const done = v => { run.answer = null; run.wake = null; resolve(v); };
      const check = text => {
        const t = String(text || '').trim(); if (!t) return;
        const res = o.check ? o.check(t) : { ok: o.want.some(w => same(t, w)) };
        if (res.ok) { try { CJK.used(t, o.want ? o.want[0] : t, { lang: 'ja' }); } catch (e) { /* (fine) */ } Sound.play('review'); done({ ok: true, tries, shown, text: t }); return; }
        tries++; Sound.play('wrong');
        if (tries >= 2 && o.want) shown = true;
        msg.className = 'dn-msg bad'; msg.innerHTML = res.msg || ((shown && o.want ? `It’s ${J(o.want[0], { ruby: 'always' })}: type it.` : 'Not quite! (? for a hint)'));
      };
      run.answer = check;
      run.wake = v => { if (v && v.quit) done({ quit: true }); };
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); e.stopPropagation(); check(inp.value); } });
      P.body.querySelector('[data-a=go]').onclick = () => check(inp.value);
      P.body.querySelector('[data-a=hint]').onclick = () => { shown = true; msg.className = 'dn-msg'; msg.innerHTML = o.hint ? o.hint() : `It’s ${J(o.want[0], { ruby: 'always' })}`; };
    });
  }
  async function quizRound(ch) {
    const P = PANEL && panelOpen() ? PANEL : openPanel(ch.title, [ch.titleEn, ''], true);
    let right = 0;
    for (let i = 0; i < ch.quiz.length; i++) {
      const q = ch.quiz[i];
      RUN = { kind: 'quiz', q, quit: false };
      P.body.innerHTML = `<div class="dn-q">${J('クイズ')} ${i + 1} / ${ch.quiz.length}: ${esc(q.q)}</div><div class="dn-say"></div>`;
      if (q.opts) {
        const order = q.opts.map((t, k) => k).sort(() => Math.random() - 0.5);
        P.body.insertAdjacentHTML('beforeend', `<div class="dn-opts">${order.map((k, j) => `<button class="dn-opt" data-k="${k}"><kbd>${j + 1}</kbd>${esc(q.opts[k])}</button>`).join('')}</div>`);
        const pick = await new Promise(res => {
          RUN.pick = k => res(k);
          P.body.querySelectorAll('.dn-opt').forEach(b => { b.onclick = () => res(+b.dataset.k); });
          KEYH = (e, inInput) => { if (!inInput && /^Digit[1-3]$/.test(e.code)) { const j = +e.code.slice(-1) - 1; if (order[j] !== undefined) res(order[j]); return true; } return false; };
          RUN.wake = v => { if (v && v.quit) res(-1); };
        });
        KEYH = null; RUN.pick = null; if (pick < 0) return { quit: true };
        const ok = pick === q.right; if (ok) right++;
        P.body.querySelectorAll('.dn-opt').forEach(b => { const k = +b.dataset.k; if (k === q.right) b.classList.add('right'); else if (k === pick) b.classList.add('wrong'); });
        suSay(ok ? 'せいかい ！' : 'ブブー ！ ちがう よ 。', ok ? 'Correct!' : 'Bzzt! Nope.'); Sound.play(ok ? 'review' : 'wrong');
      } else {
        const r = await typeIn(P, { want: q.want, ok: 'Answer ▸' });
        if (r.quit) return { quit: true };
        if (!r.tries && !r.shown) right++;
        suSay('せいかい ！', 'Correct!');
      }
      await sleep(900);
    }
    return { right, of: ch.quiz.length };
  }
  // you say one of Susumu's phrases at its moment: shown the first time (copy it), from memory after that (? shows it)
  async function declare(id, q) {
    const p = PHRASES.find(x => x.id === id); if (!p) return true;
    const known = typeof LEX !== 'undefined' && LEX.taught(id);
    const P = PANEL && panelOpen() && PANEL.el.classList.contains('talk') ? PANEL : openPanel('', 'Say it!', true);
    RUN = { kind: 'declare', id, quit: false };
    P.body.innerHTML = `<div class="dn-q">${esc(q)}</div>` + (known ? `<div class="dn-en">(${esc(p.en)})</div>` : `<div class="dn-big">${J(p.ja, { ruby: 'always' })}</div><div class="dn-en">${esc(p.en)} · ${esc(p.note)}</div>`);
    if (!known) try { CJK.say(p.ja, 'ja'); } catch (e) { /* (no voice) */ }
    const r = await typeIn(P, { want: [p.ja].concat(p.alt || []), ok: 'Say it ▸' });
    if (r.quit) return false;
    if (typeof LEX !== 'undefined') LEX.attempt(id, { ok: true, hints: r.shown ? 1 : 0, ms: 4000, mode: known ? 'talk' : 'echo' });
    if (!known) UI.toast(`New phrase: «${JP(p.ja)}» · it’s in your Phrasebook (journal)`);
    return true;
  }
  // ------------------------------------------------------------ Mimo's dance: you call the steps in words, Mimo dances them
  // "ひだり みぎ うえ", "右2回", "ジャンプ"… (counters repeat the step before them; と / を / それから are fine between)
  const NUMS = { 1: 'いっ', 2: 'に', 3: 'さん', 4: 'よん' };
  function callKeys() {         // (worked out each time: canon depends on the dictionary, which grows as the game loads)
    const CALLKEYS = {
      dirs: [['ひだり', 'L'], ['みぎ', 'R'], ['うえ', 'U'], ['した', 'D'], ['ジャンプ', 'J'], ['じゃんぷ', 'J']].map(([k, d]) => [canon(k), d]).filter(x => x[0]),
      counts: [['にかい', 2], ['さんかい', 3], ['よんかい', 4], ['いっかい', 1]].map(([k, n]) => [canon(k), n]).filter(x => x[0]),
      fill: ['と', 'を', 'に', 'で', 'ね', 'よ', 'それから', 'つぎ', 'そして', 'つぎは'].map(canon).filter(Boolean).sort((a, b) => b.length - a.length),
    };
    CALLKEYS.dirs.sort((a, b) => b[0].length - a[0].length);
    return CALLKEYS;
  }
  function parseCall(text) {
    // (the step kanji and 回 read as the machine means them: the dictionary could pick another reading, 上 じょう, 回 まわ)
    const KJ = { 右: 'みぎ', 左: 'ひだり', 上: 'うえ', 下: 'した', 回: 'かい', 反対: 'はんたい' };
    const raw = String(text == null ? '' : text).normalize('NFKC').replace(/[1-4]/g, d => NUMS[d]).replace(/反対|[右左上下回]/g, k => KJ[k]);
    const K = callKeys(); let c = canon(raw); const steps = [];
    while (c.length) {
      const d = K.dirs.find(([k]) => c.startsWith(k)); if (d) { steps.push(d[1]); c = c.slice(d[0].length); continue; }
      const n = K.counts.find(([k]) => c.startsWith(k)); if (n && steps.length) { for (let i = 1; i < n[1]; i++) steps.push(steps[steps.length - 1]); c = c.slice(n[0].length); continue; }
      const f = K.fill.find(k => c.startsWith(k)); if (f) { c = c.slice(f.length); continue; }
      return { steps, bad: c };
    }
    return { steps };
  }
  function callPattern(level, i) {
    const R = rng(900 + level * 31 + i * 7), D = ['L', 'R', 'U', 'D'], n = level <= 2 ? 3 : level === 3 ? 4 : 5, out = [];
    while (out.length < n) {
      if (level >= 3 && out.length && out.length === 2 && R() < 0.8) { out.push(out[out.length - 1]); continue; }      // a repeat: say it with 2回
      if (level >= 4 && out.length === n - 1 && R() < 0.8) { out.push('J'); continue; }
      let d = D[Math.floor(R() * 4)]; if (d === out[out.length - 1]) d = D[(D.indexOf(d) + 1) % 4]; out.push(d);
    }
    return out;
  }
  // the model call for a pattern: runs of the same step become «右 2回»
  function callText(steps) {
    const parts = [];
    for (let i = 0; i < steps.length;) { let j = i; while (j < steps.length && steps[j] === steps[i]) j++; parts.push(WORD[steps[i]] + (j - i > 1 ? ` ${j - i} [回|かい]` : '')); i = j; }
    return parts.join(' 、 ');
  }
  async function mimoDance(steps) {
    const M = G.sim.mimo, ANI = A(), R = ANI.RB, P = ANI.SPOT.b.padR, cx = R.x + P.x, cz = R.z + P.z;
    if (PANEL) PANEL.el.style.visibility = 'hidden';
    G.cam.override = { pos: new THREE.Vector3(cx - 2.2, R.y + 3.0, cz + 4.6), look: new THREE.Vector3(cx, R.y + 0.6, cz - 0.4) };
    G.sim.mimoGo({ x: cx, z: cz }, { x: cx, z: cz - 3 });
    await sleep(900);
    for (const d of steps) {
      const v = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1], J: [0, 0] }[d];
      M.station = null;
      M.hop = { x0: M.x, z0: M.z, x1: cx + v[0] * 0.55, z1: cz + v[1] * 0.55, y0: M.y, y1: M.y, t: 0, dur: 0.24, h: d === 'J' ? 0.95 : 0.35 };
      Sound.play('pip'); await sleep(300);
      M.hop = { x0: M.x, z0: M.z, x1: cx, z1: cz, y0: M.y, y1: M.y, t: 0, dur: 0.18, h: 0.2 };
      await sleep(220);
    }
    M.happy = 1.4; G.w3d.fx.sparkle(M.x, M.ry + 0.8, M.z, 14); Sound.play('learned');
    await sleep(700);
    G.sim.mimoGo(null, null); G.cam.override = null;
    if (PANEL) PANEL.el.style.visibility = '';
  }
  async function callRound(level, count = 2) {
    const P = openPanel('', `Call the steps for ${G.state.mimoName}: in words!`, true);
    let ok = 0;
    for (let i = 0; i < count; i++) {
      const steps = callPattern(level, i);
      RUN = { kind: 'call', steps, quit: false };
      P.body.innerHTML = `<div class="dn-q">${G.state.mimoName}’s steps, ${i + 1} / ${count}: call them out, in order!</div><div class="dn-arrows">${steps.map(d => `<span style="background:${COL[d]}">${ARROW[d]}</span>`).join('')}</div>`
        + `<div class="dn-en">${level >= 3 ? 'Two the same in a row? Say it once with 2回: ' + J('[右|みぎ] 2 [回|かい]') + '. ' : ''}${steps.includes('J') ? J('ジャンプ') + ' = ← and → together. ' : ''}Words: ${['L', 'R', 'U', 'D'].map(d => `${ARROW[d]} ${J(WORD[d])}`).join(' · ')}</div><div class="dn-say"></div>`;
      const r = await typeIn(P, { ok: 'Call it ▸', want: [callText(steps)],
        check: t => { const p = parseCall(t); if (p.bad !== undefined && !p.steps.length) return { ok: false, msg: 'Say the steps in Japanese: ひだり, みぎ, うえ, した…' };
          if (p.steps.join('') === steps.join('')) return { ok: true };
          const k = p.steps.findIndex((d, j) => d !== steps[j]); return { ok: false, msg: p.bad !== undefined ? `I didn’t catch «${esc(p.bad.slice(0, 12))}».` : k >= 0 ? `Step ${k + 1} is wrong: that’s ${ARROW[steps[k]]}.` : p.steps.length < steps.length ? `There are ${steps.length} steps; you called ${p.steps.length}.` : 'Too many steps!' }; },
        hint: () => `Say: ${J(callText(steps), { ruby: 'always' })}` });
      if (r.quit) return { quit: true };
      if (!r.shown) ok++;
      suSay('{mimo} 、 [上手|じょうず] ！', `${G.state.mimoName}, nice moves!`);
      S().calls = (S().calls || 0) + 1;
      await mimoDance(steps);
    }
    return { ok, of: count };
  }
  // ============================================================ scenes
  const suSt = () => { const R = A() && A().ROOM; return R ? R.b.susumu.st : null; };
  const ssay = (key, o) => A().ssay('susumu', key, o);
  const TRACK_OF = { 1: 'yochi', 2: 'neon', 3: 'conga', 4: 'pico', 5: 'king' };
  const HANDI = { 2: 'eyes', 3: 'foot', 4: 'full', 5: 'king' };
  // you on the left pad, Susumu (in a battle) on the right one, Mimo watching from the side
  function standOnPads(foe) {
    const ANI = A(), R = ANI.RB, B = ANI.SPOT.b, Y = G.sim.you, su = suSt();
    Y.x = R.x + B.padL.x; Y.z = R.z + B.padL.z; Y.yaw = Math.PI; Y.vx = Y.vz = Y.vy = 0; G.sim.snap();
    if (foe && su) { su.x = R.x + B.padR.x; su.z = R.z + B.padR.z; su.y = R.y + 0.18; su.lock = true; su.yaw = su.baseYaw = Math.PI; su.forcePose = true; su.pose = 'dance'; }
    G.sim.mimoGo({ x: R.x - 3.0, z: R.z + 0.2 }, { x: R.x, z: R.z - 3 });
    G.cam.snap(Math.PI, 0.42, 7.6);
  }
  function backFromPads() {
    const ANI = A(), R = ANI.RB, B = ANI.SPOT.b, su = suSt();
    if (su) { su.x = R.x + B.susumu.x; su.z = R.z + B.susumu.z; su.y = R.y; su.lock = false; su.forcePose = false; su.baseYaw = -0.5; su.beat = undefined; su.dir = undefined; }
    G.sim.mimoGo(null, null);
  }
  function stop() { closePanel(); RUN = null; UI.toast('Stopped. Talk to Susumu to pick it up again.'); }
  async function battle(n, o = {}) {        // true: you beat him; false: you lost and stopped; null: you quit
    const st = S(); let losses = st.losses[n] || 0;
    for (;;) {
      const foe = losses >= 2 ? 'easy' : HANDI[n];
      if (foe === 'easy') await ssay('su.handi2'); else if (!o.quiet) await ssay({ eyes: 'su.eyes', foot: 'su.foot', full: 'su.full' }[foe] || 'su.battle');
      standOnPads(true);
      const r = await dance({ level: n, track: TRACK_OF[n], foe, say: ['[勝負|しょうぶ] だ ！', 'It’s a match!'] });
      if (r.quit) { closePanel(); RUN = null; backFromPads(); return null; }
      st.best[TRACK_OF[n]] = Math.max(st.best[TRACK_OF[n]] || 0, r.pct);
      await results(r, { say: r.win ? ['えーっ ！ [負|ま]けた ！ ？ … くやしい ！', 'Whaaat! I lost?! …So frustrating!'] : ['ぼく の [勝|か]ち ！ でも 、 [上手|じょうず] に なった ね 。', 'I win! But you’re getting good.'] });
      if (r.win && typeof LEX !== 'undefined' && !LEX.taught('ph.su.yatta')) await declare('ph.su.yatta', 'You beat him! Say it!');
      if (!r.win && typeof LEX !== 'undefined' && !LEX.taught('ph.su.kuyashii')) await declare('ph.su.kuyashii', 'So close… say how it feels!');
      closePanel(); RUN = null; backFromPads();
      if (r.win) { st.wins[n] = (st.wins[n] || 0) + 1; if (G.save) G.save(); return true; }
      losses = st.losses[n] = losses + 1; if (G.save) G.save();
      G.sim.lock = 1;
      const again = await UI.choose('Battle Susumu again?', [{ label: 'Again!', sub: losses >= 2 ? 'He’ll give you a bigger handicap' : '', value: 'y' }, { label: 'Later', value: 'n' }]);
      G.sim.lock = 0;
      if (again !== 'y') return false;
    }
  }
  async function chapter(n) {
    const ch = CHAPTERS[n - 1], st = S();
    if (n === 5) return final();
    await ssay('su.facts');
    let r = await factsRound(ch); if (r.quit) return stop();
    closePanel(); RUN = null;
    await ssay('su.quiz');
    r = await quizRound(ch); if (r.quit) return stop();
    closePanel(); RUN = null;
    UI.toast(`Quiz: ${r.right} / ${r.of} right${r.right === r.of ? '. ぜんぶ せいかい!' : ''}`);
    if (n === 1) {
      await ssay('su.machine'); await ssay('su.how');
      await ssay('su.mitete');
      if (!(await declare('ph.su.mitete', 'Your turn! Tell Susumu to watch you:'))) return stop();
      closePanel(); RUN = null;
      await ssay('su.lesson');
      standOnPads(false);
      const d = await dance({ level: 1, track: 'yochi', say: ['[右|みぎ] と [左|ひだり] だけ ！', 'Just right and left!'] });
      if (d.quit) { closePanel(); RUN = null; backFromPads(); return; }
      st.best.yochi = Math.max(st.best.yochi || 0, d.pct);
      await results(d, { say: d.pct >= 70 ? ['[上手|じょうず] ！', 'Nice!'] : ['だいじょうぶ 、 すぐ [上手|じょうず] に なる よ 。', 'Don’t worry, you’ll get good fast.'] });
      closePanel(); RUN = null; backFromPads();
    } else {
      await ssay('su.call');
      const c = await callRound(n, 2); if (c.quit) return stop();
      closePanel(); RUN = null;
      if (!(await declare(n === 3 ? 'ph.su.makenai' : 'ph.su.shoubu', n === 3 ? 'Tell Susumu you won’t lose!' : 'Declare the match!'))) return stop();
      closePanel(); RUN = null;
      const won = await battle(n);
      if (!won) return;                 // (the chapter waits for a win: his menu offers the battle again)
    }
    st.ch = Math.max(st.ch, n);
    Sound.play('chest');
    UI.toast(n === 1 ? 'Yajirushi Fever: free play is open (the pads)' : `Beat Susumu at level ${n}! A new song on the machine: «${JP(TRACKS[n - 1].title)}»`);
    if (G.save) G.save();
  }
  // Otoha peeks in at the doorway for the final (a second model of her, only for this scene)
  let OTO = null;
  function otohaVisit(on) {
    const ANI = A(), R = ANI.RB, B = ANI.SPOT.b, room = ANI.ROOM && ANI.ROOM.b; if (!room) return null;
    if (on && !OTO && ANI.buildKid) { OTO = { k: ANI.buildKid('otoha'), st: { x: R.x + B.back.x + 1.0, y: R.y, z: R.z + B.back.z + 0.6, yaw: Math.PI / 2, baseYaw: Math.PI / 2, talk: 0, pose: 'idle', top: 1.95, name: 'オトハ' } }; room.g.add(OTO.k.root); }
    if (OTO) OTO.k.root.visible = !!on;
    return OTO;
  }
  async function final() {
    const st = S(), su = suSt(), O = otohaVisit(true);
    if (O) await A().ssay('otoha', 'su.f.oto', { at: O.st });
    if (su) { su.forcePose = true; su.pose = 'shy'; }
    await ssay('su.f.scared');
    await STORY.you('You’re way more than the King of Steps. You know everything about manga, and you’re a great little brother.');
    if (O) await A().ssay('otoha', 'su.f.oto2', { at: O.st });
    if (su) su.pose = 'cheer';
    await ssay('su.f.ready');
    if (su) su.forcePose = false;
    const c = await callRound(5, 2); if (c.quit) { otohaVisit(false); return stop(); }
    closePanel(); RUN = null;
    if (!(await declare('ph.su.shoubu', 'The final! Declare the match:'))) { otohaVisit(false); return stop(); }
    closePanel(); RUN = null;
    const won = await battle(5, { quiet: true });
    if (won) {
      if (su) { su.forcePose = true; su.pose = 'shy'; }
      await ssay('su.f.lost');
      if (su) su.pose = 'cheer';
      await ssay('su.f.medal');
      st.medal = true; st.medalOn = true; medal(); G.state.bag = G.state.bag || {}; G.state.bag['k.stepMedal'] = 1;
      Sound.play('fanfare'); const M = G.sim.mimo; M.happy = 1.5; M.glow = 1; G.w3d.fx.sparkle(M.x, M.ry + 0.8, M.z, 26);
      await UI.card(`<div class="tag">From Susumu</div><canvas width="140" height="140"></canvas><div class="big">${J('ステップ [王|おう] の メダル', { ruby: 'always' })}</div><div class="sub">The King of Steps medal. ${esc(G.state.mimoName)} wears it now (his menu can take it off). You’re the new champion of Yajirushi Fever! <b>E</b></div>`, { kind: 'reveal', icon: 'medal' });
      if (typeof LEX !== 'undefined' && !LEX.taught('ph.su.otsukare')) { await declare('ph.su.otsukare', 'What a match. Say “good game”!'); closePanel(); RUN = null; }
      if (typeof LEX !== 'undefined' && !LEX.taught('ph.su.tensai')) { await declare('ph.su.tensai', 'Susumu danced amazingly too. Tell him he’s a genius!'); closePanel(); RUN = null; }
      st.ch = 5;
      if (su) su.forcePose = false;
      if (G.save) G.save();
    } else if (won === false) await ssay('su.f.won');
    otohaVisit(false);
  }
  // ------------------------------------------------------------ talking to Susumu, and the machine itself
  async function arrive() {
    if (!isOn()) return;
    const st = S(); if (st.met) return;
    st.met = true;
    await ssay('su.hi'); await ssay('su.machine');
    if (G.save) G.save();
    if (chUnlocked(1)) await chapter(1);
  }
  async function talk() {
    const st = S();
    if (!st.met) return arrive();
    const n = st.ch + 1, opts = [], mn = G.state.mimoName || 'Mimo';
    if (n <= 5 && chUnlocked(n)) opts.push({ label: n === 5 ? 'The King of Steps final!' : (st.losses[n] && n > 1 ? `Battle again (level ${n})` : `Manga trivia and a dance (${n} of 5)`), sub: CHAPTERS[n - 1].titleEn, value: 'ch' });
    else if (n <= 5) opts.push({ label: 'What’s next?', sub: `More trivia ${GATE_TEXT[n - 1]}`, value: 'locked' });
    if (st.ch >= 1) opts.push({ label: 'A rematch', sub: 'Battle him on any level you’ve cleared', value: 'rematch' });
    if (st.ch >= 2) opts.push({ label: `${mn}’s dance`, sub: 'Call the steps for it, in words', value: 'call' });
    if (Object.keys(st.facts).length) opts.push({ label: 'Tell me a fact again', value: 'fact' });
    if (st.medal) opts.push({ label: st.medalOn ? `${mn}’s medal: take it off` : `${mn}’s medal: put it on`, value: 'medal' });
    opts.push({ label: 'Chat', value: 'chat' });
    G.sim.lock = 1; const pick = await UI.choose('Susumu', opts); G.sim.lock = 0;
    if (pick === 'ch') { const mid = st.losses[n] && n > 1 && n < 5 && (st.facts[n + '.0']); return mid ? retryBattle(n) : chapter(n); }
    if (pick === 'locked') return ssay('su.locked');
    if (pick === 'rematch') return rematch();
    if (pick === 'call') { const lv = Math.min(5, Math.max(2, st.ch)); const c = await callRound(lv, 2); closePanel(); RUN = null; return c; }
    if (pick === 'fact') return factAgain();
    if (pick === 'medal') { st.medalOn = !st.medalOn; Sound.play('pip'); if (G.save) G.save(); return; }
    if (pick === 'chat') return ssay(st.ch >= 5 ? pickOf(['su.done', 'su.chat1', 'su.chat2', 'su.chat3']) : pickOf(['su.chat1', 'su.chat2', 'su.chat3']));
  }
  // (a chapter whose trivia you've had, but whose battle you lost: straight to the battle)
  async function retryBattle(n) {
    if (!(await declare(n === 3 ? 'ph.su.makenai' : 'ph.su.shoubu', 'Declare the match!'))) return stop();
    closePanel(); RUN = null;
    const won = await battle(n);
    if (won) { const st = S(); st.ch = Math.max(st.ch, n); Sound.play('chest'); UI.toast(`Beat Susumu at level ${n}! A new song on the machine: «${JP(TRACKS[n - 1].title)}»`); if (G.save) G.save(); }
  }
  async function rematch() {
    const st = S(), lv = TRACKS.filter(tk => tk.level <= Math.max(1, st.ch) && tk.level >= 2);
    if (!lv.length) { STORY.think('Susumu wants to teach you the basics first. Finish his first lesson!', 4); return; }
    G.sim.lock = 1; const id = await UI.choose('A rematch: which song?', lv.map(tk => ({ label: `${JP(tk.title)} (${tk.titleEn})`, sub: `level ${tk.level} · your best ${st.best[tk.id] || 0}%`, value: tk.id }))); G.sim.lock = 0;
    if (!id) return;
    const tk = TRACK(id); standOnPads(true);
    const r = await dance({ level: tk.level, track: id, foe: tk.level === 5 ? 'king' : 'full', say: ['もう [一回|いっかい] ！', 'Again!'] });
    if (!r.quit) { st.best[id] = Math.max(st.best[id] || 0, r.pct); await results(r, { say: r.win ? ['くやしい ！', 'Argh!'] : ['ぼく の [勝|か]ち ！', 'I win!'] }); }
    closePanel(); RUN = null; backFromPads();
    if (G.save) G.save();
  }
  async function factAgain() {
    const st = S(), seen = CHAPTERS.flatMap(ch => ch.facts.map((f, i) => ({ f, ch, k: ch.n + '.' + i }))).filter(x => st.facts[x.k]);
    if (!seen.length) return;
    const x = pickOf(seen), P = openPanel(x.ch.title, [x.ch.titleEn, ''], true);
    RUN = { kind: 'facts', quit: false };
    const fx = mixJ(x.f.ja, x.f.en, 'dance.fact.' + x.k);
    P.body.innerHTML = `<div class="dn-q">${J('まめちしき')}</div><div class="dn-big${fx.full ? '' : ' mx'}">${fx.html}</div><div class="dn-en dn-tr">${esc(x.f.en)}</div><button class="dn-btn" data-a="ok">OK ▸ (Enter)</button>`;
    await waitOk(P); closePanel(); RUN = null;
  }
  // the pads themselves: free play (every song you've unlocked), alone
  async function machine() {
    const st = S();
    if (!st.met) return arrive();
    const songs = TRACKS.filter(tk => tk.level <= Math.max(1, st.ch));
    if (!st.ch) { STORY.think('The screen flashes «ヤジルシ★フィーバー». Susumu wants to show you how it works first: talk to him!', 4.5); return; }
    G.sim.lock = 1; const id = await UI.choose('ヤジルシ★フィーバー: free play', songs.map(tk => ({ label: `${JP(tk.title)} (${tk.titleEn})`, sub: `level ${tk.level} · best ${st.best[tk.id] || 0}%`, value: tk.id }))); G.sim.lock = 0;
    if (!id) return;
    const tk = TRACK(id); standOnPads(false);
    const r = await dance({ level: tk.level, track: id });
    if (!r.quit) { st.best[id] = Math.max(st.best[id] || 0, r.pct); await results(r, { say: r.grade === 'S' ? ['[天才|てんさい] ！', 'Genius!'] : r.grade === 'A' ? ['すごい ！', 'Amazing!'] : ['もう [一回|いっかい] ！', 'Once more!'] }); }
    closePanel(); RUN = null; backFromPads();
    if (G.save) G.save();
  }
  // ------------------------------------------------------------ Mimo's medal (a gold medal pinned on its front, a red and blue ribbon)
  let MEDAL = null;
  const HALF = Math.PI / 2;
  function medal() {
    if (MEDAL || !G || !G.cast || !G.cast.mimo) return MEDAL;
    const g = new THREE.Group(); g.position.set(0, 0.17, 0.315); g.rotation.x = -0.2;
    g.add(TK.part(TK.G.box, '#e0503f', [-0.03, 0.07, 0], [0.05, 0.1, 0.012], { rot: [0, 0, 0.35], ink: 0.006 }));
    g.add(TK.part(TK.G.box, '#3f7fc9', [0.03, 0.07, 0], [0.05, 0.1, 0.012], { rot: [0, 0, -0.35], ink: 0.006 }));
    g.add(TK.part(TK.G.cyl, GOLD, [0, -0.01, 0.01], [0.06, 0.018, 0.06], { rot: [HALF, 0, 0], ink: 0.008 }));
    g.add(TK.part(TK.G.cyl, '#ffe9a0', [0, -0.01, 0.022], [0.04, 0.004, 0.04], { rot: [HALF, 0, 0], ink: 0 }));
    g.visible = false; G.cast.mimo.body.add(g); MEDAL = g;
    return g;
  }
  const medalOn = () => !!(G && G.state && isOn() && G.state.dance && G.state.dance.medal && G.state.dance.medalOn);

  // ============================================================ the quest (QUESTS.LIST)
  function quest() {
    const dn = s => s.dance || {}, chOf = s => dn(s).ch || 0;
    const target = () => { const ANI = A(); if (!ANI) return null; if (ANI.room === 'b') return { x: ANI.RB.x + ANI.SPOT.b.susumu.x - 0.6, z: ANI.RB.z + ANI.SPOT.b.susumu.z + 1.1 }; if (ANI.room === 'a') return { x: -190 + 6.0, z: 30 - 1.0 }; const o = ANI._.OUT; return o && o.door ? o.door : null; };
    const nextWhen = s => { const n = chOf(s) + 1; return n <= 5 && !GATES[n - 1](s) ? ` More ${GATE_TEXT[n - 1]}.` : ''; };
    return {
      id: 'dance', kind: 'side',
      title: 'The King of Steps',
      giver: 'Susumu, Otoha’s little brother',
      started: s => s.lang === 'ja' && !!(dn(s).met || (s.anime && s.anime.met)),
      steps: [
        { text: 'Meet Susumu in his room (the doorway in Otoha’s living room)', done: s => !!dn(s).met, target,
          why: 'Otoha’s little brother knows every manga fact there is, and nobody has ever beaten him at his dance machine.', hint: '{mimo} points at the doorway with ススム on its curtain.' },
        { get text() { return 'Manga trivia and dance battles with Susumu ({n}/4)'; }, n: s => Math.min(4, chOf(s)), done: s => chOf(s) >= 4, target,
          get why() { return 'His machine calls the steps in words: みぎ, ひだり, うえ, した. Read them fast!' + (G ? nextWhen(G.state) : ''); }, hint: '{mimo} hops left, right, left… toward Susumu’s room.' },
        { text: 'Beat Susumu in the King of Steps final', done: s => chOf(s) >= 5, target,
          get why() { return 'The champion is scared of losing his title. Beat him anyway: he’ll be glad of a rival.' + (G ? nextWhen(G.state) : ''); }, hint: '{mimo} points at the dance machine.' },
      ],
      story: [
        { when: s => !!dn(s).met, text: 'Susumu, nine, knows every manga fact, and he’s the champion of «ヤジルシ★フィーバー», a dance machine that calls the steps in words.' },
        { when: s => chOf(s) >= 1, text: 'Manga reads right to left; a panel is a コマ, a speech balloon a 吹き出し.' },
        { when: s => chOf(s) >= 5, text: 'You beat Susumu in the King of Steps final. He cried a little, then laughed: at last, a rival. {mimo} wears his medal.' },
      ],
    };
  }

  // ============================================================ checks, tests, the game side
  function sources() {
    const out = [];
    for (const ch of CHAPTERS) { out.push(ch.title); ch.facts.forEach(f => out.push(f.ja)); ch.quiz.forEach(q => (q.want || []).forEach(w => out.push(w))); }
    for (const v of Object.values(LT)) out.push(...v.ja);
    for (const p of PHRASES) out.push(p.ja, ...(p.alt || []));
    for (const it of ITEMS) out.push(it.ja);
    for (const tk of TRACKS) out.push(tk.title);
    out.push(...Object.values(WORD), '[反対|はんたい]', '[回|かい]', 'まめちしき', 'クイズ', 'パーフェクト', 'グレート', 'グッド', 'ミス', 'フルコンボ ！', 'コンボ', 'ひだり', 'みぎ', 'うえ', 'した',
      'せいかい ！', 'ブブー ！ ちがう よ 。', '[勝負|しょうぶ] だ ！', '[右|みぎ] と [左|ひだり] だけ ！', '[上手|じょうず] ！', 'だいじょうぶ 、 すぐ [上手|じょうず] に なる よ 。', 'もう [一回|いっかい] ！', 'くやしい ！', 'ぼく の [勝|か]ち ！', '[天才|てんさい] ！', 'すごい ！', '{mimo} 、 [上手|じょうず] ！');
    return out;
  }
  function cjCheck() {
    const bad = [];
    if (typeof CJK === 'undefined') return bad;
    for (const s of sources()) { const p = CJK.validate(s, 'ja'); if (p.length) bad.push({ where: 'dance', src: s, problems: p }); }
    // every call pattern's model answer parses back to its steps
    for (let lv = 2; lv <= 5; lv++) for (let i = 0; i < 2; i++) { const st = callPattern(lv, i), p = parseCall(JP(callText(st))); if (p.steps.join('') !== st.join('')) bad.push({ where: 'call', src: callText(st), problems: ['parses as ' + p.steps.join('')] }); }
    return bad;
  }
  const TESTS = (() => {
    const g = () => window.__g, tick = (ms = 0) => new Promise(r => setTimeout(r, ms));
    const go = async s => { await g().go(s); await tick(); };
    // one step of whatever the machine's panel wants (ANIME._.t.drive calls this while DANCE.busy): right answers, perfect-ish dancing
    async function step(o = {}) {
      const R = RUN; if (!R || !panelOpen()) { if (RUN === null && !panelOpen()) return null; await go(0.1); return '…'; }
      if (typeof STORY !== 'undefined' && STORY.line && !(R.answer || R.wake || R.pick || R.kind === 'dance')) return null;     // (a line is up: the driver presses E)
      if (R.kind === 'facts' || R.kind === 'results') { if (R.wake) { R.wake({}); await go(0.05); return R.kind; } await go(0.05); return '…'; }
      if (R.kind === 'quiz') { const q = R.q; if (q.opts && R.pick) { R.pick(o.wrong ? (q.right + 1) % q.opts.length : q.right); await go(0.1); return 'quiz: ' + q.opts[q.right]; } if (R.answer) { R.answer(q.want[0]); await go(0.1); return 'quiz: ' + JP(q.want[0]); } await go(0.1); return '…'; }
      if (R.kind === 'declare' && R.answer) { const p = PHRASES.find(x => x.id === R.id); R.answer(p.ja); await go(0.1); return 'say: ' + JP(p.ja); }
      if (R.kind === 'call' && R.answer) { const t = JP(callText(R.steps)); R.answer(o.callRoman ? CJK.roman(callText(R.steps), { lang: 'ja' }) : t); await go(0.1); return 'call: ' + t; }
      if (R.kind === 'dance') { if (R.auto === undefined) R.auto = o.danceAuto === undefined ? 0.97 : o.danceAuto; await go(o.danceStep || 0.3); return '…'; }
      await go(0.1); return '…';
    }
    return { step, parseCall, callText, callPattern, chartFor };
  })();
  function init(game) {
    G = game;
    registerLines(); registerItems(); registerTracks();
    try { if (typeof CJK !== 'undefined') { CJK.addSource(sources(), 'ja'); if (CJK.addNames) CJK.addNames(['ススム', 'オトハ']); } } catch (e) { console.error('[dance]', e); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'dance')) QUESTS.LIST.push(quest());
  }
  return {
    init, arrive, talk, machine,
    update(dt, t) {
      if (RUN && RUN.tick) { try { RUN.tick(dt); } catch (e) { console.error('[dance]', e); RUN.tick = null; } }
      const su = suSt();
      if (su && RUN && RUN.kind === 'dance' && RUN.foe) {
        const pos = A().MUSIC.now(); su.forcePose = true; su.pose = 'dance'; su.beat = pos >= 0 ? (pos % 4) / 4 : 0;
        const nx = RUN.notes.find(n => n.t >= pos - 1); su.dir = nx ? (nx.need === 'J' ? 'U' : nx.need) : 'L';
      }
      if (OTO && OTO.k.root.visible) { const R = OTO.k.root.parent; OTO.st.talk = damp(OTO.st.talk || 0, OTO.st.talking ? 1 : 0, 10, dt); A().animateKid(OTO.k, Object.assign({}, OTO.st, { x: OTO.st.x - R.position.x, y: 0, z: OTO.st.z - R.position.z, pose: OTO.st.talking ? 'talk' : 'idle' }), dt, t); }
    },
    outdoor() { if (G && G.state && G.state.dance && G.state.dance.medal) { const m = medal(); if (m) m.visible = medalOn(); } else if (MEDAL) MEDAL.visible = false; },
    get busy() { return panelOpen(); },
    medalOn,
    _: { CHAPTERS, TRACKS, LT, PHRASES, chartFor, callsFor, parseCall, callPattern, callText, sources, cjCheck, dance, chapter, final, battle, callRound, declare, quizRound, factsRound, S: () => S(),
      get RUN() { return RUN; }, get PANEL() { return PANEL; }, t: TESTS },
  };
})();
