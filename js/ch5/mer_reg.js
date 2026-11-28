'use strict';
// Chapter 5, «Meridiana» (CH5-W1; DESIGN.md 21.22): register, by setting. In Meridiana every person you talk to is formal or casual
// by who they are and where you meet them (an office, an official, a vendor, an elder: formal; Noa, your brother, students, kids:
// casual). What you type is read for the register it uses, and a turn graded by TALK (talk.js) gets a register check on top:
//   es  usted / ustedes, the usted imperatives (disculpe, dígame, oiga), a request in the 3rd person («¿Me puede…?») · tú / te / ti /
//       contigo / tu, the tú forms (puedes, dime, oye), slang (güey, mano, qué onda)
//   pt  o senhor / a senhora (+ «por gentileza») · tu / teu / contigo / cê, slang (mano, valeu, beleza, e aí); «você» is neutral
//       in Brazil (a formal place takes it, with a tip that «o senhor / a senhora» sounds more respectful)
//   de  Sie / Ihnen / Ihr (capitalized; «Können Sie…?», «Entschuldigen Sie») · du / dich / dir / dein, the du forms (kannst, gib)
//   zh  您 (+ 请问 / 麻烦您 / 劳驾) · 你 (a polite marker softens it)
//   ja  です・ます endings, ください, いただけますか (keigo counts double) · plain endings (だ, the dictionary form), じゃん, ちょうだい
// The wrong register where it matters (casual to an official) is a real mistake: a B at best, with a tip. The other way round (usted
// to your little brother) is only a note: an A at best. A sentence with no "you" in it at all («Quisiera devolver esta tetera») fits
// either: register only shows when you address someone.
//   REG.read(text, lang)                → { reg: 'formal' | 'casual' | 'mixed' | 'none', f: [formal cues], c: [casual cues], polite }
//   REG.grade(text, want, lang)         → { ok, sev: null | 'minor' | 'major', code, tip, read }   (want: 'formal' | 'casual')
//   REG.apply(r, want, lang)            the same on a TALK.judge result: adds the error, worsens the grade (a turn's check)
//   REG.chip(want, lang)                the chip by a person's name: «usted» / «tú», «o senhor» / «você», «Sie» / «du», 您 / 你, です・ます / タメ口
//   REG.tests(lang) → { pass, fail, fails }
const REG = (() => {
  const nrm = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss');
  const toks = s => nrm(s).replace(/[¿?¡!.,;:«»"“”()…]/g, ' ').split(/\s+/).filter(Boolean);
  const isCJ = l => l === 'zh' || l === 'ja';
  const has = (list, w) => list.includes(w);
  // ------------------------------------------------------------ the cues, per language
  const ES = {
    fPron: ['usted', 'ustedes', 'ud', 'uds', 'vd', 'vds'],
    fVerb: ['disculpe', 'disculpeme', 'perdone', 'perdoneme', 'oiga', 'mire', 'digame', 'diganme', 'permitame', 'espere', 'fijese', 'venga', 'tenga', 'sientese', 'pase', 'ayudeme', 'expliqueme',
      'deme', 'pongame', 'cambieme', 'devuelvame', 'muestreme', 'enseneme', 'regaleme', 'indiqueme', 'confirmeme', 'avisenme', 'aviseme', 'llameme', 'escribame', 'digale', 'tome', 'firme', 'llene', 'traiga', 'traigame', 'disculpen', 'perdonen'],
    // a request to the listener in the 3rd person: «¿Me puede…?», «¿Podría…?», «¿Le importaría…?», «¿Sería tan amable…?»
    // (only where a request starts: the sentence's first words, or right after «¿» / «disculpe,»: «Mi amiga quiere…» is about her)
    fAsk: /(^|[¿.!]\s*|(?:disculpe|perdone|oiga|senor|senora|senorita|licenciada|licenciado|profesor|profesora|don|dona)\s*,?\s*¿?\s*)(me |nos |le )?(puede|podria|quiere|querria|sabe|tiene|habria|seria tan amable|le importaria|le molestaria|me permite|me podria|nos podria|me puede|nos puede)\b/,
    cPron: ['tu', 'ti', 'contigo', 'vos', 'tus'],
    cWord: ['oye', 'dime', 'mira', 'porfa', 'guey', 'wey', 'mano', 'carnal', 'compa', 'chido', 'neta', 'onda', 'bro', 'brother'],
    cObj: ['te'],
    notVerb: ['tardes', 'noches', 'ganas', 'veces', 'llaves', 'clases', 'calles', 'partes', 'gracias', 'pases', 'cortes'],
  };
  const PT = {
    fPron: ['o senhor', 'a senhora', 'os senhores', 'as senhoras', 'do senhor', 'da senhora', 'ao senhor', 'a senhora', 'pro senhor', 'pra senhora', 'vossa'],
    fWord: ['por gentileza', 'com licenca', 'gostaria', 'poderia', 'seria possivel'],
    cPron: ['tu', 'teu', 'tua', 'teus', 'tuas', 'contigo', 'ce', 'oce'],
    cWord: ['mano', 'cara', 'velho', 'vei', 'valeu', 'beleza', 'e ai', 'ta ligado', 'fala ai', 'firmeza', 'parca', 'brother', 'bro', 'mina', 'bora'],
    neutral: ['voce', 'voces'],
  };
  const DE = {
    cPron: ['du', 'dich', 'dir', 'dein', 'deine', 'deinen', 'deinem', 'deiner', 'deines', 'euch', 'euer', 'eure'],
    cWord: ['alter', 'digga', 'krass', 'hey', 'na', 'ey'],
    fVerbFirst: /^(konnen|konnten|wurden|durfen|mochten|haben|sind|wissen|geben|helfen|zeigen|entschuldigen|sagen|warten|nehmen|schauen|sehen|bringen|erklaren|horen|verzeihen)\b/,
  };
  const ZH = {
    f: ['[您|nín]'], fPol: ['[请问|qǐng wèn]', '[麻烦|má fan]', '[劳驾|láo jià]', '[请|qǐng]', '[不好意思|bù hǎo yì si]', '[打扰|dǎ rǎo]'],
    // (呗 is read off the characters only: toneless «bei» is also 被, the passive's word)
    c: ['[你|nǐ]'], cWord: ['[哥们|gē men]', '[兄弟|xiōng di]', '[咱|zán]', '[哈|hā]'],
  };
  // ja: polite endings and words (kana, kanji and rōmaji are all read through CJK.canon); plain ones
  const JA = {
    f: ['desu', 'deshita', 'deshou', 'masu', 'mashita', 'masen', 'mashou', 'masenka', 'kudasai', 'itadake', 'itadaki', 'onegaishimasu', 'moushimasu', 'gozaimasu', 'irasshai', 'yoroshii', 'sumimasen', 'shitsurei'],
    honor: ['itadake', 'itadaki', 'irasshai', 'moushimasu', 'gozaimasu', 'yoroshii', 'ukagai', 'haiken', 'mairi'],
    c: ['jan', 'chodai', 'choudai', 'kureru', 'kurenai', 'nee', 'oi', 'dayo', 'dane', 'dakara', 'dayone', 'yoroshiku na', 'arigatou ne', 'gomen ne', 'nanda'],
  };
  // ------------------------------------------------------------ reading a text
  function readES(text) {
    const t = ' ' + toks(text).join(' ') + ' ', w = toks(text), f = [], c = [];
    for (const x of w) { if (has(ES.fPron, x)) f.push(x); else if (has(ES.fVerb, x)) f.push(x); else if (has(ES.cPron, x)) c.push(x); else if (has(ES.cWord, x)) c.push(x); }
    // («te» is always the casual you; «tu» as a word is the possessive or «tú»: both casual)
    for (const x of w) if (has(ES.cObj, x)) c.push(x);
    if (ES.fAsk.test(nrm(text))) f.push('3sg-request');
    // the dictionary's reading: a verb in the 2nd person singular that isn't usted's (puedes, podrías, dime, devuelvas) is casual;
    // an imperative it marks formal (dígame) is formal
    try {
      if (typeof DICT !== 'undefined' && DICT.ready && DICT.ready('es')) {
        const a = DICT.analyze(text) || {}, W = (a.words || []).filter(x => !x.punct);
        W.forEach((x, i) => {
          const F = x.f || {}, prev = i ? nrm(W[i - 1].t) : '';
          // (a noun that looks like a tú verb: «Buenas tardes», «las ganas»: a determiner or an adjective before it)
          if (x.pos === 'v' && F.person === 2 && F.number === 's' && !F.formal && !/^(oye|mira)$/.test(nrm(x.t)) && !ES.notVerb.includes(nrm(x.t)) && !/^(buenas|buenos|las|los|unas|unos|mis|sus|tus|muchas|muchos|tantas|todas|todos|esas|estas|otras|pocas|dos|tres)$/.test(prev)) c.push(nrm(x.t));
        });
        for (const x of a.words || []) {
          const F = x.f || {};
          if (x.pos === 'v' && F.mood === 'imp' && F.formal) f.push(nrm(x.t));
        }
      }
    } catch (e) { /* (no pack: the word lists alone) */ }
    return { f: [...new Set(f)], c: [...new Set(c)] };
  }
  function readPT(text) {
    const t = ' ' + toks(text).join(' ') + ' ', w = toks(text), f = [], c = [], n = [];
    for (const p of PT.fPron) if (t.includes(' ' + p + ' ')) f.push(p);
    for (const p of PT.fWord) if (t.includes(' ' + p + ' ')) f.push(p);
    for (const x of w) { if (has(PT.cPron, x)) c.push(x); if (has(PT.neutral, x)) n.push(x); }
    for (const p of PT.cWord) if (t.includes(' ' + p + ' ')) c.push(p);
    try {
      if (typeof DICT !== 'undefined' && DICT.ready && DICT.ready('pt')) {
        const a = DICT.analyze(text) || {};
        for (const x of a.words || []) { const F = x.f || {}; if (x.pos === 'v' && F.person === 2 && F.number === 's' && !F.formal) c.push(nrm(x.t)); }
      }
    } catch (e) { /* */ }
    return { f: [...new Set(f)], c: [...new Set(c)], n };
  }
  function readDE(text) {
    const f = [], c = [];
    const raw = String(text || ''), sents = raw.split(/(?<=[.!?])\s+/);
    for (const s of sents) {
      const words = s.replace(/[¿?¡!.,;:«»"“”()…]/g, ' ').split(/\s+/).filter(Boolean);
      words.forEach((wd, i) => {
        const lw = nrm(wd);
        if (/^(Sie|Ihnen|Ihr|Ihre|Ihren|Ihrem|Ihrer|Ihres)$/.test(wd) && i > 0) f.push(wd);
        else if (/^(Sie)$/.test(wd) && i === 0 && words[1] && /^(haben|sind|konnen|konnten|wurden|durfen|mussen|mochten|wissen)$/.test(nrm(words[1]))) f.push('Sie');
        if (has(DE.cPron, lw)) c.push(lw);
        if (i === 0 && has(DE.cWord, lw)) c.push(lw);
      });
    }
    try {
      if (typeof DICT !== 'undefined' && DICT.ready && DICT.ready('de')) {
        const a = DICT.analyze(text) || {};
        // (a du-form: an imperative, or a present in -st the 3rd person can't share: «gehst», «hast», «kannst»; «heißt», «isst», «sitzt» are
        // «er» forms too, «…und heißt Mimo»)
        for (const x of a.words || []) {
          const F = x.f || {}; if (x.pos !== 'v') continue;
          if ((F.mood === 'imp' && F.number !== 'p' && !F.formal) || (F.person === 2 && F.number === 's' && /[^sßzx]st$/i.test(x.t))) c.push(nrm(x.t));
        }
      }
    } catch (e) { /* */ }
    return { f: [...new Set(f)], c: [...new Set(c)] };
  }
  const cjHas = (text, src, l) => { try { return !!(typeof CJK !== 'undefined' && CJK.contains(text, src, l)); } catch (e) { return false; } };
  function readZH(text) {
    const f = [], c = [], pol = [];
    for (const s of ZH.f) if (cjHas(text, s, 'zh')) f.push(s);
    for (const s of ZH.fPol) if (cjHas(text, s, 'zh')) pol.push(s);
    // (你: as a word, not inside 你们 alone; 你好 is a greeting and still «you»)
    for (const s of ZH.c) if (cjHas(text, s, 'zh')) c.push(s);
    for (const s of ZH.cWord) if (cjHas(text, s, 'zh')) c.push(s);
    if (/呗/.test(String(text || ''))) c.push('呗');
    // (a typed «nin» with no tone is 您; «ni» is 你: CJK.contains reads both scripts)
    return { f, c: c.filter(x => !(f.length && x === '[你|nǐ]' && /您/.test(String(text)))), pol };
  }
  function readJA(text) {
    let k = '';
    try { k = typeof CJK !== 'undefined' ? CJK.canon(String(text || ''), 'ja') : nrm(text); } catch (e) { k = nrm(text); }
    k = ' ' + String(k).replace(/[^a-z]+/g, ' ') + ' ';
    const kk = k.replace(/\s+/g, ''), f = [], c = [], hon = [];
    // (CJK.canon runs the words together: «ねえ、…» at the start, the way you call a friend, is read off the text itself)
    if (/^\s*(ねえ|ねぇ|ねー|ね\s*[、,]|(nē|nee|ne)(?=\s*[,、]|\s|$))/i.test(String(text || ''))) c.push('nee');
    for (const p of JA.f) if (kk.includes(p)) f.push(p);
    for (const p of JA.honor) if (kk.includes(p)) hon.push(p);
    for (const p of JA.c) if (p.includes(' ') ? k.includes(' ' + p + ' ') : new RegExp(`(^|\\s)${p}(\\s|$)`).test(k) || kk.endsWith(p)) c.push(p);
    // each sentence's last predicate: polite (です / ます / ください) or plain; a plain one where you speak to someone is casual
    try {
      if (typeof DICT !== 'undefined' && DICT.ready && DICT.ready('ja')) {
        const sents = String(text || '').split(/(?<=[。！？!?])/).map(s => s.trim()).filter(s => /[\p{L}]/u.test(s));
        for (const s of sents) {
          const a = DICT.analyze(s) || {}, vs = (a.words || []).filter(x => x.pos === 'v' || x.pos === 'aux' || /^(です|だ|でした|だった|ます|ました)$/.test(x.t));
          const last = vs[vs.length - 1]; if (!last) continue;
          const F = last.f || {};
          if (F.polite || /(ます|ました|ません|です|でした|ください)$/.test(last.t)) f.push('end:' + last.t);
          else if (F.form === 'dict' || /^(だ|だった)$/.test(last.t) || F.form === 'te' || F.tense) c.push('end:' + last.t);
        }
      }
    } catch (e) { /* */ }
    return { f: [...new Set(f)], c: [...new Set(c)], hon };
  }
  const READ = { es: readES, pt: readPT, de: readDE, zh: readZH, ja: readJA };
  function read(text, l) {
    const fn = READ[l]; if (!fn || !String(text || '').trim()) return { reg: 'none', f: [], c: [] };
    const o = fn(text);
    o.reg = o.f.length && o.c.length ? 'mixed' : o.f.length ? 'formal' : o.c.length ? 'casual' : 'none';
    // (ja: a polite sentence with a casual word in it, «すみません、ちょうだい», is mixed; two polite endings and «ね» is fine)
    return o;
  }
  // ------------------------------------------------------------ grading against the setting
  const TIP = {
    formal: {
      es: 'This is someone you say «usted» to: «¿Me puede…?», «¿Podría…?», «disculpe», «dígame», never «tú» or «te».',
      pt: 'To an official or an older stranger: «o senhor / a senhora» (O senhor poderia…?), never «tu» or slang.',
      de: 'Here it’s «Sie»: «Können Sie…?», «Entschuldigen Sie», «Ihnen», never «du».',
      zh: 'To an official or an elder, say 您 (nín), not 你 (nǐ); 请问 / 麻烦您 make a request polite.',
      ja: 'To a stranger at work, end every sentence politely: です・ます, «〜ていただけませんか».',
    },
    mixed: {
      es: 'You mixed «usted» and «tú». Pick one: here it’s «usted» all the way (puede, le, su).',
      pt: 'You mixed «o senhor» and «tu». Here it’s «o senhor / a senhora» all the way.',
      de: 'You mixed «Sie» and «du». Here it’s «Sie» all the way (Ihnen, Ihr).',
      zh: 'You mixed 您 and 你. Here it’s 您 all the way.',
      ja: 'Some sentences ended plain. Here every sentence ends with です・ます.',
    },
    casual: {
      es: 'No need for «usted» here: friends and family say «tú» («¿Puedes…?», «oye», «dime»).',
      pt: '«O senhor / a senhora» sounds far too stiff with friends: «você» (or «tu») is fine.',
      de: 'With friends and family it’s «du»: «Kannst du…?», «Sag mal…».',
      zh: '您 is for elders and officials; with friends and family it’s just 你.',
      ja: 'With friends and family, plain endings are friendlier: «〜てくれる？», «〜だよ».',
    },
    youNeutral: { pt: 'Good! With an official, «o senhor / a senhora» sounds even more respectful than «você».', zh: 'Good! 您 instead of 你 sounds more respectful to an official.' },
  };
  function grade(text, want, l) {
    const r = read(text, l), out = { ok: true, sev: null, code: null, tip: '', read: r };
    if (want === 'formal') {
      if (l === 'zh') {
        // 你 with a polite marker (请, 请问, 麻烦) is only a note; 你 alone to an official is the mistake
        if (r.c.length && !r.f.length) { out.ok = false; out.sev = r.pol && r.pol.length ? 'minor' : 'major'; out.code = 'register'; out.tip = TIP.formal.zh; }
        else if (r.c.length && r.f.length) { out.ok = false; out.sev = 'minor'; out.code = 'register.mixed'; out.tip = TIP.mixed.zh; }
        return out;
      }
      if (l === 'ja') {
        if (r.c.length && !r.f.length) { out.ok = false; out.sev = 'major'; out.code = 'register'; out.tip = TIP.formal.ja; }
        else if (r.c.some(x => /^end:/.test(x)) && r.f.length) { out.ok = false; out.sev = 'minor'; out.code = 'register.mixed'; out.tip = TIP.mixed.ja; }
        return out;
      }
      if (r.reg === 'casual') { out.ok = false; out.sev = 'major'; out.code = 'register'; out.tip = TIP.formal[l] || ''; }
      else if (r.reg === 'mixed') { out.ok = false; out.sev = 'major'; out.code = 'register.mixed'; out.tip = TIP.mixed[l] || ''; }
      else if (l === 'pt' && r.reg === 'none' && (r.n || []).length) { out.sev = 'note'; out.tip = TIP.youNeutral.pt; }
      return out;
    }
    if (want === 'casual') {
      if (r.reg === 'formal' || r.reg === 'mixed') { out.ok = false; out.sev = 'minor'; out.code = 'register.stiff'; out.tip = TIP.casual[l] || ''; }
      return out;
    }
    return out;
  }
  // a TALK.judge result (talk.js turn's check): the register's mistake goes in with the others and the grade follows the rules
  // (a real mistake: B at best; two real mistakes: C; a note: A at best)
  const ORDER = 'SABCD';
  const worse = (g, at) => ORDER[Math.max(ORDER.indexOf(g || 'S'), ORDER.indexOf(at))];
  function apply(r, want, l) {
    if (!r || !r.understood || !want) return r;
    const g = grade(r.text, want, l);
    r.register = g;
    if (!g.sev || g.sev === 'note') { if (g.tip && g.sev === 'note') r.tips = [...new Set((r.tips || []).concat(g.tip))]; return r; }
    const major = g.sev === 'major';
    (r.errors = r.errors || []).push({ code: g.code, sev: major ? 'major' : 'minor', at: null, fix: '', tip: g.tip, register: true });
    if (major) r.major = (r.major || 0) + 1; else r.minor = (r.minor || 0) + 1;
    r.grade = worse(r.grade, major ? (r.major >= 2 ? 'C' : 'B') : 'A');
    r.tips = [...new Set((r.tips || []).concat(g.tip))];
    return r;
  }
  // the chip by a person's name: what you say to them
  const CHIP = {
    formal: { es: 'usted', pt: 'o senhor / a senhora', de: 'Sie', zh: '[您|nín]', ja: 'です・ます' },
    casual: { es: 'tú', pt: 'você', de: 'du', zh: '[你|nǐ]', ja: 'タメ[口|ぐち]' },
  };
  const chip = (want, l) => (CHIP[want] || {})[l] || '';
  // ------------------------------------------------------------ tests: [text, register it reads as]
  const CASES = {
    es: [['¿Me puede ayudar, por favor?', 'formal'], ['¿Me puedes ayudar?', 'casual'], ['Disculpe, ¿dónde está la ventanilla?', 'formal'], ['Oye, ¿dónde está la ventanilla?', 'casual'],
      ['Dígame qué documentos necesita.', 'formal'], ['Dime qué necesitas.', 'casual'], ['Usted tiene razón.', 'formal'], ['Tienes razón.', 'casual'], ['Quisiera devolver esta tetera.', 'none'],
      ['¿Le importaría cambiármela?', 'formal'], ['¿Te importaría cambiármela?', 'casual'], ['Necesito que me devuelvas el dinero.', 'casual'], ['¿Podría darme un recibo?', 'formal'],
      ['Mire, la tetera no funciona.', 'formal'], ['Ya llegué, güey.', 'casual'], ['Perdone, ¿usted es la encargada?', 'formal'], ['¿Usted me puede ayudar? Gracias, te lo agradezco.', 'mixed'],
      ['Buenos días. Mi amiga quiere inscribirse.', 'none'], ['¿Sabe a qué hora abre la oficina?', 'formal'], ['¿Sabes a qué hora abre?', 'casual']],
    pt: [['O senhor pode me ajudar?', 'formal'], ['A senhora poderia ver isso, por gentileza?', 'formal'], ['Tu podes me ajudar?', 'casual'], ['Valeu, mano!', 'casual'], ['Você pode me ajudar?', 'none'],
      ['Eu gostaria de devolver esta chaleira.', 'formal'], ['E aí, beleza?', 'casual'], ['Com licença, onde fica a secretaria?', 'formal'], ['Cê viu a Noa?', 'casual'], ['Bom dia. Minha amiga quer se matricular.', 'none']],
    de: [['Können Sie mir helfen?', 'formal'], ['Kannst du mir helfen?', 'casual'], ['Entschuldigen Sie, wo ist das Büro?', 'formal'], ['Entschuldige, wo ist das Büro?', 'none'], ['Ich hätte gern mein Geld zurück.', 'none'],
      ['Gib mir das Buch.', 'casual'], ['Geben Sie mir bitte das Buch.', 'formal'], ['Haben Sie einen Moment?', 'formal'], ['Hast du einen Moment?', 'casual'], ['Ich danke Ihnen.', 'formal'], ['Danke dir!', 'casual'],
      ['Es ist in Alba geschlüpft und heißt Mimo.', 'none'], ['Wie heißt du?', 'casual'], ['Gehst du heute in die Bibliothek?', 'casual']],
    zh: [['[成绩单|chéng jì dān] [被|bèi] [送到|sòng dào] [了|le] [图书馆|tú shū guǎn] 。', 'none'], ['[您好|nín hǎo] ， [请问|qǐng wèn] [办公室|bàn gōng shì] [在|zài] [哪里|nǎ lǐ] ？', 'formal'], ['[你好|nǐ hǎo] ， [办公室|bàn gōng shì] [在|zài] [哪里|nǎ lǐ] ？', 'casual'], ['[麻烦|má fan] [您|nín] [帮|bāng] [我|wǒ] [看|kàn] [一下|yí xià] 。', 'formal'], ['[你|nǐ] [帮|bāng] [我|wǒ] [看|kàn] [一下|yí xià] 。', 'casual'], ['[我|wǒ] [想|xiǎng] [退|tuì] [这个|zhè ge] [水壶|shuǐ hú] 。', 'none']],
    ja: [['すみません 、 [事務室|じむしつ] は どこ です か 。', 'formal'], ['ねえ 、 [事務室|じむしつ] どこ ？', 'casual'], ['[手伝|てつだ]って いただけません か 。', 'formal'], ['[手伝|てつだ]って くれる ？', 'casual'], ['これ を [返品|へんぴん] したい ん です が 。', 'formal'], ['これ [返品|へんぴん] したい ん だ けど 。', 'casual']],
  };
  function tests(l) {
    const list = CASES[l] || [], fails = [];
    // (both scripts: the characters, and the rōmaji / pinyin you can type instead)
    const plain = s => (isCJ(l) && typeof CJK !== 'undefined' ? (CJK.chars ? CJK.chars(s, { lang: l }) : CJK.plain(s, { lang: l })) : s);
    const was = typeof LEX !== 'undefined' ? LEX.lang : null;
    try {
      if (typeof LEX !== 'undefined') LEX.lang = l;
      for (const [t, want] of list) {
        for (const form of isCJ(l) ? ['chars', 'roman'] : ['plain']) {
          const txt = form === 'roman' && typeof CJK !== 'undefined' ? CJK.roman(t, { lang: l }) : plain(t);
          const r = read(txt, l);
          if (r.reg !== want) fails.push(`${l} «${txt}» read ${r.reg} (f: ${r.f.join(',')} c: ${r.c.join(',')}), want ${want}`);
        }
      }
    } finally { if (typeof LEX !== 'undefined' && was) LEX.lang = was; }
    return { pass: list.length * (isCJ(l) ? 2 : 1) - fails.length, fail: fails.length, fails };
  }
  return { read, grade, apply, chip, tests, TIP, CASES, _: { readES, readPT, readDE, readZH, readJA, worse } };
})();
