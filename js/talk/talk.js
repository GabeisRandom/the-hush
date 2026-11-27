'use strict';
// TALK: free talk (DESIGN.md 15.3). The contract is ../../FLUENT.md ("B: free talk"); the authoring guide for content
// helpers is ../../TALK.md. You say what *you* want to say, in your own words, and people react to what you actually said.
//
// What's here (the engine; the panel is talk_ui.js, the phone phone.js, the level page meter.js, content content_<lang>.js):
//   TALK.judge(text, want, opts) → { grade 'S'…'D' | null, understood, met, missing, errors, major, minor, fixed, rich, … }
//        the S–D grade of one free answer (public: the reading helper grades comprehension answers with it)
//   TALK.content(lang, { scenes, small, threads, rewards, memories, phrases })   a language's conversations (content_es.js)
//   TALK.bond(id, def)       a bond person (the first wave is built in; the librarian joins from js/read/ through this)
//   TALK.play(scene, o)      run a scene in the panel (or any view) → { grades, quit, rankUp }
//   TALK.turn(turn, ctx)     run one turn (the phone's threads use it with their own view)
//   TALK.offers(item)        the story's Talk hook: "Talk freely" for bond people, "Small talk" for townsfolk
//   TALK.ready() · bonds() · rank(id) · facts() · recast(r) · fill(src, ctx) · init(game) · update(dt)
// State: G.state.talk { facts, bonds, small, cos, en, phone, note } (saved with the game). The learner's words and the level
// log are DICT's (saved with LEX). Hidden in a language with no dictionary pack (!DICT.ready()) or no content for it.

const TALK = (() => {
  let G = null;
  const L = () => (typeof LEX !== 'undefined' ? LEX.lang : 'es');
  const isC = l => typeof CJK !== 'undefined' && CJK.isCJK(l || L());
  const GR = ['S', 'A', 'B', 'C', 'D'];
  const BANDS = ['A0', 'A1', 'A2', 'B1', 'B2'];
  const T = { fast: false, view: null, log: [] };          // tests: fast skips pauses; view: the open conversation's view
  const CONTENT = {};                                     // lang → { scenes: { id: scene }, small: [scene], threads, rewards, memories }
  const nrm = s => (typeof norm === 'function' ? norm(s) : String(s || '').toLowerCase());
  const lc = s => String(s == null ? '' : s).toLowerCase();
  const plainOf = (s, l) => (isC(l) && typeof CJK !== 'undefined' ? CJK.plain(String(s || ''), { lang: l || L() }) : String(s || ''));
  const charsOf = (s, l) => (isC(l) && typeof CJK !== 'undefined' ? CJK.chars(String(s || ''), { lang: l || L() }) : String(s || ''));

  // ============================================================ each language's small words (the content helpers only write content)
  // yes / no, reasons, opinions, comparing, the weak "and"s (not richness), what a stranger says when they didn't follow,
  // the question marks, and how a sentence about "I" turns into one about "you" (the NPC's echo: «¿Fuiste al mercado?»).
  // zh / ja lists are matched on the words' plain characters (the pack's lemmas, in the CJK.md notation).
  const LT = {
    es: { yes: ['si', 'claro', 'por supuesto', 'obvio', 'seguro', 'desde luego', 'sip', 'aja', 'pues si', 'si claro', 'claro que si', 'me encanta', 'me encantan'],
      no: ['no', 'nunca', 'jamas', 'tampoco', 'para nada', 'nop', 'nel', 'ni modo', 'claro que no', 'nada'],
      reason: /\b(porque|ya que|por eso|asi que|puesto que|debido (a|al)|pues|como no|como si|pues como)\b|^ como /, opinion: /\b(creo que|pienso que|me parece|para mi|en mi opinion|a mi juicio|a mi parecer|opino que|siento que|creo|pienso|considero que|estoy de acuerdo|es (importante|mejor|necesario|fundamental)|seria (bueno|mejor|importante|ideal|necesario))\b/,
      compare: /\b(mas|menos)\b.*\bque\b|\b(mejor|peor|mayor|menor)\b|\btan\b.*\bcomo\b|\b(prefiero|preferimos)\b/, weak: ['y', 'e', 'o', 'u', 'ni'],
      strong: ['porque', 'pero', 'aunque', 'cuando', 'si', 'entonces', 'despues', 'luego', 'mientras', 'donde', 'que'],
      huh: ['¿Cómo? Perdón, no te entendí.', 'Sorry? I didn’t understand you.'], again: ['A ver, te pregunto otra vez:', 'OK, let me ask again:'],
      q: ['¿', '?'], drop: ['yo'], person: { s: [2, 's'], p: [3, 'p'] },
      swap: { me: 'te', mi: 'tu', mis: 'tus', conmigo: 'contigo', 'mío': 'tuyo', 'mía': 'tuya', 'míos': 'tuyos', 'mías': 'tuyas', nosotros: 'ustedes', nosotras: 'ustedes', nuestro: 'su', nuestra: 'su', nuestros: 'sus', nuestras: 'sus', nos: 'se' },
      join: ['con', 'de', 'del', 'sin'], good: ['bien', 'genial', 'excelente', 'feliz', 'contento', 'contenta', 'super', 'chido', 'padre', 'bacano', 'bonito', 'bonita', 'rico', 'rica', 'lindo', 'linda', 'bueno', 'buena', 'encanta', 'encantan', 'gusta', 'gustan', 'maravilla', 'perfecto', 'tranquilo', 'tranquila'],
      bad: ['mal', 'fatal', 'triste', 'cansado', 'cansada', 'enfermo', 'enferma', 'aburrido', 'aburrida', 'horrible', 'feo', 'fea', 'odio', 'malo', 'mala', 'preocupado', 'preocupada', 'nervioso', 'nerviosa'] },
    pt: { yes: ['sim', 'claro', 'com certeza', 'pois e', 'e sim', 'aham', 'uhum', 'isso', 'adoro', 'amo', 'gosto', 'tenho', 'quero', 'vou'],
      no: ['nao', 'nunca', 'jamais', 'tambem nao', 'de jeito nenhum', 'nada', 'nem'],
      reason: /\b(porque|pois|ja que|por isso|entao|como|devido a[os]?)\b/, opinion: /\b(acho que|eu acho|penso que|creio que|na minha opiniao|pra mim|para mim|acredito que|me parece|concordo|estou de acordo|e (importante|melhor|necessario|fundamental)|seria (bom|melhor|importante|ideal|necessario))\b/,
      compare: /\b(mais|menos)\b.*\bque\b|\b(melhor|pior|maior|menor)\b|\btao\b.*\bquanto\b|\bprefiro\b/, weak: ['e', 'ou', 'nem'],
      strong: ['porque', 'mas', 'embora', 'quando', 'se', 'entao', 'depois', 'enquanto', 'onde', 'que'],
      huh: ['Como? Desculpa, não entendi.', 'Sorry? I didn’t understand.'], again: ['Vou perguntar de novo:', 'Let me ask again:'],
      q: ['', '?'], drop: [], person: { s: [3, 's'], p: [3, 'p'] },
      swap: { eu: 'você', meu: 'seu', minha: 'sua', meus: 'seus', minhas: 'suas', comigo: 'com você', 'nós': 'vocês', nosso: 'seu', nossa: 'sua', nossos: 'seus', nossas: 'suas', me: 'te', 'mim': 'você' },
      refl: { me: 'se' }, join: ['com', 'de', 'do', 'da', 'sem'],
      good: ['bem', 'otimo', 'otima', 'feliz', 'legal', 'bom', 'boa', 'lindo', 'linda', 'gostoso', 'gostosa', 'adoro', 'amo', 'gosto', 'show', 'massa', 'tranquilo', 'tranquila', 'maravilhoso', 'perfeito'],
      bad: ['mal', 'pessimo', 'triste', 'cansado', 'cansada', 'doente', 'chato', 'chata', 'horrivel', 'ruim', 'odeio', 'preocupado', 'preocupada', 'nervoso', 'nervosa'] },
    de: { yes: ['ja', 'klar', 'naturlich', 'genau', 'doch', 'gern', 'gerne', 'stimmt', 'jawohl', 'sicher', 'logo', 'jo'],
      no: ['nein', 'nicht', 'nie', 'niemals', 'kein', 'keine', 'keinen', 'nee', 'ne', 'gar nicht', 'auf keinen fall'],
      reason: /\b(weil|denn|da|deshalb|deswegen|darum|also|namlich)\b/, opinion: /\b(ich finde|ich denke|ich glaube|meiner meinung nach|ich meine|fur mich|mir scheint|ich bin der meinung|ich stimme( \w+){0,3} zu|ich bin( \w+){0,2} einverstanden|es ist (wichtig|besser|notwendig|nutzlich)|es ware (gut|besser|wichtig|schon|sinnvoll))\b/,
      compare: /\b\w+er als\b|\b(besser|lieber|mehr|weniger|am \w+sten|schlechter)\b|\bso \w+ wie\b/, weak: ['und', 'oder'],
      strong: ['weil', 'aber', 'obwohl', 'wenn', 'als', 'dann', 'danach', 'denn', 'dass', 'wo', 'ob', 'sondern'],
      huh: ['Wie bitte? Das hab ich nicht verstanden.', 'Sorry? I didn’t get that.'], again: ['Ich frag noch mal anders:', 'Let me put it another way:'],
      q: ['', '?'], drop: [], person: { s: [2, 's'], p: [2, 'p'] },
      swap: { ich: 'du', mich: 'dich', mir: 'dir', mein: 'dein', meine: 'deine', meinen: 'deinen', meinem: 'deinem', meiner: 'deiner', meines: 'deines', wir: 'ihr', uns: 'euch', unser: 'euer', unsere: 'eure', unseren: 'euren', unserem: 'eurem', unserer: 'eurer' },
      join: ['mit', 'von', 'ohne'],
      good: ['gut', 'super', 'toll', 'prima', 'klasse', 'schon', 'glucklich', 'froh', 'lecker', 'lieb', 'gerne', 'gern', 'mag', 'liebe', 'spitze', 'wunderbar', 'perfekt', 'entspannt'],
      bad: ['schlecht', 'mude', 'traurig', 'krank', 'langweilig', 'schrecklich', 'doof', 'blod', 'hasse', 'nervos', 'besorgt', 'furchtbar'] },
    zh: { yes: ['是', '对', '嗯', '好', '行', '可以', '当然', '是的', '对啊', '喜欢', '有', '会', '要', '想'], no: ['不', '没', '没有', '不是', '不要', '不行', '别'],
      reason: ['因为', '所以', '因此', '由于', '既然', '要不然'], opinion: ['觉得', '认为', '我看', '看来', /我想(?!要|去|吃|喝|买|看|玩|做|学|回|睡|听|找|你|他|她|它|知道|问)/, '对我来说', '在我看来', '重要的是', '比较好'], compare: ['比', '更', '最', '没有那么', '一样'], weak: ['和', '跟', '还有'],
      strong: ['因为', '所以', '但是', '可是', '如果', '然后', '虽然'],
      huh: ['[什么|shén me] ？ [不好意思|bù hǎo yì si] ， [我|wǒ] [没|méi] [听懂|tīng dǒng] 。', 'Sorry? I didn’t catch that.'], again: ['[我|wǒ] [再|zài] [问|wèn] [一下|yī xià] ：', 'Let me ask again:'],
      q: ['', '？'], swap: { '我': '你', '我们': '你们', '我的': '你的' },
      good: ['好', '开心', '高兴', '喜欢', '不错', '棒', '好吃', '漂亮', '舒服', '快乐'], bad: ['累', '难过', '不好', '生病', '无聊', '讨厌', '担心', '难吃'] },
    ja: { yes: ['はい', 'ええ', 'うん', 'そう', 'もちろん', 'すき', '好き', 'ある', 'いる'], no: ['いいえ', 'いや', 'ううん', 'ぜんぜん', '全然', 'ない', 'じゃない'],
      reason: ['から', 'ので', 'だから', 'それで', 'そのため', 'ため', 'なぜなら'], opinion: ['思う', 'と思', '思います', 'かな', 'と考え', 'とかんがえ', '私にとって', 'わたしにとって', 'ほうがいい', 'ほうが いい', '大切なのは', 'たいせつなのは', 'べき'], compare: ['より', 'ほう', '一番', 'いちばん', 'もっと'], weak: ['と', 'や'],
      strong: ['から', 'ので', 'けど', 'が', 'でも', 'たら', 'ば', 'なら', 'それから'],
      huh: ['え？ すみません 、 よく わかりません でした 。', 'Sorry? I didn’t quite get that.'], again: ['もう [一度|いちど] [聞|き]きます ね 。', 'Let me ask once more.'],
      q: ['', '？'], drop: ['私', 'わたし', 'ぼく', '僕', 'おれ', '俺', 'あたし'],
      good: ['いい', '好き', 'すき', '楽しい', 'たのしい', 'おいしい', '元気', 'げんき', 'うれしい', 'すごい', '大好き'], bad: ['つかれ', '疲れ', 'さびしい', '悲しい', 'かなしい', 'まずい', 'いや', '嫌い', 'きらい', '病気'] },
  };
  const lt = (l = L()) => LT[l] || LT.es;
  // What a bond person says when their next rank is above your level (DESIGN.md 16: something simple and kind, and where to
  // learn). Said through the weave like every line; then small talk at your level.
  const NOTYET = {
    es: [['¡Me encanta platicar contigo! Pero de eso hablamos un poquito más adelante.', 'I love chatting with you! But let’s talk about that a little later on.'],
      ['Mientras, platica con la gente del pueblo y lee un libro en la biblioteca. ¡Poco a poco!', 'Meanwhile, chat with people in town and read a book at the library. Little by little!']],
    pt: [['Adoro conversar com você! Mas desse assunto a gente fala um pouquinho mais pra frente.', 'I love chatting with you! But we’ll talk about that a little further on.'],
      ['Enquanto isso, converse com o pessoal da cidade e leia um livro na biblioteca. Devagarinho!', 'Meanwhile, chat with people in town and read a book at the library. Little by little!']],
    de: [['Ich rede so gern mit dir! Aber darüber sprechen wir ein bisschen später.', 'I love talking with you! But let’s talk about that a bit later.'],
      ['Bis dahin: Sprich mit den Leuten im Dorf und lies ein Buch in der Bibliothek. Schritt für Schritt!', 'Until then: talk with the people in the village and read a book in the library. Step by step!']],
    zh: [['[我|wǒ] [很|hěn] [喜欢|xǐ huan] [跟|gēn] [你|nǐ] [聊天|liáo tiān] ， [可是|kě shì] [这个|zhè ge] [话题|huà tí] [还|hái] [有点|yǒu diǎn] [难|nán] 。', 'I really like chatting with you, but this topic is still a bit hard.'],
      ['[多|duō] [跟|gēn] [镇上|zhèn shang] [的|de] [人|rén] [聊聊|liáo liao] ， [去|qù] [图书馆|tú shū guǎn] [看看|kàn kan] [书|shū] 。 [慢慢|màn màn] [来|lái] ！', 'Chat more with people in town, and go read some books at the library. Take it slow!']],
    ja: [['あなた と [話|はな]す の は [楽|たの]しい です が 、 この [話|はなし] は まだ ちょっと [難|むずか]しい かも しれません 。', 'I enjoy talking with you, but this topic might still be a little hard.'],
      ['[町|まち] の [人|ひと] と [話|はな]したり 、 [図書館|としょかん] で [本|ほん] を [読|よ]んだり して ください ね 。 [少|すこ]しずつ で [大丈夫|だいじょうぶ] です よ 。', 'Talk with people in town, and read books at the library. Little by little is fine.']],
  };

  // ============================================================ state (in the save: G.state.talk)
  // mix: the woven words' counts and the words taught in a talk (js/talk/mix.js reads and writes it)
  const fresh = () => ({ v: 1, facts: {}, bonds: {}, small: {}, cos: {}, en: null, note: {}, mix: { wv: {}, taught: {} }, phone: { chats: {}, fired: {}, run: {}, contacts: {} }, stats: { answers: 0, S: 0, A: 0, B: 0, C: 0, D: 0 } });
  function S() {
    const st = G && G.state; if (!st) return T.mem || (T.mem = fresh());
    if (!st.talk || typeof st.talk !== 'object') st.talk = fresh();
    const t = st.talk, f = fresh();
    for (const k in f) if (t[k] === undefined) t[k] = f[k];
    for (const k in f.phone) if (t.phone[k] === undefined) t.phone[k] = f.phone[k];
    return t;
  }
  const flags = () => (G && G.state && G.state.flags) || {};
  const playTime = () => (G && G.state && G.state.time) || 0;
  const content = (l = L()) => CONTENT[l] || null;
  // ready in this language: a dictionary pack, and conversations written for it
  function ready(l = L()) {
    if (typeof DICT === 'undefined' || !content(l)) return false;
    try { return DICT.ready(l); } catch (e) { return false; }
  }

  // ============================================================ reading an analysis (DICT, FLUENT.md: never throws)
  const words = a => ((a && a.words) || []).filter(w => w && !w.punct);
  const entryOf = w => { try { return w && w.id && typeof DICT !== 'undefined' ? DICT.entry(w.id) : null; } catch (e) { return null; } };
  const CONTENT_POS = ['n', 'v', 'adj', 'adv', 'num', 'name'];
  // a word's plain text for matching: es / pt / de its lowercase surface without accents; zh / ja its lemma's characters
  const lemmaKey = (s, l = L()) => { const x = String(s || '').replace(/^[a-z]{2}:/, '').replace(/#.*$/, ''); return isC(l) ? charsOf(x, l).replace(/\s+/g, '') : nrm(x); };
  const surf = (w, l = L()) => (isC(l) ? charsOf(w.lemma || w.t, l).replace(/\s+/g, '') : nrm(w.t));
  // is this word one of these lemmas? (ids 'es:pan', bare lemmas 'pan', or zh / ja notation '[面包|miàn bāo]')
  // loose (a want's lemmas, zh / ja): a lemma of two or more characters also matches a longer word that starts with it,
  // a compound containing it ([星期|xīng qī] catches 星期六; never a single character: 大 is not 大家)
  function isLemma(w, list, l = L(), loose = false) {
    if (!w || !list || !list.length) return false;
    const id = w.id || '', lem = lemmaKey(w.lemma || w.t, l), s = isC(l) ? surf(w, l) : nrm(w.t);
    return list.some(x => {
      const k = String(x);
      if (k === id) return true;
      if (k.includes(':')) return false;
      const lk = lemmaKey(k, l);
      if (lk === lem || lk === s) return true;
      return loose && isC(l) && [...lk].length >= 2 && !w.unknown && !w.name && (lem.startsWith(lk) || s.startsWith(lk));
    });
  }
  const hasTag = (w, tags) => !!(w && w.tags && tags.some(t => w.tags.includes(t)));
  const arr = x => (x == null ? [] : Array.isArray(x) ? x : [x]);
  // phrases on the whole sentence: es / pt / de by regex or word list on the normalized text; zh / ja on the plain characters
  function saysAny(a, text, list, l = L()) {
    if (!list) return false;
    if (list instanceof RegExp) return list.test(' ' + nrm(text) + ' ');
    if (isC(l)) { const plain = charsOf(text, l) + ' ' + words(a).map(w => surf(w, l)).join(' '); return list.some(x => (x instanceof RegExp ? x.test(plain) : plain.includes(x))); }
    const t = ' ' + nrm(text) + ' '; return list.some(x => t.includes(' ' + nrm(x) + ' '));
  }
  // yes / no: an explicit yes or no word, else a sentence with a verb is a yes unless it's negated («Tengo dos» → yes, «No tengo» → no)
  function yesNo(a, text, l = L()) {
    const D = lt(l), toks = isC(l) ? words(a).map(w => surf(w, l)) : nrm(text).split(' ').filter(Boolean);
    const first = (list, from) => { for (let i = from || 0; i < toks.length; i++) for (const x of list) { const xs = isC(l) ? [x] : nrm(x).split(' '); if (xs.every((p, k) => toks[i + k] === p)) return i; } return -1; };
    const y = first(D.yes), n = first(D.no);
    if (y >= 0 && (n < 0 || y < n)) return 'yes';
    if (n >= 0) return 'no';
    if (a && a.neg) return 'no';
    if (a && ((a.verbs && a.verbs.length) || words(a).some(w => w.pos === 'v' || w.pos === 'adj'))) return 'yes';
    return null;
  }
  // feelings: the words' entry.val (+ / −), flipped by a negation; falls back to a few common words
  function valence(a, text, l = L()) {
    let v = 0, any = false;
    for (const w of words(a)) { const e = entryOf(w); if (e && e.val) { any = true; v += e.val === '+' ? 1 : -1; } }
    if (!any) { const D = lt(l), toks = isC(l) ? words(a).map(w => surf(w, l)) : nrm(text).split(' '); for (const t of toks) { if ((D.good || []).includes(t)) v++; else if ((D.bad || []).includes(t)) v--; } }
    if (a && a.neg) v = -v;
    return v > 0 ? '+' : v < 0 ? '-' : null;
  }
  // a name (a place, a person): the pack's names, a capitalized word it doesn't know, or an unknown word after «de / from / aus»
  function namesIn(a, text, l = L()) {
    const ws = words(a), out = [];
    ws.forEach((w, k) => {
      if (w.pos === 'name' || w.name) { out.push(k); return; }
      if (!w.unknown || isC(l)) return;
      const prev = ws[k - 1] && nrm(ws[k - 1].t);
      if (/^\p{Lu}/u.test(w.t) && k > 0) out.push(k);
      else if (['de', 'desde', 'aus', 'von', 'do', 'da', 'em', 'en', 'in'].includes(prev)) out.push(k);
      else if (/^\p{Lu}/u.test(w.t) && ws.length <= 2) out.push(k);
    });
    return out.map(k => ws[k]);       // (zh / ja: only the pack's own names)
  }
  const contentWords = a => words(a).filter(w => CONTENT_POS.includes(w.pos) && !w.unknown);
  // the learner's band (1..4) for "a word above your band": the level page's overall estimate, at least A1
  const learnerBand = () => { try { return Math.max(1, DICT.bands().overall || 0); } catch (e) { return 1; } };

  // ============================================================ judging one answer (FLUENT.md "Grading per answer")
  // want: what a good answer needs. Content keys (any one of them is enough: they say what it's about):
  //   topic ('food' or ['food', 'drink']: a word with that tag) · lemmas (['pan', 'es:queso']; need: how many of them) ·
  //   yesno · number (true or [min, max]) · name (a place or a person) · any (anything understandable in the language)
  // Form keys (all must hold too; a miss is a real mistake, one grade step, with a tip):
  //   time ('past' | 'future' | 'present' | 'hypo') · reason (porque, weil, 因为, から…) · opinion (creo que, ich finde, 我觉得,
  //   と思います) · compare (más … que, besser, 比, より) · min (at least this many words)
  // opts: { band (the turn's band, 1..4), help (rungs used: 1 starter, 2 example, 3 model), shown (the model was shown: D),
  //         focus (error codes this turn is about), tips: { time, reason, … } (the turn's own tip lines) }
  const FORM = ['time', 'reason', 'opinion', 'compare', 'min'];
  const CONTENT_KEYS = ['topic', 'lemmas', 'yesno', 'number', 'name', 'any'];
  const TIPS = {
    time: { past: 'This one is about what happened: tell it in the past.', future: 'This one is about what’s coming: say what you’re going to do.', present: 'Answer about now, in the present.', hypo: 'This one is a “what if”: answer with “would”.' },
    reason: 'Add a reason (“because…”).', opinion: 'Say what you think (“I think…”).', compare: 'Compare the two (“more… than”, “better”).', min: 'Say a little more.',
  };
  // Graded as if typed right (P6a, accents.js). A word typed without its accent can read as another word («ayude» for «ayudé», «e»
  // for «é», «se» for «sé»), and the answer then misses what was asked. So an answer that isn't an S is tried again with the
  // accents the dictionary knows on those words (one word at a time, a few at most), and the best reading counts; the words come
  // back as free tips. The one exception: a word that is, as typed, the same verb in another tense the task tells apart («cai», he
  // falls, for «caí»; «wurde» for «würde»): that reading still counts, but the answer is an A at best, and the tip says why.
  // opts.accents: false grades the text as typed. (A reading wins by fewer real mistakes, or by being understood at all; on a tie,
  // only by giving a verbless answer its verb, «Si, se nadar» → «sé», «A comida tipica e peixe» → «é». A word typed right is never
  // swapped to earn richness: «Já, e foi…» keeps its «e», «de» never turns into «dé»; and "a word above your band" counts only
  // for words you typed.)
  const gradeNoAbove = r => { const R = r.richness || {}, rich = [R.connector, R.clauses, R.extra].filter(Boolean).length >= 2; let g = r.major >= 2 ? 3 : r.major === 1 ? 2 : r.minor > 0 ? 1 : rich ? 0 : 1; g = Math.min(4, g + Math.min(2, r.help || 0)); if (r.shown || (r.help || 0) >= 3) g = 4; return g; };
  const errScore = r => (r && r.understood ? 100 - 10 * (r.errors || []).filter(e => !e.free).length : 0);
  const verbless = r => !!(r && r.a && !(r.a.verbs || []).length);
  const better = (r, cur) => { const a = errScore(r), b = errScore(cur); return a !== b ? a > b : verbless(cur) && !verbless(r) && GR.indexOf(r.grade) < GR.indexOf(cur.grade); };
  function judge(text, want = {}, opts = {}) {
    const r0 = judge1(text, want, opts), l = opts.lang || L();
    if (opts.accents === false || typeof ACCENTS === 'undefined' || !ACCENTS.isLat(l) || !r0 || r0.noPack || !r0.text || (r0.understood && r0.grade === 'S')) return r0;
    let toks = [];
    try { toks = (DICT.tokens(r0.text) || []).filter(t => t.word !== false && /\p{L}/u.test(t.t)); } catch (e) { return r0; }
    const cand = [];
    for (const tk of toks) { if (cand.length >= 6) break; let vs = []; try { vs = ACCENTS.respell(tk.t, l).slice(0, 3); } catch (e) { vs = []; } if (vs.length) cand.push({ tk, vs }); }
    if (!cand.length) return r0;
    const raw = r0.text, put = new Map();
    const textOf = m => { let s = '', at = 0; for (const tk of toks) { if (!m.has(tk)) continue; s += raw.slice(at, tk.s) + m.get(tk); at = tk.e; } return s + raw.slice(at); };
    let best = r0, bestMap = put;
    for (let pass = 0; pass < 2; pass++) {
      let step = null;
      for (const { tk, vs } of cand) {
        if (bestMap.has(tk)) continue;
        for (const v of vs) {
          const m = new Map(bestMap); m.set(tk, /^\p{Lu}/u.test(tk.t) ? v.charAt(0).toUpperCase() + v.slice(1) : v);
          let r = null; try { r = judge1(textOf(m), want, opts); } catch (e) { r = null; }
          if (r && better(r, step ? step.r : best)) step = { r, m };
        }
      }
      if (!step) break;
      best = step.r; bestMap = step.m;
      if (best.grade === 'S') break;
    }
    if (best === r0) return r0;
    // the better reading, as typed: its words' accents as free tips; the exception caps it at an A
    best.text = raw;
    if (best.richness && best.richness.above) {
      const lb = opts.learnerBand || learnerBand(), subs = [...bestMap.keys()];
      if (!contentWords(best.a).some(w => (w.band || 0) > lb && !subs.some(tk => w.s != null && Math.abs(w.s - tk.s) <= 2))) best.grade = GR[gradeNoAbove(best)];
    }
    let cap = null;
    for (const [tk, v] of bestMap) {
      const w = (best.a && best.a.words || []).find(x => x.s != null && Math.abs(x.s - tk.s) <= 2 && ACCENTS.same(x.t, v, l));
      const p = ACCENTS.pair(tk.t, v, l);
      if (p && p.same && p.grammar) { cap = cap || p.why; best.errors.push({ code: 'accent.word', sev: 'minor', at: w ? [w.i, w.i] : null, fix: v, tip: p.why }); }
      else best.errors.push({ code: 'accent', sev: 'minor', at: w ? [w.i, w.i] : null, fix: v, tip: ACCENTS.tip(v, l, tk.t), free: true });
    }
    if (cap) { best.minor = best.errors.filter(e => e.sev !== 'major' && !e.free).length; if (GR.indexOf(best.grade) < 1) best.grade = 'A'; }
    best.tips = [...new Set(best.errors.map(e => e.tip).filter(Boolean))];
    best.accentRead = true;
    return best;
  }
  function judge1(text, want = {}, opts = {}) {
    const l = opts.lang || L(), raw = String(text == null ? '' : text).trim();
    const out = { text: raw, lang: l, grade: null, understood: false, met: false, partial: false, missing: [], errors: [], major: 0, minor: 0, fixed: raw, rich: false,
      richness: { connector: false, clauses: false, extra: false, above: false }, hits: [], yn: null, val: null, numbers: [], names: [], help: opts.help || 0, shown: !!opts.shown, tips: [] };
    if (!raw) return out;
    if (typeof DICT === 'undefined' || !DICT.ready(l)) { out.noPack = true; return out; }
    let chk;
    try { chk = DICT.check(raw, { player: true, focus: opts.focus || [] }); } catch (e) { console.error('[talk] check', e); return out; }
    // the Spanglish bridge (P6a, talk/bridge.js): an English word the dictionary can translate is understood; the answer is judged
    // with it put in the language («Tengo un dog» as «Tengo un perro»), the person says it back, and you've met it. What it costs
    // follows your level (a ramp: free at A0 and A1). opts.bridge: false turns it off.
    let br = null;
    if (typeof BRIDGE !== 'undefined' && opts.bridge !== false) {
      try { br = BRIDGE.apply(raw, chk.a, l, { level: opts.level != null ? opts.level : langLevel() }); } catch (e) { console.error('[talk] bridge', e); br = null; }
      if (br) { try { chk = DICT.check(br.text, { player: true, focus: opts.focus || [] }); } catch (e) { console.error('[talk] check', e); br = null; } }
    }
    const a = chk.a || { words: [] }; out.a = a; out.fixed = chk.fixed || raw;
    out.errors = (chk.errors || []).slice(); out.numbers = (a.numbers || []).slice();
    const bi = new Set();
    if (br) {
      for (const b of br.words) { b.idx = []; for (const w of a.words || []) if (!w.punct && w.s != null && w.s >= b.s && w.e <= b.e) { bi.add(w.i); b.idx.push(w.i); if (w.id) b.id = w.id; } }
      // (what the pack says about a bridged word, its ending or its article, is the bridge's doing, not your slip: free, fixed all the same)
      for (const e of out.errors) if (Array.isArray(e.at) && [...bi].some(i => i >= e.at[0] && i <= (e.at[1] != null ? e.at[1] : e.at[0]))) { e.free = true; e.bridge = true; }
      br.words.forEach((b, k) => out.errors.push({ code: 'bridge', sev: 'minor', at: b.idx.length ? [b.idx[0], b.idx[b.idx.length - 1]] : null, fix: b.form, tip: `«${b.form}» = ${b.en}`, bridge: true, free: k < br.free }));
      out.bridged = br.words; out.bridgeFree = br.free;
    }
    const ws = words(a), n = ws.length, named = namesIn(a, raw, l);
    out.yn = yesNo(a, raw, l); out.val = valence(a, raw, l); out.names = named.map(w => w.t);
    // understood: names and numbers aside, at least half the words are words (a near miss the pack flagged as a spelling slip
    // counts; its mere suggestions don't: English gets suggestions too), and at least one; a name or a number alone is fine
    const slip = new Set(); for (const e of out.errors) if (/^spell/.test(e.code) && Array.isArray(e.at)) for (let i = e.at[0]; i <= (e.at[1] != null ? e.at[1] : e.at[0]); i++) slip.add(i);
    const core = ws.filter(w => !w.name && w.pos !== 'name' && !named.includes(w) && w.pos !== 'num' && !/^\d+$/.test(w.t));
    const known = core.filter(w => !w.unknown || slip.has(w.i)).length;
    let understandable = n > 0 && (core.length === 0 || (known >= 1 && known / core.length >= 0.5));
    // (with English bridged: at least as many words really in the language, and one of them a real word or two of them: «Yo want
    // un dog» is Spanglish, «I want a dog» is English)
    if (bi.size && understandable) {
      // (number words count: «um» gato; English's little words don't, even when they're words here too: «a», ja «i»)
      const real = ws.filter(w => !w.name && w.pos !== 'name' && !/^\d+$/.test(w.t) && (!w.unknown || slip.has(w.i)) && !bi.has(w.i) && !(BRIDGE.STOP.has(String(w.t).toLowerCase()) && /^[a-z]+$/i.test(w.t))), nb = ws.filter(w => bi.has(w.i)).length;
      if (real.length < nb || !(real.length >= 2 || real.some(w => ['n', 'v', 'adj', 'adv'].includes(w.pos)))) understandable = false;
    }
    // what it's about: any content key that hits
    const ck = CONTENT_KEYS.filter(k => want[k] !== undefined && want[k] !== false);
    const hits = new Set(); let hit = false;
    const tags = arr(want.topic), lems = arr(want.lemmas);
    if (tags.length) ws.forEach((w, k) => { if (hasTag(w, tags)) { hits.add(k); hit = true; } });
    if (lems.length) { let c = 0; ws.forEach((w, k) => { if (isLemma(w, lems, l, true)) { hits.add(k); c++; } }); if (c >= (want.need || 1)) hit = true; }
    if (want.yesno && out.yn) hit = true;
    if (want.number) { const nb = out.numbers; if (nb.length && (!Array.isArray(want.number) || nb.some(x => x >= want.number[0] && x <= want.number[1]))) hit = true; }
    if (want.name && out.names.length) { hit = true; ws.forEach((w, k) => { if (out.names.includes(w.t)) hits.add(k); }); }
    if (want.any || !ck.length) hit = hit || understandable;
    out.hits = [...hits].sort((x, y) => x - y).map(k => ws[k].i !== undefined ? ws[k].i : k);
    out.understood = understandable && hit;
    if (!out.understood) return out;
    // the shape it needs (time, a reason, an opinion, a comparison, length)
    const D = lt(l);
    const has = {
      time: () => a.time === want.time || (a.times || []).includes(want.time),
      reason: () => saysAny(a, raw, D.reason, l) || (a.connectors || []).some(c => (D.reason instanceof RegExp ? D.reason.test(' ' + nrm(c) + ' ') : (D.reason || []).includes(lemmaKey(c, l)))),
      opinion: () => saysAny(a, raw, D.opinion, l),
      compare: () => saysAny(a, raw, D.compare, l),
      min: () => n >= (+want.min || 0),
    };
    for (const k of FORM) if (want[k] !== undefined && want[k] !== false) { let ok = true; try { ok = has[k](); } catch (e) { ok = true; } if (!ok) out.missing.push(k); }
    out.met = !out.missing.length; out.partial = !out.met;
    // a missing shape is a real mistake (unless the pack already flagged the same thing: «ayer como» is its tense error)
    for (const k of out.missing) {
      if (k === 'time' && out.errors.some(e => /^tense/.test(e.code))) continue;
      const tip = (opts.tips && opts.tips[k]) || (k === 'time' ? TIPS.time[want.time] : TIPS[k]) || 'Not quite what was asked.';
      out.errors.push({ code: 'want.' + k, sev: 'major', at: null, fix: '', tip, want: true });
    }
    // (free: an accent slip, P6a's rule, and the bridge while it's free; they're tips, never a grade)
    out.major = out.errors.filter(e => e.sev === 'major' && !e.free).length; out.minor = out.errors.filter(e => e.sev !== 'major' && !e.free).length;
    // richness: two of a connector (not a plain "and"), two clauses, extra detail beyond what was asked, a word above your band
    const weak = D.weak || [];
    const R = out.richness;
    R.connector = (a.connectors || []).some(c => !weak.includes(lemmaKey(c, l))) || saysAny(a, raw, D.reason, l);
    R.clauses = (a.clauses || 0) >= 2 || (a.verbs || []).length >= 2;
    const hitSet = new Set(out.hits), extra = contentWords(a).filter(w => !hitSet.has(w.i)).length;
    R.extra = extra >= (want.extra || 2) || (!want.number && out.numbers.length > 0 && extra >= 1);
    const lb = opts.learnerBand || learnerBand();
    R.above = contentWords(a).some(w => (w.band || 0) > lb && !bi.has(w.i));       // (a bridged word isn't yours yet)
    out.rich = [R.connector, R.clauses, R.extra, R.above].filter(Boolean).length >= 2;
    // the grade, then help: one step per rung (a starter, an example); the model shown is a D
    let g = out.major >= 2 ? 3 : out.major === 1 ? 2 : out.minor > 0 ? 1 : out.rich ? 0 : 1;
    g = Math.min(4, g + Math.min(2, out.help || 0));
    if (out.shown || (out.help || 0) >= 3) g = 4;
    out.grade = GR[g];
    out.tips = [...new Set(out.errors.map(e => e.tip).filter(Boolean))];
    return out;
  }

  // ============================================================ echoes: your words said back the right way (a recast)
  // «Ayer yo como pan» → «¿Ayer comiste pan?»: the corrected sentence (DICT.check's fix), about "you" now (the verb through
  // DICT.inflect, my → your), as a question. Long answers, or ones with no verb, echo just the phrase that answered the
  // question: «Comí pan con queso y un café» → «¿Pan con queso?». zh echoes clauses from the words' own notation (我 → 你);
  // ja echoes the phrase only. Nothing that can't be said right is echoed.
  const finite = w => w && w.pos === 'v' && w.f && w.f.person && !['inf', 'ger', 'part', 'te', 'dict'].includes(w.f.form);
  // a time word («ayer», «mañana», «morgen», 明天): the pack's tag, or its entry's time (es.js marks «mañana» time: 'future')
  const isTimeWord = w => hasTag(w, ['time']) || !!(entryOf(w) && entryOf(w).time);
  const isStop = w => w && w.punct && /[.!?;:。！？；…]/.test(w.t);
  function fixedA(r) {
    if (r._a2) return r._a2;
    let a2 = r.a;
    try { if (r.fixed && r.fixed !== r.text) a2 = DICT.analyze(r.fixed, { player: true }) || r.a; } catch (e) { a2 = r.a; }
    return (r._a2 = a2 || { words: [] });
  }
  const capFirst = s => s.replace(/^(\s*[¿¡«"]*)(\p{Ll})/u, (m, p, c) => p + c.toUpperCase());
  function asQuestion(body, l = L()) {
    const q = lt(l).q || ['', '?'];
    if (isC(l)) return body.replace(/\s*[。！？.!?]+$/, '') + ' ' + q[1];
    return q[0] + capFirst(body.replace(/[\s.!?¡¿…,;:]+$/g, '').replace(/^[¡¿\s]+/, '')) + q[1];
  }
  // the clause around the main verb, said to "you": [{ s, time, verb }] (null when it can't be said right)
  function clauseParts(a2, l = L()) {
    const all = (a2 && a2.words) || [], D = lt(l);
    if (!all.length || l === 'ja') return null;
    let vi = -1;
    if (a2.verbs && a2.verbs.length) vi = all.findIndex(w => w.i === a2.verbs[0]);
    if (vi < 0) vi = all.findIndex(finite);
    if (vi < 0 && l !== 'zh') return null;
    if (vi < 0) vi = all.findIndex(w => !w.punct);
    const brk = k => { const w = all[k]; if (!w || w.punct) return isStop(w) || (w && /[,，、]/.test(w.t) && k > vi); const s = l === 'zh' ? surf(w, l) : nrm(w.t); if ((D.strong || []).includes(s)) return true; if ((D.weak || []).includes(s)) return all.slice(k + 1).some(finite); return false; };
    let s = 0, e = all.length;
    for (let k = vi - 1; k >= 0; k--) if (isStop(all[k]) || ((D.strong || []).includes(l === 'zh' ? surf(all[k], l) : nrm(all[k].t)))) { s = k + 1; break; }
    for (let k = vi + 1; k < all.length; k++) if (brk(k)) { e = k; break; }
    // (never echo a word nobody knows: one after the verb ends the echo there, one before it means no echo)
    for (let k = vi + 1; k < e; k++) { const w = all[k]; if (w.unknown && !w.name && !/^\p{Lu}/u.test(w.t) && !/^\d+$/.test(w.t)) { e = k; break; } }
    while (e - 1 > vi && all[e - 1] && (all[e - 1].punct || (D.weak || []).includes(nrm(all[e - 1].t)) || ['prep', 'det', 'conj'].includes(all[e - 1].pos))) e--;
    const out = [];
    for (let k = s; k < e; k++) {
      const w = all[k]; if (w.punct) continue;
      if (w.unknown && !w.name && !/^\p{Lu}/u.test(w.t) && !/^\d+$/.test(w.t)) return null;
      const time = isTimeWord(w);
      if (l === 'zh') {
        // (both ways: «我喜欢你的猫» comes back as «你喜欢我的猫»)
        const ch = surf(w, l), sw = { '我': '[你|nǐ]', '我们': '[你们|nǐ men]', '我的': '[你的|nǐ de]', '你': '[我|wǒ]', '您': '[我|wǒ]', '你们': '[我们|wǒ men]', '你的': '[我的|wǒ de]' }[ch];
        out.push({ s: sw || (/\[/.test(w.lemma || '') ? w.lemma : w.t), time, verb: k === vi });
        continue;
      }
      const low = lc(w.t);
      if ((D.drop || []).includes(low)) continue;
      if (finite(w) && w.f.person === 1) {
        const [p, nb] = D.person[w.f.number === 'p' ? 'p' : 's'];
        let form = null; try { form = DICT.inflect(w.id, Object.assign({}, w.f, { person: p, number: nb })); } catch (er) { form = null; }
        if (!form) return null;
        out.push({ s: form, time, verb: k === vi, id: w.id, f: w.f });
        continue;
      }
      if (D.refl && D.refl[low] && (finite(all[k + 1]) || finite(all[k - 1])) && ((all[k + 1] && all[k + 1].f && all[k + 1].f.person === 1) || (all[k - 1] && all[k - 1].f && all[k - 1].f.person === 1))) { out.push({ s: D.refl[low], time }); continue; }
      if (D.swap && D.swap[low] !== undefined) { out.push({ s: D.swap[low], time }); continue; }
      const keepCap = w.name || w.pos === 'name' || (l === 'de' && w.pos === 'n') || (k > 0 && /^\p{Lu}/u.test(w.t));
      out.push({ s: keepCap ? w.t : lc(w.t), time, verb: k === vi, id: finite(w) ? w.id : undefined, f: finite(w) ? w.f : undefined });
    }
    return out.length ? out : null;
  }
  const joinParts = (ps, l = L()) => ps.map(p => p.s).join(' ').replace(/\s+([,.;:!?])/g, '$1');
  // the phrase that answered: the first hit, with its article and what hangs on it («pan con queso», «el mercado»)
  function phraseParts(a2, ids, l = L(), prep = false) {
    const all = ((a2 && a2.words) || []);
    const D = lt(l);
    // (the first hit that's a thing, not a verb: «Comí pan» echoes «¿Pan?»)
    let k0 = all.findIndex(w => !w.punct && w.id && ids.includes(w.id) && w.pos !== 'v');
    if (k0 < 0) return null;
    let s = k0, e = k0;
    while (s > 0 && !all[s - 1].punct && ['det', 'num', 'adj'].includes(all[s - 1].pos)) s--;
    // (an echo keeps the preposition in front: «¿Al mercado?», «¿Con Bruno?»; one that joins two nouns takes the whole
    // phrase instead: «huevos con pan» → «¿Huevos con pan?», not «¿Con pan?»)
    if (prep && !isC(l) && s > 0 && !all[s - 1].punct && all[s - 1].pos === 'prep') {
      const b = all[s - 2];
      if (b && !b.punct && ['n', 'adj', 'name'].includes(b.pos) && (D.join || []).includes(lc(all[s - 1].t))) { s -= 2; while (s > 0 && !all[s - 1].punct && ['det', 'num', 'adj'].includes(all[s - 1].pos)) s--; }
      else s--;
    }
    while (e + 1 < all.length) {
      const w = all[e + 1]; if (w.punct) break;
      if (['n', 'adj', 'det', 'num', 'name'].includes(w.pos) && !isC(l)) { e++; continue; }
      const nx = all[e + 2];
      if (!isC(l) && (D.join || []).includes(lc(w.t)) && nx && !nx.punct && ['n', 'det', 'adj', 'num', 'name'].includes(nx.pos)) { e++; continue; }
      break;
    }
    const out = [];
    for (let k = s; k <= e; k++) {
      const w = all[k]; if (w.punct) continue;
      if (isC(l)) { out.push({ s: /\[/.test(w.lemma || '') || l === 'ja' ? (w.lemma || w.t) : w.t }); continue; }
      const low = lc(w.t);
      out.push({ s: D.swap && D.swap[low] !== undefined ? D.swap[low] : (w.name || w.pos === 'name' || (l === 'de' && w.pos === 'n') ? w.t : low) });
    }
    return out.length ? out : null;
  }
  // kind: 'clause' | 'phrase' | 'auto' (the phrase when the answer hit something, else the clause); prefer: word ids to echo
  // first (the words the reaction reacted to: «…y pan dulce» → «¿Pan dulce? ¡Como Marta!»)
  function recast(r, kind = 'auto', prefer) {
    if (!r || !r.a) return null;
    const l = L(), a2 = fixedA(r);
    const ids = prefer && prefer.length ? prefer : (r.hits || []).map(i => { const w = (r.a.words || []).find(x => x.i === i) || r.a.words[i]; return w && w.id; }).filter(Boolean);
    const tryClause = () => { const c = clauseParts(a2, l); return c && c.length <= 9 ? asQuestion(joinParts(c, l), l) : null; };
    const tryPhrase = () => { const p = ids.length && phraseParts(a2, ids, l, true); return p ? asQuestion(joinParts(p, l), l) : null; };
    try {
      if (kind === 'clause') return tryClause() || tryPhrase();
      if (kind === 'phrase') return tryPhrase();
      return (ids.length ? tryPhrase() : null) || tryClause();
    } catch (e) { console.error('[talk] recast', e); return null; }
  }

  // ============================================================ lines and their slots
  // A line is [text, english] (or { t, en }); several lines are an array of them; { any: [lines…] } picks one.
  // Slots in a line: {mimo} · {echo} (your words said back: see recast) · {n} (the number you said) · {name} (a name you said)
  // · {f.key} (a fact you told someone: f.key.en its English, .t its text, .you / .past the clause about you, now / in the past)
  // · {w.apple} (a LEX word). {slot|fallback} says the fallback when the slot is empty.
  function lineOf(x) {
    if (x == null) return null;
    if (typeof x === 'string') return { t: x, en: '' };
    if (Array.isArray(x)) return { t: String(x[0] || ''), en: String(x[1] || ''), mood: x[2] };
    if (x.any) return lineOf(x.any[Math.floor(Math.random() * x.any.length)]);
    return { t: String(x.t || ''), en: String(x.en || ''), mood: x.mood, who: x.who, audio: x.audio, sticker: x.sticker, img: x.img };
  }
  function linesOf(x) {
    if (x == null) return [];
    if (x.any) return linesOf(x.any[Math.floor(Math.random() * x.any.length)]);
    if (Array.isArray(x) && x.length && (Array.isArray(x[0]) || (x[0] && typeof x[0] === 'object'))) return x.map(lineOf).filter(Boolean);
    const one = lineOf(x); return one ? [one] : [];
  }
  const mimoName = (l = L(), en) => { const n = (G && G.state && G.state.mimoName) || 'Mimo'; if (n === 'Mimo' && !en) { if (l === 'zh') return '[米莫|Mǐ mò]'; if (l === 'ja') return 'ミモ'; } return n; };
  function factText(k, part, en, l = L()) {
    const f = S().facts[k]; if (!f) return null;
    const q = s => '«' + plainOf(s, l) + '»';
    if (!part) return en ? (f.one && f.en ? f.en : q(f.v)) : f.v;
    if (part === 'en') return f.en || null;
    if (part === 't') return en ? q(f.v) : f.v;
    if (part === 'yn') return f.yn || null;
    if (part === 'n') return f.n != null ? String(f.n) : null;
    if ((part === 'you' || part === 'past') && f.cl) {
      const c = f.cl; let parts = c.parts.slice();
      if (part === 'past') {
        if (!c.id || l === 'zh' || l === 'ja') return null;
        const D = lt(l), [p, nb] = D.person[c.f && c.f.number === 'p' ? 'p' : 's'];
        let v = null; try { v = DICT.inflect(c.id, { tense: 'past', mood: 'ind', person: p, number: nb }); } catch (e) { v = null; }
        if (!v) return null;
        parts = parts.filter(x => !x.time).map(x => (x.verb ? { s: v } : x));
      }
      const s = joinParts(parts, l);
      return en ? q(s) : s;
    }
    return null;
  }
  const SLOT = /\{([a-z][\w.]*)(?:\|([^{}]*))?\}/gi;
  function fill(src, ctx = {}, en = false) {
    const l = L();
    const out = String(src == null ? '' : src).replace(SLOT, (m, key, fb) => {
      let v = null;
      try {
        if (key === 'mimo') v = mimoName(l, en);
        else if (key === 'echo') v = ctx.echo ? (en ? '«' + plainOf(ctx.echo, l) + '»' : ctx.echo) : null;
        else if (key === 'n') {       // (the number as they said it: «cuatro» stays «cuatro»; digits in English and zh / ja)
          const nw = !en && !isC(l) && ctx.r && ctx.r.a ? words(ctx.r.a).find(w => w.pos === 'num' && /\p{L}/u.test(w.t)) : null;
          v = nw ? lc(nw.t) : ctx.r && ctx.r.numbers && ctx.r.numbers.length ? String(ctx.r.numbers[0]) : null;
        }
        else if (key === 'name') v = (ctx.r && ctx.r.names && ctx.r.names[0]) || null;
        else if (key.startsWith('f.')) { const [k, part] = key.slice(2).split('.'); v = factText(k, part, en, l); }
        else if (/^w\./.test(key) && typeof LEX !== 'undefined' && LEX.item(key)) v = en ? (LEX.item(key).en || key) : (isC(l) ? LEX.src(key) : LEX.form(key));
        else return m;
      } catch (e) { v = null; }
      return v != null && v !== '' ? v : (fb !== undefined ? fb : '');
    }).replace(/\s{2,}/g, ' ').replace(/^\s+|\s+$/g, '');
    return isC(l) ? out : capFirst(out);       // (a line starts with a capital, whatever the slot gave: «¿Cuatro?»)
  }

  // ============================================================ memory: what you've told people (G.state.talk.facts)
  // remember: { key: how } with how = 'match' (the phrase that answered) · 'clause' (what you'll do / did, for {f.key.you} and
  // {f.key.past}) · 'yesno' · 'number' · 'name' · 'text' (the whole sentence) · { tag } or { lemmas } (the phrase around that word)
  function phraseFact(a2, ids, l) {
    const p = phraseParts(a2, ids, l); if (!p) return null;
    const all = a2.words || [], head = all.find(w => w.id && ids.includes(w.id)), e = entryOf(head);
    return { v: joinParts(p, l), en: (e && e.en) || (head && head.en) || '', id: head && head.id, one: p.length <= 2 };
  }
  function factFrom(how, r) {
    const l = L(), a2 = fixedA(r);
    const hitIds = () => (r.hits || []).map(i => { const w = (r.a.words || []).find(x => x.i === i); return w && w.id; }).filter(Boolean);
    if (how === 'match') return hitIds().length ? phraseFact(a2, hitIds(), l) : (r.names && r.names.length ? { v: r.names[0], en: r.names[0], one: true } : null);
    if (how === 'yesno') return r.yn ? { v: r.yn, yn: r.yn } : null;
    if (how === 'number') return r.numbers && r.numbers.length ? { v: String(r.numbers[0]), n: r.numbers[0] } : null;
    if (how === 'name') return r.names && r.names.length ? { v: r.names[0], en: r.names[0], one: true } : null;
    if (how === 'text') return { v: r.fixed || r.text };
    if (how === 'clause') {
      const parts = clauseParts(a2, l); if (!parts) return null;
      const vb = parts.find(x => x.verb && x.id);
      return { v: r.fixed || r.text, cl: { parts, id: vb && vb.id, f: vb && vb.f } };
    }
    if (how && (how.tag || how.lemmas)) {
      const w = words(a2).find(x => (how.tag && hasTag(x, arr(how.tag))) || (how.lemmas && isLemma(x, arr(how.lemmas), l)));
      return w ? phraseFact(a2, [w.id], l) : null;
    }
    return null;
  }
  function remember(spec, r, ctx) {
    if (!spec || !r || !r.a) return;
    for (const [k, how] of Object.entries(spec)) {
      let v = null; try { v = factFrom(how, r); } catch (e) { console.error('[talk] remember', e); }
      if (v) S().facts[k] = Object.assign(v, { who: (ctx && ctx.who) || '', at: Math.round(playTime()), lang: L() });
    }
  }
  const facts = () => S().facts;

  // ============================================================ reactions: chosen by what you said
  // if: { tag, lemmas, yes, no, neg, time, num (true | n | [min, max]), val ('+' | '-'), question, name, reason, fact, nofact,
  //       grade, rich, errors, gaveUp, test(r, ctx) } — all must hold; a reaction without `if` is the default (put it last)
  function test(c, r, ctx) {
    if (!c) return true;
    const l = L(), a = (r && r.a) || { words: [] }, ws = words(a); r = r || {};
    if (c.gaveUp !== undefined && !!r.gaveUp !== !!c.gaveUp) return false;
    if (c.tag || c.tags) { const t = arr(c.tag || c.tags); if (!ws.some(w => hasTag(w, t))) return false; }
    if (c.lemma || c.lemmas) { const t = arr(c.lemma || c.lemmas); if (!ws.some(w => isLemma(w, t, l))) return false; }
    if (c.yes && r.yn !== 'yes') return false;
    if (c.no && r.yn !== 'no') return false;
    if (c.neg !== undefined && !!a.neg !== !!c.neg) return false;
    if (c.time && !(a.time === c.time || (a.times || []).includes(c.time))) return false;
    if (c.num !== undefined) { const nb = r.numbers || []; if (c.num === true ? !nb.length : Array.isArray(c.num) ? !nb.some(x => x >= c.num[0] && x <= c.num[1]) : !nb.includes(c.num)) return false; }
    if (c.val && r.val !== c.val) return false;
    if (c.question !== undefined && !!a.question !== !!c.question) return false;
    if (c.name && !(r.names || []).length) return false;
    if (c.reason && !saysAny(a, r.text || '', lt(l).reason, l)) return false;
    if (c.fact) for (const k of arr(c.fact)) if (!S().facts[k]) return false;
    if (c.nofact) for (const k of arr(c.nofact)) if (S().facts[k]) return false;
    if (c.grade && !arr(c.grade).includes(r.grade)) return false;
    if (c.rich !== undefined && !!r.rich !== !!c.rich) return false;
    if (c.errors !== undefined && !!(r.errors && r.errors.some(e => !e.free)) !== !!c.errors) return false;     // (an accent tip or a free bridge isn't a mistake)
    if (c.flag && !flags()[c.flag]) return false;
    if (typeof c.test === 'function') { try { if (!c.test(r, ctx || {})) return false; } catch (e) { return false; } }
    return true;
  }
  const pickReaction = (list, r, ctx) => arr(list).find(re => re && test(re.if, r, ctx)) || null;
  // the ids of the words a reaction's lemma / tag test matched (what its echo should be about)
  function reactedTo(re, r) {
    const c = re && re.if; if (!c || !r || !r.a) return [];
    const lem = arr(c.lemma || c.lemmas), tg = arr(c.tag || c.tags); if (!lem.length && !tg.length) return [];
    return words(r.a).filter(w => (lem.length && isLemma(w, lem)) || (tg.length && hasTag(w, tg))).map(w => w.id).filter(Boolean);
  }

  // ============================================================ a turn: they ask, you answer in your own words, they react
  // turn: { id, ask, simpler, goal (English: what to answer), want, starter, example, model, react: [reactions], remember,
  //         next, follow (only reached through a reaction's next), when (a test: skip the turn unless it holds), band, tips, focus }
  // ctx: { view, who, band, grades, coins, … } — the view shows things and reads your answer (talk_ui.js; the phone's chat):
  //   view.npc({ t, en, mood, who }) · view.you(text) → { grade(g), miss() } · view.mimo({ diff, tips, model }) ·
  //   view.input({ goal, rungs, help }) → { text, help } | null (null: you left) · view.model(line) · view.sys(text)
  const COINS = { S: 2, A: 1, B: 1, C: 0, D: 0 };
  const wait = ms => (T.fast || !ms ? Promise.resolve() : new Promise(r => setTimeout(r, ms)));
  // (force: the words taught earlier in this talk; the view mixes the line by the weave with them in the language: mix.js)
  async function say(x, ctx, mood) {
    for (const ln of linesOf(x)) {
      const t = fill(ln.t, ctx), en = fill(ln.en, ctx, true);
      if (!t && !en) continue;
      if (ctx.view && ctx.view.npc) await ctx.view.npc({ t, en, mood: ln.mood || mood, who: ln.who, audio: ln.audio, sticker: ln.sticker, img: ln.img, force: ctx.force || null });
    }
  }
  // ============================================================ teaching before asking (DESIGN.md 16; 7.9: hear it first, then try it)
  // The words the answer needs that you haven't met yet (MIX.newWords on the model and the starter: DICT.level < 2, not taught
  // to Mimo, not taught in a talk, not coming in through the weave), at most 3: the ones the want asks for first, then the
  // starter's, then things, actions, descriptions. The person shows them in a sentence (the model, as an example), each new
  // word highlighted, with its English and a picture where there is one; Mimo says them back; then comes the question.
  const TEACH_MAX = 3, TEACH_POS = ['n', 'v', 'adj', 'adv', 'int'];
  const mixOK = () => typeof MIX !== 'undefined' && MIX.ok();
  function preteach(tn, ctx) {
    if (!mixOK()) return null;
    const md = lineOf(tn.model); if (!md || !md.t) return null;
    const line = { t: fill(md.t, ctx), en: fill(md.en, ctx, true) };
    const sl = lineOf(tn.starter), starter = sl ? fill(sl.t, ctx).replace(/_{2,}/g, ' ') : '';
    const skip = ctx.force || new Set();
    const fromStarter = MIX.newWords(starter, { skip, en: sl ? fill(sl.en, ctx, true) : '' }), ws = MIX.newWords(line.t, { skip, en: line.en });
    for (const x of fromStarter) if (!ws.some(y => y.id === x.id)) ws.push(x);
    if (!ws.length) return null;
    const lems = arr((tn.want || {}).lemmas);
    const rank = x => (lems.length && isLemma({ id: x.id, lemma: x.lemma, t: x.t }, lems) ? 0 : 100) + (fromStarter.some(y => y.id === x.id) ? 0 : 10) + Math.max(0, TEACH_POS.indexOf(x.pos));
    const picked = ws.sort((a, b) => rank(a) - rank(b)).slice(0, TEACH_MAX);
    return { words: picked, ids: picked.map(x => x.id), line, more: ws.length - picked.length };
  }
  // a word taught in this talk that you then used right counts as taught (mix.js: it's in the language from now on)
  function usedRight(r, ids) {
    if (!r || !r.a || !ids || !ids.size || !mixOK()) return;
    const bad = new Set(); for (const e of r.errors || []) if (e.sev === 'major' && Array.isArray(e.at)) for (let i = e.at[0]; i <= (e.at[1] != null ? e.at[1] : e.at[0]); i++) bad.add(i);
    for (const b of r.bridged || []) for (const i of b.idx || []) bad.add(i);       // (a word the bridge put in wasn't typed in the language)
    for (const w of words(r.a)) if (w.id && ids.has(w.id) && !bad.has(w.i)) MIX.taught(w.id);
  }
  function markWords(r) {
    if (typeof DICT === 'undefined' || !r || !r.a) return;
    const bad = new Set(), br = new Set();
    for (const b of r.bridged || []) for (const i of b.idx || []) br.add(i);
    for (const e of r.errors || []) if (e.sev === 'major' && !e.bridge && Array.isArray(e.at)) for (let i = e.at[0]; i <= (e.at[1] != null ? e.at[1] : e.at[0]); i++) bad.add(i);
    try {
      if (!bad.size && !br.size) DICT.metAll(r.a, 'used');
      else for (const w of words(r.a)) if (w.id && !w.unknown) DICT.met(w.id, br.has(w.i) ? 'heard' : bad.has(w.i) ? 'wrong' : 'used');
      // (a bridged word: you've met it, heard in their answer; Mimo has seen it too)
      for (const b of r.bridged || []) if (b.lex && typeof LEX !== 'undefined' && LEX.item(b.lex)) LEX.expose(b.lex);
    } catch (e) { console.error('[talk] met', e); }
  }
  // your sentence, fixed, with the changed words marked (Mimo's line): an LCS over the words of both
  function diffHTML(orig, fixed) {
    const tk = s => { try { return (DICT.tokens(s) || []).filter(t => t.word !== false); } catch (e) { return []; } };
    const A = tk(orig), B = tk(fixed), k = t => lc(t.t);
    const n = A.length, m = B.length, D = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) D[i][j] = k(A[i]) === k(B[j]) ? D[i + 1][j + 1] + 1 : Math.max(D[i + 1][j], D[i][j + 1]);
    const same = new Set(); for (let i = 0, j = 0; i < n && j < m;) { if (k(A[i]) === k(B[j])) { same.add(j); i++; j++; } else if (D[i + 1][j] >= D[i][j + 1]) i++; else j++; }
    const e = s => (typeof esc === 'function' ? esc(s) : String(s));
    let out = '', at = 0;
    B.forEach((t, j) => { out += e(fixed.slice(at, t.s)); out += same.has(j) ? e(fixed.slice(t.s, t.e)) : `<b class="tk-red">${e(fixed.slice(t.s, t.e))}</b>`; at = t.e; });
    out += e(fixed.slice(at));
    return { html: out, changed: m - same.size, dropped: n - same.size };
  }
  async function turn(tn, ctx) {
    const view = ctx.view, band = tn.band || ctx.band || 1;
    if (!ctx.force) ctx.force = new Set();
    // new words first (a view that can show them: the panel, a chat), then the question; a reply asked before (ask: null) isn't re-taught
    const pre = tn.ask != null && view.teach ? preteach(tn, ctx) : null;
    const askLines = linesOf(tn.ask);
    if (pre) {
      pre.who = (askLines[askLines.length - 1] || {}).who || null;           // (in a group chat: whoever asks shows the words)
      if (askLines.length > 1) await say(askLines.slice(0, -1), ctx);
      pre.ids.forEach(id => ctx.force.add(id));
      try { await view.teach(pre); } catch (e) { console.error('[talk] teach', e); }
      try { pre.ids.forEach(id => DICT.met(id, 'heard')); } catch (e) { /* (no pack) */ }
      if (askLines.length) await say(askLines.slice(-1), ctx);
    } else await say(askLines, ctx);
    const rung = x => { const ln = lineOf(x); return ln ? { t: fill(ln.t, ctx), en: fill(ln.en, ctx, true) } : null; };
    // (help uses only words you know or are taught right there: an example's new words, up to 3, show with their English when you
    // ask for it; one with more is past i+1 and left out, so the ladder goes starter → model)
    let ex = rung(tn.example);
    if (ex && mixOK()) {
      const nw = MIX.newWords(ex.t, { skip: ctx.force, en: ex.en });
      if (nw.length > TEACH_MAX) ex = null; else if (nw.length) ex.teach = nw;
    }
    const rungs = [rung(tn.starter), ex, rung(tn.model)];
    // the goal is English; its things can be woven from the turn's own words (the question and the model)
    const goalSrc = askLines.concat(linesOf(tn.model)).map(x => fill(x.t, ctx)).join(' ');
    let misses = 0, late = 0, help = 0, shown = false, r = null, you = null;
    const huh = () => say(tn.simpler || [lt().huh, askLines.length ? askLines.slice(-1)[0] : null].filter(Boolean).map(x => (Array.isArray(x) ? x : [x.t, x.en])), ctx);
    for (;;) {
      const ans = await view.input({ goal: fill(tn.goal || '', ctx, true), goalSrc, rungs, help, band, turn: tn, force: ctx.force });
      if (!ans) return { quit: true };
      help = Math.max(help, ans.help || 0); if (help >= 3) shown = true;
      r = judge(ans.text, tn.want || { any: true }, { band, help, shown, focus: tn.focus, tips: tn.tips });
      you = view.you(ans.text) || {};
      if (r.understood) break;
      misses++;
      if (you.miss) you.miss();
      // not understood: they ask again in simpler words (no grade); a second miss shows the model (a D); one more go with
      // the model up, then the talk moves on
      if (!shown && misses === 1) { await huh(); continue; }
      if (!shown) { shown = true; help = 3; if (view.model) await view.model(rungs[2] || rungs[1] || rungs[0]); continue; }
      if (++late <= 1) { await huh(); continue; }
      r = Object.assign(r, { gaveUp: true, grade: 'D' });
      break;
    }
    // the grade, the words you used, the level log
    S().stats.answers++; S().stats[r.grade] = (S().stats[r.grade] || 0) + 1;
    if (r.understood) { markWords(r); usedRight(r, ctx.force); }
    try { DICT.log('talk', band, r.grade); } catch (e) { /* (no pack) */ }
    ctx.grades.push(r.grade); ctx.coins = (ctx.coins || 0) + (COINS[r.grade] || 0);
    T.log.push({ text: r.text, grade: r.grade, errors: (r.errors || []).map(e => e.code), turn: tn.id || '' });
    if (you.grade) you.grade(r.grade, r);
    // the reaction (chosen by what you said), what to remember, and your words said back
    const re = pickReaction(tn.react, r, ctx) || {};
    remember(tn.remember, r, ctx); remember(re.remember, r, ctx);
    if (re.fact) Object.entries(re.fact).forEach(([k, v]) => { S().facts[k] = { v: String(v), who: ctx.who || '', at: Math.round(playTime()), lang: L() }; });
    ctx.r = r; ctx.echo = null;
    const lines = linesOf(re.say);
    const wantsEcho = lines.some(x => /\{echo/.test(x.t));
    const fixable = r.understood && (r.errors || []).some(e => !e.want) && r.fixed && r.fixed !== r.text;
    // (the Spanglish bridge, P6a: the words you said in English are in the language from here on in this talk, like a word taught here)
    const bridged = r.understood && r.bridged && r.bridged.length ? r.bridged : null;
    if (bridged) bridged.forEach(b => { if (b.id) ctx.force.add(b.id); });
    // (after a real mistake the echo is the whole clause said right, so the fix is heard: «¿Ayer comiste fresas?»; otherwise
    // the phrase the reaction reacted to, when it reacted to a word)
    if (wantsEcho || fixable || re.echo) ctx.echo = recast(r, fixable ? 'clause' : typeof re.echo === 'string' ? re.echo : 'auto', reactedTo(re, r));
    if (bridged && !ctx.echo) { try { ctx.echo = asQuestion(bridged.map(b => (isC() ? b.lemma : b.form)).join(isC() ? ' ' : ', ')); } catch (e) { ctx.echo = null; } }
    // the bridge's recast in a bubble of its own where the view can show it (the panel): «¡Ah! ¿Tienes un perro?», the word
    // highlighted with its English; elsewhere (the phone) it starts their reply, like any echo. A reaction with its own {echo}
    // then takes the slot's fallback («{echo|¡Ah!} ¡Qué bien!» → «¡Ah! ¡Qué bien!»): the recast was just said.
    let bridgeSaid = false;
    if (bridged && ctx.echo && view.bridge) {
      try { await view.bridge({ echo: ctx.echo, ah: wantsEcho ? '' : (typeof BRIDGE !== 'undefined' && BRIDGE.AH[L()]) || '', words: bridged }); bridgeSaid = true; if (wantsEcho) ctx.echo = null; } catch (e) { console.error('[talk] bridge', e); }
    }
    // (keep the line's other fields: in a group chat its `who` says whose reply it is)
    if (bridgeSaid) { /* (said) */ }
    else if (ctx.echo && !wantsEcho && (fixable || re.echo) && lines.length) lines[0] = Object.assign({}, lines[0], { t: ctx.echo + ' ' + lines[0].t, en: '«' + plainOf(ctx.echo) + '» ' + lines[0].en });
    else if (ctx.echo && !wantsEcho && (fixable || re.echo)) lines.push({ t: ctx.echo, en: '' });
    await say(lines, ctx, re.mood);
    // Mimo: your sentence said right (the changes in red) and each mistake's one-line tip
    if (r.understood && (r.errors || []).length && view.mimo) {
      const real = r.fixed && r.fixed !== r.text;
      await view.mimo({ diff: real ? diffHTML(r.text, r.fixed).html : '', tips: r.tips || [], errors: r.errors, model: !real ? rungs[0] : null });
    }
    if (re.coins) ctx.coins += re.coins;
    return { r, next: re.next || tn.next || null, end: !!re.end, re };
  }

  // ============================================================ content: each language's conversations (content_<lang>.js)
  // TALK.content(lang, { scenes: [scene] | { id: scene }, small: [scene], threads: [thread], chats: { id: chat }, rewards: { who: { rank: reward } },
  //                      memories: { 'who.rank': lines }, phrases: { id: { t, en, note } } }) — TALK.md has the whole format
  function addContent(lang, def = {}) {
    const C = CONTENT[lang] || (CONTENT[lang] = { scenes: {}, small: [], threads: [], chats: {}, members: {}, rewards: {}, memories: {}, phrases: {} });
    Object.assign(C.members, def.members || {});
    const scenes = Array.isArray(def.scenes) ? def.scenes : Object.entries(def.scenes || {}).map(([id, s]) => Object.assign({ id }, s));
    for (const sc of scenes) if (sc && sc.id) C.scenes[sc.id] = sc;
    for (const sc of arr(def.small)) if (sc && sc.id) { C.small = C.small.filter(x => x.id !== sc.id); C.small.push(Object.assign({ small: true }, sc)); C.scenes[sc.id] = C.small[C.small.length - 1]; }
    for (const th of arr(def.threads)) if (th && th.id) { C.threads = C.threads.filter(x => x.id !== th.id); C.threads.push(th); }
    Object.assign(C.chats, def.chats || {});
    for (const [who, r] of Object.entries(def.rewards || {})) C.rewards[who] = Object.assign(C.rewards[who] || {}, r);
    Object.assign(C.memories, def.memories || {});
    Object.assign(C.phrases, def.phrases || {});
    registerPhrases(lang, def.phrases);
    return C;
  }
  const scene = (id, l = L()) => { const C = content(l); return (C && C.scenes[id]) || null; };
  const titleOf = sc => (sc && sc.title ? (typeof sc.title === 'string' ? sc.title : sc.title.en || '') : '');
  // Phrasebook entries (LEX kind 'phrase'): ids carry the language, ph.talk.<lang>.<name>, so every language has its own
  function registerPhrases(lang, P) {
    if (typeof LEX === 'undefined' || !P) return;
    for (const [id, p] of Object.entries(P)) {
      const it = Object.assign({}, LEX.item(id) || {}, { id, kind: 'phrase', en: p.en || '', note: p.note || '', register: p.register || 'casual', icon: p.icon || 'star', region: p.region || '' });
      it[lang] = p.t; LEX.register([it]);
    }
  }
  // into the Phrasebook (stage 3), its review pushed far off (like zhfolk.js teach: the person who taught it is the reminder)
  function teachPhrase(id) {
    if (typeof LEX === 'undefined' || !LEX.item(id) || !LEX.item(id)[L()]) return null;
    const s = LEX.st(id), t = Date.now() / 1000; LEX.expose(id);
    if (s.stage < 3) s.stage = 3;
    s.str = Math.max(s.str || 0, 30 * 86400); s.due = t + 30 * 86400; s.last = t;
    return LEX.item(id);
  }

  // ============================================================ bonds: 5 ranks per person, each a conversation one band harder
  // rank 1 small talk (A1) · 2 your plans (A2) · 3 a story from your past (B1) · 4 an opinion with reasons (B1+) · 5 "what
  // would you do if…" (B2). A rank's conversation is the scene '<who>.<rank>' in the save's language. The next rank opens
  // after the rank's story gate and a few minutes of play since the last one; until then "Talk freely" is small talk.
  const RANK_GAP = 240;
  const RANKS = [null,
    { band: 1, kind: 'small talk' },
    { band: 2, kind: 'your plans', gate: f => !!f.boss, gateText: 'after the big one on the hill' },
    { band: 3, kind: 'a story from your past', gate: f => (f.bells || 0) >= 1, gateText: 'after the first bell' },
    { band: 3, kind: 'an opinion, with reasons', gate: f => (f.bells || 0) >= 2, gateText: 'after the second bell' },
    { band: 4, kind: '“what would you do if…”', gate: f => (f.bells || 0) >= 3, gateText: 'after the third bell' },
  ];
  const BOND = {};
  const personIn = (grp, id) => (grp && grp.people ? grp.people.find(p => p.id === id) || null : null);
  // def: { name: { en, es, pt, de, zh, ja }, npc (a story villager's id) | find() → the person, gate(flags), gateText, look (portrait),
  //        her ('her' | 'him' | 'them', for menus), where, ranks: { n: { gate, gateText } } }
  function bond(id, def) { BOND[id] = Object.assign(BOND[id] || { id, order: Object.keys(BOND).length + 1 }, def || {}); return BOND[id]; }
  bond('rosa', { name: { en: 'Rosa', es: 'Doña Rosa', pt: 'Dona Rosa', de: 'Oma Rosa', zh: '[罗莎|Luó shā] [奶奶|nǎi nai]', ja: 'ロサ さん' }, npc: 'rosa', gate: f => !!f.rosa, gateText: 'after her welcome', her: 'her', where: 'her fruit stall in Alba' });
  bond('bruno', { name: { en: 'Bruno', zh: '[布鲁诺|Bù lǔ nuò]', ja: 'ブルーノ' }, npc: 'bruno', gate: f => (f.lessons || 0) >= 1 && !f.escort, gateText: 'after his first lesson', her: 'him', where: 'his training yard by the bell tower' });
  bond('baker', { name: { en: 'Marta', zh: '[玛尔塔|Mǎ ěr tǎ]', ja: 'マルタ' }, npc: 'baker', gate: f => !!f.quest, gateText: 'after she asks you about the mushrooms', her: 'her', where: 'the bakery in Alba' });
  bond('bartolo', { name: { en: 'Bartolo', zh: '[巴托洛|Bā tuō luò]', ja: 'バルトロ' }, find: () => personIn(G && G.lake, 'bartolo'), gate: f => !!f.bartolo, gateText: 'after he gets his words back', her: 'him', where: 'the pier in Remanso' });
  bond('cande', { name: { en: 'Cande', zh: '[坎德|Kǎn dé]', ja: 'カンデ' }, find: () => personIn(G && G.caves, 'cande'), gate: f => !!f.cande, gateText: 'after you meet her at the miners’ camp', her: 'her', where: 'the miners’ camp' });
  // (the librarian joins from js/read/library.js: TALK.bond('librarian', { name, find, gate, gateText, look, her, where }))
  const NPC_NAMES = { rosa: 'Doña Rosa', kid: 'Nico', baker: 'Marta', bruno: 'Bruno' };
  const bondState = id => { const b = S().bonds; return b[id] || (b[id] = { rank: 0, at: 0, n: 0 }); };
  function nameOf(who, p, l = L()) {
    const b = who && BOND[who];
    let v = b ? (b.name[l] || b.name.en || who) : (p && p.name) || NPC_NAMES[who] || (p && NPC_NAMES[p.id]) || '';
    return isC(l) && typeof CJK !== 'undefined' && /\[/.test(v) ? CJK.plain(v, { lang: l }) : v;
  }
  function personOf(who) {
    const b = BOND[who]; if (!b || !G) return null;
    try { if (b.npc && G.sim) return G.sim.npc(b.npc) || null; if (b.find) return b.find() || null; } catch (e) { /* */ }
    return null;
  }
  function lookOf(who, p) {
    const b = who && BOND[who];
    if (b && b.look) return b.look;
    p = p || personOf(who);
    const P = typeof ACTORS !== 'undefined' ? ACTORS.PRESETS : {};
    if (p) {
      if (p._d && p._d.look) return Object.assign({ kid: !!p._d.kid }, p._d.look);
      if (p.look && typeof p.look === 'object') return p.look;
      if (p.kind && P[p.kind]) return Object.assign({ kid: p.kind === 'kid' }, P[p.kind]);
    }
    return null;
  }
  // Your level for the ranks (DESIGN.md 16: ranks open by your language as well as the story): the level page's estimate
  // (DICT.bands) or Mimo's words (the game's own vocabulary: 15 known for A1, 45 for A2, 90 for B1, 150 for B2), whichever is
  // higher, 0 A0 … 4 B2. A rank needs it within one band of its own (rank 2, A2, needs A1; ranks 3–4, B1, need A2; 5 needs B1).
  const LEX_STEPS = [0, 15, 45, 90, 150];
  function langLevel() {
    let b = 0; try { b = DICT.bands().overall || 0; } catch (e) { b = 0; }
    let n = 0;
    try { n = LEX.taughtList().filter(id => { const it = LEX.item(id); return it && it.kind !== 'phrase' && it.kind !== 'number' && LEX.st(id).stage >= LEX.STAGE.KNOWN; }).length; } catch (e) { n = 0; }
    let lx = 0; for (let i = 1; i < LEX_STEPS.length; i++) if (n >= LEX_STEPS[i]) lx = i;
    return Math.max(b, lx);
  }
  function nextFor(id) {
    const b = BOND[id]; if (!b) return { ready: false, why: '' };
    const st = bondState(id), r = st.rank + 1, f = flags();
    if (!b.gate || !b.gate(f)) return { ready: false, rank: r, locked: true, why: 'later: ' + (b.gateText || '') };
    if (r > 5) return { ready: false, rank: 5, done: true, why: 'every rank done' };
    const R = Object.assign({}, RANKS[r], (b.ranks || {})[r]), sc = scene(id + '.' + r), band = (sc && sc.band) || R.band;
    if (!sc) return { ready: false, rank: r, band, missing: true, kind: R.kind, why: 'coming in a later update' };
    if (R.gate && !R.gate(f)) return { ready: false, rank: r, band, scene: sc, kind: R.kind, why: 'later: ' + R.gateText };
    const need = Math.max(0, band - 1), lv = langLevel();
    if (lv < need && !T.noLevel) return { ready: false, rank: r, band, scene: sc, kind: R.kind, level: true, need, lv, why: `when your ${langName()} is ${BANDS[need]} (now ${BANDS[lv]})` };
    if (st.rank > 0 && playTime() - (st.at || 0) < RANK_GAP && !T.noGap) return { ready: false, rank: r, band, scene: sc, kind: R.kind, soon: true, why: 'come back in a little while' };
    return { ready: true, rank: r, band, scene: sc, kind: R.kind, title: titleOf(sc) };
  }
  // the journal's list (meter.js): everyone you can bond with, once you've met them
  function bondList() {
    const f = flags();
    return Object.values(BOND).sort((a, b) => a.order - b.order).map(b => {
      const st = bondState(b.id), nx = nextFor(b.id), met = !!(b.gate && b.gate(f));
      return { id: b.id, name: nameOf(b.id), met, rank: st.rank, next: nx, look: lookOf(b.id), where: b.where || '', her: b.her || 'them',
        facts: Object.entries(S().facts).filter(([, v]) => v.who === b.id).map(([k, v]) => ({ key: k, v: v.v, en: v.en || '' })) };
    });
  }
  function rankUp(id, rank) {
    const st = bondState(id), C = content() || {}, rw = ((C.rewards || {})[id] || {})[rank] || {};
    st.rank = Math.max(st.rank, rank); st.at = playTime(); st.n = (st.n || 0) + 1;
    const got = [];
    if (rw.phrase) { const it = teachPhrase(rw.phrase); if (it) got.push({ kind: 'phrase', t: it[L()], en: it.en, note: it.note }); }
    if (rw.coins && G && G.state) { G.state.coins = (G.state.coins || 0) + rw.coins; got.push({ kind: 'coins', n: rw.coins }); }
    if (rw.cosmetic && COS[rw.cosmetic]) { S().cos[rw.cosmetic] = { on: true, from: id }; got.push({ kind: 'cosmetic', id: rw.cosmetic, name: COS[rw.cosmetic].name }); }
    if (rw.number) { S().phone.contacts[id] = true; got.push({ kind: 'number' }); }
    if (typeof rw.give === 'function') { try { const g = rw.give(G); if (g) got.push(g); } catch (e) { console.error('[talk] reward', e); } }
    return { id, rank, got, memory: (C.memories || {})[id + '.' + rank] || null, note: rw.note || '' };
  }

  // ============================================================ Mimo's cosmetics (a rank-up gift; toggled on the journal's People page)
  // cosmetic(id, { name: { en }, build(mimo) → Object3D (attached to the rig; it's shown while owned and switched on) })
  const COS = {}, COSM = {};
  function cosmetic(id, def) { COS[id] = Object.assign(COS[id] || { id }, def); return COS[id]; }
  // Rosa's paper flower (papel picado colors), pinned at the root of Mimo's left ear: it never fights a hat for the head
  cosmetic('flower', { name: { en: 'a paper flower, from Rosa' }, build(M) {
    if (typeof TK === 'undefined' || !M || !M.ears) return null;
    const g = new THREE.Group(), cols = ['#e8457a', '#f29c38', '#9b5de5', '#2ec4b6', '#f25c54'];
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.add(TK.part(TK.G.sphere, cols[i], [Math.cos(a) * 0.068, Math.sin(a) * 0.068, 0], [0.052, 0.052, 0.014], { ink: 0.007 })); }
    g.add(TK.part(TK.G.sphere, '#ffd23f', [0, 0, 0.014], [0.034, 0.034, 0.018], { ink: 0.006 }));
    g.position.set(-0.04, 0.07, 0.06); g.rotation.set(-0.25, 0, 0.3);
    M.ears[0].add(g); return g;
  } });
  const setCosmetic = (id, on) => { const c = S().cos[id]; if (c) c.on = !!on; };
  function cosFrame() {
    if (!G || !G.cast || !G.cast.mimo || !G.state) return;
    const own = S().cos;
    for (const id in COS) {
      const on = !!(own[id] && own[id].on);
      if (!on && !COSM[id]) continue;
      if (on && COSM[id] === undefined) { try { COSM[id] = COS[id].build(G.cast.mimo) || null; } catch (e) { console.error('[talk] cosmetic', e); COSM[id] = null; } }
      if (COSM[id]) COSM[id].visible = on;
    }
  }

  // ============================================================ small talk: anyone in town, a generic scene at your band
  function smallBand() {
    const C = content(); const max = Math.max(1, ...(((C && C.small) || []).map(s => s.band || 1)));
    let b = 0; try { b = DICT.skillBand('talk'); } catch (e) { b = 0; }
    return Math.max(1, Math.min(max, b + 1));
  }
  // o: { preface (lines said first), note (a gray note after them) }
  function smallTalk(p, bondId, o = {}) {
    const C = content();
    if (!C || !C.small || !C.small.length) return o.preface ? play({ id: '_preface', band: 1, turns: [] }, Object.assign({ who: bondId || null, person: p, small: true }, o)) : Promise.resolve({ quit: true });
    const band = smallBand(), key = bondId || (p && (p.id || p.name)) || 'x';
    let pool = C.small.filter(s => (s.band || 1) === band); if (!pool.length) pool = C.small;
    const last = S().small[key], choices = pool.length > 1 ? pool.filter(s => s.id !== last) : pool;
    const sc = T.pick ? (C.scenes[T.pick] || choices[0]) : choices[Math.floor(Math.random() * choices.length)];
    S().small[key] = sc.id;
    return play(sc, Object.assign({ who: bondId || null, person: p, small: true }, o));
  }
  async function talkFreely(id) {
    const nx = nextFor(id), p = personOf(id);
    if (nx.ready) return play(nx.scene, { who: id, rankUp: nx.rank, person: p });
    // (the next rank is above your level: they say so kindly, say where to learn, and talk at your level)
    if (nx.level) return smallTalk(p, id, { preface: NOTYET[L()] || NOTYET.es,
      note: `Rank ${nx.rank} (${BANDS[nx.band]}: ${nx.kind}) opens when your ${langName()} reaches ${BANDS[nx.need]}. You’re at ${BANDS[nx.lv]}: small talk, the books in Alba’s library, the radio and Mimo’s words all get you there.` });
    return smallTalk(p, id);
  }

  // ============================================================ the story's Talk hook (story.js talkMenu → STORY.talkHooks)
  // item: the Talk interactable ({ x, z, label, who, p, region }). Bond people: "Talk freely" (their next rank's conversation, or
  // small talk while it waits). Townsfolk (Alba, Molinar, Remanso, not hushed): "Small talk", after the big one on the hill.
  function whoIs(it) {
    if (!it) return null;
    if (it.who && BOND[it.who]) return it.who;
    for (const id in BOND) {
      const b = BOND[id]; if (!b.find) continue;
      let p = null; try { p = b.find(); } catch (e) { p = null; }
      if (p && (it.p === p || Math.hypot(p.x - it.x, p.z - it.z) < 0.35)) return id;
    }
    return null;
  }
  const langName = () => ((typeof UI !== 'undefined' && UI.LANGNAME) || {})[L()] || L();
  // a bond person's "Talk freely" (also for modules with their own menu: TALK.offersFor('librarian'))
  function offersFor(id) {
    if (!G || !ready() || !BOND[id]) return null;
    const b = BOND[id], C = content(), hasSmall = !!(C.small && C.small.length);
    if (!b.gate || !b.gate(flags())) return null;
    const nx = nextFor(id);
    if (nx.ready) return [{ label: 'Talk freely', sub: `Rank ${nx.rank} · ${BANDS[nx.band] || ''} · ${nx.title || nx.kind || ''}`, run: () => talkFreely(id) }];
    if (nx.level) return [{ label: 'Talk freely', sub: `small talk at your level for now · rank ${nx.rank} (${BANDS[nx.band]}) opens at ${BANDS[nx.need]}; you’re ${BANDS[nx.lv]}`, run: () => talkFreely(id) }];
    if (hasSmall) return [{ label: 'Talk freely', sub: `${langName()} small talk at your level (${BANDS[smallBand()]}) · rank ${nx.rank}: ${nx.why}`, run: () => talkFreely(id) }];
    return null;
  }
  function offers(it) {
    if (!G || !it || it.label !== 'Talk' || !ready()) return null;
    const f = flags(), id = whoIs(it), C = content(), hasSmall = !!(C.small && C.small.length);
    if (id) return BOND[id].ownMenu ? null : offersFor(id);
    const p = it.p;
    if (!p || p.hushed || p.id === 'hugo' || !it.region || !f.boss || !hasSmall) return null;
    return [{ label: 'Small talk', sub: `in ${langName()}, at your level (${BANDS[smallBand()]})`, run: () => smallTalk(p) }];
  }

  // ============================================================ a scene in the panel
  // the intro line (P6a): what free talk wants, and the Spanglish bridge (talk/bridge.js) for the words you don't know yet
  const MIXED = { es: 'Tengo un dog', pt: 'Eu tenho um dog', de: 'Ich habe einen dog', zh: '我 有 dog', ja: 'dog が すき です' };
  const introLine = (l = L()) => `Free talk: answer in your own words, in ${langName()}. Missing a word? Mix in the English one («${MIXED[l] || MIXED.es}»): they’ll say it back in ${langName()}, and you’ll have met it.`;
  // o: { who, person, rankUp (the rank this conversation earns), small, view (another view, e.g. tests) }
  function headerFor(who, p, sc, o) {
    const st = who ? bondState(who) : null;
    return { who, name: nameOf(who, p), look: lookOf(who, p), band: sc.band || 1, title: titleOf(sc), small: !!o.small,
      rank: st ? st.rank : null, rankUp: o.rankUp || null, en: S().en };
  }
  async function play(sc, o = {}) {
    if (typeof sc === 'string') sc = scene(sc);
    if (!sc || !sc.turns) return { quit: true, missing: true };
    const who = o.who || sc.who || null, p = o.person || personOf(who);
    const view = o.view || (typeof TALKUI !== 'undefined' ? TALKUI.open(headerFor(who, p, sc, o)) : null);
    if (!view) return { quit: true };
    const ctx = { scene: sc, who, view, band: sc.band || 1, grades: [], coins: 0, person: p, force: new Set() };
    T.view = view; T.ctx = ctx;
    let quit = false, rank = null;
    if (p) p.talking = true;
    try {
      // free talk's intro, the first few talks in a save (P6a): your own words, and English mixed in for the words you don't have yet
      if (view.sys && !o.view) { const nt = S().note; nt._intro = (nt._intro || 0) + 1; if (nt._intro <= 3) view.sys(introLine()); }
      if (o.preface) await say(o.preface, ctx);
      if (o.note && view.sys) view.sys(o.note);
      if (sc.open) await say(sc.open, ctx);
      const byId = {}; sc.turns.forEach(t => { if (t.id) byId[t.id] = t; });
      const queue = sc.turns.filter(t => !t.follow);
      let guard = 0;
      while (queue.length && guard++ < 40) {
        const tn = queue.shift();
        if (tn.when && !test(tn.when, null, ctx)) continue;
        const res = await turn(tn, ctx);
        if (res.quit) { quit = true; break; }
        if (res.end) break;
        if (res.next && byId[res.next]) queue.unshift(byId[res.next]);
      }
      if (!quit) {
        if (sc.close) await say(sc.close, ctx);
        if (o.rankUp && who) rank = rankUp(who, o.rankUp);
        if (ctx.coins && G && G.state) G.state.coins = (G.state.coins || 0) + ctx.coins;
        if (view.end) await view.end({ grades: ctx.grades, coins: ctx.coins, rank, who, name: nameOf(who, p), small: !!o.small });
      }
      if (G && G.save) G.save();
    } catch (e) { console.error('[talk] play', e); }
    finally { if (p) p.talking = false; try { if (view.close) view.close(); } catch (e) { /* */ } T.view = null; T.ctx = null; }
    return { quit, grades: ctx.grades, coins: ctx.coins, rank };
  }

  // ============================================================ init, every frame
  let tickT = 0;
  function notifyBonds() {
    if (typeof STORY !== 'undefined' && (STORY.busy || STORY.line)) return;
    if (G && G.indoorMod && G.indoorMod()) return;      // (in a room or a time realm: the nudge waits till you're back out in town)
    // (and, like quiz.js, life.js and phone.js: the final act's places (finale.js FIN.quiet: the Old Tower, inside the Hush, the old
    // theater at eight), any other time or the way there (the Past, the Future, a region's other worlds), a fight, the title, and a
    // full-screen panel (ui.js UI.panelUp))
    if (typeof FIN !== 'undefined' && FIN.quiet && FIN.quiet()) return;
    if ((typeof PAST !== 'undefined' && PAST.inside) || (typeof FUTURE !== 'undefined' && FUTURE.inside)) return;
    try { if (typeof TIME !== 'undefined' && (TIME.busy || (TIME.world && TIME.world() !== 'now'))) return; } catch (e) { /* */ }
    if (typeof document !== 'undefined' && /(^|\s)(in-battle|on-title)(\s|$)/.test(document.body.className)) return;
    if (typeof UI !== 'undefined' && UI.panelUp && UI.panelUp()) return;
    const st = S(), f = flags();
    for (const id of Object.keys(BOND).sort((a, b) => BOND[a].order - BOND[b].order)) {
      const b = BOND[id]; if (!b.gate || !b.gate(f)) continue;
      const nx = nextFor(id); if (!nx.ready || st.note[id] === nx.rank) continue;
      st.note[id] = nx.rank;
      if (typeof UI !== 'undefined' && UI.toast) UI.toast(`💬 ${nameOf(id)} has time to talk (Talk freely · rank ${nx.rank})`);
      return;
    }
  }
  function init(game) {
    G = game;
    if (typeof STORY !== 'undefined' && STORY.talkHooks && !STORY.talkHooks.includes(offers)) STORY.talkHooks.push(offers);
  }
  function update(dt) {
    if (!G || !G.state) return;
    cosFrame();
    if ((tickT -= dt) > 0) return;
    tickT = 1;
    if (!G.state.flags || !G.state.flags.hatched || !ready()) return;
    notifyBonds();
  }

  // ============================================================ checks for content helpers (TALK.md "Testing a scene")
  // TALK._.check(lang) → [problems]: every scene's shape, the English, the zh / ja notation (CJK.validate), next ids, rewards
  function check(lang = L()) {
    const C = CONTENT[lang], out = []; if (!C) return ['no content for ' + lang];
    const cj = isC(lang) && typeof CJK !== 'undefined';
    const line = (where, x) => { for (const ln of linesOf(x)) { if (!ln.t) out.push(where + ': an empty line'); if (!ln.en) out.push(where + ': no English'); if (cj) for (const p of CJK.validate(ln.t.replace(SLOT, 'X'), lang)) out.push(where + ': ' + p); } };
    const sceneCheck = (sc, where) => {
      if (!sc.turns || !sc.turns.length) { out.push(where + ': no turns'); return; }
      const ids = new Set(sc.turns.map(t => t.id).filter(Boolean));
      if (sc.open) line(where + '.open', sc.open); if (sc.close) line(where + '.close', sc.close);
      sc.turns.forEach((t, i) => {
        const w = `${where}.turns[${t.id || i}]`;
        if (!t.ask) out.push(w + ': no ask'); else line(w + '.ask', t.ask);
        if (!t.want) out.push(w + ': no want');
        if (!t.goal) out.push(w + ': no goal (the English task)');
        for (const k of ['simpler', 'starter', 'example', 'model']) if (t[k]) line(w + '.' + k, t[k]); else if (k !== 'simpler') out.push(w + ': no ' + k);
        arr(t.react).forEach((re, j) => { if (re.say) line(`${w}.react[${j}]`, re.say); if (re.next && !ids.has(re.next)) out.push(`${w}.react[${j}]: next '${re.next}' isn’t a turn here`); });
        if (!arr(t.react).some(re => !re.if)) out.push(w + ': no default reaction (one without if)');
      });
    };
    Object.values(C.scenes).forEach(sc => sceneCheck(sc, sc.id));
    C.threads.forEach(th => (th.steps || []).forEach((st, i) => { const w = `${th.id}.steps[${i}]`; if (st.turn) sceneCheck({ turns: [st.turn] }, w); else if (st.t !== undefined || Array.isArray(st)) line(w, st); else if (st.audio) line(w + '.audio', st.audio); }));
    Object.entries(C.memories).forEach(([k, m]) => line('memories.' + k, m));
    Object.entries(C.phrases).forEach(([k, p]) => { if (!p.t || !p.en) out.push('phrases.' + k + ': needs t and en'); if (!/^ph\.talk\./.test(k)) out.push('phrases.' + k + ': ids are ph.talk.<lang>.<name>'); if (cj) for (const q of CJK.validate(p.t, lang)) out.push('phrases.' + k + ': ' + q); });
    Object.entries(C.rewards).forEach(([who, rs]) => Object.entries(rs).forEach(([r, rw]) => { if (rw.phrase && !C.phrases[rw.phrase]) out.push(`rewards.${who}.${r}: phrase ${rw.phrase} isn’t in phrases`); if (rw.cosmetic && !COS[rw.cosmetic]) out.push(`rewards.${who}.${r}: no cosmetic ${rw.cosmetic}`); }));
    if (NOTYET[lang]) line('notyet', NOTYET[lang]);
    return out;
  }

  // ============================================================ the audit (DESIGN.md 16): what each scene asks for that a new player wouldn't know yet
  // TALK._.audit(lang) → { lang, summary, scenes: [{ id, band, at, turns: [{ turn, teach, beyond, example, want }] }] }
  // A new player at a scene's point (MIX.baseline: the prologue's words for rank 1; the first fights' words, yes and thanks
  // after the hill; all of Mimo's words from the first bell on), plus what this person's earlier ranks and this scene's
  // earlier turns taught (assuming the player used it). Per turn: teach, the new words its model and starter need (taught
  // before the question at run time; 3 at most); beyond, the ones past those 3 (past i+1: simplify the model); example,
  // the example's words that are neither known nor just taught (up to 3 are taught in the help when you ask for it; with
  // more, exampleLeftOut: the example is left out of the help at run time); want, true when every word the want accepts is
  // still new (nothing taught could answer it).
  function audit(lang = L()) {
    const C = CONTENT[lang];
    if (!C || typeof MIX === 'undefined' || typeof DICT === 'undefined' || !DICT.ready(lang)) return { lang, error: 'no content, no pack, or no mix.js' };
    const was = LEX.lang; LEX.lang = lang;          // (DICT and MIX read the language from LEX: switched for this synchronous run only)
    try {
      const base = [0, 1, 2].map(p => MIX.baseline(p));
      const lemma = id => { const e = DICT.entry(id); const s = e ? e.lemma || id : id; return isC(lang) ? charsOf(s, lang) : s; };
      const idsOf = t => MIX.ids(t, TEACH_POS);
      // (a rank's point: rank 1 when you meet them, 2 after the hill, 3+ after the bells; Bartolo and Cande are met after the
      // first bell, so all their ranks count from there; small talk opens after the hill, A2 and up from the first bell)
      const LATE = { bartolo: 2, cande: 2 };
      const pointOf = sc => { const m = /\.(\d)$/.exec(sc.id); const r = m && !sc.small ? +m[1] : 0; const p = r ? (r === 1 ? 0 : r === 2 ? 1 : 2) : ((sc.band || 1) <= 1 ? 1 : 2); return Math.max(p, LATE[sc.who] || 0); };
      const atText = ['meeting them (the prologue’s words)', 'after the hill (+ the first fights’ words)', 'from the first bell (all of Mimo’s words)'];
      const carried = {};                              // per person: what their earlier ranks taught
      const order = Object.values(C.scenes).slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
      const out = []; let turns = 0, taughtTurns = 0, teachN = 0, beyondTurns = 0, exampleTurns = 0, exampleTeach = 0, wantTurns = 0;
      for (const sc of order) {
        if (!sc.turns || !sc.turns.length) continue;
        const who = sc.small ? '_small.' + sc.id : sc.who || sc.id.split('.')[0], p = pointOf(sc);
        const known = new Set([...base[p], ...(carried[who] || [])]);
        const rows = [];
        for (const tn of sc.turns) {
          turns++;
          const md = lineOf(tn.model), sl = lineOf(tn.starter), ex = lineOf(tn.example);
          const mt = md ? fill(md.t, {}) : '', stt = sl ? fill(sl.t, {}).replace(/_{2,}/g, ' ') : '';
          const need = [...new Set(idsOf(stt).concat(idsOf(mt)))].filter(id => !known.has(id));
          const teach = need.slice(0, TEACH_MAX), beyond = need.slice(TEACH_MAX);
          const now = new Set([...known, ...teach]);
          const exLeft = ex ? [...new Set(idsOf(fill(ex.t, {})))].filter(id => !now.has(id)) : [];
          let wantNew = false;
          const w = tn.want || {};
          if (w.lemmas && !w.topic && !w.yesno && !w.number && !w.name && !w.any) {
            const ids = arr(w.lemmas).flatMap(x => { try { return (DICT.find(isC(lang) ? charsOf(String(x), lang) : String(x)) || []).map(e => e.id); } catch (e) { return []; } });
            wantNew = ids.length > 0 && !ids.some(id => now.has(id) || idsOf(mt).includes(id));
          }
          if (teach.length) { taughtTurns++; teachN += teach.length; }
          if (beyond.length) beyondTurns++; if (exLeft.length > TEACH_MAX) exampleTurns++; else if (exLeft.length) exampleTeach++; if (wantNew) wantTurns++;
          rows.push({ turn: tn.id || '', teach: teach.map(lemma), beyond: beyond.map(lemma), example: exLeft.map(lemma), exampleLeftOut: exLeft.length > TEACH_MAX, want: wantNew });
          teach.forEach(id => known.add(id));
        }
        if (!sc.small) carried[who] = new Set([...(carried[who] || []), ...[...known].filter(id => !base[p].has(id))]);
        out.push({ id: sc.id, band: sc.band || 1, at: atText[p], turns: rows });
      }
      return { lang, summary: { scenes: out.length, turns, turnsTeaching: taughtTurns, wordsTaught: teachN, turnsPastIplus1: beyondTurns, examplesTeachingInHelp: exampleTeach, examplesLeftOut: exampleTurns, wantsUnteachable: wantTurns }, scenes: out };
    } catch (e) { console.error('[talk] audit', e); return { lang, error: String(e) }; }
    finally { LEX.lang = was; }
  }

  return {
    init, update, ready, judge, content: addContent, contentOf: (l = L()) => CONTENT[l] || null, bond, bonds: bondList, nextFor, level: () => langLevel(), rank: id => bondState(id).rank, facts, fact: k => S().facts[k] || null,
    play, turn, say, offers, offersFor, talkFreely, smallTalk, recast, fill, lineOf, linesOf, diffHTML, nameOf, lookOf, cosmetic, setCosmetic, remember,
    cosmetics: () => Object.keys(S().cos).filter(id => COS[id]).map(id => ({ id, name: COS[id].name, on: !!S().cos[id].on })),
    BANDS, GRADES: GR, RANKS, LT, COINS,
    get state() { return S(); }, get busy() { return !!T.view; }, get game() { return G; },
    _: { T, test, pickReaction, reactedTo, clauseParts, phraseParts, factFrom, rankUp, scene, check, audit, preteach, langLevel, NOTYET, CONTENT, BOND, COS, smallBand, whoIs, yesNo, valence, namesIn,
      t: {
        get fast() { return T.fast; }, set fast(v) { T.fast = !!v; },
        get noGap() { return !!T.noGap; }, set noGap(v) { T.noGap = !!v; },
        get noLevel() { return !!T.noLevel; }, set noLevel(v) { T.noLevel = !!v; },
        get pick() { return T.pick || null; }, set pick(v) { T.pick = v || null; },
        say: text => (T.view && T.view.submit ? T.view.submit(text) : false),
        help: () => (T.view && T.view.help ? T.view.help() : false),
        esc: () => (T.view && T.view.quit ? T.view.quit() : false),
        next: () => (T.view && T.view.next ? T.view.next() : false),
        get waiting() { return !!(T.view && T.view.waiting); },
        get view() { return T.view; }, get log() { return T.log; },
      } },
  };
})();
