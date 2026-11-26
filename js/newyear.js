'use strict';
// Longlong (龙龙), the New Year kid (DESIGN.md 14.11). zh games only. The user: "a little kid obsessed with the chinese new
// year, dragons, and overall chinese culture" … "their own unique and extensive side plots that give plenty of rich side
// content to people replaying the game in a new language".
//
// WHO: 龙龙 Lóng long, about eight, in a red dragon hoodie with gold horns, waving a toy dragon on a stick; Grandpa Chen's
// grandson (cards.js). Born in a dragon year, so everyone calls him 龙龙. His mom and dad work in the big city.
// WHERE: by Alba's bell tower, on its north-east side (his "dragon den": a cardboard box with a dragon face, a zodiac poster).
// The bell tower is his favourite place: on old bells sits 蒲牢, the dragon's son who loves to roar.
// CHAPTERS (gated like the other side characters: Rosa's welcome, the big Hushling, bells 1, 2, 3):
//   1 十二生肖 The twelve animals: the race, their names in order, «你属什么？» (your birth year, said digit by digit) → «我属…»
//   2 红包 Red envelopes: the wishes (新年快乐 恭喜发财 身体健康 万事如意 龙马精神); greet five grown-ups around Alba with the
//     right one (shopkeepers, elders, Bruno) for a 红包 each; «恭喜发财，红包拿来！»
//   3 春联 · 福 Couplets and 福: read the couplets aloud, tell the first line by its last tone, tell {mimo} where to stick them
//     (贴在右边！), and the upside-down 福 (福到了！); they stay on the bell tower's door
//   4 龙舟 · 灯谜 Dragon boats and lantern riddles: 屈原 and 粽子, a toy dragon-boat race on the pond (shout 划！), five riddles
//   5 过年 The festival: New Year's Eve in the plaza: lanterns, 锣鼓 (Grandpa Chen drums, Grandpa Hu on the gong), the dragon
//     dance you call (左 右 转 跳 抬头 低头) with {mimo} riding the dragon's head; then the 年兽, a Nian made of the Hush, driven off
//     by noise and red (放鞭炮 敲锣 打鼓 点灯笼 新年快乐); Longlong's parents come home (团圆); {mimo}'s dragon headband
// API: NEWYEAR.init(game) · NEWYEAR.build(scene, env) → { colliders, group, people, update } · NEWYEAR.hatOn() (main.js: the straw
// hat steps aside) · NEWYEAR.quest() · NEWYEAR._ (tests: NEWYEAR._.t). State: G.state.ny. Phrases: ph.ny.*.

const NEWYEAR = (() => {
  const H = (s, o) => ZHF.H(s, o), Pl = s => ZHF.P(s), esc = ZHF.esc;
  const NAMES = { kid: '[龙龙|Lóng long]', dad: '[龙龙|Lóng long] [爸爸|bà ba]', mom: '[龙龙|Lóng long] [妈妈|mā ma]', chen: '[陈|Chén] [爷爷|yé ye]', hu: '[胡|Hú] [爷爷|yé ye]',
    rosa: '[罗莎|Luó shā] [奶奶|nǎi nai]', bruno: '[布鲁诺|Bù lǔ nuò]', baker: '[玛尔塔|Mǎ ěr tǎ]', nian: '[年兽|nián shòu]' };
  // ================================================================ the twelve animals (生肖), in the race's order
  const ANIMALS = [
    ['[鼠|shǔ]', 'rat', '#8a8f9e'], ['[牛|niú]', 'ox', '#8d5733'], ['[虎|hǔ]', 'tiger', '#f29a3a'], ['[兔|tù]', 'rabbit', '#f4efe2'],
    ['[龙|lóng]', 'dragon', '#d6332a'], ['[蛇|shé]', 'snake', '#4f9a5a'], ['[马|mǎ]', 'horse', '#a8673a'], ['[羊|yáng]', 'goat', '#e8e2d0'],
    ['[猴|hóu]', 'monkey', '#b8864f'], ['[鸡|jī]', 'rooster', '#e8c35a'], ['[狗|gǒu]', 'dog', '#c99a62'], ['[猪|zhū]', 'pig', '#f2a8b8'],
  ].map(([src, en, col], i) => ({ i, src, en, col, ch: src.replace(/\[([^|]+)\|.*$/, '$1') }));
  const animalOf = year => ANIMALS[((year - 4) % 12 + 12) % 12];
  // a paper-cut medallion: the animal's character, white on red (剪纸)
  const medal = (A, big) => `<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><div style="width:${big ? 86 : 64}px;height:${big ? 86 : 64}px;border-radius:50%;background:#c8322a;border:3px solid #2b2235;box-shadow:inset 0 0 0 4px #e8c35a;display:grid;place-items:center;color:#fffaf0;font:900 ${big ? 46 : 34}px ${ZHF.FONT}">${A.ch}</div><small style="font-weight:800;opacity:.7">${A.en}</small></div>`;
  // reading a year typed digit by digit: «一九九八年», «yī jiǔ jiǔ bā nián», or «1998» (accepted, with a nudge)
  const DIG = { 零: 0, 〇: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }, DSY = { ling: 0, yi: 1, er: 2, san: 3, si: 4, wu: 5, liu: 6, qi: 7, ba: 8, jiu: 9 };
  function readYear(text) {
    const { U } = CJK.typed(String(text || ''), 'zh'); let ds = [], arabic = false, nian = false;
    for (const u of U) {
      if (u.digit) { String(u.raw).split('').forEach(c => ds.push(+c)); arabic = true; }
      else if (u.han && DIG[u.ch] !== undefined) ds.push(DIG[u.ch]);
      else if (u.han && u.ch === '年') nian = true;
      else if (!u.han && DSY[u.syl] !== undefined) ds.push(DSY[u.syl]);
      else if (!u.han && u.syl === 'nian') nian = true;
    }
    if (ds.length !== 4) return null;
    const y = ds.reduce((a, d) => a * 10 + d, 0);
    return y >= 1900 && y <= 2099 ? { y, arabic, nian } : null;
  }
  const yearSrc = y => String(y).split('').map(d => ['[零|líng]', '[一|yī]', '[二|èr]', '[三|sān]', '[四|sì]', '[五|wǔ]', '[六|liù]', '[七|qī]', '[八|bā]', '[九|jiǔ]'][+d]).join(' ') + ' [年|nián]';
  // ================================================================ the New Year wishes, and who gets which
  const WISH = {
    xinnian: '[新年|xīn nián] [快乐|kuài lè] ！', gongxi: '[恭喜|gōng xǐ] [发财|fā cái] ！', jiankang: '[身体|shēn tǐ] [健康|jiàn kāng] ！', wanshi: '[万事|wàn shì] [如意|rú yì] ！',
    longma: '[龙马|lóng mǎ] [精神|jīng shén] ！', guonian: '[过年|guò nián] [好|hǎo] ！',
  };
  const GENERIC = ['xinnian', 'wanshi', 'guonian'];
  const ELDERS = [
    { id: 'chen', best: ['jiankang', 'longma'], why: 'an elder: wish him good health (身体健康)' },
    { id: 'hu', best: ['jiankang', 'longma'], why: 'an elder: wish him good health (身体健康)' },
    { id: 'rosa', best: ['jiankang', 'gongxi'], why: 'a grandma with a stall: good health (身体健康) or wealth (恭喜发财)' },
    { id: 'bruno', best: ['longma', 'jiankang'], why: 'the strongest man in Alba: the spirit of a dragon-horse (龙马精神)' },
    { id: 'baker', best: ['gongxi'], why: 'she runs a bakery: wish her wealth (恭喜发财)' },
  ];
  // ================================================================ the couplets (春联) for the bell tower's door
  const COUPLET = { up: '[春|chūn] [回|huí] [大|dà] [地|dì]', down: '[福|fú] [满|mǎn] [人|rén] [间|jiān]', top: '[万|wàn] [象|xiàng] [更|gēng] [新|xīn]',
    upEn: 'Spring comes back to the earth', downEn: 'Happiness fills the world', topEn: 'Everything is made new' };
  // ================================================================ the lantern riddles (灯谜)
  const RIDDLES = [
    { q: '[太阳|tài yáng] [和|hé] [月亮|yuè liang] [在|zài] [一起|yī qǐ] 。', en: 'The sun and the moon, together.', a: '[明|míng]', alts: ['[明亮|míng liàng]'], aEn: '明: bright (日 + 月)', pick: ['[明|míng]', '[林|lín]', '[朋|péng]'] },
    { q: '[一|yī] [个|gè] [人|rén] [靠|kào] [着|zhe] [一|yī] [棵|kē] [树|shù] 。', en: 'A person leaning on a tree.', a: '[休|xiū]', alts: ['[休息|xiū xi]'], aEn: '休: to rest (亻 + 木)', pick: ['[休|xiū]', '[体|tǐ]', '[森|sēn]'] },
    { q: '[两|liǎng] [个|gè] [月亮|yuè liang] [手|shǒu] [拉|lā] [手|shǒu] 。', en: 'Two moons, hand in hand.', a: '[朋|péng]', alts: ['[朋友|péng you]'], aEn: '朋: a friend (月 + 月, as in 朋友)', pick: ['[朋|péng]', '[明|míng]', '[多|duō]'] },
    { q: '[千|qiān] [条|tiáo] [线|xiàn] ， [万|wàn] [条|tiáo] [线|xiàn] ， [掉|diào] [到|dào] [水|shuǐ] [里|lǐ] [看不见|kàn bù jiàn] 。', en: 'A thousand threads, ten thousand threads: they fall in the water and vanish.', a: '[雨|yǔ]', alts: ['[下雨|xià yǔ]'], aEn: '雨: rain', pick: ['[雨|yǔ]', '[雪|xuě]', '[风|fēng]'] },
    { q: '[红红|hóng hóng] [的|de] [脸|liǎn] ， [圆|yuán] [又|yòu] [圆|yuán] ， [咬|yǎo] [一|yī] [口|kǒu] ， [脆|cuì] [又|yòu] [甜|tián] 。', en: 'A red, red face, round and round. Take a bite: crunchy and sweet.', a: '[苹果|píng guǒ]', alts: [], aEn: '苹果: an apple', pick: ['[苹果|píng guǒ]', '[西瓜|xī guā]', '[月饼|yuè bǐng]'] },
  ];
  // ================================================================ the dragon dance's calls, and what drives off the Nian
  const MOVES = [
    { id: 'left', src: '[左|zuǒ]', alts: ['[左边|zuǒ biān]', '[向左|xiàng zuǒ]', '[往左|wǎng zuǒ]', '[左转|zuǒ zhuǎn]'], en: 'Left!', icon: '⬅' },
    { id: 'right', src: '[右|yòu]', alts: ['[右边|yòu biān]', '[向右|xiàng yòu]', '[往右|wǎng yòu]', '[右转|yòu zhuǎn]'], en: 'Right!', icon: '➡' },
    { id: 'spin', src: '[转|zhuàn]', alts: ['[转圈|zhuàn quān]', '[转|zhuǎn]'], en: 'Spin!', icon: '⟳' },
    { id: 'jump', src: '[跳|tiào]', alts: ['[跳起来|tiào qǐ lái]'], en: 'Jump!', icon: '⤴' },
    { id: 'up', src: '[抬头|tái tóu]', alts: [], en: 'Head up!', icon: '⬆' },
    { id: 'down', src: '[低头|dī tóu]', alts: [], en: 'Head down!', icon: '⬇' },
  ];
  const NIAN_BEATS = [
    { id: 'pao', src: '[放|fàng] [鞭炮|biān pào] ！', alts: ['[鞭炮|biān pào]'], en: 'Set off the firecrackers!', title: 'The Nian creeps into the plaza. Fire and noise: tell them to set off the firecrackers!', push: 0.25 },
    { id: 'luo', src: '[敲|qiāo] [锣|luó] ！', alts: ['[打|dǎ] [锣|luó]'], en: 'Bang the gong!', title: 'It shakes off the smoke. Tell Grandpa Hu to bang the gong!', push: 0.2 },
    { id: 'gu', src: '[打鼓|dǎ gǔ] ！', alts: ['[敲|qiāo] [鼓|gǔ]'], en: 'Beat the drum!', title: 'Louder! Tell Grandpa Chen to beat the drum!', push: 0.2 },
    { id: 'deng', src: '[点|diǎn] [灯笼|dēng long] ！', alts: ['[挂|guà] [灯笼|dēng long]', '[红|hóng] [灯笼|dēng long]'], en: 'Light the lanterns!', title: 'It hates red! Tell everyone to light the red lanterns!', push: 0.2 },
    { id: 'xinnian', src: '[新年|xīn nián] [快乐|kuài lè] ！', alts: ['[过年|guò nián] [好|hǎo]'], en: 'Happy New Year!', title: 'Everyone together now: shout it!', push: 0.15 },
  ];

  // ================================================================ the Phrasebook (LEX kind 'phrase')
  const R_NY = 'Chinese New Year (春节)';
  const PH = [
    { id: 'ph.ny.shu', zh: '[你|nǐ] [属|shǔ] [什么|shén me] ？', en: 'What’s your zodiac animal?', note: 'Literally «you belong to what?». Your animal comes from the year you were born.', sit: 'You want to know someone’s zodiac animal. Ask!' },
    { id: 'ph.ny.shulong', zh: '[我|wǒ] [属|shǔ] [龙|lóng] 。', en: 'I was born in the Year of the Dragon.', note: '属 + the animal: 我属马, 我属猪… Longlong is very proud of his.', sit: 'Someone asks 你属什么？ and you’re a dragon. Answer!' },
    { id: 'ph.ny.xinnian', zh: WISH.xinnian, en: 'Happy New Year!', note: 'Fine for anyone. 过年好！ is the casual one.', sit: 'It’s New Year! Wish someone a happy New Year.' },
    { id: 'ph.ny.gongxi', zh: WISH.gongxi, en: 'Wishing you wealth!', note: 'The classic New Year wish: perfect for shopkeepers and anyone with a business.', sit: 'You walk into the bakery at New Year. Wish the baker wealth!' },
    { id: 'ph.ny.jiankang', zh: WISH.jiankang, en: 'Good health!', note: 'The best wish for grandparents and older people.', sit: 'You visit an old grandpa at New Year. Wish him good health!' },
    { id: 'ph.ny.wanshi', zh: WISH.wanshi, en: 'May everything go your way!', note: 'A wish for anyone: «ten thousand things as you wish».', sit: 'Wish a friend that everything goes their way this year.' },
    { id: 'ph.ny.longma', zh: WISH.longma, en: 'The spirit of a dragon-horse! (lots of energy)', note: 'A wish for vigor, for energetic people of any age.', sit: 'Bruno does push-ups every morning. Wish him the spirit of a dragon-horse!' },
    { id: 'ph.ny.hongbao', zh: '[恭喜|gōng xǐ] [发财|fā cái] ， [红包|hóng bāo] [拿来|ná lái] ！', en: 'Wishing you wealth: now hand over the red envelope!', note: 'What cheeky kids say at New Year. As a joke, only!', register: 'slang', sit: 'Joke with Longlong the way cheeky kids do at New Year.' },
    { id: 'ph.ny.fudaole', zh: '[福|fú] [到|dào] [了|le] ！', en: 'Good fortune has arrived!', note: '倒 (upside down) sounds like 到 (arrived). That’s why 福 is stuck on doors upside down.', sit: 'Longlong stuck the 福 upside down on purpose. Say why it’s lucky!' },
    { id: 'ph.ny.bianpao', zh: '[放|fàng] [鞭炮|biān pào] ！', en: 'Set off the firecrackers!', note: 'Noise and red scare off the Nian, the New Year monster.', sit: 'The Nian is coming! What should everyone do?' },
    { id: 'ph.ny.niannian', zh: '[年年|nián nián] [有余|yǒu yú] ！', en: 'May you have more than enough, every year!', note: '余 (a surplus) sounds like 鱼 (fish): that’s why there’s always fish at the New Year’s Eve dinner.', sit: 'There’s a whole fish on the New Year’s Eve table. Say the wish that goes with it!' },
    { id: 'ph.ny.tuanyuan', zh: '[团圆|tuán yuán]', en: 'the whole family together again', note: 'The heart of Chinese New Year: everyone comes home, however far away they work.', sit: 'Longlong’s mom and dad came home for New Year. The family is…?' },
  ];
  PH.forEach(p => { p.region = p.region || R_NY; p.register = p.register || 'casual'; p.icon = 'nyLantern'; });
  const PHI = Object.fromEntries(PH.map(p => [p.id, p]));
  // ================================================================ what they say (CJK.md notation; kids talk casually; never about your gender)
  const T2 = (zh, en) => ({ zh: [zh], en: [en] });
  const LT = {
    'ny.kid.roar': T2('[嗷|áo] [呜|wū] ！ [我|wǒ] [是|shì] [龙|lóng] ！', 'Rawr! I’m a dragon!'),
    'ny.kid.hi': T2('[我|wǒ] [叫|jiào] [龙龙|Lóng long] ！ [我|wǒ] [属|shǔ] [龙|lóng] ， [所以|suǒ yǐ] [大家|dà jiā] [叫|jiào] [我|wǒ] [龙龙|Lóng long] 。', 'I’m Longlong! I was born in the Year of the Dragon, so everyone calls me Longlong.'),
    'ny.kid.grandpa': T2('[我|wǒ] [爷爷|yé ye] [在|zài] [那边|nà biān] [打牌|dǎ pái] 。 [他|tā] [是|shì] [炸弹王|Zhà dàn wáng] ！', 'My grandpa plays cards over there. He’s the Bomb King!'),
    'ny.kid.bell': T2('[你|nǐ] [知道|zhī dào] [吗|ma] ？ [钟|zhōng] [上|shang] [有|yǒu] [一|yī] [条|tiáo] [小|xiǎo] [龙|lóng] ， [叫|jiào] [蒲牢|Pú láo] 。 [它|tā] [最|zuì] [喜欢|xǐ huan] [大声|dà shēng] [叫|jiào] ！', 'Did you know? On bells there’s a little dragon called Pulao. He loves to roar really loud!'),
    'ny.kid.bell2': T2('[钟|zhōng] [不|bù] [响|xiǎng] [了|le] ， [蒲牢|Pú láo] [一定|yī dìng] [很|hěn] [难过|nán guò] 。', 'The bells stopped ringing. Pulao must be so sad.'),
    'ny.kid.zodiac': T2('[我们|wǒ men] [有|yǒu] [十二|shí èr] [个|gè] [生肖|shēng xiào] 。 [每|měi] [年|nián] [一|yī] [个|gè] [动物|dòng wù] ！', 'There are twelve zodiac animals. One animal for each year!'),
    'ny.kid.race': T2('[很|hěn] [久|jiǔ] [以前|yǐ qián] ， [动物|dòng wù] [们|men] [比赛|bǐ sài] [过|guò] [河|hé] 。 [老鼠|lǎo shǔ] [坐|zuò] [在|zài] [牛|niú] [的|de] [头|tóu] [上|shang] ， [最后|zuì hòu] [跳|tiào] [下来|xià lái] ： [第一|dì yī] ！', 'Long ago, the animals raced across a river. The rat rode on the ox’s head, and jumped off at the very end: first place!'),
    'ny.kid.cat': T2('[猫|māo] [呢|ne] ？ [老鼠|lǎo shǔ] [没|méi] [叫|jiào] [它|tā] [起床|qǐ chuáng] 。 [所以|suǒ yǐ] [猫|māo] [一直|yī zhí] [追|zhuī] [老鼠|lǎo shǔ] ！', 'And the cat? The rat never woke it up. That’s why cats always chase rats!'),
    'ny.kid.yourYear': T2('[你|nǐ] [属|shǔ] [什么|shén me] ？ [你|nǐ] [哪|nǎ] [年|nián] [出生|chū shēng] [的|de] ？', 'What’s your animal? What year were you born?'),
    'ny.kid.done1': T2('[太|tài] [好|hǎo] [了|le] ！ [你|nǐ] [都|dōu] [记住|jì zhù] [了|le] ！ [下次|xià cì] [我|wǒ] [教|jiāo] [你|nǐ] [拜年|bài nián] ！', 'Great! You remember them all! Next time I’ll teach you New Year greetings!'),
    'ny.kid.hongbao': T2('[过年|guò nián] [的|de] [时候|shí hou] ， [大人|dà ren] [给|gěi] [红包|hóng bāo] 。 [里面|lǐ miàn] [有|yǒu] [钱|qián] ！', 'At New Year, grown-ups hand out red envelopes. There’s money inside!'),
    'ny.kid.rule': T2('[可是|kě shì] [你|nǐ] [要|yào] [先|xiān] [说|shuō] [吉祥话|jí xiáng huà] ！ [说|shuō] [对|duì] [了|le] ， [才|cái] [有|yǒu] [红包|hóng bāo] 。', 'But first you have to say a lucky wish! Say the right one, and you get a red envelope.'),
    'ny.kid.who': T2('[老人|lǎo rén] ： [身体|shēn tǐ] [健康|jiàn kāng] 。 [开|kāi] [店|diàn] [的|de] ： [恭喜|gōng xǐ] [发财|fā cái] 。 [大家|dà jiā] ： [新年|xīn nián] [快乐|kuài lè] ！', 'Old people: good health. Shopkeepers: wishing you wealth. Everyone: Happy New Year!'),
    'ny.kid.go': T2('[去|qù] [给|gěi] [我|wǒ] [爷爷|yé ye] ， [胡|Hú] [爷爷|yé ye] ， [罗莎|Luó shā] [奶奶|nǎi nai] ， [布鲁诺|Bù lǔ nuò] [和|hé] [玛尔塔|Mǎ ěr tǎ] [拜年|bài nián] [吧|ba] ！', 'Go and wish my grandpa, Grandpa Hu, Grandma Rosa, Bruno and Marta a happy New Year!'),
    'ny.kid.back2': T2('[哇|wā] ！ [五|wǔ] [个|gè] [红包|hóng bāo] ！ [恭喜|gōng xǐ] [发财|fā cái] ， [红包|hóng bāo] [拿来|ná lái] ！ [嘿嘿|hēi hei] 。', 'Wow! Five red envelopes! «Wishing you wealth: hand over the red envelope!» Hee hee.'),
    'ny.kid.eight': T2('[八|bā] [很|hěn] [吉利|jí lì] ， [因为|yīn wèi] [八|bā] [和|hé] [发|fā] [很|hěn] [像|xiàng] ！ [可是|kě shì] [四|sì] [不|bù] [好|hǎo] 。', 'Eight is lucky, because 八 sounds like 发 (getting rich)! But four isn’t good.'),
    'ny.give.best': T2('[哎呀|āi yā] ， [说|shuō] [得|de] [真|zhēn] [好|hǎo] ！ [来|lái] ， [红包|hóng bāo] [给|gěi] [你|nǐ] ！', 'Oh, how well said! Here, a red envelope for you!'),
    'ny.give.ok': T2('[新年|xīn nián] [快乐|kuài lè] ！ [给|gěi] [你|nǐ] [一|yī] [个|gè] [小|xiǎo] [红包|hóng bāo] 。', 'Happy New Year! Here’s a little red envelope.'),
    'ny.give.chen': T2('[谢谢|xiè xie] ！ [我|wǒ] [这|zhè] [把|bǎ] [老|lǎo] [骨头|gǔ tou] [还|hái] [很|hěn] [健康|jiàn kāng] [呢|ne] ！', 'Thanks! These old bones are still in good shape!'),
    'ny.give.bruno': T2('[龙马|lóng mǎ] [精神|jīng shén] ？ [哈哈|hā ha] ！ [对|duì] ， [我|wǒ] [每天|měi tiān] [练|liàn] ！', 'The spirit of a dragon-horse? Ha ha! That’s right, I train every day!'),
    'ny.kid.chunlian': T2('[这|zhè] [是|shì] [春联|chūn lián] ！ [过年|guò nián] [的|de] [时候|shí hou] [贴|tiē] [在|zài] [门|mén] [的|de] [两边|liǎng biān] 。', 'These are spring couplets! At New Year you stick them on both sides of the door.'),
    'ny.kid.whichRight': T2('[上联|shàng lián] [贴|tiē] [右边|yòu biān] ， [下联|xià lián] [贴|tiē] [左边|zuǒ biān] 。 [哪|nǎ] [个|gè] [是|shì] [上联|shàng lián] ？', 'The first line goes on the right, the second on the left. Which one is the first line?'),
    'ny.kid.tone': T2('[看|kàn] [最后|zuì hòu] [一|yī] [个|gè] [字|zì] ： [第三|dì sān] [声|shēng] [或|huò] [第四|dì sì] [声|shēng] ， [就|jiù] [是|shì] [上联|shàng lián] ！', 'Look at the last character: a third or fourth tone means it’s the first line!'),
    'ny.kid.fu': T2('[还有|hái yǒu] [福|fú] ！ [我|wǒ] [倒|dào] [着|zhe] [贴|tiē] 。 [嘿嘿|hēi hei] 。', 'And 福, good fortune! I’ll stick it upside down. Hee hee.'),
    'ny.kid.fu2': T2('[福|fú] [倒|dào] [了|le] … [福|fú] [到|dào] [了|le] ！ [好运|hǎo yùn] [来|lái] [了|le] ！', '福 is upside down (倒)… so 福 has arrived (到)! Good luck is here!'),
    'ny.kid.fuparts': T2('[福|fú] [字|zì] [里|lǐ] [有|yǒu] [一|yī] [个|gè] [口|kǒu] ， [一|yī] [块|kuài] [田|tián] 。 [有|yǒu] [饭|fàn] [吃|chī] ， [就|jiù] [是|shì] [福|fú] ！', 'Inside 福 there’s a mouth and a field. Having food to eat: that’s good fortune!'),
    'ny.kid.done3': T2('[太|tài] [棒|bàng] [了|le] ！ [钟楼|zhōng lóu] [也|yě] [过年|guò nián] [了|le] ！', 'Awesome! The bell tower is celebrating New Year too!'),
    'ny.kid.boat': T2('[端午节|duān wǔ jié] [的|de] [时候|shí hou] ， [大家|dà jiā] [划|huá] [龙舟|lóng zhōu] ， [吃|chī] [粽子|zòng zi] 。', 'At the Dragon Boat Festival, everyone races dragon boats and eats zongzi.'),
    'ny.kid.quyuan': T2('[很|hěn] [久|jiǔ] [以前|yǐ qián] ， [有|yǒu] [一|yī] [个|gè] [诗人|shī rén] [叫|jiào] [屈原|Qū Yuán] 。 [他|tā] [掉|diào] [进|jìn] [了|le] [河|hé] [里|lǐ] 。 [人们|rén men] [划|huá] [船|chuán] [去|qù] [找|zhǎo] [他|tā] ， [还|hái] [往|wǎng] [河|hé] [里|lǐ] [扔|rēng] [粽子|zòng zi] [喂|wèi] [鱼|yú] 。', 'Long ago there was a poet called Qu Yuan. He fell into the river. People rowed out to find him, and threw zongzi into the river to feed the fish.'),
    'ny.kid.raceGo': T2('[我们|wǒ men] [也|yě] [比|bǐ] [一|yī] [比|bǐ] ！ [在|zài] [池塘|chí táng] [里|lǐ] ！ [你|nǐ] [喊|hǎn] [划|huá] ， [你|nǐ] [的|de] [龙舟|lóng zhōu] [就|jiù] [走|zǒu] ！', 'Let’s race too! On the pond! You shout «row», and your dragon boat goes!'),
    'ny.kid.raceWon': T2('[你|nǐ] [赢|yíng] [了|le] ！ [你|nǐ] [的|de] [声音|shēng yīn] [好|hǎo] [大|dà] ！', 'You won! Your voice is so loud!'),
    'ny.kid.raceLost': T2('[我|wǒ] [赢|yíng] [了|le] ！ [嗷|áo] [呜|wū] ！ [再|zài] [来|lái] [一|yī] [次|cì] ？', 'I won! Rawr! Again?'),
    'ny.kid.lantern': T2('[元宵节|yuán xiāo jié] [要|yào] [猜|cāi] [灯谜|dēng mí] ！ [我|wǒ] [挂|guà] [了|le] [五|wǔ] [个|gè] [灯笼|dēng long] ， [你|nǐ] [都|dōu] [能|néng] [猜|cāi] [对|duì] [吗|ma] ？', 'At the Lantern Festival you guess lantern riddles! I hung up five lanterns. Can you guess them all?'),
    'ny.kid.done4': T2('[你|nǐ] [太|tài] [厉害|lì hai] [了|le] ！ [比|bǐ] [我|wǒ] [爷爷|yé ye] [还|hái] [厉害|lì hai] ！', 'You’re amazing! Even better than my grandpa!'),
    'ny.kid.eve': T2('[今天|jīn tiān] [是|shì] [除夕|chú xī] ！ [我|wǒ] [爸爸|bà ba] [妈妈|mā ma] [在|zài] [大|dà] [城市|chéng shì] [工作|gōng zuò] … [他们|tā men] [说|shuō] [今天|jīn tiān] [回来|huí lái] 。', 'Today is New Year’s Eve! My mom and dad work in the big city… they said they’d come home today.'),
    'ny.kid.nian': T2('[你|nǐ] [知道|zhī dào] [年兽|nián shòu] [吗|ma] ？ [以前|yǐ qián] ， [每|měi] [年|nián] [除夕|chú xī] ， [年兽|nián shòu] [都|dōu] [会|huì] [来|lái] 。', 'Do you know the Nian? Long ago, every New Year’s Eve, the Nian came.'),
    'ny.kid.nian2': T2('[它|tā] [怕|pà] [红色|hóng sè] ， [怕|pà] [火|huǒ] ， [怕|pà] [声音|shēng yīn] 。 [所以|suǒ yǐ] [我们|wǒ men] [贴|tiē] [春联|chūn lián] ， [放|fàng] [鞭炮|biān pào] ！', 'It’s scared of red, of fire, of noise. So we put up couplets and set off firecrackers!'),
    'ny.kid.nian3': T2('[就|jiù] [像|xiàng] [寂静|Jì jìng] [怕|pà] [说话|shuō huà] [一样|yī yàng] ！', 'Just like the Hush is scared of talking!'),
    'ny.kid.dance': T2('[舞龙|wǔ lóng] [要|yào] [有|yǒu] [人|rén] [喊|hǎn] ！ [你|nǐ] [来|lái] [喊|hǎn] ， [我|wǒ] [拿|ná] [龙珠|lóng zhū] ， {mimo} [坐|zuò] [在|zài] [龙头|lóng tóu] [上|shang] ！', 'The dragon dance needs someone to call the moves! You call, I carry the dragon’s pearl, and {mimo} rides on the dragon’s head!'),
    'ny.chen.drum': T2('[锣鼓|luó gǔ] [准备|zhǔn bèi] [好|hǎo] [了|le] ！ [老|Lǎo] [胡|Hú] ， [敲|qiāo] [锣|luó] ！', 'Drums and gongs are ready! Lao Hu, the gong!'),
    'ny.kid.uhoh': T2('[那|nà] [是|shì] … [年兽|nián shòu] ？', 'Is that… the Nian?'),
    'ny.chen.nian': T2('[是|shì] [寂静|Jì jìng] [变|biàn] [的|de] [年兽|nián shòu] ！ [大家|dà jiā] ， [大声|dà shēng] [点|diǎn] ！', 'It’s a Nian made of the Hush! Everyone, louder!'),
    'ny.kid.won': T2('[年兽|nián shòu] [跑|pǎo] [了|le] ！ [我们|wǒ men] [赢|yíng] [了|le] ！', 'The Nian ran away! We won!'),
    'ny.kid.parents': T2('[爸爸|bà ba] ！ [妈妈|mā ma] ！', 'Dad! Mom!'),
    'ny.mom.hi': T2('[龙龙|Lóng long] ！ [新年|xīn nián] [快乐|kuài lè] ！ [我们|wǒ men] [回来|huí lái] [了|le] ！', 'Longlong! Happy New Year! We’re home!'),
    'ny.dad.hi': T2('[火车|huǒ chē] [晚|wǎn] [了|le] 。 [可是|kě shì] [我们|wǒ men] [听到|tīng dào] [了|le] [锣鼓|luó gǔ] [声|shēng] ， [就|jiù] [一路|yī lù] [跑|pǎo] [过来|guò lái] ！', 'The train was late. But we heard the drums and gongs, and ran all the way here!'),
    'ny.chen.tuanyuan': T2('[一家人|yī jiā rén] [团团圆圆|tuán tuán yuán yuán] 。 [这|zhè] [才|cái] [是|shì] [过年|guò nián] 。', 'The whole family together. That’s what New Year really is.'),
    'ny.kid.gift': T2('{mimo} ， [这|zhè] [是|shì] [我|wǒ] [的|de] [龙|lóng] [头巾|tóu jīn] 。 [送|sòng] [给|gěi] [你|nǐ] ！ [你|nǐ] [是|shì] [真|zhēn] [的|de] [龙|lóng] [了|le] ！', '{mimo}, this is my dragon headband. It’s yours! Now you’re a real dragon!'),
    'ny.kid.idle1': T2('[龙|lóng] [有|yǒu] [九|jiǔ] [个|gè] [儿子|ér zi] ！ [我|wǒ] [都|dōu] [知道|zhī dào] [名字|míng zi] ！', 'The dragon has nine sons! I know all their names!'),
    'ny.kid.idle2': T2('[中国|Zhōng guó] [的|de] [龙|lóng] [不|bù] [喷|pēn] [火|huǒ] ， [它|tā] [带来|dài lái] [雨|yǔ] ！', 'Chinese dragons don’t breathe fire. They bring the rain!'),
    'ny.kid.idle3': T2('[我|wǒ] [长大|zhǎng dà] [了|le] [要|yào] [当|dāng] [龙头|lóng tóu] ！', 'When I grow up I’m going to be the dragon’s head!'),
    'ny.kid.idle4': T2('[爸爸|bà ba] [妈妈|mā ma] [回来|huí lái] [了|le] ！ [今年|jīn nián] [最|zuì] [好|hǎo] ！', 'Mom and Dad are home! Best year ever!'),
    'ny.kid.wait': T2('[等|děng] [一|yī] [下|xià] ！ [我|wǒ] [还|hái] [在|zài] [准备|zhǔn bèi] 。 [你|nǐ] [先|xiān] [去|qù] [冒险|mào xiǎn] [吧|ba] ！', 'Wait! I’m still getting ready. Go on an adventure first!'),
  };
  function registerIcons() {
    if (typeof ICONS === 'undefined' || !ICONS.add) return;
    const has = k => ICONS.keys.includes(k);
    if (!has('nyKid')) ICONS.add('nyKid', (c, p, h) => {
      h.shape(c, p, h.ell(0, 6, 26, 28), '#f5cda2');
      h.shape(c, p, cc => { cc.moveTo(-30, 2); cc.bezierCurveTo(-32, -42, 32, -42, 30, 2); cc.quadraticCurveTo(0, -18, -30, 2); cc.closePath(); }, '#d6332a');
      [-1, 1].forEach(s => h.shape(c, p, cc => { cc.moveTo(s * 12, -28); cc.lineTo(s * 20, -46); cc.lineTo(s * 6, -32); cc.closePath(); }, '#ffcf3f'));
      if (!p) return;
      h.dot(c, -9, 6, 3.4, h.INK); h.dot(c, 9, 6, 3.4, h.INK); h.dot(c, -8, 5, 1.2, '#fff'); h.dot(c, 10, 5, 1.2, '#fff');
      h.dot(c, -16, 15, 4.5, 'rgba(255,140,154,0.6)'); h.dot(c, 16, 15, 4.5, 'rgba(255,140,154,0.6)');
      c.beginPath(); c.arc(0, 14, 8, 0.1, Math.PI - 0.1); c.lineWidth = 2; c.strokeStyle = h.INK; c.stroke();
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * 7 - 3, -12); c.lineTo(i * 7, -6); c.lineTo(i * 7 + 3, -12); c.fillStyle = '#fffaf0'; c.fill(); }
    });
    if (!has('nyLantern')) ICONS.add('nyLantern', (c, p, h) => {
      h.shape(c, p, h.rr(-8, -36, 16, 8, 2), '#e8c35a'); h.shape(c, p, h.ell(0, 0, 28, 24), '#d6332a'); h.shape(c, p, h.rr(-9, 22, 18, 7, 2), '#e8c35a');
      if (p) { [-14, 0, 14].forEach(x => { c.beginPath(); c.moveTo(x, -22); c.quadraticCurveTo(x * 1.5, 0, x, 22); c.lineWidth = 1.6; c.strokeStyle = 'rgba(43,34,53,.45)'; c.stroke(); }); c.font = `900 22px ${ZHF.FONT}`; c.fillStyle = '#ffd23f'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('福', 0, 1); for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-3 + i * 3, 30); c.lineTo(-4 + i * 4, 42); c.lineWidth = 2; c.strokeStyle = '#d6332a'; c.stroke(); } }
    });
    if (!has('nyNian')) ICONS.add('nyNian', (c, p, h) => {
      h.shape(c, p, h.ell(0, 6, 30, 26), '#8f8a99'); h.shape(c, p, cc => { cc.moveTo(-4, -18); cc.lineTo(2, -44); cc.lineTo(8, -18); cc.closePath(); }, '#d8d4e0');
      if (p) { h.dot(c, -11, 0, 5, '#eef0ff'); h.dot(c, 11, 0, 5, '#eef0ff'); h.shape(c, 1, h.ell(0, 18, 16, 7), '#3a3444', 1.5); [-9, -3, 3, 9].forEach(x => { c.beginPath(); c.moveTo(x - 2, 12); c.lineTo(x, 18); c.lineTo(x + 2, 12); c.fillStyle = '#fff'; c.fill(); }); }
    });
  }

  // ================================================================ the places (plain data)
  // the bell tower stands at (−26, −166), 3.6 wide, its door on the south face (z −164.2); the plaza's fountain at (−10, −146)
  const TOWER = { x: -26, z: -166, face: -164.2 };
  const SPOT = { kid: { x: -22.5, z: -169.1, yaw: 2.3 }, den: { x: -25.0, z: -168.55 }, poster: { x: -23.9, z: -170.35, yaw: 0.75 },
    pole1: { x: -27.7, z: -170.1 }, pole2: { x: -21.0, z: -170.6 }, door: { x: -23.4, z: -162.9 },
    you: { x: -2.6, z: -139.6 }, drum: { x: -12.3, z: -156.2 }, gong: { x: -7.7, z: -156.2 }, chen: { x: -13.1, z: -156.9 }, hu: { x: -6.8, z: -156.9 } };
  const PLAZA = { x: -10, z: -146 };
  let G = null, B = null;
  const S = () => { const s = G.state; if (!s.ny) s.ny = {}; const o = s.ny; o.ch = o.ch || {}; o.hb = o.hb || {}; o.rid = o.rid || {}; return o; };
  const shown = () => !!(G && G.state && G.state.lang === 'zh' && G.state.flags && G.state.flags.hatched);
  const flags = () => (G && G.state && G.state.flags) || {};
  function lantern(k, x, y, z, s = 1, o = {}) {
    k.add(ZHF.GEO.cyl, '#e8c35a', x, y + 0.27 * s, z, 0.1 * s, 0.07 * s, 0.1 * s, 0, 0, 0, { ink: 0.008 });
    k.add(ZHF.GEO.ball, o.col || '#e0372c', x, y, z, 0.3 * s, 0.26 * s, 0.3 * s, 0, 0, 0, { glow: o.glow !== false });
    k.add(ZHF.GEO.cyl, '#e8c35a', x, y - 0.27 * s, z, 0.1 * s, 0.07 * s, 0.1 * s, 0, 0, 0, { ink: 0.008 });
    k.rod([x, y - 0.3 * s, z], [x, y - 0.6 * s, z], 0.02 * s, '#d6332a', { ink: 0 });
    if (o.string) k.rod([x, y + 0.3 * s, z], [x, y + o.string, z], 0.008, '#2b2235', { ink: 0 });
  }
  // a strip of red paper with characters (a couplet), top to bottom or across
  function paper(chars, w, h, vert) {
    const tex = ZHF.canvasTex(vert ? 96 : 384, vert ? 384 : 96, c => {
      const W = vert ? 96 : 384, Hh = vert ? 384 : 96; c.fillStyle = '#d6332a'; c.fillRect(0, 0, W, Hh); c.strokeStyle = '#e8c35a'; c.lineWidth = 6; c.strokeRect(6, 6, W - 12, Hh - 12);
      if (vert) ZHF.vtext(c, chars, 48, 20, 364, 66, '#1d1418'); else { c.font = `700 62px ${ZHF.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1d1418'; [...chars].forEach((ch, i, a) => c.fillText(ch, 48 + i * (288 / Math.max(1, a.length - 1)), 50)); }
    });
    return ZHF.plane(w, h, tex);
  }
  function fuDiamond() {
    const tex = ZHF.canvasTex(256, 256, c => { c.translate(128, 128); c.rotate(Math.PI / 4); c.fillStyle = '#d6332a'; c.fillRect(-84, -84, 168, 168); c.strokeStyle = '#e8c35a'; c.lineWidth = 7; c.strokeRect(-76, -76, 152, 152); c.rotate(-Math.PI / 4 + Math.PI); c.font = `700 120px ${ZHF.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#1d1418'; c.fillText('福', 0, 6); });
    return ZHF.plane(0.56, 0.56, tex, { alpha: true });
  }
  function build(scene, env = {}) {
    const gy = env.terrainAt || ((x, z) => WORLD.terrainAt(x, z));
    const root = new THREE.Group(); root.name = 'newyear'; scene.add(root); root.visible = false;
    const colliders = [], solid = c => { c.x0 = c.x; c.z0 = c.z; colliders.push(c); return c; };
    // ---------------- the den: a cardboard box with a dragon face, horns and a flag; the zodiac poster on an easel
    const D = SPOT.den, dy = gy(D.x, D.z), k = ZHF.Kit();
    k.frame(D.x, dy, D.z, Math.PI);
    k.box(0, 0.36, 0, 1.0, 0.72, 0.62, '#c9955a', { ink: 0.014 }).box(0, 0.73, 0, 1.04, 0.04, 0.66, '#b5824a', { ink: 0.008 });
    for (const s of [-1, 1]) k.cone(s * 0.3, 0.95, 0, 0.07, 0.42, '#ffcf3f', { rz: -s * 0.3, ink: 0.008 });
    for (let i = 0; i < 4; i++) k.cone(-0.32 + i * 0.21, 0.82, -0.25, 0.06, 0.16, '#3fae5a', { ink: 0.005 });
    k.rod([0.42, 0.74, -0.2], [0.42, 1.55, -0.2], 0.012, '#7a5236', { ink: 0 }).box(0.6, 1.42, -0.2, 0.34, 0.22, 0.01, '#d6332a', { ink: 0.004 });
    k.free();
    const face = ZHF.canvasTex(256, 192, c => { c.fillStyle = '#d6332a'; c.fillRect(0, 0, 256, 192); c.fillStyle = '#fffaf0'; [[78, 70], [178, 70]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 30, 0, TAU); c.fill(); }); c.fillStyle = '#2b2235'; [[84, 74], [172, 74]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 14, 0, TAU); c.fill(); }); c.fillStyle = '#e8c35a'; c.fillRect(40, 128, 176, 18); c.fillStyle = '#fffaf0'; for (let i = 0; i < 7; i++) { c.beginPath(); c.moveTo(48 + i * 24, 128); c.lineTo(60 + i * 24, 112); c.lineTo(72 + i * 24, 128); c.fill(); } c.strokeStyle = '#2b2235'; c.lineWidth = 5; c.beginPath(); c.moveTo(40, 166); c.quadraticCurveTo(128, 186, 216, 166); c.stroke(); });
    const fp = ZHF.plane(0.96, 0.66, face); fp.position.set(D.x, dy + 0.37, D.z - 0.315); fp.rotation.set(0, Math.PI, 0); root.add(fp);
    const P = SPOT.poster, py = gy(P.x, P.z);
    k.frame(P.x, py, P.z, P.yaw); k.rod([-0.3, 0, -0.12], [-0.22, 1.5, 0], 0.025, '#8a5f3e').rod([0.3, 0, -0.12], [0.22, 1.5, 0], 0.025, '#8a5f3e').rod([0, 0, 0.3], [0, 1.4, 0.02], 0.025, '#8a5f3e').box(0, 0.62, 0.04, 0.7, 0.04, 0.12, '#8a5f3e'); k.free();
    const wheel = ZHF.canvasTex(256, 256, c => { c.fillStyle = '#fff4dc'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#d6332a'; c.beginPath(); c.arc(128, 128, 118, 0, TAU); c.fill(); c.fillStyle = '#fff4dc'; c.beginPath(); c.arc(128, 128, 46, 0, TAU); c.fill(); c.font = `700 30px ${ZHF.FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; ANIMALS.forEach((A, i) => { const a = -Math.PI / 2 + (i / 12) * TAU; c.fillStyle = '#fffaf0'; c.fillText(A.ch, 128 + Math.cos(a) * 84, 128 + Math.sin(a) * 84); }); c.fillStyle = '#d6332a'; c.font = `700 34px ${ZHF.FONT}`; c.fillText('生肖', 128, 130); });
    const pw = ZHF.plane(0.72, 0.72, wheel); pw.position.set(P.x + Math.sin(P.yaw) * 0.06, py + 1.05, P.z + Math.cos(P.yaw) * 0.06); pw.rotation.set(-0.12, P.yaw, 0, 'YXZ'); root.add(pw);
    colliders.push(solid({ obox: 1, x: D.x, z: D.z, hw: 0.55, hd: 0.35, rot: 0 }), solid({ x: P.x, z: P.z, r: 0.3 }));
    // ---------------- the riddle lanterns (chapter 4): two poles, a rope, five lanterns with paper slips
    const lan = new THREE.Group(); root.add(lan); const kl = ZHF.Kit(), p1 = SPOT.pole1, p2 = SPOT.pole2, y1 = gy(p1.x, p1.z), y2 = gy(p2.x, p2.z);
    kl.rod([p1.x, y1, p1.z], [p1.x, y1 + 2.9, p1.z], 0.05, '#c8322a').rod([p2.x, y2, p2.z], [p2.x, y2 + 2.9, p2.z], 0.05, '#c8322a');
    const RP = []; for (let i = 0; i <= 6; i++) { const u = i / 6; RP.push([lerp(p1.x, p2.x, u), lerp(y1, y2, u) + 2.8 - Math.sin(u * Math.PI) * 0.35, lerp(p1.z, p2.z, u)]); }
    for (let i = 0; i < 6; i++) kl.rod(RP[i], RP[i + 1], 0.012, '#2b2235', { ink: 0 });
    const LAN = [];
    for (let i = 0; i < 5; i++) { const q = RP[i + 1]; lantern(kl, q[0], q[1] - 0.75, q[2], 0.9, { string: 0.75 }); kl.box(q[0], q[1] - 1.48, q[2], 0.16, 0.3, 0.01, '#fff4dc', { ink: 0.004 }); LAN.push({ x: q[0], z: q[2], y: q[1] - 0.75 }); }
    ZHF.bake(lan, kl); colliders.push(solid({ x: p1.x, z: p1.z, r: 0.12 }), solid({ x: p2.x, z: p2.z, r: 0.12 }));
    // ---------------- the couplets and the upside-down 福 on the bell tower's door (chapter 3 on)
    const door = new THREE.Group(); root.add(door); const ty = gy(TOWER.x, TOWER.face + 0.3);
    const cu = paper('春回大地', 0.3, 1.25, true), cd = paper('福满人间', 0.3, 1.25, true), ct = paper('万象更新', 1.3, 0.32, false), fu = fuDiamond();
    cu.position.set(TOWER.x + 0.86, ty + 1.55, TOWER.face + 0.03); cd.position.set(TOWER.x - 0.86, ty + 1.55, TOWER.face + 0.03); ct.position.set(TOWER.x, ty + 3.42, TOWER.face + 0.03); fu.position.set(TOWER.x, ty + 1.75, TOWER.face + 0.16);
    fu.rotation.set(0, 0, 0); door.add(cu, cd, ct, fu);
    // ---------------- the plaza on New Year's Eve: a ring of lanterns, firecracker poles, the drum and the gong (built when needed)
    const fest = new THREE.Group(); root.add(fest); fest.visible = false;
    const kf = ZHF.Kit(), GY = (typeof TOWN !== 'undefined' && TOWN.GY) || 0.25, RING = [];
    for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU + 0.12; RING.push([PLAZA.x + Math.cos(a) * 10.6, GY + 3.6, PLAZA.z + Math.sin(a) * 10.6]); }
    for (let i = 0; i < 14; i++) { const a = RING[i], b = RING[(i + 1) % 14], m = [(a[0] + b[0]) / 2, a[1] - 0.45, (a[2] + b[2]) / 2]; kf.rod(a, m, 0.014, '#e8c35a', { ink: 0 }).rod(m, b, 0.014, '#e8c35a', { ink: 0 }); lantern(kf, m[0], m[1] - 0.55, m[2], 1.05, { string: 0.55 }); }
    for (let i = 0; i < 14; i += 2) kf.rod([RING[i][0], GY, RING[i][2]], RING[i], 0.06, '#c8322a');
    const FIRE = [{ x: -14.8, z: -155.0 }, { x: -5.2, z: -155.0 }];
    for (const f of FIRE) { kf.rod([f.x, GY, f.z], [f.x, GY + 3.4, f.z], 0.05, '#c8322a').rod([f.x, GY + 3.3, f.z], [f.x + 0.5, GY + 3.3, f.z], 0.03, '#c8322a'); for (let j = 0; j < 14; j++) kf.cyl(f.x + 0.5 + (j % 2 ? 0.05 : -0.05), GY + 3.15 - j * 0.12, f.z, 0.035, 0.1, j % 4 === 3 ? '#e8c35a' : '#d6332a', { rz: (j % 2 ? 0.6 : -0.6), ink: 0.004 }); }
    ZHF.bake(fest, kf);
    const kit = new THREE.Group(); fest.add(kit); kit.visible = false;      // (the drum and the gong: only during the festival)
    const kd = ZHF.Kit(), dr = SPOT.drum, go = SPOT.gong;
    kd.rod([dr.x - 0.45, GY, dr.z - 0.3], [dr.x - 0.45, GY + 0.9, dr.z], 0.05, '#7a5236').rod([dr.x + 0.45, GY, dr.z - 0.3], [dr.x + 0.45, GY + 0.9, dr.z], 0.05, '#7a5236');
    kd.add(ZHF.GEO.cyl, '#d6332a', dr.x, GY + 1.05, dr.z, 0.55, 0.62, 0.55, Math.PI / 2 - 0.35, 0, 0, { ink: 0.014 }).add(ZHF.GEO.cyl, '#f4e3c0', dr.x, GY + 1.17, dr.z + 0.3, 0.5, 0.02, 0.5, Math.PI / 2 - 0.35, 0, 0, { ink: 0 });
    kd.rod([go.x - 0.65, GY, go.z], [go.x - 0.65, GY + 2.2, go.z], 0.05, '#7a5236').rod([go.x + 0.65, GY, go.z], [go.x + 0.65, GY + 2.2, go.z], 0.05, '#7a5236').rod([go.x - 0.75, GY + 2.15, go.z], [go.x + 0.75, GY + 2.15, go.z], 0.06, '#c8322a');
    kd.rod([go.x, GY + 2.12, go.z], [go.x, GY + 1.9, go.z], 0.01, '#2b2235', { ink: 0 }).add(ZHF.GEO.cyl, '#d9a03a', go.x, GY + 1.35, go.z + 0.02, 0.55, 0.05, 0.55, Math.PI / 2, 0, 0, { ink: 0.012 }).add(ZHF.GEO.cyl, '#b8862a', go.x, GY + 1.35, go.z + 0.05, 0.2, 0.02, 0.2, Math.PI / 2, 0, 0, { ink: 0 });
    ZHF.bake(kit, kd);
    // ---------------- the people: Longlong (always); for the festival, Grandpa Chen and Grandpa Hu standing, and the parents
    const people = [];
    const KID = { kid: true, skin: '#f5cda2', hair: '#2b2235', hat: 'hood', hatCol: '#d6332a', shirt: '#d6332a', sleeve: '#d6332a', pants: '#f2c94c', shoes: '#3a2b26', collar: '#e8c35a' };
    const kid = ZHF.person(KID); kid.id = 'kid'; kid.nameSrc = NAMES.kid; kid.x = SPOT.kid.x; kid.z = SPOT.kid.z; kid.y = gy(kid.x, kid.z); kid.yaw = kid.baseYaw = SPOT.kid.yaw; kid.story = true; kid.kidP = true;
    const toy = new THREE.Group(), kt = ZHF.Kit(); kt.rod([0, 0, 0], [0, 0.55, 0.05], 0.015, '#7a5236', { ink: 0 }); for (let i = 0; i < 5; i++) kt.ball(Math.sin(i * 1.3) * 0.08, 0.58 + i * 0.05, 0.05 + i * 0.07, 0.07 - i * 0.008, 0.06 - i * 0.006, 0.07 - i * 0.008, i === 0 ? '#e8c35a' : i % 2 ? '#d6332a' : '#e0372c', { ink: 0.006 });
    kt.cone(0.04, 0.66, 0.0, 0.02, 0.07, '#ffcf3f', { ink: 0 }).cone(-0.04, 0.66, 0.0, 0.02, 0.07, '#ffcf3f', { ink: 0 }); ZHF.bake(toy, kt); kid.arms[1].userData.hand.add(toy); kid.toy = toy;
    const pearl = new THREE.Group(), kp = ZHF.Kit(); kp.rod([0, 0, 0], [0, 1.0, 0.25], 0.015, '#c8322a', { ink: 0 }).add(ZHF.GEO.ball, '#ffd23f', 0, 1.1, 0.28, 0.17, 0.17, 0.17, 0, 0, 0, { glow: true }); ZHF.bake(pearl, kp); pearl.visible = false; kid.arms[1].userData.hand.add(pearl); kid.pearl = pearl;
    root.add(kid.root); people.push(kid);
    const standing = (id, look, at, yaw) => { const p = ZHF.person(look); p.id = id; p.nameSrc = NAMES[id]; p.x = at.x; p.z = at.z; p.y = gy(at.x, at.z); p.yaw = p.baseYaw = yaw; p.story = true; p.noTurn = true; p.root.visible = false; p.hidden = true; fest.add(p.root); return p; };
    const chenS = standing('chen', { skin: '#f0c7a0', hair: '#e8e4dc', hat: 'flat', hatCol: '#6b6f78', shirt: '#f4efe2', vest: '#5a6b4f', pants: '#3f4a5a', glasses: true, old: true }, SPOT.chen, 0.25);
    const huS = standing('hu', { skin: '#e8b48a', hair: '#e8e4dc', bald: true, shirt: '#fbfbf6', sleeve: '#e8b48a', belly: true, pants: '#4a3f35', old: true, mustache: true, wide: 1.08 }, SPOT.hu, -0.25);
    const mom = standing('mom', { skin: '#f0c7a0', hair: '#2b2235', shirt: '#c8322a', pants: '#3f4a5a', shoes: '#2b2235' }, { x: -10, z: -128 }, Math.PI);
    const dad = standing('dad', { skin: '#e8b48a', hair: '#2b2235', shirt: '#3f6fb5', pants: '#2f3a4a', shoes: '#2b2235', glasses: true }, { x: -9, z: -128 }, Math.PI);
    const suitcase = new THREE.Group(), ks2 = ZHF.Kit(); ks2.box(0, 0.32, 0, 0.5, 0.6, 0.22, '#3a5a7a', { ink: 0.01 }).box(0, 0.68, 0, 0.18, 0.08, 0.04, '#2b2235', { ink: 0 }); ZHF.bake(suitcase, ks2); suitcase.position.set(0.32, 0, 0.12); dad.root.add(suitcase);
    B = { root, colliders, people, kid, chenS, huS, mom, dad, fest, kit, lan, LAN, door, gy, GY, FIRE, RING, dragon: null, nian: null };
    return { colliders, group: root, people, update };
  }

  // ---------------- the dragon (舞龙): a head, eight body sections and a tail, each on a pole held by a dancer
  function makeDragon() {
    if (B.dragon) return B.dragon;
    const g = new THREE.Group(); B.fest.add(g);
    const segs = [], dancers = [];
    const head = new THREE.Group(), kh = ZHF.Kit();
    kh.ball(0, 0, 0, 0.55, 0.48, 0.55, '#d6332a', { ink: 0.02 }).box(0, -0.06, 0.5, 0.6, 0.34, 0.6, '#e0372c', { ink: 0.016 }).box(0, -0.26, 0.48, 0.56, 0.1, 0.56, '#fffaf0', { ink: 0.008 });
    kh.box(0, -0.32, 0.46, 0.5, 0.12, 0.5, '#b8232a', { ink: 0.008 });
    for (const s of [-1, 1]) {
      kh.ball(s * 0.27, 0.2, 0.36, 0.14, 0.14, 0.12, '#fffaf0', { ink: 0.01 }).ball(s * 0.27, 0.2, 0.47, 0.06, 0.07, 0.03, '#2b2235', { ink: 0 });
      kh.cone(s * 0.2, 0.62, -0.1, 0.07, 0.5, '#ffcf3f', { rz: -s * 0.3, rx: -0.4, ink: 0.01 });
      kh.rod([s * 0.2, -0.05, 0.75], [s * 0.7, -0.25, 0.95], 0.02, '#ffcf3f', { ink: 0 });
      for (let i = 0; i < 3; i++) kh.cone(s * (0.42 + i * 0.05), 0.1 - i * 0.12, -0.15 - i * 0.1, 0.08, 0.3, '#3fae5a', { rz: -s * 1.2, ink: 0.006 });
    }
    for (let i = 0; i < 5; i++) kh.cone(-0.16 + i * 0.08, -0.48, 0.6 - i * 0.02, 0.025, 0.2, '#fffaf0', { rx: Math.PI, ink: 0 });
    kh.rod([0, -0.5, 0], [0, -1.7, 0], 0.03, '#7a5236', { ink: 0 });
    ZHF.bake(head, kh); g.add(head);
    for (let i = 0; i < 9; i++) {
      const sg = new THREE.Group(), ks = ZHF.Kit(), last = i === 8, r = last ? 0.3 : 0.42 - i * 0.012;
      if (last) { ks.cone(0, 0, 0.3, 0.32, 0.9, '#d6332a', { rx: Math.PI / 2, ink: 0.014 }); ks.cone(0, 0.25, 0.55, 0.05, 0.5, '#3fae5a', { rx: 0.6, ink: 0.006 }); }
      else {
        ks.add(ZHF.GEO.cyl, '#d6332a', 0, 0, 0, r, 0.98, r, Math.PI / 2, 0, 0, { ink: 0.014 });
        for (const z of [-0.3, 0.3]) ks.add(ZHF.GEO.cyl, '#e8c35a', 0, 0, z, r + 0.02, 0.07, r + 0.02, Math.PI / 2, 0, 0, { ink: 0 });
        for (let j = 0; j < 2; j++) ks.cone(0, r + 0.08, -0.2 + j * 0.4, 0.06, 0.2, '#3fae5a', { ink: 0.005 });
        ks.ball(0, -r * 0.6, 0, r * 0.8, r * 0.35, 0.42, '#ffd166', { ink: 0 });
      }
      ks.rod([0, -r, 0], [0, -1.7, 0], 0.03, '#7a5236', { ink: 0 });
      ZHF.bake(sg, ks); g.add(sg); segs.push(sg);
    }
    for (let i = 0; i < 10; i++) {
      const p = ZHF.person({ skin: ['#f0c7a0', '#e8b48a', '#c98e62'][i % 3], hair: '#2b2235', shirt: i % 2 ? '#e8c35a' : '#d6332a', sleeve: i % 2 ? '#e8c35a' : '#d6332a', pants: '#c8322a', shoes: '#2b2235', hat: 'beanie', hatCol: '#d6332a', band: '#e8c35a' });
      p.pose = 'pole'; p.noTurn = true; g.add(p.root); dancers.push(p);
    }
    // {mimo} rides on the dragon's head (a second Mimo, like the title's); the real one waits by you
    let rider = null;
    try { if (typeof ACTORS !== 'undefined' && ACTORS.mimo) { rider = ACTORS.mimo(); rider.root.scale.setScalar(0.85); rider.root.position.set(0, 0.38, -0.05); head.add(rider.root); } } catch (e) { rider = null; }
    const trail = [];
    B.dragon = { g, head, segs, dancers, rider, trail, th: -Math.PI / 2, R: 6.2, Rt: 6.2, w: 0.42, spinT: 0, jumpT: -9, upT: 0, downT: 0, on: false };
    g.visible = false;
    return B.dragon;
  }
  function dragonStep(dt, t) {
    const D = B.dragon; if (!D || !D.on) return;
    D.th += dt * D.w * (D.spinT > 0 ? 1.8 : 1); D.R = damp(D.R, D.Rt, 1.6, dt);
    if (D.spinT > 0) D.spinT -= dt; if (D.upT > 0) D.upT -= dt; if (D.downT > 0) D.downT -= dt; D.jumpT += dt;
    const sp = D.spinT > 0 ? Math.sin((1.6 - D.spinT) / 1.6 * Math.PI) : 0, ph = (1.6 - Math.max(0, D.spinT)) / 1.6 * TAU;
    const hx = PLAZA.x + Math.cos(D.th) * D.R + sp * Math.cos(ph + D.th) * 1.3, hz = PLAZA.z + Math.sin(D.th) * D.R + sp * Math.sin(ph + D.th) * 1.3;
    const L = D.trail, last = L[L.length - 1];
    if (!last || Math.hypot(hx - last.x, hz - last.z) > 0.04) L.push({ x: hx, z: hz, d: last ? last.d + Math.hypot(hx - last.x, hz - last.z) : 0 });
    if (L.length > 900) L.splice(0, L.length - 900);
    const at = back => { const want = L[L.length - 1].d - back; for (let i = L.length - 1; i > 0; i--) if (L[i - 1].d <= want) { const a = L[i - 1], b = L[i], u = (want - a.d) / Math.max(1e-4, b.d - a.d); return { x: lerp(a.x, b.x, u), z: lerp(a.z, b.z, u) }; } return L[0]; };
    const GY = B.GY, pts = [{ x: hx, z: hz }];
    for (let i = 1; i <= 9; i++) pts.push(at(i * 0.95));
    const hy = i => GY + 1.95 + Math.sin(t * 3.4 - i * 0.75) * 0.24 + Math.max(0, Math.sin(clamp((D.jumpT - i * 0.1) / 0.55, 0, 1) * Math.PI)) * 1.1;
    const lift = (D.upT > 0 ? Math.sin(Math.min(1, D.upT) * Math.PI) * 0.9 : 0) - (D.downT > 0 ? Math.sin(Math.min(1, D.downT) * Math.PI) * 0.85 : 0);
    const place = (o, i, p, q, extraY) => { o.position.set(p.x, hy(i) + (extraY || 0), p.z); o.rotation.set(0, Math.atan2(p.x - q.x, p.z - q.z), 0); };
    place(D.head, 0, pts[0], pts[1], lift);
    D.head.rotation.x = -lift * 0.35;
    D.segs.forEach((s, i) => place(s, i + 1, pts[i + 1], pts[i]));
    D.dancers.forEach((p, i) => { const q = pts[Math.min(i, 9)], n = pts[Math.min(i + 1, 9)]; p.x = q.x; p.z = q.z; p.y = GY; p.baseYaw = p.yaw = Math.atan2(q.x - n.x, q.z - n.z); p.hop = Math.max(0, Math.sin(clamp((D.jumpT - i * 0.1) / 0.55, 0, 1) * Math.PI)) * 0.35; ZHF.animate(p, dt, t, null); });
    if (D.rider) { D.rider.root.position.y = 0.38 + Math.abs(Math.sin(t * 6)) * 0.06; D.rider.root.rotation.z = Math.sin(t * 3) * 0.1; }
    // Longlong runs ahead of the head with the pearl (until the family scene)
    if (D.kidLead === false) return;
    const k = B.kid, a = D.th + 0.42;
    k.x = PLAZA.x + Math.cos(a) * D.R; k.z = PLAZA.z + Math.sin(a) * D.R; k.y = GY; k.faceAt = { x: k.x - Math.sin(a) * 2, z: k.z + Math.cos(a) * 2 }; k.hop = Math.abs(Math.sin(t * 7)) * 0.12;
  }
  // ---------------- the Nian (年兽), made of the Hush: gray, one horn, a mane, white eyes, a droopy nightcap like the Hushlings'
  function makeNian() {
    if (B.nian) return B.nian;
    const g = new THREE.Group(); B.fest.add(g);
    const body = new THREE.Group(), head = new THREE.Group(), legs = [], kb = ZHF.Kit(), kh = ZHF.Kit(), GR = '#8f8a99', DK = '#6f6a7c';
    kb.ball(0, 1.35, 0, 1.0, 0.75, 1.35, GR, { ink: 0.03 }).ball(0, 1.05, 0.15, 0.75, 0.45, 1.0, '#b4afbf', { ink: 0 });
    for (let i = 0; i < 9; i++) kb.cone(0, 2.05, -0.9 + i * 0.2, 0.12, 0.42, DK, { rx: -0.3, ink: 0.008 });
    kb.rod([0, 1.4, -1.25], [0, 1.9, -2.0], 0.1, GR).ball(0, 1.95, -2.1, 0.22, 0.22, 0.22, DK, { ink: 0.01 });
    ZHF.bake(body, kb); g.add(body);
    kh.ball(0, 0, 0, 0.75, 0.68, 0.72, GR, { ink: 0.026 }).box(0, -0.25, 0.55, 0.9, 0.42, 0.6, '#a9a4b5', { ink: 0.016 }).box(0, -0.42, 0.62, 0.8, 0.12, 0.5, '#3a3444', { ink: 0 });
    for (let i = 0; i < 6; i++) { kh.cone(-0.3 + i * 0.12, -0.33, 0.86, 0.04, 0.16, '#f4f2fa', { rx: Math.PI, ink: 0 }); }
    for (const s of [-1, 1]) { kh.ball(s * 0.3, 0.18, 0.58, 0.15, 0.16, 0.1, '#eef0ff', { glow: true }); for (let i = 0; i < 4; i++) kh.cone(s * (0.62 + i * 0.04), 0.3 - i * 0.22, -0.2, 0.16, 0.5, DK, { rz: -s * 1.3, ink: 0.008 }); }
    kh.cone(0, 0.85, 0.05, 0.12, 0.6, '#d8d4e0', { rx: 0.3, ink: 0.012 });
    // the Hush's nightcap, drooping over one ear, with its pompom
    kh.cone(-0.25, 0.7, -0.2, 0.42, 0.9, '#9d98ab', { rz: 0.9, ink: 0.014 }).ball(-0.85, 0.5, -0.2, 0.14, 0.14, 0.14, '#d8d4e0', { ink: 0.008 });
    ZHF.bake(head, kh); head.position.set(0, 1.75, 1.35); g.add(head);
    for (const [x, z] of [[-0.55, 0.75], [0.55, 0.75], [-0.55, -0.8], [0.55, -0.8]]) { const l = new THREE.Group(), kl = ZHF.Kit(); kl.cyl(0, -0.45, 0, 0.2, 0.9, GR, { ink: 0.016 }).ball(0, -0.9, 0.1, 0.24, 0.12, 0.3, DK, { ink: 0.01 }); ZHF.bake(l, kl); l.position.set(x, 0.95, z); g.add(l); legs.push(l); }
    g.scale.setScalar(1.35); g.visible = false;
    B.nian = { g, body, head, legs, x: -10, z: -194, walk: 0, flinch: 0, fade: 1 };
    return B.nian;
  }
  function nianStep(dt, t) {
    const N = B.nian; if (!N || !N.g.visible) return;
    N.flinch = Math.max(0, N.flinch - dt * 2.2);
    N.g.position.set(N.x, B.gy(N.x, N.z), N.z); N.g.rotation.y = 0;
    N.legs.forEach((l, i) => { l.rotation.x = Math.sin(N.walk * 7 + (i % 2 ? Math.PI : 0) + (i > 1 ? Math.PI / 2 : 0)) * 0.45 * Math.min(1, N.speed || 0); });
    N.head.rotation.x = -0.2 + Math.sin(t * 2.4) * 0.06 - N.flinch * 0.5; N.head.rotation.z = Math.sin(t * 1.7) * 0.08;
    N.body.scale.set(1 + N.flinch * 0.12, 1 - N.flinch * 0.15, 1);
    N.g.scale.setScalar(1.35 * N.fade);
  }
  // ---------------- {mimo}'s dragon headband (the finale's gift): a red band, two gold horns
  let BAND = null;
  function band() {
    if (BAND || !G || !G.cast || !G.cast.mimo || !G.cast.mimo.body) return BAND;
    const g = new THREE.Group(); g.position.set(0, 0.5, 0.0); g.rotation.set(-0.12, 0, 0);
    const k = ZHF.Kit(); k.add(ZHF.GEO.tor, '#d6332a', 0, 0, 0, 0.29, 0.29, 0.22, Math.PI / 2, 0, 0, { ink: 0 });
    for (const s of [-1, 1]) k.cone(s * 0.13, 0.13, 0.12, 0.035, 0.16, '#ffcf3f', { rz: -s * 0.35, ink: 0.006 });
    k.ball(0, 0.02, 0.28, 0.05, 0.05, 0.03, '#ffcf3f', { ink: 0.004 });
    ZHF.bake(g, k); g.visible = false; G.cast.mimo.body.add(g); BAND = g; return g;
  }
  const hatOn = () => !!(G && G.state && G.state.lang === 'zh' && G.state.ny && G.state.ny.band && !G.state.ny.bandOff);

  // ---------------- the music: «舞龙» (Dragon Dance), the festival: 锣鼓 (the 咚咚锵 of drum, cymbals and gong) over a half-time
  // hip-hop pulse, an 808 under it, claps, a suona-bright FM hook, horn stabs, firecracker crackle in the breaks
  (function addSong() {
    if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return;
    const K = Sound.kit;
    const HOOK = K.mel('D5/2 E5/2 F#5/2 A5/4 F#5/2 E5/4 | D5/2 B4/2 D5/4 E5/8 | A5/2 B5/2 A5/2 F#5/2 E5/4 D5/4 | E5/6 F#5/2 D5/8 | D5/2 E5/2 F#5/2 A5/4 B5/2 A5/4 | D6/4 B5/2 A5/2 F#5/8 | E5/2 F#5/2 A5/2 B5/2 A5/2 F#5/2 E5/4 | D5/12 r/4', 0);
    const BASS = [[38, 0, 3], [38, 3, 1], [50, 6, 2], [38, 10, 2], [45, 12, 2], [47, 14, 2]];
    const ROOT = [0, 0, -2, -2, 0, 0, 5, 7];
    Sound.addSong('zh_newyear', { bpm: 96, len: 256, vol: 0.34, verb: 0.12, echo: 0.08, echoSteps: 3,
      play(i, t, s16) {
        const bar = (i >> 4) & 15, st = i & 15, sec = bar >> 3, rt = ROOT[bar & 7];
        if (st === 0 || st === 7 || (st === 10 && bar % 2)) K.kick808(t, st ? 0.6 : 0.85, 0.32);
        if (st === 4 || st === 12) K.claps(t, 0.75);
        if (st % 2 === 0) K.hat(t, st % 4 ? 0.35 : 0.55); if (st === 14) K.hat(t, 0.4, true);
        // 咚 咚 锵 · 咚 咚 锵 (the tanggu drum, then cymbals and the small gong together)
        if (st === 0 || st === 2 || st === 8 || st === 10) K.tanggu(t, st % 8 ? 0.55 : 0.8);
        if (st === 4 || st === 12) { K.naobo(t, 0.7, 0.3); if (sec || st === 12) K.luo(t, true, 0.7); }
        if (st === 15 && bar % 4 === 3) K.luo(t, false, 0.8);
        for (const [m, at, len] of BASS) if (st === at) K.sub808(m + rt, t, len * s16 * 0.95, 0.85);
        if (sec === 0) { const n = HOOK[i & 127]; if (n) K.fmlead(n[0], t, n[1] * s16 * 0.92, 0.85, 3.2); }
        else { if (st === 3 || st === 11) K.horn(62 + rt, t, 0.8, 0.12), K.horn(66 + rt, t, 0.6, 0.12), K.horn(69 + rt, t, 0.6, 0.12); const n = HOOK[(i + 64) & 127]; if (n && st >= 8) K.fmlead(n[0] + 12, t, n[1] * s16 * 0.6, 0.55, 2.4); }
        if (bar % 8 === 7 && st >= 12) K.crackle(t, s16, 3);
        if (i % 128 === 0) K.crash(t, 0.8);
      } });
  })();

  // ================================================================ every frame
  let waveT = 3, kidHopT = 0;
  const FEST = { on: false };
  const RACE = { on: false, kid: 0, you: 0, goal: 8, boats: null, A: null };
  function update(dt, t, you) {
    if (!B) return;
    const on = shown() && !(G.indoors && G.indoors()), Y = G.sim.you, st = on ? S() : null;
    const near = on && (FEST.on || Math.hypot(Y.x - TOWER.x, Y.z - TOWER.z) < 160);
    B.root.visible = near;
    for (const c of B.colliders) { c.x = c.x0 + (on ? 0 : 1e5); c.z = c.z0; }
    B.kid.hidden = !on;
    for (const p of [B.chenS, B.huS, B.mom, B.dad]) p.hidden = true;
    if (G.cast) { const b = band(); if (b) b.visible = hatOn(); }
    if (!on) { ZHF.music.want('ny', null, 0); ZHF.music.frame(t); return; }
    B.door.visible = !!st.ch[3]; B.lan.visible = !!(st.ch[3] || st.l4); B.fest.visible = FEST.on || !!st.ch[5]; B.kit.visible = FEST.on;
    ZHF.music.want('ny', 'zh_newyear', FEST.on ? 0.42 : RACE.on ? 0.22 : 0, { duck: FEST.on ? 0.05 : 0.35 }); ZHF.music.frame(t);
    if (!near) return;
    const k = B.kid, scene = typeof STORY !== 'undefined' && STORY.busy;
    if (!FEST.on) {
      if (!scene && (waveT -= dt) <= 0) { waveT = 3 + Math.random() * 4; k.pose = 'wave'; k.waveT = 1.4; }
      if (k.waveT > 0 && (k.waveT -= dt) <= 0) k.pose = 'idle';
      if ((kidHopT -= dt) <= 0) { kidHopT = 2 + Math.random() * 5; k.hopT = 0.5; }
      k.hop = k.hopT > 0 ? Math.abs(Math.sin((k.hopT -= dt) * 6.3)) * 0.18 : 0;
      if (k.toy) k.toy.rotation.z = Math.sin(t * 5) * 0.35;
    }
    ZHF.animate(k, dt, t, FEST.on ? null : you);
    for (const p of [B.chenS, B.huS, B.mom, B.dad]) if (p.root.visible) ZHF.animate(p, dt, t, null);
    dragonStep(dt, t); nianStep(dt, t); raceStep(dt, t);
  }

  // ================================================================ the call HUD: a small panel at the bottom (the dance, the Nian, the boats)
  const HUD_CSS = `
#nyhud { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 11; width: min(580px, calc(100vw - 24px)); background: #fffaf0; border: 3px solid #2b2235; border-radius: 18px;
  box-shadow: 0 0 0 5px #fff, 0 10px 0 4px rgba(43,34,53,.22); padding: 10px 14px 12px; font-family: "Trebuchet MS", "Segoe UI", sans-serif; color: #2b2235; }
#nyhud.hidden { display: none; } #nyhud * { box-sizing: border-box; }
#nyhud .hd { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #c8322a; }
#nyhud .cue { display: flex; align-items: center; gap: 12px; margin-top: 3px; }
#nyhud .ic { width: 62px; height: 62px; border-radius: 14px; background: #d6332a; color: #fffaf0; display: grid; place-items: center; font: 900 36px "Segoe UI Symbol", "Segoe UI Emoji", sans-serif; border: 3px solid #2b2235; flex: 0 0 auto; box-shadow: inset 0 0 0 3px #e8c35a; }
#nyhud .t { font: 800 20px Bahnschrift, "Segoe UI", sans-serif; line-height: 1.2; } #nyhud .sub { font-size: 13px; font-weight: 700; opacity: .7; }
#nyhud form { display: flex; gap: 8px; margin-top: 8px; }
#nyhud input { flex: 1; min-width: 0; font: 600 22px ${ZHF.SANS}; padding: 5px 10px; border: 2.5px solid #2b2235; border-radius: 12px; outline: none; } #nyhud input:focus { box-shadow: 0 0 0 3px rgba(200,50,42,.3); }
#nyhud button { font: inherit; font-weight: 800; font-size: 15px; color: #2b2235; border: 2.5px solid #2b2235; border-radius: 12px; padding: 4px 12px; background: #fffaf0; cursor: pointer; } #nyhud button.go { background: #c8322a; color: #fff; }
#nyhud .fb { min-height: 22px; margin-top: 6px; font-weight: 800; font-size: 15px; line-height: 1.5; } #nyhud .fb.ok { color: #13786b; } #nyhud .fb.no { color: #c8322a; }
#nyhud .bar { height: 10px; border-radius: 99px; background: rgba(43,34,53,.12); overflow: hidden; margin-top: 7px; } #nyhud .bar b { display: block; height: 100%; background: #e8c35a; transition: width .3s; }
#nyhud .gr { float: right; font: 900 20px Bahnschrift, sans-serif; color: #fff; padding: 0 10px; border-radius: 10px; border: 2.5px solid #2b2235; } #nyhud .gr.S { background: #e0a020; } #nyhud .gr.A { background: #21a493; } #nyhud .gr.B { background: #3f7fc9; } #nyhud .gr.C { background: #8a5ab0; } #nyhud .gr.D { background: #8a8f9e; }
body.ny-hud .bubble, body.ny-hud #thought, body.ny-hud .prompt, body.ny-hud #objective { display: none !important; }
`;
  const HUD = { el: null, res: null, cur: null, keys: null };
  function hudOpen(title) {
    ZHF.css('ny-css', HUD_CSS);
    if (!HUD.el) {
      const el = document.createElement('div'); el.id = 'nyhud'; el.className = 'hidden';
      el.innerHTML = `<div class="hd"></div><div class="cue"><div class="ic"></div><div><div class="t"></div><div class="sub"></div></div></div><form autocomplete="off"><input spellcheck="false"><button type="submit" class="go">Call it!</button><button type="button" class="help">?</button></form><div class="fb"></div><div class="bar"><b></b></div>`;
      document.body.appendChild(el); HUD.el = el;
      const q = s => el.querySelector(s); HUD.q = { hd: q('.hd'), ic: q('.ic'), t: q('.t'), sub: q('.sub'), form: q('form'), input: q('input'), help: q('.help'), fb: q('.fb'), bar: q('.bar b') };
      ZHF.ime(HUD.q.input);
      HUD.q.form.addEventListener('submit', e => { e.preventDefault(); const r = HUD.res; if (r) { HUD.res = null; r(HUD.q.input.value); } });
      HUD.q.help.onclick = () => { if (HUD.cur) HUD.cur.help(); HUD.q.input.focus(); };
    }
    HUD.q.hd.textContent = title || ''; HUD.el.classList.remove('hidden'); document.body.classList.add('ny-hud');
    HUD.keys = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); const r = HUD.res; if (r) { HUD.res = null; r('\u0000quit'); } } };
    addEventListener('keydown', HUD.keys, true);
    Input.typing = true; if (G) { G.state.teaching = true; G.prompt = null; }
  }
  function hudClose() {
    if (!HUD.el) return;
    HUD.el.classList.add('hidden'); document.body.classList.remove('ny-hud');
    if (HUD.keys) { removeEventListener('keydown', HUD.keys, true); HUD.keys = null; }
    Input.typing = false; if (G) G.state.teaching = false; HUD.cur = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
  }
  function hudCue(o) { const Q = HUD.q; Q.ic.textContent = o.icon || '龙'; Q.t.innerHTML = o.title || ''; Q.sub.innerHTML = o.sub || ''; Q.bar.style.width = Math.round((o.bar || 0) * 100) + '%'; }
  const hudFb = (html, ok) => { HUD.q.fb.className = 'fb ' + (ok === undefined ? '' : ok ? 'ok' : 'no'); HUD.q.fb.innerHTML = html || ''; };
  const GRN = ['S', 'A', 'B', 'C', 'D'];
  // ask for one call until it's said (or shown and moved on): → its grade ('S'…'D'), or 'quit'
  async function hudCall(src, alts, en) {
    const Q = HUD.q, list = [src].concat(alts || []);
    let tries = 0, shownA = false;
    Q.input.value = ''; Q.input.placeholder = 'call it in Chinese…'; setTimeout(() => Q.input.focus(), 30);
    HUD.cur = { answer: ZHF.P(src, { mode: 'chars' }), roman: ZHF.R(src), help() { shownA = true; hudFb(`Say ${H(src, { ruby: 'always' })}${en ? ' (' + esc(en) + ')' : ''}`); ZHF.sayVoice(src); } };
    for (;;) {
      const text = await new Promise(r => { HUD.res = r; });
      if (text && text[0] === '\u0000') { HUD.cur = null; return text.slice(1); }       // ('quit': Esc; 'over': the race ended meanwhile)
      const t = String(text || '').trim(); if (!t) continue;
      if (ZHF.idk(t)) { HUD.cur.help(); Q.input.value = ''; continue; }
      const m = ZHF.saysAny(t, list);
      if (m >= 0) {
        const r = ZHF.says(t, list[m]), g = GRN[Math.min(4, (shownA ? 2 : 0) + tries + (r.toneBad ? 1 : 0))];
        try { CJK.used(t, list[m], { lang: 'zh' }); Sound.play(g === 'S' ? 'perfect' : 'review'); } catch (e) { /* */ }
        hudFb(`<span class="gr ${g}">${g}</span>✓ ${H(list[m])}${r.toneBad ? ' · tones: ' + esc(ZHF.R(list[m])) : ''}`, true);
        Q.input.value = ''; HUD.cur = null; return g;
      }
      tries++; try { Sound.play('wrong'); } catch (e) { /* */ }
      if (tries >= 3) { hudFb(`<span class="gr D">D</span>It’s ${H(src, { ruby: 'always' })}. Onward!`, false); Q.input.value = ''; HUD.cur = null; return 'D'; }
      hudFb(tries >= 2 ? `Try ${H(src, { ruby: 'always' })}` : 'Not that one! (? shows it)', false); Q.input.select();
    }
  }

  // ================================================================ the scenes
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const SPEAK = () => ({ kid: B.kid, chen: B.chenS.root.visible ? B.chenS : (typeof CARDS !== 'undefined' && CARDS._.BUILT ? CARDS._.BUILT.chen : B.chenS), hu: B.huS.root.visible ? B.huS : (typeof CARDS !== 'undefined' && CARDS._.BUILT ? CARDS._.BUILT.hu : B.huS), mom: B.mom, dad: B.dad });
  const say = (who, key) => ZHF.say(SPEAK()[who], ZHF.lineOf(LT, key));
  const you = text => STORY.you(text), think = (text, s) => STORY.think(text, s);
  const lock = on => { if (G) G.sim.lock = on ? 1 : 0; };
  const front = (p, d) => ({ x: p.x + Math.sin(p.baseYaw) * d, z: p.z + Math.cos(p.baseYaw) * d });
  function standBy(at) {
    const Y = G.sim.you, M = G.sim.mimo, k = B.kid, f = at || front(k, 1.9);
    Y.x = f.x; Y.z = f.z; Y.yaw = Math.atan2((at ? TOWER.x : k.x) - Y.x, (at ? TOWER.face : k.z) - Y.z);
    M.x = f.x + 0.9; M.z = f.z + 0.5; M.station = null; M.wander = null; M.look = { x: k.x, z: k.z };
    [Y.x, Y.z] = WORLD.pushOut(Y.x, Y.z, 0.4); [M.x, M.z] = WORLD.pushOut(M.x, M.z, 0.3); G.sim.snap();
  }
  function shotKid() { const k = B.kid, f = front(k, 3.6), s = { x: Math.cos(k.baseYaw) * 1.4, z: -Math.sin(k.baseYaw) * 1.4 }; G.cam.override = { pos: V3(f.x + s.x, k.y + 1.9, f.z + s.z), look: V3(k.x, k.y + 0.9, k.z) }; }
  const shot = (p, l) => { G.cam.override = { pos: V3(p[0], p[1], p[2]), look: V3(l[0], l[1], l[2]) }; };
  async function scene(fn) {
    lock(true);
    try { await fn(); } catch (e) { console.error('[newyear] scene', e); }
    finally { G.cam.override = null; lock(false); if (G.sim.mimo) G.sim.mimo.look = null; if (!FEST.on) G.fx.hush = 0; if (G.save) G.save(); }
  }
  const coins = (n, why) => { G.state.coins = (G.state.coins || 0) + n; try { Sound.play('chest'); } catch (e) { /* */ } UI.toast(`${why || 'A red envelope'}: +${n} coins`); };
  const teachAll = ids => ids.forEach(id => ZHF.teach(id));
  const WHO = { nameSrc: NAMES.kid, icon: 'nyKid' };

  // ---------------- chapter 1: the twelve animals
  async function meet() {
    const st = S();
    await scene(async () => {
      standBy(); shotKid();
      B.kid.pose = 'cheer'; await say('kid', 'ny.kid.roar'); B.kid.pose = 'idle';
      await say('kid', 'ny.kid.hi'); await say('kid', 'ny.kid.grandpa');
      G.cam.override = { pos: V3(TOWER.x + 6.5, 3.0, TOWER.z - 7.5), look: V3(TOWER.x, 8.6, TOWER.z) };
      await say('kid', 'ny.kid.bell'); await say('kid', 'ny.kid.bell2');
      shotKid(); await you('The Hush silenced the bells… Pulao and I will make them roar again!');
      st.met = true;
    });
    const go = await UI.choose(`${Pl(NAMES.kid)}: «${Pl('[我们|wǒ men] [玩|wán] [吧|ba] ！')}» (Let’s play!)`, [{ label: 'The twelve animals now', sub: 'the zodiac race, the animals’ names, your own animal', value: 1 }, { label: 'Later', value: 0 }]);
    if (go) await chapter1();
  }
  async function chapter1() {
    const st = S();
    await scene(async () => { standBy(); shotKid(); await say('kid', 'ny.kid.zodiac'); await say('kid', 'ny.kid.race'); await say('kid', 'ny.kid.cat'); });
    const steps = [];
    for (let g = 0; g < 4; g++) {
      const A3 = ANIMALS.slice(g * 3, g * 3 + 3), src = A3.map(A => A.src).join(' ');
      steps.push({ kind: 'New · say them in the race’s order', tiles: A3.map(A => medal(A)), answer: src, voice: src, placeholder: A3.map(A => Pl(A.src)).join(' '),
        say: [['[第一|dì yī] [是|shì] [老鼠|lǎo shǔ] ！ [然后|rán hòu] [是|shì] [牛|niú] [和|hé] [老虎|lǎo hǔ] 。', 'First the rat! Then the ox and the tiger.'], ['[兔子|tù zi] ， [龙|lóng] ， [蛇|shé] 。 [龙|lóng] [是|shì] [第五|dì wǔ] ！', 'Rabbit, dragon, snake. The dragon came fifth!'], ['[马|mǎ] ， [羊|yáng] ， [猴|hóu] 。', 'Horse, goat, monkey.'], ['[鸡|jī] ， [狗|gǒu] ， [猪|zhū] 。 [猪|zhū] [最后|zuì hòu] ！', 'Rooster, dog, pig. The pig came last!']][g],
        gl: g === 0 ? 'Type all three, in order: pinyin («shu niu hu») or characters. Tones are optional.' : '' });
    }
    for (const [a, b] of [[2, 3], [5, 6], [9, 10]]) steps.push({ kind: 'From memory · who came next?', tiles: [medal(ANIMALS[a]), `<div style="font:900 40px sans-serif;align-self:center">→ ?</div>`], answer: ANIMALS[b].src,
      say: ['[谁|shéi] [是|shì] [下|xià] [一|yī] [个|gè] ？', 'Who’s next?'], placeholder: 'the next animal…' });
    // your year (digit by digit) → your animal → «我属…»
    let mine = null;
    steps.push({ kind: 'Your turn · what year were you born?', tiles: [], say: ['[你|nǐ] [哪|nǎ] [年|nián] [出生|chū shēng] [的|de] ？', 'What year were you born?'],
      gl: `Any year you like (it stays in this game). Say it digit by digit, then 年: 1998 is ${H(yearSrc(1998), { ruby: 'always' })}.`, placeholder: 'yī jiǔ jiǔ bā nián…', testAnswer: '二零零四年',
      check: t => { const y = readYear(t); if (!y) return { ok: false, why: 'Four digits, one by one, then 年: ' + H(yearSrc(2004), { ruby: 'always' }) }; mine = { year: y.y, A: animalOf(y.y), arabic: y.arabic }; return { ok: true, said: yearSrc(y.y) }; },
      then: () => { const A = mine.A, nx = steps[steps.indexOf(steps.find(s => s.mineStep))]; if (nx) { nx.answer = '[我|wǒ] [属|shǔ] ' + A.src + ' 。'; nx.tiles = [medal(A, true)]; nx.say = ['[哇|wā] ！ [你|nǐ] [属|shǔ] ' + A.src + ' ！', 'Wow! You’re a ' + A.en + '!']; } } });
    steps.push({ mineStep: true, kind: 'Say it: «I’m a …»', tiles: [], answer: '[我|wǒ] [属|shǔ] [龙|lóng] 。', placeholder: 'wǒ shǔ …', gl: 'Use 属 (shǔ): 我属 + your animal.' });
    steps.push({ kind: 'A quiz · Grandpa Chen was born in 1954', tiles: [medal(ANIMALS[0]), medal(ANIMALS[6]), medal(ANIMALS[11])], answer: animalOf(1954).src, alts: ['[属|shǔ] ' + animalOf(1954).src],
      say: ['[我|wǒ] [爷爷|yé ye] [一|yī] [九|jiǔ] [五|wǔ] [四|sì] [年|nián] [出生|chū shēng] 。 [他|tā] [属|shǔ] [什么|shén me] ？', 'My grandpa was born in 1954. What’s his animal?'],
      gl: 'Count from a year you know: 1948 was a rat (鼠), then one animal a year.', placeholder: 'his animal…', after: '1954 → 马, the horse' });
    const r = await ZHF.drill(steps, { title: 'The twelve animals · 十二生肖', sub: 'Longlong’s zodiac', who: WHO });
    if (r.quit) { think(`Longlong stamps his foot: «${Pl('[下次|xià cì] [吧|ba] ！')}» (next time, then!)`, 3); return; }
    if (mine) { st.year = mine.year; st.animal = mine.A.i; }
    st.ch[1] = true; teachAll(['ph.ny.shu', 'ph.ny.shulong']);
    await scene(async () => { standBy(); shotKid(); B.kid.pose = 'cheer'; await say('kid', 'ny.kid.done1'); B.kid.pose = 'idle'; });
    coins(2, 'Longlong gives you a paper-cut of your animal (and two coins)');
  }

  // ---------------- chapter 2: red envelopes (the wishes, and five grown-ups to wish them to)
  async function chapter2() {
    const st = S();
    if (!st.l2) {
      await scene(async () => { standBy(); shotKid(); await say('kid', 'ny.kid.hongbao'); await say('kid', 'ny.kid.rule'); await say('kid', 'ny.kid.who'); });
      const r = await ZHF.lesson({ title: 'New Year wishes · 吉祥话', sub: 'Longlong’s red-envelope school', who: WHO,
        intro: { zh: '[跟|gēn] [我|wǒ] [说|shuō] ！', en: 'Say them after me!' }, items: ['ph.ny.xinnian', 'ph.ny.gongxi', 'ph.ny.jiankang', 'ph.ny.wanshi', 'ph.ny.longma'].map(id => PHI[id]),
        outro: { zh: '[好|hǎo] ！ [去|qù] [拜年|bài nián] [吧|ba] ！', en: 'Good! Go and wish people a happy New Year!' } });
      if (r.quit) return;
      st.l2 = true; st.round = true;
      await scene(async () => { standBy(); shotKid(); await say('kid', 'ny.kid.go'); });
      UI.toast('Wish five grown-ups a happy New Year: Grandpa Chen and Grandpa Hu (the card table), Rosa, Bruno, Marta.');
      return;
    }
    const n = Object.values(st.hb).filter(Boolean).length;
    if (n < 5) { await scene(async () => { standBy(); shotKid(); await say('kid', 'ny.kid.go'); }); think(`${n} of 5 red envelopes so far.`, 3); return; }
    await scene(async () => { standBy(); shotKid(); B.kid.pose = 'cheer'; await say('kid', 'ny.kid.back2'); B.kid.pose = 'idle'; await say('kid', 'ny.kid.eight'); });
    teachAll(['ph.ny.hongbao']); st.ch[2] = true; st.round = false;
  }
  // a grown-up to wish (the round): { id, x, z, y, top, nameSrc }
  function elderAt(id) {
    if (id === 'chen' || id === 'hu') { if (typeof CARDS === 'undefined' || !CARDS._.BUILT) return null; const p = CARDS._.BUILT[id]; return p && !p.hidden ? p : null; }
    const n = G.sim.npc(id); if (!n) return null;
    return { id, x: n.x, z: n.z, y: n.y !== undefined ? n.y : B.gy(n.x, n.z), top: 2.1, nameSrc: NAMES[id] };
  }
  async function greet(id) {
    const st = S(), E = ELDERS.find(e => e.id === id), p = elderAt(id); if (!E || !p || st.hb[id]) return;
    const keys = Object.keys(WISH);
    await scene(async () => {
      for (let tries = 0; ; tries++) {
        const r = await ZHF.ask({ title: `Wish ${Pl(NAMES[id])} a happy New Year! (${E.why.split(':')[0]})`, model: WISH[E.best[0]], modelEn: (PHI['ph.ny.' + E.best[0]] || {}).en || '', icon: 'nyLantern', hint: tries ? `Longlong whispers: ${E.why}` : '' });
        if (!r) return;
        const m = ZHF.saysAny(r.text, keys.map(k => WISH[k]));
        if (m < 0) { try { Sound.play('wrong'); } catch (e) { /* */ } continue; }
        const best = E.best.includes(keys[m]), amt = best ? 8 : 6;
        if (id === 'chen' && keys[m] === 'jiankang') await ZHF.say(p, ZHF.lineOf(LT, 'ny.give.chen'));
        else if (id === 'bruno' && keys[m] === 'longma') await ZHF.say(p, ZHF.lineOf(LT, 'ny.give.bruno'));
        else await ZHF.say(p, ZHF.lineOf(LT, best ? 'ny.give.best' : 'ny.give.ok'));
        st.hb[id] = amt; coins(amt, `A red envelope from ${Pl(NAMES[id])}${best ? ' (the perfect wish!)' : ''}`);
        if (!best) think(`Good! For ${Pl(NAMES[id])}, ${E.why.split(': ')[1] || ''} would be even better.`, 4.5);
        break;
      }
    });
    const n = Object.values(st.hb).filter(Boolean).length;
    if (n >= 5) think('Five red envelopes! Back to Longlong at the bell tower.', 4);
  }

  // ---------------- chapter 3: the couplets and the upside-down 福, on the bell tower's door
  async function chapter3() {
    const st = S(), ty = B.gy(TOWER.x, TOWER.face + 0.3);
    await scene(async () => { standBy(); shotKid(); await say('kid', 'ny.kid.chunlian'); });
    const steps = [
      { kind: 'Read it out loud', tiles: [chip(COUPLET.up)], answer: COUPLET.up, voice: COUPLET.up, gl: esc(COUPLET.upEn), say: ['[你|nǐ] [来|lái] [读|dú] ！ [大声|dà shēng] [一点|yī diǎn] ！', 'You read them! Louder!'] },
      { kind: 'Read it out loud', tiles: [chip(COUPLET.down)], answer: COUPLET.down, voice: COUPLET.down, gl: esc(COUPLET.downEn) },
      { kind: 'Read it out loud: the one across the top', tiles: [chip(COUPLET.top, true)], answer: COUPLET.top, voice: COUPLET.top, gl: esc(COUPLET.topEn) },
      { kind: 'Which one is the first line (上联)?', tiles: [chip(COUPLET.up), chip(COUPLET.down)], answer: COUPLET.up, placeholder: 'say the first line…',
        say: ['[上联|shàng lián] [贴|tiē] [右边|yòu biān] ， [下联|xià lián] [贴|tiē] [左边|zuǒ biān] 。 [看|kàn] [最后|zuì hòu] [一|yī] [个|gè] [字|zì] [的|de] [声调|shēng diào] ！', 'The first line goes on the right, the second on the left. Look at the last character’s tone!'],
        gl: 'The first line ends on a third or fourth tone; the second, on a first or second tone. 地 dì or 间 jiān?', miss: 'That one ends with 间 (jiān, first tone): it’s the second line.', after: '地 dì: fourth tone. The first line!' },
      { kind: `Tell ${G.state.mimoName} where: the first line`, tiles: [chip(COUPLET.up)], answer: '[贴|tiē] [在|zài] [右边|yòu biān] ！', alts: ['[右边|yòu biān]', '[右|yòu]'], say: ['[上联|shàng lián] [贴|tiē] [哪里|nǎ lǐ] ？', 'Where does the first line go?'], placeholder: 'tiē zài …' },
      { kind: 'And the second line', tiles: [chip(COUPLET.down)], answer: '[贴|tiē] [在|zài] [左边|zuǒ biān] ！', alts: ['[左边|zuǒ biān]', '[左|zuǒ]'], placeholder: 'tiē zài …' },
      { kind: 'And the one across the top', tiles: [chip(COUPLET.top, true)], answer: '[贴|tiē] [在|zài] [上面|shàng mian] ！', alts: ['[上面|shàng mian]', '[上边|shàng bian]', '[上|shàng]'], placeholder: 'tiē zài …' },
      { kind: 'Longlong sticks 福 on the door… upside down!', tiles: [`<div style="width:86px;height:86px;transform:rotate(45deg);background:#d6332a;border:3px solid #2b2235;box-shadow:inset 0 0 0 4px #e8c35a;display:grid;place-items:center;margin:12px"><span style="transform:rotate(135deg);color:#1d1418;font:900 46px ${ZHF.FONT}">福</span></div>`],
        answer: '[福|fú] [到|dào] [了|le] ！', alts: ['[福|fú] [倒|dào] [了|le]'], say: ['[我|wǒ] [倒|dào] [着|zhe] [贴|tiē] ！ [你|nǐ] [说|shuō] [什么|shén me] ？', 'I stuck it upside down! What do you say?'],
        gl: '倒 dào (upside down) sounds just like 到 dào (arrived)…', placeholder: 'fú … le!' },
    ];
    const r = await ZHF.drill(steps, { title: 'Spring couplets · 春联', sub: 'for the bell tower’s door', who: WHO });
    if (r.quit) return;
    st.ch[3] = true; B.door.visible = true;
    await scene(async () => {
      standBy(SPOT.door); shot([TOWER.x + 3.2, ty + 2.2, TOWER.face + 4.6], [TOWER.x, ty + 1.9, TOWER.face]);
      const M = G.sim.mimo; M.happy = 1.5; try { G.w3d.fx.sparkle(TOWER.x, ty + 1.8, TOWER.face + 0.4, 18, ['#ffd23f', '#ff6b5a']); Sound.play('learned'); } catch (e) { /* */ }
      await say('kid', 'ny.kid.fu2'); await say('kid', 'ny.kid.fuparts'); await say('kid', 'ny.kid.done3');
    });
    teachAll(['ph.ny.fudaole']); coins(4, 'Longlong shares his sweets money');
  }
  // a couplet on red paper (characters, as on a real door; the pinyin under it in pinyin mode)
  function chip(src, across) {
    const chars = ZHF.P(src, { mode: 'chars' }).replace(/\s/g, ''), roman = CJK.mode('zh') === 'roman' ? `<small style="font-weight:800;opacity:.75">${esc(ZHF.R(src))}</small>` : '';
    const box = across ? `<div style="background:#d6332a;border:3px solid #2b2235;box-shadow:inset 0 0 0 3px #e8c35a;padding:6px 16px;font:900 30px ${ZHF.FONT};color:#1d1418;letter-spacing:.2em">${esc(chars)}</div>`
      : `<div style="background:#d6332a;border:3px solid #2b2235;box-shadow:inset 0 0 0 3px #e8c35a;padding:10px 8px;font:900 28px ${ZHF.FONT};color:#1d1418;writing-mode:vertical-rl;letter-spacing:.15em;min-height:150px">${esc(chars)}</div>`;
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">${box}${roman}</div>`;
  }

  // ---------------- chapter 4: dragon boats (a toy race on the pond: shout 划！ and 加油！) and lantern riddles
  function raceSetup() {
    const P0 = G.town && G.town.objects && G.town.objects.pond, A = P0 && P0.A ? P0.A : { x: 6.5, z: -178.5, r: 3.4 };
    RACE.A = A;
    if (!RACE.boats) {
      RACE.boats = [0, 1].map(i => {
        const g = new THREE.Group(), k = ZHF.Kit(), col = i ? '#3f8a3c' : '#d6332a';
        k.box(0, 0.06, 0, 0.26, 0.1, 0.95, col, { ink: 0.008 }).box(0, 0.12, 0, 0.28, 0.03, 0.97, '#e8c35a', { ink: 0 });
        k.ball(0, 0.22, 0.5, 0.09, 0.08, 0.1, col, { ink: 0.006 }).cone(0.04, 0.32, 0.5, 0.015, 0.08, '#ffcf3f', { ink: 0 }).cone(-0.04, 0.32, 0.5, 0.015, 0.08, '#ffcf3f', { ink: 0 }).cone(0, 0.14, -0.55, 0.06, 0.18, col, { rx: Math.PI / 2, ink: 0.004 });
        for (let j = 0; j < 3; j++) k.ball(0, 0.18, -0.25 + j * 0.22, 0.05, 0.06, 0.05, '#f5cda2', { ink: 0.004 });
        ZHF.bake(g, k); g.visible = false; B.root.add(g); return g;
      });
    }
  }
  function raceStep(dt, t) {
    if (!RACE.boats) return;
    RACE.boats.forEach(b => { b.visible = RACE.on; });
    if (!RACE.on) return;
    RACE.kid += dt / 2.1;
    const A = RACE.A, x0 = A.x - A.r * 0.78, x1 = A.x + A.r * 0.78;
    [RACE.you, RACE.kid].forEach((v, i) => { const b = RACE.boats[i], u = clamp(v / RACE.goal, 0, 1); b.position.set(lerp(x0, x1, u), 0.1 + Math.sin(t * 4 + i) * 0.02, A.z + (i ? 0.75 : -0.75)); b.rotation.set(0, Math.PI / 2, Math.sin(t * 6 + i) * 0.05); });
    if (RACE.kid >= RACE.goal && HUD.res) { const r = HUD.res; HUD.res = null; r('\u0000over'); }
  }
  async function boatRace() {
    raceSetup(); RACE.on = true; RACE.kid = 0; RACE.you = 0;
    const A = RACE.A; shot([A.x + 1.0, 3.6, A.z + 5.2], [A.x, 0.1, A.z]);
    hudOpen('龙舟 · The dragon-boat race (you: red · Longlong: green)');
    const calls = [['[划|huá] ！', 'Row!'], ['[加油|jiā yóu] ！', 'Go, go!']];
    let k = 0, quit = false;
    try {
      while (RACE.you < RACE.goal && RACE.kid < RACE.goal) {
        const [src, en] = calls[k++ % 2];
        hudCue({ icon: '🐉', title: `${H(src, { ruby: 'always' })} <small>(${en})</small>`, sub: `You ${RACE.you}/${RACE.goal} · Longlong ${Math.floor(RACE.kid)}/${RACE.goal}`, bar: RACE.you / RACE.goal });
        const g = await hudCall(src, src === calls[0][0] ? ['[划船|huá chuán]'] : [], en);
        if (g === 'quit') { quit = true; break; }
        if (g === 'over') break;
        if (g !== 'D') { RACE.you += 1; try { Sound.play('hit'); } catch (e) { /* */ } }
      }
    } finally { hudClose(); RACE.on = false; G.cam.override = null; }
    return quit ? null : RACE.you >= RACE.goal;
  }
  async function chapter4() {
    const st = S();
    if (!st.l4) { await scene(async () => { standBy(); shotKid(); await say('kid', 'ny.kid.boat'); await say('kid', 'ny.kid.quyuan'); await say('kid', 'ny.kid.raceGo'); }); st.l4 = true; }
    if (!st.raced) {
      const won = await boatRace(); if (won === null) return;
      st.raced = true; st.raceWon = !!won;
      await scene(async () => { standBy(); shotKid(); B.kid.pose = won ? 'sulk' : 'cheer'; await say('kid', won ? 'ny.kid.raceWon' : 'ny.kid.raceLost'); B.kid.pose = 'idle'; });
      if (won) coins(3, 'Longlong pays up: three coins for the winner');
    }
    await scene(async () => { standBy(); shotKid(); await say('kid', 'ny.kid.lantern'); });
    const r = await riddles(); if (r.quit) return;
    st.ch[4] = true;
    await scene(async () => { standBy(); shotKid(); B.kid.pose = 'cheer'; await say('kid', 'ny.kid.done4'); B.kid.pose = 'idle'; });
    coins(5, 'The lantern-riddle prize');
  }
  function riddles() {
    const st = S();
    return ZHF.drill(RIDDLES.map((R, i) => ({ kind: `Lantern ${i + 1} of 5 · guess the riddle`, tiles: [`<div style="display:flex;gap:12px;align-items:center;max-width:470px"><div style="flex:0 0 auto;width:54px;height:62px;border-radius:50%;background:#d6332a;border:3px solid #2b2235;box-shadow:inset 0 0 0 3px #e8c35a;display:grid;place-items:center;color:#ffd23f;font:900 26px ${ZHF.FONT}">谜</div><div style="font:700 21px/1.7 ${ZHF.SANS};text-align:left">${H(R.q)}</div></div>`],
      gl: esc(R.en), answer: R.a, alts: R.alts, placeholder: 'the answer…', miss: 'Not that one! It’s one of: ' + R.pick.map(s => H(s, { ruby: 'always' })).join(' · '), after: esc(R.aEn),
      say: i === 0 ? ['[第一|dì yī] [个|gè] [灯谜|dēng mí] ！ [猜|cāi] [一|yī] [个|gè] [字|zì] 。', 'The first riddle! Guess a character.'] : i === 3 ? ['[这|zhè] [个|gè] [猜|cāi] [一|yī] [个|gè] [东西|dōng xi] 。', 'This one is a thing.'] : null,
      then: () => { st.rid[i] = true; } })), { title: 'Lantern riddles · 猜灯谜', sub: 'Longlong’s five lanterns', who: WHO });
  }

  // ---------------- chapter 5: New Year's Eve: the dragon dance, the Nian, and the family home again
  const mimoVis = on => { try { G.cast.mimo.root.visible = on; G.cast.mimoShadow.visible = on; } catch (e) { /* */ } };
  async function sparks(x, y, z, n, cols, sound) { try { G.w3d.fx.sparkle(x, y, z, n, cols); if (sound) Sound.play(sound); } catch (e) { /* */ } }
  async function firecrackers() { for (let i = 0; i < 10; i++) { for (const f of B.FIRE) { sparks(f.x + 0.5, B.GY + 2.2 - (i % 4) * 0.35, f.z, 6, ['#ff5a3a', '#ffd23f'], i % 2 ? 'crack' : null); try { G.w3d.fx.puff(f.x + 0.5, B.GY + 1.8, f.z, 2, 0.3, '#d8d4dc', 0.6); } catch (e) { /* */ } } await ZHF.wait(0.14); } }
  async function fireworks(n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, r = 3 + Math.random() * 7; sparks(PLAZA.x + Math.cos(a) * r, 11 + Math.random() * 5, PLAZA.z - 6 + Math.sin(a) * r * 0.6, 26, [['#ffd23f', '#ff6b5a'], ['#7ff7ea', '#fff3a0'], ['#ff8fd1', '#ffd23f']][i % 3], i % 2 ? 'crack' : 'poof'); await ZHF.wait(0.3); } }
  function festOn() {
    const D = makeDragon(); FEST.on = true; D.on = true; D.kidLead = true; D.g.visible = true; D.trail.length = 0; D.th = Math.PI * 0.6; D.R = D.Rt = 6.2;
    for (const p of [B.chenS, B.huS]) p.root.visible = true;
    const k = B.kid; k.pearl.visible = true; k.toy.visible = false; k.pose = 'hold'; k.noTurn = true;
    mimoVis(false);
    const Y = G.sim.you, M = G.sim.mimo; Y.x = SPOT.you.x; Y.z = SPOT.you.z; Y.yaw = Math.atan2(PLAZA.x - Y.x, PLAZA.z - Y.z); M.x = Y.x + 0.8; M.z = Y.z + 0.6; M.station = null; M.wander = null; G.sim.snap();
  }
  function festOff() {
    FEST.on = false;
    if (B.dragon) { B.dragon.on = false; B.dragon.g.visible = false; }
    if (B.nian) B.nian.g.visible = false;
    for (const p of [B.chenS, B.huS, B.mom, B.dad]) p.root.visible = false;
    const k = B.kid; k.x = SPOT.kid.x; k.z = SPOT.kid.z; k.y = B.gy(k.x, k.z); k.yaw = k.baseYaw = SPOT.kid.yaw; k.faceAt = null; k.hop = 0; k.pearl.visible = false; k.toy.visible = true; k.pose = 'idle'; k.noTurn = false;
    mimoVis(true); G.fx.hush = 0;
  }
  const WIDE = [[3.0, 8.6, -132.0], [-10, 1.4, -147.5]], NORTH = [[-10.6, 5.8, -137.5], [-10, 2.4, -165]];
  async function chapter5() {
    const st = S();
    await scene(async () => { standBy(); shotKid(); await say('kid', 'ny.kid.eve'); await say('kid', 'ny.kid.nian'); await say('kid', 'ny.kid.nian2'); await say('kid', 'ny.kid.nian3'); });
    if (!st.l5) {
      const r = await ZHF.lesson({ title: 'New Year’s Eve · 除夕', sub: 'Longlong’s festival words', who: WHO, intro: { zh: '[今天|jīn tiān] [晚上|wǎn shang] [要|yào] [说|shuō] [的|de] ！', en: 'What you say tonight!' },
        items: ['ph.ny.bianpao', 'ph.ny.niannian'].map(id => PHI[id]), outro: { zh: '[走|zǒu] ！ [去|qù] [广场|guǎng chǎng] ！', en: 'Let’s go! To the plaza!' } });
      if (r.quit) return;
      st.l5 = true;
    }
    let quit = false;
    try {
      await UI.fade(1, 450); festOn(); shot(...WIDE); await UI.fade(0, 450);
      await scene(async () => { G.cam.override = { pos: V3(...WIDE[0]), look: V3(...WIDE[1]) }; await say('kid', 'ny.kid.dance'); await say('chen', 'ny.chen.drum'); try { Sound.play('gong'); } catch (e) { /* */ } });
      // the dragon dance: six calls
      shot(...WIDE); lock(true);
      hudOpen('舞龙 · The dragon dance: call the moves!');
      const moves = ZHF.shuffle(MOVES.slice()), D = B.dragon, grades = [];
      for (let i = 0; i < moves.length; i++) {
        const m = moves[i];
        hudCue({ icon: m.icon, title: m.en, sub: `Call it in Chinese! (${i + 1}/6)`, bar: i / moves.length });
        const g = await hudCall(m.src, m.alts, m.en);
        if (g === 'quit') { quit = true; break; }
        grades.push(g);
        if (m.id === 'left') D.Rt = 7.0; else if (m.id === 'right') D.Rt = 5.0; else if (m.id === 'spin') D.spinT = 1.6; else if (m.id === 'jump') D.jumpT = 0; else if (m.id === 'up') D.upT = 1.2; else if (m.id === 'down') D.downT = 1.2;
        try { Sound.play('shout'); } catch (e) { /* */ }
        await ZHF.wait(1.6); if (m.id === 'left' || m.id === 'right') D.Rt = 6.2;
      }
      hudClose();
      if (quit) return;
      st.dance = grades;
      // the Nian comes down the north street; the color drains
      const N = makeNian(); N.x = -10; N.z = -196; N.fade = 1; N.g.visible = true; N.speed = 1;
      shot(...NORTH);
      try { Sound.play('grow'); } catch (e) { /* */ }
      for (let i = 0; i < 70; i++) { N.z += (-164 - N.z) * 0.06; N.walk += 0.05; G.fx.hush = Math.min(0.55, G.fx.hush + 0.012); await ZHF.wait(0.05); }
      N.speed = 0; try { Sound.play('shout'); } catch (e) { /* */ }
      await scene(async () => { G.cam.override = { pos: V3(...NORTH[0]), look: V3(...NORTH[1]) }; G.fx.hush = 0.55; await say('kid', 'ny.kid.uhoh'); await say('chen', 'ny.chen.nian'); });
      shot(...NORTH); lock(true); G.fx.hush = 0.55;
      hudOpen('年兽 · Drive off the Nian with noise and red!');
      for (let i = 0; i < NIAN_BEATS.length; i++) {
        const b = NIAN_BEATS[i];
        hudCue({ icon: ['🧨', '🥁', '🥁', '🏮', '🎉'][i], title: b.title, sub: `(${i + 1}/5)`, bar: i / NIAN_BEATS.length });
        const g = await hudCall(b.src, b.alts, b.en);
        if (g === 'quit') { quit = true; break; }
        if (b.id === 'pao') await firecrackers();
        else if (b.id === 'luo') { B.huS.pose = 'drum'; try { Sound.play('gong'); } catch (e) { /* */ } await ZHF.wait(0.6); B.huS.pose = 'idle'; }
        else if (b.id === 'gu') { B.chenS.pose = 'drum'; for (let j = 0; j < 4; j++) { try { Sound.play('hit'); } catch (e) { /* */ } await ZHF.wait(0.18); } B.chenS.pose = 'idle'; }
        else if (b.id === 'deng') { for (let j = 0; j < 14; j++) { const a = (j / 14) * TAU + 0.12 + Math.PI / 14; sparks(PLAZA.x + Math.cos(a) * 10.4, B.GY + 3.0, PLAZA.z + Math.sin(a) * 10.4, 5, ['#ff3a2a', '#ffd23f'], j % 4 ? null : 'chime'); } }
        else { try { Sound.play('fanfare'); } catch (e) { /* */ } B.kid.pose = 'cheer'; }
        N.flinch = 1; N.z -= 3; G.fx.hush = Math.max(0, 0.55 - (i + 1) * 0.11); try { Sound.play('hurt'); } catch (e) { /* */ }
        await ZHF.wait(0.9);
      }
      hudClose();
      if (quit) return;
      // it flees north, shrinking; the color floods back; fireworks
      N.speed = 1.5; for (let i = 0; i < 40; i++) { N.z -= 0.6; N.walk += 0.08; N.fade = Math.max(0.05, N.fade - 0.025); G.fx.hush = Math.max(0, G.fx.hush - 0.02); await ZHF.wait(0.05); }
      N.g.visible = false; G.fx.hush = 0;
      shot([-10, 2.6, -128], [-10, 13, -152]); await fireworks(9);
      // the family: home for New Year
      const k = B.kid; B.dragon.kidLead = false; k.x = -9.3; k.z = -140.2; k.y = B.GY; k.hop = 0; k.faceAt = { x: -9.3, z: -130 }; k.pose = 'idle'; k.pearl.visible = false;
      B.mom.root.visible = B.dad.root.visible = true;
      await scene(async () => {
        G.cam.override = { pos: V3(-4.6, 2.5, -135.6), look: V3(-9.3, 1.1, -138.6) };
        await say('kid', 'ny.kid.won');
        for (let i = 0; i <= 40; i++) { const u = i / 40; B.mom.x = -10.2; B.mom.z = lerp(-128, -138.4, u); B.dad.x = -8.7; B.dad.z = lerp(-127.6, -138.0, u); [B.mom, B.dad].forEach(p => { p.y = B.GY; p.baseYaw = Math.PI; p.hop = Math.abs(Math.sin(u * 30)) * 0.05; }); await ZHF.wait(0.05); }
        k.pose = 'cheer'; await say('kid', 'ny.kid.parents'); k.pose = 'idle';
        await say('mom', 'ny.mom.hi'); await say('dad', 'ny.dad.hi');
        await say('chen', 'ny.chen.tuanyuan'); ZHF.teach('ph.ny.tuanyuan');
        G.cam.override = { pos: V3(-5.6, 1.9, -137.4), look: V3(-8.8, 0.8, -139.6) };
        mimoVis(true);
        await say('kid', 'ny.kid.gift');
        st.band = true; st.bandOff = false; const b = band(); if (b) b.visible = true;
        if (G.state.zc && G.state.zc.cap) G.state.zc.capOff = true;        // (one gift on Mimo's head at a time)
        const M = G.sim.mimo; M.happy = 2; M.glow = 1; G.sim.emit('learned', {}); sparks(M.x, M.ry + 0.9, M.z, 18, ['#ffd23f', '#ff6b5a']);
        UI.toast(`${G.state.mimoName} wears Longlong’s dragon headband!`);
        teachAll(['ph.ny.bianpao', 'ph.ny.niannian']);
        st.ch[5] = true;
      });
      coins(16, 'Red envelopes from Grandpa Chen and Longlong’s parents');
      await UI.fade(1, 450);
    } finally { festOff(); lock(false); G.cam.override = null; hudClose(); if (G.save) G.save(); }
    await UI.fade(0, 450);
  }

  // ================================================================ the menu
  const CH = [
    { n: 1, title: 'The twelve animals', sub: 'the zodiac race, the animals in order, your animal', gate: f => !!f.rosa, wait: 'after Rosa’s welcome', run: chapter1 },
    { n: 2, title: 'Red envelopes', sub: 'New Year wishes for five grown-ups', gate: f => !!f.boss, wait: 'after the big Hushling on the hill', run: chapter2 },
    { n: 3, title: 'Couplets and 福', sub: 'for the bell tower’s door', gate: f => (f.bells || 0) >= 1, wait: 'after the first bell', run: chapter3 },
    { n: 4, title: 'Dragon boats and lantern riddles', sub: 'a race on the pond, five riddles', gate: f => (f.bells || 0) >= 2, wait: 'after the second bell', run: chapter4 },
    { n: 5, title: 'The New Year festival', sub: 'the dragon dance, and the Nian', gate: f => (f.bells || 0) >= 3, wait: 'after the third bell', run: chapter5 },
  ];
  let talking = false;
  async function kidTalk() { if (talking) return; talking = true; try { await kidTalk0(); } finally { talking = false; } }
  async function kidTalk0() {
    const st = S(), f = flags();
    if (!st.met) return meet();
    const next = CH.find(c => !st.ch[c.n]), opts = [];
    if (next) opts.push(next.gate(f) ? { label: `Chapter ${next.n}: ${next.title}`, sub: next.n === 2 && st.round ? `red envelopes: ${Object.values(st.hb).filter(Boolean).length}/5` : next.sub, value: 'next' } : { label: `Chapter ${next.n}: ${next.title}`, sub: `later: ${next.wait}`, value: 'wait' });
    if (st.ch[1]) opts.push({ label: 'The twelve animals again', value: 'zodiac' });
    if (st.ch[4]) opts.push({ label: 'Lantern riddles again', value: 'riddles' }, { label: 'A boat race on the pond', value: 'race' });
    opts.push({ label: 'Chat', value: 'chat' });
    if (st.band) opts.push({ label: st.bandOff ? `Put the dragon headband back on ${G.state.mimoName}` : `Take ${G.state.mimoName}’s dragon headband off`, value: 'band' });
    const v = await UI.choose(`${Pl(NAMES.kid)}: «${Pl('[嗷|áo] [呜|wū] ！ [玩|wán] [什么|shén me] ？')}» (Rawr! What shall we play?)`, opts);
    if (v === 'next') return next.run();
    if (v === 'wait') return scene(async () => { standBy(); shotKid(); await say('kid', 'ny.kid.wait'); });
    if (v === 'zodiac') return chapter1();
    if (v === 'riddles') return riddles();
    if (v === 'race') { const won = await boatRace(); if (won !== null) await scene(async () => { standBy(); shotKid(); await say('kid', won ? 'ny.kid.raceWon' : 'ny.kid.raceLost'); }); return; }
    if (v === 'chat') { st.chat = (st.chat || 0) + 1; return scene(async () => { standBy(); shotKid(); await say('kid', st.ch[5] ? 'ny.kid.idle4' : ['ny.kid.idle1', 'ny.kid.idle2', 'ny.kid.idle3'][st.chat % 3]); }); }
    if (v === 'band') { st.bandOff = !st.bandOff; if (!st.bandOff && G.state.zc && G.state.zc.cap) G.state.zc.capOff = true; UI.toast(st.bandOff ? 'Headband off.' : `${G.state.mimoName} is a dragon again!`); if (G.save) G.save(); }
  }
  // (cards.js asks: is a New Year wish wanted from this grandpa right now? Then its "Talk" steps aside for ours)
  const wishFor = id => !!(G && shown() && G.state.ny && G.state.ny.round && !G.state.ny.hb[id]);
  const PROVIDER = {
    interactables() {
      if (!B || !shown() || ZHF.overlayOpen || FEST.on || RACE.on || (G.indoors && G.indoors())) return [];
      const L = [], Y = G.sim.you, add = (x, z, r, label, run) => L.push({ x, z, y: B.gy(x, z), r, label, run }), st = S();
      if (Math.hypot(Y.x - B.kid.x, Y.z - B.kid.z) < 14) add(B.kid.x, B.kid.z, 2.0, 'Talk', kidTalk);
      if (st.round) for (const E of ELDERS) if (!st.hb[E.id]) { const p = elderAt(E.id); if (p && Math.hypot(Y.x - p.x, Y.z - p.z) < 6) add(p.x, p.z, 2.2, 'New Year wish (拜年)', () => greet(E.id)); }
      return L;
    },
    tick(dt, Y) {
      if (!B || !shown()) return;
      const st = S();
      if (!st.seen && Math.hypot(Y.x - B.kid.x, Y.z - B.kid.z) < 9) { st.seen = true; think(`A kid in a red dragon hoodie roars at you from behind a cardboard box: «${Pl('[嗷|áo] [呜|wū] ！')}»`, 4.5); }
    },
  };
  // ================================================================ the quest (quests.js LIST: zh games only)
  function quest() {
    const y = s => s.ny || {}, ch = (s, n) => !!(y(s).ch && y(s).ch[n]), kidAt = () => (B ? { x: B.kid.x, z: B.kid.z } : SPOT.kid);
    const step = (n, text, why, hint, target) => ({ get text() { const c = CH[n - 1]; return c && !c.gate(flags()) ? text : text.replace(/ \(after [^)]*\)$/, ''); }, why, done: s => ch(s, n), target: target || kidAt, hint });
    const nHb = s => Object.values(y(s).hb || {}).filter(Boolean).length;
    const nextElder = () => { const st = G && G.state && G.state.ny; if (st && st.round) for (const E of ELDERS) if (!st.hb[E.id]) { const p = elderAt(E.id); if (p) return { x: p.x, z: p.z }; } return kidAt(); };
    return {
      id: 'ny', kind: 'side', title: 'Longlong’s New Year', giver: 'Longlong, the dragon kid by the bell tower',
      started: s => s.lang === 'zh' && !!y(s).met,
      steps: [
        step(1, 'Learn the twelve animals with Longlong (十二生肖)', 'The zodiac race: the rat rode the ox and jumped off first. Every year has its animal, and so do you: 你属什么？', '{mimo} points at the kid in the dragon hoodie.'),
        Object.assign(step(2, 'Red envelopes: wish five grown-ups a happy New Year ({n}/5) (after the big Hushling on the hill)', 'Elders: 身体健康. Shopkeepers: 恭喜发财. Bruno: 龙马精神. Anyone: 新年快乐. Grandpa Chen, Grandpa Hu, Rosa, Bruno and Marta each have a red envelope for a good wish.', '{mimo} points at the next grown-up to wish.', nextElder), { n: nHb }),
        step(3, 'Spring couplets and 福 for the bell tower (after the first bell)', 'Read the couplets aloud, find the first line by its last tone, and tell {mimo} where to stick them.', '{mimo} looks up at the bell tower’s door.'),
        step(4, 'Dragon boats and lantern riddles (after the second bell)', 'A toy dragon-boat race on the pond (shout 划！), then five lantern riddles.', '{mimo} paddles the air with its paws.'),
        step(5, 'The New Year festival (after the third bell)', 'New Year’s Eve in the plaza: the dragon dance, and the Nian.', '{mimo} hops toward the plaza.'),
      ],
      story: [
        { when: s => !!y(s).met, text: 'By the bell tower lives Longlong, Grandpa Chen’s grandson, born in a dragon year and obsessed with dragons. On old bells sits 蒲牢, the dragon’s son who loves to roar: no wonder the silent bells make him sad.' },
        { when: s => ch(s, 2), text: 'You wished five grown-ups a happy New Year, each with the right wish, and got five red envelopes. «恭喜发财，红包拿来！»' },
        { when: s => ch(s, 3), text: 'The bell tower’s door has its spring couplets now, and an upside-down 福: 福到了, good fortune has arrived.' },
        { when: s => ch(s, 4), text: 'You raced toy dragon boats on the pond and guessed all five lantern riddles.' },
        { when: s => ch(s, 5), text: 'New Year’s Eve: you called the dragon dance with {mimo} on the dragon’s head, drove off a Nian made of the Hush with firecrackers, gongs, drums and red lanterns, and Longlong’s mom and dad came home. 团圆. {mimo} wears his dragon headband now.' },
      ],
    };
  }

  // ================================================================ start
  function sources() { return [LT, PH.map(p => p.zh), Object.values(WISH), ANIMALS.map(A => A.src), RIDDLES.map(R => [R.q, R.a, R.alts, R.pick]), MOVES.map(m => [m.src, m.alts]), NIAN_BEATS.map(b => [b.src, b.alts]), Object.values(COUPLET).filter(s => /\[/.test(s)), Object.values(NAMES)]; }
  function cjCheck() { return ZHF.check('newyear', sources()); }
  function init(game) {
    G = game; ZHF.bind(game);
    ZHF.registerLines(LT); registerIcons(); ZHF.phrases(PH);
    try { if (typeof CJK !== 'undefined') CJK.addSource(sources(), 'zh'); } catch (e) { console.warn('[newyear] cjk', e); }
    if (typeof STORY !== 'undefined') { STORY.extra = STORY.extra || []; if (!STORY.extra.includes(PROVIDER)) STORY.extra.push(PROVIDER); }
    if (typeof QUESTS !== 'undefined' && QUESTS.LIST && !QUESTS.LIST.some(q => q.id === 'ny')) QUESTS.LIST.push(quest());
    if (typeof SIGNS !== 'undefined' && SIGNS.add) {
      SIGNS.add({ id: 'ny-poster', x: SPOT.poster.x + Math.sin(SPOT.poster.yaw) * 0.6, z: SPOT.poster.z + Math.cos(SPOT.poster.yaw) * 0.6, r: 1.3, when: () => shown(),
        card: () => ({ tag: 'Longlong’s zodiac poster (生肖)', lines: [0, 1, 2, 3].map(g => ({ text: ANIMALS.slice(g * 3, g * 3 + 3).map(A => A.src).join(' · '), en: ANIMALS.slice(g * 3, g * 3 + 3).map(A => A.en).join(' · '), look: { face: '#d6332a', edge: '#e8c35a', ink: '#fffaf0' } })) }) });
      SIGNS.add({ id: 'ny-door', x: TOWER.x, z: TOWER.face + 1.2, r: 1.6, when: () => shown() && !!(G.state.ny && G.state.ny.ch && G.state.ny.ch[3]),
        card: () => ({ tag: 'The spring couplets on the bell tower’s door', lines: [{ text: COUPLET.top, en: COUPLET.topEn, look: { face: '#d6332a', edge: '#e8c35a', ink: '#1d1418' } }, { text: COUPLET.up, en: COUPLET.upEn + ' (first line, on the right)', look: { face: '#d6332a', edge: '#e8c35a', ink: '#1d1418' } }, { text: COUPLET.down, en: COUPLET.downEn + ' (second line, on the left)', look: { face: '#d6332a', edge: '#e8c35a', ink: '#1d1418' } }, { text: '[福|fú]', en: 'good fortune (upside down: 福到了, it has arrived)', look: { face: '#d6332a', edge: '#e8c35a', ink: '#1d1418' } }] }) });
    }
    setInterval(() => { if (shown()) ZHF.keepFar(PH.map(p => p.id)); }, 30000);
  }
  // ================================================================ tests (the game never calls these)
  const TEST = {
    fast(on = true) { ZHF.LES.fast = on; if (typeof CARDS !== 'undefined') CARDS._.t.fast(on); },
    setup(fl) { Object.assign(G.state.flags, { hatched: true, rosa: true }, fl || {}); },
    // answer whatever the HUD asks (in chars, or pinyin with roman)
    panel(roman) { if (HUD.cur && HUD.res) { const a = roman ? HUD.cur.roman : HUD.cur.answer; const r = HUD.res; HUD.res = null; HUD.q.input.value = a; r(a); return 'hud: ' + a; } return null; },
    get HUD() { return HUD; }, get RACE() { return RACE; }, get FEST() { return FEST; }, get B() { return B; },
  };
  return {
    init, build, update, quest, hatOn, wishFor, interactables: () => [],
    get busy() { return FEST.on || RACE.on; },
    _: { S: () => S(), LT, PH, ANIMALS, RIDDLES, MOVES, NIAN_BEATS, WISH, ELDERS, COUPLET, readYear, animalOf, yearSrc, chapter1, chapter2, chapter3, chapter4, chapter5, kidTalk, meet, greet, boatRace, riddles,
      festOn, festOff, makeDragon, makeNian, cjCheck, sources, PROVIDER, CH, SPOT, t: TEST },
  };
})();
