'use strict';
// The script school (DESIGN.md 13.5 and 14.10, CJK.md): in zh and ja games, the place where you learn the characters on
// purpose. The user: "add japanese and chinese, add their character learning gimick too".
//   zh: Teacher Lin's calligraphy house (林老师, «my name is two trees»): characters through their parts, starting from the
//       words you already say (你好 水 花 树), then pictures (人 口 日 月 木), parts that make characters (明 林 森 休), 山 火 石 鸟,
//       the roof (女 子 字 安) and the water radical 氵 (河 湖 海 洗).
//   ja: Mori-sensei's terakoya (森先生, «three trees»): hiragana a row or two at a time, tied to words you know (き いし はな
//       みず とり りんご), the two little dots, katakana for names and loanwords (ミモ ロサ ブルーノ パン), then the first kanji
//       from their parts (木 林 森 人 休, 日 月 明 山 川).
// The door is Alba's house 09, across the west street from Bruno's yard (interiors.js leaves it to us in zh / ja; in
// es / pt / de it stays an ordinary house). The room floats at (−224, 300, −22) like the other rooms. A lesson is a few short
// rounds in a panel (meet the characters, match pictures, pick by sound, build from parts, type with the IME, read a sign,
// guess from the parts); passing it marks its characters learned (CJK.learn), so their readings fade all over the world,
// and the teacher's next line shows it happening. Progress: G.state.school (saved with the game); learned characters are
// saved with LEX (lex.C). Rewards: a seal stamp, Mimo's brush hat, a certificate. In pinyin / rōmaji mode the school still
// teaches the characters, and after the first lessons offers to switch to character mode (never forces it).
//   SCHOOL.init(game) · as a room (main.js ROOMS): .inside · .OUTSIDE · .interactables() · .update(dt, t) · .curiosities()
//   · .target() · .enter() · .leave() · outdoors: .outdoor(dt, t) (main.js, every frame) · .claims(doorId) (interiors.js)
//   · .hatOn() (main.js: the straw hat steps aside) · .mapMark(dpr) (minimap.js: a red seal on the door) · ._ (tests)

const SCHOOL = (() => {
  const INK = '#2b2235', PAPER = '#fffaf0', RED = '#c8322a';
  const DOOR_ID = 'alba-house-09';                   // the first house on the west street's south side (Lena waters its plants)
  const X0 = -224, Y0 = 300, Z0 = -22;               // the room: past the south-west woods, clear of every other room
  const HW = 6.5, HD = 5, WH = 4.2;
  const HALF = Math.PI / 2;
  let G = null;
  const L = () => (G && G.state && G.state.lang) || (typeof LEX !== 'undefined' && LEX.lang) || 'es';
  const isOn = () => { const l = L(); return l === 'zh' || l === 'ja'; };
  const S = () => { const s = G.state; if (!s.school) s.school = { told: false, met: false, done: {}, stars: {} }; const o = s.school; o.done = o.done || {}; o.stars = o.stars || {}; return o; };
  const cmode = () => (typeof CJK !== 'undefined' ? CJK.mode(L()) : 'roman');
  const TAG = l => (l === 'zh' ? 'zh-Hans' : 'ja');
  const FONT = { zh: '"KaiTi", "STKaiti", "Kaiti SC", "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", serif',
    ja: '"Yu Mincho", "YuMincho", "Hiragino Mincho ProN", "MS Mincho", "Yu Gothic", "Meiryo", serif' };
  const rnd = n => Math.floor(Math.random() * n);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = rnd(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uniq = a => a.filter((x, i) => a.indexOf(x) === i);

  // ============================================================ the parts (radicals and pieces) and what they mean
  const PART = { '亻': 'person', '人': 'person', '木': 'tree', '日': 'sun', '月': 'moon', '口': 'mouth', '女': 'woman', '子': 'child',
    '宀': 'roof', '氵': 'water', '艹': 'grass', '火': 'fire', '山': 'mountain', '厂': 'cliff', '化': 'change', '尔': '(says ěr)',
    '对': '(says duì)', '可': '(says kě)', '胡': '(says hú)', '每': 'every', '先': 'first' };

  // ============================================================ the lessons
  // zh items: { c, r (pinyin), en, icon?, parts?, hint }. ja kana lessons: rows (strings of kana) and words; ja kanji items:
  // { c, r (the kana reading), w (the word in the notation, when it has okurigana), en, icon, parts, hint }.
  // words: [{ w (notation), en, icon }] for the type and word rounds. reads: a sign or a line in the world → its meaning.
  // guess: parts shown → what it means. build: characters you put together from parts.
  const ZH = [
    { id: 'z1', title: 'Words you know', blurb: 'The characters for words you already say',
      items: [
        { c: '你', r: 'nǐ', en: 'you', parts: ['亻', '尔'], hint: '亻 on the left is a person standing up. You’re a person!' },
        { c: '好', r: 'hǎo', en: 'good', parts: ['女', '子'], hint: 'A woman (女) with her child (子): that’s good.' },
        { c: '水', r: 'shuǐ', en: 'water', icon: 'water', hint: 'A stream down the middle, splashing out on both sides.' },
        { c: '花', r: 'huā', en: 'flower', icon: 'flower', parts: ['艹', '化'], hint: '艹 on top means a plant. A plant that changes (化) when it blooms: a flower.' },
        { c: '树', r: 'shù', en: 'tree', icon: 'tree', parts: ['木', '对'], hint: '木 on the left is a little tree: this character is about trees and wood.' },
      ],
      words: [{ w: '[你好|nǐ hǎo]', en: 'hello', icon: 'wave' }, { w: '[水|shuǐ]', en: 'water', icon: 'water' }, { w: '[花|huā]', en: 'flower', icon: 'flower' }, { w: '[树|shù]', en: 'tree', icon: 'tree' }],
      reads: [
        { tag: 'Nico waves at you from the plaza', src: '[你好|nǐ hǎo] ！', en: 'Hello!', wrong: ['Goodbye!', 'Thank you!'] },
        { tag: 'A sign on the well', src: '[水|shuǐ]', en: 'water', wrong: ['fire', 'flowers'] },
        { tag: 'Rosa, when {mimo} learns a word', src: '[很|hěn] [好|hǎo] ！', en: 'Very good!', wrong: ['Very tall!', 'Very quiet!'] },
        { tag: 'A label at the flower stall', src: '[花|huā]', en: 'flowers', wrong: ['trees', 'apples'] },
      ],
      rounds: ['meet', 'match', 'listen', 'type', 'read'] },
    { id: 'z2', title: 'Pictures', blurb: 'Five characters that started out as drawings',
      items: [
        { c: '人', r: 'rén', en: 'person', icon: 'sc_person', pic: 1, hint: 'Two legs, walking along: a person.' },
        { c: '口', r: 'kǒu', en: 'mouth', icon: 'sc_mouth', pic: 1, hint: 'A mouth, wide open. It’s square because it was carved.' },
        { c: '日', r: 'rì', en: 'sun · day', icon: 'sc_sun', pic: 1, hint: 'The sun, drawn square, with a line across the middle.' },
        { c: '月', r: 'yuè', en: 'moon · month', icon: 'sc_moon', pic: 1, hint: 'A crescent moon, standing up.' },
        { c: '木', r: 'mù', en: 'tree · wood', icon: 'tree', pic: 1, hint: 'A tree: branches reaching up, roots reaching down.' },
      ],
      words: [{ w: '[人|rén]', en: 'person', icon: 'sc_person' }, { w: '[口|kǒu]', en: 'mouth', icon: 'sc_mouth' }, { w: '[日|rì]', en: 'sun', icon: 'sc_sun' }, { w: '[月|yuè]', en: 'moon', icon: 'sc_moon' }, { w: '[木|mù]', en: 'wood', icon: 'tree' }],
      reads: [
        { tag: 'A sign on Alba’s gate', src: '[入口|rù kǒu]', en: 'way in', wrong: ['way out', 'no entry'], note: '入 means “go in”, and a mouth (口) is an opening: a way in.' },
        { tag: 'A page of Noa’s notebook', src: '[人|rén] [很|hěn] [多|duō]', en: 'Lots of people', wrong: ['Lots of trees', 'Lots of water'] },
        { tag: 'A box at the bakery', src: '[月饼|yuè bǐng]', en: 'mooncakes', wrong: ['sunbread', 'tree cake'] },
        { tag: 'The calendar at the inn', src: '[星期日|xīng qī rì]', en: 'Sunday', wrong: ['Monday', 'Friday'] },
      ],
      rounds: ['meet', 'match', 'meaning', 'listen', 'read'] },
    { id: 'z3', title: 'Parts make characters', blurb: 'Put pictures together, and a new meaning appears',
      items: [
        { c: '明', r: 'míng', en: 'bright', icon: 'sc_bright', parts: ['日', '月'], hint: 'The sun (日) and the moon (月) together: bright!' },
        { c: '林', r: 'lín', en: 'woods', icon: 'sc_woods', parts: ['木', '木'], hint: 'Two trees: the woods. It’s my name, too: 林!' },
        { c: '森', r: 'sēn', en: 'forest', icon: 'sc_forest', parts: ['木', '木', '木'], hint: 'Three trees: a deep forest. You walked through a 森林 to get here.' },
        { c: '休', r: 'xiū', en: 'rest', icon: 'sc_rest', parts: ['亻', '木'], hint: 'A person (亻) leaning on a tree (木): having a rest.' },
      ],
      words: [{ w: '[明|míng]', en: 'bright', icon: 'sc_bright' }, { w: '[林|lín]', en: 'woods', icon: 'sc_woods' }, { w: '[森林|sēn lín]', en: 'forest', icon: 'sc_forest' }, { w: '[休息|xiū xi]', en: 'to rest', icon: 'sc_rest' }],
      guess: [
        { parts: ['日', '月'], src: '[明|míng]', en: 'bright', wrong: ['dark', 'cold'] },
        { parts: ['木', '木'], src: '[林|lín]', en: 'woods', wrong: ['river', 'roof'] },
        { parts: ['亻', '木'], src: '[休|xiū]', en: 'rest', wrong: ['fire', 'run'] },
        { parts: ['木', '木', '木'], src: '[森|sēn]', en: 'forest', wrong: ['sea', 'sky'] },
      ],
      build: ['明', '林', '森', '休'],
      reads: [
        { tag: 'The sign where the forest begins', src: '[森林|sēn lín]', en: 'the forest', wrong: ['the river', 'the market'] },
        { tag: 'A note on the inn’s door', src: '[休息|xiū xi] [中|zhōng]', en: 'Closed: on a break', wrong: ['Open all day', 'Rooms free'] },
        { tag: 'Bruno, about your next training', src: '[明天|míng tiān] ！', en: 'Tomorrow!', wrong: ['Yesterday!', 'Never!'], note: '明天: the bright day, the next one.' },
      ],
      rounds: ['meet', 'parts', 'build', 'type', 'read'] },
    { id: 'z4', title: 'Mountain, fire, stone, bird', blurb: 'More pictures, and what they make together',
      items: [
        { c: '山', r: 'shān', en: 'mountain', icon: 'mountain', pic: 1, hint: 'Three peaks, the middle one tallest.' },
        { c: '火', r: 'huǒ', en: 'fire', icon: 'sc_fire', pic: 1, hint: 'A flame leaping up, with sparks flying off both sides.' },
        { c: '石', r: 'shí', en: 'stone', icon: 'stone', parts: ['厂', '口'], hint: 'A rock (口) at the foot of a cliff (厂).' },
        { c: '鸟', r: 'niǎo', en: 'bird', icon: 'bird', pic: 1, hint: 'A bird: its eye (the dot), its body, and its tail at the bottom.' },
      ],
      words: [{ w: '[山|shān]', en: 'mountain', icon: 'mountain' }, { w: '[火|huǒ]', en: 'fire', icon: 'sc_fire' }, { w: '[石头|shí tou]', en: 'stone', icon: 'stone' }, { w: '[鸟|niǎo]', en: 'bird', icon: 'bird' }],
      guess: [
        { parts: ['火', '山'], src: '[火山|huǒ shān]', en: 'a volcano', wrong: ['a lake', 'a garden'], note: 'A fire mountain: a volcano!' },
        { parts: ['人', '口'], src: '[人口|rén kǒu]', en: 'how many people live somewhere', wrong: ['a big mouth', 'a hungry person'], note: 'People and mouths to feed: the population.' },
        { parts: ['厂', '口'], src: '[石|shí]', en: 'stone', wrong: ['bird', 'flower'] },
      ],
      reads: [
        { tag: 'A map of the north', src: '[火山|huǒ shān]', en: 'a volcano', wrong: ['a lake', 'a forest'] },
        { tag: 'A sign on the quarry road', src: '[小心|xiǎo xīn] [石头|shí tou]', en: 'Watch out for stones', wrong: ['Watch out for birds', 'Fresh water here'] },
        { tag: 'A cage at the inn', src: '[小鸟|xiǎo niǎo]', en: 'a little bird', wrong: ['a little fire', 'a little mountain'] },
      ],
      rounds: ['meet', 'match', 'parts', 'listen', 'read'] },
    { id: 'z5', title: 'Under one roof', blurb: '女, 子, and the roof 宀',
      items: [
        { c: '女', r: 'nǚ', en: 'woman', icon: 'sc_woman', pic: 1, hint: 'A woman, kneeling, her arms crossed in front.' },
        { c: '子', r: 'zǐ', en: 'child', icon: 'sc_child', pic: 1, hint: 'A baby wrapped up tight, arms out wide.' },
        { c: '字', r: 'zì', en: 'character (writing)', icon: 'sc_char', parts: ['宀', '子'], hint: 'A child (子) under a roof (宀), learning to write: a character!' },
        { c: '安', r: 'ān', en: 'peace · safe', icon: 'sc_peace', parts: ['宀', '女'], hint: 'A woman (女) safe at home under a roof (宀): peace.' },
      ],
      words: [{ w: '[女|nǚ]', en: 'woman', icon: 'sc_woman' }, { w: '[孩子|hái zi]', en: 'child', icon: 'sc_child' }, { w: '[字|zì]', en: 'character', icon: 'sc_char' }, { w: '[安|ān]', en: 'peace', icon: 'sc_peace' }],
      guess: [
        { parts: ['女', '子'], src: '[好|hǎo]', en: 'good', wrong: ['bad', 'old'] },
        { parts: ['宀', '子'], src: '[字|zì]', en: 'a written character', wrong: ['a house', 'a baby bird'] },
        { parts: ['宀', '女'], src: '[安|ān]', en: 'peace, safe', wrong: ['noise', 'danger'] },
      ],
      build: ['好', '字', '安'],
      reads: [
        { tag: 'Teacher Lin, on your practice sheet', src: '[好|hǎo] [字|zì] ！', en: 'Good characters!', wrong: ['Bad luck!', 'More water!'] },
        { tag: 'A charm hanging by a door', src: '[平安|píng ān]', en: 'safe and sound', wrong: ['very noisy', 'closed today'] },
        { tag: 'A book on Teacher Lin’s shelf', src: '[汉字|hàn zì]', en: 'Chinese characters', wrong: ['Chinese food', 'Chinese songs'] },
      ],
      rounds: ['meet', 'build', 'parts', 'type', 'read'] },
    { id: 'z6', title: 'The water radical 氵', blurb: 'Three drops of water on the left',
      items: [
        { c: '河', r: 'hé', en: 'river', icon: 'sc_river', parts: ['氵', '可'], hint: '氵 is water, squeezed onto the left. 可 (kě) hints at the sound: hé.' },
        { c: '湖', r: 'hú', en: 'lake', icon: 'sc_lake', parts: ['氵', '胡'], hint: 'Water, and 胡 (hú) for the sound. The Mirror Lake is 镜湖!' },
        { c: '海', r: 'hǎi', en: 'sea', icon: 'sc_sea', parts: ['氵', '每'], hint: 'Water everywhere (每 means every): the sea.' },
        { c: '洗', r: 'xǐ', en: 'wash', icon: 'sc_wash', parts: ['氵', '先'], hint: 'Water first (先): wash!' },
      ],
      words: [{ w: '[河|hé]', en: 'river', icon: 'sc_river' }, { w: '[湖|hú]', en: 'lake', icon: 'sc_lake' }, { w: '[海|hǎi]', en: 'sea', icon: 'sc_sea' }, { w: '[洗|xǐ]', en: 'wash', icon: 'sc_wash' }],
      reads: [
        { tag: 'The sign at the Mirror Lake', src: '[镜湖|Jìng hú]', en: 'the Mirror Lake', wrong: ['the Great Mill', 'the old tower'] },
        { tag: 'A sign by the Reed River', src: '[河|hé] [边|biān]', en: 'the riverside', wrong: ['the mountaintop', 'the town square'] },
        { tag: 'A sign over the basin', src: '[洗手|xǐ shǒu]', en: 'Wash your hands', wrong: ['Water the plants', 'Feed the birds'] },
      ],
      rounds: ['meet', 'spot', 'match', 'type', 'read'] },
  ];

  const JA = [
    { id: 'j1', title: 'Hiragana: あ and か', blurb: 'The five vowels, then k + each vowel', kana: true,
      rows: [{ k: 'あいうえお', tip: 'The five vowels: a, i, u, e, o. Every kana ends in one of them (except ん).' },
        { k: 'かきくけこ', tip: 'k + each vowel. You know one already: き (ki) is tree, the word over 木!' }],
      words: [{ w: 'き', en: 'tree', icon: 'tree' }, { w: 'いえ', en: 'house', icon: 'house' }, { w: 'あか', en: 'red', icon: 'sc_red' }, { w: 'あお', en: 'blue', icon: 'sc_blue' }, { w: 'こい', en: 'carp (a big fish)', icon: 'fish' }],
      rounds: ['meet', 'sound', 'listen', 'word', 'type'] },
    { id: 'j2', title: 'Hiragana: さ and た', blurb: 's and t, with a few bends', kana: true,
      rows: [{ k: 'さしすせそ', tip: 's + each vowel, except し: it’s shi, not si.' },
        { k: 'たちつてと', tip: 't + each vowel, except ち (chi) and つ (tsu). さ and ち look like mirror twins: watch which way they curl.' }],
      words: [{ w: 'いし', en: 'stone', icon: 'stone' }, { w: 'いす', en: 'chair', icon: 'chair' }, { w: 'つくえ', en: 'desk', icon: 'table' }, { w: 'くち', en: 'mouth', icon: 'sc_mouth' }, { w: 'すし', en: 'sushi', icon: 'fish' }],
      rounds: ['meet', 'sound', 'listen', 'word', 'type'] },
    { id: 'j3', title: 'Hiragana: な and は', blurb: 'n and h: はな, ねこ, ほし', kana: true,
      rows: [{ k: 'なにぬねの', tip: 'n + each vowel. ぬ ends in a little loop.' },
        { k: 'はひふへほ', tip: 'h + each vowel, except ふ (fu). は is read wa when it’s the little word that marks the topic, as in こんにちは.' }],
      words: [{ w: 'はな', en: 'flower', icon: 'flower' }, { w: 'ねこ', en: 'cat', icon: 'cat' }, { w: 'ほし', en: 'star', icon: 'star' }, { w: 'さかな', en: 'fish', icon: 'fish' }, { w: 'ひ', en: 'fire', icon: 'sc_fire' }],
      rounds: ['meet', 'sound', 'listen', 'word', 'type'] },
    { id: 'j4', title: 'Hiragana: ま and ら', blurb: 'm and r: もり, とり', kana: true,
      rows: [{ k: 'まみむめも', tip: 'm + each vowel. め is like ぬ without the loop.' },
        { k: 'らりるれろ', tip: 'The r is a quick tap of the tongue, half an l. る has a loop at its foot; ろ doesn’t.' }],
      words: [{ w: 'もり', en: 'forest', icon: 'sc_forest' }, { w: 'とり', en: 'bird', icon: 'bird' }, { w: 'あめ', en: 'rain', icon: 'sc_rain' }, { w: 'くるま', en: 'car', icon: 'sc_car' }],
      rounds: ['meet', 'sound', 'listen', 'word', 'type'] },
    { id: 'j5', title: 'Hiragana: や, わ, ん and the dots', blurb: 'The last kana, and two little dots that change a sound', kana: true,
      rows: [{ k: 'やゆよ', tip: 'y + a, u, o. Small ゃ ゅ ょ blend into the kana before them: き + ゃ = きゃ (kya).' },
        { k: 'わをん', tip: 'を sounds like o (it’s only a little grammar word), and ん is a humming n.' },
        { k: 'がざだばぱ', tip: 'Two dots (゛) make a sound buzz: か ka → が ga, さ → ざ za, た → だ da, は → ば ba. A little circle (゜) makes は → ぱ pa. A small っ doubles the next sound.' }],
      extra: 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽっゃゅょ',
      words: [{ w: 'やま', en: 'mountain', icon: 'mountain' }, { w: 'みず', en: 'water', icon: 'water' }, { w: 'りんご', en: 'apple', icon: 'apple' }, { w: 'でんしゃ', en: 'train', icon: 'train' }, { w: 'こんにちは', en: 'hello', icon: 'wave' }],
      rounds: ['meet', 'sound', 'listen', 'word', 'type'] },
    { id: 'j6', title: 'Katakana: names and loanwords', blurb: 'The same sounds, written sharp: ミモ, ロサ, ブルーノ, パン', kana: true, kata: true,
      rows: [{ k: 'アミモノ', tip: 'Katakana are the same sounds as hiragana, written with straight, sharp strokes, for names and words from other languages. ア = あ, ミ = み, モ = も, ノ = の.' },
        { k: 'ロサルン', tip: 'ロ = ろ, サ = さ, ル = る, ン = ん. ン (n) and ソ (so) look alike: ン’s little stroke rises from below.' },
        { k: 'ブパー', tip: 'The dots work here too: フ → ブ (bu), ハ → パ (pa). In katakana, a long bar ー makes the sound before it long: ブルーノ is Bu-ruu-no.' }],
      words: [{ w: 'ミモ', en: 'Mimo', icon: 'sc_mimo' }, { w: 'ロサ', en: 'Rosa', icon: 'sc_rosa' }, { w: 'ノア', en: 'Noa', icon: 'letter' }, { w: 'ブルーノ', en: 'Bruno', icon: 'sc_bruno' }, { w: 'パン', en: 'bread', icon: 'bread' }],
      rounds: ['meet', 'pair', 'sound', 'word', 'type'] },
    { id: 'j7', title: 'Kanji: trees and people', blurb: '木, 林, 森, 人, 休',
      items: [
        { c: '木', r: 'き', en: 'tree', icon: 'tree', pic: 1, hint: 'A tree: branches reaching up, roots reaching down. You know it: [木|き].' },
        { c: '林', r: 'はやし', en: 'woods', icon: 'sc_woods', parts: ['木', '木'], hint: 'Two trees: the woods.' },
        { c: '森', r: 'もり', en: 'forest', icon: 'sc_forest', parts: ['木', '木', '木'], hint: 'Three trees: a forest. That’s my name, 森!' },
        { c: '人', r: 'ひと', en: 'person', icon: 'sc_person', pic: 1, hint: 'Two legs, walking along: a person.' },
        { c: '休', r: 'やすみ', w: '[休|やす]み', en: 'a rest · a day off', icon: 'sc_rest', parts: ['亻', '木'], hint: 'A person (亻, a squeezed 人) leaning on a tree: a rest.' },
      ],
      words: [{ w: '[木|き]', en: 'tree', icon: 'tree' }, { w: '[林|はやし]', en: 'woods', icon: 'sc_woods' }, { w: '[森|もり]', en: 'forest', icon: 'sc_forest' }, { w: '[人|ひと]', en: 'person', icon: 'sc_person' }, { w: '[休|やす]み', en: 'a day off', icon: 'sc_rest' }],
      guess: [
        { parts: ['木', '木'], src: '[林|はやし]', en: 'woods', wrong: ['river', 'roof'] },
        { parts: ['木', '木', '木'], src: '[森|もり]', en: 'forest', wrong: ['sea', 'sky'] },
        { parts: ['亻', '木'], src: '[休|やす]み', en: 'a rest', wrong: ['a fire', 'a race'] },
      ],
      build: ['林', '森', '休'],
      reads: [
        { tag: 'A note on a shop door', src: '[休|やす]み', en: 'Closed today', wrong: ['Open', 'Sale'] },
        { tag: 'A sign at the Quiet Forest', src: '[森|もり]', en: 'forest', wrong: ['lake', 'town'] },
        { tag: 'Your teacher’s name card', src: '[森|もり] [先生|せんせい]', en: 'Mori-sensei', wrong: ['the forest school', 'the tree shop'] },
      ],
      rounds: ['meet', 'parts', 'build', 'type', 'read'] },
    { id: 'j8', title: 'Kanji: sun, moon, mountain, river', blurb: '日, 月, 明, 山, 川',
      items: [
        { c: '日', r: 'ひ', en: 'sun · day', icon: 'sc_sun', pic: 1, hint: 'The sun, drawn square, with a line across the middle.' },
        { c: '月', r: 'つき', en: 'moon', icon: 'sc_moon', pic: 1, hint: 'A crescent moon, standing up.' },
        { c: '明', r: 'あかるい', w: '[明|あか]るい', en: 'bright', icon: 'sc_bright', parts: ['日', '月'], hint: 'The sun (日) and the moon (月) together: bright!' },
        { c: '山', r: 'やま', en: 'mountain', icon: 'mountain', pic: 1, hint: 'Three peaks, the middle one tallest.' },
        { c: '川', r: 'かわ', en: 'river', icon: 'sc_river', pic: 1, hint: 'Three lines of water, flowing down.' },
      ],
      words: [{ w: '[日|ひ]', en: 'sun', icon: 'sc_sun' }, { w: '[月|つき]', en: 'moon', icon: 'sc_moon' }, { w: '[明|あか]るい', en: 'bright', icon: 'sc_bright' }, { w: '[山|やま]', en: 'mountain', icon: 'mountain' }, { w: '[川|かわ]', en: 'river', icon: 'sc_river' }],
      build: ['明'],
      reads: [
        { tag: 'A sign by the Reed River', src: '[川|かわ]', en: 'river', wrong: ['mountain', 'moon'] },
        { tag: 'A signpost at the quarry road', src: '[山|やま] へ', en: 'To the mountains', wrong: ['To the river', 'To the sea'] },
        { tag: 'A note pinned at the inn', src: '[明|あか]るい [月|つき]', en: 'a bright moon', wrong: ['a dark mountain', 'a small river'] },
      ],
      rounds: ['meet', 'match', 'build', 'listen', 'read'] },
  ];
  const LESSONS = () => (L() === 'ja' ? JA : ZH);
  // ja kana lessons: their kana (in order), each with its rōmaji
  const kanaOf = Ls => (Ls.rows ? Ls.rows.map(r => r.k).join('') : '');
  const romaOf = k => (k === 'ー' ? '(long)' : typeof CJK !== 'undefined' ? CJK.romaji(k) : k);
  // what a lesson marks learned (CJK.learn): its characters, and for j5 the dotted and small kana too
  const charsOf = Ls => uniq([...(Ls.items ? Ls.items.map(it => it.c).join('') : kanaOf(Ls) + (Ls.extra || ''))].filter(c => c !== 'ー'));
  // every notation string the school uses, for the IME's dictionary (CJK.addSource)
  function sources() {
    const out = [];
    for (const Ls of ZH.concat(JA)) {
      (Ls.items || []).forEach(it => out.push(it.w || `[${it.c}|${it.r}]`));
      (Ls.words || []).forEach(w => out.push(w.w));
      (Ls.reads || []).forEach(r => out.push(r.src));
      (Ls.guess || []).forEach(g => out.push(g.src));
    }
    return out;
  }

  // ============================================================ lines (lines.js format: one entry per tier, the English weave last)
  // Teacher Lin (zh) and Mori-sensei (ja) speak at the learner's level; nobody genders the player.
  const T = (zh, ja, en) => ({ zh, ja, en });
  const LT = {
    'sc.zh.hi': { zh: ['[你好|nǐ hǎo] ！ [我|wǒ] [是|shì] [林|Lín] [老师|lǎo shī] 。', '[你好|nǐ hǎo] ！ [我|wǒ] [是|shì] [林|Lín] [老师|lǎo shī] 。 [我|wǒ] [教|jiāo] [大家|dà jiā] [写|xiě] [字|zì] 。'],
      en: ['{w.hello}! I’m Teacher Lin.', '{w.hello}! I’m Teacher Lin. I teach people to write characters.'] },
    'sc.zh.parts': { zh: ['[汉字|hàn zì] [有|yǒu] [部分|bù fen] 。', '[每|měi] [个|gè] [汉字|hàn zì] [都|dōu] [有|yǒu] [部分|bù fen] 。 [认识|rèn shi] [部分|bù fen] ， [就|jiù] [能|néng] [猜|cāi] [意思|yì si] 。'],
      en: ['Characters are made of parts.', 'Every character is made of parts. Know the parts, and you can guess what it means.'] },
    'sc.zh.start': { zh: ['[我们|wǒ men] [开始|kāi shǐ] [吧|ba] ！', '[你|nǐ] [已经|yǐ jīng] [会|huì] [说|shuō] [很多|hěn duō] [词|cí] [了|le] 。 [我们|wǒ men] [来|lái] [看看|kàn kan] [它们|tā men] [的|de] [字|zì] 。'],
      en: ['Let’s begin!', 'You can already say lots of words. Let’s look at how they’re written.'] },
    'sc.zh.menu': { zh: ['[今天|jīn tiān] [学|xué] [什么|shén me] ？', '[你|nǐ] [来|lái] [了|le] ！ [今天|jīn tiān] [学|xué] [什么|shén me] ？'], en: ['What shall we learn today?', 'You’re back! What shall we learn today?'] },
    'sc.zh.end.z1': { zh: ['[你好|nǐ hǎo] ！ [水|shuǐ] ， [花|huā] ， [树|shù] … [你|nǐ] [都|dōu] [会|huì] [读|dú] [了|le] ！'], en: ['{w.hello}! Water, flower, tree… you can read them all now!'] },
    'sc.zh.end.z2': { zh: ['[人|rén] ， [口|kǒu] ， [日|rì] ， [月|yuè] ， [木|mù] ： [都|dōu] [是|shì] [画|huà] ！'], en: ['Person, mouth, sun, moon, tree: they’re all pictures!'] },
    'sc.zh.end.z3': { zh: ['[日|rì] [和|hé] [月|yuè] ， [就|jiù] [是|shì] [明|míng] 。 [我|wǒ] [姓|xìng] [林|Lín] ： [两|liǎng] [棵|kē] [树|shù] ！'], en: ['Sun and moon make 明. And my name is 林: two trees!'] },
    'sc.zh.end.z4': { zh: ['[山上|shān shang] [有|yǒu] [石头|shí tou] ， [也|yě] [有|yǒu] [鸟|niǎo] 。 [可是|kě shì] [别|bié] [玩|wán] [火|huǒ] ！'], en: ['On the mountain there are stones, and birds too. But don’t play with fire!'] },
    'sc.zh.end.z5': { zh: ['[女|nǚ] [和|hé] [子|zǐ] ， [就|jiù] [是|shì] [好|hǎo] 。 [你|nǐ] [的|de] [字|zì] [很|hěn] [好|hǎo] ！'], en: ['Woman and child make 好. Your characters are very good!'] },
    'sc.zh.end.z6': { zh: ['[河|hé] ， [湖|hú] ， [海|hǎi] ： [都|dōu] [有|yǒu] [水|shuǐ] 。 [去|qù] [洗|xǐ] [手|shǒu] [吧|ba] ！'], en: ['River, lake, sea: they all have water. Now go and wash the ink off your hands!'] },
    'sc.zh.stamp': { zh: ['[这|zhè] [是|shì] [你|nǐ] [的|de] [印章|yìn zhāng] 。', '[这|zhè] [是|shì] [你|nǐ] [的|de] [印章|yìn zhāng] 。 [每|měi] [学|xué] [完|wán] [一|yī] [课|kè] ， [就|jiù] [盖|gài] [一|yī] [个|gè] [章|zhāng] 。'],
      en: ['This is your seal.', 'This is your seal stamp. Every lesson you finish gets a stamp.'] },
    'sc.zh.hat': { zh: ['[送|sòng] [给|gěi] {mimo} [一|yī] [顶|dǐng] [帽子|mào zi] ！', '[送|sòng] [给|gěi] {mimo} [一|yī] [顶|dǐng] [帽子|mào zi] 。 [上面|shàng mian] [有|yǒu] [一|yī] [支|zhī] [毛笔|máo bǐ] ！'],
      en: ['A hat for {mimo}!', 'A hat for {mimo}. There’s a little brush on top!'] },
    'sc.zh.done': { zh: ['[你|nǐ] [都|dōu] [学|xué] [完|wán] [了|le] ！ [我|wǒ] [很|hěn] [高兴|gāo xìng] 。'], en: ['You’ve finished every lesson! I’m so happy.'] },
    'sc.zh.offer': { zh: ['[想|xiǎng] [到处|dào chù] [看|kàn] [汉字|hàn zì] [吗|ma] ？'], en: ['Would you like to see characters everywhere now?'] },
    'sc.zh.back': { zh: ['[欢迎|huān yíng] ！'], en: ['Welcome!'] },
    'sc.zh.practice': { zh: ['[快|kuài] ！ [你|nǐ] [认识|rèn shi] [多少|duō shao] [字|zì] ？'], en: ['Quick! How many characters do you know?'] },
    'sc.zh.rosa': { zh: ['[林|Lín] [老师|lǎo shī] [教|jiāo] [写|xiě] [字|zì] 。 [他|tā] [家|jiā] [在|zài] [那边|nà biān] 。',
      '[对了|duì le] ！ [你|nǐ] [想|xiǎng] [学|xué] [汉字|hàn zì] [吗|ma] ？ [林|Lín] [老师|lǎo shī] [是|shì] [书法家|shū fǎ jiā] 。 [他|tā] [家|jiā] [在|zài] [布鲁诺|Bù lǔ nuò] [的|de] [院子|yuàn zi] [对面|duì miàn] 。'],
      en: ['Teacher Lin teaches writing. His house is over there.', 'Oh, one more thing! Would you like to learn our characters? Teacher Lin is a calligrapher. His house is across from Bruno’s yard.'] },
    'sc.zh.bruno': { zh: ['[林|Lín] [老师|lǎo shī] [教|jiāo] [写|xiě] [字|zì] 。 [他|tā] [家|jiā] [就|jiù] [在|zài] [对面|duì miàn] 。'], en: ['Teacher Lin teaches writing. His house is right across the street.'] },

    'sc.ja.hi': { ja: ['こんにちは ！ [森|もり] です 。', 'こんにちは ！ [森|もり] です 。 ここ は [寺子屋|てらこや] 、 [小|ちい]さな [学校|がっこう] です よ 。'],
      en: ['{w.hello}! I’m Mori.', '{w.hello}! I’m Mori. This is a terakoya: a little school.'] },
    'sc.ja.parts': { ja: ['まず は ひらがな です 。', '[日本語|にほんご] は 、 ひらがな と カタカナ と [漢字|かんじ] で [書|か]きます 。 まず は ひらがな から です 。'],
      en: ['First: hiragana.', 'Japanese is written three ways: hiragana, katakana and kanji. We start with hiragana.'] },
    'sc.ja.start': { ja: ['いっしょ に [読|よ]みましょう ！', 'き 、 はな 、 みず … もう [知|し]って います ね 。 [書|か]き[方|かた] を [見|み]ましょう 。'],
      en: ['Let’s read together!', 'Tree, flower, water… you know these words already. Let’s see how they’re written.'] },
    'sc.ja.menu': { ja: ['[今日|きょう] は [何|なに] を [勉強|べんきょう] します か ？', 'おかえりなさい ！ [今日|きょう] は [何|なに] を [勉強|べんきょう] します か ？'], en: ['What shall we study today?', 'Welcome back! What shall we study today?'] },
    'sc.ja.end.j1': { ja: ['あ 、 い 、 う 、 え 、 お ！ [上手|じょうず] です ね ！'], en: ['A, i, u, e, o! You’re good at this!'] },
    'sc.ja.end.j2': { ja: ['いし 、 いす 、 くち … もう [読|よ]めます ね ！'], en: ['Stone, chair, mouth… you can read them now!'] },
    'sc.ja.end.j3': { ja: ['はな 、 ねこ 、 ほし … ぜんぶ [読|よ]めます ね ！'], en: ['Flower, cat, star… you can read them all!'] },
    'sc.ja.end.j4': { ja: ['もり 、 とり 、 くるま ！ もり は わたし の [名前|なまえ] です よ 。'], en: ['Forest, bird, car! And Mori is my name, you know.'] },
    'sc.ja.end.j5': { ja: ['やま 、 みず 、 りんご ！ ひらがな は ぜんぶ おわり です ！'], en: ['Mountain, water, apple! That’s all of hiragana!'] },
    'sc.ja.end.j6': { ja: ['ミモ 、 ロサ 、 ブルーノ 、 パン ！ カタカナ も [読|よ]めます ね 。'], en: ['Mimo, Rosa, Bruno, bread! You can read katakana too.'] },
    'sc.ja.end.j7': { ja: ['[木|き] が [二|ふた]つ で [林|はやし] 、 [三|みっ]つ で [森|もり] ！ わたし の [名前|なまえ] です 。'], en: ['Two trees make 林, three make 森: that’s my name!'] },
    'sc.ja.end.j8': { ja: ['[日|ひ] と [月|つき] で 「 [明|あか]るい 」 。 [山|やま] も [川|かわ] も ！ よく できました ！'], en: ['Sun and moon make “bright”. Mountain and river too! Well done!'] },
    'sc.ja.stamp': { ja: ['これ は あなた の はんこ です 。', 'これ は あなた の はんこ です 。 [終|お]わった レッスン に 、 ぽん と [押|お]します 。'],
      en: ['This is your hanko.', 'This is your hanko, your own stamp. It goes on every lesson you finish.'] },
    'sc.ja.hat': { ja: ['{mimo} に 、 [筆|ふで] の [帽子|ぼうし] を どうぞ ！'], en: ['A brush hat for {mimo}!'] },
    'sc.ja.done': { ja: ['[全部|ぜんぶ] [終|お]わりました ！ はなまる です ！'], en: ['You’ve finished everything! A hanamaru: top marks!'] },
    'sc.ja.offer': { ja: ['かな と [漢字|かんじ] で [遊|あそ]んで みます か ？'], en: ['Would you like to try playing in kana and kanji?'] },
    'sc.ja.back': { ja: ['いらっしゃい ！'], en: ['Welcome!'] },
    'sc.ja.practice': { ja: ['[早|はや]く ！ いくつ [読|よ]めます か ？'], en: ['Quick! How many can you read?'] },
    'sc.ja.rosa': { ja: ['[森|もり] [先生|せんせい] の [寺子屋|てらこや] で 、 [字|じ] を [習|なら]えます よ 。',
      'そう だ ！ [字|じ] を [読|よ]みたい です か ？ [森|もり] [先生|せんせい] の [寺子屋|てらこや] は 、 ブルーノ さん の [庭|にわ] の [向|む]かい です よ 。'],
      en: ['You can learn our letters at Mori-sensei’s little school.', 'Oh, one more thing! Would you like to read our letters? Mori-sensei’s terakoya, a little school, is across from Bruno’s yard.'] },
    'sc.ja.bruno': { ja: ['[森|もり] [先生|せんせい] の [寺子屋|てらこや] は 、 [向|む]かい です よ 。'], en: ['Mori-sensei’s little school is right across the street.'] },
  };
  function registerLines() { if (typeof LINES !== 'undefined') for (const [k, v] of Object.entries(LT)) if (!LINES[k]) LINES[k] = v; }
  // the teacher's quick words in the lesson panel: [notation, English]
  const PRAISE = { zh: [['[对|duì] ！', 'Right!'], ['[很|hěn] [好|hǎo] ！', 'Very good!'], ['[太|tài] [棒|bàng] [了|le] ！', 'Great!']],
    ja: [['そう ！', 'Yes!'], ['[上手|じょうず] ！', 'Nicely done!'], ['すごい ！', 'Great!']] };
  const OOPS = { zh: [['[再|zài] [看看|kàn kan] 。', 'Look again.'], ['[没|méi] [关系|guān xi] 。', 'That’s OK.']], ja: [['おしい ！', 'So close!'], ['[大丈夫|だいじょうぶ] 。', 'That’s OK.']] };
  // names (CJK.md's table): the teacher, the place
  const NAME = { zh: { teacher: '[林|Lín] [老师|lǎo shī]', en: 'Teacher Lin', place: '[书法|shū fǎ]', placeEn: 'Teacher Lin’s calligraphy house', who: 'Teacher Lin' },
    ja: { teacher: '[森|もり] [先生|せんせい]', en: 'Mori-sensei', place: '[寺子屋|てらこや]', placeEn: 'Mori-sensei’s terakoya', who: 'Mori-sensei' } };
  const nm = () => NAME[L()] || NAME.zh;
  const plainOf = (src, o) => (typeof CJK !== 'undefined' ? CJK.plain(src, Object.assign({ lang: L() }, o || {})) : src);

  // ============================================================ the pictures for the match and word rounds (icons.js's paper-cutout rule)
  (function addIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const H = ICONS.H, { shape, ell, poly, rr, dot, eyes } = H, has = k => ICONS.keys.includes(k);
    const add = (k, fn) => { if (!has(k)) ICONS.add(k, fn); };
    const SKIN = '#f5cda2';
    const treeAt = (c, p, x, y, s) => { shape(c, p, poly([[x - 4 * s, y + 30 * s], [x - 3 * s, y], [x + 3 * s, y], [x + 4 * s, y + 30 * s]]), '#8a5f3e'); shape(c, p, ell(x, y - 8 * s, 15 * s, 17 * s), '#5aa84a'); };
    const crescent = (x, y, r) => c => { c.arc(x, y, r, Math.PI * 0.32, Math.PI * 1.68); c.quadraticCurveTo(x - r * 0.25, y, x + r * 0.85 * Math.cos(Math.PI * 0.32), y + r * Math.sin(Math.PI * 0.32)); c.closePath(); };
    const sunAt = (c, p, x, y, r) => { shape(c, p, cc => { for (let i = 0; i < 16; i++) { const a = (i * Math.PI) / 8, q = i % 2 ? r * 0.72 : r; i ? cc.lineTo(x + Math.cos(a) * q, y + Math.sin(a) * q) : cc.moveTo(x + Math.cos(a) * q, y + Math.sin(a) * q); } cc.closePath(); }, '#ffcf3f'); shape(c, p, ell(x, y, r * 0.58, r * 0.58), '#ffb52e'); };
    add('sc_person', (c, p) => { shape(c, p, rr(-13, -8, 26, 36, 10), '#3f7fc9'); shape(c, p, ell(0, -22, 12, 12), SKIN); if (p) eyes(c, -4, 4, -22, 0.7); });
    add('sc_mouth', (c, p) => { shape(c, p, ell(0, 0, 32, 20), '#8a2a3a'); if (p) { c.fillStyle = '#fff'; c.fillRect(-16, -18, 32, 8); dot(c, 0, 9, 9, '#e8728a'); } shape(c, 1, ell(0, 0, 32, 20), null, 3); });
    add('sc_sun', (c, p) => sunAt(c, p, 0, 0, 32));
    add('sc_moon', (c, p) => { shape(c, p, crescent(-4, 0, 30), '#ffe58a'); });
    add('sc_bright', (c, p) => { sunAt(c, p, -12, -4, 22); shape(c, p, crescent(16, 6, 18), '#ffe58a'); });
    add('sc_woods', (c, p) => { treeAt(c, p, -14, 0, 0.9); treeAt(c, p, 15, 2, 0.9); });
    add('sc_forest', (c, p) => { treeAt(c, p, -20, 4, 0.75); treeAt(c, p, 20, 4, 0.75); treeAt(c, p, 0, -6, 0.85); });
    add('sc_rest', (c, p) => { treeAt(c, p, 16, -2, 1); shape(c, p, rr(-22, -2, 20, 30, 8, 0), '#e0743c'); shape(c, p, ell(-10, -14, 10, 10), SKIN); if (p) { c.font = '700 13px "Segoe UI", sans-serif'; c.fillStyle = INK; c.fillText('z', -30, -24); c.fillText('z', -36, -34); } });
    add('sc_fire', (c, p) => { shape(c, p, cc => { cc.moveTo(0, -36); cc.bezierCurveTo(14, -14, 30, 0, 22, 18); cc.quadraticCurveTo(14, 32, 0, 32); cc.quadraticCurveTo(-14, 32, -22, 18); cc.bezierCurveTo(-30, 0, -10, -8, 0, -36); cc.closePath(); }, '#ef6a2f'); shape(c, p, cc => { cc.moveTo(0, -6); cc.bezierCurveTo(8, 4, 14, 12, 10, 22); cc.quadraticCurveTo(0, 30, -10, 22); cc.bezierCurveTo(-14, 12, -6, 6, 0, -6); cc.closePath(); }, '#ffd23f'); });
    add('sc_woman', (c, p) => { shape(c, p, poly([[-20, 32], [-8, -4], [8, -4], [20, 32]]), '#d97aa0'); shape(c, p, ell(0, -18, 12, 12), SKIN); shape(c, p, ell(0, -33, 7, 6), '#4a2f27'); if (p) eyes(c, -4, 4, -18, 0.7); });
    add('sc_child', (c, p) => { shape(c, p, rr(-14, -2, 28, 28, 12), '#ffd84a'); shape(c, p, ell(0, -16, 14, 14), SKIN); shape(c, p, ell(-24, 6, 9, 5, 0.5), SKIN); shape(c, p, ell(24, 6, 9, 5, -0.5), SKIN); if (p) eyes(c, -5, 5, -16, 0.8); });
    add('sc_char', (c, p) => { shape(c, p, rr(-26, -32, 52, 64, 3), '#fffaf0'); if (p) { c.font = `700 40px ${FONT.zh}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = INK; c.fillText('字', 0, 2); } });
    add('sc_peace', (c, p) => { shape(c, p, rr(-22, -4, 44, 32, 3), '#f3e8d2'); shape(c, p, poly([[-30, -2], [0, -32], [30, -2]]), '#c9553f'); shape(c, p, cc => { cc.moveTo(0, 22); cc.bezierCurveTo(-18, 10, -12, -4, 0, 4); cc.bezierCurveTo(12, -4, 18, 10, 0, 22); cc.closePath(); }, '#e86a7a'); });
    add('sc_river', (c, p) => { shape(c, p, rr(-34, -30, 68, 60, 8), '#7fbf6a'); shape(c, p, cc => { cc.moveTo(-10, -30); cc.bezierCurveTo(16, -12, -22, 8, 6, 30); cc.lineTo(22, 30); cc.bezierCurveTo(-6, 8, 32, -12, 6, -30); cc.closePath(); }, '#4aa8d8'); });
    add('sc_lake', (c, p) => { shape(c, p, ell(0, 6, 34, 20), '#4aa8d8'); if (p) { [[-26, -6], [-20, -10], [24, -4]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x, y + 14); c.lineTo(x + 2, y - 8); c.lineWidth = 2.4; c.strokeStyle = '#4f8a3a'; c.stroke(); }); dot(c, -8, 2, 5, 'rgba(255,255,255,0.6)'); } });
    add('sc_sea', (c, p) => { shape(c, p, cc => { cc.moveTo(-34, -8); for (let i = 0; i < 4; i++) cc.quadraticCurveTo(-26 + i * 17, -22, -17 + i * 17, -8); cc.lineTo(34, 28); cc.lineTo(-34, 28); cc.closePath(); }, '#3a86c4'); if (p) [[-18, 8], [10, 14]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x - 8, y); c.quadraticCurveTo(x, y - 6, x + 8, y); c.lineWidth = 2; c.strokeStyle = '#e8f7ff'; c.stroke(); }); });
    add('sc_wash', (c, p) => { shape(c, p, cc => { cc.moveTo(-30, 6); cc.lineTo(30, 6); cc.quadraticCurveTo(26, 30, 0, 30); cc.quadraticCurveTo(-26, 30, -30, 6); cc.closePath(); }, '#d8cfbb'); [[-10, -24], [6, -14], [-2, -32]].forEach(([x, y]) => shape(c, p, cc => { cc.moveTo(x, y - 8); cc.quadraticCurveTo(x + 7, y + 2, x, y + 6); cc.quadraticCurveTo(x - 7, y + 2, x, y - 8); cc.closePath(); }, '#4aa8d8', 1.8)); });
    add('sc_red', (c, p) => { shape(c, p, cc => { for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6, q = i % 2 ? 22 : 30; i ? cc.lineTo(Math.cos(a) * q, Math.sin(a) * q) : cc.moveTo(q, 0); } cc.closePath(); }, '#e0473a'); });
    add('sc_blue', (c, p) => { shape(c, p, cc => { for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6, q = i % 2 ? 22 : 30; i ? cc.lineTo(Math.cos(a) * q, Math.sin(a) * q) : cc.moveTo(q, 0); } cc.closePath(); }, '#3a7fd6'); });
    add('sc_rain', (c, p) => { shape(c, p, cc => { cc.moveTo(-28, 0); cc.arc(-14, -6, 14, Math.PI * 0.6, Math.PI * 1.6); cc.arc(4, -14, 16, Math.PI * 1.1, Math.PI * 1.95); cc.arc(20, -2, 12, Math.PI * 1.5, Math.PI * 0.5); cc.closePath(); }, '#cfd8e6'); [[-14, 22], [4, 28], [20, 20]].forEach(([x, y]) => shape(c, p, cc => { cc.moveTo(x, y - 9); cc.quadraticCurveTo(x + 6, y + 1, x, y + 5); cc.quadraticCurveTo(x - 6, y + 1, x, y - 9); cc.closePath(); }, '#4aa8d8', 1.8)); });
    add('sc_car', (c, p) => { shape(c, p, rr(-34, -6, 68, 22, 7), '#e0503f'); shape(c, p, rr(-18, -22, 34, 18, 6), '#e0503f'); if (p) shape(c, 1, rr(-13, -18, 24, 11, 3), '#a8e1f0', 1.4); [-20, 20].forEach(x => shape(c, p, ell(x, 18, 9, 9), INK)); });
    add('sc_mimo', (c, p) => { shape(c, p, ell(-10, -26, 6, 16, -0.2), '#fbf1df'); shape(c, p, ell(10, -26, 6, 16, 0.2), '#fbf1df'); shape(c, p, ell(0, 6, 28, 24), '#fbf1df'); if (p) { eyes(c, -9, 9, 2, 0.9); dot(c, 0, -14, 4, '#2fd0c2'); dot(c, -17, 10, 4, 'rgba(255,140,154,0.6)'); dot(c, 17, 10, 4, 'rgba(255,140,154,0.6)'); } });
    add('sc_rosa', (c, p) => { shape(c, p, ell(0, 4, 22, 22), '#efc29a'); shape(c, p, ell(0, -14, 34, 8), '#e8c57a'); shape(c, p, ell(0, -20, 16, 10), '#e8c57a'); if (p) { [-8, 8].forEach(x => { c.beginPath(); c.arc(x, 4, 5, 0, TAU); c.lineWidth = 1.6; c.strokeStyle = INK; c.stroke(); }); c.beginPath(); c.arc(0, 12, 6, 0.2, Math.PI - 0.2); c.stroke(); } });
    add('sc_bruno', (c, p) => { shape(c, p, ell(0, 2, 24, 26), '#c98e62'); shape(c, p, rr(-25, -16, 50, 9, 4), '#d64b3c'); shape(c, p, cc => { cc.moveTo(-24, -14); cc.quadraticCurveTo(0, -38, 24, -14); cc.closePath(); }, '#2e2420'); if (p) eyes(c, -9, 9, 2, 0.9); });
  })();

  // ============================================================ 3D helpers: pieces → one vertex-colored toon mesh, plus one merged ink hull
  // (each piece blown up a little in its own axes and drawn back-faced in ink, the way town.js and interiors.js do it)
  const GEO = { box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 14), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
    ball: new THREE.SphereGeometry(1, 14, 10), cone: new THREE.ConeGeometry(1, 1, 10), half: new THREE.SphereGeometry(1, 14, 8, 0, TAU, 0, Math.PI / 2) };
  const GSIZE = new Map([[GEO.box, [1, 1, 1]], [GEO.cyl, [2, 1, 2]], [GEO.cyl8, [2, 1, 2]], [GEO.ball, [2, 2, 2]], [GEO.cone, [2, 1, 2]], [GEO.half, [2, 1, 2]]]);
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  const M4 = (x, y, z, sx, sy, sz, rx, ry, rz) => new THREE.Matrix4().compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx || 0, ry || 0, rz || 0)), _s.set(sx, sy, sz));
  function Kit() {
    const P = [], H = [], GL = [];
    let F = new THREE.Matrix4();
    const k = {
      P, H, GL,
      frame(x, y, z, ry = 0) { F = M4(x, y, z, 1, 1, 1, 0, ry, 0); return k; },
      // geo at (x, y, z), scaled (sx, sy, sz), turned (rx, ry, rz); o.ink: the hull's width (0: none), o.glow: unlit (a lantern)
      add(geo, color, x, y, z, sx, sy, sz, rx, ry, rz, o = {}) {
        sy = sy === undefined ? sx : sy; sz = sz === undefined ? sx : sz;
        const m = F.clone().multiply(M4(x, y, z, sx, sy, sz, rx, ry, rz));
        (o.glow ? GL : P).push({ geo, color, m });
        const w = o.ink === undefined ? 0.016 : o.ink, g = GSIZE.get(geo);
        if (w > 0 && g) H.push({ geo, color: INK, m: F.clone().multiply(M4(x, y, z, sx + (2 * w) / g[0], sy + (2 * w) / g[1], sz + (2 * w) / g[2], rx, ry, rz)) });
        return k;
      },
      box(x, y, z, w, h, d, color, o = {}) { return k.add(GEO.box, color, x, y, z, w, h, d, o.rx, o.ry, o.rz, o); },
      cyl(x, y, z, r, h, color, o = {}) { return k.add(o.geo || GEO.cyl, color, x, y, z, r, h, r, o.rx, o.ry, o.rz, o); },
      ball(x, y, z, rx, ry, rz, color, o = {}) { return k.add(GEO.ball, color, x, y, z, rx, ry, rz, 0, o.ry, 0, o); },
    };
    return k;
  }
  // the kit → meshes in a group (one toon mesh, its hull, the glowing bits)
  function bakeInto(group, k, o = {}) {
    const out = {};
    if (k.P.length) { out.mesh = new THREE.Mesh(TK.merge(k.P), TK.toon('#ffffff', { vc: true, rim: 0.22 })); out.mesh.castShadow = !o.noShadow; out.mesh.receiveShadow = true; group.add(out.mesh); }
    if (k.H.length) { out.hull = new THREE.Mesh(TK.merge(k.H), new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide })); group.add(out.hull); }
    if (k.GL.length) { out.glow = new THREE.Mesh(TK.merge(k.GL), new THREE.MeshBasicMaterial({ vertexColors: true })); group.add(out.glow); }
    return out;
  }
  const canvasTex = (w, h, draw) => { const t = TK.canvasTex(w, h, draw); t.anisotropy = 4; return t; };
  const plane = (w, h, tex, o = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshToonMaterial({ map: tex, gradientMap: TK.grad, transparent: !!o.alpha, alphaTest: o.alpha ? 0.4 : 0, side: o.double ? THREE.DoubleSide : THREE.FrontSide }));
    m.receiveShadow = true; return m;
  };
  // vertical text on a board (a signboard, a hanging scroll): chars top to bottom, as big as they fit
  function vtext(c, chars, x, y0, y1, maxW, color, font) {
    const n = [...chars].length, step = (y1 - y0) / n, px = Math.min(maxW, step * 0.86);
    c.font = `700 ${Math.round(px)}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = color;
    [...chars].forEach((ch, i) => c.fillText(ch, x, y0 + step * (i + 0.5)));
  }
  function seal(c, x, y, s, glyph, font) {      // a red seal stamp: a square with the glyph cut out in white
    c.save(); c.translate(x, y); c.rotate(-0.06);
    c.fillStyle = RED; c.beginPath(); c.rect(-s / 2, -s / 2, s, s); c.fill();
    c.strokeStyle = '#fffaf0'; c.lineWidth = s * 0.05; c.strokeRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
    c.fillStyle = '#fffaf0'; c.font = `700 ${Math.round(s * 0.62)}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(glyph, 0, s * 0.03);
    c.restore();
  }

  // ============================================================ outside: Alba's house 09 dressed up as the school (zh / ja only)
  // The house: the 9th 'house' in TOWN.layout (interiors.js numbers them in that order). Its front faces the west street; the
  // door sits on its east side. A standing signboard by the corner (書法 / 寺子屋), a red lantern (zh) or a paper lantern and
  // a noren in the doorway (ja). Read the sign (signs.js); "Go in" at the door (story.js STORY.extra).
  let OUT = null;
  function house() {
    if (typeof TOWN === 'undefined' || !TOWN.layout) return null;
    const b = TOWN.layout.buildings.filter(q => q.kind === 'house')[8];
    if (!b) return null;
    const c = Math.cos(b.rot), s = Math.sin(b.rot), at = b.doorAt || null;
    const world = (lx, lz) => ({ x: b.x + lx * c + lz * s, z: b.z - lx * s + lz * c });
    // the door's slot along the front, in the house's own frame
    const dlx = at ? (at.x - b.x) * c - (at.z - b.z) * s : 0;
    return { b, world, dlx, front: b.d / 2, yaw: b.rot, GY: (typeof TOWN !== 'undefined' && TOWN.GY) || 0.25 };
  }
  function signTex(l) {
    return canvasTex(256, 768, c => {
      const zh = l === 'zh';
      c.fillStyle = zh ? '#c9a24a' : '#5a3a22'; c.fillRect(0, 0, 256, 768);
      c.fillStyle = zh ? '#1d1822' : '#d9b27a'; c.fillRect(16, 16, 224, 736);
      if (!zh) { c.fillStyle = 'rgba(90,58,34,0.18)'; for (let i = 0; i < 40; i++) c.fillRect(16 + (i * 53) % 224, 16, 2, 736); }
      vtext(c, zh ? '书法' : '寺子屋', 128, 50, zh ? 560 : 620, 190, zh ? '#e8c35a' : '#2b2235', FONT[l]);
      if (zh) { c.font = `700 40px ${FONT.zh}`; c.fillStyle = '#e8c35a'; c.textAlign = 'center'; c.fillText('林老师', 128, 625); }
      seal(c, 128, 700, 64, zh ? '林' : '森', FONT[l]);
    });
  }
  function norenTex() {
    return canvasTex(512, 340, c => {
      c.clearRect(0, 0, 512, 340);
      const pw = 512 / 3;
      for (let i = 0; i < 3; i++) { c.fillStyle = '#27406b'; c.fillRect(i * pw + 4, 0, pw - 8, 340); c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(i * pw + 4, 0, pw - 8, 26); }
      c.fillStyle = '#fffaf0'; c.font = `700 92px ${FONT.ja}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      ['て', 'ら', 'こ', 'や'].forEach((ch, i) => c.fillText(ch, 64 + i * 128, 190));
    });
  }
  function buildOutside(l) {
    const h = house(); if (!h || !G) return null;
    const g = new THREE.Group(); g.name = 'school-outside'; g.position.set(h.b.x, h.GY, h.b.z); g.rotation.y = h.yaw;
    G.w3d.scene.add(g);
    const F = h.front, sx = -h.b.w / 2 - 0.47, sz = F - 0.1, k = Kit(), zh = l === 'zh';
    // the signboard on two posts, with a little roof
    k.box(sx - 0.34, 1.15, sz, 0.08, 2.3, 0.08, zh ? '#3a2a2a' : '#6b4a2e').box(sx + 0.34, 1.15, sz, 0.08, 2.3, 0.08, zh ? '#3a2a2a' : '#6b4a2e');
    k.box(sx, 2.36, sz, 0.92, 0.07, 0.34, zh ? '#3a2a2a' : '#5a3a22').box(sx, 2.42, sz, 0.8, 0.06, 0.26, zh ? RED : '#4a3a2a');
    k.box(sx, 0.1, sz, 0.95, 0.2, 0.42, '#bdb5a5');
    const board = plane(0.62, 1.86, signTex(l), { double: true }); board.position.set(sx, 1.38, sz + 0.05); g.add(board);
    // a lantern under the eave, by the corner post
    const lx = h.dlx - 0.98, lz = F + 0.36;
    k.cyl(lx, 2.66, lz, 0.008, 0.3, INK, { ink: 0, geo: GEO.cyl8 });
    if (zh) {
      k.add(GEO.ball, RED, lx, 2.25, lz, 0.25, 0.3, 0.25, 0, 0, 0, { glow: true });
      k.cyl(lx, 2.53, lz, 0.13, 0.06, '#d9a03a').cyl(lx, 1.97, lz, 0.13, 0.06, '#d9a03a');
      k.add(GEO.cone, '#e8c35a', lx, 1.8, lz, 0.05, 0.22, 0.05, Math.PI, 0, 0, { ink: 0 });
    } else {
      k.add(GEO.ball, '#fbf3e2', lx, 2.22, lz, 0.2, 0.32, 0.2, 0, 0, 0, { glow: true });
      k.cyl(lx, 2.52, lz, 0.12, 0.06, INK).cyl(lx, 1.92, lz, 0.12, 0.06, INK);
      for (const y of [2.08, 2.36]) k.cyl(lx, y, lz, 0.2, 0.025, RED, { ink: 0 });
      // the noren in the doorway: a rod, and three indigo panels with てらこや on them
      k.cyl(h.dlx, 2.63, F + 0.2, 0.025, 1.3, '#6b4a2e', { rz: HALF, ink: 0.008 });
      const nr = plane(1.12, 0.74, norenTex(), { alpha: true, double: true }); nr.position.set(h.dlx, 2.24, F + 0.2); g.add(nr);
    }
    const baked = bakeInto(g, k);
    const W = (lx2, lz2) => h.world(lx2, lz2);
    return { g, l, baked, sign: W(sx, sz + 1.0), signSolid: W(sx, sz), door: W(h.dlx, F + 0.55), doorIn: W(h.dlx, F + 0.2), lantern: W(lx, lz), h };
  }
  const SOLID = { x: 1e5, z: 1e5, r: 0.5, school: true };       // the signboard's solid (in WORLD.extra; parked far off outside zh / ja)
  function outdoor() {
    if (!G) return;
    const want = isOn();
    if (want && (!OUT || OUT.l !== L())) {
      if (OUT) { G.w3d.scene.remove(OUT.g); OUT = null; }
      try { OUT = buildOutside(L()); } catch (e) { console.error('[school]', e); OUT = { g: new THREE.Group(), l: L(), broken: true }; }
    }
    if (want && !OUT) OUT = { l: L(), broken: true };      // (no town to dress up: a test page)
    const town = G.town && G.town.group;
    const vis = want && !!OUT && !OUT.broken && !(G.indoors && G.indoors()) && (!town || town.visible);
    if (OUT && OUT.g) OUT.g.visible = vis;
    if (!WORLD.extra.includes(SOLID)) WORLD.extra.push(SOLID);
    if (vis && OUT.signSolid) { SOLID.x = OUT.signSolid.x; SOLID.z = OUT.signSolid.z; } else { SOLID.x = SOLID.z = 1e5; }
  }

  // ============================================================ the room (floats at X0, Y0, Z0 like the other rooms; built on the first visit)
  // zh: dark planks and a red rug, cream walls over a wooden dado, the character wall (north), Teacher Lin behind his long
  // writing table (brushes, an ink stone, paper), two red lanterns, two hanging scrolls, bamboo in pots, a tea table, the
  // practice desk. ja: tatami, white plaster between dark posts, shoji on the side walls, the kana chart (north), Mori-sensei
  // at her desk, four low desks with cushions, a paper floor lamp, two hanging scrolls. Walls face inward (a dollhouse).
  let ROOM = null;
  const P0 = (x, z) => ({ x: X0 + x, z: Z0 + z });
  const SPOT = { teacher: { x: 0, z: -3.15 }, spawn: { x: 0, z: HD - 1.25 }, exit: { x: 0, z: HD - 0.5 }, chart: { x: 2.7, z: -3.7 },
    scrollW: { x: -HW + 1.0, z: -0.6 }, scrollE: { x: HW - 1.0, z: -0.6 }, practice: { zh: { x: 4.3, z: 1.9 }, ja: { x: 2.25, z: 0.55 } } };
  function floorTex(l) {
    if (l === 'ja') return canvasTex(512, 512, c => {         // tatami (1 : 2 mats, 3.6 units a tile), pairs turned each way, dark cloth edges
      const mats = [[0, 0, 256, 128], [0, 128, 256, 128], [256, 0, 128, 256], [384, 0, 128, 256], [0, 256, 128, 256], [128, 256, 128, 256], [256, 256, 256, 128], [256, 384, 256, 128]];
      for (const [x, y, w, h] of mats) {
        c.fillStyle = '#cbbd7c'; c.fillRect(x, y, w, h);
        c.strokeStyle = 'rgba(120,110,50,0.22)'; c.lineWidth = 1.2;
        const horiz = w > h;
        for (let i = 4; i < (horiz ? h : w); i += 6) { c.beginPath(); if (horiz) { c.moveTo(x, y + i); c.lineTo(x + w, y + i); } else { c.moveTo(x + i, y); c.lineTo(x + i, y + h); } c.stroke(); }
        c.fillStyle = '#2f4a32'; if (horiz) { c.fillRect(x, y, w, 9); c.fillRect(x, y + h - 9, w, 9); } else { c.fillRect(x, y, 9, h); c.fillRect(x + w - 9, y, 9, h); }
      }
    });
    return canvasTex(512, 512, c => {                       // dark planks
      for (let i = 0; i < 8; i++) {
        c.fillStyle = ['#6e4a32', '#77503a', '#6a462f', '#7b5640'][i % 4]; c.fillRect(0, i * 64, 512, 64);
        c.fillStyle = 'rgba(30,18,10,0.35)'; c.fillRect(0, i * 64, 512, 3);
        c.fillStyle = 'rgba(30,18,10,0.12)'; for (let j = 0; j < 9; j++) c.fillRect((j * 97 + i * 41) % 512, i * 64 + 10 + (j % 5) * 9, 60 + (j % 3) * 30, 2);
        c.fillStyle = 'rgba(30,18,10,0.3)'; c.fillRect(((i * 173) % 400) + 40, i * 64, 3, 64);
      }
    });
  }
  function wallTex(l) {
    return canvasTex(256, 256, c => {
      c.fillStyle = l === 'ja' ? '#f1ece0' : '#f3e6cf'; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(120,100,70,${0.03 + (i % 5) * 0.012})`; c.fillRect((i * 37) % 256, (i * 91) % 256, 2 + (i % 3), 2); }
    });
  }
  function shojiTex() {
    return canvasTex(256, 384, c => {
      c.fillStyle = '#fbf8f0'; c.fillRect(0, 0, 256, 384);
      c.fillStyle = 'rgba(200,180,130,0.18)'; c.fillRect(0, 0, 256, 384);
      c.fillStyle = '#5a3a22'; c.fillRect(0, 0, 256, 10); c.fillRect(0, 374, 256, 10); c.fillRect(0, 0, 10, 384); c.fillRect(246, 0, 10, 384);
      for (let i = 1; i < 4; i++) c.fillRect(i * 64 - 3, 0, 6, 384);
      for (let j = 1; j < 6; j++) c.fillRect(0, j * 64 - 3, 256, 6);
    });
  }
  // a hanging scroll: a silk mounting, the paper, the words top to bottom, a red seal
  function scrollTex(text, l, silk) {
    return canvasTex(256, 800, c => {
      c.fillStyle = silk; c.fillRect(0, 0, 256, 800);
      c.fillStyle = 'rgba(255,255,255,0.12)'; for (let y = 0; y < 800; y += 6) c.fillRect(0, y, 256, 2);
      c.fillStyle = '#f6efdc'; c.fillRect(30, 70, 196, 640);
      vtext(c, text, 128, 95, 640, 150, INK, FONT[l]);
      seal(c, 170, 680, 34, l === 'zh' ? '林' : '森', FONT[l]);
    });
  }
  function buildRoom(l) {
    const g = new THREE.Group(); g.name = 'school-room'; g.position.set(X0, Y0, Z0); g.visible = false; G.w3d.scene.add(g);
    const zh = l === 'zh', k = Kit(), solids = [];
    // floor and walls
    const ft = floorTex(l); ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(zh ? 3 : (2 * HW) / 3.6, zh ? 2.4 : (2 * HD) / 3.6);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(2 * HW, 0.3, 2 * HD), new THREE.MeshToonMaterial({ map: ft, gradientMap: TK.grad }));
    floor.position.y = -0.15; floor.receiveShadow = true; g.add(floor);
    const wt = wallTex(l), wm = new THREE.MeshToonMaterial({ map: wt, gradientMap: TK.grad });
    for (const [w, x, z, ry] of [[2 * HW, 0, -HD, 0], [2 * HW, 0, HD, Math.PI], [2 * HD, -HW, 0, HALF], [2 * HD, HW, 0, -HALF]]) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), wm); m.position.set(x, WH / 2, z); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    }
    solids.push({ obox: 1, x: 0, z: -HD - 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 }, { obox: 1, x: 0, z: HD + 0.3, hw: HW + 0.3, hd: 0.3, rot: 0 },
      { obox: 1, x: -HW - 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 }, { obox: 1, x: HW + 0.3, z: 0, hw: 0.3, hd: HD, rot: 0 });
    const WOOD = zh ? '#4a3228' : '#4f3524', WOOD2 = zh ? '#6b4a36' : '#7a5636';
    // posts in the corners and along the walls, a beam along the top
    for (const [x, z] of [[-HW, -HD], [HW, -HD], [-HW, HD], [HW, HD], [-HW, 0], [HW, 0], [-2.6, -HD], [2.6, -HD]]) k.box(x + (x < 0 ? 0.09 : -0.09), WH / 2, z + (z < 0 ? 0.09 : z > 0 ? -0.09 : 0), 0.2, WH, 0.2, WOOD);
    k.box(0, WH - 0.1, -HD + 0.07, 2 * HW, 0.2, 0.14, WOOD).box(-HW + 0.07, WH - 0.1, 0, 0.14, 0.2, 2 * HD, WOOD).box(HW - 0.07, WH - 0.1, 0, 0.14, 0.2, 2 * HD, WOOD);
    if (zh) {     // a wooden dado with a red line, all round (not the south wall: the camera looks in from there)
      k.box(0, 0.45, -HD + 0.03, 2 * HW, 0.9, 0.05, WOOD2, { ink: 0 }).box(-HW + 0.03, 0.45, 0, 0.05, 0.9, 2 * HD, WOOD2, { ink: 0 }).box(HW - 0.03, 0.45, 0, 0.05, 0.9, 2 * HD, WOOD2, { ink: 0 });
      k.box(0, 0.92, -HD + 0.06, 2 * HW, 0.05, 0.05, RED, { ink: 0 }).box(-HW + 0.06, 0.92, 0, 0.05, 0.05, 2 * HD, RED, { ink: 0 }).box(HW - 0.06, 0.92, 0, 0.05, 0.05, 2 * HD, RED, { ink: 0 });
    } else {      // the nageshi beam, and shoji panels along the side walls
      k.box(0, 2.75, -HD + 0.06, 2 * HW, 0.12, 0.1, WOOD).box(-HW + 0.06, 2.75, 0, 0.1, 0.12, 2 * HD, WOOD).box(HW - 0.06, 2.75, 0, 0.1, 0.12, 2 * HD, WOOD);
      const st = shojiTex();
      for (const side of [-1, 1]) for (const z of [-2.6, 2.6]) { if (side > 0 && z < 0) continue; const m = plane(1.6, 2.4, st); m.position.set(side * (HW - 0.04), 1.3, z); m.rotation.y = side < 0 ? HALF : -HALF; g.add(m); }
    }
    // the chart on the north wall (redrawn as you learn)
    const chartCv = document.createElement('canvas'); chartCv.width = 1024; chartCv.height = 512;
    const chartTex = new THREE.CanvasTexture(chartCv); chartTex.anisotropy = 4;
    const chart = plane(4.6, 2.3, chartTex); chart.position.set(0, 2.35, -HD + 0.04); g.add(chart);
    k.box(0, 2.35, -HD + 0.025, 4.78, 2.48, 0.03, WOOD);
    // the scrolls
    const scW = plane(0.62, 1.94, scrollTex(zh ? '学而时习之' : '七転び八起き', l, zh ? '#3a5a7a' : '#6b4a6e')); scW.position.set(-HW + 0.04, 2.05, -0.6); scW.rotation.y = HALF; g.add(scW);
    const scE = plane(0.62, 1.94, scrollTex(zh ? '熟能生巧' : '一期一会', l, zh ? '#7a3a3a' : '#3a5a4e')); scE.position.set(HW - 0.04, 2.05, -0.6); scE.rotation.y = -HALF; g.add(scE);
    for (const x of [-HW + 0.07, HW - 0.07]) { k.box(x, 1.06, -0.6, 0.06, 0.06, 0.74, WOOD); k.box(x, 3.04, -0.6, 0.05, 0.05, 0.7, WOOD); }
    // the teacher's desk, and what's on it
    const T = SPOT.teacher;
    if (zh) {
      k.box(0, 0.76, -2.3, 3.0, 0.07, 0.8, WOOD2);
      for (const [x, z] of [[-1.38, -2.62], [1.38, -2.62], [-1.38, -1.98], [1.38, -1.98]]) k.box(x, 0.37, z, 0.08, 0.74, 0.08, WOOD);
      k.box(0, 0.8, -2.3, 2.5, 0.012, 0.62, '#3c4a48', { ink: 0 });                          // the felt
      k.box(-0.35, 0.81, -2.25, 0.62, 0.006, 0.44, '#fbf7ec', { ink: 0 }).box(0.38, 0.81, -2.28, 0.62, 0.006, 0.44, '#fbf7ec', { ink: 0 });
      k.box(1.05, 0.83, -2.3, 0.26, 0.05, 0.36, '#1d1822').box(1.05, 0.856, -2.4, 0.16, 0.01, 0.1, '#2f2a3a', { ink: 0 });     // the ink stone
      k.box(-1.0, 0.83, -2.42, 0.4, 0.04, 0.12, WOOD);                                       // the brush rest, three brushes
      for (let i = 0; i < 3; i++) { const x = -1.12 + i * 0.12; k.cyl(x, 0.95, -2.42, 0.012, 0.22, '#c9a86a', { ink: 0.006 }).add(GEO.cone, '#1d1822', x, 0.81, -2.42, 0.02, 0.07, 0.02, Math.PI, 0, 0, { ink: 0 }); }
      k.cyl(-1.0, 0.9, -2.1, 0.06, 0.16, '#3a5a7a');                                         // a brush pot
      for (let i = 0; i < 3; i++) k.cyl(-1.02 + i * 0.03, 1.05, -2.1 + (i - 1) * 0.02, 0.01, 0.26, '#c9a86a', { ink: 0, rz: (i - 1) * 0.15 });
      k.box(0.7, 0.84, -2.05, 0.1, 0.07, 0.1, RED);                                          // the seal box
      solids.push({ obox: 1, x: 0, z: -2.3, hw: 1.55, hd: 0.45, rot: 0 });
    } else {
      k.box(0, 0.42, -2.45, 1.6, 0.06, 0.62, WOOD2);
      for (const [x, z] of [[-0.72, -2.7], [0.72, -2.7], [-0.72, -2.2], [0.72, -2.2]]) k.box(x, 0.2, z, 0.08, 0.4, 0.08, WOOD);
      k.box(-0.3, 0.46, -2.42, 0.5, 0.006, 0.36, '#fbf7ec', { ink: 0 }).box(0.38, 0.47, -2.45, 0.24, 0.04, 0.32, '#1d1822');
      k.box(0.25, 0.48, -2.25, 0.36, 0.05, 0.26, '#a0412f').box(0.25, 0.51, -2.25, 0.34, 0.012, 0.24, '#f6efdc', { ink: 0 });   // a book
      k.cyl(-0.6, 0.51, -2.6, 0.05, 0.12, '#6b4a6e');
      for (let i = 0; i < 2; i++) k.cyl(-0.61 + i * 0.03, 0.62, -2.6, 0.009, 0.22, '#c9a86a', { ink: 0, rz: (i - 0.5) * 0.2 });
      k.box(0, 0.04, -1.6, 0.6, 0.08, 0.6, '#5a3a6e');                                       // a cushion for you
      solids.push({ obox: 1, x: 0, z: -2.45, hw: 0.85, hd: 0.36, rot: 0 });
      // four low desks with cushions, for the children (one is the practice desk)
      for (const x of [-2.25, 2.25]) for (const z of [-0.2, 1.6]) {
        k.box(x, 0.32, z, 0.95, 0.05, 0.45, WOOD2);
        for (const sx of [-0.4, 0.4]) k.box(x + sx, 0.15, z, 0.06, 0.3, 0.4, WOOD);
        k.box(x, 0.04, z + 0.55, 0.55, 0.08, 0.55, ['#3a4f8a', '#8a3a4a', '#4f7a4a', '#7a5a2a'][(x > 0) * 2 + (z > 0)], { ink: 0.01 });
        k.box(x - 0.15, 0.36, z, 0.36, 0.006, 0.26, '#fbf7ec', { ink: 0 });
        solids.push({ obox: 1, x, z, hw: 0.52, hd: 0.27, rot: 0 });
      }
    }
    solids.push({ x: T.x, z: T.z, r: 0.45 });
    // zh: a red rug, two red lanterns, bamboo, a tea table, a shelf, the practice desk. ja: a paper floor lamp, plants.
    const glows = [];
    if (zh) {
      k.box(0, 0.006, 0.6, 4.2, 0.012, 3.0, '#8a2a2a', { ink: 0 }).box(0, 0.012, 0.6, 3.8, 0.012, 2.6, '#a8443a', { ink: 0 });
      for (const x of [-3.1, 3.1]) {
        k.cyl(x, 3.75, -1.0, 0.008, 0.6, INK, { ink: 0, geo: GEO.cyl8 });
        k.add(GEO.ball, RED, x, 3.15, -1.0, 0.32, 0.38, 0.32, 0, 0, 0, { glow: true });
        k.cyl(x, 3.5, -1.0, 0.17, 0.07, '#d9a03a').cyl(x, 2.8, -1.0, 0.17, 0.07, '#d9a03a');
        k.add(GEO.cone, '#e8c35a', x, 2.6, -1.0, 0.06, 0.3, 0.06, Math.PI, 0, 0, { ink: 0 });
        glows.push({ x, y: 3.15, z: -1.0, c: '#ff9a5a', s: 2.4 });
      }
      for (const [x, z] of [[-HW + 0.6, -HD + 0.6], [HW - 0.6, HD - 0.7], [-HW + 0.6, HD - 0.7]]) {
        k.cyl(x, 0.22, z, 0.26, 0.44, '#2f4a5a');
        for (let i = 0; i < 4; i++) { const ox = Math.cos(i * 1.7) * 0.1, oz = Math.sin(i * 1.7) * 0.1, h = 1.6 + i * 0.25; k.cyl(x + ox, 0.4 + h / 2, z + oz, 0.025, h, '#6a9a3a', { ink: 0.006 }); k.ball(x + ox + 0.12, 0.45 + h, z + oz, 0.22, 0.05, 0.08, '#5a8a3a', { ink: 0.006, ry: i }); k.ball(x + ox - 0.1, 0.2 + h * 0.8, z + oz, 0.2, 0.04, 0.07, '#5a8a3a', { ink: 0.006, ry: -i }); }
        solids.push({ x, z, r: 0.36 });
      }
      const tx = -4.4, tz = 2.4;           // the tea table
      k.cyl(tx, 0.55, tz, 0.5, 0.06, WOOD2).cyl(tx, 0.27, tz, 0.07, 0.54, WOOD);
      k.ball(tx, 0.7, tz, 0.13, 0.1, 0.13, '#3f6f8a').cyl(tx + 0.15, 0.72, tz, 0.02, 0.12, '#3f6f8a', { rz: -0.9 });
      for (const a of [0, 2, 4]) k.cyl(tx + Math.cos(a) * 0.3, 0.63, tz + Math.sin(a) * 0.3, 0.04, 0.06, '#f4efe4');
      solids.push({ x: tx, z: tz, r: 0.6 });
      const bx = HW - 0.32;              // a shelf of books and scroll boxes (east wall, by the door)
      k.box(bx, 1.0, 2.6, 0.5, 2.0, 1.4, WOOD).box(bx - 0.03, 1.0, 2.6, 0.44, 1.9, 1.3, '#3a2620', { ink: 0 });
      for (let s = 0; s < 3; s++) for (let i = 0; i < 6; i++) k.box(bx - 0.05, 0.35 + s * 0.62, 2.05 + i * 0.2, 0.3, 0.42 - (i % 3) * 0.05, 0.14, ['#3f6f8a', '#a8443a', '#d9b27a', '#4f7a4a', '#2b2235', '#c9a24a'][(i + s) % 6], { ink: 0.006 });
      solids.push({ obox: 1, x: bx, z: 2.6, hw: 0.3, hd: 0.72, rot: 0 });
      const P = SPOT.practice.zh;        // the practice desk: paper held down by a weight, a brush, an ink stone
      k.box(P.x, 0.62, P.z - 0.5, 1.2, 0.06, 0.6, WOOD2);
      for (const [x, z] of [[-0.52, -0.24], [0.52, -0.24], [-0.52, 0.24], [0.52, 0.24]]) k.box(P.x + x, 0.3, P.z - 0.5 + z, 0.06, 0.6, 0.06, WOOD);
      k.box(P.x - 0.1, 0.656, P.z - 0.5, 0.56, 0.006, 0.4, '#fbf7ec', { ink: 0 }).box(P.x - 0.1, 0.67, P.z - 0.68, 0.5, 0.03, 0.04, '#2b2235').box(P.x + 0.42, 0.67, P.z - 0.5, 0.16, 0.04, 0.22, '#1d1822');
      k.cyl(P.x + 0.25, 0.672, P.z - 0.35, 0.012, 0.24, '#c9a86a', { rz: HALF, ink: 0.006 });
      solids.push({ obox: 1, x: P.x, z: P.z - 0.5, hw: 0.65, hd: 0.34, rot: 0 });
    } else {
      const ax = -HW + 0.6, az = -HD + 0.6;      // an andon: a paper floor lamp
      k.box(ax, 0.05, az, 0.5, 0.1, 0.5, WOOD);
      k.add(GEO.box, '#fbf3e2', ax, 0.62, az, 0.4, 0.9, 0.4, 0, 0, 0, { glow: true });
      for (const [x, z] of [[-0.21, -0.21], [0.21, -0.21], [-0.21, 0.21], [0.21, 0.21]]) k.box(ax + x, 0.6, az + z, 0.04, 1.1, 0.04, WOOD);
      glows.push({ x: ax, y: 0.7, z: az, c: '#ffd59a', s: 2.2 });
      solids.push({ x: ax, z: az, r: 0.4 });
      for (const [x, z] of [[HW - 0.6, -HD + 0.6], [HW - 0.6, HD - 0.7], [-HW + 0.6, HD - 0.7]]) {
        k.cyl(x, 0.2, z, 0.24, 0.4, '#3a4a3a');
        k.ball(x, 0.65, z, 0.36, 0.3, 0.36, '#4f7a3a', { ink: 0.01 }).ball(x + 0.1, 0.9, z - 0.05, 0.24, 0.2, 0.24, '#5a8a42', { ink: 0.01 });
        solids.push({ x, z, r: 0.34 });
      }
      k.box(0, 0.006, HD - 0.7, 1.8, 0.012, 1.0, '#8a7a5a', { ink: 0 });     // the genkan, where shoes come off
    }
    // the doormat on the way out
    if (zh) k.box(0, 0.016, HD - 0.55, 1.6, 0.02, 0.8, '#5a3a2a', { ink: 0 });
    const baked = bakeInto(g, k);
    const glowMat = c => new THREE.SpriteMaterial({ map: TK.glowTex, color: c, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending });
    const sprites = glows.map(q => { const s = new THREE.Sprite(glowMat(q.c)); s.scale.setScalar(q.s); s.position.set(q.x, q.y, q.z); g.add(s); return s; });
    // solids and the floor (world coordinates)
    WORLD.addSolids(solids.map(s => Object.assign({}, s, { x: X0 + s.x, z: Z0 + s.z, school: true })));
    WORLD.addPlatforms([{ box: [X0 - HW, X0 + HW, Z0 - HD, Z0 + HD], top: Y0, school: true }]);
    const room = { g, l, baked, chartCv, chartTex, sprites, teacher: makeTeacher(l, g) };
    ROOM = room;
    drawChart();
    return room;
  }

  // ============================================================ the teachers (ACTORS' villagers, dressed)
  function makeTeacher(l, parent) {
    const P = ACTORS.PRESETS, key = l === 'ja' ? 'sc_mori' : 'sc_lin';
    if (!P.sc_lin) P.sc_lin = { dress: '#2f4a6e', apron: null, skin: '#efc29a', hair: '#ece8e0', hat: null, glasses: true, bun: true, eyes: 'happy', h: 1.02 };
    if (!P.sc_mori) P.sc_mori = { dress: '#34508a', apron: null, skin: '#f5cda2', hair: '#2a2220', hat: null, glasses: false, bun: true, eyes: 'open', h: 0.98 };
    const v = ACTORS.villager(key), part = TK.part, Gk = TK.G;
    if (l === 'ja') {
      v.body.add(part(Gk.cyl, '#c8322a', [0, 0.52, 0], [0.335, 0.16, 0.335], { ink: 0.012 }));                  // the obi
      v.body.add(part(Gk.box, '#c8322a', [0, 0.55, -0.34], [0.34, 0.2, 0.1], { ink: 0.012 }));                  // its bow
      for (const s of [-1, 1]) v.body.add(part(Gk.box, '#fbf6ee', [s * 0.07, 0.83, 0.17], [0.05, 0.3, 0.04], { rot: [0.25, 0, s * 0.55], ink: 0.008 }));   // the collar
      v.head.add(part(Gk.cyl, '#d9a03a', [0.02, 0.44, -0.2], [0.012, 0.36, 0.012], { rot: [0, 0, 1.2], ink: 0.006 }));   // a hairpin
    } else {
      v.head.add(part(new THREE.ConeGeometry(0.13, 0.42, 10), '#ece8e0', [0, -0.08, 0.2], null, { rot: [Math.PI + 0.25, 0, 0], ink: 0.012 }));   // the beard
      for (const s of [-1, 1]) v.head.add(part(Gk.sphere, '#ece8e0', [s * 0.07, 0.1, 0.26], [0.08, 0.025, 0.03], { rot: [0, 0, s * 0.3], ink: 0 }));
      for (const s of [-1, 1]) v.head.add(part(Gk.box, '#ece8e0', [s * 0.1, 0.29, 0.25], [0.09, 0.02, 0.02], { rot: [0, 0, -s * 0.2], ink: 0 }));
      v.head.add(part(new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2), '#1d1822', [0, 0.3, -0.02], [0.27, 0.16, 0.27], { ink: 0.01 }));   // the skullcap
      v.head.add(part(Gk.sphere, '#c8322a', [0, 0.47, -0.02], [0.04, 0.04, 0.04], { ink: 0.006 }));
      v.body.add(part(Gk.box, '#1d1822', [0, 0.3, 0.3], [0.08, 0.5, 0.02], { ink: 0 }));                         // the robe's dark front
    }
    // a brush in the right hand
    const arm = v.arms[0], brush = new THREE.Group(); brush.position.set(0, -0.32, 0.04); arm.add(brush);
    brush.add(part(Gk.cyl, '#c9a86a', [0, 0.06, 0], [0.018, 0.26, 0.018], { ink: 0.006 }));
    brush.add(part(new THREE.ConeGeometry(0.03, 0.09, 8), '#1d1822', [0, -0.12, 0], null, { rot: [Math.PI, 0, 0], ink: 0 }));
    const T = SPOT.teacher, st = { x: X0 + T.x, z: Z0 + T.z, y: Y0, yaw: 0, baseYaw: 0, talk: 0, wave: false, talking: false, top: 2.1 };
    v.root.position.set(T.x, 0, T.z); parent.add(v.root);
    v.root.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return { v, st, brush, waved: false };
  }
  function animateTeacher(dt, t) {
    if (!ROOM) return;
    const { v, st } = ROOM.teacher, Y = G.sim.you, dx = Y.x - st.x, dz = Y.z - st.z, d = Math.hypot(dx, dz);
    const goal = d < 7 ? Math.atan2(dx, dz) : st.baseYaw;
    st.yaw = dampAngle(st.yaw, goal, 4, dt);
    st.talk = damp(st.talk, st.talking ? 1 : 0, 10, dt);
    if (d < 4.5 && !ROOM.teacher.waved) { ROOM.teacher.waved = true; st.waveT = 1.4; }
    if (d > 7) ROOM.teacher.waved = false;
    st.waveT = Math.max(0, (st.waveT || 0) - dt);
    ACTORS.animateVillager(v, { x: st.x - X0, y: 0, z: st.z - Z0, yaw: st.yaw, talk: st.talk, wave: st.waveT > 0, walking: false }, dt, t);
    if (!st.waveT) { const a = v.arms[0]; a.rotation.set(-0.9 + Math.sin(t * 1.3) * 0.08, 0, 0.25); }      // holding the brush up a little
  }

  // ============================================================ Mimo's brush hat (the reward for lesson 4 / 5)
  let HAT = null;
  function hat() {
    if (HAT || !G || !G.cast || !G.cast.mimo) return HAT;
    const h = new THREE.Group(); h.position.set(0, 0.6, -0.02); h.rotation.set(-0.18, 0, 0.1);
    const part = TK.part, Gk = TK.G;
    h.add(part(new THREE.SphereGeometry(1, 16, 8, 0, TAU, 0, Math.PI / 2), '#1d1822', [0, 0, 0], [0.19, 0.12, 0.19], { ink: 0.01 }));
    h.add(part(Gk.cyl, '#c8322a', [0, 0.012, 0], [0.195, 0.03, 0.195], { ink: 0 }));
    const b = new THREE.Group(); b.position.set(0.06, 0.08, -0.02); b.rotation.set(0.15, 0, -0.45); h.add(b);
    b.add(part(Gk.cyl, '#c9a86a', [0, 0.16, 0], [0.022, 0.32, 0.022], { ink: 0.008 }));
    b.add(part(new THREE.ConeGeometry(0.04, 0.12, 8), '#1d1822', [0, 0.37, 0], null, { ink: 0.008 }));
    b.add(part(Gk.sphere, '#c8322a', [0, 0.0, 0], [0.035, 0.035, 0.035], { ink: 0 }));
    h.visible = false; G.cast.mimo.body.add(h); HAT = h;
    return h;
  }
  const hatOn = () => !!(G && G.state && isOn() && G.state.school && G.state.school.hat && G.state.school.hatOn);

  // ============================================================ the chart on the north wall: what you've learned, in ink
  const KANA_ROWS = ['あいうえお', 'かきくけこ', 'さしすせそ', 'たちつてと', 'なにぬねの', 'はひふへほ', 'まみむめも', 'や・ゆ・よ', 'らりるれろ', 'わ・・・を', 'ん・・・・'];
  const known = c => typeof CJK !== 'undefined' && CJK.known(c, L());
  function drawChart() {
    if (!ROOM || !ROOM.chartCv) return;
    const c = ROOM.chartCv.getContext('2d'), l = ROOM.l, W = 1024, H = 512;
    c.fillStyle = '#f6efdc'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#c8322a'; c.lineWidth = 6; c.strokeRect(12, 12, W - 24, H - 24);
    c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
    if (l === 'zh') {
      const all = ZH.flatMap(Ls => Ls.items.map(it => it.c)), cols = 9, cw = (W - 80) / cols, ch = (H - 130) / 3;
      c.font = `700 46px ${FONT.zh}`; c.fillText('汉字', W / 2, 52);
      all.forEach((x, i) => {
        const cx = 40 + cw * ((i % cols) + 0.5), cy = 110 + ch * (Math.floor(i / cols) + 0.5), on = known(x);
        c.font = `700 ${Math.round(ch * 0.66)}px ${FONT.zh}`; c.fillStyle = on ? INK : 'rgba(43,34,53,0.13)'; c.fillText(x, cx, cy);
        if (on) seal(c, cx + cw * 0.34, cy + ch * 0.3, 20, '✓', 'sans-serif');
      });
    } else {
      c.font = `700 40px ${FONT.ja}`; c.fillText('ひらがな', 230, 46); c.fillText('カタカナ ・ 漢字', 790, 46);
      const cw = 52, rh = 62;
      KANA_ROWS.forEach((row, ci) => [...row].forEach((x, ri) => {
        if (x === '・') return;
        const cx = 40 + cw * (ci + 0.5), cy = 100 + rh * (ri + 0.5);
        c.font = `700 44px ${FONT.ja}`; c.fillStyle = known(x) ? INK : 'rgba(43,34,53,0.13)'; c.fillText(x, cx, cy);
      }));
      const more = 'アミモノロサルンブパ'.split('').concat('木林森人休日月明山川'.split(''));
      more.forEach((x, i) => {
        const cx = 640 + 66 * ((i % 5) + 0.5), cy = 110 + 76 * (Math.floor(i / 5) + 0.5);
        c.font = `700 52px ${FONT.ja}`; c.fillStyle = known(x) ? INK : 'rgba(43,34,53,0.13)'; c.fillText(x, cx, cy);
      });
    }
    const n = LESSONS().filter(Ls => S().done[Ls.id]).length;
    c.font = '700 22px "Segoe UI", sans-serif'; c.fillStyle = 'rgba(43,34,53,0.6)'; c.textAlign = 'right'; c.fillText(`${n} / ${LESSONS().length} lessons`, W - 36, H - 34);
    ROOM.chartTex.needsUpdate = true;
  }

  // ============================================================ the lesson panel (HTML on top of the room)
  const esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  let PANEL = null, KEYH = null, RUN = null;
  function css() {
    if (document.getElementById('sc-css')) return;
    const s = document.createElement('style'); s.id = 'sc-css';
    s.textContent = `
      #sc-panel { position: fixed; inset: 0; z-index: 30; display: flex; align-items: center; justify-content: center; background: rgba(30,20,40,.30); }
      #sc-panel.sc-hidden { display: none; }
      #sc-panel .sc-card { width: min(800px, calc(100vw - 24px)); max-height: calc(100vh - 24px); overflow-y: auto; box-sizing: border-box; background: ${PAPER}; color: ${INK};
        border: 3px solid ${INK}; border-radius: 18px; box-shadow: 0 8px 0 rgba(43,34,53,.25); padding: 12px 20px 12px; font: 600 16px "Segoe UI", system-ui, sans-serif; }
      #sc-panel .sc-head { display: flex; align-items: center; gap: 10px; }
      #sc-panel .sc-seal { flex: 0 0 auto; width: 34px; height: 34px; background: ${RED}; color: ${PAPER}; border-radius: 6px; display: grid; place-items: center; font-size: 21px; transform: rotate(-4deg); }
      #sc-panel .sc-title { flex: 1; font: 800 20px Bahnschrift, "Segoe UI", sans-serif; }
      #sc-panel .sc-title small { font: 600 13px "Segoe UI", sans-serif; opacity: .6; margin-left: 8px; }
      #sc-panel .sc-dots i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 2px solid ${INK}; margin-left: 4px; }
      #sc-panel .sc-dots i.on { background: #f2c14e; } #sc-panel .sc-dots i.done { background: ${INK}; }
      #sc-panel .sc-x { flex: 0 0 auto; width: 32px; height: 32px; border-radius: 50%; border: 2.5px solid ${INK}; background: #fff; cursor: pointer; font: 800 14px "Segoe UI"; }
      #sc-panel .sc-say { margin: 8px 0 4px; padding: 6px 12px; background: #f3eadb; border-radius: 12px; min-height: 28px; line-height: 1.5; }
      #sc-panel .sc-say .who { font: 800 13px "Segoe UI", sans-serif; opacity: .6; margin-right: 8px; }
      #sc-panel .sc-say .en { font: italic 600 14px "Segoe UI", sans-serif; opacity: .72; margin-left: 10px; }
      #sc-panel .sc-say:not(.en-on) .en { display: none; } #sc-panel .sc-say.en-only .en { margin-left: 0; }
      #sc-panel .sc-say .sc-enb { float: right; margin-left: 8px; font: 800 11px "Segoe UI", sans-serif; border: 2px solid ${INK}; border-radius: 8px; background: #fff; color: ${INK}; padding: 0 6px; cursor: pointer; }
      #sc-panel .sc-say.en-on .sc-enb { background: #f2c14e; }
      #sc-panel .sc-say .cjk { font-size: 19px; }
      #sc-panel .sc-body { min-height: 250px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 8px 0 6px; text-align: center; }
      #sc-panel .sc-q { font: 700 18px "Segoe UI", sans-serif; }
      #sc-panel .sc-q small { display: block; font-weight: 600; font-size: 14px; opacity: .65; margin-top: 2px; }
      #sc-panel .sc-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; font-size: 13px; opacity: .85; min-height: 30px; }
      #sc-panel .sc-zh { font-family: ${FONT.zh}; font-weight: 400; } #sc-panel .sc-ja { font-family: ${FONT.ja}; font-weight: 600; }
      #sc-panel .sc-grid { position: relative; width: 170px; height: 170px; flex: 0 0 auto; border: 3px solid ${RED}; background: #fffdf6; display: grid; place-items: center; box-sizing: border-box;
        background-image: linear-gradient(to right, transparent calc(50% - 1px), rgba(200,50,42,.35) calc(50% - 1px), rgba(200,50,42,.35) calc(50% + 1px), transparent calc(50% + 1px)),
          linear-gradient(to bottom, transparent calc(50% - 1px), rgba(200,50,42,.35) calc(50% - 1px), rgba(200,50,42,.35) calc(50% + 1px), transparent calc(50% + 1px)),
          linear-gradient(45deg, transparent calc(50% - 1px), rgba(200,50,42,.18) 50%, transparent calc(50% + 1px)), linear-gradient(-45deg, transparent calc(50% - 1px), rgba(200,50,42,.18) 50%, transparent calc(50% + 1px)); }
      #sc-panel .sc-grid.sm { width: 92px; height: 92px; } #sc-panel .sc-grid.sm .sc-big { font-size: 66px; }
      #sc-panel .sc-big { font-size: 128px; line-height: 1; }
      #sc-panel .sc-row { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
      #sc-panel .sc-info { text-align: left; max-width: 380px; }
      #sc-panel .sc-read { font: 800 30px Bahnschrift, "Segoe UI", sans-serif; color: ${RED}; }
      #sc-panel .sc-mean { font: 700 20px "Segoe UI", sans-serif; display: flex; align-items: center; gap: 8px; }
      #sc-panel .sc-hint { font: 600 15px/1.4 "Segoe UI", sans-serif; opacity: .8; margin-top: 6px; }
      #sc-panel .sc-parts { display: flex; gap: 6px; align-items: center; margin-top: 6px; flex-wrap: wrap; }
      #sc-panel .sc-chip { display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border: 2px solid rgba(43,34,53,.25); border-radius: 10px; background: #fff; font-size: 14px; }
      #sc-panel .sc-chip b { font-size: 24px; }
      #sc-panel .sc-opts { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 720px; }
      #sc-panel .sc-opt { min-width: 110px; padding: 8px 14px 8px 22px; border: 3px solid ${INK}; border-radius: 14px; background: #fff; color: ${INK}; cursor: pointer; font: 700 18px "Segoe UI", sans-serif;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 0 rgba(43,34,53,.18); position: relative; }
      #sc-panel .sc-opt:hover { background: #fff3c4; }
      #sc-panel .sc-opt kbd { position: absolute; left: 6px; top: 3px; font: 800 11px "Segoe UI", sans-serif; opacity: .5; }
      #sc-panel .sc-opt .ch { font-size: 50px; line-height: 1.1; padding: 0 6px; }
      #sc-panel .sc-opt canvas { width: 46px; height: 46px; }
      #sc-panel .sc-opt.right, #sc-panel .sc-tile.right { background: #d8f3dc; border-color: #2f8a4a; }
      #sc-panel .sc-opt.wrong, #sc-panel .sc-tile.wrong { background: #fbd9d5; border-color: ${RED}; animation: scshake .35s; }
      #sc-panel .sc-opt.dim { opacity: .45; }
      #sc-panel .sc-btn { padding: 8px 18px; border: 3px solid ${INK}; border-radius: 12px; background: ${INK}; color: ${PAPER}; font: 800 16px "Segoe UI", sans-serif; cursor: pointer; }
      #sc-panel .sc-btn.light { background: #fff; color: ${INK}; }
      #sc-panel .sc-btn:disabled { opacity: .4; cursor: default; }
      #sc-panel .sc-say-btn { width: 40px; height: 40px; border-radius: 50%; border: 2.5px solid ${INK}; background: #fff; font-size: 18px; cursor: pointer; padding: 0; }
      #sc-panel .sc-match { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 46px; }
      #sc-panel .sc-match .sc-opt { min-width: 150px; }
      #sc-panel .sc-match .sc-opt.sel { background: #fff3c4; border-color: #d9a03a; }
      #sc-panel .sc-match .sc-opt.done { background: #e4f5e7; border-color: #2f8a4a; cursor: default; box-shadow: none; }
      #sc-panel .sc-tiles { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }
      #sc-panel .sc-tile { width: 74px; height: 86px; border: 3px solid ${INK}; border-radius: 12px; background: #fff; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; box-shadow: 0 4px 0 rgba(43,34,53,.18); }
      #sc-panel .sc-tile b { font-size: 42px; line-height: 1; } #sc-panel .sc-tile span { font-size: 11px; opacity: .7; }
      #sc-panel .sc-tile kbd { position: absolute; left: 5px; top: 2px; font: 800 10px "Segoe UI"; opacity: .5; }
      #sc-panel .sc-slot { min-width: 260px; min-height: 96px; border: 3px dashed rgba(43,34,53,.35); border-radius: 14px; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 44px; padding: 4px 12px; }
      #sc-panel .sc-slot .plus { font-size: 26px; opacity: .5; }
      #sc-panel .sc-slot.built { border-style: solid; border-color: #2f8a4a; background: #e4f5e7; }
      #sc-panel .sc-pop { animation: scpop .5s ease-out; }
      #sc-panel input.sc-in { font: 700 26px "Segoe UI", sans-serif; padding: 6px 12px; border: 3px solid ${INK}; border-radius: 12px; width: 280px; text-align: center; background: #fff; color: ${INK}; }
      #sc-panel .sc-sign { display: inline-block; padding: 8px 22px 6px; border: 4px solid #8a5f3e; border-radius: 12px; background: #fdf3dc; box-shadow: 0 3px 0 rgba(43,34,53,.2); font-size: 46px; line-height: 1.6; }
      #sc-panel .sc-tag { font: italic 600 14px "Segoe UI", sans-serif; opacity: .7; }
      #sc-panel .sc-note { font: 600 14px "Segoe UI", sans-serif; color: #2f6f4a; min-height: 18px; }
      #sc-panel .sc-sign ruby rt, #sc-panel .sc-note ruby rt, #sc-panel .sc-word ruby rt { font: 600 .36em/1.1 "Segoe UI", sans-serif; color: ${RED}; opacity: .85; }
      #sc-panel .sc-note .sc-zh, #sc-panel .sc-note .sc-ja { font-size: 26px; }
      #sc-panel .sc-note .sc-read { font-size: 48px; color: ${INK}; vertical-align: middle; margin-right: 6px; }
      #sc-panel .sc-big ruby rt { font: 600 22px "Segoe UI", sans-serif; color: ${RED}; }
      #sc-panel .sc-say .cjk.cjk-ruby { line-height: 2.2; }
      #sc-panel .sc-fade rt { animation: scfade 2.2s ease-in .9s forwards; }
      #sc-panel .sc-kana { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
      #sc-panel .sc-kcell { width: 96px; border: 3px solid ${INK}; border-radius: 14px; background: #fff; padding: 6px 0 4px; cursor: pointer; box-shadow: 0 4px 0 rgba(43,34,53,.18); }
      #sc-panel .sc-kcell b, #sc-panel .sc-kcell .kbig { display: block; font-size: 62px; line-height: 1.15; color: ${INK}; }
      #sc-panel .sc-word .wbig { font-size: 28px; line-height: 1.9; }
      #sc-panel .sc-kcell span { font: 800 18px Bahnschrift, "Segoe UI", sans-serif; color: ${RED}; }
      #sc-panel .sc-words { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
      #sc-panel .sc-word { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 12px; background: #f3eadb; font-size: 15px; }
      #sc-panel .sc-word b { font-size: 26px; }
      #sc-panel .sc-word canvas { width: 34px; height: 34px; }
      #sc-panel .sc-list { display: flex; flex-direction: column; gap: 8px; width: 100%; }
      #sc-panel .sc-lesson { display: flex; align-items: center; gap: 12px; padding: 8px 12px; border: 3px solid ${INK}; border-radius: 14px; background: #fff; cursor: pointer; text-align: left; box-shadow: 0 4px 0 rgba(43,34,53,.15); }
      #sc-panel .sc-lesson.next { background: #fff3c4; } #sc-panel .sc-lesson.locked { opacity: .45; cursor: default; box-shadow: none; }
      #sc-panel .sc-lesson .n { font: 800 13px "Segoe UI"; opacity: .55; width: 18px; }
      #sc-panel .sc-lesson .t { flex: 1; } #sc-panel .sc-lesson .t b { display: block; font-size: 17px; } #sc-panel .sc-lesson .t span { font-size: 13px; opacity: .7; }
      #sc-panel .sc-lesson .cs { font-size: 26px; letter-spacing: 2px; }
      #sc-panel .sc-lesson .st { width: 64px; text-align: right; color: #d9a03a; font-size: 15px; letter-spacing: 1px; }
      #sc-panel .sc-lesson .stamp { width: 28px; height: 28px; background: ${RED}; color: ${PAPER}; border-radius: 5px; display: grid; place-items: center; font-size: 16px; transform: rotate(-8deg); }
      #sc-panel .sc-timer { width: 100%; max-width: 520px; height: 12px; border: 2.5px solid ${INK}; border-radius: 8px; overflow: hidden; background: #fff; }
      #sc-panel .sc-timer i { display: block; height: 100%; background: #f2c14e; }
      #sc-panel .sc-score { font: 800 22px Bahnschrift, "Segoe UI", sans-serif; }
      #sc-panel .sc-stars { font-size: 34px; color: #d9a03a; letter-spacing: 4px; }
      #sc-panel .sc-learned { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
      @keyframes scshake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-6px); } 75% { transform: translateX(6px); } }
      @keyframes scpop { 0% { transform: scale(.5); opacity: 0; } 70% { transform: scale(1.12); opacity: 1; } 100% { transform: scale(1); } }
      @keyframes scfade { to { opacity: 0; } }
      body.in-battle #sc-panel { display: none !important; }`;
    document.head.appendChild(s);
  }
  function panelEl() {
    if (PANEL) return PANEL;
    css();
    const el = document.createElement('div'); el.id = 'sc-panel'; el.className = 'sc-hidden';
    el.innerHTML = '<div class="sc-card"><div class="sc-head"><span class="sc-seal"></span><b class="sc-title"></b><span class="sc-dots"></span><button class="sc-x" title="Stop (Esc)">✕</button></div>'
      + '<div class="sc-say"></div><div class="sc-body"></div><div class="sc-foot"></div></div>';
    document.body.appendChild(el);
    const q = s => el.querySelector(s);
    PANEL = { el, title: q('.sc-title'), dots: q('.sc-dots'), say: q('.sc-say'), body: q('.sc-body'), foot: q('.sc-foot'), seal: q('.sc-seal'), x: q('.sc-x') };
    PANEL.x.onclick = () => quit();
    addEventListener('keydown', e => {
      if (!PANEL || PANEL.el.classList.contains('sc-hidden')) return;
      const inInput = e.target && e.target.tagName === 'INPUT';
      if (e.code === 'Escape' && !inInput) { e.preventDefault(); e.stopPropagation(); quit(); return; }
      if (KEYH && KEYH(e, inInput)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    return PANEL;
  }
  function openPanel(title, sub) {
    const P = panelEl(), l = L();
    P.seal.textContent = l === 'ja' ? '森' : '林'; P.seal.lang = TAG(l); P.seal.className = 'sc-seal sc-' + l;
    P.title.innerHTML = esc2(title) + (sub ? `<small>${esc2(sub)}</small>` : '');
    P.dots.innerHTML = ''; P.say.innerHTML = ''; P.body.innerHTML = ''; P.foot.innerHTML = '';
    P.el.classList.remove('sc-hidden');
    Input.typing = true; if (G) G.sim.lock = 1;
    return P;
  }
  function closePanel() {
    if (!PANEL) return;
    PANEL.el.classList.add('sc-hidden'); PANEL.body.innerHTML = ''; KEYH = null;
    if (typeof CJK !== 'undefined' && CJK.ime && CJK.ime.box) CJK.ime.box.style.display = 'none';
    Input.typing = false; if (G) G.sim.lock = 0;
  }
  const panelOpen = () => !!PANEL && !PANEL.el.classList.contains('sc-hidden');
  function quit() { if (RUN) { RUN.quit = true; if (RUN.wake) RUN.wake({ quit: true }); } else closePanel(); }
  // the teacher's words in the panel, by the weave like every line (DESIGN.md 17.3): mixed (the English with the words you know),
  // whole in the language as the weave rises (in the mode, CJK.html); the English only on request, EN on the line. An
  // instruction with no line in the language (src null) is just its English.
  function panelSay(src, en) {
    if (!PANEL) return;
    const l = L(), who = plainOf(nm().teacher);
    let html = src ? CJK.html(src, { lang: l }) : '';
    try { if (src && en && typeof STORY !== 'undefined' && STORY.mixHTML) html = STORY.mixHTML(src, en, { key: 'school:' + en }).html; } catch (e) { /* (the line as written) */ }
    PANEL.say.classList.toggle('en-on', !src); PANEL.say.classList.toggle('en-only', !src);
    PANEL.say.innerHTML = (src && en ? '<button type="button" class="sc-enb" title="This line in English">EN</button>' : '') + `<span class="who">${esc2(who)}</span>` + html + (en ? `<span class="en">${esc2(en)}</span>` : '');
    const b = PANEL.say.querySelector('.sc-enb');
    if (b) b.onclick = e => { e.stopPropagation(); PANEL.say.classList.toggle('en-on'); b.blur(); const inp = PANEL.body.querySelector('input'); if (inp) inp.focus(); };
    if (src && cmode() === 'chars') CJK.seen(src, { lang: l });
  }
  const pickOf = a => a[rnd(a.length)];
  function cheer(ok) { const [src, en] = pickOf((ok ? PRAISE : OOPS)[L()] || PRAISE.zh); panelSay(src, en); }
  function dots(n, at) { if (PANEL) PANEL.dots.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < at ? 'done' : i === at ? 'on' : ''}"></i>`).join(''); }
  // a character (or word) as big type: always in characters, in the language's own font
  const hz = (text, cls = '') => `<span class="${cls} sc-${L()}" lang="${TAG(L())}">${esc2(text)}</span>`;
  const icon = key => (key ? `<canvas width="96" height="96" data-icon="${esc2(key)}"></canvas>` : '');
  const paintIcons = el => el.querySelectorAll('canvas[data-icon]').forEach(cv => ICONS.draw(cv, cv.dataset.icon));
  // notation → HTML in characters, with a reading over each piece except the ones in `hide` (or known, unless o.all)
  function rubyHTML(src, hide = new Set(), o = {}) {
    const l = L(), { U } = CJK.units(src, { lang: l, mode: 'chars', ruby: 'always' });
    let out = '';
    for (const u of U) {
      const bare = !u.rt || (u.ch.length && u.ch.every(c => hide.has(c) || (!o.all && known(c))));
      out += bare ? esc2(u.t) : `<ruby>${esc2(u.t)}<rt>${esc2(u.rt)}</rt></ruby>`;
    }
    return `<span class="sc-${l}${o.cls ? ' ' + o.cls : ''}" lang="${TAG(l)}">${out}</span>`;
  }
  // how a piece is read, for the prompts: zh pinyin; ja kana in rōmaji; ja kanji in kana (and rōmaji)
  function readingOf(it) {
    if (L() === 'zh') return it.r;
    if (it.kana) return romaOf(it.c);
    return `${it.r} · ${CJK.romaji(it.r)}`;
  }
  const say = src => { try { return CJK.say(src, L()); } catch (e) { return false; } };
  const srcOf = it => (it.kana ? it.c : it.w || `[${it.c}|${it.r}]`);
  // resolves when the current question is answered (or the lesson is stopped): { quit } or the answer
  const waitAnswer = () => new Promise(r => { RUN.wake = v => { RUN.wake = null; r(v); }; });

  // ------------------------------------------------------------ question kinds (each resolves { ok } or { quit })
  // pick one: prompt HTML, options [{ html, value }], the right value. Number keys pick.
  async function choice(prompt, options, right, o = {}) {
    const P = PANEL;
    P.body.innerHTML = `${prompt}<div class="sc-opts">${options.map((op, i) => `<button class="sc-opt${o.big ? ' big' : ''}" data-i="${i}"><kbd>${i + 1}</kbd>${op.html}</button>`).join('')}</div><div class="sc-note"></div>`;
    paintIcons(P.body);
    P.foot.innerHTML = `<span>${esc2(o.foot || `1–${options.length} or click to pick`)}</span><span></span>`;
    const btns = [...P.body.querySelectorAll('.sc-opt')];
    let done = false;
    const pick = async i => {
      if (done || !options[i]) return;
      done = true;
      const ok = options[i].value === right, ri = options.findIndex(op => op.value === right);
      btns[i].classList.add(ok ? 'right' : 'wrong'); if (!ok && btns[ri]) btns[ri].classList.add('right');
      btns.forEach((b, k) => { if (k !== i && k !== ri) b.classList.add('dim'); });
      Sound.play(ok ? 'review' : 'wrong'); cheer(ok);
      if (o.note) P.body.querySelector('.sc-note').innerHTML = o.note;
      if (o.onAnswer) o.onAnswer(ok);
      await sleep(ok ? (o.note ? 1500 : 750) : (o.note ? 2100 : 1500));
      if (RUN && RUN.wake) RUN.wake({ ok });
    };
    btns.forEach((b, i) => { b.onclick = () => pick(i); });
    KEYH = (e, inInput) => { if (inInput) return false; const m = /^(Digit|Numpad)([1-9])$/.exec(e.code); if (m && +m[2] <= options.length) { pick(+m[2] - 1); return true; } return false; };
    RUN.cur = { kind: 'choice', right: options.findIndex(op => op.value === right), pick };
    return waitAnswer();
  }
  // a Next button (E / Enter / Space / click)
  async function next(label = 'Next ▸') {
    const P = PANEL;
    P.foot.innerHTML = `<span>E / Enter / Space</span><button class="sc-btn sc-next">${esc2(label)}</button>`;
    const b = P.foot.querySelector('.sc-next');
    b.onclick = () => { if (RUN && RUN.wake) RUN.wake({ ok: true }); };
    KEYH = (e, inInput) => { if (inInput) return false; if (['KeyE', 'Enter', 'Space', 'NumpadEnter'].includes(e.code) && !e.repeat) { b.click(); return true; } return false; };
    RUN.cur = { kind: 'next', next: () => b.click() };
    return waitAnswer();
  }
  // match pairs: left items (pictures, sounds) with right items (characters). Keys: 1–n for the left, then a–… for the right.
  async function match(prompt, pairs) {
    const P = PANEL, n = pairs.length, KEYS_R = 'ABCDEF';
    let right = shuffle(pairs.map((p, i) => i));
    for (let k = 0; k < 8 && n > 1 && right.every((v, i) => v === i); k++) right = shuffle(right);      // (never straight across)
    P.body.innerHTML = `${prompt}<div class="sc-match">${pairs.map((p, i) => `<button class="sc-opt" data-side="L" data-i="${i}"><kbd>${i + 1}</kbd>${p.left}</button>`
      + `<button class="sc-opt" data-side="R" data-i="${right[i]}"><kbd>${KEYS_R[i]}</kbd>${pairs[right[i]].right}</button>`).join('')}</div>`;
    paintIcons(P.body);
    P.foot.innerHTML = '<span>Pick one on the left, then its match on the right (or 1–4, then A–D)</span><span></span>';
    const Ls = [...P.body.querySelectorAll('[data-side="L"]')], Rs = [...P.body.querySelectorAll('[data-side="R"]')];
    let sel = null, left = n, bad = 0;
    const tryPair = async (li, rb) => {
      const ri = +rb.dataset.i, lb = Ls[li];
      if (ri === li) { lb.classList.remove('sel'); lb.classList.add('done'); rb.classList.add('done'); Sound.play('review'); left--; if (!left) { cheer(true); await sleep(700); if (RUN && RUN.wake) RUN.wake({ ok: bad === 0, bad }); } }
      else { bad++; Sound.play('wrong'); rb.classList.add('wrong'); lb.classList.add('wrong'); cheer(false); setTimeout(() => { rb.classList.remove('wrong'); lb.classList.remove('wrong', 'sel'); }, 450); }
      sel = null;
    };
    const clickL = i => { if (Ls[i].classList.contains('done')) return; Ls.forEach(b => b.classList.remove('sel')); sel = i; Ls[i].classList.add('sel'); Sound.play('click'); };
    const clickR = k => { const rb = Rs[k]; if (!rb || rb.classList.contains('done') || sel === null) return; tryPair(sel, rb); };
    Ls.forEach((b, i) => { b.onclick = () => clickL(i); });
    Rs.forEach((b, k) => { b.onclick = () => clickR(k); });
    KEYH = (e, inInput) => {
      if (inInput) return false;
      const m = /^(Digit|Numpad)([1-9])$/.exec(e.code); if (m && +m[2] <= n) { clickL(+m[2] - 1); return true; }
      const k = /^Key([A-F])$/.exec(e.code); if (k && KEYS_R.indexOf(k[1]) < n) { clickR(KEYS_R.indexOf(k[1])); return true; }
      return false;
    };
    RUN.cur = { kind: 'match', solve: () => { for (let i = 0; i < n; i++) { clickL(i); clickR(Rs.findIndex(b => +b.dataset.i === i)); } } };
    const r = await waitAnswer();
    return r.quit ? r : { ok: true, bad: r.bad || 0 };
  }
  // build a character from parts: tiles to click; when the slot holds the right parts, the character appears
  async function build(prompt, target, parts, tray) {
    const P = PANEL;
    P.body.innerHTML = `${prompt}<div class="sc-slot"></div><div class="sc-tiles">${tray.map((p, i) => `<button class="sc-tile" data-i="${i}"><kbd>${i + 1}</kbd><b class="sc-${L()}" lang="${TAG(L())}">${esc2(p)}</b><span>${esc2(PART[p] || '')}</span></button>`).join('')}</div><div class="sc-note"></div>`;
    P.foot.innerHTML = '<span>Click the parts (or 1–6) · Backspace: start over</span><button class="sc-btn light sc-clear">Start over</button>';
    const slot = P.body.querySelector('.sc-slot'), tiles = [...P.body.querySelectorAll('.sc-tile')];
    let got = [], bad = 0, done = false;
    const draw = () => { slot.innerHTML = got.map(p => hz(p)).join('<span class="plus">+</span>') || '<span class="plus">?</span>'; };
    const clear = () => { got = []; draw(); };
    const add = async i => {
      if (done) return;
      got.push(tray[i]); Sound.play('click'); draw();
      if (got.length < parts.length) return;
      const ok = got.slice().sort().join('') === parts.slice().sort().join('');
      if (ok) {
        done = true; slot.classList.add('built'); slot.innerHTML = `${got.map(p => hz(p)).join('<span class="plus">+</span>')}<span class="plus">=</span>${hz(target, 'sc-pop')}`;
        Sound.play('perfect'); cheer(true); await sleep(1300); if (RUN && RUN.wake) RUN.wake({ ok: bad === 0, bad });
      } else { bad++; Sound.play('wrong'); cheer(false); slot.classList.add('wrong'); tiles.forEach(t => t.classList.remove('right')); setTimeout(() => { slot.classList.remove('wrong'); clear(); }, 500); }
    };
    tiles.forEach((t, i) => { t.onclick = () => add(i); });
    P.foot.querySelector('.sc-clear').onclick = clear;
    draw();
    KEYH = (e, inInput) => { if (inInput) return false; const m = /^(Digit|Numpad)([1-9])$/.exec(e.code); if (m && +m[2] <= tray.length) { add(+m[2] - 1); return true; } if (e.code === 'Backspace') { clear(); return true; } return false; };
    RUN.cur = { kind: 'build', solve: () => { clear(); const left = parts.slice(); for (const p of left) add(tray.indexOf(p)); } };
    const r = await waitAnswer();
    return r.quit ? r : { ok: (r.bad || 0) === 0 };
  }
  // type it: the reading (pinyin / rōmaji), or the characters through the in-game IME; Tab: a hint, ?: show me
  // (the picture and the character on the left, the box on the right: the IME's list opens above the box and never hides them)
  async function typeIt(prompt, visual, expected, spell) {
    const P = PANEL, l = L();
    P.body.innerHTML = `${prompt}<div class="sc-row">${visual}<div style="display:flex;flex-direction:column;gap:8px;align-items:center"><input class="sc-in" autocomplete="off" spellcheck="false" placeholder="type it…"><div class="sc-note"></div></div></div>`;
    const chars = cmode() === 'chars';
    P.foot.innerHTML = `<span>${esc2(chars ? (l === 'zh' ? 'Pinyin, or pinyin + Space to pick the characters' : 'Rōmaji: it turns into kana as you type') : (l === 'zh' ? 'Pinyin (tones optional: ni3 = nǐ)' : 'Rōmaji'))} · Tab: a hint · ?: show me</span>`
      + '<span><button class="sc-btn light sc-hintb">Hint</button> <button class="sc-btn sc-check">Check</button></span>';
    const inp = P.body.querySelector('.sc-in'), note = P.body.querySelector('.sc-note');
    CJK.attachIME(inp);
    let hints = 0, bad = 0, shown = false;
    const hint = () => { hints = Math.min(3, hints + 1); const s = [...spell]; note.textContent = hints >= 3 ? `It’s «${spell}»` : s.map((ch, i) => (i === 0 || (hints >= 2 && i % 2 === 0) ? ch : '_')).join(' '); inp.focus(); };
    const check = async () => {
      const v = inp.value.trim();
      if (!v) return;
      if (/^[?？]+$/.test(v)) { shown = true; hints = 3; note.textContent = `It’s «${spell}». Type it!`; inp.value = ''; say(expected); return; }
      // (typed as letters: the reading is enough; picked as characters with the IME: they must be these ones, not a homophone)
      const han = /[㐀-鿿豈-﫿]/, want = CJK.chars(expected, { lang: l }).replace(/[\s。、！？]/g, '');
      if ((!han.test(v) || v.replace(/[\s。、！？]/g, '') === want) && CJK.canon(v, l) === CJK.canon(expected, l)) {
        CJK.used(v, expected, { lang: l });
        inp.disabled = true; inp.classList.add('right'); Sound.play('review'); cheer(true);
        note.innerHTML = `${rubyHTML(expected, new Set(), { all: true })} = «${esc2(spell)}»`;
        await sleep(1100); if (RUN && RUN.wake) RUN.wake({ ok: bad === 0 && !shown && hints < 2 });
      } else { bad++; Sound.play('wrong'); cheer(false); inp.classList.remove('wrong'); void inp.offsetWidth; inp.classList.add('wrong'); if (bad >= 2 && hints < 3) hint(); inp.select(); }
    };
    P.foot.querySelector('.sc-check').onclick = check;
    P.foot.querySelector('.sc-hintb').onclick = hint;
    inp.addEventListener('keydown', e => { if (e.isComposing || e.keyCode === 229) return; if (e.key === 'Enter') { e.preventDefault(); check(); } else if (e.key === 'Tab') { e.preventDefault(); hint(); } });
    KEYH = () => false;
    setTimeout(() => inp.focus(), 40);
    RUN.cur = { kind: 'type', type: v => { inp.value = v; return check(); }, expected, spell };
    return waitAnswer();
  }

  // ------------------------------------------------------------ the rounds of a lesson (each resolves { bad } or { quit })
  // items: the lesson's characters { c, r, en, icon, parts, hint, kana }; a kana lesson's are its kana, with their rōmaji
  function itemsOf(Ls) {
    if (Ls.items) return Ls.items.map(it => Object.assign({ kana: false }, it));
    return [...kanaOf(Ls)].filter(c => c !== 'ー').map(c => ({ c, r: romaOf(c), kana: true }));
  }
  const before = Ls => { const list = LESSONS(); return list.slice(0, Math.max(0, list.indexOf(Ls))); };
  const poolOf = Ls => itemsOf(Ls).concat(before(Ls).flatMap(itemsOf));
  const wordsBefore = Ls => (Ls.words || []).concat(before(Ls).flatMap(q => q.words || []));
  // n others for a multiple choice: different characters (and different answers), the lesson's own first
  function others(Ls, it, n, key = 'c') {
    const mine = shuffle(itemsOf(Ls).filter(q => q[key] !== it[key])), old = shuffle(before(Ls).flatMap(itemsOf).filter(q => q[key] !== it[key]));
    const out = [], seen = new Set([it[key]]);
    for (const q of mine.concat(old)) { if (seen.has(q[key])) continue; seen.add(q[key]); out.push(q); if (out.length >= n) break; }
    return out;
  }
  const meaningHTML = o => `${o.icon ? icon(o.icon) : ''}<span>${esc2(o.en)}</span>`;
  const gridHTML = (c, cls = '') => `<div class="sc-grid ${cls}">${hz(c, 'sc-big')}</div>`;
  async function ask(fn) { const r = await fn(); return r && r.quit ? r : { bad: r && r.ok === false ? 1 : r && r.bad ? r.bad : 0 }; }
  async function series(list, fn) {     // a round of questions: { bad: mistakes } or { quit }
    let bad = 0;
    for (const x of list) { const r = await ask(() => fn(x)); if (r.quit || RUN.quit) return { quit: true }; bad += r.bad; }
    return { bad };
  }
  const ROUND = {
    // meet the characters: one card each (a kana lesson: one card per row, with the words that use it)
    async meet(Ls) {
      const P = PANEL, l = L();
      if (Ls.rows) {
        panelSay(null, 'Click a kana to hear it.');
        for (const row of Ls.rows) {
          const ks = [...row.k], ws = (Ls.words || []).filter(w => [...w.w].some(c => row.k.includes(c)));
          P.body.innerHTML = `<div class="sc-kana">${ks.map(k => `<button class="sc-kcell" data-k="${esc2(k)}">${hz(k, 'kbig')}<span>${esc2(romaOf(k))}</span></button>`).join('')}</div>`
            + `<div class="sc-hint" style="max-width:640px">${esc2(row.tip)}</div>`
            + (ws.length ? `<div class="sc-words">${ws.map(w => `<span class="sc-word">${icon(w.icon)}${rubyHTML(w.w, new Set(), { all: true, cls: 'wbig' })}<span>${esc2(w.en)}</span></span>`).join('')}</div>` : '');
          paintIcons(P.body);
          P.body.querySelectorAll('.sc-kcell').forEach(b => { b.onclick = () => { say(b.dataset.k); Sound.play('click'); }; });
          const r = await next(); if (r.quit) return r;
        }
        return { bad: 0 };
      }
      panelSay(null, 'Look at each one, listen to it, and read how it’s put together.');
      if (Ls.id === 'z1') {             // the very first card: the word you've been saying since the forest
        panelSay('[你好|nǐ hǎo] ！', 'Hello!');
        P.body.innerHTML = `<div class="sc-q">You’ve been saying «nǐ hǎo» since the forest. This is how it’s written:</div>`
          + `<div class="sc-row">${gridHTML('你')}${gridHTML('好')}</div><div class="sc-mean">${icon('wave')}<span>hello</span> <button class="sc-say-btn">🔊</button></div>`;
        paintIcons(P.body); P.body.querySelector('.sc-say-btn').onclick = () => say('[你好|nǐ hǎo]');
        say('[你好|nǐ hǎo]');
        const r = await next(); if (r.quit) return r;
        panelSay(null, 'Now one at a time: look, listen, and see how each is put together.');
      }
      for (const it of itemsOf(Ls)) {
        const parts = it.parts ? `<div class="sc-parts">${it.parts.map(p => `<span class="sc-chip"><b class="sc-${l}" lang="${TAG(l)}">${esc2(p)}</b>${esc2(PART[p] || '')}</span>`).join('<span>+</span>')}</div>` : '';
        const pic = it.pic && it.icon ? `<div class="sc-row" style="gap:6px">${icon(it.icon)}<span style="font-size:26px">→</span></div>` : '';
        P.body.innerHTML = `<div class="sc-row">${pic}${gridHTML(it.c)}<div class="sc-info"><div class="sc-read">${esc2(readingOf(it))} <button class="sc-say-btn">🔊</button></div>`
          + `<div class="sc-mean">${it.icon && !it.pic ? icon(it.icon) : ''}<span>${esc2(it.en)}</span></div>${parts}<div class="sc-hint">${esc2(it.hint || '')}</div></div></div>`;
        paintIcons(P.body);
        P.body.querySelector('.sc-say-btn').onclick = () => say(srcOf(it));
        say(srcOf(it));
        const r = await next(); if (r.quit) return r;
      }
      return { bad: 0 };
    },
    // match pictures to characters (a kana lesson: sounds to kana)
    async match(Ls) {
      if (Ls.rows) {
        const its = shuffle(itemsOf(Ls)).slice(0, 4);
        panelSay(null, 'Match each sound to its kana.');
        return match('<div class="sc-q">Which kana makes each sound?</div>', its.map(it => ({ left: `<span class="sc-read">${esc2(it.r)}</span>`, right: hz(it.c, 'ch') })));
      }
      // (the lesson's words with a picture: 你好, 水, 花, 树…)
      const ws = shuffle((Ls.words || []).filter(w => w.icon)).slice(0, 4);
      panelSay(null, 'Match each picture to its characters.');
      return match('<div class="sc-q">Which one is each picture?</div>', ws.map(w => ({ left: meaningHTML(w), right: hz(plainOf(w.w, { mode: 'chars' }), 'ch') })));
    },
    // katakana: match each one to its hiragana twin
    async pair(Ls) {
      const its = shuffle(itemsOf(Ls).filter(it => CJK.toHira(it.c) !== it.c)).slice(0, 4);
      panelSay(null, 'Each katakana has a hiragana twin. Match them!');
      return match('<div class="sc-q">Hiragana ↔ katakana: the same sound</div>', its.map(it => ({ left: hz(CJK.toHira(it.c), 'ch'), right: hz(it.c, 'ch') })));
    },
    // see (and hear) a reading, pick the character
    async listen(Ls) {
      panelSay(null, 'Listen, then pick the character.');
      return series(shuffle(itemsOf(Ls)).slice(0, 5), it => {
        const opts = shuffle([it].concat(others(Ls, it, 3))).map(q => ({ html: hz(q.c, 'ch'), value: q.c }));
        setTimeout(() => say(srcOf(it)), 150);
        const p = choice(`<div class="sc-q">Which one is <span class="sc-read">«${esc2(readingOf(it))}»</span>? <button class="sc-say-btn">🔊</button></div>`, opts, it.c);
        const b = PANEL.body.querySelector('.sc-say-btn'); if (b) b.onclick = () => say(srcOf(it));
        return p;
      });
    },
    // see a character, pick what it means
    async meaning(Ls) {
      panelSay(null, 'What does it mean?');
      return series(shuffle(itemsOf(Ls)).slice(0, 5), it => {
        const opts = shuffle([it].concat(others(Ls, it, 3, 'en'))).map(q => ({ html: meaningHTML(q), value: q.en }));
        return choice(`<div class="sc-q">What does it mean?</div>${gridHTML(it.c)}`, opts, it.en);
      });
    },
    // a kana lesson: see a kana, pick its sound
    async sound(Ls) {
      panelSay(null, 'How is it read?');
      return series(shuffle(itemsOf(Ls)).slice(0, 5), it => {
        const opts = shuffle([it].concat(others(Ls, it, 3, 'r'))).map(q => ({ html: `<span class="sc-read">${esc2(q.r)}</span>`, value: q.r }));
        return choice(`<div class="sc-q">How is it read?</div>${gridHTML(it.c)}`, opts, it.r);
      });
    },
    // a kana lesson: read a word you know, pick what it means
    async word(Ls) {
      panelSay(null, 'You know these words! Read them.');
      const ws = shuffle((Ls.words || []).slice()).slice(0, 4), all = wordsBefore(Ls);
      return series(ws, w => {
        const wrong = shuffle(all.filter(q => q.en !== w.en)).filter((q, i, a) => a.findIndex(x => x.en === q.en) === i).slice(0, 3);
        const opts = shuffle([w].concat(wrong)).map(q => ({ html: meaningHTML(q), value: q.en }));
        return choice(`<div class="sc-q">What does it mean?</div><div class="sc-sign">${rubyHTML(w.w, new Set(charsOf(Ls)))}</div>`, opts, w.en,
          { note: `«${esc2(CJK.roman(w.w, { lang: 'ja', cap: false }))}» = ${esc2(w.en)}` });
      });
    },
    // type the reading (or pick the characters with the IME)
    async type(Ls) {
      const l = L();
      panelSay(null, cmode() === 'chars' ? (l === 'zh' ? 'Type its pinyin, then pick the character from the list.' : 'Type it in rōmaji: the kana appear as you type.') : (l === 'zh' ? 'Type its pinyin.' : 'Type it in rōmaji.'));
      const spellOf = src => CJK.roman(src, { lang: l, cap: false });
      if (Ls.rows) {
        return series(shuffle((Ls.words || []).slice()).slice(0, 3), w => {
          const p = typeIt(`<div class="sc-q">Type this word <small>${esc2(w.en)}</small></div>`, `${icon(w.icon)}<div class="sc-sign">${hz(w.w)}</div>`, w.w, spellOf(w.w));
          paintIcons(PANEL.body);
          return p;
        });
      }
      return series(shuffle(itemsOf(Ls)).slice(0, 3), it => {
        const exp = srcOf(it);
        const p = typeIt(`<div class="sc-q">How is it read? <small>${esc2(it.en)}</small></div>`, `${it.icon ? icon(it.icon) : ''}${gridHTML(it.c)}`, exp, spellOf(exp));
        paintIcons(PANEL.body);
        return p;
      });
    },
    // read a sign or a line from the world, pick what it says
    async read(Ls) {
      panelSay(null, 'Out in the world: what does it say?');
      const hide = new Set(charsOf(Ls));
      return series((Ls.reads || []).slice(0, 4), q => {
        const opts = shuffle([q.en].concat(q.wrong)).map(en => ({ html: `<span>${esc2(en)}</span>`, value: en }));
        return choice(`<div class="sc-tag">${esc2(UI.weavePlain ? UI.weavePlain(q.tag, { english: true }) : q.tag)}</div><div class="sc-sign">${rubyHTML(q.src, hide)}</div>`, opts, q.en,
          { note: q.note ? esc2(q.note) : '' });
      });
    },
    // parts → meaning: guess what the parts make
    async parts(Ls) {
      const l = L();
      panelSay(null, 'Guess from the parts!');
      return series(Ls.guess || [], g => {
        const chips = g.parts.map(p => `<span class="sc-chip"><b class="sc-${l}" lang="${TAG(l)}">${esc2(p)}</b>${esc2(PART[p] || '')}</span>`).join('<span style="font-size:22px">+</span>');
        const opts = shuffle([g.en].concat(g.wrong)).map(en => ({ html: `<span>${esc2(en)}</span>`, value: en }));
        return choice(`<div class="sc-q">These parts together make a character. What could it mean?</div><div class="sc-parts" style="justify-content:center">${chips}<span style="font-size:22px">= ?</span></div>`,
          opts, g.en, { note: `${rubyHTML(g.src, new Set(), { all: true, cls: 'sc-read' })} ${esc2(g.note || '')}` });
      });
    },
    // build characters from their parts
    async build(Ls) {
      const l = L(), allItems = poolOf(Ls);
      panelSay(null, 'Put the parts together!');
      const DECOY = ['木', '日', '月', '口', '女', '子', '宀', '亻', '火', '山', '氵', '艹'];
      return series(Ls.build || [], c => {
        const it = allItems.find(q => q.c === c) || { c, en: '', parts: [] };
        const parts = it.parts || [], tray = shuffle(uniq(parts.concat(shuffle(DECOY.filter(p => !parts.includes(p))).slice(0, 6 - uniq(parts).length))));
        const p = build(`<div class="sc-q">Build «${esc2(it.en)}» <small>${esc2(readingOf(it))}</small></div>${it.icon ? `<div>${icon(it.icon)}</div>` : ''}`, c, parts, tray);
        paintIcons(PANEL.body);
        return p;
      });
    },
    // which one has to do with water? (the 氵 radical)
    async spot(Ls) {
      panelSay(null, 'Look for the three drops of water on the left: 氵.');
      const water = shuffle(itemsOf(Ls)).slice(0, 3), dry = before(Ls).flatMap(itemsOf).filter(q => !(q.parts || []).includes('氵') && q.c !== '水');
      return series(water, it => {
        const opts = shuffle([it].concat(shuffle(dry.slice()).slice(0, 3))).map(q => ({ html: hz(q.c, 'ch'), value: q.c }));
        return choice('<div class="sc-q">Which one has to do with water?</div>', opts, it.c, { note: `${hz(it.c)} ${esc2(it.r)}: ${esc2(it.en)}` });
      });
    },
  };
  // the hiragana of a notation string (ja): the kana as written, kanji through their readings
  function kanaOfSrc(src) { return CJK.parse(src, 'ja').map(t => (t.segs ? t.segs.map(g => (g.han ? g.r || '' : g.s)).join('') : '')).join(''); }

  // ------------------------------------------------------------ a whole lesson in the panel: its rounds, then the "learned!" card
  const doneCount = () => LESSONS().filter(Ls => S().done[Ls.id]).length;
  const nextLesson = () => LESSONS().find(Ls => !S().done[Ls.id]) || null;
  const ROUND_NAME = { meet: 'Meet them', match: 'Match', pair: 'Twins', listen: 'Listen', meaning: 'Meanings', sound: 'Sounds', word: 'Words you know', type: 'Type it', read: 'Out in the world', parts: 'Guess from the parts', build: 'Build it', spot: 'Spot the water' };
  async function runLesson(Ls) {
    const list = LESSONS(), n = list.indexOf(Ls) + 1;
    openPanel(`Lesson ${n} · ${Ls.title}`, Ls.blurb);
    RUN = { quit: false, wake: null, cur: null, lesson: Ls.id, round: null };
    try {
      let bad = 0;
      for (let i = 0; i < Ls.rounds.length; i++) {
        const kind = Ls.rounds[i]; RUN.round = kind;
        dots(Ls.rounds.length, i);
        PANEL.title.innerHTML = `${esc2(`Lesson ${n} · ${Ls.title}`)}<small>${esc2(ROUND_NAME[kind] || '')}</small>`;
        const r = await ROUND[kind](Ls);
        if (!r || r.quit || RUN.quit) return { quit: true };
        bad += r.bad || 0;
      }
      dots(Ls.rounds.length, Ls.rounds.length);
      const stars = bad <= 1 ? 3 : bad <= 4 ? 2 : 1;
      RUN.round = 'end';
      await endCard(Ls, stars);
      return { stars, bad };
    } catch (e) { console.error('[school] lesson', e); return { quit: true }; }
    finally { RUN = null; }
  }
  // the characters with their readings over them… and the readings fade away
  async function endCard(Ls, stars) {
    const P = PANEL, l = L(), list = charsOf(Ls), show = Ls.rows ? [...kanaOf(Ls)].filter(c => c !== 'ー') : list, chars = cmode() === 'chars';
    const rt = c => (l === 'zh' ? (Ls.items.find(it => it.c === c) || {}).r : Ls.rows ? romaOf(c) : (Ls.items.find(it => it.c === c) || {}).r);
    P.title.innerHTML = `${esc2(Ls.title)}<small>Learned!</small>`;
    panelSay(PRAISE[l][1][0], PRAISE[l][1][1]);
    P.body.innerHTML = `<div class="sc-q">You learned ${show.length > 8 ? 'these' : show.length === 1 ? 'it' : 'them'}!</div>`
      + `<div class="sc-learned">${show.map(c => `<div class="sc-grid sm"><span class="sc-big sc-fade sc-${l}" lang="${TAG(l)}"><ruby>${esc2(c)}<rt>${esc2(rt(c) || '')}</rt></ruby></span></div>`).join('')}</div>`
      + (Ls.extra ? `<div class="sc-hint">…and the dotted ones (${hz('がざだばぱ')}…) and the small ones (${hz('っゃゅょ')}).</div>` : '')
      + `<div class="sc-stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>`
      + `<div class="sc-note">${chars ? 'Their readings fade away everywhere now: in every line, sign and box.' : `In ${l === 'zh' ? 'character' : 'kana & kanji'} mode, their readings are gone for good (Settings → Writing).`}</div>`;
    Sound.play('learned');
    const r = await next('Finish ▸');
    return r;
  }

  // ------------------------------------------------------------ the teacher's menu: the lessons (in order), the quick round, the chart, Mimo's hat
  async function menu() {
    const P = openPanel(nm().placeEn, `${doneCount()} / ${LESSONS().length} lessons`), st = S(), l = L(), list = LESSONS(), nx = nextLesson();
    RUN = { quit: false, wake: null, cur: null, menu: true };
    panelSay(UI.lineFor(`sc.${l}.menu`, 1).text, 'What shall we learn today?');
    const rows = [], keys = {};
    list.forEach((Ls, i) => {
      const done = !!st.done[Ls.id], isNext = Ls === nx, locked = !done && !isNext, cs = Ls.items ? Ls.items.map(it => it.c).join('') : kanaOf(Ls).replace('ー', '');
      const k = locked ? '' : String(i + 1);
      if (k) keys['Digit' + k] = keys['Numpad' + k] = { pick: 'lesson', id: Ls.id };
      rows.push(`<button class="sc-lesson${isNext ? ' next' : ''}${locked ? ' locked' : ''}" data-id="${Ls.id}"${locked ? ' disabled' : ''}><span class="n">${k || '🔒'}</span>`
        + `<span class="t"><b>${esc2(Ls.title)}</b><span>${esc2(locked ? `Finish lesson ${i} first` : isNext ? 'Next: ' + Ls.blurb : Ls.blurb + ' · again?')}</span></span>`
        + `<span class="cs">${hz(cs.length > 8 ? cs.slice(0, 8) + '…' : cs)}</span><span class="st">${done ? '★'.repeat(st.stars[Ls.id] || 1) : ''}</span>`
        + `${done && st.stamp ? `<span class="stamp sc-${l}" lang="${TAG(l)}">${l === 'zh' ? '学' : '学'}</span>` : '<span style="width:28px"></span>'}</button>`);
    });
    const quickOk = doneCount() >= 2;
    rows.push(`<button class="sc-lesson${quickOk ? '' : ' locked'}" data-x="quick"${quickOk ? '' : ' disabled'}><span class="n">Q</span><span class="t"><b>Quick round</b><span>${quickOk ? `40 seconds, as many as you can${st.best ? ` · best: ${st.best}` : ''}` : 'After two lessons'}</span></span></button>`);
    rows.push(`<button class="sc-lesson" data-x="chart"><span class="n">C</span><span class="t"><b>Your characters</b><span>Everything you can read so far</span></span></button>`);
    if (st.hat) rows.push(`<button class="sc-lesson" data-x="hat"><span class="n">H</span><span class="t"><b>${esc2(G.state.mimoName || 'Mimo')}’s brush hat: ${st.hatOn ? 'on' : 'off'}</b><span>Put it ${st.hatOn ? 'away' : 'on'}</span></span></button>`);
    if (quickOk) keys.KeyQ = { pick: 'quick' };
    keys.KeyC = { pick: 'chart' }; if (st.hat) keys.KeyH = { pick: 'hat' };
    P.body.innerHTML = `<div class="sc-list">${rows.join('')}</div>`;
    P.foot.innerHTML = '<span>A number, or click · Esc: not now</span><span></span>';
    P.body.querySelectorAll('[data-id]').forEach(b => { b.onclick = () => { if (!b.disabled && RUN && RUN.wake) RUN.wake({ pick: 'lesson', id: b.dataset.id }); }; });
    P.body.querySelectorAll('[data-x]').forEach(b => { b.onclick = () => { if (!b.disabled && RUN && RUN.wake) RUN.wake({ pick: b.dataset.x }); }; });
    KEYH = (e, inInput) => { if (inInput) return false; const v = keys[e.code]; if (v && RUN && RUN.wake) { RUN.wake(v); return true; } return false; };
    RUN.cur = { kind: 'menu', pick: v => RUN && RUN.wake && RUN.wake(v) };
    const r = await waitAnswer();
    RUN = null;
    if (r && r.pick === 'lesson') r.Ls = list.find(Ls => Ls.id === r.id);
    return r;
  }
  // everything you can read so far (from the menu, or Look at the chart)
  async function chartView() {
    const P = openPanel('Your characters', ''), l = L();
    RUN = { quit: false, wake: null, cur: null };
    const cell = (c, sub) => `<span class="sc-chip" style="flex-direction:column;padding:4px 8px;${known(c) ? '' : 'opacity:.25'}"><b class="sc-${l}" lang="${TAG(l)}" style="font-size:34px">${esc2(c)}</b>${known(c) ? `<span>${esc2(sub || '')}</span>` : '<span>?</span>'}</span>`;
    let html = '';
    if (l === 'zh') html = ZH.map(Ls => `<div class="sc-parts" style="justify-content:center">${Ls.items.map(it => cell(it.c, it.r)).join('')}</div>`).join('');
    else {
      html = `<div class="sc-parts" style="justify-content:center;max-width:700px">${KANA_ROWS.join('').replace(/・/g, '').split('').map(c => cell(c, romaOf(c))).join('')}</div>`
        + `<div class="sc-parts" style="justify-content:center">${'アミモノロサルンブパ'.split('').map(c => cell(c, romaOf(c))).join('')}</div>`
        + `<div class="sc-parts" style="justify-content:center">${JA.filter(q => q.items).flatMap(q => q.items).map(it => cell(it.c, it.r)).join('')}</div>`;
    }
    const st = typeof CJK !== 'undefined' ? CJK.stats(l) : { known: [] };
    P.body.innerHTML = `<div class="sc-q">You can read ${st.known.length} ${l === 'zh' ? 'characters' : 'kana and kanji'}<small>Learned here, or by reading and typing them out in the world</small></div>${html}`;
    const r = await next('Close');
    RUN = null; closePanel();
    return r;
  }

  // ------------------------------------------------------------ the quick round: 40 seconds, as many as you can
  async function quickRound() {
    const l = L(), st = S(), items = uniq(LESSONS().filter(Ls => st.done[Ls.id]).flatMap(itemsOf).map(it => it.c)).map(c => LESSONS().flatMap(itemsOf).find(it => it.c === c));
    if (items.length < 4) return;
    const P = openPanel('Quick round', '40 seconds');
    RUN = { quit: false, wake: null, cur: null };
    panelSay(UI.lineFor(`sc.${l}.practice`, 1).text, l === 'zh' ? 'Quick! How many characters do you know?' : 'Quick! How many can you read?');
    let score = 0, streak = 0, end = performance.now() + 40000, last = null;
    try {
      P.body.innerHTML = '<div class="sc-q">Ready?</div>'; await sleep(700);
      while (!RUN.quit && performance.now() < end) {
        let it; do { it = items[rnd(items.length)]; } while (items.length > 1 && it === last);
        last = it;
        const kana = it.kana, key = kana ? 'r' : 'en';
        const opts = shuffle([it].concat(shuffle(items.filter(q => q[key] !== it[key])).filter((q, i, a) => a.findIndex(x => x[key] === q[key]) === i).slice(0, 2)));
        P.body.innerHTML = `<div class="sc-timer"><i style="width:${Math.max(0, (end - performance.now()) / 400)}%"></i></div><div class="sc-score">${score} ${streak >= 3 ? '🔥' : ''}</div>`
          + `${gridHTML(it.c)}<div class="sc-opts">${opts.map((q, i) => `<button class="sc-opt" data-i="${i}"><kbd>${i + 1}</kbd>${kana ? `<span class="sc-read">${esc2(q.r)}</span>` : meaningHTML(q)}</button>`).join('')}</div>`;
        paintIcons(P.body);
        const bar = P.body.querySelector('.sc-timer i'), tick = setInterval(() => { const left = end - performance.now(); bar.style.width = Math.max(0, left / 400) + '%'; if (left <= 0 && RUN && RUN.wake) RUN.wake({ timeout: true }); }, 100);
        const btns = [...P.body.querySelectorAll('.sc-opt')];
        btns.forEach((b, i) => { b.onclick = () => RUN && RUN.wake && RUN.wake({ i }); });
        KEYH = (e, inInput) => { if (inInput) return false; const m = /^(Digit|Numpad)([1-3])$/.exec(e.code); if (m && RUN && RUN.wake) { RUN.wake({ i: +m[2] - 1 }); return true; } return false; };
        RUN.cur = { kind: 'quick', right: opts.indexOf(it), pick: i => RUN && RUN.wake && RUN.wake({ i }) };
        const r = await waitAnswer();
        clearInterval(tick);
        if (!r || r.quit || r.timeout) break;
        const ok = opts[r.i] === it;
        btns[r.i].classList.add(ok ? 'right' : 'wrong'); if (!ok) btns[opts.indexOf(it)].classList.add('right');
        if (ok) { score++; streak++; Sound.play(streak >= 3 ? 'perfect' : 'review'); } else { streak = 0; Sound.play('wrong'); }
        await sleep(ok ? 260 : 900);
      }
      if (RUN.quit) return { quit: true };
      const best = Math.max(st.best || 0, score), isBest = score > (st.best || 0);
      st.best = best;
      P.body.innerHTML = `<div class="sc-q">Time!</div><div class="sc-score" style="font-size:54px">${score}</div><div class="sc-note">${isBest ? 'A new best!' : `Your best: ${best}`}</div>`;
      Sound.play(isBest ? 'fanfare' : 'chime');
      cheer(true);
      await next('Done');
      if (G.save) G.save();
      return { score };
    } finally { RUN = null; closePanel(); }
  }

  // ============================================================ scenes
  // The teacher says a lines.js line over the room: the English weave, or the whole line with the English under it.
  // o.full: always the whole line (short ones, and the line right after a lesson, where the readings fade).
  async function tsay(key, o = {}) {
    const p = ROOM && ROOM.teacher && ROOM.teacher.st; if (!p) return;
    const Lr = UI.lineFor(key, LEX.tier());
    p.name = plainOf(nm().teacher); p.id = 'school:' + key;
    p.lines = { en: o.full ? (Lr.en || Lr.weave) : Lr.weave, [L()]: Lr.text };
    await STORY.sayInline(p, !!o.full);
  }
  const lineKey = k => `sc.${L()}.${k}`;
  const mimoSparkle = n => { const M = G.sim.mimo; M.happy = 1.5; M.glow = 1; G.w3d.fx.sparkle(M.x, M.ry + 0.8, M.z, n || 16); };
  // the first visit: the teacher says hello, says what a character is made of, and opens the lesson list
  async function meet() {
    const st = S(); st.met = true;
    await tsay(lineKey('hi'), { full: true });
    await tsay(lineKey('parts'));
    await tsay(lineKey('start'));
    if (G.save) G.save();
    await lessonMenu();
  }
  async function talk() {
    if (!S().met) return meet();
    return lessonMenu();
  }
  async function lessonMenu() {
    for (let guard = 0; guard < 12; guard++) {
      const r = await menu();
      if (!r || r.quit) { closePanel(); return; }
      if (r.pick === 'lesson' && r.Ls) { await playLesson(r.Ls); return; }
      if (r.pick === 'quick') { await quickRound(); return; }
      if (r.pick === 'chart') { await chartView(); continue; }
      if (r.pick === 'hat') { const st = S(); st.hatOn = !st.hatOn; Sound.play('pip'); if (G.save) G.save(); continue; }
      closePanel(); return;
    }
  }
  // a lesson, then what it changes: CJK.learn, the teacher's line (its readings fading), the chart, the rewards
  async function playLesson(Ls) {
    const st = S(), l = L(), first = !st.done[Ls.id];
    const r = await runLesson(Ls);
    closePanel();
    if (!r || r.quit) { UI.toast('Lesson stopped. Start it again any time.'); return; }
    const chars = charsOf(Ls), now = CJK.learn(chars, l);
    st.done[Ls.id] = true; st.stars[Ls.id] = Math.max(st.stars[Ls.id] || 0, r.stars); st.last = Ls.id;
    drawChart();
    Sound.play('learned'); mimoSparkle(18);
    if (G.save) G.save();
    await tsay(lineKey('end.' + Ls.id), { full: true });         // (character mode: the new characters' readings fade out right here)
    if (first || now.length) {
      const show = chars.slice(0, 12).join(' ') + (chars.length > 12 ? ' …' : '');
      UI.toast(cmode() === 'chars' ? `✓ ${show}: their readings fade away everywhere` : `✓ ${show}: learned! In character mode their readings are gone`);
    }
    if (first) { await rewards(); await offerMode(Ls); }
    if (G.save) G.save();
  }
  function cardSeal(glyph, l) {
    return `<div style="display:flex;justify-content:center;margin:8px 0"><span lang="${TAG(l)}" style="display:grid;place-items:center;width:110px;height:110px;background:${RED};color:${PAPER};border-radius:10px;transform:rotate(-6deg);font:400 76px ${FONT[l].replace(/"/g, '&quot;')};box-shadow:inset 0 0 0 6px ${RED}, inset 0 0 0 9px ${PAPER}">${esc2(glyph)}</span></div>`;
  }
  function hanamaru() {        // the red spiral flower Japanese teachers draw on great work
    let d = 'M60 60'; for (let a = 0; a < 6 * Math.PI; a += 0.2) { const r = 4 + a * 2.2; d += ` L${(60 + Math.cos(a) * r).toFixed(1)} ${(60 + Math.sin(a) * r).toFixed(1)}`; }
    let petals = ''; for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, x = 60 + Math.cos(a) * 50, y = 60 + Math.sin(a) * 50; petals += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9" fill="none" stroke="${RED}" stroke-width="4"/>`; }
    return `<svg width="150" height="150" viewBox="0 0 120 120"><path d="${d}" fill="none" stroke="${RED}" stroke-width="4" stroke-linecap="round"/>${petals}</svg>`;
  }
  async function rewards() {
    const st = S(), l = L(), n = doneCount(), all = LESSONS().length, mn = G.state.mimoName || 'Mimo';
    if (n >= 2 && !st.stamp) {
      st.stamp = true;
      await tsay(lineKey('stamp'), { full: true });
      Sound.play('chest');
      await UI.card(`<div class="tag">A gift from ${esc2(nm().en)}</div>${cardSeal('学', l)}<div class="big">${l === 'zh' ? 'Your seal stamp' : 'Your hanko'}</div>`
        + `<div class="sub">«学» means learn. Every lesson you finish gets stamped now. <b>E</b></div>`, { kind: 'reveal' });
      if (G.save) G.save();
    }
    if (n >= (l === 'ja' ? 5 : 4) && !st.hat) {
      st.hat = true; st.hatOn = true; hat();
      Sound.play('chest'); mimoSparkle(24);
      await tsay(lineKey('hat'), { full: true });
      UI.toast(`${mn}’s brush hat! (${nm().en}’s list can put it away.)`);
      if (G.save) G.save();
    }
    if (n >= all && !st.cert) {
      st.cert = true;
      await tsay(lineKey('done'), { full: true });
      Sound.play('fanfare');
      await UI.card(`<div class="tag">${esc2(nm().en)}</div>${l === 'ja' ? `<div style="display:flex;justify-content:center">${hanamaru()}</div>` : cardSeal('好', l)}`
        + `<div class="big">${l === 'ja' ? 'Hanamaru!' : '好!'}</div><div class="sub">Every lesson, finished. The quick round is always here for practice. <b>E</b></div>`, { kind: 'reveal' });
      certOn();
      if (G.save) G.save();
    }
  }
  // pinyin / rōmaji mode: after the first lessons, the school offers to switch the game to characters (never forces it)
  async function offerMode(Ls) {
    const st = S(), l = L();
    if (st.offered || cmode() === 'chars' || doneCount() < 2) return;
    st.offered = true;
    await tsay(lineKey('offer'), { full: true });
    G.sim.lock = 1;
    const pick = await UI.choose(l === 'zh' ? 'Play in characters now?' : 'Play in kana and kanji now?', [
      { label: l === 'zh' ? 'Yes: characters, with pinyin over the ones I don’t know yet' : 'Yes: kana and kanji, with readings over the ones I don’t know yet', value: 'yes' },
      { label: 'Not yet', sub: 'Settings → Writing can switch it any time', value: 'no' }]);
    G.sim.lock = 0;
    if (pick === 'yes') {
      CJK.setMode('chars'); UI._lineKey = ''; Sound.play('click');
      UI.toast(l === 'zh' ? 'Characters, with pinyin over them until you know them' : 'Kana & kanji, with readings over them until you know them');
      await tsay(lineKey('end.' + Ls.id), { full: true });      // (the same line again, in characters: what you learned has no reading over it)
    } else UI.toast('OK! Settings → Writing switches it whenever you like.');
    if (G.save) G.save();
  }
  // Rosa (just after she's welcomed you) or Bruno tells you about the school; or you find it yourself
  async function mention(who) {
    const st = S(), l = L(); st.told = who;
    if (!OUT) outdoor();
    const D = OUT && OUT.door, N = G.sim.npc(who);
    // (a cut to the school's front from the street, the signboard in view, while they say where it is)
    if (D && N) G.cam.override = { pos: new THREE.Vector3(D.x + 3.4, 4.0, D.z - 6.2), look: new THREE.Vector3(D.x - 0.9, 1.5, D.z + 0.4), dur: 1.2 };
    try { await STORY.say(who, `sc.${l}.${who}`); } finally { G.cam.override = null; }
    await STORY.you(l === 'zh' ? 'Characters… I’d love to read them. I’ll go and see Teacher Lin!' : 'Kana and kanji… I’d love to read them. I’ll go and see Mori-sensei!');
    if (G.save) G.save();
  }
  const PROVIDER = {         // story.js STORY.extra: outdoors, the door's "Go in", and the nudges toward the school
    interactables() {
      if (!G || !isOn() || !OUT || OUT.broken || !G.state.flags.hatched) return [];
      const Y = G.sim.you, D = OUT.doorIn || OUT.door, d = Math.hypot(D.x - Y.x, D.z - Y.z);
      // (Lena waters this house's plants now and then, standing a step in front of the door: right by the door, the door
      // wins over her "Talk", and the way in is round her side)
      if (d < 1.1 && d > 0.3) { const k = 0.25 / d; return [{ x: Y.x + (D.x - Y.x) * k, z: Y.z + (D.z - Y.z) * k, r: 1.9, label: 'Go in', run: enter }]; }
      return [{ x: D.x, z: D.z, r: 1.9, label: 'Go in', run: enter }];
    },
    tick(dt, Y) {
      if (!isOn() || !G.state.flags.hatched) return;
      if (!OUT) outdoor();
      const st = S(), f = G.state.flags;
      if (st.told || st.met) return;
      const R = G.sim.npc('rosa'), B = G.sim.npc('bruno');
      if (f.rosa && R && Math.hypot(R.x - Y.x, R.z - Y.z) < 7) { STORY.run(() => mention('rosa')); return; }
      if (f.rosa && B && (f.lessons || 0) >= 1 && Math.hypot(B.x - Y.x, B.z - Y.z) < 5) { STORY.run(() => mention('bruno')); return; }
      if (OUT && OUT.door && Math.hypot(OUT.door.x - Y.x, OUT.door.z - Y.z) < 6) {
        st.told = 'sign';
        STORY.think(L() === 'zh' ? `A red lantern, and a sign: «${plainOf('[书法|shū fǎ]')}». Someone teaches writing here!` : `A curtain over the door: «${plainOf('てらこや')}». Some kind of little school?`, 5);
        if (G.save) G.save();
      }
    },
  };

  // ============================================================ in and out (a room: main.js ROOMS, story.js interactables)
  let inside = false, busy = false, certMesh = null;
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    Y.x = x; Y.z = z; Y.yaw = yaw; Y.vx = Y.vz = Y.vy = 0; Y.onGround = true;
    // Mimo at your side (not behind you: in the room that's the wall by the door)
    M.x = x + Math.cos(yaw) * 0.95; M.z = z - Math.sin(yaw) * 0.95; M.station = null; M.look = null; M.hop = null; M.wander = null;
    [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3);
    G.sim.snap();
  }
  function outsideSpot() {
    const h = house(); if (!h) return { x: -24.2, z: -145.6, yaw: Math.PI };
    const p = h.world(h.dlx, h.front + 1.4); return { x: p.x, z: p.z, yaw: h.yaw };
  }
  async function enter() {
    if (!G || inside || busy || !isOn()) return;
    busy = true;
    try {
      if (!ROOM || ROOM.l !== L()) buildRoom(L());
      Sound.play('wood');
      await UI.fade(1, 380);
      inside = true; ROOM.g.visible = true;
      G.w3d.setInterior({ fog: L() === 'ja' ? '#2a2620' : '#2a1d1a', near: 26, far: 70 });
      const sp = SPOT.spawn; teleport(X0 + sp.x, Z0 + sp.z, Math.PI); G.cam.snap(Math.PI, 0.6, 10.5);
      drawChart(); if (S().cert) certOn();
      await UI.fade(0, 380);
    } catch (e) { console.error('[school] enter', e); }
    busy = false;
    const st = S();
    if (!st.visited) { st.visited = true; UI.chapter(nm().placeEn, 'Alba'); }
    if (G.save) G.save();
    if (!st.met) { await STORY.wait(0.5); await meet(); }
    else await tsay(lineKey('back'), { full: true });
  }
  async function leave() {
    if (!G || !inside || busy) return;
    busy = true;
    try {
      Sound.play('wood');
      await UI.fade(1, 380);
      inside = false; if (ROOM) ROOM.g.visible = false; G.w3d.setInterior(null);
      const o = outsideSpot(); [o.x, o.z] = WORLD.pushOut(o.x, o.z, 0.45); teleport(o.x, o.z, o.yaw); G.cam.snap(o.yaw + Math.PI - 0.9, 0.34, 8.5);
      await UI.fade(0, 380);
    } catch (e) { console.error('[school] leave', e); }
    busy = false;
    if (G.save) G.save();
  }
  function certOn() {            // the certificate, framed on the east wall, once every lesson is done
    if (!ROOM || certMesh) return;
    const l = ROOM.l, t = canvasTex(256, 320, c => {
      c.fillStyle = '#5a3a22'; c.fillRect(0, 0, 256, 320); c.fillStyle = '#fbf6ea'; c.fillRect(14, 14, 228, 292);
      if (l === 'ja') { c.strokeStyle = RED; c.lineWidth = 6; c.beginPath(); for (let a = 0; a < 6 * Math.PI; a += 0.2) { const r = 6 + a * 4; c.lineTo(128 + Math.cos(a) * r, 150 + Math.sin(a) * r); } c.stroke(); }
      else { c.font = `400 170px ${FONT.zh}`; c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('好', 128, 150); }
      seal(c, 190, 268, 44, '学', FONT[l]);
    });
    certMesh = plane(0.75, 0.94, t); certMesh.position.set(HW - 0.04, 2.0, 1.2); certMesh.rotation.y = -HALF; ROOM.g.add(certMesh);
  }
  function roomItems() {
    const list = []; if (!inside || busy || !ROOM) return list;
    const A = (p, r, label, run) => list.push({ x: X0 + p.x, z: Z0 + p.z, y: Y0, r, label, run });
    const l = L(), n = doneCount();
    A(SPOT.exit, 1.3, 'Leave', leave);
    A({ x: SPOT.teacher.x, z: SPOT.teacher.z + 1.2 }, 2.4, 'Talk', talk);
    A(SPOT.chart, 1.5, 'Look', async () => { await chartView(); });
    A(SPOT.scrollW, 1.3, 'Read', () => SIGNS.read(scrollCard('W')));
    A(SPOT.scrollE, 1.3, 'Read', () => SIGNS.read(scrollCard('E')));
    A(SPOT.practice[l], 1.5, 'Practice', async () => {
      if (n < 2) { STORY.think(`The practice desk: paper, a brush, ink. ${nm().who} says it’s for after the first two lessons.`, 4.5); return; }
      await quickRound();
    });
    return list;
  }
  function scrollCard(side) {
    const zh = L() === 'zh';
    const T = zh ? { W: ['[学而时习之|xué ér shí xí zhī]', 'Learn, and practice what you learned, again and again. (Confucius)'], E: ['[熟能生巧|shú néng shēng qiǎo]', 'Practice makes perfect.'] }
      : { W: ['[七転|ななころ]び [八起|やお]き', 'Fall down seven times, get up eight.'], E: ['[一期一会|いちごいちえ]', 'One time, one meeting: treasure every moment.'] };
    const [text, en] = T[side];
    return { tag: zh ? 'A hanging scroll' : 'A hanging scroll (掛け軸)', lines: [{ text, en, look: { face: '#f6efdc', edge: zh ? '#3a5a7a' : '#6b4a6e' } }] };
  }
  function signCard() {
    const zh = L() === 'zh';
    return zh ? { tag: 'The signs by the door', lines: [{ text: '[书法|shū fǎ]', en: 'calligraphy (the art of writing characters)', look: { face: '#1d1822', edge: '#c9a24a', ink: '#e8c35a' } },
      { text: '[林|Lín] [老师|lǎo shī]', en: 'Teacher Lin', look: { face: '#1d1822', edge: '#c9a24a', ink: '#e8c35a' } }] }
      : { tag: 'The sign and the curtain', lines: [{ text: '[寺子屋|てらこや]', en: 'a terakoya: a little school, the old kind', look: { face: '#d9b27a', edge: '#5a3a22' } },
        { text: 'てらこや', en: 'the same word, in hiragana, on the door curtain', look: { face: '#27406b', edge: '#1d2a44', ink: '#fffaf0' } }] };
  }
  // (the walls are thin: a long hop could carry Mimo over one and down to the woods below; keep everyone in the room)
  function keepIn() {
    const lim = (v, c, h) => Math.max(c - h, Math.min(c + h, v)), M = G.sim.mimo, Y = G.sim.you;
    if (!M.hidden && (Math.abs(M.x - X0) > HW - 0.3 || Math.abs(M.z - Z0) > HD - 0.3 || M.y < Y0 - 1)) {
      M.hop = null; M.wander = null; M.x = lim(M.x, X0, HW - 0.7); M.z = lim(M.z, Z0, HD - 0.7); M.y = M.ry = Y0;
    }
    if (M.wander && (Math.abs(M.wander.x - X0) > HW - 0.7 || Math.abs(M.wander.z - Z0) > HD - 0.7)) { M.wander.x = lim(M.wander.x, X0, HW - 0.8); M.wander.z = lim(M.wander.z, Z0, HD - 0.8); }
    if (Y.y < Y0 - 2 || Math.abs(Y.x - X0) > HW + 0.5 || Math.abs(Y.z - Z0) > HD + 0.5) { const sp = SPOT.spawn; teleport(X0 + sp.x, Z0 + sp.z, Math.PI); }
  }
  function roomUpdate(dt, t) {
    if (!inside || !ROOM) return;
    keepIn();
    animateTeacher(dt, t);
    ROOM.sprites.forEach((s, i) => { s.material.opacity = 0.38 + 0.08 * Math.sin(t * 5.3 + i * 2.1) + 0.04 * Math.sin(t * 13 + i); });
    // (a scene that broke off never leaves you frozen)
    if (G.sim.lock && !STORY.busy && !panelOpen() && !busy) { G.sim.lock = 0; G.cam.override = null; }
  }

  // ============================================================ the quest (QUESTS.LIST): find the school, and learn
  function quest() {
    const sc = s => s.school || {}, lg = s => (s.lang === 'ja' ? 'ja' : 'zh');
    const n = s => (lg(s) === 'ja' ? JA : ZH).filter(Ls => sc(s).done && sc(s).done[Ls.id]).length;
    const door = () => (inside ? { x: X0 + SPOT.teacher.x, z: Z0 + SPOT.teacher.z + 1.2 } : OUT && OUT.door ? OUT.door : null);
    const ZHQ = s => lg(s) === 'zh';
    return {
      id: 'school', kind: 'side',
      get title() { return L() === 'ja' ? 'Mori-sensei’s terakoya' : 'Teacher Lin’s characters'; },
      get giver() { return L() === 'ja' ? 'Rosa, about Mori-sensei’s little school' : 'Rosa, about Teacher Lin the calligrapher'; },
      started: s => (s.lang === 'zh' || s.lang === 'ja') && !!(sc(s).told || sc(s).met),
      steps: [
        { get text() { return L() === 'ja' ? 'Visit Mori-sensei’s terakoya, across the street from Bruno’s yard' : 'Visit Teacher Lin, the calligrapher across the street from Bruno’s yard'; },
          why: 'Characters are made of parts, and once you know a character, its reading fades away for good. Learn them on purpose at the school.',
          done: s => !!sc(s).met, target: door, hint: '{mimo} points at the house with the signboard, across from Bruno’s yard.' },
        { get text() { return L() === 'ja' ? 'Learn your first hiragana ({n}/2 lessons)' : 'Learn your first characters ({n}/2 lessons)'; }, n: s => Math.min(2, n(s)),
          why: 'Short lessons: meet the characters, match pictures, type them, read a sign. Every one you learn loses its reading all over the world.',
          done: s => n(s) >= 2, target: door, hint: '{mimo} tugs you toward the school. Lesson time!' },
        { get text() { return L() === 'ja' ? 'Learn all the hiragana, for {mimo}’s brush hat ({n}/5)' : 'Earn {mimo}’s brush hat ({n}/4 lessons)'; }, n: s => Math.min(ZHQ(s) ? 4 : 5, n(s)),
          why: 'The teacher has a little brush hat for {mimo}, for a diligent student.', done: s => n(s) >= (ZHQ(s) ? 4 : 5), target: door, hint: '{mimo} points at the school. That hat!' },
        { get text() { return `Finish every lesson ({n}/${L() === 'ja' ? 8 : 6})`; }, n: s => n(s),
          why: 'The last lessons: the water radical, or katakana and the first kanji.', done: s => n(s) >= (ZHQ(s) ? ZH.length : JA.length), target: door, hint: '{mimo} points at the school.' },
      ],
      story: [
        { when: s => !!sc(s).met, get text() { return L() === 'ja' ? 'Across from Bruno’s yard, Mori-sensei (森: three trees) runs a terakoya, a little school, and teaches hiragana a row or two at a time, then katakana and the first kanji.' : 'Across from Bruno’s yard, Teacher Lin (林: two trees) teaches characters through their parts: 日 and 月 make 明, bright; three trees make a forest.'; } },
        { when: s => !!sc(s).stamp, text: 'You got your own seal stamp, «学»: learn.' },
        { when: s => !!sc(s).hat, text: '{mimo} wears a little brush hat now.' },
        { when: s => !!sc(s).cert, text: 'You finished every lesson at the school. The quick round is always there for practice.' },
      ],
    };
  }

  // ============================================================ the mini-map's mark (minimap.js): a red seal on the school's door
  const MARK = {};
  function mapMark(dpr) {
    if (!G || !isOn() || !OUT || OUT.broken || !OUT.door) return null;
    const k = L() + dpr;
    if (!MARK[k]) {
      const cv = document.createElement('canvas'), s = 18; cv.width = cv.height = Math.ceil(s * dpr);
      const c = cv.getContext('2d'); c.scale(dpr, dpr);
      c.fillStyle = RED; c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.rect(2, 2, s - 4, s - 4); c.fill(); c.stroke();
      c.fillStyle = PAPER; c.font = `700 11px ${FONT[L()]}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(L() === 'ja' ? 'あ' : '字', s / 2, s / 2 + 0.5);
      MARK[k] = cv;
    }
    return { x: OUT.door.x, z: OUT.door.z, img: MARK[k] };
  }

  // ============================================================ test drivers (SCHOOL._.t, for the browser console and test pages; the game never calls them)
  const TESTS = (() => {
    const tick = ms => new Promise(r => setTimeout(r, ms));
    const g = () => window.__g;
    // a game just after Rosa's welcome in Alba (story zones done, Bruno at his yard); school: the state to start from
    function setupAlba(school) {
      const G = g().game, f = G.state.flags;
      Object.assign(f, { hatched: true, guideMet: true, guide: true, escort: false, escorted: true, rosa: true, lessons: 2 });
      ['hushwave', 'hush', 'lookout', 'glade', 'exit', 'guide', 'gate', 'pass'].forEach(z => { f['z_' + z] = true; });
      const B = G.sim.npc('bruno'), P = WORLD.L.people.brunoYard; B.x = P[0]; B.z = P[1]; B.baseYaw = B.yaw = P[2]; B.y = G.sim.ground(B.x, B.z);
      const s = WORLD.extra.find(c => c.npc === 'bruno'); if (s) { s.x = B.x; s.z = B.z; }
      G.state.school = school || { told: 'rosa', done: {}, stars: {} };
      const learn = LESSONS().filter(Ls => G.state.school.done[Ls.id]).map(charsOf).join('');
      if (learn) CJK.learn(learn, L());
    }
    async function waitFor(fn, sec = 6) { for (let i = 0; i < sec * 10 && !fn(); i++) { await g().go(0.05); await tick(60); } return !!fn(); }
    // one answer in the panel (right, or o.wrong); resolves when the next question shows
    async function step(o = {}) {
      const R = RUN; if (!R || !R.cur) return 'none';
      const c = R.cur, k = c.kind;
      if (k === 'next') c.next(); else if (k === 'choice') c.pick(o.wrong ? (c.right + 1) % 3 : c.right); else if (k === 'match' || k === 'build') c.solve();
      else if (k === 'type') await c.type(o.typed || c.spell); else if (k === 'quick') c.pick(c.right); else if (k === 'menu') c.pick(o.pick || { pick: 'lesson', id: (nextLesson() || {}).id });
      for (let i = 0; i < 40; i++) { await tick(100); if (!RUN || RUN.cur !== c) break; }
      return k + ' → ' + (RUN ? RUN.round + '/' + (RUN.cur && RUN.cur.kind) : 'done');
    }
    async function until(round, max = 40) { const log = []; for (let i = 0; i < max; i++) { if (!RUN || RUN.round === round) break; log.push(await step()); } return log; }
    // play on: lines (E), cards (E), menus (the first choice), the panel (right answers), until no scene is running
    async function drive(o = {}) {
      const log = [];
      for (let i = 0; i < (o.max || 300); i++) {
        if (panelOpen() && RUN && RUN.cur) { if (o.stopAt && RUN.round === o.stopAt) break; await step(); continue; }
        const card = document.querySelector('#card:not(.hidden)');
        if (card && card.textContent.trim()) { log.push('card: ' + card.textContent.replace(/\s+/g, ' ').slice(0, 50)); if (o.stopAtCard) break; dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true, cancelable: true })); await tick(400); continue; }
        const ch = document.querySelector('#choose:not(.hidden)');
        if (ch) { log.push('choose: ' + ch.textContent.slice(0, 40)); (ch.querySelectorAll('button')[o.choose || 0]).click(); await tick(300); continue; }
        if (STORY.line) { if (STORY.line.full) { log.push((STORY.line.text || '').slice(0, 40)); await g().press(); } else await g().go(0.3); continue; }
        if (!STORY.busy) break;
        await g().go(0.1); await tick(60);
      }
      return log;
    }
    async function enterNow() { STORY.run(() => enter()); await waitFor(() => inside && !busy, 8); return drive(); }
    async function lesson(id, o = {}) { const Ls = LESSONS().find(q => q.id === id); STORY.run(() => playLesson(Ls)); await tick(300); return drive(o); }
    return { setupAlba, waitFor, step, until, drive, enterNow, lesson };
  })();

  // ============================================================ the game side
  function init(game) {
    G = game;
    registerLines();
    try { if (typeof CJK !== 'undefined') CJK.addSource(sources()); } catch (e) { console.error('[school]', e); }
    if (typeof INTERIORS !== 'undefined' && INTERIORS.claim) INTERIORS.claim(id => id === DOOR_ID && isOn());
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'school')) QUESTS.LIST.push(quest());
  }
  return {
    init,
    // as a room (main.js ROOMS; story.js asks the room you're in for its interactables)
    get inside() { return inside; },
    get OUTSIDE() { return inside ? outsideSpot() : null; },
    interactables() { return inside ? roomItems() : []; },
    update(dt, t) { roomUpdate(dt, t); },
    curiosities() { return []; },
    target() { if (!inside) return null; return { x: X0 + SPOT.teacher.x, z: Z0 + SPOT.teacher.z + 1.2, hint: `{mimo} points at ${nm().who}.` }; },
    get busy() { return busy || panelOpen(); },
    enter, leave,
    // outdoors, every frame (main.js): the signboard, the lantern, the noren, the solid; Mimo's hat
    outdoor(dt, t) {
      outdoor();
      if (OUT && !OUT.broken && !OUT.signed && typeof SIGNS !== 'undefined' && SIGNS.add) { OUT.signed = true; SIGNS.add({ id: 'school-sign', x: OUT.sign.x, z: OUT.sign.z, r: 1.4, when: () => isOn() && !inside, card: () => signCard() }); }
      if (G && G.state && G.state.school && G.state.school.hat) { const h = hat(); if (h) h.visible = hatOn(); }
      else if (HAT) HAT.visible = false;
    },
    claims: id => id === DOOR_ID && isOn(),
    hatOn, mapMark,
    DOOR_ID, ROOM_AT: { x: X0, y: Y0, z: Z0 },
    // tests and tools
    _: { S: () => S(), ZH, JA, LT, LESSONS, charsOf, itemsOf, sources, runLesson, playLesson, menu, talk, meet, quickRound, chartView, rewards, offerMode, mention,
      tsay, drawChart, PROVIDER, house, outsideSpot, SPOT, get OUT() { return OUT; }, get ROOM() { return ROOM; }, get RUN() { return RUN; }, get PANEL() { return PANEL; },
      panelOpen, closePanel, kanaOfSrc, nextLesson, doneCount, quest, t: TESTS },
  };
})();
