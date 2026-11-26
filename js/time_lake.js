'use strict';
// The Mirror Lake in three worlds (DESIGN.md 18.10 "T2a", game/TIME.md "The Mirror Lake long ago and tomorrow"): Chapter 4's third
// region, a region TIME dresses itself, in Molinar's shape (time_molinar.js is the model).
//   time_lake.js            LAKET: the region, its three cracks, Noa's voice in Remanso's square, Chapter 4's steps and echoes,
//                           the shared kit (names, saying and demonstrating, teaching the words, the ask box, S–D grading through
//                           MOLT.grade), the land the lake covers today (the sandbar, the little island, the grotto's arch: dry
//                           long ago, drained tomorrow), the journal's word tab, check(), test hooks
//   lake_past(_text).js     LK_PAST / LPTXT: the lake long ago (the winter after the concert): the ferryman, young Bartolo and
//                           young Marina, Elio's dad on the shore; the main path, 3 side quests (the waiting bench: cross-time)
//   lake_future(_text).js   LK_FUT / LFTXT: the lake tomorrow: gray and still, the ferry rusted, Remanso's people frozen until
//                           promised a tomorrow; Lalo; 3 side quests (a warning from tomorrow: cross-time)
//   lake_past_dungeon.js    LK_PGROT: the frogs' grotto under the little island, long ago (rooms y 300, z −300)
//   lake_future_dungeon.js  LK_FGROT: the drowned grotto, tomorrow (rooms y 300, z −270)
//   lake_time_boss.js       LKBOSS: the Frog King (young and vain) and the Gray Toad (old, and full of dark predictions)
//   lake_time_music.js      six songs
// The cracks (open with CH4.open('lake'): after Molinar's two echoes): on the south beach (today ↔ the Past), on the road into
// Remanso (today ↔ the Future), in Remanso's square (all three; Noa speaks there, and you report there).
// State: TIME.state('lake', 'past' | 'future' | 'now'); flags: TIME.flag('past', 'lkBench' | 'lkFree'), ('future', 'lkWarn' | 'lkFree'
// | 'lkParty'), ('now', 'lkTaught').
const LAKET = (() => {
  if (typeof TIME === 'undefined' || typeof MOLT === 'undefined' || !MOLT) return null;
  const A = TIME.API, V = A.V, gy = A.gy, snd = A.snd, M0 = MOLT;
  const G = () => A.G;
  const lang = () => A.lang();
  const isCl = l => l === 'zh' || l === 'ja';
  const LANGS = ['es', 'pt', 'de', 'zh', 'ja'];
  const L = (en, es, pt, de, zh, ja, o) => Object.assign({ en, es, pt, de, zh, ja }, o || {});
  const esc = s => A.esc(s);
  const wait = s => STORY.wait(s);
  const lock = on => M0.lock(on);
  const shot = (pos, look, dur) => M0.shot(pos, look, dur);
  const mimoName = () => M0.mimoName();
  const plainT = s => A.plainT(s);
  const down = (letter, n) => M0.down(letter, n);
  const OFF = A.OFF;

  // ------------------------------------------------------------ where things are (each crack checked with the probe in every world)
  const CEN = { x: -172, z: -148 }, RAD = 46;
  const CRACK = { beach: { x: -154.5, z: -140.5 }, road: { x: -130.5, z: -149.5 }, square: { x: -141.0, z: -148.0 } };
  // what the lake covers today: long ago (the lake was low that winter) a sandbar ran from the end of the main pier to a little
  // island with the frogs' grotto in it; tomorrow the north-west bay has drained, and the same island stands in gray mud
  const ISL = { x: -203, z: -137, r: 5.4 };
  const BAR = { a: { x: -184.4, z: -150.2 }, b: { x: -198.8, z: -140.2 }, w: 2.6 };
  const ARCH = { x: -199.6, z: -139.9, yaw: Math.atan2(-184.4 + 199.6, -150.2 + 139.9) };    // the grotto's mouth, facing the sandbar
  const DOOR = { x: -198.6, z: -140.9 };                                                       // where you stand to go in
  const MUD = { x0: -216, x1: -186, z0: -149, z1: -127 };                                      // tomorrow's drained bay

  // ------------------------------------------------------------ the save's part
  const st = w => TIME.state('lake', w);
  const R0 = s => (s && s.worlds && s.worlds.r && s.worlds.r.lake) || {};
  const sp = s => R0(s).past || {}, sf = s => R0(s).future || {}, sn = s => R0(s).now || {};
  const seenIn = (s, k) => !!(s && s.worlds && s.worlds.seen && s.worlds.seen[k]);
  const echoIn = (s, w) => !!(s && s.ch4 && s.ch4.echoes && s.ch4.echoes['lake.' + w]);

  // ------------------------------------------------------------ names: each language's own cast (LPTXT.CAST, LFTXT.CAST)
  const NOA = L('Noa', 'Noa', 'Noa', 'Noa', '[诺娅|Nuò yà]', 'ノア');
  const casts = () => [typeof LPTXT !== 'undefined' ? LPTXT.CAST : {}, typeof LFTXT !== 'undefined' ? LFTXT.CAST : {}];
  const nameOf = (T, l = lang()) => M0.nameOf(T, l);
  const enName = (T, l) => M0.enName(T, l);
  const fillMimo = (t, l = lang()) => M0.fillMimo(t, l);
  function fillEn(t, l = lang()) {
    let s = String(t || '');
    for (const C of casts()) s = s.replace(/\{([a-z]+)\}/g, (m, k) => (C[k] ? enName(C[k], l) : m));
    return s.replace(/\{mimo\}/g, mimoName()).replace(/(^|[.!?]\s+)([a-z])/g, (m, a, b) => a + b.toUpperCase());
  }
  const enOf = (T, l) => (T && (T['en_' + l] || T.en)) || '';

  // ------------------------------------------------------------ the words (about 100 per world): registered in Mimo's memory
  // (LEX, like caves.js), each introduced (seen, and let into the weave) the moment the line that uses it is said, and listed in
  // the journal. Table rows: en ~ es ~ pt ~ de ~ zh ~ ja ~ the key of the line, demonstration or Look that teaches it.
  const ARTS = { es: { el: 'm', la: 'f', los: 'm', las: 'f' }, pt: { o: 'm', a: 'f', os: 'm', as: 'f' }, de: { der: 'm', die: 'f', das: 'n' } };
  const WORDS = { past: [], future: [] }, BYKEY = {};
  function parseWords(src, pre, world) {
    const out = [];
    String(src || '').split('\n').map(r => r.trim()).filter(Boolean).forEach((row, i) => {
      const c = row.split('~').map(x => x.trim()); if (c.length < 7) return;
      const [en, es, pt, de, zh, ja, where] = c;
      const slug = en.toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 18) || 'w' + i;
      const it = { id: 'w.' + pre + '_' + slug, kind: 'word', en: en.replace(/\s*\(.*?\)\s*/g, ' ').trim(), enFull: en, zh, ja, g: {}, where: where.split(/\s*,\s*/), world };
      for (const [l, v] of [['es', es], ['pt', pt], ['de', de]]) {
        const m = v.match(/^(\S+)\s+(.+)$/), g = m && ARTS[l][m[1].toLowerCase()];
        if (g) { it[l] = m[2]; it.g[l] = g; } else it[l] = v;
      }
      if (!Object.keys(it.g).length) delete it.g;
      if (out.some(o => o.id === it.id)) it.id += '_' + i;
      out.push(it);
    });
    return out;
  }
  let wordsOk = false;
  function registerWords() {
    if (wordsOk || typeof LEX === 'undefined') return;
    if (typeof LPTXT !== 'undefined') WORDS.past = parseWords(LPTXT.WORDS, 'lp', 'past');
    if (typeof LFTXT !== 'undefined') WORDS.future = parseWords(LFTXT.WORDS, 'lf', 'future');
    const all = WORDS.past.concat(WORDS.future);
    LEX.register(all.filter(w => !LEX.item(w.id)));
    for (const w of all) for (const k of w.where) (BYKEY[k] || (BYKEY[k] = [])).push(w.id);
    wordsOk = true;
  }
  // a line, a demonstration or a Look is said: its words are seen, and come into the weave (story.js introduce)
  function teach(key) {
    if (!key || !wordsOk) return;
    for (const id of BYKEY[key] || []) { try { if (STORY.introduce) STORY.introduce(id); else LEX.expose(id); } catch (e) { /* */ } }
  }
  const seenWord = id => { try { const s = LEX.st ? LEX.st(id) : null; return !!(s && s.stage >= 1); } catch (e) { return false; } };
  function wordsHTML() {
    const l = lang(), cj = isCl(l) && typeof CJK !== 'undefined';
    const row = w => { const ok = seenWord(w.id); return `<li${ok ? '' : ' style="opacity:.45"'}><b>${cj ? CJK.html(w[l] || '', { lang: l }) : esc(w[l] || '')}</b> <span class="en">${esc(w.enFull || w.en)}</span>${ok ? ' ✓' : ''}</li>`; };
    const part = (k, title, note) => (WORDS[k].length ? `<h4 class="ph-h" style="margin-top:8px">${title} <small>${WORDS[k].filter(w => seenWord(w.id)).length} / ${WORDS[k].length}</small></h4><p class="note">${note}</p><ul class="ch4-words" style="columns:2;font-size:14px">${WORDS[k].map(row).join('')}</ul>` : '');
    return `<div class="mt">${part('past', 'The lake, long ago', 'The words the people of then use, and the things you can look at (✓ once you’ve heard them).')}${part('future', 'The lake, tomorrow', 'The words of the gray lake and of the promises that wake it.')}</div>`;
  }
  function addTab() {
    if (typeof UI === 'undefined') return;
    UI.journalTabs = UI.journalTabs || [];
    if (UI.journalTabs.some(t => t.id === 'lk-words')) return;
    UI.journalTabs.push({ id: 'lk-words', label: () => (G() && G().state && TIME.open('lake') && TIME.seen('lake.noa') ? 'Words of the lake' : null), html: () => wordsHTML(), wire() { /* */ } });
  }

  // ------------------------------------------------------------ saying things (mixed by the weave; a demonstration shows the marked
  // words glossed, whole in the language; the hushed keep only their *starred* words). T._k: the table key (teaches its words)
  function say(p, T) {
    if (!p || !T) return Promise.resolve();
    teach(T._k); const l = lang();
    p.lines = { en: fillEn(enOf(T, l), l), [l]: fillMimo(T[l] || '', l) };
    return STORY.sayInline(p);
  }
  function demo(p, T, marks) {
    if (!p || !T) return Promise.resolve();
    teach(T._k);
    const l = lang(), T2 = { en: fillEn(enOf(T, l), l) }; LANGS.forEach(x => { T2[x] = fillMimo(T[x] || '', x); });
    return STORY.demoLine(p, T2, marks);
  }
  function hushed(p, T) { if (!p || !T) return Promise.resolve(); teach(T._k); const l = lang(); return STORY.sayHushed ? STORY.sayHushed(p, fillMimo(T[l] || '', l), fillEn(T.en, l)) : say(p, T); }
  const think = (s, d) => STORY.think(fillEn(s), d);
  const you = s => STORY.you(fillEn(s));
  const frame2 = (p, side, dist) => M0.frame2(p, side, dist);
  // a thing to Look at: its word in the language (said aloud, glossed), and what it is
  function look(T) {
    if (!T) return;
    teach(T._k);
    const l = lang(), w = T.w ? (isCl(l) ? plainT(T.w[l] || '') : T.w[l] || '') : '';
    STORY.think(fillEn((w ? `«${w}» (${T.w.en}). ` : '') + T.t), 6);
    if (w) { try { UI.speak(UI.sayText(T.w[l] || '')); } catch (e) { /* (no voice on this computer) */ } }
  }
  // the pattern cards (MOLT's card: the grammar point, shown once, then again on request)
  const card = (C, fut) => M0.card(C, fut);
  // one task, asked until it's said (or you close the box): the frame and the chips on the box, the model on «?» (MOLT.ask's,
  // with this region's names in the title). o: { icon, tips, title, hint, onMiss(g, misses), check(text) → a grade or null }
  async function ask(T, o = {}) {
    const lg = lang(), tips = o.tips || {};
    const frame = plainT(fillMimo((T.frame || {})[lg] || '', lg)), chips = ((T.chips || {})[lg] || []).map(([w, e]) => `${plainT(fillMimo(w, lg))} (${e})`).join(' · ');
    const modelRaw = fillMimo((T.model || {})[lg] || '', lg), model = plainT(modelRaw);
    let misses = 0;
    for (;;) {
      const r = await UI.command({ name: mimoName(), icon: o.icon || 'star', title: fillEn(o.title || T.title, lg), verbs: [], model: modelRaw, modelEn: fillEn((T.model || {}).en || '', lg), placeholder: `«${frame}»`,
        hint: `«${frame}»${chips ? ' · ___ = ' + chips : ''}. ${o.hint ? fillEn(o.hint) + ' ' : ''}Stuck? ? shows the whole sentence.` });
      if (!r || r.cancelled) return null;
      const h = document.getElementById('command-hint'), peeked = !!(h && /^Try/.test(h.textContent || ''));
      const g = (o.check && o.check(r.text, lg)) || M0.grade(T, r.text, lg, tips);
      if (g.why && isCl(lg)) g.why = String(g.why).replace(/«([^»]*)»/g, (m, x) => '«' + plainT(x) + '»');      // (a tip's «{form}» comes in the notation)
      if (g.ok) {
        const letter = down(g.letter, misses + (peeked ? 2 : 0)), why = g.why === 'Just right!' && (misses || peeked) ? (peeked ? 'Right, with the example' : 'Right, on another try') : g.why;
        UI.toast(`${letter} · ${fillEn(why || 'Right!')}${g.tip ? ' · ' + g.tip : ''}`); snd(letter === 'S' ? 'chest' : 'review');      // (g.tip: an accent tip, P6a)
        return { letter, text: r.text, ms: r.ms, kind: g.kind };
      }
      misses++; snd('wrong'); try { G().sim.mimo.tiltT = 1.4; } catch (e) { /* */ }
      if (o.onMiss) { try { await o.onMiss(g, misses); } catch (e) { /* */ } }
      think(g.kind !== 'none' && g.why ? g.why : misses >= 2 ? `Like this: «${model}»` : `Not quite… «${frame}»${chips ? ' · ' + chips : ''}`, 6.5);
    }
  }

  // ------------------------------------------------------------ the people TIME builds (TIME.people), by world and id
  function person(w, id) {
    const list = TIME.people && TIME.people.all['lake:' + w]; if (!list) return null;
    const P = list.find(q => q.def.id === id); if (!P) return null;
    P.api.name = nameOf(P.def.name); return P;
  }
  const who = (w, id) => { const P = person(w, id); return P ? P.api : null; };
  // people who stand on the piers and docks (TIME's kit stands everyone on the ground: under the water there)
  function liftPeople(w, defs) {
    const list = TIME.people && TIME.people.all['lake:' + w]; if (!list) return;
    for (const P of list) { const d = defs.find(x => x.id === P.def.id), y = d && d.at && d.at.y; if (y == null) continue; P.g.position.y = y; P.api.y = y; }
  }

  // ------------------------------------------------------------ Noa, through the crack in Remanso's square (DESIGN.md 18.5)
  const TXT = {
    'noa.open1': L('It’s me, Noa. Can you hear me? The crack in Remanso’s square carries my voice now.',
      'Soy yo, Noa. ¿Me oyes? La grieta de la plaza de Remanso lleva mi voz ahora.',
      'Sou eu, a Noa. Você me ouve? A fenda da praça de Remanso leva a minha voz agora.',
      'Ich bin’s, Noa. Hörst du mich? Der Riss auf Remansos Platz trägt jetzt meine Stimme.',
      '[是|shì] [我|wǒ] ， [诺娅|Nuò yà] 。 [你|nǐ] [听得见|tīng de jiàn] [吗|ma] ？ [静水村|Jìng shuǐ cūn] [广场|guǎng chǎng] [上|shàng] [的|de] [裂缝|liè fèng] [现在|xiàn zài] [传|chuán] [来|lái] [我|wǒ] [的|de] [声音|shēng yīn] 。',
      'わたし 、 ノア だ よ 。 [聞|き]こえる ？ レマンソ の [広場|ひろば] の [裂|さ]け[目|め] が 、 [今|いま] は わたし の [声|こえ] を [運|はこ]んで くれる の 。'),
    'noa.open2': L('Two more of Elio’s echoes are here: one in the lake long ago, one in the lake tomorrow.',
      'Aquí hay dos ecos más de Elio: uno en el lago de antes, otro en el lago de mañana.',
      'Aqui tem mais dois ecos do Elio: um no lago de antigamente, outro no lago de amanhã.',
      'Hier sind noch zwei Echos von Elio: eins im See von früher, eins im See von morgen.',
      '[这里|zhè lǐ] [还有|hái yǒu] [艾利欧|Ài lì ōu] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] ： [一|yī] [个|gè] [在|zài] [从前|cóng qián] [的|de] [湖|hú] ， [一|yī] [个|gè] [在|zài] [明天|míng tiān] [的|de] [湖|hú] 。',
      'ここ に は 、 エリオ の こだま が あと [二|ふた]つ ある 。 [昔|むかし] の [湖|みずうみ] に [一|ひと]つ 、 [明日|あした] の [湖|みずうみ] に [一|ひと]つ 。'),
    'noa.open3': L('Long ago, one winter, the lake was low, and a boy hid on a little island while his dad called for him. Step into the Past: the ferryman at the ferry dock will remember. Through the crack on the south beach, or this one.',
      'Hace mucho, un invierno, el lago estaba bajo, y un niño se escondió en una isla chica mientras su papá lo llamaba. Entra en el Ayer: el barquero, en el muelle del ferry, lo recordará. Por la grieta de la playa sur, o por esta.',
      'Há muito tempo, num inverno, o lago estava baixo, e um menino se escondeu numa ilhota enquanto o pai chamava por ele. Entra no Ontem: o barqueiro, no cais da balsa, vai se lembrar. Pela fenda da praia do sul, ou por esta.',
      'Vor langer Zeit, in einem Winter, war der See niedrig, und ein Junge hat sich auf einer kleinen Insel versteckt, während sein Papa nach ihm rief. Geh ins Gestern: Der Fährmann am Fähranleger wird sich erinnern. Durch den Riss am Südstrand oder durch diesen hier.',
      '[很久|hěn jiǔ] [以前|yǐ qián] [的|de] [一个|yī gè] [冬天|dōng tiān] ， [湖水|hú shuǐ] [很|hěn] [低|dī] 。 [一个|yī gè] [男孩|nán hái] [躲|duǒ] [在|zài] [小岛|xiǎo dǎo] [上|shàng] ， [他|tā] [爸爸|bà ba] [在|zài] [岸边|àn biān] [喊|hǎn] [他|tā] 。 [去|qù] [昨天|zuó tiān] [吧|ba] ： [渡船|dù chuán] [码头|mǎ tóu] [的|de] [船夫|chuán fū] [会|huì] [记得|jì de] 。 [从|cóng] [南边|nán biān] [沙滩|shā tān] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      'ずっと [昔|むかし] の ある [冬|ふゆ] 、 [湖|みずうみ] の [水|みず] が [低|ひく]かった 。 [男|おとこ] の [子|こ] が [小島|こじま] に [隠|かく]れて 、 お[父|とう]さん が その [子|こ] を [呼|よ]んで いた の 。 [昨日|きのう] へ [行|い]って 。 フェリー の [桟橋|さんばし] の [船頭|せんどう] さん が [覚|おぼ]えて いる はず 。 [南|みなみ] の [浜|はま] の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から 。'),
    'noa.past1': L('His voice… calling his dad. He wanted to say it so much. Now it’s said.',
      'Su voz… llamando a su papá. Tenía tantas ganas de decirlo. Ahora ya está dicho.',
      'A voz dele… chamando o pai. Ele queria tanto dizer isso. Agora está dito.',
      'Seine Stimme … er ruft seinen Papa. Er wollte es so gern sagen. Jetzt ist es gesagt.',
      '[他|tā] [的|de] [声音|shēng yīn] … [在|zài] [叫|jiào] [他|tā] [爸爸|bà ba] 。 [他|tā] [多么|duō me] [想|xiǎng] [说|shuō] [出来|chū lai] 。 [现在|xiàn zài] [终于|zhōng yú] [说|shuō] [出来|chū lai] [了|le] 。',
      'かれ の [声|こえ] … お[父|とう]さん を [呼|よ]んで いる 。 [本当|ほんとう] に [言|い]いたかった ん だ ね 。 やっと [言|い]えた 。'),
    'noa.past2': L('Now tomorrow. In the Future the lake has gone gray and still, and nobody crosses it any more. Someone still talks, by the old ferry. Go through the crack on the road, or this one.',
      'Ahora, el mañana. En el Mañana el lago se volvió gris y quieto, y ya nadie lo cruza. Alguien sigue hablando, junto al ferry viejo. Entra por la grieta del camino, o por esta.',
      'Agora, o amanhã. No Amanhã o lago ficou cinza e parado, e ninguém mais atravessa. Alguém ainda fala, do lado da balsa velha. Entra pela fenda da estrada, ou por esta.',
      'Jetzt das Morgen. Im Morgen ist der See grau und still geworden, und niemand fährt mehr hinüber. Jemand redet noch, bei der alten Fähre. Geh durch den Riss an der Straße oder durch diesen hier.',
      '[现在|xiàn zài] [去|qù] [明天|míng tiān] 。 [在|zài] [明天|míng tiān] ， [湖|hú] [变|biàn] [得|de] [又|yòu] [灰|huī] [又|yòu] [静|jìng] ， [再|zài] [也|yě] [没有|méi yǒu] [人|rén] [过|guò] [湖|hú] 。 [旧|jiù] [渡船|dù chuán] [旁边|páng biān] [还有|hái yǒu] [人|rén] [在|zài] [说话|shuō huà] 。 [走|zǒu] [路|lù] [上|shàng] [的|de] [裂缝|liè fèng] ， [或者|huò zhě] [这|zhè] [一|yī] [道|dào] 。',
      '[次|つぎ] は [明日|あした] 。 [明日|あした] の [湖|みずうみ] は [灰色|はいいろ] で 、 [動|うご]かない 。 もう だれ も [渡|わた]らない 。 でも [古|ふる]い フェリー の そば で 、 まだ [話|はな]して いる [人|ひと] が いる 。 [道|みち] の [裂|さ]け[目|め] か 、 この [裂|さ]け[目|め] から [行|い]って 。'),
    'noa.fut1': L('Next time he’ll tell his dad where he is. He will, I know it.',
      'La próxima vez le dirá a su papá dónde está. Lo hará, lo sé.',
      'Da próxima vez ele vai dizer ao pai onde está. Ele vai, eu sei.',
      'Nächstes Mal wird er seinem Papa sagen, wo er ist. Das wird er, ich weiß es.',
      '[下|xià] [次|cì] ， [他|tā] [会|huì] [告诉|gào su] [爸爸|bà ba] [他|tā] [在|zài] [哪里|nǎ lǐ] 。 [他|tā] [会|huì] [的|de] ， [我|wǒ] [知道|zhī dào] 。',
      '[今度|こんど] は 、 お[父|とう]さん に どこ に いる か [言|い]う よ 。 きっと [言|い]う 。 わたし に は わかる 。'),
    'noa.fut2': L('That’s both of the lake’s echoes. The next cracks will open in the Quarry Caves, up north… I’ll call you when they do.',
      'Ya tienes los dos ecos del lago. Las próximas grietas se abrirán en las Cuevas de la Cantera, al norte… Te llamaré cuando se abran.',
      'Você já tem os dois ecos do lago. As próximas fendas vão se abrir nas Cavernas da Pedreira, lá no norte… Eu te chamo quando abrirem.',
      'Das sind beide Echos des Sees. Die nächsten Risse öffnen sich in den Steinbruchhöhlen im Norden … Ich rufe dich, wenn es so weit ist.',
      '[湖|hú] [的|de] [两|liǎng] [个|gè] [回声|huí shēng] [都|dōu] [找到|zhǎo dào] [了|le] 。 [下|xià] [一|yī] [道|dào] [裂缝|liè fèng] [会|huì] [在|zài] [北边|běi biān] [的|de] [采石场|cǎi shí chǎng] [洞穴|dòng xué] [打开|dǎ kāi] … [到|dào] [时候|shí hou] [我|wǒ] [会|huì] [叫|jiào] [你|nǐ] 。',
      'これ で [湖|みずうみ] の こだま は [二|ふた]つ と も そろった 。 [次|つぎ] の [裂|さ]け[目|め] は 、 [北|きた] の [採石場|さいせきじょう] の [洞窟|どうくつ] で [開|ひら]く … その とき は [呼|よ]ぶ ね 。'),
  };
  Object.entries(TXT).forEach(([k, T]) => { T._k = k; });
  // Elio's echoes here (CH4.word): the Past's, what the boy couldn't call out; the Future's, what the man would still like to say
  const ECHO = {
    past: L('Dad, I’m here!', '¡Papá, estoy aquí!', 'Pai, eu estou aqui!', 'Papa, ich bin hier!', '[爸爸|bà ba] ， [我|wǒ] [在|zài] [这里|zhè lǐ] ！', 'お[父|とう]さん 、 ぼく 、 ここ に いる よ ！', { where: 'the Mirror Lake, long ago' }),
    future: L('Dad, next time I’ll tell you where I am.', 'Papá, la próxima vez te diré dónde estoy.', 'Pai, da próxima vez eu te direi onde estou.', 'Papa, nächstes Mal werde ich dir sagen, wo ich bin.',
      '[爸爸|bà ba] ， [下|xià] [次|cì] [我|wǒ] [会|huì] [告诉|gào su] [你|nǐ] [我|wǒ] [在|zài] [哪里|nǎ lǐ] 。', 'お[父|とう]さん 、 [今度|こんど] は どこ に いる か ちゃんと [言|い]う よ 。', { where: 'the Mirror Lake, tomorrow' }),
  };
  if (typeof CH4 !== 'undefined') { CH4.word('lake', 'past', ECHO.past); CH4.word('lake', 'future', ECHO.future); }

  // Noa's voice comes out of the crack: it flares while she talks, and her name tag is hers
  let flare = 0;
  function noaP() { const c = CRACK.square, y = gy(c.x, c.z); return { id: 'noa', name: nameOf(NOA), x: c.x, y: y + 0.3, z: c.z, top: 2.5, talking: false }; }
  async function noaSay(key) { flare = 1; snd('chime'); const p = noaP(); try { G().w3d.fx.sparkle(p.x, p.y + 1.4, p.z, 12, ['#bfe4ff', '#fff3c8', '#9ff5e8']); } catch (e) { /* */ } await say(p, TXT[key]); }
  function lookCrack() { const c = CRACK.square, y = gy(c.x, c.z), Y = G().sim.you, dx = Y.x - c.x, dz = Y.z - c.z, d = Math.hypot(dx, dz) || 1; shot(V(c.x + dx / d * 5.2 + dz / d * 2.4, y + 2.4, c.z + dz / d * 5.2 - dx / d * 2.4), V(c.x, y + 1.5, c.z), 1.0); }
  // the crack card's examples, each language's own: I went, did you come?, I'll have, I'll come
  const CRACK_EX = { es: ['fui', '¿viniste?', 'tendré', 'vendré'], pt: ['fui', 'você veio?', 'terei', 'virei'], de: ['ich bin gegangen', 'ich war', 'ich werde kommen', 'ich werde haben'],
    zh: ['[我|wǒ] [来|lái] [了|le]', '[你|nǐ] [去|qù] [过|guo] [吗|ma] ？', '[我|wǒ] [会|huì] [来|lái]', '[我|wǒ] [打算|dǎ suàn] [去|qù]'], ja: ['[行|い]った', '[来|き]た', '[来|く]る [予定|よてい] です', 'でしょう'] };
  async function crackCard() {
    M0.css();
    const l = lang(), nm = w => { const t = TIME.RULES[w].name[l] || TIME.RULES[w].name.en; return isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t); };
    const ex = (CRACK_EX[l] || CRACK_EX.es).map(t => (isCl(l) && typeof CJK !== 'undefined' ? CJK.html(t, { lang: l }) : esc(t)));
    await UI.card(`<div class="tag">The lake’s time cracks</div><div class="rows">`
      + `• On the <b>south beach</b>: today ↔ «${nm('past')}», the lake about 40 years ago, one low winter.<br>`
      + `• On the <b>road into Remanso</b>: today ↔ «${nm('future')}», the lake if nobody speaks up.<br>`
      + `• Here, in <b>Remanso’s square</b>: all three. Noa’s voice comes through this one: report to her here.<br>`
      + `Long ago, the verbs you’ll need are the irregular ones («${ex[0]}», «${ex[1]}»). Tomorrow, their futures are irregular too («${ex[2]}», «${ex[3]}»).</div><div class="sub">E</div>`, { kind: 'mol-card' });
  }
  async function noaOpen() {
    lock(true);
    try {
      lookCrack(); await wait(0.9);
      await noaSay('noa.open1'); await noaSay('noa.open2'); await noaSay('noa.open3');
      flare = 0; await crackCard();
      TIME.seen('lake.noa', true); G().save();
    } finally { flare = 0; lock(false); }
    think('Into the Past, to the ferryman at the ferry dock. The crack on the south beach leads there, and so does this one.', 6);
  }
  async function reportPast() {
    lock(true);
    try { lookCrack(); await wait(0.6); await noaSay('noa.past1'); await noaSay('noa.past2'); st('past').reported = true; G().save(); } finally { flare = 0; lock(false); }
    think('Next: the lake tomorrow. The crack on the road into Remanso leads there.', 5);
  }
  async function reportFuture() {
    lock(true);
    try {
      lookCrack(); await wait(0.6); await noaSay('noa.fut1'); await noaSay('noa.fut2'); st('future').reported = true;
      try { if (typeof QUESTS !== 'undefined' && QUESTS.tick) QUESTS.tick(); } catch (e) { /* */ }
      G().save();
    } finally { flare = 0; lock(false); }
  }

  // ------------------------------------------------------------ the land the lake covers today: the sandbar and the little island
  // with its grotto (long ago: dry, sandy, reeds; tomorrow: gray, the bay drained round it). One merged mesh and hull per world.
  const LAND = {};
  const plat = { bar: { seg: [OFF, OFF, OFF + 1, OFF], w: BAR.w, y: [0.5, 0.42] }, isl: { box: [OFF, OFF + 1, OFF, OFF + 1], top: 0.42 }, mud: { box: [OFF, OFF + 1, OFF, OFF + 1], top: -0.22 } };
  let platOk = false;
  function platforms(kind) {
    if (!platOk) { WORLD.addPlatforms([plat.bar, plat.isl, plat.mud]); platOk = true; }
    const on = kind === 'past' || kind === 'future';
    plat.bar.seg = on ? [BAR.a.x, BAR.a.z, BAR.b.x, BAR.b.z] : [OFF, OFF, OFF + 1, OFF];
    plat.isl.box = on ? [ISL.x - ISL.r, ISL.x + ISL.r, ISL.z - ISL.r, ISL.z + ISL.r] : [OFF, OFF + 1, OFF, OFF + 1];
    plat.mud.box = kind === 'future' ? [MUD.x0, MUD.x1, MUD.z0, MUD.z1] : [OFF, OFF + 1, OFF, OFF + 1];
    plat.mud.top = -0.22; plat.isl.top = kind === 'future' ? 0.3 : 0.42;
  }
  const isleIn = (x, z) => Math.hypot(x - ISL.x, z - ISL.z) < ISL.r - 0.3;
  // keep you on the land (the platforms are squares and a band: the island is round)
  function keepOnLand() {
    const g = G(), Y = g && g.sim.you; if (!Y) return;
    const dI = Math.hypot(Y.x - ISL.x, Y.z - ISL.z);
    if (dI < ISL.r + 0.6 && dI > ISL.r - 0.35 && TIME.world() === 'past') { const k = (ISL.r - 0.35) / dI; Y.x = ISL.x + (Y.x - ISL.x) * k; Y.z = ISL.z + (Y.z - ISL.z) * k; }
  }
  function buildLand(kind) {
    if (LAND[kind]) return LAND[kind];
    const g = new THREE.Group(); g.name = 'lake-land-' + kind; g.visible = false;
    const k = PAST.API.Kit(), KG = PAST.API.KG, past = kind === 'past';
    const sand = past ? '#d9c79a' : '#8f8c94', sand2 = past ? '#cbb88a' : '#86838c', wet = past ? '#a88f66' : '#77747e', stone = past ? '#9a9488' : '#7d7a84', reed = past ? '#9a9a4a' : '#7f8076';
    // the sandbar: a long low bank with a wet rim
    const dx = BAR.b.x - BAR.a.x, dz = BAR.b.z - BAR.a.z, len = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
    for (let i = 0; i <= 8; i++) { const t = i / 8, x = BAR.a.x + dx * t, z = BAR.a.z + dz * t, y = lerp(0.5, 0.42, t);
      k.add(KG.sphere, x, y - 0.55, z, 2.0, 0.55, len / 7, i % 2 ? sand : sand2, { ry, ink: 0.004 }).add(KG.sphere, x, y - 0.75, z, 2.5, 0.5, len / 6.5, wet, { ry, ink: 0 }); }
    // the island: a round mound, a rim of wet sand, rocks, the grotto's arch facing the sandbar
    k.add(KG.sphere, ISL.x, 0.42 - 1.2, ISL.z, ISL.r + 0.6, 1.2, ISL.r + 0.6, sand, { ink: 0.006 }).add(KG.sphere, ISL.x, 0.42 - 1.45, ISL.z, ISL.r + 1.6, 1.2, ISL.r + 1.6, wet, { ink: 0 });
    k.add(KG.sphere, ISL.x - 1.6, 1.4, ISL.z + 1.6, 3.2, 2.6, 2.6, stone, { ry: 0.6, ink: 0.012 }).add(KG.sphere, ISL.x - 2.8, 1.0, ISL.z - 0.8, 2.0, 1.8, 2.2, stone, { ry: 1.2, ink: 0.012 });
    const ax = ARCH.x, az = ARCH.z, c = Math.cos(ARCH.yaw), s = Math.sin(ARCH.yaw), at = (lx, lz) => [ax + lx * c + lz * s, az - lx * s + lz * c];
    for (const sx of [-1, 1]) { const [px, pz] = at(sx * 1.05, 0); k.box(px, 1.4, pz, 0.6, 2.4, 0.7, stone, { ry: ARCH.yaw, ink: 0.012 }); }
    { const [px, pz] = at(0, 0); k.box(px, 2.75, pz, 2.8, 0.5, 0.75, stone, { ry: ARCH.yaw, ink: 0.012 }); k.box(px, 1.25, pz - 0.1 * 0, 1.5, 2.3, 0.08, '#1b1612', { ry: ARCH.yaw, ink: 0 }); }
    // reeds round the island and along the bar (long ago, green-gold; tomorrow, dry and gray)
    for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + (i % 3) * 0.2, r = ISL.r - 0.2 + (i % 2) * 0.5, x = ISL.x + Math.cos(a) * r, z = ISL.z + Math.sin(a) * r;
      if (Math.hypot(x - ax, z - az) < 2.2) continue; const h = past ? 1.3 + (i % 4) * 0.25 : 0.7 + (i % 3) * 0.2;
      k.rod([x, 0.2, z], [x + Math.sin(i) * 0.15, 0.2 + h, z + Math.cos(i) * 0.15], 0.03, reed, 0).add(KG.cone, x, 0.2 + h, z, 0.05, 0.25, 0.05, past ? '#8a6a3a' : '#6e6a62', { ink: 0 }); }
    if (!past) {
      // the drained bay: gray mud with cracks, puddles, an old post, a rowboat lying on its side
      const mx = (MUD.x0 + MUD.x1) / 2, mz = (MUD.z0 + MUD.z1) / 2;
      k.box(mx, -0.3, mz, MUD.x1 - MUD.x0, 0.12, MUD.z1 - MUD.z0, '#8a8790', { ink: 0 });
      const R = (() => { let q = 91; return () => ((q = (q * 16807) % 2147483647) / 2147483647); })();
      for (let i = 0; i < 40; i++) { const x = lerp(MUD.x0 + 1, MUD.x1 - 1, R()), z = lerp(MUD.z0 + 1, MUD.z1 - 1, R()); if (isleIn(x, z)) continue; k.box(x, -0.235, z, 0.06, 0.01, 1.2 + R() * 2.2, '#5e5b66', { ry: R() * 3, ink: 0 }); }
      for (let i = 0; i < 9; i++) { const x = lerp(MUD.x0 + 2, MUD.x1 - 2, R()), z = lerp(MUD.z0 + 2, MUD.z1 - 2, R()); if (isleIn(x, z) || Math.hypot(x - ISL.x, z - ISL.z) < ISL.r + 1.5) continue; k.add(KG.sphere, x, -0.235, z, 0.8 + R(), 0.01, 0.6 + R() * 0.6, '#9fa4b0', { ry: R() * 3, ink: 0 }); }
      k.add(KG.cyl, -191.6, 0.6, -133.4, 0.14, 1.8, 0.14, '#6f6a62', { rz: 0.2 });
      k.add(PAST.API.KG.half, -208.6, -0.2, -144.2, 1.1, 0.5, 2.2, '#7a7670', { rz: 1.2, ry: 0.4 });
    }
    k.build(g); G().w3d.scene.add(g);
    return (LAND[kind] = g);
  }
  // today: just the top of the old arch, a hand's width above the water, moss on it
  TIME.effect('lake.archTop', { region: 'lake', when: () => TIME.open('lake'), show: { now: () => {
    const g = new THREE.Group(), k = PAST.API.Kit(), c = Math.cos(ARCH.yaw), s = Math.sin(ARCH.yaw);
    k.box(ARCH.x, -0.32, ARCH.z, 2.8, 0.36, 0.75, '#8a8a7a', { ry: ARCH.yaw, ink: 0.012 }).box(ARCH.x + 0.3 * c, -0.12, ARCH.z - 0.3 * s, 1.2, 0.06, 0.5, '#6f8a4a', { ry: ARCH.yaw, ink: 0 });
    k.build(g); g.name = 'lake-archtop'; return g;
  } } });
  // the lake's water plane (world3d.js), lowered long ago: that winter the lake was low
  let waterP = null, waterY0 = null;
  function waterPlane() {
    if (waterP !== null) return waterP || null;
    waterP = false;
    try { const Lw = WORLD.L.water; for (const o of G().w3d.scene.children) if (o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry' && Math.abs(o.position.y - Lw) < 0.01 && o.position.x < -170 && o.geometry.parameters.width > 60) { waterP = o; waterY0 = o.position.y; break; } } catch (e) { waterP = false; }
    return waterP || null;
  }
  function landOn(kind) {
    for (const k of ['past', 'future']) { const g = LAND[k] || (k === kind ? buildLand(k) : null); if (g) g.visible = k === kind; }
    platforms(kind);
    const w = waterPlane(); if (w) w.position.y = kind === 'past' ? waterY0 - 0.55 : waterY0;
  }

  // ------------------------------------------------------------ the grottoes' rooms are the dungeon kit's (MOLMILL, molinar_past_mill.js:
  // a house's plaster walls, beams and windows). The lake's own rooms turn them to rock in their build (the kit is shared, so
  // nothing changes for anyone else's): the walls get a rock texture, the beams and windows go, and rock slabs line the three
  // walls the camera sees, up to the top in an uneven line. pal: 'past' (green-gray, moss) or 'future' (gray, a tide line)
  const PAL = { past: { base: '#5f6a5a', a: '#56614f', b: '#6b7664', c: '#4d5747', crack: '#2f3a2c', moss: '#6f8a4a', rock: ['#5e6a5c', '#687466', '#56614f'] },
    future: { base: '#6e6b74', a: '#625f6a', b: '#7a7782', c: '#58555f', crack: '#3a3842', tide: '#8f8c98', rock: ['#6e6b74', '#79767f', '#64616b'] } };
  const ROCK = {};
  function rockMat(kind) {
    if (ROCK[kind]) return ROCK[kind];
    const P = PAL[kind], t = TK.canvasTex(256, 256, c => {
      c.fillStyle = P.base; c.fillRect(0, 0, 256, 256);
      const R = (() => { let q = 7; return () => ((q = (q * 16807) % 2147483647) / 2147483647); })();
      for (let i = 0; i < 46; i++) { const x = R() * 256, y = R() * 256, w = 22 + R() * 46, h = 14 + R() * 30; c.fillStyle = [P.a, P.b, P.c][i % 3]; c.beginPath(); c.moveTo(x, y); c.lineTo(x + w * 0.6, y - h * 0.3); c.lineTo(x + w, y + h * 0.4); c.lineTo(x + w * 0.5, y + h); c.lineTo(x - w * 0.1, y + h * 0.6); c.closePath(); c.fill(); }
      c.strokeStyle = P.crack; c.lineWidth = 2; for (let i = 0; i < 14; i++) { let x = R() * 256, y = R() * 256; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (R() - 0.5) * 40; y += R() * 30; c.lineTo(x, y); } c.stroke(); }
      if (P.moss) { c.fillStyle = P.moss; for (let i = 0; i < 18; i++) c.fillRect(R() * 256, 150 + R() * 90, 10 + R() * 30, 3 + R() * 6); }
      if (P.tide) { c.fillStyle = P.tide; c.fillRect(0, 118, 256, 5); c.fillRect(0, 126, 256, 2); }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.5, 1);
    return (ROCK[kind] = new THREE.MeshToonMaterial({ map: t, gradientMap: TK.grad }));
  }
  // the floor: flat stones and grit (long ago), cracked gray mud (tomorrow)
  function groundMat(kind) {
    const key = kind + ':ground'; if (ROCK[key]) return ROCK[key];
    const P = PAL[kind], t = TK.canvasTex(256, 256, c => {
      const R = (() => { let q = 29; return () => ((q = (q * 16807) % 2147483647) / 2147483647); })();
      c.fillStyle = kind === 'past' ? '#767d6e' : '#86838c'; c.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 60; i++) { const x = R() * 256, y = R() * 256, r = 6 + R() * 16; c.fillStyle = [P.a, P.b, kind === 'past' ? '#80887a' : '#918e97'][i % 3]; c.beginPath(); c.ellipse(x, y, r, r * (0.5 + R() * 0.4), R() * 3, 0, TAU); c.fill(); }
      c.strokeStyle = P.crack; c.lineWidth = kind === 'past' ? 1 : 2; for (let i = 0; i < (kind === 'past' ? 6 : 16); i++) { let x = R() * 256, y = R() * 256; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (R() - 0.5) * 50; y += (R() - 0.5) * 50; c.lineTo(x, y); } c.stroke(); }
      c.fillStyle = 'rgba(30,30,36,0.25)'; for (let i = 0; i < 90; i++) c.fillRect(R() * 256, R() * 256, 2, 2);
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
    return (ROCK[key] = new THREE.MeshToonMaterial({ map: t, gradientMap: TK.grad }));
  }
  function caveShell(room, api, kind, k) {
    const WH = api.WH, mat = rockMat(kind), P = PAL[kind];
    for (const m of room.g.children.slice()) {
      if (!m.isMesh || !m.geometry) continue;
      const ty = m.geometry.type, p = m.geometry.parameters || {};
      if (ty === 'BoxGeometry') { m.material = groundMat(kind); continue; }                                        // the floor: stone, mud
      if (ty === 'PlaneGeometry' && Math.abs(p.height - WH) < 0.01) { m.material = mat; continue; }                    // the walls: rock
      if (ty === 'PlaneGeometry' && Math.abs(p.width - 2.2) < 0.01 && Math.abs(p.height - 1.2) < 0.01) continue;      // (the way out)
      m.visible = false;                                                                                           // windows, beams, their ink
    }
    if (!k) return;
    const R = room.R, Y0 = api.Y0, HW = 7, HD = 6, KG = PAST.API.KG;
    const rnd = (() => { let q = 11 + room.i * 7; return () => ((q = (q * 16807) % 2147483647) / 2147483647); })();
    const slab = (x, z, ry) => { let y = 0; while (y < WH - 0.3) { const h = 0.9 + rnd() * 1.1, w = 0.8 + rnd() * 0.5; k.add(KG.sphere, x + (rnd() - 0.5) * 0.3, Y0 + y + h * 0.5, z, w, h * 0.62, 0.42 + rnd() * 0.25, P.rock[Math.floor(rnd() * 3)], { ry, ink: 0.01 }); y += h * (0.7 + rnd() * 0.2); } };
    for (let x = -HW + 0.7; x <= HW - 0.6; x += 1.25) slab(R.x + x, R.z - HD + 0.3, 0);                                  // the back wall
    for (let z = -HD + 0.7; z <= HD - 1.2; z += 1.25) { slab(R.x - HW + 0.3, R.z + z, Math.PI / 2); slab(R.x + HW - 0.3, R.z + z, Math.PI / 2); }   // the sides
    for (let x = -HW + 0.9; x <= HW - 0.9; x += 1.7) if (Math.abs(x) > 1.6) k.add(KG.sphere, R.x + x, Y0 + 0.3, R.z + HD - 0.3, 0.8, 0.4, 0.4, P.rock[Math.floor(rnd() * 3)], { ink: 0.008 });   // (the front: low)
    // (so you don't walk into the rock: its face is about 0.6 in from the old walls)
    WORLD.extra.push({ obox: 1, x: R.x, z: R.z - HD + 0.3, hw: HW, hd: 0.3, rot: 0 }, { obox: 1, x: R.x - HW + 0.3, z: R.z, hw: 0.3, hd: HD, rot: 0 }, { obox: 1, x: R.x + HW - 0.3, z: R.z, hw: 0.3, hd: HD, rot: 0 });
  }

  // ------------------------------------------------------------ today's lake, set aside in another world: its people (one instanced rig:
  // a person whose root is hidden is drawn at zero size), the ferry, the ducks; their solids parked; the side modules' things near
  let ownOk = false;
  function hideToday(api, o = {}) {
    const lk = G().lake; if (!lk) return;
    if (!ownOk) { for (const p of lk.people || []) if (p._R && p._R.root) p._R.root.traverse(n => { n.userData.own = true; }); for (const d of (lk.objects && lk.objects.ducks) || []) d.traverse(n => { n.userData.own = true; }); ownOk = true; }
    for (const p of lk.people || []) if (p._R && p._R.root) api.hide(p._R.root);
    if (lk.objects) { if (lk.objects.ferry) api.hide(lk.objects.ferry); if (o.ducks) (lk.objects.ducks || []).forEach(d => api.hide(d)); if (o.boats && lk.objects.rowBoat) api.hide(lk.objects.rowBoat); }
    for (const ob of G().w3d.scene.children) if (ob.visible && /^(read|diary|townlife|tl-|store)/i.test(ob.name || '') && Math.hypot(ob.position.x - CEN.x, ob.position.z - CEN.z) < 70) api.hide(ob);
  }
  const parked = [];
  function parkToday(on) {
    const lk = G().lake; if (!lk) return;
    if (on) { for (const c of lk.colliders || []) if (c.npc && c.x < OFF / 2) { parked.push([c, c.x, c.z]); c.x = OFF; c.z = OFF; } }
    else { while (parked.length) { const [c, x, z] = parked.pop(); c.x = x; c.z = z; } }
  }
  // main.js hides the lake's group indoors (TIME is a room in its sense): in this region's other worlds it's shown again, and run
  let laT = 0;
  function showLake(dt) {
    const g = G(), lk = g && g.lake; if (!lk || !lk.group) return;
    const room = g.indoorMod && g.indoorMod(); if (room && room !== TIME) return;
    lk.group.visible = true; laT += dt;
    const Y = g.sim.you;
    try { lk.update(dt, laT, { x: Y.x, z: Y.z, y: Y.ry }); } catch (e) { /* */ }
    keepOnLand();
  }

  // ------------------------------------------------------------ the region: TIME dresses both worlds (lake_past.js fills DRESS.past,
  // lake_future.js DRESS.future); while you're inside a world's grotto the grotto does its own look, so `look` steps aside
  const DRESS = {
    past: { edge: 'The memory ends here… the lake of long ago is only Remanso and its bay. Let’s stay where it happened.' },
    future: { edge: 'Past here, tomorrow’s gray fog is too thick to see. Let’s turn back.', k: () => 0.12 },
  };
  Object.defineProperty(DRESS.past, 'look', { get: () => (typeof LK_PGROT !== 'undefined' && LK_PGROT && LK_PGROT.inside ? null : 'past'), enumerable: true, configurable: true });
  Object.defineProperty(DRESS.future, 'look', { get: () => (typeof LK_FGROT !== 'undefined' && LK_FGROT && LK_FGROT.inside ? null : 'future'), enumerable: true, configurable: true });
  Object.assign(TIME.STEPS, { pretIrr: 'irregular preterites (fui, hice, tuve, estuve, dije, vine, pude)', futIrr: 'irregular futures (tendré, haré, podré, saldré, vendré, diré)' });
  const songOf = w => () => {
    if (w === 'past') return typeof LK_PAST !== 'undefined' && LK_PAST && LK_PAST.song ? LK_PAST.song() : 'past';
    return typeof LK_FUT !== 'undefined' && LK_FUT && LK_FUT.song ? LK_FUT.song() : 'future';
  };
  TIME.region('lake', {
    name: { now: 'the Mirror Lake', past: 'the Mirror Lake, long ago', future: 'the Mirror Lake · tomorrow' },
    color: { past: '#c98a3a', future: '#6f6b84' },
    center: CEN, radius: RAD,
    inside: (x, z) => Math.hypot(x - CEN.x, z - CEN.z) < RAD,
    open: () => (typeof CH4 !== 'undefined' ? CH4.open('lake') : false),
    grammar: { past: ['pretIrr'], future: ['futIrr'] },
    songs: { past: songOf('past'), future: songOf('future') },
    dress: DRESS,
    init: api => init(api),
    tick: (api, dt) => tick(dt),
    changed: (api, fw, tw) => {
      if (tw === 'now' || TIME.regionNow() !== 'lake') landOn(null);
      for (const Mo of [typeof LK_PAST !== 'undefined' && LK_PAST, typeof LK_FUT !== 'undefined' && LK_FUT]) if (Mo && Mo.changed) { try { Mo.changed(fw, tw); } catch (e) { console.error('[lake] changed', e); } }
    },
  });
  TIME.crack('lake.beach', { region: 'lake', x: CRACK.beach.x, z: CRACK.beach.z, worlds: ['now', 'past'] });
  TIME.crack('lake.road', { region: 'lake', x: CRACK.road.x, z: CRACK.road.z, worlds: ['now', 'future'] });
  TIME.crack('lake.square', { region: 'lake', x: CRACK.square.x, z: CRACK.square.z, worlds: ['now', 'past', 'future'] });

  function init(api) {
    registerWords(); addTab();
    // (zh / ja: every string here into the dictionary, so a hanzi or kanji answer typed with an OS IME reads right)
    if (typeof CJK !== 'undefined' && CJK.addSource) {
      for (const X of [typeof LPTXT !== 'undefined' && LPTXT, typeof LFTXT !== 'undefined' && LFTXT]) if (X) for (const k of ['CAST', 'LINES', 'DEMO', 'TASKS', 'MEM', 'PLAN', 'LOGQ', 'SEALQ', 'BOSSQ', 'FIGHT', 'NAMES', 'LOOKS']) { try { if (X[k]) CJK.addSource(X[k]); } catch (e) { /* */ } }
      try { CJK.addSource(TXT); CJK.addSource(ECHO); } catch (e) { /* */ }
    }
    for (const [Mo, tag] of [[typeof LK_PAST !== 'undefined' && LK_PAST, 'past'], [typeof LK_FUT !== 'undefined' && LK_FUT, 'future'],
      [typeof LK_PGROT !== 'undefined' && LK_PGROT, 'past grotto'], [typeof LK_FGROT !== 'undefined' && LK_FGROT, 'future grotto'], [typeof LKBOSS !== 'undefined' && LKBOSS, 'bosses']])
      if (Mo && Mo.init) { try { Mo.init(api.G, api); } catch (e) { console.error('[lake] init ' + tag, e); } }
  }

  // ------------------------------------------------------------ every frame, in any world: Noa (her first words here, the reports)
  let idle = 0;
  const busyNow = g => STORY.busy || STORY.line || g.sim.lock || g.journalOpen || g.state.teaching || TIME.busy
    || document.body.classList.contains('in-battle') || document.body.classList.contains('on-title') || (g.indoorMod && g.indoorMod() && g.indoorMod() !== TIME);
  // (TIME shows an effect in its world wherever you are: in another region's past or future, the lake's are set aside)
  const MINE = ['lake.bench', 'lake.ferry', 'lake.lanterns'];
  function guardEffects() {
    if (TIME.world() === 'now' || TIME.regionNow() === 'lake') return;
    for (const id of MINE) { const E = TIME.EFFECTS[id]; if (E) for (const P of Object.values(E.built)) if (P && P.obj && P.obj.visible) P.obj.visible = false; }
  }
  function tick(dt) {
    const g = G(); if (!g || !g.state) return;
    guardEffects();
    flare = Math.max(0, flare - dt * 0.35);
    const Mv = TIME._.VIS && TIME._.VIS['lake.square']; if (Mv && Mv.glow) { const k = 1 + flare * 0.9; Mv.glow.scale.set(3.4 * k, 4.2 * k, 1); }
    if (!TIME.open('lake') || busyNow(g)) { idle = 0; return; }
    const w = TIME.world(), Y = g.sim.you, c = CRACK.square, d = Math.hypot(Y.x - c.x, Y.z - c.z), s = g.state;
    const P = sp(s), F = sf(s);
    let run = null;
    if (w === 'now' && !TIME.seen('lake.noa') && d < 7) run = noaOpen;
    else if (d < 3.4 && (w === 'now' || TIME.regionNow() === 'lake')) {
      if (echoIn(s, 'past') && !P.reported) run = reportPast;
      else if (echoIn(s, 'future') && !F.reported && P.reported) run = reportFuture;
    }
    if (!run) { idle = 0; return; }
    if ((idle += dt) < 0.6) return;
    idle = 0; STORY.run(run);
  }

  // ------------------------------------------------------------ Chapter 4 here: the main quest's steps, in order (CH4.ORDER)
  // where the compass points: someone in the world they're in, or the crack that leads there from where you are
  function via(want, whoFn) {
    const w = TIME.world(), C = TIME.CRACKS;
    if (w === want) return whoFn ? whoFn() : null;
    const c = want === 'past' ? (w === 'future' ? C['lake.square'] : C['lake.beach'])
      : want === 'future' ? (w === 'past' ? C['lake.square'] : C['lake.road'])
      : (w === 'past' ? C['lake.beach'] : C['lake.road']);
    const nm = { past: 'the Past', future: 'the Future', now: 'today' }[want];
    return c ? { x: c.x, z: c.z, hint: `{mimo} looks at the time crack: ${nm} is through there.` } : null;
  }
  const squareT = () => ({ x: CRACK.square.x, z: CRACK.square.z, hint: '{mimo} looks at the time crack in Remanso’s square. Noa’s voice is in it.' });
  // examples inside English text (steps, quests, hints): each language's own, zh / ja in the mode's text
  const SX = {
    came: { es: ['vine', 'estuve', 'fui', 'dije'], pt: ['vim', 'estive', 'fui', 'disse'], de: ['ich bin gekommen', 'ich war', 'ich bin gegangen', 'ich habe gesagt'],
      zh: ['[我|wǒ] [来|lái] [了|le]', '[我|wǒ] [没|méi] [来|lái] [过|guo]', '[我|wǒ] [去|qù] [过|guo]', '[我|wǒ] [说|shuō] [了|le]'], ja: ['[来|き]ました', 'いました', '[行|い]った', '[言|い]った'] },
    mem: { es: ['{mimo} puso la piedra', '{mimo} fue por el túnel'], pt: ['O {mimo} pôs a pedra', 'O {mimo} foi pelo túnel'], de: ['{mimo} hat den Stein gelegt', '{mimo} ist durch den Tunnel gegangen'],
      zh: ['{mimo} [放|fàng] [了|le] [石头|shí tou]', '{mimo} [钻|zuān] [过去|guò qu] [了|le]'], ja: ['{mimo} が [石|いし] を [置|お]いた', '{mimo} が トンネル を [通|とお]った'] },
    told: { es: ['hiciste', 'dijiste', 'trajiste'], pt: ['você fez', 'você disse', 'você trouxe'], de: ['du warst', 'du hast gerufen', 'du hattest'],
      zh: ['[你|nǐ] [叫|jiào] [了|le]', '[你|nǐ] [说|shuō] [了|le]', '[你|nǐ] [拿走|ná zǒu] [了|le]'], ja: ['[鳴|な]いた', '[言|い]った', '[飲|の]んだ'] },
    wake: { es: ['vendremos', 'harás', 'tendrán', 'saldrá'], pt: ['viremos', 'você fará', 'terão', 'sairá'], de: ['wir werden kommen', 'du wirst bauen', 'sie werden haben', 'sie wird fahren'],
      zh: ['[我们|wǒ men] [会|huì] [来|lái]', '[你|nǐ] [会|huì] [做|zuò]', '[他们|tā men] [会|huì] [有|yǒu]', '[渡船|dù chuán] [会|huì] [开|kāi]'], ja: ['[来|き]ます', 'できる でしょう', '[持|も]つ でしょう', '[出|で]る [予定|よてい] です'] },
    plan: { es: ['{mimo} pondrá la tabla', '{mimo} saldrá por la ventana'], pt: ['O {mimo} porá a tábua', 'O {mimo} sairá pela janela'], de: ['{mimo} wird das Brett legen', '{mimo} wird durchs Fenster gehen'],
      zh: ['{mimo} [会|huì] [放|fàng] [木板|mù bǎn]', '{mimo} [会|huì] [从|cóng] [窗户|chuāng hu] [出去|chū qu]'], ja: ['{mimo} が [板|いた] を [置|お]く つもり', '{mimo} が [窓|まど] から [出|で]る [予定|よてい]'] },
    promise: { es: ['vendrán', 'podremos'], pt: ['virão', 'poderemos'], de: ['werden kommen', 'werden können'], zh: ['[会|huì] [来|lái]', '[能|néng] [过|guò]'], ja: ['[来|く]る でしょう', '[渡|わた]れる でしょう'] },
  };
  // «a», «b» (labels: «a» (we), «b» (you)…)
  function sx(k, labels) {
    const l = lang(), a = (SX[k] || {})[l] || (SX[k] || {}).es || [];
    return a.map((t, i) => { let s = fillMimo(t, l); if (isCl(l)) s = plainT(s); return `«${s}»` + (labels && labels[i] ? ` (${labels[i]})` : ''); }).join(', ');
  }
  const pastT = id => () => via('past', () => (typeof LK_PAST !== 'undefined' && LK_PAST ? LK_PAST.target(id) : null));
  const futT = id => () => via('future', () => (typeof LK_FUT !== 'undefined' && LK_FUT ? LK_FUT.target(id) : null));
  const askedN = s => ['mender', 'pepe', 'marina'].filter(k => sp(s).asked && sp(s).asked[k]).length;
  const PSTEPS = [
    { _tt: true, text: 'The Mirror Lake: listen to Noa at the time crack in Remanso’s square',
      why: 'Since Molinar’s two echoes came home, something shimmers in Remanso’s square. Noa’s voice is in it.',
      done: s => seenIn(s, 'lake.noa'), target: squareT, hint: '{mimo} sniffs the air in Remanso’s square. A shimmer?' },
    { _tt: true, get text() { return fillEn('In the Past: find {ferryman}, the ferryman, at the ferry dock'); },
      get why() { return fillEn('About 40 years ago, one low winter, a boy hid on a little island while his dad called for him. The ferryman will remember. Through the crack on the south beach, or the one in the square.'); },
      done: s => !!sp(s).met, target: pastT('ferryman'), hint: '{mimo} points at the ferryman, out at the end of the pier.' },
    { _tt: true, text: 'Ask the people of then about the boy ({n}/3)', n: s => askedN(s),
      get why() { return fillEn(`The net mender on the beach, the young fisherman on the pier and young Marina by the shore each saw something. Each asks about you too: answer in the past, ${sx('came')}.`); },
      done: s => askedN(s) >= 3, target: () => via('past', () => (typeof LK_PAST !== 'undefined' && LK_PAST ? LK_PAST.target('asked') : null)), hint: '{mimo} tugs your sleeve toward someone who saw the boy.' },
    { _tt: true, text: 'Walk the dry sandbar to the little island, and get through the frogs’ grotto ({n}/3)', n: s => Math.min(3, sp(s).floors || 0),
      get why() { return fillEn(`The lake is low this winter: the sandbar runs from the end of the pier to the little island. Inside, {mimo} moves only in memories, and its verbs are irregular (${sx('mem')}).`); },
      done: s => (sp(s).floors || 0) >= 3, target: pastT('door'), hint: '{mimo} looks out along the sandbar, at the little island.' },
    { _tt: true, text: 'At the throne: tell the Frog King what he did, and free Elio’s echo',
      get why() { return fillEn(`The Frog King, young and very vain, croaks all night on the boy’s island. Find him among his look-alike guards, then tell him what he did: ${sx('told')}.`); },
      done: s => echoIn(s, 'past'), target: pastT('door'), hint: '{mimo} looks at the grotto’s mouth on the little island.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack in Remanso’s square',
      why: 'Elio’s call to his dad is free. Tell Noa: her voice comes through the crack in Remanso’s square, in any of the three times.',
      done: s => !!sp(s).reported, target: squareT, hint: '{mimo} looks at the time crack in the square.' },
  ];
  const wokeN = s => ['marina', 'vicente', 'delia', 'bartolo'].filter(k => sf(s).woke && sf(s).woke[k]).length;
  const FSTEPS = [
    { _tt: true, text: 'In the Future: find Lalo by the rusted ferry',
      why: 'In the lake tomorrow everything has gone gray and still. Someone still talks, by the old ferry at the end of the pier. Through the crack on the road, or the one in the square.',
      done: s => !!sf(s).met, target: futT('lalo'), hint: '{mimo} points at someone by the rusted ferry… the only one with any color.' },
    { _tt: true, text: 'Wake the people of tomorrow: promise each what will happen ({n}/4)', n: s => wokeN(s),
      get why() { return fillEn(`They’re frozen until someone promises them a tomorrow, and these verbs’ futures are irregular. Mind who: ${sx('wake', ['we', 'you', 'they', 'it'])}.`); },
      done: s => wokeN(s) >= 4, target: () => via('future', () => (typeof LK_FUT !== 'undefined' && LK_FUT ? LK_FUT.target('frozen') : null)), hint: '{mimo} tugs your sleeve toward someone gray.' },
    { _tt: true, text: 'The drowned grotto in the drained bay: get through its rooms ({n}/3)', n: s => Math.min(3, sf(s).floors || 0),
      get why() { return fillEn(`The bay has drained round the little island: its grotto is open again, gray and drowned. Inside, {mimo} follows plans (${sx('plan')}), and the gray seals want promises.`); },
      done: s => (sf(s).floors || 0) >= 3, target: futT('door'), hint: '{mimo} looks across the gray mud, at the little island.' },
    { _tt: true, text: 'At the dry throne: outguess the Gray Toad, and free Elio’s echo',
      get why() { return fillEn(`The Gray Toad croaks dark predictions about the lake. Say where it will jump to dodge it, then promise the opposite: ${sx('promise')}.`); },
      done: s => echoIn(s, 'future'), target: futT('door'), hint: '{mimo} looks at the drowned grotto.' },
    { _tt: true, report: 'noa', text: '💬 Report to Noa at the time crack in Remanso’s square',
      why: 'Both of the lake’s echoes are free. Tell Noa, at the crack in Remanso’s square.',
      done: s => !!sf(s).reported, target: squareT, hint: '{mimo} looks at the time crack in the square.' },
  ];
  if (typeof CH4 !== 'undefined') {
    CH4.steps('lake', 'past', PSTEPS);
    CH4.steps('lake', 'future', FSTEPS);
    CH4.story('lake', [
      { when: s => seenIn(s, 'lake.noa'), text: 'Noa’s voice came through the crack in Remanso’s square: two more of Elio’s echoes are at the lake, one long ago, one tomorrow.' },
      { when: s => !!sp(s).met, text: 'Long ago, one low winter, a man called «Elio!» along the shore. His boy was on the little island, and couldn’t answer.' },
      { when: s => echoIn(s, 'past'), text: 'In the frogs’ grotto the vain Frog King gave back what he had swallowed: Elio’s call to his dad.' },
      { when: s => !!sf(s).met, text: 'Tomorrow, the lake has gone gray and still. Only Lalo still talks, by the rusted ferry.' },
      { when: s => echoIn(s, 'future'), text: 'The Gray Toad ran out of dark predictions. Elio’s voice, tomorrow: next time, he’ll tell his dad where he is.' },
    ]);
  }

  // ------------------------------------------------------------ every zh / ja string against CJK.md's rules: [] when all's well
  function check() {
    if (typeof CJK === 'undefined' || !CJK.validate) return ['no CJK'];
    const out = [], cj = s => /[぀-ヿ㐀-鿿[]/.test(s);
    const v = (s, l, where) => { if (!s || typeof s !== 'string' || !cj(s)) return; const p = CJK.validate(s.replace(/\*/g, '').replace(/\{[^}]+\}/g, l === 'zh' ? '[米莫|Mǐ mò]' : 'ミモ').replace(/___/g, l === 'zh' ? '[它|tā]' : 'それ'), l); if (p.length) out.push(`${where} (${l}): ${p.join('; ')} «${s}»`); };
    // (a card's note and the tips are English hints with an example or two inline: shown as they are, not as notation)
    const deep = (x, l, where) => { if (typeof x === 'string') v(x, l, where); else if (Array.isArray(x)) x.forEach((y, i) => deep(y, l, where + '[' + i + ']')); else if (x && typeof x === 'object') Object.entries(x).forEach(([k, y]) => { if (k !== 'note' && k !== 'cl' && k !== 'cls') deep(y, l, where + '.' + k); }); };
    const walk = (x, where) => {
      if (!x || typeof x !== 'object') return;
      if (Array.isArray(x)) { x.forEach((y, i) => walk(y, where + '[' + i + ']')); return; }
      for (const [k, y] of Object.entries(x)) { if (k === 'zh' || k === 'ja') deep(y, k, where + '.' + k); else if (k !== 'en' && !/^en_/.test(k)) walk(y, where + '.' + k); }
    };
    walk({ TXT, ECHO, NOA, CRACK_EX, SX }, 'laket');
    for (const [tag, X] of [['past', typeof LPTXT !== 'undefined' && LPTXT], ['future', typeof LFTXT !== 'undefined' && LFTXT]]) {
      if (!X) { out.push('no ' + tag + ' text'); continue; }
      for (const [k, y] of Object.entries(X)) if (!['WORDS', 'L', 'TIPS', 'TIPS_KING', 'en'].includes(k)) walk(y, tag + '.' + k);
    }
    for (const w of WORDS.past.concat(WORDS.future)) for (const l of ['zh', 'ja']) v(w[l], l, 'word ' + w.id);
    return out;
  }

  // ------------------------------------------------------------ test hooks (index.html?skip=1: the save goes to the test slot)
  // setup(o): the save after Chapter 3, Alba's and Molinar's echoes in and reported, the lake open (o.seen: Noa's first words
  // already heard), today's Bartolo talking again · near(id) · go(world, at?) · at(step) · probe(x, z) · check() · drv (MOLT's)
  function setup(o = {}) {
    M0._.t.setup();
    // (Molinar's whole path done and reported, so the main quest's next step is the lake's)
    try { M0._.t.at('future.top'); } catch (e) { /* */ }
    if (typeof CH4 !== 'undefined') { CH4._.t.give('molinar', 'past'); CH4._.t.give('molinar', 'future'); }
    M0.st('past').reported = true; M0.st('future').reported = true;
    const g = G(); Object.assign(g.state.flags, { bartoloQuest: true, bartolo: true, ferryIsle: true, isleLanded: true, lakeFree: true });
    if (o.seen !== false) TIME.seen('lake.noa', true);
    const main = typeof QUESTS !== 'undefined' && QUESTS.LIST.find(q => q.id === 'main');
    if (main && !main.steps.some(x => x.ch4 === 'lake')) {
      const i = main.steps.findIndex(x => x.ch4 === 'soon'); const add = PSTEPS.concat(FSTEPS);
      if (i >= 0) main.steps.splice(i, 0, ...add); else main.steps.push(...add);
    }
    TIME._.fast.on = true; TIME.refresh();
    return TIME.open('lake');
  }
  function near(id) {
    const c = CRACK[id] || (id === 'door' ? DOOR : id === 'bar' ? BAR.a : null); if (!c) return null;
    const g = G(), Y = g.sim.you; Y.x = c.x + (CRACK[id] ? 1.3 : 0.4); Y.z = c.z + (CRACK[id] ? 1.0 : 0.4); g.sim.snap(); g.cam.snap(Y.yaw, 0.28, 8.5);
    return { x: Y.x, z: Y.z };
  }
  async function go(w, at) { const p = at || { x: CRACK.square.x + 1.6, z: CRACK.square.z + 1.2, yaw: 0 }; const r = await TIME.go(w, { region: 'lake', at: p, quick: true }); return r && TIME.world(); }
  // put the save at a step of the lake's path (everything before it done): 'past.grot' (the grotto next), 'past.top' (its boss
  // next), 'future' (the Past reported), 'future.grot', 'future.top'
  function at(step) {
    const P = st('past'), F = st('future'), pg = P.grot || (P.grot = {}), fg = F.grot || (F.grot = {});
    TIME.seen('lake.noa', true);
    Object.assign(P, { demo: true, met: true, asked: { mender: 'S', pepe: 'S', marina: 'S' }, sent: true });
    if (step === 'past.grot') return step;
    Object.assign(pg, { seen0: true, seen1: true, seen2: true, card: true, stone: true, fear: true, done0: true, ambush: true, tunnel: true, pass: true, done1: true, frog: true, key: true, done2: true });
    P.floors = 3;
    if (step === 'past.top') return step;
    Object.assign(pg, { seen3: true, guard: true, boss: true, done3: true }); TIME.flag('past', 'lkFree', true);
    if (typeof CH4 !== 'undefined') CH4._.t.give('lake', 'past'); P.reported = true;
    if (step === 'future') { TIME.refresh(); return step; }
    Object.assign(F, { met: true, woke: { marina: 'S', vicente: 'S', delia: 'S', bartolo: 'S' }, open: true });
    if (step === 'future.grot') { TIME.refresh(); return step; }
    Object.assign(fg, { seen0: true, seen1: true, seen2: true, plank: true, fear: true, done0: true, ambush: true, window: true, pass: true, done1: true, bridge: true, name: true, done2: true });
    F.floors = 3; TIME.refresh();
    return step;
  }
  // the crack probe (TIME.md §13): what answers E within 3 steps, and the solids within 2, in the world you're in
  function probe(x, z) { return M0._.t.probe(x, z); }

  return { CEN, RAD, CRACK, ISL, BAR, ARCH, DOOR, MUD, DRESS, TXT, ECHO, NOA, PSTEPS, FSTEPS, WORDS, L, LANGS, isCl, lang, nameOf, enName, fillMimo, fillEn, say, demo, hushed, think, you, frame2, look,
    card, ask, teach, person, who, liftPeople, lock, shot, wait, mimoName, plainT, down, st, sp, sf, sn, via, check, sx, hideToday, parkToday, showLake, landOn, buildLand, platforms, caveShell,
    registerWords, wordsHTML,
    get flare() { return flare; }, set flare(v) { flare = v; },
    _: { noaOpen, reportPast, reportFuture, crackCard, tick, plat, t: { setup, near, go, probe, at, check: () => check(), get drv() { return M0._.t.drv; } } } };
})();
