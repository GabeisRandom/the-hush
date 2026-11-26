'use strict';
// The Drowned Chapel (DESIGN.md 14.1 and 17.1, region 8; REGIONS.md): the Gray Marsh's dungeon, at the end of the pilgrims'
// causeway. Four rooms, one per floor, built like the Ice Clock Tower's and the Sea Fort's: high up and out of sight at y = 300
// (a row at z −420 over the far north-west hills where nobody walks: x −300 / −274 / −248 / −222, 26 apart and far from every
// other room; inside the map's rectangle, which the sim keeps you in),
// walls facing in (the camera looks in like a dollhouse), one room at a time. Lucero and Bruno come in with you: the puzzles
// are commands to several people (team.js), and the light is Mimo's («ilumina»). Each solved puzzle chimes (BFX.solved()) and
// the way on visibly opens, with a prompt.
//   0 the Flooded Nave:  pitch dark: «¡Ilumina!» (the candles catch, and the shadows hiding in the dark jump you: a fight, Bruno
//                        at your side); a fallen oak beam blocks the stairs: everyone pushes, you too («¡Empujemos!»)
//   1 the Choir Loft:    the Hush has sealed the belfry door with a gray skin that swallows sound: one voice can't break it, two
//                        can't either; everyone sings, you too («¡Cantemos!»), and it shatters
//   2 the Belfry Stair:  shadows again (a fight); the trapdoor at the top of the ladder is swollen shut. Someone has to hold the
//                        ladder: you. So tell the two of them to push it («¡Empujen!»; «¡Empujemos!» leaves nobody on the ladder)
//   3 the Belfry:        the Great Shadow is coiled round the bell. Light it («¡Ilumina!»): it wakes, and takes a creature's shape:
//                        three phases, a fight each (boss 'shade'; marsh_battle.js: name what it is, or light it), it changes
//                        shape between them. Then Noa's page (the Old Tower's door is open), and the bell, all of you together
//                        («¡Toquemos…!»: «¡Golpeemos la campana!» or «¡Empujemos la campana!»): the eighth bell. Outside, the whole
//                        marsh hears it, the gray lifts, and Lucero waits in Candil (the report).
//   CHAPEL_D.init(game) · enter() · leave() · update(dt, t) · interactables() · target() · song() · inside · OUTSIDE
// Progress lives in state.chapel; flags.marshFree and flags.bells = 8 when the bell rings (marsh.js's sync lifts the gray).
// Also here: the region's two songs ('marsh': the basin, MARSH.songAt; 'chapel': in here), and the two side quests' play
// (MARSH.sides: Lolo and Mati's shadow puppets; MARSH.drill: Bruno's team drill), quests.js lists them.
const CHAPEL_D = (() => {
  if (typeof MARSH === 'undefined') return { init() {}, inside: false, interactables: () => [], update() {}, target: () => null, song: () => null, ROOMS: [], OUTSIDE: { x: 0, z: 0, yaw: 0 } };
  let G = null, built = false;
  const C = MARSH, { part, G: GEO } = TK;
  const Y0 = 300, HW = 7, HD = 6, WH = 5.6, INK = '#2b2235';
  const ROOMS = [
    { id: 'nave', name: 'The Flooded Nave', sub: 'The Drowned Chapel · the nave', x: -300, z: -420 },
    { id: 'choir', name: 'The Choir Loft', sub: 'The Drowned Chapel · the choir', x: -274, z: -420 },
    { id: 'stair', name: 'The Belfry Stair', sub: 'The Drowned Chapel · the stair', x: -248, z: -420 },
    { id: 'belfry', name: 'The Belfry', sub: 'The Drowned Chapel · the top', x: -222, z: -420 },
  ];
  const OUTSIDE = { x: C.SPOT.chapelDoor.x, z: C.SPOT.chapelDoor.z, yaw: Math.atan2(C.SPOT.chapelDoor.x - C.CH_DOOR.x, C.SPOT.chapelDoor.z - C.CH_DOOR.z) };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const S = () => G.state.chapel || (G.state.chapel = {});
  const lang = () => (G && G.state.lang) || 'es';
  const cjk = l => l === 'zh' || l === 'ja';
  const plainOf = s => (cjk(lang()) && typeof CJK !== 'undefined' && CJK.plain ? CJK.plain(String(s), { lang: lang() }) : String(s));
  const ex = w => (lang() === 'es' ? '¡' : '') + w.charAt(0).toUpperCase() + w.slice(1) + '!';
  const wait = s => STORY.wait(s), tween = (s, fn) => STORY.tween(s, fn);
  const verbs = () => ['v.push', 'v.jump', 'v.hit', 'v.throw', 'v.eat', 'v.swim', 'v.sing', 'v.climb', 'v.blow', 'v.call', 'v.dig', 'v.light'].filter(id => LEX.item(id));
  const has = id => !!LEX.item(id);
  const mimoName = () => G.state.mimoName || 'Mimo';
  let inside = false, cur = -1, quick = {};
  const rooms = [];
  const Kit = () => CAVES.Kit(), KG = () => CAVES.GEO;
  const FIGHT_AT = () => ({ biome: 'cave', x: C.CHAPEL.x, z: C.CHAPEL.z });
  const ALLY = { name: 'Bruno', ally: true };
  const solved = () => { try { if (typeof BFX !== 'undefined' && BFX.solved) BFX.solved(); else Sound.play('chest'); } catch (e) { /* (no sound) */ } };

  // ---------------------------------------------------------------- lines: T(en, es, pt, de, zh, ja), mixed by the weave
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  const CL = {
    // Lucero, in here with you («ustedes / vocês / ihr» to you and Bruno)
    'l.dark': T('I can’t see a thing… Even my lantern can’t get through this dark. {mimo}, can you?', 'No veo nada… Ni mi farol puede con esta oscuridad. {mimo}, ¿y tú?', 'Não vejo nada… Nem a minha lanterna vence esse escuro. {mimo}, e você?', 'Ich sehe nichts… Nicht mal meine Laterne kommt gegen diese Dunkelheit an. {mimo}, und du?',
      '[我|wǒ] [什么|shén me] [都|dōu] [看不见|kàn bu jiàn] … [我|wǒ] [的|de] [灯|dēng] [也|yě] [照|zhào] [不|bù] [亮|liàng] 。 {mimo} ， [你|nǐ] [呢|ne] ？', '[何|なに] も [見|み]えない … わたし の ランタン でも だめ 。 {mimo} 、 きみ は ？'),
    'l.beam': T('The old beam fell across the stairs. It’s oak: it takes all of us. You too!', 'La viga vieja cayó sobre la escalera. Es de roble: hace falta todo el mundo. ¡Tú también!', 'A viga velha caiu em cima da escada. É de carvalho: precisa de todo mundo. Você também!', 'Der alte Balken ist auf die Treppe gefallen. Er ist aus Eiche: Da braucht es uns alle. Du auch!',
      '[旧|jiù] [横梁|héng liáng] [倒|dǎo] [在|zài] [楼梯|lóu tī] [上|shang] [了|le] 。 [是|shì] [橡木|xiàng mù] [的|de] ， [要|yào] [大家|dà jiā] [一起|yī qǐ] 。 [你|nǐ] [也|yě] [来|lái] ！', '[古|ふる]い [梁|はり] が [階段|かいだん] に [倒|たお]れて る 。 [樫|かし] の [木|き] だ から 、 みんな で ね 。 きみ も ！'),
    'l.seal': T('That gray skin… it’s the Hush. It eats sound. Grandma Nieves always said: one voice is a whisper, all of us are a song.', 'Esa piel gris… es el Silencio. Se come los sonidos. La abuela Nieves siempre decía: una voz es un susurro; todos juntos, una canción.',
      'Essa pele cinza… é o Silêncio. Ele come os sons. A vó Nieves sempre dizia: uma voz é um sussurro; todo mundo junto, uma canção.', 'Diese graue Haut… das ist die Stille. Sie frisst Geräusche. Oma Nieves sagt immer: Eine Stimme ist ein Flüstern, alle zusammen sind ein Lied.',
      '[那|nà] [层|céng] [灰色|huī sè] [的|de] [皮|pí] … [是|shì] [寂静|Jì jìng] 。 [它|tā] [吃|chī] [声音|shēng yīn] 。 [涅韦斯|Niè wéi sī] [奶奶|nǎi nai] [常|cháng] [说|shuō] ： [一个|yī gè] [声音|shēng yīn] [是|shì] [悄悄话|qiāo qiāo huà] ， [大家|dà jiā] [一起|yī qǐ] [就是|jiù shì] [歌|gē] 。',
      'あの [灰色|はいいろ] の [膜|まく] … [静寂|せいじゃく] だ よ 。 [音|おと] を [食|た]べる の 。 ネベス さん が いつも [言|い]って た 。 ひとり の [声|こえ] は ささやき 、 みんな なら [歌|うた] だ って 。'),
    'l.hatch': T('The trapdoor’s swollen shut. Somebody has to hold the ladder… You hold it, and we two push!', 'La trampilla está hinchada y no abre. Alguien tiene que sujetar la escalera… ¡Tú la sujetas, y nosotros dos empujamos!',
      'O alçapão inchou e não abre. Alguém tem que segurar a escada… Você segura, e nós dois empurramos!', 'Die Falltür ist aufgequollen und klemmt. Jemand muss die Leiter halten… Du hältst sie, und wir zwei schieben!',
      '[活板门|huó bǎn mén] [胀|zhàng] [住|zhù] [了|le] 。 [得|děi] [有|yǒu] [人|rén] [扶|fú] [着|zhe] [梯子|tī zi] … [你|nǐ] [扶|fú] [梯子|tī zi] ， [我们|wǒ men] [两个|liǎng gè] [推|tuī] ！', '[天井|てんじょう] の [扉|とびら] が ふくらんで [開|あ]かない 。 だれか が はしご を [押|お]さえない と … きみ が [押|お]さえて 、 わたしたち ふたり で [押|お]す ！'),
    'l.hatchWe': T('All of us?! Then who holds the ladder? Just tell the two of us!', '¿Todos? ¿Y quién sujeta la escalera? ¡Dinos solo a nosotros dos!', 'Todo mundo? E quem segura a escada? Fala só pra nós dois!', 'Alle?! Und wer hält dann die Leiter? Sag es nur uns beiden!',
      '[大家|dà jiā] [都|dōu] [去|qù] ？ [那|nà] [谁|shéi] [扶|fú] [梯子|tī zi] ？ [只|zhǐ] [跟|gēn] [我们|wǒ men] [两个|liǎng gè] [说|shuō] [吧|ba] ！', 'みんな で ？ じゃあ 、 はしご は だれ が [押|お]さえる の ？ わたしたち ふたり に だけ [言|い]って ！'),
    'l.bell': T('The {w.bell}! Grandma Nieves rang it every night. It’s huge… it takes all four of us.', '¡La campana! La abuela Nieves la tocaba cada noche. Es enorme… hacemos falta los cuatro.', 'O sino! A vó Nieves tocava ele toda noite. É enorme… precisa de nós quatro.', 'Die Glocke! Oma Nieves hat sie jeden Abend geläutet. Sie ist riesig… da braucht es uns vier.',
      '[钟|zhōng] ！ [涅韦斯|Niè wéi sī] [奶奶|nǎi nai] [每天|měi tiān] [晚上|wǎn shang] [敲|qiāo] [它|tā] 。 [好|hǎo] [大|dà] … [要|yào] [我们|wǒ men] [四个|sì gè] [一起|yī qǐ] 。', '[鐘|かね] だ ！ ネベス さん が [毎晩|まいばん] [鳴|な]らして た の 。 [大|おお]きい … わたしたち [四人|よにん] で やろう 。'),
    // the Great Shadow (heard through the weave like everyone)
    's.wake': T('Light? Who brings light into my {w.chapel}? In here, I am whatever I want to be…', '¿Luz? ¿Quién trae luz a mi capilla? Aquí dentro, yo soy lo que quiera…', 'Luz? Quem traz luz pra minha capela? Aqui dentro, eu sou o que eu quiser…', 'Licht? Wer bringt Licht in meine Kapelle? Hier drin bin ich, was ich will…',
      '[光|guāng] ？ [谁|shéi] [把|bǎ] [光|guāng] [带进|dài jìn] [我|wǒ] [的|de] [教堂|jiào táng] ？ [在|zài] [这里|zhè lǐ] ， [我|wǒ] [想|xiǎng] [是|shì] [什么|shén me] [就|jiù] [是|shì] [什么|shén me] …', '[光|ひかり] ？ だれ だ 、 わたし の [礼拝堂|れいはいどう] に [光|ひかり] を [持|も]って きた の は ？ ここ で は 、 わたし は [何|なん] に でも なれる …'),
    's.next': T('You saw me? Hmph… And now? What am I now?', '¿Me viste? Je… ¿Y ahora? ¿Qué soy ahora?', 'Você me viu? Hm… E agora? O que eu sou agora?', 'Du hast mich gesehen? Pah… Und jetzt? Was bin ich jetzt?',
      '[你|nǐ] [看见|kàn jiàn] [我|wǒ] [了|le] ？ [哼|hēng] … [那|nà] [现在|xiàn zài] [呢|ne] ？ [我|wǒ] [现在|xiàn zài] [是|shì] [什么|shén me] ？', '[見|み]えた の か ？ ふん … では 、 [今|いま] は ？ [今|いま] は [何|なに] だ ？'),
    's.last': T('No… not the light! My lovely quiet…', '¡No… la luz no! Mi silencio tan bonito…', 'Não… a luz não! O meu silêncio tão bonito…', 'Nein… nicht das Licht! Meine schöne Stille…',
      '[不|bù] … [不要|bú yào] [光|guāng] ！ [我|wǒ] [美丽|měi lì] [的|de] [寂静|jì jìng] …', 'いや … [光|ひかり] は いや だ ！ わたし の きれい な [静|しず]けさ …'),
    's.after': T('…So warm. Nobody had spoken in here for so long. Ring it. Ring the {w.bell}.', '…Qué calor. Hacía tanto que nadie hablaba aquí. Tóquenla. Toquen la campana.', '…Que quentinho. Fazia tanto tempo que ninguém falava aqui. Toquem. Toquem o sino.', '…So warm. Hier hat so lange niemand gesprochen. Läutet sie. Läutet die Glocke.',
      '… [好|hǎo] [暖和|nuǎn huo] 。 [这里|zhè lǐ] [好|hǎo] [久|jiǔ] [没有|méi yǒu] [人|rén] [说话|shuō huà] [了|le] 。 [你们|nǐ men] [敲|qiāo] [吧|ba] 。 [敲|qiāo] [钟|zhōng] [吧|ba] 。', '… あたたかい 。 ここ で は ずっと だれ も [話|はな]さなかった 。 [鳴|な]らして 。 [鐘|かね] を [鳴|な]らして 。'),
  };
  // Noa's page in the belfry (the eighth): from up here she saw the Old Tower's door open
  const PAGE = {
    es: ['Desde el campanario de la capilla lo vi: la puerta de la torre vieja está abierta. Por primera vez desde el Silencio. Ya no hay más campanas que buscar. Toca la última y sígueme: te espero arriba.'],
    pt: ['Do campanário da capela eu vi: a porta da torre velha está aberta. Pela primeira vez desde o Silêncio. Não tem mais sinos pra procurar. Toca o último e vem atrás de mim: eu te espero lá em cima.'],
    de: ['Vom Glockenturm der Kapelle habe ich es gesehen: Die Tür des alten Turms ist offen. Zum ersten Mal seit der Stille. Es gibt keine Glocken mehr zu suchen. Läute die letzte und folge mir: Ich warte oben auf dich.'],
    zh: ['[我|wǒ] [从|cóng] [教堂|jiào táng] [的|de] [钟楼|zhōng lóu] [看见|kàn jiàn] [了|le] ： [古塔|gǔ tǎ] [的|de] [门|mén] [开|kāi] [了|le] 。 [寂静|Jì jìng] [来|lái] [了|le] [以后|yǐ hòu] ， [这|zhè] [是|shì] [第一|dì yī] [次|cì] 。 [没有|méi yǒu] [别的|bié de] [钟|zhōng] [要|yào] [找|zhǎo] [了|le] 。 [敲响|qiāo xiǎng] [最后|zuì hòu] [一|yī] [口|kǒu] [钟|zhōng] ， [跟|gēn] [我|wǒ] [来|lái] ： [我|wǒ] [在|zài] [上面|shàng miàn] [等|děng] [你|nǐ] 。'],
    ja: ['[礼拝堂|れいはいどう] の [鐘楼|しょうろう] から [見|み]えた 。 [古|ふる]い [塔|とう] の [扉|とびら] が [開|あ]いて いる 。 [静寂|せいじゃく] が [来|き]て から 、 はじめて だ 。 もう [探|さが]す [鐘|かね] は ない 。 [最後|さいご] の [鐘|かね] を [鳴|な]らして 、 ついて [来|き]て 。 [上|うえ] で [待|ま]って いる 。'],
    en: ['From the chapel’s belfry I saw it: the old tower’s door is open. For the first time since the Hush. There are no more bells to look for. Ring the last one and follow me: I’ll be waiting at the top.'],
  };
  if (typeof LINES !== 'undefined' && !LINES['page.marsh']) LINES['page.marsh'] = PAGE;
  const SHADE_NAME = { es: 'la Gran Sombra', pt: 'a Grande Sombra', de: 'der Große Schatten', zh: '[大|dà] [影子|yǐng zi]', ja: '[大|おお]きな [影|かげ]', en: 'the Great Shadow' };
  if (typeof CJK !== 'undefined' && CJK.addSource) {
    for (const t of Object.values(CL)) for (const l of ['zh', 'ja']) if (t[l]) { try { CJK.addSource(t[l]); } catch (e) { /* optional */ } }
    for (const l of ['zh', 'ja']) { try { CJK.addSource(PAGE[l][0]); CJK.addSource(SHADE_NAME[l]); } catch (e) { /* optional */ } }
  }
  // someone says a line, mixed by the weave (STORY.sayInline; the lead's rule: never a whole line with all its English under it)
  function sayT(p, key) {
    const t = CL[key]; if (!p || !t) return Promise.resolve();
    p.lines = { en: t.en || '', [lang()]: t[lang()] || t.en || '' };
    if (!p.name0) p.name0 = p.name;
    return STORY.sayInline(p);
  }

  // ---------------------------------------------------------------- materials: old wet stone, flagstones under black water, dark oak
  let MAT = null;
  function mats() {
    if (MAT) return MAT;
    const tex = (w, h, fn, rx, ry) => { const t = TK.canvasTex(w, h, fn); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
    const stone = tex(256, 256, c => {
      const R = rng(83); c.fillStyle = '#857f74'; c.fillRect(0, 0, 256, 256);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) { const off = (y % 2) * 26; c.fillStyle = ['#8d877b', '#7b766b', '#948e81', '#827c70'][(x + y * 3) % 4]; c.fillRect(x * 52 + off - 52 + 2, y * 32 + 2, 48, 28); c.fillRect(x * 52 + off + 208 - 256 + 2, y * 32 + 2, 48, 28); }
      c.fillStyle = 'rgba(70,96,60,0.45)'; for (let k = 0; k < 34; k++) { c.beginPath(); c.ellipse(R() * 256, 170 + R() * 86, 6 + R() * 18, 3 + R() * 7, 0, 0, TAU); c.fill(); }      // (moss low on the wall)
      c.fillStyle = 'rgba(30,36,40,0.3)'; c.fillRect(0, 214, 256, 42);                                                                           // (the water line's stain)
      c.strokeStyle = 'rgba(40,36,30,0.35)'; c.lineWidth = 3; for (let y = 0; y <= 256; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); }
    }, 3, 1.4);
    const floor = tex(256, 256, c => {
      c.fillStyle = '#6f6a60'; c.fillRect(0, 0, 256, 256);
      const R = rng(19); for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = ['#77726a', '#68635a', '#7d786e', '#6c675e'][(x * 3 + y) % 4]; c.fillRect(x * 64 + 3, y * 64 + 3, 58, 58); }
      c.fillStyle = 'rgba(80,110,70,0.3)'; for (let k = 0; k < 40; k++) c.fillRect(R() * 256, R() * 256, 3 + R() * 6, 2 + R() * 4);
    }, 3, 3);
    const wood = tex(256, 256, c => { c.fillStyle = '#5e4836'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#56412f' : '#654e3b'; c.fillRect(0, i * 32, 256, 30); } }, 3, 3);
    MAT = { stone: new THREE.MeshToonMaterial({ map: stone, gradientMap: TK.grad }), floor: new THREE.MeshToonMaterial({ map: floor, gradientMap: TK.grad }), wood: new THREE.MeshToonMaterial({ map: wood, gradientMap: TK.grad }),
      hole: new THREE.MeshBasicMaterial({ color: '#0d0c14' }), water: new THREE.MeshToonMaterial({ color: '#22302e', gradientMap: TK.grad, transparent: true, opacity: 0.78, emissive: new THREE.Color('#081210') }),
      seal: new THREE.MeshBasicMaterial({ color: '#9a97a8', transparent: true, opacity: 0.82, side: THREE.DoubleSide }) };
    return MAT;
  }
  const grp = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  const glow = (color, s, o = 0) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TK.glowTex, color, transparent: true, opacity: o, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })); sp.scale.setScalar(s); sp.renderOrder = 2; return sp; };
  const unsolid = o => { if (!o) return; o.x = o.z = 1e5; };
  // a candle (in a niche or on the altar): wax, a flame that's out until the room is lit
  function candle(g, k, x, y, z, h = 0.34) {
    const GG = KG(); k.add(GG.cyl6, x, y + h / 2, z, 0.06, h, 0.06, '#efe6cf', { ink: 0.006 });
    const fl = grp(g, x, y + h + 0.08, z); fl.visible = false;
    const core = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#ffe9a0' })); core.scale.set(0.04, 0.08, 0.04); fl.add(core);
    const gl = glow('#ffcf6a', 1.2, 0.7); fl.add(gl);
    return { fl, core, gl };
  }
  // ---------------------------------------------------------------- the rooms' shell: stone walls facing in, beams, the way back down
  function shell(R, g, o = {}) {
    const M = mats();
    const floor = new THREE.Mesh(new THREE.BoxGeometry(HW * 2, 0.4, HD * 2), o.wood ? M.wood : M.floor); floor.position.set(R.x, Y0 - 0.2, R.z); floor.receiveShadow = true; g.add(floor);
    [[0, -HD, 0, HW * 2], [0, HD, Math.PI, HW * 2], [-HW, 0, Math.PI / 2, HD * 2], [HW, 0, -Math.PI / 2, HD * 2]].forEach(([dx, dz, ry, w]) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, WH), M.stone); m.position.set(R.x + dx, Y0 + WH / 2, R.z + dz); m.rotation.y = ry; m.receiveShadow = true; g.add(m);
    });
    const k = Kit(), GG = KG(), RR = rng(Math.round(R.x * 5 + 11));
    // two pillars on the back wall, a rotten beam across, ivy hanging, a pointed window (dark, or the marsh outside)
    for (const x of [-4.8, 4.8]) k.box(R.x + x, Y0 + 2.4, R.z - HD + 0.3, 0.46, 4.8, 0.46, '#7b766b', { ink: 0.02 });
    k.box(R.x, Y0 + 4.9, R.z - HD + 0.35, HW * 2 - 0.4, 0.34, 0.4, '#4a3a2e', { ink: 0.02 });
    for (const s of [-1, 1]) k.box(R.x + s * (HW - 0.3), Y0 + 4.9, R.z, 0.36, 0.34, HD * 2 - 0.6, '#4a3a2e', { ink: 0.02 });
    for (let i = 0; i < 14; i++) { const x = R.x - HW + 0.8 + RR() * (HW * 2 - 1.6), len = 0.6 + RR() * 1.6; k.add(GG.cone, x, Y0 + 4.75 - len / 2, R.z - HD + 0.45, 0.07, -len, 0.07, RR() < 0.5 ? '#4f6a3e' : '#5f7a4a', { ink: 0 }); }
    k.build(g);
    // the way back down: a dark doorway at the front, by the left
    const door = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.2), M.hole); door.rotation.x = -Math.PI / 2; door.position.set(R.x - 4.5, Y0 + 0.012, R.z + HD - 0.7); g.add(door);
    WORLD.addSolids([{ obox: 1, x: R.x, z: R.z - HD - 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 }, { obox: 1, x: R.x, z: R.z + HD + 0.2, hw: HW + 0.6, hd: 0.3, rot: 0 },
      { obox: 1, x: R.x - HW - 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }, { obox: 1, x: R.x + HW + 0.2, z: R.z, hw: 0.3, hd: HD + 0.6, rot: 0 }]);
    WORLD.addPlatforms([{ box: [R.x - HW, R.x + HW, R.z - HD, R.z + HD], top: Y0 }]);
  }
  // a pointed window in the back wall: the gray marsh outside (and, from the belfry, the Old Tower on its crag)
  function marshWindow(g, x, z, w = 1.5, h = 2.0, y = Y0 + 3.0, tower = false) {
    const cv = document.createElement('canvas'); cv.width = 192; cv.height = 256; const c = cv.getContext('2d');
    const sky = c.createLinearGradient(0, 0, 0, 256); sky.addColorStop(0, '#9aa49c'); sky.addColorStop(1, '#c9cfc4'); c.fillStyle = sky; c.fillRect(0, 0, 192, 256);
    if (tower) { c.fillStyle = '#5e5873'; c.beginPath(); c.moveTo(70, 256); c.lineTo(84, 120); c.lineTo(96, 70); c.lineTo(108, 120); c.lineTo(122, 256); c.fill(); c.fillStyle = '#4a4560'; c.fillRect(88, 92, 16, 34); c.fillStyle = '#ffd77a'; c.fillRect(93, 112, 6, 10); }
    c.fillStyle = '#5d6450'; c.beginPath(); c.moveTo(0, 200); for (let x = 0; x <= 192; x += 16) c.lineTo(x, 196 + Math.sin(x * 0.11) * 8); c.lineTo(192, 256); c.lineTo(0, 256); c.fill();
    c.fillStyle = 'rgba(220,226,214,0.5)'; for (let i = 0; i < 6; i++) c.fillRect(0, 170 + i * 9, 192, 3);
    c.globalCompositeOperation = 'destination-in'; c.beginPath(); c.moveTo(0, 256); c.lineTo(0, 90); c.quadraticCurveTo(0, 0, 96, 0); c.quadraticCurveTo(192, 0, 192, 90); c.lineTo(192, 256); c.fill();
    const tx = new THREE.CanvasTexture(cv);
    const win = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tx, transparent: true, fog: false })); win.position.set(x, y, z); g.add(win);
    const k = Kit(); k.box(x, y - h / 2 - 0.06, z + 0.08, w + 0.3, 0.12, 0.24, '#6f6a60', { ink: 0.012 }); for (const s of [-1, 1]) k.box(x + s * (w / 2 + 0.08), y - 0.1, z + 0.08, 0.14, h - 0.2, 0.24, '#6f6a60', { ink: 0.012 }); k.build(g);
  }
  // Lucero, in here with you: her look from marsh.js, with a little lantern in her hand
  function lucero(g) {
    const p = C.makePerson(C.LUCERO, g, { x: 0, z: 0, y: Y0, yaw: 0, pose: 'lantern' });
    const lg = new THREE.Group(), k = Kit(), GG = KG();
    k.add(GG.cyl6, 0, 0.42, 0, 0.02, 0.5, 0.02, '#6b4a30', { ink: 0.004 }).box(0, 0.12, 0, 0.17, 0.22, 0.17, '#3a3036', { ink: 0.008 }).box(0, 0.12, 0, 0.13, 0.17, 0.18, '#ffe27a', { ink: 0 }).add(GG.cone, 0, 0.28, 0, 0.12, 0.1, 0.12, '#3a3036', { ink: 0.006 });
    k.build(lg, { shadow: false });
    const gl = glow('#ffd77a', 1.3, 0.6); gl.position.set(0, 0.12, 0); lg.add(gl);
    p.body.add(lg);
    p.prop = { g: lg, glow: gl, flare: 0, place() { const h = p.hands ? p.hands[1] : [0.3, 1.0, 0.3]; lg.position.set(h[0], h[1] - 0.18, h[2] + 0.04); } };
    p.prop.place();
    p.name = 'Lucero';
    return p;
  }
  // the Great Shadow, asleep round the bell: a heap of dark smoke with two glowing eyes (it rises when the light wakes it)
  function shadeModel(parent, x, z) {
    const g = grp(parent, x, Y0, z), M = new THREE.MeshBasicMaterial({ color: '#241f36', transparent: true, opacity: 0.92 });
    const blobs = [];
    [[0, 0.6, 0, 1.3], [0.9, 0.5, 0.3, 0.9], [-0.9, 0.5, 0.2, 0.95], [0.4, 1.4, -0.1, 0.8], [-0.5, 1.3, 0.1, 0.75], [0, 2.0, 0, 0.62]].forEach(([bx, by, bz, r]) => {
      const m = new THREE.Mesh(GEO.sphere, M); m.position.set(bx, by, bz); m.scale.setScalar(r); g.add(m); blobs.push({ m, y0: by, r, ph: Math.random() * 6 });
    });
    const eyes = [-1, 1].map(s => { const e = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#fff3a0' })); e.scale.set(0.13, 0.07, 0.05); e.position.set(s * 0.28, 1.95, 0.55); g.add(e); const gl = glow('#fff3a0', 0.7, 0.5); gl.position.copy(e.position); g.add(gl); return { e, gl }; });
    return { g, blobs, eyes, mood: 'asleep', rise: 0 };
  }
  // the chapel's bell: a big bronze lathe, its pivot swings when it rings
  function bellModel(parent, x, z) {
    const piv = grp(parent, x, Y0 + 4.5, z), bell = new THREE.Group(); piv.add(bell);
    const lp = [[0.92, -2.0], [0.9, -1.86], [0.6, -1.25], [0.45, -0.42], [0.26, 0]].map(([a, b]) => new THREE.Vector2(a, b));
    const mat = new THREE.MeshToonMaterial({ color: '#8a7444', gradientMap: TK.grad, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.LatheGeometry(lp, 24), mat); bell.add(m);
    const clap = new THREE.Mesh(GEO.sphere, new THREE.MeshToonMaterial({ color: '#4a3a24', gradientMap: TK.grad })); clap.scale.setScalar(0.17); clap.position.y = -1.75; bell.add(clap);
    const k = Kit(); k.box(x, Y0 + 4.6, z, 3.2, 0.24, 0.3, '#4a3a2e', { ink: 0.015 }); for (const s of [-1, 1]) k.box(x + s * 1.5, Y0 + 2.3, z, 0.26, 4.6, 0.26, '#4a3a2e', { ink: 0.015 }); k.build(parent);
    return { piv, bell, mat, x, z, swing: 0 };
  }
  // the gray skin of Hush over the belfry door (the choir loft): it shivers, and shatters at a song from everyone
  function sealModel(parent, x, z) {
    const g = grp(parent, x, Y0, z);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.7, 8, 10), mats().seal); m.position.set(0, 1.4, 0.06); g.add(m);
    const pos = m.geometry.attributes.position, base = Float32Array.from(pos.array);
    const k = Kit(); k.box(0, 1.4, -0.05, 2.3, 3.0, 0.1, '#0d0c14', { ink: 0 }); for (const s of [-1, 1]) k.box(s * 1.15, 1.45, 0.05, 0.24, 2.9, 0.3, '#6f6a60', { ink: 0.012 }); k.add(KG().half, 0, 2.9, 0.05, 1.2, 0.5, 0.15, '#6f6a60', { ink: 0.012 }); k.build(g);
    return { g, m, pos, base, k: 1 };
  }

  // ---------------------------------------------------------------- build the four rooms (on first entry)
  let LUC = null;
  function build() {
    if (built) return; built = true;
    const scene = G.w3d.scene, GG = KG(), M = mats();
    ROOMS.forEach((R, i) => { const g = new THREE.Group(); g.visible = false; scene.add(g); shell(R, g, { wood: i === 1 || i === 2 }); rooms[i] = { R, g, candles: [] }; });
    // Lucero (one of her, moved from room to room)
    const pg = new THREE.Group(); scene.add(pg); pg.visible = false;
    LUC = lucero(pg); LUC.group = pg;
    // 0 · the Flooded Nave: black water over the flagstones, broken pews, the altar, the stairs behind a fallen beam
    {
      const room = rooms[0], R = room.R, g = room.g, k = Kit();
      const w = new THREE.Mesh(new THREE.PlaneGeometry(HW * 2 - 0.2, HD * 2 - 0.2), M.water); w.rotation.x = -Math.PI / 2; w.position.set(R.x, Y0 + 0.07, R.z); g.add(w); room.water = w;
      const pews = [];
      for (const zr of [1.8, 0.0, -1.8]) for (const s of [-1, 1]) {
        const x = R.x + s * 2.8, z = R.z + zr, tilt = zr === 0 && s > 0 ? 0.18 : 0;
        k.at(x, Y0, z, tilt);
        k.box(0, 0.45, 0, 2.6, 0.12, 0.5, '#5a4636', { ink: 0.012 }).box(0, 0.8, -0.24, 2.6, 0.62, 0.08, '#4f3d2f', { ink: 0.012 });
        for (const sx of [-1.15, 1.15]) k.box(sx, 0.22, 0, 0.1, 0.44, 0.46, '#4a3a2e', { ink: 0.008 });
        k.free();
        pews.push({ obox: 1, x, z: z - 0.05, hw: 1.35, hd: 0.36, rot: tilt });
      }
      // the altar, and candles on it and in the side walls' niches
      room.altar = { x: R.x, z: R.z - HD + 1.25 };
      k.box(room.altar.x, Y0 + 0.5, room.altar.z, 2.3, 1.0, 0.95, '#8d877b', { ink: 0.02 }).box(room.altar.x, Y0 + 1.04, room.altar.z, 2.5, 0.1, 1.05, '#9a9488', { ink: 0.012 });
      k.build(g);
      const ck = Kit();
      room.candles.push(candle(g, ck, room.altar.x - 0.8, Y0 + 1.09, room.altar.z), candle(g, ck, room.altar.x + 0.8, Y0 + 1.09, room.altar.z), candle(g, ck, room.altar.x, Y0 + 1.09, room.altar.z + 0.2, 0.44));
      for (const s of [-1, 1]) for (const z of [-2.5, 1.5]) { ck.box(R.x + s * (HW - 0.18), Y0 + 1.7, R.z + z, 0.3, 0.06, 0.5, '#6f6a60', { ink: 0.008 }); room.candles.push(candle(g, ck, R.x + s * (HW - 0.22), Y0 + 1.73, R.z + z)); }
      ck.build(g);
      // the stairs up, in the back-right corner, to a doorway in the back wall
      room.stairs = { x: R.x + 5.2, z: R.z - 3.6 };
      const sk = Kit();
      for (let i = 0; i < 5; i++) sk.box(room.stairs.x, Y0 + (i + 1) * 0.2, room.stairs.z + 0.6 - i * 0.5, 1.8, (i + 1) * 0.4, 0.5, i % 2 ? '#7b766b' : '#857f74', { ink: 0.015 });
      sk.build(g);
      const way = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.3), M.hole); way.position.set(room.stairs.x, Y0 + 3.1, R.z - HD + 0.03); g.add(way);
      // the fallen oak beam across the stairs' foot
      room.beam = { x: R.x + 4.4, z: R.z - 1.9, rot: 0.55 };
      const bg = grp(g, room.beam.x, Y0, room.beam.z); bg.rotation.y = room.beam.rot; room.beamG = bg;
      const bk = Kit(); bk.box(0, 0.3, 0, 3.6, 0.52, 0.55, '#5a4232', { ink: 0.02 }).box(1.2, 0.58, 0.05, 0.6, 0.08, 0.4, '#4a3828', { ink: 0.006 }); bk.add(GG.sphere, -1.5, 0.4, 0.2, 0.2, 0.15, 0.2, '#5f7a4a', { ink: 0 }); bk.build(bg);
      room.beamSolid = { obox: 1, x: room.beam.x, z: room.beam.z, hw: 1.85, hd: 0.34, rot: room.beam.rot };
      WORLD.addSolids(pews.concat([room.beamSolid, { obox: 1, x: room.altar.x, z: room.altar.z, hw: 1.2, hd: 0.55, rot: 0 }, { obox: 1, x: room.stairs.x, z: room.stairs.z - 0.9, hw: 0.95, hd: 0.7, rot: 0 }]));
      room.people = { luc: { x: R.x - 3.1, z: R.z + 3.5, yaw: Math.PI }, bruno: { x: R.x - 1.5, z: R.z + 4.0, yaw: Math.PI } };
      // the shadows hiding in the dark: little dark shapes with yellow eyes, by the walls (gone once you've fought them)
      room.lurkers = grp(g, 0, 0, 0);
      for (const [x, z] of [[R.x - 5.6, R.z - 3.8], [R.x + 1.8, R.z - 4.9], [R.x - 1.4, R.z - 4.6]]) {
        const lg = grp(room.lurkers, x, Y0, z), m = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#241f36', transparent: true, opacity: 0.9 })); m.scale.set(0.42, 0.36, 0.42); m.position.y = 0.36; lg.add(m);
        for (const s of [-1, 1]) { const e = new THREE.Mesh(GEO.sphere, new THREE.MeshBasicMaterial({ color: '#fff3a0' })); e.scale.set(0.06, 0.035, 0.03); e.position.set(s * 0.12, 0.46, 0.38); lg.add(e); }
      }
    }
    // 1 · the Choir Loft: plank floor, a pump organ green with moss, choir benches, the belfry door sealed by a gray skin
    {
      const room = rooms[1], R = room.R, g = room.g, k = Kit();
      room.organ = { x: R.x - 4.6, z: R.z - HD + 1.1 };
      k.box(room.organ.x, Y0 + 0.6, room.organ.z, 2.0, 1.2, 0.9, '#4f3d2f', { ink: 0.02 }).box(room.organ.x, Y0 + 1.24, room.organ.z + 0.15, 1.8, 0.08, 0.5, '#e8e2d0', { ink: 0.008 });
      for (let i = 0; i < 9; i++) { const h = 1.2 + Math.sin(i / 8 * Math.PI) * 1.6; k.add(GG.cyl6, room.organ.x - 0.9 + i * 0.22, Y0 + 1.3 + h / 2, R.z - HD + 0.3, 0.08, h, 0.08, i % 3 === 1 ? '#6f8a5a' : '#a58a4a', { ink: 0.008 }); }
      const benches = [];
      for (const zr of [1.4, -0.4]) { k.box(R.x + 0.4, Y0 + 0.4, R.z + zr, 4.4, 0.12, 0.5, '#5a4636', { ink: 0.012 }); for (const sx of [-2, 2]) k.box(R.x + 0.4 + sx, Y0 + 0.2, R.z + zr, 0.1, 0.4, 0.46, '#4a3a2e', { ink: 0.008 }); benches.push({ obox: 1, x: R.x + 0.4, z: R.z + zr, hw: 2.25, hd: 0.3, rot: 0 }); }
      // the loft's railing over the nave (the front), sheet music on the floor
      for (let i = 0; i < 12; i++) k.box(R.x - 5.6 + i * 1.0, Y0 + 0.5, R.z + HD - 0.35, 0.08, 1.0, 0.08, '#4a3a2e', { ink: 0.006 });
      k.box(R.x, Y0 + 1.0, R.z + HD - 0.35, HW * 2 - 0.6, 0.1, 0.12, '#5a4636', { ink: 0.01 });
      for (let i = 0; i < 5; i++) k.box(R.x - 2 + i * 0.9, Y0 + 0.02, R.z + 2.8 - (i % 2) * 0.6, 0.42, 0.01, 0.56, '#efe6cf', { ry: i * 0.7, ink: 0 });
      k.build(g);
      marshWindow(g, R.x - 0.6, R.z - HD + 0.04, 1.3, 1.9, Y0 + 3.0);
      room.sealAt = { x: R.x + 4.0, z: R.z - HD + 0.25 };
      room.seal = sealModel(g, room.sealAt.x, room.sealAt.z);
      room.sealSolid = { obox: 1, x: room.sealAt.x, z: room.sealAt.z + 0.3, hw: 1.2, hd: 0.3, rot: 0 };
      WORLD.addSolids(benches.concat([room.sealSolid, { obox: 1, x: room.organ.x, z: room.organ.z, hw: 1.05, hd: 0.5, rot: 0 }]));
      const ck = Kit(); for (const s of [-1, 1]) room.candles.push(candle(g, ck, R.x + s * (HW - 0.22), Y0 + 1.73, R.z - 1)); for (const s of [-1, 1]) ck.box(R.x + s * (HW - 0.18), Y0 + 1.7, R.z - 1, 0.3, 0.06, 0.5, '#6f6a60', { ink: 0.008 }); ck.build(g);
      room.people = { luc: { x: R.x + 1.6, z: R.z - 3.0, yaw: Math.PI }, bruno: { x: R.x + 2.8, z: R.z - 2.6, yaw: Math.PI } };
    }
    // 2 · the Belfry Stair: the broken old stair, a ladder up the back wall to a trapdoor swollen shut, the bell ropes
    {
      const room = rooms[2], R = room.R, g = room.g, k = Kit();
      room.ladder = { x: R.x + 2.0, z: R.z - HD + 0.5 };
      for (const s of [-1, 1]) k.box(room.ladder.x + s * 0.35, Y0 + 2.5, room.ladder.z, 0.08, 5.0, 0.08, '#6b4a30', { ink: 0.008 });
      for (let i = 0; i < 12; i++) k.box(room.ladder.x, Y0 + 0.3 + i * 0.4, room.ladder.z, 0.72, 0.05, 0.06, '#7a5a3a', { ink: 0.004 });
      // the broken stair along the left wall (its middle flight is gone)
      for (let i = 0; i < 9; i++) { if (i >= 4 && i <= 6) continue; k.box(R.x - HW + 0.8, Y0 + 0.25 + i * 0.5, R.z + 3.6 - i * 0.9, 1.2, 0.14, 0.8, i % 2 ? '#5a4636' : '#654e3b', { ink: 0.01 }); }
      for (let i = 0; i < 3; i++) k.add(GG.cyl6, R.x - 1.2 + i * 1.1, Y0 + 3.6, R.z - 1.4 - i * 0.4, 0.025, 2.6, 0.025, '#b8a27a', { ink: 0 });       // (the bell ropes, hanging)
      k.build(g);
      room.hatch = grp(g, room.ladder.x - 0.6, Y0 + WH - 0.35, room.ladder.z + 0.7);
      const hk = Kit(); hk.box(0.6, 0, 0, 1.3, 0.12, 1.3, '#5a4232', { ink: 0.015 }); hk.box(0.6, -0.08, 0, 1.0, 0.04, 0.1, '#3a3036', { ink: 0 }); hk.build(room.hatch);
      room.hatchGlow = glow('#fff1c0', 3.2, 0); room.hatchGlow.position.set(room.ladder.x, Y0 + WH - 0.2, room.ladder.z + 0.7); g.add(room.hatchGlow);
      marshWindow(g, R.x - 2.6, R.z - HD + 0.04, 1.2, 1.8, Y0 + 3.2);
      const ck = Kit(); for (const s of [-1, 1]) { ck.box(R.x + s * (HW - 0.18), Y0 + 1.7, R.z + 1.5, 0.3, 0.06, 0.5, '#6f6a60', { ink: 0.008 }); room.candles.push(candle(g, ck, R.x + s * (HW - 0.22), Y0 + 1.73, R.z + 1.5)); } ck.build(g);
      WORLD.addSolids([{ obox: 1, x: R.x - HW + 0.8, z: R.z, hw: 0.7, hd: 4.4, rot: 0 }, { obox: 1, x: room.ladder.x, z: room.ladder.z, hw: 0.5, hd: 0.25, rot: 0 }]);
      room.people = { luc: { x: R.x + 0.4, z: R.z - 3.4, yaw: Math.PI }, bruno: { x: R.x + 3.6, z: R.z - 3.4, yaw: Math.PI } };
    }
    // 3 · the Belfry: the bell, the Great Shadow coiled under it, two arches open on the marsh (and the Old Tower)
    {
      const room = rooms[3], R = room.R, g = room.g;
      room.bell = bellModel(g, R.x + 1.0, R.z - 2.0);
      room.shade = shadeModel(g, R.x + 1.0, R.z - 1.6);
      room.shadeSolid = { x: R.x + 1.0, z: R.z - 1.6, r: 1.5 };
      marshWindow(g, R.x - 4.2, R.z - HD + 0.04, 1.6, 2.2, Y0 + 3.0, true);
      marshWindow(g, R.x + 4.6, R.z - HD + 0.04, 1.4, 2.0, Y0 + 3.0);
      room.page = grp(g, R.x - 2.2, Y0, R.z + 0.6); room.page.visible = false;
      room.page.add(part(GEO.box, '#5a4636', [0, 0.6, 0], [0.14, 1.2, 0.14], { ink: 0 }));
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshBasicMaterial({ color: '#fffaf0', side: THREE.DoubleSide })); sheet.position.set(0, 1.0, 0.1); sheet.rotation.z = 0.08; room.page.add(sheet);
      room.pageGlow = glow('#fff3b0', 1.3, 0.5); room.pageGlow.position.set(0, 1.0, 0.15); room.page.add(room.pageGlow);
      const ck = Kit(); for (const s of [-1, 1]) { ck.box(R.x + s * (HW - 0.18), Y0 + 1.7, R.z + 1.0, 0.3, 0.06, 0.5, '#6f6a60', { ink: 0.008 }); room.candles.push(candle(g, ck, R.x + s * (HW - 0.22), Y0 + 1.73, R.z + 1.0)); } ck.build(g);
      WORLD.addSolids([room.shadeSolid, { obox: 1, x: room.bell.x, z: room.bell.z, hw: 1.7, hd: 0.3, rot: 0 }]);
      room.people = { luc: { x: R.x - 2.8, z: R.z + 3.0, yaw: Math.PI }, bruno: { x: R.x - 1.4, z: R.z + 3.6, yaw: Math.PI } };
    }
    applyState();
  }
  // after a load: each room as the saved progress says
  function applyState() {
    const st = S(), r0 = rooms[0], r1 = rooms[1], r2 = rooms[2], r3 = rooms[3];
    const lit = (room, on) => room.candles.forEach(c => { c.fl.visible = !!on; });
    lit(r0, st.lit0); lit(r1, true); lit(r2, true); lit(r3, !!st.boss);
    r0.lurkers.visible = !st.lit0;
    if (st.beam) { r0.beamG.position.set(r0.R.x + 6.1, Y0, r0.R.z + 0.6); r0.beamG.rotation.y = Math.PI / 2; Object.assign(r0.beamSolid, { x: r0.R.x + 6.1, z: r0.R.z + 0.6, rot: Math.PI / 2 }); }
    if (st.seal) { r1.seal.g.visible = false; unsolid(r1.sealSolid); }
    if (st.hatch) { r2.hatch.rotation.z = 1.9; r2.hatchGlow.material.opacity = 0.7; }
    if (st.boss) { r3.shade.g.visible = false; unsolid(r3.shadeSolid); r3.page.visible = !st.page; }
    if (st.bell) r3.bell.mat.color.set('#c9a24a');
  }

  // ---------------------------------------------------------------- telling Mimo (one verb), and telling everyone (team.js)
  // t: { kind, verb, icon, title, hint, right(verb), at() }: once a verb has worked here, E repeats it
  async function tell(t) {
    let verb = quick[t.kind] || null, ms = 0;
    if (!verb) {
      const r = await UI.command({ name: mimoName(), icon: t.icon, title: t.title, verbs: verbs(), answer: t.verb });
      if (!r || r.cancelled) return;
      if (!r.verb) { G.sim.mimoSay('…?', 1.4); G.sim.mimo.tiltT = 1.4; STORY.think('{mimo} tilts its head. ' + t.hint, 4.5); return; }
      verb = r.verb; ms = r.ms;
      if (verb === t.verb) quick[t.kind] = verb;
    }
    if (verb !== t.verb) {
      if (LEX.taught(verb)) LEX.attempt(verb, { ok: true, hints: 0, ms: ms || 3000, mode: 'command' });
      G.sim.mimoSay(ex(LEX.form(verb)), 1.4);
      const say = s => STORY.think(s, 4);
      if (verb === 'v.sing') { Sound.play('sing'); say('{mimo} sings into the dark. The dark doesn’t care.'); }
      else if (verb === 'v.blow') { Sound.play('blow'); say('{mimo} blows and blows. The dark stays put.'); }
      else if (verb === 'v.jump') { G.sim.mimo.hop = { t: 0 }; Sound.play('jump'); say('{mimo} hops about. Nothing changes.'); }
      else say('{mimo} tries… nothing happens. ' + t.hint);
      return;
    }
    C.learnUse(verb, ms);
    await t.right(verb);
  }
  // o: { verbs (the ones that work: the first one's the model), want: 'you' | 'we', icon, title, modelEn, one(), you(), we(), wrongVerb }
  async function teamAsk(o) {
    const l = lang(), name = mimoName();
    const r = await UI.command({ name, icon: o.icon, title: o.title.replace(/\{mimo\}/g, name), verbs: [], placeholder: o.want === 'we' ? 'everyone, together…' : 'tell the two of them…',
      hint: `${o.want === 'we' ? 'All of us, you too' : 'To two or more of them'}: ${plainOf(TEAM.frame(o.want, l))} (? shows an example)`, model: plainOf(TEAM.model(o.verbs[0], o.want, l)), modelEn: o.modelEn });
    if (!r || r.cancelled) return null;
    const g = TEAM.read(r.text, l, { want: o.want, verb: o.verbs[0] });
    if (!g.verb) { Sound.play('wrong'); G.sim.mimoSay('…?', 1.4); STORY.think('Nobody moves. ' + (o.want === 'we' ? 'All of you, together… ' : 'Tell the two of them… ') + '(? shows an example)', 5); return null; }
    if (!o.verbs.includes(g.verb)) { Sound.play('wrong'); STORY.think(o.wrongVerb || 'They look at you, puzzled. That’s not what this needs.', 5); return null; }
    if (g.person !== o.want) { Sound.play('wrong'); const fn = g.person === 'one' ? o.one : g.person === 'you' ? o.you : o.we; if (fn) await fn(); return null; }
    UI.toast(`${g.letter} · ${g.reason}`); Sound.play(g.letter === 'S' ? 'chest' : g.letter === 'A' ? 'review' : 'pip');
    if (g.letter !== 'S' && g.canon) STORY.think(`«${plainOf(g.canon)}»`, 3);
    if (LEX.taught(g.verb)) LEX.attempt(g.verb, { ok: true, hints: 0, ms: r.ms || 3000, mode: 'command' });
    return g;
  }
  // the people in a room: Lucero (her own copy, in here) and Bruno (the story's own, brought along)
  function placePeople(i) {
    const room = rooms[i]; if (!room || !room.people || !LUC) return;
    const at = room.people;
    LUC.group.visible = true; LUC.x = at.luc.x; LUC.z = at.luc.z; LUC.y = Y0; LUC.baseYaw = LUC.yaw = at.luc.yaw; LUC.look = null;
    if (C.placeBruno) C.placeBruno({ x: at.bruno.x, z: at.bruno.z, yaw: at.bruno.yaw });
  }
  const bruno = () => G.sim.npc('bruno');
  async function walkTo(p, to, sec = 0.7) { const x0 = p.x, z0 = p.z; await tween(sec, k => { p.x = lerp(x0, to.x, k); p.z = lerp(z0, to.z, k); if (p.root === undefined) p.y = G.sim.ground(p.x, p.z); }); if (to.yaw !== undefined) { p.yaw = p.baseYaw = to.yaw; } }
  const S_ = (kind, color, size) => ({ kind, color, size: size || 'small', shadow: true });

  // ---------------------------------------------------------------- 0 · the nave
  async function lightNave() {
    const room = rooms[0], R = room.R, st = S();
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x + 1.5, Y0 + 4.2, R.z + 8.0), look: V(R.x, Y0 + 1.2, R.z - 1.5), dur: 0.8 };
    const ps = C.mimoShine({ x: R.x, z: R.z }, 1.8);
    await wait(0.7);
    st.lit0 = true; setFog(0);
    for (const c of room.candles) { c.fl.visible = true; await wait(0.08); }
    Sound.play('chime');
    await ps;
    // the shadows that hid in the dark: they scatter… and three of them come at you
    room.lurkers.visible = false; G.w3d.fx.puff(R.x - 1.4, Y0 + 0.4, R.z - 4.6, 14, 0.3, '#3a3550');
    G.cam.override = null; G.sim.lock = 0; G.sim.mimoGo(null, null); G.save();
    await STORY.you('Light! The candles… and the {w.shadow:pl} that were hiding in the dark! Here they come!');
    await ambush(0);
  }
  async function ambush(i) {
    const st = S(), key = 'ambush' + i;
    if (st[key]) return true;
    const foes = i === 0 ? [S_('moth', 'blue'), S_('frog', 'green'), S_('hushling', 'red')] : [S_('beetle', 'red', 'big'), S_('bat', 'yellow'), S_('armadillo', 'blue')];
    const r = await G.fight({ foes, place: FIGHT_AT(), coach: ALLY });
    if (r && r.outcome === 'win') { st[key] = true; G.save(); STORY.think(i === 0 ? 'The shadows melt away. The stairs up are behind that fallen beam…' : 'The shadows melt into the cracks. The ladder goes up to a trapdoor…', 5); return true; }
    STORY.think(r && r.outcome === 'lose' ? 'Ouch… The shadows slink back into the corners. Catch your breath, then face them again.' : 'The shadows slink back into the corners.', 5);
    return false;
  }
  async function pushBeam() {
    const room = rooms[0], R = room.R, st = S(), b = room.beam;
    if (!st.beamSeen) { st.beamSeen = true; await sayT(LUC, 'l.beam'); }
    const g = await teamAsk({ verbs: ['v.push'], want: 'we', icon: 'push', title: 'A heavy oak beam lies across the stairs. Lucero and Bruno are ready to push. Say it: all of you, you too!', modelEn: 'Let’s push!',
      one: async () => { Sound.play('land', 6); STORY.think('{mimo} pushes all alone… the beam doesn’t budge. It needs everyone, you too!', 5); },
      you: async () => { Sound.play('land', 8); STORY.think('Lucero and Bruno push… it creaks, but it needs you too!', 5); },
      wrongVerb: 'They look at the beam, then at you. It’s heavy: it needs a good shove.' });
    if (!g) return;
    G.sim.lock = 1;
    G.cam.override = { pos: V(b.x - 2.2, Y0 + 3.4, b.z + 6.2), look: V(b.x + 0.4, Y0 + 0.6, b.z), dur: 0.8 };
    // everyone along the beam's near side
    const side = (t, off) => ({ x: b.x + Math.cos(b.rot) * t - Math.sin(b.rot) * off, z: b.z - Math.sin(b.rot) * t - Math.cos(b.rot) * off });
    const Bn = bruno(), Y = G.sim.you, face = Math.atan2(Math.sin(b.rot), Math.cos(b.rot)) + Math.PI;
    await Promise.all([walkTo(LUC, Object.assign(side(-1.2, -0.95), { yaw: face })), Bn ? walkTo(Bn, Object.assign(side(0, -1.0), { yaw: face })) : null]);
    const yp = side(1.2, -1.0); Y.x = yp.x; Y.z = yp.z; Y.yaw = face; G.sim.snap();
    G.sim.mimoGo({ x: side(0.6, -1.4).x, z: side(0.6, -1.4).z }, b);
    LUC.set('push', false);
    for (let k = 0; k < 3; k++) { Sound.play('land', 8 + k * 3); G.sim.mimo.hop = { t: 0 }; await wait(0.4); }
    Sound.play('wood');
    const x0 = b.x, z0 = b.z, r0 = b.rot, x1 = R.x + 6.1, z1 = R.z + 0.6, r1 = Math.PI / 2;
    await tween(1.1, k => { const e = k * k * (3 - 2 * k); room.beamG.position.set(lerp(x0, x1, e), Y0, lerp(z0, z1, e)); room.beamG.rotation.y = lerp(r0, r1, e); });
    Object.assign(room.beamSolid, { x: x1, z: z1, rot: r1 });
    G.w3d.fx.puff(x1, Y0 + 0.3, z1, 14, 0.35, '#8a8370'); solved();
    LUC.set('lantern', false); LUC.prop.place();
    st.beam = g.letter; G.save();
    G.cam.override = null; G.sim.lock = 0; G.sim.mimoGo(null, null);
    UI.toast('The beam rolls aside. The stairs up are clear!');
  }

  // ---------------------------------------------------------------- 1 · the choir loft: the seal of Hush
  async function singSeal() {
    const room = rooms[1], st = S();
    if (!st.sealSeen) { st.sealSeen = true; await sayT(LUC, 'l.seal'); }
    const g = await teamAsk({ verbs: ['v.sing'], want: 'we', icon: 'sing', title: 'A gray skin of Hush covers the belfry door. It swallows every sound… one voice, or two, won’t do. Say it: all of you, you too!', modelEn: 'Let’s sing!',
      one: async () => { Sound.play('sing'); room.seal.k = 0.6; STORY.think('{mimo} sings alone… the gray skin only ripples. It needs everyone!', 5); },
      you: async () => { Sound.play('sing'); room.seal.k = 0.8; STORY.think('Lucero and Bruno sing… the skin shivers, but holds. It needs you too!', 5.5); },
      wrongVerb: 'The gray skin doesn’t care about that. It eats sound… so give it more than it can eat.' });
    if (!g) return;
    G.sim.lock = 1;
    const s = room.sealAt;
    G.cam.override = { pos: V(s.x - 2.6, Y0 + 2.8, s.z + 6.0), look: V(s.x, Y0 + 1.5, s.z), dur: 0.8 };
    LUC.set('sing', false);
    for (let k = 0; k < 4; k++) { Sound.play('sing'); G.w3d.fx.sparkle(s.x + (Math.random() - 0.5) * 2, Y0 + 1.6 + Math.random(), s.z + 1.2, 6, ['#fff3a0', '#ffffff']); room.seal.k = 2 + k; await wait(0.45); }
    Sound.play('crack'); G.w3d.fx.puff(s.x, Y0 + 1.4, s.z + 0.3, 20, 0.4, '#b9b6c6');
    await tween(0.5, k => { room.seal.m.scale.setScalar(1 - k * 0.9); room.seal.m.material.opacity = 0.82 * (1 - k); });
    room.seal.m.visible = false; unsolid(room.sealSolid); solved();
    LUC.set('lantern', false); LUC.prop.place();
    st.seal = g.letter; G.save();
    G.cam.override = null; G.sim.lock = 0;
    UI.toast('The gray skin shatters! The way up to the belfry is open.');
  }

  // ---------------------------------------------------------------- 2 · the belfry stair: the trapdoor
  async function pushHatch() {
    const room = rooms[2], st = S(), L = room.ladder;
    if (!st.hatchSeen) { st.hatchSeen = true; await sayT(LUC, 'l.hatch'); }
    const g = await teamAsk({ verbs: ['v.push'], want: 'you', icon: 'push', title: 'The trapdoor at the top of the ladder is swollen shut. You hold the ladder; Lucero and Bruno climb up. Tell the two of them!', modelEn: 'Push, you two!',
      one: async () => { Sound.play('land', 6); STORY.think('{mimo} hops up the ladder and pushes… too heavy for {mimo} alone. Tell the two of them!', 5); },
      we: async () => { await sayT(LUC, 'l.hatchWe'); },
      wrongVerb: 'Lucero and Bruno look up at the trapdoor, then at you. It’s stuck: it needs a good shove.' });
    if (!g) return;
    G.sim.lock = 1;
    G.cam.override = { pos: V(L.x - 1.2, Y0 + 3.4, L.z + 7.2), look: V(L.x, Y0 + 3.4, L.z), dur: 0.8 };
    const Bn = bruno(), Y = G.sim.you;
    Y.x = L.x - 0.9; Y.z = L.z + 0.7; Y.yaw = Math.PI; G.sim.snap();
    await Promise.all([walkTo(LUC, { x: L.x + 0.1, z: L.z + 0.45, yaw: Math.PI }), Bn ? walkTo(Bn, { x: L.x + 0.9, z: L.z + 0.7, yaw: Math.PI }) : null]);
    // up the ladder they go
    const ly0 = LUC.y, by0 = Bn ? Bn.y : Y0;
    await tween(1.0, k => { LUC.y = ly0 + k * 3.2; if (Bn) { Bn.y = by0 + k * 2.4; } });
    for (let k = 0; k < 3; k++) { Sound.play('land', 8 + k * 3); await wait(0.4); }
    Sound.play('wood');
    await tween(0.6, k => { room.hatch.rotation.z = k * 1.9; room.hatchGlow.material.opacity = 0.7 * k; });
    G.w3d.fx.puff(L.x, Y0 + WH - 0.3, L.z + 0.7, 14, 0.35, '#a09a88'); solved();
    await tween(0.8, k => { LUC.y = ly0 + 3.2 * (1 - k); if (Bn) Bn.y = by0 + 2.4 * (1 - k); });
    LUC.y = ly0; if (Bn) Bn.y = by0;
    st.hatch = g.letter; G.save();
    G.cam.override = null; G.sim.lock = 0;
    UI.toast('The trapdoor bangs open! Light from the belfry above.');
  }

  // ---------------------------------------------------------------- 3 · the belfry: the Great Shadow, its shapes, Noa's page, the bell
  const SHAPES = [
    { kind: 'moth', color: 'blue', hp: 12, helpers: [['moth', 'green']] },
    { kind: 'frog', color: 'green', hp: 13, helpers: [['beetle', 'yellow']] },
    { kind: 'beetle', color: 'red', hp: 14, helpers: [['frog', 'blue'], ['bat', 'yellow']] },
  ];
  const shadeSpeaker = () => { const room = rooms[3], s = room.shade; return { id: 'shade', name: plainOf(SHADE_NAME[lang()] || SHADE_NAME.en), x: s.g.position.x, y: Y0 + 0.4, z: s.g.position.z + 0.4, top: 2.6, set() {} }; };
  async function wakeShade() {
    const room = rooms[3], R = room.R, st = S(), sh = room.shade;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x - 1.0, Y0 + 3.4, R.z + 6.6), look: V(sh.g.position.x, Y0 + 2.2, sh.g.position.z), dur: 0.8 };
    const ps = C.mimoShine({ x: sh.g.position.x - 1.2, z: sh.g.position.z + 2.2 }, 1.4);
    await wait(0.6);
    sh.mood = 'alert'; Sound.play('grow');
    await ps;
    G.w3d.fx.puff(sh.g.position.x, Y0 + 1.6, sh.g.position.z, 18, 0.45, '#3a3550');
    await sayT(shadeSpeaker(), 's.wake');
    await STORY.you('It turns into a creature… but it’s only a {w.shadow}. Say what it really is, {mimo}, or light it up!');
    G.cam.override = null; G.sim.lock = 0;
    await shadePhases();
  }
  async function shadePhases() {
    const room = rooms[3], st = S(), sh = room.shade;
    let k = st.shape || 0;
    while (k < SHAPES.length) {
      const P = SHAPES[k];
      const foes = [{ kind: P.kind, color: P.color, size: 'big', hp: P.hp, shadow: true, shade: 1.7 }].concat(P.helpers.map(([kind, color]) => S_(kind, color)));
      const r = await G.fight({ boss: 'shade', foes, place: FIGHT_AT(), coach: ALLY });
      if (!r || r.outcome !== 'win') {
        st.shape = k; sh.mood = 'asleep'; G.save();
        STORY.think(r && r.outcome === 'lose' ? 'Ouch… The Great Shadow coils back round the bell, laughing. Catch your breath, then light it up again.' : 'The Great Shadow coils back round the bell.', 5.5);
        return;
      }
      k++; st.shape = k; G.save();
      if (k < SHAPES.length) await shift();
    }
    st.boss = true; G.save();
    try { const MB = BATTLE._ && BATTLE._.marsh; if (MB && MB.recordShade) MB.recordShade(null); } catch (e) { /* (no bestiary) */ }
    await shadeGone();
  }
  // between shapes: it melts into a puddle of dark… and rises as something else
  async function shift() {
    const room = rooms[3], R = room.R, sh = room.shade;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x - 1.0, Y0 + 3.2, R.z + 6.2), look: V(sh.g.position.x, Y0 + 1.6, sh.g.position.z), dur: 0.01 };
    await tween(0.6, k => { sh.g.scale.set(1 + k * 0.4, 1 - k * 0.8, 1 + k * 0.4); });
    Sound.play('drip'); await wait(0.3);
    await tween(0.7, k => { sh.g.scale.set(1.4 - k * 0.4, 0.2 + k * 0.8, 1.4 - k * 0.4); });
    sh.g.scale.setScalar(1);
    await sayT(shadeSpeaker(), 's.next');
    G.cam.override = null; G.sim.lock = 0;
  }
  async function shadeGone() {
    const room = rooms[3], R = room.R, sh = room.shade;
    G.sim.lock = 1;
    G.cam.override = { pos: V(R.x - 1.0, Y0 + 3.2, R.z + 6.2), look: V(sh.g.position.x, Y0 + 1.6, sh.g.position.z), dur: 0.01 };
    await sayT(shadeSpeaker(), 's.last');
    room.candles.forEach(c => { c.fl.visible = true; }); Sound.play('chime');
    await tween(1.2, k => { sh.g.scale.setScalar(1 - k * 0.6); sh.g.position.y = Y0 + k * 1.2; sh.blobs.forEach(b => { b.m.material.opacity = 0.92 * (1 - k); }); });
    await sayT(shadeSpeaker(), 's.after');
    sh.g.visible = false; unsolid(room.shadeSolid);
    G.w3d.fx.sparkle(sh.g.position.x, Y0 + 1.6, sh.g.position.z, 30, ['#fff3a0', '#ffffff', '#ffd166']); Sound.play('learned');
    await wait(0.5);
    room.page.visible = true; Sound.play('page');
    G.cam.override = null; G.sim.lock = 0;
    await STORY.you('Something fluttered down from the beams. A page from Noa’s notebook!');
    G.save();
  }
  async function readPage() {
    const room = rooms[3], st = S();
    Sound.play('page');
    await UI.page('page.marsh', 'w.tower');
    st.page = true; room.page.visible = false;
    if (!G.state.pages.includes('page.marsh')) G.state.pages.push('page.marsh');
    await STORY.you('The old {w.tower}’s door is open… She’s up there, waiting. First: the eighth {w.bell}. All of us!');
    G.save();
  }
  async function ringBell() {
    const room = rooms[3], st = S(), bl = room.bell;
    if (!st.bellSeen) { st.bellSeen = true; await sayT(LUC, 'l.bell'); }
    const g = await teamAsk({ verbs: ['v.hit', 'v.push'], want: 'we', icon: 'bell', title: 'The chapel’s great bell. Lucero, Bruno and {mimo} take hold of it with you. Say it: all of you, you too!', modelEn: 'Let’s hit it! (or: let’s push it)',
      one: async () => { Sound.play('bell'); STORY.think('{mimo} bonks the bell alone: «tink». It needs all of you, you too!', 5); },
      you: async () => { Sound.play('bell'); STORY.think('Lucero and Bruno swing it a little… it needs you too!', 5); },
      wrongVerb: 'Everyone looks at the bell, then at you. A bell rings when you hit it… or push it to swing.' });
    if (!g) return;
    G.sim.lock = 1;
    G.cam.override = { pos: V(bl.x + 4.2, Y0 + 2.6, bl.z + 6.4), look: V(bl.x, Y0 + 2.8, bl.z), dur: 0.8 };
    const Bn = bruno(), Y = G.sim.you;
    await Promise.all([walkTo(LUC, { x: bl.x - 1.3, z: bl.z + 1.3, yaw: Math.PI }), Bn ? walkTo(Bn, { x: bl.x + 1.3, z: bl.z + 1.3, yaw: Math.PI }) : null]);
    Y.x = bl.x; Y.z = bl.z + 1.9; Y.yaw = Math.PI; G.sim.snap();
    G.sim.mimoGo({ x: bl.x + 0.6, z: bl.z + 1.1 }, bl);
    await wait(0.4);
    bl.mat.color.set('#c9a24a');
    for (let k = 0; k < 3; k++) { Sound.play('bigbell'); bl.swing = 0.45; G.w3d.fx.sparkle(bl.x, Y0 + 2.8, bl.z + 0.6, 22, ['#ffd166', '#fff3a0', '#ffffff']); await wait(1.0); }
    st.bell = g.letter; G.save();
    await wait(0.4);
    G.cam.override = null; G.sim.lock = 0;
    await finale();
  }
  // outside again: the bell rings over the whole marsh, the gray lifts, the color comes back: the eighth bell of eight
  async function finale() {
    await UI.fade(1, 700);
    hideAll(); inside = false; G.w3d.setInterior(null);
    if (LUC) LUC.group.visible = false;
    const f = G.state.flags;
    f.marshFree = true; f.bells = Math.max(8, f.bells || 0);
    teleport(OUTSIDE.x, OUTSIDE.z, OUTSIDE.yaw);
    if (C.placeBruno && C.brunoSpot) C.placeBruno(C.brunoSpot());
    const B = C.built;
    if (B && C.luceroSpot) B.placeLucero(C.luceroSpot());
    if (C.sync) C.sync();
    G.sim.lock = 1;
    const ch = C.CHAPEL;
    G.cam.override = { pos: V(ch.x + 9.5, 5.2, ch.z + 15.5), look: V(ch.x - 1.0, 6.5, ch.z - 2.0), dur: 0.01 };
    G.cam.snap(OUTSIDE.yaw, 0.3, 9);
    await UI.fade(0, 900);
    for (let k = 0; k < 8; k++) { Sound.play('bigbell'); if (B) B.setBell(0.35); if (k > 2) Sound.play('chime'); await wait(1.0); }
    await UI.chapter('The eighth bell', '8 of 8 · The Gray Marsh wakes up');
    G.cam.override = null; G.sim.lock = 0;
    await STORY.you('All eight bells! Listen: the whole marsh is waking up. Let’s tell Lucero, back in Candil.');
    G.save();
  }

  // ---------------------------------------------------------------- moving between rooms, in and out
  function teleport(x, z, yaw) {
    const Y = G.sim.you, M = G.sim.mimo;
    // (a wander spot or station left in the room behind would make Mimo «poof» straight back there)
    Y.x = x; Y.z = z; Y.yaw = yaw; M.x = x + 1.1; M.z = z + 0.8; M.hidden = false; M.wander = null; M.station = null; M.look = null; G.sim.snap();
  }
  function setFog(i) { G.w3d.setInterior(i === 0 && !S().lit0 ? { fog: '#08070d', near: 6, far: 16 } : { fog: '#1d2326', near: 14, far: 42 }); }
  function show(i) { rooms.forEach((r, k) => { r.g.visible = k === i; }); cur = i; quick = {}; setFog(i); placePeople(i); }
  function hideAll() { rooms.forEach(r => { r.g.visible = false; }); cur = -1; quick = {}; }
  async function enter() {
    build();
    await UI.fade(1, 450);
    inside = true;
    show(0); const R = ROOMS[0]; teleport(R.x - 4.5, R.z + 3.6, Math.PI); G.cam.snap(Math.PI, 0.66, 10.5);
    await UI.fade(0, 450);
    const st = S();
    if (!st.seen0) { st.seen0 = true; await UI.chapter('The Drowned Chapel', 'The Gray Marsh · the bell is at the very top'); }
    if (!st.lit0) await sayT(LUC, 'l.dark');
    G.save();
  }
  async function leave() {
    await UI.fade(1, 450);
    hideAll(); inside = false; G.w3d.setInterior(null);
    if (LUC) LUC.group.visible = false;
    teleport(OUTSIDE.x, OUTSIDE.z, OUTSIDE.yaw); G.cam.snap(OUTSIDE.yaw, 0.28, 8.5);
    if (C.placeBruno && C.brunoSpot) C.placeBruno(C.brunoSpot());
    if (C.built && C.luceroSpot) C.built.placeLucero(C.luceroSpot());
    await UI.fade(0, 450);
  }
  async function go(i, from = 'below') {
    await UI.fade(1, 350);
    show(i);
    const R = ROOMS[i], room = rooms[i];
    if (from === 'above') {           // back down from the room above: arrive by its way up
      const at = i === 0 ? { x: room.stairs.x - 1.6, z: room.stairs.z + 1.6 } : i === 1 ? { x: room.sealAt.x - 0.4, z: room.sealAt.z + 1.6 } : { x: room.ladder.x - 0.8, z: room.ladder.z + 1.6 };
      teleport(at.x, at.z, 0);
    } else teleport(R.x - 4.5, R.z + 3.6, Math.PI);
    G.cam.snap(Math.PI, 0.66, 10.5);
    await UI.fade(0, 350);
    const st = S();
    if (!st['seen' + i]) {
      st['seen' + i] = true; await UI.chapter(R.name, R.sub);
      if (i === 1) STORY.think('The choir loft. The door up to the belfry is covered in something gray… and it’s humming «shhh».', 5);
      if (i === 2 && !st.ambush2) {        // the belfry stair: shadows drop from the beams
        await wait(0.6);
        Sound.play('grow');
        await STORY.you('More {w.shadow:pl}! Name them, {mimo}, or light them up!');
        if (!(await ambush(2))) { st['seen' + i] = false; await go(i - 1, 'above'); return; }
      }
      if (i === 3) STORY.think('The belfry! The {w.bell}… and something huge and dark, coiled round it, asleep.', 5);
    }
    G.save();
  }
  // the Great Shadow again, after a lost fight: light it up, and it takes the shape it had
  async function wakeAgain() {
    const room = rooms[3], sh = room.shade;
    C.learnUse('v.light');
    G.sim.lock = 1;
    await C.mimoShine({ x: sh.g.position.x - 1.2, z: sh.g.position.z + 2.2 }, 1.2);
    sh.mood = 'alert'; Sound.play('grow');
    G.sim.lock = 0;
    await shadePhases();
  }
  // Lucero, if you talk to her in here: what she thinks the room needs
  function lucTalk() {
    const st = S();
    const key = cur === 0 ? (!st.lit0 ? 'l.dark' : 'l.beam') : cur === 1 ? 'l.seal' : cur === 2 ? 'l.hatch' : 'l.bell';
    return sayT(LUC, key);
  }

  // ---------------------------------------------------------------- what you can press E on, room by room
  function interactables() {
    const list = [], st = S(), room = rooms[cur]; if (!inside || !room) return list;
    const R = room.R, y = Y0, name = mimoName();
    const say = kind => (quick[kind] ? `«${ex(LEX.form(quick[kind]))}»` : `Tell ${name}`);
    list.push({ x: R.x - 4.5, z: R.z + HD - 0.9, y, r: 1.6, label: cur === 0 ? 'Leave the chapel' : 'Go back down', run: () => (cur === 0 ? leave() : go(cur - 1, 'above')) });
    if (LUC && LUC.group.visible) list.push({ x: LUC.x, z: LUC.z, y, r: 1.7, label: 'Talk', run: lucTalk });
    if (cur === 0) {
      if (!st.lit0) list.push({ x: R.x, z: R.z + 1.0, y, r: 3.4, label: say('dark'), run: () => tell({ kind: 'dark', verb: 'v.light', icon: 'light', title: `It’s pitch dark in the drowned nave. Water is dripping somewhere… and something is moving. What should ${name} do?`, hint: 'How did {mimo} clear the fog on the road?', right: lightNave }) });
      else if (!st.ambush0) list.push({ x: room.altar.x, z: room.altar.z + 1.7, y, r: 2.6, label: 'Face the shadows', run: () => ambush(0) });
      else if (!st.beam) list.push({ x: room.beam.x - 0.7, z: room.beam.z + 1.5, y, r: 2.6, label: 'Push, together', run: pushBeam });
      if (st.beam) list.push({ x: room.stairs.x - 1.6, z: room.stairs.z + 0.6, y, r: 2.0, label: 'Go up the stairs', run: () => go(1) });
    }
    if (cur === 1) {
      if (!st.seal) list.push({ x: room.sealAt.x - 0.4, z: room.sealAt.z + 1.5, y, r: 2.6, label: 'Sing, together', run: singSeal });
      else list.push({ x: room.sealAt.x - 0.4, z: room.sealAt.z + 1.3, y, r: 2.0, label: 'Go up to the belfry stair', run: () => go(2) });
      list.push({ x: room.organ.x + 0.4, z: room.organ.z + 1.0, y, r: 1.5, label: 'Look', run: () => STORY.think('An old pump organ, its pipes green with moss. One key still squeaks.', 4) });
    }
    if (cur === 2) {
      if (!st.ambush2) list.push({ x: R.x, z: R.z, y, r: 3.0, label: 'Face the shadows', run: () => ambush(2) });
      else if (!st.hatch) list.push({ x: room.ladder.x - 0.6, z: room.ladder.z + 1.2, y, r: 2.4, label: 'Tell them', run: pushHatch });
      else list.push({ x: room.ladder.x - 0.6, z: room.ladder.z + 1.1, y, r: 2.0, label: 'Climb up to the belfry', run: () => go(3) });
    }
    if (cur === 3) {
      const sp = room.shade.g.position;
      if (!st.boss) list.push({ x: sp.x - 1.2, z: sp.z + 2.4, y, r: 2.8, label: st.shape ? 'Light it up again' : say('shade'), run: () => (st.shape ? wakeAgain() : tell({ kind: 'shade', verb: 'v.light', icon: 'light', title: `Something huge and dark is coiled round the bell, two yellow eyes half shut. What should ${name} do?`, hint: 'In the dark, {mimo} knows what to do…', right: wakeShade })) });
      else if (!st.page) list.push({ x: room.page.position.x, z: room.page.position.z + 0.6, y, r: 2.0, label: 'Read', run: readPage });
      else if (!st.bell) list.push({ x: room.bell.x, z: room.bell.z + 2.0, y, r: 2.8, label: 'Ring it, together', run: ringBell });
    }
    return list;
  }
  // where the compass points inside: the next thing to do in this room
  function target() {
    const st = S(), room = rooms[cur]; if (!inside || !room) return null;
    const at = (o, hint) => (o ? { x: o.x, z: o.z, hint } : null), R = room.R;
    if (cur === 0) return !st.lit0 ? at({ x: R.x, z: R.z }, '{mimo} squints into the dark.') : !st.ambush0 ? at(room.altar, '{mimo} growls at the shadows by the altar.') : !st.beam ? at(room.beam, '{mimo} looks at the fallen beam. Heavy!') : at(room.stairs, '{mimo} points up the stairs!');
    if (cur === 1) return !st.seal ? at(room.sealAt, '{mimo} looks at the gray skin over the door. It’s humming «shhh».') : at(room.sealAt, '{mimo} points up the stairs to the belfry!');
    if (cur === 2) return !st.ambush2 ? at({ x: R.x, z: R.z }, '{mimo} watches the shadows.') : !st.hatch ? at(room.ladder, '{mimo} looks up the ladder at the stuck trapdoor.') : at(room.ladder, '{mimo} points up the ladder!');
    if (cur === 3) return !st.boss ? at(room.shade.g.position, '{mimo} stares at the huge dark shape round the bell.') : !st.page ? at(room.page.position, '{mimo} points at the page.') : at(room.bell, '{mimo} looks up at the bell.');
    return null;
  }

  // ---------------------------------------------------------------- per frame (while inside)
  function update(dt, t) {
    if (!inside || cur < 0) return;
    if (G.sim.lock && !STORY.busy) { G.sim.lock = 0; G.cam.override = null; }      // (a scene that broke off never leaves you frozen)
    const room = rooms[cur], st = S(), Y = G.sim.you;
    if (LUC && LUC.group.visible) C.animatePerson(LUC, dt, t, { x: Y.x, z: Y.z });
    room.candles.forEach((c, i) => { if (!c.fl.visible) return; const f = 1 + 0.15 * Math.sin(t * 11 + i) + 0.07 * Math.sin(t * 23 + i * 2); c.core.scale.set(0.04 * f, 0.08 * f, 0.04 * f); c.gl.material.opacity = 0.55 + 0.15 * Math.sin(t * 7 + i); });
    if (cur === 0) {
      if (room.water) room.water.material.opacity = 0.74 + Math.sin(t * 1.3) * 0.04;
      if (room.lurkers.visible) room.lurkers.children.forEach((g, i) => { g.position.y = Math.sin(t * 1.6 + i) * 0.06; });
    }
    if (cur === 1 && room.seal && room.seal.m.visible) {
      const s = room.seal; s.k = damp(s.k, 1, 1.2, dt);
      const amp = 0.02 * s.k;
      for (let i = 0; i < s.pos.count; i++) { const bx = s.base[i * 3], by = s.base[i * 3 + 1]; s.pos.setZ(i, Math.sin(t * 3 + bx * 4 + by * 3) * amp * (1 + s.k)); }
      s.pos.needsUpdate = true;
    }
    if (cur === 2 && room.hatchGlow && st.hatch) room.hatchGlow.material.opacity = 0.6 + 0.1 * Math.sin(t * 2);
    if (cur === 3) {
      const bl = room.bell; bl.swing = damp(bl.swing, 0, 0.9, dt); bl.piv.rotation.x = Math.sin(t * 3.0) * bl.swing;
      const sh = room.shade;
      if (sh.g.visible) {
        const a = sh.mood === 'alert' ? 1 : 0.4;
        sh.blobs.forEach((b, i) => { b.m.position.y = b.y0 + Math.sin(t * (1.2 + i * 0.3) + b.ph) * 0.06 * (1 + a); b.m.scale.setScalar(b.r * (1 + Math.sin(t * 1.7 + b.ph) * 0.04 * (1 + a))); });
        sh.eyes.forEach(e => { const open = sh.mood === 'alert' ? 1 : 0.35 + 0.1 * Math.sin(t * 0.8); e.e.scale.y = 0.07 * open; e.gl.material.opacity = 0.25 + 0.4 * open; });
      }
      if (room.page.visible) room.pageGlow.material.opacity = 0.35 + 0.2 * Math.sin(t * 3);
    }
  }
  // the music in here: the chapel's own song (below)
  const song = () => (typeof Sound !== 'undefined' && Sound.songs && Sound.songs.includes('chapel') ? 'chapel' : null);

  function init(game) { G = game; }
  return {
    init, enter, leave, update, interactables, target, song, ROOMS, OUTSIDE, LINES: CL, PAGE, SHAPES,
    get inside() { return inside; }, get room() { return cur; },
    _: { S, build, go, show, rooms, lightNave, ambush, pushBeam, singSeal, pushHatch, wakeShade, wakeAgain, shadePhases, shift, shadeGone, readPage, ringBell, finale, teamAsk, tell, get LUC() { return LUC; } },
  };
})();

// ================================================================ the Gray Marsh's two songs (REGIONS.md 8: their own, quiet, eerie-funky, never orchestral)
//   'marsh'   «Will-o'-the-Wisp Shuffle»: a slow swamp shuffle in 12/8 (triplets at 76 a beat), E dorian. A round deep bass walking
//             the shuffle, felt kick and brushes, shaker on the last triplet, a chorus guitar's offbeat stabs, kalimba drops and
//             water drips, frogs croaking (a low cuíca), a glass-harmonica shimmer for the wisps, and an EWI hook in the second half.
//   'chapel'  «Drowned Hymn»: a hymn that sank, in 5/4 (3 + 2) at 88, D minor with the ♭II. A slow-leslie organ, a ghost choir
//             on «oo», a deep sliding sub under it, a dusty kick and side-stick, drips in the echo, a recorder singing the hymn
//             line, and the drowned bell tolling low every four bars.
// MARSHMUSIC._preview(name, sec) renders a WAV (tests: POSTed to the dev server's /shot, saved as .png: rename it to .wav).
const MARSHMUSIC = (() => {
  if (typeof Sound === 'undefined' || !Sound.addSong || !Sound.kit) return { songs: [] };
  const K = Sound.kit;
  // ---------------------------------------------------------------- «Will-o'-the-Wisp Shuffle» (the basin): 12 steps a bar
  {
    const ROOT = [40, 40, 45, 45, 40, 40, 36, 47, 40, 43, 45, 45, 36, 47, 40, 40];
    const CH = { 40: [55, 59, 62, 66], 45: [55, 61, 66], 36: [52, 58, 62], 47: [57, 63, 67], 43: [55, 59, 62, 64] };
    const chordOf = bar => (bar === 6 ? [55, 59, 64] : CH[ROOT[bar]]);
    // the bass: [step, interval, length (steps), level]: the shuffle's long-short walk
    const BASS = [[0, 0, 2.6, 1], [3, 0, 1, 0.7], [5, 7, 1, 0.75], [6, 10, 2, 0.85], [9, 12, 1, 0.7], [11, -1, 1, 0.6]];
    const HOOK = K.mel('B4/3 D5/3 E5/6 | G5/4 F#5/2 E5/3 D5/3 | E5/3 A5/3 B5/4 A5/2 | G5/6 r/3 E5/3 | G5/3 E5/3 D5/6 | D#5/3 F#5/3 A5/4 G5/2 | F#5/3 E5/3 B4/6 | E5/12 |');
    Sound.addSong('marsh', { bpm: 57, len: 192, swing: 0, vol: 0.32, verb: 0.24, echo: 0.14, echoSteps: 3, tone: 4600, play(i, t, s16) {
      const bar = Math.floor(i / 12), st = i % 12, r = ROOT[bar], ch = chordOf(bar), B = bar >= 8;
      // the kit: felt kick on the one and the shuffle's push, brushes on two and four, the last triplet on the shaker
      if (st === 0 || st === 8 || (B && st === 11 && bar % 2)) K.feltkick(t, st ? 0.7 : 0.95);
      if (st === 3 || st === 9) { K.brush(t, 1.2, 0.22); if (st === 9 && bar % 2) K.dustsnare(t, 0.35); }
      if (st % 3 === 2) K.shaker(t, st === 11 ? 0.6 : 0.4);
      if (st % 3 === 0) K.ride(t, st === 0 ? 0.35 : 0.2);
      if (st === 3 || st === 9) K.hatfoot(t, 0.5);
      // the round bass walking the shuffle
      for (const [at, iv, len, v] of BASS) if (st === at) K.roundbass(r + iv, t, len * s16 * 0.95, v);
      // the chorus guitar's offbeat stabs, the kalimba's drops, a drip
      if (st === 2 || st === 8) K.chorusgtr(ch, t, s16 * 1.4, st === 2 ? 0.45 : 0.35);
      if (bar % 2 === 1 && st === 10) K.kalimba(ch[ch.length - 1] + 12, t, 0.6, 0.9);
      if (bar % 4 === 1 && st === 4) K.drip(84 + (bar % 3) * 2, t, 0.8);
      // frogs (a low cuíca, croak-croak) and the wisps' shimmer
      if ((bar === 2 || bar === 10) && (st === 7 || st === 8)) K.cuica(t, st === 8, 0.55, 0.12);
      if (st === 0 && bar % 4 === 0) { K.glass(76, t, 0.5, 2.4); K.glass(83, t + s16 * 3, 0.35, 2.0); }
      if (st === 6 && bar % 4 === 3) K.swell(t, s16 * 6, 0.5);
      // the EWI hook in the second half
      if (B) { const n = HOOK[(bar - 8) * 12 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.95, 'ewi', 0.75); }
    } });
  }
  // ---------------------------------------------------------------- «Drowned Hymn» (the drowned chapel): 5/4, 20 steps a bar
  {
    const ROOT = [38, 38, 34, 34, 43, 43, 39, 45, 38, 41, 43, 45];
    const ORG = { 38: [62, 65, 69], 34: [62, 65, 70], 43: [62, 67, 70], 39: [63, 67, 70], 45: [61, 64, 67], 41: [60, 65, 69] };
    const HYMN = K.mel('D5/4 G5/4 A5/4 Bb5/8 | A5/4 G5/4 F5/4 G5/8 | G5/4 Bb5/4 C6/4 Bb5/4 G5/4 | A5/8 G5/4 E5/4 C#5/4 | D5/8 F5/4 A5/8 | C6/4 A5/4 G5/4 F5/8 | G5/4 Bb5/4 A5/4 G5/4 F5/4 | E5/8 C#5/4 D5/8 |');
    Sound.addSong('chapel', { bpm: 88, len: 240, swing: 0, vol: 0.3, verb: 0.3, echo: 0.18, echoSteps: 4, tone: 5200, play(i, t, s16) {
      const bar = Math.floor(i / 20), st = i % 20, r = ROOT[bar], org = ORG[r];
      // the groups (3 + 2): a dusty kick on the ones, side-stick on the twos, quiet hats, a clink now and then
      if (st === 0 || st === 12 || (st === 6 && bar % 2)) K.dustkick(t, st === 0 ? 0.9 : 0.65);
      if (st === 8 || st === 16) K.sidestick(t, 0.8);
      if (st % 2 === 0 && st !== 0) K.dusthat(t, st % 4 === 2 ? 0.35 : 0.2);
      if (st === 19 && bar % 2 === 1) K.clink(t, 0.6);
      // the sub sliding under it all: the one, the four, a pickup
      if (st === 0) K.subglide(r, t, s16 * 11, 0.9);
      if (st === 12) K.subglide(r + 7, t, s16 * 5, 0.7);
      if (st === 18) K.subglide(r + (bar % 2 ? 12 : 10), t, s16 * 2, 0.6);
      // the organ (a slow leslie) and the ghost choir on «oo»
      if (st === 0) { K.hammond(org, t, s16 * 19, 0.55, 1.2); K.vox(org[2], t + s16 * 2, s16 * 8, 0.35, 'o', 'u'); K.vox(org[0] - 12, t + s16 * 2, s16 * 8, 0.3, 'u', 'o'); }
      // drips in the echo, and the drowned bell, low, every four bars
      if ((st === 5 || st === 15) && (bar + st) % 3 === 0) K.drip(79 + ((bar * 5 + st) % 4) * 2, t, 0.7);
      if (st === 0 && bar % 4 === 0) K.bell(50, t, 0.35);
      // the recorder's hymn, from the fifth bar
      if (bar >= 4) { const n = HYMN[(bar - 4) * 20 + st]; if (n) K.lead(n[0], t, n[1] * s16 * 0.92, 'recorder', 0.7); }
    } });
  }
  // ---------------------------------------------------------------- previews (tests): a WAV of the first `sec` seconds
  function wav(buf) {
    const ch = buf.numberOfChannels, sr = buf.sampleRate, n = buf.length, out = new DataView(new ArrayBuffer(44 + n * ch * 2));
    const w = (o, s) => { for (let k = 0; k < s.length; k++) out.setUint8(o + k, s.charCodeAt(k)); };
    w(0, 'RIFF'); out.setUint32(4, 36 + n * ch * 2, true); w(8, 'WAVE'); w(12, 'fmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true);
    out.setUint32(24, sr, true); out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * ch * 2, true);
    const data = []; for (let c = 0; c < ch; c++) data.push(buf.getChannelData(c));
    let o = 44; for (let k = 0; k < n; k++) for (let c = 0; c < ch; c++) { const v = Math.max(-1, Math.min(1, data[c][k])); out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true); o += 2; }
    return new Blob([out.buffer], { type: 'audio/wav' });
  }
  async function _preview(name, sec = 26) {
    const r = await Sound._render(name, sec, { buffer: true, rate: 44100 }); if (!r || !r.buf) return null;
    const blob = wav(r.buf), url = await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(blob); });
    const resp = await fetch('/shot', { method: 'POST', body: JSON.stringify({ name: 'music_' + name, data: url }) });
    return { name, sec: r.sec, peak: r.peak, rms: r.rms, nan: r.nan, saved: await resp.text() };
  }
  return { songs: ['marsh', 'chapel'], _preview };
})();

// ================================================================ the side quests' play (quests.js lists them: marsh.shadows, marsh.drill)
//   Lolo and Mati's shadow puppets: once the kids are awake, a lantern and their hands make a creature's shadow on their hut's
//     wall; say what it is (its name, as in a fight: «la polilla»). Four right: the quest's done (coins along the way).
//   Bruno's team drill: Bruno, in Candil, asks for a practice fight against his straw dummies with him at your side; three team
//     orders in one drill («¡Salten!», «¡Golpeemos…!»: marsh_battle.js counts them) and it's done.
(() => {
  if (typeof MARSH === 'undefined') return;
  const C = MARSH;
  const T = (en, es, pt, de, zh, ja) => ({ en, es, pt, de, zh, ja });
  Object.assign(C.ML, {
    'k.start': T('Shadow game! We make a creature with our hands, and you say what it is!', '¡Juego de sombras! Hacemos un animal con las manos, ¡y tú dices qué es!', 'Jogo de sombras! A gente faz um bicho com as mãos, e você diz o que é!', 'Schattenspiel! Wir machen ein Tier mit den Händen, und du sagst, was es ist!',
      '[影子|yǐng zi] [游戏|yóu xì] ！ [我们|wǒ men] [用|yòng] [手|shǒu] [做|zuò] [一个|yī gè] [动物|dòng wù] ， [你|nǐ] [说|shuō] [是|shì] [什么|shén me] ！', '[影絵|かげえ] あそび ！ わたしたち が [手|て] で [動物|どうぶつ] を [作|つく]る から 、 [何|なに] か [当|あ]てて ！'),
    'k.yes': T('Yes! You got it!', '¡Sí! ¡Adivinaste!', 'Isso! Você acertou!', 'Ja! Richtig geraten!', '[对|duì] ！ [你|nǐ] [猜|cāi] [对|duì] [了|le] ！', 'そう ！ [当|あ]たり ！'),
    'k.no': T('Nooo! Look at the shadow’s shape again!', '¡Nooo! Mira otra vez la forma de la sombra.', 'Nãooo! Olha de novo a forma da sombra.', 'Neee! Schau dir die Form vom Schatten nochmal an.', '[不|bú] [对|duì] ！ [你|nǐ] [再|zài] [看看|kàn kan] [影子|yǐng zi] [的|de] [样子|yàng zi] 。', 'ちがう よ ！ もう [一回|いっかい] 、 [影|かげ] の [形|かたち] を [見|み]て 。'),
    'k.again': T('Again! Another one!', '¡Otra! ¡Otra!', 'De novo! Mais uma!', 'Nochmal! Noch eins!', '[再|zài] [来|lái] [一个|yī gè] ！', 'もう [一回|いっかい] ！'),
    'k.done': T('You’re so good at guessing! The marsh’s shadows don’t stand a chance.', '¡Qué bien adivinas! Las sombras de la ciénaga no tienen nada que hacer.', 'Você adivinha muito bem! As sombras do pântano não têm chance.', 'Du rätst echt gut! Die Schatten im Moor haben keine Chance.',
      '[你|nǐ] [猜|cāi] [得|de] [真|zhēn] [准|zhǔn] ！ [沼泽|zhǎo zé] [里|lǐ] [的|de] [影子|yǐng zi] [没|méi] [机会|jī huì] [了|le] 。', '[当|あ]てる の 、 すごく [上手|じょうず] ！ [沼|ぬま] の [影|かげ] なんか 、 かなわない ね 。'),
  });
  if (typeof CJK !== 'undefined' && CJK.addSource) for (const k of ['k.start', 'k.yes', 'k.no', 'k.again', 'k.done']) for (const l of ['zh', 'ja']) { try { CJK.addSource(C.ML[k][l]); } catch (e) { /* optional */ } }
  // ---------------------------------------------------------------- the puppets: silhouettes on the kids' hut wall
  const SIL = {
    moth: c => { c.beginPath(); c.ellipse(128, 140, 10, 46, 0, 0, TAU); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.ellipse(128 + s * 44, 110, 46, 30, s * -0.5, 0, TAU); c.fill(); c.beginPath(); c.ellipse(128 + s * 34, 170, 30, 22, s * 0.5, 0, TAU); c.fill(); c.lineWidth = 4; c.beginPath(); c.moveTo(128 + s * 5, 96); c.quadraticCurveTo(128 + s * 14, 70, 128 + s * 30, 58); c.stroke(); } },
    frog: c => { c.beginPath(); c.ellipse(128, 166, 64, 44, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(128, 124, 48, 30, 0, 0, TAU); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.arc(128 + s * 26, 100, 15, 0, TAU); c.fill(); c.beginPath(); c.ellipse(128 + s * 62, 190, 28, 15, s * 0.3, 0, TAU); c.fill(); c.fillRect(128 + s * 30 - 7, 180, 14, 34); } },
    bat: c => { c.beginPath(); c.ellipse(128, 136, 18, 30, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(128, 100, 16, 0, TAU); c.fill(); for (const s of [-1, 1]) { c.beginPath(); c.moveTo(128 + s * 8, 92); c.lineTo(128 + s * 16, 70); c.lineTo(128 + s * 18, 96); c.fill(); c.beginPath(); c.moveTo(128 + s * 14, 118); c.lineTo(128 + s * 110, 96); c.quadraticCurveTo(128 + s * 96, 130, 128 + s * 84, 148); c.quadraticCurveTo(128 + s * 66, 136, 128 + s * 56, 158); c.quadraticCurveTo(128 + s * 40, 144, 128 + s * 16, 160); c.fill(); } },
    crab: c => { c.beginPath(); c.ellipse(128, 156, 60, 36, 0, 0, TAU); c.fill(); c.lineWidth = 7; for (const s of [-1, 1]) { c.beginPath(); c.arc(128 + s * 72, 100, 22, 0, TAU); c.fill(); c.beginPath(); c.moveTo(128 + s * 40, 140); c.lineTo(128 + s * 66, 116); c.stroke(); for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(128 + s * 46, 160 + k * 10); c.lineTo(128 + s * 92, 176 + k * 16); c.stroke(); } c.beginPath(); c.moveTo(128 + s * 14, 124); c.lineTo(128 + s * 18, 104); c.stroke(); c.beginPath(); c.arc(128 + s * 18, 102, 6, 0, TAU); c.fill(); } },
    beetle: c => { c.beginPath(); c.ellipse(128, 150, 42, 58, 0, 0, TAU); c.fill(); c.beginPath(); c.arc(128, 86, 22, 0, TAU); c.fill(); c.lineWidth = 6; for (const s of [-1, 1]) { for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(128 + s * 36, 124 + k * 26); c.lineTo(128 + s * 70, 112 + k * 34); c.stroke(); } c.beginPath(); c.moveTo(128 + s * 8, 68); c.quadraticCurveTo(128 + s * 18, 46, 128 + s * 36, 40); c.stroke(); } },
    bee: c => { c.beginPath(); c.ellipse(128, 150, 52, 38, 0, 0, TAU); c.fill(); c.beginPath(); c.moveTo(178, 150); c.lineTo(204, 158); c.lineTo(178, 164); c.fill(); for (const s of [-1, 1]) { c.globalAlpha = 0.75; c.beginPath(); c.ellipse(128 + s * 26, 100, 26, 38, s * -0.4, 0, TAU); c.fill(); c.globalAlpha = 1; c.lineWidth = 4; c.beginPath(); c.moveTo(96, 132); c.quadraticCurveTo(80, 104, 70 + (s + 1) * 6, 92); c.stroke(); } },
  };
  const ORDER = ['n.moth', 'n.frog', 'n.bat', 'n.crab', 'n.beetle', 'n.bee'];
  let screen = null;
  function makeScreen() {
    if (screen) return screen;
    const B = C.built; if (!B) return null;
    const hut = C.HUTS.find(b => b.id === 'kids'); if (!hut) return null;
    // a puppet sheet beside the kids' hut: two poles, a bar, an old white sheet (the shadows show on it while they play)
    const parent = B.objects && B.objects.near ? B.objects.near : B.group;
    const lx = -hut.w / 2 - 1.0, lz = hut.d / 2 + 0.5, c = Math.cos(hut.rot), s = Math.sin(hut.rot);
    const f = { x: hut.x + c * lx + s * lz, z: hut.z - s * lx + c * lz }, y0 = WORLD.terrainAt(f.x, f.z);
    const k = CAVES.Kit(), GG = CAVES.GEO;
    k.at(f.x, y0, f.z, hut.rot);
    for (const sx of [-0.78, 0.78]) k.add(GG.cyl6, sx, 1.0, -0.02, 0.05, 2.0, 0.05, '#6b4a30', { ink: 0.006 });
    k.box(0, 1.98, -0.02, 1.7, 0.07, 0.07, '#6b4a30', { ink: 0.006 }).box(0, 1.3, -0.04, 1.46, 1.16, 0.02, '#efe6cf', { ink: 0.004 });
    k.free(); k.build(parent);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 256;
    const tx = new THREE.CanvasTexture(cv);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.1), new THREE.MeshBasicMaterial({ map: tx, transparent: true }));
    m.position.set(f.x + s * 0.0, y0 + 1.3, f.z + c * 0.0); m.rotation.y = hut.rot; m.visible = false;
    parent.add(m);
    screen = { m, cv, tx, front: { x: f.x + s * 1.9, z: f.z + c * 1.9 }, hut };
    return screen;
  }
  function draw(kind) {
    const s = makeScreen(); if (!s) return;
    const c = s.cv.getContext('2d'); c.clearRect(0, 0, 256, 256);
    const g = c.createRadialGradient(128, 128, 10, 128, 128, 126); g.addColorStop(0, 'rgba(255,226,150,0.95)'); g.addColorStop(0.7, 'rgba(255,200,110,0.55)'); g.addColorStop(1, 'rgba(255,190,100,0)');
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    if (kind && SIL[kind]) { c.fillStyle = '#2a2230'; c.strokeStyle = '#2a2230'; c.lineCap = 'round'; SIL[kind](c); }
    s.tx.needsUpdate = true; s.m.visible = true;
  }
  const fold = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  function saysNoun(text, id, l) {
    const it = LEX.item(id); if (!it) return false;
    const forms = [it[l], it.pl && it.pl[l], ...((it.alt && it.alt[l]) || [])].filter(Boolean);
    if (l === 'zh' || l === 'ja') {
      if (typeof CJK === 'undefined') return false;
      const k = CJK.canon(String(text), l), raw = String(text).replace(/\s/g, '');
      return forms.some(f => { const fk = CJK.canon(CJK.plain(f, { lang: l }), l), ch = CJK.chars ? String(CJK.chars(f, { lang: l })).replace(/\s/g, '') : ''; return (!!fk && k.includes(fk)) || (!!ch && raw.includes(ch)); });
    }
    const said = ' ' + fold(text) + ' ';
    return forms.some(f => said.includes(' ' + fold(f) + ' '));
  }
  // the name with its article, as the battle shows it («la polilla», «der Käfer»; zh / ja the word)
  function theNoun(id, l) {
    const sp = id.slice(2), Lb = typeof BATTLE !== 'undefined' && BATTLE._ && BATTLE._.LANGS && BATTLE._.LANGS[l], S = Lb && Lb.species && Lb.species[sp], it = LEX.item(id);
    if (!S) return it ? it[l] : sp;
    if (l === 'zh' || l === 'ja') return S.w;
    const A = { es: { m: 'el', f: 'la' }, pt: { m: 'o', f: 'a' }, de: { m: 'der', f: 'die', n: 'das' } }[l] || {};
    return `${A[S.g] || ''} ${S.w}`.trim();
  }
  async function puppets() {
    const G = C.G, st = C._.S(), l = G.state.lang || 'es', kids = ['lolo', 'mati'].map(id => C.person(id)).filter(Boolean);
    const plain = s => ((l === 'zh' || l === 'ja') && typeof CJK !== 'undefined' ? CJK.plain(String(s), { lang: l }) : String(s));
    const scr = makeScreen(); if (!scr || !kids.length) return;
    const list = ORDER.filter(id => LEX.item(id) && (id !== 'n.crab' || typeof PORT !== 'undefined'));
    if ((st.puppets || 0) >= 4) { draw(null); await C.sayT(kids[0], 'k.done'); return; }
    // the kids by their hut, the lantern lit behind them
    const homes = kids.map(p => ({ x: p.x, z: p.z, yaw: p.baseYaw }));
    kids.forEach((p, i) => { p.x = scr.front.x + (i ? 0.9 : -0.9); p.z = scr.front.z + 0.4; p.baseYaw = p.yaw = scr.hut.rot + Math.PI; p.busy = true; });
    G.cam.override = { pos: new THREE.Vector3(scr.front.x + Math.sin(scr.hut.rot) * 5.5, WORLD.terrainAt(scr.front.x, scr.front.z) + 2.4, scr.front.z + Math.cos(scr.hut.rot) * 5.5), look: new THREE.Vector3(scr.m.position.x, scr.m.position.y, scr.m.position.z), dur: 0.8 };
    try {
      if (!st.puppetSeen) { st.puppetSeen = true; await C.sayT(kids[0], 'k.start'); }
      while ((st.puppets || 0) < 4) {
        const id = list[(st.puppets || 0) % list.length], kind = id.slice(2);
        draw(kind); Sound.play('pip');
        const nm = (l === 'zh' || l === 'ja') && C.NAME_CJ ? `${plain(C.NAME_CJ.Lolo[l])} & ${plain(C.NAME_CJ.Mati[l])}` : 'Lolo & Mati';
        const r = await UI.command({ name: nm, icon: 'shadow', title: 'Lolo and Mati make a shadow on their hut’s wall with the lantern and their hands. What creature is it?', verbs: [], placeholder: 'what is it?…',
          hint: 'Its name, as in a fight (? shows it)', model: plain(theNoun(id, l)), modelEn: 'the ' + kind });
        if (!r || r.cancelled) break;
        if (!String(r.text || '').trim() || r.idk) { STORY.think(`It was «${plain(theNoun(id, l))}»! The kids make another one…`, 4); continue; }
        if (!saysNoun(r.text, id, l)) { Sound.play('wrong'); await C.sayT(kids[1] || kids[0], 'k.no'); continue; }
        Sound.play('chest'); G.w3d.fx.sparkle(scr.m.position.x, scr.m.position.y, scr.m.position.z, 16, ['#ffd166', '#fff3a0']);
        st.puppets = (st.puppets || 0) + 1; G.state.coins = (G.state.coins || 0) + 5; G.save();
        await C.sayT(kids[0], 'k.yes');
        if (st.puppets >= 4) { G.state.coins += 20; G.save(); UI.toast('Shadow puppets: 4 of 4! +20 coins'); await C.sayT(kids[1] || kids[0], 'k.done'); break; }
        UI.toast(`Shadow puppets: ${st.puppets}/4 · +5 coins`);
        await C.sayT(kids[1] || kids[0], 'k.again');
      }
    } finally {
      G.cam.override = null; draw(null); scr.m.visible = false;
      kids.forEach((p, i) => { p.x = homes[i].x; p.z = homes[i].z; p.baseYaw = p.yaw = homes[i].yaw; p.busy = false; });
    }
  }
  C.sides = {
    interactables(Y) {
      const G = C.G; if (!G || !C.built) return [];
      const scr = makeScreen();      // (the sheet stands by the kids' hut from the start)
      const st = C._.S(); if (!st.told || !st.told.kids || G.state.flags.marsh !== true) return [];
      if (!scr || Math.hypot(Y.x - scr.front.x, Y.z - scr.front.z) > 6) return [];
      return [{ x: scr.front.x, z: scr.front.z, r: 2.2, label: (st.puppets || 0) >= 4 ? 'Shadow puppets (done)' : 'Shadow puppets', run: puppets }];
    },
    puppets, saysNoun, theNoun, draw,
  };
  // ---------------------------------------------------------------- Bruno's team drill
  C.drill = async function () {
    const G = C.G, st = C._.S();
    const pick = typeof UI.choose === 'function' ? await UI.choose('Bruno', [{ label: 'Team drill', sub: 'a practice fight with Bruno at your side: give team orders', value: 'drill' }, { label: 'Just talk', value: 'talk' }]) : 'drill';
    if (pick === 'talk') return STORY.say('bruno', G.state.flags.marshFree ? 'marsh.b.report' : 'marsh.b.candil');
    if (pick !== 'drill') return;
    await STORY.say('bruno', 'marsh.b.drill');
    const r = await G.fight({ practice: true, focus: 'mixed', coach: { name: 'Bruno', ally: true }, place: { x: G.sim.you.x, z: G.sim.you.z, biome: 'marsh' } });
    const fs = typeof BATTLE !== 'undefined' && BATTLE._ && BATTLE._.flow && BATTLE._.flow.G && BATTLE._.flow.G.stats;     // (the fight's own stats: results() doesn't carry the team count)
    const n = (r && r.stats && r.stats.team) || (fs && fs.team) || 0;
    st.drillBest = Math.max(st.drillBest || 0, n); G.save();
    if (n >= 3) UI.toast(`Team orders in that drill: ${n}. Bruno grins: well done!`);
    else STORY.think(`Team orders in that drill: ${n} of 3. Tell Bruno and {mimo} together, or everyone, you too. (Bruno’s waiting for another go.)`, 6);
  };
})();


