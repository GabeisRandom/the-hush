'use strict';
// Commands to several people at once (DESIGN.md 13.1 and 17.1: the Gray Marsh), shared by everything that hears them: the marsh's
// scenes (marsh.js: Candil's people, the boardwalk, the great lantern, the chapel) and the battles' team orders (flow.js reads them
// through TEAM.strip; a general team-orders mechanic can use the same table).
//   one  the familiar «tú / você / du» command to one (Mimo): «¡Salta!» · «Pula!» · «Spring!» · 跳！ · 跳んで！
//   you  to two or more of you («ustedes / vocês / ihr»): «¡Salten!» · «Pulem!» · «Springt!» · 你们跳！ · みんな、跳んで！
//   we   all of us, me too («let's»): «¡Saltemos!» (or «¡Vamos a saltar!») · «Vamos pular!» · «Springen wir!» (or «Lasst uns
//        springen!») · 我们一起跳吧！ · 跳ぼう！ (or 跳びましょう！)
// Each language has its own point: es -en / -emos (and the look-alikes «saltan» / «saltamos», which say what people do, not a
// command: an ending slip), pt «vamos + infinitive» and -em, de the ihr form (-t) and «wir» after the verb, zh 你们 and 我们…吧,
// ja the volitional (～おう / ～よう).
//   TEAM.read(text, lang)        → { verb: 'v.jump' | null, person: 'one' | 'you' | 'we' | null, letter: 'S'…'D', reason, slips,
//                                     said: the form heard, canon: the right sentence for that verb and person }
//   TEAM.model(verb, person, l)  → the model sentence (zh / ja in the CJK.md notation): «¡Salten!», «[你们|nǐ men] [跳|tiào] ！»
//   TEAM.frame(person, l)        → the frame for the box: «¡___en!» / «¡___emos!»…
//   TEAM.strip(text, l)          → { text, person, verb } with the team form swapped for the one form («¡Salten sobre la rana!» →
//                                     «¡Salta sobre la rana!»), or null: for a command parser that only knows the one form
//   TEAM.forms(verb, l)          → { one: [...], you: [...], we: [...] }    TEAM.VERBS: the verb ids it knows
// Needs core.js (norm); CJK (cjk.js) for zh / ja at run time.
const TEAM = (() => {
  // es / pt: [one, you, we…]; the look-alikes (an ending slip) in X: [you-ish, we-ish]
  const E = (one, you, we, inf, x1, x2) => ({ one: [one], you: [you], we: [we, 'vamos a ' + inf], x: [x1, x2] });
  const P = (one, you, inf, subj, x1, x2) => ({ one: [one], you: [you], we: ['vamos ' + inf, subj], x: [x1, x2] });
  const D = (one, you, inf) => ({ one: [one], you: [you], we: [inf + ' wir', 'lasst uns ' + inf, 'lass uns ' + inf], inf });
  // zh: the verb (notation); ja: [te-form, volitional, polite volitional] (notation)
  const T = {
    'v.push': { es: [E('empuja', 'empujen', 'empujemos', 'empujar', 'empujan', 'empujamos')], pt: [P('empurra', 'empurrem', 'empurrar', 'empurremos', 'empurram', 'empurramos')],
      de: [D('schieb', 'schiebt', 'schieben'), D('stoß', 'stoßt', 'stoßen'), D('schubs', 'schubst', 'schubsen')], zh: ['[推|tuī]'], ja: ['[押|お]して', '[押|お]そう', '[押|お]しましょう'] },
    'v.jump': { es: [E('salta', 'salten', 'saltemos', 'saltar', 'saltan', 'saltamos'), E('brinca', 'brinquen', 'brinquemos', 'brincar', 'brincan', 'brincamos')],
      pt: [P('pula', 'pulem', 'pular', 'pulemos', 'pulam', 'pulamos'), P('salta', 'saltem', 'saltar', 'saltemos', 'saltam', 'saltamos')],
      de: [D('spring', 'springt', 'springen'), D('hüpf', 'hüpft', 'hüpfen')], zh: ['[跳|tiào]'], ja: ['[跳|と]んで', '[跳|と]ぼう', '[跳|と]びましょう'] },
    'v.hit': { es: [E('golpea', 'golpeen', 'golpeemos', 'golpear', 'golpean', 'golpeamos'), E('pega', 'peguen', 'peguemos', 'pegar', 'pegan', 'pegamos')],
      pt: [P('bate', 'batam', 'bater', 'batamos', 'batem', 'batemos'), P('soca', 'soquem', 'socar', 'soquemos', 'socam', 'socamos')],
      de: [D('schlag', 'schlagt', 'schlagen'), D('hau', 'haut', 'hauen')], zh: ['[打|dǎ]'], ja: ['[打|う]って', '[打|う]とう', '[打|う]ちましょう'] },
    'v.throw': { es: [E('lanza', 'lancen', 'lancemos', 'lanzar', 'lanzan', 'lanzamos'), E('tira', 'tiren', 'tiremos', 'tirar', 'tiran', 'tiramos')],
      pt: [P('joga', 'joguem', 'jogar', 'joguemos', 'jogam', 'jogamos'), P('atira', 'atirem', 'atirar', 'atiremos', 'atiram', 'atiramos'), P('lança', 'lancem', 'lançar', 'lancemos', 'lançam', 'lançamos')],
      de: [D('wirf', 'werft', 'werfen')], zh: ['[扔|rēng]'], ja: ['[投|な]げて', '[投|な]げよう', '[投|な]げましょう'] },
    'v.swim': { es: [E('nada', 'naden', 'nademos', 'nadar', 'nadan', 'nadamos')], pt: [P('nada', 'nadem', 'nadar', 'nademos', 'nadam', 'nadamos')],
      de: [D('schwimm', 'schwimmt', 'schwimmen')], zh: ['[游泳|yóu yǒng]', '[游|yóu]'], ja: ['[泳|およ]いで', '[泳|およ]ごう', '[泳|およ]ぎましょう'] },
    'v.sing': { es: [E('canta', 'canten', 'cantemos', 'cantar', 'cantan', 'cantamos')], pt: [P('canta', 'cantem', 'cantar', 'cantemos', 'cantam', 'cantamos')],
      de: [D('sing', 'singt', 'singen')], zh: ['[唱歌|chàng gē]', '[唱|chàng]'], ja: ['[歌|うた]って', '[歌|うた]おう', '[歌|うた]いましょう'] },
    'v.climb': { es: [E('trepa', 'trepen', 'trepemos', 'trepar', 'trepan', 'trepamos'), E('sube', 'suban', 'subamos', 'subir', 'suben', 'subimos')],
      pt: [P('sobe', 'subam', 'subir', 'subamos', 'sobem', 'subimos')], de: [D('kletter', 'klettert', 'klettern')], zh: ['[爬|pá]'], ja: ['[登|のぼ]って', '[登|のぼ]ろう', '[登|のぼ]りましょう'] },
    'v.blow': { es: [E('sopla', 'soplen', 'soplemos', 'soplar', 'soplan', 'soplamos')], pt: [P('sopra', 'soprem', 'soprar', 'sopremos', 'sopram', 'sopramos')],
      de: [D('puste', 'pustet', 'pusten'), D('blas', 'blast', 'blasen')], zh: ['[吹|chuī]'], ja: ['[吹|ふ]いて', '[吹|ふ]こう', '[吹|ふ]きましょう'] },
    'v.light': { es: [E('ilumina', 'iluminen', 'iluminemos', 'iluminar', 'iluminan', 'iluminamos'), E('alumbra', 'alumbren', 'alumbremos', 'alumbrar', 'alumbran', 'alumbramos')],
      pt: [P('ilumina', 'iluminem', 'iluminar', 'iluminemos', 'iluminam', 'iluminamos')], de: [D('leucht', 'leuchtet', 'leuchten')], zh: ['[照亮|zhào liàng]', '[照|zhào]'], ja: ['[照|て]らして', '[照|て]らそう', '[照|て]らしましょう'] },
    'v.call': { es: [E('llama', 'llamen', 'llamemos', 'llamar', 'llaman', 'llamamos')], pt: [P('chama', 'chamem', 'chamar', 'chamemos', 'chamam', 'chamamos')],
      de: [D('ruf', 'ruft', 'rufen')], zh: ['[叫|jiào]'], ja: ['[呼|よ]んで', '[呼|よ]ぼう', '[呼|よ]びましょう'] },
    'v.dig': { es: [E('cava', 'caven', 'cavemos', 'cavar', 'cavan', 'cavamos')], pt: [P('cava', 'cavem', 'cavar', 'cavemos', 'cavam', 'cavamos')],
      de: [D('grab', 'grabt', 'graben')], zh: ['[挖|wā]'], ja: ['[掘|ほ]って', '[掘|ほ]ろう', '[掘|ほ]りましょう'] },
    'v.eat': { es: [E('come', 'coman', 'comamos', 'comer', 'comen', 'comemos')], pt: [P('come', 'comam', 'comer', 'comamos', 'comem', 'comemos')],
      de: [D('iss', 'esst', 'essen')], zh: ['[吃|chī]'], ja: ['[食|た]べて', '[食|た]べよう', '[食|た]べましょう'] },
  };
  const VERBS = Object.keys(T);
  // the words that say who: zh 你们 / 我们 (咱们), 一起 (together), 吧 (let's…); ja みんな / ふたり とも (everyone / both of you), いっしょに
  const ZH = { you: ['[你们|nǐ men]'], we: ['[我们|wǒ men]', '[咱们|zán men]'], together: '[一起|yī qǐ]', ba: '[吧|ba]' };
  const JA = { you: ['みんな', 'ふたり とも', '[二人|ふたり] とも', 'みなさん', '[皆|みな]さん'], together: 'いっしょ に' };
  const cj = l => l === 'zh' || l === 'ja';
  const isC = () => typeof CJK !== 'undefined';
  // es / pt / de: a word as it's compared (no accents, case or punctuation; German ß and umlauts written out count too)
  const fold = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const foldDe = s => fold(String(s).toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue'));
  const F = (s, l) => (l === 'de' ? foldDe(s) : fold(s));
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);     // (two letters swapped: one slip)
    }
    return d[a.length][b.length];
  }
  // zh / ja: what's compared: the CJK engine's key (toneless pinyin / rōmaji, no spaces; characters through its dictionary), and
  // the characters themselves (its dictionary doesn't always split a new form right: «を打とう»)
  const key = (s, l) => (isC() ? CJK.canon(isC() && /\[/.test(s) ? CJK.plain(s, { lang: l }) : s, l) : fold(s).replace(/\s/g, ''));
  const surf = (src, l) => (isC() && CJK.chars ? String(CJK.chars(src, { lang: l })).replace(/\s/g, '') : '');
  const typedHas = (text, src, l) => { const k = key(text, l), fk = key(src, l), sf = surf(src, l); return (!!fk && k.includes(fk)) || (!!sf && String(text).replace(/\s/g, '').includes(sf)); };
  let fed = false;
  function feed() {          // (the CJK engine's dictionary learns every form, so typed characters read back)
    if (fed || !isC() || !CJK.addSource) return; fed = true;
    const all = [ZH.you[0], ZH.we[0], ZH.we[1], ZH.together, ZH.ba, ...JA.you, JA.together];
    for (const v of VERBS) { all.push(...(T[v].zh || []), ...(T[v].ja || [])); }
    for (const s of all) { try { CJK.addSource(s); } catch (e) { /* (optional) */ } }
  }
  function forms(verb, l) {
    const t = T[verb]; if (!t || !t[l]) return null;
    if (l === 'zh') { const v = t.zh; return { one: v, you: v.map(x => ZH.you[0] + ' ' + x), we: v.map(x => ZH.we[0] + ' ' + ZH.together + ' ' + x + ' ' + ZH.ba) }; }
    if (l === 'ja') { const [te, vol, pol] = t.ja; return { one: [te], you: JA.you.slice(0, 2).map(w => w + ' 、 ' + te), we: [vol, pol, JA.together + ' ' + vol] }; }
    const out = { one: [], you: [], we: [] };
    for (const e of t[l]) { out.one.push(...e.one); out.you.push(...e.you); out.we.push(...e.we); }
    return out;
  }
  // the model sentence: the first form, as a command (es ¡…!, zh / ja in the notation)
  function model(verb, person, l) {
    const f = forms(verb, l); if (!f) return '';
    const s = (f[person] || f.one)[0];
    if (l === 'zh') return s + ' ！';
    if (l === 'ja') return s + ' ！';
    const cap = s.charAt(0).toUpperCase() + s.slice(1);
    return l === 'es' ? '¡' + cap + '!' : cap + '!';
  }
  const FRAMES = {
    you: { es: '«¡___en!» / «¡___an!» (ustedes)', pt: '«___em!» / «___am!» (vocês)', de: '«___t!» (ihr)', zh: '[你们|nǐ men] ___ ！', ja: 'みんな 、 ___て ！' },
    we: { es: '«¡___emos!» / «¡___amos!» (nosotros)', pt: '«Vamos ___!»', de: '«___en wir!»', zh: '[我们|wǒ men] [一起|yī qǐ] ___ [吧|ba] ！', ja: '___よう ！ / ___おう ！' },
    one: { es: '«¡___a!»', pt: '«___a!»', de: '«___!»', zh: '___ ！', ja: '___て ！' },
  };
  const frame = (person, l) => (FRAMES[person] || FRAMES.one)[l] || '';

  // ---------------------------------------------------------------- reading what you typed
  // es / pt / de: every form as words; the longest that's in the text (or one letter off, for a word of 5 or more) wins
  function readLatin(text, l, o) {
    const said = ' ' + F(text, l) + ' ', words = said.trim().split(' ');
    let best = null;
    const consider = (verb, person, form, exact, slip, bonus = 0) => {
      const k = (exact ? 100 : 0) + form.length + (o.verb === verb ? 50 : 0) + bonus;
      if (!best || k > best.k) best = { verb, person, form, exact, slip, k };
    };
    for (const verb of (o.verbs || VERBS)) {
      const t = T[verb] && T[verb][l]; if (!t) continue;
      for (const e of t) {
        for (const person of ['we', 'you', 'one']) for (const form of e[person]) {
          const ff = F(form, l);
          if (said.includes(' ' + ff + ' ')) { consider(verb, person, form, true, null); continue; }
          if (ff.includes(' ')) continue;
          if (ff.length >= 5) for (const w of words) if (w.length >= 4 && lev(w, ff) === 1) consider(verb, person, form, false, 'spelling');
        }
        // the look-alikes: what people do, not a command («saltan», «saltamos»): an ending slip
        if (e.x) e.x.forEach((form, i) => { if (form && said.includes(' ' + F(form, l) + ' ')) consider(verb, i ? 'we' : 'you', form, false, 'ending', 2); });
        // German: the infinitive alone for «let's» («Springen!»): say «wir»
        if (l === 'de' && e.inf && said.includes(' ' + F(e.inf, l) + ' ') && !said.includes(' wir ') && !said.includes(' uns ')) consider(verb, 'we', e.inf, false, 'wir');
      }
    }
    return best;
  }
  // zh: the verb, then who: 你们 → you; 我们 / 咱们 / 一起 with 吧 → we (one of them missing: still we, an A); nothing → one
  function readZh(text, o) {
    const k = key(text, 'zh');
    let best = null;
    for (const verb of (o.verbs || VERBS)) for (const v of (T[verb].zh || [])) { const vk = key(v, 'zh'); if (vk && typedHas(text, v, 'zh') && (!best || vk.length > best.vk.length || o.verb === verb)) best = { verb, vk, form: v }; }
    if (!best) return null;
    const has = s => typedHas(text, s, 'zh');
    const you = has(ZH.you[0]), we = ZH.we.some(has), tog = has(ZH.together), ba = /ba$/.test(k);
    let person = 'one', slip = null;
    if (you && !we) person = 'you';
    else if (we || (tog && ba)) { person = 'we'; if (!ba) slip = 'ba'; }
    else if (ba) { person = 'we'; slip = 'women'; }
    return { verb: best.verb, person, form: best.form, exact: !slip, slip };
  }
  // ja: the volitional (～おう / ～よう, ～ましょう) → we; the te-form with みんな / ふたり とも → you; the te-form alone → one
  function readJa(text, o) {
    const k = key(text, 'ja');
    let best = null;
    for (const verb of (o.verbs || VERBS)) {
      const [te, vol, pol] = T[verb].ja || []; if (!te) continue;
      for (const [form, person] of [[vol, 'we'], [pol, 'we'], [te, 'one']]) { const fk = key(form, 'ja'); if (fk && typedHas(text, form, 'ja') && (!best || fk.length > best.fk.length)) best = { verb, person, form, fk }; }
    }
    if (!best) return null;
    let slip = null;
    if (best.person === 'one' && JA.you.some(w => typedHas(text, w, 'ja'))) best.person = 'you';
    return { verb: best.verb, person: best.person, form: best.form, exact: !slip, slip };
  }
  const REASON = { spelling: 'Spelling slip', ending: 'Ending slip', wir: 'Say «wir»', ba: '吧 makes it «let’s»', women: 'Say who: 我们', who: 'Say who: みんな' };
  // o: { want: 'you' | 'we' (the person the task wants; a ja te-form alone then counts as «you», an A), verb (the one it wants),
  //      verbs: the ids to listen for }
  function read(text, l, o = {}) {
    feed();
    const r = l === 'zh' ? readZh(text, o) : l === 'ja' ? readJa(text, o) : readLatin(text, l, o);
    if (!r) return { verb: null, person: null, letter: null, reason: '', slips: [], said: '' };
    let slip = r.slip;
    if (l === 'ja' && o.want === 'you' && r.person === 'one') { r.person = 'you'; slip = 'who'; }
    // the right verb and person with a slip: B for a letter, C for an ending, A for a missing 吧 / みんな / «wir»
    const letter = !slip ? 'S' : slip === 'spelling' ? 'B' : slip === 'ending' ? 'C' : 'A';
    return { verb: r.verb, person: r.person, letter, reason: slip ? REASON[slip] : 'Perfect sentence!', slips: slip ? [slip] : [], said: r.form, canon: model(r.verb, r.person, l) };
  }
  // for a command parser that only knows the one form: the team form swapped for it ({ text, person, verb }), or null
  function strip(text, l) {
    feed();
    const s = String(text);
    if (l === 'zh' || l === 'ja') {
      const r = read(s, l); if (!r.verb || r.person === 'one') return null;
      const one = forms(r.verb, l).one[0], plain = isC() ? CJK.plain(one, { lang: l }) : one;
      // (the rest of the sentence: the target, read by the parser as usual; the who-words and 吧 / the volitional go)
      let rest = s;
      const drop = l === 'zh' ? ['你们', '我们', '咱们', '一起', '吧', 'nǐmen', 'nimen', 'wǒmen', 'women', 'zánmen', 'zanmen', 'yīqǐ', 'yiqi'] : ['みんな', 'ふたりとも', '二人とも', 'みなさん', '皆さん', 'いっしょに', '一緒に', 'minna', 'futaritomo', 'issho ni', 'isshoni'];
      for (const w of drop) rest = rest.split(w).join(' ');
      if (l === 'zh') rest = rest.replace(/(^|\s)ba(\s*[!！]?\s*)$/i, '$2');
      if (l === 'ja') {        // (the volitional back to the te-form, as characters or as rōmaji: 打とう / utō / utou / uto → 打って / utte)
        const [te, vol, pol] = T[r.verb].ja, ro = x => (isC() && CJK.roman ? String(CJK.roman(x, { lang: 'ja', cap: false })).toLowerCase().replace(/\s/g, '') : '');
        const teS = surf(te, 'ja'), teR = ro(te);
        for (const f of [pol, vol]) {
          const s1 = surf(f, 'ja'), r1 = ro(f);
          if (s1) rest = rest.split(s1).join(teS);
          if (r1) for (const v of [r1, r1.replace(/ō/g, 'ou'), r1.replace(/ō/g, 'o'), r1.replace(/ō/g, 'oo')]) rest = rest.replace(new RegExp(v + '(?![a-z])', 'gi'), teR);
        }
      }
      rest = rest.replace(/[、，,]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!rest || !/[^\s!！。.]/.test(rest)) rest = plain + '！';
      return { text: rest, person: r.person, verb: r.verb };
    }
    const r = readLatin(s, l, {});
    if (!r || r.person === 'one') return null;
    const one = T[r.verb][l][0].one[0];
    // swap the words of the form for the one form (keeping what comes after it: the target)
    const words = s.split(/(\s+)/), ff = F(r.form, l).split(' ');
    for (let i = 0; i < words.length; i++) {
      if (F(words[i], l) !== ff[0] && lev(F(words[i], l), ff[0]) > 1) continue;
      let j = i, n = 0; const idx = [];
      while (j < words.length && n < ff.length) { if (/\S/.test(words[j])) { idx.push(j); n++; } j++; }
      const lead = (words[idx[0]].match(/^[¡¿«"]*/) || [''])[0], tail = (words[idx[idx.length - 1]].match(/[!?.,»"]*$/) || [''])[0];
      idx.forEach((k, m) => { words[k] = m === 0 ? lead + one + (idx.length === 1 ? tail : '') : m === idx.length - 1 ? tail : ''; });
      return { text: words.join('').replace(/\s+/g, ' ').replace(/\s+([!?.,])/g, '$1').trim(), person: r.person, verb: r.verb };
    }
    return null;
  }
  return { read, model, frame, forms, strip, VERBS, FRAMES, _: { T, lev, fold, key, readLatin, readZh, readJa } };
})();
