'use strict';
// Natsu (ナツ), the summer-festival kid, and Alba's 夏祭り (game/SIDES.md: the festival with a kid host). Japanese games only.
// The user: "both of these should have their own unique and extensive side plots that give plenty of rich side content to
// people replaying the game in a new language" (SIDES.md, full parity for every language).
//
// WHO: ナツ (Natsu, 9): «I was born in summer (夏, なつ), so I'm Natsu». Festival-crazy, loud, bossy, kind. Two short pigtails
//   with red-and-white ribbons, a fox mask (きつね の お面) pushed to the side of her head, an indigo happi coat with 祭 on
//   the back. Her grandpa テツ (Tetsu) is a taiko master whose drum the Hush has silenced. Original characters.
// WHERE: the shared festival-kid spot by the bell tower's north-east side (−22.5, −169.1): her practice bucket-drum, a
//   lantern pole with a wind chime (風鈴), her festival poster (readable). The festival itself is in the plaza (the shared
//   festival spot): the yatai stalls ring the plaza's edge, the yagura stands over the fountain, the dance circles it.
//   All of it is built only while one of her scenes plays (and the lantern lines stay after the festival night).
// CHAPTERS (gated like every side character: Rosa's welcome, the big Hushling on the hill, bells 1, 2, 3):
//   1 屋台 the stalls: 〜 を ください, counting with つ / 個 / 本, the かき氷 flag (氷), flavors, いくら ですか; read the signs
//   2 お祭りのあそび: 金魚すくい (scoop, then count with 匹; おまけ), ヨーヨー釣り (colors + とって), 射的 (cork gun: aim by
//     上 / 真ん中 / 下 and 右 / 左), くじ引き (read the ticket: 二等; あたり / はずれ)
//   3 浴衣と盆踊り: dress {mimo} in a yukata (着て · 帯をしめて · げたをはいて · うちわを持って; left over right), then the
//     bon-odori by call, TPR style: first you do what Natsu calls, then you call it (手を上げて 右へ 左へ 回って 手をたたいて)
//   4 太鼓: Grandpa Tetsu and 口唱歌 (kuchi-shōga, the drum's spoken syllables ドン カッ ドドン ドコ): say back his
//     patterns, read one off his paper, shout the かけ声 (ソーレ ハッ よいしょ) in the rests; his drum's voice comes back
//   5 夏祭りの夜: the festival night; the Hush puts out the lanterns and freezes the dancers and the drum. You lead the
//     bon-odori and call the taiko for Natsu on the yagura, everyone shouts ソーレ; fireworks (たまやー！ かぎやー！);
//     then 線香花火, the quiet sparklers, named stage by stage (牡丹 松葉 柳 散り菊). Natsu's fox mask for {mimo}.
// Rewards: Phrasebook entries (ph.mt.*), {mimo}'s yukata (chapter 3) and fox mask (chapter 5), key items (金魚 in a bag,
//   でんでん太鼓, Tetsu's spare ばち), coins.
// Songs (Sound.addSong): 'ja_matsuri' «アルバ囃子» (matsuri-bayashi over a funk band) and 'ja_ondo' «アルバ音頭» (the dance).
// API: MATSURI.init(game) · .build(scene, env) → { colliders, group, people, update } · .update(dt, t, you) · .hatOn()
//   (main.js: the straw hat steps aside for the fox mask) · .mapMark(dpr) (minimap.js) · .quest() · .busy · ._ (tests: ._.t)
// State: G.state.mt. Uses zhfolk.js (ZHF) for its 3D kit, the person rig, the paper overlay and the music deck.

const MATSURI = (() => {
  let G = null;
  const L = () => (G && G.state && G.state.lang) || 'es';
  const isOn = () => L() === 'ja';
  const shown = () => !!(G && G.state && G.state.lang === 'ja' && G.state.flags && G.state.flags.hatched);
  const flags = () => (G && G.state && G.state.flags) || {};
  const cj = () => typeof CJK !== 'undefined';
  const cmode = () => (cj() ? CJK.mode('ja') : 'roman');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // the notation (CJK.md) → HTML / plain text in the mode / rōmaji / characters
  const J = (src, o) => (cj() ? CJK.html(String(src), Object.assign({ lang: 'ja' }, o || {})) : esc(src));
  const JP = (src, o) => (cj() ? CJK.plain(String(src), Object.assign({ lang: 'ja' }, o || {})) : String(src));
  const JR = src => (cj() ? CJK.roman(String(src), { lang: 'ja' }) : String(src));
  const JC = src => JP(src, { mode: 'chars' });
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const wait = s => (typeof STORY !== 'undefined' && STORY.wait ? STORY.wait(s) : new Promise(r => setTimeout(r, s * 1000)));
  const sfx = (n, ...a) => { try { Sound.play(n, ...a); } catch (e) { /* no audio yet */ } };
  const FONT = '"Yu Gothic UI", "Yu Gothic", "Meiryo", "Hiragino Kaku Gothic ProN", "Noto Sans CJK JP", sans-serif';
  const BRUSH = '"Yu Mincho", "YuMincho", "Hiragino Mincho ProN", "MS Mincho", "Noto Serif CJK JP", serif';
  const S = () => {
    const s = G.state; if (!s.mt) s.mt = {};
    const o = s.mt; o.ch = o.ch || {}; o.grade = o.grade || {}; o.seen = o.seen || {};
    return o;
  };
  const sayVoice = src => { try { if (typeof UI !== 'undefined' && UI.speak) UI.speak(src); else Sound.say(JC(src), 'ja'); } catch (e) { /* no voice */ } };

  // ================================================================ typed answers (CJK.typed / wordOf / matchAt, as LEX.heard does)
  // numbers said with a counter: what a learner may type as digits or kanji (2つ, 二つ, 8個, 3本, 4匹, 2等, 400円) → the kana
  const NUMK = {
    tsu: ['', 'ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'],
    ko: ['', 'いっこ', 'にこ', 'さんこ', 'よんこ', 'ごこ', 'ろっこ', 'ななこ', 'はっこ', 'きゅうこ', 'じゅっこ'],
    hon: ['', 'いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', 'ななほん', 'はっぽん', 'きゅうほん', 'じゅっぽん'],
    hiki: ['', 'いっぴき', 'にひき', 'さんびき', 'よんひき', 'ごひき', 'ろっぴき', 'ななひき', 'はっぴき', 'きゅうひき', 'じゅっぴき'],
    tou: ['', 'いっとう', 'にとう', 'さんとう', 'よんとう', 'ごとう'],
  };
  const HYAKU = ['', 'ひゃく', 'にひゃく', 'さんびゃく', 'よんひゃく', 'ごひゃく', 'ろっぴゃく', 'ななひゃく', 'はっぴゃく', 'きゅうひゃく'];
  const yenKana = n => (n % 100 === 0 && n >= 100 && n < 1000 ? HYAKU[n / 100] : n === 50 ? 'ごじゅう' : n === 150 ? 'ひゃくごじゅう' : n === 250 ? 'にひゃくごじゅう' : null);
  const CNT = [['tsu', 'つ'], ['ko', '個|こ'], ['hon', '本|ほん|ぽん|ぼん'], ['hiki', '匹|ひき|ぴき|びき'], ['tou', '等|とう']];
  const KNUM = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9, 十: 10 };
  // → { text, digits (a number was typed as a digit or kanji: fine when written, but say it aloud next time) }
  function norm(text) {
    let s = String(text == null ? '' : text).normalize('NFKC').replace(/下さい/g, 'ください').replace(/　/g, ' ');
    let digits = false;
    for (const [k, re] of CNT) {
      s = s.replace(new RegExp(`([0-9]+|[一二三四五六七八九十])\\s*(?:${re})`, 'g'), (m, n) => { const v = KNUM[n] || +n, r = NUMK[k][v]; if (!r) return m; digits = true; return r; });
    }
    s = s.replace(/([0-9]{2,4})\s*(?:円|えん)/g, (m, n) => { const r = yenKana(+n); if (!r) return m; digits = true; return r + 'えん'; });
    return { text: s, digits };
  }
  // does the typed text say this word (notation) at or after unit p? → { i, j, short } or null
  function findWord(U, src, p = 0) {
    const w = CJK.wordOf(src, 'ja'); if (!w.segs || !w.segs.length) return null;
    for (let i = p; i < U.length; i++) { const m = CJK.matchAt(w, U, i, 'ja'); if (m) return { i, j: m.j, short: !!m.short }; }
    return null;
  }
  const PUNCT = /^[「」『』。、！？…・〜ー\-—,.!?～]+$/;
  const SOFT = /^(を|は|が|ね|よ|わ|って)$/;
  // the words that must be said, in order: the notation's tokens without punctuation, the slots and the soft particles
  const partsOf = src => String(src).split(' ').map(t => t.replace(/\*/g, '')).filter(t => t && !PUNCT.test(t) && !/^\{.*\}$/.test(t) && !SOFT.test(t));
  // the typed text says these words in this order (anything else in between is fine)
  function saysSeq(U, parts) {
    let p = 0, short = false;
    for (const part of parts) { const m = findWord(U, part, p); if (!m) return null; p = m.j; short = short || m.short; }
    return { short };
  }
  // one of these answers (notation)? → { k (its index), exact (word for word), short, digits } or null
  function heardAny(text, list) {
    if (!cj()) return null;
    const n = norm(text), U = CJK.typed(n.text, 'ja').U;
    if (!U.length) return null;
    for (let k = 0; k < list.length; k++) {
      const c = list[k]; if (!c) continue;
      if (CJK.same(n.text, c, 'ja')) return { k, exact: true, short: false, digits: n.digits };
      const ps = partsOf(c); if (!ps.length) continue;
      const m = saysSeq(U, ps); if (m) return { k, exact: false, short: m.short, digits: n.digits };
    }
    return null;
  }
  // the drum's spoken syllables (口唱歌) and the shouts: compared as rōmaji, a trailing っ («kat», «hat») dropped
  // (カッ before another syllable doubles its consonant in rōmaji, «kaddon»; nobody types that: «ka don» is the same call)
  const drumKey = s => (cj() ? CJK.canon(norm(s).text, 'ja') : String(s).toLowerCase()).replace(/t(?![aeiou]|s)/g, '').replace(/([bcdfghjkmnpqrstvwxyz])\1/g, '$1');
  const idk = t => /^\s*(\?+|？+|idk|i\s*don.?t\s*know|わからない|wakaranai|しらない|shiranai)\s*$/i.test(String(t || ''));
  // a hint in the mode: rōmaji letters or characters, the rest as dots / blanks (n: 1 … 3)
  function hintOf(src, n) {
    if (cmode() === 'roman') { const s = JR(src); let k = 0; return s.split('').map(c => (/[a-zāīūēō]/i.test(c) ? (k++ === 0 || n >= 3 || (n >= 2 && k % 2) ? c : '·') : c)).join(''); }
    return [...JC(src)].map((c, i) => (i === 0 || n >= 3 || (n >= 2 && i % 2 === 0) || /[、。！？「」]/.test(c) ? c : '＿')).join('');
  }

  // ================================================================ who's who (CJK.md's names table has them all)
  const NAMES = { kid: 'ナツ', gp: 'テツ さん', tako: 'たこ[焼|や]き[屋|や] さん', soba: '[焼|や]きそば[屋|や] さん', kori: 'かき[氷|ごおり][屋|や] さん', wata: '[綿|わた]あめ[屋|や] さん',
    kin: '[金魚|きんぎょ]すくい[屋|や] さん', yoyo: 'ヨーヨー[釣|つ]り[屋|や] さん', sha: '[射的|しゃてき][屋|や] さん', kuji: 'くじ[引|び]き[屋|や] さん' };

  // ================================================================ the stalls (屋台): their signs, what they sell, how you order
  // sign: what the stall's banner says (characters, as on a real stall); sub: the small print. The plaza ring (r 11.2,
  // facing the fountain, between the benches and the lamps): the food stalls on the south-east arc, the games on the
  // north-west (clear of the streets, the planters and the big trees)
  const STALLS = [
    { id: 'tako', ang: 21, sign: 'たこ[焼|や]き', subs: ['8 こ', '400 [円|えん]'], en: 'takoyaki (octopus balls)', awn: '#e0503f', cloth: '#fff4e4', keeper: 'tako' },
    { id: 'soba', ang: 31, sign: '[焼|や]きそば', subs: ['300 [円|えん]'], en: 'yakisoba (fried noodles)', awn: '#2f6fb5', cloth: '#fff4e4', keeper: 'soba' },
    { id: 'kori', ang: 59, sign: 'かき[氷|ごおり]', subs: ['いちご', 'メロン', 'レモン', 'ブルーハワイ'], en: 'kakigōri (shaved ice), and ramune', awn: '#3fa7d6', cloth: '#ffffff', keeper: 'kori' },
    { id: 'wata', ang: 69, sign: '[綿|わた]あめ', subs: ['[一本|いっぽん]', '200 [円|えん]'], en: 'wataame (cotton candy)', awn: '#ff8cc6', cloth: '#fff4fa', keeper: 'wata' },
    { id: 'kin', ang: 239, sign: '[金魚|きんぎょ]すくい', subs: ['[一回|いっかい]', '300 [円|えん]'], en: 'goldfish scooping', awn: '#e86a2a', cloth: '#fff4e4', keeper: 'kin', game: true },
    { id: 'yoyo', ang: 212, sign: 'ヨーヨー[釣|つ]り', subs: ['[一回|いっかい]', '200 [円|えん]'], en: 'water yo-yo fishing', awn: '#8a5ab0', cloth: '#fff4fa', keeper: 'yoyo', game: true },
    { id: 'sha', ang: 250, sign: '[射的|しゃてき]', subs: ['コルク'], en: 'the shooting gallery (cork guns)', awn: '#4f9a5a', cloth: '#fff4e4', keeper: 'sha', game: true },
    { id: 'kuji', ang: 201, sign: 'くじ[引|び]き', subs: ['[一等|いっとう]', '[二等|にとう]', '[三等|さんとう]'], en: 'the lottery', awn: '#d9a03a', cloth: '#fff4e4', keeper: 'kuji', game: true },
  ];
  const STALL = Object.fromEntries(STALLS.map(s => [s.id, s]));
  // the shaved-ice flavors (and the syrup's color); yo-yo colors; the shooting gallery's shelf (row, column)
  const FLAVORS = [
    { id: 'ichigo', ja: 'いちご', en: 'strawberry', col: '#e0304a' }, { id: 'melon', ja: 'メロン', en: 'melon', col: '#4cc25a' },
    { id: 'lemon', ja: 'レモン', en: 'lemon', col: '#ffd23f' }, { id: 'blue', ja: 'ブルーハワイ', en: 'Blue Hawaii (a sweet blue syrup)', col: '#2f8fe8' },
  ];
  const YOYO = [
    { id: 'pink', ja: 'ピンク の', alts: ['ピンク'], en: 'pink', col: '#ff8cc6' }, { id: 'red', ja: '[赤|あか]い', alts: ['[赤|あか] の', '[赤|あか]'], en: 'red', col: '#e0372c' },
    { id: 'blue', ja: '[青|あお]い', alts: ['[青|あお] の', '[青|あお]'], en: 'blue', col: '#3f7fc9' }, { id: 'yellow', ja: '[黄色|きいろ]い', alts: ['[黄色|きいろ] の', '[黄色|きいろ]'], en: 'yellow', col: '#ffd23f' },
    { id: 'green', ja: '[緑|みどり] の', alts: ['[緑|みどり]'], en: 'green', col: '#4f9a5a' }, { id: 'white', ja: '[白|しろ]い', alts: ['[白|しろ] の', '[白|しろ]'], en: 'white', col: '#fffaf2' },
  ];
  const ROWS = [{ ja: '[上|うえ]', en: 'top' }, { ja: '[真|ま]ん[中|なか]', en: 'middle' }, { ja: '[下|した]', en: 'bottom' }];
  const COLS = [{ ja: '[左|ひだり]', en: 'left' }, { ja: '[真|ま]ん[中|なか]', en: 'middle' }, { ja: '[右|みぎ]', en: 'right' }];
  const PRIZES = [
    [{ ja: 'キャラメル', en: 'a box of caramels', col: '#e8c35a' }, { ja: '[風車|かざぐるま]', en: 'a pinwheel', col: '#ff6b8a' }, { ja: 'ロボット', en: 'a tin robot', col: '#9aa4b5' }],
    [{ ja: 'けん[玉|だま]', en: 'a kendama', col: '#d6332a' }, { ja: 'くま の ぬいぐるみ', en: 'a teddy bear', col: '#b07a4a' }, { ja: 'シャボン[玉|だま]', en: 'bubbles', col: '#7fd6ef' }],
    [{ ja: 'ラムネ', en: 'a ramune', col: '#7fcfe8' }, { ja: 'おめん', en: 'a mask', col: '#fffaf0' }, { ja: 'ガム', en: 'gum', col: '#8fe08a' }],
  ];
  // which shelf a typed «上の右» means: { r, c } (真ん中 alone: the middle of the middle) or null
  function aimOf(text) {
    if (!cj()) return null;
    const U = CJK.typed(norm(text).text, 'ja').U, at = src => { const out = []; let p = 0, m; while ((m = findWord(U, src, p))) { out.push(m.i); p = m.j; } return out; };
    const up = at('[上|うえ]'), dn = at('[下|した]'), mid = at('[真|ま]ん[中|なか]'), lf = at('[左|ひだり]'), rt = at('[右|みぎ]');
    let r = up.length ? 0 : dn.length ? 2 : -1, c = lf.length ? 0 : rt.length ? 2 : -1, m = mid.length;
    if (r < 0 && m) { r = 1; m--; }
    if (c < 0 && m) { c = 1; m--; }
    if (c < 0 && r === 1 && mid.length === 1) c = 1;          // (真ん中 alone: the very middle)
    if (r < 0 || c < 0) return null;
    return { r, c };
  }
  // the lottery's tickets
  const KUJI = [{ id: 'nito', ja: '[二等|にとう]', en: 'second prize', win: true }, { id: 'hazure', ja: 'はずれ', en: 'a miss (no prize)', win: false }];

  // ================================================================ chapter 3: the yukata, and the bon-odori's steps
  const DRESS = [
    { id: 'kiru', src: '[浴衣|ゆかた] を [着|き]て ！', alts: ['[浴衣|ゆかた] [着|き]て ！', '[着|き]て ！'], en: 'Put on the yukata!', note: '着る (kiru): to put on clothes worn on the body', icon: '👘' },
    { id: 'obi', src: '[帯|おび] を しめて ！', alts: ['[帯|おび] しめて ！', 'しめて ！'], en: 'Tie the obi (the sash)!', note: 'しめる (shimeru): to tie on a belt or an obi', icon: '🎀' },
    { id: 'geta', src: 'げた を はいて ！', alts: ['げた はいて ！', 'はいて ！'], en: 'Put on the geta (wooden sandals)!', note: 'はく (haku): for things on your legs and feet: shoes, socks, trousers', icon: '🩴' },
    { id: 'uchiwa', src: 'うちわ を [持|も]って ！', alts: ['うちわ [持|も]って ！', '[持|も]って ！'], en: 'Hold the fan (uchiwa)!', note: '持つ (motsu): to hold, to carry', icon: '🪭' },
  ];
  const MOVES = [
    { id: 'up', src: '[手|て] を [上|あ]げて ！', alts: ['[手|て] [上|あ]げて ！', '[上|あ]げて ！'], en: 'Raise your hands!', icon: '🙌', key: 'ArrowUp' },
    { id: 'right', src: '[右|みぎ] へ ！', alts: ['[右|みぎ] に ！', '[右|みぎ] ！'], en: 'To the right!', icon: '➡', key: 'ArrowRight' },
    { id: 'left', src: '[左|ひだり] へ ！', alts: ['[左|ひだり] に ！', '[左|ひだり] ！'], en: 'To the left!', icon: '⬅', key: 'ArrowLeft' },
    { id: 'turn', src: '[回|まわ]って ！', alts: ['くるっと [回|まわ]って ！'], en: 'Turn around!', icon: '🔄', key: 'ArrowDown' },
    { id: 'clap', src: '[手|て] を たたいて ！', alts: ['[手|て] たたいて ！', 'たたいて ！'], en: 'Clap your hands!', icon: '👏', key: 'Space' },
  ];

  // ================================================================ chapter 4: the drum's spoken syllables (口唱歌) and the shouts (かけ声)
  const SYL = { 'ドン': 'a strong hit in the middle of the drum', 'カッ': 'a hit on the wooden rim', 'ドドン': 'a quick hit, then a strong one', 'ドコ': 'two light hits, quick' };
  const ECHO = ['ドン ドン カッ', 'ドン カッ ドン カッ', 'ドドン ドン', 'ドコ ドコ ドン', 'ドン ドン カッ カッ ドドン'];
  const SCORE = 'ドン カッ ドコ ドン';
  const KAKE = [{ pat: 'ドン ドン ドドン', shout: 'ソーレ ！', en: 'Sōre! (here we go!)' }, { pat: 'ドコ ドコ ドン', shout: 'ハッ ！', en: 'Ha!' }, { pat: 'ドン カッ ドン', shout: 'よいしょ ！', en: 'Yoisho! (heave!)' }];
  const NIGHT_PATS = ['ドン ドン カッ', 'ドドン ドドン', 'ドコ ドコ ドン', 'ドン カッ ドン ドン'];
  // a pattern → its hits on a grid of eighths: ドン 1, カッ 1, ドドン 2 (a 16th pickup), ドコ 1 (two sixteenths)
  function hitsOf(pat) {
    const out = []; let at = 0;
    for (const s of String(pat).split(' ')) {
      if (s === 'ドン') { out.push({ at, k: 'don' }); at += 2; }
      else if (s === 'カッ') { out.push({ at, k: 'ka' }); at += 2; }
      else if (s === 'ドドン') { out.push({ at, k: 'do' }, { at: at + 1, k: 'don' }); at += 2; }
      else if (s === 'ドコ') { out.push({ at, k: 'do' }, { at: at + 1, k: 'ko' }); at += 2; }
      else at += 2;
    }
    return { hits: out, len: at };
  }

  // ================================================================ chapter 5: the night's calls, the fireworks, the sparkler's stages
  const SHOUTS = [{ src: 'たまやー ！', alts: ['たまや ！'], en: 'Tamayā!' }, { src: 'かぎやー ！', alts: ['かぎや ！'], en: 'Kagiyā!' }];
  const SENKO = [
    { id: 'tsubomi', ja: '[蕾|つぼみ]', en: 'the bud: a little fire ball swells at the tip' },
    { id: 'botan', ja: '[牡丹|ぼたん]', en: 'peony: the ball starts to crackle and spit' },
    { id: 'matsuba', ja: '[松葉|まつば]', en: 'pine needles: sparks burst out in every direction' },
    { id: 'yanagi', ja: '[柳|やなぎ]', en: 'willow: long, soft sparks droop down' },
    { id: 'chirigiku', ja: '[散|ち]り[菊|ぎく]', en: 'falling chrysanthemum: the last few petals fall' },
  ];

  // ================================================================ the Phrasebook (LEX kind 'phrase'; ja) and key items
  const R_MT = 'Summer festival (夏祭り)';
  const PH = [
    { id: 'ph.mt.kudasai', ja: 'たこ[焼|や]き を ください 。', alt: ['たこ[焼|や]き ください 。'], en: 'Takoyaki, please.', note: '〜を ください: “please give me 〜”. At a stall the を often drops: たこ焼き ください.', sit: 'You’re at the takoyaki stall. Ask for takoyaki!' },
    { id: 'ph.mt.futatsu', ja: 'ふたつ ください 。', alt: ['ふたつ お[願|ねが]い します 。'], en: 'Two, please.', note: 'ひとつ ふたつ みっつ よっつ いつつ: the counting words that work for almost anything.', sit: 'The keeper asks how many. You want two!' },
    { id: 'ph.mt.ikura', ja: 'いくら です か ？', alt: ['いくら ？'], en: 'How much is it?', note: 'The answer comes in 円 (yen): ひゃく えん, にひゃく えん, さんびゃく えん…', sit: 'There’s no price on the sign. Ask how much it is!' },
    { id: 'ph.mt.oishii', ja: 'おいしい ！', en: 'Yummy! / Delicious!', note: 'Say it the moment you take a bite: the cook will love it.', sit: 'You bite into hot yakisoba. Tell the keeper how it tastes!' },
    { id: 'ph.mt.atsu', ja: 'あつっ ！', alt: ['あつい ！'], en: 'Hot!', note: 'あつい = hot; あつっ! is the yelp when takoyaki burns your tongue.', sit: 'You popped a whole takoyaki in your mouth. Yelp!' },
    { id: 'ph.mt.kiin', ja: '[頭|あたま] が キーン と する ！', alt: ['キーン ！'], en: 'Brain freeze!', note: 'キーン is the sound of a brain freeze. Every kid says it eating かき氷 too fast.', sit: 'You ate the shaved ice way too fast. Your head…!' },
    { id: 'ph.mt.atari', ja: 'あたり ！', en: 'A winner!', note: 'あたり: a hit, a winning ticket. Its opposite is はずれ, a miss.', sit: 'Your lottery ticket wins a prize. Shout it!' },
    { id: 'ph.mt.omake', ja: 'おまけ', en: 'a little extra, a freebie', note: 'Scoop no goldfish and the keeper gives you one anyway: おまけ!', sit: 'The keeper gives you something extra for free. What’s that called?' },
    { id: 'ph.mt.mouikkai', ja: 'もう [一回|いっかい] ！', en: 'One more time!', note: '一回 (いっかい) = one time. もう = more. For games, rides, songs…', sit: 'The poi tore. You want another go!' },
    { id: 'ph.mt.niau', ja: '[似合|にあ]う ！', alt: ['[似合|にあ]う ね ！'], en: 'It suits you!', note: 'When someone wears something nice: その浴衣、似合う！', sit: 'Natsu shows off her new yukata. Compliment it!' },
    { id: 'ph.mt.odorou', ja: '[踊|おど]ろう ！', alt: ['いっしょ に [踊|おど]ろう ！'], en: 'Let’s dance!', note: '踊ろう: “let’s dance”, from 踊る (to dance).', sit: 'The bon-odori music starts. Ask Natsu to dance!' },
    { id: 'ph.mt.sore', ja: 'ソーレ ！', alt: ['それ ！'], en: 'Here we go! (a festival shout)', note: 'A かけ声: shouted to keep the rhythm and the spirit up, by drummers, dancers and the crowd.', sit: 'Grandpa Tetsu hits the drum and everyone shouts…?' },
    { id: 'ph.mt.yoisho', ja: 'よいしょ ！', en: 'Heave! / Hup!', note: 'Said when you lift something heavy, and as a shout in festival songs.', sit: 'You lift the heavy drum onto the yagura. Say it!' },
    { id: 'ph.mt.tamaya', ja: 'たまやー ！', alt: ['たまや ！'], en: 'Tamaya! (shouted at fireworks)', note: 'Tamaya and Kagiya were the great fireworks makers of old Edo (Tokyo). People still shout their names when fireworks burst.', sit: 'A huge firework blooms over the plaza. Shout!' },
    { id: 'ph.mt.kagiya', ja: 'かぎやー ！', alt: ['かぎや ！'], en: 'Kagiya! (shouted at fireworks)', note: 'The other shout. Kagiya was the older of the two fireworks houses.', sit: 'Another firework! Shout the other name!' },
    { id: 'ph.mt.mata', ja: 'また [来年|らいねん] ！', en: 'See you next year!', note: 'How a festival ends: until next summer!', sit: 'The festival is over. Say goodbye till next summer!' },
  ];
  PH.forEach(p => { p.region = R_MT; p.register = 'casual'; p.icon = 'mtFan'; });
  const PHI = Object.fromEntries(PH.map(p => [p.id, p]));
  const ITEMS = [
    { id: 'k.mtFish', kind: 'key', ja: '[金魚|きんぎょ]', en: 'a goldfish in a bag (from the festival)', icon: 'mtFish' },
    { id: 'k.mtDenden', kind: 'key', ja: 'でんでん[太鼓|だいこ]', en: 'a den-den drum (the lottery’s second prize)', icon: 'mtDenden' },
    { id: 'k.mtBachi', kind: 'key', ja: 'ばち', en: 'Grandpa Tetsu’s spare drumsticks', icon: 'mtBachi' },
  ];

  // ================================================================ what they say (CJK.md notation). Natsu is 9: casual. The grown-ups
  // talk to you politely (Tetsu: polite, an old man's warmth). Nobody ever genders you; nobody calls you anything but "you".
  const T2 = (ja, en) => ({ ja: [ja], en: [en] });
  const LT = {
    // meeting her
    'mt.drum': T2('ドン ！ ドン ！ カッ ！ … ドン ！', 'Don! Don! Ka!… Don!'),
    'mt.hi': T2('あ 、 こんにちは ！ わたし 、 ナツ ！', 'Oh, hi! I’m Natsu!'),
    'mt.name': T2('[夏|なつ] に [生|う]まれた から 、 ナツ 。 [夏|なつ] が [大好|だいす]き ！', 'I was born in summer, so I’m Natsu (it means “summer”). I love summer!'),
    'mt.love': T2('でも 、 いちばん [好|す]き な の は … お[祭|まつ]り ！', 'But what I love most of all is… festivals!'),
    'mt.quiet': T2('[町|まち] が [静|しず]か に なって 、 [今年|ことし] は お[祭|まつ]り が ない ん だって 。', 'The town’s gone quiet, and they say there’s no festival this year.'),
    'mt.plan': T2('だから 、 わたし が やる ！ アルバ の [夏祭|なつまつ]り ！', 'So I’ll do it myself! Alba’s summer festival!'),
    'mt.list': T2('[屋台|やたい] ！ [盆踊|ぼんおど]り ！ [太鼓|たいこ] ！ [花火|はなび] ！ ぜんぶ やる ！', 'Food stalls! Bon-odori! Taiko! Fireworks! All of it!'),
    'mt.help': T2('ねえ 、 [手伝|てつだ]って くれる ？', 'Hey, will you help me?'),
    'mt.yay': T2('やった ！ まず は 、 [屋台|やたい] の [練習|れんしゅう] ！', 'Yay! First up: practice at the food stalls!'),
    'mt.wait': T2('まだ [準備中|じゅんびちゅう] ！ また [後|あと] で [来|き]て ね 。', 'Still getting ready! Come back later, OK?'),
    // chapter 1: the stalls
    'mt.c1.a': T2('お[祭|まつ]り と いえば 、 [屋台|やたい] ！ [町|まち] の みんな が 、 [練習|れんしゅう] で [屋台|やたい] を [出|だ]して くれた の 。', 'Festivals mean food stalls! Everyone in town set up stalls so we can practice.'),
    'mt.c1.b': T2('[注文|ちゅうもん] は かんたん 。 「 〜 を ください 」 だ よ 。', 'Ordering is easy: «… o kudasai», “… please”.'),
    'mt.c1.c': T2('[数|かず] も [言|い]って ね 。 ひとつ 、 ふたつ 、 みっつ ！', 'Say how many, too. One, two, three!'),
    'mt.c1.go': T2('まず は 、 たこ[焼|や]き ！', 'Takoyaki first!'),
    'mt.tako.hi': T2('いらっしゃい ！ [焼|や]きたて だ よ ！', 'Welcome! Fresh off the griddle!'),
    'mt.tako.give': T2('はい 、 たこ[焼|や]き ふたつ ！ あつい から 、 [気|き] を つけて ね 。', 'Here you go, two takoyaki! They’re hot, so be careful.'),
    'mt.soba.hi': T2('いらっしゃい ！ ソース の いい におい でしょ ？', 'Welcome! Smell that sauce!'),
    'mt.soba.give': T2('はい 、 [焼|や]きそば みっつ 。 ソース たっぷり ！', 'Here, three yakisoba. Lots of sauce!'),
    'mt.kori.hi': T2('いらっしゃい ！ [何味|なにあじ] に する ？', 'Welcome! Which flavor?'),
    'mt.kori.give': T2('はい 、 どうぞ ！ [急|いそ]いで [食|た]べる と 、 [頭|あたま] が キーン と する よ 。', 'Here you go! Eat it too fast and your head goes «kiin»!'),
    'mt.kiin': T2('キーン ！ [頭|あたま] が キーン と する ！', 'Kiin! Brain freeze!'),
    'mt.wata.hi': T2('いらっしゃい ！ ふわふわ の [綿|わた]あめ だ よ 。', 'Welcome! Fluffy cotton candy here.'),
    'mt.wata.give': T2('はい 、 [綿|わた]あめ [一本|いっぽん] 。', 'Here: one cotton candy.'),
    'mt.ramune.give': T2('ラムネ [二本|にほん] ね 。 ビー[玉|だま] を [押|お]して 、 [開|あ]けて ね 。', 'Two ramune. Push the marble down to open it.'),
    'mt.c1.oishii': T2('おいしい ！ お[祭|まつ]り の [味|あじ] は 、 やっぱり さいこう ！', 'Yummy! Festival food really is the best!'),
    'mt.c1.end': T2('[注文|ちゅうもん] 、 じょうず ！ [次|つぎ] は 、 お[祭|まつ]り の あそび を [教|おし]える ね ！', 'You’re great at ordering! Next time I’ll show you the festival games!'),
    // chapter 2: the games
    'mt.c2.a': T2('[今日|きょう] は お[祭|まつ]り の あそび ！ [金魚|きんぎょ]すくい 、 ヨーヨー[釣|つ]り 、 [射的|しゃてき] 、 くじ[引|び]き ！', 'Today: festival games! Goldfish scooping, yo-yo fishing, the shooting gallery and the lottery!'),
    'mt.kin.hi': T2('いらっしゃい ！ はい 、 ポイ 。 [紙|かみ] だ から 、 [水|みず] の [中|なか] で やぶれる よ 。', 'Welcome! Here’s your poi. It’s paper, so it tears in the water.'),
    'mt.kin.tip': T2('そっと ね ！ [金魚|きんぎょ] が [輪|わ] の [中|なか] に [来|き]たら 、 すくって ！', 'Gently! When a goldfish swims into the ring, scoop!'),
    'mt.kin.count': T2('[何匹|なんびき] すくった ？', 'How many did you scoop?'),
    'mt.kin.zero': T2('ゼロ か 。 じゃあ 、 おまけ で [一匹|いっぴき] あげる よ 。', 'Zero, huh. Then here’s one as a freebie.'),
    'mt.kin.give': T2('[袋|ふくろ] に [入|い]れた よ 。 [大事|だいじ] に して ね 。', 'In the bag it goes. Take good care of it.'),
    'mt.c2.hiki': T2('[魚|さかな] は 「 [匹|ひき] 」 で [数|かぞ]える の 。 いっぴき 、 にひき 、 さんびき ！', 'You count fish with «hiki»: ippiki, nihiki, sanbiki!'),
    'mt.yoyo.hi': T2('[好|す]き な [色|いろ] を [釣|つ]って ね 。 [紙|かみ] の [糸|いと] が [切|き]れたら 、 おしまい ！', 'Fish out any color you like. When the paper string breaks, that’s it!'),
    'mt.yoyo.want': T2('わたし 、 ピンク の が ほしい ！', 'I want the pink one!'),
    'mt.yoyo.got': T2('とれた ！ ばしゃ 、 ばしゃ ！', 'Got it! Splash, splash!'),
    'mt.sha.hi': T2('コルク の てっぽう だ よ 。 [倒|たお]れたら 、 その [景品|けいひん] を あげる ！', 'It’s a cork gun. Knock a prize over and it’s yours!'),
    'mt.sha.how': T2('[上|うえ] 、 [真|ま]ん[中|なか] 、 [下|した] 。 [右|みぎ] 、 [左|ひだり] 。 どこ を ねらう か 、 [言|い]って ！', 'Top, middle, bottom. Right, left. Say where to aim!'),
    'mt.sha.hit': T2('あたり ！ よく ねらった ね 。', 'A hit! Nice aim.'),
    'mt.kuji.hi': T2('くじ[引|び]き 、 [一回|いっかい] [百円|ひゃくえん] ！ … [練習|れんしゅう] だ から 、 [今日|きょう] は ただ ！', 'The lottery: one go, a hundred yen! …It’s practice, so today it’s free!'),
    'mt.kuji.joke': T2('くじ の [一等|いっとう] は 、 ぜったい [出|で]ない ん だ よ 。', 'The first prize never, ever comes out, you know.'),
    'mt.kuji.win': T2('あたり ！ [二等|にとう] ！ でんでん[太鼓|だいこ] だ よ ！', 'A winner! Second prize: a den-den drum!'),
    'mt.kuji.wow': T2('すごい ！ ほんとう に あたった ！', 'Amazing! You really won!'),
    'mt.kuji.miss': T2('はずれ … 。 でも 、 あめ を もらった ！', 'A miss… But I got a candy!'),
    'mt.c2.end': T2('あー 、 [楽|たの]しかった ！ [次|つぎ] は 、 [浴衣|ゆかた] と [盆踊|ぼんおど]り ！', 'Ahh, that was fun! Next: yukata and bon-odori!'),
    // chapter 3: the yukata and the bon-odori
    'mt.c3.a': T2('[盆踊|ぼんおど]り の [前|まえ] に … じゃーん ！ {mimo} の [浴衣|ゆかた] ！', 'Before the bon-odori… ta-da! A yukata for {mimo}!'),
    'mt.c3.b': T2('{mimo} に [言|い]って 、 [着|き]せて あげて ！', 'Tell {mimo} what to do, and help it get dressed!'),
    'mt.c3.left': T2('[浴衣|ゆかた] は 、 [左|ひだり] が [上|うえ] ！ [右|みぎ] が [上|うえ] は 、 ぎゃく だ よ 。', 'With a yukata, the left side goes on top! Right on top is backwards.'),
    'mt.c3.verbs': T2('[着|き]る 、 しめる 、 はく 、 [持|も]つ 。 もの に よって 、 [言|い]い[方|かた] が ちがう の 。', 'Kiru, shimeru, haku, motsu: the verb changes with the thing you put on.'),
    'mt.c3.niau': T2('わあ 、 [似合|にあ]う ！ かわいい ！', 'Wow, it suits {mimo}! So cute!'),
    'mt.c3.bon': T2('[盆踊|ぼんおど]り は 、 やぐら の まわり を 、 みんな で まるく [踊|おど]る の 。', 'In bon-odori, everyone dances in a big circle around the yagura, the tall drum stage.'),
    'mt.c3.obon': T2('お[盆|ぼん] に は 、 ご[先祖|せんぞ] が [帰|かえ]って くる ん だって 。 だから 、 みんな で [踊|おど]って むかえる の 。', 'At Obon, they say the ancestors come home. So everyone dances to welcome them.'),
    'mt.c3.listen': T2('まず 、 わたし が [言|い]う ね 。 その とおり に [踊|おど]って ！', 'First I’ll call the steps. Dance just like I say!'),
    'mt.c3.call': T2('[今度|こんど] は 、 [交代|こうたい] ！ [声|こえ] を [出|だ]して 、 みんな を [踊|おど]らせて ！', 'Now we switch! Call it out and get everyone dancing!'),
    'mt.c3.end': T2('さいこう ！ [夏祭|なつまつ]り の [夜|よる] も 、 いっしょ に [踊|おど]ろう ね ！', 'Awesome! On the festival night, let’s dance together too!'),
    // chapter 4: the taiko
    'mt.c4.a': T2('おじいちゃん に [会|あ]って ほしい の 。 [太鼓|たいこ] の [名人|めいじん] な ん だ よ 。', 'I want you to meet my grandpa. He’s a taiko master.'),
    'mt.c4.b': T2('でも 、 [静寂|せいじゃく] が [来|き]て から 、 おじいちゃん の [太鼓|たいこ] 、 [音|おと] が [出|で]ない の 。', 'But ever since the Hush came, Grandpa’s drum won’t make a sound.'),
    'mt.gp.hi': T2('ナツ の お[友|とも]だち です か 。 テツ です 。 よろしく 。', 'You’re Natsu’s friend? I’m Tetsu. Pleased to meet you.'),
    'mt.gp.silent': T2('…… [見|み]て ください 。 [音|おと] が しない ん です 。', '…Look. No sound at all.'),
    'mt.gp.mouth': T2('[太鼓|たいこ] は 、 まず [口|くち] で [覚|おぼ]えます 。 「 ドン 」 は [真|ま]ん[中|なか] 、 「 カッ 」 は ふち 。', 'Taiko, you first learn with your mouth. «Don» is the middle of the drum, «ka» is the rim.'),
    'mt.gp.kuchi': T2('これ を 「 [口唱歌|くちしょうが] 」 と [言|い]います 。 [声|こえ] に [出|だ]して 、 [言|い]って ごらん なさい 。', 'This is called kuchi-shōga, “mouth music”. Try saying it out loud.'),
    'mt.gp.dodon': T2('「 ドドン 」 は 、 [速|はや]く [二回|にかい] 。 「 ドコ 」 は 、 [軽|かる]く [二回|にかい] です 。', '«Dodon» is two quick hits. «Doko» is two light ones.'),
    'mt.gp.back': T2('[聞|き]こえる … ！ [太鼓|たいこ] の [声|こえ] が 、 [戻|もど]って きた ！', 'I can hear it…! The drum’s voice has come back!'),
    'mt.gp.read': T2('[今度|こんど] は 、 [紙|かみ] に [書|か]いた リズム を [読|よ]んで ください 。', 'Now read the rhythm I wrote on this paper.'),
    'mt.gp.kake': T2('[太鼓|たいこ] に は 、 かけ[声|ごえ] も [大事|だいじ] です 。 ソーレ ！ ハッ ！ よいしょ ！', 'Shouts matter in taiko too. Sōre! Ha! Yoisho!'),
    'mt.gp.kake2': T2('[休|やす]み の ところ で 、 [大|おお]きな [声|こえ] で ！', 'In the rest, shout it out loud!'),
    'mt.gp.end': T2('ありがとう 。 [夏祭|なつまつ]り の [夜|よる] は 、 やぐら の [上|うえ] で [打|う]ちます よ 。', 'Thank you. On the festival night, I’ll drum up on the yagura.'),
    'mt.gp.bachi': T2('これ を どうぞ 。 わたし の [予備|よび] の ばち です 。', 'Please, take these. My spare drumsticks.'),
    'mt.c4.end': T2('おじいちゃん が [笑|わら]った ！ ひさしぶり ！', 'Grandpa smiled! It’s been so long!'),
    // chapter 5: the festival night
    'mt.c5.a': T2('[今夜|こんや] は 、 いよいよ [夏祭|なつまつ]り ！ いっしょ に [行|い]こう ！', 'Tonight’s finally the summer festival! Let’s go together!'),
    'mt.c5.wow': T2('わあ … ！ [提灯|ちょうちん] が いっぱい ！', 'Wow…! So many lanterns!'),
    'mt.gp.start': T2('では 、 [始|はじ]めましょう ！ ソーレ ！', 'Well then, let’s begin! Sōre!'),
    'mt.c5.hush': T2('あれ … ？ [提灯|ちょうちん] が [消|き]えて いく …', 'Huh…? The lanterns are going out…'),
    'mt.c5.hush2': T2('[静寂|せいじゃく] だ ！ お[祭|まつ]り を [止|と]めに [来|き]た ん だ ！', 'It’s the Hush! It came to stop the festival!'),
    'mt.gp.frozen': T2('[太鼓|たいこ] が … [鳴|な]らない …', 'The drum… won’t sound…'),
    'mt.c5.lead': T2('みんな を [踊|おど]らせて ！ [盆踊|ぼんおど]り の [声|こえ] を [出|だ]して ！', 'Get everyone dancing! Call the bon-odori!'),
    'mt.c5.taiko': T2('[太鼓|たいこ] は わたし が [打|う]つ ！ リズム を [言|い]って ！', 'I’ll hit the drum! You call the rhythm!'),
    'mt.c5.sore': T2('みんな で ！ せーの … ソーレ ！', 'Everyone together! Ready… Sōre!'),
    'mt.gp.thanks': T2('[鳴|な]った … ！ ナツ 、 りっぱ な [太鼓|たいこ] でした よ 。', 'It sounded…! Natsu, that was splendid drumming.'),
    'mt.c5.yatta': T2('やった ！ [静寂|せいじゃく] が [逃|に]げた ！', 'We did it! The Hush ran away!'),
    'mt.c5.hanabi': T2('[花火|はなび] だ ！ [花火|はなび] が [上|あ]がったら 、 「 たまやー ！ 」 って [言|い]う ん だ よ ！', 'Fireworks! When one goes up, you shout «Tamayā!»'),
    'mt.c5.kagiya': T2('「 かぎやー ！ 」 も ！ [昔|むかし] の [花火屋|はなびや] さん の [名前|なまえ] な ん だって 。', 'And «Kagiyā!» too! They were fireworks makers, long, long ago.'),
    'mt.c5.kirei': T2('きれい だ ね …', 'So beautiful…'),
    'mt.c5.senko': T2('[最後|さいご] は 、 [線香花火|せんこうはなび] 。 [小|ちい]さくて 、 [静|しず]か な [花火|はなび] 。', 'Last of all: senkō hanabi. Tiny, quiet sparklers.'),
    'mt.c5.wish': T2('[最後|さいご] まで [玉|たま] が [落|お]ちなかったら 、 [願|ねが]い が かなう ん だって 。', 'They say if the little fire ball doesn’t drop till the very end, your wish comes true.'),
    'mt.c5.mywish': T2('[来年|らいねん] も 、 みんな で お[祭|まつ]り が できます よう に 。', 'I wish we can all have a festival again next year.'),
    'mt.gp.mywish': T2('わたし も 、 [同|おな]じ [願|ねが]い です 。', 'I wish for the same thing.'),
    'mt.c5.gift': T2('これ 、 {mimo} に あげる ！ きつね の お[面|めん] ！ わたし と おそろい ！', 'This is for {mimo}! A fox mask! Matching with mine!'),
    'mt.c5.bye': T2('また [来年|らいねん] ！ … ううん 、 また [明日|あした] ！', 'See you next year! …No wait: see you tomorrow!'),
    // chat
    'mt.idle1': T2('[夏|なつ] の [夜|よる] は 、 [風鈴|ふうりん] の [音|おと] が [好|す]き 。 チリン 、 チリン 。', 'On summer nights I love the sound of the wind chime. Chirin, chirin.'),
    'mt.idle2': T2('かき[氷|ごおり] の シロップ 、 じつ は ぜんぶ [同|おな]じ [味|あじ] な ん だって ！ [色|いろ] と におい が ちがう だけ ！', 'They say the shaved-ice syrups all taste the same! Only the colors and the smells are different!'),
    'mt.idle3': T2('きつね の お[面|めん] は 、 お[祭|まつ]り の とき だけ つける の 。 とくべつ ！', 'I only wear my fox mask for festivals. It’s special!'),
    'mt.idle4': T2('おじいちゃん の [太鼓|たいこ] 、 おなか に ひびく ん だ よ 。 ドーン って ！', 'Grandpa’s drum rumbles right in your belly. Dooon!'),
    'mt.idle5': T2('[来年|らいねん] の [夏|なつ] も 、 ぜったい やる ！ やくそく ！', 'Next summer we’re doing it again, for sure! Promise!'),
  };
  // the drills' and the panels' own small lines: [notation, English]
  const SAY = {
    praise: [['いい ね ！', 'Nice!'], ['じょうず ！', 'Great!'], ['その [調子|ちょうし] ！', 'That’s it!'], ['すごい ！', 'Amazing!']],
    again: [['おしい ！', 'So close!'], ['だいじょうぶ 、 もう [一回|いっかい] ！', 'It’s OK, once more!']],
  };
  const lineOf = key => { const v = LT[key]; return v ? { ja: v.ja[0], en: v.en[0] } : { ja: '', en: key }; };

  // ================================================================ icons (the journal, the panels)
  function registerIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const has = k => ICONS.keys && ICONS.keys.includes(k), add = (k, fn) => { if (!has(k)) ICONS.add(k, fn); };
    add('mtKid', (c, p, h) => {         // Natsu: black bob, red-and-white ribbons, the fox mask on her right
      h.shape(c, p, h.ell(0, 6, 26, 27), '#f6d0ae');
      h.shape(c, p, cc => { cc.moveTo(-29, 8); cc.bezierCurveTo(-34, -40, 34, -40, 29, 8); cc.lineTo(22, -4); cc.quadraticCurveTo(0, -16, -22, -4); cc.closePath(); }, '#2b1d24');
      [-1, 1].forEach(s => { h.shape(c, p, h.ell(s * 33, 2, 7, 9), '#2b1d24'); h.shape(c, p, h.ell(s * 31, -8, 6, 4), '#e0304a'); });
      if (!p) return;
      h.dot(c, -9, 7, 3.4, h.INK); h.dot(c, 9, 7, 3.4, h.INK); h.dot(c, -8, 6, 1.2, '#fff'); h.dot(c, 10, 6, 1.2, '#fff');
      h.dot(c, -16, 16, 4.5, 'rgba(255,140,154,0.6)'); h.dot(c, 16, 16, 4.5, 'rgba(255,140,154,0.6)');
      c.beginPath(); c.arc(0, 14, 7, 0.15, Math.PI - 0.15); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke();
      h.shape(c, 1, h.ell(24, -22, 10, 12), '#fffaf0', 1.4); h.dot(c, 21, -22, 1.6, '#e0304a'); h.dot(c, 27, -22, 1.6, '#e0304a');
    });
    add('mtFan', (c, p, h) => {         // an uchiwa (a round paper fan) with a red goldfish
      h.shape(c, p, cc => { cc.moveTo(-3, 16); cc.lineTo(-3, 40); cc.lineTo(3, 40); cc.lineTo(3, 16); cc.closePath(); }, '#c9955a');
      h.shape(c, p, h.ell(0, -6, 27, 25), '#eaf6ff');
      if (p) { h.shape(c, 1, h.ell(-2, -6, 10, 6), '#e0372c', 1.2); h.shape(c, 1, cc => { cc.moveTo(7, -6); cc.lineTo(16, -13); cc.lineTo(15, 1); cc.closePath(); }, '#e0372c', 1.2); h.dot(c, -7, -8, 1.6, h.INK); for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(-14 + i * 12, 10, 7, Math.PI * 1.1, Math.PI * 1.9); c.strokeStyle = '#3f7fc9'; c.lineWidth = 1.6; c.stroke(); } }
    });
    add('mtFish', (c, p, h) => {        // a goldfish in its water bag
      h.shape(c, p, cc => { cc.moveTo(-8, -32); cc.lineTo(8, -32); cc.quadraticCurveTo(30, 6, 18, 30); cc.lineTo(-18, 30); cc.quadraticCurveTo(-30, 6, -8, -32); cc.closePath(); }, 'rgba(190,230,255,0.85)');
      if (p) { h.shape(c, 1, h.ell(-2, 10, 9, 6), '#e86a2a', 1.2); h.shape(c, 1, cc => { cc.moveTo(6, 10); cc.lineTo(14, 4); cc.lineTo(14, 16); cc.closePath(); }, '#e86a2a', 1.2); h.dot(c, -6, 9, 1.5, h.INK); c.fillStyle = '#e0372c'; c.fillRect(-9, -34, 18, 5); }
    });
    add('mtDenden', (c, p, h) => {      // a den-den drum: a little drum on a stick, two beads on strings
      h.shape(c, p, cc => { cc.moveTo(-3, 10); cc.lineTo(-3, 40); cc.lineTo(3, 40); cc.lineTo(3, 10); cc.closePath(); }, '#8a5f3e');
      h.shape(c, p, h.ell(0, -6, 20, 16), '#e0372c');
      if (p) { h.shape(c, 1, h.ell(0, -6, 13, 10), '#fffaf0', 1.2); c.beginPath(); c.moveTo(-20, -6); c.lineTo(-32, 4); c.moveTo(20, -6); c.lineTo(32, 4); c.strokeStyle = h.INK; c.lineWidth = 1.4; c.stroke(); h.dot(c, -32, 6, 4, '#ffd23f'); h.dot(c, 32, 6, 4, '#ffd23f'); }
    });
    add('mtBachi', (c, p, h) => {       // two taiko sticks, crossed
      h.shape(c, p, cc => { cc.moveTo(-30, 26); cc.lineTo(-24, 32); cc.lineTo(30, -26); cc.lineTo(24, -32); cc.closePath(); }, '#e8c48a');
      h.shape(c, p, cc => { cc.moveTo(30, 26); cc.lineTo(24, 32); cc.lineTo(-30, -26); cc.lineTo(-24, -32); cc.closePath(); }, '#d9b070');
    });
    add('mtMask', (c, p, h) => {        // the fox mask
      h.shape(c, p, cc => { cc.moveTo(-24, -10); cc.lineTo(-20, -36); cc.lineTo(-8, -20); cc.lineTo(8, -20); cc.lineTo(20, -36); cc.lineTo(24, -10); cc.quadraticCurveTo(26, 20, 0, 34); cc.quadraticCurveTo(-26, 20, -24, -10); cc.closePath(); }, '#fffaf0');
      if (p) { [-1, 1].forEach(s => { h.shape(c, 1, cc => { cc.moveTo(s * 18, -28); cc.lineTo(s * 12, -20); cc.lineTo(s * 20, -16); cc.closePath(); }, '#e0372c', 1); c.beginPath(); c.moveTo(s * 5, -2); c.quadraticCurveTo(s * 12, -8, s * 18, -4); c.lineWidth = 3; c.strokeStyle = '#e0372c'; c.stroke(); c.beginPath(); c.moveTo(s * 7, 2); c.lineTo(s * 15, 0); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke(); }); h.dot(c, 0, 26, 3, h.INK); h.dot(c, 0, -12, 3, '#e8c35a'); }
    });
  }

  // ================================================================ places (plain data)
  const PLAZA = { x: -10, z: -146 };
  const GYv = () => (typeof TOWN !== 'undefined' && TOWN.GY) || 0.25;
  const ringAt = (deg, r) => ({ x: PLAZA.x + Math.cos(deg * Math.PI / 180) * r, z: PLAZA.z + Math.sin(deg * Math.PI / 180) * r });
  const faceIn = p => Math.atan2(PLAZA.x - p.x, PLAZA.z - p.z);
  const SPOT = {
    kid: { x: -22.5, z: -169.1, yaw: 2.3 }, bucket: { x: -21.92, z: -169.62 }, poster: { x: -23.9, z: -170.35, yaw: 0.75 }, pole: { x: -22.15, z: -167.8 },
    drum: { x: -20.68, z: -168.58 }, gp: { x: -20.58, z: -167.79 },      // (chapter 4: Grandpa Tetsu and his drum, by her corner)
    you: { x: -10, z: -134.6 },       // the festival: you stand at the main street's mouth, south of the fountain, facing north
  };
  const STALL_R = 11.2, DANCE_R = 6.3;
  STALLS.forEach(s => { const p = ringAt(s.ang, STALL_R); s.x = p.x; s.z = p.z; s.yaw = faceIn(p); s.front = ringAt(s.ang, STALL_R - 1.55); });
  const LAMPS = [22, 68, 112, 158, 202, 248, 292, 338].map(a => ringAt(a, 12.6));       // (town.js: the plaza's lamps)

  // ================================================================ 3D: textures, the kid's corner, the people, the stalls, the yagura
  const K = () => ZHF.Kit();
  const tex = (w, h, draw) => ZHF.canvasTex(w, h, c => draw(c, w, h));
  // big brush characters fitted to a box
  function brushText(c, s, x, y, maxW, px, color, font) {
    c.font = `900 ${px}px ${font || BRUSH}`; let w = c.measureText(s).width;
    if (w > maxW) { px = Math.floor(px * maxW / w); c.font = `900 ${px}px ${font || BRUSH}`; }
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color; c.fillText(s, x, y);
  }
  // a stall's banner: its color, a white panel, the name big (characters, like the real thing), the small print under it
  function bannerTex(st) {
    return tex(512, 128, (c, W, H) => {
      c.fillStyle = st.awn; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,0.18)'; for (let x = 0; x < W; x += 64) c.fillRect(x, 0, 32, H);
      c.fillStyle = '#fffaf0'; c.beginPath(); c.roundRect ? c.roundRect(28, 12, W - 56, H - 24, 18) : c.rect(28, 12, W - 56, H - 24); c.fill();
      brushText(c, JC(st.sign), W / 2, H / 2 + 2, W - 96, 84, '#1d1418');
    });
  }
  // the kakigōri flag: white, a red 氷, blue waves, a plover
  function koriFlagTex() {
    return tex(160, 200, (c, W, H) => {
      c.fillStyle = '#fffaf2'; c.fillRect(0, 0, W, H);
      c.fillStyle = '#2f6fd0'; for (let i = 0; i < 4; i++) { c.beginPath(); for (let x = 0; x <= W; x += 4) c.lineTo(x, H - 38 + i * 10 + Math.sin(x * 0.12 + i) * 5); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.globalAlpha = 0.35 + i * 0.15; c.fill(); }
      c.globalAlpha = 1; brushText(c, '氷', W / 2, H / 2 - 12, W - 30, 118, '#d6232a');
      c.fillStyle = '#2f6fd0'; c.beginPath(); c.ellipse(36, 26, 12, 6, -0.3, 0, TAU); c.fill(); c.beginPath(); c.moveTo(26, 26); c.lineTo(16, 18); c.lineTo(20, 30); c.fill();
    });
  }
  // a red-and-white curtain stripe texture (紅白幕), and Natsu's poster
  function posterTex() {
    return tex(256, 360, (c, W, H) => {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1d2a6a'); g.addColorStop(1, '#3a2a6a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(255,255,220,${0.25 + Math.random() * 0.5})`; c.fillRect(Math.random() * W, Math.random() * 120, 2, 2); }
      [['#ff6b5a', 70, 70], ['#ffd23f', 190, 52], ['#7ff7ea', 128, 110]].forEach(([col, x, y]) => { c.strokeStyle = col; c.lineWidth = 3; for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a) * 8, y + Math.sin(a) * 8); c.lineTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30); c.stroke(); } });
      brushText(c, 'アルバ', W / 2, 168, W - 40, 40, '#fffaf0', FONT);
      brushText(c, '夏祭り', W / 2, 220, W - 30, 72, '#ffd23f');
      brushText(c, '屋台・盆踊り・太鼓・花火', W / 2, 280, W - 24, 26, '#fffaf0', FONT);
      brushText(c, 'みんな来てね！ ナツより', W / 2, 324, W - 30, 22, '#ffb3c8', FONT);
    });
  }
  // the fox mask (きつね の お面): white, red markings, slit eyes, a gold mark on the brow (with alpha, ears and all)
  let MASKTEX = null;
  function maskTex() {
    if (MASKTEX) return MASKTEX;
    MASKTEX = tex(128, 160, (c, W, H) => {
      c.clearRect(0, 0, W, H); c.translate(W / 2, 78);
      c.fillStyle = '#fffaf0'; c.strokeStyle = '#2b2235'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(-46, -14); c.lineTo(-40, -70); c.lineTo(-16, -40); c.lineTo(16, -40); c.lineTo(40, -70); c.lineTo(46, -14); c.quadraticCurveTo(50, 40, 0, 74); c.quadraticCurveTo(-50, 40, -46, -14); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#e0372c'; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 37, -58); c.lineTo(s * 24, -42); c.lineTo(s * 40, -30); c.closePath(); c.fill(); });
      c.strokeStyle = '#e0372c'; c.lineWidth = 6; c.lineCap = 'round'; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 9, -6); c.quadraticCurveTo(s * 24, -22, s * 38, -12); c.stroke(); c.beginPath(); c.moveTo(s * 18, 30); c.lineTo(s * 36, 24); c.moveTo(s * 18, 38); c.lineTo(s * 34, 38); c.stroke(); });
      c.strokeStyle = '#2b2235'; c.lineWidth = 4; [-1, 1].forEach(s => { c.beginPath(); c.moveTo(s * 10, 4); c.lineTo(s * 30, -2); c.stroke(); });
      c.fillStyle = '#e8c35a'; c.beginPath(); c.arc(0, -24, 6, 0, TAU); c.fill(); c.fillStyle = '#2b2235'; c.beginPath(); c.arc(0, 60, 5, 0, TAU); c.fill();
    });
    return MASKTEX;
  }
  function maskMesh(size) { const m = ZHF.plane(size * 0.8, size, maskTex(), { alpha: true, double: true }); m.castShadow = false; return m; }
  // a paper lantern (提灯): red with a white band, or white with a red band; glowing (lit at night, and in the day too)
  function chochin(k, x, y, z, s = 1, col = '#e0372c', band = '#fffaf0') {
    k.add(ZHF.GEO.cyl, '#2b2235', x, y + 0.2 * s, z, 0.07 * s, 0.05 * s, 0.07 * s, 0, 0, 0, { ink: 0 });
    k.add(ZHF.GEO.ball, col, x, y, z, 0.15 * s, 0.2 * s, 0.15 * s, 0, 0, 0, { glow: true });
    k.add(ZHF.GEO.cyl, band, x, y, z, 0.153 * s, 0.05 * s, 0.153 * s, 0, 0, 0, { glow: true });
    k.add(ZHF.GEO.cyl, '#2b2235', x, y - 0.2 * s, z, 0.07 * s, 0.04 * s, 0.07 * s, 0, 0, 0, { ink: 0 });
  }
  const sag = (a, b, u, d) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * d, lerp(a[2], b[2], u)];

  // ---------------- the people: Natsu (happi coat, or her yukata for the night), Grandpa Tetsu, the keepers, the dancers
  function towel(p, col = '#fffaf2', stripe = '#3f7fc9') {           // a twisted towel headband (ねじりはちまき)
    const k = K(), r = 0.25 * (p.kid ? 1.1 : 1);
    k.add(ZHF.GEO.tor, col, 0, 0.09, 0, r * 1.05, r * 1.05, 0.7, Math.PI / 2, 0, 0, { ink: 0.006 });
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; k.box(Math.sin(a) * r * 1.05, 0.09, Math.cos(a) * r * 1.05, 0.03, 0.05, 0.02, stripe, { ry: a, rz: 0.6, ink: 0 }); }
    k.ball(0.06, 0.13, -r * 0.98, 0.05, 0.035, 0.03, col, { ink: 0.006 });
    const g = new THREE.Group(); ZHF.bake(g, k); p.head.add(g); return g;
  }
  function obi(p, col) { const k = K(), y = p.hipY + 0.5 * (p.kid ? 0.5 : 0.62) * 0.55; k.add(ZHF.GEO.cyl, col, 0, y, 0, 0.29 * (p.look.wide || 1), 0.12, 0.29 * (p.look.wide || 1), 0, 0, 0, { ink: 0.008 }); k.ball(0, y, -0.28, 0.12, 0.08, 0.06, col, { ink: 0.008 }); const g = new THREE.Group(); ZHF.bake(g, k); p.body.add(g); return g; }
  function natsuLook(night) {
    return night ? { kid: true, skin: '#f6d0ae', hair: '#2b1d24', shirt: '#f6a6c1', sleeve: '#f6a6c1', pants: '#f6a6c1', shoes: '#c9955a', collar: '#fffaf0' }
      : { kid: true, skin: '#f6d0ae', hair: '#2b1d24', shirt: '#fffaf2', vest: '#2f5fa8', sleeve: '#2f5fa8', pants: '#3b4a8a', shoes: '#c9955a', collar: '#fffaf0' };
  }
  function natsuExtras(p, night) {
    const k = K(), r = 0.25 * 1.1;
    for (const s of [-1, 1]) { k.ball(s * r * 1.02, -0.02, -0.08, 0.075, 0.1, 0.075, '#2b1d24', { ink: 0.008 }); k.ball(s * r * 0.98, 0.07, -0.06, 0.05, 0.035, 0.035, '#e0304a', { ink: 0.005 }).ball(s * r * 0.98, 0.07, -0.02, 0.035, 0.03, 0.03, '#fffaf0', { ink: 0 }); }
    for (let i = 0; i < 5; i++) k.ball(-0.12 + i * 0.06, 0.1 - Math.abs(i - 2) * 0.012, r * 0.86, 0.045, 0.06, 0.03, '#2b1d24', { ink: 0 });      // her fringe
    const g = new THREE.Group(); ZHF.bake(g, k); p.head.add(g);
    const m = maskMesh(0.42); m.position.set(-0.27, 0.13, 0.08); m.rotation.set(0, -0.95, 0.3); p.head.add(m); p.mask = m;    // on her right, pushed aside
    if (night) obi(p, '#ffd23f');
    else { const t = tex(128, 128, c => { c.fillStyle = '#2f5fa8'; c.fillRect(0, 0, 128, 128); brushText(c, '祭', 64, 66, 110, 104, '#fffaf2'); }); const pl = ZHF.plane(0.32, 0.32, t); pl.position.set(0, p.hipY + 0.3, -0.29); pl.rotation.y = Math.PI; p.body.add(pl); }
  }
  function makeNatsu(night) { const p = ZHF.person(natsuLook(night)); natsuExtras(p, night); p.id = 'kid'; p.nameSrc = NAMES.kid; p.story = true; p.kidP = true; return p; }
  function makeTetsu() {
    const p = ZHF.person({ skin: '#e8b48a', hair: '#e8e4dc', shirt: '#fbfbf6', sleeve: '#2f3f7a', vest: '#2f3f7a', pants: '#2b2235', shoes: '#3a2b26', old: true, wide: 1.1, brow: '#d8d4cc' });
    towel(p, '#fffaf2', '#d6332a');
    p.bachi = [0, 1].map(i => { const k = K(); k.rod([0, 0, 0], [0, -0.05, 0.42], 0.022, '#e8c48a', { ink: 0.004 }); const g = new THREE.Group(); ZHF.bake(g, k); p.arms[i].userData.hand.add(g); return g; });
    p.id = 'gp'; p.nameSrc = NAMES.gp; p.story = true; return p;
  }
  const KEEPER_LOOK = {
    tako: { skin: '#e8b48a', hair: '#2b2235', shirt: '#2b2235', sleeve: '#2b2235', apron: '#e0503f', pants: '#3f4a5a', wide: 1.1, towel: ['#fffaf2', '#e0503f'] },
    soba: { skin: '#f0c7a0', hair: '#5a3a2a', shirt: '#fbfbf6', apron: '#2f6fb5', pants: '#2b2235', towel: ['#2f6fb5', '#fffaf2'] },
    kori: { skin: '#c98e62', hair: '#1d1822', shirt: '#7fd6ef', pants: '#3f4a5a', towel: ['#fffaf2', '#3fa7d6'] },
    wata: { skin: '#f0c7a0', hair: '#e8e4dc', shirt: '#ffc3e0', apron: '#fffaf2', pants: '#7a4f8f', old: true },
    kin: { skin: '#e8b48a', hair: '#e8e4dc', shirt: '#e86a2a', vest: '#2b2235', pants: '#2b2235', old: true, glasses: true, towel: ['#fffaf2', '#e86a2a'] },
    yoyo: { skin: '#f6d0ae', hair: '#7a3b25', shirt: '#c8a8f0', pants: '#2f3a4a' },
    sha: { skin: '#d9a07a', hair: '#2b2235', shirt: '#4f9a5a', vest: '#e8c35a', pants: '#2b2235', mustache: true, towel: ['#4f9a5a', '#fffaf2'] },
    kuji: { skin: '#f0c7a0', hair: '#3a2b26', shirt: '#d9a03a', apron: '#fffaf2', pants: '#5a3a2a' },
  };
  function makeKeeper(id) { const L0 = KEEPER_LOOK[id], p = ZHF.person(Object.assign({}, L0)); if (L0.towel) towel(p, L0.towel[0], L0.towel[1]); p.id = id; p.nameSrc = NAMES[id]; p.noTurn = true; return p; }
  const YUKATA_COLS = [['#3f5fb5', '#ffd23f'], ['#f6a6c1', '#e0304a'], ['#fffaf2', '#3f7fc9'], ['#4f9a5a', '#fff4c4'], ['#8a5ab0', '#ffcf3f'], ['#e86a2a', '#2b2235'], ['#2b2235', '#e0372c'], ['#7fd6ef', '#ff6b8a']];
  function makeDancer(i) {
    const [col, ob] = YUKATA_COLS[i % YUKATA_COLS.length], kid = i % 4 === 3;
    const p = ZHF.person({ kid, skin: ['#f0c7a0', '#e8b48a', '#c98e62', '#f6d0ae'][i % 4], hair: ['#2b2235', '#5a3a2a', '#e8e4dc', '#1d1822', '#7a3b25'][i % 5], shirt: col, sleeve: col, pants: col, shoes: '#c9955a', old: i === 2 || i === 6 });
    obi(p, ob); p.noTurn = true; p.dancer = true; return p;
  }

  // ---------------- {mimo}'s yukata and fox mask (on the real Mimo's body, and on the festival's second Mimo)
  let YT = null;
  const YUKTEX = () => YT || (YT = tex(256, 64, (c, W, H) => {          // indigo with white morning glories (朝顔), the summer flower
    c.fillStyle = '#3a5fc0'; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 8; i++) { const x = i * 32 + 16, y = 16 + (i % 2) * 28; c.fillStyle = '#fffaf2'; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; c.beginPath(); c.arc(x + Math.cos(a) * 5.5, y + Math.sin(a) * 5.5, 5, 0, TAU); c.fill(); } c.fillStyle = '#ff9ac0'; c.beginPath(); c.arc(x, y, 3, 0, TAU); c.fill(); }
  }));
  // the yukata in parts, so chapter 3 can dress {mimo} one command at a time: kiru (the robe; left over right), obi (the sash,
  // a bow at the back), geta (wooden sandals), uchiwa (a round fan, only for the festival)
  function yukataOn(body) {
    const g = new THREE.Group(), parts = {};
    const part = (id, fill) => { const p = new THREE.Group(), k = K(); fill(k, p); ZHF.bake(p, k); g.add(p); parts[id] = p; };
    part('kiru', (k, p) => {
      const geo = new THREE.LatheGeometry([[0.218, 0.012], [0.3, 0.1], [0.335, 0.18], [0.344, 0.255]].map(([x, y]) => new THREE.Vector2(x, y)), 26);
      const skirt = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ map: YUKTEX(), gradientMap: TK.grad, side: THREE.DoubleSide })); skirt.castShadow = true; p.add(skirt);
      k.rod([0.12, 0.262, 0.32], [-0.08, 0.172, 0.325], 0.016, '#fffaf2', { ink: 0.004 });     // left over right: the top panel's edge (the obi hides the rest)
      k.rod([-0.11, 0.262, 0.32], [-0.025, 0.215, 0.335], 0.014, '#fffaf2', { ink: 0.004 });
    });
    part('obi', k => {         // a narrow sash at the waist; its bow at the back, either side of the tail (the tail is the knot)
      k.add(ZHF.GEO.tor, '#ffcf3f', 0, 0.205, 0, 0.334, 0.334, 0.19, Math.PI / 2, 0, 0, { ink: 0.004 });
      for (const s of [-1, 1]) k.ball(s * 0.13, 0.225, -0.3, 0.085, 0.06, 0.03, '#ffcf3f', { ay: s * 0.5, ink: 0.006 }).ball(s * 0.08, 0.16, -0.31, 0.03, 0.06, 0.02, '#ffcf3f', { az: s * 0.4, ink: 0.004 });
    });
    part('geta', k => { for (const s of [-1, 1]) { k.box(s * 0.13, -0.005, 0.14, 0.15, 0.03, 0.2, '#c9955a', { ink: 0.004 }).box(s * 0.13, -0.03, 0.08, 0.13, 0.03, 0.03, '#8a5f3e', { ink: 0 }).box(s * 0.13, -0.03, 0.2, 0.13, 0.03, 0.03, '#8a5f3e', { ink: 0 }).rod([s * 0.13 - 0.05, 0.01, 0.2], [s * 0.13, 0.06, 0.23], 0.008, '#e0372c', { ink: 0 }).rod([s * 0.13 + 0.05, 0.01, 0.2], [s * 0.13, 0.06, 0.23], 0.008, '#e0372c', { ink: 0 }); } });
    part('uchiwa', k => { k.rod([-0.34, 0.12, 0.12], [-0.4, 0.3, 0.12], 0.012, '#c9955a', { ink: 0.004 }).add(ZHF.GEO.cyl, '#eaf6ff', -0.43, 0.42, 0.12, 0.13, 0.012, 0.12, Math.PI / 2, 0.3, 0.2, { ink: 0.006 }).ball(-0.43, 0.42, 0.14, 0.05, 0.03, 0.01, '#e0372c', { ink: 0 }); });
    g.parts = parts; g.show = ids => { for (const [id, p] of Object.entries(parts)) p.visible = ids.includes(id); };
    g.show(['kiru', 'obi', 'geta']);
    g.visible = false; body.add(g); return g;
  }
  function foxOn(body) { const m = maskMesh(0.28); m.position.set(0.235, 0.47, 0.205); m.rotation.set(-0.12, 0.6, -0.25); m.visible = false; body.add(m); return m; }      // (on the side of its head, turned forward)
  let YUK = null, FOX = null, DRESSING = false;
  const yukOn = () => !!(G && isOn() && G.state.mt && G.state.mt.yuk && G.state.mt.yukOn && !(G.state.gm && G.state.gm.apron && G.state.gm.wear === 'apron'));
  const hatOn = () => !!(G && isOn() && G.state.mt && G.state.mt.mask && G.state.mt.maskOn
    && !(typeof SCHOOL !== 'undefined' && SCHOOL.hatOn && SCHOOL.hatOn()) && !(typeof ANIME !== 'undefined' && ANIME.bandOn && ANIME.bandOn()));
  function wearables() {
    if (!G || !G.cast || !G.cast.mimo || !G.cast.mimo.body) return;
    if (!YUK && G.state.mt && (G.state.mt.yuk || DRESSING)) YUK = yukataOn(G.cast.mimo.body);
    if (!FOX && G.state.mt && G.state.mt.mask) FOX = foxOn(G.cast.mimo.body);
    if (YUK) YUK.visible = DRESSING || yukOn();
    if (FOX) FOX.visible = hatOn();
  }

  // ---------------- a stall (屋台): local +z faces the fountain. Posts, a counter, a roof in the stall's color, the banner,
  // two lanterns, and its goods. → a Group with .keeperAt (local)
  function yatai(st) {
    const g = new THREE.Group(), k = K(), W = 1.7, wood = '#8a5f3e';
    for (const [x, z] of [[-0.82, 0.42], [0.82, 0.42], [-0.82, -0.42], [0.82, -0.42]]) k.rod([x, 0, z], [x, 2.08, z], 0.035, wood, { ink: 0.008 });
    k.box(0, 0.42, 0.18, W - 0.1, 0.84, 0.5, '#a8673a', { ink: 0.012 }).box(0, 0.87, 0.24, W - 0.04, 0.06, 0.62, '#c9955a', { ink: 0.01 });
    k.box(0, 0.47, 0.44, W - 0.14, 0.68, 0.02, st.cloth, { ink: 0.006 });
    k.box(0, 2.13, -0.02, W + 0.3, 0.07, 1.32, st.awn, { rx: -0.1, ink: 0.012 });
    for (let i = 0; i < 6; i++) k.box(-W / 2 - 0.05 + (i + 0.5) * (W + 0.1) / 6, 2.06, 0.6, (W + 0.1) / 6 - 0.03, 0.14, 0.02, i % 2 ? st.cloth : st.awn, { ink: 0 });
    chochin(k, -0.82, 1.62, 0.5, 0.75); chochin(k, 0.82, 1.62, 0.5, 0.75);
    goods(k, st);
    ZHF.bake(g, k);
    const b = ZHF.plane(W - 0.06, 0.42, bannerTex(st)); b.position.set(0, 1.8, 0.47); g.add(b);
    if (st.id === 'kori') { const f = ZHF.plane(0.44, 0.55, koriFlagTex(), { double: true }); f.position.set(-1.12, 1.95, 0.5); f.rotation.y = 0.3; g.add(f); const kf = K(); kf.rod([-1.0, 0, 0.5], [-1.0, 2.35, 0.5], 0.02, '#c9955a', { ink: 0.004 }).rod([-1.0, 2.23, 0.5], [-1.34, 2.23, 0.6], 0.012, '#c9955a', { ink: 0 }); ZHF.bake(g, kf); }
    g.position.set(st.x, GYv(), st.z); g.rotation.y = st.yaw;
    return g;
  }
  function goods(k, st) {
    const y = 0.9;
    if (st.id === 'tako') { k.box(0, y + 0.03, 0.18, 0.9, 0.06, 0.42, '#3a3444', { ink: 0.006 }); for (let r = 0; r < 3; r++) for (let i = 0; i < 6; i++) k.ball(-0.33 + i * 0.13, y + 0.08, 0.05 + r * 0.13, 0.05, 0.04, 0.05, r === 1 && i % 2 ? '#c97a3a' : '#a86a32', { ink: 0 }); k.box(0.6, y + 0.05, 0.3, 0.2, 0.04, 0.12, '#e8d8b8', { ink: 0.004 }); }
    else if (st.id === 'soba') { k.box(0, y + 0.03, 0.18, 1.1, 0.05, 0.46, '#4a4a52', { ink: 0.006 }).ball(-0.1, y + 0.08, 0.18, 0.34, 0.05, 0.16, '#c98a3a', { ink: 0 }); for (let i = 0; i < 6; i++) k.ball(-0.3 + i * 0.1, y + 0.12, 0.12 + (i % 2) * 0.08, 0.025, 0.012, 0.025, i % 3 ? '#e0304a' : '#4cc25a', { ink: 0 }); k.rod([0.35, y + 0.08, 0.1], [0.55, y + 0.25, 0.25], 0.012, '#9aa4b5', { ink: 0 }); }
    else if (st.id === 'kori') {
      k.cyl(0.42, y + 0.2, 0.12, 0.11, 0.4, '#3fa7d6', { ink: 0.008 }).cyl(0.42, y + 0.45, 0.12, 0.13, 0.05, '#2f6fb5', { ink: 0.006 }).rod([0.55, y + 0.45, 0.12], [0.62, y + 0.55, 0.12], 0.012, '#2b2235', { ink: 0 });
      FLAVORS.forEach((f, i) => k.cyl(-0.62 + i * 0.12, y + 0.12, 0.3, 0.04, 0.22, f.col, { ink: 0.004 }));
      k.cyl(0.05, y + 0.06, 0.32, 0.06, 0.1, '#fffaf2', { ink: 0.004 }).ball(0.05, y + 0.15, 0.32, 0.08, 0.07, 0.08, '#ffe0e8', { ink: 0.004 });
      for (let i = 0; i < 4; i++) k.cyl(-0.55 + i * 0.13, y + 0.1, 0.05, 0.04, 0.2, '#9fdcf0', { ink: 0.004 });      // the ramune bottles
    } else if (st.id === 'wata') {
      k.cyl(0.38, y + 0.1, 0.15, 0.24, 0.18, '#d8dce4', { ink: 0.008 }).ball(-0.2, y + 0.42, 0.2, 0.17, 0.15, 0.17, '#ffc3e0', { ink: 0.006 }).rod([-0.2, y, 0.2], [-0.2, y + 0.3, 0.2], 0.01, '#fffaf2', { ink: 0 });
      k.rod([-0.8, 1.72, 0.42], [0.8, 1.72, 0.42], 0.012, '#8a5f3e', { ink: 0 });
      ['#ff8cc6', '#7fd6ef', '#ffd23f', '#8fe08a', '#c8a8f0'].forEach((c, i) => { const x = -0.6 + i * 0.3; k.rod([x, 1.72, 0.42], [x, 1.6, 0.42], 0.006, '#fffaf2', { ink: 0 }).box(x, 1.45, 0.42, 0.2, 0.28, 0.06, c, { ink: 0.006 }).ball(x - 0.04, 1.48, 0.455, 0.015, 0.02, 0.01, '#2b2235', { ink: 0 }).ball(x + 0.04, 1.48, 0.455, 0.015, 0.02, 0.01, '#2b2235', { ink: 0 }); });
    } else if (st.id === 'kin') {
      k.cyl(0, 0.16, 1.05, 0.62, 0.3, '#3f8fd6', { ink: 0.01 }).cyl(0, 0.3, 1.05, 0.58, 0.02, '#8fd0f0', { ink: 0 });
      for (let i = 0; i < 9; i++) { const a = i * 2.3, r = 0.15 + (i % 3) * 0.14; k.ball(Math.cos(a) * r, 0.32, 1.05 + Math.sin(a) * r, 0.05, 0.02, 0.025, i % 4 === 3 ? '#2b2235' : '#e86a2a', { ay: a, ink: 0 }); }
      for (let i = 0; i < 5; i++) k.cyl(-0.5 + i * 0.25, y + 0.08, 0.28, 0.035, 0.12, '#fffaf2', { ink: 0.004 });      // the poi
    } else if (st.id === 'yoyo') {
      k.box(0, 0.14, 1.0, 1.5, 0.26, 0.6, '#3f8fd6', { ink: 0.01 }).box(0, 0.28, 1.0, 1.42, 0.02, 0.52, '#8fd0f0', { ink: 0 });
      YOYO.concat(YOYO).forEach((c, i) => { const x = -0.6 + (i % 6) * 0.24 + (i > 5 ? 0.1 : 0), z = 0.86 + (i > 5 ? 0.24 : 0); k.ball(x, 0.34, z, 0.085, 0.08, 0.085, c.col, { ink: 0.006 }).cyl(x, 0.34, z, 0.088, 0.015, '#fffaf2', { ink: 0 }); });
    } else if (st.id === 'sha') {
      for (let r = 0; r < 3; r++) { k.box(0, 1.0 + r * 0.32, -0.35, 1.5, 0.04, 0.22, '#c9955a', { ink: 0.006 }); PRIZES[2 - r].forEach((p, c) => k.box(-0.45 + c * 0.45, 1.1 + r * 0.32, -0.35, 0.16, 0.18, 0.12, p.col, { ink: 0.006 })); }
      k.rod([-0.3, y + 0.04, 0.4], [-0.3, y + 0.04, 0.0], 0.02, '#5a3a2a', { ink: 0.004 }).rod([0.3, y + 0.04, 0.4], [0.3, y + 0.04, 0.0], 0.02, '#5a3a2a', { ink: 0.004 });
    } else if (st.id === 'kuji') {
      k.box(-0.3, y + 0.15, 0.25, 0.4, 0.3, 0.3, '#e0372c', { ink: 0.008 }).box(-0.3, y + 0.31, 0.25, 0.2, 0.02, 0.06, '#2b2235', { ink: 0 });
      k.box(0, 1.35, -0.38, 1.5, 0.9, 0.04, '#fff4c4', { ink: 0.006 }).ball(-0.45, 1.38, -0.33, 0.16, 0.16, 0.1, '#b07a4a', { ink: 0.006 }).ball(-0.45, 1.58, -0.33, 0.11, 0.1, 0.08, '#b07a4a', { ink: 0.006 });
      k.box(0.1, 1.4, -0.34, 0.2, 0.2, 0.06, '#7fd6ef', { ink: 0.004 }).box(0.45, 1.4, -0.34, 0.14, 0.22, 0.06, '#ffd23f', { ink: 0.004 });
    }
  }
  // ---------------- the yagura (やぐら) over the fountain: legs, a red-and-white curtain (紅白幕), a railing, the drum, a mast
  // with lantern lines out to the plaza's lamps, and a ring of lanterns under the rail
  const YAG = { h: 2.6, w: 3.3 };
  function yagura() {
    const g = new THREE.Group(), k = K(), w = YAG.w, h = YAG.h, wood = '#8a5f3e';
    for (const [x, z] of [[-w, -w], [w, -w], [w, w], [-w, w]]) k.rod([x, 0, z], [x, h + 0.95, z], 0.11, wood, { ink: 0.014 });
    k.box(0, h, 0, 2 * w + 0.3, 0.18, 2 * w + 0.3, '#b07a4a', { ink: 0.016 });
    for (const y of [h + 0.55, h + 0.9]) { k.rod([-w, y, -w], [w, y, -w], 0.04, wood, { ink: 0.006 }).rod([w, y, -w], [w, y, w], 0.04, wood, { ink: 0.006 }).rod([w, y, w], [-w, y, w], 0.04, wood, { ink: 0.006 }).rod([-w, y, w], [-w, y, -w], 0.04, wood, { ink: 0.006 }); }
    const N = 14, sw = 2 * w / N;
    for (const [nx, nz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) for (let i = 0; i < N; i++) {
      const u = -w + (i + 0.5) * sw, x = nx ? nx * (w + 0.06) : u, z = nz ? nz * (w + 0.06) : u;
      k.box(x, 0.3 + (h - 0.4) / 2, z, nx ? 0.03 : sw, h - 0.4, nz ? 0.03 : sw, i % 2 ? '#fffaf2' : '#d6332a', { ink: 0 });
    }
    k.rod([0, h, 0], [0, h + 4.6, 0], 0.07, wood, { ink: 0.008 }).ball(0, h + 4.65, 0, 0.12, 0.12, 0.12, '#e8c35a', { ink: 0.006 });
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + 0.2, x = Math.cos(a), z = Math.sin(a), m = Math.max(Math.abs(x), Math.abs(z)); chochin(k, x / m * (w + 0.12), h - 0.3, z / m * (w + 0.12), 0.85, i % 2 ? '#e0372c' : '#fffaf0', i % 2 ? '#fffaf0' : '#e0372c'); }
    // the drum: a long barrel on a stand at the platform's south edge, its heads facing north and south
    const dz = 1.5, dy = h + 0.62;
    k.rod([-0.45, h, dz - 0.3], [-0.3, dy - 0.1, dz], 0.03, wood).rod([0.45, h, dz - 0.3], [0.3, dy - 0.1, dz], 0.03, wood).rod([-0.45, h, dz + 0.3], [-0.3, dy - 0.1, dz], 0.03, wood).rod([0.45, h, dz + 0.3], [0.3, dy - 0.1, dz], 0.03, wood);
    const barrel = new THREE.LatheGeometry([[0.4, -0.45], [0.47, -0.3], [0.5, 0], [0.47, 0.3], [0.4, 0.45]].map(([x, y]) => new THREE.Vector2(x, y)), 20);
    k.add(barrel, '#9a4a2a', 0, dy + 0.12, dz, 1, 1, 1, Math.PI / 2, 0, 0, { ink: 0 });
    k.add(ZHF.GEO.cyl, '#f4e3c0', 0, dy + 0.12, dz + 0.455, 0.41, 0.02, 0.41, Math.PI / 2, 0, 0, { ink: 0.008 }).add(ZHF.GEO.cyl, '#f4e3c0', 0, dy + 0.12, dz - 0.455, 0.41, 0.02, 0.41, Math.PI / 2, 0, 0, { ink: 0.008 });
    ZHF.bake(g, k);
    g.position.set(PLAZA.x, GYv(), PLAZA.z);
    return g;
  }
  const DRUM_AT = () => ({ x: PLAZA.x, y: GYv() + YAG.h + 0.74, z: PLAZA.z + 1.5 });
  // the lantern lines from the yagura's mast to the plaza's eight lamps (built once; they stay up after the festival night)
  function lines() {
    const g = new THREE.Group(), k = K(), top = [PLAZA.x, GYv() + YAG.h + 4.5, PLAZA.z];
    // (their own mast, standing in the fountain's top bowl: the lines stay up after the festival night, when the yagura's gone)
    k.rod([PLAZA.x, GYv() + 2.25, PLAZA.z], [PLAZA.x, top[1] + 0.15, PLAZA.z], 0.06, '#8a5f3e', { ink: 0.008 }).ball(PLAZA.x, top[1] + 0.2, PLAZA.z, 0.11, 0.11, 0.11, '#e8c35a', { ink: 0.006 });
    for (const L0 of LAMPS) {
      const end = [L0.x, GYv() + 3.15, L0.z];
      for (let i = 0; i < 8; i++) k.rod(sag(top, end, i / 8, 0.7), sag(top, end, (i + 1) / 8, 0.7), 0.01, '#2b2235', { ink: 0 });
      for (let i = 1; i < 7; i++) { const q = sag(top, end, i / 7, 0.7); chochin(k, q[0], q[1] - 0.32, q[2], 0.8, i % 2 ? '#e0372c' : '#fffaf0', i % 2 ? '#fffaf0' : '#e0372c'); }
    }
    ZHF.bake(g, k); return g;
  }

  // ---------------- fireworks (花火): bursts of glowing points that bloom, droop and fade. kinds: 'kiku' (chrysanthemum: long
  // trails), 'botan' (peony: dots), 'yanagi' (willow: gold, drooping far), 'senrin' (a thousand little rings)
  const GLOWTEX = (() => { let t = null; return () => t || (t = tex(64, 64, c => { const g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); })); })();
  const FW = { list: [], group: null };
  function firework(x, y, z, kind = 'kiku', cols = ['#ffd23f', '#ff6b5a']) {
    if (!FW.group || !B) return;
    const n = kind === 'senrin' ? 180 : 170, trail = kind === 'kiku' || kind === 'yanagi' ? 5 : 1, N = n * trail;
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), dirs = [];
    const C = cols.map(c => new THREE.Color(c));
    for (let i = 0; i < n; i++) {
      const u = Math.random() * 2 - 1, a = Math.random() * TAU, s = Math.sqrt(1 - u * u), sp = kind === 'senrin' ? 4.2 : 10.5 + Math.random() * 1.2;
      const cc = C[i % C.length], sub = kind === 'senrin' ? { x: (Math.floor(i / 25) % 3 - 1) * 2.6, y: (Math.floor(i / 75) - 0.5) * 2.2, z: 0 } : { x: 0, y: 0, z: 0 };
      dirs.push({ x: s * Math.cos(a) * sp, y: u * sp, z: s * Math.sin(a) * sp, o: sub });
      for (let j = 0; j < trail; j++) { const k = (i * trail + j) * 3, f = 1 - j / trail * 0.75; col[k] = cc.r * f; col[k + 1] = cc.g * f; col[k + 2] = cc.b * f; }
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const size = kind === 'senrin' ? 0.75 : 1.05;
    const mat = new THREE.PointsMaterial({ size, map: GLOWTEX(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; FW.group.add(pts);
    FW.list.push({ pts, geo, mat, dirs, trail, n, x, y, z, t: 0, size, life: kind === 'yanagi' ? 3.6 : 2.6, g: kind === 'yanagi' ? 2.6 : 1.3, drag: kind === 'yanagi' ? 1.5 : 2.0 });
    sfx('crack'); setTimeout(() => sfx('hit'), 60);
  }
  function fwStep(dt) {
    for (let i = FW.list.length - 1; i >= 0; i--) {
      const F = FW.list[i]; F.t += dt;
      const p = F.geo.attributes.position.array, k = (1 - Math.exp(-F.drag * F.t)) / F.drag;
      for (let a = 0; a < F.n; a++) {
        const d = F.dirs[a];
        for (let j = 0; j < F.trail; j++) {
          const tt = Math.max(0, F.t - j * 0.07), kk = (1 - Math.exp(-F.drag * tt)) / F.drag, q = (a * F.trail + j) * 3;
          p[q] = F.x + d.o.x + d.x * kk; p[q + 1] = F.y + d.o.y + d.y * kk - 0.5 * F.g * tt * tt; p[q + 2] = F.z + d.o.z + d.z * kk;
        }
      }
      F.geo.attributes.position.needsUpdate = true; void k;
      F.mat.opacity = clamp(1.4 - F.t / F.life * 1.4, 0, 1); F.mat.size = F.size * (1 - 0.35 * F.t / F.life);
      if (F.t > F.life) { FW.group.remove(F.pts); F.geo.dispose(); F.mat.dispose(); FW.list.splice(i, 1); }
    }
  }
  // ---------------- the sparkler (線香花火): a paper twist from Natsu's hand, a glowing bead, and sparks by stage
  const SK = { on: false, stage: 0, t: 0, pts: null, geo: null, bead: null, stick: null, at: { x: 0, y: 0, z: 0 }, sparks: [], drop: 0 };
  function sparklerBuild() {
    if (SK.pts) return;
    const N = 240, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3)); geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    const mat = new THREE.PointsMaterial({ size: 0.05, map: GLOWTEX(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    SK.pts = new THREE.Points(geo, mat); SK.pts.frustumCulled = false; SK.geo = geo; B.root.add(SK.pts);
    SK.bead = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffb347' })); B.root.add(SK.bead);
    const k = K(); k.rod([0, 0, 0], [0, -0.32, 0.02], 0.006, '#e86aa0', { ink: 0 }); SK.stick = new THREE.Group(); ZHF.bake(SK.stick, k); B.root.add(SK.stick);
    for (let i = 0; i < N; i++) SK.sparks.push({ life: 0, max: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 });
    SK.pts.visible = SK.bead.visible = SK.stick.visible = false;
  }
  function sparkStep(dt, t) {
    if (!SK.pts) return;
    const on = SK.on; SK.pts.visible = SK.bead.visible = SK.stick.visible = on; if (!on) return;
    if (SK.follow) SK.follow();
    SK.t += dt;
    const A = SK.at, by = A.y - 0.32 - SK.drop;
    SK.stick.position.set(A.x, A.y, A.z); SK.bead.position.set(A.x, by, A.z + 0.02);
    const st = SK.stage, grow = st === 0 ? Math.min(1, SK.t / 2.5) : 1;
    SK.bead.scale.setScalar((0.5 + grow * 0.7) * (st >= 4 ? 0.85 : 1) * (1 + Math.sin(t * 9) * 0.06));
    // how many sparks a second, how far they fly, how much they droop, by stage: bud, peony, pine needles, willow, petals
    const RATE = [0, 40, 160, 70, 10][st] || 0, SP = [0, 0.35, 0.8, 0.5, 0.3][st] || 0, GR = [0, 0.4, 0.6, 1.4, 1.1][st] || 0;
    let want = RATE * dt;
    for (const s of SK.sparks) {
      if (s.life > 0) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vy -= s.g * dt; }
      else if (want > Math.random()) { want--; const a = Math.random() * TAU, u = Math.random() * 1.6 - 0.6, sp = SP * (0.5 + Math.random()); s.x = A.x; s.y = by; s.z = A.z + 0.02; s.vx = Math.cos(a) * sp; s.vy = u * sp; s.vz = Math.sin(a) * sp * 0.6; s.g = GR; s.max = s.life = 0.15 + Math.random() * (st === 3 ? 0.6 : 0.3); }
    }
    const p = SK.geo.attributes.position.array, c = SK.geo.attributes.color.array;
    SK.sparks.forEach((s, i) => { const k = i * 3, f = s.life > 0 ? s.life / s.max : 0; p[k] = s.x; p[k + 1] = s.life > 0 ? s.y : -999; p[k + 2] = s.z; c[k] = f; c[k + 1] = 0.7 * f; c[k + 2] = 0.25 * f; });
    SK.geo.attributes.position.needsUpdate = true; SK.geo.attributes.color.needsUpdate = true;
  }
  // ---------------- night (the festival evening): the sky goes dark, the light goes blue, the lanterns glow
  const NIGHT = { k: 0, want: 0, dome: null, saved: null };
  function nightDome() {
    if (NIGHT.dome) return NIGHT.dome;
    const t = tex(64, 256, (c, W, H) => { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#060818'); g.addColorStop(0.45, '#141a44'); g.addColorStop(0.6, '#2a2458'); g.addColorStop(1, '#3a2c5a'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
    const m = new THREE.Mesh(new THREE.SphereGeometry(480, 24, 12), new THREE.MeshBasicMaterial({ map: t, side: THREE.BackSide, fog: false, depthWrite: false, transparent: true, opacity: 0 }));
    m.renderOrder = -0.5; G.w3d.scene.add(m); NIGHT.dome = m;
    // the stars: sharp points on the upper sky (a texture this big would smear them into blobs)
    const N = 420, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const a = Math.random() * TAU, e = 0.12 + Math.pow(Math.random(), 0.7) * 1.3; pos[i * 3] = Math.cos(a) * Math.cos(e) * 450; pos[i * 3 + 1] = Math.sin(e) * 450; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 450; }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    m.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: '#fffbe8', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    m.stars.renderOrder = -0.4; m.stars.frustumCulled = false; G.w3d.scene.add(m.stars);
    return m;
  }
  function nightStep(dt) {
    NIGHT.k = damp(NIGHT.k, NIGHT.want, 1.6, dt); if (Math.abs(NIGHT.k - NIGHT.want) < 0.003) NIGHT.k = NIGHT.want;
    const k = NIGHT.k, sc = G.w3d.scene, d = nightDome();
    d.visible = d.stars.visible = k > 0.01; d.material.opacity = k; d.stars.material.opacity = k * 0.9; d.position.copy(G.w3d.camera.position); d.stars.position.copy(G.w3d.camera.position);
    if (!NIGHT.saved) NIGHT.saved = { hemi: sc.children.find(o => o.isHemisphereLight), sun: sc.children.find(o => o.isDirectionalLight), sky: sc.children.find(o => o.isMesh && o.material && o.material.uniforms && o.material.uniforms.uHush && o.material.uniforms.sunDir), grass: sc.children.filter(o => o.material && o.material.uniforms && o.material.uniforms.uFogNear), hc: null };
    const S0 = NIGHT.saved;
    if (S0.hemi && !S0.hc) S0.hc = { sky: S0.hemi.color.clone(), gr: S0.hemi.groundColor.clone(), sun: S0.sun ? S0.sun.color.clone() : null };
    if (k <= 0.001) { if (S0.hc && S0.dirty) { S0.hemi.color.copy(S0.hc.sky); S0.hemi.groundColor.copy(S0.hc.gr); if (S0.sun) S0.sun.color.copy(S0.hc.sun); S0.dirty = false; } return; }
    S0.dirty = true;
    if (S0.hemi) { S0.hemi.color.copy(S0.hc.sky).lerp(new THREE.Color('#6a74c8'), k); S0.hemi.groundColor.copy(S0.hc.gr).lerp(new THREE.Color('#3a2a3a'), k); S0.hemi.intensity *= 1 - 0.25 * k; }
    if (S0.sun) { S0.sun.color.copy(S0.hc.sun).lerp(new THREE.Color('#ffb070'), k); S0.sun.intensity *= 1 - 0.6 * k; }
    if (S0.sky) S0.sky.visible = k < 0.98;
    sc.fog.color.lerp(new THREE.Color('#1a1838'), k); sc.fog.near = lerp(sc.fog.near, 14, k); sc.fog.far = lerp(sc.fog.far, 120, k);
    for (const o of S0.grass) { o.material.uniforms.uFogNear.value = lerp(o.material.uniforms.uFogNear.value, 0, k * 0.85); o.material.uniforms.uFogFar.value = lerp(o.material.uniforms.uFogFar.value, 30, k * 0.85); }
  }

  // ================================================================ build: Natsu's corner (ja only), and the festival's pieces (hidden)
  let B = null;
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    const root = new THREE.Group(); root.name = 'matsuri'; root.visible = false; scene.add(root);
    const colliders = [], solid = c => { c.x0 = c.x; c.z0 = c.z; colliders.push(c); return c; };
    // ---- the corner: an upturned wooden bucket (her practice drum), her poster on an easel, a lantern pole with a wind chime
    const corner = new THREE.Group(); root.add(corner);
    const kc = K(), bk = SPOT.bucket, by = gy(bk.x, bk.z);
    kc.cyl(bk.x, by + 0.24, bk.z, 0.3, 0.48, '#b5824a', { rz2: 0.3, ink: 0.012 }).cyl(bk.x, by + 0.49, bk.z, 0.27, 0.02, '#d9b07a', { ink: 0.006 });
    for (const y of [0.1, 0.38]) kc.cyl(bk.x, by + y, bk.z, 0.305, 0.04, '#3a3444', { ink: 0 });
    kc.rod([bk.x + 0.12, by + 0.51, bk.z - 0.1], [bk.x + 0.32, by + 0.53, bk.z + 0.2], 0.018, '#e8c48a', { ink: 0.004 }).rod([bk.x - 0.12, by + 0.51, bk.z - 0.1], [bk.x - 0.3, by + 0.53, bk.z + 0.22], 0.018, '#e8c48a', { ink: 0.004 });
    const P = SPOT.poster, py = gy(P.x, P.z);
    kc.frame(P.x, py, P.z, P.yaw).rod([-0.3, 0, 0.12], [-0.22, 1.5, 0], 0.025, '#8a5f3e').rod([0.3, 0, 0.12], [0.22, 1.5, 0], 0.025, '#8a5f3e').rod([0, 0, -0.32], [0, 1.4, -0.03], 0.025, '#8a5f3e').box(0, 0.6, 0.06, 0.66, 0.04, 0.12, '#8a5f3e').free();
    const pl = SPOT.pole, ply = gy(pl.x, pl.z);
    kc.rod([pl.x, ply, pl.z], [pl.x, ply + 2.6, pl.z], 0.045, '#8a5f3e').rod([pl.x, ply + 2.5, pl.z], [pl.x + 0.55, ply + 2.5, pl.z + 0.1], 0.025, '#8a5f3e');
    chochin(kc, pl.x + 0.5, ply + 2.05, pl.z + 0.09, 1.0); chochin(kc, pl.x, ply + 1.9, pl.z + 0.16, 0.8, '#fffaf0', '#e0372c');
    kc.rod([pl.x + 0.25, ply + 2.5, pl.z + 0.05], [pl.x + 0.25, ply + 2.32, pl.z + 0.05], 0.004, '#2b2235', { ink: 0 }).add(ZHF.GEO.half, '#bfe8ff', pl.x + 0.25, ply + 2.26, pl.z + 0.05, 0.08, 0.09, 0.08, Math.PI, 0, 0, { ink: 0.004 });
    ZHF.bake(corner, kc);
    const strip = new THREE.Group(), ks = K(); ks.box(0, 0, 0, 0.07, 0.2, 0.004, '#fffaf2', { ink: 0 }); ZHF.bake(strip, ks); strip.position.set(pl.x + 0.25, ply + 2.08, pl.z + 0.05); corner.add(strip);
    const pt = ZHF.plane(0.62, 0.87, posterTex()); pt.position.set(P.x + Math.sin(P.yaw) * 0.07, py + 1.02, P.z + Math.cos(P.yaw) * 0.07); pt.rotation.set(-0.12, P.yaw, 0, 'YXZ'); corner.add(pt);
    solid({ x: bk.x, z: bk.z, r: 0.34 }); solid({ x: P.x, z: P.z, r: 0.32 }); solid({ x: pl.x, z: pl.z, r: 0.14 });
    // ---- Grandpa Tetsu's drum (chapter 4): a long barrel drum on a slanted stand, its heads facing him and you
    const drumSet = new THREE.Group(); drumSet.visible = false; root.add(drumSet);
    const kd = K(), D0 = SPOT.drum, dy0 = gy(D0.x, D0.z);
    kd.frame(D0.x, dy0, D0.z, Math.atan2(-0.35, -2.71));
    for (const s of [-1, 1]) kd.rod([s * 0.42, 0, -0.35], [s * 0.3, 0.6, 0.05], 0.035, '#8a5f3e').rod([s * 0.42, 0, 0.4], [s * 0.3, 0.6, 0.05], 0.035, '#8a5f3e');
    const tilt = Math.PI / 2 + 0.25;       // (the head toward him tilts up)
    kd.add(new THREE.LatheGeometry([[0.36, -0.42], [0.43, -0.28], [0.46, 0], [0.43, 0.28], [0.36, 0.42]].map(([x, y]) => new THREE.Vector2(x, y)), 20), '#9a4a2a', 0, 0.8, 0.05, 1, 1, 1, tilt, 0, 0, { ink: 0 });
    kd.add(ZHF.GEO.cyl, '#f4e3c0', 0, 0.8 - Math.sin(0.25) * 0.425, 0.05 + Math.cos(0.25) * 0.425, 0.37, 0.02, 0.37, tilt, 0, 0, { ink: 0.008 }).add(ZHF.GEO.cyl, '#f4e3c0', 0, 0.8 + Math.sin(0.25) * 0.425, 0.05 - Math.cos(0.25) * 0.425, 0.37, 0.02, 0.37, tilt, 0, 0, { ink: 0.008 });
    kd.free(); ZHF.bake(drumSet, kd);
    // ---- the people: Natsu (always, at her corner), and for the festival: Grandpa Tetsu, the keepers, the dancers
    const people = [];
    const kid = makeNatsu(false); kid.x = SPOT.kid.x; kid.z = SPOT.kid.z; kid.y = gy(kid.x, kid.z); kid.yaw = kid.baseYaw = SPOT.kid.yaw;
    root.add(kid.root); people.push(kid);
    const kidN = makeNatsu(true); kidN.root.visible = false; kidN.hidden = true; root.add(kidN.root);
    const gp = makeTetsu(); gp.root.visible = false; gp.hidden = true; root.add(gp.root);
    // ---- the festival (built now, shown only in scenes): stalls + keepers, the yagura, the lantern lines, dancers
    const fest = new THREE.Group(); fest.visible = false; root.add(fest);
    const stalls = {}, keepers = {};
    for (const st of STALLS) {
      const s = yatai(st); s.visible = false; fest.add(s); stalls[st.id] = s;
      const p = makeKeeper(st.keeper), back = { x: st.x - Math.sin(st.yaw) * 0.28, z: st.z - Math.cos(st.yaw) * 0.28 };
      p.x = back.x; p.z = back.z; p.y = GYv(); p.yaw = p.baseYaw = st.yaw; p.root.visible = false; p.hidden = true; fest.add(p.root); keepers[st.id] = p;
    }
    const yag = yagura(); yag.visible = false; fest.add(yag);
    const lin = lines(); lin.visible = false; root.add(lin);
    const dancers = []; for (let i = 0; i < 8; i++) { const p = makeDancer(i); p.root.visible = false; p.hidden = true; fest.add(p.root); dancers.push(p); }
    FW.group = new THREE.Group(); root.add(FW.group);
    B = { root, colliders, people, corner, drumSet, kid, kidN, gp, fest, stalls, keepers, yag, lin, dancers, gy, mimo2: null, yuk2: null, glows: [] };
    [fest, lin].forEach(g => g.traverse(o => { if (o.isMesh && o.material && o.material.isMeshBasicMaterial && o.material.vertexColors) B.glows.push(o); }));
    return { colliders, group: root, people, update };
  }
  // the festival's second Mimo (in its yukata): dances in the circle while the real one waits by you
  function mimo2() {
    if (B.mimo2 || typeof ACTORS === 'undefined' || !ACTORS.mimo) return B.mimo2;
    try { const m = ACTORS.mimo(); B.fest.add(m.root); m.root.visible = false; B.yuk2 = yukataOn(m.body); B.yuk2.visible = true; B.yuk2.show(['kiru', 'obi', 'geta', 'uchiwa']); B.mimo2 = m; } catch (e) { B.mimo2 = null; }
    return B.mimo2;
  }

  // ================================================================ every frame
  const FEST = { on: false, song: null, level: 0.38, duck: 0.12, stalls: null, yag: false, dance: null, gp: false, night: false, kidNight: false, mimo2: false, frozen: 0, lit: 1 };
  let idleT = 4, chimeT = 0;
  function update(dt, t, you) {
    if (!B) return;
    const on = shown() && !(G.indoors && G.indoors()), Y = G.sim.you, st = on ? S() : null;
    const near = on && (FEST.on || Math.hypot(Y.x - SPOT.kid.x, Y.z - SPOT.kid.z) < 170);
    B.root.visible = near;
    for (const c of B.colliders) { c.x = c.x0 + (on ? 0 : 1e5); c.z = c.z0; }
    B.kid.hidden = !on;
    wearables();
    if (!on) { ZHF.music.want('mt', null, 0); ZHF.music.frame(t); if (NIGHT.k > 0 || NIGHT.want) { NIGHT.want = 0; nightStep(dt); } return; }
    B.lin.visible = FEST.yag || !!st.ch[5];
    ZHF.music.want('mt', FEST.song, FEST.song ? FEST.level * (1 - 0.7 * FEST.frozen) : 0, { duck: FEST.duck, cut: lerp(16000, 900, FEST.frozen) }); ZHF.music.frame(t);
    nightStep(dt);
    if (!near) return;
    const k = B.kid, scene = typeof STORY !== 'undefined' && STORY.busy;
    // Natsu at her corner: drums on her bucket now and then (ドン ドン カッ), waves when you come close
    if (!FEST.on && !k.away) {
      const d = Math.hypot(Y.x - k.x, Y.z - k.z);
      if (!scene && (idleT -= dt) <= 0) { idleT = 4 + Math.random() * 5; k.pose = d < 7 ? 'wave' : 'drum'; k.poseT = d < 7 ? 1.4 : 2.4; }
      if (k.poseT > 0 && (k.poseT -= dt) <= 0) k.pose = 'idle';
      if (k.pose === 'drum' && d < 11 && (chimeT -= dt) <= 0) { chimeT = 0.36; sfx('wood'); }
      if (B.corner.children[1]) B.corner.children[1].rotation.z = Math.sin(t * 2.3) * 0.25;      // (the wind chime's paper strip)
    }
    ZHF.animate(k, dt, t, FEST.on ? null : you);
    if (B.kidN.root.visible) ZHF.animate(B.kidN, dt, t, null);
    if (B.gp.root.visible) ZHF.animate(B.gp, dt, t, null);
    if (FEST.on) { for (const id in B.keepers) { const p = B.keepers[id]; if (p.root.visible) ZHF.animate(p, dt, t, null); } danceStep(dt, t); }
    fwStep(dt); sparkStep(dt, t); MG.tick(dt, t);
  }
  // the bon-odori circle: everyone goes round counter-clockwise (seen from above); a call makes them all do it together
  function danceStep(dt, t) {
    const D = FEST.dance, list = B.dancers.filter(p => p.root.visible), m2 = FEST.mimo2 && B.mimo2;
    if (!D) { for (const p of list) ZHF.animate(p, dt, t, null); return; }
    if (!FEST.frozen) D.th -= dt * D.w;
    D.mt = Math.max(0, (D.mt || 0) - dt);
    const n = list.length + (m2 ? 1 : 0) + (D.kid ? 1 : 0), u = D.move ? 1 - D.mt / 1.2 : 0, R0 = D.r || DANCE_R;
    const all = list.slice(); if (D.kid) all.push(D.kid);
    all.forEach((p, i) => {
      const a = D.th + (i / n) * TAU, bump = D.move === 'right' ? Math.sin(u * Math.PI) * 0.7 : D.move === 'left' ? -Math.sin(u * Math.PI) * 0.7 : 0, r = R0 + bump;
      p.x = PLAZA.x + Math.cos(a) * r; p.z = PLAZA.z + Math.sin(a) * r; p.y = GYv();
      p.baseYaw = Math.atan2(Math.sin(a), -Math.cos(a)) + (D.move === 'turn' && D.mt > 0 ? u * TAU : 0); p.yaw = p.baseYaw; p.faceAt = null;
      p.pose = FEST.frozen > 0.5 ? 'sulk' : D.move === 'up' && D.mt > 0 ? 'cheer' : D.move === 'clap' && D.mt > 0 ? 'hold' : 'idle';
      p.hop = FEST.frozen > 0.5 ? 0 : Math.abs(Math.sin(t * 3.1 + i)) * 0.06;
      ZHF.animate(p, dt, t, null);
      if (p.pose === 'idle' && !FEST.frozen) { const s = Math.sin(t * 3.1 + i * 0.7); p.arms[0].rotation.x = -0.6 - s * 0.5; p.arms[1].rotation.x = -0.6 + s * 0.5; p.arms[0].rotation.z = -0.5; p.arms[1].rotation.z = 0.5; }
      if (p.pose === 'hold') { const c = Math.abs(Math.sin(t * 12)); p.arms[0].rotation.z = -0.1 - c * 0.35; p.arms[1].rotation.z = 0.1 + c * 0.35; }
      p.root.traverse(o => { if (o.material && o.material.color && o.userData.frozenOK === undefined) o.userData.frozenOK = true; });
    });
    if (m2) {
      const a = D.th + (n - 1) / n * TAU, M = B.mimo2;
      M.root.visible = true; M.root.position.set(PLAZA.x + Math.cos(a) * (R0 - 0.2), GYv() + Math.abs(Math.sin(t * 6.2)) * (FEST.frozen > 0.5 ? 0 : 0.12), PLAZA.z + Math.sin(a) * (R0 - 0.2));
      M.root.rotation.y = Math.atan2(Math.sin(a), -Math.cos(a)) + (D.move === 'turn' && D.mt > 0 ? u * TAU : 0);
      M.body.rotation.z = Math.sin(t * 3.1) * 0.12; M.ears.forEach((e, i) => { e.rotation.z = (i ? -1 : 1) * (D.move === 'up' && D.mt > 0 ? -0.4 : 0.15 + Math.sin(t * 5) * 0.1); });
    }
  }

  // ================================================================ the paper overlay (ZHF's #zf, with Japanese fonts): a drill and a lesson
  const CSS = `
#zf .zf-panel.mt-ja .zf-head { background: linear-gradient(90deg, #e9eefc, #fffaf0); }
#zf .zf-panel.mt-ja .zf-card .kind { color: #2f5fa8; }
#zf .zf-panel.mt-ja .zf-card .ph b, #zf .zf-panel.mt-ja .zf-card input, #zf .zf-panel.mt-ja .zf-bub, #zf .zf-panel.mt-ja .zf-card .hint, #zf .zf-panel.mt-ja .zf-card .ex { font-family: ${FONT}; }
#zf .zf-panel.mt-ja .zf-card .ph b { color: #2f5fa8; }
#zf .zf-panel.mt-ja button.go { background: #2f5fa8; } #zf .zf-panel.mt-ja button.go:hover { background: #3f6fc0; }
#zf .zf-panel.mt-ja .zf-head .dots i { border-color: #2f5fa8; } #zf .zf-panel.mt-ja .zf-head .dots i.f { background: #2f5fa8; }
.mt-sign { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.mt-sign .bn { min-width: 210px; padding: 8px 22px 10px; border: 3px solid #2b2235; border-radius: 10px; font: 900 40px ${BRUSH}; color: #1d1418; text-align: center; box-shadow: inset 0 0 0 6px rgba(255,255,255,.85); letter-spacing: .06em; }
.mt-sign .bn ruby rt, .mt-tile ruby rt { font: 700 13px ${FONT}; letter-spacing: 0; }
.mt-sign .sm { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
.mt-sign .sm span { background: #fffaf0; border: 2px solid #2b2235; border-radius: 8px; padding: 2px 10px; font: 800 20px ${FONT}; }
.mt-sign .ro { font: 700 13px "Segoe UI", sans-serif; opacity: .7; }
.mt-tile { display: flex; flex-direction: column; align-items: center; gap: 4px; font: 800 13px "Segoe UI", sans-serif; }
.mt-tile .ic { width: 74px; height: 74px; border-radius: 16px; border: 3px solid #2b2235; display: grid; place-items: center; font-size: 40px; background: #fffaf0; }
.mt-tile .jw { font: 800 22px ${FONT}; }
.mt-flag { width: 120px; height: 150px; border: 3px solid #2b2235; background: #fffaf2; display: grid; place-items: center; font: 900 92px ${BRUSH}; color: #d6232a; position: relative; overflow: hidden; }
.mt-flag:after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 34px; background: repeating-radial-gradient(circle at 10px 40px, #2f6fd0 0 6px, transparent 6px 14px); opacity: .7; }
.mt-score { font: 900 30px ${FONT}; letter-spacing: .08em; background: #fffaf0; border: 3px solid #2b2235; border-radius: 12px; padding: 8px 18px; box-shadow: 4px 4px 0 rgba(43,34,53,.18); }
.mt-score .rest { display: inline-block; width: 1.2em; text-align: center; color: #e0372c; }
`;
  const css = () => ZHF.css('mt-css', CSS);
  // a sign as HTML: the banner in the stall's colors (characters, ruby until known), its small print; rōmaji under it in rōmaji mode
  function signHTML(st, o = {}) {
    const ro = cmode() === 'roman' ? `<div class="ro">${esc(JR(st.sign))}${st.subs.length ? ' · ' + st.subs.map(s => esc(JR(s))).join(' · ') : ''}</div>` : '';
    return `<div class="mt-sign"><div class="bn" style="background:${st.awn}">${J(st.sign, { mode: 'chars', cap: false })}</div>${o.subs === false ? '' : `<div class="sm">${st.subs.map(s => `<span>${J(s, { mode: 'chars', cap: false })}</span>`).join('')}</div>`}${ro}</div>`;
  }
  const tileHTML = (icon, word, en, col) => `<div class="mt-tile"><div class="ic" style="${col ? 'background:' + col : ''}">${icon || ''}</div>${word ? `<div class="jw">${J(word, { cap: false })}</div>` : ''}${en ? `<small>${esc(en)}</small>` : ''}</div>`;
  const GRN = ['S', 'A', 'B', 'C', 'D'];
  const gradeOf = cleanList => { const n = cleanList.length || 1, k = cleanList.filter(Boolean).length / n; return k >= 0.999 ? 'S' : k >= 0.8 ? 'A' : k >= 0.6 ? 'B' : k >= 0.4 ? 'C' : 'D'; };
  // A drill: one step after another, each a row of tiles and a typed answer. step: { kind, tiles: [html], say: [ja, en], gl,
  // answer (notation) + alts, or check(text) → { ok, said, why }; spoken (digits for a number aren't clean), placeholder,
  // after (html), miss (html), then(r) }. o: { title, sub, who: { nameSrc, icon } } → { done, clean: [bool] } or { quit }.
  // Tests: DRILL.cur ({ answer, roman, submit(text), idk(), hint() }). Two misses (or ?) show the answer; it grades D.
  const DRILL = { cur: null, fast: false };
  async function drill(steps, o) {
    css();
    const html = `<div class="zf-head"><b>${esc(o.title)}</b><span class="t">${esc(o.sub || '')}</span><span class="dots"></span><button type="button" class="stop">Stop <kbd>Esc</kbd></button></div>
<div class="zf-lbody"><div class="zf-who"><canvas width="116" height="116"></canvas><div class="nm"></div><div class="zf-bub"></div></div>
<div class="zf-card"><div class="kind"></div><div class="tiles" style="display:flex;gap:14px;justify-content:center;align-items:flex-end;flex-wrap:wrap;padding:6px 0 2px"></div><div class="gl"></div>
<form autocomplete="off"><input spellcheck="false"><button type="submit" class="go">Say it</button></form><div class="hint"></div>
<div class="row"><button type="button" class="idk">I don’t know (?)</button><span>Tab: a hint · Esc: stop</span></div></div></div>`;
    let quit = false, cur = null;
    const panel = ZHF.open(html, e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); quit = true; cur && cur('quit'); } else if (e.key === 'Tab') { e.preventDefault(); e.stopPropagation(); DRILL.cur && DRILL.cur.hint(); } }, 'zf-drill mt-ja');
    const q = s => panel.querySelector(s), E = { dots: q('.dots'), bub: q('.zf-bub'), card: q('.zf-card'), kind: q('.kind'), tiles: q('.tiles'), gl: q('.gl'), form: q('form'), input: q('input'), hint: q('.hint'), idk: q('.idk') };
    ZHF.face(q('.zf-who canvas'), o.who.icon); q('.zf-who .nm').innerHTML = J(o.who.nameSrc); ZHF.ime(E.input);
    q('.stop').onclick = () => { quit = true; cur && cur('quit'); };
    // (by the weave like every line, DESIGN.md 17.3: mixed, whole in Japanese as the weave rises; its English on request, EN)
    const bub = (ja, en) => { if (ZHF.sayBub) ZHF.sayBub(E.bub, ja, en, E.input, J); else E.bub.innerHTML = ja ? J(ja) : ''; if (ja && cmode() === 'chars') try { CJK.seen(ja, { lang: 'ja' }); } catch (e) { /* */ } };
    const clean = [];
    try {
      for (let i = 0; i < steps.length && !quit; i++) {
        const s = steps[i];
        E.dots.innerHTML = steps.map((_, k) => `<i class="${k < i ? 'f' : ''} ${k === i ? 'now' : ''}"></i>`).join('');
        if (s.say) bub(s.say[0], s.say[1]);
        E.kind.textContent = s.kind || ''; E.card.classList.remove('ok'); E.tiles.innerHTML = (s.tiles || []).join(''); E.gl.innerHTML = s.gl || '';
        E.input.value = ''; E.input.placeholder = s.placeholder || (cmode() === 'chars' ? 'type in rōmaji (Space: kanji), then Enter' : 'say it in Japanese (rōmaji)…'); E.hint.className = 'hint plain'; E.hint.innerHTML = s.help || '';
        if (s.voice) setTimeout(() => sayVoice(s.voice), 200);
        setTimeout(() => E.input.focus(), 40);
        let tries = 0, shownAns = false;
        const ans = s.answer || '';
        const r = await new Promise(res => {
          cur = v => { cur = null; DRILL.cur = null; res(v); };
          const check = text => {
            const t = String(text || '').trim(); if (!t) return;
            if (!shownAns && idk(t) && ans) { DRILL.cur.idk(); return; }
            let ok = false, said = ans, note = '';
            if (s.check) { const c = s.check(t) || {}; ok = !!c.ok; said = c.said || ans; note = c.note || ''; if (!ok && c.why) { E.hint.className = 'hint'; E.hint.innerHTML = c.why; } }
            else { const list = [ans].concat(s.alts || []), m = heardAny(t, list); if (m) { ok = true; said = list[m.k]; if (m.digits && s.spoken) { note = `say it: ${J(said, { ruby: 'always' })}`; tries = Math.max(tries, 1); } else if (m.short) note = `(${esc(JR(said))})`; } }
            if (ok) {
              E.card.classList.add('ok'); sfx('review'); try { if (said) CJK.used(t, said, { lang: 'ja' }); } catch (e) { /* */ }
              E.hint.className = 'hint plain'; E.hint.innerHTML = '✓ ' + (said ? J(said) : '') + (note ? ' · ' + note : '') + (s.after ? ' · ' + s.after : '');
              const fin = () => cur && cur({ ok: true, clean: !tries && !shownAns, text: t }); if (DRILL.fast) fin(); else setTimeout(fin, 1150); return;
            }
            tries++; sfx('wrong');
            E.card.classList.remove('shake'); void E.card.offsetWidth; E.card.classList.add('shake');
            if (!(s.check && E.hint.className === 'hint')) { E.hint.className = 'hint'; E.hint.innerHTML = ans && (tries >= 2 || shownAns) ? 'It’s ' + J(ans, { ruby: 'always' }) + ' (' + esc(JR(ans)) + ')' : (s.miss || 'Not quite. Try again! (Tab: a hint)'); }
            if (tries >= 2 && ans) shownAns = true;
            E.input.select();
          };
          DRILL.cur = { answer: ans ? JC(ans) : (s.testAnswer || ''), roman: ans ? JR(ans) : (s.testAnswer || ''), submit: check,
            idk() { if (!ans) return; shownAns = true; E.hint.className = 'hint'; E.hint.innerHTML = 'Here: ' + J(ans, { ruby: 'always' }) + ' (' + esc(JR(ans)) + '). Type it!'; sayVoice(ans); E.input.focus(); },
            hint() { if (!ans) return; E.hint.className = 'hint'; E.hint.innerHTML = esc(hintOf(ans, 2)); } };
          E.form.onsubmit = e => { e.preventDefault(); check(E.input.value); };
          E.idk.onclick = () => DRILL.cur && DRILL.cur.idk();
        });
        if (r === 'quit' || quit) return { quit: true };
        clean.push(r.clean); if (s.then) s.then(r);
      }
      return { done: true, clean };
    } finally { DRILL.cur = null; ZHF.close(); }
  }
  // the Phrasebook: into LEX (stage 3, its own review pushed far off: Natsu quizzes you instead), ja only
  function phrases() {
    if (typeof LEX === 'undefined' || !LEX.register) return;
    LEX.register(PH.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', ja: p.ja, en: p.en, note: p.note, region: p.region, register: p.register, icon: p.icon, alt: { ja: p.alt || [] } })));
    LEX.register(ITEMS.filter(it => !LEX.item(it.id)).map(it => Object.assign({}, it)));
  }
  function teach(id) {
    if (typeof LEX === 'undefined' || !LEX.item(id) || LEX.lang !== 'ja') return;
    const s = LEX.st(id), t = Date.now() / 1000; LEX.expose(id);
    if (s.stage < 3) s.stage = 3; s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 30 * 86400; s.last = t;
  }
  function keepFar() {
    if (typeof LEX === 'undefined' || LEX.lang !== 'ja') return;
    const t = Date.now() / 1000;
    for (const p of PH) { if (!LEX.item(p.id)) continue; const s = LEX.st(p.id); if (s.stage >= 2 && s.due < t + 86400) { s.due = t + 30 * 86400; s.str = Math.max(s.str || 0, 30 * 86400); } }
  }
  const teachAll = ids => { ids.forEach(teach); const n = ids.filter(id => PHI[id]).length; if (n) UI.toast(`${n === 1 ? 'A new phrase' : n + ' new phrases'} in your Phrasebook (journal)`); };
  // a phrase lesson: each phrase copied once (echo), then all of them from a situation (recall), in one drill
  function lesson(ids, o) {
    const items = ids.map(id => PHI[id]), steps = [];
    items.forEach((p, i) => steps.push({ kind: 'New · type it to learn it', tiles: [`<div class="mt-tile"><div class="jw" style="font-size:34px">${J(p.ja, { ruby: 'always' })}</div><small>“${esc(p.en)}”</small></div>`],
      gl: `<div style="font-size:14px;opacity:.8">${esc(p.note)}</div>`, answer: p.ja, alts: p.alt, voice: p.ja, placeholder: JP(p.ja), say: i === 0 && o.intro ? o.intro : null }));
    shuffle(items.slice()).forEach((p, i) => steps.push({ kind: 'From memory · what do you say?', tiles: [], gl: `<div style="font-size:19px;font-weight:800">${esc(p.sit)}</div>`, answer: p.ja, alts: p.alt,
      say: i === 0 ? ['[今|いま] は 、 [見|み]ないで ！', 'Now, without looking!'] : null }));
    return drill(steps, o).then(r => { if (!r.quit) ids.forEach(teach); return r; });
  }

  // ================================================================ the call HUD: a small panel at the bottom, the festival in view
  const HUD_CSS = `
#mthud { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 11; width: min(600px, calc(100vw - 24px)); background: #fffaf0; border: 3px solid #2b2235; border-radius: 18px;
  box-shadow: 0 0 0 5px #fff, 0 10px 0 4px rgba(43,34,53,.22); padding: 10px 14px 12px; font-family: "Trebuchet MS", "Segoe UI", sans-serif; color: #2b2235; }
#mthud.hidden, #mthud .hidden { display: none !important; } #mthud * { box-sizing: border-box; }
#mthud .hd { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #2f5fa8; }
#mthud .cue { display: flex; align-items: center; gap: 12px; margin-top: 3px; }
#mthud .ic { width: 62px; height: 62px; border-radius: 14px; background: #2f5fa8; color: #fffaf0; display: grid; place-items: center; font: 900 34px ${FONT}; border: 3px solid #2b2235; flex: 0 0 auto; box-shadow: inset 0 0 0 3px #ffcf3f; }
#mthud .t { font: 800 21px ${FONT}; line-height: 1.5; } #mthud .t small { font: 700 13px "Segoe UI", sans-serif; opacity: .7; } #mthud .sub { font-size: 13px; font-weight: 700; opacity: .7; }
#mthud ruby rt { font: 700 .5em/1 ${FONT}; color: #2f5fa8; }
#mthud form { display: flex; gap: 8px; margin-top: 8px; }
#mthud input { flex: 1; min-width: 0; font: 600 22px ${FONT}; padding: 5px 10px; border: 2.5px solid #2b2235; border-radius: 12px; outline: none; } #mthud input:focus { box-shadow: 0 0 0 3px rgba(47,95,168,.3); }
#mthud button { font: inherit; font-weight: 800; font-size: 15px; color: #2b2235; border: 2.5px solid #2b2235; border-radius: 12px; padding: 4px 12px; background: #fffaf0; cursor: pointer; } #mthud button.go { background: #2f5fa8; color: #fff; }
#mthud .picks { display: flex; gap: 8px; margin-top: 8px; justify-content: center; } #mthud .picks button { font-size: 30px; padding: 4px 14px; } #mthud .picks button small { display: block; font: 800 11px "Segoe UI", sans-serif; opacity: .6; }
#mthud .fb { min-height: 22px; margin-top: 6px; font-weight: 800; font-size: 15px; line-height: 1.6; } #mthud .fb.ok { color: #13786b; } #mthud .fb.no { color: #c8322a; }
#mthud .bar { height: 10px; border-radius: 99px; background: rgba(43,34,53,.12); overflow: hidden; margin-top: 7px; } #mthud .bar b { display: block; height: 100%; background: #ffcf3f; transition: width .3s; }
#mthud .gr { float: right; font: 900 20px Bahnschrift, sans-serif; color: #fff; padding: 0 10px; border-radius: 10px; border: 2.5px solid #2b2235; } #mthud .gr.S { background: #e0a020; } #mthud .gr.A { background: #21a493; } #mthud .gr.B { background: #3f7fc9; } #mthud .gr.C { background: #8a5ab0; } #mthud .gr.D { background: #8a8f9e; }
#mtmg { position: fixed; left: 50%; top: 10px; transform: translateX(-50%); z-index: 11; background: #fffaf0; border: 3px solid #2b2235; border-radius: 18px; padding: 8px; box-shadow: 0 0 0 5px #fff, 0 10px 0 4px rgba(43,34,53,.22); }
#mtmg.hidden { display: none; } #mtmg canvas { display: block; border-radius: 12px; width: min(560px, calc(100vw - 40px)); height: auto; }
#mtmg .mt-cap { font: 800 12px "Segoe UI", sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #2f5fa8; margin: 0 4px 4px; display: flex; justify-content: space-between; }
body.mt-hud .bubble, body.mt-hud #thought, body.mt-hud .prompt, body.mt-hud #objective, body.mt-hud #minimap, body.mt-hud #compass { display: none !important; }
`;
  const HUD = { el: null, res: null, cur: null, keys: null, q: null };
  function hudOpen(title) {
    ZHF.css('mthud-css', HUD_CSS);
    if (!HUD.el) {
      const el = document.createElement('div'); el.id = 'mthud'; el.className = 'hidden';
      el.innerHTML = `<div class="hd"></div><div class="cue"><div class="ic"></div><div><div class="t"></div><div class="sub"></div></div></div><form autocomplete="off"><input spellcheck="false"><button type="submit" class="go">Call it!</button><button type="button" class="help">?</button></form><div class="picks hidden"></div><div class="fb"></div><div class="bar"><b></b></div>`;
      document.body.appendChild(el); HUD.el = el;
      const q = s => el.querySelector(s); HUD.q = { hd: q('.hd'), ic: q('.ic'), t: q('.t'), sub: q('.sub'), form: q('form'), input: q('input'), help: q('.help'), picks: q('.picks'), fb: q('.fb'), bar: q('.bar b') };
      ZHF.ime(HUD.q.input);
      HUD.q.form.addEventListener('submit', e => { e.preventDefault(); const r = HUD.res; if (r) { HUD.res = null; r(HUD.q.input.value); } });
      HUD.q.help.onclick = () => { if (HUD.cur) HUD.cur.help(); HUD.q.input.focus(); };
    }
    HUD.q.hd.textContent = title || ''; HUD.el.classList.remove('hidden'); document.body.classList.add('mt-hud'); hudFb(''); hudMode(true);
    if (HUD.keys) removeEventListener('keydown', HUD.keys, true);
    HUD.keys = e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); const r = HUD.res; if (r) { HUD.res = null; r('\u0000quit'); } return; }
      if (HUD.onKey && HUD.onKey(e)) { e.preventDefault(); e.stopPropagation(); }
    };
    addEventListener('keydown', HUD.keys, true);
    Input.typing = true; if (G) { G.state.teaching = true; G.prompt = null; }
  }
  function hudClose() {
    if (!HUD.el) return;
    HUD.el.classList.add('hidden'); document.body.classList.remove('mt-hud');
    if (HUD.keys) { removeEventListener('keydown', HUD.keys, true); HUD.keys = null; }
    HUD.onKey = null; HUD.cur = null; HUD.res = null;
    Input.typing = false; if (G) G.state.teaching = false;
    if (cj() && CJK.ime && CJK.ime.box) CJK.ime.box.style.display = 'none';
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function hudCue(o) { const Q = HUD.q; Q.ic.innerHTML = o.icon || '祭'; Q.t.innerHTML = o.title || ''; Q.sub.innerHTML = o.sub || ''; Q.bar.style.width = Math.round((o.bar || 0) * 100) + '%'; }
  const hudFb = (html, ok) => { HUD.q.fb.className = 'fb ' + (ok === undefined ? '' : ok ? 'ok' : 'no'); HUD.q.fb.innerHTML = html || ''; };
  const hudMode = typing => { HUD.q.form.classList.toggle('hidden', !typing); HUD.q.picks.classList.toggle('hidden', typing); };
  // ask for one call until it's said (or shown, then moved on): → 'S'…'D', or 'quit' / 'over'. list: [notation…];
  // o.check(text) → { ok, said, why } replaces the matching; o.drum: compared as 口唱歌 (rōmaji, っ optional)
  async function hudCall(list, en, o = {}) {
    const Q = HUD.q, src = list[0];
    let tries = 0, shownA = false;
    hudMode(true); Q.input.value = ''; Q.input.placeholder = o.placeholder || (cmode() === 'chars' ? 'type in rōmaji (Space: kanji)…' : 'call it in Japanese…'); setTimeout(() => Q.input.focus(), 30);
    HUD.cur = { answer: src ? JC(src) : (o.testAnswer || ''), roman: src ? JR(src) : (o.testAnswer || ''), help() { if (!src) return; shownA = true; hudFb(`Say ${J(src, { ruby: 'always' })} <small>(${esc(JR(src))})</small>${en ? ' · ' + esc(en) : ''}`); sayVoice(src); } };
    for (;;) {
      const text = await new Promise(r => { HUD.res = r; });
      if (text && text[0] === '\u0000') { HUD.cur = null; return text.slice(1); }
      const t = String(text || '').trim(); if (!t) continue;
      if (idk(t)) { HUD.cur && HUD.cur.help(); Q.input.value = ''; continue; }
      let ok = false, said = src, why = '';
      if (o.check) { const c = o.check(t) || {}; ok = !!c.ok; said = c.said || src; why = c.why || ''; }
      else if (o.drum) { const k = drumKey(t); const m = list.findIndex(s => drumKey(s) === k); ok = m >= 0; if (ok) said = list[m]; }
      else { const m = heardAny(t, list); ok = !!m; if (ok) said = list[m.k]; }
      if (ok) {
        const g = tries >= 2 ? 'D' : GRN[Math.min(4, (shownA ? 2 : 0) + tries)];       // (two misses: it was shown to you, so D)
        try { CJK.used(t, said, { lang: 'ja' }); } catch (e) { /* */ } sfx(g === 'S' ? 'perfect' : 'review');
        hudFb(`<span class="gr ${g}">${g}</span>✓ ${J(said)}`, true); Q.input.value = ''; HUD.cur = null; return g;
      }
      tries++; sfx('wrong');
      if (tries >= 3 && src) { hudFb(`<span class="gr D">D</span>It’s ${J(src, { ruby: 'always' })} (${esc(JR(src))}). On we go!`, false); Q.input.value = ''; HUD.cur = null; await wait(DRILL.fast ? 0.05 : 1.2); return 'D'; }
      hudFb((why ? why + ' ' : '') + (tries >= 2 && src ? `Try ${J(src, { ruby: 'always' })} (${esc(JR(src))})` : why ? '' : 'Not that one! (? shows it)'), false); Q.input.select();
    }
  }
  // listen and do (TPR): the call is shown in Japanese; press the move it means (1–5, the arrows, Space) → 'S'…'D' or 'quit'
  async function hudPick(right, opts) {
    const Q = HUD.q; hudMode(false); let tries = 0;
    Q.picks.innerHTML = opts.map((m, i) => `<button type="button" data-i="${i}">${m.icon}<small>${i + 1}</small></button>`).join('');
    const r = await new Promise(res => {
      const choose = i => { if (opts[i] === right) { HUD.onKey = null; res('ok'); return; } tries++; sfx('wrong'); hudFb(tries >= 2 ? `It means: ${esc(right.en)}` : 'Not that move! Read the call again.', false); };
      Q.picks.querySelectorAll('button').forEach(b => { b.onclick = () => choose(+b.dataset.i); });
      HUD.onKey = e => { if (e.key === 'Escape') return false; const i = /^Digit[1-9]$/.test(e.code) ? +e.code.slice(-1) - 1 : opts.findIndex(m => m.key === e.code); if (i >= 0 && i < opts.length) { choose(i); return true; } return false; };
      HUD.res = v => { HUD.onKey = null; res(v && v[0] === '\u0000' ? v.slice(1) : 'ok'); };
      HUD.pick = () => choose(opts.indexOf(right));
    });
    HUD.pick = null; hudMode(true);
    if (r === 'quit') return 'quit';
    const g = GRN[Math.min(4, tries * 2)]; sfx(g === 'S' ? 'perfect' : 'review'); hudFb(`<span class="gr ${g}">${g}</span>✓ ${esc(right.en)}`, true);
    return g;
  }

  // ================================================================ the game panel (a canvas above the HUD): the festival games
  const MG = { el: null, cv: null, c: null, draw: null, t: 0, cap: null,
    tick(dt) { if (this.draw && this.el && !this.el.classList.contains('hidden')) { this.t += dt; try { this.draw(this.c, this.t, dt); } catch (e) { console.error('[matsuri] game', e); this.draw = null; } } } };
  function mgOpen(title, draw, right = '') {
    ZHF.css('mthud-css', HUD_CSS);
    if (!MG.el) { const el = document.createElement('div'); el.id = 'mtmg'; el.className = 'hidden'; el.innerHTML = '<div class="mt-cap"><span class="l"></span><span class="r"></span></div><canvas width="560" height="300"></canvas>'; document.body.appendChild(el); MG.el = el; MG.cv = el.querySelector('canvas'); MG.c = MG.cv.getContext('2d'); MG.cap = { l: el.querySelector('.l'), r: el.querySelector('.r') }; }
    MG.cap.l.textContent = title || ''; MG.cap.r.textContent = right; MG.draw = draw; MG.t = 0; MG.el.classList.remove('hidden'); draw(MG.c, 0, 0);
  }
  const mgRight = s => { if (MG.cap) MG.cap.r.textContent = s || ''; };
  function mgClose() { if (MG.el) MG.el.classList.add('hidden'); MG.draw = null; }
  // canvas bits: water, a goldfish, a water balloon, a prize
  function water(c, x, y, w, h, round) { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#7fd0f0'); g.addColorStop(1, '#2f8fd6'); c.fillStyle = g; c.beginPath(); if (round) c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, TAU); else c.rect(x, y, w, h); c.fill(); c.lineWidth = 6; c.strokeStyle = '#2b2235'; c.stroke(); }
  function fishShape(c, f, s = 1) {
    c.save(); c.translate(f.x, f.y); c.rotate(f.a); c.scale(s, s);
    c.fillStyle = f.col; c.strokeStyle = '#2b2235'; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-10, 0); c.lineTo(-20, -7 + Math.sin(f.w) * 3); c.lineTo(-20, 7 + Math.sin(f.w) * 3); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(0, 0, 12, 6.5, 0, 0, TAU); c.fill(); c.stroke();
    c.fillStyle = f.black ? '#fffaf0' : '#2b2235'; for (const s2 of [-1, 1]) { c.beginPath(); c.arc(7, s2 * 3.6, f.black ? 2.6 : 1.4, 0, TAU); c.fill(); }
    c.restore();
  }
  function balloon(c, x, y, r, col, lift) {
    c.fillStyle = col; c.strokeStyle = '#2b2235'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2.5; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(x - r * 0.9, y + k * r * 0.4); c.quadraticCurveTo(x, y + k * r * 0.4 - 6, x + r * 0.9, y + k * r * 0.4); c.stroke(); }
    c.strokeStyle = '#2b2235'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y - r); c.lineTo(x, y - r - 10 - (lift || 0)); c.stroke(); c.beginPath(); c.arc(x, y - r - 12 - (lift || 0), 3, 0, TAU); c.stroke();
  }
  function prizeShape(c, p, x, y, s) {
    c.fillStyle = p.col; c.strokeStyle = '#2b2235'; c.lineWidth = 2;
    if (/くま/.test(p.ja)) { for (const [dx, dy, r] of [[-11, -16, 7], [11, -16, 7], [0, -6, 14], [0, 16, 17]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, TAU); c.fill(); c.stroke(); } c.fillStyle = '#2b2235'; c.fillRect(x - 6 * s, y - 9 * s, 3 * s, 3 * s); c.fillRect(x + 3 * s, y - 9 * s, 3 * s, 3 * s); return; }
    if (/ロボット/.test(p.ja)) { c.fillRect(x - 13 * s, y - 2 * s, 26 * s, 28 * s); c.strokeRect(x - 13 * s, y - 2 * s, 26 * s, 28 * s); c.fillRect(x - 10 * s, y - 22 * s, 20 * s, 18 * s); c.strokeRect(x - 10 * s, y - 22 * s, 20 * s, 18 * s); c.fillStyle = '#ffd23f'; c.fillRect(x - 6 * s, y - 16 * s, 4 * s, 4 * s); c.fillRect(x + 2 * s, y - 16 * s, 4 * s, 4 * s); return; }
    if (/ラムネ/.test(p.ja)) { c.beginPath(); c.moveTo(x - 9 * s, y + 26 * s); c.lineTo(x - 9 * s, y - 2 * s); c.lineTo(x - 4 * s, y - 14 * s); c.lineTo(x - 4 * s, y - 24 * s); c.lineTo(x + 4 * s, y - 24 * s); c.lineTo(x + 4 * s, y - 14 * s); c.lineTo(x + 9 * s, y - 2 * s); c.lineTo(x + 9 * s, y + 26 * s); c.closePath(); c.fill(); c.stroke(); return; }
    if (/けん/.test(p.ja)) { c.beginPath(); c.moveTo(x, y + 26 * s); c.lineTo(x, y - 6 * s); c.lineWidth = 5 * s; c.strokeStyle = '#c9955a'; c.stroke(); c.lineWidth = 2; c.strokeStyle = '#2b2235'; c.fillStyle = '#c9955a'; c.fillRect(x - 12 * s, y + 2 * s, 24 * s, 6 * s); c.strokeRect(x - 12 * s, y + 2 * s, 24 * s, 6 * s); c.fillStyle = p.col; c.beginPath(); c.arc(x, y - 16 * s, 11 * s, 0, TAU); c.fill(); c.stroke(); return; }
    if (/めん/.test(p.ja)) { c.save(); c.translate(x, y + 4 * s); c.scale(s * 0.42, s * 0.42); c.drawImage(maskTex().image, -64, -78); c.restore(); return; }
    if (/シャボン/.test(p.ja)) { c.fillRect(x - 8 * s, y - 2 * s, 16 * s, 28 * s); c.strokeRect(x - 8 * s, y - 2 * s, 16 * s, 28 * s); c.strokeStyle = 'rgba(80,160,220,.9)'; for (const [dx, dy, r] of [[-8, -14, 6], [6, -22, 8], [12, -8, 4]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, TAU); c.stroke(); } return; }
    if (/[風車]|かざぐるま/.test(p.ja)) { c.beginPath(); c.moveTo(x, y + 4 * s); c.lineTo(x, y + 28 * s); c.stroke(); for (let k = 0; k < 4; k++) { c.save(); c.translate(x, y - 6 * s); c.rotate(k * Math.PI / 2 + MG.t * 3); c.beginPath(); c.moveTo(0, 0); c.lineTo(16 * s, -4 * s); c.lineTo(10 * s, 10 * s); c.closePath(); c.fillStyle = ['#ff6b8a', '#ffd23f', '#7fd6ef', '#8fe08a'][k]; c.fill(); c.stroke(); c.restore(); } return; }
    c.beginPath(); c.roundRect ? c.roundRect(x - 16 * s, y - 14 * s, 32 * s, 38 * s, 6 * s) : c.rect(x - 16 * s, y - 14 * s, 32 * s, 38 * s); c.fill(); c.stroke();
  }

  // ================================================================ the scenes: lines, shots, standing places
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const shot = (p, l) => { G.cam.override = { pos: V3(p[0], p[1], p[2]), look: V3(l[0], l[1], l[2]) }; };
  const lock = on => { if (G) G.sim.lock = on ? 1 : 0; };
  const front = (p, d) => ({ x: p.x + Math.sin(p.baseYaw) * d, z: p.z + Math.cos(p.baseYaw) * d });
  // one of ours says a line: the whole line in Japanese, the English under it (STORY.sayInline, «full»)
  function say(p, key, vars) {
    if (!p || typeof STORY === 'undefined') return Promise.resolve();
    const L0 = typeof key === 'string' ? lineOf(key) : { ja: key[0], en: key[1] };
    let ja = L0.ja, en = L0.en; if (vars) for (const [a, b] of Object.entries(vars)) { ja = ja.split('{' + a + '}').join(b); en = en.split('{' + a + '}').join(b); }
    p.name = JP(p.nameSrc || ''); p.lines = { en, ja }; p.top = p.top || 2.1;
    return STORY.sayInline(p, true);
  }
  const kidP = () => (B.kidN.root.visible ? B.kidN : B.kid);
  const kidSay = (key, vars) => say(kidP(), key, vars);
  const gpSay = key => say(B.gp, key);
  const keeperSay = (id, key) => say(B.keepers[STALL[id].keeper], key);
  const you = text => STORY.you(text), think = (text, s) => STORY.think(text, s);
  function placeYou(at, look, mimoSide = 1) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = at.x; Y.z = at.z; Y.yaw = Math.atan2(look.x - at.x, look.z - at.z);
    const sx = Math.cos(Y.yaw) * 0.85 * mimoSide, sz = -Math.sin(Y.yaw) * 0.85 * mimoSide;
    M.x = at.x + sx + Math.sin(Y.yaw) * 0.3; M.z = at.z + sz + Math.cos(Y.yaw) * 0.3; M.station = null; M.wander = null; M.look = { x: look.x, z: look.z };
    [Y.x, Y.z] = WORLD.pushOut(Y.x, Y.z, 0.4); [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3); G.sim.snap();
  }
  function standBy() { const k = B.kid, f = front(k, 2.1); placeYou(f, k); }
  function shotKid() { const k = kidP(), f = front(k, 3.5), s = { x: Math.cos(k.baseYaw) * 1.4, z: -Math.sin(k.baseYaw) * 1.4 }; shot([f.x + s.x, k.y + 1.8, f.z + s.z], [k.x, k.y + 0.85, k.z]); }
  async function scene(fn) {
    lock(true);
    try { await fn(); } catch (e) { console.error('[matsuri] scene', e); }
    finally { G.cam.override = null; lock(false); if (G.sim.mimo) G.sim.mimo.look = null; if (!FEST.on) G.fx.hush = 0; if (G.save) G.save(); }
  }
  const coins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; sfx('chest'); UI.toast(`${why}: +${n} coins`); };
  const bag = id => { G.state.bag = G.state.bag || {}; G.state.bag[id] = 1; const it = ITEMS.find(i => i.id === id); if (it) UI.toast(`Key item: ${JP(it.ja)} (${it.en})`); };
  const WHO = { nameSrc: NAMES.kid, icon: 'mtKid' };
  const mimoVis = on => { try { G.cast.mimo.root.visible = on; G.cast.mimoShadow.visible = on; G.sim.mimo.hidden = !on; } catch (e) { /* */ } };
  const mimoHop = () => { const M = G.sim.mimo; M.happy = 1.5; M.glow = 1; try { G.w3d.fx.sparkle(M.x, M.ry + 0.8, M.z, 14, ['#ffd23f', '#ff8cc6']); } catch (e) { /* */ } };
  // the festival on and off: which stalls stand, the yagura, the night, the kid's look, the song
  function festOn(o = {}) {
    FEST.on = true; B.fest.visible = true;
    for (const st of STALLS) { const v = !!(o.stalls && o.stalls.includes(st.id)); B.stalls[st.id].visible = v; const p = B.keepers[st.id]; p.root.visible = v; p.hidden = !v; }
    B.yag.visible = FEST.yag = !!o.yag;
    B.dancers.forEach((p, i) => { const v = i < (o.dancers || 0); p.root.visible = v; p.hidden = !v; });
    FEST.dance = o.dancers || o.kidDance ? { th: Math.PI / 2, w: 0.16, move: null, mt: 0, kid: null, r: o.yag ? DANCE_R : 4.6 } : null;
    FEST.mimo2 = !!o.mimo2; if (o.mimo2) { mimo2(); if (B.mimo2) B.mimo2.root.visible = true; mimoVis(false); }
    FEST.night = !!o.night; NIGHT.want = o.night ? 1 : 0; if (o.night && !o.slowNight) NIGHT.k = 1;
    B.kidN.root.visible = !!o.kidNight; B.kidN.hidden = !o.kidNight; B.kid.root.visible = !o.kidNight; B.kid.away = true;
    FEST.song = o.song || null; FEST.level = o.level || 0.38; FEST.duck = o.duck === undefined ? 0.12 : o.duck; FEST.frozen = 0;
    if (o.gp) { const p = B.gp; p.root.visible = true; p.hidden = false; Object.assign(p, o.gp); p.yaw = p.baseYaw = o.gp.yaw || 0; }
  }
  function festOff() {
    FEST.on = false; FEST.dance = null; FEST.song = null; FEST.frozen = 0; FEST.yag = false; B.fest.visible = false; NIGHT.want = 0; NIGHT.k = 0;
    for (const st of STALLS) { B.stalls[st.id].visible = false; const p = B.keepers[st.id]; p.root.visible = false; p.hidden = true; }
    B.dancers.forEach(p => { p.root.visible = false; p.hidden = true; });
    if (B.mimo2) B.mimo2.root.visible = false; FEST.mimo2 = false; mimoVis(true);
    B.kidN.root.visible = false; B.kidN.hidden = true; B.gp.root.visible = false; B.gp.hidden = true;
    const k = B.kid; k.root.visible = true; k.away = false; k.x = SPOT.kid.x; k.z = SPOT.kid.z; k.y = B.gy(k.x, k.z); k.yaw = k.baseYaw = SPOT.kid.yaw; k.faceAt = null; k.pose = 'idle'; k.hop = 0;
    SK.on = false; G.fx.hush = 0; mgClose(); hudClose();
  }
  // Natsu walks (well, appears) next to you in the plaza
  function kidTo(x, z, yaw) { const k = kidP(); k.x = x; k.z = z; k.y = GYv(); k.yaw = k.baseYaw = yaw; k.faceAt = null; }

  // ================================================================ meeting Natsu
  const enM = s => String(s).replace(/\{mimo\}/g, (G && G.state.mimoName) || 'Mimo');
  async function meet() {
    const st = S();
    await scene(async () => {
      standBy(); shotKid();
      const k = B.kid; k.pose = 'drum'; await kidSay('mt.drum'); k.pose = 'cheer';
      await kidSay('mt.hi'); k.pose = 'idle'; await kidSay('mt.name'); await kidSay('mt.love');
      shot([SPOT.kid.x + 5.5, GYv() + 3.2, SPOT.kid.z + 7.5], [PLAZA.x - 6, GYv() + 1.5, PLAZA.z - 8]);
      await kidSay('mt.quiet'); shotKid(); k.pose = 'cheer'; await kidSay('mt.plan'); await kidSay('mt.list'); k.pose = 'idle';
      await kidSay('mt.help');
      await you('A festival loud enough to scare off the Hush? Count me in!');
      k.pose = 'cheer'; await kidSay('mt.yay'); k.pose = 'idle';
      st.met = true;
    });
    if (!CH[0].gate(flags())) { think(`Natsu: «${JP('[準備中|じゅんびちゅう] ！')}» (still getting ready!): come back ${CH[0].wait}.`, 4); return; }
    const go = await UI.choose(`${JP(NAMES.kid)}: «${JP('[行|い]こう ！')}» (Let’s go!)`, [{ label: `Chapter 1: ${CH[0].title}`, sub: CH[0].sub, value: 1 }, { label: 'Later', value: 0 }]);
    if (go) await chapter1();
  }

  // ================================================================ chapter 1: the food stalls (屋台)
  // At each stall: you stand in front of it (inside the plaza), Natsu at your side; the keeper says hello, then a drill:
  // read the sign, order, react. Then the keeper hands it over and {mimo} has a taste.
  function atStall(id) {
    const s = STALL[id], me = ringAt(s.ang, 7.4), kd = ringAt(s.ang - 4.5, 8.1), cam = ringAt(s.ang + 3, 3.9);
    placeYou(me, s, -1); kidTo(kd.x, kd.z, Math.atan2(s.x - kd.x, s.z - kd.z));
    shot([cam.x, GYv() + 2.4, cam.z], [s.x, GYv() + 1.2, s.z]);
  }
  function mimoShot() {
    const M = G.sim.mimo, Y = G.sim.you, d = Math.hypot(PLAZA.x - M.x, PLAZA.z - M.z) || 1, ux = (PLAZA.x - M.x) / d, uz = (PLAZA.z - M.z) / d;
    shot([M.x + ux * 2.1 - uz * 0.6, GYv() + 1.25, M.z + uz * 2.1 + ux * 0.6], [lerp(M.x, Y.x, 0.3), GYv() + 0.55, lerp(M.z, Y.z, 0.3)]);
  }
  const STEPS1 = {
    tako: () => [
      { kind: 'Read the sign · how many in one order?', tiles: [signHTML(STALL.tako)], say: ['たこ[焼|や]き は [何個|なんこ] ？ [看板|かんばん] を [読|よ]んで ！', 'How many takoyaki in one? Read the sign!'],
        gl: 'Small round things are counted with 個 (こ): いっこ, にこ, さんこ, よんこ, ごこ, ろっこ, ななこ, <b>はっこ</b>…', answer: 'はっこ', alts: ['はちこ'], spoken: true, placeholder: '…こ', after: '8こ = はっこ' },
      { kind: 'Read the price', tiles: [signHTML(STALL.tako)], say: ['いくら ？', 'How much?'], gl: '百 (ひゃく) is a hundred: ひゃく, にひゃく, さんびゃく, よんひゃく…', answer: '[四百|よんひゃく] [円|えん]', alts: ['よんひゃく'], spoken: true, placeholder: '… えん' },
      { kind: 'Order two', tiles: [tileHTML('🐙', 'たこ[焼|や]き', '× 2')], say: ['ふたつ [頼|たの]んで ！ わたし の と 、 {mimo} の ！', 'Order two! One for me and one for {mimo}!'],
        gl: 'Thing + を + how many + ください', answer: 'たこ[焼|や]き を ふたつ ください 。', alts: ['ふたつ ください 。'], spoken: true },
      { kind: 'Ouch! Say it', tiles: [tileHTML('🔥', '', 'straight off the griddle')], say: ['あ ！ まるごと [食|た]べた ！', 'Oh! You ate one whole!'], gl: 'Hot is あつい. The yelp when it burns your tongue: <b>あつっ！</b>', answer: 'あつっ ！', alts: ['あつい ！'] },
    ],
    soba: () => [
      { kind: 'Read the sign · what do they sell?', tiles: [signHTML(STALL.soba, { subs: false })], say: ['この [屋台|やたい] は [何|なに] ？', 'What’s this stall?'], gl: '焼 (や) means grilled; そば, noodles.', answer: '[焼|や]きそば' },
      { kind: 'Order three', tiles: [tileHTML('🍜', '[焼|や]きそば', '× 3')], say: ['{mimo} の ぶん も ！ みっつ [頼|たの]んで ！', 'One for {mimo} too! Order three!'], answer: '[焼|や]きそば を みっつ ください 。', alts: ['みっつ ください 。'], spoken: true },
      { kind: 'Taste it, then tell the cook', tiles: [tileHTML('😋')], say: ['[食|た]べて みて ！ どう ？', 'Try it! How is it?'], gl: 'Yummy! = <b>おいしい！</b>', answer: 'おいしい ！' },
    ],
    kori: () => [
      { kind: 'Read the flag', tiles: ['<div class="mt-flag">氷</div>'], say: ['あの [旗|はた] 、 なんて [読|よ]む ？', 'How do you read that flag?'], gl: 'This flag flies wherever there’s shaved ice in summer. 氷 means ice.', answer: '[氷|こおり]', placeholder: 'k…' },
      { kind: 'Order two flavors', tiles: [signHTML(STALL.kori)].concat(FLAVORS.slice(0, 2).map(f => tileHTML('🍧', f.ja, f.en, f.col))), say: ['わたし は いちご ！ それ と 、 メロン も [頼|たの]んで ！', 'Strawberry for me! And order a melon one too!'],
        gl: 'Join two things with と: A を ひとつ と 、 B を ひとつ ください', answer: 'いちご を ひとつ と 、 メロン を ひとつ ください 。', alts: ['いちご と メロン を ひとつ ずつ ください 。', 'いちご と メロン を ください 。'], spoken: true },
      { kind: 'Order {mimo}’s', tiles: [tileHTML('🍧', 'ブルーハワイ', 'Blue Hawaii', '#9fd0ff')], say: ['{mimo} は … [青|あお]い の ？ ブルーハワイ だ ！', '{mimo} wants… the blue one? Blue Hawaii!'], answer: 'ブルーハワイ を ひとつ ください 。', alts: ['ブルーハワイ を ください 。'], spoken: true },
      { kind: 'Too fast! Say it', tiles: [tileHTML('🥶', '', 'you gulped it')], say: ['[急|いそ]いで [食|た]べちゃ だめ ！', 'Don’t eat it so fast!'], gl: 'A brain freeze goes キーン: <b>[頭|あたま] が キーン と する！</b>', answer: '[頭|あたま] が キーン と する ！', alts: ['キーン ！'] },
      { kind: 'Ramune: count with 本', tiles: [tileHTML('🍾', 'ラムネ', '× 2', '#cdeefa')], say: ['ラムネ も ！ ラムネ は 「 [本|ほん] 」 で [数|かぞ]える よ 。', 'Ramune too! You count ramune with «hon».'],
        gl: 'Long, thin things take 本 (ほん): いっぽん, <b>にほん</b>, さんぼん. Listen to the sound change!', answer: 'ラムネ を にほん ください 。', alts: ['にほん ください 。'], spoken: true },
      { kind: 'One more, for Grandpa', tiles: [tileHTML('🍾', 'ラムネ', '+ 1', '#cdeefa')], say: ['おじいちゃん に も ！ もう [一本|いっぽん] ！', 'One for Grandpa too! One more!'], gl: 'もう = more: <b>もう いっぽん</b>, one more (bottle)', answer: 'ラムネ を もう いっぽん ください 。', alts: ['もう いっぽん ください 。'], spoken: true },
    ],
    wata: () => [
      { kind: 'Order one (本!)', tiles: [signHTML(STALL.wata)], say: ['[綿|わた]あめ も 「 [本|ほん] 」 ！ [一本|いっぽん] [頼|たの]んで ！', 'Cotton candy is «hon» too! Order one!'], answer: '[綿|わた]あめ を いっぽん ください 。', alts: ['いっぽん ください 。'], spoken: true },
      { kind: 'Ask the price', tiles: [tileHTML('❓', '', 'no price on this bag')], say: ['この [袋|ふくろ] の は ？ いくら か 、 [聞|き]いて ！', 'And the one in the bag? Ask how much!'], answer: 'いくら です か ？', alts: ['いくら ？'], after: '「 [三百|さんびゃく] [円|えん] です 」' },
    ],
  };
  async function stallVisit(id) {
    atStall(id);
    await scene(async () => { atStall(id); await keeperSay(id, `mt.${id}.hi`); });
    atStall(id); lock(true);
    const st = STALL[id], r = await drill(STEPS1[id]().map(s => Object.assign(s, { kind: enM(s.kind), say: s.say ? [s.say[0], enM(s.say[1])] : null })), { title: `${JC(st.sign)} · ${st.en}`, sub: 'read the sign, then order', who: WHO });
    if (r.quit) return { quit: true };
    await scene(async () => {
      atStall(id); const kp = B.keepers[id]; kp.pose = 'hold'; sfx('pip');
      await keeperSay(id, `mt.${id}.give`); kp.pose = 'idle';
      if (id === 'kori') { await keeperSay(id, 'mt.ramune.give'); mimoShot(); G.sim.mimo.scared = 1.2; await kidSay('mt.kiin'); }
      else if (id === 'tako') { mimoShot(); G.sim.mimo.scared = 1.5; think(`${G.state.mimoName} gulps a takoyaki whole and hops about, fanning its mouth: «${JP('あつっ ！')}»`, 3.5); await wait(1.6); }
      else { mimoShot(); mimoHop(); await wait(1.0); }
    });
    return { clean: r.clean };
  }
  async function chapter1() {
    const st = S(), clean = [], first = !st.ch[1];
    await scene(async () => { standBy(); shotKid(); await kidSay('mt.c1.a'); await kidSay('mt.c1.b'); await kidSay('mt.c1.c'); });
    if (!st.l1) { const r = await lesson(['ph.mt.kudasai', 'ph.mt.futatsu', 'ph.mt.ikura'], { title: 'Ordering · 注文', sub: 'Natsu’s stall school', who: WHO, intro: ['[言|い]って みて ！', 'Say it after me!'] }); if (r.quit) return; st.l1 = true; }
    let quit = false;
    try {
      await UI.fade(1, 400); festOn({ stalls: ['tako', 'soba', 'kori', 'wata'], song: 'ja_matsuri', level: 0.2, duck: 0.35 }); atStall('tako'); await UI.fade(0, 400);
      await scene(async () => { atStall('tako'); await kidSay('mt.c1.go'); });
      for (const id of ['tako', 'soba', 'kori', 'wata']) { const r = await stallVisit(id); if (r.quit) { quit = true; break; } clean.push(...r.clean); }
    } finally { await UI.fade(1, 350); festOff(); await UI.fade(0, 350); }
    if (quit) return;
    st.ch[1] = true; st.grade[1] = best(st.grade[1], gradeOf(clean));
    teachAll(['ph.mt.kudasai', 'ph.mt.futatsu', 'ph.mt.ikura', 'ph.mt.oishii', 'ph.mt.atsu', 'ph.mt.kiin']);
    await scene(async () => { standBy(); shotKid(); B.kid.pose = 'cheer'; await kidSay('mt.c1.oishii'); B.kid.pose = 'idle'; await kidSay('mt.c1.end'); });
    if (first) coins(6, `The stall practice, grade ${gradeOf(clean)}`); else UI.toast(`Grade ${gradeOf(clean)} (best: ${st.grade[1]})`);
  }
  const best = (a, b) => (!a ? b : !b ? a : GRN.indexOf(a) <= GRN.indexOf(b) ? a : b);

  // ================================================================ chapter 2: the festival games (お祭り の あそび)
  // ---- 金魚すくい: the fish swim, the paper poi waits in the middle; Space (or the button) scoops whatever is in its ring.
  // Each dip wets the paper; it tears soon. Then: how many? (匹). Nothing caught: «もう一回！», and the keeper's おまけ.
  const GF = { fish: [], poi: 100, caught: [], over: false, torn: false, flash: 0, t: 0, auto: false };
  const GFC = { x: 210, y: 150, rx: 190, ry: 125, poi: 30 };
  function gfReset() {
    GF.fish = []; GF.caught = []; GF.poi = 100; GF.over = false; GF.torn = false; GF.t = 0; GF.flash = 0;
    for (let i = 0; i < 10; i++) { const a = Math.random() * TAU, r = 0.3 + Math.random() * 0.6; GF.fish.push({ x: GFC.x + Math.cos(a) * GFC.rx * r, y: GFC.y + Math.sin(a) * GFC.ry * r, a: Math.random() * TAU, v: 38 + Math.random() * 34, turn: 0, w: Math.random() * 9, black: i % 5 === 4, col: i % 5 === 4 ? '#2b2235' : ['#e86a2a', '#e0372c', '#f28a3a'][i % 3] }); }
  }
  function gfScoop() {
    if (GF.over) return;
    GF.poi -= 16 + Math.random() * 12; GF.flash = 0.25; sfx('swoosh');
    let bi = -1, bd = 1e9; GF.fish.forEach((f, i) => { const d = Math.hypot(f.x - GFC.x, f.y - GFC.y); if (d < GFC.poi - 2 && d < bd) { bd = d; bi = i; } });
    if (bi >= 0) { const f = GF.fish.splice(bi, 1)[0]; GF.caught.push(f); GF.poi -= 8 + (f.black ? 6 : 0); sfx('pip'); }
    if (GF.poi <= 0) { GF.torn = true; GF.over = true; sfx('crack'); }
    if (GF.caught.length >= 5) GF.over = true;
  }
  function gfDraw(c, t, dt) {
    const W = 560, H = 300; c.clearRect(0, 0, W, H); c.fillStyle = '#c9955a'; c.fillRect(0, 0, W, H);
    water(c, GFC.x - GFC.rx, GFC.y - GFC.ry, GFC.rx * 2, GFC.ry * 2, true);
    if (!GF.over) GF.t += dt;
    for (const f of GF.fish) {
      f.w += dt * 9; if (Math.random() < dt * 0.8) f.turn = (Math.random() - 0.5) * 3;
      f.a += f.turn * dt; const nx = f.x + Math.cos(f.a) * f.v * dt, ny = f.y + Math.sin(f.a) * f.v * dt;
      if (((nx - GFC.x) / (GFC.rx - 16)) ** 2 + ((ny - GFC.y) / (GFC.ry - 14)) ** 2 > 1) f.a = Math.atan2(GFC.y - f.y, GFC.x - f.x) + (Math.random() - 0.5); else { f.x = nx; f.y = ny; }
      fishShape(c, f);
    }
    // the poi: a white ring with wet paper (it greys and tears)
    const k = clamp(GF.poi / 100, 0, 1);
    c.fillStyle = GF.torn ? 'rgba(255,255,255,0)' : `rgba(255,255,250,${0.25 + 0.4 * k})`; c.beginPath(); c.arc(GFC.x, GFC.y, GFC.poi, 0, TAU); c.fill();
    c.lineWidth = 6; c.strokeStyle = GF.flash > 0 ? '#ffd23f' : '#fffaf0'; c.stroke(); c.lineWidth = 1.5; c.strokeStyle = '#2b2235'; c.beginPath(); c.arc(GFC.x, GFC.y, GFC.poi + 3, 0, TAU); c.stroke();
    if (GF.torn) { c.strokeStyle = '#fffaf0'; c.lineWidth = 2; c.beginPath(); c.moveTo(GFC.x - 18, GFC.y - 6); c.lineTo(GFC.x + 4, GFC.y + 8); c.lineTo(GFC.x + 16, GFC.y - 10); c.stroke(); }
    c.fillStyle = '#c9955a'; c.fillRect(GFC.x - 5, GFC.y + GFC.poi + 2, 10, 40); c.strokeStyle = '#2b2235'; c.strokeRect(GFC.x - 5, GFC.y + GFC.poi + 2, 10, 40);
    GF.flash = Math.max(0, GF.flash - dt);
    // the bowl: what you've caught
    c.fillStyle = '#fffaf0'; c.strokeStyle = '#2b2235'; c.lineWidth = 3; c.beginPath(); c.ellipse(482, 150, 62, 50, 0, 0, TAU); c.fill(); c.stroke();
    water(c, 432, 112, 100, 76, true);
    GF.caught.forEach((f, i) => fishShape(c, { x: 455 + (i % 3) * 22, y: 136 + Math.floor(i / 3) * 24, a: 0.3 + i, w: t * 9 + i, col: f.col, black: f.black }, 0.7));
    c.fillStyle = '#2b2235'; c.font = `800 18px ${FONT}`; c.textAlign = 'center'; c.fillText(`${GF.caught.length}`, 482, 222);
    c.fillStyle = 'rgba(43,34,53,.15)'; c.fillRect(20, 282, 380, 10); c.fillStyle = k > 0.35 ? '#ffd23f' : '#e0372c'; c.fillRect(20, 282, 380 * k, 10);
    if (GF.auto && !GF.over && GF.fish.some(f => Math.hypot(f.x - GFC.x, f.y - GFC.y) < GFC.poi - 6)) gfScoop();
    if (GF.t > 28) GF.over = true;
  }
  async function goldfishGame() {
    gfReset(); mgOpen('金魚すくい · scoop when a fish swims into the ring', gfDraw, 'Space: scoop');
    hudCue({ icon: '🐟', title: 'すくって！ <small>Scoop!</small>', sub: 'Space or the button, when a goldfish is in the white ring. The paper tears soon!' });
    HUD.q.form.classList.add('hidden'); HUD.q.picks.classList.remove('hidden');
    HUD.q.picks.innerHTML = '<button type="button" class="go" style="font-size:22px">すくう！ <small>Space</small></button>';
    HUD.q.picks.querySelector('button').onclick = () => gfScoop();
    HUD.onKey = e => { if (e.code === 'Space' || e.code === 'Enter') { gfScoop(); return true; } return false; };
    let quit = false; HUD.res = v => { if (v && v[0] === '\u0000') quit = true; };
    while (!GF.over && !quit) await wait(0.1);
    HUD.onKey = null; HUD.res = null; hudMode(true);
    await wait(quit ? 0 : 0.8); mgRight(GF.torn ? 'やぶれた！ (torn!)' : 'おしまい！');
    return quit ? null : GF.caught.length;
  }
  // ---- ヨーヨー釣り: the pool of water balloons; tell {mimo} which one to hook (color + とって)
  const YY = { b: [], target: -1, lift: -1, liftT: 0 };
  function yyReset() { YY.b = shuffle(YOYO.concat(YOYO.slice(0, 3)).slice()).map((c, i) => ({ c, x: 70 + (i % 5) * 100 + (i > 4 ? 50 : 0), y: i > 4 ? 210 : 150, gone: false, ph: Math.random() * 9 })); YY.target = -1; YY.lift = -1; }
  function yyDraw(c, t, dt) {
    const W = 560, H = 300; c.clearRect(0, 0, W, H); c.fillStyle = '#8a5ab0'; c.fillRect(0, 0, W, H); water(c, 20, 90, 520, 190, false);
    YY.b.forEach((b, i) => {
      if (b.gone) return; let y = b.y + Math.sin(t * 1.8 + b.ph) * 4, lift = 0;
      if (i === YY.lift) { YY.liftT += dt; y -= YY.liftT * 160; lift = 6; if (y < -40) { b.gone = true; YY.lift = -1; } }
      balloon(c, b.x, y, 26, b.c.col, lift);
      if (i === YY.target) { c.strokeStyle = '#ffd23f'; c.lineWidth = 4; c.setLineDash([6, 5]); c.beginPath(); c.arc(b.x, y, 36 + Math.sin(t * 6) * 3, 0, TAU); c.stroke(); c.setLineDash([]); }
    });
    if (YY.lift >= 0) { const b = YY.b[YY.lift]; c.strokeStyle = '#fffaf0'; c.lineWidth = 2; c.beginPath(); c.moveTo(b.x, 0); c.lineTo(b.x, Math.max(0, b.y - YY.liftT * 160 - 38)); c.stroke(); }
    c.fillStyle = '#fffaf0'; c.font = `800 16px ${FONT}`; c.textAlign = 'left'; c.fillText(JC('ヨーヨー[釣|つ]り'), 28, 30);
  }
  // what color a typed «…を とって» asks for: → the YOYO entry or null; ok only with とって (or 取って) in it
  function yyHeard(text) {
    if (!cj()) return { c: null, verb: false };
    const U = CJK.typed(norm(text).text, 'ja').U, verb = !!findWord(U, '[取|と]って');
    for (const c of YOYO) for (const f of [c.ja].concat(c.alts)) if (findWord(U, f)) return { c, verb };
    return { c: null, verb };
  }
  // ---- 射的: the shelf of prizes; Natsu points at one, you say where it is (上の右, 真ん中の左…), the cork flies
  const SH = { target: null, down: {}, cork: null };
  const shCell = (r, c) => ({ x: 120 + c * 160, y: 70 + r * 85 });
  function shDraw(c, t, dt) {
    const W = 560, H = 300; c.clearRect(0, 0, W, H); c.fillStyle = '#4f9a5a'; c.fillRect(0, 0, W, H); c.fillStyle = '#f4e3c0'; c.fillRect(30, 20, 500, 260);
    for (let r = 0; r < 3; r++) { c.fillStyle = '#c9955a'; c.fillRect(30, 100 + r * 85, 500, 10); for (let k = 0; k < 3; k++) { const p = PRIZES[r][k], q = shCell(r, k), dn = SH.down[r + ',' + k]; if (dn !== undefined && dn > 1.2) continue; c.save(); c.translate(q.x, q.y + 6); if (dn !== undefined) { c.rotate(Math.min(1.4, dn * 3)); c.translate(0, dn * dn * 160); } prizeShape(c, p, 0, 0, 0.95); c.restore(); if (SH.down[r + ',' + k] !== undefined) SH.down[r + ',' + k] += dt; } }
    if (SH.target) { const q = shCell(SH.target.r, SH.target.c), b = Math.sin(t * 6) * 3; c.fillStyle = '#ffd23f'; c.strokeStyle = '#2b2235'; c.lineWidth = 2; c.beginPath(); c.moveTo(q.x, q.y - 34 + b); c.lineTo(q.x - 11, q.y - 50 + b); c.lineTo(q.x + 11, q.y - 50 + b); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,210,63,.8)'; c.lineWidth = 3; c.setLineDash([5, 4]); c.strokeRect(q.x - 34, q.y - 32, 68, 70); c.setLineDash([]); }
    if (SH.cork) { const K0 = SH.cork; K0.t += dt; const u = Math.min(1, K0.t / 0.35), q = shCell(K0.r, K0.c), x = lerp(280, q.x, u), y = lerp(310, q.y, u); c.fillStyle = '#d9a86a'; c.strokeStyle = '#2b2235'; c.beginPath(); c.arc(x, y, 9 - u * 3, 0, TAU); c.fill(); c.stroke(); if (u >= 1 && !K0.done) { K0.done = true; if (K0.hit) { SH.down[K0.r + ',' + K0.c] = 0; sfx('hit'); } else sfx('wood'); } if (K0.t > 0.8) SH.cork = null; }
  }
  // ---- くじ引き: the red box; pull a ticket, it unfolds: 二等 (or はずれ)
  const KJ = { open: 0, ticket: null };
  function kjDraw(c, t, dt) {
    const W = 560, H = 300; c.clearRect(0, 0, W, H); c.fillStyle = '#d9a03a'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#e0372c'; c.strokeStyle = '#2b2235'; c.lineWidth = 4; c.fillRect(60, 110, 150, 140); c.strokeRect(60, 110, 150, 140); c.fillStyle = '#2b2235'; c.fillRect(105, 118, 60, 12);
    c.fillStyle = '#fffaf0'; c.font = `900 30px ${BRUSH}`; c.textAlign = 'center'; c.fillText('くじ', 135, 200);
    if (KJ.ticket) {
      KJ.open = Math.min(1, KJ.open + dt * 1.6); const u = KJ.open, w = 60 + u * 190, h = 40 + u * 150;
      c.save(); c.translate(380, 150); c.rotate((1 - u) * 0.4); c.fillStyle = '#fffaf0'; c.strokeStyle = '#2b2235'; c.lineWidth = 3; c.fillRect(-w / 2, -h / 2, w, h); c.strokeRect(-w / 2, -h / 2, w, h);
      if (u > 0.7) { c.globalAlpha = (u - 0.7) / 0.3; brushText(c, JC(KJ.ticket.ja), 0, -6, w - 30, 88, KJ.ticket.win ? '#d6232a' : '#2b2235'); if (cmode() === 'roman') { c.font = '700 16px "Segoe UI", sans-serif'; c.fillStyle = '#2b2235'; c.fillText(JR(KJ.ticket.ja), 0, h / 2 - 18); } }
      c.restore();
    }
  }
  async function chapter2() {
    const st = S(), clean = [], push = g => clean.push(g === 'S'), first = !st.ch[2];
    await scene(async () => { standBy(); shotKid(); B.kid.pose = 'cheer'; await kidSay('mt.c2.a'); B.kid.pose = 'idle'; });
    let quit = false;
    try {
      await UI.fade(1, 400); festOn({ stalls: ['kin', 'yoyo', 'sha', 'kuji'], song: 'ja_matsuri', level: 0.2, duck: 0.35 }); atStall('kin'); await UI.fade(0, 400);
      // goldfish
      await scene(async () => { atStall('kin'); await keeperSay('kin', 'mt.kin.hi'); await kidSay('mt.kin.tip'); });
      atStall('kin'); lock(true); hudOpen('金魚すくい · goldfish scooping');
      let n = await goldfishGame(); if (n === null) { quit = true; return; }
      if (n === 0) {
        hudCue({ icon: '🔁', title: `${J('もう [一回|いっかい] ！')} <small>Ask for another go!</small>`, sub: 'The poi tore. Say «one more time!»' });
        const g = await hudCall(['もう [一回|いっかい] ！', 'もう [一回|いっかい] ください 。'], 'One more time!'); if (g === 'quit') { quit = true; return; } push(g);
        n = await goldfishGame(); if (n === null) { quit = true; return; }
      }
      mgClose();
      if (n > 0) {
        hudCue({ icon: '🐟', title: `${J('[何匹|なんびき] すくった ？')} <small>How many did you scoop?</small>`, sub: `Count fish with 匹 (ひき): いっぴき, にひき, さんびき, よんひき, ごひき` });
        const g = await hudCall([NUMK.hiki[n] + ' 。'], `${n}`, { placeholder: '…ひき' }); if (g === 'quit') { quit = true; return; } push(g);
      }
      hudClose();
      await scene(async () => { atStall('kin'); if (!n) await keeperSay('kin', 'mt.kin.zero'); await keeperSay('kin', 'mt.kin.give'); await kidSay('mt.c2.hiki'); });
      bag('k.mtFish');
      // water yo-yos
      await scene(async () => { atStall('yoyo'); await keeperSay('yoyo', 'mt.yoyo.hi'); await kidSay('mt.yoyo.want'); });
      atStall('yoyo'); lock(true); yyReset(); mgOpen('ヨーヨー釣り · water yo-yo fishing', yyDraw); hudOpen('ヨーヨー釣り · tell {mimo} which one to hook'.replace('{mimo}', G.state.mimoName));
      for (let round = 0; round < 3; round++) {
        const want = round === 0 ? YOYO[0] : YY.b.filter(b => !b.gone && b.c.id !== 'pink')[round === 1 ? 0 : 2].c, idx = YY.b.findIndex(b => !b.gone && b.c === want);
        YY.target = idx;
        hudCue({ icon: '🎈', title: round === 0 ? `${J('ピンク の が ほしい ！')} <small>Natsu wants the pink one</small>` : `<small>${esc(G.state.mimoName)} paws at the marked one. Tell it to get that one!</small>`, sub: `${esc(G.state.mimoName)}: color + ヨーヨー を とって！`, bar: round / 3 });
        const model = `${want.ja} ヨーヨー を とって ！`;
        const g = await hudCall([model], `Get the ${want.en} yo-yo!`, { check: t => { const h = yyHeard(t); if (!h.c) return { ok: false, why: 'Say the color: ピンクの, 赤い, 青い, 黄色い, 緑の, 白い…' }; if (h.c !== want) return { ok: false, why: `That’s the ${h.c.en} one! Look again.` }; if (!h.verb) return { ok: false, why: `Ask ${esc(G.state.mimoName)} to get it: …を とって！` }; return { ok: true, said: model }; } });
        if (g === 'quit') { quit = true; return; } push(g);
        YY.lift = idx; YY.liftT = 0; YY.target = -1; sfx('chirp'); await wait(DRILL.fast ? 0.05 : 1.1);
        if (round === 0) { hudClose(); await scene(async () => { atStall('yoyo'); await kidSay('mt.yoyo.got'); }); atStall('yoyo'); lock(true); hudOpen('ヨーヨー釣り · water yo-yo fishing'); }
      }
      hudClose(); mgClose();
      // the shooting gallery
      await scene(async () => { atStall('sha'); await keeperSay('sha', 'mt.sha.hi'); await kidSay('mt.sha.how'); });
      atStall('sha'); lock(true); SH.down = {}; SH.cork = null; mgOpen('射的 · the shooting gallery', shDraw); hudOpen('射的 · say where to aim');
      const aims = [{ r: 0, c: 2 }, { r: 1, c: 1 }, { r: 2, c: 0 }];
      for (let i = 0; i < aims.length; i++) {
        const A = aims[i], P0 = PRIZES[A.r][A.c], model = `${ROWS[A.r].ja} の ${COLS[A.c].ja}`;
        SH.target = A;
        hudCue({ icon: '🎯', title: `${J(P0.ja)} <small>Natsu wants ${esc(P0.en)} (▼)</small>`, sub: 'Where is it? 上 / 真ん中 / 下 + の + 左 / 真ん中 / 右', bar: i / aims.length });
        const g = await hudCall([model], `${ROWS[A.r].en} ${COLS[A.c].en}`, { check: t => { const a = aimOf(t); if (!a) return { ok: false, why: 'Say a shelf and a side: 上の右, 真ん中の左, 下の真ん中…' }; if (a.r !== A.r || a.c !== A.c) { SH.cork = { r: a.r, c: a.c, t: 0, hit: false }; return { ok: false, why: `Pop! That’s the ${ROWS[a.r].en} ${COLS[a.c].en}. Natsu points at the other one.` }; } return { ok: true, said: model }; } });
        if (g === 'quit') { quit = true; return; } push(g);
        SH.target = null; SH.cork = { r: A.r, c: A.c, t: 0, hit: true }; await wait(DRILL.fast ? 0.05 : 1.2);
        if (i === 0) { hudClose(); await scene(async () => { atStall('sha'); await keeperSay('sha', 'mt.sha.hit'); }); atStall('sha'); lock(true); hudOpen('射的 · say where to aim'); }
      }
      hudClose(); mgClose();
      // the lottery
      await scene(async () => { atStall('kuji'); await keeperSay('kuji', 'mt.kuji.hi'); await kidSay('mt.kuji.joke'); });
      atStall('kuji'); lock(true); KJ.ticket = null; KJ.open = 0; mgOpen('くじ引き · the lottery', kjDraw); hudOpen('くじ引き · the lottery');
      KJ.ticket = KUJI[0]; sfx('page');
      hudCue({ icon: '🎫', title: `${J('[読|よ]んで ！')} <small>Read your ticket out loud!</small>`, sub: '一等 いっとう · 二等 にとう · 三等 さんとう (等: a prize’s rank)' });
      let g = await hudCall([KUJI[0].ja], 'second prize'); if (g === 'quit') { quit = true; return; } push(g);
      hudCue({ icon: '🎉', title: `${J('あたり ？ はずれ ？')} <small>A winner? Shout it!</small>`, sub: 'A winning ticket is あたり; a miss is はずれ' });
      g = await hudCall(['あたり ！'], 'A winner!'); if (g === 'quit') { quit = true; return; } push(g);
      hudClose();
      await scene(async () => { atStall('kuji'); await keeperSay('kuji', 'mt.kuji.win'); B.kid.pose = 'cheer'; await kidSay('mt.kuji.wow'); B.kid.pose = 'idle'; });
      bag('k.mtDenden');
      atStall('kuji'); lock(true); KJ.ticket = KUJI[1]; KJ.open = 0; sfx('page'); hudOpen('くじ引き · Natsu’s turn');
      hudCue({ icon: '🎫', title: `<small>Natsu pulls one too. Read hers!</small>`, sub: '' });
      g = await hudCall([KUJI[1].ja], 'a miss'); if (g === 'quit') { quit = true; return; } push(g);
      hudClose(); mgClose();
      await scene(async () => { atStall('kuji'); B.kid.pose = 'sulk'; await kidSay('mt.kuji.miss'); B.kid.pose = 'idle'; });
    } finally { hudClose(); mgClose(); await UI.fade(1, 350); festOff(); await UI.fade(0, 350); }
    if (quit) return;
    st.ch[2] = true; st.grade[2] = best(st.grade[2], gradeOf(clean));
    teachAll(['ph.mt.atari', 'ph.mt.omake', 'ph.mt.mouikkai']);
    await scene(async () => { standBy(); shotKid(); await kidSay('mt.c2.end'); });
    if (first) coins(6, `The festival games, grade ${gradeOf(clean)}`); else UI.toast(`Grade ${gradeOf(clean)} (best: ${st.grade[2]})`);
  }

  // ================================================================ chapter 3: {mimo}'s yukata, and the bon-odori (盆踊り)
  // dressing: {mimo} stands between you and Natsu, a little to her right; the camera looks at it from her side
  function mimoClose() {
    const k = B.kid, f = front(k, 2.1); placeYou(f, k);
    const M = G.sim.mimo, sx = -Math.cos(k.baseYaw), sz = Math.sin(k.baseYaw);
    M.x = lerp(k.x, f.x, 0.6) + sx * 0.7; M.z = lerp(k.z, f.z, 0.6) + sz * 0.7; G.sim.snap();
    const dx = k.x - M.x, dz = k.z - M.z, d = Math.hypot(dx, dz) || 1, cx = M.x + dx / d * 1.5 + sx * 0.5, cz = M.z + dz / d * 1.5 + sz * 0.5;
    M.look = { x: cx, z: cz };
    shot([cx, GYv() + 0.95, cz], [M.x, GYv() + 0.38, M.z]);
  }
  // six calls: every move once, then one more that isn't the one just before it
  const sixMoves = () => { const s = shuffle(MOVES.slice()); return s.concat([pick(MOVES.filter(m => m !== s[s.length - 1]))]); };
  function doMove(id) {
    if (FEST.dance) { FEST.dance.move = id; FEST.dance.mt = 1.2; }
    if (id === 'clap') { sfx('click'); setTimeout(() => sfx('click'), 180); } else sfx(id === 'turn' ? 'swoosh' : 'chirp');
  }
  const WIDE = () => shot([PLAZA.x + 1.2, GYv() + 4.6, PLAZA.z + 10.4], [PLAZA.x, GYv() + 0.6, PLAZA.z - 1.2]);
  async function chapter3() {
    const st = S(), clean = [], push = g => clean.push(g === 'S'), first = !st.ch[3];
    await scene(async () => { standBy(); shotKid(); B.kid.pose = 'cheer'; await kidSay('mt.c3.a'); B.kid.pose = 'idle'; await kidSay('mt.c3.b'); });
    // dressing {mimo}: one command per piece; the piece goes on as you say it
    let quit = false;
    DRESSING = true; wearables(); if (YUK) YUK.show([]);
    try {
      standBy(); mimoClose(); lock(true); hudOpen(`浴衣 · dress ${G.state.mimoName}`);
      for (let i = 0; i < DRESS.length; i++) {
        const D0 = DRESS[i];
        if (i === 1) {      // left over right
          hudCue({ icon: '👘', title: `${J('[左|ひだり] と [右|みぎ] 、 どっち が [上|うえ] ？')} <small>Which side goes on top?</small>`, sub: 'Natsu: think of a yukata’s collar. 左 (ひだり) or 右 (みぎ)?', bar: i / (DRESS.length + 1) });
          const g = await hudCall(['[左|ひだり] 。', '[左|ひだり] が [上|うえ] 。'], 'left'); if (g === 'quit') { quit = true; break; } push(g);
          hudClose(); await scene(async () => { standBy(); shotKid(); await kidSay('mt.c3.left'); }); mimoClose(); lock(true); hudOpen(`浴衣 · dress ${G.state.mimoName}`);
        }
        hudCue({ icon: D0.icon, title: `${esc(D0.en)} <small>${esc(D0.note)}</small>`, sub: `Tell ${esc(G.state.mimoName)}!`, bar: (i + (i >= 1 ? 1 : 0)) / (DRESS.length + 1) });
        const g = await hudCall([D0.src].concat(D0.alts), D0.en); if (g === 'quit') { quit = true; break; } push(g);
        if (YUK) YUK.show(DRESS.slice(0, i + 1).map(d => d.id));
        mimoHop(); sfx(D0.id === 'geta' ? 'wood' : 'poof'); await wait(DRILL.fast ? 0.05 : 0.9);
      }
      if (!quit) {
        hudClose(); await scene(async () => { standBy(); shotKid(); B.kid.pose = 'cheer'; await kidSay('mt.c3.niau'); B.kid.pose = 'idle'; await kidSay('mt.c3.verbs'); });
        mimoClose(); lock(true); hudOpen(`浴衣 · ${G.state.mimoName} in a yukata`);
        hudCue({ icon: '✨', title: `${J('[似合|にあ]う ！')} <small>Tell ${esc(G.state.mimoName)}: it suits it!</small>`, sub: 'When someone wears something nice: 似合う！' });
        const g = await hudCall(['[似合|にあ]う ！', '[似合|にあ]う ね ！'], 'It suits you!'); if (g === 'quit') quit = true; else { push(g); mimoHop(); }
      }
    } finally { hudClose(); DRESSING = false; if (YUK && !st.yuk) YUK.show(['kiru', 'obi', 'geta']); }
    if (quit) return;
    // the bon-odori, practice round in the plaza: Natsu, four neighbors and {mimo} (its second self) around the fountain
    try {
      await UI.fade(1, 400);
      festOn({ dancers: 4, mimo2: true, song: 'ja_ondo', level: 0.3, duck: 0.08 }); FEST.dance.kid = B.kid; FEST.dance.r = 4.7;
      placeYou(SPOT.you, PLAZA); WIDE(); await UI.fade(0, 400);
      await scene(async () => { WIDE(); await kidSay('mt.c3.bon'); await kidSay('mt.c3.obon'); });
      WIDE(); lock(true); hudOpen('盆踊り · ask Natsu to dance');
      hudCue({ icon: '💃', title: `${J('[踊|おど]ろう ！')} <small>Ask Natsu to dance!</small>`, sub: '踊る = to dance; 踊ろう = let’s dance' });
      let g = await hudCall(['[踊|おど]ろう ！', 'いっしょ に [踊|おど]ろう ！'], 'Let’s dance!'); if (g === 'quit') { quit = true; return; } push(g);
      hudClose(); await scene(async () => { WIDE(); await kidSay('mt.c3.listen'); });
      // round A: Natsu calls, you do (press the move)
      WIDE(); lock(true); hudOpen('盆踊り · do what Natsu calls (1–5, the arrows, Space)');
      const seqA = sixMoves();
      for (let i = 0; i < seqA.length; i++) {
        const m = seqA[i]; hudCue({ icon: '📣', title: J(m.src), sub: `Natsu calls a step (${i + 1}/${seqA.length}). Which move is it?`, bar: i / seqA.length }); sayVoice(m.src);
        g = await hudPick(m, MOVES); if (g === 'quit') { quit = true; return; } push(g);
        doMove(m.id); await wait(DRILL.fast ? 0.05 : 1.3);
      }
      hudClose(); await scene(async () => { WIDE(); await kidSay('mt.c3.call'); });
      // round B: you call, everyone does it
      WIDE(); lock(true); hudOpen('盆踊り · call the steps');
      const seqB = sixMoves();
      for (let i = 0; i < seqB.length; i++) {
        const m = seqB[i]; hudCue({ icon: m.icon, title: esc(m.en), sub: `Call it in Japanese! (${i + 1}/${seqB.length})`, bar: i / seqB.length });
        g = await hudCall([m.src].concat(m.alts), m.en); if (g === 'quit') { quit = true; return; } push(g);
        doMove(m.id); await wait(DRILL.fast ? 0.05 : 1.3);
      }
      hudClose();
    } finally { hudClose(); await UI.fade(1, 350); festOff(); await UI.fade(0, 350); }
    if (quit) return;
    st.ch[3] = true; st.grade[3] = best(st.grade[3], gradeOf(clean));
    st.yuk = true; st.yukOn = true; if (G.state.gm && G.state.gm.wear === 'apron') G.state.gm.wear = '';
    teachAll(['ph.mt.niau', 'ph.mt.odorou']);
    await scene(async () => { standBy(); shotKid(); B.kid.pose = 'cheer'; await kidSay('mt.c3.end'); B.kid.pose = 'idle'; mimoHop(); });
    UI.toast(`${G.state.mimoName} keeps its yukata! (Natsu’s menu: take it off or put it on)`);
    if (first) coins(6, `The bon-odori practice, grade ${gradeOf(clean)}`); else UI.toast(`Grade ${gradeOf(clean)} (best: ${st.grade[3]})`);
  }

  // ================================================================ the drum's voice: patterns played on demand (a one-shot deck of
  // the 'mt_taiko' song, into our own bus): ドン (the middle), カッ (the rim), ドドン, ドコ
  const TKO = { pat: [], bus: null, deck: null };
  function taikoHit(K0, k, t, v = 1) {
    if (k === 'don') { K0.thud(t, 0.95 * v); K0.tom(t, 86, 0.9 * v); }
    else if (k === 'do') { K0.thud(t, 0.5 * v); K0.tom(t, 92, 0.5 * v); }
    else if (k === 'ko') K0.tom(t, 108, 0.42 * v);
    else if (k === 'ka') { K0.woodblock(t, false, 0.9 * v); K0.rim(t, 0.55 * v); }
  }
  function playPattern(pat, o = {}) {
    const { hits, len } = hitsOf(pat), bpm = o.bpm || 100;
    TKO.pat = []; for (const h of hits) (TKO.pat[h.at] = TKO.pat[h.at] || []).push(h.k);
    try {
      const def = Sound._song && Sound._song('mt_taiko'), ac = Sound.ctx;
      if (def && ac && ac.state === 'running' && Sound.out && Sound.deck) {
        def.len = len + 6;
        if (!TKO.bus || TKO.bus.ac !== ac) { const g = ac.createGain(); g.gain.value = 0.85; g.connect(Sound.out); TKO.bus = { ac, g }; }
        if (TKO.deck) TKO.deck.stop();
        TKO.deck = Sound.deck('mt_taiko', TKO.bus.g, { at: ac.currentTime + 0.05, from: 0, loop: false, bpm });
      }
    } catch (e) { console.warn('[matsuri] taiko', e); }
    return (len + 2) * 15 / bpm;
  }
  const dotsOf = pat => pat.split(' ').map(() => '●').join(' ');

  // ================================================================ chapter 4: the taiko and Grandpa Tetsu (口唱歌)
  const TET_YAW = Math.atan2(-0.35, -2.71);
  function gpAt() { const T = B.gp; T.root.visible = true; T.hidden = false; T.x = SPOT.gp.x; T.z = SPOT.gp.z; T.y = B.gy(T.x, T.z); T.yaw = T.baseYaw = TET_YAW; T.faceAt = null; T.top = 2.15; B.drumSet.visible = true; }
  function gpAway() { const T = B.gp; T.root.visible = false; T.hidden = true; B.drumSet.visible = false; }
  // you stand beside the drum (east of her bucket), facing Grandpa; the camera looks in from the lane: Natsu, the drum, him, you
  const atDrum = () => placeYou({ x: -19.5, z: -169.8 }, SPOT.gp);
  const shotDrum = () => shot([-21.6, GYv() + 2.75, -172.6], [-20.7, GYv() + 1.05, -168.4]);
  async function drumPlay(pat, who) { const p = who || B.gp; p.pose = 'drum'; await wait(DRILL.fast ? 0.05 : playPattern(pat)); p.pose = 'idle'; }
  async function chapter4() {
    const st = S(), clean = [], push = g => clean.push(g === 'S'), T = B.gp, first = !st.ch[4];
    let quit = false;
    const hud = t => { atDrum(); gpAt(); shotDrum(); lock(true); hudOpen(t); };
    try {
      await scene(async () => {
        standBy(); shotKid(); await kidSay('mt.c4.a'); await kidSay('mt.c4.b');
        atDrum(); gpAt(); shotDrum(); await gpSay('mt.gp.hi');
        T.pose = 'drum'; await wait(1.2); sfx('whiff'); try { G.w3d.fx.puff(SPOT.drum.x, GYv() + 1.1, SPOT.drum.z, 6, 0.2, '#b9b8c2', 0.4); } catch (e) { /* */ } T.pose = 'idle';
        G.fx.hush = 0.35; await gpSay('mt.gp.silent'); await gpSay('mt.gp.mouth'); await gpSay('mt.gp.kuchi'); await gpSay('mt.gp.dodon');
      });
      // say it back: the first three you read; once the drum's voice is back, Grandpa plays and you listen
      hud('口唱歌 · kuchi-shōga: say the rhythm'); G.fx.hush = 0.35;
      const SUB = Object.entries(SYL).map(([k, v]) => `${J(k)} ${esc(v)}`).join(' · ');
      for (let i = 0; i < ECHO.length; i++) {
        const pat = ECHO[i], listen = i >= 3;
        if (listen) { hudCue({ icon: '👂', title: `<span style="letter-spacing:.3em">${dotsOf(pat)}</span> <small>Listen…</small>`, sub: SUB, bar: i / ECHO.length }); await drumPlay(pat); }
        hudCue({ icon: '🥁', title: listen ? `<span style="letter-spacing:.3em">${dotsOf(pat)}</span> <small>Say what he played (? shows it)</small>` : `${J(pat)} <small>Say it out loud: the drum plays what you say</small>`, sub: SUB, bar: i / ECHO.length });
        const g = await hudCall([pat], 'the rhythm', { drum: true, placeholder: 'don don ka…' }); if (g === 'quit') { quit = true; return; } push(g);
        if (!listen) { G.fx.hush = Math.max(0, 0.35 - (i + 1) * 0.12); await drumPlay(pat); }
        if (i === 2) { hudClose(); await scene(async () => { atDrum(); gpAt(); shotDrum(); G.fx.hush = 0; T.pose = 'cheer'; await gpSay('mt.gp.back'); T.pose = 'idle'; await drumPlay('ドン ドン ドドン'); }); hud('口唱歌 · now listen, then say it back'); }
      }
      // read his paper: the rhythm written in katakana
      hudClose(); await scene(async () => { atDrum(); gpAt(); shotDrum(); await gpSay('mt.gp.read'); }); hud('口唱歌 · read the paper');
      hudCue({ icon: '📜', title: `<span class="mt-score">${J(SCORE)}</span>`, sub: 'Read the rhythm out loud' });
      let g = await hudCall([SCORE], 'the rhythm', { drum: true }); if (g === 'quit') { quit = true; return; } push(g);
      await drumPlay(SCORE);
      // the shouts in the rests
      hudClose(); await scene(async () => { atDrum(); gpAt(); shotDrum(); await gpSay('mt.gp.kake'); await gpSay('mt.gp.kake2'); }); hud('かけ声 · shout in the rest');
      for (let i = 0; i < KAKE.length; i++) {
        const k = KAKE[i];
        hudCue({ icon: '📣', title: `${J(k.pat)} <span style="color:#e0372c">＿</span> → ${J(k.shout, { ruby: 'always' })}`, sub: `Grandpa plays; in the rest, shout ${esc(k.en)}`, bar: i / KAKE.length });
        await drumPlay(k.pat);
        g = await hudCall([k.shout], k.en); if (g === 'quit') { quit = true; return; } push(g);
        sfx('shout'); B.kid.pose = 'cheer'; await wait(DRILL.fast ? 0.05 : 0.6); B.kid.pose = 'idle';
      }
      hudClose();
      await scene(async () => {
        atDrum(); gpAt(); shotDrum(); T.pose = 'cheer'; await gpSay('mt.gp.end'); T.pose = 'idle';
        await gpSay('mt.gp.bachi'); bag('k.mtBachi');
        standBy(); shotKid(); B.kid.pose = 'cheer'; await kidSay('mt.c4.end'); B.kid.pose = 'idle';
      });
    } finally { hudClose(); gpAway(); G.fx.hush = 0; }
    if (quit) return;
    st.ch[4] = true; st.grade[4] = best(st.grade[4], gradeOf(clean));
    teachAll(['ph.mt.sore', 'ph.mt.yoisho']);
    if (first) coins(8, `Grandpa Tetsu’s drum lesson, grade ${gradeOf(clean)}`); else UI.toast(`Grade ${gradeOf(clean)} (best: ${st.grade[4]})`);
  }

  // ================================================================ chapter 5: the festival night (夏祭り の 夜)
  const setLit = k => { FEST.lit = k; for (const m of B.glows) m.material.color.setScalar(0.16 + 0.84 * k); };
  const NIGHT_WIDE = () => shot([PLAZA.x + 2.5, GYv() + 7.2, PLAZA.z + 16.5], [PLAZA.x, GYv() + 2.4, PLAZA.z - 1]);
  const YAG_SHOT = () => shot([PLAZA.x + 4.6, GYv() + 5.4, PLAZA.z + 7.4], [PLAZA.x + 0.2, GYv() + YAG.h + 0.8, PLAZA.z + 1.1]);
  const SKY_SHOT = () => shot([PLAZA.x - 1, GYv() + 2.2, PLAZA.z + 14], [PLAZA.x, 15, PLAZA.z - 16]);
  function gpOnYagura() { const D = DRUM_AT(); Object.assign(B.gp, { x: D.x, z: D.z - 0.78, y: GYv() + YAG.h + 0.09, faceAt: null }); B.gp.yaw = B.gp.baseYaw = 0; B.gp.top = 2.2; }
  function kidOnYagura() { const D = DRUM_AT(), k = B.kidN; if (FEST.dance) FEST.dance.kid = null; Object.assign(k, { x: D.x + 0.75, z: D.z - 0.6, y: GYv() + YAG.h + 0.09, faceAt: { x: D.x, z: D.z } }); k.yaw = k.baseYaw = -0.9; }
  async function chapter5() {
    const st = S(), clean = [], push = g => clean.push(g === 'S');
    let quit = false;
    await scene(async () => { standBy(); shotKid(); B.kid.pose = 'cheer'; await kidSay('mt.c5.a'); B.kid.pose = 'idle'; });
    try {
      await UI.fade(1, 600);
      festOn({ stalls: STALLS.map(s => s.id), yag: true, dancers: 8, mimo2: true, night: true, kidNight: true, song: 'ja_ondo', level: 0.4, duck: 0.04, gp: {} });
      gpOnYagura(); setLit(1); FEST.dance.kid = B.kidN; FEST.dance.r = DANCE_R;
      placeYou(SPOT.you, PLAZA); NIGHT_WIDE();
      await UI.fade(0, 900);
      UI.chapter(JP('[夏祭|なつまつ]り の [夜|よる]'), 'Alba · the festival night');
      await scene(async () => { NIGHT_WIDE(); await wait(2.4); await kidSay('mt.c5.wow'); YAG_SHOT(); B.gp.pose = 'drum'; await gpSay('mt.gp.start'); await wait(1.5); });
      // the Hush: the lanterns go out from the north, the dance stops, the drum goes quiet
      await scene(async () => {
        NIGHT_WIDE(); sfx('grow');
        for (let i = 0; i <= 40; i++) { const u = i / 40; setLit(1 - u * 0.85); FEST.frozen = u; G.fx.hush = u * 0.6; await wait(0.06); }
        B.gp.pose = 'sulk'; await kidSay('mt.c5.hush'); await kidSay('mt.c5.hush2'); YAG_SHOT(); await gpSay('mt.gp.frozen'); NIGHT_WIDE(); await kidSay('mt.c5.lead');
      });
      // you lead the bon-odori: each call brings some of it back
      NIGHT_WIDE(); lock(true); hudOpen('盆踊り · lead the dance: call the steps!');
      const seq = sixMoves();
      for (let i = 0; i < seq.length; i++) {
        const m = seq[i]; hudCue({ icon: m.icon, title: esc(m.en), sub: `Call it! The dancers wake up as they hear you (${i + 1}/${seq.length})`, bar: i / seq.length });
        const g = await hudCall([m.src].concat(m.alts), m.en); if (g === 'quit') { quit = true; return; } push(g);
        const u = (i + 1) / seq.length; FEST.frozen = Math.max(0.12, 1 - u * 0.75); setLit(0.15 + u * 0.45); G.fx.hush = 0.6 - u * 0.35; doMove(m.id); await wait(DRILL.fast ? 0.05 : 1.3);
      }
      FEST.frozen = 0.25; hudClose();
      // Natsu takes the drum; you call the rhythms
      await scene(async () => { kidOnYagura(); YAG_SHOT(); await kidSay('mt.c5.taiko'); });
      kidOnYagura(); YAG_SHOT(); lock(true); hudOpen('太鼓 · call the rhythm for Natsu');
      for (let i = 0; i < NIGHT_PATS.length; i++) {
        const pat = NIGHT_PATS[i]; hudCue({ icon: '🥁', title: `${J(pat)} <small>Call it, Natsu plays it</small>`, sub: Object.entries(SYL).map(([k, v]) => `${J(k)} ${esc(v)}`).join(' · '), bar: i / NIGHT_PATS.length });
        const g = await hudCall([pat], 'the rhythm', { drum: true }); if (g === 'quit') { quit = true; return; } push(g);
        await drumPlay(pat, B.kidN); const u = (i + 1) / NIGHT_PATS.length; setLit(0.6 + u * 0.3); G.fx.hush = 0.25 - u * 0.2; FEST.frozen = 0.25 * (1 - u);
      }
      hudClose();
      await scene(async () => { NIGHT_WIDE(); B.kidN.pose = 'cheer'; await kidSay('mt.c5.sore'); });
      NIGHT_WIDE(); lock(true); hudOpen('かけ声 · everyone together!');
      hudCue({ icon: '📣', title: `${J('ソーレ ！', { ruby: 'always' })} <small>Shout it with everyone!</small>`, sub: 'The festival shout' });
      let g = await hudCall(['ソーレ ！', 'それ ！'], 'Sōre!'); if (g === 'quit') { quit = true; return; } push(g);
      hudClose();
      await scene(async () => {
        FEST.frozen = 0; setLit(1); G.fx.hush = 0; sfx('fanfare'); B.gp.pose = 'drum'; B.kidN.pose = 'drum'; await drumPlay('ドドン ドドン ドン', B.gp);
        YAG_SHOT(); B.gp.pose = 'cheer'; await gpSay('mt.gp.thanks'); B.gp.pose = 'idle'; B.kidN.pose = 'cheer'; await kidSay('mt.c5.yatta'); B.kidN.pose = 'idle';
      });
      // fireworks: shout the old names as they bloom
      FEST.dance.w = 0.05; FEST.dance.kid = B.kidN; FEST.song = 'ja_matsuri'; FEST.level = 0.3;
      await scene(async () => { SKY_SHOT(); firework(PLAZA.x - 3, 19, PLAZA.z - 17, 'kiku', ['#ffd23f', '#ff6b5a']); await wait(1.0); await kidSay('mt.c5.hanabi'); await kidSay('mt.c5.kagiya'); });
      SKY_SHOT(); lock(true); hudOpen('花火 · shout as they bloom!');
      const KINDS = [['botan', ['#ff8fd1', '#ffd23f']], ['kiku', ['#7ff7ea', '#fff3a0']], ['yanagi', ['#ffcf6a', '#ffb347']], ['senrin', ['#ff6b5a', '#7fb7ff', '#ffd23f']]];
      for (let i = 0; i < 4; i++) {
        const S0 = SHOUTS[i % 2], [kind, cols] = KINDS[i];
        sfx('swoosh'); await wait(DRILL.fast ? 0.02 : 0.5); firework(PLAZA.x + (i % 2 ? 5 : -5) + Math.random() * 2, 19 + Math.random() * 3, PLAZA.z - 15 - Math.random() * 4, kind, cols);
        hudCue({ icon: '🎆', title: `${J(S0.src, { ruby: 'always' })} <small>Shout it!</small>`, sub: i < 2 ? (i ? 'Kagiya: the older fireworks house of old Edo' : 'Tamaya: a famous fireworks house of old Edo (Tokyo)') : 'たまやー！ or かぎやー！', bar: i / 4 });
        const g2 = await hudCall(i < 2 ? [S0.src].concat(S0.alts) : SHOUTS.map(s => s.src).concat(SHOUTS.flatMap(s => s.alts)), S0.en); if (g2 === 'quit') { quit = true; return; } push(g2);
        firework(PLAZA.x + (Math.random() - 0.5) * 10, 21 + Math.random() * 3, PLAZA.z - 17, KINDS[(i + 1) % 4][0], KINDS[(i + 2) % 4][1]); sfx('shout');
      }
      hudClose();
      await scene(async () => { SKY_SHOT(); for (let i = 0; i < 7; i++) { firework(PLAZA.x + (Math.random() - 0.5) * 16, 18 + Math.random() * 6, PLAZA.z - 14 - Math.random() * 6, KINDS[i % 4][0], KINDS[(i + 1) % 4][1]); await wait(0.45); } await wait(1.2); await kidSay('mt.c5.kirei'); });
      // the sparklers, quiet, at the edge of the plaza
      await UI.fade(1, 600);
      FEST.dance = null; B.dancers.forEach(p => { p.root.visible = false; p.hidden = true; }); if (B.mimo2) B.mimo2.root.visible = false; FEST.mimo2 = false; mimoVis(true);
      FEST.song = 'ja_ondo'; FEST.level = 0.12; setLit(0.85);
      // (Natsu faces west, the sparkler in her left hand on the south side; the camera looks north from low down, the lit
      // yagura behind her; you stand facing her, Grandpa behind her)
      const kN = B.kidN, sp = { x: PLAZA.x - 1.5, z: PLAZA.z + 7.6 };
      Object.assign(kN, { x: sp.x, z: sp.z, y: GYv(), faceAt: null, pose: 'hold' }); kN.yaw = kN.baseYaw = -Math.PI / 2;
      Object.assign(B.gp, { x: sp.x + 0.95, z: sp.z - 0.35, y: GYv(), faceAt: { x: sp.x - 0.5, z: sp.z + 0.1 }, pose: 'idle' });
      placeYou({ x: sp.x - 1.7, z: sp.z - 0.55 }, { x: sp.x, z: sp.z }, -1);
      sparklerBuild(); SK.on = true; SK.stage = 0; SK.t = 0; SK.drop = 0;
      const hand = kN.arms[1].userData.hand, hv = new THREE.Vector3();
      SK.follow = () => { hand.getWorldPosition(hv); SK.at = { x: hv.x, y: hv.y, z: hv.z }; };
      const SPARK_SHOT = () => { shot([sp.x - 1.15, GYv() + 0.95, sp.z + 2.35], [sp.x - 0.3, GYv() + 0.42, sp.z - 0.05]); };
      const GIFT_SHOT = () => { shot([sp.x - 1.0, GYv() + 1.75, sp.z + 2.7], [sp.x - 0.85, GYv() + 0.55, sp.z - 0.3]); };
      SPARK_SHOT(); await UI.fade(0, 700);
      await scene(async () => { SPARK_SHOT(); await kidSay('mt.c5.senko'); await kidSay('mt.c5.wish'); });
      SPARK_SHOT(); lock(true); hudOpen('線香花火 · name each stage as it comes');
      for (let i = 1; i < SENKO.length; i++) {
        const s0 = SENKO[i];
        hudCue({ icon: '🎇', title: `${J(s0.ja, { ruby: 'always' })} <small>${esc(s0.en)}</small>`, sub: i === 1 ? `The bud (${JP(SENKO[0].ja)}) has swelled. Now it changes: name each stage!` : 'Name it as it happens', bar: (i - 1) / (SENKO.length - 1) });
        SK.stage = i; SK.t = 0;
        const g3 = await hudCall([s0.ja], s0.en); if (g3 === 'quit') { quit = true; return; } push(g3);
        await wait(DRILL.fast ? 0.05 : 1.6);
      }
      hudClose();
      await scene(async () => { SPARK_SHOT(); await wait(1.2); SK.stage = 0; SK.on = false; await kidSay('mt.c5.mywish'); await gpSay('mt.gp.mywish'); await you('My wish is the same.'); });
      // the fox mask, and goodbye
      await scene(async () => {
        GIFT_SHOT(); kN.pose = 'cheer'; await kidSay('mt.c5.gift'); kN.pose = 'idle';
        st.mask = true; st.maskOn = true; if (G.state.school) G.state.school.hatOn = false; if (G.state.anime) G.state.anime.bandOn = false; wearables(); mimoHop();
        UI.toast(`${G.state.mimoName} wears Natsu’s fox mask!`);
      });
      SPARK_SHOT(); lock(true); hudOpen('また来年 · see you next year');
      hudCue({ icon: '👋', title: `${J('また [来年|らいねん] ！')} <small>Say goodbye till next summer!</small>`, sub: 'The festival is over…' });
      g = await hudCall(['また [来年|らいねん] ！'], 'See you next year!'); if (g === 'quit') { quit = true; return; } push(g);
      hudClose();
      await scene(async () => { GIFT_SHOT(); kN.pose = 'wave'; await kidSay('mt.c5.bye'); kN.pose = 'idle'; });
      st.ch[5] = true; st.grade[5] = best(st.grade[5], gradeOf(clean));
      await UI.fade(1, 600);
    } finally { hudClose(); SK.on = false; SK.follow = null; setLit(1); festOff(); G.cam.override = null; lock(false); await UI.fade(0, 600); if (G.save) G.save(); }
    if (quit) return;
    teachAll(['ph.mt.tamaya', 'ph.mt.kagiya', 'ph.mt.mata']);
    coins(16, `The summer festival, grade ${S().grade[5]}`);
  }

  // ================================================================ the music (Sound.addSong; nothing in audio.js changes)
  // 'ja_matsuri' «アルバ囃子» (Alba Bayashi), the festival: 110 bpm, a light swing. Matsuri-bayashi percussion (the shime
  //   drum's running sixteenths, the big drum's ドン on the one, its rim カッ as the backbeat, the kane's «chan, chiki») under
  //   a funk band (a slap bass walking the yo scale, clavinet chops, organ stabs) and a shinobue, the festival's high bamboo
  //   flute, singing the hook. E dorian. Intro 2 (the flute's high call, the kane counting in, a taiko pickup) · A 8 (Em9 Em9
  //   A13 A13 Em9 Em9 Cmaj9 B7#9) · B 8 (Cmaj9 Bm7 Am9 D13 Cmaj9 Bm7 Am9 B7#9: claps, the organ, the flute up high, a trill)
  //   · a 4-bar drum break (the band drops out: just the drums and the bell, a doko-doko roll back in).
  // 'ja_ondo' «アルバ音頭» (Alba Ondo), the bon-odori: a triplet shuffle at 96 (12 steps a bar; bpm 72 here), the ondo's
  //   «ドン カッ ドドン カッ», a double clap every fourth bar, a shamisen picking the shuffle, a warm Rhodes, a round bass, the
  //   shinobue low and sweet on the tune (G major, the yo scale). Intro 1 (the shamisen) · A 8 (the flute) · A' 8 (the
  //   shamisen takes the tune, the flute a third over it). Gmaj9 Em9 Am9 D9sus4 Gmaj9 Bm7 Cmaj9 D7sus4.
  // 'mt_taiko': the drum lesson's patterns, one shot each (playPattern).
  function addSongs() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const K0 = Sound.kit;
    if (K0.LEADS && !K0.LEADS.shino) K0.LEADS.shino = { o: [['sine', 1, 0, 0.82], ['triangle', 2, 0, 0.1], ['sine', 3, 0, 0.04]], lp: [3200, 7000, 4600], q: 0.9, vib: 0.007, g: 0.056, a: 0.01, breath: 0.045, scoop: -25 };
    const chan = (t, v) => { K0.cowbell(t, 0.45 * v); K0.clink(t, 1.1 * v); }, chiki = (t, v) => { K0.clink(t, 0.6 * v); K0.chk(t, 0.45 * v); };
    // ---- «アルバ囃子»
    const N = s => K0.N(s);
    const VO = { Em: N('G3 B3 D4 F#4'), A13: N('G3 C#4 F#4 B4'), C: N('E3 G3 B3 D4'), B7: N('D#3 A3 D4'), Bm: N('D3 F#3 A3 C#4'), Am: N('C3 E3 G3 B3'), D13: N('C3 F#3 B3 E4') };
    const BL = { Em: 'E2/3 E3/1 r/2 E2/2 G2/2 A2/2 B2/2 D3/2', Em2: 'E2/3 E3/1 r/2 E2/2 D3/2 B2/2 A2/2 G2/2', A13: 'A1/3 A2/1 r/2 A1/2 C#3/2 E2/2 F#2/2 G2/2', C: 'C2/3 C3/1 r/2 C2/2 E2/2 G2/2 B2/2 C3/2',
      B7: 'B1/3 B2/1 r/2 B1/2 D#2/2 F#2/2 A2/2 D3/2', Bm: 'B1/3 B2/1 r/2 B1/2 D2/2 F#2/2 A2/2 B2/2', Am: 'A1/3 A2/1 r/2 A1/2 C2/2 E2/2 G2/2 B2/2', D13: 'D2/3 D3/1 r/2 D2/2 F#2/2 A2/2 B2/2 C3/2' };
    const PROG = ['Em', 'Em2', 'A13', 'A13', 'Em', 'Em2', 'C', 'B7', 'C', 'Bm', 'Am', 'D13', 'C', 'Bm', 'Am', 'B7'];
    const BASS = K0.mel(PROG.map(c => BL[c]).join(' | '));
    const HOOK = K0.mel('E6/2 G6/2 A6/4 G6/2 E6/2 D6/4 | E6/6 r/2 B5/2 D6/2 E6/4 | G6/2 A6/2 B6/4 A6/2 G6/2 E6/2 G6/2 | A6/12 r/4 | B6/2 A6/2 G6/2 E6/2 D6/4 E6/4 | G6/3 A6/1 G6/2 E6/2 D6/4 B5/4 | D6/2 E6/2 G6/2 A6/2 B6/2 D7/2 B6/4 | A6/2 G6/2 E6/12'
      + ' | G6/4 B6/4 A6/2 G6/2 E6/4 | F#6/4 D6/4 B5/8 | E6/2 G6/2 A6/2 B6/2 D7/4 B6/4 | A6/8 F#6/4 D6/4 | G6/2 A6/2 B6/2 G6/2 E6/2 G6/2 A6/4 | B6/6 A6/2 F#6/4 D6/4 | E6/2 G6/2 A6/2 C7/2 B6/4 A6/4 | B6/8');
    const CALL = K0.mel('D7/8 B6/2 A6/2 G6/2 E6/2');
    const SHIME = [1, 0.3, 0.55, 0.3, 0.8, 0.3, 0.55, 0.35, 1, 0.3, 0.55, 0.3, 0.8, 0.35, 0.6, 0.45];
    const BREAK = [[[0, 'don'], [4, 'don'], [8, 'ka'], [10, 'ka'], [12, 'don'], [14, 'do'], [15, 'don']], [[0, 'don'], [3, 'do'], [4, 'don'], [8, 'ka'], [12, 'don'], [13, 'do'], [14, 'don']],
      [[0, 'do'], [1, 'don'], [4, 'do'], [5, 'don'], [8, 'do'], [9, 'don'], [12, 'ka'], [14, 'ka']], [[0, 'do'], [1, 'ko'], [2, 'do'], [3, 'ko'], [4, 'do'], [5, 'ko'], [6, 'do'], [7, 'ko'], [8, 'don'], [12, 'don']]].map(b => Object.fromEntries(b));
    Sound.addSong('ja_matsuri', { bpm: 110, len: 352, from: 32, swing: 0.12, vol: 0.36, verb: 0.12, echo: 0.1, echoSteps: 3,
      play(i, t, s16) {
        const bar = i >> 4, s = i & 15;
        K0.timbale(t, true, 0.42 * SHIME[s] * (bar < 1 ? 0.6 : 1));
        if (s % 4 === 0) chan(t, s % 8 ? 0.4 : 0.55); else if ((s & 3) === 2 || ((s & 3) === 3 && bar >= 10 && bar < 18)) chiki(t, 0.32);
        if (bar < 2) {                          // the intro: the flute's high call, then the drum's pickup
          const n = CALL[i]; if (n && bar === 0) K0.lead(n[0], t, n[1] * s16 * 0.95, 'shino', 0.9);
          if (bar === 1) { const hit = { 0: 'don', 4: 'ka', 8: 'don', 12: 'do', 13: 'don' }[s]; if (hit) taikoHit(K0, hit, t, 0.9); if (s === 14) K0.swell(t, s16 * 2, 0.6); }
          return;
        }
        if (bar >= 18) {                        // the break: drums and the bell, a roll back in
          const hit = BREAK[bar - 18][s]; if (hit) taikoHit(K0, hit, t, 1);
          if (bar === 21 && s === 8) K0.swell(t, s16 * 8, 0.7);
          if (bar === 21 && s >= 8) { const n = [88, 91, 93, 95, 98, 95, 93, 91][s - 8]; K0.lead(n, t, s16 * 0.9, 'shino', 0.7); }
          return;
        }
        const j = i - 32, sec = j < 128 ? 'A' : 'B', pb = bar - 2, chord = PROG[pb], V = VO[chord.replace('2', '')];
        if (s === 0 && (pb === 0 || pb === 8)) K0.crash(t, 0.6);
        if (s === 0 || s === 10 || (s === 7 && pb & 1)) taikoHit(K0, 'don', t, s ? 0.75 : 1);
        if (s === 4 || s === 12) taikoHit(K0, 'ka', t, 0.85);
        if (sec === 'B' && (s === 4 || s === 12)) K0.hclap(t, 0.7);
        const b = BASS[j]; if (b) K0.slap(b[0], t, b[0] % 12 === BASS[pb * 16][0] % 12 && b[0] > BASS[pb * 16][0] ? 0.75 : 0.95);
        if (sec === 'A' && [2, 6, 7, 10, 14].includes(s)) V.forEach(m => K0.clav(m + 12, t, s === 7 ? 0.45 : 0.7));
        if (sec === 'B') { if (s === 0) V.forEach(m => K0.organ(m, t, 6 * s16, 0.5)); else if (s === 10 || s === 14) V.forEach(m => K0.organ(m + 12, t, 1.6 * s16, 0.4)); }
        if (pb === 7 && s === 0) V.forEach(m => K0.organ(m, t, 14 * s16, 0.45));
        if (pb === 15 && s >= 8) K0.lead(s % 2 ? 97 : 95, t, s16 * 0.9, 'shino', 0.75);      // the flute's trill
        else { const n = HOOK[j]; if (n) K0.lead(n[0], t, n[1] * s16 * 0.94, 'shino', sec === 'B' ? 1 : 0.9); }
      } });
    // ---- «アルバ音頭» (triplets: 12 steps a bar)
    const OV = [N('B3 D4 F#4 A4'), N('G3 B3 D4 F#4'), N('G3 B3 C4 E4'), N('G3 C4 E4 A4'), N('B3 D4 F#4 A4'), N('A3 D4 F#4'), N('E4 G4 B4 D5'), N('G3 C4 E4 A4')];
    const OR = [43, 40, 45, 38, 43, 47, 36, 38];          // the roots: G E A D G B C D
    const TUNE = K0.mel('D5/3 E5/2 G5/1 A5/3 G5/3 | E5/5 D5/1 B4/6 | C5/3 D5/2 E5/1 G5/3 E5/3 | D5/9 r/3 | G5/3 A5/2 G5/1 E5/3 D5/3 | D5/5 E5/1 D5/3 B4/3 | E5/2 G5/1 A5/3 G5/2 E5/1 D5/3 | G5/9 r/3');
    const RIFF = [[0, 0], [2, 7], [3, 12], [5, 7], [6, 0], [8, 7], [9, 16], [11, 12]];
    Sound.addSong('ja_ondo', { bpm: 72, len: 204, from: 12, swing: 0, vol: 0.34, verb: 0.16, echo: 0.12, echoSteps: 3,
      play(i, t, s16) {
        const bar = Math.floor(i / 12), s = i % 12;
        if (bar === 0) { const r = RIFF.find(([at]) => at === s); if (r) K0.shami(55 + [0, 2, 4, 7, 9, 12, 9, 7][RIFF.indexOf(r)], t, 0.8, 0.24); if (s === 9) taikoHit(K0, 'do', t, 0.7); if (s === 11) taikoHit(K0, 'don', t, 0.8); return; }
        const pb = (bar - 1) % 8, two = bar > 8, root = OR[pb], V = OV[pb];
        // the ondo's drum: ドン (beat 1) カッ (beat 2) ドドン (the pickup into beat 3) カッ (beat 4)
        if (s === 0) taikoHit(K0, 'don', t, 1); else if (s === 3 || s === 9) taikoHit(K0, 'ka', t, 0.8); else if (s === 5) taikoHit(K0, 'do', t, 0.6); else if (s === 6) taikoHit(K0, 'don', t, 0.85);
        if (s % 3 === 0) chiki(t, 0.22); if (s === 0 && pb % 4 === 0) chan(t, 0.45);
        if ((pb === 3 || pb === 7) && (s === 6 || s === 9)) K0.hclap(t, 0.9);
        if (s === 0) V.forEach((m, k) => K0.epiano(m, t + k * 0.012, 5 * s16, 0.55)); else if (s === 8) V.slice(1).forEach(m => K0.epiano(m, t, 2 * s16, 0.35));
        const bass = { 0: [root, 5], 5: [root + 7, 1], 6: [root, 3], 9: [root + 12, 2], 11: [root + 7, 1] }[s]; if (bass) K0.roundbass(bass[0], t, bass[1] * s16 * 0.9, 0.95);
        const n = TUNE[pb * 12 + s];
        if (!two) { const r = RIFF.find(([at]) => at === s); if (r) K0.shami(root + 24 + r[1], t, 0.32, 0.2); if (n) K0.lead(n[0], t, n[1] * s16 * 0.92, 'shino', 0.7); }
        else if (n) { K0.shami(n[0] - 12, t, 0.85, Math.max(0.2, n[1] * s16 * 0.8)); K0.lead(n[0] + ([7, 0, 2].includes(n[0] % 12) ? 4 : 3), t, n[1] * s16 * 0.9, 'shino', 0.42); }    // (a diatonic third over it, G major)
        if (s === 0 && bar % 8 === 1) K0.crash(t, 0.35);
      } });
    // ---- the drum lesson's one-shot patterns (playPattern sets TKO.pat and this song's length)
    Sound.addSong('mt_taiko', { bpm: 100, len: 16, swing: 0, vol: 1, play(i, t) { const ks = TKO.pat[i]; if (ks) for (const k of ks) taikoHit(K0, k, t, 1); } });
  }

  // ================================================================ the menu
  const mimoN = () => (G && G.state.mimoName) || 'Mimo';
  const CH = [
    { n: 1, title: 'The food stalls', sub: () => 'order with ください; count with つ, 個 and 本; read the signs', gate: f => !!f.rosa, wait: 'after Rosa’s welcome', run: () => chapter1(), again: 'Order at the stalls again' },
    { n: 2, title: 'The festival games', sub: () => 'goldfish (匹), water yo-yos (colors), the cork gun (上の右…), the lottery', gate: f => !!f.boss, wait: 'after the big Hushling on the hill', run: () => chapter2(), again: 'The festival games again' },
    { n: 3, title: 'Yukata and bon-odori', sub: () => `dress ${mimoN()} (着て・しめて・はいて・持って), then the dance by call`, gate: f => (f.bells || 0) >= 1, wait: 'after the first bell', run: () => chapter3(), again: 'Dress up and dance again' },
    { n: 4, title: 'The taiko', sub: () => 'Grandpa Tetsu: the drum’s spoken rhythm (ドン カッ ドドン ドコ) and the shouts', gate: f => (f.bells || 0) >= 2, wait: 'after the second bell', run: () => chapter4(), again: 'A drum lesson with Grandpa again' },
    { n: 5, title: 'The festival night', sub: () => 'lead the dance and the drum against the Hush; fireworks; sparklers', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell', run: () => chapter5() },
  ];
  let talking = false;
  async function kidTalk() { if (talking) return; talking = true; try { await kidTalk0(); } finally { talking = false; } }
  async function kidTalk0() {
    const st = S(), f = flags();
    if (!st.met) return meet();
    const next = CH.find(c => !st.ch[c.n]), opts = [];
    if (next) opts.push(next.gate(f) ? { label: `Chapter ${next.n}: ${next.title}`, sub: next.sub(), value: 'next' } : { label: `Chapter ${next.n}: ${next.title}`, sub: `later: ${next.wait}`, value: 'wait' });
    for (const c of CH) if (st.ch[c.n] && c.again) opts.push({ label: c.again, sub: st.grade[c.n] ? `best grade: ${st.grade[c.n]}` : '', value: 'again' + c.n });
    opts.push({ label: 'Chat', value: 'chat' });
    if (st.yuk) opts.push({ label: `${mimoN()}’s yukata: ${st.yukOn ? 'take it off' : 'put it on'}`, value: 'yuk' });
    if (st.mask) opts.push({ label: `${mimoN()}’s fox mask: ${hatOn() ? 'take it off' : 'put it on'}`, value: 'mask' });
    const v = await UI.choose(`${JP(NAMES.kid)}: «${JP('なに する ？')}» (What shall we do?)`, opts);
    if (v === 'next') return next.run();
    if (v === 'wait') return scene(async () => { standBy(); shotKid(); await kidSay('mt.wait'); });
    if (v && v.startsWith('again')) return CH[+v.slice(5) - 1].run();
    if (v === 'chat') { st.chat = (st.chat || 0) + 1; return scene(async () => { standBy(); shotKid(); await kidSay(['mt.idle1', 'mt.idle2', 'mt.idle3', 'mt.idle4', 'mt.idle5'][st.chat % (st.ch[5] ? 5 : 4)]); }); }
    if (v === 'yuk') { st.yukOn = !st.yukOn; if (st.yukOn && G.state.gm && G.state.gm.wear === 'apron') G.state.gm.wear = ''; sfx('pip'); UI.toast(st.yukOn ? `${mimoN()} wears its yukata.` : 'Yukata off.'); if (G.save) G.save(); }
    if (v === 'mask') {
      const on = !hatOn(); st.maskOn = on;
      if (on) { if (G.state.school) G.state.school.hatOn = false; if (G.state.anime) G.state.anime.bandOn = false; }
      sfx('pip'); UI.toast(on ? `${mimoN()} wears the fox mask.` : 'Fox mask off.'); if (G.save) G.save();
    }
  }
  // ================================================================ talking to her (STORY.extra), the quest, her poster, the map
  const PROVIDER = {
    interactables() {
      if (!B || !shown() || ZHF.overlayOpen || FEST.on || (G.indoors && G.indoors())) return [];
      const Y = G.sim.you, k = B.kid; if (Math.hypot(Y.x - k.x, Y.z - k.z) > 14) return [];
      return [{ x: k.x, z: k.z, y: B.gy(k.x, k.z), r: 2.0, label: 'Talk', run: kidTalk }];
    },
    tick(dt, Y) {
      if (!B || !shown()) return;
      const st = S();
      if (!st.seen0 && Math.hypot(Y.x - B.kid.x, Y.z - B.kid.z) < 10) { st.seen0 = true; think(`A kid with a fox mask on the side of her head drums on an upturned bucket: «${JP('ドン ！ ドン ！ カッ ！')}»`, 4.5); }
    },
  };
  function quest() {
    const y = s => s.mt || {}, ch = (s, n) => !!(y(s).ch && y(s).ch[n]), kidAt = () => (B ? { x: B.kid.x, z: B.kid.z } : SPOT.kid);
    const step = (n, text, why, hint) => ({ get text() { const c = CH[n - 1]; return c && !c.gate(flags()) ? text : text.replace(/ \(after [^)]*\)$/, ''); }, why, done: s => ch(s, n), target: kidAt, hint });
    return {
      id: 'mt', kind: 'side', title: 'Natsu’s summer festival', giver: 'Natsu, the festival kid by the bell tower',
      started: s => s.lang === 'ja' && !!y(s).met,
      steps: [
        step(1, 'Practice at the food stalls with Natsu (屋台)', 'Order with 〜をください, count with つ, 個 and 本, and read the stall signs.', '{mimo} points at the kid with the fox mask.'),
        step(2, 'The festival games (after the big Hushling on the hill)', 'Goldfish scooping, water yo-yos, the cork-gun gallery and the lottery.', '{mimo} paddles the air like a goldfish.'),
        step(3, 'A yukata for {mimo}, and the bon-odori (after the first bell)', 'Dress {mimo} one command at a time, then dance the bon-odori by call.', '{mimo} twirls on the spot.'),
        step(4, 'Grandpa Tetsu’s drum (after the second bell)', 'The drum’s spoken rhythm, 口唱歌: ドン, カッ, ドドン, ドコ, and the shouts.', '{mimo} thumps its belly: don, don!'),
        step(5, 'The summer festival night (after the third bell)', 'The bon-odori and the taiko against the Hush, the fireworks, the sparklers.', '{mimo} looks up at the sky, waiting for fireworks.'),
      ],
      story: [
        { when: s => !!y(s).met, text: 'By the bell tower lives Natsu, nine, born in summer and crazy about festivals. The town went quiet and there’s no summer festival this year, so she’s making one herself.' },
        { when: s => ch(s, 1), text: 'You practiced at the food stalls in the plaza: takoyaki by the 個, ramune by the 本, shaved ice under the 氷 flag. «〜をください!»' },
        { when: s => ch(s, 2), text: 'Goldfish scooping (a goldfish in a bag to keep), water yo-yos, the cork-gun gallery, and a lottery ticket that won second prize.' },
        { when: s => ch(s, 3), text: '{mimo} got a tiny yukata, left over right, and you all danced the bon-odori round the fountain.' },
        { when: s => ch(s, 4), text: 'Natsu’s grandpa Tetsu, a taiko master, had lost his drum’s voice to the Hush. Speaking its rhythm out loud, ドン カッ ドドン, brought it back.' },
        { when: s => ch(s, 5), text: 'The festival night: the Hush put out the lanterns, and your calls brought back the dance and the drum. Then fireworks («たまやー!»), and sparklers. {mimo} wears Natsu’s fox mask now.' },
      ],
    };
  }
  const MARK = {};
  function mapMark(dpr) {
    if (!G || !B || !shown() || (G.indoors && G.indoors())) return null;
    if (!MARK[dpr]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = '#2f5fa8'; c.strokeStyle = '#2b2235'; c.lineWidth = 1.4; c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 2, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#fffaf0'; c.font = `900 10px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('祭', s / 2, s / 2 + 0.5);
      MARK[dpr] = cv;
    }
    return { x: B.kid.x, z: B.kid.z, img: MARK[dpr] };
  }

  // ================================================================ every notation string (the IME's dictionary; checked against CJK.md)
  const EXTRA = ['[今|いま] は 、 [見|み]ないで ！', '[準備中|じゅんびちゅう] ！', '[行|い]こう ！', 'なに する ？', '[言|い]って みて ！', 'もう [一回|いっかい] ！', 'もう [一回|いっかい] ください 。',
    '[何匹|なんびき] すくった ？', 'ピンク の が ほしい ！', '[読|よ]んで ！', 'あたり ？ はずれ ？', 'あたり ！', '[左|ひだり] と [右|みぎ] 、 どっち が [上|うえ] ？', '[左|ひだり] 。', '[左|ひだり] が [上|うえ] 。',
    '[似合|にあ]う ！', '[似合|にあ]う ね ！', '[踊|おど]ろう ！', 'いっしょ に [踊|おど]ろう ！', 'ソーレ ！', 'それ ！', 'また [来年|らいねん] ！', '[夏祭|なつまつ]り の [夜|よる]', 'ドン ドン ドドン', 'ドドン ドドン ドン',
    'ドン ！ ドン ！ カッ ！', '[夏祭|なつまつ]り', 'アルバ [夏祭|なつまつ]り', 'みんな [来|き]て ね ！ ナツ より', '[取|と]って', 'とって', 'ヨーヨー を とって ！', 'わたし 、 ピンク の が ほしい ！'];
  function sources() {
    const out = [].concat(EXTRA, Object.values(NAMES), Object.values(LT).map(v => v.ja[0]), PH.map(p => p.ja), PH.flatMap(p => p.alt || []), ITEMS.map(i => i.ja),
      STALLS.map(s => s.sign), STALLS.flatMap(s => s.subs), FLAVORS.map(f => f.ja), YOYO.flatMap(c => [c.ja, ...c.alts, `${c.ja} ヨーヨー を とって ！`]),
      ROWS.map(r => r.ja), COLS.map(c => c.ja), ROWS.flatMap(r => COLS.map(c => `${r.ja} の ${c.ja}`)), PRIZES.flat().map(p => p.ja), KUJI.map(k => k.ja),
      DRESS.flatMap(d => [d.src, ...d.alts]), MOVES.flatMap(m => [m.src, ...m.alts]), Object.keys(SYL), ECHO, [SCORE], KAKE.flatMap(k => [k.pat, k.shout]), NIGHT_PATS,
      SHOUTS.flatMap(s => [s.src, ...s.alts]), SENKO.map(s => s.ja), Object.values(SAY).flat().map(x => x[0]), NUMK.hiki.slice(1).map(n => n + ' 。'));
    try { for (const id of Object.keys(STEPS1)) for (const s of STEPS1[id]()) out.push(s.answer, ...(s.alts || []), s.say ? s.say[0] : null); } catch (e) { /* (before CJK) */ }
    return out.filter(Boolean);
  }
  function cjCheck() {
    if (!cj()) return [];
    const bad = [];
    for (const s of sources()) { const p = CJK.validate(s, 'ja'); if (p.length) bad.push({ src: s, problems: p }); }
    return bad;
  }

  // ================================================================ start
  function init(game) {
    G = game; ZHF.bind(game);
    if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v;
    registerIcons(); phrases();
    try { if (cj()) { CJK.addSource(sources(), 'ja'); if (CJK.addNames) CJK.addNames(['ナツ', 'テツ']); } } catch (e) { console.warn('[matsuri] cjk', e); }
    try { addSongs(); } catch (e) { console.error('[matsuri] songs', e); }
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'mt')) QUESTS.LIST.push(quest());
    if (typeof SIGNS !== 'undefined' && SIGNS.add) {
      const P = SPOT.poster, look = { face: '#1d2a6a', edge: '#ffd23f', ink: '#fffaf0' };
      SIGNS.add({ id: 'mt-poster', x: P.x + Math.sin(P.yaw) * 0.6, z: P.z + Math.cos(P.yaw) * 0.6, r: 1.3, when: () => shown(),
        card: () => ({ tag: 'Natsu’s festival poster', lines: [{ text: 'アルバ [夏祭|なつまつ]り', en: 'Alba Summer Festival', look }, { text: '[屋台|やたい]', en: 'food stalls', look }, { text: '[盆踊|ぼんおど]り', en: 'bon-odori (the festival dance)', look },
          { text: '[太鼓|たいこ]', en: 'taiko drums', look }, { text: '[花火|はなび]', en: 'fireworks', look }, { text: 'みんな [来|き]て ね ！ ナツ より', en: 'Everybody come! From Natsu', look }] }) });
    }
    setInterval(() => { if (shown()) keepFar(); }, 30000);
  }

  // ================================================================ tests (the game never calls these): MATSURI._.t
  const TEST = {
    fast(on = true) { DRILL.fast = on; GF.auto = on; },
    setup(fl) { Object.assign(G.state.flags, { hatched: true, rosa: true }, fl || {}); if (typeof Sound !== 'undefined') Sound.music = false; return S(); },
    // answer whatever is being asked: the drill, the HUD (typed, or a move to pick); the goldfish scoop on their own (fast)
    panel(roman) {
      if (DRILL.cur && DRILL.cur.submit) { const a = roman ? DRILL.cur.roman : DRILL.cur.answer; DRILL.cur.submit(a); return 'drill: ' + a; }
      if (HUD.pick) { HUD.pick(); return 'pick'; }
      if (HUD.cur && HUD.res) { const a = roman ? HUD.cur.roman : HUD.cur.answer; const r = HUD.res; HUD.res = null; HUD.q.input.value = a; r(a); return 'hud: ' + a; }
      return null;
    },
    drive(o = {}) { return ZHF.drive(Object.assign({ panel: () => TEST.panel(o.roman), busy: () => FEST.on }, o)); },
    run(n) { STORY.run(() => (n === 0 ? meet() : CH[n - 1].run())); },
    get B() { return B; }, get FEST() { return FEST; }, get HUD() { return HUD; }, get GF() { return GF; }, get NIGHT() { return NIGHT; }, get SK() { return SK; }, get DRILL() { return DRILL; },
  };
  return {
    init, build, update, quest, hatOn, mapMark,
    get busy() { return FEST.on; },
    _: { S: () => S(), LT, PH, STALLS, MOVES, DRESS, ECHO, KAKE, SENKO, NAMES, heardAny, aimOf, yyHeard, drumKey, norm, hitsOf, playPattern, sources, cjCheck, CH, meet,
      chapter1, chapter2, chapter3, chapter4, chapter5, kidTalk, festOn, festOff, firework, setLit, PROVIDER, SPOT, nightStep,
      makeNatsu,      // (shogi.js: Natsu brings her grandpa to Shige's bench)
      t: TEST },
  };
})();
