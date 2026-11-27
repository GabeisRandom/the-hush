'use strict';
// The German dictionary pack, FLUENT.md. Same word-list format as es.js / pt.js (latin.js), with German codes:
//   nouns   m|f|n + the plural: m-e (Hund, Hunde) · n¨er (Haus, Häuser) · f-en · m- (Lehrer, Lehrer) · n-s · f¨ (Mutter,
//           Mütter) · m-n · f-nen · m:Explicit (Museum n:Museen) · pl (plural only: Eltern) · m0 (no plural); extras
//           f:Lehrerin (the feminine noun), wk (weak: der Junge, den Jungen)
//   verbs   v (weak, haben) · v.s (sein) · v.b (haben or sein: fahren); strong and irregular verbs come from STRONG by
//           their base; «auf+stehen» marks a separable prefix; be-/ver-/er-/ent-/ge-/zer-/emp-/miss- are inseparable
//   adj     a (klein, kleiner, am kleinsten) · a¨ (alt, älter) · cmp:besser sup:best (irregular)
// ae / oe / ue and ss are read as ä / ö / ü / ß (a minor accent slip when the plain spelling isn't a word itself).
// Checks: order (verb second, verb last after weil/dass/wenn…, W-questions), aux (haben/sein), sep (ich aufstehe →
// ich stehe … auf), conj, case (mit/zu/von/bei/aus/nach/seit + dative; für/ohne/durch/gegen/um + accusative),
// agree (der Katze? die Mann → der Mann), caps (minor), tense (gestern + present), accent (minor).

(() => {
  if (typeof LATIN === 'undefined' || typeof DICT === 'undefined') return;
  const { key, low, feat, EN, isCap, capF, likeCase, finite } = LATIN;

  // ------------------------------------------------------------ nouns
  const UML = { a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü' };
  function uml(w) {
    for (let i = w.length - 1; i >= 0; i--) {
      const c = w[i];
      if (c === 'u' && i > 0 && (w[i - 1] === 'a' || w[i - 1] === 'A')) return w.slice(0, i - 1) + (w[i - 1] === 'A' ? 'Äu' : 'äu') + w.slice(i + 1);
      if (UML[c]) { if (i > 0 && w[i - 1] === c) return w.slice(0, i - 1) + UML[c] + w.slice(i + 1); return w.slice(0, i) + UML[c] + w.slice(i + 1); }
    }
    return w;
  }
  function pluralOf(L, code) {
    if (!code || code === '0') return null;
    if (code[0] === ':') return code.slice(1);
    const um = code[0] === '¨';
    const base = um ? uml(L) : L;
    const suf = code.replace(/^[¨-]/, '');
    return base + suf;
  }
  const CASES = ['nom', 'acc', 'dat', 'gen'];
  function nounForms(e) {
    const out = [], L = e.lemma, g = e.g;
    if (e.plOnly) { CASES.forEach(c => out.push([c === 'dat' && !/[ns]$/.test(L) ? L + 'n' : L, 'p.' + c])); return out; }
    if (g === 'f') CASES.forEach(c => out.push([L, 'f.s.' + c]));
    else if (e.wk) {
      // the oblique singular of a weak noun is its plural (Nachbar → Nachbarn, Student → Studenten) unless wkn says otherwise (Herrn)
      const n = e.wkn || e.pl || (/e$/.test(L) ? L + 'n' : L + 'en');
      out.push([L, g + '.s.nom'], [n, g + '.s.acc'], [n, g + '.s.dat'], [e.gen || n, g + '.s.gen']);
    } else {
      out.push([L, g + '.s.nom'], [L, g + '.s.acc'], [L, g + '.s.dat']);
      if (/(s|ß|x|z|sch|tsch)$/.test(L)) out.push([L + 'es', g + '.s.gen']);
      else if (/[aeiouy]$|(el|er|en|chen|lein|ling|ig|ich|um)$/.test(L)) out.push([L + 's', g + '.s.gen']);
      else out.push([L + 's', g + '.s.gen'], [L + 'es', g + '.s.gen']);
    }
    const pl = e.pl;
    if (pl) { out.push([pl, 'p.nom'], [pl, 'p.acc'], [pl, 'p.gen'], [/[ns]$/.test(pl) ? pl : pl + 'n', 'p.dat']); }
    return out;
  }

  // ------------------------------------------------------------ adjectives
  const ENDS = ['e', 'en', 'er', 'es', 'em'];
  function attStem(a) {
    if (a === 'hoch') return 'hoh';
    if (/[^aeiou]el$/.test(a)) return a.slice(0, -2) + 'l';          // dunkel → dunkl-
    if (/(au|eu)er$/.test(a)) return a.slice(0, -2) + 'r';            // teuer → teur-
    return a;
  }
  function adjForms(e) {
    const a = e.lemma, out = [[a, '']];
    if (e.noDecl) return out;
    const s = attStem(a);
    ENDS.forEach(en => out.push([s + en, 'att']));
    if (e.noCmp) return out;
    const c = e.cmp || ((e.umlC ? uml(s) : s) + 'er');
    const sup = e.sup || ((e.umlC ? uml(a) : a) + (/(d|t|s|ß|x|z|sch)$/.test(a) && !/(isch)$/.test(a) ? 'est' : 'st'));
    out.push([c, 'cmp']); ENDS.forEach(en => out.push([c + en, 'cmp.att']));
    out.push(['am ' + sup + 'en', 'sup']); ENDS.forEach(en => out.push([sup + en, 'sup.att']));
    return out;
  }
  // the ending an adjective needs: decl 'wk' (der, dieser), 'mx' (ein, kein, mein), 'st' (no article)
  const AEND = {
    wk: { nom: { m: 'e', f: 'e', n: 'e', p: 'en' }, acc: { m: 'en', f: 'e', n: 'e', p: 'en' }, dat: { m: 'en', f: 'en', n: 'en', p: 'en' }, gen: { m: 'en', f: 'en', n: 'en', p: 'en' } },
    mx: { nom: { m: 'er', f: 'e', n: 'es', p: 'en' }, acc: { m: 'en', f: 'e', n: 'es', p: 'en' }, dat: { m: 'en', f: 'en', n: 'en', p: 'en' }, gen: { m: 'en', f: 'en', n: 'en', p: 'en' } },
    st: { nom: { m: 'er', f: 'e', n: 'es', p: 'e' }, acc: { m: 'en', f: 'e', n: 'es', p: 'e' }, dat: { m: 'em', f: 'er', n: 'em', p: 'en' }, gen: { m: 'en', f: 'er', n: 'en', p: 'er' } },
  };

  // ------------------------------------------------------------ determiners and pronouns (by case)
  const DER = { m: ['der', 'den', 'dem', 'des'], f: ['die', 'die', 'der', 'der'], n: ['das', 'das', 'dem', 'des'], p: ['die', 'die', 'den', 'der'] };
  const DIES = { m: ['er', 'en', 'em', 'es'], f: ['e', 'e', 'er', 'er'], n: ['es', 'es', 'em', 'es'], p: ['e', 'e', 'en', 'er'] };
  const EIN = { m: ['', 'en', 'em', 'es'], f: ['e', 'e', 'er', 'er'], n: ['', '', 'em', 'es'], p: ['e', 'e', 'en', 'er'] };
  function detForms(spec) {
    // 'DER' · 'DIES:dies' · 'EIN:mein' · 'EIN1:ein' (no plural)
    const [kind, stem] = spec.split(':'), out = [];
    for (const g of ['m', 'f', 'n', 'p']) {
      if (kind === 'EIN1' && g === 'p') continue;
      CASES.forEach((c, i) => {
        const w = kind === 'DER' ? DER[g][i] : kind === 'DIES' ? stem + DIES[g][i] : (stem === 'euer' && EIN[g][i] ? 'eur' : stem) + EIN[g][i];
        out.push([w, (g === 'p' ? 'p' : g + '.s') + '.' + c]);
      });
    }
    return out;
  }

  // ------------------------------------------------------------ verbs
  // strong and irregular verbs: infinitive|present stem for du/er (fähr, gib, *: its own table)|Präteritum|participle|aux
  const STRONG_TEXT = `backen||backte|gebacken|h
beginnen||begann|begonnen|h
beißen||biss|gebissen|h
bieten||bot|geboten|h
binden||band|gebunden|h
bitten||bat|gebeten|h
bleiben||blieb|geblieben|s
braten|brät|briet|gebraten|h
brechen|brich|brach|gebrochen|h
brennen||brannte|gebrannt|h
bringen||brachte|gebracht|h
denken||dachte|gedacht|h
dürfen|*|durfte|gedurft|h
empfehlen|empfiehl|empfahl|empfohlen|h
essen|iss|aß|gegessen|h
fahren|fähr|fuhr|gefahren|b
fallen|fäll|fiel|gefallen|s
fangen|fäng|fing|gefangen|h
finden||fand|gefunden|h
fliegen||flog|geflogen|b
fliehen||floh|geflohen|s
fließen||floss|geflossen|s
fressen|friss|fraß|gefressen|h
frieren||fror|gefroren|h
geben|gib|gab|gegeben|h
gehen||ging|gegangen|s
gelingen||gelang|gelungen|s
gelten|gilt|galt|gegolten|h
genießen||genoss|genossen|h
geschehen|geschieh|geschah|geschehen|s
gewinnen||gewann|gewonnen|h
gießen||goss|gegossen|h
gleichen||glich|geglichen|h
meiden||mied|gemieden|h
graben|gräb|grub|gegraben|h
greifen||griff|gegriffen|h
haben|*|hatte|gehabt|h
halten|hält|hielt|gehalten|h
hängen||hing|gehangen|h
heben||hob|gehoben|h
heißen||hieß|geheißen|h
helfen|hilf|half|geholfen|h
kennen||kannte|gekannt|h
klingen||klang|geklungen|h
kriechen||kroch|gekrochen|s
kommen||kam|gekommen|s
können|*|konnte|gekonnt|h
laden|läd|lud|geladen|h
lassen|läss|ließ|gelassen|h
laufen|läuf|lief|gelaufen|s
leiden||litt|gelitten|h
leihen||lieh|geliehen|h
lesen|lies|las|gelesen|h
liegen||lag|gelegen|h
lügen||log|gelogen|h
messen|miss|maß|gemessen|h
mögen|*|mochte|gemocht|h
müssen|*|musste|gemusst|h
nehmen|nimm|nahm|genommen|h
nennen||nannte|genannt|h
pfeifen||pfiff|gepfiffen|h
raten|rät|riet|geraten|h
reiben||rieb|gerieben|h
reißen||riss|gerissen|b
reiten||ritt|geritten|b
rennen||rannte|gerannt|s
riechen||roch|gerochen|h
rufen||rief|gerufen|h
scheiden||schied|geschieden|h
scheinen||schien|geschienen|h
schieben||schob|geschoben|h
schießen||schoss|geschossen|h
schlafen|schläf|schlief|geschlafen|h
schlagen|schläg|schlug|geschlagen|h
schließen||schloss|geschlossen|h
schmelzen|schmilz|schmolz|geschmolzen|s
schneiden||schnitt|geschnitten|h
schreiben||schrieb|geschrieben|h
schreien||schrie|geschrien|h
schweigen||schwieg|geschwiegen|h
schwimmen||schwamm|geschwommen|b
sehen|sieh|sah|gesehen|h
sein|*|war|gewesen|s
singen||sang|gesungen|h
sinken||sank|gesunken|s
sitzen||saß|gesessen|h
sollen|*|sollte|gesollt|h
sprechen|sprich|sprach|gesprochen|h
springen||sprang|gesprungen|s
stechen|stich|stach|gestochen|h
stehen||stand|gestanden|h
stehlen|stiehl|stahl|gestohlen|h
steigen||stieg|gestiegen|s
sterben|stirb|starb|gestorben|s
stoßen|stöß|stieß|gestoßen|b
streiten||stritt|gestritten|h
tragen|träg|trug|getragen|h
treffen|triff|traf|getroffen|h
treiben||trieb|getrieben|h
treten|tritt|trat|getreten|b
trinken||trank|getrunken|h
tun|*|tat|getan|h
vergessen|vergiss|vergaß|vergessen|h
verlieren||verlor|verloren|h
verschwinden||verschwand|verschwunden|s
wachsen|wächs|wuchs|gewachsen|s
waschen|wäsch|wusch|gewaschen|h
weisen||wies|gewiesen|h
werden|*|wurde|geworden|s
werfen|wirf|warf|geworfen|h
wiegen||wog|gewogen|h
wissen|*|wusste|gewusst|h
wollen|*|wollte|gewollt|h
ziehen||zog|gezogen|b
zwingen||zwang|gezwungen|h`;
  const STRONG = {};
  for (const l of STRONG_TEXT.split('\n')) { const [inf, ps, pr, pp, aux] = l.split('|'); STRONG[inf] = { ps, pr, pp, aux }; }
  const PRES = { sein: 'bin bist ist sind seid sind', haben: 'habe hast hat haben habt haben', werden: 'werde wirst wird werden werdet werden',
    wissen: 'weiß weißt weiß wissen wisst wissen', tun: 'tue tust tut tun tut tun', können: 'kann kannst kann können könnt können',
    müssen: 'muss musst muss müssen müsst müssen', dürfen: 'darf darfst darf dürfen dürft dürfen', sollen: 'soll sollst soll sollen sollt sollen',
    wollen: 'will willst will wollen wollt wollen', mögen: 'mag magst mag mögen mögt mögen' };
  const IMP = { sein: ['sei', 'seid'], haben: ['hab', 'habt'], werden: ['werd', 'werdet'], tun: ['tu', 'tut'], wissen: ['wisse', 'wisst'] };
  const KII = { sein: 'wär', haben: 'hätt', werden: 'würd', können: 'könnt', müssen: 'müsst', dürfen: 'dürft', sollen: 'sollt', wollen: 'wollt',
    mögen: 'möcht', wissen: 'wüsst', tun: 'tät', bringen: 'brächt', denken: 'dächt', brauchen: 'bräucht' };
  const INSEP = ['über', 'unter', 'miss', 'zer', 'emp', 'ent', 'ver', 'be', 'ge', 'er'];
  const PN = ['1s', '2s', '3s', '1p', '2p', '3p'];
  // the verb's base for STRONG: itself, or after an inseparable prefix (verstehen → stehen)
  function baseOf(v) {
    if (STRONG[v] || PRES[v]) return { pre: '', base: v, insep: false };
    for (const p of INSEP) if (v.startsWith(p) && v.length > p.length + 3 && (STRONG[v.slice(p.length)] || PRES[v.slice(p.length)])) return { pre: p, base: v.slice(p.length), insep: true };
    // a weak verb with an inseparable prefix (besuchen, erklären) — but not one that only starts like one (ernten, bellen)
    for (const p of INSEP) { const rest = v.slice(p.length); if (v.startsWith(p) && v.length > p.length + 3 && (VSET.has(rest) || rest.length >= 6)) return { pre: p, base: rest, insep: true, weak: true }; }
    return { pre: '', base: v, insep: false };
  }
  let VSET = new Set();                                                   // the verbs in the list (set when the pack builds)
  const CJ = new Map();
  // every form of a (non-separable) verb: [[form, fkey]]
  function conj(v) {
    if (CJ.has(v)) return CJ.get(v);
    const out = [], add = (w, k) => { if (w) out.push([w, k]); };
    const B = baseOf(v), S = !B.weak && STRONG[B.base], pre = B.pre;
    const ieren = /ieren$/.test(v);
    const stem = v.replace(/(e?n)$/, '');                               // spielen → spiel; wandern → wander; tun → tu
    const elnern = /[^aeiouäöü](el|er)n$/.test(v);
    const tStem = /([td]|chn|ffn|[^aeiouäöülrhmn][mn])$/.test(stem);   // arbeit-, red-, öffn-, atm-, rechn- take an extra e (not komm-, kenn-)
    const sStem = /(s|ß|x|z)$/.test(stem);
    // present
    if (PRES[B.base]) PRES[B.base].split(' ').forEach((w, i) => add(pre + w, 'pres.ind.' + PN[i]));
    else {
      const ch = S && S.ps ? pre + S.ps : stem;
      const du = ch + (/(s|ß|x|z)$/.test(ch) ? 't' : (tStem && ch === stem) ? 'est' : 'st');
      const er = ch !== stem ? (/t$/.test(ch) ? ch : ch + 't') : stem + (tStem ? 'et' : 't');
      add(elnern ? stem.replace(/el$/, 'le') : stem + 'e', 'pres.ind.1s');
      if (elnern && /el$/.test(stem)) add(stem + 'e', 'pres.ind.1s');
      add(ch === stem && sStem ? stem + 't' : du, 'pres.ind.2s');
      add(er, 'pres.ind.3s');
      add(v, 'pres.ind.1p'); add(stem + (tStem ? 'et' : 't'), 'pres.ind.2p'); add(v, 'pres.ind.3p');
    }
    // Präteritum
    let pr;
    if (S) pr = pre + S.pr;
    else pr = stem + (tStem ? 'ete' : 'te');
    const weakPr = /te$/.test(pr);
    if (weakPr) ['', 'st', '', 'n', 't', 'n'].forEach((en, i) => add(pr + en, 'past.ind.' + PN[i]));
    else {
      const td = /[td]$/.test(pr), ss = /(s|ß|z)$/.test(pr);
      [pr, pr + (td || ss ? 'est' : 'st'), pr, pr + 'en', pr + (td ? 'et' : 't'), pr + 'en'].forEach((w, i) => add(w, 'past.ind.' + PN[i]));
      if (ss) add(pr + 't', 'past.ind.2s');
    }
    // Konjunktiv II (wäre, hätte, ginge, käme): the common ones, and every strong verb
    let k2 = KII[B.base] ? pre + KII[B.base] : (S && !weakPr ? uml(pr).replace(/e$/, '') : null);
    if (k2) ['e', 'est', 'e', 'en', 'et', 'en'].forEach((en, i) => add(k2 + en, 'pres.k2.' + PN[i]));
    // Konjunktiv I, 3rd singular (er sei, er habe: reported speech, read so it's never flagged)
    add(B.base === 'sein' ? pre + 'sei' : stem + 'e', 'pres.subj.3s');
    // imperative
    const im = IMP[B.base];
    if (im) { add(pre + im[0], 'imp.2s'); if (im[0] !== 'sei') add(pre + im[0] + 'e', 'imp.2s'); add(pre + im[1], 'imp.2p.vt'); }
    else {
      const eiStem = S && S.ps && /i/.test(S.ps) && !/[äöü]/.test(S.ps);
      if (eiStem) add(pre + S.ps.replace(/(s|ß)$/, '$1'), 'imp.2s');
      else { add(stem, 'imp.2s'); add(stem + 'e', 'imp.2s'); }
      add(stem + (tStem ? 'et' : 't'), 'imp.2p.vt');
    }
    add(B.base === 'sein' ? pre + 'seien' : v, 'imp.2p.fo');
    // participle (gemacht, gegangen, verstanden, studiert) and its adjective forms (das gekochte Ei)
    let pp;
    if (S) pp = B.insep ? pre + S.pp.replace(/^ge/, '') : S.pp;
    else if (B.insep || ieren) pp = stem + (tStem ? 'et' : 't');
    else pp = 'ge' + stem + (tStem ? 'et' : 't');
    add(pp, 'part');
    ENDS.forEach(en => add(pp + en, 'part.att'));
    add(v, 'inf');
    CJ.set(v, out);
    return out;
  }
  function auxOf(v, e) {
    if (e && e.aux) return e.aux;
    const B = baseOf(v), S = STRONG[B.base];
    if (B.insep && !B.weak) return 'h';
    return S ? S.aux : 'h';
  }
  // a separable verb's joined forms (aufstehe, aufstand, aufgestanden, aufzustehen): its prefix on the base's forms
  function conjSep(e) {
    const base = conj(e.base);
    const out = [];
    for (const [w, k] of base) {
      if (k === 'part' || k === 'part.att') out.push([e.sep + (/^ge/.test(w) || baseOf(e.base).insep || /iert/.test(w) ? w : w), k]);
      else if (/^imp/.test(k)) continue;
      else out.push([e.sep + w, k]);
    }
    const pp = base.find(x => x[1] === 'part');
    if (pp) { out.push([e.sep + pp[0], 'part']); }
    out.push([e.sep + 'zu' + e.base, 'zu']);
    return out;
  }

  // ------------------------------------------------------------ headwords
  const POS = { v: 'v', a: 'adj', 'a¨': 'adj', adv: 'adv', prep: 'prep', conj: 'conj', pron: 'pron', det: 'det', num: 'num', int: 'int', phrase: 'phrase', name: 'name' };
  const FLAGS = ['art', 'indef', 'dem', 'poss', 'quant', 'subj', 'refl', 'neg', 'sub', 'coord', 'q', 'per', 'work', 'place', 'time', 'wk', 'dat', 'acc', 'two', 'gen', 'noCmp', 'noDecl', 'sepw', 'formal', 'adverbial'];
  function entry(e, raw) {
    let code = raw.code; const ex = raw.ex;
    if (e.lemma.includes('+')) { const [p, b] = e.lemma.split('+'); e.sep = p; e.base = b; e.lemma = p + b; }
    for (const k of FLAGS) if (ex[k]) e[k] = true;
    if (ex.time) e.time = ex.time === true ? 'present' : ex.time;
    if (ex.n != null) e.num = +ex.n;
    if (ex.alt) e.alt = String(ex.alt).split(',');
    if (ex.case) e.pcase = ex.case;                                    // a preposition's case: dat, acc, two, gen
    const ci = code.indexOf(':');
    if (ci > 0 && /^(det|pron|num|int|adv|prep)$/.test(code.slice(0, ci))) { e.forms = code.slice(ci + 1); code = code.slice(0, ci); }
    if (code === 'pl') { e.pos = 'n'; e.g = 'p'; e.plOnly = true; }
    else if (POS[code] || /^v(\.[sb])?$/.test(code)) {
      e.pos = POS[code] || 'v';
      if (e.pos === 'v') { if (code === 'v.s') e.aux = 's'; else if (code === 'v.b') e.aux = 'b'; }
      if (code === 'a¨') e.umlC = true;
      if (ex.cmp) e.cmp = ex.cmp;
      if (ex.sup) e.sup = ex.sup;
    } else if (/^[mfn]/.test(code)) {
      e.pos = 'n'; e.g = code[0];
      const pc = code.slice(1);
      e.pl = pluralOf(e.lemma, pc);
      if (ex.f) e.fem = ex.f;
      if (ex.gen) e.gen = ex.gen;
      if (ex.wkn) e.wkn = ex.wkn;
      if ((raw.tags.includes('place') || raw.tags.includes('town')) && !raw.tags.includes('transport')) e.place = true;
      if (raw.tags.includes('work') && e.per) e.work = true;
    } else e.pos = 'phrase';
    if (e.pos === 'det') e.det = true;
    if (ex.lex) e.lex = ex.lex;
  }
  function forms(e, add, P) {
    if (P && !P._vset) { P._vset = true; VSET = new Set([...P.entries.values()].filter(x => x.pos === 'v').map(x => x.lemma)); CJ.clear(); }
    if (e.forms) {
      if (/^(DER|DIES|EIN1?)(:|$)/.test(e.forms)) detForms(e.forms).forEach(([w, k]) => add(w, k));
      else e.forms.split(',').forEach(x => { const q = x.indexOf('='); if (q < 0) add(x, ''); else add(x.slice(0, q), x.slice(q + 1)); });
      add(e.lemma, '');
      return;
    }
    if (e.pos === 'n') {
      nounForms(e).forEach(([w, k]) => add(w, k));
      if (e.fem) { const fe = { lemma: e.fem, g: 'f', pl: e.fem + 'nen' }; nounForms(fe).forEach(([w, k]) => add(w, k.replace(/^p\./, 'f.p.'))); }
    } else if (e.pos === 'adj') adjForms(e).forEach(([w, k]) => add(w, k));
    else if (e.pos === 'v') (e.sep ? conjSep(e) : conj(e.lemma)).forEach(([w, k]) => add(w, k));
    else add(e.lemma, '');
    if (e.alt) for (const a of e.alt) add(a, e.pos === 'n' ? (e.g === 'p' ? 'p.nom' : e.g + '.s.nom') : '');
  }

  // ------------------------------------------------------------ words the index doesn't hold: ae/oe/ue, geht's, compounds
  function expand(tk, P) {
    const t = tk.t, out = [];
    // «geht's», «gibt's», «hab's»: the verb and «es»
    const ap = /^(.+?)['’]s$/i.exec(t);
    if (ap) { for (const r of P.IX.get(key(ap[1])) || []) out.push({ e: r.e, f: r.f, w: r.w + '’s', exact: true, via: 'es' }); if (out.length) return out; }
    // umlauts written out: schoen → schön, Muell → Müll (an accent slip)
    if (/ae|oe|ue/i.test(t)) {
      const v = t.replace(/ae/g, 'ä').replace(/oe/g, 'ö').replace(/ue/g, 'ü').replace(/Ae/g, 'Ä').replace(/Oe/g, 'Ö').replace(/Ue/g, 'Ü');
      for (const r of P.IX.get(key(v)) || []) if (low(r.w) === low(v)) out.push({ e: r.e, f: r.f, w: r.w, exact: false, via: 'uml' });
      if (out.length) return out;
    }
    // compounds: Apfelkuchen = Apfel + Kuchen (the last part decides gender and number)
    const k = key(t);
    if (k.length >= 7) {
      for (let i = k.length - 3; i >= 3; i--) {
        const tail = (P.IX.get(k.slice(i)) || []).filter(r => r.e.pos === 'n');
        if (!tail.length) continue;
        let head = k.slice(0, i), hr = null;
        for (const cut of ['', 's', 'es', 'n', 'en', 'e', 'er']) {
          if (cut && !head.endsWith(cut)) continue;
          const h = cut ? head.slice(0, -cut.length) : head;
          if (h.length < 3) continue;
          hr = (P.IX.get(h) || []).find(r => r.e.pos === 'n' || r.e.pos === 'adj') || (P.IX.get(h + 'en') || []).find(r => r.e.pos === 'v' && r.f.form === 'inf');
          if (hr) break;
        }
        if (!hr) continue;
        for (const r of tail) out.push({ e: r.e, f: r.f, w: t, exact: true, via: 'compound', parts: [hr.e, r.e] });
        return out;
      }
    }
    return null;
  }

  // ------------------------------------------------------------ scoring
  const PRI = { det: 1, prep: 1.2, conj: 1.1, pron: 0.9, adv: 0.8, n: 0.6, adj: 0.5, v: 0.5, num: 0.8, int: 0.3, phrase: 0.1, name: 0.2 };
  function prior(c) {
    let s = PRI[c.e.pos] || 0;
    if (c.via === 'compound') s -= 0.3;
    if (c.e.sep && !c.f.form) s -= 0.4;
    if (c.e.pos === 'v' && finite(c.f)) s += 0.2;
    if (c.f.k2) s -= 0.3;
    if (c.e.auto) s -= 0.2;
    return s;
  }
  function score(c, i, W, ctx) {
    const e = c.e, f = c.f, w = W[i];
    let s = 0;
    const capd = isCap(w.t), first = ctx.first;
    if (capd && !first) s += e.pos === 'n' || e.pos === 'name' ? 2.5 : (e.formal ? 2 : -1);
    if (!capd && e.pos === 'n') s -= 0.8;
    if (!capd && e.formal) s -= 2;
    if (!c.exact && w._c.some(x => x.exact)) s -= 3;                  // «laut» is laut, not «läut»: the word as typed wins
    const nx = ctx.next || [], pv = ctx.prev;
    if (e.pos === 'v' && finite(f) && !clauseFin(W, i)) s += 1.2;
    else if (e.pos === 'v' && finite(f) && f.mood !== 'imp') s -= 3;      // the clause has its verb: «Ich habe es vergessen» (a participle)
    // (a helper counts only in the same clause: the «würde» of a main clause doesn't make the «haben» of a «weil» clause an infinitive)
    let cs0 = i; while (cs0 > 0 && !W[cs0 - 1].punct) cs0--;
    if (e.pos === 'v' && f.form === 'part' && W.slice(cs0, i).some(x => x._r && /^(haben|sein)$/.test(x._r.e.lemma) && finite(x._r.f))) s += 1.5;
    // (DX-B2) an ihr-command never follows its clause's own verb: «Gestern habe ich ihn besucht» is the participle (after «ihn»
    // or «ihm», forms of a subject pronoun, the command won and «habe» got a tense fix)
    if (e.pos === 'v' && f.mood === 'imp' && W.slice(cs0, i).some(x => x._r && x._r.e.pos === 'v' && finite(x._r.f) && x._r.f.mood !== 'imp')) s -= 3;
    if (e.pos === 'v' && f.form === 'inf' && W.slice(cs0, i).some(x => x._r && (MODALS.has(x._r.e.lemma) || x._r.e.lemma === 'werden') && finite(x._r.f))) s += 1.5;
    if (e.pos === 'v' && f.form === 'inf' && pv && key(pv.w) === 'zu') s += 2;
    // (DX-B2) right before a finite modal or «werden», a verb is the infinitive of the cluster: «…, weil … und ich helfen will»
    if (e.pos === 'v' && f.form === 'inf' && nx.some(n => n.e.pos === 'v' && finite(n.f) && n.exact && (MODALS.has(n.e.lemma) || n.e.lemma === 'werden'))) s += 3;
    // der / die / das before a verb at the start of a clause: a pronoun («das ist…», «die kommt»)
    if ((e.det || e.art) && nx.length && !nx.some(n => n.e.pos === 'n' || n.e.pos === 'adj' || n.e.pos === 'num' || n.e.det)) s -= 1.5;
    return s;
  }
  function clauseFin(W, i) {
    for (let k = i - 1; k >= 0; k--) { const w = W[k]; if (w.punct || (w._r && (w._r.e.sub || w._r.e.coord))) break; if (w._r && w._r.e.pos === 'v' && finite(w._r.f)) return true; }
    for (let k = i + 1; k < W.length; k++) {
      const w = W[k]; if (w.punct) break;
      if (w._c.some(c => c.e.sub || c.e.coord)) break;
      if (w._c.length && w._c.every(c => c.e.pos === 'v' && finite(c.f))) return true;
    }
    return false;
  }
  const MODALS = new Set(['können', 'müssen', 'dürfen', 'sollen', 'wollen', 'mögen', 'möchten']);
  const SUBORD = new Set(['weil', 'dass', 'wenn', 'ob', 'obwohl', 'bevor', 'nachdem', 'damit', 'sobald', 'falls', 'als', 'während', 'bis', 'seit', 'seitdem', 'da', 'daß', 'sodass', 'indem', 'ohne', 'statt']);
  const SUB_SURE = new Set(['weil', 'dass', 'daß', 'wenn', 'ob', 'obwohl', 'bevor', 'nachdem', 'damit', 'sobald', 'falls', 'sodass', 'seitdem']);
  const COORD = new Set(['und', 'aber', 'oder', 'denn', 'sondern']);
  const REL = new Set(['der', 'die', 'das', 'dem', 'den', 'deren', 'dessen']);
  const SUBJP = { ich: '1s', du: '2s', er: '3s', es: '3s', man: '3s', wir: '1p', ihr: '2p' };
  const rd = (W, i) => (i >= 0 && W[i] && W[i]._r) || null;
  const nxi = (W, i) => { for (let j = i + 1; j < W.length; j++) { if (W[j].punct) return -1; return j; } return -1; };
  const pvi = (W, i) => { for (let j = i - 1; j >= 0; j--) { if (W[j].punct) return -1; return j; } return -1; };
  // a subject pronoun at index i: { pn: ['3s'] | ['3s','3p'] … }
  function subjAt(W, i) {
    const w = W[i]; if (!w || w.punct) return null;
    const k = key(w.t), c = w._r;
    if (SUBJP[k] && !(c && c.f.case && c.f.case !== 'nom')) return { pns: [SUBJP[k]], i };
    if (k === 'sie') return { pns: w.t === 'Sie' && i > 0 && !(W[i - 1].punct && /[.!?]/.test(W[i - 1].t)) ? ['3p'] : ['3s', '3p'], i };
    return null;
  }
  // (DX-B2) «Ein alter Reifendreher und ich haben…», «Du und ich sind…»: a pronoun joined by «und» / «oder» to the words
  // before it, which have no verb of their own, is half of a plural subject, not the subject alone
  function coordSubj(W, i) {
    const p = pvi(W, i); if (p < 0 || !/^(und|oder|sowie)$/.test(key(W[p].t))) return false;
    let n = 0;
    for (let k = p - 1; k >= 0; k--) {
      const w = W[k]; if (w.punct) break;
      const c = w._r; if (c && c.e.pos === 'v' && finite(c.f)) return false;
      if (c && (c.e.sub || c.e.coord)) break;
      n++;
    }
    return n > 0;
  }
  // the clause around index i: [start, end] (word indices), and whether it's subordinate (starts with weil, dass…)
  function clauseOf(W, i) {
    let s = i, e = i;
    const brk = k => W[k].punct && /[,.;:!?]/.test(W[k].t);
    const fin = k => !W[k].punct && W[k]._r && W[k]._r.e.pos === 'v' && finite(W[k]._r.f);
    // «und» / «oder» end a clause only when there's a verb on its far side too («Brot und Käse gegessen» is one clause)
    const coordSplits = (k, dir) => { if (!(W[k]._r && COORD.has(key(W[k].t)))) return false; for (let j = k + dir; j >= 0 && j < W.length && !brk(j); j += dir) if (fin(j)) return true; return false; };
    while (s > 0 && !brk(s - 1) && !coordSplits(s - 1, -1)) s--;
    while (e < W.length - 1 && !brk(e + 1) && !(coordSplits(e + 1, 1) && e + 1 > i)) e++;
    while (s < e && W[s].punct) s++;
    while (e > s && W[e].punct) e--;
    const sub = !!W[s] && SUBORD.has(key(W[s].t)) && !!W[s]._r && (W[s]._r.e.sub || W[s]._r.e.pos === 'conj');
    return { s, e, sub };
  }
  const SEP_INDEX = P => {
    if (P.sepIx) return P.sepIx;
    P.sepIx = new Map();
    for (const e of P.entries.values()) if (e.sep) P.sepIx.set(key(e.base) + '|' + key(e.sep), e);
    return P.sepIx;
  };
  function context(W, P) {
    const SX = SEP_INDEX(P);
    // separable verbs: «ich stehe um 7 auf» → aufstehen (the verb and its particle at the clause's end)
    for (const w of W) {
      const c = w._r; if (!c || c.e.pos !== 'v' || !finite(c.f) || c.e.sep) continue;
      const cl = clauseOf(W, w.i); if (cl.sub) continue;
      const last = W[cl.e]; if (!last || last.i === w.i) continue;
      const se = SX.get(key(c.e.lemma) + '|' + key(last.t));
      if (!se) continue;
      w._r = Object.assign({}, c, { e: se });
      last._r = { e: se, f: feat('sep'), w: last.t, exact: true };
    }
    // a pronoun subject next to the verb picks the verb's person (sie: she or they)
    for (const w of W) {
      const c = w._r; if (!c || c.e.pos !== 'v' || !finite(c.f) || c.f.mood === 'imp') continue;
      const S = subjAt(W, pvi(W, w.i)) || subjAt(W, nxi(W, w.i));
      if (!S || coordSubj(W, S.i)) continue;
      Object.defineProperty(w, '_subj', { value: S, writable: true, enumerable: false, configurable: true });
      const ok = x => x.e.pos === 'v' && finite(x.f) && x.f.person && S.pns.includes(x.f.person + x.f.number);
      if (ok(c)) continue;
      // (the reading spelled as typed first: «man könnte» is Konjunktiv II, not an umlaut slip for «konnte»)
      const alt = w._c.find(x => ok(x) && x.exact && (x.e === c.e || x.e.lemma === c.e.lemma)) || w._c.find(x => ok(x) && (x.e === c.e || x.e.lemma === c.e.lemma)) || w._c.find(ok);
      if (alt) w._r = c.e.sep && !alt.e.sep ? Object.assign({}, alt, { e: c.e }) : alt;
    }
    // helpers: haben/sein + participle (Perfekt), werden + infinitive (future), würde + infinitive, modals
    for (const w of W) {
      const c = w._r; if (!c || c.e.pos !== 'v' || !finite(c.f)) continue;
      const cl = clauseOf(W, w.i);
      for (let k = cl.s; k <= cl.e; k++) {
        if (k === w.i) continue;
        const x = rd(W, k); if (!x || x.e.pos !== 'v') continue;
        if (x.f.form === 'part' && /^(haben|sein)$/.test(c.e.lemma)) { w.aux = 'perf'; W[k].perf = true; break; }
        if (x.f.form === 'inf' && c.e.lemma === 'werden') { w.aux = c.f.k2 ? 'hypo' : 'fut'; break; }
        if (x.f.form === 'inf' && MODALS.has(c.e.lemma)) { w.aux = 'modal'; break; }
      }
    }
  }
  const PAST_W = /\b(gestern|vorgestern|neulich|damals|letzte woche|letzten (?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|monat|sommer|winter)|letztes (?:jahr|wochenende)|vor (?:einem|einer|zwei|drei|vier|funf|\d+|ein paar|vielen|langer) (?:tag|tagen|woche|wochen|monat|monaten|jahr|jahren|stunde|stunden|minuten|zeit))\b/g;
  const FUT_W = /\b(morgen|ubermorgen|nachste woche|nachsten (?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|monat|sommer|winter)|nachstes (?:jahr|wochenende)|in (?:einer|zwei|drei|\d+) (?:woche|wochen|tagen|monat|monaten|jahr|jahren))\b/g;
  function timeWordsDE(W) {
    const idx = []; let str = '';
    for (const w of W) { if (w.punct) { str += ' | '; continue; } idx.push([str.length, w.i]); str += key(w.t) + ' '; }
    const at = pos => { let b = null; for (const [p, i] of idx) { if (p <= pos) b = i; else break; } return b; };
    const out = [];
    for (const [re, t] of [[PAST_W, 'past'], [FUT_W, 'future']]) { re.lastIndex = 0; let m; while ((m = re.exec(str))) { const s = at(m.index), e = at(m.index + m[0].length - 1); if (s != null) out.push({ s, e, t }); } }
    // «morgen» after «am»/«heute» is the morning
    return out.filter(t => !(key(W[t.s].t) === 'morgen' && W[t.s - 1] && /^(am|heute|jeden|guten)$/.test(key(W[t.s - 1].t)))).sort((a, b) => a.s - b.s);
  }
  const c0 = w => (w._r ? (w._r.e.sep ? w._r.e.base : w._r.e.lemma) : '');
  function summary(a, W) {
    const TW = timeWordsDE(W); W._tw = TW;
    const times = []; let main = null;
    for (const v of a.verbs) {
      const w = W[v], f = w.f, cl = clauseOf(W, v);
      const tw = TW.find(t => t.s >= cl.s && t.e <= cl.e) || (cl.s === 0 ? null : null);
      let t;
      // «möchte» and «hätte gern» (a polite wish, now or with a time word: «Ich möchte morgen…») aren't hypothetical
      const wish = f.k2 && (c0(w) === 'mögen' || (c0(w) === 'haben' && w.aux !== 'perf' && W.slice(cl.s, cl.e + 1).some(x => /^gerne?$/.test(key(x.t)))));
      if (wish) t = tw && tw.t ? tw.t : 'present';
      else if (w.aux === 'perf') t = f.k2 ? 'hypo' : 'past';                // «Ich hätte … gelernt»: Konjunktiv II of the past
      else if (f.tense === 'past') t = 'past';
      else if (w.aux === 'fut') t = 'future';
      else if (w.aux === 'hypo' || f.k2) t = 'hypo';
      else if (f.mood === 'imp') t = 'present';
      else t = tw && tw.t ? tw.t : 'present';
      if (W[cl.s] && /^(wenn|falls)$/.test(key(W[cl.s].t)) && (f.k2 || w.aux === 'hypo')) t = 'hypo';
      if (!times.includes(t)) times.push(t);
      if (main == null && !cl.sub) main = t;
    }
    if (!a.verbs.length) for (const t of TW) if (!times.includes(t.t)) times.push(t.t);
    a.times = times; a.time = times.includes('hypo') ? 'hypo' : main || times[0] || null;
    a.clauses = a.verbs.filter(v => !W[v].perf).length;
    for (const v of a.verbs) {
      const S = subjAt(W, pvi(W, v)) || subjAt(W, nxi(W, v));
      if (S) { const pn = S.pns.length === 1 ? S.pns[0] : (W[v].f.person ? W[v].f.person + W[v].f.number : S.pns[0]); a.subject = { person: +pn[0], number: pn[1] }; if (W[S.i].t === 'Sie' && S.pns[0] === '3p') { a.subject = { person: 2, number: 's', formal: true }; } break; }
    }
    a.timeWords = TW.map(t => ({ at: [t.s, t.e], t: t.t }));
  }

  // ------------------------------------------------------------ checks
  const err = (code, sev, at, fix, tip) => ({ code, sev, at, fix, tip });
  const PREP_CASE = { mit: 'dat', zu: 'dat', von: 'dat', bei: 'dat', aus: 'dat', nach: 'dat', seit: 'dat', gegenuber: 'dat', fur: 'acc', ohne: 'acc', durch: 'acc', gegen: 'acc', um: 'acc' };
  const PRON = { ich: ['ich', 'mich', 'mir'], du: ['du', 'dich', 'dir'], er: ['er', 'ihn', 'ihm'], es: ['es', 'es', 'ihm'], wir: ['wir', 'uns', 'uns'], ihr: ['ihr', 'euch', 'euch'], Sie: ['Sie', 'Sie', 'Ihnen'] };
  const PRON_OF = {}; for (const [p, fs] of Object.entries(PRON)) fs.forEach((f, i) => { (PRON_OF[key(f)] = PRON_OF[key(f)] || []).push({ p, c: ['nom', 'acc', 'dat'][i] }); });
  const CONTR = { 'zu|dem': 'zum', 'zu|der': 'zur', 'von|dem': 'vom', 'bei|dem': 'beim', 'an|dem': 'am', 'in|dem': 'im', 'in|das': 'ins', 'an|das': 'ans' };
  const FRONT_ADV = new Set(['heute', 'gestern', 'morgen', 'jetzt', 'dann', 'danach', 'spater', 'fruher', 'oft', 'manchmal', 'immer', 'nie', 'bald', 'leider', 'vielleicht', 'naturlich', 'hier', 'dort', 'deshalb', 'deswegen', 'darum', 'trotzdem', 'ausserdem', 'zuerst', 'endlich', 'plotzlich', 'abends', 'morgens', 'mittags', 'nachmittags', 'nachts', 'montags', 'sonntags', 'normalerweise', 'eigentlich', 'schliesslich', 'sonst', 'vorgestern', 'ubermorgen', 'damals', 'inzwischen', 'gleich', 'sofort', 'zum gluck', 'zusammen', 'wieder', 'jeden']);
  const WQ = new Set(['wo', 'wann', 'was', 'wer', 'wie', 'warum', 'woher', 'wohin', 'wieso', 'weshalb', 'wen', 'wem']);
  const pnOf = c => (c && c.f.person ? c.f.person + c.f.number : '');
  function nounGNs(c, wd) {
    // the gender/number pairs a noun word can be: from all its noun readings
    return wd._c.filter(x => x.e.pos === 'n' && x.e === c.e).map(x => x.f.number === 'p' ? 'p' : (x.f.gender || x.e.g));
  }
  function detForm(de, g, c) {
    const spec = de.forms; if (!spec || !/^(DER|DIES|EIN)/.test(spec)) return null;
    const hit = detForms(spec).find(([, k]) => k === (g === 'p' ? 'p' : g + '.s') + '.' + c);
    return hit ? hit[0] : null;
  }
  const declOf = de => !de ? 'st' : /^EIN/.test(de.forms || '') ? 'mx' : 'wk';
  function check(a, opts, P) {
    const W = a.words, out = [], done = new Set();
    const push = e => { out.push(e); if (e.sev === 'major') for (let k = e.at[0]; k <= e.at[1]; k++) done.add(k); };
    const ent = l => P.entries.get('de:' + l);
    const infl = (e, f) => P.pack.inflect(e, f);
    // ---- aux first (haben or sein in the Perfekt); an order fix on the same verb uses the right one
    const AUXF = {};
    for (const v of a.verbs) {
      const w = W[v], c = w._r; if (w.aux !== 'perf') continue;
      const cl = clauseOf(W, v);
      let pi = -1; for (let k = cl.s; k <= cl.e; k++) if (W[k].perf) pi = k;
      if (pi < 0 || W.slice(cl.s, cl.e + 1).some(x => key(x.t) === 'worden')) continue;
      const have = c.e.lemma === 'sein' ? 's' : 'h';
      // a participle that's two verbs' (gefallen: fallen with sein, gefallen with haben): the one the helper fits
      const fits = W[pi]._c.find(x => x.e.pos === 'v' && x.f.form === 'part' && ['b', have].includes(auxOf(x.e.sep ? x.e.base : x.e.lemma, x.e)));
      if (fits) { W[pi]._r = fits; continue; }
      const pe = W[pi]._r.e, need = auxOf(pe.sep ? pe.base : pe.lemma, pe);
      if (need === 'b') continue;
      if (need === have) continue;
      const S = subjAt(W, pvi(W, v)) || subjAt(W, nxi(W, v));
      if (have === 's' && !(S && /^(1|2)/.test(S.pns[0]))) continue;     // «ist gegessen» can be a state: only ich/du/wir/ihr
      const fx = infl(ent(need === 's' ? 'sein' : 'haben'), { tense: c.f.tense, mood: c.f.mood, person: c.f.person, number: c.f.number });
      if (fx) AUXF[v] = { fx, tip: `«${W[pi].t}» takes «${need === 's' ? 'sein' : 'haben'}»: «${fx} … ${W[pi].t}».` };
    }
    const vt = v => (AUXF[v] ? likeCase(AUXF[v].fx, W[v].t) : W[v].t);
    // ---- order
    for (const v of a.verbs) {
      if (done.has(v)) continue;
      const w = W[v], c = w._r; if (c.f.mood === 'imp') continue;
      const cl = clauseOf(W, v);
      const firstW = W[cl.s], fk = key(firstW.t);
      // (c) after weil / dass / wenn …: the verb goes last
      if (cl.sub && (SUB_SURE.has(fk) || subjAt(W, nxi(W, cl.s))) && v < cl.e) {
        const rest = W.slice(v + 1, cl.e + 1).filter(x => !x.punct);
        const vOf = x => (x._c || []).filter(r => r.e && r.e.pos === 'v');
        const clusterEnd = rest.length > 0 && vOf(w).some(r => r.f.form === 'inf' || r.f.form === 'part') && vOf(rest[rest.length - 1]).some(r => finite(r.f) && (MODALS.has(r.e.lemma) || ['haben', 'sein', 'werden'].includes(r.e.lemma))) && rest.slice(0, -1).every(x => vOf(x).some(r => r.f.form === 'inf' || r.f.form === 'part'));
        // (a comparison may follow the verb, «Ausklammerung»: «…, dass man aus Fehlern mehr lernt als aus Erfolgen»)
        const compare = rest.length && /^(als|wie)$/.test(key(rest[0].t));
        if (rest.length && !clusterEnd && !compare && key(rest[0].t) !== 'zu' && !rest.every(x => x._r && x._r.e.pos === 'v' && x._r.f.form === 'inf' && MODALS.has(c.e.lemma) === false && false)) {
          const last = rest[rest.length - 1];
          const sx = SEP_INDEX(P).get(key(c.e.lemma) + '|' + key(last.t));
          let words = rest.map(x => x.t), verb = vt(v);
          if (sx && rest.length) { words = words.slice(0, -1); verb = last.t.toLowerCase() + w.t; }
          const fx = words.concat([verb]).join(' ');
          push(err('order', 'major', [v, cl.e], fx, `After «${firstW.t.toLowerCase()}», the verb goes to the end: «${firstW.t.toLowerCase()} … ${fx}».`));
          continue;
        }
      }
      if (cl.sub) continue;
      // (b) a clause before it: «Wenn ich Zeit habe, ich gehe…» → «gehe ich»
      const S0 = subjAt(W, cl.s);
      if (S0 && nxi(W, cl.s) === v && cl.s > 0) {
        let k = cl.s - 1; while (k >= 0 && W[k].punct) k--;
        const prev = k >= 0 ? clauseOf(W, k) : null;
        if (prev && prev.sub && W[cl.s - 1] && W[cl.s - 1].t === ',' && SUB_SURE.has(key(W[prev.s].t)) && prev.s === 0) {
          push(err('order', 'major', [cl.s, v], vt(v) + ' ' + W[cl.s].t, `After a «${W[prev.s].t.toLowerCase()}» clause, the verb comes first: «${vt(v)} ${W[cl.s].t}…».` + (AUXF[v] ? ' ' + AUXF[v].tip : '')));
          continue;
        }
      }
      // (a) and (d): something first, then the subject, then the verb: «Gestern ich habe…» → «Gestern habe ich…»
      const sbj = pvi(W, v), S = subjAt(W, sbj);
      if (S && sbj > cl.s && !(W[sbj - 1] && W[sbj - 1]._r && W[sbj - 1]._r.e.pos === 'prep')) {
        const head = W.slice(cl.s, sbj).filter(x => !x.punct);
        const hk = head.map(x => key(x.t)).join(' ');
        const h0 = head[0], h0c = h0 && h0._r;
        const adverbial = (head.length === 1 && (FRONT_ADV.has(hk) || (h0c && (h0c.e.time || h0c.e.adverbial)))) ||
          (h0c && h0c.e.pos === 'prep' && head.length >= 2 && head.length <= 4 && (head[head.length - 1]._r || {}).e && ['n', 'num'].includes(head[head.length - 1]._r.e.pos)) ||
          (head.length === 2 && FRONT_ADV.has(hk.split(' ')[0]) && h0c && h0c.e.det) || (head.length === 2 && /^(letzte|letzten|letztes|nachste|nachsten|nachstes|jeden|jede|jedes|diese|diesen|dieses)$/.test(key(h0.t)));
        const wq = head.length === 1 && WQ.has(hk) && a.question;
        if (adverbial || wq) {
          push(err('order', 'major', [sbj, v], vt(v) + ' ' + W[sbj].t, (wq ? `In a question with «${h0.t.toLowerCase()}», the verb comes next: «${h0.t} ${vt(v)} ${W[sbj].t}…?»` : `The verb comes second, right after «${head.map(x => x.t).join(' ')}»: «… ${vt(v)} ${W[sbj].t}…».`) + (AUXF[v] ? ' ' + AUXF[v].tip : '')));
          continue;
        }
      }
      // (e) main clause with the verb at the end: «Ich Pizza esse» → «Ich esse Pizza»
      if (S0 && v === cl.e && v > nxi(W, cl.s) && cl.s === (a.words.findIndex(x => !x.punct)) && !a.question) {
        const mid = W.slice(cl.s + 1, v).filter(x => !x.punct);
        if (mid.length && !mid.some(x => x._r && x._r.e.pos === 'v' && finite(x._r.f))) {
          let verb = vt(v), tail = '';
          if (c.e.sep && key(w.t).startsWith(key(c.e.sep))) { verb = w.t.slice(c.e.sep.length); tail = ' ' + c.e.sep; }
          const fx = [W[cl.s].t, verb].concat(mid.map(x => x.t)).join(' ') + tail;
          push(err('order', 'major', [cl.s, v], fx, `The verb comes second: «${fx}».`));
          continue;
        }
      }
    }
    // ---- sep: «ich aufstehe» → «ich stehe … auf»
    for (const v of a.verbs) {
      if (done.has(v)) continue;
      const w = W[v], c = w._r; if (!c.e.sep || !key(w.t).startsWith(key(c.e.sep))) continue;
      const cl = clauseOf(W, v); if (cl.sub) continue;
      const base = w.t.slice(c.e.sep.length);
      const mid = W.slice(v + 1, cl.e + 1).filter(x => !x.punct).map(x => x.t);
      const fx = [base].concat(mid, [c.e.sep]).join(' ');
      push(err('sep', 'major', [v, cl.e], fx, `«${c.e.lemma}» splits in a main clause: «${base} … ${c.e.sep}».`));
    }
    // ---- aux (where no order fix already carried it)
    for (const v of Object.keys(AUXF).map(Number)) {
      if (done.has(v)) continue;
      push(err('aux', 'major', [v, v], likeCase(AUXF[v].fx, W[v].t), AUXF[v].tip));
    }
    // ---- conj: the verb's ending against a pronoun subject
    for (const v of a.verbs) {
      if (done.has(v)) continue;
      const w = W[v], c = w._r; if (c.f.mood === 'imp') continue;
      const si = [pvi(W, v), nxi(W, v)].find(i => { const S = subjAt(W, i); const sc = rd(W, i); return S && !(sc && sc.e.det) && !(W[i - 1] && W[i - 1]._r && W[i - 1]._r.e.pos === 'prep') && !coordSubj(W, i); });
      if (si == null || si < 0) continue;
      const S = subjAt(W, si);
      if (w._c.some(x => x.e.pos === 'v' && finite(x.f) && x.f.person && S.pns.includes(x.f.person + x.f.number))) continue;
      // «Es sind zwanzig Grad», «Es kommen viele Leute»: es only holds the place; the real subject comes later
      if (key(W[si].t) === 'es' && w._c.some(x => x.e.pos === 'v' && finite(x.f) && x.f.person === 3 && x.f.number === 'p')) continue;
      const pn = S.pns[0];
      const fx = infl(c.e, { tense: c.f.tense || 'pres', mood: c.f.k2 ? 'subj' : 'ind', k2: c.f.k2, person: +pn[0], number: pn[1] });
      if (!fx || key(fx) === key(w.t)) continue;
      push(err('conj.person', 'major', [v, v], likeCase(c.e.sep && !key(w.t).startsWith(key(c.e.sep)) ? fx.slice(c.e.sep.length) : fx, w.t), `With «${W[si].t}», the verb is «${fx}».`));
    }
    // ---- case: mit / zu / von … + dative; für / ohne / durch … + accusative
    for (const w of W) {
      if (w.punct || done.has(w.i)) continue;
      const req = PREP_CASE[key(w.t)]; if (!req || !w._r || w._r.e.pos !== 'prep') continue;
      const j = nxi(W, w.i); if (j < 0 || done.has(j)) continue;
      const jk = key(W[j].t);
      if (PRON_OF[jk] && !(W[j]._r && W[j]._r.e.det)) {
        const opts = PRON_OF[jk]; if (opts.some(o => o.c === req)) continue;
        if (jk === 'sie' || jk === 'ihr') { if (W[j].t === 'Sie') { push(err('case', 'major', [j, j], req === 'dat' ? 'Ihnen' : 'Sie', `«${w.t}» takes the ${req === 'dat' ? 'dative' : 'accusative'}: «${w.t} ${req === 'dat' ? 'Ihnen' : 'Sie'}».`)); } continue; }
        const p = opts[0].p, fx = PRON[p][req === 'acc' ? 1 : 2];
        push(err('case', 'major', [j, j], fx, `«${w.t}» takes the ${req === 'dat' ? 'dative' : 'accusative'}: «${w.t} ${fx}».`));
        continue;
      }
      const dc = rd(W, j); if (!dc || !(dc.e.det || dc.e.art) || !dc.e.forms) continue;
      let h = nxi(W, j); const adjs = [];
      while (h >= 0 && rd(W, h) && rd(W, h).e.pos === 'adj') { adjs.push(h); h = nxi(W, h); }
      const hc = rd(W, h); if (!hc || hc.e.pos !== 'n' || done.has(h)) continue;
      const gns = nounGNs(hc, W[h]);
      const dets = W[j]._c.filter(x => x.e === dc.e);
      if (dets.some(x => x.f.case === req && gns.includes(x.f.number === 'p' ? 'p' : x.f.gender))) continue;
      const sg = gns.find(g => g !== 'p'), g = (hc.f.number === 'p' || !sg) ? 'p' : sg;
      const df = detForm(dc.e, g, req); if (!df) continue;
      const decl = declOf(dc.e);
      const aw = adjs.map(k => { const ac = rd(W, k); return attStem(ac.e.lemma) + AEND[decl][req][g]; });
      let noun = W[h].t;
      if (g === 'p' && req === 'dat' && !/[ns]$/.test(noun)) noun += 'n';
      const ck = CONTR[key(w.t) + '|' + df];
      const fx = (ck ? [ck] : [df]).concat(aw, [noun]).join(' ');
      push(err('case', 'major', ck ? [w.i, h] : [j, h], ck ? likeCase(fx, w.t) : fx, `«${w.t}» takes the ${req === 'dat' ? 'dative' : 'accusative'}: «${ck ? '' : w.t + ' '}${fx}».`));
    }
    // ---- agree: an article that fits no form of its noun («die Mann», «ein Katze»)
    for (const w of W) {
      if (w.punct || done.has(w.i)) continue;
      const dc = w._r; if (!dc || !(dc.e.det || dc.e.art) || !dc.e.forms || !/^(DER|DIES|EIN)/.test(dc.e.forms)) continue;
      // a relative pronoun («, die nachmittags offen ist», «, an dem Kinder lesen») isn't the article of the next word
      if (REL.has(key(w.t))) {
        let k = w.i - 1;
        if (k >= 0 && !W[k].punct && rd(W, k) && rd(W, k).e.pos === 'prep') k--;
        if (k >= 0 && W[k].punct && W[k].t === ',') continue;
      }
      let h = nxi(W, w.i); while (h >= 0 && rd(W, h) && rd(W, h).e.pos === 'adj') h = nxi(W, h);
      const hc = rd(W, h); if (!hc || hc.e.pos !== 'n' || done.has(h) || W[h].name) continue;
      const gns = nounGNs(hc, W[h]);
      const dets = w._c.filter(x => x.e === dc.e);
      if (dets.some(x => gns.includes(x.f.number === 'p' ? 'p' : x.f.gender))) continue;
      const g = hc.f.number === 'p' ? 'p' : (gns.find(x => x !== 'p') || 'p');
      const cs = [...new Set(dets.map(x => x.f.case))];
      const before = W.slice(0, w.i).filter(x => !x.punct).length === 0;
      const kase = cs.includes('nom') && (before || cs.length === 1) ? 'nom' : cs.includes('acc') ? 'acc' : cs[0];
      const fx = detForm(dc.e, g, kase); if (!fx || key(fx) === key(w.t)) continue;
      push(err('agree.gender', 'major', [w.i, w.i], likeCase(fx, w.t), `«${hc.e.lemma}» is ${g === 'm' ? 'masculine (der)' : g === 'f' ? 'feminine (die)' : g === 'n' ? 'neuter (das)' : 'plural'}: «${fx} ${W[h].t}».`));
    }
    // ---- tense: a time word against the verb («Gestern esse ich» → «Gestern habe ich … gegessen»)
    const TW = W._tw || timeWordsDE(W);
    for (const v of a.verbs) {
      if (done.has(v)) continue;
      const w = W[v], c = w._r; if (c.f.mood !== 'ind') continue;
      const cl = clauseOf(W, v), tw = TW.find(t => t.s >= cl.s && t.e <= cl.e);
      if (!tw) continue;
      if (tw.t === 'past' && c.f.tense === 'pres' && !w.aux) {
        const lem = c.e.sep ? c.e.base : c.e.lemma;
        // «habe … übernachtet» with a verb the list lacks: an unknown word that looks like a participle makes it a Perfekt
        if (/^(haben|sein)$/.test(lem) && W.slice(cl.s, cl.e + 1).some(x => x.unknown && /(t|en)$/.test(low(x.t)))) continue;
        const pf = { tense: 'past', mood: 'ind', person: c.f.person, number: c.f.number };
        if (/^(sein|haben|werden|wissen)$/.test(lem) || MODALS.has(lem) || (lem === 'geben' && W.slice(cl.s, cl.e + 1).some(x => key(x.t) === 'es'))) {
          const fx = infl(ent(lem) || c.e, pf); if (!fx) continue;
          push(err('tense', 'major', [v, v], likeCase(fx, w.t), `With «${W.slice(tw.s, tw.e + 1).map(x => x.t).join(' ').toLowerCase()}», use the past: «${fx}».`));
        } else {
          const ve = c.e, aux = auxOf(ve.sep ? ve.base : ve.lemma, ve) === 's' ? 'sein' : 'haben';
          const af = infl(ent(aux), { tense: 'pres', mood: 'ind', person: c.f.person, number: c.f.number });
          const pp = infl(ve, { form: 'part' }); if (!af || !pp) continue;
          const mid = W.slice(v + 1, cl.e + 1).filter(x => !x.punct).map(x => x.t);
          if (ve.sep && mid.length && key(mid[mid.length - 1]) === key(ve.sep)) mid.pop();
          const fx = cl.sub ? pp + ' ' + af : [af].concat(mid, [pp]).join(' ');
          push(err('tense', 'major', cl.sub ? [v, v] : [v, cl.e], likeCase(fx, w.t), `With «${W.slice(tw.s, tw.e + 1).map(x => x.t).join(' ').toLowerCase()}», use the past (Perfekt): «${fx}».`));
        }
      } else if (tw.t === 'future' && c.f.tense === 'past' && !w.aux) {
        const fx = infl(c.e, { tense: 'pres', mood: 'ind', person: c.f.person, number: c.f.number }); if (!fx) continue;
        push(err('tense', 'major', [v, v], likeCase(c.e.sep && !key(w.t).startsWith(key(c.e.sep)) ? fx.replace(new RegExp('^' + c.e.sep), '') : fx, w.t), `With «${W.slice(tw.s, tw.e + 1).map(x => x.t).join(' ').toLowerCase()}», use the present (or werden): «${fx}».`));
      }
    }
    // ---- minor: umlauts, capitals
    for (const w of W) {
      if (w.punct || done.has(w.i) || !w._r) continue;
      if (w.spell && low(w.spell) !== low(w.t)) { out.push(err('accent', 'minor', [w.i, w.i], w._r.e.pos === 'n' ? w.spell : likeCase(w.spell, w.t), `Spelled «${w._r.e.pos === 'n' ? w.spell : w.spell.toLowerCase()}».`)); continue; }
      // (a word a phrase spells in lower case, as typed, isn't a noun here: «ein paar» = a few)
      if (w._ph && (' ' + w._ph.lemma + ' ').includes(' ' + w.t + ' ')) continue;
      if (!isCap(w.t) && w._c.length && w._c.every(x => x.e.pos === 'n') && w._r.via !== 'compound') out.push(err('caps', 'minor', [w.i, w.i], capF(w.t), `Nouns start with a capital: «${capF(w.t)}».`));
    }
    return out;
  }

  // ------------------------------------------------------------ glosses, inflection, numbers
  const WHO = { '1s': 'I', '2s': 'you', '3s': 'he/she/it', '1p': 'we', '2p': 'you all', '3p': 'they / you (Sie)' };
  function describe(c) {
    const e = c.e, f = c.f || {}, pn = f.person ? f.person + f.number : '';
    if (c.via === 'compound' && c.parts) return c.parts.map(x => x.lemma).join(' + ');
    if (e.pos === 'v') {
      if (f.sep) return 'the separable part of ' + e.lemma;
      if (f.form === 'inf') return 'infinitive';
      if (f.form === 'zu') return 'zu-infinitive';
      if (f.form === 'part') return 'participle' + (f.att ? ', with an ending' : '') + ' (Perfekt: ' + (auxOf(e.sep ? e.base : e.lemma, e) === 's' ? 'sein' : 'haben') + ' + …)';
      if (f.mood === 'imp') return 'command, ' + (f.formal ? 'Sie' : f.vosotros ? 'ihr' : 'du');
      if (f.k2) return 'Konjunktiv II (would…), ' + WHO[pn];
      if (f.mood === 'subj') return 'Konjunktiv I (reported speech), ' + WHO[pn];
      return (f.tense === 'past' ? 'past (Präteritum)' : 'present') + ', ' + WHO[pn];
    }
    if (low(c.w) === low(e.lemma) && !f.case) return '';
    const bits = [];
    if (f.degree) bits.push(f.degree === 'cmp' ? 'comparative' : 'superlative');
    if (f.att) bits.push('with an ending');
    if (e.pos === 'n' && low(c.w) !== low(e.lemma)) { if (f.number === 'p') bits.push('plural'); if (f.case && f.case !== 'nom' && f.number !== 'p') bits.push({ acc: 'accusative', dat: 'dative', gen: 'genitive' }[f.case]); if (f.case === 'dat' && f.number === 'p') bits.push('dative'); if (f.gender === 'f' && e.fem) bits.push('feminine'); }
    if ((e.pos === 'det' || e.pos === 'pron') && f.case) bits.push({ nom: 'nominative', acc: 'accusative', dat: 'dative', gen: 'genitive' }[f.case] + (f.gender && f.number !== 'p' ? ' ' + ({ m: 'masculine', f: 'feminine', n: 'neuter' }[f.gender]) : f.number === 'p' ? ' plural' : ''));
    return bits.join(', ');
  }
  function enGloss(c) {
    const e = c.e, f = c.f || {};
    if (c.via === 'num' && c.num != null) return String(c.num);
    if (c.via === 'compound' && c.parts) return EN.first(c.parts[0].en) + ' ' + (f.number === 'p' ? EN.plural(c.parts[1].en) : EN.first(c.parts[1].en));
    if (e.pos === 'v' && f.k2) return EN.verb(e.en, { tense: 'cond', mood: 'ind', person: f.person, number: f.number });
    if (e.pos === 'v' && f.form === 'zu') return EN.verb(e.en, { form: 'inf' });
    if (e.pos === 'v' && f.sep) return '(part of ' + e.lemma + ': ' + EN.first(e.en) + ')';
    if (e.pos === 'v' && (f.mood || f.form)) return EN.verb(e.en, f);
    if (e.pos === 'n' && f.gender === 'f' && e.fem) { const m = /^([^/]+)\/(.+)$/.exec(e.en); const en = m ? m[2] : e.en; return f.number === 'p' ? EN.plural(en) : en; }
    if (e.pos === 'n' && f.number === 'p' && !e.plOnly) { const m = /^([^/]+)\/(.+)$/.exec(e.en); return EN.plural(m ? m[1] : e.en); }
    if (e.pos === 'adj' && f.degree === 'cmp') return EN.first(e.en) + 'er / more ' + EN.first(e.en);
    return e.en;
  }
  function inflect(e, f, P) {
    if (e.pos === 'v') {
      const list = e.sep ? conjSep(e) : conj(e.lemma);
      if (f.tense === 'perf') {
        const aux = P.entries.get('de:' + (auxOf(e.sep ? e.base : e.lemma, e) === 's' ? 'sein' : 'haben'));
        const a = inflect(aux, Object.assign({}, f, { tense: 'pres' }), P), pp = list.find(x => x[1] === 'part');
        return a && pp ? a + ' ' + pp[0] : null;
      }
      let k;
      if (f.form === 'inf') return e.lemma;
      if (f.form === 'part') k = 'part'; else if (f.form === 'zu') k = 'zu';
      else if (f.mood === 'imp') k = f.formal ? 'imp.2p.fo' : f.number === 'p' ? 'imp.2p.vt' : 'imp.2s';
      else { const pn = (f.person || 3) + (f.number || 's'); k = (f.k2 || f.mood === 'subj' && f.k2 !== false && f.tense !== 'pres' ? 'pres.k2.' : (f.tense === 'past' ? 'past.ind.' : 'pres.ind.')) + pn; if (f.k2) k = 'pres.k2.' + pn; }
      const hit = list.find(x => x[1] === k);
      return hit ? hit[0] : null;
    }
    if (e.pos === 'n') {
      const fs = nounForms(e), n = f.number === 'p' ? 'p' : 's', c = f.case || 'nom';
      const hit = fs.find(([, k]) => n === 'p' ? k === 'p.' + c : k.endsWith('.s.' + c));
      return hit ? hit[0] : e.lemma;
    }
    if ((e.det || e.art) && e.forms && /^(DER|DIES|EIN)/.test(e.forms)) return detForm(e, f.number === 'p' ? 'p' : (f.gender || 'm'), f.case || 'nom');
    if (e.pos === 'adj') {
      if (!f.case) return f.degree === 'cmp' ? (e.cmp || ((e.umlC ? uml(attStem(e.lemma)) : attStem(e.lemma)) + 'er')) : e.lemma;
      return attStem(e.lemma) + AEND[f.decl || 'wk'][f.case][f.number === 'p' ? 'p' : (f.gender || 'm')];
    }
    return e.lemma;
  }
  const UNITS = { null: 0, ein: 1, eins: 1, eine: 1, zwei: 2, zwo: 2, drei: 3, vier: 4, funf: 5, sechs: 6, sieben: 7, acht: 8, neun: 9 };
  const TEENS = { zehn: 10, elf: 11, zwolf: 12, dreizehn: 13, vierzehn: 14, funfzehn: 15, sechzehn: 16, siebzehn: 17, achtzehn: 18, neunzehn: 19 };
  const TENS = { zwanzig: 20, dreissig: 30, vierzig: 40, funfzig: 50, sechzig: 60, siebzig: 70, achtzig: 80, neunzig: 90 };
  function deNum(s) {
    s = key(s); if (!s) return null;
    const t = s.indexOf('tausend');
    if (t >= 0) { const a = s.slice(0, t), b = s.slice(t + 7); const x = a ? deNum(a) : 1, y = b ? deNum(b) : 0; return x == null || y == null ? null : x * 1000 + y; }
    const h = s.indexOf('hundert');
    if (h >= 0) { const a = s.slice(0, h), b = s.slice(h + 7); const x = a ? deNum(a) : 1, y = b ? deNum(b) : 0; return x == null || y == null ? null : x * 100 + y; }
    if (s in UNITS) return UNITS[s];
    if (s in TEENS) return TEENS[s];
    if (s in TENS) return TENS[s];
    const m = /^(ein|zwei|drei|vier|funf|sechs|sieben|acht|neun)und(zwanzig|dreissig|vierzig|funfzig|sechzig|siebzig|achtzig|neunzig)$/.exec(s);
    return m ? UNITS[m[1]] + TENS[m[2]] : null;
  }
  function numbers(W) {
    const out = [];
    for (const w of W) {
      if (w.punct) continue;
      if (w.num != null && !w._r) { out.push(w.num); continue; }
      const c = w._r; if (!c) continue;
      if (c.num != null) { out.push(c.num); continue; }
      if (c.e.pos === 'num' && c.e.num != null && !(c.e.art)) out.push(c.e.num);
    }
    return out;
  }
  const NUMWORD = /^(?:[a-zäöüß]*?)(?:zehn|zig|ßig|hundert|tausend|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|elf|zwölf)$/i;
  const expand0 = expand;
  function expandAll(tk, P) {
    const x = expand0(tk, P); if (x && x.length) return x;
    if (NUMWORD.test(tk.t)) {
      const n = deNum(tk.t);
      if (n != null) {
        // (DX-B2: the number words' headword, never indexed itself, so «Zahl» stays the noun; «zweiundzwanzig» was unknown without it)
        let e = P.entries.get('de:Zahl#num');
        if (!e) { e = { id: 'de:Zahl#num', lemma: 'Zahl', pos: 'num', en: 'a number', band: 1, tags: ['number'] }; P.entries.set(e.id, e); }
        return [{ e, f: feat(''), w: tk.t, exact: true, via: 'num', num: n }];
      }
    }
    return null;
  }

  // ------------------------------------------------------------ function words
  const CLOSED = `
@1
der|det:DER|the|art
ein|det:EIN1:ein|a, an|art indef
kein|det:EIN:kein|no, not a|neg
mein|det:EIN:mein|my|poss
dein|det:EIN:dein|your|poss
sein#poss|det:EIN:sein|his, its|poss
ihr#poss|det:EIN:ihr|her, their; Ihr: your (Sie)|poss
unser|det:EIN:unser|our|poss
dieser|det:DIES:dies|this, these|dem
jeder|det:DIES:jed|every, each|quant
welcher|det:DIES:welch|which|q
ich|pron:ich=1s.nom,mich=1s.acc,mir=1s.dat|I|subj
du|pron:du=2s.nom,dich=2s.acc,dir=2s.dat|you|subj
er|pron:er=3s.m.nom,ihn=3s.m.acc,ihm=3s.m.dat|he, it|subj
sie|pron:sie=3s.f.nom,sie=3s.f.acc,ihr=3s.f.dat|she, her, it|subj
es|pron:es=3s.n.nom,es=3s.n.acc,ihm=3s.n.dat|it|subj
wir|pron:wir=1p.nom,uns=1p.acc,uns=1p.dat|we, us|subj
ihr|pron:ihr=2p.nom,euch=2p.acc,euch=2p.dat|you all|subj
sie#pl|pron:sie=3p.nom,sie=3p.acc,ihnen=3p.dat|they, them|subj
Sie|pron:Sie=3p.nom,Sie=3p.acc,Ihnen=3p.dat|you (formal)|subj formal
man|pron|one, you, people|subj
sich|pron|himself, herself, itself, themselves, yourself|refl
mit|prep|with|case:dat
zu|prep|to; too (zu groß)|case:dat
von|prep|from, of|case:dat
bei|prep|at, near; at someone’s place|case:dat
aus|prep|out of, from|case:dat
nach|prep|to (a place), after|case:dat
für|prep|for|case:acc
ohne|prep|without|case:acc
in|prep|in, into|case:two
an|prep|at, on|case:two
auf|prep|on, onto|case:two
im|prep:im=m.s.dat,im=n.s.dat|in the (in + dem)|art
am|prep:am=m.s.dat,am=n.s.dat|at the, on the (an + dem)|art
ins|prep:ins=n.s.acc|into the (in + das)|art
zum|prep:zum=m.s.dat,zum=n.s.dat|to the (zu + dem)|art
zur|prep:zur=f.s.dat|to the (zu + der)|art
vom|prep:vom=m.s.dat,vom=n.s.dat|from the, of the (von + dem)|art
beim|prep:beim=m.s.dat,beim=n.s.dat|at the (bei + dem)|art
und|conj|and|coord
aber|conj|but|coord
oder|conj|or|coord
weil|conj|because|sub
dass|conj|that|sub alt:daß
wenn|conj|if, when|sub
nicht|adv|not|neg
auch|adv|also, too
sehr|adv|very
viel|adv|a lot, much
mehr|adv|more
schon|adv|already
noch|adv|still; yet; another
immer|adv|always
oft|adv|often
hier|adv|here
dort|adv|there
heute|adv|today|time:present
gestern|adv|yesterday|time:past
morgen|adv|tomorrow|time:future
jetzt|adv|now|time:present
dann|adv|then|adverbial
nur|adv|only
gern|adv|gladly (ich esse gern: I like eating)|alt:gerne
ja|int|yes
nein|int|no
etwas|pron|something
nichts|pron|nothing|neg
alles|pron|everything
was|pron|what; something|q
wer|pron:wer=nom,wen=acc,wem=dat,wessen=gen|who|q
wo|adv|where|q
wann|adv|when|q
warum|adv|why|q
wie|adv|how; like|q
hallo|int|hello
tschüss|int|bye|alt:tschüs
danke|int|thank you
bitte|int|please; you’re welcome
okay|int|OK|alt:ok
guten Morgen|phrase|good morning
ein paar|phrase|a few (ein Paar = a pair)
guten Tag|phrase|hello, good day
guten Abend|phrase|good evening
gute Nacht|phrase|good night
auf Wiedersehen|phrase|goodbye
bis bald|phrase|see you soon
bis morgen|phrase|see you tomorrow
wie geht’s|phrase|how are you?|alt:wie_gehts
es tut mir leid|phrase|I’m sorry
null|num|zero|n:0
eins|num|one|n:1
zwei|num|two|n:2 alt:zwo
drei|num|three|n:3
vier|num|four|n:4
fünf|num|five|n:5
sechs|num|six|n:6
sieben|num|seven|n:7
acht|num|eight|n:8
neun|num|nine|n:9
zehn|num|ten|n:10
elf|num|eleven|n:11
zwölf|num|twelve|n:12
zwanzig|num|twenty|n:20
hundert|num|a hundred|n:100
tausend|num|a thousand|n:1000
(Zahl)|num|(a number said as one word)
erste|a|first|noCmp
zweite|a|second|noCmp
dritte|a|third|noCmp
letzte|a|last|noCmp
@2
euer|det:EIN:euer|your (ihr)|poss
mancher|det:DIES:manch|some, many a|quant
alle|det:alle=p.nom,alle=p.acc,allen=p.dat,aller=p.gen|all|quant
beide|det:beide=p.nom,beide=p.acc,beiden=p.dat,beider=p.gen|both|quant
seit|prep|since, for (time)|case:dat
gegenüber|prep|opposite|case:dat
durch|prep|through|case:acc
gegen|prep|against|case:acc
um|prep|around; at (a time)|case:acc
bis|prep|until; by|case:acc
über|prep|over, about|case:two
unter|prep|under, among|case:two
vor|prep|in front of; before; ago|case:two
hinter|prep|behind|case:two
neben|prep|next to|case:two
zwischen|prep|between|case:two
wegen|prep|because of|case:gen
während|prep|during; while|case:gen
trotz|prep|despite|case:gen
ans|prep:ans=n.s.acc|to the (an + das)|art
aufs|prep:aufs=n.s.acc|onto the (auf + das)|art
denn|conj|because, for; (in questions) then|coord
sondern|conj|but rather|coord
ob|conj|whether, if|sub
obwohl|conj|although|sub
als|conj|when (past); than; as|sub
bevor|conj|before|sub
nachdem|conj|after|sub
damit|conj|so that|sub
sobald|conj|as soon as|sub
falls|conj|in case|sub
nie|adv|never|neg
niemals|adv|never|neg
weniger|adv|less
manchmal|adv|sometimes|adverbial
da|adv|there; then; since
danach|adv|afterwards|adverbial
später|adv|later|adverbial
früher|adv|earlier; in the past|adverbial
bald|adv|soon|adverbial
fast|adv|almost
vielleicht|adv|maybe|adverbial
leider|adv|unfortunately|adverbial
zusammen|adv|together
wieder|adv|again
doch|adv|yes (contradicting); after all
deshalb|adv|that’s why, so|adverbial
deswegen|adv|that’s why|adverbial
trotzdem|adv|still, anyway|adverbial
außerdem|adv|besides|adverbial
also|adv|so, well
zuerst|adv|first|adverbial
endlich|adv|finally|adverbial
plötzlich|adv|suddenly|adverbial
normalerweise|adv|usually|adverbial
eigentlich|adv|actually|adverbial
natürlich|adv|of course|adverbial
sofort|adv|right away|adverbial
gleich|adv|right away; same|adverbial
überall|adv|everywhere
irgendwo|adv|somewhere
draußen|adv|outside
drinnen|adv|inside
oben|adv|up, upstairs
unten|adv|down, downstairs
links|adv|on the left
rechts|adv|on the right
geradeaus|adv|straight ahead
jemand|pron|someone
niemand|pron|nobody|neg
wohin|adv|where to|q
woher|adv|where from|q
wieso|adv|why|q
wie viel|phrase|how much
wie viele|phrase|how many
dreizehn|num|thirteen|n:13
vierzehn|num|fourteen|n:14
fünfzehn|num|fifteen|n:15
sechzehn|num|sixteen|n:16
siebzehn|num|seventeen|n:17
achtzehn|num|eighteen|n:18
neunzehn|num|nineteen|n:19
dreißig|num|thirty|n:30
vierzig|num|forty|n:40
fünfzig|num|fifty|n:50
sechzig|num|sixty|n:60
siebzig|num|seventy|n:70
achtzig|num|eighty|n:80
neunzig|num|ninety|n:90
Million|f-en|million
zum Beispiel|phrase|for example
zu Hause|phrase|at home
nach Hause|phrase|(going) home
es gibt|phrase|there is, there are
gern geschehen|phrase|you’re welcome
keine Ahnung|phrase|no idea
ich finde|phrase|I think (in my opinion)
ich glaube|phrase|I believe, I think
meiner Meinung nach|phrase|in my opinion
@3
jedoch|adv|however|adverbial
sonst|adv|otherwise|adverbial
inzwischen|adv|meanwhile|adverbial
damals|adv|back then|adverbial
neulich|adv|recently|adverbial
seitdem|conj|since then|sub
indem|conj|by (doing)|sub
sodass|conj|so that|sub
statt|prep|instead of|case:gen
außer|prep|except|case:dat
entlang|prep|along|case:acc
innerhalb|prep|within|case:gen
außerhalb|prep|outside of|case:gen
vor allem|phrase|above all
auf jeden Fall|phrase|definitely
zum Glück|phrase|luckily
ab und zu|phrase|now and then
auf einmal|phrase|suddenly
im Gegenteil|phrase|on the contrary
`;
  const LISTS = [CLOSED];

  LISTS.push(`
@1 people,family
Person|f-en|person|per
Leute|pl|people|per
Mann|m¨er|man; husband|per
Frau|f-en|woman; wife; Mrs.|per
Kind|n-er|child|per
Junge|m-n|boy|per wk
Mädchen|n-|girl|per
Baby|n-s|baby|per
Freund|m-e|friend (boyfriend)/friend (girlfriend)|per f:Freundin
Familie|f-n|family
Vater|m¨|father|per
Mutter|f¨|mother|per
Papa|m-s|dad|per
Mama|f-s|mom|per
Eltern|pl|parents|per
Sohn|m¨e|son|per
Tochter|f¨|daughter|per
Bruder|m¨|brother|per
Schwester|f-n|sister|per
Geschwister|pl|siblings|per
Opa|m-s|grandpa|per
Oma|f-s|grandma|per
Großvater|m¨|grandfather|per
Großmutter|f¨|grandmother|per
Onkel|m-|uncle|per
Tante|f-n|aunt|per
Cousin|m-s|cousin/cousin (f)|per f:Cousine
Nachbar|m-n|neighbor/neighbor (f)|per wk f:Nachbarin
Herr|m-en|Mr., gentleman|per wk wkn:Herrn
Name|m-n|name|wk gen:Namens
Alter|n-|age
@1 work,people
Arbeit|f-en|work, job
Beruf|m-e|job, profession
Lehrer|m-|teacher|per f:Lehrerin
Schüler|m-|pupil, student|per f:Schülerin
Student|m-en|student|per wk f:Studentin
Arzt|m¨e|doctor|per f:Ärztin
Polizist|m-en|police officer|per wk f:Polizistin
Koch|m¨e|cook|per f:Köchin
Bäcker|m-|baker|per f:Bäckerin
Briefträger|m-|mail carrier|per f:Briefträgerin alt:Postbote
Gärtner|m-|gardener|per f:Gärtnerin
Musiker|m-|musician|per f:Musikerin
Bauer|m-n|farmer; pawn (chess)|per wk f:Bäuerin
Verkäufer|m-|salesperson|per f:Verkäuferin
Kellner|m-|waiter/waitress|per f:Kellnerin
Chef|m-s|boss|per f:Chefin
Künstler|m-|artist|per f:Künstlerin
Sänger|m-|singer|per f:Sängerin
Schneiderin|f-nen|seamstress|per alt:Näherin
@1 body,health
Körper|m-|body
Kopf|m¨e|head
Gesicht|n-er|face
Auge|n-n|eye
Ohr|n-en|ear
Nase|f-n|nose
Mund|m¨er|mouth
Zahn|m¨e|tooth
Haar|n-e|hair
Hand|f¨e|hand
Arm|m-e|arm
Finger|m-|finger
Bein|n-e|leg
Fuß|m¨e|foot
Rücken|m-|back
Bauch|m¨e|belly, stomach
Herz|n-en|heart|gen:Herzens
Gesundheit|f0|health
krank|a¨|sick, ill
gesund|a¨|healthy|+
Schmerz|m-en|pain|-
Medizin|f0|medicine
Krankenhaus|n¨er|hospital|place
@1 food
Essen|n-|food; meal
Frühstück|n-e|breakfast
Mittagessen|n-|lunch
Abendessen|n-|dinner, supper
Brot|n-e|bread
Brötchen|n-|bread roll
Apfel|m¨|apple
Birne|f-n|pear
Banane|f-n|banana
Orange|f-n|orange
Erdbeere|f-n|strawberry
Traube|f-n|grape
Zitrone|f-n|lemon
Obst|n0|fruit
Gemüse|n-|vegetables
Tomate|f-n|tomato
Kartoffel|f-n|potato
Zwiebel|f-n|onion
Salat|m-e|salad; lettuce
Reis|m0|rice
Mais|m0|corn
Fleisch|n0|meat
Huhn|n¨er|chicken
Fisch|m-e|fish
Ei|n-er|egg
Käse|m-|cheese
Wurst|f¨e|sausage
Butter|f0|butter
Zucker|m0|sugar
Salz|n0|salt
Suppe|f-n|soup
Nudeln|pl|noodles, pasta
Pizza|f-s|pizza
Kuchen|m-|cake
Keks|m-e|cookie
Bonbon|n-s|candy
Schokolade|f-n|chocolate|alt:Schoki
Eis|n0|ice; ice cream
Honig|m-e|honey
@1 drink,food
Wasser|n-|water
Kaffee|m-s|coffee
Tee|m-s|tea
Saft|m¨e|juice
Milch|f0|milk
Limonade|f-n|lemonade, soda|alt:Limo,Cola
Glas|n¨er|glass
Tasse|f-n|cup
Teller|m-|plate
Flasche|f-n|bottle
@1 home
Haus|n¨er|house|place
Wohnung|f-en|apartment|place
Zimmer|n-|room|place
Küche|f-n|kitchen|place
Bad|n¨er|bathroom; bath|place
Wohnzimmer|n-|living room|place
Schlafzimmer|n-|bedroom|place
Garten|m¨|garden|place
Tür|f-en|door
Fenster|n-|window
Tisch|m-e|table
Stuhl|m¨e|chair
Bett|n-en|bed
Lampe|f-n|lamp
Schlüssel|m-|key
Buch|n¨er|book
Papier|n-e|paper
Foto|n-s|photo|alt:Bild
Uhr|f-en|clock, watch; o’clock
Telefon|n-e|phone
Handy|n-s|cell phone
Computer|m-|computer
Fernseher|m-|TV set
Radio|n-s|radio
@1 town
Stadt|f¨e|city, town|place
Dorf|n¨er|village|place
Straße|f-n|street|place
Platz|m¨e|square; place, seat|place
Park|m-s|park|place
Laden|m¨|shop|place
Geschäft|n-e|shop; business|place
Markt|m¨e|market|place
Supermarkt|m¨e|supermarket|place
Schule|f-n|school|place
Bibliothek|f-en|library|place
Kirche|f-n|church|place
Bank|f-en|bank|place
Restaurant|n-s|restaurant|place
Kino|n-s|cinema|place
Museum|n:Museen|museum|place
Büro|n-s|office|place
Bahnhof|m¨e|train station|place
@1 nature,place
Strand|m¨e|beach|place
Meer|n-e|sea|place
Fluss|m¨e|river|place
See|m-n|lake|place
Berg|m-e|mountain|place
Wald|m¨er|forest|place
Feld|n-er|field|place
Insel|f-n|island|place
Brücke|f-n|bridge|place
Turm|m¨e|tower; rook (chess)|place
Weg|m-e|way, path
Land|n¨er|country; countryside|place
Welt|f-en|world
Ort|m-e|place|place
@1 nature
Baum|m¨e|tree
Blume|f-n|flower
Blatt|n¨er|leaf; sheet of paper
Pflanze|f-n|plant
Stein|m-e|stone, rock
Erde|f0|earth, soil
Feuer|n-|fire
Sonne|f-n|sun
Mond|m-e|moon
Stern|m-e|star
Himmel|m-|sky; heaven
@1 weather
Wetter|n0|weather
Regen|m0|rain
Schnee|m0|snow
Wind|m-e|wind
Wolke|f-n|cloud
regnen|v|rain
schneien|v|snow
@1 animal
Tier|n-e|animal
Hund|m-e|dog
Katze|f-n|cat|alt:Kater
Vogel|m¨|bird
Pferd|n-e|horse; knight (chess)
Kuh|f¨e|cow
Schwein|n-e|pig
Schaf|n-e|sheep
Ente|f-n|duck
Maus|f¨e|mouse
Hase|m-n|hare, bunny|wk
Fuchs|m¨e|fox
Bär|m-en|bear|wk
Frosch|m¨e|frog
Biene|f-n|bee
Schmetterling|m-e|butterfly
@1 time
Zeit|f-en|time
Stunde|f-n|hour
Minute|f-n|minute
Tag|m-e|day
Woche|f-n|week
Monat|m-e|month
Jahr|n-e|year
Morgen|m-|morning
Vormittag|m-e|morning (before noon)
Mittag|m-e|noon
Nachmittag|m-e|afternoon
Abend|m-e|evening
Nacht|f¨e|night
Montag|m-e|Monday|time
Dienstag|m-e|Tuesday|time
Mittwoch|m-e|Wednesday|time
Donnerstag|m-e|Thursday|time
Freitag|m-e|Friday|time
Samstag|m-e|Saturday|time
Sonntag|m-e|Sunday|time
Wochenende|n-n|weekend
Moment|m-e|moment
Mal|n-e|time (einmal: once)
Geburtstag|m-e|birthday
Fest|n-e|celebration, party
Party|f-s|party
Ferien|pl|holidays, vacation
Urlaub|m-e|vacation
@1 school,language
Unterricht|m0|lessons, class
Klasse|f-n|class
Prüfung|f-en|exam
Test|m-s|test
Hausaufgabe|f-n|homework
Heft|n-e|notebook
Stift|m-e|pen, pencil
Frage|f-n|question
Antwort|f-en|answer
Wort|n¨er|word
Sprache|f-n|language
Deutsch|n0|German (the language)
Englisch|n0|English (the language)
@1 hobby,sport,music
Spiel|n-e|game
Sport|m0|sport
Fußball|m¨e|soccer, football
Musik|f0|music
Lied|n-er|song
Film|m-e|film, movie
Hobby|n-s|hobby
@1 money,shop
Geld|n-er|money
Münze|f-n|coin
Euro|m-s|euro
Preis|m-e|price; prize
@1 transport,travel
Zug|m¨e|train|transport
Auto|n-s|car|transport
Bus|m:Busse|bus|transport
Fahrrad|n¨er|bicycle|transport
Flugzeug|n-e|airplane|transport
Boot|n-e|boat|transport
Schiff|n-e|ship|transport
Reise|f-n|trip
@1 clothes
Kleidung|f0|clothes
Hemd|n-en|shirt
T-Shirt|n-s|T-shirt
Hose|f-n|pants, trousers
Schuh|m-e|shoe
Hut|m¨e|hat
Kleid|n-er|dress
Jacke|f-n|jacket
Mütze|f-n|cap, beanie
@1 color
Farbe|f-n|color
rot|a¨|red
blau|a|blue
grün|a|green
gelb|a|yellow
weiß|a|white|alt:weiss
schwarz|a¨|black
grau|a|gray
braun|a|brown
rosa|a|pink|noDecl noCmp
lila|a|purple|noDecl noCmp
orange|a|orange (color)|noDecl noCmp
@1 feeling
froh|a|glad, happy|+
glücklich|a|happy|+
fröhlich|a|cheerful|+
traurig|a|sad|-
wütend|a|angry|-
böse|a|angry; evil|-
müde|a|tired
langweilig|a|boring|-
ruhig|a|calm, quiet|+
Liebe|f0|love|+
Angst|f¨e|fear|-
Hunger|m0|hunger (ich habe Hunger: I’m hungry)
Durst|m0|thirst
@1
gut|a|good; well|cmp:besser sup:best +
schlecht|a|bad|-
groß|a¨|big, tall|sup:größt
klein|a|small, little
hoch|a¨|high|cmp:höher sup:höchst
lang|a¨|long
kurz|a¨|short
neu|a|new
alt|a¨|old
jung|a¨|young
schön|a|beautiful, nice|+
hässlich|a|ugly|-
leicht|a|easy; light
schwer|a|difficult; heavy
schnell|a|fast
langsam|a|slow
teuer|a|expensive
billig|a|cheap
reich|a|rich
arm|a¨|poor
sauber|a|clean
schmutzig|a|dirty
voll|a|full
leer|a|empty
heiß|a|hot
warm|a¨|warm
kalt|a¨|cold
lecker|a|delicious|+
wichtig|a|important
interessant|a|interesting|+
lustig|a|funny, fun|+
nett|a|nice|+
freundlich|a|friendly|+
lieb|a|kind, dear|+
toll|a|great|+
super|a|super, great|noDecl noCmp +
bereit|a|ready
fertig|a|ready, done
frei|a|free
offen|a|open
geschlossen|a|closed
allein|a|alone|noDecl noCmp
schlafend|a|asleep|noCmp
@1
sein|v|be
haben|v|have
werden|v|become; will (future)
gehen|v|go, walk
kommen|v|come
machen|v|do, make
tun|v|do
sagen|v|say
können|v|can, be able to
müssen|v|must, have to
wollen|v|want
mögen|v|like
möchten|phrase|would like
dürfen|v|may, be allowed to
sollen|v|should, be supposed to
wissen|v|know (a fact)
kennen|v|know (a person, a place)
sehen|v|see
schauen|v|look
hören|v|hear
sprechen|v|speak
fragen|v|ask
antworten|v|answer
heißen|v|be called (ich heiße: my name is)
essen|v|eat
trinken|v|drink
nehmen|v|take
wohnen|v|live (somewhere)
leben|v|live
arbeiten|v|work
lernen|v|learn, study
studieren|v|study (at university)
lehren|v|teach
lesen|v|read
schreiben|v|write
spielen|v|play
laufen|v|run; walk
rennen|v|run
schwimmen|v|swim
tanzen|v|dance
singen|v|sing
schlafen|v|sleep
auf+wachen|v.s|wake up
auf+stehen|v.s|get up
öffnen|v|open
schließen|v|close
an+fangen|v|begin, start
beginnen|v|begin
enden|v|end
aus+gehen|v.s|go out
fahren|v|drive, go (by vehicle)
an+kommen|v.s|arrive
zurück+kommen|v.s|come back
suchen|v|look for
finden|v|find; think (ich finde…)
verlieren|v|lose
gewinnen|v|win
bezahlen|v|pay
zahlen|v|pay
kaufen|v|buy
verkaufen|v|sell
kosten|v|cost; taste
brauchen|v|need
benutzen|v|use
tragen|v|carry; wear
bringen|v|bring
geben|v|give
helfen|v|help
warten|v|wait
hoffen|v|hope
denken|v|think
glauben|v|believe
fühlen|v|feel
lieben|v|love
gefallen|v|please (es gefällt mir: I like it)
erinnern|v|remind; (sich) remember
vergessen|v|forget
besuchen|v|visit
übernachten|v|stay overnight
überweisen|v|transfer (money)
unterschreiben|v|sign
unterhalten|v|entertain; (sich) talk
übertreiben|v|exaggerate
missverstehen|v|misunderstand
überholen|v|overtake
überprüfen|v|check, verify
unterrichten|v|teach
beantworten|v|answer
besichtigen|v|visit (a sight), tour
verändern|v|change
reservieren|v|reserve, book
kontrollieren|v|check, control
bedienen|v|serve
beschäftigen|v|keep busy, employ
beobachten|v|watch, observe
reisen|v.s|travel
kochen|v|cook
putzen|v|clean
waschen|v|wash
legen|v|lay, put
stellen|v|put, place (standing)
springen|v|jump|alt:hüpfen
schlagen|v|hit|alt:hauen
werfen|v|throw
an+greifen|v|attack
schieben|v|push
klettern|v.s|climb
pusten|v|blow|alt:blasen
fliegen|v|fly
fallen|v|fall
zeigen|v|show
erklären|v|explain
verstehen|v|understand
wiederholen|v|repeat
üben|v|practice
ruhen|v|rest
stehen|v|stand
sitzen|v|sit
liegen|v|lie (be lying)
`);
  LISTS.push(`
@2 hush
Schweigling|m-e|hushling (a small Hush creature)
Riesenschweigling|m-e|big hushling
Stille|f0|silence; the Hush (die Stille)
Mimo|name|Mimo (your friend)
Noa|name|Noa
Alba|name|Alba (the town)
Molinar|name|Molinar (the windmill village)
Remanso|name|Remanso (the lake village)
Deutschland|name|Germany|country
Österreich|name|Austria|country
Schweiz|name|Switzerland|country
Berlin|name|Berlin
Glocke|f-n|bell
Mühle|f-n|mill, windmill|place
Windmühle|f-n|windmill|place
Steinbruch|m¨e|quarry|place
Höhle|f-n|cave|place
Gipfel|m-|peak, summit|place
Motte|f-n|moth
Käfer|m-|beetle
Gürteltier|n-e|armadillo
Puppe|f-n|doll; dummy
Korn|n¨er|grain, kernel|alt:Maiskorn
Popcorn|n0|popcorn
Oberst|m-en|colonel|wk
Mitte|f-n|middle
Schwanz|m¨e|tail
Panzer|m-|shell; tank
Flügel|m-|wing
Steinchen|n-|pebble
Brocken|m-|big rock, chunk
Fledermaus|f¨e|bat
Schneeball|m¨e|snowball
Ruder|n-|oar|alt:Paddel
Laterne|f-n|lantern
Seil|n-e|rope|alt:Tau
Vogelscheuche|f-n|scarecrow
Passwort|n¨er|password|alt:Parole,Kennwort
Labyrinth|n-e|maze|alt:Irrgarten
Domino|n-s|dominoes
Dominostein|m-e|domino tile
Grab|n¨er|grave|alt:Grabstein
Friedhof|m¨e|cemetery|place
Kerze|f-n|candle
Krähe|f-n|crow|alt:Rabe
Gong|m-s|gong
Kristall|m-e|crystal
Kanarienvogel|m¨|canary|alt:Kanarie
Rose|f-n|rose
Sonnenblume|f-n|sunflower
Tulpe|f-n|tulip
Lavendel|m0|lavender
Bienenstock|m¨e|beehive|alt:Bienenkorb
Gewächshaus|n¨er|greenhouse|place
Teppich|m-e|rug, carpet
Ofen|m¨|oven, stove
Schere|f-n|scissors
Schach|n0|chess
Dame|f-n|lady; queen (chess); checkers|alt:Damespiel
Springer|m-|knight (chess)
Läufer|m-|bishop (chess); runner
König|m-e|king
Königin|f-nen|queen
Medaille|f-n|medal
Kopfhörer|m-|headphones
Aufnahmegerät|n-e|recorder
Kassette|f-n|cassette
Gartenzwerg|m-e|garden gnome|alt:Zwerg
Würfel|m-|die (dice)
Briefkasten|m¨|mailbox
Postkarte|f-n|postcard
Brief|m-e|letter
Gedicht|n-e|poem
Hammer|m¨|hammer
Decke|f-n|blanket; ceiling
Schallplatte|f-n|record|alt:Platte
Kaugummi|m-s|chewing gum
Zeitung|f-en|newspaper
Drachen|m-|kite
Teigtasche|f-n|dumpling|alt:Jiaozi
Dampfnudel|f-n|steamed bun|alt:Baozi
Wantan|m-s|wonton|alt:Wonton
Frühlingsrolle|f-n|spring roll
Pokal|m-e|cup, trophy
Viertel|n-|quarter; neighborhood|place
Glück|n0|luck; happiness|+
Tasche|f-n|bag; pocket
Gold|n0|gold
Pilz|m-e|mushroom
Norden|m0|north
Süden|m0|south
Osten|m0|east
Westen|m0|west
Hügel|m-|hill|place
los|adv|off, away; (los!) let’s go
@2
an+rufen|v|call (on the phone)
ein+kaufen|v|go shopping
fern+sehen|v|watch TV
mit+kommen|v.s|come along
mit+bringen|v|bring along
ein+laden|v|invite
ab+holen|v|pick up, fetch
auf+räumen|v|tidy up
auf+hören|v|stop
aus+sehen|v|look (appear)
an+ziehen|v|put on (clothes)
aus+ziehen|v|take off (clothes)
um+ziehen|v.s|move (house)
zu+machen|v|close
auf+machen|v|open
ab+fahren|v.s|leave, depart
weg+gehen|v.s|go away
vorbei+kommen|v.s|drop by
ein+schlafen|v.s|fall asleep
kennen+lernen|v|get to know, meet
spazieren+gehen|v.s|go for a walk
statt+finden|v|take place
teil+nehmen|v|take part
vor+stellen|v|introduce; (sich) imagine
zu+hören|v|listen
an+schauen|v|look at
an+machen|v|turn on
aus+machen|v|turn off
mit+machen|v|join in
nach+denken|v|think about
vor+bereiten|v|prepare
zurück+geben|v|give back
aus+geben|v|spend (money)
ab+schließen|v|lock
ein+steigen|v.s|get in, board
aus+steigen|v.s|get out, get off
um+steigen|v.s|change (trains)
frühstücken|v|have breakfast
bestellen|v|order
probieren|v|try, taste
schmecken|v|taste (good)
riechen|v|smell
backen|v|bake
schneiden|v|cut
feiern|v|celebrate
schenken|v|give (as a gift)
bekommen|v|get, receive
schicken|v|send
senden|v|send
zeichnen|v|draw
malen|v|paint
fotografieren|v|take photos
telefonieren|v|talk on the phone
treffen|v|meet
grüßen|v|greet
lachen|v|laugh
lächeln|v|smile
weinen|v|cry
rufen|v|call, shout
schreien|v|scream
schweigen|v|be silent
flüstern|v|whisper
erzählen|v|tell
berichten|v|report
diskutieren|v|discuss
streiten|v|argue
küssen|v|kiss
umarmen|v|hug
heiraten|v|marry
sterben|v|die
leiden|v|suffer
wachsen|v|grow
gehören|v|belong
passieren|v.s|happen
geschehen|v|happen
versuchen|v|try
entscheiden|v|decide
wählen|v|choose; vote
planen|v|plan
mieten|v|rent
ziehen|v|pull; move
stoßen|v|push, bump
heben|v|lift
halten|v|hold; stop
hängen|v|hang
bauen|v|build
reparieren|v|repair
kaputt+machen|v|break
brechen|v|break
funktionieren|v|work (a machine)
sammeln|v|collect
wandern|v.s|hike
segeln|v|sail
angeln|v|fish
reiten|v|ride (a horse)
joggen|v|jog
trainieren|v|train
verdienen|v|earn
sparen|v|save (money)
leihen|v|lend; borrow
hassen|v|hate
vermissen|v|miss (someone)
sorgen|v|care; (sich) worry
freuen|v|please; (sich freuen) be glad|refl
ärgern|v|annoy; (sich) be annoyed
beeilen|v|(sich) hurry|refl
entschuldigen|v|excuse; (sich) apologize
interessieren|v|interest; (sich) be interested
verbringen|v|spend (time)
übersetzen|v|translate
bedeuten|v|mean
korrigieren|v|correct
@2 people,family
Enkel|m-|grandchild|per f:Enkelin
Neffe|m-n|nephew|per wk
Nichte|f-n|niece|per
Ehemann|m¨er|husband|per
Ehefrau|f-en|wife|per
Paar|n-e|couple, pair
Kollege|m-n|colleague|per wk f:Kollegin
Gast|m¨e|guest|per
Fremde|m-n|stranger|per
Erwachsene|m-n|adult|per
Zwilling|m-e|twin|per
Mensch|m-en|person, human|per wk
@2 work,people
Anwalt|m¨e|lawyer|per f:Anwältin
Ingenieur|m-e|engineer|per f:Ingenieurin
Feuerwehrmann|m¨er|firefighter|per
Kunde|m-n|customer|per wk f:Kundin
Tourist|m-en|tourist|per wk f:Touristin
Fahrer|m-|driver|per f:Fahrerin
Pilot|m-en|pilot|per wk f:Pilotin
Journalist|m-en|journalist|per wk f:Journalistin
Schmied|m-e|blacksmith|per
Uhrmacher|m-|watchmaker|per
Fährmann|m¨er|ferryman|per
Firma|f:Firmen|company
Termin|m-e|appointment
Projekt|n-e|project
@2
Ding|n-e|thing
Sache|f-n|thing, matter
Idee|f-n|idea
Problem|n-e|problem
Wahrheit|f-en|truth|+
Lüge|f-n|lie|-
Grund|m¨e|reason; ground
Teil|m-e|part
Art|f-en|kind, type; way
Beispiel|n-e|example
Nummer|f-n|number
Zahl|f-en|number
Hälfte|f-n|half
Gruppe|f-n|group
Geschichte|f-n|story; history
Nachricht|f-en|message; news
Geschenk|n-e|gift, present|+
Überraschung|f-en|surprise
Hilfe|f-n|help
Plan|m¨e|plan
Traum|m¨e|dream
Leben|n-|life
Tod|m-e|death|-
Frieden|m0|peace|+
Krieg|m-e|war|-
Ende|n-n|end
Anfang|m¨e|beginning
Zentrum|n:Zentren|center
Seite|f-n|side; page
Punkt|m-e|point; dot
Rechnung|f-en|bill
Liste|f-n|list
Spielzeug|n-e|toy
Ball|m¨e|ball
@2 home
Treppe|f-n|stairs
Boden|m¨|floor, ground
Dach|n¨er|roof
Wand|f¨e|wall
Möbel|pl|furniture
Sofa|n-s|sofa
Schrank|m¨e|cupboard, wardrobe
Regal|n-e|shelf
Spiegel|m-|mirror
Vorhang|m¨e|curtain
Kissen|n-|pillow, cushion
Handtuch|n¨er|towel
Seife|f-n|soap
Müll|m0|trash
Kühlschrank|m¨e|refrigerator
Herd|m-e|stove
Waschmaschine|f-n|washing machine
Löffel|m-|spoon
Messer|n-|knife
Gabel|f-n|fork
Topf|m¨e|pot
Pfanne|f-n|pan
Kiste|f-n|box, crate
Rucksack|m¨e|backpack
Regenschirm|m-e|umbrella
@2 clothes
Rock|m¨e|skirt
Mantel|m¨|coat
Pullover|m-|sweater
Socke|f-n|sock
Stiefel|m-|boot
Schal|m-s|scarf
Handschuh|m-e|glove
Gürtel|m-|belt
Brille|f-n|glasses
Ring|m-e|ring
Kette|f-n|necklace; chain
Anzug|m¨e|suit
Kostüm|n-e|costume
Schlafanzug|m¨e|pajamas
@2 food
Öl|n-e|oil
Pfeffer|m0|pepper
Mehl|n0|flour
Knoblauch|m0|garlic
Karotte|f-n|carrot|alt:Möhre
Gurke|f-n|cucumber
Kirsche|f-n|cherry
Pfirsich|m-e|peach
Schinken|m-|ham
Würstchen|n-|little sausage
Hamburger|m-|hamburger
Brezel|f-n|pretzel
Nachtisch|m-e|dessert
Marmelade|f-n|jam
Joghurt|m-s|yogurt
Müsli|n-s|muesli, cereal
Rezept|n-e|recipe
Speisekarte|f-n|menu
Döner|m-|döner kebab
Lebkuchen|m-|gingerbread
Plätzchen|n-|cookie (Christmas)
Kinderpunsch|m-e|kids’ punch
@2 health,body
Hals|m¨e|neck; throat
Schulter|f-n|shoulder
Knie|n-|knee
Lippe|f-n|lip
Zunge|f-n|tongue
Blut|n0|blood
Knochen|m-|bone
Haut|f¨e|skin
Fieber|n0|fever
Husten|m0|cough
Grippe|f-n|flu
Erkältung|f-en|cold (illness)
Tablette|f-n|pill
Apotheke|f-n|pharmacy|place
Wunde|f-n|wound
@2 town
Bäckerei|f-en|bakery|place
Hotel|n-s|hotel|place
Universität|f-en|university|place
Flughafen|m¨|airport|place
Hafen|m¨|harbor, port|place
Ecke|f-n|corner|place
Fabrik|f-en|factory|place
Bauernhof|m¨e|farm|place
Theater|n-|theater|place
Schwimmbad|n¨er|swimming pool|place
Stadion|n:Stadien|stadium|place
Post|f0|post office; mail|place
Polizei|f0|police|place
Brunnen|m-|fountain; well|place
Leuchtturm|m¨e|lighthouse|place
Steg|m-e|jetty, pier|place
Dönerladen|m¨|döner shop|place
@2 nature
Gras|n¨er|grass
Ast|m¨e|branch
Wurzel|f-n|root
Samen|m-|seed
Fels|m-en|rock|wk
Sand|m0|sand
Welle|f-n|wave
Küste|f-n|coast|place
Tal|n¨er|valley|place
Wüste|f-n|desert|place
Natur|f0|nature
Luft|f¨e|air
Rauch|m0|smoke
Sturm|m¨e|storm
Gewitter|n-|thunderstorm
Donner|m0|thunder
Blitz|m-e|lightning
Nebel|m-|fog
Regenbogen|m¨|rainbow
Klima|n-s|climate
Grad|m-e|degree
@2 animal
Haustier|n-e|pet
Küken|n-|chick
Ziege|f-n|goat
Esel|m-|donkey
Wolf|m¨e|wolf
Löwe|m-n|lion|wk
Tiger|m-|tiger
Affe|m-n|monkey|wk
Elefant|m-en|elephant|wk
Schlange|f-n|snake; line (queue)
Spinne|f-n|spider
Fliege|f-n|fly
Ameise|f-n|ant
Schildkröte|f-n|turtle
Wal|m-e|whale
Delfin|m-e|dolphin
Hai|m-e|shark
Eule|f-n|owl
Papagei|m-en|parrot
Wurm|m¨er|worm
Schnecke|f-n|snail
`);
  LISTS.push(`
@2 time
Januar|m-e|January|time
Februar|m-e|February|time
März|m-e|March|time
April|m-e|April|time
Mai|m-e|May|time
Juni|m-s|June|time
Juli|m-s|July|time
August|m-e|August|time
September|m-|September|time
Oktober|m-|October|time
November|m-|November|time
Dezember|m-|December|time
Frühling|m-e|spring|time
Sommer|m-|summer|time
Herbst|m-e|autumn, fall|time
Winter|m-|winter|time
Mitternacht|f¨e|midnight|time
Datum|n:Daten|date
Kalender|m-|calendar
Jahrhundert|n-e|century
Vergangenheit|f-en|the past
Zukunft|f0|the future
Gegenwart|f0|the present
Weile|f0|while
@2 school,language
Fach|n¨er|school subject
Mathe|f0|math
Wissenschaft|f-en|science
Kunst|f¨e|art
Note|f-n|grade; note
Kuli|m-s|pen
Radiergummi|m-s|eraser
Lineal|n-e|ruler
Tafel|f-n|board
Wörterbuch|n¨er|dictionary
Satz|m¨e|sentence
Buchstabe|m-n|letter (of the alphabet)|wk gen:Buchstabens
Text|m-e|text
Märchen|n-|fairy tale
Roman|m-e|novel
Grammatik|f-en|grammar
Fehler|m-|mistake
Spanisch|n0|Spanish (the language)
Französisch|n0|French (the language)
Portugiesisch|n0|Portuguese (the language)
Chinesisch|n0|Chinese (the language)
Japanisch|n0|Japanese (the language)
@2 hobby,sport,music
Basketball|m0|basketball
Tennis|n0|tennis
Mannschaft|f-en|team
Spieler|m-|player|per f:Spielerin
Gitarre|f-n|guitar
Klavier|n-e|piano
Trommel|f-n|drum
Geige|f-n|violin
Flöte|f-n|flute
Konzert|n-e|concert
Band|f-s|band
Tanz|m¨e|dance
Zeichnung|f-en|drawing
Bild|n-er|picture, painting
Serie|f-n|series, show
Sendung|f-en|program, show
Spaziergang|m¨e|walk
Ausflug|m¨e|trip, outing
Karte|f-n|card; map; ticket
@2 travel,transport
Koffer|m-|suitcase
Pass|m¨e|passport
Fahrkarte|f-n|ticket
Ticket|n-s|ticket
U-Bahn|f-en|subway|transport
Straßenbahn|f-en|tram|transport
Taxi|n-s|taxi|transport
Lastwagen|m-|truck|transport
Motorrad|n¨er|motorbike|transport
Floß|n¨e|raft|transport
Flug|m¨e|flight
Ausgang|m¨e|exit
Eingang|m¨e|entrance
Grenze|f-n|border
Adresse|f-n|address
Richtung|f-en|direction
@2 money,shop
Kasse|f-n|checkout, till
Angebot|n-e|offer
Einkauf|m¨e|purchase, shopping
Kilo|n-s|kilo
Liter|m-|liter
Stück|n-e|piece
Paket|n-e|package
Quittung|f-en|receipt
@2 feeling
nervös|a|nervous
aufgeregt|a|excited|noCmp
überrascht|a|surprised|noCmp
stolz|a|proud|+
eifersüchtig|a|jealous|-
verliebt|a|in love|noCmp +
besorgt|a|worried|noCmp -
einsam|a|lonely|-
Freude|f-n|joy|+
Trauer|f0|sadness, grief|-
Gefühl|n-e|feeling
Kuss|m¨e|kiss|+
Umarmung|f-en|hug|+
Heimweh|n0|homesickness
@2
anders|a|different|noDecl noCmp
gleich#adj|a|same, equal|noCmp
ähnlich|a|similar
eigen|a|own|noCmp
einzig|a|only, single|noCmp
besonders|adv|especially
besonder|a|special|noCmp
normal|a|normal
komisch|a|funny, strange
seltsam|a|strange
perfekt|a|perfect|+
schrecklich|a|terrible|-
furchtbar|a|awful|-
wunderbar|a|wonderful|+
fantastisch|a|fantastic|+
dick|a|fat, thick
dünn|a|thin
stark|a¨|strong
schwach|a¨|weak
klug|a¨|clever|+
dumm|a¨|stupid|-
fleißig|a|hard-working|+
faul|a|lazy|-
ernst|a|serious
schüchtern|a|shy
mutig|a|brave|+
großzügig|a|generous|+
höflich|a|polite|+
unhöflich|a|rude|-
geduldig|a|patient|+
still|a|quiet, still
laut|a|loud
leise|a|quiet, soft
gefährlich|a|dangerous|-
sicher|a|safe; sure
möglich|a|possible
unmöglich|a|impossible
nötig|a|necessary
nützlich|a|useful
bequem|a|comfortable
hell|a|bright, light
dunkel|a|dark
weich|a|soft
hart|a¨|hard
breit|a|wide
eng|a|narrow, tight
tief|a|deep
nass|a|wet
trocken|a|dry
süß|a|sweet; cute
salzig|a|salty
scharf|a¨|spicy; sharp
bitter|a|bitter
frisch|a|fresh
modern|a|modern
berühmt|a|famous
beliebt|a|popular
öffentlich|a|public
privat|a|private
richtig|a|right, correct
falsch|a|wrong
nächste|a|next|noCmp
ganz|a|whole; quite|noCmp
halb|a|half|noCmp
@2 place,people
deutsch|a|German|noCmp
spanisch|a|Spanish|noCmp
mexikanisch|a|Mexican|noCmp
brasilianisch|a|Brazilian|noCmp
portugiesisch|a|Portuguese|noCmp
französisch|a|French|noCmp
englisch|a|English|noCmp
amerikanisch|a|American|noCmp
chinesisch|a|Chinese|noCmp
japanisch|a|Japanese|noCmp
türkisch|a|Turkish|noCmp
ausländisch|a|foreign|noCmp
Ausländer|m-|foreigner|per f:Ausländerin
Deutsche|m-n|German (person)|per wk
Spanien|name|Spain|country
Mexiko|name|Mexico|country
Brasilien|name|Brazil|country
Frankreich|name|France|country
Italien|name|Italy|country
England|name|England|country
Amerika|name|America|country
China|name|China|country
Japan|name|Japan|country
Türkei|name|Turkey|country
@2 tech
Internet|n0|internet
Bildschirm|m-e|screen
Tastatur|f-en|keyboard
Kamera|f-s|camera
Video|n-s|video
Netz|n-e|net, network
App|f-s|app
Akku|m-s|battery
Ladegerät|n-e|charger
@3
erreichen|v|reach, achieve
entwickeln|v|develop
verbessern|v|improve
verschlechtern|v|make worse
sinken|v|sink, fall
erhöhen|v|raise
senken|v|lower
schützen|v|protect
verschmutzen|v|pollute
recyceln|v|recycle
retten|v|save, rescue
an+bieten|v|offer
danken|v|thank
verschwinden|v|disappear
erscheinen|v.s|appear
erkennen|v|recognize
gehorchen|v|obey
vor+schlagen|v|suggest
an+nehmen|v|accept; assume
vermuten|v|suppose
meinen|v|think, mean
zweifeln|v|doubt
ab+lehnen|v|reject
überzeugen|v|convince
erlauben|v|allow
verbieten|v|forbid
zwingen|v|force
versprechen|v|promise
vertrauen|v|trust
beschweren|v|(sich) complain
überraschen|v|surprise
erschrecken|v|scare
bereuen|v|regret
wagen|v|dare
gewöhnen|v|(sich) get used to
erfahren|v|find out; experience
verwandeln|v|transform
nutzen|v|use, make use of
vermeiden|v|avoid
verhindern|v|prevent
organisieren|v|organize
erfüllen|v|fulfill
schaffen|v|manage, make it
besiegen|v|defeat
scheitern|v.s|fail
überleben|v|survive
kämpfen|v|fight
verteidigen|v|defend
fliehen|v|flee
fangen|v|catch
verfolgen|v|chase
erforschen|v|explore, research
erfinden|v|invent
zerstören|v|destroy
investieren|v|invest
ein+stellen|v|hire
kündigen|v|quit; fire
respektieren|v|respect
bewundern|v|admire
kritisieren|v|criticize
unterstützen|v|support
teilen|v|share
mit+teilen|v|tell, inform
beschreiben|v|describe
informieren|v|inform
an+kündigen|v|announce
warnen|v|warn
raten|v|advise; guess
empfehlen|v|recommend
erwähnen|v|mention
hinzu+fügen|v|add
vergleichen|v|compare
beweisen|v|prove
prüfen|v|check, test
rechnen|v|calculate
messen|v|measure
`);
  LISTS.push(`
@3
Gesellschaft|f-en|society
Kultur|f-en|culture
Tradition|f-en|tradition
Brauch|m¨e|custom
Gewohnheit|f-en|habit
Feier|f-n|celebration
Religion|f-en|religion
Politik|f0|politics
Regierung|f-en|government
Gesetz|n-e|law
Recht|n-e|right; law
Freiheit|f-en|freedom|+
Gerechtigkeit|f0|justice
Gleichheit|f0|equality
Wahl|f-en|election; choice
Bürger|m-|citizen|per f:Bürgerin
Gemeinschaft|f-en|community
Bevölkerung|f-en|population
Umwelt|f0|the environment
Verschmutzung|f-en|pollution|-
Energie|f-n|energy
Planet|m-en|planet|wk
Gefahr|f-en|danger|-
Risiko|n:Risiken|risk
Sicherheit|f-en|safety, security
Krankheit|f-en|illness|-
Behandlung|f-en|treatment
Diät|f-en|diet
Übung|f-en|exercise, practice
Stress|m0|stress|-
Pause|f-n|break
Erfolg|m-e|success|+
Misserfolg|m-e|failure|-
Ziel|n-e|goal, aim
Mühe|f-n|effort
Chance|f-n|chance|+
Gelegenheit|f-en|opportunity|+
Erfahrung|f-en|experience
Wissen|n0|knowledge
Fähigkeit|f-en|ability, skill
Talent|n-e|talent
Charakter|m-e|character
Persönlichkeit|f-en|personality
Meinung|f-en|opinion
Rat|m0|advice
Ratschlag|m¨e|piece of advice
Entscheidung|f-en|decision
Lösung|f-en|solution
Zweifel|m-|doubt
Ursache|f-n|cause
Folge|f-n|consequence
Ergebnis|n:Ergebnisse|result
Wirkung|f-en|effect
Unterschied|m-e|difference
Vorteil|m-e|advantage|+
Nachteil|m-e|disadvantage|-
Beziehung|f-en|relationship
Freundschaft|f-en|friendship|+
Vertrauen|n0|trust
Respekt|m0|respect
Unterstützung|f-en|support
Streit|m0|argument, fight|-
Konflikt|m-e|conflict|-
Erinnerung|f-en|memory
Gedächtnis|n:Gedächtnisse|memory (the ability)
Kindheit|f0|childhood
Jugend|f0|youth
Jugendliche|m-n|teenager|per wk
Generation|f-en|generation
Sinn|m-e|sense, meaning
Bedeutung|f-en|meaning
Geist|m-er|mind; ghost
Seele|f-n|soul
Glaube|m-n|faith, belief|wk gen:Glaubens
Hoffnung|f-en|hope|+
Wunsch|m¨e|wish
Albtraum|m¨e|nightmare|-
Geheimnis|n:Geheimnisse|secret
Rätsel|n-|riddle, mystery
Abenteuer|n-|adventure
Landschaft|f-en|landscape
Aussicht|f-en|view
Stimmung|f-en|mood, atmosphere
Lärm|m0|noise
Geräusch|n-e|sound, noise
Ton|m¨e|sound, tone
Stimme|f-n|voice
Schrei|m-e|scream
Echo|n-s|echo
Licht|n-er|light
Schatten|m-|shadow
Dunkelheit|f0|darkness|-
Schönheit|f-en|beauty|+
Kraft|f¨e|strength, power
Macht|f¨e|power
Zauber|m0|magic, spell
Sage|f-n|legend
Schatz|m¨e|treasure
Tagebuch|n¨er|diary
@3 work,money
Wirtschaft|f0|economy
Industrie|f-n|industry
Steuer|f-n|tax
Schulden|pl|debt
Kredit|m-e|loan
Gehalt|n¨er|salary
Vorstellungsgespräch|n-e|job interview
Lebenslauf|m¨e|CV, résumé
Stelle|f-n|job, position; place
Vertrag|m¨e|contract
Schicht|f-en|shift
@3
verantwortlich|a|responsible
ehrlich|a|honest|+
aufrichtig|a|sincere|+
gerecht|a|fair|+
ungerecht|a|unfair|-
unabhängig|a|independent
sozial|a|social
kulturell|a|cultural|noCmp
politisch|a|political|noCmp
wirtschaftlich|a|economic|noCmp
natürlich#adj|a|natural|noCmp
künstlich|a|artificial|noCmp
umweltfreundlich|a|eco-friendly
international|a|international|noCmp
aktuell|a|current
traditionell|a|traditional
gemeinsam|a|common, shared
häufig|a|frequent
ernsthaft|a|serious
riesig|a|huge
winzig|a|tiny
hauptsächlich|adv|mainly
einfach|a|simple, easy
kompliziert|a|complicated
verwirrt|a|confused|noCmp
klar|a|clear|+
offensichtlich|a|obvious
wahrscheinlich|adv|probably
fähig|a|capable
vorbereitet|a|prepared|noCmp
verfügbar|a|available
abwesend|a|absent|noCmp
zufrieden|a|satisfied|+
enttäuscht|a|disappointed|noCmp -
dankbar|a|grateful|+
beeindruckt|a|impressed|noCmp
gestresst|a|stressed|noCmp -
entspannt|a|relaxed|+
erschöpft|a|exhausted|noCmp
lebendig|a|alive, lively
tot|a|dead|noCmp
wach|a|awake
geheimnisvoll|a|mysterious
magisch|a|magic, magical|noCmp
@3
wirklich|adv|really
völlig|adv|completely
ziemlich|adv|quite, fairly
total|adv|totally
sicherlich|adv|surely
schließlich|adv|finally, after all|adverbial
genau|adv|exactly
meistens|adv|mostly, usually
neulich|adv|recently|adverbial
zurzeit|adv|currently|adverbial
glücklicherweise|adv|fortunately|adverbial
im Allgemeinen|phrase|in general
nach und nach|phrase|little by little
ohne Zweifel|phrase|without a doubt
mindestens|adv|at least
immer mehr|phrase|more and more
Lust haben|phrase|feel like (doing)
Recht haben|phrase|be right
Angst haben|phrase|be scared
Spaß machen|phrase|be fun
Bescheid sagen|phrase|let (someone) know
@3 home,food,health
Werkzeug|n-e|tool
Nagel|m¨|nail
Schraube|f-n|screw
Besen|m-|broom
Eimer|m-|bucket
Vase|f-n|vase
Schublade|f-n|drawer
Glühbirne|f-n|light bulb
Steckdose|f-n|socket
Kamin|m-e|fireplace
Balkon|m-e|balcony
Hof|m¨e|yard, courtyard
Garage|f-n|garage
Keller|m-|basement, cellar
Dachboden|m¨|attic
Miete|f-n|rent
Umzug|m¨e|move (house)
Geschmack|m¨e|taste
Geruch|m¨e|smell
Zutat|f-en|ingredient
Scheibe|f-n|slice
Soße|f-n|sauce
Trinkgeld|n-er|tip (money)
Imbiss|m-e|snack; snack bar
Gehirn|n-e|brain
Lunge|f-n|lung
Muskel|m-n|muscle
Stirn|f-en|forehead
Wange|f-n|cheek
Bart|m¨e|beard
Ellbogen|m-|elbow
Kopfschmerzen|pl|headache
Impfung|f-en|vaccination
Müdigkeit|f0|tiredness
Träne|f-n|tear (crying)
@3 nature,animal,town
Wasserfall|m¨e|waterfall|place
Pfütze|f-n|puddle
Ufer|n-|shore, bank|place
Gletscher|m-|glacier|place
Sumpf|m¨e|swamp|place
Frost|m¨e|frost
Hagel|m0|hail
Sonnenaufgang|m¨e|sunrise
Sonnenuntergang|m¨e|sunset
Erdbeben|n-|earthquake
Eichhörnchen|n-|squirrel
Reh|n-e|deer
Igel|m-|hedgehog
Robbe|f-n|seal
Pinguin|m-e|penguin
Krebs|m-e|crab; cancer
Taube|f-n|pigeon, dove
Möwe|f-n|seagull
Schwan|m¨e|swan
Ampel|f-n|traffic light
Bürgersteig|m-e|sidewalk
Haltestelle|f-n|stop (bus, tram)|place
Verkehr|m0|traffic
Stau|m-s|traffic jam
Rezeption|f-en|reception
Gepäck|n0|luggage
Reservierung|f-en|reservation
Führer|m-|guide|per f:Führerin
@3 media,tech,language
Artikel|m-|article
Zeitschrift|f-en|magazine
Werbung|f-en|advertising
Nachrichten|pl|the news
Sender|m-|channel, station
Moderator|m-en|presenter|per f:Moderatorin
Hörer|m-|listener; receiver|per f:Hörerin
Leser|m-|reader|per f:Leserin
Autor|m-en|author|per f:Autorin
Figur|f-en|character (in a story); figure
Kapitel|n-|chapter
Titel|m-|title
Gespräch|n-e|conversation
Rede|f-n|speech
Akzent|m-e|accent
Übersetzung|f-en|translation
@4
Entwicklung|f-en|development
Forschung|f-en|research
Perspektive|f-n|perspective
Gedanke|m-n|thought|wk gen:Gedankens
Argument|n-e|argument
Hypothese|f-n|hypothesis
Verantwortung|f-en|responsibility
Ungleichheit|f-en|inequality
Armut|f0|poverty|-
Reichtum|m¨er|wealth
Wohlstand|m0|prosperity|+
Krise|f-n|crisis|-
Klimawandel|m0|climate change
dennoch|adv|nevertheless|adverbial
folglich|adv|consequently|adverbial
kurz gesagt|phrase|in short
vorausgesetzt|phrase|provided that
es sei denn|phrase|unless
behandeln|v|treat; deal with
betonen|v|stress, emphasize
fördern|v|promote
entstehen|v.s|arise
bewältigen|v|cope with
übernehmen|v|take over, take on
`);
  LISTS.push(`
@2
recht|a|right (recht haben: be right); quite|noCmp
schuld|a|to blame (schuld sein)|noDecl noCmp
auf+passen|v|pay attention, watch out
aus+ruhen|v|(sich) rest
aus+füllen|v|fill in
ein+schalten|v|switch on
aus+schalten|v|switch off
ab+waschen|v|wash up
an+melden|v|register, sign up
auf+schreiben|v|write down
ein+packen|v|pack
aus+packen|v|unpack
zurück+rufen|v|call back
zusammen+arbeiten|v|work together
los+gehen|v.s|set off; start
mit+nehmen|v|take along
weg+werfen|v|throw away
weiter+machen|v|carry on
vor+lesen|v|read aloud
her+kommen|v.s|come here
hin+gehen|v.s|go there
fest+halten|v|hold on to
bitten|v|ask (for), request
fehlen|v|be missing
folgen|v.s|follow
fürchten|v|fear
grillen|v|grill, barbecue
holen|v|fetch, get
kümmern|v|(sich) take care of
lassen|v|let; leave
lösen|v|solve
merken|v|notice; (sich) remember
nennen|v|name, call
packen|v|pack; grab
parken|v|park
passen|v|fit, suit
reichen|v|be enough; pass
spülen|v|rinse, wash up
stören|v|disturb
tauschen|v|swap
träumen|v|dream
trennen|v|separate
verabreden|v|(sich) arrange to meet
verlassen|v|leave
verpassen|v|miss (a bus)
verstecken|v|hide
wechseln|v|change
wecken|v|wake (someone) up
wünschen|v|wish
zählen|v|count
graben|v|dig
mahlen|v|grind
rudern|v.b|row
nähen|v|sew
stricken|v|knit
kehren|v|sweep
@2
Ahnung|f-en|idea, clue (keine Ahnung: no idea)
Ärger|m0|trouble, anger
Aufgabe|f-n|task, exercise
Ausweis|m-e|ID card
Bahn|f-en|railway, train
Besuch|m-e|visit; visitors
Bewerbung|f-en|application
Blick|m-e|look, glance; view
Dank|m0|thanks
Dusche|f-n|shower
Einladung|f-en|invitation
Eintritt|m-e|admission, entry
Entschuldigung|f-en|excuse me; apology
Fahrt|f-en|ride, journey
Fähre|f-n|ferry|transport
Fahrplan|m¨e|timetable, schedule
Anlegestelle|f-n|landing stage, dock|place
Abfahrt|f-en|departure
Ankunft|f¨e|arrival
Bahnsteig|m-e|platform
Gleis|n-e|track, platform
Fall|m¨e|case; fall
Feuerwehr|f-en|fire department
Flur|m-e|hallway
Formular|n-e|form
Freizeit|f0|free time
Führerschein|m-e|driver’s license
Gebäude|n-|building|place
Gegend|f-en|area, region|place
Gericht|n-e|dish; court
Getränk|n-e|drink
Gewicht|n-e|weight
Größe|f-n|size; height
Gruß|m¨e|greeting
Halle|f-n|hall
Heimat|f-en|home, homeland
Heizung|f-en|heating
Hochzeit|f-en|wedding
Höhe|f-n|height
Kantine|f-n|canteen
Knopf|m¨e|button
Konto|n:Konten|bank account
Kopie|f-n|copy
Kreis|m-e|circle
Kreuzung|f-en|crossroads|place
Kurs|m-e|course
Lebensmittel|pl|groceries, food
Lohn|m¨e|wage
Lust|f0|desire (Lust haben: feel like)
Mahlzeit|f-en|meal
Mitglied|n-er|member
Mode|f-n|fashion
Nähe|f0|nearness (in der Nähe: nearby)
Notfall|m¨e|emergency
Ordnung|f-en|order (in Ordnung: OK)
Pech|n0|bad luck|-
Pflicht|f-en|duty
Praxis|f:Praxen|practice (doctor’s office)|place
Prozent|n-e|percent
Rad|n¨er|wheel; bike
Rand|m¨er|edge
Raum|m¨e|room, space
Rest|m-e|rest, remainder
Ruhe|f0|peace, quiet|+
Schild|n-er|sign
Schloss|n¨er|castle; lock|place
Schluss|m¨e|end
Schmuck|m0|jewelry
Schritt|m-e|step
Schuld|f-en|guilt, fault
Schwierigkeit|f-en|difficulty
Sorge|f-n|worry|-
Spaß|m¨e|fun|+
Stockwerk|n-e|floor (story)
Strom|m¨e|electricity; current
Tankstelle|f-n|gas station|place
Team|n-s|team
Thema|n:Themen|topic
Tor|n-e|gate; goal
Treffen|n-|meeting
Treffpunkt|m-e|meeting point
Unfall|m¨e|accident|-
Unterschrift|f-en|signature
Verabredung|f-en|date, appointment
Verein|m-e|club
Verspätung|f-en|delay
Vorname|m-n|first name|wk gen:Vornamens
Vorsicht|f0|caution (Vorsicht!: careful!)
Wagen|m-|car; cart
Wärme|f0|warmth
Wäsche|f0|laundry
Wert|m-e|value
Zettel|m-|note, slip of paper
Zeugnis|n:Zeugnisse|report card; certificate
Zweck|m-e|purpose
Dose|f-n|tin, can
Reim|m-e|rhyme
Schädel|m-|skull
Bergwerk|n-e|mine|place
Bergmann|m:Bergleute|miner|per
Lagerfeuer|n-|campfire
Zelt|n-e|tent
Hütte|f-n|hut, cabin|place
Schmiede|f-n|forge|place
Werkstatt|f¨en|workshop|place
Weizen|m0|wheat
Teig|m-e|dough
Sack|m¨e|sack
Müller|m-|miller|per f:Müllerin
Schaufel|f-n|shovel
Kohle|f-n|coal
Eisen|n0|iron
Silber|n0|silver
Staub|m0|dust
Tunnel|m-|tunnel|place
@2
angenehm|a|pleasant|+
arbeitslos|a|unemployed|noCmp
ausgezeichnet|a|excellent|noCmp +
bekannt|a|known, famous
besetzt|a|occupied, taken|noCmp
bunt|a|colorful
direkt|a|direct
doppelt|a|double|noCmp
eilig|a|in a hurry, urgent
einverstanden|a|in agreement|noDecl noCmp
fest|a|firm, solid
fit|a|fit|noDecl
fremd|a|foreign, strange
früh|a|early
geboren|a|born|noCmp
gemütlich|a|cozy|+
genug|adv|enough
gewöhnlich|a|usual, ordinary
günstig|a|cheap, good value
herzlich|a|warm, cordial|+
hungrig|a|hungry
durstig|a|thirsty
intelligent|a|intelligent|+
täglich|a|daily|noCmp
kaputt|a|broken|noCmp
kostenlos|a|free (of charge)|noCmp
kühl|a|cool
ledig|a|single (not married)|noCmp
verheiratet|a|married|noCmp
nah|a¨|near|cmp:näher sup:nächst
neugierig|a|curious
peinlich|a|embarrassing|-
pünktlich|a|on time
satt|a|full (not hungry)
sauer|a|sour; annoyed
schlimm|a|bad|-
spannend|a|exciting|+
spät|a|late
sportlich|a|sporty
sympathisch|a|likable|+
typisch|a|typical
verletzt|a|hurt, injured|noCmp
verrückt|a|crazy
vorsichtig|a|careful
wahr|a|true
weit|a|far, wide
wild|a|wild
wunderschön|a|beautiful|noCmp +
zufällig|adv|by chance
`);
  // (wave 2, 2026-11-14: words the German talk and reading content needs; the de content helper)
  LISTS.push(`
@1
so|adv|so, like this; (so … wie) as … as
viele|det:viele=p.nom,viele=p.acc,vielen=p.dat,vieler=p.gen|many|quant
ander|a|other|noCmp
bisschen|pron|bit (ein bisschen: a little)
ein bisschen|phrase|a little, a bit
zurück|adv|back
weg|adv|away, gone
gerade|adv|just, right now
selbst|adv|(my)self, (your)self; even
bestimmt|adv|surely, I bet|adverbial
letzt|a|last|noCmp
reden|v|talk, chat
bleiben|v.s|stay, remain
spazieren|v.s|stroll (spazieren gehen: go for a walk)
prima|a|great|noDecl noCmp +
Stand|m¨e|stall, stand
@2
einige|det:einige=p.nom,einige=p.acc,einigen=p.dat,einiger=p.gen|some, a few|quant
mehrere|det:mehrere=p.nom,mehrere=p.acc,mehreren=p.dat,mehrerer=p.gen|several|quant
echt|a|real; really|noCmp
eben|adv|just; simply
vorbei|adv|over, past
her|adv|here (toward the speaker); ago (lange her)
hin|adv|there (away from the speaker)
sogar|adv|even
ungefähr|adv|about, roughly
hoffentlich|adv|hopefully|adverbial
selten|adv|rarely|adverbial
nachts|adv|at night
vorgestern|adv|the day before yesterday|time:past
übermorgen|adv|the day after tomorrow|time:future
zuletzt|adv|last, most recently|adverbial
vorher|adv|before, beforehand|adverbial
nachher|adv|afterwards, later|adverbial
übrigens|adv|by the way|adverbial
als Erstes|phrase|first of all
Glück auf|phrase|good luck! (the miners’ greeting)
blöd|a|stupid, annoying|-
nervig|a|annoying|-
streng|a|strict
herrlich|a|glorious, lovely|+
persönlich|a|personal
knusprig|a|crispy|+
matschig|a|mushy, soggy|-
männlich|a|masculine, male|noCmp
weiblich|a|feminine, female|noCmp
schlüpfen|v.s|slip; hatch (aus dem Ei schlüpfen)
auf+heben|v|keep; pick up
bei+bringen|v|teach (someone something)
weg+laufen|v.s|run away
irren|v|(sich) be wrong
jagen|v|hunt, chase
bellen|v|bark
krähen|v|crow
miauen|v|meow
zittern|v|tremble
kratzen|v|scratch
beißen|v|bite
gießen|v|pour; water (plants); cast (metal)
ernten|v|harvest
mähen|v|mow
pflanzen|v|plant
@2 food,drink
Kakao|m-s|cocoa, hot chocolate
Schorle|f-n|spritzer (Apfelschorle: apple juice with sparkling water)
Sprudel|m-|sparkling water
@2 food
Pflaume|f-n|plum
Mohn|m0|poppy seed
Lauge|f-n|lye (Laugenbrezel: a lye pretzel)
Streusel|m-|crumble topping (Streuselkuchen)
Mus|n-e|purée (Apfelmus: apple sauce)
Kartoffelpuffer|m-|potato pancake
Picknick|n-s|picnic
Erbse|f-n|pea
Bohne|f-n|bean
Radieschen|n-|radish
Kürbis|m:Kürbisse|pumpkin
Tüte|f-n|bag (paper or plastic)
Sahne|f0|cream (whipped cream)
Hefe|f0|yeast
@2 hobby,sport
Training|n-s|training, practice
@2 work,people
Meister|m-|master (craftsman), champion|per f:Meisterin
Buchbinder|m-|bookbinder|per
@2 people,family
Einzelkind|n-er|only child|per
Liebling|m-e|darling; favorite (Lieblingsbuch: favorite book)
@2 people
Räuber|m-|robber|per
Dieb|m-e|thief|per
Musikant|m-en|musician (old word)|per wk
Profi|m-s|pro, professional|per
Glöckner|m-|bell ringer|per
@2 place,nature
Teich|m-e|pond
Alpen|pl|the Alps
Ostsee|f0|the Baltic Sea
Nordsee|f0|the North Sea
Ausland|n0|abroad, foreign countries
Hauptstadt|f¨e|capital city
Stollen|m-|tunnel (in a mine); Christmas stollen
Rasen|m-|lawn
Unkraut|n0|weeds
Beet|n-e|flower bed, vegetable patch
Schrebergarten|m¨|allotment garden
Laube|f-n|summer house (in a garden)
@2 animal
Hahn|m¨e|rooster
Nest|n-er|nest
Drache|m-n|dragon|wk
@2 hobby,music,language
Krimi|m-s|crime novel, crime show
Comic|m-s|comic
Sachbuch|n¨er|non-fiction book
Chor|m¨e|choir
Aussprache|f-n|pronunciation
Studium|n:Studien|studies (at university)
Chronik|f-en|chronicle
@2
Korb|m¨e|basket
Kanne|f-n|pot, can (Gießkanne: watering can)
Schirm|m-e|umbrella
Krach|m0|racket, din
Gespenst|n-er|ghost
Hexe|f-n|witch
Glut|f-en|embers
Funke|m-n|spark|wk
Bescheid|m0|word (Bescheid sagen: let someone know)
Wunder|n-|miracle, wonder|+
Ernte|f-n|harvest
Rente|f-n|pension (in Rente gehen: retire)
Regel|f-n|rule
Messe|f-n|trade fair (Buchmesse: book fair)
Herzchen|n-|little heart|+
Kreuzworträtsel|n-|crossword
Laune|f-n|mood (gute Laune: a good mood)
Ausrede|f-n|excuse
Nachbarschaft|f-en|neighborhood
Blech|n-e|baking tray; sheet metal
Geduld|f0|patience
einmal|adv|once; (noch einmal) again
stundenlang|adv|for hours
auswendig|adv|by heart
schwierig|a|difficult
fressen|v|eat (of animals)
verjagen|v|chase away
zurück+denken|v|think back
wieder+kommen|v.s|come back
weg+fliegen|v.s|fly away
auf+geben|v|give up
spenden|v|donate
ersetzen|v|replace
erleben|v|experience
erwarten|v|expect
tippen|v|type; tap
decken|v|cover (den Tisch decken: set the table)
kneten|v|knead
@1
willkommen|a|welcome|noDecl noCmp +
darum|adv|that’s why|adverbial
dabei|adv|with it; at the same time
darauf|adv|on it; after that
dazu|adv|with it, as well
egal|a|all the same (das ist egal: it doesn’t matter)|noDecl noCmp
gar|adv|at all (gar nicht: not at all)
ach|int|oh, ah
hm|int|hm
rein|adv|in (Komm rein!: come in!)
herein|adv|in (Herein!: come in!)
hinein|adv|in, into
drin|adv|inside, in it
drüben|adv|over there
erst#adv|adv|only, not until; first
erst|a|first|noCmp
fürs|prep:fürs=n.s.acc|for the (für + das)|art
jemanden|pron|someone (jemand, accusative)
niemanden|pron|nobody (niemand, accusative)|neg
scheinen|v|shine; seem
leuchten|v|shine, glow
drehen|v|turn
dauern|v|last, take (time)
@2
nebenan|adv|next door
dreimal|adv|three times
live|adv|live (on the radio)
irgendjemand|pron|somebody, anybody
zugleich|adv|at the same time
Kikeriki|int|cock-a-doodle-doo
im Dunkeln|phrase|in the dark
rund|a|round
flach|a|flat
zurückhaltend|a|reserved|noCmp
flauschig|a|fluffy|+
flüssig|a|liquid|noCmp
Tuch|n¨er|cloth, tea towel
Sessel|m-|armchair
Statue|f-n|statue
Schale|f-n|shell; bowl; peel
Kern|m-e|core; seed
Zeug|n0|stuff
Traurigkeit|f-en|sadness|-
Einzelheit|f-en|detail
Kupfer|n0|copper
Zinn|n0|tin
Amboss|m:Ambosse|anvil
klingen|v|sound, ring
an+fassen|v|touch
an+bauen|v|grow (plants)
donnern|v|thunder
ein+sammeln|v|collect, gather up
entdecken|v|discover
begrüßen|v|greet, welcome
drücken|v|press, squeeze
aus+drücken|v|squeeze out
wieder+sehen|v|see again
verraten|v|give away (a secret)
treten|v|kick; step
reiben|v|grate; rub
braten|v|fry, roast
mischen|v|mix
proben|v|rehearse
verbinden|v|connect, bring together
schmelzen|v.b|melt
fließen|v.s|flow
ab+kühlen|v.b|cool down
behalten|v|keep
vergehen|v.s|pass (time)
beschließen|v|decide
ertragen|v|bear, stand
nach+singen|v|sing back, copy (a song)
klappern|v|clatter
hinauf+steigen|v.s|climb up
@2 work,people
Fischer|m-|fisherman|per f:Fischerin
Händler|m-|trader, seller|per f:Händlerin
Bibliothekar|m-e|librarian|per f:Bibliothekarin
Anrufer|m-|caller|per f:Anruferin
Vorleser|m-|reader (someone who reads aloud)|per f:Vorleserin
@2 place
Mine|f-n|mine
@2 food
Quark|m0|quark (a soft fresh cheese)
@1
oh|int|oh
aha|int|I see, aha
ha|int|ha
oje|int|oh dear
je|adv|ever; each (oh je: oh dear)
mmh|int|mmm|alt:mhm
wow|int|wow
pssst|int|shh|alt:psst,pst
fassen|v|grasp, hold
setzen|v|put; (sich) sit down
ändern|v|change
sortieren|v|sort
plaudern|v|chat
genießen|v|enjoy
basteln|v|make (crafts), tinker
beides|pron|both (things)
allem|pron|everything (vor allem: above all)
dafür|adv|for it; in return
darüber|adv|about it; over it
bloß|adv|just; (warning) whatever you do
dran|adv|on it (du bist dran: it’s your turn)
drauf|adv|on it, on top
genauso|adv|just the same
zwar|adv|admittedly (zwar … aber: it’s true … but)
weh|adv|sore (weh tun: hurt)
solche|det:solche=p.nom,solche=p.acc,solchen=p.dat,solcher=p.gen|such|quant
zweihundert|num|two hundred|n:200
dreihundert|num|three hundred|n:300
@2
unglaublich|a|unbelievable|+
gemein|a|mean
vernünftig|a|sensible
unbedingt|adv|absolutely, definitely
jedenfalls|adv|anyway, at any rate|adverbial
literweise|adv|by the liter
am meisten|phrase|the most
aus+schlafen|v|sleep in, have a lie-in
Nachfrage|f-n|inquiry (danke der Nachfrage: thanks for asking)
Hauptsache|f-n|main thing (Hauptsache, …: what matters is …)
Leseratte|f-n|bookworm (literally: reading rat)
Weihnachtsmarkt|m¨e|Christmas market
Weihnachten|n-|Christmas
@1 time
morgens|adv|in the morning
abends|adv|in the evening
mittags|adv|at midday
nachmittags|adv|in the afternoon
vormittags|adv|in the morning (before noon)
@1
ab|prep|from (ab morgen: from tomorrow on)|case:dat
zweimal|adv|twice
Lager|n-|camp; storeroom|place
Trainer|m-|coach|per f:Trainerin
Bewegung|f-en|movement, exercise
@2
dreitausend|num|three thousand|n:3000
abgemacht|phrase|it’s a deal
ahoi|int|ahoy
autsch|int|ouch
worauf|adv|on what (worauf bist du stolz?: what are you proud of?)|q
hierher|adv|(to) here
unterwegs|adv|on the way, out and about
umsonst|adv|free (of charge); in vain
wochenlang|adv|for weeks
dasselbe|pron|the same (thing)
Worte|pl|words (of a song, a speech)
regelmäßig|a|regular
passend|a|fitting (es passend haben: have the exact money)|noCmp
klassisch|a|classic
glatt|a|smooth; (glatt vergessen) clean forget
schief|a|crooked, wonky
verschieden|a|different
leuchtend|a|glowing, bright|noCmp
Kniebeuge|f-n|squat (exercise)
Liegestütz|m-e|push-up
Gummi|m-s|rubber (Gummiball: rubber ball)
Gips|m-e|plaster cast
Nachsicht|f0|leniency (Vorsicht ist besser als Nachsicht: better safe than sorry)
Wechselgeld|n0|change (money)
Kenner|m-|connoisseur, expert|per f:Kennerin
Marmor|m-e|marble (Marmorkuchen: marble cake)
Zimt|m0|cinnamon
Spezialbrot|n-e|special bread
Backstube|f-n|bakehouse
Weltuntergang|m¨e|end of the world
Wiege|f-n|cradle
Wecker|m-|alarm clock
Helm|m-e|helmet
Grube|f-n|pit (Grubenlampe: miner’s lamp)
Käfig|m-e|cage
Marathon|m-s|marathon
Finale|n-|final (match)
Turnier|n-e|tournament
Meter|m-|meter
Sorte|f-n|kind, sort
Schiedsrichter|m-|referee|per f:Schiedsrichterin
ah|int|ah, oh
davon|adv|of it, from it
Urkunde|f-n|certificate
Sieg|m-e|victory
Torte|f-n|gateau, layer cake
Café|n-s|café
Melodie|f-n|melody, tune
Blase|f-n|bubble; blister
Roggen|m0|rye
überlegen|v|(sich) think over
flicken|v|mend
summen|v|hum
gebrauchen|v|use (gut gebrauchen können: could use)
verlaufen|v|(sich) get lost
verbrennen|v|burn
bestehen|v|pass (an exam); exist
besteigen|v|climb (a mountain)
atmen|v|breathe
schief+gehen|v.s|go wrong
vor+singen|v|sing (to someone)
mit+singen|v|sing along
zurück+rudern|v.b|row back
@3
Lehm|m0|loam, clay
Form|f-en|form, shape; mold
Metall|n-e|metal
Bronze|f-n|bronze
Inschrift|f-en|inscription
Spruch|m¨e|saying
`);
  // the dictionary helper (2026-11-15): two everyday verbs the checks' tests use
  LISTS.push(`
@2
stimmen|v|be right (das stimmt); vote
läuten|v|ring (a bell)
`);
  // DX-B2 (2026-11-26, the B2 dictionary helper): game/words_needed.txt's de words (A2's letters and debates), then about
  // 1,000 B2 words by topic plus the B1 words that were missing. Standard German.
  LISTS.push(`
@2
huhu|int|hoo-hoo (an owl’s call); yoo-hoo!|alt:huhuu
auf+wachen|v.s|wake up
@4
wachen|v|be awake; keep watch
@3
führen|v|lead; run (a business); guide
@2
@2 food
Pfannkuchen|m-|pancake
@3
kriechen|v|crawl
wovor|adv|of what, from what (wovor hast du Angst?)|q
Heimweg|m-e|the way home
Brautpaar|n-e|the bride and groom
darunter|adv|under it; among them
selbstständig|a|independent; self-employed|alt:selbständig
Zuhause|n0|home (das Zuhause)
darin|adv|in it
daran|adv|on it, of it (sich daran gewöhnen: get used to it)
unglücklich|a|unhappy|-
unnötig|a|unnecessary
genau#adj|a|exact, precise; close (genauer: more closely)
kleben|v|stick, glue
gespannt|a|eager, curious (gespannt sein auf: can’t wait for)
Advent|m0|Advent
Adventszeit|f0|the Advent season
Hunderte|pl|hundreds (Hunderte von …: hundreds of …)
Uniform|f-en|uniform
heimlich|a|secret; secretly
an+probieren|v|try on (clothes)
weiter+geben|v|pass on
begegnen|v.s|meet, run into (+ dative)
Parade|f-n|parade
sowieso|adv|anyway
@3 place
Erzgebirge|n0|the Ore Mountains (in Saxony)
@3 school,language
Konjunktiv|m-e|the subjunctive (grammar: Konjunktiv II)
@3 work,people
Lokführer|m-|train driver|per f:Lokführerin
@4 art,people
Bildhauer|m-|sculptor|per f:Bildhauerin
@4 animal
Zecke|f-n|tick (the insect)
@4
dadurch|adv|that way, thereby; through it
weiter+führen|v|keep (a business) going, carry on
nachdenklich|a|thoughtful
hin+schauen|v|look (closely), take a look
begründen|v|give reasons for, justify
Bergparade|f-n|miners’ parade (in the Ore Mountains at Advent)
vorneweg|adv|out in front, leading
marschieren|v.b|march
Botschaft|f-en|message; embassy
Empfang|m¨e|reception, welcome
stumm|a|mute, silent
`);
  const spec = {
    lang: 'de', lists: LISTS, entry, forms, expand: expandAll, prior, score, capNouns: true, callVerb: 'heißen',
    // a capitalized word the list doesn't know is a noun we lack, unless it reads like a place or a person («aus Hamburg», «und Anna»)
    isName: (w, W) => { const p = W[w.i - 1]; return !!p && !p.punct && /^(in|aus|nach|von|bei|und|heisst|heisse|mit)$/.test(key(p.t)) && !/(ung|heit|keit|schaft|chen|lein|tion|ismus)$/.test(w.t); },
    context, summary, check, describe, enGloss, inflect, numbers,
    connectors: ['weil', 'denn', 'da', 'aber', 'sondern', 'obwohl', 'trotzdem', 'jedoch', 'und', 'oder', 'außerdem', 'auch', 'zum Beispiel',
      'deshalb', 'deswegen', 'also', 'dann', 'danach', 'zuerst', 'später', 'endlich', 'wenn', 'als', 'während', 'bevor', 'nachdem', 'bis', 'sobald',
      'falls', 'damit', 'ich finde', 'ich glaube', 'meiner Meinung nach', 'dass'],
    connectorKinds: { weil: 'reason', denn: 'reason', da: 'reason', aber: 'contrast', sondern: 'contrast', obwohl: 'contrast', trotzdem: 'contrast',
      jedoch: 'contrast', und: 'add', oder: 'add', 'außerdem': 'add', auch: 'add', 'zum Beispiel': 'add', deshalb: 'result', deswegen: 'result',
      also: 'result', dann: 'time', danach: 'time', zuerst: 'time', 'später': 'time', endlich: 'time', wenn: 'cond', als: 'time', 'während': 'time',
      bevor: 'time', nachdem: 'time', bis: 'time', sobald: 'time', falls: 'cond', damit: 'reason', 'ich finde': 'opinion', 'ich glaube': 'opinion',
      'meiner Meinung nach': 'opinion', dass: 'add' },
    weakConnectors: ['und', 'oder'],
    fillers: ['also', 'na ja', 'naja', 'äh', 'ähm', 'halt', 'eben', 'mal', 'sozusagen', 'irgendwie', 'tja', 'weißt du', 'ne', 'oder'],
  };
  DICT.register('de', () => LATIN.build(spec));
  window.DE_DICT = { conj, conjSep, nounForms, adjForms, uml, deNum, STRONG, clauseOf };
})();
