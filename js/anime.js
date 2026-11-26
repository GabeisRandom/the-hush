'use strict';
// The anime siblings (Japanese games only; DESIGN.md 14.11). The user: "a young japanese girl who teaches you song from
// popular animes and her little brother who tells you fun facts about japanese mangas and shows, he should also be really
// good at dance dance revolution" … "both of these should have their own unique and extensive side plots".
//
// DOOR: 'alba-house-13' (claimed in ja games only, through INTERIORS.claim; in es / pt / de / zh it stays an ordinary house).
//   The pink two-floor house with the orange roof and the purple door, on the north street's east side, between the plaza
//   and the north gate (its door at (−7.6, −177.9)). The north street leads on to the Old Quarter and the old theater, where
//   the story ends with a concert on the theater's steps.
// ROOMS (y 300, like every room): the living room at (−190, 300, 30): Otoha's karaoke corner; Susumu's game room at
//   (−160, 300, 30): the arcade dance machine (dance.js). Both are this module's (one entry in main.js ROOMS).
//
// Otoha (オトハ, 15): cheerful, dramatic, a singer who freezes the moment someone listens: the Hush takes her voice on stage.
//   She teaches ORIGINAL theme songs from made-up anime the siblings love (no real song's words or tune, ever), karaoke style:
//   listen (lyrics with ruby, their English on request: EN), fill in the missing words (typed), then sing it with her: she sings,
//   you answer; when the Hush grays her voice out, your lines bring it back. Five chapters, unlocked by the story (Rosa's
//   welcome, the field's big Hushling, then the bells 1, 2 and 3). The last one is a concert on the old theater's steps.
//     1 «キラキラ ひかって！» (Magical Poron, a magical-girl show): te-form requests (見て, 光って, 飛んで), キラキラ / ドキドキ
//     2 «すすめ！ダイテッコウ» (Daitekkō, a giant-robot show): plain imperatives (すすめ, まもれ, 立ち上がれ), volitional 行こう
//     3 «走って 転んで» (Relay of the Wind, a sports show): te-form chains (走って、転んで、また立って), 〜ない (負けない)
//     4 «また あした» (Cat Town Café, a slice-of-life ending): 〜たい (話したい, 笑いたい, 会いたい), 会おう / 飲もう
//     5 «届け、わたしの声» (Otoha's own song, the concert): 〜から, the potential 歌える, 届け / 響け, 歌おう
// Susumu (ススム, 9): her brother (dance.js): manga and anime facts, quizzes, the dance machine «ヤジルシ★フィーバー».
//
// Neither ever genders the player; your own lines have no gendered endings. Kids talk casual (CJK.md).
//   ANIME.init(game) · as a room (main.js ROOMS): .inside · .OUTSIDE · .interactables() · .update(dt, t) · .curiosities()
//   · .target() · .enter() · .leave() · outdoors, every frame: .outdoor(dt, t) (main.js) · .claims(doorId) · .mapMark(dpr)
//   · .bandOn() (Mimo's hachimaki) · ._ (tests: ANIME._.t)
// Progress: G.state.anime (saved with the game). Songs: Sound.addSong('an_kira' …) through Sound.kit.

const ANIME = (() => {
  const DOOR_ID = 'alba-house-13';
  const HOUSE_N = 13;                                    // (the 13th 'house' in TOWN.layout, as interiors.js numbers them)
  const RA = { x: -190, y: 300, z: 30, hw: 6.5, hd: 5, wh: 4 };     // the living room
  const RB = { x: -160, y: 300, z: 30, hw: 5.5, hd: 4.5, wh: 4 };   // Susumu's game room
  const INK = '#2b2235', PAPER = '#fffaf0', PINK = '#ff5fa2', TEAL = '#21c4b4', GOLD = '#ffcf3f';
  const HALF = Math.PI / 2;
  const FONT = '"Yu Gothic UI", "Yu Gothic", "Meiryo", "Hiragino Kaku Gothic ProN", "Noto Sans CJK JP", sans-serif';
  let G = null;
  const L = () => (G && G.state && G.state.lang) || (typeof LEX !== 'undefined' && LEX.lang) || 'es';
  const isOn = () => L() === 'ja';
  const cmode = () => (typeof CJK !== 'undefined' ? CJK.mode('ja') : 'roman');
  const S = () => {
    const s = G.state;
    if (!s.anime) s.anime = { told: false, met: false, ch: 0, songs: {}, badges: [], band: false, bandOn: false, card: false, seen: {} };
    const a = s.anime; a.songs = a.songs || {}; a.badges = a.badges || []; a.seen = a.seen || {};
    return a;
  };
  const rnd = n => Math.floor(Math.random() * n);
  const pickOf = a => a[rnd(a.length)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // the notation (CJK.md) → HTML / plain text in the current mode; rōmaji of it; its kana
  const J = (src, o = {}) => (typeof CJK !== 'undefined' ? CJK.html(src, Object.assign({ lang: 'ja' }, o)) : esc(src));
  const JP = (src, o = {}) => (typeof CJK !== 'undefined' ? CJK.plain(src, Object.assign({ lang: 'ja' }, o)) : src);
  const JR = src => (typeof CJK !== 'undefined' ? CJK.roman(src, { lang: 'ja' }) : src);
  const kanaOf = src => String(src).replace(/\[([^|\]]+)\|([^\]]+)\]/g, '$2');
  const canon = s => { try { return CJK.canon(String(s), 'ja'); } catch (e) { return String(s).toLowerCase(); } };
  const same = (a, b) => { const x = canon(a); return !!x && x === canon(b); };
  const near = (a, b) => { try { return CJK.similar(a, b, 'ja'); } catch (e) { return 0; } };

  // ============================================================ morae and vowels (the guide vocal sings each mora's vowel)
  const SMALL = 'ゃゅょぁぃぅぇぉゎャュョァィゥェォヮ';
  const VOW = {};
  [['a', 'あかさたなはまやらわがざだばぱぁゃゎ'], ['i', 'いきしちにひみりぎじぢびぴぃ'], ['u', 'うくすつぬふむゆるぐずづぶぷぅゅゔ'],
    ['e', 'えけせてねへめれげぜでべぺぇ'], ['o', 'おこそとのほもよろをごぞどぼぽぉょ']].forEach(([v, s]) => {
    for (const c of s) { VOW[c] = v; VOW[String.fromCharCode(c.charCodeAt(0) + 0x60)] = v; }
  });
  const SKIP = /[、。！？「」…\s・♪]/;
  function moraeOf(src) {
    const out = [];
    for (const ch of kanaOf(src)) {
      if (SKIP.test(ch)) continue;
      if (SMALL.includes(ch) && out.length) out[out.length - 1] += ch; else out.push(ch);
    }
    return out;
  }
  function vowelOf(m, prev) {
    if (m === 'っ' || m === 'ッ') return null;
    if (m === 'ー') return prev || 'a';
    if (m === 'ん' || m === 'ン') return 'u';
    return VOW[m[m.length - 1]] || VOW[m[0]] || 'a';
  }
  // a line's melody: 'B4/2 B4 C#5/4 | r/1 _/4 …' (length in sixteenths after the slash; it carries over). Each note is one
  // mora; r is a mora that's silent (っ); _ is a gap that isn't a mora. → [{ at, len, m (midi | null), mora }]
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const nn = s => { const k = /^([A-G])([#b]?)(-?\d)$/.exec(s); if (!k) throw new Error('[anime] bad note ' + s); return 12 * (+k[3] + 1) + PC[k[1]] + (k[2] === '#' ? 1 : k[2] === 'b' ? -1 : 0); };
  function melOf(str) {
    const ev = []; let at = 0, len = 2;
    for (const tok of String(str).split(/[\s|]+/)) {
      if (!tok) continue;
      const [n, l] = tok.split('/'); if (l) len = +l;
      if (n === '_') { at += len; continue; }
      ev.push({ at, len, m: n === 'r' ? null : nn(n), mora: true });
      at += len;
    }
    return { ev, len: at };
  }

  // ============================================================ the songs (all original: words and tunes written for this game)
  // Each song: the made-up show it's from, its style, its key and tempo; lines { who: 'o' (Otoha) | 'y' (you) | 'all', src
  // (the notation), en, mel }; `fill`: the lines and words you fill in (round 2); `notes`: the words and grammar it teaches.
  // The lines run back to back after `intro` sixteenths; each line's melody fills whole bars.
  const SONGS = [
    { id: 'kira', ch: 1, sound: 'an_kira', bpm: 132, intro: 32,
      title: 'キラキラ [光|ひか]って ！', titleEn: 'Sparkle and Shine!',
      show: 'マジカル ポロン', showEn: 'Magical Poron', kind: 'the opening of a magical-girl show',
      blurb: 'Poron is a girl who sings her spells. When she waves her star wand and everyone sings with her, the gloom monsters melt away.',
      style: 'sparkly disco-pop (132 bpm): four-on-the-floor, octave disco bass, glockenspiel sparkles, string stabs',
      grammar: 'Te-form requests: 見て (look!), 光って (shine!), 飛んで (fly!), 言って (say it!). Add ください to be polite.',
      lines: [
        { who: 'o', src: 'キラキラ [光|ひか]る [星|ほし] を [見|み]て', en: 'Look at the stars that sparkle and shine', mel: 'B4/2 B4 C#5 B4 A4 B4 C#5/4 | E5/2 D#5 C#5 B4 G#4/8' },
        { who: 'o', src: 'ドキドキ [胸|むね] が [踊|おど]る よ', en: 'Thump-thump, my heart is dancing', mel: 'G#4/2 G#4 A4 G#4 F#4 G#4 A4/4 | B4/2 C#5 B4 G#4/10' },
        { who: 'o', src: 'ステッキ を [振|ふ]って 、 いち 、 に 、 さん ！', en: 'Wave the wand: one, two, three!', mel: 'C#5/2 C#5/1 r/1 B4/2 A4/2 B4/1 r/1 C#5/2 _/4 | E5/2 E5/2 F#5/4 G#5/2 G#5/6' },
        { who: 'o', src: '[魔法|まほう] の [言葉|ことば] 、 [一緒|いっしょ] に [言|い]って ！', en: 'The magic words: say them with me!', mel: 'B4/2 B4 C#5 B4 G#4 A4 B4/4 | E5/2 r/1 D#5/1 C#5/2 B4/2 r/1 B4/1 _/6' },
        { who: 'o', src: 'キラキラ 、', en: 'Sparkle,', mel: 'E5/2 E5/2 F#5/2 E5/2 _/8' },
        { who: 'y', src: '[光|ひか]って ！', en: 'shine!', mel: 'C#5/4 B4/2 r/2 B4/8' },
        { who: 'o', src: 'ドキドキ 、', en: 'Thump-thump,', mel: 'D#5/2 D#5/2 E5/2 D#5/2 _/8' },
        { who: 'y', src: '[飛|と]んで ！', en: 'fly!', mel: 'B4/4 C#5/4 B4/8' },
        { who: 'o', src: '[暗|くら]い [夜|よる] も [怖|こわ]く ない', en: 'Even dark nights aren’t scary', mel: 'C#5/2 C#5 B4 A4 G#4 A4 B4/4 | C#5/2 B4 A4 G#4/10' },
        { who: 'all', src: 'マジカル ポロン 、 ここ に いる ！', en: 'Magical Poron is right here!', mel: 'E5/2 E5 E5 D#5 C#5 D#5 E5/4 | F#5/2 E5 D#5 B4 E5/8' },
      ],
      fill: [{ line: 0, tok: 1 }, { line: 0, tok: 4 }, { line: 3, tok: 6 }, { line: 5, tok: 0 }, { line: 7, tok: 0 }],
      notes: [['キラキラ', 'sparkle, twinkle: a word that draws the light'], ['ドキドキ', 'thump-thump: a pounding heart'], ['[光|ひか]る', 'to shine'],
        ['[星|ほし]', 'a star'], ['[見|み]て', 'look! (見る, te-form)'], ['[飛|と]んで', 'fly! (飛ぶ, te-form)'], ['[怖|こわ]く ない', 'not scary (怖い → 怖くない)']] },
    { id: 'robo', ch: 2, sound: 'an_robo', bpm: 118, intro: 32,
      title: 'すすめ ！ ダイテッコウ', titleEn: 'Forward, Daitekkō!',
      show: 'ダイテッコウ', showEn: 'Daitekkō, the Steel Giant', kind: 'the opening of a giant-robot show',
      blurb: 'A giant robot built from an old steel bridge, piloted by a kid who shouts its orders. Its battle cry is «すすめ!»: forward!',
      style: 'robot electro-funk (118 bpm): syncopated 808 kick, laser zaps, a pulse-wave sequencer, slap synth bass, brass stabs, a robot voice',
      grammar: 'Plain imperatives, the way a pilot shouts orders: すすめ (go forward!), まもれ (protect!), 立ち上がれ (rise up!). And the volitional 行こう: let’s go!',
      lines: [
        { who: 'o', src: 'ガシャン ！ ガシャン ！ [鉄|てつ] の [足音|あしおと]', en: 'Clank! Clank! Footsteps of steel', mel: 'A4/2 A4/1 G4/1 _/4 A4/2 A4/1 C5/1 _/4 | E5/2 D5 C5 A4 C5 D5 E5/4' },
        { who: 'o', src: '[大|おお]きな [手|て] で みんな を [守|まも]る', en: 'With giant hands, it protects everyone', mel: 'E5/2 E5 D5 C5 D5 C5 A4/4 | C5/2 A4 G4 A4 C5 A4/4 _/2' },
        { who: 'o', src: 'ゴゴゴ … [悪|わる]い [雲|くも] が [来|く]る', en: 'Rumble rumble… the bad clouds are coming', mel: 'E4/2 E4 E4 _/2 A4/2 G4 A4 C5 | B4/2 A4 G#4 B4/4 _/6' },
        { who: 'o', src: '[今|いま] だ ！ [立|た]ち[上|あ]がれ ！', en: 'Now! Rise up!', mel: 'A4/2 C5 E5/4 _/8 | E5/2 E5/2 G5/2 E5/2 D5/8' },
        { who: 'o', src: 'すすめ ！', en: 'Forward!', mel: 'A4/2 C5/2 E5/4 _/8' },
        { who: 'y', src: 'ダイテッコウ ！', en: 'Daitekkō!', mel: 'G5/2 E5/2 D5/2 r/1 E5/1 E5/4 _/4' },
        { who: 'o', src: 'まもれ ！', en: 'Protect them!', mel: 'A4/2 C5/2 E5/4 _/8' },
        { who: 'y', src: 'ダイテッコウ ！', en: 'Daitekkō!', mel: 'G5/2 A5/2 G5/2 r/1 E5/1 E5/4 _/4' },
        { who: 'all', src: '[強|つよ]い [心|こころ] で [行|い]こう ！', en: 'With a strong heart, let’s go!', mel: 'A4/2 C5 D5 E5 E5 D5 C5/4 | D5/2 E5 B4/4 _/8' },
        { who: 'all', src: 'ダイテッコウ 、 ゴー ！', en: 'Daitekkō, go!', mel: 'A5/2 G5 E5 r/1 G5/1 A5/4 _/4 | A5/4 A5/12' },
      ],
      fill: [{ line: 1, tok: 5 }, { line: 3, tok: 3 }, { line: 4, tok: 0 }, { line: 6, tok: 0 }, { line: 8, tok: 3 }],
      notes: [['ガシャン', 'clank! (metal)'], ['ゴゴゴ', 'a deep, menacing rumble'], ['すすめ', 'forward! (すすむ, to advance: ススム’s name!)'], ['まもれ', 'protect! (まもる)'],
        ['[立|た]ち[上|あ]がれ', 'rise up! (立ち上がる)'], ['[行|い]こう', 'let’s go! (行く, volitional)'], ['[鉄|てつ]', 'iron, steel']] },
    { id: 'run', ch: 3, sound: 'an_run', bpm: 160, intro: 32,
      title: '[走|はし]って [転|ころ]んで', titleEn: 'Run and Fall',
      show: '[風|かぜ] の リレー', showEn: 'Relay of the Wind', kind: 'the opening of a sports show (a relay team)',
      blurb: 'A school relay team that always comes last, until the slowest runner learns that falling down is part of running.',
      style: 'driving pop-rock (160 bpm): galloping eighth-note bass, power-chord strums, a cowbell, tom fills, a brassy lead',
      grammar: 'The te-form chains actions: 走って、転んで、また立って (run, fall, and stand again). 〜ない says what you won’t do: 負けない (I won’t lose).',
      lines: [
        { who: 'o', src: '[朝|あさ] の グラウンド 、 [風|かぜ] が [吹|ふ]く', en: 'The field in the morning, the wind blowing', mel: 'F#4/2 A4 D5 D5/1 C#5/1 D5/2 E5/2 F#5/2 _/2 | E5/2 D5 C#5 A4 B4/6 _/2' },
        { who: 'o', src: 'バトン を [持|も]って 、 [前|まえ] を [見|み]て', en: 'Hold the baton, eyes straight ahead', mel: 'F#4/2 A4 B4 A4 D5/2 r/1 C#5/1 _/4 | E5/2 F#5 E5 D5 E5/8' },
        { who: 'o', src: '[走|はし]って 、 [転|ころ]んで 、 また [立|た]って', en: 'Run, fall down, and stand up again', mel: 'D5/2 D5/1 r/1 D5/2 _/2 C#5/2 C#5/1 B4/1 A4/2 _/2 | B4/2 C#5/2 D5/3 r/1 F#5/8' },
        { who: 'o', src: '[汗|あせ] も [涙|なみだ] も ぜんぶ [力|ちから]', en: 'The sweat and the tears: it all makes us strong', mel: 'A5/2 G5 F#5 E5 F#5 G5 A5/4 | B5/2 A5 F#5 E5 F#5 D5/6' },
        { who: 'o', src: '[走|はし]れ ！', en: 'Run!', mel: 'D5/2 F#5/2 A5/4 _/8' },
        { who: 'y', src: '[負|ま]けない ！', en: 'We won’t lose!', mel: 'A5/2 B5/2 A5/2 F#5/2 _/8' },
        { who: 'o', src: '[飛|と]べ ！', en: 'Jump!', mel: 'D5/2 B5/6 _/8' },
        { who: 'y', src: 'あきらめない ！', en: 'We won’t give up!', mel: 'A5/2 A5 B5 A5 F#5 E5/2 _/4' },
        { who: 'all', src: 'みんな の バトン 、 ゴール まで', en: 'Everyone’s baton, all the way to the finish', mel: 'F#5/2 F#5 E5 D5 E5 F#5 E5/4 | D5/2 D5 E5 F#5 A5/4 _/4' },
        { who: 'all', src: '[一緒|いっしょ] に [走|はし]ろう ！', en: 'Let’s run together!', mel: 'A5/2 r/1 A5/1 B5/2 A5/2 F#5/2 E5/2 D5/4 | _/16' },
      ],
      fill: [{ line: 2, tok: 0 }, { line: 2, tok: 2 }, { line: 2, tok: 5 }, { line: 5, tok: 0 }, { line: 7, tok: 0 }],
      notes: [['[走|はし]って', 'run, and… (走る, te-form)'], ['[転|ころ]んで', 'fall down, and… (転ぶ)'], ['また [立|た]って', 'stand up again (立つ)'],
        ['[負|ま]けない', 'won’t lose (負ける → 負けない)'], ['あきらめない', 'won’t give up'], ['[走|はし]ろう', 'let’s run! (volitional)'], ['[風|かぜ]', 'the wind']] },
    { id: 'cafe', ch: 4, sound: 'an_cafe', bpm: 84, intro: 32,
      title: 'また あした', titleEn: 'See You Tomorrow',
      show: 'ねこまち カフェ', showEn: 'Cat Town Café', kind: 'the ending song of a slice-of-life show',
      blurb: 'Nothing big ever happens in Cat Town Café: friends, cocoa, a lazy cat on the counter. The ending song plays over the walk home at sunset.',
      style: 'mellow city pop (84 bpm, swung): a Rhodes, a round bass, brushes and a rimshot, vibraphone, a soft flute',
      grammar: '〜たい says what you want to do: 話したい (want to talk), 笑いたい (want to laugh), 会いたい (want to see you). 会おう / 飲もう: let’s!',
      lines: [
        { who: 'o', src: 'ゆうやけ [色|いろ] の [帰|かえ]り[道|みち]', en: 'The way home, the color of sunset', mel: 'A4/2 C5/2 D5/2 C5/2 A4/2 G4/2 F4/4 | G4/2 A4 C5 A4 G4/6 _/2' },
        { who: 'o', src: 'ねこ が あくび 、 [風|かぜ] が [優|やさ]しい', en: 'A cat yawns, the breeze is gentle', mel: 'A4/2 C5 D5 _/2 F5/2 E5/2 D5/4 | C5/2 D5 E5 F5 E5 D5 C5/4' },
        { who: 'o', src: 'もっと [話|はな]したい 、 もっと [笑|わら]いたい', en: 'I want to talk more, I want to laugh more', mel: 'D5/2 r/1 D5/1 C5/2 D5/2 F5/2 E5/2 D5/4 | D5/2 r/1 D5/1 E5/2 F5/2 G5/2 F5/2 E5/4' },
        { who: 'o', src: 'でも [今日|きょう] は もう おしまい', en: 'But today is already over', mel: 'E5/2 D5/2 C5/2 C5/2 A4/2 G4/2 A4/4 | G4/2 F4/2 G4/2 C5/10' },
        { who: 'o', src: 'また あした 、', en: 'See you tomorrow,', mel: 'F5/2 E5/2 D5/2 C5/2 D5/8' },
        { who: 'y', src: 'また あした ！', en: 'see you tomorrow!', mel: 'D5/2 C5/2 A4/2 G4/2 A4/8' },
        { who: 'o', src: '[会|あ]いたい な 、', en: 'I’ll want to see you,', mel: 'A4/2 C5/2 F5/4 E5/2 D5/6' },
        { who: 'y', src: 'また [会|あ]おう ！', en: 'let’s meet again!', mel: 'D5/2 E5/2 F5/2 G5/2 A5/8' },
        { who: 'all', src: '[明日|あした] も この カフェ で', en: 'Tomorrow too, at this café', mel: 'A5/2 G5 F5 E5 F5 G5 A5/4 | G5/2 F5/6 _/8' },
        { who: 'all', src: '[温|あたた]かい ココア 、 [飲|の]もう ね', en: 'Let’s have a warm cocoa, OK?', mel: 'F5/2 E5 D5 C5 D5/2 C5/2 A4/4 | C5/2 D5/2 C5/2 C5/2 F4/8' },
      ],
      fill: [{ line: 2, tok: 1 }, { line: 2, tok: 4 }, { line: 6, tok: 0 }, { line: 7, tok: 1 }, { line: 9, tok: 3 }],
      notes: [['ゆうやけ', 'the sunset glow'], ['[帰|かえ]り[道|みち]', 'the way home'], ['[話|はな]したい', 'want to talk (話す → 話したい)'], ['[笑|わら]いたい', 'want to laugh (笑う)'],
        ['[会|あ]いたい', 'want to see (someone)'], ['また あした', 'see you tomorrow'], ['[飲|の]もう', 'let’s drink (飲む, volitional)']] },
    { id: 'todoke', ch: 5, sound: 'an_todoke', bpm: 128, intro: 32,
      title: '[届|とど]け 、 わたし の [声|こえ]', titleEn: 'Reach Them, My Voice',
      show: 'オトハ', showEn: 'Otoha’s own song', kind: 'the song Otoha wrote for the concert, with you',
      blurb: 'Otoha wrote it about the Hush: the gray town, the voice that disappeared, and singing it back with everyone.',
      style: 'hyperpop-house (128 bpm): a pumping four-on-the-floor, glitchy stutters, a supersaw chorus, a breakdown where it goes quiet',
      grammar: '〜から gives the reason: みんながいたから (because everyone was there). 歌える: I can sing (the potential). 届け, 響け: reach! resound!',
      lines: [
        { who: 'o', src: '[静|しず]か な [街|まち] 、 [灰色|はいいろ] の [空|そら]', en: 'A quiet town, a gray sky', mel: 'E4/2 G4/2 A4/2 B4/2 B4/2 A4/2 _/4 | G4/2 A4/2 B4/2 D5/2 B4/2 A4/2 G4/4' },
        { who: 'o', src: '[声|こえ] が [消|き]えて 、 [怖|こわ]かった', en: 'My voice disappeared, and I was scared', mel: 'E4/2 G4/2 A4/2 B4/2 A4/2 G4/2 _/4 | A4/2 B4/2 C5/2 r/2 B4/8' },
        { who: 'o', src: 'でも みんな が いた から', en: 'But because everyone was there', mel: 'B4/2 B4/2 D5/2 D5/2 E5/2 D5/2 _/4 | D5/2 E5/2 G5/2 F#5/10' },
        { who: 'o', src: 'もう [一度|いちど] 、 [歌|うた]える ！', en: 'I can sing once again!', mel: 'G5/2 F#5/2 E5/2 D5/2 E5/4 _/4 | D5/2 E5/2 F#5/4 G5/8' },
        { who: 'o', src: '[届|とど]け ！', en: 'Reach them!', mel: 'G5/2 A5/2 B5/4 _/8' },
        { who: 'y', src: 'みんな の [声|こえ] ！', en: 'Everyone’s voice!', mel: 'B5/2 A5/2 G5/2 E5/2 G5/2 A5/6' },
        { who: 'o', src: '[響|ひび]け ！', en: 'Ring out!', mel: 'G5/2 A5/2 B5/4 _/8' },
        { who: 'y', src: '[空|そら] まで ！', en: 'Up to the sky!', mel: 'D6/2 B5/2 A5/2 G5/10' },
        { who: 'all', src: '[静寂|せいじゃく] なんか 、 [怖|こわ]く ない', en: 'The Hush? We’re not scared of it', mel: 'E5/2 E5 E5 D5 E5 G5 A5/4 | A5/2 G5/2 E5/2 D5/2 E5/8' },
        { who: 'all', src: '[一緒|いっしょ] に [歌|うた]おう ！', en: 'Let’s sing together!', mel: 'G5/2 r/1 G5/1 A5/2 B5/2 D6/2 B5/2 G5/4 | _/16' },
      ],
      fill: [{ line: 1, tok: 0 }, { line: 2, tok: 4 }, { line: 3, tok: 3 }, { line: 5, tok: 2 }, { line: 9, tok: 2 }],
      notes: [['[声|こえ]', 'a voice'], ['[静|しず]か', 'quiet'], ['[灰色|はいいろ]', 'gray'], ['から', 'because… (it follows the reason)'], ['[歌|うた]える', 'can sing (歌う → 歌える)'],
        ['[届|とど]け', 'reach! (届く)'], ['[響|ひび]け', 'ring out! (響く)'], ['[歌|うた]おう', 'let’s sing!']] },
  ];
  const SONG = id => SONGS.find(s => s.id === id) || null;
  // the parsed songs: each line's tokens, morae, melody and where it starts (sixteenths from the top)
  function prep(sg) {
    if (sg._p) return sg._p;
    let at = sg.intro;
    const lines = sg.lines.map((ln, i) => {
      const toks = ln.src.split(' '), mel = melOf(ln.mel), mor = moraeOf(ln.src);
      const tokMor = toks.map(t => moraeOf(t).length);       // how many morae each token has (punctuation: 0)
      const out = Object.assign({}, ln, { i, toks, tokMor, mor, mel: mel.ev, len: mel.len, at });
      at += mel.len;
      return out;
    });
    sg._p = { lines, len: at };
    return sg._p;
  }
  // checks every song: morae vs notes, whole bars ([] = fine)
  function songCheck() {
    const bad = [];
    for (const sg of SONGS) {
      const P = prep(sg);
      for (const ln of P.lines) {
        if (ln.mor.length !== ln.mel.length) bad.push(`${sg.id} line ${ln.i}: ${ln.mor.length} morae (${ln.mor.join('')}) but ${ln.mel.length} notes`);
        if (ln.len % 16) bad.push(`${sg.id} line ${ln.i}: ${ln.len} sixteenths (not whole bars)`);
      }
      for (const f of sg.fill) if (!P.lines[f.line] || !P.lines[f.line].toks[f.tok] || !P.lines[f.line].tokMor[f.tok]) bad.push(`${sg.id} fill ${f.line}/${f.tok}: no such word`);
    }
    return bad;
  }
  // ============================================================ the music: each song's own band (Sound.kit), and the guide vocal
  // Every song gets its own instruments, groove, tempo and hook (the user: songs that sounded "like the same song in a
  // different font"). Chords are one per bar: two bars of intro (the chorus hook played on the song's lead), the verse, the
  // chorus. The guide vocal sings each mora's vowel (Sound.kit.vox) an octave down, doubled by a soft lead at pitch:
  // Otoha's is warm ('otoha'); yours, when you've sung a line, is a brighter pulse ('pal').
  const KIT = () => (typeof Sound !== 'undefined' && Sound.kit) || null;
  const CHORD = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], 6: [0, 4, 7, 9], add9: [0, 4, 7, 14],
    sus4: [0, 5, 7], '7sus4': [0, 5, 7, 10], m9: [0, 3, 7, 10, 14], maj9: [0, 4, 7, 11, 14] };
  const chordCache = {};
  function chordOf(sym) {
    if (chordCache[sym]) return chordCache[sym];
    const k = /^([A-G][#b]?)(.*)$/.exec(sym), r = nn(k[1] + '2'), q = CHORD[k[2]] || CHORD[''];
    let root = r; while (root > 47) root -= 12; while (root < 36) root += 12;
    const tones = q.map(iv => { let m = r + iv; while (m < 55) m += 12; while (m > 71) m -= 12; return m; }).sort((a, b) => a - b);
    return (chordCache[sym] = { root, tones, sym });
  }
  const CHARTS = {
    kira: ['Amaj7', 'B', 'Amaj7', 'B', 'G#m7', 'C#m7', 'Amaj7', 'B', 'Eadd9', 'Eadd9', 'Amaj7', 'B', 'G#m7', 'C#m7', 'F#m7', 'B7', 'Eadd9', 'Eadd9'],
    robo: ['Am7', 'Am7', 'Am7', 'Am7', 'Fmaj7', 'G', 'Am7', 'E7', 'Dm7', 'E7', 'F', 'G', 'Am7', 'Am7', 'Dm7', 'E7', 'Am7', 'Am7'],
    run: ['D', 'A', 'D', 'A', 'Bm', 'Gmaj7', 'D', 'A', 'G', 'A', 'Gmaj7', 'A', 'Bm', 'Gmaj7', 'Em7', 'A', 'D', 'D'],
    cafe: ['Bbmaj7', 'C7', 'Fmaj7', 'Gm7', 'Dm7', 'Bbmaj7', 'Gm7', 'C7', 'Am7', 'Dm7', 'Bbmaj7', 'C7', 'Am7', 'Dm7', 'Gm7', 'C7', 'Fmaj7', 'Fmaj7'],
    todoke: ['Cmaj7', 'D', 'Em7', 'Cmaj7', 'G', 'D7', 'Em7', 'Cmaj7', 'Am7', 'D', 'Cmaj7', 'D', 'Em7', 'Cmaj7', 'Am7', 'D', 'G', 'G'],
  };
  const SWING = { kira: 0, robo: 0.06, run: 0, cafe: 0.24, todoke: 0 };
  const secOf = bar => (bar < 2 ? 'intro' : bar < 10 ? 'verse' : 'chorus');
  // the step → what the guide vocal sings there ({ line, k, ev, v (vowel) }), and the intro's hook (the chorus's first two bars)
  function vocalMap(sg) {
    const P = prep(sg);
    if (P.at) return P;
    P.at = {}; P.hook = {};
    for (const ln of P.lines) {
      let prev = null;
      ln.mel.forEach((ev, k) => { const v = vowelOf(ln.mor[k] || 'あ', prev); if (v) prev = v; P.at[ln.at + ev.at] = { line: ln.i, k, ev, v: v || prev || 'a' }; });
    }
    const c0 = P.lines[4].at;
    for (const ln of P.lines.slice(4, 6)) ln.mel.forEach(ev => { if (ev.m != null) P.hook[ln.at - c0 + ev.at] = [ev.m, ev.len]; });
    return P;
  }
  const BAND = {
    // disco-pop: four on the floor, an octave bass on the eighths, a string bed and keyboard stabs, glockenspiel sparkles
    kira(K, p, t, s16, c, nc, sec, P) {
      const s = p & 15, bar = p >> 4, ch = sec === 'chorus';
      if (!(s & 3)) K.kick(t, s ? 0.85 : 1);
      if (s === 4 || s === 12) { K.clap(t, 0.8); K.snare(t, 0.22); }
      if ((s & 3) === 2) K.hat(t, 0.5, true); else if (ch || s & 1) K.hat(t, s & 1 ? 0.16 : 0.3);
      if (ch) K.shaker(t, s & 1 ? 0.45 : 0.8);
      if (s === 0 && (bar === 2 || bar === 10)) K.crash(t, 0.8);
      if (!(s & 1)) K.synbass(c.root + (s & 2 ? 12 : 0), t, s16 * 1.6, s & 2 ? 0.7 : 0.95);
      if (s === 0) c.tones.forEach(m => K.pad(m + 12, t, s16 * 16, 'sawtooth', ch ? 2600 : 1700, 0.011));
      if (s === 6 || s === 14) c.tones.forEach((m, k) => K.keys(m + 12, t + k * 0.004, s16 * 1.2, 0.55));
      if ((bar & 1) && s >= 8 && !(s & 1)) K.glock(c.tones[((s - 8) >> 1) % c.tones.length] + 24, t, 0.5);
      if (sec === 'intro') { const n = P.hook[p]; if (n) K.lead(n[0], t, n[1] * s16, 'square', 0.75); }
    },
    // robot electro-funk: a syncopated 808, laser zaps, a pulse-wave sequencer, a slap synth bass riff, brass stabs
    robo(K, p, t, s16, c, nc, sec, P) {
      const s = p & 15, bar = p >> 4, ch = sec === 'chorus';
      if ((bar & 1 ? 'x..x..x...x.x...' : 'x..x...x..x..x..')[s] === 'x') K.kick808(t, s ? 0.8 : 1, 0.3);
      if (s === 4 || s === 12) { K.snare(t, 0.7); K.clap(t, 0.5); }
      K.hat(t, (s & 3) === 2 ? 0.55 : s & 1 ? 0.15 : 0.3, s === 14);
      if ((bar & 3) === 3 && (s === 14 || s === 15)) K.zap(t, 0.8, 2600, 160);
      for (const [st, iv, l] of [[0, 0, 2], [3, 0, 1], [6, 12, 1], [8, 10, 1.5], [10, 7, 1], [11, 0, 1], [14, 3, 2]]) if (st === s) K.synbass(c.root + iv, t, s16 * l, 0.9);
      if (s === 6 || s === 14 || (ch && s === 0)) c.tones.forEach(m => K.horn(m + 12, t, s === 0 ? 1 : 0.8, s === 0 ? s16 * 3 : s16 * 1.2));
      if (ch || sec === 'intro') K.arp(c.tones[s % c.tones.length] + 24, t, s & 1 ? 0.5 : 0.85, s16 * 0.9);
      if (s === 0 && (bar === 2 || bar === 10)) K.crash(t, 0.8);
      if (sec === 'intro') { const n = P.hook[p]; if (n) K.lead(n[0], t, n[1] * s16, 'robo', 0.8); }
    },
    // pop-rock at a sprint: a galloping bass, power-chord strums, a cowbell in the chorus, tom fills, a brassy lead
    run(K, p, t, s16, c, nc, sec, P) {
      const s = p & 15, bar = p >> 4, ch = sec === 'chorus', fill = (bar & 3) === 3 && s >= 12;
      if (fill) { K.tom(t, [196, 165, 131, 110][s - 12], 0.9); if (s === 12) K.kick(t, 0.9); }
      else {
        if (s === 0 || s === 8 || (s === 10 && (bar & 1)) || (ch && s === 6)) K.kick(t, s ? 0.85 : 1);
        if (s === 4 || s === 12) K.snare(t, 0.85);
        if (!(s & 1)) K.hat(t, s & 2 ? 0.4 : 0.6);
        if (ch && !(s & 1)) K.cowbell(t, s & 2 ? 0.35 : 0.6, !!(s & 2));
      }
      if (s === 0 && (bar === 2 || bar === 10 || (ch && !(bar & 1)))) K.crash(t, 0.85);
      if (!(s & 1) || s === 3 || s === 11) K.bass(c.root, t, s & 2 ? 0.6 : 0.85, s16 * 1.4);
      if ([0, 3, 6, 8, 11, 14].includes(s)) K.strum([c.root + 12, c.root + 19, c.root + 24], t, s === 0 || s === 8 ? 0.9 : 0.6, s16 * (s === 14 ? 2.5 : 1.3), 2.2, !!(s & 1));
      if (sec === 'intro') { const n = P.hook[p]; if (n) K.lead(n[0], t, n[1] * s16, 'trumpet', 0.85); }
    },
    // city pop, swung: a soft kick and a rimshot, brushes, a round bass that walks into the next chord, Rhodes, vibraphone
    cafe(K, p, t, s16, c, nc, sec, P) {
      const s = p & 15, bar = p >> 4, ch = sec === 'chorus';
      if (s === 0 || s === 10) K.kick(t, 0.5);
      if (s === 4 || s === 12) K.rim(t, 0.7);
      if (!(s & 1)) K.brush(t, s & 2 ? 0.5 : 0.8, s16 * 1.5);
      K.shaker(t, 0.22);
      const b = { 0: [0, 1, 5], 6: [7, 0.6, 2], 8: [12, 0.8, 4], 14: [99, 0.6, 2] }[s];
      if (b) K.upright(b[0] === 99 ? nc.root - 1 : c.root + b[0], t, b[1], b[2] * s16);
      if (s === 0) c.tones.forEach((m, k) => K.epiano(m, t + k * 0.01, s16 * 9, 0.6));
      if (s === 10) c.tones.slice(1).forEach(m => K.epiano(m + 12, t, s16 * 3, 0.35));
      if (ch && (s === 2 || s === 7)) K.vibes(c.tones[(bar + s) % c.tones.length] + 24, t, 0.4, 0.8);
      if (sec === 'intro') { const n = P.hook[p]; if (n) K.lead(n[0], t, n[1] * s16, 'flute', 0.8); }
    },
    // hyperpop-house: a pumping four-on-the-floor (the chords duck under every kick), glitch stutters, a supersaw hook; the
    // first verse lines are almost silent (the gray town), the last verse bar builds with a snare roll and a riser
    todoke(K, p, t, s16, c, nc, sec, P) {
      const s = p & 15, bar = p >> 4, ch = sec === 'chorus', quiet = sec === 'verse' && bar < 6, build = bar === 9;
      if (!(s & 3)) K.kick(t, quiet ? 0.45 : 1);
      if (!quiet && (s === 4 || s === 12)) K.clap(t, 0.9);
      if (!quiet) { if ((s & 3) === 2) K.hat(t, 0.55, true); else if (ch) K.hat(t, 0.22); }
      if (build) { if (s >= 8 || !(s & 1)) K.snare(t, 0.25 + s / 24); if (s === 0) K.swell(t, s16 * 16, 1); }
      if (s === 0 && (bar === 10 || bar === 14)) K.crash(t, 0.9);
      if (s === 0 || s === 8) K.sub808(c.root, t, s16 * 6, 0.9);
      if ((s & 3) === 2 && !quiet) K.synbass(c.root + 12, t, s16 * 1.2, 0.6);
      if ((s & 3) === 1 || (quiet && s === 0)) c.tones.forEach(m => K.pad(m + 12, t, s16 * (quiet ? 15 : 2.8), 'sawtooth', ch ? 3400 : 2200, quiet ? 0.012 : 0.009));
      if (ch && (bar & 1) && (s === 14 || s === 15)) { K.zap(t, 0.6, 3200, 900); K.arp(c.tones[2] + 24, t + s16 / 2, 0.8, s16 * 0.4); }
      if (ch) K.arp(c.tones[(s * 3) % c.tones.length] + 24, t, s & 1 ? 0.35 : 0.55, s16 * 0.5);
      if (sec === 'intro') { const n = P.hook[p]; if (n) K.lead(n[0], t, n[1] * s16, 'saw', 0.7); }
    },
  };
  function vocal(K, P, tr, p, t, s16) {
    const n = P.at[p]; if (!n || n.ev.m == null) return;
    const ln = P.lines[n.line], dur = Math.max(0.08, n.ev.len * s16 * 0.9), demo = tr.mode === 'demo';
    const her = tr.voice > 0.02 && !tr.mute[n.line] && (demo || ln.who !== 'y');
    const you = !demo && !!tr.you[n.line];
    if (her) { K.vox(n.ev.m - 12, t, dur, 0.5 * tr.voice, n.v, n.v); K.lead(n.ev.m, t, dur, 'otoha', 0.5 * tr.voice); }
    if (you) { K.vox(n.ev.m - 12, t, dur, 0.42, n.v, n.v); K.lead(n.ev.m, t, dur, 'pal', 0.55); }
  }
  function addLeads(K) {
    if (!K || !K.LEADS || K.LEADS.otoha) return;
    K.LEADS.otoha = { o: [['triangle', 1, 0, 0.7], ['sine', 2, 0, 0.12], ['sawtooth', 1, 5, 0.08]], lp: [1800, 4200, 2800], q: 0.8, vib: 0.013, g: 0.05, a: 0.014 };
    K.LEADS.pal = { o: [['pulse', 1, 0, 0.5], ['triangle', 1, 6, 0.3]], lp: [1600, 3800, 2300], q: 1, vib: 0.009, g: 0.042, a: 0.008 };
  }

  // ------------------------------------------------------------ tracks, the transport, and the player
  // A track: { name (the Sound song), bpm, swing, len (sixteenths), loopTo, play(K, p, t, s16, tr) }. Its Sound song ignores
  // the scheduler's step: it plays the transport's (tr.pos), so a line can be held (tr.hold: the band vamps on its bars) and
  // the vocal muted or given to you. tr.q keeps [time, step] for the screen, which shows what's sounding now. With no audio
  // (no sound card yet, or a background test page) the same transport runs on game time instead, silently.
  const TRACKS = {};
  const newTr = tk => ({ pos: 0, hold: null, voice: 1, mute: {}, you: {}, mode: 'demo', q: [], end: tk.len, loopTo: tk.loopTo || 0, loops: 0 });
  // (a held line you've answered — release 1 — plays once more from its top with your voice, then the song goes on)
  function advanceTr(tr) {
    let p = tr.pos;
    if (tr.hold && p >= tr.hold.end) {
      if (tr.hold.release === 2) tr.hold = null;
      else { if (tr.hold.release === 1) { tr.hold.release = 2; if (tr.hold.line !== undefined) tr.you[tr.hold.line] = true; } p = tr.hold.start; }
    }
    if (p >= tr.end) { p = tr.loopTo; tr.loops++; }
    tr.pos = p + 1;
    return p;
  }
  function registerTrack(tk) {
    if (!tk || typeof Sound === 'undefined' || !Sound.addSong) return null;
    if (TRACKS[tk.name]) return TRACKS[tk.name];
    const def = { bpm: tk.bpm, len: tk.len, from: tk.loopTo || 0, swing: tk.swing || 0, vol: 0.3, verb: 0.1, tr: null, track: tk,
      play(i, t, s16) {
        const tr = this.tr || (this.tr = newTr(tk)), p = advanceTr(tr);
        tr.q.push([t - (i & 1 ? s16 * this.swing : 0), p]); if (tr.q.length > 96) tr.q.shift();
        const K = KIT(); if (!K) return;
        try { tk.play(K, p, t, s16, tr); } catch (e) { if (!this.err) { this.err = 1; console.error('[anime] track ' + tk.name, e); } }
      } };
    Sound.addSong(tk.name, def);
    return (TRACKS[tk.name] = def);
  }
  function songTrack(sg) {
    const P = vocalMap(sg), chart = CHARTS[sg.id], band = BAND[sg.id];
    return { name: sg.sound, bpm: sg.bpm, swing: SWING[sg.id] || 0, len: P.len, loopTo: sg.intro,
      play(K, p, t, s16, tr) {
        const bar = p >> 4, c = chordOf(chart[bar % chart.length]), nc = chordOf(chart[(bar + 1) % chart.length]);
        band(K, p, t, s16, c, nc, secOf(bar), P);
        vocal(K, P, tr, p, t, s16);
      } };
  }
  function registerSongs() { addLeads(KIT()); for (const sg of SONGS) registerTrack(songTrack(sg)); }
  // a small room for the songs: one convolver, warm and short
  function roomIR(ac, sec = 1.1) {
    const n = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, n, ac.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let lp = 0; for (let i = 0; i < n; i++) { const k = i / n; lp += (Math.random() * 2 - 1 - lp) * (0.8 - 0.6 * k); d[i] = lp * Math.pow(1 - k, 2.6) * 0.45; } }
    return b;
  }
  // the player: one track at a time, into our own bus (a level, a muffle for the Hush, a little room), the area's music ducked
  const PL = { tk: null, def: null, tr: null, deck: null, silent: true, gt: 0, vt: 0, s16: 0.125, level: 0.32, muffle: 0, on: false };
  let BUS = null;
  const audioOK = () => typeof Sound !== 'undefined' && !!Sound.ctx && Sound.ctx.state === 'running' && !!Sound.out && !!Sound.deck;
  function bus() {
    const ac = Sound.ctx;
    if (BUS && BUS.ac === ac) return BUS;
    const inp = ac.createGain(), lp = ac.createBiquadFilter(), vol = ac.createGain(), conv = ac.createConvolver(), wet = ac.createGain();
    lp.type = 'lowpass'; lp.frequency.value = 18000; lp.Q.value = 0.7; vol.gain.value = 0; conv.buffer = roomIR(ac); wet.gain.value = 0.16;
    inp.connect(lp); inp.connect(conv); conv.connect(wet); wet.connect(lp); lp.connect(vol); vol.connect(Sound.out);
    return (BUS = { ac, inp, lp, vol });
  }
  function startTrack(name, o = {}) {
    stopTrack(true);
    const def = TRACKS[name]; if (!def) return null;
    const tk = def.track, tr = def.tr = newTr(tk);
    tr.pos = o.from || 0; if (o.mode) tr.mode = o.mode;
    Object.assign(PL, { tk, def, tr, deck: null, silent: true, gt: 0, vt: 0.08, s16: 60 / tk.bpm / 4, level: o.level || 0.32, muffle: 0, on: true });
    if (audioOK()) {
      const B = bus(), ac = Sound.ctx;
      B.vol.gain.cancelScheduledValues(ac.currentTime); B.vol.gain.setValueAtTime(0, ac.currentTime);
      B.vol.gain.linearRampToValueAtTime(Sound.music ? PL.level : 0, ac.currentTime + 0.25);
      B.lp.frequency.setValueAtTime(18000, ac.currentTime);
      PL.deck = Sound.deck(name, B.inp, { at: ac.currentTime + 0.1, from: 0 });
      PL.silent = !PL.deck;
    }
    return PL;
  }
  function stopTrack(now) {
    if (PL.deck) { const d = PL.deck; PL.deck = null; if (BUS && audioOK()) { const ac = Sound.ctx; BUS.vol.gain.cancelScheduledValues(ac.currentTime); BUS.vol.gain.setTargetAtTime(0, ac.currentTime, now ? 0.03 : 0.25); } setTimeout(() => d.stop(), now ? 80 : 900); }
    PL.on = false; PL.tr = null; PL.tk = null; PL.def = null;
    if (typeof Sound !== 'undefined' && Sound.duck) Sound.duck('anime', 1);
  }
  // every frame while a track plays (from the room's update, or outdoors at the concert)
  function tickTrack(dt) {
    if (!PL.on || !PL.tr) return;
    PL.gt += dt;
    if (PL.silent) { let n = 0; while (PL.vt <= PL.gt && n++ < 64) { const p = advanceTr(PL.tr); PL.tr.q.push([PL.vt, p]); if (PL.tr.q.length > 96) PL.tr.q.shift(); PL.vt += PL.s16; } }
    else if (BUS) {
      const ac = Sound.ctx;
      BUS.vol.gain.setTargetAtTime(Sound.music ? PL.level : 0, ac.currentTime, 0.1);
      BUS.lp.frequency.setTargetAtTime(lerp(18000, 600, PL.muffle), ac.currentTime, 0.2);
      if (Sound.duck) Sound.duck('anime', 0.12, 0.5);
    }
  }
  // what's sounding now: the transport's step, with the fraction (−1 before the first step)
  function trackNow() {
    const tr = PL.tr; if (!tr || !tr.q.length) return -1;
    const now = PL.silent ? PL.gt : Sound.ctx.currentTime;
    let best = null; for (const e of tr.q) { if (e[0] <= now + 1e-4) best = e; else break; }
    if (!best) return -1;
    return best[1] + clamp((now - best[0]) / PL.s16, 0, 0.999);
  }
  const MUSIC = { registerTrack, start: startTrack, stop: stopTrack, tick: tickTrack, now: trackNow, get PL() { return PL; }, audioOK, chordOf, KIT };
  // ============================================================ lines (lines.js format; ja only, with the English weave)
  // Otoha and Susumu are kids: casual Japanese (CJK.md). Neither genders you; your own lines are English (STORY.you).
  const T = (ja, en) => ({ ja: [ja], en: [en] });
  const LT = {
    // the first visit: she's singing, sees you, and her voice goes
    'an.sing1': T('キラキラ [光|ひか]る … [星|ほし] を …', 'Sparkle and shine… the stars…'),
    'an.stop': T('あっ … ！', 'Oh…!'),
    'an.su.gone': T('おねえちゃん 、 また [声|こえ] が [出|で]なく なった ！', 'Sis, your voice is gone again!'),
    'an.sorry': T('ご 、 ごめん ね ！ だれ か が [聞|き]いて いる と 、 [声|こえ] が [消|き]えちゃう の 。', 'S-sorry! When someone’s listening, my voice just disappears.'),
    'an.name': T('わたし 、 オトハ ！ [歌|うた] が [大好|だいす]き な の 。', 'I’m Otoha! I love singing.'),
    'an.su.name': T('ぼく は ススム ！ ステップ [王|おう] だ よ 。', 'I’m Susumu! The King of Steps.'),
    'an.gray': T('[町|まち] が [灰色|はいいろ] に なって から 、 [人前|ひとまえ] で [歌|うた]えない の 。', 'Ever since the town went gray, I can’t sing in front of people.'),
    'an.dream': T('いつか 、 [古|ふる]い [劇場|げきじょう] の [前|まえ] で [歌|うた]いたい な 。', 'Someday I want to sing in front of the old theater.'),
    'an.ask': T('ねえ 、 いっしょ に [歌|うた]って くれる ？ [二人|ふたり] なら 、 [声|こえ] が [出|で]る かも ！', 'Hey, will you sing with me? With two of us, maybe my voice will come out!'),
    'an.yay': T('やった ！ まず は 、 わたし の いちばん [好|す]き な アニメ の [歌|うた] ！', 'Yay! First, a song from my very favorite anime!'),
    // the chapters
    'an.c1': T('「 マジカル ポロン 」 ！ [歌|うた] で [魔法|まほう] を かける [女|おんな] の [子|こ] の アニメ だ よ 。', '«Magical Poron»! An anime about a girl who casts her spells by singing.'),
    'an.c1.end': T('[聞|き]こえた ？ わたし の [声|こえ] 、 ちゃんと [出|で]た ！', 'Did you hear that? My voice came out, for real!'),
    'an.c1.gift': T('これ 、 ポロン の [缶|かん]バッジ 。 あげる ！', 'Here, a Poron button badge. It’s yours!'),
    'an.c2': T('ススム の [好|す]き な ロボット アニメ 、 「 ダイテッコウ 」 ！ さけぶ [歌|うた] だ よ 。', 'Susumu’s favorite robot anime, «Daitekkō»! It’s a song you shout.'),
    'an.c2.end': T('ススム 、 [泣|な]きそう な [顔|かお] で [聞|き]いてた よ 。 「 すすめ 」 って 、 あの [子|こ] の [名前|なまえ] みたい でしょ ？', 'Susumu was listening like he was about to cry. «Susume!» sounds just like his name, right?'),
    'an.c2.gift': T('ダイテッコウ の [缶|かん]バッジ も あげる ！', 'A Daitekkō badge for you too!'),
    'an.c3': T('[今日|きょう] は スポーツ アニメ 。 [転|ころ]んで も 、 また [立|た]つ [歌|うた] ！', 'Today it’s a sports anime. A song about falling down and getting back up!'),
    'an.c3.end': T('[転|ころ]んで も いい ん だ ね 。 また [立|た]てば いい 。', 'It’s OK to fall, isn’t it? You just get up again.'),
    'an.c3.gift': T('リレー の [缶|かん]バッジ 。 [走|はし]る [靴|くつ] の [絵|え] だ よ 。', 'A relay badge. It has a running shoe on it.'),
    'an.c4': T('ゆうやけ の [歌|うた] 。 アニメ の [最後|さいご] に [流|なが]れる 、 [静|しず]か な [歌|うた] だ よ 。', 'A sunset song. The quiet one that plays at the very end of an anime.'),
    'an.c4.fear': T('ほんと は ね 、 [怖|こわ]い の 。 [声|こえ] が ずっと [戻|もど]らなかったら 、 どう しよう って 。', 'Honestly? I’m scared. What if my voice never comes back?'),
    'an.c4.end': T('… でも 、 [歌|うた]いたい 。 みんな の [前|まえ] で 、 [歌|うた]いたい ！', '…But I want to sing. I want to sing in front of everyone!'),
    'an.c4.gift': T('ねこ の [缶|かん]バッジ 。 カフェ の ねこ だ よ 。', 'A cat badge. It’s the café’s cat.'),
    'an.c5': T('わたし 、 [歌|うた] を [作|つく]った の ！ [静寂|せいじゃく] の [歌|うた] 。 [聞|き]いて くれる ？', 'I wrote a song! A song about the Hush. Will you listen?'),
    'an.c5.plan': T('[古|ふる]い [劇場|げきじょう] の [前|まえ] で 、 コンサート を する ！ [来|き]て ね ！', 'I’m giving a concert in front of the old theater! You’ll come, right?'),
    'an.c5.go': T('[劇場|げきじょう] で [待|ま]って る ね ！', 'I’ll be waiting at the theater!'),
    // the concert
    'an.k.hello': T('みんな 、 [来|き]て くれて ありがとう ！', 'Everyone, thank you for coming!'),
    'an.k.nervous': T('[緊張|きんちょう] する … ！', 'I’m so nervous…!'),
    'an.k.hush': T('あ … [声|こえ] が … [出|で]ない …', 'Ah… my voice… it won’t come…'),
    'an.k.back': T('[聞|き]こえる ！ みんな の [声|こえ] が 、 [聞|き]こえる ！', 'I can hear it! I can hear everyone’s voices!'),
    'an.k.end': T('ありがとう ！ わたし 、 もう [怖|こわ]く ない よ 。', 'Thank you! I’m not scared anymore.'),
    'an.k.band': T('{mimo} に 、 [応援|おうえん] の はちまき ！', 'For {mimo}: a cheering headband!'),
    'an.k.card': T('それ と 、 ファンクラブ の [会員証|かいいんしょう] 。 [一番|いちばん] だ よ ！', 'And a fan club card. You’re number one!'),
    'an.k.encore': T('アンコール ？ … もちろん ！', 'An encore? …Of course!'),
    // the room
    'an.back': T('あ 、 いらっしゃい ！', 'Oh, welcome!'),
    'an.locked': T('[次|つぎ] の [歌|うた] は 、 まだ [練習中|れんしゅうちゅう] な の 。 また [来|き]て ね ！', 'The next song is still in practice. Come back later, OK?'),
    'an.menu': T('どの [歌|うた] に する ？', 'Which song shall we do?'),
    'an.chat1': T('カラオケ で は 、 アニソン を [歌|うた]う [人|ひと] が すごく [多|おお]い ん だ よ 。', 'So many people sing anime songs at karaoke, you know.'),
    'an.chat2': T('[歌詞|かし] を [覚|おぼ]える と 、 [言葉|ことば] も [覚|おぼ]えられる よ ！', 'Learn the lyrics and you learn the words too!'),
    'an.chat3': T('ススム に は ないしょ だ けど 、 ダイテッコウ の [歌|うた] 、 わたし も [好|す]き 。', 'Don’t tell Susumu, but I like the Daitekkō song too.'),
    'an.chat4': T('オープニング は 「 オーピー 」 、 エンディング は 「 イーディー 」 って [言|い]う の 。', 'People call the opening song the “OP” and the ending song the “ED”.'),
    'an.done': T('[歌|うた] は ぜんぶ [覚|おぼ]えた ね ！ いつ でも いっしょ に [歌|うた]おう ！', 'You know every song now! Let’s sing together any time!'),
    'an.leak': T('… キラキラ [光|ひか]る [星|ほし] を [見|み]て …', '…look at the stars that sparkle and shine…'),
  };
  function registerLines() { if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v; }
  // the karaoke screen's quick words: [notation, English]
  const PANEL_SAY = {
    praise: [['いい ね ！', 'Nice!'], ['[上手|じょうず] ！', 'So good!'], ['その [調子|ちょうし] ！', 'That’s it!'], ['すごい ！', 'Amazing!']],
    oops: [['おしい ！', 'So close!'], ['[大丈夫|だいじょうぶ] 、 もう [一回|いっかい] ！', 'It’s OK, once more!']],
    listen: ['まず は [聞|き]いて ね 。', 'First, just listen.'],
    fill: ['[歌詞|かし] の [穴|あな] を うめて ！', 'Fill in the holes in the lyrics!'],
    sing: ['[灰色|はいいろ] の ところ を [歌|うた]って ね ！', 'You sing the gray parts, OK?'],
    go: ['いく よ ！ せーの ！', 'Here we go! Ready… set…'],
    done: ['[最後|さいご] まで [歌|うた]えた ！', 'We sang it all the way through!'],
    phrase: ['これ 、 [覚|おぼ]えて ！', 'Remember this one!'],
    hushed: ['… … …', '(The Hush has taken her voice.)'],
  };

  // ============================================================ phrases (the Phrasebook) and things you get
  const PHRASES = [
    { id: 'ph.ot.ganbatte', ja: 'がんばって ！', en: 'You can do it! / Go for it!', alt: ['がんばれ ！', 'がんばって ください ！'], note: 'Cheering someone on before (or during) something hard. To a teacher: がんばってください. The plain がんばれ! is what a crowd shouts.' },
    { id: 'ph.ot.sugoi', ja: 'すごい ！', en: 'Amazing!', alt: ['すごーい ！', 'すげー ！'], note: 'Everyday praise. Stretch it (すごーい!) when you’re really impressed.' },
    { id: 'ph.ot.kakkoii', ja: 'かっこいい ！', en: 'So cool!', alt: ['かっこいい ね ！'], note: 'For anything cool: a robot, a dance move, a person.' },
    { id: 'ph.ot.kawaii', ja: 'かわいい ！', en: 'So cute!', alt: ['かわいい ね ！'], note: 'For anything cute. The word is everywhere in Japan.' },
    { id: 'ph.ot.daijoubu', ja: '[大丈夫|だいじょうぶ] ！', en: 'It’s OK! / You’ll be fine!', alt: ['[大丈夫|だいじょうぶ] だ よ ！'], note: 'Comforting someone, or saying you’re fine. As a question, [大丈夫|だいじょうぶ]？ means “are you OK?”' },
    { id: 'ph.ot.kinchou', ja: '[緊張|きんちょう] する …', en: 'I’m nervous…', alt: ['[緊張|きんちょう] して る …'], note: 'Stage fright, a test, a big match: 緊張 is the tense, nervous feeling.' },
    { id: 'ph.ot.encore', ja: 'アンコール ！', en: 'Encore!', note: 'Shouted (often again and again) when a concert ends: one more song!' },
    { id: 'ph.ot.issho', ja: 'いっしょ に [歌|うた]おう ！', en: 'Let’s sing together!', alt: ['[一緒|いっしょ] に [歌|うた]おう ！', 'いっしょ に うたおう よ ！'], note: 'いっしょに = together; 歌おう = let’s sing (the volitional of 歌う).' },
  ];
  const ITEMS = [
    { id: 'k.anBadge', kind: 'key', ja: '[缶|かん]バッジ', en: 'Anime button badge', icon: 'anBadge' },
    { id: 'k.fanCard', kind: 'key', ja: 'ファンクラブ [会員証|かいいんしょう]', en: 'Otoha’s fan club card, No. 1', icon: 'fanCard' },
  ];
  function registerItems() {
    if (typeof LEX === 'undefined' || !LEX.register) return;
    LEX.register(PHRASES.filter(p => !LEX.item(p.id)).map(p => ({ id: p.id, kind: 'phrase', ja: p.ja, en: p.en, note: p.note, region: 'Otoha', register: 'casual', icon: 'mic', alt: { ja: p.alt || [] } })));
    LEX.register(ITEMS.filter(it => !LEX.item(it.id)).map(it => Object.assign({}, it)));
  }
  function registerIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const has = k => ICONS.keys && ICONS.keys.includes(k), add = (k, fn) => { if (!has(k)) ICONS.add(k, fn); };
    const star = (cx, cy, r1, r2) => k => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; if (i) k.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); else k.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } k.closePath(); };
    add('mic', (c, p, h) => {
      h.shape(c, p, h.rr(-6, -2, 12, 34, 5), '#4a4256');
      h.shape(c, p, h.ell(0, -16, 15, 17), '#ff7fb6');
      if (p) { for (const y of [-22, -16, -10]) { c.beginPath(); c.moveTo(-11, y); c.lineTo(11, y); c.lineWidth = 1.4; c.strokeStyle = 'rgba(43,34,53,0.45)'; c.stroke(); } h.shape(c, 1, star(0, -16, 6, 2.6), '#ffe15a', 1.2); }
    });
    add('anBadge', (c, p, h) => {
      h.shape(c, p, h.ell(0, 0, 30, 30), '#ff8cc6');
      h.shape(c, p, h.ell(0, 0, 23, 23), '#fff4fa', 1.6);
      h.shape(c, p, star(0, 1, 17, 7), '#ffcf3f', 1.8);
      if (p) { h.dot(c, -5, -1, 2.2, INK); h.dot(c, 5, -1, 2.2, INK); }
    });
    add('fanCard', (c, p, h) => {
      h.shape(c, p, h.rr(-32, -22, 64, 44, 6), '#fff4fa');
      h.shape(c, p, h.rr(-32, -22, 64, 12, 6), '#ff5fa2', 1.4);
      h.shape(c, p, star(-16, 8, 10, 4.5), '#ffcf3f', 1.4);
      if (p) { c.font = '800 13px "Segoe UI", sans-serif'; c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('No.1', 12, 9); }
    });
    add('note', (c, p, h) => {
      h.shape(c, p, h.ell(-10, 18, 10, 8, -0.4), '#3f7fc9'); h.shape(c, p, h.ell(14, 12, 10, 8, -0.4), '#3f7fc9');
      h.shape(c, p, h.poly([[-2, 16], [-2, -26], [22, -32], [22, 10], [20, 10], [20, -22], [0, -17], [0, 16]]), '#3f7fc9');
    });
  }
  // ============================================================ the siblings in 3D (toon parts with ink hulls, like actors.js; legs, so they can dance)
  // Otoha: a high side ponytail with a big star scrunchie, a mint cardigan over a white tee, a navy pleated skirt, white
  // socks, red sneakers, a pink toy microphone. Susumu: spiky hair under a red cap worn backwards, an orange T-shirt with a
  // white arrow, blue shorts, a white wristband, neon-green sneakers. Original characters, nobody's likeness.
  const LOOK = {
    otoha: { h: 0.93, skin: '#f6d0ae', hair: '#3a2430', top: '#7fd6c2', tee: '#fffaf2', skirt: '#2f3f73', legs: '#f4f1ea', shoe: '#e0503f', acc: '#ffcf3f', kind: 'otoha' },
    susumu: { h: 0.76, skin: '#f0c49c', hair: '#1d1822', top: '#ff9a3c', tee: '#fffaf2', shorts: '#3a5a9a', legs: '#f0c49c', shoe: '#7ae04a', acc: '#e0503f', kind: 'susumu' },
  };
  const lathe = (pts, n = 18) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), n);
  function eyeOf(parent, x, y, z, sx, sy) {
    const e = new THREE.Group(); e.position.set(x, y, z); parent.add(e);
    e.add(TK.part(TK.G.sphere, INK, null, [sx, sy, sx * 0.62], { ink: 0, rim: 0 }));
    const hl = new THREE.Mesh(TK.G.sphere, new THREE.MeshBasicMaterial({ color: '#ffffff' })); hl.scale.setScalar(sx * 0.42); hl.position.set(sx * 0.32, sy * 0.38, sx * 0.55); e.add(hl);
    return e;
  }
  function buildKid(who) {
    const o = LOOK[who], part = TK.part, Gk = TK.G;
    const root = new THREE.Group(), body = new THREE.Group(); root.add(body); root.scale.setScalar(o.h);
    const legs = [-1, 1].map(s => {
      const hip = new THREE.Group(); hip.position.set(s * 0.11, 0.42, 0); body.add(hip);
      hip.add(part(Gk.cyl, o.legs, [0, -0.17, 0], [0.072, 0.34, 0.072]));
      hip.add(part(Gk.sphere, o.shoe, [0, -0.36, 0.045], [0.1, 0.075, 0.145]));
      if (who === 'susumu') hip.add(part(Gk.box, '#fffaf2', [0, -0.37, 0.06], [0.16, 0.025, 0.2], { ink: 0 }));      // the sneakers' white soles
      return hip;
    });
    const torso = new THREE.Group(); body.add(torso);
    if (o.skirt) torso.add(part(lathe([[0, 0.3], [0.33, 0.3], [0.26, 0.5], [0.2, 0.57], [0, 0.57]], 14), o.skirt));
    else torso.add(part(lathe([[0, 0.3], [0.24, 0.3], [0.23, 0.52], [0, 0.52]], 16), o.shorts));
    torso.add(part(lathe([[0, 0.5], [0.22, 0.5], [0.25, 0.64], [0.22, 0.84], [0.12, 0.93], [0, 0.94]]), o.top));
    if (who === 'otoha') {
      torso.add(part(Gk.box, o.tee, [0, 0.74, 0.205], [0.16, 0.3, 0.04], { ink: 0.008 }));                        // the tee, between the cardigan's fronts
      for (const s of [-1, 1]) torso.add(part(Gk.sphere, '#ffffff', [s * 0.11, 0.7, 0.23], [0.02, 0.02, 0.02], { ink: 0 }));   // buttons
    } else {
      torso.add(part(Gk.box, o.tee, [0, 0.69, 0.235], [0.05, 0.16, 0.02], { ink: 0 }));                          // the arrow on his shirt
      torso.add(part(new THREE.ConeGeometry(0.07, 0.1, 3), o.tee, [0, 0.8, 0.235], null, { ink: 0 }));
    }
    const arms = [-1, 1].map(s => {
      const sh = new THREE.Group(); sh.position.set(s * 0.25, 0.85, 0); torso.add(sh);
      sh.add(part(Gk.cyl, o.top, [0, -0.14, 0], [0.065, 0.28, 0.065]));
      sh.add(part(Gk.sphere, o.skin, [0, -0.31, 0], [0.068, 0.068, 0.068]));
      if (who === 'susumu' && s > 0) sh.add(part(Gk.cyl, '#fffaf2', [0, -0.25, 0], [0.075, 0.05, 0.075], { ink: 0.008 }));   // a wristband
      return sh;
    });
    const head = new THREE.Group(); head.position.y = 0.97; torso.add(head);
    head.add(part(Gk.sphere, o.skin, [0, 0.26, 0], [0.36, 0.35, 0.34]));
    head.add(part(new THREE.SphereGeometry(1, 22, 14, 0, TAU, 0, Math.PI * 0.55), o.hair, [0, 0.28, -0.03], [0.38, 0.38, 0.37], { rot: [-0.45, 0, 0] }));
    const extra = {};
    if (who === 'otoha') {
      head.add(part(new THREE.SphereGeometry(1, 16, 8, -0.9, 1.8, 0, Math.PI * 0.32), o.hair, [0, 0.36, 0.05], [0.36, 0.3, 0.33], { rot: [0.25, 0, 0], ink: 0.01 }));   // bangs
      const tail = new THREE.Group(); tail.position.set(0.3, 0.52, -0.06); head.add(tail);                                             // the side ponytail
      tail.add(part(Gk.sphere, o.acc, [0, 0, 0], [0.08, 0.08, 0.08], { ink: 0.01 }));
      tail.add(part(new THREE.ConeGeometry(0.06, 0.07, 5), o.acc, [0.06, 0.04, 0.02], null, { rot: [0, 0, -1.2], ink: 0.008 }));
      tail.add(part(new THREE.ConeGeometry(0.06, 0.07, 5), o.acc, [-0.02, 0.07, 0.03], null, { rot: [0, 0, 0.3], ink: 0.008 }));
      tail.add(part(Gk.sphere, o.hair, [0.1, -0.22, -0.02], [0.11, 0.28, 0.1], { rot: [0, 0, -0.35] }));
      tail.add(part(Gk.sphere, o.hair, [0.18, -0.46, -0.03], [0.07, 0.16, 0.07], { rot: [0, 0, -0.2] }));
      extra.tail = tail;
      // the toy microphone, in the right hand
      const mic = new THREE.Group(); mic.position.set(0, -0.36, 0.03); arms[1].add(mic);
      mic.add(part(Gk.cyl, '#4a4256', [0, 0.02, 0], [0.025, 0.16, 0.025], { ink: 0.006 }));
      mic.add(part(Gk.sphere, '#ff7fb6', [0, 0.13, 0], [0.055, 0.055, 0.055], { ink: 0.008 }));
      extra.mic = mic;
    } else {
      for (let i = 0; i < 6; i++) { const a = -0.9 + i * 0.36; head.add(part(new THREE.ConeGeometry(0.07, 0.2, 6), o.hair, [Math.sin(a) * 0.3, 0.42 + Math.cos(i) * 0.03, 0.18 + Math.cos(a) * 0.06], null, { rot: [0.9, 0, -a * 0.8], ink: 0.01 })); }
      const cap = new THREE.Group(); cap.position.set(0, 0.5, -0.02); cap.rotation.y = Math.PI; head.add(cap);      // worn backwards
      cap.add(part(new THREE.SphereGeometry(1, 18, 10, 0, TAU, 0, Math.PI / 2), o.acc, [0, -0.05, 0], [0.37, 0.25, 0.37], { ink: 0.012 }));
      cap.add(part(Gk.cyl, o.acc, [0, -0.04, 0.33], [0.2, 0.025, 0.15], { ink: 0.01 }));
      cap.add(part(Gk.sphere, '#fffaf2', [0, 0.2, 0], [0.04, 0.04, 0.04], { ink: 0 }));
    }
    const eyes = [-1, 1].map(s => eyeOf(head, s * 0.13, 0.25, 0.3, who === 'susumu' ? 0.05 : 0.055, who === 'susumu' ? 0.075 : 0.088));
    for (const s of [-1, 1]) { const b = new THREE.Mesh(TK.G.sphere, new THREE.MeshBasicMaterial({ color: '#ff8c9a', transparent: true, opacity: 0.5 })); b.scale.set(0.06, 0.033, 0.02); b.position.set(s * 0.21, 0.13, 0.29); b.rotation.y = s * 0.5; head.add(b); }
    const mouth = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.011, 6, 12, Math.PI), new THREE.MeshBasicMaterial({ color: INK }));
    mouth.position.set(0, 0.12, 0.33); mouth.rotation.z = Math.PI; head.add(mouth);
    root.traverse(m => { if (m.isMesh) m.castShadow = true; });
    return Object.assign({ root, body, torso, legs, arms, head, eyes, mouth, who }, extra);
  }
  // st: { x, y, z, yaw, talk (0..1), pose: idle | talk | sing | dance | cheer | shy | read | wave | step, dir ('L' 'R' 'U' 'D'), look? }
  function animateKid(k, st, dt, t) {
    k.root.position.set(st.x, st.y, st.z); k.root.rotation.y = st.yaw;
    const pose = st.pose || 'idle', sw = Math.sin(t * 2.1 + (k.who === 'susumu' ? 1 : 0));
    let aR = [-0.15, 0, 0.18], aL = [-0.15, 0, -0.18], lR = 0, lL = 0, bob = 0, lean = 0, hx = 0, tw = 0;
    if (pose === 'sing') {
      aR = [-2.3 + Math.sin(t * 3) * 0.05, -0.3, 0.55]; aL = [-0.7 + Math.sin(t * 2) * 0.4, 0, -0.9 - Math.sin(t * 2) * 0.2];
      lean = Math.sin(t * 2.4) * 0.06; bob = Math.abs(Math.sin(t * 4.8)) * 0.02; hx = -0.12;
    } else if (pose === 'dance' || pose === 'step') {
      const b = st.beat === undefined ? (t * 2.2) % 1 : st.beat, up = Math.sin(b * Math.PI);
      bob = up * 0.08; aR = [-1.4 + Math.sin(b * TAU) * 0.9, 0, 0.5]; aL = [-1.4 - Math.sin(b * TAU) * 0.9, 0, -0.5];
      const d = st.dir || (Math.floor(t * 2.2) % 2 ? 'L' : 'R');
      if (d === 'L') { lL = -0.7 * up; lean = 0.18 * up; } else if (d === 'R') { lR = -0.7 * up; lean = -0.18 * up; }
      else if (d === 'U') { lR = lL = -0.35 * up; bob += up * 0.1; } else { lR = 0.4 * up; lL = 0.4 * up; bob -= up * 0.05; }
      tw = Math.sin(b * TAU) * 0.2;
    } else if (pose === 'cheer') {
      aR = [-2.9 + Math.sin(t * 9) * 0.2, 0, 0.3]; aL = [-2.9 - Math.sin(t * 9) * 0.2, 0, -0.3]; bob = Math.abs(Math.sin(t * 7)) * 0.07;
    } else if (pose === 'shy') {
      aR = [-0.9, 0.2, -0.35]; aL = [-0.9, -0.2, 0.35]; hx = 0.3; lean = Math.sin(t * 1.5) * 0.03;
    } else if (pose === 'read') {
      aR = [-1.2, 0, -0.25]; aL = [-1.2, 0, 0.25]; hx = 0.35;
    } else if (pose === 'wave') {
      aL = [-0.3, 0, -2.4 + Math.sin(t * 9) * 0.35];
    } else if (pose === 'talk' || st.talk > 0.3) {
      aR = [-0.6 + Math.sin(t * 5) * 0.25, 0, 0.35 + Math.sin(t * 2.5) * 0.15];
    }
    if (st.wave && pose !== 'wave') aL = [-0.3, 0, -2.4 + Math.sin(t * 9) * 0.35];
    k.arms[1].rotation.set(...aR); k.arms[0].rotation.set(...aL);
    k.legs[1].rotation.x = damp(k.legs[1].rotation.x, lR, 14, dt); k.legs[0].rotation.x = damp(k.legs[0].rotation.x, lL, 14, dt);
    k.body.position.y = bob + (st.talk || 0) * Math.abs(Math.sin(t * 13)) * 0.02;
    k.body.rotation.z = lean + sw * 0.012; k.body.rotation.y = tw;
    k.head.rotation.x = damp(k.head.rotation.x, hx, 6, dt);
    k.head.rotation.y = damp(k.head.rotation.y, st.look !== undefined ? st.look : 0, 5, dt);
    k.mouth.scale.y = (st.talk || 0) > 0.3 || pose === 'sing' ? 1 + Math.abs(Math.sin(t * 15)) * 2.6 : 1;
    if (k.tail) k.tail.rotation.z = Math.sin(t * 2.6) * 0.08 + (pose === 'dance' ? Math.sin(t * 9) * 0.15 : 0);
    if (k.mic) k.mic.visible = pose === 'sing' || !!st.mic;
    if ((st.blink = (st.blink || 2) - dt) < 0) { if (st.blink < -0.12) st.blink = 2 + Math.random() * 3; }
    k.eyes.forEach(e => { e.scale.y = st.blink < 0 || pose === 'cheer' ? 0.2 : 1; });
  }
  // ============================================================ 3D helpers: pieces → one vertex-colored toon mesh and one ink hull (as school.js does)
  const GEO = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 14), ball: new THREE.SphereGeometry(1, 14, 10),
    cone: new THREE.ConeGeometry(1, 1, 10) };
  const GSIZE = new Map([[GEO.box, [1, 1, 1]], [GEO.cyl, [2, 1, 2]], [GEO.ball, [2, 2, 2]], [GEO.cone, [2, 1, 2]]]);
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  const M4 = (x, y, z, sx, sy, sz, rx, ry, rz) => new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx || 0, ry || 0, rz || 0)), _s.set(sx, sy, sz));
  function Kit() {
    const P = [], H = [], GL = [];
    const k = {
      P, H, GL,
      add(geo, color, x, y, z, sx, sy, sz, rx, ry, rz, o = {}) {
        const m = M4(x, y, z, sx, sy, sz, rx, ry, rz);
        (o.glow ? GL : P).push({ geo, color, m });
        const w = o.ink === undefined ? 0.016 : o.ink, g = GSIZE.get(geo);
        if (w > 0 && g) H.push({ geo, color: INK, m: M4(x, y, z, sx + (2 * w) / g[0], sy + (2 * w) / g[1], sz + (2 * w) / g[2], rx, ry, rz) });
        return k;
      },
      box(x, y, z, w, h, d, color, o = {}) { return k.add(GEO.box, color, x, y, z, w, h, d, o.rx, o.ry, o.rz, o); },
      cyl(x, y, z, r, h, color, o = {}) { return k.add(GEO.cyl, color, x, y, z, r, h, r, o.rx, o.ry, o.rz, o); },
      ball(x, y, z, rx, ry, rz, color, o = {}) { return k.add(GEO.ball, color, x, y, z, rx, ry, rz, 0, o.ry, 0, o); },
    };
    return k;
  }
  function bakeInto(group, k) {
    const out = {};
    if (k.P.length) { out.mesh = new THREE.Mesh(TK.merge(k.P), TK.toon('#ffffff', { vc: true, rim: 0.22 })); out.mesh.castShadow = true; out.mesh.receiveShadow = true; group.add(out.mesh); }
    if (k.H.length) { out.hull = new THREE.Mesh(TK.merge(k.H), new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })); group.add(out.hull); }
    if (k.GL.length) { out.glow = new THREE.Mesh(TK.merge(k.GL), new THREE.MeshBasicMaterial({ vertexColors: true })); group.add(out.glow); }
    return out;
  }
  const canvasTex = (w, h, draw) => { const t = TK.canvasTex(w, h, draw); t.anisotropy = 4; return t; };
  const plane = (w, h, tex, o = {}) => {
    const mat = o.basic ? new THREE.MeshBasicMaterial({ map: tex, transparent: !!o.alpha, side: o.double ? THREE.DoubleSide : THREE.FrontSide })
      : new THREE.MeshToonMaterial({ map: tex, gradientMap: TK.grad, transparent: !!o.alpha, alphaTest: o.alpha ? 0.4 : 0, side: o.double ? THREE.DoubleSide : THREE.FrontSide });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.receiveShadow = !o.basic; return m;
  };
  const starPath = (c, cx, cy, r1, r2) => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; c[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r); } c.closePath(); };
  function jtext(c, text, x, y, px, color, o = {}) {
    c.font = `${o.w || 800} ${px}px ${FONT}`; c.textAlign = o.align || 'center'; c.textBaseline = 'middle';
    if (o.stroke) { c.lineWidth = o.stroke; c.strokeStyle = o.sc || INK; c.lineJoin = 'round'; c.strokeText(text, x, y); }
    c.fillStyle = color; c.fillText(text, x, y);
  }
  // the made-up shows' posters (shapes only: a wand, a robot, a relay track, a cat on a cup)
  function posterTex(id) {
    return canvasTex(256, 360, c => {
      const W = 256, H = 360;
      if (id === 'kira') {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ff9ad0'); g.addColorStop(1, '#7a5cd6'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        for (let i = 0; i < 26; i++) { starPath(c, (i * 97) % W, (i * 53) % 250, 4 + (i % 3) * 2, 2); c.fillStyle = 'rgba(255,255,255,0.8)'; c.fill(); }
        c.strokeStyle = '#fffaf0'; c.lineWidth = 8; c.beginPath(); c.moveTo(70, 300); c.lineTo(150, 150); c.stroke();
        starPath(c, 158, 132, 54, 22); c.fillStyle = '#ffe15a'; c.fill(); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
        jtext(c, 'マジカル', W / 2, 290, 34, '#fffaf0', { stroke: 7, sc: '#c2306f' }); jtext(c, 'ポロン', W / 2, 330, 40, '#ffe15a', { stroke: 7, sc: '#c2306f' });
      } else if (id === 'robo') {
        c.fillStyle = '#2c3e66'; c.fillRect(0, 0, W, H); c.fillStyle = '#3f5a8c'; for (let i = 0; i < 8; i++) c.fillRect(0, i * 45, W, 22);
        c.fillStyle = '#c8d2e0'; c.fillRect(78, 70, 100, 70); c.fillRect(48, 150, 160, 110); c.fillRect(30, 160, 30, 90); c.fillRect(196, 160, 30, 90);
        c.fillStyle = '#ff5a3c'; c.fillRect(92, 92, 72, 20); c.fillStyle = '#ffcf3f'; c.beginPath(); c.moveTo(128, 170); c.lineTo(110, 215); c.lineTo(126, 215); c.lineTo(116, 248); c.lineTo(150, 196); c.lineTo(132, 196); c.lineTo(146, 170); c.closePath(); c.fill();
        c.lineWidth = 5; c.strokeStyle = INK; c.strokeRect(78, 70, 100, 70); c.strokeRect(48, 150, 160, 110);
        jtext(c, 'ダイテッコウ', W / 2, 310, 36, '#ffcf3f', { stroke: 8, sc: '#1d1822' });
      } else if (id === 'run') {
        c.fillStyle = '#7fc96a'; c.fillRect(0, 0, W, H); c.fillStyle = '#d9643f'; c.fillRect(0, 150, W, 140);
        c.strokeStyle = '#fffaf0'; c.lineWidth = 4; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, 160 + i * 34); c.lineTo(W, 150 + i * 36); c.stroke(); }
        c.fillStyle = '#ffcf3f'; c.save(); c.translate(128, 120); c.rotate(-0.5); c.fillRect(-60, -10, 120, 20); c.lineWidth = 4; c.strokeStyle = INK; c.strokeRect(-60, -10, 120, 20); c.restore();
        c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 5; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(30, 60 + i * 22); c.quadraticCurveTo(90, 40 + i * 22, 130, 64 + i * 22); c.stroke(); }
        jtext(c, '風のリレー', W / 2, 322, 40, '#fffaf0', { stroke: 8, sc: '#2f6f3a' });
      } else {
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffb35a'); g.addColorStop(1, '#e0643f'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(190, 80, 34, 0, TAU); c.fill();
        c.fillStyle = '#fffaf0'; c.fillRect(72, 190, 112, 80); c.beginPath(); c.arc(186, 228, 18, -1.4, 1.4); c.lineWidth = 9; c.strokeStyle = '#fffaf0'; c.stroke();
        c.fillStyle = '#3a2a2a'; c.beginPath(); c.ellipse(128, 168, 42, 30, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(128, 128, 26, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(108, 112); c.lineTo(112, 86); c.lineTo(124, 104); c.closePath(); c.fill(); c.beginPath(); c.moveTo(148, 112); c.lineTo(144, 86); c.lineTo(132, 104); c.closePath(); c.fill();
        c.fillStyle = '#ffe15a'; c.beginPath(); c.arc(119, 126, 4, 0, TAU); c.arc(137, 126, 4, 0, TAU); c.fill();
        jtext(c, 'ねこまちカフェ', W / 2, 318, 32, '#fffaf0', { stroke: 7, sc: '#8a3a2a' });
      }
      c.lineWidth = 10; c.strokeStyle = '#fffaf0'; c.strokeRect(5, 5, W - 10, H - 10);
    });
  }

  // ============================================================ outside: house 13 in ja games (a chalkboard sign by the door, a poster)
  function house() {
    if (typeof TOWN === 'undefined' || !TOWN.layout) return null;
    const b = TOWN.layout.buildings.filter(q => q.kind === 'house')[HOUSE_N - 1];
    if (!b) return null;
    const c = Math.cos(b.rot), s = Math.sin(b.rot), at = b.doorAt || null;
    const world = (lx, lz) => ({ x: b.x + lx * c + lz * s, z: b.z - lx * s + lz * c });
    const dlx = at ? (at.x - b.x) * c - (at.z - b.z) * s : 0;
    return { b, world, dlx, front: b.d / 2, yaw: b.rot, GY: (typeof TOWN !== 'undefined' && TOWN.GY) || 0.25 };
  }
  function boardTex() {
    return canvasTex(256, 320, c => {
      c.fillStyle = '#7a5636'; c.fillRect(0, 0, 256, 320); c.fillStyle = '#2f3a36'; c.fillRect(14, 14, 228, 292);
      c.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 40; i++) c.fillRect((i * 61) % 228 + 14, (i * 37) % 292 + 14, 30, 2);
      jtext(c, '♪ オトハ ♪', 128, 62, 38, '#ffb3d9', { w: 700 });
      jtext(c, '&', 128, 108, 28, '#fffaf0', { w: 700 });
      jtext(c, '★ ススム ★', 128, 152, 38, '#9fe8ff', { w: 700 });
      jtext(c, 'カラオケ と', 128, 212, 30, '#fffaf0', { w: 700 }); jtext(c, 'ダンス！', 128, 252, 34, '#ffe15a', { w: 700 });
      c.strokeStyle = '#ffe15a'; c.lineWidth = 3; starPath(c, 36, 290, 12, 5); c.stroke(); starPath(c, 220, 288, 10, 4); c.stroke();
    });
  }
  let OUT = null;
  const SOLID = { x: 1e5, z: 1e5, r: 0.38, anime: true };     // the board's solid (WORLD.extra; parked far off outside ja)
  function buildOutside() {
    const h = house(); if (!h || !G) return null;
    const g = new THREE.Group(); g.name = 'anime-outside'; g.position.set(h.b.x, h.GY, h.b.z); g.rotation.y = h.yaw; G.w3d.scene.add(g);
    const F = h.front, k = Kit(), bx = h.dlx + 1.25, bz = F + 0.5;
    // the A-frame chalkboard, standing in the little front yard beside the door
    for (const s of [-1, 1]) k.box(bx, 0.55, bz + s * 0.2, 0.62, 1.1, 0.04, '#7a5636', { rx: -s * 0.2 });      // (the two faces lean together at the top)
    const board = plane(0.52, 0.66, boardTex()); board.position.set(bx, 0.6, bz + 0.226); board.rotation.x = -0.2; g.add(board);
    const back = plane(0.52, 0.66, boardTex()); back.position.set(bx, 0.6, bz - 0.226); back.rotation.set(0.2, Math.PI, 0); g.add(back);
    // the Magical Poron poster taped to the purple door, and a little string of star lights over it
    const pst = plane(0.56, 0.78, posterTex('kira')); pst.position.set(h.dlx, 1.55, F + 0.15); g.add(pst);      // (town.js's door panel stands ~0.13 proud of the wall)
    for (let i = 0; i < 7; i++) { const x = h.dlx - 1.0 + i * 0.36; k.add(GEO.ball, ['#ffcf3f', '#ff7fb6', '#7fe0d0'][i % 3], x, 2.55 - Math.sin((i / 6) * Math.PI) * 0.16, F + 0.08, 0.06, 0.06, 0.06, 0, 0, 0, { glow: true }); }
    const baked = bakeInto(g, k);
    return { g, baked, board: h.world(bx, bz + 0.9), boardSolid: h.world(bx, bz), door: h.world(h.dlx, F + 0.55), doorIn: h.world(h.dlx, F + 0.2), h };
  }
  function outdoor() {
    if (!G) return;
    const want = isOn();
    if (want && !OUT) { try { OUT = buildOutside() || { broken: true }; } catch (e) { console.error('[anime]', e); OUT = { broken: true }; } }
    const town = G.town && G.town.group;
    const vis = want && !!OUT && !OUT.broken && !(G.indoors && G.indoors()) && (!town || town.visible);
    if (OUT && OUT.g) OUT.g.visible = vis;
    if (!WORLD.extra.includes(SOLID)) WORLD.extra.push(SOLID);
    if (vis && OUT.boardSolid) { SOLID.x = OUT.boardSolid.x; SOLID.z = OUT.boardSolid.z; } else { SOLID.x = SOLID.z = 1e5; }
  }
  function boardCard() {
    return { tag: 'The chalkboard by the pink house’s door', lines: [
      { text: 'オトハ と ススム', en: 'Otoha and Susumu', look: { face: '#2f3a36', edge: '#7a5636', ink: '#ffb3d9' } },
      { text: 'カラオケ と ダンス ！', en: 'Karaoke and dancing!', look: { face: '#2f3a36', edge: '#7a5636', ink: '#ffe15a' } }] };
  }
  // ============================================================ the rooms (float at y 300; walls face inward, a dollhouse; built on the first visit)
  // The living room (RA): warm planks, a round star rug as Otoha's stage, the TV on a low cabinet with the karaoke screen,
  // a mic stand and two speakers, the four shows' posters, a manga shelf, a low table with cushions and snacks, string
  // lights, and the doorway to Susumu's room in the east wall. The game room (RB): the dance machine against the north wall
  // (two pads, so you can battle), Susumu's bed, manga piles, a beanbag, a trophy shelf, a Daitekkō poster.
  const SPOT = {
    a: { otoha: { x: -1.0, z: -2.5 }, rug: { x: -1.0, z: -1.6 }, tv: { x: -1.0, z: -3.9 }, spawn: { x: 0, z: 3.7 }, exit: { x: 0, z: 4.55 },
      toB: { x: 6.0, z: -1.0 }, fromB: { x: 5.0, z: -1.0 }, shelf: { x: -5.4, z: 2.3 }, posterN: { x: 3.4, z: -4.2 }, posterW: { x: -5.7, z: -2.4 }, table: { x: 2.8, z: 1.3 } },
    b: { susumu: { x: 2.6, z: -1.4 }, padL: { x: -1.15, z: -1.95 }, padR: { x: 1.15, z: -1.95 }, machine: { x: 0, z: -3.75 }, spawn: { x: -4.2, z: -1.2 },
      back: { x: -5.0, z: -1.2 }, trophies: { x: 4.6, z: -2.6 }, bed: { x: -3.9, z: 2.4 }, poster: { x: 4.9, z: 1.6 } },
  };
  let ROOM = null;
  function floorTex() {
    return canvasTex(512, 512, c => {
      for (let i = 0; i < 8; i++) {
        c.fillStyle = ['#c98e5a', '#d29966', '#c4875a', '#d6a06e'][i % 4]; c.fillRect(0, i * 64, 512, 64);
        c.fillStyle = 'rgba(70,40,20,0.3)'; c.fillRect(0, i * 64, 512, 3);
        c.fillStyle = 'rgba(70,40,20,0.12)'; for (let j = 0; j < 9; j++) c.fillRect((j * 97 + i * 41) % 512, i * 64 + 10 + (j % 5) * 9, 60 + (j % 3) * 30, 2);
        c.fillStyle = 'rgba(70,40,20,0.25)'; c.fillRect(((i * 173) % 400) + 40, i * 64, 3, 64);
      }
    });
  }
  function wallTex(col) {
    return canvasTex(256, 256, c => {
      c.fillStyle = col; c.fillRect(0, 0, 256, 256);
      c.fillStyle = 'rgba(255,255,255,0.22)'; for (let x = 0; x < 256; x += 32) c.fillRect(x, 0, 12, 256);         // soft stripes
      for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(120,90,110,${0.02 + (i % 5) * 0.01})`; c.fillRect((i * 37) % 256, (i * 91) % 256, 2, 2); }
    });
  }
  function rugTex() {
    return canvasTex(512, 512, c => {
      c.clearRect(0, 0, 512, 512);
      c.fillStyle = '#ff8cc6'; c.beginPath(); c.arc(256, 256, 250, 0, TAU); c.fill();
      c.fillStyle = '#ffd1e8'; c.beginPath(); c.arc(256, 256, 206, 0, TAU); c.fill();
      for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; starPath(c, 256 + Math.cos(a) * 228, 256 + Math.sin(a) * 228, 14, 6); c.fillStyle = '#fff4fa'; c.fill(); }
      starPath(c, 256, 256, 120, 50); c.fillStyle = '#ffe15a'; c.fill(); c.lineWidth = 8; c.strokeStyle = '#ff5fa2'; c.stroke();
    });
  }
  function tvTex() {
    return canvasTex(512, 288, c => {
      const g = c.createLinearGradient(0, 0, 0, 288); g.addColorStop(0, '#3a1f6b'); g.addColorStop(1, '#c2306f'); c.fillStyle = g; c.fillRect(0, 0, 512, 288);
      for (let i = 0; i < 30; i++) { starPath(c, (i * 89) % 512, (i * 47) % 288, 4 + (i % 3) * 2, 2); c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill(); }
      jtext(c, '♪ カラオケ ♪', 256, 110, 64, '#fffaf0', { stroke: 10, sc: '#ff5fa2' });
      jtext(c, 'オトハ の うたちょう', 256, 196, 34, '#ffe15a', { stroke: 6, sc: '#3a1f6b' });
    });
  }
  function spinesTex() {
    return canvasTex(256, 256, c => {
      c.fillStyle = '#5a3a2a'; c.fillRect(0, 0, 256, 256);
      const cols = ['#e0503f', '#3f7fc9', '#ffcf3f', '#4f9a5a', '#ff8cc6', '#8a5ab0', '#fffaf0', '#2b2235', '#ff9a3c'];
      for (let r = 0; r < 4; r++) { let x = 4; let i = r * 7; while (x < 250) { const w = 10 + ((i * 7) % 9); c.fillStyle = cols[i % cols.length]; c.fillRect(x, r * 64 + 8, w, 52); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x, r * 64 + 14, w, 4); x += w + 2; i++; } }
    });
  }
  function marqueeTex() {
    return canvasTex(512, 128, c => {
      const g = c.createLinearGradient(0, 0, 512, 0); g.addColorStop(0, '#2a0f4a'); g.addColorStop(0.5, '#4a1a7a'); g.addColorStop(1, '#2a0f4a'); c.fillStyle = g; c.fillRect(0, 0, 512, 128);
      c.shadowColor = '#ff5fa2'; c.shadowBlur = 18; jtext(c, 'ヤジルシ', 150, 66, 54, '#fff0fa', { stroke: 6, sc: '#ff5fa2' });
      c.shadowColor = '#21c4b4'; jtext(c, 'フィーバー', 384, 66, 50, '#e8fffb', { stroke: 6, sc: '#21c4b4' });
      c.shadowBlur = 0; starPath(c, 262, 64, 22, 9); c.fillStyle = '#ffe15a'; c.fill();
    });
  }
  function screenTex() {
    return canvasTex(512, 384, c => {
      c.fillStyle = '#120a24'; c.fillRect(0, 0, 512, 384);
      c.strokeStyle = 'rgba(33,196,180,0.25)'; c.lineWidth = 2; for (let y = 0; y < 384; y += 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); }
      const W = [['ひだり', '#3f9cff'], ['うえ', '#ffcf3f'], ['した', '#7ae04a'], ['みぎ', '#ff5a7a']];
      W.forEach(([w, col], i) => { c.fillStyle = col; c.globalAlpha = 0.9; c.fillRect(34 + i * 120, 40, 98, 64); c.globalAlpha = 1; jtext(c, w, 83 + i * 120, 72, 30, '#120a24'); });
      W.forEach(([w, col], i) => { for (let j = 0; j < 3; j++) if ((i + j) % 2 === 0) { c.strokeStyle = col; c.lineWidth = 4; c.strokeRect(40 + i * 120, 150 + j * 70, 86, 48); jtext(c, w, 83 + i * 120, 174 + j * 70, 24, col); } });
      jtext(c, 'HIGH SCORE  ススム', 256, 362, 26, '#ffe15a');
    });
  }
  function padTex() {
    return canvasTex(256, 256, c => {
      c.fillStyle = '#3a3448'; c.fillRect(0, 0, 256, 256);
      c.fillStyle = '#4c4560'; for (const [x, y] of [[0, 0], [170, 0], [0, 170], [170, 170]]) c.fillRect(x + 6, y + 6, 74, 74);
      c.fillStyle = '#ffe15a'; starPath(c, 128, 128, 30, 13); c.fill();
      const A = [[128, 43, 0, '#ffcf3f'], [213, 128, 1, '#ff5a7a'], [128, 213, 2, '#7ae04a'], [43, 128, 3, '#3f9cff']];
      for (const [x, y, r, col] of A) {
        c.save(); c.translate(x, y); c.rotate(r * Math.PI / 2);
        c.fillStyle = '#241e30'; c.fillRect(-38, -38, 76, 76);
        c.fillStyle = col; c.beginPath(); c.moveTo(0, -28); c.lineTo(26, 2); c.lineTo(10, 2); c.lineTo(10, 26); c.lineTo(-10, 26); c.lineTo(-10, 2); c.lineTo(-26, 2); c.closePath(); c.fill();
        c.restore();
      }
    });
  }
  function trophyTex() {
    return canvasTex(256, 128, c => { c.fillStyle = '#5a3a2a'; c.fillRect(0, 0, 256, 128); jtext(c, 'ステップ王', 128, 64, 44, '#ffe15a', { stroke: 5, sc: '#2b1d15' }); });
  }
  function buildRoom(R, which) {
    const g = new THREE.Group(); g.name = 'anime-room-' + which; g.position.set(R.x, R.y, R.z); g.visible = false; G.w3d.scene.add(g);
    const k = Kit(), solids = [], glows = [], HW = R.hw, HD = R.hd, WH = R.wh;
    const ft = floorTex(); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(2.4, 2);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2 * HW, 0.3, 2 * HD), new THREE.MeshToonMaterial({ map: ft, gradientMap: TK.grad }));
    floor.position.y = -0.15; floor.receiveShadow = true; g.add(floor);
    const wm = new THREE.MeshToonMaterial({ map: wallTex(which === 'a' ? '#ffe3ec' : '#d8e8ff'), gradientMap: TK.grad });
    for (const [w, x, z, ry] of [[2 * HW, 0, -HD, 0], [2 * HW, 0, HD, Math.PI], [2 * HD, -HW, 0, HALF], [2 * HD, HW, 0, -HALF]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), wm); m.position.set(x, WH / 2, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    }
    solids.push({ obox: 1, x: 0, z: -HD - 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: 0, z: HD + 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 },
      { obox: 1, x: -HW - 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 }, { obox: 1, x: HW + 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 });
    const WOOD = '#8a5a3a', WOOD2 = '#b07a4f';
    k.box(0, 0.08, -HD + 0.04, 2 * HW, 0.16, 0.06, '#fffaf0', { ink: 0 }).box(-HW + 0.04, 0.08, 0, 0.06, 0.16, 2 * HD, '#fffaf0', { ink: 0 }).box(HW - 0.04, 0.08, 0, 0.06, 0.16, 2 * HD, '#fffaf0', { ink: 0 });
    const out = { g, which, R, solids, sprites: [] };
    if (which === 'a') {
      const A = SPOT.a;
      // the stage rug
      const rug = plane(4.4, 4.4, rugTex(), { alpha: true }); rug.rotation.x = -HALF; rug.position.set(A.rug.x, 0.012, A.rug.z); g.add(rug);
      // the TV on its cabinet, the speakers, the mic stand
      k.box(A.tv.x, 0.35, -HD + 0.45, 2.6, 0.7, 0.7, WOOD2).box(A.tv.x, 0.72, -HD + 0.45, 2.66, 0.05, 0.74, WOOD);
      k.box(A.tv.x, 1.55, -HD + 0.35, 2.3, 1.36, 0.12, '#1d1822');
      const tv = plane(2.1, 1.18, tvTex(), { basic: true }); tv.position.set(A.tv.x, 1.55, -HD + 0.42); g.add(tv); out.tv = tv;
      for (const s of [-1, 1]) { const x = A.tv.x + s * 1.75; k.box(x, 0.55, -HD + 0.45, 0.6, 1.1, 0.55, '#2b2235'); k.cyl(x, 0.78, -HD + 0.73, 0.18, 0.02, '#4a4256', { rx: HALF, ink: 0.008 }).cyl(x, 0.36, -HD + 0.73, 0.12, 0.02, '#4a4256', { rx: HALF, ink: 0.008 }); }
      solids.push({ obox: 1, x: A.tv.x, z: -HD + 0.45, hw: 2.1, hd: 0.4, rot: 0 });
      const ms = { x: A.tv.x - 2.0, z: -2.9 };
      k.cyl(ms.x, 0.03, ms.z, 0.22, 0.05, '#2b2235').cyl(ms.x, 0.7, ms.z, 0.018, 1.36, '#2b2235', { ink: 0.008 }).cyl(ms.x, 1.42, ms.z, 0.035, 0.18, '#2b2235', { ink: 0.008 });
      k.ball(ms.x, 1.56, ms.z, 0.07, 0.07, 0.07, '#c0c4cc', { ink: 0.01 });
      solids.push({ x: ms.x, z: ms.z, r: 0.25 });
      // the posters (north wall right, west wall), the window, the string lights
      const pN = plane(1.2, 1.68, posterTex('robo')); pN.position.set(A.posterN.x, 2.15, -HD + 0.03); g.add(pN);
      const pN2 = plane(1.0, 1.4, posterTex('cafe')); pN2.position.set(A.posterN.x + 1.7, 2.0, -HD + 0.03); g.add(pN2);
      const pW = plane(1.2, 1.68, posterTex('kira')); pW.position.set(-HW + 0.03, 2.15, A.posterW.z); pW.rotation.y = HALF; g.add(pW);
      const pW2 = plane(1.0, 1.4, posterTex('run')); pW2.position.set(-HW + 0.03, 2.0, A.posterW.z + 1.6); pW2.rotation.y = HALF; g.add(pW2);
      for (let i = 0; i < 15; i++) { const x = -HW + 0.6 + i * ((2 * HW - 1.2) / 14); k.add(GEO.ball, ['#ffcf3f', '#ff7fb6', '#7fe0d0'][i % 3], x, WH - 0.35 - Math.sin((i / 14) * Math.PI * 3) * 0.12, -HD + 0.12, 0.07, 0.07, 0.07, 0, 0, 0, { glow: true }); }
      glows.push({ x: A.tv.x, y: 1.6, z: -HD + 0.8, c: '#ff8cc6', s: 3.2 });
      // the manga shelf (west wall, by the door)
      const sx = -HW + 0.35;
      k.box(sx, 1.0, A.shelf.z, 0.6, 2.0, 1.8, WOOD);
      const sp = plane(1.7, 1.86, spinesTex()); sp.position.set(sx + 0.31, 1.0, A.shelf.z); sp.rotation.y = HALF; g.add(sp);
      solids.push({ obox: 1, x: sx, z: A.shelf.z, hw: 0.35, hd: 0.95, rot: 0 });
      // the low table, cushions, snacks
      const T = A.table;
      k.box(T.x, 0.36, T.z, 1.7, 0.08, 1.1, WOOD2); for (const [dx, dz] of [[-0.75, -0.45], [0.75, -0.45], [-0.75, 0.45], [0.75, 0.45]]) k.box(T.x + dx, 0.16, T.z + dz, 0.08, 0.32, 0.08, WOOD);
      k.cyl(T.x - 0.3, 0.45, T.z, 0.22, 0.08, '#fffaf0').ball(T.x - 0.3, 0.5, T.z, 0.16, 0.06, 0.16, '#e0503f', { ink: 0.008 });
      for (let i = 0; i < 4; i++) k.box(T.x + 0.35 + i * 0.04, 0.47, T.z + 0.2, 0.025, 0.012, 0.3, '#c98e5a', { ink: 0, ry: 0.4 });
      k.cyl(T.x + 0.45, 0.47, T.z - 0.25, 0.07, 0.14, '#7fd6c2', { ink: 0.008 }).cyl(T.x + 0.25, 0.47, T.z - 0.3, 0.07, 0.14, '#ff8cc6', { ink: 0.008 });
      for (const [dx, dz, col] of [[0, -0.95, '#ff8cc6'], [0, 0.95, '#7fd6c2'], [-1.25, 0, '#ffcf3f']]) k.box(T.x + dx, 0.05, T.z + dz, 0.62, 0.1, 0.62, col, { ink: 0.01 });
      solids.push({ obox: 1, x: T.x, z: T.z, hw: 0.95, hd: 0.65, rot: 0 });
      // the doorway to Susumu's room (east wall): a frame, a curtain, his name on a paper star
      const dz = A.toB.z;
      k.box(HW - 0.05, 1.2, dz - 0.75, 0.12, 2.4, 0.12, WOOD).box(HW - 0.05, 1.2, dz + 0.75, 0.12, 2.4, 0.12, WOOD).box(HW - 0.05, 2.42, dz, 0.12, 0.12, 1.62, WOOD);
      k.box(HW - 0.03, 1.2, dz, 0.02, 2.3, 1.4, '#3a2a4a', { ink: 0 });
      const nt = canvasTex(256, 200, c => { c.clearRect(0, 0, 256, 200); c.fillStyle = '#3a6fc9'; c.fillRect(0, 0, 256, 200); for (let i = 0; i < 3; i++) { c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(i * 86 + 4, 0, 78, 200); } jtext(c, 'ススム', 128, 70, 56, '#fffaf0', { stroke: 6 }); jtext(c, 'の へや', 128, 140, 40, '#ffe15a', { stroke: 5 }); });
      const nr = plane(1.3, 1.0, nt, { double: true }); nr.position.set(HW - 0.06, 1.85, dz); nr.rotation.y = -HALF; g.add(nr);
      // plants in the corners, a cushion by the window
      for (const [x, z] of [[HW - 0.6, HD - 0.7], [-HW + 0.6, -HD + 0.7]]) { k.cyl(x, 0.22, z, 0.24, 0.44, '#e0743c'); k.ball(x, 0.7, z, 0.36, 0.32, 0.36, '#5a9a4a', { ink: 0.01 }).ball(x + 0.1, 0.95, z - 0.05, 0.24, 0.2, 0.24, '#6aaa52', { ink: 0.01 }); solids.push({ x, z, r: 0.34 }); }
      k.box(0, 0.016, HD - 0.5, 1.6, 0.02, 0.7, '#c2306f', { ink: 0 });
      out.otoha = { k: buildKid('otoha'), st: { x: R.x + A.otoha.x, y: R.y, z: R.z + A.otoha.z, yaw: 0, baseYaw: 0, talk: 0, pose: 'idle', top: 1.95, name: 'オトハ' } };
      out.otoha.k.root.position.set(A.otoha.x, 0, A.otoha.z); g.add(out.otoha.k.root);
      solids.push({ x: A.otoha.x, z: A.otoha.z, r: 0.4 });
    } else {
      const B = SPOT.b;
      // the dance machine: the cabinet (screen, marquee, speakers), and the platform with two pads in front
      const M = B.machine;
      k.box(M.x, 1.45, M.z, 3.0, 2.9, 1.0, '#2a1f3a').box(M.x, 2.95, M.z + 0.05, 3.2, 0.1, 1.1, '#ff5fa2', { ink: 0.01 });
      for (const s of [-1, 1]) { k.box(M.x + s * 1.9, 1.2, M.z + 0.1, 0.7, 2.4, 0.8, '#1d1822'); k.cyl(M.x + s * 1.9, 1.7, M.z + 0.51, 0.24, 0.03, '#4a4256', { rx: HALF, ink: 0.008 }).cyl(M.x + s * 1.9, 0.9, M.z + 0.51, 0.3, 0.03, '#4a4256', { rx: HALF, ink: 0.008 }); }
      const scr = plane(2.3, 1.72, screenTex(), { basic: true }); scr.position.set(M.x, 1.7, M.z + 0.51); g.add(scr); out.screen = scr;
      const mq = plane(3.0, 0.75, marqueeTex(), { basic: true }); mq.position.set(M.x, 3.42, M.z + 0.42); g.add(mq);
      k.box(M.x, 3.42, M.z + 0.38, 3.1, 0.82, 0.06, '#1d1822');
      k.box(M.x, 0.09, B.padL.z, 4.6, 0.18, 2.2, '#4a4256');
      for (const P of [B.padL, B.padR]) { const pt = plane(2.0, 2.0, padTex()); pt.rotation.x = -HALF; pt.position.set(P.x, 0.185, P.z); g.add(pt); }
      k.box(M.x, 1.05, M.z + 0.75, 4.2, 0.07, 0.07, '#c0c4cc', { ink: 0.008 }); for (const s of [-1, 1]) k.box(M.x + s * 2.05, 0.6, M.z + 0.75, 0.07, 0.95, 0.07, '#c0c4cc', { ink: 0.008 });   // the safety bar
      glows.push({ x: M.x, y: 1.8, z: M.z + 1.0, c: '#7a5cff', s: 4.0 }, { x: M.x, y: 3.4, z: M.z + 0.8, c: '#ff5fa2', s: 3.0 });
      solids.push({ obox: 1, x: M.x, z: M.z, hw: 2.3, hd: 0.55, rot: 0 });
      WORLD.addPlatforms([{ box: [R.x + M.x - 2.3, R.x + M.x + 2.3, R.z + B.padL.z - 1.1, R.z + B.padL.z + 1.1], top: R.y + 0.18, anime: true }]);
      // Susumu's bed, manga piles, a beanbag
      const bd = B.bed;
      k.box(bd.x, 0.3, bd.z, 1.4, 0.6, 2.6, WOOD).box(bd.x, 0.66, bd.z, 1.3, 0.14, 2.5, '#3a7fc9', { ink: 0.01 }).box(bd.x, 0.78, bd.z - 0.95, 0.9, 0.16, 0.45, '#fffaf0', { ink: 0.01 });
      solids.push({ obox: 1, x: bd.x, z: bd.z, hw: 0.72, hd: 1.32, rot: 0 });
      for (let p = 0; p < 3; p++) for (let i = 0; i < 4 + p; i++) k.box(-2.6 + p * 0.5, 0.05 + i * 0.09, 3.2 - p * 0.3, 0.32, 0.08, 0.46, ['#e0503f', '#3f7fc9', '#ffcf3f', '#4f9a5a', '#ff8cc6', '#fffaf0'][(i + p) % 6], { ink: 0.006, ry: (i % 2) * 0.2 });
      k.ball(1.6, 0.32, 2.7, 0.62, 0.36, 0.62, '#ff9a3c', { ink: 0.012 }); solids.push({ x: 1.6, z: 2.7, r: 0.55 });
      // the trophy shelf (east wall), the Daitekkō poster, the doorway back (west wall)
      const tx = R.hw - 0.3, tz = B.trophies.z;
      k.box(tx, 0.9, tz, 0.5, 1.8, 1.6, WOOD).box(tx - 0.02, 1.0, tz, 0.44, 0.06, 1.5, WOOD2).box(tx - 0.02, 1.6, tz, 0.44, 0.06, 1.5, WOOD2);
      for (let i = 0; i < 3; i++) { const z = tz - 0.5 + i * 0.5, y0 = i === 1 ? 1.63 : 1.03; k.cyl(tx - 0.05, y0 + 0.06, z, 0.09, 0.08, '#c9a24a', { ink: 0.008 }).cyl(tx - 0.05, y0 + 0.22, z, 0.03, 0.22, GOLD, { ink: 0.006 }); k.add(GEO.cone, GOLD, tx - 0.05, y0 + 0.43, z, 0.13, 0.2, 0.13, Math.PI, 0, 0, { ink: 0.008 }); }
      const tp = plane(1.3, 0.62, trophyTex()); tp.position.set(tx - 0.26, 0.45, tz); tp.rotation.y = -HALF; g.add(tp);
      solids.push({ obox: 1, x: tx, z: tz, hw: 0.3, hd: 0.82, rot: 0 });
      const rp = plane(1.2, 1.68, posterTex('robo')); rp.position.set(R.hw - 0.03, 2.1, B.poster.z); rp.rotation.y = -HALF; g.add(rp);
      const bz = B.back.z;
      k.box(-R.hw + 0.05, 1.2, bz - 0.75, 0.12, 2.4, 0.12, WOOD).box(-R.hw + 0.05, 1.2, bz + 0.75, 0.12, 2.4, 0.12, WOOD).box(-R.hw + 0.05, 2.42, bz, 0.12, 0.12, 1.62, WOOD);
      k.box(-R.hw + 0.03, 1.2, bz, 0.02, 2.3, 1.4, '#5a2a4a', { ink: 0 });
      for (let i = 0; i < 9; i++) { const z = -HD + 0.6 + i * ((2 * HD - 1.2) / 8); k.add(GEO.ball, ['#7fe0d0', '#9fb4ff', '#ffcf3f'][i % 3], -HW + 0.12, WH - 0.35 - Math.sin((i / 8) * Math.PI * 2) * 0.1, z, 0.07, 0.07, 0.07, 0, 0, 0, { glow: true }); }
      out.susumu = { k: buildKid('susumu'), st: { x: R.x + B.susumu.x, y: R.y, z: R.z + B.susumu.z, yaw: -0.5, baseYaw: -0.5, talk: 0, pose: 'idle', top: 1.6, name: 'ススム' } };
      out.susumu.k.root.position.set(B.susumu.x, 0, B.susumu.z); g.add(out.susumu.k.root);
    }
    out.baked = bakeInto(g, k);
    const glowMat = c => new THREE.SpriteMaterial({ map: TK.glowTex, color: c, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending });
    out.sprites = glows.map(q => { const s = new THREE.Sprite(glowMat(q.c)); s.scale.setScalar(q.s); s.position.set(q.x, q.y, q.z); g.add(s); return s; });
    WORLD.addSolids(solids.map(s => Object.assign({}, s, { x: R.x + s.x, z: R.z + s.z, anime: true })));
    WORLD.addPlatforms([{ box: [R.x - HW, R.x + HW, R.z - HD, R.z + HD], top: R.y, anime: true }]);
    return out;
  }
  function buildRooms() {
    if (ROOM) return ROOM;
    ROOM = { a: buildRoom(RA, 'a'), b: buildRoom(RB, 'b') };
    return ROOM;
  }
  // ============================================================ the karaoke screen (a panel: the lyrics in the mode, ruby until known, the English on EN)
  let PANEL = null, KEYH = null, RUN = null;
  function css() {
    if (document.getElementById('ak-css')) return;
    const s = document.createElement('style'); s.id = 'ak-css';
    s.textContent = `
      #ak-panel { position: fixed; inset: 0; z-index: 60; display: flex; align-items: center; justify-content: center; background: rgba(20,10,30,.45); font-family: "Segoe UI", sans-serif; }
      #ak-panel.ak-hidden { display: none; }
      #ak-panel .ak-card { width: min(940px, 95vw); max-height: 95vh; overflow: auto; background: #fff8fc; border: 4px solid ${INK}; border-radius: 22px; box-shadow: 0 10px 0 rgba(43,34,53,.25); padding: 12px 18px 10px; color: ${INK}; box-sizing: border-box; }
      #ak-panel.concert { align-items: flex-end; background: transparent; pointer-events: none; }
      #ak-panel.concert .ak-card { pointer-events: auto; background: rgba(255,248,252,.93); margin-bottom: 12px; }
      #ak-panel.concert .ak-card { width: min(780px, 94vw); padding: 8px 14px 6px; }
      #ak-panel.concert .ak-screen { min-height: 0; padding: 6px 14px 8px; margin-top: 6px; }
      #ak-panel.concert .ak-steps, #ak-panel.concert .ak-title small, #ak-panel.concert .ak-foot, #ak-panel.concert .ak-row.dim, #ak-panel.concert .ak-mic { display: none; }
      #ak-panel.concert .ak-title { font-size: 17px; }
      #ak-panel.concert .ak-row.cur .ak-l { font-size: 27px; }
      #ak-panel.concert .ak-say { margin: 4px 2px 0; font-size: 15px; min-height: 22px; }
      #ak-panel.concert .ak-body { min-height: 0; gap: 5px; padding: 0 0 2px; }
      #ak-panel.concert .ak-in { font-size: 20px; padding: 4px 10px; }
      #ak-panel.concert .ak-q { font-size: 14px; }
      #ak-panel .ak-head { display: flex; align-items: center; gap: 12px; }
      #ak-panel .ak-mic { width: 40px; height: 40px; flex: 0 0 auto; }
      #ak-panel .ak-title { flex: 1; font: 800 21px "Segoe UI", sans-serif; line-height: 1.25; }
      #ak-panel .ak-title small { display: block; font-weight: 600; font-size: 13px; opacity: .72; }
      #ak-panel .ak-title ruby rt { font-size: .5em; color: ${PINK}; }
      #ak-panel .ak-steps { display: flex; gap: 6px; }
      #ak-panel .ak-steps i { padding: 3px 10px; border-radius: 10px; border: 2px solid ${INK}; font: normal 800 13px "Segoe UI", sans-serif; opacity: .4; }
      #ak-panel .ak-steps i.on { opacity: 1; background: ${PINK}; color: #fff; border-color: ${PINK}; }
      #ak-panel .ak-steps i.done { opacity: .85; background: #d8f3dc; }
      #ak-panel .ak-x { width: 34px; height: 34px; border-radius: 50%; border: 3px solid ${INK}; background: #fff; font: 800 15px "Segoe UI"; cursor: pointer; }
      #ak-panel .ak-enb { height: 34px; padding: 0 10px; border-radius: 12px; border: 3px solid ${INK}; background: #fff; font: 800 13px "Segoe UI"; cursor: pointer; }
      #ak-panel.en-on .ak-enb { background: ${GOLD}; }
      #ak-panel:not(.en-on) .ak-tr, #ak-panel:not(.en-on) .ak-say .en { display: none; }
      #ak-panel .ak-screen { margin-top: 10px; border-radius: 16px; background: linear-gradient(160deg, #2a0f4a, #6a2468 60%, #b82c6a); color: #fff; padding: 12px 18px 12px; min-height: 196px; position: relative; overflow: hidden; }
      #ak-panel .ak-screen:before { content: ''; position: absolute; inset: 0; background-image: radial-gradient(circle at 12% 20%, rgba(255,255,255,.5) 0 1.5px, transparent 2px), radial-gradient(circle at 78% 30%, rgba(255,255,255,.45) 0 1.5px, transparent 2px), radial-gradient(circle at 45% 80%, rgba(255,255,255,.35) 0 1.5px, transparent 2px); pointer-events: none; }
      #ak-panel .ak-stage { font: 800 12px "Segoe UI", sans-serif; letter-spacing: .12em; text-transform: uppercase; opacity: .75; display: flex; justify-content: space-between; }
      #ak-panel .ak-row { margin: 4px 0; transition: opacity .2s; position: relative; }
      #ak-panel .ak-row.dim { opacity: .42; }
      #ak-panel .ak-row .ak-l { font: 700 21px ${FONT}; line-height: 2.0; }
      #ak-panel .ak-row.cur .ak-l { font-size: 33px; }
      #ak-panel .ak-row .ak-en { font: italic 600 14px "Segoe UI", sans-serif; opacity: .78; margin-top: -4px; }
      #ak-panel .ak-row .who { position: absolute; left: -14px; top: 12px; width: 8px; height: 8px; border-radius: 50%; }
      #ak-panel .ak-row .who.o { background: #ffb3d9; } #ak-panel .ak-row .who.y { background: #9ff5e6; } #ak-panel .ak-row .who.all { background: #ffe15a; }
      #ak-panel .ak-t { color: #fff; transition: color .12s, text-shadow .12s; }
      #ak-panel .ak-t.lit { color: #ffe15a; text-shadow: 0 0 10px rgba(255,225,90,.55); }
      #ak-panel .ak-row.gray .ak-t { color: #8f879a; text-shadow: none; }
      #ak-panel .ak-row.gray .ak-l { filter: saturate(0); }
      #ak-panel .ak-row.mine .ak-t.lit, #ak-panel .ak-row.sung .ak-t { color: #9ff5e6; text-shadow: 0 0 10px rgba(159,245,230,.55); }
      #ak-panel .ak-gap { display: inline-block; min-width: 2.4em; border-bottom: 3px solid #ffe15a; color: transparent; margin: 0 2px; }
      #ak-panel .ak-gap.filled { color: #9ff5e6; border-color: #9ff5e6; }
      #ak-panel ruby rt { font: 600 .42em/1.1 "Segoe UI", sans-serif; color: #ffd1e8; }
      #ak-panel .ak-bar { height: 6px; border-radius: 4px; background: rgba(255,255,255,.18); margin-top: 6px; }
      #ak-panel .ak-bar i { display: block; height: 100%; width: 0; background: #ffe15a; border-radius: 4px; }
      #ak-panel .ak-say { margin: 9px 2px 4px; font: 700 17px ${FONT}; min-height: 28px; line-height: 1.9; }
      #ak-panel .ak-say .who { display: inline-block; padding: 1px 10px; border-radius: 10px; background: ${PINK}; color: #fff; font: 800 13px "Segoe UI", sans-serif; margin-right: 8px; vertical-align: middle; }
      #ak-panel .ak-say .en { font: italic 600 14px "Segoe UI", sans-serif; opacity: .7; margin-left: 10px; }
      #ak-panel .ak-say ruby rt { font: 600 .45em/1.1 "Segoe UI", sans-serif; color: ${PINK}; }
      #ak-panel .ak-body { display: flex; flex-direction: column; align-items: center; gap: 8px; min-height: 58px; padding: 2px 0 4px; }
      #ak-panel .ak-q { font: 700 16px "Segoe UI", sans-serif; text-align: center; }
      #ak-panel .ak-q small { display: block; font-weight: 600; opacity: .65; font-size: 13px; }
      #ak-panel .ak-in { font: 700 24px ${FONT}; padding: 6px 12px; border: 3px solid ${INK}; border-radius: 12px; width: min(440px, 82%); text-align: center; background: #fff; color: ${INK}; }
      #ak-panel .ak-in.wrong { border-color: #d8443a; animation: akshake .35s; }
      #ak-panel .ak-row2 { display: flex; gap: 10px; align-items: center; justify-content: center; flex-wrap: wrap; }
      #ak-panel .ak-btn { padding: 7px 16px; border: 3px solid ${INK}; border-radius: 12px; background: ${INK}; color: ${PAPER}; font: 800 15px "Segoe UI", sans-serif; cursor: pointer; }
      #ak-panel .ak-btn.light { background: #fff; color: ${INK}; }
      #ak-panel .ak-note { font: 700 15px ${FONT}; color: #2f6f4a; min-height: 20px; text-align: center; }
      #ak-panel .ak-note.bad { color: #b8433a; }
      #ak-panel .ak-note ruby rt { font: 600 .45em/1.1 "Segoe UI"; color: ${PINK}; }
      #ak-panel .ak-chips { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; }
      #ak-panel .ak-chip { display: inline-flex; gap: 6px; align-items: baseline; padding: 2px 10px; border-radius: 12px; background: #f6e8f0; font-size: 13px; }
      #ak-panel .ak-chip b { font: 700 18px ${FONT}; } #ak-panel .ak-chip ruby rt { font-size: .45em; color: ${PINK}; }
      #ak-panel .ak-grade { font: 900 64px Bahnschrift, "Segoe UI", sans-serif; color: ${PINK}; line-height: 1; text-shadow: 3px 3px 0 ${INK}; }
      #ak-panel .ak-foot { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; opacity: .7; padding-top: 2px; }
      #ak-panel .ak-big { font: 800 30px ${FONT}; line-height: 2; } #ak-panel .ak-big ruby rt { font: 600 .42em/1.1 "Segoe UI"; color: ${PINK}; }
      @keyframes akshake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
      body.in-battle #ak-panel { display: none !important; }`;
    document.head.appendChild(s);
  }
  const micSVG = `<svg class="ak-mic" viewBox="0 0 40 40"><rect x="17" y="18" width="6" height="18" rx="3" fill="#4a4256" stroke="${INK}" stroke-width="2"/><circle cx="20" cy="13" r="10" fill="#ff7fb6" stroke="${INK}" stroke-width="2.4"/><path d="M20 7.5 l1.7 3.5 3.8 .5 -2.8 2.6 .7 3.8 -3.4-1.9 -3.4 1.9 .7-3.8 -2.8-2.6 3.8-.5z" fill="#ffe15a"/></svg>`;
  function panelEl() {
    if (PANEL) return PANEL;
    css();
    const el = document.createElement('div'); el.id = 'ak-panel'; el.className = 'ak-hidden';
    el.innerHTML = `<div class="ak-card"><div class="ak-head">${micSVG}<div class="ak-title"></div><div class="ak-steps"></div><button class="ak-enb" title="The English of every line">EN</button><button class="ak-x" title="Stop (Esc)">✕</button></div>`
      + '<div class="ak-screen"><div class="ak-stage"><span class="st"></span><span class="sc"></span></div><div class="ak-lines"></div><div class="ak-bar"><i></i></div></div>'
      + '<div class="ak-say"></div><div class="ak-body"></div><div class="ak-foot"><span class="l"></span><span class="r"></span></div></div>';
    document.body.appendChild(el);
    const q = s => el.querySelector(s);
    PANEL = { el, title: q('.ak-title'), steps: q('.ak-steps'), x: q('.ak-x'), stage: q('.ak-stage .st'), score: q('.ak-stage .sc'), lines: q('.ak-lines'), bar: q('.ak-bar i'), say: q('.ak-say'), body: q('.ak-body'), footL: q('.ak-foot .l'), footR: q('.ak-foot .r') };
    PANEL.x.onclick = () => quit();
    // EN: the English of the lyrics and of Otoha's lines, on request (DESIGN.md 17.3: never under them by default)
    el.querySelector('.ak-enb').onclick = () => { el.classList.toggle('en-on'); const inp = PANEL.body.querySelector('input'); if (inp) inp.focus(); };
    addEventListener('keydown', e => {
      if (!PANEL || PANEL.el.classList.contains('ak-hidden')) return;
      const inInput = e.target && e.target.tagName === 'INPUT';
      if (e.code === 'Escape' && !inInput) { e.preventDefault(); e.stopPropagation(); quit(); return; }
      if (KEYH && KEYH(e, inInput)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    return PANEL;
  }
  function openPanel(sg, o = {}) {
    const P = panelEl();
    P.el.classList.toggle('concert', !!o.concert); P.el.classList.remove('en-on');
    P.title.innerHTML = sg ? `${J(sg.title, { cls: 'ak-tt' })}<small><span class="ak-tr">${esc(sg.titleEn)} · </span>from «${esc(sg.showEn)}», ${esc(sg.kind)}</small>` : esc(o.title || '');
    P.steps.innerHTML = ''; P.stage.textContent = ''; P.score.textContent = ''; P.lines.innerHTML = ''; P.say.innerHTML = ''; P.body.innerHTML = ''; P.bar.style.width = '0';
    P.footL.textContent = o.foot || 'Esc: stop'; P.footR.textContent = '';
    P.el.classList.remove('ak-hidden');
    Input.typing = true; if (G) G.sim.lock = 1;
    return P;
  }
  function closePanel() {
    if (!PANEL) return;
    PANEL.el.classList.add('ak-hidden'); PANEL.body.innerHTML = ''; KEYH = null;
    if (typeof CJK !== 'undefined' && CJK.ime && CJK.ime.box) CJK.ime.box.style.display = 'none';
    Input.typing = false; if (G) G.sim.lock = 0;
  }
  const panelOpen = () => !!PANEL && !PANEL.el.classList.contains('ak-hidden');
  function quit() { if (RUN) { RUN.quit = true; if (RUN.wake) RUN.wake({ quit: true }); } else closePanel(); }
  function steps(at, names = ['Listen', 'Fill in', 'Sing']) { if (PANEL) PANEL.steps.innerHTML = names.map((n, i) => `<i class="${i < at ? 'done' : i === at ? 'on' : ''}">${esc(n)}</i>`).join(''); }
  // what Otoha says in the panel, by the weave like every line (DESIGN.md 17.3): mixed (the English with the words you know in
  // Japanese), whole in Japanese as the weave rises; its English only with EN
  const mixJ = (src, en) => { try { if (typeof STORY !== 'undefined' && STORY.mixHTML && src && en) return STORY.mixHTML(src, en, { key: 'anime:' + en }).html; } catch (e) { /* (the line as written) */ } return J(src); };
  function panelSay(src, en, who = 'オトハ') {
    if (!PANEL) return;
    PANEL.say.innerHTML = `<span class="who">${esc(JP(who))}</span>` + (src ? mixJ(src, en) : '') + (en ? `<span class="en">${esc(en)}</span>` : '');
    if (src && cmode() === 'chars') try { CJK.seen(src, { lang: 'ja' }); } catch (e) { /* (fine) */ }
  }
  const sayPair = (k, who) => { const [src, en] = Array.isArray(PANEL_SAY[k][0]) ? pickOf(PANEL_SAY[k]) : PANEL_SAY[k]; panelSay(src, en, who); };
  const waitAnswer = () => new Promise(r => { RUN.wake = v => { RUN.wake = null; r(v); }; });
  const sleep = ms => (typeof STORY !== 'undefined' && STORY.wait ? STORY.wait(ms / 1000) : new Promise(r => setTimeout(r, ms)));     // (game time: test pages step it)
  // a lyric line as HTML: one span per word (lit as it's sung), a gap where you fill a word in
  function lineHTML(ln, o = {}) {
    const chars = cmode() === 'chars';
    let html = '', mi = 0;
    ln.toks.forEach((tk, i) => {
      const punct = !ln.tokMor[i], sp = !chars && i > 0 && !punct ? ' ' : '';
      let inner;
      if (o.gap === i) inner = `<span class="ak-gap${o.filled ? ' filled' : ''}">${o.filled ? J(tk, { cap: false }) : '＿'.repeat(Math.max(2, ln.tokMor[i]))}</span>`;
      else inner = J(tk, i === 0 ? {} : { cap: false });
      const lit = o.lit !== undefined && ln.tokMor[i] && mi < o.lit;
      html += sp + `<span class="ak-t${lit ? ' lit' : ''}">${inner}</span>`;
      mi += ln.tokMor[i];
    });
    return html;
  }
  function rowHTML(ln, cls, o = {}) {
    // (the lyric in Japanese; its English only with EN, the "your line" note always)
    return `<div class="ak-row ${cls}"><i class="who ${ln.who}"></i><div class="ak-l">${lineHTML(ln, o)}</div><div class="ak-en"><span class="ak-tr">${esc(ln.en)}</span>${ln.who !== 'o' ? (ln.who === 'y' ? '  · your line' : '  · everyone') : ''}</div></div>`;
  }
  // which line is sounding at position p (sixteenths), and how many of its morae have started
  function lineAt(P, p) {
    for (const ln of P.lines) if (p >= ln.at && p < ln.at + ln.len) return { ln, lit: ln.mel.filter(e => ln.at + e.at <= p).length };
    return null;
  }
  // the lyric screen at position p: the line before (dim), the one sounding (big, lit as it's sung), the next (dim)
  function renderLyrics(P, p, run, o = {}) {
    const at = lineAt(P, p), cur = at ? at.ln.i : p < P.lines[0].at ? -1 : P.lines.length, lit = at ? at.lit : 0;
    PANEL.bar.style.width = `${clamp(p / P.len, 0, 1) * 100}%`;
    const key = cur + ':' + lit + ':' + (o.key || '');
    if (run.key === key) return; run.key = key;
    const L = i => P.lines[i], cls = ln => (o.cls ? ' ' + o.cls(ln) : ''), rows = [];
    if (cur < 0) { rows.push('<div class="ak-row dim"><div class="ak-l">♪ ・ ・ ・ ♪</div></div>'); rows.push(rowHTML(L(0), 'dim' + cls(L(0)))); }
    else if (cur >= P.lines.length) rows.push(rowHTML(L(P.lines.length - 1), 'dim' + cls(L(P.lines.length - 1))), '<div class="ak-row"><div class="ak-l">♪ ♪ ♪</div></div>');
    else { if (L(cur - 1)) rows.push(rowHTML(L(cur - 1), 'dim' + cls(L(cur - 1)))); rows.push(rowHTML(L(cur), 'cur' + cls(L(cur)), { lit })); if (L(cur + 1)) rows.push(rowHTML(L(cur + 1), 'dim' + cls(L(cur + 1)))); }
    PANEL.lines.innerHTML = rows.join('');
    if (at && run.seenLine !== cur && cmode() === 'chars') { run.seenLine = cur; try { CJK.seen(at.ln.src, { lang: 'ja' }); } catch (e) { /* (fine) */ } }
  }
  function noteFor(sg, tok) { const k = kanaOf(tok); const n = sg.notes.find(([w]) => { const kw = kanaOf(w).replace(/\s/g, ''); return kw === k || k.startsWith(kw) || kw.startsWith(k); }); return n ? n[1] : ''; }
  // type an answer in the panel: { ok, stars (2 first time, 1 after a miss or a hint, 0 once shown), text } or { quit }
  function askType(o) {
    return new Promise(resolve => {
      const run = RUN; let tries = 0, hints = 0, shown = false;
      PANEL.body.innerHTML = `<div class="ak-q">${o.q}</div><input class="ak-in" autocomplete="off" spellcheck="false" placeholder="${esc(cmode() === 'chars' ? 'type in rōmaji (Space for kanji), then Enter' : 'type it in rōmaji, then Enter')}">`
        + `<div class="ak-row2"><button class="ak-btn light" data-a="hint">? Hint</button><button class="ak-btn" data-a="ok">${esc(o.ok || 'Enter ▸')}</button></div><div class="ak-note"></div>`;
      const inp = PANEL.body.querySelector('.ak-in'), note = PANEL.body.querySelector('.ak-note');
      try { if (typeof CJK !== 'undefined' && CJK.attachIME) CJK.attachIME(inp); } catch (e) { /* (a plain box still works) */ }
      setTimeout(() => { try { inp.focus(); } catch (e) { /* (hidden) */ } }, 30);
      const prevWake = run.wake;           // (a round's own wake, e.g. the sing round's quit: put back when this question's done)
      const done = v => { run.answer = null; run.hint = null; run.wake = prevWake; resolve(v); };
      const want = o.want;
      const check = text => {
        const t = String(text == null ? '' : text).trim(); if (!t) return;
        let ok = want.some(w => same(t, w)), slip = false;
        if (!ok && o.loose) { const s = Math.max(...want.map(w => near(t, w))); if (s >= o.loose) { ok = true; slip = true; } }
        if (ok) {
          try { CJK.used(t, want[0], { lang: 'ja' }); } catch (e) { /* (fine) */ }
          Sound.play(slip ? 'pip' : 'review');
          note.className = 'ak-note'; note.innerHTML = slip ? `Close enough! It’s ${J(want[0], { ruby: 'always' })}` : '';
          done({ ok: true, slip, stars: shown ? 0 : tries || hints ? 1 : 2, text: t, tries, hints });
          return;
        }
        tries++; run.misses = (run.misses || 0) + 1;
        inp.classList.remove('wrong'); void inp.offsetWidth; inp.classList.add('wrong'); Sound.play('wrong');
        const close = want.some(w => near(t, w) >= 0.6);
        if (tries >= 2 && !shown) shown = true;
        note.className = 'ak-note bad';
        note.innerHTML = (close ? 'So close!' : 'Not quite.') + (shown ? ` It’s ${J(want[0], { ruby: 'always' })}${cmode() === 'chars' ? '' : ''}: type it.` : ' (? gives a hint)');
        sayPair('oops');
      };
      const hint = () => {
        hints++; run.hints = (run.hints || 0) + 1; Sound.play('pip');
        const w = want[0], m = moraeOf(w);
        if (hints === 1 && m.length > 1) note.innerHTML = `It starts with «${esc(cmode() === 'chars' ? m[0] : CJK.romaji(m[0]))}» · ${m.length} beats`;
        else { shown = true; note.innerHTML = `It’s ${J(w, { ruby: 'always' })} <small>(${esc(JR(w))})</small>`; }
        note.className = 'ak-note';
      };
      run.answer = check; run.hint = hint;
      run.wake = v => { if (v && v.quit) done({ quit: true }); };      // (the caller passes the quit on to its round)
      inp.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.isComposing) { e.preventDefault(); e.stopPropagation(); check(inp.value); } });
      PANEL.body.querySelector('[data-a=ok]').onclick = () => check(inp.value);
      PANEL.body.querySelector('[data-a=hint]').onclick = hint;
    });
  }
  // ------------------------------------------------------------ round 1: listen (the song once through, Otoha singing every line)
  async function roundListen(sg) {
    const P = vocalMap(sg);
    steps(0); PANEL.stage.textContent = 'Listen'; sayPair('listen');
    PANEL.body.innerHTML = `<div class="ak-chips">${sg.notes.map(([w, en]) => `<span class="ak-chip"><b>${J(w)}</b>${esc(en)}</span>`).join('')}</div>`
      + `<div class="ak-row2"><button class="ak-btn light" data-a="skip">Skip ▸ (Enter)</button></div>`;
    PANEL.footR.textContent = sg.style;
    const run = RUN = { kind: 'listen', sg, quit: false, maxP: -1, key: '' };
    const end = () => { if (run.wake) run.wake({}); };
    PANEL.body.querySelector('[data-a=skip]').onclick = () => { run.skip = true; end(); };
    KEYH = (e, inInput) => { if (!inInput && (e.code === 'Enter' || e.code === 'Space')) { run.skip = true; end(); return true; } return false; };
    startTrack(sg.sound, { mode: 'demo', level: 0.34 });
    run.tick = () => {
      const p = trackNow(); if (p < 0) return;
      if (p < run.maxP - 8 && run.maxP > P.len - 24) { run.over = true; end(); return; }      // (it looped: the song's over)
      run.maxP = Math.max(run.maxP, p);
      renderLyrics(P, p, run);
      if (p >= P.len - 0.5) { run.over = true; end(); }
    };
    const r = await waitAnswer();
    run.tick = null; KEYH = null;
    return r && r.quit ? { quit: true } : { done: true, skipped: !!run.skip };
  }
  // ------------------------------------------------------------ round 2: fill in the missing words (the band plays on softly, no voice)
  async function roundFill(sg) {
    const P = vocalMap(sg);
    steps(1); PANEL.stage.textContent = 'Fill in'; sayPair('fill');
    startTrack(sg.sound, { mode: 'demo', level: 0.16 }); if (PL.tr) PL.tr.voice = 0;
    const run = RUN = { kind: 'fill', sg, quit: false };
    let stars = 0, n = 0;
    for (const f of sg.fill) {
      const ln = P.lines[f.line], tok = ln.toks[f.tok], note = noteFor(sg, tok);
      PANEL.score.textContent = `${n + 1} / ${sg.fill.length}`;
      PANEL.lines.innerHTML = rowHTML(ln, 'cur', { gap: f.tok });
      run.want = tok;
      const r = await askType({ q: `Which word goes in the gap?${note ? `<small>a hint: ${esc(note)}</small>` : ''}`, want: [tok], ok: 'Fill it ▸' });
      if (!r || r.quit) return { quit: true };
      PANEL.lines.innerHTML = rowHTML(ln, 'cur sung', { gap: f.tok, filled: true });
      stars += r.stars; n++;
      if (r.stars === 2) sayPair('praise');
      await sleep(650);
    }
    return { stars, max: sg.fill.length * 2 };
  }
  // ------------------------------------------------------------ round 3: sing it together (call and response)
  // Otoha sings her lines; at yours (gray) the band vamps on the line's bars until you type it, then you sing it (your
  // voice: the bright one), and the song goes on. o.hushed: her lines the Hush has taken (they're yours too); o.concert.
  async function roundSing(sg, o = {}) {
    const P = vocalMap(sg);
    steps(2); PANEL.stage.textContent = o.concert ? 'Live!' : 'Sing'; PANEL.score.textContent = ''; sayPair(o.concert ? 'go' : 'sing');
    const hushed = new Set(o.hushed || []);
    const mine = new Set(P.lines.filter(ln => ln.who !== 'o' || hushed.has(ln.i)).map(ln => ln.i));
    startTrack(sg.sound, { mode: 'duet', level: 0.36 });
    const tr = PL.tr; if (!tr) return { quit: true };
    for (const i of hushed) tr.mute[i] = true;
    const run = RUN = { kind: 'sing', sg, quit: false, mine, answered: {}, waiting: null, misses: 0, hints: 0, slips: 0, maxP: -1, key: '', inputFor: null };
    PANEL.body.innerHTML = '<div class="ak-q">Otoha sings first…</div>';
    PANEL.footR.textContent = 'Pink: Otoha · Teal: you · Gold: everyone';
    const clsOf = ln => (mine.has(ln.i) ? (run.answered[ln.i] ? 'mine' : 'gray') : '');
    const ask = async ln => {
      run.inputFor = ln.i;
      PANEL.score.textContent = `${Object.keys(run.answered).length + 1} / ${mine.size}`;
      const r = await askType({ q: `${hushed.has(ln.i) ? 'The Hush took her voice! Sing her line:' : ln.who === 'all' ? 'Everyone sings:' : 'Your line!'} <small class="ak-tr">${esc(ln.en)}</small>`,
        want: [ln.src], loose: moraeOf(ln.src).length > 6 ? 0.8 : 0, ok: 'Sing ▸' });
      if (!r || r.quit) { run.finish({ quit: true }); return; }
      run.answered[ln.i] = true; if (r.slip) run.slips++;
      if (tr.hold && tr.hold.line === ln.i) tr.hold.release = 1; else tr.you[ln.i] = true;
      run.key = ''; sayPair('praise');
      PANEL.body.innerHTML = `<div class="ak-q">${mine.size - Object.keys(run.answered).length ? '♪ …' : '♪ ♪ ♪'}</div>`;
      run.inputFor = null;
      if (o.onLine) try { o.onLine(ln, run); } catch (e) { console.error('[anime]', e); }
    };
    run.tick = () => {
      const t2 = PL.tr; if (!t2) return;
      const next = P.lines.find(ln => mine.has(ln.i) && !run.answered[ln.i]);
      if (next && !t2.hold && t2.pos >= next.at - 6) {
        if (t2.pos >= next.at + next.len) t2.pos = next.at;          // (a stall carried the band past it: back to its top)
        t2.hold = { start: next.at, end: next.at + next.len, line: next.i, release: 0 };
      }
      const p = trackNow(); if (p < 0) return;
      const doneAll = !next;
      if (doneAll && ((p < run.maxP - 8 && run.maxP > P.len - 24) || p >= P.len - 0.5)) { run.over = true; run.finish({}); return; }
      run.maxP = Math.max(run.maxP, p);
      renderLyrics(P, p, run, { cls: clsOf, key: Object.keys(run.answered).length });
      const at = lineAt(P, p);
      if (at && mine.has(at.ln.i) && !run.answered[at.ln.i] && run.inputFor === null) { run.waiting = at.ln.i; ask(at.ln); }
      if (o.tick) o.tick(p, run);
    };
    const fin = new Promise(res => { run.finish = v => { if (run.fin) return; run.fin = true; res(v); }; });
    run.wake = v => { if (v && v.quit) run.finish({ quit: true }); };
    const r = await fin;
    run.tick = null;
    if (r && r.quit) return { quit: true };
    return { misses: run.misses, hints: run.hints, slips: run.slips, lines: mine.size };
  }
  function gradeOf(fill, sing) {
    const f = fill && fill.max ? fill.stars / fill.max : 1;
    const s = sing ? clamp(1 - (sing.misses * 0.12 + sing.hints * 0.08 + sing.slips * 0.04) / Math.max(1, sing.lines / 3), 0, 1) : 1;
    const k = f * 0.5 + s * 0.5;
    return k >= 0.95 ? 'S' : k >= 0.85 ? 'A' : k >= 0.7 ? 'B' : k >= 0.5 ? 'C' : 'D';
  }
  async function showResult(sg, grade) {
    const run = RUN = { kind: 'result', sg, quit: false };
    sayPair('done'); PANEL.stage.textContent = 'Done!'; PANEL.score.textContent = '';
    PANEL.lines.innerHTML = `<div class="ak-row cur"><div class="ak-l">${J(sg.title)}</div><div class="ak-en"><span class="ak-tr">${esc(sg.titleEn)} · </span>${esc(sg.grammar)}</div></div>`;
    PANEL.body.innerHTML = `<div class="ak-grade">${grade}</div><div class="ak-row2"><button class="ak-btn" data-a="ok">Yay! ▸ (Enter)</button></div>`;
    const go = () => { if (run.wake) run.wake({}); };
    PANEL.body.querySelector('[data-a=ok]').onclick = go;
    KEYH = (e, inInput) => { if (!inInput && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyE')) { go(); return true; } return false; };
    Sound.play(grade === 'S' || grade === 'A' ? 'fanfare' : 'chest');
    const r = await waitAnswer(); KEYH = null;
    return r;
  }
  // a phrase for the Phrasebook: shown, explained, typed once (LEX: an echo, so it's in the journal)
  async function echoPhrase(id) {
    const p = PHRASES.find(q => q.id === id); if (!p || !panelOpen()) return null;
    RUN = { kind: 'echo', id, quit: false };
    PANEL.stage.textContent = 'A phrase for your Phrasebook'; PANEL.score.textContent = '';
    sayPair('phrase');
    PANEL.lines.innerHTML = `<div class="ak-row cur"><div class="ak-l">${J(p.ja, { ruby: 'always' })}</div><div class="ak-en">${esc(p.en)}</div></div>`;
    try { CJK.say(p.ja, 'ja'); } catch (e) { /* (no voice) */ }
    const r = await askType({ q: `Say it: type it once <small>${esc(p.note)}</small>`, want: [p.ja].concat(p.alt || []), ok: 'Say it ▸' });
    if (!r || r.quit) return null;
    if (typeof LEX !== 'undefined') LEX.attempt(id, { ok: true, hints: r.hints ? 1 : 0, ms: 5000, mode: 'echo' });
    UI.toast(`New phrase: «${JP(p.ja)}» · it’s in your Phrasebook (journal)`);
    await sleep(500);
    return true;
  }
  // a whole song lesson in the panel: listen, fill in, sing; o.skipListen, o.only ('sing'), o.hushed, o.concert, o.phrase
  async function karaoke(sg, o = {}) {
    openPanel(sg, o);
    try {
      let fill = null, sing = null, r;
      if (o.only !== 'sing') {
        if (!o.skipListen) { r = await roundListen(sg); if (r.quit) return { quit: true }; }
        fill = await roundFill(sg); if (fill.quit) return { quit: true };
      }
      sing = await roundSing(sg, o); if (sing.quit) return { quit: true };
      stopTrack();
      const grade = gradeOf(fill, sing);
      r = await showResult(sg, grade); if (r && r.quit) return { quit: true, grade };
      if (o.phrase && !(typeof LEX !== 'undefined' && LEX.taught(o.phrase))) await echoPhrase(o.phrase);
      return { grade, fill, sing };
    } catch (e) { console.error('[anime] karaoke', e); return { quit: true }; }
    finally { stopTrack(); RUN = null; closePanel(); }
  }
  // ============================================================ scenes
  const NAME = { otoha: 'オトハ', susumu: 'ススム' };
  const kidSt = who => (ROOM ? (who === 'susumu' ? ROOM.b.susumu.st : ROOM.a.otoha.st) : null);
  // a sibling says a lines.js line over their head, through the weave (STORY.sayInline mixes every line: DESIGN.md 17.3, the
  // English on request)
  async function ssay(who, key, o = {}) {
    const p = o.at || kidSt(who); if (!p) return;
    const Lr = UI.lineFor(key, LEX.tier()), short = Lr.text && JP(Lr.text).length <= 16;
    const full = o.full !== undefined ? o.full : short;
    p.name = JP(NAME[who] || who); p.id = 'anime:' + key;
    p.lines = { en: full ? (Lr.en || Lr.weave) : Lr.weave, ja: Lr.text };
    await STORY.sayInline(p, full);
  }
  const mimoSparkle = n => { const M = G.sim.mimo; M.happy = 1.5; M.glow = 1; G.w3d.fx.sparkle(M.x, M.ry + 0.8, M.z, n || 16); };
  // the chapters: what unlocks each (the story's progress), and the song
  const GATES = [s => !!(s.flags.rosa || s.flags.guide), s => !!s.flags.boss, s => (s.flags.bells || 0) >= 1, s => (s.flags.bells || 0) >= 2, s => (s.flags.bells || 0) >= 3];
  const GATE_TEXT = ['after Rosa’s welcome', 'after the big Hushling on the hill', 'after the first bell rings', 'after the second bell', 'after the third bell'];
  const chUnlocked = n => !!G && n >= 1 && n <= 5 && GATES[n - 1](G.state) && S().ch >= n - 1;
  const chNext = () => { const n = S().ch + 1; return n <= 5 ? n : null; };
  // ------------------------------------------------------------ in and out (a room: main.js ROOMS)
  let inside = null, busy = false;
  function teleport(x, z, yaw, mimoSide = 1) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; Y.vx = Y.vz = Y.vy = 0; Y.onGround = true;
    M.x = x + Math.cos(yaw) * 0.95 * mimoSide; M.z = z - Math.sin(yaw) * 0.95 * mimoSide; M.station = null; M.look = null; M.hop = null; M.wander = null;
    [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3);
    G.sim.snap();
  }
  function outsideSpot() {
    const h = house(); if (!h) return { x: -9.0, z: -177.9, yaw: -HALF };
    const p = h.world(h.dlx, h.front + 1.4); return { x: p.x, z: p.z, yaw: h.yaw };
  }
  function showRoom(which) {
    for (const k of ['a', 'b']) ROOM[k].g.visible = k === which;
    inside = which;
    G.w3d.setInterior({ fog: which === 'a' ? '#3a2430' : '#1d1830', near: 24, far: 64 });
  }
  async function enter() {
    if (!G || inside || busy || !isOn()) return;
    busy = true;
    try {
      buildRooms();
      Sound.play('wood');
      await UI.fade(1, 380);
      showRoom('a');
      const sp = SPOT.a.spawn; teleport(RA.x + sp.x, RA.z + sp.z, Math.PI); G.cam.snap(Math.PI, 0.55, 10.5);
      await UI.fade(0, 380);
    } catch (e) { console.error('[anime] enter', e); }
    busy = false;
    const st = S();
    if (!st.visited) { st.visited = true; UI.chapter('Otoha & Susumu', 'Alba · the pink house'); }
    if (G.save) G.save();
    if (!st.met) { await STORY.wait(0.4); await meet(); }
    else { await ssay('otoha', 'an.back', { full: true }); }
  }
  async function leave() {
    if (!G || !inside || busy) return;
    busy = true;
    try {
      Sound.play('wood');
      await UI.fade(1, 380);
      for (const k of ['a', 'b']) ROOM[k].g.visible = false;
      inside = null; G.w3d.setInterior(null);
      const o = outsideSpot(); [o.x, o.z] = WORLD.pushOut(o.x, o.z, 0.45); teleport(o.x, o.z, o.yaw); G.cam.snap(o.yaw + Math.PI - 0.9, 0.34, 8.5);
      await UI.fade(0, 380);
    } catch (e) { console.error('[anime] leave', e); }
    busy = false;
    if (G.save) G.save();
  }
  async function toRoom(which) {
    if (busy || !inside || inside === which) return;
    busy = true;
    try {
      Sound.play('wood'); await UI.fade(1, 300);
      showRoom(which);
      if (which === 'b') { const sp = SPOT.b.spawn; teleport(RB.x + sp.x, RB.z + sp.z, HALF, -1); G.cam.snap(Math.PI - 0.35, 0.5, 9.5); }
      else { const sp = SPOT.a.fromB; teleport(RA.x + sp.x, RA.z + sp.z, -HALF, -1); G.cam.snap(Math.PI + 0.3, 0.55, 10); }
      await UI.fade(0, 300);
    } catch (e) { console.error('[anime] room', e); }
    busy = false;
    if (which === 'b' && typeof DANCE !== 'undefined' && DANCE.arrive) { try { await DANCE.arrive(); } catch (e) { console.error('[anime] dance', e); } }
  }
  // (the walls are thin: keep you and Mimo in the room)
  function keepIn() {
    const R = inside === 'b' ? RB : RA, M = G.sim.mimo, Y = G.sim.you, lim = (v, c, h) => Math.max(c - h, Math.min(c + h, v));
    if (!M.hidden && (Math.abs(M.x - R.x) > R.hw - 0.3 || Math.abs(M.z - R.z) > R.hd - 0.3 || M.y < R.y - 1)) { M.hop = null; M.wander = null; M.x = lim(M.x, R.x, R.hw - 0.7); M.z = lim(M.z, R.z, R.hd - 0.7); M.y = M.ry = R.y; }
    if (M.wander && (Math.abs(M.wander.x - R.x) > R.hw - 0.7 || Math.abs(M.wander.z - R.z) > R.hd - 0.7)) { M.wander.x = lim(M.wander.x, R.x, R.hw - 0.8); M.wander.z = lim(M.wander.z, R.z, R.hd - 0.8); }
    if (Y.y < R.y - 2 || Math.abs(Y.x - R.x) > R.hw + 0.5 || Math.abs(Y.z - R.z) > R.hd + 0.5) { const sp = inside === 'b' ? SPOT.b.spawn : SPOT.a.spawn; teleport(R.x + sp.x, R.z + sp.z, inside === 'b' ? HALF : Math.PI); }
  }
  // the people in the room: they turn to you, talk, and do their thing (Otoha hums into her mic now and then; Susumu reads)
  function animateRoomKid(K, dt, t, idle) {
    const st = K.st, Y = G.sim.you, dx = Y.x - st.x, dz = Y.z - st.z, d = Math.hypot(dx, dz);
    st.talk = damp(st.talk || 0, st.talking ? 1 : 0, 10, dt);
    if (!st.lock) st.yaw = dampAngle(st.yaw, d < 7 ? Math.atan2(dx, dz) : st.baseYaw, 4, dt);
    if (!st.forcePose) st.pose = st.talking ? 'talk' : d > 4.2 ? idle(t) : 'idle';
    st.wave = d < 4.5 && !K.waved ? true : st.wave && (st.waveT = (st.waveT || 1.2) - dt) > 0;
    if (d < 4.5) K.waved = true; else if (d > 7) { K.waved = false; st.waveT = 1.2; }
    const R = K.k.root.parent; if (!R) return;
    animateKid(K.k, Object.assign({}, st, { x: st.x - R.position.x, y: 0, z: st.z - R.position.z }), dt, t);
  }
  function roomUpdate(dt, t) {
    if (!inside || !ROOM) return;
    keepIn();
    const A = ROOM.a.otoha, B = ROOM.b.susumu, away = S().ch5 === 'go';      // (before the concert they're both at the theater)
    A.k.root.visible = B.k.root.visible = !away;
    if (inside === 'a') animateRoomKid(A, dt, t, tt => (Math.sin(tt * 0.31) > 0.35 ? 'sing' : 'idle'));
    else { animateRoomKid(B, dt, t, tt => (Math.sin(tt * 0.27) > 0.2 ? 'read' : 'dance')); if (typeof DANCE !== 'undefined' && DANCE.update) try { DANCE.update(dt, t); } catch (e) { console.error('[anime] dance', e); DANCE.update = null; } }
    for (const k of ['a', 'b']) ROOM[k].sprites.forEach((s, i) => { s.material.opacity = 0.32 + 0.08 * Math.sin(t * 4.3 + i * 2.1); });
    if (ROOM.a.tv) ROOM.a.tv.material.color.setScalar(0.85 + 0.15 * Math.sin(t * 3));
    karaTick(dt);
    // (a scene that broke off never leaves you frozen)
    if (G.sim.lock && !STORY.busy && !panelOpen() && !busy && !(typeof DANCE !== 'undefined' && DANCE.busy)) { G.sim.lock = 0; G.cam.override = null; }
  }
  // the karaoke's per-frame work (lyrics, holds), then the transport
  function karaTick(dt) {
    if (RUN && RUN.tick) { try { RUN.tick(dt); } catch (e) { console.error('[anime] karaoke', e); RUN.tick = null; } }
    tickTrack(dt);
  }
  // ------------------------------------------------------------ the first visit: she's singing, sees you, and her voice goes
  async function meet() {
    const st = S(), A = ROOM.a.otoha.st;
    st.met = true; st.told = st.told || 'met';
    A.forcePose = true; A.pose = 'sing';
    await ssay('otoha', 'an.sing1', { full: true });
    A.pose = 'shy'; Sound.play('whimper');
    G.fx.hush = 0.5; await STORY.wait(0.5);
    await ssay('otoha', 'an.stop', { full: true });
    G.fx.hush = 0;
    // Susumu comes out of his room to see
    const su = { x: RA.x + SPOT.a.toB.x - 0.9, y: RA.y, z: RA.z + SPOT.a.toB.z, top: 1.6, name: 'ススム' };
    await ssay('susumu', 'an.su.gone', { at: su, full: true });
    A.pose = 'talk';
    await ssay('otoha', 'an.sorry');
    await ssay('otoha', 'an.name', { full: true });
    await ssay('susumu', 'an.su.name', { at: su, full: true });
    await ssay('otoha', 'an.gray');
    await ssay('otoha', 'an.dream');
    await ssay('otoha', 'an.ask');
    await STORY.you('I’d love to! Teach me a song.');
    A.pose = 'cheer'; mimoSparkle(12);
    await ssay('otoha', 'an.yay', { full: true });
    A.forcePose = false;
    if (G.save) G.save();
    if (chUnlocked(1)) await chapter(1);
  }
  // ------------------------------------------------------------ a chapter: her intro, the song lesson, what it changed, the gift
  const GIFT = { 1: ['an.c1.gift', 'kira'], 2: ['an.c2.gift', 'robo'], 3: ['an.c3.gift', 'run'], 4: ['an.c4.gift', 'cafe'] };
  const PHRASE_OF = { 1: 'ph.ot.ganbatte', 2: 'ph.ot.kakkoii', 3: 'ph.ot.daijoubu', 4: 'ph.ot.kinchou', 5: 'ph.ot.issho' };
  async function chapter(n) {
    const st = S(), sg = SONGS.find(s => s.ch === n), A = ROOM.a.otoha.st; if (!sg) return;
    if (n === 5) return chapter5();
    A.forcePose = true; A.pose = 'talk';
    await ssay('otoha', 'an.c' + n);
    if (n === 4) { A.pose = 'shy'; await ssay('otoha', 'an.c4.fear'); }
    A.forcePose = false;
    const r = await karaoke(sg, { phrase: PHRASE_OF[n] });
    if (!r || r.quit) { UI.toast('Stopped. Talk to Otoha to try the song again.'); return; }
    const rec = st.songs[sg.id] = st.songs[sg.id] || {}; rec.best = best(rec.best, r.grade); rec.done = true;
    if (st.ch < n) st.ch = n;
    A.forcePose = true; A.pose = 'cheer'; mimoSparkle(18);
    if (n === 4) A.pose = 'sing';
    await ssay('otoha', 'an.c' + n + '.end');
    A.pose = 'talk';
    const [gk, badge] = GIFT[n];
    if (!st.badges.includes(badge)) {
      await ssay('otoha', gk);
      st.badges.push(badge);
      G.state.bag = G.state.bag || {}; G.state.bag['k.anBadge'] = st.badges.length;
      Sound.play('chest');
      await UI.card(`<div class="tag">A gift from Otoha</div><canvas width="140" height="140"></canvas><div class="big">${J('[缶|かん]バッジ', { ruby: 'always' })}</div><div class="sub">A button badge from «${esc(sg.showEn)}». You have ${st.badges.length} of 4. <b>E</b></div>`, { kind: 'reveal', icon: 'anBadge' });
    }
    if (n === 1 && typeof LEX !== 'undefined' && !LEX.taught('ph.ot.sugoi')) await praisePhrase('ph.ot.sugoi', 'Tell Otoha how her singing was!');
    if (n === 4 && typeof LEX !== 'undefined' && !LEX.taught('ph.ot.kawaii')) await praisePhrase('ph.ot.kawaii', 'The café cat on the badge… say it’s cute!');
    A.forcePose = false;
    if (G.save) G.save();
  }
  const GRADES = 'SABCD';
  const best = (a, b) => (!a ? b : !b ? a : GRADES.indexOf(a) <= GRADES.indexOf(b) ? a : b);
  // a little output moment outside the karaoke: you say one of her phrases to her (it goes in the Phrasebook)
  async function praisePhrase(id, title) {
    openPanel(null, { title });
    try { await echoPhrase(id); } finally { RUN = null; closePanel(); }
    Sound.play('review'); mimoSparkle(8);
  }
  // ------------------------------------------------------------ talking to Otoha
  const plainTitle = sg => `${JP(sg.title)} (${sg.titleEn})`;
  async function talkOtoha() {
    const st = S();
    if (!st.met) return meet();
    const n = chNext(), opts = [];
    if (n && chUnlocked(n)) opts.push({ label: n === 5 ? 'Her own song (for the concert!)' : `A new song (${n} of 5)`, sub: n === 5 ? 'Otoha wrote one herself' : `From «${SONGS[n - 1].showEn}»`, value: 'ch' });
    else if (n && st.ch5 !== 'go') opts.push({ label: 'What’s the next song?', sub: `She’s still practicing it: ${GATE_TEXT[n - 1]}`, value: 'locked' });
    if (Object.keys(st.songs).length) opts.push({ label: 'Sing a song again', sub: 'Any song you’ve learned, just the singing or the whole lesson', value: 'list' });
    if (st.band) opts.push({ label: st.bandOn ? `${G.state.mimoName}’s headband: take it off` : `${G.state.mimoName}’s headband: put it on`, value: 'band' });
    opts.push({ label: 'Chat', value: 'chat' });
    G.sim.lock = 1; const pick = await UI.choose('Otoha', opts); G.sim.lock = 0;
    if (pick === 'ch') return chapter(n);
    if (pick === 'locked') return ssay('otoha', 'an.locked');
    if (pick === 'list') return songList();
    if (pick === 'band') { st.bandOn = !st.bandOn; Sound.play('pip'); if (G.save) G.save(); return; }
    if (pick === 'chat') return ssay('otoha', st.ch >= 5 ? pickOf(['an.done', 'an.chat1', 'an.chat2', 'an.chat3', 'an.chat4']) : pickOf(['an.chat1', 'an.chat2', 'an.chat3', 'an.chat4']));
  }
  // the karaoke list (the TV): every song you've learned; just the singing, or the whole lesson again
  async function songList() {
    const st = S(), have = SONGS.filter(sg => st.songs[sg.id]);
    if (!have.length) { STORY.think('The karaoke list is empty. Otoha will teach you the songs first!', 4); return; }
    G.sim.lock = 1;
    const id = await UI.choose('Karaoke: which song?', have.map(sg => ({ label: plainTitle(sg), sub: `«${sg.showEn}» · best ${st.songs[sg.id].best || '–'}`, value: sg.id })));
    const how = id ? await UI.choose('How?', [{ label: 'Just sing it', sub: 'Otoha sings, you answer', value: 'sing' }, { label: 'The whole lesson', sub: 'Listen, fill in, sing', value: 'all' }]) : null;
    G.sim.lock = 0;
    if (!id || !how) return;
    const sg = SONG(id), r = await karaoke(sg, how === 'sing' ? { only: 'sing' } : { skipListen: false });
    if (r && r.grade) { const rec = st.songs[id]; rec.best = best(rec.best, r.grade); if (G.save) G.save(); }
  }
  // ------------------------------------------------------------ chapter 5: her own song (learned in her room), then the concert at the theater
  async function chapter5() {
    const st = S(), sg = SONG('todoke'), A = ROOM.a.otoha.st;
    if (st.ch5 === 'go') return ssay('otoha', 'an.c5.go', { full: true });
    A.forcePose = true; A.pose = 'talk';
    await ssay('otoha', 'an.c5');
    A.forcePose = false;
    openPanel(sg);
    let ok = false;
    try { const r1 = await roundListen(sg); if (!r1.quit) { const r2 = await roundFill(sg); ok = !r2.quit; } }
    catch (e) { console.error('[anime] ch5', e); }
    finally { stopTrack(); RUN = null; closePanel(); }
    if (!ok) { UI.toast('Stopped. Talk to Otoha to learn her song.'); return; }
    st.ch5 = 'go'; st.songs.todoke = st.songs.todoke || {};
    A.forcePose = true; A.pose = 'cheer'; mimoSparkle(14);
    await ssay('otoha', 'an.c5.plan');
    await ssay('otoha', 'an.c5.go', { full: true });
    A.forcePose = false;
    if (G.save) G.save();
    UI.toast('Otoha’s concert: in front of the old theater, up the north road');
  }
  // the old theater's steps (cemetery.js: its door at z −234.75; romance.js reads Morgana's poem here too)
  const STAGE = { otoha: { x: -13.5, z: -234.15, yaw: 0 }, susumu: { x: -11.3, z: -233.7, yaw: -0.25 }, you: { x: -13.5, z: -230.2, yaw: Math.PI },
    mimo: { x: -12.3, z: -230.5 }, crowd: [[-16.1, -229.6, 2.6], [-10.9, -229.4, -2.6], [-15.2, -228.0, 2.8], [-12.1, -227.7, -3.0], [-17.3, -231.3, 2.2], [-9.6, -231.0, -2.2]] };
  if (!ACTORS.PRESETS.an_fan0) [['#3f7fc9', '#2e2420', 'cap'], ['#e0743c', '#6b3b25', null], ['#8a5ab0', '#f4f1ea', 'straw'], ['#4f9a5a', '#3a2b26', null], ['#d64b3c', '#2a1f2b', null], ['#e6b84a', '#4a2f27', 'band']]
    .forEach(([dress, hair, hat], i) => { ACTORS.PRESETS['an_fan' + i] = { dress, apron: null, skin: ['#f6d0ae', '#e6b48c', '#c98e62'][i % 3], hair, hat, glasses: i === 2, bun: i === 4, eyes: i % 2 ? 'happy' : 'open', h: i === 1 ? 0.8 : 0.98 }; });
  let STG = null;
  const gy = (x, z) => WORLD.groundAt(x, z, 3);
  function buildStage() {
    if (STG) return STG;
    const g = new THREE.Group(); g.name = 'anime-stage'; G.w3d.scene.add(g);
    const mk = (who, P) => { const k = buildKid(who); g.add(k.root); return { k, st: { x: P.x, y: gy(P.x, P.z), z: P.z, yaw: P.yaw, baseYaw: P.yaw, talk: 0, pose: 'idle', top: who === 'susumu' ? 1.6 : 1.95, name: NAME[who] } }; };
    const O = mk('otoha', STAGE.otoha), Su = mk('susumu', STAGE.susumu);
    const crowd = STAGE.crowd.map(([x, z, yaw], i) => { const v = ACTORS.villager('an_fan' + i); v.root.position.set(x, gy(x, z), z); v.root.rotation.y = yaw; g.add(v.root); return { v, st: { x, y: gy(x, z), z, yaw, talk: 0, wave: false, walking: false } }; });
    // two lantern posts with a banner between them, at the foot of the steps
    const k = Kit(), y0 = gy(-13.5, -232.6);
    for (const s of [-1, 1]) { const x = -13.5 + s * 2.9; k.cyl(x, y0 + 1.3, -232.6, 0.06, 2.6, '#5a3a22').add(GEO.ball, '#ffe9b0', x, y0 + 2.7, -232.6, 0.22, 0.26, 0.22, 0, 0, 0, { glow: true }); }
    const bt = canvasTex(512, 96, c => { c.fillStyle = '#ff5fa2'; c.fillRect(0, 0, 512, 96); c.fillStyle = '#fff4fa'; c.fillRect(6, 6, 500, 84); jtext(c, '♪ オトハ ライブ ♪', 256, 50, 52, '#c2306f'); });
    const ban = plane(5.2, 0.8, bt, { double: true }); ban.position.set(-13.5, y0 + 2.35, -232.6); g.add(ban);
    bakeInto(g, k);
    STG = { g, O, Su, crowd, hush: 0, hushT: 0 };
    return STG;
  }
  function stageVisible() { return !!STG && isOn() && S().ch5 === 'go' && !inside; }
  function stageUpdate(dt, t) {
    if (!STG) return;
    const vis = stageVisible() || !!STG.live;
    STG.g.visible = vis;
    if (!vis) return;
    const Y = G.sim.you;
    for (const K of [STG.O, STG.Su]) {
      const st = K.st, dx = Y.x - st.x, dz = Y.z - st.z;
      st.talk = damp(st.talk || 0, st.talking ? 1 : 0, 10, dt);
      if (!st.lock) st.yaw = dampAngle(st.yaw, Math.hypot(dx, dz) < 8 ? Math.atan2(dx, dz) : st.baseYaw, 4, dt);
      if (!st.forcePose) st.pose = st.talking ? 'talk' : K === STG.Su ? 'dance' : 'idle';
      animateKid(K.k, st, dt, t);
    }
    for (const c of STG.crowd) { c.v.root.visible = !!STG.live; if (STG.live) ACTORS.animateVillager(c.v, Object.assign(c.st, { wave: STG.cheer && Math.sin(t * 3 + c.st.x) > 0 }), dt, t); }
    STG.hush = damp(STG.hush, STG.hushT, 1.6, dt);
    if (STG.live) G.fx.hush = STG.hush;
  }
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  // the concert: the crowd gathers, she freezes, you cheer; the Hush takes her voice on the first verse and your lines bring
  // it back; the chorus is everyone's; then the gifts (the headband for Mimo, the fan club card) and an encore
  async function concert() {
    const st = S(), sg = SONG('todoke'), C = buildStage(), O = C.O.st, Su = C.Su.st, P = vocalMap(sg);
    C.live = true; C.cheer = false; C.hushT = 0;
    await UI.fade(1, 500);
    teleport(STAGE.you.x, STAGE.you.z, STAGE.you.yaw);
    G.sim.mimoGo(STAGE.mimo, { x: STAGE.otoha.x, z: STAGE.otoha.z });
    const y0 = gy(STAGE.otoha.x, STAGE.otoha.z);
    G.cam.override = { pos: V3(-10.9, y0 + 2.3, -223.4), look: V3(-13.2, y0 - 0.55, -233.4) };       // (aimed low: the panel takes the bottom of the screen)
    Su.forcePose = true; Su.pose = 'idle';
    await UI.fade(0, 650);
    let res = null;
    try {
      O.forcePose = true; O.pose = 'wave';
      await ssay('otoha', 'an.k.hello', { at: O, full: true });
      O.pose = 'shy';
      await ssay('otoha', 'an.k.nervous', { at: O, full: true });
      // you cheer her on (the first chapter's phrase), out loud
      openPanel(sg, { concert: true });
      RUN = { kind: 'cheer', quit: false };
      PANEL.stage.textContent = 'Cheer her on!';
      panelSay('[緊張|きんちょう] する …', 'I’m so nervous…');
      const ch = await askType({ q: 'Cheer Otoha on! <small>(“You can do it!”)</small>', want: ['がんばって ！', 'がんばれ ！', 'がんばって ください ！', 'ファイト ！'], ok: 'Cheer ▸' });
      if (!ch || ch.quit) throw new Error('quit');
      if (typeof LEX !== 'undefined' && LEX.item('ph.ot.ganbatte')) LEX.attempt('ph.ot.ganbatte', { ok: true, ms: 4000, mode: 'talk' });
      C.cheer = true; O.pose = 'sing'; Su.pose = 'dance'; mimoSparkle(10);
      panelSay('うん ！ [歌|うた]う ね ！', 'Mm! I’ll sing!');
      await sleep(900);
      let hit = false, back = false;
      const sing = await roundSing(sg, { concert: true, hushed: [1, 2, 3],
        tick: (p, run) => {
          const at = lineAt(P, p);
          if (!hit && at && at.ln.i >= 1) { hit = true; C.hushT = 0.85; PL.muffle = 0.55; O.pose = 'shy'; Su.pose = 'idle'; C.cheer = false; panelSay('あ … [声|こえ] が … [出|で]ない …', 'Ah… my voice… it won’t come…'); Sound.play('whimper'); }
        },
        onLine: (ln, run) => {
          if (hit && !back && ln.i >= 1 && ln.i <= 3) C.hushT = Math.max(0.15, C.hushT - 0.23);
          if (!back && ln.i === 3) { back = true; C.hushT = 0.1; PL.muffle = 0; O.pose = 'sing'; Su.pose = 'dance'; C.cheer = true; panelSay('[聞|き]こえる ！ みんな の [声|こえ] が 、 [聞|き]こえる ！', 'I can hear it! I can hear everyone’s voices!'); }
          if (ln.i >= 8) C.hushT = 0;
        } });
      if (sing.quit) throw new Error('quit');
      C.hushT = 0; mimoSparkle(30);
      for (const c of C.crowd) G.w3d.fx.sparkle(c.st.x, c.st.y + 1.8, c.st.z, 8);
      stopTrack();
      const grade = gradeOf(null, sing);
      await showResult(sg, grade);
      res = { grade };
    } catch (e) { if (e.message !== 'quit') console.error('[anime] concert', e); }
    finally { stopTrack(); RUN = null; closePanel(); }
    if (!res) { C.live = false; C.hushT = 0; G.fx.hush = 0; G.cam.override = null; O.forcePose = Su.forcePose = false; UI.toast('The concert stopped. Talk to Otoha at the theater to start again.'); return; }
    // the gifts, and an encore
    O.pose = 'talk';
    await ssay('otoha', 'an.k.end', { at: O });
    st.band = true; st.bandOn = true; band();
    Sound.play('chest'); mimoSparkle(24);
    await ssay('otoha', 'an.k.band', { at: O, full: true });
    st.card = true; G.state.bag = G.state.bag || {}; G.state.bag['k.fanCard'] = 1;
    await ssay('otoha', 'an.k.card', { at: O });
    await UI.card(`<div class="tag">From Otoha</div><canvas width="140" height="140"></canvas><div class="big">${J('ファンクラブ [会員証|かいいんしょう]', { ruby: 'always' })}</div><div class="sub">Otoha’s fan club card, No. 1. ${esc(G.state.mimoName)} wears her cheering headband now (her menu can take it off). <b>E</b></div>`, { kind: 'reveal', icon: 'fanCard' });
    if (typeof LEX !== 'undefined' && !LEX.taught('ph.ot.encore')) await praisePhrase('ph.ot.encore', 'Everyone wants more. Call for an encore!');
    O.pose = 'cheer'; await ssay('otoha', 'an.k.encore', { at: O, full: true });
    // the encore: the chorus once more, everyone singing, sparkles
    startTrack(sg.sound, { mode: 'demo', from: P.lines[4].at, level: 0.34 }); O.pose = 'sing'; Su.pose = 'dance'; C.cheer = true;
    for (let i = 0; i < 6; i++) { await STORY.wait(1); mimoSparkle(6); }
    stopTrack();
    if (!st.songs.todoke) st.songs.todoke = {};
    st.songs.todoke.best = best(st.songs.todoke.best, res.grade); st.songs.todoke.done = true;
    if (typeof LEX !== 'undefined' && !LEX.taught('ph.ot.issho')) await praisePhrase('ph.ot.issho', 'One more thing to say to Otoha: let’s sing together!');
    st.ch = 5; st.ch5 = 'done'; st.concert = true;
    if (G.save) G.save();
    await UI.fade(1, 500);
    C.live = false; C.cheer = false; G.fx.hush = 0; G.cam.override = null; O.forcePose = Su.forcePose = false;
    G.sim.mimoGo(null, null);
    await UI.fade(0, 500);
    UI.toast('Otoha and Susumu went home, singing all the way.');
  }
  // ------------------------------------------------------------ Mimo's cheering headband (a hachimaki with オトハ on it)
  let BAND_M = null;
  function band() {
    if (BAND_M || !G || !G.cast || !G.cast.mimo) return BAND_M;
    const g = new THREE.Group(); g.position.set(0, 0.47, 0); g.rotation.x = -0.12;
    const tor = new THREE.Mesh(new THREE.TorusGeometry(0.285, 0.038, 8, 28), TK.toon('#ff5fa2')); tor.rotation.x = HALF; g.add(tor);
    tor.add(new THREE.Mesh(tor.geometry, TK.outlineMat(0.01)));
    const tt = canvasTex(256, 64, c => { c.clearRect(0, 0, 256, 64); jtext(c, 'オトハ', 128, 34, 44, '#fffaf0', { stroke: 6, sc: '#c2306f' }); });
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.065), new THREE.MeshBasicMaterial({ map: tt, transparent: true })); lab.position.set(0, 0, 0.325); g.add(lab);
    for (const s of [-1, 1]) g.add(TK.part(TK.G.sphere, '#ff5fa2', [s * 0.05, 0.0, -0.3], [0.05, 0.035, 0.03], { ink: 0.008 }));
    for (const s of [-1, 1]) g.add(TK.part(TK.G.box, '#ff5fa2', [s * 0.07, -0.09, -0.31], [0.04, 0.16, 0.012], { rot: [0.2, 0, s * 0.35], ink: 0.006 }));
    g.visible = false; G.cast.mimo.body.add(g); BAND_M = g;
    return g;
  }
  const bandOn = () => !!(G && G.state && isOn() && G.state.anime && G.state.anime.band && G.state.anime.bandOn);
  // ============================================================ what you can press E on (in the rooms; outside through STORY.extra)
  const SHOW_OF = { kira: 0, robo: 1, run: 2, cafe: 3 };
  function posterCard(id) {
    const sg = SONGS[SHOW_OF[id]];
    return { tag: 'A poster: ' + sg.kind, lines: [{ text: sg.show, en: `«${sg.showEn}»: ${sg.blurb}`, look: { face: '#fff4fa', edge: PINK } }] };
  }
  function roomItems() {
    const list = []; if (!inside || busy || !ROOM || (typeof DANCE !== 'undefined' && DANCE.busy)) return list;
    const st = S(), add = (R, p, r, label, run) => list.push({ x: R.x + p.x, z: R.z + p.z, y: R.y, r, label, run });
    if (inside === 'a') {
      const a = SPOT.a;
      add(RA, a.exit, 1.3, 'Leave', leave);
      if (st.ch5 !== 'go') add(RA, { x: a.otoha.x, z: a.otoha.z + 1.2 }, 2.3, 'Talk', talkOtoha);
      add(RA, { x: a.tv.x + 1.4, z: a.tv.z + 1.5 }, 1.2, 'Karaoke', songList);
      add(RA, { x: a.posterN.x + 0.8, z: a.posterN.z + 1.0 }, 1.5, 'Look', () => SIGNS.read(posterCard(Math.random() < 0.5 ? 'robo' : 'cafe')));
      add(RA, { x: a.posterW.x + 0.9, z: a.posterW.z + 0.8 }, 1.5, 'Look', () => SIGNS.read(posterCard(Math.random() < 0.5 ? 'kira' : 'run')));
      add(RA, { x: a.shelf.x + 0.9, z: a.shelf.z }, 1.4, 'Look', () => STORY.think('Rows and rows of manga, read right to left. Susumu has read every one of them twice.', 4.5));
      add(RA, a.toB, 1.5, 'Susumu’s room', () => toRoom('b'));
    } else {
      const b = SPOT.b, D = typeof DANCE !== 'undefined' ? DANCE : null;
      add(RB, b.back, 1.4, 'Back', () => toRoom('a'));
      if (D && D.talk && st.ch5 !== 'go') add(RB, { x: b.susumu.x - 0.6, z: b.susumu.z + 1.1 }, 2.0, 'Talk', D.talk);
      else if (st.ch5 !== 'go') add(RB, { x: b.susumu.x - 0.6, z: b.susumu.z + 1.1 }, 2.0, 'Talk', () => ssay('susumu', 'an.su.name', { full: true }));
      if (D && D.machine) add(RB, { x: b.padL.x, z: b.padL.z + 1.3 }, 1.4, 'Dance', D.machine);
      add(RB, { x: b.trophies.x - 0.9, z: b.trophies.z }, 1.3, 'Look', () => SIGNS.read({ tag: 'Susumu’s trophy shelf', lines: [{ text: 'ステップ [王|おう]', en: 'The King of Steps. Every trophy says ススム.', look: { face: '#5a3a2a', edge: GOLD, ink: '#ffe15a' } }] }));
      add(RB, { x: b.poster.x - 0.9, z: b.poster.z }, 1.3, 'Look', () => SIGNS.read(posterCard('robo')));
    }
    return list;
  }
  const PROVIDER = {         // story.js STORY.extra: outdoors, the door's "Go in", the concert, and hearing her sing
    interactables() {
      if (!G || !isOn() || !OUT || OUT.broken || !G.state.flags.hatched) return [];
      const list = [{ x: OUT.door.x, z: OUT.door.z, r: 1.9, label: 'Go in', run: enter }];
      if (STG && stageVisible()) list.push({ x: STAGE.otoha.x, z: STAGE.otoha.z + 2.3, r: 2.6, label: 'Talk', run: concert });
      return list;
    },
    tick(dt, Y) {
      if (!isOn() || !G.state.flags.hatched) return;
      if (!OUT) outdoor();
      const st = S();
      if (!st.told && !st.met && OUT && OUT.door && Math.hypot(OUT.door.x - Y.x, OUT.door.z - Y.z) < 7) {
        st.told = 'heard';
        STORY.think('Someone in the pink house is singing about stars… then stops, as if they heard you.', 5);
        if (G.save) G.save();
      }
      if (st.ch5 === 'go' && !STG && Math.hypot(Y.x - STAGE.you.x, Y.z - STAGE.you.z) < 70) buildStage();
    },
  };
  // her practice, heard through the walls before you've met her (a muffled deck near the door)
  const LEAK = { d: null, bus: null, ac: null };
  function leakTick() {
    const Y = G.sim.you, D = OUT && OUT.door, dist = D ? Math.hypot(Y.x - D.x, Y.z - D.z) : 99;
    const want = !!D && isOn() && !inside && !PL.on && audioOK() && !!G.state.flags.hatched && !S().met && dist < 12 && !!TRACKS.an_kira && !(G.indoors && G.indoors());
    if (want && !LEAK.d) {
      const ac = Sound.ctx;
      if (!LEAK.bus || LEAK.ac !== ac) { const lp = ac.createBiquadFilter(), g = ac.createGain(); lp.type = 'lowpass'; lp.frequency.value = 850; g.gain.value = 0; lp.connect(g); g.connect(Sound.out); LEAK.bus = { lp, g }; LEAK.ac = ac; }
      TRACKS.an_kira.tr = newTr(TRACKS.an_kira.track);
      LEAK.d = Sound.deck('an_kira', LEAK.bus.lp, { at: ac.currentTime + 0.1 });
    } else if (!want && LEAK.d) { const d = LEAK.d; LEAK.d = null; if (LEAK.bus && Sound.ctx) LEAK.bus.g.gain.setTargetAtTime(0, Sound.ctx.currentTime, 0.1); setTimeout(() => d.stop(), 400); Sound.duck('anime-leak', 1); }
    if (LEAK.d && LEAK.bus) { const k = clamp(1 - (dist - 2) / 10, 0, 1); LEAK.bus.g.gain.setTargetAtTime(Sound.music ? 0.2 * k : 0, Sound.ctx.currentTime, 0.2); Sound.duck('anime-leak', 1 - 0.55 * k, 0.5); }
  }

  // ============================================================ the quest (QUESTS.LIST)
  function quest() {
    const an = s => s.anime || {}, chOf = s => an(s).ch || 0;
    const door = () => (inside ? { x: RA.x + SPOT.a.otoha.x, z: RA.z + SPOT.a.otoha.z + 1.2 } : OUT && OUT.door ? OUT.door : null);
    const nextWhen = s => { const n = chOf(s) + 1; return n <= 5 && !GATES[n - 1](s) ? ` Her next song comes ${GATE_TEXT[n - 1]}.` : ''; };
    return {
      id: 'anime', kind: 'side',
      title: 'Otoha’s songs',
      giver: 'Otoha, the girl who sings in the pink house',
      started: s => s.lang === 'ja' && !!(an(s).told || an(s).met),
      steps: [
        { text: 'Find who’s singing in the pink house on the north street', done: s => !!an(s).met, target: door,
          why: 'Someone in the pink house with the orange roof sings anime songs, and stops the moment anyone listens.', hint: '{mimo} points at the pink house: someone’s singing in there!' },
        { get text() { return 'Learn Otoha’s anime songs ({n}/4)'; }, n: s => Math.min(4, chOf(s)), done: s => chOf(s) >= 4, target: door,
          get why() { return 'Songs from the anime she and Susumu love: a magical girl, a giant robot, a relay team, a cat café. Listen, fill in the words, then sing it with her.' + (G ? nextWhen(G.state) : ''); },
          hint: '{mimo} hums a tune and hops toward the pink house.' },
        { text: 'Learn the song Otoha wrote herself', done: s => !!an(s).ch5 || chOf(s) >= 5, target: door,
          get why() { return 'Her own song, about the Hush that steals her voice.' + (G ? nextWhen(G.state) : ''); }, hint: '{mimo} points at the pink house.' },
        { text: 'Otoha’s concert on the old theater’s steps', done: s => chOf(s) >= 5, target: () => (an(G.state).ch5 === 'go' ? { x: STAGE.otoha.x, z: STAGE.otoha.z + 2.3 } : door()),
          why: 'Up the north road, past the Old Quarter, in front of Aurora’s old theater. If the Hush takes her voice, sing it back.', hint: '{mimo} bounces toward the north gate: the concert!' },
      ],
      story: [
        { when: s => !!an(s).met, text: 'In the pink house on Alba’s north street live Otoha, who sings, and her little brother Susumu. When anyone listens, the Hush takes Otoha’s voice.' },
        { when: s => chOf(s) >= 1, text: 'Otoha teaches songs from the anime she loves, and when you sing with her, her voice comes back.' },
        { when: s => !!an(s).ch5, text: 'Otoha wrote a song of her own, about the Hush, for a concert in front of the old theater.' },
        { when: s => !!an(s).concert, text: 'At Otoha’s concert the Hush took her voice, and everyone sang it back. {mimo} wears her cheering headband now.' },
      ],
    };
  }
  // ============================================================ the mini-map's mark (a pink note on the door; minimap.js may draw it)
  const MARK = {};
  function mapMark(dpr) {
    if (!G || !isOn() || !OUT || OUT.broken || !OUT.door) return null;
    if (!MARK[dpr]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = PINK; c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.arc(s / 2, s / 2, s / 2 - 2, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = PAPER; c.font = '700 11px "Segoe UI", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('♪', s / 2, s / 2 + 0.5);
      MARK[dpr] = cv;
    }
    return { x: OUT.door.x, z: OUT.door.z, img: MARK[dpr] };
  }
  // ============================================================ every notation string (the IME's dictionary; checked against CJK.md)
  function sources() {
    const out = [];
    for (const sg of SONGS) { out.push(sg.title, sg.show); sg.lines.forEach(l => out.push(l.src)); sg.notes.forEach(([w]) => out.push(w)); }
    for (const v of Object.values(LT)) out.push(...v.ja);
    for (const p of PHRASES) out.push(p.ja, ...(p.alt || []));
    for (const it of ITEMS) out.push(it.ja);
    for (const v of Object.values(PANEL_SAY)) (Array.isArray(v[0]) ? v : [v]).forEach(x => out.push(x[0]));
    out.push('[緊張|きんちょう] する …', 'うん ！ [歌|うた]う ね ！', 'あ … [声|こえ] が … [出|で]ない …', '[聞|き]こえる ！ みんな の [声|こえ] が 、 [聞|き]こえる ！', 'がんばって ！', 'がんばれ ！', 'ファイト ！');
    return out;
  }
  function cjCheck() {
    const bad = songCheck().map(p => ({ where: 'song', problems: [p] }));
    if (typeof CJK === 'undefined') return bad;
    for (const s of sources()) { const p = CJK.validate(s, 'ja'); if (p.length) bad.push({ where: 'anime', src: s, problems: p }); }
    if (typeof DANCE !== 'undefined' && DANCE._ && DANCE._.cjCheck) bad.push(...DANCE._.cjCheck());
    return bad;
  }

  // ============================================================ tests (ANIME._.t: the browser console and test pages; the game never calls them)
  const TESTS = (() => {
    const g = () => window.__g;
    const tick = (ms = 0) => new Promise(r => setTimeout(r, ms));       // (a real yield: UI.fade and the cards run on timers)
    const go = async sec => { await g().go(sec); await tick(); };
    function setup(o = {}) {
      const GG = g().game, f = GG.state.flags;
      Object.assign(f, { hatched: true, guideMet: true, guide: true, escort: false, escorted: true, rosa: true, lessons: 2 }, o.flags || {});
      ['hushwave', 'hush', 'lookout', 'glade', 'exit', 'guide', 'gate', 'pass'].forEach(z => { f['z_' + z] = true; });
      if (o.anime) GG.state.anime = Object.assign({ told: 'heard', met: false, ch: 0, songs: {}, badges: [], band: false, bandOn: false, card: false, seen: {} }, o.anime);
      if (typeof Sound !== 'undefined') Sound.music = false;
      return S();
    }
    async function waitFor(fn, sec = 6) { for (let i = 0; i < sec * 20 && !fn(); i++) await go(0.05); return !!fn(); }
    // play on: lines (E), cards (E), menus (o.choose or the first), the karaoke (right answers; o.wrong: a share of wrong ones)
    async function drive(o = {}) {
      const log = [];
      for (let i = 0; i < (o.max || 900); i++) {
        if (o.until && o.until()) break;
        if (panelOpen() && RUN) {
          const R = RUN;
          if (R.kind === 'listen') { if (o.listen === 'play') { await go(0.2); continue; } R.skip = true; if (R.wake) R.wake({}); await go(0.05); continue; }
          if (R.kind === 'result') { log.push('result ' + (PANEL.body.querySelector('.ak-grade') || {}).textContent); if (R.wake) R.wake({}); await go(0.05); continue; }
          const want = R.kind === 'fill' ? R.want : R.kind === 'sing' && R.inputFor !== null ? prep(R.sg).lines[R.inputFor].src
            : R.kind === 'echo' ? (PHRASES.find(p => p.id === R.id) || {}).ja : R.kind === 'cheer' ? 'がんばって ！' : null;
          if (want && R.answer) {
            const wrong = o.wrong && Math.random() < o.wrong, typed = wrong ? 'chigau kotoba' : o.roman ? CJK.roman(want, { lang: 'ja' }) : want;      // (o.roman: typed in rōmaji)
            log.push(R.kind + ': ' + (wrong ? '(wrong) ' : '') + (o.roman ? typed : JP(want))); R.answer(typed); await go(0.05); continue;
          }
          if (o.stopAt && R.kind === o.stopAt) break;
          await go(o.step || 0.1); continue;
        }
        if (typeof DANCE !== 'undefined' && DANCE.busy && DANCE._ && DANCE._.t && DANCE._.t.step) { const s = await DANCE._.t.step(o); if (s) { if (s !== '…') log.push(s); continue; } }
        const card = document.querySelector('#card:not(.hidden)');
        if (card && card.textContent.trim()) { log.push('card: ' + card.textContent.replace(/\s+/g, ' ').slice(0, 60)); dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true, cancelable: true })); await new Promise(r => setTimeout(r, 300)); continue; }
        const ch = document.querySelector('#choose:not(.hidden)');
        if (ch) { const bs = ch.querySelectorAll('button'); log.push('choose: ' + ch.textContent.replace(/\s+/g, ' ').slice(0, 50)); bs[Math.min(o.choose || 0, bs.length - 1)].click(); await new Promise(r => setTimeout(r, 200)); continue; }
        if (STORY.line) { const L0 = g().lineNow(); log.push((L0.name || L0.who) + ': ' + String(L0.text || '').slice(0, 60)); await g().press(); await tick(); continue; }
        if (!STORY.busy && !busy) break;
        await go(0.1);
      }
      return log;
    }
    async function enterNow(o) { STORY.run(() => enter()); await waitFor(() => inside && !busy, 10); return drive(o); }
    async function chapterNow(n, o) { STORY.run(() => chapter(n)); await go(0.1); return drive(o); }
    async function concertNow(o) { buildStage(); STORY.run(() => concert()); await go(0.2); return drive(o); }
    // a screenshot with the DOM panels drawn over the 3D view (an SVG foreignObject of the panel), saved by the dev server
    async function shot(name, o = {}) {
      g().step(1);
      const W = innerWidth, H = innerHeight, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const c = cv.getContext('2d'); c.drawImage(g().renderer.domElement, 0, 0, W, H);
      const els = (o.sel || ['#ak-panel:not(.ak-hidden)', '#dn-panel:not(.dn-hidden)', '#bubble', '#choose:not(.hidden)']).map(s => document.querySelector(s)).filter(e => e && e.offsetWidth);
      if (els.length) {
        const styles = [...document.querySelectorAll('style')].map(s => s.textContent).join('\n');
        const XS = new XMLSerializer(), escX = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const html = els.map(e => { const r = e.getBoundingClientRect(), full = /^(ak-panel|dn-panel)$/.test(e.id); return `<div style="position:absolute;left:${full ? 0 : r.left}px;top:${full ? 0 : r.top}px;width:${full ? W : r.width}px;height:${full ? H : r.height}px">${XS.serializeToString(e)}</div>`; }).join('');
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="position:relative;width:${W}px;height:${H}px"><style>${escX(styles)}</style>${html}</div></foreignObject></svg>`;
        const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        await new Promise(r => { img.onload = r; img.onerror = r; });
        try { c.drawImage(img, 0, 0); } catch (e) { /* (tainted: the 3D view alone) */ }
      }
      const data = cv.toDataURL('image/png');
      const r = await fetch('/shot', { method: 'POST', body: JSON.stringify({ name, data }) });
      return r.json();
    }
    return { setup, waitFor, drive, enterNow, chapterNow, concertNow, shot };
  })();

  // ============================================================ the game side
  function init(game) {
    G = game;
    registerLines(); registerItems(); registerIcons();
    try { if (typeof CJK !== 'undefined') { CJK.addSource(sources(), 'ja'); if (CJK.addNames) CJK.addNames(['オトハ', 'ススム', 'ポロン', 'ダイテッコウ']); } } catch (e) { console.error('[anime]', e); }
    try { registerSongs(); } catch (e) { console.error('[anime] songs', e); }
    if (typeof INTERIORS !== 'undefined' && INTERIORS.claim) INTERIORS.claim(id => id === DOOR_ID && isOn());
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'anime')) QUESTS.LIST.push(quest());
    if (typeof DANCE !== 'undefined' && DANCE.init) { try { DANCE.init(game); } catch (e) { console.error('[dance]', e); } }
  }
  return {
    init,
    // as a room (main.js ROOMS; story.js asks the room you're in for its interactables)
    get inside() { return !!inside; },
    get room() { return inside; },
    get OUTSIDE() { return inside ? outsideSpot() : null; },
    interactables() { return inside ? roomItems() : []; },
    update(dt, t) { roomUpdate(dt, t); },
    curiosities() { return []; },
    target() { if (!inside) return null; return inside === 'a' ? { x: RA.x + SPOT.a.otoha.x, z: RA.z + SPOT.a.otoha.z + 1.2, hint: '{mimo} points at Otoha.' } : { x: RB.x + SPOT.b.susumu.x, z: RB.z + SPOT.b.susumu.z + 1.1, hint: '{mimo} points at Susumu.' }; },
    get busy() { return busy || panelOpen(); },
    enter, leave,
    // outdoors, every frame (main.js): the house's dressing and solid, the concert's stage, her practice through the walls, Mimo's headband
    outdoor(dt, t) {
      if (!G) return;
      outdoor();
      if (!inside) { stageUpdate(dt, t); if (STG && STG.live) karaTick(dt); }
      try { leakTick(); } catch (e) { console.error('[anime] leak', e); LEAK.d = null; }
      if (G.state && G.state.anime && G.state.anime.band) { const b = band(); if (b) b.visible = bandOn(); } else if (BAND_M) BAND_M.visible = false;
      if (typeof DANCE !== 'undefined' && DANCE.outdoor) { try { DANCE.outdoor(dt, t); } catch (e) { console.error('[dance]', e); DANCE.outdoor = null; } }     // (Mimo's medal)
    },
    claims: id => id === DOOR_ID && isOn(),
    mapMark, bandOn,
    DOOR_ID, ROOMS_AT: { a: { x: RA.x, y: RA.y, z: RA.z }, b: { x: RB.x, y: RB.y, z: RB.z } },
    // for dance.js (Susumu's half): the rooms, the people, speaking, the music player, the notation helpers
    get ROOM() { return ROOM; }, SPOT, RB, ssay, animateKid, buildKid, MUSIC, J, JP, JR, esc, canon, same, near, moraeOf, kanaOf, Kit, bakeInto, canvasTex, plane, jtext, starPath, S: () => S(),
    get panelOpen() { return panelOpen(); },
    // tests and tools
    _: { SONGS, LT, PHRASES, ITEMS, prep, vocalMap, songCheck, cjCheck, sources, chordOf, CHARTS, TRACKS, karaoke, chapter, concert, meet, talkOtoha, songList, chUnlocked,
      get RUN() { return RUN; }, get PANEL() { return PANEL; }, get PL() { return PL; }, get STG() { return STG; }, get OUT() { return OUT; }, house, outsideSpot, buildRooms, buildStage, STAGE, toRoom, t: TESTS },
  };
})();
